import { PublicContentError } from "./read-policy";
import type { HomepageEditorial } from "./homepage-types";

type RecordValue = Record<string, unknown>;
const fail = (field: string): never => { throw new PublicContentError(`homepage-editorial: invalid ${field}`); };
const record = (value: unknown, field: string): RecordValue => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return fail(field);
  return value as RecordValue;
};
function text(value: unknown, field: string, max: number): string {
  if (typeof value !== "string" || !value.trim() || value.length > max) return fail(field);
  return value.trim();
}
function optionalText(value: unknown, field: string, max = Infinity): string | null {
  return value == null ? null : text(value, field, max);
}
function date(value: unknown, field: string): number {
  // Sanity datetimes carry an explicit offset. Reject rollover dates and locale-dependent input.
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) return fail(field);
  const timestamp = Date.parse(value);
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  const calendar = new Date(Date.UTC(year, month - 1, day));
  if (!Number.isFinite(timestamp) || calendar.getUTCFullYear() !== year || calendar.getUTCMonth() !== month - 1 || calendar.getUTCDate() !== day || Number(value.slice(11, 13)) > 23 || Number(value.slice(14, 16)) > 59 || Number(value.slice(17, 19)) > 59) return fail(field);
  return timestamp;
}
function optionalEnd(value: unknown, start: number, field: string): number | null {
  if (value == null) return null;
  const end = date(value, field);
  if (end < start) return fail(field);
  return end;
}
function controls(value: RecordValue, field: string) {
  if (typeof value.isActive !== "boolean") return fail(`${field}.isActive`);
  if (typeof value.displayOrder !== "number" || !Number.isSafeInteger(value.displayOrder) || value.displayOrder < 0) return fail(`${field}.displayOrder`);
  return { active: value.isActive, order: value.displayOrder };
}
function documents(value: unknown, type: string): RecordValue[] {
  if (!Array.isArray(value)) return fail(`${type} list`);
  const ids = new Set<string>();
  return value.map((item) => {
    const doc = record(item, type);
    const id = text(doc._id, `${type}._id`, Infinity);
    if (doc._type !== type || id.startsWith("drafts.") || id.startsWith("versions.") || ids.has(id)) return fail(`${type} identity`);
    ids.add(id);
    return doc;
  });
}
function cta(value: unknown): { label: string; url: string } | null {
  if (value == null) return null;
  const link = record(value, "announcement.cta");
  const label = text(link.label, "announcement.cta.label", 60);
  if (typeof link.url !== "string" || /\s|\\/.test(link.url)) return fail("announcement.cta.url");
  const url = text(link.url, "announcement.cta.url", Infinity);
  if (/\s|\\/.test(url) || url.startsWith("//")) return fail("announcement.cta.url");
  if (!(url.startsWith("/") || url.startsWith("#"))) {
    let parsed: URL;
    try { parsed = new URL(url); } catch { return fail("announcement.cta.url"); }
    if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password) return fail("announcement.cta.url");
  }
  return { label, url };
}
const dateFormat = new Intl.DateTimeFormat("ms-MY", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kuala_Lumpur" });
const timeFormat = new Intl.DateTimeFormat("ms-MY", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Kuala_Lumpur" });
const compareId = (a: { id: string }, b: { id: string }) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
const newsCategories: Record<string, string> = { news: "Berita", activity: "Aktiviti", announcement: "Pengumuman" };

export function mapHomepageEditorial(value: unknown, now = Date.now()): HomepageEditorial {
  if (!Number.isFinite(now)) return fail("server clock");
  const bundle = record(value, "bundle");
  // Validate every projected candidate before filtering or limiting; broken data remains visible.
  const announcements = documents(bundle.announcements, "announcement").map((doc) => {
    const published = date(doc.publishedAt, "announcement.publishedAt");
    return {
      id: doc._id as string, title: text(doc.title, "announcement.title", 160),
      description: text(doc.summary, "announcement.summary", 300), date: dateFormat.format(published),
      cta: cta(doc.cta), published, expires: optionalEnd(doc.expiresAt, published, "announcement.expiresAt"),
      ...controls(doc, "announcement"),
    };
  });
  const programs = documents(bundle.programs, "program").map((doc) => {
    const start = date(doc.startAt, "program.startAt");
    return {
      id: doc._id as string, title: text(doc.title, "program.title", 160),
      description: text(doc.description, "program.description", 400), category: optionalText(doc.category, "program.category"),
      date: dateFormat.format(start), time: timeFormat.format(start), start,
      end: optionalEnd(doc.endAt, start, "program.endAt"), ...controls(doc, "program"),
    };
  });
  const news = documents(bundle.news, "newsPost").map((doc) => {
    const published = date(doc.publishedAt, "newsPost.publishedAt");
    const category = optionalText(doc.category, "newsPost.category");
    if (category !== null && !Object.hasOwn(newsCategories, category)) return fail("newsPost.category");
    return {
      id: doc._id as string, title: text(doc.title, "newsPost.title", 160),
      description: text(doc.excerpt, "newsPost.excerpt", 300), category: category === null ? null : newsCategories[category],
      date: dateFormat.format(published), published,
    };
  });
  const selectedAnnouncement = announcements
    .filter((item) => item.active && item.published <= now && (item.expires === null || item.expires > now))
    .sort((a, b) => a.order - b.order || b.published - a.published || compareId(a, b))[0];
  return {
    source: "sanity",
    announcement: selectedAnnouncement ? {
      id: selectedAnnouncement.id, title: selectedAnnouncement.title, description: selectedAnnouncement.description,
      date: selectedAnnouncement.date, cta: selectedAnnouncement.cta,
    } : null,
    programs: programs.filter((item) => item.active && (item.start >= now || (item.end !== null && item.end > now)))
      .sort((a, b) => a.order - b.order || a.start - b.start || compareId(a, b)).slice(0, 3)
      .map(({ id, title, description, category, date, time }) => ({ id, title, description, category, date, time })),
    news: news.filter((item) => item.published <= now)
      .sort((a, b) => b.published - a.published || compareId(a, b)).slice(0, 3)
      .map(({ id, title, description, category, date }) => ({ id, title, description, category, date })),
  };
}

/** UI fallback only: these empty arrays never promote unapproved homepage mocks. */
export const unavailableHomepageEditorial = (): HomepageEditorial => ({
  source: "unavailable", announcement: null, programs: [], news: [],
});
