const fs=require('fs'),ts=require('typescript'),assert=require('node:assert/strict');const out={};new Function('exports',ts.transpileModule(fs.readFileSync('src/lib/product-sku.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText)(out);const existing=[{id:'a',sku:'  AbC '},{id:'b',sku:'abc'},{id:'hidden',sku:'999'}];
assert.throws(()=>out.validateProductSkus(existing,[{id:'new',sku:'ABC'}]),/DUPLICATE_SKU/);
assert.throws(()=>out.validateProductSkus(existing,[{id:'new',sku:'999'}]),/DUPLICATE_SKU/);
out.validateProductSkus(existing,[{id:'a',sku:'ABC'},{id:'b',sku:'abc'}]);
out.validateProductSkus(existing,[{id:'a',sku:'FREE'},{id:'new',sku:null},{id:'empty',sku:''}]);
assert.throws(()=>out.validateProductSkus([],[{id:'a',sku:'1'},{id:'b',sku:' 1 '}]),/DUPLICATE_SKU/);
assert.throws(()=>out.validateProductSkus([],[{id:'a',sku:'1'},{id:'a',sku:'2'}]),/DUPLICATE_ID/);
assert.match(out.productSkuError({message:'SPORTO_DUPLICATE_SKU'},'ru'),/артикул уже занят/);
(async()=>{let calls=0;const db={from(){return{select(){return this},order(){return this},async range(){calls++;return calls===1?{data:Array.from({length:1000},(_,i)=>({id:String(i),sku:'x'+i})),error:null}:{data:[{id:'last',sku:'TAIL'}],error:null}}}}};await assert.rejects(out.checkProductSkus(db,[{sku:'tail'}]),/DUPLICATE_SKU/);assert.equal(calls,2);await assert.rejects(out.checkProductSkus({from(){return{select(){return this},order(){return this},range:async()=>({data:null,error:{code:'network'}})}}},[{sku:'new'}]),/CHECK_FAILED/);console.log('PASS: duplicate SKU create/edit/import, old duplicate editing, hidden products, case/space, empty SKUs, full pagination and failures.');})().catch(e=>{console.error(e);process.exitCode=1});
