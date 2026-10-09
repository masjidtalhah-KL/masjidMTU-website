import { PGlite } from '@electric-sql/pglite';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
// Test contract only. These are NOT Supabase Auth migrations or an Auth emulator.
// Real Auth schemas/services remain a separate full-stack verification gate.
export async function database({ migrationThrough } = {}) {
  const db = new PGlite();
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create role service_role nologin bypassrls;
    create role supabase_auth_admin nologin;
    -- Test-only analogue of PostgREST's real connection role.
    create role authenticator nologin;
    create schema auth;
    create table auth.users(id uuid primary key, email text, email_confirmed_at timestamptz, is_anonymous boolean default false, raw_user_meta_data jsonb default '{}');
    create table auth.identities(id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id), provider text, provider_id text, identity_data jsonb);
    create table auth.mfa_factors(id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id), factor_type text, status text);
    create table auth.sessions(id uuid primary key, user_id uuid references auth.users(id));
    create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
    create function auth.uid() returns uuid language sql stable as $$ select (auth.jwt()->>'sub')::uuid $$;
    grant usage on schema auth to authenticated, anon;
    grant execute on function auth.jwt(), auth.uid() to authenticated, anon;
  `);
  for (const file of (await readdir(path.join(root, 'supabase/migrations')))
    .filter(f => f.endsWith('.sql') && (!migrationThrough || f.split('_')[0] <= migrationThrough)).sort()) {
    await db.exec(await readFile(path.join(root, 'supabase/migrations', file), 'utf8'));
  }
  return db;
}

export const ids = Object.fromEntries(['owner', 'admin', 'staff', 'disabled', 'revoked', 'outsider', 'invitee', 'other'].map((name, i) => [name, `00000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`]));
export const sessions = Object.fromEntries(Object.entries(ids).map(([name, id]) => [name, id.replace('00000000-', '10000000-')]));
export async function fixtures(db) {
  for (const [name, id] of Object.entries(ids)) {
    await db.query(`insert into auth.users(id, email, email_confirmed_at) values ($1, $2, now())`, [id, `${name}@example.test`]);
    await db.query(`insert into auth.identities(user_id, provider, provider_id, identity_data) values ($1, 'google', $2, $3)`,
      [id, `google-${name}`, JSON.stringify({sub: `google-${name}`, email: `${name}@example.test`, email_verified: true})]);
    await db.query('insert into auth.sessions values ($1, $2)', [sessions[name], id]);
    if (['owner', 'admin', 'staff', 'disabled', 'revoked'].includes(name)) {
      await db.query(`insert into public.admin_profiles(user_id, approved_email, google_subject, role, status)
        values ($1, $2, $3, $4, $5)`, [id, `${name}@example.test`, `google-${name}`,
        name === 'owner' ? 'super_admin' : name === 'admin' ? 'admin' : 'staff', ['disabled', 'revoked'].includes(name) ? name : 'active']);
    }
  }
  await db.query(`insert into auth.mfa_factors(user_id, factor_type, status) values ($1, 'totp', 'verified')`, [ids.owner]);
}
export async function asUser(db, name, sql, args = [], options = {}) {
  const claims = name ? {sub: ids[name], role: 'authenticated', session_id: sessions[name],
    aal: options.aal ?? (name === 'owner' ? 'aal2' : 'aal1'),
    amr: options.amr ?? [{method: 'oauth', timestamp: Math.floor(Date.now()/1000)},
      ...(name === 'owner' ? [{method: 'totp', timestamp: Math.floor(Date.now()/1000)}] : [])],
    user_metadata: options.metadata ?? {}} : {role: 'anon'};
  await db.exec('begin');
  try {
    await db.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify(claims)]);
    await db.exec(`set local role ${name ? 'authenticated' : 'anon'}`);
    const result = await db.query(sql, args);
    await db.exec('commit');
    return result;
  } catch (error) {
    await db.exec('rollback');
    throw error;
  }
}
