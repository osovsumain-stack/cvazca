import { DatabaseSync, backup } from 'node:sqlite';
import { mkdirSync } from 'node:fs';import path from 'node:path';
const destination=process.argv[2];if(!destination){console.error('Usage: npm run backup -- ./backups/platform.sqlite');process.exit(1);}
const source=process.env.DB_PATH||'data/platform.sqlite';if(path.resolve(source)===path.resolve(destination))throw new Error('Путь резервной копии должен отличаться от пути базы');
mkdirSync(path.dirname(destination),{recursive:true});const db=new DatabaseSync(source,{readOnly:true});await backup(db,destination);db.close();console.log('Резервная копия сохранена:',path.resolve(destination));
