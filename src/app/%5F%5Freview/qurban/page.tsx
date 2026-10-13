import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicPageLayout } from "@/components/public/public-page-layout";
import QurbanPrototype from "./prototype";
import "./prototype.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Semakan pemilik — Qurban MVP",
  robots: { index: false, follow: false },
};

export default function QurbanReviewPage() {
  // Server-only opt-in, also denied in every production build/runtime.
  // Check before rendering or loading any operational/CMS service.
  if (process.env.NODE_ENV !== "development" || process.env.QURBAN_PROTOTYPE !== "1") notFound();
  // Optional explicit local review setting; never populated from hosted resources.
  let volunteerWhatsappGroupUrl: string | undefined;
  const configuredGroup = process.env.QURBAN_PROTOTYPE_VOLUNTEER_WHATSAPP_GROUP_URL;
  if (configuredGroup) {
    try {
      const url = new URL(configuredGroup);
      if (url.protocol === "https:" && url.hostname === "chat.whatsapp.com" && !url.username && !url.password && !url.port && !url.search && !url.hash && /^\/[A-Za-z0-9]+$/.test(url.pathname)) volunteerWhatsappGroupUrl = url.href;
    } catch { /* Invalid optional settings use the unconfigured reminder. */ }
  }
  return <PublicPageLayout title="Ibadah bersama, urusan dipermudah."
    eyebrow="Semakan pemilik · Fasa 8.0" contentLayout="sections"
    introduction="Cuba aliran pendaftaran Qurban, Aqiqah dan sukarelawan Masjid Talhah Bin Ubaidillah menggunakan maklumat rekaan sahaja.">
    <QurbanPrototype volunteerWhatsappGroupUrl={volunteerWhatsappGroupUrl} />
  </PublicPageLayout>;
}
