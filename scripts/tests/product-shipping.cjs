const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const moduleExports = {};
const source = fs.readFileSync('app/[lang]/product/[slug]/[sku]/page.tsx', 'utf8') + '\nexport { ProductJsonLd };';
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX } }).outputText;
new Function('exports', 'require', compiled)(moduleExports, name => name === 'react/jsx-runtime' ? { jsx: (type, props) => ({type, props}) } : {});
for (const language of ['ro', 'ru']) {
  for (const [price, salePrice, free] of [[499.99, null, false], [500, null, true], [501, null, true], [600, 400, false], [600, 500, true]]) {
    const product = {id:'test',sku:'TEST',name_ro:'Test',name_ru:'Тест',price,sale_price:salePrice,qty:1,images:[],image_url:null};
    const element = moduleExports.ProductJsonLd({data:{product,images:[]},language,canonical:`https://www.sporto.md/${language}/product/test/test`});
    const offer = JSON.parse(element.props.dangerouslySetInnerHTML.__html).offers;
    assert.equal(offer.price,salePrice ?? price);
    assert.equal(offer.shippingDetails.shippingDestination.addressCountry,'MD');
    assert.equal(offer.shippingDetails.shippingRate.currency,'MDL');
    assert.equal(offer.shippingDetails.shippingRate.value,free ? 0 : undefined);
    assert.equal(offer.shippingDetails.shippingRate.maxValue,free ? undefined : 100);
    assert.match(offer.shippingDetails.shippingSettingsLink,new RegExp(`/${language}/delivery-terms$`));
  }
}
console.log('PASS: RO/RU shipping markup, exact 500 MDL threshold, sale prices and order-dependent maximum rate.');
