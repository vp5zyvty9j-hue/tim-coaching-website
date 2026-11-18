const ORIGIN='https://timschneider.ch', APP='https://app.timschneider.ch';
const LIFE=180*86400;
const json=(x,status=200)=>new Response(JSON.stringify(x),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Robots-Tag':'noindex'}});
async function sign(secret,text){const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);return [...new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(text)))].map(n=>n.toString(16).padStart(2,'0')).join('')}
export async function marketingChoice(request,env,now=Date.now()){
 if(request.headers.get('sec-gpc')==='1'||request.headers.get('dnt')==='1')return 'deny';
 if(!env.ANALYTICS_HASH_SECRET)return 'none';
 const cookie=(request.headers.get('cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('tim_marketing_choice='))?.slice(21)||'';
 const [v,choice,expires,sig]=cookie.split('.');
 if(v!=='m1'||!['allow','deny'].includes(choice)||!/^\d{10}$/.test(expires||'')||Number(expires)<=now/1000||Number(expires)>now/1000+LIFE+1||!/^[a-f0-9]{64}$/.test(sig||''))return 'none';
 const expected=await sign(env.ANALYTICS_HASH_SECRET,`marketing:${v}.${choice}.${expires}`);let difference=0;for(let i=0;i<64;i++)difference|=sig.charCodeAt(i)^expected.charCodeAt(i);
 return difference===0?choice:'none';
}
export async function marketingCookie(choice,env,now=Date.now()){
 const value=`m1.${choice}.${Math.floor(now/1000)+LIFE}`;
 return `tim_marketing_choice=${value}.${await sign(env.ANALYTICS_HASH_SECRET,'marketing:'+value)}; Path=/; Max-Age=${LIFE}; Secure; HttpOnly; SameSite=Lax`;
}
export function marketingEnabled(env){return env.META_PIXEL_ENABLED==='true'&&!!env.ANALYTICS_HASH_SECRET}
export async function marketingRoute(request,env){
 const u=new URL(request.url),path=u.pathname;
 if(path!=='/marketing/bridge'&&!path.startsWith('/api/marketing/'))return null;
 if(u.origin!==ORIGIN)return json({},403);
 if(path==='/marketing/bridge'){
  if(!['GET','HEAD'].includes(request.method)||u.search)return json({},400);
  if(!marketingEnabled(env))return json({},404);
  return new Response('<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><meta name="referrer" content="no-referrer"><title>Freiwillige Werbemessung</title><script type="module" src="/marketing-bridge.mjs"></script></head><body></body></html>',{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Robots-Tag':'noindex,nofollow'}});
 }
 if(path==='/api/marketing/config'&&request.method==='GET'){
  const choice=await marketingChoice(request,env),enabled=marketingEnabled(env);
  const r=json({enabled,choice,allowed:enabled&&choice==='allow'});
  if(request.headers.get('origin')===APP){r.headers.set('Access-Control-Allow-Origin',APP);r.headers.set('Access-Control-Allow-Credentials','true');r.headers.set('Vary','Origin')}
  return r;
 }
 if(path==='/api/marketing/consent'&&request.method==='POST'){
  if(request.headers.get('origin')!==ORIGIN||!env.ANALYTICS_HASH_SECRET||!request.headers.get('content-type')?.startsWith('application/json'))return json({},403);
  try{const reader=request.body?.getReader();if(!reader)return json({},400);let bytes=0,parts=[];try{for(;;){const {done,value}=await reader.read();if(done)break;bytes+=value.length;if(bytes>100){await reader.cancel();return json({},413)}parts.push(value)}}finally{reader.releaseLock()}
   const all=new Uint8Array(bytes);let offset=0;for(const p of parts){all.set(p,offset);offset+=p.length}const data=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(all));
   if(!data||Object.keys(data).length!==1||!['allow','deny'].includes(data.choice))return json({},400);
   if(data.choice==='allow'&&(!marketingEnabled(env)||request.headers.get('sec-gpc')==='1'||request.headers.get('dnt')==='1'))return json({},403);
   const r=json({saved:true,choice:data.choice});r.headers.set('Set-Cookie',await marketingCookie(data.choice,env));return r;
  }catch{return json({},400)}
 }
 return json({},404);
}
export const bridgePolicy="default-src 'none'; script-src 'self' https://connect.facebook.net; connect-src 'self' https://www.facebook.com https://connect.facebook.net; img-src https://www.facebook.com data:; frame-src 'none'; style-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors https://timschneider.ch https://app.timschneider.ch";
