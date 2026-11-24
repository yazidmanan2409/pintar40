/**
 * D2-R (ruling 89; D2-CERTIFICATE-CONDITIONS-SPEC.md §6 and rev. 4 §7): THE APP'S HALF. The database's half is
 * selftest/db/fable39.sql (D2R-D*, D2R-H01..H16, D2R-C01, C04, E01, F01). Build map: docs/completion-4.1/d2r/D2R-BUILD-MAP.md.
 * Strings of record: Daisy's D2R-KATA.md (ux-1/daisy-experience dc275f6a, §6 «Baca lagi:» without a threshold).
 *
 *   D2R-H18  THE LIST GUARD (Z-D1-02's form): every function a signed-in client may execute, and every view it may read,
 *            whose body reaches answer-bearing data (an option's correctness or rationale, a misconception's remedy, a key
 *            correction, a re-grade, per-objective mastery, an item's thinking prompt or hint) is on one of three lists:
 *              STAFF       refused unless the caller holds a staff capability over the learner or the content;
 *              LESSON      the learner's own reading material (lessons and their worked examples), not an assessment;
 *              RESTRICTED  a learner read of a sitting, which must read the sitting's captured policy (bersertifikasi or
 *                          assistance_policy) so a certifying sitting discloses counts only.
 *            A reader on none of them fails, so a new learner-facing reader cannot land unclassified. Plants: a planted
 *            plpgsql reader, a BEGIN ATOMIC one and a view over item_options, each must be named.
 *   D2R-H11  the engine's result-side forbidden-key check: a certifying result that carries a key, a mark or an explanation
 *            throws rather than reaching a page (a planted payload is caught; a non-certifying one passes untouched)
 *   D2R-H08  the chapter result page, the Hasil Belajar summary and its print: a certifying result draws no per-question
 *            review, no per-objective figures and no key; it draws Daisy's order (decision, revisit list, retake, counts,
 *            the not-shown line), and the review RPC is not asked for it
 *   D2R-H15  no learner route offers an export (no Content-Disposition under src/app outside the staff surfaces)
 *   D2R-C02  no «Predikat» is rendered on the card, the printable record, the A4 sheet or /verifikasi
 *   D2R-C03  the list: no file under src/app or src/components renders a band, outside the internal reports
 *   D2R-W01  the strings of record, word for word in ID and EN (R-a, R-b, the admin column, verifikasi.lulus, R-g,
 *            R-h's set, the pre-start «no help» line)
 *   D2R-G01  R-g: with Pemetaan Awal done and lessons unread, the chapter offers Uji Penguasaan beside «Lanjut membaca»,
 *            with the advisory line; reading stays the first action
 *   D2R-D05  R-d at the player: the player schedules help only from session_state's window (which the database withholds
 *            on a certifying sitting), and the orientation promises no help and says so on a certifying mode
 *   D2R-F02  R-f on the learner's result: the attempt ordinal is shown on the chapter result, from the outcome
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";
import { psql } from "./bob26.test";
import { t, type HleEvent } from "../src/lib/hle";

const baca = (root: string, f: string) => readFileSync(join(root, f), "utf8");
const tanpaKomentar = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1").replace(/\{\/\*[\s\S]*?\*\/\}/g, "");

function semuaBerkas(dir: string, akar = dir): string[] {
  const out: string[] = [];
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) out.push(...semuaBerkas(p, akar));
    else if (/\.(tsx?|mjs)$/.test(n)) out.push(p.slice(akar.length + 1));
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────── H18, the list guard
/** Refused unless the caller holds a staff capability over the learner or the content (each read checked by hand). */
export const PEMBACA_STAF = [
  "fn:ajukan_koreksi_kunci", "fn:distributed_lesson_preview", "fn:koreksi_kunci_antrean", "fn:koreksi_kunci_dampak",
  "fn:koreksi_kunci_terakhir", "fn:murid_perlu_penguatan", "fn:pemberitahuan_koreksi_kunci", "fn:pratinjau_koreksi_kunci",
  "fn:recompute_result", "fn:riwayat_hasil_sesi", "fn:riwayat_soal", "fn:run_mcq_quality", "fn:teacher_question_evidence",
  "fn:tegaskan_koreksi_kunci", "fn:tinjauan_sertifikat_antrean", "fn:tolak_koreksi_kunci", "fn:tujuan_belum_tercapai",
] as const;
/** The learner's own reading material: lessons and their worked examples, which no sitting is graded on. */
export const PEMBACA_PELAJARAN = ["fn:learner_lessons"] as const;
/** A learner's read of a sitting: each must read the sitting's captured policy (the guard checks the body for it). */
export const PEMBACA_TERBATAS = ["fn:assistance_state", "fn:hasil_koreksi_saya", "fn:open_assistance", "fn:reading_map", "fn:session_outcome", "fn:session_review", "fn:session_state"] as const;

const BAHAN = String.raw`is_correct|rationale|remediation|key_corrections|nilai_jawaban_berlaku|grade_response|per_domain|arah_berpikir|petunjuk|worked_examples|kunci_berlaku_sesi`;
const TANGKAP = String.raw`bersertifikasi|assistance_policy`;

export const PEMBACA_TANAMAN: Array<[string, string]> = [
  ["fn:z_tanam_kunci", "create function public.z_tanam_kunci(p uuid) returns boolean language plpgsql security definer as $$ begin return (select o.is_correct from public.item_options o where o.item_id = p limit 1); end $$; grant execute on function public.z_tanam_kunci(uuid) to authenticated;"],
  ["fn:z_tanam_atomik", "create function public.z_tanam_atomik(p uuid) returns text language sql security definer begin atomic select o.rationale from public.item_options o where o.item_id = p limit 1; end; grant execute on function public.z_tanam_atomik(uuid) to authenticated;"],
  ["view:z_tanam_pandang", "create view public.z_tanam_pandang as select o.item_id, o.is_correct from public.item_options o; grant select on public.z_tanam_pandang to authenticated;"],
];

/** Every learner-reachable reader of answer-bearing data, and whether its body reads the sitting's captured policy. */
export function pembacaJawaban(tanam = ""): Map<string, boolean> {
  const baris = psql(`begin;
${tanam}
select k || '|' || tangkap from (
  select 'fn:' || p.proname as k, (pg_get_functiondef(p.oid) ~ '${TANGKAP}')::text as tangkap
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.prokind in ('f', 'p') and has_function_privilege('authenticated', p.oid, 'EXECUTE')
     and pg_get_functiondef(p.oid) ~* '(${BAHAN})'
  union
  select 'view:' || c.relname, 'false'
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind in ('v', 'm') and has_table_privilege('authenticated', c.oid, 'SELECT')
     and pg_get_viewdef(c.oid) ~* '(${BAHAN})'
) x order by 1;
rollback;`).split("\n").filter((b) => /^(fn|view):/.test(b));
  return new Map(baris.map((b) => { const [k, v] = b.split("|"); return [k, v === "true"] as const; }));
}

// ─────────────────────────────────────────────────────────────────────────────────────────────── W01, the strings
/** Daisy's D2R-KATA.md (dc275f6a), the spec's R-a and R-b, and rev. 4's two alignments: [key, ID, EN]. */
export const KATA_D2R: Array<[HleEvent, string, string]> = [
  ["sertifikat.jenis" as HleEvent, "Sertifikat", "Certificate"],
  ["sertifikat.berkas" as HleEvent, "Sertifikat · {kursus}", "Certificate · {kursus}"],
  ["sertifikat.diberikan" as HleEvent, "Telah dinyatakan memenuhi kriteria kelulusan yang ditetapkan berdasarkan hasil asesmen pada Materi Pembelajaran: {kursus}.",
    "Has been declared to meet the passing criteria set on the basis of assessment results in the Learning Material: {kursus}."],
  ["sertifikat.kelola.kolom.kursus" as HleEvent, "Materi Pembelajaran", "Learning Material"],
  ["verifikasi.lulus" as HleEvent, "Lulus", "Passed"],
  ["siklus.siap.saran" as HleEvent, "Uji Penguasaan sudah dapat dikerjakan. Sebaiknya baca semua pelajaran lebih dulu.", "You can take the Mastery Check now. It is best to read every lesson first."],
  ["posttest.tanpa_bantuan" as HleEvent, "Selama Uji Penguasaan, petunjuk, contoh, dan arah berpikir tidak tersedia.", "During the Mastery Check, hints, examples and thinking prompts are not available."],
  // Daisy via Bob 02:06Z: the certifying Asesmen Mandiri's own line, and «kesempatan», the word learners and teachers use
  ["posttest.tanpa_bantuan_umum" as HleEvent, "Selama asesmen ini, petunjuk, contoh, dan arah berpikir tidak tersedia.", "During this assessment, hints, examples and thinking prompts are not available."],
  ["hasil.percobaan_ke" as HleEvent, "Kesempatan ke-{n}", "Attempt {n}"],
  ["hasil.lulus" as HleEvent, "Lulus.", "Passed."],
  ["hasil.lulus_arti" as HleEvent, "Hasil Uji Penguasaan ini memenuhi kriteria kelulusan bab ini.", "This Mastery Check result meets this chapter's passing criteria."],
  ["hasil.belum_lulus" as HleEvent, "Belum lulus.", "Not passed yet."],
  ["hasil.belum_lulus_arti" as HleEvent, "Hasil Uji Penguasaan ini belum memenuhi kriteria kelulusan bab ini.", "This Mastery Check result does not meet this chapter's passing criteria yet."],
  ["hasil.target.belum_gerbang" as HleEvent, "Persentase penguasaan bab ini sudah memenuhi target, tetapi ada soal penting yang belum dijawab dengan tepat. Karena itu Uji Penguasaan ini belum lulus. Tanyakan kepada guru Anda langkah berikutnya.",
    "Your mastery percentage for this chapter meets the target, but an important question was not answered correctly. So this Mastery Check is not passed yet. Ask your teacher about the next step."],
  ["hasil.baca_lagi" as HleEvent, "Baca lagi:", "Read again:"],
  ["hasil.baca_lagi_arti" as HleEvent, "Bagian ini disarankan untuk dibaca lagi. Saran ini bukan penilaian atas penguasaan Anda pada bagian ini.",
    "These parts are suggested for reading again. This is advice, not a judgement of your mastery of them."],
  ["hasil.ulang_boleh" as HleEvent, "Anda dapat mengerjakan Uji Penguasaan lagi sesuai aturan sekolah. Tanyakan kepada guru Anda kapan dapat mengulang.",
    "You can take the Mastery Check again under your school's rules. Ask your teacher when you can retake it."],
  ["hasil.dijawab_tepat" as HleEvent, "dijawab tepat", "answered right"],
  // Daisy's §8 (2bfbd3d7): reworded so DAISY-26 needs no exemption
  ["hasil.tidak_ditampilkan" as HleEvent, "Pada Uji Penguasaan, jawaban yang tepat dan hasil tiap soal tidak ditampilkan.",
    "In a Mastery Check, the right answers and the result of each question are not shown."],
  // Daisy's §11 (deacb184): Hasil Belajar and its print, on every certifying row
  ["hasilbelajar.baca_lagi" as HleEvent, "Disarankan dibaca lagi: {daftar}.", "Suggested for reading again: {daftar}."],
  ["hasilbelajar.baca_lagi_banyak" as HleEvent, "Ada {n} bagian yang disarankan untuk dibaca lagi; semuanya ditandai «baca lagi» di bagian B.",
    "{n} parts are suggested for reading again; each is marked «read again» in section B."],
  ["hasilbelajar.baca_lagi_tanda" as HleEvent, "baca lagi", "read again"],
  ["hasilbelajar.gerbang" as HleEvent, "Ada soal penting yang belum tepat, jadi Uji Penguasaan bab ini belum lulus.", "An important question is not right yet, so this chapter's Mastery Check is not passed yet."],
];

// ─────────────────────────────────────────────────────────────────────────────────────────────── C02/C03, the band
/** The surfaces where the band is no longer rendered (R-c, rev. 4): the card and its printable record, the A4 sheet, the
 *  public page. Files under src/app and src/components that render a band are listed here only if they are an internal
 *  report; none is today. */
export const PREDIKAT_LAPORAN_INTERNAL: readonly string[] = [];
const RENDER_PREDIKAT = /\{\s*[\w!?.]+\.predikat\s*(\?|&&|\})|["'](?:sertifikat|verifikasi)\.predikat["']/;

export function situsPredikat(root: string, tambahan: Record<string, string> = {}): string[] {
  const berkas = [...semuaBerkas(join(root, "src", "app")).map((f) => join("src", "app", f)),
                  ...semuaBerkas(join(root, "src", "components")).map((f) => join("src", "components", f))]
    .filter((f) => f.endsWith(".tsx"));
  const isi = (f: string) => tambahan[f] ?? tanpaKomentar(baca(root, f));
  return [...berkas, ...Object.keys(tambahan).filter((f) => !berkas.includes(f))]
    .filter((f) => RENDER_PREDIKAT.test(isi(f)) && !PREDIKAT_LAPORAN_INTERNAL.includes(f));
}


// ─────────────────────────────────────────────────────────────────────────────────────────────── H21/C05, rendered
/** Renders HasilBersertifikasi in a child (tsx), in ID: the props are JSON in the environment. */
function renderHasil(root: string, props: Record<string, unknown>): { ok: boolean; out: string; err: string } {
  const skrip = 'const { createElement: h } = await import("react");'
    + 'const { renderToStaticMarkup } = await import("react-dom/server");'
    + 'const m = await import("file://" + process.cwd() + "/src/components/siklus/HasilBersertifikasi.tsx");'
    + "const K = m.default?.default ?? m.default;"
    + "process.stdout.write(renderToStaticMarkup(h(K, JSON.parse(process.env.PROPS))));";
  const anak = spawnSync(process.execPath, ["--import", "tsx", "-e",
    `(async () => {${skrip}})().catch((e) => { process.stderr.write(String(e && e.stack || e)); process.exit(1); });`],
  { cwd: root, encoding: "utf8", env: { ...process.env, PROPS: JSON.stringify(props) } });
  return { ok: anak.status === 0, out: anak.stdout, err: (anak.stderr || "").split("\n").slice(0, 3).join(" ") };
}
const teksHtml = (x: string) => x.replace(/<[^>]+>/g, " ").replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
/** W5's Rizky: a pass with one objective below the mark (CDK8-3 at 0/1), the sitting's counts 5/6. */
function hasilLulus(tambahan: Record<string, unknown> = {}) {
  return {
    outcome: { diagnostik: false, lulus: true, penguasaan: 0.83, ambang: 0.75, gerbang_keselamatan: true, bersertifikasi: true,
      ringkasan: { correct: 5, item_total: 6 }, per_domain: { "CDK8-1": {}, "CDK8-3": {} }, tujuan_ulang: ["CDK8-3"], tujuan_gerbang_kode: [], percobaan_ke: 1 },
    peta: [{ kode: "CDK8-3", pernyataan: "Menjelaskan tanda bahaya", pelajaran: "Pelajaran 3" }],
    pelajaran: [{ lesson_id: "l3", judul: "Pelajaran 3" }], tugas: "t1", locale: "id", dihitungUlang: false, ...tambahan,
  };
}

export const d2rTests: SelfTest[] = [
  {
    id: "D2R-H18",
    requires: ["db"],
    run: async () => {
      const c = new Checks();
      const ditemukan = pembacaJawaban();
      const staf = new Set<string>(PEMBACA_STAF), pel = new Set<string>(PEMBACA_PELAJARAN), batas = new Set<string>(PEMBACA_TERBATAS);
      const asing = [...ditemukan.keys()].filter((k) => !staf.has(k) && !pel.has(k) && !batas.has(k));
      c.expect(asing.length === 0, `a learner-reachable reader of answer-bearing data on no list: ${asing.join(", ")} (classify it, and if a learner reads a sitting through it, it reads the captured policy)`);
      const tanpaTangkap = [...batas].filter((k) => !ditemukan.get(k));
      c.expect(tanpaTangkap.length === 0, `restricted learner readers that do not read the sitting's captured policy: ${tanpaTangkap.join(", ")}`);
      const hilang = [...staf, ...pel, ...batas].filter((k) => !ditemukan.has(k));
      c.expect(hilang.length === 0, `listed but no longer found (renamed, or no longer reaching answer data; take it off the list in the same commit): ${hilang.join(", ")}`);
      const terlewat: string[] = [];
      for (const [k, ddl] of PEMBACA_TANAMAN) if (!pembacaJawaban(ddl).has(k)) terlewat.push(k);
      c.expect(terlewat.length === 0, `planted readers the guard does not name: ${terlewat.join(", ")}`);
      return c.verdict(`${ditemukan.size} learner-reachable readers of answer-bearing data, each classified: ${staf.size} staff, ${pel.size} lesson, `
        + `${batas.size} restricted (each reads the captured policy); each of ${PEMBACA_TANAMAN.length} planted readers (a plpgsql function, a BEGIN ATOMIC one, a view) is named`);
    },
  },
  {
    id: "D2R-H11",
    run: async () => {
      const c = new Checks();
      const { jagaHasil } = await import("../src/lib/assessment-engine/jaga-hasil");
      const lolos = (x: unknown, b: boolean) => { try { jagaHasil(x, b); return true; } catch { return false; } };
      c.expect(lolos({ lulus: true, ringkasan: { correct: 5, item_total: 6 }, tujuan_ulang: ["K1"] }, true), "a counts-only certifying result was refused");
      for (const k of ["benar", "alasan", "arah", "kunci", "is_correct", "rationale"]) {
        c.expect(!lolos({ lulus: true, [k]: "x" }, true), `a certifying result carrying ${k} passed`);
        c.expect(!lolos([{ kode: "K1", [k]: "x" }], true), `a certifying row carrying ${k} passed`);
      }
      // Sharon §7.2: per_domain keeps its sections without a number; a number inside it (penguasaan above all) is refused
      c.expect(lolos({ lulus: false, per_domain: { K1: {}, K2: {} }, tujuan_ulang: ["K1"] }, true), "a certifying per_domain with its sections and no number was refused");
      for (const k of ["penguasaan", "benar", "total"]) {
        c.expect(!lolos({ lulus: true, per_domain: { K1: { [k]: 0.5 } } }, true), `a certifying per_domain carrying ${k} passed`);
      }
      c.expect(lolos([{ posisi: 1, benar: true, alasan: "x" }], false), "a non-certifying review (Pemetaan Awal, Uji Cepat) was refused");
      c.expect(lolos({ alasan: null, arah: null }, true), "a certifying row with the fields present but empty was refused");
      return c.verdict("jagaHasil passes a certifying result of counts, decision, per_domain's bare sections and tujuan_ulang; throws on each of benar, alasan, arah, kunci, is_correct and rationale carrying a value, in an object or a row, and on penguasaan, benar or total inside per_domain; leaves a non-certifying result untouched");
    },
  },
  {
    id: "D2R-H08",
    run: async (ctx) => {
      const c = new Checks();
      const hasil = tanpaKomentar(baca(ctx.repoRoot, "src/app/belajar/[tugas]/hasil/page.tsx"));
      const lib = tanpaKomentar(baca(ctx.repoRoot, "src/lib/hasil-belajar.ts"));
      const kom = tanpaKomentar(baca(ctx.repoRoot, "src/components/siklus/HasilBersertifikasi.tsx"));
      // the chapter page: a certifying result is drawn by HasilBersertifikasi, and the review is asked only otherwise
      c.expect(/outcome\.bersertifikasi/.test(hasil) && /<HasilBersertifikasi\b/.test(hasil), "the chapter result page does not branch on the certifying result to HasilBersertifikasi");
      c.expect(/bersertifikasi\s*\?\s*Promise\.resolve\([^)]*\)\s*:\s*engine\.review\(/.test(hasil.replace(/\s+/g, " ")), "the chapter result page asks for the review of a certifying result");
      // Daisy's §3 order has no mastery figure: the Pemetaan Awal → Uji Penguasaan comparison is not drawn on a certifying result
      c.expect(/!bersertifikasi\s*\?\s*\(?\s*<section[^>]*>\s*<h2>\{s\(`hasil\.delta\./.test(hasil.replace(/\s+/g, " ")),
        "the chapter result page draws the mastery comparison (hasil.delta) on a certifying result");
      // the component draws Daisy's order and none of the review's words
      const urutan = ["hasil.lulus", "hasil.baca_lagi", "hasil.ulang_boleh", "hasil.dijawab_tepat", "hasil.tidak_ditampilkan"].map((k) => kom.indexOf(`"${k}`));
      c.expect(urutan.every((i) => i >= 0) && urutan.every((i, n) => n === 0 || i > urutan[n - 1]), `HasilBersertifikasi does not draw Daisy's order (decision, revisit, retake, counts, not shown): ${urutan.join(",")}`);
      for (const k of ["hasil.review", "hasil.answer_right", "hasil.answer_notyet", "hasil.target.ulang", "hasil.target.tercapai", "PerTujuan", ".alasan", ".arah", "penguasaan)"]) {
        c.expect(!kom.includes(k), `HasilBersertifikasi draws «${k}»`);
      }
      c.expect(/hasil\.baca_lagi_arti/.test(kom), "the revisit list carries no no-blame note (74b)");
      c.expect(!/tidak[ _]lulus/i.test(kom), "«tidak lulus» is drawn");
      // the summary and its print: the review is not asked for a certifying result, its words follow
      c.expect(/bersertifikasi\s*\?\s*Promise\.resolve\([^)]*\)\s*:\s*engine\.review\(/.test(lib.replace(/\s+/g, " ")), "Hasil Belajar asks for the review of a certifying result");
      const kmp = tanpaKomentar(baca(ctx.repoRoot, "src/components/laporan/KomposisiMurid.tsx"));
      c.expect(/b\.bersertifikasi/.test(kmp) && /"hasil\.lulus"|hasil\.belum_lulus/.test(kmp), "Hasil Belajar's row does not say «Lulus» / «Belum lulus» for a certifying result");
      return c.verdict("the chapter result page draws a certifying result through HasilBersertifikasi and never asks for its review; the component draws Daisy's order and none of the review's words, marks or per-objective figures; Hasil Belajar and its print ask no review for it and say Lulus / Belum lulus");
    },
  },
  {
    id: "D2R-H15",
    run: async (ctx) => {
      const c = new Checks();
      const ekspor = semuaBerkas(join(ctx.repoRoot, "src", "app")).filter((f) => /content-disposition/i.test(baca(join(ctx.repoRoot, "src", "app"), f)));
      const murid = ekspor.filter((f) => /^(belajar|laporan|sertifikat|verifikasi|api\/(belajar|verifikasi|laporan))\//.test(f));
      c.expect(murid.length === 0, `a learner route offers an export: ${murid.join(", ")} (it passes jagaHasil, or it is staff-only)`);
      return c.verdict(`no learner route under src/app sets Content-Disposition (${ekspor.length} export route(s) in all, none a learner's); the learner's print is the page itself`);
    },
  },
  {
    id: "D2R-C02",
    run: async (ctx) => {
      const c = new Checks();
      for (const f of ["src/components/sertifikat/KartuSertifikat.tsx", "src/app/verifikasi/[token]/page.tsx", "src/app/belajar/[tugas]/sertifikat/page.tsx"]) {
        const s = tanpaKomentar(baca(ctx.repoRoot, f));
        c.expect(!RENDER_PREDIKAT.test(s), `${f} still renders the band`);
      }
      return c.verdict("the card and its printable record, the learner's certificate page (its A4 sheet) and /verifikasi render no band");
    },
  },
  {
    id: "D2R-C03",
    run: async (ctx) => {
      const c = new Checks();
      const situs = situsPredikat(ctx.repoRoot);
      c.expect(situs.length === 0, `a band render site outside the internal reports: ${situs.join(", ")}`);
      const tanam = situsPredikat(ctx.repoRoot, { "src/components/z-tanam.tsx": "export default function Z({ c }) { return <dd>{c.predikat}</dd>; }" });
      c.expect(tanam.includes("src/components/z-tanam.tsx"), "a planted band render site was not named");
      return c.verdict(`no .tsx under src/app or src/components renders a band (${PREDIKAT_LAPORAN_INTERNAL.length} internal report(s) listed); a planted render site is named`);
    },
  },
  {
    id: "D2R-W01",
    run: async () => {
      const c = new Checks();
      for (const [k, id, en] of KATA_D2R) {
        const vi = t(k, k.startsWith("sertifikat.kelola") ? "staff" : "learner", { locale: "id" });
        const ve = t(k, k.startsWith("sertifikat.kelola") ? "staff" : "learner", { locale: "en" });
        c.expect(vi === id, `${k} (ID) reads «${vi}», expected «${id}»`);
        c.expect(ve === en, `${k} (EN) reads «${ve}», expected «${en}»`);
      }
      return c.verdict(`${KATA_D2R.length} strings of record read word for word in ID and EN`);
    },
  },
  {
    id: "D2R-G01",
    run: async (ctx) => {
      const c = new Checks();
      const { penguasaanTerbuka } = await import("../src/lib/siklus");
      const st = (pre: string | null, post: string | null) => ({ pre_status: pre, post_status: post, post_session: post ? "s" : null, post_assignment: "aa" }) as never;
      const pel = (r: number, n: number) => Array.from({ length: n }, (_, i) => ({ furthest_position: i < r ? 3 : 0, total_positions: 3 })) as never;
      c.expect(penguasaanTerbuka(st("FINALIZED", null), pel(0, 3)), "after Pemetaan Awal, with no lesson read, Uji Penguasaan is not offered");
      c.expect(penguasaanTerbuka(st("FINALIZED", null), pel(2, 3)), "after Pemetaan Awal, with a lesson unread, Uji Penguasaan is not offered");
      c.expect(!penguasaanTerbuka(st(null, null), pel(0, 3)), "before Pemetaan Awal, Uji Penguasaan is offered");
      c.expect(!penguasaanTerbuka(st("FINALIZED", null), pel(3, 3)), "with every lesson read, the advisory form is used (the existing «Siap untuk Uji Penguasaan» stands)");
      const hal = tanpaKomentar(baca(ctx.repoRoot, "src/app/belajar/[tugas]/page.tsx"));
      c.expect(/penguasaanTerbuka\(/.test(hal) && /siklus\.siap\.saran/.test(hal), "the chapter page does not offer Uji Penguasaan with the advisory line");
      const i = hal.indexOf("aksi.href"), j = hal.indexOf("siklus.siap.saran");
      c.expect(i >= 0 && j > i, "the advisory offer comes before «Lanjut membaca»; reading stays the first action");
      return c.verdict("after Pemetaan Awal with lessons unread the chapter offers Uji Penguasaan, after «Lanjut membaca», with «siklus.siap.saran»; before it, or with every lesson read, the existing steps stand");
    },
  },
  {
    id: "D2R-D05",
    run: async (ctx) => {
      const c = new Checks();
      const muka = tanpaKomentar(baca(ctx.repoRoot, "src/app/belajar/_components/PermukaanAsesmen.tsx"));
      c.expect(/assistanceWindow=\{session\?\.hesitation_window_seconds \?\? null\}/.test(muka), "the player takes its help window from somewhere other than session_state");
      const ori = tanpaKomentar(baca(ctx.repoRoot, "src/components/siklus/OrientasiAsesmen.tsx"));
      c.expect(/orientasi\.hesitation_window_seconds != null/.test(ori), "the orientation promises help without the database's window");
      c.expect(/orientasi\.mode === "POST_TEST"[^\n]*posttest\.tanpa_bantuan"/.test(ori), "the orientation does not say that an Uji Penguasaan offers no help");
      // Daisy via Bob 02:06Z: a certifying Asesmen Mandiri has its own line, drawn from the database's bersertifikasi
      c.expect(/orientasi\.mode === "STANDALONE" && orientasi\.bersertifikasi === true[^\n]*posttest\.tanpa_bantuan_umum"/.test(ori),
        "the orientation does not draw posttest.tanpa_bantuan_umum on a STANDALONE that the database says certifies");
      c.expect(!/posttest\.tanpa_bantuan_umum"[^\n]*POST_TEST|POST_TEST[^\n]*posttest\.tanpa_bantuan_umum"/.test(ori), "the Uji Penguasaan must keep posttest.tanpa_bantuan");
      return c.verdict("the player schedules help only from session_state's window, which the database withholds on a certifying sitting (D2R-D03/D04); the orientation promises help only with the window, says posttest.tanpa_bantuan on an Uji Penguasaan, and posttest.tanpa_bantuan_umum on an Asesmen Mandiri the orientation says certifies");
    },
  },
  {
    id: "D2R-H21",
    run: async (ctx) => {
      const c = new Checks();
      const { t } = await import("../src/lib/hle");
      const id = (k: string) => t(k as never, "learner", { locale: "id" });
      // ruling 74a item 2 (the owner, via Bob 04:02Z): the sections still to learn are advice on EVERY certifying result
      const r = renderHasil(ctx.repoRoot, hasilLulus({ sertifikat: "DISIAPKAN" }));
      if (!c.expect(r.ok, `HasilBersertifikasi could not be rendered: ${r.err}`)) return c.verdict("");
      const tx = teksHtml(r.out);
      c.expect(tx.includes(id("hasil.lulus")), "the pass is not said");
      c.expect(/data-baca-lagi=""/.test(r.out) && tx.includes(id("hasil.baca_lagi")) && tx.includes("Menjelaskan tanda bahaya") && tx.includes(id("hasil.baca_lagi_arti")),
        `a pass with an objective below the mark does not advise reading it again: «${tx.slice(0, 400)}»`);
      c.expect(!/\d+\s?%/.test(tx), `a certifying pass shows a percentage: «${tx}»`);
      c.expect(!/data-ulang-boleh/.test(r.out), "a pass shows the retake line");
      const bersih = renderHasil(ctx.repoRoot, hasilLulus({ sertifikat: "DISIAPKAN", outcome: { ...hasilLulus().outcome, tujuan_ulang: [] } }));
      c.expect(bersih.ok && !/data-baca-lagi/.test(bersih.out), "a pass with nothing to read again draws «Baca lagi:»");
      return c.verdict("rendered: a certifying «Lulus.» with an objective below the mark (CDK8-3) advises «Baca lagi:» it, with the advice-not-judgement line, no percentage and no retake line; with nothing to read again it draws none");
    },
  },
  {
    id: "D2R-C05",
    run: async (ctx) => {
      const c = new Checks();
      const { t } = await import("../src/lib/hle");
      const id = (k: string) => t(k as never, "learner", { locale: "id" });
      // ruling 74a item 4, Daisy's §9, Sharon's delta note (ruling 90's principle): «Sertifikat Anda sedang disiapkan.» only
      // when a certificate is really being prepared (my_certificate returns a row in ELIGIBLE). Issued, no row (a pass that
      // will never be certified, INV-20) or a failed read: the link alone. Never sertifikat.disiapkan.arti.
      const kontrak = await import("../src/lib/sertifikat-kontrak") as { sedangDisiapkan?: (r: { status: string } | null | undefined) => boolean };
      const f = kontrak.sedangDisiapkan;
      if (c.expect(typeof f === "function", "src/lib/sertifikat-kontrak.ts has no sedangDisiapkan")) {
        c.expect(f!({ status: "ELIGIBLE" }) === true, "a certificate being prepared (ELIGIBLE) is not said to be prepared");
        for (const st of ["ISSUED", "REVOKED", "SUPERSEDED"]) c.expect(f!({ status: st }) === false, `a ${st} certificate is said to be prepared`);
        c.expect(f!(null) === false && f!(undefined) === false, "a pass with no certificate row (never certified, or a failed read) is said to be prepared");
      }
      const siap = renderHasil(ctx.repoRoot, hasilLulus({ sertifikatDisiapkan: true }));
      const tanpa = renderHasil(ctx.repoRoot, hasilLulus({ sertifikatDisiapkan: false }));
      const belum = renderHasil(ctx.repoRoot, hasilLulus({ sertifikatDisiapkan: true, outcome: { ...hasilLulus().outcome, lulus: false } }));
      if (!c.expect(siap.ok && tanpa.ok && belum.ok, `HasilBersertifikasi could not be rendered: ${siap.err || tanpa.err || belum.err}`)) return c.verdict("");
      const baris = (h: string) => {
        const akhir = h.indexOf("</div>", h.indexOf('data-keputusan="lulus"'));
        const i = h.indexOf('<p data-sertifikat=""');
        return { tepat: akhir >= 0 && i === akhir + "</div>".length, isi: i >= 0 ? h.slice(i, h.indexOf("</p>", i) + 4) : "" };
      };
      const lihat = id("siklus.lihat_sertifikat");
      const S = baris(siap.out), T = baris(tanpa.out);
      c.expect(S.tepat && T.tepat, "the certificate is not directly after the «Lulus» banner");
      c.expect(/href="\/belajar\/t1\/sertifikat"/.test(T.isi) && teksHtml(T.isi) === lihat, `issued, none or unread: not exactly the link «${lihat}»: «${teksHtml(T.isi)}»`);
      const harapSiap = `${id("sertifikat.disiapkan.judul")}. ${lihat}`;
      c.expect(/href="\/belajar\/t1\/sertifikat"/.test(S.isi) && teksHtml(S.isi) === harapSiap, `being prepared: not «${harapSiap}», as one line: «${teksHtml(S.isi)}»`);
      c.expect(!teksHtml(siap.out).includes(id("sertifikat.disiapkan.arti")) && !teksHtml(tanpa.out).includes(id("sertifikat.disiapkan.arti")), "the result draws sertifikat.disiapkan.arti");
      c.expect(siap.out.indexOf("data-sertifikat") < siap.out.indexOf("data-baca-lagi") && !/data-ulang-boleh/.test(siap.out), "on a pass the certificate is not before «Baca lagi:», or a retake line is drawn");
      c.expect(!/\/sertifikat"/.test(belum.out), "a «Belum lulus.» result links to a certificate");
      const hasil = tanpaKomentar(baca(ctx.repoRoot, "src/app/belajar/[tugas]/hasil/page.tsx")).replace(/\s+/g, " ");
      c.expect(/engine\.myCertificate\([^)]*\)\.catch\(\(\) => null\)/.test(hasil) && /sedangDisiapkan\(/.test(hasil) && /<HasilBersertifikasi\b[^>]*\bsertifikatDisiapkan=\{/.test(hasil),
        "the chapter result page does not decide «sedang disiapkan» by sedangDisiapkan over myCertificate (a failed read as none)");
      return c.verdict("sedangDisiapkan: ELIGIBLE only; ISSUED, REVOKED, SUPERSEDED, no row and a failed read are not; rendered: directly after a certifying «Lulus» banner, a certificate being prepared reads «Sertifikat Anda sedang disiapkan.» and the link as one line, otherwise the link alone; never .arti; before «Baca lagi:», no retake line; «Belum lulus.» links to none; the page decides by sedangDisiapkan over myCertificate");
    },
  },
  {
    id: "D2R-C06",
    run: async (ctx) => {
      const c = new Checks();
      const { t } = await import("../src/lib/hle");
      const id = (k: string) => t(k as never, "learner", { locale: "id" });
      // Daisy's C-1 on the Hasil Belajar row: after a certifying «Lulus», the same link
      const bab = [
        { tugas: "t1", judul: "IPA · Bab 2", keadaan: "SELESAI", awal: null, akhir: null, ambang: 0.75, tercapai: "TERCAPAI", benar: 5, total: 6, bagian: [], ulang: [], bersertifikasi: true },
        { tugas: "t2", judul: "IPA · Bab 3", keadaan: "SELESAI", awal: null, akhir: null, ambang: 0.75, tercapai: "BELUM", benar: 2, total: 6, bagian: [], ulang: [], bersertifikasi: true },
        { tugas: "t3", judul: "IPA · Bab 4", keadaan: "SELESAI", awal: null, akhir: 0.9, ambang: 0.75, tercapai: "TERCAPAI", benar: 9, total: 10, bagian: [], ulang: [] },
      ];
      const skrip = 'const { createElement: h } = await import("react");'
        + 'const { renderToStaticMarkup } = await import("react-dom/server");'
        + 'const m = await import("file://" + process.cwd() + "/src/components/laporan/KomposisiMurid.tsx");'
        + "const K = m.default?.default ?? m.default;"
        + "process.stdout.write(renderToStaticMarkup(h(K, { bab: JSON.parse(process.env.PROPS), locale: 'id' })));";
      const anak = spawnSync(process.execPath, ["--import", "tsx", "-e",
        `(async () => {${skrip}})().catch((e) => { process.stderr.write(String(e && e.stack || e)); process.exit(1); });`],
      { cwd: ctx.repoRoot, encoding: "utf8", env: { ...process.env, PROPS: JSON.stringify(bab) } });
      if (!c.expect(anak.status === 0, `KomposisiMurid could not be rendered: ${(anak.stderr || "").slice(0, 300)}`)) return c.verdict("");
      const out = anak.stdout;
      const tautan = /<a[^>]*href="\/belajar\/t1\/sertifikat"[^>]*>([^<]*)<\/a>/.exec(out);
      c.expect(tautan !== null && tautan[1] === id("siklus.lihat_sertifikat"), "a certifying «Lulus» row does not link to its certificate with «siklus.lihat_sertifikat»");
      const iL = out.indexOf(`>${id("hasil.lulus")}</small>`);
      c.expect(iL >= 0 && tautan !== null && out.indexOf(tautan[0]) > iL && out.indexOf(tautan[0]) < out.indexOf("</li>", iL), "the row's certificate link is not after its «Lulus»");
      c.expect(!/href="\/belajar\/t2\/sertifikat"/.test(out), "a «Belum lulus» row links to a certificate");
      c.expect(!/href="\/belajar\/t3\/sertifikat"/.test(out), "a non-certifying row gains the certificate link (Daisy's C-1 is the certifying result's)");
      return c.verdict("rendered: on Hasil Belajar a certifying «Lulus» row links to /belajar/{tugas}/sertifikat with «siklus.lihat_sertifikat» after its verdict; a «Belum lulus» row and a non-certifying row do not");
    },
  },
  {
    id: "D2R-L01",
    run: async (ctx) => {
      const c = new Checks();
      const { t } = await import("../src/lib/hle");
      // ruling 90, Daisy's D2R-KATA §10 (ccd42fa6): the support screen's next step says only what the product does today
      const KATA: Array<[string, string, string]> = [
        ["lapor.langkah.awal", "Laporan ini sudah tersimpan. Admin sekolah Anda dan tim PINTAR dapat membacanya.",
          "This report is saved. Your school admin and the PINTAR team can read it."],
        ["lapor.langkah.awal_kelas", "Laporan ini ditandai menghentikan kelas. Admin sekolah Anda dan tim PINTAR melihat tanda itu, dan laporan ini tampil lebih dulu di antara laporan yang belum ditangani.",
          "This report is marked as stopping a class. Your school admin and the PINTAR team see that mark, and it is listed first among reports not yet handled."],
      ];
      const PERIODE = /\b(hari|jam|menit|minggu|day|days|hour|hours|minute|minutes|week)\b/i;
      for (const [k, idT, en] of KATA) {
        const a = t(k as never, "staff", { locale: "id" }), b = t(k as never, "staff", { locale: "en" });
        c.expect(a === idT, `${k} (ID) reads «${a}», expected «${idT}»`);
        c.expect(b === en, `${k} (EN) reads «${b}», expected «${en}»`);
        c.expect(!PERIODE.test(a) && !PERIODE.test(b), `${k} names a time period (ruling 90): «${a}» / «${b}»`);
      }
      c.expect(PERIODE.test("dalam satu hari sekolah") && PERIODE.test("within one hour"), "the time-period guard does not catch a planted period");
      // «tampil lebih dulu di antara laporan yang belum ditangani» is true because a new report is DITERIMA, the enum's
      // first value, and the triage list orders by status, then stops_class first (lapor-masalah.ts)
      const mig = baca(ctx.repoRoot, "supabase/migrations/20261119100000_a_staff_member_reports_a_problem.sql");
      c.expect(/create type public\.support_report_status as enum \('DITERIMA', 'DITANGANI', 'SELESAI'\)/.test(mig) && /status\s+public\.support_report_status not null default 'DITERIMA'/.test(mig),
        "a new report is not DITERIMA, the status enum's first value");
      const lib = tanpaKomentar(baca(ctx.repoRoot, "src/lib/lapor-masalah.ts")).replace(/\s+/g, " ");
      c.expect(/\.neq\("status", "SELESAI"\) \.order\("status"\)\.order\("stops_class", \{ ascending: false \}\)/.test(lib),
        "the triage list does not order the reports not yet handled by status, then stops_class first");
      return c.verdict("Daisy's §10 lines read word for word in ID and EN and name no time period (a planted period is caught); a new report is DITERIMA, the enum's first value, and the triage list orders open reports by status then stops_class first, so among reports not yet handled a class-stopping one is listed first");
    },
  },
  {
    id: "D2R-C07",
    run: async (ctx) => {
      const c = new Checks();
      const { t } = await import("../src/lib/hle");
      const id = (k: string) => t(k as never, "learner", { locale: "id" });
      // Daisy's §11 (deacb184): on every certifying row, Lulus or Belum lulus, the sections to read again in «baca lagi»'s
      // words, in the lead and marked in section B; non-certifying rows keep «pelajari lagi»
      const render = (bab: unknown[]) => {
        const skrip = 'const { createElement: h } = await import("react");'
          + 'const { renderToStaticMarkup } = await import("react-dom/server");'
          + 'const m = await import("file://" + process.cwd() + "/src/components/laporan/KomposisiMurid.tsx");'
          + "const K = m.default?.default ?? m.default;"
          + "process.stdout.write(renderToStaticMarkup(h(K, { bab: JSON.parse(process.env.PROPS), locale: 'id' })));";
        const anak = spawnSync(process.execPath, ["--import", "tsx", "-e",
          `(async () => {${skrip}})().catch((e) => { process.stderr.write(String(e && e.stack || e)); process.exit(1); });`],
        { cwd: ctx.repoRoot, encoding: "utf8", env: { ...process.env, PROPS: JSON.stringify(bab) } });
        return { ok: anak.status === 0, out: anak.stdout, err: (anak.stderr || "").slice(0, 300) };
      };
      const lulus = { tugas: "t1", judul: "IPA · Bab 2", keadaan: "SELESAI", awal: null, akhir: null, ambang: 0.75, tercapai: "TERCAPAI", benar: 5, total: 6, bagian: [], ulang: ["Tanda bahaya"], bersertifikasi: true };
      const belum = { tugas: "t2", judul: "IPA · Bab 3", keadaan: "SELESAI", awal: null, akhir: null, ambang: 0.75, tercapai: "BELUM", benar: 2, total: 6, bagian: [], ulang: ["Rantai makanan"], bersertifikasi: true };
      const biasa = { tugas: "t3", judul: "IPA · Bab 4", keadaan: "SELESAI", awal: null, akhir: 0.5, ambang: 0.75, tercapai: "BELUM", benar: 5, total: 10,
        bagian: [{ kode: "M", nama: "Massa jenis", benar: 1, total: 4, ulang: true }], ulang: ["Massa jenis"] };
      const r = render([lulus, belum, biasa]);
      if (!c.expect(r.ok, `KomposisiMurid could not be rendered: ${r.err}`)) return c.verdict("");
      const tx = teksHtml(r.out);
      const bacaLagi = id("hasilbelajar.baca_lagi").replace("{daftar}", "Tanda bahaya (IPA · Bab 2); Rantai makanan (IPA · Bab 3)");
      c.expect(tx.includes(bacaLagi), `the lead does not advise reading again the certifying rows' sections, pass and not passed alike: «${tx.slice(0, 500)}»`);
      c.expect(tx.includes(id("hasilbelajar.ulang").replace("{daftar}", "Massa jenis (IPA · Bab 4)")) && !/Tanda bahaya[^.]*\(IPA · Bab 2\)[^.]*Pelajari lagi|Pelajari lagi: [^.]*Tanda bahaya/.test(tx),
        "a non-certifying row does not keep «Pelajari lagi», or a certifying section is listed under it");
      // section B: a certifying chapter's sections by name, marked «baca lagi», with no figure
      const iB = r.out.indexOf('data-lk="bagian"');
      const B = iB >= 0 ? r.out.slice(iB, r.out.indexOf("</section>", iB)) : "";
      const kel = (judul: string) => { const i = B.indexOf(`<h3>${judul}</h3>`); return i >= 0 ? B.slice(i, B.indexOf("</div>", i)) : ""; };
      const kL = kel("IPA · Bab 2"), kB = kel("IPA · Bab 3"), kN = kel("IPA · Bab 4");
      const tanda = `>${id("hasilbelajar.baca_lagi_tanda")}</small>`;
      c.expect(kL.includes("Tanda bahaya") && kL.includes(tanda) && kB.includes("Rantai makanan") && kB.includes(tanda),
        "section B does not list a certifying row's sections marked «baca lagi» (pass and not passed)");
      c.expect(!/\d+ dari \d+|pin-lk-kotak|%/.test(kL + kB), "section B gives a certifying section a figure");
      c.expect(kN.includes(`>${id("hasilbelajar.pelajari_lagi")}</small>`) && !kN.includes(tanda), "a non-certifying row's section B does not keep «pelajari lagi»");
      // many: each kind counted on its own and pointed to section B in its own words
      const banyak = render([{ ...lulus, ulang: ["A1", "A2"] }, { ...belum, ulang: ["B1"] }, biasa]);
      const tb = teksHtml(banyak.out);
      c.expect(banyak.ok && tb.includes(id("hasilbelajar.baca_lagi_banyak").replace("{n}", "3")) && !tb.includes(id("hasilbelajar.ulang_banyak").replace("{n}", "4")),
        "more than two certifying sections are not counted in «baca lagi»'s own words, apart from «pelajari lagi»");
      // the library lists a certifying pass's sections too (ruling 74a item 2), from its own list
      const lib = tanpaKomentar(baca(ctx.repoRoot, "src/lib/hasil-belajar.ts")).replace(/\s+/g, " ");
      c.expect(/const ulang = bersertifikasi \? bagianUlang\(null, null, peta, pelajaran, outcome\.tujuan_gerbang_kode \?\? \[\], outcome\.tujuan_ulang \?\? \[\]\)/.test(lib),
        "Hasil Belajar does not list a certifying result's sections whatever its decision");
      return c.verdict("rendered: on Hasil Belajar every certifying row, Lulus or Belum lulus, gives its sections in «Disarankan dibaca lagi:» and marks them «baca lagi» by name in section B with no figure; more than two are counted in «baca lagi»'s own words; non-certifying rows keep «Pelajari lagi»; the library lists a certifying pass's sections from its own list");
    },
  },
  {
    id: "D2R-F02",
    run: async (ctx) => {
      const c = new Checks();
      const kom = tanpaKomentar(baca(ctx.repoRoot, "src/components/siklus/HasilBersertifikasi.tsx"));
      c.expect(/percobaan_ke/.test(kom) && /hasil\.percobaan_ke/.test(kom), "the certifying result does not show the attempt ordinal");
      return c.verdict("the certifying result shows the attempt ordinal from session_outcome's percobaan_ke");
    },
  },
];
