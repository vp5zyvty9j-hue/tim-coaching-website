import './prepare-images.mjs';
import './check-seo.mjs';
import './security-headers.mjs';
import { readdir, readFile, access } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = resolve(root, 'public');
let references = 0;
for (const file of await readdir(publicDir)) {
  if (!file.endsWith('.html')) continue;
  const html = await readFile(resolve(publicDir, file), 'utf8');
  const ids = new Set([...html.matchAll(/\bid=["']([^"']+)["']/g)].map(m => m[1]));
  for (const [, raw] of html.matchAll(/\b(?:href|src)=["']([^"']+)["']/g)) {
    if (/^(?:https?:|mailto:|tel:|data:)/.test(raw)) continue;
    if (raw.startsWith('#')) {
      if (!ids.has(raw.slice(1))) throw new Error(`${file}: missing anchor ${raw}`);
      continue;
    }
    const path = decodeURIComponent(raw.split(/[?#]/)[0]).replace(/^\//, '') || 'index.html';
    await access(resolve(publicDir, path));
    const fragment = raw.split('#')[1];
    if (fragment && path.endsWith('.html')) {
      const target = await readFile(resolve(publicDir, path), 'utf8');
      if (!target.includes('id="' + fragment + '"')) throw Error(file + ': missing destination anchor ' + raw);
    }
    references++;
  }
  for (const [, srcset] of html.matchAll(/\bsrcset="([^"]+)"/g)) {
    for (const item of srcset.split(',')) {
      const image = item.trim().split(/\s+/)[0];
      await access(resolve(publicDir, image.replace(/^\//, '')));
    }
  }
  for (const [, json] of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) JSON.parse(json);
}
for (const file of ['public/script.js', 'public/contact.js', 'public/navigation.js', 'worker/index.mjs']) {
  const check = spawnSync(process.execPath, ['--check', resolve(root, file)], { stdio: 'inherit' });
  if (check.status !== 0) process.exit(check.status ?? 1);
}
console.log(`Website checked: HTML, structured data, ${references} local references, JavaScript syntax.`);
