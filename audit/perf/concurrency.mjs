// U-PERF (D-046(b)): 30 active staff sessions for 10 minutes on staging, with no timeout or error.
// Synthetic staff only (D-046(c)). The run is SHARDS jobs of SESSIONS sessions each: one browser per job,
// one browser context per session, alternately the synthetic school admin and the synthetic teacher.
// Sign-ins are spread over the first minute; then each session clicks through its role's menus, reading
// 3–8 s between clicks, until the window closes. One session in the whole run (shard 0, session 0) also
// saves: it renames the Bagian and renames it back every fourth round, and puts the name back if a round
// is cut short. Every click prints one JSON line; the job ends with a SUMMARY line and fails on any failed
// click, any 5xx from PINTAR's pages or any error thrown in a page.
import os from "node:os";
import { chromium } from "playwright";
import { APP, SLOW, clickTo, closeTour, esc, rename, signIn, usable } from "./lib.mjs";

const SHARD = Number(process.env.SHARD || 0);
const SHARDS = Number(process.env.SHARDS || 1);
const SESSIONS = Number(process.env.SESSIONS || 10);
const MINUTES = Number(process.env.MINUTES || 10);
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const GURU_EMAIL = process.env.GURU_EMAIL;
const RAMP = 60000;
const BAGIAN = "Bagian Uji Kinerja", SEMENTARA = "Bagian Uji Kinerja (diukur)";

const out = [];
const line = (o) => { out.push(o); console.log(JSON.stringify(o)); };
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const think = () => pause(3000 + Math.random() * 5000);

const t0 = Date.now();
const closes = t0 + RAMP + MINUTES * 60000;
const seen = { server5xx: 0, pageErrors: 0 };

async function timed(s, role, step, act) {
  const t = Date.now();
  let ok = true, note = "";
  try { note = (await act()) || ""; } catch (e) { ok = false; note = String(e.message || e).slice(0, 200); }
  line({ shard: SHARD, s, role, step, ok, ms: Date.now() - t, at: new Date(t).toISOString(), note });
  return ok;
}

const openKonfigurasi = async (p) => { await p.goto(`${APP}/konfigurasi`, { timeout: SLOW }); await usable(p, "/konfigurasi"); };
const ADMIN_ROUND = [
  ["click Aktivasi akun", (p) => clickTo(p, "/aktivasi")],
  ["back to Konfigurasi", async (p) => { await p.goBack(); await usable(p, "/konfigurasi"); }],
  ["click Studio", (p) => clickTo(p, "/studio")],
  ["click Buat Paket", (p) => clickTo(p, "/studio/unggah")],
  ["click Antrean Tinjauan", (p) => clickTo(p, "/studio/tinjau")],
  ["click Bank Soal", (p) => clickTo(p, "/studio/bank")],
  ["open Konfigurasi", openKonfigurasi],
  // B1 (c4e2ffe3, 7863d71b): the school's summary is on Konfigurasi's «Laporan» section, a page of its own
  ["click Laporan", async (p) => {
    const a = p.locator('a[data-bagian-ke="laporan"]').first();
    await a.waitFor({ state: "visible", timeout: SLOW }); await a.click(); await usable(p, "/konfigurasi/laporan");
  }],
  ["click Ringkasan sekolah", async (p) => {
    const a = p.locator('a[href^="/dekan/ringkasan"]').first();
    await a.waitFor({ state: "visible", timeout: SLOW }); await a.click(); await usable(p, "/dekan/ringkasan");
  }],
  ["open Konfigurasi", openKonfigurasi],
];
const openMengajar = async (p) => { await p.goto(`${APP}/mengajar`, { timeout: SLOW }); await usable(p, "/mengajar"); };
const GURU_ROUND = [
  ["click Kelas Uji Kinerja A", async (p, st) => {
    const a = p.locator('a[href^="/mengajar/"]').filter({ hasText: "Kelas Uji Kinerja A" }).first();
    await a.waitFor({ state: "visible", timeout: SLOW });
    st.kelas = (await a.getAttribute("href")).split("?")[0];
    await a.click(); await usable(p, st.kelas);
  }],
  ["click Siapkan", async (p, st) => {
    const a = p.locator(`a[href^="${st.kelas}/siapkan"]`).first();
    await a.waitFor({ state: "visible", timeout: SLOW }); await a.click(); await usable(p, `${st.kelas}/siapkan`);
  }],
  ["back to the class", async (p, st) => { await p.goBack(); await usable(p, st.kelas); }],
  ["open Mengajar", openMengajar],
];

async function putNameBack(p) {
  await p.goto(`${APP}/konfigurasi/struktur#struktur`, { timeout: SLOW });
  await usable(p, "/konfigurasi/struktur");
  const moved = p.locator("strong.pin-str-nama", { hasText: new RegExp(`^${esc(SEMENTARA)}$`) });
  if (await moved.count()) await rename(p, SEMENTARA, BAGIAN);
}

async function run(browser, i) {
  const s = SHARD * SESSIONS + i;
  const role = s % 2 === 0 ? "admin" : "guru";
  const writer = s === 0;
  await pause((s * RAMP) / (SHARDS * SESSIONS));
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  page.on("pageerror", (e) => { seen.pageErrors++; line({ shard: SHARD, s, role, pageerror: String(e.message || e).slice(0, 200) }); });
  page.on("response", (res) => {
    if (res.status() >= 500 && res.url().startsWith(APP)) {
      seen.server5xx++; line({ shard: SHARD, s, role, server5xx: res.status(), url: new URL(res.url()).pathname });
    }
  });
  const landing = role === "admin" ? "/konfigurasi" : "/mengajar";
  const signedIn = await timed(s, role, "sign-in", () => signIn(page, role === "admin" ? ADMIN_EMAIL : GURU_EMAIL, landing));
  if (!signedIn) { await ctx.close(); return; }
  await closeTour(page);
  const round = role === "admin" ? ADMIN_ROUND : GURU_ROUND;
  const st = {};
  for (let r = 1; Date.now() < closes; r++) {
    for (const [step, act] of round) {
      if (Date.now() >= closes) break;
      await think();
      if (!(await timed(s, role, step, () => act(page, st)))) {
        // back to the home page and on with the next round; the failure is already on record
        await page.goto(`${APP}${landing}`, { timeout: SLOW }).then(() => usable(page, landing)).catch(() => {});
        break;
      }
    }
    if (writer && r % 4 === 0 && Date.now() < closes) {
      await think();
      await page.goto(`${APP}/konfigurasi/struktur#struktur`, { timeout: SLOW }).then(() => usable(page, "/konfigurasi/struktur")).catch(() => {});
      await timed(s, role, "save: Ubah nama", () => rename(page, BAGIAN, SEMENTARA))
        && await timed(s, role, "save: Ubah nama back", () => rename(page, SEMENTARA, BAGIAN));
    }
  }
  if (writer) await putNameBack(page).catch((e) => line({ shard: SHARD, s, role, step: "put the name back", ok: false, note: String(e.message || e).slice(0, 200) }));
  await ctx.close();
}

const load = setInterval(() => line({ shard: SHARD, runner: { load1: os.loadavg()[0], freeMemMB: Math.round(os.freemem() / 1048576) } }), 30000);
const browser = await chromium.launch();
await Promise.all(Array.from({ length: SESSIONS }, (_, i) => run(browser, i)));
await browser.close();
clearInterval(load);

const steps = out.filter((o) => o.step !== undefined && o.ms !== undefined);
const pct = (v, q) => { const a = [...v].sort((x, y) => x - y); return a.length ? a[Math.min(a.length - 1, Math.ceil(q * a.length) - 1)] : null; };
const by = new Map();
for (const o of steps) { if (!by.has(o.step)) by.set(o.step, []); by.get(o.step).push(o); }
console.log(`\nSUMMARY shard ${SHARD}: window ${new Date(t0).toISOString()} → ${new Date().toISOString()}; step — n, failed, p50, p95, max (ms)`);
for (const [k, v] of by) {
  const ms = v.filter((o) => o.ok).map((o) => o.ms);
  console.log(`${k.padEnd(28)} ${String(v.length).padStart(4)} ${String(v.length - ms.length).padStart(3)} ${String(pct(ms, 0.5)).padStart(6)} ${String(pct(ms, 0.95)).padStart(6)} ${String(Math.max(0, ...ms)).padStart(6)}`);
}
const clicks = steps.filter((o) => o.ok && !o.step.startsWith("sign-in") && !o.step.startsWith("save") && !o.step.startsWith("back")).map((o) => o.ms);
const failed = steps.filter((o) => !o.ok).length;
line({ SUMMARY: { shard: SHARD, sessions: SESSIONS, minutes: MINUTES, steps: steps.length, failed, server5xx: seen.server5xx, pageErrors: seen.pageErrors,
                  clicks: clicks.length, clickP50: pct(clicks, 0.5), clickP95: pct(clicks, 0.95), clickMax: Math.max(0, ...clicks),
                  under3s: clicks.filter((x) => x < 3000).length } });
if (failed || seen.server5xx || seen.pageErrors) process.exit(1);
