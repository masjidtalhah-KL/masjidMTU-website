import type { Metadata } from "next";
import { PublicPageLayout } from "@/components/public/public-page-layout";

export const metadata: Metadata = { title: "Pengenalan" };

export default function Page() {
  return (
    <PublicPageLayout
      title="Pengenalan"
      breadcrumbs={[
        { label: "Utama", href: "/" },
        { label: "Pengenalan" },
      ]}
    >
      <p>Kandungan akan dibina dalam Fasa 3.3.</p>
    </PublicPageLayout>
  );
}
