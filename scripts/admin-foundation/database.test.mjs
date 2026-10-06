import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { database, fixtures, asUser, ids } from './database.mjs';
let db;
before(async () => { db = await database(); await fixtures(db); });
after(async () => { await db?.close(); });
const columns = 'user_id, approved_email, role, status, version';
const denied = (promise, code = '42501') => assert.rejects(promise, error => error.code === code);
const owner = (sql, args, options) => asUser(db, 'owner', sql, args, options);

test('anonymous denied table, security DTO, acceptance and management RPC', async () => {
  for (const sql of [`select ${columns} from public.admin_profiles`, 'select public.admin_security_state()', 'select public.admin_accept_invite()', 'select public.admin_owner_snapshot()']) await denied(asUser(db, null, sql));
});
for (const name of ['outsider', 'disabled', 'revoked']) {
  test(`${name}: no profile rows, minimal state or owner RPC even with still-valid claims`, async () => {
    assert.equal((await asUser(db, name, `select ${columns} from public.admin_profiles`)).rows.length, 0);
    await denied(asUser(db, name, 'select public.admin_security_state()'));
    await denied(asUser(db, name, 'select public.admin_owner_snapshot()'));
  });
}
for (const name of ['staff', 'admin']) {
  test(`${name}: own permitted fields only; no owner RPC/role mutation`, async () => {
    const result = await asUser(db, name, `select ${columns} from public.admin_profiles`);
    assert.deepEqual(result.rows.map(r => r.user_id), [ids[name]]);
    await denied(asUser(db, name, 'select google_subject from public.admin_profiles'));
    await denied(asUser(db, name, 'select public.admin_owner_snapshot()'));
    await denied(asUser(db, name, "select public.admin_create_invite('bad@example.test', 'staff')"));
    await denied(asUser(db, name, "select public.admin_change_member($1, 1, 'role', 'admin')", [ids.staff]));
  });
}
test('super_admin AAL1: minimal security DTO, no profile/owner/mutation access', async () => {
  const options = {aal: 'aal1'};
  assert.equal((await owner(`select ${columns} from public.admin_profiles`, [], options)).rows.length, 0);
  const state = (await owner('select public.admin_security_state() as state', [], options)).rows[0].state;
  assert.deepEqual(Object.keys(state).sort(), ['aal', 'has_totp', 'recent_mfa', 'role', 'status', 'user_id']);
  assert.equal(state.role, 'super_admin');
  await denied(owner('select public.admin_owner_snapshot()', [], options));
  await denied(owner("select public.admin_create_invite('aal1@example.test', 'staff')", [], options));
});
test('super_admin AAL2: permitted profiles and bounded owner snapshot', async () => {
  assert.equal((await owner(`select ${columns} from public.admin_profiles`)).rows.length, 5);
  const snapshot = (await owner('select public.admin_owner_snapshot() as data')).rows[0].data;
  assert.equal(snapshot.users.length, 5);
  assert(!JSON.stringify(snapshot).includes('google_subject'));
});
test('direct INSERT/UPDATE/DELETE denied for staff, admin and owner', async () => {
  for (const name of ['staff', 'admin', 'owner']) {
    for (const sql of ["update public.admin_profiles set role = 'super_admin'", 'delete from public.admin_profiles',
      "insert into public.admin_profiles(user_id, approved_email, google_subject, role) values ($1, 'x@example.test', 'x', 'super_admin')"])
      await denied(asUser(db, name, sql, sql.startsWith('insert') ? [ids.outsider] : []));
  }
});
test('private tables/audit helpers/hook are inaccessible to Data API callers', async () => {
  for (const sql of ['select * from private.admin_invites', 'select * from private.admin_audit_log',
    "select private.record_event('bootstrap')", "select private.before_user_created('{}')"])
    await denied(owner(sql));
});
test('editable metadata and arbitrary actor/role payload do not grant authority', async () => {
  const options = {metadata: {role: 'super_admin', user_id: ids.owner, aal: 'aal2'}};
  await denied(asUser(db, 'staff', 'select public.admin_owner_snapshot()', [], options));
  assert.equal((await asUser(db, 'staff', `select ${columns} from public.admin_profiles`, [], options)).rows[0].role, 'staff');
});
test('missing, expired, future, malformed or unrelated signed MFA proof denies mutation', async () => {
  for (const amr of [[], [{method:'oauth'}], [{method:'totp',timestamp:Math.floor(Date.now()/1000)-601}],
    [{method:'totp',timestamp:Math.floor(Date.now()/1000)+100}], [{method:'totp',timestamp:'now'}], [{method:'phone',timestamp:Math.floor(Date.now()/1000)}]]) {
    await denied(owner("select public.admin_create_invite('stale@example.test', 'staff')", [], {amr:[{method:'oauth'}, ...amr]}));
  }
});
test('removed verified factor denies stale AAL2 token', async () => {
  await db.query("update auth.mfa_factors set status = 'unverified' where user_id = $1", [ids.owner]);
  await denied(owner('select public.admin_owner_snapshot()'));
  await db.query("update auth.mfa_factors set status = 'verified' where user_id = $1", [ids.owner]);
});
test('changed provider email/subject or unexpected linked identity denies access', async () => {
  await db.query("update auth.identities set provider_id = 'changed' where user_id = $1", [ids.staff]);
  assert.equal((await asUser(db,'staff',`select ${columns} from public.admin_profiles`)).rows.length,0);
  await db.query("update auth.identities set provider_id = 'google-staff' where user_id = $1", [ids.staff]);
  await db.query("insert into auth.identities(user_id, provider, provider_id) values ($1, 'email', 'extra')", [ids.staff]);
  await denied(asUser(db,'staff','select public.admin_security_state()'));
  await db.query("delete from auth.identities where provider = 'email'");
});
test('ordinary invitations refuse super_admin/null roles and malformed addresses', async () => {
  await denied(owner("select public.admin_create_invite('x@example.test', 'super_admin')"),'22023');
  await denied(owner("select public.admin_create_invite('x@example.test', null)"),'22023');
  await denied(owner("select public.admin_create_invite('bad', 'staff')"),'22023');
});
test('7-day invitation normalizes trim/case; duplicate prevention is transactional', async () => {
  await owner("select public.admin_create_invite('  Invitee@Example.Test ', 'staff')");
  const row = (await db.query("select *, extract(epoch from expires_at-created_at) as seconds from private.admin_invites where email_normalized='invitee@example.test'")).rows[0];
  assert.equal(Number(row.seconds), 7*24*60*60);
  await denied(owner("select public.admin_create_invite('invitee@example.test', 'admin')"), '23505');
  assert.equal((await db.query("select count(*)::int as n from private.admin_invites where email_normalized='invitee@example.test'")).rows[0].n,1);
});
test('wrong email/no pending invite cannot accept; existing Auth user acceptance derives role from DB', async () => {
  await denied(asUser(db, 'other', 'select public.admin_accept_invite()'));
  await asUser(db, 'invitee', 'select public.admin_accept_invite()');
  assert.equal((await asUser(db, 'invitee', `select ${columns} from public.admin_profiles`)).rows[0].role, 'staff');
});
test('same-identity acceptance replay is idempotent and cannot change role or duplicate audit', async () => {
  const beforeCount = (await db.query("select count(*)::int n from private.admin_audit_log where action='invite.accept'")).rows[0].n;
  await asUser(db, 'invitee', 'select public.admin_accept_invite()', [], {metadata:{role:'super_admin'}});
  assert.equal((await db.query("select count(*)::int n from private.admin_audit_log where action='invite.accept'")).rows[0].n,beforeCount);
  assert.equal((await asUser(db,'invitee',`select ${columns} from public.admin_profiles`)).rows[0].role,'staff');
});
test('expired invite cannot accept; reissue closes expired invitation and audits expiry', async () => {
  await owner("select public.admin_create_invite('other@example.test', 'admin')");
  await db.query("update private.admin_invites set created_at=now()-interval '8 days', expires_at=now()-interval '1 day' where email_normalized='other@example.test'");
  await denied(asUser(db,'other','select public.admin_accept_invite()'));
  await owner("select public.admin_create_invite('other@example.test', 'staff')");
  assert.equal((await db.query("select count(*)::int n from private.admin_invites where email_normalized='other@example.test' and status='pending'")).rows[0].n,1);
  assert.equal((await db.query("select count(*)::int n from private.admin_audit_log where action='invite.expire'")).rows[0].n,1);
});
test('hook grants only pending exact Google emails and never consumes invite/profile', async () => {
  await db.exec('begin; set local role supabase_auth_admin');
  try {
    for (const [email, provider, allow] of [['other@example.test','google',true],['other+alias@example.test','google',false],['unknown@example.test','google',false],['other@example.test','email',false]]) {
      const event = {user:{email,app_metadata:{provider},is_anonymous:false}};
      const result = (await db.query('select private.before_user_created($1) as data',[JSON.stringify(event)])).rows[0].data;
      assert.equal(!result.error,allow);
    }
  } finally { await db.exec('rollback'); }
  assert.equal((await db.query('select count(*)::int n from public.admin_profiles where user_id=$1',[ids.other])).rows[0].n,0);
});
test('invite revoke uses version guard and prevents acceptance', async () => {
  const invite=(await db.query("select id,version from private.admin_invites where email_normalized='other@example.test' and status='pending'")).rows[0];
  await denied(owner('select public.admin_revoke_invite($1, 99)',[invite.id]),'PT409');
  await owner('select public.admin_revoke_invite($1,$2)',[invite.id,invite.version]);
  await denied(asUser(db,'other','select public.admin_accept_invite()'));
});
test('member role/status versions, last-owner protection, immediate disabled/revoked JWT denial', async () => {
  await denied(owner("select public.admin_change_member($1,1,'disable')",[ids.owner]));
  await denied(owner("select public.admin_change_member($1,1,'role','super_admin')",[ids.staff]),'22023');
  await owner("select public.admin_change_member($1,1,'role','admin')",[ids.staff]);
  await denied(owner("select public.admin_change_member($1,1,'disable')",[ids.staff]),'PT409');
  await owner("select public.admin_change_member($1,2,'disable')",[ids.staff]);
  await denied(asUser(db,'staff','select public.admin_security_state()'));
  await owner("select public.admin_change_member($1,3,'reactivate')",[ids.staff]);
  assert.equal((await asUser(db,'staff',`select ${columns} from public.admin_profiles`)).rows.length,1);
  await owner("select public.admin_change_member($1,4,'revoke')",[ids.staff]);
  assert.equal((await asUser(db,'staff',`select ${columns} from public.admin_profiles`)).rows.length,0);
  await denied(asUser(db,'staff','select public.admin_accept_invite()'));
  await denied(owner("select public.admin_change_member($1,5,'reactivate')",[ids.staff]),'22023');
});
test('revoked re-invite requires same bound identity and keeps one profile', async () => {
  await owner("select public.admin_create_invite('staff@example.test','staff')");
  await asUser(db,'staff','select public.admin_accept_invite()');
  assert.equal((await asUser(db,'staff',`select ${columns} from public.admin_profiles`)).rows[0].role,'staff');
  assert.equal((await db.query('select count(*)::int n from public.admin_profiles where user_id=$1',[ids.staff])).rows[0].n,1);
});
test('audit failure rolls back membership and invite mutations atomically', async () => {
  await db.exec("create function private.test_audit_failure() returns trigger language plpgsql as $$ begin raise exception 'test audit sink unavailable'; end $$; create trigger test_fail before insert on private.admin_audit_log for each row execute function private.test_audit_failure()");
  const profile=(await db.query('select * from public.admin_profiles where user_id=$1',[ids.admin])).rows[0];
  await assert.rejects(owner("select public.admin_change_member($1,$2,'disable')",[ids.admin,profile.version]), /test audit sink/);
  assert.equal((await db.query('select status from public.admin_profiles where user_id=$1',[ids.admin])).rows[0].status,'active');
  await assert.rejects(owner("select public.admin_create_invite('rollback@example.test','staff')"), /test audit sink/);
  assert.equal((await db.query("select count(*)::int n from private.admin_invites where email_normalized='rollback@example.test'")).rows[0].n,0);
  await db.exec('drop trigger test_fail on private.admin_audit_log; drop function private.test_audit_failure()');
});
test('audit cannot be altered/deleted; governance identifiers survive independent Auth deletion attempts', async () => {
  await denied(db.exec("update private.admin_audit_log set action='bootstrap'"));
  await denied(db.exec('delete from private.admin_audit_log'));
  await denied(db.query('delete from auth.users where id=$1',[ids.admin]),'23503');
});

test('audit failure rolls back invite acceptance, profile creation and consumption together', async () => {
  await owner("select public.admin_create_invite('outsider@example.test','staff')");
  await db.exec("create function private.test_accept_failure() returns trigger language plpgsql as $$ begin raise exception 'accept audit unavailable'; end $$; create trigger test_accept_fail before insert on private.admin_audit_log for each row execute function private.test_accept_failure()");
  try {
    await assert.rejects(asUser(db,'outsider','select public.admin_accept_invite()'),/accept audit unavailable/);
    assert.equal((await db.query('select count(*)::int n from public.admin_profiles where user_id=$1',[ids.outsider])).rows[0].n,0);
    assert.equal((await db.query("select status from private.admin_invites where email_normalized='outsider@example.test'")).rows[0].status,'pending');
  } finally {
    await db.exec('drop trigger test_accept_fail on private.admin_audit_log; drop function private.test_accept_failure()');
  }
});

test('confirmed Google email change cannot silently rebind an existing profile', async () => {
  await db.query("update auth.users set email='changed@example.test' where id=$1",[ids.admin]);
  await db.query("update auth.identities set identity_data=jsonb_set(identity_data,'{email}','\"changed@example.test\"') where user_id=$1",[ids.admin]);
  try {
    await denied(asUser(db,'admin','select public.admin_security_state()'));
    await denied(asUser(db,'admin','select public.admin_accept_invite()'));
  } finally {
    await db.query("update auth.users set email='admin@example.test' where id=$1",[ids.admin]);
    await db.query("update auth.identities set identity_data=jsonb_set(identity_data,'{email}','\"admin@example.test\"') where user_id=$1",[ids.admin]);
  }
});

test('owner mutation rate limit fails closed at the database boundary', async () => {
  const isolated=await database();await fixtures(isolated);
  try {
    await isolated.query("insert into private.admin_audit_log(actor_id,action,actor_aal) select $1,'invite.create','aal2' from generate_series(1,60)",[ids.owner]);
    await denied(asUser(isolated,'owner',"select public.admin_create_invite('limited@example.test','staff')"),'22023');
    assert.equal((await isolated.query('select count(*)::int n from private.admin_invites')).rows[0].n,0);
  } finally { await isolated.close(); }
});
