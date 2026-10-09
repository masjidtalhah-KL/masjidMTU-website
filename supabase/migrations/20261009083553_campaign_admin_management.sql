-- Fasa 7.4 local candidate. No seeds/types, public DTO, editorial write or Cron.
begin;

create function private.campaign_management_payload(data jsonb, creating boolean, current_type text default null)
returns void language plpgsql set search_path='' as $$
declare keys text[]; kind text; cv integer; validator name; valid boolean;
begin
  keys:=case when creating then array['type_key','config_version','slug','title','configuration']
    else array['config_version','slug','title','configuration','visibility','scheduled_public_display','archived_history_display'] end;
  if creating is null or jsonb_typeof(data) is distinct from 'object' or octet_length(data::text)>8192
    or not data ?& keys or (select count(*) from jsonb_object_keys(data))<>cardinality(keys) then
    raise exception 'Invalid campaign command' using errcode='22023'; end if;
  kind:=case when creating then data->>'type_key' else current_type end;
  if kind is null or kind !~ '^[a-z][a-z0-9_]{1,47}$'
    or (creating and jsonb_typeof(data->'type_key') is distinct from 'string')
    or jsonb_typeof(data->'config_version') is distinct from 'number'
    or (data->>'config_version') !~ '^[1-9][0-9]{0,9}$'
    or (data->>'config_version')::numeric>2147483647
    or jsonb_typeof(data->'slug') is distinct from 'string'
    or length(data->>'slug') not between 3 and 100 or (data->>'slug') !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    or data->>'slug' in ('admin','studio','api','auth','login','settings','users','kempen','new')
    or jsonb_typeof(data->'title') is distinct from 'string'
    or length(data->>'title') not between 1 and 160 or data->>'title'<>btrim(data->>'title')
    or (data->>'title') ~ '[[:cntrl:]]'
    or jsonb_typeof(data->'configuration') is distinct from 'object'
    or octet_length((data->'configuration')::text)>4096 then
    raise exception 'Invalid campaign command' using errcode='22023'; end if;
  if not creating and (jsonb_typeof(data->'visibility') is distinct from 'string'
    or data->>'visibility' not in ('private','public','unlisted')
    or jsonb_typeof(data->'scheduled_public_display') is distinct from 'boolean'
    or jsonb_typeof(data->'archived_history_display') is distinct from 'boolean') then
    raise exception 'Invalid campaign command' using errcode='22023'; end if;
  cv:=(data->>'config_version')::integer;
  select validator_name into validator from private.campaign_type_descriptors
    where type_key=kind and config_version=cv;
  if validator is null then raise exception 'Unsupported campaign configuration' using errcode='22023'; end if;
  execute format('select private.%I($1)',validator) into valid using data->'configuration';
  if valid is distinct from true then raise exception 'Invalid campaign configuration' using errcode='22023'; end if;
end $$;

-- Explicit DTO: no profile IDs, validator names, session data or raw audit fields.
create function private.campaign_management_projection(c private.campaigns)
returns jsonb language sql stable set search_path='' as $$
  select jsonb_build_object('id',c.id,'type_key',c.type_key,'config_version',c.config_version,
    'slug',c.slug,'slug_editable',c.status='draft' and c.slug_locked_at is null,
    'title',c.title,'status',c.status,'registration_opens_at',c.registration_opens_at,
    'registration_closes_at',c.registration_closes_at,'event_starts_at',c.event_starts_at,'event_ends_at',c.event_ends_at,
    'visibility',c.visibility,'scheduled_public_display',c.scheduled_public_display,
    'archived_history_display',c.archived_history_display,'configuration',c.configuration,
    'version',c.version,'created_at',c.created_at,'updated_at',c.updated_at,
    'editorial_binding',case when c.editorial_document_id is null then null else jsonb_build_object(
      'project_id',c.editorial_project_id,'dataset',c.editorial_dataset,
      'document_type',c.editorial_document_type,'document_id',c.editorial_document_id) end);
$$;

create function private.campaign_type_catalog()
returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
  perform private.require_campaign_access('read');
  if (select count(*) from private.campaign_type_descriptors)>100 then
    raise exception 'Catalog unavailable' using errcode='PT503'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('type_key',type_key,'config_version',config_version,
    'module_flag_key',module_flag_key) order by type_key,config_version) from private.campaign_type_descriptors),'[]'::jsonb);
end $$;

create function private.campaign_management_detail(target_campaign uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare c private.campaigns;
begin
  perform private.require_campaign_access('read');
  if target_campaign is null then raise exception 'Invalid campaign' using errcode='22023'; end if;
  select * into c from private.campaigns where id=target_campaign;
  if not found then return null; end if;
  return private.campaign_management_projection(c);
end $$;

create function private.campaign_management_create(payload jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare c private.campaigns;
begin
  perform private.require_campaign_access('manage');
  perform private.campaign_management_payload(payload,true);
  insert into private.campaigns(type_key,config_version,slug,title,configuration)
    values(payload->>'type_key',(payload->>'config_version')::integer,payload->>'slug',payload->>'title',payload->'configuration')
    returning * into c;
  perform private.record_campaign_event('campaign.create',c.id,null,0,c.version,
    jsonb_build_object('config_version',c.config_version,'visibility','private','to_status','draft'));
  return jsonb_build_object('id',c.id,'status',c.status,'version',c.version,'changed',true);
end $$;

create function private.campaign_management_update(target_campaign uuid,expected_version integer,payload jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare c private.campaigns; next_row private.campaigns; changed_fields text[]:='{}'; key text;
begin
  perform private.require_campaign_access('manage');
  if target_campaign is null or expected_version is null or expected_version not between 1 and 2147483645 then
    raise exception 'Invalid campaign command' using errcode='22023'; end if;
  select * into c from private.campaigns where id=target_campaign for update;
  if not found then raise exception 'Access denied' using errcode='42501'; end if;
  -- Waiting cannot carry expired MFA/ended session authority into a no-op.
  perform private.require_campaign_access('manage');
  if c.version<>expected_version then raise exception 'Version conflict' using errcode='PT409'; end if;
  perform private.campaign_management_payload(payload,false,c.type_key);
  foreach key in array array['slug','title','visibility','scheduled_public_display','archived_history_display','config_version','configuration'] loop
    if payload->key is distinct from to_jsonb(c)->key then changed_fields:=array_append(changed_fields,key); end if;
  end loop;
  if cardinality(changed_fields)=0 then
    return jsonb_build_object('id',c.id,'status',c.status,'version',c.version,'changed',false); end if;
  if 'slug'=any(changed_fields) and (c.status<>'draft' or c.slug_locked_at is not null) then
    raise exception 'Slug is locked' using errcode='22023'; end if;
  update private.campaigns set slug=payload->>'slug',title=payload->>'title',visibility=payload->>'visibility',
    scheduled_public_display=(payload->>'scheduled_public_display')::boolean,
    archived_history_display=(payload->>'archived_history_display')::boolean,
    config_version=(payload->>'config_version')::integer,configuration=payload->'configuration'
    where id=c.id returning * into next_row;
  perform private.record_campaign_event('campaign.update',c.id,null,c.version,next_row.version,
    jsonb_build_object('config_version',next_row.config_version,'changed_fields',to_jsonb(changed_fields)));
  return jsonb_build_object('id',next_row.id,'status',next_row.status,'version',next_row.version,'changed',true);
end $$;

create function public.admin_campaign_types() returns jsonb
language sql security invoker set search_path='' as $$ select private.campaign_type_catalog(); $$;
create function public.admin_campaign_detail(target_campaign uuid) returns jsonb
language sql security invoker set search_path='' as $$ select private.campaign_management_detail(target_campaign); $$;
create function public.admin_campaign_create(payload jsonb) returns jsonb
language sql security invoker set search_path='' as $$ select private.campaign_management_create(payload); $$;
create function public.admin_campaign_update(target_campaign uuid,expected_version integer,payload jsonb) returns jsonb
language sql security invoker set search_path='' as $$ select private.campaign_management_update(target_campaign,expected_version,payload); $$;

revoke all on function private.campaign_management_payload(jsonb,boolean,text),
  private.campaign_management_projection(private.campaigns),private.campaign_type_catalog(),
  private.campaign_management_detail(uuid),private.campaign_management_create(jsonb),private.campaign_management_update(uuid,integer,jsonb),
  public.admin_campaign_types(),public.admin_campaign_detail(uuid),public.admin_campaign_create(jsonb),public.admin_campaign_update(uuid,integer,jsonb)
from public,anon,authenticated,service_role,supabase_auth_admin,authenticator,campaign_scheduler;
grant execute on function private.campaign_type_catalog(),private.campaign_management_detail(uuid),
  private.campaign_management_create(jsonb),private.campaign_management_update(uuid,integer,jsonb),
  public.admin_campaign_types(),public.admin_campaign_detail(uuid),public.admin_campaign_create(jsonb),public.admin_campaign_update(uuid,integer,jsonb)
to authenticated;
commit;
