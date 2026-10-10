import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import os from 'node:os';import path from 'node:path';import { spawnSync } from 'node:child_process';
import { createResumePDF } from '../server/generated/pdf.js';
test('PDF: Cyrillic, selected sections and long experience produce valid multipage document',async()=>{
 const pdf=createResumePDF({fullName:'Анна Тестова',position:'Frontend-разработчик',about:'Разрабатываю интерфейсы на React.',desiredSalary:80000,employmentTypes:['Полная занятость'],workFormats:['Удалённо'],portfolioLinks:['https://example.org/portfolio'],contacts:{email:'test@example.org',phone:'',city:'Воронеж',telegram:''},education:[{id:'edu',place:'Воронежский государственный университет',degree:'Информатика',period:'2025'}],experience:Array.from({length:20},(_,i)=>({id:String(i),role:'Разработчик интерфейсов',description:'Создала полезный сервис. '.repeat(10),skills:['React'],source:'Учебный проект',period:'2024 — 2025'})),skills:[{name:'TypeScript',level:0,source:'manual'}],languages:[{name:'Русский',level:'Родной'}],achievements:[],tests:[]});
 assert.ok(pdf.getNumberOfPages()>1);const bytes=Buffer.from(pdf.output('arraybuffer'));assert.equal(bytes.subarray(0,5).toString(),'%PDF-');const tmp=await mkdtemp(path.join(os.tmpdir(),'svyazka-pdf-')),file=path.join(tmp,'resume.pdf');await writeFile(file,bytes);
 // Extraction is an additional assertion when Poppler is available, not a runtime dependency.
 const extract=spawnSync('pdftotext',[file,'-'],{encoding:'utf8'});if(!extract.error){assert.equal(extract.status,0);assert.match(extract.stdout,/Анна Тестова/);assert.match(extract.stdout,/Воронежский государственный университет/);assert.match(extract.stdout,/Разработчик интерфейсов/);assert.doesNotMatch(extract.stdout,/TypeScript — 0%/);assert.match(extract.stdout,/ПОРТФОЛИО/);assert.match(extract.stdout,/https:\/\/example.org\/portfolio/);assert.match(extract.stdout,/80\s?000/);}
});
