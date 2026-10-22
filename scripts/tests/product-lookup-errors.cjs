const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict');
const code=ts.transpileModule(fs.readFileSync('app/_lib/product-data.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
function lookup(results,configured=true){
 const out={},calls=[];
 const db={from(table){const query={table,filters:[]};return{select(){return this},eq(key,value){query.filters.push([key,value]);return this},async maybeSingle(){calls.push(query);return results.shift()||{data:null,error:null}}}}};
 new Function('exports','require',code)(out,name=>({'react':{cache:fn=>fn},'@supabase/supabase-js':{createClient:()=>db},'./product-category-links':{missingMergeRelation:e=>e?.code==='PGRST205'||e?.code==='42P01'},'./supabase-env':{getSupabasePublicConfig:()=>configured?{url:'fixture',key:'fixture'}:null}}[name]));
 return {get:out.getProductDetail,calls};
}
(async()=>{
 const uuid='01f95bee-5fd4-4da5-afb9-cfff629ce1d2';
 let fixture=lookup([{data:null,error:{code:'network'}}]);await assert.rejects(fixture.get(uuid,uuid),/unavailable/);
 fixture=lookup([{data:null,error:{code:'network'}}]);await assert.rejects(fixture.get('9918','9918'),/unavailable/);assert.deepEqual(fixture.calls[0].filters,[['id','9918'],['active',true]]);
 fixture=lookup([]);assert.equal(await fixture.get(uuid,uuid),null);assert.equal(fixture.calls.length,3);assert.deepEqual(fixture.calls[0].filters,[['id',uuid],['active',true]]);
 fixture=lookup([]);assert.equal(await fixture.get('9918','9918'),null);assert.equal(fixture.calls.length,3);
 // A canonical numeric ID wins without querying an ambiguous SKU.
 fixture=lookup([{data:{id:'561',sku:'561',brand:null},error:null}]);
 assert.equal((await fixture.get('561','561')).product.id,'561');
 assert.equal(fixture.calls.length,1);assert.deepEqual(fixture.calls[0].filters,[['id','561'],['active',true]]);
 // Old SKU aliases still resolve when no product uses that identifier as its ID.
 fixture=lookup([{data:null,error:null},{data:{id:uuid,sku:'9918',brand:null},error:null}]);
 assert.equal((await fixture.get('9918','9918')).product.id,uuid);
 assert.deepEqual(fixture.calls[1].filters,[['sku','9918'],['active',true]]);
 // An archived UUID resolves to its active target; missing migration is compatible.
 fixture=lookup([{data:null,error:null},{data:null,error:null},{data:{target_id:'target'},error:null},{data:{id:'target',sku:'1',brand:null},error:null}]);
 assert.equal((await fixture.get(uuid,uuid)).product.id,'target');
 assert.equal(fixture.calls[2].table,'product_redirects');
 fixture=lookup([{data:null,error:null},{data:null,error:null},{data:null,error:{code:'PGRST205'}}]);
 assert.equal(await fixture.get(uuid,uuid),null);
 fixture=lookup([{data:null,error:null},{data:null,error:null},{data:null,error:{code:'42501'}}]);
 await assert.rejects(fixture.get(uuid,uuid),/redirect unavailable/);
 await assert.rejects(lookup([],false).get(uuid),/configuration missing/);
 console.log('PASS: database failures throw rather than false 404; missing active products remain null; numeric and UUID canonical IDs resolve before SKU aliases, including duplicated SKUs.');
})().catch(error=>{console.error(error);process.exitCode=1});
