/**
 * M3 (D-085), W4 -- COMPLETION IS NOT MASTERY, AND THE LEARNER IS TOLD WHICH HOLDS.
 *
 * "Completing a post-test does NOT automatically mean that mastery was achieved.
 * After the post-test, the learner must be clearly told whether the mastery
 * target was achieved. If the learner is below target: PINTAR directs the
 * learner toward relevant material for review; the learner remains visibly
 * below target to the authorised teacher; PINTAR must not imply successful
 * mastery merely because the activities were completed." W4: results never said
 * whether the target was met, the chapter read «Selesai» at any score, and
 * «Apa berikutnya» could tell a low scorer that everything was done. The
 * target is the mark sealed on the attempt (D-088(b), BOB-49).
 *
 *   M3-K01  executes ketuntasan and bagianUlang (src/lib/siklus.ts); renders the
 *           chapter card finished at and below target; reads the source of the
 *           result page, «Apa berikutnya», the home and the teacher's learner
 *           record; the copy in id and en
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { t } from "../src/lib/hle";
import { Checks, type SelfTest } from "./lib";

const buang = (x: string) => x.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");

export const m3Tests: SelfTest[] = [
  {
    id: "M3-K01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const { ketuntasan, bagianUlang } = await import("../src/lib/siklus");

      // the verdict is the session's own; no verdict where there is none to tell
      c.expect(ketuntasan({ diagnostik: false, lulus: true }) === "TERCAPAI", "a lulus post-test does not read as the target reached");
      c.expect(ketuntasan({ diagnostik: false, lulus: false }) === "BELUM", "a post-test below the mark does not read as below target");
      c.expect(ketuntasan({ diagnostik: false, lulus: null }) === null, "a result with no sealed mark claims a verdict");
      c.expect(ketuntasan({ diagnostik: true }) === null, "a Pemetaan Awal claims a verdict");
      c.expect(ketuntasan(null) === null, "no outcome claims a verdict");

      // below target: the parts under the mark, lowest first, each tied to its lesson where the reading map names one
      const ulang = bagianUlang(
        { "B1-1": { penguasaan: 1 }, "B1-2": { penguasaan: 0.5 }, "B1-3": { penguasaan: 0 }, "B1-4": { penguasaan: 0.59 } },
        0.6,
        [{ kode: "B1-2", pernyataan: "Membandingkan bilangan", pelajaran: "Pelajaran 2" },
          { kode: "B1-3", pernyataan: "Mengurutkan bilangan", pelajaran: "Pelajaran 3" }],
        [{ lesson_id: "L2", judul: "Pelajaran 2" }, { lesson_id: "L3", judul: "Pelajaran 3" }],
      );
      c.expect(JSON.stringify(ulang.map((u) => [u.kode, u.lessonId, u.nama])) === JSON.stringify([
        ["B1-3", "L3", "Mengurutkan bilangan"], ["B1-2", "L2", "Membandingkan bilangan"], ["B1-4", null, "B1-4"]]),
        `the parts to review read ${JSON.stringify(ulang)}; expected those under 60%, lowest first, each with its lesson where the map names one`);
      c.expect(bagianUlang({ "B1-1": { penguasaan: 0.2 } }, null, [], []).length === 0, "parts are named below a mark that does not exist");

      // the chapter card: «Selesai» says which holds
      const anak = spawnSync(process.execPath, ["--import", "tsx", "-e",
        "(async () => {" +
        '  const { createElement: h } = await import("react");' +
        '  const { renderToStaticMarkup } = await import("react-dom/server");' +
        '  const m = await import("file://" + process.cwd() + "/src/components/siklus/KartuTugas.tsx");' +
        "  const K = m.default?.default ?? m.default;" +
        "  const tugas = { learning_assignment_id: 't', course_id: 'c', plp_release_id: 'r', subject: 'Matematika', stage: 'SD', grade_label: 'Kelas 5', title: 'Bab 1' };" +
        "  const posisi = { langkah: 'HASIL', pelajaranSelesai: 3, pelajaranTotal: 3, selesai: true };" +
        "  process.stdout.write(JSON.stringify(['TERCAPAI', 'BELUM', null].map((target) => renderToStaticMarkup(h(K, { tugas, posisi, locale: 'id', aksi: null, target })))));" +
        "})().catch((e) => { process.stderr.write(String(e && e.stack || e)); process.exit(1); });"], { cwd: repoRoot, encoding: "utf8" });
      let html: string[] = [];
      try { html = JSON.parse(anak.stdout); } catch { /* reported below */ }
      if (c.expect(anak.status === 0 && html.length === 3, `the chapter card could not be rendered: ${(anak.stderr || "").split("\n").slice(0, 3).join(" ")}`)) {
        const status = (x: string) => (/<span class="pin-tstatus">([\s\S]*?)<\/span>/.exec(x)?.[1] ?? "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
        c.expect(status(html[0]) === "Selesai · target tercapai", `a finished chapter at target reads "${status(html[0])}"`);
        c.expect(status(html[1]) === "Selesai · belum mencapai target", `a finished chapter below target reads "${status(html[1])}"`);
        c.expect(status(html[2]) === "Selesai", `a finished chapter with no verdict reads "${status(html[2])}"`);
      }

      const hasil = buang(readFileSync(join(repoRoot, "src", "app", "belajar", "[tugas]", "hasil", "page.tsx"), "utf8"));
      c.expect(/const target = ketuntasan\(outcome\)/.test(hasil) && /hasil\.target\.tercapai/.test(hasil) && /hasil\.target\.belum/.test(hasil)
        && /bagianUlang\(outcome\.per_domain, outcome\.ambang, peta, pelajaran\)/.test(hasil) && /\/pelajaran\/\$\{u\.lessonId\}/.test(hasil),
        "the result page does not say whether the target was met, or does not point a learner below it at the lessons to review");
      const lanjut = buang(readFileSync(join(repoRoot, "src", "app", "belajar", "[tugas]", "lanjut", "page.tsx"), "utf8"));
      c.expect(/target === "BELUM"/.test(lanjut) && /siklus\.target\.lanjut_belum/.test(lanjut) && /hasil#ulang/.test(lanjut),
        "«Apa berikutnya» can still tell a learner below target only that everything is done");
      const rumah = buang(readFileSync(join(repoRoot, "src", "app", "belajar", "page.tsx"), "utf8"));
      c.expect(/target=\{capaian\.get\(k\.tugas\.learning_assignment_id\) \?\? null\}/.test(rumah), "the home's chapter cards are not told the verdict");
      const murid = buang(readFileSync(join(repoRoot, "src", "app", "mengajar", "[kelas]", "murid", "[orang]", "page.tsx"), "utf8"));
      c.expect(/mengajar\.murid1\.di_bawah_target/.test(murid) && /h\.penguasaan < h\.batas/.test(murid),
        "the teacher's record of a learner does not show a result below its target as below it");

      for (const locale of ["id", "en"] as const) {
        for (const k of ["hasil.target.tercapai", "hasil.target.belum", "hasil.target.belum_arti", "hasil.target.ulang",
          "siklus.target.tercapai", "siklus.target.belum", "siklus.target.lanjut_belum", "siklus.target.lihat_ulang",
          "mengajar.murid1.di_bawah_target"] as const) {
          const kal = t(k, "learner", { locale });
          c.expect(kal.length > 3 && kal !== k, `(${locale}) ${k} has no text`);
        }
        c.expect(!/lulus|gagal|fail|pass\b/i.test(t("hasil.target.belum_arti", "learner", { locale })),
          `(${locale}) below target is worded as failure`);
      }
      return c.verdict(
        "executes ketuntasan and bagianUlang (src/lib/siklus.ts): the target reached or not from the session's own verdict, " +
          "none for a Pemetaan Awal or an unsealed result; below target the objectives under the mark, lowest first, each " +
          "with the lesson the reading map ties it to. Rendered: a finished chapter reads «Selesai · target tercapai» or " +
          "«Selesai · belum mencapai target», «Selesai» alone with no verdict. Reads the source of the result page (the " +
          "verdict, the lessons to review), «Apa berikutnya» (never only 'all done' below target), the home and the " +
          "teacher's learner record (below target shown); the copy table in id and en, never worded as failure",
      );
    },
  },
];
