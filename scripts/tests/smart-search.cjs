const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict'),cp=require('node:child_process');
function compile(source,deps={}) {
 const out={};new Function('exports','require',ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText)(out,n=>deps[n]);return out;
}
const engine=compile(fs.readFileSync('src/lib/searchEngine.ts','utf8'));
const old=compile(cp.execFileSync('git',['show','HEAD:src/lib/searchEngine.ts'],{encoding:'utf8'}));
const products=[
 {id:'1',name:{ro:'Bandă de alergat inSPORTline',ru:'Беговая дорожка'},description:{ro:'Aparat cardio pentru acasă',ru:'Кардио для дома'},category:'aparate-cardio',subcategory:'banda-alergat',brand:'inSPORTline',sku:'AB-12',price:1500},
 {id:'2',name:{ro:'Gantere HMS',ru:'Гантели HMS'},description:{ro:'Antrenament de forță',ru:'Силовые тренировки'},category:'greutati',subcategory:'gantere',brand:'HMS',sku:'AB-13',price:100},
];
for(const lang of ['ro','ru']) for(const q of ['banda','bnda','дорожка','бег','AB-12','hms','gantere sub 200 lei','спорт дома','несуществующий товар']) {
 assert.deepEqual(engine.searchProducts(products,q,lang,8),old.searchProducts(products,q,lang,8));
 // Repeated evaluation exercises prepared text.
 assert.deepEqual(engine.searchProducts(products,q,lang,8),old.searchProducts(products,q,lang,8));
}
const prepare=compile(fs.readFileSync('app/_lib/search-query.ts','utf8'),{'../../src/lib/searchEngine':engine});
const {prepareSearchQuery}=prepare;
assert.ok(prepareSearchQuery('беговая дорожка').synonyms.includes('treadmill'));
assert.equal(prepareSearchQuery('гантели до 200').max,200);
assert.equal(prepareSearchQuery('Bandă').raw[0],'banda');
assert.deepEqual(prepareSearchQuery('17-47-121').raw,['17-47-121']);
assert.equal(prepareSearchQuery('AB123-456').min,undefined);
assert.equal(prepareSearchQuery('500-1000').min,500);
assert.throws(()=>prepareSearchQuery('x'.repeat(161)));
assert.throws(()=>prepareSearchQuery('a '.repeat(17)));
let calls=0, fail=false, oversize=false;
const db={
 from(){throw Error('Search must never load a products table');},
 async rpc(name,args){
  calls++; assert.equal(name,'sporto_search_v1');assert.ok(args.spec.raw);assert.ok(['ro','ru'].includes(args.locale));
  await new Promise(r=>setTimeout(r,1));
  return {error:fail ? Error('unavailable') : null,data:{products:Array.from({length:oversize?9:1},()=>({
   id:'1',name_ro:'Bandă',name_ru:'Дорожка',price:1500,qty:1,score:20,match_type:'exact',sku:'AB-12'
  })),total:1400,brands:[],categories:[],suggestions:[],hasFuzzy:false,hasSynonym:false,hasConcept:false}};
 }
};
const service=compile(fs.readFileSync('app/_lib/smart-search.ts','utf8'),{
 '@supabase/supabase-js':{createClient:()=>db},'./supabase-env':{getSupabasePublicConfig:()=>({url:'fixture',key:'fixture'})},
 './search-query':prepare
});
(async()=>{
 const [a,b]=await Promise.all([service.getSmartSearch('banda','ro'),service.getSmartSearch('banda','ro')]);
 assert.equal(calls,1);assert.equal(a,b);assert.equal(a.result.total,1400);assert.equal(a.result.hits.length,1);
 assert.equal(a.result.hits[0].product.id,'1');assert.deepEqual(a.result.hits[0].product.description,{ro:'',ru:''});
 await assert.rejects(service.getSmartSearch('x'.repeat(161),'ro'));
 await service.getSmartSearch('banda','ro');assert.equal(calls,1);
 for(let i=0;i<40;i++)await service.getSmartSearch('SKU'+i,'ro');
 await service.getSmartSearch('banda','ro');assert.equal(calls,42,'Old result must be evicted from the bounded cache');
 const originalNow=Date.now; Date.now=()=>originalNow()+16000;
 try{await service.getSmartSearch('banda','ro');assert.equal(calls,43);}finally{Date.now=originalNow;}
 fail=true;await assert.rejects(service.getSmartSearch('failed','ro'));fail=false;
 await service.getSmartSearch('failed','ro');assert.equal(calls,45,'Failures must not be cached');
 oversize=true;await assert.rejects(service.getSmartSearch('oversize','ro'));
 console.log('Search: synonyms, RO/RU, price, bounded RPC, concurrency, cache capacity/expiry/error recovery passed. No full-catalog download.');
})().catch(e=>{console.error(e);process.exitCode=1});
