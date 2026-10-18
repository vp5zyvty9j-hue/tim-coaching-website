import {CATALOG} from '../../public/analytics-catalog.mjs';
import {PLAN_ALIASES} from '../../public/analytics-plan-aliases.mjs';
export {CATALOG};
export const canonicalPlan=id=>CATALOG[id]?id:(PLAN_ALIASES[id]||'');
export const PUBLIC_EVENTS=new Set(['page_view','coaching_view','first_call_click','training_plan_view','training_plans_view','plan_select','app_click']);
export const SERVER_EVENTS=new Set(['first_call_submit','checkout_start','purchase_success']);
export const PATHS=new Set(['/','/erfolge.html','/trainingsplaene.html','/datenschutz.html','/impressum.html','/agb.html','/widerruf.html','/weitere-angebote','/masterplan-kauf']);
export const SOURCES=new Set(['direct','google_organic','instagram','tiktok','meta_ads','tiktok_ads','ai_referral','email','other','unknown']);
export const LOCATIONS=new Set(['hero','navigation','coaching','contact','plans','footer','other']);
// Campaigns are merchant-owned labels; accept only the configured vocabulary.
// Never persist arbitrary UTM text, which could contain personal information.
export const CAMPAIGNS=new Set(['profile','laufplaene','coaching','hybrid','retargeting','newsletter','test_preview']);
export const CONTENTS=new Set(['bio','story','reel','video','post','ad_a','ad_b','link']);
export function cleanContext(p={}){return {page_path:PATHS.has(p.page_path)?p.page_path:'/',source:SOURCES.has(p.source)?p.source:'unknown',campaign:CAMPAIGNS.has(p.campaign)?p.campaign:'',content:CONTENTS.has(p.content)?p.content:'',device:['mobile','tablet','desktop'].includes(p.device)?p.device:'unknown'};}
export function deviceFromUA(ua=''){return /iPad|Tablet|Android(?!.*Mobile)/i.test(ua)?'tablet':/Mobile|iPhone|iPod/i.test(ua)?'mobile':'desktop';}
export function publicEvent(p,request,environment){
 if(!p||typeof p!=='object'||Array.isArray(p)||!PUBLIC_EVENTS.has(p.event_name)||!/^[-a-z0-9]{1,100}$/i.test(p.event_id||''))return null;
 const keys=['event_name','event_id','page_path','source','campaign','content','device','plan_id','cta_location','is_entry'];
 if(Object.keys(p).some(k=>!keys.includes(k))||!PATHS.has(p.page_path))return null;
 if(['training_plan_view','plan_select'].includes(p.event_name)&&!CATALOG[p.plan_id])return null;
 const context=cleanContext(p);context.device=deviceFromUA(request.headers.get('user-agent')||'');
 return {...context,is_entry:p.event_name==='page_view'&&p.is_entry===true?1:0,event_id:environment+':'+p.event_name+':'+p.event_id,event_name:p.event_name,environment,plan_id:CATALOG[p.plan_id]?p.plan_id:'',cta_location:LOCATIONS.has(p.cta_location)?p.cta_location:'other',amount_minor:0,currency:'',country:/^[A-Z]{2}$/.test(request.cf?.country||'')?request.cf.country:'unknown'};
}
export async function digest(secret,value){const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);return [...new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(value)))].map(x=>x.toString(16).padStart(2,'0')).join('');}
export async function saveEvent(db,event,now=new Date()){
 const e={...event,occurred_at:now.toISOString()};
 return db.prepare('INSERT OR IGNORE INTO events (event_id,occurred_at,environment,event_name,page_path,source,campaign,content,device,country,plan_id,cta_location,amount_minor,currency,is_entry) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(...['event_id','occurred_at','environment','event_name','page_path','source','campaign','content','device','country','plan_id','cta_location','amount_minor','currency','is_entry'].map(k=>e[k]??(k==='is_entry'?0:''))).run();
}
export async function recordConfirmed(env,event_name,key,context={},plan_id='',amount=null,occurredAt=null){
 if(env.ANALYTICS_ENABLED!=='true'||!env.ANALYTICS_DB||!env.ANALYTICS_HASH_SECRET||!SERVER_EVENTS.has(event_name))return;
 const product=CATALOG[canonicalPlan(plan_id)];if(event_name!=='first_call_submit'&&!product)return;
 const environment=env.ANALYTICS_ENV==='live'?'live':'test';
 const e={...cleanContext(context),event_id:environment+':'+event_name+':'+await digest(env.ANALYTICS_HASH_SECRET,key),event_name,environment,plan_id:product?.plan_id||'',cta_location:'other',amount_minor:event_name==='purchase_success'?(amount??product.price):0,currency:event_name==='purchase_success'?'CHF':'',country:'unknown'};
 await saveEvent(env.ANALYTICS_DB,e,occurredAt?new Date(occurredAt):new Date());
}
