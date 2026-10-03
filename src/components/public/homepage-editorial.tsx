import { Badge, Card, Container, Heading, Section, SectionHeading } from "@/components/design-system";
import { Reveal } from "@/components/reveal";
import { PublicImage } from "./public-image";
import type { HomepageEditorial } from "@/lib/public-content/cms/homepage-types";

type Props = { editorial: HomepageEditorial };

export function HomepageAnnouncementSection({ editorial }: Props) {
  const { announcement } = editorial;
  const unavailable = editorial.source === "unavailable";
  return (
    <Section id="announcements" tone="white" className="announcement-section">
      <Container width="wide">
        <div className="announcement-panel">
          <div className="announcement-panel__mark" aria-hidden="true">!</div>
          <div className="announcement-panel__copy">
            <div className="announcement-panel__meta">
              <Badge variant="gold">Pengumuman</Badge>
              {announcement && <span>{announcement.date}</span>}
            </div>
            <Heading as="h2">{announcement?.title ?? "Ruang makluman rasmi masjid"}</Heading>
            <p>{announcement?.description ?? (unavailable ? "Maklumat pengumuman tidak tersedia buat sementara waktu." : "Belum ada pengumuman yang diterbitkan untuk paparan ini.")}</p>
          </div>
          <a className="announcement-panel__link" href={announcement?.cta?.url ?? "#contact"} aria-label={announcement?.cta?.label ?? "Pergi ke maklumat hubungan"}>
            <span aria-hidden="true">↗</span>
          </a>
        </div>
      </Container>
    </Section>
  );
}

export function HomepageProgramSection({ editorial }: Props) {
  const unavailable = editorial.source === "unavailable";
  return (
    <Section id="programs" tone="ivory" className="program-section">
      <Container width="wide">
        <Reveal>
          <SectionHeading
            eyebrow="Bersama komuniti"
            title="Program dan inisiatif"
            description="Ruang untuk belajar, berkhidmat dan mengeratkan hubungan sesama jemaah."
          />
        </Reveal>
        <div className="home-card-grid">
          {editorial.programs.map((program, index) => (
            <Reveal key={program.id}>
              <Card className="program-card">
                <div className="program-card__topline">
                  {program.category && <Badge variant={index === 1 ? "gold" : "blue"}>{program.category}</Badge>}
                  <span className="program-card__number">0{index + 1}</span>
                </div>
                <Heading as="h3">{program.title}</Heading>
                <p>{program.description}</p>
                <div className="program-card__details">
                  <span><i aria-hidden="true">◷</i>{program.date}</span>
                  {program.time && <span><i aria-hidden="true">⌁</i>{program.time}</span>}
                </div>
              </Card>
            </Reveal>
          ))}
        </div>
        <p className="content-note">{unavailable ? "Maklumat program tidak tersedia buat sementara waktu." : editorial.programs.length ? "Maklumat program yang diterbitkan oleh pihak masjid." : "Belum ada program atau inisiatif yang diterbitkan."}</p>
      </Container>
    </Section>
  );
}

export function HomepageNewsSection({ editorial }: Props) {
  const unavailable = editorial.source === "unavailable";
  return (
    <Section id="updates" tone="ivory" className="updates-section">
      <Container width="wide">
        <Reveal>
          <SectionHeading
            eyebrow="BULETIN MTU"
            title="Berita dan aktiviti"
            description="Sorotan program, aktiviti dan perkembangan semasa Masjid Talhah Bin Ubaidillah."
          />
        </Reveal>
        <div className="home-card-grid">
          {editorial.news.map((item, index) => (
            <Reveal key={item.id}>
              <Card className="update-card">
                {item.image ? (
                  <div className="update-card__visual update-card__visual--photo">
                    <PublicImage
                      src={item.image.src}
                      alt={item.image.alt}
                      fill
                      sizes="(max-width: 480px) calc(100vw - 24px), (max-width: 768px) 50vw, (max-width: 1192px) 33vw, 372px"
                      className="update-card__image"
                    />
                  </div>
                ) : (
                  <div className={`update-card__visual update-card__visual--${index + 1}`} aria-hidden="true">
                    <span>MTU</span>
                    <i />
                  </div>
                )}
                <div className="update-card__body">
                  <div className="update-card__meta">
                    {item.category && <Badge variant="blue">{item.category}</Badge>}
                    <span>{item.date}</span>
                  </div>
                  <Heading as="h3">{item.title}</Heading>
                  <p>{item.description}</p>
                </div>
              </Card>
            </Reveal>
          ))}
        </div>
        <p className="content-note">{unavailable ? "Berita dan aktiviti tidak tersedia buat sementara waktu." : editorial.news.length ? "Berita dan aktiviti yang diterbitkan oleh pihak masjid." : "Belum ada berita atau aktiviti yang diterbitkan."}</p>
      </Container>
    </Section>
  );
}
