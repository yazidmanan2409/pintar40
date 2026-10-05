/**
 * C-12'S FINDING (D-069(b)): A PROFESSIONAL-LEARNING ANSWER STAYS THE PARTICIPANT'S OWN.
 *
 * C-12's machine proof (audit run 37353180694, C12f) found the facilitator of a professional-learning Kelas reading
 * the participant's individual answers on «Lihat per soal»: teacher_question_evidence is SECURITY DEFINER, authorizes
 * "an active EDUCATOR over the class", and the facilitator holds EDUCATOR there. D-069(b): "not individual answers".
 *
 *  C12-S01  the source: migration 20261124100000 re-emits teacher_question_evidence with one rule added (an academic
 *           place only, fail closed) and D-088(k)'s own (the teacher check, handed-in only, the class binding, nothing
 *           that is not teaching evidence); the page still reads the class's evidence through that function alone
 *  C12-D01  the database, rolled back: in a professional-learning Kelas with the Guru's finished Uji Penguasaan and
 *           its answer, the facilitator is refused (42501) and given no name and no option, as is another Guru and the
 *           participant himself; in the academic Kelas the class's teacher still reads the class question by question
 *           and learner by learner, exactly as before
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";

const MIGRASI = "supabase/migrations/20261124100000_a_professional_learning_answer_stays_the_participants_own.sql";
const tanpaKomentarSql = (s: string) => s.replace(/--[^\n]*/g, "");

// ═══════════════════════════════════════════════════════════════ the database half
// One transaction, rolled back, in the demonstration tenant's WP2 school (selftest.wp2_school), built as BOB-43's
// suite builds its professional-learning place. Written to run on the schema before the fix too, where it shows the
// disclosure itself.
export const DB_SKRIP = `
begin;
create temp table c12 (v jsonb) on commit drop;
grant all on c12 to authenticated;
-- the function's answer to this reader: a refusal's state, or what it gave (sittings, names, chosen options)
create function pg_temp.soal(p_uid uuid, p_aa uuid, p_kelas uuid) returns jsonb language plpgsql as $f$
declare j jsonb; v_state text;
begin
  perform selftest.as_user_uid(p_uid);
  j := public.teacher_question_evidence(p_aa, p_kelas);
  perform selftest.as_owner();
  return jsonb_build_object('hasil', 'OK', 'duduk', j -> 'sittings',
    'nama', (select coalesce(jsonb_agg(l ->> 'name' order by l ->> 'name'), '[]'::jsonb) from jsonb_array_elements(j -> 'learners') l),
    'pilihan', (select count(*) from jsonb_array_elements(j -> 'learners') l, jsonb_array_elements(l -> 'answers') a
                 where a ->> 'chosen' is not null),
    'soal', jsonb_array_length(coalesce(j -> 'questions', '[]'::jsonb)));
exception when others then
  get stacked diagnostics v_state = returned_sqlstate;
  perform selftest.as_owner();
  return jsonb_build_object('hasil', 'E:' || v_state);
end $f$;
do $c12$
declare v jsonb := '{}'::jsonb; c record; v_period uuid; v_tmpl uuid; v_item uuid; v_lbl text; ak_rel uuid; ak_def uuid;
        fas_u uuid; fas uuid; lain_u uuid; lain uuid; pdb uuid; pdp uuid; pdt uuid; pdk uuid;
        pd_course uuid; pd_rel uuid; pd_la uuid; pd_def uuid; pd_aa uuid; ps uuid; ak_aa uuid; as_ uuid; t text;
begin
  perform selftest.as_owner();
  select * into c from selftest.wp2_school();
  select n0.academic_period_id into v_period from public.org_nodes n0 where n0.id = c.cls_a;
  select s.id into v_tmpl from public.assessment_sessions s
   where s.institution_id = c.inst and s.status = 'FINALIZED' and s.mode = 'POST_TEST'
     and exists (select 1 from public.assessment_results r where r.session_id = s.id)
     and exists (select 1 from public.presented_items p where p.session_id = s.id) order by s.id limit 1;
  select p.item_id into v_item from public.presented_items p where p.session_id = v_tmpl order by p.position limit 1;
  select o.label into v_lbl from public.item_options o where o.item_id = v_item order by o.label limit 1;
  select s.plp_release_id, s.assessment_definition_id into ak_rel, ak_def from public.assessment_sessions s where s.id = v_tmpl;

  -- the people: the PD Kelas's facilitator and another Guru (Kelas B); the participant is the school's Guru (c.edu)
  fas_u := selftest.f06p10_person('c12-fasilitator'); lain_u := selftest.f06p10_person('c12-guru-lain');
  select a.person_id into fas from public.accounts a where a.auth_user_id = fas_u;
  select a.person_id into lain from public.accounts a where a.auth_user_id = lain_u;

  -- the place, under the WP2 faculty, as BOB-43 makes it
  insert into public.org_nodes (institution_id, parent_id, kind, name, learning_context)
  values (c.inst, c.fac, 'DEPARTMENT', 'Pengembangan Guru C12', 'PROFESSIONAL_DEVELOPMENT') returning id into pdb;
  insert into public.org_nodes (institution_id, parent_id, kind, name) values (c.inst, pdb, 'PROGRAMME', 'Reguler') returning id into pdp;
  insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
  values (c.inst, pdp, 'COHORT', 'Guru C12', v_period) returning id into pdt;
  insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
  values (c.inst, pdt, 'CLASS', 'Kelas Guru C12', v_period) returning id into pdk;
  perform set_config('app.seed_intent', 'synthetic', true);
  insert into public.role_assignments (person_id, role, scope_node_id, valid_until) values
    (fas, 'EDUCATOR', pdk, now() + interval '1 year'),
    (lain, 'EDUCATOR', c.cls_b, now() + interval '1 year');
  perform set_config('app.seed_intent', '', true);

  -- the material: a PD course and release, given to the PD Kelas with its Uji Penguasaan
  insert into public.courses (institution_id, subject, stage, grade_label, title, learning_context)
  values (c.inst, 'Pengembangan', 'Guru', '-', 'Praktik C12', 'PROFESSIONAL_DEVELOPMENT') returning id into pd_course;
  insert into public.plp_releases (institution_id, course_id, version_label) values (c.inst, pd_course, '1.0.0') returning id into pd_rel;
  perform selftest.pass_mark(c.inst, pd_course);
  insert into public.learning_assignments (institution_id, plp_release_id, course_id, node_id, academic_period_id)
  values (c.inst, pd_rel, pd_course, pdk, v_period) returning id into pd_la;
  perform selftest.as_user_uid(c.adm_u);
  perform selftest.as_release_writer();
  update public.learning_assignments set status = 'ACTIVE' where id = pd_la;
  perform selftest.as_owner();
  select f.def into pd_def from selftest.wp6_definition_for(v_tmpl, pd_rel) f;
  insert into public.assessment_assignments (institution_id, assessment_definition_id, learning_assignment_id, node_id, academic_period_id)
  values (c.inst, pd_def, pd_la, pdk, v_period) returning id into pd_aa;

  -- the Guru enrolled as a participant (C1) and his finished Uji Penguasaan with its answer
  perform selftest.as_user_uid(c.adm_u);
  perform public.enrol_for_professional_learning(c.edu, pdk);
  perform selftest.as_owner();
  ps := selftest.wp6_evidence_session(v_tmpl, c.edu, pdk, pd_rel, pd_aa);
  perform selftest.wp6_answer(ps, v_item, c.inst, v_lbl, 1::smallint);
  select display_name into t from public.persons where id = c.edu;
  v := v || jsonb_build_object('dunia', (select status from public.assessment_sessions where id = ps) = 'FINALIZED', 'peserta', t);

  -- «Lihat per soal» in the PD Kelas, asked by each reader
  v := v || jsonb_build_object(
    'fasilitator', pg_temp.soal(fas_u, pd_aa, pdk),
    'guru_lain', pg_temp.soal(lain_u, pd_aa, pdk),
    'peserta_sendiri', pg_temp.soal(c.edu_u, pd_aa, pdk));

  -- the academic Kelas, unchanged: the class's teacher reads a learner's handed-in sitting question by question
  insert into public.assessment_assignments (institution_id, assessment_definition_id, node_id, academic_period_id)
  values (c.inst, ak_def, c.cls_a, v_period) returning id into ak_aa;
  as_ := selftest.wp6_evidence_session(v_tmpl, c.la, c.cls_a, null, ak_aa);
  perform selftest.wp6_answer(as_, v_item, c.inst, v_lbl, 1::smallint);
  select display_name into t from public.persons where id = c.la;
  v := v || jsonb_build_object('murid', t, 'akademik', pg_temp.soal(c.edu_u, ak_aa, c.cls_a),
    'akademik_guru_lain', pg_temp.soal(lain_u, ak_aa, c.cls_a));
  insert into c12 values (v);
end $c12$;
select v::text from c12;
rollback;
`;

export const c12Tests: SelfTest[] = [
  {
    id: "C12-S01",
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const baca = (f: string) => readFileSync(join(repoRoot, f), "utf8");
      let mig = "";
      try { mig = tanpaKomentarSql(baca(MIGRASI)); } catch { /* absent: the checks below say so */ }
      const i = mig.search(/function public\.teacher_question_evidence\(p_assignment uuid, p_class uuid\)/);
      const fungsi = i < 0 ? "" : mig.slice(i, mig.indexOf("$$;", i));
      c.expect(/if not exists \(select 1 from public\.org_nodes n where n\.id = p_class and n\.learning_context = 'ACADEMIC'\) then\s+raise exception using errcode = '42501'/.test(fungsi),
        "teacher_question_evidence does not refuse a place that is not academic (fail closed)");
      // D-088(k)'s own rules, kept: the teacher check by the role itself, the class binding, handed-in sittings only
      c.expect(/ra\.role = 'EDUCATOR'/.test(fungsi) && !/has_scope\(/.test(fungsi) && /aa\.node_id <> p_class/.test(fungsi)
        && /s\.status in \('SUBMITTED', 'FINALIZED'\)/.test(fungsi),
        "teacher_question_evidence lost D-088(k)'s teacher check, class binding or handed-in-only rule");
      c.expect(!/(telemetry|hesitation|assistance|integrity|anomal|duration|started_at|submitted_at|question_health)/i.test(fungsi),
        "teacher_question_evidence reads something that is not teaching evidence");
      const urut = fungsi.indexOf("ra.role = 'EDUCATOR'") < fungsi.indexOf("n.learning_context = 'ACADEMIC'")
        && fungsi.indexOf("n.learning_context = 'ACADEMIC'") < fungsi.indexOf("with sit as");
      c.expect(urut, "the academic-place rule does not stand between the teacher check and the first read");
      c.expect(/revoke all on function public\.teacher_question_evidence\(uuid, uuid\) from public, anon;/.test(mig)
        && /grant execute on function public\.teacher_question_evidence\(uuid, uuid\) to authenticated;/.test(mig),
        "the migration does not keep the function's grants (revoked from PUBLIC and anon, executable by a signed-in caller; ADR-0021)");
      const hal = baca("src/app/mengajar/[kelas]/soal/page.tsx");
      const lib = baca("src/lib/soal-kelas.ts");
      c.expect(/buktiSoal\(/.test(hal) && /HalamanPenolakan/.test(hal) && /rpc\("teacher_question_evidence"/.test(lib) && /if \(error \|\| !data\) return null;/.test(lib),
        "«Lihat per soal» no longer reads through teacher_question_evidence alone, or no longer shows the refusal page when refused");
      return c.verdict("the source: migration 20261124100000 re-emits teacher_question_evidence with one rule added, an academic place only " +
        "(fail closed, 42501, between the teacher check and the first read), and keeps D-088(k)'s teacher check, class binding, handed-in-only " +
        "rule and its teaching-evidence-only reads, with its grants as they were (ADR-0021); «Lihat per soal» reads through that function alone and shows the refusal page when refused");
    },
  },
  {
    id: "C12-D01",
    requires: ["db"],
    run: async () => {
      const c = new Checks();
      const r = spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-At", "-c", DB_SKRIP, process.env.SUPABASE_DB_URL!], { encoding: "utf8", maxBuffer: 1 << 24 });
      const baris = (r.stdout || "").trim().split("\n").filter((l) => l.startsWith("{"));
      if (!c.expect(r.status === 0 && baris.length > 0, `the database half could not run: ${(r.stderr || "").trim().split("\n").slice(-3).join(" | ")}`)) return c.verdict("");
      const v: Record<string, any> = JSON.parse(baris.at(-1)!);
      c.expect(v.dunia === true, "the Guru's finished Uji Penguasaan in the professional-learning Kelas could not be made");
      const tolak = (x: any) => x?.hasil === "E:42501";
      c.expect(tolak(v.fasilitator),
        `the facilitator of the professional-learning Kelas, at «Lihat per soal»: ${JSON.stringify(v.fasilitator)} (expected the refusal, 42501; ` +
        `D-069(b): not individual answers)`);
      c.expect(!JSON.stringify(v.fasilitator).includes(String(v.peserta)), `the facilitator was given the participant's name, ${v.peserta}`);
      c.expect(tolak(v.guru_lain) && tolak(v.peserta_sendiri),
        `another Guru and the participant himself, at the PD Kelas's «Lihat per soal»: ${JSON.stringify(v.guru_lain)}, ${JSON.stringify(v.peserta_sendiri)}`);
      const ak = v.akademik ?? {};
      c.expect(ak.hasil === "OK" && Number(ak.duduk) >= 1 && Array.isArray(ak.nama) && ak.nama.includes(v.murid) && Number(ak.pilihan) >= 1 && Number(ak.soal) >= 1,
        `the academic Kelas's teacher no longer reads the class question by question and learner by learner: ${JSON.stringify(ak)}`);
      c.expect(tolak(v.akademik_guru_lain), `another Guru reads the academic Kelas's evidence: ${JSON.stringify(v.akademik_guru_lain)}`);
      return c.verdict("teacher_question_evidence against the database, rolled back: in a professional-learning Kelas holding the Guru's finished " +
        "Uji Penguasaan and its answer, the facilitator is refused (42501) and given no name and no option, as are another Guru and the " +
        "participant himself; in the academic Kelas the class's teacher still reads the handed-in sitting question by question and learner by " +
        "learner, and another Guru is still refused");
    },
  },
];
