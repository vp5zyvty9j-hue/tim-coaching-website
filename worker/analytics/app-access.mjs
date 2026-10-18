// Reuse the existing app's owner/coach and session checks. No new accounts,
// passwords or billing product; the publishable key has no privileged access.
export async function isAppAnalyticsAdmin(req,env,fetcher=fetch){
 const token=req.headers.get('authorization')||'';
 if(!/^Bearer [A-Za-z0-9_.-]{40,12000}$/.test(token)||env.ANALYTICS_APP_AUTH!=='true')return false;
 try{
  const r=await fetcher('https://hxzycsanrqxbfmveosle.supabase.co/rest/v1/rpc/website_analytics_admin',{
   method:'POST',headers:{apikey:'sb_publishable_brr2wk2M_XpQFB1ajmXevg_M5j69hGo',Authorization:token,'Content-Type':'application/json'},body:'{}',redirect:'error',signal:AbortSignal.timeout(4000)
  });
  return r.ok&&(await r.json())===true;
 }catch{return false}
}
