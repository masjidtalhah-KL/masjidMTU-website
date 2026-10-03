import { defineField, defineType } from "sanity";
import { slugField, titleField, validateBody, validateImage } from "./fields";
import { parseCalendarDate } from "../../lib/calendar-date";

export const newsPost = defineType({
  name: "newsPost", title: "Berita & Aktiviti", type: "document",
  fields: [
    titleField, slugField,
    defineField({ name: "excerpt", title: "Ringkasan", type: "text", rows: 3, validation: (rule) => rule.required().max(300) }),
    defineField({ name: "image", title: "Gambar utama (pilihan)", type: "editorialImage", validation: (rule) => rule.custom(validateImage).error() }),
    defineField({ name: "body", title: "Kandungan artikel", type: "blockContent", validation: (rule) => rule.required().min(1).custom(validateBody) }),
    defineField({
      name: "eventDate", title: "Tarikh acara (pilihan)", type: "date",
      description: "Tarikh sebenar aktiviti atau acara berlangsung. Berbeza daripada tarikh artikel diterbitkan di laman web.",
      validation: (rule) => rule.custom((value) => value == null || parseCalendarDate(value) !== null || "Masukkan tarikh acara yang sah (YYYY-MM-DD)."),
    }),
    defineField({ name: "publishedAt", title: "Tarikh penerbitan", type: "datetime", validation: (rule) => rule.required() }),
    defineField({ name: "category", title: "Kategori (pilihan)", type: "string", options: { list: [{ title: "Berita", value: "news" }, { title: "Aktiviti", value: "activity" }, { title: "Pengumuman", value: "announcement" }] } }),
  ],
  orderings: [{ title: "Terbaharu dahulu", name: "publishedAtDesc", by: [{ field: "publishedAt", direction: "desc" }] }],
  preview: { select: { title: "title", media: "image", date: "publishedAt" }, prepare: ({ title, media, date }) => ({ title: title || "Artikel baharu", subtitle: date ? `Diterbitkan: ${date.slice(0, 10)}` : "Tarikh belum ditetapkan", media }) },
});
