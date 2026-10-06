-- Fasa 6.1: no seed, real owner, module tables or public bootstrap endpoint.
begin;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated, supabase_auth_admin;
alter default privileges in schema private revoke execute on functions from public;

create table public.admin_profiles (
  user_id uuid primary key references auth.users(id) on delete restrict,
  approved_email text not null unique check (approved_email = lower(btrim(approved_email))),
  google_subject text not null unique check (length(google_subject) between 1 and 255),
  display_name text not null default '' check (length(display_name) <= 100),
  role text not null check (role in ('super_admin', 'admin', 'staff')),
  status text not null default 'active' check (status in ('active', 'disabled', 'revoked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1 check (version > 0)
);
create table private.admin_invites (
  id uuid primary key default gen_random_uuid(),
  email_normalized text not null check (email_normalized = lower(btrim(email_normalized)) and length(email_normalized) <= 254),
  role text not null check (role in ('super_admin', 'admin', 'staff')),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'expired', 'revoked')),
  invited_by uuid not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_by uuid,
  accepted_at timestamptz,
  revoked_at timestamptz,
  version integer not null default 1 check (version > 0),
  check (expires_at > created_at),
  check ((status = 'accepted') = (accepted_by is not null and accepted_at is not null)),
  check ((status = 'revoked') = (revoked_at is not null))
);
create unique index admin_invites_one_pending_email on private.admin_invites(email_normalized) where status = 'pending';
create table private.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default now(),
  actor_id uuid,
  target_id uuid,
  invite_id uuid,
  action text not null check (action in ('invite.create', 'invite.expire', 'invite.revoke', 'invite.accept', 'member.role', 'member.disable', 'member.reactivate', 'member.revoke', 'bootstrap', 'recovery')),
  old_role text check (old_role in ('super_admin', 'admin', 'staff')),
  new_role text check (new_role in ('super_admin', 'admin', 'staff')),
  old_status text check (old_status in ('active', 'disabled', 'revoked', 'pending', 'accepted', 'expired')),
  new_status text check (new_status in ('active', 'disabled', 'revoked', 'pending', 'accepted', 'expired')),
  outcome text not null default 'success' check (outcome = 'success'),
  request_id uuid not null default gen_random_uuid(),
  actor_aal text not null check (actor_aal in ('aal1', 'aal2', 'system')),
  check (actor_id is not null or action in ('bootstrap', 'recovery'))
);
create index admin_audit_log_time on private.admin_audit_log(occurred_at desc);
alter table public.admin_profiles enable row level security;
alter table private.admin_invites enable row level security;
alter table private.admin_audit_log enable row level security;
revoke all on public.admin_profiles from public, anon, authenticated;
revoke all on all tables in schema private from public, anon, authenticated, supabase_auth_admin;

-- Only trusted Auth-owned identity rows, confirmed email and signed OAuth AMR.
-- Never inspect raw_user_meta_data or a browser-supplied identity/actor argument.
create function private.google_identity()
returns table(email text, subject text)
language sql stable security definer set search_path = '' as $$
  select lower(btrim(u.email)), i.provider_id
  from auth.users u join auth.identities i on i.user_id = u.id
  where u.id = auth.uid() and u.email_confirmed_at is not null
    and coalesce(u.is_anonymous, false) = false
    and i.provider = 'google'
    and i.identity_data->>'email_verified' = 'true'
    and lower(btrim(i.identity_data->>'email')) = lower(btrim(u.email))
    and i.identity_data->>'sub' = i.provider_id
    and (select count(*) from auth.identities all_i where all_i.user_id = u.id) = 1
    and auth.jwt()->>'role' = 'authenticated'
    and exists (select 1 from jsonb_array_elements(
      case when jsonb_typeof(auth.jwt()->'amr') = 'array' then auth.jwt()->'amr' else '[]'::jsonb end
    ) a where a->>'method' = 'oauth')
    and exists (select 1 from auth.sessions s where s.user_id = u.id and s.id::text = auth.jwt()->>'session_id');
$$;
create function private.active_role()
returns text language sql stable security definer set search_path = '' as $$
  select p.role from public.admin_profiles p join private.google_identity() g
    on g.email = p.approved_email and g.subject = p.google_subject
  where p.user_id = auth.uid() and p.status = 'active';
$$;
create function private.has_totp()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from auth.mfa_factors f where f.user_id = auth.uid()
    and f.factor_type = 'totp' and f.status = 'verified');
$$;
create function private.owner_access()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(private.active_role() = 'super_admin' and auth.jwt()->>'aal' = 'aal2'
    and private.has_totp(), false);
$$;
create function private.recent_totp()
returns boolean language plpgsql stable security definer set search_path = '' as $$
declare a jsonb; seconds numeric; checked_at numeric := extract(epoch from clock_timestamp());
begin
  if not private.owner_access() then return false; end if;
  for a in select value from jsonb_array_elements(
    case when jsonb_typeof(auth.jwt()->'amr') = 'array' then auth.jwt()->'amr' else '[]'::jsonb end
  ) loop
    if a->>'method' = 'totp' and jsonb_typeof(a->'timestamp') = 'number' then
      seconds := (a->>'timestamp')::numeric;
      -- Signed JWT AMR, DB clock; future/missing/malformed proof fails closed.
      if seconds <= checked_at and seconds >= checked_at - 600 then return true; end if;
    end if;
  end loop;
  return false;
end;
$$;
create function private.require_owner(mutation boolean default false)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not private.owner_access() then raise exception 'Access denied' using errcode = '42501'; end if;
  if mutation then
    -- Serialize all owner operations on the actor row; never trust UI authority.
    perform 1 from public.admin_profiles where user_id = auth.uid() for update;
    if not private.owner_access() then raise exception 'Access denied' using errcode = '42501'; end if;
    if not private.recent_totp() then raise exception 'Recent MFA required' using errcode = '42501'; end if;
    if (select count(*) from private.admin_audit_log where actor_id = auth.uid()
      and occurred_at > now() - interval '1 minute') >= 60 then
      raise exception 'Access operation limit reached' using errcode = '22023';
    end if;
  end if;
end;
$$;

grant select (user_id, approved_email, display_name, role, status, created_at, updated_at, version)
  on public.admin_profiles to authenticated;
create policy admin_profiles_read on public.admin_profiles for select to authenticated using (
  private.owner_access() or (
    user_id = auth.uid() and private.active_role() in ('admin', 'staff')
    and (not private.has_totp() or auth.jwt()->>'aal' = 'aal2')
  )
);
-- All three tables have no INSERT/UPDATE/DELETE policies or caller grants.
-- AAL1 owner gets only this separate minimal security DTO, never a full profile.
create function private.security_state()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare r text;
begin
  r := private.active_role();
  if r is null then raise exception 'Access denied' using errcode = '42501'; end if;
  return jsonb_build_object('user_id', auth.uid(), 'role', r, 'status', 'active',
    'aal', case when auth.jwt()->>'aal' = 'aal2' then 'aal2' else 'aal1' end,
    'has_totp', private.has_totp(), 'recent_mfa', private.recent_totp());
end;
$$;

create function private.record_event(event_action text, target uuid default null,
  invitation uuid default null, previous_role text default null, next_role text default null,
  previous_status text default null, next_status text default null)
returns void language sql security definer set search_path = '' as $$
  insert into private.admin_audit_log(actor_id, target_id, invite_id, action, old_role,
    new_role, old_status, new_status, actor_aal)
  values (auth.uid(), target, invitation, event_action, previous_role, next_role,
    previous_status, next_status, case when auth.jwt()->>'aal' = 'aal2' then 'aal2' else 'aal1' end);
$$;
create function private.immutable_audit()
returns trigger language plpgsql set search_path = '' as $$
begin raise exception 'Audit is append-only' using errcode = '42501'; end;
$$;
create trigger immutable_admin_audit before update or delete on private.admin_audit_log
for each row execute function private.immutable_audit();

create function private.invite_create(invitee_email text, invitee_role text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare normalized text := lower(btrim(invitee_email)); invitation uuid; expired record;
begin
  perform private.require_owner(true);
  if invitee_role not in ('admin', 'staff') or invitee_role is null or normalized is null
    or length(normalized) > 254 or normalized !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    then raise exception 'Invalid invitation' using errcode = '22023'; end if;
  if exists (select 1 from public.admin_profiles where approved_email = normalized and (status in ('active', 'disabled') or role = 'super_admin'))
    then raise exception 'Membership already exists' using errcode = '22023'; end if;
  for expired in select id from private.admin_invites where email_normalized = normalized
    and status = 'pending' and expires_at <= now() for update loop
    update private.admin_invites set status = 'expired', version = version + 1 where id = expired.id;
    perform private.record_event('invite.expire', invitation => expired.id, previous_status => 'pending', next_status => 'expired');
  end loop;
  insert into private.admin_invites(email_normalized, role, invited_by)
    values (normalized, invitee_role, auth.uid()) returning id into invitation;
  perform private.record_event('invite.create', invitation => invitation, next_role => invitee_role, next_status => 'pending');
  return invitation;
end;
$$;
create function private.invite_revoke(invite_id uuid, expected_version integer)
returns void language plpgsql security definer set search_path = '' as $$
declare invitation private.admin_invites%rowtype;
begin
  perform private.require_owner(true);
  select * into invitation from private.admin_invites where id = invite_id for update;
  if not found or invitation.status <> 'pending' or invitation.version <> expected_version
    then raise exception 'Invitation changed' using errcode = 'PT409'; end if;
  update private.admin_invites set status = 'revoked', revoked_at = now(), version = version + 1 where id = invite_id;
  perform private.record_event('invite.revoke', invitation => invite_id, previous_status => 'pending', next_status => 'revoked');
end;
$$;
create function private.invite_accept()
returns void language plpgsql security definer set search_path = '' as $$
declare g record; invitation private.admin_invites%rowtype; profile public.admin_profiles%rowtype;
begin
  select * into g from private.google_identity();
  if not found then raise exception 'Access denied' using errcode = '42501'; end if;
  -- Identity-scoped transaction lock prevents concurrent acceptance/replay races.
  perform pg_advisory_xact_lock(hashtextextended(g.email, 610));
  select * into profile from public.admin_profiles where user_id = auth.uid() for update;
  if found then
    if profile.approved_email <> g.email or profile.google_subject <> g.subject or profile.status = 'disabled'
      or (profile.role = 'super_admin' and profile.status <> 'active')
      then raise exception 'Access denied' using errcode = '42501'; end if;
    if profile.status = 'active' then return; end if; -- Same bound identity, no second audit/membership.
  end if;
  select * into invitation from private.admin_invites where email_normalized = g.email
    and status = 'pending' and expires_at > now() and role in ('admin', 'staff') for update;
  if not found then raise exception 'Access denied' using errcode = '42501'; end if;
  if exists (select 1 from public.admin_profiles where approved_email = g.email and user_id <> auth.uid())
    then raise exception 'Access denied' using errcode = '42501'; end if;
  if profile.user_id is null then
    insert into public.admin_profiles(user_id, approved_email, google_subject, role)
      values (auth.uid(), g.email, g.subject, invitation.role);
  else
    update public.admin_profiles set role = invitation.role, status = 'active', updated_at = now(), version = version + 1
      where user_id = auth.uid() and status = 'revoked';
  end if;
  update private.admin_invites set status = 'accepted', accepted_by = auth.uid(), accepted_at = now(), version = version + 1
    where id = invitation.id;
  perform private.record_event('invite.accept', target => auth.uid(), invitation => invitation.id,
    previous_role => profile.role, next_role => invitation.role, previous_status => profile.status, next_status => 'active');
end;
$$;
create function private.member_change(target_user uuid, expected_version integer, change_action text, next_role text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare profile public.admin_profiles%rowtype; desired_status text;
begin
  perform private.require_owner(true);
  select * into profile from public.admin_profiles where user_id = target_user for update;
  -- PT409 is a terminal application conflict. 40001 means serialization failure
  -- and causes PostgREST to retry an intentionally permanent version mismatch.
  if not found or profile.version <> expected_version then raise exception 'Membership changed' using errcode = 'PT409'; end if;
  -- Initial owner cannot be changed through ordinary operations, even by itself.
  if profile.role = 'super_admin' then raise exception 'Owner changes require recovery procedure' using errcode = '42501'; end if;
  desired_status := profile.status;
  if change_action = 'role' then
    if next_role is null or next_role not in ('admin', 'staff') or profile.status = 'revoked'
      then raise exception 'Invalid role change' using errcode = '22023'; end if;
    if profile.role = next_role then return; end if;
  elsif change_action = 'disable' and profile.status = 'active' then desired_status := 'disabled';
  elsif change_action = 'reactivate' and profile.status = 'disabled' then desired_status := 'active';
  elsif change_action = 'revoke' and profile.status in ('active', 'disabled') then desired_status := 'revoked';
  else raise exception 'Invalid membership change' using errcode = '22023';
  end if;
  update public.admin_profiles set role = case when change_action = 'role' then next_role else role end,
    status = desired_status, updated_at = now(), version = version + 1 where user_id = target_user;
  perform private.record_event('member.' || change_action, target => target_user,
    previous_role => profile.role, next_role => case when change_action = 'role' then next_role else profile.role end,
    previous_status => profile.status, next_status => desired_status);
  -- Live membership deny is immediate even when Auth refresh/session termination
  -- is unavailable. Do not mutate Supabase-managed Auth tables directly.
end;
$$;
create function private.owner_snapshot()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  perform private.require_owner(false);
  return jsonb_build_object(
    'users', coalesce((select jsonb_agg(row_to_json(p) order by p.created_at) from
      (select user_id, approved_email, display_name, role, status, version, created_at from public.admin_profiles) p), '[]'::jsonb),
    'invites', coalesce((select jsonb_agg(row_to_json(i) order by i.created_at desc) from
      (select id, email_normalized, role, version, created_at, expires_at from private.admin_invites
        where status = 'pending' and expires_at > now()) i), '[]'::jsonb),
    'audit', coalesce((select jsonb_agg(row_to_json(a) order by a.occurred_at desc) from
      (select id, occurred_at, actor_id, target_id, invite_id, action, old_role, new_role,
        old_status, new_status, actor_aal, request_id from private.admin_audit_log order by occurred_at desc limit 50) a), '[]'::jsonb)
  );
end;
$$;
create function private.before_user_created(event jsonb)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if event->'user'->'app_metadata'->>'provider' = 'google'
    and coalesce(event->'user'->>'is_anonymous', 'false') = 'false'
    and exists (select 1 from private.admin_invites where email_normalized = lower(btrim(event->'user'->>'email'))
      and status = 'pending' and expires_at > now()) then return '{}'::jsonb; end if;
  return jsonb_build_object('error', jsonb_build_object('http_code', 403, 'message', 'Access denied'));
end;
$$;

-- Narrow public invoker wrappers; private is not a Data API exposed schema.
create function public.admin_security_state() returns jsonb language sql security invoker set search_path = '' as $$ select private.security_state(); $$;
create function public.admin_owner_snapshot() returns jsonb language sql security invoker set search_path = '' as $$ select private.owner_snapshot(); $$;
create function public.admin_accept_invite() returns void language sql security invoker set search_path = '' as $$ select private.invite_accept(); $$;
create function public.admin_create_invite(invitee_email text, invitee_role text) returns uuid language sql security invoker set search_path = '' as $$ select private.invite_create(invitee_email, invitee_role); $$;
create function public.admin_revoke_invite(invite_id uuid, expected_version integer) returns void language sql security invoker set search_path = '' as $$ select private.invite_revoke(invite_id, expected_version); $$;
create function public.admin_change_member(target_user uuid, expected_version integer, change_action text, next_role text default null) returns void language sql security invoker set search_path = '' as $$ select private.member_change(target_user, expected_version, change_action, next_role); $$;

revoke all on all functions in schema private from public, anon, authenticated, supabase_auth_admin;
revoke all on function public.admin_security_state(), public.admin_owner_snapshot(), public.admin_accept_invite(),
  public.admin_create_invite(text, text), public.admin_revoke_invite(uuid, integer), public.admin_change_member(uuid, integer, text, text)
  from public, anon, authenticated;
grant execute on function private.active_role(), private.has_totp(), private.owner_access(),
  private.security_state(), private.owner_snapshot(), private.invite_accept(), private.invite_create(text, text),
  private.invite_revoke(uuid, integer), private.member_change(uuid, integer, text, text) to authenticated;
grant execute on function public.admin_security_state(), public.admin_owner_snapshot(), public.admin_accept_invite(),
  public.admin_create_invite(text, text), public.admin_revoke_invite(uuid, integer), public.admin_change_member(uuid, integer, text, text) to authenticated;
grant execute on function private.before_user_created(jsonb) to supabase_auth_admin;
commit;
