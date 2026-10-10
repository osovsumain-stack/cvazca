// Browser acceptance suite. Uses a temporary local database unless TEST_URL is explicit.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const projectRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const base=process.env.TEST_URL||'http://127.0.0.1:38173';
let browser,context,server,tmp;
try {
 if(!process.env.TEST_URL){
   tmp=await mkdtemp(path.join(os.tmpdir(),'svyazka-browser-'));
   server=spawn(process.execPath,['server/index.mjs'],{cwd:projectRoot,env:{...process.env,DB_PATH:path.join(tmp,'test.sqlite'),PORT:'38173',HOST:'127.0.0.1',PUBLIC_ORIGIN:'',COOKIE_SECURE:'false',VK_APP_ID:'',DADATA_API_KEY:''},stdio:['ignore','pipe','pipe']});
   await new Promise((resolve,reject)=>{const t=setTimeout(()=>reject(new Error('Test API startup timeout')),15000);server.stdout.on('data',d=>{if(String(d).includes('СВЯЗКА:')){clearTimeout(t);resolve();}});server.once('exit',code=>{clearTimeout(t);reject(new Error(`Test API exited ${code}`));});});
 }
 browser=await chromium.launch({headless:true});
 context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await mkdir('screenshots',{recursive:true});
 for(const [name,width]of [['desktop',1440],['mobile',390]]){
   await page.setViewportSize({width,height:1000});
   for(const route of ['/','/vacancies','/companies','/advertising','/services','/legal/privacy']){
     await page.goto(base+route);await page.waitForLoadState('networkidle');assert.equal(await page.locator('.api-notice').count(),0,`API error on ${route}`);
     const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2);assert.equal(overflow,false,`Horizontal overflow on ${route} (${width})`);
     await page.screenshot({path:`screenshots/${name}-${route.replaceAll('/','-')||'home'}.png`,fullPage:true});
   }
 }
 await page.setViewportSize({width:1440,height:1000});await page.goto(base+'/auth');await page.getByRole('button',{name:'Регистрация',exact:true}).click();
 await page.getByLabel('Имя',{exact:true}).fill('Анна');await page.getByLabel('Фамилия',{exact:true}).fill('Тестова');await page.getByLabel('Email',{exact:true}).fill(`browser-${Date.now()}@example.org`);await page.getByLabel('Пароль',{exact:true}).fill('Browser test password 123');
 await page.locator('.consent-gate input[type="checkbox"]').nth(0).check({force:true});await page.locator('.consent-gate input[type="checkbox"]').nth(1).check({force:true});await page.getByRole('button',{name:'Зарегистрироваться',exact:true}).click();await page.waitForURL('**/career/profile');
 await page.goto(base+'/career/resumes');await page.getByRole('button',{name:/Создать резюме/}).click();await page.getByPlaceholder('Название резюме (например: Маркетолог)').fill('Frontend резюме');await page.getByPlaceholder('Целевая позиция').fill('Frontend-разработчик');await page.getByRole('button',{name:'Создать',exact:true}).click();await page.waitForURL('**/career/resumes/*');
 await page.getByLabel('Дата рождения',{exact:true}).fill('2000-02-01');await page.getByLabel('Город',{exact:true}).fill('Воронеж');await page.getByRole('button',{name:/Желаемая работа/}).click();await page.getByLabel('О себе',{exact:true}).fill('Создаю удобные интерфейсы на React и TypeScript. Ищу команду для развития полезных продуктов.');
 await page.getByRole('button',{name:/^3.*Опыт/}).click();await page.getByRole('button',{name:'Добавить опыт',exact:true}).click();await page.getByLabel('Должность / роль',{exact:true}).fill('Разработчик');await page.getByLabel('Компания / проект',{exact:true}).fill('Учебный проект');await page.getByLabel('Начало',{exact:true}).fill('2025-01');await page.getByLabel('Продолжаю работать').check();await page.getByLabel('Задачи',{exact:true}).fill('Создание веб-приложения');await page.getByRole('button',{name:/Сохранить/,exact:false}).first().click();await page.getByRole('status').filter({hasText:'Сохранено'}).waitFor();
 await page.reload();await page.getByRole('button',{name:/^3.*Опыт/}).click();assert.equal(await page.getByLabel('Компания / проект',{exact:true}).inputValue(),'Учебный проект');
 await page.getByRole('button',{name:/Публикация/}).click();const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Скачать PDF',exact:true}).click();const download=await downloadPromise;assert.match(download.suggestedFilename(),/\.pdf$/);assert.equal(await download.failure(),null);
 for(const route of ['/career/profile','/career/resumes','/career/vacancies','/career/applications','/career/tests','/career/favorites','/career/partnership']){await page.goto(base+route);await page.waitForLoadState('networkidle');assert.equal(await page.locator('.api-notice').count(),0,`Career API error on ${route}`);}
 assert.deepEqual(errors,[]);console.log('Browser acceptance passed. Screenshots: tests/browser/screenshots');
}finally{
 await context?.close();await browser?.close();
 if(server&&server.exitCode===null)await new Promise(resolve=>{server.once('exit',resolve);server.kill('SIGTERM');});
 if(tmp)await rm(tmp,{recursive:true,force:true});
}
