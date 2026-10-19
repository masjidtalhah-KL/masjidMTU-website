begin;
-- Restore the six existing evidence guards on upgrade as well as on a fresh chain.
-- Older local fixture cleanup could leave them disabled; no business row is rewritten.
do $$declare t text;begin foreach t in array array['ramadan_payment_access','ramadan_payment_sessions','ramadan_proof_intents','ramadan_payment_proofs','ramadan_payment_audit','ramadan_proof_download_grants']loop execute format('alter table private.%I enable trigger %I',t,t||'_guard');end loop;end $$;
-- 10.2b only: private verified aggregate, atomic slot admission and immutable receipts.
alter table private.ramadan_sponsorship_items add constraint ramadan_item_identity_owner unique(id,sponsorship_id,campaign_id);
alter table private.ramadan_slots add constraint ramadan_slot_schedule_owner unique(id,schedule_entry_id,campaign_id);
alter table private.ramadan_payment_proofs drop constraint ramadan_payment_proofs_status_check;
alter table private.ramadan_payment_proofs drop constraint ramadan_payment_proofs_version_check;
alter table private.ramadan_payment_proofs add column reviewed_at timestamptz,add column reviewed_by uuid references public.admin_profiles(user_id),add column rejection_reason text;
alter table private.ramadan_payment_proofs add constraint ramadan_proof_transition_shape check(
 (status='submitted'and version=1 and reviewed_at is null and reviewed_by is null and rejection_reason is null)
 or(status in('rejected','verified')and version=2 and reviewed_at is not null and reviewed_by is not null and reviewed_at>=submitted_at and
 ((status='verified'and rejection_reason is null)or(status='rejected'and rejection_reason in('jumlah_tidak_tepat','bukti_tidak_jelas','bukti_tidak_sah','bayaran_tidak_ditemui','lain_lain_operasi')))));
create table private.ramadan_payments(
 id uuid primary key default gen_random_uuid(),campaign_id uuid not null,sponsorship_id uuid not null unique,verified_proof_id uuid not null unique,
 quoted_total_minor private.ramadan_minor_units not null,verified_amount_minor private.ramadan_minor_units not null check(verified_amount_minor=quoted_total_minor),
 payment_date date not null check(isfinite(payment_date)),verified_at timestamptz not null default clock_timestamp(),verified_by uuid not null references public.admin_profiles(user_id),receipt_id uuid not null unique,
 unique(id,sponsorship_id,campaign_id),unique(id,verified_proof_id,sponsorship_id,campaign_id),
 foreign key(sponsorship_id,campaign_id)references private.ramadan_sponsorships(id,campaign_id),foreign key(verified_proof_id,sponsorship_id,campaign_id)references private.ramadan_payment_proofs(id,sponsorship_id,campaign_id)
);
create table private.ramadan_slot_assignments(
 id uuid primary key default gen_random_uuid(),campaign_id uuid not null,sponsorship_id uuid not null,item_id uuid not null,schedule_entry_id uuid not null,slot_id uuid not null unique,payment_id uuid not null,
 assigned_at timestamptz not null default clock_timestamp(),assigned_by uuid not null references public.admin_profiles(user_id),
 unique(id,campaign_id),foreign key(item_id,sponsorship_id,campaign_id)references private.ramadan_sponsorship_items(id,sponsorship_id,campaign_id),
 foreign key(slot_id,schedule_entry_id,campaign_id)references private.ramadan_slots(id,schedule_entry_id,campaign_id),
 foreign key(payment_id,sponsorship_id,campaign_id)references private.ramadan_payments(id,sponsorship_id,campaign_id)deferrable initially deferred
);
create index ramadan_assignments_sponsorship on private.ramadan_slot_assignments(sponsorship_id,item_id);
create index ramadan_assignments_schedule on private.ramadan_slot_assignments(campaign_id,schedule_entry_id,slot_id);
create table private.ramadan_receipt_counters(campaign_id uuid primary key references private.campaigns(id),last_serial integer not null check(last_serial between 1 and 999999));
create table private.ramadan_receipts(
 id uuid primary key,campaign_id uuid not null,sponsorship_id uuid not null unique,payment_id uuid not null unique,
 serial integer not null check(serial between 1 and 999999),receipt_number text not null check(receipt_number~'^RAM-[0-9]{4}-[0-9]{6}$'),
 campaign_year integer not null check(campaign_year between 1900 and 9999),campaign_title text not null check(private.ramadan_text_valid(campaign_title,1,180)),hijri_display_label text not null check(private.ramadan_text_valid(hijri_display_label,1,80)),
 public_reference text not null check(public_reference~'^RSP-[0-9a-f]{64}$'),payer_name text not null check(private.ramadan_text_valid(payer_name,1,160)),
 currency text not null check(currency='MYR'),verified_amount_minor private.ramadan_minor_units not null,payment_method text not null check(payment_method='bank_transfer'),
 payment_date date not null check(isfinite(payment_date)),issued_at timestamptz not null,issued_by uuid not null references public.admin_profiles(user_id),items jsonb not null,content_hash text not null check(content_hash~'^[0-9a-f]{64}$'),
 unique(id,sponsorship_id,campaign_id),unique(campaign_id,serial),unique(campaign_id,receipt_number),
 foreign key(payment_id,sponsorship_id,campaign_id)references private.ramadan_payments(id,sponsorship_id,campaign_id)deferrable initially deferred,
 foreign key(sponsorship_id,campaign_id)references private.ramadan_sponsorships(id,campaign_id)
);
alter table private.ramadan_payments add constraint ramadan_payment_receipt_owner foreign key(receipt_id,sponsorship_id,campaign_id)references private.ramadan_receipts(id,sponsorship_id,campaign_id)deferrable initially deferred;
create table private.ramadan_capacity_exceptions(
 id uuid primary key default gen_random_uuid(),campaign_id uuid not null,sponsorship_id uuid not null,proof_id uuid not null unique,
 reason text not null default 'capacity_insufficient'check(reason='capacity_insufficient'),occurred_at timestamptz not null default clock_timestamp(),actor_id uuid not null references public.admin_profiles(user_id),
 foreign key(proof_id,sponsorship_id,campaign_id)references private.ramadan_payment_proofs(id,sponsorship_id,campaign_id)
);
create index ramadan_capacity_exception_campaign on private.ramadan_capacity_exceptions(campaign_id,occurred_at,id);
alter table private.ramadan_payment_audit add column payment_id uuid references private.ramadan_payments(id),add column receipt_id uuid references private.ramadan_receipts(id),add column reason text,add column expected_version integer,add column resulting_version integer;
do $$declare c record;begin for c in select conname from pg_constraint where conrelid='private.ramadan_payment_audit'::regclass and contype='c'and pg_get_constraintdef(oid)like '%action%'loop execute format('alter table private.ramadan_payment_audit drop constraint %I',c.conname);end loop;end $$;
alter table private.ramadan_payment_audit add constraint ramadan_payment_audit_v2_shape check(coalesce((
 (action in('payment.proof.submitted','payment.proof.admin_submitted','payment.proof.downloaded')and payment_id is null and receipt_id is null and reason is null and expected_version is null and resulting_version is null and
 ((action='payment.proof.submitted'and actor_id is null and source='participant_upload')or(action='payment.proof.admin_submitted'and actor_id is not null and source='admin_assisted_upload')or(action='payment.proof.downloaded'and actor_id is not null and source is null)))
 or(action='payment.proof.rejected'and actor_id is not null and source is null and payment_id is null and receipt_id is null and reason in('jumlah_tidak_tepat','bukti_tidak_jelas','bukti_tidak_sah','bayaran_tidak_ditemui','lain_lain_operasi')and expected_version=1 and resulting_version=2)
 or(action='payment.capacity_insufficient'and actor_id is not null and source is null and payment_id is null and receipt_id is null and reason='capacity_insufficient'and expected_version=1 and resulting_version=1)
 or(action in('payment.verified','receipt.issued')and actor_id is not null and source is null and payment_id is not null and receipt_id is not null and reason is null and expected_version=1 and resulting_version=2)
 or(action='receipt.downloaded'and source is null and payment_id is not null and receipt_id is not null and reason is null and expected_version is null and resulting_version is null)
),false));
create unique index ramadan_review_audit_once on private.ramadan_payment_audit(proof_id,action)where action in('payment.proof.rejected','payment.capacity_insufficient','payment.verified','receipt.issued');
create function private.ramadan_receipt_items(sponsor uuid)returns jsonb language sql stable set search_path=''as $$
 select coalesce(jsonb_agg(jsonb_build_object('item_id',i.id,'schedule_id',i.schedule_entry_id,'offering_name',i.accepted_offering_name,'mode',i.mode,'service_date',s.service_date,'ramadan_day_number',s.ramadan_day_number,'quantity',i.quantity,'unit_price_minor',i.accepted_unit_price_minor,'contribution_minor',i.contribution_amount_minor,'line_total_minor',i.line_total_minor,'slots',coalesce((select jsonb_agg(t.slot_number order by t.slot_number)from private.ramadan_slot_assignments a join private.ramadan_slots t on t.id=a.slot_id where a.item_id=i.id),'[]'::jsonb))order by i.created_at,i.id),'[]'::jsonb)from private.ramadan_sponsorship_items i left join private.ramadan_schedule_entries s on s.id=i.schedule_entry_id where i.sponsorship_id=sponsor
$$;
create function private.ramadan_financial_guard()returns trigger language plpgsql set search_path=''as $$
declare r private.ramadan_sponsorships;p private.ramadan_payment_proofs;i private.ramadan_proof_intents;begin
 if tg_op<>'INSERT'then
  if tg_table_name='ramadan_receipt_counters'and tg_op='UPDATE'and new.campaign_id=old.campaign_id and new.last_serial=old.last_serial+1 then return new;end if;
  raise exception 'Immutable Ramadan financial evidence'using errcode='42501';
 end if;
 if tg_table_name='ramadan_receipt_counters'then if new.last_serial<>1 then raise exception 'Invalid counter'using errcode='23514';end if;return new;end if;
 select *into r from private.ramadan_sponsorships where id=new.sponsorship_id and campaign_id=new.campaign_id;
 if r.id is null or r.status<>'submitted'then raise exception 'Eligible sponsorship required'using errcode='23514';end if;
 if tg_table_name='ramadan_slot_assignments'then
  if not exists(select 1 from private.ramadan_sponsorship_items x where x.id=new.item_id and x.sponsorship_id=r.id and x.schedule_entry_id=new.schedule_entry_id and x.mode='FIXED_SLOT')then raise exception 'Invalid fixed assignment'using errcode='23514';end if;
  new.assigned_at:=clock_timestamp();
 elsif tg_table_name='ramadan_payments'then
  select *into p from private.ramadan_payment_proofs where id=new.verified_proof_id and sponsorship_id=r.id;select *into i from private.ramadan_proof_intents where id=p.id;
  if p.status<>'submitted'or i.declared_amount_minor is distinct from r.quoted_total_minor or new.quoted_total_minor<>r.quoted_total_minor or new.verified_amount_minor<>r.quoted_total_minor or new.payment_date<>i.payment_date or new.verified_by is distinct from auth.uid()then raise exception 'Exact eligible evidence required'using errcode='23514';end if;
 elsif tg_table_name='ramadan_receipts'then
  if (new.campaign_year,new.hijri_display_label,new.public_reference,new.payer_name,new.currency,new.verified_amount_minor)is distinct from(r.campaign_year,r.hijri_display_label,r.public_reference,r.payer_name,r.currency,r.quoted_total_minor)
  or new.receipt_number<>'RAM-'||r.campaign_year::text||'-'||lpad(new.serial::text,6,'0')or new.items is distinct from private.ramadan_receipt_items(r.id)or jsonb_typeof(new.items)<>'array'or jsonb_array_length(new.items)not between 1 and 100 or octet_length(new.items::text)>1048576 or new.content_hash<>private.ramadan_proof_hash(new.items::text)then raise exception 'Invalid immutable receipt'using errcode='23514';end if;
 elsif tg_table_name='ramadan_capacity_exceptions'then
  if not exists(select 1 from private.ramadan_payment_proofs where id=new.proof_id and sponsorship_id=r.id and status='submitted')or exists(select 1 from private.ramadan_payments where sponsorship_id=r.id)then raise exception 'Invalid nonfinancial exception'using errcode='23514';end if;new.occurred_at:=clock_timestamp();
 end if;return new;
end $$;
do $$declare t text;begin foreach t in array array['ramadan_payments','ramadan_slot_assignments','ramadan_receipt_counters','ramadan_receipts','ramadan_capacity_exceptions']loop
 execute format('create trigger %I before insert or update or delete on private.%I for each row execute function private.ramadan_financial_guard()',t||'_guard',t);
 execute format('alter table private.%I enable row level security',t);
 execute format('revoke all on private.%I from public,anon,authenticated,service_role,supabase_auth_admin,authenticator,campaign_scheduler,qurban_proof_storage_worker,ramadan_proof_storage_worker',t);
end loop;end $$;
-- Deferred read-only invariant also runs after a SECURITY DEFINER API returns.
create function private.ramadan_financial_integrity()returns trigger language plpgsql security definer set search_path=''as $$
declare rid uuid;r private.ramadan_sponsorships;p private.ramadan_payments;proof private.ramadan_payment_proofs;receipt private.ramadan_receipts;begin
 rid:=new.sponsorship_id;select *into r from private.ramadan_sponsorships where id=rid;select *into p from private.ramadan_payments where sponsorship_id=rid;
 if p.id is null then if tg_table_name='ramadan_payment_proofs'and new.status<>'verified'then return null;end if;raise exception 'Verified aggregate required'using errcode='23514';end if;
 select *into proof from private.ramadan_payment_proofs where id=p.verified_proof_id;select *into receipt from private.ramadan_receipts where id=p.receipt_id;
 if r.status<>'submitted'or proof.status<>'verified'or receipt.id is null or receipt.payment_id<>p.id or receipt.verified_amount_minor<>p.verified_amount_minor or p.verified_amount_minor<>r.quoted_total_minor or receipt.payment_date<>p.payment_date or receipt.issued_at<>p.verified_at or receipt.issued_by<>p.verified_by then raise exception 'Complete verified receipt required'using errcode='23514';end if;
 if exists(select 1 from private.ramadan_sponsorship_items i where i.sponsorship_id=rid and (select count(*)from private.ramadan_slot_assignments a where a.item_id=i.id and a.payment_id=p.id)<>coalesce(i.quantity,0))
 or (select count(*)from private.ramadan_slot_assignments where sponsorship_id=rid)<>(select coalesce(sum(quantity),0)from private.ramadan_sponsorship_items where sponsorship_id=rid)
 or receipt.items is distinct from private.ramadan_receipt_items(rid)then raise exception 'Complete exact slot assignment required'using errcode='23514';end if;
 if not exists(select 1 from private.ramadan_payment_audit where sponsorship_id=rid and payment_id=p.id and receipt_id=receipt.id and action='payment.verified')or not exists(select 1 from private.ramadan_payment_audit where sponsorship_id=rid and payment_id=p.id and receipt_id=receipt.id and action='receipt.issued')then raise exception 'Required financial audit missing'using errcode='23514';end if;
 return null;
end $$;
do $$declare t text;begin foreach t in array array['ramadan_payments','ramadan_receipts','ramadan_slot_assignments','ramadan_payment_proofs']loop execute format('create constraint trigger %I after insert or update on private.%I deferrable initially deferred for each row execute function private.ramadan_financial_integrity()',t||'_integrity',t);end loop;end $$;
create function private.ramadan_review_lock(target uuid,sponsor uuid)returns private.ramadan_sponsorships language plpgsql set search_path=''as $$
declare r private.ramadan_sponsorships;begin
 perform private.require_campaign_access('manage');
 perform pg_advisory_xact_lock_shared(hashtextextended('campaign-system-flag:campaigns.enabled',0));perform pg_advisory_xact_lock_shared(hashtextextended('campaign-system-flag:ramadan.enabled',0));perform 1 from private.system_feature_flags where flag_key in('campaigns.enabled','ramadan.enabled')order by flag_key for share;
 perform pg_advisory_xact_lock(hashtextextended('ramadan:'||target::text,0));perform 1 from private.campaigns where id=target for update;
 select *into r from private.ramadan_sponsorships where id=sponsor and campaign_id=target for update;
 if r.id is null or not private.ramadan_payment_available(r.id)then raise exception 'Access denied'using errcode='42501';end if;return r;
end $$;
-- Internal-only primitive; no public/admin runtime EXECUTE. Caller owns the campaign lock.
create function private.ramadan_assign_verified_set(sponsor uuid,payment uuid,actor uuid)returns void language plpgsql set search_path=''as $$
declare i private.ramadan_sponsorship_items;slot private.ramadan_slots;allocated integer;begin
 if exists(select 1 from private.ramadan_slot_assignments where sponsorship_id=sponsor)then raise exception 'Assignment conflict'using errcode='PT409';end if;
 for i in select *from private.ramadan_sponsorship_items where sponsorship_id=sponsor and mode='FIXED_SLOT'order by schedule_entry_id,created_at,id loop
  allocated:=0;
  for slot in select s.*from private.ramadan_slots s where s.schedule_entry_id=i.schedule_entry_id and not exists(select 1 from private.ramadan_slot_assignments a where a.slot_id=s.id)order by s.slot_number limit i.quantity for update of s loop
   insert into private.ramadan_slot_assignments(campaign_id,sponsorship_id,item_id,schedule_entry_id,slot_id,payment_id,assigned_by)values(i.campaign_id,i.sponsorship_id,i.id,i.schedule_entry_id,slot.id,payment,actor);allocated:=allocated+1;
  end loop;
  if allocated<>i.quantity then raise exception 'Complete capacity required'using errcode='PT409';end if;
 end loop;
end $$;
create function private.ramadan_payment_verify(target uuid,proof uuid,pv integer,rv integer,bank_confirmed boolean)returns jsonb language plpgsql set search_path=''as $$
declare r private.ramadan_sponsorships;p private.ramadan_payment_proofs;i private.ramadan_proof_intents;pay private.ramadan_payments;rec private.ramadan_receipts;actor uuid;pid uuid:=gen_random_uuid();receipt uuid:=gen_random_uuid();stamp timestamptz;serial integer;x private.ramadan_capacity_exceptions;begin
 if pv is null or pv<1 or rv is null or rv<1 or bank_confirmed is distinct from true then raise exception 'Bank review confirmation required'using errcode='22023';end if;
 actor:=private.require_campaign_access('manage');r:=private.ramadan_review_lock(target,(select sponsorship_id from private.ramadan_payment_proofs where id=proof and campaign_id=target));
 select *into p from private.ramadan_payment_proofs where id=proof and sponsorship_id=r.id for update;
 if p.id is null or r.version<>rv then raise exception 'Refresh required'using errcode='PT409';end if;
 if p.status='verified'and pv in(p.version,p.version-1)then select *into rec from private.ramadan_receipts where sponsorship_id=r.id;return jsonb_build_object('status','verified','receipt_number',rec.receipt_number);end if;
 if p.status<>'submitted'or p.version<>pv or exists(select 1 from private.ramadan_payments where sponsorship_id=r.id)then raise exception 'Review conflict'using errcode='PT409';end if;
 select *into i from private.ramadan_proof_intents where id=p.id for share;
 if i.declared_amount_minor<>r.quoted_total_minor then raise exception 'Exact quoted amount required'using errcode='PT409';end if;
 if not exists(select 1 from storage.objects o where o.bucket_id='ramadan-payment-proofs'and o.name=i.object_key and o.metadata->>'size'=i.byte_size::text and o.metadata->>'mimetype'=i.content_type and o.user_metadata->>'sha256'=i.content_hash)then raise exception 'Proof unavailable'using errcode='PT409';end if;
 perform 1 from private.ramadan_sponsorship_items where sponsorship_id=r.id order by schedule_entry_id,created_at,id for share;
 if (select sum(line_total_minor)from private.ramadan_sponsorship_items where sponsorship_id=r.id)is distinct from r.quoted_total_minor then raise exception 'Quote conflict'using errcode='PT409';end if;
 perform 1 from private.ramadan_schedule_entries where id in(select schedule_entry_id from private.ramadan_sponsorship_items where sponsorship_id=r.id)order by id for update;
 if exists(select 1 from private.ramadan_sponsorship_items it where it.sponsorship_id=r.id and it.mode='FIXED_SLOT'group by it.schedule_entry_id having sum(it.quantity)>(select count(*)from private.ramadan_slots s where s.schedule_entry_id=it.schedule_entry_id and not exists(select 1 from private.ramadan_slot_assignments a where a.slot_id=s.id)))then
  select *into x from private.ramadan_capacity_exceptions where proof_id=p.id;
  if not found then insert into private.ramadan_capacity_exceptions(campaign_id,sponsorship_id,proof_id,actor_id)values(target,r.id,p.id,actor)returning *into x;
   insert into private.ramadan_payment_audit(campaign_id,sponsorship_id,proof_id,actor_id,action,file_count,reason,expected_version,resulting_version)values(target,r.id,p.id,actor,'payment.capacity_insufficient',1,'capacity_insufficient',1,1);
  end if;return jsonb_build_object('status','capacity_insufficient');
 end if;
 perform private.ramadan_assign_verified_set(r.id,pid,actor);stamp:=clock_timestamp();
 insert into private.ramadan_payments(id,campaign_id,sponsorship_id,verified_proof_id,quoted_total_minor,verified_amount_minor,payment_date,verified_at,verified_by,receipt_id)values(pid,target,r.id,p.id,r.quoted_total_minor,r.quoted_total_minor,i.payment_date,stamp,actor,receipt);
 insert into private.ramadan_receipt_counters(campaign_id,last_serial)values(target,1)on conflict(campaign_id)do update set last_serial=private.ramadan_receipt_counters.last_serial+1 returning last_serial into serial;
 insert into private.ramadan_receipts(id,campaign_id,sponsorship_id,payment_id,serial,receipt_number,campaign_year,campaign_title,hijri_display_label,public_reference,payer_name,currency,verified_amount_minor,payment_method,payment_date,issued_at,issued_by,items,content_hash)
 values(receipt,target,r.id,pid,serial,'RAM-'||r.campaign_year::text||'-'||lpad(serial::text,6,'0'),r.campaign_year,(select title from private.campaigns where id=target),r.hijri_display_label,r.public_reference,r.payer_name,r.currency,r.quoted_total_minor,'bank_transfer',i.payment_date,stamp,actor,private.ramadan_receipt_items(r.id),private.ramadan_proof_hash(private.ramadan_receipt_items(r.id)::text))returning *into rec;
 update private.ramadan_payment_proofs set status='verified',version=2,reviewed_at=stamp,reviewed_by=actor where id=p.id;
 insert into private.ramadan_payment_audit(campaign_id,sponsorship_id,proof_id,actor_id,action,file_count,payment_id,receipt_id,expected_version,resulting_version)select target,r.id,p.id,actor,a,1,pid,receipt,1,2 from unnest(array['payment.verified','receipt.issued'])a;
 return jsonb_build_object('status','verified','receipt_number',rec.receipt_number);
end $$;
create function private.ramadan_payment_reject(target uuid,proof uuid,pv integer,rv integer,reason text)returns jsonb language plpgsql set search_path=''as $$
declare r private.ramadan_sponsorships;p private.ramadan_payment_proofs;actor uuid;begin
 if reason is null or reason not in('jumlah_tidak_tepat','bukti_tidak_jelas','bukti_tidak_sah','bayaran_tidak_ditemui','lain_lain_operasi')or pv is null or pv<1 or rv is null or rv<1 then raise exception 'Controlled reason required'using errcode='22023';end if;
 actor:=private.require_campaign_access('manage');r:=private.ramadan_review_lock(target,(select sponsorship_id from private.ramadan_payment_proofs where id=proof and campaign_id=target));
 select *into p from private.ramadan_payment_proofs where id=proof and sponsorship_id=r.id for update;
 if p.id is null or r.version<>rv then raise exception 'Refresh required'using errcode='PT409';end if;
 if p.status='rejected'and p.rejection_reason=reason and pv in(p.version,p.version-1)then return jsonb_build_object('status','rejected');end if;
 if p.status<>'submitted'or p.version<>pv or exists(select 1 from private.ramadan_payments where sponsorship_id=r.id)then raise exception 'Review conflict'using errcode='PT409';end if;
 update private.ramadan_payment_proofs set status='rejected',version=2,reviewed_at=clock_timestamp(),reviewed_by=actor,rejection_reason=reason where id=p.id;
 insert into private.ramadan_payment_audit(campaign_id,sponsorship_id,proof_id,actor_id,action,file_count,reason,expected_version,resulting_version)values(target,r.id,p.id,actor,'payment.proof.rejected',1,reason,1,2);
 return jsonb_build_object('status','rejected');
end $$;

create or replace function private.ramadan_payment_guard() returns trigger language plpgsql set search_path='' as $$
begin
 if tg_op='DELETE' then
  if tg_table_name in('ramadan_payment_sessions','ramadan_proof_download_grants') then if old.expires_at<clock_timestamp() then return old;end if;end if;
  raise exception 'Immutable payment evidence' using errcode='42501';
 end if;
 if tg_op='UPDATE' then
  if tg_table_name='ramadan_payment_proofs' then
   perform private.require_campaign_access('manage');
   if old.status='submitted'and new.status in('verified','rejected')and old.version=1 and new.version=2 and new.reviewed_by=auth.uid()and new.reviewed_at>=old.submitted_at
   and(to_jsonb(new)-array['status','version','reviewed_at','reviewed_by','rejection_reason'])=(to_jsonb(old)-array['status','version','reviewed_at','reviewed_by','rejection_reason'])then return new;end if;
   raise exception 'Terminal immutable proof review'using errcode='42501';
  end if;
  if tg_table_name='ramadan_proof_intents' then if not exists(select 1 from private.ramadan_payment_proofs where id=old.id) and(to_jsonb(new)-'expires_at'-'object_key')=(to_jsonb(old)-'expires_at'-'object_key') and new.expires_at>=old.expires_at and new.expires_at<=clock_timestamp()+interval '15 minutes' then return new;end if;end if;
  raise exception 'Immutable payment evidence' using errcode='42501';
 end if;
 if tg_table_name='ramadan_payment_sessions' then new.created_at:=clock_timestamp();new.expires_at:=new.created_at+interval '20 minutes';
 elsif tg_table_name='ramadan_proof_download_grants' then new.created_at:=clock_timestamp();new.expires_at:=new.created_at+interval '5 minutes';
 elsif tg_table_name='ramadan_payment_audit' then new.occurred_at:=clock_timestamp();
 elsif tg_table_name='ramadan_payment_proofs' then
  if new.status<>'submitted' or new.version<>1 then raise exception 'Invalid evidence' using errcode='23514';end if;new.submitted_at:=clock_timestamp();
 else new.created_at:=clock_timestamp();if tg_table_name='ramadan_proof_intents' then new.expires_at:=new.created_at+interval '15 minutes';end if;
 end if;return new;
end $$;
create or replace function private.ramadan_proof_prepare(sponsorship uuid,p jsonb,by_admin boolean) returns jsonb language plpgsql set search_path='' as $$
declare r private.ramadan_sponsorships;i private.ramadan_proof_intents;kh text;ph text;src text;actor uuid;begin
 if not private.ramadan_proof_payload_valid(p)then raise exception 'Invalid proof' using errcode='22023';end if;
 if by_admin then actor:=private.require_campaign_access('manage');src:='admin_assisted_upload';else src:='participant_upload';end if;
 perform pg_catalog.pg_advisory_xact_lock_shared(pg_catalog.hashtextextended('campaign-system-flag:campaigns.enabled',0));
 perform pg_catalog.pg_advisory_xact_lock_shared(pg_catalog.hashtextextended('campaign-system-flag:ramadan.enabled',0));
 perform 1 from private.system_feature_flags where flag_key in('campaigns.enabled','ramadan.enabled') order by flag_key for share;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('ramadan:'||(select campaign_id::text from private.ramadan_sponsorships where id=sponsorship),0));
 perform 1 from private.campaigns where id=(select campaign_id from private.ramadan_sponsorships where id=sponsorship) for update;
 select * into r from private.ramadan_sponsorships where id=sponsorship for update;
 if r.id is null or not private.ramadan_payment_available(r.id)then raise exception 'Access denied' using errcode='42501';end if;
 if(p->>'payment_date')::date>(clock_timestamp() at time zone 'Asia/Kuala_Lumpur')::date or not isfinite((p->>'payment_date')::date)then raise exception 'Invalid proof' using errcode='22023';end if;
 kh:=private.ramadan_proof_hash(p->>'idempotency_key');ph:=private.ramadan_proof_hash(jsonb_build_object('sponsorship',r.id,'payload',p,'source',src,'actor',actor)::text);
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('ramadan-proof:'||kh,0));
 select * into i from private.ramadan_proof_intents where key_hash=kh for update;
 if found then
  if i.payload_hash<>ph or i.sponsorship_id<>r.id then raise exception 'Proof conflict' using errcode='PT409';end if;
  if exists(select 1 from private.ramadan_payment_proofs where id=i.id)then return jsonb_build_object('committed',true,'result',private.ramadan_proof_result(i.id));end if;
 else
  if exists(select 1 from private.ramadan_payment_proofs where sponsorship_id=r.id and status in('submitted','verified'))or(select count(*) from private.ramadan_proof_intents x where sponsorship_id=r.id and expires_at>clock_timestamp()and not exists(select 1 from private.ramadan_payment_proofs z where z.id=x.id))>=3 then raise exception 'Proof conflict' using errcode='PT409';end if;
  insert into private.ramadan_proof_intents(campaign_id,sponsorship_id,key_hash,payload_hash,storage_token_hash,declared_amount_minor,payment_date,content_type,extension,byte_size,content_hash,source,actor_id)
  values(r.campaign_id,r.id,kh,ph,private.ramadan_proof_hash(private.ramadan_proof_hash('ramadan-storage:'||(p->>'idempotency_key'))),(p->>'declared_amount_minor')::numeric,(p->>'payment_date')::date,p->>'content_type',p->>'extension',(p->>'byte_size')::integer,p->>'content_hash',src,actor) returning * into i;
 end if;
 if exists(select 1 from private.ramadan_payment_proofs where sponsorship_id=r.id and status in('submitted','verified'))then raise exception 'Proof conflict' using errcode='PT409';end if;
 update private.ramadan_proof_intents set expires_at=clock_timestamp()+interval '15 minutes' where id=i.id returning * into i;
 return jsonb_build_object('committed',false,'proof_id',i.id,'object_key',i.object_key,'content_type',i.content_type,'extension',i.extension,'byte_size',i.byte_size,'content_hash',i.content_hash);
exception when datetime_field_overflow or invalid_datetime_format or invalid_text_representation or check_violation then raise exception 'Invalid proof' using errcode='22023';end $$;
create or replace function private.ramadan_proof_commit(sponsorship uuid,proof uuid,by_admin boolean) returns jsonb language plpgsql set search_path='' as $$
declare r private.ramadan_sponsorships;i private.ramadan_proof_intents;o storage.objects;actor uuid;begin
 if by_admin then actor:=private.require_campaign_access('manage');end if;
 perform pg_catalog.pg_advisory_xact_lock_shared(pg_catalog.hashtextextended('campaign-system-flag:campaigns.enabled',0));perform pg_catalog.pg_advisory_xact_lock_shared(pg_catalog.hashtextextended('campaign-system-flag:ramadan.enabled',0));
 perform 1 from private.system_feature_flags where flag_key in('campaigns.enabled','ramadan.enabled') order by flag_key for share;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('ramadan:'||(select campaign_id::text from private.ramadan_sponsorships where id=sponsorship),0));
 perform 1 from private.campaigns where id=(select campaign_id from private.ramadan_sponsorships where id=sponsorship) for update;
 select * into r from private.ramadan_sponsorships where id=sponsorship for update;
 if r.id is null or not private.ramadan_payment_available(r.id)then raise exception 'Access denied' using errcode='42501';end if;
 select * into i from private.ramadan_proof_intents where id=proof and sponsorship_id=r.id for update;
 if i.id is null or i.actor_id is distinct from actor or i.source<>(case when by_admin then 'admin_assisted_upload' else 'participant_upload' end) then raise exception 'Access denied' using errcode='42501';end if;
 if exists(select 1 from private.ramadan_payment_proofs where id=i.id)then return private.ramadan_proof_result(i.id);end if;
 if i.expires_at<=clock_timestamp() or exists(select 1 from private.ramadan_payment_proofs where sponsorship_id=r.id and status in('submitted','verified'))then raise exception 'Proof conflict' using errcode='PT409';end if;
 select * into o from storage.objects where bucket_id='ramadan-payment-proofs' and name=i.object_key for share;
 if o.id is null or o.metadata->>'size' is distinct from i.byte_size::text or o.metadata->>'mimetype' is distinct from i.content_type or o.user_metadata->>'sha256' is distinct from i.content_hash then raise exception 'Proof unavailable' using errcode='PT409';end if;
 insert into private.ramadan_payment_proofs(id,campaign_id,sponsorship_id) values(i.id,i.campaign_id,i.sponsorship_id);
 insert into private.ramadan_payment_audit(campaign_id,sponsorship_id,proof_id,actor_id,action,source,file_count)values(i.campaign_id,i.sponsorship_id,i.id,actor,case when by_admin then 'payment.proof.admin_submitted' else 'payment.proof.submitted' end,i.source,1);
 return private.ramadan_proof_result(i.id);
end $$;
create or replace function private.ramadan_proof_cancellation_guard()returns trigger language plpgsql set search_path=''as $$begin
 if new.status='cancelled'and old.status is distinct from new.status then
  if exists(select 1 from private.ramadan_payments where sponsorship_id=old.id)then raise exception 'Bayaran telah disahkan. Gunakan proses kewangan yang berasingan.'using errcode='PT409';end if;
  if exists(select 1 from private.ramadan_payment_proofs where sponsorship_id=old.id and status='submitted')then raise exception 'Bukti bayaran telah dihantar. Selesaikan semakan bayaran terlebih dahulu.'using errcode='PT409';end if;
 end if;return new;end $$;
create function private.ramadan_receipt_payload(sponsor uuid)returns jsonb language sql stable set search_path=''as $$
 select jsonb_build_object('receipt_number',receipt_number,'campaign_year',campaign_year,'campaign_title',campaign_title,'hijri_display_label',hijri_display_label,'reference',public_reference,'payer_name',payer_name,'currency',currency,'amount_minor',verified_amount_minor,'payment_method',payment_method,'payment_date',payment_date,'issued_at',issued_at,'items',items)from private.ramadan_receipts where sponsorship_id=sponsor
$$;
create or replace function private.ramadan_payment_context(slug text,secret text)returns jsonb language plpgsql set search_path=''as $$
declare rid uuid;p private.ramadan_payment_proofs;rec private.ramadan_receipts;begin
 rid:=private.ramadan_payment_session_sponsorship(slug,secret);if rid is null then return null;end if;
 select *into p from private.ramadan_payment_proofs where sponsorship_id=rid order by submitted_at desc,id desc limit 1;select *into rec from private.ramadan_receipts where sponsorship_id=rid;
 return private.ramadan_submission_result(rid)||jsonb_build_object('proof_status',coalesce(p.status,'none'),'rejection_reason',p.rejection_reason,'action_required',coalesce(p.status='submitted'and exists(select 1 from private.ramadan_capacity_exceptions where proof_id=p.id),false),
 'receipt',case when rec.id is null then null else jsonb_build_object('receipt_number',rec.receipt_number,'amount_minor',rec.verified_amount_minor,'payment_date',rec.payment_date,'issued_at',rec.issued_at,'items',(select jsonb_agg(x-'item_id')from jsonb_array_elements(rec.items)x))end);
end $$;
create function private.ramadan_payment_review(target uuid,sponsor uuid,page_number integer)returns jsonb language plpgsql set search_path=''as $$
declare p private.ramadan_payment_proofs;i private.ramadan_proof_intents;r private.ramadan_sponsorships;rec private.ramadan_receipts;history jsonb;capacity jsonb;begin
 perform private.ramadan_admin_campaign(target,false);select *into r from private.ramadan_sponsorships where id=sponsor and campaign_id=target;if r.id is null then return null;end if;
 select *into p from private.ramadan_payment_proofs where sponsorship_id=r.id order by submitted_at desc,id desc limit 1;
 if private.active_role()='staff'then return jsonb_build_object('proof_status',coalesce(p.status,'none'));end if;
 if page_number is null or page_number not between 1 and 10000 then raise exception 'Invalid page'using errcode='22023';end if;
 select *into i from private.ramadan_proof_intents where id=p.id;select *into rec from private.ramadan_receipts where sponsorship_id=r.id;
 select coalesce(jsonb_agg(jsonb_build_object('id',h.id,'reference',pi.proof_reference,'status',h.status,'version',h.version,'declared_amount_minor',pi.declared_amount_minor,'payment_date',pi.payment_date,'source',pi.source,'submitted_at',h.submitted_at,'rejection_reason',h.rejection_reason,'reviewed_at',h.reviewed_at)order by h.submitted_at desc,h.id desc),'[]'::jsonb)into history from(select *from private.ramadan_payment_proofs where sponsorship_id=r.id order by submitted_at desc,id desc limit 20 offset(page_number-1)*20)h join private.ramadan_proof_intents pi on pi.id=h.id;
 select coalesce(jsonb_agg(v order by v->>'service_date',v->>'schedule_id'),'[]'::jsonb)into capacity from(select jsonb_build_object('schedule_id',s.id,'offering_name',min(it.accepted_offering_name),'service_date',s.service_date,'ramadan_day_number',s.ramadan_day_number,'requested',sum(it.quantity),'available',(select count(*)from private.ramadan_slots sl where sl.schedule_entry_id=s.id and not exists(select 1 from private.ramadan_slot_assignments a where a.slot_id=sl.id)))v from private.ramadan_sponsorship_items it join private.ramadan_schedule_entries s on s.id=it.schedule_entry_id where it.sponsorship_id=r.id group by s.id)schedules;
 return jsonb_build_object('proof_status',coalesce(p.status,'none'),'sponsorship_version',r.version,'sponsorship_status',r.status,'history',history,'history_page',page_number,'history_total',(select count(*)from private.ramadan_payment_proofs where sponsorship_id=r.id),'capacity',capacity,'action_required',coalesce(p.status='submitted'and exists(select 1 from private.ramadan_capacity_exceptions where proof_id=p.id),false),
 'proof',case when p.id is null then null else jsonb_build_object('id',i.id,'reference',i.proof_reference,'declared_amount_minor',i.declared_amount_minor,'payment_date',i.payment_date,'source',i.source,'submitted_at',p.submitted_at,'submitted_by_actor',i.actor_id,'content_type',i.content_type,'byte_size',i.byte_size,'amount_mismatch',i.declared_amount_minor<>r.quoted_total_minor,'version',p.version,'rejection_reason',p.rejection_reason,'reviewed_at',p.reviewed_at)end,
 'receipt',case when rec.id is null then null else jsonb_build_object('receipt_number',rec.receipt_number,'amount_minor',rec.verified_amount_minor,'issued_at',rec.issued_at)end);
end $$;
create or replace function private.ramadan_proof_detail(target uuid,sponsor uuid)returns jsonb language sql set search_path=''as $$select private.ramadan_payment_review(target,sponsor,1)$$;
create function private.ramadan_receipt_access(sponsor uuid,actor uuid)returns jsonb language plpgsql set search_path=''as $$
declare rec private.ramadan_receipts;p private.ramadan_payments;begin
 select *into rec from private.ramadan_receipts where sponsorship_id=sponsor;if rec.id is null then return null;end if;select *into p from private.ramadan_payments where id=rec.payment_id;
 insert into private.ramadan_payment_audit(campaign_id,sponsorship_id,proof_id,actor_id,action,file_count,payment_id,receipt_id)values(rec.campaign_id,sponsor,p.verified_proof_id,actor,'receipt.downloaded',1,p.id,rec.id);
 return private.ramadan_receipt_payload(sponsor);
end $$;
create function public.admin_ramadan_payment_verify(target_campaign uuid,target_proof uuid,expected_proof_version integer,expected_sponsorship_version integer,bank_payment_confirmed boolean)returns jsonb language sql security definer set search_path=''as $$select private.ramadan_payment_verify(target_campaign,target_proof,expected_proof_version,expected_sponsorship_version,bank_payment_confirmed)$$;
create function public.admin_ramadan_payment_reject(target_campaign uuid,target_proof uuid,expected_proof_version integer,expected_sponsorship_version integer,rejection_reason text)returns jsonb language sql security definer set search_path=''as $$select private.ramadan_payment_reject(target_campaign,target_proof,expected_proof_version,expected_sponsorship_version,rejection_reason)$$;
create function public.admin_ramadan_payment_review(target_campaign uuid,target_sponsorship uuid,page_number integer)returns jsonb language sql security definer set search_path=''as $$select private.ramadan_payment_review(target_campaign,target_sponsorship,page_number)$$;
create function public.admin_ramadan_receipt(target_campaign uuid,target_sponsorship uuid)returns jsonb language plpgsql security definer set search_path=''as $$begin
 perform private.ramadan_admin_campaign(target_campaign,true);if not exists(select 1 from private.ramadan_sponsorships where id=target_sponsorship and campaign_id=target_campaign)then return null;end if;return private.ramadan_receipt_access(target_sponsorship,auth.uid());end $$;
create function public.public_ramadan_receipt(target_slug text,session_secret text)returns jsonb language plpgsql security definer set search_path=''as $$declare rid uuid;begin rid:=private.ramadan_payment_session_sponsorship(target_slug,session_secret);if rid is null then return null;end if;return private.ramadan_receipt_access(rid,null);end $$;
-- Fail closed ACLs for every new helper and wrapper, preserving only the reviewed Storage predicate grant.
do $$declare fn record;begin for fn in select p.oid,n.nspname,p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where(n.nspname='private'and p.proname like 'ramadan_%')or(n.nspname='public'and p.proname in('admin_ramadan_payment_verify','admin_ramadan_payment_reject','admin_ramadan_payment_review','admin_ramadan_receipt','public_ramadan_receipt'))loop
 execute format('revoke all on function %s from public,anon,authenticated,service_role,supabase_auth_admin,authenticator,campaign_scheduler,qurban_proof_storage_worker,ramadan_proof_storage_worker',fn.oid::regprocedure);
end loop;end $$;
grant execute on function private.ramadan_storage_authorized(text,text,boolean)to ramadan_proof_storage_worker;
grant execute on function public.admin_ramadan_payment_verify(uuid,uuid,integer,integer,boolean),public.admin_ramadan_payment_reject(uuid,uuid,integer,integer,text),public.admin_ramadan_payment_review(uuid,uuid,integer),public.admin_ramadan_receipt(uuid,uuid)to authenticated;
grant execute on function public.public_ramadan_receipt(text,text)to anon,authenticated;
create function private.ramadan_initial_sponsor_pages(context jsonb)returns jsonb language sql stable set search_path=''as $$
 with schedules as(select x->>'id' id from jsonb_array_elements(context->'schedules')x),
 fixed as(select 'schedule:'||s.id key,sl.slot_number,case when p.id is not null then case when r.public_display_mode='anonymous'then 'Hamba Allah'else r.public_display_name end end display_name,sl.slot_number::bigint ordinal
 from schedules s join private.ramadan_slots sl on sl.schedule_entry_id=s.id::uuid
 left join private.ramadan_slot_assignments a on a.slot_id=sl.id left join private.ramadan_payments p on p.id=a.payment_id left join private.ramadan_sponsorships r on r.id=p.sponsorship_id where sl.slot_number<=21),
 donors as(select distinct o->>'id' offering,p.id,p.verified_at,case when r.public_display_mode='anonymous'then 'Hamba Allah'else r.public_display_name end display_name
 from jsonb_array_elements(context->'offerings')o join private.ramadan_sponsorship_items it on it.offering_id=(o->>'id')::uuid
 join private.ramadan_payments p on p.sponsorship_id=it.sponsorship_id join private.ramadan_sponsorships r on r.id=p.sponsorship_id where o->>'mode'='OPEN_AMOUNT'and it.mode='OPEN_AMOUNT'),
 ranked as(select 'offering:'||offering key,null::integer slot_number,display_name,row_number()over(partition by offering order by verified_at,id)ordinal from donors),
 pages as(select key,jsonb_build_object('rows',jsonb_agg(jsonb_build_object('slot_number',slot_number,'display_name',display_name)order by ordinal)filter(where ordinal<=20),'page',1,'has_more',max(ordinal)>20)payload from(select *from fixed union all select *from ranked where ordinal<=21)r group by key)
 select coalesce(jsonb_object_agg(key,payload),'{}'::jsonb)from pages
$$;
revoke all on function private.ramadan_initial_sponsor_pages(jsonb)from public,anon,authenticated,service_role,supabase_auth_admin,authenticator,campaign_scheduler,qurban_proof_storage_worker,ramadan_proof_storage_worker;
create or replace function private.ramadan_public_context(slug text)returns jsonb language plpgsql set search_path='' as $$
declare c private.campaigns;g private.system_feature_flags;m private.system_feature_flags;v jsonb;pages jsonb;begin
 if slug is null or length(slug)>100 or slug!~'^[a-z0-9]+(-[a-z0-9]+)*$'then return null;end if;
 select *into c from private.campaigns where campaigns.slug=ramadan_public_context.slug;
 select *into g from private.system_feature_flags where flag_key='campaigns.enabled';select *into m from private.system_feature_flags where flag_key='ramadan.enabled';
 if c.id is null or c.type_key<>'ramadan'or c.config_version<>1 or c.visibility not in('public','unlisted')or not private.ramadan_config_v1_valid(c.configuration)
 or not coalesce(g.enabled,false)or not coalesce(m.enabled,false)or not private.campaign_registration_window_available(c.status,c.registration_opens_at,c.registration_closes_at,clock_timestamp())
 or not exists(select 1 from private.campaign_type_descriptors where type_key='ramadan'and config_version=1 and module_flag_key='ramadan.enabled'and validator_name='ramadan_config_v1_valid')then return null;end if;
 select snapshot.base,private.ramadan_initial_sponsor_pages(snapshot.base)into v,pages from(select jsonb_build_object('slug',c.slug,'title',c.title,'campaign_year',c.configuration->'campaign_year','hijri_display_label',c.configuration->'hijri_display_label','currency','MYR','campaign_version',c.version,'global_flag_version',g.version,'module_flag_version',m.version,'registration_closes_at',c.registration_closes_at,
 'offerings',coalesce((select jsonb_agg(jsonb_build_object('id',o.id,'name',o.name,'mode',o.mode,'version',o.version,'accepting_new',o.active)order by o.display_order,o.id)from private.ramadan_offerings o where o.campaign_id=c.id and(o.active or exists(select 1 from private.ramadan_sponsorship_items it join private.ramadan_payments p on p.sponsorship_id=it.sponsorship_id where it.offering_id=o.id))),'[]'::jsonb),
 'schedules',coalesce((select jsonb_agg(jsonb_build_object('id',s.id,'offering_id',s.offering_id,'version',s.version,'ramadan_day_number',s.ramadan_day_number,'service_date',s.service_date,'unit_price_minor',s.unit_price_minor,'slot_count',s.slot_count,'confirmed_occupied',(select count(*)from private.ramadan_slot_assignments a join private.ramadan_payments p on p.id=a.payment_id where a.schedule_entry_id=s.id),'available',s.slot_count-(select count(*)from private.ramadan_slot_assignments a join private.ramadan_payments p on p.id=a.payment_id where a.schedule_entry_id=s.id),'accepting_new',s.active and o.active)order by s.service_date,o.display_order,s.id)from private.ramadan_schedule_entries s join private.ramadan_offerings o on o.id=s.offering_id where s.campaign_id=c.id and((s.active and o.active)or exists(select 1 from private.ramadan_slot_assignments a where a.schedule_entry_id=s.id))),'[]'::jsonb))base)snapshot;
 if jsonb_array_length(v->'offerings')>100 or jsonb_array_length(v->'schedules')>500 or octet_length(v::text)>262144 then return null;end if;

 -- At most 500 schedule pages + 100 open-offering pages, each capped at 20 rows.
 if octet_length(pages::text)>12582912 then return null;end if;
 return v||jsonb_build_object('context_token',encode(sha256(convert_to(v::text,'UTF8')),'hex'),'sponsor_pages',pages);
end $$;
create function private.ramadan_confirmed_sponsors(slug text,offering uuid,schedule uuid,page_number integer)returns jsonb language plpgsql set search_path=''as $$
declare c jsonb;mode text;result jsonb;begin
 c:=private.ramadan_public_context(slug);if c is null then return null;end if;
 if page_number is null or page_number not between 1 and 5000 then return null;end if;
 select x->>'mode'into mode from jsonb_array_elements(c->'offerings')x where x->>'id'=offering::text;if mode is null then return null;end if;
 if mode='FIXED_SLOT'then
  if schedule is null or not exists(select 1 from jsonb_array_elements(c->'schedules')x where x->>'id'=schedule::text and x->>'offering_id'=offering::text)then return null;end if;
  select coalesce(jsonb_agg(jsonb_build_object('slot_number',v.slot_number,'display_name',v.display_name)order by v.slot_number),'[]'::jsonb)into result from(select sl.slot_number,case when p.id is not null then case when r.public_display_mode='anonymous'then 'Hamba Allah'else r.public_display_name end end display_name from private.ramadan_slots sl left join private.ramadan_slot_assignments a on a.slot_id=sl.id left join private.ramadan_payments p on p.id=a.payment_id left join private.ramadan_sponsorships r on r.id=p.sponsorship_id where sl.schedule_entry_id=schedule order by sl.slot_number limit 21 offset(page_number-1)*20)v;
 else
  if schedule is not null then return null;end if;
  select coalesce(jsonb_agg(jsonb_build_object('slot_number',null,'display_name',v.display_name)order by v.verified_at,v.id),'[]'::jsonb)into result from(select p.verified_at,p.id,case when r.public_display_mode='anonymous'then 'Hamba Allah'else r.public_display_name end display_name from private.ramadan_payments p join private.ramadan_sponsorships r on r.id=p.sponsorship_id where exists(select 1 from private.ramadan_sponsorship_items it where it.sponsorship_id=r.id and it.offering_id=offering and it.mode='OPEN_AMOUNT')order by p.verified_at,p.id limit 21 offset(page_number-1)*20)v;
 end if;
 return jsonb_build_object('rows',(select coalesce(jsonb_agg(x),'[]'::jsonb)from(select value x from jsonb_array_elements(result)limit 20)t),'page',page_number,'has_more',jsonb_array_length(result)>20);
end $$;
create function public.public_ramadan_confirmed_sponsors(target_slug text,target_offering uuid,target_schedule uuid,page_number integer)returns jsonb language sql security definer set search_path=''as $$select private.ramadan_confirmed_sponsors(target_slug,target_offering,target_schedule,page_number)$$;
revoke all on function private.ramadan_confirmed_sponsors(text,uuid,uuid,integer),public.public_ramadan_confirmed_sponsors(text,uuid,uuid,integer)from public,anon,authenticated,service_role,supabase_auth_admin,authenticator,campaign_scheduler,qurban_proof_storage_worker,ramadan_proof_storage_worker;
grant execute on function public.public_ramadan_confirmed_sponsors(text,uuid,uuid,integer)to anon,authenticated;
commit;

-- Existing bounded admin grid now reflects verified occupancy only. No payer projection.
create or replace function private.ramadan_admin_workspace(target uuid)returns jsonb language plpgsql set search_path='' as $$
declare c private.campaigns;begin c:=private.ramadan_admin_campaign(target,false);if(select count(*)from private.ramadan_offerings where campaign_id=target)>100 or(select count(*)from private.ramadan_schedule_entries where campaign_id=target)>500 then raise exception 'Workspace bound exceeded'using errcode='22023';end if;
 return jsonb_build_object('id',c.id,'title',c.title,'can_manage',private.active_role()in('admin','super_admin'),'offerings',coalesce((select jsonb_agg(to_jsonb(o)||jsonb_build_object('has_activity',exists(select 1 from private.ramadan_sponsorship_items i where i.offering_id=o.id),'has_references',exists(select 1 from private.ramadan_schedule_entries s where s.offering_id=o.id)or exists(select 1 from private.ramadan_sponsorship_items i where i.offering_id=o.id))order by o.display_order,o.id)from private.ramadan_offerings o where campaign_id=target),'[]'::jsonb),'schedules',coalesce((select jsonb_agg(to_jsonb(s)||jsonb_build_object('has_activity',exists(select 1 from private.ramadan_sponsorship_items i where i.schedule_entry_id=s.id),'confirmed_occupied',(select count(*)from private.ramadan_slot_assignments a join private.ramadan_payments p on p.id=a.payment_id where a.schedule_entry_id=s.id),'available',s.slot_count-(select count(*)from private.ramadan_slot_assignments a join private.ramadan_payments p on p.id=a.payment_id where a.schedule_entry_id=s.id))order by s.service_date,s.id)from private.ramadan_schedule_entries s where campaign_id=target),'[]'::jsonb));
end $$;
create or replace function private.ramadan_admin_slots(target uuid,schedule uuid)returns jsonb language plpgsql set search_path='' as $$
begin perform private.ramadan_admin_campaign(target,false);return coalesce((select jsonb_agg(jsonb_build_object('slot_number',sl.slot_number,'occupied',exists(select 1 from private.ramadan_slot_assignments a join private.ramadan_payments p on p.id=a.payment_id where a.slot_id=sl.id))order by sl.slot_number)from private.ramadan_slots sl where sl.campaign_id=target and sl.schedule_entry_id=schedule),'[]'::jsonb);end $$;

commit;
