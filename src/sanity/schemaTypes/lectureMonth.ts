import { defineArrayMember, defineField, defineType } from "sanity";
import { lectureEditorMonths, lectureSessionTypes } from "../lecture-types";
import { validateImage } from "./fields";

type ScheduledDay = { date?: string; sessions?: unknown[] };

// A cleared manual day remains an entry, so applying rules cannot restore it accidentally.
export const lectureDay = defineType({
  name: "lectureDay", title: "Jadual date", type: "object",
  fields: [
    defineField({ name: "date", title: "Date", type: "date", validation: (r) => r.required() }),
    defineField({ name: "sessions", title: "Sessions", type: "array", of: [defineArrayMember({ type: "lectureSession" })], validation: (r) => r.required().max(2) }),
    defineField({ name: "isManualOverride", title: "Manual override for this date", type: "boolean", validation: (r) => r.required() }),
    defineField({
      name: "specialPoster", title: "Special program poster (optional)", type: "object",
      description: "Visual override for one date only. Saved sessions are preserved; remove the poster to reveal them.",
      validation: (r) => r.custom((value, context) => !value || (context.parent as { isManualOverride?: boolean })?.isManualOverride === true || "Special poster must be a manual override for this date."),
      fields: [
        defineField({ name: "image", title: "Original poster", type: "editorialImage", validation: (r) => r.required().custom(validateImage) }),
        defineField({ name: "fit", title: "Poster fit", type: "string", initialValue: "cover", options: { list: [{ title: "Fill cell (cover)", value: "cover" }, { title: "Show entire poster (contain)", value: "contain" }] }, validation: (r) => r.required().custom((value) => ["contain", "cover"].includes(value as string) || "Choose contain or cover.") }),
        defineField({ name: "position", title: "Poster position (cover)", type: "string", initialValue: "center", description: "Adjust cover cropping without changing original bytes; omitted position defaults to center.", options: { list: [{ title: "Top", value: "top" }, { title: "Center", value: "center" }, { title: "Bottom", value: "bottom" }] }, validation: (r) => r.custom((value) => !value || ["top", "center", "bottom"].includes(value as string) || "Choose top, center or bottom.") }),
        defineField({ name: "mode", title: "Mode", type: "string", initialValue: "full", hidden: true, options: { list: [{ title: "Full poster", value: "full" }] }, validation: (r) => r.required().custom((value) => value === "full" || "Only full mode is supported in this phase.") }),
      ],
    }),
  ],
  preview: { select: { title: "date", sessions: "sessions", manual: "isManualOverride", poster: "specialPoster" }, prepare: ({ title, sessions, manual, poster }) => ({ title: title || "New date", subtitle: `${sessions?.length || 0} sessions${poster ? " preserved · Full poster" : ""}${manual ? " · Manual" : ""}` }) },
});

export const lectureSession = defineType({
  name: "lectureSession", title: "Kuliah session", type: "object",
  fields: [
    defineField({ name: "sessionType", title: "Session type", type: "string", options: { list: lectureSessionTypes }, validation: (r) => r.required().custom((value) => !value || lectureSessionTypes.some((type) => type.value === value) || "Choose an available session type.") }),
    defineField({ name: "speaker", title: "Penceramah reference (optional)", type: "reference", to: [{ type: "lectureSpeaker" }] }),
    defineField({ name: "speakerName", title: "Poster name (optional)", type: "string", description: "Snapshot preserves the monthly poster after later Penceramah profile changes.", validation: (r) => r.max(160) }),
    defineField({ name: "topic", title: "Title / kitab (optional)", type: "string", validation: (r) => r.max(160) }),
    defineField({ name: "photo", title: "Photo snapshot (optional)", type: "editorialImage" }),
    defineField({ name: "photoLayout", title: "Photo snapshot layout (optional)", type: "object", description: "Preserve original snapshot fit and position without modifying the asset.", fields: [
      defineField({ name: "fit", title: "Fit", type: "string", options: { list: ["contain", "cover"] }, validation: r => r.custom(value => !value || ["contain", "cover"].includes(value as string) || "Invalid fit.") }),
      defineField({ name: "positionY", title: "Vertical position", type: "number", validation: r => r.min(0).max(100) }),
      defineField({ name: "zoom", title: "Zoom", type: "number", validation: r => r.min(1).max(1.6) }),
      defineField({ name: "borderInset", title: "Inset", type: "number", validation: r => r.min(0).max(20) }),
    ] }),
    defineField({ name: "sourceRule", title: "Source rule (optional)", type: "reference", to: [{ type: "lectureRule" }] }),
  ],
  preview: { select: { sessionType: "sessionType", speaker: "speakerName", topic: "topic", media: "photo" }, prepare: ({ sessionType, speaker, topic, media }) => ({ title: lectureSessionTypes.find(({ value }) => value === sessionType)?.title || "New session", subtitle: [speaker, topic].filter(Boolean).join(" · "), media }) },
});

export const lectureMonth = defineType({
  name: "lectureMonth", title: "Monthly Jadual (internal)", type: "document", readOnly: true,
  fields: [
    defineField({ name: "year", title: "Year", type: "number", validation: (r) => r.required().integer().min(2020).max(2100) }),
    defineField({ name: "month", title: "Month", type: "number", options: { list: lectureEditorMonths.map((title, index) => ({ title, value: index + 1 })) }, validation: (r) => r.required().integer().min(1).max(12) }),
    defineField({ name: "showInfaq", title: "Show Infaq panel", type: "boolean", initialValue: true, description: "Poster flag only. Compact QR resolves from published siteSettings.donationInfo.compactQr; no duplicated monthly QR or invented dates." }),
    defineField({
      name: "entries", title: "Dates and sessions", type: "array", of: [defineArrayMember({ type: "lectureDay" })],
      validation: (r) => r.required().max(31).custom((entries: ScheduledDay[] | undefined, context) => {
        if (!entries) return true;
        const document = context.document;
        if (!Number.isInteger(document?.year) || !Number.isInteger(document?.month)) return true;
        const prefix = `${document!.year}-${String(document!.month).padStart(2, "0")}-`;
        const dates = entries.map(({ date }) => date);
        if (new Set(dates).size !== dates.length) return "Each date may appear only once.";
        return entries.every(({ date }) => {
          if (!date || !date.startsWith(prefix)) return false;
          const parsed = new Date(`${date}T00:00:00Z`);
          return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === date;
        }) || "All dates must be valid and belong to this document month and year.";
      }).error(),
    }),
  ],
  orderings: [{ title: "Latest month", name: "latest", by: [{ field: "year", direction: "desc" }, { field: "month", direction: "desc" }] }],
  preview: { select: { year: "year", month: "month", entries: "entries" }, prepare: ({ year, month, entries }) => ({ title: month && year ? `${lectureEditorMonths[month - 1]} ${year}` : "New monthly Jadual", subtitle: `${entries?.reduce((sum: number, day: ScheduledDay) => sum + (day.sessions?.length || 0), 0) || 0} sessions` }) },
});
