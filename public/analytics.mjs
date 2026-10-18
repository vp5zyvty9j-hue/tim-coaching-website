import {CATALOG} from './analytics-catalog.mjs';
// No visitor identifiers or browser storage. Consent preference is managed server-side.
// No form values, raw URL/query, referrer or UA leave this module.
const CAMPAIGNS=new Set(['profile','laufplaene','coaching','hybrid','retargeting','newsletter','test_preview']);
const CONTENTS=new Set(['bio','story','reel','video','post','ad_a','ad_b','link']);
function attribution(){
 const u=new URL(location.href),s=(u.searchParams.get('utm_source')||'').toLowerCase(),m=(u.searchParams.get('utm_medium')||'').toLowerCase();let source='direct';
 if(s==='meta'&&m==='paid_social')source='meta_ads';else if(s==='tiktok'&&m==='paid_social')source='tiktok_ads';else if(['instagram','tiktok'].includes(s))source=s;else if(m==='email')source='email';else if(s==='google'&&m==='organic')source='google_organic';else if(s==='ai'&&m==='referral')source='ai_referral';else if(s==='other'&&m==='referral')source='other';
 else{let h='';try{h=new URL(document.referrer).hostname}catch{}if(/(^|\.)google\.[a-z.]+$/.test(h))source='google_organic';else if(/(^|\.)(instagram\.com|l\.instagram\.com)$/.test(h))source='instagram';else if(/(^|\.)tiktok\.com$/.test(h))source='tiktok';else if(/(^|\.)(chatgpt\.com|chat\.openai\.com|perplexity\.ai|claude\.ai|copilot\.microsoft\.com)$/.test(h))source='ai_referral';else if(h&&!['timschneider.ch','app.timschneider.ch',location.hostname].includes(h))source='other';}
 return {source,campaign:CAMPAIGNS.has(u.searchParams.get('utm_campaign'))?u.searchParams.get('utm_campaign'):'',content:CONTENTS.has(u.searchParams.get('utm_content'))?u.searchParams.get('utm_content'):''};
}
let context={},entry=true,nonce='',enabled=false,started=false;const once=new Set();
function send(event_name,extra={},key=event_name){if(!enabled||once.has(key))return;once.add(key);const payload={event_id:nonce+'-'+key.replace(/[^a-z0-9-]/gi,''),event_name,...context,...extra};try{fetch('/api/analytics/events',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),keepalive:true,credentials:'same-origin',referrerPolicy:'no-referrer'}).catch(()=>{})}catch{}}
// This narrow context is the only addition to the confirmed inquiry request. Never serialize a form.
window.TIMAnalytics={context:()=>enabled?{...context}:null};
const area=a=>a.closest('header,.mobile-menu')?'navigation':a.closest('.hero')?'hero':a.closest('.footer')?'footer':a.closest('#coaching')?'coaching':a.closest('#contact')?'contact':a.closest('.plans-page')?'plans':'other';
function observe(el,name,extra={},key=name){if(!el)return;let timer;const observer=new IntersectionObserver(entries=>{const visible=entries[0].intersectionRatio>=.5;clearTimeout(timer);if(visible)timer=setTimeout(()=>{if(!document.hidden){send(name,extra,key);observer.disconnect()}},1200)},{threshold:[0,.5]});observer.observe(el);document.addEventListener('visibilitychange',()=>{if(document.hidden)clearTimeout(timer)})}
function marketingURL(a){try{const u=new URL(a.href,location.href);if(!['timschneider.ch','app.timschneider.ch',location.hostname].includes(u.hostname)||u.protocol!==location.protocol&&u.protocol!=='https:'||context.source==='direct'||u.searchParams.has('utm_source'))return;
 const map={instagram:['instagram','organic_social'],tiktok:['tiktok','organic_social'],meta_ads:['meta','paid_social'],tiktok_ads:['tiktok','paid_social'],google_organic:['google','organic'],ai_referral:['ai','referral'],email:['newsletter','email'],other:['other','referral']};const pair=map[context.source];if(!pair)return;u.searchParams.set('utm_source',pair[0]);u.searchParams.set('utm_medium',pair[1]);if(context.campaign)u.searchParams.set('utm_campaign',context.campaign);if(context.content)u.searchParams.set('utm_content',context.content);a.href=u.href;}catch{}}
if(new URL(location.href).searchParams.get('analytics')==='off')document.addEventListener('click',e=>{const a=e.target.closest('a');if(!a)return;try{const u=new URL(a.href,location.href);if(u.origin===location.origin||u.hostname==='app.timschneider.ch'){u.searchParams.set('analytics','off');a.href=u.href}}catch{}},{capture:true});
function activate(){
 enabled=true;if(started)return;started=true;nonce=crypto.randomUUID();
 context={...attribution(),page_path:location.pathname,device:/iPad|Tablet|Android(?!.*Mobile)/i.test(navigator.userAgent)?'tablet':/Mobile|iPhone/i.test(navigator.userAgent)?'mobile':'desktop'};
 try{entry=!['timschneider.ch','app.timschneider.ch',location.hostname].includes(new URL(document.referrer).hostname)}catch{}
 send('page_view',{is_entry:entry});if(location.pathname==='/trainingsplaene.html')send('training_plans_view');
 observe(document.querySelector('#coaching h2'),'coaching_view');
 for(const card of document.querySelectorAll('.plan-card')){let id;try{id=new URL(card.querySelector('a[href*="?plan="]').href).searchParams.get('plan')}catch{}if(CATALOG[id])observe(card,'training_plan_view',{plan_id:id},'plan-'+id)}
 document.addEventListener('click',e=>{if(!enabled)return;const a=e.target.closest('a');if(!a)return;let u;try{u=new URL(a.href,location.href)}catch{return}const loc=area(a),same=u.origin===location.origin;
 if(same&&['#contact','#contactForm'].includes(u.hash))send('first_call_click',{cta_location:loc},'call-'+loc);
 if(u.hostname==='app.timschneider.ch'||same&&['/konto','/coach','/training'].includes(u.pathname)){send('app_click',{cta_location:loc},'app-'+loc);const id=u.searchParams.get('plan');if(CATALOG[id])send('plan_select',{plan_id:id,cta_location:loc},'select-'+id)}
 marketingURL(a);
 },{capture:true});
}
async function start(){
 if(navigator.doNotTrack==='1'||navigator.globalPrivacyControl||new URL(location.href).searchParams.get('analytics')==='off')return;
 try{const r=await fetch('/api/analytics/config',{credentials:'same-origin',referrerPolicy:'no-referrer'});if(!r.ok)return;const config=await r.json();if(!config.available)return;
 const {privacyChoice}=await import('./analytics-consent.mjs');privacyChoice(config,activate,()=>{enabled=false});if(config.enabled)activate();
 }catch{/* Analytics must not affect the website. */}
}
start();
