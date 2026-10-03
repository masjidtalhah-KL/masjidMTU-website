"use client";

import { useRef, useState, type ReactNode } from "react";
import { lectureOccurrences } from "../../lecture-types";
import { LecturePoster } from "./LecturePoster";
import { InteractiveLecturePoster } from "./InteractiveLecturePoster";
import { infaqPlacement, posterCellRects } from "./poster-layout";
import { readLocalPoster } from "./local-poster";
import { exportPoster } from "./export-poster";
import { applyRecurringRules, createReviewSchedule, demoSpecialPoster, restoreScheduleDay, updateSpecialPoster, daysInMonth, defaultPosterSettings, demoRules, demoSpeakers, lectureMonths, lectureSessionTypes, lectureWeekdays, monthKey, updateDay, type MonthSchedule, type RecurringRule, type Session, type SessionType, type Speaker, type PosterImage, type SpecialPoster } from "./model";
import styles from "./generator.module.css";

const tabs = [{ id: "calendar", label: "Kalendar" }, { id: "speakers", label: "Penceramah" }, { id: "rules", label: "Aturan Berulang" }, { id: "settings", label: "Tetapan" }] as const;
type Tab = typeof tabs[number]["id"];
function Field({ label, children }: { label: string; children: ReactNode }) { return <label className={styles.field}><span>{label}</span>{children}</label>; }
function SessionOptions() { return lectureSessionTypes.map(({ title, value }) => <option key={value} value={value}>{title}</option>); }
function SpeakerOptions({ speakers, selected }: { speakers: Speaker[]; selected: string }) {
  return <><option value="">Tanpa penceramah / bacaan bersama</option>{speakers.filter((speaker) => speaker.isActive || speaker.id === selected).map((speaker) => <option key={speaker.id} value={speaker.id}>{speaker.name}{speaker.isActive ? "" : " (tidak aktif)"}</option>)}</>;
}

export function LectureGeneratorTool() {
  const [tab, setTab] = useState<Tab>("calendar");
  const [speakers, setSpeakers] = useState<Speaker[]>(demoSpeakers);
  const [rules, setRules] = useState<RecurringRule[]>(demoRules);
  const [schedules, setSchedules] = useState<Record<string, MonthSchedule>>(() => ({ "2026-10": createReviewSchedule() }));
  const [currentKey, setCurrentKey] = useState("2026-10");
  const [selectedDay, setSelectedDay] = useState(24);
  const [dayMode, setDayMode] = useState<"sessions" | "poster">("poster");
  const [posterLibrary, setPosterLibrary] = useState<PosterImage[]>([demoSpecialPoster.image]);
  const [loadingPoster, setLoadingPoster] = useState(false);
  const [restoreRequested, setRestoreRequested] = useState(false);
  const selectionRef = useRef({ key: "2026-10", day: 24 });
  const [settings, setSettings] = useState(defaultPosterSettings);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const schedule = schedules[currentKey];
  const infaq = infaqPlacement(posterCellRects(schedule.year, schedule.month, settings.compactCalendar ?? true));
  const infaqStatus = settings.showInfaq === false ? "Ruang infaq dimatikan." : !settings.generalDonationQr ? "QR umum masjid belum tersedia; tiada panel dipaparkan." : infaq.panel ? `Ruang infaq di ${infaq.panel.edge === "leading" ? "awal" : "akhir"} bulan (${infaq.panel.cell.span} petak tanpa tarikh).` : "Ruang infaq tidak dipaparkan: tiada kumpulan sekurang-kurangnya 2 petak tanpa tarikh.";
  const entry = schedule.entries.find(({ day }) => day === selectedDay);
  const sessions = entry?.sessions || [];
  const totalSessions = schedule.entries.reduce((sum, day) => sum + day.sessions.length, 0);

  function changeMonth(year: number, month: number) {
    try {
      const key = monthKey(year, month);
      if (!schedules[key]) setSchedules((previous) => ({ ...previous, [key]: { year, month, entries: applyRecurringRules(year, month, rules) } }));
      selectionRef.current = { key, day: 1 };
      setCurrentKey(key); setSelectedDay(1); setDayMode(schedules[key]?.entries.find((entry) => entry.day === 1)?.specialPoster ? "poster" : "sessions"); setRestoreRequested(false); setMessage("");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Bulan tidak dapat dijana."); }
  }
  function setCurrentSchedule(value: MonthSchedule) { setSchedules((previous) => ({ ...previous, [currentKey]: value })); }
  function changeSessions(value: Session[]) { setCurrentSchedule(updateDay(schedule, selectedDay, value)); setMessage(""); }
  function patchSession(id: string, patch: Partial<Session>) { changeSessions(sessions.map((session) => session.id === id ? { ...session, ...patch, sourceRuleId: undefined } : session)); }
  function patchRule(id: string, patch: Partial<RecurringRule>) { setRules((previous) => previous.map((rule) => rule.id === id ? { ...rule, ...patch } : rule)); }
  function selectDay(day: number) {
    selectionRef.current = { key: currentKey, day };
    setSelectedDay(day); setTab("calendar"); setDayMode(schedule.entries.find((entry) => entry.day === day)?.specialPoster ? "poster" : "sessions");
    setRestoreRequested(false); setMessage("");
  }
  function changePoster(value?: SpecialPoster) {
    try { setCurrentSchedule(updateSpecialPoster(schedule, selectedDay, value)); setMessage(""); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Poster tidak dapat dikemas kini."); }
  }
  async function importLocalPoster(file: File) {
    const target = { ...selectionRef.current };
    setLoadingPoster(true); setMessage("");
    try {
      const image = await readLocalPoster(file);
      setPosterLibrary((previous) => previous.some((item) => item.localHash === image.localHash) ? previous : [...previous, image]);
      if (selectionRef.current.key !== target.key || selectionRef.current.day !== target.day) {
        setMessage("Gambar tersedia dalam senarai poster. Pilih tarikh dan gunakan gambar tersebut."); return;
      }
      // Read the current month's state in the updater: async file reads never replace newer edits.
      setSchedules((previous) => ({ ...previous, [target.key]: updateSpecialPoster(previous[target.key], target.day, { image, mode: "full", fit: "cover", position: "center" }) }));
    } catch (error) { setMessage(error instanceof Error ? error.message : "Gambar tidak dapat dibuka."); }
    finally { setLoadingPoster(false); }
  }
  function applyRules() {
    try {
      setCurrentSchedule({ ...schedule, entries: applyRecurringRules(schedule.year, schedule.month, rules, schedule.entries) });
      setMessage("Aturan diterapkan. Semua override manual, termasuk poster khas, dikekalkan.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Aturan tidak dapat diterapkan."); }
  }
  function restoreSelectedDay() {
    try {
      setCurrentSchedule(restoreScheduleDay(schedule, selectedDay, rules));
      setDayMode("sessions"); setRestoreRequested(false); setMessage("Tarikh ini kembali mengikut aturan. Tarikh lain tidak berubah.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Tarikh tidak dapat dipulihkan."); }
  }
  function patchSpeaker(id: string, patch: Partial<Speaker>) { setSpeakers((previous) => previous.map((speaker) => speaker.id === id ? { ...speaker, ...patch } : speaker)); }
  async function download(format: "png" | "pdf") {
    if (!svgRef.current || busy) return;
    setBusy(true); setMessage("");
    try { await exportPoster(svgRef.current, format, `jadual-kuliah-${currentKey}`, settings.paper); setMessage(`${format.toUpperCase()} prototype dimuat turun. Bukan untuk edaran rasmi.`); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Download gagal. Cuba semula."); }
    finally { setBusy(false); }
  }

  return <div className={styles.root}>
    <header className={styles.header}>
      <div><p className={styles.eyebrow}>MASJID TALHAH BIN UBAIDILLAH</p><h1>Penjana Jadual Kuliah</h1><p className={styles.subtitle}>Susun jadual bulanan dan semak poster secara langsung.</p></div>
      <span className={styles.demoBadge}>Prototype · Data contoh</span>
    </header>
    <div className={styles.notice}><strong>Ruang demo sahaja.</strong> Perubahan berada dalam memori dan hilang apabila tool dimuat semula. Tiada data disimpan atau dipublish ke Sanity.</div>
    <div className={styles.toolbar}>
      <div className={styles.period}>
        <Field label="Bulan"><select value={schedule.month} onChange={(event) => changeMonth(schedule.year, Number(event.target.value))}>{lectureMonths.map((label, index) => <option key={label} value={index + 1}>{label}</option>)}</select></Field>
        <Field label="Tahun"><select value={schedule.year} onChange={(event) => changeMonth(Number(event.target.value), schedule.month)}>{Array.from({ length: 81 }, (_, index) => <option key={2020 + index}>{2020 + index}</option>)}</select></Field>
      </div>
      <div className={styles.stats}><strong>{totalSessions}</strong> sesi tersimpan <span>·</span> <strong>{schedule.entries.filter(({ isManualOverride }) => isManualOverride).length}</strong> tarikh manual</div>
      <div className={styles.exports}><button type="button" disabled={busy} onClick={() => download("png")}>{busy ? "Menyediakan…" : "Download PNG"}</button><button type="button" disabled={busy} onClick={() => download("pdf")}>Download PDF</button><button type="button" disabled aria-describedby="lecture-publish-note">Save Draft (prototype)</button><button type="button" className={styles.publish} disabled aria-describedby="lecture-publish-note">Publish Jadual</button></div>
    </div>
    <p id="lecture-publish-note" className={styles.publishNote}>Save Draft dan Publish dilumpuhkan untuk prototype. Export asas PNG / PDF tersedia dengan label data contoh.</p>
    {message && <p className={styles.message} role="status">{message}</p>}
    <div className={styles.workspace}>
      <section className={styles.preview} aria-labelledby="poster-preview-title">
        <div className={styles.previewHeading}><div><p className={styles.eyebrow}>PREVIEW LANGSUNG</p><h2 id="poster-preview-title">Poster {lectureMonths[schedule.month - 1]} {schedule.year}</h2></div><span className={styles.liveDot}>Live</span></div>
        <InteractiveLecturePoster schedule={schedule} speakers={speakers} settings={settings} selectedDay={selectedDay} onSelectDay={selectDay}/>
        <p className={styles.hint} data-infaq-status="true">{infaqStatus}</p>
        <div className={styles.legend}>{lectureSessionTypes.map(({ value, title }) => <span key={value}><i style={{ background: settings.colours[value as SessionType] }}/>{title}</span>)}</div>
        <p className={styles.hint}>Klik atau tekan Enter/Space pada petak tarikh untuk menyunting. Pada skrin kecil, petak editing lebih tinggi untuk sentuhan; PNG/PDF mengekalkan komposisi poster asal. Teks dilaras mengikut ruang; amaran dipaparkan jika terlalu panjang untuk export. Foto dan jadual ialah contoh untuk review.</p>
        <div className={styles.future}><strong>Aliran penerbitan akan datang</strong><p>Edit → Preview → Simpan draft → Publish → halaman kuliah & poster.</p><span>Prototype ini berhenti pada edit, preview dan download demo.</span></div>
      </section>
      <section className={styles.editor} aria-label="Editor jadual prototype">
        <div className={styles.tabs} aria-label="Panel editor">{tabs.map(({ id, label }) => <button type="button" key={id} aria-pressed={tab === id} onClick={() => setTab(id)}>{label}</button>)}</div>
        <div className={styles.editorBody}>
          {tab === "calendar" && <>
            <div className={styles.panelHeading}><h2>Editor tarikh dipilih</h2><span>{lectureMonths[schedule.month - 1]} {schedule.year}</span></div>
            <p className={styles.hint}>Klik petak pada poster untuk mengubah tarikh. Maksimum dua sesi sehari.</p>
            <details className={styles.secondaryDate}><summary>Pilih tarikh melalui senarai</summary>
              <Field label="Tarikh (pilihan tambahan)"><select value={selectedDay} onChange={(event) => selectDay(Number(event.target.value))}>{Array.from({ length: daysInMonth(schedule.year, schedule.month) }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1} hb</option>)}</select></Field>
            </details>
            <div className={styles.dayHeading} id="lecture-selected-day"><h3>Dipilih: {selectedDay} hb</h3><span>{entry?.isManualOverride ? "Manual" : "Mengikut aturan"}</span></div>
            <div className={styles.dayModes}>
              <button type="button" aria-pressed={dayMode === "sessions"} onClick={() => setDayMode("sessions")}>Kuliah / sesi</button>
              <button type="button" aria-pressed={dayMode === "poster"} onClick={() => setDayMode("poster")}>{entry?.specialPoster ? "Poster program khas" : "Tambah poster program khas"}</button>
            </div>
            {entry?.specialPoster && <p className={styles.notice}>{sessions.length} sesi tersimpan; tidak dipaparkan selagi poster penuh aktif. Buang poster untuk melihatnya semula. Tarikh kekal manual sehingga dipulihkan ke aturan.</p>}
            {dayMode === "poster" && <>
              <p className={styles.hint}>Poster mengambil alih seluruh petak tanpa padding. Badge tarikh berada di atas imej; semak teks penting di bawah badge.</p>
              <Field label="Pilih poster"><select value={entry?.specialPoster ? (entry.specialPoster.image.localHash ?? entry.specialPoster.image.src) : ""} onChange={(event) => { const image = posterLibrary.find((item) => (item.localHash ?? item.src) === event.target.value); if (image) changePoster({ image, fit: "cover", position: "center", mode: "full" }); }}>
                <option value="">Pilih gambar yang tersedia</option>{posterLibrary.map((image, index) => <option key={image.localHash ?? image.src} value={image.localHash ?? image.src}>{index === 0 ? "Poster program contoh (QA 24 / 25)" : image.alt}</option>)}
              </select></Field>
              <Field label="Pilih gambar setempat (demo)"><input type="file" accept="image/png,image/jpeg,image/webp" disabled={loadingPoster} onChange={(event) => { const file = event.target.files?.[0]; if (file) void importLocalPoster(file); event.target.value = ""; }}/></Field>
              <p className={styles.hint}>{loadingPoster ? "Membaca gambar…" : "Fail asal digunakan tanpa crop atau upload. Pilih poster yang sama pada tarikh lain melalui senarai di atas."}</p>
              {entry?.specialPoster && <>
                {/* Original local raster artwork; never sent to a production asset API. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className={styles.localArtwork} src={entry.specialPoster.image.src} alt={entry.specialPoster.image.alt}/>
                <Field label="Teks alternatif poster"><input maxLength={300} value={entry.specialPoster.image.alt} onChange={(event) => changePoster({ ...entry.specialPoster!, image: { ...entry.specialPoster!.image, alt: event.target.value } })}/></Field>
                <Field label="Paparan poster"><select value={entry.specialPoster.fit} onChange={(event) => changePoster({ ...entry.specialPoster!, fit: event.target.value as "contain" | "cover" })}><option value="cover">Penuhi kotak (cover)</option><option value="contain">Paparkan keseluruhan poster (contain)</option></select></Field>
                {entry.specialPoster.fit === "cover" && <><Field label="Posisi poster"><select value={entry.specialPoster.position ?? "center"} onChange={(event) => changePoster({ ...entry.specialPoster!, position: event.target.value as "top" | "center" | "bottom" })}><option value="top">Atas</option><option value="center">Tengah</option><option value="bottom">Bawah</option></select></Field><p className={styles.notice}>Cover boleh memotong teks pada tepi artwork. Laraskan posisi atau pilih Paparkan keseluruhan poster (contain) untuk mengekalkan semua tepi imej. Fail asal tidak diubah.</p></>}
                <button type="button" onClick={() => { changePoster(); setDayMode("sessions"); setMessage("Poster dibuang. Sesi tersimpan dipaparkan semula; tarikh kekal manual."); }}>Buang poster sahaja</button>
              </>}
            </>}
            {dayMode === "sessions" && <>
            {!sessions.length && <p className={styles.empty}>Tiada sesi pada tarikh ini.</p>}
            {sessions.map((session, index) => <fieldset key={session.id} className={styles.session}><legend>Sesi {index + 1}</legend>
              <Field label="Jenis sesi"><select value={session.sessionType} onChange={(event) => patchSession(session.id, { sessionType: event.target.value as SessionType })}><SessionOptions /></select></Field>
              <Field label="Penceramah"><select value={session.speakerId} onChange={(event) => patchSession(session.id, { speakerId: event.target.value, speakerName: undefined, photo: undefined, topic: speakers.find(({ id }) => id === event.target.value)?.defaultTopic || session.topic })}><SpeakerOptions speakers={speakers} selected={session.speakerId} /></select></Field>
              <Field label="Tajuk / kitab"><input maxLength={160} value={session.topic} onChange={(event) => patchSession(session.id, { topic: event.target.value })}/></Field>
              <button type="button" className={styles.textButton} onClick={() => changeSessions(sessions.filter(({ id }) => id !== session.id))}>Buang sesi {index + 1}</button>
            </fieldset>)}
            <div className={styles.actions}><button type="button" disabled={sessions.length >= 2} onClick={() => changeSessions([...sessions, { id: crypto.randomUUID(), sessionType: "maghrib", speakerId: "", topic: "Tajuk contoh" }])}>Tambah sesi {sessions.length >= 2 ? "(maks. 2)" : ""}</button></div>
            {!!sessions.length && <button type="button" className={styles.textButton} onClick={() => changeSessions([])}>{entry?.specialPoster ? "Kosongkan sesi tersimpan" : "Kosongkan tarikh ini"}</button>}
            </>}
            {entry?.isManualOverride && <button type="button" className={styles.textButton} onClick={() => setRestoreRequested(true)}>Kembali ke aturan</button>}
            {restoreRequested && <div className={styles.restoreConfirm} role="group" aria-label="Sahkan pulihkan tarikh"><p>Pulihkan {selectedDay} hb? Poster dan suntingan tarikh ini diganti dengan aturan terkini. Tarikh lain tidak berubah.</p><div className={styles.actions}><button type="button" onClick={restoreSelectedDay}>Pulihkan tarikh ini</button><button type="button" onClick={() => setRestoreRequested(false)}>Batal</button></div></div>}
          </>}
          {tab === "speakers" && <>
            <div className={styles.panelHeading}><h2>Penceramah</h2><span>{speakers.length} contoh</span></div><p className={styles.hint}>Nama dikemas kini terus pada poster. Foto rujukan digunakan untuk demo visual sahaja; jadual ini rekaan. Tiada upload dalam prototype.</p>
            {speakers.map((speaker, index) => <fieldset key={speaker.id} className={styles.session}><legend>Penceramah {index + 1}</legend>
              <div className={styles.speakerTitle}><span className={styles.avatar} aria-hidden="true">{index + 1}</span><span>Identiti contoh</span></div>
              <Field label={`Nama penceramah ${index + 1}`}><input value={speaker.name} maxLength={160} onChange={(event) => patchSpeaker(speaker.id, { name: event.target.value })}/></Field>
              <Field label={`Tajuk lalai penceramah ${index + 1}`}><input value={speaker.defaultTopic} maxLength={160} onChange={(event) => patchSpeaker(speaker.id, { defaultTopic: event.target.value })}/></Field>
              <label className={styles.check}><input type="checkbox" checked={speaker.isActive} onChange={(event) => patchSpeaker(speaker.id, { isActive: event.target.checked })}/>Aktif untuk pemilihan baharu</label>
            </fieldset>)}
            <button type="button" onClick={() => setSpeakers((previous) => [...previous, { id: crypto.randomUUID(), name: `Penceramah Contoh ${previous.length + 1}`, defaultTopic: "", isActive: true }])}>Tambah penceramah contoh</button>
          </>}
          {tab === "rules" && <>
            <div className={styles.panelHeading}><h2>Aturan Berulang</h2><span>{rules.length} aturan</span></div><p className={styles.hint}>Pilih hari dan minggu. Selepas mengubah aturan, terapkan ke bulan semasa. Override manual kekal.</p>
            {rules.map((rule, index) => <fieldset key={rule.id} className={styles.session}><legend>Aturan {index + 1}</legend>
              <div className={styles.twoFields}><Field label="Hari"><select value={rule.weekday} onChange={(event) => patchRule(rule.id, { weekday: Number(event.target.value) })}>{lectureWeekdays.map((label, day) => <option key={label} value={day}>{label}</option>)}</select></Field><Field label="Minggu"><select value={rule.occurrence} onChange={(event) => patchRule(rule.id, { occurrence: Number(event.target.value) })}>{lectureOccurrences.map((label, occurrence) => <option key={label} value={occurrence}>{label}</option>)}</select></Field></div>
              <Field label="Jenis sesi"><select value={rule.sessionType} onChange={(event) => patchRule(rule.id, { sessionType: event.target.value as SessionType })}><SessionOptions /></select></Field>
              <Field label="Penceramah"><select value={rule.speakerId} onChange={(event) => patchRule(rule.id, { speakerId: event.target.value, topic: speakers.find(({ id }) => id === event.target.value)?.defaultTopic || rule.topic })}><SpeakerOptions speakers={speakers} selected={rule.speakerId} /></select></Field>
              <Field label="Tajuk / kitab"><input value={rule.topic} maxLength={160} onChange={(event) => patchRule(rule.id, { topic: event.target.value })}/></Field>
              <div className={styles.ruleFoot}><label className={styles.check}><input type="checkbox" checked={rule.isActive} onChange={(event) => patchRule(rule.id, { isActive: event.target.checked })}/>Aktif</label><button type="button" className={styles.textButton} onClick={() => setRules((previous) => previous.filter(({ id }) => id !== rule.id))}>Buang aturan {index + 1}</button></div>
            </fieldset>)}
            <div className={styles.actions}><button type="button" onClick={() => setRules((previous) => [...previous, { id: crypto.randomUUID(), weekday: 5, occurrence: 1, sessionType: "jumaat", speakerId: "demo-c", topic: "Adab — contoh", isActive: true }])}>Tambah aturan</button><button type="button" className={styles.primary} onClick={() => applyRules()}>Terapkan ke bulan ini</button></div>
          </>}
          {tab === "settings" && <>
            <div className={styles.panelHeading}><h2>Tetapan poster</h2></div><p className={styles.hint}>Preview dikemas kini terus. Export asas ialah imej raster; bukan export penuh penjana asal.</p>
            <Field label="Tajuk poster"><input value={settings.title} maxLength={28} onChange={(event) => setSettings((previous) => ({ ...previous, title: event.target.value }))}/></Field>
            <Field label="Saiz PDF (landscape)"><select value={settings.paper} onChange={(event) => setSettings((previous) => ({ ...previous, paper: event.target.value as "A4" | "A3" }))}><option>A4</option><option>A3</option></select></Field>
            <label className={styles.check}><input type="checkbox" checked={settings.compactCalendar ?? true} onChange={(event) => setSettings((previous) => ({ ...previous, compactCalendar: event.target.checked }))}/>Susunan kalendar padat</label>
            <label className={styles.check}><input type="checkbox" checked={settings.showInfaq !== false} onChange={(event) => setSettings((previous) => ({ ...previous, showInfaq: event.target.checked }))}/>Papar ruang infaq</label>
            <p className={styles.hint}>{infaqStatus} Kumpulan terbesar dipilih; jika sama, awal bulan diutamakan. Kandungan dipusatkan dengan lebar maksimum 3 petak. QR umum masjid digunakan tanpa crop; tiada QR Dapur.</p>
            <h3 className={styles.settingsHeading}>Warna sesi</h3>
            {lectureSessionTypes.map(({ value, title }) => <Field key={value} label={title}><div className={styles.colourField}><input type="color" value={settings.colours[value as SessionType]} onChange={(event) => setSettings((previous) => ({ ...previous, colours: { ...previous.colours, [value]: event.target.value } }))}/><span>{settings.colours[value as SessionType]}</span></div></Field>)}
            <p className={styles.hint}>Identiti masjid dan pattern rasmi dikekalkan. Gambar poster setempat hanya untuk demo. Panel infaq menggunakan QR umum setempat untuk review sahaja. Sanity upload, multi-profile dan import belum disediakan.</p>
          </>}
        </div>
      </section>

    </div>
    <div className={styles.exportSnapshot} aria-hidden="true"><LecturePoster schedule={schedule} speakers={speakers} settings={settings} svgRef={svgRef}/></div>
  </div>;
}
