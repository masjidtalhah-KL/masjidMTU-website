import { createHash } from "node:crypto";
import { readFile, realpath, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { createJiti } from "jiti";
import ts from "typescript";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const TARGET = Object.freeze({ projectId: "2o95jmms", dataset: "production", apiVersion: "2026-09-01" });
export const EXPECTED = Object.freeze({ siteSettings: 1, profilePage: 1, organisationMember: 25, surau: 15, galleryCollection: 1 });
export const SKIPPED = [
  "announcement, program, newsPost: homepage mock, bukan kandungan production diluluskan.",
  "lectureSpeaker, lectureRule, lectureMonth: demo Studio, fixture QA Oktober dan workspace legacy dikecualikan.",
  "Logo/pattern/foto brand: kekal aset website; schema tidak meminta upload logo Profil.",
  "Foto galeri ditolak, contact sheet dan carta kewangan: dikecualikan.",
];
export const hash = (value, algorithm = "sha256") => createHash(algorithm).update(value).digest("hex");
export function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  return value;
}
export const equal = (left, right) => JSON.stringify(canonical(left)) === JSON.stringify(canonical(right));

export async function loadSources() {
  const jiti = createJiti(import.meta.url, { fsCache: false, moduleCache: false });
  const [profile, organisation, surau, gallery, contact, assets] = await Promise.all(
    ["profile", "organisation", "surau", "gallery", "contact", "assets"].map((name) => jiti.import(path.join(ROOT, "src/lib/public-content", name + ".ts"))),
  );
  // Read the already approved UI captions without importing/executing a Next.js page.
  const filename = path.join(ROOT, "src/app/profil/page.tsx");
  const source = ts.createSourceFile(filename, await readFile(filename, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const captions = {};
  for (const statement of source.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (declaration.name.getText(source) !== "spaceCaptions" || !declaration.initializer || !ts.isObjectLiteralExpression(declaration.initializer)) continue;
      for (const property of declaration.initializer.properties) {
        if (!ts.isPropertyAssignment(property) || !ts.isStringLiteral(property.name) || !ts.isStringLiteral(property.initializer)) throw new Error("spaceCaptions bukan mapping string statik; review diperlukan.");
        captions[property.name.text] = property.initializer.text;
      }
    }
  }
  return { ...profile, ...organisation, ...surau, ...gallery, ...contact, ...assets, captions };
}
function paragraphs(values) {
  return values.map((text, index) => ({
    _key: "paragraph-" + (index + 1), _type: "block", style: "normal", markDefs: [],
    children: [{ _key: "text-" + (index + 1), _type: "span", marks: [], text }],
  }));
}

export async function buildPlan(sources) {
  sources ??= await loadSources();
  const { profile, organisationSlots, organisationGroups, surauList, galleryPhotos, contact, publicAssets, captions } = sources;
  const documents = [];
  const assetUses = [];
  const errors = [];
  const mappings = [];
  const image = (assetId, owner, field) => {
    const asset = publicAssets[assetId];
    if (!asset) { errors.push("ID aset tiada dalam manifest: " + assetId); return undefined; }
    assetUses.push({ assetId, documentId: owner, field, alt: asset.alt });
    return { _type: "editorialImage", asset: { _type: "reference", _ref: "pending-image-" + assetId }, alt: asset.alt };
  };
  const add = (document, localRecord) => {
    documents.push(document);
    mappings.push({ source: localRecord, documentId: document._id, draftId: "drafts." + document._id, type: document._type });
  };
  add({
    _id: "siteSettings", _type: "siteSettings", mosqueName: profile.name,
    address: contact.addressLines.join("\n"), phone: contact.phone.label, email: contact.email.label,
    facebookUrl: contact.facebook.href, instagramUrl: contact.instagram.href,
    officeHours: contact.officeHours.map((row, index) => ({ _key: "hours-" + (index + 1), _type: "officeHoursRow", ...row })),
  }, "profile.name + contact.ts");
  add({
    _id: "profilePage", _type: "profilePage", introduction: paragraphs(profile.introduction.paragraphs),
    sourceNote: profile.introduction.sourceNote, vision: profile.vision, mission: profile.mission, motto: profile.motto,
    logoRationale: paragraphs(profile.logo.paragraphs),
    spaceImages: profile.spacePhotoIds.map((assetId, index) => {
      if (!captions[assetId]) errors.push("Kapsyen Profil diluluskan tidak dijumpai: " + assetId);
      return { _key: assetId, _type: "galleryMedia", image: image(assetId, "profilePage", "spaceImages[" + index + "].image"), caption: captions[assetId] };
    }),
  }, "profile.ts + kapsyen /profil");
  for (const slot of organisationSlots) {
    if (!organisationGroups.some((group) => group.id === slot.groupId)) errors.push("Kumpulan organisasi tidak dikenali: " + slot.id);
    if (!["occupied", "vacant"].includes(slot.status)) errors.push("Status slot tidak dikenali: " + slot.id);
    if (slot.status === "vacant" && (slot.name || slot.photoId)) errors.push("Vacancy mempunyai nama/foto: " + slot.id);
    const id = "organisationMember-" + slot.id;
    add({
      _id: id, _type: "organisationMember", role: slot.role, group: slot.groupId,
      isVacant: slot.status === "vacant", ...(slot.name ? { name: slot.name } : {}),
      ...(slot.appointment ? { employmentTitle: slot.appointment } : {}),
      ...(slot.photoId ? { photo: image(slot.photoId, id, "photo") } : {}),
      displayOrder: slot.order, isActive: true,
    }, "organisation.ts#" + slot.id);
  }
  for (const surau of surauList) {
    const id = surau.id;
    add({
      _id: id, _type: "surau", name: surau.name, category: surau.category,
      logo: image(surau.logoId, id, "logo"), ...(surau.address ? { address: surau.address } : {}),
      displayOrder: surau.order, isActive: true,
    }, "surau.ts#" + surau.id);
  }
  add({
    _id: "galleryCollection-interior-masjid", _type: "galleryCollection", title: "Interior Masjid",
    slug: { _type: "slug", current: "interior-masjid" }, category: "interior",
    items: [...galleryPhotos].sort((a, b) => a.order - b.order).map((photo, index) => ({
      _key: photo.id, _type: "galleryMedia", image: image(photo.assetId, "galleryCollection-interior-masjid", "items[" + index + "].image"),
      ...(photo.room ? { title: photo.room } : {}), ...(photo.caption ? { caption: photo.caption } : {}),
    })),
  }, "gallery.ts#interior (order menaik)");
  const ids = documents.map(({ _id }) => _id);
  const collisions = ids.filter((id, index) => ids.indexOf(id) !== index);
  for (const id of ids) if (!/^[a-zA-Z0-9_-]+$/.test(id)) errors.push("ID dokumen tidak sah: " + id);
  for (const [type, count] of Object.entries(EXPECTED)) if (documents.filter((doc) => doc._type === type).length !== count) errors.push("Bilangan " + type + " tidak sama dengan " + count);
  if (surauList.filter((item) => item.category === "jumaat").length !== 3 || surauList.filter((item) => item.category === "biasa").length !== 12) errors.push("Surau mesti 3 Jumaat + 12 Biasa.");
  if (galleryPhotos.length !== 12 || new Set(galleryPhotos.map((photo) => photo.order)).size !== 12) errors.push("Galeri mesti 12 foto dengan order unik.");
  if (profile.spacePhotoIds.length !== 5) errors.push("Profil mesti mengekalkan lima foto.");
  const missing = [];
  const assets = [];
  const publicRoot = await realpath(path.join(ROOT, "public"));
  const sharp = createRequire(import.meta.resolve("next/package.json"))("sharp");
  for (const assetId of [...new Set(assetUses.map((use) => use.assetId))].sort()) {
    const asset = publicAssets[assetId];
    const filename = path.resolve(ROOT, "public", asset.src.replace(/^\//, ""));
    const record = { assetId, localPath: path.relative(ROOT, filename).replaceAll("\\", "/"), exists: false, uses: assetUses.filter((use) => use.assetId === assetId) };
    try {
      if (!/^\/(interior|people|surau)\//.test(asset.src)) throw new Error("Aset di luar folder migration yang diluluskan.");
      const resolved = await realpath(filename);
      const relative = path.relative(publicRoot, resolved);
      if (relative.startsWith("..") || path.isAbsolute(relative)) throw new Error("Path aset keluar daripada public/.");
      const bytes = await readFile(resolved);
      const metadata = await sharp(bytes).metadata();
      Object.assign(record, { exists: true, size: bytes.length, format: metadata.format, width: metadata.width, height: metadata.height, sha1: hash(bytes, "sha1"), sha256: hash(bytes) });
      if (metadata.width !== asset.width || metadata.height !== asset.height) errors.push("Dimensi berbeza dengan manifest: " + assetId);
      if (!["webp", "png", "jpeg"].includes(metadata.format)) errors.push("Format aset tidak disokong: " + assetId);
    } catch (error) { missing.push({ assetId, localPath: record.localPath, reason: error.message }); }
    assets.push(record);
  }
  if (assets.length !== 50 || assetUses.length !== 55) errors.push("Jangkaan aset ialah 50 fail unik / 55 penggunaan.");
  const schemaDirectory = path.join(ROOT, "src/sanity/schemaTypes");
  const schemaFiles = (await readdir(schemaDirectory)).filter((name) => name.endsWith(".ts")).sort();
  const schemaHash = hash(await Promise.all(schemaFiles.map(async (name) => name + ":" + hash(await readFile(path.join(schemaDirectory, name))))).then((values) => values.join("\n")));
  const plan = {
    target: TARGET, documents, mappings, assets, assetUses, schemaHash, errors, missing, collisions, skipped: SKIPPED,
    notes: [
      "shortName tiada dalam sumber diluluskan; medan pilihan tidak diisi.",
      "isActive=true dipetakan daripada rekod yang sedang dipaparkan pada website.",
      "Alamat surau hanya daripada sumber tempatan sedia ada; tiada alamat direka.",
      "Heading layout Profil tidak disalin: schema perenggan mengekalkan UI section sedia ada.",
      "pending-image-* ialah placeholder dry-run sahaja; write kelak mesti menggunakan _id aset sebenar daripada Sanity.",
    ],
  };
  plan.fingerprint = hash(JSON.stringify(canonical({ documents, assets, schemaHash, target: TARGET })));
  return plan;
}

export function resolveImages(value, assetIds) {
  if (Array.isArray(value)) return value.map((item) => resolveImages(item, assetIds));
  if (!value || typeof value !== "object") return value;
  if (value._type === "reference" && value._ref?.startsWith("pending-image-")) {
    const key = value._ref.slice("pending-image-".length);
    if (!assetIds[key]) throw new Error("Aset belum diresolve: " + key);
    return { ...value, _ref: assetIds[key] };
  }
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, resolveImages(item, assetIds)]));
}
