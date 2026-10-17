begin;
-- Foundation only. No public/domain management/payment/assignment/receipt RPCs.
create function private.ramadan_text_valid(v text,lo integer,hi integer) returns boolean language sql immutable set search_path='' as $$
 select coalesce(length(v) between lo and hi and v=btrim(v) and v!~'^[[:space:]]|[[:space:]]$' and v!~'[[:cntrl:]<>]' and v!~U&'[\0080-\009f]',false);
$$;
create function private.ramadan_config_v1_valid(c jsonb) returns boolean language plpgsql immutable set search_path='' as $$
begin
 if jsonb_typeof(c) is distinct from 'object' or octet_length(c::text)>512 then return false;end if;
 if not c?&array['campaign_year','hijri_display_label','currency'] or(select count(*)from jsonb_object_keys(c))<>3 then return false;end if;
 return coalesce(jsonb_typeof(c->'campaign_year')='number' and c->>'campaign_year'~'^[0-9]{4}$' and(c->>'campaign_year')::integer between 1900 and 9999
 and jsonb_typeof(c->'hijri_display_label')='string' and private.ramadan_text_valid(c->>'hijri_display_label',1,80)
 and jsonb_typeof(c->'currency')='string' and c->>'currency'='MYR',false);
exception when others then return false;end $$;
-- Exact INTEGER minor-unit semantics. Unscaled NUMERIC rejects fractional input rather
-- than silently rounding it through PostgreSQL's numeric -> bigint implicit cast.
create domain private.ramadan_minor_units as numeric check(value between 1 and 1000000000000 and scale(value)=0);

create table private.ramadan_offerings(
 id uuid primary key default gen_random_uuid(),campaign_id uuid not null references private.campaigns(id) on delete restrict,
 name text not null check(private.ramadan_text_valid(name,1,100)),
 normalized_name text generated always as(lower(regexp_replace(btrim(name),'[[:space:]]+',' ','g'))) stored,
 mode text not null check(mode in('FIXED_SLOT','OPEN_AMOUNT')),
 display_order integer not null default 0 check(display_order between 0 and 9999),active boolean not null default true,
 created_at timestamptz not null default clock_timestamp(),updated_at timestamptz not null default clock_timestamp(),version integer not null default 1 check(version>0),
 unique(id,campaign_id),unique(campaign_id,normalized_name)
);
create table private.ramadan_schedule_entries(
 id uuid primary key default gen_random_uuid(),campaign_id uuid not null,offering_id uuid not null,
 ramadan_day_number integer not null check(ramadan_day_number between 1 and 30),
 service_date date not null check(isfinite(service_date)),
 unit_price_minor private.ramadan_minor_units not null check(unit_price_minor<=1000000000),
 slot_count integer not null check(slot_count between 1 and 1000),active boolean not null default true,
 created_at timestamptz not null default clock_timestamp(),updated_at timestamptz not null default clock_timestamp(),version integer not null default 1 check(version>0),
 unique(id,campaign_id),unique(id,offering_id,campaign_id),unique(campaign_id,offering_id,service_date),
 foreign key(offering_id,campaign_id)references private.ramadan_offerings(id,campaign_id)on delete restrict
);
create table private.ramadan_slots(
 id uuid primary key default gen_random_uuid(),campaign_id uuid not null,schedule_entry_id uuid not null,
 slot_number integer not null check(slot_number between 1 and 1000),
 unique(id,campaign_id),unique(schedule_entry_id,slot_number),
 foreign key(schedule_entry_id,campaign_id)references private.ramadan_schedule_entries(id,campaign_id)on delete restrict
);
create table private.ramadan_sponsorships(
 id uuid primary key default gen_random_uuid(),campaign_id uuid not null references private.campaigns(id)on delete restrict,
 public_reference text not null unique check(public_reference~'^RSP-[0-9a-f]{64}$'),
 payer_name text not null check(private.ramadan_text_valid(payer_name,1,160)),
 phone text not null check(private.ramadan_text_valid(phone,8,30) and phone~'^[+]?[0-9 ()-]+$' and length(regexp_replace(phone,'[^0-9]','','g'))between 8 and 15),
 email text check(email is null or(private.ramadan_text_valid(email,3,254)and email~'^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$')),
 public_display_mode text not null check(public_display_mode in('named','anonymous')),public_display_name text,
 quoted_total_minor private.ramadan_minor_units not null,currency text not null default 'MYR' check(currency='MYR'),
 campaign_year integer not null check(campaign_year between 1900 and 9999),campaign_revision integer not null check(campaign_revision>0),
 hijri_display_label text not null check(private.ramadan_text_valid(hijri_display_label,1,80)),
 status text not null default 'submitted'check(status in('submitted','cancelled')),
 created_at timestamptz not null default clock_timestamp(),updated_at timestamptz not null default clock_timestamp(),version integer not null default 1 check(version>0),
 unique(id,campaign_id),
 check((public_display_mode='anonymous'and public_display_name is null)or(public_display_mode='named'and public_display_name is not null and private.ramadan_text_valid(public_display_name,1,160)))
);
create table private.ramadan_sponsorship_items(
 id uuid primary key default gen_random_uuid(),campaign_id uuid not null,sponsorship_id uuid not null,offering_id uuid not null,
 mode text not null check(mode in('FIXED_SLOT','OPEN_AMOUNT')),schedule_entry_id uuid,
 quantity integer check(quantity between 1 and 1000),accepted_unit_price_minor private.ramadan_minor_units check(accepted_unit_price_minor<=1000000000),
 contribution_amount_minor private.ramadan_minor_units,
 line_total_minor private.ramadan_minor_units generated always as(case when mode='FIXED_SLOT' then quantity*accepted_unit_price_minor else contribution_amount_minor end)stored not null,
 created_at timestamptz not null default clock_timestamp(),
 foreign key(sponsorship_id,campaign_id)references private.ramadan_sponsorships(id,campaign_id)on delete restrict,
 foreign key(offering_id,campaign_id)references private.ramadan_offerings(id,campaign_id)on delete restrict,
 foreign key(schedule_entry_id,offering_id,campaign_id)references private.ramadan_schedule_entries(id,offering_id,campaign_id)on delete restrict,
 check((mode='FIXED_SLOT'and schedule_entry_id is not null and quantity is not null and accepted_unit_price_minor is not null and contribution_amount_minor is null)
 or(mode='OPEN_AMOUNT'and schedule_entry_id is null and quantity is null and accepted_unit_price_minor is null and contribution_amount_minor is not null))
);
create index ramadan_offering_campaign_order on private.ramadan_offerings(campaign_id,display_order,id);
create index ramadan_schedule_offering on private.ramadan_schedule_entries(offering_id,campaign_id,service_date,id);
create index ramadan_slots_campaign_schedule on private.ramadan_slots(campaign_id,schedule_entry_id,slot_number);
create index ramadan_sponsorship_campaign on private.ramadan_sponsorships(campaign_id,created_at,id);
create index ramadan_items_sponsorship on private.ramadan_sponsorship_items(sponsorship_id,campaign_id,created_at,id);
create index ramadan_items_offering on private.ramadan_sponsorship_items(offering_id,campaign_id);
create index ramadan_items_schedule on private.ramadan_sponsorship_items(schedule_entry_id,offering_id,campaign_id)where schedule_entry_id is not null;

create function private.ramadan_campaign_valid(target uuid) returns private.campaigns language plpgsql set search_path='' as $$
declare c private.campaigns;begin
 select *into c from private.campaigns where id=target for share;
 if c.id is null or c.type_key<>'ramadan' or c.config_version<>1 or not private.ramadan_config_v1_valid(c.configuration)then raise exception 'Ramadan campaign required'using errcode='23514';end if;
 return c;end $$;
create function private.ramadan_record_guard()returns trigger language plpgsql set search_path='' as $$
declare c private.campaigns;o private.ramadan_offerings;s private.ramadan_schedule_entries;r private.ramadan_sponsorships;begin
 -- Future commands must take the campaign/domain lock BEFORE DML and sort parents.
 -- This guard also serializes trusted fixture writes; it grants no runtime capability.
 perform pg_advisory_xact_lock(hashtextextended('ramadan:'||coalesce(new.campaign_id,old.campaign_id)::text,0));
 if tg_op='DELETE' then
  if tg_table_name='ramadan_offerings' then
   if exists(select 1 from private.ramadan_schedule_entries where offering_id=old.id)or exists(select 1 from private.ramadan_sponsorship_items where offering_id=old.id)then raise exception 'Referenced offering cannot be deleted'using errcode='42501';end if;
  elsif tg_table_name='ramadan_schedule_entries' then
   if exists(select 1 from private.ramadan_sponsorship_items where schedule_entry_id=old.id)then raise exception 'Activity-bearing schedule cannot be deleted'using errcode='42501';end if;
   delete from private.ramadan_slots where schedule_entry_id=old.id;
  elsif tg_table_name='ramadan_slots' then
   if pg_trigger_depth()<2 or exists(select 1 from private.ramadan_sponsorship_items where schedule_entry_id=old.schedule_entry_id)then raise exception 'Slot deletion requires activity-free rebuild'using errcode='42501';end if;
  else raise exception 'Immutable accepted sponsorship evidence'using errcode='42501';end if;
  return old;
 end if;
 c:=private.ramadan_campaign_valid(new.campaign_id);
 if tg_op='UPDATE'and row(new.id,new.campaign_id)is distinct from row(old.id,old.campaign_id)then raise exception 'Stable Ramadan identity required'using errcode='23514';end if;
 if tg_table_name='ramadan_offerings' then
  if tg_op='UPDATE'and new.mode<>old.mode and(exists(select 1 from private.ramadan_schedule_entries where offering_id=old.id)or exists(select 1 from private.ramadan_sponsorship_items where offering_id=old.id))then raise exception 'Referenced offering mode is locked'using errcode='23514';end if;
 elsif tg_table_name='ramadan_schedule_entries' then
  select *into o from private.ramadan_offerings where id=new.offering_id and campaign_id=new.campaign_id for share;
  if o.id is null or o.mode<>'FIXED_SLOT'then raise exception 'Fixed-slot offering required'using errcode='23514';end if;
  if tg_op='UPDATE'then
   if new.offering_id<>old.offering_id then raise exception 'Stable schedule offering required'using errcode='23514';end if;
   if row(new.unit_price_minor,new.slot_count,new.service_date,new.ramadan_day_number)is distinct from row(old.unit_price_minor,old.slot_count,old.service_date,old.ramadan_day_number)
    and exists(select 1 from private.ramadan_sponsorship_items where schedule_entry_id=old.id)then raise exception 'Schedule price/capacity/identity locked by activity'using errcode='23514';end if;
  end if;
 elsif tg_table_name='ramadan_slots' then
  if tg_op='UPDATE'then raise exception 'Immutable slot coordinate'using errcode='42501';end if;
  select *into s from private.ramadan_schedule_entries where id=new.schedule_entry_id and campaign_id=new.campaign_id for share;
  if s.id is null or new.slot_number not between 1 and s.slot_count then raise exception 'Invalid slot coordinate'using errcode='23514';end if;
  return new;
 elsif tg_table_name='ramadan_sponsorships' then
  if tg_op='INSERT'then
   if new.public_reference is not null then raise exception 'Reference is database-controlled'using errcode='23514';end if;
   new.public_reference:='RSP-'||replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-','');
   new.campaign_year:=(c.configuration->>'campaign_year')::integer;new.campaign_revision:=c.version;new.hijri_display_label:=c.configuration->>'hijri_display_label';new.currency:='MYR';
  else
   if row(new.public_reference,new.campaign_year,new.campaign_revision,new.hijri_display_label,new.currency,new.quoted_total_minor)is distinct from row(old.public_reference,old.campaign_year,old.campaign_revision,old.hijri_display_label,old.currency,old.quoted_total_minor)then raise exception 'Immutable accepted sponsorship quote'using errcode='23514';end if;
   if old.status='cancelled'then raise exception 'Terminal sponsorship cancellation'using errcode='23514';end if;
  end if;
 elsif tg_table_name='ramadan_sponsorship_items' then
  if tg_op<>'INSERT'then raise exception 'Immutable accepted sponsorship item'using errcode='42501';end if;
  select *into o from private.ramadan_offerings where id=new.offering_id and campaign_id=new.campaign_id for share;
  select *into r from private.ramadan_sponsorships where id=new.sponsorship_id and campaign_id=new.campaign_id for update;
  if o.id is null or o.mode<>new.mode or not o.active or r.id is null or r.status<>'submitted'then raise exception 'Eligible same-campaign offering/sponsorship required'using errcode='23514';end if;
  if new.mode='FIXED_SLOT'then
   select *into s from private.ramadan_schedule_entries where id=new.schedule_entry_id and offering_id=o.id and campaign_id=new.campaign_id for share;
   if s.id is null or not s.active or new.quantity is null or new.quantity>s.slot_count then raise exception 'Eligible fixed schedule/quantity required'using errcode='23514';end if;
   if new.accepted_unit_price_minor is not null and new.accepted_unit_price_minor<>s.unit_price_minor then raise exception 'Exact accepted schedule price required'using errcode='23514';end if;
   new.accepted_unit_price_minor:=s.unit_price_minor;
  end if;
  new.created_at:=clock_timestamp();return new;
 end if;
 if tg_op='INSERT'then new.created_at:=clock_timestamp();new.version:=1;
 else
  if new.created_at<>old.created_at then raise exception 'Immutable creation timestamp'using errcode='23514';end if;
  new.version:=old.version+1;
 end if;new.updated_at:=clock_timestamp();return new;
end $$;
create trigger ramadan_offering_guard before insert or update or delete on private.ramadan_offerings for each row execute function private.ramadan_record_guard();
create trigger ramadan_schedule_guard before insert or update or delete on private.ramadan_schedule_entries for each row execute function private.ramadan_record_guard();
create trigger ramadan_slot_guard before insert or update or delete on private.ramadan_slots for each row execute function private.ramadan_record_guard();
create trigger ramadan_sponsorship_guard before insert or update or delete on private.ramadan_sponsorships for each row execute function private.ramadan_record_guard();
create trigger ramadan_item_guard before insert or update or delete on private.ramadan_sponsorship_items for each row execute function private.ramadan_record_guard();

create function private.ramadan_materialize_slots()returns trigger language plpgsql set search_path='' as $$
begin
 if tg_op='INSERT'or new.slot_count<>old.slot_count then
  if exists(select 1 from private.ramadan_sponsorship_items where schedule_entry_id=new.id)then raise exception 'Activity prevents slot rebuild'using errcode='23514';end if;
  delete from private.ramadan_slots where schedule_entry_id=new.id;
  insert into private.ramadan_slots(campaign_id,schedule_entry_id,slot_number)select new.campaign_id,new.id,n from generate_series(1,new.slot_count)n;
 end if;return new;
end $$;
create trigger ramadan_schedule_materialization after insert or update on private.ramadan_schedule_entries for each row execute function private.ramadan_materialize_slots();
-- Read-only deferred integrity: fires after a future SECURITY DEFINER wrapper returns.
-- Trusted owner, empty path, zero runtime EXECUTE; no mutation or application API.
create function private.ramadan_integrity_guard()returns trigger language plpgsql security definer set search_path='' as $$
declare sid uuid;rid uuid;s private.ramadan_schedule_entries;r private.ramadan_sponsorships;n integer;total numeric;begin
 if tg_table_name in('ramadan_schedule_entries','ramadan_slots')then
  if tg_table_name='ramadan_schedule_entries'then sid:=coalesce(new.id,old.id);else sid:=coalesce(new.schedule_entry_id,old.schedule_entry_id);end if;
  select *into s from private.ramadan_schedule_entries where id=sid;
  if s.id is not null and(select count(*)from private.ramadan_slots where schedule_entry_id=sid)<>s.slot_count then raise exception 'Exact 1..N materialized slots required'using errcode='23514';end if;
 else
  if tg_table_name='ramadan_sponsorships'then rid:=new.id;else rid:=new.sponsorship_id;end if;
  select *into r from private.ramadan_sponsorships where id=rid;
  select count(*),sum(line_total_minor)into n,total from private.ramadan_sponsorship_items where sponsorship_id=rid;
  if r.id is null or n not between 1 and 100 or total is distinct from r.quoted_total_minor then raise exception 'Exact bounded sponsorship item total required'using errcode='23514';end if;
  if exists(select 1 from private.ramadan_sponsorship_items i join private.ramadan_schedule_entries e on e.id=i.schedule_entry_id where i.sponsorship_id=rid group by i.schedule_entry_id having sum(i.quantity)>max(e.slot_count))then raise exception 'Combined schedule quantity exceeds configured capacity'using errcode='23514';end if;
 end if;return null;
end $$;
create constraint trigger ramadan_schedule_integrity after insert or update or delete on private.ramadan_schedule_entries deferrable initially deferred for each row execute function private.ramadan_integrity_guard();
create constraint trigger ramadan_slot_integrity after insert or update or delete on private.ramadan_slots deferrable initially deferred for each row execute function private.ramadan_integrity_guard();
create constraint trigger ramadan_sponsorship_integrity after insert or update on private.ramadan_sponsorships deferrable initially deferred for each row execute function private.ramadan_integrity_guard();
create constraint trigger ramadan_item_integrity after insert on private.ramadan_sponsorship_items deferrable initially deferred for each row execute function private.ramadan_integrity_guard();

do $$declare t text;f record;begin
 foreach t in array array['ramadan_offerings','ramadan_schedule_entries','ramadan_slots','ramadan_sponsorships','ramadan_sponsorship_items']loop
  execute format('alter table private.%I enable row level security',t);
  execute format('revoke all on private.%I from public,anon,authenticated,service_role,supabase_auth_admin,authenticator,campaign_scheduler,qurban_proof_storage_worker',t);
 end loop;
 for f in select p.oid from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='private'and p.proname like 'ramadan_%'loop
  execute format('revoke all on function %s from public,anon,authenticated,service_role,supabase_auth_admin,authenticator,campaign_scheduler,qurban_proof_storage_worker',f.oid::regprocedure);
 end loop;
end $$;
revoke all on type private.ramadan_minor_units from public,anon,authenticated,service_role,supabase_auth_admin,authenticator,campaign_scheduler,qurban_proof_storage_worker;
insert into private.campaign_type_descriptors(type_key,config_version,module_flag_key,validator_name)values('ramadan',1,'ramadan.enabled','ramadan_config_v1_valid');
commit;
