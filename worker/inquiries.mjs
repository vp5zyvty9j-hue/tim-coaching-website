// Public anon identifier for Supabase's JWT gateway, never a service-role key.
const projectAnonKey="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4enljc2FucnF4YmZtdmVvc2xlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzNTQxMDksImV4cCI6MjEwNTkzMDEwOX0.XbJdYxQRnhEgvnjaruAy3wYsfLncOq-DbucFe8VTEr8";
const endpoint='https://hxzycsanrqxbfmveosle.supabase.co/functions/v1/coaching-inquiry';
const allowed=['Vorname','email','Paket','Ziel','Sporterfahrung','Trainingszeit','Start','Weitere Angaben','Ausdauersportart','Trainingsumfang','Ausdauerziel','Trainingsplanung','Krafterfahrung','Ausstattung','Kraftziel','Essgewohnheiten','Vorlieben','Ernährungsalltag','Coaching-Check','Beste Übereinstimmung','Gewähltes Funnel-Paket','Funnel-Antworten'];
export async function coachingInquiry(request,env,fetcher=fetch,onConfirmed=null){
 const reply=(status,success=false)=>new Response(JSON.stringify({success}),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
 if(request.method!=='POST')return reply(405);
 if(request.headers.get('origin')!=='https://timschneider.ch'||!(request.headers.get('content-type')||'').startsWith('application/json'))return reply(403);
 try{
  const proxySecret=env.WEBSITE_INQUIRY_SECRET;
  if(typeof proxySecret!=='string'||proxySecret.length<32||proxySecret.length>256)return reply(503);
  // CF-Connecting-IP is supplied by Cloudflare, never a form field. No IP logging.
  const ip=request.headers.get('CF-Connecting-IP');if(!ip||!env.INQUIRY_RATE_LIMIT)return reply(503);
  if(!(await env.INQUIRY_RATE_LIMIT.limit({key:ip})).success)return reply(429);
  const reader=request.body?.getReader();if(!reader)return reply(400);let total=0;const chunks=[];
  try{for(;;){const {done,value}=await reader.read();if(done)break;total+=value.length;if(total>34000){await reader.cancel();return reply(413);}chunks.push(value);}}finally{reader.releaseLock();}
  const bytes=new Uint8Array(total);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}
  let p;try{p=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}catch{return reply(400);}
  if(!p||typeof p!=='object'||Array.isArray(p)||!p.form||typeof p.form!=='object'||Array.isArray(p.form)||p.honey!==''||Object.keys(p).some(k=>!['request_id','form','honey'].includes(k)))return reply(400);
  if(Object.keys(p.form).some(k=>!allowed.includes(k)))return reply(400);
  const response=await fetcher(endpoint,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+projectAnonKey,apikey:projectAnonKey,Origin:'https://timschneider.ch','x-tim-inquiry-auth':proxySecret},body:JSON.stringify(p),redirect:'manual',signal:AbortSignal.timeout(18000)});
  const data=await response.json().catch(()=>null);
  if(response.status===200&&data?.success===true){
   // Isolated observability: failures cannot affect an accepted inquiry.
   try{Promise.resolve(onConfirmed?.(p.request_id)).catch(()=>{});}catch{}
   return reply(200,true);
  }
  return reply([400,429].includes(response.status)?response.status:503);
 }catch{return reply(503);}
}
