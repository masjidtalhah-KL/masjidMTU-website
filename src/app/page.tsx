import Image from "next/image";
import type { Metadata } from "next";
import masjidExterior from "../../public/brand/masjid-exterior.webp";
import {
  Badge,
  Button,
  Card,
  Container,
  Footer,
  Heading,
  Navbar,
  Section,
  SectionHeading,
} from "@/components/design-system";
import { Reveal } from "@/components/reveal";
import {
  lectureSchedule,
  prayerTimes,
} from "@/lib/homepage-content";

import { HomepageAnnouncementSection, HomepageProgramSection, HomepageNewsSection } from "@/components/public/homepage-editorial";
import { DonationSection } from "@/components/public/donation-section";
import { getDonationContent } from "@/lib/public-content/cms/server";
import { getHomepageEditorial } from "@/lib/public-content/cms/homepage-server";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Masjid Talhah Bin Ubaidillah",
  description:
    "Laman rasmi Masjid Talhah Bin Ubaidillah, Bukit Jalil, Kuala Lumpur. Dapatkan maklumat waktu solat, program, kuliah dan aktiviti komuniti.",
};

export default async function Home() {
  const [editorial, donation] = await Promise.all([getHomepageEditorial(), getDonationContent()]);
  return (
    <>
      <Navbar variant="public" />
      <main id="home">
        <section className="home-hero section--navy section--navy-pattern">
          <Container className="home-hero__inner" width="wide">
            <Reveal className="home-hero__copy">
              <div className="home-hero__identity">
                <Image
                  src="/brand/logo-masjid.png"
                  alt="Logo rasmi Masjid Talhah Bin Ubaidillah"
                  width={76}
                  height={76}
                  className="home-hero__logo"
                  priority
                />
                <p className="eyebrow eyebrow--gold">Laman rasmi masjid</p>
              </div>
              <Heading as="h1" className="home-hero__title">
                Masjid Talhah Bin Ubaidillah
              </Heading>
              <p className="home-hero__location">Bukit Jalil, Kuala Lumpur</p>
              <p className="home-hero__description">
                Ruang ibadah, ilmu dan khidmat yang menyatukan komuniti setempat.
              </p>
              <div className="home-hero__actions">
                <Button href="#programs" size="lg">
                  Lihat Program <span aria-hidden="true">↗</span>
                </Button>
                <Button href="#donations" variant="outline" size="lg" className="button--outline-light">
                  Sumbangan
                </Button>
              </div>
              <a className="home-hero__scroll" href="#prayer-times">
                Terus ke waktu solat <span aria-hidden="true">↓</span>
              </a>
            </Reveal>

            <Reveal className="home-hero__visual-wrap">
              <div className="home-hero__visual">
                <div className="home-hero__image-wrap">
                  <Image
                    src="/brand/masjid-dome.jpg"
                    alt="Kubah biru dan emas Masjid Talhah Bin Ubaidillah"
                    fill
                    priority
                    sizes="(max-width: 48rem) 100vw, (max-width: 64rem) 48vw, 42vw"
                    className="home-hero__image"
                  />
                </div>
              </div>
            </Reveal>
          </Container>
        </section>

        <Section id="prayer-times" tone="ivory" className="prayer-section">
          <Container width="wide">
            <div className="prayer-section__heading">
              <div>
                <p className="eyebrow">Ibadah harian</p>
                <Heading as="h2">Waktu Solat</Heading>
              </div>
              <div className="prayer-section__date">
                <span className="prayer-section__date-icon" aria-hidden="true">◷</span>
                <span>Kuala Lumpur</span>
                <Badge variant="neutral">Data contoh</Badge>
              </div>
            </div>
            <div className="prayer-times__grid" aria-label="Waktu solat contoh">
              {prayerTimes.map((prayer, index) => (
                <div className={`prayer-time${index === 0 ? " prayer-time--active" : ""}`} key={prayer.name}>
                  <span>{prayer.name}</span>
                  <strong>{prayer.time}</strong>
                </div>
              ))}
            </div>
            <p className="prayer-section__note">
              Waktu di atas ialah mock data untuk pratonton dan bukan jadual waktu solat semasa.
            </p>
          </Container>
        </Section>

        <HomepageAnnouncementSection editorial={editorial} />

        <HomepageProgramSection editorial={editorial} />

        <Section id="lectures" tone="navy" className="lecture-section">
          <Container width="wide">
            <Reveal>
              <SectionHeading
                eyebrow="Tambah ilmu"
                title="Jadual kuliah"
                description="Contoh jadual yang boleh disambungkan kepada sumber kandungan kemudian."
                tone="light"
              />
            </Reveal>
            <div className="lecture-list">
              {lectureSchedule.map((lecture, index) => (
                <article className="lecture-row" key={lecture.title}>
                  <span className="lecture-row__index">0{index + 1}</span>
                  <div className="lecture-row__date">
                    <strong>{lecture.date}</strong>
                    <span>{lecture.time}</span>
                  </div>
                  <div className="lecture-row__content">
                    <Heading as="h3">{lecture.title}</Heading>
                    <p>{lecture.speaker}</p>
                  </div>
                  <span className="lecture-row__arrow" aria-hidden="true">↗</span>
                </article>
              ))}
            </div>
            <p className="content-note content-note--light">Jadual dan nama penceramah ialah contoh untuk pratonton.</p>
          </Container>
        </Section>

        <DonationSection content={donation} />

        <HomepageNewsSection editorial={editorial} />

        <Section id="about" tone="white" className="about-section">
          <Container className="about-section__inner" width="wide">
            <Reveal className="about-section__identity">
              <div className="about-section__intro">
                <p className="eyebrow">Mengenali masjid</p>
                <Heading as="h2">Masjid Talhah Bin Ubaidillah</Heading>
                <p className="about-section__location">Bukit Jalil, Kuala Lumpur</p>
              </div>
              <div className="about-section__visual">
                <Image
                  src={masjidExterior}
                  alt="Pandangan penuh bahagian luar Masjid Talhah Bin Ubaidillah"
                  fill
                  unoptimized
                  priority
                  sizes="(max-width: 48rem) 100vw, 42vw"
                  className="about-section__image"
                />
              </div>
            </Reveal>
            <Reveal className="about-section__copy">
              <Heading as="h3">Ruang ibadah untuk komuniti</Heading>
              <p>
                Masjid Talhah Bin Ubaidillah berada di Bukit Jalil, Kuala Lumpur. Laman ini menghimpunkan maklumat masjid, program dan aktiviti untuk rujukan komuniti setempat.
              </p>
              <p>
                Profil terperinci dan maklumat organisasi akan ditambah selepas butirannya disahkan.
              </p>
              <a className="text-link" href="#contact">Lihat lokasi dan maklumat hubungan <span aria-hidden="true">→</span></a>
            </Reveal>
          </Container>
        </Section>

        <Section id="contact" tone="navy" className="contact-section">
          <Container width="wide">
            <div className="contact-section__grid">
              <Reveal className="contact-section__copy">
                <p className="eyebrow eyebrow--gold">Singgah dan berhubung</p>
                <Heading as="h2">Lokasi dan maklumat hubungan</Heading>
                <p>Masjid Talhah Bin Ubaidillah terletak di Bukit Jalil, Kuala Lumpur.</p>
              </Reveal>
              <Reveal>
                <Card variant="navy" className="contact-card">
                  <p className="eyebrow eyebrow--gold">Lokasi</p>
                  <Heading as="h3">Bukit Jalil, Kuala Lumpur</Heading>
                  <div className="contact-card__rule" />
                  <p className="contact-card__note">
                    Alamat penuh, nombor telefon dan emel rasmi akan dipaparkan selepas disahkan.
                  </p>
                </Card>
              </Reveal>
            </div>
          </Container>
        </Section>
      </main>
      <Footer variant="public" />
    </>
  );
}
