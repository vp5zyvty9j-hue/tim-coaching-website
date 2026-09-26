import { securityHeaders } from './security-headers.mjs';

const APP = 'https://tim-coaching-app.timliam-schneider.chatgpt.site';
const redirects = new Map([
  ['/konto', APP + '/verwaltung'],
  ['/coach', APP + '/verwaltung'],
  ['/training', APP],
]);
const pages = new Set(['/datenschutz', '/impressum', '/erfolge', '/empfehlungen']);

function secure(response, request) {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(securityHeaders)) headers.set(name, value);
  return new Response(request.method === 'HEAD' ? null : response.body, {
    status: response.status, statusText: response.statusText, headers,
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    // Local Wrangler development remains available over HTTP.
    if (url.protocol === 'http:' && !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) {
      url.protocol = 'https:';
      return secure(Response.redirect(url.href, 308), request);
    }
    if (!['GET', 'HEAD'].includes(request.method)) {
      return secure(new Response('Methode nicht erlaubt', { status: 405, headers: { Allow: 'GET, HEAD' } }), request);
    }
    const path = url.pathname.replace(/\/+$/, '') || '/';
    if (redirects.has(path)) return secure(Response.redirect(redirects.get(path), 302), request);
    if (path === '/' || pages.has(path)) url.pathname = path === '/' ? '/index.html' : path + '.html';
    const asset = await env.ASSETS.fetch(new Request(url, request));
    if (asset.status !== 404) return secure(asset, request);
    return secure(new Response('Seite nicht gefunden', {
      status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    }), request);
  },
};
