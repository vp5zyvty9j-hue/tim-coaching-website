import sharp from 'sharp';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const path = name => fileURLToPath(new URL('../public/assets/' + name, import.meta.url));
const source = path('tim-lauffinish.png');
// Preserve every source pixel. No retouching, sharpening or synthetic detail.
await sharp(source).webp({ lossless: true, effort: 6 }).toFile(path('tim-lauffinish.webp'));
assert.deepEqual(await sharp(source).raw().toBuffer(), await sharp(path('tim-lauffinish.webp')).raw().toBuffer());
for (const width of [400, 720]) {
  await sharp(source).resize({ width, withoutEnlargement: true }).webp({ lossless: true, effort: 6 }).toFile(path(`tim-lauffinish-${width}.webp`));
}
console.log('100-km photo: pixel-identical full-size WebP and responsive variants prepared.');

// Responsive derivatives of the existing photographs; originals stay untouched.
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const optimized = new URL('../public/assets/optimized/', import.meta.url);
await mkdir(optimized, { recursive: true });
const sources = [
  ['tim-krafttraining.jpg', [480, 768, 1154]],
  ['tim-laufen.jpg', [400, 720, 1080]],
  ['tim-gym.jpg', [400, 720, 1080]],
  ['tim-winterlauf.jpg', [400, 720, 1080]],
  ['tim-heute-freigegeben.png', [400, 720, 1086]],
  ['tim-schneider-logo.png', [256, 512]],
];
const manifests = {};
for (const [name, widths] of sources) {
  const source = path(name), meta = await sharp(source).metadata();
  const version = createHash('sha256').update(await readFile(source)).update('responsive-v1-sharp-0.35.4').digest('hex').slice(0, 12);
  const stem = name.replace(/\.[^.]+$/, '');
  const outputs = [];
  for (const requested of widths) {
    const width = Math.min(requested, meta.width);
    const filename = stem + '-' + version + '-' + width + '.webp';
    await sharp(source).resize({ width, withoutEnlargement: true }).webp(name.endsWith('.png') ? { lossless: true, effort: 6 } : { quality: 92, effort: 6 }).toFile(fileURLToPath(new URL(filename, optimized)));
    outputs.push({ width, url: '/assets/optimized/' + filename });
  }
  manifests[stem] = { width: meta.width, height: meta.height, outputs };
}
const publicDir = new URL('../public/', import.meta.url);
for (const name of await readdir(publicDir)) {
  if (!name.endsWith('.html')) continue;
  let html = await readFile(new URL(name, publicDir), 'utf8');
  html = html.replace(/<img\b[^>]*data-responsive="([^"]+)"[^>]*>/g, (tag, key) => {
    const m = manifests[key];
    if (!m) throw Error('Unknown responsive image ' + key);
    const set = (attr, value) => {
      const pattern = new RegExp('\\s' + attr + '="[^"]*"');
      tag = pattern.test(tag) ? tag.replace(pattern, ' ' + attr + '="' + value + '"') : tag.replace('>', ' ' + attr + '="' + value + '">');
    };
    set('src', m.outputs.at(-1).url);
    set('srcset', m.outputs.map(o => o.url + ' ' + o.width + 'w').join(', '));
    set('width', m.width); set('height', m.height);
    return tag;
  });
  await writeFile(new URL(name, publicDir), html);
}
console.log('Responsive photographs and logo generated from committed source images.');
