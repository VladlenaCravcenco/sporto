const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict');
const code=ts.transpileModule(fs.readFileSync('api/order-request.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
async function check(env,secret,bearer){
 const out={},calls=[];
 const fetch=async(url,options)=>{calls.push({url,options});return {ok:true,status:200,json:async()=>url.includes('consume_order')?true:url.includes('link_order')?'client-1':[{id:'order-1'}]}};
 new Function('exports','process','fetch','crypto','setTimeout',code)(out,{env},fetch,require('node:crypto').webcrypto,fn=>fn());
 let response;
 await out.default({method:'POST',headers:{},body:{name:'Test',phone:'+37369123456',email:'test@example.invalid',clientType:'individual',items:[{id:'p1',name_ro:'Produs',name_ru:'Товар',sku:'123',qty:1,price:10}],language:'ro'}},{setHeader(){},status(code){return{json(body){response={code,body}}}}});
 assert.equal(response.code,201);
 assert.ok(calls.length>0);
 for(const call of calls){assert.ok(call.url.startsWith('https://example.invalid/'));assert.equal(call.options.headers.apikey,secret);assert.equal(call.options.headers.Authorization,bearer)}
}
(async()=>{
 await check({SUPABASE_URL:'https://example.invalid',SUPABASE_SECRET_KEY:'sb_secret_TEST',SUPABASE_SERVICE_ROLE_KEY:'old'},'sb_secret_TEST',undefined);
 await check({NEXT_PUBLIC_SUPABASE_URL:'https://example.invalid',SUPABASE_SERVICE_ROLE_KEY:'legacy'},'legacy','Bearer legacy');
 console.log('PASS: modern secret uses apikey without JWT bearer; legacy bearer remains supported. All network mocked.');
})().catch(error=>{console.error(error);process.exitCode=1});
