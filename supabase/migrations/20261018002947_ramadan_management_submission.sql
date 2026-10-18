begin;
-- 10.1: management and unreserved submission only. No financial/assignment objects.
alter table private.ramadan_sponsorship_items add column accepted_offering_name text;
-- 10.0 exposed no business mutation and reset is empty. Refuse ambiguous legacy
-- private fixture activity instead of bypassing its immutable evidence guard.
do $$begin if exists(select 1 from private.ramadan_sponsorship_items)then raise exception 'Pre-existing foundation fixture items require reviewed cleanup before upgrade';end if;end $$;
alter table private.ramadan_sponsorship_items alter column accepted_offering_name set not null;
alter table private.ramadan_sponsorship_items add constraint ramadan_accepted_label_valid check(private.ramadan_text_valid(accepted_offering_name,1,100));
create function private.ramadan_item_label_guard()returns trigger language plpgsql set search_path='' as $$
begin
 if tg_op<>'INSERT' then raise exception 'Immutable accepted label'using errcode='42501';end if;
 select name into new.accepted_offering_name from private.ramadan_offerings where id=new.offering_id and campaign_id=new.campaign_id;
 return new;
end $$;
create trigger ramadan_item_label_guard before insert or update on private.ramadan_sponsorship_items for each row execute function private.ramadan_item_label_guard();

create table private.ramadan_operational_audit(
 id uuid primary key default gen_random_uuid(),campaign_id uuid not null references private.campaigns(id)on delete restrict,
 offering_id uuid references private.ramadan_offerings(id)on delete restrict,schedule_id uuid references private.ramadan_schedule_entries(id)on delete restrict,
 sponsorship_id uuid references private.ramadan_sponsorships(id)on delete restrict,actor_id uuid references public.admin_profiles(user_id)on delete restrict,
 action text not null check(action in('offering.created','offering.updated','schedule.created','schedule.updated','sponsorship.submitted')),
 expected_version integer,resulting_version integer,changed_fields text[] not null default '{}',item_count integer,
 occurred_at timestamptz not null default clock_timestamp(),
 check(expected_version is null or expected_version>0),check(resulting_version is null or resulting_version>0),
 check(changed_fields<@array['name','mode','display_order','active','service_date','ramadan_day_number','unit_price_minor','slot_count']),
 check(cardinality(changed_fields)<=8),check(item_count is null or item_count between 1 and 40)
);
create index ramadan_sponsorship_reference_search on private.ramadan_sponsorships(campaign_id,lower(public_reference));
create index ramadan_audit_campaign_time on private.ramadan_operational_audit(campaign_id,occurred_at desc,id);
create table private.ramadan_submission_idempotency(
 key_hash text primary key check(key_hash~'^[0-9a-f]{64}$'),payload_hash text not null check(payload_hash~'^[0-9a-f]{64}$'),
 sponsorship_id uuid not null unique references private.ramadan_sponsorships(id)on delete restrict,
 created_at timestamptz not null default clock_timestamp()
);
create function private.ramadan_evidence_guard()returns trigger language plpgsql set search_path='' as $$
declare camp uuid;
begin
 -- Accepted payer/display identity is historical evidence.
 if tg_table_name='ramadan_sponsorships'and tg_op='UPDATE'then
  if (new.payer_name,new.public_display_mode,new.public_display_name)is distinct from(old.payer_name,old.public_display_mode,old.public_display_name)then raise exception 'Immutable accepted sponsor identity'using errcode='42501';end if;
  return new;
 end if;
 if tg_op<>'INSERT'then raise exception 'Immutable Ramadan evidence'using errcode='42501';end if;
 if tg_table_name='ramadan_operational_audit'then
  new.occurred_at:=clock_timestamp();
  if new.action='sponsorship.submitted'then
   if new.actor_id is not null or new.sponsorship_id is null or new.item_count is null or new.offering_id is not null or new.schedule_id is not null or cardinality(new.changed_fields)<>0 then raise exception 'Invalid audit'using errcode='23514';end if;
  else
   new.actor_id:=private.require_campaign_access('manage');
   if new.sponsorship_id is not null or new.item_count is not null then raise exception 'Invalid audit'using errcode='23514';end if;
  end if;
  if new.offering_id is not null and not exists(select 1 from private.ramadan_offerings where id=new.offering_id and campaign_id=new.campaign_id)or new.schedule_id is not null and not exists(select 1 from private.ramadan_schedule_entries where id=new.schedule_id and campaign_id=new.campaign_id)or new.sponsorship_id is not null and not exists(select 1 from private.ramadan_sponsorships where id=new.sponsorship_id and campaign_id=new.campaign_id)then raise exception 'Invalid audit ownership'using errcode='23514';end if;
 else new.created_at:=clock_timestamp();end if;return new;
end $$;
create trigger ramadan_accepted_identity_guard before update on private.ramadan_sponsorships for each row execute function private.ramadan_evidence_guard();
create trigger ramadan_audit_guard before insert or update or delete on private.ramadan_operational_audit for each row execute function private.ramadan_evidence_guard();
create trigger ramadan_idempotency_guard before insert or update or delete on private.ramadan_submission_idempotency for each row execute function private.ramadan_evidence_guard();

create function private.ramadan_exact_object(v jsonb,keys text[])returns boolean language sql immutable set search_path='' as $$
 select case when jsonb_typeof(v)='object' then v?&keys and(select count(*)from jsonb_object_keys(v))=cardinality(keys)else false end;
$$;
create function private.ramadan_admin_campaign(target uuid,writing boolean)returns private.campaigns language plpgsql set search_path='' as $$
declare c private.campaigns;begin
 if writing then perform private.require_campaign_access('manage');else perform 1 from public.admin_profiles where user_id=auth.uid()for share;perform private.require_campaign_access('read');end if;
 perform pg_advisory_xact_lock(hashtextextended('ramadan:'||target::text,0));
 c:=private.ramadan_campaign_valid(target);return c;
end $$;
create function private.ramadan_admin_offering(target uuid,p jsonb)returns jsonb language plpgsql set search_path='' as $$
declare c private.campaigns;o private.ramadan_offerings;prior private.ramadan_offerings;fields text[];begin
 if not private.ramadan_exact_object(p,array['id','expected_version','name','mode','display_order','active'])or octet_length(p::text)>1024
 or jsonb_typeof(p->'name')is distinct from'string'or not private.ramadan_text_valid(p->>'name',1,100)
 or p->>'mode'not in('FIXED_SLOT','OPEN_AMOUNT')or jsonb_typeof(p->'mode')is distinct from'string'
 or jsonb_typeof(p->'display_order')is distinct from'number'or p->>'display_order'!~'^[0-9]{1,4}$'or jsonb_typeof(p->'active')is distinct from'boolean'
 then raise exception 'Invalid offering'using errcode='22023';end if;
 c:=private.ramadan_admin_campaign(target,true);
 if p->'id'='null'::jsonb then
  if p->'expected_version'<>'null'::jsonb or(select count(*)from private.ramadan_offerings where campaign_id=target)>=100 then raise exception 'Invalid offering'using errcode='22023';end if;
  insert into private.ramadan_offerings(campaign_id,name,mode,display_order,active)values(target,p->>'name',p->>'mode',(p->>'display_order')::integer,(p->>'active')::boolean)returning *into o;fields:=array['name','mode','display_order','active'];
 else
  if jsonb_typeof(p->'id')is distinct from'string'or jsonb_typeof(p->'expected_version')is distinct from'number'or p->>'expected_version'!~'^[1-9][0-9]{0,8}$'then raise exception 'Invalid offering'using errcode='22023';end if;
  select *into prior from private.ramadan_offerings where id=(p->>'id')::uuid and campaign_id=target for update;
  if prior.id is null or prior.version<>(p->>'expected_version')::integer then raise exception 'Refresh required'using errcode='PT409';end if;
  fields:=array(select k from unnest(array['name','mode','display_order','active'])k where to_jsonb(prior)->k is distinct from p->k);
  update private.ramadan_offerings set name=p->>'name',mode=p->>'mode',display_order=(p->>'display_order')::integer,active=(p->>'active')::boolean where id=prior.id returning *into o;
 end if;
 insert into private.ramadan_operational_audit(campaign_id,offering_id,action,expected_version,resulting_version,changed_fields)values(target,o.id,case when prior.id is null then'offering.created'else'offering.updated'end,prior.version,o.version,fields);
 return jsonb_build_object('id',o.id,'version',o.version);
exception when check_violation or unique_violation then raise exception 'Offering conflict'using errcode='PT409';when invalid_text_representation or numeric_value_out_of_range then raise exception 'Invalid offering'using errcode='22023';end $$;
create function private.ramadan_admin_schedule(target uuid,p jsonb)returns jsonb language plpgsql set search_path='' as $$
declare c private.campaigns;s private.ramadan_schedule_entries;prior private.ramadan_schedule_entries;fields text[];begin
 if not private.ramadan_exact_object(p,array['id','expected_version','offering_id','ramadan_day_number','service_date','unit_price_minor','slot_count','active'])or octet_length(p::text)>1024
 or jsonb_typeof(p->'offering_id')is distinct from'string'or jsonb_typeof(p->'service_date')is distinct from'string'or p->>'service_date'!~'^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
 or jsonb_typeof(p->'ramadan_day_number')is distinct from'number'or p->>'ramadan_day_number'!~'^[1-9][0-9]?$'or(p->>'ramadan_day_number')::integer>30
 or jsonb_typeof(p->'unit_price_minor')is distinct from'string'or p->>'unit_price_minor'!~'^[1-9][0-9]{0,9}$'or(p->>'unit_price_minor')::numeric>1000000000
 or jsonb_typeof(p->'slot_count')is distinct from'number'or p->>'slot_count'!~'^[1-9][0-9]{0,3}$'or(p->>'slot_count')::integer>1000 or jsonb_typeof(p->'active')is distinct from'boolean'
 then raise exception 'Invalid schedule'using errcode='22023';end if;
 c:=private.ramadan_admin_campaign(target,true);
 if p->'id'='null'::jsonb then
  if p->'expected_version'<>'null'::jsonb or(select count(*)from private.ramadan_schedule_entries where campaign_id=target)>=500 then raise exception 'Invalid schedule'using errcode='22023';end if;
  insert into private.ramadan_schedule_entries(campaign_id,offering_id,ramadan_day_number,service_date,unit_price_minor,slot_count,active)values(target,(p->>'offering_id')::uuid,(p->>'ramadan_day_number')::integer,(p->>'service_date')::date,(p->>'unit_price_minor')::numeric,(p->>'slot_count')::integer,(p->>'active')::boolean)returning *into s;
  fields:=array['service_date','ramadan_day_number','unit_price_minor','slot_count','active'];
 else
  if jsonb_typeof(p->'id')is distinct from'string'or jsonb_typeof(p->'expected_version')is distinct from'number'or p->>'expected_version'!~'^[1-9][0-9]{0,8}$'then raise exception 'Invalid schedule'using errcode='22023';end if;
  select *into prior from private.ramadan_schedule_entries where id=(p->>'id')::uuid and campaign_id=target for update;
  if prior.id is null or prior.version<>(p->>'expected_version')::integer or prior.offering_id<>(p->>'offering_id')::uuid then raise exception 'Refresh required'using errcode='PT409';end if;
  fields:=array(select k from unnest(array['service_date','ramadan_day_number','unit_price_minor','slot_count','active'])k where to_jsonb(prior)->>k is distinct from p->>k);
  update private.ramadan_schedule_entries set ramadan_day_number=(p->>'ramadan_day_number')::integer,service_date=(p->>'service_date')::date,unit_price_minor=(p->>'unit_price_minor')::numeric,slot_count=(p->>'slot_count')::integer,active=(p->>'active')::boolean where id=prior.id returning *into s;
 end if;
 insert into private.ramadan_operational_audit(campaign_id,schedule_id,action,expected_version,resulting_version,changed_fields)values(target,s.id,case when prior.id is null then'schedule.created'else'schedule.updated'end,prior.version,s.version,fields);
 return jsonb_build_object('id',s.id,'version',s.version);
exception when check_violation or unique_violation then raise exception 'Schedule locked or conflicting'using errcode='PT409';when invalid_text_representation or numeric_value_out_of_range or datetime_field_overflow then raise exception 'Invalid schedule'using errcode='22023';end $$;

-- Public snapshot uses one statement after authoritative gating; pending rows never
-- participate in occupied counts. 10.2 must replace only the verified projection.
create function private.ramadan_public_context(slug text)returns jsonb language plpgsql set search_path='' as $$
declare c private.campaigns;g private.system_feature_flags;m private.system_feature_flags;v jsonb;begin
 if slug is null or length(slug)>100 or slug!~'^[a-z0-9]+(-[a-z0-9]+)*$'then return null;end if;
 select *into c from private.campaigns where campaigns.slug=ramadan_public_context.slug;
 select *into g from private.system_feature_flags where flag_key='campaigns.enabled';select *into m from private.system_feature_flags where flag_key='ramadan.enabled';
 if c.id is null or c.type_key<>'ramadan'or c.config_version<>1 or c.visibility not in('public','unlisted')or not private.ramadan_config_v1_valid(c.configuration)
 or not coalesce(g.enabled,false)or not coalesce(m.enabled,false)or not private.campaign_registration_window_available(c.status,c.registration_opens_at,c.registration_closes_at,clock_timestamp())
 or not exists(select 1 from private.campaign_type_descriptors where type_key='ramadan'and config_version=1 and module_flag_key='ramadan.enabled'and validator_name='ramadan_config_v1_valid')then return null;end if;
 select jsonb_build_object('slug',c.slug,'title',c.title,'campaign_year',c.configuration->'campaign_year','hijri_display_label',c.configuration->'hijri_display_label','currency','MYR','campaign_version',c.version,'global_flag_version',g.version,'module_flag_version',m.version,'registration_closes_at',c.registration_closes_at,
 'offerings',coalesce((select jsonb_agg(jsonb_build_object('id',o.id,'name',o.name,'mode',o.mode,'version',o.version)order by o.display_order,o.id)from private.ramadan_offerings o where o.campaign_id=c.id and o.active),'[]'::jsonb),
 'schedules',coalesce((select jsonb_agg(jsonb_build_object('id',s.id,'offering_id',s.offering_id,'version',s.version,'ramadan_day_number',s.ramadan_day_number,'service_date',s.service_date,'unit_price_minor',s.unit_price_minor,'slot_count',s.slot_count,'confirmed_occupied',0,'available',s.slot_count)order by s.service_date,o.display_order,s.id)from private.ramadan_schedule_entries s join private.ramadan_offerings o on o.id=s.offering_id where s.campaign_id=c.id and s.active and o.active),'[]'::jsonb))into v;
 if jsonb_array_length(v->'offerings')>100 or jsonb_array_length(v->'schedules')>500 or octet_length(v::text)>262144 then return null;end if;
 return v||jsonb_build_object('context_token',encode(sha256(convert_to(v::text,'UTF8')),'hex'));
end $$;
create function private.ramadan_submission_valid(p jsonb)returns boolean language plpgsql immutable set search_path='' as $$
declare e jsonb;a jsonb;begin
 if octet_length(p::text)>16384 or not private.ramadan_exact_object(p,array['slug','context_token','idempotency_key','payer','public_display_mode','items'])then return false;end if;
 if jsonb_typeof(p->'slug')<>'string'or p->>'slug'!~'^[a-z0-9]+(-[a-z0-9]+)*$'or length(p->>'slug')>100 or jsonb_typeof(p->'context_token')<>'string'or p->>'context_token'!~'^[0-9a-f]{64}$'or jsonb_typeof(p->'idempotency_key')<>'string'or p->>'idempotency_key'!~'^[0-9a-f]{64}$'then return false;end if;
 a:=p->'payer';if not private.ramadan_exact_object(a,array['name','phone','email'])or jsonb_typeof(a->'name')<>'string'or not private.ramadan_text_valid(a->>'name',1,160)or jsonb_typeof(a->'phone')<>'string'or not private.ramadan_text_valid(a->>'phone',8,30)or a->>'phone'!~'^[+]?[0-9 ()-]+$'or length(regexp_replace(a->>'phone','[^0-9]','','g'))not between 8 and 15 then return false;end if;
 if a->'email'<>'null'::jsonb and(jsonb_typeof(a->'email')<>'string'or not private.ramadan_text_valid(a->>'email',3,254)or a->>'email'!~'^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$')then return false;end if;
 if jsonb_typeof(p->'public_display_mode')<>'string'or p->>'public_display_mode'not in('named','anonymous')then return false;end if;
 if jsonb_typeof(p->'items')<>'array'or jsonb_array_length(p->'items')not between 1 and 40 then return false;end if;
 for e in select value from jsonb_array_elements(p->'items')loop
  if not(private.ramadan_exact_object(e,array['offering_id','offering_version','schedule_id','schedule_version','quantity'])or private.ramadan_exact_object(e,array['offering_id','offering_version','amount_minor']))then return false;end if;
  if jsonb_typeof(e->'offering_id')<>'string'or e->>'offering_id'!~'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'or jsonb_typeof(e->'offering_version')<>'number'or e->>'offering_version'!~'^[1-9][0-9]{0,8}$'then return false;end if;
  if e?'schedule_id'then
   if jsonb_typeof(e->'schedule_id')<>'string'or e->>'schedule_id'!~'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'or jsonb_typeof(e->'schedule_version')<>'number'or e->>'schedule_version'!~'^[1-9][0-9]{0,8}$'or jsonb_typeof(e->'quantity')<>'number'or e->>'quantity'!~'^[1-9][0-9]{0,3}$'or(e->>'quantity')::integer>1000 then return false;end if;
  elsif jsonb_typeof(e->'amount_minor')<>'string'or e->>'amount_minor'!~'^[1-9][0-9]{0,12}$'or(e->>'amount_minor')::numeric>1000000000000 then return false;end if;
 end loop;return true;
exception when others then return false;end $$;
create function private.ramadan_submission_result(rid uuid)returns jsonb language sql set search_path='' as $$
 select jsonb_build_object('reference',r.public_reference,'currency',r.currency,'total_minor',r.quoted_total_minor,'items',(select jsonb_agg(jsonb_build_object('offering_name',i.accepted_offering_name,'mode',i.mode,'service_date',s.service_date,'ramadan_day_number',s.ramadan_day_number,'quantity',i.quantity,'unit_price_minor',i.accepted_unit_price_minor,'line_total_minor',i.line_total_minor)order by i.created_at,i.id)from private.ramadan_sponsorship_items i left join private.ramadan_schedule_entries s on s.id=i.schedule_entry_id where i.sponsorship_id=r.id))from private.ramadan_sponsorships r where r.id=rid;
$$;
create function private.ramadan_submit(p jsonb)returns jsonb language plpgsql set search_path='' as $$
declare c private.campaigns;ctx jsonb;kh text;ph text;prior private.ramadan_submission_idempotency;o private.ramadan_offerings;s private.ramadan_schedule_entries;r private.ramadan_sponsorships;e jsonb;total numeric:=0;begin
 if not private.ramadan_submission_valid(p)then raise exception 'Invalid sponsorship'using errcode='22023';end if;
 kh:=encode(sha256(convert_to(p->>'idempotency_key','UTF8')),'hex');ph:=encode(sha256(convert_to(p::text,'UTF8')),'hex');
 perform pg_advisory_xact_lock(hashtextextended('ramadan-submission:'||kh,0));
 select *into prior from private.ramadan_submission_idempotency where key_hash=kh;
 if prior.key_hash is not null then if prior.payload_hash<>ph then raise exception 'Review again'using errcode='PT409';end if;return private.ramadan_submission_result(prior.sponsorship_id);end if;
 perform pg_advisory_xact_lock_shared(hashtextextended('campaign-system-flag:campaigns.enabled',0));perform pg_advisory_xact_lock_shared(hashtextextended('campaign-system-flag:ramadan.enabled',0));
 perform 1 from private.system_feature_flags where flag_key in('campaigns.enabled','ramadan.enabled')order by flag_key for share;
 select *into c from private.campaigns where slug=p->>'slug';if c.id is null then raise exception 'Review again'using errcode='PT409';end if;
 perform pg_advisory_xact_lock(hashtextextended('ramadan:'||c.id::text,0));
 select *into c from private.campaigns where id=c.id for share;
 ctx:=private.ramadan_public_context(p->>'slug');if ctx is null or ctx->>'context_token'<>p->>'context_token'then raise exception 'Review again'using errcode='PT409';end if;
 if exists(select 1 from jsonb_array_elements(p->'items')x where x?'schedule_id'group by x->>'schedule_id'having count(*)>1)then raise exception 'Duplicate schedule'using errcode='22023';end if;
 for e in select value from jsonb_array_elements(p->'items')loop
  select *into o from private.ramadan_offerings where id=(e->>'offering_id')::uuid and campaign_id=c.id for share;
  if o.id is null or not o.active or o.version<>(e->>'offering_version')::integer then raise exception 'Review again'using errcode='PT409';end if;
  if o.mode='FIXED_SLOT'then
   if not e?'schedule_id'then raise exception 'Invalid item'using errcode='22023';end if;
   select *into s from private.ramadan_schedule_entries where id=(e->>'schedule_id')::uuid and offering_id=o.id and campaign_id=c.id for share;
   if s.id is null or not s.active or s.version<>(e->>'schedule_version')::integer then raise exception 'Review again'using errcode='PT409';end if;
   if(e->>'quantity')::integer>s.slot_count then raise exception 'Invalid quantity'using errcode='22023';end if;total:=total+s.unit_price_minor*(e->>'quantity')::integer;
  else if e?'schedule_id'then raise exception 'Invalid item'using errcode='22023';end if;total:=total+(e->>'amount_minor')::numeric;end if;
 end loop;
 if total>1000000000000 then raise exception 'Invalid total'using errcode='22023';end if;
 insert into private.ramadan_sponsorships(campaign_id,payer_name,phone,email,public_display_mode,public_display_name,quoted_total_minor)values(c.id,p->'payer'->>'name',p->'payer'->>'phone',p->'payer'->>'email',p->>'public_display_mode',case when p->>'public_display_mode'='named'then p->'payer'->>'name'else null end,total)returning *into r;
 for e in select value from jsonb_array_elements(p->'items')loop
  select *into o from private.ramadan_offerings where id=(e->>'offering_id')::uuid;
  insert into private.ramadan_sponsorship_items(campaign_id,sponsorship_id,offering_id,mode,schedule_entry_id,quantity,contribution_amount_minor)values(c.id,r.id,o.id,o.mode,(e->>'schedule_id')::uuid,(e->>'quantity')::integer,(e->>'amount_minor')::numeric);
 end loop;
 insert into private.ramadan_submission_idempotency(key_hash,payload_hash,sponsorship_id)values(kh,ph,r.id);
 insert into private.ramadan_operational_audit(campaign_id,sponsorship_id,action,item_count)values(c.id,r.id,'sponsorship.submitted',jsonb_array_length(p->'items'));
 if not private.campaign_registration_window_available(c.status,c.registration_opens_at,c.registration_closes_at,clock_timestamp())then raise exception 'Review again'using errcode='PT409';end if;
 return private.ramadan_submission_result(r.id);
exception when sqlstate 'PT409' or sqlstate '22023' then raise;when check_violation or invalid_text_representation or numeric_value_out_of_range then raise exception 'Invalid sponsorship'using errcode='22023';when others then raise exception 'Sponsorship unavailable'using errcode='PT503';end $$;
create function private.ramadan_admin_workspace(target uuid)returns jsonb language plpgsql set search_path='' as $$
declare c private.campaigns;begin c:=private.ramadan_admin_campaign(target,false);if(select count(*)from private.ramadan_offerings where campaign_id=target)>100 or(select count(*)from private.ramadan_schedule_entries where campaign_id=target)>500 then raise exception 'Workspace bound exceeded'using errcode='22023';end if;
 return jsonb_build_object('id',c.id,'title',c.title,'can_manage',private.active_role()in('admin','super_admin'),'offerings',coalesce((select jsonb_agg(to_jsonb(o)||jsonb_build_object('has_activity',exists(select 1 from private.ramadan_sponsorship_items i where i.offering_id=o.id),'has_references',exists(select 1 from private.ramadan_schedule_entries s where s.offering_id=o.id)or exists(select 1 from private.ramadan_sponsorship_items i where i.offering_id=o.id))order by o.display_order,o.id)from private.ramadan_offerings o where campaign_id=target),'[]'::jsonb),'schedules',coalesce((select jsonb_agg(to_jsonb(s)||jsonb_build_object('has_activity',exists(select 1 from private.ramadan_sponsorship_items i where i.schedule_entry_id=s.id),'confirmed_occupied',0,'available',s.slot_count)order by s.service_date,s.id)from private.ramadan_schedule_entries s where campaign_id=target),'[]'::jsonb));
end $$;
create function private.ramadan_admin_slots(target uuid,schedule uuid)returns jsonb language plpgsql set search_path='' as $$
begin perform private.ramadan_admin_campaign(target,false);return coalesce((select jsonb_agg(slot_number order by slot_number)from private.ramadan_slots where campaign_id=target and schedule_entry_id=schedule),'[]'::jsonb);end $$;
create function private.ramadan_admin_sponsorships(target uuid,p jsonb)returns jsonb language plpgsql set search_path='' as $$
declare c private.campaigns;manager boolean;page integer;term text;total integer;data jsonb;begin
 if not private.ramadan_exact_object(p,array['page','search','status'])or jsonb_typeof(p->'page')is distinct from'number'or p->>'page'!~'^[1-9][0-9]{0,4}$'or jsonb_typeof(p->'search')is distinct from'string'or length(p->>'search')>160 or p->>'status'not in('all','submitted','cancelled')or jsonb_typeof(p->'status')is distinct from'string'then raise exception 'Invalid list'using errcode='22023';end if;
 c:=private.ramadan_admin_campaign(target,false);manager:=private.active_role()in('admin','super_admin');page:=(p->>'page')::integer;term:=lower(btrim(p->>'search'));
 select count(*)into total from private.ramadan_sponsorships r where campaign_id=target and(p->>'status'='all'or r.status=p->>'status')and(term=''or lower(r.public_reference)=term or manager and(position(term in lower(r.payer_name))>0 or position(term in r.phone)>0));
 select coalesce(jsonb_agg(v order by created_at desc,id),'[]'::jsonb)into data from(select r.id,r.created_at,jsonb_build_object('id',r.id,'reference',r.public_reference,'status',r.status,'created_at',r.created_at,'version',r.version,'item_count',(select count(*)from private.ramadan_sponsorship_items i where i.sponsorship_id=r.id))||case when manager then jsonb_build_object('payer_name',r.payer_name,'phone',r.phone,'quoted_total_minor',r.quoted_total_minor)else '{}'::jsonb end v from private.ramadan_sponsorships r where campaign_id=target and(p->>'status'='all'or r.status=p->>'status')and(term=''or lower(r.public_reference)=term or manager and(position(term in lower(r.payer_name))>0 or position(term in r.phone)>0))order by r.created_at desc,r.id limit 20 offset(page-1)*20)x;
 return jsonb_build_object('rows',data,'total',total,'page',page,'page_size',20,'can_manage',manager);
end $$;
create function private.ramadan_admin_detail(target uuid,sponsor uuid)returns jsonb language plpgsql set search_path='' as $$
declare r private.ramadan_sponsorships;manager boolean;v jsonb;begin
 perform private.ramadan_admin_campaign(target,false);manager:=private.active_role()in('admin','super_admin');select *into r from private.ramadan_sponsorships where id=sponsor and campaign_id=target;if r.id is null then return null;end if;
 v:=jsonb_build_object('id',r.id,'reference',r.public_reference,'status',r.status,'created_at',r.created_at,'version',r.version,'campaign_year',r.campaign_year,'hijri_display_label',r.hijri_display_label,'items',(select jsonb_agg(jsonb_build_object('offering_name',i.accepted_offering_name,'mode',i.mode,'service_date',s.service_date,'ramadan_day_number',s.ramadan_day_number,'quantity',i.quantity)||case when manager then jsonb_build_object('unit_price_minor',i.accepted_unit_price_minor,'line_total_minor',i.line_total_minor)else'{}'::jsonb end order by i.created_at,i.id)from private.ramadan_sponsorship_items i left join private.ramadan_schedule_entries s on s.id=i.schedule_entry_id where i.sponsorship_id=r.id));
 if manager then v:=v||jsonb_build_object('payer_name',r.payer_name,'phone',r.phone,'email',r.email,'public_display_mode',r.public_display_mode,'public_display_name',r.public_display_name,'quoted_total_minor',r.quoted_total_minor,'campaign_revision',r.campaign_revision,'currency',r.currency);end if;return v;
end $$;
create function private.ramadan_admin_activity(target uuid,page_number integer)returns jsonb language plpgsql set search_path='' as $$
begin perform private.ramadan_admin_campaign(target,false);perform private.require_campaign_access('audit');if page_number not between 1 and 100000 then raise exception 'Invalid page'using errcode='22023';end if;return coalesce((select jsonb_agg(to_jsonb(a)order by occurred_at desc,id)from(select *from private.ramadan_operational_audit where campaign_id=target order by occurred_at desc,id limit 20 offset(page_number-1)*20)a),'[]'::jsonb);end $$;
create function public.public_ramadan_context(target_slug text)returns jsonb language sql security definer set search_path=''as $$select private.ramadan_public_context(target_slug);$$;
create function public.public_ramadan_submit(payload jsonb)returns jsonb language sql security definer set search_path=''as $$select private.ramadan_submit(payload);$$;
create function public.admin_ramadan_workspace(target_campaign uuid)returns jsonb language sql security definer set search_path=''as $$select private.ramadan_admin_workspace(target_campaign);$$;
create function public.admin_ramadan_offering(target_campaign uuid,payload jsonb)returns jsonb language sql security definer set search_path=''as $$select private.ramadan_admin_offering(target_campaign,payload);$$;
create function public.admin_ramadan_schedule(target_campaign uuid,payload jsonb)returns jsonb language sql security definer set search_path=''as $$select private.ramadan_admin_schedule(target_campaign,payload);$$;
create function public.admin_ramadan_slots(target_campaign uuid,target_schedule uuid)returns jsonb language sql security definer set search_path=''as $$select private.ramadan_admin_slots(target_campaign,target_schedule);$$;
create function public.admin_ramadan_sponsorships(target_campaign uuid,options jsonb)returns jsonb language sql security definer set search_path=''as $$select private.ramadan_admin_sponsorships(target_campaign,options);$$;
create function public.admin_ramadan_detail(target_campaign uuid,target_sponsorship uuid)returns jsonb language sql security definer set search_path=''as $$select private.ramadan_admin_detail(target_campaign,target_sponsorship);$$;
create function public.admin_ramadan_activity(target_campaign uuid,page_number integer)returns jsonb language sql security definer set search_path=''as $$select private.ramadan_admin_activity(target_campaign,page_number);$$;
alter table private.ramadan_operational_audit enable row level security;alter table private.ramadan_submission_idempotency enable row level security;
revoke all on private.ramadan_operational_audit,private.ramadan_submission_idempotency from public,anon,authenticated,service_role,supabase_auth_admin,authenticator,campaign_scheduler,qurban_proof_storage_worker;
do $$declare f record;begin for f in select p.oid from pg_proc p join pg_namespace n on n.oid=p.pronamespace where(n.nspname='private'and p.proname like'ramadan_%')or(n.nspname='public'and p.proname like'%ramadan%')loop execute format('revoke all on function %s from public,anon,authenticated,service_role,supabase_auth_admin,authenticator,campaign_scheduler,qurban_proof_storage_worker',f.oid::regprocedure);end loop;end $$;
grant execute on function public.public_ramadan_context(text),public.public_ramadan_submit(jsonb)to anon,authenticated;
grant execute on function public.admin_ramadan_workspace(uuid),public.admin_ramadan_offering(uuid,jsonb),public.admin_ramadan_schedule(uuid,jsonb),public.admin_ramadan_slots(uuid,uuid),public.admin_ramadan_sponsorships(uuid,jsonb),public.admin_ramadan_detail(uuid,uuid),public.admin_ramadan_activity(uuid,integer)to authenticated;
commit;
