import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { readQurbanContext } from "@/lib/qurban/registration";
import { PublicPageLayout } from "@/components/public/public-page-layout";
import { Container, Section } from "@/components/design-system";
import { QurbanRegistrationForm } from "@/components/qurban/registration-form";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata: Metadata = { title: "Pendaftaran Qurban / Aqiqah", robots: { index: false, follow: false } };
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const context = await readQurbanContext((await params).slug);
  if (!context) notFound();
  return <PublicPageLayout eyebrow="Qurban / Aqiqah" title={context.title} introduction={`${context.campaign_year} · ${context.hijri_display_label}`} contentLayout="sections">
    <Section tone="ivory"><Container width="narrow"><QurbanRegistrationForm context={context} /></Container></Section>
  </PublicPageLayout>;
}
