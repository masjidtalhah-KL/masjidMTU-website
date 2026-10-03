import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import { createJiti } from "jiti";
import { parse, evaluate } from "groq-js";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ROOT } from "../sanity-migration/plan.mjs";
import { validatePlan } from "../sanity-migration/validation.mjs";

const jiti = createJiti(import.meta.url, { fsCache: false, moduleCache: true, jsx: { runtime: "automatic" }, alias: { "@": path.join(ROOT, "src"), "next/image": path.join(ROOT, "scripts/public-content/next-image-test-interop.mjs") } });
const { mapHomepageEditorial: map, formatHomepageNewsDate } = await jiti.import(path.join(ROOT, "src/lib/public-content/cms/homepage-adapters.ts"));
const { homepageEditorialQuery } = await jiti.import(path.join(ROOT, "src/lib/public-content/cms/homepage-queries.ts"));
const { PublicContentError, readWithFallback } = await jiti.import(path.join(ROOT, "src/lib/public-content/cms/read-policy.ts"));
const { HomepageNewsSection } = await jiti.import(path.join(ROOT, "src/components/public/homepage-editorial.tsx"));
const now = Date.parse("2026-10-02T04:00:00Z");
// Synthetic test records are never supplied to a Sanity mutation API.
const news = (fields = {}) => ({
  _id: "test-news-date", _type: "newsPost", title: "Offline date test",
  slug: { _type: "slug", current: "offline-date-test" }, excerpt: "Offline only.",
  body: [{ _type: "block", _key: "b", style: "normal", markDefs: [], children: [{ _type: "span", _key: "s", marks: [], text: "Offline only." }] }],
  publishedAt: "2026-10-01T02:00:00Z", ...fields,
});
const bundle = (...items) => ({ announcements: [], programs: [], news: items });
const plan = { documents: [], assets: [], errors: [], collisions: [], missing: [] };
const invalid = ["", "14 May 2026", "2026-5-14", "2026-05-14T00:00:00Z", "2026-02-29", "2026-04-31", "2026-13-01", "2026-00-01", "2026-05-00", " 2026-05-14", 20260514, false, {}];

test("actual News schema keeps eventDate optional and accepts valid calendar dates including leap day", async () => {
  for (const eventDate of [undefined, null, "2026-05-14", "2024-02-29"]) {
    const result = await validatePlan(plan, [news({ eventDate })]);
    assert.deepEqual(result.errors, []);
    assert.deepEqual(result.warnings, []);
  }
});

test("actual News schema rejects malformed/rollover event dates without redefining publishedAt", async () => {
  const documents = invalid.map((eventDate, index) => news({ _id: "bad-date-" + index, eventDate }));
  const result = await validatePlan(plan, documents);
  for (const doc of documents) assert.ok(result.errors.some((marker) => marker.documentId === doc._id && marker.path.includes("eventDate")));
  const draft = news({ eventDate: "2026-05-14" }); delete draft.publishedAt;
  const validation = await validatePlan(plan, [draft]);
  assert.deepEqual(validation.errors.map(({ path, message }) => ({ path, message })), [{ path: ["publishedAt"], message: "Required" }]);
});

test("News query carries eventDate and preserves published-only exclusions without source-post metadata", async () => {
  const record = news({ eventDate: "2026-05-14", facebookPostTime: "10:19 AM" });
  const projected = await (await evaluate(parse(homepageEditorialQuery), { dataset: [record, { ...record, _id: "drafts.test-news-date" }, { ...record, _id: "versions.review.test-news-date" }] })).get();
  assert.equal(projected.news.length, 1);
  assert.equal(projected.news[0].eventDate, "2026-05-14");
  assert.equal(Object.hasOwn(projected.news[0], "facebookPostTime"), false);
});

test("News card displays 14 Mei 2026 for the event instead of its October publication date", () => {
  const editorial = map(bundle(news({ eventDate: "2026-05-14" })), now);
  assert.equal(editorial.news[0].eventDate, "2026-05-14");
  assert.equal(editorial.news[0].date, "14 Mei 2026");
  const html = renderToStaticMarkup(React.createElement(HomepageNewsSection, { editorial }));
  assert.match(html, /14 Mei 2026/);
  assert.doesNotMatch(html, /1 Okt 2026|Belum diterbitkan/);
});

test("legacy News without eventDate falls back to publication date in Kuala Lumpur timezone", () => {
  const publishedAt = "2026-10-01T20:30:00Z";
  const expected = new Intl.DateTimeFormat("ms-MY", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kuala_Lumpur" }).format(Date.parse(publishedAt));
  for (const eventDate of [undefined, null]) {
    const mapped = map(bundle(news({ publishedAt, eventDate })), now).news[0];
    assert.equal(mapped.eventDate, null); assert.equal(mapped.date, expected);
  }
  assert.equal(formatHomepageNewsDate("2024-02-29", undefined), "29 Feb 2024");
});

test("eventDate never changes News publication eligibility or newest-first ordering", () => {
  const mapped = map(bundle(
    news({ _id: "new-publication-old-event", eventDate: "2026-05-14" }),
    news({ _id: "old-publication-new-event", publishedAt: "2026-09-30T02:00:00Z", eventDate: "2026-09-30" }),
    news({ _id: "unpublished-future", publishedAt: "2026-10-03T02:00:00Z", eventDate: "2026-05-14" }),
  ), now);
  assert.deepEqual(mapped.news.map((item) => item.id), ["new-publication-old-event", "old-publication-new-event"]);
});

test("malformed optional event dates remain visible errors and never use outage fallback", async () => {
  for (const eventDate of invalid) {
    const input = bundle(news({ eventDate }));
    assert.throws(() => map(input, now), PublicContentError);
    await assert.rejects(readWithFallback("homepage-editorial", async () => input, (value) => map(value, now), () => assert.fail("Malformed date must not invoke fallback")), PublicContentError);
  }
  assert.throws(() => map(bundle(news({ _id: "future", publishedAt: "2026-10-03T02:00:00Z", eventDate: "bad" })), now), PublicContentError);
  assert.throws(() => map(bundle(...["a", "b", "c"].map((_id) => news({ _id })), news({ _id: "d", eventDate: "bad" })), now), PublicContentError);
});

test("local draft date formatting does not weaken the production required-publication or draft-ID guards", () => {
  assert.equal(formatHomepageNewsDate("2026-05-14", undefined), "14 Mei 2026");
  assert.throws(() => map(bundle(news({ eventDate: "2026-05-14", publishedAt: undefined })), now), PublicContentError);
  assert.throws(() => map(bundle(news({ _id: "drafts.test-news-date", eventDate: "2026-05-14" })), now), PublicContentError);
});
