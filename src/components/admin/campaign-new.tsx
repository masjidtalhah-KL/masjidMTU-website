"use client";
import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { availableCampaignTypes, type TypeDescriptor } from "@/lib/campaigns/admin-registry";
import { createCampaignCommand } from "@/lib/campaigns/management-contract";
import { campaignId } from "@/lib/campaigns/lifecycle-contract";
export function NewCampaign({ catalog, recentMfa }: { catalog: TypeDescriptor[]; recentMfa: boolean }) {
  const router = useRouter();
  const types = availableCampaignTypes(catalog);
  const [selected, setSelected] = useState(""), [configuration, setConfiguration] = useState(types[0]?.defaults() ?? {});
  const [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  const submitting = useRef(false);
  const adapter = types.find(t => `${t.type_key}:${t.config_version}` === selected);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!adapter || submitting.current || !recentMfa) return;
    submitting.current = true; setBusy(true); setMessage("");
    try {
      const form = new FormData(event.currentTarget);
      const payload = createCampaignCommand({ type_key: adapter.type_key, config_version: adapter.config_version,
        slug: form.get("slug"), title: form.get("title"), configuration }, catalog);
      const response = await fetch("/admin/api/campaigns", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (response.status === 401 || response.status === 403 && !["mfa", "step-up"].includes(result.error)) { window.location.replace("/admin/login?state=denied"); return; }
      if (!response.ok) {
        setMessage(response.status === 409 ? "Slug ini sudah digunakan. Semak slug sebelum cuba lagi." : response.status === 403 ? "Sahkan authenticator semula sebelum mencipta kempen." : response.status === 422 ? "Maklumat kempen tidak sah. Semak borang." : "Operasi tidak tersedia. Semak senarai kempen sebelum cuba lagi."); return;
      }
      router.push(`/admin/campaigns/${campaignId(result.id)}`);
    } catch { setMessage("Hasil belum dapat disahkan. Semak senarai kempen sebelum mencuba semula."); }
    finally { submitting.current = false; setBusy(false); }
  }
  if (!types.length) return <section className="admin-card"><h2>Belum ada jenis kempen yang tersedia.</h2>
    <p>Jenis kempen perlu dipasang melalui migration domain yang disemak, bersama editor jenis yang sepadan. Tiada kempen generik tersedia.</p>
    <Link href="/admin/campaigns" prefetch={false}>Kembali ke senarai kempen</Link></section>;
  return <section className="admin-card"><h2>Cipta draf kempen</h2>
    {!recentMfa && <p><Link href="/admin/mfa?next=/admin/campaigns/new" prefetch={false}>Sahkan authenticator semula</Link> sebelum membuat perubahan.</p>}
    <form className="campaign-form" onSubmit={submit} aria-describedby="campaign-create-message">
      <label htmlFor="campaign-type">Jenis kempen<select id="campaign-type" value={selected} disabled={busy || !recentMfa} required onChange={e => {
        setSelected(e.target.value); const next = types.find(t => `${t.type_key}:${t.config_version}` === e.target.value); setConfiguration(next?.defaults() ?? {});
      }}><option value="">Pilih jenis kempen</option>{types.map(t => <option key={`${t.type_key}:${t.config_version}`} value={`${t.type_key}:${t.config_version}`}>{t.label} · v{t.config_version}</option>)}</select></label>
      <label htmlFor="campaign-new-title">Tajuk<input id="campaign-new-title" name="title" maxLength={160} required disabled={busy || !recentMfa} /></label>
      <label htmlFor="campaign-new-slug">Slug<input id="campaign-new-slug" name="slug" minLength={3} maxLength={100} pattern="[a-z0-9]+(-[a-z0-9]+)*" required disabled={busy || !recentMfa} /></label>
      {adapter && <adapter.ConfigurationForm value={configuration} onChange={setConfiguration} disabled={busy || !recentMfa} />}
      <p>Status awal ialah draf/private, tanpa tarikh dan tanpa izin paparan public.</p>
      <p id="campaign-create-message" role="status" aria-live="polite">{message}</p>
      <button className="admin-button" disabled={busy || !recentMfa || !adapter}>{busy ? "Menyimpan…" : "Cipta draf"}</button>
    </form></section>;
}
