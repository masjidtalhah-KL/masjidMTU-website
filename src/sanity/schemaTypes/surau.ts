import { defineField, defineType } from "sanity";
import { displayOrderField, displayOrderOrdering, isActiveField, labelFor, validateImage } from "./fields";

export const surauCategoryOptions = [{ title: "Surau Jumaat", value: "jumaat" }, { title: "Surau Biasa", value: "biasa" }];

export const surau = defineType({
  name: "surau", title: "Surau Kariah", type: "document",
  fields: [
    defineField({ name: "name", title: "Nama rasmi surau", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "category", title: "Kategori", type: "string", options: { list: surauCategoryOptions }, validation: (rule) => rule.required() }),
    defineField({ name: "logo", title: "Logo (pilihan)", type: "editorialImage", options: { hotspot: false }, description: "Kekalkan logo asal tanpa crop atau ubah bentuk.", validation: (rule) => rule.custom(validateImage).error() }),
    defineField({ name: "address", title: "Alamat (pilihan)", type: "text", rows: 3, description: "Alamat tersedia dalam sumber tempatan Fasa 3.1. Isi hanya alamat yang disahkan." }),
    displayOrderField, isActiveField,
  ],
  orderings: [displayOrderOrdering],
  preview: { select: { title: "name", category: "category", media: "logo" }, prepare: ({ title, category, media }) => ({ title: title || "Surau baharu", subtitle: labelFor(surauCategoryOptions, category), media }) },
});
