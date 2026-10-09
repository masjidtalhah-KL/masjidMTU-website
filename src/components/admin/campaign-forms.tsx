"use client";
import { useState, type FormEvent } from "react";
import type { CampaignAdminAdapter } from "@/lib/campaigns/admin-registry";
import type { CampaignDetail } from "@/lib/campaigns/management-contract";
import { localCampaignTime, scheduleFormWindows } from "@/lib/campaigns/admin-presentation";
import type { Windows } from "@/lib/campaigns/lifecycle-contract";
type Submit = (kind: "core" | "schedule", value: unknown) => Promise<void>;
export function CampaignCoreForm({ campaign, adapter, disabled, submit }: { campaign: CampaignDetail; adapter: CampaignAdminAdapter; disabled: boolean; submit: Submit }) {
  const [configuration, setConfiguration] = useState(() => adapter.parseConfiguration(campaign.configuration)!);
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const f = new FormData(event.currentTarget);
    void submit("core", { expectedVersion: campaign.version, title: f.get("title"), slug: f.get("slug"),
      visibility: f.get("visibility"), scheduled_public_display: f.has("scheduled_public_display"), archived_history_display: f.has("archived_history_display"),
      config_version: campaign.config_version, configuration });
  }
  return <form className="campaign-form" onSubmit={save} aria-describedby="campaign-message"><fieldset disabled={disabled}>
    <label htmlFor="campaign-title">Tajuk<input id="campaign-title" name="title" defaultValue={campaign.title} maxLength={160} required /></label>
    <label htmlFor="campaign-slug">Slug<input id="campaign-slug" name="slug" defaultValue={campaign.slug} minLength={3} maxLength={100} required readOnly={!campaign.slug_editable} /></label>
    <label htmlFor="campaign-visibility">Visibility<select id="campaign-visibility" name="visibility" defaultValue={campaign.visibility}>
      <option value="private">Private</option><option value="public">Public</option><option value="unlisted">Unlisted</option></select></label>
    <label className="campaign-check"><input type="checkbox" name="scheduled_public_display" defaultChecked={campaign.scheduled_public_display} />Izinkan paparan sebelum pendaftaran dibuka</label>
    <label className="campaign-check"><input type="checkbox" name="archived_history_display" defaultChecked={campaign.archived_history_display} />Izinkan sejarah selepas arkib</label>
    <h3>Konfigurasi jenis</h3><adapter.ConfigurationForm value={configuration} onChange={setConfiguration} disabled={disabled} />
    <button className="admin-button">Simpan maklumat asas</button>
  </fieldset></form>;
}
const windows: { key: keyof Windows; label: string; group: "registration" | "event" }[] = [
  { key: "registration_opens_at", label: "Pendaftaran dibuka", group: "registration" }, { key: "registration_closes_at", label: "Pendaftaran ditutup", group: "registration" },
  { key: "event_starts_at", label: "Acara bermula", group: "event" }, { key: "event_ends_at", label: "Acara tamat", group: "event" },
];
export function CampaignScheduleForm({ campaign, disabled, submit }: { campaign: CampaignDetail; disabled: boolean; submit: Submit }) {
  const [invalid, setInvalid] = useState("");
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setInvalid(""); const f = new FormData(event.currentTarget);
    try {
      const input = Object.fromEntries(windows.map(({ key }) => [key, String(f.get(key) ?? "")])) as Record<keyof Windows, string>;
      void submit("schedule", { expectedVersion: campaign.version, ...scheduleFormWindows(input, campaign) });
    } catch { setInvalid("Tarikh tidak sah. Gunakan waktu Malaysia dan semak tarikh sebenar."); }
  }
  return <form className="campaign-form" onSubmit={save} aria-describedby="campaign-message campaign-schedule-note campaign-date-error">
    <p id="campaign-schedule-note">Semua waktu ialah Malaysia (Asia/Kuala_Lumpur, MYT UTC+08:00). Kosongkan untuk tiada tarikh.
      Deadline tutup yang sudah tamat akan menutup kempen dahulu; jadual cadangan tidak disimpan. Kempen ditutup tidak boleh diselamatkan dengan extension.</p>
    {["registration", "event"].map(group => <fieldset key={group} disabled={disabled}><legend>{group === "registration" ? "Waktu pendaftaran" : "Waktu acara"}</legend>
      {windows.filter(w => w.group === group).map(({ key, label }) => <label key={key} htmlFor={`campaign-${key}`}>{label}
        <input id={`campaign-${key}`} name={key} type="datetime-local" step="1" defaultValue={localCampaignTime(campaign[key])}
          readOnly={key === "registration_opens_at" && ["open", "paused"].includes(campaign.status)} aria-describedby="campaign-date-error" />
      </label>)}</fieldset>)}
    <p id="campaign-date-error" role="alert">{invalid}</p><button className="admin-button" disabled={disabled}>Simpan jadual</button>
  </form>;
}
