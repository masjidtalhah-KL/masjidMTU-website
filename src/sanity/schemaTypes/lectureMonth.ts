import { defineArrayMember, defineField, defineType } from "sanity";
import { lectureMonths, lectureSessionTypes } from "../lecture-types";
import { validateImage } from "./fields";

type ScheduledDay = { date?: string; sessions?: unknown[] };

// A cleared manual day remains an entry, so applying rules cannot restore it accidentally.
export const lectureDay = defineType({
  name: "lectureDay", title: "Tarikh jadual", type: "object",
  fields: [
    defineField({ name: "date", title: "Tarikh", type: "date", validation: (r) => r.required() }),
    defineField({ name: "sessions", title: "Sesi", type: "array", of: [defineArrayMember({ type: "lectureSession" })], validation: (r) => r.required().max(2) }),
    defineField({ name: "isManualOverride", title: "Override manual bagi tarikh ini", type: "boolean", validation: (r) => r.required() }),
    defineField({
      name: "specialPoster", title: "Poster program khas (pilihan)", type: "object",
      description: "Override visual satu tarikh sahaja. Sesi tersimpan dikekalkan; buang poster untuk memaparkannya semula.",
      validation: (r) => r.custom((value, context) => !value || (context.parent as { isManualOverride?: boolean })?.isManualOverride === true || "Poster khas mestilah override manual bagi tarikh ini."),
      fields: [
        defineField({ name: "image", title: "Poster asal", type: "editorialImage", validation: (r) => r.required().custom(validateImage) }),
        defineField({ name: "fit", title: "Paparan gambar", type: "string", initialValue: "cover", options: { list: [{ title: "Penuhi kotak (cover)", value: "cover" }, { title: "Paparkan keseluruhan poster (contain)", value: "contain" }] }, validation: (r) => r.required().custom((value) => ["contain", "cover"].includes(value as string) || "Pilih contain atau cover.") }),
        defineField({ name: "position", title: "Posisi poster (cover)", type: "string", initialValue: "center", description: "Pilihan crop tanpa mengubah fail asal; nilai kosong menggunakan tengah.", options: { list: [{ title: "Atas", value: "top" }, { title: "Tengah", value: "center" }, { title: "Bawah", value: "bottom" }] }, validation: (r) => r.custom((value) => !value || ["top", "center", "bottom"].includes(value as string) || "Pilih atas, tengah atau bawah.") }),
        defineField({ name: "mode", title: "Mod", type: "string", initialValue: "full", hidden: true, options: { list: [{ title: "Poster penuh", value: "full" }] }, validation: (r) => r.required().custom((value) => value === "full" || "Hanya mod full disokong pada fasa ini.") }),
      ],
    }),
  ],
  preview: { select: { title: "date", sessions: "sessions", manual: "isManualOverride", poster: "specialPoster" }, prepare: ({ title, sessions, manual, poster }) => ({ title: title || "Tarikh baharu", subtitle: `${sessions?.length || 0} sesi${poster ? " tersimpan · Poster penuh" : ""}${manual ? " · Manual" : ""}` }) },
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
    defineField({ name: "showInfaq", title: "Papar ruang infaq", type: "boolean", initialValue: true, description: "Konfigurasi poster sahaja. QR umum diselesaikan daripada tetapan masjid; tiada asset QR berulang atau tarikh rekaan." }),
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
