const fs=require('node:fs'),assert=require('node:assert/strict'),ts=require('typescript');
const out={};new Function('exports',ts.transpileModule(fs.readFileSync('src/lib/similar-products.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText)(out);
const product=(id,sku,name,brand='Brand')=>({id,sku,name_ro:name,name_ru:null,brand,image_url:null,active:true});
const rows=[product('self','123','Aparat TOORX ASX6000 profesional'),product('same','R-123','Aparat TOORX ASX6000 profesional'),product('variant','124','Aparat TOORX ASX6000 profesional roșu'),product('other','125','Minge volei Mikasa V200W')];
assert.deepEqual(out.similarProducts(rows,{id:'self',sku:'123',name_ro:rows[0].name_ro}).map(p=>p.id),['same','variant']);
assert.deepEqual(out.similarProducts(rows,{sku:' R-123 '}).map(p=>p.id).sort(),['same','self']);
assert.equal(out.similarProducts(rows,{name_ro:'Minge volei Mikasa V200W'})[0].id,'other');
assert.equal(out.similarProducts(rows,{name_ro:'a'}).length,0);
assert.equal(out.similarProducts(rows,{name_ro:'Aparat nou complet diferit'}).length,0);
// Different brands with the same name still merit a warning, never a hard block.
assert.equal(out.similarProducts([product('another','999','Same product name','Other brand')],{name_ro:'Same product name'}).length,1);
(async()=>{
 let pages=0;
 const db={from(table){return {select(){return this},order(){return this},async range(from){if(table==='product_redirects')return {data:[{source_id:'archive'}]};pages++;return {data:from===0?Array.from({length:1000},(_,i)=>product(i===0?'archive':String(i),String(i),'Name')):[product('last','last','Name')]};}}}};
 const catalog=await out.loadSimilarityCatalog(db);assert.equal(pages,2);assert.equal(catalog.length,1000);assert.ok(!catalog.some(p=>p.id==='archive'));assert.ok(catalog.some(p=>p.id==='last'));
 console.log('PASS: identical names, similar model variants, SKU aliases, self exclusion, short/unrelated input, brand differences, catalog pagination and merged archive exclusion.');
})().catch(e=>{console.error(e);process.exitCode=1});
