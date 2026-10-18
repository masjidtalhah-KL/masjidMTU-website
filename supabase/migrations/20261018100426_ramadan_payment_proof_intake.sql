begin;
-- Owner-approved Storage-only identity. No signing key/service_role in application runtime.
do $$ begin if not exists(select 1 from pg_roles where rolname='ramadan_proof_storage_worker') then create role ramadan_proof_storage_worker nologin noinherit nobypassrls;end if;end $$;
alter role ramadan_proof_storage_worker nologin noinherit nobypassrls;
-- Supabase migration owner must not acquire SUPERUSER to demote a role. Creation
-- defaults are least-privilege; refuse any pre-existing privileged worker instead.
do $$begin if exists(select 1 from pg_roles where rolname='ramadan_proof_storage_worker'and(rolsuper or rolcreatedb or rolcreaterole or rolreplication or rolbypassrls or rolcanlogin or rolinherit))then raise exception 'Unsafe pre-existing Ramadan Storage worker';end if;end $$;
grant ramadan_proof_storage_worker to authenticator;
create function private.ramadan_proof_hash(s text) returns text language sql immutable set search_path='' as $$select encode(sha256(convert_to(s,'UTF8')),'hex')$$;
create table private.ramadan_payment_access(
 id uuid primary key default gen_random_uuid(),campaign_id uuid not null,sponsorship_id uuid not null unique,
 revoked_at timestamptz,secret_hash text not null check(secret_hash~'^[0-9a-f]{64}$'),created_at timestamptz not null default clock_timestamp(),
 foreign key(sponsorship_id,campaign_id) references private.ramadan_sponsorships(id,campaign_id) on delete restrict
);
create table private.ramadan_payment_sessions(
 token_hash text primary key check(token_hash~'^[0-9a-f]{64}$'),access_id uuid not null references private.ramadan_payment_access(id) on delete restrict,
 created_at timestamptz not null default clock_timestamp(),expires_at timestamptz not null default(clock_timestamp()+interval '20 minutes'),check(expires_at>created_at)
);
create index ramadan_payment_sessions_access on private.ramadan_payment_sessions(access_id,expires_at);
create table private.ramadan_proof_intents(
 id uuid primary key default gen_random_uuid(),campaign_id uuid not null,sponsorship_id uuid not null,
 proof_reference text not null unique default('RPF-'||replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-','')) check(proof_reference~'^RPF-[0-9a-f]{64}$'),
 key_hash text not null unique check(key_hash~'^[0-9a-f]{64}$'),payload_hash text not null check(payload_hash~'^[0-9a-f]{64}$'),storage_token_hash text not null check(storage_token_hash~'^[0-9a-f]{64}$'),
 declared_amount_minor private.ramadan_minor_units not null,payment_date date not null check(payment_date<=(clock_timestamp() at time zone 'Asia/Kuala_Lumpur')::date and isfinite(payment_date)),
 content_type text not null check(content_type in('image/jpeg','image/png','application/pdf')),extension text not null check(extension in('jpg','png','pdf')),
 byte_size integer not null check(byte_size between 1 and 10485760),content_hash text not null check(content_hash~'^[0-9a-f]{64}$'),
 source text not null check(source in('participant_upload','admin_assisted_upload')),actor_id uuid references auth.users(id) on delete restrict,
 created_at timestamptz not null default clock_timestamp(),expires_at timestamptz not null default(clock_timestamp()+interval '15 minutes'),
 object_key text generated always as(campaign_id::text||'/'||sponsorship_id::text||'/'||id::text||'.'||extension) stored unique,
 foreign key(sponsorship_id,campaign_id) references private.ramadan_sponsorships(id,campaign_id) on delete restrict,
 unique(id,sponsorship_id,campaign_id),check((source='participant_upload')=(actor_id is null)),
 check((content_type='image/jpeg' and extension='jpg') or(content_type='image/png' and extension='png')or(content_type='application/pdf' and extension='pdf')),check(expires_at>created_at)
);
create index ramadan_proof_intents_sponsorship on private.ramadan_proof_intents(sponsorship_id,expires_at);
create table private.ramadan_payment_proofs(
 id uuid primary key,campaign_id uuid not null,sponsorship_id uuid not null,status text not null default 'submitted' check(status='submitted'),
 submitted_at timestamptz not null default clock_timestamp(),version integer not null default 1 check(version=1),unique(id,sponsorship_id,campaign_id),
 foreign key(id,sponsorship_id,campaign_id) references private.ramadan_proof_intents(id,sponsorship_id,campaign_id) on delete restrict
);
create unique index ramadan_one_open_proof on private.ramadan_payment_proofs(sponsorship_id) where status='submitted';
create index ramadan_payment_proofs_campaign on private.ramadan_payment_proofs(campaign_id,submitted_at,id);
create table private.ramadan_payment_audit(
 id uuid primary key default gen_random_uuid(),campaign_id uuid not null references private.campaigns(id) on delete restrict,
 sponsorship_id uuid not null,proof_id uuid not null,actor_id uuid references auth.users(id) on delete restrict,
 action text not null check(action in('payment.proof.submitted','payment.proof.admin_submitted','payment.proof.downloaded')),
 source text check(source in('participant_upload','admin_assisted_upload')),file_count integer not null check(file_count between 1 and 50),occurred_at timestamptz not null default clock_timestamp(),
 foreign key(sponsorship_id,campaign_id) references private.ramadan_sponsorships(id,campaign_id) on delete restrict,
 foreign key(proof_id,sponsorship_id,campaign_id) references private.ramadan_payment_proofs(id,sponsorship_id,campaign_id) on delete restrict,
 check((proof_id is null)=(sponsorship_id is null)),
 check((action='payment.proof.submitted' and actor_id is null and source='participant_upload' and proof_id is not null and file_count=1)or(action='payment.proof.admin_submitted' and actor_id is not null and source='admin_assisted_upload' and proof_id is not null and file_count=1)or(action='payment.proof.downloaded' and actor_id is not null and source is null and proof_id is not null and file_count=1))
);
create unique index ramadan_payment_submission_audit on private.ramadan_payment_audit(proof_id) where action in('payment.proof.submitted','payment.proof.admin_submitted');
create index ramadan_payment_audit_page on private.ramadan_payment_audit(campaign_id,occurred_at,id);
create table private.ramadan_proof_download_grants(
 token_hash text not null check(token_hash~'^[0-9a-f]{64}$'),proof_id uuid not null references private.ramadan_payment_proofs(id) on delete restrict,
 actor_id uuid not null references auth.users(id) on delete restrict,session_id uuid not null,created_at timestamptz not null default clock_timestamp(),expires_at timestamptz not null default(clock_timestamp()+interval '5 minutes'),
 primary key(token_hash,proof_id),check(expires_at>created_at)
);
create index ramadan_proof_download_expiry on private.ramadan_proof_download_grants(expires_at);
create function private.ramadan_payment_guard() returns trigger language plpgsql set search_path='' as $$
begin
 if tg_op='DELETE' then
  if tg_table_name in('ramadan_payment_sessions','ramadan_proof_download_grants') then if old.expires_at<clock_timestamp() then return old;end if;end if;
  raise exception 'Immutable payment evidence' using errcode='42501';
 end if;
 if tg_op='UPDATE' then
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
do $$declare t text;begin foreach t in array array['ramadan_payment_access','ramadan_payment_sessions','ramadan_proof_intents','ramadan_payment_proofs','ramadan_payment_audit','ramadan_proof_download_grants']loop
 execute format('create trigger %I before insert or update or delete on private.%I for each row execute function private.ramadan_payment_guard()',t||'_guard',t);
 execute format('alter table private.%I enable row level security',t);
 execute format('revoke all on private.%I from public,anon,authenticated,service_role,supabase_auth_admin,authenticator,campaign_scheduler,ramadan_proof_storage_worker',t);
 end loop;end $$;
create function private.ramadan_proof_cancellation_guard() returns trigger language plpgsql set search_path='' as $$begin
 if new.status='cancelled' and old.status is distinct from new.status and exists(select 1 from private.ramadan_payment_proofs where sponsorship_id=old.id and status='submitted')then raise exception 'Bukti bayaran telah dihantar. Selesaikan semakan bayaran terlebih dahulu.' using errcode='PT409';end if;return new;end $$;
create trigger ramadan_proof_cancellation_guard before update on private.ramadan_sponsorships for each row execute function private.ramadan_proof_cancellation_guard();

-- New submissions freeze a separate high-entropy capability with the idempotent request.
create function private.ramadan_payment_submission_valid(p jsonb)returns boolean language sql immutable set search_path=''as $$select coalesce(jsonb_typeof(p)='object'and jsonb_typeof(p->'payment_access_secret')='string'and length(p->>'payment_access_secret')=64 and p->>'payment_access_secret'~'^[0-9a-f]{64}$'and private.ramadan_submission_valid(p-'payment_access_secret')and octet_length(p::text)<=16384,false)$$;
create or replace function private.ramadan_submit(p jsonb)returns jsonb language plpgsql set search_path='' as $$
declare c private.campaigns;ctx jsonb;kh text;ph text;prior private.ramadan_submission_idempotency;o private.ramadan_offerings;s private.ramadan_schedule_entries;r private.ramadan_sponsorships;e jsonb;pay private.ramadan_payment_access;total numeric:=0;begin
 if not private.ramadan_payment_submission_valid(p)then raise exception 'Invalid sponsorship'using errcode='22023';end if;
 kh:=encode(sha256(convert_to(p->>'idempotency_key','UTF8')),'hex');ph:=encode(sha256(convert_to(p::text,'UTF8')),'hex');
 perform pg_advisory_xact_lock(hashtextextended('ramadan-submission:'||kh,0));
 select *into prior from private.ramadan_submission_idempotency where key_hash=kh;
 if prior.key_hash is not null then if prior.payload_hash<>ph then raise exception 'Review again'using errcode='PT409';end if;select *into pay from private.ramadan_payment_access where sponsorship_id=prior.sponsorship_id;if pay.id is null or pay.secret_hash<>private.ramadan_proof_hash(p->>'payment_access_secret')then raise exception 'Review again'using errcode='PT409';end if;return private.ramadan_submission_result(prior.sponsorship_id)||jsonb_build_object('payment_access_id',pay.id);end if;
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
 insert into private.ramadan_payment_access(campaign_id,sponsorship_id,secret_hash)values(r.campaign_id,r.id,private.ramadan_proof_hash(p->>'payment_access_secret'))returning *into pay;return private.ramadan_submission_result(r.id)||jsonb_build_object('payment_access_id',pay.id);
exception when sqlstate 'PT409' or sqlstate '22023' then raise;when check_violation or invalid_text_representation or numeric_value_out_of_range then raise exception 'Invalid sponsorship'using errcode='22023';when others then raise exception 'Sponsorship unavailable'using errcode='PT503';end $$;
-- Existing registered people may submit proof after sponsorship closure. Not after archive/cancellation/flags OFF.
create function private.ramadan_payment_available(sponsorship uuid) returns boolean language sql stable set search_path='' as $$
 select exists(select 1 from private.ramadan_sponsorships r join private.campaigns c on c.id=r.campaign_id where r.id=sponsorship and r.status='submitted' and c.type_key='ramadan' and c.config_version=1 and c.status<>'archived' and private.ramadan_config_v1_valid(c.configuration)
 and exists(select 1 from private.system_feature_flags where flag_key='campaigns.enabled' and enabled) and exists(select 1 from private.system_feature_flags where flag_key='ramadan.enabled' and enabled))
$$;
create function private.ramadan_payment_session_sponsorship(slug text,secret text) returns uuid language plpgsql set search_path='' as $$declare result uuid;begin
 if secret is null or secret!~'^[0-9a-f]{64}$' or length(secret)<>64 or not private.ramadan_text_valid(slug,3,100)then return null;end if;
 select a.sponsorship_id into result from private.ramadan_payment_sessions s join private.ramadan_payment_access a on a.id=s.access_id join private.campaigns c on c.id=a.campaign_id
 where s.token_hash=private.ramadan_proof_hash(secret) and s.expires_at>clock_timestamp() and c.slug=ramadan_payment_session_sponsorship.slug and a.revoked_at is null and private.ramadan_payment_available(a.sponsorship_id);return result;
end $$;
create function private.ramadan_payment_exchange(p jsonb) returns jsonb language plpgsql set search_path='' as $$declare a private.ramadan_payment_access;s private.ramadan_payment_sessions;begin
 if jsonb_typeof(p) is distinct from 'object' or octet_length(p::text)>1024 or not p?&array['slug','access_id','access_secret','session_secret'] or(select count(*) from jsonb_object_keys(p))<>4
 or jsonb_typeof(p->'slug')<>'string' or not private.ramadan_text_valid(p->>'slug',3,100) or jsonb_typeof(p->'access_id')<>'string' or p->>'access_id'!~'^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$'
 or jsonb_typeof(p->'access_secret')<>'string' or p->>'access_secret'!~'^[0-9a-f]{64}$' or length(p->>'access_secret')<>64 or jsonb_typeof(p->'session_secret')<>'string' or p->>'session_secret'!~'^[0-9a-f]{64}$' or length(p->>'session_secret')<>64 then return null;end if;
 select pa.* into a from private.ramadan_payment_access pa join private.campaigns c on c.id=pa.campaign_id where pa.id=(p->>'access_id')::uuid and c.slug=p->>'slug' and pa.secret_hash=private.ramadan_proof_hash(p->>'access_secret') and pa.revoked_at is null and private.ramadan_payment_available(pa.sponsorship_id) for update of pa;
 if not found then return null;end if;
 delete from private.ramadan_payment_sessions where access_id=a.id and expires_at<clock_timestamp();
 if(select count(*) from private.ramadan_payment_sessions where access_id=a.id)>=10 then return null;end if;
 insert into private.ramadan_payment_sessions(token_hash,access_id) values(private.ramadan_proof_hash(p->>'session_secret'),a.id) on conflict(token_hash) do nothing;
 select * into s from private.ramadan_payment_sessions where token_hash=private.ramadan_proof_hash(p->>'session_secret') and access_id=a.id;
 if s.token_hash is null then return null;end if;return jsonb_build_object('expires_at',s.expires_at);
exception when invalid_text_representation then return null;end $$;
create function private.ramadan_payment_context(slug text,secret text)returns jsonb language plpgsql set search_path=''as $$declare rid uuid;begin rid:=private.ramadan_payment_session_sponsorship(slug,secret);if rid is null then return null;end if;return private.ramadan_submission_result(rid)||jsonb_build_object('proof_status',case when exists(select 1 from private.ramadan_payment_proofs where sponsorship_id=rid)then 'submitted'else 'none'end);end $$;
create function private.ramadan_proof_payload_valid(p jsonb) returns boolean language plpgsql immutable set search_path='' as $$begin
 if jsonb_typeof(p) is distinct from 'object' or octet_length(p::text)>1024 or not p?&array['idempotency_key','declared_amount_minor','payment_date','content_type','extension','byte_size','content_hash'] or(select count(*) from jsonb_object_keys(p))<>7 then return false;end if;
 return jsonb_typeof(p->'idempotency_key')='string' and length(p->>'idempotency_key')=64 and p->>'idempotency_key'~'^[0-9a-f]{64}$'
 and jsonb_typeof(p->'declared_amount_minor')='number' and p->>'declared_amount_minor'~'^[1-9][0-9]{0,12}$' and(p->>'declared_amount_minor')::numeric<=1000000000000
 and jsonb_typeof(p->'payment_date')='string' and p->>'payment_date'~'^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
 and jsonb_typeof(p->'content_type')='string' and jsonb_typeof(p->'extension')='string'
 and((p->>'content_type'='image/jpeg' and p->>'extension'='jpg')or(p->>'content_type'='image/png' and p->>'extension'='png')or(p->>'content_type'='application/pdf' and p->>'extension'='pdf'))
 and jsonb_typeof(p->'byte_size')='number' and p->>'byte_size'~'^[1-9][0-9]{0,7}$' and(p->>'byte_size')::numeric<=10485760
 and jsonb_typeof(p->'content_hash')='string' and length(p->>'content_hash')=64 and p->>'content_hash'~'^[0-9a-f]{64}$';
 exception when others then return false;end $$;
create function private.ramadan_proof_result(proof uuid) returns jsonb language sql stable set search_path='' as $$
 select jsonb_build_object('proof_reference',i.proof_reference,'status',p.status,'submitted_at',p.submitted_at,'amount_mismatch',i.declared_amount_minor<>r.quoted_total_minor)
 from private.ramadan_payment_proofs p join private.ramadan_proof_intents i on i.id=p.id join private.ramadan_sponsorships r on r.id=p.sponsorship_id where p.id=proof
$$;
create function private.ramadan_proof_prepare(sponsorship uuid,p jsonb,by_admin boolean) returns jsonb language plpgsql set search_path='' as $$
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
  if exists(select 1 from private.ramadan_payment_proofs where sponsorship_id=r.id)or(select count(*) from private.ramadan_proof_intents where sponsorship_id=r.id and expires_at>clock_timestamp())>=3 then raise exception 'Proof conflict' using errcode='PT409';end if;
  insert into private.ramadan_proof_intents(campaign_id,sponsorship_id,key_hash,payload_hash,storage_token_hash,declared_amount_minor,payment_date,content_type,extension,byte_size,content_hash,source,actor_id)
  values(r.campaign_id,r.id,kh,ph,private.ramadan_proof_hash(private.ramadan_proof_hash('ramadan-storage:'||(p->>'idempotency_key'))),(p->>'declared_amount_minor')::numeric,(p->>'payment_date')::date,p->>'content_type',p->>'extension',(p->>'byte_size')::integer,p->>'content_hash',src,actor) returning * into i;
 end if;
 if exists(select 1 from private.ramadan_payment_proofs where sponsorship_id=r.id)then raise exception 'Proof conflict' using errcode='PT409';end if;
 update private.ramadan_proof_intents set expires_at=clock_timestamp()+interval '15 minutes' where id=i.id returning * into i;
 return jsonb_build_object('committed',false,'proof_id',i.id,'object_key',i.object_key,'content_type',i.content_type,'extension',i.extension,'byte_size',i.byte_size,'content_hash',i.content_hash);
exception when datetime_field_overflow or invalid_datetime_format or invalid_text_representation or check_violation then raise exception 'Invalid proof' using errcode='22023';end $$;
create function private.ramadan_proof_commit(sponsorship uuid,proof uuid,by_admin boolean) returns jsonb language plpgsql set search_path='' as $$
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
 if i.expires_at<=clock_timestamp() or exists(select 1 from private.ramadan_payment_proofs where sponsorship_id=r.id)then raise exception 'Proof conflict' using errcode='PT409';end if;
 select * into o from storage.objects where bucket_id='ramadan-payment-proofs' and name=i.object_key for share;
 if o.id is null or o.metadata->>'size' is distinct from i.byte_size::text or o.metadata->>'mimetype' is distinct from i.content_type or o.user_metadata->>'sha256' is distinct from i.content_hash then raise exception 'Proof unavailable' using errcode='PT409';end if;
 insert into private.ramadan_payment_proofs(id,campaign_id,sponsorship_id) values(i.id,i.campaign_id,i.sponsorship_id);
 insert into private.ramadan_payment_audit(campaign_id,sponsorship_id,proof_id,actor_id,action,source,file_count)values(i.campaign_id,i.sponsorship_id,i.id,actor,case when by_admin then 'payment.proof.admin_submitted' else 'payment.proof.submitted' end,i.source,1);
 return private.ramadan_proof_result(i.id);
end $$;
create function private.ramadan_storage_authorized(bucket text,object_name text,write_object boolean) returns boolean language plpgsql stable security definer set search_path='' as $$
declare token text;op text;claims jsonb;begin
 claims:=coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb;op:=current_setting('storage.operation',true);
 if bucket is distinct from 'ramadan-payment-proofs' or claims->>'role' is distinct from 'ramadan_proof_storage_worker' or coalesce((claims->>'exp')::numeric,0)<=extract(epoch from clock_timestamp()) then return false;end if;
 if op is null or(write_object and op is distinct from 'storage.object.upload')or(not write_object and op not in('storage.object.upload','storage.object.get_authenticated'))then return false;end if;
 token:=coalesce(nullif(current_setting('request.headers',true),''),'{}')::jsonb->>'x-ramadan-storage-token';if token is null or length(token)<>64 or token!~'^[0-9a-f]{64}$'then return false;end if;
 if exists(select 1 from private.ramadan_proof_intents i where i.object_key=object_name and i.storage_token_hash=private.ramadan_proof_hash(token) and i.expires_at>clock_timestamp() and private.ramadan_payment_available(i.sponsorship_id) and not exists(select 1 from private.ramadan_payment_proofs p where p.id=i.id))then return true;end if;
 if write_object or op<>'storage.object.get_authenticated' then return false;end if;
 return exists(select 1 from private.ramadan_proof_download_grants g join private.ramadan_proof_intents i on i.id=g.proof_id join public.admin_profiles a on a.user_id=g.actor_id join auth.sessions s on s.id=g.session_id and s.user_id=g.actor_id
 where g.token_hash=private.ramadan_proof_hash(token) and i.object_key=object_name and g.expires_at>clock_timestamp() and a.status='active' and a.role in('admin','super_admin'));
exception when others then return false;end $$;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)values('ramadan-payment-proofs','ramadan-payment-proofs',false,10485760,array['image/jpeg','image/png','application/pdf']);
revoke all on storage.buckets,storage.objects from ramadan_proof_storage_worker;
grant usage on schema storage to ramadan_proof_storage_worker;
grant select on storage.buckets to ramadan_proof_storage_worker;
grant select,insert on storage.objects to ramadan_proof_storage_worker;
create policy ramadan_proof_bucket_read on storage.buckets for select to ramadan_proof_storage_worker using(id='ramadan-payment-proofs' and current_setting('storage.operation',true) in('storage.object.upload','storage.object.get_authenticated'));
create policy ramadan_proof_object_insert on storage.objects for insert to ramadan_proof_storage_worker with check(private.ramadan_storage_authorized(bucket_id,name,true));
create policy ramadan_proof_object_read on storage.objects for select to ramadan_proof_storage_worker using(private.ramadan_storage_authorized(bucket_id,name,false));


create function private.ramadan_proof_detail(target uuid,sponsor uuid)returns jsonb language plpgsql set search_path=''as $$
declare i private.ramadan_proof_intents;p private.ramadan_payment_proofs;begin perform private.ramadan_admin_campaign(target,false);if not exists(select 1 from private.ramadan_sponsorships where id=sponsor and campaign_id=target)then return null;end if;select *into p from private.ramadan_payment_proofs where sponsorship_id=sponsor;if private.active_role()='staff'then return jsonb_build_object('proof_status',case when p.id is null then 'none'else 'submitted'end);end if;if p.id is null then return jsonb_build_object('proof_status','none','proof',null);end if;select *into i from private.ramadan_proof_intents where id=p.id;return jsonb_build_object('proof_status','submitted','proof',jsonb_build_object('id',i.id,'reference',i.proof_reference,'declared_amount_minor',i.declared_amount_minor,'payment_date',i.payment_date,'source',i.source,'submitted_at',p.submitted_at,'submitted_by_actor',i.actor_id,'content_type',i.content_type,'byte_size',i.byte_size,'amount_mismatch',i.declared_amount_minor<>(select quoted_total_minor from private.ramadan_sponsorships where id=sponsor)));end $$;
create function private.ramadan_proof_download(target uuid,proof uuid,secret text)returns jsonb language plpgsql set search_path=''as $$
declare i private.ramadan_proof_intents;r private.ramadan_sponsorships;begin perform private.ramadan_admin_campaign(target,true);if secret is null or length(secret)<>64 or secret!~'^[0-9a-f]{64}$'then raise exception 'Invalid request'using errcode='22023';end if;select x.*into i from private.ramadan_proof_intents x join private.ramadan_payment_proofs p on p.id=x.id where x.id=proof and x.campaign_id=target;if i.id is null then raise exception 'Access denied'using errcode='42501';end if;select *into r from private.ramadan_sponsorships where id=i.sponsorship_id;
if(select count(*)from private.ramadan_proof_download_grants where actor_id=auth.uid()and expires_at>clock_timestamp())>=2000 then raise exception 'Download unavailable'using errcode='PT409';end if;
insert into private.ramadan_proof_download_grants(token_hash,proof_id,actor_id,session_id)values(private.ramadan_proof_hash(secret),proof,auth.uid(),(auth.jwt()->>'session_id')::uuid);
insert into private.ramadan_payment_audit(campaign_id,sponsorship_id,proof_id,actor_id,action,file_count)values(target,r.id,i.id,auth.uid(),'payment.proof.downloaded',1);
return jsonb_build_object('proof_id',i.id,'proof_reference',i.proof_reference,'reference',r.public_reference,'object_key',i.object_key,'content_type',i.content_type,'extension',i.extension,'byte_size',i.byte_size,'content_hash',i.content_hash);end $$;
create function public.public_ramadan_payment_exchange(payload jsonb) returns jsonb language sql security definer set search_path='' as $$select private.ramadan_payment_exchange(payload)$$;
create function public.public_ramadan_payment_context(target_slug text,session_secret text) returns jsonb language sql security definer set search_path='' as $$select private.ramadan_payment_context(target_slug,session_secret)$$;
create function public.public_ramadan_proof_prepare(target_slug text,session_secret text,payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$declare rid uuid;result jsonb;begin
 rid:=private.ramadan_payment_session_sponsorship(target_slug,session_secret);if rid is null then raise exception 'Access denied' using errcode='42501';end if;
 result:=private.ramadan_proof_prepare(rid,payload,false);if private.ramadan_payment_session_sponsorship(target_slug,session_secret) is distinct from rid then raise exception 'Access denied' using errcode='42501';end if;return result;end $$;
create function public.public_ramadan_proof_commit(target_slug text,session_secret text,target_proof uuid) returns jsonb language plpgsql security definer set search_path='' as $$declare rid uuid;result jsonb;begin
 rid:=private.ramadan_payment_session_sponsorship(target_slug,session_secret);if rid is null then raise exception 'Access denied' using errcode='42501';end if;
 result:=private.ramadan_proof_commit(rid,target_proof,false);if private.ramadan_payment_session_sponsorship(target_slug,session_secret) is distinct from rid then raise exception 'Access denied' using errcode='42501';end if;return result;end $$;
create function public.admin_ramadan_proof_prepare(target_campaign uuid,target_sponsorship uuid,payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$begin
 perform private.require_campaign_access('manage');if not exists(select 1 from private.ramadan_sponsorships where id=target_sponsorship and campaign_id=target_campaign)then raise exception 'Access denied' using errcode='42501';end if;
 return private.ramadan_proof_prepare(target_sponsorship,payload,true);end $$;
create function public.admin_ramadan_proof_commit(target_campaign uuid,target_proof uuid) returns jsonb language plpgsql security definer set search_path='' as $$declare rid uuid;begin
 perform private.require_campaign_access('manage');select sponsorship_id into rid from private.ramadan_proof_intents where id=target_proof and campaign_id=target_campaign;if rid is null then raise exception 'Access denied' using errcode='42501';end if;return private.ramadan_proof_commit(rid,target_proof,true);end $$;


create function public.admin_ramadan_proof_detail(target_campaign uuid,target_sponsorship uuid)returns jsonb language sql security definer set search_path=''as $$select private.ramadan_proof_detail(target_campaign,target_sponsorship)$$;
create function public.admin_ramadan_proof_download(target_campaign uuid,target_proof uuid,grant_secret text)returns jsonb language sql security definer set search_path=''as $$select private.ramadan_proof_download(target_campaign,target_proof,grant_secret)$$;
-- No private schema usage, business CRUD, generic privileged client or signing key.
do $$declare f record;t record;begin for f in select p.oid from pg_proc p join pg_namespace n on n.oid=p.pronamespace where(n.nspname='private'and p.proname like'ramadan_%')or(n.nspname='public'and(p.proname like'public_ramadan_payment_%'or p.proname like'public_ramadan_proof_%'or p.proname like'admin_ramadan_proof_%'))loop execute format('revoke all on function %s from public,anon,authenticated,service_role,supabase_auth_admin,authenticator,campaign_scheduler,qurban_proof_storage_worker,ramadan_proof_storage_worker',f.oid::regprocedure);end loop;for t in select c.oid::regclass tbl from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='private'and c.relkind='r'loop execute format('revoke all on %s from ramadan_proof_storage_worker',t.tbl);end loop;end $$;
grant execute on function private.ramadan_storage_authorized(text,text,boolean)to ramadan_proof_storage_worker;
grant execute on function public.public_ramadan_payment_exchange(jsonb),public.public_ramadan_payment_context(text,text),public.public_ramadan_proof_prepare(text,text,jsonb),public.public_ramadan_proof_commit(text,text,uuid)to anon,authenticated;
grant execute on function public.admin_ramadan_proof_prepare(uuid,uuid,jsonb),public.admin_ramadan_proof_commit(uuid,uuid),public.admin_ramadan_proof_detail(uuid,uuid),public.admin_ramadan_proof_download(uuid,uuid,text)to authenticated;
notify pgrst,'reload schema';commit;
