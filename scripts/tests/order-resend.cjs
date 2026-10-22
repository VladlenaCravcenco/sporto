const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict');
const code=ts.transpileModule(fs.readFileSync('api/order-request.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
async function run({language='ru',mailStatus=200,throws=false,missing='',provider='resend',image='https://example.invalid/product.jpg',adminUrl=''}={}){
 const calls=[],logs=[],out={};
 const env={SUPABASE_SECRET_KEY:'sb_secret_TEST',SUPABASE_URL:'https://example.invalid',ORDER_EMAIL_PROVIDER:provider,RESEND_API_KEY:'re_TEST_SECRET',ORDER_EMAIL_FROM:'orders@example.invalid',ORDER_ADMIN_EMAIL:'admin@example.invalid',ORDER_EMAIL_REPLY_TO:'support@example.invalid',ORDER_ADMIN_URL:adminUrl};
 if(missing)delete env[missing];
 const fetch=async(url,options)=>{
  calls.push({url,options,body:JSON.parse(options.body)});
  if(url.includes('resend')&&throws)throw new Error('secret should not be logged');
  return {ok:!url.includes('resend')||mailStatus===200,status:mailStatus,json:async()=>url.includes('resend')?{id:'email-id'}:url.includes('consume_order')?true:url.includes('link_order')?'client-id':[{id:'test-order-id'}]};
 };
 new Function('exports','process','fetch','crypto','setTimeout','console',code)(out,{env},fetch,require('node:crypto').webcrypto,fn=>fn(),{error(...args){logs.push(args.join(' '))}});
 let result;
 await out.default({method:'POST',headers:{},body:{name:'<img src=x>',phone:'+37300000000',email:'buyer@example.invalid',clientType:'individual',notes:'<script>alert(1)</script>',language,items:[{id:'product',name_ro:'Produs & test',name_ru:'Товар & тест',sku:'123',price:10,qty:2,image_url:image}]}},{setHeader(){},status(code){return{json(body){result={code,...body}}}}});
 assert.equal(result.code,201);assert.equal(result.orderId,'test-order-id');
 assert.ok(!logs.join(' ').includes('re_TEST_SECRET'));assert.ok(!logs.join(' ').includes('buyer@example.invalid'));
 return {result,calls};
}
(async()=>{
 for(const language of ['ru','ro']){
  const {result,calls}=await run({language});assert.deepEqual(result.notifications,{client:'sent',admin:'sent'});
  const mails=calls.filter(c=>c.url.includes('resend'));assert.equal(mails.length,2);
  assert.ok(calls.findIndex(c=>c.url.includes('order_requests?'))<calls.indexOf(mails[0]));
  assert.deepEqual(mails[0].body.to,['buyer@example.invalid']);assert.deepEqual(mails[1].body.to,['admin@example.invalid']);
  assert.equal(mails[1].body.reply_to,'buyer@example.invalid');assert.equal(mails[0].body.reply_to,'support@example.invalid');
  assert.match(mails[1].body.html,/Контакты клиента/);assert.match(mails[1].body.html,/width="64" height="64"/);assert.match(mails[1].body.html,/&lt;script&gt;/);assert.ok(!mails[1].body.html.includes('<script>'));assert.match(mails[1].body.html,/mailto:buyer@example.invalid/);assert.match(mails[0].body.html,/&lt;script&gt;/);assert.ok(!mails[0].body.html.includes('<script>'));
  assert.match(mails[0].body.text,language==='ru'?/Товар & тест/:/Produs & test/);assert.match(mails[0].body.text,/120\.00 MDL/);
  assert.match(mails[0].body.html,/width="64" height="64"/);assert.match(mails[0].body.html,/src="https:\/\/example.invalid\/product.jpg"/);
  if(process.env.ORDER_EMAIL_PREVIEW_DIR)fs.writeFileSync(require('node:path').join(process.env.ORDER_EMAIL_PREVIEW_DIR,`order-admin-email-${language}.html`),mails[1].body.html);
  if(process.env.ORDER_EMAIL_PREVIEW_DIR)fs.writeFileSync(require('node:path').join(process.env.ORDER_EMAIL_PREVIEW_DIR,`order-email-${language}.html`),mails[0].body.html);
  assert.notEqual(mails[0].options.headers['Idempotency-Key'],mails[1].options.headers['Idempotency-Key']);
 }
 const linked=await run({adminUrl:'https://www.example.invalid/admin/requests'});assert.match(linked.calls.filter(c=>c.url.includes('resend'))[1].body.html,/href="https:\/\/www.example.invalid\/admin\/requests"/);
 const unsafe=await run({adminUrl:'javascript:alert(1)'});assert.ok(!unsafe.calls.filter(c=>c.url.includes('resend'))[1].body.html.includes('Открыть заявки в админке'));
 for(const image of ['javascript:alert(1)','http://example.invalid/image.jpg','https://user:pass@example.invalid/image.jpg']){
  const {calls}=await run({image});assert.ok(!calls.find(c=>c.url.includes('resend')).body.html.includes('<img '));
 }
 for(const options of [{mailStatus:403},{throws:true}])assert.deepEqual((await run(options)).result.notifications,{client:'failed',admin:'failed'});
 for(const missing of ['RESEND_API_KEY','ORDER_EMAIL_FROM']){
  const {result,calls}=await run({missing});assert.deepEqual(result.notifications,{client:'not_configured',admin:'not_configured'});assert.equal(calls.filter(c=>c.url.includes('resend')).length,0);
 }
 assert.deepEqual((await run({missing:'ORDER_ADMIN_EMAIL'})).result.notifications,{client:'sent',admin:'not_configured'});
 assert.deepEqual((await run({provider:'unsupported'})).result.notifications,{client:'not_configured',admin:'not_configured'});
 console.log('PASS: RO/RU mail contents, escaped input, correct recipients/reply-to, separate idempotency keys, save before email, provider failures retain saved order, missing config sends nothing. All network mocked.');
})().catch(error=>{console.error(error);process.exitCode=1});
