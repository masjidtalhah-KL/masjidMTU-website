begin;
-- Private operational evidence; no PII values or generic Campaign audit changes.
create table private.qurban_export_requests (
 id uuid primary key default gen_random_uuid(),
 campaign_id uuid not null references private.campaigns(id) on delete restrict,
 actor_id uuid not null references public.admin_profiles(user_id) on delete restrict,
 captured_at timestamptz not null,
 expires_at timestamptz not null,
 snapshot_hash text not null check(snapshot_hash ~ '^[0-9a-f]{64}$'),
 registration_count integer not null check(registration_count between 0 and 5000),
 participation_count integer not null check(participation_count between 0 and 20000),
 completed_at timestamptz,
 check(expires_at=captured_at+interval '15 minutes'),
 check(completed_at is null or completed_at>=captured_at)
);
create index qurban_export_campaign on private.qurban_export_requests(campaign_id,captured_at,id);
create table private.qurban_operational_audit (
 id uuid primary key default gen_random_uuid(),
 campaign_id uuid not null references private.campaigns(id) on delete restrict,
 registration_id uuid,
 participation_id uuid references private.qurban_participations(id) on delete restrict,
 actor_id uuid not null references public.admin_profiles(user_id) on delete restrict,
 action text not null check(action in ('registration.amended','participation.amended','registration.cancelled','qurban.export.xlsx')),
 occurred_at timestamptz not null default clock_timestamp(),
 expected_version integer,
 resulting_version integer,
 changed_fields text[] not null default '{}',
 reason text check(reason in ('applicant_request','duplicate_registration','entry_error','other_operational')),
 export_id uuid unique references private.qurban_export_requests(id) on delete restrict,
 registration_count integer,
 participation_count integer,
 foreign key(registration_id,campaign_id) references private.qurban_registrations(id,campaign_id) on delete restrict,
 check(cardinality(changed_fields)<=6 and array_position(changed_fields,null) is null),
 check(
 (action='registration.amended' and registration_id is not null and participation_id is null and export_id is null and reason is null
  and cardinality(changed_fields)>0 and changed_fields <@ array['applicant_name','phone','address','email','attendance','same_cattle_preference']::text[])
 or (action='participation.amended' and registration_id is not null and participation_id is not null and export_id is null and reason is null
  and cardinality(changed_fields)>0 and changed_fields <@ array['participant_name','purpose']::text[])
 or (action='registration.cancelled' and registration_id is not null and participation_id is null and export_id is null and reason is not null and changed_fields=array['status']::text[])
 or (action='qurban.export.xlsx' and registration_id is null and participation_id is null and export_id is not null and reason is null and changed_fields='{}'::text[])),
 check((action='qurban.export.xlsx' and expected_version is null and resulting_version is null and registration_count is not null and participation_count is not null and registration_count between 0 and 5000 and participation_count between 0 and 20000)
  or (action<>'qurban.export.xlsx' and expected_version is not null and resulting_version is not null and expected_version>0 and resulting_version=expected_version+1 and registration_count is null and participation_count is null))
);
create index qurban_operational_audit_campaign on private.qurban_operational_audit(campaign_id,occurred_at,id);
create index qurban_operational_audit_registration on private.qurban_operational_audit(registration_id,occurred_at,id);
create index qurban_registration_status_page on private.qurban_registrations(campaign_id,status,created_at,id);
create index qurban_participation_purpose on private.qurban_participations(registration_id,purpose,id);

create function private.qurban_operational_guard() returns trigger language plpgsql set search_path='' as $$
begin
 if tg_op='DELETE' or (tg_op='UPDATE' and tg_table_name='qurban_operational_audit') then raise exception 'Immutable operational evidence' using errcode='42501'; end if;
 if tg_table_name='qurban_export_requests' and tg_op='UPDATE' then
  if old.completed_at is not null or new.completed_at is null or
   (to_jsonb(new)-'completed_at') is distinct from (to_jsonb(old)-'completed_at') then raise exception 'Immutable export request' using errcode='42501'; end if;
  new.completed_at:=clock_timestamp();
 else
  new.actor_id:=private.require_campaign_access('manage');
  if tg_table_name='qurban_export_requests' then
   new.captured_at:=clock_timestamp();new.expires_at:=new.captured_at+interval '15 minutes';
   if new.completed_at is not null then raise exception 'Incomplete export required' using errcode='23514';end if;
  else
   new.occurred_at:=clock_timestamp();
   if new.participation_id is not null and not exists(select 1 from private.qurban_participations p where p.id=new.participation_id and p.registration_id=new.registration_id) then raise exception 'Audit ownership mismatch' using errcode='23514';end if;
  end if;
 end if;
 return new;
end $$;
create trigger qurban_operational_audit_guard before insert or update or delete on private.qurban_operational_audit for each row execute function private.qurban_operational_guard();
create trigger qurban_export_request_guard before insert or update or delete on private.qurban_export_requests for each row execute function private.qurban_operational_guard();

create function private.qurban_terminal_guard() returns trigger language plpgsql set search_path='' as $$
begin
 if old.status='cancelled' and new.status<>'cancelled' then raise exception 'Cancelled is terminal' using errcode='42501';end if;
 return new;
end $$;
create trigger qurban_terminal_guard before update on private.qurban_registrations for each row execute function private.qurban_terminal_guard();

create function private.qurban_admin_campaign(target uuid,write_access boolean) returns private.campaigns
language plpgsql set search_path='' as $$
declare c private.campaigns;
begin
 if write_access then perform private.require_campaign_access('manage');
 else
  perform 1 from public.admin_profiles where user_id=auth.uid() for share;
  perform private.require_campaign_access('read');
 end if;
 select * into c from private.campaigns where id=target and type_key='qurban' and config_version=1 for share;
 if not found or not private.qurban_config_v1_valid(c.configuration) then raise exception 'Access denied' using errcode='42501';end if;
 return c;
end $$;

create function private.qurban_admin_list(target uuid,options jsonb) returns jsonb language plpgsql set search_path='' as $$
declare c private.campaigns; pg integer; sz integer; term text; st text; purpose_filter text; ord text; result jsonb;
begin
 c:=private.qurban_admin_campaign(target,false);
 if jsonb_typeof(options) is distinct from 'object' or octet_length(options::text)>1024 or not options ?& array['page','page_size','search','status','purpose','sort']
 or (select count(*) from jsonb_object_keys(options))<>6
 or jsonb_typeof(options->'page')<>'number' or (options->>'page')!~'^[1-9][0-9]{0,4}$'
 or jsonb_typeof(options->'page_size')<>'number' or (options->>'page_size')!~'^[1-9][0-9]?$'
 or jsonb_typeof(options->'search')<>'string' or not (options->>'search'='' or private.qurban_text_valid(options->>'search',1,100))
 or jsonb_typeof(options->'status')<>'string' or options->>'status' not in ('all','submitted','cancelled')
 or jsonb_typeof(options->'purpose')<>'string' or options->>'purpose' not in ('all','qurban','aqiqah')
 or jsonb_typeof(options->'sort')<>'string' or options->>'sort' not in ('newest','oldest','reference','applicant') then raise exception 'Invalid query' using errcode='22023';end if;
 pg:=(options->>'page')::integer;sz:=(options->>'page_size')::integer;
 if pg>10000 or sz>50 then raise exception 'Query bound' using errcode='22023';end if;
 term:=lower(options->>'search');st:=options->>'status';purpose_filter:=options->>'purpose';ord:=options->>'sort';
 with all_r as materialized(select * from private.qurban_registrations where campaign_id=target),
 all_p as materialized(select p.* from private.qurban_participations p join all_r r on r.id=p.registration_id),
 filtered as materialized(select r.* from all_r r where (st='all' or r.status=st)
 and (purpose_filter='all' or exists(select 1 from all_p p where p.registration_id=r.id and p.purpose=purpose_filter))
 and (term='' or lower(r.public_reference)=term or starts_with(lower(r.applicant_name),term)
 or (term ~ '^[+0-9 ()-]+$' and length(regexp_replace(term,'[^0-9]','','g'))>0 and starts_with(regexp_replace(r.phone,'[^0-9]','','g'),regexp_replace(term,'[^0-9]','','g'))))),
 paged as(select r.* from filtered r order by
 case when ord='newest' then created_at end desc,case when ord='oldest' then created_at end,
 case when ord='reference' then public_reference end,case when ord='applicant' then lower(applicant_name) end,id limit sz offset (pg-1)*sz)
 select jsonb_build_object('campaign',jsonb_build_object('id',c.id,'title',c.title,'campaign_year',c.configuration->'campaign_year',
 'hijri_display_label',c.configuration->>'hijri_display_label','currency',c.configuration->>'currency','price_per_share_minor',c.configuration->'price_per_cattle_share_minor',
 'cattle_count',c.configuration->'cattle_count','shares_per_cattle',c.configuration->'shares_per_cattle'),
 'summary',jsonb_build_object('registrations',(select count(*) from all_r),'submitted',(select count(*) from all_r where status='submitted'),
 'cancelled',(select count(*) from all_r where status='cancelled'),'participants',(select count(*) from all_p),
 'qurban',(select count(*) from all_p where purpose='qurban'),'aqiqah',(select count(*) from all_p where purpose='aqiqah')),
 'total',(select count(*) from filtered),'page',pg,'page_size',sz,'can_manage',private.active_role()<>'staff',
 'recent_mfa',private.active_role()<>'super_admin' or private.recent_totp(),
 'items',coalesce((select jsonb_agg(jsonb_build_object('id',r.id,'public_reference',r.public_reference,'applicant_name',r.applicant_name,'phone',r.phone,
 'participant_count',(select count(*) from all_p p where p.registration_id=r.id),'qurban',(select count(*) from all_p p where p.registration_id=r.id and p.purpose='qurban'),
 'aqiqah',(select count(*) from all_p p where p.registration_id=r.id and p.purpose='aqiqah'),'attendance',r.attendance,'same_cattle_preference',r.same_cattle_preference,
 'status',r.status,'created_at',r.created_at,'version',r.version)) from paged r),'[]'::jsonb)) into result;
 return result;
end $$;

create function private.qurban_admin_detail(target uuid,registration uuid) returns jsonb language plpgsql set search_path='' as $$
declare c private.campaigns;r private.qurban_registrations; result jsonb; staff boolean;
begin
 c:=private.qurban_admin_campaign(target,false);staff:=private.active_role()='staff';
 select * into r from private.qurban_registrations where id=registration and campaign_id=target;
 if not found then return null;end if;
 result:=jsonb_build_object('id',r.id,'campaign_id',r.campaign_id,'public_reference',r.public_reference,'applicant_name',r.applicant_name,'phone',r.phone,
 'attendance',r.attendance,'same_cattle_preference',r.same_cattle_preference,'status',r.status,'created_at',r.created_at,'updated_at',r.updated_at,'version',r.version,
 'quote',jsonb_build_object('currency',r.quoted_currency,'price_per_share_minor',r.quoted_price_per_share_minor,'participant_count',r.quoted_participation_count,
 'total_minor',r.quoted_total_minor,'campaign_year',r.submission_configuration->'campaign_year','hijri_display_label',r.submission_configuration->>'hijri_display_label'),
 'participants',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'participant_name',p.participant_name,'purpose',p.purpose,'version',p.version,'created_at',p.created_at,'updated_at',p.updated_at) order by p.created_at,p.id)
 from private.qurban_participations p where p.registration_id=r.id),'[]'::jsonb),
 'allowed_purposes',r.submission_configuration->'allowed_purposes','can_manage',not staff,'recent_mfa',private.active_role()<>'super_admin' or private.recent_totp());
 if not staff then
 result:=result||jsonb_build_object('address',r.address,'email',r.email,'consent',(select jsonb_build_object('accepted_at',a.accepted_at,'akad_reference',v.version_reference,'content_hash',a.accepted_content_hash,
 'original_participant_count',jsonb_array_length(a.participation_snapshot),'current_participants_differ',exists(select 1 from jsonb_array_elements(a.participation_snapshot) e where not exists(
 select 1 from private.qurban_participations p where p.registration_id=r.id and p.id=(e->>'id')::uuid and p.participant_name=e->>'participant_name' and p.purpose=e->>'purpose')))
 from private.qurban_consent_acceptances a join private.qurban_akad_versions v on v.id=a.akad_version_id where a.registration_id=r.id order by a.accepted_at,a.id limit 1));
 end if;
 return result;
end $$;

create function private.qurban_admin_amend(target uuid,registration uuid,payload jsonb) returns jsonb language plpgsql set search_path='' as $$
declare c private.campaigns;r private.qurban_registrations;p private.qurban_participations; fields text[]; ev integer;pv integer;pid uuid; changes jsonb; kind text;
begin
 c:=private.qurban_admin_campaign(target,true);
 if jsonb_typeof(payload) is distinct from 'object' or octet_length(payload::text)>4096 or not payload ?& array['kind','expected_version','changes']
 or jsonb_typeof(payload->'expected_version')<>'number' or (payload->>'expected_version')!~'^[1-9][0-9]{0,9}$' or (payload->>'expected_version')::numeric>2147483647
 or jsonb_typeof(payload->'changes')<>'object' or jsonb_typeof(payload->'kind')<>'string' then raise exception 'Invalid amendment' using errcode='22023';end if;
 kind:=payload->>'kind';changes:=payload->'changes';ev:=(payload->>'expected_version')::integer;
 select * into r from private.qurban_registrations where id=registration and campaign_id=target for update;
 if not found then raise exception 'Access denied' using errcode='42501';end if;
 if r.version<>ev or r.status<>'submitted' then raise exception 'Refresh and review' using errcode='PT409';end if;
 if kind='registration' then
 if (select count(*) from jsonb_object_keys(payload))<>3 or not changes ?& array['applicant_name','phone','address','email','attendance','same_cattle_preference']
 or (select count(*) from jsonb_object_keys(changes))<>6 or jsonb_typeof(changes->'applicant_name')<>'string' or not private.qurban_text_valid(changes->>'applicant_name',1,160)
 or jsonb_typeof(changes->'phone')<>'string' or not private.qurban_text_valid(changes->>'phone',8,30) or changes->>'phone'!~'^[+]?[0-9 ()-]+$'
 or length(regexp_replace(changes->>'phone','[^0-9]','','g')) not between 8 and 15
 or jsonb_typeof(changes->'address')<>'string' or length(changes->>'address') not between 1 and 500
 or not private.qurban_text_valid(replace(replace(changes->>'address',E'\r\n',E'\n'),E'\n',' '),1,500)
 or jsonb_typeof(changes->'email') not in ('null','string') or (changes->'email'<>'null'::jsonb and
 (not private.qurban_text_valid(changes->>'email',3,254) or changes->>'email'!~'^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'))
 or jsonb_typeof(changes->'attendance')<>'string' or changes->>'attendance' not in ('yes','no','unsure')
 or jsonb_typeof(changes->'same_cattle_preference')<>'boolean' then raise exception 'Invalid contact correction' using errcode='22023';end if;
 select coalesce(array_agg(k order by k),'{}') into fields from jsonb_object_keys(changes) k where (to_jsonb(r)->k) is distinct from changes->k;
 if cardinality(fields)=0 then return jsonb_build_object('id',r.id,'version',r.version,'unchanged',true);end if;
 update private.qurban_registrations set applicant_name=changes->>'applicant_name',phone=changes->>'phone',address=changes->>'address',email=changes->>'email',
 attendance=changes->>'attendance',same_cattle_preference=(changes->>'same_cattle_preference')::boolean where id=r.id returning * into r;
 insert into private.qurban_operational_audit(campaign_id,registration_id,actor_id,action,expected_version,resulting_version,changed_fields)
 values(target,r.id,auth.uid(),'registration.amended',ev,r.version,fields);
 elsif kind='participation' then
 if not payload ?& array['participation_id','expected_participation_version'] or (select count(*) from jsonb_object_keys(payload))<>5
 or jsonb_typeof(payload->'participation_id')<>'string' or (payload->>'participation_id')!~'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
 or jsonb_typeof(payload->'expected_participation_version')<>'number' or (payload->>'expected_participation_version')!~'^[1-9][0-9]{0,9}$' or (payload->>'expected_participation_version')::numeric>2147483647
 or not changes ?& array['participant_name','purpose'] or (select count(*) from jsonb_object_keys(changes))<>2
 or jsonb_typeof(changes->'participant_name')<>'string' or not private.qurban_text_valid(changes->>'participant_name',1,160)
 or jsonb_typeof(changes->'purpose')<>'string' or not (r.submission_configuration->'allowed_purposes') ? (changes->>'purpose') then raise exception 'Invalid participant correction' using errcode='22023';end if;
 pid:=(payload->>'participation_id')::uuid;pv:=(payload->>'expected_participation_version')::integer;
 select * into p from private.qurban_participations where id=pid and registration_id=r.id for update;
 if not found then raise exception 'Access denied' using errcode='42501';end if;
 if p.version<>pv then raise exception 'Refresh and review' using errcode='PT409';end if;
 select coalesce(array_agg(k order by k),'{}') into fields from jsonb_object_keys(changes) k where (to_jsonb(p)->k) is distinct from changes->k;
 if cardinality(fields)=0 then return jsonb_build_object('id',r.id,'version',r.version,'unchanged',true);end if;
 update private.qurban_participations set participant_name=changes->>'participant_name',purpose=changes->>'purpose' where id=p.id returning * into p;
 -- Touch the aggregate revision too, so concurrent contact/child edits conflict.
 update private.qurban_registrations set updated_at=clock_timestamp() where id=r.id returning * into r;
 insert into private.qurban_operational_audit(campaign_id,registration_id,participation_id,actor_id,action,expected_version,resulting_version,changed_fields)
 values(target,r.id,p.id,auth.uid(),'participation.amended',pv,p.version,fields);
 else raise exception 'Invalid amendment kind' using errcode='22023';end if;
 return jsonb_build_object('id',r.id,'version',r.version,'unchanged',false);
end $$;

create function private.qurban_admin_cancel(target uuid,registration uuid,expected integer,reason_code text) returns jsonb language plpgsql set search_path='' as $$
declare c private.campaigns;r private.qurban_registrations;
begin
 c:=private.qurban_admin_campaign(target,true);
 if expected is null or expected<1 or reason_code is null or reason_code not in ('applicant_request','duplicate_registration','entry_error','other_operational') then raise exception 'Mandatory controlled reason' using errcode='22023';end if;
 select * into r from private.qurban_registrations where id=registration and campaign_id=target for update;
 if not found then raise exception 'Access denied' using errcode='42501';end if;
 if r.version<>expected or r.status<>'submitted' then raise exception 'Refresh and review' using errcode='PT409';end if;
 update private.qurban_registrations set status='cancelled' where id=r.id returning * into r;
 insert into private.qurban_operational_audit(campaign_id,registration_id,actor_id,action,expected_version,resulting_version,changed_fields,reason)
 values(target,r.id,auth.uid(),'registration.cancelled',expected,r.version,array['status'],reason_code);
 return jsonb_build_object('id',r.id,'version',r.version,'unchanged',false);
end $$;

create function private.qurban_admin_activity(target uuid,page_number integer) returns jsonb language plpgsql set search_path='' as $$
declare c private.campaigns;
begin
 c:=private.qurban_admin_campaign(target,false);perform private.require_campaign_access('audit');
 if page_number is null or page_number not between 1 and 10000 then raise exception 'Invalid page' using errcode='22023';end if;
 return jsonb_build_object('page',page_number,'items',coalesce((select jsonb_agg(to_jsonb(t)) from (
 select id,registration_id,participation_id,actor_id,action,occurred_at,expected_version,resulting_version,changed_fields,reason,export_id,registration_count,participation_count
 from private.qurban_operational_audit where campaign_id=target order by occurred_at desc,id desc limit 50 offset (page_number-1)*50)t),'[]'::jsonb));
end $$;

create function private.qurban_admin_export_snapshot(target uuid) returns jsonb language plpgsql set search_path='' as $$
declare c private.campaigns; snapshot jsonb; ticket private.qurban_export_requests; rc integer;pc integer;
begin
 c:=private.qurban_admin_campaign(target,true);
 select count(*) into rc from private.qurban_registrations where campaign_id=target;
 select count(*) into pc from private.qurban_participations p join private.qurban_registrations r on r.id=p.registration_id where r.campaign_id=target;
 if rc>5000 or pc>20000 then raise exception 'Export bound exceeded' using errcode='22023';end if;
 -- One SQL statement / MVCC snapshot owns every sheet's input and count.
 with regs as materialized(select * from private.qurban_registrations where campaign_id=target),
 parts as materialized(select p.* from private.qurban_participations p join regs r on r.id=p.registration_id)
 select jsonb_build_object('campaign',jsonb_build_object('id',c.id,'title',c.title,'campaign_year',c.configuration->'campaign_year','hijri_display_label',c.configuration->>'hijri_display_label',
 'currency',c.configuration->>'currency','price_per_share_minor',c.configuration->'price_per_cattle_share_minor','cattle_count',c.configuration->'cattle_count','shares_per_cattle',c.configuration->'shares_per_cattle'),
 'summary',jsonb_build_object('registrations',(select count(*) from regs),'submitted',(select count(*) from regs where status='submitted'),'cancelled',(select count(*) from regs where status='cancelled'),
 'participants',(select count(*) from parts),'qurban',(select count(*) from parts where purpose='qurban'),'aqiqah',(select count(*) from parts where purpose='aqiqah')),
 'registrations',coalesce((select jsonb_agg(jsonb_build_object('id',id,'public_reference',public_reference,'applicant_name',applicant_name,'phone',phone,'address',address,'email',email,
 'attendance',attendance,'same_cattle_preference',same_cattle_preference,'status',status,'participant_count',quoted_participation_count,'created_at',created_at,'updated_at',updated_at) order by created_at,id) from regs),'[]'::jsonb),
 'participants',coalesce((select jsonb_agg(jsonb_build_object('id',id,'registration_id',registration_id,'participant_name',participant_name,'purpose',purpose,'created_at',created_at) order by created_at,id) from parts),'[]'::jsonb)) into snapshot;
 rc:=(snapshot->'summary'->>'registrations')::integer;pc:=(snapshot->'summary'->>'participants')::integer;
 if rc>5000 or pc>20000 or octet_length(snapshot::text)>16777216 then raise exception 'Export bound exceeded' using errcode='22023';end if;
 insert into private.qurban_export_requests(campaign_id,actor_id,captured_at,expires_at,snapshot_hash,registration_count,participation_count)
 values(target,auth.uid(),clock_timestamp(),clock_timestamp()+interval '15 minutes',encode(sha256(convert_to(snapshot::text,'UTF8')),'hex'),rc,pc) returning * into ticket;
 return snapshot||jsonb_build_object('export_id',ticket.id,'snapshot_hash',ticket.snapshot_hash,'generated_at',ticket.captured_at,'generated_by',ticket.actor_id);
end $$;

create function private.qurban_admin_export_complete(target uuid,export_reference uuid,snapshot_fingerprint text) returns jsonb language plpgsql set search_path='' as $$
declare c private.campaigns;t private.qurban_export_requests;
begin
 c:=private.qurban_admin_campaign(target,true);
 select * into t from private.qurban_export_requests where id=export_reference and campaign_id=target and actor_id=auth.uid() for update;
 if not found then raise exception 'Access denied' using errcode='42501';end if;
 if snapshot_fingerprint is null or snapshot_fingerprint<>t.snapshot_hash or clock_timestamp()>=t.expires_at then raise exception 'Export expired or changed' using errcode='PT409';end if;
 if t.completed_at is null then
 update private.qurban_export_requests set completed_at=clock_timestamp() where id=t.id;
 insert into private.qurban_operational_audit(campaign_id,actor_id,action,export_id,registration_count,participation_count)
 values(target,auth.uid(),'qurban.export.xlsx',t.id,t.registration_count,t.participation_count);
 end if;
 return jsonb_build_object('export_id',t.id);
end $$;

create function public.admin_qurban_list(target_campaign uuid,options jsonb) returns jsonb language sql security definer set search_path='' as $$ select private.qurban_admin_list(target_campaign,options); $$;

create function public.admin_qurban_detail(target_campaign uuid,target_registration uuid) returns jsonb language sql security definer set search_path='' as $$ select private.qurban_admin_detail(target_campaign,target_registration); $$;

create function public.admin_qurban_amend(target_campaign uuid,target_registration uuid,payload jsonb) returns jsonb language sql security definer set search_path='' as $$ select private.qurban_admin_amend(target_campaign,target_registration,payload); $$;

create function public.admin_qurban_cancel(target_campaign uuid,target_registration uuid,expected_version integer,reason text) returns jsonb language sql security definer set search_path='' as $$ select private.qurban_admin_cancel(target_campaign,target_registration,expected_version,reason); $$;

create function public.admin_qurban_activity(target_campaign uuid,page_number integer) returns jsonb language sql security definer set search_path='' as $$ select private.qurban_admin_activity(target_campaign,page_number); $$;

create function public.admin_qurban_export_snapshot(target_campaign uuid) returns jsonb language sql security definer set search_path='' as $$ select private.qurban_admin_export_snapshot(target_campaign); $$;

create function public.admin_qurban_export_complete(target_campaign uuid,export_reference uuid,snapshot_fingerprint text) returns jsonb language sql security definer set search_path='' as $$ select private.qurban_admin_export_complete(target_campaign,export_reference,snapshot_fingerprint); $$;
alter table private.qurban_operational_audit enable row level security;
alter table private.qurban_export_requests enable row level security;
revoke all on private.qurban_operational_audit,private.qurban_export_requests from public,anon,authenticated,service_role,supabase_auth_admin,authenticator,campaign_scheduler;
revoke all on function private.qurban_terminal_guard(),private.qurban_operational_guard(),private.qurban_admin_campaign(uuid,boolean),private.qurban_admin_list(uuid,jsonb),public.admin_qurban_list(uuid,jsonb),private.qurban_admin_detail(uuid,uuid),public.admin_qurban_detail(uuid,uuid),private.qurban_admin_amend(uuid,uuid,jsonb),public.admin_qurban_amend(uuid,uuid,jsonb),private.qurban_admin_cancel(uuid,uuid,integer,text),public.admin_qurban_cancel(uuid,uuid,integer,text),private.qurban_admin_activity(uuid,integer),public.admin_qurban_activity(uuid,integer),private.qurban_admin_export_snapshot(uuid),public.admin_qurban_export_snapshot(uuid),private.qurban_admin_export_complete(uuid,uuid,text),public.admin_qurban_export_complete(uuid,uuid,text) from public,anon,authenticated,service_role,supabase_auth_admin,authenticator,campaign_scheduler;
grant execute on function public.admin_qurban_list(uuid,jsonb),public.admin_qurban_detail(uuid,uuid),public.admin_qurban_amend(uuid,uuid,jsonb),public.admin_qurban_cancel(uuid,uuid,integer,text),public.admin_qurban_activity(uuid,integer),public.admin_qurban_export_snapshot(uuid),public.admin_qurban_export_complete(uuid,uuid,text) to authenticated;
commit;
