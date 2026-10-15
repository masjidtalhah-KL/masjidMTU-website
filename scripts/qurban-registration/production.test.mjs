import test,{before,after} from 'node:test';import assert from 'node:assert/strict';import {chromium} from '@playwright/test';
import {setup,reset as cleanup} from './review-fixture.mjs';import {slug,request} from './fixtures.mjs';import {rpc,sql,quote} from '../admin-foundation/local-stack.mjs';import {nextProbe} from '../admin-foundation/local-next-probe.mjs';import path from 'node:path';import {pathToFileURL} from 'node:url';
let stack,probe,browser;
before(async()=>{process.env.NODE_OPTIONS='--import="'+pathToFileURL(path.resolve('scripts/campaign-engine/public-editorial-fixture.mjs')).href+'"';process.env.QURBAN_PROTOTYPE='1';({stack}=setup());probe=await nextProbe(stack);browser=await chromium.launch({channel:'msedge',headless:true});});
after(async()=>{await browser?.close();await probe?.close();if(stack)cleanup();});
test('production form/context are no-store; prototype remains 404 even with its flag enabled',async()=>{
const r=await probe.request('/kempen/'+slug+'/daftar');assert.equal(r.status,200);assert.match(r.headers.get('cache-control'),/no-store/);assert(!r.text.includes('Pemohon Ujian Tempatan'));assert.equal((await probe.request('/__review/qurban')).status,404);
const c=await rpc(stack,'public_qurban_registration_context',undefined,{target_slug:slug});assert.equal(c.status,200);assert.equal(c.data.akad_reference,'local-review-only-v1');
});
test('production browser CTA, real submission and refreshed non-PII form',async()=>{
const page=await browser.newPage({viewport:{width:375,height:900}});await page.goto('http://localhost:3038/kempen/'+slug);await page.getByRole('link',{name:'Daftar Qurban / Aqiqah',exact:true}).click();
await page.getByLabel('Nama penuh',{exact:true}).fill('Pemohon Produksi Tempatan');await page.getByLabel('No. telefon',{exact:true}).fill('0123456789');await page.getByLabel('Alamat',{exact:true}).fill('Alamat Ujian');await page.getByRole('button',{name:'Seterusnya',exact:true}).click();
await page.getByLabel('Nama peserta',{exact:true}).fill('Peserta Produksi Tempatan');await page.getByLabel('Belum pasti',{exact:true}).check();await page.getByRole('button',{name:'Seterusnya',exact:true}).click();await page.getByLabel('Saya telah membaca dan bersetuju dengan akad/wakalah di atas.',{exact:true}).check();await page.getByRole('button',{name:'Semak pendaftaran',exact:true}).click();await page.getByRole('button',{name:'Hantar pendaftaran',exact:true}).click();await page.getByRole('heading',{name:'Pendaftaran berjaya',exact:true}).waitFor();
assert.equal(sql('select count(*) from private.qurban_registrations'),'1');assert.match(await page.locator('.qr-success').innerText(),/belum menempah bahagian/);
await page.reload();assert.equal(await page.getByLabel('Nama penuh',{exact:true}).inputValue(),'');assert.deepEqual(await page.evaluate(async()=>({local:localStorage.length,session:sessionStorage.length,indexedDB:(await indexedDB.databases()).length})),{local:0,session:0,indexedDB:0});await page.close();
});
test('private/denied registration pages are 404; expired stored open remains denied',async()=>{
sql("begin;alter table private.campaigns disable trigger campaign_row_guard;update private.campaigns set registration_closes_at=clock_timestamp()-interval '1 minute',registration_opens_at=clock_timestamp()-interval '1 day',version=version+1 where slug="+quote(slug)+";alter table private.campaigns enable trigger campaign_row_guard;commit;");
assert.equal((await probe.request('/kempen/'+slug+'/daftar')).status,404);const c=await rpc(stack,'public_qurban_registration_context',undefined,{target_slug:slug});assert.equal(c.data,null);
const fake={slug,campaign_version:1,global_flag_version:1,module_flag_version:1,akad_reference:'local-review-only-v1',akad_hash:'a'.repeat(64)};const r=await probe.request('/kempen/'+slug+'/daftar/hantar',{method:'POST',body:request(fake)});assert.equal(r.status,409);assert.deepEqual(JSON.parse(r.text),{error:'conflict'});
});
