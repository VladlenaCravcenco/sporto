const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
const compile=(file,deps={})=>{
 const exports={};
 new Function('exports','require',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText)(exports,n=>{
 if(!deps[n])throw Error('Unexpected dependency '+n);return deps[n]});
 return exports;
};
let calls=[];
let rpcError=null;
const db={
 rpc:async(name,args)=>{calls.push({name,args});return {error:rpcError,data:{products:[{id:'p1'}],totalProducts:25,minPrice:10,maxPrice:100,facets:[
 {key:'brand',value:'Brand',count:25},{key:'category',value:'cardio',count:25},
 {key:'attr.weight',value:'num:10',count:8},{key:'attr.fold',value:'false',count:3}
 ]}}},
 from(table){
  assert.equal(table,'product_attributes','Must not download products or attribute values');
  const chain=new Proxy({}, {get:(_,key)=>key==='then'? resolve=>Promise.resolve({data:[
   {id:'weight',value_type:'number',name_ro:'Greutate',name_ru:'Вес',unit:'kg',category_ids:['cardio']},
   {id:'fold',value_type:'boolean',name_ro:'Pliabil',name_ru:'Складной',category_ids:[]}
  ],error:null}).then(resolve):()=>chain});
  return chain;
 }
};
const {getRpcCatalog}=compile('app/_lib/catalog-rpc.ts',{
 '@supabase/supabase-js':{createClient:()=>db},
 './supabase-env':{getSupabasePublicConfig:()=>({url:'fixture',key:'fixture'})},
 './catalog-data':{getCatalogNavigation:async()=>[{id:'cardio',name:{ro:'Cardio',ru:'Кардио'},subcategories:[]}]},
 './public-cache':compile('app/_lib/public-cache.ts'),
 './catalog-filters':compile('app/_lib/catalog-filters.ts'),
 './search-query':compile('app/_lib/search-query.ts',{'../../src/lib/searchEngine':compile('src/lib/searchEngine.ts')})
});
(async()=>{
 const result=await getRpcCatalog({category:'cardio','attr.weight':['num:10'],minPrice:'invalid',page:'2',sort:'price-asc'},1,'price-asc','ru');
 assert.equal(result.status,'ready');assert.equal(result.totalPages,2);
 assert.deepEqual(calls[0].args.filters,{category:'cardio','attr.weight':['num:10']});
 assert.equal(result.facets.groups.find(g=>g.key==='attr.weight').options[0].label,'10 kg');
 assert.equal(result.facets.groups.find(g=>g.key==='attr.fold').options[0].label,'Нет');
 assert.equal(result.facets.groups.find(g=>g.key==='brand').options[0].count,25);
 assert.equal((await getRpcCatalog({},3,'recommended','ro')).status,'out-of-range');
 await getRpcCatalog({search:'гантели до 200',brand:'HMS'},1,'recommended','ru');
 assert.equal(calls.at(-1).name,'sporto_catalog_search_v1');
 assert.equal(calls.at(-1).args.filters.searchSpec.max,200);
 assert.ok(calls.at(-1).args.filters.searchSpec.synonyms.includes('gantere'));
 assert.equal(calls.at(-1).args.filters.brand,'HMS');
 rpcError={message:'permission denied'};
 await assert.rejects(getRpcCatalog({},1,'recommended','ro'));
 console.log('RPC adapter: query, labels, counts, pagination and error checks passed; no bulk product downloads.');
})().catch(e=>{console.error(e);process.exitCode=1});
