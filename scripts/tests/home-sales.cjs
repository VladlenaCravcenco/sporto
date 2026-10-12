const fs = require('node:fs'), ts = require('typescript'), assert = require('node:assert/strict');
const source = ts.transpileModule(fs.readFileSync('app/_lib/home-data.ts','utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
}).outputText;
async function check(response, expectedCount, expectedLength) {
  const calls = [];
  const db = {
    async rpc(name) {
      calls.push(name);
      if (name === 'sporto_active_brands_v1') return { data: [], error: null };
      assert.equal(name,'sporto_home_sales_v1');return response;
    },
    from(table) {
      const chain = new Proxy({}, { get(_, key) {
        if (key === 'then') return resolve => Promise.resolve({data:[],error:null}).then(resolve);
        assert.ok(['select','eq','order','limit'].includes(key), 'No sales pagination or separate count query');
        return (...args) => { if(key==='select') assert.equal(args.length,1); return chain; };
      }});
      return chain;
    }
  };
  const exports = {};
  new Function('exports','require',source)(exports, name => ({
    '@supabase/supabase-js':{createClient:()=>db},
    './supabase-env':{getSupabasePublicConfig:()=>({url:'fixture',key:'fixture'})},
    './public-cache':{publicSnapshot:fn=>fn},
  })[name]);
  const result = await exports.getHomeHeroData();
  assert.equal(result.promoCount,expectedCount);
  assert.equal(result.saleProducts.length,expectedLength);
  assert.equal(calls.filter(x=>x==='sporto_home_sales_v1').length,1);
}
(async()=>{
  await check({data:{products:Array.from({length:20},(_,id)=>({id})),total:123},error:null},'120+',20);
  await check({data:{products:[],total:0},error:null},'0',0);
  await check({data:{products:[{id:'1'}],total:1},error:null},'1',1);
  await check({data:null,error:{message:'RPC unavailable'}},'...',0);
  await check({data:{products:Array(21).fill({}),total:21},error:null},'...',0);
  console.log('Home sales: bounded RPC, shared total, empty/error handling passed.');
})().catch(e=>{console.error(e);process.exitCode=1});
