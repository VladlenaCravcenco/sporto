const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict');
const out={};
new Function('exports',ts.transpileModule(fs.readFileSync('src/lib/responsive-images.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText)(out);
const original='https://example.supabase.co/storage/v1/object/public/product-images/products/photo.jpg';
for(const variant of ['card','menu','hero','detail','thumbnail']) {
 const r=out.responsiveImage(original,variant);
 assert.ok(r.src.includes('/render/image/public/'));
 assert.ok(r.srcSet.includes('w'));assert.ok(r.sizes);
 assert.equal(new URL(r.src).searchParams.get('resize'),'contain');
 assert.ok(!r.src.includes('/_next/image'));
}
for(const url of ['/local.jpg','https://supplier.example/photo.jpg',original+'?token=private',original.replace('public/','sign/'),original.replace('.jpg','.svg'),original.replace('.jpg','.gif'),'data:image/png;base64,abc'])
 assert.deepEqual(out.responsiveImage(url,'card'),{src:url});
console.log('Responsive images: bounded sizes, no crop, originals preserved for unsupported/signed sources.');
const supplier='https://www.insportline.eu/upload/product/640x640/main_foto_s_modelkou.jpg.webp';
for (const variant of ['card','menu','thumbnail']) {
 const result=out.responsiveImage(supplier,variant);
 assert.ok(result.src.includes('/320x320/'));
 assert.ok(result.srcSet.includes('/150x150/'));
 assert.ok(result.srcSet.includes(supplier+' 640w'));
}
for (const variant of ['detail','hero']) assert.deepEqual(out.responsiveImage(supplier,variant),{src:supplier});
assert.deepEqual(out.responsiveImage(supplier+'?token=x','card'),{src:supplier+'?token=x'});
console.log('Supplier: responsive thumbnails, original detail/hero and signed URLs preserved.');

const logo=out.responsiveImage(original.replace('product-images/products/photo.jpg','brand-logos/logo.png'),'logo');
assert.equal(new URL(logo.src).searchParams.get('width'),'240');
assert.equal(new URL(logo.src).searchParams.get('height'),'64');
assert.equal(new URL(logo.src).searchParams.get('resize'),'contain');
assert.ok(logo.srcSet.endsWith('3x'));
assert.ok(logo.srcSet.includes(' 1x, '));
assert.ok(logo.srcSet.split(', ').every(candidate => / [123]x$/.test(candidate)),'Constrained-height logos require density descriptors');
for(const url of [original.replace('.jpg','.svg'),original+'?token=private']) {
 assert.deepEqual(out.responsiveImage(url,'logo'),{src:url});
}
console.log('Logos: 120×32 box, 1x/2x/3x variants, no crop, SVG and signed sources preserved.');
