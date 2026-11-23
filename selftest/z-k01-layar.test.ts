/**
 * Z · K-01, the screens (ruling 78, one verdict; Sharon's Q1-Q3 and C2; Daisy's words via Bob; ruling 81): A LEARNER
 * WHO MISSED A MUST-BE-RIGHT QUESTION IS «BELUM MENCAPAI TARGET» ON EVERY SCREEN, AND A GATE THAT CANNOT BE READ IS
 * NEVER «REACHED».
 *
 *   Z-K01-02  The screens' rules and words, without a database.
 *             (a) The learner's result: alasanBelum says GERBANG for a gate-only failure and DI_BAWAH below the mark;
 *                 bagianUlang lists the missed question's objectives (tujuan_gerbang_kode) beside those below the mark,
 *                 so «Pelajari lagi» is never empty for a gate-only failure with an objective; with none (C2) it is
 *                 empty and the page draws no list; the page says hasil.target.belum_gerbang, else belum_arti.
 *             (b) The teacher's one learner: vonisHasil gives DI_BAWAH, GERBANG, TAK_DIKETAHUI, TERCAPAI and null; the
 *                 page says mengajar.murid1.gerbang / gerbang_tak_diketahui (+ its line under the table once) and
 *                 offers «Minta membaca lagi» for every verdict that is not reached.
 *             (c) «Minta membaca lagi»: urutUlang lists the gate learner with those below the mark (pre-ticked), the
 *                 gate-unknown learner after them and before the rest (not pre-ticked), with their words.
 *             (d) The retake queue: kunciHasilAntrean gives hasil_gerbang / hasil_tak_diketahui / hasil / hasil_saja.
 *             (e) V2 and D14 on the summary (KomposisiMurid rendered) and on the teacher's page; N-14's new words.
 *             (f) Every new key's ID and EN words are Daisy's, exactly.
 *             (g) Recovery walks: each failure state (gate unread on the teacher's page, the request page and the
 *                 queue; a learner's objectives unread in the class report, N-15) gives the right verdict once the
 *                 read succeeds, and never «reached» before it.
 *             Red on ce14a3e8 (none of the above existed).
 *   Z-K01-03  The integrated check (ruling 81), on the seeded world, each case rolled back, through the database's
 *             own reads (session_outcome and reading_map as the learner, learner.result as the teacher,
 *             percobaan_antrean as the head of department), fed into the same rules the screens call:
 *             learner (i) whose percentage meets the mark but who missed a must-be-right question is «belum» with the
 *             gate as the reason on the learner's page (with the objective in «Pelajari lagi»), the teacher's page,
 *             «Minta membaca lagi» (pre-ticked) and the queue; learner (ii) whose verdict an approved two-person key
 *             correction changed reads the corrected verdict on all four, in both directions.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { Checks, type SelfTest } from "./lib";
import { lit, psql } from "./bob26.test";

const SISWA = "peraga-siswa@evaluasi.pintar.test";
const GURU = "peraga-guru@evaluasi.pintar.test";
const KAPRODI = "peraga-kaprodi@evaluasi.pintar.test";
const ADMIN = "peraga-admin@evaluasi.pintar.test";

export const KATA_Z3A: Array<[string, string, string]> = [
  ["hasil.target.belum_gerbang",
    "Persentase penguasaan bab ini sudah memenuhi target, tetapi ada soal penting yang belum dijawab dengan tepat. Karena itu target bab ini belum tercapai. Tanyakan kepada guru Anda langkah berikutnya.",
    "Your mastery percentage for this chapter meets the target, but an important question was not answered correctly. So this chapter's target is not reached yet. Ask your teacher about the next step."],
  ["mengajar.murid1.gerbang", "belum mencapai target: soal penting belum tepat · target {p}", "target not reached: an important question is not right yet · target {p}"],
  ["mengajar.murid1.gerbang_tak_diketahui", "belum dapat disimpulkan apakah target tercapai · target {p}", "whether the target is reached cannot be concluded yet · target {p}"],
  ["mengajar.murid1.gerbang_tak_diketahui_arti", "Data soal penting untuk hasil ini tidak dapat dibaca sekarang. Muat ulang halaman ini nanti.",
    "The important-question data for this result cannot be read right now. Reload this page later."],
  ["mengajar.ulang.gerbang", "Persentase sudah memenuhi target, tetapi ada soal penting yang belum tepat.", "The percentage meets the target, but an important question is not right yet."],
  ["mengajar.ulang.tak_diketahui", "Belum dapat disimpulkan apakah target tercapai.", "Whether the target is reached cannot be concluded yet."],
  ["kesempatan.baris.hasil_gerbang", "hasil terakhir {hasil}, target {target} belum tercapai: soal penting belum tepat",
    "last result {hasil}, target {target} not reached: an important question is not right yet"],
  ["kesempatan.baris.hasil_tak_diketahui", "hasil terakhir {hasil}, target {target}: belum dapat disimpulkan apakah tercapai",
    "last result {hasil}, target {target}: whether it is reached cannot be concluded yet"],
  ["hasil.ulang_berjalan", "Uji Penguasaan ulang sedang berlangsung. Hasil yang tampil adalah hasil uji sebelumnya.",
    "A Mastery Check retake is in progress. The result shown is from the earlier check."],
  // Sharon's C2 nit (Daisy accepted, via Bob 13:22Z): the teacher's objectives when the gate failed on a question with no objective
  ["mengajar.murid1.gerbang_tanpa_tujuan",
    "Soal penting yang belum tepat tidak terhubung ke tujuan pembelajaran mana pun, jadi tidak ada tujuan yang dapat ditunjukkan di sini. Lihat soalnya bersama murid.",
    "The important question that is not right yet is not linked to any learning objective, so no objective can be shown here. Go over the question with the student."],
  // Daisy's Z3-A verdict C-1 (29a4e841): the summary's gate case says why
  ["hasilbelajar.gerbang", "Ada soal penting yang belum tepat, jadi target bab ini belum tercapai.",
    "An important question is not right yet, so this chapter's target is not reached."],
  // N-14 (Bob: replaced in K-01's screens commit)
  ["mengajar.murid1.tujuan_arti",
    "Dari Uji Penguasaan terakhir murid ini di kelas ini: tujuan yang belum tercapai, termasuk tujuan dari soal penting yang belum tepat. Ini yang perlu dipelajari lagi, bukan penilaian atas muridnya.",
    "From this student's latest Mastery Check in this class: the objectives not yet reached, including those of an important question not yet right. This is what to study again, not a judgement of the student."],
];

function render(root: string, skrip: string, env: Record<string, string> = {}) {
  const anak = spawnSync(process.execPath, ["--import", "tsx", "-e",
    `(async () => {${skrip}})().catch((e) => { process.stderr.write(String(e && e.stack || e)); process.exit(1); });`],
  { cwd: root, encoding: "utf8", env: { ...process.env, ...env } });
  return { ok: anak.status === 0, out: anak.stdout, err: (anak.stderr || "").split("\n").slice(0, 3).join(" ") };
}
const buang = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/[^\n]*/g, "$1");

export const zK01LayarTests: SelfTest[] = [
  {
    id: "Z-K01-02",
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const siklus = await import("../src/lib/siklus");
      const ajar = await import("../src/lib/pengajar").catch((e: Error) => ({ galat: e.message }) as never);
      const kontrak = await import("../src/lib/pengerjaan-kontrak");
      const { t } = await import("../src/lib/hle");
      const baca = (...p: string[]) => buang(readFileSync(join(repoRoot, ...p), "utf8"));
      const alasanBelum = (siklus as { alasanBelum?: (o: unknown) => string | null }).alasanBelum;
      const vonisHasil = (ajar as { vonisHasil?: (h: unknown) => string | null }).vonisHasil;
      const urutUlang = (ajar as { urutUlang?: (...a: unknown[]) => Array<{ id: string; status: string }> }).urutUlang;
      const kunciHasilAntrean = (kontrak as { kunciHasilAntrean?: (r: unknown) => string | null }).kunciHasilAntrean;

      // (a) the learner's result
      c.expect(typeof alasanBelum === "function", "siklus.alasanBelum (why a result is «belum») does not exist");
      if (alasanBelum) {
        const dasar = { diagnostik: false, ambang: 0.6 };
        c.expect(alasanBelum({ ...dasar, lulus: false, gerbang_keselamatan: false, penguasaan: 0.9 }) === "GERBANG", "a gate-only failure is not GERBANG");
        c.expect(alasanBelum({ ...dasar, lulus: false, gerbang_keselamatan: false, penguasaan: 0.5 }) === "DI_BAWAH", "below the mark with the gate missed is not DI_BAWAH");
        c.expect(alasanBelum({ ...dasar, lulus: false, gerbang_keselamatan: true, penguasaan: 0.5 }) === "DI_BAWAH", "below the mark is not DI_BAWAH");
        c.expect(alasanBelum({ ...dasar, lulus: true, gerbang_keselamatan: true, penguasaan: 0.9 }) === null, "a result that reached the target has a reason for «belum»");
        c.expect(alasanBelum({ diagnostik: true, lulus: null, gerbang_keselamatan: null, penguasaan: 0.2, ambang: null }) === null, "a pre-test has a reason for «belum»");
      }
      const peta = [{ kode: "P1", pernyataan: "Membaca pecahan", pelajaran: "Pecahan" }, { kode: "P2", pernyataan: "Membandingkan", pelajaran: "Banding" }];
      const pel = [{ lesson_id: "l1", judul: "Pecahan" }, { lesson_id: "l2", judul: "Banding" }];
      const perDomain = { P1: { penguasaan: 1 }, P2: { penguasaan: 0.75 } };
      const ul = (siklus.bagianUlang as (...a: unknown[]) => Array<{ kode: string; gerbang?: boolean; penguasaan: number | null; lessonId: string | null }>)(perDomain, 0.6, peta, pel, ["P1"]);
      c.expect(ul.length === 1 && ul[0].kode === "P1" && ul[0].gerbang === true && ul[0].penguasaan === null && ul[0].lessonId === "l1",
        `«Pelajari lagi» for a gate-only failure: ${JSON.stringify(ul)} (expected the missed question's objective P1, with its lesson, as the gate's)`);
      const ulC2 = (siklus.bagianUlang as (...a: unknown[]) => unknown[])(perDomain, 0.6, peta, pel, []);
      c.expect(Array.isArray(ulC2) && ulC2.length === 0, `C2 (the missed question has no objective): ${JSON.stringify(ulC2)} (expected an empty list)`);
      const ulDua = (siklus.bagianUlang as (...a: unknown[]) => Array<{ kode: string; gerbang?: boolean }>)({ P1: { penguasaan: 0.4 }, P2: { penguasaan: 0.9 } }, 0.6, peta, pel, ["P1", "P2"]);
      c.expect(ulDua.map((u) => `${u.kode}:${u.gerbang}`).join(",") === "P1:true,P2:true", `below the mark and the gate together: ${JSON.stringify(ulDua)} (P1 below the mark first, then P2, each once)`);
      const hal = baca("src", "app", "belajar", "[tugas]", "hasil", "page.tsx");
      c.expect(/bagianUlang\([^)]*outcome\.tujuan_gerbang_kode/.test(hal), "the result page does not give «Pelajari lagi» the missed question's objectives");
      c.expect(/alasan === "GERBANG" \? "hasil\.target\.belum_gerbang" : "hasil\.target\.belum_arti"/.test(hal), "the result page does not say hasil.target.belum_gerbang for a gate-only failure");
      c.expect(/\{ulang\.length > 0 \? \(/.test(hal), "the result page may draw «Pelajari lagi» empty (C2)");
      c.expect(/bagianUlang\([^)]*outcome\.tujuan_gerbang_kode/.test(baca("src", "lib", "hasil-belajar.ts")), "the printed report's list does not take the missed question's objectives");

      // (b) the teacher's one learner
      c.expect(typeof vonisHasil === "function", "pengajar.vonisHasil (the verdict beside one result) does not exist");
      if (vonisHasil) {
        const h = { mode: "POST_TEST", batas: 0.6, ditarik: false };
        const kasus: Array<[unknown, string | null]> = [
          [{ ...h, penguasaan: 0.5, gerbang: true }, "DI_BAWAH"], [{ ...h, penguasaan: 0.5, gerbang: false }, "DI_BAWAH"],
          [{ ...h, penguasaan: 0.9, gerbang: false }, "GERBANG"], [{ ...h, penguasaan: 0.9, gerbang: null }, "TAK_DIKETAHUI"],
          [{ ...h, penguasaan: 0.9 }, "TAK_DIKETAHUI"], [{ ...h, penguasaan: 0.9, gerbang: true }, "TERCAPAI"],
          [{ ...h, penguasaan: 0.9, gerbang: true, ditarik: true }, null], [{ ...h, batas: null, penguasaan: 0.9, gerbang: false }, null],
          [{ ...h, penguasaan: null, gerbang: false }, null], [{ ...h, mode: "PRE_TEST", penguasaan: 0.9, gerbang: false }, "TERCAPAI"],
        ];
        for (const [x, mau] of kasus) c.expect(vonisHasil(x) === mau, `vonisHasil(${JSON.stringify(x)}) = ${vonisHasil(x)} (expected ${mau})`);
      }
      const murid1 = baca("src", "app", "mengajar", "[kelas]", "murid", "[orang]", "page.tsx");
      c.expect(/v === "GERBANG" \? s\("mengajar\.murid1\.gerbang"\)/.test(murid1) && /v === "TAK_DIKETAHUI" \? s\("mengajar\.murid1\.gerbang_tak_diketahui"\)/.test(murid1),
        "the teacher's page does not say mengajar.murid1.gerbang / gerbang_tak_diketahui");
      // Daisy's Z3-A verdict (29a4e841): in each row, figure → verdict tag → the gate-unknown _arti line, directly under
      // its tag (b) → hasil.ulang_berjalan (C-2) → «Minta membaca lagi»
      const dd = /<dd className="pin-num">[\s\S]*?<\/dd>/.exec(murid1)?.[0] ?? "";
      const di = (x: string) => dd.indexOf(x);
      c.expect(di("data-target=") >= 0 && di("data-target=") < di("data-gerbang-tak-diketahui") && di("data-gerbang-tak-diketahui") < di("data-ulang-berjalan")
        && di("data-ulang-berjalan") < di("pin-ulang-tautan"),
        "the teacher's row is not in Daisy's order: figure → verdict tag → gerbang_tak_diketahui_arti (under its tag) → hasil.ulang_berjalan → «Minta membaca lagi»");
      c.expect(/v === "TAK_DIKETAHUI"[\s\S]{0,160}mengajar\.murid1\.gerbang_tak_diketahui_arti/.test(dd) && !/<\/dl>[\s\S]{0,400}gerbang_tak_diketahui_arti/.test(murid1),
        "the gate-unknown _arti line is not in its row, under its tag (or is still under the table)");
      c.expect(/\["DI_BAWAH", "GERBANG", "TAK_DIKETAHUI"\]\.includes\(ajar\.vonisHasil\(h\)/.test(murid1), "«Minta membaca lagi» is not offered for every verdict that is not reached");
      c.expect(/gerbang: typeof v\.safety_gate_passed === "boolean" \? v\.safety_gate_passed : null/.test(baca("src", "lib", "pengajar.ts")), "the teacher's read does not keep the gate, or reads a non-boolean as known");
      // C2 on the teacher's page (Sharon's nit): the latest Uji Penguasaan failed by the gate on a question with no
      // objective lists nothing, so the section says why instead of «no objective below target»
      const susun = (ajar as { susunCatatan?: (...a: unknown[]) => { terakhirUji?: string | null } }).susunCatatan;
      if (susun) {
        const tugas = [{ id: "uji", judul: "Uji", mode: "POST_TEST", batas: 0.6 }, { id: "awal", judul: "Awal", mode: "PRE_TEST", batas: null }];
        const sesi = [{ id: "u1", assessment_assignment_id: "uji", person_id: "o", status: "FINALIZED", finalized_at: "2026-11-01T00:00:00Z" },
          { id: "u2", assessment_assignment_id: "uji", person_id: "o", status: "FINALIZED", finalized_at: "2026-11-20T00:00:00Z" },
          { id: "a1", assessment_assignment_id: "awal", person_id: "o", status: "FINALIZED", finalized_at: "2026-11-25T00:00:00Z" },
          { id: "u3", assessment_assignment_id: "uji", person_id: "o", status: "IN_PROGRESS", finalized_at: null }];
        const r = susun("o", tugas, sesi, { status: "ok", value: [] });
        c.expect(r.terakhirUji === "u2", `the latest finished Uji Penguasaan in this class: ${r.terakhirUji} (expected u2: finished, latest, not the pre-test, not the open retake)`);
      }
      c.expect(/belum\.length === 0 && gerbangTanpaTujuan \? \([\s\S]{0,200}mengajar\.murid1\.gerbang_tanpa_tujuan/.test(murid1)
        && /const ujiTerakhir = catatan\.daftarHasil\.find\(\(h\) => h\.sesi === catatan\.terakhirUji\);/.test(murid1)
        && /const gerbangTanpaTujuan = ujiTerakhir !== undefined && ajar\.vonisHasil\(ujiTerakhir\) === "GERBANG";/.test(murid1),
        "the teacher's objectives section does not say mengajar.murid1.gerbang_tanpa_tujuan when the latest Uji Penguasaan failed by the gate with nothing to list");

      // (c) «Minta membaca lagi»
      c.expect(typeof urutUlang === "function", "pengajar.urutUlang is missing");
      if (urutUlang) {
        const m = [["a", "Ana"], ["b", "Budi"], ["c", "Cici"], ["d", "Dodi"], ["e", "Eka"]].map(([id, nama]) => ({ id, nama }));
        const p = new Map<string, number | null>([["a", 0.9], ["b", 0.5], ["c", 0.95], ["d", 0.8]]);
        const g = new Map<string, boolean | null>([["a", false], ["b", true], ["c", true], ["d", null]]);
        const u = urutUlang(m, p, 0.6, g);
        c.expect(u.map((x) => `${x.id}:${x.status}`).join(",") === "b:bawah,a:gerbang,d:tak_diketahui,e:belum,c:capai",
          `the request page's order: ${u.map((x) => `${x.id}:${x.status}`).join(",")} (expected below the mark, the gate, the gate unknown, not finished, reached)`);
      }
      const ulangHal = baca("src", "app", "mengajar", "[kelas]", "ulang", "page.tsx");
      c.expect(/defaultChecked=\{dariMurid \? m\.id === dariMurid : m\.status === "bawah" \|\| m\.status === "gerbang"\}/.test(ulangHal), "the gate learner is not pre-ticked, or the gate-unknown one is");
      c.expect(/m\.status === "gerbang" \? "mengajar\.ulang\.gerbang" : "mengajar\.ulang\.tak_diketahui"/.test(ulangHal), "the request page's rows do not carry mengajar.ulang.gerbang / tak_diketahui");

      // (d) the retake queue
      c.expect(typeof kunciHasilAntrean === "function", "pengerjaan-kontrak.kunciHasilAntrean is missing");
      if (kunciHasilAntrean) {
        const kasus: Array<[unknown, string | null]> = [
          [{ hasil_terakhir: 0.9, target: 0.6, gerbang: false }, "kesempatan.baris.hasil_gerbang"],
          [{ hasil_terakhir: 0.9, target: 0.6, gerbang: null }, "kesempatan.baris.hasil_tak_diketahui"],
          [{ hasil_terakhir: 0.9, target: 0.6 }, "kesempatan.baris.hasil_tak_diketahui"],
          [{ hasil_terakhir: 0.9, target: 0.6, gerbang: true }, "kesempatan.baris.hasil"],
          [{ hasil_terakhir: 0.9, target: null, gerbang: false }, "kesempatan.baris.hasil_saja"],
          [{ hasil_terakhir: null, target: null, gerbang: null }, null],
        ];
        for (const [x, mau] of kasus) c.expect(kunciHasilAntrean(x) === mau, `the queue line for ${JSON.stringify(x)}: ${kunciHasilAntrean(x)} (expected ${mau})`);
      }
      c.expect(/const kunciHasil = kunciHasilAntrean\(r\);/.test(baca("src", "components", "kesempatan", "DaftarAntrean.tsx")), "the retake queue does not draw its line by kunciHasilAntrean");

      // (e) V2 and D14 on the summary, rendered; V2 on the teacher's page
      const bab = [{ tugas: "t1", judul: "Bab 1", keadaan: "SELESAI", awal: null, akhir: 0.8, ambang: 0.6, tercapai: "TERCAPAI", benar: 8, total: 10, bagian: [], ulang: [], ulangBerjalan: true },
        { tugas: "t2", judul: "Bab 2", keadaan: "SELESAI", awal: null, akhir: 0.7, ambang: 0.6, tercapai: "TERCAPAI", benar: 7, total: 10, bagian: [], ulang: [], dihitungUlang: true },
        { tugas: "t3", judul: "Bab 3", keadaan: "SELESAI", awal: null, akhir: 0.9, ambang: 0.6, tercapai: "TERCAPAI", benar: 9, total: 10, bagian: [], ulang: [] },
        // C-1: the gate case, 83 % against 60 % and «belum mencapai target»
        { tugas: "t4", judul: "Bab 4", keadaan: "SELESAI", awal: null, akhir: 0.83, ambang: 0.6, tercapai: "BELUM", benar: 5, total: 6, bagian: [], ulang: [], gerbang: true },
        { tugas: "t5", judul: "Bab 5", keadaan: "SELESAI", awal: null, akhir: 0.4, ambang: 0.6, tercapai: "BELUM", benar: 2, total: 5, bagian: [], ulang: [] }];
      const r = render(repoRoot,
        'const { createElement: h } = await import("react"); const { renderToStaticMarkup } = await import("react-dom/server");' +
        'const m = await import("file://" + process.cwd() + "/src/components/laporan/KomposisiMurid.tsx"); const K = m.default?.default ?? m.default;' +
        "const bab = JSON.parse(process.env.BAB); process.stdout.write(JSON.stringify([renderToStaticMarkup(h(K, { bab, locale: 'id' })), renderToStaticMarkup(h(K, { bab, locale: 'en' }))]));",
        { BAB: JSON.stringify(bab) });
      if (c.expect(r.ok, `the summary could not be rendered: ${r.err}`)) {
        let x: string[] = [];
        try { x = JSON.parse(r.out); } catch { /* reported below */ }
        for (const [i, locale] of (["id", "en"] as const).entries()) {
          const baris = [...(x[i] ?? "").matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)].map((mm) => mm[1]);
          const ber = t("hasil.ulang_berjalan" as never, "learner", { locale }), dh = t("hasil.dihitung_ulang" as never, "learner", { locale });
          const satu = baris.find((b) => b.includes("Bab 1")) ?? "", dua = baris.find((b) => b.includes("Bab 2")) ?? "", tiga = baris.find((b) => b.includes("Bab 3")) ?? "";
          c.expect(satu.includes("data-ulang-berjalan") && satu.includes(ber.replace(/'/g, "&#x27;")), `(${locale}) the chapter with a retake open does not say hasil.ulang_berjalan`);
          c.expect(dua.includes("data-dihitung-ulang") && !dua.includes("data-ulang-berjalan"), `(${locale}) the recalculated chapter does not carry the D14 marker alone (${dh.slice(0, 30)}…)`);
          c.expect(!tiga.includes("data-ulang-berjalan") && !tiga.includes("data-dihitung-ulang"), `(${locale}) an ordinary chapter carries a V2 or D14 line`);
          const empat = baris.find((b) => b.includes("Bab 4")) ?? "", lima = baris.find((b) => b.includes("Bab 5")) ?? "";
          const gb = t("hasilbelajar.gerbang" as never, "learner", { locale }).replace(/'/g, "&#x27;");
          c.expect(/<span class="pin-lk-nilai">[\s\S]*?<\/span><small[^>]*data-gerbang=""[^>]*>/.test(empat) && empat.includes(gb) && !/<svg|pin-ikon/.test(empat),
            `(${locale}) the gate case does not say hasilbelajar.gerbang directly after its figures, neutral and without an icon`);
          c.expect(![satu, dua, tiga, lima].some((b) => b.includes("data-gerbang")), `(${locale}) a chapter that is not the gate case says hasilbelajar.gerbang`);
        }
      }
      c.expect(/\.\.\.\(alasanBelum\(outcome\) === "GERBANG" \? \{ gerbang: true \} : \{\}\)/.test(baca("src", "lib", "hasil-belajar.ts")), "the summary does not mark the gate case (alasanBelum)");
      c.expect(/\.\.\.\(t\.ulang_berjalan === true \? \{ ulangBerjalan: true \} : \{\}\)/.test(baca("src", "lib", "hasil-belajar.ts")), "the summary does not take ulang_berjalan from hasil_belajar_sesi_saya");
      c.expect(/h\.ulangBerjalan \? <small className="pin-meta" data-ulang-berjalan="">\{s\("hasil\.ulang_berjalan"\)\}/.test(murid1), "the teacher's page does not say hasil.ulang_berjalan beside a finished result with a retake open");

      // (f) the words, exactly
      for (const [k, id, en] of KATA_Z3A) {
        const a = t(k as never, "learner", { locale: "id" }), b = t(k as never, "learner", { locale: "en" });
        c.expect(a === id && b === en, `${k}: «${a}» / «${b}» (not Daisy's words)`);
      }

      // (g) recovery walks: a failed read never reads as reached, and the read that succeeds gives the right verdict
      if (vonisHasil && kunciHasilAntrean && urutUlang) {
        const h = { mode: "POST_TEST", batas: 0.6, ditarik: false, penguasaan: 0.9 };
        const jalan = [
          ["teacher's page", vonisHasil({ ...h, gerbang: null }), vonisHasil({ ...h, gerbang: false }), "TAK_DIKETAHUI", "GERBANG"],
          ["teacher's page (passed)", vonisHasil({ ...h, gerbang: null }), vonisHasil({ ...h, gerbang: true }), "TAK_DIKETAHUI", "TERCAPAI"],
          ["retake queue", kunciHasilAntrean({ hasil_terakhir: 0.9, target: 0.6, gerbang: null }), kunciHasilAntrean({ hasil_terakhir: 0.9, target: 0.6, gerbang: false }),
            "kesempatan.baris.hasil_tak_diketahui", "kesempatan.baris.hasil_gerbang"],
          ["request page", urutUlang([{ id: "a", nama: "A" }], new Map([["a", 0.9]]), 0.6, new Map([["a", null]]))[0]?.status,
            urutUlang([{ id: "a", nama: "A" }], new Map([["a", 0.9]]), 0.6, new Map([["a", false]]))[0]?.status, "tak_diketahui", "gerbang"],
        ] as const;
        for (const [apa, sebelum, sesudah, mauSebelum, mauSesudah] of jalan) {
          c.expect(sebelum === mauSebelum && sesudah === mauSesudah, `recovery on the ${apa}: ${sebelum} → ${sesudah} (expected ${mauSebelum} → ${mauSesudah})`);
        }
      }
      const komposisi = baca("src", "components", "laporan", "KomposisiKelas.tsx");
      c.expect(/o\.ulang === null\s*\? <small>\{s\("mengajar\.murid1\.tujuan_gagal"\)\}<\/small>/.test(komposisi), "the class report's recovery state (N-15: objectives unread) is not said");
      return c.verdict(`the learner's reason (alasanBelum: GERBANG / DI_BAWAH), «Pelajari lagi» with the missed question's objective and empty for C2; the teacher's verdict (vonisHasil, 10 cases) with gerbang / gerbang_tak_diketahui and its line; «Minta membaca lagi»'s order and pre-ticks; the queue's four lines; V2 and D14 on the rendered summary (ID and EN) and V2 on the teacher's page; ${KATA_Z3A.length} keys word for word; recovery walks on the teacher's page, the queue, the request page and the class report`);
    },
  },
  {
    id: "Z-K01-03",
    requires: ["db"],
    run: async () => {
      const c = new Checks();
      const siklus = await import("../src/lib/siklus");
      const ajar = await import("../src/lib/pengajar");
      const { kunciHasilAntrean } = await import("../src/lib/pengerjaan-kontrak");
      // one learner's world, read through the database's own functions as each reader, rolled back
      const dunia = (m: { gerbangGagal?: boolean; koreksi?: boolean }) => {
        const keluar = psql(`begin;
create temp table t_s on commit drop as select s.* from public.assessment_sessions s join public.accounts a on a.person_id = s.person_id join auth.users u on u.id = a.auth_user_id
 where u.email = ${lit(SISWA)} and s.status = 'FINALIZED' and s.mode = 'POST_TEST';
create temp table t_w on commit drop as select f.item_id, (select o.label from public.item_options o where o.item_id = f.item_id and not o.is_correct order by o.label limit 1) as salah
  from public.session_final_responses((select id from t_s)) f where f.is_safety_critical limit 1;
grant select on t_s, t_w to authenticated;
set local session_replication_role = replica;
${m.gerbangGagal ? `update public.responses r set value = jsonb_build_object('pilihan', (select salah from t_w)) from public.presented_items p
 where p.id = r.presented_item_id and r.is_final and p.session_id = (select id from t_s) and p.item_id = (select item_id from t_w);
update public.assessment_results set safety_gate_passed = false where session_id = (select id from t_s);` : ""}
insert into public.attempt_requests (id, person_id, session_id, assessment_assignment_id, institution_id, requested_by_person_id, requested_at, reason, status)
select gen_random_uuid(), t.person_id, t.id, t.assessment_assignment_id, t.institution_id,
       (select a.person_id from public.accounts a join auth.users u on u.id = a.auth_user_id where u.email = ${lit(GURU)}), now(), 'Z-K01-03: satu kesempatan lagi untuk uji', 'PENDING' from t_s t;
set local session_replication_role = origin;
${m.koreksi ? `select selftest.as_user(${lit(ADMIN)});
select set_config('z.k', public.ajukan_koreksi_kunci((select item_id from t_w), array[(select salah from t_w)], 'Z-K01-03: kunci soal wajib diperbaiki oleh dua orang.') ->> 'koreksi', false);
reset role;
select selftest.as_user(${lit(KAPRODI)});
select 'koreksi|' || (public.tegaskan_koreksi_kunci(current_setting('z.k')::uuid) ->> 'ok');
reset role;` : ""}
select 'batas|' || (select a.pass_mark from public.assessment_assignments a where a.id = (select assessment_assignment_id from t_s));
select selftest.as_user(${lit(SISWA)});
select 'hasil|' || public.session_outcome((select id from t_s))::text;
select 'peta|' || coalesce((select jsonb_agg(jsonb_build_object('kode', r.kode, 'pernyataan', r.pernyataan, 'pelajaran', r.pelajaran)) from public.reading_map((select id from t_s)) r), '[]')::text;
reset role;
select selftest.as_user(${lit(GURU)});
select 'guru|' || (public.metric_evaluate('learner.result', (select person_id from t_s), (select institution_id from t_s)))::text;
reset role;
select selftest.as_user(${lit(KAPRODI)});
select 'antrean|' || coalesce((select jsonb_agg(to_jsonb(a)) from public.percobaan_antrean((select institution_id from t_s)) a where a.person_id = (select person_id from t_s)), '[]')::text;
reset role;
select 'sesi|' || (select id from t_s);
rollback;`);
        const o: Record<string, string> = {};
        for (const b of keluar.split("\n")) { const i = b.indexOf("|"); if (i > 0 && /^(koreksi|batas|hasil|peta|guru|antrean|sesi)$/.test(b.slice(0, i))) o[b.slice(0, i)] = b.slice(i + 1); }
        return o;
      };
      // the four screens' verdicts from one world, by the screens' own rules
      const layar = (o: Record<string, string>) => {
        const hasil = JSON.parse(o.hasil ?? "null");
        const peta = JSON.parse(o.peta ?? "[]");
        const batas = o.batas ? Number(o.batas) : null;
        const ulang = siklus.ketuntasan(hasil) === "BELUM" ? siklus.bagianUlang(hasil.per_domain, hasil.ambang, peta, [], hasil.tujuan_gerbang_kode ?? []) : [];
        const amplop = JSON.parse(o.guru ?? "{}");
        const baris = (Array.isArray(amplop.value) ? amplop.value : []).find((v: { session_id: string }) => v.session_id === o.sesi) ?? {};
        const v = ajar.vonisHasil({ mode: "POST_TEST", penguasaan: typeof baris.mastery === "number" ? baris.mastery : Number(baris.mastery), batas, ditarik: false,
          gerbang: typeof baris.safety_gate_passed === "boolean" ? baris.safety_gate_passed : null });
        const permintaan = ajar.urutUlang([{ id: "x", nama: "X" }], new Map([["x", typeof baris.mastery === "number" ? baris.mastery : Number(baris.mastery)]]), batas,
          new Map([["x", typeof baris.safety_gate_passed === "boolean" ? baris.safety_gate_passed : null]]))[0]?.status;
        const antrean = JSON.parse(o.antrean ?? "[]")[0];
        return {
          murid: `${siklus.ketuntasan(hasil)}:${siklus.alasanBelum(hasil)}`, pelajari: ulang.map((u) => `${u.kode}${u.gerbang ? "*" : ""}`).join(","),
          guru: v, minta: permintaan, antrean: antrean ? kunciHasilAntrean(antrean) : "none",
        };
      };
      const lihat: string[] = [];
      // learner (i): the percentage meets the mark, a must-be-right question missed
      const satu = layar(dunia({ gerbangGagal: true }));
      lihat.push(`(i) ${JSON.stringify(satu)}`);
      c.expect(satu.murid === "BELUM:GERBANG", `learner (i) on her result page: ${satu.murid} (expected BELUM, the gate as the reason)`);
      c.expect(/\*/.test(satu.pelajari), `learner (i)'s «Pelajari lagi»: «${satu.pelajari}» (expected the missed question's objective)`);
      c.expect(satu.guru === "GERBANG" && satu.minta === "gerbang" && satu.antrean === "kesempatan.baris.hasil_gerbang",
        `learner (i) for her teacher, on «Minta membaca lagi» and in the queue: ${satu.guru}, ${satu.minta}, ${satu.antrean} (expected GERBANG, gerbang, hasil_gerbang)`);
      // learner (ii) one way: an approved correction makes her right must-be-right answer wrong
      const duaSalah = layar(dunia({ koreksi: true }));
      lihat.push(`(ii→wrong) ${JSON.stringify(duaSalah)}`);
      c.expect(duaSalah.murid === "BELUM:GERBANG" && duaSalah.guru === "GERBANG" && duaSalah.minta === "gerbang" && duaSalah.antrean === "kesempatan.baris.hasil_gerbang",
        `learner (ii) after a correction made her must-be-right answer wrong: ${JSON.stringify(duaSalah)} (expected «belum» by the gate on all four)`);
      // learner (ii) the other way: an approved correction makes her missed must-be-right answer right
      const duaBenar = layar(dunia({ gerbangGagal: true, koreksi: true }));
      lihat.push(`(ii→right) ${JSON.stringify(duaBenar)}`);
      c.expect(duaBenar.murid === "TERCAPAI:null" && duaBenar.pelajari === "" && duaBenar.guru === "TERCAPAI" && duaBenar.minta === "capai" && duaBenar.antrean === "kesempatan.baris.hasil",
        `learner (ii) after a correction made her missed answer right: ${JSON.stringify(duaBenar)} (expected reached on all four)`);
      // and the untouched sitting, for contrast
      const asli = layar(dunia({}));
      lihat.push(`(untouched) ${JSON.stringify(asli)}`);
      c.expect(asli.murid === "TERCAPAI:null" && asli.guru === "TERCAPAI" && asli.minta === "capai" && asli.antrean === "kesempatan.baris.hasil", `the untouched sitting: ${JSON.stringify(asli)} (reached on all four)`);
      return c.verdict(`the integrated check (ruling 81) through session_outcome, reading_map, learner.result and percobaan_antrean as each reader, rolled back, into the screens' rules: ${lihat.join("; ")}`);
    },
  },
];
