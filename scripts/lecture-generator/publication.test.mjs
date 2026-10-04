import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createJiti} from 'jiti';
import {register} from 'node:module';
import {ROOT} from '../sanity-migration/plan.mjs';
import {validatePlan} from '../sanity-migration/validation.mjs';
import {publicationMemory,clone} from './publication-simulator.mjs';
register(new URL('./styles-test-loader.mjs',import.meta.url));
const jiti=createJiti(import.meta.url,{fsCache:false,moduleCache:true,jsx:{runtime:'automatic'}});
const dir=path.join(ROOT,'src/sanity/tools/lecture-generator');
const p=await jiti.import(path.join(dir,'publication.ts'));
const d=await jiti.import(path.join(dir,'draft-persistence.ts'));
const m=await jiti.import(path.join(dir,'model.ts'));
const canonical=await jiti.import(path.join(dir,'month-document.ts'));
const approved=JSON.parse(fs.readFileSync(path.join(ROOT,'docs/LECTURE-FIRST-SAVE-APPROVED.json'),'utf8'));
const draft=()=>({...clone(approved.plan.payload),_rev:'qa-approved-revision'});
const images=()=>approved.plan.assets.map(a=>({_id:a.assetId,_type:'sanity.imageAsset',sha1hash:a.sha1,size:a.size,mimeType:a.mimeType}));
const client=()=>publicationMemory([draft(),...images(),{_id:'unrelated-news',_type:'newsPost',_rev:'untouched'}]);
const validate=async document=>canonical.validateMonthDocument(document);
const planFor=async c=>p.preparePublication(c,await d.readBase(c,2026,10),2026,10,validate);
const publish=(c,plan)=>p.publishReviewedMonth(c,plan,plan.fingerprint,validate);

test('eligibility rejects missing draft, unknown revision, unsaved edits, wrong month and malformed content',()=>{
 assert.match(p.publicationEligibility(undefined,2026,10,false),/No saved/);
 assert.match(p.publicationEligibility({draft:draft(),published:null},2026,10,true),/Unsaved/);
 assert.match(p.publicationEligibility({draft:{...draft(),_rev:undefined},published:null},2026,10,false),/unknown/);
 assert.match(p.publicationEligibility({draft:draft(),published:null},2026,11,false),/does not match/);
 const invalid=draft();invalid.entries[0].sessions.push(...clone(invalid.entries[0].sessions),...clone(invalid.entries[0].sessions));
 assert.match(p.publicationEligibility({draft:invalid,published:null},2026,10,false),/maximum 2/);
 assert.equal(p.publicationEligibility({draft:draft(),published:null},2026,10,false),undefined);
});
test('October plan is read-only, exactly 30 dates/34 sessions/29 resolved portrait assets, valid schema',async()=>{
 const c=client(),before=clone([...c.store]),plan=await planFor(c);
 assert.equal(plan.draftId,'drafts.lectureMonth-2026-10');assert.equal(plan.publishedId,'lectureMonth-2026-10');
 assert.equal(plan.dates,30);assert.equal(plan.sessions,34);assert.equal(plan.assetReferences.length,29);assert.equal(plan.publishedRevision,null);
 assert.deepEqual(plan.payload,approved.plan.payload);assert.deepEqual([...c.store],before);assert.deepEqual(c.calls,{actions:[],uploads:[]});
 const r=await validatePlan({assets:[],errors:[],collisions:[],missing:[]},[draft()],c);assert.deepEqual(r.errors,[]);assert.deepEqual(r.warnings,[]);
});
test('schema errors, unresolved or wrong-type references and wrong client target disable before action',async()=>{
 for(const change of [c=>c.store.delete(images()[0]._id),c=>c.store.get(images()[0]._id)._type='newsPost',c=>c.config=()=>({...c.config(),dataset:'other'})]){
  const c=client();if(change.toString().includes('config')){const config=c.config();c.config=()=>({...config,dataset:'other'});}else change(c);
  await assert.rejects(()=>planFor(c));assert.equal(c.calls.actions.length,0);
 }
 const c=client(),base=await d.readBase(c,2026,10);await assert.rejects(()=>p.preparePublication(c,base,2026,10,async()=>{throw Error('Schema invalid');}),/Schema invalid/);
});
test('confirmation is required and plan tampering never reaches an action',async()=>{
 const c=client(),plan=await planFor(c);
 for(const confirmation of ['', 'other'])await assert.rejects(()=>p.publishReviewedMonth(c,plan,confirmation,validate),/confirmation/);
 const bad=clone(plan);bad.payload.entries[0].sessions[0].topic='unreviewed';
 await assert.rejects(()=>p.publishReviewedMonth(c,bad,bad.fingerprint,validate),/confirmation/);assert.equal(c.calls.actions.length,0);
});
test('supported first publication atomically removes only its draft and authenticates exact published content',async()=>{
 const c=client(),plan=await planFor(c),unrelated=clone([...c.store].filter(([id])=>id!==plan.draftId));
 const result=await publish(c,plan);assert.equal(result.base.draft,null);assert.ok(result.base.published._rev);
 assert.equal(await p.publicationDigest(p.publicationContent(result.base.published)),plan.contentFingerprint);
 assert.deepEqual([...c.store].filter(([id])=>id!==plan.publishedId),unrelated);
 assert.equal(c.calls.actions.length,1);assert.equal(c.calls.actions[0].length,2);assert.equal(c.calls.uploads.length,0);
 assert.equal(c.calls.actions[0][1].ifDraftRevisionId,plan.draftRevision);
 assert.ok(c.calls.actions[0].every(a=>!a.actionType.includes('delete')&&!a.actionType.includes('discard')));
});
test('stale draft/published revision, identity and canonical text stop before mutation',async()=>{
 for(const mutate of [c=>c.store.get(draft()._id)._rev='edited',c=>c.store.delete(draft()._id),c=>c.store.get(draft()._id).month=11,c=>c.store.get(draft()._id).entries[0].sessions[0].topic='changed-with-same-rev',c=>c.store.set('lectureMonth-2026-10',{...draft(),_id:'lectureMonth-2026-10',_rev:'concurrent'})]){
  const c=client(),plan=await planFor(c);mutate(c);await assert.rejects(()=>publish(c,plan));assert.equal(c.calls.actions.length,0);
 }
});
test('atomic server guards reject draft edits, deletion/recreation and a concurrently appearing published target',async()=>{
 for(const mutate of [c=>c.store.get(draft()._id)._rev='raced',c=>c.store.delete(draft()._id),c=>c.store.set(draft()._id,{...draft(),_rev:'recreated'}),c=>c.store.set('lectureMonth-2026-10',{...draft(),_id:'lectureMonth-2026-10',_rev:'new-published'})]){
  const c=client(),plan=await planFor(c);c.beforeAction=()=>mutate(c);await assert.rejects(()=>publish(c,plan),d.DraftConflict);
  assert.ok(!c.store.has(plan.publishedId)||c.store.get(plan.publishedId)._rev==='new-published');
 }
});
test('later publication replaces the loaded published revision under both server revision guards',async()=>{
 const c=client(),pub={...draft(),_id:'lectureMonth-2026-10',_rev:'previous-published'};c.store.set(pub._id,pub);
 const plan=await planFor(c);await publish(c,plan);assert.equal(c.calls.actions[0].length,1);assert.equal(c.calls.actions[0][0].ifPublishedRevisionId,pub._rev);
 const raced=client();raced.store.set(pub._id,pub);const next=await planFor(raced);raced.beforeAction=()=>raced.store.get(pub._id)._rev='raced';
 await assert.rejects(()=>publish(raced,next),d.DraftConflict);assert.ok(raced.store.has(next.draftId));assert.equal(raced.store.get(pub._id)._rev,'raced');
});
test('lost network response may report Published only when authenticated read-back verifies the new content',async()=>{
 const c=client(),plan=await planFor(c);c.afterAction=()=>{throw Error('Response lost');};
 const result=await publish(c,plan);assert.ok(result.base.published);assert.equal(result.base.draft,null);assert.match(result.warning,/verified by authenticated read-back/);assert.equal(c.calls.actions.length,1);
});
test('network failure without commit, failed read-back and post-action drift remain uncertain, never success or retry',async()=>{
 for(const mode of ['no-commit','read-failure','content-drift','new-draft']){
  const c=client(),plan=await planFor(c);
  if(mode==='no-commit')c.beforeAction=()=>{throw Error('Network failure');};
  else c.afterAction=()=>{
   if(mode==='read-failure')c.beforeFetch=()=>{throw Error('Read unavailable');};
   if(mode==='content-drift')c.store.get(plan.publishedId).entries[0].sessions[0].topic='unexpected';
   if(mode==='new-draft')c.store.set(plan.draftId,{...draft(),_rev:'another-editor'});
  };
  await assert.rejects(()=>publish(c,plan),p.PublicationUncertain);assert.equal(c.calls.actions.length,1);
 }
});
test('double submission cannot dispatch two operations',async()=>{
 const c=client(),plan=await planFor(c);let release;const blocked=new Promise(r=>{release=r;});c.beforeAction=()=>blocked;
 const first=publish(c,plan);while(!c.calls.actions.length)await new Promise(r=>setTimeout(r,1));
 await assert.rejects(()=>publish(c,plan),/already in progress/);release();await first;assert.equal(c.calls.actions.length,1);
});
test('published→edit→Save Draft→review→Publish keeps the monthly snapshot and preserves published data until publication',async()=>{
 const c=client();await publish(c,await planFor(c));const loaded=await d.loadMonth(c,2026,10),old=clone(loaded.base.published);
 const local=clone(loaded.schedule);local.entries[0].sessions[0].topic='Controlled simulator update';
 const prepared=await d.prepareSave(c,local,[],{...m.defaultPosterSettings,showInfaq:loaded.showInfaq},loaded.base);
 const saved=await d.saveDraft(c,prepared,loaded.base,validate);assert.deepEqual(c.store.get(old._id),old);assert.ok(saved.base.draft);
 const review=await planFor(c);const result=await publish(c,review);assert.equal(result.base.published.entries[0].sessions[0].topic,'Controlled simulator update');assert.equal(result.base.draft,null);assert.equal(c.calls.uploads.length,0);
});
test('publication preserves all six approved Unicode corrections and matching portrait alt exactly',async()=>{
 const c=client(),plan=await planFor(c),result=await publish(c,plan),entry=n=>result.base.published.entries.find(e=>e.date==='2026-10-'+String(n).padStart(2,'0'));
 assert.equal(entry(3).sessions[1].topic,'AL-QUR’AN\n& TAJWID');assert.equal(entry(10).sessions[0].speakerName,'UST K. NI’MAT');assert.equal(entry(10).sessions[0].photo.alt,'Potret UST K. NI’MAT');
 assert.equal(entry(24).sessions[0].speakerName,'UST MUHD MU’IZZ');assert.equal(entry(24).sessions[0].photo.alt,'Potret UST MUHD MU’IZZ');assert.equal(entry(25).sessions[0].topic,'KITAB MATLA’\nAL-BADRAIN');
 assert.equal(canonical.stableJson(p.publicationContent(result.base.published)),canonical.stableJson(p.publicationContent(draft())));
});
test('confirmation component shows plan details, explicit cancel/confirm, modal focus and progress state',async()=>{
 const React=await import('react'),{renderToStaticMarkup}=await import('react-dom/server'),{PublishConfirmation}=await jiti.import(path.join(dir,'PublishConfirmation.tsx'));
 const plan=await planFor(client()),html=renderToStaticMarkup(React.createElement(PublishConfirmation,{plan,busy:false,onConfirm(){},onCancel(){}}));
 for(const text of ['Publish Jadual Oktober 2026?','30 dates / 34 sessions',plan.draftRevision,'None — first publication','Confirm Publish Jadual','Cancel',plan.contentFingerprint])assert.ok(html.includes(text),text);
 const busy=renderToStaticMarkup(React.createElement(PublishConfirmation,{plan,busy:true,onConfirm(){},onCancel(){}}));assert.ok(busy.includes('Publishing…'));assert.equal((busy.match(/disabled=""/g)||[]).length,2);
 const source=fs.readFileSync(path.join(dir,'PublishConfirmation.tsx'),'utf8');assert.ok(source.includes('showModal()')&&source.includes('autoFocus'));
 const core=fs.readFileSync(path.join(dir,'LectureGeneratorTool.tsx'),'utf8');assert.match(core,/onClick=\{\(\) => void publication.openConfirmation\(\)\}/);assert.ok(!core.includes('onKeyDown'));
 assert.ok(!fs.readFileSync(path.join(dir,'publication.ts'),'utf8').includes('assets.upload'));
});
test('the exact read-only first-publication record preserves approved October content and recomputes both fingerprints',async()=>{
 const record=JSON.parse(fs.readFileSync(path.join(ROOT,'docs/LECTURE-FIRST-PUBLICATION-DRY-RUN.json'),'utf8'));
 const {fingerprint,...plan}=record.plan;assert.equal(await p.publicationDigest(plan),fingerprint);
 assert.equal(await p.publicationDigest(p.publicationContent(plan.payload)),plan.contentFingerprint);
 assert.deepEqual(plan.payload,approved.plan.payload);assert.equal(plan.draftRevision,'SSdKRdF7e0XIFT3zzNP2ab');
 assert.equal(plan.assetReferences.length,29);assert.equal(plan.dates,30);assert.equal(plan.sessions,34);
 assert.deepEqual(record.actions,p.publicationActions(record.plan));assert.equal(record.productionActionsExecuted,0);
 assert.equal(record.expectedAfter.drafts,0);assert.equal(record.expectedAfter.publishedLectureMonths,1);
});
