import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { resolve, dirname, extname } from 'node:path';
import { spawnSync } from 'node:child_process';

function listFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = resolve(directory, entry.name);
    return entry.isDirectory() ? listFiles(file) : [file];
  });
}
const files = ['src', 'scripts', 'tests']
  .flatMap(listFiles)
  .filter((file) => /\.(ts|tsx|mjs)$/.test(file));
let checked = 0;
for (const file of files) {
  const text = readFileSync(file, 'utf8');
  for (const match of text.matchAll(/(?:from\s*|import\s*)['"](\.[^'"]+)['"]/g)) {
    const target = resolve(dirname(file), match[1]);
    if (!existsSync(target)) throw new Error('Missing relative import: ' + target);
  }
  if (extname(file) === '.tsx') continue;
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr || 'Syntax check failed: ' + file);
  checked++;
}
console.log(
  'Verified relative imports in ' +
    files.length +
    ' source files; syntax in ' +
    checked +
    ' non-JSX files.',
);
console.log(
  'This does not replace TypeScript checking, dependency resolution, frontend build or browser QA.',
);
