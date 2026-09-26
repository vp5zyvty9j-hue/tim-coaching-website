import { readdir, readFile, writeFile } from 'node:fs/promises';
const root = new URL('../public/', import.meta.url);
const urls = [];
const titles = new Set(), descriptions = new Set();
for (const file of (await readdir(root)).filter(name => name.endsWith('.html'))) {
  const html = await readFile(new URL(file, root), 'utf8');
  const expected = 'https://timschneider.ch/' + (file === 'index.html' ? '' : file);
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/g) || [];
  if (canonical.length !== 1 || !canonical[0].includes(`href="${expected}"`)) throw Error(`${file}: canonical mismatch`);
  if (!html.includes('href="/favicon.ico"') || !html.includes('href="/favicon-96.png"')) throw Error(`${file}: favicon missing`);
  if (/Brand Logo|Running,Coaching,Individualbetreuung/i.test(html)) throw Error(`${file}: obsolete SEO text`);
  if (!/<meta name="robots" content="[^"]*noindex/.test(html)) urls.push(expected);
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
  if (file === 'index.html' && !html.includes('<title>Tim Schneider Coaching | Individualbetreuung</title>')) throw Error('Unexpected homepage title');
}
urls.sort();
const sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls.map(url => `<url><loc>${url}</loc></url>`).join('\n') + '\n</urlset>\n';
await writeFile(new URL('sitemap.xml', root), sitemap);
const robots = await readFile(new URL('robots.txt', root), 'utf8');
if (!robots.includes('Sitemap: https://timschneider.ch/sitemap.xml') || /^Disallow:\s*\/\s*$/m.test(robots)) throw Error('robots.txt blocks crawling or lacks the sitemap');
console.log(`SEO checked: ${urls.length} indexable canonical pages, sitemap generated, favicon links checked.`);
