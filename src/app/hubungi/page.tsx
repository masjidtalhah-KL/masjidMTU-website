import type { Metadata } from "next";
import { ContactDetailsView } from "@/components/public/contact-details";
import { PublicPageLayout } from "@/components/public/public-page-layout";
import { getContactContent } from "@/lib/public-content/cms/server";

export const metadata: Metadata = { title: "Hubungi" };
export const revalidate = 300;

export default async function Page() {
  const contact = await getContactContent();
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
