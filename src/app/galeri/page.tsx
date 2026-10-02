import type { Metadata } from "next";
import { Container, Heading, Section } from "@/components/design-system";
import { MediaGallery } from "@/components/public/media-gallery";
import { PublicPageLayout } from "@/components/public/public-page-layout";
import { getGalleryContent } from "@/lib/public-content/cms/server";
import styles from "./gallery-page.module.css";

export const metadata: Metadata = { title: "Galeri" };
export const revalidate = 300;

export default async function Page() {
  const gallery = await getGalleryContent();
  return (
    <PublicPageLayout
      title="Galeri"
      introduction="Ruang dan suasana Masjid Talhah Bin Ubaidillah."
      contentLayout="sections"
      breadcrumbs={[
        { label: "Utama", href: "/" },
        { label: "Galeri" },
      ]}
    >
      <Section tone="ivory" className={styles.section}>
        <Container>
          <Heading className={styles.heading}>{gallery.title}</Heading>
          <MediaGallery items={gallery.items} />
        </Container>
      </Section>
    </PublicPageLayout>
  );
}
