/**
 * M6 (D-085) -- A TEACHER SEES PINTAR'S STANDARD MATERIAL BESIDE THE SCHOOL'S OWN, ITS ORIGIN SAID.
 *
 * "Teachers preparing learning must be able to see and assign both applicable
 * PINTAR standard content and their school's own published content, with origin
 * made clear." assign_release already gave a distributed canonical release to a
 * class (release_is_distributed_to), but «Siapkan materi» listed only the
 * school's own releases, and a teacher's own row security reads none of a
 * canonical course's modules or tests, so its review step would have shown a
 * PINTAR chapter as empty. Migration 20261103100000 adds
 * distributed_release_instruments (the cycle's tests, behind the distribution
 * gate); the page lists distributed releases labelled «Materi PINTAR».
 *
 *   M6-S01  db, rolled back: PINTAR distributes a chapter to the bootstrap school;
 *           its teacher reads none of the course's modules or tests through row
 *           security, yet distributed_releases lists it ACTIVE, pintarDariDistribusi
 *           offers it as «Materi PINTAR», the outline gives its lesson and the new
 *           read gives exactly the tests assign_release would use (title, size,
 *           attempts); another school's teacher, the school's learner and, after
 *           withdrawal, the teacher too read nothing; assigning it is answered as a
 *           school's own chapter is (no Pemetaan Awal: ASSIGN_PRE_TEST_MISSING)
 *   M6-K01  executes pintarDariDistribusi (this school, ACTIVE, published, newest of
 *           its line, once); reads the source of terbitan(), the PINTAR readers and
 *           «Siapkan materi»; the origin copy in id and en
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { t } from "../src/lib/hle";
import { Checks, type SelfTest } from "./lib";

const buang = (x: string) => x.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");

/** The database half, rolled back. Each snapshot is one `KEY<TAB>json` line. */
const SKRIP = `
begin;
create temp table m6_snap (k text, v jsonb) on commit drop;
grant all on m6_snap to authenticated;
do $m6$
declare f record; p record; v_dist uuid; v_node uuid; v jsonb := '{}'::jsonb; d public.assessment_definitions;
begin
  perform selftest.as_owner();
  select * into f from selftest.boot_fixture();
  select la.node_id into v_node from public.learning_assignments la where la.id = f.la;
  select * into p from selftest.canonical_package('M6 ' || substr(md5(random()::text), 1, 6));
  perform selftest.as_user('kanonik-admin@pintar.test');
  v_dist := public.grant_release_distribution(p.rel, f.inst, 'M6');
  perform selftest.as_user('boot-admin@bootstrap.pintar.test');
  perform public.set_school_pass_mark(f.inst, p.course, 60, 'M6: batas sekolah');

  -- the school's teacher
  perform selftest.as_user('boot-guru@bootstrap.pintar.test');
  v := v || jsonb_build_object(
    'rls_modul', (select count(*) from public.modules m where m.course_id = p.course),
    'rls_def', (select count(*) from public.assessment_definitions x where x.course_id = p.course or x.module_id = p.modul),
    'dist', (select coalesce(jsonb_agg(to_jsonb(r)), '[]'::jsonb) from public.distributed_releases() r where r.plp_release_id = p.rel),
    'instr', (select coalesce(jsonb_agg(to_jsonb(i)), '[]'::jsonb) from public.distributed_release_instruments(p.rel) i),
    'pelajaran', (select count(distinct o.lesson_id) from public.distributed_release_outline(p.rel) o),
    'beri', selftest.f13_code(format('select public.assign_release(%L, %L, now(), null)', p.rel, v_node)));
  perform selftest.as_owner();
  d := public.release_cycle_definition(p.rel, 'POST_TEST');
  v := v || jsonb_build_object('inst', f.inst, 'rel', p.rel,
    'harap', jsonb_build_object('mode', 'POST_TEST', 'title', d.title, 'item_count', d.item_count, 'attempt_limit', d.attempt_limit),
    'ada_pre', (public.release_cycle_definition(p.rel, 'PRE_TEST')).id is not null,
    'kursus', (select c.title from public.courses c where c.id = p.course));

  -- another school's teacher, and the school's own learner
  perform selftest.as_user('siklus-guru@synthetic.pintar.test');
  v := v || jsonb_build_object('lain_instr', (select count(*) from public.distributed_release_instruments(p.rel)),
    'lain_garis', (select count(*) from public.distributed_release_outline(p.rel)));
  perform selftest.as_user('boot-siswa@bootstrap.pintar.test');
  v := v || jsonb_build_object('siswa_instr', (select count(*) from public.distributed_release_instruments(p.rel)));

  -- withdrawn, it is no longer the school's to see
  perform selftest.as_user('kanonik-admin@pintar.test');
  perform public.withdraw_release_distribution(v_dist, 'M6: ditarik');
  perform selftest.as_user('boot-guru@bootstrap.pintar.test');
  v := v || jsonb_build_object('tarik_instr', (select count(*) from public.distributed_release_instruments(p.rel)));
  perform selftest.as_owner();
  v := v || jsonb_build_object(
    'hasil', pg_get_function_result('public.distributed_release_instruments(uuid)'::regprocedure),
    'anon', has_function_privilege('anon', 'public.distributed_release_instruments(uuid)', 'execute'));
  insert into m6_snap values ('M6', v);
end $m6$;
select k || chr(9) || v::text from m6_snap order by k;
rollback;
`;

export const m6Tests: SelfTest[] = [
  {
    id: "M6-S01",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const db = process.env.SUPABASE_DB_URL!;
      for (const f of ["fable01", "fable02", "fable03", "fable04", "fable05", "fable11", "fable13"]) {
        spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-q", "-1", "-f", join(repoRoot, "selftest", "db", `${f}.sql`), db], { encoding: "utf8" });
      }
      const r = spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-At", "-c", SKRIP, db], { encoding: "utf8" });
      const pesan = (r.stderr || "").trim().split("\n").find((l) => /ERROR/.test(l)) ?? (r.stderr || "").trim().split("\n").pop();
      if (!c.expect(r.status === 0, `the scenario could not run: ${pesan}`)) return c.verdict("");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the database's own JSON
      let m: Record<string, any> | null = null;
      for (const l of r.stdout.split("\n")) {
        const [k, v] = l.split("\t");
        if (k === "M6" && v) m = JSON.parse(v);
      }
      if (!c.expect(!!m, "the database half returned no snapshot") || !m) return c.verdict("");

      // the gap: row security gives the teacher nothing of a canonical course
      c.expect(Number(m.rls_modul) === 0 && Number(m.rls_def) === 0,
        `the teacher read ${m.rls_modul} modules and ${m.rls_def} tests of the PINTAR course directly; expected none (the gate is the only door)`);
      // offered, its origin said
      const { pintarDariDistribusi } = await import("../src/lib/pengajar");
      const tawar = pintarDariDistribusi(m.dist, m.inst);
      c.expect(tawar.length === 1 && tawar[0].id === m.rel && tawar[0].asal === "PINTAR" && tawar[0].kursus === m.kursus,
        `what the school's distribution offers the teacher reads ${JSON.stringify(tawar)}; expected the chapter once, as «Materi PINTAR»`);
      // what it holds: its lesson, and exactly the tests assign_release would use
      c.expect(Number(m.pelajaran) === 1, `the PINTAR chapter shows ${m.pelajaran} lessons; expected its one`);
      c.expect(m.ada_pre === false && m.instr.length === 1
        && JSON.stringify(m.instr[0]) === JSON.stringify(m.harap),
        `the PINTAR chapter's tests read ${JSON.stringify(m.instr)}; expected exactly release_cycle_definition's ${JSON.stringify(m.harap)} and no Pemetaan Awal`);
      c.expect(m.beri === "ASSIGN_PRE_TEST_MISSING",
        `giving the PINTAR chapter with no Pemetaan Awal was answered ${m.beri}; expected the school chapter's own refusal ASSIGN_PRE_TEST_MISSING`);
      // nobody else
      c.expect(Number(m.lain_instr) === 0 && Number(m.lain_garis) === 0,
        `another school's teacher read ${m.lain_instr} tests and ${m.lain_garis} outline rows; expected none`);
      c.expect(Number(m.siswa_instr) === 0, `the school's learner read ${m.siswa_instr} tests; expected none`);
      c.expect(Number(m.tarik_instr) === 0, `after withdrawal the teacher still read ${m.tarik_instr} tests; expected none`);
      c.expect(m.anon === false, "anon may call the instruments read");
      c.expect(!/stem|option|correct|rationale|item_id|body/i.test(String(m.hasil)),
        `the instruments read returns ${m.hasil}; it must carry no item content`);
      return c.verdict(
        "executed in the database, rolled back (supabase/migrations/20261103100000): PINTAR distributes a chapter to the " +
          "bootstrap school; its teacher reads none of the course's modules or tests through row security, yet " +
          "distributed_releases lists it and pintarDariDistribusi offers it once as «Materi PINTAR»; the outline gives its " +
          "lesson and distributed_release_instruments exactly release_cycle_definition's test (title, size, attempts), no " +
          "Pemetaan Awal; giving it is refused ASSIGN_PRE_TEST_MISSING as a school chapter is; another school's teacher, the " +
          "learner and, after withdrawal, the teacher read nothing; anon cannot call it; it returns no item content",
      );
    },
  },
  {
    id: "M6-K01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const { pintarDariDistribusi } = await import("../src/lib/pengajar");
      const baris = (o: Partial<Parameters<typeof pintarDariDistribusi>[0][number]>) => ({
        plp_release_id: "r", version_label: "1.0.0", published_at: "2026-09-01T00:00:00Z", course_id: "c",
        course_title: "Bab", consuming_institution_id: "A", distribution_status: "ACTIVE", supersedes_release_id: null, ...o,
      });
      const out = pintarDariDistribusi([
        baris({ plp_release_id: "lama", course_title: "Bab 1", published_at: "2026-08-01T00:00:00Z" }),
        baris({ plp_release_id: "baru", course_title: "Bab 1", published_at: "2026-09-10T00:00:00Z", supersedes_release_id: "lama" }),
        baris({ plp_release_id: "baru", course_title: "Bab 1", published_at: "2026-09-10T00:00:00Z", supersedes_release_id: "lama" }),
        baris({ plp_release_id: "dua", course_title: "Bab 2", published_at: "2026-09-05T00:00:00Z" }),
        baris({ plp_release_id: "tarik", distribution_status: "WITHDRAWN" }),
        baris({ plp_release_id: "belum", published_at: null }),
        baris({ plp_release_id: "lain", consuming_institution_id: "B" }),
      ], "A");
      c.expect(JSON.stringify(out.map((x) => [x.id, x.asal])) === JSON.stringify([["baru", "PINTAR"], ["dua", "PINTAR"]]),
        `the PINTAR releases offered read ${JSON.stringify(out.map((x) => x.id))}; expected the corrected Bab 1 once and Bab 2, newest first, ` +
          "never a withdrawn, unpublished, superseded or another school's");

      const ajar = buang(readFileSync(join(repoRoot, "src", "lib", "pengajar.ts"), "utf8"));
      c.expect(/rpc\("distributed_releases"\)/.test(ajar) && /pintarDariDistribusi\(rows<Distribusi>\(dist\), institusi\)/.test(ajar),
        "terbitan() does not add the releases PINTAR distributed to the school");
      c.expect(/asal === "PINTAR"\) return isiPintar\(t\.id\)/.test(ajar) && /asal === "PINTAR"\) return instrumenPintar\(t\.id\)/.test(ajar)
        && /rpc\("distributed_release_instruments"/.test(ajar) && /rpc\("distributed_release_outline"/.test(ajar),
        "a PINTAR chapter's lessons and tests are not read through the distribution gate");
      const siap = buang(readFileSync(join(repoRoot, "src", "app", "mengajar", "[kelas]", "siapkan", "page.tsx"), "utf8"));
      c.expect((siap.match(/className="pin-asal" data-asal=\{(r|dipilih)\.asal\}/g) ?? []).length === 2
        && /ajar\.isiTerbitan\(dipilih\)/.test(siap) && /ajar\.instrumen\(dipilih\)/.test(siap),
        "«Siapkan materi» does not say each release's origin in the list and the review, or reads a PINTAR chapter by course");
      for (const locale of ["id", "en"] as const) {
        for (const k of ["mengajar.siap.asal.pintar", "mengajar.siap.asal.sekolah"] as const) {
          const kal = t(k, "educator", { locale });
          c.expect(kal.length > 3 && kal !== k, `(${locale}) ${k} has no text`);
        }
      }
      c.expect(t("mengajar.siap.asal.pintar", "educator", { locale: "id" }) === "Materi PINTAR"
        && t("mengajar.siap.asal.sekolah", "educator", { locale: "id" }) === "Materi sekolah",
        "the origin is not said as «Materi PINTAR» / «Materi sekolah»");
      return c.verdict(
        "executes pintarDariDistribusi (src/lib/pengajar.ts): only this school's ACTIVE, published distributions, the newest " +
          "of a corrected line, each once, newest first, labelled PINTAR. Reads the source: terbitan() adds them to the " +
          "school's own; a PINTAR chapter's lessons and tests come from distributed_release_outline and " +
          "distributed_release_instruments; «Siapkan materi» says the origin in the list and the review; the copy in id and en",
      );
    },
  },
];
