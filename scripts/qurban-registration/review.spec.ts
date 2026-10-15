import { test, expect, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
// Migration-owner inspection of the fixed disposable local container only. No runtime credential.
const slug = "local-qurban-review";
const quote = (v: string) => "'" + v.replaceAll("'", "''") + "'";
const sql = (query: string) => execFileSync("docker", ["exec", "-i", "supabase_db_mtu-admin-local", "psql", "-U", "postgres", "-d", "postgres", "-Atq", "-v", "ON_ERROR_STOP=1"], { input: query, encoding: "utf8" }).trim();
const rows = (query: string) => JSON.parse(sql("select coalesce(jsonb_agg(t),'[]'::jsonb) from (" + query + ") t"));
const origin = "http://localhost:3082", path = `/kempen/${slug}/daftar`;
const output = ".cache/qurban-82";
mkdirSync(output, { recursive: true });
const count = () => Number(sql("select count(*) from private.qurban_registrations"));
async function applicant(page: Page) {
  await page.getByLabel("Nama penuh", { exact: true }).fill("Pemohon Pelayar Ujian");
  await page.getByLabel("No. telefon", { exact: true }).fill("0123456789");
  await page.getByLabel("Alamat", { exact: true }).fill("Alamat Ujian\nBandar Rekaan");
  await page.getByRole("button", { name: "Seterusnya", exact: true }).click();
}
async function participants(page: Page, n = 3, attendance = "Ya", escape = false) {
  for (let i = 1; i < n; i++) await page.getByRole("button", { name: "+ Tambah peserta", exact: true }).click();
  const inputs = page.getByLabel("Nama peserta", { exact: true });
  for (let i = 0; i < n; i++) await inputs.nth(i).fill(i === 0 && escape ? '<img src=x onerror="window.fixtureInjected=true">' : `Peserta Pelayar ${i + 1}`);
  if (n === 12) await expect(page.getByRole("button", { name: "+ Tambah peserta", exact: true })).toBeDisabled();
  if (n >= 3) await page.locator(".qr-participant").nth(2).getByLabel("Aqiqah", { exact: true }).check();
  await page.getByLabel(attendance, { exact: true }).check();
  await page.getByLabel("Jika boleh, letakkan peserta dalam pendaftaran ini pada lembu yang sama.", { exact: true }).check();
  await page.getByRole("button", { name: "Seterusnya", exact: true }).click();
  await expect(page.locator(".qr-akad")).toContainText("AKAD REKAAN UNTUK UJIAN TEMPATAN SAHAJA");
  await expect(page.getByRole("button", { name: "Semak pendaftaran", exact: true })).toBeDisabled();
  await page.getByLabel("Saya telah membaca dan bersetuju dengan akad/wakalah di atas.", { exact: true }).check();
  await page.getByRole("button", { name: "Semak pendaftaran", exact: true }).click();
}
async function privacy(page: Page) {
  expect(await page.evaluate(async () => ({ local: localStorage.length, session: sessionStorage.length, databases: (await indexedDB.databases()).map(d => d.name) }))).toEqual({ local: 0, session: 0, databases: [] });
}
for (const width of [375, 430, 768, 1440]) test(`${width}px real mixed registration, privacy, idempotency and reload`, async ({ page, request }) => {
  await page.setViewportSize({ width, height: 900 });
  const external: string[] = [], mutations: string[] = [];
  await page.route("**/*", route => {
    const url = new URL(route.request().url());
    if (!["127.0.0.1", "localhost"].includes(url.hostname)) { external.push(url.origin); return route.abort(); }
    return route.continue();
  });
  let submitted: string | null = null;
  page.on("request", req => { if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method())) { mutations.push(req.url()); if (req.url().endsWith("/hantar")) submitted = req.postData(); } });
  await page.goto(`/kempen/${slug}`);
  await page.getByRole("link", { name: "Daftar Qurban / Aqiqah", exact: true }).click();
  await expect(page).toHaveURL(origin + path);
  await page.getByRole("button", { name: "Seterusnya", exact: true }).click();
  await expect(page.locator(".qr-errors[role=alert]")).toBeFocused();
  await applicant(page);
  await page.getByRole("button", { name: "+ Tambah peserta", exact: true }).click();
  await expect(page.getByLabel("Nama peserta", { exact: true }).nth(1)).toBeFocused();
  await page.getByRole("button", { name: "Hapus peserta 2", exact: true }).click();
  await expect(page.getByLabel("Nama peserta", { exact: true }).nth(0)).toBeFocused();
  await participants(page);
  await expect(page.locator(".qr-card")).toContainText("RM370.35");
  expect(await page.evaluate(() => Object.hasOwn(window, "fixtureInjected"))).toBe(false);
  expect(await page.locator(".qr-card img").count()).toBe(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  if (width === 375 || width === 1440) await page.screenshot({ path: `${output}/registration-review-${width}.png`, fullPage: true });
  const before = count();
  await page.getByRole("button", { name: "Hantar pendaftaran", exact: true }).evaluate((button: HTMLButtonElement) => { button.click(); button.click(); });
  await expect(page.getByRole("heading", { name: "Pendaftaran berjaya", exact: true })).toBeVisible();
  await expect(page.locator(".qr-reference")).toHaveText(/^QBN-[0-9a-f]{64}$/);
  await expect(page.locator(".qr-success")).toContainText("Pendaftaran ini belum mengesahkan bayaran dan belum menempah bahagian.");
  await expect(page.locator(".qr-success")).toContainText("RM370.35");
  expect(count()).toBe(before + 1); expect(mutations).toHaveLength(1); expect(submitted).not.toBeNull();
  const ref = await page.locator(".qr-reference").innerText();
  const evidence = rows(`select r.quoted_total_minor,r.attendance,r.same_cattle_preference,(select count(*) from private.qurban_participations p where p.registration_id=r.id) children,(select count(*) from private.qurban_consent_acceptances c where c.registration_id=r.id) consents,(select count(*) from private.qurban_submission_audit a where a.registration_id=r.id) audit from private.qurban_registrations r where public_reference=${quote(ref)}`)[0];
  expect(evidence).toEqual({ quoted_total_minor: 37035, attendance: "yes", same_cattle_preference: true, children: 3, consents: 1, audit: 1 });
  const retry = await request.post(path + "/hantar", { headers: { Origin: origin, "Content-Type": "application/json" }, data: submitted! });
  expect(retry.status()).toBe(201); expect((await retry.json()).reference).toBe(ref); expect(count()).toBe(before + 1);
  await privacy(page); expect(external).toEqual([]);
  expect(await page.locator('input[type="file"]').count()).toBe(0);
  if (width === 375 || width === 1440) await page.screenshot({ path: `${output}/registration-success-${width}.png`, fullPage: true });
  await page.reload(); await expect(page.getByLabel("Nama penuh", { exact: true })).toHaveValue(""); await expect(page.locator(".qr-reference")).toHaveCount(0); await privacy(page);
});
for (const [n, attendance] of [[1, "Tidak"], [7, "Belum pasti"], [12, "Ya"]] as const) test(`${n} participants / attendance ${attendance}`, async ({ page }) => {
  await page.goto(path); await applicant(page); await participants(page, n, attendance);
  await page.getByRole("button", { name: "Hantar pendaftaran", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Pendaftaran berjaya", exact: true })).toBeVisible();
  await expect(page.locator(".qr-success")).toContainText(`Jumlah bahagian: ${n}`);
});
test("stale context asks to reload and creates no registration", async ({ page }) => {
  await page.goto(path); await applicant(page); await participants(page);
  const before = count();
  // Local migration-owner fixture change; no production authorization bypass is installed.
  sql("begin;alter table private.campaigns disable trigger campaign_row_guard;update private.campaigns set version=version+1 where slug=" + quote(slug) + ";alter table private.campaigns enable trigger campaign_row_guard;commit;");
  await page.getByRole("button", { name: "Hantar pendaftaran", exact: true }).click();
  await expect(page.locator(".qr-errors[role=alert]")).toContainText("Maklumat atau ketersediaan kempen telah berubah");
  await expect(page.getByRole("link", { name: "Muat semula maklumat kempen", exact: true })).toBeVisible();
  expect(count()).toBe(before);
});
test("technical request limits and exact HTTP boundary", async ({ request }) => {
  for (const [headers, data, status] of [
    [{ Origin: "https://outside.invalid", "Content-Type": "application/json" }, "{}", 403],
    [{ Origin: origin, "Content-Type": "text/plain" }, "{}", 422],
    [{ Origin: origin, "Content-Type": "application/json; charset=utf-8" }, "{}", 422],
    [{ Origin: origin, "Content-Type": "application/json" }, "x".repeat(65537), 413],
    [{ Origin: origin, "Content-Type": "application/json" }, "{}", 422],
  ] as const) {
    const r = await request.post(path + "/hantar", { headers, data }); expect(r.status()).toBe(status); expect(r.headers()["cache-control"]).toContain("no-store");
  }
  // Next development forces no-cache on page documents; production probe requires no-store.
  const r = await request.get(path); expect(r.headers()["cache-control"]).toMatch(/no-store|no-cache/);
  expect((await request.get("/__review/qurban")).status()).toBe(404);
});

test("HTML-shaped input remains escaped review text", async ({page}) => {
 await page.goto(path);await applicant(page);await participants(page,3,"Ya",true);
 await expect(page.locator(".qr-card")).toContainText('<img src=x onerror="window.fixtureInjected=true">');
 expect(await page.locator(".qr-card img").count()).toBe(0);expect(await page.evaluate(()=>Object.hasOwn(window,"fixtureInjected"))).toBe(false);
});
test("ambiguous network response retries the frozen request without duplication", async ({page}) => {
 await page.goto(path);await applicant(page);await participants(page);const before=count();let first=true;const bodies:string[]=[];
 await page.route("**/daftar/hantar",async route=>{bodies.push(route.request().postData()!);if(first){first=false;const r=await route.fetch();expect(r.status()).toBe(201);await route.abort();}else await route.continue();});
 await page.getByRole("button",{name:"Hantar pendaftaran",exact:true}).click();await expect(page.locator(".qr-errors[role=alert]")).toContainText("Sambungan tidak dapat disahkan");expect(count()).toBe(before+1);
 await page.getByRole("button",{name:"Hantar pendaftaran",exact:true}).click();await expect(page.getByRole("heading",{name:"Pendaftaran berjaya",exact:true})).toBeVisible();expect(count()).toBe(before+1);expect(bodies).toHaveLength(2);expect(bodies[0]).toBe(bodies[1]);
});
