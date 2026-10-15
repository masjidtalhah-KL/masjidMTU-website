import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CampaignPage } from "@/components/public/campaign-page";
import { readPublicCampaign } from "@/lib/campaigns/public";
import { readQurbanContext } from "@/lib/qurban/registration";
import { Container, Section } from "@/components/design-system";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;
// No listing/index commitment in 7.5; includes unlisted and denied responses.
export const metadata: Metadata = { title: "Kempen", robots: { index: false, follow: false } };
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const presentation = await readPublicCampaign(slug);
  if (!presentation) notFound();
  const qurban = await readQurbanContext(slug);
  return <CampaignPage campaign={presentation.campaign} editorial={presentation.editorial}>
    {qurban && <Section tone="ivory"><Container width="narrow"><Link className="button button--primary" href={`/kempen/${slug}/daftar`} prefetch={false}>Daftar Qurban / Aqiqah</Link></Container></Section>}
  </CampaignPage>;
}
