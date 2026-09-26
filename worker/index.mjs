const APP = 'https://tim-coaching-app.timliam-schneider.chatgpt.site';
const redirects = new Map([
  ['/konto', APP + '/verwaltung'],
  ['/coach', APP + '/verwaltung'],
  ['/training', APP],
]);

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';
    if (!['GET', 'HEAD'].includes(request.method)) {
      return new Response('Methode nicht erlaubt', { status: 405, headers: { Allow: 'GET, HEAD' } });
    }
    if (redirects.has(path)) return Response.redirect(redirects.get(path), 302);
    if (path === '/' || path === '/datenschutz' || path === '/impressum') {
      url.pathname = path === '/' ? '/index.html' : path + '.html';
      return env.ASSETS.fetch(new Request(url, request));
    }
    return new Response(request.method === 'HEAD' ? null : 'Seite nicht gefunden', {
      status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  },
};
