import {publicEvent,saveEvent,recordConfirmed,digest,CATALOG,canonicalPlan} from './contract.mjs';
import {buildReport} from './report.mjs';
import {isAnalyticsAdmin} from './access.mjs';
import {checkAppAnalyticsAdmin} from './app-access.mjs';
import {consentState,consentCookie} from './consent.mjs';
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Robots-Tag':'noindex'}});
export async function boundedJSON(req,max=2048){const reader=req.body?.getReader();if(!reader)throw Error('no_body');let n=0,out='';const decoder=new TextDecoder('utf8',{fatal:true});try{for(;;){const {done,value}=await reader.read();if(done)break;n+=value.length;if(n>max){await reader.cancel();throw Error('too_large')}out+=decoder.decode(value,{stream:true})}out+=decoder.decode();return JSON.parse(out)}finally{reader.releaseLock()}}
export async function analyticsRoute(req,env,ctx={waitUntil:p=>p.catch(()=>{})}){
 const url=new URL(req.url),path=url.pathname;
 if(path==='/api/analytics/report'&&req.method==='OPTIONS'){
  if(req.headers.get('origin')!=='https://app.timschneider.ch')return json({},403);
  return new Response(null,{status:204,headers:{'Access-Control-Allow-Origin':'https://app.timschneider.ch','Access-Control-Allow-Methods':'GET','Access-Control-Allow-Headers':'Authorization','Access-Control-Max-Age':'600','Vary':'Origin'}});
 }
 if(path.startsWith('/internal-analytics')&&env.ANALYTICS_APP_AUTH==='true'){
  if(!['GET','HEAD'].includes(req.method))return json({},405);
  if((path==='/internal-analytics'||path==='/internal-analytics/')&&url.searchParams.get('embedded')!=='1')return Response.redirect('https://app.timschneider.ch/website-analytics',302);
  const asset=new URL(req.url);if(path==='/internal-analytics'||path==='/internal-analytics/')asset.pathname='/internal-analytics/index.html';return env.ASSETS.fetch(new Request(asset,req));
 }
 if(path.startsWith('/internal-analytics')||path==='/api/analytics/report'){
  const appAccess=await checkAppAnalyticsAdmin(req,env);
  if(!appAccess.allowed&&!await isAnalyticsAdmin(req,env))return json({error:'Admin-Anmeldung erforderlich',detail:appAccess.detail},403);
  if(req.method!=='GET')return json({},405);
  if(path==='/api/analytics/report'){if(!env.ANALYTICS_DB)return json({error:'Noch nicht eingerichtet'},503);try{return json(await buildReport(env.ANALYTICS_DB,url))}catch{return json({error:'Ungültiger Zeitraum oder Datenbank nicht verfügbar'},400)}}
  const asset=new URL(req.url);if(path==='/internal-analytics'||path==='/internal-analytics/')asset.pathname='/internal-analytics/index.html';return env.ASSETS.fetch(new Request(asset,req));
 }
 if(!path.startsWith('/api/analytics/'))return null;
 const live=url.hostname==='timschneider.ch'&&url.protocol==='https:';
 const preview=env.ANALYTICS_PREVIEW==='true'&&['localhost','127.0.0.1'].includes(url.hostname);
 const active=live||preview;
 if(path==='/api/analytics/consent'&&req.method==='POST'){
  if(!active||req.headers.get('origin')!==url.origin||!env.ANALYTICS_HASH_SECRET||!req.headers.get('content-type')?.startsWith('application/json'))return json({},403);
  try{const p=await boundedJSON(req,100);if(!['allow','deny'].includes(p.choice)||Object.keys(p).length!==1)return json({},400);const r=json({saved:true});r.headers.set('Set-Cookie',await consentCookie(p.choice,env));return r}catch{return json({},400)}
 }
 if(path==='/api/analytics/config'&&req.method==='GET'){
 const admin=await isAnalyticsAdmin(req,env),consent=await consentState(req,env,preview);const available=active&&env.ANALYTICS_ENABLED==='true'&&!!env.ANALYTICS_DB&&!admin;
 const r=json({available,enabled:available&&consent.allowed,consent_required:consent.required,choice:consent.choice,environment:preview?'test':'live'});
 if(req.headers.get('origin')==='https://app.timschneider.ch'){r.headers.set('Access-Control-Allow-Origin','https://app.timschneider.ch');r.headers.set('Access-Control-Allow-Credentials','true');r.headers.set('Vary','Origin')}
 return r;
 }
 if(env.ANALYTICS_ENABLED!=='true'||!env.ANALYTICS_DB)return json({},503);
 if(path==='/api/analytics/events'){
 if(req.method!=='POST')return json({},405);
 if(!active||req.headers.get('origin')!==url.origin||!req.headers.get('content-type')?.startsWith('application/json')||req.headers.get('sec-gpc')==='1'||req.headers.get('dnt')==='1')return json({},403);
 if(!(await consentState(req,env,preview)).allowed)return json({},403);
 if(/bot|spider|crawler|headless|preview|slurp/i.test(req.headers.get('user-agent')||''))return new Response(null,{status:204});
 const ip=req.headers.get('CF-Connecting-IP');if(!ip||!env.ANALYTICS_RATE_LIMIT)return json({},503);
 if(!(await env.ANALYTICS_RATE_LIMIT.limit({key:ip})).success)return json({},429);
 try{const p=await boundedJSON(req);const e=publicEvent(p,req,preview||p.campaign==='test_preview'?'test':'live');if(!e)return json({},400);if(!env.ANALYTICS_HASH_SECRET)return json({},503);e.event_id=e.environment+':'+e.event_name+':'+await digest(env.ANALYTICS_HASH_SECRET,e.event_id);ctx.waitUntil(saveEvent(env.ANALYTICS_DB,e).catch(()=>{}));return new Response(null,{status:204})}catch{return json({},400)}
 }
 if(path==='/api/analytics/server'){
 if(req.method!=='POST'||!env.ANALYTICS_INGEST_SECRET||!env.ANALYTICS_HASH_SECRET)return json({},403);
 const timestamp=req.headers.get('x-tim-timestamp'),signature=req.headers.get('x-tim-signature');if(!/^\d{13}$/.test(timestamp||'')||Math.abs(Date.now()-Number(timestamp))>300000||!/^[a-f0-9]{64}$/.test(signature||''))return json({},403);
 try{const p=await boundedJSON(req,3000);const expected=await digest(env.ANALYTICS_INGEST_SECRET,timestamp+'.'+JSON.stringify(p));let difference=0;for(let i=0;i<64;i++)difference|=expected.charCodeAt(i)^signature.charCodeAt(i);if(difference)return json({},403);
 if(Object.keys(p).some(k=>!['event_name','event_key','context','plan_id','amount_minor','currency','mode','occurred_at'].includes(k))||!['checkout_start','purchase_success'].includes(p.event_name)||!/^[a-f0-9]{64}$/.test(p.event_key||'')||!['live','test'].includes(p.mode)||(preview&&p.mode!=='test')||!canonicalPlan(p.plan_id)||p.currency!=='CHF'||!Number.isSafeInteger(p.amount_minor)||p.amount_minor<0||p.amount_minor>1000000||!Number.isFinite(Date.parse(p.occurred_at))||Date.parse(p.occurred_at)>Date.now()+60000||Date.parse(p.occurred_at)<Date.now()-90*86400000)return json({},400);
 await recordConfirmed({...env,ANALYTICS_ENV:p.mode},p.event_name,p.event_key,p.context,p.plan_id,p.amount_minor,p.occurred_at);return json({received:true});}catch{return json({},503)}
 }
 return json({},404);
}
