import Link from "next/link";
import type { CampaignListItem } from "@/lib/campaigns/management-contract";
import { campaignTime, statusLabels } from "@/lib/campaigns/admin-presentation";
export function CampaignList({ campaigns, canManage }: { campaigns: CampaignListItem[]; canManage: boolean }) {
  return <div className="admin-stack">
    <div className="campaign-heading"><p>Ringkasan operasi kempen. Paparan ini tidak bergantung pada flag public.</p>
      {canManage && <Link className="admin-button" href="/admin/campaigns/new" prefetch={false}>Kempen baharu</Link>}</div>
    {campaigns.length === 0 ? <section className="admin-card"><h2>Belum ada kempen</h2><p>Kempen akan disenaraikan selepas jenis kempen diluluskan dan dipasang.</p></section> : <>
      <p className="admin-muted">Sehingga 50 kempen dipaparkan; konfigurasi dan data dalaman tidak termasuk dalam senarai.</p>
      <ul className="campaign-list">{campaigns.map(c => <li key={c.id} className="admin-card">
        <h2><Link href={`/admin/campaigns/${c.id}`} prefetch={false}>{c.title}</Link></h2>
        <p><span className="campaign-status">{statusLabels[c.status]}</span> · {c.visibility} · Versi {c.version}</p>
        <dl><dt>Jenis</dt><dd>{c.type_key} · Konfigurasi v{c.config_version}</dd><dt>Pendaftaran dibuka</dt><dd>{campaignTime(c.registration_opens_at)}</dd>
          <dt>Pendaftaran ditutup</dt><dd>{campaignTime(c.registration_closes_at)}</dd><dt>Paparan dijadualkan</dt><dd>{c.scheduled_public_display ? "Diizinkan" : "Tidak diizinkan"}</dd>
          <dt>Sejarah arkib</dt><dd>{c.archived_history_display ? "Diizinkan" : "Tidak diizinkan"}</dd></dl>
      </li>)}</ul>
    </>}
  </div>;
}
