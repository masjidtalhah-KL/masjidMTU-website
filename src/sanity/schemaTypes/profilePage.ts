import { defineArrayMember, defineField, defineType } from "sanity";
import { validateBody } from "./fields";

export const PROFILE_PAGE_TYPE = "profilePage";
export const PROFILE_PAGE_ID = "profilePage";

export const profilePage = defineType({
  name: PROFILE_PAGE_TYPE, title: "Profil Masjid", type: "document",
  fields: [
    defineField({ name: "introduction", title: "Pengenalan", type: "paragraphText", validation: (rule) => rule.required().min(1).custom(validateBody) }),
    defineField({ name: "sourceNote", title: "Nota sumber pengenalan (pilihan)", type: "string" }),
    defineField({ name: "vision", title: "Visi", type: "text", rows: 4, validation: (rule) => rule.required() }),
    defineField({ name: "mission", title: "Misi", type: "text", rows: 4, validation: (rule) => rule.required() }),
    defineField({ name: "motto", title: "Moto", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "logoRationale", title: "Rasional Logo", type: "paragraphText", description: "Penerangan logo rasmi. Fail logo kekal aset brand yang diluluskan.", validation: (rule) => rule.required().min(1).custom(validateBody) }),
    defineField({ name: "spaceImages", title: "Ruang & Seni Bina Masjid", type: "array", of: [defineArrayMember({ type: "galleryMedia" })], description: "Sehingga lima foto, mengikut susunan komposisi halaman Profil yang telah diluluskan. Susun melalui drag-and-drop.", validation: (rule) => rule.max(5) }),
  ],
  preview: { prepare: () => ({ title: "Profil Masjid", subtitle: "Pengenalan, visi, misi, moto dan rasional logo" }) },
});
