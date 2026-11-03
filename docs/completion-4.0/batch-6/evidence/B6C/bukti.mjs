// B6C evidence: sign in as the seeded learner holding the one ISSUED certificate, render the real page,
// save an A4 PDF and screenshots, assert one page and decode the QR.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const NM = "/home/user/pintar40/node_modules/";
const { createClient } = require(NM + "@supabase/supabase-js");
const { createServerClient } = require(NM + "@supabase/ssr");
const { chromium } = require("/opt/node-tools/node_modules/playwright");

const env = Object.fromEntries(fs.readFileSync("/tmp/claude-0/app.env", "utf8").split("\n")
  .filter((l) => /^[A-Z_]+=/.test(l)).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, "")]; }));
const OUT = process.argv[2];
const BASE = "http://localhost:3467";
const EMAIL = "peraga-siswa@evaluasi.pintar.test";
const TUGAS = "0bec880d-0c32-49e1-873d-057291e4be4e";

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const { data: link, error } = await admin.auth.admin.generateLink({ type: "magiclink", email: EMAIL });
  if (error) throw error;
  const jar = new Map();
  const ssr = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: { getAll: () => [...jar].map(([name, value]) => ({ name, value })), setAll: (cs) => cs.forEach((c) => jar.set(c.name, c.value)) },
  });
  const { error: e2 } = await ssr.auth.verifyOtp({ type: "magiclink", token_hash: link.properties.hashed_token });
  if (e2) throw e2;
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.addCookies([...jar].map(([name, value]) => ({ name, value, domain: "localhost", path: "/" })));
  const page = await ctx.newPage();
  const url = `${BASE}/belajar/${TUGAS}/sertifikat`;
  let resp = await page.goto(url, { waitUntil: "networkidle", timeout: 180000 });
  console.log("landed", page.url(), resp && resp.status());
  if (!page.url().includes("/sertifikat")) {
    fs.writeFileSync(path.join(OUT, "landed.html"), await page.content());
    throw new Error("did not reach the certificate page: " + page.url());
  }
  await page.waitForSelector(".pin-sheet", { timeout: 60000 });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(OUT, "layar-1280.png"), fullPage: true });
  await page.locator(".pin-printwell").screenshot({ path: path.join(OUT, "lembar-layar-1280.png") });

  // print: what «Simpan sebagai PDF» makes (A4, backgrounds on), and a print-emulated A4 screenshot
  await page.emulateMedia({ media: "print" });
  const judulCetak = await page.evaluate(() => { window.dispatchEvent(new Event("beforeprint")); const t = document.title; window.dispatchEvent(new Event("afterprint")); return [t, document.title]; });
  console.log("title while printing / after", JSON.stringify(judulCetak));
  await page.pdf({ path: path.join(OUT, "sertifikat-A4.pdf"), format: "A4", printBackground: true, preferCSSPageSize: true });
  await page.pdf({ path: path.join(OUT, "sertifikat-A4-tanpa-latar.pdf"), format: "A4", printBackground: false, preferCSSPageSize: true });
  await page.setViewportSize({ width: 794, height: 1123 });
  await page.screenshot({ path: path.join(OUT, "cetak-A4.png") });
  const ukur = await page.evaluate(() => {
    const s = document.querySelector(".pin-sheet").getBoundingClientRect();
    const px = 96 / 25.4;
    const kotak = (sel) => { const r = document.querySelector(sel).getBoundingClientRect(); return { kiri: +((r.left - s.left) / px).toFixed(2), atas: +((r.top - s.top) / px).toFixed(2), lebar: +(r.width / px).toFixed(2), tinggi: +(r.height / px).toFixed(2) }; };
    const visible = [...document.body.querySelectorAll("*")].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && !e.closest(".pin-printwell") && !e.contains(document.querySelector(".pin-printwell")); }).map((e) => e.tagName + "." + e.className).slice(0, 10);
    return {
      lembar: { lebar: +(s.width / px).toFixed(2), tinggi: +(s.height / px).toFixed(2) },
      kepala: kotak(".pin-s-kepala"), jenis: kotak(".pin-s-jenis"), merek: kotak(".pin-s-merek"), merekImg: kotak(".pin-s-merek img"),
      nama: kotak(".pin-name"), rekam: kotak(".pin-s-rekam"), nomor: kotak(".pin-s-nomor"), garis: kotak(".pin-s-garis"), pita: kotak(".pin-s-pita"),
      periksa: kotak(".pin-s-periksa"), tautan: kotak(".pin-s-tautan"), qr: kotak(".pin-s-qr"),
      nomorBaris: Math.round(document.querySelector(".pin-s-nomor").getBoundingClientRect().height / parseFloat(getComputedStyle(document.querySelector(".pin-s-nomor")).lineHeight)),
      fonts: [...new Set([...document.querySelectorAll(".pin-sheet *")].map((e) => getComputedStyle(e).fontFamily.split(",")[0]))],
      fontsLoaded: [...document.fonts].filter((f) => f.status === "loaded").map((f) => f.family + " " + f.weight),
      tampakDiLuarLembar: visible,
      title: document.title,
    };
  });
  fs.writeFileSync(path.join(OUT, "ukuran-cetak.json"), JSON.stringify(ukur, null, 2));
  console.log(JSON.stringify(ukur));

  // the QR, decoded from the page's own SVG and from the print screenshot
  const svg = await page.locator(".pin-s-qr svg").evaluate((e) => e.outerHTML);
  fs.writeFileSync(path.join(OUT, "qr.svg"), svg);
  const href = await page.locator(".pin-s-tautan").innerText();
  console.log("printed link", href);

  // screen at 320
  await page.emulateMedia({ media: "screen" });
  await page.setViewportSize({ width: 320, height: 800 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT, "layar-320.png"), fullPage: true });
  const lebarDok = await page.evaluate(() => document.documentElement.scrollWidth);
  console.log("320 scrollWidth", lebarDok);
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
