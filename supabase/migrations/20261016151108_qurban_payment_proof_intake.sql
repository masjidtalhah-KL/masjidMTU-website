begin;
-- Owner-approved Storage-only identity. No signing key/service_role in application runtime.
do $$ begin if not exists(select 1 from pg_roles where rolname='qurban_proof_storage_worker') then create role qurban_proof_storage_worker nologin noinherit nobypassrls;end if;end $$;
alter role qurban_proof_storage_worker nologin noinherit nobypassrls;
grant qurban_proof_storage_worker to authenticator;
create function private.qurban_proof_hash(s text) returns text language sql immutable set search_path='' as $$select encode(sha256(convert_to(s,'UTF8')),'hex')$$;
create table private.qurban_payment_access(
 id uuid primary key default gen_random_uuid(),campaign_id uuid not null,registration_id uuid not null unique,
 secret_hash text not null check(secret_hash~'^[0-9a-f]{64}$'),created_at timestamptz not null default clock_timestamp(),
 foreign key(registration_id,campaign_id) references private.qurban_registrations(id,campaign_id) on delete restrict
);
create table private.qurban_payment_sessions(
 token_hash text primary key check(token_hash~'^[0-9a-f]{64}$'),access_id uuid not null references private.qurban_payment_access(id) on delete restrict,
 created_at timestamptz not null default clock_timestamp(),expires_at timestamptz not null default(clock_timestamp()+interval '20 minutes'),check(expires_at>created_at)
);
create index qurban_payment_sessions_access on private.qurban_payment_sessions(access_id,expires_at);
create table private.qurban_proof_intents(
 id uuid primary key default gen_random_uuid(),campaign_id uuid not null,registration_id uuid not null,
 proof_reference text not null unique default('PFP-'||replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-','')) check(proof_reference~'^PFP-[0-9a-f]{64}$'),
 key_hash text not null unique check(key_hash~'^[0-9a-f]{64}$'),payload_hash text not null check(payload_hash~'^[0-9a-f]{64}$'),storage_token_hash text not null check(storage_token_hash~'^[0-9a-f]{64}$'),
 declared_amount_minor bigint not null check(declared_amount_minor between 1 and 100000000000),payment_date date not null check(payment_date<=(clock_timestamp() at time zone 'Asia/Kuala_Lumpur')::date and isfinite(payment_date)),
 content_type text not null check(content_type in('image/jpeg','image/png','application/pdf')),extension text not null check(extension in('jpg','png','pdf')),
 byte_size integer not null check(byte_size between 1 and 10485760),content_hash text not null check(content_hash~'^[0-9a-f]{64}$'),
 source text not null check(source in('participant_upload','admin_assisted_upload')),actor_id uuid references auth.users(id) on delete restrict,
 created_at timestamptz not null default clock_timestamp(),expires_at timestamptz not null default(clock_timestamp()+interval '15 minutes'),
 object_key text generated always as(campaign_id::text||'/'||registration_id::text||'/'||id::text||'.'||extension) stored unique,
 foreign key(registration_id,campaign_id) references private.qurban_registrations(id,campaign_id) on delete restrict,
 unique(id,registration_id,campaign_id),check((source='participant_upload')=(actor_id is null)),
 check((content_type='image/jpeg' and extension='jpg') or(content_type='image/png' and extension='png')or(content_type='application/pdf' and extension='pdf')),check(expires_at>created_at)
);
create index qurban_proof_intents_registration on private.qurban_proof_intents(registration_id,expires_at);
create table private.qurban_payment_proofs(
 id uuid primary key,campaign_id uuid not null,registration_id uuid not null,status text not null default 'submitted' check(status='submitted'),
 submitted_at timestamptz not null default clock_timestamp(),version integer not null default 1 check(version=1),unique(id,registration_id,campaign_id),
 foreign key(id,registration_id,campaign_id) references private.qurban_proof_intents(id,registration_id,campaign_id) on delete restrict
);
create unique index qurban_one_open_proof on private.qurban_payment_proofs(registration_id) where status='submitted';
create index qurban_payment_proofs_campaign on private.qurban_payment_proofs(campaign_id,submitted_at,id);
create table private.qurban_payment_audit(
 id uuid primary key default gen_random_uuid(),campaign_id uuid not null references private.campaigns(id) on delete restrict,
 registration_id uuid,proof_id uuid,actor_id uuid references auth.users(id) on delete restrict,
 action text not null check(action in('payment.proof.submitted','payment.proof.admin_submitted','payment.proof.downloaded','payment.proof.bulk_downloaded')),
 source text check(source in('participant_upload','admin_assisted_upload')),file_count integer not null check(file_count between 1 and 50),occurred_at timestamptz not null default clock_timestamp(),
 foreign key(registration_id,campaign_id) references private.qurban_registrations(id,campaign_id) on delete restrict,
 foreign key(proof_id,registration_id,campaign_id) references private.qurban_payment_proofs(id,registration_id,campaign_id) on delete restrict,
 check((proof_id is null)=(registration_id is null)),
 check((action='payment.proof.submitted' and actor_id is null and source='participant_upload' and proof_id is not null and file_count=1)or(action='payment.proof.admin_submitted' and actor_id is not null and source='admin_assisted_upload' and proof_id is not null and file_count=1)or(action='payment.proof.downloaded' and actor_id is not null and source is null and proof_id is not null and file_count=1)or(action='payment.proof.bulk_downloaded' and actor_id is not null and source is null and proof_id is null and registration_id is null))
);
create unique index qurban_payment_submission_audit on private.qurban_payment_audit(proof_id) where action in('payment.proof.submitted','payment.proof.admin_submitted');
create index qurban_payment_audit_page on private.qurban_payment_audit(campaign_id,occurred_at,id);
create table private.qurban_proof_download_grants(
 token_hash text not null check(token_hash~'^[0-9a-f]{64}$'),proof_id uuid not null references private.qurban_payment_proofs(id) on delete restrict,
 actor_id uuid not null references auth.users(id) on delete restrict,session_id uuid not null,created_at timestamptz not null default clock_timestamp(),expires_at timestamptz not null default(clock_timestamp()+interval '5 minutes'),
 primary key(token_hash,proof_id),check(expires_at>created_at)
);
create index qurban_proof_download_expiry on private.qurban_proof_download_grants(expires_at);
create function private.qurban_payment_guard() returns trigger language plpgsql set search_path='' as $$
begin
 if tg_op='DELETE' then
  if tg_table_name in('qurban_payment_sessions','qurban_proof_download_grants') then if old.expires_at<clock_timestamp() then return old;end if;end if;
  raise exception 'Immutable payment evidence' using errcode='42501';
 end if;
 if tg_op='UPDATE' then
  if tg_table_name='qurban_proof_intents' then if not exists(select 1 from private.qurban_payment_proofs where id=old.id) and(to_jsonb(new)-'expires_at'-'object_key')=(to_jsonb(old)-'expires_at'-'object_key') and new.expires_at>=old.expires_at and new.expires_at<=clock_timestamp()+interval '15 minutes' then return new;end if;end if;
  raise exception 'Immutable payment evidence' using errcode='42501';
 end if;
 if tg_table_name='qurban_payment_sessions' then new.created_at:=clock_timestamp();new.expires_at:=new.created_at+interval '20 minutes';
 elsif tg_table_name='qurban_proof_download_grants' then new.created_at:=clock_timestamp();new.expires_at:=new.created_at+interval '5 minutes';
 elsif tg_table_name='qurban_payment_audit' then new.occurred_at:=clock_timestamp();
 elsif tg_table_name='qurban_payment_proofs' then
  if new.status<>'submitted' or new.version<>1 then raise exception 'Invalid evidence' using errcode='23514';end if;new.submitted_at:=clock_timestamp();
 else new.created_at:=clock_timestamp();if tg_table_name='qurban_proof_intents' then new.expires_at:=new.created_at+interval '15 minutes';end if;
 end if;return new;
end $$;
do $$declare t text;begin foreach t in array array['qurban_payment_access','qurban_payment_sessions','qurban_proof_intents','qurban_payment_proofs','qurban_payment_audit','qurban_proof_download_grants']loop
 execute format('create trigger %I before insert or update or delete on private.%I for each row execute function private.qurban_payment_guard()',t||'_guard',t);
 execute format('alter table private.%I enable row level security',t);
 execute format('revoke all on private.%I from public,anon,authenticated,service_role,supabase_auth_admin,authenticator,campaign_scheduler,qurban_proof_storage_worker',t);
 end loop;end $$;
create function private.qurban_proof_cancellation_guard() returns trigger language plpgsql set search_path='' as $$begin
 if new.status='cancelled' and old.status is distinct from new.status and exists(select 1 from private.qurban_payment_proofs where registration_id=old.id and status='submitted')then raise exception 'Bukti bayaran telah dihantar. Selesaikan semakan bayaran terlebih dahulu.' using errcode='PT409';end if;return new;end $$;
create trigger qurban_proof_cancellation_guard before update on private.qurban_registrations for each row execute function private.qurban_proof_cancellation_guard();
create function private.qurban_payment_registration_payload_valid(p jsonb) returns boolean language sql immutable set search_path='' as $$
 select jsonb_typeof(p)='object' and p?'payment_access_secret' and jsonb_typeof(p->'payment_access_secret')='string' and length(p->>'payment_access_secret')=64 and p->>'payment_access_secret'~'^[0-9a-f]{64}$' and private.qurban_submission_payload_valid(p-'payment_access_secret') and octet_length(p::text)<=65536
$$;

create or replace function private.qurban_registration_submit(payload jsonb) returns jsonb
language plpgsql set search_path='' as $$
declare c private.campaigns; a private.qurban_akad_versions; r private.qurban_registrations;
  receipt private.qurban_submission_idempotency; ctx jsonb; e jsonb; snap jsonb;
  kh text; ph text; n integer; pay private.qurban_payment_access;
begin
  if not private.qurban_payment_registration_payload_valid(payload) then raise exception 'Invalid registration' using errcode='22023'; end if;
  kh:=encode(sha256(convert_to(payload->>'idempotency_key','UTF8')),'hex');
  ph:=encode(sha256(convert_to(payload::text,'UTF8')),'hex');
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('qurban-submission:'||kh,0));
  select * into receipt from private.qurban_submission_idempotency where key_hash=kh;
  if receipt.key_hash is not null then
    if receipt.payload_hash<>ph then raise exception 'Review registration again' using errcode='PT409'; end if;
    -- A committed replay is not a fresh admission. Returns no PII, even after closure.
    select * into r from private.qurban_registrations where id=receipt.registration_id;
  else
    -- Same lock namespaces as the reviewed flag setter; stable order, then campaign,
    -- then newly-created Registration/children. No admin-identity lock is acquired.
    perform pg_catalog.pg_advisory_xact_lock_shared(pg_catalog.hashtextextended('campaign-system-flag:campaigns.enabled',0));
    perform pg_catalog.pg_advisory_xact_lock_shared(pg_catalog.hashtextextended('campaign-system-flag:qurban.enabled',0));
    perform 1 from private.system_feature_flags where flag_key in ('campaigns.enabled','qurban.enabled') order by flag_key for share;
    select * into c from private.campaigns where slug=payload->>'slug' for update;
    ctx:=private.qurban_registration_context(payload->>'slug');
    if ctx is null or ctx->'campaign_version' is distinct from payload->'expected_campaign_version'
      or ctx->'global_flag_version' is distinct from payload->'expected_global_flag_version'
      or ctx->'module_flag_version' is distinct from payload->'expected_module_flag_version'
      or ctx->>'akad_reference' is distinct from payload->>'expected_akad_reference'
      or ctx->>'akad_hash' is distinct from payload->>'expected_akad_hash' then raise exception 'Review registration again' using errcode='PT409'; end if;
    n:=jsonb_array_length(payload->'participants');
    if n>(ctx->>'max_participants')::integer or exists(select 1 from jsonb_array_elements(payload->'participants') p where not (ctx->'allowed_purposes') ? (p->>'purpose')) then
      raise exception 'Invalid registration' using errcode='22023'; end if;
    select * into a from private.qurban_akad_versions where campaign_id=c.id and version_reference=ctx->>'akad_reference';
    insert into private.qurban_registrations(campaign_id,applicant_name,phone,address,email,attendance,same_cattle_preference,
      campaign_config_version,campaign_revision,submission_configuration,quoted_participation_count)
    values(c.id,payload->'applicant'->>'name',payload->'applicant'->>'phone',payload->'applicant'->>'address',payload->'applicant'->>'email',payload->>'attendance',
      (payload->>'same_cattle_preference')::boolean,c.config_version,c.version,c.configuration,n) returning * into r;
    for e in select value from jsonb_array_elements(payload->'participants') loop
      insert into private.qurban_participations(registration_id,participant_name,purpose) values(r.id,e->>'name',e->>'purpose');
    end loop;
    select jsonb_agg(jsonb_build_object('id',id,'participant_name',participant_name,'purpose',purpose,'version',version) order by created_at,id) into snap
      from private.qurban_participations where registration_id=r.id;
    insert into private.qurban_consent_acceptances(registration_id,campaign_id,akad_version_id,participation_snapshot) values(r.id,c.id,a.id,snap);
    insert into private.qurban_submission_idempotency(key_hash,payload_hash,registration_id) values(kh,ph,r.id);
    insert into private.qurban_submission_audit(registration_id,campaign_id,action,participant_count,request_hash) values(r.id,c.id,'registration.submitted',n,kh);
    if not private.campaign_registration_window_available(c.status,c.registration_opens_at,c.registration_closes_at,clock_timestamp()) then
      raise exception 'Review registration again' using errcode='PT409'; end if;
  end if;
  insert into private.qurban_payment_access(campaign_id,registration_id,secret_hash) values(r.campaign_id,r.id,private.qurban_proof_hash(payload->>'payment_access_secret')) on conflict(registration_id) do nothing;
  select * into pay from private.qurban_payment_access where registration_id=r.id;
  if pay.secret_hash is distinct from private.qurban_proof_hash(payload->>'payment_access_secret') then raise exception 'Review registration again' using errcode='PT409';end if;
  return jsonb_build_object('payment_access_id',pay.id,'reference',r.public_reference,'participant_count',r.quoted_participation_count,'currency',r.quoted_currency,
    'price_per_share_minor',r.quoted_price_per_share_minor,'total_minor',r.quoted_total_minor);
exception when sqlstate 'PT409' or sqlstate '22023' then raise;
  when check_violation or invalid_text_representation or numeric_value_out_of_range then raise exception 'Invalid registration' using errcode='22023';
  when others then raise exception 'Registration unavailable' using errcode='PT503';
end $$;

-- Existing registered people may submit proof after registration closure. Not after archive/cancellation/flags OFF.
create function private.qurban_payment_available(registration uuid) returns boolean language sql stable set search_path='' as $$
 select exists(select 1 from private.qurban_registrations r join private.campaigns c on c.id=r.campaign_id where r.id=registration and r.status='submitted' and c.type_key='qurban' and c.config_version=1 and c.status<>'archived' and private.qurban_config_v1_valid(c.configuration)
 and exists(select 1 from private.system_feature_flags where flag_key='campaigns.enabled' and enabled) and exists(select 1 from private.system_feature_flags where flag_key='qurban.enabled' and enabled))
$$;
create function private.qurban_payment_session_registration(slug text,secret text) returns uuid language plpgsql set search_path='' as $$declare result uuid;begin
 if secret is null or secret!~'^[0-9a-f]{64}$' or length(secret)<>64 or not private.qurban_text_valid(slug,3,100)then return null;end if;
 select a.registration_id into result from private.qurban_payment_sessions s join private.qurban_payment_access a on a.id=s.access_id join private.campaigns c on c.id=a.campaign_id
 where s.token_hash=private.qurban_proof_hash(secret) and s.expires_at>clock_timestamp() and c.slug=qurban_payment_session_registration.slug and private.qurban_payment_available(a.registration_id);return result;
end $$;
create function private.qurban_payment_exchange(p jsonb) returns jsonb language plpgsql set search_path='' as $$declare a private.qurban_payment_access;s private.qurban_payment_sessions;begin
 if jsonb_typeof(p) is distinct from 'object' or octet_length(p::text)>1024 or not p?&array['slug','access_id','access_secret','session_secret'] or(select count(*) from jsonb_object_keys(p))<>4
 or jsonb_typeof(p->'slug')<>'string' or not private.qurban_text_valid(p->>'slug',3,100) or jsonb_typeof(p->'access_id')<>'string' or p->>'access_id'!~'^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$'
 or jsonb_typeof(p->'access_secret')<>'string' or p->>'access_secret'!~'^[0-9a-f]{64}$' or length(p->>'access_secret')<>64 or jsonb_typeof(p->'session_secret')<>'string' or p->>'session_secret'!~'^[0-9a-f]{64}$' or length(p->>'session_secret')<>64 then return null;end if;
 select pa.* into a from private.qurban_payment_access pa join private.campaigns c on c.id=pa.campaign_id where pa.id=(p->>'access_id')::uuid and c.slug=p->>'slug' and pa.secret_hash=private.qurban_proof_hash(p->>'access_secret') and private.qurban_payment_available(pa.registration_id) for update of pa;
 if not found then return null;end if;
 delete from private.qurban_payment_sessions where access_id=a.id and expires_at<clock_timestamp();
 if(select count(*) from private.qurban_payment_sessions where access_id=a.id)>=10 then return null;end if;
 insert into private.qurban_payment_sessions(token_hash,access_id) values(private.qurban_proof_hash(p->>'session_secret'),a.id) on conflict(token_hash) do nothing;
 select * into s from private.qurban_payment_sessions where token_hash=private.qurban_proof_hash(p->>'session_secret') and access_id=a.id;
 if s.token_hash is null then return null;end if;return jsonb_build_object('expires_at',s.expires_at);
exception when invalid_text_representation then return null;end $$;
create function private.qurban_payment_context(slug text,secret text) returns jsonb language plpgsql set search_path='' as $$declare rid uuid;r private.qurban_registrations;begin
 rid:=private.qurban_payment_session_registration(slug,secret);if rid is null then return null;end if;select * into r from private.qurban_registrations where id=rid;
 return jsonb_build_object('reference',r.public_reference,'participant_count',r.quoted_participation_count,'currency',r.quoted_currency,'price_per_share_minor',r.quoted_price_per_share_minor,'total_minor',r.quoted_total_minor,
 'proof_status',case when exists(select 1 from private.qurban_payment_proofs where registration_id=rid)then 'submitted' else 'none' end);
end $$;
create function private.qurban_proof_payload_valid(p jsonb) returns boolean language plpgsql immutable set search_path='' as $$begin
 if jsonb_typeof(p) is distinct from 'object' or octet_length(p::text)>1024 or not p?&array['idempotency_key','declared_amount_minor','payment_date','content_type','extension','byte_size','content_hash'] or(select count(*) from jsonb_object_keys(p))<>7 then return false;end if;
 return jsonb_typeof(p->'idempotency_key')='string' and length(p->>'idempotency_key')=64 and p->>'idempotency_key'~'^[0-9a-f]{64}$'
 and jsonb_typeof(p->'declared_amount_minor')='number' and p->>'declared_amount_minor'~'^[1-9][0-9]{0,11}$' and(p->>'declared_amount_minor')::numeric<=100000000000
 and jsonb_typeof(p->'payment_date')='string' and p->>'payment_date'~'^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
 and jsonb_typeof(p->'content_type')='string' and jsonb_typeof(p->'extension')='string'
 and((p->>'content_type'='image/jpeg' and p->>'extension'='jpg')or(p->>'content_type'='image/png' and p->>'extension'='png')or(p->>'content_type'='application/pdf' and p->>'extension'='pdf'))
 and jsonb_typeof(p->'byte_size')='number' and p->>'byte_size'~'^[1-9][0-9]{0,7}$' and(p->>'byte_size')::numeric<=10485760
 and jsonb_typeof(p->'content_hash')='string' and length(p->>'content_hash')=64 and p->>'content_hash'~'^[0-9a-f]{64}$';
 exception when others then return false;end $$;
create function private.qurban_proof_result(proof uuid) returns jsonb language sql stable set search_path='' as $$
 select jsonb_build_object('proof_reference',i.proof_reference,'status',p.status,'submitted_at',p.submitted_at,'amount_mismatch',i.declared_amount_minor<>r.quoted_total_minor)
 from private.qurban_payment_proofs p join private.qurban_proof_intents i on i.id=p.id join private.qurban_registrations r on r.id=p.registration_id where p.id=proof
$$;
create function private.qurban_proof_prepare(registration uuid,p jsonb,by_admin boolean) returns jsonb language plpgsql set search_path='' as $$
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
  if exists(select 1 from private.qurban_payment_proofs where registration_id=r.id)or(select count(*) from private.qurban_proof_intents where registration_id=r.id and expires_at>clock_timestamp())>=3 then raise exception 'Proof conflict' using errcode='PT409';end if;
  insert into private.qurban_proof_intents(campaign_id,registration_id,key_hash,payload_hash,storage_token_hash,declared_amount_minor,payment_date,content_type,extension,byte_size,content_hash,source,actor_id)
  values(r.campaign_id,r.id,kh,ph,private.qurban_proof_hash(private.qurban_proof_hash('qurban-storage:'||(p->>'idempotency_key'))),(p->>'declared_amount_minor')::bigint,(p->>'payment_date')::date,p->>'content_type',p->>'extension',(p->>'byte_size')::integer,p->>'content_hash',src,actor) returning * into i;
 end if;
 if exists(select 1 from private.qurban_payment_proofs where registration_id=r.id)then raise exception 'Proof conflict' using errcode='PT409';end if;
 update private.qurban_proof_intents set expires_at=clock_timestamp()+interval '15 minutes' where id=i.id returning * into i;
 return jsonb_build_object('committed',false,'proof_id',i.id,'object_key',i.object_key,'content_type',i.content_type,'extension',i.extension,'byte_size',i.byte_size,'content_hash',i.content_hash);
exception when datetime_field_overflow or invalid_datetime_format or invalid_text_representation or check_violation then raise exception 'Invalid proof' using errcode='22023';end $$;
create function private.qurban_proof_commit(registration uuid,proof uuid,by_admin boolean) returns jsonb language plpgsql set search_path='' as $$
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
 if i.expires_at<=clock_timestamp() or exists(select 1 from private.qurban_payment_proofs where registration_id=r.id)then raise exception 'Proof conflict' using errcode='PT409';end if;
 select * into o from storage.objects where bucket_id='qurban-payment-proofs' and name=i.object_key for share;
 if o.id is null or o.metadata->>'size' is distinct from i.byte_size::text or o.metadata->>'mimetype' is distinct from i.content_type or o.user_metadata->>'sha256' is distinct from i.content_hash then raise exception 'Proof unavailable' using errcode='PT409';end if;
 insert into private.qurban_payment_proofs(id,campaign_id,registration_id) values(i.id,i.campaign_id,i.registration_id);
 insert into private.qurban_payment_audit(campaign_id,registration_id,proof_id,actor_id,action,source,file_count)values(i.campaign_id,i.registration_id,i.id,actor,case when by_admin then 'payment.proof.admin_submitted' else 'payment.proof.submitted' end,i.source,1);
 return private.qurban_proof_result(i.id);
end $$;
create function private.qurban_storage_authorized(bucket text,object_name text,write_object boolean) returns boolean language plpgsql stable security definer set search_path='' as $$
declare token text;op text;claims jsonb;begin
 claims:=coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb;op:=current_setting('storage.operation',true);
 if bucket is distinct from 'qurban-payment-proofs' or claims->>'role' is distinct from 'qurban_proof_storage_worker' or coalesce((claims->>'exp')::numeric,0)<=extract(epoch from clock_timestamp()) then return false;end if;
 if op is null or(write_object and op is distinct from 'storage.object.upload')or(not write_object and op not in('storage.object.upload','storage.object.get_authenticated'))then return false;end if;
 token:=coalesce(nullif(current_setting('request.headers',true),''),'{}')::jsonb->>'x-qurban-storage-token';if token is null or length(token)<>64 or token!~'^[0-9a-f]{64}$'then return false;end if;
 if exists(select 1 from private.qurban_proof_intents i where i.object_key=object_name and i.storage_token_hash=private.qurban_proof_hash(token) and i.expires_at>clock_timestamp() and private.qurban_payment_available(i.registration_id) and not exists(select 1 from private.qurban_payment_proofs p where p.id=i.id))then return true;end if;
 if write_object or op<>'storage.object.get_authenticated' then return false;end if;
 return exists(select 1 from private.qurban_proof_download_grants g join private.qurban_proof_intents i on i.id=g.proof_id join public.admin_profiles a on a.user_id=g.actor_id join auth.sessions s on s.id=g.session_id and s.user_id=g.actor_id
 where g.token_hash=private.qurban_proof_hash(token) and i.object_key=object_name and g.expires_at>clock_timestamp() and a.status='active' and a.role in('admin','super_admin'));
exception when others then return false;end $$;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)values('qurban-payment-proofs','qurban-payment-proofs',false,10485760,array['image/jpeg','image/png','application/pdf']);
revoke all on storage.buckets,storage.objects from qurban_proof_storage_worker;
grant usage on schema storage to qurban_proof_storage_worker;
grant select on storage.buckets to qurban_proof_storage_worker;
grant select,insert on storage.objects to qurban_proof_storage_worker;
create policy qurban_proof_bucket_read on storage.buckets for select to qurban_proof_storage_worker using(id='qurban-payment-proofs' and current_setting('storage.operation',true) in('storage.object.upload','storage.object.get_authenticated'));
create policy qurban_proof_object_insert on storage.objects for insert to qurban_proof_storage_worker with check(private.qurban_storage_authorized(bucket_id,name,true));
create policy qurban_proof_object_read on storage.objects for select to qurban_proof_storage_worker using(private.qurban_storage_authorized(bucket_id,name,false));

create function private.qurban_payment_list(target uuid,options jsonb) returns jsonb language plpgsql set search_path='' as $$
declare c private.campaigns;staff boolean;pg integer;sz integer;term text;st text;result jsonb;begin
 c:=private.qurban_admin_campaign(target,false);staff:=private.active_role()='staff';
 if jsonb_typeof(options) is distinct from 'object' or octet_length(options::text)>1024 or not options?&array['page','page_size','search','proof_status'] or(select count(*) from jsonb_object_keys(options))<>4 or jsonb_typeof(options->'page')<>'number' or jsonb_typeof(options->'page_size')<>'number' or options->>'page'!~'^[1-9][0-9]{0,4}$' or options->>'page_size'!~'^[1-9][0-9]?$' or jsonb_typeof(options->'search')<>'string' or jsonb_typeof(options->'proof_status')<>'string' then raise exception 'Invalid request' using errcode='22023';end if;
 pg:=(options->>'page')::integer;sz:=(options->>'page_size')::integer;term:=lower(options->>'search');st:=options->>'proof_status';
 if pg>10000 or sz>50 or length(term)>100 or(term<>'' and not private.qurban_text_valid(term,1,100))or st not in('all','none','submitted')then raise exception 'Invalid request' using errcode='22023';end if;
 with all_r as materialized(select r.*,p.id proof_id,p.submitted_at,i.proof_reference,i.declared_amount_minor,i.payment_date,i.source,i.actor_id from private.qurban_registrations r left join private.qurban_payment_proofs p on p.registration_id=r.id left join private.qurban_proof_intents i on i.id=p.id where r.campaign_id=target),
 filtered as materialized(select * from all_r r where(st='all' or(st='none' and proof_id is null)or(st='submitted' and proof_id is not null)) and(term='' or lower(public_reference)=term or(staff=false and(starts_with(lower(applicant_name),term) or(term~'^[+0-9 ()-]+$' and length(regexp_replace(term,'[^0-9]','','g'))>0 and starts_with(regexp_replace(phone,'[^0-9]','','g'),regexp_replace(term,'[^0-9]','','g'))))))),
 paged as(select * from filtered order by created_at desc,id limit sz offset(pg-1)*sz)
 select jsonb_build_object('campaign_id',target,'can_manage',not staff,'recent_mfa',private.active_role()<>'super_admin' or private.recent_totp(),'page',pg,'page_size',sz,'total',(select count(*) from filtered),
 'summary',jsonb_build_object('active_without_proof',(select count(*) from all_r where status='submitted' and proof_id is null),'active_with_proof',(select count(*) from all_r where status='submitted' and proof_id is not null)),
 'items',coalesce((select jsonb_agg(jsonb_build_object('registration_id',r.id,'reference',r.public_reference,'registration_status',r.status,'proof_status',case when r.proof_id is null then 'none' else 'submitted' end)||case when staff then '{}'::jsonb else jsonb_build_object('applicant_name',r.applicant_name,'quote',jsonb_build_object('currency',r.quoted_currency,'participant_count',r.quoted_participation_count,'price_per_share_minor',r.quoted_price_per_share_minor,'total_minor',r.quoted_total_minor),
 'proof',case when r.proof_id is null then null else jsonb_build_object('id',r.proof_id,'reference',r.proof_reference,'declared_amount_minor',r.declared_amount_minor,'payment_date',r.payment_date,'source',r.source,'submitted_by_actor',r.actor_id,'submitted_at',r.submitted_at,'amount_mismatch',r.declared_amount_minor<>r.quoted_total_minor)end)end order by r.created_at desc,r.id)from paged r),'[]'::jsonb)) into result;return result;
end $$;
create function private.qurban_proof_download(target uuid,payload jsonb) returns jsonb language plpgsql set search_path='' as $$
declare c private.campaigns;chosen uuid;cursor_id uuid;curtime timestamptz;row record;items jsonb:='[]';total bigint:=0;n integer:=0;more boolean:=false;last_id uuid;token text;begin
 c:=private.qurban_admin_campaign(target,true);
 if jsonb_typeof(payload) is distinct from 'object' or octet_length(payload::text)>512 or not payload?&array['proof_id','cursor','grant_secret'] or(select count(*) from jsonb_object_keys(payload))<>3 or jsonb_typeof(payload->'grant_secret')<>'string' or length(payload->>'grant_secret')<>64 or payload->>'grant_secret'!~'^[0-9a-f]{64}$' then raise exception 'Invalid request' using errcode='22023';end if;
 if payload->'proof_id'<>'null'::jsonb then if jsonb_typeof(payload->'proof_id')<>'string' or payload->>'proof_id'!~'^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$' then raise exception 'Invalid request' using errcode='22023';end if;chosen:=(payload->>'proof_id')::uuid;end if;
 if payload->'cursor'<>'null'::jsonb then if chosen is not null or jsonb_typeof(payload->'cursor')<>'string' or payload->>'cursor'!~'^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$'then raise exception 'Invalid request' using errcode='22023';end if;cursor_id:=(payload->>'cursor')::uuid;select submitted_at into curtime from private.qurban_payment_proofs where id=cursor_id and campaign_id=target;if not found then raise exception 'Access denied' using errcode='42501';end if;end if;
 if(select count(*)from private.qurban_proof_download_grants where actor_id=auth.uid() and expires_at>clock_timestamp())>2000 then raise exception 'Download unavailable' using errcode='PT409';end if;
 token:=private.qurban_proof_hash(payload->>'grant_secret');
 for row in select i.*,r.public_reference,p.submitted_at from private.qurban_payment_proofs p join private.qurban_proof_intents i on i.id=p.id join private.qurban_registrations r on r.id=p.registration_id where p.campaign_id=target and(chosen is null or p.id=chosen)and(cursor_id is null or(p.submitted_at,p.id)>(curtime,cursor_id))order by p.submitted_at,p.id limit 51 loop
  if n>=50 or total+row.byte_size>104857600 then more:=true;exit;end if;
  insert into private.qurban_proof_download_grants(token_hash,proof_id,actor_id,session_id)values(token,row.id,auth.uid(),(auth.jwt()->>'session_id')::uuid) on conflict do nothing;
  items:=items||jsonb_build_array(jsonb_build_object('proof_id',row.id,'proof_reference',row.proof_reference,'reference',row.public_reference,'object_key',row.object_key,'content_type',row.content_type,'extension',row.extension,'byte_size',row.byte_size,'content_hash',row.content_hash));n:=n+1;total:=total+row.byte_size;last_id:=row.id;
 end loop;
 if n=0 then raise exception 'Access denied' using errcode='42501';end if;
 insert into private.qurban_payment_audit(campaign_id,registration_id,proof_id,actor_id,action,file_count)values(target,case when chosen is not null then(select registration_id from private.qurban_payment_proofs where id=chosen)else null end,chosen,auth.uid(),case when chosen is null then 'payment.proof.bulk_downloaded' else 'payment.proof.downloaded' end,n);
 return jsonb_build_object('items',items,'file_count',n,'byte_size',total,'next_cursor',case when more then last_id else null end,'captured_at',clock_timestamp());
end $$;
create function private.qurban_payment_activity(target uuid,page_number integer) returns jsonb language plpgsql set search_path='' as $$begin
 perform private.require_campaign_access('audit');perform private.qurban_admin_campaign(target,false);if page_number is null or page_number not between 1 and 10000 then raise exception 'Invalid request' using errcode='22023';end if;
 return jsonb_build_object('page',page_number,'items',coalesce((select jsonb_agg(to_jsonb(e))from(select id,registration_id,proof_id,actor_id,action,source,file_count,occurred_at from private.qurban_payment_audit where campaign_id=target order by occurred_at desc,id desc limit 50 offset(page_number-1)*50)e),'[]'::jsonb));end $$;
create function public.admin_qurban_payment_list(target_campaign uuid,options jsonb) returns jsonb language sql security definer set search_path='' as $$select private.qurban_payment_list(target_campaign,options)$$;
create function public.admin_qurban_proof_download(target_campaign uuid,payload jsonb) returns jsonb language sql security definer set search_path='' as $$select private.qurban_proof_download(target_campaign,payload)$$;
create function public.admin_qurban_payment_activity(target_campaign uuid,page_number integer) returns jsonb language sql security definer set search_path='' as $$select private.qurban_payment_activity(target_campaign,page_number)$$;

create function public.public_qurban_payment_exchange(payload jsonb) returns jsonb language sql security definer set search_path='' as $$select private.qurban_payment_exchange(payload)$$;
create function public.public_qurban_payment_context(target_slug text,session_secret text) returns jsonb language sql security definer set search_path='' as $$select private.qurban_payment_context(target_slug,session_secret)$$;
create function public.public_qurban_proof_prepare(target_slug text,session_secret text,payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$declare rid uuid;result jsonb;begin
 rid:=private.qurban_payment_session_registration(target_slug,session_secret);if rid is null then raise exception 'Access denied' using errcode='42501';end if;
 result:=private.qurban_proof_prepare(rid,payload,false);if private.qurban_payment_session_registration(target_slug,session_secret) is distinct from rid then raise exception 'Access denied' using errcode='42501';end if;return result;end $$;
create function public.public_qurban_proof_commit(target_slug text,session_secret text,target_proof uuid) returns jsonb language plpgsql security definer set search_path='' as $$declare rid uuid;result jsonb;begin
 rid:=private.qurban_payment_session_registration(target_slug,session_secret);if rid is null then raise exception 'Access denied' using errcode='42501';end if;
 result:=private.qurban_proof_commit(rid,target_proof,false);if private.qurban_payment_session_registration(target_slug,session_secret) is distinct from rid then raise exception 'Access denied' using errcode='42501';end if;return result;end $$;
create function public.admin_qurban_proof_prepare(target_campaign uuid,target_registration uuid,payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$begin
 perform private.require_campaign_access('manage');if not exists(select 1 from private.qurban_registrations where id=target_registration and campaign_id=target_campaign)then raise exception 'Access denied' using errcode='42501';end if;
 return private.qurban_proof_prepare(target_registration,payload,true);end $$;
create function public.admin_qurban_proof_commit(target_campaign uuid,target_proof uuid) returns jsonb language plpgsql security definer set search_path='' as $$declare rid uuid;begin
 perform private.require_campaign_access('manage');select registration_id into rid from private.qurban_proof_intents where id=target_proof and campaign_id=target_campaign;if rid is null then raise exception 'Access denied' using errcode='42501';end if;return private.qurban_proof_commit(rid,target_proof,true);end $$;

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
,payments as materialized(select p.id,p.registration_id,i.proof_reference,i.declared_amount_minor,i.payment_date,i.source,p.submitted_at from private.qurban_payment_proofs p join private.qurban_proof_intents i on i.id=p.id join regs r on r.id=p.registration_id)
 select jsonb_build_object('payments',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'registration_id',p.registration_id,'proof_reference',p.proof_reference,'quoted_total_minor',r.quoted_total_minor,'declared_amount_minor',p.declared_amount_minor,'payment_date',p.payment_date,'source',p.source,'status','submitted','submitted_at',p.submitted_at)order by p.submitted_at,p.id)from payments p join regs r on r.id=p.registration_id),'[]'::jsonb),'campaign',jsonb_build_object('id',c.id,'title',c.title,'campaign_year',c.configuration->'campaign_year','hijri_display_label',c.configuration->>'hijri_display_label',
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


do $$declare f record;begin for f in select p.oid::regprocedure signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in('private','public') and(p.proname like 'qurban_payment_%' or p.proname like 'qurban_proof_%' or p.proname like 'public_qurban_payment_%' or p.proname like 'public_qurban_proof_%' or p.proname like 'admin_qurban_payment_%' or p.proname like 'admin_qurban_proof_%' or p.proname='qurban_storage_authorized')loop execute format('revoke all on function %s from public,anon,authenticated,service_role,supabase_auth_admin,authenticator,campaign_scheduler,qurban_proof_storage_worker',f.signature);end loop;end $$;
grant execute on function private.qurban_storage_authorized(text,text,boolean) to qurban_proof_storage_worker;
grant execute on function public.public_qurban_payment_exchange(jsonb),public.public_qurban_payment_context(text,text),public.public_qurban_proof_prepare(text,text,jsonb),public.public_qurban_proof_commit(text,text,uuid) to anon,authenticated;
grant execute on function public.admin_qurban_proof_prepare(uuid,uuid,jsonb),public.admin_qurban_proof_commit(uuid,uuid) to authenticated;
grant execute on function public.admin_qurban_payment_list(uuid,jsonb),public.admin_qurban_proof_download(uuid,jsonb),public.admin_qurban_payment_activity(uuid,integer) to authenticated;
notify pgrst,'reload schema';

commit;
