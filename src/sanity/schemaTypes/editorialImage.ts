import { defineField, defineType } from "sanity";
import { hasImageAsset, validateImage } from "./fields";

export const editorialImage = defineType({
  name: "editorialImage", title: "Gambar", type: "image",
  options: { hotspot: true },
  validation: (rule) => rule.custom(validateImage).error(),
  fields: [defineField({
    name: "alt", title: "Penerangan gambar (alt text)", type: "string",
    description: "Terangkan gambar secara ringkas untuk pembaca skrin; jangan gunakan nama fail.",
    validation: (rule) => rule.custom((value, context) => !hasImageAsset(context.parent) || !!value?.trim() || "Penerangan gambar diperlukan apabila gambar dipilih."),
  })],
});
