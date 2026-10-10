import ts from 'typescript';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const seen = new Set();
async function compile(relative) {
  if (seen.has(relative)) return;
  seen.add(relative);
  const source = await readFile(path.join(root, relative), 'utf8');
  let output = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
  output = output.replaceAll('import.meta.env', '({ SSR: true, DEV: false })');
  const dependencies = [];
  output = output.replace(/(from\s+['"])([@.][^'"]+)(['"])/g, (_, prefix, spec, suffix) => {
    const dep = spec.startsWith('@/') ? spec.slice(2) : path.posix.normalize(path.posix.join(path.posix.dirname(relative), spec));
    const sourceDep = dep.endsWith('.ts') ? dep : `${dep}.ts`;
    dependencies.push(sourceDep);
    let dest = path.posix.relative(path.posix.dirname(relative), sourceDep).replace(/\.ts$/, '.js');
    if (!dest.startsWith('.')) dest = `./${dest}`;
    return prefix + dest + suffix;
  });
  const destination = path.join(root, 'server/generated', relative.replace(/\.ts$/, '.js'));
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, output);
  await Promise.all(dependencies.map(compile));
}
await Promise.all(['repositories/mockRepositories.ts', 'repositories/featureRepositories.ts', 'repositories/journeyRepository.ts', 'services/targetAdsPricingService.ts', 'services/moneyInvariantTests.ts', 'pdf.ts'].map(compile));
console.log(`Server domain modules: ${seen.size}`);
