// Disposable local evidence only. Never import this module into application code.
import {readFileSync} from 'node:fs';import {pathToFileURL} from 'node:url';
import {reviewStack,manifestPath,exclusive} from '../qurban-registration/review-fixture.mjs';
import {cleanupSql} from '../qurban-registration/fixture-session.mjs';
import {sql,rows,quote,signedToken} from '../admin-foundation/local-stack.mjs';
import {request,slug} from '../qurban-registration/fixtures.mjs';
export function ownedFixtureSql(plan,evidence,statement,claims){
 // Reuse the exact locked ownership/fingerprint/Auth-dependency/guard preflight.
 // Stop BEFORE the first guard-disable/delete; this command never weakens a guard.
 const cleanup=cleanupSql(plan,evidence),boundary=cleanup.search(/alter table private\.[a-z_]+ disable trigger/);
 if(boundary<0)throw Error('Fixture ownership preflight unavailable');
 const prefix=cleanup.slice(0,boundary).replace('return;',"raise exception 'Owned fixture campaign required';");
 if(prefix.includes("disable trigger")||prefix.includes("delete from"))throw Error("Unsafe fixture preflight boundary");
 return prefix+"perform set_config('request.jwt.claims',"+quote(JSON.stringify(claims))+",true);\n"+statement+"\nend $cleanup$;commit;";
}
export function runOwned(statement){
 const stack=reviewStack();return exclusive(()=>{
 const raw=readFileSync(manifestPath,'utf8');if(Buffer.byteLength(raw)>32768)throw Error('Invalid manifest');
 const m=JSON.parse(raw);if(Object.keys(m).sort().join()!=='evidence,plan')throw Error('Invalid ownership manifest');
 const u={...m.plan.users.owner,email:'local-owner@example.test'},now=Math.floor(Date.now()/1000);
 const claims=JSON.parse(Buffer.from(signedToken(stack,u,{aal:'aal2',amr:[{method:'oauth',timestamp:now},{method:'totp',timestamp:now}]}).split('.')[1],'base64url'));
 sql(ownedFixtureSql(m.plan,m.evidence,statement(m.plan),claims));
 return m.plan.campaign;
 });
}
export function seedRegistrations(){
 reviewStack();const c=rows('select public.public_qurban_registration_context('+quote(slug)+') context')[0]?.context;
 if(!c)throw Error('Owned open fixture context required');
 const payloads=[3,4,6].map((n,i)=>({...request(c,n),same_cattle_preference:i>0,applicant:{name:'LOCAL REVIEW ONLY — Pemohon '+(i+1),phone:'0123456789',address:'Alamat rekaan tempatan',email:null}}));
 return runOwned(p=>"if exists(select 1 from private.qurban_registrations where campaign_id="+quote(p.campaign)+") then raise exception 'Synthetic seed requires no existing registrations';end if;\n"+payloads.map(v=>'perform public.public_qurban_registration_submit('+quote(JSON.stringify(v))+'::jsonb);').join('\n'));
}
export function allocateSynthetic(){
 return runOwned(p=>"if not exists(select 1 from private.qurban_cattle where campaign_id="+quote(p.campaign)+") then raise exception 'Initialize grid through protected admin first';end if;\n"+
 "for c in select r.id,array_agg(p.id order by p.created_at,p.id) ids from private.qurban_registrations r join private.qurban_participations p on p.registration_id=r.id left join private.qurban_allocations a on a.participation_id=p.id where r.campaign_id="+quote(p.campaign)+" and r.status='submitted' and a.id is null group by r.id,r.created_at order by r.created_at,r.id loop perform private.qurban_allocate_registration("+quote(p.campaign)+",c.id,c.ids);end loop;");
}
export function allocationEvidence(){reviewStack();return rows("select a.id,a.registration_id,a.participation_id,a.version,k.display_number cattle_number,s.slot_number from private.qurban_allocations a join private.qurban_cattle_slots s on s.id=a.slot_id join private.qurban_cattle k on k.id=s.cattle_id order by a.registration_id,k.display_number,s.slot_number");}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{const command=process.argv[2];if(command==='registrations')seedRegistrations();else if(command==='allocate')allocateSynthetic();else if(command!=='inspect')throw Error('Use registrations | allocate | inspect');
 console.log(JSON.stringify({warning:'LOCAL REVIEW ONLY — synthetic eligibility, not payment verification',allocations:allocationEvidence()}));}
 catch(e){console.error(e.message);process.exitCode=1;}
}
