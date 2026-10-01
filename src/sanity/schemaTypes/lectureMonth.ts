import { defineArrayMember, defineField, defineType } from "sanity";
import { lectureMonths, lectureSessionTypes } from "../lecture-types";

type ScheduledDay = { date?: string; sessions?: unknown[] };

// A cleared manual day remains an entry, so applying rules cannot restore it accidentally.
export const lectureDay = defineType({
  name: "lectureDay", title: "Tarikh jadual", type: "object",
  fields: [
    defineField({ name: "date", title: "Tarikh", type: "date", validation: (r) => r.required() }),
    defineField({ name: "sessions", title: "Sesi", type: "array", of: [defineArrayMember({ type: "lectureSession" })], validation: (r) => r.required().max(2) }),
    defineField({ name: "isManualOverride", title: "Override manual bagi tarikh ini", type: "boolean", validation: (r) => r.required() }),
  ],
  preview: { select: { title: "date", sessions: "sessions", manual: "isManualOverride" }, prepare: ({ title, sessions, manual }) => ({ title: title || "Tarikh baharu", subtitle: `${sessions?.length || 0} sesi${manual ? " · Manual" : ""}` }) },
});

export const lectureSession = defineType({
  name: "lectureSession", title: "Sesi kuliah", type: "object",
  fields: [
    defineField({ name: "sessionType", title: "Jenis sesi", type: "string", options: { list: lectureSessionTypes }, validation: (r) => r.required().custom((value) => !value || lectureSessionTypes.some((type) => type.value === value) || "Pilih jenis sesi yang disediakan.") }),
    defineField({ name: "speaker", title: "Rujukan penceramah (pilihan)", type: "reference", to: [{ type: "lectureSpeaker" }] }),
    defineField({ name: "speakerName", title: "Nama pada poster (pilihan)", type: "string", description: "Snapshot untuk mengekalkan poster yang telah dipublish apabila profil penceramah berubah kemudian.", validation: (r) => r.max(160) }),
    defineField({ name: "topic", title: "Tajuk / kitab (pilihan)", type: "string", validation: (r) => r.max(160) }),
    defineField({ name: "photo", title: "Foto snapshot (pilihan)", type: "editorialImage" }),
    defineField({ name: "sourceRule", title: "Aturan asal (pilihan)", type: "reference", to: [{ type: "lectureRule" }] }),
  ],
  preview: { select: { sessionType: "sessionType", speaker: "speakerName", topic: "topic", media: "photo" }, prepare: ({ sessionType, speaker, topic, media }) => ({ title: lectureSessionTypes.find(({ value }) => value === sessionType)?.title || "Sesi baharu", subtitle: [speaker, topic].filter(Boolean).join(" · "), media }) },
});

export const lectureMonth = defineType({
  name: "lectureMonth", title: "Jadual bulanan (dalaman)", type: "document", readOnly: true,
  fields: [
    defineField({ name: "year", title: "Tahun", type: "number", validation: (r) => r.required().integer().min(2020).max(2100) }),
    defineField({ name: "month", title: "Bulan", type: "number", options: { list: lectureMonths.map((title, index) => ({ title, value: index + 1 })) }, validation: (r) => r.required().integer().min(1).max(12) }),
    defineField({
      name: "entries", title: "Tarikh dan sesi berurutan", type: "array", of: [defineArrayMember({ type: "lectureDay" })],
      validation: (r) => r.required().max(31).custom((entries: ScheduledDay[] | undefined, context) => {
        if (!entries) return true;
        const document = context.document;
        if (!Number.isInteger(document?.year) || !Number.isInteger(document?.month)) return true;
        const prefix = `${document!.year}-${String(document!.month).padStart(2, "0")}-`;
        const dates = entries.map(({ date }) => date);
        if (new Set(dates).size !== dates.length) return "Setiap tarikh hanya boleh muncul sekali.";
        return entries.every(({ date }) => {
          if (!date || !date.startsWith(prefix)) return false;
          const parsed = new Date(`${date}T00:00:00Z`);
          return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === date;
        }) || "Semua tarikh mesti sah dan berada dalam bulan/tahun dokumen ini.";
      }).error(),
    }),
  ],
  orderings: [{ title: "Bulan terbaru", name: "latest", by: [{ field: "year", direction: "desc" }, { field: "month", direction: "desc" }] }],
  preview: { select: { year: "year", month: "month", entries: "entries" }, prepare: ({ year, month, entries }) => ({ title: month && year ? `${lectureMonths[month - 1]} ${year}` : "Jadual bulanan baharu", subtitle: `${entries?.reduce((sum: number, day: ScheduledDay) => sum + (day.sessions?.length || 0), 0) || 0} sesi` }) },
});
