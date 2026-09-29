import type { Metadata } from "next";
import { PublicPageLayout } from "@/components/public/public-page-layout";

export const metadata: Metadata = { title: "Surau Kariah" };

export default function Page() {
  return (
    <PublicPageLayout
      title="Surau Kariah"
      breadcrumbs={[
        { label: "Utama", href: "/" },
        { label: "Profil", href: "/profil" },
        { label: "Surau Kariah" },
      ]}
    >
      <p>Kandungan akan dibina dalam Fasa 3.5.</p>
    </PublicPageLayout>
  );
}
