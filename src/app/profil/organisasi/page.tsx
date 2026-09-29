import type { Metadata } from "next";
import { Container, Heading, Section } from "@/components/design-system";
import { PersonCard } from "@/components/public/person-card";
import { PublicPageLayout } from "@/components/public/public-page-layout";
import { organisationGroups, organisationSlots } from "@/lib/public-content/organisation";
import type { OrganisationGroupId } from "@/lib/public-content/organisation";
import styles from "./organisation.module.css";

export const metadata: Metadata = { title: "Carta Organisasi" };

const sectionLinks = [
  { href: "#jawatankuasa-utama", label: "Jawatankuasa Utama" },
  { href: "#ajk-biro", label: "AJK / Biro" },
  { href: "#imam", label: "Imam" },
  { href: "#bilal", label: "Bilal" },
  { href: "#noja-pembantu-tadbir", label: "Noja & Pembantu Tadbir" },
] as const;

function OrganisationGroup({ id }: { id: OrganisationGroupId }) {
  const group = organisationGroups.find((item) => item.id === id)!;
  const prominent = id === "jawatankuasa-utama";
  const slots = organisationSlots
    .filter((slot) => slot.groupId === id)
    .toSorted((a, b) => a.order - b.order);

  return (
    <section id={id} className={styles.group} aria-labelledby={`${id}-heading`}>
      <h3 id={`${id}-heading`} className={styles.groupHeading}>
        {id === "ajk-biro" ? "AJK / Biro" : group.label}
      </h3>
      <div className={`${styles.peopleGrid} ${prominent ? styles.leadershipGrid : ""}`}>
        {slots.map((slot) => (
          <PersonCard
            key={slot.id}
            slot={slot}
            prominent={prominent}
            reserveAppointment={group.parent === "Pegawai Masjid"}
          />
        ))}
      </div>
    </section>
  );
}

export default function Page() {
  return (
    <PublicPageLayout
      title="Carta Organisasi"
      contentLayout="sections"
      breadcrumbs={[
        { label: "Utama", href: "/" },
        { label: "Profil", href: "/profil" },
        { label: "Carta Organisasi" },
      ]}
    >
      <nav className={styles.jumpNav} aria-label="Bahagian carta organisasi">
        <Container>
          <p className={styles.jumpLabel}>Lompat ke bahagian</p>
          <div className={styles.jumpLinks}>
            {sectionLinks.map(({ href, label }) => <a href={href} key={href}>{label}</a>)}
          </div>
        </Container>
      </nav>

      <Section className={styles.committee}>
        <Container>
          <Heading className={styles.majorHeading}>Ahli Jawatankuasa Kariah</Heading>
          <OrganisationGroup id="jawatankuasa-utama" />
          <OrganisationGroup id="ajk-biro" />
        </Container>
      </Section>

      <Section tone="ivory" className={styles.officers}>
        <header className={styles.officersHeader}>
          <Container><Heading>Pegawai Masjid</Heading></Container>
        </header>
        <Container>
          <OrganisationGroup id="imam" />
          <OrganisationGroup id="bilal" />
          <div id="noja-pembantu-tadbir" className={styles.supportGroups}>
            <OrganisationGroup id="noja" />
            <OrganisationGroup id="pembantu-tadbir" />
          </div>
        </Container>
      </Section>
    </PublicPageLayout>
  );
}
