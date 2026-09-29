/**
 * DAISY-19 static prototype: builds the two sample emails through the frame,
 * writes their HTML and plain text, runs the static scan and the contrast
 * checks, and renders them in Chromium. Run from the repository root:
 *
 *   npx tsx docs/coordination/ux/email-frame/buat-prototipe.mts
 *
 * The SAMPLE CONTENT below only exercises the frame's blocks. Each email's own
 * wording is DAISY-20 to DAISY-24's; nothing here is final copy.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";
import { bingkaiEmail, WARNA, LOGO_BAKU, type Email } from "./bingkai.mjs";
import { INTERNAL_WORDS } from "../../../../src/lib/hle.js";

const DIR = "docs/coordination/ux/email-frame";
const RENDER = join(DIR, "render");
mkdirSync(RENDER, { recursive: true });

// ── sample content (CONTOH): exercises every block; not final wording ─────────
const CONTOH: Record<string, Email> = {
  "contoh-kode": {
    subjek: "Kode aktivasi akun PINTAR Anda",
    pratinjau: "Masukkan kode ini untuk melanjutkan aktivasi akun Anda.",
    judul: "Kode aktivasi akun PINTAR Anda",
    isi: [
      { jenis: "paragraf", teks: "Halo, Sari Wulandari." },
      { jenis: "paragraf", teks: "Masukkan kode berikut di halaman Aktifkan akun PINTAR untuk melanjutkan." },
      { jenis: "kode", label: "Kode aktivasi", kode: "482 913" },
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

// ── static scan: no developer or Supabase words anywhere a reader can see ─────
const TERLARANG = [
  "supabase", "smtp", "otp", "token", "api", "json", "localhost", "undefined", "null", "nan", "lorem", "ipsum",
  "todo", "fixme", "debug", "staging", "server", "database", "basis data", "jwt", "uuid", "oauth", "auth",
  "magic link", "noreply", "vercel", "namecheap", "cpanel", "sql", "rpc", "rls", "env", "error", "exception",
  "stack", "webhook", "payload", "admin_gt", "service role", "http://",
  ...INTERNAL_WORDS.map((w) => w.toLowerCase()),
];
const terlihat = (html: string) =>
  [
    html.replace(/<!--[\s\S]*?-->/g, " ").replace(/<style[\s\S]*?<\/style>/g, " ").replace(/<[^>]+>/g, " "),
    ...[...html.matchAll(/\b(?:alt|title|aria-label)="([^"]*)"/g)].map((m) => m[1]),
  ].join(" ")
    .replace(/&nbsp;|&zwnj;|&#847;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&#39;/g, "'")
    .replace(/\s+/g, " ");
const pindai = (teks: string): string[] =>
  TERLARANG.filter((w) => new RegExp(`(?<![\\p{L}\\p{N}_])${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\p{L}\\p{N}_])`, "iu").test(teks));

// ── structural checks on the HTML ────────────────────────────────────────────
const struktur = (html: string): string[] => {
  const masalah: string[] = [];
  if (!/<html lang="id"/.test(html)) masalah.push("no lang=\"id\" on <html>");
  if (!/role="article"[^>]*lang="id"/.test(html)) masalah.push("no lang=\"id\" on the article wrapper");
  if (/<script\b/i.test(html)) masalah.push("a <script>");
  if (/<link\b[^>]*stylesheet/i.test(html) || /@import|@font-face/i.test(html)) masalah.push("external CSS or a web font");
  if ((html.match(/<h1\b/g) ?? []).length !== 1) masalah.push("not exactly one <h1>");
  for (const m of html.matchAll(/href="([^"]+)"/g)) if (!/^(https:\/\/|mailto:)/.test(m[1])) masalah.push(`a link that is not https or mailto: ${m[1]}`);
  for (const m of html.matchAll(/<table\b[^>]*>/g)) if (!/role="presentation"/.test(m[0])) masalah.push("a layout table without role=\"presentation\"");
  if (!/max-width:600px/.test(html)) masalah.push("no 600 px maximum");
  if (!/<!--\[if mso\]><table role="presentation" width="600"/.test(html)) masalah.push("no fixed 600 px table for Outlook");
  return masalah;
};

// ── contrast (WCAG 2.x) ──────────────────────────────────────────────────────
const lum = (hex: string) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const rasio = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const L = WARNA.terang, D = WARNA.gelap;
const PASANGAN: Array<[string, string, string, number]> = [
  ["light · body text on the card", L.tinta, L.kartu, 4.5], ["light · secondary text on the card", L.tinta2, L.kartu, 4.5],
  ["light · row labels on the card", L.tinta3, L.kartu, 4.5], ["light · footer text on the page", L.tinta3, L.latar, 4.5],
  ["light · links on the card", L.utama, L.kartu, 4.5], ["light · links and wordmark on the page", L.utama, L.latar, 4.5],
  ["light · button text on the button", L.utamaTinta, L.utama, 4.5], ["light · code on its box", L.tinta, L.utamaLembut, 4.5],
  ["light · code label on its box", L.tinta2, L.utamaLembut, 4.5], ["light · note text on the attention note", L.tinta, L.perhatianLembut, 4.5],
  ["light · note text on the neutral note", L.tinta, L.netralLembut, 4.5],
  ["dark · body text on the card", D.tinta, D.kartu, 4.5], ["dark · secondary text on the card", D.tinta2, D.kartu, 4.5],
  ["dark · row labels on the card", D.tinta3, D.kartu, 4.5], ["dark · footer text on the page", D.tinta3, D.latar, 4.5],
  ["dark · links on the card", D.utama, D.kartu, 4.5], ["dark · links and wordmark on the page", D.utama, D.latar, 4.5],
  ["dark · button text on the button", D.utamaTinta, D.tombol, 4.5], ["dark · code on its box", D.tinta, D.utamaLembut, 4.5],
  ["dark · code label on its box", D.tinta2, D.utamaLembut, 4.5], ["dark · note text on the attention note", D.tinta, D.perhatianLembut, 4.5],
  ["dark · note text on the neutral note", D.tinta, D.netralLembut, 4.5],
];

// ── build, scan and write ────────────────────────────────────────────────────
const laporan: string[] = [];
let gagal = 0;
const hasil: Record<string, { html: string; teks: string; subjek: string }> = {};
for (const [nama, email] of Object.entries(CONTOH)) {
  const e = bingkaiEmail(email);
  hasil[nama] = e;
  writeFileSync(join(DIR, `${nama}.html`), e.html);
  writeFileSync(join(DIR, `${nama}.txt`), e.teks);
  const temuan = [...new Set([...pindai(terlihat(e.html)), ...pindai(e.teks), ...pindai(`${e.subjek} ${email.pratinjau}`)])];
  const s = struktur(e.html);
  const lebar = Math.max(...e.teks.split("\n").map((l) => (/^https:\/\//.test(l) ? 0 : l.length)));
  gagal += temuan.length + s.length + (lebar > 76 ? 1 : 0);
  laporan.push(`${nama}: forbidden words ${temuan.length ? temuan.join(", ") : "none"}; structure ${s.length ? s.join("; ") : "ok"}; plain-text longest line ${lebar} (URLs excepted)`);
}
// the scan's control: a planted word must be caught
const tanam = pindai(terlihat(bingkaiEmail({ ...CONTOH["contoh-kode"], judul: "Kode OTP dari Supabase" }).html));
laporan.push(`scan control (planted "OTP" and "Supabase" in the heading): caught ${tanam.join(", ") || "NOTHING"}`);
if (!(tanam.includes("otp") && tanam.includes("supabase"))) gagal++;
for (const [nama, a, b, min] of PASANGAN) {
  const r = rasio(a, b);
  if (r < min) gagal++;
  laporan.push(`contrast ${nama}: ${a} on ${b} = ${r.toFixed(2)}:1${r < min ? "  BELOW AA" : ""}`);
}

// ── render in Chromium ───────────────────────────────────────────────────────
const require_ = createRequire("/opt/node22/lib/node_modules/");
const { chromium } = require_("playwright");
const LOGO_LOKAL = `file://${process.cwd()}/public/brand/pintar-selalu-logo.png`;
const tmp = "/tmp/claude-0/-home-user-pintar40/50574818-1ff8-5baf-a9b1-a7f111347b0f/scratchpad/email-render";
mkdirSync(tmp, { recursive: true });
type Varian = { nama: string; lebar: number; gelap?: boolean; tanpaStyle?: boolean; tanpaGambar?: boolean };
const VARIAN: Record<string, Varian[]> = {
  "contoh-kode": [
    { nama: "600-terang", lebar: 600 }, { nama: "320-terang", lebar: 320 },
    { nama: "600-gelap", lebar: 600, gelap: true }, { nama: "320-gelap", lebar: 320, gelap: true },
    { nama: "320-tanpa-style", lebar: 320, tanpaStyle: true }, { nama: "600-tanpa-gambar", lebar: 600, tanpaGambar: true },
  ],
  "contoh-pemberitahuan": [
    { nama: "600-terang", lebar: 600 }, { nama: "320-terang", lebar: 320 }, { nama: "320-gelap", lebar: 320, gelap: true },
  ],
};
const b = await chromium.launch();
for (const [nama, varian] of Object.entries(VARIAN)) {
  for (const v of varian) {
    let html = hasil[nama].html.replace(LOGO_BAKU, LOGO_LOKAL);
    // a client that drops the <style> block (as some Gmail apps do): the inline styles alone
    if (v.tanpaStyle) html = html.replace(/<style>[\s\S]*?<\/style>/g, "");
    const f = join(tmp, `${nama}-${v.nama}.html`);
    writeFileSync(f, html);
    const ctx = await b.newContext({ viewport: { width: v.lebar, height: 800 }, colorScheme: v.gelap ? "dark" : "light", deviceScaleFactor: 1 });
    const p = await ctx.newPage();
    // Outlook's default: remote images off, so the alt text carries the wordmark
    if (v.tanpaGambar) await p.route("**/*.png", (r: { abort: () => Promise<void> }) => r.abort());
    await p.goto(`file://${f}`);
    await p.screenshot({ path: join(RENDER, `${nama}-${v.nama}.png`), fullPage: true });
    if (v.lebar === 320) {
      const cek = await p.evaluate(() => {
        const lebarDok = document.documentElement.scrollWidth;
        let kecil = 99;
        for (const el of Array.from(document.querySelectorAll("p, td, a, h1, span"))) {
          const t = Array.from(el.childNodes).some((n) => n.nodeType === 3 && (n.textContent ?? "").trim());
          if (t) kecil = Math.min(kecil, parseFloat(getComputedStyle(el).fontSize));
        }
        const tombol = document.querySelector(".pin-tombol-a") as HTMLElement | null;
        const kartu = document.querySelector(".pin-kartu") as HTMLElement;
        return { lebarDok, kecil, tinggiTombol: tombol ? tombol.getBoundingClientRect().height : null, padKartu: getComputedStyle(kartu).paddingLeft, adaStyle: document.querySelectorAll("style").length };
      });
      const ok = cek.lebarDok <= 320 && cek.kecil >= 13 && (cek.tinggiTombol === null || cek.tinggiTombol >= 44);
      if (!ok) gagal++;
      // the narrow-screen enhancement applies where <style> survives, and the email still reads where it does not
      const okGaya = v.tanpaStyle ? cek.adaStyle === 0 && cek.padKartu === "32px" : cek.padKartu === "18px";
      if (!okGaya) gagal++;
      laporan.push(`320 px ${nama} ${v.nama}: page width ${cek.lebarDok} px (no sideways scroll: ${cek.lebarDok <= 320}), smallest text ${cek.kecil} px, button height ${cek.tinggiTombol ?? "no button"}, <style> blocks ${cek.adaStyle}, card padding ${cek.padKartu}${ok && okGaya ? "" : "  FAIL"}`);
    }
    await ctx.close();
  }
}
await b.close();
writeFileSync(join(tmp, "laporan.txt"), laporan.join("\n") + "\n");
console.log(laporan.join("\n"));
console.log(gagal ? `\n${gagal} problem(s)` : "\nall checks passed");
process.exit(gagal ? 1 : 0);
