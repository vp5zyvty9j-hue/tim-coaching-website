export const packages = {none:'Noch kein Paket',Basic:'Basic','Basic Plus':'Basic Plus',Premium:'Premium','Ernährung':'Ernährung',Kraftplan:'Kraftplan'};
export const statuses = {pending:'Freischaltung ausstehend',active:'Aktiv',paused:'Pausiert',ended:'Beendet'};
export const benefits:Record<string,string[]> = {
 Basic:['Individueller Laufplan','Wettkampfvorbereitung passend zu deinem Ziel'],
 'Basic Plus':['Individueller Laufplan','Abgestimmtes Krafttraining'],
 Premium:['Individueller Laufplan','Krafttraining','Individuelle Ernährungsunterstützung'],
 Ernährung:['Deine Essgewohnheiten und Ziele','Praktische Ernährungsstruktur für deinen Alltag'],
 Kraftplan:['Individueller Krafttrainingsplan','Übungsauswahl und sinnvolle Steigerung'],
};
export type Account={user_id:string;email:string;name:string;package:string;status:string;start_date:string|null;end_date:string|null;revision:number;created_at:string;updated_at:string};
export function validateAssignment(value:unknown){
 const v=value as Record<string,unknown>;
 if(!v||typeof v!=='object'||typeof v.user_id!=='string'||v.user_id.length>256||!Object.hasOwn(packages,String(v.package))||!Object.hasOwn(statuses,String(v.status))||!Number.isSafeInteger(v.revision)||Number(v.revision)<0) throw Error('Bitte wähle ein gültiges Paket und einen gültigen Status.');
 for(const key of ['start_date','end_date']){
  const date=v[key];
  if(date!==null&&(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date))throw Error('Bitte prüfe das Datum.');
 }
 if(v.start_date&&v.end_date&&v.end_date<v.start_date)throw Error('Das Enddatum darf nicht vor dem Startdatum liegen.');
 if(v.status==='active'&&v.package==='none')throw Error('Für ein aktives Abo ist ein Paket erforderlich.');
 return v as {user_id:string;package:string;status:string;revision:number;start_date:string|null;end_date:string|null};
}
export function statusLabel(a:Account){
 const today=new Date().toISOString().slice(0,10);
 if(a.status==='active'&&a.end_date&&a.end_date<today)return 'Abgelaufen';
 if(a.status==='active'&&a.start_date&&a.start_date>today)return 'Start geplant';
 return statuses[a.status as keyof typeof statuses]||a.status;
}

export type Invoice={id:string;number:string;amount_cents:number;currency:string;status:string;issued_date:string;due_date:string|null};
