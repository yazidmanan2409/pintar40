/**
 * BATCH 6 · B6C · THE CERTIFICATE AS DESIGNED, AND ONE CLEAN A4 PAGE (D-159; D-160(a)(b)(c); D-120 Q16; D-076, D-080,
 * D-085 T4, D-086(e)). W3.19 / CR-03 / CR-04 / J8.4 and DAISY-36 / W3.22 (the certificate part). The design is Daisy's
 * sertifikat/ronde-2 (README, sertifikat2.mts, cetak-usulan.css). Each guard is RED on the code Batch 5 closed with
 * (3412075) and GREEN after.
 *
 *  B6C-QR-01     D-160(b) · src/lib/qr.ts encodes byte mode at level Q as well as M: the printed sheet's symbol for a
 *                verification link with a 43-character token decodes back exactly (jsQR, an independent decoder) and
 *                its format information reads level Q; the default stays level M (the Digital Card and the on-screen
 *                tile); the sheet asks for Q and nothing else does.
 *  B6C-SHEET-01  the frozen composition, rendered from the real KartuSertifikat and measured in .pin-sheet: A4 in mm;
 *                the header pair at 22 mm on a 20 mm margin (the title in the accent, the wordmark slot on its baseline
 *                at a 3.15 mm cap height, ≥ 15 mm wide); name 33 pt, «telah menuntaskan» 12 pt, the course 16.5 pt;
 *                the record's labels right-aligned to the axis, ending 16 mm above the line; the number in Plex Mono
 *                12 pt, never broken, stepping 12 → 10.5 → 9.75 pt; the gold line centred at 176 mm, 0.75 mm; the
 *                band 176-210 mm inset 10 mm with «Diterbitkan oleh» 9 pt over the school 16.5 pt; the verification
 *                group at 236 mm, 130 mm wide (92 + 12 + 26 mm); plum for academic, sage for professional learning;
 *                the wordmark drawn by one replaceable component; nothing at phone width narrows the sheet.
 *  B6C-PRINT-01  DAISY-36 · printing yields one A4 page: @page sertifikat A4 portrait, margin 0; the sheet takes it, is
 *                exactly the paper, never breaks, keeps its colours (print-color-adjust: exact); a page holding the
 *                sheet prints nothing else; every part of the page around it is pin-noprint; one action «Cetak atau
 *                simpan PDF», which names the saved file for the course (never the person); the words in both
 *                languages.
 *  B6C-FOTO-01   D-085 T4, D-086(e), D-160(c) · no photograph of the holder and no school logo: the certificate's
 *                component, its page and its parts never read photo_path or a mark URL, and the rendered sheet's only
 *                images are the wordmark slot and the QR; no signature, seal, border, watermark or flourish.
 *  B6C-DATA-01   the data rules are unchanged: the sheet renders only for ISSUED; a revoked (or any non-issued)
 *                certificate shows no QR and no link on screen or sheet and keeps its «dicabut» banner; the
 *                verification URL is the one the page already builds (appUrl + /verifikasi/ + the token) and the
 *                sheet's QR decodes to it exactly, the printed link being it without https://; the name, course,
 *                school, number and date are cred's, untouched.
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import jsQR from "jsqr";
import { Checks, type SelfTest } from "./lib";
import { t, type HleEvent } from "../src/lib/hle";
import { qrMatrix } from "../src/lib/qr";

const baca = (root: string, p: string) => { try { return readFileSync(join(root, p), "utf8"); } catch { return ""; } };
/** Source without its comments, so a comment cannot satisfy a guard. */
const kode = (x: string) => x.replace(/\{\/\*[\s\S]*?\*\/\}/g, "").replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/[^\n]*/g, "$1");
const HALAMAN = "src/app/belajar/[tugas]/sertifikat/page.tsx";
const KARTU = "src/components/sertifikat/KartuSertifikat.tsx";

type Kasus = { variant: "screen" | "sheet"; konteks?: string; cred: Record<string, unknown> };
const CRED = {
  institution: "SMP Cahaya Kaliandra", nameAsIssued: "Bagas Saputra", course: "Matematika · Bab 4", predikat: "Baik",
  issuedAtIso: "2026-10-06T00:00:00Z", certificateNumber: "7Q2Z0D9K/00001",
  verificationUrl: "https://pintar.sekolah-peragaan.sch.id/verifikasi/Pq4Tz8LmN2cW6yH0vR5bK9sX1dJfG3aE7uQiOnYtBvC",
};

/** Renders the real KartuSertifikat once per case, in a child process (as PENUTUPAN-Q10 does). */
function gambar(repoRoot: string, kasus: Kasus[]): { html: string[]; galat: string } {
  const anak = spawnSync(process.execPath, ["--import", "tsx", "-e",
    "(async () => {" +
    '  const { createElement: h } = await import("react");' +
    '  const { renderToStaticMarkup } = await import("react-dom/server");' +
    '  const m = await import("file://" + process.cwd() + "/src/components/sertifikat/KartuSertifikat.tsx");' +
    "  const K = m.default?.default ?? m.default;" +
    '  const { readFileSync } = await import("node:fs");' +
    '  const out = JSON.parse(readFileSync(0, "utf8")).map((k) => renderToStaticMarkup(h(K, { locale: "id", ...k })));' +
    "  process.stdout.write(JSON.stringify(out));" +
    "})().catch((e) => { process.stderr.write(String(e && e.stack || e)); process.exit(1); });"], {
    cwd: repoRoot, encoding: "utf8", maxBuffer: 1 << 24, input: JSON.stringify(kasus),
  });
  let html: string[] = [];
  try { html = JSON.parse(anak.stdout); } catch { /* reported by the caller */ }
  return { html, galat: anak.status === 0 && html.length === kasus.length ? "" : (anak.stderr || "no output").split("\n").slice(0, 4).join(" ") };
}

/** The declarations of the last rule whose selector is exactly `sel`, outside or inside a given block. */
function aturan(css: string, sel: string): Record<string, string> {
  const re = new RegExp(`(?:^|[}\\s])${sel.replace(/[.()>:]/g, (m) => `\\${m}`)}\\s*\\{([^}]*)\\}`, "g");
  let out: Record<string, string> = {};
  for (const m of css.matchAll(re)) {
    out = {};
    for (const d of m[1].split(";")) {
      const i = d.indexOf(":");
      if (i > 0) out[d.slice(0, i).trim()] = d.slice(i + 1).trim().replace(/\s+/g, " ");
    }
  }
  return out;
}
/** The body of the first `@media print { … }` that holds the certificate's print rules. */
function blokCetak(css: string): string {
  for (const m of css.matchAll(/@media print \{/g)) {
    const i = m.index! + m[0].length - 1;
    let d = 0;
    for (let j = i; j < css.length; j++) {
      if (css[j] === "{") d++;
      else if (css[j] === "}") { d--; if (d === 0) { const b = css.slice(i + 1, j); if (/\.pin-sheet/.test(b)) return b; break; } }
    }
  }
  return "";
}
function token(globals: string, nama: string): string | undefined {
  return new RegExp(`${nama}:\\s*([^;]+);`).exec(globals)?.[1].trim();
}
const pxKePt = (px: string) => (parseFloat(px) * 72) / 96;

/** The QR an inline SVG draws (one path of `M{c} {r}h1v1h-1z` squares over `viewBox="0 0 n n"`), decoded by jsQR. */
function bacaQr(svg: string): { teks: string | null; n: number } {
  const n = Number(/viewBox="0 0 (\d+) \1"/.exec(svg)?.[1] ?? 0);
  const d = /<path d="([^"]*)"/.exec(svg)?.[1] ?? "";
  if (!n || !d) return { teks: null, n };
  const m: boolean[][] = Array.from({ length: n }, () => Array(n).fill(false));
  for (const x of d.matchAll(/M(\d+) (\d+)h1v1h-1z/g)) m[Number(x[2])][Number(x[1])] = true;
  return { teks: dekode(m), n };
}
function dekode(m: boolean[][]): string | null {
  const n = m.length, s = 4, q = 4 * s, w = n * s + 2 * q;
  const px = new Uint8ClampedArray(w * w * 4).fill(255);
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (m[r][c]) {
    for (let dy = 0; dy < s; dy++) for (let dx = 0; dx < s; dx++) {
      const i = ((q + r * s + dy) * w + (q + c * s + dx)) * 4;
      px[i] = px[i + 1] = px[i + 2] = 0;
    }
  }
  return jsQR(px, w, w)?.data ?? null;
}
/**
 * The error-correction level the symbol declares, read from its format information (ISO/IEC 18004 §7.9): the copy
 * beside the top-left finder, bits 14..0 at (8,0..5), (8,7), (8,8), (7,8), (5..0,8); unmasked with 101010000010010.
 */
function tingkat(m: boolean[][]): string {
  const pos: Array<[number, number]> = [[8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8], [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8]];
  let v = 0;
  for (const [r, c] of pos) v = (v << 1) | (m[r][c] ? 1 : 0);
  const fmt = v ^ 0b101010000010010;
  return ({ 0b01: "L", 0b00: "M", 0b11: "Q", 0b10: "H" } as Record<number, string>)[fmt >>> 13] ?? "?";
}
const teks = (h: string) => h.replace(/<[^>]+>/g, " ").replace(/&nbsp;| /g, " ").replace(/\s+/g, " ").trim();

export const b6cTests: SelfTest[] = [
  {
    id: "B6C-QR-01",
    run: async (ctx) => {
      const c = new Checks();
      const token = "Pq4Tz8LmN2cW6yH0vR5bK9sX1dJfG3aE7uQiOnYtBvC";
      c.expect(token.length === 43, "the sample token is not the 43-character token ADR-0012 keeps");
      const links = [
        `https://pintar.example.id/verifikasi/${token}`,
        `https://verifikasi.pintarselalu.com/${token}`,
        `http://127.0.0.1:3000/verifikasi/${token}`,
        `https://pintar.sekolah-peragaan.sch.id/verifikasi/${token}`,
      ];
      for (const link of links) {
        let q: boolean[][] = [];
        try { q = (qrMatrix as (t: string, l?: string) => boolean[][])(link, "Q"); } catch (e) { c.expect(false, `level Q refused ${link}: ${String(e)}`); continue; }
        c.expect(dekode(q) === link, `the level-Q symbol for ${link} does not decode back to it`);
        c.expect(tingkat(q) === "Q", `the printed symbol declares level ${tingkat(q)}, not Q (D-160(b))`);
        const m = qrMatrix(link);
        c.expect(tingkat(m) === "M" && dekode(m) === link, `the default symbol is no longer level M (${tingkat(m)})`);
        c.note(`${link.length} characters: Q version ${(q.length - 17) / 4}, M version ${(m.length - 17) / 4}`);
      }
      let ditolak = false;
      try { (qrMatrix as (t: string, l?: string) => boolean[][])("A".repeat(300), "Q"); } catch { ditolak = true; }
      c.expect(ditolak, "an input past level Q's capacity was encoded anyway rather than refused");

      // the sheet asks for Q; the screen tile and the Digital Card keep M (the card is not this batch's to change)
      const kv = kode(baca(ctx.repoRoot, "src/components/sertifikat/KodeVerifikasi.tsx"));
      c.expect(/qrMatrix\(url, cetak \? "Q" : "M"\)/.test(kv), "the certificate's QR does not ask for level Q on the printed sheet only");
      const kartu = kode(baca(ctx.repoRoot, KARTU));
      c.expect(/<KodeVerifikasi url=\{cred\.verificationUrl\} label=\{s\("sertifikat\.periksa\.judul"\)\} cetak \/>/.test(kartu),
        "the sheet does not draw the printed (level Q) symbol");
      const kartuDigital = kode(baca(ctx.repoRoot, "src/components/aktifkan/IdentitasSaya.tsx"));
      c.expect(!/qrMatrix\([^)]*"Q"/.test(kartuDigital), "the Digital Card's symbol was moved off level M");
      return c.verdict("src/lib/qr.ts encodes byte mode at level Q as well as M: a verification link with the 43-character token, " +
        "at four lengths, decodes back exactly through jsQR and its format information reads Q; the default stays M; the printed " +
        "sheet asks for Q, the on-screen tile and the Digital Card keep M; past capacity is refused");
    },
  },
  {
    id: "B6C-SHEET-01",
    run: async (ctx) => {
      const c = new Checks();
      const css = kode(baca(ctx.repoRoot, "src/app/experience.css"));
      const globals = baca(ctx.repoRoot, "src/app/globals.css");
      // loaded here, so a checkout without the grammar fails this guard rather than the whole runner
      let lembar: typeof import("../src/lib/sertifikat-lembar");
      let slot: typeof import("../src/components/sertifikat/MerekSertifikat");
      try {
        lembar = await import("../src/lib/sertifikat-lembar");
        slot = await import("../src/components/sertifikat/MerekSertifikat");
      } catch (e) {
        c.expect(false, `the sheet's grammar (src/lib/sertifikat-lembar.ts) or its wordmark slot is missing: ${String(e).split("\n")[0]}`);
        return c.verdict("");
      }
      const L = lembar.LEMBAR;
      // the grammar's numbers are Daisy's
      c.expect(L.tepi === 20 && L.atas === 22 && L.garis === 176 && L.garisTebal === 0.75 && L.sisiPita === 10 && L.pitaTinggi === 34
        && L.rekamBawah === 16 && L.verifikasi === 236 && L.kolomTeks === 92 && L.celahQr === 12 && L.qr === 26 && L.tenang === 4,
        "src/lib/sertifikat-lembar.ts does not hold Daisy's grid");
      c.expect(lembar.GRUP_VERIFIKASI === 130 && lembar.KIRI_VERIFIKASI === 40, "the verification group is not 130 mm, centred");

      const mm = (v: number) => `${+v.toFixed(3)}mm`;
      const dari = (sel: string) => aturan(css, sel);
      const sheet = dari(".pin-sheet");
      c.expect(sheet.width === "210mm" && sheet.height === "297mm" && sheet.overflow === "hidden", `the sheet is not A4 in mm: ${JSON.stringify(sheet)}`);
      const kepala = dari(".pin-sheet .pin-s-kepala");
      c.expect(kepala.left === mm(L.tepi) && kepala.right === mm(L.tepi) && kepala.top === mm(L.atas)
        && kepala.display === "flex" && kepala["justify-content"] === "space-between" && kepala["align-items"] === "baseline",
        `the header is not the pair at 22 mm on the 20 mm margin, sharing one baseline: ${JSON.stringify(kepala)}`);
      const jenis = dari(".pin-sheet .pin-s-jenis");
      c.expect(jenis["font-size"] === "12pt" && jenis["text-transform"] === "uppercase" && jenis.color === "var(--cert-aksen)" && jenis["white-space"] === "nowrap",
        `«SERTIFIKAT PENGUASAAN» is not 12 pt capitals in the accent: ${JSON.stringify(jenis)}`);

      // the wordmark slot: one component, the cap height 3.15 mm, at least 15 mm wide.
      // RESTATED FOR D-192 (owner, 5 Nov: a text-only PINTAR wordmark, Arial, #075056; the supplied artwork no longer
      // used): the slot is «PINTAR» as live text at the size that gives the 3.15 mm cap height (Arial's capitals are
      // 0.716 of the size), its width measured as Arial's six capitals plus the tracking, never an image
      const merek = kode(baca(ctx.repoRoot, "src/components/sertifikat/MerekSertifikat.tsx"));
      const tinggiHuruf = slot.UKURAN_MEREK_MM * slot.RASIO_HURUF_KAPITAL;
      // Arial Bold's advance widths for P I N T A R (units of the size), plus 0.14 em of tracking between letters
      const lebarSlot = slot.UKURAN_MEREK_MM * ([0.667, 0.278, 0.722, 0.611, 0.722, 0.722].reduce((x, y) => x + y, 0) + 5 * 0.14);
      c.expect(slot.TINGGI_HURUF_MM === 3.15 && Math.abs(tinggiHuruf - 3.15) < 0.01, `the wordmark's cap height is ${tinggiHuruf.toFixed(3)} mm, not 3.15`);
      c.expect(lebarSlot >= 15, `the wordmark is ${lebarSlot.toFixed(1)} mm wide, under the 15 mm print minimum`);
      c.note(`wordmark ${lebarSlot.toFixed(1)} mm wide, cap height ${tinggiHuruf.toFixed(2)} mm`);
      c.expect(/import \{ NAMA_MEREK \} from "@\/components\/MerekPintar"/.test(merek) && /\{NAMA_MEREK\}/.test(merek) && !/<img\b|\/brand\//.test(merek),
        "the slot does not set the text wordmark «PINTAR» (D-192), or still places an image");
      const mk = dari(".pin-sheet .pin-s-merek");
      c.expect(mk["font-family"] === "var(--font-wordmark)" && mk["font-size"] === "var(--merek-ukuran)" && mk.color === "var(--merek-warna)"
        && mk["font-weight"] === "700" && mk.display === "block",
        `the slot is not the wordmark in its face, size and teal: ${JSON.stringify(mk)}`);
      c.expect(/--font-wordmark: Arial, Helvetica, sans-serif;/.test(globals) && /--merek-warna: #075056;/.test(globals),
        "the wordmark's face is not the device's Arial stack, or its colour is not #075056 (D-192)");
      const kartu = kode(baca(ctx.repoRoot, KARTU));
      c.expect(/import MerekSertifikat from "\.\/MerekSertifikat"/.test(kartu) && (kartu.match(/<MerekSertifikat \/>/g) ?? []).length === 1
        && !/<img\b/.test(kartu) && !/MerekPintar|KakiPintar/.test(kartu),
        "the certificate does not draw the wordmark through its one replaceable component, or draws a mark of its own");

      // the achievement
      const nama = dari(".pin-sheet .pin-name"), done = dari(".pin-sheet .pin-done"), kursus = dari(".pin-sheet .pin-course");
      const ukur = (v: string | undefined) => {
        if (!v) return NaN;
        const r = /^var\((--[a-z0-9-]+)\)$/.exec(v);
        let x = r ? token(globals, r[1]) : v;
        for (let i = 0; x && /^var\(/.test(x) && i < 4; i++) x = token(globals, /^var\((--[a-z0-9-]+)\)$/.exec(x)![1]);
        return !x ? NaN : x.endsWith("pt") ? parseFloat(x) : x.endsWith("px") ? pxKePt(x) : NaN;
      };
      c.expect(ukur(nama["font-size"]) === 33, `the name is ${ukur(nama["font-size"])} pt, not 33`);
      c.expect(ukur(done["font-size"]) === 12, `«telah menuntaskan» is ${ukur(done["font-size"])} pt, not 12`);
      c.expect(ukur(kursus["font-size"]) === 16.5, `the course is ${ukur(kursus["font-size"])} pt, not 16.5`);
      const capaian = dari(".pin-sheet .pin-s-capaian");
      c.expect(capaian.top === "36mm" && capaian["justify-content"] === "center" && capaian["text-align"] === "center",
        `the achievement is not centred from 36 mm: ${JSON.stringify(capaian)}`);

      // the record: labels right-aligned to the axis, ending 16 mm above the line's top edge
      const rekam = dari(".pin-sheet .pin-s-rekam");
      const bawahRekam = L.tinggi - L.garis + L.garisTebal / 2 + L.rekamBawah;
      c.expect(rekam.bottom === mm(bawahRekam) && rekam.left === "20mm" && rekam.width === "170mm" && rekam["grid-template-columns"] === "1fr 1fr"
        && rekam["align-items"] === "baseline", `the record is not one block on the axis ending 16 mm above the line: ${JSON.stringify(rekam)}`);
      c.expect(capaian.bottom === mm(bawahRekam + 30), `the achievement does not stop clear of the record: ${capaian.bottom}`);
      c.expect(dari(".pin-sheet .pin-s-rekam > div").display === "contents", "the record's rows do not share one axis");
      const dt = dari(".pin-sheet .pin-s-rekam dt");
      c.expect(dt["text-align"] === "right" && dt["font-size"] === "9pt" && dt["text-transform"] === "uppercase", `the record's labels: ${JSON.stringify(dt)}`);
      const nomor = dari(".pin-sheet .pin-s-rekam dd.pin-s-nomor");
      c.expect(nomor["font-family"] === "var(--font-mono)" && nomor["font-size"] === "12pt" && nomor["white-space"] === "nowrap" && nomor["word-break"] === "keep-all",
        `the number is not Plex Mono 12 pt, unbroken: ${JSON.stringify(nomor)}`);
      c.expect(/IBM Plex Mono/.test(token(globals, "--font-mono") ?? ""), "the mono face is not IBM Plex Mono");
      c.expect(dari(".pin-sheet .pin-s-rekam dd.pin-s-nomor-105")["font-size"] === "10.5pt" && dari(".pin-sheet .pin-s-rekam dd.pin-s-nomor-975")["font-size"] === "9.75pt",
        "the number's steps are not 10.5 and 9.75 pt");
      const tangga: Array<[string, number]> = [["7Q2Z0D9K/00001", 12], ["X".repeat(40), 12], ["X".repeat(50), 10.5], ["X".repeat(55), 9.75]];
      for (const [n, pt] of tangga) c.expect(lembar.ukuranNomor(n) === pt, `a ${n.length}-character number is set at ${lembar.ukuranNomor(n)} pt, not ${pt}`);

      // the line and the band
      const garis = dari(".pin-sheet .pin-s-garis");
      c.expect(garis.top === mm(L.garis - L.garisTebal / 2) && garis.height === mm(L.garisTebal) && garis.left === "10mm" && garis.width === "190mm"
        && garis.background === "var(--cert-emas)", `the gold line is not centred at 176 mm, 0.75 mm: ${JSON.stringify(garis)}`);
      const pita = dari(".pin-sheet .pin-s-pita");
      c.expect(pita.top === "176mm" && pita.height === "34mm" && pita.left === "10mm" && pita.width === "190mm" && pita.background === "var(--cert-aksen)",
        `the band is not 176-210 mm inset 10 mm in the accent: ${JSON.stringify(pita)}`);
      c.expect(dari(".pin-sheet .pin-s-label")["font-size"] === "9pt" && ukur(dari(".pin-sheet .pin-inst")["font-size"]) === 16.5,
        "«Diterbitkan oleh» is not 9 pt over the school at 16.5 pt");

      // the verification group
      const periksa = dari(".pin-sheet .pin-s-periksa");
      c.expect(periksa.left === "40mm" && periksa.top === "236mm" && periksa.width === "130mm" && periksa["grid-template-columns"] === "92mm 26mm"
        && periksa["column-gap"] === "12mm", `the verification group is not 92 + 12 + 26 mm at 236 mm: ${JSON.stringify(periksa)}`);
      c.expect(dari(".pin-sheet .pin-s-qr").width === "26mm" && dari(".pin-sheet .pin-s-qr").height === "26mm", "the QR is not 26 mm");
      c.expect(dari(".pin-sheet .pin-s-teks p.pin-s-tautan")["overflow-wrap"] === "anywhere", "the printed link cannot wrap inside its column");

      // the accents
      c.expect(token(globals, "--cert-akademik")?.toUpperCase() === "#725471" && token(globals, "--cert-profesi")?.toUpperCase() === "#446A4B"
        && token(globals, "--cert-emas") === "var(--kartu-emas)" && token(globals, "--kartu-emas")?.toUpperCase() === "#C09C4F",
        "the accents are not Daisy's, or the gold line is not the card's own #C09C4F (sertifikat ronde-2 §6: «0.75 mm, the card's»)");
      c.expect(dari(".pin-sheet.pin-s-akademik")["--cert-aksen"] === "var(--cert-akademik)" && dari(".pin-sheet.pin-s-profesi")["--cert-aksen"] === "var(--cert-profesi)",
        "the accent does not follow the learning context");

      // nothing at phone width narrows the paper
      const ponsel = [...css.matchAll(/@media \(max-width: 560px\) \{([\s\S]*?)\n\}/g)].map((m) => m[1]).join("\n");
      c.expect(!/\.pin-sheet|\.pin-s-/.test(ponsel), "a phone rule reaches into the A4 sheet, which is scaled whole and never reflowed");

      // the rendered structure, in order
      const { html, galat } = gambar(ctx.repoRoot, [
        { variant: "sheet", cred: CRED },
        { variant: "sheet", konteks: "profesi", cred: { ...CRED, certificateNumber: "X".repeat(55) } },
      ]);
      if (!c.expect(galat === "", `the sheet could not be rendered: ${galat}`)) return c.verdict("");
      const [a, p] = html;
      const urut = ["pin-sheet pin-s-akademik", "pin-s-kepala", "pin-s-jenis", "pin-s-merek", "pin-s-capaian", "pin-name", "pin-done", "pin-course",
        "pin-s-rekam", "pin-s-nomor", "pin-s-garis", "pin-s-pita", "pin-s-label", "pin-inst", "pin-s-periksa", "pin-s-tautan", "pin-s-qr"];
      let at = -1;
      for (const k of urut) {
        const i = a.indexOf(`class="${k}`, at + 1);
        c.expect(i > at, `the sheet's «${k}» is missing or out of Daisy's order`);
        if (i > at) at = i;
      }
      c.expect(/<h1 class="pin-name">Bagas Saputra<\/h1>/.test(a) && /<p class="pin-done">telah menuntaskan<\/p>/.test(a)
        && a.includes("Matematika · Bab 4"), "the achievement is not the name, «telah menuntaskan», the course (the dot kept with its subject)");
      c.expect(/<p class="pin-s-jenis">Sertifikat Penguasaan<\/p>/.test(a), "the header's title is not sertifikat.jenis");
      c.expect(/<p class="pin-s-label">Diterbitkan oleh<\/p><p class="pin-inst">SMP Cahaya Kaliandra<\/p>/.test(a),
        "the band is not «Diterbitkan oleh» over the school's name as recorded");
      c.expect(/<dd class="pin-s-nomor">7Q2Z0D9K\/00001<\/dd>/.test(a), "the number is not one unbroken value at 12 pt");
      c.expect(p.includes("pin-sheet pin-s-profesi") && p.includes(`<dd class="pin-s-nomor pin-s-nomor-975">${"X".repeat(55)}</dd>`),
        "a professional-learning sheet is not sage, or a 55-character number did not step down to 9.75 pt");
      return c.verdict("the sheet is Daisy's frozen composition, measured: A4 in mm; the header pair at 22 mm on the 20 mm margin, the title " +
        "12 pt in the accent and the wordmark slot (one component, today's approved logo) at a 3.15 mm cap height, ≥ 15 mm wide, on its " +
        "baseline; name 33 pt, «telah menuntaskan» 12 pt, course 16.5 pt; the record on the axis ending 16 mm above the line, the number " +
        "Plex Mono 12 pt unbroken and stepping 12 → 10.5 → 9.75 pt; the gold line centred at 176 mm, 0.75 mm; the band 176-210 mm inset 10 mm; " +
        "the verification group 92 + 12 + 26 mm at 236 mm; plum or sage by learning context; nothing at phone width narrows it");
    },
  },
  {
    id: "B6C-PRINT-01",
    run: async (ctx) => {
      const c = new Checks();
      const css = kode(baca(ctx.repoRoot, "src/app/experience.css"));
      const halaman = /@page sertifikat\s*\{([^}]*)\}/.exec(css)?.[1] ?? "";
      c.expect(/size:\s*A4 portrait/.test(halaman) && /margin:\s*0\s*(;|$)/.test(halaman), `there is no @page sertifikat A4 portrait with margin 0: "${halaman.trim()}"`);
      const cetak = blokCetak(css);
      if (!c.expect(cetak.length > 0, "no print block holds the sheet")) return c.verdict("");
      const s = aturan(cetak, ".pin-sheet");
      c.expect(s.page === "sertifikat" && s.width === "210mm" && s.height === "297mm" && s["max-height"] === "100vh" && s["break-inside"] === "avoid"
        && s["print-color-adjust"] === "exact" && s["-webkit-print-color-adjust"] === "exact" && s.transform === "none !important" && s.overflow === "hidden",
        `the printed sheet is not exactly the paper on its own page, with its colours: ${JSON.stringify(s)}`);
      c.expect(aturan(cetak, ".pin-noprint").display === "none !important", ".pin-noprint does not step aside in print");
      c.expect(aturan(cetak, "body:has(.pin-printwell) > :not(:has(.pin-printwell))").display === "none !important"
        && aturan(cetak, ".pin-col:has(> .pin-printwell) > :not(.pin-printwell)").display === "none !important",
        "a page that holds the sheet still prints something beside it");
      c.expect(aturan(css.replace(cetak, ""), ".pin-sheet")["print-color-adjust"] === "exact", "the sheet's colours are not kept in every context");

      // every part of the page around the sheet is pin-noprint (the ISSUED branch's direct children of <main>)
      const hal = kode(baca(ctx.repoRoot, HALAMAN));
      const terbit = hal.slice(hal.lastIndexOf('<main id="isi"'));
      c.expect(/<div className=\{issued \? "pin-noprint" : undefined\}>\s*<KartuSertifikat cred=\{cred\} locale=\{bahasaSertifikat\} \/>/.test(terbit),
        "the on-screen card prints ahead of the sheet");
      c.expect(/<div className="pin-actions pin-noprint">/.test(terbit) && /<div className="pin-head pin-noprint"/.test(terbit)
        && /<div className="pin-noprint">\s*<BarisLingkup /.test(terbit) && /<KakiPintar className="pin-noprint" \/>/.test(terbit)
        && /<div className="pin-banner pin-neutral pin-noprint"/.test(terbit) && /<div className="pin-banner pin-info pin-noprint"/.test(terbit),
        "a part of the page around the sheet (actions, the print heading, the scope line, the footer, a banner) is not pin-noprint");
      c.expect(/const back = \(\s*<Link className="pin-back pin-noprint"/.test(hal), "the way back prints");

      // one action, which names the saved file for the course, never the person
      c.expect((terbit.match(/<AksiCetak /g) ?? []).length === 1 && /<AksiCetak label=\{s\("sertifikat\.cetak"\)\} judulBerkas=\{judulBerkas\} \/>/.test(terbit),
        "there is not one print action naming its file");
      c.expect(t("sertifikat.cetak", "learner", { locale: "id" }) === "Cetak atau simpan PDF", "the action is not «Cetak atau simpan PDF»");
      // RESTATED FOR E-D2-1: the same title, made a name every system can hold (namaBerkas; D168-D2-1 executes it)
      c.expect(/const judulBerkas = namaBerkas\(t\("sertifikat\.berkas", "learner", \{ locale: bahasaSertifikat \}\)\.replace\("\{kursus\}", course\)\)/.test(hal),
        "the file name is not the certificate's own words with its course");
      const aksi = kode(baca(ctx.repoRoot, "src/components/sertifikat/AksiCetak.tsx"));
      c.expect(/addEventListener\("beforeprint"/.test(aksi) && /addEventListener\("afterprint"/.test(aksi) && /document\.title = judulBerkas/.test(aksi)
        && /document\.title = semula/.test(aksi) && /window\.print\(\)/.test(aksi), "printing does not name the file and give the tab its title back");
      for (const loc of ["id", "en"] as const) {
        const b = t("sertifikat.berkas" as HleEvent, "learner", { locale: loc });
        c.expect(b.includes("{kursus}") && !/nama|name/i.test(b) && b.length > 12, `the file name's words (${loc}) are not the course's: ${b}`);
      }
      c.expect(t("sertifikat.penerbit" as HleEvent, "learner", { locale: "id" }) === "Diterbitkan oleh"
        && t("sertifikat.penerbit" as HleEvent, "learner", { locale: "en" }) === "Issued by", "«Diterbitkan oleh» is not the certificate's own key");
      const en = t("sertifikat.diberikan", "learner", { locale: "en" });
      c.expect(t("sertifikat.diberikan", "learner", { locale: "id" }) === "telah menuntaskan" && en !== "has completed" && /mastery/.test(en),
        `the English of «telah menuntaskan» still underclaims: «${en}» (Daisy §4)`);
      return c.verdict("printing the certificate yields one A4 page: the sheet takes @page sertifikat (A4 portrait, margin 0), is exactly " +
        "210 × 297 mm, never breaks and keeps its colours; a page holding it prints nothing else, and every part around it is pin-noprint; " +
        "one action «Cetak atau simpan PDF» names the saved file «Sertifikat Penguasaan · <course>» and gives the tab its title back; " +
        "«Diterbitkan oleh» and the English of «telah menuntaskan» are the certificate's own keys");
    },
  },
  {
    id: "B6C-FOTO-01",
    run: async (ctx) => {
      const c = new Checks();
      for (const f of [KARTU, HALAMAN, "src/components/sertifikat/MerekSertifikat.tsx", "src/components/sertifikat/KodeVerifikasi.tsx",
        "src/components/sertifikat/LembarA4.tsx", "src/lib/sertifikat-lembar.ts"]) {
        const k = kode(baca(ctx.repoRoot, f));
        c.expect(k.length > 0, `${f} is missing`);
        c.expect(!/photo|foto|avatar/i.test(k.replace(/NAME_ONLY/g, "")), `${f} reaches for a photograph (D-085 T4, D-086(e))`);
        c.expect(!/markUrl|logo_url|logoUrl/.test(k.replace(/markUrl\?: string \| null;/, "")), `${f} draws a school mark (D-160(c))`);
      }
      const { html, galat } = gambar(ctx.repoRoot, [
        { variant: "sheet", cred: { ...CRED, markUrl: "https://sekolah.example/logo.png", photo_path: "foto/bagas.jpg" } },
      ]);
      if (!c.expect(galat === "", `the sheet could not be rendered: ${galat}`)) return c.verdict("");
      const a = html[0];
      const img = [...a.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]);
      // RESTATED FOR D-192: the wordmark is text, so the sheet draws no image at all (no photograph, no school mark, no logo)
      c.expect(img.length === 0 && /<span class="pin-s-merek"[^>]*>PINTAR<\/span>/.test(a),
        `the sheet draws an image, or its wordmark is not the text «PINTAR»: ${JSON.stringify(img)}`);
      const svg = [...a.matchAll(/<svg\b[^>]*>/g)];
      c.expect(svg.length === 1 && a.lastIndexOf("<svg") > a.indexOf("pin-s-qr"), "the sheet draws a picture other than the QR");
      c.expect(!/logo\.png"[^>]*sekolah|sekolah\.example|bagas\.jpg|<image\b|<picture\b|<canvas\b|background-image/.test(a), "the sheet carries a school logo or a photograph");
      const css = kode(baca(ctx.repoRoot, "src/app/experience.css"));
      const sheetCss = [...css.matchAll(/(?:^|\})\s*([^{}]*\.pin-s(?:heet|-)[^{}]*)\{([^}]*)\}/g)].map((m) => m[2]).join(";");
      c.expect(!/(?:^|;)\s*border(?:-[a-z]+)?\s*:/.test(sheetCss) && !/url\(|background-image|watermark/.test(sheetCss),
        "the sheet's rules draw a border, an image or a watermark");
      c.expect(!/tanda tangan|ttd|stempel|cap sekolah|signature|seal/i.test(teks(a)), "the sheet carries a signature or a seal");
      return c.verdict("no photograph of the holder and no school logo: the certificate's component, page and parts never read a photo or a " +
        "mark URL, and the rendered sheet (given both) draws exactly two pictures, the wordmark slot's approved logo and the QR; its rules " +
        "draw no border, image or watermark, and it carries no signature or seal");
    },
  },
  {
    id: "B6C-DATA-01",
    run: async (ctx) => {
      const c = new Checks();
      const hal = kode(baca(ctx.repoRoot, HALAMAN));
      c.expect(/const verificationUrl = issued\s*\?\s*`\$\{appUrl\(\)\}\/verifikasi\/\$\{encodeURIComponent\(detail\.verification_token\)\}`\s*:\s*null;/.test(hal),
        "the verification URL is no longer the one the page built (appUrl + /verifikasi/ + the token)");
      c.expect(/const issued = rendersVerification\(detail\.status\);/.test(hal), "the issued state no longer comes from rendersVerification");
      const terbit = hal.slice(hal.indexOf("{issued ? ("));
      c.expect(/\{issued \? \([\s\S]*<LembarA4>\s*<KartuSertifikat cred=\{cred\} locale=\{bahasaSertifikat\} variant="sheet" konteks=\{konteks\} \/>\s*<\/LembarA4>[\s\S]*\) : null\}/.test(terbit),
        "the sheet is not rendered for an issued certificate only");
      c.expect(/\{detail\.status === "REVOKED" \? \(\s*<div className="pin-banner pin-neutral pin-noprint" role="status">[\s\S]*sertifikat\.dicabut\.judul/.test(hal),
        "a revoked certificate no longer shows its «dicabut» banner");
      c.expect(/const konteks: KonteksSertifikat = "akademik";/.test(hal), "the sheet's learning context is not stated where the page builds it");
      for (const k of ["nameAsIssued: detail.name_as_issued", "predikat: detail.predikat", "issuedAtIso: detail.issued_at_iso",
        "certificateNumber: detail.certificate_number", "verificationUrl,", "institution,", "course,"]) {
        c.expect(hal.includes(k), `the credential no longer carries «${k}»`);
      }

      const revoked = { ...CRED, verificationUrl: null };
      const { html, galat } = gambar(ctx.repoRoot, [
        { variant: "sheet", cred: CRED }, { variant: "sheet", cred: revoked }, { variant: "screen", cred: revoked }, { variant: "sheet", cred: { ...CRED, predikat: null } },
      ]);
      if (!c.expect(galat === "", `the certificate could not be rendered: ${galat}`)) return c.verdict("");
      const [a, r, rs, tanpa] = html;
      const svg = /<div class="pin-s-qr"><svg[\s\S]*?<\/svg>/.exec(a)?.[0] ?? "";
      const qr = bacaQr(svg);
      c.expect(qr.teks === CRED.verificationUrl, `the sheet's QR decodes to ${JSON.stringify(qr.teks)}, not the verification URL`);
      c.note(`the sheet's QR: ${qr.n} modules, version ${(qr.n - 17) / 4}`);
      c.expect(a.includes(`<p class="pin-s-tautan">${CRED.verificationUrl.replace("https://", "")}</p>`), "the printed link is not the verification URL without https://");
      for (const [h, nama] of [[r, "the sheet"], [rs, "the screen"]] as const) {
        c.expect(!/<svg|pin-s-tautan|pin-chip|verifikasi\//.test(h), `${nama} of a certificate that is not issued shows a QR or a link`);
      }
      const v = teks(a);
      for (const x of ["Bagas Saputra", "Matematika · Bab 4", "SMP Cahaya Kaliandra", "7Q2Z0D9K/00001", "Predikat Baik", "Tanggal terbit 6 Oktober 2026"]) {
        c.expect(v.includes(x), `the sheet does not read «${x}» from the credential`);
      }
      c.expect(!teks(tanpa).includes("Predikat") && !/—/.test(teks(tanpa)), "a certificate with no descriptor draws a descriptor line");
      return c.verdict("the data rules are unchanged: the sheet renders only for ISSUED, a revoked or other non-issued certificate shows no QR " +
        "or link on screen or sheet and keeps its «dicabut» banner; the verification URL is the page's own (appUrl + /verifikasi/ + the token), " +
        "the sheet's QR decodes to it exactly and the printed link is it without https://; name, course, school, number, date and descriptor are the credential's");
    },
  },
];
