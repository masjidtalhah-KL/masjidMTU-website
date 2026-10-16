"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { boundedText, money, registrationRequest, registrationResult, validApplicant, type Attendance, type Participant, type RegistrationContext, type RegistrationRequest, type RegistrationResult } from "@/lib/qurban/registration-contract";
import "./registration.css";

const attendanceLabels = { yes: "Ya", no: "Tidak", unsure: "Belum pasti" };
const blankApplicant = () => ({ name: "", phone: "", address: "", email: "" });
type Errors = Record<string, string>;
function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: ReactNode }) {
  return <div className="qr-field"><label htmlFor={id}>{label}</label>{children}{error && <p id={`${id}-error`} className="qr-error">{error}</p>}</div>;
}
export function QurbanRegistrationForm({ context: c }: { context: RegistrationContext }) {
  const [step, setStep] = useState(1), [applicant, setApplicant] = useState(blankApplicant);
  const nextParticipantId = useRef(2);
  const [participants, setParticipants] = useState<(Participant & { key: number })[]>([{ key: 1, name: "", purpose: c.allowed_purposes[0] }]);
  const [attendance, setAttendance] = useState<Attendance | "">(""), [together, setTogether] = useState(false), [accepted, setAccepted] = useState(false);
  const [errors, setErrors] = useState<Errors>({}), [pending, setPending] = useState(false), [message, setMessage] = useState("");
  const [retryOnly, setRetryOnly] = useState(false);
  const [conflict, setConflict] = useState(false), [result, setResult] = useState<RegistrationResult | null>(null);
  const [paymentLink,setPaymentLink]=useState("");
  const [participantFocus, setParticipantFocus] = useState("");
  const inFlight = useRef(false), frozenRequest = useRef<RegistrationRequest | null>(null);
  const heading = useRef<HTMLHeadingElement>(null), summary = useRef<HTMLDivElement>(null);
  useEffect(() => { heading.current?.focus(); }, [step, result]);
  useEffect(() => { if (Object.keys(errors).length) summary.current?.focus(); }, [errors]);
  useEffect(() => { if (participantFocus) document.getElementById(participantFocus)?.focus(); }, [participantFocus, participants.length]);
  const count = participants.length;
  const cleanApplicant = () => ({ name: applicant.name.trim(), phone: applicant.phone.trim(), address: applicant.address.trim(), email: applicant.email.trim() || null });
  function validate(current: number) {
    const e: Errors = {};
    if (current === 1) {
      const a = cleanApplicant();
      if (!boundedText(a.name, 160)) e["applicant-name"] = "Masukkan nama penuh pemohon (maksimum 160 aksara).";
      if (!/^\+?[0-9 ()-]+$/.test(a.phone) || a.phone.replace(/\D/g, "").length < 8 || a.phone.replace(/\D/g, "").length > 15 || a.phone.length > 30) e["applicant-phone"] = "Masukkan nombor telefon yang sah (8–15 digit).";
      if (!boundedText(a.address.replace(/\r\n/g, "\n").replace(/\n/g, " "), 500)) e["applicant-address"] = "Masukkan alamat (maksimum 500 aksara).";
      if (a.email && (!boundedText(a.email, 254) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a.email))) e["applicant-email"] = "Semak alamat email anda.";
      if (!validApplicant(a) && !Object.keys(e).length) e["applicant-name"] = "Semak maklumat pemohon.";
    } else if (current === 2) {
      for (const p of participants) if (!boundedText(p.name.trim(), 160) || !c.allowed_purposes.includes(p.purpose)) e[`participant-${p.key}`] = "Masukkan nama peserta dan tujuan yang dibenarkan.";
      if (new TextEncoder().encode(participants.map(p => p.name.trim()).join("")).length > 20000) e["participants-heading"] = "Maklumat peserta terlalu panjang. Kurangkan jumlah teks dalam pendaftaran ini.";
      if (!attendance) e.attendance = "Pilih kehadiran pemohon/wakil.";
    } else if (!accepted) e.akad = "Persetujuan akad/wakalah diperlukan.";
    setErrors(e);
    return !Object.keys(e).length;
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (step < 4) { if (validate(step)) { setStep(step + 1); setMessage(""); } return; }
    if (inFlight.current || conflict || result) return;
    inFlight.current = true; setPending(true); setMessage("");
    try {
      if (!frozenRequest.current) {
        const idempotencyKey = Array.from(crypto.getRandomValues(new Uint8Array(32)), n => n.toString(16).padStart(2, "0")).join("");
        frozenRequest.current = registrationRequest({ slug: c.slug, idempotency_key: idempotencyKey,
          payment_access_secret:Array.from(crypto.getRandomValues(new Uint8Array(32)),x=>x.toString(16).padStart(2,"0")).join(""), expected_campaign_version: c.campaign_version, expected_global_flag_version: c.global_flag_version, expected_module_flag_version: c.module_flag_version,
          expected_akad_reference: c.akad_reference, expected_akad_hash: c.akad_hash, applicant: cleanApplicant(),
          participants: participants.map(p => ({ name: p.name.trim(), purpose: p.purpose })), attendance, same_cattle_preference: together, accepted_akad: accepted });
      }
      setRetryOnly(true);
      const response = await fetch(`/kempen/${c.slug}/daftar/hantar`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(frozenRequest.current), cache: "no-store", credentials: "omit" });
      if (response.status === 409) { setConflict(true); setMessage("Maklumat atau ketersediaan kempen telah berubah. Muat semula dan semak maklumat terkini sebelum menghantar pendaftaran."); return; }
      if (response.status === 422 || response.status === 413) { frozenRequest.current = null; setRetryOnly(false); setMessage("Maklumat tidak dapat diterima. Kembali dan semak borang anda."); return; }
      if (!response.ok) throw new Error("unavailable");
      const confirmation=registrationResult(await response.json());setResult(confirmation);setPaymentLink(`/kempen/${c.slug}/bayaran#${confirmation.payment_access_id}.${frozenRequest.current.payment_access_secret}`);
      // Success retains confirmation and the private bearer link in UI memory only; no browser storage or reference-only lookup.
      frozenRequest.current = null; setApplicant(blankApplicant()); setParticipants([]); setAttendance(""); setAccepted(false); setTogether(false);
    } catch { setMessage("Sambungan tidak dapat disahkan. Cuba hantar semula dari halaman ini; permintaan yang sama tidak akan diduplikasi."); }
    finally { inFlight.current = false; setPending(false); }
  }
  const invalid = (id: string) => ({ "aria-invalid": !!errors[id], "aria-describedby": errors[id] ? `${id}-error` : undefined });
  if (result) return <section className="qr-card qr-success">
    <h2 ref={heading} tabIndex={-1}>Pendaftaran berjaya</h2><p>No. rujukan:</p><strong className="qr-reference">{result.reference}</strong>
    <p>Jumlah bahagian: <strong>{result.participant_count}</strong></p><p>Jumlah perlu dibayar: <strong>{money(result.total_minor)}</strong></p>
    <p className="qr-notice">Pendaftaran ini belum mengesahkan bayaran dan belum menempah bahagian.</p>
    <section aria-label="Maklumat pindahan bank"><h3>Bayaran melalui Bank Islam</h3><p className="qr-account">1227 0010 0045 60</p><p>MASJID TALHAH BIN UBAIDILLAH</p></section>
    <section aria-label="Pautan bayaran selamat"><h3>Hantar bukti bayaran</h3><p>Simpan pautan selamat ini untuk kembali kemudian. Sesiapa yang memilikinya boleh mengakses urusan bukti pendaftaran ini; simpan secara peribadi.</p><a className="button button--primary" href={paymentLink} rel="noreferrer">Hantar bukti bayaran</a><button type="button" className="button button--secondary" onClick={()=>void navigator.clipboard.writeText(new URL(paymentLink,window.location.origin).href).then(()=>setMessage("Pautan selamat disalin."),()=>setMessage("Pautan tidak dapat disalin. Gunakan pautan Hantar bukti bayaran."))}>Salin pautan selamat</button>{message&&<p role="status">{message}</p>}</section><p>Simpan nombor rujukan ini untuk urusan dengan urus setia. Halaman ini tidak menyediakan carian maklumat peribadi.</p>
    <Link className="button button--secondary" href={`/kempen/${c.slug}`} prefetch={false}>Kembali ke kempen</Link>
  </section>;
  return <div className="qr-registration">
    <ol className="qr-steps" aria-label="Langkah pendaftaran">{["Pemohon", "Peserta", "Akad", "Semakan"].map((s, i) => <li key={s} aria-current={step === i + 1 ? "step" : undefined}>{i + 1}. {s}</li>)}</ol>
    <aside className="qr-quote" aria-label="Ringkasan jumlah" aria-live="polite"><strong>{count} bahagian</strong><span>{money(c.price_per_share_minor)} × {count}</span><strong>Jumlah: {money(c.price_per_share_minor * count)}</strong></aside>
    <p className="qr-notice">Pendaftaran tidak menempah bahagian. Kelayakan tertakluk kepada pengesahan bayaran dan semakan kapasiti oleh urus setia.</p>
    <form className="qr-card" noValidate onSubmit={submit}>
      <h2 ref={heading} tabIndex={-1}>{["", "Maklumat Pemohon / Wakil", "Peserta Qurban / Aqiqah", "Akad / Wakalah", "Semak pendaftaran"][step]}</h2>
      {!!Object.keys(errors).length && <div ref={summary} className="qr-errors" role="alert" tabIndex={-1}><strong>Sila semak maklumat berikut:</strong><ul>{Object.entries(errors).map(([id, text]) => <li key={id}><a href={`#${id}`}>{text}</a></li>)}</ul></div>}
      {step === 1 && <>{([['name','Nama penuh','text','name',160],['phone','No. telefon','tel','tel',30],['email','Email — optional','email','email',254]] as const).map(([key,label,type,autoComplete,maxLength]) => <Field key={key} id={`applicant-${key}`} label={label} error={errors[`applicant-${key}`]}><input id={`applicant-${key}`} type={type} inputMode={key === "phone" ? "tel" : undefined} autoComplete={autoComplete} maxLength={maxLength} value={applicant[key]} onChange={e => setApplicant({ ...applicant, [key]: e.target.value })} {...invalid(`applicant-${key}`)} /></Field>)}
        <Field id="applicant-address" label="Alamat" error={errors["applicant-address"]}><textarea id="applicant-address" autoComplete="street-address" rows={3} maxLength={500} value={applicant.address} onChange={e => setApplicant({ ...applicant, address: e.target.value })} {...invalid("applicant-address")} /></Field></>}
      {step === 2 && <><p>Pemohon tidak perlu menjadi salah seorang peserta. Maksimum {c.max_participants} peserta bagi pendaftaran ini.</p><div id="participants-heading">{participants.map((p, i) => <fieldset className="qr-participant" key={p.key}><legend>Peserta {i + 1}</legend>
        <Field id={`participant-${p.key}`} label="Nama peserta" error={errors[`participant-${p.key}`]}><input id={`participant-${p.key}`} autoComplete="off" maxLength={160} value={p.name} onChange={e => setParticipants(participants.map(x => x.key === p.key ? { ...x, name: e.target.value } : x))} {...invalid(`participant-${p.key}`)} /></Field>
        <fieldset className="qr-options"><legend>Tujuan</legend>{c.allowed_purposes.map(purpose => <label key={purpose}><input type="radio" name={`purpose-${p.key}`} value={purpose} checked={p.purpose === purpose} onChange={() => setParticipants(participants.map(x => x.key === p.key ? { ...x, purpose } : x))} />{purpose === "qurban" ? "Qurban" : "Aqiqah"}</label>)}</fieldset>
        <button className="button button--secondary" type="button" disabled={count === 1} aria-label={`Hapus peserta ${i + 1}`} onClick={() => { const remaining = participants.filter(x => x.key !== p.key); setParticipants(remaining); setParticipantFocus(`participant-${remaining[Math.max(0, i - 1)].key}`); setErrors({}); }}>Hapus peserta</button>
      </fieldset>)}</div>
      <button className="button button--secondary" type="button" disabled={count >= c.max_participants} onClick={() => { const key = nextParticipantId.current++; setParticipants([...participants, { key, name: "", purpose: c.allowed_purposes[0] }]); setParticipantFocus(`participant-${key}`); }}>+ Tambah peserta</button>
      <fieldset id="attendance" className="qr-options"><legend>Adakah pemohon/wakil bercadang hadir?</legend>{(["yes", "no", "unsure"] as const).map(a => <label key={a}><input type="radio" name="attendance" checked={attendance === a} onChange={() => setAttendance(a)} {...invalid("attendance")} />{attendanceLabels[a]}</label>)}{errors.attendance && <p id="attendance-error" className="qr-error">{errors.attendance}</p>}</fieldset>
      <label className="qr-check"><input type="checkbox" checked={together} onChange={e => setTogether(e.target.checked)} />Jika boleh, letakkan peserta dalam pendaftaran ini pada lembu yang sama.</label><p className="qr-help">Permintaan ini tertakluk kepada kapasiti dan keputusan urus setia.</p></>}
      {step === 3 && <><p className="qr-akad">{c.akad_text}</p><p>Rujukan akad: <strong>{c.akad_reference}</strong></p><label className="qr-check" id="akad"><input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} {...invalid("akad")} />Saya telah membaca dan bersetuju dengan akad/wakalah di atas.</label>{errors.akad && <p className="qr-error" id="akad-error">{errors.akad}</p>}</>}
      {step === 4 && <><dl className="qr-details"><dt>Pemohon</dt><dd>{applicant.name}</dd><dt>Telefon</dt><dd>{applicant.phone}</dd><dt>Alamat</dt><dd className="qr-akad">{applicant.address}</dd>{applicant.email && <><dt>Email</dt><dd>{applicant.email}</dd></>}</dl>
        <h3>Peserta</h3><ol>{participants.map(p => <li key={p.key}>{p.name} — {p.purpose === "qurban" ? "Qurban" : "Aqiqah"}</li>)}</ol>
        <dl className="qr-details"><dt>Jumlah bahagian</dt><dd>{count}</dd><dt>Harga per bahagian</dt><dd>{money(c.price_per_share_minor)}</dd><dt>Jumlah</dt><dd>{money(c.price_per_share_minor * count)}</dd><dt>Kehadiran</dt><dd>{attendance ? attendanceLabels[attendance] : ""}</dd><dt>Permintaan lembu sama</dt><dd>{together ? "Ya — tertakluk kepada keputusan urus setia" : "Tidak"}</dd><dt>Akad</dt><dd>Dipersetujui · {c.akad_reference}</dd></dl></>}
      {message && <div role="alert" className="qr-errors">{message}{conflict && <p><a className="button button--secondary" href={`/kempen/${c.slug}/daftar`}>Muat semula maklumat kempen</a></p>}</div>}
      <div className="qr-actions">{step > 1 && <button className="button button--secondary" type="button" disabled={pending || retryOnly || conflict} onClick={() => { setStep(step - 1); setErrors({}); setMessage(""); }}>Kembali</button>}
        <button className="button button--primary" type="submit" disabled={pending || conflict || step === 3 && !accepted}>{pending ? "Sedang menghantar…" : step === 4 ? "Hantar pendaftaran" : step === 3 ? "Semak pendaftaran" : "Seterusnya"}</button></div>
    </form>
  </div>;
}
