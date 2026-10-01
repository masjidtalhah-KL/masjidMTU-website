import { defineField, defineType } from "sanity";
import { validateImage } from "./fields";

export const galleryMedia = defineType({
  name: "galleryMedia", title: "Foto", type: "object",
  fields: [
    defineField({ name: "image", title: "Gambar", type: "editorialImage", validation: (rule) => rule.required().custom(validateImage).error() }),
    defineField({ name: "title", title: "Tajuk / ruang", type: "string", description: "Pilihan, contohnya nama ruang yang memang diketahui." }),
    defineField({ name: "caption", title: "Kapsyen", type: "string" }),
  ],
  preview: {
    select: { title: "title", caption: "caption", alt: "image.alt", media: "image" },
    prepare: ({ title, caption, alt, media }) => ({ title: title || caption || alt || "Foto belum diisi", subtitle: caption, media }),
  },
});
