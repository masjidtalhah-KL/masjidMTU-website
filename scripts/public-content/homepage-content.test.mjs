import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import fs from "node:fs/promises";
import { createJiti } from "jiti";
import { parse, evaluate } from "groq-js";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ROOT } from "../sanity-migration/plan.mjs";

const jiti = createJiti(import.meta.url, { fsCache: false, moduleCache: true, jsx: { runtime: "automatic" }, alias: { "@": path.join(ROOT, "src") } });
const load = (name) => jiti.import(path.join(ROOT, "src/lib/public-content/cms", `${name}.ts`));
const { mapHomepageEditorial: map, unavailableHomepageEditorial: fallback } = await load("homepage-adapters");
const { PublicContentError, readWithFallback } = await load("read-policy");
const { homepageEditorialQuery } = await load("homepage-queries");
const views = await jiti.import(path.join(ROOT, "src/components/public/homepage-editorial.tsx"));
const now = Date.parse("2026-10-02T04:00:00Z");
const empty = () => ({ announcements: [], programs: [], news: [] });
// Synthetic in-memory fixtures only: never passed to a Sanity write API.
const announcement = (id = "a", fields = {}) => ({ _id: id, _type: "announcement", title: "Test announcement", summary: "Test summary", publishedAt: "2026-10-01T02:00:00Z", displayOrder: 0, isActive: true, ...fields });
const program = (id = "p", fields = {}) => ({ _id: id, _type: "program", title: "Test program", description: "Test description", startAt: "2026-10-10T00:30:00Z", displayOrder: 0, isActive: true, ...fields });
const news = (id = "n", fields = {}) => ({ _id: id, _type: "newsPost", title: "Test article", excerpt: "Test excerpt", publishedAt: "2026-10-01T02:00:00Z", ...fields });
const populated = () => ({ announcements: [announcement()], programs: [program()], news: [news()] });
const query = async (dataset) => (await evaluate(parse(homepageEditorialQuery), { dataset })).get();
const render = (editorial) => Object.values(views).map((component) => renderToStaticMarkup(React.createElement(component, { editorial }))).join("");

test("published query excludes drafts/releases, unrelated records and unused fields", async () => {
  const records = [announcement(), program(), news()];
  const result = await query([...records, ...records.map((d) => ({ ...d, _id: `drafts.${d._id}` })), ...records.map((d) => ({ ...d, _id: `versions.release.${d._id}` })), { _id: "lecture", _type: "lecture", title: "NOT EDITORIAL" }]);
  assert.deepEqual([result.announcements.length, result.programs.length, result.news.length], [1, 1, 1]);
  assert.equal(Object.hasOwn(result.news[0], "isActive"), false);
  assert.equal(Object.hasOwn(result.programs[0], "image"), false);
  assert.equal(Object.hasOwn(result.news[0], "body"), false);
  assert.equal(map(result, now).source, "sanity");
});
test("healthy empty published dataset is a successful empty read", async () => {
  assert.deepEqual(map(await query([]), now), { source: "sanity", announcement: null, programs: [], news: [] });
});
test("announcement eligibility and deterministic priority select one published active unexpired entry", () => {
  const bundle = empty();
  bundle.announcements = [
    announcement("inactive", { isActive: false }), announcement("future", { publishedAt: "2026-10-03T04:00:00Z" }),
    announcement("expired", { expiresAt: "2026-10-02T04:00:00Z" }),
    announcement("later-priority", { displayOrder: 1 }),
    announcement("older", { publishedAt: "2026-09-30T04:00:00Z" }), announcement("z"), announcement("a"),
  ];
  assert.equal(map(bundle, now).announcement.id, "a");
});
test("program priority/date ordering limits three and excludes inactive or completed programs", () => {
  const bundle = empty();
  bundle.programs = [
    program("inactive", { isActive: false }), program("past", { startAt: "2026-10-01T01:00:00Z" }),
    program("ended", { startAt: "2026-10-01T01:00:00Z", endAt: "2026-10-02T04:00:00Z" }),
    program("ongoing", { startAt: "2026-10-02T03:00:00Z", endAt: "2026-10-02T05:00:00Z" }),
    program("b"), program("a"), program("c"), program("priority", { displayOrder: 1 }),
  ];
  assert.deepEqual(map(bundle, now).programs.map((d) => d.id), ["ongoing", "a", "b"]);
  assert.equal(map({ ...empty(), programs: [program("starting", { startAt: new Date(now).toISOString() })] }, now).programs.length, 1);
});
test("news uses publication date without an invented active flag; newest three with stable ties", () => {
  const bundle = empty();
  bundle.news = [news("future", { publishedAt: "2026-10-03T04:00:00Z" }), news("older", { publishedAt: "2026-09-30T04:00:00Z" }), news("z"), news("a"), news("b")];
  assert.deepEqual(map(bundle, now).news.map((d) => d.id), ["a", "b", "z"]);
});
test("date/time labels use Kuala Lumpur timezone and optional values remain absent", () => {
  const result = map(populated(), now);
  assert.equal(result.programs[0].date, new Intl.DateTimeFormat("ms-MY", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kuala_Lumpur" }).format(Date.parse("2026-10-10T00:30:00Z")));
  assert.match(result.programs[0].time, /8:30/);
  assert.equal(result.programs[0].category, null);
  assert.equal(result.news[0].category, null);
  assert.equal(result.announcement.cta, null);
  assert.equal(map({ ...empty(), news: [news("n", { category: "activity" })] }, now).news[0].category, "Aktiviti");
});
for (const input of [null, {}, { ...empty(), news: null }, { ...empty(), programs: {} }, { ...empty(), announcements: [null] }]) {
  test(`malformed bundle/list fails visibly: ${JSON.stringify(input)}`, () => assert.throws(() => map(input, now), PublicContentError));
}
for (const [name, change] of [
  ["missing summary", (b) => delete b.announcements[0].summary],
  ["empty title", (b) => b.news[0].title = " "],
  ["overlong excerpt", (b) => b.news[0].excerpt = "x".repeat(301)],
  ["unknown news category", (b) => b.news[0].category = "unknown"],
  ["missing isActive", (b) => delete b.programs[0].isActive],
  ["string isActive", (b) => b.announcements[0].isActive = "true"],
  ["negative order", (b) => b.programs[0].displayOrder = -1],
  ["fractional order", (b) => b.announcements[0].displayOrder = 1.5],
  ["draft ID", (b) => b.news[0]._id = "drafts.n"],
  ["release ID", (b) => b.programs[0]._id = "versions.release.p"],
  ["duplicate IDs", (b) => b.news.push(news())],
  ["wrong type", (b) => b.news[0]._type = "program"],
  ["date without timezone", (b) => b.news[0].publishedAt = "2026-10-01T00:00:00"],
  ["calendar rollover", (b) => b.news[0].publishedAt = "2026-02-30T00:00:00Z"],
  ["end before start", (b) => b.programs[0].endAt = "2026-10-01T00:00:00Z"],
  ["expiry before publication", (b) => b.announcements[0].expiresAt = "2026-09-01T00:00:00Z"],
  ["invalid inactive candidate", (b) => { b.programs[0].isActive = false; b.programs[0].startAt = "bad"; }],
  ["invalid candidate beyond limit", (b) => { b.news = [news("a"), news("b"), news("c"), news("d", { excerpt: null })]; }],
]) {
  test(`malformed content fails visibly: ${name}`, () => {
    const bundle = populated(); change(bundle);
    assert.throws(() => map(bundle, now), PublicContentError);
  });
}
for (const url of ["javascript:alert(1)", "//evil.example", "https://user:password@example.com", "/\\evil", "/has space", " https://example.com"]) {
  test(`reject unsafe CTA: ${url}`, () => assert.throws(() => map({ ...empty(), announcements: [announcement("a", { cta: { label: "Read", url } })] }, now), PublicContentError));
}
test("valid optional CTA accepts site-relative, anchor and http(s) targets with accessible labels", () => {
  for (const url of ["/hubungi", "#contact", "https://example.com/", "http://example.com/"]) {
    const content = map({ ...empty(), announcements: [announcement("a", { cta: { label: "Read announcement", url } })] }, now);
    const html = renderToStaticMarkup(React.createElement(views.HomepageAnnouncementSection, { editorial: content }));
    assert.match(html, /aria-label="Read announcement"/);
    assert.ok(html.includes(`href="${url}"`));
  }
});
test("temporary outage yields explicit empty UI fallback and safe warning, never mock editorial cards", async () => {
  const warnings = [];
  const result = await readWithFallback("homepage-editorial", async () => { throw new TypeError("fetch failed"); }, map, fallback, (message) => warnings.push(message));
  assert.deepEqual(result, { source: "unavailable", announcement: null, programs: [], news: [] });
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /homepage-editorial: temporary Sanity failure/);
  const html = render(result);
  assert.equal((html.match(/tidak tersedia buat sementara waktu/g) ?? []).length, 3);
  assert.doesNotMatch(html, /Gotong-royong|Bicara keluarga|Sorotan program|mock data/);
});
test("authentication/query errors and malformed content never invoke fallback", async () => {
  const never = () => assert.fail("Fallback must not run");
  for (const statusCode of [400, 401, 403, 404]) {
    await assert.rejects(readWithFallback("homepage-editorial", async () => { throw Object.assign(new Error("status"), { statusCode }); }, map, never));
  }
  await assert.rejects(readWithFallback("homepage-editorial", async () => null, map, never), PublicContentError);
});
test("healthy empty presentation preserves section shells and distinguishes empty from outage", () => {
  const html = render(map(empty(), now));
  for (const id of ["announcements", "programs", "updates"]) assert.ok(html.includes(`id="${id}"`));
  assert.equal((html.match(/Belum ada/g) ?? []).length, 3);
  assert.doesNotMatch(html, /tidak tersedia|Test program|Kandungan contoh|mock data/);
});
test("populated presentation retains original card classes, headings, decorative visuals and grid", () => {
  const bundle = populated();
  bundle.programs = [program("a"), program("b"), program("c")];
  bundle.news = [news("a"), news("b"), news("c")];
  const html = render(map(bundle, now));
  assert.equal((html.match(/class="card card--light program-card"/g) ?? []).length, 3);
  assert.equal((html.match(/class="card card--light update-card"/g) ?? []).length, 3);
  assert.equal((html.match(/class="home-card-grid"/g) ?? []).length, 2);
  for (const variant of [1, 2, 3]) assert.ok(html.includes(`update-card__visual--${variant}`));
  assert.match(html, /aria-hidden="true"/);
  assert.match(html, /<h3/);
  assert.doesNotMatch(html, /mock data|contoh kandungan/);
});
test("server boundary pins published token-free 300-second caching and homepage no longer imports editorial mocks", async () => {
  const server = await fs.readFile(path.join(ROOT, "src/lib/public-content/cms/homepage-server.ts"), "utf8");
  assert.match(server, /import "server-only"/);
  assert.match(server, /token: undefined/);
  assert.match(server, /perspective: "published"/);
  assert.match(server, /cache: "force-cache"/);
  assert.match(server, /revalidate: PUBLIC_CONTENT_REVALIDATE_SECONDS/);
  const page = await fs.readFile(path.join(ROOT, "src/app/page.tsx"), "utf8");
  assert.match(page, /export const revalidate = 300/);
  assert.match(page, /getHomepageEditorial\(\)/);
  assert.doesNotMatch(page, /upcomingPrograms|communityUpdates|announcement\./);
  assert.match(page, /lectureSchedule\.map/);
});
