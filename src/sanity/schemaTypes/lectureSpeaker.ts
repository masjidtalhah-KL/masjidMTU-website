import { defineField, defineType } from "sanity";

export const lectureSpeaker = defineType({
  name: "lectureSpeaker", title: "Penceramah (dalaman)", type: "document", readOnly: true,
  description: "Model persediaan penjana. Prototype belum menyimpan atau mempublish data.",
  fields: [
    defineField({ name: "name", title: "Nama", type: "string", validation: (r) => r.required().max(160) }),
    defineField({ name: "photo", title: "Foto (pilihan)", type: "editorialImage" }),
    defineField({ name: "defaultTopic", title: "Tajuk / kitab lalai (pilihan)", type: "string", validation: (r) => r.max(160) }),
    defineField({ name: "isActive", title: "Aktif", type: "boolean", validation: (r) => r.required() }),
  ],
  preview: { select: { title: "name", subtitle: "defaultTopic", media: "photo" }, prepare: ({ title, subtitle, media }) => ({ title: title || "Penceramah baharu", subtitle, media }) },
});
