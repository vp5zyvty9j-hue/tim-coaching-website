// Cloudflare Access identity headers alone are NOT authentication.
// Validate the signed JWT, its issuer, audience, expiry and owner allowlist.
let keyCache={at:0,issuer:'',keys:[]};
const decode=s=>Uint8Array.from(atob(s.replaceAll('-','+').replaceAll('_','/')),c=>c.charCodeAt(0));
export async function isAnalyticsAdmin(req,env,fetcher=fetch,now=Date.now()){
 try{
 const issuer=env.ANALYTICS_ACCESS_ISSUER,aud=env.ANALYTICS_ACCESS_AUD,owner=env.ANALYTICS_ADMIN_EMAIL;
 if(!/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(issuer||'')||!aud||!owner)return false;
 const token=req.headers.get('Cf-Access-Jwt-Assertion');if(!token||token.length>12000)return false;
 const [h,p,s,extra]=token.split('.');if(extra||!s)return false;
 const header=JSON.parse(new TextDecoder().decode(decode(h))),claims=JSON.parse(new TextDecoder().decode(decode(p)));
 if(header.alg!=='RS256'||!header.kid||claims.iss!==issuer||!Array.isArray(claims.aud)||!claims.aud.includes(aud)||!Number.isFinite(claims.exp)||claims.exp<=now/1000||claims.iat>now/1000+60||claims.nbf>now/1000+60||claims.email!==owner)return false;
 if(keyCache.issuer!==issuer||now-keyCache.at>300000){const r=await fetcher(issuer+'/cdn-cgi/access/certs',{signal:AbortSignal.timeout(3000),redirect:'error'});if(!r.ok)return false;keyCache={issuer,at:now,keys:(await r.json()).keys||[]};}
 const jwk=keyCache.keys.find(k=>k.kid===header.kid&&k.kty==='RSA');if(!jwk)return false;
 const key=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
 return await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,decode(s),new TextEncoder().encode(h+'.'+p));
 }catch{return false;}
}
