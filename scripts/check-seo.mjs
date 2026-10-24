import { readdir, readFile, writeFile } from 'node:fs/promises';
const root = new URL('../public/', import.meta.url);
const urls = [];
const titles = new Set(), descriptions = new Set();
// Maintain dates only when page content, links or structured data change.
// Build time and file mtimes must never manufacture fresh modification dates.
const pageDates = JSON.parse(await readFile(new URL('seo-page-dates.json', import.meta.url), 'utf8'));
for (const file of (await readdir(root)).filter(name => name.endsWith('.html'))) {
  const html = await readFile(new URL(file, root), 'utf8');
  const expected = 'https://timschneider.ch/' + (file === 'index.html' ? '' : file);
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/g) || [];
  if (canonical.length !== 1 || !canonical[0].includes(`href="${expected}"`)) throw Error(`${file}: canonical mismatch`);
  if (!html.includes('href="https://timschneider.ch/favicon.ico"') || !html.includes('href="https://timschneider.ch/favicon-96.png"')) throw Error(`${file}: favicon missing`);
  if (/Brand Logo|Running,Coaching,Individualbetreuung/i.test(html)) throw Error(`${file}: obsolete SEO text`);
  if (!/<meta name="robots" content="[^"]*noindex/.test(html)) {
    const lastmod = pageDates[file];
    const timestamp = Date.parse(lastmod);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(lastmod ?? '') || !Number.isFinite(timestamp) || new Date(timestamp).toISOString().slice(0, 10) !== lastmod || lastmod > new Date().toISOString().slice(0, 10)) throw Error(`${file}: invalid or future lastmod`);
    const pageData = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
      .flatMap(([, json]) => JSON.parse(json)['@graph'] ?? [])
      .find(node => ['WebPage', 'AboutPage', 'CollectionPage'].includes(node['@type']) && node.url === expected);
    if (pageData?.dateModified !== lastmod) throw Error(`${file}: dateModified and sitemap lastmod differ`);
    urls.push({ url: expected, lastmod });
  }
  const headingLevels = [...html.matchAll(/<h([1-6])(?:\s[^>]*)?>/g)].map(m => Number(m[1]));
  if (headingLevels.filter(level => level === 1).length !== 1) throw Error(file + ': expected one H1');
  for (let i = 1; i < headingLevels.length; i++) if (headingLevels[i] > headingLevels[i - 1] + 1) throw Error(file + ': skipped heading level');
  for (const [, img] of html.matchAll(/<img\b([^>]*)>/g)) {
    if (!/\balt="[^"]*"/.test(img) || !/\bwidth="\d+"/.test(img) || !/\bheight="\d+"/.test(img)) throw Error(file + ': image lacks alt text or dimensions');
  }
  if (!html.includes('content="noindex"')) {
    const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
    const description = html.match(/<meta name="description" content="([^"]+)"/)?.[1];
    if (!title || titles.has(title) || !description || descriptions.has(description)) throw Error(file + ': missing or duplicate metadata');
    titles.add(title); descriptions.add(description);
    if (!html.includes('property="og:title" content="' + title + '"') || !html.includes('property="og:description" content="' + description + '"')) throw Error(file + ': social metadata differs');
  }
  if (file === 'index.html' && !html.includes('<title>Online Coaching Schweiz: Laufen &amp; Kraft | Tim Schneider</title>')) throw Error('Unexpected homepage title');
}
urls.sort((a, b) => a.url.localeCompare(b.url));
const sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls.map(({ url, lastmod }) => `<url><loc>${url}</loc><lastmod>${lastmod}</lastmod></url>`).join('\n') + '\n</urlset>\n';
await writeFile(new URL('sitemap.xml', root), sitemap);
const robots = await readFile(new URL('robots.txt', root), 'utf8');
if (!robots.includes('Sitemap: https://timschneider.ch/sitemap.xml') || /^Disallow:\s*\/\s*$/m.test(robots)) throw Error('robots.txt blocks crawling or lacks the sitemap');
console.log(`SEO checked: ${urls.length} indexable canonical pages, sitemap generated, favicon links checked.`);
