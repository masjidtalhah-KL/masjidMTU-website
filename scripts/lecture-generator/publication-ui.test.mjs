import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import {createRoot} from 'react-dom/client';
import {JSDOM} from 'jsdom';
import {createJiti} from 'jiti';
import {ROOT} from '../sanity-migration/plan.mjs';
import {publicationMemory,clone} from './publication-simulator.mjs';
const jiti=createJiti(import.meta.url,{fsCache:false,moduleCache:true});
const dir=path.join(ROOT,'src/sanity/tools/lecture-generator');
const d=await jiti.import(path.join(dir,'draft-persistence.ts')),p=await jiti.import(path.join(dir,'publication.ts')),m=await jiti.import(path.join(dir,'model.ts'));
const {validateMonthDocument}=await jiti.import(path.join(dir,'month-document.ts'));
const {useDraftWorkflow}=await jiti.import(path.join(dir,'useDraftWorkflow.ts'));
const {usePublicationWorkflow}=await jiti.import(path.join(dir,'usePublicationWorkflow.ts'));
const source=JSON.parse(fs.readFileSync(path.join(ROOT,'docs/LECTURE-FIRST-SAVE-APPROVED.json'),'utf8'));
async function harness(){
 const dom=new JSDOM('<div id="root"></div>');globalThis.window=dom.window;globalThis.document=dom.window.document;globalThis.IS_REACT_ACT_ENVIRONMENT=true;
 const draft={...clone(source.plan.payload),_rev:'qa-reviewed'};
 const images=source.plan.assets.map(a=>({_id:a.assetId,_type:'sanity.imageAsset'}));
 const client=publicationMemory([draft,...images]);const validate=async doc=>validateMonthDocument(doc);
 const adapter={load:(y,mo)=>d.loadMonth(client,y,mo),prepare:(...a)=>d.prepareSave(client,...a),save:(plan,base)=>d.saveDraft(client,plan,base,validate),
 preparePublication:(base,y,mo)=>p.preparePublication(client,base,y,mo,validate),publish:(plan,confirmation)=>p.publishReviewedMonth(client,plan,confirmation,validate)};
 let state;
 function Harness(){
  const [schedule,setSchedule]=React.useState({year:2026,month:10,entries:[]}),[showInfaq,setInfaq]=React.useState(true);
  const draft=useDraftWorkflow(adapter,schedule,[],{...m.defaultPosterSettings,showInfaq},loaded=>{setSchedule(loaded.schedule);setInfaq(loaded.showInfaq);},(y,mo)=>setSchedule({year:y,month:mo,entries:[]}));
  const publication=usePublicationWorkflow(adapter,draft,schedule,showInfaq);
  state={draft,publication,schedule,edit:()=>setSchedule(s=>({...s,entries:s.entries.map((e,i)=>i?e:{...e,sessions:e.sessions.map((session,j)=>j?session:{...session,topic:'Unsaved simulator change'})})})),infaq:setInfaq};
  return React.createElement('div',null,React.createElement('p',null,draft.status),React.createElement('button',{disabled:!publication.enabled,onClick:()=>publication.openConfirmation()},'Publish Jadual'));
 }
 const root=createRoot(document.getElementById('root'));
 await React.act(async()=>root.render(React.createElement(Harness)));
 const settle=()=>React.act(async()=>{await new Promise(r=>setTimeout(r,25));});
 await settle();
 return {client,get state(){return state;},settle,async close(){await React.act(async()=>root.unmount());dom.window.close();delete globalThis.window;delete globalThis.document;delete globalThis.IS_REACT_ACT_ENVIRONMENT;}};
}
test('real hooks require confirmation, cancel is read-only, double confirmation publishes once and Published→edit→draft works',async()=>{
 const h=await harness();try {
  assert.equal(h.state.publication.enabled,true);assert.equal(h.state.draft.status,'Draft saved');
  await React.act(async()=>h.state.publication.confirm());assert.equal(h.client.calls.actions.length,0);
  await React.act(async()=>h.state.publication.openConfirmation());assert.equal(h.state.publication.phase,'confirming');assert.equal(h.state.publication.locked,true);
  assert.equal(h.state.publication.confirmation.sessions,34);
  await React.act(async()=>h.state.publication.cancel());assert.equal(h.client.calls.actions.length,0);
  await React.act(async()=>h.state.publication.openConfirmation());
  await React.act(async()=>{const click=h.state.publication.confirm;await Promise.all([click(),click()]);});await h.settle();
  assert.equal(h.client.calls.actions.length,1);assert.equal(h.state.draft.status,'Published');assert.equal(h.state.publication.enabled,false);assert.equal(h.state.draft.state.loaded.base.draft,null);
  await React.act(async()=>h.state.edit());assert.equal(h.state.draft.status,'Unsaved changes');assert.equal(h.state.publication.enabled,false);
  const published=clone(h.state.draft.state.loaded.base.published);await React.act(async()=>h.state.draft.save());await h.settle();
  assert.equal(h.state.draft.status,'Draft saved');assert.equal(h.state.publication.enabled,true);assert.deepEqual(h.client.store.get(published._id),published);assert.equal(h.client.calls.uploads.length,0);
 } finally {await h.close();}
});
test('unsaved edits disable immediately and invalidate an open confirmation without autosave/publication',async()=>{
 const h=await harness();try {
  await React.act(async()=>h.state.edit());assert.equal(h.state.publication.enabled,false);assert.match(h.state.publication.reason,/Unsaved changes/);
  await React.act(async()=>h.state.publication.openConfirmation());assert.equal(h.client.calls.actions.length,0);
  await React.act(async()=>h.state.draft.reloadForReview());await React.act(async()=>h.state.draft.useRemote());await h.settle();
  await React.act(async()=>h.state.publication.openConfirmation());const staleConfirm=h.state.publication.confirm;
  await React.act(async()=>h.state.infaq(false));assert.equal(h.state.publication.confirmation,undefined);
  await React.act(async()=>staleConfirm());assert.equal(h.client.calls.actions.length,0);
 } finally {await h.close();}
});
test('stale revision between confirmation and submit preserves local editor and surfaces conflict',async()=>{
 const h=await harness();try {
  await React.act(async()=>h.state.publication.openConfirmation());const before=clone(h.state.schedule);
  h.client.store.get('drafts.lectureMonth-2026-10')._rev='another-editor';
  await React.act(async()=>h.state.publication.confirm());assert.equal(h.state.publication.phase,'conflict');assert.equal(h.state.publication.enabled,false);
  assert.deepEqual(h.state.schedule,before);assert.equal(h.client.calls.actions.length,0);
 } finally {await h.close();}
});
test('unverified network failure cannot show Published; explicit reload/review recovers safe eligibility without retry',async()=>{
 const h=await harness();try {
  await React.act(async()=>h.state.publication.openConfirmation());h.client.beforeAction=()=>{throw Error('Network failure');};
  await React.act(async()=>h.state.publication.confirm());assert.equal(h.state.publication.phase,'uncertain');assert.equal(h.state.publication.locked,true);
  assert.equal(h.state.draft.status,'Draft saved');assert.equal(h.client.calls.actions.length,1);
  await React.act(async()=>h.state.publication.confirm());assert.equal(h.client.calls.actions.length,1);
  await React.act(async()=>h.state.draft.reloadForReview());await React.act(async()=>h.state.draft.useRemote());await h.settle();
  assert.equal(h.state.publication.phase,'ready');assert.equal(h.client.calls.actions.length,1);
 } finally {await h.close();}
});
test('publication progress locks the editor and cancel/second-click cannot bypass the single-use confirmation',async()=>{
 const h=await harness();let release;
 try {
  await React.act(async()=>h.state.publication.openConfirmation());
  const waiting=new Promise(r=>{release=r;});h.client.beforeAction=()=>waiting;
  let operation;
  await React.act(async()=>{operation=h.state.publication.confirm();await new Promise(r=>setTimeout(r,10));});
  assert.equal(h.state.publication.phase,'publishing');assert.equal(h.state.publication.locked,true);assert.match(h.state.publication.reason,/Publishing Jadual/);
  await React.act(async()=>{h.state.publication.cancel();await h.state.publication.confirm();});
  assert.equal(h.state.publication.phase,'publishing');assert.equal(h.client.calls.actions.length,1);
  await React.act(async()=>{release();await operation;});await h.settle();assert.equal(h.state.draft.status,'Published');
 } finally {release?.();await h.close();}
});
test('remote schema/reference failure disables the real hook with an explanation and never dispatches',async()=>{
 const h=await harness();try{
  h.client.store.delete(source.plan.assets[0].assetId);
  await React.act(async()=>h.state.publication.recheck());await h.settle();
  assert.equal(h.state.publication.enabled,false);assert.equal(h.state.publication.phase,'error');assert.match(h.state.publication.reason,/Unresolved/);
  await React.act(async()=>h.state.publication.openConfirmation());assert.equal(h.client.calls.actions.length,0);
 }finally{await h.close();}
});
