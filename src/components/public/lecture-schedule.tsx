import { textSchedule } from "@/lib/public-content/lectures/content";
import type { MonthSchedule } from "@/sanity/tools/lecture-generator/model";
import styles from "./public-lectures.module.css";
export function LectureSchedule({ schedule }: { schedule: MonthSchedule }) {
  const days = textSchedule(schedule);
  return (
    <div className={styles.schedule}>
      {days.map((day) => (
        <article
          key={day.date}
          className={styles.day}
          aria-labelledby={`date-${day.date}`}
        >
          <h3 id={`date-${day.date}`}>
            <time dateTime={day.date}>{day.label}</time>
          </h3>
          {"specialPoster" in day ? (
            <div className={styles.special}>
              <h4>Program khas</h4>
              <p>{day.specialPoster.image.alt}</p>
              <a
                href={day.specialPoster.image.src}
                target="_blank"
                rel="noopener noreferrer"
              >
                Buka poster program <span aria-hidden="true">↗</span>
              </a>
            </div>
          ) : (
            <div className={styles.sessions}>
              {day.sessions.map((session) => (
                <section key={session.id} className={styles.session}>
                  <h4>{session.label}</h4>
                  {session.speaker ? (
                    <p className={styles.speaker}>{session.speaker}</p>
                  ) : null}
                  {session.topic ? (
                    <p className={styles.topic}>{session.topic}</p>
                  ) : null}
                </section>
              ))}
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
