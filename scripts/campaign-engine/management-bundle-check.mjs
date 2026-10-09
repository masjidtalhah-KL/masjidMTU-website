import {readdir,readFile} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=process.cwd();
async function files(folder){return (await Promise.all((await readdir(folder,{withFileTypes:true})).map(e=>e.isDirectory()?files(path.join(folder,e.name)):path.join(folder,e.name)))).flat();}
const chunks=(await files(path.join(root,'.next/static'))).filter(f=>f.endsWith('.js'));
assert(chunks.length>0,'A genuine production build is required');
for(const f of chunks){const code=await readFile(f,'utf8');for(const value of ['local_fixture','Isolated test editor','Local management verification','synthetic-local-no-refresh'])assert(!code.includes(value),'Test-only fixture in production chunk: '+path.relative(root,f));}
const registry=await readFile(path.join(root,'src/lib/campaigns/admin-registry.ts'),'utf8');
assert.match(registry,/campaignAdminAdapters[^=]*= Object\.freeze\(\[\]\)/);
assert(!registry.includes('process.env'),'No environment switch may install a fixture adapter');
console.log(JSON.stringify({productionChunks:chunks.length,testFixtureLeak:false,productionAdminAdapters:0}));
