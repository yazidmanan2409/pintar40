import { writeFileSync as wf2 } from "node:fs";
const ASET = "../aset2"; const META = {};
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
async function dua(browser, buka, fn) { for (const vp of [{ width: 640, height: 900 }, { width: 390, height: 844 }]) { const p = await buka(vp); await fn(p); await (p.__keluar ? p.__keluar() : p.context().close()); } }
const browser = await chromium.launch();
const persona = (i) => async (vp) => { const ctx0 = await browser.newContext({ viewport: vp, deviceScaleFactor: 2, locale: "id-ID", timezoneId: "Asia/Jakarta" });
  await ctx0.addCookies(await cookies({ key: "penilai", email: "penilai@evaluasi.pintar.test", password: "Penilai-Evaluasi-4417!" })); const p = await ctx0.newPage();
  await p.goto(`${APP}/evaluasi`, { waitUntil: "networkidle" });
  if (await p.locator('input[value="PERSONAL"]').count()) { await p.locator('input[value="PERSONAL"]').check(); await p.getByRole("button", { name: "Simpan pilihan" }).click(); await p.waitForTimeout(1200); await p.goto(`${APP}/evaluasi`, { waitUntil: "networkidle" }); }
  const nb = await p.locator('form[action*="/api/evaluation/assume"] button').count(); console.log("persona buttons", nb, "url", p.url()); await p.locator('form[action*="/api/evaluation/assume"] button').nth(i).click(); await p.waitForURL((u) => u.pathname !== "/evaluasi", { timeout: 30000 }).catch(() => {}); await p.waitForLoadState("networkidle");
  p.__keluar = async () => { const k = p.getByRole("button", { name: "Keluar dari peragaan" }); if (await k.count()) { await k.first().click().catch(() => {}); await p.waitForTimeout(1200); } await ctx0.close(); };
  return p; };
const ke = async (p, j) => { await p.goto(`${APP}${j}`, { waitUntil: "networkidle" }); const l = p.getByRole("button", { name: /Lewati|Tutup tur/ }).first(); if (await l.isVisible().catch(() => false)) await l.click().catch(() => {}); await p.waitForTimeout(500); };
const pertama = async (p, dari, pola) => { await ke(p, dari); return p.locator(`main a[href^="${pola}"]`).evaluateAll((as) => as.map((a) => a.getAttribute("href")).find((h) => !/\/(hasil|siapa|lanjut)/.test(h))); };
await dua(browser, persona(0), async (p) => {
  await ke(p, "/belajar"); console.log("URL", p.url(), norm(await p.locator("main").innerText().catch(() => "")).slice(0, 200));
  const tugas = await p.locator('main a[href^="/belajar/"]').evaluateAll((as) => as.map((a) => a.getAttribute("href")).map((h) => (h.match(/^(\/belajar\/[0-9a-f-]{36})/) || [])[1]).find(Boolean));
  console.log("tugas", tugas, await p.locator("main a").evaluateAll((as) => as.map((a) => a.getAttribute("href")).join(" ")));
  await ke(p, tugas); await potong(p, "murid-langkah", "Lima langkah", "LANGKAH ANDA SEKARANG", { atasAkhir: true, pad: 16 });
  await ke(p, tugas + "/hasil"); await potong(p, "murid-hasil", "PENGUASAAN", "TINJAU KEMBALI", { atasAkhir: true, pad: 16 });
});
wf2(`${ASET}/meta-asli8.json`, JSON.stringify(META, null, 1));
await browser.close();
