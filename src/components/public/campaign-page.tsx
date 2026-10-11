import { Badge, Card, Container, Heading, Section } from "@/components/design-system";
import { PublicPageLayout } from "./public-page-layout";
import { publicCampaignDate, publicCampaignLabels, type PublicCampaign } from "@/lib/campaigns/public-contract";
import type { CampaignEditorial } from "@/lib/campaigns/public-editorial-contract";

export function CampaignPage({ campaign, editorial }: { campaign: PublicCampaign; editorial: CampaignEditorial | null }) {
  const dates = [
    ["Pendaftaran dibuka", campaign.registration_opens_at], ["Pendaftaran ditutup", campaign.registration_closes_at],
    ["Acara bermula", campaign.event_starts_at], ["Acara berakhir", campaign.event_ends_at],
  ];
  return <PublicPageLayout eyebrow="Kempen" title={campaign.title} introduction="Maklumat kempen Masjid Talhah Bin Ubaidillah." contentLayout="sections">
    <Section tone="ivory"><Container width="narrow"><Card>
      <Heading as="h2">Maklumat kempen</Heading>
      <p><Badge variant="blue">{publicCampaignLabels[campaign.state]}</Badge></p>
      {editorial && <p>{editorial.description}</p>}
      {dates.some(([, date]) => date !== null) && <dl>{dates.filter(([, date]) => date !== null).map(([label, date]) =>
        <div key={label}><dt><strong>{label}</strong></dt><dd><time dateTime={date!}>{publicCampaignDate(date!)}</time> (MYT, UTC+08:00)</dd></div>)}</dl>}
    </Card></Container></Section>
  </PublicPageLayout>;
}
