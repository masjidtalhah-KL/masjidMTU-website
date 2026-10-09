import { readCampaigns } from "@/lib/campaigns/management";
import { CampaignList } from "@/components/admin/campaign-list";
import { CampaignReadFailure } from "@/components/admin/campaign-read-failure";
export const dynamic = "force-dynamic";
export default async function CampaignsPage() {
  let data; try { data = await readCampaigns(); } catch (error) { return <CampaignReadFailure error={error} />; }
  return <><p className="admin-eyebrow">Pengurusan kempen</p><h1>Kempen</h1><CampaignList {...data} /></>;
}
