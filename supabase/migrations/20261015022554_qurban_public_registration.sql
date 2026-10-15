begin;

-- Admission receipts contain hashes only, never a raw request/idempotency secret.
create table private.qurban_submission_idempotency (
  key_hash text primary key check(key_hash ~ '^[0-9a-f]{64}$'),
  payload_hash text not null check(payload_hash ~ '^[0-9a-f]{64}$'),
  registration_id uuid not null unique references private.qurban_registrations(id) on delete restrict,
  created_at timestamptz not null default clock_timestamp() check(isfinite(created_at))
);
create table private.qurban_submission_audit (
  registration_id uuid primary key,
  campaign_id uuid not null,
  action text not null check(action='registration.submitted'),
  participant_count integer not null check(participant_count between 1 and 100),
  request_hash text not null unique references private.qurban_submission_idempotency(key_hash) on delete restrict,
  occurred_at timestamptz not null default clock_timestamp() check(isfinite(occurred_at)),
  foreign key(registration_id,campaign_id) references private.qurban_registrations(id,campaign_id) on delete restrict
);
create index qurban_submission_audit_campaign on private.qurban_submission_audit(campaign_id,occurred_at,registration_id);
create function private.qurban_submission_evidence_guard() returns trigger
language plpgsql set search_path='' as $$
begin
  if tg_op<>'INSERT' then raise exception 'Immutable submission evidence' using errcode='42501'; end if;
  if tg_table_name='qurban_submission_idempotency' then new.created_at:=clock_timestamp();
  else
    if not exists(select 1 from private.qurban_registrations r join private.qurban_submission_idempotency s on s.registration_id=r.id
      where r.id=new.registration_id and r.campaign_id=new.campaign_id and r.quoted_participation_count=new.participant_count and s.key_hash=new.request_hash) then
      raise exception 'Invalid submission evidence' using errcode='23514'; end if;
    new.occurred_at:=clock_timestamp();
  end if;
  return new;
end $$;
create trigger qurban_submission_idempotency_guard before insert or update or delete on private.qurban_submission_idempotency for each row execute function private.qurban_submission_evidence_guard();
create trigger qurban_submission_audit_guard before insert or update or delete on private.qurban_submission_audit for each row execute function private.qurban_submission_evidence_guard();
alter table private.qurban_submission_idempotency enable row level security;
alter table private.qurban_submission_audit enable row level security;
revoke all on private.qurban_submission_idempotency,private.qurban_submission_audit
  from public,anon,authenticated,service_role,supabase_auth_admin,authenticator,campaign_scheduler;

create function private.qurban_submission_payload_valid(p jsonb) returns boolean
language plpgsql immutable set search_path='' as $$
declare a jsonb; e jsonb; k text; name_bytes integer:=0;
begin
  if jsonb_typeof(p) is distinct from 'object' or octet_length(p::text)>65536 then return false; end if;
  if not p ?& array['slug','idempotency_key','expected_campaign_version','expected_global_flag_version','expected_module_flag_version','expected_akad_reference','expected_akad_hash','applicant','participants','attendance','same_cattle_preference','accepted_akad']
    or (select count(*) from jsonb_object_keys(p))<>12 then return false; end if;
  if jsonb_typeof(p->'slug') is distinct from 'string' or not private.qurban_text_valid(p->>'slug',3,100) or p->>'slug' !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    or jsonb_typeof(p->'idempotency_key') is distinct from 'string' or not private.qurban_text_valid(p->>'idempotency_key',64,64) or p->>'idempotency_key' !~ '^[0-9a-f]{64}$'
    or jsonb_typeof(p->'expected_akad_reference') is distinct from 'string' or not private.qurban_text_valid(p->>'expected_akad_reference',1,80) or p->>'expected_akad_reference' !~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,79}$'
    or jsonb_typeof(p->'expected_akad_hash') is distinct from 'string' or not private.qurban_text_valid(p->>'expected_akad_hash',64,64) or p->>'expected_akad_hash' !~ '^[0-9a-f]{64}$' then return false; end if;
  foreach k in array array['expected_campaign_version','expected_global_flag_version','expected_module_flag_version'] loop
    if jsonb_typeof(p->k) is distinct from 'number' or (p->>k) !~ '^[1-9][0-9]{0,9}$' or (p->>k)::numeric>2147483647 then return false; end if;
  end loop;
  a:=p->'applicant';
  if jsonb_typeof(a) is distinct from 'object' then return false; end if;
  if not a ?& array['name','phone','address','email'] or (select count(*) from jsonb_object_keys(a))<>4 then return false; end if;
  if jsonb_typeof(a->'name') is distinct from 'string' or not private.qurban_text_valid(a->>'name',1,160)
    or jsonb_typeof(a->'phone') is distinct from 'string' or not private.qurban_text_valid(a->>'phone',8,30) or a->>'phone' !~ '^[+]?[0-9 ()-]+$' or length(regexp_replace(a->>'phone','[^0-9]','','g')) not between 8 and 15
    or jsonb_typeof(a->'address') is distinct from 'string' or length(a->>'address') not between 1 and 500 or not private.qurban_text_valid(replace(replace(a->>'address',E'\r\n',E'\n'),E'\n',' '),1,500) then return false; end if;
  if a->'email'<>'null'::jsonb and (jsonb_typeof(a->'email') is distinct from 'string' or not private.qurban_text_valid(a->>'email',3,254) or a->>'email' !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$') then return false; end if;
  if jsonb_typeof(p->'attendance') is distinct from 'string' or p->>'attendance' not in ('yes','no','unsure')
    or jsonb_typeof(p->'same_cattle_preference') is distinct from 'boolean' or p->'accepted_akad' is distinct from 'true'::jsonb
    or jsonb_typeof(p->'participants') is distinct from 'array' then return false; end if;
  if jsonb_array_length(p->'participants') not between 1 and 100 then return false; end if;
  for e in select value from jsonb_array_elements(p->'participants') loop
    if jsonb_typeof(e) is distinct from 'object' then return false; end if;
    if not e ?& array['name','purpose'] or (select count(*) from jsonb_object_keys(e))<>2
      or jsonb_typeof(e->'name') is distinct from 'string' or not private.qurban_text_valid(e->>'name',1,160)
      or jsonb_typeof(e->'purpose') is distinct from 'string' or e->>'purpose' not in ('qurban','aqiqah') then return false; end if;
    name_bytes:=name_bytes+octet_length(e->>'name');
  end loop;
  -- Technical bound leaves room for 100 generated identities in the approved 32 KiB consent snapshot.
  return name_bytes<=20000;
exception when others then return false;
end $$;

-- Safe domain projection, never raw configuration or PII. Read is intentionally non-locking;
-- admission locks/rechecks its exact tokens instead of trusting a read snapshot.
create function private.qurban_registration_context(target_slug text) returns jsonb
language plpgsql set search_path='' as $$
declare c private.campaigns; a private.qurban_akad_versions; g private.system_feature_flags; m private.system_feature_flags;
begin
  if not private.qurban_text_valid(target_slug,3,100) or target_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then return null; end if;
  select * into c from private.campaigns where slug=target_slug;
  if c.id is null or c.type_key<>'qurban' or c.config_version<>1 or c.visibility not in ('public','unlisted') or not private.qurban_config_v1_valid(c.configuration)
    or not exists(select 1 from private.campaign_type_descriptors where type_key='qurban' and config_version=1 and module_flag_key='qurban.enabled' and validator_name='qurban_config_v1_valid')
    or not private.campaign_registration_window_available(c.status,c.registration_opens_at,c.registration_closes_at,clock_timestamp()) then return null; end if;
  select * into g from private.system_feature_flags where flag_key='campaigns.enabled';
  select * into m from private.system_feature_flags where flag_key='qurban.enabled';
  if not coalesce(g.enabled,false) or not coalesce(m.enabled,false) then return null; end if;
  select * into a from private.qurban_akad_versions where campaign_id=c.id and version_reference=c.configuration->>'approved_akad_version';
  if a.id is null or a.content_hash is distinct from encode(sha256(convert_to(a.approved_text,'UTF8')),'hex') then return null; end if;
  if not private.campaign_registration_window_available(c.status,c.registration_opens_at,c.registration_closes_at,clock_timestamp()) then return null; end if;
  return jsonb_build_object('slug',c.slug,'title',c.title,'campaign_version',c.version,'config_version',1,
    'global_flag_version',g.version,'module_flag_version',m.version,
    'campaign_year',c.configuration->'campaign_year','hijri_display_label',c.configuration->'hijri_display_label',
    'currency',c.configuration->'currency','price_per_share_minor',c.configuration->'price_per_cattle_share_minor',
    'allowed_purposes',c.configuration->'allowed_purposes','max_participants',c.configuration->'registration_rules'->'max_participants_per_registration',
    'registration_closes_at',c.registration_closes_at,'akad_reference',a.version_reference,'akad_text',a.approved_text,'akad_hash',a.content_hash);
exception when others then raise exception 'Registration unavailable' using errcode='PT503';
end $$;

create function private.qurban_registration_submit(payload jsonb) returns jsonb
language plpgsql set search_path='' as $$
declare c private.campaigns; a private.qurban_akad_versions; r private.qurban_registrations;
  receipt private.qurban_submission_idempotency; ctx jsonb; e jsonb; snap jsonb;
  kh text; ph text; n integer;
begin
  if not private.qurban_submission_payload_valid(payload) then raise exception 'Invalid registration' using errcode='22023'; end if;
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
  return jsonb_build_object('reference',r.public_reference,'participant_count',r.quoted_participation_count,'currency',r.quoted_currency,
    'price_per_share_minor',r.quoted_price_per_share_minor,'total_minor',r.quoted_total_minor);
exception when sqlstate 'PT409' or sqlstate '22023' then raise;
  when check_violation or invalid_text_representation or numeric_value_out_of_range then raise exception 'Invalid registration' using errcode='22023';
  when others then raise exception 'Registration unavailable' using errcode='PT503';
end $$;

-- Tiny trusted-owner wrappers are the only public execution grants. Private schema
-- USAGE, raw CRUD and internal EXECUTE remain denied to public/runtime callers.
create function public.public_qurban_registration_context(target_slug text) returns jsonb
language sql security definer set search_path='' as $$ select private.qurban_registration_context(target_slug); $$;
create function public.public_qurban_registration_submit(payload jsonb) returns jsonb
language sql security definer set search_path='' as $$ select private.qurban_registration_submit(payload); $$;
revoke all on function private.qurban_submission_evidence_guard(),private.qurban_submission_payload_valid(jsonb),private.qurban_registration_context(text),private.qurban_registration_submit(jsonb),
  public.public_qurban_registration_context(text),public.public_qurban_registration_submit(jsonb)
  from public,anon,authenticated,service_role,supabase_auth_admin,authenticator,campaign_scheduler;
grant execute on function public.public_qurban_registration_context(text),public.public_qurban_registration_submit(jsonb) to anon,authenticated;
-- No seeds, reservation/payment mutation or public PII retrieval.
commit;
