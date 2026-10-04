"use client";

import { useRef, useState, type ReactNode } from "react";

import { LecturePoster } from "./LecturePoster";
import { InteractiveLecturePoster } from "./InteractiveLecturePoster";
import { infaqPlacement, posterCellRects } from "./poster-layout";
import { readLocalPoster } from "./local-poster";
import { exportPoster } from "./export-poster";
import { applyRecurringRules, createReviewSchedule, demoSpecialPoster, restoreScheduleDay, updateSpecialPoster, daysInMonth, defaultPosterSettings, demoRules, demoSpeakers, lectureMonths, lectureSessionTypes, monthKey, updateDay, type MonthSchedule, type RecurringRule, type Session, type SessionType, type Speaker, type PosterImage, type SpecialPoster } from "./model";
import styles from "./generator.module.css";
import { useDraftWorkflow } from "./useDraftWorkflow";
import type { DraftAdapter, LoadedMonth } from "./draft-persistence";
import { lectureEditorMonths as editorMonths, lectureEditorWeekdays as editorWeekdays, lectureEditorOccurrences as editorOccurrences } from "../../lecture-types";

const tabs = [{ id: "calendar", label: "Calendar" }, { id: "speakers", label: "Penceramah" }, { id: "rules", label: "Recurring Rules" }, { id: "settings", label: "Settings" }] as const;
type Tab = typeof tabs[number]["id"];
function Field({ label, children }: { label: string; children: ReactNode }) { return <label className={styles.field}><span>{label}</span>{children}</label>; }
function SessionOptions() { return lectureSessionTypes.map(({ title, value }) => <option key={value} value={value}>{title}</option>); }
function SpeakerOptions({ speakers, selected }: { speakers: Speaker[]; selected: string }) {
  return <><option value="">No Penceramah / group recitation</option>{speakers.filter((speaker) => speaker.isActive || speaker.id === selected).map((speaker) => <option key={speaker.id} value={speaker.id}>{speaker.name}{speaker.isActive ? "" : " (inactive)"}</option>)}</>;
}

export function LectureGeneratorTool({ persistence }: { persistence?: DraftAdapter } = {}) {
  const [tab, setTab] = useState<Tab>("calendar");
  const [speakers, setSpeakers] = useState<Speaker[]>(persistence ? [] : demoSpeakers);
  const [rules, setRules] = useState<RecurringRule[]>(persistence ? [] : demoRules);
  const initialPeriod = persistence ? { year: new Date().getFullYear(), month: new Date().getMonth() + 1 } : { year: 2026, month: 10 };
  const initialKey = monthKey(initialPeriod.year, initialPeriod.month);
  const [schedules, setSchedules] = useState<Record<string, MonthSchedule>>(() => ({ [initialKey]: persistence ? { ...initialPeriod, entries: [] } : createReviewSchedule() }));
  const [currentKey, setCurrentKey] = useState(initialKey);
  const [selectedDay, setSelectedDay] = useState(persistence ? 1 : 24);
  const [dayMode, setDayMode] = useState<"sessions" | "poster">(persistence ? "sessions" : "poster");
  const [posterLibrary, setPosterLibrary] = useState<PosterImage[]>(persistence ? [] : [demoSpecialPoster.image]);
  const [loadingPoster, setLoadingPoster] = useState(false);
  const [restoreRequested, setRestoreRequested] = useState(false);
  const selectionRef = useRef({ key: initialKey, day: persistence ? 1 : 24 });
  const [settings, setSettings] = useState(() => persistence ? { ...defaultPosterSettings, generalDonationQr: undefined, reviewMode: "draft" as const, reviewLabel: "DRAFT · BELUM DITERBITKAN · UNTUK REVIEW STUDIO" } : defaultPosterSettings);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const schedule = schedules[currentKey];
  const infaq = infaqPlacement(posterCellRects(schedule.year, schedule.month, settings.compactCalendar ?? true));
  const infaqStatus = settings.showInfaq === false ? "Infaq panel is off." : !settings.generalDonationQr ? "Approved compact Masjid QR is unavailable; Infaq panel omitted." : infaq.panel ? `Infaq panel at the ${infaq.panel.edge === "leading" ? "start" : "end"} of the month (${infaq.panel.cell.span} no-date cells).` : "Infaq panel omitted: no group of at least 2 contiguous no-date cells.";
  const entry = schedule.entries.find(({ day }) => day === selectedDay);
  const sessions = entry?.sessions || [];
  const totalSessions = schedule.entries.reduce((sum, day) => sum + day.sessions.length, 0);

  function activateMonth(year: number, month: number, showInfaq?: boolean) {
    if (showInfaq !== undefined) setSettings(previous => ({ ...previous, showInfaq }));
    try {
      const key = monthKey(year, month);
      if (!schedules[key]) setSchedules((previous) => ({ ...previous, [key]: { year, month, entries: applyRecurringRules(year, month, rules) } }));
      selectionRef.current = { key, day: 1 };
      setCurrentKey(key); setSelectedDay(1); setDayMode(schedules[key]?.entries.find((entry) => entry.day === 1)?.specialPoster ? "poster" : "sessions"); setRestoreRequested(false); setMessage("");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not generate the month."); }
  }
  function receiveMonth(loaded: LoadedMonth) {
    const key = monthKey(loaded.schedule.year, loaded.schedule.month);
    setSchedules(previous => ({ ...previous, [key]: loaded.schedule }));
    setCurrentKey(key); setSpeakers(loaded.speakers); setRules(loaded.rules);
    setSelectedDay(1); setDayMode(loaded.schedule.entries.find(e => e.day === 1)?.specialPoster ? "poster" : "sessions");
    selectionRef.current = { key, day: 1 }; setRestoreRequested(false);
    setSettings(previous => ({ ...previous, showInfaq: loaded.showInfaq, generalDonationQr: loaded.donationQr }));
    setPosterLibrary(previous => { const images = [...previous, ...loaded.schedule.entries.flatMap(e => e.specialPoster ? [e.specialPoster.image] : [])]; return images.filter((image,index) => images.findIndex(other => (other.assetId ?? other.localHash ?? other.src) === (image.assetId ?? image.localHash ?? image.src)) === index); });
  }
  const draft = useDraftWorkflow(persistence, schedule, speakers, settings, receiveMonth, activateMonth);
  function changeMonth(year: number, month: number) { void draft.switchMonth(year, month); }
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
    catch (error) { setMessage(error instanceof Error ? error.message : "Could not update the poster."); }
  }
  async function importLocalPoster(file: File) {
    const target = { ...selectionRef.current };
    setLoadingPoster(true); setMessage("");
    try {
      const image = await readLocalPoster(file);
      setPosterLibrary((previous) => previous.some((item) => item.localHash === image.localHash) ? previous : [...previous, image]);
      if (selectionRef.current.key !== target.key || selectionRef.current.day !== target.day) {
        setMessage("Image added to the poster library. Select a date to use it."); return;
      }
      // Read the current month's state in the updater: async file reads never replace newer edits.
      setSchedules((previous) => ({ ...previous, [target.key]: updateSpecialPoster(previous[target.key], target.day, { image, mode: "full", fit: "cover", position: "center" }) }));
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not open the image."); }
    finally { setLoadingPoster(false); }
  }
  function applyRules() {
    try {
      setCurrentSchedule({ ...schedule, entries: applyRecurringRules(schedule.year, schedule.month, rules, schedule.entries) });
      setMessage("Rules applied. All manual overrides, including special posters, are preserved.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not apply the rules."); }
  }
  function restoreSelectedDay() {
    try {
      setCurrentSchedule(restoreScheduleDay(schedule, selectedDay, rules));
      setDayMode("sessions"); setRestoreRequested(false); setMessage("Selected date restored from rules. Other dates are unchanged.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not restore the date."); }
  }
  function patchSpeaker(id: string, patch: Partial<Speaker>) { setSpeakers((previous) => previous.map((speaker) => speaker.id === id ? { ...speaker, ...patch } : speaker)); }
  async function download(format: "png" | "pdf") {
    if (!svgRef.current || busy) return;
    setBusy(true); setMessage("");
    try { await exportPoster(svgRef.current, format, `jadual-kuliah-${currentKey}`, settings.paper, persistence ? "https://cdn.sanity.io/images/2o95jmms/production/" : undefined); setMessage(`${format.toUpperCase()} review export downloaded. Not for official distribution.`); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Download failed. Please try again."); }
    finally { setBusy(false); }
  }

  return <div className={styles.root}>
    <header className={styles.header}>
      <div><p className={styles.eyebrow}>MASJID TALHAH BIN UBAIDILLAH</p><h1>Jadual Kuliah Generator</h1><p className={styles.subtitle}>Edit the monthly Jadual and review the poster live.</p></div>
      <span className={styles.demoBadge}>{persistence ? "Studio · Draft only" : "Prototype · Demo data"}</span>
    </header>
    <div className={styles.notice}>{persistence ? <><strong>Draft only.</strong> Manual saving through your authenticated Studio session. Save Draft validates and saves only the monthly draft. No autosave. Publish remains disabled.</> : <><strong>Local demo only.</strong> Changes stay in memory and are lost on reload. Nothing is saved or published to Sanity.</>}</div>
    {persistence && <>
      <p className={styles.message} role="status" data-save-state={draft.phase}>{draft.status}</p>
      {draft.state?.loaded.warning && <p className={styles.notice}>{draft.state.loaded.warning}</p>}
      {draft.error && <p className={styles.notice} role="alert">{draft.error}</p>}
      {(draft.phase === "conflict" || draft.phase === "error") && <button type="button" onClick={() => void draft.reloadForReview()}>Reload for review</button>}
      {draft.review && <div className={styles.restoreConfirm}><p>Remote version loaded for review; your local edits are preserved. Using the remote version replaces the editor after keeping a local backup in memory (lost on reload). No automatic merge.</p><details><summary>Remote payload</summary><pre className={styles.payload}>{JSON.stringify(draft.review.base, null, 2)}</pre></details><button type="button" onClick={draft.useRemote}>Use reviewed remote version</button></div>}
      {draft.backup && <details><summary>Local edits before reload (memory backup only)</summary><pre className={styles.payload}>{JSON.stringify(draft.backup, null, 2)}</pre></details>}
      {draft.pending && <div className={styles.restoreConfirm} role="group" aria-label="Unsaved changes"><p>This month has unsaved changes. Switching keeps them in memory until the page is reloaded.</p><button type="button" onClick={() => void draft.switchMonth(draft.pending!.year, draft.pending!.month, true)}>Switch and keep local edits</button><button type="button" onClick={draft.cancelSwitch}>Keep editing this month</button></div>}
      {draft.prepared && <details><summary>Save Draft details</summary><pre className={styles.payload}>{JSON.stringify(draft.prepared.plan, null, 2)}</pre></details>}
    </>}
    <fieldset className={styles.controls} disabled={draft.locked}>
    <div className={styles.toolbar}>
      <div className={styles.period}>
        <Field label="Month"><select value={schedule.month} onChange={(event) => changeMonth(schedule.year, Number(event.target.value))}>{editorMonths.map((label, index) => <option key={label} value={index + 1}>{label}</option>)}</select></Field>
        <Field label="Year"><select value={schedule.year} onChange={(event) => changeMonth(Number(event.target.value), schedule.month)}>{Array.from({ length: 81 }, (_, index) => <option key={2020 + index}>{2020 + index}</option>)}</select></Field>
      </div>
      <div className={styles.stats}><strong>{totalSessions}</strong> sessions {persistence ? "this month" : "in memory"} <span>·</span> <strong>{schedule.entries.filter(({ isManualOverride }) => isManualOverride).length}</strong> manually edited dates</div>
      <div className={styles.exports}><button type="button" disabled={busy} onClick={() => download("png")}>{busy ? "Preparing…" : "Download PNG"}</button><button type="button" disabled={busy} onClick={() => download("pdf")}>Download PDF</button><button type="button" disabled={!persistence || draft.locked || loadingPoster} onClick={() => void draft.save()} aria-describedby="lecture-publish-note">{persistence ? "Save Draft" : "Save Draft (prototype)"}</button><button type="button" className={styles.publish} disabled aria-describedby="lecture-publish-note">Publish Jadual</button></div>
    </div>
    <p id="lecture-publish-note" className={styles.publishNote}>{persistence ? "Save Draft validates the month and saves with revision protection. Unchanged drafts are verified without another write. Publish Jadual is disabled. Draft exports are for review only." : "Save Draft and Publish are disabled in this prototype. PNG / PDF review exports carry a Malay demo label."}</p>
    {message && <p className={styles.message} role="status">{message}</p>}
    <div className={styles.workspace}>
      <section className={styles.preview} aria-labelledby="poster-preview-title">
        <div className={styles.previewHeading}><div><p className={styles.eyebrow}>LIVE PREVIEW</p><h2 id="poster-preview-title">Poster {lectureMonths[schedule.month - 1]} {schedule.year}</h2></div><span className={styles.liveDot}>Live</span></div>
        <InteractiveLecturePoster schedule={schedule} speakers={speakers} settings={settings} selectedDay={selectedDay} onSelectDay={selectDay}/>
        <p className={styles.hint} data-infaq-status="true">{infaqStatus}</p>
        <div className={styles.legend}>{lectureSessionTypes.map(({ value, title }) => <span key={value}><i style={{ background: settings.colours[value as SessionType] }}/>{title}</span>)}</div>
        <p className={styles.hint}>Click a date cell or press Enter/Space to edit. On small screens, editing cells are taller for touch; PNG/PDF retain the print composition. Text fits the available space; overflow produces an export warning. {persistence ? "CMS snapshots remain stable after later profile changes." : "Photos and Jadual entries are demo data for review."}</p>
        <div className={styles.future}><strong>Future publication workflow</strong><p>Edit → Preview → Save Draft → Publish → Kuliah page & poster.</p><span>{persistence ? "Fasa 5.3B stops at drafts; no publication or public Kuliah feed." : "This prototype supports editing, preview and demo downloads only."}</span></div>
      </section>
      <section className={styles.editor} aria-label="Jadual editor">
        <div className={styles.tabs} aria-label="Editor panels">{tabs.map(({ id, label }) => <button type="button" key={id} aria-pressed={tab === id} onClick={() => setTab(id)}>{label}</button>)}</div>
        <div className={styles.editorBody}>
          {tab === "calendar" && <>
            <div className={styles.panelHeading}><h2>Selected date</h2><span>{lectureMonths[schedule.month - 1]} {schedule.year}</span></div>
            <p className={styles.hint}>Select a date on the poster. Maximum two sessions per date.</p>
            <details className={styles.secondaryDate}><summary>Choose date from a list</summary>
              <Field label="Date (secondary control)"><select value={selectedDay} onChange={(event) => selectDay(Number(event.target.value))}>{Array.from({ length: daysInMonth(schedule.year, schedule.month) }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1} hb</option>)}</select></Field>
            </details>
            <div className={styles.dayHeading} id="lecture-selected-day"><h3>Selected date: {selectedDay} hb</h3><span>{entry?.isManualOverride ? "Manual" : "From rules"}</span></div>
            <div className={styles.dayModes}>
              <button type="button" aria-pressed={dayMode === "sessions"} onClick={() => setDayMode("sessions")}>Kuliah / sessions</button>
              <button type="button" aria-pressed={dayMode === "poster"} onClick={() => setDayMode("poster")}>{entry?.specialPoster ? "Special program poster" : "Add special program poster"}</button>
            </div>
            {entry?.specialPoster && <p className={styles.notice}>{sessions.length} sessions preserved but hidden while the full poster is active. Remove the poster to reveal them. The date remains a manual override until explicitly restored from rules.</p>}
            {dayMode === "poster" && <>
              <p className={styles.hint}>The poster fills the entire date cell without padding. The date badge overlays the image; check for important text beneath it.</p>
              <Field label="Choose poster"><select value={entry?.specialPoster ? (entry.specialPoster.image.localHash ?? entry.specialPoster.image.src) : ""} onChange={(event) => { const image = posterLibrary.find((item) => (item.localHash ?? item.src) === event.target.value); if (image) changePoster({ image, fit: "cover", position: "center", mode: "full" }); }}>
                <option value="">Choose an available image</option>{posterLibrary.map((image, index) => <option key={image.localHash ?? image.src} value={image.localHash ?? image.src}>{!persistence && index === 0 ? "Demo program poster (QA 24 / 25)" : image.alt}</option>)}
              </select></Field>
              <Field label={persistence ? "Choose original poster (PNG/JPG/WebP)" : "Local image (demo)"}><input type="file" accept="image/png,image/jpeg,image/webp" disabled={loadingPoster} onChange={(event) => { const file = event.target.files?.[0]; if (file) void importLocalPoster(file); event.target.value = ""; }}/></Field>
              <p className={styles.hint}>{loadingPoster ? "Reading image…" : persistence ? "Original bytes are preserved; upload happens only when you select Save Draft. Reuse the same poster on other dates without duplicate uploads." : "Original file is used without cropping or upload. Choose the same poster for another date from the list above."}</p>
              {entry?.specialPoster && <>
                {/* Original local raster artwork; never sent to a production asset API. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className={styles.localArtwork} src={entry.specialPoster.image.src} alt={entry.specialPoster.image.alt}/>
                <Field label="Poster alt text"><input maxLength={300} value={entry.specialPoster.image.alt} onChange={(event) => changePoster({ ...entry.specialPoster!, image: { ...entry.specialPoster!.image, alt: event.target.value } })}/></Field>
                <Field label="Poster fit"><select value={entry.specialPoster.fit} onChange={(event) => changePoster({ ...entry.specialPoster!, fit: event.target.value as "contain" | "cover" })}><option value="cover">Fill cell (cover)</option><option value="contain">Show entire poster (contain)</option></select></Field>
                {entry.specialPoster.fit === "cover" && <><Field label="Poster position"><select value={entry.specialPoster.position ?? "center"} onChange={(event) => changePoster({ ...entry.specialPoster!, position: event.target.value as "top" | "center" | "bottom" })}><option value="top">Top</option><option value="center">Center</option><option value="bottom">Bottom</option></select></Field><p className={styles.notice}>Cover may crop text at the artwork edges. Adjust the position or choose Show entire poster (contain) to preserve every edge. Original bytes are unchanged.</p></>}
                <button type="button" onClick={() => { changePoster(); setDayMode("sessions"); setMessage("Poster removed. Preserved sessions are visible again; the date remains manual."); }}>Remove poster</button>
              </>}
            </>}
            {dayMode === "sessions" && <>
            {!sessions.length && <p className={styles.empty}>No sessions on this date.</p>}
            {sessions.map((session, index) => <fieldset key={session.id} className={styles.session}><legend>Session {index + 1}</legend>
              <Field label="Session type"><select value={session.sessionType} onChange={(event) => patchSession(session.id, { sessionType: event.target.value as SessionType })}><SessionOptions /></select></Field>
              <Field label="Penceramah"><select value={session.speakerId} onChange={(event) => patchSession(session.id, { speakerId: event.target.value, speakerName: undefined, photo: undefined, topic: speakers.find(({ id }) => id === event.target.value)?.defaultTopic || session.topic })}><SpeakerOptions speakers={speakers} selected={session.speakerId} /></select></Field>
              {persistence && session.speakerName !== undefined && <p className={styles.hint}>Name snapshot: {session.speakerName || "No Penceramah"}{!session.speakerId && session.speakerName ? " · No library reference; snapshot identity is preserved." : ""}</p>}
              <Field label="Title / kitab"><input maxLength={160} value={session.topic} onChange={(event) => patchSession(session.id, { topic: event.target.value })}/></Field>
              <button type="button" className={styles.textButton} onClick={() => changeSessions(sessions.filter(({ id }) => id !== session.id))}>Remove session {index + 1}</button>
            </fieldset>)}
            <div className={styles.actions}><button type="button" disabled={sessions.length >= 2} onClick={() => changeSessions([...sessions, { id: crypto.randomUUID(), sessionType: "maghrib", speakerId: "", topic: persistence ? "" : "Demo topic" }])}>Add session {sessions.length >= 2 ? "(max. 2)" : ""}</button></div>
            {!!sessions.length && <button type="button" className={styles.textButton} onClick={() => changeSessions([])}>{entry?.specialPoster ? "Clear preserved sessions" : "Clear this date"}</button>}
            </>}
            {entry?.isManualOverride && <button type="button" className={styles.textButton} onClick={() => setRestoreRequested(true)}>Restore from rules</button>}
            {restoreRequested && <div className={styles.restoreConfirm} role="group" aria-label="Confirm restore from rules"><p>Restore date {selectedDay}? Its poster and edits will be replaced by the current rules. Other dates are unchanged.</p><div className={styles.actions}><button type="button" onClick={restoreSelectedDay}>Restore this date</button><button type="button" onClick={() => setRestoreRequested(false)}>Cancel</button></div></div>}
          </>}
          {tab === "speakers" && <>
            <div className={styles.panelHeading}><h2>Penceramah</h2><span>{speakers.length} {persistence ? "published" : "demo"}</span></div><p className={styles.hint}>{persistence ? "Published library is read-only. Sessions save name/photo/topic snapshots; later profile changes do not alter the monthly snapshot." : "Names update live on the demo poster. Reference photos and fictional Jadual entries are for visual review only. This prototype does not upload."}</p>
            {speakers.map((speaker, index) => <fieldset key={speaker.id} className={styles.session} disabled={!!persistence}><legend>Penceramah {index + 1}</legend>
              <div className={styles.speakerTitle}><span className={styles.avatar} aria-hidden="true">{index + 1}</span><span>{persistence ? "Published profile" : "Demo identity"}</span></div>
              <Field label={`Penceramah name ${index + 1}`}><input value={speaker.name} maxLength={160} onChange={(event) => patchSpeaker(speaker.id, { name: event.target.value })}/></Field>
              <Field label={`Penceramah default topic ${index + 1}`}><input value={speaker.defaultTopic} maxLength={160} onChange={(event) => patchSpeaker(speaker.id, { defaultTopic: event.target.value })}/></Field>
              <label className={styles.check}><input type="checkbox" checked={speaker.isActive} onChange={(event) => patchSpeaker(speaker.id, { isActive: event.target.checked })}/>Active for new selections</label>
            </fieldset>)}
            <button type="button" disabled={!!persistence} onClick={() => setSpeakers((previous) => [...previous, { id: crypto.randomUUID(), name: `Penceramah Contoh ${previous.length + 1}`, defaultTopic: "", isActive: true }])}>{persistence ? "Add Penceramah (not available)" : "Add demo Penceramah"}</button>
          </>}
          {tab === "rules" && <>
            <div className={styles.panelHeading}><h2>Recurring Rules</h2><span>{rules.length} rules</span></div><p className={styles.hint}>{persistence ? "Published rules are read-only. Apply them to regenerate non-manual dates; saved monthly snapshots do not change automatically when rules change." : "Choose the weekday and occurrence. After editing rules, apply them to the current month. Manual overrides are preserved."}</p>
            {rules.map((rule, index) => <fieldset key={rule.id} className={styles.session} disabled={!!persistence}><legend>Rule {index + 1}</legend>
              <div className={styles.twoFields}><Field label="Weekday"><select value={rule.weekday} onChange={(event) => patchRule(rule.id, { weekday: Number(event.target.value) })}>{editorWeekdays.map((label, day) => <option key={label} value={day}>{label}</option>)}</select></Field><Field label="Occurrence"><select value={rule.occurrence} onChange={(event) => patchRule(rule.id, { occurrence: Number(event.target.value) })}>{editorOccurrences.map((label, occurrence) => <option key={label} value={occurrence}>{label}</option>)}</select></Field></div>
              <Field label="Session type"><select value={rule.sessionType} onChange={(event) => patchRule(rule.id, { sessionType: event.target.value as SessionType })}><SessionOptions /></select></Field>
              <Field label="Penceramah"><select value={rule.speakerId} onChange={(event) => patchRule(rule.id, { speakerId: event.target.value, topic: speakers.find(({ id }) => id === event.target.value)?.defaultTopic || rule.topic })}><SpeakerOptions speakers={speakers} selected={rule.speakerId} /></select></Field>
              <Field label="Title / kitab"><input value={rule.topic} maxLength={160} onChange={(event) => patchRule(rule.id, { topic: event.target.value })}/></Field>
              <div className={styles.ruleFoot}><label className={styles.check}><input type="checkbox" checked={rule.isActive} onChange={(event) => patchRule(rule.id, { isActive: event.target.checked })}/>Active</label><button type="button" className={styles.textButton} onClick={() => setRules((previous) => previous.filter(({ id }) => id !== rule.id))}>Remove rule {index + 1}</button></div>
            </fieldset>)}
            <div className={styles.actions}><button type="button" disabled={!!persistence} onClick={() => setRules((previous) => [...previous, { id: crypto.randomUUID(), weekday: 5, occurrence: 1, sessionType: "jumaat", speakerId: "demo-c", topic: "Adab — contoh", isActive: true }])}>Add rule</button><button type="button" className={styles.primary} disabled={!!persistence && !rules.some(rule => rule.isActive)} onClick={() => applyRules()}>Apply to this month</button></div>
          </>}
          {tab === "settings" && <>
            <div className={styles.panelHeading}><h2>Poster settings</h2></div><p className={styles.hint}>{persistence ? "showInfaq is saved with the month. Title, colours, paper and preview layout are browser-session settings, not monthly CMS fields." : "Preview updates live. PNG/PDF exports use the shared raster poster renderer."}</p>
            <Field label="Poster title"><input value={settings.title} maxLength={28} onChange={(event) => setSettings((previous) => ({ ...previous, title: event.target.value }))}/></Field>
            <Field label="PDF size (landscape)"><select value={settings.paper} onChange={(event) => setSettings((previous) => ({ ...previous, paper: event.target.value as "A4" | "A3" }))}><option>A4</option><option>A3</option></select></Field>
            <label className={styles.check}><input type="checkbox" checked={settings.compactCalendar ?? true} onChange={(event) => setSettings((previous) => ({ ...previous, compactCalendar: event.target.checked }))}/>Compact calendar layout</label>
            <label className={styles.check}><input type="checkbox" checked={settings.showInfaq !== false} onChange={(event) => setSettings((previous) => ({ ...previous, showInfaq: event.target.checked }))}/>Show Infaq panel</label>
            <p className={styles.hint}>{infaqStatus} The largest eligible group wins; ties favour the start of the month. Content is centred and capped at 3-cell width. Only the approved compact Masjid QR is used, without cropping; never the Dapur QR.</p>
            <h3 className={styles.settingsHeading}>Session colours</h3>
            {lectureSessionTypes.map(({ value, title }) => <Field key={value} label={title}><div className={styles.colourField}><input type="color" value={settings.colours[value as SessionType]} onChange={(event) => setSettings((previous) => ({ ...previous, colours: { ...previous.colours, [value]: event.target.value } }))}/><span>{settings.colours[value as SessionType]}</span></div></Field>)}
            <p className={styles.hint}>{persistence ? "Compact QR resolves from published siteSettings.donationInfo.compactQr. If unavailable, the panel is omitted with a warning; no branded artwork fallback or Dapur QR. Original assets are reused by hash." : "Masjid identity and official pattern are preserved. Local posters are for demo review. The Infaq panel uses the approved QR-only local original; no production upload or settings write."}</p>
          </>}
        </div>
      </section>

    </div>
    </fieldset>
    <div className={styles.exportSnapshot} aria-hidden="true"><LecturePoster schedule={schedule} speakers={speakers} settings={settings} svgRef={svgRef}/></div>
  </div>;
}
