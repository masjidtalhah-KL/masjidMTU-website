import {execFileSync} from 'node:child_process';import {pathToFileURL} from 'node:url';
import {mkdirSync,readFileSync,writeFileSync,renameSync,openSync,closeSync,unlinkSync} from 'node:fs';import path from 'node:path';
import {root} from '../admin-foundation/database.mjs';
import {localStack,sql,rows,signedToken,quote} from '../admin-foundation/local-stack.mjs';import {slug} from './fixtures.mjs';
import {assertLocalEnvironment,assertLocalDockerEndpoint,planSession,setupSql,cleanupSql,validatePlan} from './fixture-session.mjs';
export function reviewStack(){
 assertLocalEnvironment();
 const context=JSON.parse(execFileSync('docker',['context','inspect'],{encoding:'utf8',stdio:['ignore','pipe','pipe']}))[0];
 assertLocalDockerEndpoint(context?.Endpoints?.docker?.Host);
 return localStack();
}
export const manifestPath=path.join(root,'.cache/qurban-review-session.json');
export function exclusive(fn){
 mkdirSync(path.dirname(manifestPath),{recursive:true});
 let fd;try{fd=openSync(manifestPath+'.lock','wx');}catch{throw Error('Another fixture command is active (or its local lock needs manual inspection)');}
 try{return fn();}finally{closeSync(fd);unlinkSync(manifestPath+'.lock');}
}
export function setup(){
 const stack=reviewStack();
 return exclusive(()=>{
  if(rows(`select exists(select 1 from private.campaigns) or exists(select 1 from private.system_feature_flags) or exists(select 1 from auth.users) or exists(select 1 from public.admin_profiles) or exists(select 1 from private.admin_audit_log) or exists(select 1 from private.admin_invites) occupied`)[0].occupied)throw Error('Review fixture requires an empty disposable local database; existing/untracked data will not be adopted or overwritten');
  const plan=planSession(),users=Object.fromEntries(Object.entries(plan.users).map(([n,u])=>[n,{...u,email:'local-'+n+'@example.test',subject:'local-google-'+n}]));
  const now=Math.floor(Date.now()/1000),token=signedToken(stack,users.owner,{aal:'aal2',amr:[{method:'oauth',timestamp:now},{method:'totp',timestamp:now}]});
  const claims=JSON.parse(Buffer.from(token.split('.')[1],'base64url').toString());
  // The plan is written before the single atomic setup transaction. Incomplete evidence fails closed.
  writeFileSync(manifestPath,JSON.stringify({plan,evidence:null}),{mode:0o600});
  const output=sql(setupSql(plan,claims));const evidence=JSON.parse(output.split('\n').at(-1));
  writeFileSync(manifestPath+'.tmp',JSON.stringify({plan,evidence}),{mode:0o600});renameSync(manifestPath+'.tmp',manifestPath);
  return {stack,users,campaign:plan.campaign};
 });
}
export function inspect(){reviewStack();const counts=rows(`select
 (select count(*) from private.campaign_type_descriptors) descriptors,
 (select count(*) from private.campaigns) campaigns,(select count(*) from private.system_feature_flags) flags,
 (select count(*) from private.qurban_registrations) registrations,(select count(*) from private.qurban_participations) participations,
 (select count(*) from private.qurban_akad_versions) akad_versions,(select count(*) from private.qurban_consent_acceptances) consents,
 (select count(*) from private.qurban_submission_audit) audit,(select count(*) from private.qurban_submission_idempotency) idempotency,
 (select count(*) from auth.users) auth_fixture_users,
 (select count(*) from private.qurban_operational_audit) operational_audit,
 (select count(*) from private.qurban_export_requests) export_requests,
 (select count(*) from private.qurban_cattle) cattle,(select count(*) from private.qurban_cattle_slots) cattle_slots,
 (select count(*) from private.qurban_allocations) allocations,
 (select count(*) from private.qurban_volunteers) volunteers,(select count(*) from private.qurban_volunteer_assignment_labels) volunteer_labels,
 (select count(*) from private.qurban_payment_access) payment_access,
 (select count(*) from private.qurban_payment_sessions) payment_sessions,
 (select count(*) from private.qurban_proof_intents) proof_intents,
 (select count(*) from private.qurban_payment_proofs) payment_proofs,
 (select count(*) from private.qurban_payments) verified_payments,
 (select count(*) from private.qurban_receipts) receipts,
 (select count(*) from private.qurban_receipt_counters) receipt_counters,
 (select count(*) from private.qurban_payment_audit) payment_audit,
 (select count(*) from private.qurban_proof_download_grants) proof_download_grants,
 (select count(*) from storage.objects where bucket_id='qurban-payment-proofs') proof_objects,
 (select count(*) from private.qurban_volunteer_audit) volunteer_audit,(select count(*) from private.qurban_volunteer_idempotency) volunteer_idempotency`)[0];
 const evidence=rows(`select r.public_reference,r.status,r.quoted_currency,r.quoted_price_per_share_minor,r.quoted_total_minor,r.quoted_participation_count,
 (select count(*) from private.qurban_participations p where p.registration_id=r.id) inserted_participations,
 (select count(*) from private.qurban_consent_acceptances a where a.registration_id=r.id) consent_count,
 (select count(*) from private.qurban_submission_audit a where a.registration_id=r.id) audit_count,
 exists(select 1 from private.qurban_consent_acceptances a join private.qurban_akad_versions v on v.id=a.akad_version_id where a.registration_id=r.id and a.accepted_content_hash=v.content_hash and v.content_hash=encode(sha256(convert_to(v.approved_text,'UTF8')),'hex')) immutable_consent_hash_valid,
 r.quoted_total_minor=(r.submission_configuration->>'price_per_cattle_share_minor')::bigint*r.quoted_participation_count quote_matches_snapshot,
 exists(select 1 from private.qurban_consent_acceptances a join private.qurban_akad_versions v on v.id=a.akad_version_id
 where a.registration_id=r.id and a.accepted_content_hash=v.content_hash and v.content_hash=encode(sha256(convert_to(v.approved_text,'UTF8')),'hex')
 and jsonb_array_length(a.participation_snapshot)=r.quoted_participation_count
 and not exists(select 1 from jsonb_array_elements(a.participation_snapshot) e where not exists(select 1 from private.qurban_participations p
 where p.registration_id=r.id and p.id=(e->>'id')::uuid and p.participant_name=e->>'participant_name' and p.purpose=e->>'purpose' and p.version=(e->>'version')::integer))) consent_evidence_matches
 from private.qurban_registrations r order by r.created_at desc,r.id limit 20`);
 return {...counts,registration_evidence:evidence};}
// Existing isolated regression suites intentionally require a full no-seed reset (including test-only descriptors).
export function reset(){reviewStack();execFileSync(process.execPath,['scripts/admin-foundation/local-cli.mjs','db','reset','--local','--no-seed'],{stdio:'pipe'});}
export function cleanup(){
 reviewStack();
 return exclusive(()=>{
  let manifest;try{const raw=readFileSync(manifestPath,'utf8');if(Buffer.byteLength(raw)>32768)throw Error();manifest=JSON.parse(raw);}catch{throw Error('No valid fixture ownership manifest; nothing deleted. Untracked/legacy fixtures require the explicit local reset fallback');}
  if(Object.keys(manifest).sort().join()!=='evidence,plan')throw Error('Invalid fixture manifest');
  validatePlan(manifest.plan);
  const cleanup=cleanupSql(manifest.plan,manifest.evidence);
  // Dry-run ALL ownership/guard/Auth checks before touching a byte in separate Storage.
  sql(cleanup.replace(/commit;$/, 'rollback;'));
  const graph=`select encode(sha256(convert_to(coalesce(jsonb_agg(to_jsonb(i) order by i.id),'[]'::jsonb)::text,'UTF8')),'hex') fingerprint from private.qurban_proof_intents i where campaign_id=${quote(manifest.plan.campaign)}`;
  const fingerprint=rows(graph)[0].fingerprint;
  const objects=rows(`select id,object_key,content_hash,byte_size,content_type from private.qurban_proof_intents where campaign_id=${quote(manifest.plan.campaign)} order by id`);
  execFileSync(process.execPath,['scripts/qurban-payment/storage-cleanup.mjs'],{input:JSON.stringify({campaign:manifest.plan.campaign,objects}),stdio:['pipe','pipe','pipe'],timeout:180000});
  // A concurrent changed intent graph fails closed; retained DB evidence permits retry.
  const assertion=`do $$begin if (${graph.replace(' fingerprint','')})<>${quote(fingerprint)} then raise exception 'Fixture proof graph changed during cleanup';end if;end $$;`;
  sql(cleanup.replace(' do $cleanup$', ()=> ' '+assertion+' do $cleanup$'));
  return {session:manifest.plan.session,cleanup:'complete (repeat calls are safe no-ops)'};
 });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{
 const command=process.argv[2];if(command==='setup'){setup();console.log('Synthetic local fixture ready: http://localhost:3082/kempen/'+slug);}
 else if(command==='inspect')console.log(JSON.stringify(inspect()));else if(command==='cleanup'){console.log(JSON.stringify(cleanup()));console.log(JSON.stringify(inspect()));}
 else throw Error('Use setup | inspect | cleanup. Full reset is a separate explicit local-cli command. Only the configured disposable local stack is allowed.');
 }catch(error){console.error(error.message);process.exitCode=1;}
}
