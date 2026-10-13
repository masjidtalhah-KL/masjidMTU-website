"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";

// Historical display fixture only. This is neither a descriptor nor a domain default.
const reference = Object.freeze({ year: 2026, price: 880, cattle: 15, sharesPerCattle: 7 });
const akadVersion = "mtu-paper-2026-1447h-source-review-v1";
const akad = "Saya/kami dengan ini bersetuju mewakilkan kepada pihak Jawatankuasa Ibadah Qurban Masjid Talhah Bin Ubaidillah untuk menguruskan pembelian, penyembelihan dan pengagihan daging lembu Qurban/Aqiqah serta saya/kami bersetuju jika ada lebihan baki dari harga sebenar, baki wang tersebut digunakan untuk bayaran kos pengurusan.";
const money = (value: number) => `RM${new Intl.NumberFormat("en-MY").format(value)}`;
type Purpose = "qurban" | "aqiqah";
type Participant = { id: number; name: string; purpose: Purpose };
type Applicant = { name: string; phone: string; address: string; email: string };
type Errors = Record<string, string>;
const emptyApplicant = (): Applicant => ({ name: "", phone: "", address: "", email: "" });
const validPhone = (value: string) => /^\+?[\d\s()-]+$/.test(value.trim()) && /^\d{8,15}$/.test(value.replace(/\D/g, ""));
const validEmail = (value: string) => !value.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
const demoReference = (prefix: string) => `${prefix}-DEMO-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: ReactNode }) {
  return <div className="qbn-field"><label htmlFor={id}>{label}</label>{children}
    {error && <span id={`${id}-error`} className="qbn-error">{error}</span>}</div>;
}
function ErrorSummary({ errors }: { errors: Errors }) {
  return Object.keys(errors).length ? <div className="qbn-errors" role="alert" aria-label="Ralat borang" tabIndex={-1}>
    <strong>Sila semak maklumat berikut:</strong><ul>{Object.entries(errors).map(([key, message]) =>
      <li key={key}><a href={`#${key}`}>{message}</a></li>)}</ul></div> : null;
}
function useStepFocus(step: string | number) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, [step]);
  return heading;
}
function Summary({ count }: { count: number }) {
  return <aside className="qbn-summary" aria-label="Ringkasan jumlah contoh">
    <p className="eyebrow">Rujukan {reference.year} sahaja</p><h2>{count} bahagian</h2>
    <p>{money(reference.price)} × {count}</p><p className="qbn-total" aria-live="polite">Jumlah contoh: <strong>{money(reference.price * count)}</strong></p>
    <p>Jumlah perlu dibayar (contoh): {money(reference.price * count)}</p>
    <p>Status: <strong>Menunggu bayaran</strong></p>
    <hr /><p>15 lembu · 7 bahagian / lembu</p><p>Kapasiti contoh 2026: <strong>{reference.cattle * reference.sharesPerCattle} bahagian</strong></p>
    <small>Ini kapasiti rujukan, bukan baki semasa. Penghantaran dummy tidak menempah bahagian atau menetapkan lembu.</small>
  </aside>;
}
function Success({ volunteer, referenceNumber, status = "Menunggu bayaran", children, reset }: { volunteer?: boolean; referenceNumber: string; status?: string; children?: ReactNode; reset: () => void }) {
  const heading = useStepFocus("success");
  return <section className="qbn-card qbn-success"><p className="eyebrow">Ujian selesai</p>
    <h2 ref={heading} tabIndex={-1}>{volunteer ? "Pendaftaran sukarelawan dummy berjaya" : "Pendaftaran dummy berjaya"}</h2>
    <p>No. rujukan contoh:</p><strong className="qbn-reference">{referenceNumber}</strong>
    {!volunteer && <p aria-live="polite">Status: <strong>{status}</strong></p>}
    <p className="qbn-demo">DEMO SAHAJA — data tidak disimpan.</p>{children}
    <p>Muat semula halaman akan memadam keputusan ini.</p>
    <button className="button button--secondary" onClick={reset}>Isi borang baru</button>
  </section>;
}

function ParticipantSuccess({ referenceNumber, count, reset }: { referenceNumber: string; count: number; reset: () => void }) {
  const [proof, setProof] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  return <Success referenceNumber={referenceNumber} status={submitted ? "Menunggu pengesahan admin" : "Menunggu bayaran"} reset={reset}>
    <section className="qbn-bank" aria-label="Pindahan bank contoh">
      <h3>Bayaran melalui Bank Islam</h3>
      <p className="qbn-account">1227 0010 0045 60</p><p><strong>MASJID TALHAH BIN UBAIDILLAH</strong></p>
      <p>Jumlah perlu dibayar: <strong>{money(count * reference.price)}</strong></p>
      <small>{count} bahagian × RM880 · harga rujukan 2026 sahaja. Jangan buat bayaran sebenar untuk pendaftaran dummy.</small>
    </section>
    <form className="qbn-proof" noValidate onSubmit={event => {
      event.preventDefault();
      if (!proof) { setError("Pilih fail JPEG, PNG atau PDF untuk ujian dummy."); return; }
      setSubmitted(true);
    }}>
      <Field id="payment-proof" label="Muat naik bukti pembayaran" error={error}>
        <input id="payment-proof" type="file" accept="image/jpeg,image/png,application/pdf" aria-invalid={!!error} aria-describedby={error ? "payment-proof-error proof-help" : "proof-help"} onChange={event => {
          const selected = event.target.files?.[0] ?? null;
          setSubmitted(false); setError("");
          if (selected && !["image/jpeg", "image/png", "application/pdf"].includes(selected.type)) {
            setProof(null); event.target.value = ""; setError("Format tidak disokong. Pilih JPEG, PNG atau PDF."); return;
          }
          setProof(selected);
        }} />
      </Field>
      <p id="proof-help" className="qbn-demo">DEMO SAHAJA — fail tidak dimuat naik atau disimpan.</p>
      {proof && <p className="qbn-file">Fail pilihan: <strong>{proof.name}</strong><br />Jenis: {proof.type}</p>}
      <button className="button button--secondary" type="submit" disabled={!proof || submitted}>Hantar bukti pembayaran dummy</button>
      {submitted && <div className="qbn-proof-result" role="status"><h3>Bukti pembayaran diterima untuk semakan</h3><p>Menunggu pengesahan admin. Penghantaran bukti bukan pengesahan bayaran.</p></div>}
    </form>
  </Success>;
}

function ParticipantForm({ home }: { home: () => void }) {
  const [step, setStep] = useState(1);
  const [applicant, setApplicant] = useState<Applicant>(emptyApplicant);
  const [participants, setParticipants] = useState<Participant[]>([{ id: 1, name: "", purpose: "qurban" }]);
  const nextId = useRef(2);
  const [attendance, setAttendance] = useState("");
  const [together, setTogether] = useState(false);
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [result, setResult] = useState<{ reference: string; acceptedAt: string; akadVersion: string } | null>(null);
  const heading = useStepFocus(step);
  const clearError = (key: string) => setErrors(e => { const next = { ...e }; delete next[key]; return next; });
  const updateApplicant = (key: keyof Applicant, value: string) => {
    setApplicant(a => ({ ...a, [key]: value })); clearError(`applicant-${key}`);
  };
  const updateParticipant = (id: number, patch: Partial<Participant>) => {
    setParticipants(p => p.map(x => x.id === id ? { ...x, ...patch } : x));
    if (patch.name !== undefined) clearError(`participant-${id}`);
  };
  const applicantErrors = (): Errors => {
    const e: Errors = {};
    if (!applicant.name.trim()) e["applicant-name"] = "Nama penuh pemohon diperlukan.";
    if (!validPhone(applicant.phone)) e["applicant-phone"] = "Masukkan no. telefon yang sah (8–15 digit).";
    if (!applicant.address.trim()) e["applicant-address"] = "Alamat pemohon diperlukan.";
    if (!validEmail(applicant.email)) e["applicant-email"] = "Masukkan email yang sah atau biarkan kosong.";
    return e;
  };
  const participantErrors = (): Errors => {
    const e: Errors = {};
    participants.forEach((p, i) => { if (!p.name.trim()) e[`participant-${p.id}`] = `Nama peserta ${i + 1} diperlukan.`; });
    if (!attendance) e["attendance-yes"] = "Pilih rancangan kehadiran pemohon/wakil.";
    if (!consent) e["akad-consent"] = "Persetujuan akad/wakalah diperlukan.";
    return e;
  };
  function advance(event: FormEvent) {
    event.preventDefault();
    const e = step === 1 ? applicantErrors() : participantErrors();
    setErrors(e);
    if (Object.keys(e).length) { requestAnimationFrame(() => document.querySelector<HTMLElement>(".qbn-errors")?.focus()); return; }
    setStep(step + 1);
  }
  function submitDummy() {
    const e = { ...applicantErrors(), ...participantErrors() };
    if (Object.keys(e).length) { setErrors(e); setStep(Object.keys(applicantErrors()).length ? 1 : 2); return; }
    setResult({ reference: demoReference("QBN"), acceptedAt: new Date().toISOString(), akadVersion });
  }
  if (result) return <ParticipantSuccess referenceNumber={result.reference} count={participants.length} reset={home} />;
  const attendanceLabel = attendance === "yes" ? "Ya" : attendance === "no" ? "Tidak" : "Belum pasti";
  return <div className="qbn-workspace"><div className="qbn-card">
    <button type="button" className="qbn-back" onClick={home}>← Pilihan pendaftaran</button>
    <ol className="qbn-steps" aria-label="Langkah pendaftaran">{["Pemohon", "Peserta & akad", "Semakan"].map((label, i) =>
      <li key={label} aria-current={step === i + 1 ? "step" : undefined}><span>{i + 1}</span>{label}</li>)}</ol>
    <h2 ref={heading} tabIndex={-1}>{step === 1 ? "Maklumat Pemohon" : step === 2 ? "Peserta Qurban / Aqiqah" : "Semak pendaftaran"}</h2>
    <ErrorSummary errors={errors} />
    {step < 3 ? <form noValidate autoComplete="off" onSubmit={advance}>
      {step === 1 ? <>
        <p>Pemohon ialah orang untuk dihubungi. Pemohon tidak semestinya salah seorang peserta.</p>
        <Field id="applicant-name" label="Nama penuh" error={errors["applicant-name"]}><input id="applicant-name" required maxLength={160} value={applicant.name} onChange={e => updateApplicant("name", e.target.value)} aria-invalid={!!errors["applicant-name"]} aria-describedby={errors["applicant-name"] ? "applicant-name-error" : undefined} /></Field>
        <Field id="applicant-phone" label="No. telefon" error={errors["applicant-phone"]}><input id="applicant-phone" type="tel" inputMode="tel" required maxLength={30} placeholder="Contoh: 012-345 6789" value={applicant.phone} onChange={e => updateApplicant("phone", e.target.value)} aria-invalid={!!errors["applicant-phone"]} aria-describedby={errors["applicant-phone"] ? "applicant-phone-error" : undefined} /></Field>
        <Field id="applicant-address" label="Alamat" error={errors["applicant-address"]}><textarea id="applicant-address" rows={3} required maxLength={500} value={applicant.address} onChange={e => updateApplicant("address", e.target.value)} aria-invalid={!!errors["applicant-address"]} aria-describedby={errors["applicant-address"] ? "applicant-address-error" : undefined} /></Field>
        <Field id="applicant-email" label="Email (pilihan)" error={errors["applicant-email"]}><input id="applicant-email" type="email" maxLength={254} value={applicant.email} onChange={e => updateApplicant("email", e.target.value)} aria-invalid={!!errors["applicant-email"]} aria-describedby={errors["applicant-email"] ? "applicant-email-error" : undefined} /></Field>
      </> : <>
        <p>Satu peserta mewakili satu bahagian lembu. Masukkan nama individu yang diniatkan ibadah untuknya.</p>
        <div className="qbn-participants">{participants.map((p, i) => <fieldset className="qbn-participant" key={p.id}>
          <legend>Peserta {i + 1}</legend>
          <Field id={`participant-${p.id}`} label="Nama peserta" error={errors[`participant-${p.id}`]}><input id={`participant-${p.id}`} value={p.name} maxLength={160} required onChange={e => updateParticipant(p.id, { name: e.target.value })} aria-invalid={!!errors[`participant-${p.id}`]} aria-describedby={errors[`participant-${p.id}`] ? `participant-${p.id}-error` : undefined} /></Field>
          <fieldset className="qbn-options"><legend>Tujuan</legend>{(["qurban", "aqiqah"] as const).map(purpose => <label key={purpose}><input type="radio" name={`purpose-${p.id}`} checked={p.purpose === purpose} onChange={() => updateParticipant(p.id, { purpose })} />{purpose === "qurban" ? "Qurban" : "Aqiqah"}</label>)}</fieldset>
          <button type="button" className="qbn-remove" disabled={participants.length === 1} aria-label={`Hapus peserta ${i + 1}`} onClick={() => {
            setParticipants(all => all.filter(x => x.id !== p.id)); setErrors({});
            requestAnimationFrame(() => document.getElementById("add-participant")?.focus());
          }}>Hapus peserta</button>
        </fieldset>)}</div>
        <button type="button" id="add-participant" className="button button--outline" onClick={() => {
          const id = nextId.current++; setParticipants(all => [...all, { id, name: "", purpose: "qurban" }]);
          requestAnimationFrame(() => document.getElementById(`participant-${id}`)?.focus());
        }}>+ Tambah peserta</button>
        <div className="qbn-section"><label className="qbn-check"><input type="checkbox" checked={together} onChange={e => setTogether(e.target.checked)} />Jika boleh, letakkan peserta dalam pendaftaran ini pada lembu yang sama.</label>
          <p className="qbn-help">Permintaan ini tertakluk kepada kapasiti dan keputusan urus setia.</p></div>
        <fieldset className="qbn-options qbn-section"><legend>Adakah pemohon/wakil bercadang hadir pada hari program?</legend>
          {[["yes", "Ya"], ["no", "Tidak"], ["unsure", "Belum pasti"]].map(([value, label]) => <label key={value}><input id={`attendance-${value}`} type="radio" name="attendance" checked={attendance === value} onChange={() => { setAttendance(value); clearError("attendance-yes"); }} />{label}</label>)}
          {errors["attendance-yes"] && <p className="qbn-error">{errors["attendance-yes"]}</p>}
        </fieldset>
        <section className="qbn-akad"><h3>Akad ibadah Qurban / Aqiqah</h3><p>{akad}</p>
          <small>Teks sumber borang 2026/1447H. Rujukan versi: {akadVersion}. Penggunaan digital tertakluk kepada semakan pemilik.</small></section>
        <label className="qbn-check"><input id="akad-consent" type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} />Saya telah membaca dan bersetuju dengan akad/wakalah di atas.</label>
        {!consent && <p className="qbn-help">Tandakan persetujuan untuk meneruskan semakan.</p>}
      </>}
      <div className="qbn-actions">{step === 2 && <button type="button" className="button button--outline" onClick={() => { setErrors({}); setStep(1); }}>Kembali</button>}
        <button className="button button--secondary" type="submit" disabled={step === 2 && !consent}>{step === 1 ? "Seterusnya: peserta" : "Semak pendaftaran"}</button></div>
    </form> : <>
      <dl className="qbn-details"><dt>Pemohon</dt><dd>{applicant.name}</dd><dt>No telefon</dt><dd>{applicant.phone}</dd><dt>Alamat</dt><dd>{applicant.address}</dd>{applicant.email && <><dt>Email</dt><dd>{applicant.email}</dd></>}</dl>
      <h3>Peserta</h3><ol className="qbn-review-list">{participants.map(p => <li key={p.id}>{p.name} — {p.purpose === "qurban" ? "Qurban" : "Aqiqah"}</li>)}</ol>
      <dl className="qbn-details"><dt>Jumlah bahagian</dt><dd>{participants.length}</dd><dt>Harga rujukan</dt><dd>{money(reference.price)} / bahagian</dd><dt>Jumlah contoh</dt><dd>{money(participants.length * reference.price)}</dd><dt>Kehadiran pemohon/wakil</dt><dd>{attendanceLabel}</dd><dt>Permintaan lembu sama</dt><dd>{together ? "Ya — tertakluk kepada kapasiti dan keputusan urus setia" : "Tiada permintaan"}</dd><dt>Akad</dt><dd>Dipersetujui · teks sumber 2026</dd></dl>
      <p className="qbn-demo">DEMO SAHAJA — data tidak disimpan.</p>
      <div className="qbn-actions"><button className="button button--outline" onClick={() => setStep(2)}>Ubah maklumat</button><button className="button button--secondary" disabled={!consent} onClick={submitDummy}>Hantar pendaftaran dummy</button></div>
    </>}
  </div><Summary count={participants.length} /></div>;
}

function VolunteerForm({ home, whatsappGroupUrl }: { home: () => void; whatsappGroupUrl?: string }) {
  const [contact, setContact] = useState(emptyApplicant);
  const [shirt, setShirt] = useState("");
  const [alsoParticipant, setAlsoParticipant] = useState(false);
  const [participantName, setParticipantName] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [review, setReview] = useState(false);
  const [result, setResult] = useState("");
  const heading = useStepFocus(review ? "review" : "volunteer");
  const clearError = (key: string) => setErrors(e => { const next = { ...e }; delete next[key]; return next; });
  const update = (key: keyof Applicant, value: string) => { setContact(c => ({ ...c, [key]: value })); clearError(`vol-${key}`); };
  function validate(): Errors {
    const e: Errors = {};
    if (!contact.name.trim()) e["vol-name"] = "Nama penuh sukarelawan diperlukan.";
    if (!validPhone(contact.phone)) e["vol-phone"] = "Masukkan no. telefon yang sah (8–15 digit).";
    if (!validEmail(contact.email)) e["vol-email"] = "Masukkan email yang sah atau biarkan kosong.";
    if (!shirt) e["vol-shirt"] = "Pilih saiz baju.";
    if (alsoParticipant && !participantName.trim()) e["vol-participant-name"] = "Nyatakan nama peserta Qurban/Aqiqah.";
    return e;
  }
  function advance(event: FormEvent) {
    event.preventDefault(); const e = validate(); setErrors(e);
    if (Object.keys(e).length) { requestAnimationFrame(() => document.querySelector<HTMLElement>(".qbn-errors")?.focus()); return; }
    setReview(true);
  }
  if (result) return <Success volunteer referenceNumber={result} reset={home}>
    <section className="qbn-group" aria-label="Group WhatsApp sukarelawan"><h3>Jangan lupa sertai group WhatsApp rasmi sukarelawan</h3>
      {whatsappGroupUrl ? <a className="button button--secondary" href={whatsappGroupUrl} target="_blank" rel="noopener noreferrer">Sertai Group WhatsApp Sukarelawan</a> : <><p>Pautan group WhatsApp belum dibuka oleh urus setia.</p><p>Pihak masjid akan menyediakan group apabila hampir dengan tarikh program.</p></>}
    </section>
  </Success>;
  return <section className="qbn-card qbn-volunteer"><button className="qbn-back" onClick={home}>← Pilihan pendaftaran</button>
    <p className="eyebrow">Sukarelawan · Tanpa syarat penyertaan atau bayaran</p>
    <h2 ref={heading} tabIndex={-1}>{review ? "Semak pendaftaran sukarelawan" : "Daftar Sukarelawan"}</h2>
    <ErrorSummary errors={errors} />
    {!review ? <form noValidate autoComplete="off" onSubmit={advance}>
      <Field id="vol-name" label="Nama penuh" error={errors["vol-name"]}><input id="vol-name" required maxLength={160} value={contact.name} onChange={e => update("name", e.target.value)} aria-invalid={!!errors["vol-name"]} aria-describedby={errors["vol-name"] ? "vol-name-error" : undefined} /></Field>
      <Field id="vol-phone" label="No. telefon" error={errors["vol-phone"]}><input id="vol-phone" type="tel" inputMode="tel" maxLength={30} required placeholder="Contoh: 012-345 6789" value={contact.phone} onChange={e => update("phone", e.target.value)} aria-invalid={!!errors["vol-phone"]} aria-describedby={errors["vol-phone"] ? "vol-phone-error" : undefined} /></Field>
      <Field id="vol-email" label="Email (pilihan)" error={errors["vol-email"]}><input id="vol-email" type="email" maxLength={254} value={contact.email} onChange={e => update("email", e.target.value)} aria-invalid={!!errors["vol-email"]} aria-describedby={errors["vol-email"] ? "vol-email-error" : undefined} /></Field>
      <Field id="vol-shirt" label="Saiz baju" error={errors["vol-shirt"]}><select id="vol-shirt" required value={shirt} onChange={e => { setShirt(e.target.value); clearError("vol-shirt"); }} aria-invalid={!!errors["vol-shirt"]} aria-describedby={errors["vol-shirt"] ? "vol-shirt-error" : undefined}><option value="">Pilih saiz</option>{["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "Belum pasti"].map(size => <option key={size}>{size}</option>)}</select></Field>
      <p className="qbn-help">Pihak masjid akan menyusun tugasan sukarelawan kemudian.</p>
      <fieldset className="qbn-options qbn-section"><legend>Adakah anda juga peserta Qurban/Aqiqah?</legend><label><input type="radio" name="vol-participant" checked={!alsoParticipant} onChange={() => { setAlsoParticipant(false); setParticipantName(""); clearError("vol-participant-name"); }} />Tidak</label><label><input type="radio" name="vol-participant" checked={alsoParticipant} onChange={() => setAlsoParticipant(true)} />Ya</label></fieldset>
      {alsoParticipant && <><Field id="vol-participant-name" label="Nama peserta Qurban/Aqiqah" error={errors["vol-participant-name"]}><input id="vol-participant-name" required maxLength={160} value={participantName} onChange={e => { setParticipantName(e.target.value); clearError("vol-participant-name"); }} aria-invalid={!!errors["vol-participant-name"]} aria-describedby={errors["vol-participant-name"] ? "vol-participant-name-error vol-participant-help" : "vol-participant-help"} /></Field><p id="vol-participant-help" className="qbn-help">Nama ini ialah maklumat yang anda berikan untuk rujukan urus setia sahaja.</p></>}
      <div className="qbn-actions"><button type="submit" className="button button--secondary">Semak pendaftaran sukarelawan</button></div>
    </form> : <>
      <dl className="qbn-details"><dt>Nama</dt><dd>{contact.name}</dd><dt>No telefon</dt><dd>{contact.phone}</dd><dt>Email</dt><dd>{contact.email || "Tidak diberikan"}</dd><dt>Saiz baju</dt><dd>{shirt}</dd><dt>Juga peserta Qurban/Aqiqah?</dt><dd>{alsoParticipant ? "Ya" : "Tidak"}</dd>{alsoParticipant && <><dt>Nama peserta (maklumat diberi)</dt><dd>{participantName}</dd></>}</dl>
      <p className="qbn-demo">DEMO SAHAJA — data tidak disimpan.</p><div className="qbn-actions"><button className="button button--outline" onClick={() => setReview(false)}>Ubah maklumat</button><button className="button button--secondary" onClick={() => { if (!Object.keys(validate()).length) setResult(demoReference("VOL")); }}>Hantar pendaftaran sukarelawan dummy</button></div>
    </>}
  </section>;
}

export default function QurbanPrototype({ volunteerWhatsappGroupUrl }: { volunteerWhatsappGroupUrl?: string }) {
  const [mode, setMode] = useState<"home" | "participant" | "volunteer">("home");
  const [generation, setGeneration] = useState(0);
  function home() { setMode("home"); setGeneration(n => n + 1); }
  const heading = useStepFocus(mode);
  return <section className="qbn-prototype"><div className="container container--wide">
    <div className="qbn-banner" role="note"><strong>DEMO SAHAJA — data tidak disimpan.</strong><span>Contoh berdasarkan Qurban MTU 2026 — bukan harga 2027 yang diluluskan.</span><span>Maklumat rekaan sahaja. Tiada kutipan bayaran atau tempahan bahagian.</span></div>
    {mode === "home" ? <>
      <div className="qbn-intro"><p className="eyebrow">Pendaftaran untuk semakan</p><h2 ref={heading} tabIndex={-1}>Pilih cara anda menyertai</h2><p>Satu pemohon boleh mendaftarkan beberapa peserta. Sukarelawan pula boleh menyertai secara berasingan.</p></div>
      <div className="qbn-choices"><section className="qbn-choice"><span className="qbn-choice-number">01 / IBADAH</span><h3>Qurban & Aqiqah</h3><p>Daftarkan peserta, pilih tujuan ibadah dan semak jumlah bahagian sebelum menghantar dummy.</p><p className="qbn-choice-price">{money(reference.price)} <small>/ bahagian · rujukan 2026</small></p><button className="button button--secondary" onClick={() => setMode("participant")}>Daftar Qurban / Aqiqah</button></section>
      <section className="qbn-choice"><span className="qbn-choice-number">02 / KHIDMAT</span><h3>Jadi sukarelawan</h3><p>Daftar untuk membantu kelancaran program. Pihak masjid akan menyusun tugasan kemudian.</p><p className="qbn-choice-price">Terbuka <small>kepada peserta dan bukan peserta</small></p><button className="button button--outline" onClick={() => setMode("volunteer")}>Daftar Sukarelawan</button></section></div>
      <div className="qbn-capacity"><strong>Rujukan 2026</strong><span>15 lembu</span><span>7 bahagian / lembu</span><span>105 jumlah kapasiti</span></div>
    </> : mode === "participant" ? <ParticipantForm key={generation} home={home} /> : <VolunteerForm key={generation} home={home} whatsappGroupUrl={volunteerWhatsappGroupUrl} />}
  </div></section>;
}
