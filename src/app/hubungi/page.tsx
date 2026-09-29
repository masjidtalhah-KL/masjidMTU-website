import type { Metadata } from "next";
import { PublicPageLayout } from "@/components/public/public-page-layout";

export const metadata: Metadata = { title: "Hubungi" };

export default function Page() {
  return (
    <PublicPageLayout
      title="Hubungi"
      breadcrumbs={[
        { label: "Utama", href: "/" },
        { label: "Hubungi" },
      ]}
    >
      <p>Kandungan akan dibina dalam Fasa 3.7.</p>
    </PublicPageLayout>
  );
}
