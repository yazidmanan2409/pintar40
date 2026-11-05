// D1 step 2 (DAISY-37; 05-D1 test plan §4): the eight identity emails, rendered from the real templates through the
// real frame (scripts/d1-spesimen.mts, run in APP_DIR), in a real browser at 600 and 320 px, light and dark, and with
// images blocked. It checks structure, not pixels:
//
//   E1  at 320 px (K09): no sideways scroll; no text under 13 px; every button at least 44 px high; the reason line
//       within the first 900 px; at 600 and 320, light and dark, the card's gold top edge is kept, and the header's
//       text wordmark «PINTAR» (D-192: no image) is #075056, the light teal on dark
//   E2  images blocked (K13; the owner's images-blocked addendum): with every image removed, each email still says
//       who («PINTAR» in the heading or the reason, «PT ZAYD PINTAR SELALU» in the footer), why (the reason line under
//       the heading) and what (the heading with its code or its action); the card's facts survive as text
//   E3  the keyboard order (STEP-2 §4): the action, then its fallback address, then the footer's mailto and domain;
//       an email with no action starts at the footer
//
// Screenshots and the HTML go to OUT_DIR. Synthetic people and schools only; nothing is sent. Exits 1 on any FAIL.
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const APP_DIR = process.env.APP_DIR ?? process.cwd();
const OUT = process.env.OUT_DIR ?? "audit-out/d1-email";
const SPES = join(OUT, "spesimen");
mkdirSync(SPES, { recursive: true });
execFileSync("npx", ["tsx", "scripts/d1-spesimen.mts", SPES], { cwd: APP_DIR, stdio: "inherit" });
const daftar = JSON.parse(readFileSync(join(SPES, "spesimen.json"), "utf8"));

const langkah = [];
let gagal = false;
async function step(id, judul, fn) {
  const rec = { id, judul, verdict: "PASS", catatan: [], shots: [] };
  try { await fn(rec); } catch (e) { rec.verdict = "FAIL"; rec.catatan.push(`error: ${String(e.message ?? e).split("\n")[0].slice(0, 300)}`); }
  if (rec.verdict !== "PASS") gagal = true;
  langkah.push(rec);
  console.log(`${rec.verdict.padEnd(5)} ${id} ${judul}\n      ${rec.catatan.join("\n      ")}`);
}
const harus = (rec, ok, kata) => { rec.catatan.push(`${ok ? "ok" : "!!"} ${kata}`); if (!ok) rec.verdict = "FAIL"; return ok; };

const browser = await chromium.launch();
async function buka(kode, { lebar, gelap = false, tanpaGambar = false }) {
  const context = await browser.newContext({ viewport: { width: lebar, height: 900 }, colorScheme: gelap ? "dark" : "light", deviceScaleFactor: 1 });
  const page = await context.newPage();
  // the logo's address is the environment's own; nothing is fetched from outside in this walk
  await page.route("**/*", (r) => (r.request().resourceType() === "document" ? r.continue() : r.abort()));
  await page.setContent(readFileSync(join(SPES, `${kode}.html`), "utf8"), { waitUntil: "load" });
  if (tanpaGambar) await page.evaluate(() => document.querySelectorAll("img").forEach((i) => i.remove()));
  return { context, page };
}

await step("E1", "at 320 px: no sideways scroll, no text under 13 px, buttons at least 44 px, the reason in the first 900 px; the gold edge kept, light and dark", async (rec) => {
  for (const s of daftar) {
    for (const [lebar, gelap] of [[600, false], [600, true], [320, false], [320, true]]) {
      const { context, page } = await buka(s.kode, { lebar, gelap });
      const ukur = await page.evaluate(() => {
        const terlihat = (el) => { const r = el.getBoundingClientRect(); const g = getComputedStyle(el); return r.width > 0 && r.height > 0 && g.display !== "none" && g.visibility !== "hidden" && g.opacity !== "0"; };
        const teks = [...document.querySelectorAll("body *")].filter((el) => terlihat(el) && [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()));
        const kecil = teks.filter((el) => parseFloat(getComputedStyle(el).fontSize) < 13).map((el) => `${el.tagName}.${el.className}:${getComputedStyle(el).fontSize}`);
        const tombol = [...document.querySelectorAll(".pin-tombol-a")].map((a) => a.getBoundingClientRect().height);
        const alasan = document.querySelector(".pin-alasan")?.getBoundingClientRect().top ?? Infinity;
        const kartu = document.querySelector(".pin-kartu");
        const merek = document.querySelector(".pin-merek-teks");
        return { geser: document.documentElement.scrollWidth - document.documentElement.clientWidth, kecil, tombol, alasan, emas: kartu ? getComputedStyle(kartu).borderTopColor : "", merek: merek ? getComputedStyle(merek).color : "", merekTeks: merek ? `${merek.tagName}:${merek.textContent.trim()}` : "" };
      });
      const nama = `${s.kode} ${lebar}${gelap ? " dark" : ""}`;
      harus(rec, ukur.emas === "rgb(192, 156, 79)", `${nama}: the card's top edge is gold (${ukur.emas})`);
      // RESTATED FOR D-192: the header is the text wordmark «PINTAR» (no image), in #075056, and the light teal on a
      // client's dark mode (bingkai.ts .pin-merek-teks), so it reads the same with images blocked or not
      harus(rec, ukur.merekTeks === "SPAN:PINTAR" && ukur.merek === (gelap ? "rgb(134, 207, 191)" : "rgb(7, 80, 86)"),
        `${nama}: the header is the text wordmark in the ${gelap ? "dark-mode " : ""}wordmark colour (${ukur.merekTeks}, ${ukur.merek})`);
      if (lebar === 320) {
        harus(rec, ukur.geser <= 0, `${nama}: no sideways scroll (${ukur.geser} px over)`);
        harus(rec, ukur.kecil.length === 0, `${nama}: no text under 13 px${ukur.kecil.length ? `: ${ukur.kecil.slice(0, 3).join(", ")}` : ""}`);
        harus(rec, ukur.tombol.every((h) => h >= 44), `${nama}: every button at least 44 px (${ukur.tombol.map(Math.round).join(", ") || "none"})`);
        harus(rec, ukur.alasan < 900, `${nama}: the reason line within the first 900 px (at ${Math.round(ukur.alasan)})`);
      }
      const f = `${s.kode}-${lebar}-${gelap ? "gelap" : "terang"}.png`;
      await page.screenshot({ path: join(OUT, f), fullPage: true });
      rec.shots.push(f);
      await context.close();
    }
  }
});

await step("E2", "images blocked: each email still says who, why and what; the card's facts survive as text", async (rec) => {
  for (const s of daftar) {
    for (const lebar of [600, 320]) {
      const { context, page } = await buka(s.kode, { lebar, tanpaGambar: true });
      const isi = await page.evaluate(() => {
        const t = (q) => (document.querySelector(q)?.textContent ?? "").replace(/\s+/g, " ").trim();
        return {
          gambar: document.querySelectorAll("img").length, judul: t("h1"), alasan: t(".pin-alasan"), kaki: t(".pin-kaki"),
          kode: t(".pin-kode"), aksi: t(".pin-tombol-a"), kartu: t(".pin-kartu-pintar"),
          alasanDulu: document.querySelector("h1")?.nextElementSibling?.classList.contains("pin-alasan") ?? false,
        };
      });
      const nama = `${s.kode} ${lebar}`;
      harus(rec, isi.gambar === 0, `${nama}: every image is removed`);
      harus(rec, /PINTAR/.test(`${isi.judul} ${isi.alasan}`) && isi.kaki.includes("PT ZAYD PINTAR SELALU"), `${nama}: who — «PINTAR» in the heading or reason, the company in the footer`);
      harus(rec, isi.alasanDulu && isi.alasan.length > 20, `${nama}: why — the reason line directly under the heading («${isi.alasan.slice(0, 50)}…»)`);
      harus(rec, isi.judul.length > 0 && (isi.kode.length > 0 || isi.aksi.length > 0 || s.kode === "6b"), `${nama}: what — the heading and its code or action («${isi.judul}»)`);
      if (s.kode.startsWith("5")) harus(rec, /Nadia Putri Maharani/.test(isi.kartu) && /A14C D7ST/.test(isi.kartu) && /Guru/.test(isi.kartu), `${nama}: the card's name, ID and roles are text`);
      const f = `${s.kode}-${lebar}-tanpa-gambar.png`;
      await page.screenshot({ path: join(OUT, f), fullPage: true });
      rec.shots.push(f);
      await context.close();
    }
  }
});

await step("E3", "the keyboard order: the action, its fallback address, then the footer's mailto and domain", async (rec) => {
  for (const s of daftar) {
    const { context, page } = await buka(s.kode, { lebar: 600 });
    const urut = [];
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press("Tab");
      const h = await page.evaluate(() => { const a = document.activeElement; return a && a !== document.body ? `${a.getAttribute("href")}|${(a.textContent ?? "").trim()}` : null; });
      if (!h || urut.includes(h)) break;
      urut.push(h);
    }
    const href = urut.map((u) => u.split("|")[0]);
    const kaki = href.slice(-2);
    harus(rec, kaki[0] === "mailto:info@pintarselalu.com" && kaki[1] === "https://pintarselalu.com", `${s.kode}: the footer's mailto then domain end the order (${href.join(" → ")})`);
    const aksi = await page.locator(".pin-tombol-a").count();
    if (aksi) harus(rec, href.length === 4 && href[0] === href[1] && urut[0].split("|")[1].length > 0, `${s.kode}: the action, then its fallback address to the same place, first`);
    else harus(rec, href.length === 2, `${s.kode}: with no action, the order starts at the footer`);
    writeFileSync(join(OUT, `${s.kode}-tab.txt`), urut.map((u, i) => `${i + 1}. ${u.split("|")[1] || u.split("|")[0]}`).join("\n") + "\n");
    await context.close();
  }
});

await browser.close();
writeFileSync(join(OUT, "d1-email.json"), JSON.stringify({ langkah }, null, 2));
console.log(`\n${langkah.filter((l) => l.verdict === "PASS").length}/${langkah.length} PASS`);
process.exit(gagal ? 1 : 0);
