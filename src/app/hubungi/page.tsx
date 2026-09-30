import type { Metadata } from "next";
import { ContactDetailsView } from "@/components/public/contact-details";
import { PublicPageLayout } from "@/components/public/public-page-layout";
import { contact } from "@/lib/public-content/contact";

export const metadata: Metadata = { title: "Hubungi" };

export default function Page() {
  return (
    <PublicPageLayout
      title="Hubungi"
      contentLayout="sections"
      breadcrumbs={[
        { label: "Utama", href: "/" },
        { label: "Hubungi" },
      ]}
    >
      <ContactDetailsView details={contact} />
    </PublicPageLayout>
  );
}
