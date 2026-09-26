import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/index.mjs';

const env = { ASSETS: { fetch: async request => { const path = new URL(request.url).pathname; return new Response(path, { status: ['/', '/index.html', '/datenschutz.html', '/impressum.html', '/erfolge.html', '/empfehlungen.html', '/styles.css', '/assets/tim-lauffinish.png'].includes(path) ? 200 : 404 }); } } };
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
  for (const path of ['/', '/index.html', '/erfolge', '/empfehlungen', '/styles.css', '/assets/tim-lauffinish.png', '/missing', '/konto']) {
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
  for (const path of ['/', '/styles.css', '/assets/tim-lauffinish.png', '/erfolge.html', '/empfehlungen.html']) {
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
    for (const [path, target] of [['/index.html', '/'], ['/erfolge/', '/erfolge.html'], ['/empfehlungen', '/empfehlungen.html'], ['/impressum.html/', '/impressum.html']]) {
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
