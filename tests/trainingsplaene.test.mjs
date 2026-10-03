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
  selected.forEach(([, ,body],i)=>{assert.ok(body.includes(times[i]));assert.ok(body.includes('CHF '+price));assert.ok(body.includes(weeks+' Wochen'));assert.ok(body.includes(frequencies[i]));assert.ok(body.includes('Noch nicht verfügbar'));assert.doesNotMatch(body,/<(?:a|button|form)\b/);});
 }
 assert.match(cards[0][2],/ohne strukturierte Lauferfahrung/);assert.match(cards[3][2],/ca\. 5 km locker/);
 assert.match(cards[12][2],/5–6 Einheiten/);assert.match(cards[13][2],/5–7 Einheiten/);assert.match(cards[14][2],/6–8 Einheiten.*Double Days/);
});
test('preview has no purchase, reservation, payment or product-offer semantics',()=>{
 assert.doesNotMatch(page,/<form\b|stripe|checkout|payment|add.to.cart|preorder|"@type"\s*:\s*"(?:Product|Offer)"/i);
 assert.doesNotMatch(page,/Jetzt (?:kaufen|buchen)|Kaufen<|Reservieren<|Hybrid/i);
 assert.match(page,/NOCH NICHT VERFÜGBAR/);assert.match(page,/einmalig pro Account, nicht pro Trainingsplan/);
 assert.doesNotMatch(page,/Garmin|COROS|Polar|Suunto|Apple Watch/);
});
test('future features and separation from personal coaching remain explicit',()=>{
 for(const copy of ['PACE-ANPASSUNG · GEPLANT','hauptsächlich herzfrequenzgesteuert','Einzelne schlechte oder besonders gute','Kein Trainingsscore','Keine persönliche Coach-Auswertung','Keine individuellen Planänderungen durch Tim','Keine automatische Coach-Benachrichtigung','Keine persönliche 1:1-Betreuung','keine Erfolgsgarantie']) assert.ok(page.includes(copy),copy);
 assert.equal((page.match(/<details>/g)||[]).length,6);
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
