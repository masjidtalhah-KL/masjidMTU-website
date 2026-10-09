-- Fasa 7.3 local candidate. No seeds, domain descriptors, hosted Cron or executor.
begin;
do $$ begin
  if not exists (select 1 from pg_roles where rolname='campaign_scheduler') then
    create role campaign_scheduler nologin noinherit nosuperuser nocreatedb nocreaterole noreplication nobypassrls;
  end if;
  if exists (select 1 from pg_roles where rolname='campaign_scheduler' and
    (rolcanlogin or rolsuper or rolcreatedb or rolcreaterole or rolreplication or rolbypassrls))
    or exists (select 1 from pg_roles r where r.rolname in
    ('anon','authenticated','service_role','supabase_auth_admin','authenticator')
    and pg_has_role(r.oid,'campaign_scheduler','MEMBER')) then
    raise exception 'Unsafe scheduler capability role' using errcode='42501';
  end if;
end $$;
-- Capability never owns code/tables. Original LOGIN identity, not definer identity,
-- is authority. Migration owner is explicitly excluded as an execution identity.
create function private.scheduler_caller() returns boolean
language sql stable security definer set search_path='' as $$
  select session_user <> current_user and pg_catalog.pg_has_role(session_user,'campaign_scheduler','MEMBER');
$$;
alter table private.campaigns add column updated_actor_category text not null default 'user';
alter table private.campaigns alter column updated_by drop not null;
alter table private.campaigns add constraint campaign_update_actor_check check (
  (updated_actor_category='user' and updated_by is not null) or
  (updated_actor_category='scheduler' and updated_by is null));
create function private.campaign_audit_metadata_v71_valid(event_action text, data jsonb)
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


create or replace function private.campaign_audit_metadata_valid(event_action text,data jsonb)
returns boolean language plpgsql immutable set search_path='' as $$
declare stripped jsonb; source text;
begin
  if jsonb_typeof(data) is distinct from 'object' or octet_length(data::text)>2048 then return false; end if;
  if event_action not like 'lifecycle.%' then
    return private.campaign_audit_metadata_v71_valid(event_action,data);
  end if;
  stripped := data - 'cause'; source := data->>'cause';
  if data ? 'cause' and (jsonb_typeof(data->'cause')<>'string' or source not in
    ('manager','deadline','missed_window','schedule_edit_deadline')) then return false; end if;
  if source is not null and (
    (event_action not in ('lifecycle.open','lifecycle.close') and source<>'manager') or
    (event_action='lifecycle.open' and source not in ('manager','deadline')) or
    (event_action='lifecycle.open' and source='deadline' and data->>'from_status'<>'scheduled') or
    (event_action='lifecycle.close' and source='missed_window' and data->>'from_status'<>'scheduled') or
    (event_action='lifecycle.close' and source='deadline' and data->>'from_status' not in ('open','paused'))
  ) then return false; end if;
  if event_action in ('lifecycle.schedule','lifecycle.unschedule') then
    if stripped ? 'planned_at' and stripped->'planned_at'<>'null'::jsonb then
      if jsonb_typeof(stripped->'planned_at')<>'string' or stripped->>'planned_at' !~
        '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,6})?Z$' then return false; end if;
      perform (stripped->>'planned_at')::timestamptz;
    end if;
    return coalesce(source='manager' and stripped ?& array['from_status','to_status']
      and not exists (select 1 from jsonb_object_keys(stripped) k where k not in ('from_status','to_status','planned_at'))
      and stripped->>'from_status'=case event_action when 'lifecycle.schedule' then 'draft' else 'scheduled' end
      and stripped->>'to_status'=case event_action when 'lifecycle.schedule' then 'scheduled' else 'draft' end,false);
  end if;
  return private.campaign_audit_metadata_v71_valid(event_action,stripped);
exception when others then return false;
end $$;
alter table private.admin_audit_log drop constraint admin_audit_log_governance_check;
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
    and ((target_kind = 'campaign' and campaign_id is not null and flag_key is null and action in ('campaign.create','campaign.update','schedule.change','lifecycle.schedule','lifecycle.unschedule','lifecycle.open','lifecycle.pause','lifecycle.resume','lifecycle.close','lifecycle.archive'))
      or (target_kind = 'system_flag' and campaign_id is null and flag_key is not null and action in ('system_flag.enable','system_flag.disable') and actor_category = 'user' and actor_aal = 'aal2'))
    and (action <> 'campaign.create' or expected_version = 0)
    and (action not in ('campaign.update','schedule.change','lifecycle.schedule','lifecycle.unschedule','lifecycle.open','lifecycle.pause','lifecycle.resume','lifecycle.close','lifecycle.archive') or expected_version > 0)
    and private.campaign_audit_metadata_valid(action, metadata))
);

-- The original caller remains session_user through nested SECURITY DEFINER calls.
create or replace function private.campaign_row_guard()
returns trigger language plpgsql security definer set search_path = '' as $$
declare actor uuid; validator name; valid boolean;
begin
  if tg_op = 'DELETE' then raise exception 'Campaign deletion denied' using errcode = '42501'; end if;
  if private.scheduler_caller() then
    if tg_op <> 'UPDATE' or
      (to_jsonb(new)-array['status','version','updated_by','updated_actor_category','updated_at']) is distinct from
      (to_jsonb(old)-array['status','version','updated_by','updated_actor_category','updated_at']) or
      not ((new.status='closed' and old.status in ('scheduled','open','paused') and old.registration_closes_at<=clock_timestamp())
        or (new.status='open' and old.status='scheduled' and old.registration_opens_at<=clock_timestamp()
          and (old.registration_closes_at is null or old.registration_closes_at>clock_timestamp()))) then
      raise exception 'Scheduler due transition only' using errcode='42501';
    end if;
    new.updated_actor_category := 'scheduler'; actor := null;
  else
    actor := private.require_campaign_access('manage'); new.updated_actor_category := 'user';
    if tg_op='UPDATE' and new.status is distinct from old.status then
      if old.status in ('closed','archived') and not (old.status='closed' and new.status='archived') then
        raise exception 'Terminal campaign state' using errcode='23514';
      end if;
      if ((old.status='draft' and new.status in ('scheduled','open','archived')) or
        (old.status='scheduled' and new.status in ('draft','open','closed')) or
        (old.status='open' and new.status in ('paused','closed')) or
        (old.status='paused' and new.status in ('open','closed')) or
        (old.status='closed' and new.status='archived')) is distinct from true then
        raise exception 'Invalid lifecycle transition' using errcode='22023';
      end if;
      if (new.status='scheduled' and (new.registration_opens_at is null or new.registration_opens_at<=clock_timestamp())) or
        (new.status='open' and ((new.registration_opens_at is not null and new.registration_opens_at>clock_timestamp()) or
          (new.registration_closes_at is not null and new.registration_closes_at<=clock_timestamp()))) then
        raise exception 'Invalid lifecycle window' using errcode='22023';
      end if;
    end if;
  end if;
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

-- One fresh DB-time evaluator, suitable for later admission composition. This
-- does not assert domain readiness or implement a public registration endpoint.
create function private.campaign_window_state(target_campaign uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare c private.campaigns; instant timestamptz;
begin
  perform private.require_campaign_access('read');
  select * into c from private.campaigns where id=target_campaign;
  if not found then raise exception 'Access denied' using errcode='42501'; end if;
  instant:=clock_timestamp();
  return jsonb_build_object('id',c.id,'status',c.status,'version',c.version,
    'registrationAvailable',c.status='open' and (c.registration_opens_at is null or c.registration_opens_at<=instant)
      and (c.registration_closes_at is null or c.registration_closes_at>instant));
end $$;
create function private.campaign_lifecycle_event(before_row private.campaigns, after_row private.campaigns,
  event_action text,cause text,request_id uuid) returns void
language plpgsql security definer set search_path='' as $$
declare data jsonb; planned timestamptz;
begin
  data:=jsonb_build_object('from_status',before_row.status,'to_status',after_row.status,'cause',cause);
  if event_action in ('lifecycle.schedule','lifecycle.unschedule','lifecycle.open','lifecycle.close') then
    planned:=case when event_action='lifecycle.close' then before_row.registration_closes_at else before_row.registration_opens_at end;
    data:=data||jsonb_build_object('planned_at',to_char(planned at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'));
  end if;
  if private.scheduler_caller() then
    if cause not in ('deadline','missed_window') or event_action not in ('lifecycle.open','lifecycle.close')
      or after_row.updated_actor_category<>'scheduler' or after_row.updated_by is not null then
      raise exception 'Scheduler due audit only' using errcode='42501'; end if;
    insert into private.admin_audit_log(actor_category,actor_aal,target_kind,campaign_id,action,request_id,
      expected_version,resulting_version,metadata)
    values ('scheduler','system','campaign',after_row.id,event_action,request_id,before_row.version,after_row.version,data);
  else
    perform private.record_campaign_event(event_action,after_row.id,null,before_row.version,after_row.version,data,request_id);
  end if;
end $$;

create function private.campaign_lifecycle_command(target_campaign uuid,command_action text,expected_version integer)
returns jsonb language plpgsql security definer set search_path='' as $$
declare c private.campaigns; next_row private.campaigns; next_status text; instant timestamptz;
begin
  perform private.require_campaign_access('manage');
  if target_campaign is null or expected_version is null or expected_version<=0 or command_action is null
    or command_action not in ('schedule','unschedule','open','pause','resume','close','archive') then
    raise exception 'Invalid command' using errcode='22023'; end if;
  select * into c from private.campaigns where id=target_campaign for update;
  if not found then raise exception 'Access denied' using errcode='42501'; end if;
  if c.version<>expected_version then raise exception 'Version conflict' using errcode='PT409'; end if;
  instant:=clock_timestamp();
  next_status:=case
    when command_action='schedule' and c.status='draft' and c.registration_opens_at>instant then 'scheduled'
    when command_action='unschedule' and c.status='scheduled' then 'draft'
    when command_action='open' and c.status in ('draft','scheduled')
      and (c.registration_opens_at is null or c.registration_opens_at<=instant)
      and (c.registration_closes_at is null or c.registration_closes_at>instant) then 'open'
    when command_action='pause' and c.status='open' then 'paused'
    when command_action='resume' and c.status='paused'
      and (c.registration_opens_at is null or c.registration_opens_at<=instant)
      and (c.registration_closes_at is null or c.registration_closes_at>instant) then 'open'
    when command_action='close' and c.status in ('scheduled','open','paused') then 'closed'
    when command_action='archive' and c.status in ('draft','closed') then 'archived'
    else null end;
  if next_status is null then raise exception 'Invalid lifecycle transition' using errcode='22023'; end if;
  update private.campaigns set status=next_status where id=c.id returning * into next_row;
  perform private.campaign_lifecycle_event(c,next_row,'lifecycle.'||command_action,'manager',gen_random_uuid());
  return jsonb_build_object('id',next_row.id,'status',next_row.status,'version',next_row.version,'changed',true);
end $$;

create function private.campaign_schedule_command(target_campaign uuid,expected_version integer,windows jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare c private.campaigns; next_row private.campaigns; before_close private.campaigns;
  opens timestamptz; closes timestamptz; starts timestamptz; ends timestamptz;
  instant timestamptz; changed boolean; request_id uuid:=gen_random_uuid(); k text; v jsonb;
begin
  perform private.require_campaign_access('manage');
  if target_campaign is null or expected_version is null or expected_version<=0 or
    jsonb_typeof(windows) is distinct from 'object' or octet_length(windows::text)>512 or
    not windows ?& array['registration_opens_at','registration_closes_at','event_starts_at','event_ends_at'] or
    (select count(*) from jsonb_object_keys(windows))<>4 then
    raise exception 'Invalid schedule' using errcode='22023'; end if;
  for k,v in select * from jsonb_each(windows) loop
    if v<>'null'::jsonb and (jsonb_typeof(v)<>'string' or (v#>>'{}') !~
      '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,6})?(Z|[+-]\d{2}:\d{2})$') then
      raise exception 'Invalid schedule' using errcode='22023'; end if;
  end loop;
  begin
    opens:=(windows->>'registration_opens_at')::timestamptz;
    closes:=(windows->>'registration_closes_at')::timestamptz;
    starts:=(windows->>'event_starts_at')::timestamptz;
    ends:=(windows->>'event_ends_at')::timestamptz;
  exception when others then raise exception 'Invalid schedule' using errcode='22023'; end;
  select * into c from private.campaigns where id=target_campaign for update;
  if not found then raise exception 'Access denied' using errcode='42501'; end if;
  if c.version<>expected_version then raise exception 'Version conflict' using errcode='PT409'; end if;
  -- Persisted deadline is lifecycle truth, independent of scheduler punctuality.
  -- Reconcile before considering any proposed windows; preserve them unapplied.
  instant:=clock_timestamp();
  if c.status in ('scheduled','open','paused') and c.registration_closes_at is not null
    and c.registration_closes_at<=instant then
    update private.campaigns set status='closed' where id=c.id returning * into next_row;
    perform private.campaign_lifecycle_event(c,next_row,'lifecycle.close','schedule_edit_deadline',request_id);
    return jsonb_build_object('id',next_row.id,'status',next_row.status,'version',next_row.version,'changed',true);
  end if;
  if (opens is not null and not isfinite(opens)) or (closes is not null and not isfinite(closes))
    or (starts is not null and not isfinite(starts)) or (ends is not null and not isfinite(ends))
    or (opens is not null and closes is not null and closes<=opens)
    or (starts is not null and ends is not null and ends<=starts) then
    raise exception 'Invalid schedule' using errcode='22023'; end if;
  if c.status in ('closed','archived') or (c.status='scheduled' and opens is null) or
    (c.status in ('open','paused') and opens is distinct from c.registration_opens_at) then
    raise exception 'Invalid schedule' using errcode='22023'; end if;
  changed:=row(opens,closes,starts,ends) is distinct from
    row(c.registration_opens_at,c.registration_closes_at,c.event_starts_at,c.event_ends_at);
  next_row:=c;
  if changed then
    update private.campaigns set registration_opens_at=opens,registration_closes_at=closes,event_starts_at=starts,event_ends_at=ends
      where id=c.id returning * into next_row;
    perform private.record_campaign_event('schedule.change',c.id,null,c.version,next_row.version,jsonb_build_object(
      'before_opens_at',to_char(c.registration_opens_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
      'after_opens_at',to_char(opens at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
      'before_closes_at',to_char(c.registration_closes_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
      'after_closes_at',to_char(closes at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
      'before_event_starts_at',to_char(c.event_starts_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
      'after_event_starts_at',to_char(starts at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
      'before_event_ends_at',to_char(c.event_ends_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
      'after_event_ends_at',to_char(ends at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"')),request_id);
  end if;
  -- Deadline enforcement precedes identical-window no-op. Never invent a date audit.
  instant:=clock_timestamp();
  if c.status in ('scheduled','open','paused') and closes<=instant then
    before_close:=next_row;
    update private.campaigns set status='closed' where id=c.id returning * into next_row;
    perform private.campaign_lifecycle_event(before_close,next_row,'lifecycle.close','schedule_edit_deadline',request_id);
  end if;
  return jsonb_build_object('id',next_row.id,'status',next_row.status,'version',next_row.version,
    'changed',next_row.version<>c.version);
end $$;

create function private.reconcile_campaign_lifecycle(batch_size integer default 50)
returns jsonb language plpgsql security definer set search_path='' as $$
declare c private.campaigns; next_row private.campaigns; closed_count integer:=0; opened_count integer:=0;
  instant timestamptz; request_id uuid:=gen_random_uuid();
begin
  if not private.scheduler_caller() then raise exception 'Scheduler capability required' using errcode='42501'; end if;
  if batch_size is null or batch_size not between 1 and 100 then raise exception 'Invalid batch' using errcode='22023'; end if;
  -- A total cap, with close priority. Locked rows are skipped; every row is
  -- rechecked against fresh DB time after lock. No actor/profile/flag locks.
  for c in select * from private.campaigns where status in ('scheduled','open','paused')
    and registration_closes_at<=clock_timestamp() order by id limit batch_size for update skip locked loop
    instant:=clock_timestamp();
    if c.status not in ('scheduled','open','paused') or c.registration_closes_at is null or c.registration_closes_at>instant then continue; end if;
    update private.campaigns set status='closed' where id=c.id returning * into next_row;
    perform private.campaign_lifecycle_event(c,next_row,'lifecycle.close',
      case when c.status='scheduled' then 'missed_window' else 'deadline' end,request_id);
    closed_count:=closed_count+1;
  end loop;
  if closed_count<batch_size then
    for c in select * from private.campaigns where status='scheduled' and registration_opens_at<=clock_timestamp()
      and (registration_closes_at is null or registration_closes_at>clock_timestamp())
      order by id limit (batch_size-closed_count) for update skip locked loop
      instant:=clock_timestamp();
      -- A close that becomes due while locking is processed on the next tick,
      -- never opened; effective availability already denies at its deadline.
      if c.status<>'scheduled' or c.registration_opens_at>instant or
        (c.registration_closes_at is not null and c.registration_closes_at<=instant) then continue; end if;
      update private.campaigns set status='open' where id=c.id returning * into next_row;
      perform private.campaign_lifecycle_event(c,next_row,'lifecycle.open','deadline',request_id);
      opened_count:=opened_count+1;
    end loop;
  end if;
  return jsonb_build_object('closed',closed_count,'opened',opened_count,'processed',closed_count+opened_count);
end $$;

create function public.admin_campaign_lifecycle(target_campaign uuid,command_action text,expected_version integer)
returns jsonb language sql security invoker set search_path='' as $$
  select private.campaign_lifecycle_command(target_campaign,command_action,expected_version);
$$;
create function public.admin_campaign_schedule(target_campaign uuid,expected_version integer,windows jsonb)
returns jsonb language sql security invoker set search_path='' as $$
  select private.campaign_schedule_command(target_campaign,expected_version,windows);
$$;
create function public.admin_campaign_window(target_campaign uuid)
returns jsonb language sql security invoker set search_path='' as $$ select private.campaign_window_state(target_campaign); $$;

revoke all on function private.scheduler_caller(),private.campaign_audit_metadata_v71_valid(text,jsonb),
  private.campaign_lifecycle_event(private.campaigns,private.campaigns,text,text,uuid),
  private.campaign_window_state(uuid),private.campaign_lifecycle_command(uuid,text,integer),
  private.campaign_schedule_command(uuid,integer,jsonb),private.reconcile_campaign_lifecycle(integer),
  public.admin_campaign_lifecycle(uuid,text,integer),public.admin_campaign_schedule(uuid,integer,jsonb),
  public.admin_campaign_window(uuid)
from public,anon,authenticated,service_role,supabase_auth_admin,campaign_scheduler;
grant usage on schema private to campaign_scheduler;
grant execute on function private.reconcile_campaign_lifecycle(integer) to campaign_scheduler;
grant execute on function private.campaign_window_state(uuid),private.campaign_lifecycle_command(uuid,text,integer),
  private.campaign_schedule_command(uuid,integer,jsonb),public.admin_campaign_lifecycle(uuid,text,integer),
  public.admin_campaign_schedule(uuid,integer,jsonb),public.admin_campaign_window(uuid) to authenticated;
-- No capability membership to any actual executor is provisioned here.
commit;
