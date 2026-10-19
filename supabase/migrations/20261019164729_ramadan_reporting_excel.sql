begin;
-- Reporting is read-only over existing business facts. The only new persistence is export completion evidence.
create table private.ramadan_report_exports(
 id uuid primary key default gen_random_uuid(),campaign_id uuid not null references private.campaigns(id),actor_id uuid not null references public.admin_profiles(user_id),
 report_type text not null default 'ramadan.xlsx'check(report_type='ramadan.xlsx'),captured_at timestamptz not null default clock_timestamp(),expires_at timestamptz not null,snapshot_hash text not null check(snapshot_hash~'^[0-9a-f]{64}$'),
 filter_bounds jsonb not null check(jsonb_typeof(filter_bounds)='object'and octet_length(filter_bounds::text)<=4096),
 payment_count integer not null check(payment_count between 0 and 2000),item_count integer not null check(item_count between 0 and 10000),slot_count integer not null check(slot_count between 0 and 10000),completed_at timestamptz,
 check(expires_at>captured_at and expires_at<=captured_at+interval'10 minutes'),check(completed_at is null or completed_at>=captured_at)
);
create index ramadan_report_export_campaign on private.ramadan_report_exports(campaign_id,captured_at desc,id);
alter table private.ramadan_report_exports enable row level security;
revoke all on private.ramadan_report_exports from public,anon,authenticated,service_role,supabase_auth_admin,authenticator,campaign_scheduler,qurban_proof_storage_worker,ramadan_proof_storage_worker;
create function private.ramadan_report_filter(target uuid,f jsonb)returns jsonb language plpgsql set search_path=''as $$
declare c private.campaigns;v text;begin
 perform private.require_campaign_access('read');c:=private.ramadan_campaign_valid(target);
 if not private.ramadan_exact_object(f,array['year','offering_id','day','date_from','date_to','payment_status','sponsorship_status','exception','search','view','page'])or octet_length(f::text)>4096 then raise exception 'Invalid reporting filters'using errcode='22023';end if;
 if jsonb_typeof(f->'page')is distinct from'number'or f->>'page'!~'^[1-9][0-9]{0,4}$'or f->>'view'not in('summary','schedules','verified','pending','rejected','actions')or jsonb_typeof(f->'view')is distinct from'string'
 or jsonb_typeof(f->'payment_status')is distinct from'string'or jsonb_typeof(f->'sponsorship_status')is distinct from'string'or jsonb_typeof(f->'exception')is distinct from'string'or f->>'payment_status'not in('all','none','submitted','rejected','verified')or f->>'sponsorship_status'not in('all','submitted','cancelled')or f->>'exception'not in('all','none','any','calendar','capacity')
 or jsonb_typeof(f->'search')is distinct from'string'or f->>'search'!~'^[A-Za-z0-9-]{0,68}$'then raise exception 'Invalid reporting filters'using errcode='22023';end if;
 if f->'year'<>'null'::jsonb and(jsonb_typeof(f->'year')<>'number'or f->>'year'<>c.configuration->>'campaign_year')then raise exception 'Wrong campaign year'using errcode='22023';end if;
 if f->'day'<>'null'::jsonb and(jsonb_typeof(f->'day')<>'number'or f->>'day'!~'^([1-9]|[12][0-9]|30)$')then raise exception 'Invalid Ramadan day'using errcode='22023';end if;
 if f->'offering_id'<>'null'::jsonb then
 if jsonb_typeof(f->'offering_id')<>'string'or f->>'offering_id'!~'^[0-9a-f-]{36}$'then raise exception 'Invalid offering'using errcode='22023';end if;
 if not exists(select 1 from private.ramadan_offerings where id=(f->>'offering_id')::uuid and campaign_id=target)then raise exception 'Wrong campaign offering'using errcode='42501';end if;end if;
 foreach v in array array['date_from','date_to']loop if f->v<>'null'::jsonb then begin if jsonb_typeof(f->v)<>'string'or f->>v!~'^[0-9]{4}-[0-9]{2}-[0-9]{2}$'or to_char((f->>v)::date,'YYYY-MM-DD')<>f->>v then raise exception 'Invalid date';end if;exception when others then raise exception 'Invalid report date'using errcode='22023';end;end if;end loop;
 if(f->>'date_from')::date>(f->>'date_to')::date then raise exception 'Invalid report range'using errcode='22023';end if;
 if private.active_role()='staff'and(f->>'view'not in('summary','schedules')or f->>'search'<>''or f->>'payment_status'<>'all'or f->>'sponsorship_status'<>'all')then raise exception 'Manager reporting required'using errcode='42501';end if;
 return f;
end $$;
-- STABLE pins all nested reads to the calling statement's MVCC snapshot, including every export sheet.
create function private.ramadan_report_data(target uuid,f jsonb,full_export boolean)returns jsonb language sql stable set search_path=''as $$
with c as materialized(select *,private.active_role()in('admin','super_admin')manager,
 status='open'and visibility in('public','unlisted')and(registration_opens_at is null or statement_timestamp()>=registration_opens_at)and(registration_closes_at is null or statement_timestamp()<registration_closes_at)
 and exists(select 1 from private.system_feature_flags where flag_key='campaigns.enabled'and enabled)and exists(select 1 from private.system_feature_flags where flag_key='ramadan.enabled'and enabled)intake
 from private.campaigns where id=target),
catalog as materialized(select s.*,o.name offering_name,o.active offering_active,private.ramadan_calendar_invalid(s.id)invalid,
 case when private.ramadan_calendar_invalid(s.id)then null else private.ramadan_calendar_effective(s.id)end current_date_value
 from private.ramadan_schedule_entries s join private.ramadan_offerings o on o.id=s.offering_id where s.campaign_id=target),
sc as materialized(select s.* from catalog s where(f->>'offering_id'is null or s.offering_id=(f->>'offering_id')::uuid)and(f->>'day'is null or s.ramadan_day_number=(f->>'day')::integer)
 and(f->>'date_from'is null or s.current_date_value>=(f->>'date_from')::date)and(f->>'date_to'is null or s.current_date_value<=(f->>'date_to')::date)
 and(f->>'exception'not in('calendar','none')or s.invalid=(f->>'exception'='calendar'))),
b as materialized(select r.id,r.campaign_id,r.public_reference,r.status,r.version,r.created_at,r.quoted_total_minor,coalesce(rec.payer_name,r.payer_name)payer_name,p.id verified_payment_id,p.verified_amount_minor,p.payment_date,p.verified_at,rec.receipt_number,pr.id proof_id,pr.status proof_status,pr.submitted_at proof_at,pr.reviewed_at,pr.rejection_reason,
 private.ramadan_calendar_sponsor_invalid(r.id)calendar_exception,
 p.id is null and pr.status='submitted'and exists(select 1 from private.ramadan_capacity_exceptions e where e.proof_id=pr.id)capacity_exception,
 case when p.id is not null then'verified'else coalesce(pr.status,'none')end payment_state
 from private.ramadan_sponsorships r join c on c.manager
 left join private.ramadan_payments p on p.sponsorship_id=r.id left join private.ramadan_receipts rec on rec.sponsorship_id=r.id
 left join lateral(select x.* from private.ramadan_payment_proofs x where x.sponsorship_id=r.id order by x.submitted_at desc,x.id desc limit 1)pr on true
 where r.campaign_id=target and(f->>'sponsorship_status'='all'or r.status=f->>'sponsorship_status')and strpos(lower(r.public_reference),lower(f->>'search'))>0
 and exists(select 1 from private.ramadan_sponsorship_items i left join catalog s on s.id=i.schedule_entry_id where i.sponsorship_id=r.id
 and(f->>'offering_id'is null or i.offering_id=(f->>'offering_id')::uuid)and(f->>'day'is null or s.ramadan_day_number=(f->>'day')::integer)
 and(f->>'date_from'is null or s.current_date_value>=(f->>'date_from')::date)and(f->>'date_to'is null or s.current_date_value<=(f->>'date_to')::date))),
sponsors as materialized(select *from b where(f->>'payment_status'='all'or payment_state=f->>'payment_status')and case f->>'exception'when'calendar'then calendar_exception when'capacity'then coalesce(capacity_exception,false)when'any'then calendar_exception or coalesce(capacity_exception,false)when'none'then not calendar_exception and not coalesce(capacity_exception,false)else true end),
verified as materialized(select *from sponsors where verified_payment_id is not null),
items as materialized(select r.public_reference reference,i.accepted_offering_name offering_name,i.mode,s.ramadan_day_number,coalesce(a.accepted_date,s.service_date)accepted_date,s.current_date_value current_date,i.quantity,i.accepted_unit_price_minor unit_price_minor,i.line_total_minor,r.receipt_number,
 i.offering_id,i.schedule_entry_id,i.id item_id,i.created_at,coalesce(s.invalid,false)calendar_exception
 from verified r join private.ramadan_sponsorship_items i on i.sponsorship_id=r.id left join catalog s on s.id=i.schedule_entry_id left join private.ramadan_item_calendar_acceptances a on a.item_id=i.id),
slotrows as materialized(select s.id schedule_id,s.offering_name,s.ramadan_day_number,s.service_date original_date,s.current_date_value current_date,s.unit_price_minor,s.slot_count,s.active and s.offering_active active,s.invalid calendar_exception,
 c.intake and s.active and s.offering_active and not s.invalid intake,sl.slot_number,
 x.id is not null occupied,case when x.id is null then'Belum ditaja'when r.public_display_mode='anonymous'then'Hamba Allah'else r.public_display_name end display_name
 from sc s cross join c join private.ramadan_slots sl on sl.schedule_entry_id=s.id
 left join(private.ramadan_slot_assignments x join private.ramadan_payments p on p.id=x.payment_id)on x.slot_id=sl.id
 left join private.ramadan_sponsorships r on r.id=x.sponsorship_id),
schedulerows as materialized(select s.id,s.offering_name,s.ramadan_day_number,s.service_date original_date,s.current_date_value current_date,s.unit_price_minor,s.slot_count capacity,s.invalid calendar_exception,s.active and s.offering_active active,
 (select count(*)from slotrows x where x.schedule_id=s.id and occupied)confirmed,
 s.slot_count-(select count(*)from slotrows x where x.schedule_id=s.id and occupied)physical_empty,
 case when c.intake and s.active and s.offering_active and not s.invalid then s.slot_count-(select count(*)from slotrows x where x.schedule_id=s.id and occupied)else 0 end available_intake
 from sc s cross join c),
rejects as materialized(select s.id,s.public_reference reference,p.rejection_reason,p.reviewed_at,p.submitted_at,s.payment_state current_payment_state,exists(select 1 from private.ramadan_payment_proofs later where later.sponsorship_id=s.id and(later.submitted_at,later.id)>(p.submitted_at,p.id))resubmitted from sponsors s join private.ramadan_payment_proofs p on p.sponsorship_id=s.id where p.status='rejected'),
actions as materialized(select s.id,s.public_reference reference,s.payment_state,s.calendar_exception,coalesce(s.capacity_exception,false)capacity_exception,s.payment_state='rejected'rejection_action,s.proof_at,s.reviewed_at,s.rejection_reason,
 i.accepted_offering_name offering_name,cat.ramadan_day_number,cat.current_date_value current_date,coalesce(cat.invalid,false)invalid_day,s.created_at
 from sponsors s join private.ramadan_sponsorship_items i on i.sponsorship_id=s.id left join catalog cat on cat.id=i.schedule_entry_id
 where(s.calendar_exception and coalesce(cat.invalid,false))or coalesce(s.capacity_exception,false)or s.payment_state='rejected'),
counts as(select(select count(*)from sponsors)sp,(select count(*)from items)it,(select count(*)from slotrows)sl,(select count(*)from sc)catalog_count,(select count(*)from actions)ac,(select count(*)from rejects)rj)
select case when(c.manager and(select coalesce(sum(verified_amount_minor),0)from verified)>100000000000000)or(full_export and(sp>2000 or it>10000 or sl>10000 or catalog_count>500 or ac>10000 or rj>10000))then jsonb_build_object('bounded',false)else
jsonb_build_object('exportable',c.manager and sp<=2000 and it<=10000 and sl<=10000 and catalog_count<=500 and ac<=10000 and rj<=10000,'bounded',true,'generated_at',statement_timestamp(),'campaign',jsonb_build_object('title',c.title,'year',(c.configuration->>'campaign_year')::integer,'hijri_label',c.configuration->>'hijri_display_label'),
 'calendar',private.ramadan_calendar_current(target),'filters',f,'can_manage',c.manager,
 'offerings',coalesce((select jsonb_agg(jsonb_build_object('id',o.id,'name',o.name)order by o.display_order,o.id)from(select *from private.ramadan_offerings where campaign_id=target order by display_order,id limit 500)o),'[]'::jsonb),
 'summary',jsonb_build_object('verified_minor',case when c.manager then(select coalesce(sum(verified_amount_minor),0)from verified)end,'transactions',case when c.manager then(select count(*)from verified)end,
 'capacity',(select coalesce(sum(capacity),0)from schedulerows),'confirmed',(select count(*)from slotrows where occupied),'physical_empty',(select count(*)from slotrows where not occupied),
 'available_intake',(select coalesce(sum(available_intake),0)from schedulerows),'blocked',(select coalesce(sum(physical_empty-available_intake),0)from schedulerows),
 'pending',case when c.manager then(select count(*)from sponsors where payment_state='submitted')end,'rejected',case when c.manager then(select count(*)from rejects)end,
 'exceptions',case when c.manager then(select count(*)from sponsors where calendar_exception or coalesce(capacity_exception,false))end,
 'open_minor',case when c.manager then(select coalesce(sum(line_total_minor),0)from items where mode='OPEN_AMOUNT')end,
 'matching_item_minor',case when c.manager then(select coalesce(sum(line_total_minor),0)from items where(f->>'offering_id'is null or offering_id=(f->>'offering_id')::uuid)and(f->>'day'is null or ramadan_day_number=(f->>'day')::integer)and(f->>'date_from'is null or current_date>=(f->>'date_from')::date)and(f->>'date_to'is null or current_date<=(f->>'date_to')::date))end),
 'total',case f->>'view'when'schedules'then(select count(*)from schedulerows)when'verified'then(select count(*)from verified)when'pending'then(select count(*)from sponsors where payment_state='submitted')when'rejected'then rj when'actions'then ac else 0 end,
 'rows',case f->>'view'
 when'schedules'then coalesce((select jsonb_agg(to_jsonb(x)order by x.ramadan_day_number,x.offering_name,x.id)from(select *from schedulerows order by ramadan_day_number,offering_name,id limit 25 offset((f->>'page')::integer-1)*25)x),'[]'::jsonb)
 when'verified'then coalesce((select jsonb_agg(to_jsonb(x)order by x.verified_at desc,x.reference)from(select id,public_reference reference,payer_name,verified_amount_minor,payment_date,verified_at,receipt_number,calendar_exception,(select coalesce(jsonb_agg(jsonb_build_object('offering_name',i.offering_name,'quantity',i.quantity,'line_total_minor',i.line_total_minor)order by i.created_at,i.item_id),'[]'::jsonb)from items i where i.reference=verified.public_reference)items from verified order by verified_at desc,public_reference limit 25 offset((f->>'page')::integer-1)*25)x),'[]'::jsonb)
 when'pending'then coalesce((select jsonb_agg(to_jsonb(x)order by x.proof_at,x.reference)from(select id,public_reference reference,quoted_total_minor,proof_at,payment_state,calendar_exception,coalesce(capacity_exception,false)capacity_exception from sponsors where payment_state='submitted'order by proof_at,public_reference limit 25 offset((f->>'page')::integer-1)*25)x),'[]'::jsonb)
 when'rejected'then coalesce((select jsonb_agg(to_jsonb(x))from(select *from rejects order by reviewed_at desc,reference limit 25 offset((f->>'page')::integer-1)*25)x),'[]'::jsonb)
 when'actions'then coalesce((select jsonb_agg(to_jsonb(x))from(select *from actions order by reference,offering_name,ramadan_day_number,id limit 25 offset((f->>'page')::integer-1)*25)x),'[]'::jsonb)
 else'[]'::jsonb end)
 ||case when full_export then jsonb_build_object('payments',coalesce((select jsonb_agg(jsonb_build_object('reference',public_reference,'payer_name',payer_name,'amount_minor',verified_amount_minor,'payment_date',payment_date,'verified_at',verified_at,'receipt_number',receipt_number,'calendar_exception',calendar_exception)order by verified_at,public_reference)from verified),'[]'::jsonb),
 'items',coalesce((select jsonb_agg(to_jsonb(x)-'offering_id'-'schedule_entry_id'-'item_id'-'created_at'order by reference,created_at,item_id)from items x),'[]'::jsonb),
 'schedules',coalesce((select jsonb_agg(to_jsonb(x)order by ramadan_day_number,offering_name,id)from schedulerows x),'[]'::jsonb),
 'slots',coalesce((select jsonb_agg(to_jsonb(x)-'schedule_id'order by ramadan_day_number,offering_name,schedule_id,slot_number)from slotrows x),'[]'::jsonb),
 'actions',coalesce((select jsonb_agg(to_jsonb(x)-'id'order by reference,offering_name,ramadan_day_number)from actions x),'[]'::jsonb))else'{}'::jsonb end end
from c cross join counts
$$;
create function private.ramadan_report_guard()returns trigger language plpgsql set search_path=''as $$begin
 perform private.require_campaign_access('manage');
 if tg_op='DELETE'then raise exception 'Immutable reporting evidence'using errcode='42501';end if;
 if tg_op='INSERT'then new.actor_id:=auth.uid();new.captured_at:=clock_timestamp();new.expires_at:=new.captured_at+interval'10 minutes';new.completed_at:=null;
 elsif new.completed_at is null or old.completed_at is not null or(new.id,new.campaign_id,new.actor_id,new.captured_at,new.expires_at,new.snapshot_hash,new.filter_bounds,new.payment_count,new.item_count,new.slot_count)is distinct from(old.id,old.campaign_id,old.actor_id,old.captured_at,old.expires_at,old.snapshot_hash,old.filter_bounds,old.payment_count,old.item_count,old.slot_count)then raise exception 'Immutable export evidence'using errcode='42501';end if;
 return new;end $$;
create trigger ramadan_report_export_guard before insert or update or delete on private.ramadan_report_exports for each row execute function private.ramadan_report_guard();
create function public.admin_ramadan_report(target_campaign uuid,filters jsonb)returns jsonb language plpgsql security definer set search_path=''as $$begin
 return private.ramadan_report_data(target_campaign,private.ramadan_report_filter(target_campaign,filters),false);end $$;
create function public.admin_ramadan_report_export(target_campaign uuid,filters jsonb)returns jsonb language plpgsql security definer set search_path=''as $$
declare s jsonb;ticket private.ramadan_report_exports;f jsonb;begin
 perform private.require_campaign_access('manage');f:=private.ramadan_report_filter(target_campaign,filters);s:=private.ramadan_report_data(target_campaign,f,true);
 if not(s->>'bounded')::boolean or octet_length(s::text)>16777216 then raise exception 'Narrow export filters'using errcode='22023';end if;
 insert into private.ramadan_report_exports(campaign_id,actor_id,expires_at,snapshot_hash,filter_bounds,payment_count,item_count,slot_count)values(target_campaign,auth.uid(),clock_timestamp()+interval'10 minutes',private.ramadan_proof_hash(s::text),(f-'search'-'page'-'view')||jsonb_build_object('reference_search_hash',private.ramadan_proof_hash(f->>'search')),jsonb_array_length(s->'payments'),jsonb_array_length(s->'items'),jsonb_array_length(s->'slots'))returning *into ticket;
 return s||jsonb_build_object('export_id',ticket.id,'snapshot_hash',ticket.snapshot_hash);end $$;
create function public.admin_ramadan_report_export_complete(target_campaign uuid,export_reference uuid,snapshot_fingerprint text)returns jsonb language plpgsql security definer set search_path=''as $$
declare t private.ramadan_report_exports;begin
 perform private.require_campaign_access('manage');perform private.ramadan_campaign_valid(target_campaign);select *into t from private.ramadan_report_exports where id=export_reference and campaign_id=target_campaign and actor_id=auth.uid()for update;
 if t.id is null or t.snapshot_hash is distinct from snapshot_fingerprint or t.expires_at<clock_timestamp()then raise exception 'Export unavailable'using errcode='PT409';end if;
 if t.completed_at is null then update private.ramadan_report_exports set completed_at=clock_timestamp()where id=t.id;end if;return jsonb_build_object('completed',true);end $$;
create function public.admin_ramadan_report_print(target_campaign uuid,filters jsonb)returns jsonb language plpgsql security definer set search_path=''as $$
declare s jsonb;begin s:=private.ramadan_report_data(target_campaign,private.ramadan_report_filter(target_campaign,filters),true);if not(s->>'bounded')::boolean then raise exception 'Narrow print filters'using errcode='22023';end if;return jsonb_build_object('campaign',s->'campaign','calendar',s->'calendar','generated_at',s->'generated_at','slots',s->'slots');end $$;
revoke all on function private.ramadan_report_filter(uuid,jsonb),private.ramadan_report_data(uuid,jsonb,boolean),private.ramadan_report_guard(),public.admin_ramadan_report(uuid,jsonb),public.admin_ramadan_report_export(uuid,jsonb),public.admin_ramadan_report_export_complete(uuid,uuid,text),public.admin_ramadan_report_print(uuid,jsonb)from public,anon,authenticated,service_role,supabase_auth_admin,authenticator,campaign_scheduler,qurban_proof_storage_worker,ramadan_proof_storage_worker;
grant execute on function public.admin_ramadan_report(uuid,jsonb),public.admin_ramadan_report_export(uuid,jsonb),public.admin_ramadan_report_export_complete(uuid,uuid,text),public.admin_ramadan_report_print(uuid,jsonb)to authenticated;
commit;
