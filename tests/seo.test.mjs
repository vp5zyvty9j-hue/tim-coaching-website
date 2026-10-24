import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { securityHeaders } from '../worker/security-headers.mjs';

const read = name => readFile(new URL('../' + name, import.meta.url), 'utf8');
const names = ['index.html', 'erfolge.html', 'trainingsplaene.html'];
const pages = Object.fromEntries(await Promise.all(names.map(async name => [name, await read('public/' + name)])));
const schemas = html => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap(m => {
  const schema = JSON.parse(m[1]);
  return schema['@graph'] ?? [schema];
});
const decode = text => text.replaceAll('&amp;', '&');

test('indexable pages expose consistent titles, canonicals, dates and CSP-authorised JSON-LD', async () => {
  const sitemap = await read('public/sitemap.xml');
  const dates = JSON.parse(await read('scripts/seo-page-dates.json'));
  for (const [name, html] of Object.entries(pages)) {
    const url = 'https://timschneider.ch/' + (name === 'index.html' ? '' : name);
    const title = decode(html.match(/<title>(.*?)<\/title>/)[1]);
    assert.match(html, /<html lang="de-CH">/);
    assert.equal((html.match(/<h1\b[^>]*>/g) || []).length, 1);
    assert.ok(html.includes(`rel="canonical" href="${url}"`));
    const page = schemas(html).find(s => ['WebPage', 'AboutPage', 'CollectionPage'].includes(s['@type']));
    assert.equal(page.name, title);
    assert.equal(page.url, url);
    assert.equal(page.inLanguage, 'de-CH');
    assert.equal(page.dateModified, dates[name]);
    assert.ok(sitemap.includes(`<loc>${url}</loc><lastmod>${dates[name]}</lastmod>`));
    for (const [, json] of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
      assert.ok(securityHeaders['Content-Security-Policy'].includes("'sha256-" + createHash('sha256').update(json).digest('base64') + "'"));
    }
  }
  assert.equal((sitemap.match(/<loc>/g) || []).length, 3);
  assert.doesNotMatch(sitemap, /impressum|datenschutz|agb|widerruf|internal-analytics/);
});

test('training-plan schema describes the five actual distance groups and visible breadcrumb', () => {
  const html = pages['trainingsplaene.html'];
  const graph = schemas(html);
  const list = graph.find(s => s['@type'] === 'ItemList');
  assert.equal(list.numberOfItems, 5);
  assert.equal(list.itemListElement.length, 5);
  for (const [i, item] of list.itemListElement.entries()) {
    assert.equal(item.position, i + 1);
    assert.ok(html.includes(`id="${new URL(item.url).hash.slice(1)}"`));
    assert.ok(html.includes(`href="${new URL(item.url).hash}"`));
  }
  const breadcrumb = graph.find(s => s['@type'] === 'BreadcrumbList');
  assert.deepEqual(breadcrumb.itemListElement.map(i => i.name), ['Startseite', 'Trainingspläne']);
  const visibleBreadcrumb = html.match(/<nav class="breadcrumbs"[^>]*>([\s\S]*?)<\/nav>/)?.[1];
  assert.ok(visibleBreadcrumb);
  assert.match(visibleBreadcrumb, /href="\/">Startseite<\/a>/);
  assert.match(visibleBreadcrumb, /aria-current="page">Trainingspläne<\/span>/);
  assert.doesNotMatch(JSON.stringify(graph), /"(?:Product|Offer|AggregateRating|Review|LocalBusiness|FAQPage)"/);
});

test('hero delivery variants keep source dimensions, avoid lazy LCP images and reduce payload', async () => {
  const images = [...pages['index.html'].matchAll(/<img\b[^>]*data-responsive="hero-([^"]+)"[^>]*>/g)];
  assert.equal(images.length, 3);
  let originalBytes = 0, deliveredBytes = 0;
  for (const [, key] of images) originalBytes += (await stat(new URL(`../public/assets/hero-diagonal/${key}-full.webp`, import.meta.url))).size;
  for (const [tag] of images) {
    assert.doesNotMatch(tag, /loading="lazy"/);
    assert.match(tag, /fetchpriority="high"/);
    const src = tag.match(/\ssrc="([^"]+)"/)[1];
    assert.match(src, /^\/assets\/optimized\/hero-[a-z]+-[a-f0-9]{12}-\d+\.webp$/);
    deliveredBytes += (await stat(new URL('../public' + src, import.meta.url))).size;
    assert.ok(tag.includes('320w') && tag.includes('480w'));
    const candidates = tag.match(/srcset="([^"]+)"/)[1].split(', ');
    assert.equal(new Set(candidates).size, candidates.length);
    const maximum = Math.max(...candidates.map(candidate => Number(candidate.split(' ')[1].replace('w', ''))));
    assert.equal(Number(src.match(/-(\d+)\.webp$/)[1]), maximum, 'byte comparison must use the largest candidate');
    for (const candidate of candidates) {
      const [path, width] = candidate.split(' ');
      const metadata = await sharp(new URL('../public' + path, import.meta.url).pathname).metadata();
      assert.equal(metadata.width, Number(width.replace('w', '')), 'srcset descriptor must match actual image width');
    }
  }
  assert.ok(deliveredBytes < originalBytes * 0.3, 'largest hero delivery set should be at least 70% smaller');
});
