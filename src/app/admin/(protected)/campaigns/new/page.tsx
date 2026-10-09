import { readCampaignTypes } from "@/lib/campaigns/management";
import { NewCampaign } from "@/components/admin/campaign-new";
import { CampaignReadFailure } from "@/components/admin/campaign-read-failure";
export const dynamic = "force-dynamic";
export default async function NewCampaignPage() {
  let data; try { data = await readCampaignTypes(); } catch (error) { return <CampaignReadFailure error={error} next="/admin/campaigns/new" />; }
  return <><p className="admin-eyebrow">Pengurusan kempen</p><h1>Kempen baharu</h1>
    {data.canManage ? <NewCampaign catalog={data.catalog} recentMfa={data.recentMfa} /> : <section className="admin-card"><h2>Akses baca sahaja</h2><p>Staff tidak boleh mencipta kempen.</p></section>}</>;
}
