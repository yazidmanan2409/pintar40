/**
 * BOB-04 — ASSIGNING A LESSON, read from its sources. The behaviour is proved
 * in the database by selftest/db/fable13.sql (F13-*); what this file proves is
 * that the contract, the copy table, the teacher's action and page, and the
 * learner's two test pages agree with the migration.
 */
import { readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";
import { t, LOCALES } from "../src/lib/hle";
import { KODE_PENUGASAN_DB, KODE_AKHIRI_DB, kunciKodePenugasan, kodeGalatPenugasan, type KodePenugasan } from "../src/lib/penugasan-kontrak";

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
  {
    // =======================================================================
    // D185-SINTETIS-01 — STAGING'S TEST CHAPTERS NEVER MEET THE EXPOSURE GUARD (D-185, E-K6-4 option 2).
    // Staging's ten founded test schools are not synthetic, so the F-4(f) guard (D-183) refuses them the exposed
    // chapters. The owner's ruling: their tests use the synthetic replacement chapters instead. This holds that those
    // chapters stay usable: no title and no Pemetaan Awal or Cek penguasaan question of any synthetic package matches
    // a mark in the migration, computed the way exposure_fingerprint() computes it (lowercase, trim, collapse
    // Postgres's \s class, sha256). A positive control proves the comparison finds a mark when one is there.
    // =======================================================================
    id: "D185-SINTETIS-01",
    run: async (ctx) => {
      const c = new Checks();
      const root = ctx.repoRoot;
      const sidik = (x: string) => createHash("sha256")
        .update(x.replace(/^[ \t\n\r\f\v]+|[ \t\n\r\f\v]+$/g, "").replace(/[ \t\n\r\f\v]+/g, " ").toLowerCase(), "utf8").digest("hex");
      const mig = readFileSync(join(root, "supabase", "migrations", "20261228100000_exposed_questions_never_give_a_real_verdict.sql"), "utf8");
      const judul = new Set([...mig.matchAll(/\('TITLE', public\.exposure_fingerprint\('((?:[^']|'')*)'\)\)/g)].map((m) => sidik(m[1].replace(/''/g, "'"))));
      const soal = new Set([...mig.matchAll(/\('STEM', '([0-9a-f]{64})'\)/g)].map((m) => m[1]));
      c.expect(judul.size === 20 && soal.size === 240, `the migration holds ${judul.size} title and ${soal.size} question marks; expected 20 and 240`);
      // positive control: an exposed title, in another case and spacing, is found
      c.expect(judul.has(sidik("  matematika kelas x ·  bab 7: PELUANG ")), "the comparison does not find an exposed title: it would pass vacuously");

      const berkas = [
        ...readdirSync(join(root, "docs", "onboarding", "konten-sintetis")).filter((f) => f.endsWith(".paket.json")).map((f) => join("docs", "onboarding", "konten-sintetis", f)),
        ...readdirSync(join(root, "audit", "fixtures")).filter((f) => f.endsWith(".paket.json")).map((f) => join("audit", "fixtures", f)),
      ];
      let nPaket = 0, nSoal = 0;
      type Butir = { stem?: string; use?: string };
      type Paket = { courses?: { title?: string; modules?: { lessons?: { items?: Butir[] }[] }[] }[] };
      for (const f of berkas) {
        const p = JSON.parse(readFileSync(join(root, f), "utf8")) as Paket;
        for (const k of p.courses ?? []) {
          nPaket++;
          c.expect(!judul.has(sidik(k.title ?? "")), `${f}: «${k.title}» carries an exposed title`);
          for (const m of k.modules ?? []) for (const l of m.lessons ?? []) for (const b of l.items ?? []) {
            if (b.use !== "PRE_TEST" && b.use !== "POST_TEST") continue;
            nSoal++;
            c.expect(!soal.has(sidik(b.stem ?? "")), `${f}: a ${b.use} question carries an exposed fingerprint`);
          }
        }
      }
      c.expect(berkas.some((f) => f.includes("konten-sintetis")) && nSoal > 0, "no synthetic replacement chapter was read");
      return c.verdict(
        `read the 20 title and 240 question marks of migration 20261228100000_exposed_questions_never_give_a_real_verdict.sql and the ` +
        `${berkas.length} packages under docs/onboarding/konten-sintetis and audit/fixtures (${nPaket} course(s), ${nSoal} Pemetaan Awal ` +
        `and Cek penguasaan questions): none carries an exposed title or question fingerprint, so staging's test schools can use them ` +
        `under the F-4(f) guard (D-185); the comparison finds an exposed title in another case and spacing`);
    },
  },
  {
    // =======================================================================
    // W221-K01 — ENDING OR WITHDRAWING AN ASSIGNMENT: ONE CONTRACT FROM THE MIGRATION TO THE CLASS PAGE (owner, 9 Nov).
    // =======================================================================
    id: "W221-K01",
    run: async (ctx) => {
      const c = new Checks();
      const root = ctx.repoRoot;
      const sql = readFileSync(join(root, "supabase", "migrations", "20270113100000_an_assignment_is_ended_or_withdrawn_on_the_record.sql"), "utf8")
        .replace(/--[^\n]*/g, "");
      // the codes penugasan_tolak knows are exactly the contract's, and akhiri_penugasan raises every one of them
      const tolak = /create or replace function public\.penugasan_tolak[\s\S]*?\$\$;/.exec(sql)?.[0] ?? "";
      const dariDb = [...tolak.matchAll(/when '([A-Z_]+)'/g)].map((m) => m[1]).sort();
      c.expect(JSON.stringify(dariDb) === JSON.stringify([...KODE_AKHIRI_DB].sort()),
        `penugasan_tolak knows ${dariDb.join(",")} and the contract names ${KODE_AKHIRI_DB.join(",")}`);
      const akhiri = /create or replace function public\.akhiri_penugasan\(p_la[\s\S]*?end \$\$;/.exec(sql)?.[0] ?? "";
      for (const k of KODE_AKHIRI_DB) c.expect(akhiri.includes(`penugasan_tolak('${k}')`), `akhiri_penugasan never raises ${k}`);
      // each is read by its DETAIL, and a planted unknown stays ASSIGN_FAILED
      for (const k of KODE_AKHIRI_DB) c.expect(kodeGalatPenugasan({ code: "PR050", details: k }) === k, `${k} is not read back as itself`);
      c.expect(kodeGalatPenugasan({ code: "PR050", details: "ASSIGN_PLANTED" }) === "ASSIGN_FAILED", "an unknown DETAIL is read as a known code");
      // every code has a sentence in both languages, and never the machinery
      const MESIN = /ASSIGN_|PR0\d\d|jsonb|uuid|CAN_|INV-/;
      for (const k of KODE_AKHIRI_DB) {
        for (const l of LOCALES) {
          const kunci = kunciKodePenugasan(k as KodePenugasan);
          let x = "";
          try { x = t(kunci, "educator", { locale: l }); } catch { x = ""; }
          c.expect(x.trim() !== "" && x !== kunci, `${kunci} has no ${l} telling`);
          c.expect(!MESIN.test(x), `${kunci} names the machinery in ${l}`);
        }
      }
      // the action passes the four declared arguments and nothing else
      const aksi = readFileSync(join(root, "src", "app", "mengajar", "actions.ts"), "utf8");
      const panggil = /rpc\("akhiri_penugasan", \{([\s\S]*?)\}\)/.exec(aksi)?.[1] ?? "";
      const argumen = [...panggil.matchAll(/(p_\w+):/g)].map((m) => m[1]);
      c.expect(JSON.stringify(argumen) === JSON.stringify(["p_la", "p_jenis", "p_alasan", "p_akhiri_yang_berjalan"]),
        `akhiriPenugasanAction passes ${argumen.join(",")}`);
      // the class page offers it on an assignment in force and opens the panel; the panel names who is still answering and
      // asks for the confirmation, the kind and the reason
      const kelas = readFileSync(join(root, "src", "app", "mengajar", "[kelas]", "page.tsx"), "utf8");
      c.expect(/x\.status === "ACTIVE" \? \(\s*<Link[^>]*\?akhiri=/.test(kelas), "the class page does not offer «Akhiri atau tarik» on an assignment in force");
      c.expect(/<AkhiriPenugasan /.test(kelas), "the class page does not open the panel");
      const panel = readFileSync(join(root, "src", "components", "mengajar", "AkhiriPenugasan.tsx"), "utf8");
      for (const [re, what] of [[/name="akhiri_berjalan"[^>]*required/, "the open sittings' confirmation"],
                                [/name="jenis" value=\{j\}/, "the kind"], // RESTATED (Daisy, TINJAUAN-6faef690): 10 characters, as every other reason
                                [/name="alasan"[^>]*minLength=\{10\} maxLength=\{300\} required/, "the reason (10–300)"],
                                [/pratinjau\.berjalan\.map/, "the open sittings by name"]] as const) {
        c.expect(re.test(panel), `the panel has no ${what}`);
      }
      // the status words: an ended or withdrawn assignment says so, never «Belum disediakan»
      let statusMateri: ((x: { status: string; berakhir: boolean; belumMulai: boolean }) => string) | undefined;
      try { statusMateri = ((await import("../src/lib/pengajar")) as Record<string, unknown>).statusMateri as typeof statusMateri; }
      catch (e) { c.note(`pengajar could not be imported: ${String(e).slice(0, 80)}`); }
      if (c.expect(typeof statusMateri === "function", "statusMateri is not exported by src/lib/pengajar.ts")) {
        c.expect(statusMateri!({ status: "ENDED", berakhir: false, belumMulai: false }) === "mengajar.status.diakhiri", "ENDED is not «Diakhiri»");
        c.expect(statusMateri!({ status: "WITHDRAWN", berakhir: false, belumMulai: false }) === "mengajar.status.ditarik", "WITHDRAWN is not «Ditarik»");
      }
      return c.verdict("akhiri_penugasan's five codes are the contract's, each raised, read by DETAIL and told in both languages without machinery; the action passes the four declared arguments; the class page offers «Akhiri atau tarik» on an assignment in force and its panel names who is still answering, requires the confirmation, the kind and a 5–300 reason; ENDED reads «Diakhiri» and WITHDRAWN «Ditarik»");
    },
  },
];
