import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

test('backup: online SQLite copy restores committed WAL records; refuses same path',()=>{
  const dir=mkdtempSync(path.join(os.tmpdir(),'svyazka-backup-'));
  const source=path.join(dir,'source.sqlite'), destination=path.join(dir,'copy.sqlite');
  const db=new DatabaseSync(source);
  try {
    db.exec("PRAGMA journal_mode=WAL;CREATE TABLE records(key TEXT PRIMARY KEY,value TEXT);INSERT INTO records VALUES('profile','Резюме сохранено')");
    const run=spawnSync(process.execPath,['scripts/backup.mjs',destination],{env:{...process.env,DB_PATH:source},encoding:'utf8',timeout:15000});
    assert.equal(run.status,0,run.stderr);
    const restored=new DatabaseSync(destination,{readOnly:true});
    assert.equal(restored.prepare('SELECT value FROM records WHERE key=?').get('profile').value,'Резюме сохранено');
    assert.equal(restored.prepare('PRAGMA integrity_check').get().integrity_check,'ok');restored.close();
    const bad=spawnSync(process.execPath,['scripts/backup.mjs',source],{env:{...process.env,DB_PATH:source},encoding:'utf8',timeout:15000});
    assert.notEqual(bad.status,0);
  }finally{db.close();rmSync(dir,{recursive:true,force:true});}
});
