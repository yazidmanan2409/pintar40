/**
 * Experience runner — UX-1 Slice 0 and Slice 1.
 *
 * Added, not edited: every case here is new, and no case that existed at the
 * frozen baseline 9b2cc5d is changed by this file. `selftest/static.test.ts`
 * appends this list to its own and the runner executes both.
 *
 * What these cases are for, in one sentence each:
 *   UX1-S0-TOKEN-01        Experience styling resolves to a design token
 *   UX1-S0-CONTRAST-01     every token pair passes WCAG 2.1 AA, computed
 *   UX1-S0-HLE-01          every copy key carries both languages
 *   UX1-S0-LANG-01         the language changes text, and changes no request
 *   UX1-S1-CERT-COLS-01    the certificate list reads exactly ten columns
 *   UX1-S1-CERT-ELIGIBLE-01 an unissued certificate shows no credential
 *   UX1-S1-QR-01           the printed QR really decodes to the link
 *   UX1-S0-SAPAAN-01       no learner is addressed informally in Indonesian
 *   UX1-S0-FAKTA-01        compact fact summaries stack on a narrow surface
 *   UX1-S2-POSISI-01       the cycle position and the home's one recommendation
 *   UX1-S2-MELIHAT-01      looking is not committing, and the four Slice-2 rulings
 *   UX1-S3-LINGKUP-01      the teaching context is derived, and never claimed
 *   UX1-S3-KOMIT-01        no educator page commits anything while rendering
 *   UX1-S3-CEPAT-01        the quick assessment's bounds and its certificate sentence
 *   UX1-S3-BUKTI-01        evidence through the catalogue, nothing item-level
 *   UX1-S3-NAMA-01         names bounded, bare, unjudged, and no honorific
 *   UX1-S3-KATA-01         the educator copy is complete, declared and clean
 *   UX1-S3-FAKTA-01        the Slice-3 compositions narrow on a phone
 *   UX1-S0-MUAT-01         a stretched box fits its container and does not clip
 *   UX1-TUR-LIHAT-01       the tour only looks, and spends only what it presents
 *   UX1-TUR-ORANG-01       the tour's memory belongs to the person, not the device
 *   UX1-TUR-TAHAP-01       PINTAR does not guess a learner's stage
 *   UX1-TUR-PERAN-01       a tour belongs to an experience; seniority inherits none
 *   UX1-TUR-TAMPIL-01      presentation, replay and the tip agree with each other
 *   UX1-TUR-KATA-01        the tour's copy is the approved copy, complete and clean
 *   UX1-TUR-AKSES-01       the tour is a dialog a keyboard and a reader can use
 *   UX1-TUR-TUNTUN-01      Guidance Mode is two states, and never a status
 *   UX1-MASUK-KONTRAK-01   the sign-in screen offers the two doors that exist
 *   UX1-MASUK-PRIVASI-01   nothing distinguishes an unknown address or a bad field
 *   UX1-MASUK-TUJUAN-01    the destination contract is frozen; D1 drops the stale one
 *   UX1-MASUK-AKSES-01     the sign-in screen works by keyboard and screen reader
 *   UX1-MASUK-KATA-01      the sign-in copy is the approved copy, and only in HLE
 *   UX1-PIMPINAN-LINGKUP-01  who is Management is the database's answer, not this code's
 *   UX1-PIMPINAN-KEPUTUSAN-01 the decision experience mirrors WP2 and automates nothing
 *   UX1-PIMPINAN-KESIAPAN-01 R5's three states, read and never recomputed
 *   UX1-PIMPINAN-KATA-01     Management copy: declared, clean, and never a ranking
 *   UX1-DATA-BERKAS-01       a spreadsheet read properly, mapped to WP5A's own fields
 *   UX1-DATA-TAHAP-01        the phases are the database's, and the fifty cannot be crossed
 *   UX1-DATA-JUJUR-01        every number committed; a lost response is not a lost job
 *   UX1-DATA-WENANG-01       provisioning authority, and copy that names no machinery
 *   UX1-AJAR-KONTEKS-01      an educator may learn; nothing here decides that they may
 *   UX1-AJAR-KATA-01         Pembelajaran Saya says whose it is and judges nobody
 *   UX1-UB-BISU-01           while a round is open or withheld, nothing numeric renders
 *   UX1-UB-BATAS-01          the published snapshot is all that renders, and nobody is in it
 *   UX1-UB-KATA-01           accurate about privacy, and a verdict about nobody
 *   UX1-UB-TUTUP-01          Management ends collection; the backend decides what it became
 *   UX1-UB-BUKA-01           discovery names a teacher; opening re-decides, every time
 */
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { join, relative } from "node:path";
import jsQR from "jsqr";
import { Checks, type SelfTest } from "./lib";
import { allKeys, telling, renderAll, t, format, LOCALES, TANPA_SALINAN, INTERNAL_WORDS, type HleEvent, type Persona } from "../src/lib/hle";
import { posisi, peringkat, LANGKAH, LANGKAH_KEY } from "../src/lib/siklus";
import { hibahAktif, nodeLingkup, dalamLingkup, kelasDalamLingkup, LingkupError } from "../src/lib/mengajar";
import { berandaPeran } from "../src/lib/beranda";
import {
  MEDAN, MASALAH, MASALAH_LAIN, PERAN_PENDATAAN, AKUN_AKTIF,
  bacaKisi, barisTernormalisasi, tebakPemetaan, pemetaanLengkap,
  tahap, bolehLanjut, percontohanMenunggu, bisaDilanjutkan, kunciMasalah, type Kemajuan,
} from "../src/lib/pendataan-kontrak";
import {
  kesiapan, hitungKesiapan, langkahBerikut, nada, urutan, menunggu,
  HASIL_SEMUA, HASIL_KUNCI, KEADAAN_KUNCI, KELUARGA_KUNCI, KESIAPAN_KUNCI, KESIAPAN_URUT,
  RANTAI, type Keputusan,
} from "../src/lib/pimpinan-kontrak";
import {
  tur, varianBelajar, bolehTampilOtomatis, akanMunculLagi, tipSetelahTutup,
  peranAktif, turPengajarBerlaku, pitaSasaran, geserKe, ruangBawah, tempatKartu, bertumpuk,
  TEPI, JARAK, TUR_BELAJAR, TUR_PENGAJAR, type Layar, type Petak,
} from "../src/lib/tur";
import { konteksPembelajaran } from "../src/lib/pembelajaran";
import {
  bacaHasil, bagian, bolehDitutup, keadaanKunci, lengkap, sebabBuka, sebabKirim, sebabTutup,
  sudahAdaPutaran, sudahDitutup, sudahTercatat, PERNYATAAN_DITAHAN, SEBAB, SEBAB_BUKA,
  SEBAB_TUTUP, type Kuesioner,
} from "../src/lib/umpanbalik-kontrak";
import HasilKelas from "../src/components/umpanbalik/HasilKelas";
import BarisSesi from "../src/components/BarisSesi";
import PanelPernyataan, { KalimatPonsel } from "../src/components/masuk/PanelPernyataan";
import { templatPelajaran, tulisBukuKerja, xmlTeks, crc32, hurufKolom, LEMBAR_PANDUAN, BATAS_TEKS_KOLOM } from "../src/components/unggah/templat";
import { lokasiMasalah } from "../src/components/unggah/lokasi";
import { bacaBukuKerja } from "../src/lib/xlsx";
import { BATAS_PAKET, KOLOM, LEMBAR, bukuKerjaKePaket, KODE_MASALAH_PAKET, KODE_TOLAK_PAKET, kunciMasalahPaket, kunciKodePaket } from "../src/lib/unggah-kontrak";
import { crc32 as zlibCrc32 } from "node:zlib";
import { tempatDariPeran, daftarTempat, pintuMasuk, tawarkanStudio, PERAN_STUDIO } from "../src/components/tempat";
import { namaUntukStrip, namaSapaan, PERAN_STAF } from "../src/components/sesi";
import { pohonStruktur, bolehDiubah, bolehDitambahi, kalimatGagal, kalimatGagalBaca } from "../src/components/struktur/tampilan";
import { KODE_STRUKTUR_DB, type KodeStruktur, type SimpulStruktur } from "../src/lib/struktur-kontrak";
import { sekolahDitawarkan, sekolahDipilih, type SekolahBaris } from "../src/components/sekolah";
import { kunciGagal, isianKurang, surelLengkap, GALAT_RUTE, type ModeAktivasi, type JawabanAktivasi } from "../src/components/aktivasi/hasil";
import type { DisplayRole } from "../src/lib/auth";
import { qrMatrix } from "../src/lib/qr";
import { LIST_COLUMNS, rendersCredential, rendersVerification } from "../src/lib/sertifikat-kontrak";


/**
 * WP7C. A RENDER, NOT A STRING SEARCH.
 *
 * `HasilKelas` is an ordinary synchronous function component, so the guards
 * below CALL it and walk what comes back. That matters: §25 asks for real
 * backend states to be rendered and the rendered surface proved free of
 * response-derived numbers, and a test that grepped the source for "(3/5)"
 * would pass a component that computed the same thing a different way.
 *
 * Two collectors, because a number can reach a screen as text or as geometry:
 * `teksPohon` gathers every string and number child, and `gayaPohon` gathers
 * every style value — a bar whose width was `37%` would be a published
 * proportion rendered in an open cycle, and it would be invisible to a text
 * scan.
 */
type Simpul = { type?: unknown; props?: Record<string, unknown> } | string | number | null | undefined;

function anakDari(n: Simpul): Simpul[] {
  if (n === null || n === undefined || typeof n === "string" || typeof n === "number") return [];
  const kids = (n.props ?? {}).children;
  return (Array.isArray(kids) ? kids : [kids]) as Simpul[];
}

function teksPohon(n: Simpul, keluar: string[] = []): string[] {
  if (n === null || n === undefined) return keluar;
  if (typeof n === "string" || typeof n === "number") { keluar.push(String(n)); return keluar; }
  for (const k of anakDari(n)) teksPohon(k, keluar);
  return keluar;
}

function gayaPohon(n: Simpul, keluar: string[] = []): string[] {
  if (n === null || n === undefined || typeof n === "string" || typeof n === "number") return keluar;
  const gaya = (n.props ?? {}).style;
  if (gaya && typeof gaya === "object") {
    for (const v of Object.values(gaya as Record<string, unknown>)) keluar.push(String(v));
  }
  for (const k of anakDari(n)) gayaPohon(k, keluar);
  return keluar;
}

/** Any digit at all. The strictest form available, used where the correct
 *  number of response-derived figures is exactly zero. */
const ADA_ANGKA = /[0-9\u0660-\u0669]/;

const IGNORED = new Set(["node_modules", ".next", ".git", "coverage", "out", "build", ".vercel"]);

function walk(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    if (IGNORED.has(entry)) continue;
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

/** Source with comments removed: a rule about code is tested against code. */
function code(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ").replace(/\{\/\*[\s\S]*?\*\/\}/g, " ");
}

// A word ending in -mu is the informal possessive clitic UNLESS it is one of
// these, which are ordinary words that happen to end that way. Declared rather
// than guessed, so a false positive is fixed by adding a word here and is
// visible in the diff when somebody does.
/**
 * Bob's destination helper, as it was frozen at bff6897e. The login work passes
 * a different FALLBACK to it and changes nothing about what it accepts, so the
 * file itself must not move: a login change that needed the security contract
 * altered would be a login change that had gone wrong.
 */
const TUJUAN_SHA = "443de2c68bc70a4297adfe43c968955bea222d8cf26243baf9db5d702424d5fc";

const NOT_A_CLITIC = ["ilmu", "jamu", "tamu", "semu", "temu", "ramu"];
const STANDALONE = ["kamu", "kau", "engkau", "dikau", "dirimu", "kalian"];
const WORD = /\b[a-z]+\b/gi;

/**
 * Every informal second-person form in one piece of Indonesian text.
 *
 * One pass over the words rather than two patterns, because "kamu" is both a
 * standalone pronoun and a word ending in -mu: two patterns counted it twice,
 * and a guard whose own count is wrong is a guard nobody can read a failure
 * from.
 *
 * AT MODULE SCOPE because two tests need it — the Slice-0 sweep over learner
 * and public tellings, and the tour's own sweep, which also covers the
 * educator ones. A second copy is how the two halves start to disagree about
 * what "informal" means.
 */
function informal(text: string): string[] {
  const hits: string[] = [];
  for (const m of text.matchAll(WORD)) {
    const w = m[0].toLowerCase();
    if (STANDALONE.includes(w)) { hits.push(m[0]); continue; }
    if (!w.endsWith("mu") || w.length < 4) continue;
    if (NOT_A_CLITIC.some((safe) => w.endsWith(safe))) continue;
    hits.push(m[0]);
  }
  return hits;
}

// ---------------------------------------------------------------------------
// THE SCOPE OF THE TOKEN LINT, DECLARED RATHER THAN GUESSED.
//
// UX-1 re-sets the Experience surfaces one slice at a time, and Slices 2-7 are
// not authorized yet. A lint over every file in src/ would therefore fail on
// surfaces this session is forbidden to touch, and a lint over "the files I
// changed" would stop covering anything the day somebody stops changing files.
//
// So the scope is two declared lists, and the test asserts that every surface
// is in exactly one of them. A NEW surface is in neither, and the test fails
// until somebody puts it in one — which is the property that matters: nothing
// can be added outside the lint by accident.
// ---------------------------------------------------------------------------
const RESET_SURFACES = [
  "src/app/layout.tsx",
  // DAISY-04: PINTAR's own error and not-found pages, on the token vocabulary
  "src/app/error.tsx",
  "src/app/global-error.tsx",
  "src/app/not-found.tsx",
  "src/app/globals.css",
  "src/app/experience.css",
  "src/app/_intel.ts",
  "src/app/belajar/sertifikat/page.tsx",
  "src/app/belajar/[tugas]/sertifikat/page.tsx",
  "src/app/verifikasi/[token]/page.tsx",
  "src/app/belajar/page.tsx",
  "src/app/belajar/[tugas]/page.tsx",
  "src/app/belajar/[tugas]/hasil/page.tsx",
  "src/app/belajar/[tugas]/peta/page.tsx",
  "src/app/belajar/[tugas]/pemetaan/page.tsx",
  "src/app/belajar/[tugas]/penguasaan/page.tsx",
  "src/app/belajar/[tugas]/pelajaran/[pelajaran]/page.tsx",
  "src/app/belajar/_components/ItemPlayer.tsx",
  "src/app/belajar/_components/LessonPlayer.tsx",
  "src/app/belajar/[tugas]/lanjut/page.tsx",
  "src/app/belajar/asesmen/[penugasan]/page.tsx",
  "src/app/belajar/_components/PermukaanAsesmen.tsx",
  // WP7C — anonymous student → educator feedback. One learner surface, one
  // educator surface and two Management surfaces, all built on the token set
  // from their first commit.
  "src/app/belajar/umpan-balik/[siklus]/page.tsx",
  "src/app/mengajar/[kelas]/umpan-balik/page.tsx",
  "src/app/pimpinan/[simpul]/umpan-balik/page.tsx",
  "src/app/pimpinan/[simpul]/umpan-balik/[siklus]/page.tsx",
  // WP7D. Where Management names the teacher a class will be asked about.
  "src/app/pimpinan/[simpul]/umpan-balik/kelas/[kelas]/page.tsx",
  // WP5B — institutional intake. On the token set from its first commit, like
  // WP4 and unlike the configuration surface it is reached from.
  "src/app/pendataan/page.tsx",
  "src/app/pendataan/[pekerjaan]/page.tsx",
  // WP4 — the Management surface. Built on the token set from the first commit
  // rather than re-set afterwards, which is why it joins this list and not the
  // pending one.
  "src/app/pimpinan/page.tsx",
  "src/app/pimpinan/[simpul]/page.tsx",
  "src/app/pimpinan/[simpul]/murid/page.tsx",
  "src/app/pimpinan/[simpul]/murid/[orang]/page.tsx",
  // UX-1 Slice 3 — the educator's teaching surface, A-F.
  "src/app/mengajar/page.tsx",
  "src/app/mengajar/[kelas]/page.tsx",
  "src/app/mengajar/[kelas]/siapkan/page.tsx",
  "src/app/mengajar/[kelas]/uji-cepat/page.tsx",
  "src/app/mengajar/[kelas]/bukti/page.tsx",
  "src/app/mengajar/[kelas]/langkah/page.tsx",
  "src/app/mengajar/[kelas]/siapa/page.tsx",
  // UX-1 login. Re-set from the canonical login handoff against baseline
  // bff6897e; the sign-in screen and the magic-link callback are now Experience
  // surfaces and are linted as such.
  "src/app/masuk/page.tsx",
  "src/app/auth/callback/page.tsx",
  // F-01 account activation. Built on the token set, the pendataan shell and
  // the shared pin-* classes from the start, so it joins the re-set list.
  "src/app/aktivasi/page.tsx",
];

/** Not re-set yet, and the slice that will do it. UX-1 §4 forbids touching them. */
const PENDING_SURFACES: Record<string, string> = {
  "src/app/page.tsx": "Slice 2 — entry by purpose",
  "src/app/_evaluation-banner.tsx": "Slice 2 — the shell",
  "src/app/evaluasi/page.tsx": "Slice 2 — the demonstration room",
  "src/app/konfigurasi/page.tsx": "Slice 7 — configuration",
  "src/app/edukator/ringkasan/page.tsx": "Slice 6 — reports",
  "src/app/dekan/ringkasan/page.tsx": "Slice 6 — reports",
  "src/app/studio/layout.tsx": "Slice 5 — Studio",
  "src/app/studio/page.tsx": "Slice 5 — Studio",
  "src/app/studio/bank/page.tsx": "Slice 5 — Studio",
  "src/app/studio/definisi/page.tsx": "Slice 5 — Studio",
  "src/app/studio/integritas/page.tsx": "Slice 5 — Studio",
  "src/app/studio/kanonik/page.tsx": "Slice 5 — Studio",
  "src/app/studio/kanonik/[terbitan]/page.tsx": "Slice 5 — Studio",
  "src/app/studio/kuis/page.tsx": "Slice 5 — Studio",
  "src/app/studio/paket/[course]/page.tsx": "Slice 5 — Studio",
  "src/app/studio/pratinjau/[pelajaran]/page.tsx": "Slice 5 — Studio",
  "src/app/studio/sertifikat/page.tsx": "Slice 5 — Studio",
  "src/app/studio/tinjau/page.tsx": "Slice 5 — Studio",
  "src/app/studio/unggah/page.tsx": "Slice 5 — Studio",
};

/**
 * IMPLEMENTATION CONSTANTS, CLASSIFIED (Sauron amendment §3).
 *
 * The lint protects the design system; it does not obstruct implementation. A
 * value that is not a design decision is not tokenized to satisfy a rule — it
 * is declared here with the reason it is not a design decision. An entry is a
 * file, a literal and one line saying why.
 */
const EXEMPTIONS: Array<{ file: string; literal: string; reason: string }> = [
  { file: "src/app/experience.css", literal: "794px",
    reason: "A4 is 210mm; at 96dpi that is 794px. It is the paper, not a scale step." },
  { file: "src/app/experience.css", literal: "1123px",
    reason: "A4 is 297mm; at 96dpi that is 1123px. Same reason as the width." },
  { file: "src/app/experience.css", literal: "96px",
    reason: "The QR is square and printed at a fixed size a camera can resolve." },
  { file: "src/app/experience.css", literal: "72px",
    reason: "The printed sheet's margin, chosen for paper rather than for a screen rhythm." },
  { file: "src/app/experience.css", literal: "56px",
    reason: "The shell header's height: one control row, sized by the 40px control plus its padding." },
  { file: "src/app/experience.css", literal: "44px",
    reason: "The phone tab bar: the minimum comfortable touch target, a platform requirement." },
  { file: "src/app/experience.css", literal: "40px",
    reason: "The control height, and the certificate's accent rule. Both are the same measured value." },
  { file: "src/app/experience.css", literal: "340px",
    reason: "The scroll ceiling on the fifty provisioned rows at the pilot checkpoint. Sized so the list "
          + "reads as a list that scrolls rather than pushing the confirm control off the screen, which "
          + "would leave an administrator scrolling past fifty people to find it. Not a scale step." },
  { file: "src/app/experience.css", literal: "180px",
    reason: "The definition-list label column: sized to the longest label in either language." },
  { file: "src/app/experience.css", literal: "560px",
    reason: "The phone breakpoint, which is a device fact rather than a spacing step." },
  { file: "src/app/experience.css", literal: "6px",
    reason: "Sub-4px detail geometry: the status dot, the readiness bar and the chip corner." },
  { file: "src/app/experience.css", literal: "2px",
    reason: "A hairline's emphatic sibling: the accent rule and the focus ring width." },
  { file: "src/app/experience.css", literal: "3px",
    reason: "Half of the 6px readiness bar, so its corner is a semicircle." },
  { file: "src/app/experience.css", literal: "1px",
    reason: "One device pixel: the hairline itself." },
  { file: "src/app/experience.css", literal: "18px",
    reason: "The list row's vertical padding, measured against the 17px row title." },
  { file: "src/app/experience.css", literal: "28px",
    reason: "Optical spacing inside the certificate, between rule and name." },
  { file: "src/app/experience.css", literal: "26px",
    reason: "The page title at phone width." },
  { file: "src/app/experience.css", literal: "32px",
    reason: "The evidence figure, and the certificate name at phone width." },
  { file: "src/app/experience.css", literal: "15px",
    reason: "Two places where 14 is too quiet and 16 too loud: the tab and the verification lede." },
  { file: "src/app/experience.css", literal: "14px",
    reason: "The printed sheet's rule offset, measured on paper." },
  { file: "src/app/experience.css", literal: "10px",
    reason: "The pill's horizontal padding and the readiness gap: sub-step detail." },
  { file: "src/app/experience.css", literal: "24px",
    reason: "The pill height: one line of 12px type plus its padding." },
  { file: "src/app/experience.css", literal: "50%",
    reason: "Half of a box is a circle; there is no design scale for roundness." },
  { file: "src/app/experience.css", literal: "100%",
    reason: "Fill the parent, which is a layout instruction rather than a measurement." },
  { file: "src/app/experience.css", literal: "1.3",
    reason: "Line height for a two-line title: tighter than body, looser than display." },
  { file: "src/app/experience.css", literal: "1.05",
    reason: "Line height for the display name, which is set solid." },
  { file: "src/app/experience.css", literal: "1.1",
    reason: "Line height for the verification verdict." },
  { file: "src/app/experience.css", literal: "0.04em",
    reason: "The language switch's tracking: two uppercase letters need less than the eyebrow." },
  { file: "src/app/experience.css", literal: "-0.01em",
    reason: "Half the display tracking, for the 22-24px headings between ladder and display." },
  { file: "src/app/experience.css", literal: "0.5",
    reason: "The scope separator's opacity." },
  { file: "src/app/experience.css", literal: "60ch",
    reason: "The prose measure, in characters rather than pixels — which is the point of ch." },
  { file: "src/app/experience.css", literal: "56ch",
    reason: "The same measure, one step narrower, for a secondary paragraph." },
  { file: "src/app/experience.css", literal: "78px",
    reason: "The cycle trail's step width: what five step names need side by side before they collide." },
  { file: "src/app/experience.css", literal: "12px",
    reason: "The trail dot's diameter. A dot is drawn, not spaced." },
  { file: "src/app/experience.css", literal: "5px",
    reason: "Half the 12px dot less half the 2px connector, so the line meets the dot's centre." },
  { file: "src/app/experience.css", literal: "4px",
    reason: "Detail geometry below the spacing scale: the current step's ring and the progress bar's height." },
  { file: "src/app/experience.css", literal: "34px",
    reason: "The question-number button: a two-digit target, sized to the finger rather than to a rhythm." },
  { file: "src/app/experience.css", literal: "23px",
    reason: "24px less the pixel a 2px border eats, so a selected option's text does not shift." },
  { file: "src/app/experience.css", literal: "20px",
    reason: "The disc list's indent, which belongs to the marker rather than to the page." },
  { file: "src/app/experience.css", literal: "120px",
    reason: "The progress bar's flex basis: the width below which a bar stops reading as progress." },
  { file: "src/app/experience.css", literal: "80px",
    reason: "The same bar's floor, so it never collapses to a dash between the two labels beside it." },
  { file: "src/app/experience.css", literal: "1.4em",
    reason: "The option key's column, in em so A/B/C/D stays aligned with the type rather than the page." },
  { file: "src/app/experience.css", literal: "20ch",
    reason: "The review question's flex basis, in characters because it wraps prose." },
  { file: "src/app/experience.css", literal: "360px",
    reason: "An inline lesson illustration: wide enough to read a diagram, narrow enough to stay inside the measure." },
  { file: "src/app/experience.css", literal: "0.4",
    reason: "The disabled control's opacity: visibly unavailable without vanishing." },
  { file: "src/app/experience.css", literal: "0",
    reason: "A native radio held at zero opacity over its own label: the standard way to keep a control focusable, operable and announced while the label carries the appearance. Hiding it any other way would take it out of the tab order, which is an accessibility regression rather than a design decision." },
  // UX-1 · THE SIGN-IN SCREEN. One measured composition, in the same sense the
  // A4 certificate sheet is one: its proportions were arrived at by rendering
  // and measuring the screen, not by stepping a scale. The values that repeat
  // across rules -- the two form measures, the two control heights, the
  // photograph band, and both of the panel's darkenings -- ARE tokens in
  // globals.css. What is left is the geometry of this one screen.
  { file: "src/app/experience.css", literal: "760px",
    reason: "The sign-in stage's minimum height: below it the two columns stop reading as a stage and the panel becomes a stripe." },
  { file: "src/app/experience.css", literal: "1024px",
    reason: "Where the sign-in screen becomes two columns. A container-query breakpoint is a property of the composition, not a step on a scale." },
  { file: "src/app/experience.css", literal: "561px",
    reason: "One past the phone breakpoint: where the photograph returns as a band below the form. Paired with the 560px phone rule so there is no gap." },
  { file: "src/app/experience.css", literal: "27px",
    reason: "The panel sentence on a wide screen: measured between the subhead and the page title, neither of which sat right over a photograph." },
  { file: "src/app/experience.css", literal: "0.08em",
    reason: "The card number's tracking. It is a transcription from a printed card, and the spacing is what makes a figure checkable against paper." },
  { file: "src/app/experience.css", literal: "60%",
    reason: "The standing rule's weight against the primary. A 40x2px mark at full strength reads as a divider rather than a signature." },
  { file: "src/app/experience.css", literal: "42ch",
    reason: "The sign-in lede's measure, in characters because it wraps prose -- Indonesian first, English checked to fit." },
  { file: "src/app/experience.css", literal: "18ch",
    reason: "The panel heading's measure over the photograph: two balanced lines at the width the crop leaves usable." },
  { file: "src/app/experience.css", literal: "26ch",
    reason: "The same heading in the 260px tablet band, where the type drops a step and the measure widens with it." },
  { file: "src/app/experience.css", literal: "34ch",
    reason: "The panel paragraph over the photograph, narrower than body prose because it is set over an image." },
  { file: "src/app/experience.css", literal: "52ch",
    reason: "The same paragraph once the photograph is gone and it is ordinary text on white." },
  // UX-1 guidance mode. The three card measures and the phone sheet's ceiling
  // ARE design decisions, so they are tokens in globals.css rather than
  // entries here. These two are not.
  { file: "src/app/experience.css", literal: "4000px",
    reason: "The spotlight's veil is one box-shadow spread larger than any viewport, so the cut-out has exactly one edge and the ring cannot drift from it. It is a shadow that must not end on screen, not a measurement." },
  { file: "src/app/experience.css", literal: "72%",
    reason: "The Guidance veil's strength. Sauron ruled it a composite of primary-soft rather than a new token (§O-2), so it is written as a mix of the token it is made of." },
  { file: "src/components/bukti/BarisKesiapan.tsx", literal: "%",
    reason: "A computed proportion of the readiness bar: data, not a design value." },
  { file: "src/components/bukti/BarisLingkup.tsx", literal: "20",
    reason: "The institution mark's rendered height, matched to the scope line's cap height." },
  { file: "src/components/sertifikat/LembarA4.tsx", literal: "794",
    reason: "A4 width in CSS pixels; the sheet is scaled to the container from it." },
  { file: "src/components/sertifikat/LembarA4.tsx", literal: "1123",
    reason: "A4 height in CSS pixels; the container's height follows the scale." },
];

/** Every Tailwind family that carries a design decision. */
const TAILWIND_DESIGN = new RegExp(
  "(?:^|[\\s\"'`])(?:" +
    "(?:text|bg|border|ring|fill|stroke|decoration|outline|shadow|from|via|to)-(?!\\[var\\()[a-z0-9/.\\[\\]#-]+" +
    "|(?:p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml|gap|space-[xy])-(?!\\[var\\()[0-9.]+" +
    "|rounded(?:-[a-z0-9]+)?" +
    "|(?:max-w|min-w|w|h|max-h|min-h)-(?!\\[var\\()[0-9.]+" +
    "|(?:leading|tracking|font)-(?!\\[var\\()[a-z0-9.]+" +
  ")(?=[\\s\"'`]|$)",
  "g",
);

const RAW_COLOUR = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?)\s*\(/g;
const RAW_LENGTH = /(?<![\w.-])\d+(?:\.\d+)?(?:px|rem|em|ch|%)/g;

function exemptionsFor(file: string) {
  return EXEMPTIONS.filter((e) => e.file === file).map((e) => e.literal);
}

// ---------------------------------------------------------------- contrast
function srgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  return [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255) as [number, number, number];
}
function luminance(hex: string): number {
  const [r, g, b] = srgb(hex).map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function ratio(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}
/**
 * The tokens `:root` declares. Only `:root` — `@theme inline` below it restates
 * them as Tailwind colours, and reading both would have the restatement
 * overwrite the value with the `var()` that points at it.
 */
function tokens(css: string): Record<string, string> {
  const start = css.indexOf(":root {");
  const end = css.indexOf("\n}", start);
  const block = start >= 0 ? css.slice(start, end) : "";
  const out: Record<string, string> = {};
  for (const m of block.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g)) out[m[1]] = m[2].trim();
  return out;
}

/** The Tailwind utility names `@theme inline` backs with a token. */
function themeColours(css: string): Set<string> {
  const out = new Set<string>();
  for (const m of css.matchAll(/--color-([a-z0-9-]+)\s*:\s*var\(/g)) out.add(m[1]);
  return out;
}

// ------------------------------------------------------- a recording client
type Call = { fn: string; args: unknown };
function recorder() {
  const calls: Call[] = [];
  const client = {
    rpc(fn: string, args?: Record<string, unknown>) {
      calls.push({ fn, args: args ?? {} });
      return Promise.resolve({ data: [], error: null });
    },
  };
  return { calls, client };
}

export const experienceTests: SelfTest[] = [
  {
    id: "UX1-S0-TOKEN-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();

      // 1. every surface is declared, in exactly one list
      const surfaces = [
        ...walk(join(repoRoot, "src", "app")).filter((f) => /\.(tsx|css)$/.test(f)),
        ...walk(join(repoRoot, "src", "components")).filter((f) => /\.tsx$/.test(f)),
      ].map((f) => relative(repoRoot, f).replace(/\\/g, "/"));

      const reset = new Set(RESET_SURFACES);
      // everything under src/components is Slice 0's, so it is reset by
      // construction — a component is not a surface somebody forgot
      for (const f of surfaces) if (f.startsWith("src/components/")) reset.add(f);

      const undeclared = surfaces.filter((f) => !reset.has(f) && !(f in PENDING_SURFACES));
      c.expect(
        undeclared.length === 0,
        "Experience surface(s) in neither the re-set list nor the pending list. A surface outside " +
          "both is a surface outside the lint:\n  " + undeclared.join("\n  "),
      );
      const stale = Object.keys(PENDING_SURFACES).filter((f) => !surfaces.includes(f));
      c.expect(stale.length === 0, `pending surface(s) that no longer exist: ${stale.join(", ")}`);

      // 2. the reset surfaces carry no untokenized design value
      const globals = readFileSync(join(repoRoot, "src", "app", "globals.css"), "utf8");
      const declared = tokens(globals);
      const themed = themeColours(globals);
      c.expect(themed.size > 10, `only ${themed.size} Tailwind colour(s) are backed by a token`);
      c.expect(Object.keys(declared).length > 30, `only ${Object.keys(declared).length} tokens declared`);
      c.expect(declared["--pintar-tokens-version"] === "2", "the token set is not version 2");

      let scanned = 0;
      for (const rel of [...reset].sort()) {
        const abs = join(repoRoot, rel);
        if (!existsSync(abs)) continue;
        const raw = readFileSync(abs, "utf8");
        const text = code(raw);
        const allowed = exemptionsFor(rel);
        scanned++;

        if (rel.endsWith(".css")) {
          // globals.css DECLARES the tokens, so its own right-hand sides are
          // the values themselves; every other stylesheet must reference them.
          if (rel.endsWith("globals.css")) continue;
          for (const m of text.matchAll(RAW_COLOUR)) {
            c.expect(false, `${rel} writes a raw colour ${m[0]} instead of a token`);
          }
          for (const m of text.matchAll(RAW_LENGTH)) {
            if (allowed.includes(m[0])) continue;
            c.expect(false, `${rel} writes the untokenized length ${m[0]}`);
          }
          // unitless values a stylesheet can still smuggle a decision through
          for (const m of text.matchAll(/(?:line-height|opacity|letter-spacing):\s*([^;]+);/g)) {
            const v = m[1].trim();
            if (v.startsWith("var(") || allowed.includes(v) || v === "inherit" || v === "normal") continue;
            c.expect(false, `${rel} writes the untokenized value ${m[0].trim()}`);
          }
          continue;
        }

        for (const m of text.matchAll(RAW_COLOUR)) {
          c.expect(false, `${rel} writes a raw colour ${m[0]}`);
        }
        for (const m of text.matchAll(TAILWIND_DESIGN)) {
          const cls = m[0].trim();
          if (allowed.includes(cls)) continue;
          // A Tailwind colour utility whose name is a token `@theme inline`
          // declares IS a token reference — `bg-surface-1` compiles to
          // `var(--surface-1)`. The rule is "resolves to a token", not "avoids
          // Tailwind", and treating these as violations would push a surface
          // into an inline style, which is strictly worse.
          const colour = /^(?:text|bg|border|ring|fill|stroke|decoration|outline)-(.+)$/.exec(cls);
          if (colour && themed.has(colour[1])) continue;
          c.expect(false, `${rel} styles with the Tailwind scale class "${cls}" rather than a token`);
        }
        // inline style objects
        for (const m of text.matchAll(/style=\{\{([^}]*)\}\}/g)) {
          const body = m[1];
          for (const lit of body.matchAll(RAW_LENGTH)) {
            if (allowed.includes(lit[0]) || allowed.some((a) => lit[0].endsWith(a))) continue;
            c.expect(false, `${rel} inlines the untokenized length ${lit[0]}`);
          }
        }
      }

      // 3. every exemption is real and still needed: a stale allow-list entry
      //    is a hole nobody notices
      for (const e of EXEMPTIONS) {
        const abs = join(repoRoot, e.file);
        c.expect(existsSync(abs), `exemption names a file that does not exist: ${e.file}`);
        if (!existsSync(abs)) continue;
        c.expect(
          readFileSync(abs, "utf8").includes(e.literal),
          `exemption for ${e.literal} in ${e.file} is stale: the literal is no longer there`,
        );
        c.expect(e.reason.length > 20, `exemption for ${e.literal} in ${e.file} has no real reason`);
      }

      c.note(`${scanned} re-set surface(s), ${Object.keys(PENDING_SURFACES).length} awaiting their slice, ` +
        `${EXEMPTIONS.length} classified implementation constant(s)`);
      return c.verdict(
        "every re-set Experience surface resolves its colours, radii, type sizes and spacing to a token in " +
          "the source file src/app/globals.css; every surface is declared either re-set or pending, so a new " +
          "one cannot be added outside the lint; and every allow-listed constant still exists and carries a reason",
      );
    },
  },

  {
    id: "UX1-S0-CONTRAST-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const tk = tokens(readFileSync(join(repoRoot, "src", "app", "globals.css"), "utf8"));
      const AA = 4.5;

      const grounds: Array<[string, string]> = [
        ["white", tk["--surface-1"]],
        ["ivory", tk["--surface-0"]],
        ["well", tk["--surface-2"]],
      ];
      const text = ["--ink-1", "--ink-2", "--ink-3", "--pintar-primary"];
      const status: Array<[string, string]> = [
        ["--status-ok", "--status-ok-soft"],
        ["--status-attention", "--status-attention-soft"],
        ["--status-blocked", "--status-blocked-soft"],
        ["--status-info", "--status-info-soft"],
        ["--pintar-primary", "--pintar-primary-soft"],
      ];

      let measured = 0;
      for (const name of text) {
        const hex = tk[name];
        c.expect(/^#[0-9a-fA-F]{6}$/.test(hex ?? ""), `${name} is not a hex colour: ${hex}`);
        for (const [label, ground] of grounds) {
          const r = ratio(hex, ground);
          measured++;
          c.expect(r >= AA, `${name} on ${label} is ${r.toFixed(2)}:1, below AA ${AA}:1`);
        }
      }
      // a status colour must hold on all three grounds AND on its own soft one
      for (const [fg, soft] of status) {
        for (const [label, ground] of [...grounds, ["its own soft ground", tk[soft]] as [string, string]]) {
          const r = ratio(tk[fg], ground);
          measured++;
          c.expect(r >= AA, `${fg} on ${label} is ${r.toFixed(2)}:1, below AA ${AA}:1`);
        }
      }
      // and the ink the primary carries
      const onPrimary = ratio(tk["--pintar-primary-ink"], tk["--pintar-primary"]);
      measured++;
      c.expect(onPrimary >= AA, `--pintar-primary-ink on --pintar-primary is ${onPrimary.toFixed(2)}:1`);
      const onHover = ratio(tk["--pintar-primary-ink"], tk["--pintar-primary-hover"]);
      measured++;
      c.expect(onHover >= AA, `--pintar-primary-ink on --pintar-primary-hover is ${onHover.toFixed(2)}:1`);

      c.note(`${measured} ratio(s) computed from the token file`);
      return c.verdict(
        "WCAG 2.1 contrast is COMPUTED from src/app/globals.css for every text token against white, ivory " +
          "and the well, and for every status token against its own soft ground, and nothing is below AA — " +
          "so the token lint can never enforce a failing token",
      );
    },
  },

  {
    id: "UX1-S0-HLE-01",
    requires: [],
    run: async () => {
      const c = new Checks();
      const keys = allKeys();
      c.expect(keys.length > 300, `only ${keys.length} copy key(s) in the table`);

      for (const k of keys) {
        const row = telling(k) as Record<string, string>;
        c.expect(typeof row.default === "string" && row.default.length > 0, `${k} has no Indonesian telling`);
        c.expect(typeof row.en === "string" && row.en.length > 0, `${k} has no English telling`);
        // a persona override in one language and not the other is a key that
        // says different things to the same reader depending on the interface
        for (const p of ["learner", "educator", "staff", "public"]) {
          const hasId = typeof row[p] === "string";
          const hasEn = typeof row[`en_${p}`] === "string";
          c.expect(hasId === hasEn, `${k} overrides ${p} in one language only`);
        }
      }

      // and the guard really runs: every key, every persona, both languages,
      // every stage telling a learner can receive
      const rendered = renderAll();
      c.expect(rendered.length > keys.length * 2, `renderAll produced only ${rendered.length} rendering(s)`);
      const byLocale = new Map<string, number>();
      for (const r of rendered) byLocale.set(r.locale, (byLocale.get(r.locale) ?? 0) + 1);
      for (const l of LOCALES) c.expect((byLocale.get(l) ?? 0) > 0, `no rendering in ${l}`);
      c.expect(
        byLocale.get("id") === byLocale.get("en"),
        `the two languages render a different number of tellings: ${byLocale.get("id")} vs ${byLocale.get("en")}`,
      );

      c.note(`${keys.length} keys in the copy table src/lib/hle.ts, ${rendered.length} renderings swept`);
      return c.verdict(
        "every key in the copy table src/lib/hle.ts carries both an Indonesian and an English telling, a " +
          "persona override exists in both languages or neither, and the internal-word guard is exercised " +
          "over every persona, both languages and every stage telling",
      );
    },
  },

  {
    id: "UX1-S0-LANG-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();

      // HALF ONE, BEHAVIOURAL. The same read paths, driven twice, once per
      // language, through a client that records what it was asked for. The
      // recorded sequence and payloads must be byte-identical: the interface
      // language is presentation, and a presentation choice that reached the
      // database would be a tenant-visible consequence of a reader's taste.
      const engine = await import("../src/lib/assessment-engine");
      const transcripts: string[] = [];
      for (const locale of LOCALES) {
        const { calls, client } = recorder();
        // the learner cycle
        await engine.myAssignments(client);
        await engine.cycleState(client, "00000000-0000-0000-0000-000000000001");
        await engine.sessionState(client, "00000000-0000-0000-0000-000000000002").catch(() => undefined);
        await engine.outcome(client, "00000000-0000-0000-0000-000000000002");
        await engine.review(client, "00000000-0000-0000-0000-000000000002");
        await engine.delta(client, "00000000-0000-0000-0000-000000000001");
        // and the certificate the slice adds
        await engine.myCertificate(client, "00000000-0000-0000-0000-000000000002");
        // the copy is rendered in this language, in the same pass, so a render
        // that reached for the database would show up in the transcript
        for (const k of ["cycle.title", "sertifikat.daftar.judul", "verifikasi.status.BERLAKU"]) {
          t(k as HleEvent, "learner", { locale });
        }
        transcripts.push(JSON.stringify(calls));
      }
      c.expect(
        transcripts[0] === transcripts[1],
        "the recorded call sequence differs between the two interface languages:\n  id: " +
          transcripts[0].slice(0, 300) + "\n  en: " + transcripts[1].slice(0, 300),
      );
      const callCount = JSON.parse(transcripts[0]).length;
      c.expect(callCount >= 5, `only ${callCount} call(s) recorded; the comparison would be thin`);

      // HALF TWO, STRUCTURAL. The behavioural half proves today's code paths
      // are identical; this one stops tomorrow's from differing. No database
      // call anywhere under src/ may carry the language, and no server action,
      // RPC or table write may name the preference cookie.
      const sources = [
        ...walk(join(repoRoot, "src")).filter((f) => /\.(ts|tsx)$/.test(f)),
      ];
      const LOCALE_WORD = /\b(locale|lang|bahasa|pintar-lang)\b/i;
      let inspected = 0;
      for (const f of sources) {
        const rel = relative(repoRoot, f).replace(/\\/g, "/");
        if (rel === "src/lib/locale.ts" || rel === "src/lib/locale-kontrak.ts" || rel === "src/components/PengalihBahasa.tsx") continue; // the preference itself
        const text = code(readFileSync(f, "utf8"));
        inspected++;
        for (const m of text.matchAll(/\.rpc\(\s*([^)]*)\)/g)) {
          c.expect(!LOCALE_WORD.test(m[1]), `${rel} passes the interface language into an RPC: ${m[0].slice(0, 120)}`);
        }
        for (const m of text.matchAll(/\.(insert|update|upsert|delete)\(\s*([^)]*)\)/g)) {
          c.expect(!LOCALE_WORD.test(m[2] ?? ""), `${rel} writes the interface language to the database: ${m[0].slice(0, 120)}`);
        }
        for (const m of text.matchAll(/\.(eq|in|filter|match)\(\s*([^)]*)\)/g)) {
          c.expect(!LOCALE_WORD.test(m[2] ?? ""), `${rel} filters a database read by the interface language: ${m[0].slice(0, 120)}`);
        }
      }
      // and there is exactly one mechanism: no second cookie, no column
      const localeSrc = readFileSync(join(repoRoot, "src", "lib", "locale-kontrak.ts"), "utf8");
      c.expect(/LOCALE_COOKIE = "pintar-lang"/.test(localeSrc), "the preference cookie is not pintar-lang");
      // exactly one cookie name, declared once: a second would be a second
      // mechanism, and two mechanisms is how the two halves start to disagree
      const declarations = walk(join(repoRoot, "src")).filter((f) => /\.(ts|tsx)$/.test(f))
        .filter((f) => /LOCALE_COOKIE\s*=\s*"/.test(readFileSync(f, "utf8")));
      c.expect(declarations.length === 1,
        `the preference cookie name is declared in ${declarations.length} places: ` +
        declarations.map((f) => relative(repoRoot, f)).join(", "));
      const migrations = walk(join(repoRoot, "supabase", "migrations")).filter((f) => f.endsWith(".sql"));
      for (const f of migrations) {
        c.expect(
          !/pintar-lang|interface_language|ui_locale/i.test(readFileSync(f, "utf8")),
          `${relative(repoRoot, f)} gives the interface language a home in the schema`,
        );
      }

      c.note(`${callCount} recorded call(s) per language, ${inspected} source file(s) inspected, ` +
        `${migrations.length} migration(s) checked for a language column`);
      return c.verdict(
        "the interface language changes rendered text and number formatting only: the recorded RPC call " +
          "sequence and payloads from the learner cycle and the certificate read are byte-identical in id " +
          "and en, no source file passes the language into a database call, and no migration gives it a " +
          "column. BOUNDED: this drives the application's read paths through a recording client rather " +
          "than a hosted session, so it proves what the application ASKS FOR, not what a live PostgREST " +
          "receives; the hosted half rides on the same call sites",
      );
    },
  },

  {
    id: "UX1-S1-CERT-COLS-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const EXPECTED = [
        "id", "session_id", "institution_id", "certificate_number", "verification_token",
        "status", "issued_at_iso", "revoked_at", "revoked_reason", "supersedes_certificate_id",
      ];
      const FORBIDDEN = ["signature", "key_version", "canonical_payload", "snapshot_id"];

      // 1. the list itself, as the module exports it
      const actual = LIST_COLUMNS.split(",").map((s) => s.trim());
      c.expect(
        JSON.stringify(actual) === JSON.stringify(EXPECTED),
        `the certificate list columns are not the ten Q-11 names:\n  got:      ${actual.join(", ")}\n  expected: ${EXPECTED.join(", ")}`,
      );

      // 2. and no select anywhere under src/ reads `certificates` differently.
      //    Greps the source, because the ruling is about the request that goes
      //    out, and a second select built inline would not be the export above.
      const sources = walk(join(repoRoot, "src")).filter((f) => /\.(ts|tsx)$/.test(f));
      let selects = 0;
      for (const f of sources) {
        const rel = relative(repoRoot, f).replace(/\\/g, "/");
        const text = code(readFileSync(f, "utf8"));
        for (const m of text.matchAll(/\.from\(\s*["']certificates["']\s*\)\s*\.select\(\s*([^)]*)\)/g)) {
          selects++;
          const arg = m[1].trim();
          c.expect(
            arg === "LIST_COLUMNS",
            `${rel} selects from certificates with something other than LIST_COLUMNS: ${arg.slice(0, 120)}`,
          );
        }
        // the cryptographic fields are never named on this side of the wire at
        // all: not requested, not rendered, not retained, not logged
        if (rel.startsWith("src/app/belajar") || rel.startsWith("src/components/sertifikat") || rel === "src/lib/sertifikat.ts") {
          for (const word of FORBIDDEN) {
            const used = new RegExp(`["'\`.]${word}\\b`).test(text);
            c.expect(!used, `${rel} names the cryptographic column ${word} on a learner surface`);
          }
        }
      }
      c.expect(selects >= 1, "no direct read of the certificates table was found to check");

      // 3. V-6a CLOSED: issuance is the SYSTEM's, asked over HTTP from exactly
      //    two declared places — the certificate page's retry (issueIfEligible,
      //    src/lib/sertifikat.ts) and the player's post-Finish request — and no
      //    learner module imports the service-role route itself.
      const pemanggil: string[] = [];
      for (const f of sources) {
        const rel = relative(repoRoot, f).replace(/\\/g, "/");
        if (!rel.startsWith("src/app/belajar") && !rel.startsWith("src/components") && rel !== "src/lib/sertifikat.ts") continue;
        const src = code(readFileSync(f, "utf8"));
        c.expect(!/from\s+["'][^"']*api\/certificates\/issue/.test(src),
          `${rel} imports the service-role issuance route instead of asking it over HTTP`);
        if (/certificates\/issue/.test(src)) pemanggil.push(rel);
      }
      c.expect(
        JSON.stringify(pemanggil.sort()) ===
          JSON.stringify(["src/app/belajar/_components/ItemPlayer.tsx", "src/lib/sertifikat.ts"]),
        `the issuance route is asked from ${JSON.stringify(pemanggil)}; exactly the player and issueIfEligible may`,
      );

      c.note(`${selects} direct select(s) of the certificates table in the source, all on the ten-column list`);
      return c.verdict(
        "the direct certificate-list read in the source requests exactly the ten Q-11 columns and no other; " +
          "signature, key_version, canonical_payload and snapshot_id are named nowhere on a learner surface; " +
          "and issuance is asked over HTTP from exactly the player and issueIfEligible, never imported (V-6a closed)",
      );
    },
  },

  {
    id: "UX1-S1-CERT-ELIGIBLE-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();

      // 1. the binding itself, as the predicates the pages branch on
      c.expect(rendersCredential("ELIGIBLE") === false, "an ELIGIBLE certificate would render as a credential");
      for (const st of ["ISSUED", "REVOKED", "SUPERSEDED"] as const) {
        c.expect(rendersCredential(st) === true, `${st} would not render its retained record`);
      }
      c.expect(rendersVerification("ISSUED") === true, "an ISSUED certificate would show no way to check it");
      for (const st of ["ELIGIBLE", "REVOKED", "SUPERSEDED"] as const) {
        c.expect(
          rendersVerification(st) === false,
          `${st} would offer a verification link; only ISSUED is a credential to present`,
        );
      }

      // 2. and the pages really branch on it before they render any of the six
      //    things the ruling suppresses
      const detail = readFileSync(
        join(repoRoot, "src", "app", "belajar", "[tugas]", "sertifikat", "page.tsx"), "utf8");
      // The import block is not the page: a component imported at the top is
      // not rendered there. What the branch order has to be measured against is
      // where each one is USED.
      const source = code(detail).replace(/^import [^;]*;$/gm, "");
      c.expect(/rendersCredential\(detail\.status\)/.test(source),
        "the detail page does not apply the ELIGIBLE binding to my_certificate's own result");
      c.expect(/rendersVerification\(detail\.status\)/.test(source),
        "the detail page does not gate the verification block on the issued state");
      // the LAST test of the predicate is the branch that returns the pending
      // state; an earlier one (the issuance ask, V-6a) renders nothing
      const eligibleBranch = source.lastIndexOf("!rendersCredential(detail.status)");
      const verificationUrl = source.indexOf("verificationUrl = issued");
      c.expect(eligibleBranch >= 0 && verificationUrl > eligibleBranch,
        "the ELIGIBLE branch does not return before a verification link is built");

      // the six suppressed things, each of which only exists after the branch
      for (const [thing, needle] of [
        ["the QR code", "<KodeVerifikasi"],
        ["the verification link", "verificationUrl"],
        ["the copy-link action", "<SalinTautan"],
        ["the print action", "<AksiCetak"],
        ["the certificate number", "certificate_number"],
        ["the name as issued", "name_as_issued"],
      ] as const) {
        const at = source.indexOf(needle);
        if (at < 0) continue; // the QR lives in the card component, not here
        c.expect(at > eligibleBranch, `${thing} is reachable before the ELIGIBLE branch returns`);
      }

      // 3. the pending state says the honest thing, and offers the learner no
      //    issuance ACTION. V-6a is closed: a passed session with no credential
      //    yet asks for issuance once, server-side, through issueIfEligible --
      //    the issuance route decides (session_is_mine, certificate_prepare), the page only
      //    asks. The page itself never names the route, never posts, and
      //    renders no button that would; the ask happens before the branch.
      c.expect(/sertifikat\.disiapkan\.judul/.test(source), "the pending state has no telling");
      const withoutAsk = source.replace(/issueIfEligible/g, "").replace(/issued/gi, "");
      c.expect(!/issue/i.test(withoutAsk), "the page reaches for issuance other than through issueIfEligible");
      c.expect(!/certificates\/issue|fetch\(|<form|<button/.test(source),
        "the page posts to issuance or renders an action of its own");
      const ask = source.indexOf("issueIfEligible(");
      c.expect(ask < 0 || ask < eligibleBranch, "the issuance ask comes after the ELIGIBLE branch has rendered");

      c.note("the binding's predicates, the detail page's branch order, and the six suppressed affordances");
      return c.verdict(
        "an ELIGIBLE certificate renders no QR, no verification link, no copy-link action, no print action, " +
          "no certificate number and no name-as-issued on either page: the source of the detail page returns " +
          "from the pending branch before any of them is built, and the binding is applied to my_certificate's " +
          "own result as well as to the list's, because that RPC does not filter by status",
      );
    },
  },

  {
    id: "UX1-S1-QR-01",
    requires: [],
    run: async () => {
      const c = new Checks();
      // A QR on a printed certificate is the only part of the credential a
      // stranger uses without reading it. So it is decoded back, by an
      // implementation that is not the one that drew it.
      const links = [
        "https://pintar.example.id/verifikasi/k7QmX2vR9pLwB4tHs8NcY1eDfZ6uJ0aGqKo3iVbMnTx",
        "https://pintar.sekolah-peragaan.sch.id/verifikasi/Pq4Tz8LmN2cW6yH0vR5bK9sX1dJfG3aE7uQiOnYtBvC",
        "http://127.0.0.1:3000/verifikasi/" + "Zz9".repeat(15),
      ];
      for (const link of links) {
        const m = qrMatrix(link);
        const n = m.length;
        const scale = 4, quiet = 4 * scale, w = n * scale + quiet * 2;
        const px = new Uint8ClampedArray(w * w * 4).fill(255);
        for (let r = 0; r < n; r++) {
          for (let col = 0; col < n; col++) {
            if (!m[r][col]) continue;
            for (let dy = 0; dy < scale; dy++) {
              for (let dx = 0; dx < scale; dx++) {
                const i = ((quiet + r * scale + dy) * w + (quiet + col * scale + dx)) * 4;
                px[i] = px[i + 1] = px[i + 2] = 0;
              }
            }
          }
        }
        const decoded = jsQR(px, w, w);
        c.expect(decoded?.data === link, `a ${n}×${n} symbol decoded to ${JSON.stringify(decoded?.data ?? null)}, not the link`);
      }
      // and an over-long input is refused rather than silently truncated: half
      // a verification link in a QR code is worse than no QR code
      let refused = false;
      try { qrMatrix("A".repeat(400)); } catch { refused = true; }
      c.expect(refused, "an input past capacity was encoded anyway rather than refused");

      c.note(`${links.length} verification link(s) encoded and decoded back`);
      return c.verdict(
        "the QR symbol the certificate prints is decoded back to the exact verification link by an " +
          "independent decoder (jsQR), at three lengths and therefore three symbol versions, and an input " +
          "past capacity is refused rather than truncated",
      );
    },
  },
  {
    id: "UX1-S1-KAKI-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const rel = "src/components/KakiPintar.tsx";
      const src = readFileSync(join(repoRoot, rel), "utf8");
      const body = code(src);

      // 1. the four lines Yazid supplied, and nothing invented beside them
      const SUPPLIED = [
        "Dr. dr. Gladys DT Tubarad, M.Pd.Ked",
        "PT ZAYD PINTAR SELALU",
        "info@pintarselalu.com",
        "pintarselalu.com",
      ];
      for (const line of SUPPLIED) {
        c.expect(body.includes(line), `the footer does not carry the supplied line: ${line}`);
      }

      // 2. PROPER NOUNS DO NOT PASS THROUGH THE COPY TABLE. A person's name, a
      //    company's registered name, an email address and a domain are the
      //    same string in both languages; two keys that must never diverge are
      //    a divergence waiting to happen. So they are constants, and the copy
      //    table must not carry them either.
      const hle = readFileSync(join(repoRoot, "src", "lib", "hle.ts"), "utf8");
      for (const line of SUPPLIED) {
        c.expect(!hle.includes(line), `the copy table carries the proper noun ${line}; it cannot be translated`);
      }
      c.expect(!/\bt\(/.test(body), "the footer routes a proper noun through the copy table");

      // 3. the links: protocol in the href, out of the visible text
      c.expect(/href=\{`mailto:\$\{SUREL\}`\}/.test(body), "the email is not a mailto link");
      c.expect(/href=\{`https:\/\/\$\{RANAH\}`\}/.test(body), "the website link carries no scheme");
      c.expect(
        !/>\s*https?:\/\//.test(body),
        "a protocol appears in the footer's visible text; the reader sees the domain, the browser gets the scheme",
      );
      c.expect(/rel="noreferrer"/.test(body), "the external link leaks a referrer");

      // 4. NO PROMOTION. The footer says who stands behind PINTAR and stops.
      for (const [what, pattern] of [
        ["a copyright line", /©|copyright|\(c\)\s*20/i],
        ["a legal claim", /all rights reserved|hak cipta/i],
        ["a social link", /twitter|facebook|instagram|linkedin|x\.com|tiktok|youtube/i],
      ] as const) {
        c.expect(!pattern.test(body), `the footer grew ${what}, which Yazid did not supply`);
      }

      // 5. IT IS NOT ON THE CREDENTIAL. A printed certificate carries its
      //    ISSUING INSTITUTION's identity; the software vendor's name on the
      //    same sheet would be a second claimant to the provenance of the
      //    evidence, which is the one thing a certificate may not be ambiguous
      //    about. Every mount that can reach a printed page suppresses it, and
      //    the certificate card itself never renders it at all.
      const card = readFileSync(
        join(repoRoot, "src", "components", "sertifikat", "KartuSertifikat.tsx"), "utf8");
      c.expect(!/KakiPintar/.test(card), "the credential card renders the corporate footer");
      const detail = readFileSync(
        join(repoRoot, "src", "app", "belajar", "[tugas]", "sertifikat", "page.tsx"), "utf8");
      for (const m of code(detail).matchAll(/<KakiPintar([^/>]*)\/>/g)) {
        c.expect(
          /pin-noprint/.test(m[1]),
          `the certificate page mounts the footer without pin-noprint: <KakiPintar${m[1]}/>`,
        );
      }

      // 6. and it really is mounted where a page ends
      const mounts = walk(join(repoRoot, "src"))
        .filter((f) => /\.tsx$/.test(f))
        .filter((f) => /<KakiPintar/.test(readFileSync(f, "utf8")))
        .map((f) => relative(repoRoot, f).replace(/\\/g, "/"));
      c.expect(mounts.length >= 3, `the footer is mounted on only ${mounts.length} surface(s)`);

      c.note(`${SUPPLIED.length} supplied line(s), ${mounts.length} mount(s), none on the printed sheet`);
      return c.verdict(
        "the application footer in the source src/components/KakiPintar.tsx carries exactly the four lines " +
          "Yazid supplied and nothing beside them; the proper nouns are constants rather than copy-table keys, " +
          "so they cannot diverge between the two languages; the protocol sits in the href and not in the " +
          "visible text; and no mount that can reach a printed certificate renders it, because a credential " +
          "carries its issuing institution's identity and not its software vendor's",
      );
    },
  },
  {
    id: "UX1-BRAND-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const rel = "public/brand/pintar-selalu-logo.png";
      const file = join(repoRoot, rel);
      c.expect(existsSync(file), `the supplied logo asset is missing: ${rel}`);
      if (!existsSync(file)) return c.verdict("the mark");

      // 1. IT IS THE SUPPLIED FILE, BYTE FOR BYTE. Not redrawn, not recoloured,
      //    not cropped, not re-encoded, not "optimised". A digest is the only
      //    check that catches a well-meant recompression, which is exactly the
      //    kind of change that looks like nothing and alters artwork somebody
      //    else owns.
      const bytes = readFileSync(file);
      const SUPPLIED_SHA256 = "0e85e80fb232b299016f3d363102823686a7489e86cb957cfbe0e48128a86463";
      const sha = createHash("sha256").update(bytes).digest("hex");
      c.expect(
        sha === SUPPLIED_SHA256,
        `the logo asset is not the file Yazid supplied:\n  expected ${SUPPLIED_SHA256}\n  found    ${sha}`,
      );

      // 2. and its intrinsic geometry, read from the PNG header rather than
      //    trusted, so a resize is caught even if somebody updates the digest
      c.expect(bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
        "the logo asset is not a PNG");
      const w = bytes.readUInt32BE(16);
      const h = bytes.readUInt32BE(20);
      c.expect(w === 766 && h === 429, `the artwork is ${w}x${h}; the supplied file is 766x429`);
      const ratio = w / h;

      // 3. THE RENDERING CANNOT DISTORT IT. The rule sets a height and never a
      //    width; the intrinsic ratio supplies the rest. A rule that set both
      //    could squash the letterforms, and no amount of care in review
      //    catches a squash of a few per cent.
      const css = code(readFileSync(join(repoRoot, "src", "app", "experience.css"), "utf8"));
      const rule = /\.pin-merek\s*\{([^}]*)\}/.exec(css);
      c.expect(rule !== null, "there is no .pin-merek rule to check");
      if (rule) {
        c.expect(/height:\s*var\(--logo-height\)/.test(rule[1]), ".pin-merek does not take its height from a token");
        c.expect(/width:\s*auto/.test(rule[1]), ".pin-merek does not leave its width to the artwork");
        // Every width declaration in the rule must be `auto`. A negative
        // lookahead here reads well and is wrong: `\s*` backtracks to zero and
        // the guard passes on `width: auto` itself, so the check never fires.
        const widths = [...rule[1].matchAll(/width:\s*([^;]+)/g)].map((m) => m[1].trim());
        c.expect(
          widths.every((v) => v === "auto"),
          `.pin-merek sets a width (${widths.join(", ")}); the artwork would be distorted`,
        );
      }
      const component = code(readFileSync(join(repoRoot, "src", "components", "MerekPintar.tsx"), "utf8"));
      c.expect(!/style=\{\{/.test(component), "the mark carries an inline style; sizing belongs in the token rule");
      c.expect(/alt=\{NAMA\}/.test(component) && /NAMA = "PINTAR SELALU"/.test(component),
        "the mark does not carry its own name as alternative text");
      // the intrinsic attributes must match the file, or the reserved box is
      // the wrong shape and the header shifts as the image lands
      c.expect(new RegExp(`INTRINSIC_WIDTH = ${w}\\b`).test(component)
        && new RegExp(`INTRINSIC_HEIGHT = ${h}\\b`).test(component),
        `the component's intrinsic dimensions do not match the file's ${w}x${h}`);

      // 4. IT IS NOT ON THE CREDENTIAL. The certificate's issuer is the
      //    INSTITUTION. A software vendor's mark on the same sheet would be a
      //    second claimant to the provenance of the evidence.
      const card = readFileSync(
        join(repoRoot, "src", "components", "sertifikat", "KartuSertifikat.tsx"), "utf8");
      c.expect(!/MerekPintar|pin-merek|brand\//.test(card),
        "the credential card renders the PINTAR SELALU mark; the certificate's issuer is the institution");
      const sheet = /\.pin-sheet\b[^{]*\{([^}]*)\}/.exec(css);
      c.expect(sheet === null || !/brand\//.test(sheet[1]), "the printed sheet references the brand asset");

      // 5. and every surface that shows it is an application surface
      const mounts = walk(join(repoRoot, "src"))
        .filter((f) => /\.tsx$/.test(f))
        .filter((f) => /<MerekPintar/.test(readFileSync(f, "utf8")))
        .map((f) => relative(repoRoot, f).replace(/\\/g, "/"));
      c.expect(mounts.length >= 2, `the mark is mounted on only ${mounts.length} surface(s)`);

      c.note(`${w}x${h}, ratio ${ratio.toFixed(4)}, ${bytes.length} bytes, digest verified, ${mounts.length} mount(s)`);
      return c.verdict(
        "the mark rendered by the application is the supplied artwork in public/brand/pintar-selalu-logo.png " +
          "byte for byte -- verified by sha256, so a recompression or a resize fails -- its intrinsic geometry " +
          "is read from the PNG header rather than trusted, the style rule sets a height and never a width so " +
          "the letterforms cannot be squashed, and it appears on no surface that prints a credential",
      );
    },
  },
  {
    id: "UX1-BRAND-02",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const ruling = join(repoRoot, "claude", "UX-1-INSTITUTION-MARK-RULING.md");
      c.expect(existsSync(ruling), "the institution-mark ruling is not recorded");

      // 1. THE Q-7 GAP IS STILL A GAP, measured rather than remembered. The
      //    ruling permits implementation only if the frozen contract already
      //    exposes an institution mark safely. It does not, and this is what
      //    says so out loud the day that changes — so the gap is closed on
      //    purpose, with the delivery path solved, rather than by whoever adds
      //    the obvious column.
      const migrations = walk(join(repoRoot, "supabase", "migrations")).filter((f) => f.endsWith(".sql"));
      // BASELINE MOVED 83 -> 85 on 2026-09-17, which is this tripwire working
      // rather than being worked around. Two Core migrations landed for UX-1
      // Slice 2 -- 20260920090000 (the Q-12 learner discovery contract) and
      // 20260921090000 (pre-start orientation). Both were re-read against §3 of
      // the ruling before this number moved: neither creates a table nor adds a
      // column, so the Q-7 gap below is still a gap and the assertion that
      // matters is unchanged.
      //
      // MOVED AGAIN 85 -> 87 for the first-login tour contract. 20260922090000
      // creates two tables -- tour_registry and person_tour_state -- and so was
      // read against the mark sweep below column by column before this number
      // moved: tour_key, tour_version, auto_presentation_limit, note,
      // declared_at, person_id, auto_shown_count, first_shown_at, last_shown_at,
      // completed_at, suppressed_at, created_at, updated_at. None is a mark, a
      // logo, a crest or a theme, so the Q-7 source still does not exist and the
      // sweep below is asserting over two more files without its answer
      // changing. 20260922100000 replaces one function body and creates nothing.
      //
      // MOVED AGAIN 88 -> 92 for WP1's source-bound metric authorization and
      // objective B. 20260923100000 creates six VIEWS and five functions;
      // 20260923110000 creates one TABLE -- metric_calculator_scope, whose
      // columns are calculation_key, governing_scope, why and declared_at;
      // 20260923120000 adds one enum label; 20260923130000 creates two
      // functions and replaces five. Read against §3 of the ruling column by
      // column before this number moved: not one of those columns is a mark, a
      // logo, a crest or a theme, and the six views project columns that
      // already exist, so the Q-7 source still does not exist and the sweep
      // below asserts over four more files without its answer changing.
      //
      //
      //
      // MOVED 94 -> 95 for WP3's R5 evidence readiness. 20260925100000 creates
      // NO table and adds NO column: one enum, one pure function and two
      // replaced function bodies. There is no new relation for a mark to live
      // in and no column of any kind, so the Q-7 source still does not exist
      // and the sweep below asserts over one more file without its answer
      // changing.
      //
      //
      // MOVED 95 -> 97 for WP5A's institutional identity and resumable bulk
      // provisioning. 20260926100000 adds ONE column -- institutions.namespace,
      // three characters of A-Z0-9 -- and creates institutional_identities
      // whose columns are person_id, institution_id, institutional_id,
      // sequence_number, issued_at and issued_by_person_id. 20260926110000
      // creates import_jobs (institution_id, created_by_person_id, state,
      // row_count, created_at, confirmed_by_person_id, confirmed_at,
      // pilot_verified_by_person_id, pilot_verified_at, completed_at,
      // failure_reason) and import_rows (job_id, ordinal, payload, state,
      // person_id, institutional_id, provisioned_at, failure_reason). Read
      // against §3 of the ruling column by column before this number moved:
      // not one of them is a mark, a logo, a crest or a theme -- a namespace
      // is an identifier prefix and carries no livery -- so the Q-7 source
      // still does not exist and the sweep below asserts over two more files
      // without its answer changing.
      //
      //
      // MOVED 113 -> 114 for BOB-14, lesson content is not public (D-032).
      // 20261008100000 revokes a view and restates the schema lint; it adds no
      // column, colour or brand surface.
      // MOVED 112 -> 113 for BOB-02, the lesson workbook (D-007, D-008).
      // 20261007100000 adds ONE column, items.cycle_role (PRE_TEST or
      // POST_TEST, which assessment a question is for), and no relation: the
      // package check, materialiser, prepare/confirm endpoints and the media
      // upload predicate, plus a replaced ingest_structured_package. Neither
      // the column nor anything else is a mark, a logo, a crest or a theme, and
      // it creates no storage bucket. Read against §3 of the ruling before this
      // number moved (D-024): the Q-7 source still does not exist.
      //
      // MOVED 111 -> 112 for BOB-01, the school structure (D-006) and M5a.
      // 20261006100000 creates NO relation and adds NO column: six structure
      // functions over the existing org_nodes and academic_periods (list,
      // create Bagian / Tingkat / Kelas, rename, deactivate), their internal
      // helpers and registry rows, and two replaced bodies (import_row_problems
      // gains one learner-place rule; import_advance enrols into the place's own
      // period). No mark, no logo, no crest and no theme, and no storage
      // bucket. Read against §3 of the ruling before this number moved: the Q-7
      // source still does not exist.
      //
      // MOVED 110 -> 111 for the repair of that repair (NEW-1, NEW-2).
      // 20261005120000 adds ONE relation, account_activation_grants: an email
      // address, a person or a name, an account kind, a card number, who
      // authorized it, and when it expires and was consumed. Closed to every
      // client role. No mark, no logo, no crest and no theme. Read against §3
      // of the ruling before these numbers moved: the Q-7 source still does
      // not exist.
      //
      //
      // MOVED 108 -> 110 for the systemic repair (R1 and F-01..F-03).
      // 20261005100000 recreates five assessment functions (a conflict and a
      // terminal refusal now carry SQLSTATE codes; a finish verifies the
      // client's manifest) and adds no relation. 20261005110000 recreates the
      // Auth trigger and import_advance and adds three activation functions and
      // their registry rows -- no relation, and nothing that is a mark, a logo,
      // a crest or a theme. Read against §3 of the ruling before these numbers
      // moved: the Q-7 source still does not exist.
      //
      //
      // MOVED 106 -> 108 for the two final release deltas. 20261004100000 adds
      // ONE relation, platform_bootstrap: a single row recording that this
      // installation was initialised, closed to every client role, carrying no
      // mark, no logo, no crest and no theme -- an id, a timestamp and a person.
      // 20261004110000 adds one SYSTEM_ADMIN read and no relation at all. Read
      // against §3 of the ruling before these numbers moved: the Q-7 source
      // still does not exist.
      //
      // MOVED 105 -> 106 for the release rehearsal's one blocker: 20261003100000
      // adds a single operator-only function and one clause inside the
      // existing role-assignment guard. No relation, no column.
      //
      // MOVED 102 -> 105 for WP8. 20261002100000 creates no relation at all --
      // it grants EXECUTE on the ladder helper the org_nodes trigger already
      // called and adds one owner-run assertion. 20261002110000 replaces one
      // trigger function and revokes one dead grant, creating nothing.
      // 20261002120000 adds ONE endpoint (save_report_template) over the
      // report_templates and report_template_metrics tables FABLE-06 already
      // built, and one registry row. Read against §3 of the ruling before
      // these numbers moved: no new relation, no new column, so the Q-7 source
      // still does not exist and the sweep below asserts over three more files
      // without its answer changing.
      //
      // MOVED 101 -> 102 for WP7D's backend unblocker. 20261001100000 creates
      // NO table and adds NO column: one internal set-returning rule
      // (feedback_subject_candidates), one Management read projecting exactly
      // person_id and display_name, one replaced open_feedback_cycle body that
      // now asks that rule instead of restating it, one replaced assertion and
      // one registry row. Read against §3 of the ruling before this number
      // moved: there is no new relation for a mark to live in and no column of
      // any kind, so the Q-7 source still does not exist and the sweep below
      // asserts over one more file without its answer changing.
      //
      // MOVED 100 -> 101 for WP7B's anonymous student-to-educator feedback.
      // 20260930100000 creates NINE tables and adds no column to any existing
      // one. Read against §3 of the ruling column by column before this number
      // moved: feedback_question_sets (version, note, published_at,
      // published_by_person_id, superseded_by); feedback_questions
      // (set_version, question_key, ordinal, label_key);
      // feedback_question_options (set_version, question_key, option_key,
      // ordinal, label_key); feedback_thresholds (version, minimum_responses,
      // statement_key, note, published_at, published_by_person_id,
      // superseded_by); feedback_cycle_transitions (from_state, to_state,
      // note); feedback_cycles (id, institution_id, scope_node_id,
      // academic_period_id, subject_person_id, question_set_version,
      // threshold_version, state, opened_by_person_id, opened_at,
      // closed_by_person_id, closed_at); feedback_opportunities (cycle_id,
      // person_id, consumed); feedback_responses (id, cycle_id,
      // institution_id, question_key, option_key); feedback_results (cycle_id,
      // institution_id, question_set_version, threshold_version,
      // total_responses, body, produced_at). A label key is a localization
      // key, not a livery: not one of those columns is a mark, a logo, a crest
      // or a theme, so the Q-7 source still does not exist and the sweep below
      // asserts over one more file without its answer changing.
      //
      // MOVED 99 -> 100 for WP6A's closure patch. 20260929100000 creates NO
      // table and adds NO column: one predicate naming the startable release
      // state, two replaced function bodies (the learning-cycle arm of
      // start_learning_session, and one token added to the sealed-content
      // guard's protected course fields). Read against §3 of the ruling
      // before this number moved: a release status and a protected column
      // list are neither a mark, a logo, a crest nor a theme, so the Q-7
      // source still does not exist and the sweep below asserts over one more
      // file without its answer changing.
      //
      // MOVED 98 -> 99 for WP6A's academic-evidence boundary correction.
      // 20260928100000 creates NO table and adds NO column: two VIEWS over the
      // evidence boundary (academic_responses, academic_certificates), four
      // replaced views that now read them, three replaced function bodies, one
      // new creation endpoint, one new assert and one registry row. Read
      // against §3 of the ruling before this number moved: a view carries no
      // column of its own that the base tables do not already have, and
      // nothing it selects is a mark, a logo, a crest or a theme, so the Q-7
      // source still does not exist and the sweep below asserts over one more
      // file without its answer changing.
      //
      // MOVED 97 -> 98 for WP6A's educator-as-learner foundation.
      // 20260927100000 adds ONE column -- courses.learning_context, which is
      // ACADEMIC or PROFESSIONAL_DEVELOPMENT -- and creates no table at all.
      // Read against §3 of the ruling before this number moved: a learning
      // context says what a COURSE is, not what a person is, and it is
      // neither a mark, a logo, a crest nor a theme, so the Q-7 source still
      // does not exist and the sweep below asserts over one more file
      // without its answer changing.
      //
      // MOVED 92 -> 94 for WP2's Management decision foundation and the R6
      // academic-result correction. 20260924100000 creates NO table and adds NO
      // column: one replaced function body (role_capabilities, one capability
      // longer), one new predicate and one replaced policy. 20260924110000
      // creates one TABLE -- management_decisions, whose columns are id,
      // family, institution_id, scope_node_id, subject_person_id, source_table,
      // source_id, state, raised_by_person_id, raised_at, raised_note,
      // decided_by_person_id, decided_at, outcome and decision_note -- plus
      // three enums and two endpoints. Read against §3 of the ruling column by
      // column before this number moved: not one of those is a mark, a logo, a
      // crest or a theme, so the Q-7 source still does not exist and the sweep
      // below asserts over two more files without its answer changing.
      //
      // MOVED 87 -> 88 for WP1's authorization-boundary correction.
      // 20260923090000 creates NO table and adds NO column: four functions
      // (metric_computes_tenant_wide, audience_on_node, audience_over_learner,
      // node_in_my_scope), two replaced function bodies, one replaced policy
      // and one client_rpc_registry row. Read against §3 of the ruling before
      // this number moved -- there is no new relation for a mark to live in and
      // no column of any kind, so the Q-7 source still does not exist and the
      // sweep below asserts over one more file without its answer changing.
      c.expect(migrations.length === 114, `${migrations.length} migrations; the frozen baseline has 114`);
      // BOTH SHAPES A COLUMN CAN ARRIVE IN. The first version of this matched
      // only a create-table definition, so a planted `alter table … add column
      // logo_url text` sailed past it — a guard that misses the thing it exists
      // to catch is worse than none, because it reads green while enforcing
      // nothing. Watched to fail in both shapes before being trusted.
      const MARK_NAME = "(?:logo|logo_url|brand|brand_url|mark_url|emblem|crest|wordmark|favicon|theme|theme_json)";
      const MARK_TYPE = "(?:text|uuid|jsonb|json|varchar|bytea)";
      const MARK_COLUMN = new RegExp(
        `(?:^[\\s,]*|add\\s+column\\s+(?:if\\s+not\\s+exists\\s+)?)${MARK_NAME}\\s+${MARK_TYPE}\\b`,
        "im",
      );
      const withColumn = migrations.filter((f) => MARK_COLUMN.test(readFileSync(f, "utf8")))
        .map((f) => relative(repoRoot, f));
      c.expect(
        withColumn.length === 0,
        "an institution-mark or theme column now exists in the schema. That is Q-7 being closed: re-read " +
          "claude/UX-1-INSTITUTION-MARK-RULING.md §3 before wiring it up, because a column alone is not " +
          "sufficient — the public verification page needs a delivery path a stranger can read, and every " +
          "migration asserts there are no public storage buckets:\n  " + withColumn.join("\n  "),
      );

      // and the delivery-path half, which is the one likely to be missed
      const publicBucket = migrations.filter((f) => /insert into storage\.buckets[^;]*\btrue\b/i.test(readFileSync(f, "utf8")))
        .map((f) => relative(repoRoot, f));
      c.expect(publicBucket.length === 0, `a public storage bucket appeared: ${publicBucket.join(", ")}`);

      // 2. BOUNDED BRANDING, NOT TENANT THEMING (ruling §2.3). An institution
      //    may replace the mark. The moment a second thing is configurable per
      //    tenant, the guarantee that every PINTAR screen behaves the same way
      //    for every child is gone.
      const experience = [
        ...walk(join(repoRoot, "src", "components")).filter((f) => /\.tsx?$/.test(f)),
        ...walk(join(repoRoot, "src", "app")).filter((f) => /\.(tsx?|css)$/.test(f)),
      ];
      const THEMING = /\b(tenantTheme|institutionTheme|themeFor|customTheme|brandingFor|tenant_theme|institution_theme|--tenant-|--institution-)\b/;
      for (const f of experience) {
        const rel = relative(repoRoot, f).replace(/\\/g, "/");
        const m = THEMING.exec(code(readFileSync(f, "utf8")));
        c.expect(m === null, `${rel} introduces a per-tenant theming mechanism (${m?.[0]}); the ruling permits the mark and nothing else`);
      }

      // 3. NO INSTITUTION IS NAMED IN src/ AT ALL — and this reads the RAW
      //    source rather than stripping comments, on purpose. A comment cannot
      //    key behaviour to an institution, but the rule costs nothing to obey
      //    (a component can say "an institution") and a strict rule has no
      //    false negative to argue about later. It caught this session writing
      //    the ruling's own example into a doc comment.
      const INSTITUTIONS = /\b(UIN|Universitas Islam Negeri)\b/;
      for (const f of experience) {
        const rel = relative(repoRoot, f).replace(/\\/g, "/");
        c.expect(!INSTITUTIONS.test(readFileSync(f, "utf8")), `${rel} names a specific institution`);
      }

      // 4. and the default is still the default: one component renders the
      //    shell identity, so the future substitution has one place to happen
      const mark = readFileSync(join(repoRoot, "src", "components", "MerekPintar.tsx"), "utf8");
      c.expect(/pintar-selalu-logo\.png/.test(mark), "the default mark is no longer the PINTAR SELALU logo");
      const renderers = experience
        .filter((f) => /\.tsx$/.test(f))
        .filter((f) => /brand\/[a-z-]+\.png/.test(code(readFileSync(f, "utf8"))))
        .map((f) => relative(repoRoot, f).replace(/\\/g, "/"));
      c.expect(
        renderers.length === 1 && renderers[0] === "src/components/MerekPintar.tsx",
        `the brand asset is referenced from ${renderers.length} component(s); the shell identity must have ` +
          `exactly one renderer so an institution mark substitutes in one place: ${renderers.join(", ")}`,
      );

      c.note(`${migrations.length} migrations swept for a mark column, ${experience.length} Experience file(s) for theming`);
      return c.verdict(
        "the institution-mark ruling in claude/UX-1-INSTITUTION-MARK-RULING.md still holds against the tree: " +
          "the Q-7 source does not exist in the 87 frozen migrations and no public storage bucket has appeared, " +
          "so the gap cannot be closed without re-reading the delivery-path half; no per-tenant theming " +
          "mechanism has entered the Experience layer, which is the boundary between bounded branding and " +
          "tenant theming; no specific institution is named in src/; and the shell identity has exactly one " +
          "renderer, so the future substitution has exactly one place to happen",
      );
    },
  },

  // -------------------------------------------------------------------------
  {
    id: "UX1-S0-SAPAAN-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();

      // THE FORM OF ADDRESS, RULED 2026-09-16.
      //
      // "Prefer natural Indonesian that avoids unnecessary pronouns. Where a
      // learner-facing pronoun is necessary, use Anda, not kamu."
      //
      // The rule is about the READER'S pronoun, so this tests the second
      // person only, and only in Indonesian: English has no formal and
      // informal you to choose between.
      //
      // Two halves, because the copy table is not the only place a sentence
      // can reach a learner. Half one reads what `t()` actually renders — the
      // stage overrides included, which is where the informal register lived
      // longest, since a Year 4 telling is exactly where "kamu" feels natural
      // to write. Half two reads the surfaces, where a hard-coded Indonesian
      // string bypasses the table altogether.

      // the guard is only worth its line if it can see the thing it forbids
      c.expect(informal("Sertifikat kamu sedang disiapkan.").length === 1, "the guard misses the standalone pronoun");
      c.expect(informal("Jawabanmu tersimpan.").length === 1, "the guard misses the possessive clitic");
      c.expect(informal("Anda bertemu guru yang berilmu.").length === 0, "the guard trips on an ordinary word ending in -mu");

      // HALF ONE: what the copy table renders to a learner or to the public.
      const rendered = renderAll().filter((r) => r.locale === "id" && (r.persona === "learner" || r.persona === "public"));
      c.expect(rendered.length > 200, `only ${rendered.length} learner/public Indonesian telling(s) swept`);
      for (const r of rendered) {
        const hits = informal(r.text);
        c.expect(
          hits.length === 0,
          `${r.event} addresses the ${r.persona} informally (${hits.join(", ")}): "${r.text}"`,
        );
      }

      // HALF TWO: what the re-set surfaces say without going through the
      // table. Pending surfaces are excluded by the same declaration the
      // token lint uses, so a surface joins this rule on the day its slice
      // re-sets it rather than on the day somebody remembers to add it.
      const surfaces = [
        ...walk(join(repoRoot, "src", "app")).filter((f) => /\.tsx$/.test(f)),
        ...walk(join(repoRoot, "src", "components")).filter((f) => /\.tsx$/.test(f)),
      ].map((f) => relative(repoRoot, f).replace(/\\/g, "/"));
      const inScope = surfaces.filter((f) => !(f in PENDING_SURFACES));
      c.expect(inScope.length > 10, `only ${inScope.length} surface(s) in scope`);
      for (const rel of inScope) {
        const hits = informal(code(readFileSync(join(repoRoot, rel), "utf8")));
        c.expect(hits.length === 0, `${rel} writes an informal second person (${hits.join(", ")})`);
      }

      c.note(
        `${rendered.length} learner/public Indonesian tellings and ${inScope.length} re-set surface(s) swept; ` +
          `${Object.keys(PENDING_SURFACES).length} surface(s) join the rule when their slice re-sets them`,
      );
      return c.verdict(
        "no Indonesian telling addressed to a learner or to the public uses an informal second person, in the " +
          "copy table src/lib/hle.ts or on any re-set surface: where the reader is addressed at all it is as " +
          "Anda, and most tellings carry no pronoun because Indonesian does not need one",
      );
    },
  },

  // -------------------------------------------------------------------------
  {
    id: "UX1-S0-FAKTA-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();

      // THE RESPONSIVE FACT STACK, RULED 2026-09-16.
      //
      // A compact fact summary reads left to right across a wide column and
      // stacks label over value on a narrow one. The rule is site-wide for
      // this structure, which in CSS means: `.pin-facts` is the structure,
      // and every rule that touches it inside the phone block either stacks
      // it or is the sheet, which is paper and does not reflow.
      //
      // The subtle half is the MORE SPECIFIC selector. `.pin-commit
      // .pin-facts` outranks `.pin-facts` at any width, so a stack written
      // only on the plain selector silently leaves the commitment shell —
      // the screen the correction was raised against — in three columns.
      const css = readFileSync(join(repoRoot, "src", "app", "experience.css"), "utf8");
      const PHONE = "@media (max-width: 560px) {";

      /** The body of a block, balanced braces, from its opening line. */
      function block(source: string, open: string): string {
        const start = source.indexOf(open);
        if (start < 0) return "";
        let depth = 0;
        for (let i = start + open.length - 1; i < source.length; i++) {
          if (source[i] === "{") depth++;
          else if (source[i] === "}" && --depth === 0) return source.slice(start + open.length, i);
        }
        return "";
      }

      /** Every rule in a stylesheet body, as selector plus declarations. */
      function rules(body: string): Array<{ sel: string; decl: string }> {
        const out: Array<{ sel: string; decl: string }> = [];
        for (const m of body.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
          out.push({ sel: m[1].replace(/\/\*[\s\S]*?\*\//g, " ").trim(), decl: m[2] });
        }
        return out;
      }

      // EVERY phone block, not the first one. The stylesheet grew a second
      // one when Slice 2 landed, and a rule in the first block can be
      // overridden by a base rule written between the two.
      const phoneBlocks: string[] = [];
      for (let i = css.indexOf(PHONE); i >= 0; i = css.indexOf(PHONE, i + 1)) {
        phoneBlocks.push(block(css.slice(i), PHONE));
      }
      const phone = phoneBlocks.join("\n");
      c.expect(phone.length > 200, "the phone block was not found in src/app/experience.css");

      // AND THE STACK MUST WIN, NOT MERELY EXIST.
      //
      // This is the half the first version of this test was missing. It
      // asserted that a narrow rule with `1fr` was PRESENT, and passed while
      // the orientation was still two cramped columns on a phone: the stack
      // sat in the first phone block and the base rule for the same selector
      // is written further down the file. Same specificity, later rule wins,
      // stack never happens. A screenshot caught it; the test did not.
      //
      // Positions are compared by walking the rules rather than by building a
      // regex per selector — the first attempt at this did build regexes, got
      // the escaping wrong, matched nothing, and silently skipped all three
      // selectors while reporting success.
      type Placed = { sels: string[]; decl: string; at: number };
      function placed(body: string, offset: number): Placed[] {
        const out: Placed[] = [];
        for (const m of body.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
          out.push({
            sels: m[1].replace(/\/\*[\s\S]*?\*\//g, " ").split(",").map((x) => x.trim()).filter(Boolean),
            decl: m[2],
            at: offset + (m.index ?? 0),
          });
        }
        return out;
      }
      /** Media queries blanked out, so what is left is the unconditional CSS. */
      const baseCss = css.replace(/@media[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, (m) => " ".repeat(m.length));
      const baseRules = placed(baseCss, 0);
      const narrowRules: Placed[] = [];
      for (let i = css.indexOf(PHONE); i >= 0; i = css.indexOf(PHONE, i + 1)) {
        narrowRules.push(...placed(block(css.slice(i), PHONE), i + PHONE.length));
      }
      const COLS = /grid-template-columns:\s*([^;]+)/;
      let ordered = 0;
      for (const sel of [".pin-facts", ".pin-commit .pin-facts", ".pin-orient .pin-facts"]) {
        const lastBase = baseRules.filter((r) => r.sels.includes(sel) && COLS.test(r.decl)).pop();
        const lastNarrow = narrowRules
          .filter((r) => r.sels.includes(sel) && /grid-template-columns:\s*1fr\b/.test(r.decl))
          .pop();
        if (!lastBase) continue;
        c.expect(lastNarrow !== undefined, `"${sel}" has a wide rule and no narrow one`);
        if (!lastNarrow) continue;
        c.expect(
          lastNarrow.at > lastBase.at,
          `"${sel}" is stacked at offset ${lastNarrow.at} but its wide rule is written at ${lastBase.at}, ` +
            `later in the file at the same specificity — so the wide rule wins and the stack never happens`,
        );
        ordered++;
      }
      c.expect(ordered === 3, `only ${ordered} of 3 fact-summary selectors were order-checked`);

      // 1. wide is horizontal: the structure exists and has more than one column
      const wide = rules(css.slice(0, css.indexOf("@media (max-width: 560px)")))
        .filter((r) => /(^|,|\s)\.pin-facts(\s|,|$)/.test(r.sel) && /grid-template-columns/.test(r.decl));
      c.expect(wide.length > 0, "no wide rule sets the columns of .pin-facts");
      for (const r of wide) {
        const cols = /grid-template-columns:\s*([^;]+)/.exec(r.decl)?.[1].trim() ?? "";
        c.expect(/repeat\(\s*[2-9]/.test(cols), `the wide treatment of "${r.sel}" is not a horizontal row: ${cols}`);
      }

      // 2. narrow is a stack, for EVERY selector whose subject is .pin-facts,
      //    however specific — except the sheet
      const narrow = rules(phone).filter((r) => /\.pin-facts/.test(r.sel));
      c.expect(narrow.length >= 2, `only ${narrow.length} narrow rule(s) touch .pin-facts; the specific selector is unguarded`);
      let stacked = 0;
      let sheet = 0;
      for (const r of narrow) {
        const cols = /grid-template-columns:\s*([^;]+)/.exec(r.decl)?.[1].trim();
        if (/\.pin-sheet/.test(r.sel)) {
          c.expect(
            cols !== undefined && /repeat\(\s*[2-9]/.test(cols),
            `the sheet's facts reflow at phone width (${cols}); A4 is scaled whole, never reflowed`,
          );
          sheet++;
          continue;
        }
        c.expect(cols !== undefined, `"${r.sel}" is narrowed without setting its columns, so it keeps the wide row`);
        c.expect(cols === "1fr", `"${r.sel}" is not a single-column stack at phone width: ${cols}`);
        // by selector, not by rule: one comma-separated rule can narrow the
        // plain class and the specific one together, and "1" would read as a
        // gap that is not there
        stacked += r.sel.split(",").length;
      }
      c.expect(sheet === 1, `${sheet} sheet exception(s); the paper is the one thing that does not narrow`);

      // 3. every selector that narrows .pin-facts anywhere is covered above,
      //    including the ones that outrank the plain class
      const specific = narrow.filter((r) => /\S+\s+\.pin-facts/.test(r.sel) && !/\.pin-sheet/.test(r.sel));
      const plain = narrow.filter((r) => /(^|,)\s*\.pin-facts\s*(,|$)/.test(r.sel));
      c.expect(plain.length > 0, ".pin-facts itself is never stacked at phone width");
      c.expect(
        specific.length > 0,
        "no descendant selector of .pin-facts is stacked at phone width, yet the wide stylesheet has one " +
          "(.pin-commit .pin-facts) that outranks the plain class — the commitment shell would stay horizontal",
      );

      // 4. nothing was added to carry the change. The ruling said the stack
      //    is the whole change: no icons, no markers, no rules drawn between
      //    the pairs to hold them together once they are no longer columns.
      for (const r of rules(css).filter((x) => /\.pin-facts/.test(x.sel) && /::(before|after)/.test(x.sel))) {
        c.expect(false, `"${r.sel}" adds a generated marker to the fact summary`);
      }

      // 5. and the other compact label/value structure narrows the same way,
      //    which is what makes this a pattern rather than one fix
      const dl = rules(phone).find((r) => /\.pin-dl\s*>\s*div/.test(r.sel));
      c.expect(dl !== undefined, ".pin-dl does not narrow at phone width");
      c.expect(
        /grid-template-columns:\s*1fr/.test(dl?.decl ?? ""),
        "the verification page's label/value rows do not stack at phone width, so the two compact structures " +
          "in the product disagree about what narrow means",
      );

      c.note(`${stacked} fact summar(ies) stacked at phone width, ${sheet} sheet exception, ${wide.length} wide rule(s)`);
      return c.verdict(
        "the compact fact summary stacks label over value below 560px wherever it occurs — on the plain class " +
          "and on the more specific selector that outranks it — while the A4 sheet keeps its printed row " +
          "because it is scaled whole rather than reflowed; the verification page's label/value rows narrow " +
          "the same way; and nothing was added to carry the change",
      );
    },
  },

  // -------------------------------------------------------------------------
  {
    id: "UX1-S2-POSISI-01",
    requires: [],
    run: async () => {
      const c = new Checks();

      // WHERE THE LEARNER IS, AND WHAT THE HOME LEADS WITH.
      //
      // The Slice-2 home carries ONE next action and decides it from cycle
      // state rather than from list order. That decision is the piece of the
      // slice that can be wrong invisibly: a misplaced dot on a trail is
      // obvious, a home that confidently recommends the wrong thing looks
      // exactly like one that recommends the right thing.
      //
      // So the derivation is a pure function and this drives it through every
      // state a cycle can be in — no database, which is also why it runs at
      // all in a container where the db facility is absent.
      const S = (o: Partial<Record<string, string | null>> = {}) => ({
        pre_assignment: "pre", pre_session: null, pre_status: null,
        post_assignment: "post", post_session: null, post_status: null, ...o,
      }) as Parameters<typeof posisi>[0];
      const L = (read: number, total: number) =>
        Array.from({ length: total }, (_, i) => ({
          lesson_id: `l${i}`, modul: "m", urutan: i, judul: "t", ringkasan: null,
          isi: null, contoh: [], media: [], halaman: null,
          furthest_position: i < read ? 10 : 0, total_positions: 10,
        })) as Parameters<typeof posisi>[1];

      const CASES: Array<{ what: string; state: ReturnType<typeof S>; lessons: ReturnType<typeof L>; langkah: string; indeks: number }> = [
        { what: "nothing started", state: S(), lessons: L(0, 5), langkah: "PEMETAAN", indeks: 0 },
        { what: "mapping open but unfinished", state: S({ pre_session: "s", pre_status: "IN_PROGRESS" }), lessons: L(0, 5), langkah: "PEMETAAN", indeks: 0 },
        { what: "mapping submitted, not yet scored", state: S({ pre_session: "s", pre_status: "SUBMITTED" }), lessons: L(0, 5), langkah: "PEMETAAN", indeks: 0 },
        { what: "mapping done, nothing read", state: S({ pre_status: "FINALIZED" }), lessons: L(0, 5), langkah: "PETA", indeks: 1 },
        { what: "part-way through the lessons", state: S({ pre_status: "FINALIZED" }), lessons: L(3, 5), langkah: "PELAJARAN", indeks: 2 },
        { what: "every lesson read", state: S({ pre_status: "FINALIZED" }), lessons: L(5, 5), langkah: "PENGUASAAN", indeks: 3 },
        { what: "mastery check open", state: S({ pre_status: "FINALIZED", post_session: "p", post_status: "IN_PROGRESS" }), lessons: L(2, 5), langkah: "PENGUASAAN", indeks: 3 },
        { what: "mastery check paused", state: S({ pre_status: "FINALIZED", post_session: "p", post_status: "PAUSED" }), lessons: L(5, 5), langkah: "PENGUASAAN", indeks: 3 },
        { what: "mastery check finished", state: S({ pre_status: "FINALIZED", post_session: "p", post_status: "FINALIZED" }), lessons: L(5, 5), langkah: "HASIL", indeks: 4 },
        // THE ONE THAT MATTERS: the cycle is a record of what happened, not a
        // checklist somebody has to satisfy in order. A learner who finished
        // the Mastery Check without opening a lesson is at the result.
        { what: "finished without reading a single lesson", state: S({ pre_status: "FINALIZED", post_session: "p", post_status: "FINALIZED" }), lessons: L(0, 5), langkah: "HASIL", indeks: 4 },
        { what: "a course with no lessons at all", state: S({ pre_status: "FINALIZED" }), lessons: L(0, 0), langkah: "PETA", indeks: 1 },
      ];
      for (const t of CASES) {
        const p = posisi(t.state, t.lessons);
        c.expect(p.langkah === t.langkah, `${t.what}: step is ${p.langkah}, expected ${t.langkah}`);
        c.expect(p.indeks === t.indeks, `${t.what}: index is ${p.indeks}, expected ${t.indeks}`);
      }

      // the trail draws five steps and the index always addresses one of them
      c.expect(LANGKAH.length === 5, `the trail has ${LANGKAH.length} steps, not five`);
      for (const t of CASES) {
        const p = posisi(t.state, t.lessons);
        c.expect(LANGKAH[p.indeks] === p.langkah, `${t.what}: index and step disagree`);
      }

      // every step has copy, and it is the existing cycle.step.* keys rather
      // than a second set that can drift from the ones already on screen
      for (const l of LANGKAH) {
        const k = LANGKAH_KEY[l];
        c.expect(allKeys().includes(k as HleEvent), `the step ${l} maps to ${k}, which is not in the copy table`);
        c.expect(k.startsWith("cycle.step."), `the step ${l} uses ${k} rather than the existing cycle.step.* key`);
      }
      // and the enum never reaches a reader
      for (const l of LANGKAH) {
        for (const locale of LOCALES) {
          const text = t(LANGKAH_KEY[l] as HleEvent, "learner", { locale });
          c.expect(!text.includes(l), `the step telling in ${locale} contains the raw enum ${l}: "${text}"`);
        }
      }

      // ---- THE RANKING -------------------------------------------------
      const K = (title: string, state: ReturnType<typeof S>, lessons: ReturnType<typeof L>, berjalan = false) => ({
        tugas: { learning_assignment_id: title, course_id: "c", plp_release_id: "r", subject: "s",
                 stage: "SMA", grade_label: "10", title,
                 pre_test_assignment: "pre", post_test_assignment: "post" },
        posisi: posisi(state, lessons), berjalan,
      }) as Parameters<typeof peringkat>[0][number];

      // the approved order: a running session, then an unstarted mapping, then
      // unread lessons, then an untaken Mastery Check
      const mixed = [
        K("lessons", S({ pre_status: "FINALIZED" }), L(2, 5)),
        K("untaken mastery", S({ pre_status: "FINALIZED" }), L(5, 5)),
        K("unstarted mapping", S(), L(0, 5)),
      ];
      const r1 = peringkat(mixed);
      c.expect(r1.utama?.tugas.title === "untaken mastery",
        `the home leads with "${r1.utama?.tugas.title}"; an untaken Mastery Check outranks an unstarted mapping`);

      // a session already open jumps every rank, whatever step it belongs to
      const r2 = peringkat([
        K("unstarted mapping", S(), L(0, 5)),
        K("running", S({ pre_status: "FINALIZED", post_session: "p", post_status: "IN_PROGRESS" }), L(1, 5), true),
      ]);
      c.expect(r2.utama?.tugas.title === "running",
        `the home leads with "${r2.utama?.tugas.title}"; a session left open is the one obvious next action`);

      // a finished cycle is never "the one thing": it is a result to collect,
      // not work to do
      const done = K("finished", S({ pre_status: "FINALIZED", post_session: "p", post_status: "FINALIZED" }), L(5, 5));
      c.expect(peringkat([done]).utama === null,
        "a learner with nothing but a finished cycle is told to go back to something they finished");
      const r3 = peringkat([done, K("lessons", S({ pre_status: "FINALIZED" }), L(1, 5))]);
      c.expect(r3.utama?.tugas.title === "lessons", "a finished cycle outranked real work");
      c.expect(r3.sisa.length === 1 && r3.sisa[0].tugas.title === "finished",
        "the finished cycle vanished instead of falling to the rest of the list");

      // ranking never invents or loses an assignment
      c.expect(r1.sisa.length === mixed.length - 1, `ranking returned ${r1.sisa.length + 1} of ${mixed.length} assignments`);
      c.expect(peringkat([]).utama === null, "an empty list produced a recommendation");

      // ORDERING IS TOTAL, and the case that proves it is a TIE. Reversing a
      // list whose entries all sit at different steps proves nothing: the step
      // ranking alone decides it and the tie-break never runs. So the tie is
      // built on purpose — two assignments at the same step, equally far
      // through their lessons — and reversing it must not change the answer.
      // Without a total order the sort falls back to arrival order, which is
      // list position wearing a different name.
      const tie = [
        K("Bab 2: Dinamika Litosfer", S({ pre_status: "FINALIZED" }), L(2, 5)),
        K("Bab 4: Sistem Persamaan Linear", S({ pre_status: "FINALIZED" }), L(2, 5)),
      ];
      const fwd = peringkat(tie);
      const bwd = peringkat([...tie].reverse());
      c.expect(
        fwd.utama?.tugas.title === bwd.utama?.tugas.title,
        `two assignments at the same step rank by arrival order: forwards gives "${fwd.utama?.tugas.title}", ` +
          `backwards gives "${bwd.utama?.tugas.title}" — which is list position by another name`,
      );
      c.expect(
        fwd.sisa.map((k) => k.tugas.title).join("|") === bwd.sisa.map((k) => k.tugas.title).join("|"),
        "the REST of the list is ordered by arrival too, so the home reshuffles itself between two reads",
      );
      // and the same for a list whose steps do differ
      const rev = peringkat([...mixed].reverse());
      c.expect(rev.utama?.tugas.title === r1.utama?.tugas.title,
        "the recommendation depends on the order the assignments arrived in");
      // the lesson-progress tie-break itself: further through wins
      const nearer = peringkat([
        K("barely started", S({ pre_status: "FINALIZED" }), L(1, 5)),
        K("nearly done", S({ pre_status: "FINALIZED" }), L(4, 5)),
      ]);
      c.expect(nearer.utama?.tugas.title === "nearly done",
        `the home leads with "${nearer.utama?.tugas.title}"; the assignment with least left to do is the one to finish`);

      c.note(`${CASES.length} cycle state(s) and ${LANGKAH.length} trail step(s) driven through the pure derivation`);
      return c.verdict(
        "the learner's position in a cycle is derived in src/lib/siklus.ts from cycle state and lesson " +
          "progress across every state a cycle can hold — including a Mastery Check finished without a " +
          "lesson ever being opened, which the trail must report as the result rather than as unread work — " +
          "and the home's single recommendation follows the approved ranking rather than list position: a " +
          "running session first, a finished cycle never, and the same answer whatever order the rows arrive in",
      );
    },
  },

  // -------------------------------------------------------------------------
  {
    id: "UX1-S2-MELIHAT-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();

      // THE FOUR SLICE-2 RULINGS OF 2026-09-17, MADE MECHANICAL AGAINST THE
      // SOURCE. Each of them is the kind of thing that is obeyed on the day it
      // is written and quietly undone six weeks later by somebody fixing
      // something else, so each gets a predicate rather than a paragraph.
      const player = join(repoRoot, "src", "app", "belajar", "_components", "PermukaanAsesmen.tsx");
      const orient = join(repoRoot, "src", "components", "siklus", "OrientasiAsesmen.tsx");
      const actionsFile = join(repoRoot, "src", "app", "belajar", "actions.ts");
      for (const f of [player, orient, actionsFile]) {
        c.expect(existsSync(f), `${relative(repoRoot, f)} does not exist`);
      }
      if (!existsSync(player) || !existsSync(orient)) return c.verdict("the Slice-2 assessment surface is missing");

      // ---- 1. LOOKING IS NOT COMMITTING ---------------------------------
      //
      // Reading an orientation must create no session and spend no attempt.
      // The database half is Bob's (assessment_orientation() is `stable` and
      // inserts nothing); this is the half on this side of the wire: NO
      // LEARNER PAGE MAY START A SESSION WHILE RENDERING.
      //
      // Before Slice 2 both assessment routes called startSession() in their
      // render path, which made ARRIVING AT THE URL the act of committing —
      // and made it impossible to show the integrity disclosure before the
      // thing it discloses about. That is the defect this half prevents
      // returning.
      const pages = walk(join(repoRoot, "src", "app")).filter((f) => /page\.tsx$/.test(f));
      c.expect(pages.length > 10, `only ${pages.length} page(s) found`);
      const STARTS = /\b(startSession|start_learning_session)\b/;
      for (const f of pages) {
        const rel = relative(repoRoot, f).replace(/\\/g, "/");
        c.expect(
          !STARTS.test(code(readFileSync(f, "utf8"))),
          `${rel} starts a session while rendering, so visiting the URL is the commitment`,
        );
      }
      // The surface that shows the orientation must not start one either.
      c.expect(
        !STARTS.test(code(readFileSync(player, "utf8"))),
        "PermukaanAsesmen starts a session while rendering",
      );

      // The start is a FORM POST, not a link. A link is prefetched by the
      // router, pre-rendered by the browser and brushed by a thumb on a
      // scroll; any of those would silently spend the one attempt a PAPER
      // assessment allows. Exactly one place may create a session, and it is
      // reached by a verb.
      const actions = code(readFileSync(actionsFile, "utf8"));
      c.expect(/export async function mulaiAsesmen\(/.test(actions),
        "there is no server action that starts an assessment");
      c.expect(/formData/.test(actions),
        "the start action does not take form data, so it is reachable without a form submission");
      const surface = code(readFileSync(player, "utf8"));
      c.expect(/<form action=\{mulaiAsesmen\}/.test(surface),
        "the start is not a form submission");
      // and no Link anywhere in the surface points at the action
      c.expect(!/<Link[^>]*mulaiAsesmen/.test(surface), "a Link invokes the start action");

      // ---- 2. THE ORIENTATION'S AUTHORIZATION IS NOT WEAKENED -------------
      //
      // assessment_orientation() is gated by may_start_assessment() and
      // returns NO ROW when the learner may not begin. The ruling: do not
      // replace that with a disabled orientation page after eligibility is
      // gone. So a null must reach the refusal, and the surface must not
      // second-guess the gate with a check of its own.
      c.expect(/if \(!orientasi\)/.test(surface), "the surface does not branch on a missing orientation");
      const nullBranch = /if \(!orientasi\) \{\s*return <HalamanPenolakan/.test(surface);
      c.expect(nullBranch, "a missing orientation does not render the one refusal page");
      c.expect(!/disabled/.test(surface),
        "the assessment surface renders a disabled control, which is how a refused orientation comes back as a greyed-out page");
      // No second eligibility opinion in this process: may_start_assessment is
      // the database's answer and the RPCs ask it themselves.
      c.expect(!/\bmayStart\b/.test(surface),
        "the surface asks may_start_assessment itself, which is a second opinion that can drift from the gate the RPCs use");

      // ---- 3. NO ESTIMATED DURATION, AND NONE DERIVED --------------------
      //
      // Ruled out because no legitimate duration fact exists. A plausible
      // number is worse than no number: a learner arranges an afternoon around
      // "40 minutes" and the arrangement is the product's fault.
      const types = readFileSync(join(repoRoot, "src", "lib", "assessment-engine", "types.ts"), "utf8");
      const oriType = /export type Orientation = \{([^}]*)\}/.exec(types)?.[1] ?? "";
      c.expect(oriType.length > 0, "the Orientation type was not found");
      for (const field of ["duration", "durasi", "minutes", "menit", "estimated", "perkiraan", "time_limit"]) {
        c.expect(!oriType.includes(field), `the Orientation type carries a duration field (${field})`);
      }
      // and the component computes none out of what it does have
      const oriSrc = code(readFileSync(orient, "utf8"));
      for (const derived of ["item_count *", "item_count*", "* 60", "/ 60", "hesitation_window_seconds *"]) {
        c.expect(!oriSrc.includes(derived), `the orientation derives a duration (${derived})`);
      }
      // no copy key offers one either, in either language
      for (const k of allKeys()) {
        if (!k.startsWith("siklus.")) continue;
        for (const locale of LOCALES) {
          const text = t(k as HleEvent, "learner", { locale }).toLowerCase();
          const bad = ["perkiraan waktu", "estimated time", "menit", "minutes"].find((w) => text.includes(w));
          c.expect(bad === undefined, `${k} offers a duration in ${locale} ("${bad}"): "${text}"`);
        }
      }

      // ---- 4. THE FACTS THAT DO EXIST ARE STILL SHOWN --------------------
      // Removing the duration must not take the true facts with it.
      c.expect(/siklus\.jumlah_soal/.test(oriSrc), "the orientation no longer shows how many questions");
      c.expect(/siklus\.ditutup/.test(oriSrc), "the orientation no longer shows when it closes");
      c.expect(/orientasi\.item_count/.test(oriSrc), "the question count is not read from the orientation");
      c.expect(/orientasi\.closes_at/.test(oriSrc), "the closing time is not read from the orientation");
      // and they render through the shared compact fact summary, so the
      // approved responsive stack applies to them without being restated
      c.expect(/className="pin-facts"/.test(oriSrc),
        "the orientation facts do not use the shared compact fact summary, so the responsive stack does not reach them");

      // ---- 5. Q-15, VERBATIM ---------------------------------------------
      //
      // Neither telling may be edited. "dicatat", not "dipantau"; observation,
      // never judgment; no category list; no device named.
      const Q15_ID =
        "Selama asesmen, aktivitas sesi tertentu dapat dicatat untuk menjaga integritas proses. " +
        "Catatan ini merupakan observasi dan tidak menentukan hasil Anda secara otomatis.";
      const Q15_EN =
        "During the assessment, certain session activity may be recorded to support process integrity. " +
        "These records are observations and do not automatically determine your result.";
      c.expect(t("siklus.catatan.isi" as HleEvent, "learner", { locale: "id" }) === Q15_ID,
        "the Indonesian integrity disclosure is not the ruled wording");
      c.expect(t("siklus.catatan.isi" as HleEvent, "learner", { locale: "en" }) === Q15_EN,
        "the English integrity disclosure is not the ruled wording");
      // the forbidden register, checked rather than trusted
      for (const locale of LOCALES) {
        const text = t("siklus.catatan.isi" as HleEvent, "learner", { locale }).toLowerCase();
        for (const w of ["dipantau", "monitored", "webcam", "kamera", "camera", "microphone", "mikrofon",
                         "layar", "screen record", "keystroke", "rekam layar", "diawasi", "surveillance"]) {
          c.expect(!text.includes(w), `the disclosure in ${locale} uses the forbidden word "${w}"`);
        }
      }
      // it is a quiet paragraph on the well, NOT an alert: the ruling says
      // these records are observation and not judgment, and a bordered warning
      // would say the opposite of the words inside it
      c.expect(/className="pin-catatan"/.test(oriSrc), "the disclosure is not rendered on the well");
      c.expect(!/role="alert"/.test(oriSrc), "the disclosure is announced as an alert");
      const css = readFileSync(join(repoRoot, "src", "app", "experience.css"), "utf8");
      const catatan = /\.pin-catatan \{([^}]*)\}/.exec(css)?.[1] ?? "";
      c.expect(catatan.length > 0, ".pin-catatan is not styled");
      c.expect(!/border:/.test(catatan) && !/status-attention|status-blocked/.test(catatan),
        `the disclosure is drawn as a warning box: ${catatan.trim()}`);
      // and it is shown BEFORE the thing it discloses about — in the
      // orientation, which is the screen that exists before the session
      c.expect(!/siklus\.catatan\.isi/.test(code(readFileSync(
        join(repoRoot, "src", "app", "belajar", "_components", "ItemPlayer.tsx"), "utf8"))),
        "the disclosure appears inside the player, which is after the commitment it discloses about");

      c.note(`${pages.length} page(s) swept for a render-time session start; Q-15 compared verbatim in ${LOCALES.length} languages`);
      return c.verdict(
        "the four Slice-2 rulings hold against the source: no page under src/app starts a session while " +
          "rendering and the only thing that starts one is a form-submitted server action, so looking at an " +
          "assessment is not committing to it; a missing orientation reaches the one refusal page rather than " +
          "a disabled orientation, and the surface asks no second eligibility question of its own; the " +
          "Orientation type carries no duration field, the component derives none from what it does have, and " +
          "no Slice-2 copy key offers one in either language, while the two facts that are real are still read " +
          "and still rendered through the shared compact fact summary; and the integrity disclosure is the " +
          "ruled wording byte for byte in both languages, drawn as a paragraph on the well rather than an " +
          "alert, on the screen that comes before the session rather than inside it",
      );
    },
  },

  // ═══════════════════════════════════════════ UX-1 Slice 3 · the educator
  {
    id: "UX1-S3-LINGKUP-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const A = "aaaaaaaa-0000-0000-0000-000000000001";
      const B = "bbbbbbbb-0000-0000-0000-000000000002";
      const DEPT = "dddddddd-0000-0000-0000-00000000000d";
      const lama = new Date("2020-01-01T00:00:00Z").toISOString();
      const nanti = new Date("2099-01-01T00:00:00Z").toISOString();
      const now = new Date("2026-09-17T03:00:00Z");

      // 1. a grant is a teaching context only while it is live
      const hibah = [
        { scope_node_id: DEPT, institution_id: "i", valid_from: lama, valid_until: nanti },
        { scope_node_id: A, institution_id: "i", valid_from: lama, valid_until: nanti, revoked_at: lama },
        { scope_node_id: B, institution_id: "i", valid_from: lama, valid_until: lama },
        { scope_node_id: null, institution_id: null, valid_from: lama, valid_until: nanti },
      ];
      const aktif = hibahAktif(hibah, now);
      c.expect(aktif.length === 1, `${aktif.length} grants read as live; only the unrevoked, in-date, node-bearing one is`);
      c.expect(nodeLingkup(hibah, now).join() === DEPT, "the scope set is not exactly the live grant's node");

      // 2. the containment predicate mirrors `v_jalur @> array[scope]`, including
      //    that a node's own jalur contains itself
      c.expect(dalamLingkup({ jalur: ["inst", DEPT, A] }, [DEPT]), "a class beneath the granted node is not in scope");
      c.expect(dalamLingkup({ jalur: ["inst", DEPT] }, [DEPT]), "the granted node itself is not in its own scope");
      c.expect(!dalamLingkup({ jalur: ["inst", "other", B] }, [DEPT]), "a class outside the grant is in scope");
      c.expect(!dalamLingkup({ jalur: [] }, [DEPT]), "a node with no path is in scope — the predicate does not fail closed");
      c.expect(!dalamLingkup({ jalur: null }, [DEPT]), "a node with a null path is in scope — the predicate does not fail closed");

      // 3. THE ADVERSARIAL PLANT. A class from another department is planted in
      //    the rows the query returned. Dropping it quietly would let the query
      //    rot undetected, so the re-check must REFUSE rather than filter.
      const sah = { id: A, name: "Kelas 10A", kind: "CLASS", jalur: ["inst", DEPT, A], institution_id: "i", academic_period_id: "p" };
      const asing = { id: B, name: "Kelas 12B", kind: "CLASS", jalur: ["inst", "other", B], institution_id: "i", academic_period_id: "p" };
      let refused = false;
      try { kelasDalamLingkup([sah, asing], [DEPT]); } catch (e) { refused = e instanceof LingkupError; }
      c.expect(refused, "a class outside the grants survived the re-check instead of refusing it");
      let refusedKind = false;
      try { kelasDalamLingkup([{ ...sah, kind: "COHORT" }], [DEPT]); } catch (e) { refusedKind = e instanceof LingkupError; }
      c.expect(refusedKind, "a non-class node survived the re-check");
      c.expect(kelasDalamLingkup([sah], [DEPT]).length === 1, "a class inside the grants did not survive");
      c.expect(kelasDalamLingkup([{ ...sah, is_active: false }], [DEPT]).length === 0, "a closed class is still offered");

      // 4. THE NARROWING HAPPENS IN POSTGRES, not in this process. A filter run
      //    over a school-wide population in the application is exactly what the
      //    ruling forbids, so the source must carry the overlap as a query.
      const lib = readFileSync(join(repoRoot, "src", "lib", "pengajar.ts"), "utf8");
      const derivation = code(lib);
      c.expect(/\.overlaps\("jalur"/.test(derivation), "the class read does not narrow by jalur in the query");
      c.expect(/from\("role_assignments"\)/.test(derivation), "the teaching context is not derived from role_assignments");
      c.expect(/\.eq\("person_id", me\)/.test(derivation), "the grant read is not narrowed to the reader's own rows");
      // and it must not derive scope from a role NAME — the thing doc 05 forbids
      for (const peran of ["EDUCATOR", "HEAD_OF_DEPARTMENT", "INSTITUTION_ADMIN", "DEAN"]) {
        c.expect(!new RegExp(`"${peran}"`).test(derivation), `the educator data layer names the role ${peran} in code`);
      }
      const murni = code(readFileSync(join(repoRoot, "src", "lib", "mengajar.ts"), "utf8"));
      c.expect(!/role/i.test(murni.replace(/role_assignments/g, "")), "the containment module reads a role");

      // 5. AND THE COPY DOES NOT CLAIM WHAT THE DATABASE DOES NOT DO.
      const hle = readFileSync(join(repoRoot, "src", "lib", "hle.ts"), "utf8");
      const KLAIM = [/boleh Anda lihat/i, /bisa Anda lihat/i, /you may see/i, /you can see/i, /only you/i, /hanya Anda/i];
      for (const key of ["mengajar.kelas.judul", "mengajar.kelas.sub", "mengajar.kelas.intro"]) {
        const row = new RegExp(`"${key.replace(/\./g, "\\.")}":\\s*\\{([^}]*)\\}`).exec(hle);
        c.expect(row !== null, `${key} is missing from the copy table`);
        for (const bad of KLAIM) {
          c.expect(!bad.test(row?.[1] ?? ""), `${key} claims an authorization boundary: ${bad}`);
        }
      }
      const judul = /"mengajar\.kelas\.judul":\s*\{([^}]*)\}/.exec(hle)?.[1] ?? "";
      c.expect(/lingkup mengajar/i.test(judul) && /teaching scope/i.test(judul),
        "the class heading does not name the teaching scope in both languages");

      // 6. AND IT PROTECTS NOTHING: every act is still authorized server-side.
      const rute = walk(join(repoRoot, "src", "app", "mengajar")).filter((f) => f.endsWith(".ts") || f.endsWith(".tsx"));
      const aksi = code(readFileSync(join(repoRoot, "src", "app", "mengajar", "actions.ts"), "utf8"));
      c.expect(/launch_quick_assessment/.test(aksi), "the quick assessment is not launched through its own RPC");
      c.expect(!/@\/lib\/supabase\/service/.test(rute.map((f) => readFileSync(f, "utf8")).join("\n")),
        "an educator surface holds a privileged client");

      c.note(`${aktif.length} live grant of ${hibah.length}, 2 refusals planted and caught, ${rute.length} educator file(s)`);
      return c.verdict(
        "the educator's teaching context is derived from the reader's OWN role grants, narrowed by jalur inside Postgres " +
        "and re-checked on the way out — a class from another department is REFUSED rather than quietly dropped — no role " +
        "name decides anything, and the copy names a teaching scope rather than claiming a boundary the database does not draw",
      );
    },
  },
  {
    id: "UX1-S3-KOMIT-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const dir = join(repoRoot, "src", "app", "mengajar");
      const pages = walk(dir).filter((f) => f.endsWith("page.tsx"));
      c.expect(pages.length >= 7, `only ${pages.length} educator page(s) found`);

      // THE SCANNER, used on the real pages and then on a planted one.
      const TULIS = /\.(insert|update|upsert|delete)\s*\(|rpc\(\s*"(launch_quick_assessment|extend_session_deadline|move_learning_assignment_release)"/;
      for (const f of pages) {
        const rel = relative(repoRoot, f).replace(/\\/g, "/");
        const m = TULIS.exec(code(readFileSync(f, "utf8")));
        c.expect(m === null, `${rel} writes while rendering: ${m?.[0]}`);
      }
      // ADVERSARIAL PLANT: the same scanner must catch a page that does write,
      // or it is a detector that has stopped detecting.
      c.expect(TULIS.test('const x = await db.from("learning_assignments").insert({ a: 1 });'),
        "the render-time write scanner does not catch an insert");
      c.expect(TULIS.test('await db.rpc("launch_quick_assessment", {});'),
        "the render-time write scanner does not catch the launcher");

      // Both stages before a commitment are GET renders carrying their choices
      // in the URL: the configure form navigates, it does not submit an action.
      const cepat = code(readFileSync(join(dir, "[kelas]", "uji-cepat", "page.tsx"), "utf8"));
      c.expect(/method="get"/.test(cepat), "the quick assessment's configure stage is not a GET form");
      c.expect(/tahap === "tinjau"/.test(cepat), "the review stage is not a render of the query string");

      // The only writes in the whole surface live in the server actions, and
      // each is reached by a form action rather than by a link.
      const aksiPath = join(dir, "actions.ts");
      const aksi = code(readFileSync(aksiPath, "utf8"));
      c.expect(/^"use server";/m.test(aksi), "the educator actions are not a server module");
      const exported = [...aksi.matchAll(/export async function (\w+)/g)].map((m) => m[1]);
      c.expect(exported.length === 2, `${exported.length} exported educator action(s); the surface commits two things`);
      for (const name of exported) {
        const used = pages.some((f) => new RegExp(`action=\\{${name}\\}`).test(readFileSync(f, "utf8")));
        c.expect(used, `the action ${name} is exported but no form submits it`);
      }
      for (const f of pages) {
        const src = code(readFileSync(f, "utf8"));
        for (const name of exported) {
          const asLink = new RegExp(`href=\\{[^}]*${name}`).test(src);
          c.expect(!asLink, `${relative(repoRoot, f)} reaches a commitment through a link`);
        }
      }

      // Making material available is born inert and becomes visible in a second,
      // separately authorized statement — which is what makes a review possible.
      c.expect(/\.insert\(\{[\s\S]*?\}\)/.test(aksi), "materialising an assignment does not insert a row");
      c.expect(!/status:\s*"ACTIVE"[\s\S]*?\.insert\(/.test(aksi), "an assignment is inserted already active");
      c.expect(/\.update\(\{ status: "ACTIVE" \}\)/.test(aksi), "the assignment is never activated in its own statement");

      // A redirect target is derived, never taken from the form: the learner
      // side's unvalidated `kembali` is a known finding and is not repeated here.
      c.expect(!/formData\.get\("kembali"\)/.test(aksi), "an educator action takes its redirect from the form");

      c.note(`${pages.length} page(s) swept, ${exported.length} action(s), 2 plants caught`);
      return c.verdict(
        "no page on the educator surface writes anything while rendering — the scanner is watched to catch a planted insert " +
        "and a planted launcher — both stages before a commitment are GET renders of the query string, the only two writes " +
        "are server actions reached by a form and never by a link, an assignment is created inert and activated in its own " +
        "separately authorized statement, and no redirect target comes from the form",
      );
    },
  },

  {
    id: "UX1-S3-CEPAT-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const mig = join(repoRoot, "supabase", "migrations");
      const hle = readFileSync(join(repoRoot, "src", "lib", "hle.ts"), "utf8");
      const cepat = code(readFileSync(
        join(repoRoot, "src", "app", "mengajar", "[kelas]", "uji-cepat", "page.tsx"), "utf8"));
      const lib = code(readFileSync(join(repoRoot, "src", "lib", "pengajar.ts"), "utf8"));

      // 1. THE BOUNDS ARE READ, NOT RESTATED. The platform owns 3-to-20 and the
      //    surface asks for it; a literal here is a second answer that drifts.
      c.expect(/from\("assessment_definition_bounds"\)/.test(lib), "the QUICK bounds are never read");
      c.expect(/\.eq\("mode", "QUICK"\)/.test(lib), "the bounds read is not scoped to QUICK");
      c.expect(/batas\?\.soalMin/.test(cepat) && /batas\?\.soalMax/.test(cepat),
        "the form does not take its item bounds from the bounds row");
      const bounds = readFileSync(join(mig, "20260915150000_studio_governance.sql"), "utf8");
      const quickBound = /update public\.assessment_definition_bounds\s+set ([\s\S]*?)where mode = 'QUICK';/.exec(bounds);
      c.expect(quickBound !== null, "the QUICK bounds row is not in the migrations");
      c.expect(/item_count_max = 20/.test(quickBound?.[1] ?? ""), "QUICK's item ceiling is no longer 20");
      c.expect(/attempt_limit_max = 1/.test(quickBound?.[1] ?? ""), "QUICK is no longer single-attempt");

      // The three minute presets must sit inside the launcher's own 5-60 range.
      const launcher = readFileSync(join(mig, "20260916110000_quick_assessment_over_canonical.sql"), "utf8");
      const rentang = /p_minutes < (\d+) or p_minutes > (\d+)/.exec(launcher);
      c.expect(rentang !== null, "the launcher no longer states a minute range");
      const [lo, hi] = [Number(rentang?.[1]), Number(rentang?.[2])];
      const preset = [...(/JENDELA_MENIT = \[([^\]]*)\]/.exec(lib)?.[1] ?? "").matchAll(/\d+/g)].map((m) => Number(m[0]));
      c.expect(preset.length === 3, `${preset.length} window preset(s); the approved design offers three`);
      for (const m of preset) c.expect(m >= lo && m <= hi, `the ${m}-minute preset is outside the launcher's ${lo}-${hi}`);

      // 2. THE CERTIFICATE SENTENCE IS CHECKED AGAINST THE CONTRACT, NOT AGAINST
      //    ITSELF. `mode_policy` decides whether a QUICK result can reach a
      //    certificate; the copy must agree with that row, so the row is parsed
      //    here. If a migration ever flips it, this test says the copy must move.
      const policy = readFileSync(join(mig, "20260914093000_mode_policy_quick_assessment_integrity.sql"), "utf8");
      const kolom = /create table public\.mode_policy \(([\s\S]*?)\n\);/.exec(policy)?.[1] ?? "";
      const urutan = [...kolom.matchAll(/^\s{2}(\w+)\s+/gm)].map((m) => m[1]);
      const iCert = urutan.indexOf("certifies");
      c.expect(iCert > 0, "mode_policy no longer has a certifies column");
      const barisQuick = /\n  \('QUICK',([^)]*)\)/.exec(policy)?.[1] ?? "";
      const nilai = barisQuick.split(",").map((x) => x.trim());
      const certifies = nilai[iCert - 1];
      c.expect(certifies === "true" || certifies === "false", `could not read QUICK.certifies (${certifies})`);

      const kunciCepat = [...hle.matchAll(/"(mengajar\.cepat\.[a-z0-9_.]+|mengajar\.langkah\.f5w)":\s*\{([^}]*)\}/g)];
      c.expect(kunciCepat.length >= 20, `only ${kunciCepat.length} quick-assessment copy strings found`);
      const semuaCepat = kunciCepat.map((m) => m[2]).join(" ");

      const MENYANGKAL = [
        /tidak masuk sertifikat/i, /bukan bagian dari sertifikat/i,
        /not part of a certificate/i, /not part of any certificate/i,
        /does not count toward/i, /tidak dihitung untuk sertifikat/i,
        /tidak menilai murid/i, /bukan sebagai nilai murid/i,
        /not a judgment of the learner/i, /not a learner grade/i,
        /hasilnya untuk Anda\b/i, /the result is for you\b/i,
      ];
      if (certifies === "true") {
        for (const bad of MENYANGKAL) {
          c.expect(!bad.test(semuaCepat),
            `QUICK certifies in mode_policy, but the copy still denies it: ${bad}`);
        }
        // and the canonical meaning must actually be told, in both languages
        c.expect(/bukti pembelajaran/i.test(semuaCepat), "the Indonesian copy never says the result is learning evidence");
        c.expect(/kelayakan sertifikat/i.test(semuaCepat), "the Indonesian copy never names certificate eligibility");
        c.expect(/learning evidence/i.test(semuaCepat), "the English copy never says the result is learning evidence");
        c.expect(/certificate eligibility/i.test(semuaCepat), "the English copy never names certificate eligibility");
        // without the opposite overclaim
        c.expect(/tidak menerbitkan sertifikat/i.test(semuaCepat) && /does not issue a certificate/i.test(semuaCepat),
          "the copy never says that one quick assessment does not issue a certificate");
        for (const bad of [/mendapat sertifikat/i, /earns a certificate/i, /gets a certificate/i]) {
          c.expect(!bad.test(semuaCepat), `the copy implies one quick assessment earns a certificate: ${bad}`);
        }
      }

      // 3. AND IT PROMISES NO PER-ITEM RESULT, because there is no read path.
      for (const bad of [/per soal/i, /per-item/i, /per item/i, /tiap soal/i, /item-level result/i]) {
        c.expect(!bad.test(semuaCepat), `the quick assessment promises a per-item result: ${bad}`);
      }
      c.expect(!/metric_evaluate/.test(cepat), "the quick assessment screen asks for a metric");

      c.note(`QUICK.certifies=${certifies}, bounds 3-20 single attempt, presets ${preset.join("/")} inside ${lo}-${hi}, ${kunciCepat.length} copy strings`);
      return c.verdict(
        "the quick assessment reads its item bounds from assessment_definition_bounds rather than restating them, offers " +
        "three windows inside the launcher's own range, and tells the truth about the result: mode_policy's QUICK row is " +
        "PARSED here and the copy is required to agree with it — it may not deny that the result can reach certificate " +
        "evidence while the contract says it can, may not claim one quick assessment earns a certificate, and may not " +
        "promise a per-item result an educator has no read path to",
      );
    },
  },
  {
    id: "UX1-S3-BUKTI-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const mig = join(repoRoot, "supabase", "migrations");
      const lib = code(readFileSync(join(repoRoot, "src", "lib", "pengajar.ts"), "utf8"));
      const files = walk(join(repoRoot, "src", "app", "mengajar")).filter((f) => /\.tsx?$/.test(f));
      const surface = files.map((f) => code(readFileSync(f, "utf8"))).join("\n") + "\n" + lib;

      // 1. NOTHING ITEM-LEVEL IS REACHED FOR, at any level. The educator holds
      //    neither CAN_REVIEW_INTEGRITY nor CAN_REVIEW_QUESTION_HEALTH, the
      //    service views are revoked from `authenticated` outright, and this
      //    surface must not be the place that discovers it at a refusal.
      const TERLARANG = [
        "responses", "presented_items", "assessment_results",
        "service_item_statistics", "service_distractor_uptake", "service_cohort_misconceptions",
        "question_health", "integrity_signals",
      ];
      for (const tbl of TERLARANG) {
        c.expect(!new RegExp(`from\\("${tbl}"`).test(surface), `the educator surface reads ${tbl} directly`);
      }
      for (const rpc of ["recompute_question_health", "record_question_health_review", "record_integrity_review", "terminate_session"]) {
        c.expect(!new RegExp(`"${rpc}"`).test(surface), `the educator surface calls ${rpc}`);
      }
      // ADVERSARIAL PLANT: the same scanner on a line that does read one.
      c.expect(/from\("responses"/.test('await db.from("responses").select("*")'),
        "the forbidden-table scanner does not catch a direct response read");

      // 2. EVERY METRIC ASKED FOR IS ONE THE CATALOGUE GRANTS AN EDUCATOR.
      //    The audience list is read from the SEED, not from this file, so a
      //    catalogue change that narrows an audience fails here.
      const cat = readFileSync(join(mig, "20260918100000_metric_catalogue.sql"), "utf8");
      const blok = /insert into public\.metric_definitions\n  \(catalogue_version, metric_id[\s\S]*?\n   allowed_visualizations, allowed_audiences, calculation_key\) values([\s\S]*?);\n/.exec(cat);
      c.expect(blok !== null, "the metric catalogue seed could not be read");
      const audiens = new Map<string, string>();
      for (const entry of (blok?.[1] ?? "").split(/\n  \('MC-1',/).slice(1)) {
        const id = /^\s*'([a-z._]+)'/.exec(entry)?.[1];
        if (id) audiens.set(id, entry);
      }
      c.expect(audiens.size >= 13, `only ${audiens.size} metric(s) parsed from the catalogue seed`);
      const diminta = [...(/METRIK_KELAS = \[([\s\S]*?)\] as const/.exec(lib)?.[1] ?? "").matchAll(/"([a-z._]+)"/g)].map((m) => m[1]);
      c.expect(diminta.length >= 4, `only ${diminta.length} metric(s) requested by the evidence screen`);
      for (const m of diminta) {
        const entry = audiens.get(m);
        c.expect(entry !== undefined, `the evidence screen asks for ${m}, which is not in the catalogue`);
        c.expect(/'EDUCATOR'/.test(entry ?? ""), `the evidence screen asks for ${m}, which the catalogue does not grant an educator`);
        c.expect(!m.startsWith("item."), `the evidence screen asks for the item-level metric ${m}`);
      }
      // ADVERSARIAL PLANT: an item metric must fail the same audience check.
      c.expect(!/'EDUCATOR'/.test(audiens.get("item.correctness_rate") ?? "'EDUCATOR'"),
        "the audience check would accept an item-level metric");

      // 3. AND THE ONE THAT REPLACED A PER-ITEM SENTENCE IS THE GRANTED ONE.
      c.expect(diminta.includes("class.misconceptions"),
        "the legitimate cohort aggregate is not asked for");
      const calc = readFileSync(join(mig, "20260918110000_metric_evaluator.sql"), "utf8");
      const misc = /create function public\.calc_class_misconceptions[\s\S]*?\nend;/.exec(calc)?.[0] ?? "";
      c.expect(/misconception_code/.test(misc) && !/person_id/.test(misc) && !/item_id/.test(misc),
        "the cohort aggregate carries a learner or an item after all");

      // 4. INSUFFICIENT EVIDENCE IS A FIRST-CLASS STATE, and no zero stands in
      //    for an unknown. A value renders only on `ok`, and only when finite.
      const bukti = code(readFileSync(
        join(repoRoot, "src", "app", "mengajar", "[kelas]", "bukti", "page.tsx"), "utf8"));
      c.expect(/KartuKetiadaan/.test(bukti), "the evidence screen has no absence card");
      c.expect(/e\.status !== "ok"/.test(bukti), "the evidence screen renders a value without checking the status");
      c.expect(/Number\.isFinite\(v\)/.test(bukti), "a non-finite value would render as a figure");
      c.expect(!/\|\|\s*0\b/.test(bukti) && !/\?\?\s*0\b/.test(bukti),
        "the evidence screen substitutes zero for a missing figure");
      c.expect(/actionText/.test(bukti), "a figure renders without the sentence the 3-lens rule requires");

      // 5. THE SCOPE LINE NAMES A CLASS AND NOT A CHAPTER: metric_evaluate takes
      //    a node, so a chapter-scoped claim would be a scope no contract carries.
      const hle = readFileSync(join(repoRoot, "src", "lib", "hle.ts"), "utf8");
      const eyebrow = /"mengajar\.bukti\.eyebrow":\s*\{([^}]*)\}/.exec(hle)?.[1] ?? "";
      c.expect(!/bab|chapter/i.test(eyebrow), "the evidence eyebrow names a chapter");
      // scoped to the evidence read itself: the quick assessment's launcher
      // takes a module, and a sweep over the whole module would read that as a
      // failure here — a scanner pointed at the wrong artefact is worse than none
      const bacaBukti = /export async function bukti\([\s\S]*?\n\}/.exec(lib)?.[0] ?? "";
      c.expect(bacaBukti.length > 0, "the evidence read could not be located in the educator data layer");
      c.expect(/p_node/.test(bacaBukti), "the evidence read does not pass a node");
      c.expect(!/p_module|p_release|p_bab|p_modul/.test(bacaBukti),
        "the evidence read passes a scope metric_evaluate does not take");

      c.note(`${diminta.length} metric(s) requested, all EDUCATOR-granted; ${TERLARANG.length} forbidden read(s) swept over ${files.length} file(s)`);
      return c.verdict(
        "every number on the evidence screen comes through metric_evaluate and every metric it asks for is one the CATALOGUE " +
        "SEED grants an EDUCATOR — checked against the migration, with an item-level metric watched to fail the same check — " +
        "no responses, presented items, assessment results or service statistics view is read anywhere on the surface, the " +
        "cohort aggregate that replaced a per-item sentence carries no learner and no item, absence renders as an absence " +
        "card rather than a zero, and the scope line names the node the evaluator actually takes",
      );
    },
  },

  {
    id: "UX1-S3-NAMA-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const mig = join(repoRoot, "supabase", "migrations");
      const hle = readFileSync(join(repoRoot, "src", "lib", "hle.ts"), "utf8");
      const lib = code(readFileSync(join(repoRoot, "src", "lib", "pengajar.ts"), "utf8"));
      const daftar = readFileSync(join(repoRoot, "src", "components", "mengajar", "DaftarMurid.tsx"), "utf8");
      const files = walk(join(repoRoot, "src", "app", "mengajar"))
        .concat(walk(join(repoRoot, "src", "components", "mengajar")))
        .filter((f) => /\.tsx?$/.test(f));

      // 1. THE ABSENCE OF AN HONORIFIC IS PROVEN FROM THE CONTRACT, not asserted.
      //    `persons` carries a display name and nothing that could authorise a
      //    Bu or a Pak, so inferring one could only be a guess about a person.
      const identity = readFileSync(join(mig, "20260912004321_identity_enrollment.sql"), "utf8");
      const kolom = /create table public\.persons \(([\s\S]*?)\n\);/.exec(identity)?.[1] ?? "";
      c.expect(/display_name/.test(kolom), "the persons table no longer carries a display name");
      for (const bad of ["honorific", "salutation", "title", "prefix", "gender", "sex", "gelar", "sapaan"]) {
        c.expect(!new RegExp(`\\b${bad}\\b`, "i").test(kolom),
          `persons now carries ${bad} — the greeting may stop being name-only, but only deliberately`);
      }
      const semuaMig = readdirSync(mig).map((f) => readFileSync(join(mig, f), "utf8")).join("\n");
      c.expect(!/alter table public\.persons\s+add column\s+(honorific|salutation|gelar)/i.test(semuaMig),
        "a migration added an honorific column");

      // 2. AND NO SURFACE INVENTS ONE. Neither in the copy nor in the code that
      //    composes the greeting.
      const s3 = [...hle.matchAll(/"(mengajar\.[a-z0-9_.]+)":\s*\{([^}]*)\}/g)];
      c.expect(s3.length >= 130, `only ${s3.length} educator copy strings found`);
      const semuaKata = s3.map((m) => m[2]).join(" ");
      for (const bad of [/\bBu\s+[A-Z]/, /\bPak\s+[A-Z]/, /\bIbu\s+[A-Z]/, /\bBapak\s+[A-Z]/, /\bMrs?\.\s/, /\bMs\.\s/]) {
        c.expect(!bad.test(semuaKata), `the educator copy carries an honorific: ${bad}`);
      }
      const beranda = code(readFileSync(join(repoRoot, "src", "app", "mengajar", "page.tsx"), "utf8"));
      c.expect(/aku\.nama/.test(beranda), "the greeting does not use the stored name");
      // EVERY literal, not just a double-quoted one. The first version of this
      // check looked for `"Bu ` and a template literal walked straight past it —
      // found by mutating the greeting rather than by reading the check again,
      // which is the only way that class of hole is ever found.
      const LITERAL = /"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`/g;
      // An honorific is only an honorific when it PREFIXES SOMEBODY: the title
      // immediately before an interpolated value or a capitalised word. Cased,
      // so the `pin-ms` class name is a class name and not a Ms.
      const SAPAAN = /\b(Bu|Pak|Ibu|Bapak|Mr|Mrs|Ms|Sir|Madam)\b\s*(\$\{|[A-Z])/;
      for (const f of files) {
        const rel = relative(repoRoot, f).replace(/\\/g, "/");
        for (const lit of code(readFileSync(f, "utf8")).match(LITERAL) ?? []) {
          const m = SAPAAN.exec(lit);
          c.expect(m === null, `${rel} composes the honorific "${m?.[1]}" in front of a name: ${lit.slice(0, 40)}`);
          // and a title standing alone in its own literal, which renders in
          // front of whatever the next expression puts beside it
          const sendiri = lit.slice(1, -1).trim();
          c.expect(!/^(Bu|Pak|Ibu|Bapak|Mr\.?|Mrs\.?|Ms\.?|Sir|Madam)$/.test(sendiri),
            `${rel} carries the bare honorific ${lit} for something to be placed after`);
        }
      }

      // 3. NAMES ARE BOUNDED BY THE DATABASE, not by this application. The
      //    roster rides memberships → enrollments → persons, whose educator
      //    branch is subtree containment; nothing filters a school-wide
      //    population of people down to a class in the browser.
      c.expect(/from\("memberships"\)/.test(lib), "the roster is not read from memberships");
      c.expect(/persons\(id, display_name\)/.test(lib), "the roster does not read persons through the membership");
      c.expect(/\.eq\("node_id", nodeId\)/.test(lib), "the roster read is not narrowed to the class");
      c.expect(!/from\("persons"\)[\s\S]{0,200}\.in\(/.test(lib), "names are read in bulk and filtered afterwards");
      const auth = readFileSync(join(mig, "20260912004431_authorization.sql"), "utf8");
      c.expect(/create policy persons_select on public\.persons for select to authenticated\s+using \(public\.person_visible_to_me\(id\)\)/.test(auth),
        "persons_select no longer goes through person_visible_to_me");
      // THE BRANCH IS READ FROM WHICHEVER MIGRATION LAST DEFINES IT, not from
      // the one that first did. This asserted `has_scope('EDUCATOR', m.node_id)`
      // against 0002 alone, and migrations are append-only -- so when WP1
      // replaced that branch with the capability form, this check went on
      // matching a file that no longer describes the live schema. A test that
      // keeps passing about a superseded definition is worse than one that
      // fails: it reports on something nobody is running.
      //
      // WHAT IS ASSERTED IS THE PROPERTY, not the spelling: the educator branch
      // must be SUBTREE-BOUND -- narrowed by a node, through one of the two
      // primitives that carry `jalur` containment -- rather than by tenant
      // membership. A bare `is_member_of_institution` would not qualify, and
      // neither would no predicate at all.
      const visibilityDefs = readdirSync(mig)
        .filter((f) => f.endsWith(".sql"))
        .sort()
        .filter((f) => /create (?:or replace )?function public\.person_visible_to_me\(/
          .test(readFileSync(join(mig, f), "utf8")));
      c.expect(visibilityDefs.length > 0, "no migration defines person_visible_to_me");
      const latestVisibility = readFileSync(
        join(mig, visibilityDefs[visibilityDefs.length - 1]), "utf8");
      const branch = /from public\.memberships m join public\.enrollments e[\s\S]{0,400}?;/
        .exec(latestVisibility)?.[0] ?? "";
      c.expect(branch.length > 0, "person_visible_to_me's membership branch could not be located");
      c.expect(/(can_on_node\('CAN_VIEW_LEARNER_ROSTER', m\.node_id\)|has_scope\('EDUCATOR', m\.node_id\))/.test(branch),
        "person_visible_to_me's educator branch is no longer subtree-bound: it narrows by neither " +
          "can_on_node nor has_scope on the membership node");

      // 4. OBSERVATION IS NOT JUDGMENT. The roster component has room for a name
      //    and for nothing else: no pill, no colour, no count, no order but the
      //    alphabet. This is checked on the COMPONENT, so a screen cannot add one
      //    without the component growing a slot for it.
      const isi = code(daftar);
      for (const bad of ["pin-pill", "pin-num", "pin-status", "status", "warna", "color", "badge"]) {
        c.expect(!new RegExp(bad).test(isi), `the roster component carries ${bad}`);
      }
      c.expect(/\{m\.nama\}/.test(isi), "the roster renders something other than the name");
      c.expect(/localeCompare/.test(lib), "the roster is not alphabetical");
      c.expect(!/sort\([^)]*(mengumpulkan|sudah|belum|mastery|skor)/.test(lib),
        "the roster is ordered by something about the learners");

      // 5. AND NO WORD ON THE SURFACE JUDGES ANYBODY.
      const HAKIM = [
        /tertinggal/i, /bermasalah/i, /malas/i, /lemah/i, /bodoh/i, /gagal/i,
        /\bfailing\b/i, /\bat risk\b/i, /\bbehind\b/i, /\bstruggl/i, /\bweak\b/i,
        /\blazy\b/i, /\bproblem\b/i, /peringkat [0-9]/i,
      ];
      for (const bad of HAKIM) {
        c.expect(!bad.test(semuaKata), `the educator copy judges a learner: ${bad}`);
      }
      // the neutral framing must be present, not merely the harsh one absent
      const siapa = /"mengajar\.siapa\.catatan":\s*\{([^}]*)\}/.exec(hle)?.[1] ?? "";
      c.expect(/bukan peringkat/i.test(siapa) && /not a ranking/i.test(siapa),
        "the names page does not say it is not a ranking, in both languages");
      const hitung = /"mengajar\.cepat\.hidup\.catatan":\s*\{([^}]*)\}/.exec(hle)?.[1] ?? "";
      c.expect(/hitungan, bukan penilaian/i.test(hitung) && /counts, not judgments/i.test(hitung),
        "the live counts are not declared to be counts rather than judgments");

      c.note(`${s3.length} educator copy strings, ${HAKIM.length} judgment patterns swept, persons has ${kolom.split("\n").length - 1} column(s)`);
      return c.verdict(
        "no honorific is inferred, and the absence of any source for one is read from the persons table in the migrations " +
        "rather than asserted; learner names reach the surface only through memberships and person_visible_to_me, whose " +
        "educator branch is subtree-bound, and are never fetched in bulk and narrowed afterwards; the roster component has " +
        "no slot for a status, a colour, a number or any order but the alphabet; and the copy neither judges a learner nor " +
        "omits the sentences that say a count is not a judgment",
      );
    },
  },
  {
    id: "UX1-S3-KATA-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const hle = readFileSync(join(repoRoot, "src", "lib", "hle.ts"), "utf8");
      const files = walk(join(repoRoot, "src", "app", "mengajar"))
        .concat(walk(join(repoRoot, "src", "components", "mengajar")))
        .filter((f) => /\.tsx?$/.test(f));

      // 1. EVERY KEY A SCREEN RENDERS IS DECLARED. A missing key renders as
      //    ⟨key⟩ to a teacher, which is the failure this catches at build time.
      const dipakai = new Set<string>();
      for (const f of files) {
        const src = readFileSync(f, "utf8");
        for (const m of src.matchAll(/s\("(mengajar\.[a-zA-Z0-9_.]+)"\)/g)) dipakai.add(m[1]);
        for (const m of src.matchAll(/"(mengajar\.[a-zA-Z0-9_.]+)"/g)) dipakai.add(m[1]);
      }
      c.expect(dipakai.size >= 60, `only ${dipakai.size} educator copy key(s) rendered by the surface`);
      const dinamis = /mengajar\.instrumen\.\$\{/.test(files.map((f) => readFileSync(f, "utf8")).join("\n"));
      for (const k of dipakai) {
        if (k.includes("${")) continue;
        c.expect(hle.includes(`"${k}"`), `the educator surface renders an undeclared copy key: ${k}`);
      }
      // the one key built from a value must have a telling for every value it
      // can take, which is the whole set of non-QUICK assessment modes
      if (dinamis) {
        for (const mode of ["PRE_TEST", "POST_TEST", "STANDALONE"]) {
          c.expect(hle.includes(`"mengajar.instrumen.${mode}"`),
            `the instrument list can render ${mode} and has no telling for it`);
        }
      }

      // 2. BOTH LANGUAGES, AND NEITHER EMPTY. (UX1-S0-HLE-01 proves this over
      //    the whole table; this proves the Slice-3 block is inside that sweep
      //    and that no telling is a placeholder.)
      const s3 = [...hle.matchAll(/"(mengajar\.[a-z0-9_.]+)":\s*\{\s*default:\s*"([^"]*)",\s*en:\s*"([^"]*)"\s*\}/g)];
      c.expect(s3.length >= 130, `only ${s3.length} educator key(s) carry both languages in the expected shape`);
      for (const [, key, id, en] of s3) {
        c.expect(id.trim().length > 0, `${key} has an empty Indonesian telling`);
        c.expect(en.trim().length > 0, `${key} has an empty English telling`);
        c.expect(id !== en || /^[A-Z][a-z]*$/.test(id) || id.length < 12,
          `${key} has the same long string in both languages — one of them was not written`);
      }

      // 3. ANDA, NEVER KAMU. One pass over words, a standalone list plus the
      //    -mu clitic, with the words that merely end in those letters declared.
      const STANDALONE = new Set(["kamu", "engkau", "kau", "dikau", "mu"]);
      const NOT_A_CLITIC = new Set([
        "ilmu", "kamu", "waktu", "tentu", "temu", "satu", "ibu", "itu", "tamu", "suku",
        "perlu", "tahu", "tumbuh", "lampu", "bantu", "mampu", "semu", "palu", "bau",
      ]);
      let anda = 0;
      for (const [, key, id] of s3) {
        for (const raw of id.split(/[^A-Za-zÀ-ÿ-]+/)) {
          const w = raw.toLowerCase();
          if (!w) continue;
          if (w === "anda") anda += 1;
          c.expect(!STANDALONE.has(w), `${key} addresses the reader as "${raw}"`);
          if (w.endsWith("mu") && w.length > 2 && !NOT_A_CLITIC.has(w)) {
            c.expect(false, `${key} uses the informal clitic in "${raw}"`);
          }
        }
      }
      c.expect(anda > 0, "the educator copy never addresses the reader as Anda");
      // ADVERSARIAL PLANT: the same sweep must catch a planted informal address.
      const planted = "Selamat pagi, ini kelasmu hari ini";
      let caught = false;
      for (const raw of planted.split(/[^A-Za-zÀ-ÿ-]+/)) {
        const w = raw.toLowerCase();
        if (STANDALONE.has(w) || (w.endsWith("mu") && w.length > 2 && !NOT_A_CLITIC.has(w))) caught = true;
      }
      c.expect(caught, "the informal-address sweep does not catch a planted clitic");

      // 4. NO INTERNAL VOCABULARY. Enum labels, table names and column names are
      //    what a teacher must never meet; this is narrower than the platform
      //    word list and aimed at what THIS surface touches.
      const DALAM = [
        /\bplp_/i, /\brole_assignments\b/i, /\bscope_node_id\b/i, /\bjalur\b/i,
        /\borg_nodes\b/i, /\blearning_assignments\b/i, /\bassessment_assignments\b/i,
        /\bmetric_evaluate\b/i, /\bbelow_minimum\b/i, /\bnot_permitted\b/i,
        /\bCAN_[A-Z_]+/, /\bis_ad_hoc\b/i, /\bDRAFT\b/, /\bACTIVE\b/, /\bWITHDRAWN\b/,
        /\bSUBMITTED\b/, /\bFINALIZED\b/, /\bPOST_TEST\b/, /\bPRE_TEST\b/, /\bQUICK\b/,
      ];
      for (const [, key, id, en] of s3) {
        for (const bad of DALAM) {
          c.expect(!bad.test(id), `${key} names an internal concept in Indonesian: ${bad}`);
          c.expect(!bad.test(en), `${key} names an internal concept in English: ${bad}`);
        }
      }

      c.note(`${dipakai.size} key(s) rendered, ${s3.length} declared in both languages, ${anda} Anda, 0 informal`);
      return c.verdict(
        "every copy key the educator surface renders is declared, every declared key carries a real telling in both " +
        "languages, the mode-derived key has a telling for each mode it can take, the reader is addressed as Anda and " +
        "never informally — with a planted clitic watched to be caught — and no telling in either language names a table, " +
        "a column, a capability or a lifecycle enum",
      );
    },
  },
  {
    id: "UX1-S3-FAKTA-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const css = readFileSync(join(repoRoot, "src", "app", "experience.css"), "utf8");

      // 1. THE PHONE BLOCK THAT NARROWS SLICE 3 COMES AFTER THE RULES IT
      //    OVERRIDES. At equal specificity the later rule wins, and a stack
      //    declared before the thing it overrides is a stack that never happens
      //    — the defect UX1-S0-FAKTA-01 was rewritten to catch.
      const NARROW = [
        { sel: ".pin-roster", base: /\.pin-roster \{[^}]*grid-template-columns:\s*repeat\(2/ },
        // the track may be written `1fr` or `minmax(0, 1fr)` — UX1-S0-MUAT-01
        // requires the second wherever the auto track holds something that
        // cannot wrap, and this anchor must not care which spelling it finds
        { sel: ".pin-act", base: /\.pin-act \{[^}]*grid-template-columns:\s*(?:minmax\(0, )?1fr\)? auto/ },
        { sel: ".pin-terima li", base: /\.pin-terima li \{[^}]*grid-template-columns:\s*auto 1fr auto/ },
        { sel: ".pin-switch", base: /\.pin-switch \{[^}]*display:\s*inline-flex/ },
        { sel: ".pin-seg", base: /\.pin-seg \{[^}]*display:\s*inline-flex/ },
      ];
      for (const { sel, base } of NARROW) {
        const m = base.exec(css);
        c.expect(m !== null, `${sel} has no wide rule to narrow`);
        if (!m) continue;
        const wide = m.index;
        const narrowIdx = css.indexOf(`  ${sel} {`, wide);
        c.expect(narrowIdx > wide, `${sel} is never narrowed after its wide rule`);
        // and it must be inside a phone media block
        const before = css.slice(0, narrowIdx);
        const lastMedia = before.lastIndexOf("@media (max-width: 560px)");
        const lastClose = before.lastIndexOf("\n}\n");
        c.expect(lastMedia > lastClose, `${sel}'s narrow rule is not inside the phone block`);
      }

      // 2. THE NEW COMPACT FACT SUMMARIES REUSE `.pin-facts`, so they inherit
      //    the approved stack instead of restating it. Nothing on the educator
      //    surface declares its own fact grid.
      const files = walk(join(repoRoot, "src", "app", "mengajar")).filter((f) => f.endsWith(".tsx"));
      let facts = 0;
      for (const f of files) {
        const src = readFileSync(f, "utf8");
        facts += [...src.matchAll(/className="pin-facts"/g)].length;
      }
      c.expect(facts >= 3, `only ${facts} compact fact summar(ies) on the educator surface`);
      c.expect(!/\.pin-(isian|hidup|paket|acts)[^{]*\{[^}]*\.pin-facts/.test(css),
        "an educator container redefines the fact grid");
      // nothing added AFTER the Slice-3 phone block may re-widen a fact summary
      const s3Media = css.lastIndexOf("@media (max-width: 560px)");
      c.expect(!/\.pin-facts[^{]*\{[^}]*grid-template-columns/.test(css.slice(s3Media + 1)),
        "a fact-summary grid is declared after the last phone block and would outrank the stack");

      // 3. THE LIVE PANEL CARRIES TWO FACTS, NOT THREE. The third — per-item
      //    results — was removed because no contract grants an educator one, and
      //    a row that comes back silently is how a removed promise returns.
      // comments stripped: this file EXPLAINS why the third fact is absent, and
      // a scanner that read the explanation as the promise would fail on the
      // very note that records the decision
      const cepat = code(readFileSync(
        join(repoRoot, "src", "app", "mengajar", "[kelas]", "uji-cepat", "page.tsx"), "utf8"));
      const panel = /<dl className="pin-facts">([\s\S]*?)<\/dl>/.exec(cepat)?.[1] ?? "";
      const baris = [...panel.matchAll(/<dt>/g)].length;
      c.expect(baris === 2, `the live panel carries ${baris} fact(s); it carries the two it can prove`);
      c.expect(!/hasil per soal|per-item|per soal/i.test(cepat), "the live panel promises a per-item result again");

      c.note(`${NARROW.length} composition(s) narrowed in order, ${facts} fact summar(ies) reusing the shared grid, ${baris} live fact(s)`);
      return c.verdict(
        "every Slice-3 composition that cannot hold its shape on a phone is narrowed by a rule written AFTER the wide one " +
        "and inside the phone block, so the cascade cannot silently undo it; the educator's compact fact summaries reuse " +
        "`.pin-facts` and inherit the approved stack rather than restating it, and nothing after the last phone block " +
        "re-widens one; and the quick assessment's live panel still carries two facts rather than the three the reviewed " +
        "concept drew, because the third had no contract behind it",
      );
    },
  },

  {
    id: "UX1-S0-MUAT-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();

      /**
       * DOES THE BOX FIT, AND IS ANYTHING CLIPPED.
       *
       * Promoted from a one-off Playwright measurement that found a real defect:
       * four of thirty-two rendered educator pages overflowed at 390px, the
       * worst by 279px, with the document scrolling to 637px inside a 390px
       * viewport. The cause was NOT what it first looked like. The first
       * diagnosis said this stylesheet has no `box-sizing` reset and every
       * padded full-width box was therefore too wide -- and that was an
       * ARTEFACT OF THE MEASURING HARNESS, which had stripped
       * `@import "tailwindcss"` from globals.css and with it Tailwind's
       * preflight. The product has had a global border-box all along. Reverting
       * each candidate fix one at a time against the COMPILED stylesheet showed
       * a single one doing all the work, and this guard is built on that one.
       *
       * WHY IT READS THE STYLESHEET AND NOT A BROWSER. A rendered measurement
       * only covers what some fixture happens to render, and the fixtures do
       * not reach every surface: measured over 44 rendered pages, `.pin-op`,
       * `.pin-num-btn`, `.pin-drow`, `.pin-nrow`, `.pin-tugas` and the trail
       * dot matched ZERO elements. Deriving the population from the cascade
       * instead means a rule added tomorrow is in the population the day it is
       * written. It also runs under `npm ci` in CI, where Playwright is not a
       * dependency and no browser is installed. The rendered measurement
       * remains the companion evidence, and it is what validated this guard.
       *
       * The defect it found on its first strict run was on the LEARNER's home
       * (`src/app/belajar/page.tsx`), which no fixture renders at all.
       */
      const css = readFileSync(join(repoRoot, "src", "app", "experience.css"), "utf8");

      type Rule = { sel: string; decls: Record<string, string>; media: string | null; i: number };
      function parseCss(source: string): Rule[] {
        const clean = source.replace(/\/\*[\s\S]*?\*\//g, " ");
        const out: Rule[] = [];
        let n = 0, media: string | null = null, depth = 0;
        const re = /([^{}]+)\{|\}/g;
        let m: RegExpExecArray | null;
        while ((m = re.exec(clean))) {
          if (m[0] === "}") { depth--; if (depth === 0) media = null; continue; }
          const head = m[1].trim();
          if (head.startsWith("@")) { media = head; depth++; continue; }
          const close = clean.indexOf("}", re.lastIndex);
          const decls: Record<string, string> = {};
          for (const d of clean.slice(re.lastIndex, close).split(";")) {
            const k = d.indexOf(":");
            if (k < 0) continue;
            decls[d.slice(0, k).trim()] = d.slice(k + 1).trim();
          }
          for (const s of head.split(",")) out.push({ sel: s.trim(), decls, media, i: n++ });
          re.lastIndex = close + 1;
        }
        return out;
      }
      const rules = parseCss(css).filter((r) => r.media !== "@media print");
      c.expect(rules.length > 200, `only ${rules.length} rule(s) parsed from the stylesheet`);

      const classesOf = (compound: string) =>
        new Set((compound.match(/\.[a-zA-Z0-9_-]+/g) ?? []).map((x) => x.slice(1)));
      const lastCompound = (sel: string) => sel.trim().split(/\s*[>+~]\s*|\s+/).pop() ?? sel;
      const spec = (s: string) =>
        (s.match(/[.:[]/g)?.length ?? 0) * 100 + (s.match(/(^|[\s>+~])[a-z]/gi)?.length ?? 0);
      const subset = (a: Set<string>, b: Set<string>) => a.size > 0 && [...a].every((x) => b.has(x));

      const VIEWPORTS = [["wide", null], ["phone", "@media (max-width: 560px)"]] as const;

      // ── I0. The assumption everything below rests on. Tailwind's preflight
      //    supplies `box-sizing: border-box` globally; without it every box in
      //    this sheet that carries padding and a width is suddenly too wide,
      //    all at once. It is asserted against the BUILT stylesheet, because
      //    that is where the import actually resolves.
      c.expect(/@import\s+"tailwindcss"/.test(readFileSync(join(repoRoot, "src", "app", "globals.css"), "utf8")),
        "globals.css no longer imports tailwindcss, so the global border-box reset is gone");
      const chunks = join(repoRoot, ".next", "static", "chunks");
      let built = "";
      if (existsSync(chunks)) {
        built = readdirSync(chunks).filter((f) => f.endsWith(".css"))
          .map((f) => readFileSync(join(chunks, f), "utf8")).join("\n");
      }
      c.expect(built.length > 0, "no compiled stylesheet in .next/static/chunks; the build must run first");
      c.expect(/box-sizing:\s*border-box/.test(built),
        "the compiled stylesheet carries no global border-box reset");

      // ── I1. A box a rule stretches to its container's width must be allowed
      //    to fold its text. `.pin-btn` carries `white-space: nowrap`, which is
      //    right while the button is as wide as its words and wrong the moment
      //    a rule makes it as wide as a phone: the label refuses to fold, the
      //    flex column grows to fit it, and the page scrolls sideways.
      //
      //    A rule counts toward an element only when its selector is a SUFFIX
      //    of that element's own, at compound boundaries. Merging every
      //    `.pin-btn` rule into every `.pin-btn` element -- the first version of
      //    this check -- let the fix on `.pin-actions .pin-btn` mask the
      //    identical defect on `.pin-tugas .pin-tfoot .pin-btn`, and the guard
      //    reported green over a real one.
      const stretched = [...new Set(rules.filter((r) => r.decls["width"] === "100%").map((r) => r.sel))];
      c.expect(stretched.length >= 8, `only ${stretched.length} stretched selector(s) found`);
      let merged = 0;
      for (const [vp, mq] of VIEWPORTS) {
        for (const sel of stretched) {
          const chain = sel.trim().split(/\s+/);
          const applying = rules
            .filter((r) => {
              if (!(r.media === null || r.media === mq)) return false;
              const rc = r.sel.trim().split(/\s+/);
              if (rc.length > chain.length) return false;
              const tail = chain.slice(chain.length - rc.length);
              return rc.every((cc, i) => subset(classesOf(cc), classesOf(tail[i])));
            })
            .sort((a, b) => spec(a.sel) - spec(b.sel) || a.i - b.i);
          if (applying.length === 0) continue;
          merged++;
          const d: Record<string, string> = {};
          for (const r of applying) Object.assign(d, r.decls);
          c.expect(
            !(d["width"] === "100%" && d["white-space"] === "nowrap"),
            `${vp}: ${sel} is stretched to its container's width and still refuses to wrap`,
          );
        }
      }

      // ── I2. A grid whose `auto` track holds something that will not wrap must
      //    let the other track shrink. A bare `1fr` takes its content as its
      //    minimum, so a title with no break opportunity pushes the status pill
      //    or the arrow beside it out through the card's border -- and the list
      //    around it has `overflow: hidden`, so what the reader loses is the
      //    status, silently.
      // The nowrap is usually declared on the CHILD'S OWN class (`.pin-pill`),
      // while the containment shows up in a separate placement rule
      // (`.pin-row > .pin-pill { grid-column: 2 }`). So the question is not
      // "does a nowrap selector start with this grid's selector" -- the first
      // version asked exactly that and walked past `.pin-row`, because of the
      // child combinator and because `.pin-pill` names no ancestor at all.
      // It is: does this grid place a child whose own class refuses to wrap.
      const flat = (s: string) => s.trim().replace(/\s*[>+~]\s*/g, " ").replace(/\s+/g, " ");
      const nowrapClasses = new Set<string>();
      for (const r of rules) {
        if (r.decls["white-space"] !== "nowrap") continue;
        for (const cls of classesOf(lastCompound(r.sel))) nowrapClasses.add(cls);
      }
      let grids = 0;
      for (const [vp, mq] of VIEWPORTS) {
        for (const r of rules) {
          if (!(r.media === null || r.media === mq)) continue;
          const g = r.decls["grid-template-columns"];
          if (!g) continue;
          const tracks = g
            .replace(/minmax\([^)]*\)/g, "M")
            .replace(/repeat\(\s*\d+\s*,\s*([^)]*)\)/g, "$1 $1")
            .split(/\s+/).filter(Boolean);
          if (!tracks.includes("1fr") || tracks.every((x) => x === "1fr")) continue;
          const prefix = `${flat(r.sel)} `;
          const kids = rules
            .filter((k) => flat(k.sel).startsWith(prefix))
            .filter((k) => [...classesOf(lastCompound(k.sel))].some((cls) => nowrapClasses.has(cls)))
            .map((k) => k.sel);
          if (kids.length === 0) continue;
          grids++;
          c.expect(false, `${vp}: ${r.sel} lays out "${g}" while ${kids[0]} inside it refuses to wrap; the 1fr cannot shrink`);
        }
      }
      c.expect(grids === 0, "");

      c.note(`${rules.length} rules, ${stretched.length} stretched selector(s), ${merged} element/viewport merge(s)`);
      c.note("validated against 32 educator + 56 Slice-1/2 rendered measurements at 390px and 1280px, all zero-overflow");
      return c.verdict(
        "nothing in the Experience stylesheet is stretched to its container's width while refusing to fold its text, and no " +
        "grid puts a bare 1fr beside a track holding something that cannot wrap -- the two shapes that actually produced " +
        "measured horizontal overflow, one of them on a learner surface no rendered fixture reaches. The global border-box " +
        "reset every padded box depends on is asserted against the COMPILED stylesheet rather than assumed, because an " +
        "earlier harness lost it and produced a convincing 48px defect that the product never had",
      );
    },
  },

  // ═══════════════════════════════════════════════════════ UX-1 · THE TOUR
  {
    id: "UX1-TUR-LIHAT-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const files = [
        ...walk(join(repoRoot, "src", "components", "tur")),
        join(repoRoot, "src", "app", "tur", "actions.ts"),
        join(repoRoot, "src", "lib", "tur.ts"),
        join(repoRoot, "src", "lib", "tur-negara.ts"),
      ].filter((f) => /\.tsx?$/.test(f));
      c.expect(files.length >= 8, `only ${files.length} tour file(s) found; the surface is bigger than that`);

      // 1. THE TOUR ONLY LOOKS. Nothing navigates, nothing submits, and nothing
      //    on it is a piece of real product wired up. A step whose subject lives
      //    inside an assignment draws a miniature instead of going there,
      //    because mounting a real lesson records reading progress and opening
      //    a real assessment spends an attempt.
      const PERGI = /from "next\/link"|<Link\b|<a\s|href=|<form\b|router\.push\(|router\.replace\(|window\.location/;
      for (const f of files) {
        const rel = relative(repoRoot, f).replace(/\\/g, "/");
        // The Help control is the one exception and it is declared: from a page
        // that is not the landing it must travel back to one, because replay
        // runs on the landing (§F). It still navigates nowhere else.
        if (rel.endsWith("TombolBantuan.tsx")) continue;
        const m = PERGI.exec(code(readFileSync(f, "utf8")));
        c.expect(m === null, `${rel} navigates or submits from inside the tour: ${m?.[0]}`);
      }
      c.expect(PERGI.test('<Link href="/belajar/x">go</Link>'), "the navigation scanner does not catch a link");
      c.expect(PERGI.test("router.push(`/mengajar/${id}`);"), "the navigation scanner does not catch a push");

      const tombol = code(readFileSync(join(repoRoot, "src", "components", "tur", "TombolBantuan.tsx"), "utf8"));
      const tujuan = [...tombol.matchAll(/router\.push\(([^)]*)\)/g)].map((m) => m[1]);
      c.expect(tujuan.length === 1, `the Help control navigates to ${tujuan.length} places; it returns to one landing`);
      c.expect(/\$\{beranda\}/.test(tujuan[0] ?? ""), "the Help control's destination is not the experience's own landing");

      // 2. NOTHING OF THE PRODUCT IS TOUCHED. No engine call, no lesson, no
      //    session, no launcher, no certificate — a tour that changed the thing
      //    it is describing would not be a map of it.
      const PRODUK = /record_lesson_progress|start_session|launch_quick_assessment|assessment_orientation|submit_answer|my_certificate|assessment-engine/;
      for (const f of files) {
        const rel = relative(repoRoot, f).replace(/\\/g, "/");
        const m = PRODUK.exec(code(readFileSync(f, "utf8")));
        c.expect(m === null, `${rel} reaches into the product it is describing: ${m?.[0]}`);
      }
      c.expect(PRODUK.test('await db.rpc("record_lesson_progress", {});'),
        "the product scanner does not catch a lesson-progress write");

      // 3. THE THREE VERBS, AND WHERE EACH ONE MAY BE CALLED FROM.
      const aksi = code(readFileSync(join(repoRoot, "src", "app", "tur", "actions.ts"), "utf8"));
      c.expect(/^"use server";/m.test(aksi), "the tour actions are not a server module");
      const verbs = [...aksi.matchAll(/export async function (\w+)/g)].map((m) => m[1]);
      c.expect(verbs.length === 3, `${verbs.length} exported tour action(s); the contract declares three verbs`);
      // Every one validates its key: a POST endpoint a signed-in person can
      // call must not hand an arbitrary string to the database.
      for (const v of verbs) {
        const body = new RegExp(`export async function ${v}\\([\\s\\S]*?\\n\\}`).exec(aksi)?.[0] ?? "";
        c.expect(/kunciSah\(/.test(body), `the tour action ${v} does not check the key it was given`);
      }
      c.expect(!/revalidatePath|redirect\(/.test(aksi),
        "a tour action re-renders or navigates; presentation state changes nothing the page shows");

      // 4. REPLAY SPENDS NOTHING. Being helped on purpose must not push somebody
      //    toward the cap, un-finish a finished tour, or undo a decision not to
      //    be interrupted.
      const turSrc = code(readFileSync(join(repoRoot, "src", "components", "tur", "Tur.tsx"), "utf8"));
      const replay = /function mulaiLagi\([\s\S]*?\n  \}/.exec(turSrc)?.[0] ?? "";
      c.expect(replay.length > 0, "the replay path cannot be found in the tour component");
      const SPEND = /catatTampilTur|selesaikanTurAksi|bungkamTurAksi/;
      c.expect(!SPEND.test(replay), "replay from Help calls one of the presentation verbs");
      // ADVERSARIAL PLANT: the same reading of the same function must catch a
      // replay that does spend a presentation.
      const ditanam = replay.replace("setBantuan(false);", "setBantuan(false); void catatTampilTur(kunci);");
      c.expect(SPEND.test(ditanam), "the replay scanner does not catch a planted presentation write");

      // 5. AN ARRIVAL THAT WAS HELD BACK IS NOT SPENT. The presentation write
      //    is guarded by the same condition that opens the card, and by a ref
      //    so a refresh or a language switch cannot spend a second one.
      c.expect(/const otomatisSekarang = tersedia && otomatis && !bantuanAwal;/.test(turSrc),
        "the automatic-presentation condition is not the one that opens the card");
      c.expect(/if \(!otomatisSekarang \|\| sudahDicatat\.current\) return;/.test(turSrc),
        "the presentation write is not guarded against being made twice");
      const kali = [...turSrc.matchAll(/catatTampilTur\(/g)].length;
      c.expect(kali === 1, `catatTampilTur is called from ${kali} places in the tour; exactly one arrival spends one`);

      c.note(`${files.length} tour file(s) swept, ${verbs.length} verb(s), 4 plants caught`);
      return c.verdict(
        "the tour only looks: no file in it navigates, submits or reaches a product RPC — the scanners are watched to " +
        "catch a planted link, a planted push and a planted lesson-progress write — the only writes are the three " +
        "declared presentation verbs, each validating the key it was handed and neither revalidating nor redirecting, " +
        "replay from Help calls none of them with a planted spend watched to be caught, and the one automatic " +
        "presentation is written from exactly one place under the same condition that opens the card",
      );
    },
  },

  {
    id: "UX1-TUR-ORANG-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const turFiles = [
        ...walk(join(repoRoot, "src", "components", "tur")),
        join(repoRoot, "src", "app", "tur", "actions.ts"),
        join(repoRoot, "src", "lib", "tur.ts"),
        join(repoRoot, "src", "lib", "tur-negara.ts"),
      ].filter((f) => /\.tsx?$/.test(f));

      // 1. THE MEMORY IS THE PERSON'S, NOT THE DEVICE'S. A shared classroom
      //    tablet is the case that decides this: the next child to sign in is a
      //    different person and must get their own first tour, so no part of
      //    the durable answer may live in storage that belongs to the machine.
      const PERANGKAT = /localStorage|sessionStorage|document\.cookie|indexedDB|window\.name/;
      for (const f of turFiles) {
        const rel = relative(repoRoot, f).replace(/\\/g, "/");
        const m = PERANGKAT.exec(code(readFileSync(f, "utf8")));
        c.expect(m === null, `${rel} keeps tour state on the device: ${m?.[0]}`);
      }
      c.expect(PERANGKAT.test('window.localStorage.setItem("tour", "1");'),
        "the device-storage scanner does not catch a localStorage write");
      c.expect(PERANGKAT.test('document.cookie = "tour=1";'),
        "the device-storage scanner does not catch a cookie write");

      // 2. THE PERSON IS THE SESSION. None of the four RPCs takes an identity,
      //    so there is no parameter for a caller to pass somebody else through.
      const negara = code(readFileSync(join(repoRoot, "src", "lib", "tur-negara.ts"), "utf8"));
      const panggil = [...negara.matchAll(/\.rpc\(\s*"([a-z_]+)"\s*(?:,\s*\{([^}]*)\})?/g)];
      const nama = panggil.map((m) => m[1]);
      const DIHARAP = ["my_tour_state", "note_tour_presented", "complete_tour", "suppress_tour"];
      for (const n of DIHARAP) c.expect(nama.includes(n), `the state layer never calls ${n}`);
      for (const m of panggil) {
        if (m[1] === "current_person_id") continue; // the seniority read, below
        c.expect(!/person|user|actor|subject|siapa/i.test(m[2] ?? ""),
          `${m[1]} is called with an identity argument: ${m[2]}`);
      }
      // `current_tour_version` is internal to the database — revoked from
      // `authenticated` — and the version comes back inside the state row, so a
      // surface that resolved it separately could disagree with the row it is
      // about to write.
      c.expect(!nama.includes("current_tour_version"),
        "the state layer calls current_tour_version, which is not a client RPC");

      // 3. THE CONTRACT IS THE MIGRATION'S, READ RATHER THAN ASSUMED.
      const migDir = join(repoRoot, "supabase", "migrations");
      const migs = walk(migDir).filter((f) => f.endsWith(".sql"));
      // The count is a drift guard on the tree this case reads its contract
      // from, not a claim about the tour. MOVED 113 -> 114 for BOB-14's revoke of
      // the public lesson view (20261008100000), which is not a tour RPC and
      // does not touch person_tour_state (D-024). MOVED 112 -> 113 for BOB-02's lesson
      // workbook import (20261007100000), which is not a tour RPC and does not
      // touch person_tour_state (D-024). MOVED 111 -> 112 for BOB-01's school
      // structure functions and the intake's M5a rules (20261006100000), none
      // of which is a tour RPC and none of which touches person_tour_state.
      // MOVED 110 -> 111 for the activation
      // grant (NEW-2), which is not a tour RPC and does not touch
      // person_tour_state. MOVED 108 -> 110 for the systemic
      // repair -- assessment refusal codes and finish manifest, and account
      // activation -- neither of which is a tour RPC nor touches
      // person_tour_state. MOVED 106 -> 108 for the two final
      // release deltas -- the installation-initialisation record and the
      // first-role discovery read -- neither of which is a tour RPC nor touches
      // person_tour_state. MOVED 105 -> 106 for the day-zero
      // first-administrator bootstrap, which is one operator-only function and
      // one guard clause and touches no tour RPC. MOVED 102 -> 105 for WP8: a grant on
      // org_kind_level plus an owner-run reachability assertion, a replaced
      // report-template trigger plus one revoke, and one report-configuration
      // endpoint. None of the three is a tour RPC and none touches
      // person_tour_state. MOVED 88 -> 92 for WP1's source-bound
      // metric authorization and objective B, none of which adds or alters a
      // tour RPC. MOVED 101 -> 102 for WP7D's feedback-subject discovery
      // (20261001100000), which adds two feedback-domain functions and touches
      // no tour RPC and no person_tour_state.
      // MOVED 100 -> 101 for WP7B's feedback foundation
      // (20260930100000), which creates nine feedback tables and ten
      // endpoints, none of them a tour RPC and none of them touching
      // person_tour_state -- so the four signatures asserted below still come
      // from the tour's own migration and still take no identity.
      // MOVED 99 -> 100 for WP6A's closure patch (20260929100000),
      // which gates the learning-cycle start path on a published release and
      // protects one more course column -- neither of which is a tour RPC.
      // MOVED 98 -> 99 for WP6A's academic-evidence boundary
      // correction (20260928100000), which adds two views over the evidence
      // boundary, rewrites the four aggregates that read it, carries the
      // learning context through course revision and structured ingestion, and
      // adds an authoritative course-creation endpoint -- not one of which is a
      // tour RPC, so the four signatures asserted below still come from the
      // tour's own migration and still take no identity. MOVED 87 -> 88 for WP1's
      // authorization-boundary correction (20260923090000), which touches the
      // metric evaluator, the report writer and the generated-report policy and
      // neither adds nor alters a tour RPC -- so the four signatures asserted
      // below still come from the tour's own migration and still take no
      // identity. Re-read before the number moved.
      c.expect(migs.length === 114, `${migs.length} migrations; the baseline has 114`);
      const tourMig = migs.find((f) => f.includes("tour_state_follows_the_person"));
      c.expect(Boolean(tourMig), "the tour persistence migration is not in the tree");
      const sql = tourMig ? readFileSync(tourMig, "utf8") : "";
      for (const n of DIHARAP) {
        const sig = new RegExp(`create (?:or replace )?function public\\.${n}\\(([^)]*)\\)`).exec(sql);
        c.expect(sig !== null, `${n} is not declared in the migration the client calls`);
        c.expect(!/person|user_id|uuid/i.test(sig?.[1] ?? ""),
          `${n} takes an identity parameter: ${sig?.[1]}`);
      }
      c.expect(/revoke[\s\S]*current_tour_version[\s\S]*from[^;]*authenticated/i.test(sql),
        "current_tour_version is not revoked from authenticated in the migration");
      // The cap is the database's, and the surface never restates it.
      c.expect(/auto_presentation_limit/.test(sql), "the migration declares no presentation cap");
      const model = code(readFileSync(join(repoRoot, "src", "lib", "tur.ts"), "utf8"));
      c.expect(/keadaan\.auto_presentation_limit/.test(model),
        "the cap is not read from the person's own row");
      c.expect(!/<\s*3\b|===\s*3\b|>=\s*3\b/.test(model),
        "the presentation cap is restated as a literal in the model; it belongs to the database");

      // 4. IT IS PRESENTATION STATE AND NOTHING ELSE. No tour write may reach a
      //    learning record, an audit line or an evidence table.
      const BUKTI = /responses|assessment_results|official_|integrity_|certificates|learning_assignments|audit/;
      for (const f of turFiles) {
        const rel = relative(repoRoot, f).replace(/\\/g, "/");
        const m = BUKTI.exec(code(readFileSync(f, "utf8")));
        c.expect(m === null, `${rel} names an evidence or audit surface: ${m?.[0]}`);
      }

      c.note(`${turFiles.length} tour file(s), ${DIHARAP.length} RPC signature(s) read from the migration, ` +
        `${migs.length} migration(s), 2 plants caught`);
      return c.verdict(
        "the tour's memory belongs to the person and not to the device: nothing in it touches localStorage, " +
        "sessionStorage, a cookie or IndexedDB — with a planted write of each watched to be caught — every durable " +
        "answer goes through the four declared RPCs, whose signatures are READ from the migration and carry no " +
        "identity parameter, the internal version function is never called and is revoked from authenticated in the " +
        "migration, the presentation cap is taken from the person's own row rather than restated, and no tour file " +
        "names an evidence or audit surface",
      );
    },
  },

  {
    id: "UX1-TUR-TAHAP-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();

      // 1. THE FUNCTION REFUSES BY SHAPE. It takes a legitimate person-scoped
      //    stage or nothing, and there is no second parameter a course, a
      //    class, an age or a heuristic could be passed through.
      c.expect(varianBelajar.length === 1,
        `varianBelajar takes ${varianBelajar.length} parameters; one is the whole of the refusal`);
      c.expect(varianBelajar(null) === "netral", "a learner with no known stage is not given the neutral variant");
      c.expect(varianBelajar(undefined) === "netral", "an absent stage is not the neutral variant");
      c.expect(varianBelajar("sd") === "sd", "a legitimate primary stage does not select the primary variant");
      c.expect(varianBelajar("menengah") === "menengah", "a legitimate secondary stage does not select its variant");

      // 2. ONE IDENTITY, THREE VARIANTS. A variant change is not a new tour: it
      //    must not reset state, duplicate a row or re-present anything, which
      //    is only true while all three hang on the same key.
      const kunciBelajar = new Set([tur("netral").kunci, tur("sd").kunci, tur("menengah").kunci]);
      c.expect(kunciBelajar.size === 1 && kunciBelajar.has(TUR_BELAJAR),
        `the learner variants hang on ${kunciBelajar.size} identities; a variant change would reset state`);
      c.expect(tur("pengajar").kunci === TUR_PENGAJAR, "the educator tour is not the educator identity");
      for (const v of ["netral", "sd", "menengah", "pengajar"] as const) {
        c.expect(tur(v).langkah.length === 7, `the ${v} tour has ${tur(v).langkah.length} steps; the design has seven`);
        const posisi = tur(v).langkah.map((l) => l.posisi);
        c.expect(posisi.join(",") === "1,2,3,4,5,6,7", `the ${v} tour's positions are ${posisi.join(",")}`);
      }

      // 3. NOTHING IN THE TOUR READS A STAGE FROM ANYWHERE ELSE. `courses.stage`
      //    is a property of a course and the session's stage is a property of a
      //    session; neither is a fact about a learner, and guessing from either
      //    would tell a fifteen-year-old that PINTAR thinks they are eight.
      const turFiles = [
        ...walk(join(repoRoot, "src", "components", "tur")),
        join(repoRoot, "src", "lib", "tur.ts"),
        join(repoRoot, "src", "lib", "tur-negara.ts"),
      ].filter((f) => /\.tsx?$/.test(f));
      const TEBAK = /courses?\.stage|\bstage\b|\bumur\b|\bage\b|birth|tanggal_lahir|\btingkat\b|\bgrade\b|jenjang/i;
      for (const f of turFiles) {
        const rel = relative(repoRoot, f).replace(/\\/g, "/");
        const m = TEBAK.exec(code(readFileSync(f, "utf8")));
        c.expect(m === null, `${rel} reaches for something to guess a learner's stage from: ${m?.[0]}`);
      }
      c.expect(TEBAK.test('const v = varianBelajar(kursus.stage);'),
        "the stage-guess scanner does not catch a course stage");
      c.expect(TEBAK.test('if (murid.age < 12) {'), "the stage-guess scanner does not catch an age");

      // 4. THE CALL SITE PASSES NOTHING, and it is read rather than trusted.
      const belajar = code(readFileSync(join(repoRoot, "src", "app", "belajar", "page.tsx"), "utf8"));
      const panggilan = [...belajar.matchAll(/varianBelajar\(([^)]*)\)/g)].map((m) => m[1].trim());
      c.expect(panggilan.length === 1, `varianBelajar is called ${panggilan.length} times on the learner landing`);
      c.expect(panggilan[0] === "null",
        `the learner landing passes \`${panggilan[0]}\` as a stage; no legitimate person-scoped source exists`);

      // 5. THE MACHINERY IS NEVER SHOWN. Not on a tour surface, not in its copy.
      const MESIN = /\bRasch\b|\btheta\b|\blogit\b|\bIRT\b|ability|discrimination|p-?value|difficulty|calibration/i;
      for (const f of turFiles) {
        const rel = relative(repoRoot, f).replace(/\\/g, "/");
        const m = MESIN.exec(readFileSync(f, "utf8"));
        c.expect(m === null, `${rel} names the measurement machinery: ${m?.[0]}`);
      }
      for (const k of allKeys().filter((k) => k.startsWith("tur."))) {
        for (const loc of LOCALES) {
          const text = t(k as HleEvent, "learner", { locale: loc });
          const m = MESIN.exec(text);
          c.expect(m === null, `the tour telling ${k}/${loc} names the machinery: ${m?.[0]}`);
        }
      }

      c.note(`4 variant(s) x 7 step(s), ${turFiles.length} tour file(s) swept, 1 call site read, 2 plants caught`);
      return c.verdict(
        "PINTAR does not guess a learner's stage: varianBelajar takes one legitimate person-scoped parameter and " +
        "nothing else, returns the neutral variant for absent and unknown alike, and the learner landing is READ to " +
        "be passing a literal null because no such source exists at this baseline; all three learner variants hang " +
        "on one persistence identity so a stage arriving later resets nothing; no tour file reaches for a course " +
        "stage, an age, a grade or a year — with both watched on plants — and neither a tour surface nor a tour " +
        "telling in either language names the measurement machinery",
      );
    },
  },

  {
    id: "UX1-TUR-PERAN-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();

      // 1. SENIORITY DOES NOT ACCUMULATE TOURS. A Head of Department on the
      //    Classes page gets no automatic tour rather than the educator's,
      //    which omits the review work that is most of their week.
      const TABEL: Array<[string[], boolean, string]> = [
        [["EDUCATOR"], true, "a plain educator"],
        [["EDUCATOR", "STUDENT"], true, "an educator who also learns"],
        [["EDUCATOR", "HEAD_OF_DEPARTMENT"], false, "a head of department"],
        [["EDUCATOR", "DEAN"], false, "a dean"],
        [["EDUCATOR", "INSTITUTION_ADMIN"], false, "a school administrator"],
        [["EDUCATOR", "SYSTEM_ADMIN"], false, "a system administrator"],
        [["HEAD_OF_DEPARTMENT"], false, "a head of department who teaches nothing"],
        [["STUDENT"], false, "a learner"],
        [[], false, "somebody with no active grant at all"],
      ];
      for (const [peran, harap, siapa] of TABEL) {
        c.expect(turPengajarBerlaku(peran) === harap,
          `${siapa} (${peran.join("+") || "none"}) is ${harap ? "refused" : "given"} the educator tour`);
      }
      // The enum is read rather than remembered: a seventh role appearing in
      // the schema must not silently inherit somebody else's map.
      const dasar = readFileSync(
        join(repoRoot, "supabase", "migrations", "20260912004158_foundation_base.sql"), "utf8");
      const enumRow = /create type public\.app_role as enum\s*\(([^)]*)\)/.exec(dasar);
      c.expect(enumRow !== null, "the role enum is not in the migrations");
      const roles = [...(enumRow?.[1] ?? "").matchAll(/'([A-Z_]+)'/g)].map((m) => m[1]);
      c.expect(roles.length === 6, `${roles.length} roles in the enum; the table above covers six`);
      for (const r of roles) {
        if (r === "EDUCATOR" || r === "STUDENT") continue;
        c.expect(!turPengajarBerlaku(["EDUCATOR", r]), `${r} inherits the educator tour`);
      }

      // 2. THE WINDOW IS THE GRANT'S OWN, and a grant with no scope node still
      //    counts — which is exactly where this differs from the teaching
      //    context's filter, and exactly the grant a school administrator holds.
      const kini = new Date("2026-09-18T09:00:00Z");
      const hidup = { role: "EDUCATOR", valid_from: null, valid_until: null, revoked_at: null };
      c.expect(peranAktif([hidup], kini).join() === "EDUCATOR", "an open-ended live grant is not active");
      c.expect(peranAktif([{ ...hidup, revoked_at: "2026-01-01T00:00:00Z" }], kini).length === 0,
        "a revoked grant is still counted");
      c.expect(peranAktif([{ ...hidup, valid_from: "2027-01-01T00:00:00Z" }], kini).length === 0,
        "a grant that has not begun is counted");
      c.expect(peranAktif([{ ...hidup, valid_until: "2026-01-01T00:00:00Z" }], kini).length === 0,
        "an expired grant is still counted");
      c.expect(peranAktif([hidup, hidup], kini).length === 1, "the same role twice is counted twice");
      const negara = code(readFileSync(join(repoRoot, "src", "lib", "tur-negara.ts"), "utf8"));
      c.expect(/select\("role, valid_from, valid_until, revoked_at"\)/.test(negara),
        "the seniority read asks for something other than the grant's role and window");
      c.expect(!/scope_node_id/.test(negara),
        "the seniority read drops grants by scope node; an institution-wide grant has none and must not be missed");

      // 3. THE GATE REACHES BOTH PRESENTATION AND THE OFFER. A tour that is not
      //    this person's must not be presented AND must not be offered in Help
      //    (§H-3, §H-6): a map of somebody else's page is not help.
      const mengajar = code(readFileSync(join(repoRoot, "src", "app", "mengajar", "page.tsx"), "utf8"));
      c.expect(/tersedia=\{turBerlaku\}/.test(mengajar),
        "the educator landing does not hand the seniority answer to the tour");
      const turSrc = code(readFileSync(join(repoRoot, "src", "components", "tur", "Tur.tsx"), "utf8"));
      c.expect(/const otomatisSekarang = tersedia &&/.test(turSrc),
        "automatic presentation is not gated on the tour being this person's");
      c.expect(/tur=\{tersedia \? daftar : null\}/.test(turSrc),
        "Help offers the tour to somebody it does not belong to");
      // ADVERSARIAL PLANT: a gate that is bypassed at the call site must fail.
      const ditanam = mengajar.replace("tersedia={turBerlaku}", "tersedia={true}");
      c.expect(!/tersedia=\{turBerlaku\}/.test(ditanam),
        "the call-site check does not notice a hard-coded gate");

      // 4. THE TOUR IS THE EXPERIENCE'S, AND THE EXPERIENCE IS THE DOOR'S.
      //    SENIORITY STILL BUYS NO TOUR AND COSTS NONE: a senior person's
      //    LEARNER experience is still the learner experience, so every role
      //    above EDUCATOR still receives the learner landing's own tour.
      //
      //    WP6B MADE THIS PROVABLE RATHER THAN PATTERN-MATCHED. Until it, this
      //    clause asserted that the landing never mentions `peranSaya` — a
      //    proxy, and one that stopped meaning what it said the moment the
      //    landing began serving two shells. The rule underneath it is
      //    unchanged and is now asserted directly, through the function that
      //    decides: rank does not enter into which tour is presented.
      const belajar = code(readFileSync(join(repoRoot, "src", "app", "belajar", "page.tsx"), "utf8"));
      c.expect(!/turPengajarBerlaku\(/.test(belajar),
        "the learner landing applies the educator seniority gate to the learner experience");
      for (const senior of ["HEAD_OF_DEPARTMENT", "DEAN", "INSTITUTION_ADMIN", "SYSTEM_ADMIN"]) {
        c.expect(konteksPembelajaran([senior]).turBelajar === true,
          `${senior} is denied the learner landing's own tour for being senior`);
        c.expect(konteksPembelajaran([senior]).mengajar === false,
          `${senior} inherits the educator's shell on the learner landing`);
      }
      c.expect(konteksPembelajaran([]).turBelajar === true,
        "somebody holding no role at all is denied the learner landing's tour");
      //    The ONE person who does not receive it is the educator, and not for
      //    rank: their shell carries neither the Sertifikat tab nor the Bantuan
      //    control, and steps 6 and 7 of the learner tour are anchors on
      //    exactly those two. A map whose last two steps point at nothing is
      //    not a map, so the tour follows the shell it describes.
      const netral = tur("netral").langkah;
      const jangkar = netral.filter((l) => l.sasaran.jenis === "anchor").map((l) => l.sasaran.nama);
      c.expect(jangkar.includes("sertifikat") && jangkar.includes("bantuan"),
        "the learner tour no longer anchors on the two shell controls this rule rests on");
      c.expect(konteksPembelajaran(["EDUCATOR"]).turBelajar === false,
        "the learner tour would be presented on a shell that carries neither anchor it ends on");
      const cangkangSrc = code(readFileSync(join(repoRoot, "src", "components", "CangkangPengalaman.tsx"), "utf8"));
      // The educator's learning branch runs from `if (mengajar)` to the plain
      // learner shell's own return, which is the last one in the file.
      const blokAjar = cangkangSrc.slice(cangkangSrc.indexOf("if (mengajar)"), cangkangSrc.lastIndexOf("return ("));
      c.expect(blokAjar.includes("nav.pembelajaran"), "the educator's learning shell could not be located");
      c.expect(!/TombolBantuan/.test(blokAjar),
        "the educator's learning shell carries a Help control whose tour is not theirs");

      c.note(`${TABEL.length} role combination(s), ${roles.length} enum role(s) read from the migration, ` +
        `5 window case(s), ${jangkar.length} tour anchor(s), 1 plant caught`);
      return c.verdict(
        "a tour belongs to an experience and seniority does not accumulate one: turPengajarBerlaku refuses every " +
        "role above EDUCATOR in the schema's own enum, which is READ rather than remembered, so a seventh role " +
        "cannot silently inherit somebody else's map; the active-grant filter honours the grant's own window and " +
        "deliberately keeps grants with no scope node, which is the kind a school administrator holds; the gate " +
        "reaches both automatic presentation and the Help offer, with a hard-coded gate watched to be caught; and " +
        "SENIORITY STILL BUYS NO TOUR AND COSTS NONE -- every role above EDUCATOR, and somebody holding no role " +
        "at all, still receives the learner landing's own tour, asserted through the function that decides " +
        "rather than through a source pattern. The one reader who does not is the educator, and not for rank: " +
        "steps 6 and 7 of that tour are anchors on the Sertifikat tab and the Bantuan control, both READ from " +
        "the tour itself, and the educator's learning shell carries neither -- so the tour follows the shell it " +
        "describes, because a map whose last two steps point at nothing is not a map",
      );
    },
  },

  {
    id: "UX1-TUR-TAMPIL-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const K = (o: Partial<Parameters<typeof akanMunculLagi>[0] & object>) => ({
        tour_key: TUR_BELAJAR, tour_version: 1, should_auto_present: true,
        auto_shown_count: 0, auto_presentation_limit: 3, completed: false, suppressed: false,
        ...o,
      });

      // 1. WHETHER IT OPENS BY ITSELF. The database owns the durable half and
      //    this never second-guesses it; the only thing added is two Experience
      //    exclusions, and neither of them spends a presentation — which is why
      //    the answer carries a reason rather than a bare false.
      const bebas = { tautanLangsung: false, ujiCepatBerjalan: false };
      c.expect(bolehTampilOtomatis(K({}), bebas).boleh, "a first arrival with a clean row is held back");
      const tidakBerhak = bolehTampilOtomatis(K({ should_auto_present: false }), bebas);
      c.expect(!tidakBerhak.boleh && tidakBerhak.sebab === "tidak_berhak",
        "the database's own refusal is not honoured, or is not named");
      const kosong = bolehTampilOtomatis(null, bebas);
      c.expect(!kosong.boleh && kosong.sebab === "tidak_berhak",
        "a state that could not be read opens the tour anyway");
      const dalam = bolehTampilOtomatis(K({}), { ...bebas, tautanLangsung: true });
      c.expect(!dalam.boleh && dalam.sebab === "tautan_langsung",
        "a deep-link arrival presents the tour; it waits for a landing arrival");
      const cepat = bolehTampilOtomatis(K({}), { ...bebas, ujiCepatBerjalan: true });
      c.expect(!cepat.boleh && cepat.sebab === "uji_cepat_berjalan",
        "a class waiting for a quick check is held up by onboarding");

      // 2. THE EXCLUSIONS ARE THE PAGE'S OWN INFORMATION, not a second question
      //    asked of the database — and the learner's one really is the learner's.
      const belajar = code(readFileSync(join(repoRoot, "src", "app", "belajar", "page.tsx"), "utf8"));
      c.expect(/ujiCepatBerjalan: terbuka\.some\(\(a\) => a\.mode === "QUICK"\)/.test(belajar),
        "the running-quick-assessment exclusion is not taken from what the page already shows");
      c.expect(/tautanLangsung: typeof sp\.lanjut === "string"/.test(belajar),
        "the learner landing does not recognise a deep-link arrival");
      const mengajar = code(readFileSync(join(repoRoot, "src", "app", "mengajar", "page.tsx"), "utf8"));
      c.expect(/ujiCepatBerjalan: false/.test(mengajar),
        "the educator landing borrows the learner's quick-assessment exclusion");

      // 3. THE TIP TELLS THE TRUTH, and the truth is the durable state's, not
      //    what the person just pressed. A replay closed with nothing ticked
      //    must not promise a return that a finish, a suppression or a spent
      //    cap has already ruled out.
      const bersih = { tampilOtomatis: 0, dicentang: false, selesai: false };
      c.expect(akanMunculLagi(K({}), bersih), "a skipped first presentation is said not to return");
      c.expect(!akanMunculLagi(K({ completed: true }), bersih),
        "a replay after finishing promises the tour will come back");
      c.expect(!akanMunculLagi(K({ suppressed: true }), bersih),
        "a replay after 'do not show again' promises the tour will come back");
      c.expect(!akanMunculLagi(K({ auto_shown_count: 2 }), { ...bersih, tampilOtomatis: 1 }),
        "the third automatic presentation still promises a fourth");
      c.expect(akanMunculLagi(K({ auto_shown_count: 1 }), { ...bersih, tampilOtomatis: 1 }),
        "the second of three presentations is said to be the last");
      c.expect(!akanMunculLagi(K({}), { ...bersih, dicentang: true }), "a ticked box still promises a return");
      c.expect(!akanMunculLagi(K({}), { ...bersih, selesai: true }), "finishing still promises a return");
      c.expect(!akanMunculLagi(null, bersih), "an unreadable state promises a return");
      // A limit of one is honoured as readily as three: the number is the row's.
      c.expect(!akanMunculLagi(K({ auto_presentation_limit: 1 }), { ...bersih, tampilOtomatis: 1 }),
        "a cap of one is not honoured; the cap is the database's, not the code's");

      c.expect(tipSetelahTutup({ akanMunculLagi: true, sd: false }) === "tur.tip.lagi",
        "a tour that will return does not say so");
      c.expect(tipSetelahTutup({ akanMunculLagi: true, sd: true }) === "tur.tip.lagi.sd",
        "a primary-school reader gets the adult sentence");
      c.expect(tipSetelahTutup({ akanMunculLagi: false, sd: false }) === "tur.tip.berhenti",
        "a tour that will not return promises one");
      c.expect(tipSetelahTutup({ akanMunculLagi: false, sd: true }) === "tur.tip.berhenti",
        "a primary-school reader is told the tour will return when it will not");

      // 4. CLOSING, AND WHAT EACH WAY OF CLOSING MEANS. Skip and Esc are the
      //    same act; reaching the last step and closing is finishing; the box
      //    takes effect however the card closes.
      const turSrc = code(readFileSync(join(repoRoot, "src", "components", "tur", "Tur.tsx"), "utf8"));
      c.expect(/const selesai = cara === "selesai" \|\| indeks === total - 1;/.test(turSrc),
        "closing on the last step is not treated as finishing");
      c.expect(/if \(e\.key === "Escape"\)[\s\S]{0,120}tutup\("lewati"\)/.test(turSrc),
        "Escape does not close the tour as a skip");
      c.expect(/if \(centang\) void bungkamTurAksi\(kunci\);/.test(turSrc),
        "the checkbox does not take effect when the card closes");
      // The checkbox is absent on the last step and on a replay: the first
      // because finishing already stops automatic presentation, the second
      // because a deliberate replay is not the moment to decide about being
      // interrupted.
      c.expect(/\{akhir \|\| replay \?/.test(turSrc),
        "the checkbox is offered on the last step or during a replay");
      // NO TIMEOUTS ANYWHERE. Nothing in the tour closes itself.
      const tutupSendiri = [...walk(join(repoRoot, "src", "components", "tur"))]
        .filter((f) => /\.tsx$/.test(f))
        .flatMap((f) => [...code(readFileSync(f, "utf8")).matchAll(/setTimeout\(([^;]*?)\)/g)]
          .map((m) => `${relative(repoRoot, f)}: ${m[0].slice(0, 80)}`))
        .filter((s) => /tutup|setAktif\(false\)|onTutup/.test(s));
      c.expect(tutupSendiri.length === 0, `something in the tour closes itself on a timer: ${tutupSendiri.join("; ")}`);

      // 5. THE CARD IS NEVER OVER THE THING IT IS DESCRIBING (§M).
      //
      // A rendered measurement at 1280x813 found it there, and the arithmetic
      // below is why: the scroll band asked only whether the target was VISIBLE.
      // A target can be perfectly visible and still leave no room to put the
      // card below it — and with a target too wide for the card to sit beside,
      // the placement fell through to centred, on top of its own subject.
      //
      // The geometry here is the one that was measured, not a constructed one.
      const layar: Layar = { lebar: 1280, tinggi: 813, atap: TEPI, telepon: false };
      const kartu = { lebar: 420, tinggi: 327 };
      /** The target as it was measured: visible, wide, and sitting too low. */
      const diukur: Petak = { top: 233, left: 284, width: 712, height: 298 };

      // (a) The band now subtracts the card's own height, so the scroll brings
      //     the target up far enough to leave room rather than merely on screen.
      const pita = pitaSasaran(layar, kartu.tinggi);
      c.expect(pita.bawah === 813 - 327 - JARAK - TEPI,
        `the wide-screen band is ${pita.bawah}; it must leave room for the card below the target`);
      c.expect(pitaSasaran({ ...layar, telepon: true }, kartu.tinggi).bawah === 813 - 327 - TEPI,
        "the phone band does not leave the docked sheet's height above it");
      const geser = geserKe(diukur, pita);
      c.expect(geser > 0, "the measured target is left where it was, with no room for the card below it");

      //     …and the page must HAVE that much scroll to give. A short page has
      //     none, which is how the browser measurement reproduced the overlap
      //     even after the band was fixed: the scroll was computed and then did
      //     nothing. The room is lent on both layouts, not only the phone.
      c.expect(ruangBawah(kartu.tinggi, false) === kartu.tinggi + JARAK,
        `a wide screen lends ${ruangBawah(kartu.tinggi, false)}px; the card needs its own height and its gap`);
      c.expect(ruangBawah(kartu.tinggi, true) === kartu.tinggi,
        "a phone lends more than the docked sheet's height");
      c.expect(ruangBawah(0, false) === 0 && ruangBawah(0, true) === 0,
        "the page is padded before the card has been measured");
      c.expect(ruangBawah(kartu.tinggi, false) >= geser,
        "the room lent is less than the scroll the measured target needs, so the scroll would do nothing");
      const turSrcPinjam = code(readFileSync(join(repoRoot, "src", "components", "tur", "Tur.tsx"), "utf8"));
      c.expect(/const pinjam = ruangBawah\(tinggiKartu, layar\.telepon\);/.test(turSrcPinjam),
        "the tour does not lend the page room from the one place that decides how much");
      c.expect(/document\.body\.style\.paddingBottom = ""/.test(turSrcPinjam),
        "the room the page lends is never given back");

      // (b) After that scroll the card goes BELOW the target, clear of it.
      const setelah: Petak = { ...diukur, top: diukur.top - geser };
      const tempat = tempatKartu(setelah, kartu, layar);
      const kotakKartu: Petak = { ...tempat, width: kartu.lebar, height: kartu.tinggi };
      c.expect(!bertumpuk(kotakKartu, setelah),
        `the card at ${JSON.stringify(tempat)} still covers the target at ${JSON.stringify(setelah)}`);
      c.expect(tempat.top >= setelah.top + setelah.height,
        "the card is not below the target it describes");

      // (c) THE CONTROL, which is the whole reason this is a test and not a
      //     comment: with the OLD band — the one that asked only whether the
      //     target was visible — the same placement puts the card over it.
      const pitaLama = { atas: TEPI, bawah: layar.tinggi - TEPI };
      const geserLama = geserKe(diukur, pitaLama);
      const lama: Petak = { ...diukur, top: diukur.top - geserLama };
      const tempatLama = tempatKartu(lama, kartu, layar);
      c.expect(
        bertumpuk({ ...tempatLama, width: kartu.lebar, height: kartu.tinggi }, lama),
        "the defect this check exists for no longer reproduces under the old band, so the check proves nothing",
      );

      // (d) The other three placements, each the case it is there for.
      const cukupRuang: Petak = { top: 120, left: 284, width: 712, height: 120 };
      c.expect(tempatKartu(cukupRuang, kartu, layar).top === 120 + 120 + JARAK,
        "a target with room below it does not get the card below it");
      const dibawah: Petak = { top: 420, left: 284, width: 300, height: 40 };
      const atas = tempatKartu(dibawah, kartu, layar);
      c.expect(atas.top === 420 - JARAK - kartu.tinggi, "a target with no room below does not get the card above it");
      // The tall target STRADDLES THE CENTRE on purpose: with a target off to
      // one side, a card that simply centred would clear it by accident, and
      // the check would pass while the beside branch was gone. Planting its
      // removal is what found that, so the geometry is chosen to discriminate.
      const tinggiSempit: Petak = { top: 20, left: 500, width: 300, height: 700 };
      const samping = tempatKartu(tinggiSempit, kartu, layar);
      c.expect(!bertumpuk({ ...samping, width: kartu.lebar, height: kartu.tinggi }, tinggiSempit),
        `a tall target straddling the centre gets the card on top of it: ${JSON.stringify(samping)}`);
      c.expect(samping.left >= tinggiSempit.left + tinggiSempit.width,
        "the card is not placed beside the tall target");
      // And the mirror: no room on the right, so it goes to the left.
      const kananPenuh: Petak = { top: 20, left: 480, width: 760, height: 700 };
      const kiriKartu = tempatKartu(kananPenuh, kartu, layar);
      c.expect(kiriKartu.left + kartu.lebar <= kananPenuh.left,
        `with no room on the right the card is not placed on the left: ${JSON.stringify(kiriKartu)}`);
      // No target at all: centred with the veil, which is §J-1 and not a defect.
      const tanpa = tempatKartu(null, kartu, layar);
      c.expect(tanpa.left === (1280 - 420) / 2, "a step with no target does not centre its card");
      // THE CEILING, on a viewport SHORT ENOUGH FOR IT TO BITE. On a tall one
      // the centred card already clears a banner by accident and the check
      // would pass with the ceiling gone — planting its removal is what found
      // that, so the viewport here is one where centring would breach it.
      const berbanner: Layar = { lebar: 1280, tinggi: 500, atap: 96, telepon: false };
      c.expect((berbanner.tinggi - kartu.tinggi) / 2 < berbanner.atap,
        "the ceiling fixture no longer bites, so it proves nothing");
      c.expect(tempatKartu(null, kartu, berbanner).top >= berbanner.atap,
        "the centred card ignores the ceiling Evaluation Mode's banner sets");
      c.expect(tempatKartu(tinggiSempit, kartu, berbanner).top >= berbanner.atap,
        "the card placed beside a target ignores the ceiling");

      c.note("5 presentation decision(s), 9 return predicate(s), 4 tip wording(s), 4 closing rule(s), " +
        "8 placement(s) including the measured overlap and its control");
      return c.verdict(
        "automatic presentation, replay and the after-closing tip agree with each other: the database's own refusal " +
        "is honoured and an unreadable state never opens the tour, the two Experience exclusions are named rather " +
        "than silent and are taken from what each page already shows, the tip's wording is decided from the durable " +
        "state — so a replay closed without ticking cannot promise a return that a finish, a suppression or a spent " +
        "cap has ruled out — the cap is the row's own number and a cap of one is honoured as readily as three, " +
        "skip and Escape are the same act, closing on the last step is finishing, nothing closes itself on a timer, " +
        "and the card is never over the target it describes — driven through the exact geometry a rendered " +
        "measurement found it there with, and watched to still reproduce under the band that caused it",
      );
    },
  },

  {
    id: "UX1-TUR-KATA-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const turKeys = allKeys().filter((k) => k.startsWith("tur.") || k === "nav.bantuan");
      c.expect(turKeys.length >= 89, `${turKeys.length} tour copy key(s); the design's four tours need more than that`);

      // 1. EVERY KEY THE TOUR RENDERS IS DECLARED, and every declared key has a
      //    real telling in both languages.
      const dipakai = new Set<string>();
      // WHICH ANCHORS A LANDING CAN LEGITIMATELY REPORT EMPTY — read from the
      // pages rather than listed here, so a new empty state cannot appear
      // without the step pointing at it gaining wording for it, and a step
      // cannot carry wording for an emptiness that never happens.
      const bisaKosong = new Set<string>();
      const anchorAda = new Set<string>();
      const surfaces = [
        ...walk(join(repoRoot, "src", "app")),
        ...walk(join(repoRoot, "src", "components")),
      ].filter((f) => /\.tsx$/.test(f));
      for (const f of surfaces) {
        const src = readFileSync(f, "utf8");
        for (const m of src.matchAll(/data-tur="([a-z]+)"/g)) anchorAda.add(m[1]);
        const i = src.indexOf("kosong={");
        if (i < 0) continue;
        let depth = 0, j = i + "kosong=".length;
        for (; j < src.length; j++) {
          if (src[j] === "{") depth++;
          else if (src[j] === "}" && --depth === 0) break;
        }
        for (const m of src.slice(i, j).matchAll(/"([a-z]+)"/g)) bisaKosong.add(m[1]);
      }
      c.expect(bisaKosong.size >= 4,
        `${bisaKosong.size} anchor(s) a landing can report empty; the two landings declare four between them`);

      for (const v of ["netral", "sd", "menengah", "pengajar"] as const) {
        const d = tur(v);
        dipakai.add(d.nama as string);
        for (const l of d.langkah) {
          dipakai.add(l.judul as string);
          dipakai.add(l.isi as string);
          if (l.kosong) dipakai.add(l.kosong as string);
          if (l.sasaran.jenis !== "anchor") {
            c.expect(!l.kosong, `${v} step ${l.posisi} draws a miniature and carries empty-state wording`);
            continue;
          }
          const nama = l.sasaran.nama;
          // The tour may not point at something that is not there: the anchor
          // has to exist on a real surface.
          c.expect(anchorAda.has(nama),
            `${v} step ${l.posisi} points at the anchor "${nama}", which no surface carries`);
          // The count stays seven when the thing the step describes is not
          // there yet, so a step whose target CAN be empty needs wording for it
          // — and a step whose target never is must not pretend otherwise.
          c.expect(bisaKosong.has(nama) === Boolean(l.kosong),
            bisaKosong.has(nama)
              ? `${v} step ${l.posisi} points at ${nama}, which a landing can report empty, with no wording for it`
              : `${v} step ${l.posisi} carries empty-state wording for ${nama}, which no landing ever reports empty`);
        }
      }
      for (const k of dipakai) {
        c.expect(turKeys.includes(k as HleEvent), `the tour renders ${k}, which the copy table does not declare`);
        for (const loc of LOCALES) {
          c.expect(t(k as HleEvent, "learner", { locale: loc }).trim().length > 0,
            `${k} has no telling in ${loc}`);
        }
      }
      for (const k of turKeys) {
        const both = LOCALES.map((loc) => t(k as HleEvent, "learner", { locale: loc }));
        c.expect(both.every((s) => s.trim().length > 0), `${k} is missing a telling`);
      }

      // 2. THE CANONICAL TERMS, AND THE ONES THE RULINGS RETIRED.
      const semua = turKeys.flatMap((k) =>
        LOCALES.flatMap((loc) => (["learner", "educator"] as const).map((p) => ({
          k, loc, p, text: t(k as HleEvent, p, { locale: loc }),
        }))));
      const TERLARANG: Array<[RegExp, string]> = [
        [/Kuis Cepat/, "the retired learner term for a Quick Assessment"],
        [/Mastery Test/, "the retired English name for Uji Penguasaan"],
        [/\bDRAFT\b|\bACTIVE\b|\bFINALIZED\b|\bPOST_TEST\b|\bPRE_TEST\b|\bQUICK\b/, "a lifecycle or mode enum"],
        [/can_on_node|has_scope|RLS|SECURITY DEFINER|role_assignments/, "a database word"],
      ];
      for (const r of semua) {
        for (const [re, apa] of TERLARANG) {
          c.expect(!re.test(r.text), `${r.k}/${r.loc}/${r.p} carries ${apa}: "${r.text.slice(0, 80)}"`);
        }
      }
      const gabung = semua.map((r) => r.text).join(" | ");
      for (const kata of ["Uji Cepat", "Quick Assessment", "Uji Penguasaan", "Mastery Check"]) {
        c.expect(gabung.includes(kata), `the canonical term "${kata}" appears in no tour telling`);
      }

      // 3. THE CERTIFICATE STEP DOES NOT PROMISE ONE (V-6a is still open). It
      //    may say where certificates live and that each can be checked; it may
      //    not say one is coming.
      for (const k of ["tur.nt.6.isi", "tur.sm.6.isi"] as const) {
        for (const loc of LOCALES) {
          const text = t(k, "learner", { locale: loc });
          const JANJI = /akan (menerima|mendapat|diberikan)|you will (get|receive|earn)|dapatkan sertifikat|earn a certificate/i;
          c.expect(!JANJI.test(text), `${k}/${loc} promises a certificate: "${text}"`);
        }
      }
      // And the educator's Quick Assessment step keeps the QUICK ruling's
      // sentence: the result is evidence, and one quick check is not a
      // certificate.
      const pg4 = LOCALES.map((loc) => t("tur.pg.4.isi", "educator", { locale: loc }));
      c.expect(pg4.every((s) => /bukti belajar|learning evidence/i.test(s)),
        "the educator's Quick Assessment step no longer says the result becomes evidence");
      c.expect(pg4.every((s) => /tidak menerbitkan sertifikat|does not issue a certificate/i.test(s)),
        "the educator's Quick Assessment step no longer says one quick check is not a certificate");

      // 4. THE TEACHING CONTEXT IS NAMED, AND NEITHER VISIBILITY NOR AUTHORITY
      //    IS CLAIMED (§D-1, §D-2, and the ruling that superseded the r2 text).
      const lingkup = [t("tur.pg.1.isi", "educator", { locale: "id" }), t("tur.pg.2.judul", "educator", { locale: "id" })];
      const lingkupEn = [t("tur.pg.1.isi", "educator", { locale: "en" }), t("tur.pg.2.judul", "educator", { locale: "en" })];
      c.expect(lingkup.every((s) => /lingkup mengajar/.test(s)),
        "the educator's context wording no longer names the teaching scope");
      c.expect(lingkupEn.every((s) => /teaching context/.test(s)),
        "the educator's English context wording no longer names the teaching context");
      const KLAIM = /bisa Anda lihat|you (can|may) see|boleh Anda|you are allowed|izin|permission|akses/i;
      for (const s of [...lingkup, ...lingkupEn]) {
        c.expect(!KLAIM.test(s), `the educator's context wording claims visibility or authority: "${s}"`);
      }

      // 5. THE COUNTS ARE COUNTS. The educator's "what's open now" step must
      //    keep saying so, because the numbers beside it are row counts.
      const pg3 = LOCALES.map((loc) => t("tur.pg.3.isi", "educator", { locale: loc }));
      c.expect(pg3.every((s) => /hitungan, bukan penilaian|counts, not judgments/i.test(s)),
        "the educator's running-assessments step no longer says the numbers are counts");

      // 6. NOBODY IS ADDRESSED INFORMALLY, in either persona. The Slice-0 sweep
      //    covers learner and public tellings; the educator's are only covered
      //    here, and the tour has plenty of them.
      for (const r of semua) {
        if (r.loc !== "id") continue;
        const hits = informal(r.text);
        c.expect(hits.length === 0,
          `${r.k}/${r.p} addresses the reader informally (${hits.join(", ")}): "${r.text.slice(0, 80)}"`);
      }

      // ADVERSARIAL PLANTS: both sweeps must see what they forbid.
      const palsu = "Kuis Cepat dari guru muncul di sini.";
      c.expect(TERLARANG.some(([re]) => re.test(palsu)), "the retired-term sweep does not catch Kuis Cepat");
      c.expect(informal("Jawabanmu tersimpan.").length === 1, "the informality sweep does not catch a clitic");
      c.expect(informal("Ilmu yang Anda ajarkan.").length === 0, "the informality sweep calls `ilmu` a clitic");

      c.note(`${turKeys.length} tour key(s), ${dipakai.size} rendered, ${semua.length} telling(s) swept, ` +
        `${bisaKosong.size} empty-capable anchor(s) and ${anchorAda.size} anchor(s) read from the surfaces, 3 plants`);
      return c.verdict(
        "the tour's copy is the approved copy, complete and clean: every key the four tours render is declared and " +
        "carries a real telling in both languages, every anchor a step points at exists on a real surface, and a step " +
        "carries empty-state wording exactly when the landing it points at can report that anchor empty — both read " +
        "from the pages rather than listed — no telling in either language for either persona uses a retired term, an " +
        "informal second person or a database word — every sweep watched on a plant, including one the clitic rule " +
        "must NOT fire on — the canonical Uji Cepat, Quick " +
        "Assessment, Uji Penguasaan and Mastery Check all appear, the certificate step promises nothing while V-6a " +
        "is open, the Quick Assessment step keeps the ruling's evidence sentence, the educator's context wording " +
        "names a teaching context and claims neither visibility nor authority, and the counts are still called counts",
      );
    },
  },

  {
    id: "UX1-TUR-AKSES-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const dir = join(repoRoot, "src", "components", "tur");
      const turSrc = readFileSync(join(dir, "Tur.tsx"), "utf8");
      const kartu = code(turSrc);

      // 1. IT IS A DIALOG, AND IT SAYS SO.
      for (const [re, apa] of [
        [/role="dialog"/, "role=dialog"],
        [/aria-modal="true"/, "aria-modal"],
        [/aria-labelledby="pin-tur-judul"/, "a label pointing at the headline"],
        [/aria-describedby="pin-tur-isi"/, "a description pointing at the body"],
      ] as Array<[RegExp, string]>) {
        c.expect(re.test(kartu), `the tour card has no ${apa}`);
      }

      // 2. THE PAGE BEHIND IS INERT, AND GETS ITSELF BACK. An attribute that is
      //    set and never removed is a page nobody can use again.
      c.expect(/setAttribute\("inert", ""\)/.test(kartu), "the page behind the tour is never made inert");
      c.expect(/removeAttribute\("inert"\)/.test(kartu), "the page behind the tour never gets its interactivity back");
      c.expect(/if \(saudara === simpul \|\| saudara\.hasAttribute\("inert"\)\) continue;/.test(kartu),
        "the inert sweep does not skip the tour's own root, or clobbers an element that was already inert");
      // What was there before is RESTORED, not removed: an element that carried
      // `aria-hidden` for a reason of its own gets that reason back, and only an
      // element that had none loses it.
      c.expect(/getAttribute\("aria-hidden"\)/.test(kartu),
        "the sweep never records what aria-hidden it is about to overwrite");
      c.expect(/if \(sembunyi === null\) el\.removeAttribute\("aria-hidden"\);[\s\S]{0,80}else el\.setAttribute\("aria-hidden", sembunyi\);/.test(kartu),
        "the sweep gives back no aria-hidden it overwrote, so an element that had one loses it");

      // 3. FOCUS. On open and on every step it lands on the headline, so the
      //    step is read in the order it is written.
      c.expect(/judulRef\.current\?\.focus\(\)/.test(kartu), "focus never moves to the step's headline");
      c.expect(/\}, \[aktif, indeks\]\);/.test(kartu), "focus does not follow the step");
      c.expect(/tabIndex=\{-1\}/.test(kartu), "the headline cannot receive focus");
      // A heading is not focusable by default, so `focus()` on one is a call
      // that quietly does nothing and drops the reader at the top of the
      // document. It is made focusable-by-script first.
      c.expect(/document\.querySelector\("main h1"\)/.test(kartu),
        "focus has nowhere to go after a tour that arrived uninvited");
      c.expect(/judulHalaman\.tabIndex = -1;[\s\S]{0,60}judulHalaman\.focus\(\);/.test(kartu),
        "the page heading is focused without being made focusable, so the call does nothing");

      // 4. TAB ORDER IS DOM ORDER: language, Skip, checkbox, Back, Next.
      //    Nothing is given a tabindex to force it, so the order the reader
      //    gets is the order the card is written in — which is the only kind
      //    that survives somebody editing the card.
      const urutan = ["bahasa.en", "tur.lewati", "tur.jangan", "tur.kembali", "tur.berikutnya"];
      /** Whether these markers appear in this text in this order. */
      function berurutan(teks: string, kunci: string[]): boolean {
        let sebelum = -1;
        for (const k of kunci) {
          const p = teks.indexOf(k);
          if (p <= sebelum) return false;
          sebelum = p;
        }
        return true;
      }
      c.expect(berurutan(kartu, urutan),
        `the tour card is not written in the approved tab order: ${urutan.join(" → ")}`);
      c.expect(!/tabIndex=\{[0-9]/.test(kartu), "a control is given a positive tabindex to force its place");
      // ADVERSARIAL PLANT: the same reading, on a card whose footer puts the
      // checkbox after the buttons, must refuse it.
      const benar = 'a {s("bahasa.en")} b {s("tur.lewati")} c {s("tur.jangan")} d {s("tur.kembali")} e {s("tur.berikutnya")}';
      const ditanam = 'a {s("bahasa.en")} b {s("tur.lewati")} c {s("tur.kembali")} d {s("tur.berikutnya")} e {s("tur.jangan")}';
      c.expect(berurutan(benar, urutan), "the tab-order reading refuses a card that is in order");
      c.expect(!berurutan(ditanam, urutan), "the tab-order reading accepts a checkbox moved after the buttons");

      // 5. EVERY CONTROL IS NATIVE, AND THE WAY OUT IS IN WORDS.
      const semuaTur = walk(dir).filter((f) => /\.tsx$/.test(f));
      for (const f of semuaTur) {
        const rel = relative(repoRoot, f).replace(/\\/g, "/");
        const src = code(readFileSync(f, "utf8"));
        const palsu = /<div[^>]*onClick|<span[^>]*onClick|role="button"/.exec(src);
        c.expect(palsu === null, `${rel} makes a control out of something that is not one: ${palsu?.[0]}`);
        for (const m of src.matchAll(/<button\b([^>]*)>/g)) {
          c.expect(/type="button"|type="submit"/.test(m[1]), `${rel} has a button with no explicit type`);
        }
      }
      c.expect(/\{s\("tur\.lewati"\)\}/.test(kartu), "the way out of the tour is not labelled in words");
      const panel = code(readFileSync(join(dir, "PanelBantuan.tsx"), "utf8"));
      c.expect(/\{s\("tur\.tutup"\)\}/.test(panel), "the way out of the Help panel is not labelled in words");
      // AND FOCUS COMES BACK. A panel that closes and leaves focus nowhere
      // drops a keyboard reader at the top of the document, and so does a
      // replay started from a panel row that then stops existing.
      c.expect(/return \(\) => \{[\s\S]{0,200}data-tur="bantuan"[\s\S]{0,120}\.focus\(\)/.test(panel),
        "closing the Help panel leaves focus nowhere");
      c.expect(/sebelumnya\.current = document\.querySelector\('\[data-tur="bantuan"\]'\)/.test(kartu),
        "a replay started from Help has nowhere to return focus to when the tour closes");

      // 6. PROGRESS IS ANNOUNCED IN WORDS; the dots are a picture of it.
      c.expect(/className="pin-sr"[\s\S]{0,200}tur\.langkah[\s\S]{0,120}tur\.dari/.test(kartu),
        "the step number is not announced as words");
      c.expect(/className="pin-tur-titik" aria-hidden="true"/.test(kartu), "the position dots are not hidden from a screen reader");
      c.expect(/className="pin-num pin-tur-hitung" aria-hidden="true"/.test(kartu),
        "the visible count is announced a second time");

      // 7. MINIATURES CARRY NO MEANING OF THEIR OWN, so they are hidden and
      //    carry no words that a reader could be asked to rely on.
      const mini = readFileSync(join(dir, "Miniatur.tsx"), "utf8");
      c.expect(/aria-hidden="true"/.test(mini), "the miniatures are not hidden from a screen reader");
      const kunciMini = [...code(mini).matchAll(/\bt\(\s*"([^"]+)"/g)].map((m) => m[1]);
      c.expect(kunciMini.length === 1 && kunciMini[0] === "tur.contoh",
        `the miniature frame renders ${kunciMini.length} copy key(s); it is labelled "Contoh / Example" and nothing else`);
      // A MINIATURE CARRIES NO WORDS OF ITS OWN. Everything it draws is
      // geometry, because anything it said would be either a real person's data
      // or a sentence nobody approved — the design's 132 strings do not include
      // one. Checked by classifying EVERY string literal in the file: a class
      // list, one of the declared kinds, or the three arguments the one copy
      // call takes. Anything else is copy somebody added.
      const KIND = ["spine", "peta", "soal", "pelajaran", "hasil", "cepat", "sedia", "bukti"];
      const SAH = new Set(["use client", "tur.contoh", "learner", "true", ...KIND]);
      const asing = [...code(mini).matchAll(/"([^"]*)"/g)]
        .map((m) => m[1])
        .filter((v) => !SAH.has(v) && !/^pin-[a-z-]+( pin-[a-z-]+)*$/.test(v) && !v.startsWith("@/"));
      c.expect(asing.length === 0, `a miniature carries words of its own: ${asing.join(" / ")}`);
      // ADVERSARIAL PLANT: the classifier must not wave through a sentence.
      const ditanamMini = ['"pin-mini-bar"', '"Pemetaan Awal bukan ujian."'].map((q) => q.slice(1, -1))
        .filter((v) => !SAH.has(v) && !/^pin-[a-z-]+( pin-[a-z-]+)*$/.test(v));
      c.expect(ditanamMini.length === 1, "the miniature classifier does not catch a planted sentence");

      c.note(`${semuaTur.length} tour component(s), ${urutan.length} control(s) in tab order, ` +
        `${kunciMini.length} copy key in the miniatures, 3 plants`);
      return c.verdict(
        "the tour is a dialog a keyboard and a screen reader can use: it declares role, modality, its label and its " +
        "description, the page behind it is made inert and gets both inert and aria-hidden back, focus lands on the " +
        "headline on open and follows every step and has somewhere to go on close, the DOM gives the approved tab " +
        "order of language, Skip, checkbox, Back and Next with no tabindex forcing it — the reading watched on a card " +
        "whose footer puts the checkbox last — every control is a native button with an explicit type and no div " +
        "pretending to be one, both ways out are labelled in words, the step number is announced as words while the " +
        "dots and the visible count are hidden, and the miniatures are hidden and every string literal in them is a " +
        "class list, a declared kind or the frame's own label, with a planted sentence watched to be caught",
      );
    },
  },

  {
    id: "UX1-TUR-TUNTUN-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const css = readFileSync(join(repoRoot, "src", "app", "experience.css"), "utf8");
      const mulai = css.indexOf("UX-1 · GUIDANCE MODE");
      c.expect(mulai > 0, "the guidance stylesheet is not in the Experience composition");
      // BOUNDED TO ITS OWN BLOCK. This used to slice to the end of the file,
      // which was correct only while the guidance block WAS the end of it. The
      // sign-in screen was appended after it and every rule on that screen
      // started being judged by the tour's rules -- a status colour on a
      // sign-in error is not a status colour inside instruction. A scan whose
      // scope is "everything after my heading" is a scan that annexes whatever
      // is written next.
      const sesudah = css.indexOf("\n/* ═", mulai + 1);
      const blok = sesudah > 0 ? css.slice(mulai, sesudah) : css.slice(mulai);
      c.expect(sesudah > 0,
        "the guidance block is the last thing in the stylesheet, so this scan cannot prove it is bounded");
      const aturan = [...blok.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({ sel: m[1].trim(), body: m[2] }));
      c.expect(aturan.length > 30, `only ${aturan.length} guidance rule(s); the surface is bigger than that`);

      // 1. GUIDANCE MODE IS EXACTLY TWO STATES, and the environment it paints
      //    is reached only through them. Sauron's ruling reserves the colour
      //    away from success, correctness, evidence and authorization, so the
      //    one rule that repaints the page must be behind the mode's own class.
      const ground = aturan.filter((r) => /background:\s*var\(--pintar-primary-soft\)/.test(r.body));
      for (const r of ground) {
        const sah = /\.pin-tuntun\b/.test(r.sel) || /\.pin-bantuan\b/.test(r.sel) || /\.pin-mini-pilih\b/.test(r.sel);
        c.expect(sah, `${r.sel} paints the guidance ground outside a tour, Help or a selection`);
      }
      c.expect(ground.some((r) => /html\.pin-tuntun body/.test(r.sel)),
        "nothing repaints the page canvas when the mode is on");
      const turSrc = code(readFileSync(join(repoRoot, "src", "components", "tur", "Tur.tsx"), "utf8"));
      c.expect(/if \(!aktif && !bantuan\) return;[\s\S]{0,200}classList\.add\("pin-tuntun"\)/.test(turSrc),
        "the guidance class is applied outside the two states that are the mode");
      c.expect(/classList\.remove\("pin-tuntun"\)/.test(turSrc), "the guidance class is never taken off again");

      // 2. THE MODE IS NEVER A STATUS. No status token appears anywhere in the
      //    guidance surface: not for a result, not for a correct answer, not
      //    for evidence being sufficient, not for permission.
      for (const r of aturan) {
        const m = /var\(--status-[a-z-]+\)/.exec(r.body);
        c.expect(m === null, `${r.sel} carries a status colour inside instruction: ${m?.[0]}`);
      }
      // ADVERSARIAL PLANT: the sweep must catch one.
      c.expect(/var\(--status-[a-z-]+\)/.test("background: var(--status-ok-soft);"),
        "the status-colour sweep does not catch a status token");

      // 3. THE TIP IS NOT THE MODE (§O-5). One white card on the page exactly
      //    as it was: no soft green, no veil, no repainted ground.
      const tip = aturan.filter((r) => /^\.pin-tip/.test(r.sel));
      c.expect(tip.length >= 2, "the tip has no rules of its own");
      for (const r of tip) {
        c.expect(!/primary-soft/.test(r.body), `${r.sel} paints the tip with the guidance colour`);
      }

      // 4. THE HIGHLIGHT IS A CUT-OUT PLUS A RING, and the ring's geometry is
      //    the approved one: 3px of white, then 2px of primary (§K-5).
      const sorot = aturan.find((r) => r.sel.includes(".pin-tur-sorot"));
      c.expect(Boolean(sorot), "the spotlight has no rule");
      const bayang = /box-shadow:([^;]*);/.exec(sorot?.body ?? "")?.[1] ?? "";
      c.expect(/0 0 0 3px var\(--surface-1\)/.test(bayang), "the spotlight has no 3px white gap");
      c.expect(/0 0 0 5px var\(--pintar-primary\)/.test(bayang),
        "the spotlight's primary ring is not 2px outside the white gap");
      c.expect(/color-mix\(in srgb, var\(--pintar-primary-soft\) 72%, transparent\)/.test(bayang),
        "the veil is not the ruled composite of primary-soft");
      c.expect(/pointer-events:\s*none/.test(sorot?.body ?? ""), "the spotlight swallows pointer events");

      // 5. THE PHONE SHEET IS CAPPED AND SCROLLS; nothing truncates and type
      //    never shrinks (§J-15, §K-8).
      const telepon = blok.slice(blok.indexOf("@media (max-width: 560px)"));
      c.expect(/max-height:\s*var\(--guide-sheet-max\)/.test(telepon), "the phone sheet has no ceiling");
      c.expect(/overflow:\s*auto/.test(telepon), "the phone sheet does not scroll its own content");
      c.expect(/\.pin-tur-kaki \{ position: sticky/.test(telepon), "the phone sheet's buttons are not pinned");
      c.expect(!/text-overflow|ellipsis/.test(blok), "something in the guidance surface truncates its text");
      // The room the sheet borrows is given back.
      c.expect(/document\.body\.style\.paddingBottom = ""/.test(turSrc),
        "the room the phone sheet borrows at the bottom of the page is never returned");

      // 6. THE CARD NEVER COVERS EVALUATION MODE'S BANNER (§J-11). The banner
      //    is a property of the session and cannot be dismissed (ADR-0020), so
      //    a card placed over it would be hiding the one thing that says who
      //    the reader is currently acting as. It is a closed surface this work
      //    may not mark, so the ceiling is found by position — and the check
      //    confirms the assumption that makes that work: the banner really is
      //    rendered above the Experience shell, in the root layout.
      c.expect(/function atap\(\)/.test(turSrc), "the tour card has no ceiling to keep clear of");
      c.expect(/header\.pin-top"\);[\s\S]{0,120}previousElementSibling/.test(turSrc),
        "the ceiling is not taken from whatever renders above the Experience shell");
      const layout = code(readFileSync(join(repoRoot, "src", "app", "layout.tsx"), "utf8"));
      const urutanLayout = layout.indexOf("<EvaluationBanner />") < layout.indexOf("{children}");
      c.expect(layout.includes("<EvaluationBanner />") && urutanLayout,
        "the evaluation banner no longer renders above the page, so the ceiling looks at the wrong element");
      const banner = code(readFileSync(join(repoRoot, "src", "app", "_evaluation-banner.tsx"), "utf8"));
      c.expect(!/position:\s*fixed|\bfixed\b/.test(banner),
        "the evaluation banner is now fixed, and a ceiling measured from the flow would be wrong");

      // 7. NOTHING ANIMATES MEANING, and the one movement there is respects the
      //    reader's own setting.
      c.expect(!/transition:|animation:/.test(blok), "something in the guidance surface animates");
      c.expect(/prefers-reduced-motion: reduce/.test(turSrc),
        "the tour's scrolling ignores a reader who asked for no motion");

      c.note(`${aturan.length} guidance rule(s), ${ground.length} ground(s), ${tip.length} tip rule(s), 1 plant caught`);
      return c.verdict(
        "Guidance Mode is exactly the two states Sauron ruled it to be: the class that repaints the page is applied " +
        "only while a tour is running or Help is open and is always taken off again, the guidance ground appears on " +
        "no other rule, no status colour appears anywhere inside instruction — the sweep watched on a plant — the " +
        "tip carries none of the mode at all, the highlight is a cut-out with the approved 3px white gap and 2px " +
        "primary ring over the ruled composite veil, the phone sheet is capped and scrolls with its buttons pinned " +
        "and gives back the room it borrows, the card keeps clear of whatever renders above the Experience shell so " +
        "it cannot cover Evaluation Mode's non-dismissible banner — with the layout and the banner both read to " +
        "confirm the assumption that makes that ceiling correct — and nothing animates",
      );
    },
  },

  // ════════════════════════════════════════════ UX-1 · THE SIGN-IN SCREEN
  {
    id: "UX1-MASUK-KONTRAK-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const files = [
        "src/app/masuk/page.tsx", "src/app/masuk/actions.ts",
        "src/app/auth/callback/page.tsx", "src/app/auth/callback/actions.ts",
        ...walk(join(repoRoot, "src", "components", "masuk")).map((f) => relative(repoRoot, f).replace(/\\/g, "/")),
      ].filter((f) => /\.tsx?$/.test(f));
      c.expect(files.length >= 8, `only ${files.length} sign-in file(s) found`);

      // 1. THE SCREEN OFFERS THE TWO DOORS THAT EXIST AND NOT ONE MORE. A
      //    sign-in screen that offers a door which is not there is worse than
      //    one that offers fewer doors: the person tries it, it fails, and they
      //    conclude the system is broken rather than that they misread it.
      const TIDAK_ADA: Array<[RegExp, string]> = [
        [/type=["']password["']/, "a password field"],
        [/signUp|resetPasswordForEmail|updateUser\(/, "registration or password recovery"],
        [/signInWithOAuth|\bgoogle\b|\bmicrosoft\b|\bapple\b|\boauth\b/i, "social sign-in"],
        [/\bsso\b|\bsaml\b|webauthn|passkey/i, "SSO or a passkey"],
        [/ingat.?saya|remember.?me/i, "a remember-me control"],
        [/pilih.?institusi|institution.?select|pilih.?peran|role.?select/i, "an institution or role picker"],
      ];
      for (const f of files) {
        // The PIN is the one masked field, and it is a transcription from a
        // card rather than a password somebody chose.
        const src = code(readFileSync(join(repoRoot, f), "utf8"))
          .replace(/type=\{pinTampil \? "text" : "password"\}/g, " ");
        for (const [re, apa] of TIDAK_ADA) {
          const m = re.exec(src);
          c.expect(m === null, `${f} offers ${apa}: ${m?.[0]}`);
        }
      }
      c.expect(TIDAK_ADA.some(([re]) => re.test('<input type="password" name="sandi" />')),
        "the absent-door sweep does not catch a password field");
      c.expect(TIDAK_ADA.some(([re]) => re.test("await supabase.auth.signUp({ email });")),
        "the absent-door sweep does not catch a registration call");

      // 2. `?peran=` IS CARRIED, NOT CONSUMED. The sign-in screen has not met
      //    anyone yet and must not pretend it has, so it selects no wording
      //    from the parameter and no copy key carries a persona override.
      const page = code(readFileSync(join(repoRoot, "src", "app", "masuk", "page.tsx"), "utf8"));
      c.expect(!/sp\.peran\s*===/.test(page), "the sign-in screen branches on ?peran=");
      c.expect(!/persona\s*[:=]/.test(page), "the sign-in screen derives a persona from the query string");
      for (const f of files) {
        const src = code(readFileSync(join(repoRoot, f), "utf8"));
        c.expect(!/t\(\s*"auth\.[a-z_]+"\s*,\s*(?!"public")/.test(src),
          `${f} renders sign-in copy for a persona the screen has not met`);
      }
      // …and it does not survive authentication: nothing in the sign-in or
      // callback path writes it into a destination.
      for (const f of files) {
        const src = code(readFileSync(join(repoRoot, f), "utf8"));
        c.expect(!/peran=\$\{|peran=["'`]\s*\+|set\(["']peran/.test(src),
          `${f} carries ?peran= past the authentication boundary`);
      }

      // 3. L-2 IS INTACT, AND ITS PRIVACY FOLD STILL COMES FIRST. The order
      //    matters: an address nobody has must be reported as sent even when
      //    it is also being throttled, or the throttle becomes the oracle.
      const aksi = code(readFileSync(join(repoRoot, "src", "app", "masuk", "actions.ts"), "utf8"));
      c.expect(/shouldCreateUser:\s*false/.test(aksi), "an unknown address can create an identity again");
      const iFold = aksi.indexOf("tidakTerdaftar(error)");
      const iRate = aksi.indexOf("terlaluSering(error)");
      c.expect(iFold > 0 && iRate > 0 && iFold < iRate,
        "the rate-limit branch is reached before the privacy fold, so a throttle can distinguish a known address");

      // 4. S6 — SUPPRESSED BY SECURITY RULING (D2, Sauron, 2026-09-18).
      //
      //    The handoff specified a held-resend surface conditional on the
      //    provider exposing a distinguishable rate-limit condition. It does
      //    expose one, so it was built — and then implementation verification
      //    established what §7.4 of the handoff records it could not know:
      //    with `shouldCreateUser: false` an UNKNOWN address never reaches the
      //    provider's throttle, so a held resend could only ever mean "this
      //    address is real". Two presses separated a provisioned address from
      //    an unknown one, which is the enumeration boundary the conditional
      //    confirmation exists to close.
      //
      //    So there is no held state, and there is no policy in its place.
      for (const f of files) {
        const src = code(readFileSync(join(repoRoot, f), "utf8"));
        const m = /setInterval|countdown|hitung.?mundur|cooldown|retry.?after|jeda.?detik|\bdetik\b/i.exec(src);
        c.expect(m === null, `${f} invents a resend policy: ${m?.[0]}`);
      }
      // The outcome set has no member meaning "held", so no surface can render
      // one however it is written.
      const hasilKirim = /export type HasilKirim = ([^;]+);/.exec(aksi)?.[1] ?? "";
      c.expect(/"terkirim"/.test(hasilKirim) && !/ditahan|held|throttl/i.test(hasilKirim),
        `the send outcome set can still express a held resend: ${hasilKirim}`);
      // The rate-limit condition is still RECOGNISED — folded into the ordinary
      // outcome rather than ignored, so a throttle is never mistaken for a
      // transport failure and reported as S7, which would put the
      // distinguishable state back through the other door.
      c.expect(/tidakTerdaftar\(error\) \|\| terlaluSering\(error\)\) return "terkirim";/.test(aksi),
        "a throttled send no longer folds into the same answer an unknown address gets");
      c.expect(/over_email_send_rate_limit|over_request_rate_limit/.test(aksi),
        "the throttle is no longer recognised at all, so it will be reported as a transport failure instead");
      // And its copy is gone from the table: a suppressed state's copy sitting
      // there is an invitation to wire it back.
      // `tahan` is matched as a whole key SEGMENT rather than as a substring.
      // As a substring it also caught WP7C's `umpanbalik.keadaan.ditahan` — a
      // withheld feedback result, which has nothing to do with a held resend
      // and would have had to be renamed to satisfy a guard about the sign-in
      // screen. The rule is unchanged and is now about the thing it names:
      // `tahan`, `masuk.tahan` and `auth_tahan_kirim` all still fail.
      c.expect(!allKeys().some((k) => /auth\.cool|cooldown|(?:^|[._])tahan(?:[._]|$)/.test(k)),
        "the held-resend copy is still declared");
      c.expect(/(?:^|[._])tahan(?:[._]|$)/.test("auth.tahan"),
        "the held-resend detector no longer catches the copy it exists to refuse");
      c.expect(!/(?:^|[._])tahan(?:[._]|$)/.test("umpanbalik.keadaan.ditahan"),
        "the held-resend detector still catches an unrelated key that merely contains the word");

      // 5. A CLIENT THAT NEVER STARTED DOES NOT DRAW AN OPERATIONAL FORM.
      //    The JavaScript dependency is accepted; a control that looks live and
      //    silently is not is the failure that is not.
      const siap = code(readFileSync(join(repoRoot, "src", "components", "masuk", "siap.ts"), "utf8"));
      c.expect(/useSyncExternalStore\([^)]*\(\) => true, \(\) => false\)/.test(siap.replace(/\s+/g, " ")),
        "the readiness signal does not report false on the server and true once hydrated");
      const layarSrc = code(readFileSync(join(repoRoot, "src", "components", "masuk", "LayarMasuk.tsx"), "utf8"));
      const gerbang = [...layarSrc.matchAll(/disabled=\{!siap/g)].length;
      c.expect(gerbang >= 5,
        `${gerbang} actionable control(s) held until the client starts; the sign-in surfaces have more than that`);
      c.expect(/role="status">\{s\("auth\.belum_siap"\)\}/.test(layarSrc),
        "a control is held unavailable with no reason given");
      const tukarSrc = code(readFileSync(join(repoRoot, "src", "components", "masuk", "TukarTautan.tsx"), "utf8"));
      c.expect(/s\(siap \? "auth\.link_p_exch" : "auth\.belum_siap"\)/.test(tukarSrc),
        "the callback claims an exchange is in flight when no client started one");

      c.note(`${files.length} sign-in file(s), ${TIDAK_ADA.length} absent door(s), ` +
        `${gerbang} control(s) gated on client readiness, 2 plants caught`);
      return c.verdict(
        "the sign-in screen offers exactly the two doors the contract has: no password field, no registration, no " +
        "recovery, no social sign-in, no SSO, no passkey, no institution or role picker and no remember-me appear " +
        "in any of its source files — both sweeps watched on plants — `?peran=` is neither branched on nor rendered " +
        "for a persona the screen has not met and never survives the authentication boundary, L-2's " +
        "shouldCreateUser:false is intact with its privacy fold still ordered ahead of the rate-limit branch, and " +
        "S6 is SUPPRESSED BY SECURITY RULING (D2) and cannot return: the send outcome set has no member meaning " +
        "held, the throttle is still recognised so it can be folded into the same answer an unknown address gets " +
        "rather than mistaken for a transport failure, its copy is gone from the table, and no timer, countdown, " +
        "cooldown or retry-after exists anywhere in the surface. A client that never started holds every actionable " +
        "control and says why, on both the sign-in surfaces and the callback, so nothing is ever drawn operational " +
        "while silently doing nothing",
      );
    },
  },

  {
    id: "UX1-MASUK-PRIVASI-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const aksi = code(readFileSync(join(repoRoot, "src", "app", "masuk", "actions.ts"), "utf8"));
      const layar = code(readFileSync(join(repoRoot, "src", "components", "masuk", "LayarMasuk.tsx"), "utf8"));

      // 1. AN UNKNOWN ADDRESS PRODUCES THE SENT SCREEN, NOT AN ERROR.
      // One answer covers three cases: a clean send, an address nobody has
      // (L-2), and a send the provider refused as too soon (D2). Any of the
      // three reaching a different surface is an oracle.
      c.expect(/if \(!error \|\| tidakTerdaftar\(error\) \|\| terlaluSering\(error\)\) return "terkirim";/.test(aksi),
        "a clean send, an unknown address and a throttled send no longer produce the same outcome");
      c.expect(!/exists|terdaftar\?|cek.?email|lookup/i.test(aksi.replace(/tidakTerdaftar/g, "")),
        "the send path asks whether an address exists before sending, which rebuilds the oracle a round-trip earlier");
      // There is no outcome that means "no such account".
      const hasil = /export type HasilKirim = ([^;]+);/.exec(aksi)?.[1] ?? "";
      c.expect(/terkirim/.test(hasil) && !/tidak.?ada|unknown|not.?found/i.test(hasil),
        `the send outcome set names an unknown address: ${hasil}`);

      // 2. THE CONFIRMATION IS CONDITIONAL, IN BOTH LANGUAGES. This is the
      //    account-enumeration protection and it costs one word.
      c.expect(/^Jika alamat itu terhubung/.test(t("auth.link_sent", "public", { locale: "id" })),
        "the Indonesian confirmation no longer opens with the conditional");
      c.expect(/^If that address is linked/.test(t("auth.link_sent", "public", { locale: "en" })),
        "the English confirmation no longer opens with the conditional");
      for (const loc of LOCALES) {
        const s = t("auth.link_sent", "public", { locale: loc });
        c.expect(!/@/.test(s), `the confirmation echoes an address back in ${loc}`);
      }

      // 3. ONE FAILURE FOR EVERY CARD REFUSAL, on screen AND in the
      //    accessibility tree. Marking only the PIN invalid tells a
      //    screen-reader user the card number was accepted — precisely the
      //    fact the visible copy is written to withhold.
      c.expect(/if \(error\) return "gagal";/.test(aksi), "the card path no longer collapses every refusal to one value");
      const invalid = [...layar.matchAll(/aria-invalid=\{layar\.salah \? "true" : undefined\}/g)].length;
      c.expect(invalid === 2, `${invalid} card field(s) marked invalid; both must be, or the tree names the wrong one`);
      const described = [...layar.matchAll(/aria-describedby=\{layar\.salah \? "kartu-err" : undefined\}/g)].length;
      c.expect(described === 2, `${described} card field(s) point at the shared message; both must`);
      c.expect((layar.match(/id="kartu-err"/g) ?? []).length === 1, "there is not exactly one card message to point at");
      for (const loc of LOCALES) {
        const s = t("auth.card_failed", "public", { locale: loc });
        c.expect(!/PIN|nomor kartu|card number/i.test(s) || /dan|and/.test(s),
          `the card failure names one credential in ${loc}: "${s}"`);
      }
      // "belum" is NOT YET, not wrong: the card may be fine and the PIN
      // mistyped, and the screen does not know which.
      c.expect(/^Belum cocok\./.test(t("auth.card_failed", "public", { locale: "id" })),
        "the card failure no longer opens with `Belum`, which is what makes it a not-yet rather than an accusation");

      // 4. THE SCREEN DOES NOT NAME A SIGNED-IN PERSON (S15). A shared device
      //    shows that surface to whoever is holding it.
      const page = code(readFileSync(join(repoRoot, "src", "app", "masuk", "page.tsx"), "utf8"));
      c.expect(!/displayName|viewer\.nama|\bnama\b/.test(page),
        "the already-signed-in surface names the person, disclosing them to the next person in the queue");
      c.expect(/viewer \?/.test(page), "the sign-in screen no longer detects an existing session");

      // ADVERSARIAL PLANTS.
      c.expect(!/if \(!error\) return "terkirim";\s*$/m.test(aksi),
        "the send path reports an unknown address as a failure");
      const ditanam = layar.replace(/aria-invalid=\{layar\.salah \? "true" : undefined\}/, "PLANTED");
      c.expect([...ditanam.matchAll(/aria-invalid=\{layar\.salah \? "true" : undefined\}/g)].length === 1,
        "the both-fields-invalid count does not notice a field losing its marking");

      c.note("4 privacy propert(ies), 2 language(s), 2 plants");
      return c.verdict(
        "nothing on the sign-in screen distinguishes an unknown address from a sent link, or a bad card number from " +
        "a bad PIN: the send path reports an unregistered address as the ordinary outcome and asks no question " +
        "beforehand that would rebuild the oracle, its outcome set has no name for `no such account`, the " +
        "confirmation is conditional in both languages and echoes no address back, every card refusal collapses to " +
        "one value with BOTH fields marked invalid against ONE message — watched on a plant — the failure copy " +
        "accuses neither credential, and the already-signed-in surface names nobody",
      );
    },
  },

  {
    id: "UX1-MASUK-TUJUAN-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();

      // 1. BOB'S HELPER IS UNTOUCHED. The login work passes a different
      //    fallback; it does not change what the contract accepts.
      const helper = readFileSync(join(repoRoot, "src", "lib", "tujuan.ts"), "utf8");
      const digest = createHash("sha256").update(helper).digest("hex");
      c.expect(digest === TUJUAN_SHA,
        `src/lib/tujuan.ts changed (${digest.slice(0, 16)}…). The destination contract is frozen input; ` +
        "a login change that needed it altered would be a login change that had gone wrong");
      c.expect(/fallback = "\/"/.test(helper), "the helper no longer takes a caller-supplied fallback");

      // 2. THE FALLBACK IS THE ROLE'S HOME (§7.3), and it is passed as the
      //    helper's own parameter rather than decided after it.
      const aksi = code(readFileSync(join(repoRoot, "src", "app", "masuk", "actions.ts"), "utf8"));
      c.expect(/tujuanInternal\(raw, berandaPeran\(viewer\?\.displayRole \?\? null\)\)/.test(aksi),
        "the post-authentication destination does not fall back to the role's home through the helper's own parameter");
      // A refused destination is not an error the person never chose.
      for (const f of ["src/app/masuk/actions.ts", "src/app/auth/callback/page.tsx", "src/components/masuk/TukarTautan.tsx"]) {
        const src = code(readFileSync(join(repoRoot, f), "utf8"));
        c.expect(!/tujuan.*(gagal|ditolak|invalid)|destination.*(refused|not permitted)/i.test(src),
          `${f} tells the person their destination was refused`);
      }

      // 3. D1 — A FRESH LINK DOES NOT INHERIT THE EXPIRED ONE'S DESTINATION.
      const tukar = code(readFileSync(join(repoRoot, "src", "components", "masuk", "TukarTautan.tsx"), "utf8"));
      const tombol = /href="([^"]*)"/.exec(tukar)?.[1];
      c.expect(tombol === "/masuk",
        `the ask-for-a-new-link control goes to "${tombol}"; it must carry no destination across a failed exchange`);
      c.expect(!/lanjut=\$\{lanjut\}|lanjut=\$\{/.test(tukar),
        "the ask-for-a-new-link control carries the stale destination forward");

      // 4. THE ROLE HOME ITSELF, and it names only routes that exist.
      const TABEL: Array<[Parameters<typeof berandaPeran>[0], string]> = [
        ["STUDENT", "/belajar"],
        ["EDUCATOR", "/mengajar"],
        ["INSTITUTION_ADMIN", "/konfigurasi"],
        ["SYSTEM_ADMIN", "/konfigurasi"],
        // WP4 gave both Management roles a home. They are NOT sent to
        // `/konfigurasi` with the administrators: `management_scope_over_node`
        // refuses INSTITUTION_ADMIN and SYSTEM_ADMIN by name, so the two sets
        // of roles land in two different places on purpose.
        ["HEAD_OF_DEPARTMENT", "/pimpinan"],
        ["DEAN", "/pimpinan"],
        [null, "/"],
      ];
      for (const [peran, rumah] of TABEL) {
        c.expect(berandaPeran(peran) === rumah,
          `${peran ?? "no role"} is sent to ${berandaPeran(peran)} rather than ${rumah}`);
      }
      for (const [, rumah] of TABEL) {
        const ada = rumah === "/"
          || existsSync(join(repoRoot, "src", "app", rumah.slice(1), "page.tsx"));
        c.expect(ada, `the role home ${rumah} is not a route that exists`);
      }
      // It decides a door, never an authority.
      const beranda = code(readFileSync(join(repoRoot, "src", "lib", "beranda.ts"), "utf8"));
      c.expect(!/can_on_node|has_scope|capability|rpc\(/.test(beranda),
        "the role-home map reaches for an authorization primitive");

      c.note(`helper digest verified, ${TABEL.length} role(s) mapped, all to routes that exist`);
      return c.verdict(
        "the destination contract is frozen input and is verified byte-for-byte unchanged by digest; the login work " +
        "supplies the role's home as the helper's OWN fallback parameter rather than deciding anything after it; a " +
        "refused destination is never surfaced as an error about a thing the person did not choose; a link asked for " +
        "after an expired one carries no destination at all, as D1 rules; and the role-home map sends every role in " +
        "the schema to a route that exists while reaching for no authorization primitive",
      );
    },
  },

  {
    id: "UX1-MASUK-AKSES-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const dir = join(repoRoot, "src", "components", "masuk");
      const layar = code(readFileSync(join(dir, "LayarMasuk.tsx"), "utf8"));
      const tukar = code(readFileSync(join(dir, "TukarTautan.tsx"), "utf8"));
      const semua = walk(dir).filter((f) => /\.tsx$/.test(f));

      // 1. IN FLIGHT, FIELDS ARE READONLY AND NEVER DISABLED. A disabled field
      //    drops out of the accessibility tree and out of tab order mid-flight,
      //    and the address on screen must still be the address the link went to.
      c.expect(/readOnly=\{layar\.sibuk\}/.test(layar), "no field is held readonly while a request is in flight");
      c.expect(!/disabled=\{layar\.sibuk\}\s*\n?\s*(?:type|inputMode|autoComplete)/.test(layar),
        "a field is disabled rather than readonly in flight");
      c.expect(/aria-busy=\{layar\.sibuk \? "true" : undefined\}/.test(layar), "a busy control does not say so");

      // 2. THE REVEAL IS A LABELLED TOGGLE, and nothing re-masks it.
      c.expect(/aria-pressed=\{pinTampil\}/.test(layar), "the reveal control is not a pressed-state toggle");
      c.expect(/aria-label=\{s\(pinTampil \? "auth\.card_hide" : "auth\.card_show"\)\}/.test(layar),
        "the reveal control does not swap its label with its state");
      const timers = [...layar.matchAll(/setTimeout\(([^;]*?)\)/g)].map((m) => m[0]);
      c.expect(timers.length === 0,
        `the sign-in surface runs a timer: ${timers.join("; ")} — a PIN that re-hides itself while a child is ` +
        "comparing it against a printed card is a small cruelty");

      // 3. FOCUS DESTINATIONS ARE DECLARED IN ONE PLACE, not scattered.
      c.expect(/type Fokus = "judul" \| "email" \| "kirim" \| "kartu" \| null;/.test(layar),
        "the focus destinations are not declared as one set");
      for (const [dari, ke] of [["bentuk", "email"], ["kirim", "kirim"]] as const) {
        c.expect(new RegExp(`salah: "${dari}"[\\s\\S]{0,80}pindahFokus\\("${ke}"\\)`).test(layar),
          `the ${dari} error does not send focus to ${ke}`);
      }
      c.expect(/setLayar\(\{ k: "terkirim" \}\);\s*\n\s*pindahFokus\("judul"\);/.test(layar),
        "the sent surface does not move focus to its heading");
      c.expect(/pindahFokus\("kartu"\)/.test(layar), "the card surface never sends focus to the first field");
      // S6 is suppressed (D2), so the resend path has exactly two outcomes and
      // neither of them is a surface that appears only for a real address.
      const terap = /function terapkanKirim\(hasil: HasilKirim\) \{[\s\S]*?\n  \}/.exec(layar)?.[0] ?? "";
      c.expect(terap.length > 0, "the send-outcome handler cannot be found");
      c.expect((terap.match(/setLayar\(/g) ?? []).length === 2,
        "the send-outcome handler has more than the two surfaces D2 leaves it");
      c.expect(!/ditahan|tahan/.test(terap), "a held-resend branch is back in the send-outcome handler");

      // 4. NO POSITIVE TABINDEX, AND EVERY CONTROL IS NATIVE.
      for (const f of semua) {
        const rel = relative(repoRoot, f).replace(/\\/g, "/");
        const src = code(readFileSync(f, "utf8"));
        c.expect(!/tabIndex=\{[0-9]/.test(src), `${rel} forces a control's place with a positive tabindex`);
        const palsu = /<div[^>]*onClick|<span[^>]*onClick|role="button"/.exec(src);
        c.expect(palsu === null, `${rel} makes a control out of something that is not one: ${palsu?.[0]}`);
        for (const m of src.matchAll(/<button\b([^>]*)>/g)) {
          c.expect(/type="(button|submit)"/.test(m[1]), `${rel} has a button with no explicit type`);
        }
      }

      // 5. THE EXCHANGING SURFACE IS NOT A DEAD END.
      c.expect(/role="status" aria-live="polite"/.test(tukar),
        "the exchanging surface is silent to a screen reader");
      c.expect(/judulRef\.current\?\.focus\(\)/.test(tukar), "the callback surfaces never move focus to their heading");

      // 6. REDUCED MOTION REPLACES THE SPINNER RATHER THAN LEAVING IT SPINNING.
      const css = readFileSync(join(repoRoot, "src", "app", "experience.css"), "utf8");
      // BOUNDED AT THE NEXT BLOCK, not at the end of the file. This sliced to
      // end-of-file until WP5B appended a stylesheet block with an animation in
      // it, at which point a rule belonging to an administrator's progress bar
      // was read as a rule of the sign-in screen and this case went red for a
      // file it does not govern. The tour guard was corrected the same way for
      // the same reason: a section check must end where its section does.
      const mulaiMasuk = css.indexOf("UX-1 · THE SIGN-IN SCREEN");
      const akhirMasuk = css.indexOf("\n/* ═", mulaiMasuk + 1);
      const blok = css.slice(mulaiMasuk, akhirMasuk === -1 ? undefined : akhirMasuk);
      c.expect(blok.length > 500 && (akhirMasuk === -1 || akhirMasuk > mulaiMasuk),
        "the sign-in stylesheet block could not be delimited, so this check reads the wrong rules");
      c.expect(/prefers-reduced-motion: reduce\)\s*\{[\s\S]{0,200}animation: none/.test(blok),
        "the spinner keeps turning for a reader who asked for no motion");
      // and nothing else on the screen animates
      const anim = [...blok.matchAll(/animation:\s*([^;]+);/g)].map((m) => m[1].trim());
      c.expect(anim.every((a) => a === "none" || /pin-putar/.test(a)),
        `something other than the request spinner animates: ${anim.join(", ")}`);

      c.note(`${semua.length} sign-in component(s), ${timers.length} timer(s), focus set declared once`);
      return c.verdict(
        "the sign-in screen is usable by keyboard and screen reader: fields go readonly and never disabled in " +
        "flight so the address stays readable and in tab order, busy controls say so, the PIN reveal is a labelled " +
        "pressed-state toggle that no timer ever undoes — the surface runs no timer at all — every focus " +
        "destination is declared in one named set and moved through one effect, the held-resend state deliberately " +
        "moves focus nowhere, no control is a div and none forces its place with a positive tabindex, the " +
        "exchanging surface is a polite live region that takes focus rather than a dead end, and reduced motion " +
        "stops the only two things that move",
      );
    },
  },

  {
    id: "UX1-MASUK-KATA-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const kunci = allKeys().filter((k) => k.startsWith("auth."));
      c.expect(kunci.length >= 38, `${kunci.length} sign-in copy key(s); the handoff's table has 38`);

      // 1. EVERY KEY THE SCREEN RENDERS IS DECLARED AND COMPLETE.
      const dir = join(repoRoot, "src", "components", "masuk");
      const surfaces = [
        ...walk(dir).filter((f) => /\.tsx$/.test(f)),
        join(repoRoot, "src", "app", "masuk", "page.tsx"),
        join(repoRoot, "src", "app", "auth", "callback", "page.tsx"),
      ];
      const dipakai = new Set<string>();
      for (const f of surfaces) {
        for (const m of code(readFileSync(f, "utf8")).matchAll(/["']((?:auth)\.[a-z0-9_]+)["']/g)) dipakai.add(m[1]);
      }
      c.expect(dipakai.size >= 30, `only ${dipakai.size} sign-in key(s) rendered`);
      for (const k of dipakai) {
        c.expect(kunci.includes(k as HleEvent), `the sign-in screen renders ${k}, which the copy table does not declare`);
        for (const loc of LOCALES) {
          c.expect(t(k as HleEvent, "public", { locale: loc }).trim().length > 0, `${k} has no telling in ${loc}`);
        }
      }

      // 2. NO PARALLEL HARD-CODED PRODUCTION COPY. Every user-visible string on
      //    these surfaces comes through the copy table.
      for (const f of surfaces) {
        const rel = relative(repoRoot, f).replace(/\\/g, "/");
        const src = code(readFileSync(f, "utf8"));
        const teks = [...src.matchAll(/>\s*([A-Za-z][A-Za-z ,.'!?-]{6,})\s*</g)].map((m) => m[1].trim());
        c.expect(teks.length === 0, `${rel} hard-codes user-visible copy: ${teks.join(" / ")}`);
      }

      // 3. THE THREE LOAD-BEARING STRINGS, VERBATIM.
      const VERBATIM: Array<[HleEvent, "id" | "en", string]> = [
        ["auth.link_sent", "id", "Jika alamat itu terhubung dengan akun PINTAR, tautan masuk sudah dikirim ke sana. Buka email, lalu ketuk tautannya."],
        ["auth.link_sent", "en", "If that address is linked to a PINTAR account, a sign-in link has been sent there. Open your email and tap the link."],
        ["auth.card_failed", "id", "Belum cocok. Coba periksa nomor kartu dan PIN, lalu coba sekali lagi."],
        ["auth.card_failed", "en", "Not a match yet. Check the card number and the PIN, then try once more."],
        ["auth.say_p", "id", "PINTAR membantu melihat apa yang sedang terjadi dalam proses belajar. Keputusannya tetap pada manusia."],
        ["auth.say_p", "en", "PINTAR helps make sense of what is happening in the learning process. The decision stays with people."],
      ];
      for (const [k, loc, teks] of VERBATIM) {
        c.expect(t(k, "public", { locale: loc }) === teks,
          `${k}/${loc} is not the approved string:\n  got "${t(k, "public", { locale: loc })}"\n  want "${teks}"`);
      }

      // 4. THE TWO CARD CONTROLS DO NOT SHARE A LABEL. The link that takes you
      //    TO the card form and the button that SUBMITS it read identically in
      //    Indonesian in the previous package; a screen-reader user heard the
      //    same command for two different actions.
      for (const loc of LOCALES) {
        c.expect(t("auth.card_go", "public", { locale: loc }) !== t("auth.card_enter", "public", { locale: loc }),
          `the card route and the card submit share a label in ${loc}`);
      }

      // 5. NO PERSONA OVERRIDE ON ANY SIGN-IN STRING (§1.6): a child with a
      //    card and a head teacher with an email see the same welcome.
      const hle = readFileSync(join(repoRoot, "src", "lib", "hle.ts"), "utf8");
      for (const k of kunci) {
        const baris = new RegExp(`^\\s*"${k.replace(/\./g, "\\.")}":\\s*\\{(.*)$`, "m").exec(hle)?.[1] ?? "";
        c.expect(!/\b(learner|educator|staff|en_learner|en_educator|en_staff)\s*:/.test(baris),
          `${k} carries a persona override, so the sign-in screen words itself for somebody it has not met`);
      }

      // 6. NO INFORMALITY AND NO MACHINERY, in either language.
      for (const k of kunci) {
        const id = t(k as HleEvent, "public", { locale: "id" });
        const hits = informal(id);
        c.expect(hits.length === 0, `${k} addresses the reader informally (${hits.join(", ")})`);
        for (const loc of LOCALES) {
          const s = t(k as HleEvent, "public", { locale: loc });
          c.expect(!/\bRasch\b|\btheta\b|\bOTP\b|\btoken\b|\bJWT\b|supabase/i.test(s),
            `${k}/${loc} names the machinery: "${s}"`);
        }
      }

      // ADVERSARIAL PLANT: the verbatim check must notice an edited string.
      c.expect("Jika alamat itu terhubung dengan akun PINTAR." !== VERBATIM[0][2],
        "the verbatim comparison would accept a shortened conditional");

      c.note(`${kunci.length} sign-in key(s), ${dipakai.size} rendered, ${VERBATIM.length} verbatim string(s)`);
      return c.verdict(
        "the sign-in copy is the approved copy and lives only in the copy table: every key the screen renders is " +
        "declared and carries both languages, no surface hard-codes a user-visible string, the three load-bearing " +
        "strings match the handoff byte for byte, the card route and the card submit no longer share an Indonesian " +
        "label, no sign-in string carries a persona override because the screen has not met anyone yet, and nothing " +
        "in either language is informal or names the machinery",
      );
    },
  },

  // ════════════════════════════════════════════ WP4 · THE MANAGEMENT SURFACE
  {
    id: "UX1-PIMPINAN-LINGKUP-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const files = [
        "src/lib/pimpinan.ts", "src/lib/pimpinan-kontrak.ts", "src/app/pimpinan/actions.ts",
        ...walk(join(repoRoot, "src", "app", "pimpinan")).map((f) => relative(repoRoot, f).replace(/\\/g, "/")),
        ...walk(join(repoRoot, "src", "components", "pimpinan")).map((f) => relative(repoRoot, f).replace(/\\/g, "/")),
      ].filter((f, i, a) => /\.tsx?$/.test(f) && a.indexOf(f) === i);
      c.expect(files.length >= 8, `only ${files.length} Management file(s) found`);
      const src = new Map(files.map((f) => [f, code(readFileSync(join(repoRoot, f), "utf8"))]));

      // 1. THE GATE IS ONE BACKEND FUNCTION, AND THE TEST READS WHAT IT IS.
      //    WP4 forbids giving INSTITUTION_ADMIN the Management experience merely
      //    for being an administrator. The evaluator would not have refused
      //    them -- `allowed_audiences` carries INSTITUTION_ADMIN across most of
      //    the catalogue -- so the surface has to gate on the ROLE SET, and this
      //    reads the migration to confirm the function it gates on really is
      //    that and not a rank test.
      const wp2 = readFileSync(
        join(repoRoot, "supabase/migrations/20260924110000_pintar_proposes_a_human_decides.sql"), "utf8");
      const gerbang = /create function public\.management_scope_over_node[\s\S]*?\$\$;/.exec(wp2)?.[0] ?? "";
      c.expect(gerbang.includes("management_learner_roles()"),
        "management_scope_over_node no longer restricts itself to the Management role set");
      c.expect(!/has_scope|role_rank|>=\s*'EDUCATOR'/.test(gerbang),
        "management_scope_over_node became a rank test, which INSTITUTION_ADMIN would pass");
      const wp1 = readFileSync(
        join(repoRoot, "supabase/migrations/20260923130000_management_may_open_a_learner_on_purpose.sql"), "utf8");
      const himpunan = /function public\.management_learner_roles\(\)[\s\S]*?\$\$;/.exec(wp1)?.[0] ?? "";
      c.expect(/'HEAD_OF_DEPARTMENT'\s*,\s*'DEAN'/.test(himpunan),
        "the Management role set is no longer HEAD_OF_DEPARTMENT and DEAN");
      c.expect(!/INSTITUTION_ADMIN|SYSTEM_ADMIN/.test(himpunan),
        "an administrator entered the Management role set");

      // 2. NO ROLE NAME IS READ IN THE MANAGEMENT DATA LAYER. A surface that
      //    decided "is this person Management" from a role string would be the
      //    UI deciding authority, which doc 05 forbids and INV-37 exists to
      //    catch -- and it is exactly how an administrator would slip in.
      const PERAN = /"(STUDENT|EDUCATOR|HEAD_OF_DEPARTMENT|DEAN|INSTITUTION_ADMIN|SYSTEM_ADMIN)"/;
      const lapis = src.get("src/lib/pimpinan.ts") ?? "";
      const bocor = PERAN.exec(lapis);
      c.expect(bocor === null, `src/lib/pimpinan.ts reads a role name: ${bocor?.[0]}`);
      c.expect(!/select\([^)]*\brole\b/.test(lapis),
        "src/lib/pimpinan.ts selects the role column, so a role name can reach it");
      c.expect(PERAN.test('const r = "DEAN";'), "the role-name detector cannot catch a planted role literal");

      // 3. EVERY MANAGEMENT ROUTE ASKS THE GATE, AND REFUSES THROUGH THE ONE
      //    REFUSAL PAGE. A route that rendered without asking would be a page
      //    whose authority came from whoever linked to it.
      //    The count is a DRIFT GUARD on the set this loop reads, not a claim
      //    about how many pages Management ought to have: its value is that a
      //    route added without a gate cannot slip in unnoticed. MOVED 4 -> 6
      //    for WP7C's two class-feedback routes, and 6 -> 7 for WP7D's
      //    per-class operating page. Every one of them asks
      //    `simpulDalamLingkup` and refuses through the one refusal page, and
      //    is therefore held to this rule alongside WP4's four.
      const halaman = files.filter((f) => /^src\/app\/pimpinan\/.*page\.tsx$/.test(f));
      c.expect(halaman.length === 7,
        `${halaman.length} Management page(s); WP4 builds four, WP7C two and WP7D one`);
      for (const f of halaman) {
        const body = src.get(f) ?? "";
        c.expect(/lingkupPimpinan\(\)|simpulDalamLingkup\(/.test(body),
          `${f} renders without asking whether this reader is Management over the node`);
        c.expect(/HalamanPenolakan/.test(body), `${f} has no refusal path`);
      }
      c.expect(/management_scope_over_node/.test(lapis),
        "the Management data layer no longer calls the gate");

      // 4. THE LANDING. Both Management roles go to the Management home; the two
      //    administrator roles deliberately do not, because the gate refuses
      //    them and routing somebody to a refusal is not routing them home.
      c.expect(berandaPeran("HEAD_OF_DEPARTMENT") === "/pimpinan",
        `HEAD_OF_DEPARTMENT lands at ${berandaPeran("HEAD_OF_DEPARTMENT")}`);
      c.expect(berandaPeran("DEAN") === "/pimpinan", `DEAN lands at ${berandaPeran("DEAN")}`);
      for (const p of ["INSTITUTION_ADMIN", "SYSTEM_ADMIN", "EDUCATOR", "STUDENT"] as const) {
        c.expect(berandaPeran(p) !== "/pimpinan", `${p} is sent to the Management home`);
      }

      // 5. THE BRANCH IS RE-CHECKED AND A LEAK THROWS. Driven through the pure
      //    containment predicate the module re-checks with, on a node that is
      //    genuinely outside every scope.
      c.expect(dalamLingkup({ jalur: ["inst", "fak", "dept"] }, ["dept"]),
        "a node inside the scope is reported outside it");
      c.expect(!dalamLingkup({ jalur: ["inst", "fak", "lain"] }, ["dept"]),
        "a node in another department is reported inside the scope");
      c.expect(!dalamLingkup({ jalur: [] }, ["dept"]), "a node with no path is not refused");
      c.expect(/throw new PimpinanError/.test(lapis),
        "the scope read drops an out-of-scope node quietly instead of throwing");

      // 6. NOTHING ON THIS SURFACE READS EVIDENCE AROUND THE CATALOGUE. Every
      //    figure is `metric_evaluate`'s; a number assembled from a table in a
      //    route is a number that reached a screen without being governed.
      const TERLARANG = /from\("(assessment_results|responses|presented_items|official_results|service_item_statistics|service_distractor_uptake)"/;
      for (const [f, body] of src) {
        const m = TERLARANG.exec(body);
        c.expect(m === null, `${f} reads evidence directly: ${m?.[0]}`);
      }
      c.expect(TERLARANG.test('db.from("assessment_results")'),
        "the direct-evidence detector cannot catch a planted read");

      return c.verdict(
        "who is Management is the database's answer and never this code's: the surface gates on " +
        "management_scope_over_node, which the migration is read to confirm is the WP1 ROLE SET and not " +
        "a rank test -- so an INSTITUTION_ADMIN, who the metric catalogue would have admitted, is " +
        "refused by name; no role string is read anywhere in the data layer and the role column is " +
        "never selected, both watched on plants; all four routes ask the gate before they render and " +
        "all four refuse through the one refusal page; both Management roles land on the Management " +
        "home and neither administrator role does; the branch below a scope is re-checked and a leak " +
        "throws rather than being dropped; and no file reads evidence around the catalogue",
      );
    },
  },

  {
    id: "UX1-PIMPINAN-KEPUTUSAN-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const wp2 = readFileSync(
        join(repoRoot, "supabase/migrations/20260924110000_pintar_proposes_a_human_decides.sql"), "utf8");
      const kartu = code(readFileSync(join(repoRoot, "src/components/pimpinan/KartuKeputusan.tsx"), "utf8"));
      const aksi = code(readFileSync(join(repoRoot, "src/app/pimpinan/actions.ts"), "utf8"));
      const kontrak = code(readFileSync(join(repoRoot, "src/lib/pimpinan-kontrak.ts"), "utf8"));

      // 1. THE STATE MACHINE IS THE DATABASE'S, AND IT IS READ OUT OF THE
      //    DATABASE. Offering a control the endpoint would refuse is the page
      //    promising something the product does not do; offering fewer is the
      //    page hiding something the human is entitled to do. Both are caught by
      //    comparing with the migration rather than with a memory of it.
      const guard = /if not \(\(([\s\S]*?)\)\) then/.exec(wp2)?.[1] ?? "";
      c.expect(guard.length > 0, "the transition guard could not be found in the WP2 migration");
      const diizinkan = new Map<string, Set<string>>();
      for (const m of guard.matchAll(/d\.state = '([A-Z_]+)'\s*and p_to (?:in \(([^)]*)\)|= '([A-Z_]+)')/g)) {
        const dari = m[1];
        const ke = m[2] ? [...m[2].matchAll(/'([A-Z_]+)'/g)].map((x) => x[1]) : [m[3]];
        diizinkan.set(dari, new Set([...(diizinkan.get(dari) ?? []), ...ke]));
      }
      c.expect(diizinkan.size === 2, `${diizinkan.size} source state(s) parsed from the migration; expected 2`);
      for (const [dari, ke] of diizinkan) {
        const mine = new Set<string>(langkahBerikut(dari as never));
        c.expect(mine.size === ke.size && [...ke].every((x) => mine.has(x)),
          `the surface offers {${[...mine].join(",")}} from ${dari}; the endpoint accepts {${[...ke].join(",")}}`);
      }
      // DECIDED is terminal, and the migration says so by not naming it.
      c.expect(langkahBerikut("DECIDED").length === 0,
        "the surface offers a move out of a recorded decision, which the endpoint refuses");
      c.expect(!/DECIDED[\s\S]{0,40}and p_to/.test(guard),
        "the endpoint began accepting a move out of DECIDED and this test did not notice");

      // 2. EXACTLY THE OUTCOMES THE ENUM DECLARES. No fourth, no "other", no
      //    free-text outcome: an outcome the database does not name is not one.
      const enumSrc = /create type public\.management_decision_outcome as enum\s*\(([^)]*)\)/.exec(wp2)?.[1] ?? "";
      const hasilDb = [...enumSrc.matchAll(/'([A-Z_]+)'/g)].map((m) => m[1]).sort();
      const hasilUi = [...HASIL_SEMUA].sort();
      c.expect(hasilDb.length === 3 && hasilUi.join("|") === hasilDb.join("|"),
        `the surface offers {${hasilUi.join(",")}}; the enum declares {${hasilDb.join(",")}}`);
      for (const h of HASIL_SEMUA) {
        c.expect(typeof HASIL_KUNCI[h] === "string" && HASIL_KUNCI[h].startsWith("pimpinan."),
          `outcome ${h} has no telling`);
      }
      // No sanction, no penalty, no guilt: the outcomes name what Management
      // DID, and the enum's own comment says that is deliberate.
      const HUKUM = /sanksi|hukuman|pelanggaran|bersalah|penalty|sanction|guilt|punish/i;
      for (const h of HASIL_SEMUA) {
        for (const l of LOCALES) {
          c.expect(!HUKUM.test(t(HASIL_KUNCI[h] as HleEvent, "staff", { locale: l })),
            `outcome ${h} reads as a punishment in ${l}`);
        }
      }

      // 3. A DECIDED CARD CARRIES NO CONTROL, and the card asks the contract
      //    rather than deciding for itself.
      c.expect(/berikut\.includes\("UNDER_REVIEW"\)/.test(kartu) && /berikut\.includes\("DECIDED"\)/.test(kartu),
        "the card no longer gates its controls on the declared transitions");
      c.expect(/langkahBerikut\(/.test(kartu), "the card no longer reads the state machine at all");

      // 4. NO ENUM AND NO TABLE NAME REACHES A SCREEN. Every one of the four
      //    database vocabularies the card touches goes through a declared map.
      const enumWords = [
        ...[...(/create type public\.management_decision_family as enum\s*\(([^)]*)\)/.exec(wp2)?.[1] ?? "")
          .matchAll(/'([A-Z_]+)'/g)].map((m) => m[1]),
        ...[...(/create type public\.management_decision_state as enum\s*\(([^)]*)\)/.exec(wp2)?.[1] ?? "")
          .matchAll(/'([A-Z_]+)'/g)].map((m) => m[1]),
        ...hasilDb,
      ];
      c.expect(enumWords.length >= 9, `${enumWords.length} enum member(s) found; expected at least 9`);
      // A member may appear as a KEY in a map or as a comparison, never inside
      // a JSX text position. The text positions are what this extracts.
      // A TEXT POSITION IS NOT ANY GAP BETWEEN TWO ANGLE BRACKETS. `{k.keadaan
      // === "DECIDED" ? (` sits between `>` and `<` in the source and is a
      // comparison, not something a reader sees; the first version of this
      // check read it as rendered text and went red on the card's own guard.
      // A real text node carries no comparison, no quote and no arrow.
      const teks = [...kartu.matchAll(/>\s*\{?\s*([^<>{}]{2,})\s*\}?\s*</g)]
        .map((m) => m[1].trim())
        .filter((x) => !/[=?"]|=>/.test(x));
      for (const w of enumWords) {
        c.expect(!teks.some((x) => x.includes(w)), `the decision card renders the enum member ${w}`);
      }
      c.expect(teks.length > 0, "no text position was found in the decision card at all");
      // AND NO COPY KEY IS COMPOSED FROM A DATABASE VALUE. This is how a table
      // name leaks: not by rendering it, but by interpolating it into a key, so
      // that a family WP2 adds later builds a key the copy table does not have
      // and `t()` is handed an undefined row at render time. Both vocabularies
      // the card maps are looked up in a declared map instead. (This check went
      // red on its first run and found exactly that in the shipped card.)
      const disusun = /`(?:pimpinan|laporan|jenis|tindakan|metrik|kesiapan)\.[^`]*\$\{/.exec(kartu);
      c.expect(disusun === null,
        `the decision card composes a copy key from a database value: ${disusun?.[0]}`);
      c.expect(/const SUMBER: Record<string, string>/.test(kartu),
        "the source table is no longer resolved through a declared map");
      for (const [, k] of Object.entries(KEADAAN_KUNCI)) {
        c.expect(k.startsWith("pimpinan."), `a decision state maps to ${k}, which is not a copy key`);
      }
      for (const [, k] of Object.entries(KELUARGA_KUNCI)) {
        c.expect(k.startsWith("pimpinan."), `a decision family maps to ${k}, which is not a copy key`);
      }
      // A source table with no declared telling renders NO line rather than a
      // plausible one, so a table name cannot leak through a fallback.
      c.expect(!/pimpinan\.sumber\.lain|SUMBER\[[^\]]*\]\s*(\?\?|\|\|)/.test(kartu),
        "the decision card grew a fallback that would render an undeclared source");

      // 5. THE CHAIN IS FOUR PARTS IN ONE ORDER, per family, and the order is
      //    fixed in the markup rather than assembled from data.
      const urut = ["didukung", "belum", "langkah", "keputusan"]
        .map((k) => kartu.indexOf(`pimpinan.rantai.${k}`));
      c.expect(urut.every((i) => i >= 0) && urut.every((v, i, a) => i === 0 || a[i - 1] < v),
        `the chain is out of order or incomplete in the card: ${urut.join(",")}`);
      for (const [fam, r] of Object.entries(RANTAI)) {
        for (const part of [r.didukung, r.belum, r.langkah]) {
          c.expect(part.startsWith("pimpinan.rantai."), `${fam} carries a chain part that is not a copy key`);
        }
      }

      // 6. PINTAR PROPOSES AND A HUMAN DECIDES. One RPC, no second one, and
      //    nothing in this surface advances a decision on a timer, a threshold
      //    or a count.
      const rpcs = [...aksi.matchAll(/\.rpc\("([a-z_]+)"/g)].map((m) => m[1]);
      c.expect(rpcs.length === 1 && rpcs[0] === "advance_management_decision",
        `the Management action calls {${rpcs.join(",")}}`);
      c.expect(!/setTimeout|setInterval|cron|schedule|auto[A-Z_]|otomatis/i.test(aksi + kontrak),
        "something in the Management decision path advances a decision without a person");
      c.expect(!/priority|prioritas|urgency|urgensi|sla|score|skor|weight|bobot/i.test(kontrak),
        "the decision ordering grew a priority, a score or an SLA");

      // 7. THE ORDER IS AN ORDER, NOT A RANKING. Waiting first, then the oldest,
      //    and stable for two raised in the same instant.
      const k = (id: string, keadaan: Keputusan["keadaan"], at: string): Keputusan => ({
        id, keluarga: "INTEGRITY_REFERRAL", keadaan, hasil: null, simpul: "n", simpulNama: null,
        institusi: "i", subjek: null, sumberTabel: "integrity_signals", diangkatPada: at,
        catatan: null, diputuskanPada: null,
      });
      const diurut = urutan([
        k("d", "DECIDED", "2026-01-01T00:00:00Z"),
        k("c", "AWAITING_REVIEW", "2026-03-01T00:00:00Z"),
        k("a", "AWAITING_REVIEW", "2026-02-01T00:00:00Z"),
        k("b", "UNDER_REVIEW", "2026-01-15T00:00:00Z"),
      ]).map((x) => x.id);
      c.expect(diurut.join("") === "acbd", `the reading order is ${diurut.join("")}, expected acbd`);
      const sama = urutan([
        k("z", "AWAITING_REVIEW", "2026-02-01T00:00:00Z"),
        k("y", "AWAITING_REVIEW", "2026-02-01T00:00:00Z"),
      ]).map((x) => x.id);
      c.expect(sama.join("") === "yz", `two decisions raised in the same instant sort unstably: ${sama.join("")}`);
      c.expect(menunggu(k("q", "AWAITING_REVIEW", "x")) && !menunggu(k("q", "DECIDED", "x")),
        "a recorded decision is still counted as waiting for somebody");

      // 8. NO TRAFFIC-LIGHT. The ground says how far along the DECISION is, and
      //    `blocked` -- the one ground that reads as a verdict -- is never used,
      //    because an integrity referral names a learner on the card.
      const nadaSemua = (["AWAITING_REVIEW", "UNDER_REVIEW", "DECIDED"] as const).map(nada);
      c.expect(!nadaSemua.includes("blocked" as never), `a decision card uses the blocked ground: ${nadaSemua.join(",")}`);
      c.expect(new Set(nadaSemua).size === 3, "two decision states share a ground, so the tint says less than the words");
      c.expect(/KEADAAN_KUNCI\[k\.keadaan\]/.test(kartu),
        "the card no longer prints the state in words beside the tint, so colour carries it alone");

      return c.verdict(
        "the decision experience is WP2's and automates nothing: the transitions offered are PARSED OUT " +
        "of advance_management_decision and compared, so the surface cannot offer a move the endpoint " +
        "refuses nor hide one it accepts; DECIDED is terminal on both sides; the outcomes are exactly " +
        "the three the enum declares and none of them reads as a punishment in either language; every " +
        "family, state, outcome and source table is mapped to a telling before it renders and an " +
        "undeclared source renders no line at all; the four-part chain is in the fixed order; one RPC " +
        "and no timer, threshold, priority, score or SLA anywhere; the reading order is waiting-then-" +
        "oldest and is stable; and no card ever takes the blocked ground",
      );
    },
  },

  {
    id: "UX1-PIMPINAN-KESIAPAN-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const kontrak = code(readFileSync(join(repoRoot, "src/lib/pimpinan-kontrak.ts"), "utf8"));
      const ringkas = code(readFileSync(join(repoRoot, "src/components/pimpinan/RingkasKesiapan.tsx"), "utf8"));
      const wp3 = readFileSync(
        join(repoRoot, "supabase/migrations/20260925100000_enough_evidence_to_say_it_yet.sql"), "utf8");

      // 1. THE THREE STATES ARE THE DATABASE'S THREE, read from the enum.
      const enumSrc = /create type public\.evidence_readiness_state as enum\s*\(([^)]*)\)/.exec(wp3)?.[1] ?? "";
      const dbStates = [...enumSrc.matchAll(/'([A-Z_]+)'/g)].map((m) => m[1]).sort();
      const uiStates = [...KESIAPAN_URUT].sort();
      c.expect(dbStates.length === 3 && uiStates.join("|") === dbStates.join("|"),
        `the surface knows {${uiStates.join(",")}}; the database declares {${dbStates.join(",")}}`);

      // 2. THE STATE IS READ, NEVER RECOMPUTED. `minimum_sample` is governed per
      //    interpretation -- 1 for a participant count, 5 for comprehension, 10
      //    for an institution outcome, 30 for an item statistic -- so a second
      //    copy of the comparison in TypeScript would drift from the catalogue
      //    the first time a version changed.
      c.expect(kesiapan({ readiness: "NOT_YET_EVALUABLE" }) === "NOT_YET_EVALUABLE",
        "the envelope's own readiness is not carried through");
      c.expect(kesiapan({ readiness: "INSUFFICIENT_EVIDENCE" }) === "INSUFFICIENT_EVIDENCE",
        "INSUFFICIENT_EVIDENCE is not carried through");
      c.expect(kesiapan({ readiness: "SUFFICIENT_EVIDENCE" }) === "SUFFICIENT_EVIDENCE",
        "SUFFICIENT_EVIDENCE is not carried through");
      // A refusal carries no readiness, and the surface must not supply one:
      // "there is not enough evidence about a population you cannot see" is
      // still a fact about a population you cannot see.
      c.expect(kesiapan({}) === null, "a refusal is given a readiness the evaluator withheld");
      c.expect(kesiapan({ readiness: "MADE_UP" }) === null, "an unknown readiness value is accepted");
      c.expect(!/\bhave\b[\s\S]{0,40}<[\s\S]{0,40}\bneeded\b|\bneeded\b[\s\S]{0,40}>[\s\S]{0,40}\bhave\b/.test(kontrak),
        "the Management contract compares have with needed, which re-implements the governed minimum");
      c.expect(!/minimum_sample/.test(kontrak + ringkas),
        "the Management surface reaches for the catalogue minimum itself");

      // 3. THREE STATES, THREE DIFFERENT SENTENCES. Flattening any two back
      //    together is the exact regression WP3 was written to prevent.
      const kunci = KESIAPAN_URUT.map((k) => KESIAPAN_KUNCI[k]);
      c.expect(new Set(kunci).size === 3, `the three readiness states share ${3 - new Set(kunci).size + 1} telling(s)`);
      for (const l of LOCALES) {
        const teks = kunci.map((k) => t(k as HleEvent, "staff", { locale: l }));
        c.expect(new Set(teks).size === 3, `two readiness states read identically in ${l}: ${teks.join(" / ")}`);
      }

      // 4. NONE OF THE THREE IS A RESULT. Not one of them may carry a word a
      //    reader could take as a judgement about a class or a person -- which
      //    is the whole distance WP3's header calls "where the harm is".
      const PENILAIAN = /rendah|buruk|jelek|gagal|kurang baik|lemah|memprihatinkan|poor|low\b|bad\b|fail|weak|underperform|behind/i;
      // THE STATE SENTENCES CARRY NO JUDGEMENT WORD AT ALL. These are the lines
      // that sit beside a withheld figure, and a reader meets them without any
      // framing.
      for (const k of [...kunci, "laporan.metrik.belum_ada_bukti", "laporan.metrik.belum_cukup_data"]) {
        for (const l of LOCALES) {
          const teks = t(k as HleEvent, "staff", { locale: l });
          const m = PENILAIAN.exec(teks);
          c.expect(m === null, `${k} reads as a judgement in ${l}: "${m?.[0]}"`);
        }
      }
      c.expect(PENILAIAN.test("Penguasaan kelas ini rendah."),
        "the judgement detector cannot catch a planted verdict");
      // THE NOTE IS THE ONE LINE THAT MAY SAY THE WORD, BECAUSE IT DENIES IT.
      // "Not enough evidence is not a poor result" is the sentence that stops
      // the reader supplying the interpretation themselves, and it works only
      // by naming the interpretation it refuses. Sweeping it like the others
      // would delete the one line doing the work -- so it is required to carry
      // BOTH the denial and the word, in both languages, instead.
      for (const [l, ingkar] of [["id", /bukan hasil yang buruk/], ["en", /not a poor result/i]] as const) {
        const teks = t("pimpinan.kesiapan.catatan", "staff", { locale: l });
        c.expect(ingkar.test(teks), `the readiness note no longer denies a poor result in ${l}: "${teks}"`);
      }

      // 5. A REFUSAL IS COUNTED IN NO TALLY. A count that included refusals
      //    would tell the reader by arithmetic what the missing label withheld.
      const hitung = hitungKesiapan([
        { status: "ok", readiness: "SUFFICIENT_EVIDENCE" },
        { status: "below_minimum", readiness: "INSUFFICIENT_EVIDENCE" },
        { status: "below_minimum", readiness: "NOT_YET_EVALUABLE" },
        { status: "not_permitted" },
        { status: "unavailable" },
      ]);
      c.expect(hitung.SUFFICIENT_EVIDENCE === 1 && hitung.INSUFFICIENT_EVIDENCE === 1
        && hitung.NOT_YET_EVALUABLE === 1,
        `the readiness tally reads ${JSON.stringify(hitung)}`);
      c.expect(Object.values(hitung).reduce((a, b) => a + b, 0) === 3,
        "a refusal was counted in the readiness tally");

      // 6. AN EMPTY STATE IS NOT DRAWN AS A NOUGHT, and the section never takes
      //    a warning ground: tinting an uninterpretable figure like a warning
      //    would say in colour precisely what the copy refuses to say in words.
      c.expect(/hitung\[k\] > 0/.test(ringkas), "the readiness summary draws a zero for an empty state");
      c.expect(/pin-kesiapan/.test(ringkas) && !/pin-attention|pin-blocked/.test(ringkas),
        "the readiness section took a warning ground");
      const css = readFileSync(join(repoRoot, "src/app/experience.css"), "utf8");
      const blok = css.slice(css.indexOf(".pin-kesiapan {"));
      c.expect(/status-info-soft/.test(blok.slice(0, 200)),
        "the readiness ground is no longer the quiet one");

      // 7. NO ZERO STANDS IN FOR A WITHHELD FIGURE anywhere on the surface.
      for (const f of walk(join(repoRoot, "src", "app", "pimpinan"))
        .concat(walk(join(repoRoot, "src", "components", "pimpinan")))
        .filter((f) => /\.tsx?$/.test(f))) {
        const body = code(readFileSync(f, "utf8"));
        const m = /\b(value|mastery|sample)\b[^;\n]{0,30}(\?\?|\|\|)\s*0\b/.exec(body);
        c.expect(m === null, `${relative(repoRoot, f)} substitutes a zero for an absent figure: ${m?.[0]}`);
      }

      return c.verdict(
        "R5 is read and never redone: the three states are parsed out of the enum and matched, the " +
        "readiness comes from the envelope alone -- a refusal and an unknown value both yield nothing " +
        "rather than a state the evaluator withheld -- and nothing on the surface compares have with " +
        "needed or reaches for minimum_sample, because the governed minimum differs per interpretation. " +
        "The three states carry three different sentences in both languages, none of them containing a " +
        "word a reader could take as a verdict (watched on a plant), a refusal is counted in no tally, " +
        "an empty state is never drawn as a nought, the section keeps the quiet ground, and no figure " +
        "anywhere on the surface falls back to zero",
      );
    },
  },

  {
    id: "UX1-PIMPINAN-KATA-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const files = [
        ...walk(join(repoRoot, "src", "app", "pimpinan")),
        ...walk(join(repoRoot, "src", "components", "pimpinan")),
      ].filter((f) => /\.tsx?$/.test(f)).map((f) => relative(repoRoot, f).replace(/\\/g, "/"));
      const src = new Map(files.map((f) => [f, readFileSync(join(repoRoot, f), "utf8")]));
      const bersih = [...src.values()].map(code).join("\n");

      // 1. EVERY KEY THE SURFACE RENDERS IS DECLARED, IN BOTH LANGUAGES.
      const dipakai = new Set<string>([
        ...[...bersih.matchAll(/"(pimpinan\.[a-z_.]+)"/g)].map((m) => m[1]),
        ...Object.values(KESIAPAN_KUNCI), ...Object.values(HASIL_KUNCI),
        ...Object.values(KEADAAN_KUNCI), ...Object.values(KELUARGA_KUNCI),
        ...Object.values(RANTAI).flatMap((r) => [r.didukung, r.belum, r.langkah]),
      ]);
      c.expect(dipakai.size >= 40, `only ${dipakai.size} Management copy key(s) in use`);
      const declared = new Set(allKeys());
      for (const k of dipakai) {
        if (!c.expect(declared.has(k as HleEvent), `${k} is rendered but not declared`)) continue;
        const row = telling(k as HleEvent);
        c.expect(Boolean(row.default?.trim()), `${k} has no Indonesian telling`);
        c.expect(Boolean(row.en?.trim()), `${k} has no English telling`);
      }
      c.note(`${dipakai.size} Management key(s)`);

      // 2. NO HARD-CODED USER-VISIBLE COPY. Every sentence goes through the
      //    copy table, so the English half cannot silently fall behind.
      for (const [f, body] of src) {
        const teks = [...code(body).matchAll(/>\s*([A-Za-zÀ-ɏ][^<>{}\n]{6,})\s*</g)].map((m) => m[1].trim());
        for (const x of teks) {
          c.expect(false === /[a-z]{3}\s+[a-z]{3}/.test(x), `${f} carries hard-coded copy: "${x.slice(0, 48)}"`);
        }
      }

      // 3. NOT A RANKING, IN ANY DISGUISE. WP4 §10 names the whole family and
      //    this refuses the word AND the shapes the word hides behind.
      const PERINGKAT = /\bperingkat\b|\brank(ing|ed)?\b|persentil|percentile|leaderboard|papan peringkat|top\s*\d|\d+\s*(dari|of)\s*\d+|terbaik|terburuk|best.performing|worst.performing|di atas rata-rata|di bawah rata-rata|above average|below average|outperform|underperform/i;
      for (const [f, body] of src) {
        const m = PERINGKAT.exec(code(body));
        c.expect(m === null, `${f} carries ranking vocabulary: "${m?.[0]}"`);
      }
      for (const k of dipakai) {
        // The order line is the one telling that may say the word, because its
        // whole job is to refuse it: "Ini urutan, bukan peringkat." Sweeping it
        // like the rest would delete the sentence that keeps a queue from
        // reading as a league table. Its denial is asserted positively below.
        if (k === "pimpinan.urutan") continue;
        for (const l of LOCALES) {
          const teks = t(k as HleEvent, "staff", { locale: l });
          const m = PERINGKAT.exec(teks);
          c.expect(m === null, `${k} reads as a ranking in ${l}: "${m?.[0]}"`);
        }
      }
      c.expect(PERINGKAT.test("Peringkat 4 dari 40"), "the ranking detector cannot catch a planted ranking");
      c.expect(PERINGKAT.test("above average for the cohort"),
        "the ranking detector misses a ranking that avoids the word");

      // 4. THE THREE LOAD-BEARING SENTENCES, VERBATIM. The suppression line, the
      //    order line and the governing line are the approved design's own
      //    words; an edit that softens one is an edit to the product.
      const VERBATIM: Array<[string, string]> = [
        ["pimpinan.memutuskan", "PINTAR mengusulkan, manusia memutuskan."],
        ["pimpinan.urutan", "Urutannya: yang paling lama menunggu lebih dulu. Ini urutan, bukan peringkat."],
        ["pimpinan.batas",
          "Yang muncul di sini memerlukan wewenang, koordinasi, atau penafsiran tingkat institusi. Selebihnya tidak muncul."],
      ];
      for (const [k, teks] of VERBATIM) {
        c.expect(t(k as HleEvent, "staff") === teks, `${k} no longer reads "${teks}"`);
        c.expect(Boolean(telling(k as HleEvent).en?.trim()), `${k} lost its English telling`);
      }
      // The order line names itself as an order. If that clause goes, the page
      // stops saying the one thing that keeps a queue from reading as a league.
      c.expect(/bukan peringkat/.test(t("pimpinan.urutan", "staff")),
        "the order line no longer says it is not a ranking");
      c.expect(/not a ranking/i.test(t("pimpinan.urutan", "staff", { locale: "en" })),
        "the English order line no longer says it is not a ranking");

      // 5. NO INTERNAL WORD IN ANY MANAGEMENT TELLING. The copy is declared
      //    staff-only, which exempts it from the shared sweep by AUDIENCE -- so
      //    the sweep it is exempt from is re-run here against the words that
      //    actually matter on this surface.
      const MESIN = /management_decisions|integrity_signals|org_nodes|role_assignments|metric_evaluate|scope_node_id|AWAITING_REVIEW|UNDER_REVIEW|DECIDED|INTEGRITY_REFERRAL|NOT_YET_EVALUABLE|INSUFFICIENT_EVIDENCE|SUFFICIENT_EVIDENCE|CAN_[A-Z_]+|HEAD_OF_DEPARTMENT|SECURITY DEFINER|RLS/;
      for (const k of dipakai) {
        for (const l of LOCALES) {
          const m = MESIN.exec(t(k as HleEvent, "staff", { locale: l }));
          c.expect(m === null, `${k} names the machinery in ${l}: "${m?.[0]}"`);
        }
      }

      // 6. THE STAFF-ONLY DECLARATION IS REAL. It is what lets this copy say
      //    "Menunggu tinjauan" about a queue; without it the same key would
      //    throw. It is a statement about AUDIENCE, and `t()` still refuses to
      //    render one of these for a learner or the public.
      const hle = readFileSync(join(repoRoot, "src/lib/hle.ts"), "utf8");
      c.expect(/STAFF_ONLY_PREFIXES = \[[^\]]*"pimpinan\."/.test(hle),
        "the Management copy is not declared staff-only, so its register is unchecked");
      // WHAT THAT DECLARATION ACTUALLY DOES, MEASURED RATHER THAN ASSUMED. The
      // first version of this check asserted that `t()` THROWS for a learner,
      // on the strength of the comment above STAFF_ONLY_PREFIXES. It does not:
      // being staff-only EXEMPTS a key from the internal-word sweep, which is
      // what lets this copy say "Menunggu tinjauan" about a queue, and the
      // protection the comment means is the one asserted from the other side --
      // that no surface a learner or the public reads renders one.
      const pesan = t("pimpinan.keadaan.menunggu", "staff");
      c.expect(/Menunggu/.test(pesan),
        "the queue telling no longer uses the word the staff-only declaration exists to permit");
      // F05-S03 makes that assertion for `studio.` and `config.` by name and
      // does not derive its list from STAFF_ONLY_PREFIXES, so `pimpinan.` is
      // not covered by it. It is covered here instead: no surface outside the
      // Management routes may render one of these keys.
      const luar = walk(join(repoRoot, "src", "app"))
        .concat(walk(join(repoRoot, "src", "components")))
        .filter((f) => /\.tsx?$/.test(f))
        .map((f) => relative(repoRoot, f).replace(/\\/g, "/"))
        .filter((f) => !/^src\/(app|components)\/pimpinan\//.test(f));
      c.expect(luar.length > 30, `only ${luar.length} non-Management surface(s) swept`);
      for (const f of luar) {
        const m = /"(pimpinan\.[a-z_.]+)"/.exec(readFileSync(join(repoRoot, f), "utf8"));
        c.expect(m === null, `${f} renders the staff-only key ${m?.[1]}`);
      }

      // 7. NO PERSONA OVERRIDE, and no informal Indonesian: this reader is an
      //    adult acting in an institutional role and is addressed as Anda.
      for (const k of dipakai) {
        const row = telling(k as HleEvent) as Record<string, unknown>;
        for (const persona of ["learner", "educator", "public"]) {
          c.expect(row[persona] === undefined,
            `${k} carries a ${persona} override on a surface that reader never sees`);
        }
      }
      const INFORMAL = /\bkamu\b|\bkalian\b|\bkak\b|\bbro\b|\bnih\b|\bdong\b|\byuk\b/i;
      for (const k of dipakai) {
        const m = INFORMAL.exec(t(k as HleEvent, "staff"));
        c.expect(m === null, `${k} addresses the reader informally: "${m?.[0]}"`);
      }

      c.note(`${files.length} file(s)`);
      return c.verdict(
        "the Management copy is declared copy and nothing else: every key the surface renders exists in " +
        "both languages, no sentence is hard-coded in a component, and the three load-bearing lines -- " +
        "the suppression line, the order line and \"PINTAR mengusulkan, manusia memutuskan\" -- match " +
        "the approved design byte for byte, with the order line still saying in both languages that it " +
        "is an order and not a ranking. No ranking word and no disguised ranking appears in the code or " +
        "in any telling, watched on two plants including one that avoids the word; no telling names a " +
        "table, a capability, a policy or an enum; the register is declared staff-only, which is " +
        "re-proved by showing the same key still throws for a learner and for the public; and no key " +
        "carries a persona override or an informal address",
      );
    },
  },

  // ════════════════════════════════════════ WP5B · INSTITUTIONAL INTAKE
  {
    id: "UX1-DATA-BERKAS-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const wp5a = readFileSync(
        join(repoRoot, "supabase/migrations/20260926110000_an_import_that_survives_the_power_going_out.sql"), "utf8");

      // 1. A SPREADSHEET IS READ PROPERLY, because a school's file contains
      //    names and names contain commas. A naive split shifts every column
      //    after the comma for that row only -- a defect that shows up as one
      //    person with a wrong class, not as an error.
      const kutip = bacaKisi('nama,kelas\n"Wijaya, S.Pd",7A\n');
      c.expect(kutip.baris.length === 1 && kutip.baris[0][0] === "Wijaya, S.Pd" && kutip.baris[0][1] === "7A",
        `a quoted comma split the row: ${JSON.stringify(kutip.baris)}`);
      const ganda = bacaKisi('nama\n"Ali ""Ucok"" Basri"\n');
      c.expect(ganda.baris[0][0] === 'Ali "Ucok" Basri', `a doubled quote was mishandled: ${ganda.baris[0][0]}`);
      const barisDalam = bacaKisi('nama,ket\n"Sri\nRahayu",x\n');
      c.expect(barisDalam.baris.length === 1 && barisDalam.baris[0][0] === "Sri\nRahayu",
        "a newline inside a quoted field broke the row in two");
      // Excel writes a BOM, and an invisible byte on the first header turns
      // `nama` into something no guess matches.
      const bom = bacaKisi("﻿nama,kelas\nAni,7A\n");
      c.expect(bom.kepala[0] === "nama", `a byte-order mark survived into the header: ${JSON.stringify(bom.kepala[0])}`);
      for (const [sep, label] of [[";", "semicolon"], ["\t", "tab"], [",", "comma"]] as const) {
        const k = bacaKisi(`nama${sep}kelas\nAni${sep}7A\n`);
        c.expect(k.kepala.length === 2 && k.baris[0][1] === "7A", `a ${label}-separated file was not read`);
      }
      // A TRAILING NEWLINE IS NOT A PERSON.
      c.expect(bacaKisi("nama\nAni\nBudi\n").baris.length === 2,
        "a trailing newline was counted as an extra person");
      // A short row pads rather than reaching a payload as undefined.
      const pendek = bacaKisi("nama,kelas,peran\nAni,7A\n");
      c.expect(pendek.baris[0].length === 3 && pendek.baris[0][2] === "",
        "a short row does not pad to the header's width");

      // 2. EXACTLY THE FIELDS WP5A READS, taken from the migration rather than
      //    from memory. A field the surface offered and the database ignored
      //    would be collected, mapped, shown and silently dropped.
      const cek = /create function public\.import_row_problems[\s\S]*?\$\$;/.exec(wp5a)?.[0] ?? "";
      const maju = /create function public\.import_advance[\s\S]*?\ncomment on function/.exec(wp5a)?.[0] ?? "";
      c.expect(cek.length > 500 && maju.length > 500, "the WP5A row checker or advance body could not be read");
      const dibaca = new Set<string>();
      for (const m of (cek + maju).matchAll(/payload ->> '([a-z_]+)'/g)) dibaca.add(m[1]);
      const ditawarkan = new Set<string>(MEDAN);
      for (const f of dibaca) {
        c.expect(ditawarkan.has(f), `WP5A reads ${f} and the intake surface never offers it`);
      }
      for (const f of ditawarkan) {
        c.expect(dibaca.has(f), `the intake surface offers ${f} and WP5A reads no such field`);
      }
      // AND NO COLUMN FOR AN INSTITUTIONAL ID. PINTAR decides all eleven
      // characters; a column for it would invite a school to bring their own.
      c.expect(!ditawarkan.has("institutional_id") && !dibaca.has("institutional_id"),
        "the intake offers an institutional-ID column, which the identity doctrine forbids");

      // 3. THE ROLES OFFERED ARE THE ROLES ACCEPTED. WP5A refuses two by name.
      const ditolakDb = [...cek.matchAll(/v_role in \(([^)]*)\)/g)]
        .flatMap((m) => [...m[1].matchAll(/'([A-Z_]+)'/g)].map((x) => x[1]));
      c.expect(ditolakDb.length === 2, `${ditolakDb.length} role(s) refused by bulk provisioning; expected 2`);
      for (const r of ditolakDb) {
        c.expect(!(PERAN_PENDATAAN as readonly string[]).includes(r),
          `the mapping screen offers ${r}, which WP5A refuses for a bulk intake`);
      }
      c.expect(PERAN_PENDATAAN.length === 4, `${PERAN_PENDATAAN.length} role(s) offered; expected 4`);

      // 4. THE MAPPING PRODUCES ONE ROW PER ROW, AND DROPS NONE -- at every
      //    boundary the ruling names. A surface that silently skipped a bad row
      //    would provision a list the administrator never approved, and the
      //    count they confirmed would not be the count that happened.
      for (const n of [1, 50, 100, 101, 1000]) {
        const teks = "nama,kelas\n" + Array.from({ length: n }, (_, i) => `Orang ${i + 1},7A`).join("\n") + "\n";
        const k = bacaKisi(teks);
        c.expect(k.baris.length === n, `${n} rows in, ${k.baris.length} read`);
        const out = barisTernormalisasi(k, tebakPemetaan(k.kepala));
        c.expect(out.length === n, `${n} rows mapped to ${out.length}`);
      }
      // A ROW WITH NO NAME IS STILL SENT, so the database reports it against
      // its ordinal and the administrator is told. Dropping it here would hide
      // the problem the check exists to surface.
      const kosong = bacaKisi("nama,kelas\nAni,7A\n,7A\nBudi,7A\n");
      const hasil = barisTernormalisasi(kosong, { display_name: { jenis: "kolom", kolom: 0 } });
      c.expect(hasil.length === 3, `a nameless row was dropped before the database saw it: ${hasil.length} of 3`);
      c.expect(hasil[1].display_name === undefined,
        "an empty value is sent as an empty string rather than omitted");

      // 5. A FIXED CHOICE IS THE SAME FIVE FIELDS. Three of them are uuids and
      //    no school's spreadsheet holds one, so "one choice for everyone" is
      //    how a class gets named -- not a sixth field.
      const tetap = barisTernormalisasi(bacaKisi("nama\nAni\nBudi\n"), {
        display_name: { jenis: "kolom", kolom: 0 },
        node_id: { jenis: "tetap", nilai: "n-1" },
      });
      c.expect(tetap.every((r) => r.node_id === "n-1"), "a fixed choice did not reach every row");
      c.expect(tetap.every((r) => Object.keys(r).every((k) => (MEDAN as readonly string[]).includes(k))),
        "a normalized row carries a key WP5A does not read");

      // 6. THE GUESS IS A GUESS. It suggests and the screen shows it; a mapping
      //    with no name is refused rather than submitted.
      c.expect(tebakPemetaan(["Nama", "Kelas", "Peran"]).display_name?.jenis === "kolom",
        "the header guess does not find an obvious name column");
      c.expect(pemetaanLengkap({ display_name: { jenis: "kolom", kolom: 0 } }),
        "a mapping with a name is reported incomplete");
      c.expect(!pemetaanLengkap({ node_id: { jenis: "tetap", nilai: "x" } }),
        "a mapping with no name column is reported complete");

      return c.verdict(
        "the file is read as a spreadsheet rather than split on commas -- a quoted comma, a doubled " +
        "quote, a newline inside a field, a byte-order mark, and semicolon, tab and comma separators " +
        "all handled, with a trailing newline not counted as a person and a short row padded. The five " +
        "mappable fields are compared AGAINST THE MIGRATION in both directions, so a field the surface " +
        "offers that WP5A ignores and a field WP5A reads that the surface hides are both red; there is " +
        "no institutional-ID column, because PINTAR decides all eleven characters. The roles offered " +
        "exclude exactly the two WP5A refuses, read from its own check. One row in is one row out at 1, " +
        "50, 100, 101 and 1,000, a nameless row is still sent so the database can report it, and an " +
        "empty value is omitted rather than sent as an empty string",
      );
    },
  },

  {
    id: "UX1-DATA-TAHAP-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const wp5a = readFileSync(
        join(repoRoot, "supabase/migrations/20260926110000_an_import_that_survives_the_power_going_out.sql"), "utf8");

      const K = (o: Partial<Kemajuan> & { state: string }): Kemajuan => ({
        job_id: "j", institution_id: "i", total: 1000, completed: 0, remaining: 1000, failed: 0,
        pilot_required: true, pilot_size: 50, pilot_completed: 0, pilot_verified: false,
        pilot_verified_at: null, confirmed_at: null, completed_at: null, failure_reason: null, ...o,
      });

      // 1. EVERY STATE THE DATABASE HAS IS A PHASE THE SCREEN KNOWS. A state
      //    with no phase renders a page with no heading and no controls.
      const enumSrc = /create type public\.import_job_state as enum \(([\s\S]*?)\);/.exec(wp5a)?.[1] ?? "";
      const states = [...enumSrc.matchAll(/'([A-Z_]+)'/g)].map((m) => m[1]);
      c.expect(states.length === 8, `${states.length} job state(s) in the migration; expected 8`);
      for (const st of states) {
        c.expect(tahap({ state: st }) !== null, `the job state ${st} maps to no phase on the screen`);
      }
      c.expect(tahap({ state: "SOMETHING_ELSE" }) === null, "an unknown state is given a phase anyway");

      // 2. THE FIFTY-ROW GATE. `bolehLanjut` is a whitelist of the three
      //    provisioning states, so the checkpoint cannot be crossed by a page
      //    that stayed open -- and the whitelist is compared with the states
      //    `import_advance` itself accepts.
      // SCOPED TO import_advance's OWN BODY. `import_validate` opens with the
      // same shape -- `if j.state not in ('DRAFT', 'AWAITING_CONFIRMATION')` --
      // and it appears first in the file, so an unscoped search read the
      // validation guard and reported two accepted states where the
      // provisioning guard has three.
      const badanMaju = /create function public\.import_advance[\s\S]*?\ncomment on function/.exec(wp5a)?.[0] ?? "";
      c.expect(badanMaju.length > 500, "import_advance's body could not be isolated from the migration");
      const jaga = /if j\.state not in \(([^)]*)\) then/.exec(badanMaju)?.[1] ?? "";
      const diterima = [...jaga.matchAll(/'([A-Z_]+)'/g)].map((m) => m[1]).sort();
      c.expect(diterima.length === 3, `import_advance accepts ${diterima.length} state(s); expected 3`);
      for (const st of states) {
        const ui = bolehLanjut(K({ state: st, remaining: 500 }));
        const db = diterima.includes(st);
        c.expect(ui === db,
          `the surface ${ui ? "asks for" : "refuses"} a chunk in ${st}; import_advance ${db ? "accepts" : "refuses"} it`);
      }
      c.expect(!bolehLanjut(K({ state: "AWAITING_PILOT_VERIFICATION", remaining: 950 })),
        "the driver would continue past the fifty without a human");
      // And it stops when there is nothing left, so a finished job is never
      // asked for a chunk it has no rows for.
      c.expect(!bolehLanjut(K({ state: "IMPORTING", remaining: 0 })),
        "the driver asks for a chunk when nothing is pending");

      // 3. THE BOUNDARY SIZES, AND THE THRESHOLD READ FROM THE MIGRATION. The
      //    surface never decides that 101 needs a pilot: it reads
      //    `pilot_required`. What is checked here is that it HONOURS it.
      const ambang = Number(/import_pilot_threshold\(\) returns integer[\s\S]*?select (\d+)/.exec(wp5a)?.[1]);
      const ukuran = Number(/import_pilot_size\(\) returns integer[\s\S]*?select (\d+)/.exec(wp5a)?.[1]);
      c.expect(ambang === 100 && ukuran === 50, `the product numbers read ${ambang}/${ukuran}`);
      for (const n of [1, 50, 100]) {
        // No checkpoint: one straight run, and the screen offers it.
        const k = K({ state: "IMPORTING", total: n, remaining: n, pilot_required: false });
        c.expect(bolehLanjut(k), `an import of ${n} is not offered a run`);
        c.expect(!percontohanMenunggu(k), `an import of ${n} was given a pilot checkpoint`);
      }
      for (const n of [101, 1000]) {
        const k = K({ state: "AWAITING_PILOT_VERIFICATION", total: n, completed: 50,
                      remaining: n - 50, pilot_completed: 50 });
        c.expect(percontohanMenunggu(k), `an import of ${n} does not stop at the checkpoint`);
        c.expect(!bolehLanjut(k), `an import of ${n} would run past the checkpoint`);
      }

      // 4. INTERRUPTION, IN THE THREE PLACES THE RULING NAMES. In every one of
      //    them the answer is "continue", never "start again" and never "the
      //    job is lost".
      const setelah50 = K({ state: "AWAITING_PILOT_VERIFICATION", completed: 50, remaining: 950, pilot_completed: 50 });
      c.expect(percontohanMenunggu(setelah50) && !bolehLanjut(setelah50),
        "an interruption after the fifty and before verification does not return to the checkpoint");
      const setelahPeriksa = K({ state: "REMAINDER_IMPORTING", completed: 50, remaining: 950,
                                 pilot_completed: 50, pilot_verified: true, pilot_verified_at: "2026-01-01T00:00:00Z" });
      c.expect(bolehLanjut(setelahPeriksa) && !percontohanMenunggu(setelahPeriksa),
        "an interruption after verification asks for the pilot to be verified again");
      const seratus = K({ state: "REMAINDER_IMPORTING", completed: 100, remaining: 900,
                          pilot_completed: 50, pilot_verified: true });
      c.expect(bisaDilanjutkan(seratus), "an import interrupted at 100 of 1,000 is not offered a continue");
      c.expect(!bisaDilanjutkan(K({ state: "COMPLETED", total: 1000, completed: 1000, remaining: 0 })),
        "a completed import is offered a continue");
      c.expect(!bisaDilanjutkan(K({ state: "IMPORTING", completed: 0, remaining: 1000 })),
        "an import that has recorded nobody is described as resumable rather than as not started");

      // 5. THE PAGE OFFERS NOTHING THAT WOULD REPEAT A HUMAN ACT. A confirmed
      //    job draws no confirmation form and a verified pilot draws no verify
      //    form -- which is what stops a lost response becoming a second act.
      const hal = code(readFileSync(join(repoRoot, "src/app/pendataan/[pekerjaan]/page.tsx"), "utf8"));
      c.expect(/fase === "menunggu_konfirmasi" && pratinjau/.test(hal),
        "the confirmation form is not bound to the one state that awaits confirmation");
      c.expect(/menungguPercontohan \?/.test(hal),
        "the pilot verification form is not bound to the checkpoint state");
      c.expect(/percontohanMenunggu\(/.test(hal), "the page decides the checkpoint itself");
      // A completed or stopped job reached again draws neither.
      for (const st of ["COMPLETED", "FAILED"]) {
        const k = K({ state: st, completed: 1000, remaining: 0 });
        c.expect(!bolehLanjut(k) && !percontohanMenunggu(k),
          `reopening a ${st} job offers an action`);
      }

      return c.verdict(
        "the intake's phases are the database's states and the fifty-row gate is the database's gate: " +
        "every one of the eight job states maps to a phase, an unknown one maps to none, and the three " +
        "states the surface will ask for a chunk in are compared MEMBER BY MEMBER with the three " +
        "import_advance accepts -- so AWAITING_PILOT_VERIFICATION being absent from both is asserted " +
        "rather than assumed. The product numbers are read from the migration (100/50); 1, 50 and 100 " +
        "run straight through while 101 and 1,000 stop and cannot be driven past; an interruption after " +
        "the fifty returns to the checkpoint, one after verification never asks for it again, and one at " +
        "100 of 1,000 is offered a continue rather than a restart; and a completed or stopped job " +
        "reopened offers no action at all",
      );
    },
  },

  {
    id: "UX1-DATA-JUJUR-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const penggerak = code(readFileSync(join(repoRoot, "src/components/pendataan/Penggerak.tsx"), "utf8"));
      const aksi = code(readFileSync(join(repoRoot, "src/app/pendataan/actions.ts"), "utf8"));
      const kontrak = code(readFileSync(join(repoRoot, "src/lib/pendataan-kontrak.ts"), "utf8"));
      const halaman = code(readFileSync(join(repoRoot, "src/app/pendataan/[pekerjaan]/page.tsx"), "utf8"));
      const semua = [
        ...walk(join(repoRoot, "src", "app", "pendataan")),
        ...walk(join(repoRoot, "src", "components", "pendataan")),
      ].filter((f) => /\.tsx?$/.test(f));

      // 1. THE PROGRESS COMPONENT HOLDS NO COUNTER. Not one it increments per
      //    request, not one it advances on a timer, not one it estimates
      //    between two answers. Every number it shows came back from
      //    import_progress, which counts rows that committed.
      const naik = /\b(completed|selesai|kini|total|remaining)\b[^;\n]{0,24}(\+\+|\+= *\d|\+ *1\b)/.exec(penggerak);
      c.expect(naik === null, `the progress component increments a count of its own: ${naik?.[0]}`);
      c.expect(!/setInterval|setTimeout/.test(penggerak),
        "the progress component moves on a timer rather than on a committed answer");
      c.expect(/kini\.completed/.test(penggerak) && /kini\.remaining/.test(penggerak) && /kini\.total/.test(penggerak),
        "the progress component stopped reading the durable counts");
      // The bar's width is a rendering of a committed count, not an animation
      // beside one.
      c.expect(/kini\.completed \/ kini\.total/.test(penggerak),
        "the progress bar's width is no longer derived from committed rows");
      c.expect(/aria-valuenow=\{kini\.completed\}/.test(penggerak),
        "the bar announces a different number from the one it draws");

      // 2. A LOST RESPONSE IS NOT A LOST JOB. Every uncertain outcome re-reads
      //    durable state instead of deciding. This is checked on all four of
      //    the acts where it matters.
      c.expect(/bacaUlang\(pekerjaan\)/.test(penggerak),
        "the driver treats a missing answer as a failure instead of re-reading the job");
      const konfirm = /export async function konfirmasiAksi[\s\S]*?\n}/.exec(aksi)?.[0] ?? "";
      const verif = /export async function periksaPercontohanAksi[\s\S]*?\n}/.exec(aksi)?.[0] ?? "";
      const majukan = /export async function majukanAksi[\s\S]*?\n}/.exec(aksi)?.[0] ?? "";
      c.expect(/progress\(pekerjaan\)/.test(konfirm) && /confirmed_at/.test(konfirm),
        "a lost confirmation response is reported as a failure rather than re-read");
      c.expect(/progress\(pekerjaan\)/.test(verif) && /pilot_verified/.test(verif),
        "a lost verification response would make an administrator verify the pilot twice");
      c.expect(/return progress\(pekerjaan\)/.test(majukan),
        "a lost advance response is reported as a failure rather than re-read");

      // 3. NOTHING PROVISIONS WITHOUT A HUMAN, and nothing here is the human.
      //    The surface calls WP5A's confirmation; it does not keep a flag.
      c.expect(/rpc\("import_confirm"/.test(aksi), "the surface no longer calls WP5A's confirmation");
      c.expect(/rpc\("import_verify_pilot"/.test(aksi), "the surface no longer calls WP5A's pilot release");
      const rpcs = [...aksi.matchAll(/\.rpc\("([a-z_]+)"/g)].map((m) => m[1]);
      for (const r of rpcs) {
        c.expect(/^(import_|reserve_institution_namespace)/.test(r),
          `the intake action file calls ${r}, which is not part of the WP5A intake contract`);
      }
      c.expect(!/dikonfirmasi|confirmed\s*=\s*true|setKonfirmasi/.test(penggerak + halaman),
        "the surface keeps a confirmation flag of its own beside the database's");

      // 4. PROVISIONED IS NOT ACTIVE. The number is zero, it is SHOWN rather
      //    than omitted, and the sentence beside it says what the zero means.
      c.expect(AKUN_AKTIF === 0, `the surface believes ${AKUN_AKTIF} accounts are activated by an intake`);
      c.expect(/accounts_activated/.test(halaman),
        "the preview does not render WP5A's own account-activation count");
      c.expect(/pendataan\.pratinjau\.akun_arti/.test(halaman),
        "the screen shows the zero without the sentence that explains it");
      c.expect((halaman.match(/pendataan\.pratinjau\.akun_arti/g) ?? []).length >= 2,
        "the provisioned-is-not-active sentence appears on only one screen");
      // NOT ONE WORD OF ACTIVATION ANYWHERE, in code or in copy. WP5B adds no
      // password, no invitation, no magic link, no OTP and no card claim, and
      // this is what keeps a later edit from adding one quietly.
      const AKTIVASI = /aktivasi|aktifkan|activate[sd]?\b|activation|kata sandi|password|undangan|invitation|invite\b|magic ?link|tautan masuk|\botp\b|verifikasi surel|email verification|klaim identitas|identity claim/i;
      // `accounts_activated` IS WP5A'S OWN FIELD NAME and is the one mention
      // that means the opposite: the preview returns it as a deliberate zero,
      // and rendering it is how the screen says nobody can sign in. Reading a
      // field called that is not promising activation, so the identifier is
      // removed before the sweep rather than the sweep being loosened.
      const tanpaMedan = (x: string) => x.replace(/accounts_activated/g, "AKUN_NOL");
      for (const f of semua) {
        const rel = relative(repoRoot, f).replace(/\\/g, "/");
        const m = AKTIVASI.exec(tanpaMedan(code(readFileSync(f, "utf8"))));
        c.expect(m === null, `${rel} reaches for activation: "${m?.[0]}"`);
      }
      for (const k of allKeys().filter((x) => x.startsWith("pendataan."))) {
        for (const l of LOCALES) {
          const m = AKTIVASI.exec(t(k, "staff", { locale: l }));
          c.expect(m === null, `${k} promises activation in ${l}: "${m?.[0]}"`);
        }
      }
      c.expect(AKTIVASI.test("Akun sudah diaktifkan"), "the activation detector cannot catch a planted promise");

      // 5. THE READINESS OF THE PURE CONTRACT: it reads the envelope and never
      //    recomputes the pilot arithmetic the database governs.
      c.expect(!/> *100\b|>= *101|=== *50\b/.test(kontrak),
        "the pure contract hard-codes the pilot threshold or size instead of reading them");

      return c.verdict(
        "every number an administrator sees is the database's: the progress component holds no counter " +
        "it increments, runs on no timer, draws its bar from completed/total and announces the same " +
        "number it draws -- all watched on a plant. An uncertain outcome re-reads durable state at all " +
        "four places it matters, so a lost confirmation is not a failure and a lost verification does " +
        "not make an administrator verify the fifty twice. Provisioning goes through WP5A's own " +
        "confirmation and pilot release, the action file calls nothing outside the intake contract, and " +
        "the surface keeps no confirmation flag beside the database's. PROVISIONED IS NOT ACTIVE: the " +
        "zero is rendered rather than omitted, its sentence appears on more than one screen, and not one " +
        "word of activation -- password, invitation, magic link, one-time code, identity claim -- " +
        "appears in any file or any telling, watched on a plant",
      );
    },
  },

  {
    id: "UX1-DATA-WENANG-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const identitas = readFileSync(
        join(repoRoot, "supabase/migrations/20260926100000_a_school_gives_a_person_a_number.sql"), "utf8");
      const impor = readFileSync(
        join(repoRoot, "supabase/migrations/20260926110000_an_import_that_survives_the_power_going_out.sql"), "utf8");
      const lapis = code(readFileSync(join(repoRoot, "src/lib/pendataan.ts"), "utf8"));
      const berkas = [
        ...walk(join(repoRoot, "src", "app", "pendataan")),
        ...walk(join(repoRoot, "src", "components", "pendataan")),
      ].filter((f) => /\.tsx?$/.test(f)).map((f) => relative(repoRoot, f).replace(/\\/g, "/"));
      const src = new Map(berkas.map((f) => [f, readFileSync(join(repoRoot, f), "utf8")]));

      // 1. THE CAPABILITY IS THE GATE, AND THE MIGRATION SAYS WHO HOLDS IT.
      //    §17: Management access is not provisioning authority, and WP5A
      //    withholds it from both Management roles by name.
      const tabel = /role_capabilities\(r app_role\)[\s\S]*?\$function\$;/.exec(identitas)?.[0] ?? "";
      c.expect(tabel.length > 400, "the capability table could not be read from the migration");
      const punya = (role: string) => {
        const m = new RegExp(`when '${role}' then array\\[([\\s\\S]*?)\\]`).exec(tabel);
        return m ? /CAN_PROVISION_PEOPLE/.test(m[1]) : false;
      };
      c.expect(punya("INSTITUTION_ADMIN"), "an institution administrator no longer holds provisioning authority");
      for (const r of ["HEAD_OF_DEPARTMENT", "DEAN", "EDUCATOR", "STUDENT"]) {
        c.expect(!punya(r), `${r} holds CAN_PROVISION_PEOPLE, so a Management reader would reach the intake`);
      }
      // Every WP5A read path is bounded by the same capability.
      for (const pol of ["import_jobs_select", "import_rows_select"]) {
        const m = new RegExp(`create policy ${pol}[\\s\\S]*?;`).exec(impor)?.[0] ?? "";
        c.expect(/CAN_PROVISION_PEOPLE/.test(m), `${pol} is no longer bounded by provisioning authority`);
      }

      // 2. AND THE SURFACE ASKS THAT QUESTION RATHER THAN A ROLE NAME.
      const PERAN = /"(STUDENT|EDUCATOR|HEAD_OF_DEPARTMENT|DEAN|INSTITUTION_ADMIN|SYSTEM_ADMIN)"/;
      const bocor = PERAN.exec(lapis);
      c.expect(bocor === null, `src/lib/pendataan.ts reads a role name: ${bocor?.[0]}`);
      c.expect(!/select\([^)]*\brole\b/.test(lapis), "the intake data layer selects the role column");
      c.expect(/CAN_PROVISION_PEOPLE/.test(lapis), "the intake data layer no longer asks for the capability");
      c.expect(PERAN.test('const r = "DEAN";'), "the role-name detector cannot catch a planted role literal");
      for (const f of berkas.filter((x) => /page\.tsx$/.test(x))) {
        c.expect(/HalamanPenolakan/.test(src.get(f) ?? ""), `${f} has no refusal path`);
      }

      // 3. THE COPY IS DECLARED COPY, in both languages, and names no
      //    machinery. §4 bans the implementation vocabulary by name.
      const dipakai = new Set<string>(
        [...berkas.map((f) => code(src.get(f) ?? "")).join("\n").matchAll(/"(pendataan\.[a-z_.]+)"/g)].map((m) => m[1]),
      );
      for (const k of Object.values(MASALAH)) dipakai.add(k);
      dipakai.add(MASALAH_LAIN);
      c.expect(dipakai.size >= 60, `only ${dipakai.size} intake copy key(s) in use`);
      const declared = new Set(allKeys());
      for (const k of dipakai) {
        if (!c.expect(declared.has(k as HleEvent), `${k} is rendered but not declared`)) continue;
        const row = telling(k as HleEvent);
        c.expect(Boolean(row.default?.trim()), `${k} has no Indonesian telling`);
        c.expect(Boolean(row.en?.trim()), `${k} has no English telling`);
      }
      const MESIN = /\bindeks\b|\bindex\b|\block\b|\bkunci baris\b|sequence|trigger|transaksi|transaction|uuid|jsonb|rollback|commit\b|import_jobs|import_rows|institutional_identities|RLS|\benum\b|DRAFT|AWAITING_|PILOT_IMPORTING|REMAINDER_|CAN_[A-Z_]+/;
      for (const k of dipakai) {
        for (const l of LOCALES) {
          const m = MESIN.exec(t(k as HleEvent, "staff", { locale: l }));
          c.expect(m === null, `${k} names the machinery in ${l}: "${m?.[0]}"`);
        }
      }
      for (const [f, body] of src) {
        const teks = [...code(body).matchAll(/>\s*([A-Za-zÀ-ɏ][^<>{}\n]{6,})\s*</g)].map((m) => m[1].trim());
        for (const x of teks) {
          c.expect(!/[a-z]{3}\s+[a-z]{3}/.test(x), `${f} carries hard-coded copy: "${x.slice(0, 48)}"`);
        }
      }

      // 4. EVERY VALIDATION PROBLEM WP5A CAN RETURN HAS A SENTENCE. The failure
      //    mode of this map is silent: an unmapped phrase falls through to the
      //    generic line and the administrator is told their row is wrong
      //    without being told why.
      const cek = /create function public\.import_row_problems[\s\S]*?\$\$;/.exec(impor)?.[0] ?? "";
      const frasa = [...cek.matchAll(/to_jsonb\('([^']+)'::text\)/g)].map((m) => m[1]);
      c.expect(frasa.length >= 10, `${frasa.length} validation problem(s) found in the migration`);
      for (const f of frasa) {
        c.expect(MASALAH[f] !== undefined, `WP5A can return "${f}" and the surface has no sentence for it`);
      }
      // The duplicate finding is added by import_validate rather than by the
      // row checker, so it is asserted separately rather than missed.
      c.expect(MASALAH["duplicate row within this import"] !== undefined,
        "a duplicate row inside the file has no sentence");
      c.expect(kunciMasalah("something WP5A has never said") === MASALAH_LAIN,
        "an unknown problem phrase would render raw");
      for (const [frase, kunci] of Object.entries(MASALAH)) {
        c.expect(t(kunci as HleEvent, "staff") !== frase, `${kunci} renders the database's own phrase`);
      }

      // 5. THE IDENTITY DOCTRINE, SAID ON THE PAGE. §3: the number identifies a
      //    person at a school and encodes no role, and §4: the code cannot be
      //    changed once one number exists -- said BEFORE the first issuance,
      //    which is the only time saying it helps.
      const masuk = code(readFileSync(join(repoRoot, "src/app/pendataan/page.tsx"), "utf8"));
      c.expect(/pendataan\.nomor\.arti/.test(masuk), "the page never says what the identity number is not");
      for (const l of LOCALES) {
        const teks = t("pendataan.nomor.arti", "staff", { locale: l });
        c.expect(/murid|guru|pimpinan|student|teacher|management/i.test(teks),
          `the identity-number sentence does not name the roles it refuses to encode in ${l}`);
      }
      c.expect(/pendataan\.kode\.peringatan/.test(masuk), "the page never warns that the code becomes permanent");
      // A frozen code renders as identity, with no field and no save control.
      c.expect(/dipilih\.kode && dipilih\.beku \?/.test(masuk),
        "a frozen institution code is not told apart from an editable one");
      c.expect(/beku:/.test(lapis) && /institutional_identities/.test(lapis),
        "the surface decides a code is frozen without asking whether an identity exists");

      // 6. STAFF-ONLY, AND NOT RENDERED ANYWHERE ELSE.
      const hle = readFileSync(join(repoRoot, "src/lib/hle.ts"), "utf8");
      c.expect(/STAFF_ONLY_PREFIXES = \[[^\]]*"pendataan\."/.test(hle),
        "the intake copy is not declared staff-only, so its register is unchecked");
      const luar = walk(join(repoRoot, "src", "app"))
        .concat(walk(join(repoRoot, "src", "components")))
        .filter((f) => /\.tsx?$/.test(f))
        .map((f) => relative(repoRoot, f).replace(/\\/g, "/"))
        .filter((f) => !/^src\/(app|components)\/pendataan\//.test(f));
      for (const f of luar) {
        const body = readFileSync(join(repoRoot, f), "utf8");
        const m = /"(pendataan\.[a-z_.]+)"/.exec(body);
        // The configuration surface links to the intake by name, which is the
        // one legitimate mention outside it.
        const sah = f === "src/app/konfigurasi/page.tsx" && m?.[1] === "pendataan.judul";
        c.expect(m === null || sah, `${f} renders the staff-only key ${m?.[1]}`);
      }

      c.note(`${berkas.length} file(s), ${dipakai.size} key(s)`);
      return c.verdict(
        "provisioning authority is WP5A's capability and the migration is read to prove who holds it: an " +
        "institution administrator does, and HEAD_OF_DEPARTMENT, DEAN, EDUCATOR and STUDENT do not -- so " +
        "a WP4 Management reader is refused by name rather than by an opinion in this code, which reads " +
        "no role string at all and never selects the role column, watched on a plant. Every intake copy " +
        "key is declared in both languages, no component hard-codes a sentence, and no telling names an " +
        "index, a lock, a sequence, a trigger, a transaction, a table or a job state. EVERY validation " +
        "phrase WP5A can return is matched against the migration and has a sentence of its own, an " +
        "unknown one falls back rather than rendering raw, and none of them renders the database's " +
        "wording. The identity doctrine is on the page in both languages -- the number encodes no role, " +
        "and the code becomes permanent, said before the first issuance -- and a frozen code renders as " +
        "identity with no editable control",
      );
    },
  },
  {
    id: "UX1-AJAR-KONTEKS-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const read = (f: string) => readFileSync(join(repoRoot, f), "utf8");
      const HALAMAN = "src/app/belajar/page.tsx";
      const halaman = read(HALAMAN);
      const badan = code(halaman);
      const cangkang = code(read("src/components/CangkangPengalaman.tsx"));

      // 1. THE RULE IS PURE, AND IT IS ABOUT ROLES HELD RATHER THAN ABOUT RANK.
      //    Driven through every shape it can meet, because the two answers it
      //    gives have opposite failure modes: a false "teaches" strands somebody
      //    in a header that is not theirs, and a false "this is their first
      //    login as a learner" tells an adult professional that PINTAR thinks
      //    they are a child.
      const BENTUK: Array<{ peran: readonly string[] | null; mengajar: boolean; kata: string }> = [
        { peran: [], mengajar: false, kata: "somebody holding no role at all" },
        { peran: ["EDUCATOR"], mengajar: true, kata: "an educator" },
        { peran: ["HEAD_OF_DEPARTMENT"], mengajar: false, kata: "a head of department" },
        { peran: ["DEAN"], mengajar: false, kata: "a dean" },
        { peran: ["INSTITUTION_ADMIN"], mengajar: false, kata: "an institution administrator" },
        { peran: ["SYSTEM_ADMIN"], mengajar: false, kata: "a platform administrator" },
        { peran: ["EDUCATOR", "HEAD_OF_DEPARTMENT"], mengajar: false, kata: "an educator who is also a head of department" },
        { peran: ["EDUCATOR", "DEAN"], mengajar: false, kata: "an educator who is also a dean" },
        // A FAILED READ FALLS BACK TO THE PRODUCT AS IT WAS. `peranSaya` can now
        // say "I could not ask", and the honest answer to that is the learner
        // shell and the learner tour -- which is every release before this one.
        { peran: null, mengajar: false, kata: "a reader whose roles could not be read" },
      ];
      for (const b of BENTUK) {
        const k = konteksPembelajaran(b.peran);
        c.expect(k.mengajar === b.mengajar,
          `${b.kata} is ${k.mengajar ? "given" : "denied"} the educator's shell on their own learning`);
        //    RANK NEVER ENTERS INTO WHICH TOUR IS PRESENTED (§H-3). The tour
        //    follows the SHELL, and the shell's anchors are what the tour's
        //    last two steps point at.
        c.expect(k.turBelajar === !k.mengajar,
          `${b.kata} gets a tour that does not match the shell they are looking at`);
      }
      c.expect(/Promise<string\[\] \| null>/.test(code(read("src/lib/tur-negara.ts"))),
        "the role read cannot tell a failure apart from a person who holds no role");

      //    WATCHED ON TWO PLANTS, both of them mistakes that are easy to make
      //    and that every assertion above would otherwise wave through.
      //
      //    (a) "an educator who is also a dean still teaches" — dropping the
      //        seniority rule and reading EDUCATOR on its own.
      const tanpaSenioritas = (peran: readonly string[] | null) => (peran ?? []).includes("EDUCATOR");
      c.expect(tanpaSenioritas(["EDUCATOR", "DEAN"]) !== konteksPembelajaran(["EDUCATOR", "DEAN"]).mengajar,
        "dropping the seniority rule is indistinguishable from keeping it, so this case proves nothing");
      //    (b) "the learner tour belongs only to somebody holding no role" —
      //        which quietly takes the learner landing's own tour away from
      //        every senior reader, the thing §H-3 exists to prevent.
      const hanyaTanpaPeran = (peran: readonly string[] | null) => (peran ?? []).length === 0;
      c.expect(hanyaTanpaPeran(["DEAN"]) !== konteksPembelajaran(["DEAN"]).turBelajar,
        "gating the learner tour on holding no role is indistinguishable from gating it on the shell");

      // 2. NO ROLE EVER DECIDES WHAT LEARNING IS OFFERED. The entitlement RPC
      //    takes no argument at all, so nothing on this side of the wire can
      //    widen it; and the reading context is not in scope anywhere between
      //    the assignments being fetched and the list being ranked.
      const mesin = code(read("src/lib/assessment-engine/index.ts"));
      c.expect(/call\(db, "my_learning_assignments"\)/.test(mesin),
        "learning entitlement is not read from my_learning_assignments, or is read with arguments");
      const potong = (dari: string, sampai: string) => {
        const a = badan.indexOf(dari);
        const b = badan.indexOf(sampai);
        return a >= 0 && b > a ? badan.slice(a, b) : "";
      };
      const pipa = potong("const tugas = await engine.myAssignments", "const keadaan =");
      c.expect(pipa.length > 0, "the assignment pipeline could not be located, so nothing below is checked");
      c.expect(!/konteks/.test(pipa),
        "the reading context is in scope while the learning list is built, so a role could filter it");
      const sesudah = badan.slice(badan.indexOf("return ("));
      c.expect(sesudah.length > 0 && !/konteks[^.]/.test(pipa),
        "the reading context leaks into the pipeline");
      //    WATCHED ON A PLANT.
      c.expect(/konteks/.test(pipa.replace("await engine.myAssignments", "konteks.mengajar ? await engine.myAssignments")),
        "the pipeline scanner cannot see a context test inserted into it");

      //    AND THE SURFACE READS NO ROLE OF ITS OWN. `display_role` is display
      //    only by construction and is not what decides anything here; no file
      //    under the learning surface names it, a role string or the role table.
      const berkas = walk(join(repoRoot, "src", "app", "belajar"))
        .filter((f) => /\.tsx?$/.test(f))
        .map((f) => relative(repoRoot, f).replace(/\\/g, "/"))
        .concat(["src/components/CangkangPengalaman.tsx", "src/lib/pembelajaran.ts"]);
      for (const f of berkas) {
        const b = code(read(f));
        c.expect(!/display_role|displayRole/.test(b), `${f} decides something from display_role`);
        c.expect(!/\.from\("role_assignments"\)/.test(b), `${f} reads the role table directly`);
        c.expect(!/"STUDENT"|'STUDENT'/.test(b), `${f} names STUDENT, so somebody is being made one`);
      }

      // 3. WHOSE TOUR IT IS. The learner's first login is mounted only for
      //    somebody the rule says it belongs to, and its durable state is not
      //    even read otherwise — an unread tour spends no presentation.
      c.expect(/konteks\.turBelajar \? await keadaanTur\(TUR_BELAJAR\) : null/.test(badan),
        "the learner tour's state is read for people it does not belong to");
      c.expect(/\{konteks\.turBelajar \? \(/.test(badan) && /<Tur\b/.test(badan),
        "the learner first-login tour is mounted without asking whose tour it is");
      //    WATCHED ON A PLANT: ungating it must go red.
      const tanpaGerbang = badan.replace("{konteks.turBelajar ? (", "{true ? (");
      c.expect(!/\{konteks\.turBelajar \? \(/.test(tanpaGerbang),
        "the tour-gate scanner cannot see the gate being removed");

      // 4. IT IS A SECOND CONTEXT AND NOT A SWITCH. The shell offers two places
      //    to be and no control that changes who anybody is: no role picker, no
      //    mode, no second account, and nothing that writes an identity.
      c.expect(/nav\.pembelajaran/.test(cangkang), "the shell has no entry for the educator's own learning");
      const rute = [...cangkang.matchAll(/href="(\/[a-z/-]*)"/g)].map((m) => m[1]);
      for (const r of new Set(rute)) {
        const ada = existsSync(join(repoRoot, "src", "app", r.replace(/^\//, ""), "page.tsx"));
        c.expect(ada, `the shell offers ${r}, which is not a route`);
      }
      //    AND THE LONGER LABEL MUST NOT COST A TOUCH TARGET. "Pembelajaran
      //    Saya" is longer than any tab that shipped before it, and at 320px --
      //    an iPhone SE, and a width a great many of the phones PINTAR is used
      //    on report -- it needs two lines. MEASURED against the compiled
      //    stylesheet in an iframe at 320, 375, 390, 414 and 768, in both
      //    languages, with the learner's own two tabs as a control: a fixed
      //    `height` CLIPPED the second line, and moving the floor to the STRIP
      //    left the anchor sized by its own text at 32.5px -- which is the
      //    target a thumb actually hits. The floor therefore sits on the
      //    ANCHOR, so the target can only ever grow: every label that fitted
      //    before renders at 44px exactly as it did, and the one that does not
      //    gets 55px and is whole.
      const cssShell = read("src/app/experience.css");
      const telepon = cssShell.slice(cssShell.indexOf("@media (max-width: 560px)"));
      const blokTab = telepon.slice(telepon.indexOf(".pin-tabs"), telepon.indexOf(".pin-col {"));
      const aturanTab = blokTab.slice(blokTab.indexOf(".pin-tabs a"));
      c.expect(/min-height: 44px/.test(aturanTab),
        "the phone tab is not held to the minimum touch target");
      c.expect(/height: auto/.test(aturanTab),
        "the phone tab has a fixed height again, so a label needing two lines is clipped");
      // `\b` would match inside `min-height`, which is the floor this rule is
      // asking for: the lookbehind is what makes it a rule about a FIXED height.
      const TETAP = /(?<!min-)height: 44px/;
      c.expect(!TETAP.test(blokTab),
        "the phone tab pins a fixed height, which clips a label that needs two lines");
      //    WATCHED ON A PLANT: the rule as it was before WP6B must go red.
      c.expect(TETAP.test(blokTab.replace("height: auto; min-height: 44px", "height: 44px")),
        "the tab scanner cannot see the fixed height coming back");

      for (const f of berkas) {
        const b = code(read(f));
        c.expect(!/(ganti|tukar|alih|switch)\s*(peran|role|akun|account|mode)/i.test(b),
          `${f} carries a control that changes who somebody is`);
        // An unauthenticated redirect that returns the reader to the page they
        // asked for is the sign-in gate, not an account boundary: nobody
        // changes who they are by passing through it. Anything else -- a sign
        // out, or a redirect that lands somewhere other than back here -- is.
        const tanpaGerbangMasuk = b.replace(/redirect\([`"]\/masuk\?lanjut=\/belajar[^)]*\)/g, " ");
        c.expect(!/signOut|\/masuk/.test(tanpaGerbangMasuk),
          `${f} moves somebody through an account boundary to reach their own learning`);
      }

      // 5. THE BACKEND'S OWN VOCABULARY REACHES NO FILE HERE. Provenance is the
      //    database's business: the Experience renders what this person was
      //    assigned and never says, or knows, which kind of course it was.
      const MESIN_KATA = [
        "learning_context", "PROFESSIONAL_DEVELOPMENT", "academic_responses",
        "academic_certificates", "row_in_learning_context", "scoped_official_sessions",
      ];
      const semua = walk(join(repoRoot, "src")).filter((f) => /\.(ts|tsx)$/.test(f));
      for (const f of semua) {
        const rel = relative(repoRoot, f).replace(/\\/g, "/");
        const b = readFileSync(f, "utf8");
        for (const w of MESIN_KATA) {
          c.expect(!b.includes(w), `${rel} names the backend's ${w}, which no educator may meet`);
        }
      }

      c.note(`${berkas.length} file(s) on the learning surface, ${new Set(rute).size} shell route(s)`);
      return c.verdict(
        "an educator may also be learning, and nothing in the Experience decides that they may. The " +
        "reading context is a pure rule over the roles a person HOLDS -- driven through nine shapes: no " +
        "role, an educator, each of the four senior roles alone, an educator who is also senior in two " +
        "ways, and a failed read, which falls back to the product as it was. RANK NEVER DECIDES WHICH " +
        "TOUR IS PRESENTED: the tour follows the SHELL, asserted shape by shape, and watched on two " +
        "plants -- dropping the seniority rule, and gating the learner tour on holding no role, which " +
        "would quietly take the learner landing's own tour from every senior reader. WHAT IS " +
        "OFFERED IS NEVER DECIDED BY A ROLE: the entitlement RPC takes no argument, so nothing here can " +
        "widen it, and the reading context is provably out of scope between the assignments being " +
        "fetched and the list being ranked -- watched on a plant that inserts a context test into that " +
        "pipeline. No file on the learning surface reads display_role, the role table, or the word " +
        "STUDENT. The learner's first-login tour is mounted only where the shell it describes is the " +
        "shell on screen, and its durable state is not even read otherwise, so no automatic " +
        "presentation is spent on a page the tour does not map -- watched on a plant that removes the " +
        "gate. The shell offers two places to " +
        "be, both of them real routes, whose phone tab is held to the 44px touch target by a floor on the " +
        "TARGET rather than on the strip -- so the longer label gets a second line at 320px instead of " +
        "being clipped, and every label that fitted before renders exactly as it did, watched on a " +
        "plant that restores the fixed height. It carries no control that changes a role, an account " +
        "or a mode; and no " +
        "file under src names learning_context, PROFESSIONAL_DEVELOPMENT, the academic evidence " +
        "boundary or the scoped session source",
      );
    },
  },
  {
    id: "UX1-AJAR-KATA-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const read = (f: string) => readFileSync(join(repoRoot, f), "utf8");
      const KUNCI = [
        "nav.pembelajaran", "pembelajaran.eyebrow", "pembelajaran.milik",
        "pembelajaran.kosong", "pembelajaran.kosong_arti", "pembelajaran.sertifikat_arti",
      ] as const;

      // 1. DECLARED, IN BOTH LANGUAGES, AND RENDERED.
      const surfaces = ["src/app/belajar/page.tsx", "src/components/CangkangPengalaman.tsx"];
      const sumber = surfaces.map((f) => read(f)).join("\n");
      for (const k of KUNCI) {
        const row = telling(k as HleEvent);
        c.expect(typeof row?.default === "string" && row.default.trim().length > 0, `${k} has no Indonesian telling`);
        c.expect(typeof row?.en === "string" && (row.en as string).trim().length > 0, `${k} has no English telling`);
        c.expect(sumber.includes(k), `${k} is declared and never rendered`);
        for (const l of LOCALES) {
          const teks = t(k as HleEvent, "educator", { locale: l });
          c.expect(informal(teks).length === 0, `${k} addresses an educator informally in ${l}: ${informal(teks)[0]}`);
        }
      }
      //    None of them is hard-coded into a component.
      for (const f of surfaces) {
        const teks = [...code(read(f)).matchAll(/>\s*([A-Za-zÀ-ɏ][^<>{}\n]{6,})\s*</g)].map((m) => m[1].trim());
        for (const x of teks) {
          c.expect(!/[a-z]{3}\s+[a-z]{3}/.test(x), `${f} carries hard-coded copy: "${x.slice(0, 48)}"`);
        }
      }

      // 2. THE PERSONA THE LEARNING SURFACE CHOOSES CHANGES NO EXISTING
      //    SENTENCE. The page now addresses an educator where it used to
      //    address a learner, and that must be a statement about WHO is being
      //    spoken to rather than a silent rewrite of the copy a learner reads.
      //    Asserted over the whole table rather than trusted.
      let berbeda = 0;
      for (const k of allKeys()) {
        if (/^(studio\.|config\.|pimpinan\.|pendataan\.)/.test(k)) continue;
        for (const l of LOCALES) {
          if (t(k, "learner", { locale: l }) !== t(k, "educator", { locale: l })) berbeda++;
        }
      }
      c.expect(berbeda === 0,
        `${berbeda} telling(s) differ between a learner and an educator, so the learning surface's copy ` +
        "silently changes with who is reading it");

      // 3. IT NAMES NOBODY'S TEACHING. Not one word of this surface may read as
      //    a judgement about how well the person teaches, or as anything an
      //    employer would act on — that is the whole reason the evidence
      //    boundary exists, and copy is the way it would leak.
      const NILAI = new RegExp(
        [
          "efektivitas", "effectiveness", "kinerja", "performance",
          "peringkat", "\\brank(ed|ing|s)?\\b", "league",
          "penilaian guru", "teacher (score|rating|grade)", "skor guru",
          "promosi", "promotion", "sanksi", "disciplinary", "appraisal",
          "kompeten\\b", "incompeten", "tidak layak", "unfit",
          "dibanding(kan)? (guru|rekan|pengajar)", "compared (with|to) other (teachers|educators)",
          "guru (baik|buruk)", "(good|bad) teacher",
        ].join("|"),
        "i",
      );
      for (const k of KUNCI) {
        for (const l of LOCALES) {
          const teks = t(k as HleEvent, "educator", { locale: l });
          const m = NILAI.exec(teks);
          c.expect(m === null, `${k} judges the educator's teaching in ${l}: "${m?.[0]}"`);
        }
      }
      //    WATCHED ON A PLANT, so a sweep that matches nothing is not mistaken
      //    for a surface that says nothing wrong.
      c.expect(NILAI.test("Efektivitas mengajar Anda: 92%"),
        "the judgement sweep does not catch a teaching-effectiveness sentence");
      c.expect(NILAI.test("You are ranked 4th of 40 educators"),
        "the judgement sweep does not catch a ranking sentence");

      // 4. THE EMPTY SENTENCE IS THE MOST LOAD-BEARING ONE HERE. An educator
      //    with no learning must read an ordinary state of affairs — not a
      //    refusal, not a missing account, not something they have to go and
      //    fix, and above all not a hint that they are on the wrong kind of
      //    account.
      const SALAH = new RegExp(
        [
          "galat", "error", "gagal", "failed", "tidak dapat", "cannot",
          "tidak diizinkan", "tidak berhak", "not permitted", "denied", "refused",
          "izin", "permission", "hubungi", "contact", "administrator",
          "akun", "account", "daftar(kan)? diri", "sign up", "pengaturan", "settings",
          "murid", "siswa", "student",
        ].join("|"),
        "i",
      );
      for (const k of ["pembelajaran.kosong", "pembelajaran.kosong_arti"] as const) {
        for (const l of LOCALES) {
          const teks = t(k as HleEvent, "educator", { locale: l });
          const m = SALAH.exec(teks);
          c.expect(m === null, `the empty state reads as a problem in ${l} via ${k}: "${m?.[0]}"`);
        }
      }
      c.expect(/^Belum ada/.test(t("pembelajaran.kosong", "educator")),
        "the Indonesian empty sentence is not the 'not yet' construction the rest of the product uses");
      c.expect(SALAH.test("Anda belum punya akun murid."),
        "the empty-state sweep does not catch a sentence pointing at the wrong kind of account");

      // 5. AND IT SAYS WHOSE LEARNING IT IS. The one sentence that has to be
      //    there: this is yours, and it is not your teaching.
      for (const l of LOCALES) {
        const teks = t("pembelajaran.milik", "educator", { locale: l });
        c.expect(/(Anda|you)/i.test(teks), `the reassurance does not address the reader in ${l}`);
        c.expect(/(ajar|teach)/i.test(teks), `the reassurance does not say it is apart from their teaching in ${l}`);
      }
      c.expect(t("nav.pembelajaran", "educator") !== t("nav.belajar", "learner"),
        "the educator's own learning is named exactly what a learner's home is named");

      c.note(`${KUNCI.length} key(s), ${LOCALES.length} language(s), 0 learner/educator divergence(s)`);
      return c.verdict(
        "Pembelajaran Saya says whose learning it is and judges nobody. Every key is declared in both " +
        "languages, rendered, addressed formally, and hard-coded nowhere. THE PERSONA THIS SURFACE NOW " +
        "CHOOSES REWRITES NOTHING: every non-staff key in the table is compared between a learner and " +
        "an educator in both languages and not one differs, so addressing an educator is a statement " +
        "about who is being spoken to rather than a silent change to what a learner reads. No telling " +
        "here names teaching effectiveness, a performance score, a ranking or league position, a " +
        "comparison with other educators, an appraisal, a promotion or a sanction, or a good or bad " +
        "teacher -- watched on two plants. AND THE EMPTY STATE IS AN ORDINARY STATE OF AFFAIRS: it is " +
        "the same 'belum ada' construction the rest of the product uses, and in neither language does " +
        "it name a fault, a refusal, a permission, an administrator to contact, a setting to change or " +
        "an account to go and get -- watched on a plant that points at the wrong kind of account. What " +
        "it does say is that the learning is the reader's own and stands apart from the classes they " +
        "teach, in both languages, under a name that is not the learner home's",
      );
    },
  },
  {
    id: "UX1-UB-BISU-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const MIG = "supabase/migrations/20260930100000_a_class_speaks_and_no_one_is_named.sql";
      const mig = readFileSync(join(repoRoot, MIG), "utf8");

      // 1. THE SHAPES ARE WP7B'S OWN, READ OUT OF THE ENDPOINT. A fixture this
      //    file invented could drift from what `feedback_result` actually
      //    returns and go on passing, so the payloads rendered below are built
      //    from the keys the migration constructs.
      const terbuka = /'cycle_id', c\.id, 'state', 'OPEN',\s*'statement_key', '([a-z_.]+)'/.exec(mig)?.[1];
      c.expect(terbuka === "umpanbalik.hasil.belum_ditutup",
        `the open state's statement key is ${terbuka}, which this surface does not render`);
      const ditahanKunci = /\('FT-1', \d+, '([a-z_.]+)'/.exec(mig)?.[1];
      c.expect(ditahanKunci === PERNYATAAN_DITAHAN,
        `the threshold's statement key is ${ditahanKunci}, and the surface falls back to ${PERNYATAAN_DITAHAN}`);
      //    …and the withheld payload really does carry nothing else.
      const potonganDitahan = /'cycle_id', c\.id, 'state', 'WITHHELD'[^)]*\)/.exec(mig)?.[0] ?? "";
      c.expect(potonganDitahan.length > 0 && !/total|responses|entries|count/.test(potonganDitahan),
        `the withheld payload carries more than a statement: ${potonganDitahan.slice(0, 80)}`);

      // 2. RENDERED, AND WITHOUT A DIGIT IN IT. Both non-published states, both
      //    languages, text and geometry.
      const keadaan: Array<{ nama: string; muatan: unknown }> = [
        { nama: "open", muatan: { cycle_id: "c", state: "OPEN", statement_key: terbuka } },
        { nama: "withheld", muatan: { cycle_id: "c", state: "WITHHELD", statement_key: ditahanKunci } },
      ];
      for (const k of keadaan) {
        const hasil = bacaHasil(k.muatan);
        c.expect(hasil.jenis !== "terbit", `a ${k.nama} cycle was read as a published snapshot`);
        for (const l of LOCALES) {
          for (const persona of ["educator", "staff"] as const) {
            const pohon = HasilKelas({ hasil, locale: l, persona }) as Simpul;
            const teks = teksPohon(pohon).join(" ");
            const gaya = gayaPohon(pohon).join(" ");
            c.expect(!ADA_ANGKA.test(teks),
              `a ${k.nama} cycle renders a figure to a ${persona} in ${l}: "${teks.slice(0, 80)}"`);
            c.expect(!ADA_ANGKA.test(gaya),
              `a ${k.nama} cycle renders a proportion as geometry to a ${persona} in ${l}: "${gaya}"`);
          }
        }
      }

      // 3. THE WITHHELD SENTENCE IS THE CANONICAL ONE, WHOLE, WITH NOTHING
      //    APPENDED. Compared against the ruling's exact wording rather than
      //    against whatever the table happens to say.
      const KANONIK = {
        id: "Belum cukup tanggapan untuk menampilkan hasil dengan aman.",
        en: "There are not enough responses to display the results safely.",
      } as const;
      for (const l of LOCALES) {
        c.expect(t(PERNYATAAN_DITAHAN as HleEvent, "educator", { locale: l }) === KANONIK[l],
          `the canonical withheld statement in ${l} is not the ruled wording`);
        const pohon = HasilKelas({
          hasil: bacaHasil({ state: "WITHHELD", statement_key: PERNYATAAN_DITAHAN }),
          locale: l,
        }) as Simpul;
        c.expect(teksPohon(pohon).join("").trim() === KANONIK[l],
          `the withheld surface renders more than the statement in ${l}: ` +
          `"${teksPohon(pohon).join("").trim()}"`);
      }

      // 4. AND IT IS NOT THE ABSENCE CARD. `KartuKetiadaan` appends have/needed
      //    on purpose, because a STATISTICAL readiness floor is a fact a reader
      //    may act on. An ANONYMITY floor is the opposite, and reaching for the
      //    familiar component is exactly how the wrong one gets used.
      const permukaan = walk(join(repoRoot, "src", "app"))
        .concat(walk(join(repoRoot, "src", "components")))
        .concat(walk(join(repoRoot, "src", "lib")))
        .filter((f) => /\.tsx?$/.test(f))
        .map((f) => relative(repoRoot, f).replace(/\\/g, "/"))
        .filter((f) => /umpan-balik|umpanbalik/.test(f));
      c.expect(permukaan.length >= 6, `${permukaan.length} feedback file(s) found; the surface is not being read`);
      for (const f of permukaan) {
        // CODE, NOT PROSE. These files EXPLAIN at length why the absence card
        // is the wrong component here, and a guard that read the explanation as
        // a use would be a guard against documenting the decision.
        const body = code(readFileSync(join(repoRoot, f), "utf8"));
        c.expect(!/KartuKetiadaan|variantOf/.test(body),
          `${f} reaches for the absence card, which appends have/needed`);
        c.expect(!/belum_cukup_data|laporan\.metrik\./.test(body),
          `${f} renders the statistical-readiness copy, which names the shortfall`);
      }
      //    …and the scanner can still see a real use.
      c.expect(/KartuKetiadaan|variantOf/.test(code('import KartuKetiadaan from "x";\nconst a = 1;')),
        "the absence-card scanner cannot see an import of it");

      // 5. PLANTS. Each one is a way the number could come back, and each is
      //    shown to be caught.
      //    P1 — a response count carried alongside an OPEN state. The union has
      //    no field for it, so it must not survive the read.
      const p1 = bacaHasil({ state: "OPEN", statement_key: terbuka, total_responses: 3,
                             entries: [{ question_key: "q", label_key: "umpanbalik.pilihan.jarang", ordinal: 1,
                                         options: [{ option_key: "o", label_key: "umpanbalik.pilihan.jarang", ordinal: 1, responses: 3 }] }] });
      c.expect(p1.jenis === "terkumpul", "a response count smuggled into an open payload changed how it is read");
      c.expect(!ADA_ANGKA.test(teksPohon(HasilKelas({ hasil: p1 }) as Simpul).join(" ")),
        "a response count smuggled into an open payload reached the screen");
      //    P2 — the shortfall appended to the canonical sentence. The scanner
      //    must be able to see it; a sweep that matches nothing proves nothing.
      c.expect(ADA_ANGKA.test(`${KANONIK.id} (3/5)`),
        "the digit scanner cannot see a shortfall appended to the statement");
      c.expect(ADA_ANGKA.test(`${KANONIK.en} 3 dari 5`),
        "the digit scanner cannot see a shortfall written out");
      //    …and a doctored WITHHELD payload pointing at a key that is not the
      //    canonical statement falls back rather than rendering what it names.
      const p2 = bacaHasil({ state: "WITHHELD", statement_key: "umpanbalik.hasil.total" });
      c.expect(p2.jenis === "ditahan" && p2.kunciPernyataan === PERNYATAAN_DITAHAN,
        "a withheld cycle will render whatever statement key it is handed");
      //    P8's sibling: an unknown state is not a published one.
      for (const aneh of [null, {}, { state: "SOMETHING_ELSE" }, { state: "PUBLISHED" }]) {
        c.expect(bacaHasil(aneh).jenis !== "terbit",
          `${JSON.stringify(aneh)} was read as a published snapshot`);
      }
      //    The state map renders a sentence or nothing, never the enum.
      c.expect(keadaanKunci("OPEN") === "umpanbalik.keadaan.terbuka", "the open state has no telling");
      c.expect(keadaanKunci("SOMETHING_ELSE") === null, "an unknown state would render its own identifier");
      const enumMig = [...mig.matchAll(/create type public\.feedback_cycle_state as enum \(([^)]+)\)/g)][0]?.[1] ?? "";
      for (const v of ["OPEN", "PUBLISHED", "WITHHELD"]) {
        c.expect(enumMig.includes(`'${v}'`), `${v} is not one of the migration's states`);
        c.expect(keadaanKunci(v) !== null, `${v} has no telling`);
      }

      c.note(`${permukaan.length} feedback file(s), ${LOCALES.length} language(s), 2 non-published state(s)`);
      return c.verdict(
        "while a round is collecting, and forever after one that closed below the anonymity threshold, " +
        "the surface renders no response-derived number at all. The two payload shapes are READ OUT OF " +
        "the endpoint that produces them rather than invented here, the withheld one is asserted to " +
        "carry nothing but a statement, and both are RENDERED through the real component in both " +
        "languages for both readers -- with every text node AND every style value swept for a digit, " +
        "because a bar width is a proportion that no text scan would see. The withheld surface renders " +
        "the canonical ruled sentence and, character for character, nothing else. It is not the " +
        "statistical absence card and reaches for none of its copy, which appends have/needed on " +
        "purpose. WATCHED ON PLANTS: a response count smuggled into an open payload neither changes " +
        "how it is read nor reaches the screen; an appended shortfall is caught by the scanner in both " +
        "the bracketed and the written-out form; a withheld payload naming some other statement key " +
        "falls back to the canonical one instead of rendering what it was handed; a null, an empty " +
        "object, an unknown state and a published state with no marginals are none of them read as a " +
        "published snapshot; and an unrecognised state renders nothing rather than its own identifier",
      );
    },
  },
  {
    id: "UX1-UB-BATAS-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const MIG = "supabase/migrations/20260930100000_a_class_speaks_and_no_one_is_named.sql";
      const mig = readFileSync(join(repoRoot, MIG), "utf8");

      // 1. THE SNAPSHOT'S SHAPE IS THE ENDPOINT'S. Read out of the two places
      //    that build it — `close_feedback_cycle` writes the body and
      //    `feedback_result` returns it — so a fixture below cannot drift into
      //    proving something about a payload the backend never sends.
      const dibangun = /'cycle_id', c\.id, 'state', 'PUBLISHED',([\s\S]*?)\);/.exec(mig)?.[1] ?? "";
      for (const medan of ["total_responses", "entries"]) {
        c.expect(dibangun.includes(medan), `the published payload no longer carries ${medan}`);
      }
      const marginal = /'option_key', o\.option_key,([\s\S]*?)order by o\.ordinal/.exec(mig)?.[1] ?? "";
      c.expect(/'responses', \(select count\(\*\) from public\.feedback_responses/.test(marginal),
        "the marginal is no longer a per-option count over the responses");
      //    AND THE PAYLOAD NAMES NOBODY. The construction is read for any field
      //    that could be a person; there is none, and this is the assertion
      //    that would notice one being added.
      c.expect(!/person|respondent|display_name|auth_user|submitted_at|created_at/.test(dibangun + marginal),
        "the published payload carries a field that could identify or order a respondent");

      // 2. RENDERED, AND ONLY THE THREE THINGS §12 ALLOWS.
      const muatan = {
        cycle_id: "c", state: "PUBLISHED", question_set_version: "FQ-1", threshold_version: "FT-1",
        total_responses: 7, produced_at: "2026-09-22T00:00:00Z",
        entries: [{
          question_key: "penjelasan_jelas", label_key: "umpanbalik.pertanyaan.penjelasan_jelas", ordinal: 1,
          options: [
            { option_key: "jarang", label_key: "umpanbalik.pilihan.jarang", ordinal: 1, responses: 1 },
            { option_key: "kadang", label_key: "umpanbalik.pilihan.kadang", ordinal: 2, responses: 2 },
            { option_key: "sering", label_key: "umpanbalik.pilihan.sering", ordinal: 3, responses: 3 },
            { option_key: "selalu", label_key: "umpanbalik.pilihan.selalu", ordinal: 4, responses: 1 },
          ],
        }],
      };
      const hasil = bacaHasil(muatan);
      c.expect(hasil.jenis === "terbit", "a real published snapshot was not read as one");
      if (hasil.jenis === "terbit") {
        c.expect(hasil.total === 7, `the published total became ${hasil.total}`);
        const pohon = HasilKelas({ hasil, locale: "id" }) as Simpul;
        const teks = teksPohon(pohon).join(" ");
        //    The total and every marginal are present…
        c.expect(teks.includes("7"), "the published total does not render");
        for (const o of ["Jarang", "Kadang", "Sering", "Selalu"]) {
          c.expect(teks.includes(o), `the option "${o}" does not render`);
        }
        c.expect(teks.includes(t("umpanbalik.pertanyaan.penjelasan_jelas", "educator")),
          "the governed question does not render");
        //    …and the numbers on the page are EXACTLY the total and the four
        //    marginals. Not a percentage, not a mean, not a rank, not a
        //    composite: a surface that had computed anything from these would
        //    have put another figure here.
        const angka = teks.match(/[0-9]+/g) ?? [];
        c.expect(angka.sort().join(",") === ["7", "1", "2", "3", "1"].sort().join(","),
          `the published surface renders figures the snapshot does not contain: ${angka.join(",")}`);
      }

      //    THE ONLY ARITHMETIC IN THE MODULE, driven. The bar is a share of the
      //    PUBLISHED total and of nothing else: it cannot exceed the bar, it
      //    cannot go below it, and a total of zero yields no bar rather than a
      //    division that would render as NaN%.
      c.expect(bagian(0, 0) === 0, "a snapshot with no responses produces a bar of some width");
      c.expect(bagian(3, 0) === 0, "a marginal with no total produces a bar");
      c.expect(bagian(7, 7) === 100, "a unanimous marginal does not fill its bar");
      c.expect(bagian(1, 4) === 25, `a quarter renders as ${bagian(1, 4)}`);
      c.expect(bagian(99, 7) === 100 && bagian(-5, 7) === 0, "the bar is not clamped to its own ends");

      // 3. A RESPONDENT PLANTED INTO THE PRESENTATION PIPELINE CANNOT SURFACE.
      //    §26/P3. The projection is by a fixed key list, so an extra field on
      //    an entry, on an option and on the envelope is dropped rather than
      //    carried through to a component that might one day render it.
      const ditanam = {
        ...muatan,
        respondent_names: ["Budi", "Siti"],
        entries: [{
          ...muatan.entries[0],
          respondent_id: "11111111-1111-1111-1111-111111111111",
          options: muatan.entries[0].options.map((o) => ({
            ...o, person_id: "22222222-2222-2222-2222-222222222222", display_name: "Budi",
            submitted_at: "2026-09-22T09:00:00Z",
          })),
        }],
      };
      const bocor = bacaHasil(ditanam);
      const teksBocor = teksPohon(HasilKelas({ hasil: bocor, locale: "id" }) as Simpul).join(" ");
      for (const jejak of ["Budi", "Siti", "11111111", "22222222", "2026-09-22", "09:00"]) {
        c.expect(!teksBocor.includes(jejak),
          `a respondent field planted into the published pipeline reached the screen: ${jejak}`);
      }
      c.expect(JSON.stringify(bocor).indexOf("Budi") === -1,
        "a respondent field planted into the published pipeline survived the read");
      //    The plant is real: the fields ARE in the payload it was given.
      c.expect(JSON.stringify(ditanam).includes("Budi"),
        "the plant carries no respondent field, so this case proves nothing");

      // 4. NO WAY FROM A MARGINAL TO A PERSON. §12: no "view responses", and no
      //    option that is clickable into anybody.
      const berkas = walk(join(repoRoot, "src", "app"))
        .concat(walk(join(repoRoot, "src", "components")))
        .concat(walk(join(repoRoot, "src", "lib")))
        .filter((f) => /\.tsx?$/.test(f))
        .map((f) => relative(repoRoot, f).replace(/\\/g, "/"))
        .filter((f) => /umpan-balik|umpanbalik/.test(f));
      const marginalKode = code(readFileSync(join(repoRoot, "src/components/umpanbalik/HasilKelas.tsx"), "utf8"));
      c.expect(!/<Link|href=|onClick|router\./.test(marginalKode),
        "an option in the published distribution is a control that leads somewhere");

      // 5. THE RAW ANSWERS ARE NEVER READ, AND NOTHING IS AGGREGATED HERE.
      //    §27/P4. The snapshot is computed once, at close, by the endpoint.
      for (const f of berkas) {
        const body = code(readFileSync(join(repoRoot, f), "utf8"));
        c.expect(!/feedback_responses/.test(body), `${f} reads the raw response table`);
        c.expect(!/feedback_opportunities/.test(body),
          `${f} reads the eligibility table, which is the identity-bearing half`);
        c.expect(!/\breduce\(|\bgroupBy|countBy/.test(body), `${f} aggregates rows of its own`);
      }
      //    The whole tree, not just this surface: a second path to a number
      //    somewhere else is the same defect in a different file.
      for (const f of walk(join(repoRoot, "src")).filter((x) => /\.tsx?$/.test(x))) {
        const rel = relative(repoRoot, f).replace(/\\/g, "/");
        c.expect(!code(readFileSync(f, "utf8")).includes("feedback_responses"),
          `${rel} reads the raw response table`);
      }
      c.expect(/feedback_responses/.test(code('const x = "feedback_responses";')),
        "the raw-response scanner cannot see a reference to the table");
      //    And the only feedback endpoints the surface calls are the governed
      //    ones, compared against WP7B's own client registry.
      const dipanggil = new Set<string>();
      for (const f of berkas.concat(["src/app/belajar/umpan-balik/actions.ts"])) {
        const body = code(readFileSync(join(repoRoot, f), "utf8"));
        for (const m of body.matchAll(/rpc\("([a-z_]+)"/g)) dipanggil.add(m[1]);
      }
      // The governed endpoints this Experience may call, declared. WP7D adds
      // the three Management operations: ending a round, naming the educators
      // a class may be asked about, and asking. Every one is registered as a
      // client endpoint, and the assertion below reads BOTH feedback
      // migrations for that — `feedback_subjects_for_class` arrived in the
      // WP7D unblocker rather than in WP7B, and a registry check that only
      // ever read one file would have called a governed endpoint ungoverned.
      const SAH = new Set([
        "my_feedback_cycles", "feedback_questionnaire", "feedback_result", "submit_feedback",
        "close_feedback_cycle", "open_feedback_cycle", "feedback_subjects_for_class",
      ]);
      const daftarRpc = mig + readFileSync(
        join(repoRoot, "supabase/migrations/20261001100000_management_can_name_the_teacher_it_asks_about.sql"),
        "utf8",
      );
      for (const r of dipanggil) {
        c.expect(SAH.has(r), `the feedback surface calls ${r}, which is not one of the governed endpoints`);
        c.expect(new RegExp(`values \\('${r}', '(LEARNER|STAFF)'`).test(daftarRpc),
          `${r} is not registered as a client endpoint by the feedback migrations`);
      }
      c.expect(dipanggil.size >= 3, `${dipanggil.size} governed endpoint(s) reached; the surface is not being read`);

      c.note(`${berkas.length} feedback file(s), ${dipanggil.size} governed endpoint(s), 1 snapshot rendered`);
      return c.verdict(
        "the published snapshot is everything that renders and nobody is in it. Its SHAPE is read out " +
        "of the two places WP7B builds it, which is also where this asserts the construction carries " +
        "no person, no respondent and no clock -- the assertion that would notice one being added. " +
        "Rendered, the surface carries the final total, the governed question and the four per-option " +
        "marginals, and the digits on the page are EXACTLY those five figures: no percentage, no mean, " +
        "no rank and no composite, because a surface that computed one would have put it there. A " +
        "RESPONDENT PLANTED INTO THE PIPELINE CANNOT SURFACE -- names, person ids and a submission " +
        "timestamp injected at the envelope, the entry and the option are all dropped by the " +
        "fixed-key projection and reach neither the read nor the screen, with the plant asserted to " +
        "really carry them. No marginal is a control that leads anywhere, so no distribution is " +
        "clickable into a person. AND NOTHING IS AGGREGATED HERE: no feedback file reads the raw " +
        "response table or the identity-bearing eligibility table or folds rows of its own, no file " +
        "anywhere under src names the response table at all, the scanner is shown to catch one, and " +
        "every endpoint the surface calls is one of the four WP7B registers for clients",
      );
    },
  },
  {
    id: "UX1-UB-KATA-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const MIG = "supabase/migrations/20260930100000_a_class_speaks_and_no_one_is_named.sql";
      const mig = readFileSync(join(repoRoot, MIG), "utf8");
      const kunci = allKeys().filter((k) => k.startsWith("umpanbalik."));

      // 1. EVERY KEY WP7B STORES HAS WORDS, IN BOTH LANGUAGES. The label keys
      //    are read out of the migration, so a governed question or option
      //    without a telling is a failing test rather than a blank line on a
      //    child's screen.
      const soal = [...mig.matchAll(/\('FQ-1', '[a-z_]+',\s+\d+, '([a-z_.]+)'\)/g)].map((m) => m[1]);
      c.expect(soal.length === 5, `${soal.length} governed question(s) in FQ-1; v1 has five`);
      const opsi = [...mig.matchAll(/\('([a-z]+)', \d+::smallint\)/g)].map((m) => `umpanbalik.pilihan.${m[1]}`);
      c.expect(opsi.length === 4, `${opsi.length} governed option(s) in FQ-1; v1 has four`);
      for (const k of [...soal, ...opsi, PERNYATAAN_DITAHAN]) {
        const row = telling(k as HleEvent);
        c.expect(row !== undefined, `WP7B stores ${k} and the localization layer has no words for it`);
        if (row) {
          c.expect(typeof row.default === "string" && row.default.trim().length > 0, `${k} has no Indonesian`);
          c.expect(typeof row.en === "string" && (row.en as string).trim().length > 0, `${k} has no English`);
        }
      }
      for (const k of kunci) {
        const row = telling(k as HleEvent);
        c.expect(typeof row?.default === "string" && row.default.trim().length > 0, `${k} has no Indonesian`);
        c.expect(typeof row?.en === "string" && (row.en as string).trim().length > 0, `${k} has no English`);
        for (const l of LOCALES) {
          const teks = t(k as HleEvent, "learner", { locale: l });
          c.expect(informal(teks).length === 0, `${k} is informal in ${l}: ${informal(teks)[0]}`);
        }
      }
      //    NOT DECLARED STAFF-ONLY, deliberately: a learner reads most of this
      //    prefix, so exempting it from the internal-word sweep would exempt
      //    the questions a child is asked.
      const hle = readFileSync(join(repoRoot, "src/lib/hle.ts"), "utf8");
      c.expect(!/STAFF_ONLY_PREFIXES = \[[^\]]*"umpanbalik\./.test(hle),
        "the feedback copy is declared staff-only, which exempts a learner's own questions from the sweep");

      // 2. NO ABSOLUTE ANONYMITY CLAIM. §4: WP7B accepts two residuals —
      //    unanimity implies an individual answer, and privileged
      //    infrastructure can reconstruct linkage — so a promise that nobody
      //    can ever know would be a promise the architecture does not make.
      const MUTLAK = new RegExp(
        [
          "sepenuhnya anonim", "benar-benar anonim", "sepenuhnya rahasia",
          "100\\s*%\\s*anonim", "anonim\\s*100", "completely anonymous", "fully anonymous",
          "totally anonymous", "100\\s*%\\s*anonymous", "entirely anonymous",
          "tidak (akan )?(ada|seorang pun|siapa pun) (yang )?(bisa|dapat|akan) (tahu|mengetahui)",
          "tidak mungkin (di)?(ketahui|lacak|identifikasi)", "mustahil",
          "no one can (ever )?know", "nobody can (ever )?know", "impossible to identify",
          "cannot be traced", "untraceable", "never be identified",
        ].join("|"), "i",
      );
      for (const k of kunci) {
        for (const l of LOCALES) {
          const m = MUTLAK.exec(t(k as HleEvent, "learner", { locale: l }));
          c.expect(m === null, `${k} overclaims anonymity in ${l}: "${m?.[0]}"`);
        }
      }
      //    POSITIVE CONTROLS, so a sweep that matches nothing is not mistaken
      //    for copy that claims nothing.
      for (const contoh of [
        "Jawaban Anda sepenuhnya anonim.", "Ini 100% anonim.",
        "Tidak ada yang bisa tahu apa yang Anda jawab.",
        "Your answer is completely anonymous.", "It is impossible to identify you.",
        "Nobody can know what you answered.",
      ]) {
        c.expect(MUTLAK.test(contoh), `the anonymity sweep does not catch "${contoh}"`);
      }
      //    AND WHAT IT DOES SAY IS THE ACCURATE THING: the answers are not
      //    shown next to a name, and what the teacher gets is the class.
      const privasi = { id: t("umpanbalik.form.privasi", "learner"),
                        en: t("umpanbalik.form.privasi", "learner", { locale: "en" }) };
      c.expect(/nama/i.test(privasi.id) && /name/i.test(privasi.en),
        "the privacy sentence does not say the answers are not shown with a name");
      //    No database internals reach a learner (§4).
      const MESIN = /xmin|WAL|service.role|superuser|RLS|postgres|transaksi basis data|row.level/i;
      for (const k of kunci) {
        for (const l of LOCALES) {
          const m = MESIN.exec(t(k as HleEvent, "learner", { locale: l }));
          c.expect(m === null, `${k} names database machinery in ${l}: "${m?.[0]}"`);
        }
      }
      c.expect(MESIN.test("Tidak bisa direkonstruksi lewat xmin."), "the machinery sweep catches nothing");

      // 3. NOBODY IS SCORED. §13: the result describes what respondents
      //    selected, and PINTAR does not turn that into a verdict about a
      //    person's employment.
      const VONIS = new RegExp(
        [
          "efektivitas", "effectiveness", "kinerja", "performance",
          "peringkat", "\\brank(ed|ing|s)?\\b", "league", "papan\\s*peringkat", "leaderboard",
          "skor (guru|keseluruhan|total)", "(overall|composite|total) (score|rating)",
          "nilai rata-rata guru", "penilaian kinerja", "appraisal",
          "promosi", "promotion", "sanksi", "sanction", "disciplinary", "teguran",
          "guru (terbaik|terburuk|baik|buruk)", "(good|bad|best|worst) (teacher|educator)",
          "dibanding(kan)? (guru|rekan|pengajar) (lain|lainnya)",
          "compared (with|to) other (teachers|educators)",
          "bintang", "\\bstar rating\\b",
        ].join("|"), "i",
      );
      for (const k of kunci) {
        for (const persona of ["learner", "educator", "staff"] as const) {
          for (const l of LOCALES) {
            const m = VONIS.exec(t(k as HleEvent, persona, { locale: l }));
            c.expect(m === null, `${k} scores the educator for a ${persona} in ${l}: "${m?.[0]}"`);
          }
        }
      }
      for (const contoh of [
        "Skor efektivitas mengajar: 82.", "Peringkat 4 dari 40 guru.",
        "Teaching effectiveness score", "You are ranked 3rd among educators",
        "Overall rating: 4.2", "Guru terbaik bulan ini", "Bintang: 4 dari 5",
      ]) {
        c.expect(VONIS.test(contoh), `the verdict sweep does not catch "${contoh}"`);
      }
      //    …and the code computes none of it either. No mean of the four-point
      //    scale, no weighting, no total beyond the one the snapshot carries.
      const berkas = walk(join(repoRoot, "src", "app"))
        .concat(walk(join(repoRoot, "src", "components")))
        .concat(walk(join(repoRoot, "src", "lib")))
        .filter((f) => /\.tsx?$/.test(f))
        .map((f) => relative(repoRoot, f).replace(/\\/g, "/"))
        .filter((f) => /umpan-balik|umpanbalik/.test(f));
      for (const f of berkas) {
        const body = code(readFileSync(join(repoRoot, f), "utf8"));
        c.expect(!/\.sort\(\s*\(a, ?b\)\s*=>\s*b\./.test(body), `${f} orders something best-first`);
        c.expect(!/ordinal\s*\*|\*\s*ordinal|weight|bobot|rata2|rerata|average\(/.test(body),
          `${f} turns the four-point scale into a figure`);
      }

      // 4. NO FREE TEXT ANYWHERE ON THE SHEET. §6/P7. The largest
      //    re-identification channel a feedback form can have.
      const lembar = code(readFileSync(join(repoRoot, "src/components/umpanbalik/LembarUmpanBalik.tsx"), "utf8"));
      for (const bidang of ["textarea", 'type="text"', 'type="search"', "contentEditable", "komentar", "catatan"]) {
        c.expect(!lembar.includes(bidang), `the feedback sheet carries a free-text field: ${bidang}`);
      }
      c.expect(/type="radio"/.test(lembar), "the feedback sheet has no closed options at all");
      c.expect(code('<textarea id="x" />').includes("textarea"),
        "the free-text scanner cannot see a textarea");
      //    The whole sheet is required, agreeing with the endpoint.
      const kuesioner: Kuesioner = {
        cycle_id: "c", class_name: "5A", subject_name: "Guru", already_answered: false,
        questions: soal.map((label_key, i) => ({
          question_key: `q${i}`, label_key, ordinal: i + 1,
          options: [{ option_key: "jarang", label_key: "umpanbalik.pilihan.jarang", ordinal: 1 }],
        })),
      };
      c.expect(!lengkap(kuesioner, {}), "an empty sheet is treated as complete");
      c.expect(!lengkap(kuesioner, { q0: "jarang" }), "a partly answered sheet is treated as complete");
      const semua = Object.fromEntries(kuesioner.questions.map((q) => [q.question_key, "jarang"]));
      c.expect(lengkap(kuesioner, semua), "a whole sheet is not treated as complete");
      c.expect(!lengkap(kuesioner, { ...semua, q0: "tidak_ada_pilihan_ini" }),
        "an answer that is not one of the offered options is treated as complete");

      //    AND THE GEOMETRY CAN HOLD THE WORDS. §19/P8. MEASURED against the
      //    compiled stylesheet at 320, 375, 390, 414 and 768 in both languages,
      //    with the longest realistic class and educator names: zero horizontal
      //    overflow and zero clipped label on all forty renders. Two rules make
      //    that true and both are easy to undo by accident, so both are held
      //    here rather than left to the next measurement to rediscover.
      const css = readFileSync(join(repoRoot, "src/app/experience.css"), "utf8");
      const blokUb = css.slice(css.indexOf("WP7C — ANONYMOUS STUDENT"));
      c.expect(blokUb.length > 0, "the feedback stylesheet block could not be located");
      //    (a) an option is sized by its own word, with a floor and no ceiling.
      const aturanOpsi = blokUb.slice(blokUb.indexOf(".pin-ub-opsi {"), blokUb.indexOf(".pin-ub-opsi:hover"));
      c.expect(/min-height: 44px/.test(aturanOpsi), "the option control has no touch-target floor");
      c.expect(!/(?<!min-)(?:height|width):\s*\d/.test(aturanOpsi),
        "the option control pins a fixed size, which clips the longer of two languages");
      //    (b) the marginal's label takes its own row, so no column has to be
      //    wide enough for a word nobody has written yet.
      const marg = blokUb.slice(blokUb.indexOf(".pin-ub-marginal > li"), blokUb.indexOf(".pin-ub-batang {"));
      c.expect(/grid-template-columns: 1fr auto/.test(marg) && /grid-column: 1 \/ -1/.test(marg),
        "the option label shares a row with the bar, so a long one is squeezed");
      c.expect(!/\dch/.test(marg), "the marginal sizes a column in characters");
      //    (c) the send control's floor is declared where it can actually hold:
      //    `.pin-actions .pin-btn` carries two classes and beat a one-class
      //    rule on specificity, which measured as a 40px target on a phone.
      c.expect(/\.pin-actions \.pin-ub-btn \{[^}]*min-height: 44px/.test(blokUb),
        "the send control's touch-target floor is declared where the phone rule outranks it");
      //    The scanners can see the things they refuse.
      c.expect(/(?<!min-)(?:height|width):\s*\d/.test("height: 40px;"),
        "the fixed-geometry scanner cannot see a pinned height");
      c.expect(!/(?<!min-)(?:height|width):\s*\d/.test("min-height: 44px;"),
        "the fixed-geometry scanner mistakes a floor for a ceiling");
      c.expect(/\dch/.test("grid-template-columns: minmax(6ch, 12ch) 1fr;"),
        "the character-sizing scanner cannot see a ch column");

      // 5. THE OUTCOME MAP IS WP7B'S OWN SENTENCES, BOTH WAYS. A phrase the
      //    endpoint raises that has no outcome here would reach a learner as a
      //    developer's sentence; a phrase here the endpoint never raises is
      //    dead copy that will quietly rot.
      for (const { frasa } of SEBAB) {
        c.expect(mig.includes(frasa), `the surface maps "${frasa}", which WP7B never raises`);
      }
      //    THE REVERSE DIRECTION IS SCOPED TO WHAT A LEARNER CAN ACTUALLY
      //    REACH: `submit_feedback`'s own body, plus the response trigger that
      //    fires inside it. The migration raises two dozen other sentences —
      //    integrity guards on the cycle and eligibility tables, and the
      //    Management endpoints — and none of them is reachable by pressing
      //    Send, so requiring a learner-facing outcome for them would be
      //    requiring copy for a screen nobody can be on.
      const badanKirim = mig.slice(
        mig.indexOf("create function public.submit_feedback"),
        mig.indexOf("comment on function public.submit_feedback"),
      );
      c.expect(badanKirim.length > 0,
        "the submission endpoint could not be located, so nothing below is checked");
      const raises = [...badanKirim.matchAll(/raise exception '([^':]+)/g)].map((m) => m[1].trim());
      c.expect(raises.length >= 8, `${raises.length} refusal(s) found in the endpoint; the slice is wrong`);
      for (const r of raises) {
        c.expect(SEBAB.some(({ frasa }) => r.includes(frasa) || frasa.includes(r)),
          `WP7B raises "${r}" at a learner and the surface has no sentence for it`);
      }
      //    The response trigger fires INSIDE that endpoint, and one of its
      //    refusals is genuinely reachable: a round that closes between the
      //    state check and the insert. It is mapped. Its other three are
      //    integrity assertions about rows `submit_feedback` has already
      //    validated — unreachable by pressing Send, and if one ever did fire
      //    it lands in `tak_pasti`, which re-reads the learner's own durable
      //    state and answers from that rather than from the sentence. That
      //    fallback is why an unmapped refusal is a wording gap and never a
      //    wrong thing said to a learner.
      const badanPemicu = mig.slice(
        mig.indexOf("create function public.enforce_feedback_response"),
        mig.indexOf("create table public.feedback_results"),
      );
      c.expect(/this feedback cycle is closed and accepts no further answers/.test(badanPemicu),
        "the response trigger no longer refuses a closed cycle, so the mapped race cannot happen");
      c.expect(sebabKirim("this feedback cycle is closed and accepts no further answers") === "tutup",
        "the one trigger refusal a race can produce has no outcome");
      c.expect(sebabKirim("some error nobody has ever seen") === "tak_pasti",
        "an unrecognised failure is reported as something definite");
      c.expect(sebabKirim(null) === "tak_pasti", "a missing message is reported as something definite");
      c.expect(sebabKirim("you have already answered this feedback cycle") === "sudah",
        "a lost-acknowledgement replay is not recognised");
      c.expect(sudahTercatat("sudah") && sudahTercatat("tercatat"),
        "a recorded sheet is not treated as recorded");
      for (const s of ["tutup", "bukan_milik", "belum_lengkap", "belum_terkirim", "tak_pasti"] as const) {
        c.expect(!sudahTercatat(s), `${s} is treated as a recorded sheet`);
      }
      //    AND NO OUTCOME TELLS A LEARNER TO SEND AGAIN BLINDLY.
      const LAGI = /coba lagi|kirim lagi|ulangi|try again|resend|send it again/i;
      for (const l of LOCALES) {
        const teks = t("umpanbalik.kirim.tak_pasti" as HleEvent, "learner", { locale: l });
        c.expect(!LAGI.test(teks), `the uncertain outcome tells a learner to send again in ${l}`);
      }
      c.expect(LAGI.test("Silakan coba lagi."), "the blind-retry sweep catches nothing");

      // 6. NO ADMINISTRATOR ENTRY POINT. §16: WP7B gives these roles nothing
      //    here, so the product offers them nothing — not even a door that
      //    fails after they have walked through it.
      const konfigurasi = code(readFileSync(join(repoRoot, "src/app/konfigurasi/page.tsx"), "utf8"));
      c.expect(!/umpan-balik|umpanbalik/.test(konfigurasi),
        "the configuration surface offers a feedback entry point");
      const semuaBerkas = walk(join(repoRoot, "src", "app")).filter((f) => /\.tsx$/.test(f));
      for (const f of semuaBerkas) {
        const rel = relative(repoRoot, f).replace(/\\/g, "/");
        if (/^src\/app\/(belajar|mengajar|pimpinan)\//.test(rel)) continue;
        c.expect(!/href=\{?["`][^"`]*umpan-balik/.test(code(readFileSync(f, "utf8"))),
          `${rel} links into the feedback surface from outside the three experiences that own it`);
      }

      c.note(`${kunci.length} key(s), ${soal.length} question(s), ${opsi.length} option(s), ` +
        `${SEBAB.length} outcome phrase(s), 20 positive control(s)`);
      return c.verdict(
        "the feedback copy is accurate about privacy and is a verdict about nobody. Every label key " +
        "WP7B STORES has words in both languages -- the five questions and four options are read out " +
        "of the migration, so a governed question without a telling is a failing test rather than a " +
        "blank line on a child's screen -- and the prefix is deliberately NOT staff-only, because a " +
        "learner reads most of it. NO ABSOLUTE ANONYMITY CLAIM survives the sweep in either language, " +
        "watched on six positive controls, because WP7B accepts a unanimity residual and a privileged- " +
        "infrastructure residual and a promise that nobody can ever know is a promise it does not " +
        "make; what the copy says instead is the accurate thing, that the answers are not shown with a " +
        "name and the teacher receives the class. No database machinery reaches a learner. NOBODY IS " +
        "SCORED: no telling for any of the three readers names effectiveness, performance, a ranking, " +
        "a league table, an overall or composite score, an appraisal, a promotion, a sanction, a " +
        "good or bad teacher, a comparison with other educators or a star, watched on seven positive " +
        "controls -- and no file turns the four-point scale into a figure or orders anything " +
        "best-first. THE SHEET HAS NOWHERE TO TYPE: no textarea, no text or search input, no " +
        "contenteditable and no comment field, with the scanner shown to catch one, and the whole " +
        "sheet is required including against an option that was never offered. The outcome map is " +
        "compared with WP7B's own raised sentences IN BOTH DIRECTIONS, an unrecognised failure is " +
        "reported as uncertain rather than as anything definite, a lost-acknowledgement replay is " +
        "recognised as recorded, and no outcome tells a learner to send again blindly. And no " +
        "administrator is offered a way in: the configuration surface links to none of this, and no " +
        "file outside the three experiences that own it links into it either",
      );
    },
  },
  {
    id: "UX1-UB-TUTUP-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const MIG = "supabase/migrations/20260930100000_a_class_speaks_and_no_one_is_named.sql";
      const mig = readFileSync(join(repoRoot, MIG), "utf8");
      const AKSI = "src/app/pimpinan/[simpul]/umpan-balik/actions.ts";
      const KONTROL = "src/components/umpanbalik/TutupPutaran.tsx";
      const HALAMAN = "src/app/pimpinan/[simpul]/umpan-balik/[siklus]/page.tsx";
      const aksi = code(readFileSync(join(repoRoot, AKSI), "utf8"));
      const kontrol = code(readFileSync(join(repoRoot, KONTROL), "utf8"));
      const halaman = code(readFileSync(join(repoRoot, HALAMAN), "utf8"));

      // 1. THE FRONTEND NEVER LEARNS WHAT THE ROUND BECAME. §9/P2.
      //    `close_feedback_cycle` RETURNS the new state, and the whole boundary
      //    rests on that return being thrown away: a client that read it would
      //    know which side of the anonymity threshold the round fell on, which
      //    is the one bit a threshold exists to withhold.
      const badanTutup = mig.slice(
        mig.indexOf("create function public.close_feedback_cycle"),
        mig.indexOf("comment on function public.close_feedback_cycle"),
      );
      c.expect(badanTutup.length > 0, "the close endpoint could not be located");
      c.expect(/'state', v_to/.test(badanTutup),
        "the endpoint no longer returns a state, so there is nothing for the surface to be refusing");
      //    …and the action destructures ONLY the error.
      c.expect(/const \{ error \} = await c\.rpc\("close_feedback_cycle"/.test(aksi),
        "the close action takes more than the error from the endpoint's answer");
      c.expect(!/\bdata\b/.test(aksi.slice(aksi.indexOf("close_feedback_cycle"))),
        "the close action reads the endpoint's returned payload");
      for (const dilarang of ["PUBLISHED", "WITHHELD", "total_responses", "minimum_responses"]) {
        c.expect(!aksi.includes(dilarang), `the close action names ${dilarang}`);
        c.expect(!kontrol.includes(dilarang), `the close control names ${dilarang}`);
      }

      // 2. NO THRESHOLD IS READ, ANYWHERE ON THE FEEDBACK SURFACE. §9/P2.
      const berkas = walk(join(repoRoot, "src"))
        .filter((f) => /\.tsx?$/.test(f))
        .map((f) => relative(repoRoot, f).replace(/\\/g, "/"));
      const umpan = berkas.filter((f) => /umpan-balik|umpanbalik/.test(f));
      c.expect(umpan.length >= 8, `${umpan.length} feedback file(s); the surface is not being read`);
      for (const f of berkas) {
        const b = code(readFileSync(join(repoRoot, f), "utf8"));
        c.expect(!/feedback_thresholds|minimum_responses|current_feedback_threshold/.test(b),
          `${f} reads the anonymity threshold`);
      }
      c.expect(/feedback_thresholds/.test(code('const x = "feedback_thresholds";')),
        "the threshold scanner cannot see a read of the table");

      // 3. THE OFFER IS THE STATE AND NOTHING ELSE, and a terminal round is
      //    offered nothing at all. §10/P4.
      c.expect(bolehDitutup("OPEN"), "an open round cannot be closed");
      for (const k of ["PUBLISHED", "WITHHELD", "", null, undefined, "SOMETHING_ELSE"]) {
        c.expect(!bolehDitutup(k), `${JSON.stringify(k)} is offered a close control`);
      }
      c.expect(/bolehDitutup\(c\.keadaan\)/.test(halaman),
        "the page offers the close control without asking the round's state");
      //    NO SECOND TRANSITION EXISTS IN THE PRODUCT. Not as a control, not as
      //    a copy key, not as a call.
      // `force` alone matched Next's own `export const dynamic = "force-dynamic"`
      // on every page, which is a rendering directive and not a transition. The
      // rule is about a SECOND WAY TO MOVE A ROUND, so each word is required to
      // be next to the thing it would be forcing.
      const TERLARANG =
        /reopen|dibuka_kembali|buka_ulang|\breset\b|republish|terbitkan_ulang|force[-_ ]?(?:publish|open|close|terbit|buka|tutup)|paksa|override|abaikan[_ ]?ambang/i;
      for (const f of umpan) {
        const b = code(readFileSync(join(repoRoot, f), "utf8"));
        const m = TERLARANG.exec(b);
        c.expect(m === null, `${f} carries a second transition: "${m?.[0]}"`);
      }
      for (const k of allKeys().filter((x) => x.startsWith("umpanbalik."))) {
        const m = TERLARANG.exec(k);
        c.expect(m === null, `the copy table declares ${k}, which names a transition WP7B has not got`);
      }
      for (const contoh of ["reopenCycle", "forcePublish", "force-publish", "const reset = 1;",
                            "terbitkan_ulang", "paksaTerbit", "buka_ulang"]) {
        c.expect(TERLARANG.test(contoh), `the second-transition scanner does not catch "${contoh}"`);
      }
      c.expect(!TERLARANG.test('export const dynamic = "force-dynamic";'),
        "the second-transition scanner mistakes a rendering directive for a transition");
      //    And the endpoint agrees: both terminal states are terminal.
      c.expect(/this feedback cycle is already % and does not reopen/.test(badanTutup),
        "the endpoint no longer refuses a closed round");

      // 4. THE CONFIRMATION SAYS WHAT ENDS AND NAMES NO FIGURE. §8/§14/P1.
      const KUNCI_UB = allKeys().filter((k) => k.startsWith("umpanbalik.tutup."));
      c.expect(KUNCI_UB.length >= 12, `${KUNCI_UB.length} closing key(s); the copy is incomplete`);
      for (const k of KUNCI_UB) {
        const row = telling(k as HleEvent);
        c.expect(typeof row?.default === "string" && row.default.trim().length > 0, `${k} has no Indonesian`);
        c.expect(typeof row?.en === "string" && (row.en as string).trim().length > 0, `${k} has no English`);
        for (const l of LOCALES) {
          const teks = t(k as HleEvent, "staff", { locale: l });
          c.expect(!/[0-9]/.test(teks), `${k} carries a figure in ${l}: "${teks}"`);
          c.expect(informal(teks).length === 0, `${k} is informal in ${l}`);
        }
      }
      //    The two sentences that have to be there: what ends, and that it does
      //    not come back.
      for (const l of LOCALES) {
        const arti = t("umpanbalik.tutup.arti", "staff", { locale: l });
        const akhir = t("umpanbalik.tutup.akhir", "staff", { locale: l });
        c.expect(/(tanggapan|responses)/i.test(arti), `the confirmation does not say what ends in ${l}`);
        c.expect(/(tidak dibuka|not opened again|does not reopen)/i.test(akhir),
          `the confirmation does not say the round stays closed in ${l}`);
      }
      //    AND NO COUNT, THRESHOLD OR SHORTFALL REACHES THE CONTROL. Not in its
      //    copy and not in its props: there is nothing passed that could be
      //    printed.
      const props = /\{\s*siklus,\s*tutup,\s*locale[^}]*\}/.exec(kontrol)?.[0] ?? "";
      c.expect(props.length > 0, "the close control's props could not be read");
      for (const bocor of ["total", "jumlah", "count", "ambang", "threshold", "responses", "sisa"]) {
        c.expect(!props.includes(bocor), `the close control is handed ${bocor}`);
      }
      const HITUNG = /\d+\s*(?:\/|dari|of)\s*\d+|\d+\s*%|tanggapan\s*:?\s*\d+/i;
      c.expect(HITUNG.test("3 dari 5") && HITUNG.test("(3/5)"),
        "the figure scanner used on this surface catches nothing");

      // 5. NO BLIND REPEAT, AND THE RE-READ IS AUTHORITATIVE. §15/P5.
      c.expect(/sebab !== "tak_pasti"/.test(aksi),
        "the close action re-reads even where WP7B already named the outcome");
      c.expect(/await siklus\(/.test(aksi), "an uncertain close is not settled by re-reading the round");
      c.expect(/keadaan === "OPEN" \? "belum_tertutup" : "sudah_tertutup"/.test(aksi),
        "the re-read does not decide from the round's own state");
      //    Nothing loops, retries, waits or counts attempts.
      for (const b of [aksi, kontrol]) {
        c.expect(!/\bwhile\s*\(|setTimeout|setInterval|for\s*\(\s*let\s+\w+\s*=\s*0/.test(b),
          "the closing path retries, waits or loops");
        c.expect(!/attempt|percobaan|retry|coba_lagi/i.test(b), "the closing path counts attempts");
      }
      //    A second press while one is in flight cannot start a second call.
      c.expect(/if \(sibuk\) return;/.test(kontrol), "the control admits a second press while one is in flight");
      c.expect(/disabled=\{sibuk\}/.test(kontrol), "the confirm control is not disabled in flight");
      //    An unrecognised failure is never reported as a failure.
      c.expect(sebabTutup("something nobody has ever seen") === "tak_pasti",
        "an unrecognised close failure is reported as something definite");
      c.expect(sebabTutup(null) === "tak_pasti", "a missing message is reported as something definite");
      c.expect(sudahDitutup("tertutup") && sudahDitutup("sudah_tertutup"),
        "a closed round is not treated as closed");
      for (const x of ["bukan_wewenang", "subjek", "belum_tertutup", "tak_pasti"] as const) {
        c.expect(!sudahDitutup(x), `${x} is treated as a closed round`);
      }
      const LAGI = /coba lagi|tutup lagi|ulangi|try again|close it again/i;
      for (const l of LOCALES) {
        for (const k of ["umpanbalik.tutup.tak_pasti", "umpanbalik.tutup.belum"] as const) {
          c.expect(!LAGI.test(t(k as HleEvent, "staff", { locale: l })),
            `${k} tells an operator to press again in ${l}`);
        }
      }
      c.expect(LAGI.test("Silakan coba lagi."), "the blind-retry sweep catches nothing");

      // 6. THE OUTCOME MAP IS WP7B'S OWN SENTENCES, BOTH WAYS. Scoped to what
      //    an operator pressing Close can actually reach.
      for (const { frasa } of SEBAB_TUTUP) {
        c.expect(badanTutup.includes(frasa), `the surface maps "${frasa}", which the endpoint never raises`);
      }
      const raises = [...badanTutup.matchAll(/raise exception '([^':%]+)/g)].map((m) => m[1].trim());
      c.expect(raises.length >= 3, `${raises.length} refusal(s) in the endpoint; the slice is wrong`);
      for (const r of raises) {
        const dipetakan = SEBAB_TUTUP.some(({ frasa }) => r.includes(frasa) || frasa.includes(r));
        // The bound threshold going missing is a platform fault rather than
        // something its reader did, and it is deliberately unmapped: it falls
        // through to the re-read, which reports that the round is still open,
        // which is true. A sentence invented for it would be a guess at a cause.
        c.expect(dipetakan || /anonymity threshold this cycle bound/.test(r),
          `the endpoint raises "${r}" at an operator and the surface has no sentence for it`);
      }

      // 7. AUTHORITY IS THE ENDPOINT'S. §4/P3. The page offers, and offering is
      //    all it does: no role name is read, and the gate it already had is
      //    the one that decides who reaches this page at all.
      for (const f of [AKSI, KONTROL, HALAMAN]) {
        const b = code(readFileSync(join(repoRoot, f), "utf8"));
        c.expect(!/"(HEAD_OF_DEPARTMENT|DEAN|INSTITUTION_ADMIN|SYSTEM_ADMIN|EDUCATOR|STUDENT)"/.test(b),
          `${f} reads a role name`);
        c.expect(!/display_role|displayRole|is_system_admin|has_scope/.test(b),
          `${f} decides authority for itself`);
      }
      c.expect(/simpulDalamLingkup\(/.test(halaman), "the operating page no longer asks the Management gate");
      c.expect(/management_scope_over_node/.test(badanTutup),
        "the close endpoint no longer asks who is Management");

      // 8. THE GEOMETRY HOLDS THE WORDS. §17/P6. MEASURED against the compiled
      //    stylesheet at 320/375/390/414/768 in both languages: zero overflow,
      //    zero clipped label, and every control at or above the touch-target
      //    floor. The control reuses `.pin-ub-btn`, whose floor is declared at
      //    a specificity that survives `.pin-actions .pin-btn` — the defect
      //    WP7C measured and fixed — so the rule is asserted rather than
      //    re-discovered here.
      const css = readFileSync(join(repoRoot, "src/app/experience.css"), "utf8");
      c.expect(/\.pin-actions \.pin-ub-btn \{[^}]*min-height: 44px/.test(css),
        "the operating controls' touch-target floor is declared where the phone rule outranks it");
      c.expect(/pin-ub-btn/.test(kontrol), "the closing controls do not use the wrapping button rule");
      const panel = css.slice(css.indexOf(".pin-ub-pasti {"), css.indexOf(".pin-ub-pasti .pin-actions"));
      c.expect(panel.length > 0, "the confirmation panel's rule could not be located");
      c.expect(!/(?<!min-)(?:height|width):\s*\d/.test(panel),
        "the confirmation panel pins a fixed size, which clips the longer of two languages");
      c.expect(/(?<!min-)(?:height|width):\s*\d/.test("height: 120px;"),
        "the fixed-geometry scanner cannot see a pinned size");

      c.note(`${KUNCI_UB.length} closing key(s), ${raises.length} endpoint refusal(s), ` +
        `${umpan.length} feedback file(s), ${LOCALES.length} language(s)`);
      return c.verdict(
        "Management ends collection for a round and the backend decides what the round became. THE " +
        "SURFACE NEVER LEARNS WHICH: `close_feedback_cycle` returns the new state -- asserted, so this " +
        "is a refusal rather than an absence -- and the action destructures only the error, reads the " +
        "payload nowhere, and names neither terminal state nor any count. No file under src reads the " +
        "anonymity threshold at all, watched on a plant. THE OFFER IS THE STATE AND NOTHING ELSE: only " +
        "an open round is offered a control, every terminal and unknown state is offered none, and no " +
        "file and no copy key in this Experience names a reopen, a reset, a republish, a force or an " +
        "override -- watched on a plant, and agreeing with the endpoint, which refuses a closed round " +
        "by name. THE CONFIRMATION says what ends and that it does not come back, in both languages, " +
        "and carries NO DIGIT AT ALL in any of its twelve keys; the control is handed no total, count, " +
        "threshold or remainder, so there is nothing passed to it that could be printed. NO BLIND " +
        "REPEAT: an unrecognised outcome is settled by re-reading the round's own state rather than by " +
        "pressing again, nothing loops, waits, retries or counts attempts, a second press in flight " +
        "cannot start a second call, and no outcome sentence tells an operator to try again. The " +
        "outcome map is compared with the endpoint's own refusals in both directions, with the one " +
        "deliberately unmapped platform fault named and justified. AUTHORITY IS THE ENDPOINT'S: " +
        "neither the action, the control nor the page reads a role name or decides for itself, the " +
        "page still asks the Management gate, and the endpoint still asks it again",
      );
    },
  },
  {
    id: "UX1-UB-BUKA-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const MIG = "supabase/migrations/20261001100000_management_can_name_the_teacher_it_asks_about.sql";
      const mig = readFileSync(join(repoRoot, MIG), "utf8");
      const AKSI = "src/app/pimpinan/[simpul]/umpan-balik/actions.ts";
      const KONTROL = "src/components/umpanbalik/MulaiPutaran.tsx";
      const HALAMAN = "src/app/pimpinan/[simpul]/umpan-balik/kelas/[kelas]/page.tsx";
      const aksi = code(readFileSync(join(repoRoot, AKSI), "utf8"));
      const kontrol = code(readFileSync(join(repoRoot, KONTROL), "utf8"));
      const halaman = code(readFileSync(join(repoRoot, HALAMAN), "utf8"));
      const lapis = code(readFileSync(join(repoRoot, "src/lib/umpanbalik.ts"), "utf8"));

      // 1. DISCOVERY IS THE GOVERNED CONTRACT, AND IT IS THE ONLY ONE USED.
      //    Two columns, from the endpoint whose whole purpose is to give this
      //    Experience a display identity without giving anybody a staff
      //    directory.
      c.expect(/returns table \(person_id uuid, display_name text\)/.test(mig),
        "the discovery endpoint no longer returns exactly a person and a display name");
      c.expect(/rpc\("feedback_subjects_for_class", \{ p_node: node \}\)/.test(lapis),
        "the data layer does not read the governed subject contract");
      //    …and it reads nothing else about a person from it.
      const bacaSubjek = lapis.slice(lapis.indexOf("export async function subjekKelas"),
                                     lapis.indexOf("export async function siklusKelas"));
      c.expect(bacaSubjek.length > 0, "the discovery read could not be located");
      for (const medan of ["email", "auth_user", "account", "institutional", "enrol", "membership", "role"]) {
        c.expect(!bacaSubjek.includes(medan), `the discovery read reaches for ${medan}`);
      }
      //    A REFUSAL AND AN EMPTY LIST ARE DIFFERENT FACTS. "Not yours to ask"
      //    and "nobody to ask about" are different sentences, and the surface
      //    says which.
      c.expect(/if \(error\) return null;/.test(bacaSubjek),
        "a refused discovery is reported as an empty list");
      c.expect(/subjek === null \?/.test(halaman),
        "the page does not tell a refusal apart from an empty candidate list");
      c.expect(/umpanbalik\.buka\.tanpa_wewenang/.test(halaman) && /umpanbalik\.buka\.kosong/.test(kontrol),
        "the two cases share one sentence");

      // 2. DISCOVERY IS NOT AUTHORIZATION. ADR-0023 §Decision 3: no token, no
      //    cached entitlement, no "listed therefore permitted". The action
      //    passes the class and the person and asserts nothing about either.
      c.expect(/rpc\("open_feedback_cycle", \{\s*p_node: kelas,\s*p_subject_person_id: subjek,\s*\}\)/.test(aksi),
        "the open action sends something other than the class and the subject");
      for (const dilarang of ["token", "signed", "claim", "cache", "allowlist", "izinkan", "boleh"]) {
        c.expect(!aksi.includes(dilarang), `the open action carries a ${dilarang}`);
      }
      c.expect(!/feedback_subject_candidates|role_assignments|EDUCATOR|jalur|learning_context|ACADEMIC/.test(aksi + kontrol + halaman),
        "the open path reconstructs the subject, scope or academic rule for itself");
      //    THE RULE IS READ TWICE AND WRITTEN ONCE: both the endpoint and
      //    discovery ask the same internal function, which is the reason the
      //    frontend can trust a list it is nonetheless not allowed to rely on.
      c.expect(/feedback_subject_candidates\(p_node\)/.test(mig), "the shared subject rule is gone");
      const badanBuka = mig.slice(mig.indexOf("create or replace function public.open_feedback_cycle"),
                                  mig.indexOf("create function public.feedback_subjects_for_class"));
      c.expect(/feedback_subject_candidates/.test(badanBuka),
        "the open endpoint no longer asks the shared subject rule");

      // 3. EVERY WAY THE BACKEND CAN REFUSE HAS A SENTENCE, BOTH DIRECTIONS.
      //    This is the whole point of an advisory list: each refusal below is
      //    a real thing that can happen between the read and the press.
      for (const { frasa } of SEBAB_BUKA) {
        c.expect(badanBuka.includes(frasa), `the surface maps "${frasa}", which the endpoint never raises`);
      }
      const raises = [...badanBuka.matchAll(/raise exception '([^':%]+)/g)].map((m) => m[1].trim());
      c.expect(raises.length >= 10, `${raises.length} refusal(s) in the open endpoint; the slice is wrong`);
      for (const r of raises) {
        c.expect(SEBAB_BUKA.some(({ frasa }) => r.includes(frasa) || frasa.includes(r)),
          `the endpoint raises "${r}" at an operator and the surface has no sentence for it`);
      }
      //    The two that matter most are their OWN outcomes rather than folded
      //    into a shrug: a stale subject, and the academic boundary.
      c.expect(sebabBuka("the subject of a feedback cycle holds a live EDUCATOR assignment over that class, and this one does not")
        === "bukan_pengajar", "a stale discovery is not reported as a stale discovery");
      c.expect(sebabBuka("that class is reached by professional-development material (X): PINTAR 4.0 feedback is ACADEMIC only")
        === "bukan_akademik", "the academic refusal is not reported as itself");
      c.expect(sebabBuka("this class already has a feedback cycle about that educator in this academic period")
        === "sudah_ada", "a round opened by a colleague first is not recognised");
      c.expect(sebabBuka("something nobody has ever seen") === "tak_pasti",
        "an unrecognised open failure is reported as something definite");
      c.expect(sebabBuka(null) === "tak_pasti", "a missing message is reported as something definite");
      c.expect(sudahAdaPutaran("dibuka") && sudahAdaPutaran("sudah_ada"),
        "a class that has been asked is not treated as asked");
      for (const x of ["bukan_pengajar", "bukan_wewenang", "bukan_akademik", "kelas_belum_siap",
                       "belum_siap", "subjek_sendiri", "tak_pasti"] as const) {
        c.expect(!sudahAdaPutaran(x), `${x} is treated as a round that exists`);
      }

      // 4. THE ACADEMIC REFUSAL IS CARRIED, NOT COMPENSATED. No other class is
      //    looked for, no context is inferred, nothing is retried, and the
      //    sentence offers no way round it.
      for (const b of [aksi, kontrol, halaman]) {
        c.expect(!/\bwhile\s*\(|setTimeout|setInterval|retry|coba_lagi|attempt/i.test(b),
          "the open path retries or loops");
      }
      const LAIN = /kelas lain|another class|try another|cari kelas/i;
      for (const l of LOCALES) {
        const teks = t("umpanbalik.buka.bukan_akademik" as HleEvent, "staff", { locale: l });
        c.expect(!LAIN.test(teks), `the academic refusal suggests a workaround in ${l}`);
        c.expect(/(akademik|academic)/i.test(teks), `the academic refusal does not say what it is about in ${l}`);
      }
      c.expect(LAIN.test("Coba kelas lain."), "the workaround sweep catches nothing");

      // 5. NOTHING COUNTS ANYTHING, HERE EITHER. Opening a round must not
      //    become a place to watch one fill up.
      const KUNCI_UB = allKeys().filter((k) => k.startsWith("umpanbalik.buka.") || k.startsWith("umpanbalik.kelas."));
      c.expect(KUNCI_UB.length >= 15, `${KUNCI_UB.length} opening key(s); the copy is incomplete`);
      for (const k of KUNCI_UB) {
        const row = telling(k as HleEvent);
        c.expect(typeof row?.default === "string" && row.default.trim().length > 0, `${k} has no Indonesian`);
        c.expect(typeof row?.en === "string" && (row.en as string).trim().length > 0, `${k} has no English`);
        for (const l of LOCALES) {
          const teks = t(k as HleEvent, "staff", { locale: l });
          c.expect(!/[0-9]/.test(teks), `${k} carries a figure in ${l}: "${teks}"`);
          c.expect(informal(teks).length === 0, `${k} is informal in ${l}`);
        }
      }
      for (const bocor of ["tanggapan", "responses", "ambang", "threshold", "peserta", "participants",
                           "sudah menjawab", "have answered"]) {
        for (const k of KUNCI_UB) {
          for (const l of LOCALES) {
            c.expect(!t(k as HleEvent, "staff", { locale: l }).toLowerCase().includes(bocor),
              `${k} names ${bocor} in ${l}`);
          }
        }
      }
      //    …and the control is handed only a class, a list of people and the act.
      const props = /\{\s*kelas,\s*subjek,\s*buka,\s*locale[^}]*\}/.exec(kontrol)?.[0] ?? "";
      c.expect(props.length > 0, "the opening control's props could not be read");
      for (const bocor of ["total", "jumlah", "count", "ambang", "threshold", "responses", "peserta"]) {
        c.expect(!props.includes(bocor), `the opening control is handed ${bocor}`);
      }

      // 6. AUTHORITY IS THE ENDPOINT'S, AND THE PAGE STILL ASKS THE GATE.
      for (const [f, b] of [[AKSI, aksi], [KONTROL, kontrol], [HALAMAN, halaman]] as const) {
        c.expect(!/"(HEAD_OF_DEPARTMENT|DEAN|INSTITUTION_ADMIN|SYSTEM_ADMIN|EDUCATOR|STUDENT)"/.test(b),
          `${f} reads a role name`);
        c.expect(!/display_role|displayRole|is_system_admin|has_scope/.test(b),
          `${f} decides authority for itself`);
      }
      c.expect(/simpulDalamLingkup\(/.test(halaman) && /HalamanPenolakan/.test(halaman),
        "the per-class page does not ask the Management gate or has no refusal path");
      c.expect(/management_scope_over_node/.test(mig), "the discovery endpoint no longer asks who is Management");
      //    The same sentence for discovery as for the operation, so a reader
      //    learns nothing from being refused one rather than the other.
      c.expect(/naming the subjects of a feedback cycle is for a HEAD_OF_DEPARTMENT or DEAN standing over that class/.test(mig),
        "the discovery refusal no longer mirrors the operation's");

      // 7. THE OPENED ROUND IS THE SERVER'S ACCOUNT OF IT. The new cycle's id
      //    is discarded and the page re-reads, exactly as the close path does.
      c.expect(/const \{ error \} = await c\.rpc\("open_feedback_cycle"/.test(aksi),
        "the open action takes more than the error from the endpoint's answer");
      c.expect(/router\.refresh\(\)/.test(kontrol), "the control does not re-read after opening");
      //    And no second transition appears on this surface either.
      const TERLARANG2 =
        /reopen|dibuka_kembali|buka_ulang|\breset\b|republish|terbitkan_ulang|force[-_ ]?(?:publish|open|close|terbit|buka|tutup)|paksa|override/i;
      for (const [f, b] of [[AKSI, aksi], [KONTROL, kontrol], [HALAMAN, halaman]] as const) {
        const m = TERLARANG2.exec(b);
        c.expect(m === null, `${f} carries a second transition: "${m?.[0]}"`);
      }

      // 8. THE GEOMETRY HOLDS A PERSON'S NAME. §17. MEASURED at 320/375/390/
      //    414/768 in both languages with the longest realistic educator name:
      //    zero overflow, zero clipping, every control at or above the floor.
      const css = readFileSync(join(repoRoot, "src/app/experience.css"), "utf8");
      const baris = css.slice(css.indexOf(".pin-ub-orang > li {"), css.indexOf(".pin-ub-orang > li + li"));
      c.expect(baris.length > 0, "the candidate row's rule could not be located");
      c.expect(/min-height: 44px/.test(baris), "the candidate row has no touch-target floor");
      c.expect(!/(?<!min-)(?:height|width):\s*\d/.test(baris),
        "the candidate row pins a fixed size, which clips the longer of two languages");
      c.expect(/flex-wrap: wrap/.test(baris), "a long name cannot fold away from the act");
      c.expect(/\.pin-ub-orang \.pin-ml \{[^}]*min-width: 0/.test(css),
        "a long name sets the row's floor instead of wrapping inside it");
      c.expect(/pin-ub-btn/.test(kontrol), "the opening control does not use the wrapping button rule");

      c.note(`${KUNCI_UB.length} opening key(s), ${raises.length} endpoint refusal(s), ` +
        `${SEBAB_BUKA.length} mapped phrase(s), ${LOCALES.length} language(s)`);
      return c.verdict(
        "Management names the teacher a class will be asked about through the governed contract, and " +
        "opening re-decides every time. DISCOVERY IS THE FEEDBACK CONTRACT AND NOTHING WIDER: the " +
        "endpoint is asserted to return exactly a person and a display name, the data layer reaches " +
        "for no email, account, institutional identity, enrolment, membership or other role, and a " +
        "REFUSAL is told apart from an EMPTY LIST -- 'not yours to ask' and 'nobody to ask about' are " +
        "different facts and the surface says which. DISCOVERY IS NOT AUTHORIZATION: the action sends " +
        "the class and the person and nothing else, carries no token, signed claim or cache, and " +
        "neither it nor the control nor the page names the subject rule, the role table, EDUCATOR, " +
        "jalur containment or the academic context -- while the migration is read to confirm the " +
        "endpoint and discovery ask ONE shared rule, which is why a list can be trusted and still not " +
        "relied on. EVERY REFUSAL HAS A SENTENCE, compared with the endpoint's own in both " +
        "directions, with a stale subject, the academic boundary and a colleague who got there first " +
        "each its own outcome rather than a shrug. THE ACADEMIC REFUSAL IS CARRIED, NOT COMPENSATED: " +
        "nothing retries, nothing loops, and the sentence names the boundary and offers no way round " +
        "it -- watched on a plant. NOTHING COUNTS ANYTHING: no opening key in either language carries " +
        "a digit or names a response, a threshold or a participant, and the control is handed no " +
        "total, count or remainder. Authority stays the endpoint's, the page still asks WP4's gate " +
        "and refuses through the one refusal page, discovery refuses in the same words the operation " +
        "does, the new cycle's id is discarded in favour of a re-read, no second transition appears, " +
        "and the row that holds a person's name has a touch-target floor, wraps rather than " +
        "overflowing, and pins no geometry",
      );
    },
  },
  // ────────────────────────────────────────────────────────── DAISY-01 (lane: Daisy)
  {
    id: "DAISY-01-SALIN-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();

      /**
       * DAISY-01, THE COPY HALF. Three words-only fixes from the audit of 24
       * September, each checked against what a reader is actually SHOWN -- every
       * telling rendered through t() -- rather than against the file it lives in.
       *
       * D-015: THE QUICK ASSESSMENT HAS ONE NAME. It was "Uji Cepat" to learners
       * and teachers and "Kuis Cepat" in Studio (audit N6), so a teacher who
       * launched one in Studio then looked for a differently named thing in their
       * class. The sweep covers every key, for every persona that can be shown
       * it, in both languages -- not only Studio's, because the next place the
       * old word turns up will not be a Studio key.
       */
      const KUIS = /\bkuis\b|\bquiz(?:zes)?\b/i;
      c.expect(
        KUIS.test("Kuis Cepat") && KUIS.test("Launch the quiz") && KUIS.test("Quizzes already launched"),
        "the retired-name sweep does not catch the old name (positive control)",
      );
      c.expect(
        !KUIS.test("Uji Cepat") && !KUIS.test("Quick Assessment") && !KUIS.test("kuesioner"),
        "the retired-name sweep catches a word it should not (negative control)",
      );
      let disapu = 0;
      for (const r of renderAll()) {
        disapu++;
        const m = r.text.match(KUIS);
        if (m) c.expect(false, `${r.event} (${r.persona}, ${r.locale}) still says "${m[0]}"; D-015 names it Uji Cepat / Quick Assessment`);
      }
      c.expect(disapu > 1000, `only ${disapu} tellings were swept`);
      for (const k of ["studio.nav.kuis", "studio.kuis.judul"] as HleEvent[]) {
        c.expect(t(k, "staff", { locale: "id" }) === "Uji Cepat", `${k} is not "Uji Cepat"`);
        c.expect(
          t(k, "staff", { locale: "en" }) === t("mengajar.cepat.judul", "staff", { locale: "en" }),
          `${k} does not use the English name the teacher's own Quick Assessment screen uses`,
        );
      }

      /**
       * M1 MITIGATION: A SIGN-IN LINK ONLY WORKS WHERE IT WAS ASKED FOR. Until
       * the cross-device link lands (backlog M1), a link opened in another
       * browser lands on "this link is no longer valid". Both screens around that
       * moment now say so -- before (check your email) and after (the link has
       * expired). A key nobody renders fixes nothing, so each line is required
       * INSIDE the branch that draws its screen, and each slice is proven to be
       * that branch by the heading it must also contain.
       */
      for (const k of ["auth.sent_same", "auth.link_same"]) {
        const ada = allKeys().includes(k as HleEvent);
        c.expect(ada, `${k} is not in the copy table`);
        if (!ada) continue;
        c.expect(
          /perangkat dan browser yang sama/.test(t(k as HleEvent, "public", { locale: "id" })),
          `${k} does not say "perangkat dan browser yang sama"`,
        );
        const en = t(k as HleEvent, "public", { locale: "en" });
        c.expect(/same device/i.test(en) && /same browser/i.test(en), `${k} does not say "same device" and "same browser"`);
      }
      function cabang(file: string, awal: string, akhir: string): string {
        const src = code(readFileSync(join(repoRoot, file), "utf8"));
        const i = src.indexOf(awal);
        const j = i < 0 ? -1 : src.indexOf(akhir, i + awal.length);
        return i >= 0 && j > i ? src.slice(i, j) : "";
      }
      const terkirim = cabang("src/components/masuk/LayarMasuk.tsx", 'if (layar.k === "terkirim")', 'if (layar.k === "kartu")');
      c.expect(terkirim.includes('"auth.sent_h"'), "could not isolate LayarMasuk's check-your-email branch");
      c.expect(terkirim.includes('"auth.sent_same"'), "the check-your-email screen does not render auth.sent_same");
      const mati = cabang("src/components/masuk/TukarTautan.tsx", "if (mati)", "\n  return (");
      c.expect(mati.includes('"auth.link_h_exp"'), "could not isolate TukarTautan's expired-link branch");
      c.expect(mati.includes('"auth.link_same"'), "the expired-link screen does not render auth.link_same");

      /**
       * N1: "BUAT DAN AKTIFKAN" SENDS NO EMAIL. The route creates the identity
       * with email_confirm set and sends nothing -- read here, not assumed, so
       * that if the route ever starts sending mail this guard says the message's
       * premise changed. The success message must not say the person can now
       * sign in by email; it must say nothing was sent and send the
       * administrator's colleague to /masuk.
       */
      const rute = readFileSync(join(repoRoot, "src", "app", "api", "akun", "aktivasi", "route.ts"), "utf8");
      c.expect(
        /email_confirm:\s*true/.test(rute) && !/signInWithOtp|inviteUserByEmail|generateLink/.test(rute),
        "the activation route now sends mail itself -- this message's premise has changed; re-read it",
      );
      for (const loc of LOCALES) {
        const ok = t("aktivasi.baru.ok", "staff", { locale: loc });
        c.expect(ok.includes("/masuk"), `aktivasi.baru.ok (${loc}) does not send the person to /masuk`);
        c.expect(!/sekarang bisa masuk|can now sign in/i.test(ok), `aktivasi.baru.ok (${loc}) still says the person can now sign in`);
      }
      c.expect(/tidak mengirim surel/.test(t("aktivasi.baru.ok", "staff", { locale: "id" })), "aktivasi.baru.ok (id) does not say no email was sent");
      c.expect(/not emailed/.test(t("aktivasi.baru.ok", "staff", { locale: "en" })), "aktivasi.baru.ok (en) does not say no email was sent");
      // DAISY-09 moved the drawing of each outcome into HasilAktivasi; the
      // form hands it the new person's answer, and it draws aktivasi.baru.ok
      // on that path's success.
      const form = code(readFileSync(join(repoRoot, "src", "components", "aktivasi", "FormAktivasi.tsx"), "utf8"));
      const hasilAkt = code(readFileSync(join(repoRoot, "src", "components", "aktivasi", "HasilAktivasi.tsx"), "utf8"));
      c.expect(/<HasilAktivasi locale=\{locale\} mode="NEW_PERSON" jawaban=\{hasil\.baru\.jawaban\}/.test(form)
        && /if \(!jawaban\?\.ok\)/.test(hasilAkt) && /mode === "NEW_PERSON" \? "aktivasi\.baru\.ok"/.test(hasilAkt),
        "the activation form no longer shows aktivasi.baru.ok on success");

      return c.verdict(
        `D-015: no telling for any persona in either language names the quick assessment "kuis" or ` +
        `"quiz" (${disapu} tellings swept, both controls held), and Studio uses the teacher's own names. ` +
        "M1: both the check-your-email and the expired-link screens say, in both languages and inside " +
        "the branch that draws them, that a link works only on the same device and browser. N1: the " +
        "route is re-read to confirm it sends no mail, and Buat dan aktifkan's success message says so " +
        "and sends the person to /masuk",
      );
    },
  },

  {
    id: "DAISY-01-MASUK-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();

      /**
       * DAISY-01, THE LAYOUT HALF: THE SIGN-IN SCREEN HOLDS TOGETHER AT EVERY
       * WIDTH. Measured in Chromium on main at 8956259, both languages, before
       * this change: at 1440px the form sat 56px from the left of its column
       * with 254px of empty page on its right, at 2000px 539px, and at a 1024px
       * window 476px. The stage never cancelled the page gutter, so warm strips
       * ran down both edges at every width (and a 320px phone lost 32px of form),
       * and on any screen taller than 760px the panel stopped short with blank
       * page beneath it.
       *
       * WHY IT READS THE CASCADE AND NOT A BROWSER -- the precedent is
       * UX1-S0-MUAT-01: CI installs no browser. So the geometry is COMPUTED the
       * way the browser computes it: the gutter token at each width, the stage's
       * margin against it, the container queries that apply, the grid split, the
       * padding expression evaluated against the column, and the form's measure.
       * The Chromium measurement is the companion evidence, and this evaluator
       * reproduces it to the pixel in both directions: before, 56/254 at 1440 and
       * 56/539 at 2000; after, 167/167 and 310/310.
       */
      const css = code(readFileSync(join(repoRoot, "src", "app", "experience.css"), "utf8"));
      const globals = readFileSync(join(repoRoot, "src", "app", "globals.css"), "utf8");
      const tok = tokens(globals);
      const lebarGutter = /@media \(min-width: (\d+)px\) \{ :root \{ --gutter: (\d+)px; \} \}/.exec(globals);
      c.expect(lebarGutter && tok["--gutter"], "could not read the page gutter at both widths");
      const gutter = (vw: number) =>
        lebarGutter && vw >= Number(lebarGutter[1]) ? Number(lebarGutter[2]) : parseFloat(tok["--gutter"] ?? "NaN");

      /** A CSS length expression, evaluated. `pct` is what 100% means here. */
      function nilai(expr: string, pct: number, vw: number, vh: number): number {
        let e = expr;
        for (let i = 0; i < 8 && e.includes("var(--"); i++) {
          e = e.replace(/var\((--[a-z0-9-]+)\)/g, (_, n: string) => (n === "--gutter" ? `${gutter(vw)}px` : tok[n] ?? "NaN"));
        }
        e = e
          .replace(/(-?\d+(?:\.\d+)?)px/g, "$1")
          .replace(/(-?\d+(?:\.\d+)?)%/g, (_, n: string) => String((Number(n) * pct) / 100))
          .replace(/(-?\d+(?:\.\d+)?)dvh/g, (_, n: string) => String((Number(n) * vh) / 100))
          .replace(/\bcalc\(/g, "(")
          .replace(/\bmax\(/g, "Math.max(")
          .replace(/\bmin\(/g, "Math.min(");
        if (!/^[\d.\s+\-*/(),]*$/.test(e.replace(/Math\.(?:max|min)/g, ""))) return NaN;
        return Number(Function(`"use strict"; return (${e});`)());
      }
      c.expect(nilai("max(56px, calc((100% - 400px) / 2))", 1000, 1000, 800) === 300, "the evaluator is wrong on a known expression (control)");
      c.expect(nilai("max(760px, 100dvh)", 0, 1000, 1000) === 1000, "the evaluator is wrong on dvh (control)");

      /** Declarations of one selector, at top level or inside one container block. */
      function aturan(sel: string, head: string | null): Record<string, string> {
        let scope = css;
        if (head !== null) {
          const i = css.indexOf(head);
          if (i < 0) return {};
          let d = 0, j = css.indexOf("{", i);
          for (let k = j; k < css.length; k++) {
            if (css[k] === "{") d++;
            else if (css[k] === "}" && --d === 0) { j = k; break; }
          }
          scope = css.slice(css.indexOf("{", i) + 1, j);
        }
        const esc = sel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const re = new RegExp(`^${head === null ? "" : "\\s+"}${esc}\\s*\\{([^}]*)\\}`, "m");
        const m = re.exec(scope);
        const out: Record<string, string> = {};
        if (!m) return out;
        for (const d of m[1].split(";")) {
          const k = d.indexOf(":");
          if (k > 0) out[d.slice(0, k).trim()] = d.slice(k + 1).trim();
        }
        return out;
      }
      /** The inline padding a rule sets, from the longhand or the shorthand. */
      function padInline(r: Record<string, string>): string | undefined {
        if (r["padding-inline"]) return r["padding-inline"];
        if (!r.padding) return undefined;
        const parts = r.padding.match(/(?:[a-z]+\((?:[^()]|\([^()]*\))*\)|[^\s]+)/g) ?? [];
        return parts.length === 1 ? parts[0] : parts[1];
      }
      const TABLET = "@container masuk (min-width: 561px)";
      const DESKTOP = "@container masuk (min-width: 1024px)";
      c.expect(Object.keys(aturan(".pin-auth", TABLET)).length > 0 && Object.keys(aturan(".pin-panggung", DESKTOP)).length > 0,
        "could not find the sign-in screen's container blocks");

      const baris: string[] = [];
      for (const vw of [320, 375, 400, 600, 768, 1024, 1280, 1440, 1920, 2560]) {
        // 1. THE STAGE IS EDGE TO EDGE: its margin cancels the page gutter
        const mg = aturan(".pin-masuk", null)["margin-inline"];
        const margin = mg ? nilai(mg, 0, vw, 900) : 0;
        const x = gutter(vw) + margin;
        c.expect(x === 0, `at ${vw}px the sign-in stage starts ${x}px in from the edge, so the page background shows down both sides`);
        const W = vw - 2 * x; // the container the queries measure

        // 2. THE CASCADE THAT APPLIES AT THIS WIDTH, later blocks winning
        const scopes: Array<string | null> = [null, ...(W >= 561 ? [TABLET] : []), ...(W >= 1024 ? [DESKTOP] : [])];
        let pad: string | undefined, measure: string | undefined, logo: string | undefined;
        for (const s of scopes) {
          pad = padInline(aturan(".pin-auth", s)) ?? pad;
          measure = aturan(".pin-form", s)["max-width"] ?? measure;
          logo = aturan(".pin-authtop .pin-merek", s).height ?? logo;
        }
        logo ??= aturan(".pin-merek", null).height;

        let col = W;
        if (W >= 1024) {
          const fr = /minmax\(0,\s*([\d.]+)fr\)\s+minmax\(0,\s*([\d.]+)fr\)/.exec(aturan(".pin-panggung", DESKTOP)["grid-template-columns"] ?? "");
          c.expect(fr, "could not read the desktop grid split");
          if (fr) col = (W * Number(fr[1])) / (Number(fr[1]) + Number(fr[2]));
        }
        const p = pad ? nilai(pad, col, vw, 900) : NaN;
        const isi = col - 2 * p;
        const formW = measure ? Math.min(isi, nilai(measure, col, vw, 900)) : isi;
        const kiri = p, kanan = col - p - formW;
        baris.push(`${vw}:${Math.round(kiri)}/${Math.round(kanan)}`);
        c.expect(Number.isFinite(p) && formW > 0, `at ${vw}px the form's width could not be computed`);

        // 3. ABOVE A PHONE, THE FORM SITS IN THE MIDDLE OF ITS COLUMN
        if (W >= 561) {
          c.expect(Math.abs(kiri - kanan) <= 1,
            `at ${vw}px the form has ${Math.round(kiri)}px on its left and ${Math.round(kanan)}px of empty page on its right`);
          // 4. and the mark is drawn at the size the verification page uses
          const h = logo ? nilai(logo, 0, vw, 900) : NaN;
          c.expect(h >= nilai("var(--logo-height-standalone)", 0, vw, 900),
            `at ${vw}px the mark is ${h}px tall, smaller than the verification page draws it`);
        }

        // 5. THE SPLIT STAGE IS AT LEAST AS TALL AS THE SCREEN
        if (W >= 1024) {
          const mh = aturan(".pin-panggung", DESKTOP)["min-height"];
          for (const vh of [800, 1000, 1400]) {
            const h = mh ? nilai(mh, 0, vw, vh) : 0;
            c.expect(h >= vh, `at ${vw}x${vh} the stage is ${h}px tall and blank page shows beneath the panel`);
          }
        }
      }

      return c.verdict(
        "the sign-in stage runs edge to edge at every width from 320 to 2560 (its margin cancels the page " +
        "gutter at both of the gutter's values), the form sits in the middle of its column wherever there is " +
        "room for it to be anywhere else, the mark is drawn at the verification page's size from a tablet up, " +
        "and the split stage is never shorter than the screen -- all computed from the cascade that applies " +
        `at each width, with the evaluator checked on two known expressions (left/right gaps: ${baris.join(" ")})`,
      );
    },
  },

  // ────────────────────────────────────────────────────────── DAISY-02 (lane: Daisy)
  {
    id: "DAISY-02-KELUAR-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();

      /**
       * DAISY-02 (D-009): "KELUAR" ON EVERY SIGNED-IN SCREEN. Until now only
       * Konfigurasi had one, as a hard-coded word that never changed language,
       * so on a shared classroom tablet the next child simply carried on as the
       * previous one (audit B5).
       *
       * 1. THE STRIP ITSELF, RENDERED. BarisSesi is a pure component, so it is
       *    rendered here the way UX1-UB-BISU-01 renders HasilKelas: called, and
       *    its element tree walked. A staff strip names the person; a learner
       *    strip is handed no name and asks "Bukan akun Anda?" instead (S15). In
       *    both, the way out is a real POST form to /keluar with a submit button
       *    that a screen reader announces by name and describes by the line
       *    beside it.
       */
      type El = { type?: unknown; props?: Record<string, unknown> };
      function semua(n: Simpul, out: El[] = []): El[] {
        if (n === null || n === undefined || typeof n === "string" || typeof n === "number") return out;
        out.push(n);
        for (const k of anakDari(n)) semua(k, out);
        return out;
      }
      for (const locale of LOCALES) {
        const nama = "Sari Wulandari";
        const staf = BarisSesi({ locale, persona: "staff", nama }) as Simpul;
        const murid = BarisSesi({ locale, persona: "learner", nama: null }) as Simpul;
        const teksStaf = teksPohon(staf).join(" ");
        const teksMurid = teksPohon(murid).join(" ");
        c.expect(teksStaf.includes(nama) && teksStaf.includes(t("sesi.sebagai", "staff", { locale })),
          `(${locale}) a staff strip does not say who is signed in: "${teksStaf}"`);
        c.expect(!teksMurid.includes(t("sesi.sebagai", "learner", { locale })) && teksMurid.includes(t("sesi.bukan_anda", "learner", { locale })),
          `(${locale}) a learner strip does not ask "not your account?" without naming anyone: "${teksMurid}"`);
        for (const [apa, pohon, persona] of [["staff", staf, "staff"], ["learner", murid, "learner"]] as const) {
          const els = semua(pohon);
          const form = els.find((e) => e.type === "form");
          const tombol = els.find((e) => e.type === "button");
          const grup = els.find((e) => e.props?.role === "group");
          c.expect(form?.props?.action === "/keluar" && form?.props?.method === "post",
            `(${locale}) the ${apa} strip's way out is not a POST form to /keluar`);
          c.expect(tombol?.props?.type === "submit" && teksPohon(tombol as Simpul).join("") === t("sesi.keluar", persona, { locale }),
            `(${locale}) the ${apa} strip has no submit button named "${t("sesi.keluar", persona, { locale })}"`);
          const ket = els.find((e) => e.props?.id === tombol?.props?.["aria-describedby"]);
          c.expect(Boolean(ket) && teksPohon(ket as Simpul).join("").trim().length > 0,
            `(${locale}) the ${apa} strip's button is not described by the line beside it`);
          c.expect(typeof grup?.props?.["aria-label"] === "string" && String(grup?.props?.["aria-label"]).length > 0,
            `(${locale}) the ${apa} strip is not a labelled group`);
        }
      }

      /**
       * 2. THE READER DECIDES WHETHER THEY ARE NAMED, NEVER THE PAGE (S15,
       *    D-020). The first version asked the page ("is this a staff shell?"),
       *    and /mengajar draws the teaching shell for anybody who reaches it, so
       *    a student who typed the address read "Masuk sebagai <their full
       *    name>" on a shared tablet.
       *
       *    a) THE RULE, FOR EVERY KIND OF READER. A name is shown to a reader
       *       who holds a staff role today and to nobody else: not a student
       *       (who holds no role assignment at all -- being a learner is an
       *       enrolment), not somebody whose display role outlived the
       *       assignment behind it, not a reader whose roles could not be read.
       */
      const NAMA = "Nadia Putri Maharani";
      const STAF_D010: DisplayRole[] = ["EDUCATOR", "HEAD_OF_DEPARTMENT", "DEAN", "INSTITUTION_ADMIN", "SYSTEM_ADMIN"];
      c.expect(JSON.stringify([...PERAN_STAF].sort()) === JSON.stringify([...STAF_D010].sort() as string[]),
        `the staff roles that are named are not every display role but STUDENT: ${PERAN_STAF.join(",")}`);
      type Pembaca = { siapa: string; peranTampil: DisplayRole; peran: string[] | null; sebut: boolean };
      const PEMBACA: Pembaca[] = [
        { siapa: "a student", peranTampil: "STUDENT", peran: [], sebut: false },
        { siapa: "a student whose roles could not be read", peranTampil: "STUDENT", peran: null, sebut: false },
        { siapa: "STUDENT, were it ever a role", peranTampil: "STUDENT", peran: ["STUDENT"], sebut: false },
        { siapa: "an unknown role", peranTampil: null, peran: ["NOT_A_ROLE"], sebut: false },
        { siapa: "an EDUCATOR display role with no active assignment", peranTampil: "EDUCATOR", peran: [], sebut: false },
        ...STAF_D010.map((r): Pembaca => ({ siapa: String(r), peranTampil: r, peran: [String(r)], sebut: true })),
        { siapa: "a teacher who also leads and administers", peranTampil: "INSTITUTION_ADMIN", peran: ["EDUCATOR", "HEAD_OF_DEPARTMENT", "INSTITUTION_ADMIN"], sebut: true },
      ];
      for (const b of PEMBACA) {
        const hasil = namaUntukStrip(NAMA, b.peran);
        c.expect(hasil === (b.sebut ? NAMA : null), `${b.siapa}: the rule gives the strip ${JSON.stringify(hasil)}`);
      }
      c.expect(namaUntukStrip(null, ["EDUCATOR"]) === null && namaUntukStrip("", ["EDUCATOR"]) === null,
        "a staff reader with no stored name is given a placeholder instead of no name");

      /**
       *    b) SESISAYA ITSELF, RENDERED FOR EACH READER ON EVERY KIND OF SHELL.
       *       The component the pages use is called with each reader above on
       *       the teaching shell a student reaches at /mengajar, and on the
       *       staff, learner, public and refusal variants too, and what it
       *       draws is read. It imports the server-only role read, so it runs
       *       in a child under the react-server condition (as the card
       *       derivation does in the app runner); the reader is handed in, so
       *       no database is asked. The name appears exactly when the READER
       *       holds a staff role, whatever the page.
       */
      const RAK: Array<{ persona: Persona; varian: "kepala" | "penolakan" }> = [
        { persona: "educator", varian: "kepala" }, { persona: "staff", varian: "kepala" },
        { persona: "learner", varian: "kepala" }, { persona: "public", varian: "kepala" },
        { persona: "educator", varian: "penolakan" }, { persona: "staff", varian: "penolakan" },
      ];
      const kasus = PEMBACA.flatMap((b) => RAK.flatMap((r) => LOCALES.map((locale) => ({ b, r, locale }))));
      const anak = spawnSync(process.execPath, ["--conditions=react-server", "--import", "tsx", "-e",
        'import("file://" + process.cwd() + "/src/components/SesiSaya.tsx").then(async (m) => {' +
        "  const SesiSaya = m.default?.default ?? m.default;" +
        "  const out = [];" +
        "  for (const k of JSON.parse(process.env.KASUS_SESI)) {" +
        "    const el = await SesiSaya(k);" +
        "    out.push(el ? JSON.stringify(el.type(el.props)) : null);" +
        "  }" +
        "  process.stdout.write(JSON.stringify(out));" +
        "})"], {
        cwd: repoRoot,
        encoding: "utf8",
        env: {
          ...process.env,
          KASUS_SESI: JSON.stringify([
            ...kasus.map(({ b, r, locale }) => ({
              locale, persona: r.persona, varian: r.varian, peran: b.peran,
              viewer: { authUserId: "u", personId: "p", displayName: NAMA, displayRole: b.peranTampil },
            })),
            // nobody signed in: nothing to sign out of
            { locale: "id", persona: "educator", varian: "kepala", peran: ["EDUCATOR"], viewer: null },
          ]),
        },
      });
      let gambar: Array<string | null> = [];
      try { gambar = JSON.parse(anak.stdout); } catch { /* reported below */ }
      if (c.expect(anak.status === 0 && gambar.length === kasus.length + 1,
        `SesiSaya could not be rendered for each reader: ${(anak.stderr || "").trim().split("\n").slice(-3).join(" ")}`)) {
        kasus.forEach(({ b, r, locale }, n) => {
          const g = gambar[n] ?? "";
          const bernama = g.includes(NAMA) && g.includes(t("sesi.sebagai", r.persona, { locale }));
          const tanpaNama = !g.includes(NAMA) && !g.includes("Putri") && !g.includes(t("sesi.sebagai", r.persona, { locale }))
            && g.includes(t("sesi.bukan_anda", r.persona, { locale }));
          const keluar = g.includes('"action":"/keluar"') && g.includes(t("sesi.keluar", r.persona, { locale }));
          c.expect(b.sebut ? bernama && keluar : tanpaNama && keluar,
            `(${locale}) ${b.siapa} on the ${r.persona} ${r.varian} strip: ${b.sebut ? "not named" : "NAMED"} -- ${g.slice(0, 160)}`);
        });
        c.expect(gambar[kasus.length] === null, "SesiSaya draws a strip for somebody who is not signed in");
      }

      /**
       *    c) NOTHING HANDS THE STRIP A NAME AROUND THE RULE. BarisSesi -- the
       *       part that prints whatever name it is given -- is rendered by
       *       SesiSaya alone, which gives it only the rule's answer; nothing
       *       passes SesiSaya a name or a page's opinion; and the page a student
       *       reaches at /mengajar greets by the same reader (first name only,
       *       D-020).
       */
      const sesi = code(readFileSync(join(repoRoot, "src", "components", "SesiSaya.tsx"), "utf8"));
      c.expect(/nama=\{namaUntukStrip\(v\.displayName, p\)\}/.test(sesi), "SesiSaya gives the strip a name other than the reader rule's answer");
      c.expect(/if \(!v\) return null;/.test(sesi), "SesiSaya draws a strip for somebody who is not signed in");
      for (const f of walk(join(repoRoot, "src")).filter((p) => /\.tsx?$/.test(p))) {
        const src = code(readFileSync(f, "utf8"));
        const rel = relative(repoRoot, f);
        if (!rel.endsWith("SesiSaya.tsx")) c.expect(!/<BarisSesi\b/.test(src), `${rel} renders BarisSesi directly, around the reader rule`);
        for (const x of src.match(/<SesiSaya\b[^>]*\/>/g) ?? []) {
          c.expect(!/\b(?:nama|sebut)=/.test(x), `${rel} hands the strip a name or a page's opinion: ${x}`);
        }
      }
      const ajarBeranda = code(readFileSync(join(repoRoot, "src", "app", "mengajar", "page.tsx"), "utf8"));
      c.expect(/const sapa = aku \? namaSapaan\(aku\.nama, peran\) : null;/.test(ajarBeranda) && (ajarBeranda.match(/aku\.nama\b/g) ?? []).length === 1,
        "the teaching home greets whoever reaches it by full name, whatever their roles");

      /**
       * 3. EVERY SCREEN THE TICKET NAMES GETS IT, FROM ONE READ. Belajar,
       *    Mengajar, Pimpinan, Pendataan and Aktivasi through the shell (never
       *    the public one), which reads the viewer and their roles once, in
       *    parallel, and hands both to every strip; the signed-in home page,
       *    Studio and Konfigurasi the same way in their own headers; the two
       *    report pages and the refusal page through the strip's own parallel
       *    read.
       */
      const cangkang = code(readFileSync(join(repoRoot, "src", "components", "CangkangPengalaman.tsx"), "utf8"));
      c.expect(/const \[viewer, peran\] = kind === "public" \? \[null, null\] : await Promise\.all\(\[currentViewer\(\), peranSaya\(\)\]\)/.test(cangkang),
        "the shell does not read the viewer and their roles once, in parallel");
      const cabangKind = (k: string) => {
        const i = cangkang.indexOf(`if (kind === "${k}")`);
        const j = i < 0 ? -1 : cangkang.indexOf("</header>", i);
        return i >= 0 && j > i ? cangkang.slice(i, j) : "";
      };
      for (const k of ["focus", "pengajar", "pimpinan", "pendataan", "public"]) {
        const b = cabangKind(k);
        c.expect(b.length > 0 && b.includes("<MerekPintar"), `could not isolate the shell's "${k}" branch`);
        const ada = b.match(/<SesiSaya[^>]*\/>/)?.[0] ?? "";
        if (k === "public") c.expect(!ada, "the public shell offers a sign-out; the verification page must offer no way in");
        else c.expect(/viewer=\{viewer\} peran=\{peran\}/.test(ada), `the "${k}" shell's strip reads again instead of using the shell's one read: ${ada || "no strip"}`);
      }
      const iBelajar = cangkang.indexOf("const { mengajar } = konteksPembelajaran");
      const strips = (iBelajar < 0 ? "" : cangkang.slice(iBelajar)).match(/<SesiSaya[^>]*\/>/g) ?? [];
      c.expect(strips.length === 2 && strips.every((x) => /viewer=\{viewer\} peran=\{peran\}/.test(x)),
        `the learning shells do not both carry a strip from the one read: ${strips.join(" | ") || "none"}`);
      const tolak = code(readFileSync(join(repoRoot, "src", "components", "HalamanPenolakan.tsx"), "utf8"));
      c.expect(/<SesiSaya[^>]*varian="penolakan"[^>]*\/>/.test(tolak), "the refusal page offers no way out");

      for (const f of ["belajar/page.tsx", "mengajar/page.tsx", "pimpinan/page.tsx", "pendataan/page.tsx", "aktivasi/page.tsx"]) {
        const src = code(readFileSync(join(repoRoot, "src", "app", f), "utf8"));
        const shell = src.match(/<CangkangPengalaman[^>]*\/>/)?.[0] ?? "";
        c.expect(shell.length > 0 && !/kind="public"/.test(shell), `${f} does not render a signed-in shell`);
      }
      for (const f of ["page.tsx", "studio/layout.tsx", "konfigurasi/page.tsx"]) {
        const src = code(readFileSync(join(repoRoot, "src", "app", f), "utf8"));
        c.expect(/<SesiSaya[^>]*viewer=\{viewer\} peran=\{peran\}[^>]*\/>/.test(src), `${f} does not show who is signed in and the way out, from its own read`);
        c.expect(/await Promise\.all\(\[currentViewer\(\), peranSaya\(\)/.test(src) && (src.match(/currentViewer\(\)|peranSaya\(\)/g) ?? []).length === 2,
          `${f} does not read the viewer and their roles exactly once, in parallel`);
      }
      for (const f of ["edukator/ringkasan/page.tsx", "dekan/ringkasan/page.tsx"]) {
        const src = code(readFileSync(join(repoRoot, "src", "app", f), "utf8"));
        c.expect(/<header[\s\S]*?<SesiSaya locale=\{await currentLocale\(\)\}[^>]*\/>[\s\S]*?<\/header>/.test(src),
          `${f} does not show who is signed in and the way out in its header`);
        // a grid item never shrinks below its content unless told to: without
        // this a long name pushed Keluar off a 375px screen (measured, 20px)
        c.expect(/<header className="[^"]*\bmin-w-0\b[^"]*">[\s\S]*?<SesiSaya/.test(src), `${f}'s header cannot shrink to a phone's width`);
      }

      /**
       * 4. NO HARD-CODED "KELUAR" (D-014). The one that existed sat outside the
       *    copy table and stayed Indonesian for an English reader.
       */
      const KERAS = />\s*(?:Keluar|Sign out)\s*</;
      c.expect(KERAS.test('<button className="x">Keluar</button>'), "the hard-coded-word sweep does not catch one (control)");
      for (const f of walk(join(repoRoot, "src")).filter((p) => p.endsWith(".tsx"))) {
        const src = code(readFileSync(f, "utf8"));
        c.expect(!KERAS.test(src), `${relative(repoRoot, f)} writes "Keluar" as text instead of the copy table`);
      }

      /**
       * 5. VISIBLE WITHOUT SCROLLING ON A PHONE, from the cascade. On a phone the
       *    strip takes its own full-width row ordered before the tab strip, so
       *    it sits in the header, above everything the page scrolls; and its
       *    button keeps the 44px touch target. Nothing hides it at any width.
       */
      const css = code(readFileSync(join(repoRoot, "src", "app", "experience.css"), "utf8"));
      const iPonsel = css.indexOf("@media (max-width: 560px)");
      let jPonsel = iPonsel;
      for (let d = 0, k = css.indexOf("{", iPonsel); k < css.length; k++) {
        if (css[k] === "{") d++;
        else if (css[k] === "}" && --d === 0) { jPonsel = k; break; }
      }
      const ponsel = css.slice(iPonsel, jPonsel);
      const ruleIn = (scope: string, sel: string) => {
        const esc = sel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        return new RegExp(`(?:^|\\n)\\s*${esc}\\s*\\{([^}]*)\\}`).exec(scope)?.[1] ?? "";
      };
      const orderOf = (r: string) => Number(/order:\s*(\d+)/.exec(r)?.[1] ?? NaN);
      const sesiPonsel = ruleIn(ponsel, ".pin-top .pin-sesi");
      const tabsPonsel = ruleIn(ponsel, ".pin-tabs");
      c.expect(orderOf(sesiPonsel) < orderOf(tabsPonsel) && /width:\s*100%/.test(sesiPonsel),
        `on a phone the session strip is not a full-width row ahead of the tabs (strip: "${sesiPonsel.trim()}")`);
      c.expect(/min-height:\s*44px/.test(ruleIn(css, ".pin-sesi-keluar")), "the Keluar button has no 44px touch target");
      c.expect(!/\.pin-sesi[^{]*\{[^}]*display:\s*none/.test(css), "a rule hides the session strip");

      return c.verdict(
        "the session strip is RENDERED in both languages as a labelled group whose way out is a POST form to /keluar " +
        "with a submit button described by the line beside it. Whether it names the reader is decided by the READER'S " +
        "roles, never the page: SesiSaya itself, rendered for a student, a student whose roles could not be read, a " +
        "lapsed display role, an unknown role and every staff role on the teaching, staff, learner, public and refusal " +
        "strips, names exactly the staff readers -- a student on /mengajar's shell reads 'Bukan akun Anda?' and no " +
        "name -- and draws nothing for nobody. BarisSesi is rendered only by SesiSaya, nothing passes it a name, and " +
        "the teaching home greets a non-staff reader by first name. Belajar, Mengajar, Pimpinan, Pendataan and " +
        "Aktivasi carry it through the shell's one parallel read, the signed-in home page, Studio and Konfigurasi " +
        "through theirs, the two report pages and the refusal page through the strip's own; no file writes 'Keluar' " +
        "as text, and on a phone it is a full-width header row ahead of the tabs with a 44px button that nothing hides",
      );
    },
  },

  // ────────────────────────────────────────────────────────── DAISY-03 (lane: Daisy)
  {
    id: "DAISY-03-TEMPAT-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();

      /**
       * DAISY-03 (D-010; audit M3, M15 UI): EVERY ROLE REACHES ITS PLACES BY
       * CLICKING. Aktivasi and Studio were reachable only by typing them; a
       * dean or head of department could not reach Pimpinan at all, because
       * the home page's staff door went to /masuk and the signed-in sign-in
       * screen sent them back; and every staff shell showed only its own area.
       *
       * 1. WHICH PLACES IS D-010's MAP, READ THROUGH BOB'S FUNCTION. The
       *    helper is checked against berandaPeran for every display role, so the
       *    shell and the landing after sign-in cannot disagree, and on the
       *    combinations a real person holds.
       */
      const ROLES: DisplayRole[] = ["STUDENT", "EDUCATOR", "HEAD_OF_DEPARTMENT", "DEAN", "INSTITUTION_ADMIN", "SYSTEM_ADMIN"];
      const STAF = ["/mengajar", "/pimpinan", "/konfigurasi"];
      for (const r of ROLES) {
        const rumah = berandaPeran(r);
        const harap = STAF.includes(rumah) ? [rumah] : [];
        c.expect(JSON.stringify(tempatDariPeran([r as string])) === JSON.stringify(harap),
          `${r}: the shell offers ${JSON.stringify(tempatDariPeran([r as string]))}, D-010 (berandaPeran) says ${JSON.stringify(harap)}`);
      }
      c.expect(JSON.stringify(tempatDariPeran(["EDUCATOR", "HEAD_OF_DEPARTMENT", "INSTITUTION_ADMIN"])) === JSON.stringify(STAF),
        "a person holding three roles is not offered all three places, in order");
      c.expect(tempatDariPeran(null).length === 0 && tempatDariPeran(["NOT_A_ROLE"]).length === 0,
        "an unreadable or unknown role is offered a place");
      c.expect(berandaPeran("DEAN") === "/pimpinan" && berandaPeran("HEAD_OF_DEPARTMENT") === "/pimpinan",
        "D-010 no longer sends management to Pimpinan -- this guard's premise changed");

      /**
       * 2. THE TABS ARE EXACTLY THAT LIST. daftarTempat is the list a shell
       *    draws -- the places less the shell's own, each with its label in the
       *    reader's language -- and TabTempat turns each entry into one link
       *    and adds nothing. (The component itself imports next/link, which
       *    cannot load in this runner, so the list is what is read here.)
       */
      for (const locale of LOCALES) {
        const daftar = daftarTempat(["/mengajar", "/pimpinan", "/konfigurasi"], ["/pimpinan"], locale, "staff");
        c.expect(JSON.stringify(daftar.map((x) => x.href)) === JSON.stringify(["/mengajar", "/konfigurasi"]),
          `(${locale}) the tabs are not the places less the excluded one: ${daftar.map((x) => x.href).join(",")}`);
        c.expect(daftar[0]?.label === t("nav.kelas", "staff", { locale }) && daftar[1]?.label === t("nav.konfigurasi", "staff", { locale }),
          `(${locale}) a place's tab does not carry its label`);
        // one place, one name: Pimpinan beside Kelas cannot be called "Beranda"
        c.expect(!/^(Beranda|Home)$/.test(t("nav.pimpinan", "staff", { locale })),
          `(${locale}) Pimpinan's tab is still called "${t("nav.pimpinan", "staff", { locale })}"`);
      }

      const tabTempat = code(readFileSync(join(repoRoot, "src", "components", "TabTempat.tsx"), "utf8"));
      c.expect(/daftarTempat\(tempat, kecuali, locale, persona\)\.map\(\(\{ href, label \}\) => \(\s*<Link key=\{href\} href=\{href\} className=\{kelas\}>\s*\{label\}\s*<\/Link>/.test(tabTempat),
        "TabTempat does not render the list as one link per place with its label");

      /**
       * 3. EVERY STAFF SHELL OFFERS THE OTHER PLACES; NOTHING ELSE DOES. The
       *    roles are asked once, the learner branch reuses the same answer, and
       *    neither the public page nor an assessment in focus offers anywhere.
       */
      const cangkang = code(readFileSync(join(repoRoot, "src", "components", "CangkangPengalaman.tsx"), "utf8"));
      c.expect((cangkang.match(/peranSaya\(\)/g) ?? []).length === 1, "the shell asks for the reader's roles more than once, or not at all");
      // an assessment in focus reads the roles too, now, for its strip's naming rule
      // (DAISY-02); it still offers no places, below
      c.expect(/kind === "public" \? \[null, null\] : await Promise\.all\(\[currentViewer\(\), peranSaya\(\)\]\)/.test(cangkang),
        "the public page asks for the reader's roles, or the shell reads them apart from the viewer");
      const cabang = (k: string) => {
        const i = cangkang.indexOf(`if (kind === "${k}")`);
        const j = i < 0 ? -1 : cangkang.indexOf("</header>", i);
        return i >= 0 && j > i ? cangkang.slice(i, j) : "";
      };
      const tab = (b: string) => b.match(/<TabTempat[^>]*\/>/)?.[0] ?? "";
      c.expect(/kecuali=\{\["\/mengajar"\]\}/.test(tab(cabang("pengajar"))), `the teaching shell does not offer the other places: ${tab(cabang("pengajar")) || "none"}`);
      c.expect(/kecuali=\{\["\/pimpinan"\]\}/.test(tab(cabang("pimpinan"))), `the management shell does not offer the other places: ${tab(cabang("pimpinan")) || "none"}`);
      c.expect(tab(cabang("pendataan")).length > 0 && !/kecuali/.test(tab(cabang("pendataan"))), "the intake shell does not offer the reader's places");
      c.expect(/href="\/aktivasi"/.test(cabang("pendataan")), "the intake shell has no way to Aktivasi");
      c.expect(!tab(cabang("public")) && !tab(cabang("focus")), "the public page or an assessment in focus offers other places");
      const iBelajar = cangkang.indexOf("const { mengajar } = konteksPembelajaran(peran)");
      c.expect(iBelajar > 0, "the learning branch no longer decides its context from the one roles answer");
      const belajar = iBelajar > 0 ? cangkang.slice(iBelajar) : "";
      const iMurid = belajar.lastIndexOf("return (");
      c.expect(/kecuali=\{\["\/mengajar"\]\}/.test(tab(belajar.slice(0, iMurid))), "an educator's own learning does not offer the other places");
      c.expect(!tab(belajar.slice(iMurid)), "a learner's own shell offers staff places");

      const aktivasi = code(readFileSync(join(repoRoot, "src", "app", "aktivasi", "page.tsx"), "utf8"));
      c.expect(/<CangkangPengalaman[^>]*current="aktivasi"/.test(aktivasi), "Aktivasi does not mark its own tab");

      /**
       * 4. KONFIGURASI AND STUDIO ARE NOT DEAD ENDS. Konfigurasi links Pendataan,
       *    Aktivasi and Studio (M3) and the administrator's other places;
       *    Studio links back to the person's places.
       */
      const konfig = code(readFileSync(join(repoRoot, "src", "app", "konfigurasi", "page.tsx"), "utf8"));
      for (const h of ["/pendataan", "/aktivasi", "/studio"]) {
        c.expect(new RegExp(`<Link href="${h}"`).test(konfig), `Konfigurasi has no link to ${h}`);
      }
      c.expect(/<TabTempat[\s\S]*?kecuali=\{\["\/konfigurasi"\]\}/.test(konfig), "Konfigurasi does not offer the administrator's other places");
      const studio = code(readFileSync(join(repoRoot, "src", "app", "studio", "layout.tsx"), "utf8"));
      c.expect(/<TabTempat /.test(studio) && /tempatDariPeran\(peran\)/.test(studio), "Studio offers no way back to the person's places");

      /**
       * 5. THE HOME PAGE: A SIGNED-IN READER'S DOORS ARE ONLY THE PLACES THEY
       *    HOLD (M15 UI; the gate on the first round). That version pointed
       *    three fixed doors somewhere plausible, so a student was offered
       *    /mengajar and a teacher a staff door that refused them.
       *
       *    a) THE RULE, OVER EVERY DISPLAY ROLE AND EVERY ROLES ANSWER: the
       *       staff doors are exactly tempatDariPeran of the roles held today
       *       (never the display role, which can outlive its assignment), and
       *       Belajar is there exactly for a learner. So a student is never
       *       sent to /mengajar, and a failed roles read opens no staff door.
       */
      const TAMPIL: Array<DisplayRole> = [...ROLES, null];
      const JAWABAN: Array<string[] | null> = [
        null, [], ["STUDENT"], ["NOT_A_ROLE"], ...ROLES.filter((r) => r !== "STUDENT").map((r) => [String(r)]),
        ["EDUCATOR", "HEAD_OF_DEPARTMENT"], ["EDUCATOR", "DEAN", "SYSTEM_ADMIN"],
      ];
      for (const tampil of TAMPIL) {
        for (const peran of JAWABAN) {
          const pintu = pintuMasuk(tampil, peran);
          const staf = pintu.filter((x) => x !== "/belajar");
          c.expect(JSON.stringify(staf) === JSON.stringify(tempatDariPeran(peran)),
            `${tampil} holding ${JSON.stringify(peran)}: staff doors ${JSON.stringify(staf)}, held ${JSON.stringify(tempatDariPeran(peran))}`);
          c.expect(pintu.includes("/belajar") === (tampil === "STUDENT"),
            `${tampil} holding ${JSON.stringify(peran)}: Belajar ${pintu.includes("/belajar") ? "offered" : "withheld"}`);
          c.expect(new Set(pintu).size === pintu.length, `${tampil} holding ${JSON.stringify(peran)}: a door twice`);
        }
      }
      c.expect(JSON.stringify(pintuMasuk("STUDENT", [])) === JSON.stringify(["/belajar"]), "a student is not offered exactly Belajar");
      c.expect(!pintuMasuk("STUDENT", null).includes("/mengajar") && !pintuMasuk("STUDENT", []).includes("/mengajar"),
        "a student is sent to /mengajar");
      c.expect(pintuMasuk("EDUCATOR", null).length === 0, "an unreadable roles answer still opens a staff door from the display role");

      /**
       *    b) GREETED BY FIRST NAME (D-020). A learner -- or anybody holding no
       *       staff role -- by their first name, staff in full, nobody named by
       *       a placeholder.
       */
      c.expect(namaSapaan("Nadia Putri Maharani", []) === "Nadia" && namaSapaan("  Nadia  Putri ", null) === "Nadia",
        `a learner is greeted as "${namaSapaan("Nadia Putri Maharani", [])}", not by first name`);
      c.expect(namaSapaan("Sari Wulandari Kusumaningrum", ["EDUCATOR"]) === "Sari Wulandari Kusumaningrum",
        "a staff member is not greeted as the school stored their name");
      c.expect(namaSapaan(null, []) === null && namaSapaan("   ", ["EDUCATOR"]) === null, "nobody named is greeted by a placeholder");

      /**
       *    c) THE PAGE DRAWS EXACTLY THAT. Anonymous: the three doors by
       *       purpose, two of them to sign in. Signed in: one door per entry of
       *       pintuMasuk, each with its own words, the honest line when there
       *       is none, the greeting through namaSapaan, and never the raw
       *       display name. One parallel read.
       */
      const beranda = code(readFileSync(join(repoRoot, "src", "app", "page.tsx"), "utf8"));
      const iMasuk = beranda.indexOf("const nama = namaSapaan(viewer.displayName, peran);");
      c.expect(iMasuk > 0 && /if \(!viewer\) \{/.test(beranda.slice(0, iMasuk)), "could not isolate the home page's signed-in half");
      const anonim = beranda.slice(0, iMasuk);
      const masuk = beranda.slice(iMasuk);
      c.expect(JSON.stringify(anonim.match(/<Link href="[^"]+"/g)) ===
        JSON.stringify(['<Link href="/belajar"', '<Link href="/masuk?peran=guru"', '<Link href="/masuk?peran=staf"']),
        `the anonymous doors changed: ${anonim.match(/<Link href="[^"]+"/g)}`);
      c.expect(!/\/masuk/.test(masuk), "a signed-in reader is offered a door to /masuk");
      c.expect(/const pintu = pintuMasuk\(viewer\.displayRole, peran\);/.test(masuk) && /pintu\.map\(\(href\) => \(\s*<Link key=\{href\} href=\{href\}/.test(masuk),
        "the signed-in doors are not exactly pintuMasuk's list");
      c.expect((masuk.match(/<Link\b/g) ?? []).length === 1, "the signed-in half draws a door that is not from pintuMasuk's list");
      c.expect(/s\("entry\.kosong"\)/.test(masuk), "a signed-in reader holding no place is not told so");
      c.expect(!/viewer\.displayName\s*[}?`]/.test(beranda) && /\{nama \? `, \$\{nama\}` : ""\}/.test(masuk),
        "the home page greets with the raw display name instead of namaSapaan's");
      c.expect(/await Promise\.all\(\[currentViewer\(\), peranSaya\(\), currentLocale\(\)\]\)/.test(beranda), "the home page reads the viewer, roles and language in sequence");
      const LABEL = /const LABEL_PINTU: Record<Pintu, HleEvent> = \{([^}]*)\}/.exec(beranda)?.[1] ?? "";
      for (const [pintu, kunci] of [["/belajar", "entry.learner"], ["/mengajar", "entry.educator"], ["/pimpinan", "entry.pimpinan"], ["/konfigurasi", "entry.staff"]]) {
        c.expect(new RegExp(`"${pintu}": "${kunci.replace(".", "\\.")}"`).test(LABEL), `the ${pintu} door is not labelled ${kunci}`);
        for (const locale of LOCALES) c.expect(t(kunci as HleEvent, "public", { locale }) !== TANPA_SALINAN, `(${locale}) ${kunci} has no copy`);
      }
      for (const locale of LOCALES) c.expect(t("entry.kosong", "public", { locale }) !== TANPA_SALINAN, `(${locale}) entry.kosong has no copy`);
      c.expect(!/>\s*Halo,|"kamu"/.test(beranda), "the home page writes its greeting outside the copy table");

      /**
       * 6. ON A PHONE THE STRIP WRAPS RATHER THAN OVERFLOWS. A tab cannot be
       *    narrower than its longest word; five places at 320px pushed the last
       *    one off screen by 69px before this. (Measured after: 40 renders, no
       *    tab off screen, none clipped, none under 44px, no overflow.)
       */
      const css = code(readFileSync(join(repoRoot, "src", "app", "experience.css"), "utf8"));
      const iP = css.indexOf("@media (max-width: 560px)");
      const tabsPonsel = /\n\s*\.pin-tabs\s*\{([^}]*)\}/.exec(css.slice(iP))?.[1] ?? "";
      c.expect(/flex-wrap:\s*wrap/.test(tabsPonsel), `on a phone the tab strip does not wrap: "${tabsPonsel.trim()}"`);

      return c.verdict(
        "the places a shell offers are D-010's map read through berandaPeran, agreeing with it for every display " +
        "role and for a three-role person; the list the tabs are drawn from is the places less the shell's own, " +
        "each with its label in both languages, TabTempat draws one link per entry and nothing else, and Pimpinan is " +
        "called Pimpinan beside the others. Every staff shell offers the other places " +
        "from one roles answer, the intake shell reaches Aktivasi, and neither the public page, an assessment in " +
        "focus nor a learner's own shell offers any. Konfigurasi links Pendataan, Aktivasi and Studio and the " +
        "administrator's other places, and Studio links back. On the home page a signed-in reader's doors are exactly " +
        "the places they hold -- over every display role and roles answer the staff doors equal the roles held today " +
        "and Belajar is a learner's alone, so a student is never sent to /mengajar and an unreadable answer opens no " +
        "staff door -- drawn one link each with their own words and an honest line when there are none; a learner is " +
        "greeted by first name and staff in full, never by the raw display name; the anonymous doors are unchanged. On " +
        "a phone the tab strip wraps rather than overflowing",
      );
    },
  },

  // ────────────────────────────────────────────────────────── DAISY-04 (lane: Daisy)
  {
    id: "DAISY-04-GALAT-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();

      /**
       * DAISY-04 (D-011; audit M7). ONE MISSING WORD USED TO TAKE A PAGE DOWN.
       * `t()` read `.en` off a row that did not exist, so a key built from data
       * -- `mengajar.instrumen.${mode}` on Siapkan -- threw, and the teacher saw
       * Next's English error page. Nine assessment modes exist; three had copy.
       *
       * 1. AN UNKNOWN KEY NEVER THROWS, for any persona in either language, and
       *    renders the calm fallback rather than the key itself. A throw is
       *    caught and reported here as the failure, so the red run is a red and
       *    not a crash of the runner.
       */
      const PERSONAS: Persona[] = ["learner", "educator", "staff", "public"];
      const HANTU = "mengajar.instrumen.MODE_YANG_BELUM_ADA" as HleEvent;
      for (const persona of PERSONAS) for (const locale of LOCALES) {
        let keluar = "";
        try { keluar = t(HANTU, persona, { locale }); }
        catch (e) { c.expect(false, `t() threw on an unknown key for ${persona}/${locale}: ${(e as Error).message.slice(0, 80)}`); continue; }
        c.expect(keluar === TANPA_SALINAN, `an unknown key rendered "${keluar}" for ${persona}/${locale}, not the calm fallback`);
        c.expect(!keluar.includes("MODE_YANG_BELUM_ADA") && !keluar.includes("mengajar."), "an unknown key put the identifier on screen");
      }
      // a real key is unaffected, and the internal-word guard still refuses:
      // the fallback is for a MISSING row, not a way round the copy's own test
      c.expect(t("galat.ulang", "public", { locale: "id" }) !== TANPA_SALINAN, "a real key renders the fallback");
      // Planted for one call and restored: a public key whose copy carries an
      // internal word must still throw. The row is the table's own object.
      const baris = telling("galat.ulang") as { default: string };
      const asli = baris.default;
      let threw = false;
      try { baris.default = `${asli} ${INTERNAL_WORDS[1]}`; t("galat.ulang", "public", { locale: "id" }); }
      catch { threw = true; }
      finally { baris.default = asli; }
      c.expect(threw, "the internal-word guard no longer refuses a public key that carries an internal word");
      c.expect(t("galat.ulang", "public", { locale: "id" }) === asli, "the planted row was not restored");

      /**
       * 2. EVERY ASSESSMENT MODE THE DATABASE CAN HOLD HAS A LABEL. Read from the
       *    migrations -- the CREATE TYPE and every ADD VALUE -- so a mode added
       *    tomorrow is in this list the day it is added, and Siapkan cannot
       *    render a dash (or, before, crash) for it.
       */
      const mig = readdirSync(join(repoRoot, "supabase", "migrations"))
        .filter((f) => f.endsWith(".sql"))
        .map((f) => readFileSync(join(repoRoot, "supabase", "migrations", f), "utf8"))
        .join("\n");
      const mode = new Set<string>();
      for (const m of mig.matchAll(/create type public\.assessment_mode as enum \(([^)]*)\)/gi)) {
        for (const v of m[1].matchAll(/'([A-Z_]+)'/g)) mode.add(v[1]);
      }
      for (const m of mig.matchAll(/alter type public\.assessment_mode add value (?:if not exists )?'([A-Z_]+)'/gi)) mode.add(m[1]);
      c.expect(mode.size >= 9 && mode.has("QUICK") && mode.has("PAPER"), `read only ${mode.size} assessment mode(s) from the migrations`);
      for (const m of mode) {
        const k = `mengajar.instrumen.${m}` as HleEvent;
        c.expect(allKeys().includes(k), `assessment mode ${m} has no label, so Siapkan shows a dash for it`);
        for (const locale of LOCALES) {
          if (allKeys().includes(k)) c.expect(t(k, "educator", { locale }).trim().length > 1, `${k} is empty in ${locale}`);
        }
      }
      c.expect(t("mengajar.instrumen.QUICK", "educator", { locale: "id" }) === "Uji Cepat", "the quick assessment is not called Uji Cepat on Siapkan (D-015)");

      /**
       * 3. PINTAR'S OWN PAGES, NEVER NEXT'S ENGLISH DEFAULTS. The error and
       *    root-error pages are client components (Next requires it), read the
       *    reader's language, and hand the shared panel the error's DIGEST --
       *    never its message, which can be database text (D-011).
       */
      const baca = (p: string) => { const f = join(repoRoot, p); return existsSync(f) ? readFileSync(f, "utf8") : ""; };
      const galat = baca("src/app/error.tsx");
      const akar = baca("src/app/global-error.tsx");
      const tidakAda = baca("src/app/not-found.tsx");
      const panel = baca("src/components/HalamanGalat.tsx");
      c.expect(galat.length > 0 && akar.length > 0 && tidakAda.length > 0 && panel.length > 0,
        "PINTAR has no error page, no root-error page or no not-found page of its own");
      for (const [nama, src] of [["error.tsx", galat], ["global-error.tsx", akar]] as const) {
        if (!src) continue;
        c.expect(/^"use client";/.test(src.trimStart()), `${nama} is not a client component`);
        c.expect(/<HalamanGalat[^>]*rujukan=\{error\.digest\}/.test(src), `${nama} does not pass the error's digest as the reference`);
        c.expect(!/error\.(message|stack|name)\b/.test(code(src)), `${nama} reads the error's own text`);
      }
      c.expect(/<html lang=\{locale\}>/.test(akar), "the root-error page does not declare the reader's language");
      c.expect(/LOCALE_COOKIE/.test(akar), "the root-error page does not read the language the reader chose");
      c.expect(/document\.documentElement\.lang/.test(galat), "the error page does not read the language the layout declared");
      c.expect(!/\.message\b|\.stack\b/.test(code(panel)), "the error panel can print the error's own text");
      c.expect(/role="alert"/.test(panel), "a failure is not announced to a screen reader");
      c.expect(/"galat\.ulang"/.test(panel) && /onClick=\{ulang\}/.test(panel), "the error page offers no way to try again");
      c.expect(/currentLocale\(\)/.test(tidakAda) && /"tidak_ada\.judul"/.test(tidakAda), "the not-found page is not PINTAR's, in the reader's language");
      // no visible word outside the copy table on any of the four
      const HURUF = />\s*[A-Za-z][^<{]*</;
      for (const [nama, src] of [["error.tsx", galat], ["global-error.tsx", akar], ["not-found.tsx", tidakAda], ["HalamanGalat.tsx", panel]] as const) {
        c.expect(!HURUF.test(code(src)), `${nama} writes a word outside the copy table`);
      }
      // and the copy itself is PINTAR's, in both languages, with no default's words
      for (const k of ["galat.judul", "galat.arti", "galat.rujukan", "galat.ulang", "galat.beranda", "tidak_ada.judul", "tidak_ada.arti"] as HleEvent[]) {
        for (const locale of LOCALES) {
          const v = t(k, "public", { locale });
          c.expect(v !== TANPA_SALINAN && v.length > 1, `${k} has no copy in ${locale}`);
          c.expect(!/could not be found|Application error|client-side exception|\b404\b|\b500\b/i.test(v), `${k} (${locale}) reads like a framework default: "${v}"`);
        }
      }

      return c.verdict(
        `an unknown key renders the calm fallback for every persona in both languages and never throws or shows ` +
        `the key, while a real key is unaffected and the internal-word guard still refuses a planted internal word; every one of the ` +
        `${mode.size} assessment modes read from the migrations has a label (Siapkan's crash); and PINTAR has its ` +
        "own error, root-error and not-found pages, client-side where Next requires it, in the reader's language, " +
        "passing the error's digest as the reference and never its message, announced as an alert, with every " +
        "word from the copy table",
      );
    },
  },
  {
    id: "DAISY-04-KUNCI-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();

      /**
       * DAISY-04, THE GATE'S HALF (§5.2): A MISTYPED KEY STILL FAILS A TEST.
       *
       * The calm "—" keeps a reader from a crashed page when a key has no copy,
       * which is right for the reader and wrong for the release: a typo that
       * used to throw in a test now renders a dash and passes. The typechecker
       * does not catch it either, because some twenty screens translate through
       * a helper typed `(k: string) => t(k as HleEvent, ...)` -- HasilKelas,
       * the report pages' shared `s`, the tour's `k` -- and a string is a
       * string.
       *
       * So every key written literally anywhere in src/ is swept against the
       * copy table: the first argument of `t(`, of every helper a file defines
       * over `t` (or over `as HleEvent`), and of the report pages' imported `s`;
       * a literal cast `as HleEvent`; and a `...Key="..."` prop. A template with
       * a placeholder (`mengajar.instrumen.${mode}`) cannot be checked whole, so
       * its fixed prefix must at least begin a real key; the full set of values
       * behind the one that matters here (the assessment modes) is enumerated
       * by DAISY-04-GALAT-01.
       */
      const kunci = new Set<string>(allKeys() as string[]);
      type Temuan = { kunci: string[]; awalan: string[]; penerjemah: string[] };
      const sapu = (src: string): Temuan => {
        const penerjemah = new Set(["t"]);
        for (const m of src.matchAll(/\b(?:const|let)\s+(\w+)\s*=\s*\(\s*(\w+)\b[^)]*\)\s*(?::\s*[\w<>[\]|, ]+)?=>\s*(?:t\(\s*\2\b|\2\s+as\s+HleEvent)/g)) penerjemah.add(m[1]);
        for (const m of src.matchAll(/\bfunction\s+(\w+)\s*\(\s*(\w+)\b[^)]*\)[^{]*\{\s*return\s+t\(\s*\2\b/g)) penerjemah.add(m[1]);
        if (/import\s*\{[^}]*\bs\b[^}]*\}\s*from\s*"[./]*_intel"/.test(src)) penerjemah.add("s");
        const out: Temuan = { kunci: [], awalan: [], penerjemah: [...penerjemah] };
        for (const n of penerjemah) {
          for (const m of src.matchAll(new RegExp(`(?<![\\w.])${n}\\(\\s*(["'])([^"'\\n]+)\\1`, "g"))) out.kunci.push(m[2]);
          for (const m of src.matchAll(new RegExp(`(?<![\\w.])${n}\\(\\s*\`([^\`$]+)\``, "g"))) out.kunci.push(m[1]);
          for (const m of src.matchAll(new RegExp(`(?<![\\w.])${n}\\(\\s*\`([^\`$]+)\\$\\{`, "g"))) out.awalan.push(m[1]);
        }
        for (const m of src.matchAll(/(["'])([a-z][\w-]*(?:\.[\w-]+)+)\1\s+as\s+HleEvent\b/g)) out.kunci.push(m[2]);
        for (const m of src.matchAll(/\b\w*Key=\{?(["'])([^"']+)\1/g)) out.kunci.push(m[2]);
        return out;
      };

      // CONTROL: the sweep finds each form it claims to, in a planted source
      const tanam = sapu(
        'const s = (k: string) => t(k as HleEvent, "staff", { locale });\n' +
        'const u = (key: HleEvent) => t(key, "learner");\n' +
        '<p>{s("umpanbalik.hasil.artii")}</p> {u(`nav.kelas`)} {t("entry.titel", "public")}\n' +
        '{s(`mengajar.instrumen.${mode}`)} {s(`tidak.ada.${x}`)} {("galat.judull" as HleEvent)} <X backKey="entry.title" />',
      );
      const salah = tanam.kunci.filter((k) => !kunci.has(k));
      c.expect(JSON.stringify(salah.sort()) === JSON.stringify(["entry.titel", "galat.judull", "umpanbalik.hasil.artii"]),
        `the sweep does not catch the planted typos (control): found ${JSON.stringify(salah)} among ${JSON.stringify(tanam.kunci)}`);
      c.expect(tanam.kunci.includes("nav.kelas") && tanam.kunci.includes("entry.title"), "the sweep misses a real key in the planted source (control)");
      c.expect(tanam.awalan.some((a) => !([...kunci].some((k) => k.startsWith(a)))), "the sweep does not catch a prefix no key begins with (control)");

      let jumlah = 0;
      let jumlahAwalan = 0;
      const dikenal = new Set<string>();
      for (const f of walk(join(repoRoot, "src")).filter((p) => /\.tsx?$/.test(p))) {
        const rel = relative(repoRoot, f);
        if (rel === join("src", "lib", "hle.ts")) continue; // the table itself
        const temuan = sapu(code(readFileSync(f, "utf8")));
        for (const k of temuan.kunci) {
          jumlah++;
          c.expect(kunci.has(k), `${rel} asks for "${k}", which is not in the copy table`);
        }
        for (const a of temuan.awalan) {
          jumlahAwalan++;
          c.expect([...kunci].some((k) => k.startsWith(a)), `${rel} builds a key from "${a}\${...}", and no key begins that way`);
        }
        if (temuan.penerjemah.length > 1) dikenal.add(rel);
      }
      // the sweep reached the helpers the typechecker cannot see through
      for (const f of [["src", "components", "umpanbalik", "HasilKelas.tsx"], ["src", "app", "edukator", "ringkasan", "page.tsx"], ["src", "lib", "tur.ts"]]) {
        c.expect(dikenal.has(join(...f)), `the sweep does not recognise ${join(...f)}'s key helper`);
      }
      c.expect(jumlah > 500, `the sweep checked only ${jumlah} literal keys; it has stopped seeing the code`);

      return c.verdict(
        `every literal key in src/ is in the copy table: ${jumlah} keys passed to t(, to each file's own helper over ` +
        `t (${dikenal.size} files, HasilKelas, the report pages' shared s and the tour's k among them), cast as ` +
        `HleEvent or given as a ...Key prop, and ${jumlahAwalan} template prefixes each beginning a real key. The ` +
        "control holds: in a planted source the sweep finds a typo through a string-typed helper, a typo passed to " +
        "t, a typo cast as HleEvent and a prefix no key begins with, and passes the real keys beside them",
      );
    },
  },

  // ────────────────────────────────────────────────────────── DAISY-05 (lane: Daisy)
  {
    id: "DAISY-05-STRUKTUR-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();

      /**
       * DAISY-05 (D-006, D-022, D-027; audit B1, journey S7): A SCHOOL BUILDS
       * ITS OWN STRUCTURE ON A SCREEN. Until now nothing in PINTAR could make a
       * Kelas: the audit's S7 was BLOCKED and step W1 built SD's tree in SQL.
       *
       * 1. EVERY ANSWER HAS ITS OWN SENTENCE (D-011, D-022). Each code BOB-01's
       *    actions or its list can return is read through the screen's own
       *    function in both languages: a real sentence from the copy table,
       *    never the code, never the calm dash, and no two codes the same. A
       *    failure nobody named carries its reference. A list that could not be
       *    read says so, and never "not saved", since nothing was.
       */
      const KODE: KodeStruktur[] = [...KODE_STRUKTUR_DB, "STRUCTURE_INPUT_INVALID", "STRUCTURE_FAILED"];
      for (const locale of LOCALES) {
        const kalimat = KODE.map((k) => kalimatGagal(k, undefined, locale));
        KODE.forEach((k, n) => {
          c.expect(kalimat[n].length > 12 && kalimat[n] !== TANPA_SALINAN && !kalimat[n].includes(k) && !/STRUCTURE_|PR020/.test(kalimat[n]),
            `(${locale}) ${k} is shown as "${kalimat[n]}"`);
        });
        c.expect(new Set(kalimat).size === KODE.length, `(${locale}) two refusal codes share one sentence`);
        const rujuk = kalimatGagal("STRUCTURE_FAILED", "AB12CD", locale);
        c.expect(rujuk.includes("AB12CD") && rujuk.includes(t("config.struktur.rujukan", "staff", { locale })),
          `(${locale}) a failure nobody named does not carry its reference: "${rujuk}"`);
        const baca = kalimatGagalBaca("STRUCTURE_FAILED", "ZZ9", locale);
        c.expect(baca.startsWith(t("config.struktur.gagal_baca", "staff", { locale })) && baca.includes("ZZ9")
          && !baca.includes(t("config.struktur.galat.gagal", "staff", { locale })),
          `(${locale}) an unreadable list is not told apart from an unsaved change: "${baca}"`);
        c.expect(kalimatGagalBaca("STRUCTURE_NOT_ALLOWED", undefined, locale) === t("config.struktur.galat.tidak_berwenang", "staff", { locale }),
          `(${locale}) a refusal to read the list does not say so`);
      }

      /**
       * 2. ONLY BAGIAN, TINGKAT AND KELAS (D-006, D-027). The tree the screen
       *    draws is OUTPUT here from rows that include a planted Jenjang and
       *    Reguler: neither survives, each place sits under its own parent, and
       *    an inactive place comes after the active ones (it cannot be changed,
       *    so it is not in the way).
       */
      type Baris = SimpulStruktur;
      const ROWS: Baris[] = [
        { node_id: "b1", level: "BAGIAN", parent_id: null, name: "Kelas Rendah", academic_year: null, is_active: true, active_members: null },
        { node_id: "b2", level: "BAGIAN", parent_id: null, name: "Bagian Lama", academic_year: null, is_active: false, active_members: null },
        { node_id: "t1", level: "TINGKAT", parent_id: "b1", name: "Kelas 1", academic_year: "2026/2027", is_active: true, active_members: 1 },
        { node_id: "t2", level: "TINGKAT", parent_id: "b1", name: "Kelas 0", academic_year: "2026/2027", is_active: false, active_members: 0 },
        { node_id: "k1", level: "KELAS", parent_id: "t1", name: "1A", academic_year: "2026/2027", is_active: true, active_members: 12 },
        { node_id: "k2", level: "KELAS", parent_id: "t1", name: "1 Lama", academic_year: "2026/2027", is_active: false, active_members: 0 },
        // what the screen must never draw, even were the list ever to carry it
        { node_id: "f1", level: "FACULTY" as never, parent_id: null, name: "Jenjang SD", academic_year: null, is_active: true, active_members: null },
        { node_id: "p1", level: "PROGRAMME" as never, parent_id: "b1", name: "Reguler Tersembunyi", academic_year: null, is_active: true, active_members: null },
      ];
      const pohon = pohonStruktur(ROWS);
      const semuaNama = JSON.stringify(pohon);
      c.expect(!semuaNama.includes("Jenjang SD") && !semuaNama.includes("Reguler Tersembunyi"), "a hidden Jenjang or Reguler reaches the tree");
      c.expect(JSON.stringify(pohon.map((b) => b.name)) === JSON.stringify(["Kelas Rendah", "Bagian Lama"]), `the Bagian are not active first: ${pohon.map((b) => b.name)}`);
      c.expect(JSON.stringify(pohon[0]?.tingkat.map((x) => x.name)) === JSON.stringify(["Kelas 1", "Kelas 0"]), "the Tingkat are not under their Bagian, active first");
      c.expect(JSON.stringify(pohon[0]?.tingkat[0]?.kelas.map((x) => x.name)) === JSON.stringify(["1A", "1 Lama"]), "the Kelas are not under their Tingkat, active first");
      c.expect(bolehDiubah({ is_active: true }) && !bolehDiubah({ is_active: false }) && !bolehDitambahi({ is_active: false }),
        "an inactive place can still be changed or added to (no reactivation in sprint 1, D-022)");

      /**
       * 3. WHAT GLADYS GETS, RENDERED. The panel itself is rendered to HTML in a
       *    child process (it is a client component: a stand-in router is all it
       *    needs, and nothing is sent), in both languages, from those rows, from
       *    an empty school, and from a list that could not be read. Checked:
       *    - the three steps, in order, above the tree;
       *    - a Tingkat and a Kelas show their school year, a Bagian none;
       *    - "Tambah Kelas" under every active Tingkat and no other, carrying that
       *      Tingkat and NO year field (a Kelas takes its Tingkat's, which is
       *      shown); "Tambah Tingkat" under every active Bagian, carrying it and a
       *      year field filled with this year; "Tambah Bagian" for the school;
       *    - an active place offers rename and deactivate as plain buttons, an
       *      inactive one says "Nonaktif" and offers nothing;
       *    - nothing on first render can send a rename or a deactivation: no
       *      field names a place (`simpul`) and no "Ya, nonaktifkan" exists until
       *      somebody presses "Nonaktifkan";
       *    - a planted Jenjang or Reguler is nowhere on the page.
       *    The confirmation step, rendered on its own, names the level and the
       *    place, says it cannot be undone here, and is the form that sends it.
       */
      const KASUS = [
        ...LOCALES.map((locale) => ({ jenis: "panel", locale, props: { locale, institusi: "i1", rows: ROWS, gagalBaca: null, tahunKini: "2026/2027" } })),
        { jenis: "panel", locale: "id", props: { locale: "id", institusi: "i1", rows: [], gagalBaca: null, tahunKini: "2026/2027" } },
        { jenis: "panel", locale: "id", props: { locale: "id", institusi: "i1", rows: null, gagalBaca: { code: "STRUCTURE_FAILED", ref: "AB12CD" }, tahunKini: "2026/2027" } },
        ...LOCALES.map((locale) => ({ jenis: "tanya", locale, props: { locale, simpul: ROWS[4], sibuk: false } })),
      ];
      const anak = spawnSync(process.execPath, ["--import", "tsx", "-e",
        "(async () => {" +
        '  const { createElement: h } = await import("react");' +
        '  const { renderToStaticMarkup } = await import("react-dom/server");' +
        '  const { AppRouterContext } = await import("next/dist/shared/lib/app-router-context.shared-runtime.js");' +
        '  const m = await import("file://" + process.cwd() + "/src/components/struktur/PanelStruktur.tsx");' +
        "  const Panel = m.default?.default ?? m.default;" +
        "  const Tanya = m.KonfirmasiNonaktif ?? m.default?.KonfirmasiNonaktif;" +
        "  const r = { refresh() {}, push() {}, replace() {}, back() {}, forward() {}, prefetch() {} };" +
        "  const out = JSON.parse(process.env.KASUS_STRUKTUR).map((k) => renderToStaticMarkup(h(AppRouterContext.Provider, { value: r }," +
        '    k.jenis === "panel" ? h(Panel, k.props) : h(Tanya, { ...k.props, kirim() {}, batal() {} }))));' +
        "  process.stdout.write(JSON.stringify(out));" +
        "})().catch((e) => { process.stderr.write(String(e && e.stack || e)); process.exit(1); });"], {
        cwd: repoRoot, encoding: "utf8", env: { ...process.env, KASUS_STRUKTUR: JSON.stringify(KASUS) },
      });
      let html: string[] = [];
      try { html = JSON.parse(anak.stdout); } catch { /* reported below */ }
      if (c.expect(anak.status === 0 && html.length === KASUS.length,
        `the panel could not be rendered: ${(anak.stderr || "").trim().split("\n").slice(0, 3).join(" ")}`)) {
        const teks = (x: string) => x.replace(/<[^>]+>/g, " ").replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
        const baris = (x: string, nama: string) => {
          const i = x.indexOf(`<strong class="pin-str-nama">${nama}</strong>`);
          const a = i < 0 ? -1 : x.lastIndexOf('<div class="pin-str-baris', i);
          const b = i < 0 ? -1 : x.indexOf('<div aria-live="polite">', i);
          return a >= 0 && b > a ? x.slice(a, b) : "";
        };
        const formDengan = (x: string, nama: string, id: string) => {
          const i = x.indexOf(`name="${nama}" value="${id}"`);
          if (i < 0) return "";
          return x.slice(x.lastIndexOf("<form", i), x.indexOf("</form>", i));
        };
        LOCALES.forEach((locale, n) => {
          const x = html[n];
          const s = (k: HleEvent) => t(k, "staff", { locale });
          const tampil = teks(x);
          // the steps, in order
          const langkah = ["config.struktur.langkah.bagian", "config.struktur.langkah.tingkat", "config.struktur.langkah.kelas"].map((k) => tampil.indexOf(s(k as HleEvent)));
          c.expect(langkah.every((i) => i >= 0) && langkah[0] < langkah[1] && langkah[1] < langkah[2]
            && x.indexOf('<ol class="pin-str-langkah">') >= 0 && x.indexOf("</ol>") < x.indexOf('<ul class="pin-str-pohon">'),
            `(${locale}) the three steps are not shown, in order, above the tree`);
          // levels, years, students
          const bB1 = teks(baris(x, "Kelas Rendah")), bT1 = teks(baris(x, "Kelas 1")), bK1 = teks(baris(x, "1A"));
          c.expect(bB1.startsWith(s("config.struktur.jenis.BAGIAN")) && !/\d{4}\/\d{4}/.test(bB1), `(${locale}) the Bagian row: "${bB1}"`);
          c.expect(bT1.startsWith(s("config.struktur.jenis.TINGKAT")) && bT1.includes("2026/2027") && bT1.includes(`1 ${s("config.struktur.murid.satu")}`),
            `(${locale}) the Tingkat row does not show its level, year and students: "${bT1}"`);
          c.expect(bK1.startsWith(s("config.struktur.jenis.KELAS")) && bK1.includes("2026/2027") && bK1.includes(`12 ${s("config.struktur.murid.banyak")}`),
            `(${locale}) the Kelas row does not show its level, year and students: "${bK1}"`);
          // the add forms: where, what they carry
          const fKelas = formDengan(x, "tingkat", "t1");
          c.expect(fKelas.includes('name="nama"') && !fKelas.includes("tahun_ajaran") && teks(fKelas).includes(s("config.struktur.tambah.KELAS")),
            `(${locale}) the active Tingkat has no "${s("config.struktur.tambah.KELAS")}" form, or it asks for a year`);
          c.expect(tampil.includes(`${s("config.struktur.tahun_ikut")} 2026/2027`), `(${locale}) the Kelas form does not show the year it takes`);
          const fTingkat = formDengan(x, "bagian", "b1");
          c.expect(/name="tahun_ajaran"[^>]*value="2026\/2027"|value="2026\/2027"[^>]*name="tahun_ajaran"/.test(fTingkat) && teks(fTingkat).includes(s("config.struktur.tambah.TINGKAT")),
            `(${locale}) the active Bagian has no "${s("config.struktur.tambah.TINGKAT")}" form with this year filled in`);
          c.expect(teks(formDengan(x, "institusi", "i1")).includes(s("config.struktur.tambah.BAGIAN")), `(${locale}) the school has no "${s("config.struktur.tambah.BAGIAN")}" form`);
          c.expect(!formDengan(x, "tingkat", "t2") && !formDengan(x, "bagian", "b2"), `(${locale}) an inactive place can be added to`);
          c.expect((x.match(/<form/g) ?? []).length === 3, `(${locale}) the panel draws ${(x.match(/<form/g) ?? []).length} forms, not the three add forms`);
          // actions: offered on active places, never on inactive ones, never sent from here
          for (const nama of ["Kelas Rendah", "Kelas 1", "1A"]) {
            const r = baris(x, nama);
            c.expect(r.includes(`<button type="button" class="pin-btn pin-quiet">${s("config.struktur.ubah_nama")}</button>`)
              && r.includes(`<button type="button" class="pin-btn pin-quiet">${s("config.struktur.nonaktifkan")}</button>`),
              `(${locale}) the active ${nama} does not offer rename and deactivate as plain buttons`);
          }
          for (const nama of ["Bagian Lama", "Kelas 0", "1 Lama"]) {
            const r = baris(x, nama);
            c.expect(teks(r).includes(s("config.struktur.nonaktif")) && !r.includes("<button"), `(${locale}) the inactive ${nama} is not marked, or can still be changed`);
          }
          c.expect(!x.includes('name="simpul"') && !tampil.includes(s("config.struktur.konfirmasi.ya")),
            `(${locale}) a rename or a deactivation can be sent without being asked for first`);
          c.expect(!tampil.includes("Jenjang SD") && !tampil.includes("Reguler Tersembunyi") && !/Jenjang|Reguler|FACULTY|PROGRAMME/.test(tampil),
            `(${locale}) a hidden level reaches the page`);
        });
        // an empty school: the way to its first Kelas is on the screen (audit S7)
        const kosong = teks(html[2]);
        c.expect(kosong.includes(t("config.struktur.kosong", "staff")) && formDengan(html[2], "institusi", "i1").length > 0,
          "an empty school is not told so and offered its first Bagian");
        c.expect(/(buat|tambah)\s+(kelas|rombel|unit|jurusan|departemen)/i.test(kosong),
          "an empty school's screen does not answer the audit's S7 question (is there a screen to create a class?)");
        // a list that could not be read
        c.expect(/role="alert"/.test(html[3]) && teks(html[3]).includes("AB12CD") && teks(html[3]).startsWith(t("config.struktur.gagal_baca", "staff")),
          `an unreadable list is not reported with its reference: "${teks(html[3])}"`);
        // the question
        LOCALES.forEach((locale, n) => {
          const x = html[4 + n];
          const s = (k: HleEvent) => t(k, "staff", { locale });
          const tampil = teks(x);
          c.expect(tampil.startsWith(`${s("config.struktur.konfirmasi.tanya")} ${s("config.struktur.jenis.KELAS")} 1A ?`) || tampil.startsWith(`${s("config.struktur.konfirmasi.tanya")} ${s("config.struktur.jenis.KELAS")} 1A?`),
            `(${locale}) the question does not name the level and the place: "${tampil}"`);
          c.expect(tampil.includes(s("config.struktur.konfirmasi.arti")), `(${locale}) the question does not say it cannot be undone here`);
          c.expect(x.includes('name="simpul" value="k1"') && x.includes(`<button type="submit" class="pin-btn pin-str-bahaya">${s("config.struktur.konfirmasi.ya")}</button>`)
            && x.includes(`<button type="button" class="pin-btn">${s("config.struktur.batal")}</button>`),
            `(${locale}) the question is not the form that sends the deactivation, with a way back`);
        });
      }

      /**
       * 4. FROM THE SOURCE: the question is the only way to deactivate, and
       *    every answer is followed by a fresh read of the list (BOB-08(d)).
       *    - `nonaktifkanStrukturAksi` is dispatched only through the question,
       *      which is drawn only after "Nonaktifkan" is pressed;
       *    - every one of the five actions goes through the one wrapper, which
       *      reads the list again after any answer that is not a success,
       *      including a dropped connection; a success is re-read by the action
       *      itself, whose success path revalidates the page (BOB-01's file,
       *      read here so a change there shows up here).
       */
      const panel = code(readFileSync(join(repoRoot, "src", "components", "struktur", "PanelStruktur.tsx"), "utf8"));
      c.expect((panel.match(/nonaktifkanStrukturAksi/g) ?? []).length === 2 && /useAksi\(nonaktifkanStrukturAksi,/.test(panel),
        "the deactivation is dispatched from somewhere other than the question");
      c.expect((panel.match(/kirimNonaktif/g) ?? []).length === 2 && /\{mode === "tanya" && \(\s*<KonfirmasiNonaktif[\s\S]*?kirim=\{kirimNonaktif\}/.test(panel),
        "the deactivation can be sent without the question being open");
      c.expect(/onClick=\{\(\) => setMode\("tanya"\)\}>\s*\{s\("config\.struktur\.nonaktifkan"\)\}/.test(panel), "\"Nonaktifkan\" does something other than ask");
      c.expect(/useAksi\(ubahNamaStrukturAksi,/.test(panel) && ["buatBagianAksi", "buatTingkatAksi", "buatKelasAksi"].every((a) => new RegExp(`aksi=\\{${a}\\}`).test(panel))
        && /useAksi\(aksi,/.test(panel) && !/action=\{(?:buat|ubah|nonaktif)\w*Aksi\}/.test(panel),
        "an action is sent around the wrapper that re-reads the list");
      const pembungkus = /function useAksi[\s\S]*?\n\}/.exec(panel)?.[0] ?? "";
      c.expect(/catch \{\s*hasil = \{ ok: false, code: "STRUCTURE_FAILED" \};\s*\}/.test(pembungkus) && /if \(!hasil\.ok\) router\.refresh\(\);/.test(pembungkus),
        "the list is not read again after a refusal or a dropped connection");
      const aksiFile = code(readFileSync(join(repoRoot, "src", "app", "konfigurasi", "actions.ts"), "utf8"));
      c.expect(/revalidatePath\("\/konfigurasi", "layout"\);\s*return \{ ok: true, id: data \};/.test(aksiFile),
        "a successful structure action no longer re-reads the page, so a success would leave the list stale");

      /**
       * 5. THE KONFIGURASI PAGE. The section is the first one and the first
       *    entry in its menu; its list comes from `bacaStruktur` and nothing
       *    else (no org_nodes read feeds it); the school is one the reader
       *    administers; the Tingkat form's year is this school year in Jakarta.
       *    No file of the screen names a hidden level, and no word of its copy
       *    does.
       */
      const konfig = code(readFileSync(join(repoRoot, "src", "app", "konfigurasi", "page.tsx"), "utf8"));
      c.expect(/const nav: Array<\[string, string\]> = \[\s*\["struktur"/.test(konfig), "Struktur sekolah is not the first entry in Konfigurasi's menu");
      c.expect(/<div className="grid gap-4">\s*(?:\{\s*\}\s*)*<section id="struktur"/.test(konfig), "Struktur sekolah is not the first section");
      c.expect(/const sekolahKu = sekolahDitawarkan\(institutions \?\? \[\], \(id\) => isSys === true \|\| adminInstitutionIds\.includes\(id\)\);/.test(konfig)
        && /const sekolahStruktur = sekolahDipilih\(sekolahKu, sp\.sekolah\);/.test(konfig)
        && /bacaStruktur\(sekolahStruktur\.id\)/.test(konfig), "the structure shown is not read through bacaStruktur for a school on offer to the reader");
      // the picker's rule needs the tenant's kind and state, so the read must carry both
      c.expect(/from\("institutions"\)\.select\("[^"]*\bis_active\b[^"]*\btenant_kind\b[^"]*"\)/.test(konfig),
        "Konfigurasi reads the schools without their kind or state, so the picker cannot tell a real school");
      c.expect((konfig.match(/\bsekolahKu\s*=/g) ?? []).length === 1 && (konfig.match(/\bsekolahStruktur\s*=/g) ?? []).length === 1
        && !/sekolahKu\.(?:find|filter)\(/.test(konfig), "the page picks its school by its own rule, around the shared one");

      /**
       * 6. THE SCHOOL PICKER OFFERS ONLY REAL, ACTIVE SCHOOLS (audit S7b). A
       *    platform admin reads every tenant, and sorted by name the national
       *    library came first, so Konfigurasi started inside "PINTAR Kurikulum
       *    Nasional" (PLATFORM_CANONICAL). The shared rule (sekolah.ts, also
       *    DAISY-06's Studio picker) is OUTPUT here over a list in the database's
       *    own order: the canonical tenant, an inactive school, a kind nobody has
       *    decided about and rows missing their kind or state are never offered,
       *    even when asked for by address; the first real school is where it
       *    starts; and an administrator is offered only their own.
       */
      const TENANT: SekolahBaris[] = [
        { id: "kanon", name: "PINTAR Kurikulum Nasional", tenant_kind: "PLATFORM_CANONICAL", is_active: true },
        { id: "sd", name: "SD Zayd Pintar Selalu", tenant_kind: "INSTITUTION", is_active: true },
        { id: "tutup", name: "Sekolah Lama", tenant_kind: "INSTITUTION", is_active: false },
        { id: "baru", name: "Sekolah Masa Depan", tenant_kind: "SOMETHING_NEW", is_active: true },
        { id: "tanpa", name: "Sekolah Tanpa Jenis", tenant_kind: null, is_active: true },
        { id: "sma", name: "SMA Zayd Pintar Selalu", tenant_kind: "INSTITUTION", is_active: true },
      ];
      const semuaBoleh = sekolahDitawarkan(TENANT, () => true);
      c.expect(JSON.stringify(semuaBoleh.map((x) => x.id)) === JSON.stringify(["sd", "sma"]),
        `a platform admin is offered ${JSON.stringify(semuaBoleh.map((x) => x.id))}, not only the real, active schools`);
      c.expect(sekolahDipilih(semuaBoleh)?.id === "sd", `a platform admin starts on ${sekolahDipilih(semuaBoleh)?.name}, not the first real school`);
      for (const diminta of ["kanon", "tutup", "baru", "tanpa", "bukan-sekolah"]) {
        c.expect(sekolahDipilih(semuaBoleh, diminta)?.id === "sd", `asking for "${diminta}" by address opens it instead of the first real school`);
      }
      c.expect(sekolahDipilih(semuaBoleh, "sma")?.id === "sma", "a real school asked for by address is not opened");
      const adminSma = sekolahDitawarkan(TENANT, (id) => id === "sma" || id === "kanon");
      c.expect(JSON.stringify(adminSma.map((x) => x.id)) === JSON.stringify(["sma"]), "an administrator is offered a school that is not theirs, or the library");
      c.expect(sekolahDipilih(sekolahDitawarkan(TENANT, () => false)) === null, "somebody who administers nothing is offered a school");
      c.expect(/rows=\{struktur\.ok \? struktur\.rows : null\}/.test(konfig) && /tahunKini=\{tahunAjaranPada\(new Date\(\)\)\}/.test(konfig),
        "the panel is fed from something other than bacaStruktur's answer, or its year is not this school year");
      for (const f of walk(join(repoRoot, "src", "components", "struktur"))) {
        c.expect(!/FACULTY|PROGRAMME|Jenjang|Reguler/.test(code(readFileSync(f, "utf8"))), `${relative(repoRoot, f)} names a hidden level`);
      }
      const salinan = (allKeys() as string[]).filter((k) => k.startsWith("config.struktur.") || k === "config.section.struktur");
      c.expect(salinan.length >= 45, `only ${salinan.length} structure copy keys`);
      for (const k of salinan) for (const locale of LOCALES) {
        const v = t(k as HleEvent, "staff", { locale });
        c.expect(v !== TANPA_SALINAN && !/Jenjang|Reguler/.test(v), `(${locale}) ${k} is missing or names a hidden level: "${v}"`);
      }

      return c.verdict(
        `every one of the ${KODE.length} answers BOB-01 can give has its own sentence in both languages, never the code, a failure ` +
        "carries its reference and an unreadable list is not called unsaved. The tree drops a planted Jenjang and Reguler and puts " +
        "inactive places last. RENDERED in both languages: the three steps above the tree; years on Tingkat and Kelas only; " +
        "'Tambah Kelas' under each active Tingkat carrying it and no year, 'Tambah Tingkat' under each active Bagian with this year " +
        "filled in, 'Tambah Bagian' for the school, and exactly those three forms; rename and deactivate on active places only; " +
        "nothing sendable until 'Nonaktifkan' opens the question, which names the place, says it cannot be undone here and is the " +
        "form that sends it; an empty school answers the audit's S7; an unreadable list reports its reference. From the source, " +
        "every action goes through one wrapper that re-reads after any non-success, successes are re-read by the action itself, " +
        "and the section is Konfigurasi's first, fed only by bacaStruktur for a school on offer. The shared school rule offers only " +
        "active INSTITUTION tenants the reader administers -- never the national library, an inactive school, an undecided kind or " +
        "a row without its kind -- starts on the first real school, and opens none of the others even when asked for by address",
      );
    },
  },

  // ────────────────────────────────────────────────────────── DAISY-08 (lane: Daisy)
  {
    id: "DAISY-08-PANEL-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();

      /**
       * DAISY-08 (D-018): THE FIRST SCREEN EVERY VISITOR SEES SHOWS PINTAR'S
       * OWN STATEMENT, NOT A PLACEHOLDER. The sign-in panel was built for a
       * licensed classroom photograph that does not exist yet, and showed a dark
       * box labelled "FOTO CONTOH" on /masuk and on the expired-link screen.
       *
       * 1. NO PLACEHOLDER ANYWHERE. The copy table has no placeholder key, no
       *    telling for any persona in either language says "FOTO CONTOH" or
       *    "PLACEHOLDER PHOTO", and no source file draws the old photo scaffold.
       */
      const PENANDA = /FOTO CONTOH|PLACEHOLDER PHOTO/i;
      c.expect(!(allKeys() as string[]).includes("auth.placeholder"), "the placeholder key is still in the copy table");
      const tellings = renderAll();
      const bocor = tellings.filter((x) => PENANDA.test(x.text));
      c.expect(bocor.length === 0, `a telling still says it is a placeholder: ${bocor.map((x) => `${x.event}/${x.locale}`).join(", ")}`);
      for (const f of walk(join(repoRoot, "src")).filter((p) => /\.(tsx?|css)$/.test(p))) {
        const src = code(readFileSync(f, "utf8"));
        c.expect(!PENANDA.test(src) && !/pin-vis-(?:foto|tanda|scrim)|PanelFoto|auth-scrim|auth-say-veil/.test(src),
          `${relative(repoRoot, f)} still draws the photo placeholder or its scaffold`);
      }

      /**
       * 2. THE STATEMENT, RENDERED, AND READ BY A SCREEN READER. The panel is
       *    called and its tree walked in both languages: a section labelled by
       *    its own heading, the statement from the copy table, no image, and
       *    nothing on it hidden from assistive technology except the small
       *    decorative rule. (It used to be aria-hidden as decoration while its
       *    phone twin is hidden from the tablet width up, so a screen reader on
       *    a tablet or desktop heard no statement at all.) The phone twin says
       *    the same words.
       */
      type El = { type?: unknown; props?: Record<string, unknown> };
      const semua = (n: Simpul, out: El[] = []): El[] => {
        if (n === null || n === undefined || typeof n === "string" || typeof n === "number") return out;
        out.push(n);
        for (const k of anakDari(n)) semua(k, out);
        return out;
      };
      for (const locale of LOCALES) {
        const panel = PanelPernyataan({ locale }) as Simpul;
        const els = semua(panel);
        const akar = els[0];
        const h2 = els.find((e) => e.type === "h2");
        const p = els.find((e) => e.type === "p");
        c.expect(akar?.type === "section" && akar?.props?.["aria-labelledby"] === h2?.props?.id && typeof h2?.props?.id === "string",
          `(${locale}) the panel is not a section labelled by its own heading`);
        c.expect(teksPohon(h2 as Simpul).join("") === t("auth.say_h", "public", { locale }) && teksPohon(p as Simpul).join("") === t("auth.say_p", "public", { locale }),
          `(${locale}) the panel does not carry PINTAR's statement from the copy table`);
        const tersembunyi = els.filter((e) => e.props?.["aria-hidden"] === true || e.props?.["aria-hidden"] === "true");
        c.expect(tersembunyi.length === 1 && tersembunyi[0].type === "span" && teksPohon(tersembunyi[0] as Simpul).join("") === "",
          `(${locale}) part of the statement is hidden from a screen reader`);
        c.expect(!els.some((e) => e.type === "img" || e.type === "picture"), `(${locale}) the panel draws an image PINTAR holds no licence for`);
        const ponsel = teksPohon(KalimatPonsel({ locale }) as Simpul).join(" ");
        c.expect(ponsel.includes(t("auth.say_h", "public", { locale })) && ponsel.includes(t("auth.say_p", "public", { locale })),
          `(${locale}) the phone twin does not say the same statement`);
      }
      for (const f of ["masuk/page.tsx", "auth/callback/page.tsx"]) {
        const src = code(readFileSync(join(repoRoot, "src", "app", f), "utf8"));
        c.expect(/<PanelPernyataan locale=\{locale\} \/>/.test(src) && /<KalimatPonsel locale=\{locale\} \/>/.test(src),
          `${f} does not show the statement panel and its phone twin`);
      }

      /**
       * 3. EXACTLY ONE COPY AT EVERY WIDTH, from the stylesheet. Below the
       *    tablet width the panel is display:none and the phone twin shows;
       *    from 561px the twin is display:none and the panel shows; from 1024px
       *    the panel is the right-hand half. display:none also removes a copy
       *    from the reading order, so a screen reader hears it once.
       */
      const css = code(readFileSync(join(repoRoot, "src", "app", "experience.css"), "utf8"));
      const blok = (awal: string) => {
        const i = css.indexOf(awal);
        if (i < 0) return "";
        for (let d = 0, k = css.indexOf("{", i); k < css.length; k++) {
          if (css[k] === "{") d++;
          else if (css[k] === "}" && --d === 0) return css.slice(i, k);
        }
        return "";
      };
      const aturan = (scope: string, sel: string) => {
        const esc = sel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        return new RegExp(`(?:^|\\n)\\s*${esc}\\s*\\{([^}]*)\\}`).exec(scope)?.[1] ?? "";
      };
      const tablet = blok("@container masuk (min-width: 561px)");
      const desktop = blok("@container masuk (min-width: 1024px)");
      const luar = css.replace(tablet, "").replace(desktop, "");
      c.expect(/display:\s*none/.test(aturan(luar, ".pin-vis")) && !/display:\s*none/.test(aturan(luar, ".pin-phonesay")),
        "on a phone the panel is not hidden or its twin is not shown");
      c.expect(/display:\s*none/.test(aturan(tablet, ".pin-phonesay")) && /display:\s*block/.test(aturan(tablet, ".pin-vis")),
        "from the tablet width the twin is not hidden or the panel is not shown");
      c.expect(/display:\s*block/.test(aturan(desktop, ".pin-vis")), "on a wide screen the panel is not shown");

      /**
       * 4. LEGIBLE ON ITS OWN GROUND, COMPUTED FROM THE TOKENS. The panel is
       *    the brand colour with the brand's ink, and nothing is laid over it:
       *    the two gradients a photograph needed are gone. The contrast is
       *    worked out from the values in globals.css, so a later change of
       *    either token cannot drop the statement below WCAG AA unnoticed.
       */
      const panelRule = aturan(luar, ".pin-vis");
      const sayRule = aturan(luar, ".pin-say") + aturan(luar, ".pin-say-p") + aturan(luar, ".pin-say-h");
      c.expect(/background:\s*var\(--pintar-primary\)/.test(panelRule) && /(?:^|;|\s)color:\s*var\(--pintar-primary-ink\)/.test(panelRule),
        `the panel is not the brand colour with the brand's ink: "${panelRule.trim()}"`);
      c.expect(!/gradient|background/.test(sayRule) && !/url\(|gradient/.test(panelRule), "something is still laid over the panel's ground");
      const globals = readFileSync(join(repoRoot, "src", "app", "globals.css"), "utf8");
      const hex = (nama: string) => /#([0-9a-f]{6})\b/i.exec(new RegExp(`--${nama}:\\s*([^;]+);`).exec(globals)?.[1] ?? "")?.[1] ?? "";
      const lum = (h: string) => {
        const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
          .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      };
      const [dasar, tinta] = [hex("pintar-primary"), hex("pintar-primary-ink")];
      const rasio = dasar && tinta ? (Math.max(lum(dasar), lum(tinta)) + 0.05) / (Math.min(lum(dasar), lum(tinta)) + 0.05) : 0;
      c.expect(rasio >= 4.5, `the statement on the panel measures ${rasio.toFixed(2)}:1, below WCAG AA (4.5:1)`);
      c.expect(lum("000000") === 0 && Math.abs((1.05 / 0.05) - 21) < 1e-9, "the contrast arithmetic is wrong (control)");

      return c.verdict(
        `no placeholder anywhere: no key, none of ${tellings.length} tellings in either language, no source file. The statement ` +
        "panel is RENDERED in both languages as a section labelled by its own heading, carrying PINTAR's statement from the copy " +
        "table with no image and nothing hidden from a screen reader but its decorative rule, and its phone twin says the same; " +
        "/masuk and the expired-link screen both show it. From the stylesheet, exactly one copy is displayed at every width, and " +
        `the panel is the brand colour with the brand's ink and nothing laid over it: ${rasio.toFixed(2)}:1, computed from the tokens`,
      );
    },
  },

  // ────────────────────────────────────────────────────────── DAISY-06 (lane: Daisy)
  {
    id: "DAISY-06-TEMPLAT-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();

      /**
       * DAISY-06: THE LESSON TEMPLATE IS BOB-02'S CONTRACT, WRITTEN OUT. It is
       * built in the browser from KOLOM, LEMBAR and BATAS_PAKET (no dependency,
       * D-030), so it is checked here against Bob's own reader and converter --
       * the code the upload runs -- not against a copy of the rules.
       *
       * A small reader of stored zip entries, for what Bob's reader does not
       * report (the entry method, the timestamp, the CRC, the raw sheet XML).
       */
      type Entri = { nama: string; metode: number; waktu: number; tanggal: number; crc: number; isi: Buffer };
      const entriZip = (bytes: Uint8Array): Entri[] => {
        const b = Buffer.from(bytes);
        const akhir = b.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
        const n = b.readUInt16LE(akhir + 10);
        let p = b.readUInt32LE(akhir + 16);
        const out: Entri[] = [];
        for (let i = 0; i < n; i++) {
          const nama = b.toString("utf8", p + 46, p + 46 + b.readUInt16LE(p + 28));
          const off = b.readUInt32LE(p + 42);
          const mulai = off + 30 + b.readUInt16LE(off + 26) + b.readUInt16LE(off + 28);
          out.push({ nama, metode: b.readUInt16LE(p + 10), waktu: b.readUInt16LE(p + 12), tanggal: b.readUInt16LE(p + 14),
            crc: b.readUInt32LE(p + 16), isi: b.subarray(mulai, mulai + b.readUInt32LE(p + 20)) });
          p += 46 + b.readUInt16LE(p + 28) + b.readUInt16LE(p + 30) + b.readUInt16LE(p + 32);
        }
        return out;
      };

      /**
       * (a) THE BLANK TEMPLATE, THROUGH bacaBukuKerja AND bukuKerjaKePaket. The
       *     guidance sheet first, then the five data sheets named exactly as
       *     LEMBAR and in that order; each data sheet holds row 1 -- every
       *     column's judul, in KOLOM order -- and nothing else. The converter
       *     finds no missing sheet and no missing column; the only thing it can
       *     say about a blank template is that the course row is still empty.
       */
      const templat = templatPelajaran();
      const baca = bacaBukuKerja(templat);
      if (c.expect(baca.ok, `Bob's reader cannot read the template: ${JSON.stringify(baca)}`) && baca.ok) {
        c.expect(JSON.stringify(baca.lembar.map((l) => l.nama)) === JSON.stringify([LEMBAR_PANDUAN, ...LEMBAR]),
          `the sheets are ${baca.lembar.map((l) => l.nama).join(", ")}`);
        for (const l of LEMBAR) {
          const sh = baca.lembar.find((x) => x.nama === l);
          c.expect(sh?.baris.length === 1 && JSON.stringify(sh.baris[0]) === JSON.stringify(KOLOM[l].map((k) => k.judul)),
            `${l}: row 1 is not exactly KOLOM's headers, or the sheet holds more than row 1: ${JSON.stringify(sh?.baris)}`);
        }
        const kosong = bukuKerjaKePaket(baca.lembar);
        const kodeKosong = kosong.ok ? [] : kosong.problems.map((x) => x.code);
        c.expect(!kodeKosong.includes("WORKBOOK_SHEET_MISSING") && !kodeKosong.includes("WORKBOOK_COLUMN_MISSING"),
          `the blank template is missing a sheet or a column: ${kodeKosong.join(", ")}`);
        c.expect(JSON.stringify(kodeKosong) === JSON.stringify(["WORKBOOK_COURSE_ROW_MISSING"]),
          `a blank template should only lack its course row, not: ${kodeKosong.join(", ")}`);

        /**
         *     THE GUIDANCE, from the same contract: every column of every sheet
         *     with whether it is required, its accepted choices and its meaning;
         *     every text limit beside the column it governs; and the other
         *     limits of BATAS_PAKET, each with BATAS_PAKET's own number.
         */
        const panduan = baca.lembar[0].baris;
        const teksPanduan = panduan.map((r) => r.join(" | ")).join("\n");
        for (const l of LEMBAR) for (const k of KOLOM[l]) {
          const r = panduan.find((x) => x[0] === l && x[1] === k.judul);
          c.expect(Boolean(r) && r![2] === t(k.wajib ? "studio.templat.ya" : "studio.templat.tidak", "staff", { locale: "id" })
            && (r![3] ?? "") === (k.pilihan ? k.pilihan.map(([x]) => x).join(", ") : "") && (r![5] ?? "") === k.arti,
            `the guidance does not describe ${l} · ${k.judul} as the contract does: ${JSON.stringify(r)}`);
        }
        const teksMaks = BATAS_PAKET.teksMaks.nilai;
        for (const [nama, [l, kunci]] of Object.entries(BATAS_TEKS_KOLOM)) {
          const judul = KOLOM[l].find((k) => k.kunci === kunci)?.judul;
          const r = panduan.find((x) => x[0] === l && x[1] === judul);
          const angka = format.number(teksMaks[nama as keyof typeof teksMaks], "id");
          c.expect(Boolean(judul) && (r?.[4] ?? "").startsWith(`${angka} `), `the ${nama} limit (${angka}) is not shown on ${l} · ${judul ?? kunci}`);
        }
        c.expect(JSON.stringify(Object.keys(BATAS_TEKS_KOLOM).sort()) === JSON.stringify(Object.keys(teksMaks).sort()),
          "a text limit in BATAS_PAKET has no column in the guidance");
        const B = BATAS_PAKET;
        const harus = [
          `${format.number(B.berkasMaks.nilai / 1048576, "id")} MB`, format.number(B.barisMaks.nilai, "id"),
          format.number(B.pelajaranMaks.nilai, "id"), format.number(B.soalMaks.nilai, "id"),
          `${B.pilihanMin.nilai}–${B.pilihanMaks.nilai}`, B.labelPilihan.nilai.join(", "),
          ...Object.values(B.jenisMedia.nilai).map((x) => x.join(", ")), format.number(B.namaMediaMaks.nilai, "id"),
        ];
        for (const x of harus) c.expect(teksPanduan.includes(x), `the guidance does not state the limit "${x}"`);
      }

      /**
       * (b) ONE FILLED ROW PER SHEET, WRITTEN BY THE SAME WRITER, CONVERTS WITH
       *     NO PROBLEM, and each value lands in its own field: the choices are
       *     turned into their codes, and text holding XML's special characters,
       *     both quotes and a line break comes back exactly.
       */
      const SULIT = `Isi <b>tebal</b> & "kutip" 'tunggal'\nbaris dua`;
      const ISI: Record<string, Record<string, string>> = {
        Kursus: { title: "Pecahan Senilai", subject: "Matematika", stage: "SD", grade_label: "Kelas 4", konteks: "Akademik" },
        Bab: { ordinal: "1", title: "Pecahan" },
        Pelajaran: { module: "1", ordinal: "1", title: "Mengenal pecahan", summary: "Ringkas", body_markdown: SULIT, objective: "Murid mengenal pecahan", bloom: "Memahami" },
        Soal: { ref: "S1", module: "1", lesson: "1", item_type: "Pilihan ganda", stem: "Berapa 1/2 + 1/4?", use: "Pemetaan awal", difficulty: "Sedang" },
        Pilihan: { ref: "S1", label: "A", body: "3/4", is_correct: "Ya", rationale: "Samakan penyebutnya dulu." },
      };
      const terisi = tulisBukuKerja(LEMBAR.map((l) => ({ nama: l, baris: [KOLOM[l].map((k) => k.judul), KOLOM[l].map((k) => ISI[l][k.kunci] ?? "")] })));
      for (const e of entriZip(terisi)) {
        c.expect(!/&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[0-9a-f]+;)/i.test(e.isi.toString("utf8")), `the filled workbook's ${e.nama} holds an unescaped "&"`);
      }
      const bacaIsi = bacaBukuKerja(terisi);
      const paket = bacaIsi.ok ? bukuKerjaKePaket(bacaIsi.lembar) : null;
      if (c.expect(paket?.ok === true, `a filled workbook does not convert cleanly: ${JSON.stringify(paket && !paket.ok ? paket.problems : bacaIsi)}`) && paket?.ok) {
        const kursus = (paket.paket.courses as Array<Record<string, unknown>>)[0];
        const pel = ((kursus.modules as Array<Record<string, unknown>>)[0].lessons as Array<Record<string, unknown>>)[0];
        const soal = (pel.items as Array<Record<string, unknown>>)[0];
        c.expect(kursus.title === "Pecahan Senilai" && pel.body_markdown === SULIT, `a value did not come back exactly: ${JSON.stringify(pel.body_markdown)}`);
        c.expect(soal.item_type === "MCQ_SINGLE" && soal.use === "PRE_TEST" && (pel.objective as Record<string, unknown>).bloom === "UNDERSTAND",
          "a choice did not become its code");
      }

      /**
       * (c) THE SAME CONTRACT, THE SAME BYTES. Two builds are byte-identical;
       *     every entry is stored, stamped with the one fixed time, and its CRC-32
       *     equals Node's own zlib.crc32 of its content; every cell is an inline
       *     string (no shared-strings part), and the data sheets offer each
       *     fixed list as a dropdown on its own column.
       */
      c.expect(Buffer.compare(Buffer.from(templat), Buffer.from(templatPelajaran())) === 0, "two builds of the template differ");
      const entri = entriZip(templat);
      c.expect(entri.length >= 5 + LEMBAR.length, `the template has ${entri.length} parts`);
      for (const e of entri) {
        // 1 January 1980, 00:00: the fixed stamp, time and date both, so no clock can reach the bytes
        c.expect(e.metode === 0 && e.waktu === 0 && e.tanggal === 0x21, `${e.nama} is compressed or is not stamped with the fixed time`);
        c.expect(e.crc === zlibCrc32(e.isi), `${e.nama}: the stored CRC-32 is wrong`);
        // an XML part may hold "&" only as the start of an entity; a lenient reader forgives it, Excel does not
        c.expect(!/&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[0-9a-f]+;)/i.test(e.isi.toString("utf8")), `${e.nama} holds an unescaped "&"`);
      }
      c.expect(!entri.some((e) => e.nama === "xl/sharedStrings.xml"), "the template relies on shared strings instead of inline strings");
      LEMBAR.forEach((l, i) => {
        const xml = entri.find((e) => e.nama === `xl/worksheets/sheet${i + 2}.xml`)?.isi.toString("utf8") ?? "";
        const sel = xml.match(/<c [^>]*>/g) ?? [];
        c.expect(sel.length === KOLOM[l].length && sel.every((x) => /t="inlineStr"/.test(x)), `${l}: a cell is not an inline string`);
        const daftar = [...xml.matchAll(/<dataValidation [^>]*sqref="([A-Z]+)2:[A-Z]+\d+"><formula1>&quot;([^<]*)&quot;<\/formula1>/g)].map((m) => [m[1], m[2]]);
        const harap = KOLOM[l].flatMap((k, n) => (k.pilihan ? [[hurufKolom(n), k.pilihan.map(([x]) => x).join(",")]] : []));
        c.expect(JSON.stringify(daftar) === JSON.stringify(harap), `${l}: the dropdowns are ${JSON.stringify(daftar)}, not ${JSON.stringify(harap)}`);
      });
      c.expect(xmlTeks(`<&>"'`) === "&lt;&amp;&gt;&quot;&apos;" && crc32(new TextEncoder().encode("123456789")) === 0xcbf43926,
        "the escaping or the CRC-32 is wrong on a known value (control)");

      /**
       * SAFE IN THE BROWSER (the gate's condition 1). The template and the
       * panel import nothing from src/lib/xlsx.ts and no node: module, and the
       * contract file they do import brings in types only -- so nothing that
       * needs node:zlib can ever be bundled for the browser through them.
       */
      const importDari = (f: string) => [...code(readFileSync(join(repoRoot, f), "utf8")).matchAll(/^\s*import\s+([\s\S]*?)\s+from\s+"([^"]+)"/gm)];
      for (const f of ["src/components/unggah/templat.ts", "src/components/unggah/lokasi.ts", "src/components/unggah/PanelUnggah.tsx"]) {
        for (const [, , dari] of importDari(f)) {
          c.expect(!/lib\/xlsx|^node:/.test(dari), `${f} imports ${dari}, which cannot run in the browser`);
        }
      }
      const kontrak = importDari("src/lib/unggah-kontrak.ts");
      c.expect(kontrak.length > 0 && kontrak.every(([, apa]) => /^type\b/.test(apa.trim())), "unggah-kontrak.ts imports more than types, so it is no longer safe to import in the browser");
      const dariKontrak = importDari("src/components/unggah/templat.ts").find(([, , d]) => d === "@/lib/unggah-kontrak")?.[1] ?? "";
      c.expect(/\bBATAS_PAKET\b/.test(dariKontrak) && /\bKOLOM\b/.test(dariKontrak) && /\bLEMBAR\b/.test(dariKontrak),
        "the template is not written from KOLOM, LEMBAR and BATAS_PAKET");

      return c.verdict(
        `the template Bob's own reader reads: "${LEMBAR_PANDUAN}" then ${LEMBAR.join(", ")} in that order, each data sheet exactly ` +
        "KOLOM's headers and nothing else, and the converter finds no missing sheet or column; the guidance states every column " +
        "as the contract does and every BATAS_PAKET limit with its own number. One filled row per sheet converts with no problem, " +
        "choices becoming their codes and special characters coming back exactly. Two builds are byte-identical, every entry " +
        "stored with the fixed time and a CRC-32 matching Node's zlib, every cell an inline string, every fixed list a dropdown " +
        "on its own column; and nothing that needs node:zlib can reach the browser through the template or the panel",
      );
    },
  },
  {
    id: "DAISY-06-UNGGAH-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();

      /**
       * DAISY-06: THE UPLOAD PANEL, RENDERED. The panel is rendered to HTML in a
       * child process in both languages: the template button; three steps named
       * for what they do (not three "Konfirmasi"), the first marked current; the
       * "Sekolah" picker offering exactly the schools the page gives it, the
       * first selected; a file input for .xlsx; the check disabled until a file
       * is chosen. With no school to offer, it says so and offers no file input.
       */
      const SEKOLAH = [{ id: "sd", name: "SD Zayd Pintar Selalu" }, { id: "sma", name: "SMA Zayd Pintar Selalu" }];
      const KASUS = [
        ...LOCALES.map((locale) => ({ locale, sekolah: SEKOLAH, batasMb: 5 })),
        { locale: "id", sekolah: [], batasMb: 5 },
      ];
      const anak = spawnSync(process.execPath, ["--import", "tsx", "-e",
        "(async () => {" +
        '  const { createElement: h } = await import("react");' +
        '  const { renderToStaticMarkup } = await import("react-dom/server");' +
        '  const { AppRouterContext } = await import("next/dist/shared/lib/app-router-context.shared-runtime.js");' +
        '  const m = await import("file://" + process.cwd() + "/src/components/unggah/PanelUnggah.tsx");' +
        "  const Panel = m.default?.default ?? m.default;" +
        "  const r = { refresh() {}, push() {}, replace() {}, back() {}, forward() {}, prefetch() {} };" +
        "  process.stdout.write(JSON.stringify(JSON.parse(process.env.KASUS_UNGGAH).map((k) =>" +
        "    renderToStaticMarkup(h(AppRouterContext.Provider, { value: r }, h(Panel, k))))));" +
        "})().catch((e) => { process.stderr.write(String(e && e.stack || e)); process.exit(1); });"], {
        cwd: repoRoot, encoding: "utf8", env: { ...process.env, KASUS_UNGGAH: JSON.stringify(KASUS) },
      });
      let html: string[] = [];
      try { html = JSON.parse(anak.stdout); } catch { /* reported below */ }
      if (c.expect(anak.status === 0 && html.length === KASUS.length, `the panel could not be rendered: ${(anak.stderr || "").split("\n").slice(0, 3).join(" ")}`)) {
        LOCALES.forEach((locale, n) => {
          const x = html[n];
          const s = (k: HleEvent) => t(k, "staff", { locale });
          c.expect(x.includes(`<button type="button" class="pin-btn">${s("studio.unggah.templat")}</button>`), `(${locale}) no template download`);
          const langkah = [...x.matchAll(/<li[^>]*><span class="pin-ung-no">(\d)<\/span> ([^<]+)<\/li>/g)].map((m) => m[2]);
          c.expect(JSON.stringify(langkah) === JSON.stringify(["periksa", "media", "simpan"].map((k) => s(`studio.unggah.langkah.${k}` as HleEvent)))
            && new Set(langkah).size === 3, `(${locale}) the steps are ${JSON.stringify(langkah)}`);
          c.expect(/<li class="pin-ung-kini" aria-current="step"><span class="pin-ung-no">1<\/span>/.test(x), `(${locale}) step 1 is not marked current`);
          c.expect(/<label for="ung-sekolah">/.test(x) && x.includes(`<label for="ung-sekolah">${s("studio.unggah.sekolah")}</label>`), `(${locale}) the school picker is not labelled Sekolah`);
          const opsi = [...x.matchAll(/<option value="([^"]+)"( selected="")?>([^<]+)<\/option>/g)].map((m) => [m[1], Boolean(m[2]), m[3]]);
          c.expect(JSON.stringify(opsi) === JSON.stringify([["sd", true, SEKOLAH[0].name], ["sma", false, SEKOLAH[1].name]]),
            `(${locale}) the picker offers ${JSON.stringify(opsi)}`);
          c.expect(/<input id="ung-berkas" type="file" accept="\.xlsx[^"]*"/.test(x), `(${locale}) there is no file input for an .xlsx workbook`);
          c.expect(x.includes(`disabled="">${s("studio.unggah.langkah.periksa")}</button>`), `(${locale}) the check can be pressed before a file is chosen`);
        });
        const tanpa = html[2];
        c.expect(tanpa.includes(t("studio.unggah.tanpa_sekolah", "staff")) && !/type="file"/.test(tanpa), "with no school on offer the panel still offers an upload");
      }

      /**
       * EVERY ANSWER HAS ITS OWN SENTENCE, AND EVERY PROBLEM SAYS WHERE. Each
       * problem code and each refusal code the actions can return reads as a
       * sentence in both languages -- never the calm dash, never the code -- and
       * a problem's place is "Lembar Soal, baris 4, kolom Pertanyaan", with the
       * column's own header from KOLOM.
       */
      const kodeTolak = [...KODE_TOLAK_PAKET, "PACKAGE_HAS_PROBLEMS", "PACKAGE_INPUT_INVALID", "PACKAGE_FAILED"] as const;
      for (const locale of LOCALES) {
        for (const k of KODE_MASALAH_PAKET) {
          const v = t(kunciMasalahPaket(k), "staff", { locale });
          c.expect(v !== TANPA_SALINAN && !v.includes(k), `(${locale}) the problem ${k} reads "${v}"`);
        }
        for (const k of kodeTolak) {
          const v = t(kunciKodePaket(k), "staff", { locale });
          c.expect(v !== TANPA_SALINAN && !v.includes(k), `(${locale}) the refusal ${k} reads "${v}"`);
        }
      }
      c.expect(lokasiMasalah({ code: "WORKBOOK_VALUE_REQUIRED", sheet: "Soal", row: 4, field: "stem" }, "id") === "Lembar Soal, baris 4, kolom Pertanyaan",
        `a problem's place reads "${lokasiMasalah({ code: "WORKBOOK_VALUE_REQUIRED", sheet: "Soal", row: 4, field: "stem" }, "id")}"`);
      c.expect(lokasiMasalah({ code: "MEDIA_NOT_UPLOADED", file: "gambar-1.png" }, "en") === "file gambar-1.png", "a media problem does not name its file");

      /**
       * THE PAGE AND THE FLOW, FROM THE SOURCE.
       *   - /studio/unggah reads each drafting school's tenant_kind and
       *     is_active and offers them through sekolah.ts -- never the national
       *     library (audit S14; D-029) -- to the panel AND the JSON forms, and
       *     labels the JSON forms' picker "Sekolah" (it said "Peran & akses").
       *   - The panel comes before the JSON forms.
       *   - The panel talks to the server only through BOB-02's two typed
       *     actions and the one signed-upload route, sending each file to the
       *     path the check returned, in the "assets" bucket.
       */
      const halaman = code(readFileSync(join(repoRoot, "src", "app", "studio", "unggah", "page.tsx"), "utf8"));
      c.expect(/from\("institutions"\)\.select\("[^"]*\btenant_kind\b[^"]*\bis_active\b[^"]*"\)/.test(halaman) || /from\("institutions"\)\.select\("[^"]*\bis_active\b[^"]*\btenant_kind\b[^"]*"\)/.test(halaman),
        "the upload page reads the schools without their kind or state");
      c.expect(/const institutions = sekolahDitawarkan\(tenant \?\? \[\], \(id\) => menyusun\.has\(id\)\)/.test(halaman), "the upload page does not offer its schools through the shared rule");
      c.expect(!/config\.section\.roles/.test(halaman) && /<span>\{s\("studio\.unggah\.sekolah"\)\}<\/span>/.test(halaman), "the JSON forms' school picker is not labelled Sekolah");
      c.expect(/<PanelUnggah locale=\{locale\} sekolah=\{institutions\}/.test(halaman) && halaman.indexOf("<PanelUnggah") < halaman.indexOf("easyUploadAction}"),
        "the workbook panel is not the first way in, or it is not given the offered schools");
      const panel = code(readFileSync(join(repoRoot, "src", "components", "unggah", "PanelUnggah.tsx"), "utf8"));
      const panggilan = [...panel.matchAll(/\bawait\s+(\w+)\s*\(/g)].map((m) => m[1]).filter((f) => !["fetch", "r"].includes(f));
      c.expect(/await fetch\("\/api\/assets\/upload-url", \{[\s\S]*?body: JSON\.stringify\(\{ path: m\.path \}\)/.test(panel)
        && /storage\.from\("assets"\)\.uploadToSignedUrl\(path, token, f,/.test(panel), "media do not go through the signed-upload route to the checked path");
      c.expect((panel.match(/\bfetch\(/g) ?? []).length === 1 && /await unggahBukuKerjaAksi\(null, fd\)/.test(panel) && /await konfirmasiPaketAksi\(null, fd\)/.test(panel),
        `the panel talks to the server some other way: ${panggilan.join(", ")}`);

      return c.verdict(
        "the upload panel is RENDERED in both languages with the template download, three steps named for what they do " +
        "with the first current, a Sekolah picker offering exactly the given schools with the first selected, an .xlsx file " +
        "input and a check that waits for a file; with no school it offers no upload. Every problem and refusal code reads " +
        "as its own sentence in both languages, and a problem says its sheet, row and column. The page offers only real, " +
        "active drafting schools (never the national library) to the panel and the JSON forms, labels them Sekolah, puts the " +
        "workbook first, and the panel reaches the server only through BOB-02's two actions and the signed-upload route",
      );
    },
  },
  {
    id: "DAISY-09-AKTIVASI-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();

      /**
       * DAISY-09 (D-019): ACTIVATION SENDS NO EMAIL, AND EVERY SCREEN SAYS SO.
       *
       * 1. THE ROUTE STILL SENDS NOTHING. Read, not assumed: if it ever starts
       *    sending mail, every sentence below has a false premise.
       */
      const rute = readFileSync(join(repoRoot, "src", "app", "api", "akun", "aktivasi", "route.ts"), "utf8");
      c.expect(/email_confirm:\s*true/.test(rute) && !/signInWithOtp|inviteUserByEmail|generateLink|resend|sendEmail/i.test(rute),
        "the activation route now sends mail itself -- D-019's premise has changed; re-read every activation sentence");

      /**
       * 2. NO ACTIVATION SENTENCE PROMISES AN EMAIL, in either language. The
       *    old introduction ("tautan lewat surel" / "a link by email") is the
       *    planted control: the sweep must catch it.
       */
      const JANJI = /tautan lewat surel|link by e-?mail|kami kirim|kirimkan|dikirim ke|periksa (kotak )?surel|cek surel|undangan|we('ll| will) (send|e-?mail)|sent to (their|your|the)|check (your|their) (e-?mail|inbox)|invitation|invite\b/i;
      const kunciAktivasi = allKeys().filter((k) => k.startsWith("aktivasi."));
      for (const k of kunciAktivasi) {
        for (const locale of LOCALES) {
          const m = JANJI.exec(t(k, "staff", { locale }));
          c.expect(m === null, `${k} (${locale}) promises an email: "${m?.[0]}"`);
        }
      }
      for (const lama of [
        "Pilih cara masuk untuk masing-masing: tautan lewat surel, atau kartu kelas dengan PIN.",
        "Choose how each one signs in: a link by email, or a classroom card with a PIN.",
      ]) c.expect(JANJI.test(lama), `the promise sweep cannot catch the old introduction: "${lama}"`);

      /**
       * 3. EVERY WAY IN SAYS NOTHING WAS SENT AND SENDS THE PERSON TO /masuk:
       *    the page's introduction, an email account, a card, and a new person.
       *    The card sentence names the /masuk button by its own copy.
       */
      const TIDAK_DIKIRIM: Record<string, RegExp> = { id: /tidak mengirim/, en: /has not (emailed|sent)|sends no/ };
      for (const locale of LOCALES) {
        for (const k of ["aktivasi.intro", "aktivasi.surel_arti", "aktivasi.kartu_arti", "aktivasi.baru.ok"] as const) {
          const x = t(k, "staff", { locale });
          c.expect(x.includes("/masuk") && TIDAK_DIKIRIM[locale].test(x), `${k} (${locale}) does not say nothing was sent and to use /masuk: "${x}"`);
          c.expect(!/sekarang bisa masuk|can now sign in/i.test(x), `${k} (${locale}) says the person can now sign in`);
        }
        c.expect(t("aktivasi.kartu_arti", "staff", { locale }).includes(`“${t("auth.card_go", "public", { locale })}”`),
          `aktivasi.kartu_arti (${locale}) does not name the /masuk card button as /masuk shows it`);
      }

      /**
       * 4. EVERY FAILURE IS ITS OWN PLAIN SENTENCE (D-011). Each word the route
       *    writes, and no answer at all, maps per path to a sentence with copy in
       *    both languages -- never the dash, never the route's word, never the
       *    server's text -- and the paths that mean different things read
       *    differently.
       */
      const MODE: ModeAktivasi[] = ["EMAIL", "CLASSROOM_CARD", "NEW_PERSON"];
      const GALAT = [...GALAT_RUTE, "sesuatu-yang-baru"];
      for (const mode of MODE) {
        const semua = [kunciGagal(mode, null), ...GALAT.map((e) => kunciGagal(mode, { ok: false, error: e, detail: "this person already has an account" }))];
        for (const k of semua) {
          for (const locale of LOCALES) {
            const x = t(k, "staff", { locale });
            c.expect(x !== TANPA_SALINAN && x.length > 20 && !/already has an account|exception|unauthenticated|create_failed|person_id/.test(x) && !(GALAT as string[]).includes(x),
              `${mode} → ${k} (${locale}) is not a plain sentence: "${x}"`);
          }
        }
      }
      c.expect(kunciGagal("EMAIL", null) === "aktivasi.galat.jaringan", "no answer at all is not told as a lost connection");
      c.expect(kunciGagal("EMAIL", { ok: false, error: "unauthenticated" }) === "aktivasi.galat.sesi", "an ended session is not told as such");
      c.expect(kunciGagal("EMAIL", { ok: false, error: "refused" }) !== kunciGagal("NEW_PERSON", { ok: false, error: "refused" }),
        "a refusal reads the same for a recorded person and a new one");
      c.expect(kunciGagal("EMAIL", { ok: false, error: "create_failed" }) === "aktivasi.galat.dipakai"
        && kunciGagal("CLASSROOM_CARD", { ok: false, error: "create_failed" }) === "aktivasi.galat.kartu",
        "a card that could not be made reads like an address already in use");
      c.expect(new Set(MODE.flatMap((m) => GALAT.map((e) => kunciGagal(m, { ok: false, error: e })))).size >= 7,
        "the failures collapse into too few sentences to tell the administrator what to do");

      /**
       * 5. WHAT IS MISSING IS TOLD BEFORE ANYTHING IS SENT, with the same shape
       *    check as /masuk: agreeing with LayarMasuk's on every sample.
       */
      c.expect(isianKurang("NEW_PERSON", { nama: "  ", surel: "a@b.sch.id" }) === "aktivasi.galat.nama", "a new person with no name is sent anyway");
      c.expect(isianKurang("EMAIL", { surel: "guru.sekolah.sch.id" }) === "aktivasi.galat.surel", "an address with no @ is sent anyway");
      c.expect(isianKurang("NEW_PERSON", { nama: "Gladys", surel: "gladys@sekolah" }) === "aktivasi.galat.surel", "an address with no domain ending is sent anyway");
      c.expect(isianKurang("CLASSROOM_CARD", {}) === null, "a card is held back for want of an address it does not need");
      c.expect(isianKurang("EMAIL", { surel: " guru@sd-negeri-1.jakarta.sch.id " }) === null, "a real school address is refused before it is sent");
      const masuk = readFileSync(join(repoRoot, "src", "components", "masuk", "LayarMasuk.tsx"), "utf8");
      const rx = /function bentukEmailMasukAkal\(v: string\): boolean \{\s*return (\/.+\/)\.test\(v\.trim\(\)\);/.exec(masuk);
      if (c.expect(rx !== null, "could not read /masuk's address check to compare with")) {
        const bentuk = new RegExp(rx![1].slice(1, -1));
        for (const v of ["a@b.id", "a@b.c", "guru@sd-negeri-1.jakarta.sch.id", "tanpa-at.sch.id", "a@b", " a@b.co ", "a b@c.id", ""]) {
          c.expect(surelLengkap(v) === bentuk.test(v.trim()), `the activation check and /masuk's disagree on "${v}"`);
        }
      }

      /**
       * 6. RENDERED. Each outcome drawn in both languages as the administrator
       *    reads it: an email account names the address and says what to do;
       *    a card shows its number and PIN once, with where to use them; a new
       *    person names the person and the address; a failure is an alert with
       *    its sentence and never the server's own words. The form itself
       *    renders with its controls and no outcome yet.
       */
      const DETAIL = "this person already has an account";
      const KASUS = LOCALES.flatMap((locale) => [
        { locale, mode: "EMAIL", jawaban: { ok: true, mode: "EMAIL" }, surel: "guru@sekolah.sch.id" },
        { locale, mode: "CLASSROOM_CARD", jawaban: { ok: true, card: "7001234567", pin: "482913" } },
        { locale, mode: "NEW_PERSON", jawaban: { ok: true }, surel: "gladys@sekolah.sch.id", nama: "Gladys Ayu Lestari" },
        { locale, mode: "EMAIL", jawaban: { ok: false, error: "refused", detail: DETAIL }, surel: "guru@sekolah.sch.id" },
        { locale, mode: "NEW_PERSON", jawaban: null },
      ]);
      const FORM = { locale: "id", adminSistem: true, orang: [{ person_id: "p1", display_name: "Nadia Putri", institutional_id: "2026001", institution_id: "i1" }] };
      const anak = spawnSync(process.execPath, ["--import", "tsx", "-e",
        "(async () => {" +
        '  const { createElement: h } = await import("react");' +
        '  const { renderToStaticMarkup } = await import("react-dom/server");' +
        '  const a = await import("file://" + process.cwd() + "/src/components/aktivasi/HasilAktivasi.tsx");' +
        '  const f = await import("file://" + process.cwd() + "/src/components/aktivasi/FormAktivasi.tsx");' +
        "  const Hasil = a.default?.default ?? a.default; const Form = f.default?.default ?? f.default;" +
        "  const out = JSON.parse(process.env.KASUS_AKT).map((k) => renderToStaticMarkup(h(Hasil, k)));" +
        "  out.push(renderToStaticMarkup(h(Form, JSON.parse(process.env.FORM_AKT))));" +
        "  process.stdout.write(JSON.stringify(out));" +
        "})().catch((e) => { process.stderr.write(String(e && e.stack || e)); process.exit(1); });"], {
        cwd: repoRoot, encoding: "utf8", env: { ...process.env, KASUS_AKT: JSON.stringify(KASUS), FORM_AKT: JSON.stringify(FORM) },
      });
      let html: string[] = [];
      try { html = JSON.parse(anak.stdout); } catch { /* reported below */ }
      const bersih = (x: string) => x.replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&amp;/g, "&");
      if (c.expect(anak.status === 0 && html.length === KASUS.length + 1, `the activation outcomes could not be rendered: ${(anak.stderr || "").split("\n").slice(0, 3).join(" ")}`)) {
        KASUS.forEach((k, n) => {
          const x = bersih(html[n]);
          const s = (e: HleEvent) => t(e, "staff", { locale: k.locale });
          const label = `${k.mode} ${k.jawaban?.ok ? "ok" : "gagal"} (${k.locale})`;
          if (k.jawaban?.ok) {
            c.expect(/^<div class="pin-akt-hasil" role="status">/.test(x), `${label}: not announced as a status`);
            if (k.mode === "CLASSROOM_CARD") {
              c.expect(x.includes(s("aktivasi.kartu_dibuat")) && x.includes(">7001234567<") && x.includes(">482913<") && x.includes(s("aktivasi.kartu_arti")),
                `${label}: the card, its PIN or where to use them is missing`);
            } else {
              c.expect(x.includes(`${s("aktivasi.surel_dibuat")} <strong>${k.surel}</strong>`), `${label}: the address the account was made for is not named`);
              c.expect(x.includes(s(k.mode === "NEW_PERSON" ? "aktivasi.baru.ok" : "aktivasi.surel_arti")), `${label}: the no-email, go-to-/masuk sentence is missing`);
              if (k.mode === "NEW_PERSON") c.expect(x.includes(`<strong>${k.nama}</strong>`), `${label}: the new person is not named`);
            }
          } else {
            c.expect(x === `<p class="pin-msg pin-msg-err" role="alert">${s(kunciGagal(k.mode as ModeAktivasi, k.jawaban as JawabanAktivasi | null))}</p>`,
              `${label}: the failure is not its own sentence as an alert: ${x.slice(0, 160)}`);
            c.expect(!x.includes(DETAIL), `${label}: the server's own words reach the screen`);
          }
        });
        const form = bersih(html[KASUS.length]);
        const s = (e: HleEvent) => t(e, "staff", { locale: "id" });
        c.expect(form.includes("<strong>Nadia Putri</strong>") && form.includes(s("aktivasi.dengan_surel")) && form.includes(s("aktivasi.dengan_kartu"))
          && form.includes(s("aktivasi.baru.tombol")) && !/role="(status|alert)"/.test(form),
          "the activation form does not render its controls, or shows an outcome before anything was pressed");
      }

      /**
       * 7. THE SOURCE. The form asks the route and nothing else, checks what is
       *    missing before it sends, never reads the route's `detail`, and no
       *    longer refreshes the list on success -- which is what took the only
       *    word of an email activation's success off the screen.
       */
      const form = code(readFileSync(join(repoRoot, "src", "components", "aktivasi", "FormAktivasi.tsx"), "utf8"));
      c.expect((form.match(/\bfetch\(/g) ?? []).length === 1 && /fetch\("\/api\/akun\/aktivasi"/.test(form), "the form talks to the server some other way");
      c.expect(/const cegah = isianKurang\(mode, isian\);[\s\S]*if \(cegah\) return;[\s\S]*fetch\(/.test(form), "the form sends before checking what is missing");
      c.expect(!/\.detail\b/.test(form + code(readFileSync(join(repoRoot, "src", "components", "aktivasi", "HasilAktivasi.tsx"), "utf8"))),
        "the route's detail -- the server's own text -- is read by the form or its outcome");
      c.expect(!/router\.refresh|useRouter/.test(form), "a success still refreshes the list and takes its message off the screen");
      c.expect(/<p className="pin-intro">\{s\("aktivasi\.intro"\)\}<\/p>/.test(code(readFileSync(join(repoRoot, "src", "app", "aktivasi", "page.tsx"), "utf8"))),
        "the activation page does not open with the corrected introduction");

      return c.verdict(
        "D-019: the activation route is re-read and sends no mail; no activation sentence in either language promises an email " +
        "(the old introduction is the planted control); the introduction, an email account, a card and a new person each say " +
        "nothing was sent and send the person to /masuk, and the card names /masuk's own button. Every failure the route can " +
        "answer, and no answer, is its own plain sentence per path, never the server's text; a missing name or address is told " +
        "before sending with /masuk's own check. Each outcome is RENDERED in both languages where it was asked, and the form " +
        "no longer refreshes its message away",
      );
    },
  },
  {
    id: "DAISY-10-SAPA-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();

      /**
       * DAISY-10 (D-020): /belajar GREETS A LEARNER BY FIRST NAME ONLY, by the
       * same rule and from the same roles as the home page, so the next child
       * on a shared tablet does not read a full name there either.
       *
       * THE SOURCE. The roles are read once and serve both the context and the
       * greeting; the greeting is namaSapaan's; the raw display name reaches
       * nothing else on the page.
       */
      const belajar = code(readFileSync(join(repoRoot, "src", "app", "belajar", "page.tsx"), "utf8"));
      c.expect(/const peran = await peranSaya\(\);\s*const konteks = konteksPembelajaran\(peran\);/.test(belajar),
        "the learner's page does not read its roles once for both its context and its greeting");
      c.expect(/const sapa = namaSapaan\(viewer\.displayName, peran\);/.test(belajar), "the learner's page does not greet through namaSapaan");
      c.expect((belajar.match(/viewer\.displayName/g) ?? []).length === 1, "the raw display name reaches the learner's page some other way");
      c.expect(/<h1 className="pin-h1">\s*\{sapa \? `\$\{s\("siklus\.halo"\)\}, \$\{sapa\}` : s\("siklus\.halo"\)\}\s*<\/h1>/.test(belajar),
        "the learner's page heading does not greet with namaSapaan's name");
      c.expect(/import \{ namaSapaan \} from "@\/components\/sesi";/.test(belajar), "the learner's page greets by a rule of its own");

      /**
       * THE RULE, over the names a school actually stores: a learner reads the
       * first word; somebody who also holds a staff role reads their name as
       * stored (staff screens unchanged); roles that could not be read greet as
       * a learner, never in full; nobody named is greeted with no name.
       */
      const KASUS: Array<[string | null, string[] | null, string | null]> = [
        ["Siswa Alpha Satu (sintetis)", [], "Siswa"],
        ["Nadia Putri Maharani", null, "Nadia"],
        ["  Muhammad  Rizky ", [], "Muhammad"],
        ["Aisyah", [], "Aisyah"],
        ["Guru Siklus (sintetis)", ["EDUCATOR"], "Guru Siklus (sintetis)"],
        ["Dr. Sari Wulandari", ["HEAD_OF_DEPARTMENT"], "Dr. Sari Wulandari"],
        [null, [], null],
        ["   ", ["EDUCATOR"], null],
      ];
      for (const [nama, peran, harap] of KASUS) {
        c.expect(namaSapaan(nama, peran) === harap, `${JSON.stringify(nama)} with roles ${JSON.stringify(peran)} is greeted as ${JSON.stringify(namaSapaan(nama, peran))}, expected ${JSON.stringify(harap)}`);
      }
      for (const locale of LOCALES) {
        for (const persona of ["learner", "educator"] as const) {
          c.expect(t("siklus.halo", persona, { locale }) !== TANPA_SALINAN, `(${locale}, ${persona}) siklus.halo has no copy`);
        }
      }

      return c.verdict(
        "D-020 on /belajar: the page reads its roles once for its context and its greeting, greets through namaSapaan -- the " +
        "home page's rule -- and the raw display name reaches nothing else; over stored names, a learner is greeted by the " +
        "first word, somebody who also holds a staff role as stored, unreadable roles as a learner, and nobody named by no name",
      );
    },
  },
  {
    id: "DAISY-11-STUDIO-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();

      /**
       * DAISY-11 (D-021): THE STUDIO TAB, BY ROLE.
       *
       * 1. THE ROLES ARE THE CAPABILITY MAP'S. D-021 names "every role whose
       *    capability map includes drafting". The map is the database's
       *    role_capabilities, so its latest definition is read from the
       *    migrations and the roles holding CAN_DRAFT must be exactly the tab's
       *    roles. A copy of the map with EDUCATOR's CAN_DRAFT removed is the
       *    control: the comparison must notice.
       */
      const mig = join(repoRoot, "supabase", "migrations");
      const terakhir = readdirSync(mig).filter((f) => f.endsWith(".sql")).sort()
        .filter((f) => /create or replace function public\.role_capabilities\(/i.test(readFileSync(join(mig, f), "utf8"))).pop();
      const peta = (sql: string): Map<string, string[]> => {
        const i = sql.search(/create or replace function public\.role_capabilities\(/i);
        const badan = i < 0 ? "" : sql.slice(i, sql.indexOf("$function$;", i) > 0 ? sql.indexOf("$function$;", i) : undefined);
        return new Map([...badan.matchAll(/when '([A-Z_]+)' then array\[([^\]]*)\]/g)]
          .map((m) => [m[1], [...m[2].matchAll(/'([A-Z_]+)'/g)].map((x) => x[1])] as [string, string[]]));
      };
      const drafting = (m: Map<string, string[]>) => [...m].filter(([, caps]) => caps.includes("CAN_DRAFT")).map(([r]) => r).sort();
      if (c.expect(terakhir !== undefined, "no migration defines role_capabilities, so the tab's roles cannot be checked against it")) {
        const sql = readFileSync(join(mig, terakhir!), "utf8");
        const m = peta(sql);
        c.expect(m.size >= 6 && m.has("DEAN") && m.has("STUDENT"), `could not read the capability map from ${terakhir}: ${[...m.keys()].join(", ")}`);
        c.expect(JSON.stringify(drafting(m)) === JSON.stringify([...PERAN_STUDIO].sort()),
          `the roles that may draft (${terakhir}) are ${JSON.stringify(drafting(m))}; the Studio tab is offered to ${JSON.stringify(PERAN_STUDIO)}`);
        const tanam = peta(sql.replace(/(when 'EDUCATOR' then array\[)'CAN_DRAFT',/, "$1"));
        c.expect(JSON.stringify(drafting(tanam)) !== JSON.stringify([...PERAN_STUDIO].sort()), "the capability-map comparison cannot notice a role losing CAN_DRAFT");
        c.note(`capability map read from ${terakhir}`);
      }

      /**
       * 2. THE RULE. Each drafting role is offered Studio, alone or among
       *    others; a dean, a student, an unknown role, no roles and roles that
       *    could not be read are not.
       */
      for (const r of ["EDUCATOR", "HEAD_OF_DEPARTMENT", "INSTITUTION_ADMIN", "SYSTEM_ADMIN"]) {
        c.expect(tawarkanStudio([r]) && tawarkanStudio(["DEAN", r]), `${r} is not offered Studio`);
      }
      for (const [label, peran] of [["DEAN", ["DEAN"]], ["STUDENT", ["STUDENT"]], ["unknown", ["NOT_A_ROLE"]], ["none", []], ["unreadable", null]] as const) {
        c.expect(!tawarkanStudio(peran), `${label} is offered Studio`);
      }
      for (const locale of LOCALES) c.expect(t("nav.studio", "staff", { locale }) !== TANPA_SALINAN, `(${locale}) nav.studio has no copy`);

      /**
       * 3. RENDERED. The tab component ends with Studio exactly when told to,
       *    after the places and with the calling page's link style, and the
       *    places are unchanged either way.
       */
      const KASUS = [
        { tempat: ["/pimpinan"], kecuali: [], locale: "id", persona: "educator", studio: true },
        { tempat: ["/pimpinan"], kecuali: [], locale: "en", persona: "staff", studio: true, kelas: "gaya" },
        { tempat: ["/pimpinan"], kecuali: [], locale: "id", persona: "staff", studio: false },
      ];
      const anak = spawnSync(process.execPath, ["--import", "tsx", "-e",
        "(async () => {" +
        '  const { createElement: h } = await import("react");' +
        '  const { renderToStaticMarkup } = await import("react-dom/server");' +
        '  const { AppRouterContext } = await import("next/dist/shared/lib/app-router-context.shared-runtime.js");' +
        '  const m = await import("file://" + process.cwd() + "/src/components/TabTempat.tsx");' +
        "  const Tab = m.default?.default ?? m.default;" +
        "  const r = { refresh() {}, push() {}, replace() {}, back() {}, forward() {}, prefetch() {} };" +
        "  process.stdout.write(JSON.stringify(JSON.parse(process.env.KASUS_TAB).map((k) =>" +
        "    renderToStaticMarkup(h(AppRouterContext.Provider, { value: r }, h(Tab, k))))));" +
        "})().catch((e) => { process.stderr.write(String(e && e.stack || e)); process.exit(1); });"], {
        cwd: repoRoot, encoding: "utf8", env: { ...process.env, KASUS_TAB: JSON.stringify(KASUS) },
      });
      let html: string[] = [];
      try { html = JSON.parse(anak.stdout); } catch { /* reported below */ }
      if (c.expect(anak.status === 0 && html.length === KASUS.length, `the tabs could not be rendered: ${(anak.stderr || "").split("\n").slice(0, 3).join(" ")}`)) {
        const tautan = (x: string) => [...x.matchAll(/<a ([^>]*)href="([^"]+)"[^>]*>([^<]*)<\/a>/g)].map((m) => [m[2], m[3], /class="gaya"/.test(m[0])]);
        c.expect(JSON.stringify(tautan(html[0])) === JSON.stringify([["/pimpinan", t("nav.pimpinan", "educator"), false], ["/studio", t("nav.studio", "educator"), false]]),
          `with Studio offered the tabs are ${JSON.stringify(tautan(html[0]))}`);
        c.expect(JSON.stringify(tautan(html[1])) === JSON.stringify([["/pimpinan", t("nav.pimpinan", "staff", { locale: "en" }), true], ["/studio", t("nav.studio", "staff", { locale: "en" }), true]]),
          `(en, styled) the tabs are ${JSON.stringify(tautan(html[1]))}`);
        c.expect(JSON.stringify(tautan(html[2])) === JSON.stringify([["/pimpinan", t("nav.pimpinan", "staff"), false]]), `without Studio the tabs are ${JSON.stringify(tautan(html[2]))}`);
      }

      /**
       * 4. EVERY STAFF SHELL OFFERS IT FROM THE ONE ROLES ANSWER; NOTHING ELSE
       *    DOES. The teaching, management and intake shells and an educator's
       *    own learning pass tawarkanStudio of the roles already read; the
       *    learner's own shell, the public page and an assessment in focus draw
       *    no Studio. Studio's layout still refuses a reader with no Studio
       *    capability in any school, asked of the database, exactly as before.
       */
      const cangkang = code(readFileSync(join(repoRoot, "src", "components", "CangkangPengalaman.tsx"), "utf8"));
      c.expect(/const studio = tawarkanStudio\(peran\);/.test(cangkang) && (cangkang.match(/peranSaya\(\)/g) ?? []).length === 1,
        "the shell does not decide the Studio tab from its one roles answer");
      const cabang = (k: string) => {
        const i = cangkang.indexOf(`if (kind === "${k}")`);
        const j = i < 0 ? -1 : cangkang.indexOf("</header>", i);
        return i >= 0 && j > i ? cangkang.slice(i, j) : "";
      };
      const tab = (b: string) => b.match(/<TabTempat[^>]*\/>/)?.[0] ?? "";
      for (const k of ["pengajar", "pimpinan", "pendataan"]) {
        c.expect(/studio=\{studio\}/.test(tab(cabang(k))), `the ${k} shell does not offer Studio by role`);
      }
      const iBelajar = cangkang.indexOf("const { mengajar } = konteksPembelajaran(peran)");
      const belajar = iBelajar > 0 ? cangkang.slice(iBelajar) : "";
      const iMurid = belajar.lastIndexOf("return (");
      c.expect(/studio=\{studio\}/.test(tab(belajar.slice(0, iMurid))), "an educator's own learning does not offer Studio");
      c.expect(!/studio|\/studio/.test(belajar.slice(iMurid)) && !/\/studio|studio=/.test(cabang("public") + cabang("focus")),
        "a learner's own shell, the public page or an assessment in focus offers Studio");
      c.expect((cangkang.match(/href="\/studio"/g) ?? []).length === 0, "a shell draws a Studio link of its own beside the rule");
      const studio = code(readFileSync(join(repoRoot, "src", "app", "studio", "layout.tsx"), "utf8"));
      c.expect(/const institutions = viewer \? await studioInstitutions\(\) : \[\];/.test(studio)
        && /if \(!viewer \|\| institutions\.length === 0\) \{[\s\S]*?<HalamanPenolakan[\s\S]*?messageKey="studio\.refused"/.test(studio),
        "Studio no longer refuses a reader with no Studio capability, asked of the database");

      return c.verdict(
        "D-021: the Studio tab's roles are exactly those holding CAN_DRAFT in the latest role_capabilities (a map with the " +
        "educator's drafting removed is the control); Guru, Kepala departemen, Admin sekolah and Admin platform are offered it, " +
        "a dean, a student and unreadable roles are not. RENDERED, the tabs end with Studio exactly when offered, after the " +
        "places and in the page's own link style. Every staff shell and an educator's own learning offer it from the one roles " +
        "answer; the learner's shell, the public page and an assessment in focus do not; Studio still refuses a reader with no " +
        "capability, asked of the database",
      );
    },
  },
];
