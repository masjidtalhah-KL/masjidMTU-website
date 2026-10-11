-- Fasa 7.5: anonymous descriptive projection only. No seeds or public admission.
begin;

-- Shared truth with the existing operational window read; caller supplies no DB time.
create function private.campaign_registration_window_available(
  lifecycle_status text, opens_at timestamptz, closes_at timestamptz, instant timestamptz)
returns boolean language sql immutable set search_path='' as $$
  select coalesce(instant is not null and lifecycle_status='open'
    and (opens_at is null or opens_at<=instant)
    and (closes_at is null or closes_at>instant),false);
$$;
create or replace function private.campaign_window_state(target_campaign uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare c private.campaigns; instant timestamptz;
begin
  perform private.require_campaign_access('read');
  select * into c from private.campaigns where id=target_campaign;
  if not found then raise exception 'Access denied' using errcode='42501'; end if;
  instant:=clock_timestamp();
  return jsonb_build_object('id',c.id,'status',c.status,'version',c.version,
    'registrationAvailable',private.campaign_registration_window_available(
      c.status,c.registration_opens_at,c.registration_closes_at,instant));
end $$;

-- Registry-supported, missing/OFF fail closed. Never returned as raw public state.
create function private.system_flag_effectively_enabled(target_key text)
returns boolean language sql stable set search_path='' as $$
  select private.system_flag_supported(target_key) and coalesce(
    (select enabled from private.system_feature_flags where flag_key=target_key),false);
$$;
create or replace function private.system_feature_flags_read()
returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
  perform private.require_campaign_access('read');
  if (select count(distinct module_flag_key) from private.campaign_type_descriptors)>99 then
    raise exception 'Flag snapshot unavailable' using errcode='PT503'; end if;
  return (select jsonb_agg(jsonb_build_object('key',k.flag_key,'present',f.flag_key is not null,
    'enabled',private.system_flag_effectively_enabled(k.flag_key),'version',coalesce(f.version,0)) order by k.flag_key)
    from (select 'campaigns.enabled' as flag_key union
      select module_flag_key from private.campaign_type_descriptors) k
    left join private.system_feature_flags f on f.flag_key=k.flag_key);
end $$;

create function private.campaign_public_projection(target_slug text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare c private.campaigns; module_key text; instant timestamptz; display_state text;
begin
  if target_slug is null or length(target_slug) not between 3 and 100
    or target_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then return null; end if;
  if not private.system_flag_effectively_enabled('campaigns.enabled') then return null; end if;
  select * into c from private.campaigns where slug=target_slug;
  if not found or c.visibility not in ('public','unlisted') or c.status in ('draft','archived') then return null; end if;
  select module_flag_key into module_key from private.campaign_type_descriptors
    where type_key=c.type_key and config_version=c.config_version;
  if module_key is null or not private.system_flag_effectively_enabled(module_key) then return null; end if;
  -- Reuse exact reviewed descriptor/config validation, never expose configuration.
  perform private.campaign_management_payload(jsonb_build_object('type_key',c.type_key,
    'config_version',c.config_version,'slug',c.slug,'title',c.title,'configuration',c.configuration),true);
  if c.status='scheduled' and not c.scheduled_public_display then return null; end if;
  instant:=clock_timestamp();
  display_state:=c.status;
  if c.status in ('scheduled','open','paused') and c.registration_closes_at is not null
    and c.registration_closes_at<=instant then display_state:='closed';
  elsif c.status='open' and not private.campaign_registration_window_available(
    c.status,c.registration_opens_at,c.registration_closes_at,instant) then return null;
  end if;
  if display_state not in ('scheduled','open','paused','closed') then return null; end if;
  -- Public display state is not the stored lifecycle/version or a readiness/admission grant.
  return jsonb_build_object('slug',c.slug,'title',c.title,'state',display_state,
    'unlisted',c.visibility='unlisted','registration_opens_at',c.registration_opens_at,
    'registration_closes_at',c.registration_closes_at,'event_starts_at',c.event_starts_at,'event_ends_at',c.event_ends_at,
    -- Non-secret read locator, emitted only after operational eligibility. No caller-selected CMS context.
    'editorial_locator',case when c.editorial_document_type='program' and c.editorial_document_id is not null
      then jsonb_build_object('project_id',c.editorial_project_id,'dataset',c.editorial_dataset,
        'document_type',c.editorial_document_type,'document_id',c.editorial_document_id) else null end);
exception when invalid_parameter_value or check_violation then return null;
  when others then raise exception 'Campaign information unavailable' using errcode='PT503';
end $$;

-- Tiny definer wrapper avoids giving anon USAGE/EXECUTE on private schema/helpers.
-- Both direct PostgREST and server publishable-key calls enforce the same projection.
create function public.public_campaign_page(target_slug text)
returns jsonb language sql security definer set search_path='' as $$
  select private.campaign_public_projection(target_slug);
$$;
revoke all on function private.campaign_registration_window_available(text,timestamptz,timestamptz,timestamptz),
  private.system_flag_effectively_enabled(text),private.campaign_public_projection(text),public.public_campaign_page(text)
from public,anon,authenticated,service_role,supabase_auth_admin,authenticator,campaign_scheduler;
grant execute on function public.public_campaign_page(text) to anon,authenticated;
-- Existing guarded admin function ACLs are preserved by CREATE OR REPLACE.
commit;
