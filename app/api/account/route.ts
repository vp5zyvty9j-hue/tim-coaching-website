import type { Invoice } from '@/lib/subscriptions';
import { identity,account,isCoach,db,json,sameOrigin,unavailable } from '@/lib/portal-server';
export const dynamic='force-dynamic';
export async function GET(){
 const user=await identity();if(!user)return json({error:'Bitte melde dich an.'},401);
 try{const {results}=await db().prepare('SELECT id,number,amount_cents,currency,status,issued_date,due_date FROM invoices WHERE user_id=? ORDER BY issued_date DESC,number DESC').bind(user.userId).all<Invoice>();return json({account:await account(user.userId),isCoach:await isCoach(user.userId),invoices:results});}catch(e){return unavailable(e);}
}
export async function POST(request:Request){
 const user=await identity();if(!user)return json({error:'Bitte melde dich an.'},401);
 if(!sameOrigin(request))return json({error:'Ungültige Anfrage. Bitte lade die Seite neu.'},403);
 try{
  let body: Record<string, unknown>;
  try{ const raw=await request.json();if(!raw||typeof raw!=="object"||Array.isArray(raw))throw Error();body=raw as Record<string,unknown>; }catch{return json({error:"Ungültige Angaben."},400);}
  const name=typeof body.name==='string'?body.name.trim():'';
  if(name.length<2||name.length>100||body.consent!==true)return json({error:'Bitte gib deinen Namen an und bestätige den Datenschutzhinweis.'},400);
  const now=new Date().toISOString();
  await db().prepare('INSERT INTO accounts (user_id,email,name,created_at,updated_at) VALUES (?,?,?,?,?) ON CONFLICT(user_id) DO NOTHING').bind(user.userId,user.email,name,now,now).run();
  // Only the exact platform-authenticated owner's email may claim the initial
  // coach identity. From then on every permission uses the immutable Site user ID.
  if(user.email.toLowerCase()==='timliam.schneider@gmail.com'){
   await db().prepare('INSERT INTO coach (key,user_id) VALUES (?,?) ON CONFLICT(key) DO NOTHING').bind('owner',user.userId).run();
  }
  return json({account:await account(user.userId),isCoach:await isCoach(user.userId)});
 }catch(e){return unavailable(e);}
}
