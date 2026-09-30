const menuToggle = document.querySelector('.menu-toggle');
const mobileMenu = document.querySelector('.mobile-menu');
function closeMenu(){mobileMenu.classList.remove('open');menuToggle.setAttribute('aria-expanded','false');mobileMenu.setAttribute('aria-hidden','true');}
menuToggle.addEventListener('click',()=>{const open=mobileMenu.classList.toggle('open');menuToggle.setAttribute('aria-expanded',String(open));mobileMenu.setAttribute('aria-hidden',String(!open));menuToggle.setAttribute('aria-label',open?'Menü schliessen':'Menü öffnen');});
mobileMenu.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&mobileMenu.classList.contains('open')){closeMenu();menuToggle.focus();}});
window.matchMedia('(min-width:1101px)').addEventListener('change',e=>{if(e.matches)closeMenu();});
const bar=document.getElementById('progressBar');
function progress(){const h=document.documentElement;bar.style.width=`${h.scrollHeight>h.clientHeight?100*h.scrollTop/(h.scrollHeight-h.clientHeight):0}%`;}
window.addEventListener('scroll',progress,{passive:true});progress();
const questions={Ausdauer:[['Ausdauersportart','Welche Ausdauersportart betreibst du oder möchtest du beginnen?'],['Trainingsumfang','Wie oft und wie lange trainierst du aktuell pro Woche?'],['Ausdauerziel','Welche Leistung, Distanz oder welchen Wettkampf hast du im Blick?'],['Trainingsplanung','An welchen Tagen kannst du trainieren? Welche Ausstattung nutzt du?']],Kraft:[['Krafterfahrung','Welche Übungen und Trainingspläne kennst du bereits?'],['Ausstattung','Trainierst du im Gym oder zu Hause? Welche Geräte hast du?'],['Kraftziel','Was möchtest du mit Krafttraining erreichen – zum Beispiel mehr Fitness, Kraft, Muskelaufbau oder sportliche Leistung?']],Ernährung:[['Essgewohnheiten','Wie sieht ein typischer Ernährungstag bei dir aus?'],['Vorlieben','Welche Lebensmittel magst du, welche lässt du weg?'],['Ernährungsalltag','Wie viel Zeit hast du zum Einkaufen und Kochen?']]};
const mapping={'Basic':['Ausdauer'],'Basic Plus':['Ausdauer','Kraft'],'Premium':['Ausdauer','Kraft','Ernährung'],'Ernährung':['Ernährung'],'Kraftplan':['Kraft']};
const picker=document.getElementById('package');const area=document.getElementById('packageQuestions');const answers={};
function renderQuestions(){area.querySelectorAll('textarea').forEach(t=>answers[t.name]=t.value);area.replaceChildren();for(const group of mapping[picker.value]||[]){const fieldset=document.createElement('fieldset');const legend=document.createElement('legend');legend.textContent=group;fieldset.append(legend);for(const [name,question] of questions[group]){const label=document.createElement('label');label.textContent=question;const input=document.createElement('textarea');input.name=name;input.rows=2;input.maxLength=2000;input.value=answers[name]||'';label.append(input);fieldset.append(label);}area.append(fieldset);}document.getElementById('formSuccess').classList.remove('show');}
picker.addEventListener('change',renderQuestions);
document.querySelectorAll('[data-package]').forEach(a=>a.addEventListener('click',()=>{if(document.getElementById('contactForm').getAttribute('aria-busy')==='true')return;picker.value=a.dataset.package;picker.dispatchEvent(new Event('change',{bubbles:true}));}));

// Forget temporarily retained package answers after a completed request/reset.
document.getElementById('contactForm').addEventListener('reset',()=>{for(const key of Object.keys(answers))delete answers[key];area.replaceChildren();});

// Remove only unchanged auto-filled values from the temporary package cache.
document.addEventListener('tim:clear-funnel-autofill',e=>{for(const [name,value] of Object.entries(e.detail?.values||{}))if(answers[name]===value)delete answers[name];});
