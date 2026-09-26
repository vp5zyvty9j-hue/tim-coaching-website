import {questions,normalize,label,answerSummary,recommend,payload} from './coaching-logic.js';
const dialog=document.getElementById('coachingCheckDialog');
const content=document.getElementById('coachingCheckContent');
const start=document.getElementById('startCoachingCheck');
const form=document.getElementById('contactForm');
const picker=document.getElementById('package');
const context=document.getElementById('funnelContext');
const fields=document.getElementById('funnelFields');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let answers={},step=0,completed=false,selected='',attached=null,opened=false,autoValues={};
function emit(event,detail={}){document.dispatchEvent(new CustomEvent('tim:coaching-check',{detail:{version:1,event,...detail}}));}
function focusTitle(){dialog.scrollTop=0;content.querySelector('#checkDialogTitle')?.focus({preventScroll:true});}
function title(text){return `<h2 id="checkDialogTitle" tabindex="-1">${text}</h2>`;}
function renderQuestion(){
 const q=questions(answers)[step];emit('question_reached',{step:step+1,question:q.id});
 content.innerHTML=`<div class="cc-question"><div class="cc-step"><span id="cc-progress-label">${String(step+1).padStart(2,'0')} / 10</span><button type="button" class="cc-link" data-action="restart">Neu beginnen</button></div><progress max="10" value="${step+1}" aria-labelledby="cc-progress-label"></progress><p class="cc-eyebrow">${esc(q.kicker)}</p>${title(esc(q.title))}<p id="cc-help" class="cc-help">${esc(q.help)}</p><form id="cc-question-form"><fieldset aria-describedby="cc-help"><legend class="cc-sr-only">${esc(q.title)}</legend>${q.options.map(o=>`<label class="cc-option"><input type="radio" name="${q.id}" value="${o.value}" ${answers[q.id]===o.value?'checked':''} required><span>${esc(o.label)}</span></label>`).join('')}</fieldset><div class="cc-controls"><button class="cc-link" type="button" data-action="back">← Zurück</button><button class="cc-button" type="submit" ${answers[q.id]?'':'disabled'}>${step===9?'Ergebnis ansehen':'Weiter'} <span aria-hidden="true">→</span></button></div></form><p class="cc-small">Eine Antwort pro Frage. Deine Angaben bleiben beim Zurückgehen erhalten.</p></div>`;focusTitle();
}
function renderResult(focus=true){
 const r=recommend(answers);if(!r.rows.some(p=>p.name===selected))selected=r.best||'';
 content.innerHTML=`<div class="cc-result"><p class="cc-eyebrow">DEIN COACHING-CHECK</p>${title('Diese Coachings<br><em>passen zu dir.</em>')}<p class="cc-help">Dein Ziel: ${esc(label(answers,'goal'))}. Dein Trainingsstand: ${esc(label(answers,'level'))}. Du planst ${esc(label(answers,'time'))} Training pro Woche ein.</p><div class="cc-packages">${r.rows.map(p=>`<article class="cc-package ${p.name==='Premium'?'cc-premium':''} ${p.name===r.best?'cc-best':''}" aria-label="${esc(p.name)}${p.name===r.best?' – Beste Übereinstimmung':''}"><p class="cc-badge">${p.name===r.best?'BESTE ÜBEREINSTIMMUNG':p.name==='Premium'?'UMFASSENDSTE BETREUUNG':'ALTERNATIVE'}</p><h3>${esc(p.name)}</h3><p class="cc-subtitle">${esc(p.subtitle)}</p><p class="cc-price"><strong>CHF ${p.price}</strong> <span>pro Monat</span></p><h4>${p.name===r.best?'Warum dieses Coaching zu dir passt':p.name==='Premium'?'Wenn du breiter betreut werden möchtest':'Was diese Alternative abdeckt'}</h4><p class="cc-reason">${esc(p.reason)}</p>${p.tradeoff?`<p class="cc-tradeoff">${esc(p.tradeoff)}</p>`:''}<ul>${p.features.map(f=>`<li>${esc(f)}</li>`).join('')}</ul><button type="button" class="cc-button cc-choose" data-choice="${esc(p.name)}" aria-pressed="${selected===p.name}">${selected===p.name?'Ausgewählt ✓':'Dieses Paket wählen →'}</button></article>`).join('')}</div>${r.notes.length?`<div class="cc-notes">${r.notes.map(n=>`<p>${esc(n)}</p>`).join('')}</div>`:''}<p class="cc-small">„Umfassendste Betreuung“ bezeichnet die Kombination von Laufen, Kraft und Ernährung. Die vereinbarten Kontaktzeiten gelten für alle Pakete: ein wöchentlicher Check-in und eine gebündelte Fragerunde; Antwort innerhalb von zwei Werktagen.</p><div class="cc-result-action"><div><p class="cc-selection" aria-live="polite">Deine Auswahl: <strong>${esc(selected||'Im Erstgespräch klären')}</strong></p><button type="button" class="cc-button" data-action="contact">Unverbindliches Erstgespräch anfragen →</button></div><button type="button" class="cc-link" data-action="edit">Antworten bearbeiten</button></div><p class="cc-small">Deine Antworten werden in das Formular übernommen und erst mit deiner Anfrage versendet. Alle Preise pro Monat, keine Mindestlaufzeit über einen Monat.</p><details><summary>Deine zehn Antworten ansehen</summary>${summary(answerSummary(answers))}</details></div>`;
 if(focus)focusTitle();
}
function summary(items){return `<dl class="cc-summary">${items.map(a=>`<div><dt>${esc(a.question)}</dt><dd>${esc(a.answer)}</dd></div>`).join('')}</dl>`;}
function close(reason='closed'){
 if(opened&&!completed)emit('funnel_abandoned',{step:step+1,reason});
 opened=false;dialog.close();start.focus({preventScroll:true});
}
function resetModel(){answers={};step=0;selected='';completed=false;}
function fieldValue(name,value){const field=form.elements.namedItem(name);if(!field||!value)return;if(!field.value||field.value===autoValues[name]){field.value=value;autoValues[name]=value;}}
function syncAttached(){
 if(!attached)return;
 attached.selected=picker.value||'Im Erstgespräch klären';
 const values={
  'Coaching-Check':'Abgeschlossen',
  'Beste Übereinstimmung':attached.recommended,
  'Gewähltes Funnel-Paket':attached.selected,
  'Funnel-Antworten':attached.answers.map(a=>`${a.question}: ${a.answer}`).join('\n'),
  'Funnel-Daten':JSON.stringify(attached)
 };
 fields.replaceChildren();
 for(const [name,value] of Object.entries(values)){const input=document.createElement('input');input.type='hidden';input.name=name;input.value=value;fields.append(input);}
 context.hidden=false;
 context.innerHTML=`<p><strong>Coaching-Check übernommen</strong><br>Beste Übereinstimmung: ${esc(attached.recommended)} · Gewählt: ${esc(attached.selected)}</p><details><summary>Mitgesendete Antworten ansehen</summary>${summary(attached.answers)}</details><button type="button" class="cc-link" id="removeFunnelContext">Check-Angaben entfernen</button>`;
}
function clearAttached(clearAutofill=true){
 if(clearAutofill)document.dispatchEvent(new CustomEvent('tim:clear-funnel-autofill',{detail:{values:{...autoValues}}}));
 if(clearAutofill)for(const [name,value] of Object.entries(autoValues)){const field=form.elements.namedItem(name);if(field?.value===value)field.value='';}
 attached=null;autoValues={};fields.replaceChildren();context.replaceChildren();context.hidden=true;resetModel();
}
function handoff(){
 if(form.getAttribute('aria-busy')==='true')return;
 attached=payload(answers,selected);
 if(!selected&&!picker.querySelector('option[value="Noch offen"]')){const option=document.createElement('option');option.value='Noch offen';option.textContent='Im Erstgespräch klären';picker.append(option);}
 picker.value=selected||'Noch offen';picker.dispatchEvent(new Event('change',{bubbles:true}));
 fieldValue('Ziel',label(answers,'goal'));
 fieldValue('Sporterfahrung',label(answers,'level'));
 fieldValue('Trainingszeit',label(answers,'time'));
 fieldValue('Laufziel',label(answers,'race'));
 fieldValue('Kraftziel',label(answers,'strengthGoal'));
 fieldValue('Ausstattung',label(answers,'equipment'));
 fieldValue('Essgewohnheiten',label(answers,'routine'));
 syncAttached();emit('consultation_opened',{recommended:attached.recommended,selected:attached.selected});
 close('contact');form.scrollIntoView({behavior:'auto',block:'start'});form.elements.namedItem('Vorname').focus({preventScroll:true});
}
content.addEventListener('change',e=>{
 if(!e.target.closest('#cc-question-form'))return;
 answers=normalize({...answers,[questions(answers)[step].id]:e.target.value});selected='';completed=false;content.querySelector('button[type="submit"]').disabled=false;
});
content.addEventListener('submit',e=>{
 e.preventDefault();if(e.target.id!=='cc-question-form')return;
 if(!answers[questions(answers)[step].id])return;
 if(step<9){step++;renderQuestion();}else{completed=true;const r=recommend(answers);selected=r.best||'';emit('funnel_completed',{recommended:r.best});emit('package_recommended',{package:r.best});renderResult();}
});
content.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;
 if(b.dataset.choice){selected=b.dataset.choice;emit('package_selected',{package:selected});renderResult(false);[...content.querySelectorAll('[data-choice]')].find(x=>x.dataset.choice===selected)?.focus({preventScroll:true});return;}
 switch(b.dataset.action){
 case 'back':if(step>0){step--;renderQuestion();}else close();break;
 case 'restart':resetModel();emit('funnel_started',{restart:true});renderQuestion();break;
 case 'edit':step=0;completed=false;renderQuestion();break;
 case 'contact':handoff();break;
 }
});
start.hidden=false;
start.addEventListener('click',()=>{if(form.getAttribute('aria-busy')==='true')return;opened=true;dialog.showModal();emit('funnel_started',{resumed:Object.keys(answers).length>0});completed?renderResult():renderQuestion();});
document.getElementById('closeCoachingCheck').addEventListener('click',()=>close());
dialog.addEventListener('cancel',e=>{e.preventDefault();close('escape');});
picker.addEventListener('change',()=>{if(attached){syncAttached();emit('package_selected',{package:picker.value});}});
context.addEventListener('click',e=>{if(e.target.closest('#removeFunnelContext'))clearAttached();});
form.addEventListener('submit',()=>{if(attached)syncAttached();},true);
form.addEventListener('reset',()=>clearAttached(false));
document.addEventListener('tim:contact-success',e=>{if(e.detail?.funnel)emit('request_submitted',{package:e.detail.package,recommended:e.detail.recommended});});
window.addEventListener('pagehide',()=>{if(opened&&!completed)emit('funnel_abandoned',{step:step+1,reason:'pagehide'});});
if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){emit('funnel_viewed');observer.disconnect();}},{threshold:.25});observer.observe(document.getElementById('coaching-check'));}else emit('funnel_viewed');
