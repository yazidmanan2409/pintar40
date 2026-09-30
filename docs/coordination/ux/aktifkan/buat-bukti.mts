/**
 * DAISY-20: THE 320 px AND ACCESSIBILITY PROOF. Review tooling, not product code.
 *
 *   npx tsx docs/coordination/ux/aktifkan/buat-bukti.mts
 *
 * Bundles the real DAISY-20 components (klien.tsx) with the real compiled
 * stylesheet, serves them over http with the fonts and the mark (as Next serves
 * public/), and drives each screen in the pre-installed Chromium the way a
 * person does: types, presses, waits for the answer. `fetch` answers as
 * BOB-26's published contract says the routes will; nothing is invented about
 * the server beyond that.
 *
 * At 320 × 640 and 1280 × 900, in both languages, every state is checked for:
 *   - no horizontal scroll (the page is no wider than the screen);
 *   - every control that is not a link inside a sentence at least 44 px tall;
 *   - axe-core's WCAG 2.0/2.1/2.2 A and AA rules (colour contrast included);
 *   - focus: after a screen changes, focus is on its heading.
 * The Indonesian screens at 320 px (and two at 1280 px) are written to render/,
 * with render/laporan.txt. Exit non-zero on any failure.
 *
 * Every name, address, code and ID is invented.
 */
import { build } from "esbuild";
import postcss from "postcss";
import tailwind from "@tailwindcss/postcss";
import { createServer } from "node:http";
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync, cpSync, rmSync } from "node:fs";
import { join, extname, resolve } from "node:path";
import { execSync } from "node:child_process";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { t, format, type Locale, type HleEvent } from "../../../../src/lib/hle.js";

const ROOT = resolve(".");
const DIR = join(ROOT, "docs", "coordination", "ux", "aktifkan");
const RENDER = join(DIR, "render");
const KERJA = join(tmpdir(), "daisy20-bukti");
rmSync(KERJA, { recursive: true, force: true });
mkdirSync(KERJA, { recursive: true });
mkdirSync(RENDER, { recursive: true });

// Playwright is review-only and not a dependency: the global install, with the pre-installed Chromium
const { chromium } = createRequire(import.meta.url)(join(execSync("npm root -g").toString().trim(), "playwright"));

// ─────────────────────────────────────────────── 1. the stylesheet and the bundle
const css = await postcss([tailwind()]).process(readFileSync("src/app/globals.css", "utf8"), { from: "src/app/globals.css", to: undefined });
writeFileSync(join(KERJA, "pintar.css"), css.css);
for (const aset of ["fonts", "brand"]) if (existsSync(join("public", aset))) cpSync(join("public", aset), join(KERJA, aset), { recursive: true });
const TIRUAN: Record<string, string> = { "next/navigation": "tiruan-navigasi.ts", "@/app/masuk/actions": "tiruan-aksi-masuk.ts" };
await build({
  entryPoints: [join(DIR, "klien.tsx")],
  bundle: true, format: "iife", platform: "browser", target: "es2022", jsx: "automatic", minify: true,
  outfile: join(KERJA, "klien.js"), tsconfig: "tsconfig.json", logLevel: "error",
  define: { "process.env.NODE_ENV": '"production"', "process.env.NEXT_PUBLIC_APP_URL": '"https://app.contoh.sch.id"' },
  banner: { js: "var process = { env: {} };" },
  plugins: [{
    name: "tiruan",
    setup(b) { b.onResolve({ filter: /^(next\/navigation|@\/app\/masuk\/actions)$/ }, (a) => ({ path: join(DIR, TIRUAN[a.path]) })); },
  }],
});
const AXE = readFileSync("node_modules/axe-core/axe.min.js", "utf8");

// ────────────────────────────────────────────────── 2. BOB-26's answers (§2–§4)
const ATURAN = { panjangMin: 8, karakterWajib: [], cekBocor: true, panjangMaks: 72 };
const keadaan = (berikutnya: string, staf = true) => [200, {
  ok: true, keadaan: "REQUIRED", berikutnya,
  langkah: { username: berikutnya === "USERNAME" ? null : "nadia.putri", password: !["USERNAME", "PASSWORD"].includes(berikutnya), pin: ["NAMA", "SELESAI"].includes(berikutnya), nama: { nama: "Nadia Putri Maharani", dikonfirmasi: berikutnya === "SELESAI" } },
  staf, pintarId: staf ? "A14CD7ST" : null, aturanPassword: ATURAN, berlakuMenit: 10,
}] as [number, unknown];
const KARTU = [200, {
  ok: true, nama: "Nadia Putri Maharani", pintarId: "A14CD7ST", tautanId: "https://app.contoh.sch.id/id/A14CD7ST",
  konteks: [{ peran: "EDUCATOR", institusi: "SMA Negeri 1 Contoh" }, { peran: "INSTITUTION_ADMIN", institusi: "SMA Negeri 1 Contoh" }],
}] as [number, unknown];
const NAMA = Array.from({ length: 600 }, (_, i) => ({ baris: i + 1, nama: ["Aditya Pratama", "Siti Nurhaliza Rahmawati", "Muhammad Rizky Ramadhan Saputra", "Ni Luh Putu Ayu Kartika Dewi"][i % 4] + ` ${i + 1}`, peran: i % 25 === 0 ? "EDUCATOR" : "STUDENT", baru: i % 9 !== 0 }));

type Langkah = { isi?: [string, string]; tekan?: string; tekanKata?: HleEvent; tunggu?: string; fokusJudul?: boolean };
type Skenario = { nama: string; layar: string; jawab: Record<string, Array<[number, unknown]>>; langkah?: Langkah[]; periksa?: (s: (k: HleEvent) => string, locale: Locale) => string[] };
const S = (k: HleEvent, locale: Locale) => t(k, "public", { locale });

const SKENARIO: Skenario[] = [
  { nama: "01-email", layar: "tamu", jawab: {} },
  { nama: "02-kode", layar: "tamu", jawab: { "/aktifkan/kode": [[200, { ok: true, kirimUlangDalam: 60, berlakuMenit: 10 }]] },
    langkah: [{ isi: ["#email", "nadia.putri@sman1contoh.sch.id"] }, { tekan: "button[type=submit]", tunggu: "#kode", fokusJudul: true }],
    periksa: (s, locale) => [`${s("aktifkan.berlaku")} ${format.durasi(600, locale)}${s("aktifkan.berlaku_lalu")}`, s("aktifkan.kirim_ulang_dalam")] },
  { nama: "03-kode-tidak-cocok", layar: "tamu", jawab: { "/aktifkan/kode": [[200, { ok: true, kirimUlangDalam: 60, berlakuMenit: 10 }]], "/aktifkan/verifikasi": [[400, { ok: false, code: "KODE_TIDAK_COCOK" }]] },
    langkah: [{ isi: ["#email", "nadia.putri@sman1contoh.sch.id"] }, { tekan: "button[type=submit]", tunggu: "#kode" }, { isi: ["#kode", "482 913"] }, { tekan: "button[type=submit]", tunggu: "#kode-err" }],
    periksa: (s) => [s("aktifkan.kode_salah")] },
  { nama: "04-username", layar: "wizard", jawab: { "/api/aktifkan/keadaan": [keadaan("USERNAME")] }, langkah: [{ tunggu: "#username" }],
    periksa: (s, locale) => [`${s("aktifkan.langkah")} ${format.number(1, locale)} ${s("aktifkan.dari")} ${format.number(4, locale)}`] },
  { nama: "05-username-ditolak", layar: "wizard", jawab: { "/api/aktifkan/keadaan": [keadaan("USERNAME")], "/api/aktifkan/username": [[422, { ok: false, code: "USERNAME_RESERVED" }]] },
    langkah: [{ tunggu: "#username" }, { isi: ["#username", "admin"] }, { tekan: "button[type=submit]", tunggu: "#username-err" }],
    periksa: (s) => [s("aktifkan.kode.USERNAME_RESERVED")] },
  { nama: "06-password", layar: "wizard", jawab: { "/api/aktifkan/keadaan": [keadaan("PASSWORD")] }, langkah: [{ tunggu: "#password" }],
    periksa: (s, locale) => [`${s("aktifkan.p_min")} ${format.number(8, locale)} ${s("aktifkan.p_min_lalu")}`, s("aktifkan.p_bocor")] },
  { nama: "07-pin-ditolak", layar: "wizard", jawab: { "/api/aktifkan/keadaan": [keadaan("PIN")], "/api/aktifkan/pin": [[422, { ok: false, code: "PIN_SEQUENCE" }]] },
    langkah: [{ tunggu: "#pin" }, { isi: ["#pin", "1234"] }, { isi: ["#pin-ulang", "1234"] }, { tekan: "button[type=submit]", tunggu: "#pin-err" }],
    periksa: (s) => [s("aktifkan.kode.PIN_SEQUENCE")] },
  { nama: "08-nama", layar: "wizard", jawab: { "/api/aktifkan/keadaan": [keadaan("NAMA")] }, langkah: [{ tunggu: ".pin-akt-nama" }],
    periksa: (s) => ["Nadia Putri Maharani", s("aktifkan.m_benar"), s("aktifkan.m_ubah"), s("aktifkan.m_sekali")] },
  { nama: "09-nama-ubah", layar: "wizard", jawab: { "/api/aktifkan/keadaan": [keadaan("NAMA")] },
    langkah: [{ tunggu: ".pin-akt-nama" }, { tekan: "button.pin-mbtn-2", tunggu: "#nama", fokusJudul: true }], periksa: (s) => [s("aktifkan.m_label"), s("aktifkan.m_batal")] },
  { nama: "10-selamat", layar: "wizard", jawab: { "/api/aktifkan/keadaan": [keadaan("SELESAI")], "/api/aktifkan/selesai": [[200, { ok: true, tujuan: "/mengajar", kartu: "TERKIRIM" }]], "/api/akun/kartu": [KARTU] },
    langkah: [{ tunggu: ".pin-akt-selamat", fokusJudul: true }], periksa: (s) => ["A14C D7ST", s("aktifkan.w_kartu_terkirim"), s("aktifkan.w_masuk")] },
  { nama: "11-selamat-murid", layar: "wizard", jawab: { "/api/aktifkan/keadaan": [keadaan("SELESAI", false)], "/api/aktifkan/selesai": [[200, { ok: true, tujuan: "/belajar", kartu: "TIDAK_ADA" }]] },
    langkah: [{ tunggu: ".pin-akt-selamat" }], periksa: (s) => [s("aktifkan.w_siap")] },
  { nama: "12-masuk-password", layar: "masuk", jawab: { "/masuk/password": [[401, { ok: false, code: "MASUK_TIDAK_COCOK" }]] },
    langkah: [{ tunggu: "#identitas" }, { isi: ["#identitas", "nadia.putri"] }, { isi: ["#password", "salah-sekali"] }, { tekan: "form button[type=submit]", tunggu: "#pw-err" }],
    periksa: (s) => [s("auth.pw_gagal"), s("auth.pw_lupa"), s("auth.aktifkan_go")] },
  { nama: "12b-masuk-kartu", layar: "masuk", jawab: {},
    // the card surface sends focus to its first field on purpose (UX1-MASUK-AKSES-01): a card is typed at once
    langkah: [{ tunggu: "#identitas" }, { tekanKata: "auth.card_go", tunggu: "input[name=pin]" }],
    periksa: (s) => [s("auth.card_h1"), s("auth.card_back")] },
  { nama: "13-akun-saya", layar: "akun", jawab: { "/api/akun/kartu": [KARTU], "/api/akun/kartu/kirim": [[200, { ok: true, kartu: "BELUM_TERKIRIM", tunggu: 300 }]] },
    langkah: [{ tunggu: ".pin-idn" }, { tekan: "section.pin-sec button.pin-btn", tunggu: ".pin-hasil-gagal" }],
    periksa: (_s, locale) => ["A14C D7ST", `${t("akun.coba_dalam", "staff", { locale })} ${format.durasi(300, locale)}.`, t("sesi.akun", "staff", { locale })] },
  { nama: "14-orang-baru-periksa", layar: "aktivasi", jawab: {},
    langkah: [{ isi: [".pin-akt-baru input:not([type=email])", "Rahmat Hidayat Nugroho"] }, { isi: [".pin-akt-baru input[type=email]", "rahmat@sman1contoh.sch.id"] }, { tekan: ".pin-akt-baru button.pin-primary", tunggu: ".pin-akt-periksa" }],
    periksa: (_s, locale) => ["Rahmat Hidayat Nugroho", t("aktivasi.baru.benar", "staff", { locale }), t("aktivasi.baru.ubah", "staff", { locale })] },
  { nama: "15-pendataan-nama", layar: "pendataan", jawab: {}, langkah: [{ tunggu: ".pin-data-nama" }],
    periksa: (_s, locale) => ["Muhammad Rizky Ramadhan Saputra 3", t("pendataan.nama.sudah", "staff", { locale })] },
];

// ─────────────────────────────────────────────────────────── 3. serve and drive
const TYPES: Record<string, string> = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".png": "image/png", ".woff2": "font/woff2", ".svg": "image/svg+xml" };
const server = createServer((req, res) => {
  const p = join(KERJA, decodeURIComponent(new URL(req.url ?? "/", "http://x").pathname));
  if (!p.startsWith(KERJA) || !existsSync(p) || statSync(p).isDirectory()) { res.writeHead(404).end(); return; }
  res.writeHead(200, { "content-type": TYPES[extname(p)] ?? "application/octet-stream" }).end(readFileSync(p));
});
await new Promise<void>((ok) => server.listen(0, "127.0.0.1", ok));
const BASE = `http://127.0.0.1:${(server.address() as { port: number }).port}`;

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--force-color-profile=srgb"] });
const LEBAR: Array<[number, number]> = [[320, 640], [1280, 900]];
const laporan: string[] = [];
const catatan = new Set<string>();
let gagal = 0;
const hilang = new Set<string>();

for (const sk of SKENARIO) {
  for (const locale of ["id", "en"] as Locale[]) {
    const berkas = `${sk.nama}-${locale}.html`;
    writeFileSync(join(KERJA, berkas), `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${sk.nama}</title><link rel="stylesheet" href="/pintar.css"></head><body><div id="akar"></div><script>window.__KASUS=${JSON.stringify({ layar: sk.layar, locale, jawab: sk.jawab, nama: sk.layar === "pendataan" ? NAMA : undefined })}</script><script src="/klien.js"></script></body></html>`);
    for (const [w, h] of LEBAR) {
      const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
      page.on("requestfailed", (r: { url(): string }) => hilang.add(new URL(r.url()).pathname));
      page.on("response", (r: { status(): number; url(): string }) => { if (r.status() >= 400) hilang.add(new URL(r.url()).pathname); });
      const galatHalaman: string[] = [];
      page.on("pageerror", (e: Error) => galatHalaman.push(e.message));
      await page.goto(`${BASE}/${berkas}`);
      await page.evaluate(() => document.fonts.ready);
      const masalah: string[] = [];
      try {
        await page.waitForSelector("#akar > *", { timeout: 5000 });
        for (const l of sk.langkah ?? []) {
          if (l.isi) await page.fill(l.isi[0], l.isi[1]);
          if (l.tekan) await page.click(l.tekan);
          if (l.tekanKata) await page.getByRole("button", { name: S(l.tekanKata, locale), exact: true }).click();
          if (l.tunggu) await page.waitForSelector(l.tunggu, { timeout: 5000 });
          if (l.fokusJudul) {
            await page.waitForTimeout(50);
            const fokus = await page.evaluate(() => document.activeElement?.tagName ?? "");
            if (!/^H[1-3]$/.test(fokus)) masalah.push(`focus is on ${fokus || "nothing"}, not the new screen's heading`);
          }
        }
        await page.waitForTimeout(80);
      } catch (e) {
        masalah.push(`could not reach the state: ${(e as Error).message.split("\n")[0]}`);
      }
      masalah.push(...galatHalaman.map((m) => `script error: ${m}`));

      // what the state must say
      // innerText is as drawn, so a line set in capitals by CSS is compared without case
      const teks = await page.evaluate(() => document.body.innerText.replace(/\s+/g, " ").toLowerCase());
      for (const x of sk.periksa?.((k) => S(k, locale), locale) ?? []) if (!teks.includes(x.replace(/\s+/g, " ").toLowerCase())) masalah.push(`does not say «${x}»`);
      // the code as typed is sent as digits (3), and a confirmation sends what it showed
      if (sk.nama === "03-kode-tidak-cocok") {
        const kirim = await page.evaluate(() => window.__PERMINTAAN.filter((p) => p.jalur === "/aktifkan/verifikasi").map((p) => p.isian.kode));
        if (kirim[0] !== "482913") masalah.push(`«482 913» was sent as ${JSON.stringify(kirim)}`);
      }
      if (sk.nama === "14-orang-baru-periksa") {
        const n = await page.evaluate(() => window.__PERMINTAAN.length);
        if (n !== 0) masalah.push(`«Buat dan aktifkan» sent ${n} request(s) before the check`);
      }

      // 1. no horizontal scroll
      const lebar = await page.evaluate(() => ({ doc: document.documentElement.scrollWidth, layar: window.innerWidth }));
      if (lebar.doc > lebar.layar) masalah.push(`the page is ${lebar.doc} px wide on a ${lebar.layar} px screen`);
      // 2. TARGETS. Every control at least 24 px (WCAG 2.5.8 AA; a link inside
      //    a sentence is exempt, as the criterion exempts it), and at least
      //    PINTAR's own 44 px -- except the shared admin button and field
      //    (.pin-btn, .pin-input, 40 px) and the language control (26 px),
      //    which predate DAISY-20 and are reported as notes, not changed here.
      const BERSAMA = ".pin-btn, .pin-input, .pin-lang button";
      const kecil = await page.evaluate((bersama: string) => {
        const out: Array<[string, number, boolean]> = [];
        for (const el of Array.from(document.querySelectorAll<HTMLElement>("button, a[href], input:not([type=hidden]), [role=region][tabindex]"))) {
          const r = el.getBoundingClientRect();
          if (!r.width || !r.height || getComputedStyle(el).visibility === "hidden") continue;
          if (el.tagName === "A" && el.closest("p, li") && !el.className) continue;
          const kotak = el.tagName === "INPUT" && el.closest(".pin-inp") ? el.closest(".pin-inp")!.getBoundingClientRect() : r;
          if (kotak.height < 43.5) out.push([`${el.tagName.toLowerCase()}${el.className ? "." + String(el.className).split(" ")[0] : ""} «${(el.innerText || el.getAttribute("aria-label") || (el as HTMLInputElement).name || "").trim().slice(0, 30)}» ${Math.round(kotak.height)} px`, kotak.height, el.matches(bersama)]);
        }
        return out;
      }, BERSAMA);
      for (const [apa, tinggi, bersama] of kecil) {
        if (tinggi < 23.5) masalah.push(`a control under WCAG 2.5.8's 24 px: ${apa}`);
        else if (!bersama) masalah.push(`a control under 44 px: ${apa}`);
        else catatan.add(`${sk.layar}: ${apa.replace(/«[^»]*»/, "").replace(/\s+/g, " ").trim()}`);
      }
      // 3. axe: WCAG 2.0/2.1/2.2 A and AA
      await page.addScriptTag({ content: AXE });
      const axe = await page.evaluate(async () => {
        // @ts-expect-error axe is injected above
        const r = await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] } });
        return r.violations.map((v: { id: string; nodes: Array<{ target: string[] }> }) => `${v.id} (${v.nodes.length}: ${v.nodes.slice(0, 2).map((n) => n.target.join(" ")).join(", ")})`);
      });
      masalah.push(...axe.map((v: string) => `axe: ${v}`));

      const tag = `${sk.nama} ${locale} ${w}px`;
      laporan.push(`${masalah.length ? "FAIL" : "ok  "}  ${tag}${masalah.length ? "\n        " + masalah.join("\n        ") : ""}`);
      gagal += masalah.length ? 1 : 0;
      if (locale === "id" && (w === 320 || ["02-kode", "10-selamat", "13-akun-saya"].includes(sk.nama))) {
        await page.screenshot({ path: join(RENDER, `${w}-${sk.nama}.png`), fullPage: true });
      }
      await page.close();
    }
  }
}
await browser.close();
server.close();
if (hilang.size) { laporan.push(`FAIL  assets that did not load: ${[...hilang].join(", ")}`); gagal++; }

const kepala = `DAISY-20 · 320 px and accessibility proof · ${SKENARIO.length} states × 2 languages × 2 widths = ${SKENARIO.length * 4} checks\n` +
  "(no horizontal scroll; every control ≥ 24 px and DAISY-20's ≥ 44 px; axe-core WCAG 2.0/2.1/2.2 A+AA; focus on the new screen's heading; each state says what it must)\n";
const catat = catatan.size ? `\nNOTES (shared controls that predate DAISY-20: above WCAG 2.5.8's 24 px, under PINTAR's 44 px; not changed here):\n  ${[...catatan].sort().join("\n  ")}\n` : "";
writeFileSync(join(RENDER, "laporan.txt"), kepala + "\n" + laporan.join("\n") + `\n${catat}\n${gagal ? `${gagal} check(s) FAILED` : "all checks passed"}\n`);
console.log(kepala + laporan.filter((l) => l.startsWith("FAIL")).join("\n") + catat);
console.log(gagal ? `\n${gagal} check(s) FAILED` : "\nall checks passed");
process.exit(gagal ? 1 : 0);
