const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict');
let brand=null,valid=true,validated;
const out={};
new Function('exports','require',ts.transpileModule(fs.readFileSync('app/brands/[slug]/page.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText)(out,name=>({
 'next/navigation':{notFound(){throw Error('404')},permanentRedirect(path){throw Error('308 '+path)}},
 '../../_lib/brand-data':{getBrand:async()=>brand},
 '../../_lib/public-route-preflight':{validatePublicRoute:async(...args)=>{validated=args;if(!valid)throw Error('404')}},
}[name]));
const call=query=>out.default({params:Promise.resolve({slug:'insportline'}),searchParams:Promise.resolve(query)});
(async()=>{
 await assert.rejects(call({}),/^Error: 404$/);
 brand={slug:'insportline'};
 await assert.rejects(call({lang:'ru',page:'2',utm_source:'test'}),/^Error: 308 \/ru\/brands\/insportline\?page=2&utm_source=test$/);
 assert.deepEqual(validated,['/ru/brands/insportline','page=2&utm_source=test','ru']);
 valid=false;await assert.rejects(call({page:'99999'}),/^Error: 404$/);
 console.log('PASS: removed brands remain direct 404; existing brands redirect with locale/query only after target validation.');
})().catch(error=>{console.error(error);process.exitCode=1});
