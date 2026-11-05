// B6K evidence (W3.20 / DAISY-24): the PINTAR Digital Card on «Akun saya», screenshotted and measured.
// Run from the worktree root with the app env loaded and a dev server on APP_URL:
//   APP_URL=http://127.0.0.1:3716 node docs/completion-4.0/batch-6/evidence/B6K/bukti-kartu.mjs
// Signs in as the synthetic alpha teacher (audit/b5-ujung.mjs ORANG.guru). The several-roles cases have no person in
// the local seed (every synthetic staff person holds one role), so they are the card component rendered from invented
// data (no real person) and placed on the same signed-in page, with the app's own CSS.
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const require = createRequire(join(root, "package.json"));
const { chromium } = require("playwright");
const { createServerClient } = require("@supabase/ssr");

const APP = process.env.APP_URL ?? "http://127.0.0.1:3716";
const SB = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const OUT = join(root, "docs/completion-4.0/batch-6/evidence/B6K");
mkdirSync(OUT, { recursive: true });
const GURU = { email: "alpha-guru@synthetic.pintar.test", password: "Sintetis-AlphaGuru-52!" };

async function cookies(p) {
  const jar = new Map();
  const client = createServerClient(SB, ANON, {
    cookies: { getAll: () => [...jar].map(([name, value]) => ({ name, value })), setAll: (cs) => cs.forEach(({ name, value }) => jar.set(name, value)) },
  });
  const { data, error } = await client.auth.signInWithPassword({ email: p.email, password: p.password });
  if (error || !data.session) throw new Error(`sign-in failed: ${error?.message ?? "no session"}`);
  const host = new URL(APP).hostname;
  return [...jar].map(([name, value]) => ({ name, value, domain: host, path: "/", httpOnly: false, secure: false, sameSite: "Lax" }));
}

// the several-roles cases, invented (no real person, no real school)
const CONTOH = [
  { nama: "dua-sekolah", kartu: { nama: "Ratna Dewi Kusumawardani", pintarId: "A14CD7ST", tautanId: `${APP}/id/A14CD7ST`,
    konteks: [{ peran: "HEAD_OF_DEPARTMENT", institusi: "SMA Bukit Asri Kaliandra" }, { peran: "EDUCATOR", institusi: "SMP Cahaya Kaliandra" }] } },
  { nama: "satu-sekolah-dua-peran", kartu: { nama: "Muhammad Rizky Aditya Pratama", pintarId: "D0W3Z27E", tautanId: `${APP}/id/D0W3Z27E`,
    konteks: [{ peran: "EDUCATOR", institusi: "Sekolah Cendekia Kaliandra" }, { peran: "DEAN", institusi: "Sekolah Cendekia Kaliandra" }] } },
  { nama: "tiga-pasangan", kartu: { nama: "Ni Luh Putu Ayu Kartika Maharani Suryaningsih", pintarId: "Q8ZB2D0S", tautanId: `${APP}/id/Q8ZB2D0S`,
    konteks: [{ peran: "EDUCATOR", institusi: "SMP Cahaya Kaliandra" }, { peran: "INSTITUTION_ADMIN", institusi: "Sekolah Menengah Kejuruan Teknologi dan Rekayasa Nusa Kaliandra Timur" }, { peran: "SYSTEM_ADMIN", institusi: null }] } },
];
const anak = spawnSync(process.execPath, ["--import", "tsx", "-e",
  "(async () => {" +
  '  const { createElement: h } = await import("react");' +
  '  const { renderToStaticMarkup } = await import("react-dom/server");' +
  '  const m = await import("file://" + process.cwd() + "/src/components/kartu/KartuPintar.tsx");' +
  "  const K = m.default?.default ?? m.default;" +
  '  const { readFileSync } = await import("node:fs");' +
  '  const cs = JSON.parse(readFileSync(0, "utf8"));' +
  '  process.stdout.write(JSON.stringify(cs.map((c) => renderToStaticMarkup(h(K, { locale: "id", kartu: c.kartu })))));' +
  "})().catch((e) => { process.stderr.write(String(e && e.stack || e)); process.exit(1); });"],
  { cwd: root, encoding: "utf8", input: JSON.stringify(CONTOH) });
if (anak.status !== 0) throw new Error(anak.stderr);
const markah = JSON.parse(anak.stdout);

const laporan = {};
const browser = await chromium.launch();
try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: "id-ID", timezoneId: "Asia/Jakarta" });
  await context.addCookies(await cookies(GURU));
  const page = await context.newPage();
  await page.goto(`${APP}/`, { waitUntil: "networkidle" });
  if (new URL(page.url()).pathname === "/perangkat") {
    await page.locator('input[type="radio"][name="mode"][value="PERSONAL"]').check();
    await page.getByRole("button", { name: "Simpan pilihan" }).click();
    await page.waitForURL((u) => u.pathname !== "/perangkat", { timeout: 60000 }).catch(() => {});
  }
  const buka = async () => {
    await page.goto(`${APP}/akun`, { waitUntil: "networkidle" });
    const lewati = page.getByRole("button", { name: /Lewati|Tutup tur|Selesai/ }).first();
    if (await lewati.isVisible().catch(() => false)) await lewati.click().catch(() => {});
    await page.locator(".pin-kd").waitFor({ timeout: 60000 }).catch(async (e) => { console.error(page.url(), (await page.locator("main").innerText().catch(() => "")).slice(0, 600)); throw e; });
    await page.evaluate(() => document.fonts.ready);
  };
  // geometry, measured in the browser against the face's own width (1 mm = width / 85.6)
  const ukur = () => page.evaluate(() => {
    const r = (el) => el.getBoundingClientRect();
    const [d, b] = [...document.querySelectorAll(".pin-kd-muka")];
    const mm = r(d).width / 85.6;
    const rel = (el, muka) => { const x = r(el), m = r(muka); return { kiri: (x.left - m.left) / mm, atas: (x.top - m.top) / mm, lebar: x.width / mm, tinggi: x.height / mm }; };
    const gd = rel(d.querySelector(".pin-kd-garis"), d), gb = rel(b.querySelector(".pin-kd-garis"), b);
    const merek = rel(d.querySelector(".pin-kd-merek img"), d);
    const ubin = rel(b.querySelector(".pin-kd-ubin"), b);
    const cs = (el, p) => getComputedStyle(el).getPropertyValue(p);
    return {
      mukaPx: { lebar: r(d).width, tinggi: r(d).height }, rasio: r(d).width / r(d).height, rasioCR80: 85.6 / 53.98,
      garisDepanTengahMm: gd.atas + gd.tinggi / 2, garisBelakangTengahMm: gb.atas + gb.tinggi / 2, garisTebalMm: gd.tinggi,
      merekMm: merek, ubinMm: ubin,
      namaKiriMm: rel(d.querySelector(".pin-kd-nama"), d).kiri,
      warnaBidang: cs(d.querySelector(".pin-kd-bidang"), "background-color"), warnaGaris: cs(d.querySelector(".pin-kd-garis"), "background-color"),
      warnaUbin: cs(b.querySelector(".pin-kd-ubin"), "background-color"), warnaModul: cs(b.querySelector(".pin-kd-ubin path"), "fill"),
      gambar: [...document.querySelectorAll(".pin-kd img")].map((i) => i.getAttribute("src")),
      lebarGulir: document.scrollingElement.scrollWidth, lebarJendela: window.innerWidth,
    };
  });

  await buka();
  await page.locator(".pin-kd").screenshot({ path: join(OUT, "akun-1280-kartu.png") });
  await page.locator(".pin-kd-wadah").nth(0).screenshot({ path: join(OUT, "akun-1280-depan.png") });
  await page.locator(".pin-kd-wadah").nth(1).screenshot({ path: join(OUT, "akun-1280-belakang.png") });
  await page.screenshot({ path: join(OUT, "akun-1280-halaman.png"), fullPage: true });
  laporan.layar1280 = await ukur();

  await page.setViewportSize({ width: 320, height: 800 });
  await buka();
  await page.locator(".pin-kd-wadah").nth(0).screenshot({ path: join(OUT, "akun-320-depan.png") });
  await page.locator(".pin-kd-wadah").nth(1).screenshot({ path: join(OUT, "akun-320-belakang.png") });
  await page.screenshot({ path: join(OUT, "akun-320-halaman.png"), fullPage: true });
  laporan.layar320 = await ukur();

  await page.setViewportSize({ width: 1280, height: 900 });
  await buka();
  await page.emulateMedia({ media: "print" });
  await page.locator(".pin-kd").screenshot({ path: join(OUT, "akun-cetak-kartu.png") });
  laporan.cetak = await ukur();
  laporan.cetak.mukaMm = { lebar: laporan.cetak.mukaPx.lebar * 25.4 / 96, tinggi: laporan.cetak.mukaPx.tinggi * 25.4 / 96 };
  await page.pdf({ path: join(OUT, "akun-cetak.pdf"), format: "A4", printBackground: true });
  await page.emulateMedia({ media: "screen" });

  // the several-roles cases, on the same signed-in page with the app's CSS
  laporan.contoh = {};
  for (const [i, c] of CONTOH.entries()) {
    await page.evaluate((html) => { document.querySelector(".pin-kd").outerHTML = html; }, markah[i]);
    await page.evaluate(() => document.fonts.ready);
    await page.locator(".pin-kd").screenshot({ path: join(OUT, `contoh-${c.nama}.png`) });
    laporan.contoh[c.nama] = {
      baris: await page.locator(".pin-kd-bab-baris").allInnerTexts(),
      keluarga: await page.locator(".pin-kd-depan").getAttribute("data-keluarga"),
      pengecualian: await page.locator(".pin-kd").getAttribute("data-pengecualian"),
      warnaBidang: await page.locator(".pin-kd-bidang").evaluate((e) => getComputedStyle(e).backgroundColor),
    };
  }
} finally {
  await browser.close();
}
writeFileSync(join(OUT, "ukuran.json"), JSON.stringify(laporan, null, 2) + "\n");
console.log(JSON.stringify(laporan, null, 2));
