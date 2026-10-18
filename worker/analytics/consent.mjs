import {digest} from './contract.mjs';
const region=new Set('AT BE BG HR CY CZ DK EE FI FR DE GR HU IE IT LV LT LU MT NL PL PT RO SK SI ES SE IS LI NO GB'.split(' '));
const lifetime=180*86400;
export async function consentState(req,env,preview=false,now=Date.now()){
 const required=!preview&&(!req.cf?.country||region.has(req.cf.country));
 if(req.headers.get('sec-gpc')==='1'||req.headers.get('dnt')==='1')return {required,choice:'deny',allowed:false};
 const value=(req.headers.get('cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('tim_analytics_choice='))?.split('=')[1]||'';
 const [version,choice,expires,signature]=value.split('.');
 let valid=false;
 if(version==='v1'&&['allow','deny'].includes(choice)&&/^\d{10}$/.test(expires||'')&&Number(expires)>now/1000&&Number(expires)<=now/1000+lifetime+86400&&/^[a-f0-9]{64}$/.test(signature||'')&&env.ANALYTICS_HASH_SECRET){
  const expected=await digest(env.ANALYTICS_HASH_SECRET,[version,choice,expires].join('.'));let diff=0;for(let i=0;i<64;i++)diff|=expected.charCodeAt(i)^signature.charCodeAt(i);valid=diff===0;
 }
 const state=valid?choice:'none';return {required,choice:state,allowed:state==='allow'||(!required&&state!=='deny')};
}
export async function consentCookie(choice,env,now=Date.now()){
 // Same daily expiry for everyone; this cookie contains no visitor identifier.
 const expires=String(Math.floor(now/86400000)*86400+lifetime),payload='v1.'+choice+'.'+expires;
 return 'tim_analytics_choice='+payload+'.'+await digest(env.ANALYTICS_HASH_SECRET,payload)+'; Path=/; Max-Age='+lifetime+'; Secure; HttpOnly; SameSite=Lax';
}
