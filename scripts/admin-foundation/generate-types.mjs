import { writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { cli } from './local-stack.mjs';
import { root } from './database.mjs';
// Authoritative local Supabase schema only. No synthetic or hosted fallback.
const output = cli(['gen', 'types', 'typescript', '--local', '--schema', 'public']).replace(/\r\n/g, '\n').trimEnd() + '\n';
const destination = path.join(root, 'src/lib/supabase/database.types.ts');
if (process.argv.includes('--check')) {
  if ((await readFile(destination, 'utf8')).replace(/\r\n/g, '\n') !== output) throw Error('Real local database types drift: run npm run admin:types');
  console.log('Real local Supabase type parity passed.');
} else {
  await writeFile(destination, output);
  console.log('Generated database types from the real local Supabase schema.');
}
