import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {createJiti} from 'jiti';
import {ROOT} from '../sanity-migration/plan.mjs';
import {validatePlan} from '../sanity-migration/validation.mjs';
const jiti=createJiti(import.meta.url,{fsCache:false,moduleCache:true});
const dir=path.join(ROOT,'src/sanity/tools/lecture-generator');
const m=await jiti.import(path.join(dir,'model.ts'));
const d=await jiti.import(path.join(dir,'month-document.ts'));
const p=await jiti.import(path.join(dir,'draft-persistence.ts'));
const {allowedPosterAsset,rasterPdf}=await jiti.import(path.join(dir,'export-poster.ts'));
const clone=value=>JSON.parse(JSON.stringify(value));
const imageId='image-'+ 'a'.repeat(40)+'-1280x963-png';
const image={_type:'image',asset:{_type:'reference',_ref:imageId},alt:'Poster QA sahaja'};
const session=(fields={})=>({id:'s1',sessionType:'maghrib',speakerId:'',speakerName:'Nama snapshot QA',topic:'Topik snapshot QA',...fields});
const schedule=(fields={})=>({year:2026,month:10,entries:[{day:24,isManualOverride:true,sessions:[session()]}],...fields});
const settings={...m.defaultPosterSettings,generalDonationQr:undefined,showInfaq:true};
async function document(fields={}){return {...await d.serializeMonth(schedule(),[],settings,async()=>image),...fields};}
/** In-memory Actions contract simulator. Never uses a network client or real credentials. */
function memory(docs=[]){
 const store=new Map(docs.map(doc=>[doc._id,clone(doc)])),calls={uploads:[],actions:[]};let rev=0;
 const client={store,calls,beforeAction:undefined,afterAction:undefined,
 config:()=>({projectId:'2o95jmms',dataset:'production',useCdn:false,perspective:'raw',maxRetries:0}),
 async getDocument(id){return store.has(id)?clone(store.get(id)):undefined;},
 async fetch(query,params){
  if(query.startsWith('*[_id in $ids]'))return params.ids.flatMap(id=>store.has(id)?[clone(store.get(id))]:[]);
  if(query.startsWith('count('))return [...store.keys()].filter(id=>id.startsWith('drafts.')).length;
  if(query.includes('sha1hash==$hash'))return [...store.values()].filter(a=>a._type==='sanity.imageAsset'&&a.sha1hash===params.hash);
  if(query.includes('"speakers":'))return {speakers:[...store.values()].filter(a=>a._type==='lectureSpeaker'&&!a._id.startsWith('drafts.')).map(a=>({...clone(a),id:a._id})),rules:[...store.values()].filter(a=>a._type==='lectureRule'&&!a._id.startsWith('drafts.')).map(a=>({...clone(a),id:a._id,speakerId:a.speaker?._ref||''}))};
  if(query.includes('_id=="siteSettings"'))return store.has('siteSettings')?clone(store.get('siteSettings')):null;
  throw Error('Unexpected query: '+query);
 },
 assets:{async upload(type,file){const bytes=Buffer.from(await file.arrayBuffer()),sha1=createHash('sha1').update(bytes).digest('hex'),size=file.size;const id=`image-${sha1}-4x3-png`;const asset={_id:id,_type:'sanity.imageAsset',sha1hash:sha1,size,mimeType:file.type};calls.uploads.push({type,bytes});store.set(id,asset);return asset;}},
 async action(actions){
  calls.actions.push(clone(actions));await client.beforeAction?.();const next=new Map([...store].map(([id,doc])=>[id,clone(doc)]));
  const conflict=()=>{throw Object.assign(Error('409 Revision/identity conflict'),{statusCode:409});};
  for(const a of actions){
   if(a.actionType==='sanity.action.document.create'){if(next.has(a.publishedId)||next.has(a.attributes._id))conflict();next.set(a.attributes._id,{...clone(a.attributes),_rev:'qa-'+ ++rev});}
   else if(a.actionType==='sanity.action.document.edit'){const current=next.get(a.draftId);if(!current||current._rev!==a.patch.ifRevisionID)conflict();next.set(a.draftId,{...current,...clone(a.patch.set),_rev:'qa-'+ ++rev});}
   else if(a.actionType==='sanity.action.document.version.create'){if(next.has(a.versionId)||next.get(a.baseId)?._rev!==a.ifBaseRevisionId)conflict();next.set(a.versionId,{...next.get(a.baseId),_id:a.versionId,_rev:'qa-'+ ++rev});}
   else if(a.actionType==='sanity.action.document.version.replace'){if(!next.has(a.document._id))conflict();next.set(a.document._id,{...clone(a.document),_rev:'qa-'+ ++rev});}
   else throw Error('Forbidden action');
  }
  store.clear();for(const [id,doc]of next)store.set(id,doc);await client.afterAction?.();return {transactionId:'qa-transaction'};
 }};return client;
}
const validate=async payload=>d.validateMonthDocument(payload);
const approve=prepared=>({fingerprint:prepared.plan.fingerprint});
const base=()=>({draft:null,published:null});
test('canonical snapshot is one stable month document; no runtime URL, QR or fake geometry',async()=>{
 const doc=await document();assert.equal(doc._id,'drafts.lectureMonth-2026-10');assert.equal(doc.entries[0].date,'2026-10-24');assert.equal(doc.showInfaq,true);assert.ok(!JSON.stringify(doc).includes('src'));assert.deepEqual(d.deserializeMonth(doc,'2o95jmms','production'),schedule());
});
test('schema accepts serialized month, portrait layout and shared full special posters',async()=>{
 const input=schedule({entries:[24,25].map(day=>({day,isManualOverride:true,sessions:[session({photo:{src:'cms',width:1280,height:963,cmsImage:image,fit:'cover',zoom:1,positionY:50}})],specialPoster:{image:{src:'cms',width:1280,height:963,alt:image.alt,cmsImage:image},mode:'full',fit:'cover',position:'top'}}))});
 const doc=await d.serializeMonth(input,[],settings,async()=>image);
 const result=await validatePlan({documents:[doc],assets:[],errors:[],collisions:[],missing:[]},[doc],{getDocument:async()=>({_id:imageId}),config:()=>({projectId:'2o95jmms',dataset:'production'})});assert.deepEqual(result.errors,[]);
 assert.equal(doc.entries[0].specialPoster.image.asset._ref,doc.entries[1].specialPoster.image.asset._ref);assert.equal(doc.entries[0].sessions.length,1);
});
test('whole-month validation rejects invalid identity, dates, duplicates, third sessions and runtime fields',async()=>{
 const good=await document();for(const change of [doc=>doc.month=0,doc=>doc._id='drafts.other',doc=>doc.entries[0].date='2026-11-24',doc=>doc.entries.push(clone(doc.entries[0])),doc=>doc.entries[0].sessions=[...doc.entries[0].sessions,...doc.entries[0].sessions,...doc.entries[0].sessions],doc=>doc.entries[0].sessions[0].sessionType='fake',doc=>doc.showInfaq='yes',doc=>doc.token='secret',doc=>doc.entries[0].sessions[0].speaker={_type:'reference',_ref:'drafts.speaker'},doc=>doc.entries[0].sessions[0].photoLayout={fit:'fake'}]){const bad=clone(good);change(bad);assert.throws(()=>d.validateMonthDocument(bad));}
 const bad=clone(good);bad.month=2;bad._id='drafts.lectureMonth-2026-02';bad.entries[0].date='2026-02-30';assert.throws(()=>d.validateMonthDocument(bad));
});
test('special poster rejects mixed mode, invalid fit/position, missing alt and nonmanual takeover',async()=>{
 const good=await document();good.entries[0].specialPoster={image,mode:'full',fit:'cover',position:'center'};
 for(const patch of [{mode:'mixed'},{fit:'fill'},{position:'left'},{image:{...image,alt:''}}]){const bad=clone(good);Object.assign(bad.entries[0].specialPoster,patch);assert.throws(()=>d.validateMonthDocument(bad));}good.entries[0].isManualOverride=false;assert.throws(()=>d.validateMonthDocument(good));
});
test('first save creates only draft and authenticates exact read-back with new revision',async()=>{
 const client=memory(),before=base(),prepared=await p.prepareSave(client,schedule(),[],settings,before);const loaded=await p.saveDraft(client,prepared,before,validate);
 assert.equal(loaded.base.draft._rev,'qa-1');assert.equal(loaded.base.published,null);assert.equal(client.calls.actions.length,1);assert.equal(client.store.size,1);assert.equal(loaded.schedule.entries[0].sessions[0].speakerName,'Nama snapshot QA');
});
test('existing draft update uses its exact revision; published content remains byte/revision-identical',async()=>{
 const draft=await document({_rev:'d1'}),published={...clone(draft),_id:'lectureMonth-2026-10',_rev:'p1'};const client=memory([draft,published]),before=await p.readBase(client,2026,10),local=schedule();local.entries[0].sessions[0].topic='Local update';const prepared=await p.prepareSave(client,local,[],settings,before);await p.saveDraft(client,prepared,before,validate);
 assert.deepEqual(client.store.get(published._id),published);assert.equal(client.calls.actions[0][0].patch.ifRevisionID,'d1');assert.equal(client.store.get(draft._id).entries[0].sessions[0].topic,'Local update');
});
test('published base is cloned into draft under base revision guard; never patched as published',async()=>{
 const pub=await document({_id:'lectureMonth-2026-10',_rev:'p1'}),client=memory([pub]),before=await p.readBase(client,2026,10);const prepared=await p.prepareSave(client,schedule(),[],settings,before);await p.saveDraft(client,prepared,before,validate);
 assert.deepEqual(client.store.get(pub._id),pub);assert.equal(client.calls.actions[0][0].ifBaseRevisionId,'p1');assert.ok(client.store.has('drafts.'+pub._id));
});
test('identical authenticated draft save validates and reads back without an action, asset upload or revision change',async()=>{
 const draft=await document({_rev:'d1'}),published={...clone(draft),_id:'lectureMonth-2026-10',_rev:'p1'},client=memory([draft,published]);
 const before=await p.readBase(client,2026,10),prepared=await p.prepareSave(client,schedule(),[],settings,before);let validations=0;
 const loaded=await p.saveDraft(client,prepared,before,async payload=>{validations++;await validate(payload);});
 assert.equal(validations,2);assert.equal(loaded.saveResult,'unchanged');assert.equal(loaded.base.draft._rev,'d1');
 assert.deepEqual(client.store.get(draft._id),draft);assert.deepEqual(client.store.get(published._id),published);assert.equal(client.calls.actions.length,0);assert.equal(client.calls.uploads.length,0);
});
test('unchanged saves still reject a concurrent revision during authenticated reload without a mutation',async()=>{
 const draft=await document({_rev:'d1'}),client=memory([draft]),before=await p.readBase(client,2026,10),prepared=await p.prepareSave(client,schedule(),[],settings,before);
 const fetch=client.fetch;let reads=0;client.fetch=async(q,args)=>{if(q.startsWith('*[_id in $ids]')&&++reads===3)client.store.get(draft._id)._rev='other-session';return fetch(q,args);};
 await assert.rejects(()=>p.saveDraft(client,prepared,before,validate),p.DraftConflict);assert.equal(client.calls.actions.length,0);assert.equal(client.calls.uploads.length,0);
});
test('operational Save Draft rejects tampered prepared payload before any upload/action',async()=>{
 const client=memory(),prepared=await p.prepareSave(client,schedule(),[],settings,base());prepared.plan.payload.entries[0].sessions[0].topic='Changed after validation';
 await assert.rejects(()=>p.saveDraft(client,prepared,base(),validate),/fingerprint changed/);assert.equal(client.calls.uploads.length,0);assert.equal(client.calls.actions.length,0);
});
test('approval gate and altered fingerprint prevent every upload/action',async()=>{
 const client=memory(),prepared=await p.prepareSave(client,schedule(),[],settings,base());await assert.rejects(()=>p.saveApprovedDraft(client,prepared,base(),undefined,validate),/not owner-approved/);prepared.plan.payload.entries[0].sessions[0].topic='Tampered';await assert.rejects(()=>p.saveApprovedDraft(client,prepared,base(),approve(prepared),validate),/fingerprint changed/);assert.equal(client.calls.actions.length,0);assert.equal(client.calls.uploads.length,0);
});
test('stale remote revision stops before mutation and keeps caller working state',async()=>{
 const doc=await document({_rev:'d1'}),client=memory([doc]),before=await p.readBase(client,2026,10),local=schedule(),prepared=await p.prepareSave(client,local,[],settings,before);client.store.get(doc._id)._rev='changed';await assert.rejects(()=>p.saveDraft(client,prepared,before,validate),p.DraftConflict);assert.equal(client.calls.actions.length,0);assert.deepEqual(local,schedule());
});
test('server draft revision race fails atomically without overwrite or retry',async()=>{
 const doc=await document({_rev:'d1'}),client=memory([doc]),before=await p.readBase(client,2026,10),local=schedule();local.entries[0].sessions[0].topic='Actual guarded update';const prepared=await p.prepareSave(client,local,[],settings,before);client.beforeAction=()=>{client.store.get(doc._id)._rev='another-editor';};await assert.rejects(()=>p.saveDraft(client,prepared,before,validate),p.DraftConflict);assert.equal(client.store.get(doc._id)._rev,'another-editor');assert.equal(client.calls.actions.length,1);
});
test('published revision race and concurrent draft creation block published-base clone',async()=>{
 for(const mode of ['published','draft']){const pub=await document({_id:'lectureMonth-2026-10',_rev:'p1'}),client=memory([pub]),before=await p.readBase(client,2026,10),prepared=await p.prepareSave(client,schedule(),[],settings,before);client.beforeAction=()=>{if(mode==='published')client.store.get(pub._id)._rev='changed';else client.store.set('drafts.'+pub._id,{...pub,_id:'drafts.'+pub._id,_rev:'other-draft'});};await assert.rejects(()=>p.saveDraft(client,prepared,before,validate),p.DraftConflict);assert.equal(client.calls.actions.length,1);assert.ok(!client.store.has('drafts.'+pub._id)||client.store.get('drafts.'+pub._id)._rev==='other-draft');}
});
test('concurrent first creation cannot replace a draft or published target',async()=>{
 for(const published of [false,true]){const client=memory(),before=base(),prepared=await p.prepareSave(client,schedule(),[],settings,before);client.beforeAction=async()=>{const doc=await document({_rev:'other-editor',...(published?{_id:'lectureMonth-2026-10'}:{})});client.store.set(doc._id,doc);};await assert.rejects(()=>p.saveDraft(client,prepared,before,validate),p.DraftConflict);assert.ok([...client.store.values()].every(doc=>doc._rev==='other-editor'));}
});
test('read-back mismatch is visible and no automatic retry occurs',async()=>{
 const client=memory(),before=base(),prepared=await p.prepareSave(client,schedule(),[],settings,before);client.afterAction=()=>{client.store.get(prepared.plan.documentId).entries[0].sessions[0].topic='External edit';};await assert.rejects(()=>p.saveDraft(client,prepared,before,validate),/read-back/);assert.equal(client.calls.actions.length,1);
});
test('validation failure, wrong target, changed global draft count stop before writes',async()=>{
 const client=memory(),prepared=await p.prepareSave(client,schedule(),[],settings,base());await assert.rejects(()=>p.saveApprovedDraft(client,prepared,base(),approve(prepared),async()=>{throw Error('Schema invalid');}),/Schema invalid/);client.store.set('drafts.unrelated',{_id:'drafts.unrelated'});await assert.rejects(()=>p.saveApprovedDraft(client,prepared,base(),approve(prepared),validate),/Draft count/);client.config=()=>({...p.LECTURE_TARGET,dataset:'wrong'});await assert.rejects(()=>p.prepareSave(client,schedule(),[],settings,base()),/Client/);assert.equal(client.calls.actions.length,0);
});
test('loading precedence draft then published then active rules; no demo and no writes',async()=>{
 const pub=await document({_id:'lectureMonth-2026-10',_rev:'p1'}),draft=await document({_rev:'d1'});draft.entries[0].sessions[0].topic='Draft wins';const rule={_id:'rule-qa',_type:'lectureRule',weekday:1,occurrence:0,sessionType:'maghrib',topic:'Default',isActive:true};const client=memory([pub,draft,rule]);assert.equal((await p.loadMonth(client,2026,10)).schedule.entries[0].sessions[0].topic,'Draft wins');client.store.delete(draft._id);assert.equal((await p.loadMonth(client,2026,10)).base.published._rev,'p1');client.store.delete(pub._id);assert.ok((await p.loadMonth(client,2026,10)).schedule.entries.every(e=>!e.isManualOverride));client.store.delete(rule._id);const empty=await p.loadMonth(client,2026,10);assert.deepEqual(empty.schedule.entries,[]);assert.deepEqual(empty.speakers,[]);assert.equal(client.calls.actions.length,0);
});
test('missing/malformed donation omits infaq with warning without failing month',async()=>{
 const doc=await document({_rev:'d1'}),client=memory([doc]);let loaded=await p.loadMonth(client,2026,10);assert.equal(loaded.donationQr,undefined);assert.match(loaded.warning,/Infaq panel omitted/);
 // A branded QR is never a fallback; draft settings are never a production source.
 client.store.set('siteSettings',{donationInfo:{primaryQr:image}});
 client.store.set('drafts.siteSettings',{donationInfo:{compactQr:image}});
 assert.equal((await p.loadMonth(client,2026,10)).donationQr,undefined);
 const qrId='image-'+ 'b'.repeat(40)+'-853x853-png',qr={...image,asset:{_type:'reference',_ref:qrId}};
 for(const bad of [{},image,{...qr,crop:{top:0,bottom:0,left:0,right:0}},{...qr,hotspot:{x:.5,y:.5,width:1,height:1}}]){client.store.set('siteSettings',{donationInfo:{compactQr:bad}});loaded=await p.loadMonth(client,2026,10);assert.equal(loaded.donationQr,undefined);assert.match(loaded.warning,/Infaq panel omitted/);}
 client.store.set('siteSettings',{donationInfo:{compactQr:qr}});
 assert.equal((await p.loadMonth(client,2026,10)).donationQr,undefined);
 client.store.set(qrId,{_id:qrId,_type:'sanity.imageAsset'});
 assert.equal((await p.loadMonth(client,2026,10)).donationQr.assetId,qrId);
});
test('speaker name/photo/topic snapshots survive mutable library changes; explicit absent portrait stays absent',async()=>{
 const speaker={id:'speaker-qa',name:'New library name',defaultTopic:'New topic',isActive:true,photo:{src:'cms',width:1280,height:963,cmsImage:image}};
 const input=schedule({entries:[{day:24,isManualOverride:true,sessions:[session({speakerId:speaker.id,speakerName:'Historic name'})]}]});const saved=await d.serializeMonth(input,[speaker],settings,async()=>image);assert.equal(saved.entries[0].sessions[0].speakerName,'Historic name');assert.equal(saved.entries[0].sessions[0].photo,undefined);assert.equal(saved.entries[0].sessions[0].topic,'Topik snapshot QA');assert.equal(saved.entries[0].sessions[0].speaker._ref,speaker.id);
 delete input.entries[0].sessions[0].speakerName;const fresh=await d.serializeMonth(input,[speaker],settings,async()=>image);assert.equal(fresh.entries[0].sessions[0].speakerName,speaker.name);assert.deepEqual(fresh.entries[0].sessions[0].photo,image);
});
test('same original poster on two dates uploads unchanged bytes only once; exact asset references reused',async()=>{
 const bytes=Buffer.from('original fixture bytes'),file=new File([bytes],'fixture.png',{type:'image/png'}),localHash=createHash('sha256').update(bytes).digest('hex');const poster={src:'data:fixture',width:4,height:3,alt:'Fixture poster',localHash,originalFile:file};const input=schedule({entries:[24,25].map(day=>({day,isManualOverride:true,sessions:[session()],specialPoster:{image:poster,mode:'full',fit:'cover',position:'bottom'}}))}),client=memory();const prepared=await p.prepareSave(client,input,[],settings,base());assert.equal(prepared.plan.assets.length,1);await p.saveApprovedDraft(client,prepared,base(),approve(prepared),validate);assert.equal(client.calls.uploads.length,1);assert.deepEqual(client.calls.uploads[0].bytes,bytes);const entries=client.store.get(prepared.plan.documentId).entries;assert.equal(entries[0].specialPoster.image.asset._ref,entries[1].specialPoster.image.asset._ref);assert.equal(entries[0].sessions.length,1);
 const loaded=await p.loadMonth(client,2026,10),again=await p.prepareSave(client,input,[],settings,loaded.base);assert.equal(again.plan.assets[0].exists,true);await p.saveApprovedDraft(client,again,loaded.base,approve(again),validate);assert.equal(client.calls.uploads.length,1);
});
test('demo source, changed original hash and invalid MIME cannot upload or save',async()=>{
 for(const poster of [{src:'/lecture-demo/fictional.png',width:4,height:3,alt:'Demo'},{src:'blob:fixture',width:4,height:3,alt:'Fixture',originalFile:new File(['a'],'a.png',{type:'image/png'}),localHash:'bad'},{src:'blob:fixture',width:4,height:3,alt:'Fixture',originalFile:new File(['a'],'a.gif',{type:'image/gif'}),localHash:'bad'}]){const client=memory();const input=schedule();input.entries[0].specialPoster={image:poster,mode:'full',fit:'cover'};await assert.rejects(()=>p.prepareSave(client,input,[],settings,base()));assert.equal(client.calls.uploads.length,0);assert.equal(client.calls.actions.length,0);}
});
test('month switching protects dirty/saving state; signature includes infaq and poster edits',()=>{
 assert.equal(p.canSwitchMonth(true,false),false);assert.equal(p.canSwitchMonth(true,false,true),true);assert.equal(p.canSwitchMonth(false,true,true),false);assert.equal(p.canSwitchMonth(false,false),true);assert.notEqual(p.workingSignature(schedule(),true),p.workingSignature(schedule(),false));const changed=schedule();changed.entries[0].sessions[0].topic='Changed';assert.notEqual(p.workingSignature(schedule(),true),p.workingSignature(changed,true));
});
test('export admits only same-origin/explicit project CDN; never credentials or another project',()=>{
 const origin='http://127.0.0.1:3022',base='https://cdn.sanity.io/images/2o95jmms/production/';assert.equal(allowedPosterAsset('/lecture-demo/a.webp',origin),true);assert.equal(allowedPosterAsset(base+'a-4x3.png',origin,base),true);for(const url of ['https://example.com/a.png','https://cdn.sanity.io/images/other/production/a.png','https://secret@cdn.sanity.io/images/2o95jmms/production/a.png'])assert.equal(allowedPosterAsset(url,origin,base),false);assert.equal(allowedPosterAsset(base+'a.png',origin),false);
});
test('A4/A3 PDF container has a valid one-page structure, exact image bytes, stream sizes and xref offsets',async()=>{
 const sharp=(await import('sharp')).default,jpeg=await sharp({create:{width:4,height:3,channels:3,background:'#ffffff'}}).jpeg().toBuffer();
 for(const [paper,width,height,box]of [['A4',3508,2480,'841.89 595.28'],['A3',4961,3508,'1190.55 841.89']]){
  const pdf=Buffer.from(await rasterPdf({width,height,toDataURL:()=>`data:image/jpeg;base64,${jpeg.toString('base64')}`},paper).arrayBuffer()),text=pdf.toString('latin1');
  assert.ok(text.startsWith('%PDF-1.4\n'));assert.ok(text.includes('/Count 1'));assert.ok(text.includes('/MediaBox [0 0 '+box+']'));assert.ok(text.includes(`/Width ${width} /Height ${height}`));assert.ok(pdf.includes(jpeg));assert.ok(text.includes('/Length '+jpeg.length));
  const xref=Number(text.match(/startxref\n(\d+)/)[1]);assert.equal(text.slice(xref,xref+4),'xref');const lines=text.slice(xref).split('\n').slice(3,8);for(const [index,line]of lines.entries()){const offset=Number(line.slice(0,10));assert.ok(text.slice(offset).startsWith(`${index+1} 0 obj`));}
 }
});
test('production entrypoint uses authenticated manual Save Draft with no first-write gate or Publish handler',()=>{
 const wrapper=fs.readFileSync(path.join(dir,'StudioLectureGenerator.tsx'),'utf8');assert.ok(wrapper.includes('useClient')&&wrapper.includes('useCurrentUser'));assert.ok(!wrapper.includes('TOKEN'));assert.match(wrapper,/save:.*saveDraft\(client, prepared, base,/);assert.ok(!wrapper.includes('lectureDraftApproval'));assert.ok(!fs.existsSync(path.join(dir,'draft-approval.ts')));const core=fs.readFileSync(path.join(dir,'LectureGeneratorTool.tsx'),'utf8');assert.match(core,/className=\{styles.publish\} disabled/);assert.ok(!core.includes('onKeyDown'));assert.ok(!fs.readFileSync(path.join(dir,'draft-persistence.ts'),'utf8').includes('sanity.action.document.publish'));
});
test('first-save plan is source-backed, exact and excludes speaker/rule/QR/demo documents',async()=>{
 const record=JSON.parse(fs.readFileSync(path.join(ROOT,'docs/LECTURE-FIRST-SAVE-APPROVED.json'),'utf8'));
 const {fingerprint:claimed,...plan}=record.plan;assert.equal(await p.fingerprint(plan),claimed);d.validateMonthDocument(plan.payload);
 assert.equal(plan.documentId,'drafts.lectureMonth-2026-10');assert.equal(plan.draftsBefore,0);assert.equal(plan.draftsAfter,1);assert.equal(plan.payload.entries.flatMap(e=>e.sessions).length,34);
 assert.equal(plan.assets.length,29);assert.equal(plan.references.length,29);assert.ok(plan.assets.every(a=>!a.exists&&a.sha256.length===64));assert.ok(plan.references.every(id=>id.startsWith('image-')));assert.ok(!JSON.stringify(plan.payload).includes('Contoh'));
 const ids=new Set(plan.assets.map(a=>a.assetId));const result=await validatePlan({documents:[plan.payload],assets:[],errors:[],collisions:[],missing:[]},[plan.payload],{getDocument:async id=>ids.has(id)?{_id:id}:undefined,config:()=>({...p.LECTURE_TARGET})});assert.deepEqual(result.errors,[]);assert.deepEqual(result.warnings,[]);
});
test('original failed plan remains auditable; six exact Unicode corrections restore the approved fingerprint',async()=>{
 const failed=JSON.parse(fs.readFileSync(path.join(ROOT,'docs/LECTURE-FIRST-SAVE-DRY-RUN.json'),'utf8'));
 const approved=JSON.parse(fs.readFileSync(path.join(ROOT,'docs/LECTURE-FIRST-SAVE-APPROVED.json'),'utf8'));
 const audit=JSON.parse(fs.readFileSync(path.join(ROOT,'docs/LECTURE-FIRST-SAVE-GUARD-FAILURE.json'),'utf8'));
 const {fingerprint,...oldPlan}=failed.plan;
 assert.equal(await p.fingerprint(oldPlan),audit.storedPayloadFingerprint);
 assert.notEqual(await p.fingerprint(oldPlan),fingerprint);
 assert.equal(approved.plan.fingerprint,audit.correctedExactSourceFingerprint);
 assert.equal(audit.differences.length,6);assert.equal(audit.productionWrites,0);assert.equal(audit.uploads,0);
 const day=n=>approved.plan.payload.entries.find(e=>e.date==='2026-10-'+String(n).padStart(2,'0'));
 assert.equal(day(3).sessions[1].topic,'AL-QUR’AN\n& TAJWID');
 assert.equal(day(10).sessions[0].speakerName,'UST K. NI’MAT');
 assert.equal(day(10).sessions[0].photo.alt,'Potret UST K. NI’MAT');
 assert.equal(day(24).sessions[0].speakerName,'UST MUHD MU’IZZ');
 assert.equal(day(24).sessions[0].photo.alt,'Potret UST MUHD MU’IZZ');
 assert.equal(day(25).sessions[0].topic,'KITAB MATLA’\nAL-BADRAIN');
});
test('React workflow preserves dirty month state, blocks unsaved switching, reads saved revision and reviews conflicts explicitly',async()=>{
 // DOM-only unit harness; no browser navigation, network, Sanity credentials or screenshots.
 const {JSDOM}=await import('jsdom'),React=await import('react'),{createRoot}=await import('react-dom/client');
 const dom=new JSDOM('<div id="root"></div>');globalThis.window=dom.window;globalThis.document=dom.window.document;globalThis.IS_REACT_ACT_ENVIRONMENT=true;
 const {useDraftWorkflow}=await jiti.import(path.join(dir,'useDraftWorkflow.ts'));
 const client=memory(),adapter={load:(y,m)=>p.loadMonth(client,y,m),prepare:(...args)=>p.prepareSave(client,...args),save:(prepared,base)=>p.saveDraft(client,prepared,base,validate)};
 let current;
 function Harness(){const [schedules,setSchedules]=React.useState({'2026-10':{year:2026,month:10,entries:[]}}),[key,setKey]=React.useState('2026-10'),[showInfaq,setInfaq]=React.useState(true);
  const schedule=schedules[key];const workflow=useDraftWorkflow(adapter,schedule,[],{...settings,showInfaq},loaded=>{const next=m.monthKey(loaded.schedule.year,loaded.schedule.month);setSchedules(old=>({...old,[next]:loaded.schedule}));setKey(next);setInfaq(loaded.showInfaq);},(year,month,infaq)=>{setKey(m.monthKey(year,month));if(infaq!==undefined)setInfaq(infaq);});
  current={workflow,schedule,edit:()=>setSchedules(old=>({...old,[key]:m.updateDay(schedule,24,[session()])})),infaq:setInfaq};return React.createElement('p',null,workflow.status);
 }
 const root=createRoot(globalThis.document.getElementById('root'));await React.act(async()=>{root.render(React.createElement(Harness));});assert.equal(current.workflow.status,'Not saved');
 await React.act(async()=>current.edit());assert.equal(current.workflow.status,'Unsaved changes');
 await React.act(async()=>current.workflow.switchMonth(2026,11));assert.deepEqual(current.workflow.pending,{year:2026,month:11});assert.equal(current.schedule.month,10);
 await React.act(async()=>current.workflow.cancelSwitch());assert.equal(current.workflow.pending,undefined);
 await React.act(async()=>current.workflow.switchMonth(2026,11,true));assert.equal(current.schedule.month,11);assert.equal(client.calls.actions.length,0);
 await React.act(async()=>current.workflow.switchMonth(2026,10));assert.equal(current.schedule.entries[0].day,24);assert.equal(current.workflow.dirty,true);
 await React.act(async()=>current.workflow.save());assert.equal(current.workflow.status,'Draft saved');assert.equal(current.workflow.state.loaded.base.draft._rev,'qa-1');
 await React.act(async()=>current.infaq(false));assert.equal(current.workflow.dirty,true);
 client.store.get('drafts.lectureMonth-2026-10')._rev='other-editor';
 await React.act(async()=>current.workflow.save());assert.equal(current.workflow.phase,'conflict');assert.equal(current.workflow.dirty,true);
 await React.act(async()=>current.workflow.reloadForReview());assert.ok(current.workflow.review);assert.equal(current.workflow.dirty,true);
 await React.act(async()=>current.workflow.useRemote());assert.equal(current.workflow.dirty,false);assert.equal(current.workflow.backup.showInfaq,false);assert.equal(client.calls.actions.length,1);
 await React.act(async()=>root.unmount());dom.window.close();delete globalThis.window;delete globalThis.document;delete globalThis.IS_REACT_ACT_ENVIRONMENT;
});
