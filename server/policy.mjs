import { context, collection, profileFor, saveProfileFor } from './storage.mjs';

export function fail(message = 'Недостаточно прав', status = 403) { throw Object.assign(new Error(message), { status }); }
export const find = (key, id) => collection(key).find(x => x.id === id) || null;
const own = id => { if (id !== context.getStore()?.account?.id) fail(); };
const requireLogin = () => { if (!context.getStore()?.account) fail('Войдите в аккаунт', 401); };
const admin = () => context.getStore()?.roles?.includes('admin');
export function orgAccess(id, roles) {
  requireLogin();
  if (admin()) return;
  const member = collection('svyazka_dev_memberships').find(m => m.organizationId === id && m.accountId === context.getStore().account.id && m.status === 'active');
  if (!member || (roles && !roles.includes(member.role))) fail();
}
const hr = ['owner', 'administrator', 'hr_manager'];
const management = ['owner', 'administrator'];
const marketing = ['owner', 'administrator', 'marketing_manager'];
export function applicationAccess(id) {
  const app = find('svyazka_dev_applications', id);
  if (!app) fail('Отклик не найден', 404);
  if (app.candidateId !== context.getStore()?.account?.id) orgAccess(find('svyazka_dev_vacancies', app.vacancyId)?.organizationId, hr);
  return app;
}
export function canReadCandidate(id) {
  if (admin() || context.getStore()?.account?.id === id) return true;
  return collection('svyazka_dev_applications').some(a => {
    if (a.candidateId !== id || a.status === 'withdrawn') return false;
    try { orgAccess(find('svyazka_dev_vacancies', a.vacancyId)?.organizationId, hr); return true; } catch { return false; }
  });
}
export function publicOrganization(o) {
  if (!o) return null;
  return Object.fromEntries(['id','name','shortName','description','logo','industry','website','city','publicProfile','createdAt','updatedAt'].map(k => [k, o[k]]));
}
export function validateProfile(p) {
  if (!p || typeof p !== 'object') fail('Профиль не заполнен', 400);
  const acc = context.getStore().account;
  const guardian = collection('svyazka_dev_guardian_verifications').filter(v=>v.candidateId===acc.id).sort((a,b)=>b.createdAt.localeCompare(a.createdAt))[0];
  const age = p.birthDate ? (Date.now() - Date.parse(p.birthDate)) / (365.2425 * 86400000) : null;
  if (age !== null && (!Number.isFinite(age) || age < 14 || age > 110)) fail('Укажите корректную дату рождения. Платформа доступна с 14 лет.', 400);
  return { ...p, id: acc.id, accountId: acc.id, isMinor: age !== null ? age < 18 : false, guardianVerificationStatus: guardian?.status === 'verified' ? 'verified' : guardian?.status === 'pending' ? 'pending' : guardian?.status === 'rejected' ? 'rejected' : (age !== null && age < 18 ? 'required' : 'not_required') };
}
function resumeAllowed(r) {
  const profile = profileFor(context.getStore().account.id);
  const v = collection('svyazka_dev_guardian_verifications').filter(v => v.candidateId === profile?.accountId).sort((a,b)=>b.createdAt.localeCompare(a.createdAt))[0];
  if (r.isPublic && (!profile?.birthDate || (profile.isMinor && v?.status !== 'verified'))) fail('Заполните дату рождения и, если нужно, получите согласие законного представителя.', 400);
  if (r.isPublic && !collection('consent_events').some(c => c.accountId === profile.accountId && c.consentType === 'public_distribution' && !c.withdrawnAt)) fail('Примите согласие на публикацию резюме',400);
  if (r.desiredSalary!=null&&(!Number.isFinite(r.desiredSalary)||r.desiredSalary<0))fail('Желаемая зарплата должна быть положительной',400);
  for(const e of r.experiences||[])if(e.startDate&&e.endDate&&!e.ongoing&&e.startDate>e.endDate)fail('Дата окончания опыта не может быть раньше начала',400);
  if (!r.title?.trim() || !r.targetPosition?.trim()) fail('Укажите название и желаемую должность', 400);
  r.publicSlug ||= crypto.randomUUID();
}

export function authorize(name, method, args) {
  const ctx = context.getStore(), acc = ctx.account, first = args[0];
  const read = method.startsWith('get') || method.startsWith('find') || method === 'canRetake' || method === 'isFavorite';
  if (['advertising','serviceOffering'].includes(name) && read) return;
  if (name === 'partner' && method === 'getActive') return;
  if (['mediaPlan','projectDraftSource'].includes(name)) return;
  if (name === 'vacancy' && ['getPublished','getById'].includes(method)) {
    if (method === 'getById') {
      const v = find('svyazka_dev_vacancies', first);
      if (v && v.status !== 'published' && !collection('svyazka_dev_applications').some(a=>a.vacancyId===v.id&&a.candidateId===acc?.id)) orgAccess(v.organizationId, hr);
    }
    return;
  }
  if (name === 'organization' && method === 'getById') return;
  if (name === 'careerTest' && ['getAll','getByType'].includes(method)) return;
  if (name === 'organizationInvitation' && method === 'getByToken') return;
  if (name === 'account' && method === 'getCurrentAccount') return;
  if (name === 'referral' && method === 'findByCode') return;
  requireLogin();
  if (name === 'account') {
    if (method === 'getRoles' || method === 'updateAccount') {
      if (!admin() || method === 'updateAccount') own(first?.id || first);
      if (method === 'updateAccount') args[0] = { ...acc, displayName: first.displayName, firstName: first.firstName, lastName: first.lastName, phone: first.phone, avatarUrl: first.avatarUrl };
      return;
    }
    if (method === 'getById' && (canReadCandidate(first) || collection('svyazka_dev_memberships').some(m=>m.accountId===first && collection('svyazka_dev_memberships').some(own=>own.organizationId===m.organizationId&&own.accountId===acc.id&&own.status==='active')))) return;
    if (method === 'logout') return;
    if (method === 'assignRole' && first === acc.id && ['candidate','business_member'].includes(args[1])) return;
    if (admin() && !['createFromVk','findByVkUserId'].includes(method)) return;
    fail();
  }
  if (name === 'candidate') {
    if (method === 'getProfile' && canReadCandidate(first)) return;
    own(first?.accountId || first);
    if (method === 'saveProfile') args[0] = validateProfile(first);
    return;
  }
  if (name === 'journey') {
    if (method === 'saveState') args[0] = { ...first, profile: validateProfile(first.profile), demoMode: false };
    if (method === 'recordApplication') fail('Используйте отклик на опубликованную вакансию', 400);
    return;
  }
  if (name === 'organization') {
    if (method === 'create') {
      if (!first.name?.trim() || !/^\d{10}(\d{2})?$/.test(first.inn || '')) fail('Укажите наименование и ИНН (10 или 12 цифр)', 400);
      if (collection('svyazka_dev_orgs').some(o => o.inn === first.inn)) fail('Организация с этим ИНН уже зарегистрирована. Обратитесь к её владельцу.', 409);
      first.createdBy = acc.id; return;
    }
    if (method === 'getByAccountId') { own(first); return; }
    if (method === 'getByInn') return;
    if (method === 'update') { orgAccess(first.id, management); args[0] = {...first,createdBy:find('svyazka_dev_orgs',first.id)?.createdBy}; return; }
    if (method === 'getAll' && admin()) return;
    fail();
  }
  if (name === 'organizationMembership') {
    if (method === 'getByAccount') { own(first); return; }
    if (method === 'getByOrganization') { orgAccess(first); return; }
    if (method === 'create') {
      const existing = collection('svyazka_dev_memberships').filter(m => m.organizationId === first.organizationId);
      const org = find('svyazka_dev_orgs', first.organizationId);
      if (!existing.length && org?.createdBy === acc.id && first.accountId === acc.id && first.role === 'owner') return;
      orgAccess(first.organizationId, management);
      if (!find('svyazka_dev_accounts', first.accountId)) fail('Аккаунт не найден', 404);
      if (existing.some(m => m.accountId === first.accountId)) fail('Участник уже в команде', 409);
      if (first.role === 'owner') fail('Передача владения выполняется администратором');
      return;
    }
    const member = find('svyazka_dev_memberships', first);
    orgAccess(member?.organizationId, management);
    if (member.role === 'owner' || args[1] === 'owner') fail('Нельзя удалить или заменить владельца');
    return;
  }
  if (name === 'vacancy') {
    if (['getAll','getPendingModeration','getByStatus','approve','reject'].includes(method)) { if (!admin()) fail(); if (['approve','reject'].includes(method)) args[1] = acc.id; return; }
    if (method === 'getByOrganization') { orgAccess(first); return; }
    const v = method === 'create' ? first : find('svyazka_dev_vacancies', first?.id || first);
    if (!v) fail('Вакансия не найдена', 404);
    orgAccess(v.organizationId, hr);
    if (method === 'create' || method === 'update') {
      if (!first.title?.trim() || !first.description?.trim()) fail('Заполните название и описание вакансии', 400);
      if (first.salaryFrom != null && first.salaryTo != null && first.salaryFrom > first.salaryTo) fail('Зарплата «от» должна быть меньше «до»', 400);
      for (const key of ['salaryFrom','salaryTo']) if (first[key] != null && (!Number.isFinite(first[key]) || first[key] < 0)) fail('Проверьте зарплатную вилку',400);
      if (first.minimumAge != null && (!Number.isInteger(first.minimumAge) || first.minimumAge < 14 || first.minimumAge > 110)) fail('Проверьте минимальный возраст',400);
      if (method === 'create') args[0]={responsibilities:[],requirements:[],niceToHave:[],employmentType:'Полная занятость',schedule:'Полный день',workFormat:'Офис',location:'',city:'',salaryFrom:null,salaryTo:null,salaryCurrency:'RUB',salaryGross:true,experienceLevel:'none',skills:[],suitableForMinors:false,minimumAge:18,contactPerson:'',contactEmail:'',promotion:'none',advertiserName:'',advertiserInn:'',erid:'',ordProvider:'',adLabelRequired:false,moderationComment:'',publishedAt:null,closedAt:null,...first};
      if (method === 'create') Object.assign(args[0], { createdBy: acc.id, status: 'draft', viewsCount: 0, applicationsCount: 0, moderatedBy: null, moderatedAt: null });
      else args[0] = { ...first, organizationId: v.organizationId, createdBy: v.createdBy, status: 'draft', viewsCount: v.viewsCount, applicationsCount: v.applicationsCount, moderatedBy: null, moderatedAt: null };
    }
    if (method === 'publish' && !['approved','paused'].includes(v.status)) fail('Вакансия должна пройти модерацию', 409);
    if (method === 'submitForModeration' && !['draft','rejected'].includes(v.status)) fail('Вакансия уже передана на модерацию', 409);
    return;
  }
  if (name === 'resume') {
    if (method === 'getByCandidate') { own(first); return; }
    const r = method === 'create' ? first : find('svyazka_dev_resumes', first?.id || first);
    if (!r) fail('Резюме не найдено', 404);
    if (method === 'getById' && r.candidateId !== acc.id) {
      if (!collection('svyazka_dev_applications').some(a => a.resumeId === r.id && a.status !== 'withdrawn' && (() => { try { orgAccess(find('svyazka_dev_vacancies', a.vacancyId)?.organizationId, hr); return true; } catch { return false; } })())) fail();
      return;
    }
    own(r.candidateId);
    if (method === 'create') args[0].publicSlug = crypto.randomUUID();
    if (method === 'update') { args[0].candidateId = r.candidateId; args[0].publicSlug = r.publicSlug || crypto.randomUUID(); }
    if (['create','update'].includes(method)) resumeAllowed(first);
    return;
  }
  if (name === 'application') {
    if (method === 'getByCandidate') { own(first); return; }
    if (method === 'getByOrganization') { orgAccess(first, hr); return; }
    if (method === 'getByVacancy') { orgAccess(find('svyazka_dev_vacancies', first)?.organizationId, hr); return; }
    if (method === 'create') {
      own(first.candidateId);
      const v = find('svyazka_dev_vacancies', first.vacancyId);
      if (!v || v.status !== 'published') fail('Вакансия больше не принимает отклики', 409);
      const p = profileFor(acc.id);
      if (!p?.birthDate || (p.isMinor && p.guardianVerificationStatus !== 'verified')) fail('Заполните профиль и подтвердите согласие представителя, если вам нет 18 лет', 400);
      if (p.isMinor && !v.suitableForMinors) fail('Вакансия доступна с 18 лет', 400);
      const age = (Date.now() - Date.parse(p.birthDate)) / (365.2425 * 86400000);
      if (v.minimumAge && age < v.minimumAge) fail(`Вакансия доступна с ${v.minimumAge} лет`,400);
      if (first.resumeId && find('svyazka_dev_resumes', first.resumeId)?.candidateId !== acc.id) fail();
      if (collection('svyazka_dev_applications').some(a => a.vacancyId === v.id && a.candidateId === acc.id && a.status !== 'withdrawn')) fail('Вы уже откликнулись на эту вакансию', 409);
      Object.assign(first, { status: 'sent', sharedContacts: { email: p.email, phone: p.phone } }); return;
    }
    const app = applicationAccess(first?.id || first);
    if (method === 'update') {
      if(app.status==='withdrawn') fail('Отклик уже отозван',409);
      if (app.candidateId === acc.id && first.status !== 'withdrawn') fail('Кандидат может только отозвать отклик');
      if (app.candidateId !== acc.id && !['viewed','interview','offer','rejected'].includes(first.status)) fail('Некорректный статус', 400);
      args[0] = { ...app, status: first.status };
    }
    return;
  }
  if (name === 'businessProject') {
    if (method === 'getAll') { if (!admin()) fail(); return; }
    if (method === 'getByAccountOrganizations') { own(first); return; }
    if (method === 'getByOrganization') { orgAccess(first); return; }
    const p = method === 'create' ? first : find('svyazka_dev_business_projects', first?.id || first);
    orgAccess(p?.organizationId, read ? undefined : marketing);
    if (method === 'create') Object.assign(first, { status: 'draft', createdBy: acc.id });
    if(['create','update'].includes(method)) {if(!first.title?.trim())fail('Укажите название заявки',400);for(const key of ['providerAmountKopecks','platformFeeKopecks','totalAmountKopecks'])if(!Number.isSafeInteger(first[key])||first[key]<0)fail('Суммы должны быть указаны в целых копейках',400);}
    if (method === 'update' && !admin()) {
      if (first.status !== p.status && first.status !== 'cancelled') fail('Этапы исполнения и оплаты меняет оператор');
      args[0] = { ...p, status: first.status, title: first.title, brief: first.brief };
    }
    return;
  }
  if (['vacancyEvent','applicationEvent','projectEvent'].includes(name)) {
    const object = method === 'create' ? first : null;
    const id = object ? object.vacancyId || object.applicationId || object.projectId : first;
    if (name === 'applicationEvent') applicationAccess(id);
    if (name === 'vacancyEvent') orgAccess(find('svyazka_dev_vacancies', id)?.organizationId, method === 'create' ? hr : undefined);
    if (name === 'projectEvent') orgAccess(find('svyazka_dev_business_projects', id)?.organizationId, method === 'create' ? marketing : undefined);
    if (object) object.actorAccountId = acc.id;
    return;
  }
  if (name === 'organizationInvitation' || name === 'document') {
    const key = name === 'document' ? 'documents' : 'org_invitations';
    if (method === 'getByAccount') { own(first); return; }
    if (method === 'getByToken') return;
    if(['create','update'].includes(method)&&name==='document'&&(!first.title?.trim()|| (first.amount!=null&&(!Number.isFinite(first.amount)||first.amount<0))))fail('Проверьте название и сумму документа',400);
    const o = method === 'create' ? first : method === 'update' ? find(key, first?.id) : method === 'getByProject' ? find('svyazka_dev_business_projects', first) : method === 'getByOrganization' ? { organizationId: first } : find(key, first);
    orgAccess(o?.organizationId, name === 'document' ? ['owner','administrator','accountant'] : management);
    if (name === 'document' && ['create','update'].includes(method) && first.projectId) {
      const project = find('svyazka_dev_business_projects', first.projectId);
      if (!project || project.organizationId !== o.organizationId) fail('Проект документа должен принадлежать той же организации',400);
    }
    if (method === 'update' && name === 'document') args[0] = {...first,organizationId:o.organizationId,createdAt:o.createdAt};
    if (method === 'create' && name === 'organizationInvitation') {
      if (!['administrator','hr_manager','marketing_manager','accountant','viewer'].includes(first.role)) fail('Выберите допустимую роль участника',400);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(first.inviteeEmail || '')) fail('Укажите email приглашённого участника',400);
      Object.assign(first,{invitedBy:acc.id,status:'pending',inviteeEmail:first.inviteeEmail.trim().toLowerCase()});
    }
    if (method === 'updateStatus' && name === 'organizationInvitation' && args[1] !== 'cancelled') fail('Подтверждение приглашения выполняется по одноразовой ссылке',400);
    return;
  }
  if (name === 'notification') {
    if(admin()) return;
    if (['getByAccount','getUnreadCount','markAllRead'].includes(method)) { own(first); return; }
    own(method === 'create' ? first.accountId : find('notifications', first)?.accountId); return;
  }
  if (name === 'favoriteVacancy') { own(first); return; }
  if (name === 'careerTest') { own(first?.accountId || first); return; }
  if (name === 'consent') {
    if (method === 'getByOrganization') { orgAccess(first, management); return; }
    own(first?.accountId || first); return;
  }
  if (name === 'guardianVerification') {
    if (method === 'getByCandidate') { own(first); return; }
    if (method === 'create') { own(first.candidateId); first.status = 'pending'; first.verificationToken = crypto.randomUUID(); first.consumedAt = null; return; }
    fail('Используйте ссылку подтверждения');
  }
  if (name === 'referral') {
    if (['getLinksByAccount','getAttributionsByReferrer','getPendingAttribution'].includes(method)) { own(first); return; }
    if (method === 'createLink') { own(first.referrerAccountId); if(!['career','business'].includes(first.programId))fail('Неизвестная программа',400); first.code=crypto.randomUUID(); first.url=`${process.env.PUBLIC_ORIGIN||'http://localhost:3001'}/${first.programId}?ref=${first.code}`; return; }
    if (admin()) return;
    if (read) {
      const link = find('svyazka_dev_ref_links', first), attr = find('svyazka_dev_ref_attributions', first);
      own(link?.referrerAccountId || attr?.referrerAccountId); return;
    }
    fail('Начисления и атрибуции выполняются сервером');
  }
  if (name === 'reward') {
    if (['getWallets','getOrCreateWallet'].includes(method)) { own(first); return; }
    const walletId = first?.walletId || first;
    const wallet = find('svyazka_dev_reward_wallets', walletId);
    if (!admin()) { own(wallet?.accountId); if (!read && method !== 'computeBalance') fail('Вознаграждения начисляет оператор'); }
    return;
  }
  if (['adminGrant','partner','fraud'].includes(name) && admin()) return;
  fail();
}
