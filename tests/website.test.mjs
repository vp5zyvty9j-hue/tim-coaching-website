import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/index.mjs';

const env = { ASSETS: { fetch: async request => new Response(new URL(request.url).pathname) } };
test('homepage and legal pages resolve to their HTML assets', async () => {
  for (const [path, expected] of [['/', '/index.html'], ['/datenschutz', '/datenschutz.html'], ['/impressum/', '/impressum.html']]) {
    const response = await worker.fetch(new Request('https://example.com' + path), env);
    assert.equal(response.status, 200);
    assert.equal(await response.text(), expected);
  }
});
test('existing account URLs retain their separate-app destinations', async () => {
  for (const [path, suffix] of [['/konto', '/verwaltung'], ['/coach/', '/verwaltung'], ['/training', '']]) {
    const response = await worker.fetch(new Request('https://example.com' + path + '?returnTo=https://evil.example'), env);
    assert.equal(response.status, 302);
    assert.equal(response.headers.get('location'), new URL('https://tim-coaching-app.timliam-schneider.chatgpt.site' + suffix).href);
  }
});
test('removed legacy APIs do not accept forged identity headers', async () => {
  const response = await worker.fetch(new Request('https://example.com/api/athletes', { headers: { 'oai-authenticated-user-email': 'timliam.schneider@gmail.com' } }), env);
  assert.equal(response.status, 404);
});
test('unknown pages return 404 and unsupported methods return 405', async () => {
  assert.equal((await worker.fetch(new Request('https://example.com/missing'), env)).status, 404);
  assert.equal((await worker.fetch(new Request('https://example.com/', { method: 'POST' }), env)).status, 405);
});
