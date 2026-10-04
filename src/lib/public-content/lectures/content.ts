import {
  PublicContentError,
  isTemporarySanityFailure,
} from "../cms/read-policy";
import {
  deserializeMonth,
  imageView,
  validateMonthDocument,
  type MonthDocument,
} from "../../../sanity/tools/lecture-generator/month-document";
import {
  lectureMonths,
  monthKey,
  sessionLabel,
  type MonthSchedule,
  type PosterImage,
} from "../../../sanity/tools/lecture-generator/model";

export type PublishedMonth = { key: string; label: string; href: string };
export type PublicLectureMonth = PublishedMonth & {
  schedule: MonthSchedule;
  showInfaq: boolean;
  compactQr?: PosterImage;
  infaqUnavailable: boolean;
};
export type LecturePageState =
  | { status: "empty" | "unavailable" | "not-found" }
  | {
      status: "ready";
      months: PublishedMonth[];
      month: PublicLectureMonth;
      previous?: PublishedMonth;
      next?: PublishedMonth;
      current: boolean;
      defaultFallback: boolean;
    };
const assetBase = "https://cdn.sanity.io/images/2o95jmms/production/";
export function publicMonthKey(value: string) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) return false;
  const year = Number(value.slice(0, 4));
  return year >= 2000 && year <= 2100;
}
export function monthLabel(key: string) {
  return `${lectureMonths[Number(key.slice(5)) - 1]} ${key.slice(0, 4)}`;
}
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new PublicContentError("Invalid published lecture content.");
  return value as Record<string, unknown>;
}
export function mapLectureIndex(value: unknown): PublishedMonth[] {
  if (!Array.isArray(value))
    throw new PublicContentError("Invalid published lecture month index.");
  const keys = new Set<string>();
  return value
    .map((item) => {
      const doc = record(item);
      if (!Number.isInteger(doc.year) || !Number.isInteger(doc.month))
        throw new PublicContentError("Invalid published month/year.");
      const key = monthKey(doc.year as number, doc.month as number);
      if (
        !publicMonthKey(key) ||
        doc._type !== "lectureMonth" ||
        doc._id !== `lectureMonth-${key}` ||
        keys.has(key)
      )
        throw new PublicContentError(
          "Invalid or duplicate published month identity.",
        );
      keys.add(key);
      return { key, label: monthLabel(key), href: `/kuliah/${key}` };
    })
    .sort((a, b) => a.key.localeCompare(b.key));
}
export function mapLectureMonth(
  value: unknown,
  key: string,
): PublicLectureMonth {
  try {
    const result = record(value),
      doc = record(result.document) as unknown as MonthDocument;
    if (doc._id !== `lectureMonth-${key}`)
      throw new Error("Published month identity differs.");
    validateMonthDocument(doc);
    if (!Array.isArray(result.portraits) || !Array.isArray(result.posters))
      throw new Error("Missing image resolution result.");
    const resolved = new Set(
      [...result.portraits, ...result.posters].filter(Boolean).map((item) => {
        const asset = record(item);
        if (
          asset._type !== "sanity.imageAsset" ||
          typeof asset._id !== "string"
        )
          throw new Error("Invalid resolved image.");
        return asset._id;
      }),
    );
    for (const entry of doc.entries) {
      for (const session of entry.sessions)
        if (session.photo && !resolved.has(session.photo.asset._ref))
          throw new Error("Unresolved published portrait.");
      if (
        entry.specialPoster &&
        !resolved.has(entry.specialPoster.image.asset._ref)
      )
        throw new Error("Unresolved published special poster.");
    }
    const schedule = deserializeMonth(doc, "2o95jmms", "production");
    let compactQr: PosterImage | undefined;
    if (result.compactQr) {
      const qr = record(result.compactQr);
      compactQr = imageView(
        qr as Parameters<typeof imageView>[0],
        "2o95jmms",
        "production",
      );
      if (
        compactQr.width !== compactQr.height ||
        qr.crop ||
        qr.hotspot ||
        record(result.compactAsset)._id !== compactQr.assetId ||
        record(result.compactAsset)._type !== "sanity.imageAsset"
      )
        throw new Error("Invalid compact Infaq QR.");
      if (!compactQr.src.startsWith(assetBase))
        throw new Error("Invalid image source.");
    }
    return {
      key,
      label: monthLabel(key),
      href: `/kuliah/${key}`,
      schedule,
      showInfaq: doc.showInfaq ?? true,
      compactQr,
      infaqUnavailable: (doc.showInfaq ?? true) && !compactQr,
    };
  } catch (error) {
    if (error instanceof PublicContentError) throw error;
    throw new PublicContentError(
      "Malformed published lecture month or unresolved image reference.",
    );
  }
}
export function currentMonthKey(now: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kuala_Lumpur",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(now);
  return `${parts.find((p) => p.type === "year")!.value}-${parts.find((p) => p.type === "month")!.value}`;
}
export async function loadLecturePage(
  readIndex: () => Promise<unknown>,
  readMonth: (key: string) => Promise<unknown>,
  requested?: string,
  now = new Date(),
): Promise<LecturePageState> {
  if (requested && !publicMonthKey(requested)) return { status: "not-found" };
  let raw: unknown;
  try {
    raw = await readIndex();
  } catch (error) {
    if (isTemporarySanityFailure(error)) return { status: "unavailable" };
    throw error;
  }
  const months = mapLectureIndex(raw),
    currentKey = currentMonthKey(now);
  if (!months.length) return { status: requested ? "not-found" : "empty" };
  const selected =
    requested ||
    (months.some((m) => m.key === currentKey)
      ? currentKey
      : months.at(-1)!.key);
  const index = months.findIndex((m) => m.key === selected);
  if (index < 0) return { status: "not-found" };
  try {
    raw = await readMonth(selected);
  } catch (error) {
    if (isTemporarySanityFailure(error)) return { status: "unavailable" };
    throw error;
  }
  const month = mapLectureMonth(raw, selected);
  return {
    status: "ready",
    months,
    month,
    previous: months[index - 1],
    next: months[index + 1],
    current: selected === currentKey,
    defaultFallback: !requested && selected !== currentKey,
  };
}
export function textSchedule(schedule: MonthSchedule) {
  return [...schedule.entries]
    .sort((a, b) => a.day - b.day)
    .filter((e) => e.specialPoster || e.sessions.length)
    .map((entry) => {
      const date = `${monthKey(schedule.year, schedule.month)}-${String(entry.day).padStart(2, "0")}`;
      const label = new Intl.DateTimeFormat("ms-MY", {
        timeZone: "Asia/Kuala_Lumpur",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(date + "T12:00:00+08:00"));
      return {
        date,
        label,
        ...(entry.specialPoster
          ? { specialPoster: entry.specialPoster }
          : {
              sessions: entry.sessions.map((s) => ({
                id: s.id,
                label: sessionLabel(s.sessionType),
                speaker: s.speakerName?.trim() || undefined,
                topic: s.topic.trim() || undefined,
              })),
            }),
      };
    });
}
