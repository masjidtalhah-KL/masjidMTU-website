"use client";
import Link from "next/link";
import {useEffect,useRef,useState,type FormEvent} from "react";
import {attendanceLabels,cancellationReasons,activityLabels,type ListView,type Detail,type Participant,type Activity,type Attendance,type Purpose} from "@/lib/qurban/admin-contract";
import {registrationStatusLabels,compactQurbanReference} from "@/lib/qurban/admin-presentation";
import {QurbanPayments} from "./qurban-payments";
import {QurbanVolunteers} from "./qurban-volunteers";
import {QurbanCapacity} from "./qurban-capacity";
import "./qurban-admin.css";
const time=(v:string)=>new Date(v).toLocaleString("ms-MY",{timeZone:"Asia/Kuala_Lumpur"});
const money=(v:number)=>new Intl.NumberFormat("ms-MY",{style:"currency",currency:"MYR"}).format(v/100);
type Change=(body:unknown,cancel?:boolean)=>Promise<void>;
export function QurbanAdminPanel({initial}:{initial:ListView}){
 const [view,setView]=useState(initial),[tab,setTab]=useState("registrations"),[selected,setSelected]=useState<Detail|null>(null);
 const [query,setQuery]=useState({page:1,page_size:20,search:"",status:"all",purpose:"all",sort:"newest"});
 const [activity,setActivity]=useState<Activity|null>(null),[busy,setBusy]=useState(false),[blocked,setBlocked]=useState(false),[message,setMessage]=useState("");
 const lock=useRef(false),feedback=useRef<HTMLParagraphElement>(null),heading=useRef<HTMLHeadingElement>(null);
 const base="/admin/api/campaigns/"+view.campaign.id+"/qurban";
 const disabled=busy||blocked||!view.recent_mfa;
 useEffect(()=>{if(selected?.id)heading.current?.focus();},[selected?.id]);
 async function result(response:Response){
  const data=await response.json();if(!response.ok){if(response.status===409){setBlocked(true);throw Error("Rekod telah berubah. Muat semula dan semak sebelum menghantar semula.");}
   if(response.status===403&&["step-up","mfa"].includes(data.error)){setView(v=>({...v,recent_mfa:false}));setBlocked(true);throw Error("Sahkan authenticator semula sebelum membuat perubahan.");}
   if(response.status===401||response.status===403){window.location.replace("/admin/login?state=denied");throw Error("Akses ditolak.");}
   if(response.status===422)throw Error("Maklumat tidak sah. Semak nama, telefon, alamat, email dan pilihan borang.");
   setBlocked(true);throw Error("Operasi tidak tersedia. Muat semula data sebelum cuba lagi.");}return data;
 }
 async function run(fn:()=>Promise<void>){if(lock.current)return;lock.current=true;setBusy(true);setMessage("");try{await fn();}catch(e){if(e instanceof TypeError)setBlocked(true);setMessage(e instanceof TypeError?"Hasil belum dapat disahkan. Muat semula rekod sebelum cuba lagi.":e instanceof Error?e.message:"Operasi tidak tersedia.");feedback.current?.focus();}finally{lock.current=false;setBusy(false);}}
 async function list(q=query){const data=await result(await fetch(base,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(q),cache:"no-store"}));setView(data);}
 async function open(id:string){await run(async()=>{const d=await result(await fetch(base+"/registrations/"+id,{cache:"no-store"}));if(!d)throw Error("Rekod tidak tersedia.");setSelected(d);setBlocked(false);});}
 async function refresh(){await run(async()=>{if(selected){const d=await result(await fetch(base+"/registrations/"+selected.id,{cache:"no-store"}));setSelected(d);}await list();setBlocked(false);setMessage("Rekod terkini dimuatkan. Semak borang sebelum membuat perubahan.");});}
 async function mutate(body:unknown,cancel=false){if(!selected||!view.can_manage||disabled)return;await run(async()=>{
  const response=await fetch(base+"/registrations/"+selected.id+(cancel?"/cancel":""),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
  if(cancel&&response.status===409){setBlocked(true);throw Error("Rekod berubah, mempunyai allocation atau bukti bayaran telah dihantar. Selesaikan semakan operasi/bayaran terlebih dahulu; tiada slot atau bukti dipadam. Muat semula dan semak.");}
  await result(response);
  const d=await result(await fetch(base+"/registrations/"+selected.id,{cache:"no-store"}));setSelected(d);await list();setMessage(cancel?"Pendaftaran dibatalkan. Sejarah peserta dan akad dikekalkan.":"Perubahan disimpan. Akad dan quote asal kekal.");
 });}
 async function showActivity(page=1){await run(async()=>{const data=await result(await fetch(base+"/activity?page="+page,{cache:"no-store"}));setActivity(data);setTab("activity");setSelected(null);});}
 async function download(){if(disabled||!view.can_manage)return;await run(async()=>{
  const r=await fetch(base+"/export",{method:"POST",headers:{"Content-Type":"application/json"},body:"{}"});if(!r.ok){await result(r);return;}
  const blob=await r.blob(),url=URL.createObjectURL(blob),a=document.createElement("a");const match=/filename="([A-Za-z0-9.-]+)"/.exec(r.headers.get("content-disposition")??"");
  if(!match){URL.revokeObjectURL(url);throw Error("Fail eksport tidak tersedia.");}a.href=url;a.download=match[1];a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);setMessage("Excel berjaya dijana. Fail ialah snapshot; suntingan fail tidak mengubah database.");
 });}
 async function copyReference(reference:string){try{await navigator.clipboard.writeText(reference);setMessage("No. rujukan penuh disalin.");}catch{setMessage("Rujukan tidak dapat disalin. Buka butiran untuk menyalin rujukan penuh.");}}
 function section(next:string){setTab(next);setSelected(null);setMessage("");}
 function search(e:FormEvent){e.preventDefault();const q={...query,page:1};setQuery(q);void run(()=>list(q));}
 function page(n:number){const q={...query,page:n};setQuery(q);setSelected(null);void run(()=>list(q));}
 const c=view.campaign;
 return <div className="admin-stack qa" aria-busy={busy}>
 <Link href={"/admin/campaigns/"+c.id} prefetch={false}>← Butiran kempen</Link>
 <p className="admin-eyebrow">Pengurusan Qurban / Aqiqah</p><h1>{c.title}</h1>
 <p>{c.campaign_year} · {c.hijri_display_label} · {view.can_manage?"Pengurus operasi":"Staff — baca sahaja"}</p>
 <nav className="qa-nav" aria-label="Bahagian Qurban">
 <button aria-current={tab==="summary"?"page":undefined} onClick={()=>section("summary")}>Ringkasan</button>
 <button aria-current={tab==="payments"?"page":undefined} onClick={()=>section("payments")}>Bayaran</button>
 <button aria-current={tab==="volunteers"?"page":undefined} onClick={()=>section("volunteers")}>Sukarelawan</button>
 <button aria-current={tab==="capacity"?"page":undefined} onClick={()=>section("capacity")}>Kapasiti / Lembu</button>
 <button aria-current={tab==="registrations"?"page":undefined} onClick={()=>section("registrations")}>Pendaftaran / Peserta</button>
 {view.can_manage&&<><button aria-current={tab==="export"?"page":undefined} onClick={()=>section("export")}>Export</button><button aria-current={tab==="activity"?"page":undefined} disabled={busy} onClick={()=>void showActivity()}>Aktiviti</button></>}
 </nav>
 <p ref={feedback} tabIndex={-1} role="status" aria-live="polite" className="qa-feedback">{message}</p>
 {blocked&&<button onClick={()=>void refresh()} disabled={busy}>Muat semula rekod</button>}
 {view.can_manage&&!view.recent_mfa&&<p><Link href={"/admin/mfa?next=/admin/campaigns/"+c.id} prefetch={false}>Sahkan authenticator</Link> sebelum perubahan atau eksport.</p>}
 {tab==="payments"&&<QurbanPayments campaign={c.id}/>}
 {tab==="capacity"&&<QurbanCapacity campaign={c.id}/>}
 {tab==="summary"&&<section className="admin-card"><h2>Ringkasan operasi</h2><dl className="qa-summary">
 {[["Pendaftaran",view.summary.registrations],["Dihantar",view.summary.submitted],["Dibatalkan",view.summary.cancelled],["Peserta — semua rekod",view.summary.participants],["Qurban — semua rekod",view.summary.qurban],["Aqiqah — semua rekod",view.summary.aqiqah]].map(([label,n])=><div key={label}><dt>{label}</dt><dd>{n}</dd></div>)}
 </dl><p>Harga konfigurasi: {money(c.price_per_share_minor)} / bahagian.</p><p>Kapasiti teori konfigurasi: {c.cattle_count} × {c.shares_per_cattle} = {c.cattle_count*c.shares_per_cattle} bahagian.</p><p>Pendaftaran tidak menempah kapasiti. Grid dan susunan bahagian diurus berasingan; tiada pengesahan bayaran dalam fasa ini.</p>
 <p className="admin-muted">Bukti bayaran — Fasa 9.0. Pengesahan / Resit belum tersedia.</p></section>}
 {tab==="registrations"&&<>
 <section className="admin-card"><h2>Pendaftaran</h2><form onSubmit={search} className="qa-filters">
 <label>Carian rujukan tepat / awalan nama atau telefon<input value={query.search} maxLength={100} onChange={e=>setQuery({...query,search:e.target.value})}/></label>
 <label>Status<select value={query.status} onChange={e=>setQuery({...query,status:e.target.value})}><option value="all">Semua</option><option value="submitted">{registrationStatusLabels.submitted}</option><option value="cancelled">{registrationStatusLabels.cancelled}</option></select></label>
 <label>Tujuan<select value={query.purpose} onChange={e=>setQuery({...query,purpose:e.target.value})}><option value="all">Semua</option><option value="qurban">Qurban</option><option value="aqiqah">Aqiqah</option></select></label>
 <label>Susunan<select value={query.sort} onChange={e=>setQuery({...query,sort:e.target.value})}><option value="newest">Terbaharu</option><option value="oldest">Terlama</option><option value="reference">Rujukan</option><option value="applicant">Nama pemohon</option></select></label>
 <button disabled={busy}>Cari / tapis</button></form>
 <p>{view.total} pendaftaran sepadan · halaman {view.page}</p>
 <table className="qa-table"><thead><tr>{["No. Rujukan","Pemohon","Telefon","Peserta","Qurban / Aqiqah","Kehadiran","Status","Tarikh daftar","Butiran"].map(s=><th key={s} scope="col">{s}</th>)}</tr></thead><tbody>
 {view.items.map(r=><tr key={r.id}><td data-label="No. Rujukan" className="qa-reference"><span aria-hidden="true">{compactQurbanReference(r.public_reference)}</span><span className="qa-sr">{r.public_reference}</span><button type="button" className="qa-copy" aria-label={"Salin rujukan "+r.public_reference} onClick={()=>void copyReference(r.public_reference)}>Salin</button></td><td data-label="Pemohon">{r.applicant_name}</td><td data-label="Telefon">{r.phone}</td><td data-label="Peserta">{r.participant_count}</td><td data-label="Qurban / Aqiqah">{r.qurban} / {r.aqiqah}</td><td data-label="Kehadiran">{attendanceLabels[r.attendance]}</td><td data-label="Status">{registrationStatusLabels[r.status]}</td><td data-label="Tarikh daftar">{time(r.created_at)}</td><td data-label="Butiran"><button className="qa-open" aria-label={"Buka "+r.public_reference} disabled={busy} onClick={()=>void open(r.id)}>Butiran</button></td></tr>)}
 </tbody></table>{!view.items.length&&<p>Tiada pendaftaran sepadan.</p>}
 <div className="admin-row-actions"><button disabled={busy||view.page<=1} onClick={()=>page(view.page-1)}>Sebelumnya</button><button disabled={busy||view.page*view.page_size>=view.total} onClick={()=>page(view.page+1)}>Seterusnya</button></div>
 </section>
 {selected&&<section className="admin-card qa-detail"><h2 tabIndex={-1} ref={heading}>Butiran pendaftaran</h2><p className="qa-reference">{selected.public_reference}</p>
 <p>Status: <strong>{registrationStatusLabels[selected.status]}</strong> · Versi pendaftaran {selected.version}</p>
 <dl><dt>Pemohon</dt><dd>{selected.applicant_name}</dd><dt>Telefon</dt><dd>{selected.phone}</dd><dt>Kehadiran pemohon/wakil</dt><dd>{attendanceLabels[selected.attendance]}</dd><dt>Permintaan lembu sama</dt><dd>{selected.same_cattle_preference?"Ya — tertakluk keputusan urus setia":"Tidak"}</dd><dt>Tarikh daftar</dt><dd>{time(selected.created_at)}</dd><dt>Quote asal</dt><dd>{selected.quote.participant_count} × {money(selected.quote.price_per_share_minor)} = {money(selected.quote.total_minor)}</dd></dl>
 {selected.can_manage&&<><dl><dt>Alamat</dt><dd className="qa-pre">{selected.address}</dd><dt>Email</dt><dd>{selected.email??"—"}</dd></dl>
 <ContactForm key={selected.id+":"+selected.version} data={selected} disabled={disabled||selected.status!=="submitted"} submit={mutate}/></>}
 <h3 id="qa-participants">Peserta</h3><p>Hanya pembetulan peserta sedia ada. Tambah/buang peserta dan requote belum disediakan.</p>
 {selected.participants.map((p,i)=><section className="qa-participant" key={p.id+":"+p.version}><h4>Peserta {i+1} · Versi {p.version}</h4>
 {selected.can_manage?<ParticipantForm p={p} data={selected} disabled={disabled||selected.status!=="submitted"} submit={mutate}/>:<p>{p.participant_name} — {p.purpose==="qurban"?"Qurban":"Aqiqah"}</p>}</section>)}
 {selected.can_manage&&selected.consent&&<section><h3>Akad asal</h3><p>Rujukan: {selected.consent.akad_reference} · Diterima: {time(selected.consent.accepted_at)}</p><p className="qa-reference">SHA-256: {selected.consent.content_hash}</p>
 <p>{selected.consent.current_participants_differ?"Peserta semasa berbeza daripada snapshot akad asal. Pindaan direkod dalam aktiviti; reacceptance tidak diperlukan.":"Peserta semasa sepadan dengan snapshot akad asal."}</p><p>Consent dan quote asal tidak ditulis semula.</p></section>}
 {selected.can_manage&&selected.status==="submitted"&&<CancelForm data={selected} disabled={disabled} submit={mutate}/>}
 <button disabled={busy} onClick={()=>void refresh()}>Muat semula rekod</button>
 </section>}
 </>}
 {tab==="volunteers"&&<QurbanVolunteers campaign={view.campaign.id} canManage={view.can_manage} recentMfa={view.recent_mfa}/>}
 {tab==="export"&&view.can_manage&&<section className="admin-card"><h2>Export Excel audit</h2><p>Enam helaian: Ringkasan, Pendaftaran, Peserta, Sukarelawan, Susunan Lembu dan Format Audit - Legacy View. Mengandungi data peribadi operasi; untuk kegunaan urus setia yang dibenarkan.</p><p>Snapshot titik masa sahaja. Mengedit workbook tidak mengubah database. Lembu dan bahagian diisi hanya bagi allocation sedia ada; tarikh bayaran kekal kosong.</p><button className="admin-button" disabled={disabled} onClick={()=>void download()}>Muat turun Excel (.xlsx)</button></section>}
 {tab==="activity"&&view.can_manage&&<section className="admin-card"><h2>Aktiviti Qurban</h2>{activity?.items.length?<ol className="admin-audit">{activity.items.map(a=><li key={a.id}><strong>{activityLabels[a.action]??a.action}</strong><time dateTime={a.occurred_at}>{time(a.occurred_at)}</time><span className="qa-reference">Petugas: {a.actor_id}</span>
 {a.expected_version!==null&&<span>{a.participation_id?"Versi peserta":"Versi pendaftaran"}: {a.expected_version} → {a.resulting_version}</span>}
 {!!a.changed_fields.length&&<span>Kategori: {a.changed_fields.map(k=>({applicant_name:"Nama pemohon",phone:"Telefon",address:"Alamat",email:"Email",attendance:"Kehadiran",same_cattle_preference:"Permintaan lembu sama",participant_name:"Nama peserta",purpose:"Tujuan",status:"Status pendaftaran"} as Record<string,string>)[k]??k).join(", ")}</span>}{a.reason&&<span>Sebab: {cancellationReasons[a.reason as keyof typeof cancellationReasons]}</span>}
 {a.cattle_number!=null&&<span>{a.previous_cattle_number!=null?"Lembu "+a.previous_cattle_number+" / Bahagian "+a.previous_slot_number+" → ":""}Lembu {a.cattle_number} / Bahagian {a.slot_number}</span>}{a.grid_cattle_count!=null&&<span>Grid: {a.grid_cattle_count} lembu × {a.grid_shares_per_cattle} bahagian</span>}
 {a.export_id&&<span>Eksport: {a.registration_count} pendaftaran / {a.participation_count} peserta</span>}</li>)}</ol>:<p>Belum ada aktiviti operasi.</p>}
 <div className="admin-row-actions"><button disabled={busy||!activity||activity.page<=1} onClick={()=>void showActivity((activity?.page??1)-1)}>Aktiviti sebelumnya</button><button disabled={busy||activity?.items.length!==50} onClick={()=>void showActivity((activity?.page??1)+1)}>Aktiviti seterusnya</button></div></section>}
 </div>;
}
function ContactForm({data,disabled,submit}:{data:Detail;disabled:boolean;submit:Change}){
 const [v,setV]=useState({applicant_name:data.applicant_name,phone:data.phone,address:data.address??"",email:data.email??"",attendance:data.attendance,same_cattle_preference:data.same_cattle_preference});
 return <form autoComplete="off" className="qa-form" onSubmit={e=>{e.preventDefault();void submit({kind:"registration",expected_version:data.version,changes:{...v,email:v.email===""?null:v.email}});}}><h3>Pinda maklumat pemohon</h3><fieldset disabled={disabled}><legend className="qa-sr">Maklumat pemohon semasa</legend>
 <label>Nama pemohon<input required maxLength={160} value={v.applicant_name} onChange={e=>setV({...v,applicant_name:e.target.value})}/></label>
 <label>No. telefon<input required type="tel" inputMode="tel" minLength={8} maxLength={30} value={v.phone} onChange={e=>setV({...v,phone:e.target.value})}/></label>
 <label>Alamat<textarea required maxLength={500} value={v.address} onChange={e=>setV({...v,address:e.target.value})}/></label>
 <label>Email (pilihan)<input type="email" maxLength={254} value={v.email} onChange={e=>setV({...v,email:e.target.value})}/></label>
 <label>Kehadiran pemohon/wakil<select aria-label="Kehadiran pemohon/wakil" value={v.attendance} onChange={e=>setV({...v,attendance:e.target.value as Attendance})}>{Object.entries(attendanceLabels).map(([k,l])=><option value={k} key={k}>{l}</option>)}</select></label>
 <label className="qa-check"><input type="checkbox" checked={v.same_cattle_preference} onChange={e=>setV({...v,same_cattle_preference:e.target.checked})}/>Permintaan lembu sama (bukan jaminan)</label><button className="admin-button">Simpan maklumat pemohon</button></fieldset></form>;
}
function ParticipantForm({p,data,disabled,submit}:{p:Participant;data:Detail;disabled:boolean;submit:Change}){
 const [name,setName]=useState(p.participant_name),[purpose,setPurpose]=useState<Purpose>(p.purpose);
 return <form className="qa-form" onSubmit={e=>{e.preventDefault();void submit({kind:"participation",expected_version:data.version,participation_id:p.id,expected_participation_version:p.version,changes:{participant_name:name,purpose}});}}><fieldset disabled={disabled}><legend className="qa-sr">Pembetulan peserta</legend><label>Nama peserta<input required maxLength={160} value={name} onChange={e=>setName(e.target.value)}/></label><label>Tujuan<select aria-label="Tujuan" value={purpose} onChange={e=>setPurpose(e.target.value as Purpose)}>{data.allowed_purposes.map(v=><option value={v} key={v}>{v==="qurban"?"Qurban":"Aqiqah"}</option>)}</select></label><button>Simpan peserta</button></fieldset></form>;
}
function CancelForm({data,disabled,submit}:{data:Detail;disabled:boolean;submit:Change}){
 const [reason,setReason]=useState("");
 return <form className="qa-form qa-cancel" onSubmit={e=>{e.preventDefault();void submit({expected_version:data.version,reason},true);}}><h3>Pembatalan pendaftaran</h3><p>Pembatalan mengekalkan sejarah. Pendaftaran tidak boleh dibuka semula dalam fasa ini.</p><label>Sebab pembatalan<select aria-label="Sebab pembatalan" required value={reason} disabled={disabled} onChange={e=>setReason(e.target.value)}><option value="">Pilih sebab</option>{Object.entries(cancellationReasons).map(([k,v])=><option value={k} key={k}>{v}</option>)}</select></label><button disabled={disabled}>Batalkan pendaftaran</button></form>;
}
