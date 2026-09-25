import { identity,isCoach,db,json,sameOrigin,unavailable } from '@/lib/portal-server';
import { validateAssignment,type Account } from '@/lib/subscriptions';
export const dynamic='force-dynamic';
export async function GET(){
 const user=await identity();if(!user)return json({error:'Bitte melde dich an.'},401);
 try{
  if(!await isCoach(user.userId))return json({error:'Nur für den Coach verfügbar.'},403);
  const {results}=await db().prepare('SELECT * FROM accounts WHERE user_id != ? ORDER BY created_at DESC').bind(user.userId).all<Account>();
  return json({athletes:results});
 }catch(e){return unavailable(e);}
}
export async function PATCH(request:Request){
 const user=await identity();if(!user)return json({error:'Bitte melde dich an.'},401);
 if(!sameOrigin(request))return json({error:'Ungültige Anfrage. Bitte lade die Seite neu.'},403);
 try{
  if(!await isCoach(user.userId))return json({error:'Nur der Coach kann Abonnements ändern.'},403);
  let input;try{input=validateAssignment(await request.json());}catch(e){return json({error:e instanceof Error?e.message:'Ungültige Angaben.'},400);}
  if(input.user_id===user.userId)return json({error:'Dein Coach-Konto hat kein Athleten-Abo.'},400);
  const result=await db().prepare('UPDATE accounts SET package=?,status=?,start_date=?,end_date=?,updated_at=?,revision=revision+1 WHERE user_id=? AND revision=?').bind(input.package,input.status,input.start_date,input.end_date,new Date().toISOString(),input.user_id,input.revision).run();
  if(result.meta.changes!==1)return json({error:'Dieser Eintrag wurde inzwischen geändert oder ist nicht mehr verfügbar. Bitte aktualisiere die Liste.'},409);
  const updated=await db().prepare('SELECT * FROM accounts WHERE user_id=?').bind(input.user_id).first<Account>();
  return json({account:updated});
 }catch(e){return unavailable(e);}
}
