import { lectureMonths, lectureSessionTypes, lectureWeekdays } from "../../lecture-types";

export { lectureMonths, lectureSessionTypes, lectureWeekdays };
export type SessionType = "subuh" | "maghrib" | "jumaat" | "yasin";
export type Speaker = { id: string; name: string; defaultTopic: string; isActive: boolean; photo?: { src: string; width: number; height: number; fit?: "contain" | "cover"; positionY?: number; zoom?: number; borderInset?: number } };
export type RecurringRule = { id: string; weekday: number; occurrence: number; sessionType: SessionType; speakerId: string; topic: string; isActive: boolean };
export type Session = { id: string; sessionType: SessionType; speakerId: string; topic: string; sourceRuleId?: string };
export type DayEntry = { day: number; sessions: Session[]; isManualOverride: boolean };
export type MonthSchedule = { year: number; month: number; entries: DayEntry[] };
export type PosterSettings = { title: string; paper: "A4" | "A3"; colours: Record<SessionType, string>; compactCalendar?: boolean; identity?: { name: string; addressLines: string[]; phone?: string; logos?: string; mosquePhoto?: string; yasinBook?: string } };

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
export const defaultPosterSettings: PosterSettings = {
  title: "JADUAL KULIAH PENGAJIAN", paper: "A4",
  colours: { subuh: "#007aa3", maghrib: "#ed0b58", jumaat: "#007aa3", yasin: "#00a99d" },
  compactCalendar: true,
  identity: { name: "Masjid Talhah Bin Ubaidillah, Bukit Jalil", addressLines: ["TAMAN ALAM SUTERA, BUKIT JALIL,", "57000, KUALA LUMPUR, WILAYAH PERSEKUTUAN"], phone: "03-8074 7414", logos: "/lecture-demo/header-logos.webp", mosquePhoto: "/lecture-demo/mosque-cutout.webp", yasinBook: "/lecture-demo/yasin-book.webp" },
};
export const sessionLabel = (type: SessionType) => lectureSessionTypes.find(({ value }) => value === type)!.title;
export const monthKey = (year: number, month: number) => `${year}-${String(month).padStart(2, "0")}`;
export const daysInMonth = (year: number, month: number) => new Date(Date.UTC(year, month, 0)).getUTCDate();
export const calendarOffset = (year: number, month: number) => (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7;

export function applyRecurringRules(year: number, month: number, rules: RecurringRule[], previous: DayEntry[] = []): DayEntry[] {
  const entries: DayEntry[] = [];
  const order: Record<SessionType, number> = { subuh: 0, jumaat: 1, maghrib: 2, yasin: 2 };
  for (let day = 1; day <= daysInMonth(year, month); day++) {
    const existing = previous.find((entry) => entry.day === day);
    if (existing?.isManualOverride) { entries.push(existing); continue; }
    const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
    const occurrence = Math.ceil(day / 7);
    const matches = rules.filter((rule) => rule.isActive && rule.weekday === weekday && (rule.occurrence === 0 || rule.occurrence === occurrence));
    if (matches.length > 2) throw new Error(`${day} ${lectureMonths[month - 1]} mempunyai lebih daripada dua sesi. Laraskan aturan sebelum menerapkannya.`);
    if (matches.length) entries.push({ day, isManualOverride: false, sessions: matches.map((rule) => ({ id: `${rule.id}-${day}`, sessionType: rule.sessionType, speakerId: rule.speakerId, topic: rule.topic, sourceRuleId: rule.id })).sort((a, b) => order[a.sessionType] - order[b.sessionType]) });
  }
  return entries;
}

export function updateDay(schedule: MonthSchedule, day: number, sessions: Session[]): MonthSchedule {
  if (sessions.length > 2) throw new Error("Maksimum dua sesi bagi setiap tarikh.");
  return { ...schedule, entries: [...schedule.entries.filter((entry) => entry.day !== day), { day, sessions, isManualOverride: true }].sort((a, b) => a.day - b.day) };
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
