export function period(url,now=new Date()){
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Zurich',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
 const shift=(d,n)=>{const x=new Date(d+'T12:00:00Z');x.setUTCDate(x.getUTCDate()+n);return x.toISOString().slice(0,10)};
 const preset=url.searchParams.get('period')||'30';let from=shift(today,-29),to=today;
 if(preset==='today')from=today;else if(preset==='yesterday')from=to=shift(today,-1);else if(['7','30','90'].includes(preset))from=shift(today,1-Number(preset));
 else if(preset==='custom'){from=url.searchParams.get('from');to=url.searchParams.get('to')}
 const valid=d=>/^\d{4}-\d{2}-\d{2}$/.test(d||'')&&!isNaN(Date.parse(d))&&new Date(d).toISOString().slice(0,10)===d;
 if(!valid(from)||!valid(to)||from>to||(Date.parse(to)-Date.parse(from))/86400000>366)throw Error('invalid_period');
 // Filter Zurich dates consistently across DST using per-event conversion below.
 return {from,to};
}
const ratio=(a,b)=>b?Math.round(a/b*10000)/100:null;
export async function buildReport(db,url,now=new Date()){
 const range=period(url,now);const environment=url.searchParams.get('environment')==='test'?'test':'live';
 const raw=await db.prepare('SELECT * FROM events WHERE environment=? AND occurred_at>=? AND occurred_at<? ORDER BY occurred_at').bind(environment,new Date(Date.parse(range.from)-86400000).toISOString(),new Date(Date.parse(range.to)+172800000).toISOString()).all();
 const day=x=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Zurich',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(x));
 const events=raw.results.filter(e=>day(e.occurred_at)>=range.from&&day(e.occurred_at)<=range.to);
 const counts={};for(const e of events)counts[e.event_name]=(counts[e.event_name]||0)+1;
 const by=(key)=>{const map=new Map();for(const e of events){const id=e[key]||'unknown';const v=map.get(id)||{name:id,visits:0,page_views:0,events:0,first_call_submit:0,checkout_start:0,purchase_success:0,revenue:0,training_plan_view:0};v.events++;if(e.event_name==='page_view'&&e.is_entry)v.visits++;if(e.event_name==='page_view')v.page_views++;if(['first_call_submit','checkout_start','purchase_success','training_plan_view'].includes(e.event_name))v[e.event_name]++;if(e.event_name==='purchase_success')v.revenue+=e.amount_minor;map.set(id,v)}return [...map.values()].sort((a,b)=>b.page_views-a.page_views||b.events-a.events)};
 const days=new Map();for(let n=Date.parse(range.from);n<=Date.parse(range.to);n+=86400000)days.set(new Date(n).toISOString().slice(0,10),{page_views:0,visits:0});for(const e of events)if(e.event_name==='page_view'){const d=days.get(day(e.occurred_at));if(d){d.page_views++;if(e.is_entry)d.visits++}}
 const visits=events.filter(e=>e.event_name==='page_view'&&e.is_entry).length;
 const pv=counts.page_view||0,c=counts.first_call_click||0,v=counts.training_plan_view||0,ch=counts.checkout_start||0,p=counts.purchase_success||0;
 const today=period(new URL('https://test/?period=today'),now).from;
 const recent=(await db.prepare("SELECT occurred_at FROM events WHERE environment=? AND event_name='page_view' AND is_entry=1 AND occurred_at>=?").bind(environment,new Date(Date.parse(today)-31*86400000).toISOString()).all()).results;
 const visitWindows={};for(const n of [1,7,30]){const start=new Date(Date.parse(today)-(n-1)*86400000).toISOString().slice(0,10);visitWindows[n]=recent.filter(e=>day(e.occurred_at)>=start&&day(e.occurred_at)<=today).length;}
 const totals={visits,visits_today:visitWindows[1],visits_7_days:visitWindows[7],visits_30_days:visitWindows[30],page_views:pv,unique_people:null,first_call_submit:counts.first_call_submit||0,checkout_start:ch,purchase_success:p,revenue:events.filter(e=>e.event_name==='purchase_success').reduce((s,e)=>s+e.amount_minor,0),currency:'CHF'};
 const first=await db.prepare('SELECT MIN(occurred_at) AS first_event FROM events WHERE environment=?').bind(environment).first();
 return {range,environment,timezone:'Europe/Zurich',first_event:first?.first_event||null,totals,counts,daily:[...days].map(([date,metrics])=>({date,...metrics})),sources:by('source'),campaigns:by('campaign'),pages:by('page_path'),devices:by('device'),countries:by('country'),plans:by('plan_id').filter(x=>x.name!=='unknown'),rates:{first_call_click:ratio(c,visits),first_call_submit:ratio(totals.first_call_submit,visits),form_completion:ratio(totals.first_call_submit,c),plan_interest:ratio(v,visits),checkout:ratio(ch,v),purchase:ratio(p,visits),checkout_conversion:ratio(p,ch)},notice:'Besuche = Einstiege ohne internen Referrer; eine Annäherung ohne Wiedererkennung. Keine personenübergreifende Wiedererkennung. Raten sind Ereignisquotienten, keine personenbezogenen sequenziellen Funnels. Mehrere Ansichten/CTAs können Quoten über 100 % erzeugen.'};
}
