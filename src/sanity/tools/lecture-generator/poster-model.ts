import {
  lectureMonths,
  lectureSessionTypes,
  lectureWeekdays,
} from "../../lecture-types";

export { lectureMonths, lectureSessionTypes, lectureWeekdays };
export type SessionType = "subuh" | "maghrib" | "jumaat" | "yasin";
export type CmsImage = {
  _type: "editorialImage" | "image";
  asset: { _type: "reference"; _ref: string };
  alt: string;
  crop?: { top: number; bottom: number; left: number; right: number };
  hotspot?: { x: number; y: number; width: number; height: number };
};
export type Speaker = {
  id: string;
  name: string;
  defaultTopic: string;
  isActive: boolean;
  photo?: {
    src: string;
    width: number;
    height: number;
    fit?: "contain" | "cover";
    positionY?: number;
    zoom?: number;
    borderInset?: number;
    cmsImage?: CmsImage;
    originalFile?: File;
    localHash?: string;
  };
};
export type RecurringRule = {
  id: string;
  weekday: number;
  occurrence: number;
  sessionType: SessionType;
  speakerId: string;
  topic: string;
  isActive: boolean;
};
export type Session = {
  id: string;
  sessionType: SessionType;
  speakerId: string;
  topic: string;
  sourceRuleId?: string;
  speakerName?: string;
  photo?: Speaker["photo"];
};
export type PosterImage = {
  src: string;
  width: number;
  height: number;
  alt: string;
  assetId?: string;
  localHash?: string;
  originalFile?: File;
  cmsImage?: CmsImage;
};
export type SpecialPoster = {
  image: PosterImage;
  fit: "contain" | "cover";
  position?: "top" | "center" | "bottom";
  mode: "full";
};
export type DayEntry = {
  day: number;
  sessions: Session[];
  isManualOverride: boolean;
  specialPoster?: SpecialPoster;
};
export type MonthSchedule = {
  year: number;
  month: number;
  entries: DayEntry[];
};
export type PosterSettings = {
  title: string;
  paper: "A4" | "A3";
  colours: Record<SessionType, string>;
  compactCalendar?: boolean;
  showInfaq?: boolean;
  generalDonationQr?: PosterImage;
  reviewLabel?: string;
  reviewMode?: "draft" | "demo" | "published" | "official";
  identity?: {
    name: string;
    addressLines: string[];
    phone?: string;
    logos?: string;
    mosquePhoto?: string;
    yasinBook?: string;
  };
};

export const defaultPosterSettings: PosterSettings = {
  title: "JADUAL KULIAH PENGAJIAN",
  paper: "A4",
  colours: {
    subuh: "#007aa3",
    maghrib: "#ed0b58",
    jumaat: "#007aa3",
    yasin: "#00a99d",
  },
  compactCalendar: true,
  showInfaq: true,
  // Owner-supplied general mosque QR, unchanged local original for 5.3A QA only.
  // Future Studio adapter resolves the mosque-wide donation source; never per-day art.
  generalDonationQr: {
    src: "/lecture-demo/general-mosque-qr.png",
    width: 853,
    height: 853,
    alt: "QR sumbangan umum Masjid Talhah Bin Ubaidillah",
  },
  identity: {
    name: "Masjid Talhah Bin Ubaidillah, Bukit Jalil",
    addressLines: [
      "TAMAN ALAM SUTERA, BUKIT JALIL,",
      "57000, KUALA LUMPUR, WILAYAH PERSEKUTUAN",
    ],
    phone: "03-8074 7414",
    logos: "/lecture-demo/header-logos.webp",
    mosquePhoto: "/lecture-demo/mosque-cutout.webp",
    yasinBook: "/lecture-demo/yasin-book.webp",
  },
};
export const sessionLabel = (type: SessionType) =>
  lectureSessionTypes.find(({ value }) => value === type)!.title;
export const monthKey = (year: number, month: number) =>
  `${year}-${String(month).padStart(2, "0")}`;
export const daysInMonth = (year: number, month: number) =>
  new Date(Date.UTC(year, month, 0)).getUTCDate();
export const calendarOffset = (year: number, month: number) =>
  (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7;
