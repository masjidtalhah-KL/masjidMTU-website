import {
  Button,
  Container,
  Section,
  SectionHeading,
} from "@/components/design-system";
import type { UpcomingLectureState } from "@/lib/public-content/lectures/upcoming";
import styles from "./homepage-lectures.module.css";

export function HomepageLectureSection({
  content,
}: {
  content: UpcomingLectureState;
}) {
  return (
    <Section id="lectures" tone="navy" className={styles.section}>
      <Container width="wide">
        <div className={styles.layout}>
          <div>
            <SectionHeading
              eyebrow="Pengajian di masjid"
              title="Kuliah terdekat"
              description="Pengajian terdekat berdasarkan jadual yang diterbitkan oleh pihak masjid."
              tone="light"
            />
            <Button href="/kuliah">
              Lihat jadual penuh <span aria-hidden="true">↗</span>
            </Button>
          </div>
          {content.status === "ready" ? (
            <article
              className={styles.date}
              aria-labelledby="upcoming-kuliah-date"
            >
              <p className={styles.timing}>
                {content.today
                  ? "Hari ini"
                  : "Tarikh terdekat"}
              </p>
              <h3 id="upcoming-kuliah-date">
                <time dateTime={content.day.date}>{content.day.label}</time>
              </h3>
              <div className={styles.sessions}>
                {"specialPoster" in content.day ? (
                  <div className={styles.session}>
                    <h4>Program khas</h4>
                    <p className={styles.topic}>
                      {content.day.specialPoster.image.alt}
                    </p>
                  </div>
                ) : (
                  content.day.sessions.map((session) => (
                    <div className={styles.session} key={session.id}>
                      <h4>{session.label}</h4>
                      {session.speaker && (
                        <p className={styles.speaker}>{session.speaker}</p>
                      )}
                      {session.topic && (
                        <p className={styles.topic}>{session.topic}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </article>
          ) : (
            <p className={styles.message} role="status">
              {content.status === "unavailable"
                ? "Maklumat kuliah tidak tersedia buat sementara waktu. Sila cuba lagi kemudian."
                : content.status === "empty"
                  ? "Jadual kuliah belum diterbitkan."
                  : "Jadual kuliah terkini boleh dilihat di halaman Jadual Kuliah."}
            </p>
          )}
        </div>
      </Container>
    </Section>
  );
}
