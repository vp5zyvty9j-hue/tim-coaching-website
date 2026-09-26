import { readdir, readFile, writeFile } from 'node:fs/promises';
const root = new URL('../public/', import.meta.url);
const urls = [];
for (const file of (await readdir(root)).filter(name => name.endsWith('.html'))) {
  const html = await readFile(new URL(file, root), 'utf8');
  const expected = 'https://timschneider.ch/' + (file === 'index.html' ? '' : file);
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/g) || [];
  if (canonical.length !== 1 || !canonical[0].includes(`href="${expected}"`)) throw Error(`${file}: canonical mismatch`);
  if (!html.includes('href="/favicon.ico"') || !html.includes('href="/favicon-96.png"')) throw Error(`${file}: favicon missing`);
  if (/Brand Logo|Running,Coaching,Individualbetreuung/i.test(html)) throw Error(`${file}: obsolete SEO text`);
  if (!/<meta name="robots" content="[^"]*noindex/.test(html)) urls.push(expected);
  if (file === 'index.html' && !html.includes('<title>Tim Schneider Coaching | Individualbetreuung</title>')) throw Error('Unexpected homepage title');
}
urls.sort();
const sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls.map(url => `<url><loc>${url}</loc></url>`).join('\n') + '\n</urlset>\n';
await writeFile(new URL('sitemap.xml', root), sitemap);
const robots = await readFile(new URL('robots.txt', root), 'utf8');
if (!robots.includes('Sitemap: https://timschneider.ch/sitemap.xml') || /^Disallow:\s*\/\s*$/m.test(robots)) throw Error('robots.txt blocks crawling or lacks the sitemap');
console.log(`SEO checked: ${urls.length} indexable canonical pages, sitemap generated, favicon links checked.`);
