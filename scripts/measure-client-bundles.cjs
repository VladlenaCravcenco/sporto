const fs=require('node:fs'),vm=require('node:vm'),zlib=require('node:zlib');
const result={};
for(const route of ['[lang]','[lang]/catalog','[lang]/[...slug]','admin']) {
 const context={};vm.runInNewContext(fs.readFileSync(`.next/server/app/${route}/page_client-reference-manifest.js`,'utf8'),context);
 const manifest=Object.values(context.__RSC_MANIFEST)[0];
 const files=[...new Set([...JSON.parse(fs.readFileSync('.next/build-manifest.json','utf8')).rootMainFiles,...Object.values(manifest.clientModules).flatMap(m=>m.chunks)].filter(f=>f.endsWith('.js')))];
 let bytes=0,gzip=0;
 for(const f of files){const data=fs.readFileSync('.next/'+decodeURIComponent(f));bytes+=data.length;gzip+=zlib.gzipSync(data).length;}
 result[route]={files:files.length,bytes,gzip,paths:files};
}
console.log(JSON.stringify(result,null,2));
