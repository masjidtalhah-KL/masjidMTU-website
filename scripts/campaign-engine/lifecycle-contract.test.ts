import test from 'node:test';
import assert from 'node:assert/strict';
import {campaignWindowResult,lifecycleActions,lifecycleCommand,scheduleCommand,campaignId,campaignManager,lifecycleResult} from '../../src/lib/campaigns/lifecycle-contract';
import {AdminError} from '../../src/lib/admin/policy';
import {readLifecycleBody} from '../../src/lib/campaigns/lifecycle-body';
const empty={registration_opens_at:null,registration_closes_at:null,event_starts_at:null,event_ends_at:null};
test('exact action contracts accept all seven commands, reject status/actor/override and invalid version',()=>{
  for(const action of lifecycleActions)assert.equal(lifecycleCommand({action,expectedVersion:1}).action,action);
  for(const value of [{status:'paused',expectedVersion:1},{action:'reopen',expectedVersion:1},{action:'pause',expectedVersion:1,actor:'scheduler'},
    {action:'pause',expectedVersion:0},{action:'pause',expectedVersion:1.5},{action:'pause',expectedVersion:2147483647}])assert.throws(()=>lifecycleCommand(value),e=>e instanceof AdminError && e.status===422);
});
test('schedule exact four fields requires finite timezone-aware instants',()=>{
  assert.deepEqual(scheduleCommand({expectedVersion:1,...empty}).windows,empty);
  assert.equal(scheduleCommand({expectedVersion:1,...empty,event_starts_at:'2027-01-01T00:00:00+08:00'}).windows.event_starts_at,'2027-01-01T00:00:00+08:00');
  for(const instant of ['2027-01-01','2027-01-01T00:00:00','infinity','2027-99-99T00:00:00Z',9])assert.throws(()=>scheduleCommand({expectedVersion:1,...empty,event_starts_at:instant}));
  assert.throws(()=>scheduleCommand({expectedVersion:1,...empty,actor_category:'scheduler'}));
});
test('campaign UUID boundary rejects malformed/noncanonical identity',()=>{
  assert.equal(campaignId('00000000-0000-4000-8000-000000000001'),'00000000-0000-4000-8000-000000000001');
  for(const id of ['../../users','fixture',null,1])assert.throws(()=>campaignId(id));
});
test('campaign manager capability remains distinct from owner-only access management',()=>{
  const state={user_id:'fixture',role:'admin',status:'active',aal:'aal1',has_totp:false,recent_mfa:false} as const;
  campaignManager(state);assert.throws(()=>campaignManager({...state,role:'staff'}),e=>e instanceof AdminError && e.status===403);
  assert.throws(()=>campaignManager({...state,role:'super_admin'}),e=>e instanceof AdminError && e.reason==='step-up');
  campaignManager({...state,role:'super_admin',aal:'aal2',has_totp:true,recent_mfa:true});
});
test('response projection retains only safe lifecycle fields',()=>{
  assert.deepEqual(lifecycleResult({id:'fixture',status:'open',version:2,changed:true,updated_by:'private'}),{id:'fixture',status:'open',version:2,changed:true});
  assert.throws(()=>lifecycleResult({id:'fixture',status:'invalid',version:2,changed:true}),e=>e instanceof AdminError && e.status===503);
});
test('lifecycle reader accepts max 1024 UTF-8 bytes and split multibyte text',async()=>{
  const bytes=new TextEncoder().encode('é'.repeat(512));const stream=new ReadableStream<Uint8Array>({start(c){c.enqueue(bytes.slice(0,1));c.enqueue(bytes.slice(1));c.close();}});
  assert.equal((await readLifecycleBody(stream)).length,512);
});
test('lifecycle reader cancels overflowing unfinished stream without buffering/requiring EOF',async()=>{
  let cancelled=false;
  const stream=new ReadableStream<Uint8Array>({start(c){c.enqueue(new Uint8Array(1025));},cancel(){cancelled=true;return new Promise(()=>{});}});
  await assert.rejects(readLifecycleBody(stream),e=>e instanceof AdminError && e.status===422);assert.equal(cancelled,true);
});
test('lifecycle reader rejects malformed UTF-8 and missing/read failures safely',async()=>{
  await assert.rejects(readLifecycleBody(null),e=>e instanceof AdminError && e.status===422);
  await assert.rejects(readLifecycleBody(new ReadableStream({start(c){c.enqueue(new Uint8Array([255]));c.close();}})),e=>e instanceof AdminError && e.status===422);
  await assert.rejects(readLifecycleBody(new ReadableStream({start(c){c.error(Error('internal'));}})),e=>e instanceof AdminError && e.status===422);
});

test('operational window DTO fails closed for malformed or contradictory availability',()=>{
  assert.deepEqual(campaignWindowResult({id:'fixture',status:'open',version:1,registrationAvailable:true,actor:'private'}),{id:'fixture',status:'open',version:1,registrationAvailable:true});
  for(const value of [null,{id:'fixture',status:'scheduled',version:1,registrationAvailable:true},{id:'fixture',status:'open',version:1}])assert.throws(()=>campaignWindowResult(value),e=>e instanceof AdminError && e.status===503);
});
