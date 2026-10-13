import { test, expect, type Page } from "@playwright/test";
import { mkdirSync, readFileSync, readdirSync } from "node:fs";
const screenshots = ".cache/qurban-review";
mkdirSync(screenshots, { recursive: true });
const route = "/__review/qurban";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as typeof window & { storageWrites: string[] };
    w.storageWrites = [];
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) { w.storageWrites.push(key); return original.call(this, key, value); };
  });
});

async function privacyProbe(page: Page) {
  const forbidden: string[] = [];
  page.on("request", request => {
    if (!["GET", "HEAD", "OPTIONS"].includes(request.method())) forbidden.push(`${request.method()} ${request.url()}`);
    if (!request.url().startsWith("http://127.0.0.1:3080") && !request.url().startsWith("data:")) forbidden.push(`external ${request.url()}`);
  });
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  return async () => {
    expect(forbidden).toEqual([]);
    expect(errors).toEqual([]);
    expect(await page.evaluate(() => (window as typeof window & { storageWrites: string[] }).storageWrites)).toEqual([]);
    expect(await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length }))).toEqual({ local: 0, session: 0 });
    expect(await page.context().cookies()).toEqual([]);
    expect(await page.evaluate(async () => (await indexedDB.databases()).length)).toBe(0);
  };
}
async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}
async function startParticipant(page: Page) {
  await page.goto(route);
  await page.getByRole("button", { name: "Daftar Qurban / Aqiqah", exact: true }).click();
  await page.getByLabel("Nama penuh", { exact: true }).fill("Pemohon Contoh Safwan");
  await page.getByLabel("No. telefon", { exact: true }).fill("+60 12-345 6789");
  await page.getByLabel("Alamat", { exact: true }).fill("Alamat rekaan untuk ujian sahaja");
  await page.getByRole("button", { name: "Seterusnya: peserta" }).click();
}
async function fillParticipants(page: Page, count: number) {
  for (let i = 1; i <= count; i++) {
    if (i > 1) await page.getByRole("button", { name: "+ Tambah peserta", exact: true }).click();
    const card = page.getByRole("group", { name: `Peserta ${i}`, exact: true });
    await card.getByLabel("Nama peserta", { exact: true }).fill(`Peserta Rekaan ${i}`);
    if (i === 3) await card.getByRole("radio", { name: "Aqiqah", exact: true }).check();
  }
}

for (const width of [375, 430, 768, 1440]) {
  test(`${width}px: complete three-share mixed flow, privacy, reload and reset`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const checkPrivacy = await privacyProbe(page);
    await page.goto(route);
    await expect(page.getByRole("button", { name: "Daftar Sukarelawan", exact: true })).toBeVisible();
    await noOverflow(page);
    if (width === 375 || width === 1440) await page.screenshot({ path: `${screenshots}/landing-${width}.png`, fullPage: true });
    await startParticipant(page);
    await fillParticipants(page, 3);
    await expect(page.getByRole("heading", { name: "3 bahagian", exact: true })).toBeVisible();
    await expect(page.getByText("RM880 × 3", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Semak pendaftaran", exact: true })).toBeDisabled();
    await page.getByRole("checkbox", { name: "Jika boleh, letakkan peserta" }).check();
    await page.getByRole("radio", { name: "Ya", exact: true }).check();
    await page.getByRole("checkbox", { name: "Saya telah membaca" }).check();
    await noOverflow(page);
    if (width === 375 || width === 1440) await page.screenshot({ path: `${screenshots}/participants-${width}.png`, fullPage: true });
    await page.getByRole("button", { name: "Semak pendaftaran", exact: true }).click();
    await expect(page.getByText("Pemohon Contoh Safwan", { exact: true })).toBeVisible();
    await expect(page.getByText("Peserta Rekaan 3 — Aqiqah", { exact: true })).toBeVisible();
    await expect(page.getByText("Peserta Rekaan 1 — Qurban", { exact: true })).toBeVisible();
    await expect(page.locator(".qbn-details").getByText("RM2,640", { exact: true })).toBeVisible();
    await expect(page.locator(".qbn-details").getByText("Ya", { exact: true })).toBeVisible();
    await noOverflow(page);
    if (width === 430) await page.screenshot({ path: `${screenshots}/review-${width}.png`, fullPage: true });
    await page.getByRole("button", { name: "Ubah maklumat", exact: true }).click();
    await expect(page.getByRole("group", { name: "Peserta 3", exact: true }).getByLabel("Nama peserta")).toHaveValue("Peserta Rekaan 3");
    await page.getByRole("button", { name: "Semak pendaftaran", exact: true }).click();
    await page.getByRole("button", { name: "Hantar pendaftaran dummy", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Pendaftaran dummy berjaya", exact: true })).toBeVisible();
    await expect(page.locator(".qbn-reference")).toHaveText(/^QBN-DEMO-[0-9A-F]{8}$/);
    await expect(page.getByRole("heading", { name: "Bayaran melalui Bank Islam", exact: true })).toBeVisible();
    await expect(page.getByText("1227 0010 0045 60", { exact: true })).toBeVisible();
    await expect(page.getByText("MASJID TALHAH BIN UBAIDILLAH", { exact: true })).toBeVisible();
    await expect(page.locator(".qbn-bank")).toContainText("RM2,640");
    await expect(page.locator(".qbn-success").getByRole("combobox")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /gateway|bayar sekarang|checkout/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Hantar bukti pembayaran dummy", exact: true })).toBeDisabled();
    const mime = width === 375 ? "image/jpeg" : width === 430 ? "image/png" : "application/pdf";
    const filename = mime === "image/jpeg" ? "slip-rekaan.jpg" : mime === "image/png" ? "slip-rekaan.png" : "slip-rekaan.pdf";
    await page.getByLabel("Muat naik bukti pembayaran", { exact: true }).setInputFiles({ name: filename, mimeType: mime, buffer: Buffer.from("SYNTHETIC DEMO ONLY") });
    await expect(page.locator(".qbn-file")).toContainText(filename);
    await expect(page.locator(".qbn-file")).toContainText(mime);
    await expect(page.getByText("DEMO SAHAJA — fail tidak dimuat naik atau disimpan.", { exact: true })).toBeVisible();
    await noOverflow(page);
    await page.getByRole("button", { name: "Hantar bukti pembayaran dummy", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("Bukti pembayaran diterima untuk semakan");
    await expect(page.locator(".qbn-success > p").filter({ hasText: "Status:" })).toContainText("Menunggu pengesahan admin");
    await noOverflow(page);
    if (width === 375 || width === 1440) await page.screenshot({ path: screenshots + "/payment-proof-" + width + ".png", fullPage: true });
    await checkPrivacy();
    await page.reload();
    await expect(page.locator(".qbn-proof, .qbn-reference")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Daftar Qurban / Aqiqah", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Daftar Qurban / Aqiqah", exact: true }).click();
    await expect(page.getByLabel("Nama penuh", { exact: true })).toHaveValue("");
    await checkPrivacy();
  });
}

for (const [count, attendance] of [[1, "Tidak"], [7, "Belum pasti"]] as const) {
  test(`${count} participant(s), attendance ${attendance}, submit and reset`, async ({ page }) => {
    const checkPrivacy = await privacyProbe(page);
    await page.setViewportSize({ width: 375, height: 850 });
    await startParticipant(page);
    await fillParticipants(page, count);
    await page.getByRole("radio", { name: attendance, exact: true }).check();
    await page.getByRole("checkbox", { name: "Saya telah membaca" }).check();
    await noOverflow(page);
    await page.getByRole("button", { name: "Semak pendaftaran", exact: true }).click();
    await expect(page.locator(".qbn-details").getByText(count === 1 ? "RM880" : "RM6,160", { exact: true })).toBeVisible();
    await expect(page.locator(".qbn-details").getByText(attendance, { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Hantar pendaftaran dummy", exact: true }).click();
    await page.getByRole("button", { name: "Isi borang baru", exact: true }).click();
    await page.getByRole("button", { name: "Daftar Qurban / Aqiqah", exact: true }).click();
    await expect(page.getByLabel("Nama penuh", { exact: true })).toHaveValue("");
    await checkPrivacy();
  });
}

test("visible validation, missing attendance/name, stable add/remove/re-add and keyboard", async ({ page }) => {
  await page.goto(route);
  await expect(page.locator(".qbn-intro h2")).toBeFocused();
  await page.getByRole("button", { name: "Daftar Qurban / Aqiqah", exact: true }).focus();
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "Seterusnya: peserta" }).click();
  await expect(page.getByRole("alert", { name: "Ralat borang" })).toContainText("Nama penuh pemohon diperlukan");
  await expect(page.getByRole("alert", { name: "Ralat borang" })).toContainText("telefon yang sah");
  await expect(page.getByRole("alert", { name: "Ralat borang" })).toBeFocused();
  await page.getByLabel("Nama penuh", { exact: true }).fill("Pemohon Rekaan");
  await page.getByLabel("No. telefon", { exact: true }).fill("123");
  await page.getByLabel("Alamat", { exact: true }).fill("Alamat rekaan");
  await page.getByLabel("Email (pilihan)", { exact: true }).fill("bukan-email");
  await page.getByRole("button", { name: "Seterusnya: peserta" }).click();
  await expect(page.getByRole("alert", { name: "Ralat borang" })).toContainText("email yang sah");
  // Validation moves focus on the next frame; let it finish before editing again.
  await expect(page.getByRole("alert", { name: "Ralat borang" })).toBeFocused();
  await page.getByLabel("No. telefon", { exact: true }).fill("0123456789");
  await page.getByLabel("Email (pilihan)", { exact: true }).fill("");
  await expect(page.getByLabel("Email (pilihan)", { exact: true })).toHaveValue("");
  await page.getByRole("button", { name: "Seterusnya: peserta" }).click();
  await expect(page.getByRole("button", { name: "Hapus peserta 1", exact: true })).toBeDisabled();
  await page.getByRole("checkbox", { name: "Saya telah membaca" }).check();
  await page.getByRole("button", { name: "Semak pendaftaran", exact: true }).click();
  await expect(page.getByRole("alert", { name: "Ralat borang" })).toContainText("Nama peserta 1 diperlukan");
  await expect(page.getByRole("alert", { name: "Ralat borang" })).toContainText("Pilih rancangan kehadiran");
  await fillParticipants(page, 3);
  await page.getByRole("button", { name: "Hapus peserta 2", exact: true }).click();
  await expect(page.getByRole("group", { name: "Peserta 2", exact: true }).getByLabel("Nama peserta")).toHaveValue("Peserta Rekaan 3");
  await page.getByRole("button", { name: "+ Tambah peserta", exact: true }).click();
  await expect(page.getByRole("group", { name: "Peserta 3", exact: true }).getByLabel("Nama peserta")).toHaveValue("");
  await expect(page.getByRole("group", { name: "Peserta 3", exact: true }).getByLabel("Nama peserta")).toBeFocused();
  await page.getByRole("group", { name: "Peserta 3", exact: true }).getByLabel("Nama peserta").fill("<img src=x onerror=alert(1)>");
  await page.getByRole("radio", { name: "Tidak", exact: true }).check();
  await page.getByRole("button", { name: "Semak pendaftaran", exact: true }).click();
  await expect(page.locator(".qbn-review-list")).toContainText("<img src=x onerror=alert(1)>");
  expect(await page.locator(".qbn-review-list img").count()).toBe(0);
  await page.getByRole("button", { name: "Ubah maklumat", exact: true }).click();
  await page.getByRole("checkbox", { name: "Saya telah membaca" }).uncheck();
  await expect(page.getByRole("button", { name: "Semak pendaftaran", exact: true })).toBeDisabled();
});

for (const [width, participant] of [[375, true], [430, true], [768, false], [1440, false]] as const) {
  test(width + "px simplified volunteer, informational name, group reminder, reset and refresh", async ({ page }) => {
    const checkPrivacy = await privacyProbe(page);
    await page.setViewportSize({ width, height: 900 });
    await page.goto(route);
    await page.getByRole("button", { name: "Daftar Sukarelawan", exact: true }).click();
    await expect(page.getByRole("checkbox")).toHaveCount(0);
    await expect(page.getByLabel(/Tugasan diminati|Ketersediaan|masa|Pilihan kumpulan/)).toHaveCount(0);
    await expect(page.locator("textarea, input[type=time], input[type=datetime-local]")).toHaveCount(0);
    await expect(page.getByLabel("Nama peserta Qurban/Aqiqah", { exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: "Semak pendaftaran sukarelawan", exact: true }).click();
    await expect(page.getByRole("alert", { name: "Ralat borang" })).toContainText("Nama penuh sukarelawan diperlukan");
    await expect(page.getByRole("alert", { name: "Ralat borang" })).toContainText("telefon yang sah");
    await expect(page.getByRole("alert", { name: "Ralat borang" })).toContainText("saiz baju");
    await page.getByLabel("Nama penuh", { exact: true }).fill("Sukarelawan Rekaan");
    await page.getByLabel("No. telefon", { exact: true }).fill("012-3456789");
    await page.getByLabel("Saiz baju", { exact: true }).selectOption("XL");
    // After the page assets settle, selecting Ya and typing must make zero requests, including local lookup GETs.
    await page.waitForLoadState("networkidle");
    const lookupRequests: string[] = [];
    const observe = (request: import("@playwright/test").Request) => lookupRequests.push(request.url());
    page.on("request", observe);
    await page.getByRole("radio", { name: "Ya", exact: true }).check();
    await expect(page.getByLabel("Nama peserta Qurban/Aqiqah", { exact: true })).toBeVisible();
    await expect(page.locator("form input:not([type=radio]), form select")).toHaveCount(5);
    await page.getByRole("button", { name: "Semak pendaftaran sukarelawan", exact: true }).click();
    await expect(page.getByRole("alert", { name: "Ralat borang" })).toContainText("Nyatakan nama peserta");
    await page.getByLabel("Nama peserta Qurban/Aqiqah", { exact: true }).fill("Peserta Diberi Rekaan");
    await page.waitForTimeout(200);
    expect(lookupRequests).toEqual([]);
    page.off("request", observe);
    if (!participant) {
      await page.getByRole("radio", { name: "Tidak", exact: true }).check();
      await expect(page.getByLabel("Nama peserta Qurban/Aqiqah", { exact: true })).toHaveCount(0);
      await page.getByRole("radio", { name: "Ya", exact: true }).check();
      await expect(page.getByLabel("Nama peserta Qurban/Aqiqah", { exact: true })).toHaveValue("");
      await page.getByRole("radio", { name: "Tidak", exact: true }).check();
    }
    await noOverflow(page);
    await page.screenshot({ path: screenshots + "/volunteer-revised-" + width + ".png", fullPage: true });
    await page.getByRole("button", { name: "Semak pendaftaran sukarelawan", exact: true }).click();
    await expect(page.locator(".qbn-details")).toContainText("XL");
    if (participant) await expect(page.locator(".qbn-details")).toContainText("Peserta Diberi Rekaan");
    await noOverflow(page);
    await page.getByRole("button", { name: "Hantar pendaftaran sukarelawan dummy", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Pendaftaran sukarelawan dummy berjaya", exact: true })).toBeVisible();
    await expect(page.locator(".qbn-reference")).toHaveText(/^VOL-DEMO-[0-9A-F]{8}$/);
    await expect(page.getByText("Pautan group WhatsApp belum dibuka oleh urus setia.", { exact: true })).toBeVisible();
    await expect(page.getByText("Pihak masjid akan menyediakan group apabila hampir dengan tarikh program.", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Sertai Group WhatsApp Sukarelawan" })).toHaveCount(0);
    await noOverflow(page);
    await page.screenshot({ path: screenshots + "/volunteer-success-" + width + ".png", fullPage: true });
    await checkPrivacy();
    await page.getByRole("button", { name: "Isi borang baru", exact: true }).click();
    await page.getByRole("button", { name: "Daftar Sukarelawan", exact: true }).click();
    await expect(page.getByLabel("Nama penuh", { exact: true })).toHaveValue("");
    await page.getByLabel("Nama penuh", { exact: true }).fill("Sementara Rekaan");
    await page.reload();
    await page.getByRole("button", { name: "Daftar Sukarelawan", exact: true }).click();
    await expect(page.getByLabel("Nama penuh", { exact: true })).toHaveValue("");
    await checkPrivacy();
  });
}

test("proof types, replacement, unsafe filename as text and unsupported file rejection", async ({ page }) => {
  const checkPrivacy = await privacyProbe(page);
  await startParticipant(page);
  await fillParticipants(page, 1);
  await page.getByRole("radio", { name: "Ya", exact: true }).check();
  await page.getByRole("checkbox", { name: "Saya telah membaca" }).check();
  await page.getByRole("button", { name: "Semak pendaftaran", exact: true }).click();
  await page.getByRole("button", { name: "Hantar pendaftaran dummy", exact: true }).click();
  await expect(page.locator(".qbn-success > p").filter({ hasText: "Status:" })).toContainText("Menunggu bayaran");
  const input = page.getByLabel("Muat naik bukti pembayaran", { exact: true });
  await expect(input).toHaveAttribute("accept", "image/jpeg,image/png,application/pdf");
  for (const mime of ["image/jpeg", "image/png", "application/pdf"]) {
    await input.setInputFiles({ name: "<img onerror=alert(1)>.slip", mimeType: mime, buffer: Buffer.from("DUMMY NOT A REAL PROOF") });
    await expect(page.locator(".qbn-file")).toContainText("<img onerror=alert(1)>.slip");
    await expect(page.locator(".qbn-file img")).toHaveCount(0);
    await expect(page.locator(".qbn-file")).toContainText(mime);
    await page.getByRole("button", { name: "Hantar bukti pembayaran dummy", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("Bukti pembayaran diterima untuk semakan");
    await checkPrivacy();
  }
  await input.setInputFiles({ name: "unsupported.txt", mimeType: "text/plain", buffer: Buffer.from("DUMMY") });
  await expect(page.getByText("Format tidak disokong. Pilih JPEG, PNG atau PDF.", { exact: true })).toBeVisible();
  await expect(page.locator(".qbn-file")).toHaveCount(0);
  await expect(page.getByRole("status")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Hantar bukti pembayaran dummy", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Isi borang baru", exact: true }).click();
  await expect(page.locator(".qbn-proof")).toHaveCount(0);
  await checkPrivacy();
});

test("temporary source has no persistence or integration imports; engine registry untouched", async () => {
  const source = readFileSync("src/app/%5F%5Freview/qurban/prototype.tsx", "utf8");
  expect(source).not.toMatch(/localStorage|sessionStorage|indexedDB|FileReader|createObjectURL|arrayBuffer|fetch\s*\(|XMLHttpRequest|sendBeacon|supabase|sanity|use server|console\./i);
  expect(source).not.toMatch(/from\s+["'][^"']*(?:campaigns|supabase|sanity)/i);
  const routeSource = readFileSync("src/app/%5F%5Freview/qurban/page.tsx", "utf8");
  expect(routeSource).toContain('process.env.NODE_ENV !== "development"');
  expect(routeSource).toContain('process.env.QURBAN_PROTOTYPE !== "1"');
  expect(readFileSync("src/lib/campaigns/admin-registry.ts", "utf8")).toContain("Object.freeze([])");
  expect(readdirSync("src/app/%5F%5Freview/qurban").sort()).toEqual(["page.tsx", "prototype.css", "prototype.tsx"]);
});
