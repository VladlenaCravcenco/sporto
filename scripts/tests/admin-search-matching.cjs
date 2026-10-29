const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict');
const out={};new Function('exports',ts.transpileModule(fs.readFileSync('src/lib/admin-product-search.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText)(out);
function filters(input){const result=[];const q={or(filter){result.push(filter);return this}};out.applyAdminProductSearch(q,input);return result;}
for(const input of ['manusi','mănusi','mănuși','MĂNUŞI']){
 const filter=filters(input)[0];const pattern=JSON.parse(filter.match(/^name_ro\.imatch\.("(?:\\.|[^"\\])*"),/)[1]);
 assert.ok(new RegExp(pattern,'i').test('Mănuși de box'));assert.ok(new RegExp(pattern,'i').test('Manusi box'));
}
assert.deepEqual(filters('555'),['sku.imatch."^555"']);
assert.deepEqual(filters('00123456789'),['sku.imatch."^00123456789"']);
assert.ok(filters('555').every(filter=>!filter.includes('id.')));
assert.ok(filters('IN2677').every(filter=>!filter.includes('id.')));
assert.equal(filters('manusi box').length,2);assert.equal(filters('  ').length,0);
const escaped=filters('AB.12')[0];const pattern=JSON.parse(escaped.match(/^name_ro\.imatch\.("(?:\\.|[^"\\])*"),/)[1]);
assert.ok(new RegExp(pattern,'i').test('AB.12'));assert.ok(!new RegExp(pattern,'i').test('ABx12'));
console.log('PASS: Romanian accents/letter variants, numeric code prefixes only, long codes/leading zeros, multiword names and escaped punctuation.');
