-- Fasa 7.1 candidate: additive database foundation only. No production types,
-- flag seeds, mutation RPCs, scheduler, domain entities or public projection.
begin;

-- Migration-owned descriptors, never an admin-editable type builder. A future
-- reviewed migration supplies a private immutable boolean validator(jsonb).
create table private.campaign_type_descriptors (
  type_key text not null check (type_key ~ '^[a-z][a-z0-9_]{1,47}$'),
  config_version integer not null check (config_version > 0),
  module_flag_key text not null check (module_flag_key ~ '^[a-z][a-z0-9_]{1,47}\.enabled$' and module_flag_key <> 'campaigns.enabled'),
  validator_name name not null,
  primary key (type_key, config_version)
);
create function private.campaign_descriptor_guard()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op <> 'INSERT' then
    raise exception 'Descriptors require an additive reviewed migration' using errcode = '42501';
  end if;
  if not exists (select 1 from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'private' and p.proname = new.validator_name
      and p.prokind = 'f' and p.pronargs = 1
      and p.proargtypes[0] = 'jsonb'::regtype and p.prorettype = 'boolean'::regtype
      and p.provolatile = 'i' and not p.prosecdef
      and p.proconfig @> array['search_path=""']
      -- PUBLIC is ACL grantee 0, not a pg_roles entry. Include default ACLs.
      and not exists (select 1 from pg_catalog.aclexplode(
        coalesce(p.proacl, pg_catalog.acldefault('f', p.proowner))) a
        where a.grantee = 0 and a.privilege_type = 'EXECUTE')
      -- Effective checks include PUBLIC grants and inherited role privileges.
      and not exists (select 1 from unnest(array['anon','authenticated','service_role','supabase_auth_admin']) r
        where pg_catalog.has_function_privilege(r, p.oid, 'EXECUTE'))) then
    raise exception 'Reviewed private immutable config validator required' using errcode = '23514';
  end if;
  return new;
end;
$$;
create trigger campaign_descriptor_guard before insert or update or delete
on private.campaign_type_descriptors for each row execute function private.campaign_descriptor_guard();

-- Capability guards are separate from, and never replace, require_owner.
-- Only trusted private implementations may EXECUTE these primitives.
create function private.require_campaign_access(capability text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare r text;
begin
  if capability is null or capability not in ('read', 'manage', 'audit') then
    raise exception 'Access denied' using errcode = '42501';
  end if;
  if capability = 'manage' then
    perform 1 from public.admin_profiles where user_id = auth.uid() for update;
  end if;
  r := private.active_role();
  if r is null or (r = 'super_admin' and not private.owner_access())
    or (r in ('admin','staff') and private.has_totp() and auth.jwt()->>'aal' is distinct from 'aal2')
    or (r = 'staff' and capability <> 'read') then
    raise exception 'Access denied' using errcode = '42501';
  end if;
  if r = 'super_admin' and capability = 'manage' and not private.recent_totp() then
    raise exception 'Recent MFA required' using errcode = '42501';
  end if;
  return auth.uid();
end;
$$;

create table private.campaigns (
  id uuid primary key default gen_random_uuid(),
  type_key text not null,
  config_version integer not null default 1,
  schema_version integer not null default 1 check (schema_version = 1),
  slug text not null unique check (length(slug) between 3 and 100
    and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    and slug not in ('admin','studio','api','auth','login','settings','users','kempen','new')),
  slug_locked_at timestamptz check (slug_locked_at is null or isfinite(slug_locked_at)),
  title text not null check (title = btrim(title) and length(title) between 1 and 160
    and title !~ '[[:cntrl:]]'),
  status text not null default 'draft' check (status in ('draft','scheduled','open','paused','closed','archived')),
  registration_opens_at timestamptz,
  registration_closes_at timestamptz,
  event_starts_at timestamptz,
  event_ends_at timestamptz,
  visibility text not null default 'private' check (visibility in ('private','public','unlisted')),
  scheduled_public_display boolean not null default false,
  archived_history_display boolean not null default false,
  configuration jsonb not null default '{}' check (jsonb_typeof(configuration) = 'object' and octet_length(configuration::text) <= 4096),
  editorial_project_id text,
  editorial_dataset text,
  editorial_document_type text,
  editorial_document_id text,
  created_by uuid not null references public.admin_profiles(user_id) on delete restrict,
  updated_by uuid not null references public.admin_profiles(user_id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1 check (version > 0),
  foreign key (type_key, config_version) references private.campaign_type_descriptors(type_key, config_version) on delete restrict,
  check (status <> 'scheduled' or registration_opens_at is not null),
  check (registration_opens_at is null or isfinite(registration_opens_at)),
  check (registration_closes_at is null or isfinite(registration_closes_at)),
  check (event_starts_at is null or isfinite(event_starts_at)),
  check (event_ends_at is null or isfinite(event_ends_at)),
  check (registration_opens_at is null or registration_closes_at is null or registration_closes_at > registration_opens_at),
  check (event_starts_at is null or event_ends_at is null or event_ends_at > event_starts_at),
  check (num_nonnulls(editorial_project_id, editorial_dataset, editorial_document_type, editorial_document_id) in (0,4)),
  check (editorial_project_id is null or editorial_project_id ~ '^[a-z0-9]{8}$'),
  check (editorial_dataset is null or editorial_dataset ~ '^[a-z0-9][a-z0-9_-]{0,63}$'),
  check (editorial_document_type is null or editorial_document_type ~ '^[A-Za-z][A-Za-z0-9_]{0,63}$'),
  check (editorial_document_id is null or (editorial_document_id ~ '^[A-Za-z0-9_-][A-Za-z0-9_.-]{0,127}$'
    and editorial_document_id !~ '^(drafts|versions)\.'))
);
create unique index campaigns_editorial_binding on private.campaigns
  (editorial_project_id, editorial_dataset, editorial_document_id) where editorial_document_id is not null;
create index campaigns_type on private.campaigns(type_key, config_version);
create index campaigns_open_schedule on private.campaigns(registration_opens_at, id) where status = 'scheduled';
create index campaigns_close_schedule on private.campaigns(registration_closes_at, id) where status in ('open','paused','scheduled');
create index campaigns_created_by on private.campaigns(created_by);
create index campaigns_updated_by on private.campaigns(updated_by);

create function private.campaign_row_guard()
returns trigger language plpgsql security definer set search_path = '' as $$
declare actor uuid; validator name; valid boolean;
begin
  if tg_op = 'DELETE' then raise exception 'Campaign deletion denied' using errcode = '42501'; end if;
  actor := private.require_campaign_access('manage');
  if new.version is null or new.version <= 0 then raise exception 'Positive version required' using errcode = '23514'; end if;
  if tg_op = 'UPDATE' then
    if new.id <> old.id or new.type_key <> old.type_key or new.created_by <> old.created_by or new.created_at <> old.created_at then
      raise exception 'Immutable campaign identity' using errcode = '23514';
    end if;
    if new.slug <> old.slug and (old.status <> 'draft' or old.slug_locked_at is not null) then
      raise exception 'Slug is stable after draft' using errcode = '23514';
    end if;
    new.slug_locked_at := coalesce(old.slug_locked_at, case when new.status <> 'draft' then clock_timestamp() end);
    -- Structural terminal invariant, not a lifecycle command/service.
    if (old.status = 'closed' and new.status not in ('closed','archived')) or (old.status = 'archived' and new.status <> 'archived') then
      raise exception 'Terminal campaign state' using errcode = '23514';
    end if;
    new.version := old.version + 1;
  else
    new.created_by := actor; new.created_at := clock_timestamp(); new.version := 1;
    new.slug_locked_at := case when new.status <> 'draft' then clock_timestamp() end;
  end if;
  new.updated_by := actor; new.updated_at := clock_timestamp();
  select d.validator_name into validator from private.campaign_type_descriptors d
    where d.type_key = new.type_key and d.config_version = new.config_version;
  if validator is null or jsonb_typeof(new.configuration) is distinct from 'object' or octet_length(new.configuration::text) > 4096 then
    raise exception 'Unsupported campaign type/configuration' using errcode = '23514';
  end if;
  execute format('select private.%I($1)', validator) into valid using new.configuration;
  if valid is distinct from true then raise exception 'Invalid campaign configuration' using errcode = '23514'; end if;
  return new;
end;
$$;
create trigger campaign_row_guard before insert or update or delete on private.campaigns
for each row execute function private.campaign_row_guard();

create table private.system_feature_flags (
  flag_key text primary key check (flag_key ~ '^[a-z][a-z0-9_]{1,47}\.enabled$'),
  enabled boolean not null default false,
  version integer not null default 1 check (version > 0),
  created_by uuid not null references public.admin_profiles(user_id) on delete restrict,
  updated_by uuid not null references public.admin_profiles(user_id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index system_flags_created_by on private.system_feature_flags(created_by);
create index system_flags_updated_by on private.system_feature_flags(updated_by);
create function private.system_flag_row_guard()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'DELETE' then raise exception 'Flag deletion denied' using errcode = '42501'; end if;
  perform private.require_owner(true);
  if new.flag_key <> 'campaigns.enabled' and not exists (select 1 from private.campaign_type_descriptors where module_flag_key = new.flag_key) then
    raise exception 'Unsupported module flag' using errcode = '23514';
  end if;
  if new.version is null or new.version <= 0 then raise exception 'Positive version required' using errcode = '23514'; end if;
  if tg_op = 'UPDATE' then
    if new.flag_key <> old.flag_key or new.created_by <> old.created_by or new.created_at <> old.created_at then
      raise exception 'Immutable flag identity' using errcode = '23514';
    end if;
    new.version := old.version + 1;
  else
    new.created_by := auth.uid(); new.created_at := clock_timestamp(); new.version := 1;
  end if;
  new.updated_by := auth.uid(); new.updated_at := clock_timestamp();
  return new;
end;
$$;
create trigger system_flag_row_guard before insert or update or delete on private.system_feature_flags
for each row execute function private.system_flag_row_guard();

alter table private.campaign_type_descriptors enable row level security;
alter table private.campaigns enable row level security;
alter table private.system_feature_flags enable row level security;
-- No raw SELECT or mutation grants, and no permissive RLS policies.
revoke all on private.campaign_type_descriptors, private.campaigns, private.system_feature_flags
from public, anon, authenticated, supabase_auth_admin, service_role;

-- Closed structural audit vocabulary, never a JSON dump. Foundation rows retain
-- their original defaults and immutable evidence; no row rewrite/backfill.
create function private.campaign_audit_metadata_valid(event_action text, data jsonb)
returns boolean language plpgsql immutable set search_path = '' as $$
declare allowed text[]; k text; v jsonb; t text;
begin
  if jsonb_typeof(data) is distinct from 'object' or octet_length(data::text) > 2048 then return false; end if;
  allowed := case event_action
    when 'campaign.create' then array['config_version','visibility','to_status']
    when 'campaign.update' then array['config_version','changed_fields']
    when 'schedule.change' then array['before_opens_at','after_opens_at','before_closes_at','after_closes_at','before_event_starts_at','after_event_starts_at','before_event_ends_at','after_event_ends_at']
    when 'lifecycle.open' then array['from_status','to_status','planned_at']
    when 'lifecycle.pause' then array['from_status','to_status']
    when 'lifecycle.resume' then array['from_status','to_status']
    when 'lifecycle.close' then array['from_status','to_status','planned_at']
    when 'lifecycle.archive' then array['from_status','to_status']
    when 'system_flag.enable' then array['before_enabled','after_enabled']
    when 'system_flag.disable' then array['before_enabled','after_enabled']
    else null end;
  if allowed is null then return false; end if;
  for k,v in select * from jsonb_each(data) loop
    if not k = any(allowed) then return false; end if;
    if k = 'config_version' then
      if jsonb_typeof(v) <> 'number' or v::text !~ '^[1-9][0-9]{0,8}$' then return false; end if;
    elsif k = 'visibility' then
      if jsonb_typeof(v) <> 'string' or v #>> '{}' not in ('private','public','unlisted') then return false; end if;
    elsif k in ('from_status','to_status') then
      if jsonb_typeof(v) <> 'string' or v #>> '{}' not in ('draft','scheduled','open','paused','closed','archived') then return false; end if;
    elsif k in ('before_enabled','after_enabled') then
      if jsonb_typeof(v) <> 'boolean' then return false; end if;
    elsif k = 'changed_fields' then
      if jsonb_typeof(v) <> 'array' or jsonb_array_length(v) not between 1 and 8 then return false; end if;
      if exists (select 1 from jsonb_array_elements(v) item where jsonb_typeof(item) <> 'string'
        or item #>> '{}' not in ('slug','title','configuration','config_version','visibility','scheduled_public_display','archived_history_display','editorial_binding')) then return false; end if;
    else
      if v <> 'null'::jsonb then
        t := v #>> '{}';
        if jsonb_typeof(v) <> 'string' or t !~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,6})?Z$' then return false; end if;
        perform t::timestamptz;
      end if;
    end if;
  end loop;
  if event_action like 'lifecycle.%' then
    return coalesce(case event_action
      when 'lifecycle.open' then data->>'from_status' in ('draft','scheduled') and data->>'to_status' = 'open'
      when 'lifecycle.pause' then data->>'from_status' = 'open' and data->>'to_status' = 'paused'
      when 'lifecycle.resume' then data->>'from_status' = 'paused' and data->>'to_status' = 'open'
      when 'lifecycle.close' then data->>'from_status' in ('open','paused','scheduled') and data->>'to_status' = 'closed'
      when 'lifecycle.archive' then data->>'from_status' in ('draft','closed') and data->>'to_status' = 'archived' end, false);
  end if;
  if event_action like 'system_flag.%' then
    return data ? 'before_enabled' and data ? 'after_enabled'
      and (data->>'before_enabled')::boolean = (event_action = 'system_flag.disable')
      and (data->>'after_enabled')::boolean = (event_action = 'system_flag.enable');
  end if;
  return true;
exception when others then return false;
end;
$$;

alter table private.admin_audit_log
  add column target_kind text not null default 'foundation',
  add column actor_category text not null default 'foundation',
  add column campaign_id uuid references private.campaigns(id) on delete restrict,
  add column flag_key text references private.system_feature_flags(flag_key) on delete restrict,
  add column expected_version integer,
  add column resulting_version integer,
  add column metadata jsonb not null default '{}';
alter table private.admin_audit_log drop constraint admin_audit_log_action_check;
alter table private.admin_audit_log drop constraint admin_audit_log_check;
alter table private.admin_audit_log add constraint admin_audit_log_governance_check check (
  (target_kind = 'foundation' and actor_category = 'foundation'
    and action in ('invite.create','invite.expire','invite.revoke','invite.accept','member.role','member.disable','member.reactivate','member.revoke','bootstrap','recovery')
    and (actor_id is not null or action in ('bootstrap','recovery'))
    and campaign_id is null and flag_key is null and expected_version is null and resulting_version is null and metadata = '{}'::jsonb)
  or
  (target_kind in ('campaign','system_flag') and target_id is null and invite_id is null
    and old_role is null and new_role is null and old_status is null and new_status is null
    and expected_version is not null and expected_version >= 0 and resulting_version is not null and resulting_version = expected_version + 1
    and ((actor_category = 'user' and actor_id is not null and actor_aal in ('aal1','aal2'))
      or (actor_category = 'scheduler' and actor_id is null and actor_aal = 'system' and target_kind = 'campaign' and action in ('lifecycle.open','lifecycle.close') and expected_version > 0))
    and ((target_kind = 'campaign' and campaign_id is not null and flag_key is null and action in ('campaign.create','campaign.update','schedule.change','lifecycle.open','lifecycle.pause','lifecycle.resume','lifecycle.close','lifecycle.archive'))
      or (target_kind = 'system_flag' and campaign_id is null and flag_key is not null and action in ('system_flag.enable','system_flag.disable') and actor_category = 'user' and actor_aal = 'aal2'))
    and (action <> 'campaign.create' or expected_version = 0)
    and (action not in ('campaign.update','schedule.change','lifecycle.open','lifecycle.pause','lifecycle.resume','lifecycle.close','lifecycle.archive') or expected_version > 0)
    and private.campaign_audit_metadata_valid(action, metadata))
);
create index admin_audit_campaign_time on private.admin_audit_log(campaign_id, occurred_at desc, id) where target_kind = 'campaign';
create index admin_audit_flag_time on private.admin_audit_log(flag_key, occurred_at desc, id) where target_kind = 'system_flag';

-- Internal writer only. No scheduler entry point or client EXECUTE privilege.
-- Later guarded commands must write state and audit in one transaction.
create function private.record_campaign_event(event_action text, target_campaign uuid, target_flag text,
  previous_version integer, next_version integer, safe_metadata jsonb, correlation_id uuid default gen_random_uuid())
returns void language plpgsql security definer set search_path = '' as $$
declare actor uuid; kind text;
begin
  if target_campaign is not null and target_flag is null then
    actor := private.require_campaign_access('manage'); kind := 'campaign';
    if not exists (select 1 from private.campaigns where id = target_campaign and version = next_version) then
      raise exception 'Campaign/version mismatch' using errcode = '23514';
    end if;
  elsif target_campaign is null and target_flag is not null then
    perform private.require_owner(true); actor := auth.uid(); kind := 'system_flag';
    if not exists (select 1 from private.system_feature_flags where flag_key = target_flag and version = next_version) then
      raise exception 'Flag/version mismatch' using errcode = '23514';
    end if;
  else raise exception 'Invalid audit target' using errcode = '23514'; end if;
  insert into private.admin_audit_log(actor_id, actor_aal, actor_category, target_kind, campaign_id, flag_key,
    action, request_id, expected_version, resulting_version, metadata)
  values (actor, auth.jwt()->>'aal', 'user', kind, target_campaign, target_flag,
    event_action, correlation_id, previous_version, next_version, safe_metadata);
end;
$$;

-- Bounded foundation read DTO, not a campaign CRUD workflow or public DTO.
create function private.campaign_foundation_list(page_size integer)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  perform private.require_campaign_access('read');
  if page_size is null or page_size not between 1 and 100 then raise exception 'Invalid limit' using errcode = '22023'; end if;
  return coalesce((select jsonb_agg(to_jsonb(c) order by c.created_at, c.id) from
    (select id, type_key, config_version, slug, title, status, registration_opens_at, registration_closes_at,
      event_starts_at, event_ends_at, visibility, scheduled_public_display, archived_history_display, version, created_at
      from private.campaigns order by created_at, id limit page_size) c), '[]'::jsonb);
end;
$$;
create function private.campaign_audit_history(target_campaign uuid, page_size integer)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  perform private.require_campaign_access('audit');
  if page_size is null or page_size not between 1 and 100 then raise exception 'Invalid limit' using errcode = '22023'; end if;
  return coalesce((select jsonb_agg(to_jsonb(a) order by a.occurred_at desc, a.id) from
    (select id, occurred_at, actor_id, actor_category, campaign_id, flag_key, action, request_id,
      expected_version, resulting_version, metadata from private.admin_audit_log
      where (target_kind = 'campaign' or (target_kind = 'system_flag' and private.owner_access()))
        and (target_campaign is null or campaign_id = target_campaign)
      order by occurred_at desc, id limit page_size) a), '[]'::jsonb);
end;
$$;
create function public.campaign_foundation_list(page_size integer default 50)
returns jsonb language sql security invoker set search_path = '' as $$ select private.campaign_foundation_list(page_size); $$;
create function public.campaign_audit_history(target_campaign uuid default null, page_size integer default 50)
returns jsonb language sql security invoker set search_path = '' as $$ select private.campaign_audit_history(target_campaign, page_size); $$;

-- Explicit per-function revokes; do not sweep away existing Fasa 6 grants.
revoke all on function private.campaign_descriptor_guard(), private.require_campaign_access(text), private.campaign_row_guard(),
  private.system_flag_row_guard(), private.campaign_audit_metadata_valid(text,jsonb),
  private.record_campaign_event(text,uuid,text,integer,integer,jsonb,uuid),
  private.campaign_foundation_list(integer), private.campaign_audit_history(uuid,integer),
  public.campaign_foundation_list(integer), public.campaign_audit_history(uuid,integer)
from public, anon, authenticated, supabase_auth_admin, service_role;
grant execute on function private.campaign_foundation_list(integer), private.campaign_audit_history(uuid,integer),
  public.campaign_foundation_list(integer), public.campaign_audit_history(uuid,integer) to authenticated;
commit;
