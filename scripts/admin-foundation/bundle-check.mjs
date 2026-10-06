import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { root } from './database.mjs';
let files=0;
async function scan(directory) {
  for(const entry of await readdir(directory,{withFileTypes:true})) {
    const file=path.join(directory,entry.name);
    if(entry.isDirectory()) await scan(file);
    else if(/\.(js|map)$/.test(entry.name)) {
      const source=await readFile(file,'utf8'); files++;
      for(const secret of [process.env.SUPABASE_SECRET_KEY,process.env.SUPABASE_SERVICE_ROLE_KEY,process.env.ADMIN_TEST_SECRET_SENTINEL].filter(Boolean)) assert(!source.includes(secret),`Privileged secret in public chunk ${entry.name}`);
      assert(!/sb_secret_[A-Za-z0-9_-]{10,}/.test(source),`Secret key literal in ${entry.name}`);
      assert(!source.includes('SUPABASE_SECRET_KEY') && !source.includes('SUPABASE_SERVICE_ROLE_KEY'),`Server-only secret env reference in ${entry.name}`);
    }
  }
}
await scan(path.join(root,'.next/static'));
assert(files>0,'Production build is required before bundle scan');
console.log(`PASS: ${files} production browser chunks scanned; no privileged secret value/import.`);
