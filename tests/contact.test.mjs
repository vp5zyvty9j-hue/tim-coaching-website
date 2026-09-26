import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
const code = readFileSync(new URL('../public/contact.js', import.meta.url), 'utf8');
function setup({ honey = '', response = {ok:true,json:async()=>({success:'true',message:'The form was submitted successfully.'})}, transport, invalid = false, startValue = '', extraFields = {}, now } = {}) {
  const listeners = {}, button = {innerHTML:'Anfrage senden',disabled:false};
  const status = {dataset:{},classList:{add(){}},append(...nodes){ this.link=nodes[0]; }};
  const field = {name:'Vorname',value:'Test',disabled:false,willValidate:true,validity:{valid:!invalid},setAttribute(){},focus(){},scrollIntoView(){}};
  const start = {name:'Start',value:startValue,disabled:false,willValidate:true,min:'',message:'',setCustomValidity(message){this.message=message;},addEventListener(){},setAttribute(){},focus(){},scrollIntoView(){},get validity(){return {valid:!this.message}}};
  const elements = [field,start,button]; elements.namedItem=name=>name==='Start'?start:name==='_honey'?{value:honey}:null;
  const emitted=[];
  let sent=0, resets=0, options;
  const form = {elements,querySelector:()=>button,addEventListener:(event,cb)=>listeners[event]=cb,setAttribute(){},removeAttribute(){},reset(){resets++; field.value='';}};
  vm.runInNewContext(code,{document:{getElementById:id=>id==='contactForm'?form:status,createElement:()=>({}),dispatchEvent:e=>emitted.push(e)},CustomEvent:class {constructor(type,{detail}){this.type=type;this.detail=detail}},Date:now?class extends Date {constructor(){super(now)}}:Date,FormData:class { *[Symbol.iterator](){yield ['Vorname',field.value];yield ['Start',start.value];for(const entry of Object.entries(extraFields))yield entry;} },AbortController,setTimeout,clearTimeout,fetch:async(url,opts)=>{sent++;options=opts;assert.equal(url,'https://formsubmit.co/ajax/timliam.schneider@gmail.com');return transport?transport(opts):response;}});
  return {start,emitted,submit:()=>listeners.submit({preventDefault(){}}),field,status,button,get sent(){return sent},get resets(){return resets},get options(){return options}};
}
test('provider confirmation alone resets fields and reports success',async()=>{const s=setup();await s.submit();assert.equal(s.resets,1);assert.equal(s.field.value,'');assert.equal(s.status.dataset.state,'success');assert.equal(s.button.disabled,false);assert.deepEqual(JSON.parse(s.options.body),{Vorname:'Test',Start:''});});
for(const [name,response] of Object.entries({http:{ok:false,json:async()=>({success:'true',message:'The form was submitted successfully.'})},rejection:{ok:true,json:async()=>({success:'false'})},activation:{ok:true,json:async()=>({success:'true',message:'Please activate your form'})},html:{ok:true,json:async()=>{throw Error('HTML')}}}))test(`${name}: retain values and show footer contact link`,async()=>{const s=setup({response});await s.submit();assert.equal(s.resets,0);assert.equal(s.field.value,'Test');assert.equal(s.status.dataset.state,'error');assert.equal(s.status.link.href,'#footer-contact');assert.equal(s.button.disabled,false);});
test('network failure retains input',async()=>{const s=setup({transport:async()=>{throw Error('offline')}});await s.submit();assert.equal(s.resets,0);assert.equal(s.field.value,'Test');assert.equal(s.status.dataset.state,'error');});
test('pending request locks fields and prevents duplicate transmission',async()=>{let finish;const s=setup({transport:()=>new Promise(resolve=>finish=resolve)});const pending=s.submit();await s.submit();assert.equal(s.sent,1);assert.equal(s.field.disabled,true);assert.equal(s.button.textContent,'Wird gesendet …');finish({ok:true,json:async()=>({success:'true',message:'The form was submitted successfully.'})});await pending;assert.equal(s.field.disabled,false);});
test('required fields prevent transmission',async()=>{const s=setup({invalid:true});await s.submit();assert.equal(s.sent,0);assert.equal(s.resets,0);assert.equal(s.status.dataset.state,'error');});
test('honeypot prevents transmission without reporting success',async()=>{const s=setup({honey:'bot'});await s.submit();assert.equal(s.sent,0);assert.equal(s.resets,0);assert.equal(s.status.dataset.state,'error');});

test('concrete start date and structured funnel answers are included in the actual outbound JSON',async()=>{
 const data={version:'coaching-check-1',recommended:'Basic',selected:'Premium',answers:[{question:'Ziel',answer:'Schneller laufen'}]};
 const s=setup({startValue:'2026-10-15',now:'2026-09-27T12:00:00',extraFields:{Paket:'Premium','Coaching-Check':'Abgeschlossen','Beste Übereinstimmung':'Basic','Funnel-Daten':JSON.stringify(data),'Funnel-Antworten':'Ziel: Schneller laufen'}});
 await s.submit();const sent=JSON.parse(s.options.body);assert.equal(sent.Start,'2026-10-15');assert.deepEqual(JSON.parse(sent['Funnel-Daten']),data);assert.equal(sent.Paket,'Premium');assert.equal(s.emitted[0].type,'tim:contact-success');assert.deepEqual(JSON.parse(JSON.stringify(s.emitted[0].detail)),{package:'Premium',funnel:true,recommended:'Basic'});
});
test('past date blocks transmission and sets local calendar minimum',async()=>{const s=setup({startValue:'2026-09-26',now:'2026-09-27T00:05:00'});await s.submit();assert.equal(s.start.min,'2026-09-27');assert.equal(s.sent,0);assert.match(s.start.message,/späteres Datum/);});
test('today is accepted and date is optional',async()=>{for(const value of ['2026-09-27','']){const s=setup({startValue:value,now:'2026-09-27T23:55:00'});await s.submit();assert.equal(s.sent,1);assert.equal(s.start.message,'');}});
test('failed provider response does not emit a successful funnel request event',async()=>{const s=setup({response:{ok:false,json:async()=>({})},extraFields:{'Coaching-Check':'Abgeschlossen'}});await s.submit();assert.equal(s.emitted.length,0);});
