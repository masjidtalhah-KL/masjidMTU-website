import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {register} from 'node:module';
import {createJiti} from 'jiti';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {ROOT} from '../sanity-migration/plan.mjs';
import {validatePlan} from '../sanity-migration/validation.mjs';
register(new URL('./styles-test-loader.mjs',import.meta.url));
const jiti=createJiti(import.meta.url,{fsCache:false,moduleCache:true,jsx:{runtime:'automatic'}});
const dir=path.join(ROOT,'src/sanity/tools/lecture-generator');
const layout=await jiti.import(path.join(dir,'poster-layout.ts'));
const model=await jiti.import(path.join(dir,'model.ts'));
const {LecturePoster}=await jiti.import(path.join(dir,'LecturePoster.tsx'));
const {LectureGeneratorTool}=await jiti.import(path.join(dir,'LectureGeneratorTool.tsx'));
test('weekday painted bounds have symmetric padding without changing fonts or seven columns',()=>{
 const column=(layout.POSTER.gridWidth-6*layout.POSTER.columnGap)/7;
 assert.deepEqual(layout.WEEKDAY_HEADER,{y:201,height:28,size:27,weight:900,letterSpacing:-1.1});
 for(let i=0;i<7;i++){
  const x=layout.POSTER.left+i*(column+layout.POSTER.columnGap);
  // Asymmetric glyph overhang and cap metrics: avoid centring font advance instead of painted ink.
  const m={actualBoundingBoxLeft:1.5,actualBoundingBoxRight:121,actualBoundingBoxAscent:20,actualBoundingBoxDescent:0};
  const p=layout.weekdayLabelPosition(x,column,m);
  const left=p.x-m.actualBoundingBoxLeft-x,right=x+column-p.x-m.actualBoundingBoxRight;
  assert.ok(Math.abs(left-right)<1e-8);assert.ok(left>12);
  const top=p.y-m.actualBoundingBoxAscent-layout.WEEKDAY_HEADER.y,bottom=layout.WEEKDAY_HEADER.y+layout.WEEKDAY_HEADER.height-p.y-m.actualBoundingBoxDescent;
  assert.equal(top,bottom);assert.equal(top,4);
 }
});
test('operational labels are English-first while generated poster keeps Malay content',()=>{
 const html=renderToStaticMarkup(React.createElement(LectureGeneratorTool));
 for(const text of ['Calendar','Penceramah','Recurring Rules','Settings','Selected date','Special program poster','Poster fit','Poster position','Fill cell (cover)','Show entire poster (contain)','Remove poster','Save Draft','Publish Jadual'])assert.ok(html.includes(text),text);
 for(const old of ['Editor tarikh dipilih','Tetapan poster','Aturan Berulang','Menyediakan…','Pilih poster','Buang poster sahaja'])assert.ok(!html.includes(old),old);
 const poster=renderToStaticMarkup(React.createElement(LecturePoster,{schedule:model.createReviewSchedule(),speakers:model.demoSpeakers,settings:model.defaultPosterSettings}));
 for(const word of [...layout.POSTER_WEEKDAYS,'OKTOBER 2026','JADUAL KULIAH PENGAJIAN','INFAQ UNTUK MASJID','Imbas untuk menyumbang'])assert.ok(poster.includes(word),word);
});
test('real Studio poster uses draft accessibility terminology without changing artwork; fixtures keep demo wording',()=>{
 const props={schedule:model.createReviewSchedule(),speakers:model.demoSpeakers,settings:model.defaultPosterSettings};
 const fixture=renderToStaticMarkup(React.createElement(LecturePoster,props));
 const draft=renderToStaticMarkup(React.createElement(LecturePoster,{...props,settings:{...props.settings,reviewMode:'draft'}}));
 assert.match(draft,/aria-label="Draft Jadual Kuliah Oktober 2026\. Belum diterbitkan; untuk semakan Studio\."/);
 assert.match(fixture,/Foto rujukan untuk demo/);
 assert.equal(draft.replace(/aria-label="Draft Jadual Kuliah[^"]*"/,''),fixture.replace(/aria-label="Poster contoh[^"]*"/,''));
});
test('2/3/larger-cell QR uses full square original, no crop/overlay, three-cell cap and same print geometry',()=>{
 const column=(layout.POSTER.gridWidth-6*layout.POSTER.columnGap)/7;
 for(const span of [2,3,4,5,6])for(const h of [97.5,117,148.5]){
  const width=span*column+(span-1)*layout.POSTER.columnGap,g=layout.infaqGeometry(width,h);
  assert.ok(g.qrSize>=81.5);assert.ok(g.qrY>=8);assert.ok(g.textWidth>=185);
  assert.ok(g.qrSize+g.qrY<=h-8);assert.ok(g.textX+g.textWidth<=width-8);
  assert.ok(g.contentWidth<=3*column+2*layout.POSTER.columnGap);
 }
 const source=fs.readFileSync(path.join(ROOT,'public/lecture-demo/general-mosque-qr.png'));
 assert.equal(createHash('sha256').update(source).digest('hex'),'1b86b6336223e38fb103f23368cafae07cb0c1ea66e5a3bc1bb53b9eb6ed792d');
});
test('optional compactQr schema accepts old settings and approved source; rejects rectangular/cropped/missing-alt values',async()=>{
 const plan=JSON.parse(fs.readFileSync(path.join(ROOT,'docs/LECTURE-COMPACT-QR-DRY-RUN.json')));
 const valid=structuredClone(plan.payload),legacy=structuredClone(valid);delete legacy.donationInfo.compactQr;legacy._id='drafts.qa-old-settings';
 const refs=[...JSON.stringify(valid).matchAll(/"_ref":"([^"]+)"/g)].map(m=>m[1]);
 const verify=documents=>validatePlan({errors:[],collisions:[],missing:[],assets:[]},documents,{getDocument:async id=>refs.includes(id)?{_id:id}:undefined,config:()=>plan.target});
 assert.deepEqual((await verify([valid,legacy])).errors,[]);
 for(const change of [q=>q.asset._ref=q.asset._ref.replace('853x853','853x852'),q=>q.crop={top:0,bottom:0,left:0,right:0},q=>q.hotspot={x:.5,y:.5,width:1,height:1},q=>delete q.alt]){
  const invalid=structuredClone(valid);change(invalid.donationInfo.compactQr);assert.ok((await verify([invalid])).errors.length);
 }
 const after=structuredClone(valid);delete after.donationInfo.compactQr;
 const prior=JSON.parse(fs.readFileSync(path.join(ROOT,'docs/LECTURE-COMPACT-QR-DRY-RUN.json'))).primaryQrUnchanged;
 assert.deepEqual(after.donationInfo.primaryQr,prior);
 assert.equal(plan.basePublishedRevision,'SSdKRdF7e0XIFT3zzGU8xL');
 assert.equal(plan.asset.exists,false);assert.equal(plan.source.sha256,'1b86b6336223e38fb103f23368cafae07cb0c1ea66e5a3bc1bb53b9eb6ed792d');
});
