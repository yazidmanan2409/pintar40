/**
 * D1 step 2 (DAISY-37; Daisy's `D1/STEP-2.md`, accepted for design 4 Nov; the test plan
 * docs/completion-4.0/daisy-design-completion/05-D1-IMPLEMENTATION-TEST-PLAN.md §2). The six identity emails in the
 * DAISY-19 frame, with what step 1 found missing: the reason directly under the heading, the context line where the
 * data carries a place (and nothing in its stead where it does not), warm white and the gold line, and in the card
 * email the PINTAR Card as live-text table HTML built from the Digital Card's own lines (susunKartu).
 *
 * Every check renders the real templates (src/components/email/identitas.ts, keamanan.ts) through the real frame
 * (bingkai.ts), as DAISY-19-EMAIL-01 and DAISY-20-EMAIL-01 do. Daisy's answers (`9c12c6ef`): P2 (a), today's logo is
 * the card block's one image until F-11, its alt «PINTAR»; P3, the header keeps today's 104 × 58 logo; P4, the card's
 * border is the frame's `garis`. The browser half (320 px, images blocked, the keyboard order) is audit/d1-email.mjs.
 *
 *   D1E-K02  the reason line is the first text after the <h1>, in all eight; the footer no longer repeats it
 *   D1E-K03  the context line: the card email shows it; the other six show no context element and no stand-in text
 *   D1E-K04  its form: every place, alphabetically, joined by «, » and «dan», never a role
 *   D1E-K05  the card block: roles in susunKartu's order for every permutation, the band in the first role's family
 *   D1E-K06  the card block is a table: no QR, no back, no image but today's logo (alt «PINTAR»)
 *   D1E-K07  slot geometry: the header keeps 104 × 58; the card's slot is 96 × 32; no placeholder label is ever sent
 *   D1E-K08  the card's top edge is 3 px gold (--kartu-emas), light and dark; the card is warm white (--surface-0)
 *   D1E-K10  the plain text: heading, reason, context line where present, the card as name, ID and role lines
 *   D1E-K12  AA contrast for every new text pair, light and dark, the band text on each of the five families
 *   D1E-K14  the card block's lines are susunKartu's; identitas.ts lays out no role line of its own
 *   D1E-K15  the four email data types keep their fields (D-164(b))
 *   D1E-K16  every colour the frame and the card block use is a token, but the code box's border
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";
import { format, t, type HleEvent } from "../src/lib/hle";
import type { KonteksEmail } from "../src/lib/email/templat";
import { WARNA, WARNA_MEREK } from "../src/components/email/bingkai";
import { templatKode, templatKartu, templatPemulihan, templatPasswordDiubah } from "../src/components/email/identitas";
import { templatKeamanan } from "../src/components/email/keamanan";
import type { DataEmailKartu } from "../src/lib/email/identitas";
import { susunKartu } from "../src/lib/kartu-pintar";

import { struktur } from "./email.test";

const PRODUKSI: KonteksEmail = { asal: "https://app.pintarselalu.com", staging: false };
const kata = (k: HleEvent) => t(k, "public", { locale: "id" });
const NAMA = "Nadia Putri Maharani";
const SEKOLAH_A = "SMP Cahaya Kaliandra", SEKOLAH_B = "SMA Negeri 1 Contoh";
const kartuData = (konteks: DataEmailKartu["konteks"]): DataEmailKartu => ({
  nama: NAMA, pintarId: "A14CD7ST", tautanId: "https://app.pintarselalu.com/id/A14CD7ST", konteks, tautanAkun: "https://app.pintarselalu.com/akun",
});
const SATU = kartuData([{ peran: "EDUCATOR", institusi: SEKOLAH_A }]);
const DUA = kartuData([{ peran: "HEAD_OF_DEPARTMENT", institusi: SEKOLAH_B }, { peran: "EDUCATOR", institusi: SEKOLAH_A }]);
const WAKTU = "2026-11-04T08:30:00Z";

/** The eight specimens of Daisy's matrix, from the real templates. */
export function spesimen() {
  return [
    { nama: "1 activation", alasan: "email.kode.alasan", tempat: [], e: templatKode({ kode: "482913", berlakuMenit: 10, nama: NAMA, ulang: false }, PRODUKSI) },
    { nama: "2 resend", alasan: "email.kode.alasan", tempat: [], e: templatKode({ kode: "482913", berlakuMenit: 10, nama: NAMA, ulang: true }, PRODUKSI) },
    { nama: "3 recovery", alasan: "email.pulih.alasan", tempat: [], e: templatPemulihan({ kode: "482913", berlakuMenit: 60, nama: NAMA }, PRODUKSI) },
    { nama: "4 password changed", alasan: "email.diubah.alasan", tempat: [], e: templatPasswordDiubah({ nama: NAMA, waktu: WAKTU, tautanLupa: "https://app.pintarselalu.com/lupa" }, PRODUKSI) },
    { nama: "5 the card (one role)", alasan: "email.kartu.alasan", tempat: [SEKOLAH_A], e: templatKartu(SATU, PRODUKSI) },
    { nama: "5b the card (two roles, two schools)", alasan: "email.kartu.alasan", tempat: [SEKOLAH_B, SEKOLAH_A], e: templatKartu(DUA, PRODUKSI) },
    { nama: "6 security (owner)", alasan: "email.aman.alasan", tempat: [], e: templatKeamanan({ peristiwa: "TERKUNCI", untuk: "PEMILIK", pintarId: "A14CD7ST", waktu: WAKTU, tautanLupa: "https://app.pintarselalu.com/lupa" }, PRODUKSI) },
    { nama: "6b security (recipient)", alasan: "email.aman.alasan_admin", tempat: [], e: templatKeamanan({ peristiwa: "TERKUNCI", untuk: "ADMIN", pintarId: "A14CD7ST", waktu: WAKTU, tautanLupa: "https://app.pintarselalu.com/lupa" }, PRODUKSI) },
  ] as const;
}

const teksDari = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
const rata = (s: string) => s.replace(/\s+/g, " ");
/** the part of the HTML after the heading and before the first body block */
const setelahJudul = (html: string) => html.slice(html.indexOf("</h1>") + 5);
const kaki = (html: string) => html.slice(html.indexOf('class="pin-kaki"'));
const kartuBlok = (html: string) => { const i = html.indexOf('class="pin-kartu-pintar"'); return i < 0 ? "" : html.slice(html.lastIndexOf("<table", i), html.indexOf("</table></td></tr></table>", i) + 26); };

const lum = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const rasio = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
function tokens(css: string): Record<string, string> {
  const root = css.slice(css.indexOf(":root"), css.indexOf("}", css.indexOf(":root")));
  return Object.fromEntries([...root.matchAll(/(--[a-z0-9-]+):\s*(#[0-9A-Fa-f]{6})\b/g)].map((m) => [m[1], m[2]]));
}

export const d1Tests: SelfTest[] = [
  {
    id: "D1E-K02",
    requires: [],
    run: async () => {
      const c = new Checks();
      for (const s of spesimen()) {
        const alasan = kata(s.alasan as HleEvent);
        const sesudah = teksDari(setelahJudul(s.e.html));
        c.expect(sesudah.startsWith(teksDari(alasan)), `${s.nama}: the first text after the heading is «${sesudah.slice(0, 60)}», not its reason`);
        c.expect(/<p class="pin-alasan"/.test(setelahJudul(s.e.html).slice(0, 400)), `${s.nama}: the reason is not the reason line under the heading`);
        c.expect(!teksDari(kaki(s.e.html)).includes(teksDari(alasan)), `${s.nama}: the footer still repeats the reason`);
      }
      return c.verdict("in all eight identity emails the reason line (each email's own email.*.alasan) is the first text under the <h1>, and the footer no longer repeats it");
    },
  },
  {
    id: "D1E-K03",
    requires: [],
    run: async () => {
      const c = new Checks();
      const awal = kata("email.bingkai.konteks");
      c.expect(awal !== "" && !/TANPA|\?\?/.test(awal), "the context line has no words in the copy table");
      for (const s of spesimen()) {
        const ada = /class="pin-konteks"/.test(s.e.html);
        if (s.tempat.length) c.expect(ada && teksDari(s.e.html).includes(awal), `${s.nama}: the card email has no context line`);
        else {
          c.expect(!ada, `${s.nama}: a context line is drawn though the data carries no place`);
          c.expect(!teksDari(s.e.html).includes(awal) && !s.e.teks.includes(awal), `${s.nama}: a stand-in context text is written where the data has no place`);
        }
      }
      // a card whose only role has no school (Admin platform) has no place either: no line
      const platform = templatKartu(kartuData([{ peran: "SYSTEM_ADMIN", institusi: null }]), PRODUKSI);
      c.expect(!/class="pin-konteks"/.test(platform.html), "a card with no school draws a context line");
      return c.verdict("the card email shows the context line; activation, resend, recovery, password changed and both security notices, and a card with no school, show no context element and no stand-in words");
    },
  },
  {
    id: "D1E-K04",
    requires: [],
    run: async () => {
      const c = new Checks();
      const awal = kata("email.bingkai.konteks"), dan = kata("email.bingkai.konteks.dan");
      const baris = (e: { html: string }) => teksDari(/<p class="pin-konteks"[^>]*>([\s\S]*?)<\/p>/.exec(e.html)?.[1] ?? "");
      c.expect(baris(templatKartu(SATU, PRODUKSI)) === `${awal} ${SEKOLAH_A}.`, `one place reads «${baris(templatKartu(SATU, PRODUKSI))}»`);
      c.expect(baris(templatKartu(DUA, PRODUKSI)) === `${awal} ${SEKOLAH_B} ${dan} ${SEKOLAH_A}.`, `two places read «${baris(templatKartu(DUA, PRODUKSI))}»`);
      // alphabetical whatever the data's order; three places joined by «, » and «dan»; a school named twice once
      const tiga = kartuData([{ peran: "DEAN", institusi: "Universitas Contoh" }, { peran: "EDUCATOR", institusi: SEKOLAH_A }, { peran: "HEAD_OF_DEPARTMENT", institusi: SEKOLAH_A }, { peran: "INSTITUTION_ADMIN", institusi: SEKOLAH_B }]);
      const tigaBaris = baris(templatKartu(tiga, PRODUKSI));
      c.expect(tigaBaris === `${awal} ${SEKOLAH_B}, ${SEKOLAH_A} ${dan} Universitas Contoh.`, `three places read «${tigaBaris}»`);
      for (const p of ["EDUCATOR", "HEAD_OF_DEPARTMENT", "DEAN", "INSTITUTION_ADMIN", "SYSTEM_ADMIN"]) {
        c.expect(!tigaBaris.includes(t(`role.${p}` as HleEvent, "public", { locale: "id" })), `the context line names a role (${p})`);
      }
      return c.verdict("the context line names every place once, alphabetically (SMA … , SMP … dan Universitas …), joined by «, » and «dan», ending in a full stop, and names no role");
    },
  },
  {
    id: "D1E-K05",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const css = readFileSync(join(repoRoot, "src/app/globals.css"), "utf8");
      const tok = tokens(css);
      const peran = ["EDUCATOR", "HEAD_OF_DEPARTMENT", "DEAN"] as const;
      const permutasi = (a: readonly string[]): string[][] => a.length <= 1 ? [[...a]] : a.flatMap((x, i) => permutasi([...a.slice(0, i), ...a.slice(i + 1)]).map((p) => [x, ...p]));
      for (const urut of permutasi(peran)) {
        const data = kartuData(urut.map((p) => ({ peran: p as "EDUCATOR", institusi: SEKOLAH_A })));
        const blok = kartuBlok(templatKartu(data, PRODUKSI).html);
        const harap = susunKartu(data.konteks).baris.map((b) => [b.peran, b.sekolah].filter(Boolean).join(" · "));
        const dapat = [...blok.matchAll(/<p class="pin-kartu-baris"[^>]*>([\s\S]*?)<\/p>/g)].map((m) => teksDari(m[1]));
        c.expect(JSON.stringify(dapat) === JSON.stringify(harap), `${urut.join(", ")}: the block reads ${JSON.stringify(dapat)}, the card ${JSON.stringify(harap)}`);
        c.expect(dapat[0]?.startsWith(t("role.DEAN", "public", { locale: "id" })), `${urut.join(", ")}: «Dekan» is not first`);
        c.expect(new RegExp(`bgcolor="${tok["--kartu-dekan"]}"`, "i").test(blok), `${urut.join(", ")}: the band is not Dekan's family colour (--kartu-dekan)`);
      }
      // two schools: one line per role and school, alphabetical; the colour is the first role's (Guru)
      const dua = kartuBlok(templatKartu(DUA, PRODUKSI).html);
      const baris = [...dua.matchAll(/<p class="pin-kartu-baris"[^>]*>([\s\S]*?)<\/p>/g)].map((m) => teksDari(m[1]));
      c.expect(JSON.stringify(baris) === JSON.stringify([`${t("role.EDUCATOR", "public", { locale: "id" })} · ${SEKOLAH_A}`, `${t("role.HEAD_OF_DEPARTMENT", "public", { locale: "id" })} · ${SEKOLAH_B}`]),
        `two roles at two schools read ${JSON.stringify(baris)}`);
      c.expect(new RegExp(`bgcolor="${tok["--kartu-guru"]}"`, "i").test(dua), "two roles at two schools: the band is not the first role's (Guru)");
      return c.verdict("the card block draws susunKartu's lines for every order of Dekan, Guru and Kepala departemen («Dekan · Guru · Kepala departemen», the school beneath) in Dekan's family colour; two roles at two schools are one line each, alphabetical, in Guru's colour");
    },
  },
  {
    id: "D1E-K06",
    requires: [],
    run: async () => {
      const c = new Checks();
      for (const data of [SATU, DUA]) {
        const e = templatKartu(data, PRODUKSI);
        const blok = kartuBlok(e.html);
        c.expect(/^<table class="pin-kartu-pintar" role="presentation"/.test(blok), "the card is not a presentation table");
        const gambar = [...blok.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]);
        // RESTATED FOR D-192: the card's wordmark is the text «PINTAR» in #075056; the block draws no image at all
        c.expect(gambar.length === 0 && new RegExp(`<span class="pin-merek-kartu" style="[^"]*color:${WARNA_MEREK};">${kata("email.bingkai.merek")}</span>`).test(blok),
          `the card block draws ${gambar.length} image(s), or its wordmark is not the text «PINTAR» in ${WARNA_MEREK}`);
        c.expect(!/qr|<svg|data:image|tautanId|\/id\/A14CD7ST/i.test(blok), "the card block carries a QR, a drawing or the QR's target");
        c.expect(!/rincian/.test(setelahJudul(e.html).slice(0, e.html.indexOf('class="pin-kaki"'))), "the card email still lays its facts out as detail rows");
        c.expect(teksDari(blok).includes(NAMA) && teksDari(blok).includes("A14C D7ST"), "the card block does not carry the name and the ID 4 + 4 as text");
      }
      return c.verdict("the card in the email is one presentation table of live text (name, ID 4 + 4, the roles): no QR, no back, no QR target, and no image: its wordmark is the text «PINTAR» in #075056 (D-192); the detail rows are gone");
    },
  },
  {
    id: "D1E-K07",
    requires: [],
    run: async () => {
      const c = new Checks();
      for (const s of spesimen()) {
        // RESTATED FOR D-192: P3's header logo is replaced by the text wordmark
        c.expect(/<span class="pin-merek-teks" [^>]*>PINTAR<\/span>/.test(s.e.html) && !/<img\b/.test(s.e.html), `${s.nama}: the header is not the text wordmark «PINTAR», or an image is sent`);
        c.expect(!/master pending|F-11|placeholder/i.test(s.e.html) && !/master pending|F-11/i.test(s.e.teks), `${s.nama}: a design-time placeholder label is sent`);
      }
      const blok = kartuBlok(templatKartu(SATU, PRODUKSI).html);
      c.expect(/<td class="pin-slot-kartu" width="96" height="32"[^>]*style="[^"]*width:96px;height:32px;/.test(blok), "the card's wordmark slot is not 96 × 32");
      c.expect(/<td class="pin-slot-kartu"[^>]*><span class="pin-merek-kartu" style="[^"]*font-size:13px;line-height:16px;font-weight:700;/.test(blok), "the card's slot does not hold the text wordmark (D-192)");
      return c.verdict("every email's header is the text wordmark «PINTAR» and no image is sent (D-192); the card's slot is 96 × 32 holding the text wordmark; no «master pending F-11» label reaches any HTML or plain text");
    },
  },
  {
    id: "D1E-K08",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const tok = tokens(readFileSync(join(repoRoot, "src/app/globals.css"), "utf8"));
      c.expect(WARNA.terang.kartu.toUpperCase() === tok["--surface-0"]?.toUpperCase(), `the card is ${WARNA.terang.kartu}, not warm white (--surface-0 ${tok["--surface-0"]})`);
      c.expect((WARNA.terang as Record<string, string>).emas?.toUpperCase() === tok["--kartu-emas"]?.toUpperCase(), "the frame has no gold (--kartu-emas)");
      for (const s of spesimen()) {
        c.expect(new RegExp(`class="pin-kartu"[^>]*border-top:3px solid ${tok["--kartu-emas"]}`, "i").test(s.e.html), `${s.nama}: the card's top edge is not 3 px gold`);
        c.expect(/\.pin-kartu \{ border-top-color: #C09C4F !important; \}/i.test(s.e.html), `${s.nama}: the gold line is not kept on dark`);
      }
      return c.verdict("every email's card is warm white (--surface-0) with a 3 px gold top edge (--kartu-emas), kept on dark");
    },
  },
  {
    id: "D1E-K01",
    requires: [],
    run: async () => {
      const c = new Checks();
      /**
       * E-RB-7 (D1 STEP-2 lines 1, 10, 11; reverse reconciliation): ONE SHELL FOR ALL EIGHT, AND THE PLAIN TEXT IS
       * COMPLETE. The frame's structure was checked on three emails only; recovery, password-changed and both security
       * emails had none. Each of the eight, rendered from its real template: the frame's structure (one h1, lang, no
       * script or web font, https links only, presentation tables, the 600 px column and the Outlook table, alt text);
       * the plain text carries every action link the HTML offers and the frame's footer; and the recovery code's
       * duration follows berlakuMenit, as activation's does.
       */
      for (const s of spesimen()) {
        const salah = struktur(s.e.html);
        c.expect(salah.length === 0, `${s.nama}: the frame's structure — ${salah.join("; ")}`);
        const aksi = [...s.e.html.matchAll(/<a class="pin-tombol-a" href="(https:[^"]+)"/g)].map((m) => m[1]);
        c.expect(aksi.every((h) => s.e.teks.includes(h)), `${s.nama}: the plain text lacks an action the HTML offers (${aksi.join(", ")})`);
        const kakiTeks = s.e.teks.slice(s.e.teks.indexOf("\n--\n"));
        c.expect(kakiTeks.includes("PT ZAYD PINTAR SELALU") && kakiTeks.includes("info@pintarselalu.com"), `${s.nama}: the plain text's footer is incomplete`);
      }
      for (const m of [15, 60, 1440]) {
        const e = templatPemulihan({ kode: "482913", berlakuMenit: m, nama: NAMA }, PRODUKSI);
        const d = format.durasi(m * 60, "id");
        c.expect(e.teks.includes(d) && teksDari(e.html).includes(d), `recovery at ${m} minutes does not say «${d}»`);
      }
      return c.verdict("renders all eight identity emails from their real templates: each passes the frame's structure, its plain text carries every action link of the HTML and the frame's footer, and the recovery code's stated duration follows berlakuMenit at 15, 60 and 1440 minutes");
    },
  },
  {
    id: "D1E-K10",
    requires: [],
    run: async () => {
      const c = new Checks();
      for (const s of spesimen()) {
        const teks = s.e.teks;
        const judul = teks.indexOf(s.e.html.match(/<h1[^>]*>([^<]*)<\/h1>/)![1].replace(/&amp;/g, "&").split(" ")[0]);
        const alasan = rata(teks).indexOf(rata(kata(s.alasan as HleEvent)));
        const garis = teks.indexOf("\n--\n");
        c.expect(judul >= 0 && alasan > 0 && alasan < rata(teks).indexOf(rata(teks.slice(garis))), `${s.nama}: the plain text does not give the reason after the heading, before the footer`);
        c.expect(!rata(teks.slice(garis)).includes(rata(kata(s.alasan as HleEvent))), `${s.nama}: the plain-text footer still repeats the reason`);
        if (s.tempat.length) c.expect(teks.includes(kata("email.bingkai.konteks")), `${s.nama}: the plain text has no context line`);
      }
      const dua = templatKartu(DUA, PRODUKSI).teks;
      for (const b of susunKartu(DUA.konteks).baris) c.expect(dua.includes([b.peran, b.sekolah].filter(Boolean).join(" · ")), `the plain-text card lacks «${[b.peran, b.sekolah].filter(Boolean).join(" · ")}»`);
      c.expect(dua.includes(NAMA) && dua.includes("A14C D7ST"), "the plain-text card lacks the name or the ID 4 + 4");
      return c.verdict("each plain text gives the heading, then its reason (no longer in the footer), the context line where the HTML has one, and the card as name, ID 4 + 4 and susunKartu's role lines");
    },
  },
  {
    id: "D1E-K12",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const L = WARNA.terang as Record<string, string>, D = WARNA.gelap as Record<string, string>;
      const tok = tokens(readFileSync(join(repoRoot, "src/app/globals.css"), "utf8"));
      const pasangan: Array<[string, string, string]> = [
        ["the reason and context line", L.tinta2, L.kartu], ["the dark reason and context line", D.tinta2, D.kartu],
        ["the card's name on its paper", L.tinta, tok["--surface-0"]], ["the card's ID on its paper", L.tinta2, tok["--surface-0"]],
        ...(["--kartu-guru", "--kartu-kadep", "--kartu-dekan", "--kartu-admin-sekolah", "--kartu-admin-platform"] as const).map((k): [string, string, string] => [`the band text on ${k}`, tok["--surface-0"], tok[k]]),
      ];
      for (const [nama, a, b] of pasangan) c.expect(!!a && !!b && rasio(a, b) >= 4.5, `${nama}: ${a} on ${b} is ${a && b ? rasio(a, b).toFixed(2) : "?"}:1`);
      return c.verdict("every new text pair is AA (≥ 4.5:1) in light and dark: the reason and context line, the card's name and ID on its paper, the band text on each of the five staff families");
    },
  },
  {
    id: "D1E-K14",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const src = readFileSync(join(repoRoot, "src/components/email/identitas.ts"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
      c.expect(/susunKartu\(data\.konteks\)/.test(src), "the card email does not take its lines from susunKartu");
      c.expect(!/role\.\$\{k\.peran\}/.test(src) && !/email\.kartu\.peran/.test(src), "identitas.ts still writes role lines of its own");
      return c.verdict("the card block's lines are susunKartu(data.konteks)'s; identitas.ts writes no role line of its own");
    },
  },
  {
    id: "D1E-K15",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const src = readFileSync(join(repoRoot, "src/lib/email/identitas.ts"), "utf8");
      const medan = (nama: string) => {
        const i = src.indexOf(`export type ${nama} = {`);
        if (i < 0) return null;
        return [...src.slice(i, src.indexOf("\n};", i)).matchAll(/^\s+([a-zA-Z]+)\??:/gm)].map((m) => m[1]).join(",");
      };
      c.expect(medan("DataEmailKode") === "kode,berlakuMenit,nama", `DataEmailKode is ${medan("DataEmailKode")}`);
      c.expect(medan("DataEmailPasswordDiubah") === "nama,waktu,tautanLupa", `DataEmailPasswordDiubah is ${medan("DataEmailPasswordDiubah")}`);
      c.expect(medan("DataEmailKeamanan") === "peristiwa,untuk,pintarId,waktu,tautanLupa", `DataEmailKeamanan is ${medan("DataEmailKeamanan")}`);
      c.expect(/export type DataEmailKartu = DataKartu & \{ tautanAkun: string \};/.test(src), "DataEmailKartu changed");
      return c.verdict("the four identity-email data types keep their fields (D-164(b)): the context line and the card block are drawn from data the emails already carry");
    },
  },
  {
    id: "D1E-K16",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const tok = tokens(readFileSync(join(repoRoot, "src/app/globals.css"), "utf8"));
      const nilai = new Set(Object.values(tok).map((v) => v.toUpperCase()));
      const L = WARNA.terang as Record<string, string>;
      const garis = L.garis; // --line laid on white (DAISY-19-EMAIL-01 checks it within rounding)
      const src = readFileSync(join(repoRoot, "src/components/email/bingkai.ts"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
      const terang = src.slice(src.indexOf("terang: {"), src.indexOf("gelap: {"));
      const tanpa = [...terang.matchAll(/([a-zA-Z]+): "(#[0-9A-Fa-f]{6})"/g)].filter(([, , v]) => !nilai.has(v.toUpperCase()) && v !== garis).map(([, k]) => k);
      c.expect(JSON.stringify(tanpa) === JSON.stringify(["utamaGaris"]), `light colours with no token: ${tanpa.join(", ")} (only the code box's border may be one)`);
      // colours written outside the palette, in the frame's own markup (the card block included)
      const luar = [...src.slice(src.indexOf("gelap: {")).matchAll(/#[0-9A-Fa-f]{6}\b/g)].map((m) => m[0].toUpperCase())
        .filter((v) => !nilai.has(v) && !Object.values(WARNA.gelap as Record<string, string>).map((x) => x.toUpperCase()).includes(v));
      c.expect(luar.length === 0, `colours written outside the palette with no token: ${[...new Set(luar)].join(", ")}`);
      return c.verdict("every light colour the frame and the card block use is a token's own value but the code box's border; no colour is written in the markup outside the palette");
    },
  },
];
