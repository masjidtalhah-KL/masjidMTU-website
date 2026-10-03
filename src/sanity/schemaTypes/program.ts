import { defineField, defineType } from "sanity";
import { displayOrderField, displayOrderOrdering, isActiveField, slugField, titleField, validateEndDate, validateImage } from "./fields";

export const program = defineType({
  name: "program", title: "Program", type: "document",
  description: "Maklumat program awam sahaja; peserta dan pendaftaran diurus melalui sistem operasi berasingan.",
  fields: [
    titleField, slugField,
    defineField({ name: "description", title: "Penerangan ringkas", type: "text", rows: 3, validation: (rule) => rule.required().max(400) }),
    defineField({ name: "category", title: "Kategori", type: "string", description: "Label kategori program untuk kad homepage." }),
    defineField({ name: "image", title: "Gambar program (pilihan)", type: "editorialImage", validation: (rule) => rule.custom(validateImage).error() }),
    defineField({ name: "scheduleType", title: "Jenis jadual", type: "string", options: { list: [{ title: "Program berjadual", value: "scheduled" }, { title: "Inisiatif berterusan", value: "ongoing" }] }, description: "Jika kosong, dianggap program berjadual. Inisiatif berterusan dikawal melalui Aktif; jangan cipta tarikh tamat.", validation: (rule) => rule.custom((value) => value === undefined || value === "scheduled" || value === "ongoing" || "Pilih jenis jadual yang sah.") }),
    defineField({ name: "startAt", title: "Tarikh dan waktu mula", type: "datetime", description: "Wajib untuk program berjadual. Untuk inisiatif berterusan, isi hanya jika tarikh dan waktu sebenar diketahui.", validation: (rule) => rule.custom((value, context) => context.document?.scheduleType === "ongoing" || !!value || "Tarikh dan waktu mula diperlukan untuk program berjadual.") }),
    defineField({ name: "endAt", title: "Tarikh dan waktu tamat", type: "datetime", validation: (rule) => rule.custom((value, context) => validateEndDate(value, context.document?.startAt, "Waktu tamat tidak boleh mendahului waktu mula.")) }),
    defineField({ name: "venue", title: "Tempat", type: "string" }),
    defineField({ name: "registrationUrl", title: "URL pendaftaran luar (pilihan)", type: "url", validation: (rule) => rule.uri({ scheme: ["http", "https"] }) }),
    displayOrderField, isActiveField,
  ],
  orderings: [{ title: "Tarikh mula", name: "startAtAsc", by: [{ field: "startAt", direction: "asc" }] }, displayOrderOrdering],
  preview: { select: { title: "title", category: "category", media: "image", active: "isActive" }, prepare: ({ title, category, media, active }) => ({ title: title || "Program baharu", subtitle: [category, active === true ? "Aktif" : "Tidak aktif / belum ditetapkan"].filter(Boolean).join(" · "), media }) },
});
