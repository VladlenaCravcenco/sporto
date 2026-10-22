const assert = require('node:assert/strict'), fs = require('node:fs'), ts = require('typescript');
function load(file, deps = {}) {
  const out = {};
  new Function('exports', 'require', ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText)(out, name => {
    if (!(name in deps)) throw Error('Unexpected dependency ' + name); return deps[name];
  });
  return out;
}
(async () => {
  const { getCategoryLanding } = load('app/_lib/catalog-seo.ts', { './category-guides': load('app/_lib/category-guides.ts'), react: { cache: fn => fn }, './catalog-data': { getCatalogNavigationForSeo: async () => [
    { id:'cardio',name:{ro:'Cardio',ru:'Кардио'},description:{ro:'',ru:''},subcategories:[{id:'treadmill',name:{ro:'Benzi',ru:'Дорожки'}}] },
    { id:'strength',name:{ro:'Forță',ru:'Сила'},description:{ro:'',ru:''},subcategories:[{id:'bench',name:{ro:'Bănci',ru:'Скамьи'}}] },
  ] } });
  assert.equal((await getCategoryLanding({category:['cardio','strength'],subcategory:'bench'},'ru')).invalid, false);
  assert.equal((await getCategoryLanding({category:'cardio',subcategory:['treadmill']},'ru')).invalid, false);
  assert.equal((await getCategoryLanding({category:['cardio','unknown']},'ru')).invalid, true);
  assert.equal((await getCategoryLanding({category:'cardio',subcategory:'bench'},'ru')).invalid, true);
  assert.equal((await getCategoryLanding({category:['cardio','strength'],subcategory:'bench'},'ru')).landing, null);
  const rows = load('app/_lib/public-rows.ts');
  const ranges = [];
  const data = await rows.readPublicRows({ async range(from,to) { ranges.push([from,to]);return {error:null,data:from===0?Array.from({length:1000},(_,i)=>i):[1000]}; } });
  assert.equal(data.length,1001); assert.deepEqual(ranges,[[0,999],[1000,1999]]);
  await assert.rejects(rows.readPublicRows({ async range() { return {data:null,error:Error('offline')}; } }), /unavailable/);
  const badDb = {from() { const chain={select(){return this},eq(){return this},order(){return this},async range(){return {data:null,error:Error('offline')}}};return chain;}};
  const navigation = load('app/_lib/catalog-data.ts', { './product-category-links':{readProductCategoryLinks:async()=>[]}, './public-rows':rows, './public-cache':load('app/_lib/public-cache.ts'),
    '@supabase/supabase-js':{createClient:()=>badDb},'./supabase-env':{getSupabasePublicConfig:()=>({url:'fixture',key:'fixture'})},
    '../../src/app/data/products':{categories:[]} });
  await assert.rejects(navigation.getCatalogNavigationForSeo(),/unavailable/);

  let settings = {};
  const contacts = load('src/app/hooks/useContacts.ts', {react:{useState:fn=>[typeof fn==='function'?fn():fn,()=>{}],useEffect(){}},
    '../contexts/PublicPageData':{usePublicPageData:()=>({settings})}, '../../lib/supabase':{}, '../../lib/contacts':{CONTACTS:{telegram:'https://t.me/example',whatsapp:'https://wa.me/123',viber:'viber://chat?number=123'}} });
  for(const value of ['null','{}','invalid','[null,{}, {"id":"x","type":"telegram","url":"javascript:alert(1)"}]']) {
    settings={socials:value}; assert.ok(Array.isArray(contacts.useContacts().socials));
    assert.ok(!contacts.useContacts().socials.some(s=>s.url.startsWith('javascript:')));
  }
  const publicUrls = load('app/_lib/public-url.ts');
  for(const value of ['javascript:alert(1)','data:text/html,test','https://user:password@example.com','not a URL']) assert.equal(publicUrls.publicHttpUrl(value),undefined);
  assert.equal(publicUrls.publicHttpUrl('https://example.com/file.pdf'),'https://example.com/file.pdf');
  const publicData = load('app/_lib/public-page-data.ts',{react:{cache:fn=>fn}, './supabase-env':{getSupabasePublicConfig:()=>({url:'fixture',key:'fixture'})},
    '@supabase/supabase-js':{createClient:()=>({from(table){assert.equal(table,'site_settings');return {select(){return this},async in(key,values){assert.equal(key,'key');assert.ok(!values.includes('private-setting'));return {error:null,data:[{key:'email',value:'public@example.com'},{key:'private-setting',value:'must-not-be-serialized'}]};}}}})} });
  const initial=await publicData.getPublicPageData('contacts');assert.deepEqual(initial.settings,{email:'public@example.com'});
  console.log('PASS: multi-category filters, strict database failure, navigation pagination beyond 1000, malformed socials, unsafe link schemes and contact settings allowlist.');
})().catch(error=>{console.error(error);process.exitCode=1});
