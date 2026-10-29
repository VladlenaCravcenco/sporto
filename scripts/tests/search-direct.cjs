const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
function load(path,deps={}){const e={};new Function('exports','require',ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText)(e,n=>{if(!(n in deps))throw Error(n);return deps[n]});return e;}
const filters=load('app/_lib/catalog-filters.ts');
const products=[
 {id:'a',name_ro:'Minge A',name_ru:'Мяч A',category:'balls',subcategory:'tennis',brand:'A',price:200,sale_price:100,qty:2,has_warranty:true},
 {id:'b',name_ro:'Minge B',category:'balls',subcategory:'football',brand:'B',price:150,qty:0},
 ...Array.from({length:25},(_,i)=>({id:'x'+String(i).padStart(2,'0'),name_ro:'Minge X'+i,category:'balls',subcategory:'tennis',brand:'A',price:300+i,qty:1}))
];
const attributes=[{product_id:'a',attribute_id:'size',numeric_value:5}],links=[{product_id:'a',category:'school',subcategory:'games'}];
const db={from(table){const rows=table==='product_attribute_values'?attributes:links;return {select(){return this},in(){return this},order(){return this},range:async()=>({data:rows,error:null})};}};
const defs=[{id:'size',value_type:'number',name_ro:'Size',name_ru:'Размер'}];
const {searchCatalog}=load('app/_lib/search-catalog.ts',{
 './search-products':{readSearchProducts:async()=>products},'./search-query':{prepareSearchQuery:()=>({raw:['minge']})},
 './catalog-filters':filters,'./product-category-links':{missingMergeRelation:()=>false}
});
(async()=>{
 const all=await searchCatalog(db,{search:'minge'},1,'price-asc','ro',defs);
 assert.equal(all.totalProducts,27);assert.equal(all.products.length,24);assert.equal(all.products[0].id,'a');
 const page2=await searchCatalog(db,{search:'minge'},2,'price-asc','ro',defs);
 assert.equal(page2.products.length,3);assert.ok(!page2.products.some(p=>all.products.some(a=>a.id===p.id)));
 const alias=await searchCatalog(db,{search:'minge',category:'school',subcategory:'games'},1,'recommended','ro',defs);
 assert.deepEqual(alias.products.map(p=>p.id),['a']);
 assert.equal(all.facets.find(f=>f.key==='brand'&&f.value==='A').count,26);
 const attribute=await searchCatalog(db,{search:'minge','attr.size':'num:5',maxPrice:'120'},1,'price-asc','ro',defs);
 assert.deepEqual(attribute.products.map(p=>p.id),['a']);
 const stock=await searchCatalog(db,{search:'minge',stock:'onOrder'},1,'recommended','ro',defs);
 assert.deepEqual(stock.products.map(p=>p.id),['b']);
 const reader=load('app/_lib/search-products.ts').readSearchProducts;const calls=[];
 const source={from(table){assert.equal(table,'products');return {select(fields){assert.ok(!fields.includes('description'));return this},eq(k,v){assert.equal(k,'active');assert.equal(v,true);return this},or(v){calls.push(v);return this},order(){return this},range:async(from)=>({data:from===0?Array.from({length:1000},(_,i)=>({id:String(i)})):[{id:'1000'}],error:null})};}};
 assert.equal((await reader(source,{raw:['x%,evil']})).length,1001);
 assert.ok(calls[0].includes('name_ro.imatch.'));assert.ok(calls[0].includes('x%,ev[iî]l'));
 calls.length=0;await reader(source,{raw:['banda','x.*']});assert.ok(calls[0].includes('b[aăâ]nd[aăâ]'));assert.ok(calls[1].includes('x\\\\.\\\\*'));
 console.log('PASS: query pagination beyond 1000, literal filter escaping, sale prices, catalog pages, merged placements, stock, attributes and facet counts.');
})().catch(e=>{console.error(e);process.exitCode=1});
