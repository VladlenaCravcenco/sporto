const fs = require('node:fs'), ts = require('typescript'), assert = require('node:assert/strict');
const out = {}, calls = []; let mailOk=true;
const fakeFetch = async (url, options) => {
  calls.push({url, body: JSON.parse(options.body)});
  return {ok:url.includes('emailjs') ? mailOk : true,status:mailOk?200:503,json:async()=>url.includes('consume_order')?true:url.includes('link_order')?'client-1':[{id:'order-1'}]};
};
const env={SUPABASE_SERVICE_ROLE_KEY:'test-only',NEXT_PUBLIC_SUPABASE_URL:'https://example.invalid',EMAILJS_SERVICE_ID:'service',EMAILJS_PUBLIC_KEY:'public',EMAILJS_TEMPLATE_ORDER_CONFIRMATION:'client',EMAILJS_TEMPLATE_ADMIN:'admin',ORDER_ADMIN_EMAIL:'admin@example.com'};
new Function('exports','process','fetch','crypto','setTimeout',ts.transpileModule(fs.readFileSync('api/order-request.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText)(out,{env},fakeFetch,require('node:crypto').webcrypto,fn=>fn());
const base={name:'Test',phone:'+37369123456',email:'test@example.com',clientType:'individual',items:[{id:'p1',name_ro:'Produs',name_ru:'Товар',sku:'123',qty:2,price:10}],deliveryAddress:'Address',notes:'Note',language:'ru'};
async function submit(extra){calls.length=0;let result;await out.default({method:'POST',headers:{},body:{...base,...extra}},{setHeader(){},status(code){return{json(body){result={code,...body}}}}});return result;}
(async()=>{
 assert.equal((await submit({email:''})).code,400); assert.equal((await submit({email:'bad'})).code,400);
 const result=await submit({});assert.equal(result.code,201);assert.equal(result.notifications.client,'sent');
 const saved=calls.find(c=>c.url.includes('order_requests?')).body;
 assert.equal(saved.total_items,2);assert.equal(saved.total_price,20);assert.equal(saved.notes,'Note');assert.equal(saved.delivery_address,'Address');
 const mails=calls.filter(c=>c.url.includes('emailjs'));assert.equal(mails.length,2);assert.equal(mails[0].body.template_params.to_email,base.email);assert.equal(mails[1].body.template_params.to_email,env.ORDER_ADMIN_EMAIL);
 assert.match(mails[0].body.template_params.items_list,/Товар \[123\]/);assert.equal(mails[0].body.template_params.notes,'Note');assert.equal(mails[0].body.template_params.total_with_delivery,'120.00');
 assert.ok(calls.findIndex(c=>c.url.includes('order_requests?'))<calls.findIndex(c=>c.url.includes('emailjs')));
 mailOk=false;const failed=await submit({});assert.equal(failed.code,201);assert.equal(failed.notifications.client,'failed');
 delete env.EMAILJS_TEMPLATE_ORDER_CONFIRMATION;assert.equal((await submit({})).notifications.client,'not_configured');
 assert.equal((await submit({items:[]})).code,400);
 console.log('PASS: required email; order data preserved; client/admin email payloads; save before email; email failure does not lose order. All network mocked.');
})().catch(e=>{console.error(e);process.exitCode=1});
