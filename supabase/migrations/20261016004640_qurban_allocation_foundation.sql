begin;
-- Policy B: grid is structure only. No runtime initial-allocation grant or eligibility field.
create table private.qurban_cattle (
 id uuid primary key default gen_random_uuid(),
 campaign_id uuid not null references private.campaigns(id) on delete restrict,
 display_number integer not null check(display_number between 1 and 10000),
 capacity integer not null check(capacity between 1 and 100),
 created_at timestamptz not null default clock_timestamp(),
 unique(campaign_id,display_number), unique(id,campaign_id)
);
create table private.qurban_cattle_slots (
 id uuid primary key default gen_random_uuid(),
 campaign_id uuid not null,
 cattle_id uuid not null,
 slot_number integer not null check(slot_number between 1 and 100),
 created_at timestamptz not null default clock_timestamp(),
 foreign key(cattle_id,campaign_id) references private.qurban_cattle(id,campaign_id) on delete restrict,
 unique(cattle_id,slot_number), unique(id,campaign_id)
);
alter table private.qurban_participations add constraint qurban_participation_identity_registration unique(id,registration_id);
create table private.qurban_allocations (
 id uuid primary key default gen_random_uuid(),
 campaign_id uuid not null,
 registration_id uuid not null,
 participation_id uuid not null unique,
 slot_id uuid not null unique,
 version integer not null default 1 check(version>0),
 created_at timestamptz not null default clock_timestamp(),
 updated_at timestamptz not null default clock_timestamp(),
 foreign key(registration_id,campaign_id) references private.qurban_registrations(id,campaign_id) on delete restrict,
 foreign key(participation_id,registration_id) references private.qurban_participations(id,registration_id) on delete restrict,
 foreign key(slot_id,campaign_id) references private.qurban_cattle_slots(id,campaign_id) on delete restrict
);
create index qurban_slot_campaign on private.qurban_cattle_slots(campaign_id,cattle_id,slot_number);
create index qurban_allocation_registration on private.qurban_allocations(registration_id,id);
create index qurban_allocation_campaign on private.qurban_allocations(campaign_id,id);
alter table private.qurban_operational_audit
 add column allocation_id uuid references private.qurban_allocations(id) on delete restrict,
 add column cattle_number integer check(cattle_number between 1 and 10000),
 add column slot_number integer check(slot_number between 1 and 100),
 add column previous_cattle_number integer check(previous_cattle_number between 1 and 10000),
 add column previous_slot_number integer check(previous_slot_number between 1 and 100),
 add column grid_cattle_count integer check(grid_cattle_count between 1 and 10000),
 add column grid_shares_per_cattle integer check(grid_shares_per_cattle between 1 and 100);
create index qurban_audit_allocation on private.qurban_operational_audit(allocation_id,occurred_at,id);
-- Replace only action-shape checks; retain original guards, actor derivation, immutability and ACL.
do $constraints$ declare c record; begin
 for c in select conname from pg_catalog.pg_constraint where conrelid='private.qurban_operational_audit'::regclass and contype='c'
 and pg_catalog.pg_get_constraintdef(oid) like '%action%' loop
 execute pg_catalog.format('alter table private.qurban_operational_audit drop constraint %I',c.conname);
 end loop;
end $constraints$;
alter table private.qurban_operational_audit add constraint qurban_operational_action_shape check(
 (action in ('registration.amended','participation.amended','registration.cancelled','qurban.export.xlsx')
  and allocation_id is null and cattle_number is null and slot_number is null and previous_cattle_number is null and previous_slot_number is null
  and grid_cattle_count is null and grid_shares_per_cattle is null
  and (
   (action='registration.amended' and registration_id is not null and participation_id is null and export_id is null and reason is null
    and cardinality(changed_fields)>0 and changed_fields <@ array['applicant_name','phone','address','email','attendance','same_cattle_preference']::text[])
   or (action='participation.amended' and registration_id is not null and participation_id is not null and export_id is null and reason is null
    and cardinality(changed_fields)>0 and changed_fields <@ array['participant_name','purpose']::text[])
   or (action='registration.cancelled' and registration_id is not null and participation_id is null and export_id is null and reason is not null and changed_fields=array['status']::text[])
   or (action='qurban.export.xlsx' and registration_id is null and participation_id is null and export_id is not null and reason is null and changed_fields='{}'::text[]))
  and ((action='qurban.export.xlsx' and expected_version is null and resulting_version is null and registration_count is not null and participation_count is not null
    and registration_count between 0 and 5000 and participation_count between 0 and 20000)
   or (action<>'qurban.export.xlsx' and expected_version is not null and resulting_version is not null and expected_version>0 and resulting_version=expected_version+1
    and registration_count is null and participation_count is null)))
 or
 (action in ('allocation.grid_initialized','allocation.assigned','allocation.reassigned') and changed_fields='{}'::text[] and reason is null and export_id is null
 and registration_count is null and participation_count is null and
  ((action='allocation.grid_initialized' and registration_id is null and participation_id is null and allocation_id is null
    and expected_version is null and resulting_version is null and cattle_number is null and slot_number is null
    and previous_cattle_number is null and previous_slot_number is null and grid_cattle_count is not null and grid_shares_per_cattle is not null)
   or (action in ('allocation.assigned','allocation.reassigned') and registration_id is not null and participation_id is not null and allocation_id is not null
    and cattle_number is not null and slot_number is not null and grid_cattle_count is null and grid_shares_per_cattle is null
    and expected_version is not null and resulting_version is not null and resulting_version=expected_version+1 and
     ((action='allocation.assigned' and expected_version=0 and previous_cattle_number is null and previous_slot_number is null)
      or (action='allocation.reassigned' and expected_version>0 and previous_cattle_number is not null and previous_slot_number is not null)))))
);

create function private.qurban_allocation_campaign(target uuid,write_access boolean) returns private.campaigns
language plpgsql set search_path='' as $$
declare c private.campaigns; n integer;s integer;
begin
 if write_access then
  perform private.require_campaign_access('manage');
  -- Acquire exclusive campaign lock directly; never upgrade a shared lock across actors.
  select * into c from private.campaigns where id=target and type_key='qurban' and config_version=1 for update;
  if not found or not private.qurban_config_v1_valid(c.configuration) then raise exception 'Access denied' using errcode='42501';end if;
 else c:=private.qurban_admin_campaign(target,false);
 end if;
 select count(*) into n from private.qurban_cattle where campaign_id=target;
 if n>0 then
  select count(*) into s from private.qurban_cattle_slots where campaign_id=target;
  if n<>(c.configuration->>'cattle_count')::integer or s<>n*(c.configuration->>'shares_per_cattle')::integer
   then raise exception 'Grid structure conflict' using errcode='PT409';end if;
 end if;
 return c;
end $$;

create function private.qurban_capacity_config_guard() returns trigger language plpgsql set search_path='' as $$
begin
 if exists(select 1 from private.qurban_cattle where campaign_id=old.id) and
  (new.id is distinct from old.id or new.type_key is distinct from old.type_key or new.config_version is distinct from old.config_version
   or new.configuration->'cattle_count' is distinct from old.configuration->'cattle_count'
   or new.configuration->'shares_per_cattle' is distinct from old.configuration->'shares_per_cattle')
 then raise exception 'Capacity grid structure is locked' using errcode='PT409';end if;
 return new;
end $$;
create trigger qurban_capacity_config_guard before update on private.campaigns for each row execute function private.qurban_capacity_config_guard();

create function private.qurban_allocated_cancellation_guard() returns trigger language plpgsql set search_path='' as $$
begin
 if new.status='cancelled' and exists(select 1 from private.qurban_allocations where registration_id=old.id)
 then raise exception 'Allocated registration requires reviewed operational workflow' using errcode='PT409';end if;
 return new;
end $$;
create trigger qurban_allocated_cancellation_guard before update on private.qurban_registrations for each row execute function private.qurban_allocated_cancellation_guard();

create function private.qurban_allocation_record_guard() returns trigger language plpgsql set search_path='' as $$
declare c private.campaigns; r private.qurban_registrations;k private.qurban_cattle;
begin
 if tg_op='DELETE' or (tg_op='UPDATE' and tg_table_name<>'qurban_allocations') then raise exception 'Immutable grid/history' using errcode='42501';end if;
 select * into c from private.campaigns where id=new.campaign_id for update;
 if not found or c.type_key<>'qurban' or c.config_version<>1 or not private.qurban_config_v1_valid(c.configuration)
 then raise exception 'Invalid allocation campaign' using errcode='23514';end if;
 if tg_table_name='qurban_cattle' then
  if new.display_number>(c.configuration->>'cattle_count')::integer or new.capacity<>(c.configuration->>'shares_per_cattle')::integer
  then raise exception 'Invalid cattle capacity' using errcode='23514';end if;
  new.created_at:=clock_timestamp();
 elsif tg_table_name='qurban_cattle_slots' then
  select * into k from private.qurban_cattle where id=new.cattle_id and campaign_id=new.campaign_id;
  if not found or new.slot_number>k.capacity then raise exception 'Invalid cattle slot' using errcode='23514';end if;
  new.created_at:=clock_timestamp();
 else
  select * into r from private.qurban_registrations where id=new.registration_id and campaign_id=new.campaign_id for update;
  if not found or r.status<>'submitted' then raise exception 'Registration unavailable' using errcode='PT409';end if;
  if tg_op='UPDATE' then
   if (to_jsonb(new)-array['slot_id','version','updated_at']) is distinct from (to_jsonb(old)-array['slot_id','version','updated_at'])
   then raise exception 'Immutable allocation identity' using errcode='42501';end if;
   new.version:=old.version+1;
  else new.version:=1;new.created_at:=clock_timestamp();
  end if;
  new.updated_at:=clock_timestamp();
 end if;
 return new;
end $$;
create trigger qurban_cattle_guard before insert or update or delete on private.qurban_cattle for each row execute function private.qurban_allocation_record_guard();
create trigger qurban_cattle_slot_guard before insert or update or delete on private.qurban_cattle_slots for each row execute function private.qurban_allocation_record_guard();
create trigger qurban_allocation_guard before insert or update or delete on private.qurban_allocations for each row execute function private.qurban_allocation_record_guard();

create function private.qurban_allocation_audit_guard() returns trigger language plpgsql set search_path='' as $$
begin
 if new.action in ('allocation.assigned','allocation.reassigned') and not exists(
 select 1 from private.qurban_allocations a join private.qurban_cattle_slots s on s.id=a.slot_id join private.qurban_cattle k on k.id=s.cattle_id
 where a.id=new.allocation_id and a.campaign_id=new.campaign_id and a.registration_id=new.registration_id and a.participation_id=new.participation_id
 and a.version=new.resulting_version and k.display_number=new.cattle_number and s.slot_number=new.slot_number)
 then raise exception 'Allocation audit ownership/version mismatch' using errcode='23514';end if;
 return new;
end $$;
create trigger qurban_allocation_audit_guard before insert on private.qurban_operational_audit for each row execute function private.qurban_allocation_audit_guard();

create function private.qurban_admin_grid(target uuid,page_number integer) returns jsonb language plpgsql set search_path='' as $$
declare c private.campaigns; result jsonb;
begin
 c:=private.qurban_allocation_campaign(target,false);
 if page_number is null or page_number not between 1 and 1000 then raise exception 'Invalid grid page' using errcode='22023';end if;
 with cattle as materialized(select * from private.qurban_cattle where campaign_id=target),
 slots as materialized(select s.* from private.qurban_cattle_slots s where campaign_id=target),
 assigned as materialized(select * from private.qurban_allocations where campaign_id=target),
 paged as(select * from cattle order by display_number limit 10 offset (page_number-1)*10)
 select jsonb_build_object('page',page_number,'page_size',10,'cattle_count',c.configuration->'cattle_count','shares_per_cattle',c.configuration->'shares_per_cattle',
 'initialized',exists(select 1 from cattle),'capacity',(select count(*) from slots),'allocated',(select count(*) from assigned),
 'empty',(select count(*) from slots)-(select count(*) from assigned),'can_manage',private.active_role()<>'staff',
 'recent_mfa',private.active_role()<>'super_admin' or private.recent_totp(),
 'cattle',coalesce((select jsonb_agg(jsonb_build_object('id',k.id,'number',k.display_number,'slots',coalesce(
 (select jsonb_agg(jsonb_build_object('id',s.id,'number',s.slot_number,'allocation',case when a.id is null then null else
 jsonb_build_object('id',a.id,'version',a.version,'participation_id',a.participation_id,'registration_id',a.registration_id,
 'participant_name',p.participant_name,'purpose',p.purpose,'reference',r.public_reference) end) order by s.slot_number)
 from slots s left join assigned a on a.slot_id=s.id left join private.qurban_participations p on p.id=a.participation_id
 left join private.qurban_registrations r on r.id=a.registration_id where s.cattle_id=k.id),'[]'::jsonb)) order by k.display_number) from paged k),'[]'::jsonb)) into result;
 return result;
end $$;

create function private.qurban_admin_initialize_grid(target uuid) returns jsonb language plpgsql set search_path='' as $$
declare c private.campaigns;
begin
 c:=private.qurban_allocation_campaign(target,true);
 if exists(select 1 from private.qurban_cattle where campaign_id=target) then return jsonb_build_object('unchanged',true);end if;
 insert into private.qurban_cattle(campaign_id,display_number,capacity)
 select target,n,(c.configuration->>'shares_per_cattle')::integer from generate_series(1,(c.configuration->>'cattle_count')::integer)n;
 insert into private.qurban_cattle_slots(campaign_id,cattle_id,slot_number)
 select target,k.id,n from private.qurban_cattle k cross join lateral generate_series(1,k.capacity)n where k.campaign_id=target;
 insert into private.qurban_operational_audit(campaign_id,actor_id,action,grid_cattle_count,grid_shares_per_cattle)
 values(target,auth.uid(),'allocation.grid_initialized',(c.configuration->>'cattle_count')::integer,(c.configuration->>'shares_per_cattle')::integer);
 return jsonb_build_object('unchanged',false);
end $$;

-- TRUSTED FUTURE FASA 9 PRIMITIVE ONLY. Caller must verify payment and commit it with this admission.
-- No runtime role/public/admin wrapper can call this in 8.4. Local owner tests supply synthetic eligibility.
create function private.qurban_allocate_registration(target uuid,registration uuid,participations uuid[]) returns jsonb
language plpgsql set search_path='' as $$
declare c private.campaigns;r private.qurban_registrations; pids uuid[]; free_slots uuid[]; chosen uuid;n integer;i integer;saved_allocation private.qurban_allocations; cattle_no integer;slot_no integer;
begin
 c:=private.qurban_allocation_campaign(target,true);
 n:=cardinality(participations);
 if n is null or n not between 1 and 100 or array_ndims(participations)<>1 or array_position(participations,null) is not null
 or (select count(distinct v) from unnest(participations)v)<>n then raise exception 'Invalid admission set' using errcode='22023';end if;
 select * into r from private.qurban_registrations where id=registration and campaign_id=target for update;
 if not found or r.status<>'submitted' then raise exception 'Admission unavailable' using errcode='PT409';end if;
 select array_agg(p.id order by p.created_at,p.id) into pids from private.qurban_participations p where p.registration_id=r.id and p.id=any(participations);
 if cardinality(pids) is distinct from n then raise exception 'Admission ownership mismatch' using errcode='42501';end if;
 if exists(select 1 from private.qurban_allocations where participation_id=any(pids)) then raise exception 'Already allocated' using errcode='PT409';end if;
 if r.same_cattle_preference then
  select k.id into chosen from private.qurban_cattle k join private.qurban_cattle_slots s on s.cattle_id=k.id
  left join private.qurban_allocations a on a.slot_id=s.id where k.campaign_id=target and a.id is null
  group by k.id,k.display_number having count(*)>=n order by k.display_number limit 1;
 end if;
 select array_agg(id order by cattle_number,slot_number) into free_slots from (
 select s.id,k.display_number cattle_number,s.slot_number from private.qurban_cattle_slots s join private.qurban_cattle k on k.id=s.cattle_id
 left join private.qurban_allocations a on a.slot_id=s.id where s.campaign_id=target and a.id is null and (chosen is null or k.id=chosen)
 order by k.display_number,s.slot_number limit n)t;
 if cardinality(free_slots) is distinct from n then raise exception 'Insufficient capacity' using errcode='PT409';end if;
 for i in 1..n loop
  insert into private.qurban_allocations(campaign_id,registration_id,participation_id,slot_id) values(target,r.id,pids[i],free_slots[i]) returning * into saved_allocation;
  select k.display_number,s.slot_number into cattle_no,slot_no from private.qurban_cattle_slots s join private.qurban_cattle k on k.id=s.cattle_id where s.id=saved_allocation.slot_id;
  insert into private.qurban_operational_audit(campaign_id,registration_id,participation_id,actor_id,action,allocation_id,cattle_number,slot_number,expected_version,resulting_version)
  values(target,r.id,saved_allocation.participation_id,auth.uid(),'allocation.assigned',saved_allocation.id,cattle_no,slot_no,0,1);
 end loop;
 return jsonb_build_object('allocated',n);
end $$;

create function private.qurban_admin_reassign(target uuid,allocation uuid,expected integer,target_cattle uuid,target_slot uuid) returns jsonb
language plpgsql set search_path='' as $$
declare c private.campaigns;a private.qurban_allocations;r private.qurban_registrations; s private.qurban_cattle_slots; old_cattle integer;old_slot integer;new_cattle integer;
begin
 c:=private.qurban_allocation_campaign(target,true);
 if expected is null or expected<1 then raise exception 'Invalid version' using errcode='22023';end if;
 select * into a from private.qurban_allocations where id=allocation and campaign_id=target;
 if not found then raise exception 'Access denied' using errcode='42501';end if;
 select * into r from private.qurban_registrations where id=a.registration_id for update;
 if r.status<>'submitted' then raise exception 'Registration unavailable' using errcode='PT409';end if;
 select * into a from private.qurban_allocations where id=allocation for update;
 if a.version<>expected then raise exception 'Refresh allocation' using errcode='PT409';end if;
 select * into s from private.qurban_cattle_slots where id=target_slot and cattle_id=target_cattle and campaign_id=target;
 if not found then raise exception 'Access denied' using errcode='42501';end if;
 if s.id=a.slot_id then return jsonb_build_object('id',a.id,'version',a.version,'unchanged',true);end if;
 if exists(select 1 from private.qurban_allocations where slot_id=s.id) then raise exception 'Target occupied' using errcode='PT409';end if;
 select k.display_number,t.slot_number into old_cattle,old_slot from private.qurban_cattle_slots t join private.qurban_cattle k on k.id=t.cattle_id where t.id=a.slot_id;
 select display_number into new_cattle from private.qurban_cattle where id=s.cattle_id;
 update private.qurban_allocations set slot_id=s.id where id=a.id returning * into a;
 insert into private.qurban_operational_audit(campaign_id,registration_id,participation_id,actor_id,action,allocation_id,cattle_number,slot_number,previous_cattle_number,previous_slot_number,expected_version,resulting_version)
 values(target,r.id,a.participation_id,auth.uid(),'allocation.reassigned',a.id,new_cattle,s.slot_number,old_cattle,old_slot,expected,a.version);
 return jsonb_build_object('id',a.id,'version',a.version,'unchanged',false);
end $$;

create function public.admin_qurban_grid(target_campaign uuid,page_number integer) returns jsonb language sql security definer set search_path='' as $$ select private.qurban_admin_grid(target_campaign,page_number); $$;
create function public.admin_qurban_initialize_grid(target_campaign uuid) returns jsonb language sql security definer set search_path='' as $$ select private.qurban_admin_initialize_grid(target_campaign); $$;
create function public.admin_qurban_reassign_allocation(target_campaign uuid,allocation_id uuid,expected_version integer,target_cattle uuid,target_slot uuid) returns jsonb language sql security definer set search_path='' as $$ select private.qurban_admin_reassign(target_campaign,allocation_id,expected_version,target_cattle,target_slot); $$;

create or replace function private.qurban_admin_activity(target uuid,page_number integer) returns jsonb language plpgsql set search_path='' as $$
declare c private.campaigns;
begin
 c:=private.qurban_admin_campaign(target,false);perform private.require_campaign_access('audit');
 if page_number is null or page_number not between 1 and 10000 then raise exception 'Invalid page' using errcode='22023';end if;
 return jsonb_build_object('page',page_number,'items',coalesce((select jsonb_agg(to_jsonb(t)) from (
 select id,registration_id,participation_id,actor_id,action,occurred_at,expected_version,resulting_version,changed_fields,reason,export_id,registration_count,participation_count,allocation_id,cattle_number,slot_number,previous_cattle_number,previous_slot_number,grid_cattle_count,grid_shares_per_cattle
 from private.qurban_operational_audit where campaign_id=target order by occurred_at desc,id desc limit 50 offset (page_number-1)*50)t),'[]'::jsonb));
end $$;
create or replace function private.qurban_admin_export_snapshot(target uuid) returns jsonb language plpgsql set search_path='' as $$
declare c private.campaigns; snapshot jsonb; ticket private.qurban_export_requests; rc integer;pc integer;
begin
 c:=private.qurban_admin_campaign(target,true);
 select count(*) into rc from private.qurban_registrations where campaign_id=target;
 select count(*) into pc from private.qurban_participations p join private.qurban_registrations r on r.id=p.registration_id where r.campaign_id=target;
 if rc>5000 or pc>20000 then raise exception 'Export bound exceeded' using errcode='22023';end if;
 -- One SQL statement / MVCC snapshot owns every sheet's input and count.
 with regs as materialized(select * from private.qurban_registrations where campaign_id=target),
 parts as materialized(select p.*,k.display_number cattle_number,s.slot_number from private.qurban_participations p join regs r on r.id=p.registration_id left join private.qurban_allocations a on a.participation_id=p.id left join private.qurban_cattle_slots s on s.id=a.slot_id left join private.qurban_cattle k on k.id=s.cattle_id)
 select jsonb_build_object('campaign',jsonb_build_object('id',c.id,'title',c.title,'campaign_year',c.configuration->'campaign_year','hijri_display_label',c.configuration->>'hijri_display_label',
 'currency',c.configuration->>'currency','price_per_share_minor',c.configuration->'price_per_cattle_share_minor','cattle_count',c.configuration->'cattle_count','shares_per_cattle',c.configuration->'shares_per_cattle'),
 'allocation_summary',jsonb_build_object('initialized',exists(select 1 from private.qurban_cattle where campaign_id=target),'capacity',(select count(*) from private.qurban_cattle_slots where campaign_id=target),'allocated',(select count(*) from private.qurban_allocations where campaign_id=target),'empty',(select count(*) from private.qurban_cattle_slots where campaign_id=target)-(select count(*) from private.qurban_allocations where campaign_id=target)),
 'summary',jsonb_build_object('registrations',(select count(*) from regs),'submitted',(select count(*) from regs where status='submitted'),'cancelled',(select count(*) from regs where status='cancelled'),
 'participants',(select count(*) from parts),'qurban',(select count(*) from parts where purpose='qurban'),'aqiqah',(select count(*) from parts where purpose='aqiqah')),
 'registrations',coalesce((select jsonb_agg(jsonb_build_object('id',id,'public_reference',public_reference,'applicant_name',applicant_name,'phone',phone,'address',address,'email',email,
 'attendance',attendance,'same_cattle_preference',same_cattle_preference,'status',status,'participant_count',quoted_participation_count,'created_at',created_at,'updated_at',updated_at) order by created_at,id) from regs),'[]'::jsonb),
 'participants',coalesce((select jsonb_agg(jsonb_build_object('id',id,'registration_id',registration_id,'participant_name',participant_name,'purpose',purpose,'created_at',created_at,'cattle_number',cattle_number,'slot_number',slot_number) order by created_at,id) from parts),'[]'::jsonb)) into snapshot;
 rc:=(snapshot->'summary'->>'registrations')::integer;pc:=(snapshot->'summary'->>'participants')::integer;
 if rc>5000 or pc>20000 or octet_length(snapshot::text)>16777216 then raise exception 'Export bound exceeded' using errcode='22023';end if;
 insert into private.qurban_export_requests(campaign_id,actor_id,captured_at,expires_at,snapshot_hash,registration_count,participation_count)
 values(target,auth.uid(),clock_timestamp(),clock_timestamp()+interval '15 minutes',encode(sha256(convert_to(snapshot::text,'UTF8')),'hex'),rc,pc) returning * into ticket;
 return snapshot||jsonb_build_object('export_id',ticket.id,'snapshot_hash',ticket.snapshot_hash,'generated_at',ticket.captured_at,'generated_by',ticket.actor_id);
end $$;
alter table private.qurban_cattle enable row level security;
alter table private.qurban_cattle_slots enable row level security;
alter table private.qurban_allocations enable row level security;
revoke all on private.qurban_cattle,private.qurban_cattle_slots,private.qurban_allocations from public,anon,authenticated,service_role,supabase_auth_admin,authenticator,campaign_scheduler;
revoke all on function private.qurban_allocation_campaign(uuid,boolean),private.qurban_capacity_config_guard(),private.qurban_allocated_cancellation_guard(),private.qurban_allocation_record_guard(),private.qurban_allocation_audit_guard(),private.qurban_admin_grid(uuid,integer),private.qurban_admin_initialize_grid(uuid),private.qurban_allocate_registration(uuid,uuid,uuid[]),private.qurban_admin_reassign(uuid,uuid,integer,uuid,uuid),public.admin_qurban_grid(uuid,integer),public.admin_qurban_initialize_grid(uuid),public.admin_qurban_reassign_allocation(uuid,uuid,integer,uuid,uuid) from public,anon,authenticated,service_role,supabase_auth_admin,authenticator,campaign_scheduler;
grant execute on function public.admin_qurban_grid(uuid,integer),public.admin_qurban_initialize_grid(uuid),public.admin_qurban_reassign_allocation(uuid,uuid,integer,uuid,uuid) to authenticated;
commit;
