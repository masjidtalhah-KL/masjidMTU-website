import test from 'node:test';import assert from 'node:assert/strict';import ExcelJS from 'exceljs';import JSZip from 'jszip';import {mkdirSync,writeFileSync} from 'node:fs';
import {buildQurbanWorkbook,generateQurbanExport,exportFilename,type ExportSnapshot} from '../../src/lib/qurban/export-workbook';
const date='2026-10-15T14:00:00.000Z',r1='11111111-1111-4111-8111-111111111111',r2='22222222-2222-4222-8222-222222222222';
export const snapshot:ExportSnapshot={volunteers:[],payments:[],campaign:{id:r1,title:'UJIAN TEMPATAN — Excel Audit',campaign_year:2044,hijri_display_label:'Label rekaan ujian',currency:'MYR',price_per_share_minor:12345,cattle_count:3,shares_per_cattle:5},summary:{registrations:2,submitted:1,cancelled:1,participants:4,qurban:2,aqiqah:2},
 registrations:[{id:r1,public_reference:'QBN-'+'1'.repeat(64),applicant_name:'=SUM(1,1)',phone:'+60123456789',address:'Alamat rekaan\nBaris kedua',email:'dummy@example.test',attendance:'yes',same_cattle_preference:true,status:'submitted',participant_count:3,created_at:date,updated_at:date},{id:r2,public_reference:'QBN-'+'2'.repeat(64),applicant_name:'@Pemohon',phone:'0123456789',address:'Alamat rekaan lain',email:null,attendance:'unsure',same_cattle_preference:false,status:'cancelled',participant_count:1,created_at:date,updated_at:date}],
 participants:['=SUM(1,1)','+Peserta','-Peserta','@Peserta'].map((name,i)=>({id:String(i),registration_id:i<3?r1:r2,participant_name:name,purpose:i%2?'aqiqah':'qurban',created_at:date,cattle_number:null,slot_number:null})),
 allocation_summary:{initialized:false,capacity:0,allocated:0,empty:0},export_id:'33333333-3333-4333-8333-333333333333',snapshot_hash:'f'.repeat(64),generated_at:date,generated_by:r1};
let bytes:Uint8Array,wb:ExcelJS.Workbook;
test('genuine Office Open XML workbook saved as review artifact',async()=>{
 bytes=await buildQurbanWorkbook(snapshot);assert.equal(Buffer.from(bytes).subarray(0,2).toString(),'PK');
 const zip=await JSZip.loadAsync(bytes);for(const file of ['[Content_Types].xml','xl/workbook.xml','xl/worksheets/sheet1.xml'])assert(zip.file(file));
 mkdirSync('.cache/qurban-83',{recursive:true});writeFileSync('.cache/qurban-83/'+exportFilename(snapshot),bytes);
 wb=new ExcelJS.Workbook();await wb.xlsx.load(bytes.buffer as ArrayBuffer);
 assert.deepEqual(wb.worksheets.map(w=>w.name),['Ringkasan','Pendaftaran','Peserta','Sukarelawan','Susunan Lembu','Bayaran','Format Audit - Legacy View']);
});
test('summary counts, configuration and exact displayed price reconcile',()=>{
 const s=wb.getWorksheet('Ringkasan')!;assert.equal(s.getCell('B3').value,2044);assert.equal(s.getCell('B6').value,123.45);assert.equal(s.getCell('B9').value,15);
 for(const [cell,n]of Object.entries({B10:2,B11:1,B12:1,B13:4,B14:3,B15:1,B16:2,B17:2,B18:2,B19:1}))assert.equal(s.getCell(cell).value,n);assert.match(s.getCell("B6").numFmt,/0.00/);
 const labels=["Jumlah peserta — semua rekod","Peserta pendaftaran aktif","Peserta pendaftaran dibatalkan","Qurban — semua rekod","Aqiqah — semua rekod","Qurban — aktif","Aqiqah — aktif"];for(let i=0;i<labels.length;i++)assert.equal(s.getCell("A"+(i+13)).value,labels[i]);
 assert.equal(Number(s.getCell("B14").value)+Number(s.getCell("B15").value),s.getCell("B13").value);assert.equal(Number(s.getCell("B18").value)+Number(s.getCell("B19").value),s.getCell("B14").value);assert(s.getCell("B20").value instanceof Date);
});
test('registration and participant row counts, relationships and cancellation retained',()=>{
 const r=wb.getWorksheet('Pendaftaran')!,p=wb.getWorksheet('Peserta')!;assert.equal(r.rowCount,3);assert.equal(p.rowCount,5);assert.equal(r.getCell("I3").value,"Dibatalkan");assert.equal(r.getCell("I2").value,"Dihantar");
 for(let n=2;n<=5;n++)assert.equal(p.getCell('B'+n).value,snapshot.registrations[n<5?0:1].public_reference);
 assert.equal(p.getCell('F5').value,'Dibatalkan');assert.equal(r.getCell('D2').value,'+60123456789');
});
test('legacy view has no invented allocation/payment and controlled cancellation note',()=>{
 const s=wb.getWorksheet('Format Audit - Legacy View')!;for(let n=2;n<=5;n++)for(const col of ['E','F','H'])assert.equal(s.getCell(col+n).value??'','');
 assert.equal(s.getCell('I5').value,'Dibatalkan');assert.equal(s.getCell('I2').value??'','');
});
test('formula-leading values are inert typed text, never OOXML formulas',async()=>{
 const p=wb.getWorksheet('Peserta')!;for(let i=0;i<4;i++){const cell=p.getCell('D'+(i+2));assert.equal(cell.type,ExcelJS.ValueType.String);assert.equal(cell.value,snapshot.participants[i].participant_name);}
 const zip=await JSZip.loadAsync(bytes);for(const f of Object.keys(zip.files).filter(f=>/^xl\/worksheets\/sheet\d+.xml$/.test(f)))assert(!/<f(?: |>)/.test(await zip.file(f)!.async('string')));
 const control=structuredClone(snapshot);control.participants[0].participant_name='\t=SUM(2,2)';const b=await buildQurbanWorkbook(control),w=new ExcelJS.Workbook();await w.xlsx.load(b.buffer as ArrayBuffer);assert.equal(w.getWorksheet('Peserta')!.getCell('D2').type,ExcelJS.ValueType.String);
});
test('frozen bold headers, filters, widths, dates, print titles and landscape preserved',()=>{
 for(const w of wb.worksheets){assert.equal(w.views[0].state,'frozen');assert.equal(w.getRow(1).font.bold,true);assert.equal(w.pageSetup.printTitlesRow,w.name==='Susunan Lembu'?'1:3':'1:1');assert(w.getColumn(2).width!>20);if(w.name!=='Ringkasan'){if(w.name!=='Susunan Lembu')assert(w.autoFilter);assert.equal(w.pageSetup.orientation,'landscape');}}
 assert(wb.getWorksheet('Pendaftaran')!.getCell('K2').value instanceof Date);assert.match(wb.getWorksheet('Pendaftaran')!.getCell('K2').numFmt,/MYT/);
});
test('filename cannot include user title/path, repeat exports are unique by reference',()=>{
 const name=exportFilename(snapshot);assert.match(name,/^Qurban-MTU-2044-Export-2026-10-15-220000-[0-9a-f-]+\.xlsx$/);assert(!name.includes('SUM'));
 assert.throws(()=>exportFilename({...snapshot,export_id:'../../escape'}));
});
test('incoherent/oversized snapshot fails before any completed export',async()=>{
 await assert.rejects(buildQurbanWorkbook({...snapshot,summary:{...snapshot.summary,participants:9}}));
 await assert.rejects(buildQurbanWorkbook({...snapshot,participants:snapshot.participants.map(p=>({...p,registration_id:'unknown'}))}));
 await assert.rejects(buildQurbanWorkbook({...snapshot,summary:{...snapshot.summary,qurban:9}}));
});

test('completed export callback only after actual serialization succeeds; completion failure withholds output',async()=>{
 let completed=0;
 const invalid={...snapshot,summary:{...snapshot.summary,participants:99}};
 await assert.rejects(generateQurbanExport(invalid,async()=>{completed++;}));assert.equal(completed,0);
 const good=await generateQurbanExport(snapshot,async(id,hash)=>{assert.equal(id,snapshot.export_id);assert.equal(hash,snapshot.snapshot_hash);completed++;});assert(good.bytes.length>0);assert.equal(completed,1);
 await assert.rejects(generateQurbanExport(snapshot,async()=>{throw Error('Audit unavailable');}),/Audit unavailable/);
});
test('phone plus/leading zero preserved in actual text cells; no receipt sheet; intake sheet is explicit',()=>{
 const r=wb.getWorksheet('Pendaftaran')!;assert.equal(r.getCell('D2').value,'+60123456789');assert.equal(r.getCell('D3').value,'0123456789');assert.equal(r.getCell('D2').type,ExcelJS.ValueType.String);assert.equal(r.getCell('D3').numFmt,'@');
 assert(!wb.worksheets.some(s=>['Resit'].includes(s.name)));
});

test("summary retains cancelled participants as historical records; all-cancelled and empty snapshots reconcile",async()=>{
 const all=structuredClone(snapshot);all.registrations.forEach(r=>r.status="cancelled");all.summary.submitted=0;all.summary.cancelled=2;const w=new ExcelJS.Workbook();await w.xlsx.load((await buildQurbanWorkbook(all)).buffer as ArrayBuffer);const s=w.getWorksheet("Ringkasan")!;for(const [cell,n]of Object.entries({B13:4,B14:0,B15:4,B16:2,B17:2,B18:0,B19:0}))assert.equal(s.getCell(cell).value,n);
 const empty={...snapshot,registrations:[],participants:[],summary:{registrations:0,submitted:0,cancelled:0,participants:0,qurban:0,aqiqah:0}};const e=new ExcelJS.Workbook();await e.xlsx.load((await buildQurbanWorkbook(empty)).buffer as ArrayBuffer);for(let n=10;n<=19;n++)assert.equal(e.getWorksheet("Ringkasan")!.getCell("B"+n).value,0);
});
