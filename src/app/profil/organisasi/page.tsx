import type { Metadata } from "next";
import { PublicPageLayout } from "@/components/public/public-page-layout";

export const metadata: Metadata = { title: "Carta Organisasi" };

export default function Page() {
  return (
    <PublicPageLayout
      title="Carta Organisasi"
      breadcrumbs={[
        { label: "Utama", href: "/" },
        { label: "Profil", href: "/profil" },
        { label: "Carta Organisasi" },
      ]}
    >
      <p>Kandungan akan dibina dalam Fasa 3.4.</p>
    </PublicPageLayout>
  );
}
