export * from "./poster-model";
import { lectureMonths, monthKey, daysInMonth, type DayEntry, type MonthSchedule, type RecurringRule, type Session, type SessionType, type Speaker, type SpecialPoster } from "./poster-model";

// Fictional, in-memory timetable. Selected upstream portraits are visual QA assets only,
// not these people's names, attendance or appointments. See the poster provenance notice.
export const demoSpeakers: Speaker[] = [
  { id: "demo-a", name: "Penceramah Contoh A", defaultTopic: "Tafsir — contoh", isActive: true, photo: { src: "/lecture-demo/speaker-a.webp", width: 225, height: 236, fit: "contain" } },
  { id: "demo-b", name: "Penceramah Contoh B", defaultTopic: "Fiqh — contoh", isActive: true, photo: { src: "/lecture-demo/speaker-b.webp", width: 234, height: 231, fit: "contain", borderInset: 4 } },
  { id: "demo-c", name: "Penceramah Contoh C", defaultTopic: "Adab — contoh", isActive: true, photo: { src: "/lecture-demo/speaker-c.webp", width: 214, height: 226, fit: "contain" } },
];
export const demoRules: RecurringRule[] = [
  { id: "rule-a", weekday: 1, occurrence: 1, sessionType: "maghrib", speakerId: "demo-a", topic: "Tafsir — contoh", isActive: true },
  { id: "rule-b", weekday: 6, occurrence: 2, sessionType: "subuh", speakerId: "demo-b", topic: "Fiqh — contoh", isActive: true },
  { id: "rule-c", weekday: 4, occurrence: 0, sessionType: "yasin", speakerId: "", topic: "Bacaan bersama — contoh", isActive: true },
];

export function applyRecurringRules(year: number, month: number, rules: RecurringRule[], previous: DayEntry[] = []): DayEntry[] {
  const entries: DayEntry[] = [];
  for (let day = 1; day <= daysInMonth(year, month); day++) {
    const existing = previous.find((entry) => entry.day === day);
    if (existing?.isManualOverride) { entries.push(existing); continue; }
    const generated = generatedDay(year, month, day, rules);
    if (generated) entries.push(generated);
  }
  return entries;
}

function generatedDay(year: number, month: number, day: number, rules: RecurringRule[]): DayEntry | undefined {
  const order: Record<SessionType, number> = { subuh: 0, jumaat: 1, maghrib: 2, yasin: 2 };
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  const occurrence = Math.ceil(day / 7);
  const matches = rules.filter((rule) => rule.isActive && rule.weekday === weekday && (rule.occurrence === 0 || rule.occurrence === occurrence));
  if (matches.length > 2) throw new Error(`${day} ${lectureMonths[month - 1]} has more than two sessions. Adjust the rules before applying.`);
  if (matches.length) return { day, isManualOverride: false, sessions: matches.map((rule) => ({ id: `${rule.id}-${day}`, sessionType: rule.sessionType, speakerId: rule.speakerId, topic: rule.topic, sourceRuleId: rule.id })).sort((a, b) => order[a.sessionType] - order[b.sessionType]) };
}

export function updateDay(schedule: MonthSchedule, day: number, sessions: Session[]): MonthSchedule {
  assertScheduleDay(schedule, day);
  if (sessions.length > 2) throw new Error("Maximum two sessions per date.");
  const existing = schedule.entries.find((entry) => entry.day === day);
  return { ...schedule, entries: [...schedule.entries.filter((entry) => entry.day !== day), { ...existing, day, sessions, isManualOverride: true }].sort((a, b) => a.day - b.day) };
}

function assertScheduleDay(schedule: MonthSchedule, day: number) {
  if (!Number.isInteger(day) || day < 1 || day > daysInMonth(schedule.year, schedule.month)) throw new Error("Select a valid date in this month.");
}

/** A visual override preserves the exact underlying sessions, including generated sessions. */
export function updateSpecialPoster(schedule: MonthSchedule, day: number, specialPoster?: SpecialPoster): MonthSchedule {
  assertScheduleDay(schedule, day);
  if (specialPoster && (specialPoster.mode !== "full" || !["contain", "cover"].includes(specialPoster.fit) || (specialPoster.position !== undefined && !["top", "center", "bottom"].includes(specialPoster.position)) || !specialPoster.image.alt.trim() || !specialPoster.image.src || !Number.isFinite(specialPoster.image.width) || !Number.isFinite(specialPoster.image.height) || specialPoster.image.width <= 0 || specialPoster.image.height <= 0)) throw new Error("Poster requires a valid image, alt text and fit.");
  const existing = schedule.entries.find((entry) => entry.day === day);
  const entry: DayEntry = { ...existing, day, sessions: existing?.sessions ?? [], isManualOverride: true };
  if (specialPoster) entry.specialPoster = specialPoster;
  else delete entry.specialPoster;
  return { ...schedule, entries: [...schedule.entries.filter((entry) => entry.day !== day), entry].sort((a, b) => a.day - b.day) };
}

/** Explicitly restore this date only; other generated and manual dates remain untouched. */
export function restoreScheduleDay(schedule: MonthSchedule, day: number, rules: RecurringRule[]): MonthSchedule {
  assertScheduleDay(schedule, day);
  const restored = generatedDay(schedule.year, schedule.month, day, rules);
  return { ...schedule, entries: [...schedule.entries.filter((entry) => entry.day !== day), ...(restored ? [restored] : [])].sort((a, b) => a.day - b.day) };
}

export function lectureMonthDocumentId(year: number, month: number): string {
  if (!Number.isInteger(year) || year < 2020 || year > 2100 || !Number.isInteger(month) || month < 1 || month > 12) throw new Error("Invalid Jadual month or year.");
  return `lectureMonth-${monthKey(year, month)}`;
}

// Independently authored, non-production artwork. The same image is reused on both dates.
export const demoSpecialPoster: SpecialPoster = {
  mode: "full", fit: "cover", position: "center",
  image: { src: "/lecture-demo/special-event-demo.png", width: 780, height: 480, alt: "Poster program khas rekaan untuk QA 24 dan 25 hb. Bukan program sebenar." },
};

export function createReviewSchedule(): MonthSchedule {
  let schedule = createDemoSchedule();
  for (const day of [24, 25]) schedule = updateSpecialPoster(schedule, day, demoSpecialPoster);
  return schedule;
}

export function createDemoSchedule(): MonthSchedule {
  let schedule: MonthSchedule = { year: 2026, month: 10, entries: applyRecurringRules(2026, 10, demoRules) };
  // Poster fidelity fixtures only; recurring rules and their behaviour are unchanged.
  const example = (day: number, type: SessionType, speakerId: string, topic: string): Session => ({ id: `demo-${day}-${type}`, sessionType: type, speakerId, topic });
  for (const day of [1, 8, 15, 22, 29]) schedule = updateDay(schedule, day, [example(day, "yasin", "", "BACAAN YASIN\n& TAHLIL")]);
  for (const day of [6, 7, 12, 13, 14, 19, 20, 21, 26, 28]) {
    schedule = updateDay(schedule, day, [example(day, "maghrib", ["demo-a", "demo-b", "demo-c"][day % 3], day % 2 ? "ADAB & AKHLAK" : "TAFSIR AL-QURAN")]);
  }
  for (const day of [4, 17, 25]) schedule = updateDay(schedule, day, [example(day, "subuh", "demo-b", "FIQH IBADAH")]);
  for (const day of [2, 9, 16, 23, 30]) schedule = updateDay(schedule, day, [example(day, "jumaat", day === 2 || day === 23 ? "" : "demo-c", "UMUM")]);
  for (const day of [3, 11, 18, 24]) schedule = updateDay(schedule, day, [example(day, "subuh", "demo-b", "PENGAJIAN HADIS"), example(day, "maghrib", "demo-a", "AL-QURAN & TAJWID")]);
  return schedule;
}
