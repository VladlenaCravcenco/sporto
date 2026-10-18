const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict');
function load(file,mocks={}){const out={};new Function('exports','require',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText)(out,name=>{if(name in mocks)return mocks[name];throw Error('Unexpected import '+name)});return out;}
const {legacyContentRedirect:redirect}=load('app/_lib/legacy-redirects.ts');
assert.equal(redirect('/',''),' /ro'.trim());
assert.equal(redirect('/','?lang=ru&utm_source=test'),'/ru?utm_source=test');
assert.equal(redirect('/catalog','?category=cardio&lang=ru&page=2&brand=a&brand=b'),'/ru/catalog?category=cardio&page=2&brand=a&brand=b');
assert.equal(redirect('/about/','?lang=ro'),'/ro/about');
assert.equal(redirect('/brands/insportline','?lang=ru'),null);
for(const path of ['/ru','/ro/catalog','/api/search','/admin','/login','/callback','/not-found','/product/id','/brands/a/extra'])assert.equal(redirect(path,'?lang=ru'),null);
let found=true,redirectSource;const product={id:'product-id',name_ro:'Produs',name_ru:'Товар'};
const route=load('app/product/[...legacy]/page.tsx',{
 'next/navigation':{notFound(){throw Error('404')},permanentRedirect(path){throw Error('308 '+path)}},
 '../../_lib/product-data':{getProductDetail:async()=>found?{product,redirectSource}:null},
 '../../_lib/product-url':{productPath:(p,lang)=>`/${lang}/product/${lang==='ru'?'tovar':'produs'}/${p.id}`,productSlug:(p,lang)=>p.id==='old-id'?(lang==='ru'?'old-tovar':'old-produs'):(lang==='ru'?'tovar':'produs')},
}).default;
const call=(legacy,query={})=>route({params:Promise.resolve({legacy}),searchParams:Promise.resolve(query)});
(async()=>{
 await assert.rejects(call(['tovar','9918']),/^Error: 308 \/ru\/product\/tovar\/product-id$/);
 await assert.rejects(call(['produs','product-id'],{lang:'ru',utm_source:'test',unsafe:'discard'}),/^Error: 308 \/ru\/product\/tovar\/product-id\?utm_source=test$/);
 await assert.rejects(call(['product-id']),/^Error: 308 \/ro\/product\/produs\/product-id$/);
 await assert.rejects(call(['a','b','c']),/^Error: 404$/);
 redirectSource={id:'old-id',name_ro:'Old',name_ru:'Старый'};
 await assert.rejects(call(['old-tovar','old-id']),/^Error: 308 \/ru\/product\/tovar\/product-id$/);
 found=false;await assert.rejects(call(['missing']),/^Error: 404$/);
 console.log('PASS: known old routes, locale selection, query preservation, no API/auth interception; one-hop product ID/SKU redirects and missing products remain 404.');
})().catch(error=>{console.error(error);process.exitCode=1});
