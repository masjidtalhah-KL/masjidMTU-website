import { isTemporarySanityFailure } from "../cms/read-policy";
import { mapLectureIndex, mapLectureMonth, textSchedule } from "./content";

type PublicLectureDate = ReturnType<typeof textSchedule>[number];
export type UpcomingLectureState =
  | { status: "empty" | "no-upcoming" | "unavailable" }
  | { status: "ready"; day: PublicLectureDate; today: boolean };

/** Date-only selection: include today; never infer completion or session times. */
export function malaysiaDateKey(now: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kuala_Lumpur",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  return ["year", "month", "day"]
    .map((type) => parts.find((p) => p.type === type)!.value)
    .join("-");
}

export async function loadUpcomingLecture(
  readIndex: () => Promise<unknown>,
  readMonth: (key: string) => Promise<unknown>,
  now = new Date(),
): Promise<UpcomingLectureState> {
  let raw: unknown;
  try {
    raw = await readIndex();
  } catch (error) {
    if (isTemporarySanityFailure(error)) return { status: "unavailable" };
    throw error;
  }
  const months = mapLectureIndex(raw);
  if (!months.length) return { status: "empty" };
  const today = malaysiaDateKey(now);
  for (const month of months.filter((m) => m.key >= today.slice(0, 7))) {
    try {
      raw = await readMonth(month.key);
    } catch (error) {
      // Do not skip an unavailable month: it could contain the nearest date.
      if (isTemporarySanityFailure(error)) return { status: "unavailable" };
      throw error;
    }
    // Validation remains outside the transport catch; malformed content is an error.
    const published = mapLectureMonth(raw, month.key);
    const day = textSchedule(published.schedule).find((d) => d.date >= today);
    if (day) return { status: "ready", day, today: day.date === today };
  }
  return { status: "no-upcoming" };
}
