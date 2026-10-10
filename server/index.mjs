import { quoteTargetAds, buildPricingSnapshot, SVYAZKA_SERVICES } from './generated/services/targetAdsPricingService.js';
import { lookup } from './lookup.mjs';
import './storage.mjs';
import { createServer } from 'node:http';
import { createReadStream, existsSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { context, db, collection, saveCollection, profileFor, saveProfileFor, migrateGuest } from './storage.mjs';
import { authorize, fail, find, orgAccess, publicOrganization, applicationAccess } from './policy.mjs';
import * as core from './generated/repositories/mockRepositories.js';
import * as feature from './generated/repositories/featureRepositories.js';
import { journeyRepository } from './generated/repositories/journeyRepository.js';

const repositories = Object.fromEntries(Object.entries({ ...core, ...feature, journeyRepository }).filter(([k]) => k.endsWith('Repository')).map(([k,v]) => [k.replace(/Repository$/, ''), v]));
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.PORT || 3001);
const lifetime = 7 * 86400000;
const digest = token => createHash('sha256').update(token).digest('hex');
const passwordHash = password => { const salt = randomBytes(16).toString('hex'); return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`; };
const passwordMatches = (password, value) => { const [salt, hash] = value.split(':'); return timingSafeEqual(Buffer.from(hash,'hex'), scryptSync(password,salt,64)); };
const rolesFor = id => collection('svyazka_dev_roles').filter(r => r.accountId === id).map(r => r.role);
const normalizeEmail = input => String(input || '').trim().toLowerCase();
let queue = Promise.resolve();
const serial = task => { const next = queue.then(task); queue = next.catch(() => {}); return next; };
const rates = new Map();
function rate(req, key, limit = 90) {
  const ip = req.socket.remoteAddress || 'unknown';
  const id = `${ip}:${key}`;
  const now = Date.now();
  let value = rates.get(id);
  if (!value || now - value.time > 60000) value = { time: now, count: 0 };
  rates.set(id, value);
  if (++value.count > limit) fail('Слишком много запросов. Повторите через минуту.', 429);
  if (rates.size > 10000) for (const [k,v] of rates) if (now-v.time > 60000) rates.delete(k);
}
function cookie(req, name) { return req.headers.cookie?.split(';').map(v => v.trim()).find(v => v.startsWith(`${name}=`))?.slice(name.length+1) || ''; }
function setCookie(res, name, value, age) {
  const secure = process.env.COOKIE_SECURE === 'true' || process.env.PUBLIC_ORIGIN?.startsWith('https://');
  const current = res.getHeader('Set-Cookie') || [];
  res.setHeader('Set-Cookie', [...current, `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${age}${secure ? '; Secure' : ''}`]);
}
function guestScope(req, res) {
  let guest = cookie(req,'sv_guest');
  if (!/^[a-f0-9]{48}$/.test(guest)) { guest = randomBytes(24).toString('hex'); setCookie(res,'sv_guest',guest,86400*30); }
  return `guest:${guest}`;
}
function session(req) {
  const token = cookie(req,'sv_session');
  if (!/^[a-f0-9]{64}$/.test(token)) return null;
  const value = db.prepare('SELECT account_id,expires_at FROM sessions WHERE token_hash=? AND expires_at>?').get(digest(token),Date.now());
  if (!value) return null;
  const account = find('svyazka_dev_accounts',value.account_id);
  return account ? { account, roles: rolesFor(account.id), expiresAt: value.expires_at, scope: account.id } : null;
}
function startSession(res, account) {
  const token = randomBytes(32).toString('hex');
  const expiresAt = Date.now()+lifetime;
  db.prepare('DELETE FROM sessions WHERE expires_at<=?').run(Date.now());
  db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(digest(token),account.id,expiresAt);
  setCookie(res,'sv_session',token,lifetime/1000);
  return { account: { ...account, roles: rolesFor(account.id) }, roles: rolesFor(account.id), expiresAt: new Date(expiresAt).toISOString(), token: '' };
}
function json(res, result, status = 200) { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control':'no-store' }); res.end(JSON.stringify({ result })); }
async function body(req) {
  let length = 0, chunks = [];
  for await (const chunk of req) { length+=chunk.length; if (length>3*1024*1024) fail('Слишком большой запрос',413); chunks.push(chunk); }
  try { const value = JSON.parse(Buffer.concat(chunks).toString() || '{}'); if (!value || typeof value !== 'object' || Array.isArray(value)) fail('Неверный запрос',400); return value; } catch { fail('Некорректный JSON',400); }
}
function originAllowed(req) {
  if (!req.headers.origin) return;
  const origin = req.headers.origin;
  const expected = process.env.PUBLIC_ORIGIN;
  if (expected ? origin !== expected : ![`http://${req.headers.host}`, `https://${req.headers.host}`, 'http://localhost:5173','http://127.0.0.1:5173'].includes(origin)) fail('Запрос с другого сайта запрещён');
}
function notify(accountId,title,message,link) {
  if (!accountId) return;
  const all = collection('notifications');
  all.push({ id:crypto.randomUUID(),accountId,type:'project_status_changed',title,message,link,read:false,createdAt:new Date().toISOString() });
  saveCollection('notifications',all);
}
async function credit(accountId,eventId,amount,description) {
  const wallet=await core.rewardRepository.getOrCreateWallet(accountId,'EMERALD');
  await core.rewardRepository.addTransaction({walletId:wallet.id,currencyType:'EMERALD',operationType:'EARN',amount,status:'AVAILABLE',sourceType:'milestone',sourceId:eventId,sourceEventId:eventId,ruleVersion:'pilot-2026-10',description,availableAt:new Date().toISOString(),expiresAt:null});
}
async function attributeReferral(code,accountId) {
  const link=await core.referralRepository.findByCode(code||'');
  if(!link||link.referrerAccountId===accountId||collection('svyazka_dev_ref_attributions').some(a=>a.referredAccountId===accountId))return;
  await core.referralRepository.createAttribution({linkId:link.id,referrerAccountId:link.referrerAccountId,referredAccountId:accountId,programType:link.programId.includes('business')?'business':'career',status:'attributed',expiresAt:new Date(Date.now()+30*86400000).toISOString(),qualifiedAt:null,cancelledAt:null});
  if(!link.programId.includes('business'))await credit(link.referrerAccountId,`registration:${accountId}`,100,'Новая регистрация по карьерной ссылке');
}
function publicResume(slug) {
  const r = collection('svyazka_dev_resumes').find(r => r.isPublic && r.publicSlug === slug);
  if (!r) return null;
  const p = profileFor(r.candidateId);
  const consent=collection('consent_events').find(c=>c.accountId===r.candidateId&&c.consentType==='public_distribution'&&!c.withdrawnAt);
  if(!consent)return null;
  const categories=consent.categories||{name:true,city:true,education:true,experience:true,skills:true,careerGoal:true,phone:false,email:false};
  if (!p || (p.isMinor && p.guardianVerificationStatus !== 'verified')) return null;
  return {
    title:r.title,targetPosition:categories.careerGoal?r.targetPosition:'',summary:r.summary,skills:categories.skills?r.skills:[],
    fullName:categories.name?[p.firstName,p.lastName].filter(Boolean).join(' '):'',
    city:categories.city&&r.visibility.showCity ? p.city : '',
    email:categories.email&&r.visibility.showEmail ? p.email : '', phone:categories.phone&&r.visibility.showPhone ? p.phone : '',
    experience:categories.experience&&r.visibility.showExperience ? (r.experiences || p.experiences.filter(e => r.experienceIds.includes(e.id))) : [],
    education:categories.education&&r.educationIncluded ? (r.educationEntries || (p.education.institution ? [p.education] : [])) : [],
    languages:r.languages || p.languages, portfolioLinks:r.portfolioLinks || p.portfolioLinks,
    desiredSalary:r.desiredSalary, employmentTypes:r.employmentTypes, workFormats:r.workFormats,
    updatedAt:r.updatedAt,
  };
}
async function rpc(req, data) {
  const { repository:name, method, args = [] } = data;
  const repo = repositories[name];
  if(name==='organizationMembership'&&method==='create'&&args[0]?.accountId===context.getStore().account?.id){const exists=collection('svyazka_dev_memberships').find(m=>m.organizationId===args[0].organizationId&&m.accountId===args[0].accountId&&m.role===args[0].role&&m.status==='active');if(exists)return exists;}
  // Only methods defined on domain prototypes, never object builtins or properties.
  if (!Object.hasOwn(repositories,name) || !repo || typeof method !== 'string' || method==='constructor' || typeof Object.getOwnPropertyDescriptor(Object.getPrototypeOf(repo),method)?.value !== 'function' || !Array.isArray(args) || args.length > 8) fail('Неизвестный метод',400);
  authorize(name,method,args);
  if (name === 'candidate' && method === 'getProfile' && args[0] !== context.getStore().scope) {
    const p = profileFor(args[0]);
    return p ? { firstName:p.firstName,lastName:p.lastName,city:p.city,profession:p.profession,experiences:p.experiences,education:p.education,skills:p.skills,languages:p.languages } : null;
  }
  if (name === 'careerTest' && method === 'saveResult') {
    const test=await feature.careerTestRepository.getByType(args[0].testType);
    if(!test)fail('Тест не найден',404);
    const retake=await feature.careerTestRepository.canRetake(args[0].accountId,args[0].testType);
    if(!retake.allowed)fail(`Повторное прохождение доступно через ${retake.daysLeft} дн.`,409);
    const scores={};for(const q of test.questions){const option=q.options.find(o=>o.id===args[0].answers?.[q.id]);if(!option)fail('Ответьте на все вопросы',400);for(const [k,v]of Object.entries(option.scores))scores[k]=(scores[k]||0)+v;}
    const mappings={career_interests:{analytical:'Аналитик',creative:'Креативщик',social:'Коммуникатор',management:'Организатор'},work_style:{independent:'Самостоятельный',collaborative:'Командный',structured:'Структурированный',flexible:'Гибкий'},career_priorities:{income:'Доход-ориентированный',interest:'Интерес-ориентированный',balance:'Баланс-ориентированный',growth:'Рост-ориентированный'}};
    const winner=Object.entries(scores).sort((a,b)=>b[1]-a[1]).map(([key])=>mappings[test.type]?.[key]).find(Boolean)||test.results[0]?.profile||'';
    args[0]={...args[0],scores,profileName:winner,scoringVersion:'career-test-v1'};
  }
  if (name === 'businessProject' && method === 'create') {
    const extra=args[0].brief?.extra||{};const ads=await feature.advertisingRepository.getAll();
    if(extra.sourceType==='target_ads') {
      let input;try{input=JSON.parse(extra.targetAdsInput||'{}');}catch{fail('Некорректный расчёт рекламы',400);}
      if(!Number.isSafeInteger(input.budgetKopecks)||input.budgetKopecks<=0||!['net','gross'].includes(input.inputMode))fail('Укажите положительный рекламный бюджет',400);
      const quote=quoteTargetAds(input);const selected=SVYAZKA_SERVICES.filter(s=>(input.serviceIds||[]).includes(s.id)&&s.pricing.type==='fixed').map(s=>({serviceId:s.id,label:s.label,priceKopecks:s.pricing.amountKopecks||0,priceType:s.pricing.type}));
      const snapshot=buildPricingSnapshot({quote,ownServices:selected});
      Object.assign(args[0],{providerAmountKopecks:quote.adGrossKopecks,platformFeeKopecks:quote.managementFeeKopecks+selected.reduce((n,s)=>n+s.priceKopecks,0),totalAmountKopecks:snapshot.totalPlanKopecks,pricingVersion:quote.pricingVersion});
    }
    let chosen=[];
    if(extra.sourceType==='advertising')chosen=ads.filter(a=>a.id===extra.sourceId);
    if(extra.sourceType==='media_plan') {let placements;try{placements=JSON.parse(extra.placements||'[]');}catch{fail('Некорректный медиаплан',400);}chosen=ads.filter(a=>placements.some(i=>i.placementId===a.id));if(chosen.length!==placements.length)fail('В медиаплане есть неизвестные или повторяющиеся размещения',400);}
    if(['advertising','media_plan'].includes(extra.sourceType)) {if(!chosen.length)fail('Выберите размещение',400);const sum=chosen.reduce((n,a)=>n+Math.round(a.basePrice*100),0);Object.assign(args[0],{providerAmountKopecks:sum,platformFeeKopecks:0,totalAmountKopecks:sum,pricingVersion:'vk-placement-pilot-2026-10'});}
  }
  const before = method === 'update'  && name === 'application' ? find('svyazka_dev_applications',args[0].id) : null;
  const isFirstResume=name==='resume'&&method==='create'&&collection('svyazka_dev_resumes').every(r=>r.candidateId!==context.getStore().account.id);
  const isFirstApplication=name==='application'&&method==='create'&&collection('svyazka_dev_applications').every(a=>a.candidateId!==context.getStore().account.id);
  const result = await repo[method](...args);
  if(isFirstResume)await credit(context.getStore().account.id,`first-resume:${context.getStore().account.id}`,50,'Первое резюме');
  if(isFirstApplication)await credit(context.getStore().account.id,`first-application:${context.getStore().account.id}`,100,'Первый отклик');
  if (name === 'organization' && method === 'create') {
    await core.organizationMembershipRepository.create({organizationId:result.id,accountId:context.getStore().account.id,role:'owner',status:'active'});
    await core.accountRepository.assignRole(context.getStore().account.id,'business_member');
  }
  const acc = context.getStore().account;
  if (name === 'account' && method === 'getCurrentAccount' && result) return {...result,roles:rolesFor(result.id)};
  if (name === 'account' && method === 'getAll') return result.map(a=>({...a,roles:rolesFor(a.id)}));
  if (name === 'organization' && ['getById','getByInn'].includes(method)) {
    try { orgAccess(result?.id); return result; } catch { return publicOrganization(result); }
  }
  if (name === 'account' && method === 'getById' && result && (result.id === acc?.id || context.getStore().roles?.includes('admin'))) return {...result,roles:rolesFor(result.id)};
  if (name === 'account' && method === 'getById' && result && result.id !== acc?.id && !context.getStore().roles?.includes('admin')) return { id:result.id,displayName:result.displayName,firstName:result.firstName,lastName:result.lastName,avatarUrl:result.avatarUrl };
  if (name === 'application' && method === 'create') {
    const v = find('svyazka_dev_vacancies',result.vacancyId);
    for (const m of collection('svyazka_dev_memberships').filter(m => m.organizationId === v.organizationId && ['owner','administrator','hr_manager'].includes(m.role) && m.status === 'active')) notify(m.accountId,'Новый отклик',`${acc.displayName}: ${v.title}`,'/business/applications');
    const all = collection('svyazka_dev_vacancies');
    const i = all.findIndex(v => v.id === result.vacancyId); if (i>=0) { all[i].applicationsCount=(all[i].applicationsCount||0)+1; saveCollection('svyazka_dev_vacancies',all); }
  }
  if (before && before.status !== args[0].status) notify(before.candidateId,'Статус отклика изменён',`Новый статус: ${args[0].status}`,'/career/applications');
  if (name === 'businessProject' && method === 'create') for (const a of collection('svyazka_dev_roles').filter(r => r.role === 'admin')) notify(a.accountId,'Новая заявка',result.title,`/admin/projects/${result.id}`);
  if (name === 'consent' && method === 'withdraw' && args[1] === 'public_distribution') saveCollection('svyazka_dev_resumes',collection('svyazka_dev_resumes').map(r => r.candidateId === acc.id ? { ...r,isPublic:false } : r));
  if (name === 'adminGrant' && ['grant','revoke'].includes(method)) {
    const grants = await core.adminGrantRepository.getAll();
    const assignments = collection('svyazka_dev_roles').filter(r => r.role !== 'admin' || !find('svyazka_dev_accounts',r.accountId)?.vkUserId);
    for (const a of collection('svyazka_dev_accounts').filter(a => grants.some(g => g.vkUserId === a.vkUserId))) assignments.push({ id:crypto.randomUUID(),accountId:a.id,role:'admin',createdAt:new Date().toISOString() });
    saveCollection('svyazka_dev_roles',assignments);
  }
  if (!method.startsWith('get') && !method.startsWith('find')) db.prepare('INSERT INTO audit(account_id,action) VALUES(?,?)').run(acc?.id||null,`${name}.${method}`);
  return result ?? null;
}

async function api(req,res,url) {
  const guest = guestScope(req,res);
  const ctx = session(req) || { account:null,roles:[],scope:guest,expiresAt:Date.now() };
  return context.run(ctx, async () => {
    if (req.method === 'GET') {
      if (url.pathname === '/api/health') return json(res,{ status:'ok',storage:'sqlite',version:'2026.10.10' });
      if (url.pathname === '/api/auth/session') return json(res,ctx.account ? { account:{ ...ctx.account,roles:ctx.roles },roles:ctx.roles,token:'',expiresAt:new Date(ctx.expiresAt).toISOString() } : null);
      if (url.pathname === '/api/partnership') {
        if(!ctx.account)fail('Войдите в аккаунт',401);
        let links=await core.referralRepository.getLinksByAccount(ctx.account.id);
        for(const program of ['career','business'])if(!links.some(l=>l.programId===program)){const code=crypto.randomUUID();links.push(await core.referralRepository.createLink({programId:program,referrerAccountId:ctx.account.id,code,url:`${process.env.PUBLIC_ORIGIN||'http://'+req.headers.host}/${program}?ref=${code}`,expiresAt:null}));}
        const wallets=await Promise.all(['EMERALD','DIAMOND'].map(c=>core.rewardRepository.getOrCreateWallet(ctx.account.id,c)));
        const transactions=(await Promise.all(wallets.map(w=>core.rewardRepository.getTransactions(w.id)))).flat().sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
        const attributions=await core.referralRepository.getAttributionsByReferrer(ctx.account.id);const clicks=(await Promise.all(links.map(l=>core.referralRepository.getClicksByLink(l.id)))).reduce((n,v)=>n+v,0);
        return json(res,{links,wallets,transactions,clicks,registrations:attributions.length,qualified:attributions.filter(a=>a.status==='qualified').length});
      }
      if (url.pathname === '/api/companies') return json(res,collection('svyazka_dev_orgs').filter(o => o.publicProfile?.isPublished).map(publicOrganization));
      if (url.pathname.startsWith('/api/companies/')) { const o=find('svyazka_dev_orgs',decodeURIComponent(url.pathname.split('/').pop())); if (!o?.publicProfile?.isPublished) fail('Компания не найдена',404); return json(res,publicOrganization(o)); }
      if (url.pathname.startsWith('/api/resumes/')) { const r = publicResume(url.pathname.split('/').pop()); if (!r) fail('Резюме не найдено или скрыто',404); return json(res,r); }
      if (url.pathname.startsWith('/api/guardian/')) {
        const v=collection('svyazka_dev_guardian_verifications').find(v => v.verificationToken===url.pathname.split('/').pop() && !v.consumedAt && Date.parse(v.expiresAt)>Date.now());
        if (!v) fail('Ссылка недействительна или уже использована',404);
        const p=profileFor(v.candidateId); return json(res,{ candidateName:[p?.firstName,p?.lastName].filter(Boolean).join(' '),status:v.status });
      }
      fail('Страница API не найдена',404);
    }
    if (req.method !== 'POST') fail('Метод не поддерживается',405);
    originAllowed(req);
    rate(req,'api',300);
    const data = await body(req);
    if (url.pathname.startsWith('/api/auth/')) {
      rate(req,'auth',20);
      if (url.pathname === '/api/auth/logout') { db.prepare('DELETE FROM sessions WHERE token_hash=?').run(digest(cookie(req,'sv_session'))); setCookie(res,'sv_session','',0); return json(res,true); }
      if (['/api/auth/register','/api/auth/login'].includes(url.pathname)) {
        const email=normalizeEmail(data.email), password=String(data.password || '');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length>254 || password.length>256) fail('Проверьте email и пароль',400);
        let credential=db.prepare('SELECT * FROM credentials WHERE email=?').get(email), account;
        if (url.pathname.endsWith('register')) {
          if (password.length<12) fail('Пароль должен содержать не менее 12 символов',400);
          if (!data.firstName?.trim() || !data.lastName?.trim() || !data.consent?.user_terms || !data.consent?.personal_data) fail('Заполните имя и фамилию и примите обязательные согласия',400);
          if (credential || collection('svyazka_dev_accounts').some(a => a.email === email)) fail('Этот email уже используется. Войдите в существующий аккаунт.',409);
          account={ id:crypto.randomUUID(),vkUserId:'',displayName:`${data.firstName.trim()} ${data.lastName.trim()}`,firstName:data.firstName.trim(),lastName:data.lastName.trim(),email,phone:'',avatarUrl:'',roles:[],createdAt:new Date().toISOString(),updatedAt:new Date().toISOString() };
          db.exec('BEGIN IMMEDIATE');
          try {
            saveCollection('svyazka_dev_accounts',[...collection('svyazka_dev_accounts'),account]);
            const roles=['candidate'];
            saveCollection('svyazka_dev_roles',[...collection('svyazka_dev_roles'),...roles.map(role => ({ id:crypto.randomUUID(),accountId:account.id,role,createdAt:account.createdAt }))]);
            db.prepare('INSERT INTO credentials VALUES(?,?,?)').run(email,account.id,passwordHash(password));
            for (const type of ['user_terms','personal_data', ...(data.consent.marketing ? ['marketing'] : [])]) await feature.consentRepository.recordAcceptance({accountId:account.id,consentType:type,documentSlug:type,documentVersion:'2026-10-10',source:'manual'});
            db.exec('COMMIT');
          } catch (err) { db.exec('ROLLBACK'); throw err; }
        } else {
          if (!credential) { scryptSync(password,'unknown-account',64); fail('Неверный email или пароль',401); }
          if (!passwordMatches(password,credential.hash)) fail('Неверный email или пароль',401);
          account=find('svyazka_dev_accounts',credential.account_id);
        }
        if(url.pathname.endsWith('register'))await attributeReferral(data.referralCode,account.id);
        migrateGuest(guest,account.id);
        return json(res,startSession(res,account));
      }
      if (url.pathname === '/api/auth/vk') {
        if (!process.env.VK_APP_ID) fail('Вход через VK временно недоступен. Используйте email.',503);
        const response=await fetch(`https://id.vk.ru/oauth2/user_info?client_id=${encodeURIComponent(process.env.VK_APP_ID)}`,{method:'POST',body:new URLSearchParams({access_token:String(data.accessToken||'')}),signal:AbortSignal.timeout(15000)});
        const info=await response.json(); const user=info.user;
        if (!response.ok || info.error || !user?.user_id) fail('VK не подтвердил вход',401);
        const previousAccount=await core.accountRepository.findByVkUserId(String(user.user_id));
        let account=await core.accountRepository.createFromVk({ vkUserId:String(user.user_id),firstName:user.first_name||'',lastName:user.last_name||'',email:user.email||'',phone:user.phone||'',avatarUrl:user.avatar||'' });
        await core.accountRepository.assignRole(account.id,'candidate');
        const configured=String(process.env.ADMIN_VK_IDS || '').split(',');
        const grant=await core.adminGrantRepository.getByVkUserId(account.vkUserId);
        if (configured.includes(account.vkUserId) || grant) await core.accountRepository.assignRole(account.id,'admin');
        if(!previousAccount)await attributeReferral(data.referralCode,account.id);
        migrateGuest(guest,account.id); return json(res,startSession(res,account));
      }
      fail('Неизвестный способ входа',404);
    }
    if (url.pathname === '/api/referrals/visit') {
      const link=await core.referralRepository.findByCode(String(data.code||''));
      if(link&&!collection('svyazka_dev_ref_clicks').some(c=>c.linkId===link.id&&c.visitorIp===digest(guest)))await core.referralRepository.recordClick(link.id,digest(guest),String(req.headers['user-agent']||''));
      return json(res,true);
    }
    if (url.pathname.startsWith('/api/lookup/')) {
      if(!ctx.account) fail('Войдите в аккаунт',401); rate(req,'lookup',15);
      return json(res,await lookup(url.pathname.endsWith('bank')?'bank':'organization',String(data.bik||data.inn||'').trim()));
    }
    if (url.pathname === '/api/rpc') {
      const result=await serial(async () => { db.exec('BEGIN IMMEDIATE'); try { const r=await rpc(req,data); db.exec('COMMIT'); return r; } catch(err) { db.exec('ROLLBACK'); throw err; } });
      return json(res,result);
    }
    if (url.pathname === '/api/invitations/accept') {
      if (!ctx.account) fail('Войдите в аккаунт',401);
      const inv=collection('org_invitations').find(i => i.inviteToken===data.token && i.status==='pending' && Date.parse(i.expiresAt)>Date.now());
      if (!inv) fail('Приглашение недействительно',404);
      if (inv.inviteeEmail && normalizeEmail(inv.inviteeEmail)!==ctx.account.email) fail('Приглашение предназначено другому email');
      await serial(async () => {
        if (!(await core.organizationMembershipRepository.getByAccount(ctx.account.id)).some(m => m.organizationId===inv.organizationId)) await core.organizationMembershipRepository.create({organizationId:inv.organizationId,accountId:ctx.account.id,role:inv.role,status:'active'});
        await feature.organizationInvitationRepository.updateStatus(inv.id,'accepted');
        await core.accountRepository.assignRole(ctx.account.id,'business_member');
      }); return json(res,true);
    }
    if (url.pathname === '/api/guardian/confirm') {
      const v=collection('svyazka_dev_guardian_verifications').find(v => v.verificationToken===data.token && !v.consumedAt && Date.parse(v.expiresAt)>Date.now());
      if (!v) fail('Ссылка недействительна',404);
      if (!data.accepted && data.status!=='rejected') fail('Подтвердите согласие',400);
      await core.guardianVerificationRepository.updateStatus(v.id,data.status==='rejected'?'rejected':'verified');
      const p=profileFor(v.candidateId); if(p) saveProfileFor(v.candidateId,{...p,guardianVerificationStatus:data.status==='rejected'?'rejected':'verified'});
      return json(res,true);
    }
    if (url.pathname === '/api/applications/resume') {
      const app=applicationAccess(data.applicationId); if(app.status==='withdrawn'&&ctx.account?.id!==app.candidateId)fail('Отклик отозван кандидатом',409); const p=profileFor(app.candidateId), r=find('svyazka_dev_resumes',app.resumeId);
      return json(res,{ fullName:[p?.firstName,p?.lastName].filter(Boolean).join(' '),title:r?.targetPosition||p?.profession,summary:r?.summary||'',skills:r?.skills||p?.skills?.map(s=>s.name)||[],experience:r?.experiences||p?.experiences||[],education:r?.educationEntries||(p?.education?.institution?[p.education]:[]),contacts:app.sharedContacts||{} });
    }
    fail('Страница API не найдена',404);
  });
}
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2','.ico':'image/x-icon'};
const server=createServer(async(req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');res.setHeader('X-Frame-Options','DENY');
  try {
    const url=new URL(req.url,'http://localhost');
    if(url.pathname.startsWith('/api/')) return await api(req,res,url);
    if(!['GET','HEAD'].includes(req.method)) fail('Метод не поддерживается',405);
    const dist=path.join(root,'dist');let file=path.resolve(dist,'.'+decodeURIComponent(url.pathname));
    if(!file.startsWith(dist+path.sep)&&file!==dist) fail('Страница не найдена',404);
    if(!existsSync(file)||!(await stat(file)).isFile()) { if(path.extname(file)) fail('Файл не найден',404); file=path.join(dist,'index.html'); }
    if(!existsSync(file)) fail('Сначала выполните npm run build',503);
    res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':file.includes('/assets/')?'public,max-age=31536000,immutable':'no-cache'});
    if(req.method==='HEAD')return res.end();createReadStream(file).pipe(res);
  } catch(err) { if(res.headersSent)return res.end(); const status=err.status||500; if(status===500)console.error(err); res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify({error:status===500?'Внутренняя ошибка сервера':err.message})); }
});
server.listen(port,process.env.HOST||'127.0.0.1',()=>console.log(`СВЯЗКА: http://${process.env.HOST||'127.0.0.1'}:${port}`));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>{db.close();process.exit();}));
