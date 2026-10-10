import { DatabaseSync } from 'node:sqlite';
import { AsyncLocalStorage } from 'node:async_hooks';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

export const context = new AsyncLocalStorage();
const filename = process.env.DB_PATH || 'data/platform.sqlite';
if (filename !== ':memory:') mkdirSync(path.dirname(filename), { recursive: true });
export const db = new DatabaseSync(filename);
db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
  CREATE TABLE IF NOT EXISTS records(key TEXT PRIMARY KEY, value TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS credentials(email TEXT PRIMARY KEY, account_id TEXT UNIQUE NOT NULL, hash TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY, account_id TEXT NOT NULL, expires_at INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS audit(id INTEGER PRIMARY KEY AUTOINCREMENT, account_id TEXT, action TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
`);
const read = db.prepare('SELECT value FROM records WHERE key=?');
const write = db.prepare('INSERT INTO records(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value');
const erase = db.prepare('DELETE FROM records WHERE key=?');
const scoped = new Set(['career-journey-v3', 'career-journey-profile-id', 'media_plan', 'project_draft_source']);
const storageKey = key => scoped.has(key) ? `${context.getStore()?.scope || 'system'}:${key}` : key;
export const storage = {
  getItem(key) {
    if (key === 'svyazka_platform_session') {
      const ctx = context.getStore();
      return ctx?.account ? JSON.stringify({ accountId: ctx.account.id, roles: ctx.roles, expiresAt: new Date(ctx.expiresAt).toISOString() }) : null;
    }
    return read.get(storageKey(key))?.value ?? null;
  },
  setItem(key, value) { if (key !== 'svyazka_platform_session') write.run(storageKey(key), String(value)); },
  removeItem(key) { erase.run(storageKey(key)); },
};
globalThis.localStorage = storage;
globalThis.sessionStorage = storage;
export function collection(key) { return JSON.parse(storage.getItem(key) || '[]'); }
export function saveCollection(key, data) { storage.setItem(key, JSON.stringify(data)); }
export function profileFor(accountId) { return JSON.parse(read.get(`${accountId}:career-journey-v3`)?.value || 'null')?.profile || null; }
export function saveProfileFor(accountId, profile) {
  const key = `${accountId}:career-journey-v3`;
  const state = JSON.parse(read.get(key)?.value || '{}');
  write.run(key, JSON.stringify({ ...state, profile }));
}
export function migrateGuest(guest, accountId) {
  for (const key of ['media_plan', 'project_draft_source']) {
    const value = read.get(`${guest}:${key}`)?.value;
    if (value && !read.get(`${accountId}:${key}`)) write.run(`${accountId}:${key}`, value);
    erase.run(`${guest}:${key}`);
  }
}
