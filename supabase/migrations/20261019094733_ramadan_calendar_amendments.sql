begin;
-- 10.2c: immutable operational calendar overlay; no historical business row is rewritten.
create table private.ramadan_calendar_proposals(
 id uuid primary key default gen_random_uuid(),campaign_id uuid not null references private.campaigns(id),
 base_revision integer not null check(base_revision>=0),campaign_year integer not null check(campaign_year between 1900 and 9999),hijri_display_label text not null check(private.ramadan_text_valid(hijri_display_label,1,80)),
 calendar_status text not null check(calendar_status in('estimated','confirmed')),start_date date not null check(isfinite(start_date)),duration smallint check(duration in(29,30)),
 announcement_reference text not null check(private.ramadan_text_valid(announcement_reference,1,240)),reason text not null check(reason in('planning','official_start','official_duration','date_correction')),
 change_mode text not null check(change_mode in('align','selected')),source_hash text not null check(source_hash~'^[0-9a-f]{64}$'),preview_hash text not null check(preview_hash~'^[0-9a-f]{64}$'),payload_hash text not null check(payload_hash~'^[0-9a-f]{64}$'),key_hash text not null check(key_hash~'^[0-9a-f]{64}$'),
 prepared_at timestamptz not null default clock_timestamp(),prepared_by uuid not null references public.admin_profiles(user_id),
 unique(id,campaign_id),unique(campaign_id,key_hash),check(calendar_status='confirmed'or duration is null)
);
create table private.ramadan_calendar_entries(
 proposal_id uuid not null,campaign_id uuid not null,schedule_entry_id uuid not null,ramadan_day_number smallint not null check(ramadan_day_number between 1 and 30),
 schedule_version integer not null check(schedule_version>0),original_date date not null check(isfinite(original_date)),previous_date date not null check(isfinite(previous_date)),effective_date date,
 resolution_required boolean not null,primary key(proposal_id,schedule_entry_id),
 foreign key(proposal_id,campaign_id)references private.ramadan_calendar_proposals(id,campaign_id),
 foreign key(schedule_entry_id,campaign_id)references private.ramadan_schedule_entries(id,campaign_id),
 check((resolution_required and effective_date is null)or(not resolution_required and effective_date is not null and isfinite(effective_date)))
);
create table private.ramadan_calendar_revisions(
 id uuid primary key default gen_random_uuid(),campaign_id uuid not null references private.campaigns(id),proposal_id uuid not null unique,revision integer not null check(revision>0),
 approved_at timestamptz not null default clock_timestamp(),approved_by uuid not null references public.admin_profiles(user_id),
 unique(id,campaign_id),unique(campaign_id,revision),foreign key(proposal_id,campaign_id)references private.ramadan_calendar_proposals(id,campaign_id)
);
create table private.ramadan_calendar_audit(
 id uuid primary key default gen_random_uuid(),campaign_id uuid not null,proposal_id uuid not null,revision_id uuid,actor_id uuid not null references public.admin_profiles(user_id),
 action text not null check(action in('calendar.proposal.prepared','calendar.revision.published')),occurred_at timestamptz not null default clock_timestamp(),
 base_revision integer not null check(base_revision>=0),resulting_revision integer,affected_count integer not null check(affected_count between 0 and 500),
 unique(proposal_id,action),foreign key(proposal_id,campaign_id)references private.ramadan_calendar_proposals(id,campaign_id),foreign key(revision_id,campaign_id)references private.ramadan_calendar_revisions(id,campaign_id),
 check((action='calendar.proposal.prepared'and revision_id is null and resulting_revision is null)or(action='calendar.revision.published'and revision_id is not null and resulting_revision=base_revision+1))
);
-- Only future items get acceptance rows. Earlier immutable items retain their original locked schedule date.
create table private.ramadan_item_calendar_acceptances(
 item_id uuid primary key,sponsorship_id uuid not null,campaign_id uuid not null,revision_id uuid,
 accepted_date date not null check(isfinite(accepted_date)),ramadan_day_number smallint not null check(ramadan_day_number between 1 and 30),accepted_at timestamptz not null default clock_timestamp(),
 foreign key(item_id,sponsorship_id,campaign_id)references private.ramadan_sponsorship_items(id,sponsorship_id,campaign_id),foreign key(revision_id,campaign_id)references private.ramadan_calendar_revisions(id,campaign_id)
);
create index ramadan_calendar_proposal_history on private.ramadan_calendar_proposals(campaign_id,prepared_at desc,id);
create index ramadan_calendar_schedule_history on private.ramadan_calendar_entries(campaign_id,schedule_entry_id,proposal_id);
create index ramadan_calendar_acceptance_sponsor on private.ramadan_item_calendar_acceptances(sponsorship_id,item_id);
create function private.ramadan_calendar_current(target uuid)returns jsonb language sql stable set search_path=''as $$
 select jsonb_build_object('revision',r.revision,'status',p.calendar_status,'start_date',p.start_date,'duration',p.duration,'approved_at',r.approved_at)
 from private.ramadan_calendar_revisions r join private.ramadan_calendar_proposals p on p.id=r.proposal_id where r.campaign_id=target order by r.revision desc limit 1
$$;
create function private.ramadan_calendar_effective(schedule uuid)returns date language sql stable set search_path=''as $$
 select coalesce((select case when e.original_date=s.service_date and e.ramadan_day_number=s.ramadan_day_number then coalesce(e.effective_date,e.previous_date)else s.service_date end from private.ramadan_calendar_revisions r join private.ramadan_calendar_entries e on e.proposal_id=r.proposal_id where r.campaign_id=s.campaign_id and e.schedule_entry_id=s.id order by r.revision desc limit 1),s.service_date)from private.ramadan_schedule_entries s where s.id=schedule
$$;
create function private.ramadan_calendar_invalid(schedule uuid)returns boolean language sql stable set search_path=''as $$
 select exists(select 1 from private.ramadan_calendar_entries e join private.ramadan_calendar_revisions r on r.proposal_id=e.proposal_id where e.schedule_entry_id=schedule and e.resolution_required)
$$;
create function private.ramadan_calendar_sponsor_invalid(sponsor uuid)returns boolean language sql stable set search_path=''as $$
 select exists(select 1 from private.ramadan_sponsorship_items i where i.sponsorship_id=sponsor and i.mode='FIXED_SLOT'and private.ramadan_calendar_invalid(i.schedule_entry_id))
$$;
create function private.ramadan_calendar_dates(sponsor uuid)returns jsonb language sql stable set search_path=''as $$
 select coalesce(jsonb_agg(jsonb_build_object('offering_name',i.accepted_offering_name,'ramadan_day_number',s.ramadan_day_number,'accepted_date',coalesce(a.accepted_date,s.service_date),'current_date',case when private.ramadan_calendar_invalid(s.id)then null else private.ramadan_calendar_effective(s.id)end,'resolution_required',private.ramadan_calendar_invalid(s.id),'changed',coalesce(a.accepted_date,s.service_date)<>private.ramadan_calendar_effective(s.id),'slots',coalesce((select jsonb_agg(sl.slot_number order by sl.slot_number)from private.ramadan_slot_assignments x join private.ramadan_slots sl on sl.id=x.slot_id where x.item_id=i.id),'[]'::jsonb))order by i.created_at,i.id),'[]'::jsonb)
 from private.ramadan_sponsorship_items i join private.ramadan_schedule_entries s on s.id=i.schedule_entry_id left join private.ramadan_item_calendar_acceptances a on a.item_id=i.id where i.sponsorship_id=sponsor
$$;
create function private.ramadan_calendar_lock(target uuid,writing boolean)returns private.campaigns language plpgsql set search_path=''as $$
 declare c private.campaigns;begin
 perform private.require_campaign_access(case when writing then'manage'else'read'end);
 perform pg_advisory_xact_lock_shared(hashtextextended('campaign-system-flag:campaigns.enabled',0));perform pg_advisory_xact_lock_shared(hashtextextended('campaign-system-flag:ramadan.enabled',0));
 perform 1 from private.system_feature_flags where flag_key in('campaigns.enabled','ramadan.enabled')order by flag_key for share;
 perform pg_advisory_xact_lock(hashtextextended('ramadan:'||target::text,0));select *into c from private.campaigns where id=target for update;
 perform private.ramadan_campaign_valid(target);if c.status='archived'then raise exception 'Access denied'using errcode='42501';end if;return c;
 end $$;
create function private.ramadan_calendar_source(target uuid)returns text language sql stable set search_path=''as $$
 select private.ramadan_proof_hash(jsonb_build_object('today',(statement_timestamp()at time zone'Asia/Kuala_Lumpur')::date,'calendar',private.ramadan_calendar_current(target),'campaign',(select jsonb_build_array(version,status,configuration)from private.campaigns where id=target),
 'flags',(select jsonb_agg(jsonb_build_array(flag_key,enabled,version)order by flag_key)from private.system_feature_flags where flag_key in('campaigns.enabled','ramadan.enabled')),
 'catalog',(select jsonb_agg(jsonb_build_array(s.id,s.version,s.service_date,s.ramadan_day_number,s.slot_count,s.active,o.version,o.name,o.mode)order by s.id)from private.ramadan_schedule_entries s join private.ramadan_offerings o on o.id=s.offering_id where s.campaign_id=target),
 'activity',(select jsonb_agg(jsonb_build_array(i.id,i.schedule_entry_id,r.id,r.version,r.status,p.id,rec.id)order by i.id)from private.ramadan_sponsorship_items i join private.ramadan_sponsorships r on r.id=i.sponsorship_id left join private.ramadan_payments p on p.sponsorship_id=r.id left join private.ramadan_receipts rec on rec.sponsorship_id=r.id where i.campaign_id=target))::text)
$$;
create function private.ramadan_calendar_preview(target uuid,p jsonb)returns jsonb language plpgsql set search_path=''as $$
declare c private.campaigns;cur jsonb;start_day date;days integer;expected integer;source text;result jsonb:='[]';errors jsonb:='[]';v record;edit jsonb;dest date;invalid boolean;was_invalid boolean;changed boolean;block text;entry jsonb;summary jsonb;begin
 c:=private.ramadan_calendar_lock(target,true);cur:=private.ramadan_calendar_current(target);
 if not private.ramadan_exact_object(p,array['expected_revision','status','start_date','duration','reference','reason','mode','changes'])or octet_length(p::text)>16384
 or jsonb_typeof(p->'expected_revision')is distinct from'number'or p->>'expected_revision'!~'^[0-9]{1,9}$'
 or p->>'status'not in('estimated','confirmed')or jsonb_typeof(p->'status')is distinct from'string'
 or jsonb_typeof(p->'start_date')is distinct from'string'or p->>'start_date'!~'^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
 or not private.ramadan_text_valid(p->>'reference',1,240)or jsonb_typeof(p->'reference')is distinct from'string'
 or p->>'reason'not in('planning','official_start','official_duration','date_correction')or p->>'mode'not in('align','selected')
 or jsonb_typeof(p->'changes')is distinct from'array'or jsonb_array_length(p->'changes')>100 then raise exception 'Invalid calendar proposal'using errcode='22023';end if;
 expected:=(p->>'expected_revision')::integer;if expected<>coalesce((cur->>'revision')::integer,0)then raise exception 'Refresh calendar'using errcode='PT409';end if;
 begin start_day:=(p->>'start_date')::date;exception when others then raise exception 'Invalid calendar date'using errcode='22023';end;
 if not isfinite(start_day)or to_char(start_day,'YYYY-MM-DD')<>p->>'start_date'or extract(year from start_day)::integer<>(c.configuration->>'campaign_year')::integer then raise exception 'Invalid campaign calendar year'using errcode='22023';end if;
 if p->'duration'<>'null'::jsonb then if jsonb_typeof(p->'duration')<>'number'or p->>'duration'not in('29','30')or p->>'status'<>'confirmed'then raise exception 'Invalid confirmed duration'using errcode='22023';end if;days:=(p->>'duration')::integer;end if;
 if cur->>'status'='confirmed'and p->>'status'<>'confirmed'then raise exception 'Confirmed calendar cannot become estimated'using errcode='22023';end if;
 if p->>'mode'='align'and jsonb_array_length(p->'changes')<>0 or p->>'mode'='selected'and jsonb_array_length(p->'changes')=0 then raise exception 'Explicit selection required'using errcode='22023';end if;
 for edit in select value from jsonb_array_elements(p->'changes')loop
  if not private.ramadan_exact_object(edit,array['schedule_id','expected_version','effective_date'])or jsonb_typeof(edit->'schedule_id')is distinct from'string'or edit->>'schedule_id'!~'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  or jsonb_typeof(edit->'expected_version')is distinct from'number'or edit->>'expected_version'!~'^[1-9][0-9]{0,8}$'or jsonb_typeof(edit->'effective_date')is distinct from'string'or edit->>'effective_date'!~'^[0-9]{4}-[0-9]{2}-[0-9]{2}$'then raise exception 'Invalid date correction'using errcode='22023';end if;
  if not exists(select 1 from private.ramadan_schedule_entries where id=(edit->>'schedule_id')::uuid and campaign_id=target and version=(edit->>'expected_version')::integer)then raise exception 'Refresh schedule'using errcode='PT409';end if;
 end loop;
 if exists(select 1 from jsonb_array_elements(p->'changes')x group by x->>'schedule_id'having count(*)>1)then raise exception 'Duplicate schedule correction'using errcode='22023';end if;
 if(select count(*)from private.ramadan_schedule_entries where campaign_id=target)>500 then raise exception 'Calendar bound exceeded'using errcode='22023';end if;
 source:=private.ramadan_calendar_source(target);
 for v in select s.*,o.name,private.ramadan_calendar_effective(s.id)current_date_value from private.ramadan_schedule_entries s join private.ramadan_offerings o on o.id=s.offering_id where s.campaign_id=target order by s.ramadan_day_number,o.display_order,s.id loop
  select value into edit from jsonb_array_elements(p->'changes')where value->>'schedule_id'=v.id::text;
  was_invalid:=private.ramadan_calendar_invalid(v.id);invalid:=was_invalid or(days is not null and v.ramadan_day_number>days);
  begin dest:=case when invalid then null when p->>'mode'='align'then start_day+v.ramadan_day_number-1 when edit is not null then(edit->>'effective_date')::date else v.current_date_value end;exception when others then raise exception 'Invalid correction date'using errcode='22023';end;
  changed:=invalid is distinct from was_invalid or(not invalid and dest<>v.current_date_value);block:=null;
  if not invalid and(dest is null or not isfinite(dest)or dest<>start_day+v.ramadan_day_number-1 or dest>date'9999-12-31')then block:='mapping_conflict';end if;
  if changed and(v.current_date_value<=(statement_timestamp()at time zone'Asia/Kuala_Lumpur')::date or(dest is not null and dest<=(statement_timestamp()at time zone'Asia/Kuala_Lumpur')::date))then block:='past_program';end if;
  entry:=jsonb_build_object('schedule_id',v.id,'offering_id',v.offering_id,'offering_name',v.name,'ramadan_day_number',v.ramadan_day_number,'schedule_version',v.version,'original_date',v.service_date,'previous_date',v.current_date_value,'effective_date',dest,'resolution_required',invalid,'changed',changed,'block',block,
   'sponsorships',(select count(distinct i.sponsorship_id)from private.ramadan_sponsorship_items i where i.schedule_entry_id=v.id),
   'pending',(select count(distinct i.sponsorship_id)from private.ramadan_sponsorship_items i join private.ramadan_sponsorships r on r.id=i.sponsorship_id where i.schedule_entry_id=v.id and r.status='submitted'and not exists(select 1 from private.ramadan_payments py where py.sponsorship_id=r.id)),
   'verified',(select count(distinct i.sponsorship_id)from private.ramadan_sponsorship_items i join private.ramadan_payments py on py.sponsorship_id=i.sponsorship_id where i.schedule_entry_id=v.id),
   'assignments',(select count(*)from private.ramadan_slot_assignments where schedule_entry_id=v.id),'receipts',(select count(distinct r.id)from private.ramadan_receipts r join private.ramadan_sponsorship_items i on i.sponsorship_id=r.sponsorship_id where i.schedule_entry_id=v.id));
  result:=result||jsonb_build_array(entry);if block is not null then errors:=errors||jsonb_build_array(jsonb_build_object('schedule_id',v.id,'reason',block));end if;
 end loop;
 if exists(select 1 from jsonb_array_elements(result)x where not(x->>'resolution_required')::boolean group by x->>'offering_id',x->>'effective_date'having count(*)>1)then errors:=errors||jsonb_build_array(jsonb_build_object('reason','duplicate_offering_date'));end if;
 select jsonb_build_object('sponsorships',count(distinct r.id),'pending',count(distinct r.id)filter(where r.status='submitted'and py.id is null),'verified',count(distinct py.id),'receipts',count(distinct rec.id),'assignments',(select count(*)from private.ramadan_slot_assignments a where a.schedule_entry_id in(select(x->>'schedule_id')::uuid from jsonb_array_elements(result)x where(x->>'changed')::boolean)))into summary from private.ramadan_sponsorships r join private.ramadan_sponsorship_items i on i.sponsorship_id=r.id left join private.ramadan_payments py on py.sponsorship_id=r.id left join private.ramadan_receipts rec on rec.sponsorship_id=r.id where i.schedule_entry_id in(select(x->>'schedule_id')::uuid from jsonb_array_elements(result)x where(x->>'changed')::boolean);
 return jsonb_build_object('base_revision',expected,'source_hash',source,'preview_hash',private.ramadan_proof_hash(jsonb_build_object('source',source,'payload',p,'rows',result)::text),'payload',p,'rows',result,'conflicts',errors,'can_publish',jsonb_array_length(errors)=0,'summary',summary);
end $$;
create function private.ramadan_calendar_propose(target uuid,p jsonb,preview text,request_key text)returns jsonb language plpgsql set search_path=''as $$
declare v jsonb;c private.campaigns;prior private.ramadan_calendar_proposals;proposal uuid;row jsonb;ph text;begin
 c:=private.ramadan_calendar_lock(target,true);if preview is null or preview!~'^[0-9a-f]{64}$'or request_key is null or request_key!~'^[0-9a-f]{64}$'then raise exception 'Invalid proposal context'using errcode='22023';end if;
 ph:=private.ramadan_proof_hash(p::text);select *into prior from private.ramadan_calendar_proposals where campaign_id=target and key_hash=private.ramadan_proof_hash(request_key);
 if prior.id is not null then if prior.payload_hash<>ph or prior.prepared_by<>auth.uid()or prior.preview_hash<>preview then raise exception 'Proposal conflict'using errcode='PT409';end if;return jsonb_build_object('id',prior.id,'preview_hash',prior.preview_hash,'base_revision',prior.base_revision);end if;
 v:=private.ramadan_calendar_preview(target,p);if v->>'preview_hash'<>preview then raise exception 'Refresh impact preview'using errcode='PT409';end if;if not(v->>'can_publish')::boolean then raise exception 'Explicit owner review required for conflicts or past programs'using errcode='PT409';end if;
 insert into private.ramadan_calendar_proposals(campaign_id,base_revision,campaign_year,hijri_display_label,calendar_status,start_date,duration,announcement_reference,reason,change_mode,source_hash,preview_hash,payload_hash,key_hash,prepared_by)
 values(target,(v->>'base_revision')::integer,(c.configuration->>'campaign_year')::integer,c.configuration->>'hijri_display_label',p->>'status',(p->>'start_date')::date,(p->>'duration')::smallint,p->>'reference',p->>'reason',p->>'mode',v->>'source_hash',preview,ph,private.ramadan_proof_hash(request_key),auth.uid())returning id into proposal;
 for row in select value from jsonb_array_elements(v->'rows')loop insert into private.ramadan_calendar_entries(proposal_id,campaign_id,schedule_entry_id,ramadan_day_number,schedule_version,original_date,previous_date,effective_date,resolution_required)values(proposal,target,(row->>'schedule_id')::uuid,(row->>'ramadan_day_number')::smallint,(row->>'schedule_version')::integer,(row->>'original_date')::date,(row->>'previous_date')::date,(row->>'effective_date')::date,(row->>'resolution_required')::boolean);end loop;
 insert into private.ramadan_calendar_audit(campaign_id,proposal_id,actor_id,action,base_revision,affected_count)values(target,proposal,auth.uid(),'calendar.proposal.prepared',(v->>'base_revision')::integer,(select count(*)from jsonb_array_elements(v->'rows')x where(x->>'changed')::boolean));return jsonb_build_object('id',proposal,'preview_hash',preview,'base_revision',(v->>'base_revision')::integer);
end $$;
create function private.ramadan_calendar_publish(target uuid,proposal uuid,expected integer,preview text)returns jsonb language plpgsql set search_path=''as $$
declare p private.ramadan_calendar_proposals;prior private.ramadan_calendar_revisions;revision_id uuid;begin
 perform private.ramadan_calendar_lock(target,true);if private.active_role()<>'super_admin'then raise exception 'Super admin required'using errcode='42501';end if;
 select *into p from private.ramadan_calendar_proposals where id=proposal and campaign_id=target for update;
 if p.id is null or expected is null or p.base_revision<>expected or preview is distinct from p.preview_hash then raise exception 'Refresh proposal'using errcode='PT409';end if;
 select *into prior from private.ramadan_calendar_revisions where proposal_id=p.id;
 if prior.id is not null then return jsonb_build_object('revision',prior.revision,'approved_at',prior.approved_at);end if;
 if p.base_revision<>coalesce((private.ramadan_calendar_current(target)->>'revision')::integer,0)or p.source_hash<>private.ramadan_calendar_source(target)then raise exception 'Impact changed; prepare a fresh proposal'using errcode='PT409';end if;
 if(select count(*)from private.ramadan_calendar_entries where proposal_id=p.id)<>(select count(*)from private.ramadan_schedule_entries where campaign_id=target)
 or exists(select 1 from private.ramadan_calendar_entries e join private.ramadan_schedule_entries s on s.id=e.schedule_entry_id where e.proposal_id=p.id and(s.version<>e.schedule_version or s.service_date<>e.original_date or s.ramadan_day_number<>e.ramadan_day_number or(not e.resolution_required and e.effective_date<>p.start_date+e.ramadan_day_number-1)or(((not e.resolution_required and e.effective_date<>e.previous_date)or e.resolution_required<>private.ramadan_calendar_invalid(s.id))and(e.previous_date<=(statement_timestamp()at time zone'Asia/Kuala_Lumpur')::date or(e.effective_date is not null and e.effective_date<=(statement_timestamp()at time zone'Asia/Kuala_Lumpur')::date)))))then raise exception 'Calendar conflict or past program'using errcode='PT409';end if;
 if exists(select 1 from private.ramadan_calendar_entries where proposal_id=p.id and not resolution_required group by campaign_id,effective_date,(select offering_id from private.ramadan_schedule_entries where id=schedule_entry_id)having count(*)>1)then raise exception 'Duplicate effective schedule'using errcode='PT409';end if;
 insert into private.ramadan_calendar_revisions(campaign_id,proposal_id,revision,approved_by)values(target,p.id,expected+1,auth.uid())returning id into revision_id;
 insert into private.ramadan_calendar_audit(campaign_id,proposal_id,revision_id,actor_id,action,base_revision,resulting_revision,affected_count)values(target,p.id,revision_id,auth.uid(),'calendar.revision.published',expected,expected+1,(select count(*)from private.ramadan_calendar_entries where proposal_id=p.id and(effective_date is distinct from previous_date or resolution_required)));
 return jsonb_build_object('revision',expected+1,'approved_at',(select approved_at from private.ramadan_calendar_revisions where id=revision_id));
end $$;
create function private.ramadan_calendar_guard()returns trigger language plpgsql set search_path=''as $$
declare p private.ramadan_calendar_proposals;s private.ramadan_schedule_entries;i private.ramadan_sponsorship_items;latest uuid;begin
 if tg_op<>'INSERT'then raise exception 'Immutable calendar evidence'using errcode='42501';end if;
 if tg_table_name='ramadan_calendar_proposals'then
  perform private.require_campaign_access('manage');new.prepared_by:=auth.uid();new.prepared_at:=clock_timestamp();
 elsif tg_table_name='ramadan_calendar_entries'then
  select *into p from private.ramadan_calendar_proposals where id=new.proposal_id;select *into s from private.ramadan_schedule_entries where id=new.schedule_entry_id;
  if p.prepared_by is distinct from auth.uid()or exists(select 1 from private.ramadan_calendar_revisions where proposal_id=p.id)or new.schedule_version<>s.version or new.original_date<>s.service_date or new.ramadan_day_number<>s.ramadan_day_number or new.previous_date<>private.ramadan_calendar_effective(s.id)
  or new.resolution_required is distinct from(private.ramadan_calendar_invalid(s.id)or(p.duration is not null and s.ramadan_day_number>p.duration))or(not new.resolution_required and new.effective_date<>p.start_date+s.ramadan_day_number-1)then raise exception 'Invalid calendar entry'using errcode='23514';end if;
 elsif tg_table_name='ramadan_calendar_revisions'then
  perform private.require_campaign_access('manage');select *into p from private.ramadan_calendar_proposals where id=new.proposal_id;
  if private.active_role()<>'super_admin'or p.source_hash is distinct from private.ramadan_calendar_source(new.campaign_id)or new.revision<>p.base_revision+1 or new.revision<>coalesce((private.ramadan_calendar_current(new.campaign_id)->>'revision')::integer,0)+1 then raise exception 'Authorized current calendar required'using errcode='42501';end if;new.approved_by:=auth.uid();new.approved_at:=clock_timestamp();
 elsif tg_table_name='ramadan_calendar_audit'then
  perform private.require_campaign_access('manage');new.actor_id:=auth.uid();new.occurred_at:=clock_timestamp();
 elsif tg_table_name='ramadan_item_calendar_acceptances'then
  if pg_trigger_depth()<2 then raise exception 'Acceptance is created with a new item only'using errcode='42501';end if;
  select *into i from private.ramadan_sponsorship_items where id=new.item_id;select *into s from private.ramadan_schedule_entries where id=i.schedule_entry_id;select id into latest from private.ramadan_calendar_revisions where campaign_id=i.campaign_id order by revision desc limit 1;
  if i.mode<>'FIXED_SLOT'or i.id is null or private.ramadan_calendar_invalid(s.id)or new.accepted_date<>private.ramadan_calendar_effective(s.id)or new.ramadan_day_number<>s.ramadan_day_number or new.revision_id is distinct from latest then raise exception 'Accepted calendar required'using errcode='23514';end if;new.accepted_at:=clock_timestamp();
 end if;return new;
end $$;
create function private.ramadan_calendar_integrity()returns trigger language plpgsql security definer set search_path=''as $$
begin
 if tg_table_name='ramadan_calendar_proposals'and not exists(select 1 from private.ramadan_calendar_audit where proposal_id=new.id and action='calendar.proposal.prepared')then raise exception 'Proposal audit required'using errcode='23514';end if;
 if tg_table_name='ramadan_calendar_revisions'and not exists(select 1 from private.ramadan_calendar_audit where revision_id=new.id and action='calendar.revision.published')then raise exception 'Publication audit required'using errcode='23514';end if;return null;
end $$;
do $$declare t text;begin foreach t in array array['ramadan_calendar_proposals','ramadan_calendar_entries','ramadan_calendar_revisions','ramadan_calendar_audit','ramadan_item_calendar_acceptances']loop
 execute format('create trigger %I before insert or update or delete on private.%I for each row execute function private.ramadan_calendar_guard()',t||'_guard',t);execute format('alter table private.%I enable row level security',t);execute format('revoke all on private.%I from public,anon,authenticated,service_role,supabase_auth_admin,authenticator,campaign_scheduler,qurban_proof_storage_worker,ramadan_proof_storage_worker',t);
 end loop;
 foreach t in array array['ramadan_calendar_proposals','ramadan_calendar_revisions']loop execute format('create constraint trigger %I after insert on private.%I deferrable initially deferred for each row execute function private.ramadan_calendar_integrity()',t||'_integrity',t);end loop;
end $$;
create function private.ramadan_calendar_accept_item()returns trigger language plpgsql set search_path=''as $$
begin if new.mode='FIXED_SLOT'then insert into private.ramadan_item_calendar_acceptances(item_id,sponsorship_id,campaign_id,revision_id,accepted_date,ramadan_day_number)select new.id,new.sponsorship_id,new.campaign_id,(select id from private.ramadan_calendar_revisions where campaign_id=new.campaign_id order by revision desc limit 1),private.ramadan_calendar_effective(s.id),s.ramadan_day_number from private.ramadan_schedule_entries s where s.id=new.schedule_entry_id;end if;return new;end $$;
create trigger ramadan_item_calendar_accept after insert on private.ramadan_sponsorship_items for each row execute function private.ramadan_calendar_accept_item();
create function private.ramadan_calendar_schedule_guard()returns trigger language plpgsql set search_path=''as $$
declare c jsonb;begin
 c:=private.ramadan_calendar_current(new.campaign_id);
 if tg_op='UPDATE'and private.ramadan_calendar_invalid(old.id)and(new.ramadan_day_number,new.service_date)is distinct from(old.ramadan_day_number,old.service_date)then raise exception 'Calendar exception requires future resolution'using errcode='PT409';end if;
 if c is not null and(tg_op='INSERT'or(new.ramadan_day_number,new.service_date)is distinct from(old.ramadan_day_number,old.service_date))then
  if ((c->>'duration')::integer is not null and new.ramadan_day_number>(c->>'duration')::integer)or new.service_date<>(c->>'start_date')::date+new.ramadan_day_number-1 then raise exception 'Use the approved calendar or prepare an amendment'using errcode='PT409';end if;
 end if;return new;end $$;
create trigger ramadan_calendar_schedule_guard before insert or update on private.ramadan_schedule_entries for each row execute function private.ramadan_calendar_schedule_guard();
create function private.ramadan_calendar_assignment_guard()returns trigger language plpgsql set search_path=''as $$begin if private.ramadan_calendar_invalid(new.schedule_entry_id)then raise exception 'Calendar day requires administrative resolution'using errcode='PT409';end if;return new;end $$;
create trigger ramadan_calendar_assignment_guard before insert on private.ramadan_slot_assignments for each row execute function private.ramadan_calendar_assignment_guard();
create function private.ramadan_calendar_proposal_detail(target uuid,proposal uuid)returns jsonb language plpgsql set search_path=''as $$
declare p private.ramadan_calendar_proposals;begin perform private.ramadan_calendar_lock(target,true);select *into p from private.ramadan_calendar_proposals where id=proposal and campaign_id=target;if p.id is null then return null;end if;
 return to_jsonb(p)-'key_hash'-'payload_hash'||jsonb_build_object('stale',p.source_hash<>private.ramadan_calendar_source(target),'published',exists(select 1 from private.ramadan_calendar_revisions where proposal_id=p.id),'rows',coalesce((select jsonb_agg(to_jsonb(e)||jsonb_build_object('offering_name',o.name,'changed',e.effective_date is distinct from e.previous_date,'sponsorships',(select count(distinct i.sponsorship_id)from private.ramadan_sponsorship_items i where i.schedule_entry_id=e.schedule_entry_id),'pending',(select count(distinct i.sponsorship_id)from private.ramadan_sponsorship_items i join private.ramadan_sponsorships r on r.id=i.sponsorship_id where i.schedule_entry_id=e.schedule_entry_id and r.status='submitted'and not exists(select 1 from private.ramadan_payments py where py.sponsorship_id=r.id)),'verified',(select count(distinct i.sponsorship_id)from private.ramadan_sponsorship_items i join private.ramadan_payments py on py.sponsorship_id=i.sponsorship_id where i.schedule_entry_id=e.schedule_entry_id),'assignments',(select count(*)from private.ramadan_slot_assignments where schedule_entry_id=e.schedule_entry_id),'receipts',(select count(distinct r.id)from private.ramadan_receipts r join private.ramadan_sponsorship_items i on i.sponsorship_id=r.sponsorship_id where i.schedule_entry_id=e.schedule_entry_id))order by e.ramadan_day_number,e.schedule_entry_id)from private.ramadan_calendar_entries e join private.ramadan_schedule_entries s on s.id=e.schedule_entry_id join private.ramadan_offerings o on o.id=s.offering_id where e.proposal_id=p.id),'[]'::jsonb));end $$;
create function private.ramadan_calendar_workspace(target uuid)returns jsonb language plpgsql set search_path=''as $$
declare c private.campaigns;manager boolean;begin c:=private.ramadan_calendar_lock(target,false);manager:=private.active_role()in('admin','super_admin');if(select count(*)from private.ramadan_schedule_entries where campaign_id=target)>500 then raise exception 'Calendar bound exceeded'using errcode='22023';end if;
 return jsonb_build_object('current',private.ramadan_calendar_current(target),'campaign_year',c.configuration->'campaign_year','hijri_display_label',c.configuration->'hijri_display_label','can_prepare',manager,'can_publish',private.active_role()='super_admin',
 'schedules',coalesce((select jsonb_agg(jsonb_build_object('id',s.id,'offering_name',o.name,'day',s.ramadan_day_number,'original_date',s.service_date,'effective_date',private.ramadan_calendar_effective(s.id),'version',s.version,'resolution_required',private.ramadan_calendar_invalid(s.id))order by s.ramadan_day_number,s.id)from private.ramadan_schedule_entries s join private.ramadan_offerings o on o.id=s.offering_id where s.campaign_id=target),'[]'::jsonb),
 'proposals',case when manager then coalesce((select jsonb_agg(to_jsonb(x)order by prepared_at desc,id)from(select p.id,p.base_revision,p.calendar_status,p.start_date,p.duration,p.announcement_reference,p.prepared_at,p.prepared_by,p.preview_hash,p.source_hash<>private.ramadan_calendar_source(target)stale,exists(select 1 from private.ramadan_calendar_revisions r where r.proposal_id=p.id)published from private.ramadan_calendar_proposals p where campaign_id=target order by prepared_at desc,id limit 20)x),'[]'::jsonb)else'[]'::jsonb end,
 'history',coalesce((select jsonb_agg(to_jsonb(x)order by revision desc)from(select r.revision,r.approved_at,case when manager then r.approved_by else null end approved_by,p.calendar_status,p.start_date,p.duration,case when manager then p.announcement_reference else null end announcement_reference from private.ramadan_calendar_revisions r join private.ramadan_calendar_proposals p on p.id=r.proposal_id where r.campaign_id=target order by revision desc limit 20)x),'[]'::jsonb));end $$;
create function public.admin_ramadan_calendar(target_campaign uuid)returns jsonb language sql security definer set search_path=''as $$select private.ramadan_calendar_workspace(target_campaign);$$;
create function public.admin_ramadan_calendar_preview(target_campaign uuid,payload jsonb)returns jsonb language sql security definer set search_path=''as $$select private.ramadan_calendar_preview(target_campaign,payload);$$;
create function public.admin_ramadan_calendar_propose(target_campaign uuid,payload jsonb,expected_preview text,idempotency_key text)returns jsonb language sql security definer set search_path=''as $$select private.ramadan_calendar_propose(target_campaign,payload,expected_preview,idempotency_key);$$;
create function public.admin_ramadan_calendar_proposal(target_campaign uuid,target_proposal uuid)returns jsonb language sql security definer set search_path=''as $$select private.ramadan_calendar_proposal_detail(target_campaign,target_proposal);$$;
create function public.admin_ramadan_calendar_publish(target_campaign uuid,target_proposal uuid,expected_revision integer,expected_preview text)returns jsonb language sql security definer set search_path=''as $$select private.ramadan_calendar_publish(target_campaign,target_proposal,expected_revision,expected_preview);$$;

create function private.ramadan_calendar_campaign_guard()returns trigger language plpgsql set search_path=''as $$begin if old.type_key='ramadan'and new.configuration is distinct from old.configuration and exists(select 1 from private.ramadan_calendar_revisions where campaign_id=old.id)then raise exception 'Approved annual calendar configuration is locked; use a separately reviewed campaign workflow'using errcode='PT409';end if;return new;end $$;
create trigger ramadan_calendar_campaign_guard before update on private.campaigns for each row execute function private.ramadan_calendar_campaign_guard();

create index ramadan_calendar_invalid_schedule on private.ramadan_calendar_entries(schedule_entry_id,proposal_id)where resolution_required;
create index ramadan_calendar_activity_campaign on private.ramadan_sponsorship_items(campaign_id,schedule_entry_id,sponsorship_id);

-- CALENDAR PROJECTIONS: narrow additive replacements; original financial evidence stays unchanged.
create or replace function private.ramadan_submission_result(rid uuid)returns jsonb language sql set search_path='' as $$
 select jsonb_build_object('reference',r.public_reference,'currency',r.currency,'total_minor',r.quoted_total_minor,'items',(select jsonb_agg(jsonb_build_object('offering_name',i.accepted_offering_name,'mode',i.mode,'service_date',coalesce(ac.accepted_date,s.service_date),'ramadan_day_number',coalesce(ac.ramadan_day_number,s.ramadan_day_number),'quantity',i.quantity,'unit_price_minor',i.accepted_unit_price_minor,'line_total_minor',i.line_total_minor)order by i.created_at,i.id)from private.ramadan_sponsorship_items i left join private.ramadan_schedule_entries s on s.id=i.schedule_entry_id left join private.ramadan_item_calendar_acceptances ac on ac.item_id=i.id where i.sponsorship_id=r.id))from private.ramadan_sponsorships r where r.id=rid;
$$;
create or replace function private.ramadan_receipt_items(sponsor uuid)returns jsonb language sql stable set search_path=''as $$
 select coalesce(jsonb_agg(jsonb_build_object('item_id',i.id,'schedule_id',i.schedule_entry_id,'offering_name',i.accepted_offering_name,'mode',i.mode,'service_date',coalesce(ac.accepted_date,s.service_date),'ramadan_day_number',coalesce(ac.ramadan_day_number,s.ramadan_day_number),'quantity',i.quantity,'unit_price_minor',i.accepted_unit_price_minor,'contribution_minor',i.contribution_amount_minor,'line_total_minor',i.line_total_minor,'slots',coalesce((select jsonb_agg(t.slot_number order by t.slot_number)from private.ramadan_slot_assignments a join private.ramadan_slots t on t.id=a.slot_id where a.item_id=i.id),'[]'::jsonb))order by i.created_at,i.id),'[]'::jsonb)from private.ramadan_sponsorship_items i left join private.ramadan_schedule_entries s on s.id=i.schedule_entry_id left join private.ramadan_item_calendar_acceptances ac on ac.item_id=i.id where i.sponsorship_id=sponsor
$$;
create or replace function private.ramadan_admin_detail(target uuid,sponsor uuid)returns jsonb language plpgsql set search_path='' as $$
declare r private.ramadan_sponsorships;manager boolean;v jsonb;begin
 perform private.ramadan_admin_campaign(target,false);manager:=private.active_role()in('admin','super_admin');select *into r from private.ramadan_sponsorships where id=sponsor and campaign_id=target;if r.id is null then return null;end if;
 v:=jsonb_build_object('id',r.id,'reference',r.public_reference,'status',r.status,'created_at',r.created_at,'version',r.version,'campaign_year',r.campaign_year,'hijri_display_label',r.hijri_display_label,'items',(select jsonb_agg(jsonb_build_object('offering_name',i.accepted_offering_name,'mode',i.mode,'service_date',coalesce(ac.accepted_date,s.service_date),'ramadan_day_number',coalesce(ac.ramadan_day_number,s.ramadan_day_number),'quantity',i.quantity)||case when manager then jsonb_build_object('unit_price_minor',i.accepted_unit_price_minor,'line_total_minor',i.line_total_minor)else'{}'::jsonb end order by i.created_at,i.id)from private.ramadan_sponsorship_items i left join private.ramadan_schedule_entries s on s.id=i.schedule_entry_id left join private.ramadan_item_calendar_acceptances ac on ac.item_id=i.id where i.sponsorship_id=r.id));
 v:=v||jsonb_build_object('calendar',private.ramadan_calendar_current(target),'calendar_items',private.ramadan_calendar_dates(r.id));if manager then v:=v||jsonb_build_object('payer_name',r.payer_name,'phone',r.phone,'email',r.email,'public_display_mode',r.public_display_mode,'public_display_name',r.public_display_name,'quoted_total_minor',r.quoted_total_minor,'campaign_revision',r.campaign_revision,'currency',r.currency);end if;return v;
end $$;
create or replace function private.ramadan_public_context(slug text)returns jsonb language plpgsql set search_path='' as $$
declare c private.campaigns;g private.system_feature_flags;m private.system_feature_flags;v jsonb;pages jsonb;begin
 if slug is null or length(slug)>100 or slug!~'^[a-z0-9]+(-[a-z0-9]+)*$'then return null;end if;
 select *into c from private.campaigns where campaigns.slug=ramadan_public_context.slug;
 select *into g from private.system_feature_flags where flag_key='campaigns.enabled';select *into m from private.system_feature_flags where flag_key='ramadan.enabled';
 if c.id is null or c.type_key<>'ramadan'or c.config_version<>1 or c.visibility not in('public','unlisted')or not private.ramadan_config_v1_valid(c.configuration)
 or not coalesce(g.enabled,false)or not coalesce(m.enabled,false)or not private.campaign_registration_window_available(c.status,c.registration_opens_at,c.registration_closes_at,clock_timestamp())
 or not exists(select 1 from private.campaign_type_descriptors where type_key='ramadan'and config_version=1 and module_flag_key='ramadan.enabled'and validator_name='ramadan_config_v1_valid')then return null;end if;
 select snapshot.base,private.ramadan_initial_sponsor_pages(snapshot.base)into v,pages from(select jsonb_build_object('slug',c.slug,'title',c.title,'campaign_year',c.configuration->'campaign_year','hijri_display_label',c.configuration->'hijri_display_label','currency','MYR','campaign_version',c.version,'global_flag_version',g.version,'module_flag_version',m.version,'registration_closes_at',c.registration_closes_at,'calendar',private.ramadan_calendar_current(c.id),
 'offerings',coalesce((select jsonb_agg(jsonb_build_object('id',o.id,'name',o.name,'mode',o.mode,'version',o.version,'accepting_new',o.active)order by o.display_order,o.id)from private.ramadan_offerings o where o.campaign_id=c.id and(o.active or exists(select 1 from private.ramadan_sponsorship_items it join private.ramadan_payments p on p.sponsorship_id=it.sponsorship_id where it.offering_id=o.id))),'[]'::jsonb),
 'schedules',coalesce((select jsonb_agg(jsonb_build_object('id',s.id,'offering_id',s.offering_id,'version',s.version,'ramadan_day_number',s.ramadan_day_number,'service_date',private.ramadan_calendar_effective(s.id),'original_service_date',s.service_date,'calendar_resolution_required',private.ramadan_calendar_invalid(s.id),'unit_price_minor',s.unit_price_minor,'slot_count',s.slot_count,'confirmed_occupied',(select count(*)from private.ramadan_slot_assignments a join private.ramadan_payments p on p.id=a.payment_id where a.schedule_entry_id=s.id),'available',s.slot_count-(select count(*)from private.ramadan_slot_assignments a join private.ramadan_payments p on p.id=a.payment_id where a.schedule_entry_id=s.id),'accepting_new',s.active and o.active and not private.ramadan_calendar_invalid(s.id))order by private.ramadan_calendar_effective(s.id),o.display_order,s.id)from private.ramadan_schedule_entries s join private.ramadan_offerings o on o.id=s.offering_id where s.campaign_id=c.id and((s.active and o.active)or exists(select 1 from private.ramadan_slot_assignments a where a.schedule_entry_id=s.id))),'[]'::jsonb))base)snapshot;
 if jsonb_array_length(v->'offerings')>100 or jsonb_array_length(v->'schedules')>500 or octet_length(v::text)>262144 then return null;end if;

 -- At most 500 schedule pages + 100 open-offering pages, each capped at 20 rows.
 if octet_length(pages::text)>12582912 then return null;end if;
 return v||jsonb_build_object('context_token',encode(sha256(convert_to(v::text,'UTF8')),'hex'),'sponsor_pages',pages);
end $$;
create or replace function private.ramadan_admin_workspace(target uuid)returns jsonb language plpgsql set search_path='' as $$
declare c private.campaigns;begin c:=private.ramadan_admin_campaign(target,false);if(select count(*)from private.ramadan_offerings where campaign_id=target)>100 or(select count(*)from private.ramadan_schedule_entries where campaign_id=target)>500 then raise exception 'Workspace bound exceeded'using errcode='22023';end if;
 return jsonb_build_object('id',c.id,'title',c.title,'calendar',private.ramadan_calendar_current(target),'can_manage',private.active_role()in('admin','super_admin'),'offerings',coalesce((select jsonb_agg(to_jsonb(o)||jsonb_build_object('has_activity',exists(select 1 from private.ramadan_sponsorship_items i where i.offering_id=o.id),'has_references',exists(select 1 from private.ramadan_schedule_entries s where s.offering_id=o.id)or exists(select 1 from private.ramadan_sponsorship_items i where i.offering_id=o.id))order by o.display_order,o.id)from private.ramadan_offerings o where campaign_id=target),'[]'::jsonb),'schedules',coalesce((select jsonb_agg(to_jsonb(s)||jsonb_build_object('effective_service_date',private.ramadan_calendar_effective(s.id),'calendar_resolution_required',private.ramadan_calendar_invalid(s.id),'has_activity',exists(select 1 from private.ramadan_sponsorship_items i where i.schedule_entry_id=s.id),'confirmed_occupied',(select count(*)from private.ramadan_slot_assignments a join private.ramadan_payments p on p.id=a.payment_id where a.schedule_entry_id=s.id),'available',s.slot_count-(select count(*)from private.ramadan_slot_assignments a join private.ramadan_payments p on p.id=a.payment_id where a.schedule_entry_id=s.id))order by s.service_date,s.id)from private.ramadan_schedule_entries s where campaign_id=target),'[]'::jsonb));
end $$;
create or replace function private.ramadan_payment_context(slug text,secret text)returns jsonb language plpgsql set search_path=''as $$
declare rid uuid;p private.ramadan_payment_proofs;rec private.ramadan_receipts;begin
 rid:=private.ramadan_payment_session_sponsorship(slug,secret);if rid is null then return null;end if;
 select *into p from private.ramadan_payment_proofs where sponsorship_id=rid order by submitted_at desc,id desc limit 1;select *into rec from private.ramadan_receipts where sponsorship_id=rid;
 return private.ramadan_submission_result(rid)||jsonb_build_object('calendar',private.ramadan_calendar_current((select campaign_id from private.ramadan_sponsorships where id=rid)),'calendar_items',private.ramadan_calendar_dates(rid),'proof_status',coalesce(p.status,'none'),'rejection_reason',p.rejection_reason,'action_required',coalesce(p.status='submitted'and exists(select 1 from private.ramadan_capacity_exceptions where proof_id=p.id),false),
 'receipt',case when rec.id is null then null else jsonb_build_object('receipt_number',rec.receipt_number,'amount_minor',rec.verified_amount_minor,'payment_date',rec.payment_date,'issued_at',rec.issued_at,'items',(select jsonb_agg(x-'item_id')from jsonb_array_elements(rec.items)x))end);
end $$;
create or replace function private.ramadan_payment_review(target uuid,sponsor uuid,page_number integer)returns jsonb language plpgsql set search_path=''as $$
declare p private.ramadan_payment_proofs;i private.ramadan_proof_intents;r private.ramadan_sponsorships;rec private.ramadan_receipts;history jsonb;capacity jsonb;begin
 perform private.ramadan_admin_campaign(target,false);select *into r from private.ramadan_sponsorships where id=sponsor and campaign_id=target;if r.id is null then return null;end if;
 select *into p from private.ramadan_payment_proofs where sponsorship_id=r.id order by submitted_at desc,id desc limit 1;
 if private.active_role()='staff'then return jsonb_build_object('proof_status',coalesce(p.status,'none'));end if;
 if page_number is null or page_number not between 1 and 10000 then raise exception 'Invalid page'using errcode='22023';end if;
 select *into i from private.ramadan_proof_intents where id=p.id;select *into rec from private.ramadan_receipts where sponsorship_id=r.id;
 select coalesce(jsonb_agg(jsonb_build_object('id',h.id,'reference',pi.proof_reference,'status',h.status,'version',h.version,'declared_amount_minor',pi.declared_amount_minor,'payment_date',pi.payment_date,'source',pi.source,'submitted_at',h.submitted_at,'rejection_reason',h.rejection_reason,'reviewed_at',h.reviewed_at)order by h.submitted_at desc,h.id desc),'[]'::jsonb)into history from(select *from private.ramadan_payment_proofs where sponsorship_id=r.id order by submitted_at desc,id desc limit 20 offset(page_number-1)*20)h join private.ramadan_proof_intents pi on pi.id=h.id;
 select coalesce(jsonb_agg(v order by v->>'service_date',v->>'schedule_id'),'[]'::jsonb)into capacity from(select jsonb_build_object('schedule_id',s.id,'offering_name',min(it.accepted_offering_name),'service_date',private.ramadan_calendar_effective(s.id),'calendar_resolution_required',private.ramadan_calendar_invalid(s.id),'ramadan_day_number',s.ramadan_day_number,'requested',sum(it.quantity),'available',(select count(*)from private.ramadan_slots sl where sl.schedule_entry_id=s.id and not exists(select 1 from private.ramadan_slot_assignments a where a.slot_id=sl.id)))v from private.ramadan_sponsorship_items it join private.ramadan_schedule_entries s on s.id=it.schedule_entry_id where it.sponsorship_id=r.id group by s.id)schedules;
 return jsonb_build_object('calendar',private.ramadan_calendar_current(target),'calendar_items',private.ramadan_calendar_dates(r.id),'proof_status',coalesce(p.status,'none'),'sponsorship_version',r.version,'sponsorship_status',r.status,'history',history,'history_page',page_number,'history_total',(select count(*)from private.ramadan_payment_proofs where sponsorship_id=r.id),'capacity',capacity,'action_required',coalesce(p.status='submitted'and exists(select 1 from private.ramadan_capacity_exceptions where proof_id=p.id),false),
 'proof',case when p.id is null then null else jsonb_build_object('id',i.id,'reference',i.proof_reference,'declared_amount_minor',i.declared_amount_minor,'payment_date',i.payment_date,'source',i.source,'submitted_at',p.submitted_at,'submitted_by_actor',i.actor_id,'content_type',i.content_type,'byte_size',i.byte_size,'amount_mismatch',i.declared_amount_minor<>r.quoted_total_minor,'version',p.version,'rejection_reason',p.rejection_reason,'reviewed_at',p.reviewed_at)end,
 'receipt',case when rec.id is null then null else jsonb_build_object('receipt_number',rec.receipt_number,'amount_minor',rec.verified_amount_minor,'issued_at',rec.issued_at)end);
end $$;
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
   if s.id is null or not s.active or private.ramadan_calendar_invalid(s.id) or s.version<>(e->>'schedule_version')::integer then raise exception 'Review again'using errcode='PT409';end if;
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
create or replace function private.ramadan_payment_verify(target uuid,proof uuid,pv integer,rv integer,bank_confirmed boolean)returns jsonb language plpgsql set search_path=''as $$
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
 if private.ramadan_calendar_sponsor_invalid(r.id)then return jsonb_build_object('status','calendar_action_required');end if;
 if exists(select 1 from private.ramadan_sponsorship_items it where it.sponsorship_id=r.id and it.mode='FIXED_SLOT'group by it.schedule_entry_id having sum(it.quantity)>(select count(*)from private.ramadan_slots s where s.schedule_entry_id=it.schedule_entry_id and not exists(select 1 from private.ramadan_slot_assignments a where a.slot_id=s.id)))then
  select *into x from private.ramadan_capacity_exceptions where proof_id=p.id;
  if not found then insert into private.ramadan_capacity_exceptions(campaign_id,sponsorship_id,proof_id,actor_id)values(target,r.id,p.id,actor)returning *into x;
   insert into private.ramadan_payment_audit(campaign_id,sponsorship_id,proof_id,actor_id,action,file_count,reason,expected_version,resulting_version)values(target,r.id,p.id,actor,'payment.capacity_insufficient',1,'capacity_insufficient',1,1);
  end if;return jsonb_build_object('status','capacity_insufficient');
 end if;
 if private.ramadan_calendar_sponsor_invalid(r.id)then return jsonb_build_object('status','calendar_action_required');end if;
 perform private.ramadan_assign_verified_set(r.id,pid,actor);stamp:=clock_timestamp();
 insert into private.ramadan_payments(id,campaign_id,sponsorship_id,verified_proof_id,quoted_total_minor,verified_amount_minor,payment_date,verified_at,verified_by,receipt_id)values(pid,target,r.id,p.id,r.quoted_total_minor,r.quoted_total_minor,i.payment_date,stamp,actor,receipt);
 insert into private.ramadan_receipt_counters(campaign_id,last_serial)values(target,1)on conflict(campaign_id)do update set last_serial=private.ramadan_receipt_counters.last_serial+1 returning last_serial into serial;
 insert into private.ramadan_receipts(id,campaign_id,sponsorship_id,payment_id,serial,receipt_number,campaign_year,campaign_title,hijri_display_label,public_reference,payer_name,currency,verified_amount_minor,payment_method,payment_date,issued_at,issued_by,items,content_hash)
 values(receipt,target,r.id,pid,serial,'RAM-'||r.campaign_year::text||'-'||lpad(serial::text,6,'0'),r.campaign_year,(select title from private.campaigns where id=target),r.hijri_display_label,r.public_reference,r.payer_name,r.currency,r.quoted_total_minor,'bank_transfer',i.payment_date,stamp,actor,private.ramadan_receipt_items(r.id),private.ramadan_proof_hash(private.ramadan_receipt_items(r.id)::text))returning *into rec;
 update private.ramadan_payment_proofs set status='verified',version=2,reviewed_at=stamp,reviewed_by=actor where id=p.id;
 insert into private.ramadan_payment_audit(campaign_id,sponsorship_id,proof_id,actor_id,action,file_count,payment_id,receipt_id,expected_version,resulting_version)select target,r.id,p.id,actor,a,1,pid,receipt,1,2 from unnest(array['payment.verified','receipt.issued'])a;
 return jsonb_build_object('status','verified','receipt_number',rec.receipt_number);
end $$;

-- No helper is a direct runtime entry point; wrappers authorize each request.
do $$declare p record;begin for p in select oid::regprocedure signature from pg_proc where pronamespace='private'::regnamespace and proname like'ramadan_calendar_%'loop execute format('revoke all on function %s from public,anon,authenticated,service_role,supabase_auth_admin,authenticator,campaign_scheduler,qurban_proof_storage_worker,ramadan_proof_storage_worker',p.signature);end loop;end $$;
revoke all on function public.admin_ramadan_calendar(uuid),public.admin_ramadan_calendar_preview(uuid,jsonb),public.admin_ramadan_calendar_propose(uuid,jsonb,text,text),public.admin_ramadan_calendar_proposal(uuid,uuid),public.admin_ramadan_calendar_publish(uuid,uuid,integer,text)from public,anon,authenticated,service_role,supabase_auth_admin,authenticator,campaign_scheduler,qurban_proof_storage_worker,ramadan_proof_storage_worker;
grant execute on function public.admin_ramadan_calendar(uuid),public.admin_ramadan_calendar_preview(uuid,jsonb),public.admin_ramadan_calendar_propose(uuid,jsonb,text,text),public.admin_ramadan_calendar_proposal(uuid,uuid),public.admin_ramadan_calendar_publish(uuid,uuid,integer,text)to authenticated;
notify pgrst,'reload schema';
commit;
