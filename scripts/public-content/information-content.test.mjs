import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import fs from "node:fs/promises";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createJiti } from "jiti";
import { parse, evaluate } from "groq-js";
import { buildPlan, resolveImages, ROOT } from "../sanity-migration/plan.mjs";
import { assertCurrentBaseParity } from "./current-base-parity.mjs";
import { validatePlan } from "../sanity-migration/validation.mjs";
const jiti = createJiti(import.meta.url, { fsCache: false, moduleCache: true, jsx: { runtime: "automatic" }, alias: { "@": path.join(ROOT, "src"), "./public-information.module.css": path.join(ROOT, "scripts/public-content/css-test-stub.mjs"), "./contact-details.module.css": path.join(ROOT, "scripts/public-content/css-test-stub.mjs"), "next/image": path.join(ROOT, "scripts/public-content/next-image-test-interop.mjs") } });
const load = (file) => jiti.import(path.join(ROOT, file));
const { mapSettingsInformation: map, unavailableDonationContent } = await load("src/lib/public-content/cms/information-adapters.ts");
const { mapHomepageEditorial } = await load("src/lib/public-content/cms/homepage-adapters.ts");
const { PublicContentError, readWithFallback } = await load("src/lib/public-content/cms/read-policy.ts");
const { publicQueries } = await load("src/lib/public-content/cms/queries.ts");
const { HomepageProgramSection } = await load("src/components/public/homepage-editorial.tsx");
const { DonationSection } = await load("src/components/public/donation-section.tsx");
const { NcrServiceView } = await load("src/components/public/ncr-service.tsx");
const { ContactDetailsView } = await load("src/components/public/contact-details.tsx");
const plan = await buildPlan();
const settings = () => structuredClone(plan.documents.find((d) => d._type === "siteSettings"));
const base = "https://cdn.sanity.io/images/2o95jmms/production/";
const image = () => ({ alt: "Synthetic artwork", asset: { _id: "image-abcdef-853x853-png", url: base + "abcdef-853x853.png", width: 853, height: 853 } });
const ncr = () => ({ heading: "Test service", introduction: "Synthetic offline test only.", officers: [{ name: "Synthetic officer", role: "Synthetic role", phone: "019 123 4567" }], poster: image() });
const donation = () => ({ heading: "Test donation", copy: "Synthetic offline test only.", recipientLabel: "Synthetic general recipient", primaryQr: image() });
const populated = () => ({ ...settings(), ncrService: ncr(), donationInfo: donation() });
const render = (component, props) => renderToStaticMarkup(React.createElement(component, props));
const empty = () => ({ announcements: [], programs: [], news: [] });
const now = Date.parse("2026-10-03T04:00:00Z");
const program = (fields = {}) => ({ _id: "synthetic", _type: "program", title: "Test initiative", description: "Offline only", displayOrder: 0, isActive: true, scheduleType: "ongoing", ...fields });
test("ongoing programs require no dates; card has neutral label and no clock metadata", () => {
  const mapped = mapHomepageEditorial({ ...empty(), programs: [program()] }, now);
  assert.equal(mapped.programs[0].date, "Inisiatif berterusan");
  assert.equal(mapped.programs[0].time, null);
  const html = render(HomepageProgramSection, { editorial: mapped });
  assert.match(html, /Program dan inisiatif/); assert.match(html, /Inisiatif berterusan/); assert.doesNotMatch(html, /⌁/);
});
test("ongoing visibility respects active state and genuine optional boundaries", () => {
  for (const [fields, visible] of [
    [{}, 1], [{ isActive: false }, 0], [{ startAt: "2026-09-28T04:00:00Z" }, 1],
    [{ startAt: "2026-10-04T04:00:00Z" }, 0], [{ endAt: "2026-10-03T04:00:00Z" }, 0],
    [{ endAt: "2026-10-04T04:00:00Z" }, 1],
  ]) assert.equal(mapHomepageEditorial({ ...empty(), programs: [program(fields)] }, now).programs.length, visible);
});
test("legacy scheduled behavior and deterministic order remain; invalid inactive ongoing candidates fail", () => {
  assert.throws(() => mapHomepageEditorial({ ...empty(), programs: [program({ scheduleType: undefined })] }, now), PublicContentError);
  for (const fields of [{ scheduleType: "other" }, { isActive: false, endAt: "bad" }, { startAt: "2026-10-04T00:00:00Z", endAt: "2026-10-03T00:00:00Z" }]) assert.throws(() => mapHomepageEditorial({ ...empty(), programs: [program(fields)] }, now), PublicContentError);
  const programs = ["z", "b", "a", "c"].map((id) => program({ _id: id }));
  assert.deepEqual(mapHomepageEditorial({ ...empty(), programs }, now).programs.map((p) => p.id), ["a", "b", "c"]);
});
test("missing optional settings are healthy absent and never invent contacts or QR", () => {
  const mapped = map(settings(), base);
  assert.equal(mapped.contact.ncrService, undefined); assert.equal(mapped.donation.information, null);
  const html = render(DonationSection, { content: mapped.donation });
  assert.match(html, /id="donations"/); assert.doesNotMatch(html, /Synthetic|Buka imej QR|tidak tersedia/);
});
test("NCR HTML supplies text and tel links independently of optional poster", () => {
  const mapped = map({ ...settings(), ncrService: { ...ncr(), poster: null } }, base);
  const html = render(NcrServiceView, { information: mapped.contact.ncrService });
  assert.match(html, /id="nikah-cerai-ruju"/); assert.match(html, /Synthetic officer/); assert.match(html, /Synthetic role/);
  assert.match(html, /href="tel:0191234567"/); assert.match(html, /019 123 4567/); assert.doesNotMatch(html, /<img/);
});
test("NCR belongs between separate office information and Lokasi; absent fields omit the service", () => {
  const details = map({ ...settings(), ncrService: { ...ncr(), poster: null } }, base).contact;
  const html = render(ContactDetailsView, { details });
  assert.ok(html.indexOf('office-hours-title') < html.indexOf('id="nikah-cerai-ruju"'));
  assert.ok(html.indexOf('id="nikah-cerai-ruju"') < html.indexOf('>Lokasi</h2>'));
  assert.ok(html.includes('href="' + details.phone.href + '"'));
  assert.match(html, /href="tel:0191234567"/);
  assert.doesNotMatch(render(ContactDetailsView, { details: map(settings(), base).contact }), /nikah-cerai-ruju|Synthetic officer/);
});
test("QR is semantic, full original URL/dimensions, unoptimized and accessible", () => {
  const mapped = map(populated(), base);
  const html = render(DonationSection, { content: mapped.donation });
  assert.match(html, /<figure/); assert.match(html, /<figcaption>Synthetic general recipient/);
  assert.ok(html.includes('src="' + image().asset.url + '"')); assert.match(html, /width="853" height="853"/);
  assert.match(html, /alt="Synthetic artwork"/); assert.doesNotMatch(html, /srcSet|_next\/image|auto=format|q=75/);
  assert.match(html, /Buka imej QR/); assert.match(html, /noopener noreferrer/);
});
for (const [name, change] of [
  ["empty NCR", (s) => s.ncrService = {}], ["invalid phone", (s) => s.ncrService.officers[0].phone = "abc"],
  ["empty officers", (s) => s.ncrService.officers = []], ["duplicate officers", (s) => s.ncrService.officers.push({ ...s.ncrService.officers[0] })],
  ["empty poster", (s) => s.ncrService.poster = {}], ["empty donation", (s) => s.donationInfo = {}],
  ["missing QR", (s) => delete s.donationInfo.primaryQr], ["missing alt", (s) => s.donationInfo.primaryQr.alt = ""],
  ["foreign asset", (s) => s.donationInfo.primaryQr.asset.url = "https://evil.example/qr.png"],
  ["transformed QR", (s) => s.donationInfo.primaryQr.asset.url += "?q=75"],
  ["QR crop", (s) => s.donationInfo.primaryQr.crop = { top: 0.1 }],
  ["QR hotspot", (s) => s.donationInfo.primaryQr.hotspot = { x: 0.5 }],
]) test("malformed populated information remains visible: " + name, () => { const s = populated(); change(s); assert.throws(() => map(s, base), PublicContentError); });
test("temporary information outage exposes no QR/officer fallback; auth/query/malformed remain errors", async () => {
  const result = await readWithFallback("settings", async () => { throw new TypeError("fetch failed"); }, (v) => map(v, base).donation, unavailableDonationContent, () => {});
  const html = render(DonationSection, { content: result });
  assert.match(html, /tidak tersedia buat sementara waktu/); assert.doesNotMatch(html, /Buka imej QR|Synthetic/);
  for (const statusCode of [400, 401, 403, 404]) await assert.rejects(readWithFallback("settings", async () => { throw Object.assign(new Error(), { statusCode }); }, (v) => map(v, base), () => assert.fail()));
  await assert.rejects(readWithFallback("settings", async () => ({ ...settings(), ncrService: {} }), (v) => map(v, base), () => assert.fail()), PublicContentError);
});
test("central settings query projects optional data and excludes drafts/releases", async () => {
  const source = populated();
  source.donationInfo.primaryQr.asset = { _type: "reference", _ref: "image-abcdef-853x853-png" };
  source.ncrService.poster = null;
  const result = await (await evaluate(parse(publicQueries.settings), { dataset: [source, { ...source, _id: "drafts.siteSettings" }, { _id: "image-abcdef-853x853-png", _type: "sanity.imageAsset", url: base + "abcdef-853x853.png", metadata: { dimensions: { width: 853, height: 853 } } }] })).get();
  assert.equal(map(result, base).donation.information.primaryQr.width, 853);
});
test("real schema validates legacy absent optional fields and ongoing dates; incomplete populated objects fail", async () => {
  const baseProgram = { _id: "offline-program", _type: "program", title: "Synthetic", slug: { _type: "slug", current: "offline-program" }, description: "Offline", displayOrder: 0, isActive: true };
  const valid = await validatePlan(plan, [settings(), { ...baseProgram, scheduleType: "ongoing" }]);
  assert.deepEqual(valid.errors, []);
  for (const doc of [baseProgram, { ...baseProgram, scheduleType: "invalid" }, { ...settings(), ncrService: {} }, { ...settings(), donationInfo: {} }]) {
    const result = await validatePlan(plan, [doc]); assert.ok(result.errors.length > 0);
  }
});
test("QR mobile CSS preserves image ratio and visible single-column layout", async () => {
  const css = await fs.readFile(path.join(ROOT, "src/components/public/public-information.module.css"), "utf8");
  assert.match(css, /\.qr img[^}]*height: auto/); assert.doesNotMatch(css, /object-fit:\s*cover|\.qr[^}]*display:\s*none/);
  assert.match(css, /max-width: 767px/); assert.match(css, /grid-template-columns: minmax\(0, 1fr\)/);
});

test("current verifier preserves every historical payload while allowing declared validated optional settings", () => {
  const ids = Object.fromEntries(plan.assets.map((a) => [a.assetId, "pending-image-" + a.assetId]));
  const inventory = plan.documents.map((d) => resolveImages(d, ids));
  assertCurrentBaseParity(plan, inventory, ids);
  const setting = inventory.find((d) => d._type === "siteSettings");
  setting.ncrService = ncr(); setting.donationInfo = donation();
  map(setting, base); // Required strict validation precedes the current base comparison.
  assertCurrentBaseParity(plan, inventory, ids);
  for (const change of [
    (docs) => docs.find((d) => d._type === "siteSettings").phone = "019 000 0000",
    (docs) => docs.find((d) => d._type === "siteSettings").unknownField = "hidden drift",
    (docs) => docs.find((d) => d._type === "surau").name = "changed",
    (docs) => docs.push({ ...docs.find((d) => d._type === "surau"), _id: "unexpected-surau" }),
  ]) { const changed = structuredClone(inventory); change(changed); assert.throws(() => assertCurrentBaseParity(plan, changed, ids)); }
});
