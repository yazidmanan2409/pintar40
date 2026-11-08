// Readiness walk (Daisy, 8 Nov): the corrected screens in the real application, at 1280, 390 and A4.
// Local synthetic stack only (supabase/seed). Reads; the one act it starts (Keluar dari semua) it cancels.
import { chromium } from "playwright";
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const APP = process.env.APP_URL ?? "http://127.0.0.1:3999";
const SB = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const OUT = process.env.OUT_DIR ?? "audit-out/siap-jalan";
const SLOW = 30000;
const require = createRequire(join(process.cwd(), "package.json"));
const { createServerClient } = require("@supabase/ssr");

const ORANG = {
  admin: { key: "admin", tujuan: "MENGELOLA", email: "alpha-admin@synthetic.pintar.test", password: "Sintetis-AlphaAdmin-27!" },
  guru: { key: "guru", tujuan: "MENGAJAR", email: "alpha-guru@synthetic.pintar.test", password: "Sintetis-AlphaGuru-52!" },
  dekan: { key: "dekan", tujuan: "MEMIMPIN", email: "alpha-dean@synthetic.pintar.test", password: "Sintetis-AlphaDean-33!" },
};
mkdirSync(OUT, { recursive: true });
const norm = (s) => (s ?? "").replace(/\s+/g, " ").trim();

const langkah = [];
async function step(id, judul, fn) {
  const rec = { id, judul, verdict: "PASS", catatan: [], shots: [] };
  try { await fn(rec); } catch (e) { rec.verdict = "FAIL"; rec.catatan.push(`error: ${String(e.message ?? e).split("\n")[0].slice(0, 300)}`); }
  langkah.push(rec);
  console.log(`${rec.verdict.padEnd(5)} ${id} ${judul}\n      ${rec.catatan.join("\n      ")}`);
}
const harus = (rec, ok, kata) => { rec.catatan.push(`${ok ? "ok" : "!!"} ${kata}`); if (!ok) rec.verdict = "FAIL"; return ok; };
async function shot(page, rec, nama) {
  const f = `${String(langkah.length + 1).padStart(2, "0")}-${nama}.png`;
  await page.screenshot({ path: join(OUT, f), fullPage: true }).catch(() => null);
  rec.shots.push(f);
}
async function lebar(page) {
  return page.evaluate(() => ({ s: document.documentElement.scrollWidth, w: window.innerWidth }));
}

async function cookies(p) {
  const jar = new Map();
  const client = createServerClient(SB, ANON, {
    cookies: { getAll: () => [...jar].map(([name, value]) => ({ name, value })), setAll: (cs) => cs.forEach(({ name, value }) => jar.set(name, value)) },
  });
  const { data, error } = await client.auth.signInWithPassword({ email: p.email, password: p.password });
  if (error || !data.session) throw new Error(`sign-in failed for ${p.key}: ${error?.message ?? "no session"}`);
  const host = new URL(APP).hostname;
  return [...jar].map(([name, value]) => ({ name, value, domain: host, path: "/", httpOnly: false, secure: false, sameSite: "Lax" }));
}
async function masuk(browser, p, viewport = { width: 1280, height: 900 }) {
  const context = await browser.newContext({ viewport, locale: "id-ID", timezoneId: "Asia/Jakarta" });
  await context.addCookies(await cookies(p));
  const page = await context.newPage();
  await page.goto(`${APP}/`, { waitUntil: "networkidle" });
  if (new URL(page.url()).pathname === "/perangkat") {
    await page.locator('input[type="radio"][name="mode"][value="PERSONAL"]').check();
    await page.getByRole("button", { name: "Simpan pilihan" }).click();
    await page.waitForURL((u) => u.pathname !== "/perangkat", { timeout: SLOW }).catch(() => {});
    await page.goto(`${APP}/`, { waitUntil: "networkidle" });
  }
  const pintu = page.locator('[data-pemilih="konteks"] button[data-konteks]');
  if (await pintu.count()) {
    const kunci = await pintu.evaluateAll((bs) => bs.map((b) => b.getAttribute("data-konteks")));
    const pilih = kunci.find((k) => k.split(":")[0] === p.tujuan) ?? kunci[0];
    await page.locator(`[data-pemilih="konteks"] button[data-konteks="${pilih}"]`).click();
    await page.waitForURL((u) => u.pathname !== "/", { timeout: SLOW }).catch(() => {});
  }
  await page.waitForLoadState("networkidle");
  return { context, page };
}
async function buka(page, jalan) {
  const r = await page.goto(`${APP}${jalan}`, { waitUntil: "networkidle" });
  const lewati = page.getByRole("button", { name: /Lewati|Tutup tur/ }).first();
  if (await lewati.isVisible().catch(() => false)) await lewati.click().catch(() => {});
  return r;
}

import { writeFileSync as wf2 } from "node:fs";
const ASET = "../aset"; const META = {};
// the bounding box (page coordinates) of the smallest visible element whose text contains `t`
const kotak = (p, t, n = 0) => p.evaluate(([t, n]) => {
  const all = [...document.querySelectorAll("main *, body > *")].filter((e) => e.offsetParent !== null && (e.innerText || "").includes(t));
  const min = all.filter((e) => ![...e.children].some((c) => (c.innerText || "").includes(t)));
  const e = min[n]; if (!e) return null; const r = e.getBoundingClientRect();
  return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height };
}, [t, n]);
async function potong(p, nama, mulai, akhir, { atasAkhir = false, pad = 20, lebarPenuh = true } = {}) {
  const a = await kotak(p, mulai), b = await kotak(p, akhir);
  if (!a || !b) { console.log("!! not found", nama, !!a, !!b); return; }
  const main = await p.evaluate(() => { const m = document.querySelector("main") ?? document.body; const r = m.getBoundingClientRect(); return { x: r.left, w: r.width }; });
  const y0 = Math.max(0, a.y - pad), y1 = atasAkhir ? b.y - 4 : b.y + b.h + pad;
  const x0 = lebarPenuh ? Math.max(0, main.x) : Math.max(0, Math.min(a.x, b.x) - pad);
  const w = lebarPenuh ? main.w : Math.max(a.x + a.w, b.x + b.w) - x0 + pad;
  const vw = p.viewportSize().width; const clip = { x: x0, y: y0, width: Math.min(w, vw - x0), height: y1 - y0 };
  const f = `${nama}-${vw < 600 ? "hp" : "lebar"}.jpg`;
  await p.screenshot({ path: `${ASET}/${f}`, clip, fullPage: true, type: "jpeg", quality: 84 });
  META[f] = { w: Math.round(clip.width), h: Math.round(clip.height) }; console.log("ok", f, META[f]);
}
async function dua(browser, buka, fn) { for (const vp of [{ width: 1100, height: 900 }, { width: 390, height: 844 }]) { const p = await buka(vp); await fn(p); await (p.__keluar ? p.__keluar() : p.context().close()); } }
const browser = await chromium.launch();
const persona = (i) => async (vp) => { const ctx0 = await browser.newContext({ viewport: vp, deviceScaleFactor: 2, locale: "id-ID", timezoneId: "Asia/Jakarta" });
  await ctx0.addCookies(await cookies({ key: "penilai", email: "penilai@evaluasi.pintar.test", password: "Penilai-Evaluasi-4417!" })); const p = await ctx0.newPage();
  await p.goto(`${APP}/evaluasi`, { waitUntil: "networkidle" });
  if (await p.locator('input[value="PERSONAL"]').count()) { await p.locator('input[value="PERSONAL"]').check(); await p.getByRole("button", { name: "Simpan pilihan" }).click(); await p.waitForTimeout(1200); await p.goto(`${APP}/evaluasi`, { waitUntil: "networkidle" }); }
  await p.locator('form[action*="/api/evaluation/assume"] button').nth(i).click(); await p.waitForURL((u) => u.pathname !== "/evaluasi", { timeout: 30000 }).catch(() => {}); await p.waitForLoadState("networkidle");
  p.__keluar = async () => { const k = p.getByRole("button", { name: "Keluar dari peragaan" }); if (await k.count()) { await k.first().click().catch(() => {}); await p.waitForTimeout(1200); } await ctx0.close(); };
  return p; };
const ke = async (p, j) => { await p.goto(`${APP}${j}`, { waitUntil: "networkidle" }); const l = p.getByRole("button", { name: /Lewati|Tutup tur/ }).first(); if (await l.isVisible().catch(() => false)) await l.click().catch(() => {}); await p.waitForTimeout(500); };
const KELAS = "/mengajar/90562664-6c2f-4749-935d-7dfec0311e3e", PAKET = "/studio/paket/d208be52-4944-4943-892c-848f6edbe162", TUGAS = "/belajar/d40e75a2-62cf-4f41-b293-a76bd73bc1e3";
await dua(browser, persona(1), async (p) => {
  await ke(p, "/studio/unggah"); await potong(p, "studio-unggah", "Unggah buku kerja pelajaran", "Paling besar 5 MB");
  await ke(p, PAKET); await potong(p, "studio-paket", "Paket ini sudah terbit", "Soal 2 dari 12", { atasAkhir: true });
  await ke(p, KELAS + "/uji-cepat"); await potong(p, "uji-cepat", "Beberapa soal untuk mengecek", "Mana yang TIDAK senilai", { atasAkhir: true });
  await ke(p, KELAS); await potong(p, "kelas", "ANDA SEDANG MELIHAT", "Umpan balik kelas");
  await ke(p, KELAS + "/bukti"); await potong(p, "bukti-belum", "Apa yang sudah bisa disimpulkan", "Penguasaan per topik");
});
await dua(browser, persona(0), async (p) => {
  await ke(p, TUGAS); await potong(p, "murid-langkah", "Pecahan Senilai", "LANGKAH ANDA SEKARANG", { atasAkhir: true });
  await ke(p, TUGAS + "/hasil"); await potong(p, "murid-hasil", "PENGUASAAN", "TINJAU KEMBALI", { atasAkhir: true });
});
await dua(browser, persona(4), async (p) => {
  await ke(p, "/konfigurasi"); await potong(p, "persiapan", "Persiapan sekolah", "Setiap Kelas punya guru");
  await ke(p, "/pendataan"); const t = await p.locator("main").innerText(); console.log("PENDATAAN has upload:", /DAFTAR ORANG/.test(t));
  if (/DAFTAR ORANG/.test(t)) await potong(p, "pendataan", "DAFTAR ORANG", "Pilih berkas");
  await ke(p, "/aktivasi"); console.log("AKT:", norm(await p.locator("main").innerText()).slice(0, 300));
});
await dua(browser, async (vp) => { const c = await browser.newContext({ viewport: vp, deviceScaleFactor: 2, locale: "id-ID" }); const p = await c.newPage(); await p.goto(`${APP}/verifikasi`, { waitUntil: "networkidle" }); return p; }, async (p) => { console.log("VERIF:", norm(await p.locator("main").innerText()).slice(0, 300)); await potong(p, "verifikasi", (await p.locator("h1").first().innerText()).trim(), "Periksa", { pad: 24 }); });
wf2(`${ASET}/meta-asli.json`, JSON.stringify(META, null, 1));
await browser.close();
