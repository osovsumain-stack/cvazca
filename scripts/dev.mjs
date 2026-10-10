import { spawn, spawnSync } from 'node:child_process';
const build = spawnSync(process.execPath, ['scripts/build-server.mjs'], { stdio: 'inherit' });
if (build.status) process.exit(build.status);
const children = [
  spawn(process.execPath, ['--env-file-if-exists=.env', '--watch', 'server/index.mjs'], { stdio: 'inherit' }),
  spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '0.0.0.0'], { stdio: 'inherit' }),
];
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { children.forEach(c => c.kill(signal)); process.exit(); });
children.forEach(c => c.on('exit', code => { children.forEach(other => { if (other !== c) other.kill(); }); process.exit(code || 0); }));
