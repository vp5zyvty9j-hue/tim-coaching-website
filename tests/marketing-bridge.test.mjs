import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {WEB,APP,PIXEL,eventPayload,pruneSeen} from '../public/marketing-contract.mjs';
const source=(await readFile(new URL('../public/marketing-bridge.mjs',import.meta.url),'utf8')).replace(/^import[^\n]+\n/,'');
const settle=()=>new Promise(resolve=>setImmediate(resolve));
async function fixture(){
 const handlers=new Map(),store=new Map(),events=[],posted=[];let permission=true,networkError=false,scripts=0,browserDeny=false,finishLoad=null,broadcast=null;
 const parent={postMessage:x=>posted.push(x)},win={};
 const context={WEB,APP,PIXEL,eventPayload,pruneSeen,window:win,parent,location:{origin:WEB,pathname:'/marketing/bridge',search:'',hash:''},deniedByBrowser:()=>browserDeny,locallyDenied:()=>store.get('tim_meta_denied')==='1',setInterval:()=>1,clearInterval:()=>{},addEventListener:(k,f)=>handlers.set(k,f),removeEventListener:(k)=>handlers.delete(k),localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},fetch:async()=>{if(networkError)throw Error();return {ok:true,json:async()=>({allowed:permission})}},BroadcastChannel:class{addEventListener(k,f){broadcast=f}close(){}},document:{createElement:()=>({remove(){}}),head:{append(script){scripts++;finishLoad=()=>{win.fbq.callMethod=(...args)=>events.push(args);script.onload()}}}}};
 vm.runInNewContext(source,context);
 async function message(data,origin=WEB,sender=parent){handlers.get('message')?.({source:sender,origin,data});for(let i=0;i<5;i++)await settle()}
 return {message,events,posted,store,get scripts(){return scripts},setPermission:x=>permission=x,setNetwork:x=>networkError=x,setBrowser:x=>browserDeny=x,finish:async()=>{finishLoad?.();for(let i=0;i<8;i++)await settle()},deny:()=>broadcast?.({data:'deny'})};
}
test('no Pixel script before consent; reject foreign source and origin',async()=>{
 const f=await fixture();f.setPermission(false);await f.message({type:'tim-meta-hello'});await f.message({type:'tim-meta-event',event:'Lead',id:'a'.repeat(64)});assert.equal(f.scripts,0);assert.equal(f.posted.length,0);
 const g=await fixture();await g.message({type:'tim-meta-hello'},'https://evil.test');await g.message({type:'tim-meta-hello'},WEB,{});assert.equal(g.posted.length,0);
});
test('verified handshake sends only allowlisted payload once, no extra fields',async()=>{
 const f=await fixture();await f.message({type:'tim-meta-hello'});assert.equal(f.posted[0].type,'tim-meta-ready');
 const e={type:'tim-meta-event',event:'Lead',id:'b'.repeat(64)};await f.message({...e,email:'private'});assert.equal(f.scripts,0);
 await f.message(e);assert.equal(f.scripts,1);await f.finish();await f.message(e);
 assert.equal(f.events.filter(x=>x[0]==='trackSingle').length,1);assert.deepEqual(JSON.parse(JSON.stringify(f.events[0])),['trackSingle',PIXEL,'Lead',{}, {eventID:e.id}]);
});
test('deny during script loading prevents conversion and revokes consent',async()=>{
 const f=await fixture();await f.message({type:'tim-meta-hello'},APP);await f.message({type:'tim-meta-event',event:'Purchase',id:'c'.repeat(64),value:29,currency:'CHF'},APP);f.setPermission(false);f.deny();await f.finish();assert.equal(f.events.filter(x=>x[0]==='trackSingle').length,0);
});
test('network failure fails closed but later event may retry; local deny wins',async()=>{
 const f=await fixture();await f.message({type:'tim-meta-hello'});f.setNetwork(true);const e={type:'tim-meta-event',event:'Lead',id:'d'.repeat(64)};await f.message(e);assert.equal(f.scripts,0);f.setNetwork(false);await f.message(e);await f.finish();assert.equal(f.events.filter(x=>x[0]==='trackSingle').length,1);
 const g=await fixture();g.store.set('tim_meta_denied','1');await g.message({type:'tim-meta-hello'});await g.message(e);assert.equal(g.scripts,0);
});
