import { readFile, writeFile } from 'node:fs/promises';

// This script publishes only the evaluation login, never service credentials.
const password = process.env.DEMO_PASSWORD;
if (!password || password.length < 12) {
  throw new Error('Set DEMO_PASSWORD to at least 12 characters in .env first.');
}

const privateValues = [process.env.GEMINI_API_KEY];
for (const name of ['DATABASE_URL', 'DATABASE_URL_UNPOOLED', 'DATABASE_URL_POOLED']) {
  const value = process.env[name];
  if (!value) continue;
  privateValues.push(value, decodeURIComponent(new URL(value).password));
}
if (privateValues.some((value) => value && value === password)) {
  throw new Error('The demo password must differ from private service credentials.');
}

const readmeUrl = new URL('../README.md', import.meta.url);
const readme = await readFile(readmeUrl, 'utf8');
const marker = /<!-- DEMO_PASSWORD_START -->[\s\S]*?<!-- DEMO_PASSWORD_END -->/;
if (!marker.test(readme)) throw new Error('README demo password section is missing.');

const escapedPassword = password
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('\n', '&#10;')
  .replaceAll('\r', '&#13;');
const section = [
  '<!-- DEMO_PASSWORD_START -->',
  '**Hosted evaluation password:** <code>' + escapedPassword + '</code>',
  '<!-- DEMO_PASSWORD_END -->',
].join('\n');
await writeFile(
  readmeUrl,
  readme.replace(marker, () => section),
);
console.info(
  'README now includes the configured evaluation password. Database accounts were not changed.',
);
