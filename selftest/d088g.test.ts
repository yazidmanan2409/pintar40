/**
 * D-088(g) (Yazid, 2 Oct) -- A TOPIC IS NAMED BY ITS OBJECTIVE, AND TWO
 * OBJECTIVES ARE NEVER AVERAGED AS ONE.
 *
 * «Penguasaan per bagian» and the school's competency outcomes grouped the
 * recorded per-objective mastery by objective CODE, which repeats across
 * chapters, and showed the code. Catalogue MC-4 (supabase/migrations/
 * 20261031100000) groups by the session's own objective -- the objective with
 * that code in the lessons of the session's assessment's chapter -- and returns
 * its statement; the teacher's page and the reports draw one row per objective.
 *
 *   D088G-S01  db: in one rolled-back transaction, one class of the bootstrap
 *              school sits two published canonical chapters whose objectives
 *              share the code KN5-B1 (five learners all right on one, five
 *              none right on the other); the class figure has two rows, each
 *              with its own objective, statement and mean -- not one «KN5-B1»
 *              at 50% over ten
 *   D088G-K01  static: the teacher's «Lihat bukti» reads the rows and names
 *              each by its statement; the migration declares the three content
 *              sources and the guard names the content family
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";

const buang = (x: string) => x.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");

/** The database half, rolled back. Each snapshot is one `KEY<TAB>json` line. */
const SKRIP = `
begin;
create temp table d088g_snap (k text, v jsonb) on commit drop;
grant all on d088g_snap to authenticated;
do $d088g$
declare f record; v_tpl uuid; v_cls uuid; i int; v_p uuid; v_e uuid; v_s uuid; v jsonb; r record;
        v_rel uuid[]; v_def uuid[]; v_obj uuid[]; k int; v_cat text;
begin
  perform selftest.as_owner();
  select * into f from selftest.boot_fixture();
  v_tpl := selftest.boot_attempt(true);
  -- two published chapters of the canonical library, each with ITS OWN objective coded KN5-B1
  for r in select rl.id rel, ad.id def, o.id obj
             from public.plp_releases rl join public.courses co on co.id = rl.course_id
             join public.institutions ci on ci.id = co.institution_id and ci.tenant_kind = 'PLATFORM_CANONICAL'
             join public.modules m on m.course_id = co.id
             join public.assessment_definitions ad on ad.module_id = m.id and ad.mode = 'POST_TEST'
             join public.lessons l on l.module_id = m.id
             join public.learning_objectives o on o.lesson_id = l.id and o.code = 'KN5-B1'
            where rl.status = 'PUBLISHED' order by rl.created_at, rl.id limit 2 loop
    v_rel := v_rel || r.rel; v_def := v_def || r.def; v_obj := v_obj || r.obj;
    if not public.release_is_distributed_to(r.rel, f.inst) then
      perform selftest.as_user('kanonik-admin@pintar.test');
      perform public.grant_release_distribution(r.rel, f.inst, 'D088G');
      perform selftest.as_owner();
    end if;
  end loop;
  if coalesce(array_length(v_rel, 1), 0) < 2 then raise exception 'the canonical library has fewer than two published chapters with KN5-B1'; end if;

  -- a class of its own: five learners sat chapter one (all right on KN5-B1), five sat chapter two (none right)
  insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
  select f.inst, n.parent_id, 'CLASS', 'Kelas D088G', n.academic_period_id from public.org_nodes n
   where n.institution_id = f.inst and n.kind = 'CLASS' and n.name = '5B'
  returning id into v_cls;
  for i in 1..10 loop
    k := case when i <= 5 then 1 else 2 end;
    v_s := gen_random_uuid();
    insert into public.persons (display_name) values ('Murid D088G ' || i) returning id into v_p;
    insert into public.enrollments (person_id, institution_id, academic_period_id, programme_id, status)
    select v_p, x.institution_id, x.academic_period_id, e.programme_id, 'ACTIVE'
      from public.assessment_sessions x join public.enrollments e on e.id = x.enrollment_id where x.id = v_tpl
    returning id into v_e;
    insert into public.memberships (enrollment_id, node_id, academic_period_id)
    select v_e, v_cls, x.academic_period_id from public.assessment_sessions x where x.id = v_tpl;
    insert into public.assessment_sessions
      (id, person_id, institution_id, enrollment_id, academic_period_id, class_node_id, cohort_node_id,
       plp_release_id, assessment_definition_id, assessment_definition_version, engine_version,
       scoring_policy_version, evidence_channel, evidence_class, mode, status, shuffle_seed,
       started_at, submitted_at, finalized_at, deadline_extended_count)
    select v_s, v_p, x.institution_id, v_e, x.academic_period_id, v_cls, x.cohort_node_id,
           v_rel[k], v_def[k], (select ad.version from public.assessment_definitions ad where ad.id = v_def[k]), x.engine_version,
           x.scoring_policy_version, x.evidence_channel, x.evidence_class, x.mode, 'CREATED', x.shuffle_seed,
           x.started_at, x.submitted_at, x.finalized_at, 0
      from public.assessment_sessions x where x.id = v_tpl;
    update public.assessment_sessions set status = 'IN_PROGRESS' where id = v_s;
    update public.assessment_sessions set status = 'SUBMITTED' where id = v_s;
    update public.assessment_sessions set status = 'FINALIZED' where id = v_s;
    insert into public.assessment_results
      (id, session_id, institution_id, person_id, evidence_class, engine_version, scoring_policy_version,
       mastery, per_domain, safety_gate_passed, delta_inputs, computed_at)
    select gen_random_uuid(), v_s, r2.institution_id, v_p, r2.evidence_class, r2.engine_version, r2.scoring_policy_version,
           r2.mastery,
           jsonb_build_object('KN5-B1', jsonb_build_object('benar', case when k = 1 then 2 else 0 end, 'total', 2,
                                                           'penguasaan', case when k = 1 then 1.0 else 0.0 end)),
           r2.safety_gate_passed, r2.delta_inputs, now()
      from public.assessment_results r2 where r2.session_id = v_tpl limit 1;
  end loop;

  -- the teacher's «Penguasaan per bagian», asked as the head of department over the class
  perform selftest.as_user('boot-kaprodi@bootstrap.pintar.test');
  v := public.metric_evaluate('class.topic_mastery', v_cls, f.inst, null);
  perform selftest.as_owner();
  v_cat := public.current_metric_catalogue();
  insert into d088g_snap values ('KELAS', jsonb_build_object('hasil', v, 'katalog', v_cat, 'objektif', to_jsonb(v_obj),
    'pernyataan', (select jsonb_agg(o.statement order by array_position(v_obj, o.id)) from public.learning_objectives o where o.id = any (v_obj))));
end $d088g$;
select k || chr(9) || v::text from d088g_snap order by k;
rollback;
`;

export const d088gTests: SelfTest[] = [
  {
    id: "D088G-S01",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const db = process.env.SUPABASE_DB_URL!;
      for (const f of ["fable01", "fable02", "fable03", "fable04"]) {
        spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-q", "-1", "-f", join(repoRoot, "selftest", "db", `${f}.sql`), db], { encoding: "utf8" });
      }
      const r = spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-At", "-c", SKRIP, db], { encoding: "utf8" });
      const pesan = (r.stderr || "").trim().split("\n").find((l) => /ERROR/.test(l)) ?? (r.stderr || "").trim().split("\n").pop();
      if (!c.expect(r.status === 0, `the two chapters could not be sat: ${pesan}`)) return c.verdict("");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the database's own JSON
      const snap: Record<string, any> = {};
      for (const l of r.stdout.split("\n")) {
        const [k, v] = l.split("\t");
        if (k && v) snap[k] = JSON.parse(v);
      }
      const kelas = snap.KELAS;
      if (!c.expect(!!kelas, "the database half returned no snapshot")) return c.verdict("");
      const h = kelas.hasil;
      c.expect(kelas.katalog === "MC-4" && h?.catalogue_version === "MC-4", `the live catalogue is ${kelas.katalog}; expected MC-4`);
      c.expect(h?.status === "ok", `the class's per-topic mastery did not show for ten learners: ${JSON.stringify(h)}`);
      const baris = (Array.isArray(h?.value) ? h.value : []) as Array<{ objective_id: string | null; code: string; competency: string; mean_score: number; learners: number }>;
      const [o1, o2] = kelas.objektif as string[];
      const [p1] = kelas.pernyataan as string[];
      const satu = baris.find((b) => b.objective_id === o1), dua = baris.find((b) => b.objective_id === o2);
      c.expect(baris.length === 2 && !!satu && !!dua,
        `the class figure is ${JSON.stringify(h?.value)}; expected two rows, one per chapter's own KN5-B1 objective, never one merged «KN5-B1»`);
      c.expect(satu?.mean_score === 1 && satu?.learners === 5 && dua?.mean_score === 0 && dua?.learners === 5,
        `the rows read ${JSON.stringify(baris)}; expected chapter one 100% over five and chapter two 0% over five, each on its own`);
      c.expect(baris.every((b) => b.code === "KN5-B1" && b.competency === p1),
        `the rows are named ${JSON.stringify(baris.map((b) => b.competency))}; expected each objective's statement («${p1}»), not its code`);
      return c.verdict(
        "executed in the database, rolled back (catalogue MC-4, supabase/migrations/20261031100000): one class of the " +
          "bootstrap school sat two published canonical chapters whose objectives share the code KN5-B1; the teacher's " +
          "«Penguasaan per bagian» (metric_evaluate class.topic_mastery, as the head of department over the class) answers " +
          "two rows, chapter one 100% over five and chapter two 0% over five, each with its own objective and named by the " +
          "objective's statement -- where MC-3 answered one «KN5-B1» at 50% over ten",
      );
    },
  },
  {
    id: "D088G-K01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const hal = buang(readFileSync(join(repoRoot, "src", "app", "mengajar", "[kelas]", "bukti", "page.tsx"), "utf8"));
      c.expect(/Array\.isArray\(topik\.value\)/.test(hal) && /label=\{b\.competency\}/.test(hal) && /key=\{b\.objective_id \?\? b\.code\}/.test(hal),
        "«Lihat bukti» does not draw one row per objective named by its statement");
      c.expect(!/Object\.entries\(topik\.value/.test(hal), "«Lihat bukti» still reads the topics as a code-keyed object");
      const mig = readFileSync(join(repoRoot, "supabase", "migrations", "20261031100000_a_topic_is_named_by_its_objective.sql"), "utf8");
      for (const src of ["assessment_definitions", "lessons", "learning_objectives"]) {
        c.expect(new RegExp(`\\('MC-4', '${src}'`).test(mig), `MC-4 does not declare ${src} as a source`);
      }
      c.expect(/'competency', d\.statement/.test(mig) && /group by t\.objective_id/.test(mig),
        "the calculators do not group by the objective and name it by its statement");
      c.expect(/THE CONTENT FAMILY/.test(mig) && /'assessment_definitions', 'lessons', 'learning_objectives'\);/.test(mig)
        && /a content-family relation carries a learner/.test(mig),
        "the source guard does not name the content family, or does not check it holds no learner");
      return c.verdict(
        "reads the source of «Lihat bukti» (src/app/mengajar/[kelas]/bukti/page.tsx): one row per objective, keyed by the " +
          "objective and labelled by its statement, no code-keyed object; reads supabase/migrations/20261031100000: MC-4 " +
          "declares assessment_definitions, lessons and learning_objectives, both calculators group by the objective and " +
          "return its statement, and the academic source guard names the content family and fails if it ever holds a learner",
      );
    },
  },
];
