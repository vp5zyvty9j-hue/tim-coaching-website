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
