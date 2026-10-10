import { db, collection, saveCollection } from '../server/storage.mjs';
const [email,action='grant']=process.argv.slice(2);
if(!email||!['grant','revoke'].includes(action)){console.error('Usage: npm run admin -- user@example.org [grant|revoke]');process.exit(1);}
const account=collection('svyazka_dev_accounts').find(a=>a.email?.toLowerCase()===email.toLowerCase());
if(!account){console.error('Сначала зарегистрируйте этот аккаунт.');process.exit(1);}
let assignments=collection('svyazka_dev_roles').filter(r=>!(r.accountId===account.id&&r.role==='admin'));
if(action==='grant')assignments.push({id:crypto.randomUUID(),accountId:account.id,role:'admin',createdAt:new Date().toISOString()});
saveCollection('svyazka_dev_roles',assignments);
db.prepare('INSERT INTO audit(account_id,action) VALUES(?,?)').run(account.id,`admin.cli.${action}`);
console.log(`Права администратора ${action==='grant'?'назначены':'отозваны'}: ${account.displayName}`);db.close();
