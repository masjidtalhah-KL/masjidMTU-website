import test,{before,after} from 'node:test';import assert from 'node:assert/strict';import {mkdirSync} from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';
import {chromium} from '@playwright/test';import ExcelJS from 'exceljs';
import {setup,cleanup,inspect} from '../qurban-registration/review-fixture.mjs';
import {request,slug} from '../qurban-registration/fixtures.mjs';
import {rpc,sql,rows,quote,signedToken,dbContainer} from '../admin-foundation/local-stack.mjs';
import {nextProbe} from '../admin-foundation/local-next-probe.mjs';import {spawn} from 'node:child_process';
let stack,users,campaign,probe,browser,reg,other,reference,original,created=false;
const origin='http://localhost:3038';
const token=(name='admin',options)=>signedToken(stack,users[name],options);
const call=(name,fn,args={})=>rpc(stack,fn,name?token(name):undefined,args);
const detail=(name='admin',id=reg)=>call(name,'admin_qurban_detail',{target_campaign:campaign,target_registration:id});
const listOptions={page:1,page_size:20,search:'',status:'all',purpose:'all',sort:'newest'};
const cookie=t=>{const c=JSON.parse(Buffer.from(t.split('.')[1],'base64url'));return 'base64-'+Buffer.from(JSON.stringify({access_token:t,refresh_token:'synthetic-local-no-refresh',token_type:'bearer',expires_in:3600,expires_at:c.exp,user:{id:c.sub,email:c.email}})).toString('base64url');};
async function pageFor(name='admin',width=1440){const context=await browser.newContext({viewport:{width,height:1000}});await context.addCookies([{name:'sb-127-auth-token',value:cookie(token(name)),url:origin+'/admin',sameSite:'Lax',httpOnly:true}]);return {context,page:await context.newPage()};}
async function http(route,{name='admin',body,headers={},method='POST'}={}){const r=await fetch(origin+route,{method,redirect:'manual',headers:{Cookie:'sb-127-auth-token='+cookie(token(name)),Origin:origin,'Content-Type':'application/json',...headers},...(body===undefined?{}:{body:JSON.stringify(body)})});return {status:r.status,headers:r.headers,bytes:new Uint8Array(await r.arrayBuffer())};}
before(async()=>{
 ({stack,users,campaign}=setup());created=true;
 const c=await rpc(stack,'public_qurban_registration_context',undefined,{target_slug:slug});assert.equal(c.status,200);
 const p=request(c.data,4);p.applicant.name='=SUM(1,1)';p.applicant.email='private-fixture@example.test';p.applicant.address='PRIVATE ADDRESS UJIAN 83';p.participants.forEach((x,i)=>x.name=['=SUM(1,1)','+Ujian','-Ujian','@Ujian'][i]);
 const a=await rpc(stack,'public_qurban_registration_submit',undefined,{payload:p});assert.equal(a.status,200);reference=a.data.reference;
 reg=rows('select id from private.qurban_registrations where public_reference='+quote(reference))[0].id;
 const b=await rpc(stack,'public_qurban_registration_submit',undefined,{payload:request(c.data,1)});assert.equal(b.status,200);other=rows('select id from private.qurban_registrations where public_reference='+quote(b.data.reference))[0].id;
 original=sql('select to_jsonb(t) from private.qurban_consent_acceptances t where registration_id='+quote(reg));
 process.env.NODE_OPTIONS='--import="'+pathToFileURL(path.resolve('scripts/campaign-engine/public-editorial-fixture.mjs')).href+'"';process.env.QURBAN_PROTOTYPE='1';
 probe=await nextProbe(stack);browser=await chromium.launch({channel:'msedge',headless:true});mkdirSync('.cache/qurban-83',{recursive:true});
});
after(async()=>{await browser?.close();await probe?.close();if(created){cleanup();cleanup();const c=inspect();for(const k of ['campaigns','flags','registrations','participations','akad_versions','consents','audit','idempotency','auth_fixture_users'])assert.equal(Number(c[k]),0);assert.equal(sql('select count(*) from private.qurban_operational_audit'),'0');assert.equal(sql('select count(*) from private.qurban_export_requests'),'0');}});
for(const name of [null,'outsider','disabled','revoked'])test('real unauthorized denied '+name,async()=>{assert([401,403].includes((await call(name,'admin_qurban_list',{target_campaign:campaign,options:listOptions})).status));});
test('real staff projection and raw/Data API boundary',async()=>{
 const r=await detail('staff');assert.equal(r.status,200);for(const key of ['address','email','consent','submission_configuration'])assert(!Object.hasOwn(r.data,key));
 assert(!JSON.stringify(r.data).includes('PRIVATE ADDRESS'));assert.equal((await call('staff','admin_qurban_activity',{target_campaign:campaign,page_number:1})).status,403);
 for(const table of ['qurban_registrations','qurban_participations','qurban_operational_audit','qurban_export_requests'])for(const role of ['anon','authenticated','service_role','supabase_auth_admin','authenticator','campaign_scheduler'])assert.throws(()=>sql('begin;set local role '+role+';select * from private.'+table+';rollback;'),/permission denied/);
});
test('real staff amendment/cancel/export denied at RPC and HTTP',async()=>{
 const d=(await detail()).data;
 assert.equal((await call('staff','admin_qurban_cancel',{target_campaign:campaign,target_registration:reg,expected_version:d.version,reason:'entry_error'})).status,403);
 assert.equal((await call('staff','admin_qurban_export_snapshot',{target_campaign:campaign})).status,403);
 assert.equal((await call('staff','admin_qurban_amend',{target_campaign:campaign,target_registration:reg,payload:{kind:'registration',expected_version:d.version,changes:{}}})).status,403);
 assert.equal((await http('/admin/api/campaigns/'+campaign+'/qurban/export',{name:'staff',body:{}})).status,403);
});
test('real strict HTTP shape, origin, body and content-type defense',async()=>{
 const base='/admin/api/campaigns/'+campaign+'/qurban';
 assert.equal((await http(base+'/export',{body:{},headers:{Origin:'https://invalid.example'}})).status,403);
 assert.equal((await http(base+'/export',{body:{},headers:{'Content-Type':'text/plain'}})).status,422);
 assert.equal((await http(base+'/export',{body:{extra:true}})).status,422);
 assert.equal((await http(base+'/registrations/'+reg,{body:{data:'x'.repeat(9000)}})).status,422);
});
for(const width of [375,430,768,1440])test('real responsive admin list/detail '+width,async()=>{
 const {page,context}=await pageFor('admin',width);try{
 await page.goto(origin+'/admin/campaigns/'+campaign);await page.getByRole('link',{name:'Buka pengurusan Qurban',exact:true}).click();
 await page.getByRole("heading",{name:"Pendaftaran",exact:true}).waitFor();assert.equal(await page.getByRole("button",{name:"Salin rujukan "+reference,exact:true}).count(),1);assert.match(await page.locator(".qa-table .qa-reference").first().innerText(),/QBN-.+…/);assert.equal(await page.locator(".qa-table").getByText("Dihantar",{exact:true}).count(),2);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.screenshot({path:'.cache/qurban-83/admin-list-'+width+'.png',fullPage:true});
 await page.getByRole('button',{name:'Buka '+reference,exact:true}).click();await page.getByRole('heading',{name:'Butiran pendaftaran',exact:true}).waitFor();
 assert.equal(await page.locator(".qa-detail strong").first().innerText(),"Dihantar");assert.equal(await page.locator(".qa-detail .qa-reference").first().innerText(),reference);assert.equal(await page.getByLabel("Nama peserta",{exact:true}).count(),4);assert.equal(await page.locator('b').filter({hasText:'Ujian'}).count(),0);
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:'.cache/qurban-83/admin-detail-'+width+'.png',fullPage:true});
 }finally{await context.close();}
});
test('real browser staff gets masked read-only content and no export/audit controls',async()=>{
 const {page,context}=await pageFor('staff',375);try{await page.goto(origin+'/admin/campaigns/'+campaign+'/qurban');await page.getByRole('button',{name:'Buka '+reference,exact:true}).click();await page.getByRole('heading',{name:'Butiran pendaftaran',exact:true}).waitFor();
 assert.equal(await page.getByLabel('Alamat',{exact:true}).count(),0);assert.equal(await page.getByRole('button',{name:'Export',exact:true}).count(),0);assert.equal(await page.getByRole('button',{name:'Aktiviti',exact:true}).count(),0);assert.equal(await page.getByRole('button',{name:'Simpan peserta',exact:true}).count(),0);
 assert(!(await page.locator('body').innerText()).includes('PRIVATE ADDRESS'));await page.screenshot({path:'.cache/qurban-83/staff-375.png',fullPage:true});
 }finally{await context.close();}
});
test('real browser contact/participant correction + stale second session; original acceptance and quote unchanged',async()=>{
 const a=await pageFor(),b=await pageFor();try{
 for(const p of [a.page,b.page]){await p.goto(origin+'/admin/campaigns/'+campaign+'/qurban');await p.getByRole('button',{name:'Buka '+reference,exact:true}).click();await p.getByLabel('Nama pemohon',{exact:true}).waitFor();}
 await a.page.getByLabel('Nama pemohon',{exact:true}).fill('Pemohon Ujian Dipinda');await a.page.getByRole('button',{name:'Simpan maklumat pemohon',exact:true}).click();await a.page.getByRole('status').filter({hasText:'Perubahan disimpan'}).waitFor();
 await b.page.getByLabel('Nama pemohon',{exact:true}).fill('Stale Overwrite');await b.page.getByRole('button',{name:'Simpan maklumat pemohon',exact:true}).click();await b.page.getByRole('status').filter({hasText:'Rekod telah berubah'}).waitFor();
 const card=a.page.locator('.qa-participant').first();await card.getByLabel('Nama peserta',{exact:true}).fill('<b>Peserta Dibetulkan</b>');await card.getByLabel('Tujuan',{exact:true}).selectOption('aqiqah');await card.getByRole('button',{name:'Simpan peserta',exact:true}).click();
 await a.page.getByText('Peserta semasa berbeza daripada snapshot akad asal.',{exact:false}).waitFor();
 const d=(await detail()).data;assert.equal(d.quote.total_minor,49380);assert.equal(d.participants[0].purpose,'aqiqah');assert.equal(sql('select to_jsonb(t) from private.qurban_consent_acceptances t where registration_id='+quote(reg)),original);
 assert.equal(await a.page.locator('.qa-participant b').count(),0);
 }finally{await a.context.close();await b.context.close();}
});
test('real cancellation keeps history and is terminal',async()=>{
 const d=(await detail('admin',other)).data;const {page,context}=await pageFor('admin',375);try{await page.goto(origin+'/admin/campaigns/'+campaign+'/qurban');await page.getByRole('button',{name:'Buka '+d.public_reference,exact:true}).click();await page.getByLabel('Sebab pembatalan',{exact:true}).selectOption('applicant_request');await page.getByRole('button',{name:'Batalkan pendaftaran',exact:true}).click();await page.getByRole('status').filter({hasText:'Pendaftaran dibatalkan'}).waitFor();assert.equal(await page.locator(".qa-detail strong").first().innerText(),"Dibatalkan");await page.screenshot({path:".cache/qurban-83/cancelled-375.png",fullPage:true});}finally{await context.close();}
 assert.equal((await call('admin','admin_qurban_cancel',{target_campaign:campaign,target_registration:other,expected_version:d.version+1,reason:'applicant_request'})).status,409);
 const r=(await detail('admin',other)).data;assert.equal(r.status,'cancelled');assert.equal(r.participants.length,1);
});
test('real Excel HTTP download and browser download: same snapshot counts, private headers, inert values, completed audit',async()=>{
 const r=await http('/admin/api/campaigns/'+campaign+'/qurban/export',{body:{}});assert.equal(r.status,200);assert.match(r.headers.get('content-type'),/spreadsheetml/);assert.match(r.headers.get('cache-control'),/private, no-store/);const w=new ExcelJS.Workbook();await w.xlsx.load(Buffer.from(r.bytes));
 assert.deepEqual(w.worksheets.map(s=>s.name),['Ringkasan','Pendaftaran','Peserta','Sukarelawan','Susunan Lembu','Bayaran','Format Audit - Legacy View']);assert.equal(w.getWorksheet('Pendaftaran').rowCount,3);assert.equal(w.getWorksheet('Peserta').rowCount,6);assert.equal(w.getWorksheet("Ringkasan").getCell("B12").value,1);for(const [cell,n]of Object.entries({B13:5,B14:4,B15:1,B16:3,B17:2,B18:2,B19:2}))assert.equal(w.getWorksheet("Ringkasan").getCell(cell).value,n);assert.equal(w.getWorksheet("Pendaftaran").getCell("I2").value,"Dihantar");assert.equal(w.getWorksheet("Pendaftaran").getCell("I3").value,"Dibatalkan");assert.equal(w.getWorksheet("Format Audit - Legacy View").getCell("I6").value,"Dibatalkan");
 assert.equal(w.getWorksheet('Peserta').getCell('D3').type,ExcelJS.ValueType.String);
 const {page,context}=await pageFor();try{await page.goto(origin+'/admin/campaigns/'+campaign+'/qurban');await page.getByRole('button',{name:'Export',exact:true}).click();const download=page.waitForEvent('download');await page.getByRole('button',{name:'Muat turun Excel (.xlsx)',exact:true}).click();const file=await download;assert.match(file.suggestedFilename(),/^Qurban-MTU-2044-Export-/);await file.saveAs('.cache/qurban-83/admin-live-export.xlsx');for(const width of [375,1440]){await page.setViewportSize({width,height:1000});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:'.cache/qurban-83/export-'+width+'.png',fullPage:true});}}finally{await context.close();}
 assert.equal(sql("select count(*) from private.qurban_operational_audit where action='qurban.export.xlsx'"),'2');
 assert.equal(sql('select count(*) from private.qurban_export_requests where completed_at is not null'),'2');
});
test('real audit contains structural facts only; full activity admin only',async()=>{
 const r=await call('admin','admin_qurban_activity',{target_campaign:campaign,page_number:1});assert.equal(r.status,200);assert(r.data.items.some(a=>a.action==='registration.amended'));assert(r.data.items.some(a=>a.action==='participation.amended'));assert(r.data.items.some(a=>a.action==='registration.cancelled'));
 for(const value of ['PRIVATE ADDRESS','private-fixture@example.test','0123456789','Pemohon Ujian Dipinda','<b>Peserta'])assert(!JSON.stringify(r.data).includes(value));const {page,context}=await pageFor();try{await page.goto(origin+'/admin/campaigns/'+campaign+'/qurban');await page.getByRole('button',{name:'Aktiviti',exact:true}).click();await page.getByRole('heading',{name:'Aktiviti Qurban',exact:true}).waitFor();for(const width of [375,1440]){await page.setViewportSize({width,height:1000});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:'.cache/qurban-83/activity-'+width+'.png',fullPage:true});}}finally{await context.close();}
});

test('real masked read holds actor SHARE lock against concurrent role change',async()=>{
 const claims=JSON.parse(Buffer.from(token().split('.')[1],'base64url')),label='qurban-83-read-lock';
 const child=spawn('docker',['exec','-i',dbContainer,'psql','-U','postgres','-d','postgres','-Atq','-v','ON_ERROR_STOP=1'],{stdio:['pipe','ignore','pipe'],windowsHide:true});let error='';child.stderr.on('data',b=>error+=b);
 const finished=new Promise(resolve=>child.on('exit',resolve));
 child.stdin.end("begin;select set_config('application_name',"+quote(label)+",true);select set_config('request.jwt.claims',"+quote(JSON.stringify(claims))+",true);select public.admin_qurban_detail("+quote(campaign)+","+quote(reg)+");select pg_sleep(3);rollback;");
 try{
 const deadline=Date.now()+5000;while(sql("select count(*) from pg_stat_activity where application_name="+quote(label)+" and wait_event='PgSleep'")!=='1'){if(Date.now()>deadline)throw Error('Read lock probe unavailable');await new Promise(r=>setTimeout(r,50));}
 assert.throws(()=>sql("begin;set local lock_timeout='100ms';update public.admin_profiles set role=role where user_id="+quote(users.admin.id)+";rollback;"),/lock timeout/);
 }finally{assert.equal(await finished,0,error);}
});

test("compact list reference copies full reference by keyboard with no database or network mutation",async()=>{
 const {page,context}=await pageFor("admin",375);try{await context.grantPermissions(["clipboard-read","clipboard-write"],{origin});await page.goto(origin+"/admin/campaigns/"+campaign+"/qurban");const button=page.getByRole("button",{name:"Salin rujukan "+reference,exact:true});await button.waitFor();await page.waitForLoadState("networkidle");const previous=sql("select version from private.qurban_registrations where id="+quote(reg));let requests=0;page.on("request",r=>{if(r.url().includes("/admin/api/"))requests++;});assert.equal(await page.locator(".qa-table .qa-sr").filter({hasText:reference}).count(),1);await button.focus();await page.keyboard.press("Enter");await page.getByRole("status").filter({hasText:"No. rujukan penuh disalin."}).waitFor();assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),reference);assert.equal(requests,0);assert.equal(sql("select version from private.qurban_registrations where id="+quote(reg)),previous);assert(!page.url().includes(reference));}finally{await context.close();}
});
