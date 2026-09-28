// U-PERF (D-046): a person's journey on staging, timed. Synthetic staff only (D-046(c)).
// Sign-in to a usable first screen; menu clicks; a representative save (renaming the synthetic school's
// Bagian and renaming it back, so each run leaves the data as it found it), timed twice: click to the
// button's own "saving" state (D-046(e): acknowledged at once) and click to the result line. Each step prints one JSON line with its window, so the
// coordinator can count Supabase requests per step from the log, and the Vercel function
// responses seen in the browser during the step (x-vercel-id ::sin1::).
import { chromium } from "playwright";
import { APP, SLOW, clickTo, closeTour, rename, signIn, usable } from "./lib.mjs";

const REPS = Number(process.env.REPS || 2);
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const GURU_EMAIL = process.env.GURU_EMAIL;

const out = [];
function line(o) { out.push(o); console.log(JSON.stringify(o)); }

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
  const fn = seen.slice(before).filter((s) => s.id.split("::").length === 3);
  line({ role, rep, step: name, ok, ms: t1 - t0, start, end: new Date(t1).toISOString(),
         vercel_function_responses: fn.length, regions: [...new Set(fn.map((s) => s.id.split("::")[1]))], note });
  // a failed step leaves the page somewhere else: the rest of this journey would only time out
  if (!ok) throw new Error(`stopped after "${name}"`);
}

async function tour(page, role, rep) {
  if (await closeTour(page)) line({ role, rep, step: "first-visit tour closed (not timed)", ok: true });
}

async function admin(browser, rep) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const seen = watch(page);
  const R = "admin";
  await step(page, seen, R, rep, "sign-in → Konfigurasi", () => signIn(page, ADMIN_EMAIL, "/konfigurasi"));
  await tour(page, R, rep);
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
  // the save: rename the synthetic school's Bagian and rename it back (Konfigurasi → Struktur sekolah)
  const BAGIAN = "Bagian Uji Kinerja", SEMENTARA = "Bagian Uji Kinerja (diukur)";
  await page.goto(`${APP}/konfigurasi#struktur`, { timeout: SLOW });
  await usable(page, "/konfigurasi");
  await step(page, seen, R, rep, "save: Ubah nama", () => rename(page, BAGIAN, SEMENTARA));
  await step(page, seen, R, rep, "save: Ubah nama back", () => rename(page, SEMENTARA, BAGIAN));
  await ctx.close();
}

async function guru(browser, rep) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const seen = watch(page);
  const R = "guru";
  await step(page, seen, R, rep, "sign-in → Mengajar", () => signIn(page, GURU_EMAIL, "/mengajar"));
  await tour(page, R, rep);
  let kelas = null;
  await step(page, seen, R, rep, "click Kelas Uji Kinerja A", async () => {
    const a = page.locator('a[href^="/mengajar/"]').filter({ hasText: "Kelas Uji Kinerja A" }).first();
    await a.waitFor({ state: "visible", timeout: SLOW });
    kelas = await a.getAttribute("href");
    await a.click(); await usable(page, kelas.split("?")[0]);
  });
  if (kelas) {
    await tour(page, R, rep);
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
