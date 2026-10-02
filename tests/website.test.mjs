import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import worker from '../worker/index.mjs';
import { securityHeaders } from '../worker/security-headers.mjs';

const env = { ASSETS: { fetch: async request => { const path = new URL(request.url).pathname; return new Response(path, { status: ['/', '/index.html', '/datenschutz.html', '/impressum.html', '/agb.html', '/widerruf.html', '/erfolge.html', '/empfehlungen.html', '/styles.css', '/print.js', '/assets/tim-lauffinish.png'].includes(path) ? 200 : 404 }); } } };
test('homepage and legal pages resolve to their HTML assets', async () => {
  for (const [path, expected] of [['/', '/index.html'], ['/datenschutz.html', '/datenschutz.html'], ['/impressum.html', '/impressum.html']]) {
    const response = await worker.fetch(new Request('https://timschneider.ch' + path), env);
    assert.equal(response.status, 200);
    assert.equal(await response.text(), expected);
  }
});
test('existing account URLs retain their separate-app destinations', async () => {
  for (const [path, suffix] of [['/konto', '/verwaltung'], ['/coach/', '/verwaltung'], ['/training', '']]) {
    const response = await worker.fetch(new Request('https://timschneider.ch' + path + '?returnTo=https://evil.example'), env);
    assert.equal(response.status, 302);
    assert.equal(response.headers.get('location'), new URL('https://tim-coaching-app.timliam-schneider.chatgpt.site' + suffix).href);
  }
});
test('removed legacy APIs do not accept forged identity headers', async () => {
  const response = await worker.fetch(new Request('https://timschneider.ch/api/athletes', { headers: { 'oai-authenticated-user-email': 'timliam.schneider@gmail.com' } }), env);
  assert.equal(response.status, 404);
});
test('unknown pages return 404 and unsupported methods return 405', async () => {
  assert.equal((await worker.fetch(new Request('https://timschneider.ch/missing'), env)).status, 404);
  assert.equal((await worker.fetch(new Request('https://timschneider.ch/', { method: 'POST' }), env)).status, 405);
});

test('HTTP upgrades before all routing, preserving path and query', async () => {
  for (const path of ['/', '/index.html', '/erfolge', '/styles.css', '/assets/tim-lauffinish.png', '/missing', '/konto']) {
    for (const method of ['GET', 'HEAD']) {
      const response = await worker.fetch(new Request('http://timschneider.ch' + path + '?x=1', { method }), { ASSETS: { fetch() { throw new Error('insecure asset request'); } } });
      assert.equal(response.status, 308);
      assert.equal(response.headers.get('location'), 'https://timschneider.ch' + (path === '/index.html' ? '/' : path === '/erfolge' ? '/erfolge.html' : path) + '?x=1');
    }
  }
});
test('security headers cover pages, assets, redirects, errors and HEAD', async () => {
  for (const path of ['/', '/index.html', '/erfolge', '/empfehlungen', '/agb', '/widerruf', '/styles.css', '/assets/tim-lauffinish.png', '/missing', '/konto']) {
    for (const method of ['GET', 'HEAD', 'POST']) {
      const response = await worker.fetch(new Request('https://timschneider.ch' + path, { method }), env);
      assert.equal(response.headers.get('strict-transport-security'), 'max-age=31536000');
      assert.match(response.headers.get('content-security-policy'), /frame-ancestors 'none'/);
      assert.match(response.headers.get('content-security-policy'), /form-action https:\/\/formsubmit.co/);
      assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
      if (method === 'HEAD') assert.equal(await response.text(), '');
    }
  }
});
test('direct static assets and new aliases remain available', async () => {
  for (const path of ['/', '/styles.css', '/print.js', '/assets/tim-lauffinish.png', '/erfolge.html', '/empfehlungen.html', '/agb.html', '/widerruf.html']) {
    assert.equal((await worker.fetch(new Request('https://timschneider.ch' + path), env)).status, 200);
  }
});
test('conditional asset responses keep cache metadata', async () => {
  const response = await worker.fetch(new Request('https://timschneider.ch/styles.css'), { ASSETS: { fetch: async () => new Response(null, { status: 304, headers: { ETag: '"abc"' } }) } });
  assert.equal(response.status, 304);
  assert.equal(response.headers.get('etag'), '"abc"');
  assert.ok(response.headers.get('content-security-policy'));
});

test('duplicate page URLs and alternate hosts redirect in one hop to the canonical domain', async () => {
  for (const host of ['timschneider.ch', 'www.timschneider.ch', 'tim-coaching-website.example.workers.dev']) {
    for (const [path, target] of [['/index.html', '/'], ['/erfolge/', '/erfolge.html'], ['/empfehlungen', '/empfehlungen.html'], ['/impressum.html/', '/impressum.html'], ['/agb/', '/agb.html'], ['/widerruf', '/widerruf.html']]) {
      const response = await worker.fetch(new Request('https://' + host + path + '?ref=test'), env);
      assert.equal(response.status, 308);
      assert.equal(response.headers.get('location'), 'https://timschneider.ch' + target + '?ref=test');
    }
  }
});

test('missing pages retain real 404 status with noindex and useful navigation', async () => {
  const response = await worker.fetch(new Request('https://timschneider.ch/not-a-page'), env);
  assert.equal(response.status, 404);
  assert.equal(response.headers.get('x-robots-tag'), 'noindex');
  assert.match(response.headers.get('content-type'), /text\/html/);
  assert.match(await response.text(), /href="\/#coaching"/);
});
test('only successful fingerprinted images receive immutable browser caching', async () => {
  const imageEnv = { ASSETS: { fetch: async () => new Response('image', { headers: {ETag:'"photo"'} }) } };
  const response = await worker.fetch(new Request('https://timschneider.ch/assets/optimized/tim-krafttraining-123456abcdef-480.webp'), imageEnv);
  assert.equal(response.headers.get('cache-control'), 'public, max-age=31536000, immutable');
  assert.equal(response.headers.get('etag'), '"photo"');
  const missing = await worker.fetch(new Request('https://timschneider.ch/assets/optimized/missing-123456abcdef-480.webp'), env);
  assert.equal(missing.status, 404);
  assert.equal(missing.headers.get('cache-control'), 'no-store');
  const page = await worker.fetch(new Request('https://timschneider.ch/'), imageEnv);
  assert.notEqual(page.headers.get('cache-control'), 'public, max-age=31536000, immutable');
});

test('AGB and withdrawal pages resolve through both aliases and stay noindex', async () => {
  for (const [path, target] of [['/agb', '/agb.html'], ['/widerruf', '/widerruf.html']]) {
    const redirect = await worker.fetch(new Request('https://timschneider.ch' + path), env);
    assert.equal(redirect.status, 308);
    assert.equal(redirect.headers.get('location'), 'https://timschneider.ch' + target);
  }
  for (const path of ['/agb.html', '/widerruf.html']) {
    const response = await worker.fetch(new Request('https://timschneider.ch' + path), env);
    assert.equal(response.status, 200);
    assert.equal(await response.text(), path);
  }
  for (const page of ['agb.html', 'widerruf.html']) {
    const html = await readFile(new URL('../public/' + page, import.meta.url), 'utf8');
    assert.match(html, /<meta name="robots" content="noindex">/, page + ' must keep the noindex convention');
  }
});

test('footer links to AGB and withdrawal are present on every relevant public page', async () => {
  for (const page of ['index.html', 'erfolge.html', 'empfehlungen.html', 'impressum.html', 'datenschutz.html', 'agb.html', 'widerruf.html']) {
    const html = await readFile(new URL('../public/' + page, import.meta.url), 'utf8');
    assert.match(html, /href="\/agb\.html"/, page + ' lacks the AGB link');
    assert.match(html, /href="\/widerruf\.html"/, page + ' lacks the Widerruf link');
  }
  const notFound = await worker.fetch(new Request('https://timschneider.ch/missing'), env);
  const body = await notFound.text();
  assert.match(body, /href="\/agb\.html"/);
  assert.match(body, /href="\/widerruf\.html"/);
});

test('AGB page carries the full §1–§27 body without the editorial draft preamble', async () => {
  const html = await readFile(new URL('../public/agb.html', import.meta.url), 'utf8');
  for (let number = 1; number <= 27; number += 1) assert.match(html, new RegExp('id="agb-' + number + '"'), 'missing §' + number);
  assert.ok(!/Entwurf zur Prüfung|Nicht veröffentlicht|Redaktioneller Hinweis|Version 0\.2/.test(html));
});

test('withdrawal page keeps the customer-facing text and model form only', async () => {
  const html = await readFile(new URL('../public/widerruf.html', import.meta.url), 'utf8');
  assert.match(html, /Muster-Widerrufsformular/);
  assert.match(html, /binnen vierzehn Tagen/);
  assert.ok(!/Hinweise für die Freigabe|BLOCKER|Gesonderte Erklärungen|Quellen für diesen Entwurf|nicht veröffentlicht/.test(html));
});

test('legal pages print action stays CSP-compatible and JS-free without scripting', async () => {
  for (const page of ['agb.html', 'widerruf.html']) {
    const html = await readFile(new URL('../public/' + page, import.meta.url), 'utf8');
    assert.match(html, /<script src="\/print\.js" defer><\/script>/, page + ' lacks the external print script');
    assert.ok(!/<[a-z][^>]*\son[a-z]+\s*=/i.test(html), page + ' must not use inline event handlers');
    assert.ok(!/javascript:/i.test(html), page + ' must not use javascript: URLs');
    assert.ok(!/<style\b/i.test(html), page + ' must not use inline styles');
  }
  const csp = securityHeaders['Content-Security-Policy'];
  assert.match(csp, /script-src 'self'/);
  assert.match(csp, /style-src 'self'/);
});
