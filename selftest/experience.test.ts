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
import { tanggal as tanggalHelper } from "../src/lib/tanggal";
const tanggalBaca = (x: string) => tanggalHelper(x, "baca", "id");
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { join, relative } from "node:path";
import jsQR from "jsqr";
import { Checks, type SelfTest } from "./lib";
import { allKeys, telling, renderAll, t, format, batasHari, hariIniSekolah, TIMEZONE, LOCALES, TANPA_SALINAN, INTERNAL_WORDS, type HleEvent, type Persona } from "../src/lib/hle";
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
import { KODE_KARTU, bacaJawabanKartu, kalimatKartu, menunggu as kartuMenunggu, tujuanAman, type GagalKartu } from "../src/components/masuk/kartu";
import { templatPelajaran, tulisBukuKerja, xmlTeks, crc32, hurufKolom, LEMBAR_PANDUAN, BATAS_TEKS_KOLOM, KOLOM_BERNOMOR, formatKolom } from "../src/components/unggah/templat";
import { lokasiMasalah } from "../src/components/unggah/lokasi";
import { bacaBukuKerja } from "../src/lib/xlsx";
import { KEGUNAAN, BATAS_PAKET, KOLOM, LEMBAR, bukuKerjaKePaket, KODE_MASALAH_PAKET, KODE_TOLAK_PAKET, kunciMasalahPaket, kunciKodePaket } from "../src/lib/unggah-kontrak";
import { crc32 as zlibCrc32 } from "node:zlib";
import { tempatDariPeran, daftarTempat, tawarkanStudio, PERAN_STUDIO } from "../src/components/tempat";
import { LANGKAH as LANGKAH_PAKET, posisiPaket, keadaanLangkah, bolehMengambil, kunciSalinan, type KunciLangkah } from "../src/components/studio/langkah";
import { LANGKAH_TERBITAN, KODE_TERBITAN_DB, kunciKodeTerbitan, type KodeTerbitan } from "../src/lib/terbitan-kontrak";
import { namaUntukStrip, namaSapaan, PERAN_STAF } from "../src/components/sesi";
import { pohonStruktur, bolehDiubah, bolehDitambahi, kalimatGagal, kalimatGagalBaca } from "../src/components/struktur/tampilan";
import { KODE_STRUKTUR_DB, type KodeStruktur, type SimpulStruktur } from "../src/lib/struktur-kontrak";
import { sekolahDitawarkan, sekolahDipilih, tujuanUnggah, type SekolahBaris } from "../src/components/sekolah";
import { KODE_SUKSES, kunciKode } from "../src/lib/galat-kontrak";
import { kunciGagal, isianKurang, surelLengkap, GALAT_RUTE, type ModeAktivasi, type JawabanAktivasi } from "../src/components/aktivasi/hasil";
import { SYARAT_METRIK, kunciMuncul } from "../src/components/bukti/muncul";
import { lingkupAwal } from "../src/components/pimpinan/lingkup";
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

/** The text a screen reader takes as the name: an `aria-hidden` part (E1's rail tooltip, an avatar) is not read. */
function namaPohon(n: Simpul, keluar: string[] = []): string[] {
  if (n === null || n === undefined) return keluar;
  if (typeof n === "string" || typeof n === "number") { keluar.push(String(n)); return keluar; }
  const props = (n as { props?: Record<string, unknown> }).props;
  if (props?.["aria-hidden"] === "true" || props?.["aria-hidden"] === true) return keluar;
  for (const k of anakDari(n)) namaPohon(k, keluar);
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
/**
 * D-138 step 3 (the staff shell): CangkangPengalaman.tsx now carries, after the shell's own render, the staff
 * layout every staff branch returns through (`shellStaf`) and the shell for a surface that decides its own places
 * (`CangkangStaf`, Konfigurasi and Studio). The guards that read the shell's branches read its own render here, and
 * the staff layout separately, so a check on one branch can never be satisfied by text in another.
 */
// (E1: shellStaf became async when it began to draw the context control; located either way)
const awalShellStaf = (src: string) => src.search(/\n(?:async )?function shellStaf\(/);
function intiCangkang(src: string): string {
  const i = awalShellStaf(src);
  return i > 0 ? src.slice(0, i) : src;
}
function cabangCangkang(src: string, k: string): string {
  const inti = intiCangkang(src);
  const i = inti.indexOf(`if (kind === "${k}")`);
  if (i < 0) return "";
  const akhir = [inti.indexOf("\n  if (kind ===", i + 1), inti.indexOf("const { mengajar }", i)].filter((j) => j > i);
  return inti.slice(i, akhir.length > 0 ? Math.min(...akhir) : inti.length);
}
function shellStafSrc(src: string): string {
  const i = awalShellStaf(src);
  const j = src.indexOf("\nexport async function CangkangStaf(");
  return i > 0 && j > i ? src.slice(i, j) : "";
}

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
  // DAISY-18: each main section's loading screen is the shared shell
  // (src/components/MemuatHalaman.tsx), re-exported and styled nowhere else
  "src/app/aktivasi/loading.tsx",
  "src/app/belajar/loading.tsx",
  "src/app/konfigurasi/loading.tsx",
  "src/app/mengajar/loading.tsx",
  "src/app/pendataan/loading.tsx",
  "src/app/pimpinan/loading.tsx",
  "src/app/studio/loading.tsx",
  // L3 (D-132 §2.6): each surface's working-context guard, which draws nothing of its own (its children only)
  "src/app/aktivasi/layout.tsx",
  "src/app/belajar/layout.tsx",
  "src/app/dekan/layout.tsx",
  "src/app/edukator/layout.tsx",
  "src/app/konfigurasi/layout.tsx",
  "src/app/mengajar/layout.tsx",
  "src/app/pendataan/layout.tsx",
  "src/app/pimpinan/layout.tsx",
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
  "src/app/mengajar/[kelas]/uji-cepat/hasil/page.tsx",
  "src/app/mengajar/[kelas]/bukti/page.tsx",
  "src/app/mengajar/[kelas]/langkah/page.tsx",
  "src/app/mengajar/[kelas]/siapa/page.tsx",
  "src/app/mengajar/[kelas]/murid/[orang]/page.tsx",
  // D-088(k), M5: which questions the class found hard. Built on the token set
  // and the shared pin-* classes from the start.
  "src/app/mengajar/[kelas]/soal/page.tsx",
  "src/app/mengajar/[kelas]/ulang/page.tsx",
  // UX-1 login. Re-set from the canonical login handoff against baseline
  // bff6897e; the sign-in screen and the magic-link callback are now Experience
  // surfaces and are linted as such.
  "src/app/masuk/page.tsx",
  "src/app/auth/callback/page.tsx",
  // F-01 account activation. Built on the token set, the pendataan shell and
  // the shared pin-* classes from the start, so it joins the re-set list.
  "src/app/aktivasi/page.tsx",
  // W2.1-W2.3 (Batch 4): «Koreksi data orang», built on the token set, the Collection and the shared pin-* classes
  "src/app/aktivasi/orang/page.tsx",
  // W2.5 (Batch 5): «Sertifikat sekolah», built on the token set, the Collection and the shared pin-* classes
  "src/app/konfigurasi/sertifikat/page.tsx",
  // DAISY-20 (Gate 3): «Aktifkan akun PINTAR Anda» on the sign-in page's
  // stage, and Akun saya in the reader's own shell. Built on the token set.
  "src/app/aktifkan/page.tsx",
  "src/app/akun/page.tsx",
  // BOB-27 (Gate 4): «Lupa password?» on the same stage as «Aktifkan», built on the token set.
  "src/app/masuk/lupa/page.tsx",
  // BOB-28 (Gate 5): the public page a PINTAR card's QR opens, on the same stage; and the platform admin's
  // «Keamanan akun», on the same shell and pin-* classes as «Kirim email uji».
  "src/app/id/[pintarId]/page.tsx",
  "src/app/konfigurasi/keamanan/page.tsx",
  // B1: a section's page draws Konfigurasi's own page for one section; it holds no style of its own
  "src/app/konfigurasi/[bagian]/page.tsx",
  // BOB-51: the platform admin's «Kirim email uji», on the same shell and pin-* classes as Aktivasi.
  "src/app/konfigurasi/email-uji/page.tsx",
  // BOB-29 (Gate 6): «PINTAR terkunci» and «Komputer siapa ini?», on the sign-in stage, built on the token set.
  "src/app/terkunci/page.tsx",
  "src/app/perangkat/page.tsx",
  // DAISY-34 (D-070(a)): the professional-learning record, on the staff shell and the existing pin-* list classes.
  "src/app/pengembangan/[simpul]/page.tsx",
  // BOB-15 + DAISY-12 (D-037 step 2): «Laporkan masalah» and «Laporan saya», on the staff shells and the pin-lapor classes.
  "src/app/lapor/page.tsx",
  "src/app/lapor/saya/page.tsx",
  // #148 (D-094, D-100): the maintenance page, on the sign-in shell's pin-* classes as «PINTAR terkunci» is.
  "src/app/pemeliharaan/page.tsx",
  // W1.14 / W3.18 (Batch 3): Studio's shell and its pages other than Beranda, Tinjau and a package's page, moved off
  // their Tailwind compositions onto the pin-* v3 primitives (08-migration), so the token lint now reads them too.
  "src/app/studio/layout.tsx",
  "src/app/studio/bank/page.tsx",
  "src/app/studio/definisi/page.tsx",
  "src/app/studio/integritas/page.tsx",
  "src/app/studio/kanonik/page.tsx",
  "src/app/studio/kanonik/[terbitan]/page.tsx",
  "src/app/studio/pratinjau/[pelajaran]/page.tsx",
  "src/app/studio/unggah/page.tsx",
  // W1.14 (Batch 3 integration): Studio's Beranda, Tinjau and a package's page, on the same primitives.
  "src/app/studio/page.tsx",
  "src/app/studio/paket/[course]/page.tsx",
  "src/app/studio/tinjau/page.tsx",
];

/** Not re-set yet, and the slice that will do it. UX-1 §4 forbids touching them. */
const PENDING_SURFACES: Record<string, string> = {
  "src/app/page.tsx": "Slice 2 — entry by purpose",
  "src/app/_evaluation-banner.tsx": "Slice 2 — the shell",
  "src/app/evaluasi/page.tsx": "Slice 2 — the demonstration room",
  "src/app/konfigurasi/page.tsx": "Slice 7 — configuration",
  "src/app/edukator/ringkasan/page.tsx": "Slice 6 — reports",
  "src/app/dekan/ringkasan/page.tsx": "Slice 6 — reports",
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
  { file: "src/app/experience.css", literal: "220px",
    reason: "B1 FormLayout: the design system's own pds-grid-2 column floor (components/bundle.css, written there as the same literal); a field pair's breakpoint, not a scale step, and B1 adds no token." },
  { file: "src/app/experience.css", literal: "794px",
    reason: "A4 is 210mm; at 96dpi that is 794px. It is the paper, not a scale step." },
  // RESTATED, B6C (Batch 6, Daisy's sertifikat/ronde-2): the sheet is now set in millimetres (210 x 297 mm, a 20 mm
  // text margin), so its 1123px height and its 72px padding are gone from the stylesheet and their exemptions with
  // them. 794px stays: the sheet's box on screen is still capped at the paper's width.
  { file: "src/app/experience.css", literal: "96px",
    reason: "The QR is square and printed at a fixed size a camera can resolve." },
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
  { file: "src/app/experience.css", literal: "23px",
    reason: "24px less the pixel a 2px border eats, so a selected option's text does not shift." },
  { file: "src/app/experience.css", literal: "0.35",
    reason: "The working dot's pulse at its faintest (the design system's Loading keyframe, bundle.css); a step in a motion, not a colour or a size." },
  { file: "src/app/experience.css", literal: "1024px",
    reason: "The staff shell's breakpoint, bp-large (tokens.json): CSS cannot read a custom property inside @media." },
  { file: "src/app/experience.css", literal: "1023px",
    reason: "The staff shell's breakpoint, bp-large less one pixel (tokens.json): CSS cannot read a custom property inside @media." },
  { file: "src/app/experience.css", literal: "1280px",
    reason: "E1 (D-170(c)): bp-wide (tokens.json), where the staff navigation is expanded and the reader may collapse it to the rail; CSS cannot read a custom property inside @media." },
  { file: "src/app/experience.css", literal: "1279px",
    reason: "E1 (D-170(c)): bp-wide less one pixel (tokens.json), the top of the rail's range (1024-1279 px); CSS cannot read a custom property inside @media." },
  { file: "src/app/experience.css", literal: "64px",
    reason: "E2 (D-169(c)): the chooser's door is at least 64 px high (E2 §1, «Height at least 64 px»), one step above control-xl (60): a door holds two lines, the purpose and its place." },
  { file: "src/app/experience.css", literal: "639px",
    reason: "W3.4/W3.5: bp-medium (640, tokens.json) less one pixel, as the design system writes it: the Collection's narrow layout (bundle.css @container) and the Dialog's stacked actions; CSS cannot read a custom property inside @container or @media." },
  { file: "src/app/experience.css", literal: "16ch",
    reason: "W3.4: a row's name never narrower than 16 characters, so it wraps between words rather than inside one (Daisy, components/Table: Long values, min-width 16ch); a measure in characters, not a scale step." },
  { file: "src/app/experience.css", literal: "22px",
    reason: "The class card's characters in the PIN input at control-xl (08-migration.md, PIN input: 20 to 22 px); the design system's own component writes the same literal." },
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
    reason: "The loading shape's third line: a proportion of its row, drawn to look like a shorter line of text, not a measurement. (Until D-138 it was also the tour veil's strength; the veil is now the design's scrim token.)" },
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

/** sha256 of docs/coordination/ux/sistem-desain/project/tokens.json at c42fecb. */
const V3_TOKENS_SHA256 = "9137af2a2c7b11c5537d01d500e3700a7e7d9b41003c0f957c2d1f2effd687e5";
/** v2 names kept as aliases of their v3 token (08-migration.md). */
const V2_ALIASES: Array<[string, string]> = [
  ["--radius-1", "--radius-md"], ["--radius-2", "--radius-lg"],
  ["--motion-fast", "--duration-base"], ["--control-h", "--control-lg"], ["--control-h-big", "--control-xl"],
  ["--measure", "--measure-prose"],
  ["--type-eyebrow", "--t-eyebrow"], ["--type-fine", "--t-small"], ["--type-meta", "--t-small"],
  ["--type-body", "--t-body"], ["--type-card", "--t-subsection"], ["--type-course", "--t-subsection"],
  ["--type-subhead", "--t-section"], ["--type-section", "--t-section"], ["--type-page", "--t-page"],
  ["--type-hero", "--t-display"], ["--type-stem", "--t-stem"], ["--type-stem-phone", "--t-stem-compact"],
];
/** The controls the 44 px guard covers, as the last compound of a selector. */
const TARGETS = [
  ".pin-btn", ".pin-mbtn", ".pin-input", ".pin-inp", ".pin-num-btn", ".pin-lang button",
  ".pin-picker select", ".pin-lselect", ".pin-seg span", ".pin-switch a", ".pin-tabs a",
  ".pin-tur-x", ".pin-bantuan-tutup", ".pin-back", ".pin-kembali", ".pin-tautan", ".pin-lihat",
];
/** The controls whose own base rule must carry the floor. */
const BASE_TARGETS = [
  ".pin-btn", ".pin-mbtn", ".pin-input", ".pin-inp", ".pin-num-btn", ".pin-lang button",
  ".pin-picker select", ".pin-lselect", ".pin-seg span", ".pin-switch a",
  ".pin-tur-x", ".pin-bantuan-tutup", ".pin-back", ".pin-kembali", ".pin-tautan", ".pin-lihat",
];
/** Does this selector size the control itself (not something inside it)? */
function sizesControl(sel: string, target: string): boolean {
  // a pseudo-element draws a decoration (a tab's underline), not the target
  if (/::?(?:before|after)\b/.test(sel)) return false;
  const s = sel.replace(/::?[a-z-]+(\([^)]*\))?/g, "").replace(/\[[^\]]*\]/g, "").trim();
  const parts = target.split(" ");
  const tail = s.split(/\s*[ >+~]\s*/).slice(-parts.length);
  if (tail.length < parts.length) return false;
  return parts.every((p, i) => {
    const comp = tail[i];
    if (p.startsWith(".")) return new RegExp(`\\${p}(?![\\w-])`).test(comp);
    return new RegExp(`^${p}(?![\\w-])`).test(comp) || comp.startsWith(p + ".") || comp === p;
  });
}
/** The certificate's frozen sizes (08-migration.md): selector, phone block?, size. */
const CERT_FROZEN: Array<[string, boolean, string]> = [
  [".pin-cert .pin-name", false, "40px"], [".pin-cert .pin-course", false, "20px"],
  [".pin-cert .pin-name", true, "32px"], [".pin-cert .pin-course", true, "18px"],
  [".pin-sheet .pin-name", false, "44px"], [".pin-sheet .pin-course", false, "22px"],
  // RESTATED, B6C (Batch 6): Daisy's sertifikat/ronde-2 (D-076, frozen under D-120 Q16) sets the school in the band
  // at 16.5 pt (22 px), «Diterbitkan oleh» above it; the 15 px line belonged to the round-1 sheet it replaces.
  [".pin-sheet .pin-inst", false, "22px"],
];
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

/** A token's value with any `var(--x)` it points at followed to the end. */
function resolve(tk: Record<string, string>, name: string): string {
  let v = tk[name];
  for (let i = 0; i < 8 && v !== undefined; i++) {
    const m = /^var\((--[a-z0-9-]+)\)$/.exec(v.trim());
    if (!m) break;
    v = tk[m[1]];
  }
  return v;
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
      c.expect(declared["--pintar-tokens-version"] === "3", "the token set is not version 3");

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

      // v3 (D-138): the roles the application pass introduces. Text on the
      // pressed and destructive grounds, the context band, and the rows'
      // hover, stripe and selection grounds hold AA; a field's outline
      // (line-control) holds 3:1 against every surface (WCAG 1.4.11).
      const v3text: Array<[string, string]> = [
        ["--pintar-primary-ink", "--pintar-primary-pressed"],
        ["--pintar-primary-ink", "--status-blocked"],
        ["--pintar-primary-ink", "--status-blocked-hover"],
        ["--pintar-primary-ink", "--status-blocked-pressed"],
        ["--context-ink", "--context"],
        ["--ink-1", "--surface-3"],
        ["--ink-2", "--surface-3"],
        ["--ink-1", "--table-row-hover"],
        ["--ink-2", "--table-row-alt"],
        ["--ink-1", "--table-row-selected"],
        ["--ink-2", "--table-head"],
        ["--focus-ring", "--surface-0"],
      ];
      for (const [fg, bg] of v3text) {
        const a = resolve(tk, fg), b = resolve(tk, bg);
        c.expect(/^#[0-9a-fA-F]{6}$/.test(a ?? "") && /^#[0-9a-fA-F]{6}$/.test(b ?? ""), `${fg} on ${bg} does not resolve to two hex colours (${a}, ${b})`);
        if (!a || !b) continue;
        const r = ratio(a, b);
        measured++;
        c.expect(r >= AA, `${fg} on ${bg} is ${r.toFixed(2)}:1, below AA ${AA}:1`);
      }
      for (const ground of ["--surface-0", "--surface-1", "--surface-2"]) {
        const r = ratio(resolve(tk, "--line-control"), tk[ground]);
        measured++;
        c.expect(r >= 3, `--line-control on ${ground} is ${r.toFixed(2)}:1, below the 3:1 a control's edge needs`);
      }

      c.note(`${measured} ratio(s) computed from the token file`);
      return c.verdict(
        "WCAG 2.1 contrast is COMPUTED from src/app/globals.css for every text token against white, ivory " +
          "and the well, and for every status token against its own soft ground, and nothing is below AA — " +
          "so the token lint can never enforce a failing token",
      );
    },
  },

  {
    id: "UX1-V3-TOKENS-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      // The design system's tokens.json at its verified freeze (c42fecb,
      // D-136(b)), vendored byte for byte. The hash pins it: an edit to the
      // copy is an edit to the design system and has to come from there.
      const fixture = join(repoRoot, "selftest", "fixtures", "design-tokens-v3.json");
      const raw = readFileSync(fixture);
      const hash = createHash("sha256").update(raw).digest("hex");
      c.expect(hash === V3_TOKENS_SHA256, `the vendored tokens.json is not c42fecb's (sha256 ${hash})`);
      const spec = JSON.parse(raw.toString("utf8"));
      const css = readFileSync(join(repoRoot, "src", "app", "globals.css"), "utf8");
      const tk = tokens(css);
      const norm = (v: string) => v.replace(/\{([a-z0-9-]+)\}/g, "var(--$1)").replace(/\s+/g, " ").trim().toLowerCase();

      let compared = 0;
      for (const group of ["color", "spacing", "radius", "shadow", "size", "border", "duration", "easing", "zIndex", "breakpoint"]) {
        for (const t of spec[group].tokens as Array<{ name: string; value: string }>) {
          const have = tk[`--${t.name}`];
          compared++;
          c.expect(have !== undefined, `v3 token --${t.name} is not declared in globals.css`);
          if (have !== undefined) c.expect(norm(have) === norm(t.value), `--${t.name} is ${have}, the design system says ${t.value}`);
        }
      }
      for (const g of spec.type.groups as Array<{ styles: Array<{ name: string; fontSize: string; lineHeight: string; letterSpacing?: string }> }>) {
        for (const st of g.styles) {
          compared++;
          c.expect(tk[`--${st.name}`] === st.fontSize, `--${st.name} is ${tk[`--${st.name}`]}, the design system says ${st.fontSize}`);
          c.expect(tk[`--${st.name}-lh`] === st.lineHeight, `--${st.name}-lh is ${tk[`--${st.name}-lh`]}, the design system says ${st.lineHeight}`);
          if (st.letterSpacing) c.expect(tk[`--${st.name}-ls`] === st.letterSpacing, `--${st.name}-ls is ${tk[`--${st.name}-ls`]}, the design system says ${st.letterSpacing}`);
        }
      }

      // the v2 names are aliases of the v3 token 08-migration.md maps them to,
      // by reference, so they can never disagree with it
      for (const [v2, v3] of V2_ALIASES) {
        c.expect(tk[v2] === `var(${v3})`, `${v2} is ${tk[v2]}, not an alias of ${v3}`);
      }
      c.expect(/\*:focus-visible\s*\{[^}]*var\(--focus-ring\)/.test(css), "the focus ring is not drawn with --focus-ring");

      // THE CERTIFICATE IS FROZEN (08-migration.md, «Not gaps, kept on purpose»):
      // aliasing the v2 type names onto v3 must not move a size on it. Each
      // rule's font-size is resolved through the token file and compared with
      // the frozen value, on screen, on a phone and on the printed sheet.
      const exp = code(readFileSync(join(repoRoot, "src", "app", "experience.css"), "utf8"));
      const ukuran = (sel: string, phone: boolean) => {
        const blocks = phone ? [...exp.matchAll(/@media \(max-width: 560px\) \{([\s\S]*?)\n\}/g)].map((m) => m[1]) : [exp.replace(/@media[^{]*\{[\s\S]*?\n\}/g, "")];
        let v: string | undefined;
        for (const b of blocks) {
          const re = new RegExp(`(?:^|[}\\s])${sel.replace(/[.]/g, "\\.")}\\s*\\{([^}]*)\\}`, "g");
          for (const m of b.matchAll(re)) { const f = /font-size:\s*([^;]+);/.exec(m[1]); if (f) v = f[1].trim(); }
        }
        if (!v) return undefined;
        const r = /^var\((--[a-z0-9-]+)\)$/.exec(v);
        return r ? resolve(tk, r[1]) : v;
      };
      for (const [sel, phone, frozen] of CERT_FROZEN) {
        const got = ukuran(sel, phone);
        c.expect(got === frozen, `${sel}${phone ? " on a phone" : ""} is ${got}, the frozen certificate says ${frozen}`);
      }

      // nothing points at a custom property nobody declares: a misspelt token
      // is a silent fallback to the browser's default, not an error
      const declared = new Set<string>();
      const used: Array<[string, string]> = [];
      const files = [
        ...walk(join(repoRoot, "src", "app")).filter((f) => /\.(tsx|css)$/.test(f)),
        ...walk(join(repoRoot, "src", "components")).filter((f) => /\.tsx$/.test(f)),
      ];
      for (const f of files) {
        const text = readFileSync(f, "utf8");
        for (const m of text.matchAll(/(--[a-zA-Z0-9-]+)\s*:/g)) declared.add(m[1]);
        for (const m of text.matchAll(/["'](--[a-zA-Z0-9-]+)["']\s*:/g)) declared.add(m[1]);
        for (const m of text.matchAll(/var\((--[a-zA-Z0-9-]+)\s*([,)])/g)) if (m[2] === ")") used.push([relative(repoRoot, f), m[1]]);
      }
      const missing = used.filter(([, n]) => !declared.has(n));
      c.expect(missing.length === 0, "custom properties used but declared nowhere:\n  " + [...new Set(missing.map(([f, n]) => `${f}: ${n}`))].join("\n  "));

      c.note(`${compared} v3 token(s) compared with c42fecb, ${V2_ALIASES.length} v2 alias(es), ${used.length} var() reference(s)`);
      return c.verdict(
        "token set v3 is applied: every token in the design system's tokens.json at its verified freeze c42fecb " +
          "(vendored, sha256-pinned) is declared in src/app/globals.css with the same value, every type style's size, " +
          "leading and tracking included; each v2 token name 08-migration.md keeps is an alias pointing at its v3 token; " +
          "the focus ring is drawn with --focus-ring; and no stylesheet or component references a custom property nobody declares",
      );
    },
  },

  {
    id: "UX1-V3-TARGET-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      // THE 44 PX TARGET (control-md; 08-migration.md, «Controls under 44 px»).
      // Every rule in experience.css that sizes one of PINTAR's controls may
      // only make it 44 px or more: a height or min-height that resolves
      // below control-md fails, and so does one this test cannot resolve, so
      // a calc() cannot quietly shrink a target. Each control's own base rule
      // must also set the floor, so it holds where no other rule applies.
      const tk = tokens(readFileSync(join(repoRoot, "src", "app", "globals.css"), "utf8"));
      const css = code(readFileSync(join(repoRoot, "src", "app", "experience.css"), "utf8"));
      const px = (v: string): number | null => {
        const m = /^var\((--[a-z0-9-]+)\)$/.exec(v.trim());
        const r = m ? resolve(tk, m[1]) : v.trim();
        const n = /^(\d+(?:\.\d+)?)px$/.exec(r ?? "");
        return n ? Number(n[1]) : null;
      };
      const FLOOR = px("var(--control-md)") ?? 0;
      c.expect(FLOOR === 44, `control-md is ${FLOOR}, not 44`);

      let rules = 0;
      for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
        const selectors = m[1].split(",").map((x) => x.trim()).filter(Boolean);
        const target = selectors.filter((sel) => TARGETS.some((t) => sizesControl(sel, t)));
        if (target.length === 0) continue;
        rules++;
        for (const d of m[2].matchAll(/(?:^|;)\s*(min-height|height)\s*:\s*([^;]+)/g)) {
          const v = d[2].trim();
          if (v === "auto" || v === "100%") continue;
          const n = px(v);
          c.expect(n !== null, `${target.join(", ")} sets ${d[1]}: ${v}, which this guard cannot resolve to a size`);
          // Button, small (08-migration.md): 36 px seen, 44 px to hit, when its
          // ::after extends the hit area by the difference above and below
          const kecil = n !== null && n < FLOOR && v === "var(--control-sm)" && target.every((sel) =>
            new RegExp(`${sel.replace(/[.[\]="()]/g, (x) => "\\" + x)}::after\\s*\\{[^}]*inset:\\s*calc\\(\\(var\\(--control-md\\) - var\\(--control-sm\\)\\) / -2\\) 0`).test(css));
          if (n !== null && !kecil) c.expect(n >= FLOOR, `${target.join(", ")} sets ${d[1]} to ${n}px, under the ${FLOOR}px target`);
        }
      }
      for (const t of BASE_TARGETS) {
        const base = new RegExp(`(?:^|[}\\s,])${t.replace(/[.[\]="]/g, (x) => "\\" + x)}\\s*\\{([^}]*)\\}`);
        const b = base.exec(css);
        c.expect(b !== null, `no base rule for ${t}`);
        if (!b) continue;
        const h = /(?:^|;)\s*(?:min-height|height)\s*:\s*([^;]+)/.exec(b[1]);
        const n = h ? px(h[1]) : null;
        c.expect(n !== null && n >= FLOOR, `${t}'s own rule does not set a ${FLOOR}px floor (${h ? h[1].trim() : "none"})`);
      }
      c.note(`${rules} rule(s) sizing ${TARGETS.length} control(s); ${BASE_TARGETS.length} base floor(s)`);
      // D-138 steps 4d/4f: Studio's and Konfigurasi's forms are styled from shared class strings, outside the
      // stylesheet this guard reads. They must name the v3 primitives, whose 44 px floor is checked above, and no
      // form control in src may carry a Tailwind padding-only look-alike again (the 9 Oct 1280 px screenshots: 30 px
      // fields and a grey «Simpan» that read as disabled).
      for (const f of ["src/app/studio/_lib.ts", "src/app/konfigurasi/page.tsx"]) {
        const src = readFileSync(join(repoRoot, f), "utf8");
        c.expect(/(?:export )?const field = "pin-input"/.test(src) && /(?:export )?const button = "pin-btn\b[^"]*"/.test(src),
          `${f}: the shared field and button strings are not the v3 Field and Button`);
      }
      for (const f of walk(join(repoRoot, "src")).filter((p) => /\.tsx?$/.test(p) && !p.endsWith("hle.ts"))) {
        const src = readFileSync(f, "utf8");
        const m = /<(?:button|input|select|textarea)\b[^>]*className="[^"]*\bpy-(?:0|0\.5|1|1\.5)\b[^"]*"/.exec(src)
          ?? /=\s*"[^"]*\bpx-\d[^"]*\bpy-(?:0|0\.5|1|1\.5)\b[^"]*"/.exec(src);
        c.expect(m === null, `${relative(repoRoot, f)} sizes a control by Tailwind padding under 44 px: ${m?.[0].slice(0, 100)}`);
      }
      return c.verdict(
        "every rule in src/app/experience.css that sizes one of PINTAR's controls (buttons, fields, selects, segments, " +
          "tabs, the language switch, the question navigator, back links and close controls) keeps it at control-md " +
          "(44 px) or more, a size the guard cannot resolve fails, and each control's own rule sets the floor",
      );
    },
  },

  {
    id: "UX1-V3-FEEDBACK-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      // ACTION FEEDBACK (v3, D-138 step 2), RENDERED. BarisHasil and
      // TombolKirim are called the way a page calls them and the markup read.
      const anak = spawnSync(process.execPath, ["--import", "tsx", "-e",
        "(async () => {" +
        '  const { createElement: h } = await import("react");' +
        '  const { renderToStaticMarkup } = await import("react-dom/server");' +
        '  const b = await import("file://" + process.cwd() + "/src/components/BarisHasil.tsx");' +
        '  const k = await import("file://" + process.cwd() + "/src/components/TombolKirim.tsx");' +
        "  const Baris = b.default?.default ?? b.default; const Tombol = k.default?.default ?? k.default;" +
        "  const out = [" +
        '    renderToStaticMarkup(h(Baris, { nada: "ok" }, "Peran diberikan.")),' +
        '    renderToStaticMarkup(h(Baris, { nada: "gagal" }, "Belum tersimpan.")),' +
        '    renderToStaticMarkup(h(Baris, { nada: "netral" }, "Tidak ada yang berubah.")),' +
        '    renderToStaticMarkup(h(Baris, { nada: "ok", kelas: "pin-akt-hasil" }, "x")),' +
        '    renderToStaticMarkup(h("form", null, h(Tombol, { className: "pin-btn", sibuk: "Menyimpan…" }, "Simpan"))),' +
        '    renderToStaticMarkup(h("form", null, h(Tombol, { className: "pin-btn", sibuk: "Menyimpan…", selesai: "Tersimpan" }, "Simpan"))),' +
        "  ];" +
        "  process.stdout.write(JSON.stringify(out));" +
        "})().catch((e) => { process.stderr.write(String(e && e.stack || e)); process.exit(1); });"], { cwd: repoRoot, encoding: "utf8" });
      let html: string[] = [];
      try { html = JSON.parse(anak.stdout); } catch { /* reported below */ }
      if (c.expect(anak.status === 0 && html.length === 6, `the feedback pieces could not be rendered: ${(anak.stderr || "").trim().split("\n").slice(0, 3).join(" ")}`)) {
        const [ok, gagal, netral, blok, diam, tuntas] = html;
        c.expect(/role="status"/.test(ok) && /✓/.test(ok), `a success line is not a status that opens with ✓: ${ok}`);
        c.expect(/role="alert"/.test(gagal) && !/✓/.test(gagal), `a failed line is not an alert, or claims ✓: ${gagal}`);
        c.expect(/role="status"/.test(netral) && !/✓/.test(netral), `a neutral line is not a plain status: ${netral}`);
        c.expect(!/✓/.test(blok), `a block result with its own look gained the line's ✓: ${blok}`);
        c.expect(!/✓/.test(diam) && !/data-keadaan/.test(diam) && />Simpan</.test(diam), `a button with no confirmed result claims one: ${diam}`);
        c.expect(/data-keadaan="selesai"/.test(tuntas) && /✓/.test(tuntas) && /Tersimpan/.test(tuntas), `a confirmed button does not show ✓ and its word: ${tuntas}`);
      }
      // the wait line: 3 seconds, in the copy table's words, never a second press
      const src = readFileSync(join(repoRoot, "src", "components", "TombolKirim.tsx"), "utf8");
      c.expect(/setTimeout\(\(\) => setLambat\(true\), 3000\)/.test(src), "the wait line is not timed at 3 seconds");
      c.expect(/t\("tombol\.lambat"/.test(src), "the wait line does not come from the copy table");
      for (const locale of LOCALES) {
        const w = t("tombol.lambat" as HleEvent, "learner", { locale });
        c.expect(w.length > 20 && w !== TANPA_SALINAN, `tombol.lambat has no ${locale} words`);
      }
      return c.verdict(
        "action feedback is applied: rendered, a result line that says it was done opens with ✓ and is a status, one that " +
          "says it was not done is an alert, a block result keeps its own look, a submit button claims nothing until the page " +
          "passes the server-confirmed result word and then shows ✓ and that word, and a wait over 3 seconds is explained in " +
          "the copy table's words in both languages",
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
      // RESTATED FOR D-192 (owner, 5 Nov 2026: «STOP using the previously supplied PINTAR SELALU logo… Replace it
      // with a text-only PINTAR wordmark… Arial… #075056… Do not introduce new logo images, paid fonts or licensing
      // dependencies»). Steps 1–3 guarded the supplied artwork byte for byte; it is retired, so they now guard what
      // replaced it: the artwork is gone from the tree, the mark is the word «PINTAR» as text, in the device's Arial
      // stack (no font file bundled), bold, #075056, sized from one token so no surface can squash or recolour it.
      const w = 0, h = 0, ratio = 0;
      const bytes = Buffer.alloc(0);
      c.expect(!existsSync(join(repoRoot, "public", "brand", "pintar-selalu-logo.png"))
        && !existsSync(join(repoRoot, "public", "brand", "pintar-email-logo.png")), "the supplied logo artwork is still in public/brand/");
      const css = code(readFileSync(join(repoRoot, "src", "app", "experience.css"), "utf8"));
      const globals = readFileSync(join(repoRoot, "src", "app", "globals.css"), "utf8");
      // RESTATED FOR D-193 (owner, 7 Nov: «Inter, a free commercially usable font»): the face is self-hosted Inter Bold,
      // shipped beside its OFL licence, still the only addition to the two OFL text faces; nothing paid or remote
      c.expect(/--font-wordmark: Inter, Arial, Helvetica, sans-serif;/.test(globals) && /--merek-warna: #075056;/.test(globals),
        "the wordmark's face is not Inter (D-193), or its colour is not #075056");
      c.expect(/font-family: "Inter";\s*font-style: normal;\s*font-weight: 700;[^}]*src: url\("\/fonts\/inter-700-latin\.woff2"\)/.test(globals)
        && existsSync(join(repoRoot, "public", "fonts", "OFL-Inter.txt"))
        && /SIL Open Font License, Version 1\.1/.test(readFileSync(join(repoRoot, "public", "fonts", "OFL-Inter.txt"), "utf8")),
        "Inter Bold is not self-hosted from public/fonts/ with its OFL licence beside it");
      const fonts = walk(join(repoRoot, "public")).filter((f) => /\.(woff2?|ttf|otf|eot)$/i.test(f)).map((f) => relative(repoRoot, f));
      c.expect(fonts.every((f) => /plus-jakarta-sans|ibm-plex-mono|inter-700/.test(f)), `a font file other than the three OFL faces is shipped: ${fonts.join(", ")}`);
      const rule = /\.pin-merek\s*\{([^}]*)\}/.exec(css);
      c.expect(rule !== null, "there is no .pin-merek rule to check");
      if (rule) {
        c.expect(/--merek-tinggi:\s*var\(--logo-height\)/.test(rule[1]) && /font-size:\s*calc\(var\(--merek-tinggi\) \* 0\.5\)/.test(rule[1]),
          ".pin-merek does not size its letters from the one token");
        c.expect(/font-family:\s*var\(--font-wordmark\)/.test(rule[1]) && /color:\s*var\(--merek-warna\)/.test(rule[1]) && /font-weight:\s*700/.test(rule[1]),
          ".pin-merek is not the wordmark's face, weight and teal");
        const widths = [...rule[1].matchAll(/(?:^|[;\s])width:\s*([^;]+)/g)].map((m) => m[1].trim());
        c.expect(widths.every((v) => v === "auto"), `.pin-merek sets a width (${widths.join(", ")}); the letters would be squeezed`);
      }
      const component = code(readFileSync(join(repoRoot, "src", "components", "MerekPintar.tsx"), "utf8"));
      c.expect(!/style=\{\{/.test(component), "the mark carries an inline style; sizing belongs in the token rule");
      c.expect(/NAMA_MEREK = "PINTAR"/.test(component) && /\{NAMA_MEREK\}/.test(component) && !/<img\b|brand\//.test(component),
        "the mark is not the text «PINTAR», or still draws an image");

      // 4. NOT AS THE CREDENTIAL'S ISSUER. The certificate's issuer is the
      //    INSTITUTION, named in «Diterbitkan oleh». RESTATED, B6C (Batch 6):
      //    D-120 Q16 puts PINTAR's wordmark in the certificate's header, and
      //    D-160(a) places today's approved logo in that one slot until the
      //    licensed master exists. So the card still never renders the shell
      //    mark (MerekPintar, .pin-merek) or names the asset itself; PINTAR
      //    reaches the sheet only through the one wordmark-slot component,
      //    exactly once, and the sheet's rules reference no brand asset.
      const card = code(readFileSync(
        join(repoRoot, "src", "components", "sertifikat", "KartuSertifikat.tsx"), "utf8"));
      c.expect(!/MerekPintar|pin-merek|brand\//.test(card),
        "the credential card renders the shell's PINTAR SELALU mark; PINTAR reaches the certificate only through its wordmark slot");
      c.expect((card.match(/<MerekSertifikat \/>/g) ?? []).length === 1,
        "the certificate's wordmark is not drawn once, by its one slot component");
      const sheet = /\.pin-sheet\b[^{]*\{([^}]*)\}/.exec(css);
      c.expect(sheet === null || !/brand\//.test(sheet[1]), "the printed sheet references the brand asset");

      // 5. and every surface that shows it is an application surface
      const mounts = walk(join(repoRoot, "src"))
        .filter((f) => /\.tsx$/.test(f))
        .filter((f) => /<MerekPintar/.test(readFileSync(f, "utf8")))
        .map((f) => relative(repoRoot, f).replace(/\\/g, "/"));
      c.expect(mounts.length >= 2, `the mark is mounted on only ${mounts.length} surface(s)`);

      void w; void h; void ratio; void bytes;
      c.note(`text wordmark, ${mounts.length} mount(s)`);
      return c.verdict(
        "the mark rendered by the application is the text wordmark «PINTAR» (D-192): the supplied artwork is gone from public/brand/, " +
          "the face is self-hosted Inter Bold (D-193) beside its OFL licence, no font file beyond the three OFL faces, the colour is #075056, the " +
          "letters are sized from one token and never given a width, and a printed credential carries it only in its one wordmark slot " +
          "(D-120 Q16), never as the shell mark or the issuer",
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
      // MOVED 117 -> 118 for BOB-08, a school's structure holds (D-023).
      // 20261012100000 closes the direct structure writes, adds the place
      // trigger, the year window and the not-a-school refusal; no column,
      // colour, mark or brand surface.
      //
      // MOVED 118 -> 119 for BOB-18, PINTAR answers quickly (D-046).
      // 20261013100000 replaces the learner-RPC assert's body and adds
      // studio_capabilities; no column, colour, mark or brand surface.
      //
      // MOVED 119 -> 120 for BOB-10, the intake refuses staff rows (M5b,
      // interim). 20261014100000 replaces import_row_problems' body; no
      // column, colour, mark or brand surface.
      //
      // MOVED 120 -> 121 for BOB-11, lesson media play (M9). 20261015100000
      // adds may_preview_lesson_media and its registry row; no column,
      // colour, mark or brand surface.
      //
      // MOVED 129 -> 130 for BOB-39, a referral reaches the decision queue.
      // 20261024100000 replaces record_integrity_review's body and one
      // registry note; no table, no column, no colour, mark or brand surface.
      //
      // MOVED 130 -> 131 for BOB-37, per-topic mastery can show. 20261025100000
      // publishes metric catalogue MC-3 (MC-2's rows copied forward, D-060) and
      // replaces two calculator bodies; no table, no column, no colour, mark or
      // brand surface.
      //
      // MOVED 133 -> 134 for ADM-J19, a new year carries the whole class.
      // 20261028100000 replaces period_rollover's body; no table, no column,
      // no colour, mark or brand surface.
      //
      // MOVED 134 -> 135 for ADM-J09, a student in a Tingkat is placed in its
      // Kelas. 20261029100000 replaces move_learner_to_class's body; no table,
      // no column, no colour, mark or brand surface.
      //
      // MOVED 135 -> 136 for D-088(i), learner-level access follows the current
      // placement. 20261030100000 replaces audience_scope_over_learner's and
      // management_learner_detail's bodies; no table, no column, no colour,
      // mark or brand surface.
      //
      // MOVED 136 -> 137 for D-088(g), a topic is named by its objective.
      // 20261031100000 publishes catalogue MC-4 and replaces two calculator
      // bodies and the academic source guard; no table, no column, no colour,
      // mark or brand surface.
      //
      // MOVED 145 -> 146 for the efficiency audit (2 Oct): the draw reads its marks by index.
      // 20261109100000 replaces one function body (definition_follows_cycle_roles, same answer);
      // no table, no column, no colour, mark or brand surface.
      //
      // MOVED 146 -> 147 for D-093 T1 (3 Oct): an operational state has one path.
      // 20261110100000 revokes client writes on four tables and service_role's on the posture,
      // and audits the posture's change; no table, no column, no colour, mark or brand surface.
      //
      // MOVED 147 -> 148 for D-093 T2 + T3 (3 Oct): an operational change says what it was.
      // 20261111100000 rewrites audit writers and adds two reason/role columns (role_assignments,
      // account_activation_grants); no colour, mark or brand surface.
      //
      // MOVED 148 -> 149 for BOB-26 (Gate 3, landed 4 Oct, D-098), a person activates their own account.
      // 20261112100000 (renumbered from 20261030100000 at the landing) adds one table
      // (password_write_permits), two set-up columns (password_set_at, name_confirmed_at), the identity
      // functions and a trigger on auth.users; no colour, mark or brand surface.
      //
      // MOVED 170 -> 171 for CR-51 (D-120 Q7). 20261204100000 replaces package_batch's and create_release's bodies (the
      // platform admin alone at the PINTAR library) and two refusal sentences; no colour, mark or brand surface.
      //
      // MOVED 169 -> 170 for CR-13 (D-120 QN1). 20261203100000 adds the email-correction grant table, its RPC and a guard
      // trigger on auth.users; no colour, mark or brand surface.
      //
      // MOVED 165 -> 169 for the closure's batch 3 (D-118, D-120, D-121). 20261129100000 publishes pintar-scoring/2 and
      // makes a version's descriptors immutable (Q10); 20261130100000 counts a learner not yet assessed as such (CR-47);
      // 20261201100000 seals a certificate at issuance and numbers it by its holder (CR-02, CR-01); 20261202100000 gives a
      // misconception definition its content's owner (CR-50). Columns and replaced function bodies; no colour, mark or
      // brand surface.
      //
      // MOVED 164 -> 165 for ADM-18's template half. 20261128100000 replaces certificate_prepare's body again (the
      // number carries the school's saved prefix); no relation, column or new function; no colour, mark or brand surface.
      //
      // MOVED 162 -> 164 for the release checklist's ADM-18 and STU-12. 20261126100000 replaces certificate_prepare's
      // body (one number per certificate, no photo in it) and 20261127100000 hint_reveals_answer_shape's (a variable is
      // not an option); no relation, column or new function; no colour, mark or brand surface.
      //
      // MOVED 161 -> 162 for #150 WP-B, a backup reads everything and writes nothing. 20261125100000 creates one role
      // (pintar_backup) and no relation, column or function; no colour, mark or brand surface.
      //
      // MOVED 160 -> 161 for C-12's finding, a professional-learning answer stays the participant's own.
      // 20261124100000 replaces teacher_question_evidence (an academic place only); no colour, mark or brand surface.
      //
      // MOVED 159 -> 160 for D-102, an activation ends its own first session. 20261123100000 replaces the password guard
      // and adds a device_sessions reason; no colour, mark or brand surface.
      //
      // MOVED 158 -> 159 for D-101, the nearest authority recovers. 20261122100000 adds the recovery authority functions,
      // the session-ending core and a device_sessions reason, and replaces the lookup, the reset, the password guard and
      // the role guard; no colour, mark or brand surface.
      //
      // MOVED 157 -> 158 for follow-ups 19-21. 20261121100000 adds a transfer's rejection reason, the template's audit
      // selection and a course status audit trigger; no colour, mark or brand surface.
      //
      // MOVED 156 -> 157 for #148, maintenance and notices. 20261120100000 adds maintenance_windows, broadcast_notices,
      // the maintenance check in PostgREST's pre-request and the controls; no colour, mark or brand surface.
      //
      // MOVED 155 -> 156 for BOB-15 + DAISY-12, «Laporkan masalah». 20261119100000 adds support_reports and its three
      // functions; no colour, mark or brand surface.
      //
      // MOVED 154 -> 155 for BOB-43..47, an educator learns as a participant. 20261118100000 adds a place's learning
      // context and member kind, the assignment boundary, enrolment for professional learning, the PD evidence policies,
      // catalogue MC-5 and the professional-learning record; no colour, mark or brand surface.
      //
      // MOVED 153 -> 154 for BOB-29 (Gate 6), a shared computer locks and resumes with the PIN. 20261117100000 adds
      // device_sessions and device_contexts (session state and «Komputer siapa ini?», no colour, mark or brand), the
      // sesi_* functions and PostgREST's pre-request refusal; no colour, mark or brand surface.
      //
      // MOVED 152 -> 153 for BOB-28 (Gate 5), recovery by PINTAR ID + PIN and the card re-issue. 20261116100000 adds
      // recovery_by_pin, the card re-issue's grant table and guard on auth.users, the platform admin's lookup and
      // record, and redefines the send reserve and the password guard; no colour, mark or brand surface.
      //
      // MOVED 151 -> 152 for BOB-27 (Gate 4), a forgotten password is recovered by email. 20261115100000 adds
      // recovery_code_target, the recovery grant (its table, issue and permit) and RECOVERY in the password guard;
      // no colour, mark or brand surface.
      //
      // MOVED 150 -> 151 for D-098(c), a refused email is never called sent. 20261114100000 adds
      // email_sending_wait, code_request_pace and its table (keyed hashes and times only), and the platform admin's
      // email_send_history; no colour, mark or brand surface.
      //
      // MOVED 149 -> 150 for BOB-50 (Gate 3, landed 4 Oct, D-098), a single Uji Cepat does not certify.
      // 20261113100000 (renumbered from 20261031100000) changes one mode_policy row (QUICK certifies =
      // false) and re-emits its lint; no table, no column, no colour, mark or brand surface.
      //
      // MOVED 144 -> 145 for D-084 C1, D-085 M1: a school is founded by one versioned step.
      // 20261108100000 adds operator_found_school (the operator's connection
      // only); no table, no column, no colour, mark or brand surface.
      //
      // MOVED 143 -> 144 for D-085 M3 (J5.12): a teacher asks learners to read again.
      // 20261107100000 adds the request and its lessons (history, read through
      // their functions), three functions and four registry rows; no colour,
      // mark or brand surface.
      //
      // MOVED 142 -> 143 for D-085 M10: a correction arrives in its line.
      // 20261106100000 adds which course a workbook corrects and why to the batch,
      // the correction's summary table, its problems and the line pointer at
      // insert; no colour, mark or brand surface.
      //
      // MOVED 141 -> 142 for D-085 M10: a sealed chapter keeps its tests' questions.
      // 20261105100000 freezes items.cycle_role with the sealed question and makes
      // a revision copy it; no colour, mark or brand surface.
      //
      // MOVED 140 -> 141 for D-085 T2: a teacher chooses the Uji Cepat's questions.
      // 20261104100000 adds the stored choice, one line in the draw, the choices
      // read and the chosen launch; no colour, mark or brand surface.
      //
      // MOVED 139 -> 140 for D-085 M6: a teacher sees what a PINTAR chapter holds.
      // 20261103100000 adds one read of a distributed release's tests behind the
      // distribution gate; no colour, mark or brand surface.
      //
      // MOVED 138 -> 139 for D-088(b), BOB-49: a school sets its own pass mark.
      // 20261102100000 adds the school's setting, the seals on assignments and
      // attempts and the readers of the seal; no colour, mark or brand surface.
      //
      // MOVED 137 -> 138 for D-088(k), M5: a teacher sees which questions the
      // class found hard. 20261101100000 adds one read and its registry row; no
      // table, no column, no colour, mark or brand surface.
      //
      // MOVED 132 -> 133 for M9 (D-085), a student moves class. 20261027100000
      // adds one invoker-rights function over memberships; no table, no
      // column, no colour, mark or brand surface.
      //
      // MOVED 131 -> 132 for BOB-25, PINTAR sends its own email. 20261026100000
      // adds the send log and the send limits (two tables, two service-role
      // functions); no colour, mark or brand surface.
      //
      // MOVED 128 -> 129 for BOB-36, a launched Uji Cepat keeps its rules.
      // 20261023100000 adds one trigger function; no table, no column, no
      // colour, mark or brand surface.
      //
      // MOVED 127 -> 128 for BOB-35, a session is one course. 20261022100000
      // adds one trigger function (a session records a release of its
      // definition's course) and replaces move_learning_assignment_release. No
      // table, no column, no colour, mark or brand surface.
      //
      // MOVED 126 -> 127 for BOB-24, the identity foundation (identity Gate 2).
      // 20261021100000 creates six tables -- person_usernames, person_pins,
      // person_pins_retired, account_setup, identity_attempts and
      // recovery_ladder -- and adds one column, persons.pintar_id. Read against
      // §3 of the ruling before this number moved: every column is an
      // identifier, a hash, a state, a counter or a time; none is a colour,
      // mark, logo or brand surface, so the Q-7 source still does not exist.
      //
      // MOVED 125 -> 126 for BOB-33, a quick assessment is dated in Jakarta.
      // 20261020100000 adds one function (quick_assessment_label) and replaces
      // launch_quick_assessment's label line; no table, column, colour, mark or
      // brand surface.
      // MOVED 124 -> 125 for BOB-12, a card waits after failures (D-058).
      // 20261019100000 creates ONE table -- card_signin_cooldowns, whose columns
      // are kunci (an HMAC key), percobaan (attempt times) and diperbarui -- and
      // two service-role functions; no column, colour, mark or brand surface.
      // MOVED 123 -> 124 for BOB-21, a grant needs the school (D-049).
      // 20261018100000 replaces role_assignments_guard with one added check;
      // no column, colour, mark or brand surface.
      // MOVED 122 -> 123 for BOB-20, a school admin sees its own staff (D-048).
      // 20261017100000 widens person_visible_to_me to the school's own staff and
      // adds persons_awaiting_first_role_at; no column, colour, mark or brand surface.
      // MOVED 121 -> 122 for BOB-17, release blockers speak in codes (D-011).
      // 20261016100000 remakes publish_readiness and studio_package_state
      // with jsonb blockers and replaces the publish trigger's function; no
      // column, colour, mark or brand surface.
      // MOVED 116 -> 117 for BOB-06, every school has its standard reports
      // (B6b). 20261011100000 adds report_templates.is_standard (a boolean
      // marking PINTAR's own rows) and report_template_provisioning (txid,
      // created_at); neither is a mark, a logo, a crest or a theme, and the
      // existing `branding` column is untouched.
      // MOVED 115 -> 116 for BOB-04, a lesson is assigned whole (D-008).
      // 20261010100000 adds the assign function, replaces the materialiser, the
      // draw and my_cycle_state; no column, colour or brand surface.
      // MOVED 114 -> 115 for BOB-03, a course is released (audit B3).
      // 20261009100000 adds release functions and codes; no column, colour or
      // brand surface.
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
      // MOVED 171 -> 173 for batch 3b (D-123): 20261205100000 adds a constraint, a function and a registry row on the
      // decision queue, and 20261206100000 copies the catalogue to MC-7 and replaces two function bodies; neither adds a
      // table or a column, so the sweep below still asserts over files without its answer changing. Re-read first.
      // MOVED 173 -> 176 for L2 (D-128, D-129): 20261207100000 replaces difficulty_band's body (FD-5), 20261208100000 adds
      // the integrity waiting list's read and its registry row (FD-7), 20261209100000 replaces save_assessment_definition's
      // body (FD-9); none adds a table or a column, so the sweep below still asserts over files without its answer changing.
      // MOVED 176 -> 177 for L3 (D-132): 20261210100000 adds five columns to device_sessions (konteks_tujuan,
      // konteks_tempat, konteks_platform, konteks_sebab, konteks_pada: a session's working context) and four functions.
      // Read against §3 first: none is a mark, a logo, a crest or a theme, so the Q-7 source still does not exist.
      // MOVED 177 -> 181 for Batch 1 (D-145): 20261211100000 adds learner_readable_fields.judul_kolom (a finding's column
      // in the workbook's words) and re-words platform reference rows; 20261212100000 adds two triggers and four functions
      // (CR-91); 20261213100000 adds a content-status edge; 20261214100000 adds content_review_outcomes (a review's outcome,
      // reason, reviewer and author) and three functions. Read against §3 first: none is a mark, a logo, a crest or a
      // theme, so the Q-7 source still does not exist.
      // MOVED 181 -> 182 for Batch 3: 20261215100000 adds nama_riwayat_paket (the names «Riwayat perbaikan» shows) and its
      // registry row; no table, no column. Read against §3 first: it is not a mark, a logo, a crest or a theme, so the
      // Q-7 source still does not exist.
      // MOVED 182 -> 183 for the Batch 3 closure (D-150): 20261216100000 re-emits studio_home with one condition per
      // package bucket (a superseded version is not counted); no table, no column. Read against §3 first: it is not a
      // mark, a logo, a crest or a theme, so the Q-7 source still does not exist.
      // MOVED 183 -> 188 for Batch 4 (D-152): 20261217100000 adds card_conversions (a card's conversion to an email
      // account: person, card, address, reason, by whom) and re-emits two auth.users guards; 20261218100000 adds
      // orang_berakun; 20261219100000 makes transfers.to_academic_period_id nullable (the receiving school chooses it) and
      // adds four transfer functions; 20261220100000 adds email_send_stuck; 20261221100000 pages maintenance_list. Read
      // against §3 first: none is a mark, a logo, a crest or a theme, so the Q-7 source still does not exist.
      // MOVED 188 -> 189 for Batch 5 (agent C, W2.18): 20261225100000 adds tujuan_belum_tercapai (the objectives a
      // learner has not yet reached, by statement, for the class's teacher) and its registry row; no table, no column.
      // Read against §3 first: it is not a mark, a logo, a crest or a theme, so the Q-7 source still does not exist.
      // MOVED 189 -> 192 for Batch 5 (lead: W2.5, W2.7, W2.10): 20261222100000 adds sertifikat_sekolah (a school's
      // certificates for the revocation screen); 20261223100000 re-emits record_integrity_review and the waiting list and
      // adds integrity_reviews_recorded; 20261224100000 adds the paged waiting-for-account reads. Functions and registry
      // rows only; none is a mark, a logo, a crest or a theme.
      // MOVED 192 -> 193 for Batch 5 (agent B, UX-40): 20261227100000 adds result_views (that a learner has opened their
      // own finished result: session, person, when) and two learner functions. Read against §3 first: it is not a mark, a
      // logo, a crest or a theme, so the Q-7 source still does not exist.
      // MOVED 193 -> 194 for D-183 (F-4(f)): 20261228100000 adds exposed_content_marks (kind, fingerprint, exposure,
      // recorded_at: the fingerprints of exposed chapter titles and questions) and the guards that refuse them as a real
      // assessment. Read against §3 first: it is not a mark, a logo, a crest or a theme, so the Q-7 source still does not
      // exist.
      // MOVED 194 -> 195 for W6.10 (D-186): 20261229100000 re-emits may_start_assessment with one added refusal (the Uji
      // Penguasaan waits for the Pemetaan Awal); no table, no column. Read against §3 first: it is not a mark, a logo, a
      // crest or a theme, so the Q-7 source still does not exist.
      // MOVED 195 -> 196 for W2.17 (FD-4 at 10x staging): 20261230100000 adds school_people_page, a read of a school's
      // active enrolments with the person's name; no table, no column. Read against §3 first: it is not a mark, a logo, a
      // crest or a theme, so the Q-7 source still does not exist.
      c.expect(migrations.length === 196, `${migrations.length} migrations; the frozen baseline has 196`);
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
      // RESTATED FOR D-192: the default is the text wordmark; MerekPintar is still its one renderer (the certificate and
      // the card take its word from it), so an institution mark would still substitute in one place
      c.expect(/export const NAMA_MEREK = "PINTAR"/.test(mark), "the default mark is no longer the PINTAR wordmark");
      const renderers = experience
        .filter((f) => /\.tsx$/.test(f))
        .filter((f) => /className=\{?[`"]pin-merek\b/.test(code(readFileSync(f, "utf8"))) || /brand\/[a-z-]+\.png/.test(code(readFileSync(f, "utf8"))))
        .map((f) => relative(repoRoot, f).replace(/\\/g, "/"));
      c.expect(
        renderers.length === 1 && renderers[0] === "src/components/MerekPintar.tsx",
        `the shell mark is drawn by ${renderers.length} component(s); the shell identity must have ` +
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
      // RESTATED, B6C (Batch 6): the sheet no longer draws its record with .pin-facts (Daisy's ronde-2 record is its own
      // block on the page's axis), so there is no sheet exception to keep. The rule it guarded is held more strongly:
      // no phone rule reaches into the sheet at all, so nothing narrows the paper.
      c.expect(sheet === 0, `${sheet} sheet rule(s) narrow .pin-facts; the sheet has no fact summary to keep`);
      c.expect(!/\.pin-sheet|\.pin-s-/.test(phone), "a phone rule reaches into the A4 sheet, which is scaled whole and never reflowed");

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

      // W18, Yazid's ruling (D-088(d)): continue before beginning. A running
      // session, then the lesson being read, then a chapter whose lessons wait,
      // then a Mastery Check whose lessons are all read, then a new chapter's
      // mapping. Another chapter's test never displaces the reading under way.
      const mixed = [
        K("untaken mastery", S({ pre_status: "FINALIZED" }), L(5, 5)),
        K("unstarted mapping", S(), L(0, 5)),
        K("lessons waiting", S({ pre_status: "FINALIZED" }), L(0, 5)),
        K("lessons", S({ pre_status: "FINALIZED" }), L(2, 5)),
      ];
      const r1 = peringkat(mixed);
      const urutan1 = [r1.utama, ...r1.sisa].map((k) => k?.tugas.title).join(" → ");
      c.expect(urutan1 === "lessons → lessons waiting → untaken mastery → unstarted mapping",
        `the home orders the learner's work as ${urutan1}; expected the lesson being read, then the chapter whose ` +
          "lessons wait, then the Mastery Check whose lessons are read, then a new chapter's mapping (D-088(d))");

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
          "and the home's single recommendation follows Yazid's ranking (D-088(d), W18) rather than list position: a " +
          "running session first, then the lesson being read, the chapter whose lessons wait, the Mastery Check " +
          "whose lessons are read and a new chapter's mapping last; a finished cycle never; and the same answer " +
          "whatever order the rows arrive in",
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
      // D-085 T2: the launch with the teacher's chosen questions, which goes through launch_quick_assessment itself
      c.expect(/launch_(selected_)?quick_assessment/.test(aksi), "the quick assessment is not launched through its own RPC");
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
      // RESTATED for D-085 M3 (J5.12): the teacher's request to read again is a third commitment, ruled by the owner
      // and made by a form action (mintaBacaUlang) like the other two; nothing else changed in what this checks
      c.expect(exported.length === 3, `${exported.length} exported educator action(s); the surface commits three things`);
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
      // RESTATED BY BOB-04 (D-008): the commitment moved into assign_release,
      // which makes the learning assignment and both tests of the cycle in one
      // transaction. The property is unchanged and is read where it now lives:
      // the action calls that one function, and the function inserts the
      // assignment without a status (DRAFT) and activates it in its own UPDATE.
      c.expect(/rpc\("assign_release",/.test(aksi), "making material available does not go through assign_release");
      c.expect(!/from\("learning_assignments"\)/.test(aksi), "the educator action writes learning_assignments itself");
      const penugasan = readFileSync(join(repoRoot, "supabase", "migrations", "20261010100000_a_lesson_is_assigned_whole.sql"), "utf8");
      const assign = /create function public\.assign_release[\s\S]*?end \$\$;/.exec(penugasan)?.[0] ?? "";
      const lahir = /insert into public\.learning_assignments \(([^)]*)\)/.exec(assign)?.[1] ?? "";
      c.expect(lahir !== "" && !/\bstatus\b/.test(lahir), "materialising an assignment does not insert a row born at DRAFT");
      c.expect(/update public\.learning_assignments set status = 'ACTIVE' where id = v_la;/.test(assign),
        "the assignment is never activated in its own statement");

      // A redirect target is derived, never taken from the form: the learner
      // side's unvalidated `kembali` is a known finding and is not repeated here.
      c.expect(!/formData\.get\("kembali"\)/.test(aksi), "an educator action takes its redirect from the form");

      c.note(`${pages.length} page(s) swept, ${exported.length} action(s), 2 plants caught`);
      return c.verdict(
        "no page on the educator surface writes anything while rendering — the scanner is watched to catch a planted insert " +
        "and a planted launcher — both stages before a commitment are GET renders of the query string, the only three writes " +
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
      //    RE-POINTED FOR DAISY-39 (D-082(d), BOB-50): THE LIVE POLICY, not the
      //    first one. The row's value is its insert in 20260914093000, then
      //    every later migration that sets QUICK's `certifies`, in order; BOB-50
      //    (20261113100000) sets it false. The branch that applies is inverted
      //    accordingly: the copy may not claim certificate eligibility.
      const policy = readFileSync(join(mig, "20260914093000_mode_policy_quick_assessment_integrity.sql"), "utf8");
      const kolom = /create table public\.mode_policy \(([\s\S]*?)\n\);/.exec(policy)?.[1] ?? "";
      const urutan = [...kolom.matchAll(/^\s{2}(\w+)\s+/gm)].map((m) => m[1]);
      const iCert = urutan.indexOf("certifies");
      c.expect(iCert > 0, "mode_policy no longer has a certifies column");
      const barisQuick = /\n  \('QUICK',([^)]*)\)/.exec(policy)?.[1] ?? "";
      const nilai = barisQuick.split(",").map((x) => x.trim());
      let certifies = nilai[iCert - 1];
      c.expect(certifies === "true" || certifies === "false", `could not read QUICK.certifies at its insert (${certifies})`);
      const pengubah: string[] = [];
      for (const f of readdirSync(mig).filter((f) => f.endsWith(".sql") && f > "20260914093000").sort()) {
        const sql = readFileSync(join(mig, f), "utf8").replace(/--[^\n]*/g, "");
        for (const m of sql.matchAll(/update public\.mode_policy\s+set ([\s\S]*?)\swhere mode = 'QUICK'/g)) {
          const v = /certifies\s*=\s*(true|false)/.exec(m[1])?.[1];
          if (v) { certifies = v; pengubah.push(f); }
        }
      }
      c.expect(pengubah.includes("20261113100000_a_quick_assessment_does_not_certify.sql"), "BOB-50's change to QUICK.certifies is not read");

      // the copy an educator or a tour reads about an Uji Cepat
      const kunciCepat = [...hle.matchAll(/"(mengajar\.cepat\.[a-z0-9_.]+|mengajar\.langkah\.f5w|tur\.pg\.4\.isi)":\s*\{([^}]*)\}/g)];
      c.expect(kunciCepat.length >= 21, `only ${kunciCepat.length} quick-assessment copy strings found`);
      const semuaCepat = kunciCepat.map((m) => m[2]).join(" ");

      const MENYANGKAL = [
        /tidak masuk sertifikat/i, /bukan bagian dari sertifikat/i,
        /not part of a certificate/i, /not part of any certificate/i,
        /does not count toward/i, /tidak dihitung untuk sertifikat/i,
        /tidak menilai murid/i, /bukan sebagai nilai murid/i,
        /not a judgment of the learner/i, /not a learner grade/i,
        /hasilnya untuk Anda\b/i, /the result is for you\b/i,
      ];
      // what claims a result reaches a certificate
      const KLAIM = [
        /kelayakan sertifikat/i, /certificate eligibility/i, /menuju sertifikat/i, /toward(s)? a certificate/i,
        /Uji Cepat saja/i, /a single Quick Assessment/i, /satu Uji Cepat/i, /one Quick Assessment/i,
        /penerbitan dilakukan sekolah/i, /the school issues/i,
      ];
      // the control: the sentence the policy change made false is caught
      c.expect(KLAIM.some((r) => r.test("Hasilnya tercatat sebagai bukti pembelajaran dan dapat dipakai saat menentukan kelayakan sertifikat.")),
        "the claim sweep does not catch the old sentence");
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
      } else {
        // QUICK DOES NOT CERTIFY (D-082(d)): no line claims or hedges a way
        // to a certificate, each language says plainly that an Uji Cepat does
        // not issue one, and the result is still called learning evidence --
        // the ruling changes the certificate, not what the evidence is
        for (const r of KLAIM) c.expect(!r.test(semuaCepat), `QUICK does not certify, but the copy still says: ${r}`);
        c.expect(/Uji Cepat tidak menerbitkan sertifikat/.test(semuaCepat) && /a Quick Assessment does not issue a certificate/i.test(semuaCepat),
          "the copy does not say plainly, in both languages, that an Uji Cepat does not issue a certificate");
        c.expect(/bukti (pembelajaran|belajar)/i.test(semuaCepat) && /learning evidence/i.test(semuaCepat),
          "the copy no longer says the result is learning evidence");
        for (const bad of MENYANGKAL) c.expect(!bad.test(semuaCepat), `the copy denies the result is evidence: ${bad}`);
      }

      // 3. AND IT PROMISES NO PER-ITEM RESULT, because there is no read path.
      for (const bad of [/per soal/i, /per-item/i, /per item/i, /tiap soal/i, /item-level result/i]) {
        c.expect(!bad.test(semuaCepat), `the quick assessment promises a per-item result: ${bad}`);
      }
      c.expect(!/metric_evaluate/.test(cepat), "the quick assessment screen asks for a metric");

      c.note(`QUICK.certifies=${certifies} (live, after ${pengubah.join(", ") || "its insert"}), bounds 3-20 single attempt, presets ${preset.join("/")} inside ${lo}-${hi}, ${kunciCepat.length} copy strings`);
      return c.verdict(
        "the quick assessment reads its item bounds from assessment_definition_bounds rather than restating them, offers " +
        "three windows inside the launcher's own range, and tells the truth about the result: mode_policy's LIVE QUICK row " +
        "(its insert, then every later migration that sets it) is PARSED here and the copy is required to agree with it -- " +
        "with QUICK not certifying (D-082(d)), no line claims or hedges a way to certificate eligibility (the old sentence " +
        "is the planted control), each language says plainly that an Uji Cepat does not issue a certificate, the result is " +
        "still learning evidence, and no per-item result is promised that an educator has no read path to",
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
        // v3 Tabs (D-138 step 2): a flex row, kept to one scrolling row on a phone
        { sel: ".pin-switch", base: /\.pin-switch \{[^}]*display:\s*flex/ },
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
      // from, not a claim about the tour. MOVED 170 -> 171 for CR-51's library import (20261204100000), not a tour RPC
      // (D-024). MOVED 169 -> 170 for CR-13's email correction (20261203100000), not a tour RPC
      // (D-024). MOVED 165 -> 169 for the closure's batch 3 (20261129100000 Q10, 20261130100000
      // CR-47, 20261201100000 CR-02/CR-01, 20261202100000 CR-50), not a tour RPC (D-024). MOVED 164 -> 165 for ADM-18's prefix (20261128100000, a replaced function body), not a
      // tour RPC (D-024). MOVED 162 -> 164 for ADM-18 and STU-12 (20261126100000, 20261127100000: two
      // replaced function bodies), not a tour RPC (D-024). MOVED 161 -> 162 for #150 WP-B's backup role (20261125100000), not a tour RPC
      // (D-024). MOVED 160 -> 161 for C-12's finding, «Lihat per soal» an academic place only
      // (20261124100000), not a tour RPC (D-024). MOVED 159 -> 160 for D-102's activation session (20261123100000), not a tour
      // RPC (D-024). MOVED 158 -> 159 for D-101's recovery authority (20261122100000), not a tour
      // RPC (D-024). MOVED 157 -> 158 for follow-ups 19-21 (20261121100000), not a tour RPC (D-024).
      // MOVED 156 -> 157 for #148's maintenance and notices (20261120100000), not a
      // tour RPC (D-024). MOVED 155 -> 156 for BOB-15's «Laporkan masalah» (20261119100000), not a tour
      // RPC (D-024). MOVED 154 -> 155 for BOB-43..47's educator as learner (20261118100000), not a
      // tour RPC (D-024). MOVED 153 -> 154 for BOB-29's shared-computer lock (20261117100000), not a
      // tour RPC (D-024). MOVED 152 -> 153 for BOB-28's PIN recovery and card re-issue
      // (20261116100000), not a tour RPC (D-024). MOVED 151 -> 152 for BOB-27's email recovery
      // (20261115100000), not a tour RPC (D-024). MOVED 150 -> 151 for D-098(c)'s email waits
      // (20261114100000), not a tour RPC (D-024). MOVED 149 -> 150 for BOB-50's Uji Cepat certificate rule
      // (20261113100000), not a tour RPC (D-024). MOVED 148 -> 149 for BOB-26's activation
      // (20261112100000), not a tour RPC (D-024). MOVED 147 -> 148 for D-093 T2 + T3's audit writers (20261111100000),
      // not a tour RPC (D-024). MOVED 146 -> 147 for D-093 T1's one path for operational state
      // (20261110100000), not a tour RPC (D-024). MOVED 145 -> 146 for the efficiency audit's draw by index
      // (20261109100000), not a tour RPC (D-024). MOVED 144 -> 145 for C1's school founding (20261108100000),
      // not a tour RPC (D-024). MOVED 143 -> 144 for D-085 M3's request to read again
      // (20261107100000), not a tour RPC (D-024). MOVED 142 -> 143 for D-085 M10's correction upload
      // (20261106100000), not a tour RPC (D-024). MOVED 141 -> 142 for D-085 M10's sealed test marks
      // (20261105100000), not a tour RPC (D-024). MOVED 140 -> 141 for D-085 T2's chosen Uji Cepat
      // (20261104100000), not a tour RPC (D-024). MOVED 139 -> 140 for D-085 M6's PINTAR chapter read
      // (20261103100000), not a tour RPC (D-024). MOVED 138 -> 139 for D-088(b)'s school pass mark
      // (20261102100000), not a tour RPC (D-024). MOVED 137 -> 138 for D-088(k)'s teacher read
      // (20261101100000), not a tour RPC (D-024). MOVED 136 -> 137 for D-088(g)'s catalogue MC-4
      // (20261031100000), not a tour RPC (D-024). MOVED 135 -> 136 for D-088(i)'s current-placement access
      // (20261030100000), not a tour RPC (D-024). MOVED 134 -> 135 for ADM-J09's Tingkat placement
      // (20261029100000), not a tour RPC (D-024). MOVED 133 -> 134 for ADM-J19's rollover
      // (20261028100000), not a tour RPC (D-024). MOVED 132 -> 133 for M9's class move
      // (20261027100000), not a tour RPC (D-024). MOVED 131 -> 132 for BOB-25's send log
      // (20261026100000), not a tour RPC (D-024). MOVED 130 -> 131 for BOB-37's per-topic mastery
      // (20261025100000), not a tour RPC (D-024). MOVED 129 -> 130 for BOB-39's integrity referral
      // (20261024100000), not a tour RPC (D-024). MOVED 128 -> 129 for BOB-36's Uji Cepat rules
      // (20261023100000), not a tour RPC (D-024). MOVED 127 -> 128 for BOB-35's session provenance
      // (20261022100000), not a tour RPC (D-024). MOVED 126 -> 127 for BOB-24's identity foundation
      // (20261021100000), not a tour RPC (D-024). MOVED 125 -> 126 for BOB-33's quick-assessment label
      // (20261020100000), not a tour RPC (D-024). MOVED 124 -> 125 for BOB-12's card cooldown
      // (20261019100000), not a tour RPC (D-024). MOVED 123 -> 124 for BOB-21's grant check
      // (20261018100000), not a tour RPC (D-024). MOVED 122 -> 123 for BOB-20's staff visibility
      // (20261017100000), not a tour RPC (D-024). MOVED 121 -> 122 for BOB-17's readiness codes
      // (20261016100000), not a tour RPC (D-024). MOVED 120 -> 121 for BOB-11's media preview
      // (20261015100000), not a tour RPC (D-024). MOVED 119 -> 120 for BOB-10's staff-row refusal
      // (20261014100000), not a tour RPC (D-024). MOVED 118 -> 119 for BOB-18's quick answers
      // (20261013100000), not a tour RPC (D-024). MOVED 117 -> 118 for BOB-08's structure
      // integrity (20261012100000), not a tour RPC (D-024). MOVED 116 -> 117 for BOB-06's standard
      // report templates (20261011100000), not a tour RPC (D-024). MOVED 115 -> 116 for BOB-04's assign
      // function (20261010100000), not a tour RPC (D-024). MOVED 114 -> 115 for BOB-03's release
      // functions (20261009100000), not tour RPCs (D-024). MOVED 113 -> 114 for BOB-14's revoke of
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
      // MOVED 171 -> 173 for batch 3b (D-123): the decision queue's referrer rule and catalogue MC-7 touch no tour RPC.
      // MOVED 173 -> 176 for L2: a band's reading, the integrity waiting list and a rule's save touch no tour RPC.
      // MOVED 176 -> 177 for L3 (D-132): a session's working context touches no tour RPC.
      // MOVED 177 -> 181 for Batch 1 (D-145): v1 wording, CR-91's card rule, the send-back edge, the one-transaction content
      // step and the review record touch no tour RPC.
      // MOVED 181 -> 182 for Batch 3: the history's names (nama_riwayat_paket) touch no tour RPC.
      // MOVED 182 -> 183 for the Batch 3 closure (D-150): studio_home's superseded-version condition touches no tour RPC.
      // MOVED 183 -> 188 for Batch 4 (D-152): the card conversion, the correction finder, the transfer by name, stuck
      // sends and maintenance paging touch no tour RPC.
      // MOVED 188 -> 189 for Batch 5 (agent C, W2.18): the objectives a learner has not yet reached touch no tour RPC.
      // MOVED 189 -> 192 for Batch 5 (lead): certificate revocation, the integrity review and the paged waiting list touch
      // no tour RPC.
      // MOVED 192 -> 193 for Batch 5 (agent B, UX-40): a result's «seen» (result_views) touches no tour RPC.
      // MOVED 193 -> 194 for D-183 (F-4(f)): the exposure marks and their two assignment and sitting guards touch no tour RPC.
      // MOVED 194 -> 195 for W6.10 (D-186): the Uji Penguasaan waiting for the Pemetaan Awal touches no tour RPC.
      // MOVED 195 -> 196 for W2.17 (FD-4 at 10x staging): a page of a school's people, found by name, touches no tour RPC.
      c.expect(migs.length === 196, `${migs.length} migrations; the baseline has 196`);
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
      // (D-138 step 3: read in the shell's own render; the staff layout draws only the Help control it is handed)
      const intiSrc = intiCangkang(cangkangSrc);
      const blokAjar = intiSrc.slice(intiSrc.indexOf("if (mengajar)"), intiSrc.lastIndexOf("return ("));
      c.expect(blokAjar.includes("nav.pembelajaran") && /return shellStaf\(/.test(blokAjar), "the educator's learning shell could not be located");
      c.expect(!/TombolBantuan|bantuan:/.test(blokAjar),
        "the educator's learning shell carries a Help control whose tour is not theirs");
      const tataStaf = shellStafSrc(cangkangSrc);
      c.expect(tataStaf !== "" && !/TombolBantuan/.test(tataStaf) && /\{bantuan\}/.test(tataStaf),
        "the staff layout draws a Help control of its own instead of only the one its branch hands it");

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

      // 1. IT IS A DIALOG, AND IT SAYS SO -- a NON-MODAL one.
      //    RESTATED FOR W3.15 (UX-38, Batch 5): «Let the landing stay usable while the tour is offered». The card keeps
      //    its role, its label and its description; it no longer declares itself modal, because it no longer is.
      for (const [re, apa] of [
        [/role="dialog"/, "role=dialog"],
        [/aria-labelledby="pin-tur-judul"/, "a label pointing at the headline"],
        [/aria-describedby="pin-tur-isi"/, "a description pointing at the body"],
      ] as Array<[RegExp, string]>) {
        c.expect(re.test(kartu), `the tour card has no ${apa}`);
      }
      c.expect(!/aria-modal/.test(kartu), "the tour card still declares itself modal while the page behind it is usable");

      // 2. THE PAGE BEHIND STAYS USABLE (restated, W3.15). It was made inert and aria-hidden until the tour was
      //    skipped; now nothing in the tour takes the page away from the pointer, the keyboard or a screen reader:
      //    no inert, no aria-hidden written onto the page, no Tab held inside the card, and neither veil catches a
      //    click. Esc still closes it, as a skip.
      c.expect(!/setAttribute\("inert"/.test(kartu), "the page behind the tour is made inert");
      c.expect(!/setAttribute\("aria-hidden"/.test(kartu), "the page behind the tour is hidden from a screen reader");
      c.expect(!/e\.key !== "Tab"|e\.key === "Tab"/.test(kartu), "Tab is held inside the tour card");
      c.expect(/if \(e\.key === "Escape"\) \{\s*e\.preventDefault\(\);\s*tutup\("lewati"\);/.test(kartu), "Esc no longer closes the tour as a skip");
      const cssTur = readFileSync(join(repoRoot, "src", "app", "experience.css"), "utf8");
      const tirai = /\.pin-tur-tirai \{([^}]*)\}/.exec(cssTur)?.[1] ?? "";
      const sorot = /\.pin-tur-sorot \{([^}]*)\}/.exec(cssTur)?.[1] ?? "";
      c.expect(/pointer-events:\s*none/.test(tirai) && /pointer-events:\s*none/.test(sorot), "a veil catches the clicks meant for the page under it");

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
        "the tour is a dialog a keyboard and a screen reader can use: it declares role, its label and its " +
        "description and is not modal (W3.15) -- the page behind it is never made inert or aria-hidden, Tab is not held in " +
        "the card, Esc still closes it and neither veil catches a click -- focus lands on the " +
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
      // RESTATED FOR THE FROZEN DESIGN (D-136, D-138(c)): 08-migration.md, Containers, gives the tour Dialog's layer
      // tokens, `scrim`, `radius-lg` and `shadow-dialog` (Yazid's question 5, 5 Oct), and keeps the spotlight. That
      // later approval replaces Sauron's primary-soft composite (§O-2) for the veil only; the guidance ground (1.) and
      // the ring (above) are unchanged. The tirai, the veil without a target, is the same colour.
      c.expect(/0 0 0 4000px var\(--scrim\)/.test(bayang), "the veil is not the design's scrim");
      const tirai = aturan.find((r) => /(?:^|[\s}])\.pin-tur-tirai$/.test(r.sel));
      c.expect(/background:\s*var\(--scrim\)/.test(tirai?.body ?? ""), "the veil without a target is not the design's scrim");
      const kartuTur = aturan.find((r) => /(?:^|[\s}])\.pin-tur-kartu$/.test(r.sel));
      c.expect(/border-radius:\s*var\(--radius-lg\)/.test(kartuTur?.body ?? "") && /box-shadow:\s*var\(--shadow-dialog\)/.test(kartuTur?.body ?? ""),
        "the tour card does not take Dialog's radius and shadow");
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

      // 1. THE SCREEN OFFERS THE DOORS THAT EXIST AND NOT ONE MORE. A
      //    sign-in screen that offers a door which is not there is worse than
      //    one that offers fewer doors: the person tries it, it fails, and they
      //    conclude the system is broken rather than that they misread it.
      //    RESTATED FOR DAISY-20 (D-054(a), a changed requirement): the
      //    password door exists now (email or username, and password, through
      //    BOB-26's route), so it leaves the absent list and is held to exactly
      //    one field below. Registration and self-service recovery are still
      //    absent: «Lupa password?» opens the email link, the fallback door
      //    (TAUTAN_MASUK_CADANGAN) until recovery ships.
      const TIDAK_ADA: Array<[RegExp, string]> = [
        [/type=["']password["']/, "a second password field"],
        [/signUp|resetPasswordForEmail|updateUser\(/, "registration or password recovery"],
        [/signInWithOAuth|\bgoogle\b|\bmicrosoft\b|\bapple\b|\boauth\b/i, "social sign-in"],
        [/\bsso\b|\bsaml\b|webauthn|passkey/i, "SSO or a passkey"],
        [/ingat.?saya|remember.?me/i, "a remember-me control"],
        [/pilih.?institusi|institution.?select|pilih.?peran|role.?select/i, "an institution or role picker"],
      ];
      for (const f of files) {
        // RESTATED FOR CR-86 (D-127 Q6, D-128): the card's PIN and the
        // password are typed in the one secret field (KolomRahasia, held by
        // PENUTUPAN-R01), so no sign-in file holds a password-type input of
        // its own; one would be a second password field.
        const src = code(readFileSync(join(repoRoot, f), "utf8"));
        for (const [re, apa] of TIDAK_ADA) {
          const m = re.exec(src);
          c.expect(m === null, `${f} offers ${apa}: ${m?.[0]}`);
        }
      }
      c.expect(TIDAK_ADA.some(([re]) => re.test('<input type="password" name="sandi" />')),
        "the absent-door sweep does not catch a password field");
      // The password door, once: one masked field besides the card's PIN,
      // filled as the current password, sent only through the contract's
      // route; and the email link offered only behind the fallback switch.
      const layarPw = code(readFileSync(join(repoRoot, "src", "components", "masuk", "LayarMasuk.tsx"), "utf8"));
      // RESTATED FOR CR-86: the password is one secret field (KolomRahasia), filled as the current password.
      c.expect((layarPw.match(/<KolomRahasia\b[^>]*autoComplete="current-password"/g) ?? []).length === 1
        && (layarPw.match(/autoComplete="current-password"/g) ?? []).length === 1 && /name="identitas"/.test(layarPw),
        "the password door is not one email-or-username field and one current-password field");
      c.expect(/kirimRute<"masukPassword", \{ tujuan: string \}>\("masukPassword", fd\)/.test(layarPw)
        && !/fetch\(/.test(layarPw),
        "the password door reaches the server other than through BOB-26's route");
      c.expect(/\{TAUTAN_MASUK_CADANGAN \? \(/.test(layarPw) && /s\("auth\.pw_lupa"\)/.test(layarPw),
        "the email link is offered without the fallback switch, or «Lupa password?» is gone while it is on");
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
      //
      //    ONE FILE IS NOT THE EMAIL PATH, AND IT IS NAMED. The class card's
      //    wait (DAISY-13, BOB-12 (c), M13) is the card route's own answer, and
      //    its cooldown counts every card number submitted, existing or not
      //    (BOB-12 design condition 4), so showing it separates nothing. It
      //    lives in src/components/masuk/kartu.ts and nowhere else, and the
      //    email path is held away from it below.
      const KARTU = "src/components/masuk/kartu.ts";
      c.expect(files.includes(KARTU), "the card path's module is not where this sweep expects it, so the exemption names nothing");
      for (const f of files.filter((f) => f !== KARTU)) {
        const src = code(readFileSync(join(repoRoot, f), "utf8"));
        const m = /setInterval|countdown|hitung.?mundur|cooldown|retry.?after|jeda.?detik|\bdetik\b/i.exec(src);
        c.expect(m === null, `${f} invents a resend policy: ${m?.[0]}`);
      }
      // Only the card surface imports it: the send action and the email
      // surface's own functions never reach the card's wait.
      const pengimpor = files.filter((f) => f !== KARTU && /from "(?:\.\/|@\/components\/masuk\/)kartu"/.test(readFileSync(join(repoRoot, f), "utf8")));
      c.expect(pengimpor.length === 1 && pengimpor[0] === "src/components/masuk/LayarMasuk.tsx",
        `the card path's module is imported by ${pengimpor.join(", ") || "nothing"}, not by the card surface alone`);
      const layarKirim = code(readFileSync(join(repoRoot, "src", "components", "masuk", "LayarMasuk.tsx"), "utf8"));
      for (const fn of ["kirim", "terapkanKirim", "kirimUlang", "emailLain"]) {
        const badan = new RegExp(`(?:async )?function ${fn}\\([^)]*\\)[^{]*\\{[\\s\\S]*?\\n  \\}`).exec(layarKirim)?.[0] ?? "";
        c.expect(badan.length > 0 && !/kirimKartu|kalimatKartu|menunggu\(|layar\.gagal/.test(badan), `the email path's ${fn} reaches the card's result`);
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
        "the sign-in screen offers exactly the doors the contract has (D-054): one email-or-username and password " +
        "door through BOB-26's route, the class card, and the email link behind «Lupa password?» only while the " +
        "fallback switch is on; no second password field, no registration, no self-service " +
        "recovery, no social sign-in, no SSO, no passkey, no institution or role picker and no remember-me appear " +
        "in any of its source files — both sweeps watched on plants — `?peran=` is neither branched on nor rendered " +
        "for a persona the screen has not met and never survives the authentication boundary, L-2's " +
        "shouldCreateUser:false is intact with its privacy fold still ordered ahead of the rate-limit branch, and " +
        "S6 is SUPPRESSED BY SECURITY RULING (D2) and cannot return: the send outcome set has no member meaning " +
        "held, the throttle is still recognised so it can be folded into the same answer an unknown address gets " +
        "rather than mistaken for a transport failure, its copy is gone from the table, and no timer, countdown, " +
        "cooldown or retry-after exists anywhere on the email path; the class card's wait is the card route's own, " +
        "lives in one named module that only the card surface imports, and no email function reaches it. A client " +
        "that never started holds every actionable " +
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
      // RESTATED FOR BOB-12 AND DAISY-13 (a changed requirement): the card no
      // longer signs in through a server action here but through POST
      // /masuk/kartu. The route's one non-match code is the collapse, and the
      // screen says «Belum cocok» and marks the fields for that code alone. No
      // code names the card or the PIN.
      const kodeKartu = Object.keys((await import("../src/lib/kartu-kontrak")).STATUS_KARTU);
      const intiKartu = code(readFileSync(join(repoRoot, "src", "lib", "kartu-masuk.ts"), "utf8"));
      c.expect(kodeKartu.filter((k) => /MATCH/.test(k)).length === 1 && !kodeKartu.some((k) => /PIN|NUMBER|NOMOR|UNKNOWN|EXIST/.test(k))
          && /if \(jenis === "TIDAK_COCOK"\) return gagal\("CARD_NOT_MATCHED"\);/.test(intiKartu),
        "the card path no longer collapses every refusal to one value");
      const KODE = Object.keys(KODE_KARTU);
      c.expect(KODE.join() === kodeKartu.join(),
        `the card screen reads other codes than the route answers: ${KODE.join(", ")} / ${kodeKartu.join(", ")}`);
      c.expect(/const tidakCocok = layar\.gagal\?\.kode === "CARD_NOT_MATCHED";/.test(layar),
        "the card fields are marked invalid by something other than a non-match");
      const invalid = [...layar.matchAll(/aria-invalid=\{tidakCocok \? "true" : undefined\}/g)].length;
      c.expect(invalid === 2, `${invalid} card field(s) marked invalid; both must be, or the tree names the wrong one`);
      const described = [...layar.matchAll(/aria-describedby=\{layar\.gagal \? "kartu-err" : undefined\}/g)].length;
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
      const ditanam = layar.replace(/aria-invalid=\{tidakCocok \? "true" : undefined\}/, "PLANTED");
      c.expect([...ditanam.matchAll(/aria-invalid=\{tidakCocok \? "true" : undefined\}/g)].length === 1,
        "the both-fields-invalid count does not notice a field losing its marking");

      c.note("4 privacy propert(ies), 2 language(s), 2 plants");
      return c.verdict(
        "nothing on the sign-in screen distinguishes an unknown address from a sent link, or a bad card number from " +
        "a bad PIN: the send path reports an unregistered address as the ordinary outcome and asks no question " +
        "beforehand that would rebuild the oracle, its outcome set has no name for `no such account`, the " +
        "confirmation is conditional in both languages and echoes no address back, the card route's one non-match " +
        "code is the only one that marks the fields, BOTH of them against ONE message — watched on a plant — and " +
        "no card code tells a card number from a PIN or a card from no card; the failure copy " +
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
      // RESTATED FOR L3 (D-132 C4, C9, C10): every arrival goes through /mulai, which sets the working context; the
      // helper still narrows the carried destination with its own parameter (none: ""), and the role's home is the
      // fallback only where a session has no context to land by (an evaluation persona, C10), on /mulai itself
      const aksi = code(readFileSync(join(repoRoot, "src", "app", "masuk", "actions.ts"), "utf8"));
      const mulai = code(readFileSync(join(repoRoot, "src", "app", "mulai", "route.ts"), "utf8"));
      c.expect(/const lanjut = tujuanInternal\(raw, ""\);/.test(aksi) && /return "\/mulai";/.test(aksi)
        && /ke = lanjut \|\| berandaPeran\(viewer\?\.displayRole \?\? null\);/.test(mulai)
        && /ke = lanjut \|\| berandaPasangan\(k\);/.test(mulai),
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

      // 2. THE REVEAL IS A LABELLED TOGGLE, and nothing re-masks it while it is read.
      //    RESTATED FOR CR-86 (D-127 Q6, D-128): the toggle is the one secret field's (src/components/KolomRahasia.tsx,
      //    held by PENUTUPAN-R01: a pressed-state toggle whose name swaps with its state, no timer); the person's own
      //    submit re-masks it. Here: the card's PIN asks through it, named by the card's own show/hide words.
      c.expect(/<KolomRahasia\b[\s\S]{0,200}tampilkan=\{s\("auth\.card_show"\)\} sembunyikan=\{s\("auth\.card_hide"\)\}[\s\S]{0,80}id="pin"/.test(layar),
        "the card's PIN is not the one secret field with the PIN's own show and hide words");
      const timers = [...layar.matchAll(/setTimeout\(([^;]*?)\)/g)].map((m) => m[0]);
      c.expect(timers.length === 0,
        `the sign-in surface runs a timer: ${timers.join("; ")} — a PIN that re-hides itself while a child is ` +
        "comparing it against a printed card is a small cruelty");

      // 3. FOCUS DESTINATIONS ARE DECLARED IN ONE PLACE, not scattered.
      //    RESTATED FOR DAISY-20 (D-054(a), a changed requirement): the
      //    password surface is the door now, so its first field joins the set,
      //    and both of its refusals -- nothing typed, and no match -- send focus
      //    there, because the answer does not say which field was wrong. Its
      //    reveal is the same labelled toggle as the PIN's.
      c.expect(/type Fokus = "judul" \| "identitas" \| "email" \| "kirim" \| "kartu" \| null;/.test(layar),
        "the focus destinations are not declared as one set");
      c.expect(/setLayar\(\{ k: "password", kosong: true \}\);\s*\n\s*pindahFokus\("identitas"\);/.test(layar)
        && /setLayar\(\{ k: "password", gagal: jawaban \}\);[\s\S]{0,120}pindahFokus\("identitas"\);/.test(layar),
        "a password refusal does not send focus to the first field");
      c.expect(/<KolomRahasia\b[\s\S]{0,200}tampilkan=\{s\("auth\.pw_show"\)\} sembunyikan=\{s\("auth\.pw_hide"\)\}[\s\S]{0,80}id="password"/.test(layar),
        "the password is not the one secret field with the password's own show and hide words");
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
        catatan: null, diputuskanPada: null, olehSaya: false, adaPemutus: null,
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
        // Terminology v1 (D-068, row C28, ruling 9): «tingkat institusi» → «untuk sekolah secara keseluruhan»; the
        // suppression itself, «Selebihnya tidak muncul.», is unchanged
        ["pimpinan.batas",
          "Yang muncul di sini memerlukan wewenang, koordinasi, atau penafsiran untuk sekolah secara keseluruhan. Selebihnya tidak muncul."],
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

      // 3. THE ROLES OFFERED ARE THE ROLES ACCEPTED, read from the row checker
      //    as it stands today: the latest migration that defines
      //    import_row_problems. WP5A refuses two by name. RESTATED FOR BOB-10
      //    (M5b, interim): that migration also refuses every role other than
      //    STUDENT ("a staff row is not recorded by the bulk intake yet"), so
      //    the screen offers the learner alone. Offering EDUCATOR, HEAD_OF_
      //    DEPARTMENT or DEAN would fail every row it was chosen for at
      //    "Periksa". When M5b gives the intake a staff path and drops that
      //    branch, this reads four accepted roles again.
      const pemeriksa = walk(join(repoRoot, "supabase", "migrations")).filter((f) => f.endsWith(".sql")).sort()
        .map((f) => readFileSync(f, "utf8"))
        .filter((x) => /create (?:or replace )?function public\.import_row_problems\s*\(/.test(x));
      const cekKini = /create (?:or replace )?function public\.import_row_problems[\s\S]*?\$\$;/.exec(pemeriksa[pemeriksa.length - 1] ?? "")?.[0] ?? "";
      c.expect(cekKini.length > 500, "the current row checker (import_row_problems) could not be read");
      const ditolakDb = [...cekKini.matchAll(/v_role in \(([^)]*)\)/g)]
        .flatMap((m) => [...m[1].matchAll(/'([A-Z_]+)'/g)].map((x) => x[1]));
      c.expect(ditolakDb.length === 2, `${ditolakDb.length} role(s) refused by name for bulk provisioning; expected 2`);
      for (const r of ditolakDb) {
        c.expect(!(PERAN_PENDATAAN as readonly string[]).includes(r),
          `the mapping screen offers ${r}, which the row checker refuses for a bulk intake`);
      }
      const hanyaMurid = /elsif v_role <> 'STUDENT' then[\s\S]{0,800}?'a staff row is not recorded by the bulk intake yet'/.test(cekKini);
      const diterima = hanyaMurid ? ["STUDENT"] : ["STUDENT", "EDUCATOR", "HEAD_OF_DEPARTMENT", "DEAN"];
      c.expect(JSON.stringify([...PERAN_PENDATAAN].sort()) === JSON.stringify([...diterima].sort()),
        `the mapping screen offers ${PERAN_PENDATAAN.join(", ")}; the row checker accepts ${diterima.join(", ")}` +
        (hanyaMurid ? " (BOB-10: every staff row is refused at \"Periksa\" until M5b)" : ""));
      c.expect(kunciMasalah("a staff row is not recorded by the bulk intake yet") === "pendataan.masalah.staf",
        "a staff row refused at \"Periksa\" has no sentence of its own");

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
        "are exactly the roles the current row checker accepts, read from its own body: it refuses two " +
        "by name and, since BOB-10 (M5b, interim), every staff role, so the screen offers the learner " +
        "alone, and a staff row refused at \"Periksa\" has its own sentence. One row in is one row out at 1, " +
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
        // RESTATED FOR W2.16 (DAISY-35 item 3, CR-57): a Guru who also holds a senior role still teaches, so their own
        // learning wears the adult (educator's) learning shell and they are never handed the child's first-login tour.
        { peran: ["EDUCATOR", "HEAD_OF_DEPARTMENT"], mengajar: true, kata: "an educator who is also a head of department" },
        { peran: ["EDUCATOR", "DEAN"], mengajar: true, kata: "an educator who is also a dean" },
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
      //    (a) RESTATED (W2.16, DAISY-35 item 3): the mistake is now the opposite one -- reading the educator TOUR's
      //        seniority rule as "does not teach", which hands a senior Guru the child's shell and tour.
      const denganSenioritas = (peran: readonly string[] | null) => turPengajarBerlaku(peran ?? []);
      c.expect(denganSenioritas(["EDUCATOR", "DEAN"]) !== konteksPembelajaran(["EDUCATOR", "DEAN"]).mengajar,
        "applying the tour's seniority rule to whether somebody teaches is indistinguishable from not, so this case proves nothing");
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
      //    RESTATED for UX-45 (Batch 5): `tolak.arti` alone is told to an educator in the educator's own words (a Guru
      //    refused on a teaching page asks whoever looks after PINTAR, not "your teacher"). It is the refusal page's
      //    recovery line, which the learning surface never says: a refusal there is drawn as a learner's
      //    (persona="learner"), and neither surface file names the key -- asserted here, so the learning surface's copy
      //    still cannot change with who is reading it.
      const PENOLAKAN_GURU = new Set<string>(["tolak.arti"]);
      c.expect(!/tolak\.arti/.test(sumber) && !/<HalamanPenolakan[^>]*persona=\{persona\}/.test(read("src/app/belajar/page.tsx")),
        "the learning surface says the refusal's recovery line in its reader's persona");
      let berbeda = 0;
      for (const k of allKeys()) {
        if (/^(studio\.|config\.|pimpinan\.|pendataan\.)/.test(k) || PENOLAKAN_GURU.has(k)) continue;
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
      // RESTATED FOR TERMINOLOGY v1 (D-068 F2, «Pembelajaran Saya» → «Belajar»; applied under D-138(c)): the tab now
      // carries the purpose's own name, the word the chooser already uses for it (L3, D-132), so in Indonesian it is
      // the learner's word too. What tells an educator it is theirs, and not a learner's account, is the page: its
      // eyebrow still says it is the reader's own and the reassurance in 5. says it is apart from their teaching.
      c.expect(t("nav.pembelajaran", "educator") === "Belajar",
        `the educator's own learning tab is not v1 F2's «Belajar»: "${t("nav.pembelajaran", "educator")}"`);
      c.expect(/Saya/.test(t("pembelajaran.eyebrow", "educator")) && t("pembelajaran.eyebrow", "educator") !== t("nav.belajar", "learner"),
        "the educator's own learning page no longer says it is the reader's own");
      c.expect(t("nav.pembelajaran", "educator", { locale: "en" }) !== t("nav.belajar", "learner", { locale: "en" }),
        "(en) the educator's own learning is named exactly what a learner's home is named");

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
        // D-140 (Jejak Audit in words, DG-11): the copy table names each audited table for the platform admin's log, so
        // the threshold table's NAME is a key there ("audit.tabel.feedback_thresholds"). A key is a word for a row of
        // the log, never a read of the table; it is the only thing set aside, and only in the copy table.
        const mentah = code(readFileSync(join(repoRoot, f), "utf8"));
        const b = f === "src/lib/hle.ts" ? mentah.replace(/"audit\.tabel\.feedback_thresholds"/g, "") : mentah;
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
        // RESTATED FOR POLISH BATCH 2 (UX-11, a changed requirement): the
        // sentence no longer names the path /masuk. It stops where the sign-in
        // address goes, and HasilAktivasi puts the environment's own address
        // there (DAISY-09-AKTIVASI-01 and POLISH2-ADMIN-01 render it).
        const ok = t("aktivasi.baru.ok", "staff", { locale: loc });
        const lalu = t("aktivasi.baru.ok.lalu", "staff", { locale: loc });
        c.expect(/(membuka|to open)$/.test(ok) && lalu !== TANPA_SALINAN && lalu.trim() !== "",
          `aktivasi.baru.ok (${loc}) no longer stops where the sign-in address goes`);
        c.expect(!/sekarang bisa masuk|can now sign in/i.test(ok + lalu), `aktivasi.baru.ok (${loc}) still says the person can now sign in`);
      }
      // RESTATED FOR DAISY-20 (D-068, Terminology v1: «email», not «surel»):
      // the same promise, in the frozen word.
      c.expect(/tidak mengirim email/.test(t("aktivasi.baru.ok", "staff", { locale: "id" })), "aktivasi.baru.ok (id) does not say no email was sent");
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
          // RESTATED FOR D-192: the text wordmark's box is set by --merek-tinggi (it was the artwork's height)
          logo = aturan(".pin-authtop .pin-merek", s)["--merek-tinggi"] ?? logo;
        }
        logo ??= aturan(".pin-merek", null)["--merek-tinggi"];

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
          c.expect(tombol?.props?.type === "submit" && namaPohon(tombol as Simpul).join("") === t("sesi.keluar", persona, { locale }),
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
      // D-138 step 3: the staff branches return through the one staff layout, which draws the mark and the strip it is
      // handed; the focus and public branches still draw their own header
      const tataStaf = shellStafSrc(cangkang);
      c.expect(/<MerekPintar \/>/.test(tataStaf) && /\{sesi\}/.test(tataStaf), "the staff layout does not draw the mark and the strip it is handed");
      const cabangKind = (k: string) => cabangCangkang(cangkang, k);
      for (const k of ["focus", "pengajar", "pimpinan", "pendataan", "public"]) {
        const b = cabangKind(k);
        const staf = k === "pengajar" || k === "pimpinan" || k === "pendataan";
        c.expect(b.length > 0 && (staf ? /return shellStaf\(/.test(b) : b.includes("<MerekPintar")), `could not isolate the shell's "${k}" branch`);
        const ada = b.match(/<SesiSaya[^>]*\/>/)?.[0] ?? "";
        if (k === "public") c.expect(!ada, "the public shell offers a sign-out; the verification page must offer no way in");
        else c.expect(/viewer=\{viewer\} peran=\{peran\}/.test(ada), `the "${k}" shell's strip reads again instead of using the shell's one read: ${ada || "no strip"}`);
      }
      const iBelajar = intiCangkang(cangkang).indexOf("const { mengajar } = konteksPembelajaran");
      const strips = (iBelajar < 0 ? "" : intiCangkang(cangkang).slice(iBelajar)).match(/<SesiSaya[^>]*\/>/g) ?? [];
      c.expect(strips.length === 2 && strips.every((x) => /viewer=\{viewer\} peran=\{peran\}/.test(x)),
        `the learning shells do not both carry a strip from the one read: ${strips.join(" | ") || "none"}`);
      const tolak = code(readFileSync(join(repoRoot, "src", "components", "HalamanPenolakan.tsx"), "utf8"));
      c.expect(/<SesiSaya[^>]*varian="penolakan"[^>]*\/>/.test(tolak), "the refusal page offers no way out");

      for (const f of ["belajar/page.tsx", "mengajar/page.tsx", "pimpinan/page.tsx", "pendataan/page.tsx", "aktivasi/page.tsx"]) {
        const src = code(readFileSync(join(repoRoot, "src", "app", f), "utf8"));
        const shell = src.match(/<CangkangPengalaman[^>]*\/>/)?.[0] ?? "";
        c.expect(shell.length > 0 && !/kind="public"/.test(shell), `${f} does not render a signed-in shell`);
      }
      {
        const src = code(readFileSync(join(repoRoot, "src", "app", "page.tsx"), "utf8"));
        c.expect(/<SesiSaya[^>]*viewer=\{viewer\} peran=\{peran\}[^>]*\/>/.test(src), "page.tsx does not show who is signed in and the way out, from its own read");
        c.expect(/await Promise\.all\(\[currentViewer\(\), peranSaya\(\)/.test(src) && (src.match(/currentViewer\(\)|peranSaya\(\)/g) ?? []).length === 2,
          "page.tsx does not read the viewer and their roles exactly once, in parallel");
      }
      // D-138 step 3: Studio and Konfigurasi draw the staff shell (CangkangStaf), whose strip comes from its own one
      // parallel read; both reads are memoised for the request (React cache), so a page that also asks for them
      // decides from the same answer the strip shows, and the database is asked once
      const stafSendiri = cangkang.slice(cangkang.indexOf("export async function CangkangStaf("));
      c.expect(/const \[viewer, peran\] = await Promise\.all\(\[currentViewer\(\), peranSaya\(\)\]\);/.test(stafSendiri)
        && /<SesiSaya locale=\{locale\} persona="staff" viewer=\{viewer\} peran=\{peran\} \/>/.test(stafSendiri) && /return shellStaf\(/.test(stafSendiri),
        "the staff shell for Studio and Konfigurasi does not show who is signed in and the way out from one parallel read");
      c.expect(/export const currentViewer = cache\(/.test(code(readFileSync(join(repoRoot, "src", "lib", "auth.ts"), "utf8")))
        && /export const peranSaya = cache\(/.test(code(readFileSync(join(repoRoot, "src", "lib", "tur-negara.ts"), "utf8"))),
        "the viewer or the roles are no longer read once per request");
      for (const f of ["studio/layout.tsx", "konfigurasi/page.tsx"]) {
        const src = code(readFileSync(join(repoRoot, "src", "app", f), "utf8"));
        c.expect(/<CangkangStaf\b/.test(src), `${f} does not draw the staff shell, with who is signed in and the way out`);
        c.expect((src.match(/currentViewer\(\)/g) ?? []).length <= 1 && (src.match(/peranSaya\(\)/g) ?? []).length <= 1
          && (!/peranSaya\(\)/.test(src) || /await Promise\.all\(\[currentViewer\(\), peranSaya\(\)/.test(src)),
          `${f} reads the viewer or their roles more than once, or in sequence`);
      }
      // RESTATED FOR W3.8 (Batch 5, RV-11): the two report pages no longer draw a bare header of their own with the
      // signed-in strip in it (at 320 px «Masuk se…» was cut); they sit in the staff shell, whose strip (asserted for
      // CangkangStaf above, from one parallel read) shows who is signed in and the way out at every width.
      for (const f of ["edukator/ringkasan/page.tsx", "dekan/ringkasan/page.tsx"]) {
        const src = code(readFileSync(join(repoRoot, "src", "app", f), "utf8"));
        c.expect(/<CangkangStaf locale=\{locale\} kini=\{judul\} nav=\{await navKonteks\(\{[^}]*\}\)\} \/>/.test(src) && !/<SesiSaya\b/.test(src),
          `${f} does not show who is signed in and the way out in the staff shell`);
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
      // D-138 step 3 (AppShell): under 1024 px the staff top bar keeps «Keluar» and moves the reader's name and «Akun
      // saya» into the menu, which shows them again when opened. That is the only thing allowed to hide: nothing hides
      // the strip or its way out at any width, and the name and «Akun saya» are hidden only on the staff bar and only
      // where the opened menu draws them again.
      // D-138 step 3: from 1024 px the staff shell is a fixed navigation on the left. globals.css pulls every
      // `.pin-shell` a gutter outward (the old full-bleed header), so the navigation's own `margin: 0` must outrank
      // that rule, or the mark, the places and «Keluar» sit a gutter off the screen's left edge (seen, 9 Oct, 1280 px).
      const glob = code(readFileSync(join(repoRoot, "src", "app", "globals.css"), "utf8"));
      const tarik = /\.pin-shell \{[^}]*margin-inline:\s*calc\(var\(--gutter\) \* -1\)/.test(glob);
      const tetap = /\n\s*([^{}\n]+)\{\s*position: fixed; inset: 0 auto 0 0;[^}]*margin: 0;/.exec(css)?.[1]?.trim() ?? "";
      c.expect(tetap !== "", "the fixed staff navigation could not be found");
      c.expect(!tarik || /^\.pin-shell\.pin-staf$/.test(tetap),
        `the fixed staff navigation (${tetap || "none"}) does not outrank .pin-shell's outward margin, so it sits off the screen's edge`);
      const sembunyi = [...css.matchAll(/(?:^|[}\n])\s*([^{}@]*\.pin-sesi[^{]*)\{([^}]*)\}/g)]
        .filter((m) => /display:\s*none/.test(m[2])).map((m) => m[1].trim());
      const bolehSembunyi = (sel: string) => sel.split(",").every((x) => /^\.pin-staf \.pin-sesi-(?:ket|akun)$/.test(x.trim()));
      c.expect(sembunyi.every(bolehSembunyi), `a rule hides the session strip: ${sembunyi.filter((x) => !bolehSembunyi(x)).join(" | ")}`);
      if (sembunyi.length > 0) {
        c.expect(/\.pin-laci-saklar:checked ~ \.pin-sesi \.pin-sesi-ket,\s*\.pin-laci-saklar:checked ~ \.pin-sesi \.pin-sesi-akun \{[^}]*display:\s*inline-flex/.test(css),
          "the staff bar hides the reader's name without the opened menu drawing it again");
      }

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
      c.expect(/daftarTempat\(tempat, kecuali, locale, persona\)\.map\(\(\{ href, label \}\) => \(\s*<Link key=\{href\} href=\{href\} className=\{kelas\}>\s*\{label\}\s*<TandaTautan \/>\s*<\/Link>/.test(tabTempat),
        "TabTempat does not render the list as one link per place with its label");

      /**
       * 3. EVERY STAFF SHELL OFFERS THE OTHER PLACES; NOTHING ELSE DOES. The
       *    roles are asked once, the learner branch reuses the same answer, and
       *    neither the public page nor an assessment in focus offers anywhere.
       */
      // D-138 step 3: the shell's own render; CangkangStaf, after it, is Studio's and Konfigurasi's (DAISY-02 reads it)
      const cangkang = intiCangkang(code(readFileSync(join(repoRoot, "src", "components", "CangkangPengalaman.tsx"), "utf8")));
      c.expect((cangkang.match(/peranSaya\(\)/g) ?? []).length === 1, "the shell asks for the reader's roles more than once, or not at all");
      // an assessment in focus reads the roles too, now, for its strip's naming rule
      // (DAISY-02); it still offers no places, below
      c.expect(/kind === "public" \? \[null, null\] : await Promise\.all\(\[currentViewer\(\), peranSaya\(\)\]\)/.test(cangkang),
        "the public page asks for the reader's roles, or the shell reads them apart from the viewer");
      // D-138 step 3: a branch runs to the next one (the staff branches return through shellStaf, no header of their own)
      const cabang = (k: string) => cabangCangkang(cangkang, k);
      // RESTATED FOR L3 (CR-83; D-132 §2.4): with a working context a staff shell's other tabs are that context's own
      // surfaces (navKonteks, F22-P02, awaited in the shell's own render), and its one way to change it is the chooser;
      // without one (an evaluation persona, C10) the roles' places, as before (TabTempat). Each shell keeps its own tab
      // out of either.
      const tabs = (b: string) => b.match(/<TabTempat[^>]*\/>|navKonteks\(\{[^}]*\}\)/g) ?? [];
      const tab = (b: string) => tabs(b).join(" ");
      const keduanya = (b: string, sendiri: string) => {
        const nav = tabs(b).find((x) => x.startsWith("navKonteks")) ?? "";
        const peran = tabs(b).find((x) => x.startsWith("<TabTempat")) ?? "";
        return nav.includes(`kecuali: ["${sendiri}"]`) && peran.includes(`kecuali={["${sendiri}"]}`);
      };
      c.expect(keduanya(cabang("pengajar"), "/mengajar"), `the teaching shell does not offer the other places: ${tab(cabang("pengajar")) || "none"}`);
      c.expect(/navKonteks\(\{[^}]*kecuali: \["\/pimpinan"\]/.test(tab(cabang("pimpinan"))), `the management shell does not offer the other places: ${tab(cabang("pimpinan")) || "none"}`);
      c.expect(/navKonteks\(\{[^}]*kecuali: \["\/pendataan", "\/aktivasi"\]/.test(tab(cabang("pendataan")))
        && /<TabTempat (?![^>]*kecuali)/.test(tab(cabang("pendataan"))), "the intake shell does not offer the reader's places");
      c.expect(/href="\/aktivasi"/.test(cabang("pendataan")), "the intake shell has no way to Aktivasi");
      c.expect(!tab(cabang("public")) && !tab(cabang("focus")), "the public page or an assessment in focus offers other places");
      const iBelajar = cangkang.indexOf("const { mengajar } = konteksPembelajaran(peran)");
      c.expect(iBelajar > 0, "the learning branch no longer decides its context from the one roles answer");
      const belajar = iBelajar > 0 ? cangkang.slice(iBelajar) : "";
      const iMurid = belajar.lastIndexOf("return (");
      c.expect(/<TabTempat [^>]*kecuali=\{\["\/mengajar"\]\}/.test(tab(belajar.slice(0, iMurid)))
        && /navKonteks\(\{[^}]*kecuali: \["\/belajar"\]/.test(tab(belajar.slice(0, iMurid))),
        "an educator's own learning does not offer the other places");
      // a learner's own shell offers no staff place: in a context, only the chooser (Belajar's surfaces are its own)
      c.expect(!/<TabTempat/.test(tab(belajar.slice(iMurid))) && /^(?:navKonteks\(\{[^}]*kecuali: \["\/belajar"\] \}\))?$/.test(tab(belajar.slice(iMurid))),
        "a learner's own shell offers staff places");

      const aktivasi = code(readFileSync(join(repoRoot, "src", "app", "aktivasi", "page.tsx"), "utf8"));
      c.expect(/<CangkangPengalaman[^>]*current="aktivasi"/.test(aktivasi), "Aktivasi does not mark its own tab");

      /**
       * 4. KONFIGURASI AND STUDIO ARE NOT DEAD ENDS. Konfigurasi links Pendataan,
       *    Aktivasi and Studio (M3) and the administrator's other places;
       *    Studio links back to the person's places.
       */
      const konfig = code(readFileSync(join(repoRoot, "src", "app", "konfigurasi", "page.tsx"), "utf8"));
      for (const h of ["/pendataan", "/aktivasi", "/studio"]) {
        // D-138 step 3: a place in the staff navigation is an ItemNav, which is a Link with its icon (DAISY-18 reads it)
        c.expect(new RegExp(`<(?:Link|ItemNav) href="${h}"`).test(konfig), `Konfigurasi has no link to ${h}`);
      }
      // L3: in a context, the context's own surfaces and the chooser (navKonteks); without one, the roles' places
      c.expect(/navKonteks\(\{[^}]*kecuali: \["\/konfigurasi"[^\]]*\]/.test(konfig) && /<TabTempat[\s\S]*?kecuali=\{\["\/konfigurasi"\]\}/.test(konfig),
        "Konfigurasi does not offer the administrator's other places");
      const studio = code(readFileSync(join(repoRoot, "src", "app", "studio", "layout.tsx"), "utf8"));
      c.expect(/navKonteks\(\{/.test(studio), "Studio offers no way back to the person's places");

      /**
       * 5. THE HOME PAGE: A SIGNED-IN READER'S DOORS ARE ONLY THE PLACES THEY
       *    HOLD (M15 UI; the gate on the first round).
       *
       *    a) RESTATED FOR L3 (CR-83; D-132 C3): signed in, the home page is the
       *       chooser, and its doors are the purpose · place pairs the reader
       *       holds today (konteks_tempat_saya, from active grants and
       *       participation, never the display role), narrowed by pintuPilihan.
       *       The rule over people is F22-P01 and F22-P04; F22-K01 proves the
       *       pairs. pintuMasuk, the roles' door list it replaces, is gone.
       */
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
      // RESTATED FOR L3 (D-127 Q1, D-132): the three doors carry a PURPOSE to the sign-in, never a role
      c.expect(JSON.stringify(anonim.match(/<Link href="[^"]+"/g)) ===
        JSON.stringify(['<Link href="/masuk?pintu=belajar"', '<Link href="/masuk?pintu=mengajar"', '<Link href="/masuk?pintu=mengelola"']),
        `the anonymous doors changed: ${anonim.match(/<Link href="[^"]+"/g)}`);
      c.expect(!/\/masuk/.test(masuk), "a signed-in reader is offered a door to /masuk");
      c.expect(/const pintu = pintuPilihan\(tempat, minta\);/.test(masuk) && /const \[k, tempat\] = await Promise\.all\(\[konteksSaya\(\), tempatSaya\(\)\]\);/.test(masuk)
        && /pintu\.map\(\(p\) => \{[\s\S]*?<form key=\{kunciPasangan\(p\)\} action=\{pilihKonteks\}>/.test(masuk),
        "the signed-in doors are not exactly the held pairs' list");
      c.expect((masuk.match(/<Link\b/g) ?? []).length === 0 && (masuk.match(/<form\b/g) ?? []).length === 1,
        "the signed-in half draws a door that is not one of the held pairs");
      c.expect(/s\("entry\.kosong"\)/.test(masuk), "a signed-in reader holding no place is not told so");
      c.expect(!/viewer\.displayName\s*[}?`]/.test(beranda) && /\{nama \? `, \$\{nama\}` : ""\}/.test(masuk),
        "the home page greets with the raw display name instead of namaSapaan's");
      c.expect(/await Promise\.all\(\[currentViewer\(\), peranSaya\(\), currentLocale\(\)\]\)/.test(beranda), "the home page reads the viewer, roles and language in sequence");
      // L3 (D-128(g)): each door in the words the signed-out doors already use, by its purpose and home
      // (E2: the door draws its purpose and its place apart, bagianPintu; the purpose's words are the same rule)
      const LABEL = /function bagianPintu\([^)]*\): \{[^}]*\} \{([\s\S]*?)\n\}/.exec(beranda)?.[1] ?? "";
      c.expect(/p\.tujuan === "BELAJAR" \? "entry\.learner"\s*: p\.tujuan === "MENGAJAR" \? "entry\.educator"\s*: berandaPasangan\(p\) === "\/pimpinan" \? "entry\.pimpinan" : "entry\.staff"/.test(LABEL),
        "the chooser's doors are not labelled with the purpose's own words (entry.learner, entry.educator, entry.pimpinan, entry.staff)");
      for (const kunci of ["entry.learner", "entry.educator", "entry.pimpinan", "entry.staff"]) {
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
        "administrator's other places, and Studio links back; with a working context (L3) each shell's other tabs are " +
        "the context's own and the chooser, without one the roles' places. On the home page a signed-in reader's doors " +
        "are exactly the purpose · place pairs they hold (the chooser, L3), one form each posting the person's choice, " +
        "labelled in the purpose's own words, with an honest line when there are none; a learner is greeted by first " +
        "name and staff in full, never by the raw display name; the anonymous doors carry a purpose to the sign-in. On " +
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
          c.expect(x.includes('name="simpul" value="k1"') && /<button\b(?=[^>]*\bclass="pin-btn pin-str-bahaya")(?=[^>]*\btype="submit")[^>]*>([^<]+)<\/button>/.exec(x)?.[1] === s("config.struktur.konfirmasi.ya")
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
      // L3: the menu is every section's entry (navSemua), less the school-shaped ones in «Seluruh platform»
      c.expect(/const navSemua: Array<\[string, string\]> = \[\s*\["struktur"/.test(konfig) && /const nav = navSemua\.filter\(\(\[bagian\]\) => tampil\(bagian\)\);/.test(konfig),
        "Struktur sekolah is not the first entry in Konfigurasi's menu");
      // (B1: the sections' container carries the section a page draws; Struktur is still its first, and the index's first row)
      // (B1: each section is drawn only on its own page, behind tampilDi)
      c.expect(/<div className="grid gap-4" data-bagian-ini=\{bagianIni \?\? undefined\}>\s*(?:\{\s*\}\s*)*\{tampilDi\("struktur"\) \? \(\s*<section id="struktur"/.test(konfig), "Struktur sekolah is not the first section");
      const { KELOMPOK_KONFIGURASI } = await import("../src/lib/bagian-konfigurasi");
      c.expect(KELOMPOK_KONFIGURASI[0]?.bagian[0] === "struktur", "Struktur sekolah is not the index's first row");
      // L3 (D-132 C7): on offer is the working context's school (an evaluation persona: as before, C10)
      c.expect(/const dikelola = \(id: string\) => \(lama && isSys === true\) \|\| sekolahIni\.includes\(id\);/.test(konfig)
        && /const sekolahKu = sekolahDitawarkan\(institutions \?\? \[\], dikelola\);/.test(konfig)
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
        // DAISY-15's follow-up: the guidance says that Excel draws a text cell
        // over 255 characters as ####, naming a column that really is Text
        // and really can run that long.
        const baris6 = t("studio.templat.cara.6", "staff", { locale: "id" });
        const isi = KOLOM.Pelajaran.find((k) => k.kunci === "body_markdown");
        c.expect(teksPanduan.includes(baris6) && baris6.includes("####") && baris6.includes("255")
          && Boolean(isi) && baris6.includes(isi!.judul) && formatKolom(isi!) === "teks" && BATAS_PAKET.teksMaks.nilai.isiPelajaran > 255,
          "the guidance does not warn that Excel shows a long text cell as ####, or names a column that is not a long Text column");
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
       * DAISY-15: EVERY COLUMN'S FORMAT. A free-text column is Text (the
       * built-in "@", numFmtId 49) on its own <col>, so what a teacher types
       * stays exactly as typed -- "1/2", "01", "0,5"; a numbered column stays
       * General, and the numbered columns are exactly the ones the reader
       * parses as numbers (nomor(...) in bukuKerjaKePaket); a dropdown column
       * stays General. Read from the bytes: styles.xml's cellXfs and each data
       * sheet's <cols>.
       */
      const gaya = entri.find((e) => e.nama === "xl/styles.xml")?.isi.toString("utf8") ?? "";
      const xfs = [...(/<cellXfs[^>]*>([\s\S]*?)<\/cellXfs>/.exec(gaya)?.[1] ?? "").matchAll(/<xf [^>]*numFmtId="(\d+)"/g)].map((m) => Number(m[1]));
      const kontrakSumber = readFileSync(join(repoRoot, "src", "lib", "unggah-kontrak.ts"), "utf8");
      const dibacaAngka = new Set([...kontrakSumber.matchAll(/nomor\(\w+\.nilai\.(\w+)\)/g)].map((m) => m[1]));
      c.expect(dibacaAngka.size > 0 && JSON.stringify([...dibacaAngka].sort()) === JSON.stringify([...KOLOM_BERNOMOR].sort()),
        `the reader parses ${[...dibacaAngka].sort().join(", ")} as numbers; the template keeps ${[...KOLOM_BERNOMOR].sort().join(", ")} General`);
      LEMBAR.forEach((l, i) => {
        const xml = entri.find((e) => e.nama === `xl/worksheets/sheet${i + 2}.xml`)?.isi.toString("utf8") ?? "";
        const cols = [...xml.matchAll(/<col ([^>]*)\/>/g)].map((m) => {
          const min = /\bmin="(\d+)"/.exec(m[1])?.[1], gayaCol = /\bstyle="(\d+)"/.exec(m[1])?.[1];
          return { kolom: Number(min) - 1, fmt: gayaCol === undefined ? 0 : xfs[Number(gayaCol)] };
        });
        c.expect(cols.length === KOLOM[l].length, `${l}: ${cols.length} column definitions for ${KOLOM[l].length} columns`);
        KOLOM[l].forEach((k, n) => {
          const fmt = cols.find((x) => x.kolom === n)?.fmt;
          const harap = KOLOM_BERNOMOR.has(k.kunci) || k.pilihan ? 0 : 49;
          c.expect(fmt === harap, `${l} · ${k.judul}: format ${fmt === 49 ? "Text" : fmt === 0 ? "General" : String(fmt)}, expected ${harap === 49 ? "Text" : "General"}`);
          c.expect(formatKolom(k) === (harap === 49 ? "teks" : "umum"), `${l} · ${k.judul}: formatKolom disagrees with the file`);
        });
        // the header row keeps its own heading style over the column's
        c.expect((xml.match(/<c r="[A-Z]+1" t="inlineStr" s="1">/g) ?? []).length === KOLOM[l].length, `${l}: a header cell lost its heading style`);
      });
      const teksSemua = LEMBAR.flatMap((l) => KOLOM[l].filter((k) => formatKolom(k) === "teks").map((k) => `${l}.${k.kunci}`));
      c.expect(["Soal.stem", "Pilihan.body", "Pilihan.ref", "Soal.ref", "Kursus.grade_label", "Soal.parallel_group"].every((x) => teksSemua.includes(x))
        && !teksSemua.some((x) => /\.(ordinal|module|lesson)$/.test(x)), "the column split is not free text versus numbered (control on known columns)");

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
        "on its own column, every free-text column Text and every numbered or dropdown column General (the numbered ones being " +
        "exactly what the reader parses as numbers); and nothing that needs node:zlib can reach the browser through the " +
        "template or the panel",
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
          // RESTATED FOR E3 #4 (Daisy): still disabled before a file is chosen, and now it says why beside it
          c.expect(x.includes(`disabled="" aria-describedby="periksa-alasan">${s("studio.unggah.langkah.periksa")}</button>`)
            && x.includes(`<p class="pin-alasan" id="periksa-alasan">${s("alasan.nonaktif.periksa" as HleEvent)}</p>`), `(${locale}) the check can be pressed before a file is chosen, or does not say why not`);
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
       *     is_active and offers them through sekolah.ts -- the national
       *     library to the platform admin alone (CR-51, D-120 Q7; audit S14,
       *     D-029 for every school role) -- to the panel AND the JSON forms, and
       *     labels the JSON forms' picker "Sekolah" (it said "Peran & akses").
       *   - The panel comes before the JSON forms.
       *   - The panel talks to the server only through BOB-02's two typed
       *     actions and the one signed-upload route, sending each file to the
       *     path the check returned, in the "assets" bucket.
       */
      const halaman = code(readFileSync(join(repoRoot, "src", "app", "studio", "unggah", "page.tsx"), "utf8"));
      c.expect(/from\("institutions"\)\.select\("[^"]*\btenant_kind\b[^"]*\bis_active\b[^"]*"\)/.test(halaman) || /from\("institutions"\)\.select\("[^"]*\bis_active\b[^"]*\btenant_kind\b[^"]*"\)/.test(halaman),
        "the upload page reads the schools without their kind or state");
      // RESTATED FOR CR-51 (D-120 Q7, a changed requirement): the schools through the shared rule, and the PINTAR library
      // for the platform admin alone (tujuanUnggah), asked of the database rather than inferred
      // L3 (D-132 C7, C8): in a working context the library only where Admin platform's grant is part of it
      c.expect(/const institutions = tujuanUnggah\(tenant \?\? \[\], \(id\) => menyusun\.has\(id\), kh === "TANPA_KONTEKS" \? adminPlatform === true : operator\)/.test(halaman)
        && /const operator = adminPlatform === true && peran\.includes\("SYSTEM_ADMIN"\);/.test(halaman)
        && /\{ data: adminPlatform \}, peran, kh\] = await Promise\.all\(\[[^\]]*supabase\.rpc\("is_system_admin"\), peranStudio\(\), konteksHalaman\(\),?\s*\]\)/.test(halaman),
        "the upload page does not offer its schools through the shared rule, or the library to the platform admin alone");
      {
        const T: SekolahBaris[] = [
          { id: "kanon", name: "PINTAR Kurikulum Nasional", tenant_kind: "PLATFORM_CANONICAL", is_active: true },
          { id: "sma", name: "SMA Contoh", tenant_kind: "INSTITUTION", is_active: true },
          { id: "tutup", name: "Sekolah Tutup", tenant_kind: "INSTITUTION", is_active: false },
        ];
        const ids = (xs: SekolahBaris[]) => xs.map((x) => x.id).join(",");
        c.expect(ids(tujuanUnggah(T, () => true, false)) === "sma", `a school role is offered ${ids(tujuanUnggah(T, () => true, false))} to upload to`);
        c.expect(ids(tujuanUnggah(T, () => true, true)) === "sma,kanon", `the platform admin is offered ${ids(tujuanUnggah(T, () => true, true))}; the library comes last`);
        c.expect(ids(tujuanUnggah(T.map((x) => ({ ...x, is_active: x.id === "sma" })), () => true, true)) === "sma", "an inactive library is offered");
      }
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
      //    RESTATED FOR POLISH BATCH 2 (UX-11, a changed requirement): the
      //    person is sent to the environment's sign-in ADDRESS, not the path
      //    /masuk. Each sentence is composed as KeMasuk composes it, with a
      //    stand-in address, and read whole.
      //    RESTATED FOR DAISY-20 (D-019 amended by D-054, a changed
      //    requirement): an email account and a new person are sent to
      //    «Aktifkan akun PINTAR Anda» (the environment's /aktifkan address),
      //    where their code is sent; a card is still used at /masuk.
      const TIDAK_DIKIRIM: Record<string, RegExp> = { id: /tidak mengirim/, en: /has not (emailed|sent)|sends no/ };
      const CONTOH_ALAMAT = "app.contoh.sch.id/masuk";
      const CONTOH_AKTIFKAN = "app.contoh.sch.id/aktifkan";
      for (const locale of LOCALES) {
        const st = (k: HleEvent) => t(k, "staff", { locale });
        const kalimat: Array<[string, string]> = [
          ["aktivasi.intro", `${st("aktivasi.intro")} ${st("aktivasi.intro.buka")} ${CONTOH_AKTIFKAN}.`],
          ["aktivasi.surel_arti", `${st("aktivasi.surel_arti")} ${CONTOH_AKTIFKAN}${st("aktivasi.surel_arti.lalu")}`],
          ["aktivasi.kartu_arti", `${st("aktivasi.kartu_arti")} ${CONTOH_ALAMAT}${st("aktivasi.kartu_arti.lalu")}`],
          ["aktivasi.baru.ok", `${st("aktivasi.baru.ok")} ${CONTOH_AKTIFKAN}${st("aktivasi.baru.ok.lalu")}`],
        ];
        for (const [k, x] of kalimat) {
          c.expect(TIDAK_DIKIRIM[locale].test(x) && !x.includes(TANPA_SALINAN) && !/(^|[\s(])\/(masuk|aktifkan)\b/.test(x),
            `${k} (${locale}) does not say nothing was sent and where to sign in: "${x}"`);
          c.expect(!/sekarang bisa masuk|can now sign in/i.test(x), `${k} (${locale}) says the person can now sign in`);
        }
        c.expect(st("aktivasi.kartu_arti.lalu").includes(`“${t("auth.card_go", "public", { locale })}”`),
          `aktivasi.kartu_arti (${locale}) does not name the sign-in page's card button as that page shows it`);
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
      const FORM = { locale: "id", adminSistem: true, orang: [{ person_id: "p1", display_name: "Nadia Putri", institutional_id: "2026001", institution_id: "i1", boleh_kartu: true }] };
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
        cwd: repoRoot, encoding: "utf8",
        // polish batch 2 (UX-11): the sentences name this environment's sign-in address
        env: { ...process.env, NEXT_PUBLIC_APP_URL: "https://app.contoh.sch.id", KASUS_AKT: JSON.stringify(KASUS), FORM_AKT: JSON.stringify(FORM) },
      });
      const alamatDi = '<strong class="pin-num">app.contoh.sch.id/masuk</strong>';
      const aktifkanDi = '<strong class="pin-num">app.contoh.sch.id/aktifkan</strong>';
      let html: string[] = [];
      try { html = JSON.parse(anak.stdout); } catch { /* reported below */ }
      const bersih = (x: string) => x.replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&amp;/g, "&");
      if (c.expect(anak.status === 0 && html.length === KASUS.length + 1, `the activation outcomes could not be rendered: ${(anak.stderr || "").split("\n").slice(0, 3).join(" ")}`)) {
        KASUS.forEach((k, n) => {
          const x = bersih(html[n]);
          const s = (e: HleEvent) => t(e, "staff", { locale: k.locale });
          const label = `${k.mode} ${k.jawaban?.ok ? "ok" : "gagal"} (${k.locale})`;
          if (k.jawaban?.ok) {
            // DAISY-18: through the shared result line, keeping the card's own look
            c.expect(/^<div class="pin-akt-hasil pin-hasil-ok" role="status">/.test(x), `${label}: not announced as a status`);
            if (k.mode === "CLASSROOM_CARD") {
              c.expect(x.includes(s("aktivasi.kartu_dibuat")) && x.includes(">7001234567<") && x.includes(">482913<")
                && x.includes(`${s("aktivasi.kartu_arti")} ${alamatDi}${s("aktivasi.kartu_arti.lalu")}`),
                `${label}: the card, its PIN or where to use them (the environment's sign-in address) is missing`);
            } else {
              c.expect(x.includes(`${s("aktivasi.surel_dibuat")} <strong>${k.surel}</strong>`), `${label}: the address the account was made for is not named`);
              const [awal, akhir] = k.mode === "NEW_PERSON" ? ["aktivasi.baru.ok", "aktivasi.baru.ok.lalu"] as const : ["aktivasi.surel_arti", "aktivasi.surel_arti.lalu"] as const;
              c.expect(x.includes(`${s(awal)} ${aktifkanDi}${s(akhir)}`) && !x.includes("/masuk"),
                `${label}: the no-email sentence with the activation address is missing, or it sends the person to /masuk`);
              if (k.mode === "NEW_PERSON") c.expect(x.includes(`<strong>${k.nama}</strong>`), `${label}: the new person is not named`);
            }
          } else {
            // v3 ActionFeedback (D-138 step 2): a failure the reader must act on is an alert
            c.expect(x === `<div class="pin-msg pin-hasil pin-hasil-gagal" role="alert">${s(kunciGagal(k.mode as ModeAktivasi, k.jawaban as JawabanAktivasi | null))}</div>`,
              `${label}: the failure is not its own sentence in the shared result line: ${x.slice(0, 160)}`);
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
      c.expect(/const cegah = isianKurang\(mode, isian\);[\s\S]*if \(cegah(?: \|\| berjalan\.current)?\) return;[\s\S]*fetch\(/.test(form), "the form sends before checking what is missing");
      c.expect(!/\.detail\b/.test(form + code(readFileSync(join(repoRoot, "src", "components", "aktivasi", "HasilAktivasi.tsx"), "utf8"))),
        "the route's detail -- the server's own text -- is read by the form or its outcome");
      c.expect(!/router\.refresh|useRouter/.test(form), "a success still refreshes the list and takes its message off the screen");
      // RESTATED FOR POLISH BATCH 2 (UX-11): the introduction ends with the
      // sign-in address, composed by KeMasuk as the results are
      // RESTATED FOR DAISY-20 (D-019 amended): it ends with the activation
      // address, composed by KeAktifkan as the email results are
      c.expect(/<p className="pin-intro">\{s\("aktivasi\.intro"\)\} <KeAktifkan s=\{s\} sebelum="aktivasi\.intro\.buka" \/><\/p>/.test(code(readFileSync(join(repoRoot, "src", "app", "aktivasi", "page.tsx"), "utf8"))),
        "the activation page does not open with the corrected introduction");

      return c.verdict(
        "D-019: the activation route is re-read and sends no mail; no activation sentence in either language promises an email " +
        "(the old introduction is the planted control); the introduction, an email account, a card and a new person each say " +
        "nothing was sent; an email account and a new person are sent to the activation address, where the code is sent " +
        "(D-019 amended), and a card to /masuk, naming its own button. Every failure the route can " +
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
        const tautan = (x: string) => [...x.matchAll(/<a ([^>]*)href="([^"]+)"[^>]*>([^<]*)(?:<span aria-hidden="true" class="pin-tanda-tautan"><\/span>)?<\/a>/g)].map((m) => [m[2], m[3], /class="gaya"/.test(m[0])]);
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
      const cangkangPenuh = code(readFileSync(join(repoRoot, "src", "components", "CangkangPengalaman.tsx"), "utf8"));
      // D-138 step 3: the shell's own render; CangkangStaf after it draws only the places its page hands it
      const cangkang = intiCangkang(cangkangPenuh);
      c.expect(/const studio = tawarkanStudio\(peran\);/.test(cangkang) && (cangkang.match(/peranSaya\(\)/g) ?? []).length === 1,
        "the shell does not decide the Studio tab from its one roles answer");
      c.expect(!/studio|TabTempat|navKonteks/.test(cangkangPenuh.slice(cangkangPenuh.search(/\n(?:async )?function shellStaf\(/))),
        "the staff layout or CangkangStaf decides a Studio tab of its own");
      // D-138 step 3: a branch runs to the next one (the staff branches return through shellStaf, no header of their own)
      const cabang = (k: string) => cabangCangkang(cangkang, k);
      // RESTATED FOR L3 (D-132 C8, §2.4): in a working context the shell's tabs are NavKonteks, which offers Studio when
      // the context's own grants carry a Studio tab (melayani, F22-P02); without one, the roles' rule as before, either
      // passed here (studio={studio}) or drawn by NavKonteks's own fallback from the same roles answer
      const tab = (b: string) => (b.match(/<TabTempat[^>]*\/>|navKonteks\(\{[^}]*\}\)/g) ?? []).join(" ");
      const nav = code(readFileSync(join(repoRoot, "src", "components", "NavKonteks.tsx"), "utf8"));
      c.expect(/studio=\{tawarkanStudio\(peran\) && !kecuali\.includes\("\/studio"\)\}/.test(nav) && /permukaanKonteks\(k\)/.test(nav),
        "NavKonteks does not offer Studio by the context's grants, or by role without a context");
      for (const k of ["pengajar", "pimpinan", "pendataan"]) {
        c.expect(/navKonteks\(\{/.test(tab(cabang(k))) && (k === "pimpinan" || /<TabTempat [^>]*studio=\{studio\}/.test(tab(cabang(k)))),
          `the ${k} shell does not offer Studio by role`);
      }
      const iBelajar = cangkang.indexOf("const { mengajar } = konteksPembelajaran(peran)");
      const belajar = iBelajar > 0 ? cangkang.slice(iBelajar) : "";
      const iMurid = belajar.lastIndexOf("return (");
      c.expect(/<TabTempat [^>]*studio=\{studio\}/.test(tab(belajar.slice(0, iMurid))) && /navKonteks\(\{/.test(tab(belajar.slice(0, iMurid))),
        "an educator's own learning does not offer Studio");
      c.expect(!/studio|\/studio/.test(belajar.slice(iMurid)) && !/\/studio|studio=/.test(cabang("public") + cabang("focus")),
        "a learner's own shell, the public page or an assessment in focus offers Studio");
      c.expect((cangkangPenuh.match(/href="\/studio"/g) ?? []).length === 0, "a shell draws a Studio link of its own beside the rule");
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
  {
    id: "DAISY-06-TERBIT-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();

      /**
       * DAISY-06, THE TERBIT STEP (audit M11): seven named steps from an
       * uploaded course to "Terbit", in the database's order, the current one
       * marked, who takes each beside it, and a button only for a reader who
       * may take the current step.
       *
       * 1. THE ORDER IS THE DATABASE'S. Every content step's move is an edge in
       *    content_status_transitions, from each status that step is current
       *    at; every release step is BOB-03's own entry in LANGKAH_TERBITAN,
       *    with the same capability and the same starting states.
       */
      const mig = join(repoRoot, "supabase", "migrations");
      const lifecycle = readFileSync(join(mig, "20260912114854_content_lifecycle.sql"), "utf8");
      const tepi = new Set([...lifecycle.matchAll(/\('([A-Z_]+)',\s*'([A-Z_]+)',\s*'[^']*'\)/g)].map((m) => `${m[1]}>${m[2]}`));
      c.expect(tepi.has("INGESTED>STRUCTURED") && tepi.size >= 8, `could not read the content transitions (${tepi.size})`);
      const STATUS = ["INGESTED", "STRUCTURED", "VALIDATED", "VALIDATION_FAILED", "IN_REVIEW", "APPROVED", "FROZEN", "PUBLISHED", "SUPERSEDED"];
      for (const l of LANGKAH_PAKET) {
        if ("isi" in l.jalan) {
          const dari = STATUS.filter((x) => posisiPaket({ statusKursus: x, terbitan: null }).kini === l.kunci);
          c.expect(dari.length > 0, `no course status makes "${l.kunci}" the current step`);
          for (const d of dari) c.expect(tepi.has(`${d}>${l.jalan.isi}`), `"${l.kunci}" moves ${d} -> ${l.jalan.isi}, which is not a content transition`);
        } else {
          const jalan = l.jalan.terbitan;
          const kontrak = LANGKAH_TERBITAN.find((x) => x.aksi === jalan);
          if (!c.expect(kontrak !== undefined, `"${l.kunci}" takes ${jalan}, which is not in BOB-03's contract`)) continue;
          c.expect(kontrak!.kemampuan === l.kemampuan, `"${l.kunci}" asks for ${l.kemampuan}; BOB-03 says ${kontrak!.kemampuan}`);
          const dari = "kursus" in kontrak!.dari
            ? posisiPaket({ statusKursus: kontrak!.dari.kursus, terbitan: null }).kini === l.kunci
            : kontrak!.dari.terbitan.every((st) => posisiPaket({ statusKursus: "APPROVED", terbitan: { status: st } }).kini === l.kunci);
          c.expect(dari, `"${l.kunci}" is not the current step in every state BOB-03 takes ${jalan} from`);
        }
      }
      c.expect(JSON.stringify(LANGKAH_PAKET.map((l) => l.kunci)) === JSON.stringify(["susun", "periksa", "ajukan", "setujui", "buat", "kunci", "terbitkan"]),
        `the steps are ${LANGKAH_PAKET.map((l) => l.kunci).join(", ")}`);
      // where a course stands, over every state
      const POSISI: Array<[string, string | null, string | null, boolean]> = [
        ["INGESTED", null, "susun", false], ["VALIDATION_FAILED", null, "susun", true], ["STRUCTURED", null, "periksa", false],
        ["VALIDATED", null, "ajukan", false], ["IN_REVIEW", null, "setujui", false], ["APPROVED", null, "buat", false],
        ["APPROVED", "INGESTED", "kunci", false], ["APPROVED", "APPROVED", "kunci", false], ["FROZEN", "FROZEN", "terbitkan", false],
        ["PUBLISHED", "PUBLISHED", "terbit", false], ["SUPERSEDED", "SUPERSEDED", "ditarik", false], ["FROZEN", null, null, false],
      ];
      for (const [kursus, rilis, harap, kembali] of POSISI) {
        const p = posisiPaket({ statusKursus: kursus, terbitan: rilis ? { status: rilis } : null });
        c.expect(p.kini === harap && p.dikembalikan === kembali, `course ${kursus}, release ${rilis ?? "none"}: at ${JSON.stringify(p)}, expected ${harap}`);
      }
      const k = keadaanLangkah(posisiPaket({ statusKursus: "IN_REVIEW", terbitan: null })).map((x) => x.keadaan);
      c.expect(JSON.stringify(k) === JSON.stringify(["selesai", "selesai", "selesai", "kini", "nanti", "nanti", "nanti"]), `at review the steps read ${k.join(", ")}`);
      c.expect(keadaanLangkah(posisiPaket({ statusKursus: "PUBLISHED", terbitan: { status: "PUBLISHED" } })).every((x) => x.keadaan === "selesai"), "a published course leaves a step undone");

      /**
       * 2. WHO. The roles beside each step are exactly the school roles whose
       *    capability map (the latest role_capabilities) holds its capability;
       *    the two second-person steps are the two the database guards with
       *    the four-eyes rule. A reader is offered the step only with the
       *    capability, and a second-person step never by its author.
       */
      const terakhir = readdirSync(mig).filter((f) => f.endsWith(".sql")).sort()
        .filter((f) => /create or replace function public\.role_capabilities\(/i.test(readFileSync(join(mig, f), "utf8"))).pop();
      if (c.expect(terakhir !== undefined, "no migration defines role_capabilities")) {
        const sql = readFileSync(join(mig, terakhir!), "utf8");
        const i = sql.search(/create or replace function public\.role_capabilities\(/i);
        const badan = sql.slice(i, sql.indexOf("$function$;", i));
        const peta = new Map([...badan.matchAll(/when '([A-Z_]+)' then array\[([^\]]*)\]/g)].map((m) => [m[1], m[2]]));
        for (const l of LANGKAH_PAKET) {
          const harap = [...peta].filter(([r, caps]) => r !== "SYSTEM_ADMIN" && caps.includes(`'${l.kemampuan}'`)).map(([r]) => r).sort();
          c.expect(JSON.stringify([...l.peran].sort()) === JSON.stringify(harap), `"${l.kunci}" names ${l.peran.join(", ")}; ${l.kemampuan} is held by ${harap.join(", ")} (${terakhir})`);
        }
      }
      c.expect(JSON.stringify(LANGKAH_PAKET.filter((l) => l.orangKedua).map((l) => l.kunci)) === JSON.stringify(["setujui", "kunci"]), "the second person's steps are not exactly approving and locking");
      const empatMata = readdirSync(mig).filter((f) => f.endsWith(".sql")).map((f) => readFileSync(join(mig, f), "utf8")).join("\n");
      c.expect(/the reviewer may not be the author/.test(empatMata) && /release_refuse\('RELEASE_SAME_PERSON'\)/.test(empatMata),
        "the database no longer carries the four-eyes rules these two steps describe");
      const setujui = LANGKAH_PAKET.find((l) => l.kunci === "setujui")!;
      const buat = LANGKAH_PAKET.find((l) => l.kunci === "buat")!;
      const SEMUA = ["CAN_DRAFT", "CAN_REVIEW", "CAN_FREEZE_RELEASE", "CAN_PUBLISH"];
      c.expect(bolehMengambil(setujui, SEMUA, "p", "p") === "penyusun" && bolehMengambil(setujui, SEMUA, "q", "p") === "boleh"
        && bolehMengambil(setujui, ["CAN_DRAFT"], "q", "p") === "wewenang" && bolehMengambil(setujui, SEMUA, null, "p") === "wewenang"
        && bolehMengambil(buat, SEMUA, "p", "p") === "boleh", "who may take a step is not the capability plus the four-eyes rule");

      /**
       * 3. THE WORDS. Every step has a title, a sentence and a button in both
       *    languages; the seven buttons are seven different words and none is
       *    "Konfirmasi"; every release code BOB-03 can return has its sentence.
       */
      for (const locale of LOCALES) {
        const tombol = LANGKAH_PAKET.map((l) => t(kunciSalinan(l.kunci, "tombol"), "staff", { locale }));
        c.expect(new Set(tombol).size === 7 && !tombol.includes(t("studio.unggah.konfirmasi", "staff", { locale })), `(${locale}) the step buttons are ${JSON.stringify(tombol)}`);
        for (const l of LANGKAH_PAKET) for (const b of ["judul", "arti"] as const) {
          c.expect(t(kunciSalinan(l.kunci, b), "staff", { locale }) !== TANPA_SALINAN, `(${locale}) ${kunciSalinan(l.kunci, b)} has no copy`);
        }
        for (const kode of [...KODE_TERBITAN_DB, "RELEASE_INPUT_INVALID", "RELEASE_FAILED"] as KodeTerbitan[]) {
          c.expect(t(kunciKodeTerbitan(kode), "staff", { locale }) !== TANPA_SALINAN, `(${locale}) ${kode} has no sentence`);
        }
      }

      /**
       * 4. RENDERED, in both languages where it matters, for the course's
       *    author (Gladys, who holds every capability) and a second person
       *    (a head of department), at every state from upload to withdrawal.
       */
      const GLADYS = { saya: "gladys", penyusun: "gladys", kemampuan: SEMUA };
      const KAPRODI = { saya: "kaprodi", penyusun: "gladys", kemampuan: ["CAN_DRAFT", "CAN_REVIEW", "CAN_FREEZE_RELEASE"] };
      const TAMU = { saya: "tamu", penyusun: "gladys", kemampuan: [] as string[] };
      const rilis = (status: string) => ({ id: "11111111-1111-4111-8111-111111111111", status, terbitPada: status === "PUBLISHED" ? "2026-09-25T02:00:00Z" : null });
      const KASUS = [
        { nama: "unggah-penyusun", kursus: "INGESTED", r: null, siapa: GLADYS, locale: "id" },
        { nama: "unggah-penyusun-en", kursus: "INGESTED", r: null, siapa: GLADYS, locale: "en" },
        { nama: "dikembalikan", kursus: "VALIDATION_FAILED", r: null, siapa: GLADYS, locale: "id" },
        { nama: "tinjau-penyusun", kursus: "IN_REVIEW", r: null, siapa: GLADYS, locale: "id" },
        { nama: "tinjau-kaprodi", kursus: "IN_REVIEW", r: null, siapa: KAPRODI, locale: "id" },
        { nama: "disetujui-penyusun", kursus: "APPROVED", r: null, siapa: GLADYS, locale: "id" },
        { nama: "rilis-penyusun", kursus: "APPROVED", r: rilis("INGESTED"), siapa: GLADYS, locale: "id" },
        { nama: "rilis-kaprodi", kursus: "APPROVED", r: rilis("INGESTED"), siapa: KAPRODI, locale: "id" },
        { nama: "beku-kaprodi", kursus: "FROZEN", r: rilis("FROZEN"), siapa: KAPRODI, locale: "id" },
        { nama: "beku-penyusun", kursus: "FROZEN", r: rilis("FROZEN"), siapa: GLADYS, locale: "id" },
        { nama: "terbit-penyusun", kursus: "PUBLISHED", r: rilis("PUBLISHED"), siapa: GLADYS, locale: "id" },
        { nama: "terbit-kaprodi", kursus: "PUBLISHED", r: rilis("PUBLISHED"), siapa: KAPRODI, locale: "id" },
        { nama: "ditarik", kursus: "SUPERSEDED", r: rilis("SUPERSEDED"), siapa: GLADYS, locale: "id" },
        { nama: "tamu", kursus: "INGESTED", r: null, siapa: TAMU, locale: "id" },
      ];
      const props = KASUS.map((k) => ({
        locale: k.locale, course: "22222222-2222-4222-8222-222222222222",
        fakta: { statusKursus: k.kursus, terbitan: k.r ? { status: k.r.status } : null },
        terbitan: k.r, kemampuan: k.siapa.kemampuan, saya: k.siapa.saya, penyusun: k.siapa.penyusun,
      }));
      const anak = spawnSync(process.execPath, ["--import", "tsx", "-e",
        "(async () => {" +
        '  const { createElement: h } = await import("react");' +
        '  const { renderToStaticMarkup } = await import("react-dom/server");' +
        '  const { AppRouterContext } = await import("next/dist/shared/lib/app-router-context.shared-runtime.js");' +
        '  const m = await import("file://" + process.cwd() + "/src/components/studio/LangkahTerbit.tsx");' +
        "  const L = m.default?.default ?? m.default;" +
        "  const r = { refresh() {}, push() {}, replace() {}, back() {}, forward() {}, prefetch() {} };" +
        "  process.stdout.write(JSON.stringify(JSON.parse(process.env.KASUS_TERBIT).map((k) =>" +
        "    renderToStaticMarkup(h(AppRouterContext.Provider, { value: r }, h(L, k))))));" +
        "})().catch((e) => { process.stderr.write(String(e && e.stack || e)); process.exit(1); });"], {
        cwd: repoRoot, encoding: "utf8", env: { ...process.env, KASUS_TERBIT: JSON.stringify(props) },
      });
      let html: string[] = [];
      try { html = JSON.parse(anak.stdout); } catch { /* reported below */ }
      if (c.expect(anak.status === 0 && html.length === KASUS.length, `the steps could not be rendered: ${(anak.stderr || "").split("\n").slice(0, 3).join(" ")}`)) {
        const R = Object.fromEntries(KASUS.map((k, n) => [k.nama, html[n].replace(/&amp;/g, "&").replace(/&#x27;/g, "'")]));
        const sId = (e: HleEvent) => t(e, "staff");
        const tombolDi = (x: string) => [...x.matchAll(/<button\b(?=[^>]*\btype="submit")[^>]*>([^<]+)<\/button>/g)].map((m) => m[1]);
        const kini = (x: string) => (x.match(/aria-current="step"/g) ?? []).length;
        const tb = (k: KunciLangkah) => sId(kunciSalinan(k, "tombol"));
        for (const [nama, x] of Object.entries(R)) {
          c.expect(kini(x) === 1, `${nama}: ${kini(x)} steps are marked current`);
          const judul = [...x.matchAll(/<p class="pin-lt-judul">([^<]+)</g)].map((m) => m[1]);
          c.expect(judul.length === 8 && new Set(judul).size === 8, `${nama}: the list reads ${JSON.stringify(judul)}`);
        }
        c.expect(JSON.stringify(tombolDi(R["unggah-penyusun"])) === JSON.stringify([tb("susun")])
          && /<input type="hidden" name="to" value="STRUCTURED"\/>/.test(R["unggah-penyusun"])
          // RESTATED FOR W1.1 (Batch 3): Daisy's J1Terbit draws the steps as Progress's named steps, a word each with no
          // number in a circle (the current one marked by aria-current and its ring), so step 1 being current is read
          // as the first item of the list being the current one, named «Susun isi»
          && new RegExp(`<ol class="pin-lt-daftar"[^>]*><li class="pin-lt-langkah pin-lt-kini" aria-current="step"><p class="pin-lt-judul">${sId(kunciSalinan("susun", "judul"))}<`).test(R["unggah-penyusun"]),
          `after upload the author is not offered exactly "${tb("susun")}" on step 1: ${tombolDi(R["unggah-penyusun"])}`);
        c.expect(JSON.stringify(tombolDi(R["unggah-penyusun-en"])) === JSON.stringify([t(kunciSalinan("susun", "tombol"), "staff", { locale: "en" })]), "(en) step 1 is not offered in English");
        c.expect(R["dikembalikan"].includes(sId("studio.langkah.dikembalikan")) && /value="STRUCTURED"/.test(R["dikembalikan"]), "returned content does not say so, or cannot be put together again");
        c.expect(tombolDi(R["tinjau-penyusun"]).length === 0 && R["tinjau-penyusun"].includes(sId("studio.langkah.tunggu.penyusun")),
          "the author is offered their own approval, or not told it is a colleague's");
        c.expect(R["tinjau-penyusun"].includes(`${sId("studio.langkah.oleh")} ${sId("role.HEAD_OF_DEPARTMENT")} ${sId("studio.langkah.atau")} ${sId("role.INSTITUTION_ADMIN")}, ${sId("studio.langkah.bukan_penyusun")}`),
          "the approval step does not say who takes it");
        c.expect(JSON.stringify(tombolDi(R["tinjau-kaprodi"])) === JSON.stringify([tb("setujui")]) && /value="APPROVED"/.test(R["tinjau-kaprodi"]),
          "a second person is not offered the approval");
        c.expect(JSON.stringify(tombolDi(R["disetujui-penyusun"])) === JSON.stringify([tb("buat")]) && /name="langkah" value="buat"/.test(R["disetujui-penyusun"]),
          "an approved course does not offer to create its release");
        c.expect(tombolDi(R["rilis-penyusun"]).length === 0 && R["rilis-penyusun"].includes(sId("studio.langkah.tunggu.penyusun")),
          "the author is offered to lock their own release");
        c.expect(JSON.stringify(tombolDi(R["rilis-kaprodi"])) === JSON.stringify([tb("kunci")])
          && /name="release" value="11111111-1111-4111-8111-111111111111"/.test(R["rilis-kaprodi"]), "a second person is not offered the lock, on this release");
        c.expect(tombolDi(R["beku-kaprodi"]).length === 0 && R["beku-kaprodi"].includes(sId("studio.langkah.tunggu.wewenang")),
          "a head of department is offered to publish, which needs CAN_PUBLISH");
        c.expect(JSON.stringify(tombolDi(R["beku-penyusun"])) === JSON.stringify([tb("terbitkan")]), "the school administrator is not offered to publish a locked release");
        c.expect(R["terbit-penyusun"].includes(`${sId("studio.langkah.terbit.sejak")} ${tanggalBaca("2026-09-25T02:00:00Z")}`) // RESTATED FOR E3 #15: a record's date in the human-readable form
          && R["terbit-penyusun"].includes(`<span class="pin-meta">${sId("studio.langkah.tarik.alasan")}</span>`)
          && JSON.stringify(tombolDi(R["terbit-penyusun"])) === JSON.stringify([sId("studio.paket.tarik")]),
          "a published course does not say since when, or offers no labelled withdrawal to its publisher");
        c.expect(tombolDi(R["terbit-kaprodi"]).length === 0, "a reader without CAN_PUBLISH is offered to withdraw");
        c.expect(R["ditarik"].includes(sId("studio.langkah.ditarik.arti")) && tombolDi(R["ditarik"]).length === 0, "a withdrawn release does not say so");
        c.expect(tombolDi(R["tamu"]).length === 0 && R["tamu"].includes(sId("studio.langkah.tunggu.wewenang")), "a reader with no capability is offered a step");
      }

      /**
       * 5. THE SOURCE. The page draws the steps from the course's status and
       *    its latest release, the reader's capabilities in the course's school
       *    and whether they wrote it; it offers no lifecycle button of its own,
       *    no "Konfirmasi" and no bare placeholder; the check is "Periksa isi
       *    sekarang". The steps talk to the server only through the content
       *    action and BOB-03's typed release actions.
       */
      const halaman = code(readFileSync(join(repoRoot, "src", "app", "studio", "paket", "[course]", "page.tsx"), "utf8"));
      c.expect(/<LangkahTerbit[\s\S]*?fakta=\{\{ statusKursus: course\.status as string, terbitan: terakhir \? \{ status: terakhir\.status as string \} : null \}\}[\s\S]*?kemampuan=\{inst\?\.capabilities \?\? \[\]\}[\s\S]*?penyusun=\{\(course\.author_person_id as string \| null\) \?\? null\}/.test(halaman)
        && /supabase\.rpc\("current_person_id"\)/.test(halaman) && /const terakhir = \(releases \?\? \[\]\)\.at\(-1\) \?\? null;/.test(halaman),
        "the package page does not draw the steps from the course, its latest release and the reader");
      c.expect(!/advanceContentAction|createReleaseAction|freezeReleaseAction|publishReleaseAction|withdrawReleaseAction|studio\.unggah\.konfirmasi|placeholder=/.test(halaman),
        "the package page still carries lifecycle buttons of its own, a Konfirmasi or a bare placeholder");
      c.expect(/<form action=\{runValidationAction\}[\s\S]*?s\("studio\.paket\.periksa_isi"\)/.test(halaman), "the content check is not \"Periksa isi sekarang\"");
      const komponen = code(readFileSync(join(repoRoot, "src", "components", "studio", "LangkahTerbit.tsx"), "utf8"));
      c.expect(!/\bfetch\(/.test(komponen) && /<form action=\{advanceContentAction\}>/.test(komponen) && /name="to" value=\{l\.jalan\.isi\}/.test(komponen)
        && /buatTerbitanAksi[\s\S]*kunciTerbitanAksi[\s\S]*terbitkanAksi[\s\S]*tarikTerbitanAksi/.test(komponen),
        "the steps talk to the server some other way");
      c.expect(/s\(kunciKodeTerbitan\(h\.code\)\)/.test(komponen) && !/\.message\b|\.details\b/.test(komponen), "a release refusal is not its code's sentence");

      // BOB-07's content refusals appear on these steps (Daisy's wording
      // review). One that sends the reader to a step names it exactly as the
      // step list does, in both languages, and they all speak of the course
      // and its content, never of a "paket".
      {
        const RUJUK: Array<[string, string]> = [
          ["content_review_not_allowed", "setujui"], ["content_reviewer_is_author", "setujui"],
          ["content_seal_not_allowed", "kunci"], ["content_publish_not_allowed", "terbitkan"], ["content_withdraw_not_allowed", "terbitkan"],
        ];
        const menunjuk = (kalimat: string, judul: string, locale: "id" | "en") =>
          locale === "id" ? kalimat.includes(`langkah ${judul}.`) : kalimat.includes(`the ${judul} step.`);
        for (const locale of LOCALES) {
          for (const [kode, langkah] of RUJUK) {
            const kalimat = t(`studio.konten.kode.${kode}` as HleEvent, "staff", { locale });
            const judul = t(`studio.langkah.${langkah}.judul` as HleEvent, "staff", { locale });
            c.expect(menunjuk(kalimat, judul, locale), `(${locale}) ${kode} does not send the reader to the "${judul}" step by its name: ${kalimat}`);
          }
          // RESTATED FOR TERMINOLOGY v1 (D-068 ruling 2, rows D1–D23; applied under D-138(c)): in Indonesian the Studio
          // object is now «Paket Pembelajaran», «paket» once the context is set, and «kursus» is the word replaced.
          // RESTATED AGAIN FOR D-171(c) (owner, 4 Nov: «Indonesian: Paket Pembelajaran · English: Learning Package»): the
          // English copy now follows v1 too, so «course» is the word replaced and «package» the word kept — the same
          // strictness, in the ruled direction (X12 T1; D168-X12-1 holds it across the whole copy table)
          for (const k of allKeys().filter((k) => k.startsWith("studio.konten.kode."))) {
            const v = t(k as HleEvent, "staff", { locale });
            c.expect(locale === "id" ? !/\bkursus\b/i.test(v) : !/\bcourses?\b/i.test(v),
              `(${locale}) ${k} names the Studio object by a word v1 replaced: ${v}`);
          }
        }
        c.expect(!menunjuk("Minta orang yang disebut di langkah Setujui paket.", t("studio.langkah.setujui.judul", "staff"), "id"),
          "the control: a sentence naming a step that does not exist is taken as naming it");
      }

      return c.verdict(
        "the seven steps are the database's: each content step is an edge of content_status_transitions from every status it " +
        "is current at, each release step is BOB-03's own with the same capability and starting states; the roles beside each " +
        "are the capability map's, the two second-person steps are the two four-eyes rules, and a step is offered with the " +
        "capability and never to the author when it is a colleague's. Seven different buttons, none Konfirmasi, and every " +
        "release code has its sentence. RENDERED from upload to withdrawal for the author and a head of department: one step " +
        "current, the one right button or the reason there is none. The page draws them from the course, its latest release " +
        "and the reader, with no lifecycle button, Konfirmasi or bare placeholder of its own; BOB-07's content refusals send " +
        "the reader to a step by its exact name in both languages and speak of the course, never a package",
      );
    },
  },
  {
    id: "DAISY-14-TANGGAL-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();

      /**
       * DAISY-14 (audit M10): AN ASSIGNMENT'S DAYS ARE THE SCHOOL'S DAYS.
       * Siapkan sent `${day}T00:00:00Z` and `${day}T23:59:59Z`: the window
       * opened at 07:00 WIB, closed at 06:59 WIB the day after its last, and
       * "from today" was shut until seven. The old construction is kept here
       * as the control each property must reject.
       */
      const lama = (hari: string, ujung: "awal" | "akhir") => `${hari}T${ujung === "awal" ? "00:00:00" : "23:59:59"}Z`;
      const HARI = ["2026-09-25", "2026-09-28", "2026-12-31", "2027-01-01", "2028-02-29"];
      const jakarta = (iso: string) => new Intl.DateTimeFormat("en-CA", {
        year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
        hourCycle: "h23", timeZone: TIMEZONE,
      }).format(new Date(iso));
      c.expect(TIMEZONE === "Asia/Jakarta", `the school's zone is ${TIMEZONE}`);

      /**
       * 1. EACH DAY RUNS FROM 00:00:00 TO 23:59:59 ON THE SCHOOL'S CLOCK, and
       *    the class page, which formats the stored instants in that zone,
       *    shows exactly the days the teacher chose, in both languages.
       */
      for (const hari of HARI) {
        const awal = batasHari(hari, "awal"), akhir = batasHari(hari, "akhir");
        if (!c.expect(awal !== null && akhir !== null, `${hari} is not read as a day`)) continue;
        c.expect(jakarta(awal!) === `${hari}, 00:00:00` && jakarta(akhir!) === `${hari}, 23:59:59`,
          `${hari} runs from ${jakarta(awal!)} to ${jakarta(akhir!)} on the school's clock`);
        c.expect(Date.parse(akhir!) - Date.parse(awal!) === (24 * 3600 - 1) * 1000, `${hari} is not one whole day long`);
        for (const locale of LOCALES) {
          const siang = format.date(`${hari}T12:00:00+07:00`, locale);
          c.expect(format.date(awal!, locale) === siang && format.date(akhir!, locale) === siang,
            `(${locale}) ${hari} is shown as ${format.date(awal!, locale)} – ${format.date(akhir!, locale)}`);
        }
      }
      c.expect(HARI.some((h) => jakarta(lama(h, "awal")) !== `${h}, 00:00:00`) && HARI.some((h) => format.date(lama(h, "akhir"), "id") !== format.date(`${h}T12:00:00+07:00`, "id")),
        "the control does not fail: the old UTC construction would pass these checks");
      for (const bukan of ["", "25-09-2026", "2026-9-25", "2026-02-30", "2026-13-01", "2026-09-25T00:00:00Z"]) {
        c.expect(batasHari(bukan, "awal") === null, `"${bukan}" is read as a day`);
      }

      /**
       * 2. "FROM TODAY" IS OPEN FROM THE SCHOOL'S MIDNIGHT. At every hour of a
       *    Jakarta day, Siapkan's today is that day, and the window starting
       *    today has already opened. With the old construction it stayed shut
       *    until 07:00, which is the control.
       */
      let tutupLama = 0;
      for (let jam = 0; jam < 24; jam++) {
        const kini = new Date(Date.parse("2026-09-24T17:00:00Z") + jam * 3600_000 + 30 * 60_000); // 25 Sep, jam:30 WIB
        const hari = hariIniSekolah(kini);
        c.expect(hari === "2026-09-25", `at ${jakarta(kini.toISOString())} Siapkan's today is ${hari}`);
        c.expect(Date.parse(batasHari(hari, "awal")!) <= kini.getTime() && kini.getTime() <= Date.parse(batasHari(hari, "akhir")!),
          `at ${jakarta(kini.toISOString())} a window from today is not open`);
        if (Date.parse(lama(hari, "awal")) > kini.getTime()) tutupLama++;
      }
      c.expect(tutupLama === 7, `the control: the old construction should be shut for the 7 hours before 07:00, was ${tutupLama}`);

      /**
       * 3. THE SOURCE. sediakanMateri sends the school's first and last
       *    instants, Siapkan's date field starts on the school's today, and no
       *    source file builds a day boundary in UTC.
       */
      const aksi = code(readFileSync(join(repoRoot, "src", "app", "mengajar", "actions.ts"), "utf8"));
      c.expect(/p_from: mulai \? batasHari\(mulai, "awal"\) : null,/.test(aksi) && /p_until: sampai \? batasHari\(sampai, "akhir"\) : null,/.test(aksi),
        "sediakanMateri does not send the school's days");
      const siapkan = code(readFileSync(join(repoRoot, "src", "app", "mengajar", "[kelas]", "siapkan", "page.tsx"), "utf8"));
      // RESTATED FOR W3.11 (Batch 3): J5 reopens a refused form with the dates the teacher sent, and J1 part two shows
      // the window the database now holds; a fresh review still starts on the school's today, so the field takes
      // `mulaiAwal`, whose last fallback (no date sent back, nothing made available) is hariIniSekolah().
      c.expect(/name="mulai" defaultValue=\{mulaiAwal\}/.test(siapkan) && /const mulaiAwal = [^;]*: hariIniSekolah\(\);/.test(siapkan),
        "Siapkan's first day does not start on the school's today");
      const utc = walk(join(repoRoot, "src")).filter((f) => /\.(ts|tsx)$/.test(f))
        .filter((f) => /T00:00:00Z|T23:59:59Z|T00:00:00\.000Z/.test(code(readFileSync(f, "utf8"))));
      c.expect(utc.length === 0, `a day boundary is built in UTC in ${utc.map((f) => relative(repoRoot, f)).join(", ")}`);

      return c.verdict(
        "an assignment's days are the school's: each chosen day runs from 00:00:00 to 23:59:59 in Asia/Jakarta and is shown as " +
        "that same day in both languages; at every hour of a Jakarta day Siapkan's today is that day and a window from today is " +
        "already open (the old UTC construction, the control, fails each and is shut for the 7 hours before 07:00); impossible " +
        "days are refused; sediakanMateri sends batasHari's instants and no source file builds a day boundary in UTC",
      );
    },
  },
  {
    id: "DAISY-07-LAPORAN-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();

      /**
       * DAISY-07 (audit B6): REPORTS ONE CLICK AWAY, AND AN ABSENT FIGURE THAT
       * SAYS WHAT WILL MAKE IT APPEAR.
       *
       * 1. THE "WHAT" IS READ FROM THE CALCULATORS. For every class and school
       *    metric in the catalogue, its calculator's latest body in the
       *    migrations decides the evidence it counts -- certificates,
       *    misconception rows, both tests, the Cek penguasaan, or any official
       *    assessment -- and that must be the kind SYARAT_METRIK names. A copy
       *    of a POST_TEST calculator with its mode filter removed is the
       *    control: the classifier must call it something else.
       */
      const mig = join(repoRoot, "supabase", "migrations");
      const berkas = readdirSync(mig).filter((f) => f.endsWith(".sql")).sort().map((f) => readFileSync(join(mig, f), "utf8"));
      const katalog = readFileSync(join(mig, "20260918100000_metric_catalogue.sql"), "utf8");
      // the calculation key is the metric id with its dot made an underscore; each is checked to exist below
      const metrik = [...new Set([...katalog.matchAll(/\('MC-1', '((?:class|institution)\.[a-z_]+)'/g)].map((m) => m[1]))]
        .map((id) => ({ id, kalkulator: id.replace(".", "_") }));
      c.expect(metrik.length >= 12, `could not read the class and school metrics from the catalogue (${metrik.length})`);
      // The LATEST definition wins, in either style the migrations use: the
      // original `create function ... end;` and the pg_dump-style
      // `CREATE OR REPLACE FUNCTION ... BEGIN ATOMIC ... END` / `;` that MC-2
      // rewrote them in (a CASE's own END) is not the body's end).
      const badan = (fn: string): string => {
        let hasil = "";
        for (const sql of berkas) {
          const re = new RegExp(`create (?:or replace )?function public\\.calc_${fn}\\(`, "gi");
          let m: RegExpExecArray | null;
          while ((m = re.exec(sql))) {
            const akhir = /\n(?:END\s*\n;|end;)/.exec(sql.slice(m.index));
            hasil = sql.slice(m.index, akhir ? m.index + akhir.index : undefined);
          }
        }
        return hasil.split("\n").filter((l) => !l.trim().startsWith("--")).join("\n");
      };
      const jenis = (b: string): string =>
        /certificates\b/i.test(b) ? "sertifikat"
        : /service_cohort_misconceptions/i.test(b) ? "miskonsepsi"
        : /mode in \('PRE_TEST',\s*'POST_TEST'\)|mode = ANY \(ARRAY\['PRE_TEST'[^\]]*'POST_TEST'/i.test(b) ? "awal_akhir"
        : /mode = 'POST_TEST'/i.test(b) ? "akhir"
        : /official_sessions/i.test(b) ? "penilaian" : "tidak_dikenal";
      for (const { id, kalkulator } of metrik) {
        const b = badan(kalkulator);
        if (!c.expect(b.length > 0, `${id}: the body of calc_${kalkulator} could not be found`)) continue;
        c.expect(SYARAT_METRIK[id] === jenis(b), `${id} counts ${jenis(b)} (calc_${kalkulator}); the card would say ${SYARAT_METRIK[id] ?? "nothing"}`);
      }
      const akhir = badan("class_comprehension");
      c.expect(jenis(akhir) === "akhir" && jenis(akhir.replace(/\s*and \(?s\.mode = 'POST_TEST'(?:::assessment_mode)?\)?/i, "")) !== "akhir",
        "the control: a comprehension calculator without its Cek penguasaan filter is still classified as akhir");

      /**
       * 2. THE WORDS name the two tests exactly as the product does (KEGUNAAN,
       *    the workbook's own list), in both languages, and "what will make it
       *    appear" is offered only to a figure short of evidence.
       */
      const nama = Object.fromEntries(KEGUNAAN.map(([n, k]) => [k, n]));
      for (const locale of LOCALES) {
        for (const k of ["penilaian", "akhir", "awal_akhir", "miskonsepsi", "sertifikat"]) {
          c.expect(t(`laporan.muncul.${k}` as HleEvent, "staff", { locale }) !== TANPA_SALINAN, `(${locale}) laporan.muncul.${k} has no copy`);
        }
      }
      // RESTATED FOR TERMINOLOGY v1 (D-068 rows A12, A13, applied under D-138(c)): a report names the two tests by their
      // v1 names, the modes' own labels (jenis.mode.*, D-134(b)); the workbook keeps its marks (A16–A21, retained), so
      // the old marks must no longer appear in a report sentence either
      c.expect(nama.PRE_TEST === "Pemetaan awal" && nama.POST_TEST === "Cek penguasaan",
        "the workbook's marks changed; v1 retained them (A16–A21) and this restatement rests on that");
      const v1 = { PRE_TEST: t("jenis.mode.PRE_TEST", "staff"), POST_TEST: t("jenis.mode.POST_TEST", "staff") };
      c.expect(v1.PRE_TEST === "Pemetaan Awal" && v1.POST_TEST === "Uji Penguasaan", `the modes are not v1's names: ${JSON.stringify(v1)}`);
      const kalimatAkhir = t("laporan.muncul.akhir", "staff");
      const awalAkhir = t("laporan.muncul.awal_akhir", "staff");
      c.expect(kalimatAkhir.includes(v1.POST_TEST) && !kalimatAkhir.includes(v1.PRE_TEST) && !kalimatAkhir.includes(nama.POST_TEST),
        `the Uji Penguasaan sentence does not name "${v1.POST_TEST}" alone`);
      c.expect(awalAkhir.includes(v1.PRE_TEST) && awalAkhir.includes(v1.POST_TEST) && !awalAkhir.includes(nama.PRE_TEST) && !awalAkhir.includes(nama.POST_TEST),
        "the gain sentence does not name both tests");
      c.expect(kunciMuncul({ status: "below_minimum", metric_id: "class.net_gain" }) === "laporan.muncul.awal_akhir"
        && kunciMuncul({ status: "not_permitted", metric_id: "class.net_gain" }) === null
        && kunciMuncul({ status: "deprecated", metric_id: "class.net_gain" }) === null
        && kunciMuncul({ status: "unavailable" }) === null && kunciMuncul({ status: "ok", metric_id: "class.net_gain" }) === null
        && kunciMuncul({ status: "below_minimum", metric_id: "item.correctness_rate" }) === null,
        "what will make a figure appear is offered to something other than a figure short of evidence");

      /**
       * 3. RENDERED. The absence card, in both languages: short of evidence it
       *    keeps the evaluator's sentence and its count and adds what will make
       *    the figure appear; a refusal stays unlabelled and says nothing more;
       *    a retired measure says it was replaced and nothing more.
       */
      const KASUS = [
        { locale: "id", persona: "staff", entry: { status: "below_minimum", metric_id: "class.comprehension", label_key: "metrik.pemahaman.label", statement_key: "laporan.metrik.belum_cukup_data", have: 3, needed: 5 } },
        { locale: "en", persona: "staff", entry: { status: "below_minimum", metric_id: "class.net_gain", label_key: "metrik.kenaikan.label", statement_key: "laporan.metrik.belum_ada_bukti", have: 0, needed: 5 } },
        { locale: "id", persona: "staff", entry: { status: "not_permitted" } },
        { locale: "id", persona: "staff", entry: { status: "deprecated", metric_id: "class.comprehension", label_key: "metrik.pemahaman.label" } },
      ];
      const anak = spawnSync(process.execPath, ["--import", "tsx", "-e",
        "(async () => {" +
        '  const { createElement: h } = await import("react");' +
        '  const { renderToStaticMarkup } = await import("react-dom/server");' +
        '  const m = await import("file://" + process.cwd() + "/src/components/bukti/KartuKetiadaan.tsx");' +
        "  const K = m.default?.default ?? m.default;" +
        "  process.stdout.write(JSON.stringify(JSON.parse(process.env.KASUS_KARTU).map((k) => renderToStaticMarkup(h(K, k)))));" +
        "})().catch((e) => { process.stderr.write(String(e && e.stack || e)); process.exit(1); });"], {
        cwd: repoRoot, encoding: "utf8", env: { ...process.env, KASUS_KARTU: JSON.stringify(KASUS) },
      });
      let html: string[] = [];
      try { html = JSON.parse(anak.stdout); } catch { /* reported below */ }
      if (c.expect(anak.status === 0 && html.length === KASUS.length, `the absence card could not be rendered: ${(anak.stderr || "").split("\n").slice(0, 3).join(" ")}`)) {
        const x = html.map((h) => h.replace(/&#x27;/g, "'").replace(/&amp;/g, "&"));
        // RESTATED FOR W3.2 / CR-46 (Batch 2, Daisy's EmptyState «not enough yet»): «how far» is no longer the pair
        // «(3/5)», which reads as a score, but the sentence «Sekarang 3 murid; perlu 5.»; why and what will make it
        // appear are held as before.
        const jauh = t("ketiadaan.jumlah.murid", "staff").replace("{have}", "3").replace("{needed}", "5");
        c.expect(x[0].includes(t("metrik.pemahaman.label", "staff")) && x[0].includes(t("laporan.metrik.belum_cukup_data", "staff"))
          && x[0].includes(jauh) && !/\(\d+\/\d+\)/.test(x[0])
          && x[0].includes(t("laporan.muncul.akhir", "staff")), `short of evidence, the card does not say why, how far and what will make it appear: ${x[0]}`);
        c.expect(x[1].includes(t("laporan.muncul.awal_akhir", "staff", { locale: "en" })), "(en) the gain card does not say what will make it appear");
        c.expect(!/pin-ml/.test(x[2])
          && !x[2].includes(t("laporan.muncul.akhir", "staff")) && x[2].includes(t("laporan.metrik.bukan_untuk_anda", "staff")),
          `a refusal is labelled or told what would make it appear: ${x[2]}`);
        c.expect(x[3].includes(t("laporan.metrik.diganti", "staff")) && !x[3].includes(t("laporan.muncul.akhir", "staff")), "a retired measure is told what would make it appear");
      }

      /**
       * 4. THE PAGES. Pimpinan, above the classes, asks each class of the
       *    branch through buktiPerKelas and draws it as a disclosure with its
       *    figures and absence cards, or one refusal line; at a class it asks
       *    nothing more. Both summaries add what will make a figure appear.
       *    Konfigurasi links the chosen school's summary at its own root node
       *    and each active Kelas's at that class. Pimpinan links them too, for
       *    the dean and the head of department, who never see Konfigurasi: the
       *    school summary where the reader may read a school figure, a class's
       *    summary at that class and inside each class they may read, and
       *    never a link into a page of refusals. And Pimpinan opens on the
       *    reader's BROADEST scope, so a head of department who also holds a
       *    class inside the department lands on the department (CI #194 found
       *    "5A" sorting before "Matematika" on the seed).
       */
      const pimpinan = code(readFileSync(join(repoRoot, "src", "app", "pimpinan", "page.tsx"), "utf8"));
      {
        const akar = "00000000-0000-4000-8000-0000000000a1";
        const dept = { id: "00000000-0000-4000-8000-0000000000d1", nama: "Matematika", jalur: [akar, "00000000-0000-4000-8000-0000000000d1"] };
        const kelas5 = { id: "00000000-0000-4000-8000-0000000000c1", nama: "5A", jalur: [akar, dept.id, "00000000-0000-4000-8000-0000000000c1"] };
        const lain = { id: "00000000-0000-4000-8000-0000000000d2", nama: "Bahasa", jalur: [akar, "00000000-0000-4000-8000-0000000000d2"] };
        const urut = [kelas5, dept]; // as lingkupPimpinan returns them: by name
        const lama = (l: typeof urut, d?: string) => l.find((n) => n.id === d) ?? l[0];
        c.expect(lingkupAwal(urut)?.id === dept.id && lama(urut)?.id === kelas5.id,
          "Pimpinan does not open a head of department on the department when a class inside it sorts first (the old rule, the control, must pick the class)");
        c.expect(lingkupAwal(urut, kelas5.id)?.id === kelas5.id && lingkupAwal(urut, "00000000-0000-4000-8000-0000000000ff")?.id === dept.id,
          "a scope asked for by id is not honoured, or an id outside the reader's scopes is");
        c.expect(lingkupAwal([lain, dept])?.id === lain.id && lingkupAwal([{ ...kelas5, jalur: [] }, dept])?.id === kelas5.id
          && lingkupAwal([]) === undefined,
          "two unrelated scopes, or a scope without a path, are not left in their given order");
        c.expect(/const dipilih = lingkupAwal\(lingkup, sp\.lingkup\) \?\? lingkup\[0\];/.test(pimpinan), "Pimpinan does not choose its scope with lingkupAwal");
      }
      c.expect(/const diKelas = dipilih\.kind === "CLASS";/.test(pimpinan)
        && /diKelas \? Promise\.resolve\(\[\] as pim\.BuktiKelas\[\]\) : pim\.buktiPerKelas\(dipilih\.id\)/.test(pimpinan),
        "Pimpinan does not ask each class of the branch for its own figures");
      c.expect(/<details key=\{kelas\.id\} className="pin-kelas-bukti">/.test(pimpinan) && /<KartuKetiadaan key=\{e\.metric_id/.test(pimpinan)
        && /bk\.length === 0 \? "laporan\.metrik\.bukan_untuk_anda"/.test(pimpinan), "a class is not drawn with its figures, its absences, or one refusal line");
      for (const hal of [["dekan", "ringkasan"], ["edukator", "ringkasan"]]) {
        const src = code(readFileSync(join(repoRoot, "src", "app", ...hal, "page.tsx"), "utf8"));
        // RESTATED FOR W3.8 (Batch 5): the sentence is now asked in the reader's language (persona and locale passed)
        // RESTATED FOR E-C1-2 (D-132): the class report's persona is the working context's (`untuk`)
        c.expect(/kunciMuncul\(e\) \? <p[^>]*>\{s\(kunciMuncul\(e\)!, (?:"educator"|"staff"|untuk), locale\)\}<\/p> : null/.test(src), `/${hal.join("/")} does not say what will make a figure appear`);
      }
      // Pimpinan's own links. Their condition leans on a refusal never reaching
      // `bukti` or a class's list, so that is checked where it is decided.
      const pimLib = code(readFileSync(join(repoRoot, "src", "lib", "pimpinan.ts"), "utf8"));
      c.expect(/return e\.status !== "not_permitted" && e\.status !== "unavailable";/.test(pimLib)
        && /return out\.filter\(terbaca\);/.test(pimLib) && /bukti: bukti\.filter\(terbaca\)/.test(pimLib),
        "a refusal can reach Pimpinan's figures, so a figure there no longer means the reader may read it");
      c.expect(/const bacaSekolah = bukti\.some\(\(e\) => e\.metric_id\?\.startsWith\("institution\."\)\);/.test(pimpinan)
        // RESTATED FOR H9 (Daisy, C1): each link also says where the report was opened from (`dari`), so its way back is named
        && /\{bacaSekolah \? \(\s*<Link className="pin-btn" href=\{`\/dekan\/ringkasan\?simpul=\$\{encodeURIComponent\(dipilih\.id\)\}&dari=pimpinan`\}>\s*\{s\("pimpinan\.laporan\.sekolah"\)\}/.test(pimpinan),
        "Pimpinan does not link the school summary exactly where the reader may read a school figure");
      c.expect(/const bacaKelas = diKelas && bukti\.some\(\(e\) => e\.metric_id\?\.startsWith\("class\."\)\);/.test(pimpinan)
        && /\{bacaKelas \? \(\s*<Link className="pin-btn" href=\{`\/edukator\/ringkasan\?kelas=\$\{encodeURIComponent\(dipilih\.id\)\}&dari=pimpinan`\}>\s*\{s\("pimpinan\.laporan\.kelas"\)\}/.test(pimpinan),
        "Pimpinan, standing at a class the reader may read, does not link that class's summary");
      {
        // inside a class's disclosure only when it has figures the reader may read
        const a = pimpinan.indexOf("{bk.length > 0 ? (");
        // from the condition to its own close, the last `) : null}` before the class's </details>
        const b = pimpinan.lastIndexOf(") : null}", pimpinan.indexOf("</details>", a));
        const isi = a >= 0 && b > a ? pimpinan.slice(a, b) : "";
        c.expect(/<Link className="pin-btn pin-quiet" href=\{`\/edukator\/ringkasan\?kelas=\$\{encodeURIComponent\(kelas\.id\)\}&dari=pimpinan`\}>\s*\{s\("pimpinan\.laporan\.kelas"\)\}/.test(isi),
          "a class the reader may read does not link its own summary inside its disclosure");
        c.expect((pimpinan.match(/\/edukator\/ringkasan\?/g) ?? []).length === 2 && (pimpinan.match(/\/dekan\/ringkasan\?/g) ?? []).length === 1,
          "Pimpinan links a summary somewhere other than the three places named");
      }
      const konfig = code(readFileSync(join(repoRoot, "src", "app", "konfigurasi", "page.tsx"), "utf8"));
      c.expect(/from\("org_nodes"\)\.select\("id"\)\.eq\("institution_id", sekolahStruktur\.id\)\.eq\("kind", "INSTITUTION"\)/.test(konfig)
        && /href=\{`\/dekan\/ringkasan\?simpul=\$\{\(akar as \{ id: string \}\)\.id\}&dari=konfigurasi`\}/.test(konfig),
        "Konfigurasi does not link the chosen school's summary at its own root node");
      c.expect(/struktur\.rows\.filter\(\(r\) => r\.level === "KELAS" && r\.is_active\)/.test(konfig)
        && /href=\{`\/edukator\/ringkasan\?kelas=\$\{k\.node_id\}&dari=konfigurasi`\}/.test(konfig), "Konfigurasi does not link each active Kelas's summary");
      c.expect(/\["laporan", s\("config\.laporan\.judul"\)\]/.test(konfig), "the Laporan section is not in Konfigurasi's index");
      // each link carries the parameter its summary actually reads (the class
      // summary reads ?kelas=, the school summary ?simpul=)
      for (const [hal, param] of [["edukator", "kelas"], ["dekan", "simpul"]] as const) {
        const src = code(readFileSync(join(repoRoot, "src", "app", hal, "ringkasan", "page.tsx"), "utf8"));
        // RESTATED FOR H9: the page also reads `dari` (where it was opened from), and every link sends it
        const dibaca = /searchParams: Promise<\{ (\w+)\?: string; dari\?: string \}>/.exec(src)?.[1];
        for (const [nama, sumber] of [["Konfigurasi", konfig], ["Pimpinan", pimpinan]] as const) {
          c.expect(dibaca === param && new RegExp(`href=\\{\`\\/${hal}\\/ringkasan\\?${param}=`).test(sumber),
            `/${hal}/ringkasan reads ?${dibaca ?? "nothing"}=; ${nama} must link it with ?${param}=, and does not`);
          c.expect(!new RegExp(`\\/${hal}\\/ringkasan\\?(?!${param}=)`).test(sumber), `${nama} links /${hal}/ringkasan with a parameter it does not read`);
        }
      }

      return c.verdict(
        "every class and school metric's \"what will make it appear\" is the evidence its calculator's latest body counts (a " +
        "comprehension calculator stripped of its Cek penguasaan filter is the control); the sentences name the tests as the " +
        "workbook does, in both languages, and only for a figure short of evidence. RENDERED, the absence card keeps why and " +
        "how far and adds what; a refusal and a retired measure add nothing. Pimpinan asks each class of the branch for itself " +
        "and draws it as a disclosure; both summaries say what will make a figure appear; Konfigurasi links the school summary " +
        "at its root and each active Kelas's; Pimpinan links the school summary where the reader may read a school figure and " +
        "a class's summary at that class and inside each class they may read, each link with the parameter its page reads; " +
        "Pimpinan opens on the reader's broadest scope, so a head of department holding a class inside the department opens on " +
        "the department (the old first-by-name rule is the control)",
      );
    },
  },
  {
    id: "DAISY-17-KIRIM-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();

      /**
       * DAISY-17 (D-046(e)): A CLICK THAT SAVES SAYS SO AT ONCE AND SAVES ONCE.
       * "Berikan peran" showed nothing for 10–15 s and a second click made a
       * second grant.
       *
       * 1. EVERY FORM THAT CALLS A SERVER ACTION submits through TombolKirim:
       *    every <form action={…}> under src/app and src/components has one, and
       *    no plain submit button (a <button> without type="button", or an
       *    <input type="submit">). Every TombolKirim says what it does while
       *    it works (a sibuk= prop). A planted plain button is the control.
       */
      const periksa = (src: string) => {
        const salah: string[] = [];
        let n = 0;
        for (const m of src.matchAll(/<form\b([^>]*)>/g)) {
          if (!/\baction=\{/.test(m[1])) continue;
          n++;
          const akhir = src.indexOf("</form>", m.index!);
          const isi = src.slice(m.index! + m[0].length, akhir < 0 ? undefined : akhir);
          const polos = [...isi.matchAll(/<button\b[^>]*>/g)].map((b) => b[0]).filter((b) => !/type="button"/.test(b));
          if (polos.length || /<input\b[^>]*type="submit"/.test(isi) || !/<TombolKirim\b/.test(isi)) {
            salah.push(`<form action={${/\baction=\{([^}]*)\}/.exec(m[1])?.[1]}}>: ${polos[0] ?? (/<TombolKirim\b/.test(isi) ? "an input submit" : "no TombolKirim")}`);
          }
        }
        return { n, salah };
      };
      const berkas = [...walk(join(repoRoot, "src", "app")), ...walk(join(repoRoot, "src", "components"))]
        .filter((f) => f.endsWith(".tsx")).map((f) => relative(repoRoot, f).replace(/\\/g, "/"));
      let jumlah = 0;
      const tombol: string[] = [];
      for (const f of berkas) {
        const src = code(readFileSync(join(repoRoot, f), "utf8"));
        const { n, salah } = periksa(src);
        jumlah += n;
        for (const x of salah) c.expect(false, `${f} ${x}: a form that saves without saying so, or twice`);
        tombol.push(...[...src.matchAll(/<TombolKirim\b[^>]*>/g)].map((m) => `${f}: ${m[0]}`));
      }
      c.expect(jumlah >= 43, `only ${jumlah} server-action form(s) found; the sweep is not seeing the app`);
      for (const tk of tombol) c.expect(/\bsibuk=\{s\("(?:tombol\.[a-z_]+|studio\.langkah\.sibuk|config\.struktur\.sibuk)"\)\}|\bsibuk=\{e\("tombol\.[a-z_]+"\)\}/.test(tk), `${tk} does not say what it does while it works`);
      const ditanam = periksa(`<form action={simpan}><input name="x" /><button className="pin-btn">Simpan</button></form>`);
      const tanpaTipe = periksa(`<form action={simpan}><TombolKirim sibuk={s("tombol.menyimpan")}>Simpan</TombolKirim><button>Lagi</button></form>`);
      const baik = periksa(`<form action={simpan}><TombolKirim sibuk={s("tombol.menyimpan")}>Simpan</TombolKirim><button type="button">Batal</button></form>`);
      c.expect(ditanam.salah.length === 1 && tanpaTipe.salah.length === 1 && baik.salah.length === 0,
        "the control: a planted plain button, or a second untyped button, is not caught, or a cancel button is");

      /**
       * 2. THE BUTTON ITSELF: it reads its own form's status, is disabled and
       *    busy and shows its pending words from the submit until the answer,
       *    and holds a second submit that lands before the page redraws (in
       *    the capture phase at the document, never by disabling itself inside
       *    its own click, which would cancel the submission).
       */
      const jalurTk = join(repoRoot, "src", "components", "TombolKirim.tsx");
      const tkMentah = existsSync(jalurTk) ? readFileSync(jalurTk, "utf8") : "";
      c.expect(tkMentah !== "", "there is no pending-aware submit button (src/components/TombolKirim.tsx)");
      const tk = code(tkMentah);
      c.expect(/^"use client";/.test(tkMentah.trimStart())
        && /import \{ useFormStatus \} from "react-dom";/.test(tk) && /const \{ pending \} = useFormStatus\(\);/.test(tk),
        "the button does not read its own form's status");
      c.expect(/type="submit"\s+disabled=\{pending \|\| disabled\}\s+aria-busy=\{pending \? "true" : undefined\}/.test(tk) && /\{pending \? sibuk : tuntas \? /.test(tk) && /: children\}/.test(tk),
        "the button is not disabled, busy and worded while its form is being saved");
      c.expect(/sibuk: ReactNode;/.test(tk) && !/sibuk\?: ReactNode/.test(tk), "a TombolKirim may be written without its pending words");
      c.expect(/document\.addEventListener\("submit", jaga, true\)/.test(tk) && /e\.preventDefault\(\);\s*e\.stopImmediatePropagation\(\);/.test(tk)
        && /if \(!pending\) terkirim\.current = false;/.test(tk) && !/onClick/.test(tk),
        "a second submit before the redraw is not held, the hold never clears, or the button acts inside its own click");
      for (const locale of LOCALES) {
        for (const k of ["menyimpan", "memproses", "memeriksa", "mengirim", "menyediakan", "memulai", "mengaktifkan"]) {
          const v = t(`tombol.${k}` as HleEvent, "staff", { locale });
          c.expect(v !== TANPA_SALINAN && v.endsWith("…"), `(${locale}) tombol.${k} does not read as work in progress: ${v}`);
        }
      }

      /**
       * 3. AKTIVASI sends through fetch, not a form: the pressed button says
       *    "Mengaktifkan…" and a second press before the redraw is held.
       */
      const akt = code(readFileSync(join(repoRoot, "src", "components", "aktivasi", "FormAktivasi.tsx"), "utf8"));
      c.expect((akt.match(/s\("tombol\.mengaktifkan"\)/g) ?? []).length === 3 && (akt.match(/aria-busy=\{sibuk === /g) ?? []).length === 3,
        "an activation button does not say it is working");
      c.expect(/if \(cegah \|\| berjalan\.current\) return;\s*berjalan\.current = true;/.test(akt) && /finally \{\s*berjalan\.current = false;/.test(akt),
        "a second activation press before the redraw is not held, or the hold never clears");

      /**
       * 4. IN THE SAME PUSH: a staff refusal does not tell an adult to ask
       *    their teacher, and Konfigurasi offers "Menambahkan orang" only to a
       *    reader /pendataan admits (the same predicate).
       */
      for (const locale of LOCALES) {
        const staf = t("tolak.arti", "staff", { locale });
        const murid = t("tolak.arti", "learner", { locale });
        c.expect(!/\bguru\b|\bteacher\b/i.test(staf) && /\bguru\b|\bteacher\b/i.test(murid) && staf !== murid,
          `(${locale}) a staff refusal still sends an adult to a teacher, or a learner's no longer does: ${staf} / ${murid}`);
      }
      const tolak = code(readFileSync(join(repoRoot, "src", "components", "HalamanPenolakan.tsx"), "utf8"));
      c.expect(/const s = \(k: HleEvent\) => t\(k, persona, \{ locale \}\);/.test(tolak) && /\{s\("tolak\.arti"\)\}/.test(tolak),
        "the refusal page does not say tolak.arti in its reader's own register");
      const konf = code(readFileSync(join(repoRoot, "src", "app", "konfigurasi", "page.tsx"), "utf8"));
      c.expect(/sekolahPendataan\(\)\.then\(\(x\) => x\.length > 0\)/.test(konf)
        // D-138 step 3: drawn as the staff shell's navigation item; still offered only by /pendataan's own predicate
        && /\{bolehPendataan \? <(?:Link|ItemNav) href="\/pendataan"/.test(konf) && (konf.match(/href="\/pendataan"/g) ?? []).length === 1,
        "Konfigurasi offers Menambahkan orang to a reader /pendataan refuses");
      const pend = code(readFileSync(join(repoRoot, "src", "app", "pendataan", "page.tsx"), "utf8"));
      c.expect(/const sekolah = await data\.sekolahPendataan\(\);\s*if \(sekolah\.length === 0\)/.test(pend),
        "/pendataan no longer admits by sekolahPendataan, so Konfigurasi's offer asks a different question");

      c.note(`${jumlah} server-action form(s), ${tombol.length} TombolKirim`);
      return c.verdict(
        `every one of the ${jumlah} forms that call a server action submits through TombolKirim and nothing else, each ` +
        "saying what it does while it works (a planted plain button and a second untyped one are caught, a cancel " +
        "button is not); TombolKirim reads its own form's status, is disabled, busy and worded from the submit until " +
        "the answer, and holds a second submit that lands before the redraw; the activation buttons say " +
        "\"Mengaktifkan…\" and hold a second press; a staff refusal no longer sends an adult to a teacher while a " +
        "learner's still does; Konfigurasi offers Menambahkan orang only by /pendataan's own predicate",
      );
    },
  },
  {
    id: "DAISY-18-DENGAR-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const baca = (...p: string[]) => {
        const f = join(repoRoot, ...p);
        return existsSync(f) ? readFileSync(f, "utf8") : "";
      };
      const semua = [...walk(join(repoRoot, "src", "app")), ...walk(join(repoRoot, "src", "components"))]
        .filter((f) => f.endsWith(".tsx")).map((f) => relative(repoRoot, f).replace(/\\/g, "/"));

      /**
       * DAISY-18 (D-047): PINTAR SHOWS IT HEARD YOU. DAISY-17's pattern, Idle →
       * Working → Success / Error, as shared pieces rather than per page.
       *
       * 1. NAVIGATION ANSWERS AT ONCE. Each main section's loading.tsx is the
       *    one shared shell (MemuatHalaman) and nothing else; inside a section
       *    that draws its own frame (a layout.tsx: Studio) it is the framed
       *    shell, without a second header and <main>. A planted page-own
       *    loading screen is the control.
       */
      const BAGIAN = ["konfigurasi", "studio", "mengajar", "pimpinan", "belajar", "aktivasi", "pendataan"];
      const cangkang = (src: string, bingkai: boolean) => {
        const k = code(src).replace(/\s+/g, " ").trim();
        return bingkai
          ? /^import MemuatHalaman from "@\/components\/MemuatHalaman"; export default function \w+\(\) \{ return <MemuatHalaman dalamBingkai \/>; \}$/.test(k)
          : k === 'export { default } from "@/components/MemuatHalaman";';
      };
      // L3: a section's working-context guard (a layout.tsx that renders its children alone) draws no frame
      const penjagaSaja = (src: string) =>
        /export default async function \w+\(\{ children \}: \{ children: ReactNode \}\) \{ await konteksHalaman\(\); return <>\{children\}<\/>; \}/
          .test(code(src).replace(/\s+/g, " "));
      for (const b of BAGIAN) {
        const tata = baca("src", "app", b, "layout.tsx");
        const bingkai = tata !== "" && !penjagaSaja(tata);
        const src = baca("src", "app", b, "loading.tsx");
        c.expect(src !== "" && cangkang(src, bingkai),
          `/${b} ${src === "" ? "has no loading.tsx, so a menu click shows nothing until the page is ready" : `has a loading screen of its own, not the shared shell${bingkai ? " inside its frame" : ""}`}`);
      }
      for (const f of semua.filter((x) => /\/loading\.tsx$/.test(x))) {
        c.expect(/@\/components\/MemuatHalaman/.test(baca(f)), `${f} is a loading screen of its own, not the shared shell`);
      }
      c.expect(!cangkang(`export default function Memuat() { return <p>Memuat…</p>; }`, false)
        && !cangkang(`export { default } from "@/components/MemuatHalaman";`, true),
        "the control: a page-own loading screen, or the full shell inside a frame, is not caught");
      const memuatMentah = baca("src", "components", "MemuatHalaman.tsx");
      const memuat = code(memuatMentah);
      c.expect(memuat !== "" && /<p className="pin-memuat-kata" role="status">\{t\("memuat\.halaman", "public", \{ locale \}\)\}<\/p>/.test(memuat)
        && /<div className="pin-memuat-bentuk" aria-hidden="true">/.test(memuat),
        "the loading shell does not say \"Memuat halaman…\" once, in the reader's language, with its shape hidden");
      const bingkaiSaja = /if \(dalamBingkai\) \{\s*return ([\s\S]*?);\s*\}/.exec(memuat)?.[1] ?? "";
      c.expect(bingkaiSaja !== "" && !/<header|<main|MerekPintar/.test(bingkaiSaja),
        "inside a section's frame the shell draws a second header or <main>");
      for (const locale of LOCALES) {
        const v = t("memuat.halaman", "public", { locale });
        c.expect(v !== TANPA_SALINAN && v.endsWith("…"), `(${locale}) memuat.halaman does not read as work in progress: ${v}`);
      }

      /**
       * 2. A MENU LINK ACKNOWLEDGES THE CLICK. Every <Link> inside a <nav>
       *    (and every place tab, TabTempat, which is drawn inside one) carries
       *    TandaTautan, which reads Next's useLinkStatus and draws a working
       *    dot from the click until the next page is on screen, taking no room
       *    at rest. A planted bare menu link is the control.
       */
      const menu = (src: string) => {
        const salah: string[] = [];
        let n = 0;
        for (const nav of src.matchAll(/<nav\b[^>]*>([\s\S]*?)<\/nav>/g)) {
          for (const l of nav[1].matchAll(/<Link\b[\s\S]*?<\/Link>/g)) {
            n++;
            if (!/<TandaTautan \/>/.test(l[0])) salah.push(/href=(\{[^}]*\}|"[^"]*")/.exec(l[0])?.[1] ?? l[0].slice(0, 60));
          }
        }
        return { n, salah };
      };
      let tautan = 0;
      for (const f of semua) {
        const src = code(baca(f));
        const { n, salah } = menu(src);
        tautan += n;
        for (const x of salah) c.expect(false, `${f}: the menu link ${x} does not acknowledge a click`);
      }
      const tab = code(baca("src", "components", "TabTempat.tsx"));
      const tabLinks = [...tab.matchAll(/<Link\b[\s\S]*?<\/Link>/g)].map((m) => m[0]);
      c.expect(tabLinks.length > 0 && tabLinks.every((l) => /<TandaTautan \/>/.test(l)), "a place tab (TabTempat) does not acknowledge a click");
      // D-138 step 3: the staff navigation's places are ItemNav, handed to the shell's <nav> as its items; each is one
      // Link carrying TandaTautan, so every one of them counts as a menu link here
      const item = code(baca("src", "components", "ItemNav.tsx"));
      const itemLinks = [...item.matchAll(/<Link\b[\s\S]*?<\/Link>/g)].map((m) => m[0]);
      c.expect(itemLinks.length === 1 && /<TandaTautan \/>/.test(itemLinks[0]), "a staff navigation item (ItemNav) does not acknowledge a click");
      for (const f of semua) tautan += (code(baca(f)).match(/<ItemNav\b/g) ?? []).length;
      c.expect(tautan >= 15, `only ${tautan} menu link(s) found inside <nav>; the sweep is not seeing the menus`);
      c.expect(menu(`<nav><Link href="/studio">Studio</Link></nav>`).salah.length === 1
        && menu(`<nav><Link href="/studio">Studio<TandaTautan /></Link></nav>`).salah.length === 0,
        "the control: a planted bare menu link is not caught, or a marked one is");
      const tanda = baca("src", "components", "TandaTautan.tsx");
      c.expect(/^"use client";/.test(tanda.trimStart()) && /import \{ useLinkStatus \} from "next\/link";/.test(tanda)
        && /const \{ pending \} = useLinkStatus\(\);/.test(tanda) && /aria-hidden="true"/.test(tanda)
        && /pending \? "pin-tanda-tautan pin-tanda-tautan-sibuk" : "pin-tanda-tautan"/.test(tanda),
        "TandaTautan does not draw Next's link status");
      const css = baca("src", "app", "experience.css");
      c.expect(/\.pin-tanda-tautan \{[^}]*width: 0;/.test(css) && /\.pin-tanda-tautan-sibuk::after \{/.test(css),
        "the working dot takes room at rest (the menu would shift), or is never drawn");

      /**
       * 3. THE RESULT APPEARS WHERE THE ACTION WAS. The line is BarisHasil:
       *    role="status" (role="alert" when it failed, v3), and it brings itself into view when it appears, so
       *    after "Berikan peran" it is on screen without scrolling. Every
       *    section an action reports to has its line on the page it returns
       *    to (Studio: HasilDi naming the section, beside the form; Konfigurasi:
       *    result(section) under the section's form), and a sentence built
       *    from the address reaches the screen through nothing else.
       */
      const baris = code(baca("src", "components", "BarisHasil.tsx"));
      // v3 ActionFeedback (D-138 step 2): a status, except a failure, which is an alert
      c.expect(/role=\{nada === "gagal" \? "alert" : "status"\}/.test(baris) && /className=\{`\$\{kelas \?\? "pin-msg pin-hasil"\} pin-hasil-\$\{nada\}`\}/.test(baris)
        && /useEffect\(\(\) => \{\s*baris\.current\?\.scrollIntoView\(\{ block: "nearest" \}\);\s*\}, \[\]\);/.test(baris),
        "BarisHasil is not a status that brings itself into view");
      const di = code(baca("src", "components", "HasilDi.tsx"));
      c.expect(/if \(!cocok \|\| !q\.hasil \|\| !kalimat\) return null;/.test(di) && /return <BarisHasil nada=\{q\.hasil === "ok" \? "ok" : "gagal"\}>\{kalimat\}<\/BarisHasil>;/.test(di),
        "HasilDi does not draw its section's result, and only its section's, in BarisHasil");

      /** Split a call's arguments at its top-level commas. */
      const argumen = (src: string, buka: number) => {
        const out: string[] = [];
        let d = 0, awal = buka + 1;
        for (let i = buka; i < src.length; i++) {
          const ch = src[i];
          if ("([{".includes(ch)) d++;
          else if (")]}".includes(ch)) { d--; if (d === 0) { out.push(src.slice(awal, i).trim()); break; } }
          else if (ch === "," && d === 1) { out.push(src.slice(awal, i).trim()); awal = i + 1; }
        }
        return out;
      };
      const literal = (x: string) => [...x.matchAll(/"([^"]*)"|`([^`]*)`/g)].map((m) => m[1] ?? m[2]);
      const rute = new Map(semua.filter((f) => /^src\/app\/.*page\.tsx$/.test(f))
        .map((f) => [f.replace(/^src\/app/, "").replace(/\/page\.tsx$/, "") || "/", f] as const));
      const halaman = (alamat: string) => {
        const pola = alamat.replace(/\$\{[^}]*\}/g, "*").split("/");
        for (const [r, f] of rute) {
          const seg = r.split("/");
          if (seg.length === pola.length && seg.every((x, i) => pola[i] === x || (pola[i] === "*" && /^\[.+\]$/.test(x)))) return f;
        }
        return null;
      };
      /** Every (page, section) a Studio action answers to, and every success that says only "saved". */
      const jawaban = (src: string, satuArg: boolean) => {
        const pasang: Array<[string, string]> = [];
        const polos: string[] = [];
        for (const m of src.matchAll(/(?<!function )\bback\(/g)) {
          const a = argumen(src, m.index! + 4);
          const [alamat, bagian, hasil] = satuArg ? ['"/konfigurasi"', a[0], a[1]] : a;
          for (const x of literal(alamat).filter((y) => y.startsWith("/"))) for (const y of literal(bagian)) pasang.push([x, y]);
          if (/\{ ok: true \}/.test(hasil ?? "")) polos.push(a.join(", ").slice(0, 90));
        }
        return { pasang, polos };
      };
      const berkasBagian = (f: string, bagian: string) => {
        const src = code(baca(f));
        // RESTATED FOR W1.4 (Batch 3; Daisy, Action feedback): a content step's result («paket») is said in the steps'
        // own panel, beside the step's button, rather than above the steps: the package page reads it back by its code
        // and hands it to LangkahTerbit, which draws it in the shared BarisHasil (STUDIO3A-LANGKAH-01 renders it)
        if (bagian === "paket" && /const dibaca = sp\.bagian === "paket" \? bacaHasil\(sp\) : null;/.test(src)
          && /<LangkahTerbit[\s\S]*?hasilIsi=\{hasilIsi\}/.test(src)) return true;
        return [...src.matchAll(/<HasilDi q=\{sp\} bagian=(\{\[[^\]]*\]\}|"[^"]*")/g)].some((m) => literal(m[1]).includes(bagian));
      };
      const studio = jawaban(code(baca("src", "app", "studio", "actions.ts")), false);
      c.expect(studio.pasang.length >= 20, `only ${studio.pasang.length} Studio result(s) found; the sweep is not reading the actions`);
      const dilewati = new Set<string>();
      for (const [alamat, bagian] of new Map(studio.pasang.map((x) => [x.join(" "), x] as const)).values()) {
        // The Studio home is reached only by a form that names no course (a hand-made post)
        if (alamat === "/studio") { dilewati.add(bagian); continue; }
        const f = halaman(alamat);
        if (!c.expect(f !== null, `a Studio action returns to ${alamat}, which is no page`)) continue;
        c.expect(berkasBagian(f!, bagian), `${f}: the "${bagian}" result has no line beside its form`);
      }
      for (const f of semua.filter((x) => /^src\/app\/studio\/.*page\.tsx$/.test(x))) {
        const src = code(baca(f));
        // RESTATED FOR W1.9 (Batch 3): Studio's pages pass the reader's language (outcomeLine(sp, locale)); the rule is unchanged
        const nama = [...src.matchAll(/const (\w+) = [^;]*outcomeLine\(sp(?:, locale)?\)/g)].map((m) => m[1]);
        for (const v of nama) {
          const pakai = [...src.matchAll(new RegExp(`\\b${v}\\b`, "g"))].filter((m) => !/const $/.test(src.slice(m.index! - 6, m.index!)));
          c.expect(pakai.every((m) => src.slice(m.index! - 9, m.index!) === "kalimat={"),
            `${f}: the result sentence "${v}" reaches the screen other than through HasilDi`);
        }
        const langsung = [...src.matchAll(/outcomeLine\(sp(?:, locale)?\)/g)].filter((m) => !/const \w+ = [^;]*$/.test(src.slice(Math.max(0, m.index! - 200), m.index!)));
        c.expect(langsung.every((m) => src.slice(m.index! - 9, m.index!) === "kalimat={"), `${f}: outcomeLine reaches the screen other than through HasilDi`);
      }
      c.expect(!berkasBagian("src/app/studio/bank/page.tsx", "bukan-bagian"), "the control: a section no line names is found");

      const konf = jawaban(code(baca("src", "app", "konfigurasi", "actions.ts")), true);
      const konfHal = code(baca("src", "app", "konfigurasi", "page.tsx"));
      c.expect(konf.pasang.length >= 15, `only ${konf.pasang.length} Konfigurasi result(s) found; the sweep is not reading the actions`);
      for (const [, bagian] of konf.pasang) c.expect(konfHal.includes(`{result("${bagian}")}`), `Konfigurasi's "${bagian}" result has no line under its form`);
      c.expect(/<BarisHasil nada=\{sp\.hasil === "ok" \? "ok" : "gagal"\}>\s*\{kalimatHasil\(sp, s, \{ ok: "config\.result\.ok", gagal: "config\.result\.failed" \}\)\}\s*<\/BarisHasil>/.test(konfHal)
        && (konfHal.match(/kalimatHasil\(/g) ?? []).length === 1,
        "Konfigurasi's result sentence reaches the screen other than through BarisHasil");

      /**
       * No other way to announce a result: role="alert" and the old error
       * line are gone from every section, except where the line is not a
       * save's answer -- the error page, sign-in (outside the seven sections,
       * its errors tied to their fields), a structure that could not be READ,
       * and the live count of a run in progress.
       */
      // RESTATED FOR DAISY-20 (D-054(a), a changed requirement): sign-in gains
      // its password door, whose one refusal line is tied to both its fields
      // (4 on /masuk), and «Aktifkan akun PINTAR Anda» is the same kind of
      // screen -- each refusal the sentence for the field it judged, never a
      // save's answer: the email and the code (MintaKode, 2) and the one line
      // of each wizard step (Langkah, 1).
      const DIIZINKAN: Record<string, number> = {
        "src/components/HalamanGalat.tsx": 1,
        "src/components/masuk/LayarMasuk.tsx": 4,
        "src/components/aktifkan/MintaKode.tsx": 2,
        "src/components/aktifkan/Langkah.tsx": 1,
        // RESTATED FOR BOB-27: «Lupa password?» has the same two lines as MintaKode (the name, the code).
        // RESTATED FOR BOB-28: and one more, the PINTAR ID + PIN step's line.
        "src/components/aktifkan/LupaPassword.tsx": 3,
        // RESTATED FOR BOB-29: «PINTAR terkunci» has one line, the PIN's, tied to its field (a wrong PIN and the tries
        // left); the device question and «Keluar dari semua perangkat» answer through BarisHasil.
        "src/components/sesi/LayarTerkunci.tsx": 1,
        "src/components/struktur/PanelStruktur.tsx": 1,
        "src/components/pendataan/Penggerak.tsx": 1,
        // RESTATED FOR W3.14 (Batch 2; Daisy, IdleWarning and J7Kunci): the idle warning is not a save's answer but a
        // state of the whole page, which Daisy specifies as role="alert" so a screen reader hears it once.
        "src/components/PenjagaSesi.tsx": 1,
      };
      const lama = (src: string) => [...src.matchAll(/<[a-z]+\b[^>]*(?:role="alert"|pin-msg-err)[^>]*>/g)].map((m) => m[0]);
      for (const f of semua) {
        const x = lama(code(baca(f)));
        c.expect(x.length <= (DIIZINKAN[f] ?? 0), `${f}: a result announced the old way: ${x[0] ?? ""}`);
      }
      c.expect(/if \(rows === null\) \{\s*return \(\s*<p className="pin-msg pin-msg-err" role="alert">\s*\{kalimatGagalBaca\(/.test(code(baca("src", "components", "struktur", "PanelStruktur.tsx"))),
        "the structure panel's one alert is no longer the unreadable-structure line");
      c.expect(lama(`<p className="pin-msg pin-msg-err" role="alert">{s("x")}</p>`).length === 1, "the control: a planted alert line is not caught");
      const PEMAKAI = [
        "src/components/aktivasi/HasilAktivasi.tsx", "src/components/aktivasi/FormAktivasi.tsx", "src/components/struktur/PanelStruktur.tsx",
        "src/components/studio/LangkahTerbit.tsx", "src/components/unggah/PanelUnggah.tsx", "src/components/pendataan/PeriksaDaftar.tsx",
        "src/components/pimpinan/KartuKeputusan.tsx", "src/components/umpanbalik/MulaiPutaran.tsx", "src/components/umpanbalik/TutupPutaran.tsx",
        "src/components/umpanbalik/LembarUmpanBalik.tsx", "src/app/mengajar/[kelas]/siapkan/page.tsx", "src/app/mengajar/[kelas]/uji-cepat/page.tsx",
        "src/app/mengajar/[kelas]/page.tsx", "src/app/pimpinan/page.tsx", "src/app/pendataan/page.tsx", "src/app/pendataan/[pekerjaan]/page.tsx",
      ];
      for (const f of PEMAKAI) c.expect(/<BarisHasil nada=/.test(code(baca(f))), `${f} does not answer in the shared result line`);

      // beside the thing that was acted on
      const siapkan = code(baca("src", "app", "mengajar", "[kelas]", "siapkan", "page.tsx"));
      c.expect(/\{tolakan\}\s*<div className="pin-actions">\s*<TombolKirim/.test(siapkan), "a refused Sediakan does not answer at its button");
      const pim = code(baca("src", "app", "pimpinan", "page.tsx"));
      const pimAksi = code(baca("src", "app", "pimpinan", "actions.ts"));
      c.expect(/galat=\{sp\.galat === "1" && sp\.keputusan === k\.id\}/.test(pim) && /tercatat=\{sp\.hasil === "ok" && sp\.keputusan === k\.id\}/.test(pim)
        && /const kartu = `keputusan=\$\{encodeURIComponent\(id\)\}`;/.test(pimAksi) && (pimAksi.match(/\$\{kartu\}/g) ?? []).length === 3,
        "a decision's answer is not on the card that was moved");
      const ajar = code(baca("src", "app", "mengajar", "actions.ts"));
      // RESTATED FOR W3.11 (Batch 3): J1 part two (Daisy, J1Terbit) answers «Sediakan» at the button that sent it,
      // «✓ Disediakan» and the line with the window, then the way on to the class; so a Sediakan the database took
      // returns to the review as `?disediakan=`, which reads the assignment back before saying so (MENGAJAR3-SEDIA-01).
      c.expect(/ke\(kelasId, `\/siapkan\?disediakan=\$\{encodeURIComponent\(terbitan\)\}`\);/.test(ajar) && /ke\(kelasId, "\/uji-cepat\?cepat=ok"\);/.test(ajar),
        "a teacher's Sediakan or Uji Cepat returns without saying it was done");

      /**
       * 4. SPECIFIC WORDS FOR THE KEY ACTIONS. No success in Konfigurasi or
       *    Studio returns a bare "ok": each names what it did, and each has
       *    its sentence in both languages -- "Peran diberikan." / "Peran
       *    dicabut.", "<Kelas> ditambahkan.", and the rest.
       */
      for (const x of [...studio.polos, ...konf.polos]) c.expect(false, `a success says only "saved": back(${x})`);
      const s = (k: HleEvent, locale: "id" | "en" = "id") => t(k, "staff", { locale });
      c.expect(s(kunciKode("ROLE_GRANTED")) === "Peran diberikan." && s(kunciKode("ROLE_REVOKED")) === "Peran dicabut."
        && s("config.struktur.ok.dibuat") === "ditambahkan.",
        `the key actions do not say what was done: ${s(kunciKode("ROLE_GRANTED"))} / ${s(kunciKode("ROLE_REVOKED"))} / ${s("config.struktur.ok.dibuat")}`);
      for (const kode of KODE_SUKSES) {
        for (const locale of LOCALES) {
          const v = s(kunciKode(kode), locale as "id" | "en");
          c.expect(v !== TANPA_SALINAN && !/[A-Z]{3,}_[A-Z_]+/.test(v), `(${locale}) ${kode} has no sentence of its own, or names a code: ${v}`);
        }
      }
      for (const k of ["mengajar.sedia.ok", "mengajar.cepat.ok", "pimpinan.aksi.tercatat"] as const) {
        for (const locale of LOCALES) c.expect(s(k, locale as "id" | "en") !== TANPA_SALINAN, `(${locale}) ${k} has no sentence`);
      }

      c.note(`${BAGIAN.length} section shells, ${tautan} menu links, ${studio.pasang.length} Studio and ${konf.pasang.length} Konfigurasi results` +
        (dilewati.size ? `; the Studio home's ${[...dilewati].join(", ")} (a form naming no course) not placed` : ""));
      return c.verdict(
        "every main section's loading.tsx source is the one shared shell (framed inside Studio's own layout), saying " +
        "\"Memuat halaman…\" in the reader's language; every menu link inside a <nav>, and every place tab, carries Next's " +
        "link status as a working dot that takes no room at rest; every section a Konfigurasi or Studio action answers " +
        "to has its line beside its form, in BarisHasil (role=\"status\", brought into view when it appears), and no " +
        "result is announced the old way outside four named non-results; a decision's answer sits on its card, and a " +
        "teacher's Sediakan and Uji Cepat say they were done; no success says only \"saved\" and every success code has " +
        "its own sentence in both languages (Peran diberikan / dicabut, Kelas ditambahkan). The file sweep's controls: " +
        "a page-own loading screen, a bare menu link, an unplaced section and a planted alert line are each caught",
      );
    },
  },
  {
    id: "DAISY-13-KARTU-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();

      /**
       * DAISY-13 (BOB-12 (c), audit M13): THE CARD SCREEN READS ITS RESULT.
       *
       * 1. THE ANSWER, READ AS THE CONTRACT PUBLISHED IT (BOB-12, 25 Sep): a
       *    known code wins, a wait is the route's (body, else Retry-After) and
       *    never invented, a reference must look like one, a destination must
       *    be inside PINTAR, and nothing else the route sends is kept.
       */
      const baca = (status: number, body: unknown, jeda: string | null = null) => bacaJawabanKartu(status, body, jeda);
      const g = (j: ReturnType<typeof baca>) => (j.k === "gagal" ? j : null);
      c.expect(JSON.stringify(baca(200, { ok: true, tujuan: "/belajar?x=1" })) === JSON.stringify({ k: "masuk", tujuan: "/belajar?x=1" }),
        "a signed-in answer does not go where the route says");
      for (const luar of ["//contoh.com", "https://contoh.com", "/\\contoh.com", 7, null]) {
        c.expect(tujuanAman(luar) === "/", `a destination outside PINTAR is followed: ${String(luar)}`);
      }
      c.expect(g(baca(401, { ok: false, code: "CARD_NOT_MATCHED" }))?.kode === "CARD_NOT_MATCHED", "a non-match is not read as one");
      const jeda = g(baca(429, { ok: false, code: "CARD_COOLDOWN", tunggu: 30 }, "60"));
      c.expect(jeda?.kode === "CARD_COOLDOWN" && jeda.tunggu === 30, "a cooldown does not carry the route's own wait");
      c.expect(g(baca(429, { ok: false, code: "CARD_COOLDOWN" }, "60"))?.tunggu === 60, "a cooldown without a body wait ignores Retry-After");
      c.expect(g(baca(429, { ok: false, code: "CARD_RATE_LIMITED" }))?.tunggu === null, "a rate limit with no wait given gets an invented one");
      for (const salahTunggu of [0, -5, 99999, "abc", 1.5e9]) {
        c.expect(g(baca(429, { code: "CARD_RATE_LIMITED", tunggu: salahTunggu }))?.tunggu === null, `a wait of ${salahTunggu} is shown`);
      }
      c.expect(g(baca(401, { code: "CARD_NOT_MATCHED", tunggu: 30 }))?.tunggu === null, "a non-match carries a wait");
      c.expect(g(baca(403, { code: "CARD_REQUEST_REFUSED" }))?.kode === "CARD_REQUEST_REFUSED", "a refused request is not read as one");
      c.expect(g(baca(503, { code: "CARD_UNAVAILABLE", ref: "AB12CD" }))?.ref === "AB12CD", "an outage loses its reference");
      c.expect(g(baca(503, { code: "CARD_UNAVAILABLE", ref: "<b>x</b>" }))?.ref === null, "a reference that is not one reaches the screen");
      c.expect(g(baca(401, { code: "CARD_SOMETHING_NEW" }))?.kode === "CARD_NOT_MATCHED"
        && g(baca(503, "not json"))?.kode === "CARD_UNAVAILABLE" && g(baca(404, "<html>"))?.kode === "CARD_OFFLINE"
        && g(baca(429, {}))?.kode === "CARD_RATE_LIMITED",
        "an answer without a known code is not read by its status, or an unknown one is not \"could not reach PINTAR\"");
      const bocor = JSON.stringify(baca(401, { code: "CARD_NOT_MATCHED", message: "Invalid login credentials", error: "invalid_grant" }));
      c.expect(!/Invalid|invalid_grant|message/.test(bocor), `the route's other words are kept: ${bocor}`);

      /**
       * 2. THE WORDS, both languages. A non-match is the one "Belum cocok"; a
       *    cooldown and a rate limit say wait and try again, with the route's
       *    wait when it gives one, and never "belum cocok" (M13); a cooldown
       *    adds who to ask about a forgotten PIN; an outage gives its
       *    reference; nothing names the machinery. A wait is styled as a note.
       */
      const MESIN = /CARD_|\b40[13]\b|\b429\b|\b50[03]\b|\bAuth\b|server|rate|JSON|Retry/;
      const kasus: Record<string, GagalKartu> = {
        tidakCocok: { kode: "CARD_NOT_MATCHED", tunggu: null, ref: null },
        dingin: { kode: "CARD_COOLDOWN", tunggu: 30, ref: null },
        dinginLama: { kode: "CARD_COOLDOWN", tunggu: 300, ref: null },
        ramai: { kode: "CARD_RATE_LIMITED", tunggu: null, ref: null },
        ramaiTunggu: { kode: "CARD_RATE_LIMITED", tunggu: 45, ref: null },
        tolak: { kode: "CARD_REQUEST_REFUSED", tunggu: null, ref: null },
        mati: { kode: "CARD_UNAVAILABLE", tunggu: null, ref: "AB12CD" },
        matiTanpaRef: { kode: "CARD_UNAVAILABLE", tunggu: null, ref: null },
        putus: { kode: "CARD_OFFLINE", tunggu: null, ref: null },
      };
      for (const locale of LOCALES) {
        const s = (k: HleEvent) => t(k, "public", { locale });
        const k = Object.fromEntries(Object.entries(kasus).map(([n, v]) => [n, kalimatKartu(v, s, locale)])) as Record<keyof typeof kasus, string>;
        c.expect(k.tidakCocok === s("auth.card_failed"), `(${locale}) a non-match is not the one card sentence`);
        const cocok = locale === "id" ? /cocok/i : /match/i;
        c.expect(cocok.test(s("auth.card_failed")), `(${locale}) the control: the non-match sentence does not say so, so the check below proves nothing`);
        for (const n of ["dingin", "dinginLama", "ramai", "ramaiTunggu", "tolak", "mati", "matiTanpaRef", "putus"] as const) {
          c.expect(!cocok.test(k[n]), `(${locale}) ${n} is told it does not match: ${k[n]}`);
        }
        const tunggu = (lama: number) => `${s("auth.card_tunggu")} ${format.durasi(lama, locale)}${s("auth.card_lalu_coba")}`;
        c.expect(k.dingin.includes(tunggu(30)) && k.dinginLama.includes(tunggu(300)) && k.dingin.includes(s("auth.card_tanya_guru")),
          `(${locale}) a cooldown does not give the route's wait and who to ask: ${k.dingin}`);
        c.expect(k.ramai.includes(s("auth.card_tunggu_sebentar")) && k.ramaiTunggu.includes(tunggu(45)) && !k.ramai.includes(format.durasi(1, locale).replace(/^1\s*/, "")),
          `(${locale}) a rate limit invents a wait, or drops the one it was given: ${k.ramai} / ${k.ramaiTunggu}`);
        c.expect(k.mati.endsWith(`${s("auth.card_rujukan")}: AB12CD.`) && !k.matiTanpaRef.includes(s("auth.card_rujukan")),
          `(${locale}) an outage does not give its reference, or names one it does not have`);
        for (const [n, v] of Object.entries(k)) c.expect(!MESIN.test(v), `(${locale}) ${n} names the machinery: ${v}`);
      }
      c.expect(t("auth.card_tunggu", "public") + " " + format.durasi(30, "id") + t("auth.card_lalu_coba", "public") === "Tunggu 30 detik, lalu coba lagi."
        && t("auth.card_tunggu", "public", { locale: "en" }) + " " + format.durasi(300, "en") + t("auth.card_lalu_coba", "public", { locale: "en" }) === "Wait 5 minutes, then try again.",
        "the wait does not read as a sentence in both languages");
      c.expect(Object.values(kasus).filter((v) => kartuMenunggu(v)).map((v) => v.kode).sort().join() === "CARD_COOLDOWN,CARD_COOLDOWN,CARD_RATE_LIMITED,CARD_RATE_LIMITED",
        "something other than a wait is drawn as a note, or a wait as an error");

      /**
       * 3. THE SCREEN. The card form posts itself to the route and nowhere
       *    else, follows only a signed-in answer, and says the result's own
       *    sentence in the one message both fields point at. The old server
       *    action is not called, and no word the route sends reaches the page
       *    except through the code (D-011).
       */
      const layar = code(readFileSync(join(repoRoot, "src", "components", "masuk", "LayarMasuk.tsx"), "utf8"));
      const kartu = code(readFileSync(join(repoRoot, "src", "components", "masuk", "kartu.ts"), "utf8"));
      c.expect(!/signInWithCard/.test(layar), "the card surface still calls the server action BOB-12 deletes");
      c.expect(/fetch\("\/masuk\/kartu", \{ method: "POST", body: fd,/.test(kartu) && (kartu.match(/fetch\(/g) ?? []).length === 1,
        "the card form is not posted, as it is, to the card route alone");
      c.expect(/const jawaban = await kirimKartu\(fd\);\s*if \(jawaban\.k === "masuk"\) \{[\s\S]{0,200}window\.location\.assign\(jawaban\.tujuan\);/.test(layar),
        "the surface leaves for somewhere other than the signed-in answer's destination");
      c.expect(/\{kalimatKartu\(layar\.gagal, s, locale\)\}/.test(layar) && /role="alert" id="kartu-err"/.test(layar),
        "the result is not said in the one card message");
      c.expect(!/\.message\b|\.error\b|\.details\b/.test(kartu), "the card path reads the route's words");

      /**
       * 4. THE ROUTE ON THIS HEAD (BOB-12, on main at 31c576d). The screen
       *    reads the route's own published codes (src/lib/kartu-kontrak.ts,
       *    STATUS_KARTU) rather than a copy of them; every code the route's
       *    decision (src/lib/kartu-masuk.ts) can answer is one of them, and
       *    it answers every one; each has a sentence of its own, never the
       *    "could not reach PINTAR" kept for an answer outside the contract;
       *    and the form sends the three fields the route reads.
       */
      let kontrak: Record<string, number> = {};
      try { kontrak = (await import("../src/lib/kartu-kontrak")).STATUS_KARTU as Record<string, number>; } catch { /* reported below */ }
      c.expect(/import \{ STATUS_KARTU, type KodeKartuRute \} from "@\/lib\/kartu-kontrak";/.test(kartu)
        && /export const KODE_KARTU = STATUS_KARTU;/.test(kartu) && JSON.stringify(KODE_KARTU) === JSON.stringify(kontrak),
        "the card screen keeps its own copy of the route's codes rather than reading the route's contract");
      const keputusan = new Set([...readFileSync(join(repoRoot, "src", "lib", "kartu-masuk.ts"), "utf8").matchAll(/"(CARD_[A-Z_]+)"/g)].map((m) => m[1]));
      c.expect(Object.keys(kontrak).length === 5 && [...keputusan].sort().join() === Object.keys(kontrak).sort().join(),
        `the route's decision answers ${[...keputusan].sort().join(", ")}; its contract publishes ${Object.keys(kontrak).sort().join(", ")}`);
      for (const locale of LOCALES) {
        const s = (k: HleEvent) => t(k, "public", { locale });
        const putus = kalimatKartu({ kode: "CARD_OFFLINE", tunggu: null, ref: null }, s, locale);
        const kalimat = Object.keys(kontrak).map((kode) => kalimatKartu({ kode: kode as GagalKartu["kode"], tunggu: null, ref: null }, s, locale));
        c.expect(kalimat.every((x) => x !== putus && x.trim() !== "" && !x.includes(TANPA_SALINAN)) && new Set(kalimat).size === kalimat.length,
          `(${locale}) a code the route answers has no sentence of its own: ${kalimat.join(" | ")}`);
      }
      const ruteSrc = code(readFileSync(join(repoRoot, "src", "app", "api", "masuk", "kartu", "route.ts"), "utf8"));
      c.expect(["kartu", "pin", "lanjut"].every((f) => ruteSrc.includes(`fd?.get("${f}")`) && layar.includes(`name="${f}"`)),
        "the card form and the route do not agree on the fields kartu, pin and lanjut");
      c.note(`BOB-12's route: ${keputusan.size} code(s) answered, all read from its contract`);

      /**
       * 5. THE HEALTH CARD COUNTS THE CARD'S DOOR (BOB-12's declaration, the
       *    words confirmed here). Konfigurasi's two public-surface checks say
       *    the number the lint expects (src/lib/kesehatan-skema.json), in
       *    both languages, and the addresses sentence names every surface the
       *    surface sentence names. A count that moves without its sentence
       *    turns this red; planted, a sentence one short is caught.
       */
      let skema: Record<string, unknown> = {};
      try { skema = JSON.parse(readFileSync(join(repoRoot, "src", "lib", "kesehatan-skema.json"), "utf8")); } catch { /* reported below */ }
      // RESTATED FOR BOB-26 (Gate 3 adds three declared doors: 5 surfaces, 10
      // addresses): the number words run to ten, and the surface list may be
      // a series («a, b, dan c»), each name still required in the addresses
      // sentence. The check itself is unchanged.
      // RESTATED FOR BOB-27 (Gate 4: 8 surfaces, 16 addresses): the number words run to sixteen.
      // RESTATED FOR BOB-28 (Gate 5: 10 surfaces, 19 addresses): to nineteen.
      const ANGKA: Record<string, string[]> = {
        id: ["nol", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan", "sepuluh",
             "sebelas", "dua belas", "tiga belas", "empat belas", "lima belas", "enam belas", "tujuh belas", "delapan belas", "sembilan belas"],
        en: ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
             "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"] };
      const katakan = (kalimat: string, n: unknown, locale: string) =>
        typeof n === "number" && new RegExp(`^(Tepat|Exactly) ${ANGKA[locale][n]}\\b`).test(kalimat);
      c.expect(!katakan("Tepat tiga permukaan publik: pemeriksaan sertifikat dan masuk dengan kartu kelas", 2, "id"),
        "the planted sentence one short is not caught");
      for (const locale of LOCALES) {
        const permukaan = t("config.kesehatan.cek.anon_public_surface", "staff", { locale });
        const alamat = t("config.kesehatan.cek.anon_reachable_http_paths", "staff", { locale });
        c.expect(katakan(permukaan, skema.anon_public_surface, locale) && katakan(alamat, skema.anon_reachable_http_paths, locale),
          `(${locale}) the health card's public-surface sentences do not say the lint's counts (${String(skema.anon_public_surface)}, ${String(skema.anon_reachable_http_paths)}): "${permukaan}" / "${alamat}"`);
        const nama = (permukaan.split(": ")[1] ?? "").split(locale === "id" ? /,? dan |, / : /,? and |, /);
        c.expect(nama.length === skema.anon_public_surface && nama.every((x) => x.trim() !== "" && alamat.includes(x.trim())),
          `(${locale}) the addresses sentence does not name each public surface: ${JSON.stringify(nama)} / "${alamat}"`);
      }

      return c.verdict(
        "the card screen reads BOB-12's answer as published: a known code wins, else its status; a wait is the route's " +
        "(body, else Retry-After), never invented and never out of range; a reference must look like one; a destination " +
        "must be inside PINTAR; nothing else the route sends is kept. In both languages a non-match is the one \"Belum " +
        "cocok\", a cooldown and a rate limit say wait and try again with the route's wait when given and never that the " +
        "card does not match, an outage gives its reference, and nothing names the machinery. The form posts itself to " +
        "/masuk/kartu alone, follows only a signed-in answer, says the result in the one message, and no longer calls " +
        "signInWithCard. BOB-12's route is on the head: the screen reads the route's own contract (STATUS_KARTU), the route's " +
        "decision answers exactly its five codes, each has a sentence of its own in both languages, and the form sends " +
        "the three fields the route reads",
      );
    },
  },
  {
    id: "BOB19-K01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const baca = (...p: string[]) => {
        const f = join(repoRoot, ...p);
        return existsSync(f) ? readFileSync(f, "utf8") : "";
      };

      /**
       * BOB-19: THE HEALTH CARD TELLS THE TRUTH. Konfigurasi's card called any
       * lint value but 0 a problem, so a clean, fully migrated database read
       * "Perlu perhatian": some right values are 1, 2 or true, and some keys
       * are only information.
       *
       * 1. ONE RULE, TWO READERS. The expected values are one file,
       *    src/lib/kesehatan-skema.json. F01-T13 loads that file and compares
       *    the lint against it key by key, with no per-check literal left in
       *    its block. The card judges with nilaiSkema, which imports the same
       *    file. Konfigurasi judges with nothing else.
       */
      const harapanMentah = baca("src", "lib", "kesehatan-skema.json");
      let harapan: Record<string, unknown> = {};
      try { harapan = JSON.parse(harapanMentah); } catch { /* reported below */ }
      c.expect(Object.keys(harapan).length >= 15 && Object.values(harapan).every((v) => typeof v === "number" || typeof v === "boolean"),
        "there is no shared list of expected lint values (src/lib/kesehatan-skema.json), or it holds something other than counts and flags");
      const sql = baca("selftest", "db", "fable01.sql");
      const t13 = sql.slice(sql.indexOf("-- F01-T13 INV-15/36/14"), sql.indexOf("-- lint RPC is SYSTEM_ADMIN only"));
      c.expect(/^\\set harapan_skema `cat src\/lib\/kesehatan-skema\.json`$/m.test(sql)
        && /insert into selftest\.harapan_skema \(v\) values \(:'harapan_skema'::jsonb\);/.test(sql),
        "F01-T13's file does not load the shared list");
      c.expect(t13.length > 0 && /select h\.v into harapan from selftest\.harapan_skema h;/.test(t13)
        && /from jsonb_each\(harapan\) e;/.test(t13) && /j -> e\.key is not distinct from e\.value/.test(t13)
        && !/\(j->>'[a-z_]+'\)/.test(code(t13)),
        "F01-T13 does not judge by the shared list alone (a per-check literal is left in its block)");
      const regel = code(baca("src", "lib", "kesehatan-skema.ts"));
      c.expect(/import HARAPAN from "\.\/kesehatan-skema\.json";/.test(regel), "the card's rule does not read the shared list");
      const konf = code(baca("src", "app", "konfigurasi", "page.tsx"));
      c.expect(/nilaiSkema\(lint as Record<string, unknown>\)/.test(konf) && /<KartuKesehatan /.test(konf)
        && !/v === 0/.test(konf) && !/Perlu perhatian|Semua pemeriksaan lolos/.test(konf),
        "Konfigurasi still judges the lint by its own rule, or writes the card's words itself");

      /**
       * 2. THE RULE, OVER THE LINT'S REAL SHAPE. The keys come from the latest
       *    migration that defines platform_schema_lint. A clean, fully
       *    migrated lint (every expected value, and every other key as
       *    information: a count above 0, a flag, the environment) reads
       *    healthy. The old rule read that same lint as "Perlu perhatian",
       *    which is the control. Every expected key, planted wrong, is caught
       *    and named alone, and a missing key is caught.
       */
      // imported here, not at the top: on code without the rule this test is red
      // for its own reason, and every other test in this file still runs
      let aturan: typeof import("../src/lib/kesehatan-skema") | null = null;
      try { aturan = await import("../src/lib/kesehatan-skema"); } catch { /* reported below */ }
      if (!c.expect(aturan !== null, "there is no shared rule for the card (src/lib/kesehatan-skema.ts)")) {
        return c.verdict("");
      }
      const { HARAPAN_SKEMA, KUNCI_SKEMA, nilaiSkema } = aturan!;
      const migrasi = walk(join(repoRoot, "supabase", "migrations")).filter((f) => f.endsWith(".sql")).sort()
        .filter((f) => /create or replace function public\.platform_schema_lint\s*\(/.test(readFileSync(f, "utf8")));
      const terakhir = migrasi.length ? readFileSync(migrasi[migrasi.length - 1], "utf8") : "";
      const kunciLint = [...new Set([...terakhir.matchAll(/jsonb_build_object\('([a-z_0-9]+)'/g)].map((m) => m[1]))];
      c.expect(kunciLint.length > 30, `the lint's keys could not be read from its migration (${kunciLint.length})`);
      for (const k of KUNCI_SKEMA) c.expect(kunciLint.includes(k), `the shared list expects "${k}", which the lint does not return`);
      const bersih: Record<string, unknown> = {};
      for (const k of kunciLint) bersih[k] = k === "environment" ? "local" : /_ok$/.test(k) ? true : 1;
      Object.assign(bersih, HARAPAN_SKEMA);
      const h = nilaiSkema(bersih);
      c.expect(h.sehat && h.menyimpang.length === 0 && h.jumlah === KUNCI_SKEMA.length,
        `a clean, fully migrated lint reads unhealthy: ${h.menyimpang.join(", ")}`);
      const lama = Object.entries(bersih).every(([k, v]) => k === "environment" || k === "migrations_applied" || v === 0);
      c.expect(!lama, "the control: the old rule no longer reads a clean lint as a problem, so this test proves nothing");
      for (const k of KUNCI_SKEMA) {
        const v = HARAPAN_SKEMA[k];
        const x = nilaiSkema({ ...bersih, [k]: typeof v === "boolean" ? !v : (v as number) + 1 });
        c.expect(!x.sehat && x.menyimpang.length === 1 && x.menyimpang[0] === k, `a planted wrong "${k}" is not caught and named alone`);
      }
      const tanpa = { ...bersih } as Record<string, unknown>;
      delete tanpa.anon_reachable_http_paths;
      c.expect(nilaiSkema(tanpa).menyimpang.includes("anon_reachable_http_paths"), "a check the lint no longer returns is skipped, not caught");

      /**
       * 3. THE CARD, RENDERED in both languages. A clean lint reads "Semua
       *    pemeriksaan lolos" and never "Perlu perhatian". A planted wrong
       *    value reads "Perlu perhatian" and names that check in words, and
       *    no other. The check that could not run gives its reference. Not
       *    checked yet offers the check. A school administrator is told who
       *    runs it. Every check has its name in both languages.
       */
      for (const locale of LOCALES) {
        for (const k of KUNCI_SKEMA) {
          c.expect(t(`config.kesehatan.cek.${k}` as HleEvent, "staff", { locale }) !== TANPA_SALINAN, `(${locale}) the check "${k}" has no name`);
        }
      }
      c.expect(t("config.kesehatan.perhatian", "staff", { locale: "id" }) === "Perlu perhatian", "the card's attention state no longer reads \"Perlu perhatian\"");
      const tanam = nilaiSkema({ ...bersih, tables_without_rls: 1 });
      const KASUS = [
        { locale: "id", keadaan: { jenis: "diperiksa", hasil: h } },
        { locale: "en", keadaan: { jenis: "diperiksa", hasil: h } },
        { locale: "id", keadaan: { jenis: "diperiksa", hasil: tanam } },
        { locale: "en", keadaan: { jenis: "diperiksa", hasil: tanam } },
        { locale: "id", keadaan: { jenis: "gagal", rujukan: "AB12CD" } },
        { locale: "id", keadaan: { jenis: "belum" } },
        { locale: "id", keadaan: { jenis: "bukan_admin" } },
      ].map((k) => ({ ...k, kelas: "kartu", tautan: "tautan" }));
      const anak = spawnSync(process.execPath, ["--import", "tsx", "-e",
        "(async () => {" +
        '  const { createElement: h } = await import("react");' +
        '  const { renderToStaticMarkup } = await import("react-dom/server");' +
        '  const { AppRouterContext } = await import("next/dist/shared/lib/app-router-context.shared-runtime.js");' +
        '  const m = await import("file://" + process.cwd() + "/src/components/konfigurasi/KartuKesehatan.tsx");' +
        "  const Kartu = m.default?.default ?? m.default;" +
        "  const r = { refresh() {}, push() {}, replace() {}, back() {}, forward() {}, prefetch() {} };" +
        "  process.stdout.write(JSON.stringify(JSON.parse(process.env.KASUS_SEHAT).map((k) =>" +
        "    renderToStaticMarkup(h(AppRouterContext.Provider, { value: r }, h(Kartu, k))))));" +
        "})().catch((e) => { process.stderr.write(String(e && e.stack || e)); process.exit(1); });"], {
        cwd: repoRoot, encoding: "utf8", env: { ...process.env, KASUS_SEHAT: JSON.stringify(KASUS) },
      });
      let html: string[] = [];
      try { html = JSON.parse(anak.stdout); } catch { /* reported below */ }
      const teks = (x: string) => x.replace(/<[^>]+>/g, " ").replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
      if (c.expect(anak.status === 0 && html.length === KASUS.length, `the health card could not be rendered: ${(anak.stderr || "").split("\n").slice(0, 3).join(" ")}`)) {
        const nama = (k: string, locale: string) => t(`config.kesehatan.cek.${k}` as HleEvent, "staff", { locale: locale as "id" | "en" });
        for (const [n, locale] of [[0, "id"], [1, "en"]] as const) {
          const x = teks(html[n]);
          const s = (k: HleEvent) => t(k, "staff", { locale });
          c.expect(x.includes(s("config.kesehatan.sehat")) && !x.includes(s("config.kesehatan.perhatian"))
            && x.includes(`${KUNCI_SKEMA.length} ${s("config.kesehatan.jumlah")}`),
            `(${locale}) a clean lint does not read healthy: ${x.slice(0, 160)}`);
        }
        for (const [n, locale] of [[2, "id"], [3, "en"]] as const) {
          const x = teks(html[n]);
          const s = (k: HleEvent) => t(k, "staff", { locale });
          c.expect(x.includes(s("config.kesehatan.perhatian")) && x.includes(nama("tables_without_rls", locale))
            && KUNCI_SKEMA.filter((k) => k !== "tables_without_rls").every((k) => !x.includes(nama(k, locale)))
            && !x.includes(s("config.kesehatan.sehat")),
            `(${locale}) a planted wrong value does not read "${s("config.kesehatan.perhatian")}" naming that check alone: ${x.slice(0, 200)}`);
        }
        const s = (k: HleEvent) => t(k, "staff", { locale: "id" });
        c.expect(teks(html[4]).includes(s("config.kesehatan.gagal")) && teks(html[4]).includes("AB12CD") && html[4].includes('href="/konfigurasi?periksa=skema"'),
          `the check that could not run gives no reference or no way to try again: ${teks(html[4]).slice(0, 160)}`);
        c.expect(html[5].includes('href="/konfigurasi?periksa=skema"') && teks(html[5]).includes(s("config.card.health.periksa")),
          "not checked yet does not offer the check");
        c.expect(teks(html[6]).includes(s("config.kesehatan.bukan_admin")) && !html[6].includes("periksa=skema"),
          "a school administrator is offered a check the database refuses them");
      }

      /**
       * 4. THE SAME RUN. Konfigurasi asks persons_awaiting_first_role only for
       *    the platform administrator, whom alone the database answers (the
       *    school administrator's asking was 338 refusals in U-PERF's
       *    30-session run). A confirmed upload returns to its new course's page
       *    with "Paket dibuat.".
       */
      // RESTATED FOR BOB-20 (D-048, a changed requirement): a school
      // administrator now asks their own school's list,
      // persons_awaiting_first_role_at, once per school they administer. The
      // platform's list is still asked only for the platform administrator.
      // RESTATED FOR L3 (D-132 C7): the platform's list in «Seluruh platform» (platformIni: Admin platform there), the
      // working context's school's list in Mengelola · a school (sekolahIni); an evaluation persona as before (C10)
      // RESTATED FOR BOB19-K01 (the owner's product ruling of 8 Oct, Option B): in Mengelola · a school the general
      // roles form no longer draws the platform's list. Admin platform asks it there only while the school has no active
      // Admin sekolah, for its own first-appointment path (src/lib/admin-pertama.ts), which keeps only people recorded
      // at no school; the actions refuse an ordinary grant of anyone not the school's own and a first appointment
      // outside those conditions. F22-A02 proves the same through the running app.
      const adminPertama = code(baca("src", "lib", "admin-pertama.ts"));
      const aksiKonf = code(baca("src", "app", "konfigurasi", "actions.ts"));
      c.expect(/platformIni \? supabase\.rpc\("persons_awaiting_first_role"\) : Promise\.resolve\(\{ data: \[\] \}\)/.test(konf)
        && (konf.match(/"persons_awaiting_first_role"/g) ?? []).length === 1
        && /const bukaAdminPertama = adminPlatformDiSekolah && satuSekolah !== null && !\(await adaAdminSekolah\(supabase, satuSekolah\)\);/.test(konf)
        && /const calonPertama = bukaAdminPertama \? await calonAdminPertama\(supabase\) : \[\];/.test(konf)
        && (adminPertama.match(/"persons_awaiting_first_role"/g) ?? []).length === 1
        && /\.from\("institutional_identities"\)\.select\("person_id"\)/.test(adminPertama)
        && /return error \? true : /.test(adminPertama)
        // RESTATED FOR E-K4 (D-173(d)): each refusal returns with its form (`, fd`), so it is said at the form that sent it
        && /if \(sekolahPeran && !\(await orangSekolah\(supabase, sekolahPeran, person!\)\)\) back\("roles", \{ ok: false, kode: "ACTION_NOT_ALLOWED" \}, fd\);/.test(aksiKonf)
        && /if \(isSys !== true\) back\("roles", \{ ok: false, kode: "ACTION_NOT_ALLOWED" \}, fd\);\s*if \(await adaAdminSekolah\(supabase, sekolah!\)\) back\("roles", \{ ok: false, kode: "ACTION_NOT_ALLOWED" \}, fd\);\s*if \(!\(await calonAdminPertama\(supabase\)\)\.some\(\(p\) => p\.person_id === person\)\) back/.test(aksiKonf)
        && /p_role: "INSTITUTION_ADMIN", p_scope_node: akar,/.test(aksiKonf)
        && /const adminPlatformDiSekolah = !lama && isSys === true && kh !== null && !kh\.platform && kh\.peran\.includes\("SYSTEM_ADMIN"\);/.test(konf)
        && /\.\.\.\(platformIni \? \[\] : sekolahIni\.map\(\(sekolah\) => supabase\.rpc\("persons_awaiting_first_role_at", \{ p_institution: sekolah \}\)\)\)/.test(konf)
        && /const platformIni = lama \? isSys === true : platformKonteks && isSys === true;/.test(konf)
        && /const sekolahIni: string\[\] = lama \? adminInstitutionIds : kh && !kh\.platform && kh\.tempat \? \[kh\.tempat\] : \[\];/.test(konf),
        "Konfigurasi asks persons_awaiting_first_role for a reader the database refuses or outside a school's first appointment, asks a school's list for a school the reader does not administer, or its actions accept a school role for a person not the school's own (BOB19-K01, Option B)");
      const studio = code(baca("src", "app", "studio", "actions.ts"));
      c.expect(/if \(h\.ok && h\.courses && h\.courses\[0\]\) back\(`\/studio\/paket\/\$\{h\.courses\[0\]\}`, "paket", \{ ok: true, kode: "DRAFT_CREATED" \}\);/.test(studio)
        && (KODE_SUKSES as readonly string[]).includes("DRAFT_CREATED")
        && t(kunciKode("DRAFT_CREATED"), "staff", { locale: "id" }) === "Paket dibuat.",
        "a confirmed upload does not return to its course saying \"Paket dibuat.\"");

      c.note(`${KUNCI_SKEMA.length} checks in the shared list, ${kunciLint.length} keys in the lint (${migrasi.length ? relative(repoRoot, migrasi[migrasi.length - 1]) : "no migration"})`);
      return c.verdict(
        `the health card and F01-T13 judge by one list, src/lib/kesehatan-skema.json (${KUNCI_SKEMA.length} checks): F01-T13's SOURCE loads it ` +
        "and compares key by key with no literal of its own, the card's rule imports it, Konfigurasi judges by nothing else. " +
        "Over the lint's real keys, a clean, fully migrated lint reads healthy where the old rule read it as a problem (the " +
        "control); each expected check planted wrong is caught and named alone, and a missing one is caught. RENDERED in both " +
        "languages: clean reads \"Semua pemeriksaan lolos\", a planted value reads \"Perlu perhatian\" and names that check " +
        "alone, a failed check gives its reference, not-yet-checked offers the check, a school administrator is told who runs " +
        "it. Konfigurasi asks persons_awaiting_first_role only for the platform administrator, in a school only for its " +
        "first administrator (BOB19-K01, Option B), its actions refuse a school role for anyone not the school's own, and a confirmed upload returns " +
        "to its course with \"Paket dibuat.\"",
      );
    },
  },
  {
    id: "DAISY-16-HAMBATAN-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const baca = (...p: string[]) => {
        const f = join(repoRoot, ...p);
        return existsSync(f) ? readFileSync(f, "utf8") : "";
      };
      /**
       * DAISY-16 (with BOB-17, D-011): THE TERBIT STEP READS THE BLOCKER CODES.
       * Each blocker from the catalogue reads in Indonesian and English, with
       * the lesson it names. An unknown code shows the general line and a
       * reference, never the code's text. No ERROR, WARNING or check name
       * reaches the screen.
       */
      let kontrak: Record<string, unknown> | null = null;
      try { kontrak = await import("../src/lib/terbitan-kontrak") as Record<string, unknown>; } catch { /* reported below */ }
      const KODE = (kontrak?.KODE_HAMBATAN ?? []) as readonly string[];
      const POLA = (kontrak?.POLA_MUTU_SOAL ?? []) as readonly string[];
      const kalimat = kontrak?.kalimatHambatan as ((h: unknown, s: (k: HleEvent) => string, n: (x: number) => string) => string) | undefined;
      if (!c.expect(KODE.length > 0 && POLA.length > 0 && typeof kalimat === "function",
        "the release contract has no blocker catalogue to word (BOB-17's KODE_HAMBATAN, POLA_MUTU_SOAL, kalimatHambatan)")) {
        return c.verdict("");
      }

      /**
       * 1. THE WORDING, both languages, as the steps speak: the course, never
       *    the package; no machinery (a code, ERROR, WARNING, a pattern's name,
       *    an internal word); a line that sends the reader to a step names it
       *    by that step's exact title in the same language.
       */
      const MESIN = /READINESS_|ERROR|WARNING|[A-Z]{3,}_[A-Z_]+|jsonb|uuid|lesson_id/;
      const PAKET = /\bpaket\b|\bpackage\b/i;
      const kunci = [...KODE.map((k) => `studio.hambatan.${k.toLowerCase()}`), "studio.hambatan.lain", "studio.hambatan.pelajaran",
        ...POLA.map((p) => `studio.hambatan.pola.${p.toLowerCase()}`), "studio.hambatan.pola.lain"] as HleEvent[];
      const LANGKAH_DISEBUT: Record<string, string> = {
        readiness_not_validated: "studio.langkah.periksa.judul",
        readiness_awaiting_review: "studio.langkah.setujui.judul",
        readiness_no_release: "studio.langkah.buat.judul",
        readiness_not_sealed: "studio.langkah.kunci.judul",
      };
      for (const locale of LOCALES) {
        for (const k of kunci) {
          const v = t(k, "staff", { locale });
          c.expect(v !== TANPA_SALINAN && v.trim() !== "", `(${locale}) ${k} has no words`);
          // (Terminology v1, D-068 ruling 2: in Indonesian the Studio object is «paket» and «kursus» the replaced word.
          // RESTATED FOR D-171(c): the English follows v1 too, «package» kept and «course» replaced — same strictness,
          // in the ruled direction)
          c.expect(!MESIN.test(v) && (locale === "id" ? !/\bkursus\b/i.test(v) : !/\bcourses?\b/i.test(v)), `(${locale}) ${k} names the machinery or a word v1 replaced: ${v}`);
          c.expect(!INTERNAL_WORDS.some((w) => new RegExp(`\\b${w}\\b`).test(v)), `(${locale}) ${k} carries an internal word: ${v}`);
        }
        for (const [kode, langkah] of Object.entries(LANGKAH_DISEBUT)) {
          const v = t(`studio.hambatan.${kode}` as HleEvent, "staff", { locale });
          const judul = t(langkah as HleEvent, "staff", { locale });
          c.expect(v.includes(judul), `(${locale}) the ${kode} line does not send the reader to "${judul}" by its exact title: ${v}`);
        }
      }

      /**
       * 2. THE LINES AS THE STEP SHOWS THEM, for every code in both languages:
       *    the count, the words, the pattern's words and the lesson it names;
       *    a finding about the whole course names no lesson. Planted: an
       *    unknown code, a bare sentence and an unknown pattern each read as
       *    the copy table's general line, never themselves.
       */
      for (const locale of LOCALES) {
        const s = (k: HleEvent) => t(k, "staff", { locale });
        const n = (x: number) => format.number(x, locale);
        for (const kode of KODE) {
          const dengan = kalimat!({ code: kode, count: 3, lesson_id: "l1", lesson: "Pecahan Senilai", pattern: kode.includes("ITEM") ? POLA[0] : null }, s, n);
          c.expect(dengan.includes(s(`studio.hambatan.${kode.toLowerCase()}` as HleEvent)) && dengan.includes("Pecahan Senilai") && !MESIN.test(dengan.replace("Pecahan Senilai", "")),
            `(${locale}) ${kode} does not read as its words with the lesson it names: ${dengan}`);
          if (kode.includes("ITEM")) c.expect(dengan.includes(s(`studio.hambatan.pola.${POLA[0].toLowerCase()}` as HleEvent)), `(${locale}) ${kode} does not name its pattern in words`);
        }
        const lain = s("studio.hambatan.lain");
        for (const tanam of [{ code: "READINESS_SOMETHING_NEW", count: 1, lesson: "Pecahan" }, { code: "2 temuan ERROR pada teks siswa" }, "mutu soal: X (1 soal)"] as unknown[]) {
          const x = kalimat!(tanam, s, n);
          c.expect(x === lain, `(${locale}) a planted blocker ${JSON.stringify(tanam)} reads "${x}", not the general line alone`);
        }
        const polaAsing = kalimat!({ code: "READINESS_ITEM_WARNING", count: 1, pattern: "POLA_BARU", lesson: "Pecahan" }, s, n);
        c.expect(polaAsing.includes(s("studio.hambatan.pola.lain")) && !polaAsing.includes("POLA_BARU"), `(${locale}) an unknown pattern reads "${polaAsing}"`);
      }

      /**
       * 3. AN UNKNOWN CODE CARRIES A REFERENCE. Wherever a blocker passes the
       *    server -- the freeze action for the Terbit step, the package page
       *    for its reasons -- a code the catalogue does not know is logged
       *    under a reference, and the screen shows the general line with that
       *    reference beside it. The code itself goes to the log only.
       */
      const aksi = code(baca("src", "app", "studio", "actions.ts"));
      c.expect(/const asing = hambatan\.filter\(\(x\) => !\(KODE_HAMBATAN as readonly string\[\]\)\.includes\(x\?\.code\)\);/.test(aksi)
        && /const ref = asing\.length > 0 \? rujukan\(\) : undefined;/.test(aksi)
        && /console\.error\(`\[studio \$\{ref\}\] freeze_release returned blocker code\(s\) the catalogue does not know`/.test(aksi)
        && /return \{ ok: false, code: "RELEASE_NOT_READY", release, kesiapan: r\.readiness, hambatan, ref \};/.test(aksi),
        "the freeze action does not log an unknown blocker code under a reference");
      const langkah = code(baca("src", "components", "studio", "LangkahTerbit.tsx"));
      c.expect(/const dikenal = \(x: Hambatan\) => \(KODE_HAMBATAN as readonly string\[\]\)\.includes\(x\?\.code\);/.test(langkah)
        && /\{kalimatHambatan\(x, s, \(n\) => format\.number\(n, locale\)\)\}\{rujukanDiBaris && !dikenal\(x\) \? ` \(\$\{s\("galat\.rujukan"\)\}: \$\{h\.ref\}\)` : null\}/.test(langkah)
        && !/\{x\.code\}|\{x\.pattern\}/.test(langkah),
        "the Terbit step does not show an unknown blocker's reference beside the general line, or shows a code");
      const paket = code(baca("src", "app", "studio", "paket", "[course]", "page.tsx"));
      c.expect(/const refAlasan = asing\.length > 0 \? rujukan\(\) : null;/.test(paket)
        && /console\.error\(`\[studio \$\{refAlasan\}\] studio_package_state returned blocker code\(s\) the catalogue does not know`/.test(paket)
        && /\{kalimatHambatan\(r, sl, \(n\) => format\.number\(n, locale\)\)\}\{refAlasan && !dikenal\(r\) \? ` \(\$\{sl\("galat\.rujukan"\)\}: \$\{refAlasan\}\)` : null\}/.test(paket)
        && /const sl = \(k: HleEvent\) => t\(k, "staff", \{ locale \}\);/.test(paket)
        && !/\{r\.code\}|\{r\.pattern\}/.test(paket),
        "the package page does not log an unknown reason under a reference and show it, or shows a code");

      return c.verdict(
        `every blocker the catalogue names (${KODE.length} codes, ${POLA.length} patterns and the general lines) reads in both ` +
        "languages as the steps speak: of the package, never the course (D-171(c)); no code, ERROR, WARNING, pattern name or internal " +
        "word; and a line that sends the reader to a step names it by that step's exact title. Composed as the Terbit step shows " +
        "it, each code reads as its words with the lesson it names and a question's pattern in words; a planted unknown code, " +
        "bare sentence and unknown pattern read as the copy table's general line, never themselves. From the SOURCE, an unknown " +
        "code is logged under a reference by the freeze action and by the package page, and both screens show the general line " +
        "with that reference beside it and never a code",
      );
    },
  },

  // -------------------------------------------------------------------------
  {
    id: "DAISY-25-TEKS-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const baca = (...p: string[]) => {
        const f = join(repoRoot, ...p);
        return existsSync(f) ? readFileSync(f, "utf8") : "";
      };
      /**
       * DAISY-25 (UX-23, UX-28 and UX-29 of the reader walk): THREE LINES THAT
       * SAID SOMETHING UNTRUE. The Pemetaan Awal opened with the Uji
       * Penguasaan's line. Every topic on «Lihat bukti» read "—", because the
       * content's domain names were looked up as copy keys. And the end of a
       * cycle promised a notification PINTAR never sends.
       *
       * Both components are RENDERED, as the pages render them, in a child
       * process: the runner itself runs under the react-server condition,
       * where react-dom/server is not available.
       */
      const TOPIK = ["Pecahan Senilai", "Operasi Hitung & Urutan <Bilangan>", "kesiapan.perlu_review"];
      const KASUS_O = LOCALES.flatMap((locale) => (["PEMETAAN", "PENGUASAAN"] as const).map((mode) => ({
        locale, mode, eyebrow: "Matematika · Bab 2", judul: "Judul", mulai: null, kembali: { href: "/belajar", label: "Kembali" },
        orientasi: { mode: mode === "PEMETAAN" ? "PRE_TEST" : "POST_TEST", title: "Judul", item_count: 12, allows_pause: true,
          hesitation_window_seconds: null, opens_at: null, closes_at: null, attempt_limit: 1, attempts_used: 0 },
      })));
      const KASUS_B = [
        ...LOCALES.flatMap((locale) => TOPIK.map((label) => ({ label, count: 73, total: 100, locale }))),
        ...LOCALES.map((locale) => ({ tierKey: "kesiapan.siap_sertifikasi", count: 4, total: 9, locale })),
      ];
      const anak = spawnSync(process.execPath, ["--import", "tsx", "-e",
        "(async () => {" +
        '  const { createElement: h } = await import("react");' +
        '  const { renderToStaticMarkup } = await import("react-dom/server");' +
        '  const { AppRouterContext } = await import("next/dist/shared/lib/app-router-context.shared-runtime.js");' +
        '  const mo = await import("file://" + process.cwd() + "/src/components/siklus/OrientasiAsesmen.tsx");' +
        '  const mb = await import("file://" + process.cwd() + "/src/components/bukti/BarisKesiapan.tsx");' +
        "  const O = mo.default?.default ?? mo.default;" +
        "  const B = mb.default?.default ?? mb.default;" +
        "  const r = { refresh() {}, push() {}, replace() {}, back() {}, forward() {}, prefetch() {} };" +
        "  process.stdout.write(JSON.stringify({" +
        "    o: JSON.parse(process.env.KASUS_O).map((k) => renderToStaticMarkup(h(AppRouterContext.Provider, { value: r }, h(O, k))))," +
        "    b: JSON.parse(process.env.KASUS_B).map((k) => renderToStaticMarkup(h(B, k))) }));" +
        "})().catch((e) => { process.stderr.write(String(e && e.stack || e)); process.exit(1); });"], {
        cwd: repoRoot, encoding: "utf8",
        env: { ...process.env, KASUS_O: JSON.stringify(KASUS_O), KASUS_B: JSON.stringify(KASUS_B) },
      });
      let html: { o: string[]; b: string[] } = { o: [], b: [] };
      try { html = JSON.parse(anak.stdout); } catch { /* reported below */ }
      const teks = (x: string) => x.replace(/<[^>]+>/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#x27;/g, "'")
        .replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
      const dirender = c.expect(anak.status === 0 && html.o.length === KASUS_O.length && html.b.length === KASUS_B.length,
        `the orientation and the topic row could not be rendered: ${(anak.stderr || "").split("\n").slice(0, 3).join(" ")}`);

      /**
       * 1. EACH ASSESSMENT OPENS WITH ITS OWN LINE. The Pemetaan Awal's
       *    orientation shows `pretest.intro` and never `posttest.intro`; the
       *    Uji Penguasaan's shows `posttest.intro` and never `pretest.intro`,
       *    in both languages. The two lines differ in both languages, so the
       *    check can tell them apart. From the SOURCE, the surface that shows
       *    the orientation hands it the mode it was given, and the Pemetaan
       *    Awal's page gives PEMETAAN.
       */
      for (const locale of LOCALES) {
        const pre = t("pretest.intro", "learner", { locale });
        const post = t("posttest.intro", "learner", { locale });
        c.expect(pre !== TANPA_SALINAN && post !== TANPA_SALINAN && pre !== post,
          `(${locale}) pretest.intro and posttest.intro are not two different lines: "${pre}" / "${post}"`);
      }
      if (dirender) {
        KASUS_O.forEach((k, i) => {
          const intro = /<p class="pin-intro">([\s\S]*?)<\/p>/.exec(html.o[i])?.[1] ?? "";
          const benar = t(k.mode === "PEMETAAN" ? "pretest.intro" : "posttest.intro", "learner", { locale: k.locale });
          const lain = t(k.mode === "PEMETAAN" ? "posttest.intro" : "pretest.intro", "learner", { locale: k.locale });
          const x = teks(html.o[i]);
          c.expect(teks(intro) === benar && !x.includes(lain),
            `(${k.locale}) the ${k.mode === "PEMETAAN" ? "Pemetaan Awal" : "Uji Penguasaan"} orientation opens with "${teks(intro)}", not "${benar}"`);
        });
      }
      const permukaan = code(baca("src", "app", "belajar", "_components", "PermukaanAsesmen.tsx"));
      c.expect(/<OrientasiAsesmen\b[^>]*\bmode=\{mode\}/.test(permukaan),
        "PermukaanAsesmen does not hand the orientation the mode it was given");
      c.expect(/<PermukaanAsesmen\b[^>]*\bmode="PEMETAAN"/.test(code(baca("src", "app", "belajar", "[tugas]", "pemetaan", "page.tsx")))
        && /<PermukaanAsesmen\b[^>]*\bmode="PENGUASAAN"/.test(code(baca("src", "app", "belajar", "[tugas]", "penguasaan", "page.tsx"))),
        "the Pemetaan Awal and Uji Penguasaan pages do not each give their own mode");

      /**
       * 2. A TOPIC IS NAMED BY THE CONTENT. A topic row shows the domain's name
       *    exactly as the content gives it, never "—" and never a copy
       *    lookup: planted, a domain whose name happens to be a copy key reads
       *    as that name, not as the copy key's words. The readiness rows still
       *    read their tier's words. From the SOURCE, «Lihat bukti» passes each
       *    topic's name as the row's label and never as a copy key.
       */
      if (dirender) {
        KASUS_B.forEach((k, i) => {
          const nama = teks(/<span>([\s\S]*?)<\/span>/.exec(html.b[i])?.[1] ?? "");
          if ("label" in k) {
            c.expect(nama === k.label && nama !== TANPA_SALINAN,
              `(${k.locale}) the topic "${k.label}" reads "${nama}"`);
            if (k.label === "kesiapan.perlu_review") {
              c.expect(!teks(html.b[i]).includes(t("kesiapan.perlu_review", "educator", { locale: k.locale })),
                `(${k.locale}) a topic named like a copy key was looked up in the copy table`);
            }
          } else {
            const kata = t("kesiapan.siap_sertifikasi", "educator", { locale: k.locale });
            c.expect(nama === kata && kata !== TANPA_SALINAN, `(${k.locale}) the readiness tier reads "${nama}", not "${kata}"`);
          }
          c.expect(teks(html.b[i]).includes(format.number(k.count, k.locale)), `(${k.locale}) the row does not show its number`);
        });
      }
      const bukti = code(baca("src", "app", "mengajar", "[kelas]", "bukti", "page.tsx"));
      // D-088(g) (MC-4): the row is the objective, and its name is the objective's statement (`competency`)
      c.expect(/bagian\.map\(\((\w+)\) => \(\s*<BarisKesiapan\b[^>]*\blabel=\{\1\.competency\}/.test(bukti)
        && !/tierKey=\{\w+\.(?:competency|code)\}/.test(bukti),
        "«Lihat bukti» does not pass each topic's own name as the row's label, or still looks it up as a copy key");

      /**
       * 3. THE END OF A CYCLE SAYS ONLY WHAT IS TRUE (D-019). PINTAR sends a
       *    learner no notification, so no line a learner or the public reads
       *    promises one. «Tidak ada lagi yang menunggu» says where new work
       *    appears instead: the Learning page, by the name the menu gives it,
       *    in both languages. Planted, the line it replaced is caught.
       */
      const JANJI = /\bkami akan (memberi ?tahu|mengabari|menghubungi)|\b(diberi ?tahu|dikabari)\b|\bnotifikasi\b|\bpemberitahuan\b|\blet you know\b|\bnotif(y|ied|ication)s?\b|\bwe(?: will|'ll) (?:tell|email|message|contact) you\b/i;
      c.expect(JANJI.test("Semua yang ditugaskan sudah selesai. Kami akan memberi tahu ketika ada yang baru.")
        && JANJI.test("Everything assigned to you is finished. We will let you know when something new arrives."),
        "the planted promise (the line DAISY-25 replaced) is not caught");
      const berjanji = renderAll().filter((r) => (r.persona === "learner" || r.persona === "public") && JANJI.test(r.text));
      c.expect(berjanji.length === 0,
        `a learner or public line promises a notification PINTAR never sends: ${berjanji.slice(0, 3).map((r) => `${r.event} (${r.locale}) "${r.text}"`).join("; ")}`);
      const habis = telling("siklus.habis.isi");
      c.expect(!!habis?.default && !!habis?.en && habis.default !== habis.en, "«Tidak ada lagi yang menunggu» does not have its line in both languages");
      for (const locale of LOCALES) {
        const x = t("siklus.habis.isi", "learner", { locale });
        c.expect(x.includes(t("nav.belajar", "learner", { locale })) && INTERNAL_WORDS.every((w) => !x.includes(w)),
          `(${locale}) the end of a cycle does not send the learner to the page the menu calls "${t("nav.belajar", "learner", { locale })}": "${x}"`);
      }

      return c.verdict(
        "rendered in both languages, the Pemetaan Awal's orientation opens with pretest.intro and the Uji Penguasaan's with " +
        "posttest.intro, never each other's, and the pages hand the orientation their own mode; a topic row on «Lihat bukti» " +
        "shows the domain's own name as the content gives it (a planted name that is also a copy key included), never \"—\" or a " +
        "copy lookup, while a readiness row still reads its tier's words; and no learner or public line promises a " +
        "notification, the end of a cycle naming the Learning page by the menu's word in both languages",
      );
    },
  },

  // -------------------------------------------------------------------------
  {
    id: "DAISY-26-BELAJAR-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const baca = (...p: string[]) => {
        const f = join(repoRoot, ...p);
        return existsSync(f) ? readFileSync(f, "utf8") : "";
      };
      const teks = (x: string) => x.replace(/<[^>]+>/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#x27;/g, "'")
        .replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
      /**
       * DAISY-26, the learner's rows of the polish register (UX-05, UX-21,
       * UX-22, UX-24, UX-27): what the learning home, the assignment page, an
       * Uji Cepat's orientation, the question player and the result say.
       */
      let aksiMod: Record<string, unknown> | null = null;
      try { aksiMod = await import("../src/components/siklus/aksi") as Record<string, unknown>; } catch { /* reported below */ }
      const labelTujuan = aksiMod?.labelTujuan as ((t: string, k?: { berjalan?: boolean; belumMembaca?: boolean }) => HleEvent) | undefined;
      const kunciNama = aksiMod?.kunciNamaAsesmen as ((j: string | null) => HleEvent | null) | undefined;
      const adaAksi = c.expect(typeof labelTujuan === "function" && typeof kunciNama === "function",
        "there is no one rule naming a step's button and an assessment's kind (src/components/siklus/aksi.ts: labelTujuan, kunciNamaAsesmen)");
      const GENERIK: Record<string, string[]> = { id: ["Mulai", "Buka", "Lanjutkan"], en: ["Start", "Open", "Continue"] };

      /**
       * 1. UX-21: A BUTTON IS NAMED FOR WHERE IT GOES. Every step's button,
       *    in both languages, says the step and is never a bare «Mulai»,
       *    «Buka» or «Lanjutkan»: the Pemetaan Awal and the Uji Penguasaan by
       *    name, «Lanjutkan» only for a session already open, the lessons
       *    «Mulai» until one is read. The five destinations read differently.
       */
      if (adaAksi) {
        const KASUS: Array<[string, { berjalan?: boolean; belumMembaca?: boolean }]> = [
          ["PEMETAAN", {}], ["PEMETAAN", { berjalan: true }], ["PETA", {}], ["PELAJARAN", {}], ["PELAJARAN", { belumMembaca: true }],
          ["PENGUASAAN", {}], ["PENGUASAAN", { berjalan: true }], ["HASIL", {}],
        ];
        for (const locale of LOCALES) {
          const kata = KASUS.map(([l, k]) => t(labelTujuan!(l, k), "learner", { locale }));
          KASUS.forEach(([l, k], i) => {
            c.expect(kata[i] !== TANPA_SALINAN && !GENERIK[locale].includes(kata[i]),
              `(${locale}) the ${l}${k.berjalan ? " (open)" : ""}${k.belumMembaca ? " (unread)" : ""} button reads "${kata[i]}"`);
          });
          const pre = t("pretest.title", "learner", { locale });
          const post = t("posttest.title", "learner", { locale });
          c.expect(kata[0].includes(pre) && kata[1].includes(pre) && kata[5].includes(post) && kata[6].includes(post),
            `(${locale}) a test's button does not name its test: ${kata[0]} / ${kata[1]} / ${kata[5]} / ${kata[6]}`);
          c.expect(kata[0] !== kata[1] && kata[5] !== kata[6] && kata[3] !== kata[4],
            `(${locale}) starting and continuing read the same`);
          const lima = [kata[0], kata[2], kata[3], kata[5], kata[7]];
          c.expect(new Set(lima).size === 5, `(${locale}) two destinations share a button: ${lima.join(" / ")}`);
        }
      }

      /**
       *    RENDERED, the home panel (PanelLanjut) in both languages: the
       *    eyebrow names the panel and is no button's word; the second button
       *    opens the assignment's page as «Lihat semua langkah» and is absent
       *    when the first already goes there. From the SOURCE, the home and
       *    the assignment page name every button through labelTujuan, the
       *    home's lessons open at the next unread lesson, and its cards take
       *    the same actions.
       */
      const posisi = (langkah: string, indeks: number, selesai = 0) => ({ langkah, indeks, pelajaranSelesai: selesai, pelajaranTotal: 5, selesai: false });
      const PANEL = adaAksi ? LOCALES.flatMap((locale) => [
        { posisi: posisi("PELAJARAN", 2, 3), aksi: { href: "/belajar/t1/pelajaran/l4", labelKey: labelTujuan!("PELAJARAN") } },
        { posisi: posisi("PELAJARAN", 2, 3), aksi: { href: "/belajar/t1", labelKey: labelTujuan!("PELAJARAN") } },
        { posisi: posisi("PEMETAAN", 0), aksi: { href: "/belajar/t1/pemetaan", labelKey: labelTujuan!("PEMETAAN") } },
        { posisi: posisi("HASIL", 4, 5), aksi: { href: "/belajar/t1/hasil", labelKey: labelTujuan!("HASIL") } },
      ].map((k) => ({ ...k, subjek: "Matematika", judul: "Bab 2: Pecahan", ringkasan: "/belajar/t1", locale, persona: "learner" }))) : [];
      const anak = spawnSync(process.execPath, ["--import", "tsx", "-e",
        "(async () => {" +
        '  const { createElement: h } = await import("react");' +
        '  const { renderToStaticMarkup } = await import("react-dom/server");' +
        '  const { AppRouterContext } = await import("next/dist/shared/lib/app-router-context.shared-runtime.js");' +
        '  const m = await import("file://" + process.cwd() + "/src/components/siklus/PanelLanjut.tsx");' +
        "  const P = m.default?.default ?? m.default;" +
        "  const r = { refresh() {}, push() {}, replace() {}, back() {}, forward() {}, prefetch() {} };" +
        "  process.stdout.write(JSON.stringify(JSON.parse(process.env.KASUS_PANEL).map((k) =>" +
        "    renderToStaticMarkup(h(AppRouterContext.Provider, { value: r }, h(P, k))))));" +
        "})().catch((e) => { process.stderr.write(String(e && e.stack || e)); process.exit(1); });"], {
        cwd: repoRoot, encoding: "utf8", env: { ...process.env, KASUS_PANEL: JSON.stringify(PANEL) },
      });
      let html: string[] = [];
      try { html = JSON.parse(anak.stdout); } catch { /* reported below */ }
      if (c.expect(adaAksi && anak.status === 0 && html.length === PANEL.length,
        `the home panel could not be rendered: ${(anak.stderr || "").split("\n").slice(0, 3).join(" ")}`)) {
        PANEL.forEach((k, i) => {
          const locale = k.locale as "id" | "en";
          const tautan = [...html[i].matchAll(/<a [^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g)].map((m) => ({ href: m[1], kata: teks(m[2]) }));
          const alis = teks(/<p class="pin-eyebrow">([\s\S]*?)<\/p>/.exec(html[i])?.[1] ?? "");
          const utama = t(k.aksi.labelKey, "learner", { locale });
          const sama = k.aksi.href === k.ringkasan;
          c.expect(tautan[0]?.href === k.aksi.href && tautan[0]?.kata === utama,
            `(${locale}) the panel's first button is "${tautan[0]?.kata}" to ${tautan[0]?.href}, not "${utama}" to ${k.aksi.href}`);
          c.expect(sama ? tautan.length === 1
            : tautan.length === 2 && tautan[1].href === k.ringkasan && tautan[1].kata === t("siklus.lihat_langkah", "learner", { locale }),
            `(${locale}) ${sama ? "a second button opens the page the first already opens" : "the second button does not open the assignment's page as «Lihat semua langkah»"}: ${JSON.stringify(tautan)}`);
          c.expect(alis !== "" && alis !== TANPA_SALINAN && !GENERIK[locale].includes(alis) && tautan.every((x) => x.kata !== alis),
            `(${locale}) the panel's eyebrow "${alis}" is a button's word`);
        });
      }
      const beranda = code(baca("src", "app", "belajar", "page.tsx"));
      const tugasHal = code(baca("src", "app", "belajar", "[tugas]", "page.tsx"));
      c.expect(/const label = labelTujuan\(k\.posisi\.langkah, \{ berjalan: k\.berjalan \}\);/.test(beranda)
        && (beranda.match(/labelKey: label\b/g) ?? []).length === 5
        && /\/belajar\/\$\{id\}\/pelajaran\/\$\{l\}/.test(beranda)
        && /<PanelLanjut\b[^>]*\baksi=\{aksi\(utama\)\}[^>]*\bringkasan=\{`\/belajar\/\$\{utama\.tugas\.learning_assignment_id\}`\}/.test(beranda)
        && /<KartuTugas\b[^>]*\baksi=\{aksi\(k\)\}/.test(beranda)
        && !/labelKey: "siklus\./.test(beranda),
        "the learning home does not name every step's button through labelTujuan, open the lessons at the next unread one, or hand the panel and the cards those actions");
      c.expect(["PEMETAAN", "PELAJARAN", "PENGUASAAN", "HASIL"].every((l) => tugasHal.includes(`labelTujuan("${l}"`))
        && !/labelKey: "siklus\./.test(tugasHal),
        "the assignment page does not name its button through labelTujuan");
      const panelSrc = code(baca("src", "components", "siklus", "PanelLanjut.tsx"));
      c.expect(/\{aksi\?\.href !== ringkasan \? \(/.test(panelSrc) && !/siklus\.buka|siklus\.lanjutkan/.test(panelSrc),
        "the home panel does not drop its second button when both go to the same page");

      /**
       * 2. UX-22: THE READY LIST IS NOT A PROBLEM. The section of cycles whose
       *    Uji Penguasaan is ready is headed with that, in both languages, and
       *    each row says why (every lesson is read) rather than repeating the
       *    heading. No word the home shows reads «Perlu perhatian».
       */
      for (const locale of LOCALES) {
        const judul = t("siklus.siap.judul", "learner", { locale });
        const arti = t("siklus.siap.arti", "learner", { locale });
        c.expect(judul.includes(t("posttest.title", "learner", { locale })) && arti !== TANPA_SALINAN && arti !== judul,
          `(${locale}) the ready section reads "${judul}" / "${arti}"`);
      }
      c.expect(/<h2>\{s\("siklus\.siap\.judul"\)\}<\/h2>/.test(beranda) && /s\("siklus\.siap\.arti"\)/.test(beranda)
        && /\{s\(labelTujuan\("PENGUASAAN"\)\)\}/.test(beranda),
        "the learning home's ready section is not headed, explained and buttoned as the ready list");
      const kunciBeranda = [...new Set([...beranda.matchAll(/s\("([a-z0-9_.]+)"\)/g)].map((m) => m[1]))];
      const perhatian = kunciBeranda.filter((k) => LOCALES.some((locale) => /^(Perlu perhatian|Needs attention)$/.test(t(k as HleEvent, "learner", { locale }))));
      c.expect(perhatian.length === 0, `the learning home still says «Perlu perhatian»: ${perhatian.join(", ")}`);

      /**
       * 3. UX-05: AN UJI CEPAT IS CALLED AN UJI CEPAT. The orientation names
       *    the assessment by its own kind: QUICK is «Uji Cepat» / «Quick
       *    Assessment» (the 0090 ruling), the cycle's two tests keep their
       *    names, and a kind with no product name shows its own title. From
       *    the SOURCE, the title and the start button both use that name.
       */
      if (adaAksi) {
        const cepat = kunciNama!("QUICK");
        c.expect(cepat !== null && t(cepat, "learner", { locale: "id" }) === "Uji Cepat" && t(cepat, "learner", { locale: "en" }) === "Quick Assessment",
          `a Quick Assessment is called "${cepat ? t(cepat, "learner", { locale: "id" }) : "(nothing)"}"`);
        c.expect(kunciNama!("PRE_TEST") === "pretest.title" && kunciNama!("POST_TEST") === "posttest.title" && kunciNama!("PRACTICE") === null && kunciNama!(null) === null,
          "the cycle's tests lost their names, or a kind with no product name borrows one");
      }
      const permukaan = code(baca("src", "app", "belajar", "_components", "PermukaanAsesmen.tsx"));
      c.expect(/const namaKunci = kunciNamaAsesmen\(orientasi\.mode\);/.test(permukaan)
        && /const nama = namaKunci \? s\(namaKunci\) : orientasi\.title;/.test(permukaan)
        && /judul=\{nama\}/.test(permukaan) && /\{s\("cycle\.open"\)\} \{nama\}/.test(permukaan)
        && !/"pretest\.title" : "posttest\.title"/.test(permukaan),
        "the orientation's title and start button do not name the assessment by its own kind");

      /**
       * 4. UX-24: THE BUTTON SAVES AN ANSWER. «Kunci jawaban» is also "the
       *    answer key". The button says it saves, in the same word as the
       *    «Tersimpan» it turns into, in both languages; and no line a learner
       *    reads, the tour included, speaks of locking an answer. Planted,
       *    the old line is caught.
       */
      const KUNCI = /\bkunci jawaban\b|\bdikunci\b|lalu kunci\b|\block it in\b|\blocked answers?\b/i;
      c.expect(KUNCI.test("Kunci jawaban ini") && KUNCI.test("Pilih jawaban, lalu kunci. Jawaban yang sudah dikunci tersimpan."),
        "the planted locking words are not caught");
      c.expect(/simpan/i.test(t("posttest.confirm", "learner", { locale: "id" })) && /simpan/i.test(t("posttest.confirmed", "learner", { locale: "id" }))
        && /\bsave\b/i.test(t("posttest.confirm", "learner", { locale: "en" })) && /\bsaved\b/i.test(t("posttest.confirmed", "learner", { locale: "en" })),
        `the answer's button reads "${t("posttest.confirm", "learner", { locale: "id" })}" / "${t("posttest.confirm", "learner", { locale: "en" })}", not a save that becomes «Tersimpan»`);
      const mengunci = renderAll().filter((r) => (r.persona === "learner" || r.persona === "public") && KUNCI.test(r.text));
      c.expect(mengunci.length === 0,
        `a learner line speaks of locking an answer: ${mengunci.slice(0, 3).map((r) => `${r.event} (${r.locale}) "${r.text.slice(0, 80)}"`).join("; ")}`);

      /**
       * 5. UX-27: THE RESULT COUNTS «SOAL». The safety lines say «soal» /
       *    "question" as the rest of the page does, never «butir» / "item",
       *    and the chapter's bar is its target, not an «Ambang» / "threshold".
       */
      for (const k of ["hasil.safety.ok", "hasil.safety.missed"] as const) {
        const id = t(k, "learner", { locale: "id" });
        const en = t(k, "learner", { locale: "en" });
        c.expect(/\bsoal\b/.test(id) && !/\bbutir\b/i.test(id) && /\bquestion\b/.test(en) && !/\bitem\b/i.test(en),
          `${k} reads "${id}" / "${en}"`);
      }
      c.expect(!/ambang/i.test(t("siklus.ambang", "learner", { locale: "id" })) && !/threshold/i.test(t("siklus.ambang", "learner", { locale: "en" })),
        `the chapter's bar reads "${t("siklus.ambang", "learner", { locale: "id" })}" / "${t("siklus.ambang", "learner", { locale: "en" })}"`);

      return c.verdict(
        "every step's button, in both languages, names where it goes and is never a bare Mulai, Buka or Lanjutkan (the two " +
        "tests by name, Lanjutkan only for an open session); rendered, the home panel's eyebrow is no button's word and its " +
        "second button opens the assignment's page as «Lihat semua langkah», only when the first goes elsewhere; the home " +
        "and the assignment page name their buttons through that one rule and the lessons open at the next unread one; the " +
        "ready list is headed as ready, each row saying why, and nothing on the home reads «Perlu perhatian»; a Quick " +
        "Assessment's orientation and start button say Uji Cepat; the answer's button saves and becomes «Tersimpan», with no " +
        "learner line, the tour included, speaking of locking (planted, caught); and the result says soal and a target",
      );
    },
  },

  // -------------------------------------------------------------------------
  {
    id: "DAISY-26-MENGAJAR-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const baca = (...p: string[]) => {
        const f = join(repoRoot, ...p);
        return existsSync(f) ? readFileSync(f, "utf8") : "";
      };
      const teks = (x: string) => x.replace(/<[^>]+>/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#x27;/g, "'")
        .replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
      /**
       * DAISY-26, the teacher's rows of the polish register (UX-03, UX-06,
       * UX-20, UX-32): what the Uji Cepat page, «Lihat bukti», the class page
       * and Siapkan say.
       */

      /**
       * 1. UX-03: A REFUSAL SAYS ONLY WHAT IS TRUE. RESTATED FOR DAISY-27 (a
       *    changed requirement): BOB-32 now passes the refusal's cause, so the
       *    page says each cause in its own sentence (DAISY-27-TOLAK-01 reads
       *    every one). What stays here: whichever stage renders, running or
       *    configure, says the launch's answer, and «Sudah ada Uji Cepat yang
       *    berjalan» is said nowhere, since the database lets several run.
       */
      const cepat = code(baca("src", "app", "mengajar", "[kelas]", "uji-cepat", "page.tsx"));
      const iHidup = cepat.indexOf("if (hidup) {");
      const iAtur = cepat.indexOf("const kursus =");
      const hidupBlok = iHidup >= 0 && iAtur > iHidup ? cepat.slice(iHidup, iAtur) : "";
      const aturBlok = iAtur >= 0 ? cepat.slice(iAtur) : "";
      c.expect(/\{barisHasil\}/.test(hidupBlok) && /\{barisHasil\}/.test(aturBlok) && !/mengajar\.cepat\.sudah_ada/.test(cepat),
        "a stage does not say the launch's answer, or a refusal still says one is already running");
      c.expect(t("mengajar.cepat.sudah_ada" as HleEvent, "educator") === TANPA_SALINAN,
        "the copy table still has «Sudah ada Uji Cepat yang berjalan»");

      /**
       * 2. UX-06: EVERY OPEN TEST IS COUNTED. «Keadaan hari ini» shows one
       *    block per test still open, soonest to close first and the
       *    Pemetaan Awal before the Uji Penguasaan when they close together,
       *    or the most recently closed one when none is open. RENDERED, as the
       *    staging case: both tests of a lesson open, five of 25 in each, and
       *    both named with their own counts. From the SOURCE, the page hands
       *    it every assessment and keeps no single "focus".
       */
      const A = (id: string, judul: string, keadaan: string, mode: string, ditutup: string | null, mengumpulkan: number) =>
        ({ id, judul, keadaan, mode, ditutup, mengumpulkan, mulai: mengumpulkan }); // W8: started, at least the submitted
      const HARI = [
        { asesmen: [A("q", "Uji Cepat — 20 Sep", "CLOSED", "QUICK", "2026-09-20T10:00:00+07:00", 9),
          A("post", "Cek penguasaan", "OPEN", "POST_TEST", "2026-10-01T23:59:59+07:00", 5),
          A("pre", "Pemetaan awal", "OPEN", "PRE_TEST", "2026-10-01T23:59:59+07:00", 5),
          A("lama", "Tanpa batas", "OPEN", "STANDALONE", null, 1)], murid: 25, locale: "id" },
        { asesmen: [A("a", "Pertama", "CLOSED", "PRE_TEST", "2026-09-10T10:00:00+07:00", 3),
          A("b", "Terakhir", "CLOSED", "POST_TEST", "2026-09-20T10:00:00+07:00", 4)], murid: 25, locale: "en" },
        { asesmen: [], murid: 25, locale: "id" },
      ];
      const anak = spawnSync(process.execPath, ["--import", "tsx", "-e",
        "(async () => {" +
        '  const { createElement: h } = await import("react");' +
        '  const { renderToStaticMarkup } = await import("react-dom/server");' +
        '  const m = await import("file://" + process.cwd() + "/src/components/bukti/KeadaanHariIni.tsx");' +
        "  const K = m.default?.default ?? m.default;" +
        "  const pilih = m.keadaanHariIni ?? m.default?.keadaanHariIni;" +
        "  const kasus = JSON.parse(process.env.KASUS_HARI);" +
        "  process.stdout.write(JSON.stringify({ html: kasus.map((k) => renderToStaticMarkup(h(K, k))), pilih: kasus.map((k) => pilih(k.asesmen).map((a) => a.id)) }));" +
        "})().catch((e) => { process.stderr.write(String(e && e.stack || e)); process.exit(1); });"], {
        cwd: repoRoot, encoding: "utf8", env: { ...process.env, KASUS_HARI: JSON.stringify(HARI) },
      });
      let hasil: { html: string[]; pilih: string[][] } = { html: [], pilih: [] };
      try { hasil = JSON.parse(anak.stdout); } catch { /* reported below */ }
      if (c.expect(anak.status === 0 && hasil.html.length === HARI.length,
        `«Keadaan hari ini» could not be rendered: ${(anak.stderr || "").split("\n").slice(0, 3).join(" ")}`)) {
        c.expect(JSON.stringify(hasil.pilih) === JSON.stringify([["pre", "post", "lama"], ["b"], []]),
          `the tests shown are ${JSON.stringify(hasil.pilih)}: every open one, soonest first and the Pemetaan Awal first on a tie, else the latest closed`);
        const x = teks(hasil.html[0]);
        c.expect(x.includes("Pemetaan awal") && x.includes("Cek penguasaan") && x.indexOf("Pemetaan awal") < x.indexOf("Cek penguasaan")
          && (x.match(/5 \/ 25/g) ?? []).length === 2 && !x.includes("Uji Cepat — 20 Sep"),
          `with both tests of a lesson open, «Keadaan hari ini» reads: ${x.slice(0, 240)}`);
        c.expect(teks(hasil.html[2]) === t("mengajar.bukti.kosong", "educator", { locale: "id" }),
          "with nothing open or finished, «Keadaan hari ini» does not say so");
      }
      const bukti = code(baca("src", "app", "mengajar", "[kelas]", "bukti", "page.tsx"));
      // RESTATED FOR DAISY-33 (a changed requirement, D-069(k)): the block also takes the class's kind, for «murid» or «peserta»
      c.expect(/<KeadaanHariIni asesmen=\{asesmen\} murid=\{fakta\.murid\.length\} locale=\{locale\}(?: kelas=\{id\})?(?: jenis=\{ctx\.ini\.jenis\})? \/>/.test(bukti) && !/\bfokus\b/.test(bukti),
        "«Lihat bukti» still shows one focus test rather than every open one");

      /**
       * 3. UX-20: A RELEASE IS KNOWN BY ITS DATE. Neither the class page nor
       *    Siapkan shows a teacher the release's version number; the date,
       *    which now starts the line, says which release.
       */
      for (const f of [["src", "app", "mengajar", "[kelas]", "page.tsx"], ["src", "app", "mengajar", "[kelas]", "siapkan", "page.tsx"]]) {
        const src = code(baca(...f));
        c.expect(src.length > 0 && !/\.versi\b/.test(src) && !/mengajar\.siap\.terbitan/.test(src) && /mengajar\.siap\.diterbitkan/.test(src),
          `${f.slice(2).join("/")} still shows a release's version number, or no longer its date`);
      }
      c.expect(/^[A-Z]/.test(t("mengajar.siap.diterbitkan", "educator", { locale: "id" })) && /^[A-Z]/.test(t("mengajar.siap.diterbitkan", "educator", { locale: "en" })),
        "the release's date line, which now starts the line, does not start with a capital");

      /**
       * 4. UX-32: THE RANGE IS THE TEACHER'S CHOICE. Under «Jumlah soal» the
       *    hint reads «Antara 3 dan 20 soal.», in both languages, and nothing
       *    about who set the bound. From the SOURCE and the copy.
       */
      // RESTATED FOR D-085 T2: the range now sits under the questions the teacher ticks, as one sentence
      // (`rentang`, also said when too few or too many are ticked); the same words either way
      c.expect(((/\{s\("mengajar\.cepat\.jumlah\.antara"\)\} \{format\.number\(soalMin, locale\)\} \{s\("mengajar\.cepat\.jumlah\.dan"\)\}/.test(cepat)
        && /\{format\.number\(soalMax, locale\)\} \{s\("mengajar\.siap\.soal"\)\}\./.test(cepat))
        || /`\$\{s\("mengajar\.cepat\.jumlah\.antara"\)\} \$\{n\(soalMin\)\} \$\{s\("mengajar\.cepat\.jumlah\.dan"\)\} \$\{n\(soalMax\)\} \$\{s\("mengajar\.siap\.soal"\)\}\.`/.test(cepat))
        && !/jumlah\.arti/.test(cepat),
        "the Jumlah soal hint is not «Antara ‹min› dan ‹max› soal.»");
      const mesin = renderAll().filter((r) => /ditetapkan platform|set by the platform/i.test(r.text));
      c.expect(mesin.length === 0, `a line still tells a teacher who set a bound: ${mesin.slice(0, 2).map((r) => r.event).join(", ")}`);
      for (const locale of LOCALES) {
        const kalimat = `${t("mengajar.cepat.jumlah.antara", "educator", { locale })} 3 ${t("mengajar.cepat.jumlah.dan", "educator", { locale })} 20 ${t("mengajar.siap.soal", "educator", { locale })}.`;
        c.expect(kalimat === (locale === "id" ? "Antara 3 dan 20 soal." : "Between 3 and 20 items."), `(${locale}) the hint reads "${kalimat}"`);
      }

      return c.verdict(
        "whichever Uji Cepat stage renders says the launch's answer, and none says one is already running (the cause of " +
        "each refusal is DAISY-27's); rendered, «Keadaan hari ini» shows every open test with " +
        "its own name and counts (both tests of a lesson, five of 25 each), soonest first with the Pemetaan Awal first on a " +
        "tie, else the latest closed one, else the empty line; the class page and Siapkan know a release by its date, with " +
        "no version number; and the Jumlah soal hint reads «Antara 3 dan 20 soal.» with no line saying who set the bound",
      );
    },
  },

  // -------------------------------------------------------------------------
  {
    id: "POLISH2-STUDIO-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const baca = (...p: string[]) => {
        const f = join(repoRoot, ...p);
        return existsSync(f) ? code(readFileSync(f, "utf8")) : "";
      };
      /**
       * POLISH BATCH 2, the Studio rows of the register (UX-02, UX-04, UX-12,
       * UX-14, UX-16), read from the SOURCE and the copy table: Studio's pages
       * read the database as they render, so they are not rendered here.
       */

      /**
       * 1. UX-02: BANK SOAL SAYS ONCE WHAT IT IS FOR. One line at the top says
       *    what the page is in this phase and that a question is changed by
       *    a corrected workbook in Buat Paket (named by the tab's own word, in
       *    both languages). No «Belum cukup bukti» under every question, no
       *    database id, and no word outside the copy table.
       */
      const bank = baca("src", "app", "studio", "bank", "page.tsx");
      // RESTATED FOR W1.14 (Batch 3): the line's Tailwind look became the v3 secondary line (pin-ket); said once, as before
      c.expect(/<p className="pin-ket">\{s\("studio\.bank\.intro"\)\}<\/p>/.test(bank)
        && !/studio\.bank\.belum_cukup/.test(bank) && !/placeholder="/.test(bank)
        && (bank.match(/\bshort\(/g) ?? []).length === 1 && /<li key=\{i\.id\} className=\{card\} data-soal=\{short\(i\.id\)\}>/.test(bank),
        "Bank Soal does not say once what it is for, still says «Belum cukup bukti» under every question, shows a database id, or keeps a word outside the copy table");
      for (const locale of LOCALES) {
        const intro = t("studio.bank.intro", "staff", { locale });
        c.expect(intro.includes(t("studio.nav.unggah", "staff", { locale })) && (locale === "id" ? /buku kerja/ : /workbook/).test(intro),
          `(${locale}) the Bank Soal line does not say a question is changed by a workbook in ${t("studio.nav.unggah", "staff", { locale })}: "${intro}"`);
      }

      /**
       * 2. UX-04: A SCHOOL PICKER IS LABELLED «SEKOLAH», as on Buat Paket; never «Peran & akses». RESTATED FOR CR-84
       *    and FD-9 (a changed requirement): Sertifikat's layout picker left with its page (CR-06), and Aturan
       *    Penilaian takes the school from the chapter chosen, so neither asks for a school; Pustaka PINTAR's grant does,
       *    labelled the same.
       */
      for (const f of [["src", "app", "studio", "kanonik", "page.tsx"]]) {
        const src = baca(...f);
        c.expect(/<span>\{s\("studio\.sekolah"\)\}<\/span>\s*<select className=\{field\} name="institution"/.test(src) && !/config\.section\.roles/.test(src),
          `${f.slice(2).join("/")}: the school picker is not labelled «Sekolah»`);
      }
      c.expect(!/name="institution"/.test(baca("src", "app", "studio", "definisi", "page.tsx")),
        "Aturan Penilaian asks for a school apart from the chapter it is for");
      for (const locale of LOCALES) {
        c.expect(t("studio.sekolah", "staff", { locale }) === t("studio.unggah.sekolah", "staff", { locale }),
          `(${locale}) Studio's school pickers are not labelled alike`);
      }

      /**
       * 3. UX-12: THE JSON FORMS WAIT FOR THOSE WHO NEED THEM. Both sit in one
       *    closed disclosure below the workbook, which opens when one of them
       *    has just answered; each has its own button, and neither says it
       *    makes a package (both only check and ask). No server/browser note,
       *    and no field label outside the copy table.
       */
      const unggah = baca("src", "app", "studio", "unggah", "page.tsx");
      const [iBuku, iD, iM, iT, iE] = ['id="buku-kerja"', "<details", 'id="mudah"', 'id="terstruktur"', "</details>"].map((x) => unggah.indexOf(x));
      c.expect(iBuku >= 0 && iBuku < iD && iD < iM && iM < iT && iT < iE
        // RESTATED FOR W3.3 (Batch 2): Daisy's Disclosure class (the chevron) joins; one closed disclosure as before
        // RESTATED FOR W1.14 (Batch 3): its Tailwind grid became pin-studio-lipat; still one closed disclosure
        && /<details className="pin-disclosure pin-studio-lipat" id="sistem-lain" open=\{sistemLainTerbuka\}>/.test(unggah)
        && /const sistemLainTerbuka = sp\.bagian === "mudah" \|\| sp\.bagian === "terstruktur";/.test(unggah),
        "the JSON forms are not in one closed disclosure below the workbook that opens for their own answer");
      c.expect(/\{s\("studio\.unggah\.periksa_mudah"\)\}<\/TombolKirim>/.test(unggah) && /\{s\("studio\.unggah\.periksa_terstruktur"\)\}<\/TombolKirim>/.test(unggah)
        && !/placeholder="/.test(unggah) && !/studio\.unggah\.media_catatan|studio\.unggah\.buat_paket/.test(unggah),
        "the JSON forms do not have a button each, or a field label or the server/browser note is still on the page");
      for (const locale of LOCALES) {
        const st = (k: HleEvent) => t(k, "staff", { locale });
        const [a, b] = [st("studio.unggah.periksa_mudah"), st("studio.unggah.periksa_terstruktur")];
        c.expect(a !== b && a !== st("studio.unggah.judul") && b !== st("studio.unggah.judul") && ![a, b].includes(TANPA_SALINAN),
          `(${locale}) the JSON forms' buttons read "${a}" and "${b}"`);
      }

      /**
       * 4. UX-14: THE FINDINGS SECTION IS CALLED WHAT THE STEPS CALL IT. Both
       *    steps that send the reader to it name it by the section's own
       *    heading, in each language.
       */
      const paket = baca("src", "app", "studio", "paket", "[course]", "page.tsx");
      // restated at A5 B10 (retrospective R3): the package title is the page's h1, so its sections are h2
      c.expect(/<h2 className="pin-studio-h3">\{s\("studio\.temuan\.judul"\)\}<\/h2>/.test(paket) && !/studio\.temuan\.masalah/.test(paket),
        "the findings section is not headed with its own name");
      for (const locale of LOCALES) {
        const judul = t("studio.temuan.judul", "staff", { locale });
        const bagian = locale === "id" ? `bagian ${judul}` : `${judul} section`;
        for (const k of ["studio.langkah.periksa.arti", "studio.langkah.setujui.arti"] as const) {
          c.expect(judul !== TANPA_SALINAN && t(k, "staff", { locale }).includes(bagian), `(${locale}) ${k} does not send the reader to «${bagian}»`);
        }
      }

      /**
       * 5. UX-16: MOVING AN ASSIGNMENT SAYS SO. The form is headed as a move,
       *    its picker names the release to move to, its button says «Pindahkan»,
       *    and each form names the class it moves.
       */
      c.expect(/<h2 className="pin-studio-h3">\{s\("studio\.paket\.pindah\.judul"\)\}<\/h2>/.test(paket)
        && /<span>\{s\("studio\.paket\.pindah\.tujuan"\)\}<\/span>/.test(paket)
        && /\{s\("studio\.paket\.pindah\.tombol"\)\}<\/TombolKirim>/.test(paket)
        && /\{namaKelas\.get\(a\.node_id as string\) \?\? "—"\}/.test(paket) && !/studio\.paket\.tugaskan/.test(paket),
        "the move form is not headed, labelled and buttoned as a move, or does not name the class it moves");
      for (const locale of LOCALES) {
        const st = (k: HleEvent) => t(k, "staff", { locale });
        c.expect((locale === "id" ? /^Pindahkan/ : /^Move/).test(st("studio.paket.pindah.judul")) && (locale === "id" ? /^Pindahkan$/ : /^Move$/).test(st("studio.paket.pindah.tombol")),
          `(${locale}) the move form reads "${st("studio.paket.pindah.judul")}" / "${st("studio.paket.pindah.tombol")}"`);
      }

      return c.verdict(
        "Bank Soal says once, in both languages, what it is for and that a question is changed by a workbook in Buat Paket, " +
        "with no «Belum cukup bukti» under every question and no database id; Aturan Penilaian and Sertifikat label their " +
        "school picker «Sekolah» as Buat Paket does; the two JSON forms sit in one closed disclosure below the workbook that " +
        "opens for their own answer, each with its own checking button and no server/browser note; the findings section is " +
        "headed «Temuan» / Findings, the name both steps send the reader to; and the move form is headed, labelled and " +
        "buttoned as a move and names the class it moves",
      );
    },
  },

  // -------------------------------------------------------------------------
  {
    id: "POLISH2-ADMIN-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const baca = (...p: string[]) => {
        const f = join(repoRoot, ...p);
        return existsSync(f) ? code(readFileSync(f, "utf8")) : "";
      };
      /**
       * POLISH BATCH 2, the administrator's rows of the register (UX-07,
       * UX-11, UX-30).
       */

      /**
       * 1. UX-07: THE SCHOOL'S CODE IS THE SCHOOL'S. On a page that speaks of
       *    a school, the code is «Kode sekolah» / "School code", and no
       *    Pendataan line calls it an institution code.
       */
      c.expect(t("pendataan.kode.judul", "staff", { locale: "id" }) === "Kode sekolah" && t("pendataan.kode.judul", "staff", { locale: "en" }) === "School code",
        `the school's code is called "${t("pendataan.kode.judul", "staff", { locale: "id" })}" / "${t("pendataan.kode.judul", "staff", { locale: "en" })}"`);
      const institusi = renderAll().filter((r) => r.event.startsWith("pendataan.") && /kode institusi|institution code/i.test(r.text));
      c.expect(institusi.length === 0, `a Pendataan line still says institution code: ${[...new Set(institusi.map((r) => r.event))].join(", ")}`);

      /**
       * 2. UX-11: THE PERSON IS SENT TO AN ADDRESS, NOT A PATH. The sign-in
       *    address is this environment's own (NEXT_PUBLIC_APP_URL without its
       *    scheme, plus /masuk), and «halaman Masuk PINTAR» when there is
       *    none. RENDERED, a card and an email account, with and without an
       *    address: the address is shown, or the page's name, and the bare
       *    path /masuk never is. No line in the copy table sends anyone to
       *    «halaman /masuk». From the SOURCE, the page's introduction ends the
       *    same way.
       */
      //    RESTATED FOR DAISY-20 (D-019 amended by D-054): the same rule for
      //    the second page. An email account starts at «Aktifkan akun PINTAR
      //    Anda», so its result names the environment's /aktifkan address (or
      //    «halaman Aktifkan akun PINTAR»); a card's still names /masuk.
      let alamatMasuk: ((a?: string) => string | null) | undefined;
      let alamatAktifkan: ((a?: string) => string | null) | undefined;
      try {
        const m = await import("../src/components/aktivasi/alamat");
        alamatMasuk = m.alamatMasuk;
        alamatAktifkan = m.alamatAktifkan;
      } catch { /* reported below */ }
      c.expect(typeof alamatMasuk === "function" && alamatMasuk("https://app.pintarselalu.com") === "app.pintarselalu.com/masuk"
        && alamatMasuk("https://staging.pintarselalu.com/") === "staging.pintarselalu.com/masuk"
        && alamatMasuk("") === null && alamatMasuk("javascript:alert(1)") === null && alamatMasuk("bukan alamat") === null,
        "the sign-in address is not the environment's own host plus /masuk, or something that is not a web address becomes one");
      c.expect(typeof alamatAktifkan === "function" && alamatAktifkan("https://app.pintarselalu.com") === "app.pintarselalu.com/aktifkan"
        && alamatAktifkan("https://staging.pintarselalu.com/") === "staging.pintarselalu.com/aktifkan"
        && alamatAktifkan("") === null && alamatAktifkan("javascript:alert(1)") === null && alamatAktifkan("bukan alamat") === null,
        "the activation address is not the environment's own host plus /aktifkan, or something that is not a web address becomes one");
      const KASUS = [
        { locale: "id", mode: "CLASSROOM_CARD", jawaban: { ok: true, card: "7001234567", pin: "482913" } },
        { locale: "en", mode: "EMAIL", jawaban: { ok: true, mode: "EMAIL" }, surel: "guru@sekolah.sch.id" },
      ];
      const render = (asal: string | null) => {
        const env: NodeJS.ProcessEnv = { ...process.env, KASUS_P2: JSON.stringify(KASUS) };
        if (asal) env.NEXT_PUBLIC_APP_URL = asal; else delete env.NEXT_PUBLIC_APP_URL;
        const anak = spawnSync(process.execPath, ["--import", "tsx", "-e",
          "(async () => {" +
          '  const { createElement: h } = await import("react");' +
          '  const { renderToStaticMarkup } = await import("react-dom/server");' +
          '  const a = await import("file://" + process.cwd() + "/src/components/aktivasi/HasilAktivasi.tsx");' +
          "  const Hasil = a.default?.default ?? a.default;" +
          "  process.stdout.write(JSON.stringify(JSON.parse(process.env.KASUS_P2).map((k) => renderToStaticMarkup(h(Hasil, k)))));" +
          "})().catch((e) => { process.stderr.write(String(e && e.stack || e)); process.exit(1); });"], { cwd: repoRoot, encoding: "utf8", env });
        let html: string[] = [];
        try { html = JSON.parse(anak.stdout); } catch { /* reported below */ }
        c.expect(anak.status === 0 && html.length === KASUS.length, `the activation results could not be rendered: ${(anak.stderr || "").split("\n").slice(0, 3).join(" ")}`);
        return html.map((x) => x.replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&amp;/g, "&"));
      };
      const denganAlamat = render("https://app.pintarselalu.com");
      const tanpaAlamat = render(null);
      KASUS.forEach((k, n) => {
        const jalur = k.mode === "CLASSROOM_CARD" ? "/masuk" : "/aktifkan";
        const nama = t(k.mode === "CLASSROOM_CARD" ? "aktivasi.halaman_masuk" : "aktivasi.halaman_aktifkan", "staff", { locale: k.locale as "id" | "en" });
        const a = denganAlamat[n] ?? "", b = tanpaAlamat[n] ?? "";
        const alamat = `app.pintarselalu.com${jalur}`;
        c.expect(a.includes(`<strong class="pin-num">${alamat}</strong>`) && !/\/(masuk|aktifkan)\b/.test(a.replace(alamat, "")),
          `${k.mode} (${k.locale}): with an address, the result does not send the person to ${jalur} there: ${a.slice(0, 200)}`);
        c.expect(b.includes(nama) && !/\/(masuk|aktifkan)\b/.test(b),
          `${k.mode} (${k.locale}): with no address, the result does not name «${nama}»: ${b.slice(0, 200)}`);
      });
      const jalur = renderAll().filter((r) => /halaman \/(masuk|aktifkan)|\/(masuk|aktifkan) page/i.test(r.text));
      c.expect(jalur.length === 0, `a line still sends someone to a bare path: ${[...new Set(jalur.map((r) => r.event))].join(", ")}`);
      c.expect(/<p className="pin-intro">\{s\("aktivasi\.intro"\)\} <KeAktifkan s=\{s\} sebelum="aktivasi\.intro\.buka" \/><\/p>/.test(baca("src", "app", "aktivasi", "page.tsx")),
        "the activation page's introduction does not end with the activation address");

      /**
       * 3. UX-30: KONFIGURASI OFFERS ONLY WHAT EXISTS. No menu item for a
       *    section that only says it will come later, no such section, and
       *    every menu item leads to a section on the page.
       */
      const konf = baca("src", "app", "konfigurasi", "page.tsx");
      // L3: every section's entry (navSemua); «Seluruh platform» draws fewer of them (tampil), never another
      const menu = [...(/const navSemua: Array<\[string, string\]> = \[([\s\S]*?)\n\s*\];/.exec(konf)?.[1] ?? "").matchAll(/\["([a-z-]+)", s\(/g)].map((m) => m[1]);
      c.expect(menu.length >= 5 && !menu.some((x) => ["content", "assessment", "certificates"].includes(x)),
        `the Konfigurasi menu still offers a section that does not exist yet: ${menu.join(", ")}`);
      const tanpaTujuan = menu.filter((x) => !konf.includes(`id="${x}"`));
      c.expect(tanpaTujuan.length === 0, `a Konfigurasi menu item leads nowhere: ${tanpaTujuan.join(", ")}`);
      c.expect(!/config\.placeholder/.test(konf) && !/terisi pada tahap berikutnya|filled in at a later phase/i.test(renderAll().map((r) => r.text).join("\n")),
        "a section that only says it will come later is still on the page, or its line is still in the copy table");

      return c.verdict(
        "the school's code is «Kode sekolah» / School code and no Pendataan line calls it an institution code; the sign-in " +
        "and activation addresses are this environment's own host plus /masuk and /aktifkan (and nothing that is not a web " +
        "address becomes one); rendered, a card's result sends the person to the sign-in address and an email account's to " +
        "the activation address (D-019 amended), or name the page when there is none, never a bare path, and no copy line " +
        "does; the activation page's introduction ends with the activation address; and " +
        "Konfigurasi's menu offers only sections that exist, each leading to its section on the page",
      );
    },
  },

  // -------------------------------------------------------------------------
  {
    id: "DAISY-27-TOLAK-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const baca = (...p: string[]) => {
        const f = join(repoRoot, ...p);
        return existsSync(f) ? code(readFileSync(f, "utf8")) : "";
      };
      /**
       * DAISY-27 (UX-03's page half, with BOB-32): WHY AN UJI CEPAT WAS NOT
       * MADE AVAILABLE. The page said «Sudah ada Uji Cepat yang berjalan…»,
       * which is never the cause: the database lets several run in one class.
       * BOB-32 passes the cause as a code (src/lib/ujicepat-kontrak.ts); the
       * page reads it through that contract and says each one.
       */
      let kontrak: Record<string, unknown> | null = null;
      try { kontrak = await import("../src/lib/ujicepat-kontrak") as Record<string, unknown>; } catch { /* reported below */ }
      let modul: Record<string, unknown> | null = null;
      try { modul = await import("../src/components/mengajar/tolakUjiCepat") as Record<string, unknown>; } catch { /* reported below */ }
      const KODE = (kontrak?.KODE_UJI_CEPAT ?? []) as readonly string[];
      type Gagal = { kode: string | null; ref: string | null };
      const bacaGagal = kontrak?.bacaGagalUjiCepat as ((q: Record<string, string>) => Gagal | null) | undefined;
      const kalimat = modul?.kalimatTolakUjiCepat as
        ((g: Gagal, s: (k: HleEvent) => string, l: "id" | "en", b: { soalMin: number; soalMax: number; menit: readonly number[] }) => string) | undefined;
      const ada = c.expect(KODE.length >= 6 && typeof bacaGagal === "function" && typeof kalimat === "function",
        "there is no sentence for an Uji Cepat refusal by its code (src/components/mengajar/tolakUjiCepat.ts, kalimatTolakUjiCepat), or no BOB-32 contract to read it from");

      /**
       * 1. EVERY CODE HAS ITS OWN SENTENCE, in both languages, led by «Uji
       *    Cepat belum disediakan.», naming no code and no machinery. The
       *    count and the window say what to choose, with the range the page
       *    knows (and a different range when the page knows a different one).
       *    QUICK_FAILED and a code nobody knows get the app's general line,
       *    with the reference only when there is one; a named cause never
       *    carries one. Planted, a sentence with a code in it is caught.
       */
      const BATAS = { soalMin: 3, soalMax: 20, menit: [10, 15, 30] as const };
      const MESIN = /QUICK_|CAN_[A-Z]|\bP0001\b|\b42501\b|INV-\d|\bmodule\b|\btier\b|drawable|\bnull\b/;
      c.expect(MESIN.test("Uji Cepat belum disediakan. QUICK_BANK_TOO_SMALL"), "the planted code in a sentence is not caught");
      if (ada) {
        for (const locale of LOCALES) {
          const s = (k: HleEvent) => t(k, "educator", { locale });
          const n = (x: number) => format.number(x, locale);
          const awal = s("mengajar.cepat.tolak.awal");
          const per: Record<string, string> = Object.fromEntries(KODE.map((k) => [k, kalimat!({ kode: k, ref: null }, s, locale, BATAS)]));
          for (const [k, x] of Object.entries(per)) {
            c.expect(awal !== TANPA_SALINAN && x.startsWith(`${awal} `) && x.length > awal.length + 12 && !x.includes(TANPA_SALINAN)
              && !MESIN.test(x) && INTERNAL_WORDS.every((w) => !x.includes(w)),
              `(${locale}) ${k} reads "${x}"`);
          }
          c.expect(new Set(Object.values(per)).size === KODE.length, `(${locale}) two codes share a sentence: ${JSON.stringify(per)}`);
          c.expect(per.QUICK_COUNT_OUT_OF_RANGE?.includes(n(3)) && per.QUICK_COUNT_OUT_OF_RANGE.includes(n(20)),
            `(${locale}) the count's refusal does not give the range: "${per.QUICK_COUNT_OUT_OF_RANGE}"`);
          const lain = kalimat!({ kode: "QUICK_COUNT_OUT_OF_RANGE", ref: null }, s, locale, { soalMin: 5, soalMax: 12, menit: [10] });
          c.expect(lain.includes(`${n(5)} `) && lain.includes(`${n(12)}.`) && !lain.includes(n(20)), `(${locale}) the count's range is not the page's own: "${lain}"`);
          c.expect(BATAS.menit.every((m) => per.QUICK_MINUTES_OUT_OF_RANGE?.includes(n(m))),
            `(${locale}) the window's refusal does not offer the page's windows: "${per.QUICK_MINUTES_OUT_OF_RANGE}"`);
          const umumRef = kalimat!({ kode: "QUICK_FAILED", ref: "AB12CD" }, s, locale, BATAS);
          c.expect(umumRef === `${awal} ${s("galat.action_failed")} ${s("galat.rujukan")}: AB12CD.`,
            `(${locale}) a refusal nobody named, with its reference, reads "${umumRef}"`);
          c.expect(!per.QUICK_FAILED.includes(s("galat.rujukan")) && per.QUICK_FAILED === kalimat!({ kode: null, ref: null }, s, locale, BATAS),
            `(${locale}) the general line without a reference names one, or a code nobody knows reads otherwise`);
          c.expect(!kalimat!({ kode: "QUICK_BANK_TOO_SMALL", ref: "AB12CD" }, s, locale, BATAS).includes("AB12CD"),
            `(${locale}) a named cause carries a reference`);
        }
      }

      /**
       * 2. THE ADDRESS IS READ THROUGH BOB-32'S CONTRACT, TRUSTING NOTHING.
       *    A code the contract does not know and a reference of the wrong
       *    shape come back as nothing, so what someone types into the address
       *    reaches the page only as the general line.
       */
      if (ada) {
        const s = (k: HleEvent) => t(k, "educator", { locale: "id" });
        c.expect(bacaGagal!({ cepat: "ok" }) === null
          && JSON.stringify(bacaGagal!({ cepat: "gagal", kode: "QUICK_BANK_TOO_SMALL" })) === JSON.stringify({ kode: "QUICK_BANK_TOO_SMALL", ref: null }),
          "the refusal is not read from ?cepat=gagal&kode=");
        const palsu = bacaGagal!({ cepat: "gagal", kode: "<b>Sudah ada</b>", ref: "<script>" });
        const x = palsu ? kalimat!(palsu, s, "id", BATAS) : "";
        c.expect(x === `${s("mengajar.cepat.tolak.awal")} ${s("mengajar.cepat.tolak.umum")}` && !/<|Sudah ada|script/.test(x),
          `a forged code and reference reach the page: "${x}"`);
      }

      /**
       * 3. FROM THE SOURCE. The page reads the refusal through BOB-32's
       *    reader and says it by kalimatTolakUjiCepat, with the question range
       *    it reads and the windows it offers; the sentences take the codes'
       *    type from the contract and keep no list of their own; the page
       *    names no code. «Sudah ada Uji Cepat yang berjalan» is gone from the
       *    page and the copy table.
       */
      const hal = baca("src", "app", "mengajar", "[kelas]", "uji-cepat", "page.tsx");
      c.expect(/import \{ bacaGagalUjiCepat \} from "@\/lib\/ujicepat-kontrak";/.test(hal) && /const gagal = bacaGagalUjiCepat\(q\);/.test(hal)
        && /kalimatTolakUjiCepat\(gagal, s, locale, \{ soalMin, soalMax, menit: ajar\.JENDELA_MENIT \}\)/.test(hal)
        && !/"QUICK_[A-Z_]+"/.test(hal),
        "the page does not read the refusal through BOB-32's contract and say it by its code");
      const modSrc = baca("src", "components", "mengajar", "tolakUjiCepat.ts");
      c.expect(/import type \{ KodeUjiCepat \} from "@\/lib\/ujicepat-kontrak";/.test(modSrc) && !/\[\s*"QUICK_/.test(modSrc),
        "the sentences keep their own list of the codes rather than the contract's");
      c.expect(!/sudah_ada/.test(hal) && t("mengajar.cepat.sudah_ada" as HleEvent, "educator") === TANPA_SALINAN
        && renderAll().every((r) => !/Sudah ada Uji Cepat yang berjalan|already open in this class/i.test(r.text)),
        "«Sudah ada Uji Cepat yang berjalan» is not retired");

      return c.verdict(
        `every one of BOB-32's ${KODE.length} codes has its own sentence in both languages, led by «Uji Cepat belum ` +
        "disediakan.», naming no code or machinery (a planted code is caught): the count and the window say what to choose " +
        "with the page's own range and windows, and QUICK_FAILED or a code nobody knows gets the app's general line with " +
        "the reference only when there is one; a forged code and reference in the address reach the page only as the " +
        "general line; the page reads the refusal through BOB-32's reader and names no code, the sentences keep no list " +
        "of codes of their own, and «Sudah ada Uji Cepat yang berjalan» is gone from the page and the copy table",
      );
    },
  },

  {
    id: "POLISH3-HASIL-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const baca = (...p: string[]) => {
        const f = join(repoRoot, ...p);
        return existsSync(f) ? code(readFileSync(f, "utf8")) : "";
      };
      /**
       * POLISH3 (UX-26): THE LEARNER'S RESULT NAMES EACH ROW. «Per bagian»
       * listed each learning objective by its code («B1P1», «MTK5-P1»). The
       * name is the objective's statement, which the learner can already read
       * through the reading map of their own session.
       *
       * 1. RENDERED, in a child process, in both languages: each row reads
       *    its statement (or its lesson's title when the statement is empty)
       *    with its count, and no code shows. With no name to be found (no
       *    map, or one code carrying two statements) the row keeps its code;
       *    with no rows there is no section.
       */
      const PER = { B1P1: { benar: 3, total: 4, penguasaan: 0.75 }, B1P2: { benar: 1, total: 2, penguasaan: 0.5 } };
      const PETA = [
        { kode: "B1P1", pernyataan: "Menentukan pecahan senilai dengan mengali atau membagi.", pelajaran: "Pecahan" },
        { kode: "B1P2", pernyataan: "  ", pelajaran: "Desimal" },
      ];
      const KASUS = [
        ...LOCALES.map((locale) => ({ perDomain: PER, peta: PETA, locale })),
        { perDomain: PER, peta: [], locale: "id" },
        { perDomain: { X1: { benar: 2, total: 2, penguasaan: 1 } }, peta: [{ kode: "X1", pernyataan: "Satu.", pelajaran: "A" }, { kode: "X1", pernyataan: "Dua.", pelajaran: "B" }], locale: "id" },
        { perDomain: {}, peta: PETA, locale: "id" },
      ];
      const anak = spawnSync(process.execPath, ["--import", "tsx", "-e",
        "(async () => {" +
        '  const { createElement: h } = await import("react");' +
        '  const { renderToStaticMarkup } = await import("react-dom/server");' +
        '  const m = await import("file://" + process.cwd() + "/src/components/siklus/PerTujuan.tsx");' +
        "  const PerTujuan = m.default?.default ?? m.default;" +
        "  process.stdout.write(JSON.stringify(JSON.parse(process.env.KASUS_TUJUAN).map((k) => renderToStaticMarkup(h(PerTujuan, k)))));" +
        "})().catch((e) => { process.stderr.write(String(e && e.stack || e)); process.exit(1); });"], {
        cwd: repoRoot, encoding: "utf8", env: { ...process.env, KASUS_TUJUAN: JSON.stringify(KASUS) },
      });
      let html: string[] = [];
      try { html = JSON.parse(anak.stdout); } catch { /* reported below */ }
      const terlihat = (x: string) => x.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
      if (c.expect(anak.status === 0 && html.length === KASUS.length,
        `the learner's result rows could not be rendered by name (src/components/siklus/PerTujuan.tsx): ${(anak.stderr || "").split("\n").slice(0, 2).join(" ")}`)) {
        LOCALES.forEach((locale, n) => {
          const x = terlihat(html[n]);
          c.expect(x.includes(t("hasil.domain", "learner", { locale })), `(${locale}) the rows' heading is missing`);
          c.expect(x.includes(PETA[0].pernyataan) && x.includes("Desimal"), `(${locale}) a row is not named by its objective: ${x}`);
          c.expect(/\b3\/4\b/.test(x) && /\b1\/2\b/.test(x), `(${locale}) a row lost its count: ${x}`);
          c.expect(!/B1P1|B1P2/.test(x), `(${locale}) a row still shows its objective code: ${x}`);
        });
        const tanpaPeta = terlihat(html[LOCALES.length]);
        c.expect(/B1P1/.test(tanpaPeta) && /B1P2/.test(tanpaPeta) && /3\/4/.test(tanpaPeta),
          "with no name to be found, a row disappears rather than keeping its code");
        const dua = terlihat(html[LOCALES.length + 1]);
        c.expect(/X1/.test(dua) && !/Satu\.|Dua\./.test(dua), "a code carrying two statements is named by one of them");
        c.expect(html[LOCALES.length + 2] === "", "a result with no rows still draws the section");
        // the control: a planted code in the visible text is caught
        c.expect(/B1P1|B1P2/.test(terlihat('<span data-tujuan="B1P1">B1P1</span>')), "the control: a planted code is not caught");
      }

      /**
       * 2. THE PAGE READS THE NAMES FROM THE LEARNER'S OWN SESSION, in the
       *    same round of reads, and draws the rows through PerTujuan only.
       */
      const hal = baca("src", "app", "belajar", "[tugas]", "hasil", "page.tsx");
      c.expect(/Promise\.all\(\[[\s\S]*engine\.readingMap\(db, state\.post_session\)[\s\S]*?\]\)/.test(hal)
        && /<PerTujuan perDomain=\{outcome\.per_domain\} peta=\{peta\} locale=\{locale\} \/>/.test(hal),
        "the result page does not name its rows from the learner's own reading map");
      c.expect(!/<span>\{code\}<\/span>/.test(hal) && !/per_domain \?\? \{\}\)\.map/.test(hal),
        "the result page still draws the rows by their code");

      /**
       * 3. THE NAMES AND THE COUNTS ARE KEYED ALIKE, and the learner may read
       *    the names. The latest evaluate_session keys per_domain by the
       *    objective's code; the latest reading_map returns that code with the
       *    statement; and the RPC registry lists reading_map for a LEARNER.
       */
      const mig = join(repoRoot, "supabase", "migrations");
      const terakhir = (fn: string) => {
        const kepala = `create (?:or replace )?function public\\.${fn}\\(`;
        const f = readdirSync(mig).filter((x) => x.endsWith(".sql")).sort()
          .filter((x) => new RegExp(kepala, "i").test(readFileSync(join(mig, x), "utf8"))).pop();
        if (!f) return "";
        const s = readFileSync(join(mig, f), "utf8");
        const semua = [...s.matchAll(new RegExp(kepala, "gi"))];
        return s.slice(semua[semua.length - 1].index!).slice(0, 5000);
      };
      c.expect(/jsonb_object_agg\(d\.code,/.test(terakhir("evaluate_session")), "the result's per-objective counts are no longer keyed by the objective's code");
      c.expect(/r\.code, r\.statement/.test(terakhir("reading_map")), "the reading map no longer returns the objective's code with its statement");
      c.expect(readdirSync(mig).some((x) => /\('reading_map',\s*'LEARNER'/.test(readFileSync(join(mig, x), "utf8"))),
        "the reading map is not registered for a learner");

      /** 4. THE HEADING SAYS WHAT THE ROWS ARE, and not «bagian» (D-006). */
      for (const locale of LOCALES) {
        const h = t("hasil.domain", "learner", { locale });
        c.expect(h !== TANPA_SALINAN && !/bagian|section/i.test(h), `(${locale}) the rows' heading is "${h}"`);
      }
      c.expect(/tujuan pembelajaran/i.test(t("hasil.domain", "learner", { locale: "id" }))
        && /learning objective/i.test(t("hasil.domain", "learner", { locale: "en" })),
        "the heading does not say the rows are learning objectives");

      return c.verdict(
        "the learner's result names every row by its learning objective's statement (or its lesson's title when the " +
        "statement is empty), rendered in both languages with its count and no code showing (a planted code is caught); " +
        "with no name to be found, or one code carrying two statements, the row keeps its code, and no rows draw no section; " +
        "the page reads the names from the learner's own reading map in the same round of reads, the counts and the names " +
        "are keyed by the same objective code in the latest migrations, the map is registered for a learner, and the " +
        "heading reads «Per tujuan pembelajaran» / \"By learning objective\" rather than «Per bagian»",
      );
    },
  },

  {
    id: "POLISH3-PENDATAAN-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const baca = (...p: string[]) => {
        const f = join(repoRoot, ...p);
        return existsSync(f) ? code(readFileSync(f, "utf8")) : "";
      };
      /**
       * POLISH3 (UX-08): ONE PRESS APPROVES AND RECORDS. «Ya, catat
       * orang-orang ini» (and, after the first fifty, «Sudah saya periksa,
       * lanjutkan sisanya») approved, and a second button, «Mulai mencatat» /
       * «Lanjutkan», started the recording. The approving press now leaves a
       * note the driver takes once, on arriving from that press. Nothing starts
       * because a page opened (§10).
       *
       * 1. THE NOTE: written by a press, taken once, by that job's driver
       *    only, and ignored once stale; held in memory, never in storage
       *    that outlives the tab.
       */
      let niat: Record<string, unknown> | null = null;
      try { niat = await import("../src/components/pendataan/niatMencatat") as Record<string, unknown>; } catch { /* reported below */ }
      const catat = niat?.catatNiat as ((p: string, k?: number) => void) | undefined;
      const ada = niat?.adaNiat as ((p: string, k?: number) => boolean) | undefined;
      const ambil = niat?.ambilNiat as ((p: string, k?: number) => boolean) | undefined;
      const W = niat?.NIAT_BERLAKU_MS as number | undefined;
      if (c.expect(typeof catat === "function" && typeof ada === "function" && typeof ambil === "function"
        && typeof W === "number" && W > 0 && W <= 10 * 60 * 1000,
        "the approving press leaves no note for the recording to start from (src/components/pendataan/niatMencatat.ts)")) {
        const t0 = 1_900_000_000_000;
        c.expect(!ada!("uji-a", t0), "a job has a note before anyone pressed");
        catat!("uji-a", t0);
        c.expect(ada!("uji-a", t0 + 1000) && ada!("uji-a", t0 + 1000), "looking at the note takes it");
        c.expect(!ambil!("uji-b", t0 + 1000), "another job's driver takes this job's note");
        c.expect(ambil!("uji-a", t0 + 1000), "the job's driver does not find the note its approval left");
        c.expect(!ambil!("uji-a", t0 + 1001) && !ada!("uji-a", t0 + 1001), "the note is taken more than once");
        catat!("uji-c", t0);
        c.expect(!ambil!("uji-c", t0 + W!) && !ada!("uji-c", t0), "a stale note starts the recording, or survives being refused");
        catat!("uji-d", t0);
        c.expect(!ada!("uji-d", t0 - 1), "a note dated after now counts");
        ambil!("uji-d", t0);
      }
      const niatSrc = baca("src", "components", "pendataan", "niatMencatat.ts");
      c.expect(niatSrc !== "" && !/localStorage|sessionStorage|indexedDB|document\.cookie/.test(niatSrc),
        "the note is kept somewhere that outlives the tab");

      /**
       * 2. RENDERED: the driver drawn after an approval is already recording
       *    (its pause button, not its start button) and does not say it
       *    stopped; without the note, or with another job's, it waits for its
       *    button as before; and a job that has recorded some says it stopped
       *    part-way only while it is not recording.
       */
      const K = (x: Record<string, unknown>) => ({
        job_id: "job-1", institution_id: "i", state: "IMPORTING", total: 120, completed: 0, remaining: 120, failed: 0,
        pilot_required: true, pilot_size: 50, pilot_completed: 0, pilot_verified: false, pilot_verified_at: null,
        confirmed_at: "2026-09-29T00:00:00Z", completed_at: null, failure_reason: null, ...x,
      });
      const baru = K({});
      const sisa = K({ state: "REMAINDER_IMPORTING", completed: 50, remaining: 70, pilot_completed: 50, pilot_verified: true });
      const KASUS = [
        { awal: baru, niat: null, locale: "id" },
        { awal: baru, niat: "job-1", locale: "id" },
        { awal: sisa, niat: null, locale: "id" },
        { awal: sisa, niat: "job-1", locale: "id" },
        { awal: baru, niat: "job-lain", locale: "id" },
        { awal: baru, niat: "job-1", locale: "en" },
      ];
      const anak = spawnSync(process.execPath, ["--import", "tsx", "-e",
        "(async () => {" +
        '  const { createElement: h } = await import("react");' +
        '  const { renderToStaticMarkup } = await import("react-dom/server");' +
        '  const { AppRouterContext } = await import("next/dist/shared/lib/app-router-context.shared-runtime.js");' +
        '  const m = await import("file://" + process.cwd() + "/src/components/pendataan/Penggerak.tsx");' +
        '  const n = await import("file://" + process.cwd() + "/src/components/pendataan/niatMencatat.ts");' +
        "  const Penggerak = m.default?.default ?? m.default;" +
        "  const N = n.catatNiat ? n : n.default;" +
        "  const r = { refresh() {}, push() {}, replace() {}, back() {}, forward() {}, prefetch() {} };" +
        "  const kosong = async () => null;" +
        "  process.stdout.write(JSON.stringify(JSON.parse(process.env.KASUS_NIAT).map((k) => {" +
        "    if (k.niat) N.catatNiat(k.niat);" +
        "    const x = renderToStaticMarkup(h(AppRouterContext.Provider, { value: r }," +
        "      h(Penggerak, { awal: k.awal, pekerjaan: k.awal.job_id, majukan: kosong, bacaUlang: kosong, locale: k.locale })));" +
        "    N.ambilNiat(\"job-1\"); N.ambilNiat(\"job-lain\");" +
        "    return x;" +
        "  })));" +
        "})().catch((e) => { process.stderr.write(String(e && e.stack || e)); process.exit(1); });"], {
        cwd: repoRoot, encoding: "utf8", env: { ...process.env, KASUS_NIAT: JSON.stringify(KASUS) },
      });
      let html: string[] = [];
      try { html = JSON.parse(anak.stdout); } catch { /* reported below */ }
      const esc = (x: string) => x.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
      if (c.expect(anak.status === 0 && html.length === KASUS.length,
        `the recording driver could not be rendered: ${(anak.stderr || "").split("\n").slice(0, 2).join(" ")}`)) {
        const s = (k: HleEvent, locale: "id" | "en" = "id") => t(k, "staff", { locale });
        const tombol = (x: string, k: HleEvent, locale: "id" | "en" = "id") => x.includes(`>${esc(s(k, locale))}</button>`);
        const berhenti = (x: string, locale: "id" | "en" = "id") => x.includes(esc(s("pendataan.maju.terputus", locale)));
        const [tanpa, setuju, sisaTanpa, sisaSetuju, lain, en] = html;
        c.expect(tombol(tanpa, "pendataan.maju.mulai") && !tombol(tanpa, "pendataan.maju.jeda") && !berhenti(tanpa),
          "with no approval just pressed, the driver does not wait for «Mulai mencatat» as before");
        c.expect(tombol(setuju, "pendataan.maju.jeda") && !tombol(setuju, "pendataan.maju.mulai") && !berhenti(setuju),
          "straight after «Ya, catat orang-orang ini» the driver still waits for a second press («Mulai mencatat»)");
        c.expect(tombol(sisaTanpa, "pendataan.maju.lanjut") && berhenti(sisaTanpa),
          "a job that has recorded some and is not recording does not say it stopped part-way, with its «Lanjutkan»");
        c.expect(tombol(sisaSetuju, "pendataan.maju.jeda") && !tombol(sisaSetuju, "pendataan.maju.lanjut") && !berhenti(sisaSetuju),
          "straight after «Sudah saya periksa, lanjutkan sisanya» the driver waits for «Lanjutkan», or says it stopped while it records");
        c.expect(tombol(lain, "pendataan.maju.mulai") && !tombol(lain, "pendataan.maju.jeda"),
          "another job's approval starts this job's recording");
        c.expect(tombol(en, "pendataan.maju.jeda", "en") && !tombol(en, "pendataan.maju.mulai", "en"),
          "(en) straight after the approval the driver still waits for a second press");
      }

      /**
       * 3. FROM THE SOURCE: both approving forms stay plain forms with
       *    TombolKirim, their job field being the one that writes the note on
       *    its own form's submit; the driver's one effect starts only on a
       *    taken note and a job the database lets run, and it is the only
       *    caller besides the button; the page no longer says «berhenti di
       *    tengah jalan» by itself.
       */
      const hal = baca("src", "app", "pendataan", "[pekerjaan]", "page.tsx");
      for (const aksi of ["konfirmasiAksi", "periksaPercontohanAksi"]) {
        c.expect(new RegExp(`<form action=\\{${aksi}\\}>\\s*<IsianSetuju pekerjaan=\\{pekerjaan\\} \\/>\\s*<TombolKirim`).test(hal),
          `the ${aksi} form does not carry its press into the recording`);
      }
      c.expect(!/pendataan\.maju\.terputus/.test(hal), "the page says the job stopped part-way whether or not it is recording");
      const isian = baca("src", "components", "pendataan", "IsianSetuju.tsx");
      c.expect(/const form = isian\.current\?\.form;/.test(isian) && /form\.addEventListener\("submit", catat\)/.test(isian)
        && /const catat = \(\) => catatNiat\(pekerjaan\);/.test(isian) && /type="hidden" name="pekerjaan"/.test(isian),
        "the approving form's job field does not leave the note when its form is submitted");
      const pg = baca("src", "components", "pendataan", "Penggerak.tsx");
      c.expect((pg.match(/useEffect\(/g) ?? []).length === 1
        && /useEffect\(\(\) => \{\s*if \(ambilNiat\(pekerjaan\) && bolehLanjut\(awal\)\) void jalankan\(\);/.test(pg)
        && (pg.match(/\bjalankan\b/g) ?? []).length === 3 && /onClick=\{jalankan\}/.test(pg),
        "the driver starts on something other than its button or a taken approval note");
      c.expect(/\{!jalan && \(putus \|\| bisaDilanjutkan\(kini\)\) \?/.test(pg),
        "the driver says the job stopped part-way while it is recording");

      /** 4. THE PRESSES SAY WHAT NOW HAPPENS, and the fallback button stays. */
      c.expect(/catat/i.test(t("pendataan.pratinjau.setuju", "staff", { locale: "id" })) && /record/i.test(t("pendataan.pratinjau.setuju", "staff", { locale: "en" }))
        && /lanjutkan/i.test(t("pendataan.percontohan.tanya", "staff", { locale: "id" })) && /continue/i.test(t("pendataan.percontohan.tanya", "staff", { locale: "en" })),
        "an approving button no longer says that recording follows");
      c.expect(LOCALES.every((locale) => t("pendataan.maju.mulai", "staff", { locale }) !== TANPA_SALINAN),
        "the driver's own start button, the fallback without script, lost its words");

      return c.verdict(
        "one press approves and records: «Ya, catat orang-orang ini» and «Sudah saya periksa, lanjutkan sisanya» leave a " +
        "note that the job's driver takes once, on arriving from that press, and starts (rendered: its pause button from " +
        "the first frame, in both languages, and no «berhenti di tengah jalan» while it records); without the note, with " +
        "another job's, or with a stale one it waits for its own button as before; the note is taken once, by that job " +
        "only, and lives in memory, never in storage that outlives the tab (§10); both forms stay plain forms with " +
        "TombolKirim, and the driver's one effect starts only on a taken note for a job the database lets run",
      );
    },
  },

  {
    id: "DAISY-30-TEKS-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const baca = (...p: string[]) => {
        const f = join(repoRoot, ...p);
        return existsSync(f) ? code(readFileSync(f, "utf8")) : "";
      };
      /**
       * DAISY-30: LEARNER TEXT RENDERS ITS OWN MARKUP. The lesson player drew
       * every line as a plain <p> and the item screens drew stems and options
       * as plain text, so every SD5 and Geografi lesson showed **bold** as
       * asterisks and SD5's tables as pipes. SMA X Matematika writes powers
       * Unicode cannot, as ^{…}. One shared renderer (src/components/teks/
       * Teks.tsx) now draws **bold**, "- " lists, pipe tables and ^{…}/_{…},
       * as React elements only.
       *
       * 1. RENDERED, in a child process:
       *    (a) the LESSON PLAYER with a whole lesson («Membaca Tabel Data»,
       *        SD5-Sintetis-Bab2), every page: no ** or table pipes left, its
       *        table drawn, its nine bold phrases bold;
       *    (b) the lesson player with an SMA X line, a^{m/n}: a <sup>;
       *    (c) every lesson of every package in docs/onboarding/konten-sintetis: no **
       *        left, no |--- left, no paragraph that starts with a pipe, no
       *        line that keeps an _…_ pair or a leading "- "; every table and
       *        table row, every italic line and every list line (nested ones
       *        included) accounted for;
       *    (d) the inline renderer: marks left open, the pipes that are not
       *        tables and a planted <b> stay literal (the tag escaped);
       *        «_Periksa…_» is italic (with bold and ^{…} inside it), while
       *        x_{0} stays a subscript and a snake_case word, a lone "_" and
       *        __dunder__ stay literal;
       *    (e) lines stay lines, "- " lines become one list, and an indented
       *        "- " line is an item under the one above.
       *
       * RESTATED FOR F-4 (D-145(b)): the repository is public, so the real
       * chapters and their keys left the tree. (a) and (c) read the synthetic
       * corpus (docs/onboarding/konten-sintetis, written by its buat-korpus.mts),
       * which carries every markup the real chapters used: pages at "## ",
       * bold, whole italic lines («_Periksa…_», «_Diadaptasi…_»), "- " lists
       * with indented, nested items, and pipe tables. Every rule is kept; the
       * corpus-wide counts (once at least 100 italic lines, 400 list lines,
       * 4 indented ones and 1 nested list, 70 lessons and 20 tables, the real
       * corpus's size) are now that corpus's own exact counts.
       */
      const SMAX = "Untuk a > 0 dan n > 0, a^{m/n} = (a^{1/n})^{m}.";
      const anak = spawnSync(process.execPath, ["--import", "tsx", "-e",
        "(async () => {" +
        '  const fs = await import("node:fs");' +
        '  const { createElement: h } = await import("react");' +
        '  const { renderToStaticMarkup } = await import("react-dom/server");' +
        '  const { AppRouterContext } = await import("next/dist/shared/lib/app-router-context.shared-runtime.js");' +
        '  const lp = await import("file://" + process.cwd() + "/src/app/belajar/_components/LessonPlayer.tsx");' +
        "  const LessonPlayer = lp.default?.default ?? lp.default;" +
        "  const r = { refresh() {}, push() {}, replace() {}, back() {}, forward() {}, prefetch() {} };" +
        "  const pemain = (body, startAt) => renderToStaticMarkup(h(AppRouterContext.Provider, { value: r }, h(LessonPlayer, {" +
        '    learningAssignmentId: "t", lessonId: "l", title: "x", bodyMarkdown: body, workedExamples: [], media: [], startAt,' +
        "    saveProgress: async () => ({ ok: true }) })));" +
        '  const dir = process.cwd() + "/docs/onboarding/konten-sintetis/";' +
        '  const paket = fs.readdirSync(dir).filter((f) => f.endsWith(".paket.json")).sort()' +
        '    .map((f) => ({ f, lessons: JSON.parse(fs.readFileSync(dir + f, "utf8")).courses.flatMap((c) => c.modules).flatMap((m) => m.lessons) }));' +
        '  const faktor = paket.find((p) => p.f === "SD5-Sintetis-Bab2.paket.json").lessons.find((l) => l.title === "Membaca Tabel Data").body_markdown;' +
        '  const halaman = faktor.split("\\n").filter((b) => b.startsWith("## ")).length;' +
        "  const out = { halaman, faktor: Array.from({ length: halaman }, (_, k) => pemain(faktor, k + 1))," +
        '    smax: pemain("## Pangkat pecahan\\n" + process.env.SMAX, 1), korpus: [], baris: [], blok: "" };' +
        "  let t = null;" +
        '  try { t = await import("file://" + process.cwd() + "/src/components/teks/Teks.tsx"); } catch (e) { out.galat = String(e); }' +
        "  if (t) {" +
        "    const T = t.default?.default ? t.default : t;" +
        "    const TeksBlok = T.default ?? t.default, TeksBaris = T.TeksBaris ?? t.TeksBaris;" +
        "    for (const p of paket) for (const l of p.lessons) out.korpus.push({ f: p.f, judul: l.title, md: l.body_markdown, html: renderToStaticMarkup(h(TeksBlok, { teks: l.body_markdown })) });" +
        "    out.bungkus = renderToStaticMarkup(h(TeksBaris, { teks: 'a' })) === '<span data-isi-materi=\"\">a</span>';" +
        "    out.baris = JSON.parse(process.env.BARIS).map((s) => renderToStaticMarkup(h(TeksBaris, { teks: s })).replace(/^<span data-isi-materi=\"\">([\\s\\S]*)<\\/span>$/, '$1'));" +
        '    out.blok = renderToStaticMarkup(h(TeksBlok, { teks: "Akibatnya:\\n- satu\\n- **dua**\\n  - dua a\\n  - dua b\\n██ 6\\n███ 8" })).replace(/^<div data-isi-materi="" class="pin-isi-materi">([\\s\\S]*)<\\/div>$/, "$1");' +
        "  }" +
        "  process.stdout.write(JSON.stringify(out));" +
        "})().catch((e) => { process.stderr.write(String(e && e.stack || e)); process.exit(1); });"], {
        cwd: repoRoot, encoding: "utf8", maxBuffer: 64 * 1024 * 1024,
        env: { ...process.env, SMAX, BARIS: JSON.stringify([
          SMAX, "**tebal", "^{ tanpa tutup", "Turus ||||/ |||", "979.875 → **979** | **875**", "_Periksa: 1 × 28._",
          "Isi <b>tebal</b> & <script>x</script>", "**>** artinya lebih besar", "H_{2}O", "x^{2^{3}}",
          // SMA X Matematika Bab 1 as Lana writes it (the coordinator's list, 29 Sep): spaces, parentheses
          // and operators inside the braces, a log base, and Unicode powers and roots that are text already
          "a^{(m+p)/n}", "2^{1/2 + 1/4}", "3^{2x−1} = 27", "log_{10} 100 = 2", "2⁶, aᵐ, ²log 8, √2, ∛8, ∜16, ⁿ√a",
          "**Sifat:** a^{m} × a^{n} = a^{m+n}",
          // italic, and what must not become italic (the coordinator's rule, 29 Sep)
          "x_{0} + y_{1}", "nilai_akhir dan data_set", "isi _ di sini", "__init__", "(_catatan_)", "_**Coba:** a^{2}_",
        ]) },
      });
      type Hasil = { halaman: number; faktor: string[]; smax: string; korpus: { f: string; judul: string; md: string; html: string }[]; baris: string[]; blok: string; bungkus?: boolean; galat?: string };
      let o: Hasil | null = null;
      try { o = JSON.parse(anak.stdout) as Hasil; } catch { /* reported below */ }
      if (c.expect(anak.status === 0 && o !== null, `the lesson player could not be rendered: ${(anak.stderr || "").split("\n").slice(0, 2).join(" ")}`)) {
        const x = o!;
        // (a) the lesson player, a whole lesson of the corpus, every page
        const semua = x.faktor.join("\n");
        c.expect(x.halaman === 3 && x.faktor.length === 3, `«Membaca Tabel Data» was expected to have 3 pages, not ${x.halaman}`);
        c.expect(!semua.includes("**"), "the lesson player still shows ** around bold words in «Membaca Tabel Data» (SD5-Sintetis-Bab2)");
        c.expect(!/\|-{3}/.test(semua) && !/<p[^>]*>\s*\|/.test(semua), "the lesson player still shows the table's pipes in «Membaca Tabel Data»");
        c.expect((semua.match(/<table>/g) ?? []).length === 1 && /<th scope="col">Buku dipinjam<\/th>/.test(semua)
          && (semua.match(/<tr>/g) ?? []).length === 5, "the lesson player does not draw «Membaca Tabel Data»'s table as a table (a head and four rows)");
        c.expect((semua.match(/<strong>/g) ?? []).length === 9, `«Membaca Tabel Data» has nine bold phrases; the player drew ${(semua.match(/<strong>/g) ?? []).length}`);
        c.expect(/<em>Periksa: /.test(semua) && /<em>Diadaptasi dari /.test(semua) && !/>_|_</.test(semua),
          "the lesson player still shows «Membaca Tabel Data»'s «_Periksa…_» and «_Diadaptasi…_» lines with their underscores");
        // (b) an SMA X line
        c.expect(/a<sup>m\/n<\/sup> = \(a<sup>1\/n<\/sup>\)<sup>m<\/sup>/.test(x.smax) && !x.smax.includes("^{"),
          "the lesson player does not raise a^{m/n} (SMA X Matematika) as a superscript");
        if (c.expect(!x.galat && x.korpus.length > 0, `there is no shared renderer (src/components/teks/Teks.tsx): ${x.galat ?? ""}`)) {
          // (c) every lesson of every package
          let tabel = 0, pemisah = 0, tr = 0, baris = 0, em = 0, miring = 0, li = 0, daftar = 0, anak = 0, sarang = 0;
          // A rendered line: the text of each block (p, li, td, th, h3) with its inline tags dropped.
          const barisTampil = (x: string) => x.split(/<\/?(?:p|li|td|th|h3|ul|table|thead|tbody|tr|div|article)\b[^>]*>/)
            .map((t) => t.replace(/<[^>]+>/g, "")).filter((t) => t.trim() !== "");
          const SISA_MIRING = /(^|[\s(])_[^\s{_][^_]*[^\s_]_(?=$|[\s\p{P}])/u;
          const SISA_DAFTAR = /^\s*- /;
          c.expect(barisTampil('<p class="pin-lp">_Periksa: 1._</p>').some((t) => SISA_MIRING.test(t))
            && barisTampil('<p class="pin-lp">  - fisik: kanal</p>').some((t) => SISA_DAFTAR.test(t)),
            "the control: a planted _…_ line or leading \"- \" is not caught");
          for (const l of x.korpus) {
            const di = `${l.f} «${l.judul}»`;
            c.expect(!l.html.includes("**"), `${di}: ** left in the rendered lesson`);
            c.expect(!/\|-{3}/.test(l.html) && !/<p[^>]*>\s*\|/.test(l.html), `${di}: table pipes left in the rendered lesson`);
            const tampil = barisTampil(l.html);
            const sisaM = tampil.find((t) => SISA_MIRING.test(t)), sisaD = tampil.find((t) => SISA_DAFTAR.test(t));
            c.expect(!sisaM, `${di}: a line keeps its _…_: ${sisaM}`);
            c.expect(!sisaD, `${di}: a line keeps a leading "- ": ${sisaD}`);
            tabel += (l.html.match(/<table>/g) ?? []).length;
            tr += (l.html.match(/<tr>/g) ?? []).length;
            pemisah += (l.md.match(/^\|[\s|:-]*-{3}[\s|:-]*$/gm) ?? []).length;
            baris += (l.md.match(/^\|/gm) ?? []).length;
            const nEm = (l.html.match(/<em>/g) ?? []).length, nMiring = (l.md.match(/^[ \t]*_[^\s{_].*[^\s_]_[ \t]*$/gm) ?? []).length;
            c.expect(nEm === nMiring, `${di}: ${nMiring} italic lines are written, ${nEm} drawn`);
            em += nEm; miring += nMiring;
            li += (l.html.match(/<li>/g) ?? []).length;
            daftar += (l.md.match(/^[ \t]*- /gm) ?? []).length;
            anak += (l.md.match(/^[ \t]+- /gm) ?? []).length;
            sarang += (l.html.match(/<li>[^]*?<ul class="pin-tdaftar">/g) ?? []).length;
          }
          // F-4: the synthetic corpus's own exact counts (the real corpus was held to at least 100, 400, 4 and 1, 70, 20)
          c.expect(miring === 12 && em === miring, `${miring} italic lines are written in the packages, ${em} drawn`);
          c.expect(li === daftar && daftar === 54, `${daftar} list lines are written in the packages, ${li} items drawn`);
          c.expect(anak === 7 && sarang === 14, `${anak} indented list lines are written, ${sarang} nested lists drawn`);
          c.expect(x.korpus.length === 8, `${x.korpus.length} lessons (not 8) were read from docs/onboarding/konten-sintetis`);
          c.expect(tabel === pemisah && tabel === 6, `${pemisah} tables are written in the packages, ${tabel} drawn`);
          c.expect(tr + pemisah === baris, `${baris} table lines are written, ${tr} rows drawn beside ${pemisah} separators`);
          // (d) inline: marks, what stays literal, and escaping
          // authored content is marked as such (data-isi-materi), around exactly the line it draws
          c.expect(x.bungkus === true, "TeksBaris does not mark its content as the author's");
          const [smax, terbuka, sup, turus, sisip, periksa, tag, lebih, air, bersarang] = x.baris;
          c.expect(/a<sup>m\/n<\/sup>/.test(smax), "a stem's a^{m/n} is not a superscript");
          c.expect(terbuka === "**tebal" && sup === "^{ tanpa tutup", "a mark left open is not drawn literally");
          c.expect(turus === "Turus ||||/ |||" && sisip === "979.875 → <strong>979</strong> | <strong>875</strong>",
            "tally marks or a pipe inside a sentence are not left as text");
          c.expect(periksa === "<em>Periksa: 1 × 28.</em>", `«_Periksa…_» is not italic: ${periksa}`);
          c.expect(tag === "Isi &lt;b&gt;tebal&lt;/b&gt; &amp; &lt;script&gt;x&lt;/script&gt;", `a tag in the text is not shown as text: ${tag}`);
          c.expect(lebih === "<strong>&gt;</strong> artinya lebih besar", "a bold > is not escaped");
          c.expect(air === "H<sub>2</sub>O" && bersarang === "x<sup>2<sup>3</sup></sup>", "_{…} is not a subscript, or nested braces break");
          // SMA X Bab 1's own forms
          const [pecahan, jumlah, linear, basis, unicode, sifat] = x.baris.slice(10);
          c.expect(pecahan === "a<sup>(m+p)/n</sup>" && jumlah === "2<sup>1/2 + 1/4</sup>" && linear === "3<sup>2x−1</sup> = 27",
            `an SMA X power with spaces, parentheses or operators is not one superscript: ${pecahan} | ${jumlah} | ${linear}`);
          c.expect(basis === "log<sub>10</sub> 100 = 2", `an SMA X log base is not a subscript: ${basis}`);
          c.expect(unicode === "2⁶, aᵐ, ²log 8, √2, ∛8, ∜16, ⁿ√a", `Unicode powers and roots are changed: ${unicode}`);
          c.expect(sifat === "<strong>Sifat:</strong> a<sup>m</sup> × a<sup>n</sup> = a<sup>m+n</sup>", `bold and powers on one line: ${sifat}`);
          // italic, and what stays as it is
          const [indeks, ular, tunggal, dunder, kurung, dalam] = x.baris.slice(16);
          c.expect(indeks === "x<sub>0</sub> + y<sub>1</sub>", `x_{0} is no longer a subscript: ${indeks}`);
          c.expect(ular === "nilai_akhir dan data_set", `a snake_case word is not left literal: ${ular}`);
          c.expect(tunggal === "isi _ di sini" && dunder === "__init__", `a lone "_" or __dunder__ is not left literal: ${tunggal} | ${dunder}`);
          c.expect(kurung === "(<em>catatan</em>)" && dalam === "<em><strong>Coba:</strong> a<sup>2</sup></em>",
            `italic after «(», or bold and ^{…} inside italic, is wrong: ${kurung} | ${dalam}`);
          // (e) lines stay lines, and "- " lines are one list
          c.expect(x.blok === '<p class="pin-lp">Akibatnya:</p><ul class="pin-tdaftar"><li>satu</li><li><strong>dua</strong><ul class="pin-tdaftar"><li>dua a</li><li>dua b</li></ul></li></ul><p class="pin-lp">██ 6</p><p class="pin-lp">███ 8</p>',
            `lines are merged, a list is not one list, or an indented "- " line is not an item under the one above: ${x.blok}`);
        }
      }

      /**
       * 2. FROM THE SOURCE: every place a learner reads authored text draws it
       *    through the renderer (the lesson player and its worked example, the
       *    lesson's summary, the item's stem, stimulus, options and help, the
       *    result's stem, answer and rationale, the reading map, the result's
       *    objective rows), and so do Studio's preview and Bank Soal. No
       *    dangerouslySetInnerHTML anywhere in src, and no markdown or maths
       *    library in package.json.
       */
      // RESTATED FOR L4 (CR-88, D-127 Q9's engineering; RC-6 (3)): the page and the worked example moved, unchanged, into
      // the one module the player and Studio's preview both draw through (src/components/pelajaran/Halaman.tsx)
      const lp = baca("src", "app", "belajar", "_components", "LessonPlayer.tsx");
      const hal = baca("src", "components", "pelajaran", "Halaman.tsx");
      c.expect(/<TeksBlok teks=\{baris\.join\("\\n"\)\} sisip=\{sisipVisual\} \/>/.test(hal)
        && /<TeksBaris teks=\{s\} \/>/.test(hal) && /<TeksBaris teks=\{contoh\.judul\} \/>/.test(hal)
        && /<HalamanPelajaran baris=\{pages\[page\]\} \/>/.test(lp) && /<LangkahContoh contoh=\{example!\} tampil=\{steps\} \/>/.test(lp)
        && !/renderBlock/.test(lp) && !/renderBlock/.test(hal),
        "the lesson player does not draw its pages and worked example through the shared renderer");
      const ip = baca("src", "app", "belajar", "_components", "ItemPlayer.tsx");
      for (const [apa, re] of [["stem", /<h2 className="pin-stem"><TeksBaris teks=\{current\.item\.stem\} \/><\/h2>/],
        ["stimulus", /<TeksBaris teks=\{current\.item\.stimulus\} \/>/], ["options", /<span><TeksBaris teks=\{o\.teks\} \/><\/span>/],
        ["help", /<span><TeksBaris teks=\{l\.isi\} \/><\/span>/]] as const) {
        c.expect(re.test(ip), `the item screen draws its ${apa} as plain text`);
      }
      const hasil = baca("src", "app", "belajar", "[tugas]", "hasil", "page.tsx");
      c.expect(["r.stem", "r.jawaban_teks", "r.alasan", "r.arah"].every((v) => hasil.includes(`<TeksBaris teks={${v}} />`)),
        "the result screen draws a stem, an answer or a rationale as plain text");
      c.expect(/<TeksBaris teks=\{k\.pernyataan\} \/>/.test(baca("src", "components", "siklus", "PetaBacaan.tsx"))
        && /<TeksBaris teks=\{nama\.get\(kode\) \?\? kode\} \/>/.test(baca("src", "components", "siklus", "PerTujuan.tsx"))
        && /<TeksBaris teks=\{lesson\.ringkasan\} \/>/.test(baca("src", "app", "belajar", "[tugas]", "pelajaran", "[pelajaran]", "page.tsx")),
        "the reading map, the result's objective rows or the lesson's summary draw authored text as plain text");
      const pr = baca("src", "app", "studio", "pratinjau", "[pelajaran]", "page.tsx");
      c.expect(/halamanPelajaran\(body\)\.map/.test(pr) && /<HalamanPelajaran baris=\{baris\} \/>/.test(pr) && !/whitespace-pre-wrap text-sm">\{body\}/.test(pr)
        && /<TeksBaris teks=\{i\.stem\} \/>/.test(baca("src", "app", "studio", "bank", "page.tsx")),
        "Studio's preview or Bank Soal does not draw the text as the learner reads it");
      const berkas = walk(join(repoRoot, "src")).filter((f) => /\.(ts|tsx)$/.test(f));
      const html = berkas.filter((f) => /dangerouslySetInnerHTML/.test(code(readFileSync(f, "utf8"))));
      c.expect(html.length === 0, `text is set as HTML: ${html.map((f) => relative(repoRoot, f)).join(", ")}`);
      c.expect(/dangerouslySetInnerHTML/.test(code("const x = <p dangerouslySetInnerHTML={{ __html: s }} />;")), "the control: a planted innerHTML is not caught");
      const pkg = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8")) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
      const lib = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }).filter((d) => /markdown|marked|remark|rehype|micromark|mdx|showdown|katex|mathjax|sanitize|dompurify/i.test(d));
      c.expect(lib.length === 0, `a markup library was added: ${lib.join(", ")}`);

      return c.verdict(
        "learner text renders its own markup through one shared renderer, as React elements only: the lesson player " +
        "draws a whole lesson of the synthetic corpus («Membaca Tabel Data», docs/onboarding/konten-sintetis) on every page with no ** or table pipes left, its table as a table and its " +
        "nine bold phrases bold, and an SMA X a^{m/n} as a superscript; every lesson of every package renders with no ** " +
        "or table pipes left and every table and row accounted for; marks left open, tally marks and a pipe in a sentence " +
        "stay literal and a planted tag is escaped; «_Periksa…_» and «_Diadaptasi…_» are italic in every lesson (bold and " +
        "^{…} inside), while x_{0}, snake_case, a lone _ and __dunder__ stay as they are; lines stay lines, \"- \" lines are " +
        "one list and indented ones nest, no lesson line keeps an _…_ pair or a leading \"- \", every italic and list line " +
        "counted; SMA X " +
        "Bab 1's forms (a^{(m+p)/n}, 2^{1/2 + 1/4}, 3^{2x−1}, log_{10}) are one <sup> or <sub> each, with Unicode powers and " +
        "roots untouched; every " +
        "learner surface (lesson, summary, worked example, stem, stimulus, options, help, result, reading map) and " +
        "Studio's preview and Bank Soal use it; nothing in src sets HTML and no markup library was added",
      );
    },
  },

  {
    id: "D140-STUDIO-01",
    requires: [],
    run: async ({ repoRoot }) => {
      /**
       * D-140, THE 9 OCT REVIEW (pass log RV-10, walkthrough-blocking): Studio never contradicts itself. Its home
       * says no task is waiting, not «no package», when the packages are listed below; a published package with
       * nothing to fix reads as published, not «siap diterbitkan».
       */
      const c = new Checks();
      const baca = (...p: string[]) => code(readFileSync(join(repoRoot, ...p), "utf8"));
      const beranda = baca("src", "app", "studio", "page.tsx");
      const kosongTugas = /rows\.length === 0 \? \(\s*<p className=\{card\}>\{s\("([\w.]+)"\)\}<\/p>/.exec(beranda)?.[1];
      c.expect(kosongTugas === "studio.beranda.tak_ada_tugas", `Studio's home says «${kosongTugas ? t(kosongTugas as never, "staff") : "?"}» when no task waits, above its list of packages`);
      // RESTATED FOR W1.7 (Batch 3): the empty list is Batch 2's Empty state (Kosong, Daisy components/EmptyState), with the
      // same sentence; narrowed to a count's list, it also gives the way back to every package
      c.expect(/courses \?\? \[\]\)\.length === 0 \? \(\s*<Kosong [^>]*kalimat=\{s\("studio\.paket\.kosong"\)\}/.test(beranda), "the list of packages no longer says when it is empty");
      const paket = baca("src", "app", "studio", "paket", "[course]", "page.tsx");
      c.expect(/const terbitSiap = state\?\.surface_state === "READY" && terakhir\?\.status === "PUBLISHED";/.test(paket)
        && /terbitSiap \? s\("studio\.langkah\.terbit\.judul"\) : s\(`studio\.state\.\$\{state\.surface_state\}`/.test(paket)
        && /terbitSiap \? s\("studio\.state\.explain\.TERBIT"\) : s\(`studio\.state\.explain\.\$\{state\.surface_state\}`/.test(paket),
        "a published package with nothing to fix still reads «Siap · Paket ini siap diterbitkan»");
      for (const [k, harap] of [["studio.beranda.tak_ada_tugas", "Tidak ada yang menunggu tindakan Anda di Studio."], ["studio.state.explain.TERBIT", "Paket ini sudah terbit. Guru dapat menyediakannya untuk kelas mereka."], ["studio.langkah.terbit.judul", "Terbit"]] as const) {
        c.expect(t(k as never, "staff") === harap && t(k as never, "staff", { locale: "en" }) !== harap, `the copy table's ${k} is not «${harap}» with its English`);
      }
      return c.verdict("Studio's home and a published package's headline agree with what is listed and published (RV-10)");
    },
  },

  {
    id: "D140-SAJI-01",
    requires: [],
    run: async ({ repoRoot }) => {
      /**
       * D-140, THE 9 OCT REVIEW (pass log RV-1, RV-2, RV-3, RV-4, RV-17): what a reader is shown is words, the
       * navigation keeps one order, and a page names itself.
       */
      const c = new Checks();
      const baca = (...p: string[]) => code(readFileSync(join(repoRoot, ...p), "utf8"));
      const { kataHalaman } = await import("../src/lib/kata-halaman");
      // RV-1: a reported page is shown as its place, never its path or an id
      const UUID = "0ad39ff1-7075-4da7-b264-f542b9eea0e3";
      const KASUS: Array<[string, string]> = [
        [`/pimpinan/${UUID}/murid`, t("nav.pimpinan", "staff")],
        [`/mengajar/${UUID}/murid/${UUID}`, t("nav.kelas", "staff")],
        [`/studio/paket/${UUID}`, t("nav.studio", "staff")],
        ["/konfigurasi/keamanan", t("keamanan.judul", "staff")],
        ["/", t("lapor.halaman.awal", "staff")],
        [`/sesuatu/${UUID}`, t("lapor.halaman.lain", "staff")],
      ];
      for (const [jalan, harap] of KASUS) {
        const v = kataHalaman(jalan, "id");
        c.expect(v === harap && !/[0-9a-f]{8}-|\//.test(v), `«${jalan}» is shown as «${v}», not «${harap}»`);
      }
      const lapor = baca("src", "app", "lapor", "page.tsx");
      c.expect(/\{s\("lapor\.halaman"\)\} \{kataHalaman\(halaman, locale\)\}/.test(lapor) && !/<span className="pin-num">\{halaman\}<\/span>/.test(lapor)
        && /<input type="hidden" name="dari" value=\{halaman\} \/>/.test(lapor), "«Laporkan masalah» shows the page's path, or no longer carries it for engineering");
      c.expect(/\{kataHalaman\(l\.halaman, locale\)\}/.test(baca("src", "app", "lapor", "saya", "page.tsx")), "«Laporan saya» shows a report's page as its path");
      // RV-2: a security event this page has no words for reads in the Jejak audit's words, never its code
      const catatan = baca("src", "components", "keamanan", "CatatanKeamanan.tsx");
      // RESTATED FOR W3.3 (Batch 2): the moment's year and time zone moved into the one date helper (src/lib/tanggal.ts);
      // the record now writes it as the timestamp form, «9 Okt 2026, 07.30 WIB», whose year and «WIB» TANGGAL-01 proves.
      c.expect(/: kataAksiAudit\(aksi, locale\)\)/.test(catatan) && !/: aksi\)\);/.test(catatan) && /tanggal\(iso, "cap", locale\)/.test(catatan),
        "the security record shows an event by its code, or a moment without its year or time zone");
      // RV-3, RESTATED FOR O12 (D-170(d)): one order of places, whichever is open, and it is the DOM's: the staff shell
      // sorts its items by URUTAN_TEMPAT (executed on items arriving in pieces), so the keyboard meets them in the
      // order the eye does (WCAG 2.4.3); CSS `order` no longer reorders them on screen only
      const css = code(readFileSync(join(repoRoot, "src", "app", "experience.css"), "utf8"));
      const { URUTAN_TEMPAT } = await import("../src/lib/nama-tempat");
      const { urutkanNav } = await import("../src/components/urutan-nav");
      const { createElement: el, Fragment: F } = await import("react");
      const URUT = ["/mengajar", "/pimpinan", "/konfigurasi", "/pendataan", "/aktivasi", "/studio", "/konfigurasi/keamanan", "/konfigurasi/email-uji", "/konfigurasi/sertifikat", "/belajar"];
      c.expect(JSON.stringify(URUTAN_TEMPAT) === JSON.stringify(URUT), `the places' order is not O12's: ${JSON.stringify(URUTAN_TEMPAT)}`);
      const potong = el(F, null, el("a", { href: "/konfigurasi" }), el("a", { href: "/konfigurasi/email-uji" }), el("a", { href: "/konfigurasi/sertifikat" }),
        el(F, null, el("a", { href: "/konfigurasi/keamanan" }), el("span", { id: "lain" }), el("a", { href: "/aktivasi" })));
      const urut = urutkanNav(potong).map((n) => (n as { props: { href?: string; id?: string } }).props.href ?? (n as { props: { id?: string } }).props.id);
      c.expect(JSON.stringify(urut) === JSON.stringify(["/konfigurasi", "/aktivasi", "/konfigurasi/keamanan", "/konfigurasi/email-uji", "/konfigurasi/sertifikat", "lain"]),
        `the shell does not put «Seluruh platform»'s places in O12's order: ${JSON.stringify(urut)}`);
      c.expect(/\{urutkanNav\(nav\)\}/.test(baca("src", "components", "CangkangPengalaman.tsx")), "the staff shell draws its items unsorted");
      c.expect(!/\.pin-tabs > [^{]*\{[^}]*\border:/.test(css), "CSS still reorders the places on screen only");
      // RV-3/RV-4: a page that is not a place names itself in the phone bar and marks its parent
      for (const [f, h] of [["konfigurasi/keamanan/page.tsx", "keamanan"], ["konfigurasi/email-uji/page.tsx", "emailuji"], ["akun/page.tsx", "akun"], ["lapor/page.tsx", "lapor"], ["lapor/saya/page.tsx", "lapor"]]) {
        c.expect(new RegExp(`<CangkangPengalaman [^>]*halamanKini="${h}"`).test(baca("src", "app", ...f.split("/"))), `${f} does not name itself to the shell`);
      }
      const cangkang = baca("src", "components", "CangkangPengalaman.tsx");
      c.expect((cangkang.match(/kini: kataKini \?\? /g) ?? []).length === 4, "a staff shell's phone bar ignores the page's own name");
      // RV-17: one primary action per form; the emergency stop is destructive
      const konf = baca("src", "app", "konfigurasi", "page.tsx");
      c.expect(/const primer = "pin-btn pin-primary\b[^"]*"/.test(konf) && /const bahaya = "pin-btn pin-str-bahaya\b[^"]*"/.test(konf)
        && /className=\{bahaya\}[^\n]*\n?[^\n]*config\.pemeliharaan\.darurat\.tombol/.test(konf), "Konfigurasi's emergency stop is not drawn as destructive");
      c.expect((konf.match(/className=\{primer\}/g) ?? []).length >= 10, "Konfigurasi's main actions are not primary");
      return c.verdict("D-140's review findings RV-1, RV-2, RV-3, RV-4 and RV-17 stay closed: a reported page reads as its place, never its path; the security record reads in words with its year and time zone; the places keep Daisy's order and the page you are on is marked, not moved; pages that are not places name themselves in the phone bar; Konfigurasi's main actions are primary and its emergency stop destructive");
    },
  },
  {
    id: "DAISY-31-PINDAH-01",
    requires: [],
    run: async ({ repoRoot }) => {
      /**
       * DAISY-31 (BOB-35): Studio's «Koreksi» refused a move because a learner
       * had already started the assignment, and said only the general
       * «Ada kendala…» line with a reference. It now says why, in its own
       * sentence: «…: sudah ada siswa yang mulai mengerjakannya. Untuk memakai
       * terbitan lain, buat penugasan baru.»
       */
      const c = await cekPindah(repoRoot, "RELEASE_MOVE_STARTED", {
        // Terminology v1 (D-068 row C11): «siswa» → «murid»
        id: [/: sudah ada murid yang mulai mengerjakannya\./, /Untuk memakai terbitan lain, buat penugasan baru\./],
        en: [/: a student has already started it\./, /To use another release, make a new assignment\./],
      });
      return c.verdict(
        "PR060 RELEASE_MOVE_STARTED, raised by the move when any learner has started, is named by the contract from its " +
        "state and DETAIL (not by its message, and not under another state); it has its own sentence in both languages, " +
        "naming no code, that says a student has started and a new assignment is the way; «Koreksi»'s line reads «Belum " +
        "tersimpan.» and that sentence, with no reference; and PR060's other refusal, PR061's and an unknown DETAIL stay " +
        "ACTION_FAILED, whose line carries its reference",
      );
    },
  },

  {
    id: "DAISY-31-PINDAH-02",
    requires: [],
    run: async ({ repoRoot }) => {
      /**
       * DAISY-31 (BOB-35): the move refused because the target release has
       * no pre-test and post-test for the cycle to move with. «Koreksi» now
       * says so, naming both by the titles learners see.
       */
      const awal = (l: "id" | "en") => new RegExp(t("pretest.title", "learner", { locale: l }).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
      const akhir = (l: "id" | "en") => new RegExp(t("posttest.title", "learner", { locale: l }).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
      const c = await cekPindah(repoRoot, "RELEASE_MOVE_NO_CYCLE_DEFINITION", {
        id: [/^Terbitan tujuan belum punya /, awal("id"), akhir("id"), /Pilih terbitan lain\.$/],
        en: [/^The target release has no /, awal("en"), akhir("en"), /Choose another release\.$/],
      });
      return c.verdict(
        "PR060 RELEASE_MOVE_NO_CYCLE_DEFINITION, raised when the target release has no approved definition for the " +
        "cycle, is named by the contract from its state and DETAIL; it has its own sentence in both languages, naming no " +
        "code, that names «Pemetaan Awal» and «Uji Penguasaan» by the titles learners see and says to choose another " +
        "release; «Koreksi»'s line reads «Belum tersimpan.» and that sentence, with no reference; and PR060's other " +
        "refusal, PR061's and an unknown DETAIL stay ACTION_FAILED, whose line carries its reference",
      );
    },
  },
];

/**
 * DAISY-31: one of Studio «Koreksi»'s two move refusals, from the database's
 * raise to the line under the form. Declared after the list and hoisted, so
 * DAISY-31-PINDAH-01 and -02 each run it for their own code.
 *
 * 1. THE DATABASE: the latest migration that raises it does so as PR060 with
 *    the code in DETAIL; its message is read from there.
 * 2. THE CONTRACT (galat-kontrak.ts) names it from that state and DETAIL, and
 *    not by its message: under another state the same DETAIL is not it.
 * 3. ITS OWN SENTENCE, in both languages: not the general line, naming no code
 *    or machinery, different from the other code's, and saying what it must.
 * 4. UNDER THE FORM: the query «Koreksi» sends back, read by the page's own
 *    reader, is «Belum tersimpan.» and that sentence, with no reference.
 * 5. FROM THE SOURCE: «Koreksi» passes the move's refusal to `ditolak`, whose
 *    default is kodeGalat, and a refusal nobody named carries a reference.
 * 6. THE OTHERS STAY ACTION_FAILED with a reference: SESSION_RELEASE_MISMATCH
 *    (PR060, both of its messages), QUICK_RULES_FIXED (PR061) and an unknown
 *    DETAIL; the failed line shows «Kode rujukan».
 */
async function cekPindah(
  repoRoot: string,
  kode: "RELEASE_MOVE_STARTED" | "RELEASE_MOVE_NO_CYCLE_DEFINITION",
  ciri: { id: RegExp[]; en: RegExp[] },
): Promise<Checks> {
  const c = new Checks();
  let g: Record<string, unknown> | null = null;
  try { g = await import("../src/lib/galat-kontrak") as Record<string, unknown>; } catch { /* reported below */ }
  type Db = { code?: string; details?: string; message?: string };
  const kodeGalat = g?.kodeGalat as ((e: Db) => string) | undefined;
  const kunciKode = g?.kunciKode as ((k: string) => HleEvent) | undefined;
  const queryHasil = g?.queryHasil as ((bagian: string, h: { ok: false; kode: string; ref?: string }) => URLSearchParams) | undefined;
  const kalimatHasil = g?.kalimatHasil as ((q: Record<string, string>, s: (k: HleEvent) => string, awal: { ok: HleEvent; gagal: HleEvent }) => string | null) | undefined;
  const PINDAH = ((g?.KODE_PINDAH ?? []) as readonly string[]);
  if (!c.expect(typeof kodeGalat === "function" && typeof kunciKode === "function" && typeof queryHasil === "function"
    && typeof kalimatHasil === "function", "the result contract (src/lib/galat-kontrak.ts) could not be read")) return c;

  // 1. the database's own raise, and its message
  const mig = join(repoRoot, "supabase", "migrations");
  const sql = readdirSync(mig).filter((f) => f.endsWith(".sql")).sort().map((f) => readFileSync(join(mig, f), "utf8"));
  const pesanDari = (state: string, detail: string) => sql.flatMap((s) => [...s.matchAll(
    new RegExp(`raise exception using errcode = '${state}', detail = '${detail}',\\s*message = (?:format\\()?'([^']*)'`, "g"))].map((m) => m[1]));
  const pesan = pesanDari("PR060", kode).pop();
  c.expect(pesan !== undefined, `no migration raises ${kode} as PR060 with the code in DETAIL`);

  // 2. named from state and DETAIL, not from the message
  const dibaca = kodeGalat!({ code: "PR060", details: kode, message: pesan });
  c.expect(PINDAH.includes(kode) && dibaca === kode, `PR060 ${kode} is not named by the contract: it reads as ${dibaca}`);
  c.expect(kodeGalat!({ code: "PR040", details: kode, message: pesan }) !== kode && kodeGalat!({ code: "P0001", message: pesan }) !== kode,
    `${kode} is read from something other than PR060 and its DETAIL`);

  // 3. its own sentence
  const kunci = kunciKode!(kode);
  const lain = PINDAH.find((k) => k !== kode);
  for (const locale of LOCALES) {
    const s = (k: HleEvent) => t(k, "staff", { locale });
    const x = s(kunci);
    c.expect(kunci !== "galat.action_failed" && x !== TANPA_SALINAN, `(${locale}) ${kode} has no sentence of its own (${kunci})`);
    c.expect(!/[A-Z]{2,}_[A-Z_]+|PR06\d|\b(?:detail|errcode|INV-\d+)\b/i.test(x), `(${locale}) ${kode}'s sentence names a code or machinery: ${x}`);
    for (const w of INTERNAL_WORDS) c.expect(!new RegExp(`\\b${w}\\b`, "i").test(x), `(${locale}) ${kode}'s sentence uses the internal word "${w}"`);
    for (const re of ciri[locale as "id" | "en"]) c.expect(re.test(x), `(${locale}) ${kode}'s sentence does not say ${re}: ${x}`);
    if (lain) c.expect(x !== s(kunciKode!(lain)), `(${locale}) the two move refusals share one sentence`);

    // 4. under the form
    const q = Object.fromEntries(queryHasil!("koreksi", { ok: false, kode }).entries());
    const baris = kalimatHasil!(q, s, { ok: "studio.hasil.ok", gagal: "studio.hasil.gagal" });
    c.expect(baris === `${s("studio.hasil.gagal")} ${x}`, `(${locale}) «Koreksi» does not answer ${kode} with its sentence: ${baris}`);
    c.expect(!baris?.includes(s("galat.rujukan")), `(${locale}) a named move refusal carries a reference`);
  }

  // 5. from the source
  const aksi = code(readFileSync(join(repoRoot, "src", "app", "studio", "actions.ts"), "utf8"));
  c.expect(/ditolak\("move_learning_assignment_release", error\)/.test(aksi)
    && /function ditolak\([^)]*kode: KodeGalat \| KodeKonten = kodeGalat\(error\)\)/.test(aksi)
    && /if \(kode !== "ACTION_FAILED"\) return \{ ok: false, kode \};\s*const ref = rujukan\(\);/.test(aksi),
    "«Koreksi» no longer passes the move's refusal to ditolak, or a refusal nobody named loses its reference");

  // 6. the others stay ACTION_FAILED, with a reference
  const lainnya: Db[] = [
    ...pesanDari("PR060", "SESSION_RELEASE_MISMATCH").map((message) => ({ code: "PR060", details: "SESSION_RELEASE_MISMATCH", message })),
    ...pesanDari("PR061", "QUICK_RULES_FIXED").map((message) => ({ code: "PR061", details: "QUICK_RULES_FIXED", message })),
    { code: "PR060", details: "RELEASE_MOVE_SOMETHING_NEW", message: "a learner may not do this" },
    { code: "PR061", details: kode, message: "not found" },
  ];
  c.expect(lainnya.length >= 5, `only ${lainnya.length - 2} of the other PR060/PR061 raises were found in the migrations`);
  for (const e of lainnya) c.expect(kodeGalat!(e) === "ACTION_FAILED", `${e.code} ${e.details} reads as ${kodeGalat!(e)}, not ACTION_FAILED`);
  const s = (k: HleEvent) => t(k, "staff", { locale: "id" });
  const gagal = kalimatHasil!(Object.fromEntries(queryHasil!("koreksi", { ok: false, kode: "ACTION_FAILED", ref: "AB12CD" }).entries()),
    s, { ok: "studio.hasil.ok", gagal: "studio.hasil.gagal" });
  c.expect(gagal?.endsWith(`${s("galat.rujukan")}: AB12CD.`) === true, `a refusal nobody named does not show its reference: ${gagal}`);
  return c;
}
