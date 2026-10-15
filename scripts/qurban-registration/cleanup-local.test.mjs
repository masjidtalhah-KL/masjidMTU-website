// Real PostgreSQL cleanup smoke test in a new disposable database, never in the owner's demo database.
import test from 'node:test';import assert from 'node:assert/strict';
import {execFileSync,spawnSync} from 'node:child_process';import {randomUUID} from 'node:crypto';
import {dbContainer,sql as ownerSql} from '../admin-foundation/local-stack.mjs';
import {reviewStack} from './review-fixture.mjs';
import {planSession,setupSql,cleanupSql} from './fixture-session.mjs';
import {request,slug} from './fixtures.mjs';
test('real local PostgreSQL: atomic setup, genuine admission, selective cleanup, repeat, guards; owner DB untouched',()=>{
 reviewStack();
 const fingerprint=()=>ownerSql("select encode(sha256(convert_to(jsonb_build_object('campaigns',(select jsonb_agg(to_jsonb(t)) from (select * from private.campaigns order by id)t),'flags',(select jsonb_agg(to_jsonb(t)) from (select * from private.system_feature_flags order by flag_key)t),'registrations',(select jsonb_agg(to_jsonb(t)) from (select * from private.qurban_registrations order by id)t),'auth',(select jsonb_agg(to_jsonb(t)) from (select * from auth.users order by id)t))::text,'UTF8')),'hex')");
 const before=fingerprint(),name='qurban_cleanup_test_'+randomUUID().replaceAll('-','');
 assert.match(name,/^qurban_cleanup_test_[0-9a-f]{32}$/);let created=false;
 const run=s=>{const r=spawnSync('docker',['exec','-i',dbContainer,'psql','-U','postgres','-d',name,'-Atq','-v','ON_ERROR_STOP=1'],{input:s,encoding:'utf8',maxBuffer:16*1024*1024});
  if(r.status!==0)throw Error('Isolated local cleanup test failed: '+r.stderr.split('\n').filter(l=>l.startsWith('ERROR:')).join(' '));return r.stdout.trim();};
 const lastJson=s=>JSON.parse(run(s).split('\n').at(-1));
 try{
  ownerSql('create database '+name);created=true;
  const schema=execFileSync('docker',['exec',dbContainer,'pg_dump','-U','postgres','-d','postgres','--schema-only','--schema=auth','--schema=private','--schema=public','--no-owner'],{encoding:'utf8',maxBuffer:16*1024*1024});
  // Existing object ACLs are retained. Auth-owner defaults cannot be changed by the local migration role;
  // this test creates no further Auth functions/tables after the schema restore.
  run('drop schema public;'+schema.split('\n').filter(l=>!l.startsWith('ALTER DEFAULT PRIVILEGES ')).join('\n'));
  run("insert into private.campaign_type_descriptors values('qurban',1,'qurban.enabled','qurban_config_v1_valid')");
  const p=planSession(),now=Math.floor(Date.now()/1000),claims={sub:p.users.owner.id,role:'authenticated',session_id:p.users.owner.session,aal:'aal2',amr:[{method:'oauth',timestamp:now},{method:'totp',timestamp:now}]};
  const evidence=lastJson(setupSql(p,claims));
  const c=lastJson("select public.public_qurban_registration_context('"+slug+"')");
  for(const n of [3,1])assert.equal(lastJson("select public.public_qurban_registration_submit('"+JSON.stringify(request(c,n)).replaceAll("'","''")+"'::jsonb)").participant_count,n);
  const counts=()=>lastJson(`select jsonb_build_object('campaigns',(select count(*) from private.campaigns),'flags',(select count(*) from private.system_feature_flags),
   'registrations',(select count(*) from private.qurban_registrations),'participations',(select count(*) from private.qurban_participations),'consents',(select count(*) from private.qurban_consent_acceptances),
   'audit',(select count(*) from private.qurban_submission_audit),'idempotency',(select count(*) from private.qurban_submission_idempotency),'akad',(select count(*) from private.qurban_akad_versions),
   'users',(select count(*) from auth.users),'profiles',(select count(*) from public.admin_profiles),'admin_audit',(select count(*) from private.admin_audit_log))`);
  assert.deepEqual(counts(),{campaigns:1,flags:2,registrations:2,participations:4,consents:2,audit:2,idempotency:2,akad:1,users:9,profiles:5,admin_audit:1});
  run(cleanupSql(p,evidence));assert(Object.values(counts()).every(n=>n===0));run(cleanupSql(p,evidence));assert(Object.values(counts()).every(n=>n===0));
  assert.equal(run("select count(*) from private.campaign_type_descriptors"),'1');
  assert.equal(run("select count(*) from pg_trigger where not tgisinternal and tgenabled<>'O'"),'0');
  assert.equal(fingerprint(),before);
 }finally{if(created)ownerSql('drop database '+name);}
 assert.equal(fingerprint(),before);
});
