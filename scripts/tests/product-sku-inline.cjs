const fs=require('fs'),ts=require('typescript'),assert=require('node:assert/strict');
function compile(file){return ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;}
const helper={};new Function('exports',compile('src/lib/product-sku.ts'))(helper);
(async()=>{
 let pattern;
 const db={from(table){if(table==='product_redirects')return{select(){return this},in:async()=>({data:[],error:null})};return{select(){return this},ilike(k,p){pattern=p;return this},order(){return this},range:async()=>({data:[{id:'match',sku:'  A_%\\B '},{id:'other',sku:'prefix A_%\\B suffix'}],error:null})}}};
 const matches=await helper.findProductSkuMatches(db,'a_%\\b');assert.deepEqual(matches.map(r=>r.id),['match']);assert.equal(pattern,'%a\\_\\%\\\\b%');
 let state,dependency,cleanup;let timers=new Map(),timerId=0;const requests=[];
 const react={useState(initial){if(state===undefined)state=initial;return[state,next=>{state=next}]},useEffect(effect,deps){const next=JSON.stringify(deps);if(next!==dependency){cleanup?.();dependency=next;cleanup=effect()}}};
 const out={};new Function('exports','require','setTimeout','clearTimeout',compile('src/app/hooks/useProductSkuStatus.ts'))(out,name=>name==='react'?react:name.endsWith('/supabase')?{supabase:{}}:{normalizeSku:helper.normalizeSku,findProductSkuMatches:(_,sku)=>new Promise((resolve,reject)=>requests.push({sku,resolve,reject}))},fn=>{timers.set(++timerId,fn);return timerId},id=>timers.delete(id));
 const render=(sku,id=null,enabled=true)=>out.useProductSkuStatus(sku,id,enabled);
 const run=async()=>{const callbacks=[...timers.values()];timers.clear();for(const callback of callbacks)void callback();await Promise.resolve()};
 const settle=async()=>{await Promise.resolve();await Promise.resolve()};
 assert.equal(render('first').status,'checking');render('second');assert.equal(timers.size,1);await run();assert.equal(requests.length,1);assert.equal(requests[0].sku,'second');
 render('third');await run();requests[1].resolve([]);await settle();assert.equal(render('third').status,'available');requests[0].resolve([{id:'late',sku:'second'}]);await settle();assert.equal(render('third').status,'available');
 render('taken');await run();requests[2].resolve([{id:'hidden',sku:'taken',active:false}]);await settle();assert.equal(render('taken').status,'conflict');assert.equal(render('taken').matches[0].active,false);
 render('legacy','self');await run();requests[3].resolve([{id:'self',sku:'legacy'},{id:'other',sku:'legacy'}]);await settle();assert.equal(render('legacy','self').status,'legacy');assert.deepEqual(render('legacy','self').matches.map(x=>x.id),['other']);
 render('own','self');await run();requests[4].resolve([{id:'self',sku:'own'}]);await settle();assert.equal(render('own','self').status,'available');
 render('network');await run();requests[5].reject(Error('offline'));await settle();assert.equal(render('network').status,'error');assert.equal(render('',null).status,'idle');render('closed',null,false);assert.equal(timers.size,0);
 console.log('PASS: live SKU debounce, obsolete-response cancellation, exact escaped lookup, hidden matches, current-card exclusion, legacy duplicate warning, network errors and empty/closed states.');
})().catch(e=>{console.error(e);process.exitCode=1});
