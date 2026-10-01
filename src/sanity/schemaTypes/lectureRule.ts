import { defineField, defineType } from "sanity";
import { lectureOccurrences, lectureSessionTypes, lectureWeekdays } from "../lecture-types";

export const lectureRule = defineType({
  name: "lectureRule", title: "Aturan kuliah (dalaman)", type: "document", readOnly: true,
  fields: [
    defineField({ name: "weekday", title: "Hari", type: "number", options: { list: lectureWeekdays.map((title, value) => ({ title, value })) }, validation: (r) => r.required().integer().min(0).max(6) }),
    defineField({ name: "occurrence", title: "Minggu", type: "number", options: { list: lectureOccurrences.map((title, value) => ({ title, value })) }, validation: (r) => r.required().integer().min(0).max(5) }),
    defineField({ name: "sessionType", title: "Jenis sesi", type: "string", options: { list: lectureSessionTypes }, validation: (r) => r.required().custom((value) => !value || lectureSessionTypes.some((type) => type.value === value) || "Pilih jenis sesi yang disediakan.") }),
    defineField({ name: "speaker", title: "Penceramah (pilihan)", type: "reference", to: [{ type: "lectureSpeaker" }] }),
    defineField({ name: "topic", title: "Tajuk / kitab (pilihan)", type: "string", validation: (r) => r.max(160) }),
    defineField({ name: "isActive", title: "Aktif", type: "boolean", validation: (r) => r.required() }),
  ],
  preview: {
    select: { weekday: "weekday", occurrence: "occurrence", sessionType: "sessionType", speaker: "speaker.name" },
    prepare: ({ weekday, occurrence, sessionType, speaker }) => ({ title: lectureSessionTypes.find(({ value }) => value === sessionType)?.title || "Aturan baharu", subtitle: [lectureWeekdays[weekday], lectureOccurrences[occurrence], speaker].filter(Boolean).join(" · ") }),
  },
});
