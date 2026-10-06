import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createHmac, randomUUID } from 'node:crypto';
import { root } from './database.mjs';

const project = 'mtu-admin-local';
export const dbContainer = 'supabase_db_' + project;
export const authContainer = 'supabase_auth_' + project;
const pkg = JSON.parse(readFileSync(path.join(root, 'node_modules/supabase/package.json'), 'utf8'));
const bin = path.join(root, 'node_modules/supabase', pkg.bin.supabase);
export function cli(args) {
  const allowed = ['status --output json', 'gen types typescript --local --schema public'];
  if (!allowed.includes(args.join(' '))) throw Error('Only local status/type inspection is allowed');
  return execFileSync(bin.endsWith('.js') ? process.execPath : bin, bin.endsWith('.js') ? [bin, ...args] : args, {
    cwd: root, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024,
    env: { ...process.env, SUPABASE_HOME: path.join(root, '.cache/supabase-cli'), SUPABASE_TELEMETRY_DISABLED: 'true', SUPABASE_NO_UPDATE_NOTIFIER: 'true' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}
export function localStack() {
  const config = readFileSync(path.join(root, 'supabase/config.toml'), 'utf8');
  if (!config.includes('project_id = "' + project + '"')) throw Error('Wrong disposable local project');
  const status = JSON.parse(cli(['status', '--output', 'json']));
  const url = new URL(status.API_URL);
  if (url.origin !== 'http://127.0.0.1:54321') throw Error('Only the approved loopback local API is allowed');
  const auth = JSON.parse(execFileSync('docker', ['inspect', authContainer], { encoding: 'utf8' }))[0];
  const env = Object.fromEntries(auth.Config.Env.map(v => { const index = v.indexOf('='); return [v.slice(0, index), v.slice(index + 1)]; }));
  if (!env.GOTRUE_JWT_SECRET) throw Error('Local Auth signing contract unavailable');
  if (new URL(env.GOTRUE_DB_DATABASE_URL).hostname !== dbContainer) throw Error('Auth must use this project-local database container');
  // Keys stay in the test process. Never print, persist or use them against remote URLs.
  return { url: url.origin, anon: status.ANON_KEY, service: status.SERVICE_ROLE_KEY, jwt: env.GOTRUE_JWT_SECRET, authEnv: env };
}
export const quote = value => "'" + String(value).replaceAll("'", "''") + "'";
export function sql(query, role = 'postgres') {
  if (!['postgres', 'supabase_auth_admin'].includes(role)) throw Error('Unapproved local SQL test role');
  const args = ['exec', '-i'];
  if (role === 'supabase_auth_admin') {
    const password = new URL(localStack().authEnv.GOTRUE_DB_DATABASE_URL).password;
    args.push('-e', 'PGPASSWORD=' + decodeURIComponent(password));
  }
  args.push(dbContainer, 'psql', ...(role === 'postgres' ? [] : ['-h', '127.0.0.1']), '-U', role, '-d', 'postgres', '-Atq', '-v', 'ON_ERROR_STOP=1');
  const result = spawnSync('docker', args, {
    input: query, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024,
  });
  if (result.status !== 0) throw Error('Local SQL failed: ' + result.stderr.split('\n').filter(line => line.startsWith('ERROR:')).join(' '));
  return result.stdout.trim();
}
export function rows(query) {
  return JSON.parse(sql("select coalesce(json_agg(row_to_json(t)), '[]'::json) from (" + query + ") t;"));
}
export function signedToken(stack, user, options = {}) {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: stack.url + '/auth/v1', aud: 'authenticated', sub: user.id, role: 'authenticated',
    email: user.email, session_id: user.session, aal: options.aal ?? 'aal1',
    iat: now, exp: now + 3600, is_anonymous: false,
    amr: options.amr ?? [{ method: 'oauth', timestamp: now }],
    user_metadata: options.metadata ?? {}, app_metadata: { provider: 'google', providers: ['google'] },
  };
  const input = [Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url'), Buffer.from(JSON.stringify(payload)).toString('base64url')].join('.');
  return input + '.' + createHmac('sha256', stack.jwt).update(input).digest('base64url');
}
export async function api(stack, endpoint, { token, method = 'GET', body, headers = {}, service = false } = {}) {
  const response = await fetch(stack.url + endpoint, {
    method, headers: { apikey: service ? stack.service : stack.anon, authorization: 'Bearer ' + (token ?? (service ? stack.service : stack.anon)),
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...headers },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(15000),
  });
  const text = await response.text();
  let data; try { data = JSON.parse(text); } catch { data = text; }
  return { status: response.status, data, headers: response.headers };
}
export const rpc = (stack, name, token, body = {}) => api(stack, '/rest/v1/rpc/' + name, { token, method: 'POST', body });
export function fixtures() {
  if (Number(sql('select count(*) from auth.users;')) || Number(sql('select count(*) from public.admin_profiles;'))) throw Error('Reset the disposable local stack before verification; no existing identity will be overwritten');
  const users = Object.fromEntries(['owner', 'admin', 'staff', 'disabled', 'revoked', 'outsider', 'invitee', 'other', 'rollback'].map(name => [name, { id: randomUUID(), session: randomUUID(), email: 'local-' + name + '@example.test', subject: 'local-google-' + name }]));
  let query = 'begin;\n';
  for (const [name, u] of Object.entries(users)) {
    query += "insert into auth.users(id,aud,role,email,email_confirmed_at,created_at,updated_at,raw_app_meta_data,raw_user_meta_data,is_anonymous) values (" + quote(u.id) + ",'authenticated','authenticated'," + quote(u.email) + ",now(),now(),now(),'{\"provider\":\"google\",\"providers\":[\"google\"]}'::jsonb,'{}',false);\n";
    query += "insert into auth.identities(user_id,provider,provider_id,identity_data,created_at,updated_at) values (" + quote(u.id) + ",'google'," + quote(u.subject) + "," + quote(JSON.stringify({ sub: u.subject, email: u.email, email_verified: true })) + "::jsonb,now(),now());\n";
    query += "insert into auth.sessions(id,user_id,created_at,updated_at,aal) values (" + quote(u.session) + ',' + quote(u.id) + ",now(),now(),'aal1');\n";
    query += "insert into auth.mfa_amr_claims(id,session_id,created_at,updated_at,authentication_method) values (" + quote(randomUUID()) + ',' + quote(u.session) + ",now(),now(),'oauth');\n";
    if (['owner', 'admin', 'staff', 'disabled', 'revoked'].includes(name)) {
      query += "insert into public.admin_profiles(user_id,approved_email,google_subject,role,status) values (" + quote(u.id) + ',' + quote(u.email) + ',' + quote(u.subject) + ',' + quote(name === 'owner' ? 'super_admin' : name === 'admin' ? 'admin' : 'staff') + ',' + quote(['disabled', 'revoked'].includes(name) ? name : 'active') + ');\n';
    }
  }
  // Real GoTrue finds users under its nil instance UUID and expects string token fields.
  query += "update auth.users set instance_id='00000000-0000-0000-0000-000000000000',confirmation_token='',recovery_token='',email_change_token_new='',email_change='',encrypted_password='';\n";
  query += "insert into private.admin_audit_log(action,actor_aal,new_role,new_status,target_id) values ('bootstrap','system','super_admin','active'," + quote(users.owner.id) + ');\ncommit;';
  sql(query);
  return users;
}
// RFC 6238 test calculation: only Auth-returned local seed in memory, never a stored application seed.
export function totp(secret) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  for (const c of secret.toUpperCase().replace(/=+$/, '')) bits += alphabet.indexOf(c).toString(2).padStart(5, '0');
  const key = Buffer.from(bits.match(/.{8}/g).map(byte => parseInt(byte, 2)));
  const counter = Buffer.alloc(8); counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000)));
  const digest = createHmac('sha1', key).update(counter).digest();
  const offset = digest[digest.length - 1] & 15;
  return String((digest.readUInt32BE(offset) & 0x7fffffff) % 1000000).padStart(6, '0');
}
