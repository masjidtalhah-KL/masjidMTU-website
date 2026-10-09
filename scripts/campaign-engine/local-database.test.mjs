import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';
import { localStack, fixtures, sql, rows, quote, signedToken, api, rpc, totp } from '../admin-foundation/local-stack.mjs';

// Genuine local PostgreSQL/Auth/PostgREST. Google identity is a SQL fixture, not
// OAuth evidence. Owner AAL2 is issued by real local Auth/TOTP, never fabricated.
let stack, users, ownerClient, ownerToken, createdFixtures = false;
const campaignId = randomUUID();
const token = (name, options) => signedToken(stack, users[name], options);
const ownerAal1 = () => token('owner');
const claims = auth => JSON.parse(Buffer.from(auth.split('.')[1], 'base64url'));
const context = auth => "select set_config('request.jwt.claims'," + quote(JSON.stringify(claims(auth))) + ',true);';
const transaction = (query, auth = token('admin')) => sql('begin;' + context(auth) + query + ';rollback;');
const deniedSql = (query, auth = token('admin'), message = /Access denied|permission denied/) => assert.throws(() => transaction(query, auth), message);
const insert = (extra = '', slug = 'isolated-schema-test') =>
  "insert into private.campaigns(type_key,slug,title" + (extra ? ',' + extra.split('=')[0] : '') + ") values ('local_fixture'," + quote(slug) + ",'Local fixture'" + (extra ? ',' + extra.slice(extra.indexOf('=') + 1) : '') + ')';
const testDescriptor = `
  create function private.local_fixture_configuration(data jsonb) returns boolean
    language sql immutable set search_path = '' as $$
    select jsonb_typeof(data) = 'object'
      and not exists (select 1 from jsonb_object_keys(data) k where k <> 'display_order')
      and (not data ? 'display_order' or (jsonb_typeof(data->'display_order') = 'number'
        and (data->>'display_order') ~ '^[0-9]{1,2}$'));
  $$;
  revoke all on function private.local_fixture_configuration(jsonb) from public, anon, authenticated, service_role, supabase_auth_admin;
  insert into private.campaign_type_descriptors values ('local_fixture',1,'local_fixture.enabled','local_fixture_configuration');
`;

before(async () => {
  stack = localStack(); users = fixtures(); createdFixtures = true;
  ownerClient = createClient(stack.url, stack.anon, {auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
  const link = await api(stack, '/auth/v1/admin/generate_link', {service:true,method:'POST',body:{type:'magiclink',email:users.owner.email}});
  assert.equal(link.status,200);
  const session = await api(stack, '/auth/v1/verify', {method:'POST',body:{token_hash:link.data.hashed_token,type:'magiclink'}});
  assert.equal(session.status,200);
  users.owner.session = claims(session.data.access_token).session_id;
  sql("insert into auth.mfa_amr_claims(id,session_id,created_at,updated_at,authentication_method) values (" + quote(randomUUID()) + ',' + quote(users.owner.session) + ",now(),now(),'oauth')");
  assert.equal((await ownerClient.auth.setSession({access_token:session.data.access_token,refresh_token:session.data.refresh_token})).error,null);
  assert.equal((await ownerClient.auth.refreshSession()).error,null);
  const factor = await ownerClient.auth.mfa.enroll({factorType:'totp',friendlyName:'Local campaign verification'});
  assert.equal(factor.error,null);
  const verified = await ownerClient.auth.mfa.challengeAndVerify({factorId:factor.data.id,code:totp(factor.data.totp.secret)});
  assert.equal(verified.error,null); ownerToken = verified.data.access_token;
});

after(async () => {
  await ownerClient?.auth.stopAutoRefresh();
  // Remove every descriptor/validator/identity fixture even after assertions fail.
  // fixtures() refuses a nonempty pre-existing local identity database.
  if (createdFixtures) {
    execFileSync(process.execPath, ['scripts/admin-foundation/local-cli.mjs','db','reset','--local','--no-seed'], {stdio:'pipe'});
    assert.equal(sql('select count(*) from private.campaign_type_descriptors;'),'0');
    assert.equal(sql('select count(*) from private.campaigns;'),'0');
    assert.equal(sql('select count(*) from private.system_feature_flags;'),'0');
    assert.equal(sql("select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='private' and p.proname like 'local_fixture%';"),'0');
  }
});

test('production migration state has zero descriptors/campaigns/flags; absent and future types fail closed', () => {
  for (const table of ['campaign_type_descriptors','campaigns','system_feature_flags']) assert.equal(sql('select count(*) from private.' + table),'0');
  for (const type of ['generic','qurban','ramadan','volunteer','unknown',null])
    deniedSql("insert into private.campaigns(type_key,slug,title) values (" + (type === null ? 'null' : quote(type)) + ",'blocked-type','Blocked')", token('admin'), /Unsupported campaign type/);
});

test('isolated migration-owned descriptor and audit fixtures install only in local test state', () => {
  sql('begin;' + testDescriptor + context(token('admin')) +
    "insert into private.campaigns(id,type_key,slug,title,created_by,updated_by,created_at,version) values (" + quote(campaignId) + ",'local_fixture','local-fixture','Local fixture'," + quote(users.owner.id) + ',' + quote(users.owner.id) + ",'1999-01-01Z',99);" +
    "select private.record_campaign_event('campaign.create'," + quote(campaignId) + ",null,0,1,'{\"to_status\":\"draft\",\"visibility\":\"private\",\"config_version\":1}');" +
    context(ownerToken) + "insert into private.system_feature_flags(flag_key,enabled) values ('campaigns.enabled',true);" +
    "select private.record_campaign_event('system_flag.enable',null,'campaigns.enabled',0,1,'{\"before_enabled\":false,\"after_enabled\":true}');" +
    "update private.system_feature_flags set enabled=false where flag_key='campaigns.enabled';" +
    "select private.record_campaign_event('system_flag.disable',null,'campaigns.enabled',1,2,'{\"before_enabled\":true,\"after_enabled\":false}');commit;");
  const row = rows('select * from private.campaigns')[0];
  assert.equal(row.created_by,users.admin.id); assert.equal(row.updated_by,users.admin.id); assert.equal(row.version,1);
  assert(!row.created_at.startsWith('1999')); assert.equal(row.visibility,'private');
  assert.equal(row.scheduled_public_display,false); assert.equal(row.archived_history_display,false);
});

for (const state of ['draft','scheduled','open','paused','closed','archived']) test('schema accepts lifecycle vocabulary ' + state, () => {
  transaction(insert("status,registration_opens_at=" + quote(state) + ",'2027-01-01T00:00:00Z'", 'state-' + state));
});
for (const visibility of ['private','public','unlisted']) test('schema accepts visibility ' + visibility, () => transaction(insert('visibility=' + quote(visibility))));
for (const [label, extra] of [
  ['invalid status',"status='enabled'"], ['invalid visibility',"visibility='internal'"], ['zero version','version=0'],
  ['negative version','version=-1'], ['unsupported schema version','schema_version=2'], ['unsupported config version','config_version=2'],
  ['scheduled without opens',"status='scheduled'"],
  ['reversed registration dates',"registration_opens_at,registration_closes_at='2027-02-01Z','2027-01-01Z'"],
  ['equal registration dates',"registration_opens_at,registration_closes_at='2027-01-01Z','2027-01-01Z'"],
  ['reversed event dates',"event_starts_at,event_ends_at='2027-02-01Z','2027-01-01Z'"],
  ['infinite date',"event_starts_at='infinity'"], ['array config',"configuration='[]'"],
  ['PII config',"configuration='{\"email\":\"person@example.test\"}'"], ['bad typed config',"configuration='{\"display_order\":\"secret\"}'"],
  ['oversized config',"configuration=jsonb_build_object('display_order',repeat('x',5000))"],
  ['partial editorial binding',"editorial_document_id='published-document'"],
  ['draft editorial ID',"editorial_project_id,editorial_dataset,editorial_document_type,editorial_document_id='abcdefgh','staging','program','drafts.abc'"],
  ['version editorial ID',"editorial_project_id,editorial_dataset,editorial_document_type,editorial_document_id='abcdefgh','staging','program','versions.abc'"],
  ['malformed editorial context',"editorial_project_id,editorial_dataset,editorial_document_type,editorial_document_id='bad','../prod','program','doc'"],
]) test('schema rejects ' + label, () => deniedSql(insert(extra),token('admin'),/Invalid campaign configuration|Unsupported campaign type|Positive version|violates check constraint/));

test('normalized slug uniqueness, uppercase/whitespace/reserved/invalid slugs denied', () => {
  deniedSql(insert('', 'local-fixture'),token('admin'),/unique constraint/);
  for (const slug of ['Local-Fixture',' local-fixture','local-fixture ','admin','a--b','../bad','ab'])
    deniedSql(insert('',slug),token('admin'),/check constraint/);
});
test('valid config/editorial binding accepted; duplicate binding denied', () => {
  const binding = "editorial_project_id,editorial_dataset,editorial_document_type,editorial_document_id='abcdefgh','staging','program','published-document'";
  transaction(insert(binding) + ';' + insert("configuration='{\"display_order\":3}'",'valid-config'));
  deniedSql(insert(binding) + ';' + insert(binding,'second-binding'),token('admin'),/unique constraint/);
});
test('server metadata/version, immutable UUID/type/creator, stable slug and terminal states', () => {
  transaction('update private.campaigns set title=\'Changed\',version=99 where id=' + quote(campaignId) + ";do $$ begin if (select version from private.campaigns where id=" + quote(campaignId) + ") <> 2 then raise exception 'version not derived'; end if; end $$");
  for (const mutation of ['id=gen_random_uuid()',"type_key='unknown'",'created_by=' + quote(users.owner.id),"created_at='1999-01-01Z'"])
    deniedSql('update private.campaigns set ' + mutation + ' where id=' + quote(campaignId), token('admin'), /Immutable campaign identity/);
  deniedSql("update private.campaigns set status='open' where id=" + quote(campaignId) + ";update private.campaigns set slug='changed-slug' where id=" + quote(campaignId),token('admin'),/Slug is stable/);
  deniedSql("update private.campaigns set status='scheduled',registration_opens_at='2027-01-01Z' where id=" + quote(campaignId) +
    ";update private.campaigns set status='draft',slug_locked_at=null where id=" + quote(campaignId) +
    ";update private.campaigns set slug='changed-slug' where id=" + quote(campaignId),token('admin'),/Slug is stable/);
  for (const state of ['closed','archived']) for (const exit of ['draft','scheduled','open','paused'])
    deniedSql("update private.campaigns set status='open' where id=" + quote(campaignId) + ";update private.campaigns set status=" + (state === 'archived' ? "'closed' where id=" + quote(campaignId) + ";update private.campaigns set status='archived'" : quote(state)) + ' where id=' + quote(campaignId) + ';update private.campaigns set status=' + quote(exit) + ' where id=' + quote(campaignId),token('admin'),/Terminal campaign state/);
  transaction("update private.campaigns set status='open' where id=" + quote(campaignId) + ";update private.campaigns set status='closed' where id=" + quote(campaignId) + ";update private.campaigns set status='archived' where id=" + quote(campaignId));
  deniedSql('delete from private.campaigns',token('admin'),/Campaign deletion denied/);
});
test('descriptor admission rejects missing/unreviewed validator and disallows mutable registry', () => {
  deniedSql("insert into private.campaign_type_descriptors values ('bad_fixture',1,'bad_fixture.enabled','missing')",token('admin'),/Reviewed private immutable/);
  deniedSql("update private.campaign_type_descriptors set config_version=2",token('admin'),/additive reviewed migration/);
  deniedSql('delete from private.campaign_type_descriptors',token('admin'),/additive reviewed migration/);
});

test('properly private validator is accepted with owner EXECUTE retained', () => {
  for (const role of ['public','anon','authenticated','service_role','supabase_auth_admin'])
    assert.equal(sql('select has_function_privilege(' + quote(role) + ",'private.local_fixture_configuration(jsonb)','execute')"),'f');
  assert.equal(sql("select has_function_privilege('postgres','private.local_fixture_configuration(jsonb)','execute')"),'t');
  transaction("insert into private.campaign_type_descriptors values ('private_fixture',1,'private_fixture.enabled','local_fixture_configuration')");
});
for (const role of ['public','anon','authenticated','service_role','supabase_auth_admin'])
  test('descriptor rejects otherwise valid validator with EXECUTE granted to ' + role, () => {
    deniedSql('grant execute on function private.local_fixture_configuration(jsonb) to ' + role +
      ";insert into private.campaign_type_descriptors values ('unsafe_fixture',1,'unsafe_fixture.enabled','local_fixture_configuration')",
    token('admin'),/Reviewed private immutable/);
  });
test('descriptor rejects inherited runtime EXECUTE through another role', () => {
  deniedSql("create role local_fixture_validator_reader nologin;grant execute on function private.local_fixture_configuration(jsonb) to local_fixture_validator_reader;" +
    "grant local_fixture_validator_reader to authenticated;insert into private.campaign_type_descriptors values ('unsafe_fixture',1,'unsafe_fixture.enabled','local_fixture_configuration')",
  token('admin'),/Reviewed private immutable/);
  assert.equal(sql("select count(*) from pg_roles where rolname='local_fixture_validator_reader'"),'0');
});

for (const action of ['system_flag.enable','system_flag.disable']) for (const before of [false,true]) for (const after of [false,true])
  test(action + ' audit transition ' + before + ' -> ' + after, () => {
    const metadata = JSON.stringify({before_enabled:before,after_enabled:after});
    const valid = action === 'system_flag.enable' ? !before && after : before && !after;
    assert.equal(sql('select private.campaign_audit_metadata_valid(' + quote(action) + ',' + quote(metadata) + ')'),valid ? 't' : 'f');
    const mutation = "update private.system_feature_flags set enabled=" + before + " where flag_key='campaigns.enabled';" +
      "update private.system_feature_flags set enabled=" + after + " where flag_key='campaigns.enabled';" +
      'select private.record_campaign_event(' + quote(action) + ",null,'campaigns.enabled',3,4," + quote(metadata) + ')';
    if (valid) transaction(mutation,ownerToken);
    else deniedSql(mutation,ownerToken,/governance_check/);
    assert.equal(sql("select version from private.system_feature_flags where flag_key='campaigns.enabled'"),'2');
  });

test('actual RLS is enabled with zero permissive policies/raw grants on all three new tables', () => {
  for (const table of ['campaign_type_descriptors','campaigns','system_feature_flags']) {
    assert.equal(sql("select relrowsecurity from pg_class where oid='private." + table + "'::regclass"),'t');
    assert.equal(sql("select count(*) from pg_policies where schemaname='private' and tablename=" + quote(table)),'0');
    for (const role of ['anon','authenticated','service_role','supabase_auth_admin']) for (const privilege of ['select','insert','update','delete','truncate'])
      assert.equal(sql('select has_table_privilege(' + quote(role) + ",'private." + table + "'," + quote(privilege) + ')'),'f');
  }
});
test('RLS still denies raw reads/writes if table grants are accidentally broadened', () => {
  transaction("grant select,insert,update,delete on private.campaigns to authenticated;set local role authenticated;do $$ begin if exists(select 1 from private.campaigns) then raise exception 'RLS leaked'; end if; end $$",token('admin'));
  deniedSql("grant insert on private.campaigns to authenticated;set local role authenticated;" + insert(),ownerToken,/row-level security/);
});
test('helper/writer EXECUTE and safe search paths match least privilege', () => {
  for (const fn of ['private.require_campaign_access(text)','private.record_campaign_event(text,uuid,text,integer,integer,jsonb,uuid)','private.campaign_audit_metadata_valid(text,jsonb)'])
    for (const role of ['anon','authenticated']) assert.equal(sql('select has_function_privilege(' + quote(role) + ',' + quote(fn) + ",'execute')"),'f');
  const funcs = rows("select proname,prosecdef,proconfig from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('private','public') and proname in ('require_campaign_access','record_campaign_event','campaign_foundation_list','campaign_audit_history','campaign_row_guard','system_flag_row_guard')");
  for (const fn of funcs) assert(fn.proconfig.includes('search_path=""'));
});

for (const name of ['outsider','disabled','revoked']) test('actual PostgREST denies campaign/audit RPC for ' + name + ' with valid signed fixture JWT', async () => {
  for (const method of ['campaign_foundation_list','campaign_audit_history']) assert.equal((await rpc(stack,method,token(name))).status,403);
});
test('anon denied through actual RPC and private schema remains unexposed', async () => {
  for (const method of ['campaign_foundation_list','campaign_audit_history']) assert.equal((await rpc(stack,method)).status,401);
  for (const table of ['campaigns','system_feature_flags','campaign_type_descriptors','admin_audit_log']) {
    assert.equal((await api(stack,'/rest/v1/' + table,{token:ownerToken})).status,404);
    assert.equal((await api(stack,'/rest/v1/' + table,{token:ownerToken,headers:{'Accept-Profile':'private'}})).status,406);
  }
});
for (const name of ['staff','admin']) test('actual PostgREST ' + name + ' safe read; campaign manager/flag/access guard boundaries', async () => {
  const response = await rpc(stack,'campaign_foundation_list',token(name)); assert.equal(response.status,200);
  assert.equal(response.data[0].id,campaignId);
  for (const key of ['configuration','created_by','updated_by','editorial_document_id']) assert(!Object.hasOwn(response.data[0],key));
  assert.equal((await rpc(stack,'admin_owner_snapshot',token(name))).status,403);
  assert.equal((await rpc(stack,'admin_create_invite',token(name),{invitee_email:'blocked@example.test',invitee_role:'staff'})).status,403);
  if (name === 'admin') transaction("select private.require_campaign_access('manage')",token(name));
  else deniedSql("select private.require_campaign_access('manage')",token(name));
  deniedSql("insert into private.system_feature_flags(flag_key) values ('local_fixture.enabled')",token(name));
});
test('owner AAL1 denied; real Auth/TOTP AAL2 read/manage accepted, stale signed proof denies manage only', async () => {
  assert.equal(claims(ownerToken).aal,'aal2'); assert(claims(ownerToken).amr.some(a=>a.method==='totp'));
  for (const method of ['campaign_foundation_list','campaign_audit_history']) {
    assert.equal((await rpc(stack,method,ownerAal1())).status,403);
    assert.equal((await rpc(stack,method,ownerToken)).status,200);
  }
  transaction("select private.require_campaign_access('manage')",ownerToken);
  for (const amr of [[{method:'oauth'}], [{method:'oauth'},{method:'totp',timestamp:Math.floor(Date.now()/1000)-601}], [{method:'oauth'},{method:'totp',timestamp:Math.floor(Date.now()/1000)+60}]])
    deniedSql("select private.require_campaign_access('manage')",token('owner',{aal:'aal2',amr}),/Recent MFA required/);
});
test('unknown capabilities, staff writes and payload/metadata privilege escalation denied', async () => {
  for (const capability of ['unknown',null]) deniedSql('select private.require_campaign_access(' + (capability ? quote(capability) : 'null') + ')');
  deniedSql(insert(),token('staff'));
  const forged = token('staff',{metadata:{role:'super_admin',user_id:users.owner.id,aal:'aal2'}});
  assert.equal((await rpc(stack,'campaign_audit_history',forged)).status,403);
  for (const fn of ['require_campaign_access','record_campaign_event','system_flag_row_guard']) assert.equal((await rpc(stack,fn,ownerToken)).status,404);
  assert.equal((await rpc(stack,'campaign_audit_history',token('admin'),{scope:'foundation'})).status,404);
});
test('enrolled admin TOTP requires AAL2; changed Google binding/ended session immediately deny', async () => {
  transaction("insert into auth.mfa_factors(id,user_id,factor_type,status,created_at,updated_at) values (gen_random_uuid()," + quote(users.admin.id) + ",'totp','verified',now(),now());select private.require_campaign_access('read')",token('admin',{aal:'aal2'}));
  deniedSql("insert into auth.mfa_factors(id,user_id,factor_type,status,created_at,updated_at) values (gen_random_uuid()," + quote(users.admin.id) + ",'totp','verified',now(),now());select private.require_campaign_access('read')",token('admin'));
  deniedSql("update auth.identities set provider_id='changed' where user_id=" + quote(users.admin.id) + ";select private.require_campaign_access('read')");
  for (const status of ['disabled','revoked']) deniedSql('update public.admin_profiles set status=' + quote(status) + ' where user_id=' + quote(users.admin.id) + ";select private.require_campaign_access('read')");
  deniedSql('delete from auth.sessions where id=' + quote(users.admin.session) + ";select private.require_campaign_access('read')");
  assert.equal((await rpc(stack,'campaign_foundation_list',token('admin'))).status,200);
});
test('unknown flags, forged metadata and direct raw flag writes cannot bypass owner guard', () => {
  for (const flag of ['qurban.enabled','ramadan.enabled','unknown.enabled'])
    deniedSql('insert into private.system_feature_flags(flag_key) values (' + quote(flag) + ')',ownerToken,/Unsupported module flag/);
  transaction("insert into private.system_feature_flags(flag_key) values ('local_fixture.enabled')",ownerToken);
  deniedSql("update private.system_feature_flags set enabled=true where flag_key='campaigns.enabled'",token('admin'));
  deniedSql("set local role authenticated;update private.system_feature_flags set enabled=true",ownerToken);
});

test('existing Foundation bootstrap/recovery/writer/immutable audit remain valid', () => {
  transaction("insert into private.admin_audit_log(action,actor_aal) values ('recovery','system');select private.record_event('invite.create')");
  for (const query of ["update private.admin_audit_log set metadata='{}'",'delete from private.admin_audit_log']) deniedSql(query,ownerToken,/Audit is append-only/);
  deniedSql("set local role authenticated;select * from private.admin_audit_log",ownerToken);
});
test('admin safe campaign-only audit excludes foundation/security and owner-only flag audit; staff denied', async () => {
  const admin = await rpc(stack,'campaign_audit_history',token('admin')); assert.equal(admin.status,200);
  assert.deepEqual(admin.data.map(a=>a.action),['campaign.create']);
  const owner = await rpc(stack,'campaign_audit_history',ownerToken); assert.equal(owner.status,200);
  assert.deepEqual(owner.data.map(a=>a.action).sort(),['campaign.create','system_flag.disable','system_flag.enable']);
  assert.equal((await rpc(stack,'campaign_audit_history',token('staff'))).status,403);
  assert.equal((await rpc(stack,'campaign_audit_history',token('admin'),{target_campaign:randomUUID()})).data.length,0);
  assert.equal((await rpc(stack,'campaign_audit_history',token('admin'),{page_size:101})).status,400);
  assert.equal((await rpc(stack,'campaign_foundation_list',token('admin'),{page_size:0})).status,400);
  for (const key of ['invite_id','old_role','new_role','target_id','old_status','new_status']) assert(!Object.hasOwn(admin.data[0],key));
});
test('campaign audit rejects unknown events/target/actor/version forms and unapproved metadata', () => {
  const audit = (action, metadata = '{}') => "select private.record_campaign_event(" + quote(action) + ',' + quote(campaignId) + ',null,0,1,' + quote(metadata) + ')';
  for (const action of ['unknown','invite.create','system_flag.enable']) deniedSql(audit(action),token('admin'),/governance_check/);
  for (const key of ['name','phone','email','address','consent','participant','payment','receipt','bank','token','secret','reason','before'])
    deniedSql(audit('campaign.create',JSON.stringify({[key]:'sensitive fixture'})),token('admin'),/governance_check/);
  deniedSql(audit('campaign.create','{"to_status":"secret"}'),token('admin'),/governance_check/);
  deniedSql("select private.record_campaign_event('campaign.create'," + quote(campaignId) + ",null,0,99,'{}')",token('admin'),/version mismatch/);
  deniedSql("insert into private.admin_audit_log(action,actor_aal,actor_category,target_kind,campaign_id,expected_version,resulting_version) values ('campaign.create','system','scheduler','campaign'," + quote(campaignId) + ',0,1)',token('admin'),/governance_check/);
  deniedSql("select private.record_campaign_event('campaign.create'," + quote(campaignId) + ",'campaigns.enabled',0,1,'{}')",ownerToken,/Invalid audit target/);
});
test('restricted scheduler shape preserved; only capability scheduler execution exists', () => {
  transaction("insert into private.admin_audit_log(action,actor_aal,actor_category,target_kind,campaign_id,expected_version,resulting_version,metadata) values ('lifecycle.close','system','scheduler','campaign'," + quote(campaignId) + ",1,2,'{\"from_status\":\"open\",\"to_status\":\"closed\"}')");
  assert.equal(sql("select has_function_privilege('authenticated','private.reconcile_campaign_lifecycle(integer)','execute')"),'f');
  assert.equal(sql("select has_function_privilege('authenticated','private.record_campaign_event(text,uuid,text,integer,integer,jsonb,uuid)','execute')"),'f');
});
test('atomic mutation/audit contract rolls back state on audit failure; successful versioned event is attributable', () => {
  const mutation = "update private.campaigns set title='Changed' where id=" + quote(campaignId) + ';';
  deniedSql(mutation + "select private.record_campaign_event('campaign.update'," + quote(campaignId) + ",null,1,2,'{\"phone\":\"sensitive\"}')",token('admin'),/governance_check/);
  assert.equal(rows('select title,version from private.campaigns')[0].version,1);
  transaction(mutation + "select private.record_campaign_event('campaign.update'," + quote(campaignId) + ",null,1,2,'{\"changed_fields\":[\"title\"]}')");
});
