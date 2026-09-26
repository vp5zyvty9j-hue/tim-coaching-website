import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
const code = readFileSync(new URL('../public/contact.js', import.meta.url), 'utf8');
function setup({ honey = '', response = {ok:true,json:async()=>({success:'true',message:'The form was submitted successfully.'})}, transport, invalid = false } = {}) {
  const listeners = {}, button = {innerHTML:'Anfrage senden',disabled:false};
  const status = {dataset:{},classList:{add(){}},append(...nodes){ this.link=nodes[0]; }};
  const field = {name:'Vorname',value:'Test',disabled:false,willValidate:true,validity:{valid:!invalid},setAttribute(){},focus(){},scrollIntoView(){}};
  const elements = [field,button]; elements.namedItem=()=>({value:honey});
  let sent=0, resets=0, options;
  const form = {elements,querySelector:()=>button,addEventListener:(event,cb)=>listeners[event]=cb,setAttribute(){},removeAttribute(){},reset(){resets++; field.value='';}};
  vm.runInNewContext(code,{document:{getElementById:id=>id==='contactForm'?form:status,createElement:()=>({})},FormData:class { *[Symbol.iterator](){yield ['Vorname',field.value];} },AbortController,setTimeout,clearTimeout,fetch:async(url,opts)=>{sent++;options=opts;assert.equal(url,'https://formsubmit.co/ajax/timliam.schneider@gmail.com');return transport?transport(opts):response;}});
  return {submit:()=>listeners.submit({preventDefault(){}}),field,status,button,get sent(){return sent},get resets(){return resets},get options(){return options}};
}
test('provider confirmation alone resets fields and reports success',async()=>{const s=setup();await s.submit();assert.equal(s.resets,1);assert.equal(s.field.value,'');assert.equal(s.status.dataset.state,'success');assert.equal(s.button.disabled,false);assert.deepEqual(JSON.parse(s.options.body),{Vorname:'Test'});});
for(const [name,response] of Object.entries({http:{ok:false,json:async()=>({success:'true',message:'The form was submitted successfully.'})},rejection:{ok:true,json:async()=>({success:'false'})},activation:{ok:true,json:async()=>({success:'true',message:'Please activate your form'})},html:{ok:true,json:async()=>{throw Error('HTML')}}}))test(`${name}: retain values and show clickable email error`,async()=>{const s=setup({response});await s.submit();assert.equal(s.resets,0);assert.equal(s.field.value,'Test');assert.equal(s.status.dataset.state,'error');assert.equal(s.status.link.href,'mailto:timliam.schneider@gmail.com');assert.equal(s.button.disabled,false);});
test('network failure retains input',async()=>{const s=setup({transport:async()=>{throw Error('offline')}});await s.submit();assert.equal(s.resets,0);assert.equal(s.field.value,'Test');assert.equal(s.status.dataset.state,'error');});
test('pending request locks fields and prevents duplicate transmission',async()=>{let finish;const s=setup({transport:()=>new Promise(resolve=>finish=resolve)});const pending=s.submit();await s.submit();assert.equal(s.sent,1);assert.equal(s.field.disabled,true);assert.equal(s.button.textContent,'Wird gesendet …');finish({ok:true,json:async()=>({success:'true',message:'The form was submitted successfully.'})});await pending;assert.equal(s.field.disabled,false);});
test('required fields prevent transmission',async()=>{const s=setup({invalid:true});await s.submit();assert.equal(s.sent,0);assert.equal(s.resets,0);assert.equal(s.status.dataset.state,'error');});
test('honeypot prevents transmission without reporting success',async()=>{const s=setup({honey:'bot'});await s.submit();assert.equal(s.sent,0);assert.equal(s.resets,0);assert.equal(s.status.dataset.state,'error');});
