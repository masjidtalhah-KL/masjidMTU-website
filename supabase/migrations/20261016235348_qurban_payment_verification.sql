begin;
-- Fasa 9.1: no Storage policy/credential changes, no runtime initial allocator grant.
alter table private.qurban_payment_proofs drop constraint qurban_payment_proofs_status_check;
alter table private.qurban_payment_proofs drop constraint qurban_payment_proofs_version_check;
alter table private.qurban_payment_proofs add column reviewed_by uuid references auth.users(id) on delete restrict;
alter table private.qurban_payment_proofs add column reviewed_at timestamptz;
alter table private.qurban_payment_proofs add column rejection_reason text;
alter table private.qurban_payment_proofs add constraint qurban_proof_lifecycle check(
 (status='submitted' and version=1 and reviewed_by is null and reviewed_at is null and rejection_reason is null)
 or(status in('rejected','verified') and version=2 and reviewed_by is not null and reviewed_at is not null
 and ((status='verified' and rejection_reason is null) or(status='rejected' and rejection_reason is not null and rejection_reason in('jumlah_tidak_tepat','bukti_tidak_jelas','bukti_tidak_sah','bayaran_tidak_ditemui','lain_lain_operasi')))));
create table private.qurban_receipt_counters(
 campaign_id uuid primary key references private.campaigns(id) on delete restrict,
 last_number integer not null check(last_number between 1 and 999999)
);
create table private.qurban_payments(
 id uuid primary key default gen_random_uuid(),campaign_id uuid not null,registration_id uuid not null unique,
 verified_proof_id uuid not null unique,receipt_id uuid not null unique,
 quoted_total_minor bigint not null check(quoted_total_minor between 1 and 100000000000),
 verified_amount_minor bigint not null check(verified_amount_minor=quoted_total_minor),
 payment_date date not null check(isfinite(payment_date)),verified_at timestamptz not null default clock_timestamp(),
 verified_by_actor uuid not null references auth.users(id) on delete restrict,
 unique(id,registration_id,campaign_id),foreign key(registration_id,campaign_id) references private.qurban_registrations(id,campaign_id) on delete restrict,
 foreign key(verified_proof_id,registration_id,campaign_id) references private.qurban_payment_proofs(id,registration_id,campaign_id) on delete restrict
);
create function private.qurban_receipt_participants_valid(p jsonb) returns boolean language plpgsql immutable set search_path='' as $$
declare e jsonb;begin
 if jsonb_typeof(p) is distinct from 'array' or jsonb_array_length(p) not between 1 and 100 or octet_length(p::text)>65536 then return false;end if;
 for e in select value from jsonb_array_elements(p) loop
  if jsonb_typeof(e) is distinct from 'object' or not e?&array['participation_id','participant_name','purpose','cattle_number','slot_number'] or(select count(*) from jsonb_object_keys(e))<>5
  or jsonb_typeof(e->'participation_id')<>'string' or e->>'participation_id'!~'^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$'
  or jsonb_typeof(e->'participant_name')<>'string' or not private.qurban_text_valid(e->>'participant_name',1,160)
  or jsonb_typeof(e->'purpose')<>'string' or e->>'purpose' not in('qurban','aqiqah')
  or jsonb_typeof(e->'cattle_number')<>'number' or e->>'cattle_number'!~'^[1-9][0-9]{0,4}$'
  or jsonb_typeof(e->'slot_number')<>'number' or e->>'slot_number'!~'^[1-9][0-9]{0,3}$' then return false;end if;
 end loop;
 return(select count(distinct value->>'participation_id')=jsonb_array_length(p) and count(distinct(value->>'cattle_number',value->>'slot_number'))=jsonb_array_length(p) from jsonb_array_elements(p));
end $$;
create table private.qurban_receipts(
 id uuid primary key,campaign_id uuid not null,registration_id uuid not null unique,payment_id uuid not null unique,
 receipt_number text not null,sequence_number integer not null check(sequence_number between 1 and 999999),
 campaign_year integer not null check(campaign_year between 1900 and 9999),
 campaign_title text not null check(private.qurban_text_valid(campaign_title,1,180)),
 public_reference text not null check(public_reference~'^QBN-[0-9a-f]{64}$'),
 applicant_name text not null check(private.qurban_text_valid(applicant_name,1,160)),
 price_per_share_minor bigint not null check(price_per_share_minor between 1 and 1000000000),
 currency text not null check(currency='MYR'),amount_minor bigint not null check(amount_minor between 1 and 100000000000),
 payment_method text not null check(payment_method='bank_transfer'),payment_date date not null check(isfinite(payment_date)),
 issued_at timestamptz not null,participants jsonb not null check(private.qurban_receipt_participants_valid(participants)),
 content_hash text generated always as(private.qurban_proof_hash(participants::text)) stored,
 unique(campaign_id,receipt_number),unique(campaign_id,sequence_number),unique(id,registration_id,campaign_id),
 check(amount_minor=price_per_share_minor*jsonb_array_length(participants)),
 check(receipt_number='QUR-'||campaign_year::text||'-'||lpad(sequence_number::text,6,'0')),
 foreign key(registration_id,campaign_id) references private.qurban_registrations(id,campaign_id) on delete restrict,
 foreign key(payment_id,registration_id,campaign_id) references private.qurban_payments(id,registration_id,campaign_id) deferrable initially deferred
);
alter table private.qurban_payments add constraint qurban_payment_receipt_fk foreign key(receipt_id,registration_id,campaign_id) references private.qurban_receipts(id,registration_id,campaign_id) deferrable initially deferred;
create index qurban_payments_campaign on private.qurban_payments(campaign_id,verified_at,id);
create index qurban_receipts_campaign on private.qurban_receipts(campaign_id,issued_at,id);
create function private.qurban_financial_guard() returns trigger language plpgsql set search_path='' as $$
declare r private.qurban_registrations;i private.qurban_proof_intents;snapshot jsonb;begin
 if tg_table_name='qurban_receipt_counters' then
  if tg_op='DELETE' or(tg_op='UPDATE' and(new.campaign_id<>old.campaign_id or new.last_number<>old.last_number+1)) or(tg_op='INSERT' and new.last_number<>1)then raise exception 'Immutable receipt numbering' using errcode='42501';end if;
  perform private.require_campaign_access('manage');return new;
 end if;
 if tg_op<>'INSERT' then raise exception 'Immutable financial evidence' using errcode='42501';end if;
 perform private.require_campaign_access('manage');
 select * into r from private.qurban_registrations where id=new.registration_id and campaign_id=new.campaign_id;
 if r.id is null or r.status<>'submitted' then raise exception 'Financial ownership conflict' using errcode='23514';end if;
 if tg_table_name='qurban_payments' then
  select i0.* into i from private.qurban_proof_intents i0 join private.qurban_payment_proofs p on p.id=i0.id where p.id=new.verified_proof_id and p.status='submitted' and p.registration_id=r.id;
  if i.id is null or new.verified_by_actor is distinct from auth.uid() or i.declared_amount_minor<>r.quoted_total_minor or new.quoted_total_minor<>r.quoted_total_minor or new.verified_amount_minor<>i.declared_amount_minor or new.payment_date<>i.payment_date then raise exception 'Exact payment required' using errcode='23514';end if;
  new.verified_at:=clock_timestamp();
 else
  if new.public_reference<>r.public_reference or new.applicant_name<>r.applicant_name or new.currency<>r.quoted_currency or new.price_per_share_minor<>r.quoted_price_per_share_minor or new.amount_minor<>r.quoted_total_minor or new.campaign_year<>(r.submission_configuration->>'campaign_year')::integer then raise exception 'Invalid receipt evidence' using errcode='23514';end if;
  select jsonb_agg(jsonb_build_object('participation_id',p.id,'participant_name',p.participant_name,'purpose',p.purpose,'cattle_number',k.display_number,'slot_number',s.slot_number)order by p.created_at,p.id) into snapshot
   from private.qurban_participations p join private.qurban_allocations a on a.participation_id=p.id join private.qurban_cattle_slots s on s.id=a.slot_id join private.qurban_cattle k on k.id=s.cattle_id where p.registration_id=r.id;
  if new.participants is distinct from snapshot or jsonb_array_length(snapshot) is distinct from r.quoted_participation_count then raise exception 'Incomplete receipt allocation' using errcode='23514';end if;
 end if;return new;
end $$;
do $$declare t text;begin foreach t in array array['qurban_payments','qurban_receipts','qurban_receipt_counters']loop
 execute format('create trigger %I before insert or update or delete on private.%I for each row execute function private.qurban_financial_guard()',t||'_guard',t);
 execute format('alter table private.%I enable row level security',t);
 execute format('revoke all on private.%I from public,anon,authenticated,service_role,supabase_auth_admin,authenticator,campaign_scheduler,qurban_proof_storage_worker',t);
 end loop;end $$;
create function private.qurban_financial_commit_guard() returns trigger language plpgsql security definer set search_path='' as $$
declare rid uuid;pay private.qurban_payments;rec private.qurban_receipts;p private.qurban_payment_proofs;r private.qurban_registrations;begin
 rid:=new.registration_id;select * into pay from private.qurban_payments where registration_id=rid;
 if pay.id is null then
  if tg_table_name<>'qurban_payment_proofs' or new.status='verified' then raise exception 'Verified payment required' using errcode='23514';end if;return null;
 end if;
 select * into rec from private.qurban_receipts where id=pay.receipt_id;
 select * into p from private.qurban_payment_proofs where id=pay.verified_proof_id;
 select * into r from private.qurban_registrations where id=rid;
 if rec.id is null or rec.payment_id<>pay.id or rec.registration_id<>rid or p.status<>'verified' or p.reviewed_by<>pay.verified_by_actor
 or rec.amount_minor<>pay.verified_amount_minor or rec.payment_date<>pay.payment_date or rec.issued_at<>pay.verified_at
 or r.status<>'submitted' or pay.quoted_total_minor<>r.quoted_total_minor
 or(select count(*) from private.qurban_allocations where registration_id=rid)<>r.quoted_participation_count
 or(select count(*) from private.qurban_participations where registration_id=rid)<>r.quoted_participation_count
 or jsonb_array_length(rec.participants)<>r.quoted_participation_count then raise exception 'Incomplete atomic verification' using errcode='23514';end if;return null;
end $$;
create constraint trigger qurban_payment_commit_guard after insert on private.qurban_payments deferrable initially deferred for each row execute function private.qurban_financial_commit_guard();
create constraint trigger qurban_receipt_commit_guard after insert on private.qurban_receipts deferrable initially deferred for each row execute function private.qurban_financial_commit_guard();
create constraint trigger qurban_proof_commit_guard after insert or update on private.qurban_payment_proofs deferrable initially deferred for each row execute function private.qurban_financial_commit_guard();
-- Keep all existing evidence guards; only the explicitly reviewed proof terminal transition is added.
create function private.qurban_proof_review_guard() returns trigger language plpgsql set search_path='' as $$
begin
 if tg_op='DELETE' then raise exception 'Immutable proof history' using errcode='42501';end if;
 if tg_op='INSERT' then
  if new.status<>'submitted' or new.version<>1 or new.reviewed_by is not null or new.reviewed_at is not null or new.rejection_reason is not null then raise exception 'Invalid proof state' using errcode='23514';end if;
  new.submitted_at:=clock_timestamp();return new;
 end if;
 perform private.require_campaign_access('manage');
 if old.status<>'submitted' or new.status not in('rejected','verified') or
 (to_jsonb(new)-array['status','version','reviewed_by','reviewed_at','rejection_reason']) is distinct from(to_jsonb(old)-array['status','version','reviewed_by','reviewed_at','rejection_reason'])
 then raise exception 'Immutable proof history' using errcode='42501';end if;
 new.version:=old.version+1;new.reviewed_by:=auth.uid();new.reviewed_at:=clock_timestamp();return new;
end $$;
drop trigger qurban_payment_proofs_guard on private.qurban_payment_proofs;
create trigger qurban_payment_proofs_guard before insert or update or delete on private.qurban_payment_proofs for each row execute function private.qurban_proof_review_guard();
-- Extend minimized domain audit without changing generic Campaign audit.
alter table private.qurban_payment_audit add column payment_id uuid;
alter table private.qurban_payment_audit add column receipt_id uuid;
alter table private.qurban_payment_audit add column rejection_reason text;
alter table private.qurban_payment_audit add column expected_version integer;
alter table private.qurban_payment_audit add column resulting_version integer;
do $$declare k record;begin for k in select conname from pg_constraint where conrelid='private.qurban_payment_audit'::regclass and contype='c' and pg_get_constraintdef(oid) like '%action%'loop execute format('alter table private.qurban_payment_audit drop constraint %I',k.conname);end loop;end $$;
alter table private.qurban_payment_audit add constraint qurban_payment_audit_events check(coalesce((
 (action='payment.proof.submitted' and actor_id is null and source='participant_upload' and proof_id is not null and file_count=1)
 or(action='payment.proof.admin_submitted' and actor_id is not null and source='admin_assisted_upload' and proof_id is not null and file_count=1)
 or(action='payment.proof.downloaded' and actor_id is not null and source is null and proof_id is not null and file_count=1)
 or(action='payment.proof.bulk_downloaded' and actor_id is not null and source is null and proof_id is null)
 or(action='payment.proof.rejected' and actor_id is not null and source is null and proof_id is not null and payment_id is null and receipt_id is null and expected_version=1 and resulting_version=2 and rejection_reason in('jumlah_tidak_tepat','bukti_tidak_jelas','bukti_tidak_sah','bayaran_tidak_ditemui','lain_lain_operasi'))
 or(action in('payment.verified','receipt.issued') and actor_id is not null and source is null and proof_id is not null and payment_id is not null and receipt_id is not null and rejection_reason is null and expected_version=1 and resulting_version=2)
 or(action='receipt.downloaded' and source is null and proof_id is not null and payment_id is not null and receipt_id is not null and rejection_reason is null)),false));
alter table private.qurban_payment_audit add constraint qurban_audit_payment_fk foreign key(payment_id,registration_id,campaign_id) references private.qurban_payments(id,registration_id,campaign_id) on delete restrict;
alter table private.qurban_payment_audit add constraint qurban_audit_receipt_fk foreign key(receipt_id,registration_id,campaign_id) references private.qurban_receipts(id,registration_id,campaign_id) on delete restrict;
create unique index qurban_payment_review_audit on private.qurban_payment_audit(proof_id,action) where action in('payment.proof.rejected','payment.verified','receipt.issued');
create function private.qurban_payment_review(target uuid,proof uuid,expected_proof integer,expected_registration integer,decision text,reason text) returns jsonb language plpgsql set search_path='' as $$
declare c private.campaigns;r private.qurban_registrations;p private.qurban_payment_proofs;i private.qurban_proof_intents;pay private.qurban_payments;rec private.qurban_receipts;pid uuid:=gen_random_uuid();rid uuid:=gen_random_uuid();pids uuid[];snap jsonb;serial integer;begin
 perform private.require_campaign_access('manage');
 if expected_proof is null or expected_proof<1 or expected_registration is null or expected_registration<1 or decision not in('verify','reject')
 or(decision='verify' and reason is not null)or(decision='reject' and(reason is null or reason not in('jumlah_tidak_tepat','bukti_tidak_jelas','bukti_tidak_sah','bayaran_tidak_ditemui','lain_lain_operasi')))then raise exception 'Invalid review' using errcode='22023';end if;
 perform pg_catalog.pg_advisory_xact_lock_shared(pg_catalog.hashtextextended('campaign-system-flag:campaigns.enabled',0));
 perform pg_catalog.pg_advisory_xact_lock_shared(pg_catalog.hashtextextended('campaign-system-flag:qurban.enabled',0));
 perform 1 from private.system_feature_flags where flag_key in('campaigns.enabled','qurban.enabled')order by flag_key for share;
 select * into c from private.campaigns where id=target for update;
 select r0.* into r from private.qurban_registrations r0 join private.qurban_payment_proofs p0 on p0.registration_id=r0.id where p0.id=proof and p0.campaign_id=target for update of r0;
 if r.id is null or not private.qurban_payment_available(r.id) then raise exception 'Access denied' using errcode='42501';end if;
 select * into p from private.qurban_payment_proofs where id=proof and campaign_id=target for update;
 if p.status<>'submitted' or p.version<>expected_proof or r.version<>expected_registration or exists(select 1 from private.qurban_payments where registration_id=r.id)then raise exception 'Refresh payment review' using errcode='PT409';end if;
 if decision='reject' then
  update private.qurban_payment_proofs set status='rejected',rejection_reason=reason where id=p.id;
  insert into private.qurban_payment_audit(campaign_id,registration_id,proof_id,actor_id,action,file_count,rejection_reason,expected_version,resulting_version)values(target,r.id,p.id,auth.uid(),'payment.proof.rejected',1,reason,p.version,p.version+1);
  return jsonb_build_object('status','rejected');
 end if;
 select * into i from private.qurban_proof_intents where id=p.id;
 if i.declared_amount_minor<>r.quoted_total_minor then raise exception 'Jumlah bayaran tidak sepadan' using errcode='PT412';end if;
 perform 1 from private.qurban_participations where registration_id=r.id order by created_at,id for update;
 select array_agg(id order by created_at,id)into pids from private.qurban_participations where registration_id=r.id;
 if cardinality(pids) is distinct from r.quoted_participation_count or exists(select 1 from private.qurban_allocations where registration_id=r.id)then raise exception 'Invalid complete admission set' using errcode='PT409';end if;
 if(select count(*) from private.qurban_cattle_slots s left join private.qurban_allocations a on a.slot_id=s.id where s.campaign_id=target and a.id is null)<r.quoted_participation_count then raise exception 'Kapasiti tidak mencukupi — pembayaran belum dapat disahkan.' using errcode='PT413';end if;
 -- The unchanged 8.4 private primitive is called only here, under the same campaign lock.
 perform private.qurban_allocate_registration(target,r.id,pids);
 insert into private.qurban_receipt_counters(campaign_id,last_number)values(target,1) on conflict(campaign_id)do update set last_number=private.qurban_receipt_counters.last_number+1 returning last_number into serial;
 insert into private.qurban_payments(id,campaign_id,registration_id,verified_proof_id,receipt_id,quoted_total_minor,verified_amount_minor,payment_date,verified_by_actor)
 values(pid,target,r.id,p.id,rid,r.quoted_total_minor,i.declared_amount_minor,i.payment_date,auth.uid())returning * into pay;
 select jsonb_agg(jsonb_build_object('participation_id',pt.id,'participant_name',pt.participant_name,'purpose',pt.purpose,'cattle_number',k.display_number,'slot_number',s.slot_number)order by pt.created_at,pt.id)into snap from private.qurban_participations pt join private.qurban_allocations a on a.participation_id=pt.id join private.qurban_cattle_slots s on s.id=a.slot_id join private.qurban_cattle k on k.id=s.cattle_id where pt.registration_id=r.id;
 insert into private.qurban_receipts(id,campaign_id,registration_id,payment_id,receipt_number,sequence_number,campaign_year,campaign_title,public_reference,applicant_name,currency,price_per_share_minor,amount_minor,payment_method,payment_date,issued_at,participants)
 values(rid,target,r.id,pid,'QUR-'||(r.submission_configuration->>'campaign_year')||'-'||lpad(serial::text,6,'0'),serial,(r.submission_configuration->>'campaign_year')::integer,c.title,r.public_reference,r.applicant_name,r.quoted_currency,r.quoted_price_per_share_minor,pay.verified_amount_minor,'bank_transfer',pay.payment_date,pay.verified_at,snap)returning * into rec;
 update private.qurban_payment_proofs set status='verified' where id=p.id;
 insert into private.qurban_payment_audit(campaign_id,registration_id,proof_id,payment_id,receipt_id,actor_id,action,file_count,expected_version,resulting_version)
 select target,r.id,p.id,pid,rid,auth.uid(),action,1,1,2 from unnest(array['payment.verified','receipt.issued'])action;
 return jsonb_build_object('status','verified','receipt_number',rec.receipt_number);
end $$;
create function public.admin_qurban_payment_verify(target_campaign uuid,target_proof uuid,expected_proof_version integer,expected_registration_version integer)returns jsonb language sql security definer set search_path='' as $$select private.qurban_payment_review(target_campaign,target_proof,expected_proof_version,expected_registration_version,'verify',null)$$;
create function public.admin_qurban_payment_reject(target_campaign uuid,target_proof uuid,expected_proof_version integer,expected_registration_version integer,reason text)returns jsonb language sql security definer set search_path='' as $$select private.qurban_payment_review(target_campaign,target_proof,expected_proof_version,expected_registration_version,'reject',reason)$$;
-- Verified financial cancellation is intentionally unavailable.
create function private.qurban_verified_cancellation_guard()returns trigger language plpgsql set search_path='' as $$begin
 if new.status='cancelled' and old.status is distinct from new.status and exists(select 1 from private.qurban_payments where registration_id=old.id)then raise exception 'Bayaran telah disahkan. Gunakan proses kewangan yang berasingan.' using errcode='PT409';end if;return new;end $$;
create trigger qurban_00_verified_cancellation_guard before update on private.qurban_registrations for each row execute function private.qurban_verified_cancellation_guard();

create or replace function private.qurban_proof_prepare(registration uuid,p jsonb,by_admin boolean) returns jsonb language plpgsql set search_path='' as $$
declare r private.qurban_registrations;i private.qurban_proof_intents;kh text;ph text;src text;actor uuid;begin
 if not private.qurban_proof_payload_valid(p)then raise exception 'Invalid proof' using errcode='22023';end if;
 if by_admin then actor:=private.require_campaign_access('manage');src:='admin_assisted_upload';else src:='participant_upload';end if;
 perform pg_catalog.pg_advisory_xact_lock_shared(pg_catalog.hashtextextended('campaign-system-flag:campaigns.enabled',0));
 perform pg_catalog.pg_advisory_xact_lock_shared(pg_catalog.hashtextextended('campaign-system-flag:qurban.enabled',0));
 perform 1 from private.system_feature_flags where flag_key in('campaigns.enabled','qurban.enabled') order by flag_key for share;
 perform 1 from private.campaigns where id=(select campaign_id from private.qurban_registrations where id=registration) for update;
 select * into r from private.qurban_registrations where id=registration for update;
 if r.id is null or not private.qurban_payment_available(r.id)then raise exception 'Access denied' using errcode='42501';end if;
 if(p->>'payment_date')::date>(clock_timestamp() at time zone 'Asia/Kuala_Lumpur')::date or not isfinite((p->>'payment_date')::date)then raise exception 'Invalid proof' using errcode='22023';end if;
 kh:=private.qurban_proof_hash(p->>'idempotency_key');ph:=private.qurban_proof_hash(jsonb_build_object('registration',r.id,'payload',p,'source',src,'actor',actor)::text);
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('qurban-proof:'||kh,0));
 select * into i from private.qurban_proof_intents where key_hash=kh for update;
 if found then
  if i.payload_hash<>ph or i.registration_id<>r.id then raise exception 'Proof conflict' using errcode='PT409';end if;
  if exists(select 1 from private.qurban_payment_proofs where id=i.id)then return jsonb_build_object('committed',true,'result',private.qurban_proof_result(i.id));end if;
 else
  if exists(select 1 from private.qurban_payment_proofs where registration_id=r.id and status in('submitted','verified'))or(select count(*) from private.qurban_proof_intents where registration_id=r.id and expires_at>clock_timestamp() and not exists(select 1 from private.qurban_payment_proofs pp where pp.id=qurban_proof_intents.id))>=3 then raise exception 'Proof conflict' using errcode='PT409';end if;
  insert into private.qurban_proof_intents(campaign_id,registration_id,key_hash,payload_hash,storage_token_hash,declared_amount_minor,payment_date,content_type,extension,byte_size,content_hash,source,actor_id)
  values(r.campaign_id,r.id,kh,ph,private.qurban_proof_hash(private.qurban_proof_hash('qurban-storage:'||(p->>'idempotency_key'))),(p->>'declared_amount_minor')::bigint,(p->>'payment_date')::date,p->>'content_type',p->>'extension',(p->>'byte_size')::integer,p->>'content_hash',src,actor) returning * into i;
 end if;
 if exists(select 1 from private.qurban_payment_proofs where registration_id=r.id and status in('submitted','verified'))then raise exception 'Proof conflict' using errcode='PT409';end if;
 update private.qurban_proof_intents set expires_at=clock_timestamp()+interval '15 minutes' where id=i.id returning * into i;
 return jsonb_build_object('committed',false,'proof_id',i.id,'object_key',i.object_key,'content_type',i.content_type,'extension',i.extension,'byte_size',i.byte_size,'content_hash',i.content_hash);
exception when datetime_field_overflow or invalid_datetime_format or invalid_text_representation or check_violation then raise exception 'Invalid proof' using errcode='22023';end $$;
create or replace function private.qurban_proof_commit(registration uuid,proof uuid,by_admin boolean) returns jsonb language plpgsql set search_path='' as $$
declare r private.qurban_registrations;i private.qurban_proof_intents;o storage.objects;actor uuid;begin
 if by_admin then actor:=private.require_campaign_access('manage');end if;
 perform pg_catalog.pg_advisory_xact_lock_shared(pg_catalog.hashtextextended('campaign-system-flag:campaigns.enabled',0));perform pg_catalog.pg_advisory_xact_lock_shared(pg_catalog.hashtextextended('campaign-system-flag:qurban.enabled',0));
 perform 1 from private.system_feature_flags where flag_key in('campaigns.enabled','qurban.enabled') order by flag_key for share;
 perform 1 from private.campaigns where id=(select campaign_id from private.qurban_registrations where id=registration) for update;
 select * into r from private.qurban_registrations where id=registration for update;
 if r.id is null or not private.qurban_payment_available(r.id)then raise exception 'Access denied' using errcode='42501';end if;
 select * into i from private.qurban_proof_intents where id=proof and registration_id=r.id for update;
 if i.id is null or i.actor_id is distinct from actor or i.source<>(case when by_admin then 'admin_assisted_upload' else 'participant_upload' end) then raise exception 'Access denied' using errcode='42501';end if;
 if exists(select 1 from private.qurban_payment_proofs where id=i.id)then return private.qurban_proof_result(i.id);end if;
 if i.expires_at<=clock_timestamp() or exists(select 1 from private.qurban_payment_proofs where registration_id=r.id and status in('submitted','verified'))then raise exception 'Proof conflict' using errcode='PT409';end if;
 select * into o from storage.objects where bucket_id='qurban-payment-proofs' and name=i.object_key for share;
 if o.id is null or o.metadata->>'size' is distinct from i.byte_size::text or o.metadata->>'mimetype' is distinct from i.content_type or o.user_metadata->>'sha256' is distinct from i.content_hash then raise exception 'Proof unavailable' using errcode='PT409';end if;
 insert into private.qurban_payment_proofs(id,campaign_id,registration_id) values(i.id,i.campaign_id,i.registration_id);
 insert into private.qurban_payment_audit(campaign_id,registration_id,proof_id,actor_id,action,source,file_count)values(i.campaign_id,i.registration_id,i.id,actor,case when by_admin then 'payment.proof.admin_submitted' else 'payment.proof.submitted' end,i.source,1);
 return private.qurban_proof_result(i.id);
end $$;

create or replace function private.qurban_payment_context(slug text,secret text)returns jsonb language plpgsql set search_path='' as $$
declare rid uuid;result jsonb;begin
 rid:=private.qurban_payment_session_registration(slug,secret);if rid is null then return null;end if;
 select jsonb_build_object('reference',r.public_reference,'participant_count',r.quoted_participation_count,'currency',r.quoted_currency,'price_per_share_minor',r.quoted_price_per_share_minor,'total_minor',r.quoted_total_minor,
 'proof_status',coalesce(p.status,'none'),'rejection_reason',p.rejection_reason,
 'payment',case when pay.id is null then null else jsonb_build_object('receipt_number',rec.receipt_number,'amount_minor',pay.verified_amount_minor,'verified_at',pay.verified_at)end,
 'current_allocation',coalesce((select jsonb_agg(jsonb_build_object('participant_name',pt.participant_name,'purpose',pt.purpose,'cattle_number',k.display_number,'slot_number',cs.slot_number)order by pt.created_at,pt.id)
 from private.qurban_participations pt join private.qurban_allocations a on a.participation_id=pt.id join private.qurban_cattle_slots cs on cs.id=a.slot_id join private.qurban_cattle k on k.id=cs.cattle_id where pt.registration_id=rid and pay.id is not null),'[]'::jsonb))into result
 from private.qurban_registrations r left join lateral(select * from private.qurban_payment_proofs where registration_id=rid order by submitted_at desc,id desc limit 1)p on true
 left join private.qurban_payments pay on pay.registration_id=rid left join private.qurban_receipts rec on rec.id=pay.receipt_id where r.id=rid;
 return result;
end $$;

create function private.qurban_receipt_data(registration uuid)returns jsonb language sql stable set search_path='' as $$
 select jsonb_build_object('receipt_number',receipt_number,'campaign_year',campaign_year,'campaign_title',campaign_title,'reference',public_reference,'applicant_name',applicant_name,'currency',currency,'amount_minor',amount_minor,'price_per_share_minor',price_per_share_minor,'payment_method',payment_method,'payment_date',payment_date,'issued_at',issued_at,'participants',participants)
 from private.qurban_receipts where registration_id=registration
$$;
create function private.qurban_receipt_download(registration uuid,actor uuid)returns jsonb language plpgsql set search_path='' as $$
declare rec private.qurban_receipts;pay private.qurban_payments;begin
 select * into rec from private.qurban_receipts where registration_id=registration;
 if rec.id is null then raise exception 'Access denied' using errcode='42501';end if;
 select * into pay from private.qurban_payments where id=rec.payment_id;
 insert into private.qurban_payment_audit(campaign_id,registration_id,proof_id,payment_id,receipt_id,actor_id,action,file_count)
 values(rec.campaign_id,rec.registration_id,pay.verified_proof_id,pay.id,rec.id,actor,'receipt.downloaded',1);
 return private.qurban_receipt_data(registration);
end $$;
create function public.public_qurban_receipt_download(target_slug text,session_secret text)returns jsonb language plpgsql security definer set search_path='' as $$
declare rid uuid;begin
 rid:=private.qurban_payment_session_registration(target_slug,session_secret);
 if rid is null then raise exception 'Access denied' using errcode='42501';end if;
 return private.qurban_receipt_download(rid,null);
end $$;
create function public.admin_qurban_receipt_download(target_campaign uuid,target_registration uuid)returns jsonb language plpgsql security definer set search_path='' as $$
begin
 perform private.qurban_admin_campaign(target_campaign,true);
 if not exists(select 1 from private.qurban_receipts where registration_id=target_registration and campaign_id=target_campaign)then raise exception 'Access denied' using errcode='42501';end if;
 return private.qurban_receipt_download(target_registration,auth.uid());
end $$;
create or replace function private.qurban_payment_list(target uuid,options jsonb)returns jsonb language plpgsql set search_path='' as $$
declare c private.campaigns;staff boolean;pg integer;sz integer;term text;st text;result jsonb;begin
 c:=private.qurban_admin_campaign(target,false);staff:=private.active_role()='staff';
 if jsonb_typeof(options) is distinct from 'object' or octet_length(options::text)>1024 or not options?&array['page','page_size','search','proof_status'] or(select count(*) from jsonb_object_keys(options))<>4 or jsonb_typeof(options->'page')<>'number' or jsonb_typeof(options->'page_size')<>'number' or options->>'page'!~'^[1-9][0-9]{0,4}$' or options->>'page_size'!~'^[1-9][0-9]?$' or jsonb_typeof(options->'search')<>'string' or jsonb_typeof(options->'proof_status')<>'string' then raise exception 'Invalid request' using errcode='22023';end if;
 pg:=(options->>'page')::integer;sz:=(options->>'page_size')::integer;term:=lower(options->>'search');st:=options->>'proof_status';
 if pg>10000 or sz>50 or length(term)>100 or(term<>'' and not private.qurban_text_valid(term,1,100))or st not in('all','none','submitted','rejected','verified')then raise exception 'Invalid request' using errcode='22023';end if;
 with all_r as materialized(select r.*,coalesce(p.status,'none') proof_status,p.id proof_id,p.version proof_version,p.rejection_reason,p.reviewed_at,p.submitted_at,i.proof_reference,i.declared_amount_minor,i.payment_date,i.source,i.actor_id
 from private.qurban_registrations r left join lateral(select * from private.qurban_payment_proofs where registration_id=r.id order by submitted_at desc,id desc limit 1)p on true
 left join private.qurban_proof_intents i on i.id=p.id where r.campaign_id=target),
 filtered as materialized(select * from all_r r where(st='all' or st=proof_status)and(term='' or lower(public_reference)=term or(staff=false and(starts_with(lower(applicant_name),term)or(term~'^[+0-9 ()-]+$'and length(regexp_replace(term,'[^0-9]','','g'))>0 and starts_with(regexp_replace(phone,'[^0-9]','','g'),regexp_replace(term,'[^0-9]','','g'))))))),
 paged as(select * from filtered order by created_at desc,id limit sz offset(pg-1)*sz)
 select jsonb_build_object('campaign_id',target,'can_manage',not staff,'recent_mfa',private.active_role()<>'super_admin'or private.recent_totp(),'page',pg,'page_size',sz,'total',(select count(*)from filtered),
 'summary',jsonb_build_object('active_without_proof',(select count(*)from all_r where status='submitted'and proof_status='none'),'active_with_proof',(select count(*)from all_r where status='submitted'and proof_status='submitted'),'active_rejected',(select count(*)from all_r where status='submitted'and proof_status='rejected'),'active_verified',(select count(*)from all_r where status='submitted'and proof_status='verified')),
 'items',coalesce((select jsonb_agg(jsonb_build_object('registration_id',r.id,'reference',r.public_reference,'registration_status',r.status,'proof_status',r.proof_status)||case when staff then '{}'::jsonb else
 jsonb_build_object('registration_version',r.version,'applicant_name',r.applicant_name,'quote',jsonb_build_object('currency',r.quoted_currency,'participant_count',r.quoted_participation_count,'price_per_share_minor',r.quoted_price_per_share_minor,'total_minor',r.quoted_total_minor),
 'proof',case when r.proof_id is null then null else jsonb_build_object('id',r.proof_id,'version',r.proof_version,'status',r.proof_status,'rejection_reason',r.rejection_reason,'reference',r.proof_reference,'declared_amount_minor',r.declared_amount_minor,'payment_date',r.payment_date,'source',r.source,'submitted_by_actor',r.actor_id,'submitted_at',r.submitted_at,'amount_mismatch',r.declared_amount_minor<>r.quoted_total_minor)end)end order by r.created_at desc,r.id)from paged r),'[]'::jsonb))into result;return result;
end $$;
create function private.qurban_payment_detail(target uuid,registration uuid,page_number integer)returns jsonb language plpgsql set search_path='' as $$
begin
 perform private.qurban_admin_campaign(target,true);
 if page_number is null or page_number not between 1 and 1000 then raise exception 'Invalid page' using errcode='22023';end if;
 if not exists(select 1 from private.qurban_registrations where id=registration and campaign_id=target)then raise exception 'Access denied' using errcode='42501';end if;
 return jsonb_build_object('history_page',page_number,'history_total',(select count(*)from private.qurban_payment_proofs where registration_id=registration),
 'history',coalesce((select jsonb_agg(to_jsonb(t))from(select p.id,p.version,p.status,p.rejection_reason,p.reviewed_at,p.reviewed_by,p.submitted_at,i.proof_reference reference,i.declared_amount_minor,i.payment_date,i.source
 from private.qurban_payment_proofs p join private.qurban_proof_intents i on i.id=p.id where p.registration_id=registration order by p.submitted_at desc,p.id desc limit 50 offset(page_number-1)*50)t),'[]'::jsonb),
 'payment',(select jsonb_build_object('receipt_number',rec.receipt_number,'amount_minor',pay.verified_amount_minor,'verified_at',pay.verified_at,'payment_date',pay.payment_date)from private.qurban_payments pay join private.qurban_receipts rec on rec.id=pay.receipt_id where pay.registration_id=registration),
 'current_allocation',coalesce((select jsonb_agg(jsonb_build_object('participant_name',pt.participant_name,'purpose',pt.purpose,'cattle_number',k.display_number,'slot_number',s.slot_number)order by pt.created_at,pt.id)
 from private.qurban_participations pt join private.qurban_allocations a on a.participation_id=pt.id join private.qurban_cattle_slots s on s.id=a.slot_id join private.qurban_cattle k on k.id=s.cattle_id where pt.registration_id=registration),'[]'::jsonb));
end $$;
create function public.admin_qurban_payment_detail(target_campaign uuid,target_registration uuid,page_number integer)returns jsonb language sql security definer set search_path='' as $$select private.qurban_payment_detail(target_campaign,target_registration,page_number)$$;
create or replace function private.qurban_payment_activity(target uuid,page_number integer)returns jsonb language plpgsql set search_path='' as $$begin
 perform private.require_campaign_access('audit');perform private.qurban_admin_campaign(target,false);if page_number is null or page_number not between 1 and 10000 then raise exception 'Invalid request' using errcode='22023';end if;
 return jsonb_build_object('page',page_number,'items',coalesce((select jsonb_agg(to_jsonb(e))from(select id,registration_id,proof_id,payment_id,receipt_id,actor_id,action,source,file_count,rejection_reason,expected_version,resulting_version,occurred_at from private.qurban_payment_audit where campaign_id=target order by occurred_at desc,id desc limit 50 offset(page_number-1)*50)e),'[]'::jsonb));end $$;
create or replace function private.qurban_admin_export_snapshot(target uuid) returns jsonb language plpgsql set search_path='' as $$
declare c private.campaigns; snapshot jsonb; ticket private.qurban_export_requests; rc integer;pc integer;vc integer;
begin
 c:=private.qurban_admin_campaign(target,true);
 select count(*) into rc from private.qurban_registrations where campaign_id=target;
 select count(*) into pc from private.qurban_participations p join private.qurban_registrations r on r.id=p.registration_id where r.campaign_id=target;
 if rc>5000 or pc>20000 then raise exception 'Export bound exceeded' using errcode='22023';end if;
 -- One SQL statement / MVCC snapshot owns every sheet's input and count.
 with volunteers as materialized(select v.*,l.name assignment_label,l.normalized_name assignment_sort from private.qurban_volunteers v left join private.qurban_volunteer_assignment_labels l on l.id=v.assignment_label_id where v.campaign_id=target),
 regs as materialized(select * from private.qurban_registrations where campaign_id=target),
 parts as materialized(select p.*,k.display_number cattle_number,s.slot_number from private.qurban_participations p join regs r on r.id=p.registration_id left join private.qurban_allocations a on a.participation_id=p.id left join private.qurban_cattle_slots s on s.id=a.slot_id left join private.qurban_cattle k on k.id=s.cattle_id)
,payments as materialized(select p.id,p.registration_id,i.proof_reference,i.declared_amount_minor,i.payment_date,i.source,p.submitted_at,p.status,pay.verified_at,rec.receipt_number from regs r join lateral(select * from private.qurban_payment_proofs where registration_id=r.id order by submitted_at desc,id desc limit 1)p on true join private.qurban_proof_intents i on i.id=p.id left join private.qurban_payments pay on pay.registration_id=r.id left join private.qurban_receipts rec on rec.id=pay.receipt_id)
 select jsonb_build_object('payments',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'registration_id',p.registration_id,'proof_reference',p.proof_reference,'quoted_total_minor',r.quoted_total_minor,'declared_amount_minor',p.declared_amount_minor,'payment_date',p.payment_date,'source',p.source,'status',p.status,'submitted_at',p.submitted_at,'verified_at',p.verified_at,'receipt_number',p.receipt_number)order by p.submitted_at,p.id)from payments p join regs r on r.id=p.registration_id),'[]'::jsonb),'campaign',jsonb_build_object('id',c.id,'title',c.title,'campaign_year',c.configuration->'campaign_year','hijri_display_label',c.configuration->>'hijri_display_label',
 'currency',c.configuration->>'currency','price_per_share_minor',c.configuration->'price_per_cattle_share_minor','cattle_count',c.configuration->'cattle_count','shares_per_cattle',c.configuration->'shares_per_cattle'),
 'volunteers',coalesce((select jsonb_agg(jsonb_build_object('id',id,'public_reference',public_reference,'name',name,'phone',phone,'email',email,'shirt_size',shirt_size,'also_participant',also_participant,'participant_name_information',participant_name_information,'assignment_label_id',assignment_label_id,'assignment_label',assignment_label,'status',status,'created_at',created_at,'updated_at',updated_at) order by case when status='cancelled' then 2 when assignment_label_id is null then 1 else 0 end,assignment_sort collate "C",lower(name) collate "C",public_reference) from volunteers),'[]'::jsonb),
 'allocation_summary',jsonb_build_object('initialized',exists(select 1 from private.qurban_cattle where campaign_id=target),'capacity',(select count(*) from private.qurban_cattle_slots where campaign_id=target),'allocated',(select count(*) from private.qurban_allocations where campaign_id=target),'empty',(select count(*) from private.qurban_cattle_slots where campaign_id=target)-(select count(*) from private.qurban_allocations where campaign_id=target)),
 'summary',jsonb_build_object('registrations',(select count(*) from regs),'submitted',(select count(*) from regs where status='submitted'),'cancelled',(select count(*) from regs where status='cancelled'),
 'participants',(select count(*) from parts),'qurban',(select count(*) from parts where purpose='qurban'),'aqiqah',(select count(*) from parts where purpose='aqiqah')),
 'registrations',coalesce((select jsonb_agg(jsonb_build_object('id',id,'public_reference',public_reference,'applicant_name',applicant_name,'phone',phone,'address',address,'email',email,
 'attendance',attendance,'same_cattle_preference',same_cattle_preference,'status',status,'participant_count',quoted_participation_count,'created_at',created_at,'updated_at',updated_at) order by created_at,id) from regs),'[]'::jsonb),
 'participants',coalesce((select jsonb_agg(jsonb_build_object('id',id,'registration_id',registration_id,'participant_name',participant_name,'purpose',purpose,'created_at',created_at,'cattle_number',cattle_number,'slot_number',slot_number) order by created_at,id) from parts),'[]'::jsonb)) into snapshot;
 rc:=(snapshot->'summary'->>'registrations')::integer;pc:=(snapshot->'summary'->>'participants')::integer;vc:=jsonb_array_length(snapshot->'volunteers');
 if rc>5000 or pc>20000 or vc>10000 or jsonb_array_length(snapshot->'payments')>5000 or octet_length(snapshot::text)>16777216 then raise exception 'Export bound exceeded' using errcode='22023';end if;
 insert into private.qurban_export_requests(campaign_id,actor_id,captured_at,expires_at,snapshot_hash,registration_count,participation_count,volunteer_count)
 values(target,auth.uid(),clock_timestamp(),clock_timestamp()+interval '15 minutes',encode(sha256(convert_to(snapshot::text,'UTF8')),'hex'),rc,pc,vc) returning * into ticket;
 return snapshot||jsonb_build_object('export_id',ticket.id,'snapshot_hash',ticket.snapshot_hash,'generated_at',ticket.captured_at,'generated_by',ticket.actor_id);
end $$;



-- Explicit grants only; private allocator remains completely unavailable to runtime roles.
do $$declare f record;begin for f in select p.oid::regprocedure signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in('private','public')and(p.proname like 'qurban_receipt_%'or p.proname like 'qurban_financial_%'or p.proname in('qurban_payment_review','qurban_proof_review_guard','qurban_payment_detail','qurban_verified_cancellation_guard','admin_qurban_payment_verify','admin_qurban_payment_reject','admin_qurban_payment_detail','admin_qurban_receipt_download','public_qurban_receipt_download'))loop
 execute format('revoke all on function %s from public,anon,authenticated,service_role,supabase_auth_admin,authenticator,campaign_scheduler,qurban_proof_storage_worker',f.signature);end loop;end $$;
grant execute on function public.admin_qurban_payment_verify(uuid,uuid,integer,integer),public.admin_qurban_payment_reject(uuid,uuid,integer,integer,text),public.admin_qurban_payment_detail(uuid,uuid,integer),public.admin_qurban_receipt_download(uuid,uuid)to authenticated;
grant execute on function public.public_qurban_receipt_download(text,text)to anon,authenticated;
notify pgrst,'reload schema';
commit;
