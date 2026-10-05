import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs/promises";
import path from "node:path";
import { createJiti } from "jiti";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { parse, evaluate } from "groq-js";
import { ROOT } from "../sanity-migration/plan.mjs";

const jiti = createJiti(import.meta.url, {
  fsCache: false, moduleCache: true, jsx: { runtime: "automatic" },
  alias: {
    "@": path.join(ROOT, "src"),
    "./homepage-lectures.module.css": path.join(ROOT, "scripts/public-content/css-test-stub.mjs"),
    "next/image": path.join(ROOT, "scripts/public-content/next-image-test-interop.mjs"),
  },
});
const { loadUpcomingLecture: select, malaysiaDateKey } = await jiti.import(path.join(ROOT, "src/lib/public-content/lectures/upcoming.ts"));
const { HomepageLectureSection } = await jiti.import(path.join(ROOT, "src/components/public/homepage-lectures.tsx"));
const { lectureIndexQuery, lectureMonthQuery } = await jiti.import(path.join(ROOT, "src/lib/public-content/lectures/queries.ts"));
const { PublicContentError } = await jiti.import(path.join(ROOT, "src/lib/public-content/cms/read-policy.ts"));
const approved = JSON.parse(await fs.readFile(path.join(ROOT, "docs/LECTURE-FIRST-PUBLICATION-DRY-RUN.json"), "utf8")).plan;
// All alternatives below are in-memory fixtures. No mutation client is used.
const index = (month = 10, year = 2026) => ({ _id: `lectureMonth-${year}-${String(month).padStart(2,"0")}`, _type: "lectureMonth", year, month });
const bundle = (month = 10, year = 2026) => {
  const document = structuredClone(approved.payload);
  Object.assign(document, index(month,year));
  document.entries = document.entries.map(e => ({ ...e, date: `${year}-${String(month).padStart(2,"0")}-${e.date.slice(-2)}` }));
  return { document, portraits: approved.references.map(_id => ({ _id, _type: "sanity.imageAsset" })), posters: [], compactQr: null, compactAsset: null };
};
const on = date => new Date(date + "T12:00:00+08:00");
const render = state => renderToStaticMarkup(React.createElement(HomepageLectureSection, { content: state }));
const get = (now, months = [index()], read = async () => bundle()) => select(async () => months, read, now);

test("Malaysia calendar date rolls at local midnight, including year rollover", () => {
  assert.equal(malaysiaDateKey(new Date("2026-10-03T15:59:59Z")), "2026-10-03");
  assert.equal(malaysiaDateKey(new Date("2026-10-03T16:00:00Z")), "2026-10-04");
  assert.equal(malaysiaDateKey(new Date("2026-12-31T16:00:00Z")), "2027-01-01");
});

test("earliest relevant date includes today regardless of hour; no exact completion is inferred", async () => {
  for (const now of [new Date("2026-10-03T00:00:00+08:00"),new Date("2026-10-03T23:59:59+08:00")]) {
    const state = await get(now);
    assert.equal(state.status, "ready"); assert.equal(state.day.date, "2026-10-03");
    assert.equal(state.today,true); assert.equal(state.day.sessions.length,2);
    assert.deepEqual(state.day.sessions.map(s=>s.label),["Kuliah Subuh","Kuliah Maghrib"]);
  }
});

test("empty dates are skipped; entries are selected in actual chronological order, not stored order", async () => {
  const b = bundle();
  b.document.entries = b.document.entries.filter(e=>e.date!=="2026-10-04").reverse();
  b.document.entries.push({ _key:"empty-four",_type:"lectureDay",date:"2026-10-04",isManualOverride:false,sessions:[] });
  const state = await get(on("2026-10-04"),[index()],async()=>b);
  assert.equal(state.day.date,"2026-10-05"); assert.equal(state.today,false);
});

test("exhausted current month checks the next published month and skips gaps without creating months", async () => {
  const visited = [];
  const state = await get(on("2026-10-31"),[index(12),index()],async key=>{
    visited.push(key); return key==="2026-10"?bundle():bundle(12);
  });
  assert.deepEqual(visited,["2026-10","2026-12"]);
  assert.equal(state.day.date,"2026-12-01");
});

test("next month can be selected even when current month is unpublished; new year is not hardcoded", async () => {
  const state = await get(on("2026-12-31"),[index(1,2027)],async()=>bundle(1,2027));
  assert.equal(state.day.date,"2027-01-01");
});

test("no future date returns a link-only state, never the latest past session", async () => {
  assert.deepEqual(await get(on("2026-10-31")), { status:"no-upcoming" });
  const state = await get(on("2026-11-01"),[index()],async()=>{throw Error("Past month must not be read");});
  assert.deepEqual(state,{status:"no-upcoming"});
  const html = render(state);
  assert.match(html,/Jadual kuliah terkini boleh dilihat di halaman Jadual Kuliah/);
  assert.doesNotMatch(html,/<time |UST |<h4/);
});

test("no published months is a separate healthy empty state", async () => {
  assert.deepEqual(await get(on("2026-10-04"),[],async()=>{throw Error("No month to read");}),{status:"empty"});
  const html = render({status:"empty"});
  assert.match(html,/Jadual kuliah belum diterbitkan/); assert.doesNotMatch(html,/<time |<h4/);
});

test("full special poster uses its public description and hides preserved underlying sessions", async () => {
  const b = bundle(), e = b.document.entries.find(e=>e.date==="2026-10-24");
  e.isManualOverride = true;
  e.specialPoster = {mode:"full",fit:"cover",position:"center",image:{...structuredClone(e.sessions[0].photo),alt:"Poster program khas yang diluluskan"}};
  b.posters = [{_id:e.specialPoster.image.asset._ref,_type:"sanity.imageAsset"}];
  const state = await get(on("2026-10-24"),[index()],async()=>b);
  assert.equal(state.day.sessions,undefined);
  assert.ok(e.sessions.length>0);
  const html = render(state);
  assert.match(html,/Program khas|Poster program khas yang diluluskan/);
  assert.doesNotMatch(html,/UST MUHD MU’IZZ|Tanbih al-Mughtarrin|<img/);
});

test("temporary failure at index or a candidate month is unavailable, never skips to a later schedule", async () => {
  for(const error of [{statusCode:503},{code:"ETIMEDOUT"}]) {
    assert.deepEqual(await select(async()=>{throw error;},async()=>bundle(),on("2026-10-04")),{status:"unavailable"});
    const visited=[];
    assert.deepEqual(await get(on("2026-10-04"),[index(),index(11)],async key=>{visited.push(key);throw error;}),{status:"unavailable"});
    assert.deepEqual(visited,["2026-10"]);
  }
  const html=render({status:"unavailable"});
  assert.match(html,/Maklumat kuliah tidak tersedia buat sementara waktu/);
  assert.doesNotMatch(html,/<time |<h4|belum diterbitkan/);
});

test("malformed/auth/query errors remain visible errors, including after an exhausted month", async () => {
  for (const error of [{statusCode:401},{statusCode:400},new PublicContentError("Malformed")]) {
    await assert.rejects(select(async()=>{throw error;},async()=>bundle(),on("2026-10-04")));
    await assert.rejects(get(on("2026-10-04"),[index()],async()=>{throw error;}));
  }
  const b=bundle(); b.document.entries[0].date="2026-11-01";
  await assert.rejects(get(on("2026-10-04"),[index()],async()=>b),PublicContentError);
  await assert.rejects(get(on("2026-10-31"),[index(),index(11)],async key=>key==="2026-10"?bundle():{...bundle(11),document:null}),PublicContentError);
});

test("published-only existing queries exclude draft/release months even under raw test perspective", async () => {
  const b=bundle(), draft={...structuredClone(b.document),_id:"drafts.lectureMonth-2026-11",month:11};
  const dataset=[b.document,draft,{...draft,_id:"versions.review.lectureMonth-2026-11"},...b.portraits];
  const query=async (groq,params={})=>(await evaluate(parse(groq),{dataset,params})).get();
  const visited=[];
  const state=await select(()=>query(lectureIndexQuery),key=>{visited.push(key);return query(lectureMonthQuery,{id:"lectureMonth-"+key});},on("2026-10-31"));
  assert.deepEqual(state,{status:"no-upcoming"}); assert.deepEqual(visited,["2026-10"]);
  await assert.rejects(get(on("2026-11-01"),[draft],async()=>bundle(11)),PublicContentError);
});

test("one date with two sessions is semantic HTML, exact Unicode and a single full-schedule CTA", async () => {
  const html=render(await get(on("2026-10-03")));
  assert.equal((html.match(/<time /g)||[]).length,1);
  assert.equal((html.match(/<h4/g)||[]).length,2);
  assert.match(html,/dateTime="2026-10-03"/);
  assert.match(html,/>Hari ini</);
  assert.match(html,/Kuliah terdekat/);
  assert.match(html,/Pengajian terdekat berdasarkan jadual yang diterbitkan oleh pihak masjid\./);
  assert.doesNotMatch(html,/Kuliah seterusnya|Disenaraikan untuk hari ini/);
  assert.match(html,/AL-QUR’AN/);
  assert.equal((html.match(/href="\/kuliah"/g)||[]).length,1);
  assert.match(html,/Lihat jadual penuh/);
  assert.doesNotMatch(html,/No Penceramah|Selepas Maghrib|9:00 pagi|data-lecture-poster|<svg|demo|pratonton/);
});

test("group recitation omits Penceramah rather than inventing one", async () => {
  const html=render(await get(on("2026-10-01")));
  assert.match(html,/Bacaan Yasin &amp; Tahlil/);
  assert.doesNotMatch(html,/No Penceramah|Penceramah jemputan|UST/);
});

test("homepage removes mock schedule and shares the established token-free cached read boundary", async () => {
  const page=await fs.readFile(path.join(ROOT,"src/app/page.tsx"),"utf8");
  assert.match(page,/getUpcomingLecture\(\)/);
  assert.doesNotMatch(page,/lectureSchedule|Contoh jadual|Jadual dan nama penceramah ialah contoh/);
  const server=await fs.readFile(path.join(ROOT,"src/lib/public-content/lectures/server.ts"),"utf8");
  assert.match(server,/import "server-only"/); assert.match(server,/token:\s*undefined/);
  assert.match(server,/perspective:\s*"published"/); assert.match(server,/revalidate:\s*300/);
  assert.match(server,/loadUpcomingLecture\(readIndex, readMonth\)/);
  const component=await fs.readFile(path.join(ROOT,"src/components/public/homepage-lectures.tsx"),"utf8");
  assert.doesNotMatch(component,/use client|sanity\/client|LecturePoster|export-poster/);
});
