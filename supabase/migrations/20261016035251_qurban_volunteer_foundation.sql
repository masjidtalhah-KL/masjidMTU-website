begin;
create table private.qurban_volunteer_assignment_labels (
 id uuid primary key default gen_random_uuid(), campaign_id uuid not null references private.campaigns(id) on delete restrict,
 name text not null check(private.qurban_text_valid(name,1,80) and name !~ '[<>]'),
 normalized_name text generated always as (lower(regexp_replace(name,'[[:space:]]+',' ','g'))) stored,
 active boolean not null default true, version integer not null default 1 check(version>0),
 created_at timestamptz not null default clock_timestamp(),updated_at timestamptz not null default clock_timestamp(),
 unique(id,campaign_id),unique(campaign_id,normalized_name)
);
create table private.qurban_volunteers (
 id uuid primary key default gen_random_uuid(),campaign_id uuid not null references private.campaigns(id) on delete restrict,
 public_reference text not null unique default ('VLT-'||replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-','')) check(public_reference ~ '^VLT-[0-9a-f]{64}$'),
 name text not null check(private.qurban_text_valid(name,1,160)),
 phone text not null check(private.qurban_text_valid(phone,8,30) and phone ~ '^[+]?[0-9 ()-]+$' and length(regexp_replace(phone,'[^0-9]','','g')) between 8 and 15),
 email text check(email is null or (private.qurban_text_valid(email,3,254) and email ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$')),
 shirt_size text not null check(shirt_size in ('XS','S','M','L','XL','2XL','3XL','4XL','5XL')),
 also_participant boolean not null,participant_name_information text,
 status text not null default 'submitted' check(status in ('submitted','cancelled')),
 assignment_label_id uuid,version integer not null default 1 check(version>0),
 created_at timestamptz not null default clock_timestamp(),updated_at timestamptz not null default clock_timestamp(),
 unique(id,campaign_id),foreign key(assignment_label_id,campaign_id) references private.qurban_volunteer_assignment_labels(id,campaign_id) on delete restrict,
 check((also_participant and participant_name_information is not null and private.qurban_text_valid(participant_name_information,1,160)) or (not also_participant and participant_name_information is null)),
 check(status<>'cancelled' or assignment_label_id is null)
);
create index qurban_volunteer_page on private.qurban_volunteers(campaign_id,status,created_at,id);
create index qurban_volunteer_assignment on private.qurban_volunteers(campaign_id,assignment_label_id,id);
create table private.qurban_volunteer_idempotency (
 key_hash text primary key check(key_hash ~ '^[0-9a-f]{64}$'),payload_hash text not null check(payload_hash ~ '^[0-9a-f]{64}$'),
 volunteer_id uuid not null unique references private.qurban_volunteers(id) on delete restrict,
 whatsapp_group_url text check(whatsapp_group_url is null or (length(whatsapp_group_url)<=154 and whatsapp_group_url ~ '^https://chat[.]whatsapp[.]com/[A-Za-z0-9]{1,128}$')),
 created_at timestamptz not null default clock_timestamp()
);
create table private.qurban_volunteer_audit (
 id uuid primary key default gen_random_uuid(),campaign_id uuid not null references private.campaigns(id) on delete restrict,
 volunteer_id uuid,label_id uuid,previous_label_id uuid,actor_id uuid references public.admin_profiles(user_id) on delete restrict,
 action text not null check(action in ('volunteer.submitted','volunteer.amended','volunteer.cancelled','volunteer.assignment.set','volunteer.assignment.changed','volunteer.assignment.cleared','volunteer.assignment_label.created','volunteer.assignment_label.renamed','volunteer.assignment_label.archived')),
 occurred_at timestamptz not null default clock_timestamp(),expected_version integer not null check(expected_version>=0),resulting_version integer not null check(resulting_version=expected_version+1),
 changed_fields text[] not null default '{}' check(cardinality(changed_fields)<=6 and array_position(changed_fields,null) is null and changed_fields <@ array['name','phone','email','shirt_size','also_participant','participant_name_information','status','assignment_label_id','active']::text[]),
 reason text check(reason in ('applicant_request','duplicate_registration','entry_error','other_operational')),
 request_hash text unique references private.qurban_volunteer_idempotency(key_hash) on delete restrict,
 foreign key(volunteer_id,campaign_id) references private.qurban_volunteers(id,campaign_id) on delete restrict,
 foreign key(label_id,campaign_id) references private.qurban_volunteer_assignment_labels(id,campaign_id) on delete restrict,
 foreign key(previous_label_id,campaign_id) references private.qurban_volunteer_assignment_labels(id,campaign_id) on delete restrict,
 check((action='volunteer.submitted' and actor_id is null and volunteer_id is not null and request_hash is not null and expected_version=0 and label_id is null and previous_label_id is null and changed_fields='{}' and reason is null)
 or (action<>'volunteer.submitted' and actor_id is not null and request_hash is null
 and ((action='volunteer.amended' and volunteer_id is not null and label_id is null and previous_label_id is null and reason is null and cardinality(changed_fields)>0 and changed_fields <@ array['name','phone','email','shirt_size','also_participant','participant_name_information']::text[])
 or (action='volunteer.cancelled' and volunteer_id is not null and reason is not null and changed_fields=array['status']::text[] and label_id is null and previous_label_id is null)
 or (action in ('volunteer.assignment.set','volunteer.assignment.changed','volunteer.assignment.cleared') and volunteer_id is not null and reason is null and changed_fields=array['assignment_label_id']::text[] and
 ((action='volunteer.assignment.set' and label_id is not null and previous_label_id is null) or (action='volunteer.assignment.changed' and label_id is not null and previous_label_id is not null and label_id<>previous_label_id) or (action='volunteer.assignment.cleared' and label_id is null and previous_label_id is not null)))
 or (action in ('volunteer.assignment_label.created','volunteer.assignment_label.renamed','volunteer.assignment_label.archived') and volunteer_id is null and label_id is not null and previous_label_id is null and reason is null and changed_fields=case when action='volunteer.assignment_label.archived' then array['active']::text[] else array['name']::text[] end))))
);
create index qurban_volunteer_audit_page on private.qurban_volunteer_audit(campaign_id,occurred_at,id);
create function private.qurban_volunteer_guard() returns trigger language plpgsql set search_path='' as $$
begin
 if tg_op='DELETE' then raise exception 'Retained volunteer evidence' using errcode='42501';end if;
 if tg_table_name in ('qurban_volunteer_idempotency','qurban_volunteer_audit') then
  if tg_op<>'INSERT' then raise exception 'Immutable volunteer evidence' using errcode='42501';end if;
  if tg_table_name='qurban_volunteer_idempotency' then new.created_at:=clock_timestamp();
  else
   new.occurred_at:=clock_timestamp();
   if new.action='volunteer.submitted' then
    if not exists(select 1 from private.qurban_volunteer_idempotency i join private.qurban_volunteers v on v.id=i.volunteer_id where i.key_hash=new.request_hash and v.id=new.volunteer_id and v.campaign_id=new.campaign_id) then raise exception 'Submission evidence mismatch' using errcode='23514';end if;
   elsif new.actor_id is distinct from auth.uid() then raise exception 'Audit actor mismatch' using errcode='42501';end if;
  end if;return new;
 end if;
 if not exists(select 1 from private.campaigns where id=new.campaign_id and type_key='qurban' and config_version=1) then raise exception 'Qurban campaign required' using errcode='23514';end if;
 if tg_op='INSERT' then new.version:=1;new.created_at:=clock_timestamp();
 else
  if new.id<>old.id or new.campaign_id<>old.campaign_id or new.created_at<>old.created_at or old.version=2147483647 then raise exception 'Immutable volunteer identity' using errcode='42501';end if;
  new.version:=old.version+1;
  if tg_table_name='qurban_volunteers' then
   if new.public_reference<>old.public_reference or old.status='cancelled' then raise exception 'Immutable volunteer identity or terminal cancellation' using errcode='42501';end if;
  elsif not old.active then raise exception 'Archived label is terminal' using errcode='42501';end if;
 end if;
 if tg_table_name='qurban_volunteers' then
 if new.assignment_label_id is not null then
  if (tg_op='INSERT' or new.assignment_label_id is distinct from old.assignment_label_id) and not exists(select 1 from private.qurban_volunteer_assignment_labels where id=new.assignment_label_id and campaign_id=new.campaign_id and active) then raise exception 'Active same-campaign label required' using errcode='23514';end if;
 end if;end if;
 new.updated_at:=clock_timestamp();return new;
end $$;
create trigger qurban_volunteer_guard before insert or update or delete on private.qurban_volunteers for each row execute function private.qurban_volunteer_guard();
create trigger qurban_volunteer_label_guard before insert or update or delete on private.qurban_volunteer_assignment_labels for each row execute function private.qurban_volunteer_guard();
create trigger qurban_volunteer_idempotency_guard before insert or update or delete on private.qurban_volunteer_idempotency for each row execute function private.qurban_volunteer_guard();
create trigger qurban_volunteer_audit_guard before insert or update or delete on private.qurban_volunteer_audit for each row execute function private.qurban_volunteer_guard();

create function private.qurban_volunteer_fields_valid(p jsonb) returns boolean language plpgsql immutable set search_path='' as $$
begin
 if jsonb_typeof(p) is distinct from 'object' or octet_length(p::text)>2048 then return false;end if;
 if not p ?& array['name','phone','email','shirt_size','also_participant','participant_name_information'] or (select count(*) from jsonb_object_keys(p))<>6 then return false;end if;
 return jsonb_typeof(p->'name')='string' and private.qurban_text_valid(p->>'name',1,160)
 and jsonb_typeof(p->'phone')='string' and private.qurban_text_valid(p->>'phone',8,30) and p->>'phone' ~ '^[+]?[0-9 ()-]+$' and length(regexp_replace(p->>'phone','[^0-9]','','g')) between 8 and 15
 and (p->'email'='null'::jsonb or (jsonb_typeof(p->'email')='string' and private.qurban_text_valid(p->>'email',3,254) and p->>'email' ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'))
 and jsonb_typeof(p->'shirt_size')='string' and p->>'shirt_size' in ('XS','S','M','L','XL','2XL','3XL','4XL','5XL')
 and jsonb_typeof(p->'also_participant')='boolean' and ((p->'also_participant'='false'::jsonb and p->'participant_name_information'='null'::jsonb)
 or (p->'also_participant'='true'::jsonb and jsonb_typeof(p->'participant_name_information')='string' and private.qurban_text_valid(p->>'participant_name_information',1,160)));
exception when others then return false;end $$;
create function private.qurban_volunteer_context(target_slug text) returns jsonb language plpgsql set search_path='' as $$
declare c private.campaigns;g private.system_feature_flags;m private.system_feature_flags;
begin
 if not private.qurban_text_valid(target_slug,3,100) or target_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then return null;end if;
 select * into c from private.campaigns where slug=target_slug;
 if c.id is null or c.type_key<>'qurban' or c.config_version<>1 or c.visibility not in ('public','unlisted') or not private.qurban_config_v1_valid(c.configuration)
 or not exists(select 1 from private.campaign_type_descriptors where type_key='qurban' and config_version=1 and module_flag_key='qurban.enabled' and validator_name='qurban_config_v1_valid')
 or not private.campaign_registration_window_available(c.status,c.registration_opens_at,c.registration_closes_at,clock_timestamp()) then return null;end if;
 select * into g from private.system_feature_flags where flag_key='campaigns.enabled';select * into m from private.system_feature_flags where flag_key='qurban.enabled';
 if not coalesce(g.enabled,false) or not coalesce(m.enabled,false) or not private.campaign_registration_window_available(c.status,c.registration_opens_at,c.registration_closes_at,clock_timestamp()) then return null;end if;
 return jsonb_build_object('slug',c.slug,'title',c.title,'config_version',1,'campaign_version',c.version,'global_flag_version',g.version,'module_flag_version',m.version,
 'campaign_year',c.configuration->'campaign_year','hijri_display_label',c.configuration->>'hijri_display_label');
end $$;
create function private.qurban_volunteer_submit(payload jsonb) returns jsonb language plpgsql set search_path='' as $$
declare c private.campaigns;v private.qurban_volunteers;i private.qurban_volunteer_idempotency;ctx jsonb;kh text;ph text;k text;
begin
 if jsonb_typeof(payload) is distinct from 'object' or octet_length(payload::text)>8192 then raise exception 'Invalid volunteer submission' using errcode='22023';end if;
 if not payload ?& array['slug','idempotency_key','expected_campaign_version','expected_global_flag_version','expected_module_flag_version','volunteer'] or (select count(*) from jsonb_object_keys(payload))<>6
 or jsonb_typeof(payload->'slug') is distinct from 'string' or not private.qurban_text_valid(payload->>'slug',3,100) or payload->>'slug' !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
 or jsonb_typeof(payload->'idempotency_key') is distinct from 'string' or length(payload->>'idempotency_key')<>64 or payload->>'idempotency_key' !~ '^[0-9a-f]{64}$'
 or not coalesce(private.qurban_volunteer_fields_valid(payload->'volunteer'),false) then raise exception 'Invalid volunteer submission' using errcode='22023';end if;
 foreach k in array array['expected_campaign_version','expected_global_flag_version','expected_module_flag_version'] loop
 if jsonb_typeof(payload->k) is distinct from 'number' or (payload->>k) !~ '^[1-9][0-9]{0,9}$' or (payload->>k)::numeric>2147483647 then raise exception 'Invalid context' using errcode='22023';end if;end loop;
 kh:=encode(sha256(convert_to(payload->>'idempotency_key','UTF8')),'hex');ph:=encode(sha256(convert_to(payload::text,'UTF8')),'hex');
 perform pg_advisory_xact_lock(hashtextextended('qurban-volunteer-submission:'||kh,0));
 select * into i from private.qurban_volunteer_idempotency where key_hash=kh;
 if i.key_hash is not null then
 if i.payload_hash<>ph then raise exception 'Review volunteer submission again' using errcode='PT409';end if;
 select * into v from private.qurban_volunteers where id=i.volunteer_id;
 else
 perform pg_advisory_xact_lock_shared(hashtextextended('campaign-system-flag:campaigns.enabled',0));perform pg_advisory_xact_lock_shared(hashtextextended('campaign-system-flag:qurban.enabled',0));
 perform 1 from private.system_feature_flags where flag_key in ('campaigns.enabled','qurban.enabled') order by flag_key for share;
 select * into c from private.campaigns where slug=payload->>'slug' for update;
 ctx:=private.qurban_volunteer_context(payload->>'slug');
 if ctx is null or ctx->'campaign_version' is distinct from payload->'expected_campaign_version' or ctx->'global_flag_version' is distinct from payload->'expected_global_flag_version' or ctx->'module_flag_version' is distinct from payload->'expected_module_flag_version' then raise exception 'Review volunteer submission again' using errcode='PT409';end if;
 insert into private.qurban_volunteers(campaign_id,name,phone,email,shirt_size,also_participant,participant_name_information)
 values(c.id,payload->'volunteer'->>'name',payload->'volunteer'->>'phone',payload->'volunteer'->>'email',payload->'volunteer'->>'shirt_size',(payload->'volunteer'->>'also_participant')::boolean,payload->'volunteer'->>'participant_name_information') returning * into v;
 insert into private.qurban_volunteer_idempotency(key_hash,payload_hash,volunteer_id,whatsapp_group_url) values(kh,ph,v.id,c.configuration->>'volunteer_whatsapp_group_url') returning * into i;
 insert into private.qurban_volunteer_audit(campaign_id,volunteer_id,action,expected_version,resulting_version,request_hash) values(c.id,v.id,'volunteer.submitted',0,1,kh);
 if not private.campaign_registration_window_available(c.status,c.registration_opens_at,c.registration_closes_at,clock_timestamp()) then raise exception 'Review volunteer submission again' using errcode='PT409';end if;
 end if;
 return jsonb_build_object('reference',v.public_reference,'whatsapp_group_url',i.whatsapp_group_url);
exception when sqlstate 'PT409' or sqlstate '22023' then raise;
 when check_violation or invalid_text_representation or numeric_value_out_of_range then raise exception 'Invalid volunteer submission' using errcode='22023';
 when others then raise exception 'Volunteer unavailable' using errcode='PT503';end $$;

create function private.qurban_volunteer_summary(target uuid) returns jsonb language sql set search_path='' as $$
 with v as materialized(select * from private.qurban_volunteers where campaign_id=target)
 select jsonb_build_object('total',(select count(*) from v),'submitted',(select count(*) from v where status='submitted'),'cancelled',(select count(*) from v where status='cancelled'),
 'assigned',(select count(*) from v where status='submitted' and assignment_label_id is not null),'unassigned',(select count(*) from v where status='submitted' and assignment_label_id is null),
 'also_participant',(select count(*) from v where status='submitted' and also_participant),
 'shirt_sizes',(select jsonb_object_agg(size,(select count(*) from v where status='submitted' and shirt_size=size)) from unnest(array['XS','S','M','L','XL','2XL','3XL','4XL','5XL']) size)); $$;
create function private.qurban_volunteer_list(target uuid,options jsonb) returns jsonb language plpgsql set search_path='' as $$
declare c private.campaigns;pg integer;sz integer;term text;st text;size_filter text;assignment_filter text;participant_filter text;label_filter uuid;
begin
 c:=private.qurban_admin_campaign(target,false);
 if jsonb_typeof(options) is distinct from 'object' or octet_length(options::text)>1024 then raise exception 'Invalid filter' using errcode='22023';end if;
 if not options ?& array['page','page_size','search','status','shirt_size','assigned','label_id','also_participant'] or (select count(*) from jsonb_object_keys(options))<>8
 or jsonb_typeof(options->'page') is distinct from 'number' or options->>'page' !~ '^[1-9][0-9]{0,4}$' or (options->>'page')::integer>10000
 or jsonb_typeof(options->'page_size') is distinct from 'number' or options->>'page_size' !~ '^[1-9][0-9]?$' or (options->>'page_size')::integer>50
 or jsonb_typeof(options->'search') is distinct from 'string' or not (options->>'search'='' or private.qurban_text_valid(options->>'search',1,100))
 or jsonb_typeof(options->'status') is distinct from 'string' or options->>'status' not in ('all','submitted','cancelled')
 or jsonb_typeof(options->'shirt_size') is distinct from 'string' or options->>'shirt_size' not in ('all','XS','S','M','L','XL','2XL','3XL','4XL','5XL')
 or jsonb_typeof(options->'assigned') is distinct from 'string' or options->>'assigned' not in ('all','yes','no')
 or jsonb_typeof(options->'also_participant') is distinct from 'string' or options->>'also_participant' not in ('all','yes','no')
 or jsonb_typeof(options->'label_id') not in ('null','string') or (options->'label_id'<>'null'::jsonb and options->>'label_id' !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$') then raise exception 'Invalid filter' using errcode='22023';end if;
 pg:=(options->>'page')::integer;sz:=(options->>'page_size')::integer;term:=options->>'search';st:=options->>'status';size_filter:=options->>'shirt_size';assignment_filter:=options->>'assigned';participant_filter:=options->>'also_participant';label_filter:=(options->>'label_id')::uuid;
 return (with filtered as materialized(select v.id,v.public_reference,v.name,v.phone,v.shirt_size,v.also_participant,v.status,v.created_at,v.version,v.assignment_label_id,l.name assignment_label,l.active assignment_active
 from private.qurban_volunteers v left join private.qurban_volunteer_assignment_labels l on l.id=v.assignment_label_id where v.campaign_id=target
 and (term='' or upper(v.public_reference)=upper(term) or position(lower(term) in lower(v.name))>0 or position(term in v.phone)>0)
 and (st='all' or v.status=st) and (size_filter='all' or v.shirt_size=size_filter)
 and (assignment_filter='all' or (v.assignment_label_id is not null)=(assignment_filter='yes')) and (participant_filter='all' or v.also_participant=(participant_filter='yes')) and (label_filter is null or v.assignment_label_id=label_filter)),
 page as(select * from filtered order by created_at desc,id desc limit sz offset (pg-1)*sz)
 select jsonb_build_object('summary',private.qurban_volunteer_summary(target),'total',(select count(*) from filtered),'page',pg,'page_size',sz,'items',coalesce((select jsonb_agg(to_jsonb(p) order by created_at desc,id desc) from page p),'[]'::jsonb),'can_manage',private.active_role() in ('admin','super_admin'),'recent_mfa',private.active_role()<>'super_admin' or private.recent_totp()));
end $$;
create function private.qurban_volunteer_detail(target uuid,volunteer uuid) returns jsonb language plpgsql set search_path='' as $$
declare c private.campaigns;v private.qurban_volunteers;result jsonb;
begin
 c:=private.qurban_admin_campaign(target,false);select * into v from private.qurban_volunteers where id=volunteer and campaign_id=target;if not found then return null;end if;
 result:=jsonb_build_object('id',v.id,'public_reference',v.public_reference,'name',v.name,'phone',v.phone,'shirt_size',v.shirt_size,'also_participant',v.also_participant,'participant_name_information',v.participant_name_information,'status',v.status,'assignment_label_id',v.assignment_label_id,'assignment_label',(select name from private.qurban_volunteer_assignment_labels where id=v.assignment_label_id),'version',v.version,'created_at',v.created_at,'updated_at',v.updated_at);
 if private.active_role()<>'staff' then result:=result||jsonb_build_object('email',v.email);end if;return result;
end $$;
-- Independent volunteer write gate: Foundation actor lock, then campaign FOR UPDATE.
-- No capacity-grid, allocation, participant or payment dependency.
create function private.qurban_volunteer_campaign(target uuid) returns private.campaigns language plpgsql set search_path='' as $$
declare c private.campaigns;
begin
 perform private.require_campaign_access('manage');
 select * into c from private.campaigns where id=target and type_key='qurban' and config_version=1 for update;
 if not found or not private.qurban_config_v1_valid(c.configuration) then raise exception 'Access denied' using errcode='42501';end if;
 return c;
end $$;
create function private.qurban_volunteer_amend(target uuid,volunteer uuid,expected integer,changes jsonb) returns jsonb language plpgsql set search_path='' as $$
declare c private.campaigns;v private.qurban_volunteers;fields text[];
begin
 c:=private.qurban_volunteer_campaign(target);
 if expected is null or expected<1 or not coalesce(private.qurban_volunteer_fields_valid(changes),false) then raise exception 'Invalid correction' using errcode='22023';end if;
 select * into v from private.qurban_volunteers where id=volunteer and campaign_id=target for update;if not found then raise exception 'Access denied' using errcode='42501';end if;
 if v.version<>expected or v.status<>'submitted' then raise exception 'Refresh and review' using errcode='PT409';end if;
 select array_agg(k order by k) into fields from jsonb_object_keys(changes) k where (to_jsonb(v)->k) is distinct from changes->k;
 if fields is null then return jsonb_build_object('id',v.id,'version',v.version,'unchanged',true);end if;
 update private.qurban_volunteers set name=changes->>'name',phone=changes->>'phone',email=changes->>'email',shirt_size=changes->>'shirt_size',also_participant=(changes->>'also_participant')::boolean,participant_name_information=changes->>'participant_name_information' where id=v.id returning * into v;
 insert into private.qurban_volunteer_audit(campaign_id,volunteer_id,actor_id,action,expected_version,resulting_version,changed_fields) values(target,v.id,auth.uid(),'volunteer.amended',expected,v.version,fields);
 return jsonb_build_object('id',v.id,'version',v.version,'unchanged',false);
end $$;
create function private.qurban_volunteer_cancel(target uuid,volunteer uuid,expected integer,reason_code text) returns jsonb language plpgsql set search_path='' as $$
declare c private.campaigns;v private.qurban_volunteers;previous uuid;
begin
 c:=private.qurban_volunteer_campaign(target);
 if expected is null or expected<1 or reason_code is null or reason_code not in ('applicant_request','duplicate_registration','entry_error','other_operational') then raise exception 'Controlled cancellation reason required' using errcode='22023';end if;
 select * into v from private.qurban_volunteers where id=volunteer and campaign_id=target for update;if not found then raise exception 'Access denied' using errcode='42501';end if;
 if v.version<>expected or v.status<>'submitted' then raise exception 'Refresh and review' using errcode='PT409';end if;
 previous:=v.assignment_label_id;update private.qurban_volunteers set status='cancelled',assignment_label_id=null where id=v.id returning * into v;
 if previous is not null then insert into private.qurban_volunteer_audit(campaign_id,volunteer_id,previous_label_id,actor_id,action,expected_version,resulting_version,changed_fields) values(target,v.id,previous,auth.uid(),'volunteer.assignment.cleared',expected,v.version,array['assignment_label_id']);end if;
 insert into private.qurban_volunteer_audit(campaign_id,volunteer_id,actor_id,action,expected_version,resulting_version,changed_fields,reason) values(target,v.id,auth.uid(),'volunteer.cancelled',expected,v.version,array['status'],reason_code);
 return jsonb_build_object('id',v.id,'version',v.version);
end $$;
create function private.qurban_volunteer_labels(target uuid,page_number integer) returns jsonb language plpgsql set search_path='' as $$
declare c private.campaigns;
begin
 c:=private.qurban_admin_campaign(target,false);if page_number is null or page_number not between 1 and 10000 then raise exception 'Invalid page' using errcode='22023';end if;
 return jsonb_build_object('page',page_number,'total',(select count(*) from private.qurban_volunteer_assignment_labels where campaign_id=target),'items',coalesce((select jsonb_agg(to_jsonb(l) order by normalized_name,id) from (select id,name,active,version,normalized_name from private.qurban_volunteer_assignment_labels where campaign_id=target order by normalized_name,id limit 50 offset (page_number-1)*50) l),'[]'::jsonb));
end $$;
create function private.qurban_volunteer_label_command(target uuid,payload jsonb) returns jsonb language plpgsql set search_path='' as $$
declare c private.campaigns;l private.qurban_volunteer_assignment_labels;op text;ev integer;
begin
 c:=private.qurban_volunteer_campaign(target);
 if jsonb_typeof(payload) is distinct from 'object' or octet_length(payload::text)>512 or jsonb_typeof(payload->'action') is distinct from 'string' then raise exception 'Invalid label command' using errcode='22023';end if;op:=payload->>'action';
 if op='create' then
 if not payload ?& array['action','name'] or (select count(*) from jsonb_object_keys(payload))<>2 then raise exception 'Invalid label command' using errcode='22023';end if;ev:=0;
 else
 if op not in ('rename','archive') or not payload ?& array['action','id','expected_version'] or (select count(*) from jsonb_object_keys(payload))<>(case when op='rename' then 4 else 3 end)
 or jsonb_typeof(payload->'id') is distinct from 'string' or payload->>'id' !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
 or jsonb_typeof(payload->'expected_version') is distinct from 'number' or payload->>'expected_version' !~ '^[1-9][0-9]{0,9}$' or (payload->>'expected_version')::numeric>2147483647 then raise exception 'Invalid label command' using errcode='22023';end if;
 ev:=(payload->>'expected_version')::integer;select * into l from private.qurban_volunteer_assignment_labels where id=(payload->>'id')::uuid and campaign_id=target for update;
 if not found then raise exception 'Access denied' using errcode='42501';end if;if not l.active or l.version<>ev then raise exception 'Refresh label' using errcode='PT409';end if;
 end if;
 if op in ('create','rename') then
 if jsonb_typeof(payload->'name') is distinct from 'string' or not private.qurban_text_valid(payload->>'name',1,80) or payload->>'name' ~ '[<>]' then raise exception 'Invalid label name' using errcode='22023';end if;
 end if;
 if op='create' then insert into private.qurban_volunteer_assignment_labels(campaign_id,name) values(target,payload->>'name') returning * into l;
 elsif op='rename' then if l.name=payload->>'name' then return jsonb_build_object('id',l.id,'version',l.version,'unchanged',true);end if;update private.qurban_volunteer_assignment_labels set name=payload->>'name' where id=l.id returning * into l;
 else update private.qurban_volunteer_assignment_labels set active=false where id=l.id returning * into l;end if;
 insert into private.qurban_volunteer_audit(campaign_id,label_id,actor_id,action,expected_version,resulting_version,changed_fields) values(target,l.id,auth.uid(),case op when 'create' then 'volunteer.assignment_label.created' when 'rename' then 'volunteer.assignment_label.renamed' else 'volunteer.assignment_label.archived' end,ev,l.version,case when op='archive' then array['active'] else array['name'] end);
 return jsonb_build_object('id',l.id,'version',l.version);
exception when unique_violation then raise exception 'Label already exists' using errcode='PT409';end $$;
create function private.qurban_volunteer_assign(target uuid,volunteer uuid,expected integer,label uuid,label_version integer) returns jsonb language plpgsql set search_path='' as $$
declare c private.campaigns;v private.qurban_volunteers;l private.qurban_volunteer_assignment_labels;previous uuid;
begin
 c:=private.qurban_volunteer_campaign(target);if expected is null or expected<1 or (label is null and label_version is not null) or (label is not null and (label_version is null or label_version<1)) then raise exception 'Invalid assignment version' using errcode='22023';end if;
 select * into v from private.qurban_volunteers where id=volunteer and campaign_id=target for update;if not found then raise exception 'Access denied' using errcode='42501';end if;
 if v.version<>expected or v.status<>'submitted' then raise exception 'Refresh volunteer' using errcode='PT409';end if;
 if label is not null then select * into l from private.qurban_volunteer_assignment_labels where id=label and campaign_id=target for share;if not found then raise exception 'Access denied' using errcode='42501';end if;if not l.active or l.version<>label_version then raise exception 'Refresh label' using errcode='PT409';end if;end if;
 if v.assignment_label_id is not distinct from label then return jsonb_build_object('id',v.id,'version',v.version,'unchanged',true);end if;
 previous:=v.assignment_label_id;update private.qurban_volunteers set assignment_label_id=label where id=v.id returning * into v;
 insert into private.qurban_volunteer_audit(campaign_id,volunteer_id,label_id,previous_label_id,actor_id,action,expected_version,resulting_version,changed_fields)
 values(target,v.id,label,previous,auth.uid(),case when label is null then 'volunteer.assignment.cleared' when previous is null then 'volunteer.assignment.set' else 'volunteer.assignment.changed' end,expected,v.version,array['assignment_label_id']);
 return jsonb_build_object('id',v.id,'version',v.version);
end $$;
create function private.qurban_volunteer_activity(target uuid,page_number integer) returns jsonb language plpgsql set search_path='' as $$
declare c private.campaigns;
begin c:=private.qurban_admin_campaign(target,false);perform private.require_campaign_access('audit');if page_number is null or page_number not between 1 and 10000 then raise exception 'Invalid page' using errcode='22023';end if;
 return jsonb_build_object('page',page_number,'items',coalesce((select jsonb_agg(to_jsonb(a) order by occurred_at desc,id desc) from (select * from private.qurban_volunteer_audit where campaign_id=target order by occurred_at desc,id desc limit 50 offset (page_number-1)*50)a),'[]'::jsonb));end $$;

alter table private.qurban_export_requests add column volunteer_count integer not null default 0 check(volunteer_count between 0 and 10000);
alter table private.qurban_operational_audit add column volunteer_count integer check(volunteer_count is null or (action='qurban.export.xlsx' and volunteer_count between 0 and 10000));

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
 select jsonb_build_object('campaign',jsonb_build_object('id',c.id,'title',c.title,'campaign_year',c.configuration->'campaign_year','hijri_display_label',c.configuration->>'hijri_display_label',
 'currency',c.configuration->>'currency','price_per_share_minor',c.configuration->'price_per_cattle_share_minor','cattle_count',c.configuration->'cattle_count','shares_per_cattle',c.configuration->'shares_per_cattle'),
 'volunteers',coalesce((select jsonb_agg(jsonb_build_object('id',id,'public_reference',public_reference,'name',name,'phone',phone,'email',email,'shirt_size',shirt_size,'also_participant',also_participant,'participant_name_information',participant_name_information,'assignment_label_id',assignment_label_id,'assignment_label',assignment_label,'status',status,'created_at',created_at,'updated_at',updated_at) order by case when status='cancelled' then 2 when assignment_label_id is null then 1 else 0 end,assignment_sort collate "C",lower(name) collate "C",public_reference) from volunteers),'[]'::jsonb),
 'allocation_summary',jsonb_build_object('initialized',exists(select 1 from private.qurban_cattle where campaign_id=target),'capacity',(select count(*) from private.qurban_cattle_slots where campaign_id=target),'allocated',(select count(*) from private.qurban_allocations where campaign_id=target),'empty',(select count(*) from private.qurban_cattle_slots where campaign_id=target)-(select count(*) from private.qurban_allocations where campaign_id=target)),
 'summary',jsonb_build_object('registrations',(select count(*) from regs),'submitted',(select count(*) from regs where status='submitted'),'cancelled',(select count(*) from regs where status='cancelled'),
 'participants',(select count(*) from parts),'qurban',(select count(*) from parts where purpose='qurban'),'aqiqah',(select count(*) from parts where purpose='aqiqah')),
 'registrations',coalesce((select jsonb_agg(jsonb_build_object('id',id,'public_reference',public_reference,'applicant_name',applicant_name,'phone',phone,'address',address,'email',email,
 'attendance',attendance,'same_cattle_preference',same_cattle_preference,'status',status,'participant_count',quoted_participation_count,'created_at',created_at,'updated_at',updated_at) order by created_at,id) from regs),'[]'::jsonb),
 'participants',coalesce((select jsonb_agg(jsonb_build_object('id',id,'registration_id',registration_id,'participant_name',participant_name,'purpose',purpose,'created_at',created_at,'cattle_number',cattle_number,'slot_number',slot_number) order by created_at,id) from parts),'[]'::jsonb)) into snapshot;
 rc:=(snapshot->'summary'->>'registrations')::integer;pc:=(snapshot->'summary'->>'participants')::integer;vc:=jsonb_array_length(snapshot->'volunteers');
 if rc>5000 or pc>20000 or vc>10000 or octet_length(snapshot::text)>16777216 then raise exception 'Export bound exceeded' using errcode='22023';end if;
 insert into private.qurban_export_requests(campaign_id,actor_id,captured_at,expires_at,snapshot_hash,registration_count,participation_count,volunteer_count)
 values(target,auth.uid(),clock_timestamp(),clock_timestamp()+interval '15 minutes',encode(sha256(convert_to(snapshot::text,'UTF8')),'hex'),rc,pc,vc) returning * into ticket;
 return snapshot||jsonb_build_object('export_id',ticket.id,'snapshot_hash',ticket.snapshot_hash,'generated_at',ticket.captured_at,'generated_by',ticket.actor_id);
end $$;
create or replace function private.qurban_admin_export_complete(target uuid,export_reference uuid,snapshot_fingerprint text) returns jsonb language plpgsql set search_path='' as $$
declare c private.campaigns;t private.qurban_export_requests;
begin
 c:=private.qurban_admin_campaign(target,true);
 select * into t from private.qurban_export_requests where id=export_reference and campaign_id=target and actor_id=auth.uid() for update;
 if not found then raise exception 'Access denied' using errcode='42501';end if;
 if snapshot_fingerprint is null or snapshot_fingerprint<>t.snapshot_hash or clock_timestamp()>=t.expires_at then raise exception 'Export expired or changed' using errcode='PT409';end if;
 if t.completed_at is null then
 update private.qurban_export_requests set completed_at=clock_timestamp() where id=t.id;
 insert into private.qurban_operational_audit(campaign_id,actor_id,action,export_id,registration_count,participation_count,volunteer_count)
 values(target,auth.uid(),'qurban.export.xlsx',t.id,t.registration_count,t.participation_count,t.volunteer_count);
 end if;
 return jsonb_build_object('export_id',t.id);
end $$;

create function public.public_qurban_volunteer_context(target_slug text) returns jsonb language sql security definer set search_path='' as $$ select private.qurban_volunteer_context(target_slug); $$;

create function public.public_qurban_volunteer_submit(payload jsonb) returns jsonb language sql security definer set search_path='' as $$ select private.qurban_volunteer_submit(payload); $$;

create function public.admin_qurban_volunteer_list(target_campaign uuid,options jsonb) returns jsonb language sql security definer set search_path='' as $$ select private.qurban_volunteer_list(target_campaign,options); $$;

create function public.admin_qurban_volunteer_detail(target_campaign uuid,target_volunteer uuid) returns jsonb language sql security definer set search_path='' as $$ select private.qurban_volunteer_detail(target_campaign,target_volunteer); $$;

create function public.admin_qurban_volunteer_amend(target_campaign uuid,target_volunteer uuid,expected_version integer,changes jsonb) returns jsonb language sql security definer set search_path='' as $$ select private.qurban_volunteer_amend(target_campaign,target_volunteer,expected_version,changes); $$;

create function public.admin_qurban_volunteer_cancel(target_campaign uuid,target_volunteer uuid,expected_version integer,reason text) returns jsonb language sql security definer set search_path='' as $$ select private.qurban_volunteer_cancel(target_campaign,target_volunteer,expected_version,reason); $$;

create function public.admin_qurban_volunteer_labels(target_campaign uuid,page_number integer) returns jsonb language sql security definer set search_path='' as $$ select private.qurban_volunteer_labels(target_campaign,page_number); $$;

create function public.admin_qurban_volunteer_label_command(target_campaign uuid,payload jsonb) returns jsonb language sql security definer set search_path='' as $$ select private.qurban_volunteer_label_command(target_campaign,payload); $$;

create function public.admin_qurban_volunteer_assign(target_campaign uuid,target_volunteer uuid,expected_version integer,label_id uuid,expected_label_version integer) returns jsonb language sql security definer set search_path='' as $$ select private.qurban_volunteer_assign(target_campaign,target_volunteer,expected_version,label_id,expected_label_version); $$;

create function public.admin_qurban_volunteer_activity(target_campaign uuid,page_number integer) returns jsonb language sql security definer set search_path='' as $$ select private.qurban_volunteer_activity(target_campaign,page_number); $$;
alter table private.qurban_volunteer_assignment_labels enable row level security;
revoke all on private.qurban_volunteer_assignment_labels from public,anon,authenticated,service_role,supabase_auth_admin,authenticator,campaign_scheduler;
alter table private.qurban_volunteers enable row level security;
revoke all on private.qurban_volunteers from public,anon,authenticated,service_role,supabase_auth_admin,authenticator,campaign_scheduler;
alter table private.qurban_volunteer_idempotency enable row level security;
revoke all on private.qurban_volunteer_idempotency from public,anon,authenticated,service_role,supabase_auth_admin,authenticator,campaign_scheduler;
alter table private.qurban_volunteer_audit enable row level security;
revoke all on private.qurban_volunteer_audit from public,anon,authenticated,service_role,supabase_auth_admin,authenticator,campaign_scheduler;
revoke all on function private.qurban_volunteer_guard() from public,anon,authenticated,service_role,supabase_auth_admin,authenticator,campaign_scheduler;
revoke all on function private.qurban_volunteer_fields_valid(jsonb) from public,anon,authenticated,service_role,supabase_auth_admin,authenticator,campaign_scheduler;
revoke all on function private.qurban_volunteer_context(text) from public,anon,authenticated,service_role,supabase_auth_admin,authenticator,campaign_scheduler;
revoke all on function private.qurban_volunteer_submit(jsonb) from public,anon,authenticated,service_role,supabase_auth_admin,authenticator,campaign_scheduler;
revoke all on function private.qurban_volunteer_summary(uuid) from public,anon,authenticated,service_role,supabase_auth_admin,authenticator,campaign_scheduler;
revoke all on function private.qurban_volunteer_list(uuid,jsonb) from public,anon,authenticated,service_role,supabase_auth_admin,authenticator,campaign_scheduler;
revoke all on function private.qurban_volunteer_detail(uuid,uuid) from public,anon,authenticated,service_role,supabase_auth_admin,authenticator,campaign_scheduler;
revoke all on function private.qurban_volunteer_amend(uuid,uuid,integer,jsonb) from public,anon,authenticated,service_role,supabase_auth_admin,authenticator,campaign_scheduler;
revoke all on function private.qurban_volunteer_cancel(uuid,uuid,integer,text) from public,anon,authenticated,service_role,supabase_auth_admin,authenticator,campaign_scheduler;
revoke all on function private.qurban_volunteer_labels(uuid,integer) from public,anon,authenticated,service_role,supabase_auth_admin,authenticator,campaign_scheduler;
revoke all on function private.qurban_volunteer_label_command(uuid,jsonb) from public,anon,authenticated,service_role,supabase_auth_admin,authenticator,campaign_scheduler;
revoke all on function private.qurban_volunteer_assign(uuid,uuid,integer,uuid,integer) from public,anon,authenticated,service_role,supabase_auth_admin,authenticator,campaign_scheduler;
revoke all on function private.qurban_volunteer_activity(uuid,integer) from public,anon,authenticated,service_role,supabase_auth_admin,authenticator,campaign_scheduler;
revoke all on function private.qurban_admin_export_snapshot(uuid) from public,anon,authenticated,service_role,supabase_auth_admin,authenticator,campaign_scheduler;
revoke all on function private.qurban_admin_export_complete(uuid,uuid,text) from public,anon,authenticated,service_role,supabase_auth_admin,authenticator,campaign_scheduler;
revoke all on function public.public_qurban_volunteer_context(text) from public,anon,authenticated,service_role,supabase_auth_admin,authenticator,campaign_scheduler;
grant execute on function public.public_qurban_volunteer_context(text) to anon,authenticated;
revoke all on function public.public_qurban_volunteer_submit(jsonb) from public,anon,authenticated,service_role,supabase_auth_admin,authenticator,campaign_scheduler;
grant execute on function public.public_qurban_volunteer_submit(jsonb) to anon,authenticated;
revoke all on function public.admin_qurban_volunteer_list(uuid,jsonb) from public,anon,authenticated,service_role,supabase_auth_admin,authenticator,campaign_scheduler;
grant execute on function public.admin_qurban_volunteer_list(uuid,jsonb) to authenticated;
revoke all on function public.admin_qurban_volunteer_detail(uuid,uuid) from public,anon,authenticated,service_role,supabase_auth_admin,authenticator,campaign_scheduler;
grant execute on function public.admin_qurban_volunteer_detail(uuid,uuid) to authenticated;
revoke all on function public.admin_qurban_volunteer_amend(uuid,uuid,integer,jsonb) from public,anon,authenticated,service_role,supabase_auth_admin,authenticator,campaign_scheduler;
grant execute on function public.admin_qurban_volunteer_amend(uuid,uuid,integer,jsonb) to authenticated;
revoke all on function public.admin_qurban_volunteer_cancel(uuid,uuid,integer,text) from public,anon,authenticated,service_role,supabase_auth_admin,authenticator,campaign_scheduler;
grant execute on function public.admin_qurban_volunteer_cancel(uuid,uuid,integer,text) to authenticated;
revoke all on function public.admin_qurban_volunteer_labels(uuid,integer) from public,anon,authenticated,service_role,supabase_auth_admin,authenticator,campaign_scheduler;
grant execute on function public.admin_qurban_volunteer_labels(uuid,integer) to authenticated;
revoke all on function public.admin_qurban_volunteer_label_command(uuid,jsonb) from public,anon,authenticated,service_role,supabase_auth_admin,authenticator,campaign_scheduler;
grant execute on function public.admin_qurban_volunteer_label_command(uuid,jsonb) to authenticated;
revoke all on function public.admin_qurban_volunteer_assign(uuid,uuid,integer,uuid,integer) from public,anon,authenticated,service_role,supabase_auth_admin,authenticator,campaign_scheduler;
grant execute on function public.admin_qurban_volunteer_assign(uuid,uuid,integer,uuid,integer) to authenticated;
revoke all on function public.admin_qurban_volunteer_activity(uuid,integer) from public,anon,authenticated,service_role,supabase_auth_admin,authenticator,campaign_scheduler;
grant execute on function public.admin_qurban_volunteer_activity(uuid,integer) to authenticated;

revoke all on function private.qurban_volunteer_campaign(uuid) from public,anon,authenticated,service_role,supabase_auth_admin,authenticator,campaign_scheduler;
-- No annual/campaign/flag/task/PII seeds; no payment or allocation command added.
commit;
