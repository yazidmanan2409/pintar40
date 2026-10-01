/**
 * D-088(b), D-081 (Q1-Q4), BOB-49 / DAISY-38 -- A SCHOOL SETS ITS OWN PASS MARK,
 * AND EVERY ATTEMPT CARRIES THE ONE IT WAS GIVEN UNDER.
 *
 * Until now every lesson and every Uji Cepat was judged against a 0.6 the code
 * wrote into the definition; no decision chose it. The school now sets each
 * lesson's mark (supabase/migrations/20261102100000): an append-only, audited
 * setting written by its admin; sealed onto each assignment when the class is
 * given the lesson and onto each attempt when it starts; read by the one pass
 * determination. With no mark the lesson cannot be given.
 *
 *   BOB49-S01  db: in one rolled-back transaction, the bootstrap school's admin
 *              changes Pengukuran's mark from 60 to 75: the class already given
 *              it keeps 60 (assignment and attempt), a class given it now gets
 *              75; two sittings with the same 70% are lulus at 60 and not at 75,
 *              and session_outcome and certificate_eligibility agree on both;
 *              the definition's passing_rules are untouched; two schools teach
 *              one canonical lesson at 60 and 75 and their assignments seal each
 *              school's own; a lesson with no mark is refused (PR050
 *              ASSIGN_PASS_MARK_MISSING); the teacher, the head of department and
 *              the learner cannot set a mark (42501), 101 and an empty reason are
 *              refused, another school's lesson is not found; the history, the
 *              assignment seal and the attempt seal never change (PR080); the
 *              change is audited
 *   BOB49-K01  static: bacaPersen takes 0-100 whole numbers only; the three
 *              refusal contracts name ASSIGN_PASS_MARK_MISSING by its SQLSTATE
 *              and DETAIL; Konfigurasi sets the mark per lesson with its history,
 *              Sediakan shows it or «Batas ketuntasan belum ditetapkan», the
 *              result page says so when none is sealed; the copy in id and en
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
create temp table b49_snap (k text, v jsonb) on commit drop;
grant all on b49_snap to authenticated;
do $b49$
declare f record; p record; v jsonb; v_aa uuid; v_rules_before jsonb; v_rules_after jsonb; v_tmpl uuid; v_5c uuid; v_aa75 uuid;
        v_s60 uuid; v_s75 uuid; v_state text; v_coba jsonb := '{}'::jsonb; v_seal jsonb := '{}'::jsonb;
        o60 jsonb; o75 jsonb; e60 record; e75 record; v_c2 uuid; v_d2 uuid; v_mark_id uuid; v_who text;
        v_siklus uuid; v_cls_boot uuid; v_la uuid; v_other_course uuid;
begin
  perform selftest.as_owner();
  select * into f from selftest.boot_fixture();
  select passing_rules into v_rules_before from public.assessment_definitions where id = f.defn;
  v_tmpl := selftest.boot_attempt(true);   -- a real sitting of the class already given the lesson (sealed at 60)

  -- 1. the school's admin raises the lesson's mark to 75
  perform selftest.as_user('boot-admin@bootstrap.pintar.test');
  v := public.set_school_pass_mark(f.inst, f.course, 75, 'BOB49: rapat guru');
  o60 := public.set_school_pass_mark(f.inst, f.course, 75, 'sama');   -- the same value again
  perform selftest.as_owner();
  v_mark_id := (v ->> 'id')::uuid;
  insert into b49_snap values ('SET', v || jsonb_build_object('again', o60,
    'audit', (select count(*) from public.audit_log where action = 'school_pass_mark.set' and target_id = v_mark_id::text)));

  -- 2. a class given the lesson now: sealed at 75; the class given it before keeps 60, and so does its sitting
  insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
  select f.inst, n.parent_id, 'CLASS', '5C', n.academic_period_id
    from public.org_nodes n join public.assessment_assignments aa on aa.node_id = n.id where aa.id = f.aa
  returning id into v_5c;
  insert into public.assessment_assignments (institution_id, assessment_definition_id, node_id, academic_period_id)
  select f.inst, f.defn, v_5c, aa.academic_period_id from public.assessment_assignments aa where aa.id = f.aa
  returning id into v_aa75;

  -- 3. two sittings with the same 70%, one under each assignment
  foreach v_aa in array array[f.aa, v_aa75] loop
    v := to_jsonb(gen_random_uuid());   -- the new sitting's id
    insert into public.assessment_sessions
      (id, person_id, institution_id, enrollment_id, academic_period_id, class_node_id, cohort_node_id,
       assessment_assignment_id, plp_release_id, assessment_definition_id, assessment_definition_version,
       engine_version, scoring_policy_version, evidence_channel, evidence_class, mode, status, shuffle_seed,
       started_at, deadline_extended_count)
    select (v #>> '{}')::uuid, x.person_id, x.institution_id, x.enrollment_id, x.academic_period_id, x.class_node_id, x.cohort_node_id,
           v_aa, x.plp_release_id, x.assessment_definition_id, x.assessment_definition_version,
           x.engine_version, x.scoring_policy_version, x.evidence_channel, x.evidence_class, x.mode, 'CREATED', x.shuffle_seed,
           now(), 0
      from public.assessment_sessions x where x.id = v_tmpl;
    update public.assessment_sessions set status = 'IN_PROGRESS' where id = (v #>> '{}')::uuid;
    update public.assessment_sessions set status = 'SUBMITTED', submitted_at = now() where id = (v #>> '{}')::uuid;
    update public.assessment_sessions set status = 'FINALIZED', finalized_at = now() where id = (v #>> '{}')::uuid;
    insert into public.assessment_results
      (id, session_id, institution_id, person_id, evidence_class, engine_version, scoring_policy_version,
       mastery, per_domain, safety_gate_passed, delta_inputs, computed_at)
    select gen_random_uuid(), (v #>> '{}')::uuid, r.institution_id, r.person_id, r.evidence_class, r.engine_version,
           r.scoring_policy_version, 0.70, r.per_domain, true, r.delta_inputs, now()
      from public.assessment_results r where r.session_id = v_tmpl and r.supersedes_result_id is null;
    if v_aa = f.aa then v_s60 := (v #>> '{}')::uuid; else v_s75 := (v #>> '{}')::uuid; end if;
  end loop;
  perform selftest.as_user('boot-siswa@bootstrap.pintar.test');
  o60 := public.session_outcome(v_s60); o75 := public.session_outcome(v_s75);
  perform selftest.as_owner();
  select * into e60 from public.certificate_eligibility(v_s60);
  select * into e75 from public.certificate_eligibility(v_s75);
  select passing_rules into v_rules_after from public.assessment_definitions where id = f.defn;
  insert into b49_snap values ('SEGEL', jsonb_build_object(
    'aa_lama', (select to_jsonb(a) - array['id','institution_id','assessment_definition_id','learning_assignment_id','node_id',
                'academic_period_id','opens_at','closes_at','status','assigned_by_person_id','assigned_at','created_at']
                from public.assessment_assignments a where a.id = f.aa),
    'aa_baru', (select jsonb_build_object('pass_mark', a.pass_mark, 'pass_mark_source', a.pass_mark_source,
                'school_pass_mark_id', a.school_pass_mark_id) from public.assessment_assignments a where a.id = v_aa75),
    'mark_id', v_mark_id,
    'sesi_lama', (select s.pass_mark from public.assessment_sessions s where s.id = v_tmpl),
    'o60', o60, 'o75', o75,
    'e60', jsonb_build_object('eligible', e60.eligible, 'passed', e60.passed, 'reason', e60.reason),
    'e75', jsonb_build_object('eligible', e75.eligible, 'passed', e75.passed, 'reason', e75.reason),
    'rules_sama', v_rules_before = v_rules_after));

  -- 4. one canonical lesson, two schools, two marks: each school's assignment seals its own
  select * into p from selftest.canonical_package('BOB49 ' || substr(md5(random()::text), 1, 6));
  select ra.institution_id into v_siklus from public.role_assignments ra join public.accounts a on a.person_id = ra.person_id
    join auth.users u on u.id = a.auth_user_id
   where u.email = 'siklus-admin@synthetic.pintar.test' and ra.role = 'INSTITUTION_ADMIN' and ra.revoked_at is null limit 1;
  perform selftest.as_user('kanonik-admin@pintar.test');
  perform public.grant_release_distribution(p.rel, f.inst, 'BOB49');
  perform public.grant_release_distribution(p.rel, v_siklus, 'BOB49');
  perform selftest.as_user('boot-admin@bootstrap.pintar.test');
  perform public.set_school_pass_mark(f.inst, p.course, 60, 'BOB49: sekolah A');
  perform selftest.as_user('siklus-admin@synthetic.pintar.test');
  perform public.set_school_pass_mark(v_siklus, p.course, 75, 'BOB49: sekolah B');
  perform selftest.as_owner();
  foreach v_who in array array['boot', 'siklus'] loop
    select n.id into v_cls_boot from public.org_nodes n
     where n.institution_id = case when v_who = 'boot' then f.inst else v_siklus end
       and n.kind = 'CLASS' and n.is_active and n.academic_period_id is not null order by n.created_at limit 1;
    insert into public.learning_assignments (institution_id, plp_release_id, course_id, node_id, academic_period_id)
    select n.institution_id, p.rel, p.course, n.id, n.academic_period_id from public.org_nodes n where n.id = v_cls_boot
    returning id into v_la;
    insert into public.assessment_assignments (institution_id, assessment_definition_id, learning_assignment_id, node_id, academic_period_id)
    select n.institution_id, p.defn, v_la, n.id, n.academic_period_id from public.org_nodes n where n.id = v_cls_boot
    returning id into v_aa;
    v_seal := v_seal || jsonb_build_object(v_who, (select a.pass_mark from public.assessment_assignments a where a.id = v_aa));
  end loop;
  insert into b49_snap values ('DUA', v_seal || jsonb_build_object(
    'rules', (select passing_rules from public.assessment_definitions where id = p.defn)));

  -- 5. a lesson with no mark cannot be given
  insert into public.courses (institution_id, subject, stage, grade_label, title)
  values (f.inst, 'Matematika', 'SD', 'Kelas 5', 'BOB49 tanpa batas') returning id into v_c2;
  insert into public.assessment_definitions (institution_id, course_id, title, mode, bank_type, item_count)
  values (f.inst, v_c2, 'BOB49 uji', 'POST_TEST', 'TEST', 3) returning id into v_d2;
  begin
    insert into public.assessment_assignments (institution_id, assessment_definition_id, node_id, academic_period_id)
    select f.inst, v_d2, v_5c, n.academic_period_id from public.org_nodes n where n.id = v_5c;
    v_coba := v_coba || jsonb_build_object('tanpa_batas', 'given');
  exception when others then
    get stacked diagnostics v_state = returned_sqlstate, v_who = pg_exception_detail;
    v_coba := v_coba || jsonb_build_object('tanpa_batas', v_state || ' ' || coalesce(v_who, ''));
  end;

  -- 6. who may set it, and with what
  select co.id into v_other_course from public.courses co where co.institution_id = v_siklus order by co.created_at limit 1;
  for v_who, v in select * from (values
      ('guru',  jsonb_build_object('u', 'boot-guru@bootstrap.pintar.test', 'p', 70, 'r', 'x', 'c', f.course)),
      ('kaprodi', jsonb_build_object('u', 'boot-kaprodi@bootstrap.pintar.test', 'p', 70, 'r', 'x', 'c', f.course)),
      ('siswa', jsonb_build_object('u', 'boot-siswa@bootstrap.pintar.test', 'p', 70, 'r', 'x', 'c', f.course)),
      ('seratus_satu', jsonb_build_object('u', 'boot-admin@bootstrap.pintar.test', 'p', 101, 'r', 'x', 'c', f.course)),
      ('tanpa_alasan', jsonb_build_object('u', 'boot-admin@bootstrap.pintar.test', 'p', 70, 'r', ' ', 'c', f.course)),
      ('sekolah_lain', jsonb_build_object('u', 'boot-admin@bootstrap.pintar.test', 'p', 70, 'r', 'x', 'c', v_other_course))) t(a, b) loop
    perform selftest.as_user(v ->> 'u');
    begin
      perform public.set_school_pass_mark(f.inst, (v ->> 'c')::uuid, (v ->> 'p')::int, v ->> 'r');
      v_coba := v_coba || jsonb_build_object(v_who, 'set');
    exception when others then
      get stacked diagnostics v_state = returned_sqlstate;
      v_coba := v_coba || jsonb_build_object(v_who, v_state);
    end;
    perform selftest.as_owner();
  end loop;

  -- 7. nothing sealed moves, and the history is a line
  foreach v_who in array array['riwayat_ubah', 'riwayat_hapus', 'segel_tugas', 'segel_sesi'] loop
    begin
      if v_who = 'riwayat_ubah' then update public.school_pass_marks set percent = 10 where id = v_mark_id;
      elsif v_who = 'riwayat_hapus' then delete from public.school_pass_marks where id = v_mark_id;
      elsif v_who = 'segel_tugas' then update public.assessment_assignments set pass_mark = 0.10 where id = v_aa75;
      else update public.assessment_sessions set pass_mark = 0.10 where id = v_s75; end if;
      v_coba := v_coba || jsonb_build_object(v_who, 'changed');
    exception when others then
      get stacked diagnostics v_state = returned_sqlstate;
      v_coba := v_coba || jsonb_build_object(v_who, v_state);
    end;
  end loop;
  insert into b49_snap values ('COBA', v_coba || jsonb_build_object(
    'parameter', (select format_type(pp.proargtypes[2], null) from pg_proc pp where pp.proname = 'set_school_pass_mark')));
end $b49$;
select k || chr(9) || v::text from b49_snap order by k;
rollback;
`;

export const bob49Tests: SelfTest[] = [
  {
    id: "BOB49-S01",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const db = process.env.SUPABASE_DB_URL!;
      for (const f of ["fable01", "fable02", "fable03", "fable04", "fable05"]) {
        spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-q", "-1", "-f", join(repoRoot, "selftest", "db", `${f}.sql`), db], { encoding: "utf8" });
      }
      const r = spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-At", "-c", SKRIP, db], { encoding: "utf8" });
      const pesan = (r.stderr || "").trim().split("\n").find((l) => /ERROR/.test(l)) ?? (r.stderr || "").trim().split("\n").pop();
      if (!c.expect(r.status === 0, `the scenario could not run: ${pesan}`)) return c.verdict("");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the database's own JSON
      const snap: Record<string, any> = {};
      for (const l of r.stdout.split("\n")) {
        const [k, v] = l.split("\t");
        if (k && v) snap[k] = JSON.parse(v);
      }
      const { SET: set, SEGEL: segel, DUA: dua, COBA: coba } = snap;
      if (!c.expect(!!set && !!segel && !!dua && !!coba, "the database half returned no snapshot")) return c.verdict("");

      c.expect(set.changed === true && set.percent === 75 && set.audit === 1,
        `the admin's change read ${JSON.stringify(set)}; expected a new mark of 75, audited once`);
      c.expect(set.again?.changed === false, `setting the same mark again wrote ${JSON.stringify(set.again)}; expected nothing written`);
      // prospective only: what was given before keeps its mark, what is given now takes the new one
      c.expect(Number(segel.aa_lama.pass_mark) === 0.6 && Number(segel.sesi_lama) === 0.6,
        `the class given the lesson before now reads ${segel.aa_lama.pass_mark} (its sitting ${segel.sesi_lama}); expected 60 kept`);
      c.expect(Number(segel.aa_baru.pass_mark) === 0.75 && segel.aa_baru.pass_mark_source === "SCHOOL" && segel.aa_baru.school_pass_mark_id === segel.mark_id,
        `the class given it now reads ${JSON.stringify(segel.aa_baru)}; expected 75 from the school's new setting`);
      // the same 70%: lulus at 60, not at 75 -- and the two readers agree
      c.expect(segel.o60.lulus === true && Number(segel.o60.ambang) === 0.6 && segel.o75.lulus === false && Number(segel.o75.ambang) === 0.75,
        `the same 70% reads ${JSON.stringify([segel.o60.lulus, segel.o60.ambang, segel.o75.lulus, segel.o75.ambang])}; expected lulus at 60 and not at 75`);
      c.expect(segel.e60.passed === segel.o60.lulus && segel.e75.passed === segel.o75.lulus && segel.e60.eligible === true && segel.e75.eligible === false,
        `certificate_eligibility reads ${JSON.stringify([segel.e60, segel.e75])}; expected it to agree with session_outcome`);
      c.expect(segel.rules_sama === true, "the lesson's definition (passing_rules) changed; a school's mark never touches shared content");
      // one canonical lesson, two schools
      c.expect(Number(dua.boot) === 0.6 && Number(dua.siklus) === 0.75,
        `one canonical lesson given in two schools sealed ${JSON.stringify([dua.boot, dua.siklus])}; expected each school's own 60 and 75`);
      c.expect(JSON.stringify(dua.rules) === JSON.stringify({ mastery_min: 0.6 }) || JSON.stringify(dua.rules) === "{}",
        `the canonical definition reads ${JSON.stringify(dua.rules)} after two schools set their marks`);
      // refusals
      c.expect(coba.tanpa_batas === "PR050 ASSIGN_PASS_MARK_MISSING", `a lesson with no mark was answered ${coba.tanpa_batas}; expected PR050 ASSIGN_PASS_MARK_MISSING`);
      for (const k of ["guru", "kaprodi", "siswa"]) c.expect(coba[k] === "42501", `the ${k} setting a mark was answered ${coba[k]}; only the school's admin sets it`);
      c.expect(coba.seratus_satu === "22023" && coba.tanpa_alasan === "22023", `101 and an empty reason were answered ${coba.seratus_satu}, ${coba.tanpa_alasan}; expected 22023`);
      c.expect(coba.sekolah_lain === "P0002", `another school's lesson was answered ${coba.sekolah_lain}; expected not found`);
      c.expect(coba.parameter === "integer", `the mark is taken as ${coba.parameter}; a decimal must not be accepted`);
      for (const k of ["riwayat_ubah", "riwayat_hapus", "segel_tugas", "segel_sesi"]) {
        c.expect(coba[k] === "PR080", `${k} was answered ${coba[k]}; expected PR080 (sealed)`);
      }
      return c.verdict(
        "executed in the database, rolled back (supabase/migrations/20261102100000): the bootstrap school's admin changes " +
          "Pengukuran's mark from 60 to 75 (audited once; the same value again writes nothing); the class given the lesson " +
          "before keeps 60 on its assignment and its sitting, a class given it now seals 75; two sittings with the same 70% " +
          "are lulus at 60 and not at 75, and certificate_eligibility agrees (eligible at 60, not at 75); the definition's " +
          "passing_rules are untouched; one canonical lesson given in two schools seals each school's own 60 and 75; a lesson " +
          "with no mark is refused PR050 ASSIGN_PASS_MARK_MISSING; the teacher, head of department and learner are refused " +
          "(42501), 101 and an empty reason refused (22023), another school's lesson not found, the mark an integer; the " +
          "history, the assignment's seal and the attempt's seal never change (PR080)",
      );
    },
  },
  {
    id: "BOB49-K01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const { bacaPersen } = await import("../src/lib/batas-ketuntasan");
      const benar: Array<[string, number | null]> = [["60", 60], ["0", 0], ["100", 100], [" 75 ", 75], ["101", null],
        ["-1", null], ["60.5", null], ["60,5", null], ["", null], ["enam puluh", null]];
      for (const [masuk, harap] of benar) c.expect(bacaPersen(masuk) === harap, `bacaPersen(${JSON.stringify(masuk)}) = ${bacaPersen(masuk)}; expected ${harap}`);

      const galat = { code: "PR050", details: "ASSIGN_PASS_MARK_MISSING", message: "the school has not set the pass mark for this lesson" };
      const { kodeGalat, kunciKode } = await import("../src/lib/galat-kontrak");
      const { kodeUjiCepat } = await import("../src/lib/ujicepat-kontrak");
      const { kodePenugasanDari, kunciKodePenugasan } = await import("../src/lib/penugasan-kontrak");
      c.expect(kodeGalat(galat) === "PASS_MARK_MISSING", `Studio's contract names it ${kodeGalat(galat)}`);
      c.expect(kodeGalat({ ...galat, details: "ASSIGN_EXISTS" }) === "ACTION_FAILED", "another PR050 is not the pass mark's");
      c.expect(kodeUjiCepat(galat) === "QUICK_PASS_MARK_MISSING", `the Uji Cepat contract names it ${kodeUjiCepat(galat)}`);
      c.expect(kodePenugasanDari("ASSIGN_PASS_MARK_MISSING") === "ASSIGN_PASS_MARK_MISSING", "the Sediakan contract does not know the code");
      const { kalimatTolakUjiCepat } = await import("../src/components/mengajar/tolakUjiCepat");
      for (const locale of ["id", "en"] as const) {
        const s = (k: Parameters<typeof t>[0]) => t(k, "educator", { locale });
        const kal = [
          t(kunciKode("PASS_MARK_MISSING"), "staff", { locale }),
          s(kunciKodePenugasan("ASSIGN_PASS_MARK_MISSING")),
          kalimatTolakUjiCepat({ kode: "QUICK_PASS_MARK_MISSING", ref: null }, s, locale, { soalMin: 3, soalMax: 20, menit: [10] }),
        ];
        for (const x of kal) c.expect(/ketuntasan|pass mark/i.test(x) && /Konfigurasi|Configuration/.test(x), `(${locale}) the refusal reads "${x}"; expected the pass mark and where it is set`);
        for (const k of ["config.section.ketuntasan", "config.ketuntasan.arti", "config.ketuntasan.belum", "mengajar.sedia.batas_belum", "siklus.ambang_belum",
          "galat.pass_mark_set", "galat.pass_mark_unchanged", "galat.pass_mark_input_incomplete"] as const) {
          const kalimat = t(k, "staff", { locale });
          c.expect(kalimat.length > 3 && kalimat !== k, `(${locale}) ${k} has no text`);
        }
      }
      c.expect(t("config.ketuntasan.belum", "staff", { locale: "id" }) === "Batas ketuntasan belum ditetapkan",
        "the words for an unset mark are not «Batas ketuntasan belum ditetapkan» (D-088(b))");

      const konf = buang(readFileSync(join(repoRoot, "src", "app", "konfigurasi", "page.tsx"), "utf8"));
      c.expect(/id="ketuntasan"/.test(konf) && /pelajaranDanBatas\(supabase, sekolahStruktur\.id\)/.test(konf)
        && /action=\{tetapkanBatasAction\}/.test(konf) && /name="persen"[^>]*step=\{1\}/.test(konf) && /p\.history\.map/.test(konf),
        "Konfigurasi does not set each lesson's mark, whole numbers only, with its history");
      const aksi = readFileSync(join(repoRoot, "src", "app", "konfigurasi", "actions.ts"), "utf8");
      c.expect(/rpc\("set_school_pass_mark"/.test(aksi) && /bacaPersen\(/.test(aksi), "the action does not set the mark through set_school_pass_mark");
      const sedia = buang(readFileSync(join(repoRoot, "src", "app", "mengajar", "[kelas]", "siapkan", "page.tsx"), "utf8"));
      c.expect(/batasPelajaran\(/.test(sedia) && /mengajar\.sedia\.batas_belum/.test(sedia) && /mengajar\.sedia\.batas"/.test(sedia),
        "Sediakan does not show the lesson's mark, or «belum ditetapkan»");
      const hasil = buang(readFileSync(join(repoRoot, "src", "app", "belajar", "[tugas]", "hasil", "page.tsx"), "utf8"));
      c.expect(/siklus\.ambang_belum/.test(hasil), "the result page does not say when no mark is sealed");
      const mig = readFileSync(join(repoRoot, "supabase", "migrations", "20261102100000_a_school_sets_its_own_pass_mark.sql"), "utf8");
      c.expect(/v_min := v_s\.pass_mark;/.test(mig) && /select s\.mode, s\.pass_mark into v_mode, v_min/.test(mig),
        "the two readers do not read the attempt's sealed mark");
      c.expect(!/0\.6/.test(mig.replace(/--[^\n]*/g, "")), "the migration writes a 0.6 of its own");
      return c.verdict(
        "executes bacaPersen (src/lib/batas-ketuntasan.ts): 0 to 100 whole numbers only; the three refusal contracts " +
          "(galat-kontrak, ujicepat-kontrak, penugasan-kontrak) name ASSIGN_PASS_MARK_MISSING by its SQLSTATE and DETAIL and " +
          "each says, in id and en, that the lesson has no pass mark and where it is set. Reads the source of Konfigurasi (a " +
          "whole-number mark per lesson, with reason and history, through set_school_pass_mark), Sediakan (the mark or " +
          "«Batas ketuntasan belum ditetapkan»), the result page (says so when none is sealed) and the migration (both readers " +
          "on the attempt's seal; no 0.6 of its own); the copy table in id and en",
      );
    },
  },
];
