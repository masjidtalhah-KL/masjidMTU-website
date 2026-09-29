import type { Metadata } from "next";
import { PublicPageLayout } from "@/components/public/public-page-layout";

export const metadata: Metadata = { title: "Galeri" };

export default function Page() {
  return (
    <PublicPageLayout
      title="Galeri"
      breadcrumbs={[
        { label: "Utama", href: "/" },
        { label: "Galeri" },
      ]}
    >
      <p>Kandungan akan dibina dalam Fasa 3.6.</p>
    </PublicPageLayout>
  );
}
