import test from 'node:test';import assert from 'node:assert/strict';
import {consentState,consentCookie} from '../worker/analytics/consent.mjs';
import {isAppAnalyticsAdmin} from '../worker/analytics/app-access.mjs';
import {analyticsRoute} from '../worker/analytics/routes.mjs';
import {PLAN_ALIASES} from '../public/analytics-plan-aliases.mjs';
import {canonicalPlan,recordConfirmed,CATALOG} from '../worker/analytics/contract.mjs';
import {localDB} from './helpers/analytics-db.mjs';
const env={ANALYTICS_HASH_SECRET:'isolated-preference-key',ANALYTICS_APP_AUTH:'true'};
const request=(country,headers={})=>Object.assign(new Request('https://timschneider.ch/api/analytics/config',{headers}),{cf:{country}});
test('All regions incl. CH, US, unknown, XX and T1 are off without a choice',async()=>{
 for(const c of ['CH','DE','FR','AT','NO','GB','US','BR','JP',undefined,'XX','T1']){const s=await consentState(request(c),env);assert.equal(s.allowed,false,String(c));assert.equal(s.required,true);assert.equal(s.choice,'none')}
 assert.equal((await consentState(new Request('https://timschneider.ch/api/analytics/config'),env)).allowed,false);
});
test('Valid signed allow turns analytics on in every region',async()=>{
 const header=(await consentCookie('allow',env)).split(';')[0];
 for(const c of ['CH','DE','US','BR',undefined,'XX','T1']){const s=await consentState(request(c,{cookie:header}),env);assert.equal(s.allowed,true,String(c));assert.equal(s.choice,'allow')}
});
test('Localhost-only preview keeps its non-required behavior',async()=>{
 assert.equal((await consentState(request('CH'),env,true)).allowed,true);
 assert.equal((await consentState(request('CH',{cookie:(await consentCookie('deny',env)).split(';')[0]}),env,true)).allowed,false);
});
test('Signed preference contains no visitor identity; deny, expiry, forgery, DNT and GPC enforced',async()=>{
 const now=Date.UTC(2026,9,18,12),cookie=await consentCookie('allow',env,now),header=cookie.split(';')[0];
 assert.equal(cookie,await consentCookie('allow',env,now+1000));assert.ok(cookie.includes('HttpOnly'));assert.ok(cookie.includes('Max-Age='+180*86400));
 for(const c of ['DE','CH','US','XX','T1',undefined]){
  assert.equal((await consentState(request(c,{cookie:header}),env,false,now)).allowed,true);
  assert.equal((await consentState(request(c,{cookie:header+'a'}),env,false,now)).allowed,false);
  const flipped=header.slice(0,-1)+(header.endsWith('0')?'1':'0');assert.equal((await consentState(request(c,{cookie:flipped}),env,false,now)).allowed,false);
  assert.equal((await consentState(request(c,{cookie:header,'sec-gpc':'1'}),env,false,now)).allowed,false);
  assert.equal((await consentState(request(c,{cookie:header,dnt:'1'}),env,false,now)).allowed,false);
  assert.equal((await consentState(request(c,{cookie:header}),env,false,now+181*86400000)).allowed,false);
  assert.equal((await consentState(request(c,{cookie:(await consentCookie('deny',env,now)).split(';')[0]}),env,false,now)).allowed,false);
 }
});
test('Production config is available but off with consent required and no choice',async()=>{
 const e={ANALYTICS_DB:localDB(),ANALYTICS_ENABLED:'true',ANALYTICS_HASH_SECRET:'prod-like-key'};
 for(const c of ['CH','DE','US',undefined,'XX','T1']){
  const body=await (await analyticsRoute(request(c),e)).json();
  assert.equal(body.available,true);assert.equal(body.enabled,false);assert.equal(body.consent_required,true);assert.equal(body.choice,'none');
 }
});
test('Event endpoint rejects before consent and after deny, accepts valid allow',async()=>{
 const e={ANALYTICS_DB:localDB(),ANALYTICS_ENABLED:'true',ANALYTICS_HASH_SECRET:'prod-like-key',ANALYTICS_RATE_LIMIT:{limit:async()=>({success:true})}};
 const post=async(country,cookie)=>{const headers={Origin:'https://timschneider.ch','Content-Type':'application/json','User-Agent':'test-browser','CF-Connecting-IP':'192.0.2.1'};if(cookie)headers.Cookie=cookie;const pending=[];const response=await analyticsRoute(Object.assign(new Request('https://timschneider.ch/api/analytics/events',{method:'POST',headers,body:JSON.stringify({event_name:'page_view',event_id:crypto.randomUUID(),page_path:'/',is_entry:true})}),{cf:{country}}),e,{waitUntil:p=>pending.push(p)});await Promise.all(pending);return response;};
 const allow=(await consentCookie('allow',e)).split(';')[0],deny=(await consentCookie('deny',e)).split(';')[0];
 for(const c of ['CH','DE','US',undefined,'XX','T1']){
  assert.equal((await post(c)).status,403,'none '+c);
  assert.equal((await post(c,deny)).status,403,'deny '+c);
  assert.equal((await post(c,allow+'a')).status,403,'forged '+c);
 }
 assert.equal(e.ANALYTICS_DB.sqlite.prepare('select count(*) n from events').get().n,0);
 assert.equal((await post('CH',allow)).status,204);
 assert.equal(e.ANALYTICS_DB.sqlite.prepare('select count(*) n from events').get().n,1);
});
test('Consent submission is same-origin, bounded and does not enable arbitrary values',async()=>{
 const send=(origin,choice)=>analyticsRoute(new Request('https://timschneider.ch/api/analytics/consent',{method:'POST',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify({choice})}),env);
 assert.equal((await send('https://evil.example','allow')).status,403);assert.equal((await send('https://timschneider.ch','invalid')).status,400);
 const r=await send('https://timschneider.ch','allow');assert.equal(r.status,200);assert.ok(r.headers.get('Set-Cookie').includes('HttpOnly'));
});
test('App admin access depends on authoritative existing owner/coach/session RPC',async()=>{
 const req=new Request('https://timschneider.ch/api/analytics/report',{headers:{Authorization:'Bearer '+('x'.repeat(80))}});
 let n=0;const allowed=await isAppAnalyticsAdmin(req,env,async(url,options)=>{n++;assert.equal(options.redirect,'manual');assert.equal(url,'https://hxzycsanrqxbfmveosle.supabase.co/rest/v1/rpc/website_analytics_admin');assert.equal(options.headers.Authorization,req.headers.get('authorization'));return Response.json(true)});
 assert.equal(allowed,true);assert.equal(n,1);assert.equal(await isAppAnalyticsAdmin(req,env,async()=>Response.json(false)),false);
 assert.equal(await isAppAnalyticsAdmin(req,env,async()=>new Response(null,{status:401})),false);
 assert.equal(await isAppAnalyticsAdmin(new Request(req.url),env,async()=>{throw Error('must not call')}),false);
});
test('Only app origin can preflight report; unembedded dashboard directs to app login',async()=>{
 const r=await analyticsRoute(new Request('https://timschneider.ch/api/analytics/report',{method:'OPTIONS',headers:{origin:'https://app.timschneider.ch'}}),env);assert.equal(r.status,204);assert.equal(r.headers.get('Access-Control-Allow-Origin'),'https://app.timschneider.ch');
 assert.equal((await analyticsRoute(new Request('https://timschneider.ch/api/analytics/report',{method:'OPTIONS',headers:{origin:'https://evil.example'}}),env)).status,403);
 const redirect=await analyticsRoute(new Request('https://timschneider.ch/internal-analytics/'),env);assert.equal(redirect.headers.get('Location'),'https://app.timschneider.ch/website-analytics');
});
test('All current 1.1 plan versions count under the same 15 website products',async()=>{
 const db=localDB(),env={ANALYTICS_DB:db,ANALYTICS_ENABLED:'true',ANALYTICS_HASH_SECRET:'isolated',ANALYTICS_ENV:'test'};
 assert.equal(Object.keys(PLAN_ALIASES).length,15);
 for(const [version,canonical]of Object.entries(PLAN_ALIASES)){assert.equal(canonicalPlan(version),canonical);assert.ok(CATALOG[canonical]);await recordConfirmed(env,'purchase_success',version,{},version,2900)}
 assert.equal(db.sqlite.prepare('select count(*) n from events').get().n,15);for(const row of db.sqlite.prepare('select plan_id from events').all())assert.ok(CATALOG[row.plan_id]);
});
test('Reserved test_preview campaign keeps browser QA out of live business totals',async()=>{
 const db=localDB(),pending=[],testEnv={ANALYTICS_DB:db,ANALYTICS_ENABLED:'true',ANALYTICS_HASH_SECRET:'test',ANALYTICS_RATE_LIMIT:{limit:async()=>({success:true})}};
 const allow=(await consentCookie('allow',testEnv)).split(';')[0];
 const req=Object.assign(new Request('https://timschneider.ch/api/analytics/events',{method:'POST',headers:{Origin:'https://timschneider.ch','Content-Type':'application/json','User-Agent':'test-browser','CF-Connecting-IP':'192.0.2.1',Cookie:allow},body:JSON.stringify({event_name:'page_view',event_id:crypto.randomUUID(),page_path:'/',campaign:'test_preview',is_entry:true})}),{cf:{country:'CH'}});
 const r=await analyticsRoute(req,testEnv,{waitUntil:p=>pending.push(p)});await Promise.all(pending);assert.equal(r.status,204);assert.equal(db.sqlite.prepare('select environment from events').get().environment,'test');
});
