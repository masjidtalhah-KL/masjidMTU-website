import { defineArrayMember, defineField, defineType } from "sanity";

export const SITE_SETTINGS_TYPE = "siteSettings";
export const SITE_SETTINGS_ID = "siteSettings";

export const siteSettings = defineType({
  name: SITE_SETTINGS_TYPE,
  title: "Site Settings",
  type: "document",
  description: "Identiti dan maklumat hubungan rasmi. Halaman public belum menggunakan data CMS ini.",
  fields: [
    defineField({ name: "mosqueName", title: "Nama penuh masjid", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "shortName", title: "Nama ringkas", type: "string", description: "Pilihan; nama penuh tetap diutamakan untuk paparan rasmi." }),
    defineField({ name: "address", title: "Alamat rasmi", type: "text", rows: 4 }),
    defineField({ name: "phone", title: "Telefon pejabat", type: "string" }),
    defineField({ name: "email", title: "Emel rasmi", type: "string", validation: (rule) => rule.email() }),
    defineField({ name: "facebookUrl", title: "URL Facebook rasmi", type: "url", validation: (rule) => rule.uri({ scheme: ["https"] }) }),
    defineField({ name: "instagramUrl", title: "URL Instagram rasmi", type: "url", validation: (rule) => rule.uri({ scheme: ["https"] }) }),
    defineField({
      name: "officeHours", title: "Waktu pejabat", type: "array",
      description: "Satu baris untuk setiap kumpulan hari. Waktu boleh berupa jam atau Tutup.",
      of: [defineArrayMember({
        name: "officeHoursRow", title: "Baris waktu pejabat", type: "object",
        fields: [
          defineField({ name: "days", title: "Hari", type: "string", validation: (rule) => rule.required() }),
          defineField({ name: "hours", title: "Waktu / status", type: "string", validation: (rule) => rule.required() }),
        ],
        preview: { select: { title: "days", subtitle: "hours" } },
      })],
    }),
  ],
  preview: { prepare: () => ({ title: "Site Settings", subtitle: "Tetapan global website" }) },
});
