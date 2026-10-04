import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { register } from "node:module";
import { createJiti } from "jiti";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ROOT } from "../sanity-migration/plan.mjs";
import { validatePlan } from "../sanity-migration/validation.mjs";

const base = path.join(ROOT, "src/sanity/tools/lecture-generator");
register(new URL("./styles-test-loader.mjs", import.meta.url));
const jiti = createJiti(import.meta.url, { fsCache: false, moduleCache: true, jsx: { runtime: "automatic" } });
const m = await jiti.import(path.join(base, "model.ts"));
const layout = await jiti.import(path.join(base, "poster-layout.ts"));
const { LecturePoster } = await jiti.import(path.join(base, "LecturePoster.tsx"));
const { InteractiveLecturePoster } = await jiti.import(path.join(base, "InteractiveLecturePoster.tsx"));
const { LectureGeneratorTool } = await jiti.import(path.join(base, "LectureGeneratorTool.tsx"));
const { lectureMonth } = await jiti.import(path.join(ROOT, "src/sanity/schemaTypes/lectureMonth.ts"));
const render = (schedule, settings = m.defaultPosterSettings, speakers = m.demoSpeakers) => renderToStaticMarkup(React.createElement(LecturePoster, { schedule, settings, speakers }));
const text = (html) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
const rule = (fields = {}) => ({ id: "qa-rule", weekday: 1, occurrence: 0, sessionType: "maghrib", speakerId: "demo-a", topic: "Generated topic", isActive: true, ...fields });
const session = (fields = {}) => ({ id: "qa-session", sessionType: "maghrib", speakerId: "demo-a", topic: "Underlying unique topic", ...fields });
const day = (schedule, number) => schedule.entries.find(({ day }) => day === number);

test("all weekdays and occurrences match independent UTC calendar dates across leap and six-row months", () => {
  for (const year of [2020, 2024, 2026, 2100]) for (let month = 1; month <= 12; month++) for (let weekday = 0; weekday < 7; weekday++) for (let occurrence = 0; occurrence <= 5; occurrence++) {
    const expected = [];
    let nth = 0;
    for (let date = 1; date <= new Date(Date.UTC(year, month, 0)).getUTCDate(); date++) {
      if (new Date(Date.UTC(year, month - 1, date)).getUTCDay() !== weekday) continue;
      nth++;
      if (!occurrence || occurrence === nth) expected.push(date);
    }
    assert.deepEqual(m.applyRecurringRules(year, month, [rule({ weekday, occurrence })]).map(({ day }) => day), expected);
  }
});

test("inactive rules are skipped, sessions are ordered, and a third session fails without changing prior state", () => {
  assert.deepEqual(m.applyRecurringRules(2026, 10, [rule({ isActive: false })]), []);
  const rules = [rule(), rule({ id: "early", sessionType: "subuh" })];
  assert.deepEqual(m.applyRecurringRules(2026, 10, rules)[0].sessions.map(({ sessionType }) => sessionType), ["subuh", "maghrib"]);
  assert.throws(() => m.applyRecurringRules(2026, 10, [...rules, rule({ id: "third" })]), /two sessions/);
  const schedule = m.createReviewSchedule(), original = structuredClone(schedule);
  assert.throws(() => m.updateDay(schedule, 24, [session(), session(), session()]), /two sessions/);
  assert.deepEqual(schedule, original);
});

test("full poster preserves generated sessions and rule provenance; remove reveals them without losing the manual override", () => {
  const rules = [rule()], original = { year: 2026, month: 10, entries: m.applyRecurringRules(2026, 10, rules) };
  const stored = day(original, 5).sessions;
  const withPoster = m.updateSpecialPoster(original, 5, m.demoSpecialPoster);
  assert.equal(day(withPoster, 5).sessions, stored);
  assert.equal(day(withPoster, 5).sessions[0].sourceRuleId, "qa-rule");
  assert.equal(day(withPoster, 5).isManualOverride, true);
  const reapplied = { ...withPoster, entries: m.applyRecurringRules(2026, 10, [rule({ topic: "Changed" })], withPoster.entries) };
  assert.equal(day(reapplied, 5), day(withPoster, 5));
  assert.equal(day(reapplied, 12).sessions[0].topic, "Changed");
  const removed = m.updateSpecialPoster(reapplied, 5);
  assert.equal(day(removed, 5).specialPoster, undefined);
  assert.equal(day(removed, 5).sessions, stored);
  assert.equal(day(removed, 5).isManualOverride, true);
  const restored = m.restoreScheduleDay(removed, 5, [rule({ topic: "Changed" })]);
  assert.equal(day(restored, 5).sessions[0].topic, "Changed");
  assert.equal(day(restored, 5).isManualOverride, false);
  assert.equal(day(restored, 12), day(removed, 12));
});

test("session edits under a poster retain its image; manually emptied dates remain empty when rules apply", () => {
  const original = m.createReviewSchedule();
  const edited = m.updateDay(original, 24, [session()]);
  assert.equal(day(edited, 24).specialPoster, day(original, 24).specialPoster);
  const cleared = m.updateDay(edited, 24, []);
  const rules = [rule({ weekday: 6 })];
  const applied = m.applyRecurringRules(2026, 10, rules, cleared.entries);
  assert.deepEqual(applied.find(({ day }) => day === 24).sessions, []);
  assert.equal(applied.find(({ day }) => day === 24).specialPoster, m.demoSpecialPoster);
});

test("restoring a date affects that date only, even when another weekday has a conflicting rule", () => {
  const original = m.createReviewSchedule();
  const rules = [rule({ weekday: 0 }), rule({ weekday: 0, id: "b" }), rule({ weekday: 0, id: "c" })];
  const restored = m.restoreScheduleDay(original, 24, rules);
  assert.equal(day(restored, 24), undefined);
  assert.equal(day(restored, 25), day(original, 25));
  assert.throws(() => m.restoreScheduleDay(original, 25, rules), /two sessions/);
});

test("24 and 25 reuse one fixture image object/source and retain two/one underlying sessions", () => {
  const schedule = m.createReviewSchedule();
  assert.equal(day(schedule, 24).specialPoster.image, day(schedule, 25).specialPoster.image);
  assert.equal(day(schedule, 24).sessions.length, 2);
  assert.equal(day(schedule, 25).sessions.length, 1);
  assert.match(day(schedule, 24).specialPoster.image.alt, /Bukan program sebenar/);
});

test("invalid dates, fit, mode, empty alt and invalid dimensions fail before changing the schedule", () => {
  const schedule = m.createReviewSchedule();
  for (const date of [0, 32, 1.5]) assert.throws(() => m.updateSpecialPoster(schedule, date, m.demoSpecialPoster), /date/);
  for (const patch of [{ mode: "mixed" }, { fit: "stretch" }, { position: "outside" }, { image: { ...m.demoSpecialPoster.image, alt: " " } }, { image: { ...m.demoSpecialPoster.image, width: NaN } }]) assert.throws(() => m.updateSpecialPoster(schedule, 24, { ...m.demoSpecialPoster, ...patch }), /Poster requires/);
  assert.equal(m.lectureMonthDocumentId(2026, 1), "lectureMonth-2026-01");
  for (const [year, month] of [[2019, 1], [2026, 13], [2026.5, 1]]) assert.throws(() => m.lectureMonthDocumentId(year, month));
});

test("all valid dates have one native keyboard button, chronological focus order and explicit selection semantics", () => {
  const html = renderToStaticMarkup(React.createElement(InteractiveLecturePoster, { schedule: m.createReviewSchedule(), speakers: m.demoSpeakers, settings: m.defaultPosterSettings, selectedDay: 24, onSelectDay() {} }));
  const buttons = [...html.matchAll(/<button[^>]+data-date-cell="(\d+)"[^>]+>/g)];
  assert.deepEqual(buttons.map((match) => Number(match[1])), Array.from({ length: 31 }, (_, index) => index + 1));
  assert.match(buttons[23][0], /type="button".*aria-label="24 Oktober 2026.*aria-pressed="true".*aria-controls="lecture-selected-day"/);
  assert.match(buttons[24][0], /special program poster; preserved sessions hidden/);
  assert.doesNotMatch(html, /data-date-cell="0"/);
});

test("editing grid keeps touch targets at least 44px high at all requested widths, including six rows", () => {
  for (const width of [343, 375, 430, 768, 1440]) for (const [year, month, compact] of [[2026, 10, true], [2026, 3, false]]) {
    const height = layout.editingGridHeight(year, month, compact, width);
    const cells = layout.posterCellRects(year, month, compact, height);
    assert.ok(cells.cells[0].height * width / layout.POSTER.width >= 44 - 1e-9);
    assert.equal(cells.cells.filter(({ day }) => day).length, m.daysInMonth(year, month));
  }
  assert.equal(layout.posterMonthCells(2026, 3, false).rows, 6);
  assert.equal(layout.posterCellRects(2026, 3, false).height, 877);
});

test("full artwork renders contain/cover explicitly, retains date badges, hides normal copy and never mutates sessions", () => {
  const original = { year: 2026, month: 10, entries: [{ day: 24, sessions: [session()], isManualOverride: true }] };
  const special = m.updateSpecialPoster(original, 24, m.demoSpecialPoster);
  const html = render(special);
  assert.match(html, /data-special-poster="full"/);
  assert.match(html, /preserveAspectRatio="xMidYMid slice"><title>Poster program khas/);
  const cell = layout.posterCellRects(2026, 10, true).cells.find(({ day }) => day === 24);
  assert.match(html, new RegExp(`data-special-poster="full"[^>]* x="0" y="0" width="${cell.width}" height="${cell.height}"`));
  assert.ok(html.indexOf('data-special-poster="full"') < html.indexOf('>24</text>'));
  assert.match(render(m.updateSpecialPoster(special, 24, { ...m.demoSpecialPoster, fit: "contain" })), /preserveAspectRatio="xMidYMid meet"><title>/);
  assert.match(render(m.updateSpecialPoster(special, 24, { ...m.demoSpecialPoster, position: "top" })), /preserveAspectRatio="xMidYMin slice"><title>/);
  assert.match(render(m.updateSpecialPoster(special, 24, { ...m.demoSpecialPoster, position: "bottom" })), /preserveAspectRatio="xMidYMax slice"><title>/);
  assert.match(render(m.updateSpecialPoster(special, 24, { ...m.demoSpecialPoster, fit: "contain", position: "bottom" })), /preserveAspectRatio="xMidYMid meet"><title>/);
  assert.doesNotMatch(text(html), /Underlying unique topic/);
  assert.match(text(render(m.updateSpecialPoster(special, 24))), /Underlying unique topic/);
  assert.match(render(m.updateSpecialPoster(special, 24, { ...m.demoSpecialPoster, fit: "cover" })), /preserveAspectRatio="xMidYMid slice"><title>/);
  assert.equal(day(special, 24).sessions, day(original, 24).sessions);
  assert.match(html, />24<\/text>/);
});

test("renderer handles single/two sessions, Yasin, Jumaat, empty dates and a six-row month", () => {
  const html = text(render(m.createDemoSchedule()));
  assert.match(html, /BACAAN YASIN/);
  assert.match(html, /TAHLIL/);
  assert.match(html, /TAZKIRAH JUMAAT/);
  assert.match(html, /PENGAJIAN HADIS/);
  assert.match(html, /AL-QURAN &amp; TAJWID/);
  assert.match(render({ year: 2026, month: 3, entries: [] }, { ...m.defaultPosterSettings, compactCalendar: false }), /viewBox="0 0 1240 877"/);
});

test("long copy fails visibly rather than truncating silently, but hidden sessions do not block full poster export", () => {
  const schedule = { year: 2026, month: 10, entries: [{ day: 24, sessions: [session({ topic: "Long content ".repeat(12) })], isManualOverride: true }] };
  assert.match(render(schedule), /data-overflow="24"/);
  const longSpeaker = [{ ...m.demoSpeakers[0], name: "Nama panjang ".repeat(12) }];
  assert.match(render(schedule, m.defaultPosterSettings, longSpeaker), /data-overflow="24"/);
  assert.doesNotMatch(render(m.updateSpecialPoster(schedule, 24, m.demoSpecialPoster)), /data-overflow=/);
});

test("existing session name/photo snapshots override mutable library data; an absent snapshot portrait stays absent", () => {
  const schedule = { year: 2026, month: 10, entries: [{ day: 24, sessions: [session({ speakerName: "Frozen name", photo: { src: "/frozen.png", width: 100, height: 120 } })], isManualOverride: true }] };
  const html = render(schedule);
  assert.match(text(html), /FROZEN NAME/);
  assert.match(html, /href="\/frozen.png"/);
  assert.doesNotMatch(text(html), /PENCERAMAH CONTOH A/);
  assert.doesNotMatch(render({ ...schedule, entries: [{ ...schedule.entries[0], sessions: [session({ speakerName: "Frozen name" })] }] }), /speaker-a.webp/);
});

test("editor primary surface precedes the selected-day editor, draft/publish remain disabled, export has no interactive overlay", () => {
  const html = renderToStaticMarkup(React.createElement(LectureGeneratorTool));
  assert.ok(html.indexOf("poster-preview-title") < html.indexOf('aria-label="Jadual editor"'));
  assert.match(html, /<details.*Choose date from a list/);
  assert.match(html, /disabled=""[^>]*>Save Draft \(prototype\)/);
  assert.match(html, /disabled=""[^>]*>Publish Jadual/);
  assert.match(html, /Selected date: 24 hb/);
  assert.equal((html.match(/data-date-cell=/g) || []).length, 31);
  assert.equal((html.match(/data-lecture-poster="true"/g) || []).length, 2);
  assert.equal(lectureMonth.readOnly, true);
});

test("real Sanity schema accepts legacy and full-poster month fixtures; rejects malformed posters, third sessions and dates", async () => {
  const image = { _type: "editorialImage", alt: "Synthetic QA artwork", asset: { _type: "reference", _ref: "pending-image-demo" } };
  const entry = { _key: "day24", _type: "lectureDay", date: "2026-10-24", sessions: [], isManualOverride: true, specialPoster: { image, fit: "cover", position: "top", mode: "full" } };
  const document = (id, entries) => ({ _id: `drafts.qa-${id}`, _type: "lectureMonth", year: 2026, month: 10, entries });
  const plan = { errors: [], collisions: [], missing: [], assets: [{ exists: true, assetId: "demo" }] };
  const valid = await validatePlan(plan, [document("legacy", [{ ...entry, specialPoster: undefined }]), document("legacy-poster", [{ ...entry, specialPoster: { image, fit: "contain", mode: "full" } }]), document("shared", [entry, { ...entry, _key: "day25", date: "2026-10-25" }])]);
  assert.deepEqual(valid.errors, []);
  const invalid = [
    { ...entry, isManualOverride: false },
    { ...entry, specialPoster: { ...entry.specialPoster, mode: "mixed" } },
    { ...entry, specialPoster: { ...entry.specialPoster, fit: "stretch" } },
    { ...entry, specialPoster: { ...entry.specialPoster, position: "outside" } },
    { ...entry, specialPoster: { ...entry.specialPoster, image: { ...image, alt: "" } } },
    { ...entry, specialPoster: { ...entry.specialPoster, image: undefined } },
    { ...entry, date: "2026-10-32" },
    { ...entry, sessions: Array.from({ length: 3 }, (_, index) => ({ _key: `s${index}`, _type: "lectureSession", sessionType: "maghrib" })) },
  ];
  const result = await validatePlan(plan, invalid.map((item, index) => document(`invalid-${index}`, [item])));
  for (let index = 0; index < invalid.length; index++) assert.ok(result.errors.some(({ documentId }) => documentId === `drafts.qa-invalid-${index}`), `expected validation failure for case ${index}`);
});

test("infaq chooses actual leading/trailing no-date groups, largest wins and equal groups prefer leading", () => {
  for (const [year, month, compact, leading, trailing, edge] of [
    [2026, 10, true, 3, 1, "leading"],
    [2026, 4, true, 2, 3, "trailing"],
    [2026, 9, true, 1, 4, "trailing"],
    [2026, 6, true, 0, 5, "trailing"],
    [2026, 7, true, 2, 2, "leading"],
    [2026, 3, false, 6, 5, "leading"],
    [2026, 8, false, 5, 6, "trailing"],
    [2026, 2, true, 0, 0, undefined],
  ]) {
    const cells = layout.posterCellRects(year, month, compact);
    const result = layout.infaqPlacement(cells);
    assert.equal(result.leading, leading);
    assert.equal(result.trailing, trailing);
    assert.equal(result.panel?.edge, edge);
    if (result.panel) assert.equal(result.panel.cell.day, 0);
  }
  // A single no-date cell never qualifies, regardless of the opposite end.
  const base = layout.posterCellRects(2026, 10, true);
  for (const cells of [[{day:0,span:1},{day:1,span:1}], [{day:1,span:1},{day:0,span:1}], [{day:0,span:1},{day:1,span:1},{day:0,span:1}]]) {
    assert.equal(layout.infaqPlacement({...base,cells}).panel, undefined);
  }
});

test("infaq placement never consumes, shifts or invents a date across 81 years and both calendar layouts", () => {
  for (let year = 2020; year <= 2100; year++) for (let month = 1; month <= 12; month++) for (const compact of [false, true]) {
    const cells = layout.posterCellRects(year, month, compact), before = structuredClone(cells);
    const result = layout.infaqPlacement(cells);
    assert.deepEqual(cells, before);
    assert.deepEqual(cells.cells.filter(({ day }) => day).map(({ day }) => day).sort((a, b) => a-b), Array.from({ length: m.daysInMonth(year, month) }, (_, i) => i+1));
    if (result.panel) {
      assert.equal(result.panel.cell.day, 0);
      assert.ok(result.panel.cell.span >= 2);
      assert.equal(result.panel.cell.span, Math.max(result.leading, result.trailing));
      if (result.leading === result.trailing) assert.equal(result.panel.edge, "leading");
    } else assert.ok(result.leading < 2 && result.trailing < 2);
  }
});

test("QR content caps at three cells and stays centred inside large no-date groups without clipping its square", () => {
  const column = (layout.POSTER.gridWidth - 6 * layout.POSTER.columnGap) / 7;
  for (const span of [2, 3, 4, 5, 6]) for (const height of [97.5, 117, 180]) {
    const width = span * column + (span - 1) * layout.POSTER.columnGap;
    const box = layout.infaqGeometry(width, height);
    assert.ok(box.contentWidth <= column * 3 + 2 * layout.POSTER.columnGap);
    assert.ok(Math.abs(box.left - 8 - (width - box.contentWidth) / 2) < 1e-9);
    assert.ok(box.qrY >= 8 && box.qrY + box.qrSize <= height - 8);
    assert.ok(box.textX + box.textWidth <= width - 8);
  }
});

test("shared renderer puts QR only on an eligible blank panel, keeps original copy/quiet zone and toggles off cleanly", () => {
  const schedule = m.createReviewSchedule(), before = structuredClone(schedule);
  const html = render(schedule);
  assert.equal((html.match(/data-infaq-panel=/g) || []).length, 1);
  assert.match(html, /data-infaq-panel="leading"/);
  assert.match(html, /data-infaq-qr="true"[^>]*href="\/lecture-demo\/general-mosque-qr.png"[^>]*preserveAspectRatio="xMidYMid meet"/);
  assert.match(text(html), /INFAQ UNTUK MASJID Imbas untuk menyumbang MASJID TALHAH BIN UBAIDILLAH/);
  assert.doesNotMatch(html, /data-poster-day="0"/);
  assert.doesNotMatch(render(schedule, { ...m.defaultPosterSettings, showInfaq: false }), /data-infaq-panel=/);
  assert.doesNotMatch(render(schedule, { ...m.defaultPosterSettings, generalDonationQr: undefined }), /data-infaq-panel=/);
  assert.doesNotMatch(render({year:2026, month:2, entries:[]}), /data-infaq-panel=/);
  assert.match(render({year:2026, month:4, entries:[]}), /data-infaq-panel="trailing"/);
  const validCells = str => [...str.matchAll(/<g[^>]*data-poster-day="\d+"[^>]*>.*?<g transform="([^"]+)"/g)].map(match=>match[0]);
  assert.deepEqual(validCells(html), validCells(render(schedule, { ...m.defaultPosterSettings, showInfaq:false })));
  assert.deepEqual(schedule, before);
  assert.equal((html.match(/data-special-poster="full"/g) || []).length, 2);
});

test("owner-supplied general QR stays byte-identical; month stores a boolean only, never a QR/date duplicate", () => {
  const bytes = fs.readFileSync(path.join(ROOT, "public/lecture-demo/general-mosque-qr.png"));
  assert.equal(crypto.createHash("sha256").update(bytes).digest("hex"), "1b86b6336223e38fb103f23368cafae07cb0c1ea66e5a3bc1bb53b9eb6ed792d");
  assert.equal(bytes.readUInt32BE(16), 853); assert.equal(bytes.readUInt32BE(20), 853);
  const field = lectureMonth.fields.find(({name})=>name==="showInfaq");
  assert.equal(field.type, "boolean"); assert.equal(field.initialValue, true);
  assert.equal(lectureMonth.readOnly, true);
  assert.ok(!lectureMonth.fields.some(({name})=>/qr/i.test(name)));
  const html = renderToStaticMarkup(React.createElement(LectureGeneratorTool));
  assert.equal((html.match(/data-date-cell=/g) || []).length, 31);
});
