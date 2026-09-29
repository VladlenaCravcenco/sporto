const fs = require('node:fs');
const assert = require('node:assert/strict');
const ts = require('typescript');
const { execFileSync } = require('node:child_process');
function compile(source) {
  const out = {};
  new Function('exports', ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText)(out);
  return out;
}
const current = compile(fs.readFileSync('app/_lib/catalog-filters.ts', 'utf8'));
const baseline = compile(execFileSync('git', ['show', 'HEAD:app/_lib/catalog-filters.ts'], { encoding: 'utf8' }));
const defs = Array.from({length: 12}, (_, i) => ({id: 'a'+i, value_type: i % 2 ? 'boolean' : 'number'}));
const products = Array.from({length: 1500}, (_, i) => ({
  id: ''+i, name_ro: 'Bandă '+i, name_ru:'Дорожка '+i, sku:'SKU'+i, brand:'B'+i%8,
  category:'c'+i%5, subcategory:'s'+i%10, price:i+10, sale_price:i%3 ? null : i+5,
  qty:i%4, has_warranty:!!(i%2),
}));
const rows = products.flatMap((p,i)=>defs.map((d,j)=>({
  product_id:p.id, attribute_id:d.id, numeric_value:(i+j)%10,
  boolean_value:!!(i%2), text_value:null,
})));
const queries = [
  {}, {category:['c1','c3'],brand:['B1','B3']}, {sale:'true',minPrice:'20',maxPrice:'500'},
  {stock:'onOrder',warranty:'true'}, {'attr.a0':['num:0','num:2'],'attr.a1':'false'},
];
for(const q of queries) {
  const a=current.createProductMatcher(q,defs,rows), b=baseline.createProductMatcher(q,defs,rows);
  for(const excluded of [undefined,'price','category','brand','stock','sale','warranty',...defs.map(d=>'attr.'+d.id)]) {
    assert.deepEqual(products.filter(p=>a(p,excluded)).map(p=>p.id),products.filter(p=>b(p,excluded)).map(p=>p.id));
  }
}
function bench(mod) {
  const start=performance.now();
  for(let n=0;n<10;n++) {
    const match=mod.createProductMatcher(queries[n%queries.length],defs,rows);
    for(const key of ['category','brand','price',...defs.map(d=>'attr.'+d.id)])
      for(const p of products) match(p,key);
  }
  return Math.round(performance.now()-start);
}
console.log('Filter equivalence passed (1500 products / 18000 attribute values).');
console.log({baselineMs:bench(baseline),optimizedMs:bench(current)});
(async()=>{
  const {publicSnapshot}=compile(fs.readFileSync('app/_lib/public-cache.ts','utf8'));
  let calls=0;
  const read=publicSnapshot(async()=>{calls++; await new Promise(r=>setTimeout(r,5)); return {calls};},15);
  const results=await Promise.all(Array.from({length:20},()=>read()));
  assert.equal(calls,1); assert.ok(results.every(x=>x===results[0]));
  await read(); assert.equal(calls,1);
  await new Promise(r=>setTimeout(r,20)); await read(); assert.equal(calls,2);
  let attempts=0;
  const retry=publicSnapshot(async()=>{if(++attempts===1)throw Error('retry');return true;});
  await assert.rejects(retry()); assert.equal(await retry(),true);
  console.log('Cache concurrency, expiry and error recovery passed.');
})().catch(e=>{console.error(e);process.exitCode=1});

