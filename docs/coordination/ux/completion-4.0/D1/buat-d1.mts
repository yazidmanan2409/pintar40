/**
 * D1 STEP 2 — the six identity emails in the DAISY-19 frame, with DAISY-37's
 * missing elements (bingkai-d1.mts). Design specimen, not application code.
 * Run from the repository root:
 *
 *   npx tsx docs/coordination/ux/completion-4.0/D1/buat-d1.mts
 *
 * The words are the copy table at engineering commit 0b19707 (read with
 * `git show`, never copied by hand), plus the new keys in NEW below (the T table).
 * The templates are 0b19707's (identitas.ts, keamanan.ts), the same blocks in
 * the same order; only the frame changed.
 *
 * Writes, for each email:
 * - render/<email>-<600|320>-<terang|gelap>.png, and -tanpa-gambar (images blocked);
 * - <email>.html and <email>.txt (the plain-text part);
 * - jalan/<email>.txt: the Tab order and the accessibility tree.
 * Then checks every render and writes render/laporan.txt.
 */
import { execSync } from "node:child_process";
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync, mkdtempSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { bingkaiEmail, pasangKata, kata, type Blok, type Email, type KartuEmail } from "./bingkai-d1.mts";

const sini = dirname(fileURLToPath(import.meta.url));
const repo = join(sini, "..", "..", "..", "..", "..");
const KOMIT = "0b19707";

// ── the copy table at the engineering commit ────────────────────────────────
const kerja = mkdtempSync(join(tmpdir(), "d1-"));
for (const f of ["hle.ts", "tanggal.ts"]) writeFileSync(join(kerja, f), execSync(`git show ${KOMIT}:src/lib/${f}`, { cwd: repo }));
const hle = await import(join(kerja, "hle.ts"));
const tanggalMod = await import(join(kerja, "tanggal.ts"));

/** The new keys (T table, README §4). Indonesian first; presentation, not protected terms. */
export const NEW: Record<string, { id: string; en: string }> = {
  "email.bingkai.konteks": { id: "Akun PINTAR Anda di", en: "Your PINTAR account at" },
  "email.bingkai.konteks.dan": { id: "dan", en: "and" },
};
pasangKata((k, p, o) => (NEW[k] ? NEW[k].id : hle.t(k, p, o)));
const durasi = (menit: number) => hle.format.durasi(menit * 60, "id");
const tampilId = (id: string) => `${id.slice(0, 4)} ${id.slice(4)}`;

// ── invented people and places (never a real person) ────────────────────────
const ORANG = { nama: "Rina Kartika", id: "K7M2Q9XA" };
const SEKOLAH_A = "SMP Cahaya Kaliandra";
const SEKOLAH_B = "SMA Bukit Asri Kaliandra";
const ASAL = "https://pintarselalu.com";
const konteksEmail = { asal: ASAL, staging: false };

/**
 * The context line: «Akun PINTAR Anda di {tempat}», only where the email's own
 * data carries the place (D-059: a place, never a role or an authority).
 * One or two places are named; with more, the first two and «dan n lainnya» is
 * NOT used: the line names every place, joined by «, » and «dan», because the
 * card's own rows already list them and the line must never summarise away a
 * place. Without data, undefined: the line is omitted.
 */
export function barisKonteks(tempat: string[]): string | undefined {
  const t = [...new Set(tempat.filter(Boolean))].sort((a, b) => a.localeCompare(b, "id"));
  if (!t.length) return undefined;
  const daftar = t.length === 1 ? t[0] : `${t.slice(0, -1).join(", ")} ${kata("email.bingkai.konteks.dan")} ${t[t.length - 1]}`;
  return `${kata("email.bingkai.konteks")} ${daftar}.`;
}

// ── the family colours (D-074, ruled palette «terpisah») and the order (D-074(5)) ──
const KELUARGA: Record<string, string> = {
  "Murid": "#725471", "Guru": "#446A4B", "Kepala departemen": "#2E6973",
  "Dekan": "#515E83", "Admin sekolah": "#7A5648", "Admin platform": "#5E6062",
};
function kartu(nama: string, id: string, peran: Array<{ peran: string; sekolah: string | null }>): KartuEmail {
  // alphabetical by the Terminology v1 name, then the school: the Digital Card's order
  const urut = [...peran].sort((a, b) => a.peran.localeCompare(b.peran, "id") || (a.sekolah ?? "").localeCompare(b.sekolah ?? "", "id"));
  return { nama, pintarId: tampilId(id), baris: urut, warna: KELUARGA[urut[0].peran] };
}

// ── the six emails: 0b19707's templates, block for block ────────────────────
type Contoh = { kode: string; judul: string; email: Email; varian?: string };
const halo = (n: string): Blok => ({ jenis: "paragraf", teks: `${kata("email.kode.halo")} ${n}.` });
const berlaku = (m: number): Blok => ({ jenis: "paragraf", teks: `${kata("email.kode.berlaku")} ${durasi(m)}${kata("email.kode.berlaku_lalu")}` });
const kapan = tanggalMod.tanggal("2026-11-04T08:30:00Z", "resmiJam") || "4 November 2026 pukul 15.30 WIB";

const kartuSatu = kartu(ORANG.nama, ORANG.id, [{ peran: "Guru", sekolah: SEKOLAH_A }]);
const kartuDua = kartu(ORANG.nama, ORANG.id, [{ peran: "Kepala departemen", sekolah: SEKOLAH_B }, { peran: "Guru", sekolah: SEKOLAH_A }]);
const isiKartu = (k: KartuEmail): Blok[] => [
  halo(ORANG.nama),
  { jenis: "paragraf", teks: kata("email.kartu.isi") },
  { jenis: "kartu", kartu: k },
  { jenis: "paragraf", teks: kata("email.kartu.bukan_rahasia") },
  { jenis: "tombol", teks: kata("email.kartu.tombol"), href: `${ASAL}/akun`, cadangan: true },
];

const CONTOH: Contoh[] = [
  { kode: "1-aktivasi", judul: "Activation code", email: {
    subjek: kata("email.kode.subjek"), pratinjau: kata("email.kode.pratinjau"), judul: kata("email.kode.judul"), alasan: kata("email.kode.alasan"),
    isi: [halo(ORANG.nama), { jenis: "paragraf", teks: kata("email.kode.isi") }, { jenis: "kode", label: kata("email.kode.label"), kode: "482913" }, berlaku(10), { jenis: "catatan", nada: "perhatian", teks: kata("email.kode.bukan_anda") }] } },
  { kode: "2-kirim-ulang", judul: "Activation code, sent again", email: {
    subjek: kata("email.kode.ulang.subjek"), pratinjau: kata("email.kode.ulang.pratinjau"), judul: kata("email.kode.ulang.judul"), alasan: kata("email.kode.alasan"),
    isi: [halo(ORANG.nama), { jenis: "paragraf", teks: kata("email.kode.ulang.isi") }, { jenis: "kode", label: kata("email.kode.label"), kode: "730154" }, berlaku(10), { jenis: "catatan", nada: "perhatian", teks: kata("email.kode.bukan_anda") }] } },
  { kode: "3-pemulihan", judul: "Password recovery", email: {
    subjek: kata("email.pulih.subjek"), pratinjau: kata("email.pulih.pratinjau"), judul: kata("email.pulih.judul"), alasan: kata("email.pulih.alasan"),
    isi: [halo(ORANG.nama), { jenis: "paragraf", teks: kata("email.pulih.isi") }, { jenis: "kode", label: kata("email.pulih.label"), kode: "905227" }, berlaku(10), { jenis: "catatan", nada: "perhatian", teks: kata("email.pulih.bukan_anda") }] } },
  { kode: "4-password-diganti", judul: "Password changed", email: {
    subjek: kata("email.diubah.subjek"), pratinjau: kata("email.diubah.pratinjau"), judul: kata("email.diubah.judul"), alasan: kata("email.diubah.alasan"),
    isi: [halo(ORANG.nama), { jenis: "paragraf", teks: `${kata("email.diubah.isi")} ${kapan}.` }, { jenis: "paragraf", teks: kata("email.diubah.sesi") }, { jenis: "catatan", nada: "perhatian", teks: kata("email.diubah.bukan_anda") }, { jenis: "tombol", teks: kata("email.diubah.tombol"), href: `${ASAL}/lupa`, cadangan: true }] } },
  { kode: "5-kartu", judul: "The PINTAR Card (one role)", email: {
    subjek: kata("email.kartu.subjek"), pratinjau: `${kata("email.kartu.pratinjau")} ${tampilId(ORANG.id)}.`, judul: kata("email.kartu.judul"), alasan: kata("email.kartu.alasan"),
    konteks: barisKonteks([SEKOLAH_A]), isi: isiKartu(kartuSatu) } },
  { kode: "5b-kartu-dua-peran", judul: "The PINTAR Card (two roles at two schools)", varian: "the edge case: two role and school pairs, alphabetical; the colour is the first role's", email: {
    subjek: kata("email.kartu.subjek"), pratinjau: `${kata("email.kartu.pratinjau")} ${tampilId(ORANG.id)}.`, judul: kata("email.kartu.judul"), alasan: kata("email.kartu.alasan"),
    konteks: barisKonteks([SEKOLAH_B, SEKOLAH_A]), isi: isiKartu(kartuDua) } },
  { kode: "6-keamanan", judul: "Security notice (PIN recovery locked, to the owner)", email: {
    subjek: kata("email.aman.terkunci.subjek"), pratinjau: kata("email.aman.terkunci.isi"), judul: kata("email.aman.terkunci.judul"), alasan: kata("email.aman.alasan"),
    isi: [{ jenis: "paragraf", teks: kata("email.aman.terkunci.isi") }, { jenis: "rincian", baris: [[kata("email.aman.id"), tampilId(ORANG.id)], [kata("email.aman.waktu"), kapan]] }, { jenis: "catatan", nada: "perhatian", teks: kata("email.aman.terkunci.bukan_anda") }, { jenis: "tombol", teks: kata("email.aman.tombol"), href: `${ASAL}/lupa`, cadangan: true }] } },
  { kode: "6b-keamanan-admin", judul: "Security notice (to the security recipient)", varian: "the security recipient's voice: no button, the neutral note", email: {
    subjek: `${kata("email.aman.terkunci.subjek_admin")} · ${tampilId(ORANG.id)}`, pratinjau: kata("email.aman.terkunci.isi_admin"), judul: kata("email.aman.terkunci.subjek_admin"), alasan: kata("email.aman.alasan_admin"),
    isi: [{ jenis: "paragraf", teks: kata("email.aman.terkunci.isi_admin") }, { jenis: "rincian", baris: [[kata("email.aman.id"), tampilId(ORANG.id)], [kata("email.aman.waktu"), kapan]] }, { jenis: "catatan", teks: kata("email.aman.admin_catatan") }] } },
];

// ── render the matrix, the plain text, the trees; check ─────────────────────
const RENDER = join(sini, "render"), JALAN = join(sini, "jalan");
mkdirSync(RENDER, { recursive: true }); mkdirSync(JALAN, { recursive: true });
const req = createRequire(join(execSync("npm root -g").toString().trim(), "x.js"));
const { chromium } = req("playwright");
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const laporan: string[] = [];
let gagal = 0;
const LARANGAN = /\b(PR0\d\d|SQLSTATE|undefined|null|NaN|\[object|IDENTITY_|_ERROR|segera kedaluwarsa|segera berakhir|expires shortly|shortly)\b/i;

for (const c of CONTOH) {
  const jadi = bingkaiEmail(c.email, konteksEmail);
  writeFileSync(join(sini, `${c.kode}.html`), jadi.html);
  writeFileSync(join(sini, `${c.kode}.txt`), `Subject: ${jadi.subjek}\n\n${jadi.teks}`);
  const masalah: string[] = [];
  if (LARANGAN.test(jadi.teks) || LARANGAN.test(jadi.html.replace(/<[^>]+>/g, " "))) masalah.push("an internal word or a vague duration in the text");
  if (!jadi.teks.replace(/\s+/g, " ").includes(c.email.alasan!)) masalah.push("the plain text lacks the reason");
  for (const [lebar, gelap, gambar] of [[600, false, true], [600, true, true], [320, false, true], [320, true, true], [600, false, false], [320, false, false]] as Array<[number, boolean, boolean]>) {
    const ctx = await browser.newContext({ viewport: { width: lebar, height: 900 }, colorScheme: gelap ? "dark" : "light", deviceScaleFactor: 2 });
    if (!gambar) await ctx.route("**/*.{png,jpg,gif}", (r: { abort: () => void }) => r.abort());
    const page = await ctx.newPage();
    await page.setContent(jadi.html, { waitUntil: "load" });
    // The owner's addendum (4 Nov): with images blocked, the email must read in full WITHOUT the
    // wordmark or the card artwork. Once the master exists it is an image, so the blocked render
    // removes both slots outright: the worst case, nothing left of the brand.
    if (!gambar) await page.evaluate(() => document.querySelectorAll(".pin-slot, .pin-slot-kartu").forEach((e) => e.remove()));
    const nama = `${c.kode}-${lebar}-${gambar ? (gelap ? "gelap" : "terang") : "tanpa-gambar"}.png`;
    await page.screenshot({ path: join(RENDER, nama), fullPage: true });
    const ukur = await page.evaluate(() => {
      const kecil = [...document.querySelectorAll("body *")].filter((e) => (e as HTMLElement).offsetParent !== null && e.childNodes.length && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent!.trim()))
        .map((e) => parseFloat(getComputedStyle(e).fontSize)).reduce((a, b) => Math.min(a, b), 99);
      const tombol = [...document.querySelectorAll(".pin-tombol-a")].map((a) => a.getBoundingClientRect().height);
      // above the fold at 320: the heading, the reason, and the first action or code
      const lipat = window.innerHeight;
      const alasan = document.querySelector(".pin-alasan")?.getBoundingClientRect().bottom ?? 9999;
      return { lebarDok: document.documentElement.scrollWidth, kecil, tombol, alasanDiLipat: alasan <= lipat };
    });
    if (ukur.lebarDok > lebar + 1) masalah.push(`sideways scroll at ${lebar} (${ukur.lebarDok})`);
    if (ukur.kecil < 9) masalah.push(`text under 9 px at ${lebar} (${ukur.kecil})`);
    if (ukur.tombol.some((h: number) => h < 44)) masalah.push(`a button under 44 px at ${lebar}`);
    if (lebar === 320 && !ukur.alasanDiLipat) masalah.push("the reason is below the fold at 320");
    if (!gambar) {
      // who, why and what, readable with no wordmark and no card artwork (the owner's addendum)
      // (a string, so the TypeScript runner adds no helpers to it)
      const baca = await page.evaluate(`(() => {
        var t = function (sel) { var e = document.querySelector(sel); return e ? e.textContent.trim() : ""; };
        var semua = document.querySelector("[role=article]").textContent || "";
        return {
          siapa: /PINTAR/.test(t(".pin-judul") + t(".pin-alasan")) && /PT ZAYD PINTAR SELALU/.test(semua),
          mengapa: t(".pin-alasan").length > 0,
          apa: t(".pin-judul").length > 0 && !!document.querySelector(".pin-kode, .pin-tombol-a, .pin-teks"),
          sisaMerek: document.querySelectorAll(".pin-slot, .pin-slot-kartu").length
        };
      })()`);
      if (!baca.siapa) masalah.push(`images blocked at ${lebar}: who sent it is not legible without the wordmark`);
      if (!baca.mengapa) masalah.push(`images blocked at ${lebar}: the reason is missing`);
      if (!baca.apa) masalah.push(`images blocked at ${lebar}: what to do is missing`);
      if (baca.sisaMerek) masalah.push(`images blocked at ${lebar}: a wordmark slot is still drawn`);
    }
    if (lebar === 600 && gambar && !gelap) {
      // the Tab order and the accessibility tree, at 600 light
      const tab: string[] = [];
      for (let i = 0; i < 12; i++) {
        await page.keyboard.press("Tab");
        const f = await page.evaluate(() => { const a = document.activeElement as HTMLElement; return a && a !== document.body ? `${a.tagName.toLowerCase()} «${(a.textContent || "").trim().slice(0, 60)}» ${a.getAttribute("href") ?? ""}` : ""; });
        if (!f || tab.includes(f)) break;
        tab.push(f);
      }
      const pohon = await page.locator("[role=article]").ariaSnapshot();
      writeFileSync(join(JALAN, `${c.kode}.txt`), `${c.judul}: the Tab order (600 px, light)\n${tab.map((x, i) => `${String(i + 1).padStart(2)}. ${x}`).join("\n")}\n\nThe accessibility tree\n${pohon}\n`);
    }
    await ctx.close();
  }
  if (masalah.length) gagal++;
  laporan.push(`${masalah.length ? "FAIL" : "ok  "} ${c.kode}${masalah.length ? "\n      " + masalah.join("\n      ") : ""}`);
}
await browser.close();
const ringkas = `${CONTOH.length} emails × the matrix (600 and 320, light and dark, images blocked) and the plain text: ${gagal} with a failure\n\n${laporan.join("\n")}\n`;
writeFileSync(join(RENDER, "laporan.txt"), ringkas);
console.log(ringkas);
process.exit(gagal ? 1 : 0);
