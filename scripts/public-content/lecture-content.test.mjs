import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs/promises";
import path from "node:path";
import { createJiti } from "jiti";
import { parse, evaluate } from "groq-js";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ROOT } from "../sanity-migration/plan.mjs";

const jiti = createJiti(import.meta.url, { fsCache: false, moduleCache: true, jsx: { runtime: "automatic" }, alias: {
  "@": path.join(ROOT, "src"),
  "./public-lectures.module.css": path.join(ROOT, "scripts/public-content/css-test-stub.mjs"),
  "next/image": path.join(ROOT, "scripts/public-content/next-image-test-interop.mjs"),
} });
const load = file => jiti.import(path.join(ROOT, file));
const c = await load("src/lib/public-content/lectures/content.ts");
const q = await load("src/lib/public-content/lectures/queries.ts");
const { PublicContentError } = await load("src/lib/public-content/cms/read-policy.ts");
const { LectureSchedule } = await load("src/components/public/lecture-schedule.tsx");
const { LecturePage } = await load("src/components/public/lecture-page.tsx");
const { LecturePoster } = await load("src/sanity/tools/lecture-generator/LecturePoster.tsx");
const { defaultPosterSettings } = await load("src/sanity/tools/lecture-generator/model.ts");
const { exportPoster } = await load("src/sanity/tools/lecture-generator/export-poster.ts");
const { publishedPosterAsset, publicPosterFetchUrl } = await load("src/lib/public-content/lectures/images.ts");
// Immutable approved source, copied in memory only. Never passed to a mutation API.
const approved = JSON.parse(await fs.readFile(path.join(ROOT, "docs/LECTURE-FIRST-PUBLICATION-DRY-RUN.json"), "utf8")).plan;
const original = { ...approved.payload, _id: "lectureMonth-2026-10", _rev: "published-test" };
const compactId = "image-46cfd9cd56c2bdf6ad48cf6bdba8e83cc6f41ba8-853x853-png";
const compactQr = { _type: "editorialImage", alt: "QR sumbangan umum Masjid Talhah Bin Ubaidillah", asset: { _type: "reference", _ref: compactId } };
const asset = _id => ({ _id, _type: "sanity.imageAsset" });
const assets = [...approved.references, compactId].map(asset);
const doc = () => structuredClone(original);
const bundle = () => ({ document: doc(), portraits: assets, posters: [], compactQr, compactAsset: asset(compactId) });
const index = (year = 2026, month = 10) => ({ _id: `lectureMonth-${year}-${String(month).padStart(2,"0")}`, _type: "lectureMonth", year, month });
const runQuery = async (query, dataset, params = {}) => (await evaluate(parse(query), { dataset, params })).get();
const renderSchedule = schedule => renderToStaticMarkup(React.createElement(LectureSchedule, { schedule }));
const now = new Date("2026-10-04T04:00:00Z");

test("raw GROQ excludes draft and release months/settings; public query cannot retrieve a draft ID", async () => {
  const draft = { ...doc(), _id: "drafts.lectureMonth-2026-10", entries: [] };
  const settings = { _id: "siteSettings", _type: "siteSettings", donationInfo: { compactQr } };
  const dataset = [doc(), draft, { ...draft, _id: "versions.review.lectureMonth-2026-10" }, settings,
    { ...settings, _id: "drafts.siteSettings", donationInfo: {} }, ...assets];
  assert.deepEqual(await runQuery(q.lectureIndexQuery, dataset), [index()]);
  const result = await runQuery(q.lectureMonthQuery, dataset, { id: original._id });
  assert.deepEqual(result.document, original);
  assert.deepEqual(result.compactQr, compactQr);
  assert.equal(c.mapLectureMonth(result, "2026-10").schedule.entries.length, 30);
  assert.equal((await runQuery(q.lectureMonthQuery, dataset, { id: draft._id })).document, null);
});
test("month index rejects draft IDs, noncanonical IDs, malformed periods and duplicate months", () => {
  for (const input of [[{ ...index(), _id: "drafts.lectureMonth-2026-10" }], [{ ...index(), month: 13 }], [index(), index()], [{ ...index(), year: "2026" }]]) {
    assert.throws(() => c.mapLectureIndex(input), PublicContentError);
  }
});
test("current month uses Kuala Lumpur calendar; default prefers current even if a newer month exists", async () => {
  assert.equal(c.currentMonthKey(new Date("2026-09-30T16:01:00Z")), "2026-10");
  const state = await c.loadLecturePage(async () => [index(2026,9), index(), index(2026,11)], async () => bundle(), undefined, now);
  assert.equal(state.month.key, "2026-10"); assert.equal(state.defaultFallback, false);
  assert.equal(state.previous.href, "/kuliah/2026-09"); assert.equal(state.next.href, "/kuliah/2026-11");
});
test("missing current schedule uses latest published month with explicit fallback, single month has no neighbours", async () => {
  const state = await c.loadLecturePage(async () => [index()], async () => bundle(), undefined, new Date("2026-12-01T00:00:00Z"));
  assert.equal(state.defaultFallback, true); assert.equal(state.current, false);
  assert.equal(state.previous, undefined); assert.equal(state.next, undefined);
});
test("shareable month accepts only existing published months; malformed or absent month never fetches content", async () => {
  const read = () => { throw new Error("Should not read an unavailable month"); };
  for (const key of ["2026-11", "2026-13", "drafts.2026-10"]) assert.equal((await c.loadLecturePage(async () => [index()], read, key, now)).status, "not-found");
  assert.equal((await c.loadLecturePage(async () => [index()], async () => bundle(), "2026-10", now)).status, "ready");
});

test("month navigation hides unavailable neighbours and renders real published neighbours when available", async () => {
  const render = state => renderToStaticMarkup(React.createElement(LecturePage, { state }));
  const single = render(await c.loadLecturePage(async () => [index()], async () => bundle(), "2026-10", now));
  const nav = single.match(/<nav[^>]*aria-label="Bulan jadual kuliah"[\s\S]*?<\/nav>/)[0];
  assert.doesNotMatch(nav, /Bulan sebelumnya|Bulan seterusnya|<button/);
  assert.match(nav, /Oktober 2026|aria-current="page"/);
  const multiple = render(await c.loadLecturePage(async () => [index(2026,9),index(),index(2026,11)], async () => bundle(), "2026-10", now));
  assert.match(multiple, /aria-label="Bulan sebelumnya: September 2026"/);
  assert.match(multiple, /aria-label="Bulan seterusnya: November 2026"/);
});
test("healthy empty state differs from temporary outage; auth/query/malformed failures are errors", async () => {
  assert.deepEqual(await c.loadLecturePage(async () => [], async () => bundle()), { status: "empty" });
  for (const error of [{ statusCode: 503 }, { code: "ETIMEDOUT" }]) {
    assert.deepEqual(await c.loadLecturePage(async () => { throw error; }, async () => bundle()), { status: "unavailable" });
    assert.deepEqual(await c.loadLecturePage(async () => [index()], async () => { throw error; }), { status: "unavailable" });
  }
  for (const error of [{ statusCode: 401 }, { statusCode: 400 }]) await assert.rejects(c.loadLecturePage(async () => { throw error; }, async () => bundle()));
  await assert.rejects(c.loadLecturePage(async () => [index()], async () => ({ ...bundle(), document: { ...doc(), entries: "broken" } })), PublicContentError);
});
test("malformed snapshot and unresolved portraits/special posters stop rendering instead of repairing", () => {
  const broken = bundle(); broken.document.entries[0].date = "2026-11-01";
  assert.throws(() => c.mapLectureMonth(broken, "2026-10"), PublicContentError);
  assert.throws(() => c.mapLectureMonth({ ...bundle(), portraits: [] }, "2026-10"), PublicContentError);
  assert.throws(() => c.mapLectureMonth({ ...bundle(), document: { ...doc(), _id: "drafts.lectureMonth-2026-10" } }, "2026-10"), PublicContentError);
  const tooMany = bundle(); tooMany.document.entries[2].sessions.push(structuredClone(tooMany.document.entries[2].sessions[0]));
  assert.throws(() => c.mapLectureMonth(tooMany, "2026-10"), PublicContentError);
});
test("missing compact QR omits Infaq; never falls back to branded/dummy artwork; malformed QR is visible error", () => {
  const month = c.mapLectureMonth({ ...bundle(), compactQr: null, compactAsset: null }, "2026-10");
  assert.equal(month.compactQr, undefined); assert.equal(month.infaqUnavailable, true);
  assert.throws(() => c.mapLectureMonth({ ...bundle(), compactAsset: null }, "2026-10"), PublicContentError);
});
test("October text exposes exactly 30 meaningful dates/34 sessions, both sessions, no invented 31st or speaker placeholder", () => {
  const month = c.mapLectureMonth(bundle(), "2026-10"), days = c.textSchedule(month.schedule), html = renderSchedule(month.schedule);
  assert.equal(days.length, 30); assert.equal(days.reduce((n,d) => n+d.sessions.length,0), 34);
  assert.equal(days.find(d => d.date === "2026-10-03").sessions.length, 2);
  assert.equal(days[0].label, "1 Oktober 2026");
  assert.equal((html.match(/<time /g) || []).length, 30);
  assert.doesNotMatch(html, /2026-10-31|No Penceramah|demo|Belum diterbitkan/);
  for (const text of ["AL-QUR’AN", "UST K. NI’MAT", "UST MUHD MU’IZZ", "KITAB MATLA’"]) assert.ok(html.includes(text));
  assert.equal(days.find(d => d.date === "2026-10-01").sessions[0].speaker, undefined);
});
test("full special poster exposes alt/link and hides preserved underlying sessions from public text", () => {
  const b = bundle(), entry = b.document.entries.find(e => e.date === "2026-10-24");
  const image = structuredClone(entry.sessions[0].photo); image.alt = "Approved future event artwork";
  entry.specialPoster = { image, mode: "full", fit: "cover", position: "center" };
  entry.isManualOverride = true; b.posters = [asset(image.asset._ref)];
  const month = c.mapLectureMonth(b, "2026-10"), day = c.textSchedule(month.schedule).find(d => d.date.endsWith("-24"));
  assert.equal(day.sessions, undefined); assert.equal(month.schedule.entries.find(e => e.day === 24).sessions.length, entry.sessions.length);
  const html = renderSchedule({ ...month.schedule, entries: month.schedule.entries.filter(e => e.day === 24) });
  assert.match(html, /Program khas|Approved future event artwork|Buka poster program/);
  assert.doesNotMatch(html, /UST MUHD MU’IZZ/);
});
test("official shared renderer preserves poster geometry and images without admin watermark or edit affordances", () => {
  const month = c.mapLectureMonth(bundle(), "2026-10");
  const settings = { ...defaultPosterSettings, generalDonationQr: month.compactQr };
  const render = reviewMode => renderToStaticMarkup(React.createElement(LecturePoster, { schedule: month.schedule, speakers: [], settings: { ...settings, reviewMode, reviewLabel: "ADMIN REVIEW" } }));
  const official = render("official"), studio = render("published");
  assert.doesNotMatch(official, /ADMIN REVIEW|role="button"|tabindex=|BELUM DITERBITKAN/);
  assert.match(official, /Jadual Kuliah rasmi Oktober 2026/);
  assert.match(studio, /ADMIN REVIEW/);
  assert.equal((official.match(/<image /g)||[]).length, (studio.match(/<image /g)||[]).length);
  assert.equal((official.match(/<rect /g)||[]).length, (studio.match(/<rect /g)||[]).length);
  assert.match(official, /46cfd9cd56c2bdf6ad48cf6bdba8e83cc6f41ba8-853x853.png/);
});
test("public read boundary is server-only, token-free, published, cached for 300 seconds; client has no Studio persistence", async () => {
  const server = await fs.readFile(path.join(ROOT, "src/lib/public-content/lectures/server.ts"), "utf8");
  assert.match(server, /import "server-only"/); assert.match(server, /perspective:\s*"published"/); assert.match(server, /token:\s*undefined/); assert.match(server, /revalidate:\s*300/);
  const client = await fs.readFile(path.join(ROOT, "src/components/public/lecture-poster.tsx"), "utf8");
  assert.doesNotMatch(client, /useClient|draft-persistence|publication|LectureGenerator|\.mutate\(/);
  assert.match(client, /import\("@\/sanity\/tools\/lecture-generator\/export-poster"\)/);
  assert.match(client, /reviewOnly:\s*false/);
});
test("actual public export pipeline creates A4 PNG and one-page landscape PDF without prototype suffix; Studio default unchanged", async () => {
  const saved = new Map(["window","document","Image","XMLSerializer"].map(k => [k,globalThis[k]]));
  const create = URL.createObjectURL, revoke = URL.revokeObjectURL;
  const downloads = [], blobs = new Map(), canvases = [];
  URL.createObjectURL = blob => { const key = "blob:test"+blobs.size; blobs.set(key,blob); return key; }; URL.revokeObjectURL = () => {};
  globalThis.Image = class { async decode() {} };
  globalThis.XMLSerializer = class { serializeToString() { return "<svg xmlns='http://www.w3.org/2000/svg'/>"; } };
  globalThis.window = { location: { origin: "http://localhost:3005" }, setTimeout: () => {} };
  globalThis.document = { fonts: { ready: Promise.resolve() }, body: { appendChild() {} }, createElement(tag) {
    if (tag === "a") return { click() { downloads.push({ name: this.download, blob: blobs.get(this.href) }); }, remove() {} };
    const canvas = { width: 0, height: 0, getContext: () => ({ fillRect() {}, drawImage() {} }), toBlob: cb => cb(new Blob(["test PNG"],{type:"image/png"})), toDataURL: () => "data:image/jpeg;base64,/9j/2Q==" };
    canvases.push(canvas); return canvas;
  } };
  const svg = { dataset: { fontsReady: "true" }, cloneNode: () => ({ querySelectorAll: () => [], setAttribute() {} }) };
  try {
    for (const format of ["png","pdf"]) await exportPoster(svg,format,"jadual-kuliah-2026-10","A4",undefined,{reviewOnly:false});
    assert.deepEqual(downloads.map(d => d.name), ["jadual-kuliah-2026-10.png","jadual-kuliah-2026-10.pdf"]);
    assert.ok(canvases.every(c => c.width === 3508 && c.height === 2480));
    const pdf = await downloads[1].blob.text(); assert.match(pdf, /\/Count 1/); assert.match(pdf, /\/MediaBox \[0 0 841.89 595.28\]/);
    await exportPoster(svg,"png","studio","A4"); assert.equal(downloads.at(-1).name,"studio-prototype.png");
  } finally { URL.createObjectURL = create; URL.revokeObjectURL = revoke; for (const [k,v] of saved) { if(v===undefined)delete globalThis[k];else globalThis[k]=v; } }
});
test("download asset boundary permits only images referenced by this published month, with compact QR separate from branded primary", () => {
  const month = c.mapLectureMonth(bundle(), "2026-10");
  assert.match(publishedPosterAsset(month, approved.references[0]), /^https:\/\/cdn.sanity.io\/images\/2o95jmms\/production\//);
  const source = publishedPosterAsset(month, compactId);
  assert.equal(publicPosterFetchUrl(source, month.key), `/kuliah/2026-10/imej/${compactId}`);
  assert.equal(publishedPosterAsset(month, "image-6ba112c3ffc0107ea20e277aa11ff0729eba926b-853x853-png"), undefined);
  assert.equal(publishedPosterAsset(month, "drafts."+compactId), undefined);
  assert.equal(publishedPosterAsset({ ...month, showInfaq: false }, compactId), undefined);
  assert.equal(publicPosterFetchUrl("http://localhost:3005/lecture-demo/header-logos.webp", month.key), "http://localhost:3005/lecture-demo/header-logos.webp");
  assert.throws(() => publicPosterFetchUrl("https://cdn.sanity.io/images/2o95jmms/production/../../secrets", month.key));
});
test("public presentation distinguishes intentional empty and unavailable states without fixture artwork or sessions", () => {
  const render = status => renderToStaticMarkup(React.createElement(LecturePage, { state: { status } }));
  const empty = render("empty"), outage = render("unavailable");
  assert.match(empty, /Jadual kuliah belum diterbitkan/);
  assert.match(outage, /Jadual kuliah tidak tersedia buat sementara waktu/);
  for(const html of [empty,outage]) assert.doesNotMatch(html, /data-lecture-poster|<time |Penceramah Contoh|Muat turun PNG/);
});
