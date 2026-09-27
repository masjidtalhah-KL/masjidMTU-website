import Image from "next/image";
import type { Metadata } from "next";
import {
  Badge,
  Button,
  Card,
  Container,
  Footer,
  Heading,
  Input,
  Navbar,
  Section,
  SectionHeading,
  Textarea,
} from "@/components/design-system";
import { Reveal } from "@/components/reveal";

export const metadata: Metadata = {
  title: "Sistem Reka Bentuk",
  description:
    "Warna, tipografi dan komponen digital untuk Masjid Talhah Bin Ubaidillah, Bukit Jalil.",
};

const colors = [
  { name: "Midnight navy", hex: "#071A3E", token: "Navy 950", className: "swatch--navy" },
  { name: "Deep navy", hex: "#102B59", token: "Navy 800", className: "swatch--deep" },
  { name: "Royal blue", hex: "#254E8A", token: "Blue 700", className: "swatch--blue" },
  { name: "Warm gold", hex: "#D7B75B", token: "Gold 400", className: "swatch--gold" },
  { name: "Ivory", hex: "#F7F4EC", token: "Surface ivory", className: "swatch--ivory" },
  { name: "Pure white", hex: "#FFFFFF", token: "Surface white", className: "swatch--white" },
  { name: "Charcoal", hex: "#202938", token: "Text primary", className: "swatch--charcoal" },
  { name: "Slate", hex: "#657184", token: "Text muted", className: "swatch--slate" },
];

export default function DesignSystemPage() {
  return (
    <>
      <Navbar />
      <main>
        <section className="design-hero">
          <div className="design-hero__pattern" aria-hidden="true" />
          <Container className="design-hero__inner" width="wide">
            <Reveal className="design-hero__copy">
              <p className="eyebrow eyebrow--gold">Panduan visual · Fasa 1</p>
              <Heading as="h1" className="design-hero__title">
                Identiti digital yang tenang, jelas dan berjiwa.
              </Heading>
              <p className="design-hero__description">
                Sistem reka bentuk asas untuk website rasmi Masjid Talhah Bin
                Ubaidillah, Bukit Jalil, Kuala Lumpur.
              </p>
              <div className="design-hero__actions">
                <Button href="#components" size="lg">
                  Teroka komponen
                </Button>
                <Button href="#colors" variant="outline" size="lg" className="button--outline-light">
                  Lihat palet warna
                </Button>
              </div>
              <p className="design-hero__note">
                Halaman ini ialah pratonton design system, bukan homepage awam.
              </p>
            </Reveal>

            <Reveal className="hero-emblem-wrap">
              <div className="hero-emblem" aria-hidden="true">
                <div className="hero-emblem__arch">
                  <span className="hero-emblem__diamond" />
                  <span className="hero-emblem__line" />
                  <span className="hero-emblem__caption">TALHAH · BUKIT JALIL</span>
                </div>
              </div>
            </Reveal>
          </Container>
          <div className="design-hero__bottom-line" aria-hidden="true" />
        </section>

        <Section id="colors" tone="ivory">
          <Container width="wide">
            <Reveal>
              <SectionHeading
                eyebrow="01 · Palet warna"
                title="Warna yang berakar pada identiti masjid."
                description="Navy menjadi asas yang teguh, biru memberi lapisan sekunder, dan emas digunakan sebagai aksen pada tindakan serta perincian."
              />
            </Reveal>
            <div className="swatch-grid">
              {colors.map((color, index) => (
                <Reveal key={color.name}>
                  <div className="swatch-card" style={{ animationDelay: `${index * 45}ms` }}>
                    <div className={`swatch ${color.className}`} />
                    <div className="swatch-card__meta">
                      <strong>{color.name}</strong>
                      <span>{color.hex}</span>
                      <small>{color.token}</small>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </Container>
        </Section>

        <Section id="typography" tone="white">
          <Container width="wide">
            <Reveal>
              <SectionHeading
                eyebrow="02 · Tipografi"
                title="Formal pada tajuk, mudah dibaca pada isi."
                description="Tajuk menggunakan Georgia sebagai serif klasik yang tersedia pada peranti. Isi menggunakan system sans-serif yang jelas, pantas dan tidak memerlukan fon luaran."
              />
            </Reveal>
            <div className="type-specimen">
              <div className="type-specimen__sample">
                <p className="type-specimen__label">Display · Georgia · 56 / 1.08</p>
                <p className="type-display">Rumah ibadah, rumah komuniti.</p>
              </div>
              <div className="type-specimen__sample">
                <p className="type-specimen__label">Heading 1 · Georgia · 40 / 1.15</p>
                <Heading as="h1">Mendekatkan hati melalui ilmu.</Heading>
              </div>
              <div className="type-specimen__sample">
                <p className="type-specimen__label">Heading 2 · Georgia · 32 / 1.2</p>
                <Heading>Ruang untuk beribadah dan bersama.</Heading>
              </div>
              <div className="type-specimen__sample type-specimen__sample--body">
                <p className="type-specimen__label">Body · System UI · 16 / 1.7</p>
                <p>
                  Masjid Talhah Bin Ubaidillah menyatukan jemaah melalui
                  ibadah, pendidikan dan khidmat masyarakat. Tipografi isi
                  dikekalkan ringkas supaya selesa dibaca pada skrin telefon.
                </p>
              </div>
              <div className="type-specimen__sample">
                <p className="type-specimen__label">Label · System UI · 12 / 1.4</p>
                <p className="eyebrow">WAKTU SOLAT · KUALA LUMPUR</p>
              </div>
            </div>
          </Container>
        </Section>

        <Section id="components" tone="ivory">
          <Container width="wide">
            <Reveal>
              <SectionHeading
                eyebrow="03 · Komponen"
                title="Asas yang konsisten untuk setiap halaman."
                description="Komponen ini direka supaya boleh diguna semula, dengan keadaan interaksi yang jelas dan aksen emas yang terkawal."
              />
            </Reveal>

            <div className="component-group">
              <div className="component-group__heading">
                <Heading as="h3">Butang</Heading>
                <p>Empat variasi untuk tindakan utama dan sekunder.</p>
              </div>
              <div className="button-showcase">
                <Button>Utama · Emas</Button>
                <Button variant="secondary">Sekunder · Biru</Button>
                <Button variant="outline">Garis luar</Button>
                <Button variant="ghost">Ringkas</Button>
                <Button size="sm">Saiz kecil</Button>
                <Button size="lg">Saiz besar</Button>
              </div>
            </div>

            <div className="component-group">
              <div className="component-group__heading">
                <Heading as="h3">Kad dan lencana</Heading>
                <p>Permukaan terang, navy, dan kad pilihan.</p>
              </div>
              <div className="card-grid">
                <Card>
                  <Badge variant="blue">Maklumat</Badge>
                  <Heading as="h3">Kad terang</Heading>
                  <p>Permukaan putih dengan ruang yang selesa untuk kandungan harian.</p>
                </Card>
                <Card variant="navy">
                  <Badge variant="gold">Aktiviti</Badge>
                  <Heading as="h3">Kad navy</Heading>
                  <p>Lapisan gelap untuk kandungan yang memerlukan penekanan visual.</p>
                </Card>
                <Card variant="highlighted">
                  <Badge variant="dark">Pilihan utama</Badge>
                  <Heading as="h3">Kad sorotan</Heading>
                  <p>Garis emas nipis membantu menonjolkan satu item penting.</p>
                </Card>
              </div>
              <div className="badge-row" aria-label="Contoh variasi lencana">
                <Badge>Umum</Badge>
                <Badge variant="blue">Kuliah</Badge>
                <Badge variant="gold">Pendaftaran dibuka</Badge>
                <Badge variant="dark">Aktif</Badge>
              </div>
            </div>

            <div className="component-group component-group--media">
              <Card variant="light" className="brand-card">
                <div className="brand-card__image-wrap">
                  <Image
                    src="/brand/masjid-exterior.jpg"
                    alt="Bahagian luar Masjid Talhah Bin Ubaidillah dengan kubah biru dan emas"
                    width={1200}
                    height={900}
                    className="brand-card__image"
                    sizes="(max-width: 700px) 100vw, 50vw"
                  />
                </div>
                <div className="brand-card__copy">
                  <Badge variant="blue">Aset rasmi</Badge>
                  <Heading as="h3">Fotografi sebenar, layanan yang tenang.</Heading>
                  <p>
                    Imej masjid dikekalkan sebagai fokus, dengan bingkai cerah
                    dan ruang negatif untuk kandungan.
                  </p>
                </div>
              </Card>
              <div className="spacing-card">
                <p className="eyebrow">Skala jarak</p>
                <Heading as="h3">Ruang yang konsisten.</Heading>
                <div className="spacing-list">
                  {[
                    ["4 px", "--spacing-1"],
                    ["8 px", "--spacing-2"],
                    ["16 px", "--spacing-4"],
                    ["24 px", "--spacing-6"],
                    ["32 px", "--spacing-8"],
                    ["48 px", "--spacing-12"],
                  ].map(([label, token]) => (
                    <div className="spacing-list__row" key={token}>
                      <span>{label}</span>
                      <span className="spacing-list__bar" style={{ width: `var(${token})` }} />
                      <small>{token}</small>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Container>
        </Section>

        <Section id="forms" tone="white">
          <Container width="narrow">
            <Reveal>
              <SectionHeading
                eyebrow="04 · Borang"
                title="Medan input yang jelas dan mesra sentuhan."
                description="Label sentiasa kelihatan, fokus mudah dikenal pasti, dan kawalan mempunyai ruang sentuhan yang selesa pada telefon."
              />
            </Reveal>
            <Card className="form-card">
              <div className="form-card__grid">
                <Input
                  label="Nama penuh"
                  name="full-name"
                  placeholder="Contoh: Ahmad bin Ali"
                  autoComplete="name"
                />
                <Input
                  label="Alamat emel"
                  name="email"
                  type="email"
                  placeholder="nama@contoh.my"
                  autoComplete="email"
                  hint="Kami hanya gunakan emel untuk maklum balas."
                />
              </div>
              <Textarea
                label="Mesej"
                name="message"
                placeholder="Tulis mesej anda di sini..."
                rows={4}
              />
              <div className="form-card__actions">
                <Button>Hantar mesej</Button>
                <span>Input · Textarea · Focus ring</span>
              </div>
            </Card>
          </Container>
        </Section>

        <Section tone="navy" className="motif-section">
          <Container className="motif-section__inner" width="wide">
            <Reveal className="motif-section__copy">
              <p className="eyebrow eyebrow--gold">05 · Perincian hiasan</p>
              <Heading>Motif Islamik dan lengkung mihrab, dengan ruang untuk bernafas.</Heading>
              <p>
                Lengkung dan geometri menjadi tekstur latar yang lembut. Ia
                menyokong kandungan tanpa bersaing dengannya.
              </p>
            </Reveal>
            <Reveal className="ornament-reveal">
              <div className="ornament-stage" role="img" aria-label="Contoh lengkung mihrab dan motif geometri">
                <div className="ornament-stage__grid" aria-hidden="true" />
                <div className="ornament-arch" aria-hidden="true">
                  <span className="ornament-arch__inner" />
                  <span className="ornament-arch__dot" />
                </div>
              </div>
            </Reveal>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
