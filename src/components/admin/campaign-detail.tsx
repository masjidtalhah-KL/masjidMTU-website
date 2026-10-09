"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { campaignEditor, campaignTypeCatalog } from "@/lib/campaigns/admin-registry";
import { campaignDetail, campaignAuditView, lifecycleActionSets, type CampaignView } from "@/lib/campaigns/management-contract";
import { actionLabels, auditLabels, campaignTime, conflictMessage, lifecycleWarning, statusLabels } from "@/lib/campaigns/admin-presentation";
import type { LifecycleAction } from "@/lib/campaigns/lifecycle-contract";
import { CampaignCoreForm, CampaignScheduleForm } from "./campaign-forms";
export function CampaignPanel({ initial }: { initial: CampaignView }) {
  const [view, setView] = useState(initial), [busy, setBusy] = useState(false), [blocked, setBlocked] = useState(false);
  const [message, setMessage] = useState(""), [pending, setPending] = useState<LifecycleAction | null>(null);
  const lock = useRef(false), dialog = useRef<HTMLDialogElement>(null);
  const c = view.campaign, editor = campaignEditor(view.catalog, c.type_key, c.config_version, c.configuration);
  const disabled = busy || blocked || !view.recentMfa;
  async function load() {
    const response = await fetch(`/admin/api/campaigns/${c.id}`, { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) window.location.replace("/admin/login?state=denied");
      throw Error("unavailable");
    }
    const campaign = campaignDetail(data.campaign);
    if (!campaign || campaign.id !== c.id || typeof data.canManage !== "boolean" || typeof data.recentMfa !== "boolean") throw Error("unavailable");
    const next = { campaign, catalog: campaignTypeCatalog(data.catalog), canManage: data.canManage, recentMfa: data.recentMfa,
      audit: data.canManage ? campaignAuditView(data.audit) : null };
    setView(next);
  }
  async function reload() {
    if (lock.current) return; lock.current = true; setBusy(true);
    try { await load(); setBlocked(false); setMessage("Data terkini dimuatkan. Input borang belum disimpan dikekalkan; semak sebelum menghantar semula."); }
    catch { setBlocked(true); setMessage("Data operasi tidak tersedia. Cuba muat semula apabila sambungan pulih."); }
    finally { lock.current = false; setBusy(false); }
  }
  async function mutate(kind: "core" | "schedule" | "lifecycle", payload: unknown) {
    if (lock.current || disabled || !view.canManage) return; lock.current = true; setBusy(true); setMessage("");
    try {
      const url = `/admin/api/campaigns/${c.id}` + (kind === "core" ? "" : `/${kind}`);
      const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok) {
        if (response.status === 409) { setBlocked(true); setMessage(conflictMessage); }
        else if (response.status === 403 && ["step-up", "mfa"].includes(result.error)) { setView(v => ({ ...v, recentMfa: false })); setMessage("Sahkan authenticator semula sebelum membuat perubahan."); }
        else if (response.status === 401 || response.status === 403) window.location.replace("/admin/login?state=denied");
        else if (response.status === 422) setMessage("Maklumat, tindakan atau waktu tidak sah untuk keadaan kempen semasa. Semak borang dan jadual.");
        else { setBlocked(true); setMessage("Operasi tidak tersedia. Muat semula data sebelum cuba lagi."); }
        return;
      }
      await load(); setMessage("Perubahan disahkan. Status dan versi terkini dipaparkan.");
    } catch { setBlocked(true); setMessage("Hasil belum dapat disahkan. Muat semula data terkini; tindakan tidak diulang secara automatik."); }
    finally { lock.current = false; setBusy(false); }
  }
  function ask(action: LifecycleAction) { if (disabled) return; setPending(action); dialog.current?.showModal(); }
  return <div className="admin-stack" aria-busy={busy}>
    <Link href="/admin/campaigns" prefetch={false}>← Senarai kempen</Link>
    <section className="admin-card"><h2>Ringkasan</h2><p><span className="campaign-status">{statusLabels[c.status]}</span> · Versi {c.version}</p>
      <dl><dt>Jenis</dt><dd>{c.type_key} · Konfigurasi v{c.config_version}</dd><dt>Tajuk</dt><dd>{c.title}</dd><dt>Slug</dt><dd>{c.slug} · {c.slug_editable ? "Boleh diedit dalam draf" : "Dikunci secara kekal"}</dd>
        <dt>Visibility</dt><dd>{c.visibility}</dd><dt>Paparan dijadualkan</dt><dd>{c.scheduled_public_display ? "Diizinkan" : "Tidak diizinkan"}</dd><dt>Sejarah arkib</dt><dd>{c.archived_history_display ? "Diizinkan" : "Tidak diizinkan"}</dd>
        <dt>Dikemas kini</dt><dd>{campaignTime(c.updated_at)}</dd></dl>
      {!view.canManage && <p>Akses staff: baca sahaja.</p>}</section>
    <div className="campaign-feedback"><p id="campaign-message" role="status" aria-live="polite">{message}</p>
      <button className="admin-button admin-button-secondary" disabled={busy} onClick={() => void reload()}>Muat semula data terkini</button>
      {view.canManage && !view.recentMfa && <p><Link href={`/admin/mfa?next=/admin/campaigns/${c.id}`} prefetch={false}>Sahkan authenticator semula</Link> sebelum membuat perubahan.</p>}</div>
    <section className="admin-card"><h2>Maklumat asas / konfigurasi jenis</h2>
      {view.canManage && editor ? <CampaignCoreForm campaign={c} adapter={editor} disabled={disabled} submit={mutate} /> :
        <p>{editor ? "Maklumat asas dan konfigurasi hanya boleh diubah oleh pengurus kempen." : "Editor jenis kempen tidak tersedia"}. Konfigurasi asal kekal disimpan; tiada editor JSON generik.</p>}
      <p className="admin-muted">Hubungan editorial: {c.editorial_binding ? "Ada binding sedia ada (baca sahaja)." : "Belum dipautkan."} Kawalan pautan editorial belum tersedia.</p>
    </section>
    <section className="admin-card"><h2>Jadual</h2><dl><dt>Pendaftaran dibuka</dt><dd>{campaignTime(c.registration_opens_at)}</dd><dt>Pendaftaran ditutup</dt><dd>{campaignTime(c.registration_closes_at)}</dd>
      <dt>Acara bermula</dt><dd>{campaignTime(c.event_starts_at)}</dd><dt>Acara tamat</dt><dd>{campaignTime(c.event_ends_at)}</dd></dl>
      {view.canManage && !["closed", "archived"].includes(c.status) ? <CampaignScheduleForm campaign={c} disabled={disabled} submit={mutate} /> : <p>Jadual baca sahaja.</p>}
    </section>
    <section className="admin-card"><h2>Status / tindakan lifecycle</h2><p>Status disahkan oleh database; waktu browser bukan autoriti. Flag tidak mengubah lifecycle.</p>
      {view.canManage ? <div className="admin-row-actions">{lifecycleActionSets[c.status].map(action => <button key={action} disabled={disabled} onClick={() => ask(action)}>{actionLabels[action]}</button>)}
        {c.status === "archived" && <p>Arkib ialah status akhir. Tiada tindakan lifecycle tersedia.</p>}</div> : <p>Tindakan lifecycle tidak tersedia untuk staff.</p>}
    </section>
    {view.audit !== null && <section className="admin-card"><h2>Sejarah aktiviti</h2>{view.audit.length ? <ol className="admin-audit">{view.audit.map(a => <li key={a.id}>
      <strong>{auditLabels[a.action]}</strong><time dateTime={a.occurred_at}>{campaignTime(a.occurred_at)}</time><span>{a.actor_category === "scheduler" ? "Scheduler" : "Pengurus kempen"} · Versi {a.expected_version} → {a.resulting_version}</span>
    </li>)}</ol> : <p>Belum ada aktiviti kempen.</p>}</section>}
    <dialog className="admin-drawer campaign-confirm" ref={dialog} aria-labelledby="campaign-confirm-title" aria-describedby="campaign-confirm-note" onClose={() => setPending(null)}>
      <h2 id="campaign-confirm-title">{pending ? actionLabels[pending] : "Sahkan tindakan"}</h2><p id="campaign-confirm-note">{pending ? lifecycleWarning(pending, c.status) : ""}</p>
      <div className="admin-row-actions"><button onClick={() => dialog.current?.close()}>Batal</button><button disabled={disabled || !pending} onClick={() => {
        const action = pending; dialog.current?.close(); if (action) void mutate("lifecycle", { action, expectedVersion: c.version });
      }}>Sahkan tindakan</button></div>
    </dialog>
  </div>;
}
