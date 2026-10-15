// Local CLI/test code only. Never import from application/runtime code.
import {createHash, randomUUID} from 'node:crypto';
import {config, slug, text} from './fixtures.mjs';
const quote = value => "'" + String(value).replaceAll("'", "''") + "'";
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const names = ['owner','admin','staff','disabled','revoked','outsider','invitee','other','rollback'];
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
export function assertLocalDockerEndpoint(endpoint) {
 if(typeof endpoint!=='string' || !/^(npipe:\/\/\/\/\.\/pipe\/[^/]+|unix:\/\/\/[^\r\n]+)$/.test(endpoint)) throw Error('Fixture tools require a local Docker pipe/socket; remote Docker is denied');
}
export function assertLocalEnvironment(env = process.env) {
 if (env.NODE_ENV === 'production' || env.VERCEL || (env.ADMIN_SUPABASE_ENV && env.ADMIN_SUPABASE_ENV !== 'local')) throw Error('Fixture tools are local/review only');
 for (const key of ['SUPABASE_URL','NEXT_PUBLIC_SUPABASE_URL']) if (env[key] && env[key] !== 'http://127.0.0.1:54321') throw Error('Fixture tools reject non-local database/API configuration');
 if(env.DOCKER_HOST)assertLocalDockerEndpoint(env.DOCKER_HOST);
}
export function planSession() {
 return {version:1,project:'mtu-admin-local',session:randomUUID(),campaign:randomUUID(),akad:randomUUID(),bootstrap:randomUUID(),factor:randomUUID(),
 users:Object.fromEntries(names.map(n=>[n,{id:randomUUID(),session:randomUUID(),identity:randomUUID(),amr:randomUUID()}]))};
}
export function validatePlan(p) {
 const valid = p && p.version===1 && p.project==='mtu-admin-local' && Object.keys(p).sort().join()===['version','project','session','campaign','akad','bootstrap','factor','users'].sort().join()
  && ['session','campaign','akad','bootstrap','factor'].every(k=>uuid.test(p[k]))
  && p.users && Object.keys(p.users).sort().join()===names.slice().sort().join()
  && names.every(n=>Object.keys(p.users[n]).sort().join()==='amr,id,identity,session' && Object.values(p.users[n]).every(v=>uuid.test(v)));
 if (!valid) throw Error('Invalid fixture ownership plan');
 const ids=[p.session,p.campaign,p.akad,p.bootstrap,p.factor,...Object.values(p.users).flatMap(u=>Object.values(u))];
 if (new Set(ids).size!==ids.length) throw Error('Fixture identities must be distinct');
 return p;
}
const marker = p => 'LOCAL-REVIEW:'+p.session+':'+hash(p);
const list = ids => '('+ids.map(quote).join(',')+')';
const tables = p => [
 ['private.campaigns','id', [p.campaign]],['private.qurban_akad_versions','id',[p.akad]],
 ['private.system_feature_flags','flag_key',['campaigns.enabled','qurban.enabled']],
 ['private.admin_audit_log','id',[p.bootstrap]],
 ['public.admin_profiles','user_id',names.filter(n=>['owner','admin','staff','disabled','revoked'].includes(n)).map(n=>p.users[n].id)],
 ['auth.users','id',names.map(n=>p.users[n].id)],['auth.identities','id',names.map(n=>p.users[n].identity)],
 ['auth.sessions','id',names.map(n=>p.users[n].session)],['auth.mfa_factors','id',[p.factor]],
 ['auth.mfa_amr_claims','id',names.map(n=>p.users[n].amr)],
];
export function evidenceSql(p) {
 validatePlan(p);
 return 'select jsonb_build_object('+tables(p).map(([table,key,ids])=>quote(table)+`,(select coalesce(jsonb_object_agg(${key}::text,encode(sha256(convert_to(to_jsonb(t)::text,'UTF8')),'hex')),'{}'::jsonb) from ${table} t where ${key} in ${list(ids)})`).join(',')+') evidence';
}
export function setupSql(p, claims) {
 validatePlan(p);
 let body='';
 for(const n of names){const u=p.users[n],email='local-'+n+'@example.test',subject='local-google-'+n;
 body+=`insert into auth.users(id,aud,role,email,email_confirmed_at,created_at,updated_at,raw_app_meta_data,raw_user_meta_data,is_anonymous,instance_id,confirmation_token,recovery_token,email_change_token_new,email_change,encrypted_password)
 values(${quote(u.id)},'authenticated','authenticated',${quote(email)},now(),now(),now(),'{"provider":"google","providers":["google"]}','{}',false,'00000000-0000-0000-0000-000000000000','','','','','');
 insert into auth.identities(id,user_id,provider,provider_id,identity_data,created_at,updated_at) values(${quote(u.identity)},${quote(u.id)},'google',${quote(subject)},${quote(JSON.stringify({sub:subject,email,email_verified:true}))},now(),now());
 insert into auth.sessions(id,user_id,created_at,updated_at,aal) values(${quote(u.session)},${quote(u.id)},now(),now(),'aal1');
 insert into auth.mfa_amr_claims(id,session_id,created_at,updated_at,authentication_method) values(${quote(u.amr)},${quote(u.session)},now(),now(),'oauth');`;
 if(['owner','admin','staff','disabled','revoked'].includes(n))body+=`insert into public.admin_profiles(user_id,approved_email,google_subject,role,status) values(${quote(u.id)},${quote(email)},${quote(subject)},${quote(n==='owner'?'super_admin':n==='admin'?'admin':'staff')},${quote(['disabled','revoked'].includes(n)?n:'active')});`;
 }
 return `begin; set local lock_timeout='5s'; set local statement_timeout='30s';
 lock table ${tables(p).map(t=>t[0]).join(',')} in access exclusive mode;
 do $$ begin if exists(select 1 from private.campaigns) or exists(select 1 from private.system_feature_flags) or exists(select 1 from auth.users) or exists(select 1 from public.admin_profiles) or exists(select 1 from private.admin_audit_log) or exists(select 1 from private.admin_invites) then raise exception 'Fixture setup requires an empty local database'; end if; end $$;
 ${body}
 insert into private.admin_audit_log(id,action,actor_aal,new_role,new_status,target_id) values(${quote(p.bootstrap)},'bootstrap','system','super_admin','active',${quote(p.users.owner.id)});
 insert into auth.mfa_factors(id,user_id,friendly_name,factor_type,status,secret,created_at,updated_at) values(${quote(p.factor)},${quote(p.users.owner.id)},'LOCAL SQL FIXTURE','totp','verified','LOCAL-ONLY-UNUSABLE-FIXTURE',now(),now());
 select set_config('request.jwt.claims',${quote(JSON.stringify(claims))},true);
 insert into private.campaigns(id,type_key,config_version,slug,title,configuration,status,visibility,registration_opens_at,registration_closes_at)
 values(${quote(p.campaign)},'qurban',1,${quote(slug)},'UJIAN TEMPATAN — Qurban / Aqiqah',${quote(JSON.stringify(config))},'open','public',clock_timestamp()-interval '1 hour',clock_timestamp()+interval '2 days');
 insert into private.system_feature_flags(flag_key,enabled) values('campaigns.enabled',true),('qurban.enabled',true);
 insert into private.qurban_akad_versions(id,campaign_id,version_reference,approved_text,approved_by,approval_reference)
 values(${quote(p.akad)},${quote(p.campaign)},${quote(config.approved_akad_version)},${quote(text)},${quote(p.users.admin.id)},${quote(marker(p))});
 ${evidenceSql(p)}; commit;`;
}
const guards=[['private.qurban_submission_audit','qurban_submission_audit_guard'],['private.qurban_submission_idempotency','qurban_submission_idempotency_guard'],
 ['private.qurban_consent_acceptances','qurban_consent_guard'],['private.qurban_participations','qurban_participation_guard'],['private.qurban_registrations','qurban_registration_guard'],
 ['private.qurban_akad_versions','qurban_akad_guard'],['private.campaigns','campaign_row_guard'],['private.system_feature_flags','system_flag_row_guard'],['private.admin_audit_log','immutable_admin_audit']];
export function cleanupSql(p, evidence) {
 validatePlan(p);
 if (!evidence || Object.keys(evidence).sort().join()!==tables(p).map(t=>t[0]).sort().join()
  || tables(p).some(([t,,ids])=>Object.keys(evidence[t]??{}).sort().join()!==ids.slice().sort().join() || Object.values(evidence[t]).some(v=>!/^[0-9a-f]{64}$/.test(v)))) throw Error('Missing/incomplete fixture ownership evidence; no deletion permitted');
 const users=list(names.map(n=>p.users[n].id)),sessions=list(names.map(n=>p.users[n].session));
 const regs=`select id from private.qurban_registrations where campaign_id=${quote(p.campaign)}`;
 const checks=guards.map(([t,g])=>`if not exists(select 1 from pg_trigger where tgrelid=${quote(t)}::regclass and tgname=${quote(g)} and tgenabled='O') then raise exception 'Unexpected guard state'; end if;`).join('\n');
 return `begin; set local lock_timeout='5s'; set local statement_timeout='30s';
 lock table ${[...new Set([...tables(p).map(t=>t[0]),...guards.map(t=>t[0]),'private.admin_invites'])].join(',')} in access exclusive mode;
 do $cleanup$ declare actual jsonb; c record; found boolean; begin
 if not exists(select 1 from private.campaigns where id=${quote(p.campaign)}) then
  if exists(select 1 from auth.users where id in ${users}) or exists(select 1 from private.qurban_akad_versions where id=${quote(p.akad)}) or exists(select 1 from private.admin_audit_log where id=${quote(p.bootstrap)}) then raise exception 'Partial/mismatched fixture ownership'; end if;
  return;
 end if;
 if not exists(select 1 from private.qurban_akad_versions where id=${quote(p.akad)} and campaign_id=${quote(p.campaign)} and approval_reference=${quote(marker(p))}) then raise exception 'Fixture session marker mismatch'; end if;
 select evidence into actual from (${evidenceSql(p)}) e;
 if actual<>${quote(JSON.stringify(evidence))}::jsonb then raise exception 'Fixture ownership evidence changed; refusing cleanup'; end if;
 if exists(select 1 from private.campaigns where id<>${quote(p.campaign)}) then raise exception 'Shared fixture flags/identities may be in use by another campaign'; end if;
 if exists(select 1 from private.qurban_akad_versions where campaign_id=${quote(p.campaign)} and id<>${quote(p.akad)})
  or exists(select 1 from private.admin_audit_log where id<>${quote(p.bootstrap)} and (actor_id in ${users} or target_id in ${users} or campaign_id=${quote(p.campaign)} or flag_key in ('campaigns.enabled','qurban.enabled')))
  or exists(select 1 from private.admin_invites where invited_by in ${users} or accepted_by in ${users}) then raise exception 'Unowned administrative dependencies; refusing cleanup'; end if;
 if (select count(*) from auth.identities where user_id in ${users})<>9 or (select count(*) from auth.sessions where user_id in ${users})<>9
  or (select count(*) from auth.mfa_factors where user_id in ${users})<>1 or (select count(*) from auth.mfa_amr_claims where session_id in ${sessions})<>9 then raise exception 'Unowned Auth dependency; refusing cleanup'; end if;
 -- Unknown Auth cascades must not silently remove records outside the recorded fixture graph.
 for c in select conrelid::regclass relation,a.attname column_name,confrelid::regclass parent from pg_constraint k
 join pg_attribute a on a.attrelid=k.conrelid and a.attnum=k.conkey[1]
 where contype='f' and confrelid in ('auth.users'::regclass,'auth.sessions'::regclass,'auth.mfa_factors'::regclass,'auth.identities'::regclass)
 and conrelid not in ('public.admin_profiles'::regclass,'auth.identities'::regclass,'auth.sessions'::regclass,'auth.mfa_factors'::regclass,'auth.mfa_amr_claims'::regclass) loop
 execute format('select exists(select 1 from %s where %I::text = any($1))',c.relation,c.column_name) into found
 using array[${[...names.flatMap(n=>[p.users[n].id,p.users[n].session,p.users[n].identity]),p.factor].map(quote).join(',')}]::text[];
 if found then raise exception 'Unknown Auth dependency; refusing cleanup'; end if;
 end loop;
 ${checks}
 ${guards.map(([t,g])=>`alter table ${t} disable trigger ${g};`).join('\n')}
 delete from private.qurban_submission_audit where registration_id in (${regs});
 delete from private.qurban_submission_idempotency where registration_id in (${regs});
 delete from private.qurban_consent_acceptances where registration_id in (${regs});
 delete from private.qurban_participations where registration_id in (${regs});
 delete from private.qurban_registrations where campaign_id=${quote(p.campaign)};
 delete from private.qurban_akad_versions where id=${quote(p.akad)};
 delete from private.campaigns where id=${quote(p.campaign)};
 delete from private.system_feature_flags where flag_key in ('campaigns.enabled','qurban.enabled');
 delete from private.admin_audit_log where id=${quote(p.bootstrap)};
 delete from public.admin_profiles where user_id in ${users};
 delete from auth.mfa_amr_claims where id in ${list(names.map(n=>p.users[n].amr))};
 delete from auth.mfa_factors where id=${quote(p.factor)};
 delete from auth.identities where id in ${list(names.map(n=>p.users[n].identity))};
 delete from auth.sessions where id in ${sessions};
 delete from auth.users where id in ${users};
 ${guards.map(([t,g])=>`alter table ${t} enable trigger ${g};`).join('\n')}
 end $cleanup$; commit;`;
}
