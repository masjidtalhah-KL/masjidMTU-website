import type { ContactDetails } from "../contact";
import { organisationGroups } from "../organisation";
import { surauCategories } from "../surau";
import { PublicContentError } from "./read-policy";
import type { GalleryRecord, ImageRecord, MediaRecord, OrganisationRecord, ParagraphRecord, ProfileContent, ProfileRecord, PublicGallery, PublicImage, PublicOrganisationSlot, PublicSurau, SettingsRecord, SurauRecord } from "./types";

function requireValue(condition: unknown, field: string): asserts condition {
  if (!condition) throw new PublicContentError(`Invalid published public content: ${field}.`);
}
function object<T>(value: unknown, field: string): T {
  requireValue(value && typeof value === "object" && !Array.isArray(value), field);
  return value as T;
}
function text(value: unknown, field: string): string {
  requireValue(typeof value === "string" && value.trim().length > 0, field);
  return value;
}
function optionalText(value: unknown, field: string): string | null {
  if (value === undefined || value === null || value === "") return null;
  return text(value, field);
}
function list<T>(value: unknown, field: string): T[] {
  requireValue(Array.isArray(value) && value.length > 0, field);
  return value.map((entry, index) => object<T>(entry, `${field}[${index}]`));
}
function order(value: unknown, field: string): number {
  requireValue(Number.isInteger(value) && Number(value) >= 0, field);
  return Number(value);
}
function unique(values: readonly string[], field: string) {
  requireValue(new Set(values).size === values.length, `${field} must be unique`);
}
function documentId(value: unknown, field: string): string {
  const id = text(value, field);
  requireValue(/^[a-zA-Z0-9_-]+$/.test(id), `${field} must be a published ID`);
  return id;
}
function paragraphs(value: unknown, field: string): string[] {
  return list<ParagraphRecord>(value, field).map((block, index) => {
    const label = `${field}[${index}]`;
    requireValue(block._type === "block" && block.style === "normal" && Array.isArray(block.markDefs) && block.markDefs.length === 0, label);
    const children = list<ParagraphRecord["children"][number]>(block.children, `${label}.children`);
    return text(children.map((span) => {
      requireValue(span._type === "span" && Array.isArray(span.marks) && span.marks.length === 0 && typeof span.text === "string", `${label}.span`);
      return span.text;
    }).join(""), label);
  });
}

export function mapImage(value: unknown, assetBase: string, field: string): PublicImage {
  const image = object<ImageRecord>(value, field);
  const asset = object<NonNullable<ImageRecord["asset"]>>(image.asset, `${field}.asset reference`);
  const src = text(asset.url, `${field}.asset.url`);
  requireValue(/^image-[a-f0-9]+-\d+x\d+-[a-z0-9]+$/.test(asset._id), `${field}.asset._id`);
  requireValue(src.startsWith(assetBase) && !src.includes("?") && !src.includes("#") && !src.slice(assetBase.length).includes("/"), `${field}.asset.url must belong to the configured Sanity dataset`);
  requireValue(Number.isInteger(asset.width) && asset.width > 0 && Number.isInteger(asset.height) && asset.height > 0, `${field}.asset dimensions`);
  return { src, alt: text(image.alt, `${field}.alt`), width: asset.width, height: asset.height };
}

export function mapProfile(value: unknown, assetBase: string): ProfileContent {
  const profile = object<ProfileRecord>(value, "profilePage singleton");
  requireValue(profile._id === "profilePage", "profilePage._id");
  const spaces = list<MediaRecord>(profile.spaceImages, "profilePage.spaceImages");
  requireValue(spaces.length <= 5, "profilePage.spaceImages maximum five");
  const result = {
    introduction: paragraphs(profile.introduction, "profilePage.introduction"),
    sourceNote: optionalText(profile.sourceNote, "profilePage.sourceNote"),
    vision: text(profile.vision, "profilePage.vision"),
    mission: text(profile.mission, "profilePage.mission"),
    motto: text(profile.motto, "profilePage.motto"),
    logoRationale: paragraphs(profile.logoRationale, "profilePage.logoRationale"),
    spaces: spaces.map((item) => ({ id: text(item._key, "profilePage.spaceImages._key"), image: mapImage(item.image, assetBase, "profilePage.spaceImages.image"), caption: optionalText(item.caption, "profilePage.spaceImages.caption") })),
  };
  unique(result.spaces.map((item) => item.id), "profilePage.spaceImages keys");
  return result;
}

export function mapOrganisation(value: unknown, assetBase: string): PublicOrganisationSlot[] {
  const slots = list<OrganisationRecord>(value, "organisationMember active slots").map((record): PublicOrganisationSlot => {
    const id = documentId(record._id, "organisationMember._id");
    requireValue(id.startsWith("organisationMember-"), `${id} slot prefix`);
    const group = organisationGroups.find((item) => item.id === record.group);
    requireValue(group, `${id}.group`);
    requireValue(record.isActive === true && typeof record.isVacant === "boolean", `${id} visibility/vacancy`);
    const name = optionalText(record.name, `${id}.name`);
    const photo = record.photo == null ? null : mapImage(record.photo, assetBase, `${id}.photo`);
    requireValue(record.isVacant ? !name && !photo : !!name, `${id} vacancy/name/photo state`);
    return {
      id: id.slice("organisationMember-".length), groupId: group.id,
      name, role: text(record.role, `${id}.role`),
      appointment: optionalText(record.employmentTitle, `${id}.employmentTitle`),
      status: record.isVacant ? "vacant" : "occupied", photo,
      order: order(record.displayOrder, `${id}.displayOrder`),
    };
  });
  unique(slots.map((slot) => slot.id), "organisation slot IDs");
  unique(slots.map((slot) => `${slot.groupId}:${slot.order}`), "organisation order within group");
  const rank = (id: string) => organisationGroups.findIndex((group) => group.id === id);
  return slots.toSorted((a, b) => rank(a.groupId) - rank(b.groupId) || a.order - b.order);
}

export function mapSurau(value: unknown, assetBase: string): PublicSurau[] {
  const entries = list<SurauRecord>(value, "surau active records").map((record): PublicSurau => {
    const id = documentId(record._id, "surau._id");
    const category = surauCategories.find((item) => item.id === record.category);
    requireValue(category && record.isActive === true, `${id}.category/visibility`);
    return {
      id, name: text(record.name, `${id}.name`), category: category.id,
      address: optionalText(record.address, `${id}.address`) ?? "",
      logo: record.logo == null ? null : mapImage(record.logo, assetBase, `${id}.logo`),
      order: order(record.displayOrder, `${id}.displayOrder`),
    };
  });
  unique(entries.map((entry) => entry.id), "surau IDs");
  unique(entries.map((entry) => `${entry.category}:${entry.order}`), "surau order within category");
  const rank = (id: string) => surauCategories.findIndex((category) => category.id === id);
  return entries.toSorted((a, b) => rank(a.category) - rank(b.category) || a.order - b.order);
}

export function mapGallery(value: unknown, assetBase: string): PublicGallery {
  const gallery = object<GalleryRecord>(value, "galleryCollection Interior Masjid");
  requireValue(gallery._id === "galleryCollection-interior-masjid" && gallery.category === "interior", "approved gallery ID/category");
  const items = list<MediaRecord>(gallery.items, "galleryCollection.items").map((item, index) => ({
    ...mapImage(item.image, assetBase, "galleryCollection.items.image"),
    id: text(item._key, "galleryCollection.items._key"), category: gallery.category, order: index + 1,
    caption: optionalText(item.caption, "galleryCollection.items.caption") ?? undefined,
  }));
  unique(items.map((item) => item.id), "galleryCollection item keys");
  return { id: gallery._id, title: text(gallery.title, "galleryCollection.title"), items };
}

export function mapContact(value: unknown): ContactDetails {
  const settings = object<SettingsRecord>(value, "siteSettings singleton");
  requireValue(settings._id === "siteSettings", "siteSettings._id");
  text(settings.mosqueName, "siteSettings.mosqueName");
  const phone = text(settings.phone, "siteSettings.phone");
  requireValue(/^\+?[\d\s()-]+$/.test(phone), "siteSettings.phone dialable value");
  const email = text(settings.email, "siteSettings.email");
  requireValue(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), "siteSettings.email");
  function social(value: unknown, field: string): `https://${string}` {
    const href = text(value, field);
    let parsed: URL;
    try { parsed = new URL(href); } catch { throw new PublicContentError(`Invalid published public content: ${field}.`); }
    requireValue(parsed.protocol === "https:" && !parsed.username && !parsed.password, field);
    return href as `https://${string}`;
  }
  const addressLines = text(settings.address, "siteSettings.address").split(/\r?\n/);
  addressLines.forEach((line) => text(line, "siteSettings.address line"));
  return {
    source: "sanity:siteSettings", addressLines,
    phone: { label: phone, href: `tel:${phone.replace(/[\s()-]/g, "")}` },
    email: { label: email, href: `mailto:${email}` },
    facebook: { href: social(settings.facebookUrl, "siteSettings.facebookUrl") },
    instagram: { href: social(settings.instagramUrl, "siteSettings.instagramUrl") },
    officeHours: list<SettingsRecord["officeHours"][number]>(settings.officeHours, "siteSettings.officeHours").map((row) => ({ days: text(row.days, "siteSettings.officeHours.days"), hours: text(row.hours, "siteSettings.officeHours.hours") })),
  };
}
