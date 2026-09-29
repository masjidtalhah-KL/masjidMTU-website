import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Card, Container, Heading, Section } from "@/components/design-system";
import { PublicPageLayout } from "@/components/public/public-page-layout";
import { publicAssets } from "@/lib/public-content/assets";
import type { PublicAsset } from "@/lib/public-content/assets";
import { profile } from "@/lib/public-content/profile";

export const metadata: Metadata = { title: "Profil Masjid" };

const spaceCaptions: Record<(typeof profile.spacePhotoIds)[number], string> = {
  "interior-dewan-solat-utama": "Dewan solat",
  "interior-foyer-02": "Foyer",
  "interior-kubah-interior": "Kubah dalaman",
  "interior-mihrab": "Mihrab",
  "interior-sudut-bacaan": "Sudut bacaan",
};

const nextPages = [
  { label: "Carta Organisasi", href: "/profil/organisasi" },
  { label: "Surau Kariah", href: "/profil/surau-kariah" },
  { label: "Galeri", href: "/galeri" },
] as const;

function ProfilePhoto({ asset, caption, index }: {
  asset: PublicAsset;
  caption: string;
  index: number;
}) {
  return (
    <figure className={`profile-photo profile-photo--${index + 1}`}>
      <Image
        src={asset.src}
        alt={asset.alt}
        width={asset.width}
        height={asset.height}
        sizes={index === 0
          ? "(max-width: 767px) calc(100vw - 32px), (max-width: 1192px) calc(100vw - 40px), 1152px"
          : index === 3
            ? "(max-width: 767px) 320px, (max-width: 1192px) 32vw, 368px"
            : index === 4
              ? "(max-width: 767px) calc(100vw - 32px), (max-width: 1192px) 64vw, 760px"
              : "(max-width: 767px) calc(100vw - 32px), (max-width: 1192px) 48vw, 564px"}
        className="profile-photo__image"
      />
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

export default function Page() {
  const logo = publicAssets[profile.logo.assetId];

  return (
    <PublicPageLayout
      title="Profil Masjid"
      contentLayout="sections"
      breadcrumbs={[
        { label: "Utama", href: "/" },
        { label: "Profil Masjid" },
      ]}
    >
      <Section id="pengenalan" className="profile-section">
        <Container className="profile-introduction">
          <Heading>Pengenalan</Heading>
          <div className="profile-prose">
            {profile.introduction.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            <p className="profile-source-note">{profile.introduction.sourceNote}</p>
          </div>
        </Container>
      </Section>

      <Section id="visi-misi" tone="ivory" className="profile-section">
        <Container>
          <Heading className="profile-section-title">Visi &amp; Misi</Heading>
          <div className="profile-purpose-grid">
            {[
              { title: "Visi", text: profile.vision },
              { title: "Misi", text: profile.mission },
            ].map(({ title, text }) => (
              <Card key={title} className="profile-purpose-card">
                <Heading as="h3">{title}</Heading>
                <p>{text}</p>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      <Section id="moto" tone="navy" className="profile-motto">
        <Container width="narrow">
          <Heading className="profile-motto__label">Moto</Heading>
          <p>{profile.motto}</p>
        </Container>
      </Section>

      <Section id="rasional-logo" className="profile-section">
        <Container>
          <Heading className="profile-section-title">Rasional Logo</Heading>
          <div className="profile-logo-grid">
            <div className="profile-logo-visual">
              <Image
                src={logo.src}
                alt={logo.alt}
                width={logo.width}
                height={logo.height}
                sizes="(max-width: 767px) 240px, 300px"
                className="profile-logo-image"
              />
            </div>
            <div className="profile-prose">
              {profile.logo.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      <Section id="ruang-masjid" tone="ivory" className="profile-section">
        <Container>
          <Heading className="profile-section-title">Ruang &amp; Seni Bina Masjid</Heading>
          <div className="profile-spaces">
            {profile.spacePhotoIds.map((assetId, index) => (
              <ProfilePhoto
                key={assetId}
                asset={publicAssets[assetId]}
                caption={spaceCaptions[assetId]}
                index={index}
              />
            ))}
          </div>
        </Container>
      </Section>

      <Section className="profile-next">
        <Container>
          <Heading>Terokai juga</Heading>
          <nav aria-label="Halaman berkaitan profil" className="profile-next__links">
            {nextPages.map(({ label, href }) => (
              <Link href={href} key={href}>
                {label}<span aria-hidden="true">↗</span>
              </Link>
            ))}
          </nav>
        </Container>
      </Section>
    </PublicPageLayout>
  );
}
