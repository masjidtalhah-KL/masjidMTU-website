import { defineArrayMember, defineField, defineType } from "sanity";
import { validateImage } from "./fields";

export const SITE_SETTINGS_TYPE = "siteSettings";
export const SITE_SETTINGS_ID = "siteSettings";

export const siteSettings = defineType({
  name: SITE_SETTINGS_TYPE,
  title: "Site Settings",
  type: "document",
  description: "Identiti, hubungan dan maklumat awam rasmi untuk halaman public. NCR dan sumbangan kekal pilihan sehingga sumber diluluskan.",
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
    defineField({ name: "ncrService", title: "Nikah, Cerai & Ruju’ (pilihan)", type: "object", fields: [
      defineField({ name: "heading", title: "Tajuk", type: "string", validation: (rule) => rule.required().max(160) }),
      defineField({ name: "introduction", title: "Pengenalan", type: "text", validation: (rule) => rule.required().max(400) }),
      defineField({ name: "officers", title: "Pegawai", type: "array", validation: (rule) => rule.required().min(1).max(10), of: [defineArrayMember({ type: "object", fields: [
        defineField({ name: "name", title: "Nama seperti sumber", type: "string", validation: (rule) => rule.required().max(160) }),
        defineField({ name: "role", title: "Peranan seperti sumber", type: "string", validation: (rule) => rule.required().max(160) }),
        defineField({ name: "phone", title: "Telefon", type: "string", validation: (rule) => rule.required().max(40).custom((value) => value === undefined || /^\+?\d{7,15}$/.test(value.replace(/[\s()-]/g, "")) && /^\+?[\d\s()-]+$/.test(value) || "Masukkan nombor telefon yang sah.") }),
      ] })] }),
      defineField({ name: "poster", title: "Poster sokongan (pilihan)", type: "editorialImage" }),
    ] }),
    defineField({ name: "donationInfo", title: "Sumbangan umum masjid (pilihan)", type: "object", fields: [
      defineField({ name: "heading", title: "Tajuk", type: "string", validation: (rule) => rule.required().max(160) }),
      defineField({ name: "copy", title: "Penerangan", type: "text", validation: (rule) => rule.required().max(600) }),
      defineField({ name: "recipientLabel", title: "Penerima / tujuan", type: "string", validation: (rule) => rule.required().max(200) }),
      defineField({ name: "primaryQr", title: "Artwork QR sumbangan umum", type: "image", options: { hotspot: false }, description: "Artwork penuh berjenama masjid umum sahaja. Jangan gunakan QR Dapur Zohor atau potong/ubah artwork.", validation: (rule) => rule.required().custom(validateImage).custom((value) => !value?.crop && !value?.hotspot || "Artwork QR tidak boleh dipotong atau menggunakan hotspot."), fields: [
        defineField({ name: "alt", title: "Penerangan imej", type: "string", validation: (rule) => rule.required() }),
      ] }),
      defineField({ name: "compactQr", title: "Compact Infaq QR (optional)", type: "image", options: { hotspot: false }, description: "Approved square QR-only original for Jadual Kuliah. The public donation section keeps primaryQr. Preserve the complete image and quiet zone; no crop or hotspot.", validation: (rule) => rule.custom(validateImage).custom((value) => !value || !value.crop && !value.hotspot || "Compact QR must not have a crop or hotspot.").custom((value) => {
        if (!value?.asset?._ref) return true;
        const dimensions = value.asset._ref.match(/^image-[a-f0-9]{40}-(\d+)x(\d+)-(png|jpg|webp)$/);
        return !!dimensions && dimensions[1] === dimensions[2] || "Compact QR must reference a square PNG, JPG or WebP original.";
      }), fields: [defineField({ name: "alt", title: "Image alt text", type: "string", validation: (rule) => rule.required().max(300) })] }),
    ] }),
  ],
  preview: { prepare: () => ({ title: "Site Settings", subtitle: "Tetapan global website" }) },
});
