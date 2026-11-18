import {WEB,deniedByBrowser,eventHash,locallyDenied} from './marketing-contract.mjs';
if(location.origin===WEB&&['/','/trainingsplaene.html'].includes(location.pathname)){
 let granted=false,frame=null,ready=false,queue=[],epoch=0,config=null;
 const channel=typeof BroadcastChannel==='function'?new BroadcastChannel('tim-marketing-choice'):null;
 const css=document.createElement('link');css.rel='stylesheet';css.href='/marketing.css';document.head.append(css);
 const settings=document.createElement('button');settings.type='button';settings.className='marketing-settings';settings.textContent='Werbemessung';settings.setAttribute('aria-expanded','false');document.body.append(settings);
 const panel=document.createElement('section');panel.className='marketing-choice';panel.hidden=true;panel.setAttribute('aria-label','Freiwillige Werbemessung');
 panel.innerHTML='<h2>Werbemessung erlauben?</h2><p>Mit deiner Zustimmung messen wir Seitenaufrufe, bestätigte Anfragen und Käufe für unsere Instagram-Werbung. Meta erhält dabei Verbindungsdaten (z. B. IP-Adresse und Browser), Cookie-Kennungen sowie bei Käufen Betrag und Währung. Keine Formularinhalte oder Trainingsdaten. Deine Auswahl gilt für 180 Tage und lässt sich hier jederzeit widerrufen.</p><div class="marketing-actions"><button type="button" data-choice="allow">Erlauben</button><button type="button" data-choice="deny">Ablehnen / widerrufen</button></div><a href="/datenschutz.html#werbemessung">Datenschutz zur Werbemessung</a><p role="status"></p>';
 document.body.append(panel);const note=panel.querySelector('[role=status]');
 function clearTracking(erase=false){epoch++;granted=false;ready=false;queue=[];try{frame?.contentWindow?.postMessage({type:'tim-meta-stop'},WEB)}catch{}frame?.remove();frame=null;if(!erase)return;try{localStorage.setItem('tim_meta_denied','1');localStorage.removeItem('tim_meta_seen')}catch{}
  for(const name of ['_fbp','_fbc'])for(const domain of ['', '; Domain=timschneider.ch','; Domain=.timschneider.ch'])document.cookie=`${name}=; Path=/; Max-Age=0; Secure; SameSite=Lax${domain}`;
 }
 function flush(){if(granted&&ready&&!deniedByBrowser())for(const event of queue.splice(0))frame?.contentWindow?.postMessage(event,WEB)}
 function enqueue(event){if(!granted||deniedByBrowser())return;queue.push(event);queue=queue.slice(-5);flush()}
 async function enable(){if(deniedByBrowser()||locallyDenied())return;const mine=++epoch;granted=true;
  const click=new URL(location.href).searchParams.get('fbclid');if(click&&/^[A-Za-z0-9_-]{10,512}$/.test(click))document.cookie=`_fbc=fb.1.${Date.now()}.${click}; Path=/; Max-Age=7776000; Secure; SameSite=Lax`;
  frame=document.createElement('iframe');frame.hidden=true;frame.title='Freiwillige Werbemessung';frame.referrerPolicy='no-referrer';frame.src='/marketing/bridge';frame.onload=()=>{if(granted&&mine===epoch)frame?.contentWindow?.postMessage({type:'tim-meta-hello'},WEB)};document.body.append(frame);
  const id=await eventHash('PageView',crypto.randomUUID());if(mine===epoch)enqueue({type:'tim-meta-event',event:'PageView',id});
 }
 addEventListener('message',e=>{if(e.origin===WEB&&e.source===frame?.contentWindow&&e.data?.type==='tim-meta-ready'&&granted){ready=true;flush()}});
 document.addEventListener('tim:marketing-lead',e=>{if(/^[a-f0-9]{64}$/.test(e.detail?.id||''))enqueue({type:'tim-meta-event',event:'Lead',id:e.detail.id})});
 function open(){panel.hidden=false;settings.setAttribute('aria-expanded','true');panel.querySelector('button').focus()}
 settings.addEventListener('click',()=>{if(panel.hidden)open();else{panel.hidden=true;settings.setAttribute('aria-expanded','false')}});
 for(const button of panel.querySelectorAll('[data-choice]'))button.addEventListener('click',async()=>{
  const choice=button.dataset.choice;clearTracking(choice==='deny');for(const b of panel.querySelectorAll('button'))b.disabled=true;
  if(choice==='deny')channel?.postMessage('deny');
  try{const r=await fetch('/api/marketing/consent',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({choice})});if(!r.ok)throw Error();if(choice==='allow')localStorage.removeItem('tim_meta_denied');config={...config,choice};panel.hidden=true;settings.setAttribute('aria-expanded','false');settings.focus();if(choice==='allow')await enable();note.textContent=''}catch{note.textContent=choice==='deny'?'Der Widerruf konnte nicht auf dem Server gespeichert werden. Die Werbemessung ist in diesem Browser gesperrt. Bitte erneut auf „Ablehnen / widerrufen“ klicken.':'Die Auswahl konnte nicht gespeichert werden. Die Werbemessung bleibt hier ausgeschaltet.'}finally{for(const b of panel.querySelectorAll('button'))b.disabled=false}
 });
 channel?.addEventListener('message',e=>{if(e.data==='deny'){clearTracking(true);config={...config,choice:'deny'}}});
 let monitor=setInterval(()=>{if(deniedByBrowser())clearTracking();if(config?.choice==='none'&&config.enabled&&!deniedByBrowser()&&document.querySelector('.analytics-choice')?.hidden!==false){panel.hidden=false;settings.setAttribute('aria-expanded','true');config.choice='prompted'}},1000);
 addEventListener('pagehide',()=>{clearInterval(monitor);clearTracking();channel?.close()},{once:true});
 addEventListener('pageshow',e=>{if(e.persisted)location.reload()});
 void (async()=>{try{const r=await fetch('/api/marketing/config',{cache:'no-store',credentials:'same-origin'});if(!r.ok)throw Error();config=await r.json();if(!config.enabled){settings.remove();return}if(config.allowed===true&&!deniedByBrowser())await enable();if(location.hash==='#werbemessung')open()}catch{clearTracking();settings.remove()}})();
}
