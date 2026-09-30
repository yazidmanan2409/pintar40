/**
 * DAISY-19 WIRING: renders the frame the app now imports
 * (src/components/email/bingkai.ts, on BOB-25's src/lib/email/templat.ts) and
 * proves the move changed nothing it was not meant to. Run from the repository root:
 *
 *   KARTU_PY=/path/to/python npx tsx docs/coordination/ux/email-frame/buat-wiring.mts
 *
 * KARTU_PY is a Python with OpenCV (the card's requirements.txt); it is used for
 * the pixel comparison only.
 *
 * 1. The prototype's two samples, through the wired frame with a production
 *    context, at the prototype's own sizes and modes, compared pixel by pixel
 *    with the accepted prototype renders (render/). The only change expected is
 *    the logo: the small email logo (ruling 2) instead of the full-size one.
 * 2. The same samples with a staging context: the test line (ruling 3).
 * 3. Gate 2E's delivery test (UJI_PENGIRIMAN), staging and production: the
 *    email the M6 inboxes will receive.
 * 4. The prototype's 320 px checks, on every narrow render.
 *
 * The logo is served from public/ on a local origin, exactly as each
 * environment serves its own. These are Chromium renders, not Gmail or Outlook:
 * those come from the M6 inboxes after BOB-25's first staging send.
 */
import { writeFileSync, mkdirSync, readFileSync, existsSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { bingkaiEmail, type Email } from "../../../../src/components/email/bingkai.js";
import { templatUjiPengiriman } from "../../../../src/components/email/uji.js";
import type { KonteksEmail } from "../../../../src/lib/email/templat.js";

const DIR = "docs/coordination/ux/email-frame";
const KELUAR = join(DIR, "render-wiring");
const PROTO = join(DIR, "render");
mkdirSync(KELUAR, { recursive: true });
const PY = process.env.KARTU_PY ?? "python3";

// the prototype's samples, as they were (not final copy)
const CONTOH: Record<string, Email> = {
  "contoh-kode": {
    subjek: "Kode aktivasi akun PINTAR Anda",
    pratinjau: "Masukkan kode ini untuk melanjutkan aktivasi akun Anda.",
    judul: "Kode aktivasi akun PINTAR Anda",
    isi: [
      { jenis: "paragraf", teks: "Halo, Sari Wulandari." },
      { jenis: "paragraf", teks: "Masukkan kode berikut di halaman Aktifkan akun PINTAR untuk melanjutkan." },
      { jenis: "kode", label: "Kode aktivasi", kode: "482913" },
      { jenis: "paragraf", teks: "Kode ini berlaku 10 menit dan hanya bisa dipakai sekali." },
      { jenis: "catatan", nada: "perhatian", teks: "Tidak merasa meminta kode ini? Abaikan email ini. Akun Anda tidak berubah." },
    ],
    alasan: "Anda menerima email ini karena ada permintaan aktivasi akun PINTAR untuk alamat ini.",
  },
  "contoh-pemberitahuan": {
    subjek: "Password akun PINTAR Anda telah diubah",
    pratinjau: "Jika ini bukan Anda, buat password baru sekarang.",
    judul: "Password akun PINTAR Anda telah diubah",
    isi: [
      { jenis: "paragraf", teks: "Password untuk akun PINTAR Anda baru saja diubah. Perangkat lain yang masih masuk dengan akun ini sudah dikeluarkan." },
      { jenis: "rincian", baris: [["Waktu", "Senin, 29 September 2026, pukul 09.14 WIB"], ["Cara", "Lupa password, lewat email"]] },
      { jenis: "paragraf", teks: "Jika ini Anda, tidak ada yang perlu dilakukan." },
      { jenis: "catatan", nada: "perhatian", teks: "Bukan Anda? Segera buat password baru melalui “Lupa password?” di halaman masuk, lalu kabari kami di info@pintarselalu.com." },
      { jenis: "tombol", teks: "Masuk ke PINTAR", href: "https://app.pintarselalu.com/masuk", cadangan: true },
    ],
    alasan: "Anda menerima email ini karena ada perubahan keamanan pada akun PINTAR Anda.",
  },
};

// each environment serves its own logo: here, public/ on a local origin
const JENIS: Record<string, string> = { ".png": "image/png" };
const server = createServer((req, res) => {
  const p = join(process.cwd(), "public", decodeURIComponent(new URL(req.url!, "http://x").pathname));
  if (!p.startsWith(join(process.cwd(), "public")) || !existsSync(p) || statSync(p).isDirectory()) { res.writeHead(404).end(); return; }
  res.writeHead(200, { "content-type": JENIS[extname(p)] ?? "application/octet-stream" }).end(readFileSync(p));
});
await new Promise<void>((ok) => server.listen(0, "127.0.0.1", ok));
const asal = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
const PRODUKSI: KonteksEmail = { asal, staging: false };
const STAGING: KonteksEmail = { asal, staging: true };

type Varian = { nama: string; lebar: number; gelap?: boolean; tanpaStyle?: boolean; tanpaGambar?: boolean };
const SEPERTI_PROTOTIPE: Record<string, Varian[]> = {
  "contoh-kode": [
    { nama: "600-terang", lebar: 600 }, { nama: "320-terang", lebar: 320 },
    { nama: "600-gelap", lebar: 600, gelap: true }, { nama: "320-gelap", lebar: 320, gelap: true },
    { nama: "320-tanpa-style", lebar: 320, tanpaStyle: true }, { nama: "600-tanpa-gambar", lebar: 600, tanpaGambar: true },
  ],
  "contoh-pemberitahuan": [
    { nama: "600-terang", lebar: 600 }, { nama: "320-terang", lebar: 320 }, { nama: "320-gelap", lebar: 320, gelap: true },
  ],
};
type Kerja = { berkas: string; html: string; v: Varian; banding?: string };
const kerja: Kerja[] = [];
for (const [nama, varian] of Object.entries(SEPERTI_PROTOTIPE)) {
  const e = bingkaiEmail(CONTOH[nama], PRODUKSI);
  for (const v of varian) kerja.push({ berkas: `${nama}-${v.nama}.png`, html: e.html, v, banding: join(PROTO, `${nama}-${v.nama}.png`) });
  const s = bingkaiEmail(CONTOH[nama], STAGING);
  for (const v of [{ nama: "staging-600-terang", lebar: 600 }, { nama: "staging-320-gelap", lebar: 320, gelap: true }]) kerja.push({ berkas: `${nama}-${v.nama}.png`, html: s.html, v });
  writeFileSync(join(KELUAR, `${nama}-staging.txt`), s.teks);
}
for (const [k, n] of [[STAGING, "staging"], [PRODUKSI, "produksi"]] as const) {
  const e = templatUjiPengiriman({ waktu: "2026-09-30 03:12 UTC" }, k);
  for (const v of [{ nama: "600-terang", lebar: 600 }, { nama: "320-terang", lebar: 320 }, { nama: "320-gelap", lebar: 320, gelap: true }]) kerja.push({ berkas: `uji-pengiriman-${n}-${v.nama}.png`, html: e.html, v });
  writeFileSync(join(KELUAR, `uji-pengiriman-${n}.html`), e.html.replaceAll(asal, "https://app.pintarselalu.com"));
  writeFileSync(join(KELUAR, `uji-pengiriman-${n}.txt`), e.teks);
}

const laporan: string[] = [];
let gagal = 0;
const require_ = createRequire("/opt/node22/lib/node_modules/");
const { chromium } = require_("playwright");
const b = await chromium.launch();
for (const k of kerja) {
  let html = k.html;
  if (k.v.tanpaStyle) html = html.replace(/<style>[\s\S]*?<\/style>/g, "");
  const ctx = await b.newContext({ viewport: { width: k.v.lebar, height: 800 }, colorScheme: k.v.gelap ? "dark" : "light", deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  if (k.v.tanpaGambar) await p.route("**/*.png", (r: { abort: () => Promise<void> }) => r.abort());
  await p.setContent(html, { waitUntil: "load" });
  await p.screenshot({ path: join(KELUAR, k.berkas), fullPage: true });
  if (k.v.lebar === 320) {
    const cek = await p.evaluate(() => {
      const lebarDok = document.documentElement.scrollWidth;
      let kecil = 99;
      for (const el of Array.from(document.querySelectorAll("p, td, a, h1, span"))) {
        const ada = Array.from(el.childNodes).some((n) => n.nodeType === 3 && (n.textContent ?? "").trim());
        if (ada) kecil = Math.min(kecil, parseFloat(getComputedStyle(el).fontSize));
      }
      const tombol = document.querySelector(".pin-tombol-a") as HTMLElement | null;
      const kartu = document.querySelector(".pin-kartu") as HTMLElement;
      return { lebarDok, kecil, tinggiTombol: tombol ? tombol.getBoundingClientRect().height : null, padKartu: getComputedStyle(kartu).paddingLeft, adaStyle: document.querySelectorAll("style").length };
    });
    const ok = cek.lebarDok <= 320 && cek.kecil >= 13 && (cek.tinggiTombol === null || cek.tinggiTombol >= 44);
    const okGaya = k.v.tanpaStyle ? cek.adaStyle === 0 && cek.padKartu === "32px" : cek.padKartu === "18px";
    if (!ok || !okGaya) gagal++;
    laporan.push(`320 px ${k.berkas}: page width ${cek.lebarDok} px, smallest text ${cek.kecil} px, button ${cek.tinggiTombol ?? "none"}, <style> ${cek.adaStyle}, card padding ${cek.padKartu}${ok && okGaya ? "" : "  FAIL"}`);
  }
  await ctx.close();
}
await b.close();
server.close();

// the move, compared with the accepted prototype, pixel by pixel
const pasang = kerja.filter((k) => k.banding && existsSync(k.banding)).map((k) => [join(KELUAR, k.berkas), k.banding!]);
const banding = JSON.parse(execFileSync(PY, ["-c", `
import cv2, json, sys, numpy as np
out = []
for a, b in json.loads(sys.argv[1]):
    x, y = cv2.imread(a), cv2.imread(b)
    if x.shape != y.shape:
        out.append({"a": a, "ukuran": [list(x.shape), list(y.shape)]}); continue
    d = np.abs(x.astype(int) - y.astype(int)).max(axis=2) > 8
    ys, xs = np.nonzero(d)
    out.append({"a": a, "beda": int(d.sum()), "total": int(d.size), "kotak": [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())] if len(xs) else None})
print(json.dumps(out))
`, JSON.stringify(pasang)]).toString()) as Array<{ a: string; beda?: number; total?: number; kotak?: number[] | null; ukuran?: number[][] }>;
laporan.push("");
laporan.push("THE MOVE: the wired frame (production context) against the accepted prototype renders, pixel by pixel (a pixel differs when any channel moves by more than 8)");
for (const r of banding) {
  const nama = r.a.split("/").pop();
  if (r.ukuran) { laporan.push(`  ${nama}: size changed ${JSON.stringify(r.ukuran)}  FAIL`); gagal++; continue; }
  // the logo box: 104 × 58 at (16, 28) on 600 (12 + 4, 28), (12, 16) on 320 — allow its own area
  const k = r.kotak;
  const diLogo = !k || (k[0] >= 8 && k[1] >= 12 && k[2] <= 132 && k[3] <= 92);
  if (!diLogo) gagal++;
  laporan.push(`  ${nama}: ${r.beda} of ${r.total} pixels differ${k ? `, all inside x ${k[0]}–${k[2]}, y ${k[1]}–${k[3]}` : ""}${diLogo ? (k ? " (the logo, and only the logo)" : " (identical)") : "  OUTSIDE THE LOGO: FAIL"}`);
}
writeFileSync(join(KELUAR, "laporan.txt"), laporan.join("\n") + "\n");
console.log(laporan.join("\n"));
console.log(gagal ? `\n${gagal} problem(s)` : "\nall checks passed");
process.exit(gagal ? 1 : 0);
