import { analyticsRoute } from './analytics/routes.mjs';
import { recordConfirmed, cleanContext } from './analytics/contract.mjs';
import { consentState } from './analytics/consent.mjs';
import { coachingInquiry } from './inquiries.mjs';
import { securityHeaders } from './security-headers.mjs';
import { notFoundHtml } from './not-found.mjs';

const APP = 'https://app.timschneider.ch';
const redirects = new Map([
  ['/konto', APP + '/verwaltung'],
  ['/coach', APP + '/verwaltung'],
  ['/training', APP],
]);
const pages = new Set(['/datenschutz', '/impressum', '/erfolge', '/agb', '/widerruf', '/trainingsplaene']);

function secure(response, request) {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(securityHeaders)) headers.set(name, value);
  const requestPath=new URL(request.url).pathname;
  if(requestPath.startsWith('/internal-analytics')){
    headers.set('Content-Security-Policy',headers.get('Content-Security-Policy').replace("frame-ancestors 'none'","frame-ancestors https://app.timschneider.ch"));
    headers.delete('X-Frame-Options');
    headers.set('Cache-Control','no-store');
    headers.set('X-Robots-Tag','noindex, nofollow');
  }
  if(requestPath==='/api/analytics/report'&&request.headers.get('origin')==='https://app.timschneider.ch'){
    headers.set('Access-Control-Allow-Origin','https://app.timschneider.ch');
    headers.set('Vary','Origin');
  }
  if (response.status === 200 && /^\/assets\/optimized\/[a-z0-9-]+-[a-f0-9]{12}-[0-9]+\.webp$/.test(new URL(request.url).pathname)) {
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  }
  return new Response(request.method === 'HEAD' ? null : response.body, {
    status: response.status, statusText: response.statusText, headers,
  });
}

export default {
  async scheduled(event,env,ctx){
    if(env.ANALYTICS_ENABLED!=='true'||!env.ANALYTICS_DB)return;
    if(event.cron==='17 3 * * *')ctx.waitUntil(env.ANALYTICS_DB.prepare("DELETE FROM events WHERE occurred_at < ?").bind(new Date(Date.now()-90*86400000).toISOString()).run());
    if(event.cron==='*/5 * * * *'&&env.ANALYTICS_MAINTENANCE_SECRET)ctx.waitUntil(fetch('https://hxzycsanrqxbfmveosle.supabase.co/functions/v1/analytics-maintenance',{method:'POST',headers:{Authorization:'Bearer '+env.ANALYTICS_MAINTENANCE_SECRET},redirect:'error',signal:AbortSignal.timeout(90000)}).then(r=>{if(!r.ok)throw Error('analytics_maintenance_unavailable')}));
  },
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
    const canonical = new URL(url);
    if (!local) { canonical.protocol = 'https:'; canonical.host = 'timschneider.ch'; }
    const path = url.pathname.replace(/\/+$/, '') || '/';
    if (path === '/index.html') canonical.pathname = '/';
    else if (pages.has(path)) canonical.pathname = path + '.html';
    else if (pages.has(path.replace(/\.html$/, ''))) canonical.pathname = path;
    if (canonical.href !== url.href) return secure(Response.redirect(canonical.href, 308), request);
    const analyticsResponse = await analyticsRoute(request,env,ctx);
    if(analyticsResponse) return secure(analyticsResponse,request);
    if (path === '/api/coaching-inquiries') {
      let context={}; try{const h=request.headers.get('x-tim-analytics');if(h&&h.length<1000)context=cleanContext(JSON.parse(h));}catch{}
      const onConfirmed = id => {if(!request.headers.has('x-tim-analytics')||typeof id!=='string')return;const task=consentState(request,env).then(s=>s.allowed?recordConfirmed(env,'first_call_submit',id,context):null).catch(()=>{});ctx?.waitUntil?.(task);};
      return secure(await coachingInquiry(request, env, fetch, onConfirmed), request);
    }
    if (!['GET', 'HEAD'].includes(request.method)) {
      return secure(new Response('Methode nicht erlaubt', { status: 405, headers: { Allow: 'GET, HEAD' } }), request);
    }
    if (redirects.has(path)) return secure(Response.redirect(redirects.get(path), 302), request);
    if (path === '/' || pages.has(path)) url.pathname = path === '/' ? '/index.html' : path + '.html';
    const asset = await env.ASSETS.fetch(new Request(url, request));
    if (asset.status !== 404) return secure(asset, request);
    return secure(new Response(notFoundHtml, {
      status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8', 'X-Robots-Tag': 'noindex', 'Cache-Control': 'no-store' },
    }), request);
  },
};
