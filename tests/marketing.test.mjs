import test from 'node:test';
import assert from 'node:assert/strict';
import {marketingChoice,marketingCookie,marketingRoute,bridgePolicy} from '../worker/marketing.mjs';
import {eventPayload,eventHash,pruneSeen,WEB,APP} from '../public/marketing-contract.mjs';
import worker from '../worker/index.mjs';
const env={ANALYTICS_HASH_SECRET:'local-test-only-signing-material',META_PIXEL_ENABLED:'true'};
const now=Date.UTC(2026,10,18),request=(path,headers={})=>new Request(WEB+path,{headers});
test('no consent by default, explicit allow signed and purpose-bound',async()=>{
 assert.equal(await marketingChoice(request('/'),env,now),'none');
 const cookie=(await marketingCookie('allow',env,now)).split(';')[0];
 assert.equal(await marketingChoice(request('/',{cookie}),env,now),'allow');
 assert.equal(await marketingChoice(request('/',{cookie:cookie.replace('allow','deny')}),env,now),'none');
 assert.equal(await marketingChoice(request('/',{cookie:cookie.replace('tim_marketing_choice','tim_analytics_choice')}),env,now),'none');
 assert.equal(await marketingChoice(request('/',{cookie}),env,now+181*86400000),'none');
 for(const key of ['sec-gpc','dnt'])assert.equal(await marketingChoice(request('/',{cookie,[key]:'1'}),env,now),'deny');
});
test('marketing endpoints deny wrong origin, oversized body and unknown fields',async()=>{
 const post=(origin,body)=>new Request(WEB+'/api/marketing/consent',{method:'POST',headers:{origin,'content-type':'application/json'},body});
 assert.equal((await marketingRoute(post(APP,'{"choice":"allow"}'),env)).status,403);
 assert.equal((await marketingRoute(post(WEB,'x'.repeat(101)),env)).status,413);
 assert.equal((await marketingRoute(post(WEB,'{"choice":"allow","email":"forbidden"}'),env)).status,400);
 const r=await marketingRoute(post(WEB,'{"choice":"allow"}'),env);assert.equal(r.status,200);assert.match(r.headers.get('set-cookie'),/HttpOnly; SameSite=Lax/);
 assert.equal((await marketingRoute(post(WEB,'{"choice":"allow"}'),{...env,META_PIXEL_ENABLED:'false'})).status,403);
 assert.equal((await marketingRoute(post(WEB,'{"choice":"deny"}'),{...env,META_PIXEL_ENABLED:'false'})).status,200);
});
test('disabled gate, credentialed app config and isolated generic bridge',async()=>{
 let r=await marketingRoute(request('/api/marketing/config',{origin:APP}),env);assert.equal(r.headers.get('access-control-allow-origin'),APP);assert.equal((await r.json()).allowed,false);
 r=await marketingRoute(request('/api/marketing/config',{origin:'https://evil.test'}),env);assert.equal(r.headers.get('access-control-allow-origin'),null);
 assert.equal((await marketingRoute(request('/marketing/bridge'),{})).status,404);
 assert.equal((await marketingRoute(request('/marketing/bridge?payment=secret'),env)).status,400);
 r=await marketingRoute(request('/marketing/bridge'),env);const html=await r.text();assert.equal(r.status,200);assert.ok(!html.includes('facebook'));assert.ok(html.includes('no-referrer'));
 assert.ok(!bridgePolicy.includes("'unsafe-inline'"));assert.match(bridgePolicy,/frame-ancestors https:\/\/timschneider.ch https:\/\/app.timschneider.ch/);
});
test('event envelope excludes sensitive fields and cross-origin event types',()=>{
 const id='a'.repeat(64),lead={type:'tim-meta-event',event:'Lead',id},purchase={type:'tim-meta-event',event:'Purchase',id,value:29,currency:'CHF'};
 assert.deepEqual(eventPayload(lead,WEB),lead);assert.equal(eventPayload(lead,APP),null);assert.deepEqual(eventPayload(purchase,APP),purchase);
 for(const field of ['email','name','plan','package','health','url','payment_id'])assert.equal(eventPayload({...lead,[field]:'private'},WEB),null);
 for(const bad of [{...purchase,value:NaN},{...purchase,value:-1},{...purchase,value:.001},{...purchase,currency:'EUR'},{...purchase,value:10001}])assert.equal(eventPayload(bad,APP),null);
 assert.equal(eventPayload(lead,'https://evil.test'),null);assert.equal(eventPayload({...lead,id:'raw-uuid'},WEB),null);
});
test('stable namespaced event identifiers and bounded dedup storage',async()=>{
 const a=await eventHash('Lead','sample-uuid');assert.equal(a,await eventHash('Lead','sample-uuid'));assert.notEqual(a,await eventHash('Purchase','sample-uuid'));assert.match(a,/^[a-f0-9]{64}$/);
 assert.deepEqual(pruneSeen([[a,now-91*86400000],[a,now+1],['raw-id',now],[a,now]],now),[[a,now]]);
 assert.equal(pruneSeen(Array.from({length:250},()=>[a,now]),now).length,200);
});
test('actual worker response permits only bridge framing, private paths stay protected',async()=>{
 const r=await worker.fetch(request('/marketing/bridge'),env,{});
 assert.equal(r.headers.get('Content-Security-Policy'),bridgePolicy);assert.equal(r.headers.get('X-Frame-Options'),null);assert.equal(r.headers.get('Referrer-Policy'),'no-referrer');assert.equal(r.headers.get('Cache-Control'),'no-store');
 const other=await worker.fetch(request('/private-example'),{...env,ASSETS:{fetch:async()=>new Response('private',{headers:{'Content-Type':'text/html'}})}},{});
 assert.equal(other.headers.get('X-Frame-Options'),'DENY');assert.match(other.headers.get('Content-Security-Policy'),/frame-ancestors 'none'/);assert.equal(await other.text(),'private');
});
