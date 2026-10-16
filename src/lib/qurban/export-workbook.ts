// Imported by protected Node server export only; no browser import.
import ExcelJS from "exceljs";
import {registrationStatusLabels} from "./admin-presentation";
export type ExportRegistration={id:string;public_reference:string;applicant_name:string;phone:string;address:string;email:string|null;attendance:"yes"|"no"|"unsure";same_cattle_preference:boolean;status:"submitted"|"cancelled";participant_count:number;created_at:string;updated_at:string};
export type ExportParticipant={id:string;registration_id:string;participant_name:string;purpose:"qurban"|"aqiqah";created_at:string;cattle_number:number|null;slot_number:number|null};
export type ExportSnapshot={campaign:{id:string;title:string;campaign_year:number;hijri_display_label:string;currency:string;price_per_share_minor:number;cattle_count:number;shares_per_cattle:number};summary:{registrations:number;submitted:number;cancelled:number;participants:number;qurban:number;aqiqah:number};registrations:ExportRegistration[];participants:ExportParticipant[];allocation_summary:{initialized:boolean;capacity:number;allocated:number;empty:number};export_id:string;snapshot_hash:string;generated_at:string;generated_by:string};
const text=(v:unknown)=>String(v??"").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]/g,"");
const myt=(v:string)=>new Date(new Date(v).getTime()+8*60*60*1000);
const dateFormat='dd/mm/yyyy hh:mm:ss" MYT"';
export function exportFilename(s:ExportSnapshot){if(!Number.isInteger(s.campaign.campaign_year)||s.campaign.campaign_year<1900||s.campaign.campaign_year>9999||!/^[0-9a-f-]{36}$/.test(s.export_id))throw Error("Invalid export identity");return "Qurban-MTU-"+s.campaign.campaign_year+"-Export-"+myt(s.generated_at).toISOString().slice(0,19).replace("T","-").replaceAll(":","")+"-"+s.export_id+".xlsx";}
export async function buildQurbanWorkbook(s:ExportSnapshot):Promise<Uint8Array>{
 if(s.registrations.length>5000||s.participants.length>20000||s.registrations.length!==s.summary.registrations||s.participants.length!==s.summary.participants)throw Error("Invalid export bounds");
 const lookup=new Map(s.registrations.map(r=>[r.id,r]));if(lookup.size!==s.registrations.length||s.participants.some(p=>!lookup.has(p.registration_id)))throw Error("Invalid export relationships");
 const counts=new Map<string,number>();for(const p of s.participants)counts.set(p.registration_id,(counts.get(p.registration_id)??0)+1);
 if(new Set(s.participants.map(p=>p.id)).size!==s.participants.length||s.registrations.some(r=>(counts.get(r.id)??0)!==r.participant_count)||s.summary.submitted!==s.registrations.filter(r=>r.status==="submitted").length||s.summary.cancelled!==s.registrations.filter(r=>r.status==="cancelled").length||s.summary.qurban!==s.participants.filter(p=>p.purpose==="qurban").length||s.summary.aqiqah!==s.participants.filter(p=>p.purpose==="aqiqah").length)throw Error("Inconsistent export snapshot");
 const allocation=s.allocation_summary,assigned=s.participants.filter(p=>p.cattle_number!==null);
 if(!allocation||allocation.capacity!==(allocation.initialized?s.campaign.cattle_count*s.campaign.shares_per_cattle:0)||allocation.allocated!==assigned.length||allocation.empty!==allocation.capacity-allocation.allocated||allocation.empty<0
 ||s.participants.some(p=>(p.cattle_number===null)!==(p.slot_number===null)||p.cattle_number!==null&&(!Number.isInteger(p.cattle_number)||p.cattle_number<1||p.cattle_number>s.campaign.cattle_count||!Number.isInteger(p.slot_number)||p.slot_number!<1||p.slot_number!>s.campaign.shares_per_cattle))
 ||new Set(assigned.map(p=>p.cattle_number+":"+p.slot_number)).size!==assigned.length)throw Error("Inconsistent allocation snapshot");
 const active=s.participants.filter(p=>lookup.get(p.registration_id)!.status==="submitted"),cancelled=s.participants.length-active.length;
 const activeQurban=active.filter(p=>p.purpose==="qurban").length,activeAqiqah=active.length-activeQurban;
 const wb=new ExcelJS.Workbook();wb.creator="Masjid Talhah Bin Ubaidillah";wb.created=new Date(s.generated_at);
 const sheet=(name:string,headers:string[],widths:number[])=>{const ws=wb.addWorksheet(name,{views:[{state:"frozen",ySplit:1,showGridLines:false}],pageSetup:{orientation:headers.length>3?"landscape":"portrait",paperSize:9,fitToPage:true,fitToWidth:headers.length>10?2:1,fitToHeight:0}});ws.columns=headers.map((header,i)=>({header,width:widths[i]??22}));ws.getRow(1).font={name:"Arial",size:10,bold:true,color:{argb:"FFFFFFFF"}};ws.getRow(1).fill={type:"pattern",pattern:"solid",fgColor:{argb:"FF183A50"}};ws.getRow(1).alignment={vertical:"middle",wrapText:true};ws.getRow(1).height=32;ws.pageSetup.printTitlesRow="1:1";if(headers.length>10)ws.pageSetup.printTitlesColumn="A:B";return ws;};
 const summary=sheet("Ringkasan",["Perkara","Nilai"],[38,76]);
 const rows:[string,string|number|Date][]=[
 ["Kempen",text(s.campaign.title)],["Tahun kempen",s.campaign.campaign_year],["Label Hijri",text(s.campaign.hijri_display_label)],["Mata wang",text(s.campaign.currency)],
 ["Harga konfigurasi / bahagian",s.campaign.price_per_share_minor/100],["Bilangan lembu (konfigurasi)",s.campaign.cattle_count],["Bahagian / lembu (konfigurasi)",s.campaign.shares_per_cattle],
 ["Kapasiti teori sahaja",s.campaign.cattle_count*s.campaign.shares_per_cattle],["Jumlah pendaftaran",s.summary.registrations],["Pendaftaran dihantar — aktif",s.summary.submitted],["Pendaftaran dibatalkan",s.summary.cancelled],
 ["Jumlah peserta — semua rekod",s.summary.participants],["Peserta pendaftaran aktif",active.length],["Peserta pendaftaran dibatalkan",cancelled],
 ["Qurban — semua rekod",s.summary.qurban],["Aqiqah — semua rekod",s.summary.aqiqah],["Qurban — aktif",activeQurban],["Aqiqah — aktif",activeAqiqah],["Dijana pada (MYT)",myt(s.generated_at)],["Dijana oleh (rujukan actor)",text(s.generated_by)],
 ["Rujukan eksport",text(s.export_id)],["Nota","Snapshot sahaja. Aktif = pendaftaran dihantar; dibatalkan = sejarah dikekalkan. Pendaftaran tidak menempah kapasiti. Slot diperuntukkan menunjukkan susunan operasi; tiada maklumat bayaran."],["Kapasiti grid",allocation.capacity],["Slot diperuntukkan",allocation.allocated],["Slot kosong",allocation.empty]];
 rows.forEach(r=>summary.addRow(r));summary.getCell("B6").numFmt='"RM" #,##0.00';summary.getCell("B20").numFmt=dateFormat;
 const registrations=sheet("Pendaftaran",["Bil","No. Rujukan","Nama Pemohon","No. Telefon","Alamat","Email","Kehadiran","Permintaan Lembu Sama","Status","Bil. Peserta","Tarikh Daftar (MYT)","Tarikh Kemaskini (MYT)"],[7,28,24,18,32,26,14,19,14,12,24,24]);
 s.registrations.forEach((r,i)=>{const row=registrations.addRow([i+1,text(r.public_reference),text(r.applicant_name),text(r.phone),text(r.address),r.email===null?null:text(r.email),({yes:"Ya",no:"Tidak",unsure:"Belum pasti"})[r.attendance],r.same_cattle_preference?"Ya":"Tidak",registrationStatusLabels[r.status],r.participant_count,myt(r.created_at),myt(r.updated_at)]);row.getCell(11).numFmt=dateFormat;row.getCell(12).numFmt=dateFormat;});
 const participants=sheet("Peserta",["Bil","No. Rujukan","Nama Pemohon","Nama Peserta","Tujuan","Status Pendaftaran","Tarikh Daftar (MYT)","No. Lembu","No. Bahagian"],[7,32,28,30,16,22,24,13,15]);
 s.participants.forEach((p,i)=>{const r=lookup.get(p.registration_id)!;const row=participants.addRow([i+1,text(r.public_reference),text(r.applicant_name),text(p.participant_name),p.purpose==="qurban"?"Qurban":"Aqiqah",registrationStatusLabels[r.status],myt(p.created_at),p.cattle_number,p.slot_number]);row.getCell(7).numFmt=dateFormat;});
 // Pure projection of the one protected snapshot: configured empty slots require no further DB read.
 const cattle=sheet("Susunan Lembu",["Bahagian","Nama Peserta","Tujuan","No. Rujukan","Nama Pemohon","No. Telefon"],[11,28,14,34,28,19]);
 const cattleHeaders=cattle.getRow(1).values;
 cattle.getRow(1).values=["Susunan operasi allocation sahaja. Bukan bukti bayaran atau pengesahan pembayaran."];cattle.mergeCells("A1:F1");
 cattle.addRow([text(s.campaign.title)+" — "+s.campaign.campaign_year+(allocation.initialized?"":" — Grid belum disediakan; slot konfigurasi sahaja.")]);cattle.mergeCells("A2:F2");cattle.addRow(cattleHeaders);
 cattle.views=[{state:"frozen",ySplit:3,showGridLines:false}];cattle.pageSetup.printTitlesRow="1:3";
 cattle.pageSetup.margins={left:0.25,right:0.25,top:0.35,bottom:0.35,header:0.15,footer:0.15};
 const occupied=new Map(assigned.map(p=>[p.cattle_number+":"+p.slot_number,p]));const cattleHeadingRows:number[]=[];
 for(let number=1;number<=s.campaign.cattle_count;number++){
  if(number>1){const separator=cattle.addRow([]);separator.addPageBreak();}
  const heading=cattle.addRow(["LEMBU "+number]);cattle.mergeCells(heading.number,1,heading.number,6);cattleHeadingRows.push(heading.number);
  for(let slot=1;slot<=s.campaign.shares_per_cattle;slot++){
   const p=occupied.get(number+":"+slot),r=p?lookup.get(p.registration_id)!:null;
   cattle.addRow(p&&r?[slot,text(p.participant_name),p.purpose==="qurban"?"Qurban":"Aqiqah",text(r.public_reference),text(r.applicant_name),text(r.phone)]:[slot,"Kosong",null,null,null,null]);
  }
 }
 cattle.pageSetup.printArea="A1:F"+cattle.rowCount;
 const legacy=sheet("Format Audit - Legacy View",["Bil","No. Rujukan","Nama Peserta","Qurban/Aqiqah","No. Lembu","No. Bahagian","No. Telefon","Tarikh Bayaran","Catatan"],[7,32,30,18,13,15,20,20,18]);
 const compareText=(a:string,b:string)=>a<b?-1:a>b?1:0;
 const legacyParticipants=[...s.participants].sort((a,b)=>Number(a.cattle_number===null)-Number(b.cattle_number===null)||(a.cattle_number??0)-(b.cattle_number??0)||(a.slot_number??0)-(b.slot_number??0)||compareText(a.created_at,b.created_at)||compareText(a.id,b.id));
 legacyParticipants.forEach((p,i)=>{const r=lookup.get(p.registration_id)!;legacy.addRow([i+1,text(r.public_reference),text(p.participant_name),p.purpose==="qurban"?"Qurban":"Aqiqah",p.cattle_number,p.slot_number,text(r.phone),null,r.status==="cancelled"?registrationStatusLabels.cancelled:null]);});
 for(const ws of wb.worksheets){if(ws!==summary&&ws!==cattle)ws.autoFilter={from:{row:1,column:1},to:{row:Math.max(1,ws.rowCount),column:ws.columnCount}};ws.eachRow((row,n)=>{if(n>1){row.alignment={vertical:"top",wrapText:true};let lines=1;row.eachCell((cell,col)=>{cell.font={name:"Arial",size:10};if(typeof cell.value==="string")cell.numFmt="@";const value=cell.value instanceof Date?"00/00/0000 00:00:00 MYT":String(cell.value??"");const width=Math.max(5,(ws.getColumn(col).width??22)-2);lines=Math.max(lines,...value.split("\n").map(v=>Math.max(1,Math.ceil(v.length/width))));});row.height=Math.min(409,Math.max(18,lines*14+4));}});}
 // Restore identifying block styles after common text/wrapping rules; never create formula cells.
 cattle.getRow(1).height=30;cattle.getRow(1).font={name:"Arial",size:11,bold:true,color:{argb:"FF183A50"}};cattle.getRow(1).fill={type:"pattern",pattern:"solid",fgColor:{argb:"FFE8EEF2"}};
 cattle.getRow(2).height=30;
 cattle.getRow(3).height=28;cattle.getRow(3).font={name:"Arial",size:10,bold:true,color:{argb:"FFFFFFFF"}};cattle.getRow(3).fill={type:"pattern",pattern:"solid",fgColor:{argb:"FF183A50"}};
 for(const n of cattleHeadingRows){cattle.getRow(n).height=24;cattle.getRow(n).font={name:"Arial",size:11,bold:true};cattle.getRow(n).fill={type:"pattern",pattern:"solid",fgColor:{argb:"FFE8EEF2"}};}
 return new Uint8Array(await wb.xlsx.writeBuffer());
}

export async function generateQurbanExport(s:ExportSnapshot,complete:(reference:string,hash:string)=>Promise<void>){
 const bytes=await buildQurbanWorkbook(s),filename=exportFilename(s);
 await complete(s.export_id,s.snapshot_hash);
 return {bytes,filename};
}
