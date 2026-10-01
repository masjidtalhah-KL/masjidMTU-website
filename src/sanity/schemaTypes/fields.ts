import { defineField } from "sanity";

export const titleField = defineField({ name: "title", title: "Tajuk", type: "string", validation: (rule) => rule.required().max(160) });
export const slugField = defineField({
  name: "slug", title: "Pautan ringkas", type: "slug",
  description: "Tekan Generate selepas mengisi tajuk.",
  options: { source: "title", maxLength: 96 }, validation: (rule) => rule.required(),
});
export const displayOrderField = defineField({
  name: "displayOrder", title: "Susunan paparan", type: "number",
  description: "Nombor lebih kecil dipaparkan dahulu. Gunakan 1, 2, 3 dan seterusnya.",
  validation: (rule) => rule.required().integer().min(0),
});
export const isActiveField = defineField({
  name: "isActive", title: "Aktif untuk paparan", type: "boolean",
  description: "Tentukan sama ada kandungan ini boleh dipaparkan apabila integrasi frontend dibuat nanti.",
  validation: (rule) => rule.required(),
});
export const displayOrderOrdering = { title: "Susunan paparan", name: "displayOrderAsc", by: [{ field: "displayOrder", direction: "asc" as const }, { field: "_id", direction: "asc" as const }] };

/** A public link can be HTTP(S), a same-site path or an anchor, never an executable URL. */
export function validatePublicUrl(value: string | undefined) {
  if (value === undefined) return true;
  if (/\s|\\/.test(value) || value.startsWith("//")) return "Gunakan URL http/https, pautan /halaman atau #bahagian yang sah.";
  if (/^\/(?!\/)/.test(value) || /^#[^#]+$/.test(value)) return true;
  try {
    const url = new URL(value);
    if (["http:", "https:"].includes(url.protocol) && !url.username && !url.password) return true;
  } catch { /* Return an editor-friendly validation message below. */ }
  return "Gunakan URL http/https, pautan /halaman atau #bahagian yang sah.";
}

export function validateEndDate(end: string | undefined, start: unknown, message: string) {
  if (!end || typeof start !== "string") return true;
  return Date.parse(end) < Date.parse(start) ? message : true;
}

export function validateBody(value: unknown) {
  if (value === undefined) return true;
  if (!Array.isArray(value)) return "Masukkan kandungan teks yang sah.";
  const hasText = value.some((block) => Array.isArray(block?.children) && block.children.some((span: { text?: string }) => span.text?.trim()));
  return hasText || "Masukkan sekurang-kurangnya satu perenggan yang mempunyai teks.";
}

export function hasImageAsset(value: unknown): boolean {
  return !!value && typeof value === "object" && "asset" in value && !!value.asset;
}

export function validateImage(value: unknown) {
  return value === undefined || hasImageAsset(value) || "Pilih fail gambar atau buang medan gambar yang kosong.";
}

export function labelFor(options: readonly { title: string; value: string }[], value: unknown) {
  return options.find((option) => option.value === value)?.title ?? "Belum ditetapkan";
}
