begin;

-- Technical bounds, not annual defaults. Private invoker functions have no runtime EXECUTE.
create function private.qurban_text_valid(v text, lo integer, hi integer)
returns boolean language sql immutable set search_path='' as $$
  select coalesce(length(v) between lo and hi and v=btrim(v)
    and v !~ '^[[:space:]]|[[:space:]]$' and v !~ '[[:cntrl:]]'
    and v !~ U&'[\0080-\009f]',false);
$$;
create function private.qurban_config_v1_valid(c jsonb)
returns boolean language plpgsql immutable set search_path='' as $$
declare k text; limits jsonb; p jsonb;
begin
  if jsonb_typeof(c) is distinct from 'object' or octet_length(c::text)>4096 then return false; end if;
  if not c ?& array['campaign_year','hijri_display_label','currency','price_per_cattle_share_minor','cattle_count','shares_per_cattle','allowed_purposes','approved_akad_version','registration_rules']
    or exists(select 1 from jsonb_object_keys(c) x where x not in ('campaign_year','hijri_display_label','currency','price_per_cattle_share_minor','cattle_count','shares_per_cattle','allowed_purposes','approved_akad_version','registration_rules','volunteer_whatsapp_group_url')) then return false; end if;
  foreach k in array array['campaign_year','price_per_cattle_share_minor','cattle_count','shares_per_cattle'] loop
    if jsonb_typeof(c->k) is distinct from 'number' or (c->>k) !~ '^[0-9]+$' then return false; end if;
  end loop;
  if (c->>'campaign_year')::numeric not between 1900 and 9999
    or (c->>'price_per_cattle_share_minor')::numeric not between 1 and 1000000000
    or (c->>'cattle_count')::numeric not between 1 and 10000
    or (c->>'shares_per_cattle')::numeric not between 1 and 100 then return false; end if;
  if jsonb_typeof(c->'hijri_display_label') is distinct from 'string' or not private.qurban_text_valid(c->>'hijri_display_label',1,80)
    or jsonb_typeof(c->'currency') is distinct from 'string' or c->>'currency'<>'MYR'
    or jsonb_typeof(c->'approved_akad_version') is distinct from 'string'
    or not private.qurban_text_valid(c->>'approved_akad_version',1,80)
    or (c->>'approved_akad_version') !~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,79}$' then return false; end if;
  p:=c->'allowed_purposes';
  if jsonb_typeof(p) is distinct from 'array' then return false; end if;
  if jsonb_array_length(p) not between 1 and 2
    or exists(select 1 from jsonb_array_elements(p) x where jsonb_typeof(x)<>'string' or x#>>'{}' not in ('qurban','aqiqah'))
    or (select count(distinct x) from jsonb_array_elements(p) x)<>jsonb_array_length(p) then return false; end if;
  limits:=c->'registration_rules';
  if jsonb_typeof(limits) is distinct from 'object' then return false; end if;
  if not limits ? 'max_participants_per_registration' or (select count(*) from jsonb_object_keys(limits))<>1
    or jsonb_typeof(limits->'max_participants_per_registration') is distinct from 'number'
    or (limits->>'max_participants_per_registration') !~ '^[0-9]+$'
    or (limits->>'max_participants_per_registration')::numeric not between 1 and 100 then return false; end if;
  if c ? 'volunteer_whatsapp_group_url' and c->'volunteer_whatsapp_group_url'<>'null'::jsonb then
    if jsonb_typeof(c->'volunteer_whatsapp_group_url') is distinct from 'string' or not private.qurban_text_valid(c->>'volunteer_whatsapp_group_url',1,154)
      or (c->>'volunteer_whatsapp_group_url') !~ '^https://chat[.]whatsapp[.]com/[A-Za-z0-9]{1,128}$' then return false; end if;
  end if;
  return true;
exception when others then return false;
end $$;

create table private.qurban_akad_versions (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references private.campaigns(id) on delete restrict,
  version_reference text not null check(private.qurban_text_valid(version_reference,1,80) and version_reference ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,79}$'),
  approved_text text not null check(length(approved_text) between 1 and 12000 and btrim(approved_text)<>''),
  content_hash text not null check(content_hash ~ '^[0-9a-f]{64}$'),
  approved_by uuid not null references public.admin_profiles(user_id) on delete restrict,
  approval_reference text not null check(private.qurban_text_valid(approval_reference,1,160)),
  approved_at timestamptz not null default now() check(isfinite(approved_at)),
  unique(campaign_id,version_reference), unique(id,campaign_id)
);
create index qurban_akad_approver on private.qurban_akad_versions(approved_by);
create table private.qurban_registrations (
  id uuid primary key default gen_random_uuid(),
  public_reference text not null unique default ('QBN-'||replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-',''))
    check(public_reference ~ '^QBN-[0-9a-f]{64}$'),
  campaign_id uuid not null references private.campaigns(id) on delete restrict,
  applicant_name text not null check(private.qurban_text_valid(applicant_name,1,160)),
  phone text not null check(private.qurban_text_valid(phone,8,30) and phone ~ '^[+]?[0-9 ()-]+$' and length(regexp_replace(phone,'[^0-9]','','g')) between 8 and 15),
  address text not null check(length(address) between 1 and 500 and private.qurban_text_valid(replace(replace(address,E'\r\n',E'\n'),E'\n',' '),1,500)),
  email text check(email is null or (private.qurban_text_valid(email,3,254) and email ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$')),
  attendance text not null check(attendance in ('yes','no','unsure')),
  same_cattle_preference boolean not null default false,
  status text not null default 'submitted' check(status in ('submitted','cancelled')),
  campaign_config_version integer not null check(campaign_config_version=1),
  campaign_revision integer not null check(campaign_revision>0),
  submission_configuration jsonb not null check(private.qurban_config_v1_valid(submission_configuration)),
  quoted_participation_count integer not null check(quoted_participation_count between 1 and 100),
  quoted_currency text generated always as (submission_configuration->>'currency') stored,
  quoted_price_per_share_minor bigint generated always as ((submission_configuration->>'price_per_cattle_share_minor')::bigint) stored,
  quoted_total_minor bigint generated always as ((submission_configuration->>'price_per_cattle_share_minor')::bigint * quoted_participation_count) stored,
  created_at timestamptz not null default now() check(isfinite(created_at)),
  updated_at timestamptz not null default now() check(isfinite(updated_at)),
  version integer not null default 1 check(version>0),
  unique(id,campaign_id),
  check(quoted_participation_count <= (submission_configuration->'registration_rules'->>'max_participants_per_registration')::integer)
);
create index qurban_registration_campaign on private.qurban_registrations(campaign_id,created_at,id);
create table private.qurban_participations (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references private.qurban_registrations(id) on delete restrict,
  participant_name text not null check(private.qurban_text_valid(participant_name,1,160)),
  purpose text not null check(purpose in ('qurban','aqiqah')),
  created_at timestamptz not null default now() check(isfinite(created_at)),
  updated_at timestamptz not null default now() check(isfinite(updated_at)),
  version integer not null default 1 check(version>0)
);
create index qurban_participation_registration on private.qurban_participations(registration_id,id);

create function private.qurban_consent_snapshot_valid(s jsonb)
returns boolean language plpgsql immutable set search_path='' as $$
declare e jsonb;
begin
  if jsonb_typeof(s) is distinct from 'array' or octet_length(s::text)>32768 then return false; end if;
  if jsonb_array_length(s) not between 1 and 100 then return false; end if;
  for e in select value from jsonb_array_elements(s) loop
    if jsonb_typeof(e) is distinct from 'object' then return false; end if;
    if not e ?& array['id','participant_name','purpose','version'] or (select count(*) from jsonb_object_keys(e))<>4
      or jsonb_typeof(e->'id') is distinct from 'string' or (e->>'id') !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      or jsonb_typeof(e->'participant_name') is distinct from 'string' or not private.qurban_text_valid(e->>'participant_name',1,160)
      or jsonb_typeof(e->'purpose') is distinct from 'string' or e->>'purpose' not in ('qurban','aqiqah')
      or jsonb_typeof(e->'version') is distinct from 'number' or (e->>'version') !~ '^[1-9][0-9]{0,9}$'
      or (e->>'version')::numeric>2147483647 then return false; end if;
  end loop;
  return (select count(distinct value->>'id') from jsonb_array_elements(s))=jsonb_array_length(s);
exception when others then return false;
end $$;
create table private.qurban_consent_acceptances (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null,
  campaign_id uuid not null,
  akad_version_id uuid not null,
  accepted_at timestamptz not null default now() check(isfinite(accepted_at)),
  accepted_content_hash text not null check(accepted_content_hash ~ '^[0-9a-f]{64}$'),
  participation_snapshot jsonb not null check(private.qurban_consent_snapshot_valid(participation_snapshot)),
  foreign key(registration_id,campaign_id) references private.qurban_registrations(id,campaign_id) on delete restrict,
  foreign key(akad_version_id,campaign_id) references private.qurban_akad_versions(id,campaign_id) on delete restrict
);
create index qurban_consent_registration on private.qurban_consent_acceptances(registration_id,accepted_at,id);
create index qurban_consent_akad on private.qurban_consent_acceptances(akad_version_id,campaign_id);

-- Storage integrity only: no runtime business mutation API, grants or audit writer.
create function private.qurban_record_guard()
returns trigger language plpgsql set search_path='' as $$
declare c private.campaigns; r private.qurban_registrations; a private.qurban_akad_versions;
begin
  if tg_op='DELETE' or (tg_op='UPDATE' and tg_table_name in ('qurban_akad_versions','qurban_consent_acceptances')) then
    raise exception 'Immutable Qurban evidence / deletion denied' using errcode='42501'; end if;
  if tg_table_name in ('qurban_registrations','qurban_akad_versions') then
    select * into c from private.campaigns where id=new.campaign_id;
    if not found or c.type_key<>'qurban' or c.config_version<>1 or not private.qurban_config_v1_valid(c.configuration) then
      raise exception 'Qurban campaign required' using errcode='23514'; end if;
  end if;
  if tg_table_name='qurban_registrations' then
    if tg_op='INSERT' then
      if new.campaign_config_version<>c.config_version or new.campaign_revision<>c.version or new.submission_configuration is distinct from c.configuration then
        raise exception 'Exact current submission quote required' using errcode='23514'; end if;
      new.created_at:=clock_timestamp(); new.version:=1;
    else
      if row(new.id,new.public_reference,new.campaign_id,new.campaign_config_version,new.campaign_revision,new.submission_configuration,new.quoted_participation_count,new.created_at)
        is distinct from row(old.id,old.public_reference,old.campaign_id,old.campaign_config_version,old.campaign_revision,old.submission_configuration,old.quoted_participation_count,old.created_at) then
        raise exception 'Immutable submission identity and quote' using errcode='23514'; end if;
      new.version:=old.version+1;
    end if;
    new.updated_at:=clock_timestamp();
  elsif tg_table_name='qurban_participations' then
    select * into r from private.qurban_registrations where id=new.registration_id;
    if not found or not (r.submission_configuration->'allowed_purposes') ? new.purpose then
      raise exception 'Purpose not permitted by accepted configuration' using errcode='23514'; end if;
    if tg_op='INSERT' then new.created_at:=clock_timestamp(); new.version:=1;
    else
      if row(new.id,new.registration_id,new.created_at) is distinct from row(old.id,old.registration_id,old.created_at) then
        raise exception 'Immutable participation identity' using errcode='23514'; end if;
      new.version:=old.version+1;
    end if;
    new.updated_at:=clock_timestamp();
  elsif tg_table_name='qurban_akad_versions' then
    new.content_hash:=encode(sha256(convert_to(new.approved_text,'UTF8')),'hex');
    new.approved_at:=clock_timestamp();
  elsif tg_table_name='qurban_consent_acceptances' then
    select * into r from private.qurban_registrations where id=new.registration_id for update;
    select * into a from private.qurban_akad_versions where id=new.akad_version_id;
    if r.id is null or a.id is null or new.campaign_id is distinct from r.campaign_id or a.campaign_id is distinct from r.campaign_id
      or a.version_reference is distinct from r.submission_configuration->>'approved_akad_version'
      or not private.qurban_consent_snapshot_valid(new.participation_snapshot) then
      raise exception 'Exact accepted akad and snapshot required' using errcode='23514'; end if;
    if jsonb_array_length(new.participation_snapshot)<>r.quoted_participation_count
      or (select count(*) from private.qurban_participations where registration_id=r.id)<>r.quoted_participation_count
      or exists(select 1 from jsonb_array_elements(new.participation_snapshot) e where not exists(
        select 1 from private.qurban_participations p where p.registration_id=r.id and p.id=(e->>'id')::uuid
          and p.participant_name=e->>'participant_name' and p.purpose=e->>'purpose' and p.version=(e->>'version')::integer)) then
      raise exception 'Acceptance snapshot must match reviewed participations' using errcode='23514'; end if;
    new.accepted_content_hash:=a.content_hash; new.accepted_at:=clock_timestamp();
  end if;
  return new;
end $$;
create trigger qurban_registration_guard before insert or update or delete on private.qurban_registrations for each row execute function private.qurban_record_guard();
create trigger qurban_participation_guard before insert or update or delete on private.qurban_participations for each row execute function private.qurban_record_guard();
create trigger qurban_akad_guard before insert or update or delete on private.qurban_akad_versions for each row execute function private.qurban_record_guard();
create trigger qurban_consent_guard before insert or update or delete on private.qurban_consent_acceptances for each row execute function private.qurban_record_guard();
alter table private.qurban_registrations enable row level security;
alter table private.qurban_participations enable row level security;
alter table private.qurban_akad_versions enable row level security;
alter table private.qurban_consent_acceptances enable row level security;
revoke all on private.qurban_registrations,private.qurban_participations,private.qurban_akad_versions,private.qurban_consent_acceptances
  from public,anon,authenticated,service_role,supabase_auth_admin,authenticator,campaign_scheduler;
revoke all on function private.qurban_text_valid(text,integer,integer),private.qurban_config_v1_valid(jsonb),private.qurban_consent_snapshot_valid(jsonb),private.qurban_record_guard()
  from public,anon,authenticated,service_role,supabase_auth_admin,authenticator,campaign_scheduler;
insert into private.campaign_type_descriptors(type_key,config_version,module_flag_key,validator_name)
values('qurban',1,'qurban.enabled','qurban_config_v1_valid');
-- No flag, campaign, price/year, akad, contact or participant seed.
commit;
