// U-PERF (D-046): a person's journey on staging, timed. Synthetic staff only (D-046(c)).
// Sign-in to a usable first screen; menu clicks; representative saves (a role grant and its revoke,
// so each run leaves the data as it found it). Each step prints one JSON line with its window, so the
// coordinator can count Supabase requests per step from the log, and the Vercel function
// responses seen in the browser during the step (x-vercel-id ::sin1::).
import { chromium } from "playwright";

const APP = process.env.STAGING_ORIGIN;
const SB = process.env.SUPABASE_URL;
const SERVICE = process.env.SERVICE_KEY;
const REPS = Number(process.env.REPS || 2);
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const GURU_EMAIL = process.env.GURU_EMAIL;
const SLOW = 60000;

const out = [];
function line(o) { out.push(o); console.log(JSON.stringify(o)); }

async function link(email) {
  const r = await fetch(`${SB}/auth/v1/admin/generate_link`, {
    method: "POST",
    headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, "Content-Type": "application/json" },
    body: JSON.stringify({ type: "magiclink", email, redirect_to: `${APP}/auth/callback` }),
  });
  const j = await r.json();
  const url = j.action_link || j.properties?.action_link;
  if (!url) throw new Error(`no sign-in link (HTTP ${r.status})`);
  return url;
}

function watch(page) {
  const seen = [];
  page.on("response", (res) => {
    const id = res.headers()["x-vercel-id"];
    if (id && res.url().startsWith(APP)) seen.push({ id, url: new URL(res.url()).pathname, status: res.status() });
  });
  return seen;
}

async function step(page, seen, role, rep, name, act) {
  const before = seen.length;
  const t0 = Date.now();
  const start = new Date(t0).toISOString();
  let ok = true, note = "";
  try { note = (await act()) || ""; } catch (e) { ok = false; note = String(e.message || e).slice(0, 200); }
  const t1 = Date.now();
  const fn = seen.slice(before).filter((s) => s.id.includes("::"));
  line({ role, rep, step: name, ok, ms: t1 - t0, start, end: new Date(t1).toISOString(),
         vercel_function_responses: fn.length, regions: [...new Set(fn.map((s) => s.id.split("::")[1]))], note });
}

async function usable(page, path) {
  await page.waitForURL((u) => u.pathname === path, { timeout: SLOW });
  await page.locator("h1").first().waitFor({ state: "visible", timeout: SLOW });
}

async function clickTo(page, href, path = href.split("?")[0]) {
  const a = page.locator(`a[href="${href}"]`).first();
  await a.waitFor({ state: "visible", timeout: SLOW });
  await a.click();
  await usable(page, path);
}

async function signIn(page, email, landing) {
  await page.goto(await link(email), { timeout: SLOW });
  await page.waitForURL((u) => !u.pathname.startsWith("/auth/"), { timeout: SLOW });
  await usable(page, landing);
  return new URL(page.url()).pathname;
}

async function admin(browser, rep) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const seen = watch(page);
  const R = "admin";
  await step(page, seen, R, rep, "sign-in → Konfigurasi", () => signIn(page, ADMIN_EMAIL, "/konfigurasi"));
  await step(page, seen, R, rep, "click Aktivasi akun", () => clickTo(page, "/aktivasi"));
  await step(page, seen, R, rep, "back to Konfigurasi", async () => { await page.goBack(); await usable(page, "/konfigurasi"); });
  await step(page, seen, R, rep, "click Studio", () => clickTo(page, "/studio"));
  await step(page, seen, R, rep, "click Buat Paket", () => clickTo(page, "/studio/unggah"));
  await step(page, seen, R, rep, "click Antrean Tinjauan", () => clickTo(page, "/studio/tinjau"));
  await step(page, seen, R, rep, "click Bank Soal", () => clickTo(page, "/studio/bank"));
  await step(page, seen, R, rep, "open Konfigurasi", async () => { await page.goto(`${APP}/konfigurasi`, { timeout: SLOW }); await usable(page, "/konfigurasi"); });
  await step(page, seen, R, rep, "click Ringkasan sekolah", async () => {
    const a = page.locator('a[href^="/dekan/ringkasan"]').first();
    await a.waitFor({ state: "visible", timeout: SLOW }); await a.click(); await usable(page, "/dekan/ringkasan");
  });
  // saves: grant Kepala departemen to the synthetic teacher at Bagian Uji Kinerja, then revoke it
  await page.goto(`${APP}/konfigurasi?muat=${Date.now()}#roles`, { timeout: SLOW });
  await usable(page, "/konfigurasi");
  await step(page, seen, R, rep, "save: Berikan peran", async () => {
    const form = page.locator("form").filter({ has: page.locator('select[name="person"]') });
    const person = await form.locator('select[name="person"] option').filter({ hasText: "Uji Kinerja Guru" }).first().getAttribute("value");
    if (!person) throw new Error("the synthetic teacher is not offered");
    await form.locator('select[name="person"]').selectOption(person);
    await form.locator('select[name="role"]').selectOption("HEAD_OF_DEPARTMENT");
    const scope = await form.locator('select[name="scope"] option').filter({ hasText: "Bagian Uji Kinerja" }).first().getAttribute("value");
    if (!scope) throw new Error("Bagian Uji Kinerja is not offered as a scope");
    await form.locator('select[name="scope"]').selectOption(scope);
    await form.locator('input[name="valid_until"]').fill("2027-06-30");
    const t = Date.now();
    await form.getByRole("button", { name: "Berikan peran" }).click();
    await page.waitForURL(/hasil=/, { timeout: SLOW });
    await page.locator("h1").first().waitFor({ state: "visible", timeout: SLOW });
    return `hasil=${new URL(page.url()).searchParams.get("hasil")}; click→result ${Date.now() - t} ms`;
  });
  await step(page, seen, R, rep, "save: Cabut", async () => {
    const row = page.locator("li").filter({ hasText: "Uji Kinerja Guru (sintetis)" }).filter({ hasText: "Kepala departemen" }).first();
    await row.waitFor({ state: "visible", timeout: SLOW });
    const t = Date.now();
    await row.getByRole("button", { name: "Cabut" }).click();
    await page.waitForURL(/hasil=/, { timeout: SLOW });
    await page.locator("h1").first().waitFor({ state: "visible", timeout: SLOW });
    return `hasil=${new URL(page.url()).searchParams.get("hasil")}; click→result ${Date.now() - t} ms`;
  });
  await ctx.close();
}

async function guru(browser, rep) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const seen = watch(page);
  const R = "guru";
  await step(page, seen, R, rep, "sign-in → Mengajar", () => signIn(page, GURU_EMAIL, "/mengajar"));
  let kelas = null;
  await step(page, seen, R, rep, "click Kelas Uji Kinerja A", async () => {
    const a = page.locator('a[href^="/mengajar/"]').filter({ hasText: "Kelas Uji Kinerja A" }).first();
    await a.waitFor({ state: "visible", timeout: SLOW });
    kelas = await a.getAttribute("href");
    await a.click(); await usable(page, kelas.split("?")[0]);
  });
  if (kelas) {
    await step(page, seen, R, rep, "click Siapkan", async () => {
      const a = page.locator(`a[href^="${kelas}/siapkan"]`).first();
      await a.waitFor({ state: "visible", timeout: SLOW }); await a.click(); await usable(page, `${kelas}/siapkan`);
    });
    await step(page, seen, R, rep, "back to the class", async () => { await page.goBack(); await usable(page, kelas); });
  }
  await ctx.close();
}

const browser = await chromium.launch();
for (let rep = 1; rep <= REPS; rep++) {
  await admin(browser, rep).catch((e) => line({ role: "admin", rep, step: "journey", ok: false, note: String(e.message || e).slice(0, 200) }));
  await guru(browser, rep).catch((e) => line({ role: "guru", rep, step: "journey", ok: false, note: String(e.message || e).slice(0, 200) }));
}
await browser.close();

console.log("\nSUMMARY (ms): step — rep1, rep2, …");
const by = new Map();
for (const o of out.filter((x) => x.ms !== undefined)) {
  const k = `${o.role} | ${o.step}`; if (!by.has(k)) by.set(k, []); by.get(k).push(o.ok ? o.ms : `FAIL(${o.ms})`);
}
for (const [k, v] of by) console.log(`${k.padEnd(48)} ${v.join(", ")}`);
