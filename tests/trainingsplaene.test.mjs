import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import worker from '../worker/index.mjs';
const page=await readFile(new URL('../public/trainingsplaene.html',import.meta.url),'utf8');
const cards=[...page.matchAll(/<article class="plan-card" data-distance="([^"]+)">([\s\S]*?)<\/article>/g)];
const expected=[['5-km',29,16,['30:00','25:00','20:00'],['3–4 Läufe','4–5 Läufe','5–6 Läufe']],['10-km',35,16,['60:00','50:00','40:00'],['3–4 Läufe','4–5 Läufe','5–6 Läufe']],['halbmarathon',39,20,['2:00','1:45','1:30'],['ca. 4 Läufe','ca. 4–5 Läufe','ca. 5–6 Läufe']],['marathon',49,24,['4:30','3:45','3:15'],['ca. 4–5 Läufe','ca. 5 Läufe','ca. 5–6 Läufe']],['100-km',69,32,['15:00','13:00','11:00'],['mindestens 5 Lauftage','5–6 Lauftage','5–7 Lauftage']]];
test('exact 15 running plans retain approved prices, durations, targets and frequency',()=>{
 assert.equal(cards.length,15);
 for(const [distance,price,weeks,times,frequencies] of expected){
  const selected=cards.filter(c=>c[1]===distance);assert.equal(selected.length,3);
  selected.forEach(([, ,body],i)=>{assert.ok(body.includes(times[i]));assert.ok(body.includes('CHF '+price));assert.ok(body.includes(weeks+' Wochen'));assert.ok(body.includes(frequencies[i]));assert.match(body,/Kaufen <span/);assert.doesNotMatch(body,/<(?:button|form)\b/);});
 }
 assert.match(cards[0][2],/ohne strukturierte Lauferfahrung/);assert.match(cards[3][2],/ca\. 5 km locker/);
 assert.match(cards[12][2],/5–6 Einheiten/);assert.match(cards[13][2],/5–7 Einheiten/);assert.match(cards[14][2],/6–8 Einheiten.*Double Days/);
});
test('plan links open app selection without direct payment or reservation',()=>{
 assert.doesNotMatch(page,/<form\b|stripe|checkout|payment|add.to.cart|preorder|"@type"\s*:\s*"(?:Product|Offer)"/i);
 assert.doesNotMatch(page,/Jetzt (?:kaufen|buchen)|Reservieren<|Hybrid/i);
 assert.match(page,/löst keine Zahlung aus/);assert.match(page,/einmalig pro Account, nicht pro Trainingsplan/);
 assert.doesNotMatch(page,/Garmin|COROS|Polar|Suunto|Apple Watch/);
});
test('pace capability, future device feature and separation from coaching remain explicit',()=>{
 for(const copy of ['AUTOMATISCHE PACE-ANPASSUNG','hauptsächlich herzfrequenzgesteuert','Einzelne schlechte oder besonders gute','Kein Trainingsscore','Keine persönliche Coach-Auswertung','Keine individuellen Planänderungen durch Tim','Keine automatische Coach-Benachrichtigung','Keine persönliche 1:1-Betreuung','keine Erfolgsgarantie']) assert.ok(page.includes(copy),copy);
 assert.equal((page.match(/<details>/g)||[]).length,7);
});
test('all marketing pages provide both desktop and mobile route plus footer discovery',async()=>{
 for(const name of ['index','erfolge','empfehlungen','trainingsplaene']){
  const html=await readFile(new URL('../public/'+name+'.html',import.meta.url),'utf8');
  for(const pattern of [/<nav class="desktop-nav"[\s\S]*?<\/nav>/,/<div class="mobile-menu"[\s\S]*?<\/div>/,/<footer class="footer">[\s\S]*?<\/footer>/])assert.match(html.match(pattern)?.[0]||'',/href="\/trainingsplaene.html"/,name);
 }
});
test('preview route canonicalises and serves asset while keeping security headers',async()=>{
 const env={ASSETS:{fetch:async()=>new Response(page,{status:200})}};
 for(const path of ['/trainingsplaene','/trainingsplaene/']){const r=await worker.fetch(new Request('https://timschneider.ch'+path),env);assert.equal(r.status,308);assert.equal(r.headers.get('location'),'https://timschneider.ch/trainingsplaene.html');}
 const r=await worker.fetch(new Request('https://timschneider.ch/trainingsplaene.html'),env);assert.equal(r.status,200);assert.ok(r.headers.get('content-security-policy'));assert.equal(await r.text(),page);
 assert.match(page,/<link rel="canonical" href="https:\/\/timschneider.ch\/trainingsplaene.html">/);
});

const selectedPlans = [{"name": "5 km – 30:00", "version_id": "ad918788-aea5-50d8-9b13-a0b5ac22262f", "distance": "5-km"}, {"name": "5 km – 25:00", "version_id": "7ff4dbc7-0c31-5195-832c-b68c7fc9b27f", "distance": "5-km"}, {"name": "5 km – 20:00", "version_id": "c39ddcd6-bbb7-5000-accd-81e8f4b1b225", "distance": "5-km"}, {"name": "10 km – 60:00", "version_id": "a8137abc-841c-5818-a18c-831479c1d488", "distance": "10-km"}, {"name": "10 km – 50:00", "version_id": "52103595-e081-56aa-a492-fb40a1f27478", "distance": "10-km"}, {"name": "10 km – 40:00", "version_id": "8f9034e8-f934-55f8-95c6-39db320365be", "distance": "10-km"}, {"name": "Halbmarathon – 2:00", "version_id": "00e10515-8ace-502d-bd8f-b5df32cc33be", "distance": "halbmarathon"}, {"name": "Halbmarathon – 1:45", "version_id": "e76fd2ff-799b-55b7-b944-f1e77a356625", "distance": "halbmarathon"}, {"name": "Halbmarathon – 1:30", "version_id": "6353301a-3826-501c-8e1f-f938f14c44e9", "distance": "halbmarathon"}, {"name": "Marathon – 4:30", "version_id": "00174a4a-eb4e-5c9e-8bc0-adbf6554fbb8", "distance": "marathon"}, {"name": "Marathon – 3:45", "version_id": "d51b0ca7-a7ef-59c6-ae9f-1eac7a58d7c3", "distance": "marathon"}, {"name": "Marathon – 3:15", "version_id": "30488de2-03d5-5f30-a028-c3e4ad39ad49", "distance": "marathon"}, {"name": "100 km – 15:00", "version_id": "b74703b7-ef39-5ae1-be28-3f4219d864ee", "distance": "100-km"}, {"name": "100 km – 13:00", "version_id": "53398717-7646-5af9-8c41-75658d0480e5", "distance": "100-km"}, {"name": "100 km – 11:00", "version_id": "cd0ba348-7547-58de-931b-464a0d98d26c", "distance": "100-km"}];
test('all 15 buy links pin the exact canonical distance and target without redirect or payment parameters',()=>{
 const seen=new Set();
 cards.forEach((card,i)=>{
  const link=[...card[2].matchAll(/<a [^>]*href="([^"]+)"[^>]*>/g)];assert.equal(link.length,1);
  const url=new URL(link[0][1]); const expected=selectedPlans[i];
  assert.equal(url.origin,'https://app.timschneider.ch');assert.equal(url.pathname,'/weitere-angebote');
  assert.deepEqual([...url.searchParams],[['plan',expected.version_id]]);assert.equal(url.hash,'');
  assert.equal(card[1],expected.distance);assert.ok(card[2].includes('aria-label="'+expected.name+' in der App kaufen"'));
  assert.ok(!seen.has(expected.version_id));seen.add(expected.version_id);
 });assert.equal(seen.size,15);
 const device=page.match(/<section class="section plans-device">([\s\S]*?)<\/section>/)[1];
 assert.match(device,/Noch nicht verfügbar/);assert.doesNotMatch(device,/<a |Kaufen/);
});
