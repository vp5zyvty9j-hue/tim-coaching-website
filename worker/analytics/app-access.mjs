// Reuse the existing app's owner/coach and session checks. No new accounts,
// passwords or billing product; the publishable key has no privileged access.
export async function isAppAnalyticsAdmin(req,env,fetcher=fetch){
 return (await checkAppAnalyticsAdmin(req,env,fetcher)).allowed;
}
export async function checkAppAnalyticsAdmin(req,env,fetcher=fetch){
 const token=req.headers.get('authorization')||'';
 if(env.ANALYTICS_APP_AUTH!=='true')return {allowed:false,detail:'app_auth_disabled'};
 if(!/^Bearer [A-Za-z0-9_.-]{40,12000}$/.test(token))return {allowed:false,detail:'session_missing'};
 try{
  const r=await fetcher('https://hxzycsanrqxbfmveosle.supabase.co/rest/v1/rpc/website_analytics_admin',{
   method:'POST',headers:{apikey:'sb_publishable_brr2wk2M_XpQFB1ajmXevg_M5j69hGo',Authorization:token,'Content-Type':'application/json'},body:'{}',redirect:'manual',signal:AbortSignal.timeout(4000)
  });
  if(!r.ok)return {allowed:false,detail:'owner_check_http_'+r.status};
  const allowed=(await r.json())===true;return {allowed,detail:allowed?'verified':'owner_check_denied'};
 }catch(e){return {allowed:false,detail:e?.name==='TimeoutError'?'owner_check_timeout':'owner_check_unavailable'}}
}
