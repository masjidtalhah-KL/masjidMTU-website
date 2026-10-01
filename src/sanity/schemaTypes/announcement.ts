import { defineField, defineType } from "sanity";
import { displayOrderField, displayOrderOrdering, isActiveField, slugField, titleField, validateBody, validateEndDate, validatePublicUrl } from "./fields";

export const announcement = defineType({
  name: "announcement", title: "Pengumuman", type: "document",
  fields: [
    titleField, slugField,
    defineField({ name: "summary", title: "Ringkasan", type: "text", rows: 3, validation: (rule) => rule.required().max(300) }),
    defineField({ name: "body", title: "Kandungan lanjut", type: "blockContent", validation: (rule) => rule.custom(validateBody) }),
    defineField({ name: "publishedAt", title: "Tarikh penerbitan", type: "datetime", validation: (rule) => rule.required() }),
    defineField({ name: "expiresAt", title: "Tarikh tamat paparan", type: "datetime", validation: (rule) => rule.custom((value, context) => validateEndDate(value, context.document?.publishedAt, "Tarikh tamat tidak boleh mendahului tarikh penerbitan.")) }),
    defineField({
      name: "cta", title: "Pautan tindakan (pilihan)", type: "object", options: { collapsible: true, collapsed: true },
      fields: [
        defineField({ name: "label", title: "Teks pautan", type: "string", validation: (rule) => rule.required().max(60) }),
        defineField({ name: "url", title: "URL", type: "url", validation: (rule) => rule.required().uri({ scheme: ["http", "https"], allowRelative: true, allowCredentials: false }).custom(validatePublicUrl) }),
      ],
    }),
    displayOrderField, isActiveField,
  ],
  orderings: [displayOrderOrdering, { title: "Terbaharu dahulu", name: "publishedAtDesc", by: [{ field: "publishedAt", direction: "desc" }] }],
  preview: { select: { title: "title", active: "isActive" }, prepare: ({ title, active }) => ({ title: title || "Pengumuman baharu", subtitle: active === true ? "Aktif" : "Tidak aktif / belum ditetapkan" }) },
});
