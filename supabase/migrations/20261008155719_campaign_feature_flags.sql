-- Fasa 7.2: flag service boundaries only. No seeds/descriptors/lifecycle paths.
begin;

create function private.system_flag_supported(target_key text)
returns boolean language sql stable set search_path = '' as $$
  select coalesce(target_key = 'campaigns.enabled' or exists (
    select 1 from private.campaign_type_descriptors where module_flag_key = target_key), false);
$$;

create function private.system_feature_flags_read()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  perform private.require_campaign_access('read');
  -- Registry is migration-owned. Callers cannot supply discovery keys or validators.
  if (select count(distinct module_flag_key) from private.campaign_type_descriptors) > 99 then
    raise exception 'Flag snapshot unavailable' using errcode = 'PT503';
  end if;
  return (select jsonb_agg(jsonb_build_object('key',k.flag_key,'present',f.flag_key is not null,
    'enabled',coalesce(f.enabled,false),'version',coalesce(f.version,0)) order by k.flag_key)
    from (select 'campaigns.enabled' as flag_key union
      select module_flag_key from private.campaign_type_descriptors) k
    left join private.system_feature_flags f on f.flag_key = k.flag_key);
end;
$$;

create function private.system_feature_flag_set(target_key text, desired_enabled boolean, expected_version integer)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare flag private.system_feature_flags; previous_version integer; previous_enabled boolean;
begin
  -- Existing live membership / verified AAL2 / signed recent TOTP / actor lock.
  perform private.require_owner(true);
  if target_key is null or length(target_key) > 56 or not private.system_flag_supported(target_key)
    or desired_enabled is null or expected_version is null or expected_version < 0 then
    raise exception 'Invalid flag command' using errcode = '22023';
  end if;
  -- A missing row cannot be SELECT FOR UPDATE locked. Serialize its identity too.
  -- Hash collisions only serialize unrelated keys; they never confer authority.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('campaign-system-flag:' || target_key,0));
  select * into flag from private.system_feature_flags where flag_key = target_key for update;
  -- Waiting for another transaction must not preserve expired/revoked authority,
  -- including on the no-op path which does not invoke the row/audit guards.
  perform private.require_owner(true);
  previous_version := coalesce(flag.version,0);
  previous_enabled := coalesce(flag.enabled,false);
  if expected_version <> previous_version then
    raise exception 'Flag changed' using errcode = 'PT409';
  end if;
  if previous_enabled = desired_enabled then
    return jsonb_build_object('key',target_key,'present',flag.flag_key is not null,
      'enabled',previous_enabled,'version',previous_version,'changed',false);
  end if;
  if flag.flag_key is null then
    insert into private.system_feature_flags(flag_key,enabled) values (target_key,true) returning * into flag;
  else
    update private.system_feature_flags set enabled = desired_enabled where flag_key = target_key returning * into flag;
  end if;
  perform private.record_campaign_event(case when desired_enabled then 'system_flag.enable' else 'system_flag.disable' end,
    null,target_key,previous_version,flag.version,
    jsonb_build_object('before_enabled',previous_enabled,'after_enabled',desired_enabled));
  return jsonb_build_object('key',target_key,'present',true,'enabled',flag.enabled,'version',flag.version,'changed',true);
end;
$$;

create function public.admin_system_flags()
returns jsonb language sql security invoker set search_path = '' as $$ select private.system_feature_flags_read(); $$;
create function public.admin_set_system_flag(target_key text, desired_enabled boolean, expected_version integer)
returns jsonb language sql security invoker set search_path = '' as $$
  select private.system_feature_flag_set(target_key,desired_enabled,expected_version);
$$;

revoke all on function private.system_flag_supported(text), private.system_feature_flags_read(),
  private.system_feature_flag_set(text,boolean,integer), public.admin_system_flags(), public.admin_set_system_flag(text,boolean,integer)
from public,anon,authenticated,service_role,supabase_auth_admin;
-- Same invoker-wrapper pattern as Foundation: only these guarded implementations.
grant execute on function private.system_feature_flags_read(), private.system_feature_flag_set(text,boolean,integer),
  public.admin_system_flags(), public.admin_set_system_flag(text,boolean,integer) to authenticated;
commit;
