import assert from "node:assert/strict";
import crypto from "node:crypto";
const base = process.argv[2] || "http://127.0.0.1:3037";
const routes = ["/", "/profil", "/profil/organisasi", "/profil/surau-kariah", "/galeri", "/hubungi", "/studio/penjana-jadual-kuliah", "/kuliah", "/kuliah/2026-10"];
const results = await Promise.all(routes.map(async route => {
  const response = await fetch(base+route);
  assert.equal(response.status,200,route);
  return {route,status:response.status,html:await response.text()};
}));
const page = results.find(r=>r.route==="/kuliah").html;
const home = results.find(r=>r.route==="/").html;
const upcoming = home.match(/<section id="lectures"[\s\S]*?<\/section>/)?.[0];
assert.ok(upcoming, "Homepage upcoming Kuliah section");
assert.match(upcoming, /Kuliah terdekat/);
assert.match(upcoming, /Pengajian terdekat berdasarkan jadual yang diterbitkan oleh pihak masjid\./);
assert.doesNotMatch(upcoming, /Kuliah seterusnya|Disenaraikan untuk hari ini/);
assert.match(upcoming, /href="\/kuliah"/);
assert.match(upcoming, /Lihat jadual penuh/);
assert.doesNotMatch(upcoming, /lecture-row|data-lecture-poster|No Penceramah|Penceramah jemputan|Tadabbur Surah|contoh untuk pratonton/);
assert.ok((upcoming.match(/<time /g)||[]).length<=1, "One upcoming date only");
assert.match(page,/Jadual Kuliah rasmi Oktober 2026/);
assert.match(page,/AL-QUR’AN|AL-QUR&#x27;AN/);
assert.equal((page.match(/<time /g)||[]).length,30);
assert.equal((page.match(/<h4/g)||[]).length,34);
assert.doesNotMatch(page,/No Penceramah|drafts\.lectureMonth|Penceramah Contoh/);
const month = results.find(r=>r.route==="/kuliah/2026-10").html;
assert.match(month,/<title>Jadual Kuliah Oktober 2026/);
for(const route of ["/kuliah/2026-11","/kuliah/drafts.2026-10","/kuliah/2026-13","/kuliah/2026-10/imej/image-6ba112c3ffc0107ea20e277aa11ff0729eba926b-853x853-png"]) {
  assert.equal((await fetch(base+route)).status,404,route);
}
const image=await fetch(base+"/kuliah/2026-10/imej/image-46cfd9cd56c2bdf6ad48cf6bdba8e83cc6f41ba8-853x853-png");
assert.equal(image.status,200); assert.equal(image.headers.get("content-type"),"image/png");
const bytes=Buffer.from(await image.arrayBuffer());
const sha1=crypto.createHash("sha1").update(bytes).digest("hex");
assert.equal(bytes.readUInt32BE(16),853); assert.equal(bytes.readUInt32BE(20),853);
const scripts=[...new Set([...page.matchAll(/<script[^>]+src="([^"]+)"/g)].map(m=>m[1]))];
const browserCode=(await Promise.all(scripts.map(async src=> (await fetch(new URL(src,base))).text()))).join("\n");
assert.doesNotMatch(browserCode,/sanity\.action\.document\.publish|usePublicationWorkflow|useDraftWorkflow|Penceramah Contoh|Publish Jadual|Save Draft/);
console.log(JSON.stringify({mode:"READ-ONLY-PUBLIC-HTTP-SMOKE",routes:results.map(({route,status})=>({route,status})),unpublishedAndUnreferencedImages:"404",dates:30,sessions:34,compactImageDimensions:[853,853],compactCdnResponseSha1:sha1,publicChunks:scripts.length,studioMutationBundle:"absent",writes:0},null,2));
