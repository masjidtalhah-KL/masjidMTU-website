import type { Metadata } from "next";
import Image from "next/image";
import { Container, Heading, Section } from "@/components/design-system";
import { PublicPageLayout } from "@/components/public/public-page-layout";
import { publicAssets } from "@/lib/public-content/assets";
import { surauCategories, surauList } from "@/lib/public-content/surau";
import type { Surau } from "@/lib/public-content/surau";
import styles from "./surau.module.css";

export const metadata: Metadata = { title: "Surau Kariah" };

function SurauCard({ surau }: { surau: Surau }) {
  const logo = publicAssets[surau.logoId];
  const prominent = surau.category === "jumaat";
  // Fit within a shared logo area without enlarging any source logo.
  const scale = Math.min(1, (prominent ? 160 : 144) / logo.width, (prominent ? 132 : 112) / logo.height);

  return (
    <article
      className={`${styles.card} ${prominent ? styles.prominent : ""}`}
      data-surau-id={surau.id}
      aria-labelledby={`${surau.id}-name`}
    >
      <div className={styles.logoArea}>
        <Image
          src={logo.src}
          alt={logo.alt}
          width={logo.width}
          height={logo.height}
          unoptimized
          className={styles.logo}
          style={{ width: logo.width * scale }}
        />
      </div>
      <h3 className={styles.name} id={`${surau.id}-name`}>{surau.name}</h3>
    </article>
  );
}

export default function Page() {
  const groups = surauCategories.map((category) => ({
    ...category,
    entries: surauList.filter((surau) => surau.category === category.id)
      .toSorted((a, b) => a.order - b.order),
  }));

  return (
    <PublicPageLayout
      title="Surau Kariah"
      contentLayout="sections"
      introduction={`Senarai ${surauList.length} surau kariah: ${groups[0].entries.length} Surau Jumaat dan ${groups[1].entries.length} Surau Biasa.`}
      breadcrumbs={[
        { label: "Utama", href: "/" },
        { label: "Profil", href: "/profil" },
        { label: "Surau Kariah" },
      ]}
    >
      {groups.map(({ id, label, entries }) => (
        <Section
          key={id}
          id={`surau-${id}`}
          tone={id === "jumaat" ? "white" : "ivory"}
          className={styles.section}
        >
          <Container>
            <div className={styles.sectionHeading}>
              <Heading>{label}</Heading>
              <p>{entries.length} surau</p>
            </div>
            <div className={`${styles.grid} ${id === "jumaat" ? styles.fridayGrid : ""}`}>
              {entries.map((surau) => <SurauCard key={surau.id} surau={surau} />)}
            </div>
          </Container>
        </Section>
      ))}
    </PublicPageLayout>
  );
}
