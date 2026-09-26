import { packages } from './coaching-packages.js';
export { packages };
const option=(value,label)=>({value,label});
const question=(id,kicker,title,help,choices)=>({id,kicker,title,help,options:choices.map(([v,l])=>option(v,l))});
const goal=question('goal','DEIN ZIEL','Was möchtest du hauptsächlich erreichen?','Dein wichtigstes Ziel gibt die Richtung vor.',[
 ['speed','Schneller laufen'],['endurance','Ausdauer verbessern'],['race','Für einen Wettkampf trainieren'],['hybrid','Kraft und Ausdauer kombinieren'],['strength','Muskeln und Kraft aufbauen'],['body','Körperfett reduzieren / Körper verändern'],['fitness','Allgemein fitter und leistungsfähiger werden'],['food','Meine Ernährung im Alltag verbessern']]);
const training=question('training','DEIN SCHWERPUNKT','Welche Trainingsform interessiert dich am meisten?','Wähle, welche Bereiche du im Coaching betreuen lassen möchtest.',[
 ['run','Laufen'],['strength','Krafttraining'],['both','Laufen + Kraft'],['hybrid','Hybrid Training'],['unsure','Noch unsicher'],['food','Nur Ernährung – ohne Trainingsplan']]);
const level=question('level','DEIN AUSGANGSPUNKT','Wie schätzt du deinen aktuellen Trainingsstand ein?','Vom Einstieg bis zum ambitionierten Wettkampfsport: Die Planung richtet sich nach dir.',[
 ['beginner','Anfänger'],['active','Regelmässig aktiv'],['advanced','Fortgeschritten'],['athlete','Ambitionierter Athlet'],['competitive','Wettkampforientiert / Leistungssport']]);
export function baseMode(a){
 if(a.training && a.training!=='unsure')return ['both','hybrid'].includes(a.training)?'both':a.training;
 return {speed:'run',endurance:'run',race:'run',hybrid:'both',strength:'strength',food:'food'}[a.goal]||'unsure';
}
export function mode(a){return baseMode(a)==='unsure'?(a.focus||'unsure'):baseMode(a);}
export function questions(a={}){
 const m=mode(a), b=baseMode(a);
 const fourth=b==='unsure'?question('focus','DEINE RICHTUNG','Welcher Schwerpunkt spricht dich für den Start am ehesten an?','Du musst noch keinen fertigen Plan haben. Diese Antwort hilft, die Pakete einzuordnen.',[['run','Meine Ausdauer durch Laufen entwickeln'],['strength','Kraft und Muskulatur aufbauen'],['both','Laufen und Krafttraining verbinden'],['food','Zuerst meine Ernährung strukturieren'],['unsure','Das möchte ich im Erstgespräch klären']]):
 ['run','both'].includes(m)?question('race','DEIN LAUFZIEL','Hast du ein konkretes Lauf- oder Wettkampfziel?','Die Distanz hilft bei der Planung – sie bestimmt nicht den Preis deines Pakets.',[['general','Allgemeine Laufleistung verbessern'],['5k','5 km'],['10k','10 km'],['half','Halbmarathon'],['marathon','Marathon'],['ultra','Ultra'],['other','Anderer Wettkampf']]):
 m==='strength'?question('equipment','DEIN TRAININGSORT','Welche Ausstattung steht dir fürs Krafttraining zur Verfügung?','Damit dein späterer Plan zu deinen Möglichkeiten passt.',[['gym','Fitnessstudio'],['home','Zu Hause mit Gewichten'],['bodyweight','Eigengewicht / wenig Ausstattung'],['mixed','Unterschiedlich – flexibel bleiben']]):
 question('routine','DEIN ALLTAG','Wie sieht dein Essalltag meistens aus?','Es geht um alltagstaugliche Gewohnheiten, nicht um Körperwerte.',[['regular','Meist regelmässige Mahlzeiten'],['busy','Wechselnde Zeiten / viel unterwegs'],['sport','Ich plane rund um mein Training'],['unsure','Mir fehlt bisher eine feste Struktur']]);
 const fifth=['both','strength'].includes(m)?question('strengthGoal','DEIN KRAFTZIEL','Was ist dein wichtigstes Ziel im Krafttraining?','Wir berücksichtigen, wie Krafttraining dein Hauptziel unterstützen soll.',[['muscle','Muskelaufbau'],['power','Mehr Kraft'],['athletic','Athletischer werden'],['running','Kraft für meinen Ausdauersport'],['general','Allgemeine Fitness']]):
 m==='run'?question('runFocus','DEIN LAUFTRAINING','Was möchtest du in deinem Lauftraining besonders verbessern?','So wird aus deinem Ziel ein konkreter Ansatz für die Planung.',[['routine','Regelmässig laufen und dranbleiben'],['pace','Tempo gezielt entwickeln'],['distance','Längere Distanzen bewältigen'],['load','Belastung und Erholung besser abstimmen']]):
 m==='food'?question('foodFocus','DEINE ERNÄHRUNG','Wo wünschst du dir im Alltag mehr Orientierung?','Wähle den Bereich, der dir gerade am meisten helfen würde.',[['habits','Verlässliche Essgewohnheiten'],['planning','Mahlzeiten einfacher planen'],['sport','Ernährung und Training abstimmen'],['implementation','Gute Vorsätze praktisch umsetzen']]):
 question('obstacle','DEIN NÄCHSTER SCHRITT','Was fehlt dir momentan am meisten?','Auch ohne festen Trainingsschwerpunkt können wir dein Anliegen klar festhalten.',[['direction','Eine klare Richtung'],['routine','Eine umsetzbare Routine'],['progress','Ein Plan für weitere Fortschritte'],['feedback','Persönliches Feedback']]);
 return [goal,training,level,fourth,fifth,
 question('time','DEINE ZEIT','Wie viel Zeit kannst du realistisch pro Woche für Training einplanen?','Eine ehrliche Einschätzung hilft mehr als ein perfekter Vorsatz. Bei reinem Ernährungscoaching dient sie nur als Kontext.',[['1-3','1–3 Stunden'],['4-6','4–6 Stunden'],['7-10','7–10 Stunden'],['10+','Mehr als 10 Stunden']]),
 question('structure','DEINE PLANUNG','Trainierst du aktuell nach einem strukturierten Plan?','Es geht um deinen aktuellen Stand, nicht um richtig oder falsch.',[['no','Nein'],['partial','Teilweise'],['stuck','Ja, aber ich komme nicht wie gewünscht voran'],['optimize','Ja, ich möchte meine Planung weiter optimieren']]),
 question('nutrition','DEINE ERNÄHRUNG','Möchtest du auch Unterstützung bei deiner Ernährung?','Ein „Vielleicht“ führt noch nicht zu einer Premium-Empfehlung.',[['no','Nein'],['maybe','Vielleicht'],['yes','Ja'],['main','Ernährung ist aktuell eines meiner Hauptthemen']]),
 question('support','DEINE BETREUUNG','Wie viel persönliche Betreuung möchtest du?','Alle Pakete enthalten persönlichen Austausch. Dein Wunsch hilft, den passenden Umfang im Erstgespräch abzugleichen.',[['plan','Hauptsächlich einen klaren individuellen Plan'],['adjust','Regelmässige Anpassungen'],['feedback','Persönliches Feedback und Austausch'],['full','Möglichst umfassende Betreuung']]),
 question('priority','DEINE PRIORITÄT','Was ist dir bei deinem Coaching am wichtigsten?','Dein Fokus fliesst in die Begründung und das Erstgespräch ein.',[['structure','Klare Struktur'],['flexibility','Flexibilität im Alltag'],['performance','Maximale Leistungsentwicklung'],['personal','Persönliche Betreuung'],['combined','Training und Ernährung aus einer Hand']])];
}
export function normalize(a){
 const clean={...a};
 for(let pass=0;pass<3;pass++){
 const qs=questions(clean);const valid=new Map(qs.map(q=>[q.id,q.options.map(o=>o.value)]));
 for(const key of Object.keys(clean))if(!valid.get(key)?.includes(clean[key]))delete clean[key];
 }
 return clean;
}
export function label(a,id){const q=questions(a).find(q=>q.id===id);return q?.options.find(o=>o.value===a[id])?.label||'';}
export function answerSummary(a){return questions(a).map(q=>({id:q.id,question:q.title,answer:label(a,q.id)}));}
export function recommend(a){
 const m=mode(a), nutrition=['yes','main'].includes(a.nutrition);let rows=[];
 const add=(name,reason,tradeoff='')=>rows.push({...packages.find(p=>p.name===name),reason,tradeoff});
 if(m==='both'){
 if(nutrition)add('Premium','Du möchtest Laufen und Krafttraining verbinden und wünschst dir ausdrücklich Ernährungsunterstützung. Premium vereint diese drei Bereiche in einem Paket.');
 add('Basic Plus','Du möchtest Kraft und Ausdauer gemeinsam entwickeln. Basic Plus verbindet einen individuellen Laufplan mit einem abgestimmten Kraftplan.',nutrition?'Alternative, wenn du zunächst auf Ernährungsunterstützung verzichtest.':'');
 add('Basic','Basic konzentriert sich auf deinen individuellen Laufplan und deine Laufziele.','Nur wenn du deinen Coaching-Schwerpunkt auf Laufen begrenzen möchtest; kein individueller Kraftplan enthalten.');
 }else if(m==='run'){
 add('Basic','Du möchtest dein Lauftraining gezielt entwickeln. Basic bietet dir einen individuellen Laufplan und zielgerichtete Wettkampfvorbereitung.');
 if(nutrition)add('Ernährung','Du wünschst dir zusätzlich Unterstützung bei deinen Essgewohnheiten.','Eigenständiges Paket ohne Laufplan. Eine Kombination und deren Gesamtumfang besprechen wir im Erstgespräch.');
 }else if(m==='strength'){
 add('Kraftplan','Dein gewählter Schwerpunkt ist Krafttraining. Der Kraftplan bietet individuelle Übungsauswahl und sinnvolle Steigerung, abgestimmt auf deine Erfahrung und Ausstattung.');
 if(nutrition)add('Ernährung','Auch deine Ernährung soll Unterstützung bekommen.','Eigenständiges Paket ohne Kraftplan. Eine Kombination und deren Gesamtumfang besprechen wir im Erstgespräch.');
 }else if(m==='food'&&a.nutrition!=='no'){
 add('Ernährung','Du möchtest deine Ernährung betreuen lassen und brauchst aktuell keinen Trainingsplan. Dieses Paket unterstützt alltagstaugliche Essgewohnheiten und deren Umsetzung.');
 }
 // Fit comes before price. Premium is always available as an explicitly broader option.
 const nutritionFirst=a.nutrition==='main' && (m==='food'||['body','food'].includes(a.goal));
 const best=(nutritionFirst?rows.find(p=>p.name==='Ernährung'):rows[0])?.name||null;
 const premium=rows.find(p=>p.name==='Premium');
 if(!premium){
  const extra=m==='run'?'zusätzlich Krafttraining und Ernährungsunterstützung':m==='strength'?'zusätzlich Lauftraining und Ernährungsunterstützung':m==='food'?'zusätzlich Lauf- und Krafttraining':m==='both'?'zusätzlich Ernährungsunterstützung':'Laufen, Krafttraining und Ernährungsunterstützung zusammen';
  add('Premium','Premium verbindet individuelle Lauf- und Kraftplanung mit Ernährungsunterstützung.',`Wenn du ${extra} möchtest, kannst du Premium als Erweiterung wählen. Diese zusätzlichen Bereiche gehen über deine aktuelle Auswahl hinaus. Der persönliche Austausch folgt den gleichen vereinbarten Rahmenbedingungen wie bei den anderen Paketen.`);
 }
 const ordered=[];
 if(best)ordered.push(rows.find(p=>p.name===best));
 if(best!=='Premium')ordered.push(rows.find(p=>p.name==='Premium'));
 for(const row of rows)if(!ordered.some(p=>p.name===row.name))ordered.push(row);
 rows=ordered;
 const bestRow=rows.find(p=>p.name===best);
 if(bestRow){
  bestRow.reason+=` Dein Trainingsstand: ${label(a,'level')||'noch offen'}. Besonders wichtig ist dir: ${label(a,'priority')||'eine passende Planung'}.`;
 }
 const notes=[];
 if(a.nutrition==='maybe'&&m!=='food')notes.push('Dein Interesse an Ernährungsunterstützung ist noch offen. Premium wird deshalb nur als zusätzliche Erweiterung angezeigt. Ob du diese möchtest, klären wir im Erstgespräch.');
 if(a.priority==='combined'&&a.nutrition==='no')notes.push('Du hast „keine Ernährungsunterstützung“ und zugleich „Training und Ernährung aus einer Hand“ gewählt. Für die Empfehlung gilt dein ausdrückliches Nein. Du kannst deine Antworten noch anpassen.');
 if(['athlete','competitive'].includes(a.level)||a.race==='ultra')notes.push('Dein sportlicher Anspruch wird im Erstgespräch konkret besprochen. Die Empfehlung bestätigt weder eine spezielle Wettkampfqualifikation noch eine garantierte Eignung für jedes Leistungsziel.');
 if(a.support==='full')notes.push('Auch bei umfassendem Betreuungswunsch gelten die vorhandenen Paketleistungen: wöchentlicher Check-in und gebündelte Fragerunde; keine Rund-um-die-Uhr-Betreuung.');
 if(m==='food'&&a.nutrition==='no')notes.push('Du hast ausschliesslich Ernährung gewählt, möchtest aber keine Ernährungsunterstützung. Bitte kläre diese beiden Antworten, bevor wir dir ein Paket empfehlen.');
 if(m==='unsure')notes.push('Dein Trainingsschwerpunkt ist noch offen. Wir kennzeichnen deshalb kein Paket als beste Übereinstimmung. Ein Erstgespräch hilft, die passende Richtung zu finden.');
 if(['run','strength'].includes(m)&&nutrition)notes.push('Für deinen gewählten Trainingsschwerpunkt plus Ernährung gibt es kein einzelnes passgenaues Kombipaket. Premium würde einen zusätzlichen, von dir nicht gewählten Trainingsbereich enthalten.');
 return {rows:rows.slice(0,3),notes,mode:m,best};
}
export function payload(a,selected){const result=recommend(a);return {version:'coaching-check-1',recommended:result.best||'Im Erstgespräch klären',selected:selected||'Im Erstgespräch klären',alternatives:result.rows.filter(p=>p.name!==result.best).map(p=>p.name),answers:answerSummary(a)};}
