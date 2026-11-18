import {WEB,APP,PIXEL,deniedByBrowser,locallyDenied,eventPayload,pruneSeen} from './marketing-contract.mjs';
if(location.origin===WEB&&location.pathname==='/marketing/bridge'&&!location.search&&!location.hash&&parent!==window){
 let stopped=false,loading=null,chain=Promise.resolve(),script=null,caller=null;
 const channel=typeof BroadcastChannel==='function'?new BroadcastChannel('tim-marketing-choice'):null;
 function stop(){stopped=true;try{window.fbq?.('consent','revoke')}catch{}script?.remove();clearInterval(poll);channel?.close();removeEventListener('message',message);removeEventListener('pagehide',stop)}
 async function allowed(){if(stopped||deniedByBrowser()||locallyDenied())return false;try{const r=await fetch('/api/marketing/config',{credentials:'same-origin',cache:'no-store'});if(!r.ok)return null;const c=await r.json();return c.allowed===true&&!stopped&&!deniedByBrowser()&&!locallyDenied()}catch{return null}}
 async function load(){if(loading)return loading;loading=(async()=>{if(await allowed()!==true)throw Error('consent');
  const f=function(...args){f.callMethod?f.callMethod.apply(f,args):f.queue.push(args)};f.queue=[];f.push=f;f.loaded=true;f.version='2.0';window.fbq=f;window._fbq=f;
  f('set','autoConfig',false,PIXEL);f('consent','grant');f('init',PIXEL);
  await new Promise((resolve,reject)=>{script=document.createElement('script');script.src='https://connect.facebook.net/en_US/fbevents.js';script.referrerPolicy='no-referrer';script.onload=resolve;script.onerror=()=>reject(Error('blocked'));document.head.append(script)});
  if(await allowed()!==true)throw Error('consent');
 })().catch(e=>{script?.remove();loading=null;throw e});return loading}
 async function send(data,origin,source){
  const permission=await allowed();if(permission===false)return stop();if(permission!==true)return;
  let seen;try{seen=pruneSeen(JSON.parse(localStorage.getItem('tim_meta_seen')||'[]'));localStorage.setItem('tim_meta_seen',JSON.stringify(seen))}catch{return}
  if(data.event!=='PageView'&&seen.some(x=>x[0]===data.id)){source.postMessage({type:'tim-meta-queued',id:data.id},origin);return}
  try{await load();const current=await allowed();if(current===false)return stop();if(current!==true)return;
   window.fbq('trackSingle',PIXEL,data.event,data.event==='Purchase'?{value:data.value,currency:'CHF'}:{},{eventID:data.id});
   if(data.event!=='PageView'){seen=pruneSeen([...seen,[data.id,Date.now()]]);localStorage.setItem('tim_meta_seen',JSON.stringify(seen))}
   source.postMessage({type:'tim-meta-queued',id:data.id},origin);
  }catch{/* Fail closed; no success claim. */}
 }
 function message(e){if(e.source!==parent||![WEB,APP].includes(e.origin)||stopped)return;
  if(e.data?.type==='tim-meta-stop'){stop();return}
  if(e.data?.type==='tim-meta-hello'&&Object.keys(e.data).length===1){caller=e.origin;void allowed().then(ok=>{if(ok&&!stopped)parent.postMessage({type:'tim-meta-ready'},e.origin)});return}
  if(e.origin!==caller)return;const data=eventPayload(e.data,e.origin);if(data)chain=chain.then(()=>send(data,e.origin,e.source)).catch(()=>{});
 }
 const poll=setInterval(()=>void allowed().then(ok=>{if(ok===false)stop()}),5000);
 channel?.addEventListener('message',e=>{if(e.data==='deny')stop()});
 addEventListener('message',message);addEventListener('pagehide',stop,{once:true});
}
