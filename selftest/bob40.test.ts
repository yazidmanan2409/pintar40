/**
 * BOB-40 (post-login review #3, D-061) -- THE TEACHER'S «LAYAK DIKERJAKAN LEBIH
 * DULU» FITS THE CLASS. satuHal proposed any published school release a class
 * in scope did not have, and never compared subject or grade, so a Grade 1 or
 * Grade 5 teacher could be told, as the landing's primary action, that an SMA
 * course came first. The rule (coordinator): a (class, release) pair is a
 * candidate only when the class already holds an assignment whose course has
 * the release's course's subject, stage and grade_label.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";

const tanpaKomentar = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");

type Kunci = { subject: string | null; stage: string | null; grade_label: string | null };
type Pilih = (
  kelas: Array<{ id: string; nama: string }>,
  terbit: Array<{ id: string; courseId: string; kursus: string; terbitPada: string | null }>,
  tugas: Map<string, Array<{ releaseId: string; courseId: string }>>,
  kunci: Map<string, Kunci>,
) => { kelasId: string; terbitanId: string; kursusId: string; lanjutan: boolean } | null;

export const bob40Tests: SelfTest[] = [
  {
    id: "BOB40-K01",
    run: async (ctx) => {
      const c = new Checks();
      let mod: Record<string, unknown> | null = null;
      try { mod = (await import("../src/lib/pengajar")) as Record<string, unknown>; } catch (e) { c.note(`pengajar could not be imported: ${String(e).slice(0, 80)}`); }
      const pilih = mod?.pilihSatuHal as Pilih | undefined;

      // a school with two grades' courses (and an SMA course) published
      const kunci = new Map<string, Kunci>([
        ["mat5", { subject: "Matematika", stage: "SD", grade_label: "5" }],
        ["mat5-v2", { subject: "Matematika", stage: "SD", grade_label: "5" }],   // the next course in its lineage
        ["mat1", { subject: "Matematika", stage: "SD", grade_label: "1" }],
        ["mat10", { subject: "Matematika", stage: "SMA", grade_label: "10" }],
        ["ind5", { subject: "Bahasa Indonesia", stage: "SD", grade_label: "5" }],
      ]);
      const terbit = [
        { id: "r-mat10", courseId: "mat10", kursus: "Matematika SMA 10", terbitPada: "2026-09-28T00:00:00Z" },
        { id: "r-mat1", courseId: "mat1", kursus: "Matematika SD 1", terbitPada: "2026-09-27T00:00:00Z" },
        { id: "r-ind5", courseId: "ind5", kursus: "Bahasa Indonesia SD 5", terbitPada: "2026-09-26T00:00:00Z" },
        { id: "r-mat5-v2", courseId: "mat5-v2", kursus: "Matematika SD 5 (revisi)", terbitPada: "2026-09-25T00:00:00Z" },
        { id: "r-mat5-b", courseId: "mat5", kursus: "Matematika SD 5", terbitPada: "2026-09-20T00:00:00Z" },
        { id: "r-mat5-a", courseId: "mat5", kursus: "Matematika SD 5", terbitPada: "2026-09-01T00:00:00Z" },
      ];
      const kelas5 = [{ id: "5A", nama: "5A" }];

      if (c.expect(typeof pilih === "function", "the teacher's first suggestion compares no subject or grade: src/lib/pengajar.ts has no pilihSatuHal to choose by them")) {
        // 1. the defect: a Grade 5 class holding Matematika SD 5 is never told SMA 10, SD 1 or another subject
        const tugas5 = new Map([["5A", [{ releaseId: "r-mat5-a", courseId: "mat5" }]]]);
        const p = pilih!(kelas5, terbit, tugas5, kunci);
        c.expect(p !== null && !["r-mat10", "r-mat1", "r-ind5"].includes(p.terbitanId),
          `a Grade 5 class holding Matematika SD 5 is told ${p?.terbitanId ?? "nothing"} comes first`);
        // 2. preserved: the class's own course comes first (the next release of what it takes), as a continuation
        c.expect(p?.terbitanId === "r-mat5-b" && p?.lanjutan === true && p?.kelasId === "5A",
          `the next release of the course the class takes is not the first suggestion (got ${JSON.stringify(p)})`);
        // 3. the next course in a lineage the class takes is a candidate
        const sudahB = new Map([["5A", [{ releaseId: "r-mat5-a", courseId: "mat5" }, { releaseId: "r-mat5-b", courseId: "mat5" }]]]);
        const q = pilih!(kelas5, terbit, sudahB, kunci);
        c.expect(q?.terbitanId === "r-mat5-v2" && q?.lanjutan === false,
          `the next course in the class's own lineage (same subject, stage and grade) is not suggested (got ${JSON.stringify(q)})`);
        // 4. nothing that fits: nothing is suggested, and the quiet line shows
        const semua = new Map([["5A", [{ releaseId: "r-mat5-a", courseId: "mat5" }, { releaseId: "r-mat5-b", courseId: "mat5" },
                                       { releaseId: "r-mat5-v2", courseId: "mat5-v2" }]]]);
        c.expect(pilih!(kelas5, terbit, semua, kunci) === null, "when nothing of the class's subject and grade is left, something else is suggested");
        // 5. a class with no assignment gets no course suggestion
        c.expect(pilih!(kelas5, terbit, new Map(), kunci) === null, "a class with no assignment is told a course comes first");
        // 6. a course with no known subject, stage or grade is never matched
        const kosong = new Map([...kunci, ["mat5", { subject: null, stage: null, grade_label: null }]]);
        c.expect(pilih!(kelas5, [terbit[5], { ...terbit[0], courseId: "tanpa" }], new Map([["5A", [{ releaseId: "x", courseId: "mat5" }]]]), kosong)?.terbitanId !== "r-mat10",
          "a course with no subject, stage or grade is matched to one that has none");
      }

      // 7. satuHal reads the three fields and chooses through the rule
      const src = tanpaKomentar(readFileSync(join(ctx.repoRoot, "src", "lib", "pengajar.ts"), "utf8"));
      const fn = /export async function satuHal[\s\S]*?\n\}/.exec(src)?.[0] ?? "";
      c.expect(/\.from\("courses"\)\.select\("id, subject, stage, grade_label"\)/.test(fn) && /return pilihSatuHal\(/.test(fn),
        "satuHal does not read each course's subject, stage and grade_label and choose through pilihSatuHal");
      // 8. preserved: the card, its link to step 2 of Siapkan, and the quiet line
      const hal = tanpaKomentar(readFileSync(join(ctx.repoRoot, "src", "app", "mengajar", "page.tsx"), "utf8"));
      c.expect(/href=\{`\/mengajar\/\$\{satu\.kelasId\}\/siapkan\?terbitan=\$\{satu\.terbitanId\}`\}/.test(hal), "the suggestion no longer links to step 2 of Siapkan for its class");
      c.expect(/s\("mengajar\.layak\.kosong"\)/.test(hal), "the quiet line no longer shows when nothing qualifies");

      return c.verdict(
        "pilihSatuHal, executed: a Grade 5 class holding Matematika SD 5 is offered the next release of that course first (a " +
          "continuation), then the next course of the same subject, stage and grade in its lineage, and never an SMA 10, an SD 1 or " +
          "another subject's course; with nothing of its kind left, or with no assignment at all, nothing is suggested; satuHal reads " +
          "subject, stage and grade_label and chooses through it; the card's link to step 2 of Siapkan and the quiet line are unchanged",
      );
    },
  },
];
