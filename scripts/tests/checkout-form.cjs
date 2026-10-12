const fs=require('node:fs'),ts=require('typescript'),React=require('react'),assert=require('node:assert/strict');
const {renderToStaticMarkup}=require('react-dom/server');let language='ru';const out={};
function mockRequire(name){
 if(name.includes('supabase/client'))return {createClient:()=>{throw new Error('Must not authenticate during SSR')}};
 if(name.includes('LanguageContext'))return {useLanguage:()=>({language})};
 if(name.includes('CartContext'))return {useCart:()=>({cart:[{id:'1',name:{ro:'Produs',ru:'Товар'},price:100,quantity:1}],totalPrice:100,totalItems:1,isFreeDelivery:false,totalWithDelivery:200})};
 if(name==='react-router')return {Link:({to,children,...props})=>React.createElement('a',{href:to,...props},children),useNavigate:()=>()=>{}};
 if(name.includes('SeoHead'))return {SeoHead:()=>null};
 if(name.includes('googleAds'))return {};
 if(name.includes('orderRequests'))return {};
 if(name.includes('PhoneInput'))return {PhoneInput:props=>React.createElement('input',{...props,type:'tel'})};
 return require(name);
}
new Function('require','exports',ts.transpileModule(fs.readFileSync('src/app/pages/OrderRequest.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2020}}).outputText)(mockRequire,out);
for(language of ['ru','ro']){
 const html=renderToStaticMarkup(React.createElement(out.OrderRequest));
 assert.match(html,/<input[^>]*type="email"[^>]*required=""/);
 assert.ok(!html.includes('type="password"'));
 assert.ok(!html.includes('authTab'));
 assert.match(html,/<details/);
 assert.match(html,/<input(?=[^>]*value="individual")(?=[^>]*checked="")[^>]*>/);
 assert.ok(!html.includes('autoComplete="organization"'));
}
console.log('PASS: RO/RU checkout SSR, email required, no login/password, individual default, optional details collapsed.');
