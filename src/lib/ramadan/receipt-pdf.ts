// Native server template; local fonts/logo only, no proof rendering or external resources.
import{PDFDocument,rgb,type PDFFont,type PDFPage}from'pdf-lib';
import fontkit from'@pdf-lib/fontkit';
import{readFile}from'node:fs/promises';import path from'node:path';
import{ramadanReceipt,receiptMoney}from'./receipt-contract';
export async function buildRamadanReceiptPdf(value:unknown):Promise<Uint8Array>{
 const s=ramadanReceipt(value),doc=await PDFDocument.create();doc.registerFontkit(fontkit);
 const assets=path.join(process.cwd(),"src/assets/receipt");
 const [regularBytes,boldBytes,logoBytes]=await Promise.all([
  readFile(path.join(assets,"NotoSans-Regular.ttf")),readFile(path.join(assets,"NotoSans-Bold.ttf")),
  readFile(path.join(process.cwd(),"public/brand/logo-masjid.png"))]);
 const font=await doc.embedFont(regularBytes,{subset:true}),bold=await doc.embedFont(boldBytes,{subset:true}),logo=await doc.embedPng(logoBytes);
 const supported=new Set(font.getCharacterSet()),safe=(v:string)=>Array.from(v).map(c=>supported.has(c.codePointAt(0)!)?c:"[U+"+c.codePointAt(0)!.toString(16).toUpperCase()+"]").join("");
 doc.setTitle("Resit Sumbangan Ramadan "+s.receipt_number);doc.setAuthor("Masjid Talhah Bin Ubaidillah");doc.setCreator("Masjid Talhah native Ramadan receipt template v1");doc.setLanguage("ms-MY");
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
   draw("RESIT SUMBANGAN RAMADAN",153,792,22,bold,blue);
   draw("MASJID TALHAH BIN UBAIDILLAH",153,767,11,bold,blue);
   ["TAMAN ALAM SUTERA","57000 BUKIT JALIL, WILAYAH PERSEKUTUAN","KUALA LUMPUR","03-8074 7414","masjidtalhahubaidillah@gmail.com"].forEach((t,i)=>draw(t,153,750-i*13,9.5,font,muted));
   rule(680,blue,2);y=658;
  }else{
   page.drawImage(logo,{x:margin,y:775,width:36,height:36});
   draw("RESIT SUMBANGAN RAMADAN",88,799,15,bold,blue);
   draw(s.receipt_number+"  |  Sambungan",88,780,10,font,muted);
   // The full reference is searchable and remains wrapped within the A4 margins.
   const ref=lines("Rujukan Tajaan: "+s.reference,width,8.5);
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
 draw("No. Resit",margin,y,9,font,muted);draw("Rujukan Tajaan",250,y,9,font,muted);y-=18;
 draw(s.receipt_number,margin,y,12,bold,blue);
 const refs=lines(s.reference,right-250,9);refs.forEach((t,i)=>draw(t,250,y-i*13,9));y-=refs.length*13+16;
 paragraph("Kempen: "+s.campaign_title+" ("+s.campaign_year+") · "+s.hijri_display_label,10,bold,blue);y-=13;
 draw("DITERIMA DARIPADA",margin,y,10,bold,blue);y-=19;
 paragraph("Nama Penyumbang: "+s.payer_name,11);y-=9;

 const cols=[margin,margin+210,margin+296,margin+348,margin+421,right];
 const titles=['Program Tajaan','Tarikh Program','Kuantiti','Harga Unit','Jumlah (RM)'];
 const tableHeader=()=>{page.drawRectangle({x:margin,y:y-34,width,height:34,color:blue});titles.forEach((t,i)=>draw(t,cols[i]+6,y-21,8.5,bold,rgb(1,1,1)));y-=34;};
 const slotText=(values:number[])=>{const ranges:string[]=[];for(let i=0;i<values.length;i++){const first=values[i];let last=first;while(values[i+1]===last+1)last=values[++i];ranges.push(first===last?String(first):first+'–'+last);}return ranges.join(', ');};
 if(y-75<bottom)newPage();tableHeader();
 for(const item of s.items){
  let pending=lines(item.offering_name,cols[1]-cols[0]-14,9.5);
  if(item.mode==='FIXED_SLOT')pending=pending.concat(lines('Slot: '+slotText(item.slots),cols[1]-cols[0]-14,9.5));
  let first=true;
  while(pending.length){
   if(y-50<bottom){newPage();tableHeader();}
   const take=Math.max(1,Math.min(pending.length,Math.floor((y-bottom-14)/14))),chunk=pending.splice(0,take),height=Math.max(42,chunk.length*14+14);
   if(y-height<bottom){pending=chunk.concat(pending);newPage();tableHeader();continue;}
   page.drawRectangle({x:margin,y:y-height,width,height,borderColor:border,borderWidth:.6});for(const x of cols.slice(1,-1))page.drawLine({start:{x,y},end:{x,y:y-height},color:border,thickness:.6});chunk.forEach((t,n)=>draw(t,margin+7,y-19-n*14,9.5));
   if(first){
    if(item.service_date){draw(date(item.service_date),cols[1]+7,y-19,9);draw(item.ramadan_day_number+' Ramadan',cols[1]+7,y-32,8.5,font,muted);}else draw('Sumbangan',cols[1]+7,y-19,8.5,font,muted);
    draw(item.quantity===null?'—':String(item.quantity),cols[2]+16,y-19,9.5);
    const unit=item.unit_price_minor===null?'—':receiptMoney(item.unit_price_minor),amount=receiptMoney(item.line_total_minor);const unitSize=Math.min(9,(cols[4]-cols[3]-14)/font.widthOfTextAtSize(unit,1)),amountSize=Math.min(9,(right-cols[4]-14)/font.widthOfTextAtSize(amount,1));draw(unit,cols[4]-7-font.widthOfTextAtSize(unit,unitSize),y-19,unitSize);draw(amount,right-7-font.widthOfTextAtSize(amount,amountSize),y-19,amountSize);first=false;
   }
   y-=height;if(pending.length){newPage();tableHeader();}
  }
 }
 // Keep the total with the final row whenever practical; continue cleanly otherwise.
 if(y-56<bottom)newPage();
 page.drawRectangle({x:margin,y:y-48,width,height:48,color:pale,borderColor:border,borderWidth:.6});
 draw("Jumlah Bayaran",margin+12,y-29,12,bold,blue);
 const total="RM "+receiptMoney(s.amount_minor);draw(total,right-12-bold.widthOfTextAtSize(total,16),y-30,16,bold,blue);y-=65;
 // Keep the closing block together. It grows with wrapping, not fixed Canva geometry.
 const closingHeight=100;
 if(y-closingHeight<bottom)newPage();
 paragraph("Kaedah Pembayaran: Pindahan Bank — Bank Islam",10,bold);y-=14;
 paragraph("Terima kasih atas penyertaan anda.",10,bold,blue);y-=10;

 paragraph("Resit ini dijana secara digital dan tidak memerlukan tandatangan.",9.5,font,muted);
 doc.getPages().forEach((p,i)=>{
  p.drawLine({start:{x:margin,y:45},end:{x:right,y:45},color:border,thickness:.5});
  p.drawText(s.receipt_number,{x:margin,y:29,size:8,font,color:muted});
  const n="Halaman "+(i+1)+" / "+doc.getPageCount();p.drawText(n,{x:right-font.widthOfTextAtSize(n,8),y:29,size:8,font,color:muted});
 });
 return doc.save({useObjectStreams:false,addDefaultPage:false});
}
