import { db } from './storage.mjs';
import { fail } from './policy.mjs';
export async function lookup(type,query){
 if(type==='bank'?!/^\d{9}$/.test(query):!/^\d{10}(\d{2})?$/.test(query))fail(type==='bank'?'БИК должен содержать 9 цифр':'ИНН должен содержать 10 или 12 цифр',400);
 const key=`dadata:${type}:${query}`,cached=db.prepare('SELECT value FROM records WHERE key=?').get(key);
 if(cached){const c=JSON.parse(cached.value);if(c.expires>Date.now())return c.result;}
 if(!process.env.DADATA_API_KEY)fail('Автозаполнение не подключено. Заполните данные вручную.',503);
 const response=await fetch(`https://suggestions.dadata.ru/suggestions/api/4_1/rs/findById/${type==='bank'?'bank':'party'}`,{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json',Authorization:`Token ${process.env.DADATA_API_KEY}`},body:JSON.stringify({query,...(type==='bank'?{}:{branch_type:'MAIN'})}),signal:AbortSignal.timeout(15000)});
 if(!response.ok)fail('Сервис автозаполнения недоступен. Заполните данные вручную.',response.status===429?429:503);
 const data=await response.json(),s=data?.suggestions?.[0]?.data;
 if(!s)fail(type==='bank'?'Банк не найден':'Организация не найдена',404);
 const result=type==='bank'?{bankName:s.name?.payment||s.name?.full||'',bik:s.bik||query,correspondentAccount:s.correspondent_account||'',status:s.state?.status||null}:{entityType:s.type==='INDIVIDUAL'?'INDIVIDUAL':'LEGAL',inn:s.inn||'',kpp:s.kpp||'',ogrn:s.ogrn||'',ogrnip:s.type==='INDIVIDUAL'?s.ogrn||'':'',fullName:s.name?.full_with_opf||'',shortName:s.name?.short_with_opf||'',legalAddress:s.address?.unrestricted_value||s.address?.value||'',signatoryFullName:s.management?.name||'',signatoryPosition:s.management?.post||'',okved:s.okved||'',organizationStatus:s.state?.status||null,branchType:s.branch_type||'MAIN'};
 db.prepare('INSERT INTO records VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run(key,JSON.stringify({result,expires:Date.now()+(type==='bank'?7:1)*86400000}));return result;
}
