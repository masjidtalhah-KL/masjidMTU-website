import { defineField, defineType } from "sanity";

export const SITE_SETTINGS_TYPE = "siteSettings";
export const SITE_SETTINGS_ID = "siteSettings";

export const siteSettings = defineType({
  name: SITE_SETTINGS_TYPE,
  title: "Site Settings",
  type: "document",
  description: "Tetapan editorial global. Belum digunakan oleh halaman public dalam Fasa 4.1.",
  fields: [
    defineField({ name: "mosqueName", title: "Nama penuh masjid", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "shortName", title: "Nama ringkas", type: "string", description: "Pilihan; nama penuh tetap diutamakan untuk paparan rasmi." }),
    defineField({ name: "address", title: "Alamat rasmi", type: "text", rows: 4 }),
    defineField({ name: "phone", title: "Telefon pejabat", type: "string" }),
    defineField({ name: "email", title: "Emel rasmi", type: "string", validation: (rule) => rule.email() }),
  ],
  preview: { prepare: () => ({ title: "Site Settings", subtitle: "Tetapan global website" }) },
});
