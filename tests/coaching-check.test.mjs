import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {questions,normalize,recommend,payload,packages} from '../public/coaching-logic.js';
const runner={goal:'endurance',training:'endurance',level:'beginner',race:'5k',sport:'running',enduranceFocus:'routine',time:'1-3',structure:'no',nutrition:'no',support:'plan',priority:'structure'};
const hybrid={...runner,goal:'hybrid',training:'hybrid',level:'advanced',strengthGoal:'power',nutrition:'no'};
const strength={...runner,goal:'strength',training:'strength',equipment:'gym',strengthGoal:'muscle'};
for(const [name,a,best] of [['A Laufanfänger',runner,'Basic'],['B Hybrid ohne Ernährung',hybrid,'Basic Plus'],['C Hybrid mit Ernährung',{...hybrid,nutrition:'yes'},'Premium'],['D Kraftsportler',strength,'Kraftplan'],['E Wettkampfläufer',{...runner,level:'competitive',race:'marathon'},'Basic']])test(name,()=>{const r=recommend(a);assert.equal(r.best,best);assert(r.rows.some(p=>p.name==='Premium'));assert(r.rows.length<=3);assert.equal(questions(normalize(a)).length,best==='Kraftplan'?10:11);if(best!=='Premium')assert.match(r.rows.find(p=>p.name==='Premium').tradeoff,/über deine aktuelle Auswahl/);});
test('Premium is always visible, never falsely the best based on care/level alone',()=>{for(const training of ['endurance','strength','both','hybrid','food','unsure'])for(const nutrition of ['no','maybe','yes','main']){const r=recommend({...runner,goal:'fitness',training,nutrition,level:'competitive',support:'full'});assert(r.rows.some(p=>p.name==='Premium'));assert(r.rows.length<=3);if(r.best==='Premium')assert(['both','hybrid'].includes(training)&&['yes','main'].includes(nutrition));}});
test('unresolved focus and contradictory nutrition do not force a best fit',()=>{for(const a of [{...runner,goal:'body',training:'unsure',focus:'unsure'},{...runner,training:'food',nutrition:'no'}]){const r=recommend(a);assert.equal(r.best,null);assert.equal(r.rows.find(p=>p.name==='Premium').name,'Premium');}});
test('adaptive changes clear stale running answers but retain compatible answers',()=>{const a=normalize({...runner,training:'strength'});assert.equal(a.race,undefined);assert.equal(a.enduranceFocus,undefined);assert.equal(a.time,'1-3');assert.equal(questions(a)[3].id,'equipment');assert.equal(questions(a)[4].id,'strengthGoal');});
test('clarifying unsure branch remains stable',()=>{const a=normalize({...runner,goal:'body',training:'unsure',focus:'both',strengthGoal:'power'});assert.equal(questions(a)[3].id,'focus');assert.equal(questions(a)[4].id,'sport');assert(questions(a).some(q=>q.id==='strengthGoal'));assert.equal(recommend(a).best,'Basic Plus');});
test('handoff preserves factual recommendation even if visitor chooses Premium',()=>{const p=payload(runner,'Premium');assert.equal(p.recommended,'Basic');assert.equal(p.selected,'Premium');assert.equal(p.answers.length,11);assert.equal(p.version,'coaching-check-2');});
test('funnel prices and benefits exactly match current crawlable package cards',()=>{const html=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');const cards=[...html.matchAll(/<article class="offer [^"]*">([\s\S]*?)<\/article>/g)].map(m=>m[1]);assert.equal(cards.length,packages.length);for(const p of packages){const card=cards.find(c=>c.includes(`<h3>${p.name}</h3>`));assert(card.includes(`CHF ${p.price}`));for(const feature of p.features)assert(card.includes(`<li>${feature}</li>`));}});

test('non-running endurance remains Basic without asking for running distances',()=>{
 for(const sport of ['general','other']){
  const a=normalize({...runner,sport});
  assert.equal(a.race,undefined);
  assert(!questions(a).some(q=>q.id==='race'));
  assert.equal(recommend(a).best,'Basic');
  assert.equal(questions(a).length,10);
  if(sport==='other')assert(recommend(a).notes.some(n=>n.includes('konkrete Ausdauersportart')));
 }
});
test('running distances appear only after sport selection and are cleared on changing sport',()=>{
 assert(!questions({training:'endurance'}).some(q=>q.id==='race'));
 assert(questions(runner).find(q=>q.id==='race').options.some(o=>o.value==='marathon'));
 const changed=normalize({...runner,sport:'other'});
 assert(!payload(changed,'Basic').answers.some(a=>a.id==='race'));
 assert.equal(changed.enduranceFocus,'routine');
 assert.equal(changed.time,'1-3');
});
test('all adaptive paths can reach a complete result with unique questions',()=>{
 for(const training of ['endurance','both','hybrid','strength','food','unsure'])for(const sport of ['running','general','other'])for(const focus of ['endurance','both','strength','food','unsure']){
  let a={};let step=0;
  while(step<questions(a).length){
   const q=questions(a)[step];const preferred={goal:'fitness',training,sport,focus,nutrition:'no'}[q.id];
   a=normalize({...a,[q.id]:q.options.find(o=>o.value===preferred)?.value||q.options[0].value});step++;
   assert(step<=12);
  }
  const qs=questions(a);assert.equal(new Set(qs.map(q=>q.id)).size,qs.length);
  assert(qs.every(q=>a[q.id]));assert(payload(a,'Premium').answers.every(row=>row.answer));
  assert(recommend(a).rows.some(p=>p.name==='Premium'));
 }
});

test('new goals choose matching standalone offers without inventing training needs',()=>{
 for(const [goal,best] of [['fitness','Kraftplan'],['strength','Kraftplan'],['lose','Ernährung'],['gain','Ernährung'],['sportfood','Ernährung']]){
  const answers=normalize({goal,training:'unsure',nutrition:'yes',priority:'structure'});
  assert.equal(recommend(answers).best,best);
  const premium=recommend(answers).rows.find(p=>p.name==='Premium');
  assert(premium.tradeoff.includes('über deine aktuelle Auswahl'));
 }
 assert.equal(recommend({goal:'sportfood',training:'both',nutrition:'yes'}).best,'Premium');
 assert.equal(recommend({goal:'lose',training:'food',nutrition:'no'}).best,null);
 assert.equal(recommend({goal:'fitness',training:'endurance',nutrition:'no'}).best,'Basic');
});
test('nutrition can be selected with no sport; changing to strength clears no-training time',()=>{
 const answers=normalize({goal:'gain',training:'food',level:'inactive',time:'none',nutrition:'yes'});
 assert.equal(answers.time,'none');assert.equal(answers.level,'inactive');assert.equal(recommend(answers).best,'Ernährung');
 assert.equal(normalize({...answers,training:'strength'}).time,undefined);
});
test('introductory prices agree in structured data and content, without comparison pricing',()=>{
 const html=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
 const data=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
 const offers=data['@graph'].find(n=>n['@type']==='Service').hasOfferCatalog.itemListElement;
 assert.deepEqual(packages.map(p=>p.price),[139,189,269,109,109]);
 for(const p of packages)assert.equal(offers.find(o=>o.itemOffered.name===p.name).price,p.price);
 assert(!/<(?:del|s)[ >]/.test(html));
 for(const p of packages)assert.equal(p.features.some(f=>f.includes('4-Wochen')),['Basic','Basic Plus','Premium'].includes(p.name));
});

test('changing a previously unclear goal clears its stale focus',()=>{
 const a=normalize({goal:'gain',training:'unsure',focus:'both',nutrition:'yes'});
 assert.equal(a.focus,undefined);assert.equal(recommend(a).best,'Ernährung');
});
