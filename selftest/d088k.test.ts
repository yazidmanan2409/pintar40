/**
 * D-088(k) (Yazid, 2 Oct; D-085 M5) -- WHICH QUESTIONS THE CLASS FOUND HARD.
 * TEACHING EVIDENCE, NOT SURVEILLANCE.
 *
 * A teacher held no read of responses. `teacher_question_evidence`
 * (supabase/migrations/20261101100000) gives the class's teacher -- the
 * EDUCATOR role itself over the class, never the role ladder that would widen
 * a dean -- the class's handed-in sittings of one assessment, question by
 * question and learner by learner. Never a running sitting, times, integrity or
 * Question Health. /mengajar/<kelas>/soal orders it hardest first, with who
 * may need help.
 *
 *   D088K-S01  db: in one rolled-back transaction, the bootstrap learner hands
 *              in the Uji Penguasaan and a second learner is still working on
 *              it; 5B's teacher reads one sitting, every question once,
 *              answered and right, and the learner's choice equal to the key;
 *              the learner, the head of department and the teacher asking
 *              about another class are refused (42501)
 *   D088K-K01  static: susunBuktiSoal orders hardest first and names who may
 *              need help; the page, the link from «Lihat bukti», the copy, and
 *              nothing on the page that reads like an integrity console
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
create temp table m5_snap (k text, v jsonb) on commit drop;
grant all on m5_snap to authenticated;
do $m5$
declare f record; v_tpl uuid; v_5b uuid; v_5c uuid; v_aa uuid; v_p uuid; v_e uuid; v_s uuid; v jsonb;
        v_coba jsonb := '{}'::jsonb; v_state text; v_who text; v_kunci jsonb;
begin
  perform selftest.as_owner();
  select * into f from selftest.boot_fixture();
  v_tpl := selftest.boot_attempt(true);            -- the bootstrap learner hands in the Uji Penguasaan, all right
  select s.assessment_assignment_id, s.class_node_id into v_aa, v_5b from public.assessment_sessions s where s.id = v_tpl;
  insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
  select f.inst, n.parent_id, 'CLASS', '5C', n.academic_period_id from public.org_nodes n where n.id = v_5b
  returning id into v_5c;

  -- a second learner of 5B is still in the middle of the same assessment: their sitting must never be read
  insert into public.persons (display_name) values ('Murid M5 Masih Mengerjakan') returning id into v_p;
  insert into public.enrollments (person_id, institution_id, academic_period_id, programme_id, status)
  select v_p, x.institution_id, x.academic_period_id, e.programme_id, 'ACTIVE'
    from public.assessment_sessions x join public.enrollments e on e.id = x.enrollment_id where x.id = v_tpl
  returning id into v_e;
  insert into public.memberships (enrollment_id, node_id, academic_period_id)
  select v_e, v_5b, x.academic_period_id from public.assessment_sessions x where x.id = v_tpl;
  v_s := gen_random_uuid();
  insert into public.assessment_sessions
    (id, person_id, institution_id, enrollment_id, academic_period_id, class_node_id, cohort_node_id,
     learning_assignment_id, assessment_assignment_id, plp_release_id, assessment_definition_id, assessment_definition_version,
     engine_version, scoring_policy_version, evidence_channel, evidence_class, mode, status, shuffle_seed, started_at,
     deadline_extended_count)
  select v_s, v_p, x.institution_id, v_e, x.academic_period_id, v_5b, x.cohort_node_id,
         x.learning_assignment_id, x.assessment_assignment_id, x.plp_release_id, x.assessment_definition_id, x.assessment_definition_version,
         x.engine_version, x.scoring_policy_version, x.evidence_channel, x.evidence_class, x.mode, 'CREATED', x.shuffle_seed, now(), 0
    from public.assessment_sessions x where x.id = v_tpl;
  update public.assessment_sessions set status = 'IN_PROGRESS' where id = v_s;
  insert into public.presented_items (session_id, item_id, position)
  select v_s, p.item_id, p.position from public.presented_items p where p.session_id = v_tpl;

  -- the class's teacher
  perform selftest.as_user('boot-guru@bootstrap.pintar.test');
  v := public.teacher_question_evidence(v_aa, v_5b);
  perform selftest.as_owner();
  select jsonb_object_agg(i.id::text, (select string_agg(o.label, '' order by o.label) from public.item_options o where o.item_id = i.id and o.is_correct))
    into v_kunci from public.presented_items p join public.items i on i.id = p.item_id where p.session_id = v_tpl;
  insert into m5_snap values ('GURU', jsonb_build_object('hasil', v, 'kunci', v_kunci,
    'disajikan', (select count(*) from public.presented_items where session_id = v_tpl),
    'siswa', (select person_id from public.assessment_sessions where id = v_tpl)));

  -- nobody else: the learner, the head of department (no EDUCATOR), the same teacher asking about another class
  foreach v_who in array array['boot-siswa@bootstrap.pintar.test', 'boot-kaprodi@bootstrap.pintar.test', 'boot-guru@bootstrap.pintar.test#5C'] loop
    perform selftest.as_user(split_part(v_who, '#', 1));
    begin
      perform public.teacher_question_evidence(v_aa, case when v_who like '%#5C' then v_5c else v_5b end);
      v_coba := v_coba || jsonb_build_object(v_who, 'read');
    exception when others then
      get stacked diagnostics v_state = returned_sqlstate;
      v_coba := v_coba || jsonb_build_object(v_who, v_state);
    end;
  end loop;
  perform selftest.as_owner();
  insert into m5_snap values ('LAIN', v_coba);
end $m5$;
select k || chr(9) || v::text from m5_snap order by k;
rollback;
`;

export const d088kTests: SelfTest[] = [
  {
    id: "D088K-S01",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const db = process.env.SUPABASE_DB_URL!;
      for (const f of ["fable01", "fable02", "fable03", "fable04"]) {
        spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-q", "-1", "-f", join(repoRoot, "selftest", "db", `${f}.sql`), db], { encoding: "utf8" });
      }
      const r = spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-At", "-c", SKRIP, db], { encoding: "utf8" });
      const pesan = (r.stderr || "").trim().split("\n").find((l) => /ERROR/.test(l)) ?? (r.stderr || "").trim().split("\n").pop();
      if (!c.expect(r.status === 0, `the read could not run: ${pesan}`)) return c.verdict("");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the database's own JSON
      const snap: Record<string, any> = {};
      for (const l of r.stdout.split("\n")) {
        const [k, v] = l.split("\t");
        if (k && v) snap[k] = JSON.parse(v);
      }
      const { GURU: guru, LAIN: lain } = snap;
      if (!c.expect(!!guru && !!lain, "the database half returned no snapshot")) return c.verdict("");
      const h = guru.hasil;
      // only what was handed in: the second learner, still working, is not read at all
      c.expect(h.sittings === 1, `the teacher reads ${h.sittings} sitting(s); expected only the one handed in (a running sitting is never read)`);
      const q = h.questions as Array<{ item_id: string; presented: number; answered: number; right: number; options: Array<{ label: string; is_key: boolean }> }>;
      c.expect(q.length === guru.disajikan && q.every((x) => x.presented === 1 && x.answered === 1 && x.right === 1),
        `the questions read ${JSON.stringify(q.map((x) => [x.presented, x.answered, x.right]))}; expected each of ${guru.disajikan} presented, answered and right once`);
      c.expect(q.every((x) => x.options.filter((o) => o.is_key).map((o) => o.label).join("") === guru.kunci[x.item_id]),
        "a question's key on the read is not its key in the bank");
      const m = h.learners as Array<{ person_id: string; answers: Array<{ item_id: string; chosen: string; right: boolean }> }>;
      c.expect(m.length === 1 && m[0].person_id === guru.siswa && m[0].answers.every((a) => a.right && a.chosen === guru.kunci[a.item_id]),
        `the learners read ${JSON.stringify(m)}; expected the one who handed in, each choice the key`);
      // and nothing else that could make it an integrity console
      const kunciBaca = JSON.stringify(Object.keys(h).sort());
      c.expect(kunciBaca === JSON.stringify(["learners", "questions", "sittings"]), `the read carries ${kunciBaca}; expected sittings, questions and learners only`);
      for (const [siapa, kode] of Object.entries(lain as Record<string, string>)) {
        c.expect(kode === "42501", `${siapa} was answered ${kode}; only the class's teacher reads this`);
      }
      return c.verdict(
        "executed in the database, rolled back (supabase/migrations/20261101100000, teacher_question_evidence): the bootstrap " +
          "learner handed in the Uji Penguasaan while a second learner of 5B was still working on it; 5B's teacher reads one " +
          "sitting, every presented question once with answered and right, its key as the bank holds it, and the learner's " +
          "submitted choices equal to the keys, and nothing but sittings, questions and learners; the learner, the head of " +
          "department (no EDUCATOR role) and the teacher asking about another class are refused (42501)",
      );
    },
  },
  {
    id: "D088K-K01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const { susunBuktiSoal } = await import("../src/lib/soal-kelas");
      const o = (label: string, is_key = false) => ({ label, body: label, is_key });
      const hasil = susunBuktiSoal({
        sittings: 3,
        questions: [
          { item_id: "q1", stem: "mudah", stimulus: null, options: [o("A", true), o("B")], presented: 3, answered: 3, right: 3 },
          { item_id: "q2", stem: "sulit", stimulus: null, options: [o("A"), o("B", true), o("C")], presented: 3, answered: 2, right: 1 },
        ],
        learners: [
          { person_id: "p1", name: "Citra", answers: [{ item_id: "q1", chosen: "A", right: true }, { item_id: "q2", chosen: null, right: false }] },
          { person_id: "p2", name: "Ani", answers: [{ item_id: "q1", chosen: "A", right: true }, { item_id: "q2", chosen: "C", right: false }] },
          { person_id: "p3", name: "Budi", answers: [{ item_id: "q1", chosen: "A", right: true }, { item_id: "q2", chosen: "B", right: true }] },
        ],
      });
      c.expect(hasil.map((x) => x.soal.item_id).join(",") === "q2,q1", `the questions come as ${hasil.map((x) => x.soal.item_id)}; expected the hardest first`);
      c.expect(JSON.stringify(hasil[0].pilihan) === JSON.stringify({ C: 1, B: 1 }), `the options chosen read ${JSON.stringify(hasil[0].pilihan)}`);
      c.expect(JSON.stringify(hasil[0].perluBantuan) === JSON.stringify([{ nama: "Ani", pilihan: "C" }, { nama: "Citra", pilihan: null }]),
        `who may need help reads ${JSON.stringify(hasil[0].perluBantuan)}; expected Ani (C) and Citra (left it), by name`);
      c.expect(hasil[1].perluBantuan.length === 0, "a question everyone answered rightly names someone who may need help");

      const hal = buang(readFileSync(join(repoRoot, "src", "app", "mengajar", "[kelas]", "soal", "page.tsx"), "utf8"));
      c.expect(/buktiSoal\(await supabaseServer\(\), tugasId, id\)/.test(hal) && /susunBuktiSoal\(bukti\)/.test(hal),
        "the page does not read the class's evidence through teacher_question_evidence");
      c.expect(/mengajar\.soal\.bantuan/.test(hal) && /mengajar\.soal\.kunci/.test(hal) && /mengajar\.soal\.tepat/.test(hal),
        "the page does not show the key, the count answered rightly and who may need help");
      c.expect(!/integritas|integrity|anomal|curang|cheat|durasi|duration|perangkat|device|menit|minute/i.test(hal),
        "the page reads like an integrity console");
      const keadaan = readFileSync(join(repoRoot, "src", "components", "bukti", "KeadaanHariIni.tsx"), "utf8");
      c.expect(/k\.kumpul > 0[\s\S]{0,120}\/soal\?penugasan=\$\{a\.id\}/.test(keadaan), "«Lihat bukti» does not lead to the question view once something is handed in");
      const mig = readFileSync(join(repoRoot, "supabase", "migrations", "20261101100000_a_teacher_sees_which_questions_the_class_found_hard.sql"), "utf8");
      c.expect(/'ROLE_SET', 'EDUCATOR'/.test(mig) && /ra\.role = 'EDUCATOR'/.test(mig), "the read is not bound to the EDUCATOR role itself");
      for (const locale of ["id", "en"] as const) {
        for (const k of ["mengajar.bukti.per_soal", "mengajar.soal.judul", "mengajar.soal.arti", "mengajar.soal.bantuan", "mengajar.soal.kosong"] as const) {
          const kal = t(k, "educator", { locale });
          c.expect(kal.length > 3 && kal !== k, `(${locale}) ${k} has no text`);
        }
        c.expect(!/integrit|curang|cheat/i.test(t("mengajar.soal.arti", "educator", { locale })), `(${locale}) the page's framing speaks of integrity`);
      }
      return c.verdict(
        "executes susunBuktiSoal (src/lib/soal-kelas.ts): the question fewest answered rightly first, how many chose each " +
          "option, and who may need help by name with the option they chose (or that they left it), none for a question " +
          "all answered rightly. Reads the source of src/app/mengajar/[kelas]/soal/page.tsx (teacher_question_evidence, key, " +
          "count, who may need help; no integrity, time or device word), the link from «Lihat bukti» once something is handed " +
          "in, the migration's EDUCATOR binding, and the copy in id and en",
      );
    },
  },
];
