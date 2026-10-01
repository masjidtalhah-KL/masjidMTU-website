"use client";

import { useRef, useState, type ReactNode } from "react";
import { lectureOccurrences } from "../../lecture-types";
import { LecturePoster } from "./LecturePoster";
import { exportPoster } from "./export-poster";
import { applyRecurringRules, calendarOffset, createDemoSchedule, daysInMonth, defaultPosterSettings, demoRules, demoSpeakers, lectureMonths, lectureSessionTypes, lectureWeekdays, monthKey, updateDay, type MonthSchedule, type RecurringRule, type Session, type SessionType, type Speaker } from "./model";
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
  const [schedules, setSchedules] = useState<Record<string, MonthSchedule>>(() => ({ "2026-10": createDemoSchedule() }));
  const [currentKey, setCurrentKey] = useState("2026-10");
  const [selectedDay, setSelectedDay] = useState(5);
  const [settings, setSettings] = useState(defaultPosterSettings);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const schedule = schedules[currentKey];
  const entry = schedule.entries.find(({ day }) => day === selectedDay);
  const sessions = entry?.sessions || [];
  const totalSessions = schedule.entries.reduce((sum, day) => sum + day.sessions.length, 0);

  function changeMonth(year: number, month: number) {
    try {
      const key = monthKey(year, month);
      if (!schedules[key]) setSchedules((previous) => ({ ...previous, [key]: { year, month, entries: applyRecurringRules(year, month, rules) } }));
      setCurrentKey(key); setSelectedDay(1); setMessage("");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Bulan tidak dapat dijana."); }
  }
  function setCurrentSchedule(value: MonthSchedule) { setSchedules((previous) => ({ ...previous, [currentKey]: value })); }
  function changeSessions(value: Session[]) { setCurrentSchedule(updateDay(schedule, selectedDay, value)); setMessage(""); }
  function patchSession(id: string, patch: Partial<Session>) { changeSessions(sessions.map((session) => session.id === id ? { ...session, ...patch, sourceRuleId: undefined } : session)); }
  function patchRule(id: string, patch: Partial<RecurringRule>) { setRules((previous) => previous.map((rule) => rule.id === id ? { ...rule, ...patch } : rule)); }
  function applyRules(restoreDay?: number) {
    try {
      const previous = restoreDay ? schedule.entries.filter(({ day }) => day !== restoreDay) : schedule.entries;
      setCurrentSchedule({ ...schedule, entries: applyRecurringRules(schedule.year, schedule.month, rules, previous) });
      setMessage(restoreDay ? "Tarikh ini kembali mengikut aturan." : "Aturan diterapkan. Semua override manual dikekalkan.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Aturan tidak dapat diterapkan."); }
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
      <div className={styles.stats}><strong>{totalSessions}</strong> sesi <span>·</span> <strong>{schedule.entries.filter(({ isManualOverride }) => isManualOverride).length}</strong> tarikh manual</div>
      <div className={styles.exports}><button type="button" disabled={busy} onClick={() => download("png")}>{busy ? "Menyediakan…" : "Download PNG"}</button><button type="button" disabled={busy} onClick={() => download("pdf")}>Download PDF</button><button type="button" className={styles.publish} disabled aria-describedby="lecture-publish-note">Publish Jadual</button></div>
    </div>
    <p id="lecture-publish-note" className={styles.publishNote}>Publish dilumpuhkan untuk prototype. Export asas PNG / PDF tersedia dengan label data contoh.</p>
    {message && <p className={styles.message} role="status">{message}</p>}
    <div className={styles.workspace}>
      <section className={styles.editor} aria-label="Editor jadual prototype">
        <div className={styles.tabs} aria-label="Panel editor">{tabs.map(({ id, label }) => <button type="button" key={id} aria-pressed={tab === id} onClick={() => setTab(id)}>{label}</button>)}</div>
        <div className={styles.editorBody}>
          {tab === "calendar" && <>
            <div className={styles.panelHeading}><h2>Kalendar bulanan</h2><span>{lectureMonths[schedule.month - 1]} {schedule.year}</span></div>
            <p className={styles.hint}>Pilih tarikh untuk mengubah sesi. Maksimum dua sesi sehari.</p>
            <div className={styles.calendar} aria-label="Pilih tarikh jadual">
              {["Is", "Se", "Ra", "Kh", "Ju", "Sa", "Ah"].map((day) => <span key={day} className={styles.weekday}>{day}</span>)}
              {Array.from({ length: calendarOffset(schedule.year, schedule.month) }, (_, index) => <span key={`blank-${index}`} />)}
              {Array.from({ length: daysInMonth(schedule.year, schedule.month) }, (_, index) => {
                const day = index + 1, value = schedule.entries.find((date) => date.day === day);
                return <button type="button" key={day} aria-pressed={selectedDay === day} aria-label={`${day} ${lectureMonths[schedule.month - 1]}, ${value?.sessions.length || 0} sesi${value?.isManualOverride ? ", manual" : ""}`} onClick={() => { setSelectedDay(day); setMessage(""); }}><span>{day}</span><span className={styles.dots}>{value?.sessions.map((session) => <i key={session.id} style={{ background: settings.colours[session.sessionType] }} />)}{value?.isManualOverride && <b aria-hidden="true">·</b>}</span></button>;
              })}
            </div>
            <div className={styles.dayHeading}><h3>{selectedDay} {lectureMonths[schedule.month - 1]}</h3><span>{entry?.isManualOverride ? "Manual" : "Mengikut aturan"}</span></div>
            {!sessions.length && <p className={styles.empty}>Tiada sesi pada tarikh ini.</p>}
            {sessions.map((session, index) => <fieldset key={session.id} className={styles.session}><legend>Sesi {index + 1}</legend>
              <Field label="Jenis sesi"><select value={session.sessionType} onChange={(event) => patchSession(session.id, { sessionType: event.target.value as SessionType })}><SessionOptions /></select></Field>
              <Field label="Penceramah"><select value={session.speakerId} onChange={(event) => patchSession(session.id, { speakerId: event.target.value, topic: speakers.find(({ id }) => id === event.target.value)?.defaultTopic || session.topic })}><SpeakerOptions speakers={speakers} selected={session.speakerId} /></select></Field>
              <Field label="Tajuk / kitab"><input maxLength={160} value={session.topic} onChange={(event) => patchSession(session.id, { topic: event.target.value })}/></Field>
              <button type="button" className={styles.textButton} onClick={() => changeSessions(sessions.filter(({ id }) => id !== session.id))}>Buang sesi {index + 1}</button>
            </fieldset>)}
            <div className={styles.actions}><button type="button" disabled={sessions.length >= 2} onClick={() => changeSessions([...sessions, { id: crypto.randomUUID(), sessionType: "maghrib", speakerId: "", topic: "Tajuk contoh" }])}>Tambah sesi {sessions.length >= 2 ? "(maks. 2)" : ""}</button>{entry?.isManualOverride && <button type="button" onClick={() => applyRules(selectedDay)}>Kembali ke aturan</button>}</div>
            {!!sessions.length && <button type="button" className={styles.textButton} onClick={() => changeSessions([])}>Kosongkan tarikh ini</button>}
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
            <h3 className={styles.settingsHeading}>Warna sesi</h3>
            {lectureSessionTypes.map(({ value, title }) => <Field key={value} label={title}><div className={styles.colourField}><input type="color" value={settings.colours[value as SessionType]} onChange={(event) => setSettings((previous) => ({ ...previous, colours: { ...previous.colours, [value]: event.target.value } }))}/><span>{settings.colours[value as SessionType]}</span></div></Field>)}
            <p className={styles.hint}>Identiti masjid dan pattern rasmi dikekalkan. Upload, QR infaq, multi-profile dan import belum disediakan.</p>
          </>}
        </div>
      </section>
      <section className={styles.preview} aria-labelledby="poster-preview-title">
        <div className={styles.previewHeading}><div><p className={styles.eyebrow}>PREVIEW LANGSUNG</p><h2 id="poster-preview-title">Poster {lectureMonths[schedule.month - 1]} {schedule.year}</h2></div><span className={styles.liveDot}>Live</span></div>
        <div className={styles.posterFrame}><LecturePoster schedule={schedule} speakers={speakers} settings={settings} svgRef={svgRef}/></div>
        <div className={styles.legend}>{lectureSessionTypes.map(({ value, title }) => <span key={value}><i style={{ background: settings.colours[value as SessionType] }}/>{title}</span>)}</div>
        <p className={styles.hint}>Preview memaparkan keseluruhan bulan. Pada skrin kecil, buka PNG/PDF untuk membaca poster pada saiz penuh. Teks dilaras mengikut ruang; amaran dipaparkan jika terlalu panjang untuk export. Foto dan jadual ialah contoh untuk review.</p>
        <div className={styles.future}><strong>Aliran penerbitan akan datang</strong><p>Edit → Preview → Simpan draft → Publish → halaman kuliah & poster.</p><span>Prototype ini berhenti pada edit, preview dan download demo.</span></div>
      </section>
    </div>
  </div>;
}
