/**
 * BOB-04 — ASSIGNING A LESSON, read from its sources. The behaviour is proved
 * in the database by selftest/db/fable13.sql (F13-*); what this file proves is
 * that the contract, the copy table, the teacher's action and page, and the
 * learner's two test pages agree with the migration.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";
import { t, LOCALES } from "../src/lib/hle";
import { KODE_PENUGASAN_DB, kunciKodePenugasan, type KodePenugasan } from "../src/lib/penugasan-kontrak";

const MIGRASI = "20261010100000_a_lesson_is_assigned_whole.sql";

export const penugasanTests: SelfTest[] = [
  {
    // =======================================================================
    // BOB04-K01 — ONE CONTRACT, FROM THE DATABASE TO THE TEACHER AND THE LEARNER.
    // =======================================================================
    id: "BOB04-K01",
    run: async (ctx) => {
      const c = new Checks();
      const root = ctx.repoRoot;
      const sql = readFileSync(join(root, "supabase", "migrations", MIGRASI), "utf8").replace(/--[^\n]*/g, "");

      // the codes assign_refuse knows for assigning are exactly the contract's, and each is raised
      const tolak = /create function public\.assign_refuse[\s\S]*?\$\$;/.exec(sql)?.[0] ?? "";
      const dariDb = [...tolak.matchAll(/when '([A-Z_]+)'/g)].map((m) => m[1]).filter((k) => k.startsWith("ASSIGN_"));
      // D-088(b), BOB-49: one more code, raised with the same SQLSTATE and DETAIL by the assignment's seal, which every
      // path that gives a class an assessment passes through (supabase/migrations/20261102100000)
      const segel = readFileSync(join(root, "supabase", "migrations", "20261102100000_a_school_sets_its_own_pass_mark.sql"), "utf8");
      const dariSegel = /create or replace function public\.seal_assignment_pass_mark[\s\S]*?errcode = 'PR050', detail = '(ASSIGN_[A-Z_]+)'/.exec(segel)?.[1];
      // RESTATED FOR BOB-43 (a changed requirement, D-069(d)): one more, raised by the assignment boundary on both
      // assignment tables (enforce_assignment_context), which every path that gives a place material passes through
      const batas = readFileSync(join(root, "supabase", "migrations", "20261118100000_an_educator_learns_as_a_participant.sql"), "utf8");
      const dariBatas = /create or replace function public\.enforce_assignment_context[\s\S]*?assign_refuse\('(ASSIGN_[A-Z_]+)'\)/.exec(batas)?.[1];
      // RESTATED FOR D-183 (a new requirement, F-4(f)): one more, raised by the exposure guard on the assessment
      // assignment (refuse_exposed_assignment), which every path that gives a class a Pemetaan Awal or Cek penguasaan
      // passes through. The code is read from the guard's own source, so a renamed or removed code fails here
      const paparan = readFileSync(join(root, "supabase", "migrations", "20261228100000_exposed_questions_never_give_a_real_verdict.sql"), "utf8");
      const dariPaparan = /create or replace function public\.refuse_exposed_assignment[\s\S]*?errcode = 'PR050', detail = '(ASSIGN_[A-Z_]+)'/.exec(paparan)?.[1];
      const semuaDb = [...dariDb, ...(dariSegel ? [dariSegel] : []), ...(dariBatas ? [dariBatas] : []), ...(dariPaparan ? [dariPaparan] : [])].sort();
      c.expect(JSON.stringify(semuaDb) === JSON.stringify([...KODE_PENUGASAN_DB].sort()),
        `assign_refuse and the assignment's seal know ${semuaDb.join(",")} and the contract names ${KODE_PENUGASAN_DB.join(",")}`);
      const assign = /create function public\.assign_release[\s\S]*?end \$\$;/.exec(sql)?.[0] ?? "";
      for (const k of KODE_PENUGASAN_DB.filter((x) => x !== dariSegel && x !== dariBatas && x !== dariPaparan)) {
        c.expect(assign.includes(`assign_refuse('${k}')`), `the contract names ${k} and assign_release never raises it`);
      }
      c.expect(/assign_refuse\('CYCLE_NOT_ASSIGNED'\)/.test(
        /function public\.my_cycle_state[\s\S]*?end \$function\$;/.exec(sql)?.[0] ?? ""),
        "my_cycle_state no longer refuses a stranger with a code");

      // every code has a sentence in both languages, and never the machinery
      const MESIN = /ASSIGN_|PR0\d\d|jsonb|uuid|PRE_TEST|POST_TEST|CAN_|INV-/;
      const semua: KodePenugasan[] = [...KODE_PENUGASAN_DB, "ASSIGN_INPUT_INVALID", "ASSIGN_FAILED"];
      const kunci = [...semua.map(kunciKodePenugasan), "cycle.pemetaan.belum_ada", "cycle.penguasaan.belum_ada"] as const;
      for (const k of kunci) {
        for (const l of LOCALES) {
          let s = "";
          try { s = t(k as Parameters<typeof t>[0], "educator", { locale: l }); } catch { s = ""; }
          c.expect(s.trim() !== "" && s !== k, `${k} has no ${l} telling`);
          c.expect(!MESIN.test(s), `${k} names the machinery in ${l}: ${s.slice(0, 60)}`);
        }
      }

      // the teacher's action calls the one function with its declared arguments
      const aksi = readFileSync(join(root, "src", "app", "mengajar", "actions.ts"), "utf8");
      const panggil = /rpc\("assign_release", \{([\s\S]*?)\}\)/.exec(aksi)?.[1] ?? "";
      const argumen = [...panggil.matchAll(/(p_\w+):/g)].map((m) => m[1]);
      const deklarasi = [...(/create function public\.assign_release\(([^)]*)\)/.exec(sql)?.[1] ?? "").matchAll(/(p_\w+)/g)].map((m) => m[1]);
      c.expect(argumen.length > 0 && JSON.stringify(argumen) === JSON.stringify(deklarasi),
        `sediakanMateri sends ${argumen.join(",")} and assign_release takes ${deklarasi.join(",")}`);
      c.expect(/kodeGalatPenugasan\(error\)/.test(aksi), "a refusal is not read as its code");

      // the review page tells the teacher why
      const siapkan = readFileSync(join(root, "src", "app", "mengajar", "[kelas]", "siapkan", "page.tsx"), "utf8");
      c.expect(/kunciKodePenugasan\(/.test(siapkan) && /kode/.test(siapkan), "the review page does not show a refused code's sentence");

      // neither learner test page can answer 404
      for (const [halaman, kunciBelum] of [["pemetaan", "cycle.pemetaan.belum_ada"], ["penguasaan", "cycle.penguasaan.belum_ada"]]) {
        const src = readFileSync(join(root, "src", "app", "belajar", "[tugas]", halaman, "page.tsx"), "utf8");
        c.expect(!/notFound\s*\(/.test(src), `/belajar/[tugas]/${halaman} can still answer 404`);
        c.expect(src.includes(`messageKey="${kunciBelum}"`), `/belajar/[tugas]/${halaman} does not say its test is not ready`);
      }

      return c.verdict(
        `the ${KODE_PENUGASAN_DB.length} assignment codes assign_refuse knows are the contract's and assign_release raises ` +
        `each; my_cycle_state refuses a stranger as CYCLE_NOT_ASSIGNED; all ${kunci.length} copy keys have a sentence in ` +
        "both languages without machinery words; sediakanMateri in the source file src/app/mengajar/actions.ts calls " +
        "assign_release with exactly its declared arguments and reads a refusal as its code; the review page shows the " +
        "code's sentence; and neither /belajar/[tugas]/pemetaan nor /penguasaan can answer 404");
    },
  },
];
