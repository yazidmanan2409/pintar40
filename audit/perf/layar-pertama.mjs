// W6.2 (CR-58, X.10, U-PERF ≤ 3 s): the FIRST SCREEN of each role, as a person meets it, timed in a real browser.
//
// For each persona: sign in (a real GoTrue session, as the crawl does), answer «Komputer siapa ini?», choose the
// role's door on `/`, then open the role's landing and its main pages, RUNS times each in the same browser context
// (the first can include a cold start; the median and the worst are both reported). Per visit, from the browser's own
// timing: TTFB (responseStart), DOMContentLoaded, load, and the largest contentful paint. A page PASSES when its
// worst LCP (or load, if no LCP was reported) is ≤ LIMIT_MS (3,000). Only GET navigations: nothing is written.
//
// Env: APP_URL, SUPABASE_URL, SUPABASE_ANON_KEY, APP_DIR (for its node_modules), OUT_DIR, RUNS (3), LIMIT_MS (3000).
// The run of record is against staging after the candidate is promoted (P-1); locally it is a pre-check only, on one
// machine with the database beside it, and says so. Never production.
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const APP = process.env.APP_URL, SB = process.env.SUPABASE_URL, ANON = process.env.SUPABASE_ANON_KEY;
if (!APP || !SB || !ANON) throw new Error("APP_URL, SUPABASE_URL and SUPABASE_ANON_KEY are required");
if (/pintarselalu\.com/.test(new URL(APP).hostname) && !/staging/.test(new URL(APP).hostname)) throw new Error("never production");
// Playwright is the harness's own (audit/package.json), as crawl.mjs imports it; Supabase's client is the app's
const harness = createRequire(import.meta.url);
const { chromium } = harness("playwright");
const require = createRequire(join(process.env.APP_DIR ?? process.cwd(), "package.json"));
const { createServerClient } = require("@supabase/ssr");
const OUT = process.env.OUT_DIR ?? "audit-out/layar-pertama";
const RUNS = Number(process.env.RUNS ?? 3);
const LIMIT = Number(process.env.LIMIT_MS ?? 3000);

// one persona per role, synthetic (D-046(c)); the pages are each role's own first screens
const PERSONA = [
  { key: "sysadmin", role: "SYSTEM_ADMIN", door: "MENGELOLA:PLATFORM", email: "sysadmin@synthetic.pintar.test", password: "Sintetis-Sys-91!", pages: ["/konfigurasi", "/konfigurasi/system", "/konfigurasi/audit", "/aktivasi"] },
  { key: "alpha-admin", role: "INSTITUTION_ADMIN", door: "MENGELOLA", email: "alpha-admin@synthetic.pintar.test", password: "Sintetis-AlphaAdmin-27!", pages: ["/konfigurasi", "/konfigurasi/roles", "/konfigurasi/transfers", "/pendataan", "/aktivasi"] },
  { key: "alpha-dean", role: "DEAN", door: "MENGELOLA", email: "alpha-dean@synthetic.pintar.test", password: "Sintetis-AlphaDean-33!", pages: ["/pimpinan"] },
  { key: "siklus-kaprodi", role: "HEAD_OF_DEPARTMENT", door: "MENGELOLA", email: "siklus-kaprodi@synthetic.pintar.test", password: "Sintetis-SiklusKaprodi-22!", pages: ["/pimpinan", "/studio"] },
  { key: "siklus-guru", role: "EDUCATOR", door: "MENGAJAR", email: "siklus-guru@synthetic.pintar.test", password: "Sintetis-SiklusGuru-11!", pages: ["/mengajar", "/studio"] },
  { key: "siklus-siswa", role: "STUDENT", door: "BELAJAR", email: "siklus-email@synthetic.pintar.test", password: "Sintetis-SiklusEmail-84!", pages: ["/belajar"] },
];

async function cookies(p) {
  const jar = new Map();
  const c = createServerClient(SB, ANON, { cookies: { getAll: () => [...jar].map(([name, value]) => ({ name, value })), setAll: (cs) => cs.forEach(({ name, value }) => jar.set(name, value)) } });
  const { error } = await c.auth.signInWithPassword({ email: p.email, password: p.password });
  if (error) throw new Error(`sign-in failed for ${p.key}: ${error.message}`);
  const host = new URL(APP).hostname;
  return [...jar].map(([name, value]) => ({ name, value, domain: host, path: "/", sameSite: "Lax" }));
}

const UKUR = () => new Promise((resolve) => {
  const nav = performance.getEntriesByType("navigation")[0];
  let lcp = null;
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) lcp = e.startTime; }).observe({ type: "largest-contentful-paint", buffered: true }); } catch {}
  setTimeout(() => resolve({ ttfb: Math.round(nav.responseStart), dcl: Math.round(nav.domContentLoadedEventEnd), load: Math.round(nav.loadEventEnd), lcp: lcp == null ? null : Math.round(lcp), status: nav.responseStatus ?? null }), 300);
});

const median = (xs) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const rows = [];
for (const p of PERSONA) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  try {
    await ctx.addCookies(await cookies(p));
    const page = await ctx.newPage();
    await page.goto(APP + "/", { waitUntil: "load" });
    if (new URL(page.url()).pathname === "/perangkat") {
      await page.locator('input[type="radio"][name="mode"][value="PERSONAL"]').check();
      await page.getByRole("button", { name: "Simpan pilihan" }).click();
      await page.waitForURL((u) => u.pathname !== "/perangkat", { timeout: 20000 });
    }
    const pintu = page.locator('[data-pemilih="konteks"] button[data-konteks]');
    if (await pintu.count()) {
      const kunci = await pintu.evaluateAll((bs) => bs.map((b) => b.getAttribute("data-konteks")));
      const pilih = kunci.find((k) => k === p.door) ?? kunci.find((k) => k.split(":")[0] === p.door.split(":")[0]) ?? kunci[0];
      await page.locator(`[data-pemilih="konteks"] button[data-konteks="${pilih}"]`).click();
      await page.waitForURL((u) => u.pathname !== "/", { timeout: 20000 });
    }
    for (const path of p.pages) {
      const runs = [];
      for (let i = 0; i < RUNS; i++) {
        await page.goto(APP + path, { waitUntil: "load", timeout: 30000 });
        runs.push(await page.evaluate(UKUR));
      }
      const layar = runs.map((r) => r.lcp ?? r.load);
      rows.push({ persona: p.key, role: p.role, path, final: new URL(page.url()).pathname, runs,
        ttfb_med: median(runs.map((r) => r.ttfb)), layar_med: median(layar), layar_maks: Math.max(...layar), lulus: Math.max(...layar) <= LIMIT });
    }
  } catch (e) {
    rows.push({ persona: p.key, role: p.role, error: String(e.message ?? e).slice(0, 200), lulus: false });
  } finally { await ctx.close(); }
}
await browser.close();

writeFileSync(join(OUT, "layar-pertama.json"), JSON.stringify({ app: APP, runs: RUNS, limit_ms: LIMIT, at: new Date().toISOString(), rows }, null, 2));
console.log(`persona          path                          ttfb(med)  screen(med)  screen(worst)  verdict`);
for (const r of rows) {
  if (r.error) { console.log(`${r.persona.padEnd(16)} ERROR ${r.error}`); continue; }
  console.log(`${r.persona.padEnd(16)} ${r.path.padEnd(29)} ${String(r.ttfb_med).padStart(6)} ms ${String(r.layar_med).padStart(8)} ms ${String(r.layar_maks).padStart(10)} ms   ${r.lulus ? "PASS" : "FAIL"}${r.final !== r.path ? ` (landed ${r.final})` : ""}`);
}
const gagal = rows.filter((r) => !r.lulus);
console.log(gagal.length ? `\nRED: ${gagal.length} first screen(s) over ${LIMIT} ms or not reached` : `\nGREEN: every first screen ≤ ${LIMIT} ms (worst of ${RUNS})`);
if (gagal.length) process.exitCode = 1;
