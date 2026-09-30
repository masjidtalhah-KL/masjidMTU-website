import type { Metadata } from "next";
import { Container, Heading, Section } from "@/components/design-system";
import { MediaGallery } from "@/components/public/media-gallery";
import type { MediaGalleryItem } from "@/components/public/media-gallery";
import { PublicPageLayout } from "@/components/public/public-page-layout";
import { publicAssets } from "@/lib/public-content/assets";
import { galleryCategories, galleryPhotos } from "@/lib/public-content/gallery";
import styles from "./gallery-page.module.css";

export const metadata: Metadata = { title: "Galeri" };

export default function Page() {
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
      {galleryCategories.map((category) => {
        const items: MediaGalleryItem[] = galleryPhotos
          .filter((photo) => photo.category === category.id)
          .map((photo) => {
            const asset = publicAssets[photo.assetId];
            return {
              id: photo.id,
              src: asset.src,
              alt: asset.alt,
              width: asset.width,
              height: asset.height,
              category: photo.category,
              order: photo.order,
              caption: photo.caption || undefined,
            };
          });

        return (
          <Section tone="ivory" className={styles.section} key={category.id}>
            <Container>
              <Heading className={styles.heading}>{category.label}</Heading>
              <MediaGallery items={items} />
            </Container>
          </Section>
        );
      })}
    </PublicPageLayout>
  );
}
