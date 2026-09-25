const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { DatabaseSync } = require('node:sqlite');
const sql = new DatabaseSync(':memory:');
for(const file of fs.readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort())sql.exec(fs.readFileSync(path.join('drizzle',file),'utf8'));
let currentUser=null;
const d1={prepare(query){return {bind(...values){const stmt=sql.prepare(query);return {first:async()=>stmt.get(...values)||null,all:async()=>({results:stmt.all(...values)}),run:async()=>({meta:{changes:stmt.run(...values).changes}})}}}}};
const cache=new Map();
function load(file){
 file=path.resolve(file);if(cache.has(file))return cache.get(file);
 const module={exports:{}};cache.set(file,module.exports);
 const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const req=name=>name==='cloudflare:workers'?{env:{DB:d1}}:name==='@/app/chatgpt-auth'?{getChatGPTUser:async()=>currentUser}:load(name.startsWith('@/')?name.slice(2)+'.ts':path.resolve(path.dirname(file),name+'.ts'));
 vm.runInNewContext(code,{require:req,module,exports:module.exports,Response,Request,URL,console,Date,Object,Error,Number},{filename:file});return module.exports;
}
const account=load('app/api/account/route.ts'),athletes=load('app/api/athletes/route.ts');
const owner={userId:'owner-stable-id',email:'timliam.schneider@gmail.com'},alice={userId:'alice',email:'alice@example.test'},bob={userId:'bob',email:'bob@example.test'};
const request=(method,body,origin='https://portal.example')=>new Request('https://portal.example/api/test',{method,headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(body)});
async function register(user,name){currentUser=user;return account.POST(request('POST',{name,consent:true,role:'coach',package:'Premium',user_id:'owner-stable-id'}));}
(async()=>{
 assert.equal((await account.GET()).status,401);
 assert.equal((await athletes.GET()).status,401);
 assert.equal((await athletes.PATCH(request('PATCH',{}))).status,401);
 assert.equal((await register(alice,'Alice')).status,200);
 let data=await (await account.GET()).json();assert.equal(data.isCoach,false);assert.equal(data.account.package,'none');assert.equal(data.account.user_id,'alice');
 assert.equal((await athletes.GET()).status,403);
 assert.equal((await athletes.PATCH(request('PATCH',{}))).status,403);
 await register(bob,'Bob');data=await(await account.GET()).json();assert.equal(data.account.user_id,'bob');assert.ok(!JSON.stringify(data).includes('alice@example.test'));
 await register(owner,'Tim Schneider');data=await(await account.GET()).json();assert.equal(data.isCoach,true);
 const list=await(await athletes.GET()).json();assert.equal(list.athletes.length,2);assert.ok(list.athletes.every(a=>a.user_id!=='owner-stable-id'));
 const assignment={user_id:'alice',package:'Basic Plus',status:'active',revision:0,start_date:'2026-10-01',end_date:null};
 assert.equal((await athletes.PATCH(request('PATCH',assignment,'https://other.example'))).status,403);
 assert.equal((await athletes.PATCH(request('PATCH',{...assignment,package:'Invalid'}))).status,400);
 assert.equal((await athletes.PATCH(request('PATCH',{...assignment,start_date:'2026-02-30'}))).status,400);
 assert.equal((await athletes.PATCH(request('PATCH',{...assignment,end_date:'2026-09-01'}))).status,400);
 assert.equal((await athletes.PATCH(request('PATCH',assignment))).status,200);
 assert.equal((await athletes.PATCH(request('PATCH',assignment))).status,409);
 currentUser=alice;data=await(await account.GET()).json();assert.equal(data.account.package,'Basic Plus');assert.equal(data.account.revision,1);assert.equal(data.isCoach,false);
 sql.prepare('INSERT INTO invoices (id,user_id,number,amount_cents,currency,status,issued_date) VALUES (?,?,?,?,?,?,?)').run('invoice-a','alice','TEST-A',10000,'CHF','open','2026-09-26');
 sql.prepare('INSERT INTO invoices (id,user_id,number,amount_cents,currency,status,issued_date) VALUES (?,?,?,?,?,?,?)').run('invoice-b','bob','TEST-B',20000,'CHF','paid','2026-09-26');
 currentUser=alice;data=await(await account.GET()).json();assert.equal(data.invoices.length,1);assert.equal(data.invoices[0].number,'TEST-A');assert.ok(!JSON.stringify(data).includes('TEST-B'));
 currentUser=bob;data=await(await account.GET()).json();assert.equal(data.invoices.length,1);assert.equal(data.invoices[0].number,'TEST-B');assert.ok(!JSON.stringify(data).includes('TEST-A'));
 currentUser=null;assert.equal((await account.GET()).status,401);
 // A different stable identity cannot take over the already claimed coach role.
 await register({userId:'different-id',email:owner.email},'Other identity');assert.equal((await athletes.GET()).status,403);
 currentUser=owner;assert.equal((await athletes.GET()).status,200);
 console.log('PASS: anonymous access, role escalation, cross-account isolation, owner binding, CSRF, validation, updates, private invoices and stale-write protection.');
 sql.close();
})().catch(error=>{console.error(error);process.exit(1)});
