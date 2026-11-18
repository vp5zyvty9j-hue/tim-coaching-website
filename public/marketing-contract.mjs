export const WEB='https://timschneider.ch',APP='https://app.timschneider.ch',PIXEL='2041306673225747';
export const deniedByBrowser=()=>navigator.globalPrivacyControl===true||navigator.doNotTrack==='1'||window.doNotTrack==='1';
export function locallyDenied(){try{return localStorage.getItem('tim_meta_denied')==='1'}catch{return true}}
export async function eventHash(kind,id){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode('tim-meta-v1:'+kind+':'+id)))].map(x=>x.toString(16).padStart(2,'0')).join('')}
export function eventPayload(value,origin){
 if(!value||typeof value!=='object'||Array.isArray(value)||![WEB,APP].includes(origin))return null;
 if(Object.keys(value).some(k=>!['type','event','id','value','currency'].includes(k))||value.type!=='tim-meta-event'||!/^[a-f0-9]{64}$/.test(value.id||''))return null;
 if(origin===WEB&&['PageView','Lead'].includes(value.event)&&Object.keys(value).length===3)return {type:value.type,event:value.event,id:value.id};
 if(origin===APP&&value.event==='Purchase'&&Object.keys(value).length===5&&value.currency==='CHF'&&Number.isFinite(value.value)&&value.value>0&&value.value<=10000&&Math.abs(value.value*100-Math.round(value.value*100))<1e-7)return {type:value.type,event:value.event,id:value.id,value:value.value,currency:'CHF'};
 return null;
}
export function pruneSeen(raw,now=Date.now()){
 if(!Array.isArray(raw))return [];
 return raw.filter(x=>Array.isArray(x)&&x.length===2&&/^[a-f0-9]{64}$/.test(x[0])&&Number.isFinite(x[1])&&x[1]<=now&&x[1]>now-90*86400000).slice(-200);
}
