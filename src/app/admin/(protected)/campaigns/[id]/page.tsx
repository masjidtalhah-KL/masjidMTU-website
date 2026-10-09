import { notFound } from "next/navigation";
import { readCampaign } from "@/lib/campaigns/management";
import { CampaignPanel } from "@/components/admin/campaign-detail";
import { CampaignReadFailure } from "@/components/admin/campaign-read-failure";
export const dynamic = "force-dynamic";
export default async function CampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id)) notFound();
  let data; try { data = await readCampaign(id); } catch (error) { return <CampaignReadFailure error={error} next={`/admin/campaigns/${id}`} />; }
  if (!data) notFound();
  return <><p className="admin-eyebrow">Pengurusan kempen</p><h1>Butiran kempen</h1><CampaignPanel initial={data} /></>;
}
