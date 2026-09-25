import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import type { Account } from './subscriptions';
export function db(){ if(!env.DB)throw Error('Database unavailable');return env.DB; }
export function json(data:unknown,status=200){return Response.json(data,{status,headers:{'Cache-Control':'private, no-store','Vary':'Cookie'}});}
export async function identity(){return getChatGPTUser();}
export async function isCoach(userId:string){const row=await db().prepare('SELECT user_id FROM coach WHERE key = ?').bind('owner').first<{user_id:string}>();return row?.user_id===userId;}
export function sameOrigin(request:Request){const origin=request.headers.get('origin');return !!origin&&origin===new URL(request.url).origin;}
export async function account(userId:string){return db().prepare('SELECT * FROM accounts WHERE user_id = ?').bind(userId).first<Account>();}
export function unavailable(error:unknown){console.error('Portal operation failed',error instanceof Error?error.message:'Unknown error');return json({error:'Deine Daten sind gerade nicht verfügbar. Bitte versuche es erneut.'},503);}
