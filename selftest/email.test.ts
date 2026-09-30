/**
 * DAISY-19 (Gate 2E, D-057(a)): the PINTAR email frame, wired to BOB-25's
 * template interface (src/lib/email/templat.ts).
 *
 *   DAISY-19-EMAIL-01  the frame: email-safe structure, no developer or Supabase
 *                      word anywhere a reader can see (a planted control is
 *                      caught), every word from the copy table, AA contrast in
 *                      light and dark, the light palette is the token set's own,
 *                      and the plain text stays readable
 *   DAISY-19-EMAIL-02  the wiring: a template is BOB-25's Templat; the logo is
 *                      the environment's own small email logo; a staging email
 *                      carries the test line and production never does; a code
 *                      is shown grouped; and the frame refuses what the sending
 *                      module would refuse
 *
 * The frame was accepted as a prototype on 29 Sep
 * (docs/coordination/ux/email-frame/); these tests pin what that prototype's
 * script checked, on the module the app now imports. The sample emails below
 * only exercise the frame's blocks: each email's own wording is DAISY-20 to
 * DAISY-24's.
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";
import { t, allKeys, telling, INTERNAL_WORDS, type HleEvent } from "../src/lib/hle";
import type { KonteksEmail, Templat } from "../src/lib/email/templat";
import {
  bingkaiEmail, tampilKode, tautanAman, logoEmail, BERKAS_LOGO, WARNA, KONTAK, RANAH, BADAN_HUKUM, type Email,
} from "../src/components/email/bingkai";
import { templatUjiPengiriman } from "../src/components/email/uji";

const PRODUKSI: KonteksEmail = { asal: "https://app.pintarselalu.com", staging: false };
const STAGING: KonteksEmail = { asal: "https://staging.pintarselalu.com", staging: true };
const LOKAL: KonteksEmail = { asal: "http://127.0.0.1:3000", staging: true };
/** the proof route's own shape for its send time (src/app/api/email/uji/route.ts) */
const WAKTU = "2026-09-30 03:12 UTC";

/** The prototype's two samples: they exercise every block. Not final copy. */
const CONTOH: Record<string, Email> = {
  kode: {
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
  pemberitahuan: {
    subjek: "Password akun PINTAR Anda telah diubah",
    pratinjau: "Jika ini bukan Anda, buat password baru sekarang.",
    judul: "Password akun PINTAR Anda telah diubah",
    isi: [
      { jenis: "paragraf", teks: "Password untuk akun PINTAR Anda baru saja diubah." },
      { jenis: "rincian", baris: [["Waktu", "Senin, 29 September 2026, pukul 09.14 WIB"], ["Cara", "Lupa password, lewat email"]] },
      { jenis: "catatan", nada: "netral", teks: "Jika ini Anda, tidak ada yang perlu dilakukan." },
      { jenis: "tombol", teks: "Masuk ke PINTAR", href: "https://app.pintarselalu.com/masuk", cadangan: true },
    ],
  },
};

/** Words a reader must never see in an email (the prototype's list, and the app's own INTERNAL_WORDS). */
const TERLARANG = [
  "supabase", "smtp", "otp", "token", "api", "json", "localhost", "undefined", "null", "nan", "lorem", "ipsum",
  "todo", "fixme", "debug", "staging", "server", "database", "basis data", "jwt", "uuid", "oauth", "auth",
  "magic link", "noreply", "vercel", "namecheap", "cpanel", "sql", "rpc", "rls", "env", "error", "exception",
  "stack", "webhook", "payload", "admin_gt", "service role", "http://",
  ...INTERNAL_WORDS.map((w) => w.toLowerCase()),
];
/** Everything a reader can see in the HTML: the text, and alt, title and aria-label. */
const terlihat = (html: string) =>
  [
    html.replace(/<!--[\s\S]*?-->/g, " ").replace(/<style[\s\S]*?<\/style>/g, " ").replace(/<title>[\s\S]*?<\/title>/g, " ").replace(/<[^>]+>/g, " "),
    ...[...html.matchAll(/\b(?:alt|title|aria-label)="([^"]*)"/g)].map((m) => m[1]),
    ...[...html.matchAll(/<title>([\s\S]*?)<\/title>/g)].map((m) => m[1]),
  ].join(" ")
    .replace(/&nbsp;|&zwnj;|&#847;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&#39;/g, "'")
    .replace(/\s+/g, " ");
const pindai = (teks: string): string[] =>
  TERLARANG.filter((w) => new RegExp(`(?<![\\p{L}\\p{N}_])${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\p{L}\\p{N}_])`, "iu").test(teks));

/** The prototype's structural checks. */
const struktur = (html: string, lokal = false): string[] => {
  const masalah: string[] = [];
  if (!/<html lang="id"/.test(html)) masalah.push("no lang=\"id\" on <html>");
  if (!/role="article"[^>]*lang="id"/.test(html)) masalah.push("no lang=\"id\" on the article wrapper");
  if (/<script\b/i.test(html)) masalah.push("a <script>");
  if (/<link\b[^>]*stylesheet/i.test(html) || /@import|@font-face/i.test(html)) masalah.push("external CSS or a web font");
  if ((html.match(/<h1\b/g) ?? []).length !== 1) masalah.push("not exactly one <h1>");
  for (const m of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    const ok = /^(https:\/\/|mailto:)/.test(m[1]) || (lokal && /^http:\/\/(?:127\.0\.0\.1|localhost|\[::1\])(?::\d+)?\//.test(m[1]));
    if (!ok) masalah.push(`a link or image that is not https or mailto: ${m[1]}`);
  }
  for (const m of html.matchAll(/<table\b[^>]*>/g)) if (!/role="presentation"/.test(m[0])) masalah.push("a layout table without role=\"presentation\"");
  if (!/max-width:600px/.test(html)) masalah.push("no 600 px maximum");
  if (!/<!--\[if mso\]><table role="presentation" width="600"/.test(html)) masalah.push("no fixed 600 px table for Outlook");
  if (/<img\b(?![^>]*\balt="[^"]+")/.test(html)) masalah.push("an image without alt text");
  return masalah;
};

const lum = (hex: string) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const rasio = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

/** The :root custom properties of globals.css. */
function tokens(css: string): Record<string, string> {
  const start = css.indexOf(":root {");
  const block = start >= 0 ? css.slice(start, css.indexOf("\n}", start)) : "";
  const out: Record<string, string> = {};
  for (const m of block.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g)) out[m[1]] = m[2].trim();
  return out;
}
/** An rgba() token laid on white, as a hex colour: what an email client that cannot blend should draw. */
function diAtasPutih(rgba: string): string | null {
  const m = /rgba\(\s*(\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\s*\)/.exec(rgba);
  if (!m) return null;
  const a = Number(m[4]);
  return `#${[m[1], m[2], m[3]].map((v) => Math.round(255 - a * (255 - Number(v))).toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

export const emailTests: SelfTest[] = [
  {
    id: "DAISY-19-EMAIL-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const hasil = [
        ...Object.entries(CONTOH).flatMap(([n, e]) => [PRODUKSI, STAGING].map((k) => ({ nama: `${n} (${k.staging ? "staging" : "production"})`, e: bingkaiEmail(e, k), pratinjau: e.pratinjau, lokal: false }))),
        { nama: "the delivery test (production)", e: templatUjiPengiriman({ waktu: WAKTU }, PRODUKSI), pratinjau: t("email.uji.pratinjau", "public"), lokal: false },
        { nama: "the delivery test (staging)", e: templatUjiPengiriman({ waktu: WAKTU }, STAGING), pratinjau: t("email.uji.pratinjau", "public"), lokal: false },
        { nama: "the delivery test (the local sink)", e: templatUjiPengiriman({ waktu: WAKTU }, LOKAL), pratinjau: t("email.uji.pratinjau", "public"), lokal: true },
      ];

      // 1. STRUCTURE: email-client-safe, in Bahasa Indonesia, one heading
      for (const h of hasil) for (const m of struktur(h.e.html, h.lokal)) c.expect(false, `${h.nama}: ${m}`);

      // 2. NO DEVELOPER OR SUPABASE WORD anywhere a reader can see: the text,
      //    alt/title/aria-label, the plain text, the subject and the preview
      for (const h of hasil) {
        const temuan = [...new Set([...pindai(terlihat(h.e.html)), ...pindai(h.e.teks), ...pindai(`${h.e.subjek} ${h.pratinjau}`)])];
        c.expect(temuan.length === 0, `${h.nama} shows: ${temuan.join(", ")}`);
      }
      // the scan really catches: a planted heading
      const tanam = bingkaiEmail({ ...CONTOH.kode, judul: "Kode OTP dari Supabase" }, PRODUKSI);
      const tertangkap = pindai(terlihat(tanam.html));
      c.expect(tertangkap.includes("otp") && tertangkap.includes("supabase"), `the planted «OTP … Supabase» heading was not caught (${tertangkap.join(", ") || "nothing"})`);

      // 3. EVERY WORD OF THE FRAME IS THE COPY TABLE'S (D-014), and the module
      //    writes none of them itself
      const kunci = allKeys().filter((k) => k.startsWith("email."));
      c.expect(kunci.length >= 13, `only ${kunci.length} email key(s) in the copy table`);
      const sumber = ["bingkai.ts", "uji.ts"].map((f) => readFileSync(join(repoRoot, "src", "components", "email", f), "utf8")).join("\n");
      for (const k of kunci) {
        const row = telling(k as HleEvent);
        c.expect(Boolean(row.default?.trim()) && Boolean(row.en?.trim()), `${k} is missing a language`);
        if (row.default.length > 8) c.expect(!sumber.includes(row.default), `src/components/email writes «${row.default}» itself instead of reading ${k}`);
      }
      const html = hasil[0].e.html; // the code sample, which passes its own reason
      for (const k of ["email.bingkai.tidak_pernah", "email.bingkai.tanya"] as HleEvent[]) {
        c.expect(html.includes(t(k, "public")), `the footer does not carry ${k}`);
      }
      // the company is a proper noun: the frame's constant, the footer's string, never a copy-table key (UX1-S1-KAKI-01)
      c.expect(html.includes(BADAN_HUKUM) && hasil[0].e.teks.includes(BADAN_HUKUM), "the footer does not name the company");
      c.expect(!kunci.some((k) => [BADAN_HUKUM, KONTAK, RANAH].includes(telling(k as HleEvent).default)), "an email key carries a proper noun");
      c.expect(html.includes(CONTOH.kode.alasan!), "an email's own reason does not reach the footer");
      c.expect(hasil[2].e.html.includes(t("email.bingkai.alasan", "public")), "an email without its own reason does not get the frame's default");
      c.expect(hasil[2].e.html.includes(t("email.bingkai.cadangan", "public")), "the button's copy-the-address line is not the copy table's");
      c.expect(/alt="PINTAR"/.test(html) && t("email.bingkai.merek", "public") === "PINTAR", "the logo's alt is not the wordmark");
      c.expect(html.includes(`mailto:${KONTAK}`), "the footer does not give PINTAR's address");

      // 4. AA CONTRAST for every text pair, light and dark (the staging line too)
      const L = WARNA.terang, D = WARNA.gelap;
      const pasangan: Array<[string, string, string]> = [
        ["body text on the card", L.tinta, L.kartu], ["secondary text on the card", L.tinta2, L.kartu],
        ["row labels on the card", L.tinta3, L.kartu], ["footer text on the page", L.tinta3, L.latar],
        ["links on the card", L.utama, L.kartu], ["links and wordmark on the page", L.utama, L.latar],
        ["button text on the button", L.utamaTinta, L.utama], ["code on its box", L.tinta, L.utamaLembut],
        ["code label on its box", L.tinta2, L.utamaLembut], ["attention note and staging line", L.tinta, L.perhatianLembut],
        ["neutral note", L.tinta, L.netralLembut],
        ["dark body text", D.tinta, D.kartu], ["dark secondary text", D.tinta2, D.kartu], ["dark row labels", D.tinta3, D.kartu],
        ["dark footer text", D.tinta3, D.latar], ["dark links on the card", D.utama, D.kartu], ["dark links on the page", D.utama, D.latar],
        ["dark button text", D.utamaTinta, D.tombol], ["dark code", D.tinta, D.utamaLembut], ["dark code label", D.tinta2, D.utamaLembut],
        ["dark attention note and staging line", D.tinta, D.perhatianLembut], ["dark neutral note", D.tinta, D.netralLembut],
      ];
      let terendah = Infinity;
      for (const [nama, a, b] of pasangan) {
        const r = rasio(a, b);
        terendah = Math.min(terendah, r);
        c.expect(r >= 4.5, `${nama}: ${r.toFixed(2)}:1, below AA`);
      }

      // 5. THE LIGHT PALETTE IS THE TOKEN SET'S. An email reads no stylesheet,
      //    so the frame writes the values; they must be the tokens' own.
      const tok = tokens(readFileSync(join(repoRoot, "src", "app", "globals.css"), "utf8"));
      const SAMA: Array<[keyof typeof L, string]> = [
        ["latar", "--surface-2"], ["kartu", "--surface-1"], ["tinta", "--ink-1"], ["tinta2", "--ink-2"], ["tinta3", "--ink-3"],
        ["utama", "--pintar-primary"], ["utamaTinta", "--pintar-primary-ink"], ["utamaLembut", "--pintar-primary-soft"],
        ["perhatian", "--status-attention"], ["perhatianLembut", "--status-attention-soft"],
        ["netral", "--status-info"], ["netralLembut", "--status-info-soft"],
      ];
      for (const [w, k] of SAMA) c.expect(tok[k]?.toUpperCase() === L[w].toUpperCase(), `the frame's ${w} ${L[w]} is not ${k} (${tok[k] ?? "absent"})`);
      // the hairline is --line laid on white (a client cannot be trusted to blend rgba), within rounding
      const garis = diAtasPutih(tok["--line"] ?? "");
      c.expect(garis !== null && [1, 3, 5].every((i) => Math.abs(parseInt(garis.slice(i, i + 2), 16) - parseInt(L.garis.slice(i, i + 2), 16)) <= 3),
        `the frame's hairline ${L.garis} is not --line on white (${garis})`);
      // the one colour with no token: the code box's border, a step darker than --pintar-primary-soft; it carries no text
      const tanpaToken = Object.keys(L).filter((w) => !SAMA.some(([s]) => s === w) && w !== "garis");
      c.expect(tanpaToken.length === 1 && tanpaToken[0] === "utamaGaris", `colours with no token: ${tanpaToken.join(", ")} (only the code box's border may be one)`);

      // 6. THE PLAIN TEXT: lines of 72 characters or fewer (URLs excepted), and
      //    the footer set off with "--" and no trailing space, so a client does
      //    not fold the PIN warning away as a signature
      for (const h of hasil) {
        const panjang = h.e.teks.split("\n").filter((l) => !/^https?:\/\//.test(l) && l.length > 72);
        c.expect(panjang.length === 0, `${h.nama}: plain-text line(s) over 72 characters: ${panjang[0]?.slice(0, 40)}`);
        c.expect(/\n--\n/.test(h.e.teks), `${h.nama}: the plain-text footer is not set off with "--"`);
        c.expect(h.e.teks.includes(t("email.bingkai.tidak_pernah", "public")), `${h.nama}: the plain text drops the PIN warning`);
      }

      return c.verdict(
        `the frame (src/components/email/bingkai.ts) renders ${hasil.length} emails email-safe (presentation tables, one <h1>, ` +
        "lang=\"id\", no script, external CSS or web font, 600 px with an Outlook table, https or mailto links only, alt on " +
        "every image); no developer or Supabase word or INTERNAL_WORDS entry is visible in the HTML, the plain text, the " +
        "subject or the preview, and a planted «OTP … Supabase» heading is caught; every frame word is an email.* key in " +
        `both languages and none is written in the module; every text pair is AA in light and dark (lowest ${terendah.toFixed(2)}:1); ` +
        "the light palette is the token set's, the hairline --line on white, and only the code box's border has no token; " +
        "plain-text lines stay within 72 characters and keep the PIN warning under a \"--\" footer",
      );
    },
  },

  {
    id: "DAISY-19-EMAIL-02",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();

      // 1. A TEMPLATE IS BOB-25's Templat: data and context in, a finished
      //    email out, the subject one non-empty line, both bodies present
      const uji: Templat<{ waktu: string }> = templatUjiPengiriman;
      for (const k of [PRODUKSI, STAGING, LOKAL]) {
        const e = uji({ waktu: WAKTU }, k);
        c.expect(e.subjek.trim().length > 0 && !/[\r\n]/.test(e.subjek), `the delivery test's subject is not one line (${k.asal})`);
        c.expect(e.html.length > 1000 && e.teks.length > 100, `the delivery test is missing a body (${k.asal})`);
        c.expect(e.subjek === t("email.uji.subjek", "public") && e.html.includes(t("email.uji.judul", "public")) &&
          e.teks.includes(t("email.uji.isi", "public").slice(0, 40)), `the delivery test does not say its own copy (${k.asal})`);
        c.expect(e.html.includes(t("email.uji.alasan", "public")), `the delivery test does not give its own reason (${k.asal})`);
        c.expect(e.html.includes(`>${WAKTU}</td>`) && e.teks.includes(`${t("email.uji.dikirim", "public")}: ${WAKTU}`),
          `the delivery test does not show its send time as a row in both bodies (${k.asal})`);
      }
      // the sending module sends THIS email (D-079): its proof template is a re-export of the framed one,
      // with no email of its own, and the route still takes it from there
      const modul = readFileSync(join(repoRoot, "src", "app", "api", "_email", "uji.ts"), "utf8");
      const rute = readFileSync(join(repoRoot, "src", "app", "api", "email", "uji", "route.ts"), "utf8");
      c.expect(/export \{ templatUjiPengiriman \} from "@\/components\/email\/uji";/.test(modul) && !/html|<p|subjek|Templat</.test(modul.replace(/\/\*[\s\S]*?\*\//g, "")),
        "the sending module's UJI_PENGIRIMAN is not the framed template (src/app/api/_email/uji.ts)");
      c.expect(/import \{ templatUjiPengiriman \} from "\.\.\/\.\.\/_email\/uji";/.test(rute) && /jenis: "UJI_PENGIRIMAN"/.test(rute),
        "the proof route no longer sends UJI_PENGIRIMAN through the sending module's template");
      // the sending module's contract (templat.ts) is what this module imports
      const src = readFileSync(join(repoRoot, "src", "components", "email", "uji.ts"), "utf8");
      c.expect(/from "@\/lib\/email\/templat"/.test(src) && /: Templat</.test(src), "the delivery test is not typed as BOB-25's Templat");
      const bingkaiSrc = readFileSync(join(repoRoot, "src", "components", "email", "bingkai.ts"), "utf8");
      c.expect(!/process\.env|server-only|nodemailer|kirimEmail/.test(bingkaiSrc + src), "the frame reads configuration or sends");

      // 2. THE LOGO IS THE ENVIRONMENT'S OWN (ruling 2), and it exists
      c.expect(logoEmail(STAGING) === `https://staging.pintarselalu.com${BERKAS_LOGO}`, `staging's logo is ${logoEmail(STAGING)}`);
      c.expect(logoEmail(PRODUKSI) === `https://app.pintarselalu.com${BERKAS_LOGO}`, `production's logo is ${logoEmail(PRODUKSI)}`);
      c.expect(logoEmail({ asal: "https://staging.pintarselalu.com/", staging: true }) === `https://staging.pintarselalu.com${BERKAS_LOGO}`, "a trailing slash doubles the path");
      c.expect(uji({ waktu: WAKTU }, STAGING).html.includes(`src="https://staging.pintarselalu.com${BERKAS_LOGO}"`) && !uji({ waktu: WAKTU }, STAGING).html.includes("app.pintarselalu.com/brand"),
        "a staging email loads a logo that is not staging's");
      const berkas = join(repoRoot, "public", BERKAS_LOGO);
      if (c.expect(existsSync(berkas), `${BERKAS_LOGO} is not in public/`)) {
        const png = readFileSync(berkas);
        const [w, h] = [png.readUInt32BE(16), png.readUInt32BE(20)];
        c.expect(png.subarray(1, 4).toString() === "PNG" && w === 208 && h === 116, `the email logo is ${w} × ${h}, not 208 × 116 (2× its 104 × 58)`);
        c.expect(png.length < 20_000, `the email logo is ${png.length} bytes; it should be small`);
      }

      // 3. THE TEST LINE (ruling 3): on every staging email, in both bodies; never on production
      const garisUji = t("email.bingkai.uji", "public");
      for (const [nama, e] of Object.entries(CONTOH)) {
        const s = bingkaiEmail(e, STAGING), p = bingkaiEmail(e, PRODUKSI);
        c.expect(s.html.includes(garisUji) && s.teks.includes(garisUji), `${nama}: a staging email does not carry the test line`);
        c.expect(!p.html.includes(garisUji) && !p.teks.includes(garisUji) && !/pin-uji"/.test(p.html), `${nama}: a production email carries the test line`);
        c.expect(s.html.indexOf(garisUji) < s.html.indexOf("<h1"), `${nama}: the test line is not at the top of the body`);
      }

      // 4. A CODE IS SHOWN GROUPED (ruling 1), whether it arrives spaced or not
      c.expect(tampilKode("482913") === "482 913" && tampilKode("482 913") === "482 913", "a six-digit code is not shown «482 913»");
      c.expect(tampilKode("48291302") === "4829 1302", "an eight-digit code is not shown 4 + 4");
      c.expect(tampilKode("ABC-12") === "ABC-12", "a code that is not all digits is changed");
      const kode = bingkaiEmail(CONTOH.kode, PRODUKSI);
      c.expect(kode.html.includes(">482 913</p>") && /\n {4}482 913\n/.test(kode.teks), "the code block does not show «482 913» in both bodies");

      // 5. REFUSED EARLY: what the sending module refuses, and a link that is not safe
      const menolak = (f: () => unknown) => { try { f(); return false; } catch { return true; } };
      c.expect(menolak(() => bingkaiEmail({ ...CONTOH.kode, subjek: "Kode\r\nBcc: x@y.z" }, PRODUKSI)), "a subject with a line break is accepted");
      c.expect(menolak(() => bingkaiEmail({ ...CONTOH.kode, subjek: "  " }, PRODUKSI)), "an empty subject is accepted");
      for (const buruk of ["http://pintarselalu.com/masuk", "javascript:alert(1)", "//app.pintarselalu.com", "https://app pintar"]) {
        c.expect(menolak(() => tautanAman(buruk)), `the unsafe link ${buruk} is accepted`);
      }
      c.expect(menolak(() => logoEmail({ asal: "http://staging.pintarselalu.com", staging: true })), "a plain-http origin that is not local is accepted");
      c.expect(!menolak(() => logoEmail(LOKAL)) && !menolak(() => tautanAman("http://localhost:3000/masuk")), "the local sink's origin is refused");

      return c.verdict(
        "templatUjiPengiriman is BOB-25's Templat (src/lib/email/templat.ts) and returns a one-line subject and both bodies in " +
        "its own copy table words, its send time as a row; the sending module's UJI_PENGIRIMAN (src/app/api/_email/uji.ts, the proof " +
        "route's import) is this framed template and holds no email of its own; nothing in src/components/email reads configuration or sends; the logo is " +
        `${BERKAS_LOGO} on the environment's own origin (208 × 116 PNG, small), never production's on staging; every staging ` +
        "email carries the test line at the top of both bodies and no production email does; a code arrives spaced or not " +
        "and is shown «482 913» (4 + 4 for eight digits); a subject with a line break, an empty subject, a non-https link " +
        "and a plain-http origin other than the local sink are all refused",
      );
    },
  },
];
