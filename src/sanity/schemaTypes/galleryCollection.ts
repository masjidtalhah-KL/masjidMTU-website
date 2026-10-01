import { defineArrayMember, defineField, defineType } from "sanity";
import { labelFor, slugField, titleField } from "./fields";

export const galleryCategoryOptions = [
  { title: "Interior Masjid", value: "interior" }, { title: "Program / Aktiviti", value: "activities" },
  { title: "Ramadan", value: "ramadan" }, { title: "Qurban", value: "qurban" },
];

export const galleryCollection = defineType({
  name: "galleryCollection", title: "Koleksi Galeri", type: "document",
  description: "Koleksi foto editorial; kategori Qurban/Ramadan tidak menyimpan data peserta atau transaksi.",
  fields: [
    titleField, slugField,
    defineField({ name: "description", title: "Penerangan (pilihan)", type: "text", rows: 3 }),
    defineField({ name: "category", title: "Kategori", type: "string", options: { list: galleryCategoryOptions }, validation: (rule) => rule.required() }),
    defineField({ name: "items", title: "Foto mengikut susunan", type: "array", of: [defineArrayMember({ type: "galleryMedia" })], description: "Susun foto melalui drag-and-drop. Susunan array menjadi susunan paparan.", validation: (rule) => rule.required().min(1) }),
  ],
  orderings: [{ title: "Tajuk A–Z", name: "titleAsc", by: [{ field: "title", direction: "asc" }] }],
  preview: {
    select: { title: "title", category: "category", items: "items", media: "items.0.image" },
    prepare: ({ title, category, items, media }) => ({ title: title || "Koleksi baharu", subtitle: `${labelFor(galleryCategoryOptions, category)} · ${Array.isArray(items) ? items.length : 0} foto`, media }),
  },
});
