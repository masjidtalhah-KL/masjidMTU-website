import { defineField, defineType } from "sanity";
import { lectureEditorOccurrences, lectureSessionTypes, lectureEditorWeekdays } from "../lecture-types";

export const lectureRule = defineType({
  name: "lectureRule", title: "Kuliah recurring rule (internal)", type: "document", readOnly: true,
  fields: [
    defineField({ name: "weekday", title: "Weekday", type: "number", options: { list: lectureEditorWeekdays.map((title, value) => ({ title, value })) }, validation: (r) => r.required().integer().min(0).max(6) }),
    defineField({ name: "occurrence", title: "Occurrence", type: "number", options: { list: lectureEditorOccurrences.map((title, value) => ({ title, value })) }, validation: (r) => r.required().integer().min(0).max(5) }),
    defineField({ name: "sessionType", title: "Session type", type: "string", options: { list: lectureSessionTypes }, validation: (r) => r.required().custom((value) => !value || lectureSessionTypes.some((type) => type.value === value) || "Choose an available session type.") }),
    defineField({ name: "speaker", title: "Penceramah (optional)", type: "reference", to: [{ type: "lectureSpeaker" }] }),
    defineField({ name: "topic", title: "Title / kitab (optional)", type: "string", validation: (r) => r.max(160) }),
    defineField({ name: "isActive", title: "Active", type: "boolean", validation: (r) => r.required() }),
  ],
  preview: {
    select: { weekday: "weekday", occurrence: "occurrence", sessionType: "sessionType", speaker: "speaker.name" },
    prepare: ({ weekday, occurrence, sessionType, speaker }) => ({ title: lectureSessionTypes.find(({ value }) => value === sessionType)?.title || "New rule", subtitle: [lectureEditorWeekdays[weekday], lectureEditorOccurrences[occurrence], speaker].filter(Boolean).join(" · ") }),
  },
});
