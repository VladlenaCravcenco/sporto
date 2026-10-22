const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const source = ts.transpileModule(fs.readFileSync('src/app/hooks/useCustomerSession.ts','utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
let subscribe, snapshot, callback, resolveUser, clients=0;
const exportsMock={};
new Function('exports','require',source)(exportsMock, name => {
 if(name==='react') return {useSyncExternalStore(s,g){subscribe=s;snapshot=g;return g();}};
 if(name==='../../../lib/supabase/client') return {createClient(){clients++;return {auth:{onAuthStateChange(cb){callback=cb;},getUser(){return new Promise(r=>resolveUser=r);}}};}};
 throw Error(name);
});
(async()=>{
 assert.equal(exportsMock.useCustomerSession().loading,true);
 const unsubscribe=subscribe(()=>{});
 await new Promise(r=>setImmediate(r));
 const user={id:'google-user',email:'test@example.test',user_metadata:{full_name:'Google Name'}};
 callback('SIGNED_IN',{user});
 assert.equal(exportsMock.useCustomerSession().name,'Google Name');
 resolveUser({data:{user:null},error:null});
 await new Promise(r=>setImmediate(r));
 assert.equal(snapshot().user,user,'stale restore cannot overwrite sign-in');
 callback('SIGNED_OUT',null);
 assert.equal(snapshot().user,null);
 assert.equal(snapshot().loading,false);
 unsubscribe();subscribe(()=>{});
 assert.equal(clients,1,'navigation shares one auth subscription');
 assert.equal(exportsMock.customerName({user_metadata:{name:'  Another Name  '}}),'Another Name');
 console.log('PASS: shared sign-in/sign-out, stale restore protection, navigation singleton, Google names.');
})().catch(e=>{console.error(e);process.exitCode=1});
