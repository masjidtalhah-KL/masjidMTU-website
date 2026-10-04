import Link from "next/link";
import { Container, Section } from "@/components/design-system";
import { PublicPageLayout } from "./public-page-layout";
import { LectureSchedule } from "./lecture-schedule";
import { PublicLecturePoster } from "./lecture-poster";
import type { LecturePageState } from "@/lib/public-content/lectures/content";
import styles from "./public-lectures.module.css";
export function LecturePage({ state }: { state: LecturePageState }) {
  return (
    <PublicPageLayout
      title="Jadual Kuliah"
      eyebrow="Pengajian di masjid"
      introduction="Pengajian dan kuliah bulanan Masjid Talhah Bin Ubaidillah."
      contentLayout="sections"
      breadcrumbs={[{ label: "Utama", href: "/" }, { label: "Jadual Kuliah" }]}
    >
      <Section tone="ivory" className={styles.section}>
        <Container>
          {state.status !== "ready" ? (
            <div className={styles.empty} role="status">
              <h2>
                {state.status === "unavailable"
                  ? "Jadual kuliah tidak tersedia buat sementara waktu."
                  : "Jadual kuliah belum diterbitkan."}
              </h2>
              <p>
                {state.status === "unavailable"
                  ? "Sila cuba lagi kemudian atau hubungi pihak masjid."
                  : "Jadual bulanan akan dipaparkan di sini selepas diterbitkan."}
              </p>
              <Link className="button button--outline" href="/hubungi">
                Hubungi pihak masjid
              </Link>
            </div>
          ) : (
            <>
              <nav className={styles.monthNav} aria-label="Bulan jadual kuliah">
                {state.previous ? (
                  <Link
                    href={state.previous.href}
                    className={styles.previousMonth}
                    aria-label={`Bulan sebelumnya: ${state.previous.label}`}
                  >
                    ← Bulan sebelumnya
                  </Link>
                ) : null}
                {state.months.length > 1 ? (
                  <details className={styles.monthChoice}>
                    <summary>{state.month.label}</summary>
                    <ul>
                      {state.months.map((m) => (
                        <li key={m.key}>
                          <Link
                            href={m.href}
                            aria-current={
                              m.key === state.month.key ? "page" : undefined
                            }
                          >
                            {m.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </details>
                ) : (
                  <Link
                    href={state.month.href}
                    className={styles.currentMonth}
                    aria-current="page"
                  >
                    {state.month.label}
                  </Link>
                )}
                {state.next ? (
                  <Link
                    href={state.next.href}
                    className={styles.nextMonth}
                    aria-label={`Bulan seterusnya: ${state.next.label}`}
                  >
                    Bulan seterusnya →
                  </Link>
                ) : null}
              </nav>
              {state.defaultFallback ? (
                <p className={styles.notice}>
                  Jadual bulan semasa belum diterbitkan. Jadual terkini yang
                  tersedia ialah {state.month.label}.
                </p>
              ) : !state.current ? (
                <p className={styles.notice}>
                  Anda sedang melihat jadual {state.month.label}.
                </p>
              ) : null}
              <figure className={styles.figure}>
                <figcaption>
                  <p className="eyebrow">Jadual rasmi</p>
                  <h2>{state.month.label}</h2>
                </figcaption>
                <PublicLecturePoster
                  key={state.month.key}
                  month={state.month}
                />
              </figure>
            </>
          )}
        </Container>
      </Section>
      {state.status === "ready" ? (
        <Section className={styles.section}>
          <Container>
            <div className={styles.scheduleHeading}>
              <p className="eyebrow">Pengisian bulanan</p>
              <h2>Jadual bulan ini</h2>
              <p>Senarai pengajian dan kuliah untuk {state.month.label}.</p>
            </div>
            <LectureSchedule schedule={state.month.schedule} />
            <p className={styles.support}>
              <Link href="/#donations">
                Salurkan sumbangan <span aria-hidden="true">↗</span>
              </Link>
            </p>
          </Container>
        </Section>
      ) : null}
    </PublicPageLayout>
  );
}
