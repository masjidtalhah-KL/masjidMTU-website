// Server-side template only: no user HTML, network resource or proof-file rendering.
import {PDFDocument,rgb,type PDFFont,type PDFPage} from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import {readFile} from "node:fs/promises";
import path from "node:path";
export const RECEIPT_NOTE="Maklumat lembu/bahagian adalah susunan pada waktu resit dikeluarkan dan tertakluk kepada perubahan";
export type ReceiptSnapshot={receipt_number:string;campaign_year:number;campaign_title:string;reference:string;applicant_name:string;currency:"MYR";amount_minor:number;price_per_share_minor:number;payment_method:"bank_transfer";payment_date:string;issued_at:string;participants:{participation_id:string;participant_name:string;purpose:"qurban"|"aqiqah";cattle_number:number;slot_number:number}[]};
export function receiptSnapshot(value:unknown):ReceiptSnapshot{
 const s=value as ReceiptSnapshot;
 if(!s||typeof s!=="object"||Object.keys(s).sort().join()!=="amount_minor,applicant_name,campaign_title,campaign_year,currency,issued_at,participants,payment_date,payment_method,price_per_share_minor,receipt_number,reference"||!/^QUR-[0-9]{4}-[0-9]{6}$/.test(s.receipt_number)||!/^QBN-[0-9a-f]{64}$/.test(s.reference)||s.currency!=="MYR"||s.payment_method!=="bank_transfer"||!Number.isSafeInteger(s.amount_minor)||s.amount_minor<1||s.amount_minor>100000000000||!Number.isSafeInteger(s.price_per_share_minor)||s.price_per_share_minor<1||s.price_per_share_minor>1000000000||!Number.isInteger(s.campaign_year)||s.receipt_number.slice(4,8)!==String(s.campaign_year)||typeof s.campaign_title!=="string"||s.campaign_title.length<1||[...s.campaign_title].length>180||typeof s.applicant_name!=="string"||s.applicant_name.length<1||[...s.applicant_name].length>160||(!/^\d{4}-\d{2}-\d{2}$/.test(s.payment_date)||!Number.isFinite(Date.parse(s.payment_date))||new Date(s.payment_date).toISOString().slice(0,10)!==s.payment_date)||!Number.isFinite(Date.parse(s.issued_at))||!Array.isArray(s.participants)||s.participants.length<1||s.participants.length>100)throw Error("Invalid immutable receipt snapshot");
 for(const p of s.participants)if(!p||Object.keys(p).sort().join()!=="cattle_number,participant_name,participation_id,purpose,slot_number"||!/^[0-9a-f-]{36}$/.test(p.participation_id)||typeof p.participant_name!=="string"||p.participant_name.length<1||[...p.participant_name].length>160||!["qurban","aqiqah"].includes(p.purpose)||!Number.isInteger(p.cattle_number)||p.cattle_number<1||!Number.isInteger(p.slot_number)||p.slot_number<1)throw Error("Invalid receipt participation");
 if(BigInt(s.price_per_share_minor)*BigInt(s.participants.length)!==BigInt(s.amount_minor))throw Error("Invalid immutable receipt quote");
 if(new Set(s.participants.map(p=>p.participation_id)).size!==s.participants.length||new Set(s.participants.map(p=>p.cattle_number+":"+p.slot_number)).size!==s.participants.length)throw Error("Invalid receipt relationships");return s;
}
// Format integer minor units without floating-point division/rounding.
export function receiptMoney(minor:number):string {
 if(!Number.isSafeInteger(minor)||minor<0)throw Error("Invalid receipt money");
 const n=BigInt(minor);return (n/BigInt(100)).toString().replace(/\B(?=(\d{3})+(?!\d))/g,",")+"."+(n%BigInt(100)).toString().padStart(2,"0");
}
export async function buildReceiptPdf(value:unknown):Promise<Uint8Array>{
 const s=receiptSnapshot(value),doc=await PDFDocument.create();doc.registerFontkit(fontkit);
 const assets=path.join(process.cwd(),"src/assets/receipt");
 const [regularBytes,boldBytes,logoBytes]=await Promise.all([
  readFile(path.join(assets,"NotoSans-Regular.ttf")),readFile(path.join(assets,"NotoSans-Bold.ttf")),
  readFile(path.join(process.cwd(),"public/brand/logo-masjid.png"))]);
 const font=await doc.embedFont(regularBytes,{subset:true}),bold=await doc.embedFont(boldBytes,{subset:true}),logo=await doc.embedPng(logoBytes);
 const supported=new Set(font.getCharacterSet()),safe=(v:string)=>Array.from(v).map(c=>supported.has(c.codePointAt(0)!)?c:"[U+"+c.codePointAt(0)!.toString(16).toUpperCase()+"]").join("");
 doc.setTitle("Resit Bayaran Qurban / Aqiqah "+s.receipt_number);doc.setAuthor("Masjid Talhah Bin Ubaidillah");doc.setCreator("Masjid Talhah native receipt template v2");doc.setLanguage("ms-MY");
 doc.setCreationDate(new Date(s.issued_at));doc.setModificationDate(new Date(s.issued_at));
 const blue=rgb(37/255,78/255,138/255),ink=rgb(.13,.18,.25),muted=rgb(.35,.40,.47),border=rgb(.74,.80,.87),pale=rgb(.94,.96,.98);
 const margin=42,right=553.28,width=right-margin,bottom=64;
 let page!:PDFPage,y=0;
 const lines=(value:string,max:number,size:number,f:PDFFont=font)=>{
  const result:string[]=[];let line="";
  for(const word of safe(value).split(/\s+/)){
   if(line&&f.widthOfTextAtSize(line+" "+word,size)<=max){line+=" "+word;continue;}
   if(line){result.push(line);line="";}
   for(const char of Array.from(word)){if(f.widthOfTextAtSize(line+char,size)>max&&line){result.push(line);line="";}line+=char;}
  }
  if(line)result.push(line);return result.length?result:[""];
 };
 const draw=(text:string,x:number,yy:number,size=10,f:PDFFont=font,color=ink)=>page.drawText(safe(text),{x,y:yy,size,font:f,color});
 const rule=(yy:number,color=border,thickness=.6)=>page.drawLine({start:{x:margin,y:yy},end:{x:right,y:yy},color,thickness});
 const newPage=(first=false)=>{
  page=doc.addPage([595.28,841.89]);
  if(first){
   // Pale native geometry in the outer upper-right corner, clear of all text.
   for(let i=0;i<3;i++){
    const x=574-i*13,yy=824-i*13;
    page.drawLine({start:{x:x-35,y:yy},end:{x,y:yy-35},color:rgb(.92,.94,.96),thickness:7});
   }
   page.drawImage(logo,{x:margin,y:701,width:94,height:94});
   draw("RESIT PEMBAYARAN",153,792,27,bold,blue);
   draw("MASJID TALHAH BIN UBAIDILLAH",153,767,11,bold,blue);
   ["TAMAN ALAM SUTERA","57000 BUKIT JALIL, WILAYAH PERSEKUTUAN","KUALA LUMPUR","03-8074 7414","masjidtalhahubaidillah@gmail.com"].forEach((t,i)=>draw(t,153,750-i*13,9.5,font,muted));
   rule(680,blue,2);y=658;
  }else{
   page.drawImage(logo,{x:margin,y:775,width:36,height:36});
   draw("RESIT PEMBAYARAN",88,799,15,bold,blue);
   draw(s.receipt_number+"  |  Sambungan",88,780,10,font,muted);
   // The full reference is searchable and remains wrapped within the A4 margins.
   const ref=lines("No. Rujukan QBN: "+s.reference,width,8.5);
   ref.forEach((t,i)=>draw(t,margin,758-i*12,8.5,font,muted));
   y=758-ref.length*12-12;rule(y,blue,1.2);y-=16;
  }
 };
 const paragraph=(text:string,size=10,f:PDFFont=font,color=ink,gap=4)=>{
  const ls=lines(text,width,size,f),height=ls.length*(size+gap);
  if(y-height<bottom)newPage();
  for(const l of ls){draw(l,margin,y,size,f,color);y-=size+gap;}
 };
 const date=(value:string)=>value.slice(8,10)+"/"+value.slice(5,7)+"/"+value.slice(0,4);
 const verified=new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Kuala_Lumpur",day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).format(new Date(s.issued_at)).replace(",","")+" MYT";
 newPage(true);
 draw("Tarikh Bayaran",margin,y,9,font,muted);draw("Tarikh Disahkan",310,y,9,font,muted);y-=18;
 draw(date(s.payment_date),margin,y,11,bold);draw(verified,310,y,11,bold);y-=27;
 draw("No. Resit",margin,y,9,font,muted);draw("No. Rujukan QBN",250,y,9,font,muted);y-=18;
 draw(s.receipt_number,margin,y,12,bold,blue);
 const refs=lines(s.reference,right-250,9);refs.forEach((t,i)=>draw(t,250,y-i*13,9));y-=refs.length*13+16;
 paragraph("Kempen: "+s.campaign_title+" ("+s.campaign_year+")",10,bold,blue);y-=13;
 draw("DITERIMA DARIPADA",margin,y,10,bold,blue);y-=19;
 paragraph("Nama Pemohon: "+s.applicant_name,11);y-=9;
 // Fixed column widths, dynamic row heights; there are no decorative empty rows.
 const cols=[margin,margin+222,margin+284,margin+346,margin+404,right];
 const titles=["Nama Peserta","Tujuan","No. Lembu","Bahagian","Jumlah (RM)"];
 const tableHeader=()=>{
  page.drawRectangle({x:margin,y:y-29,width,height:29,color:blue});
  titles.forEach((t,i)=>draw(t,cols[i]+8,y-19,9,bold,rgb(1,1,1)));y-=29;
 };
 if(y-65<bottom)newPage();tableHeader();
 for(const [index,p] of s.participants.entries()){
  const name=lines(p.participant_name,cols[1]-cols[0]-16,10),height=Math.max(32,name.length*14+14);
  if(y-height-(index===s.participants.length-1?48:0)<bottom){newPage();tableHeader();}
  page.drawRectangle({x:margin,y:y-height,width,height,borderColor:border,borderWidth:.6});
  for(const x of cols.slice(1,-1))page.drawLine({start:{x,y},end:{x,y:y-height},color:border,thickness:.6});
  name.forEach((t,j)=>draw(t,margin+8,y-20-j*14,10));
  draw(p.purpose==="qurban"?"Qurban":"Aqiqah",cols[1]+8,y-20,10);
  for(const [index,value]of [[2,String(p.cattle_number)],[3,String(p.slot_number)]]as const)
   draw(value,(cols[index]+cols[index+1]-font.widthOfTextAtSize(value,10))/2,y-20,10);
  const amount=receiptMoney(s.price_per_share_minor);draw(amount,right-9-font.widthOfTextAtSize(amount,10),y-20,10);y-=height;
 }
 // Keep the total with the final row whenever practical; continue cleanly otherwise.
 if(y-56<bottom)newPage();
 page.drawRectangle({x:margin,y:y-48,width,height:48,color:pale,borderColor:border,borderWidth:.6});
 draw("Jumlah Bayaran",margin+12,y-29,12,bold,blue);
 const total="RM "+receiptMoney(s.amount_minor);draw(total,right-12-bold.widthOfTextAtSize(total,16),y-30,16,bold,blue);y-=65;
 // Keep the closing block together. It grows with wrapping, not fixed Canva geometry.
 const closingHeight=24+24+lines(RECEIPT_NOTE,width,9.5).length*14+24;
 if(y-closingHeight<bottom)newPage();
 paragraph("Kaedah Pembayaran: Pindahan Bank — Bank Islam",10,bold);y-=14;
 paragraph("Terima kasih atas penyertaan anda.",10,bold,blue);y-=10;
 paragraph(RECEIPT_NOTE,9.5,font,muted);y-=8;
 paragraph("Resit ini dijana secara digital dan tidak memerlukan tandatangan.",9.5,font,muted);
 doc.getPages().forEach((p,i)=>{
  p.drawLine({start:{x:margin,y:45},end:{x:right,y:45},color:border,thickness:.5});
  p.drawText(s.receipt_number,{x:margin,y:29,size:8,font,color:muted});
  const n="Halaman "+(i+1)+" / "+doc.getPageCount();p.drawText(n,{x:right-font.widthOfTextAtSize(n,8),y:29,size:8,font,color:muted});
 });
 return doc.save({useObjectStreams:false,addDefaultPage:false});
}
