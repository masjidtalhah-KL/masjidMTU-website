import { defineField, defineType } from "sanity";
import { displayOrderField, displayOrderOrdering, hasImageAsset, isActiveField, labelFor, validateImage } from "./fields";

export const organisationGroupOptions = [
  { title: "Jawatankuasa Utama", value: "jawatankuasa-utama" },
  { title: "AJK / Biro", value: "ajk-biro" },
  { title: "Imam", value: "imam" }, { title: "Bilal", value: "bilal" },
  { title: "Noja", value: "noja" }, { title: "Pembantu Tadbir", value: "pembantu-tadbir" },
];

export const organisationMember = defineType({
  name: "organisationMember", title: "Slot Jawatan", type: "document",
  description: "Satu dokumen untuk satu slot jawatan. Individu sama boleh mempunyai beberapa slot; jangan gabungkan jawatan.",
  fields: [
    defineField({ name: "role", title: "Jawatan", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "group", title: "Kumpulan", type: "string", options: { list: organisationGroupOptions }, validation: (rule) => rule.required() }),
    defineField({ name: "isVacant", title: "Slot jawatan kosong", type: "boolean", description: "Aktifkan untuk vacancy; biarkan nama dan foto kosong.", validation: (rule) => rule.required() }),
    defineField({ name: "name", title: "Nama penuh", type: "string", validation: (rule) => rule.custom((value, context) => context.document?.isVacant === true ? (!value?.trim() || "Slot kosong tidak memerlukan nama individu; kosongkan medan ini.") : (!!value?.trim() || "Nama penuh diperlukan untuk slot yang diisi.")) }),
    defineField({ name: "employmentTitle", title: "Perjawatan / skim (pilihan)", type: "string", description: "Isi hanya perjawatan yang diketahui; biarkan kosong jika tiada." }),
    defineField({ name: "photo", title: "Foto (pilihan)", type: "editorialImage", description: "Tanpa foto adalah sah. Frontend nanti menggunakan placeholder neutral.", validation: (rule) => rule.custom((value, context) => context.document?.isVacant === true && hasImageAsset(value) ? "Slot kosong tidak boleh menggunakan foto individu; buang foto." : validateImage(value)).error() }),
    displayOrderField, isActiveField,
  ],
  orderings: [displayOrderOrdering, { title: "Kumpulan, kemudian susunan", name: "groupOrder", by: [{ field: "group", direction: "asc" }, { field: "displayOrder", direction: "asc" }] }],
  preview: {
    select: { name: "name", role: "role", group: "group", vacant: "isVacant", media: "photo" },
    prepare: ({ name, role, group, vacant, media }) => ({ title: `${role || "Jawatan belum diisi"} — ${vacant ? "Kosong" : name || "Nama belum diisi"}`, subtitle: labelFor(organisationGroupOptions, group), media: vacant ? undefined : media }),
  },
});
