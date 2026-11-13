/**
 * C1w · THE ITEM WORKBENCH, the database half (docs/completion-4.1/batches/C1W-COMPLETION.md, «Pre-build review:
 * outcome»; O41-10, O41-11, O41-18, O41-19, O41-21, O41-22; migrations 20270115100000 and 20270115110000). The seeded
 * learning-cycle school with people, a class and learners of this suite's own, packages uploaded and published by the
 * school's own seeded people (selftest.f13_release), real sittings (start_learning_session, record_answer,
 * finish_my_session); the bootstrap school for an issued certificate. Every scenario is one transaction, rolled back,
 * except C1W-C01, which needs two real connections and commits a world of its own.
 *
 *   C1W-K01  reads the source: every code soal_tolak (PR180) and koreksi_tolak (PR190) raises is the contract's
 *            (src/lib/soal-kontrak.ts), each with its sentence in Indonesian and English; recompute_result is not
 *            redefined; every client entry is declared and revoked from the signed-out role.
 *   C1W-S01  a draft edited in the app: a save attributed (who, when, what by name); a stale save refused; every
 *            validation problem at once and nothing written; add and remove; a checked draft goes back to be checked;
 *            refused once submitted and on a sealed package; edited again once sent back; another school refused;
 *            a discarded draft leaves its audit and attribution rows and no content.
 *   C1W-S02  the upload's identity column: every pointer set from it; without it all new; another course, another
 *            school, a non-predecessor version, one item twice and no predecessor refused at their rows, nothing
 *            materialised; no lineage pointer crosses owners; an upload over in-app edits is detectable.
 *   C1W-S03  one question revised: every item pointer set; the copy edited; through review, lock and publication the
 *            correction replaces its predecessor (no new assignment of it); create_course_revision revises the head
 *            only; the question's history says each version, who, when, which release and what changed.
 *   C1W-S04  a withdrawn release: no new sitting (red in 4.0); an open sitting finishes; a finished result stays and
 *            counts; teachers and learners read DIHENTIKAN_PENERBIT, never the teacher's withdrawal.
 *   C1W-S05  a governed key correction: proposed by the content owner (a teacher, a platform admin refused), confirmed
 *            by a different person (the proposer, a platform admin and a teacher refused; a head of department
 *            confirms through CAN_REVIEW); exact counts before; originals byte-identical; one superseding result with
 *            its basis per affected sitting; an unaffected sitting untouched and refused; new starts on the
 *            corrected release; an open sitting recalculated when it finishes; recompute_result still refused PR011;
 *            a second correction chains (O41-22); the learner and the teacher read the corrected result.
 *   C1W-S06  a certificate (bootstrap, OFFICIAL): unaffected, it verifies as before; its result changed, it verifies
 *            DITINJAU (nothing of it changed) until the issuing school confirms (BERLAKU) or revokes (DICABUT);
 *            affected again it reopens; DICABUT and DIGANTIKAN take precedence; the school's notice is its own.
 *   C1W-C01  two corrections confirmed at once on two real connections: the second waits, both stand, the sitting's
 *            chain is root, one, two, and exactly one result is current.
 */
import { spawn, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";
import { t } from "../src/lib/hle";
import {
  KODE_KOREKSI, KODE_KOREKSI_DB, KODE_SOAL, KODE_SOAL_DB, KODE_IDENTITAS_SOAL, MASALAH_SOAL_SENDIRI,
  kodeKoreksiDariGalat, kodeSoalDariGalat, kunciKodeKoreksi, kunciKodeSoal, kunciMasalahIdentitas, kunciMasalahSoal,
} from "../src/lib/soal-kontrak";

const MIGRASI_A = "supabase/migrations/20270115100000_a_question_is_written_in_the_app_and_revised_in_its_line.sql";
const MIGRASI_B = "supabase/migrations/20270115110000_a_wrong_key_is_corrected_by_two_people_and_kept_on_the_record.sql";
const ALASAN = "uji C1w: kunci jawaban soal ini keliru";

function db(): string {
  return process.env.SUPABASE_DB_URL!;
}

function siapkan(repoRoot: string): string | null {
  for (const f of ["fable01.sql", "fable02.sql", "fable03.sql", "fable04.sql", "fable05.sql", "fable06.sql", "fable09.sql", "fable11.sql", "fable12.sql", "fable13.sql"]) {
    const r = spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-q", "-1", "-f", join(repoRoot, "selftest", "db", f), db()], { encoding: "utf8" });
    if (r.status !== 0) return `selftest/db/${f} could not be loaded: ${(r.stderr || "").trim().split("\n").find((l) => /ERROR/.test(l)) ?? ""}`;
  }
  return null;
}

// ------------------------------------------------------------------ the scenario's own language
const q = (s: string) => `$q$${s}$q$`;
/** An id the world recorded: c1.<name> (people u_<name> and p_<name>). */
const G = (k: string) => `current_setting('c1.${k}')::uuid`;
const S = (k: string) => `current_setting('c1.${k}')`;
/** One probe: as `siapa` (the database owner when null) run `sql`; its answer kept under `k`. */
const langkah = (k: string, siapa: string | null, sql: string) =>
  `v := v || jsonb_build_object('${k}', pg_temp.c1(${siapa ? G(`u_${siapa}`) : "null"}, ${q(sql)}));`;
/** A step whose answer is not kept, as `siapa`. */
const lakukan = (siapa: string | null, sql: string) => `perform pg_temp.c1_wajib(${siapa ? G(`u_${siapa}`) : "null"}, ${q(sql)});`;
/** A fixture's own correction past the guards (the harness, never a product path). */
const paksa = (sql: string) => `set local session_replication_role = replica; execute ${q(sql)}; set local session_replication_role = origin;`;
/** A question as the editor sends it: options A.. with `kunci` (comma-separated labels) correct. */
const soal = (stem: string, kunci: string, n = 2, kosong = "") =>
  `pg_temp.c1_soal_json('${stem}', '${kunci}', ${n}, '${kosong}')`;
const item = (course: string, stem: string) => `pg_temp.c1_item(${G(course)}, '${stem}')`;

function skenario(badan: string[]): string {
  return `
begin;
create function pg_temp.c1(p_uid uuid, p_sql text)
returns text language plpgsql as $f$
declare v_out text; v_state text; v_detail text; v_msg text; v_val text;
begin
  begin
    if p_uid is not null then perform selftest.as_user_uid(p_uid); else perform selftest.as_owner(); end if;
    execute p_sql into v_val;
    v_out := 'ok:' || coalesce(v_val, '');
  exception when others then
    get stacked diagnostics v_state = returned_sqlstate, v_detail = pg_exception_detail, v_msg = message_text;
    v_out := v_state || ':' || coalesce(nullif(v_detail, ''), left(v_msg, 90));
  end;
  perform selftest.as_owner();
  return v_out;
end $f$;
create function pg_temp.c1_wajib(p_uid uuid, p_sql text)
returns void language plpgsql as $f$
begin
  if p_uid is not null then perform selftest.as_user_uid(p_uid); else perform selftest.as_owner(); end if;
  execute p_sql;
  perform selftest.as_owner();
end $f$;
create function pg_temp.c1_orang(p_nama text, p_role public.app_role, p_node uuid)
returns void language plpgsql as $f$
declare v_u uuid;
begin
  v_u := selftest.f11_user('c1w-' || p_nama || '-' || current_setting('c1.tag') || '@local.invalid', p_role, p_node);
  perform set_config('c1.u_' || p_nama, v_u::text, true);
  perform set_config('c1.p_' || p_nama, (select a.person_id::text from public.accounts a where a.auth_user_id = v_u), true);
end $f$;
create function pg_temp.c1_dunia()
returns void language plpgsql as $f$
declare f record; v_k uuid; v_inst uuid; v_parent uuid; v_root uuid; v_kelas uuid; v_lain uuid; v_boot uuid; v_boot_root uuid;
begin
  perform selftest.as_owner();
  perform set_config('c1.tag', to_char(clock_timestamp(), 'HH24MISSUS'), true);
  select * into f from selftest.cycle_fixture();
  if f.la is null then raise exception 'the learning-cycle fixture is absent'; end if;
  select la.node_id, la.institution_id into v_k, v_inst from public.learning_assignments la where la.id = f.la;
  select n.parent_id into v_parent from public.org_nodes n where n.id = v_k;
  select o.id into v_root from public.org_nodes o where o.institution_id = v_inst and o.kind = 'INSTITUTION';
  insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
  select n.institution_id, n.parent_id, 'CLASS', 'Kelas C1W ' || current_setting('c1.tag'), n.academic_period_id
    from public.org_nodes n where n.id = v_k returning id into v_kelas;
  select o.id into v_lain from public.org_nodes o join public.institutions i on i.id = o.institution_id
   where o.kind = 'INSTITUTION' and i.tenant_kind = 'INSTITUTION' and i.id <> v_inst and i.official_evidence_purpose is null
   order by i.created_at limit 1;
  select i.id, o.id into v_boot, v_boot_root from public.institutions i join public.org_nodes o on o.institution_id = i.id and o.kind = 'INSTITUTION'
   where i.official_evidence_purpose = 'D1_ENGINEERING_BOOTSTRAP' limit 1;
  perform set_config('c1.inst', v_inst::text, true);
  perform set_config('c1.kelas', v_kelas::text, true);
  perform set_config('c1.kelas_lama', v_k::text, true);
  perform set_config('c1.boot', coalesce(v_boot::text, ''), true);
  perform set_config('c1.lain_inst', (select o.institution_id::text from public.org_nodes o where o.id = v_lain), true);
  perform pg_temp.c1_orang('guru', 'EDUCATOR', v_kelas);
  perform pg_temp.c1_orang('guru2', 'EDUCATOR', v_kelas);
  perform pg_temp.c1_orang('kadep', 'HEAD_OF_DEPARTMENT', v_parent);
  perform pg_temp.c1_orang('kadep2', 'HEAD_OF_DEPARTMENT', v_parent);
  perform pg_temp.c1_orang('admin', 'INSTITUTION_ADMIN', v_root);
  perform pg_temp.c1_orang('sys', 'SYSTEM_ADMIN', null);
  perform pg_temp.c1_orang('lain', 'INSTITUTION_ADMIN', v_lain);
  if v_boot_root is not null then
    perform pg_temp.c1_orang('badmin', 'INSTITUTION_ADMIN', v_boot_root);
    perform pg_temp.c1_orang('bkadep', 'HEAD_OF_DEPARTMENT', v_boot_root);
  end if;
end $f$;
-- a learner of this suite's class
create function pg_temp.c1_murid(p_nama text)
returns void language plpgsql as $f$
declare v_u uuid; v_p uuid; v_e uuid; v_k uuid := current_setting('c1.kelas_lama')::uuid;
begin
  perform selftest.as_owner();
  v_u := selftest.f06p10_person('c1w-murid-' || p_nama || '-' || current_setting('c1.tag'));
  select a.person_id into v_p from public.accounts a where a.auth_user_id = v_u;
  insert into public.enrollments (person_id, institution_id, academic_period_id, programme_id, status)
  select v_p, e.institution_id, e.academic_period_id, e.programme_id, 'ACTIVE'
    from public.memberships mm join public.enrollments e on e.id = mm.enrollment_id
   where mm.node_id = v_k and mm.valid_to is null limit 1
  returning id into v_e;
  insert into public.memberships (enrollment_id, node_id, academic_period_id)
  select v_e, current_setting('c1.kelas')::uuid, e.academic_period_id from public.enrollments e where e.id = v_e;
  perform set_config('c1.u_' || p_nama, v_u::text, true);
  perform set_config('c1.p_' || p_nama, v_p::text, true);
end $f$;
-- a package uploaded, reviewed, locked and published by the cycle school's seeded people; its pass mark set
create function pg_temp.c1_paket(p_nama text)
returns void language plpgsql as $f$
declare r record;
begin
  select * into r from selftest.f13_release(current_setting('c1.inst')::uuid,
    selftest.f13_paket('C1W ' || p_nama || ' ' || current_setting('c1.tag'), 3, 2, false));
  perform selftest.pass_mark(current_setting('c1.inst')::uuid, r.course);
  perform set_config('c1.' || p_nama, r.course::text, true);
  perform set_config('c1.' || p_nama || '_rel', r.release::text, true);
  perform selftest.as_owner();
end $f$;
-- a draft from an upload, by this suite's teacher
create function pg_temp.c1_draf(p_nama text)
returns void language plpgsql as $f$
declare v_b uuid; v jsonb;
begin
  perform selftest.as_user_uid(current_setting('c1.u_guru')::uuid);
  v_b := selftest.f11_batch(current_setting('c1.inst')::uuid, 'STRUCTURED_PACKAGE',
    selftest.f13_paket('C1W draf ' || p_nama || ' ' || current_setting('c1.tag'), 3, 2, false));
  perform public.prepare_ingest_batch(v_b);
  v := public.confirm_ingest_batch(v_b);
  if (v ->> 'ok')::boolean is not true then raise exception 'the draft did not materialise: %', left(v::text, 200); end if;
  perform set_config('c1.' || p_nama, v -> 'courses' ->> 0, true);
  perform selftest.as_owner();
end $f$;
-- the rest of the lifecycle of a course already at INGESTED or STRUCTURED, by the seeded people
create function pg_temp.c1_terbitkan(p_course uuid)
returns uuid language plpgsql as $f$
declare v_rel uuid; v jsonb; r record; c public.courses;
begin
  select * into c from public.courses where id = p_course;
  perform selftest.as_user('siklus-guru@synthetic.pintar.test');
  if c.status = 'INGESTED' then perform selftest.f12_advance(p_course, 'STRUCTURED'); end if;
  perform selftest.f12_advance(p_course, 'VALIDATED');
  perform selftest.f12_advance(p_course, 'IN_REVIEW');
  perform selftest.as_user('siklus-kaprodi@synthetic.pintar.test');
  perform selftest.f12_advance(p_course, 'APPROVED');
  perform selftest.as_user('siklus-admin@synthetic.pintar.test');
  v_rel := (public.create_release(p_course) ->> 'release')::uuid;
  perform selftest.as_user('siklus-kaprodi@synthetic.pintar.test');
  v := public.freeze_release(v_rel);
  if (v ->> 'ok')::boolean is not true then raise exception 'the release did not freeze: %', left(v::text, 200); end if;
  for r in select x.id from public.mcq_quality_findings x where x.course_id = p_course and x.acknowledged_at is null loop
    perform public.acknowledge_finding('MCQ_QUALITY', r.id, 'C1W');
  end loop;
  for r in select x.id from public.coaching_findings x where x.course_id = p_course and x.acknowledged_at is null loop
    perform public.acknowledge_finding('COACHING', r.id, 'C1W');
  end loop;
  perform selftest.as_user('siklus-admin@synthetic.pintar.test');
  perform public.publish_release(v_rel);
  perform selftest.as_owner();
  return v_rel;
end $f$;
-- a release given to this suite's class by its teacher
create function pg_temp.c1_beri(p_nama text)
returns void language plpgsql as $f$
declare v jsonb;
begin
  perform selftest.as_user_uid(current_setting('c1.u_guru')::uuid);
  v := public.assign_release(current_setting('c1.' || p_nama || '_rel')::uuid, current_setting('c1.kelas')::uuid, now(), null);
  perform selftest.as_owner();
  perform set_config('c1.' || p_nama || '_la', v ->> 'learning_assignment', true);
  perform set_config('c1.' || p_nama || '_pre', v ->> 'pre_assignment', true);
  perform set_config('c1.' || p_nama || '_post', v ->> 'post_assignment', true);
end $f$;
-- a learner sits an assessment: every question answered right (or wrong), handed in when p_selesai
create function pg_temp.c1_duduk(p_murid text, p_aa uuid, p_benar boolean, p_selesai boolean, p_kunci text)
returns void language plpgsql as $f$
declare v_s uuid; r record;
begin
  perform selftest.as_user_uid(current_setting('c1.u_' || p_murid)::uuid);
  v_s := public.start_learning_session(p_aa);
  for r in select p.id from public.presented_items p where p.session_id = v_s order by p.position loop
    perform public.record_answer(r.id, 1, selftest.f09_answer(r.id, p_benar));
  end loop;
  if p_selesai then perform public.finish_my_session(v_s); end if;
  perform selftest.as_owner();
  perform set_config('c1.' || p_kunci, v_s::text, true);
end $f$;
create function pg_temp.c1_kursus(p_item uuid)
returns uuid language sql security definer as $f$
  select m.course_id from public.items i join public.lessons l on l.id = i.lesson_id join public.modules m on m.id = l.module_id where i.id = p_item
$f$;
-- a question of a course by its stem's beginning
create function pg_temp.c1_item(p_course uuid, p_stem text)
returns uuid language sql security definer as $f$
  select i.id from public.items i join public.lessons l on l.id = i.lesson_id join public.modules m on m.id = l.module_id
   where m.course_id = p_course and i.stem like p_stem || '%' order by i.created_at, i.id limit 1
$f$;
create function pg_temp.c1_soal_json(p_stem text, p_kunci text, p_n int, p_kosong text)
returns jsonb language sql as $f$
  select jsonb_build_object('stem', p_stem, 'options', coalesce(jsonb_agg(jsonb_build_object(
           'label', l, 'body', case when l = p_kosong then '' else 'Pilihan ' || l || ' untuk soal ini' end,
           'is_correct', l = any (string_to_array(p_kunci, ',')), 'rationale', 'Alasan pilihan ' || l || '.') order by l), '[]'::jsonb))
    from unnest((array['A', 'B', 'C', 'D', 'E', 'F'])[1:p_n]) l
$f$;
-- a sitting's evidence and an item's content, as fingerprints
create function pg_temp.c1_sidik_sesi(p_s uuid)
returns text language sql as $f$
  select md5(coalesce((select string_agg(to_jsonb(r)::text, '|' order by r.id) from public.responses r where r.session_id = p_s), '')
          || '#' || coalesce((select string_agg(to_jsonb(p)::text, '|' order by p.id) from public.presented_items p where p.session_id = p_s), '')
          || '#' || coalesce((select to_jsonb(r)::text from public.assessment_results r where r.session_id = p_s and r.supersedes_result_id is null), ''))
$f$;
create function pg_temp.c1_sidik_kursus(p_course uuid)
returns text language sql as $f$
  select md5(coalesce((select string_agg(to_jsonb(i)::text || coalesce((select string_agg(to_jsonb(o)::text, ',' order by o.label) from public.item_options o where o.item_id = i.id), ''), '|' order by i.id)
                  from public.items i join public.lessons l on l.id = i.lesson_id join public.modules m on m.id = l.module_id where m.course_id = p_course), '')
          || '#' || coalesce((select r.content_sha256 from public.plp_releases r where r.course_id = p_course), '')
          || '#' || coalesce((select public.course_content_sha256(p_course)), ''))
$f$;
-- the bootstrap learner sits its Uji Penguasaan: every safety-critical question right, three right in all, the rest wrong
create function pg_temp.c1_boot_campur()
returns uuid language plpgsql as $f$
declare v_aa uuid; v_s uuid; r record; n int := 0; v_benar boolean;
begin
  perform selftest.as_user('boot-siswa@bootstrap.pintar.test');
  select m.post_test_assignment into v_aa from public.my_learning_assignments() m limit 1;
  perform selftest.pre_finished_for(v_aa);
  v_s := public.start_learning_session(v_aa);
  perform selftest.as_owner();
  for r in select p.id, i.is_safety_critical from public.presented_items p join public.items i on i.id = p.item_id
            where p.session_id = v_s order by i.is_safety_critical desc, p.position loop
    v_benar := r.is_safety_critical or n < 3;
    if v_benar then n := n + 1; end if;
    perform selftest.as_user('boot-siswa@bootstrap.pintar.test');
    perform public.record_answer(r.id, 1, selftest.f09_answer(r.id, v_benar));
    perform selftest.as_owner();
  end loop;
  perform selftest.as_user('boot-siswa@bootstrap.pintar.test');
  perform public.finish_my_session(v_s);
  perform selftest.as_owner();
  return v_s;
end $f$;
create temp table c1_snap (v jsonb) on commit drop;
do $c1$
declare v jsonb := '{}'::jsonb;
begin
  perform pg_temp.c1_dunia();
  ${badan.join("\n  ")}
  perform selftest.as_owner();
  insert into c1_snap values (v);
end $c1$;
select 'C1' || chr(9) || v::text from c1_snap;
rollback;
`;
}

function jalankan(c: Checks, repoRoot: string, badan: string[]): Record<string, string> | null {
  const gagal = siapkan(repoRoot);
  if (!c.expect(gagal === null, gagal ?? "")) return null;
  const r = spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-At", "-c", skenario(badan), db()], { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
  const pesan = (r.stderr || "").trim().split("\n").find((l) => /ERROR/.test(l)) ?? (r.stderr || "").trim().split("\n").pop();
  if (!c.expect(r.status === 0, `the scenario could not run: ${pesan}`)) return null;
  for (const l of r.stdout.split("\n")) {
    const [k, v] = l.split("\t");
    if (k === "C1" && v) return JSON.parse(v) as Record<string, string>;
  }
  c.expect(false, "the database half returned no snapshot");
  return null;
}

const audit = (aksi: string, target: string, lagi = "true") =>
  `select count(*) from public.audit_log l where l.action = '${aksi}' and l.target_id = (${target})::text and ${lagi}`;

// the key correction's acts
const ajukan = (it: string, kunci: string, alasan = ALASAN) => `select public.ajukan_koreksi_kunci(${it}, array['${kunci}'], '${alasan}') ->> 'koreksi'`;
const simpanKoreksi = (nama: string, it: string, kunci: string) =>
  `perform set_config('c1.${nama}', (select k.id::text from public.key_corrections k where k.item_id = public.soal_ujung(${it}) and k.status = 'PENDING' and k.key_after = array['${kunci}']), true);`;
const tegaskan = (k: string) => `select public.tegaskan_koreksi_kunci(${G(k)})::text`;
const hasilRingkas = (s: string) =>
  `select count(*) || '|' || count(*) filter (where not exists (select 1 from public.assessment_results x where x.supersedes_result_id = r.id))
          || '|' || (select r2.mastery from public.assessment_results r2 where r2.id = public.hasil_terkini_id(${G(s)}))
     from public.assessment_results r where r.session_id = ${G(s)}`;

/**
 * Removes C1W-C01's committed world: the package's whole line (the corrections' revisions too), its releases, tests,
 * questions, the class's assignment, every sitting on them with its evidence, and the corrections. The harness owns
 * these tables and is never present in production; triggers are off for the length of the deletes (replica), so every
 * child is deleted explicitly and the last line counts what still references a removed row (0, or the test fails).
 */
export function bersihkan(course: string): string {
  const di = (t: string) => `(select id from ${t})`;
  return `
begin;
set local session_replication_role = replica;
create temp table k_course on commit drop as select c.course_id as id from public.course_lineage_chain('${course}') c;
create temp table k_mod on commit drop as select m.id from public.modules m where m.course_id in ${di("k_course")};
create temp table k_les on commit drop as select l.id from public.lessons l where l.module_id in ${di("k_mod")};
create temp table k_item on commit drop as select i.id from public.items i where i.lesson_id in ${di("k_les")};
create temp table k_rel on commit drop as select r.id from public.plp_releases r where r.course_id in ${di("k_course")};
create temp table k_def on commit drop as select d.id from public.assessment_definitions d where d.course_id in ${di("k_course")} or d.module_id in ${di("k_mod")};
create temp table k_la on commit drop as select la.id from public.learning_assignments la where la.plp_release_id in ${di("k_rel")} or la.course_id in ${di("k_course")};
create temp table k_aa on commit drop as select aa.id from public.assessment_assignments aa where aa.learning_assignment_id in ${di("k_la")} or aa.assessment_definition_id in ${di("k_def")};
create temp table k_s on commit drop as select s.id from public.assessment_sessions s
  where s.plp_release_id in ${di("k_rel")} or s.assessment_definition_id in ${di("k_def")} or s.learning_assignment_id in ${di("k_la")};
create temp table k_pi on commit drop as select p.id from public.presented_items p where p.session_id in ${di("k_s")};
create temp table k_kc on commit drop as select k.id from public.key_corrections k where k.line_root_course_id in ${di("k_course")};
delete from public.key_correction_notices where key_correction_id in ${di("k_kc")};
delete from public.certificate_reviews where session_id in ${di("k_s")};
delete from public.assessment_result_bases where session_id in ${di("k_s")};
delete from public.assessment_results where session_id in ${di("k_s")};
delete from telemetry.assistance_events where session_id in ${di("k_s")};
delete from telemetry.hesitation_events where session_id in ${di("k_s")};
delete from public.assistance_grants where session_id in ${di("k_s")};
delete from public.attempt_requests where session_id in ${di("k_s")};
delete from public.evidence_class_overrides where session_id in ${di("k_s")};
delete from public.integrity_signals where session_id in ${di("k_s")};
delete from public.result_views where session_id in ${di("k_s")};
delete from public.presented_item_views where session_id in ${di("k_s")};
delete from public.responses where session_id in ${di("k_s")};
delete from public.presented_items where id in ${di("k_pi")};
delete from public.assessment_sessions where id in ${di("k_s")};
delete from public.learning_assignment_release_moves where learning_assignment_id in ${di("k_la")};
delete from public.assessment_assignments where id in ${di("k_aa")};
delete from public.learning_assignments where id in ${di("k_la")};
delete from public.key_corrections where id in ${di("k_kc")};
delete from public.release_distributions where plp_release_id in ${di("k_rel")};
delete from public.lesson_progress where plp_release_id in ${di("k_rel")};
update public.plp_releases set replaced_by_release_id = null, replaced_at = null, supersedes_release_id = null where id in ${di("k_rel")};
delete from public.plp_releases where id in ${di("k_rel")};
delete from public.quick_assessment_selections where definition_id in ${di("k_def")} or item_id in ${di("k_item")};
delete from public.mcq_quality_findings where course_id in ${di("k_course")};
delete from public.coaching_findings where course_id in ${di("k_course")};
delete from public.question_health where item_id in ${di("k_item")};
delete from public.item_options where item_id in ${di("k_item")};
update public.items set supersedes_item_id = null where id in ${di("k_item")};
delete from public.items where id in ${di("k_item")};
delete from public.learning_objectives where lesson_id in ${di("k_les")};
delete from public.lessons where id in ${di("k_les")};
delete from public.assessment_definitions where id in ${di("k_def")};
delete from public.modules where id in ${di("k_mod")};
delete from public.course_revision_notes where course_id in ${di("k_course")} or supersedes_course_id in ${di("k_course")};
delete from public.content_review_outcomes where course_id in ${di("k_course")};
delete from public.school_pass_marks where course_id in ${di("k_course")};
delete from public.certificate_templates where course_id in ${di("k_course")};
update public.ingest_batches set revises_course_id = null where revises_course_id in ${di("k_course")};
update public.courses set supersedes_course_id = null where id in ${di("k_course")};
delete from public.courses where id in ${di("k_course")};
select (select count(*) from public.items where lesson_id in ${di("k_les")} or supersedes_item_id in ${di("k_item")})
     + (select count(*) from public.item_options where item_id in ${di("k_item")})
     + (select count(*) from public.presented_items where item_id in ${di("k_item")} or session_id in ${di("k_s")})
     + (select count(*) from public.responses where presented_item_id in ${di("k_pi")})
     + (select count(*) from public.assessment_sessions where id in ${di("k_s")} or assessment_assignment_id in ${di("k_aa")} or plp_release_id in ${di("k_rel")})
     + (select count(*) from public.assessment_results where session_id in ${di("k_s")})
     + (select count(*) from public.assessment_definitions where id in ${di("k_def")} or course_id in ${di("k_course")} or module_id in ${di("k_mod")})
     + (select count(*) from public.assessment_assignments where assessment_definition_id in ${di("k_def")} or learning_assignment_id in ${di("k_la")})
     + (select count(*) from public.learning_assignments where plp_release_id in ${di("k_rel")} or course_id in ${di("k_course")})
     + (select count(*) from public.plp_releases where course_id in ${di("k_course")} or supersedes_release_id in ${di("k_rel")} or replaced_by_release_id in ${di("k_rel")})
     + (select count(*) from public.modules where course_id in ${di("k_course")})
     + (select count(*) from public.lessons where module_id in ${di("k_mod")})
     + (select count(*) from public.learning_objectives where lesson_id in ${di("k_les")})
     + (select count(*) from public.key_corrections where id in ${di("k_kc")} or release_id in ${di("k_rel")} or item_id in ${di("k_item")})
     + (select count(*) from public.courses where supersedes_course_id in ${di("k_course")} or id in ${di("k_course")});
commit;`;
}

export const c1wTests: SelfTest[] = [
  {
    id: "C1W-K01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const baca = (f: string) => { try { return readFileSync(join(repoRoot, f), "utf8"); } catch { return ""; } };
      const a = baca(MIGRASI_A), b = baca(MIGRASI_B);
      if (!c.expect(a.length > 0 && b.length > 0, `${MIGRASI_A} or ${MIGRASI_B} does not exist`)) return c.verdict("");
      const periksa = (sql: string, raiser: string, db: readonly string[], semua: readonly string[], kunci: (k: string) => string, gagal: string, err: string) => {
        const blok = new RegExp(`create or replace function public\\.${raiser}[\\s\\S]*?end \\$\\$;`).exec(sql)?.[0] ?? "";
        const kode = [...blok.matchAll(/when '([A-Z_]+)'/g)].map((x) => x[1]);
        c.expect(kode.length >= 10, `${raiser} names ${kode.length} code(s)`);
        const dipakai = new Set([...(a + b).matchAll(new RegExp(`${raiser}\\('([A-Z_]+)'\\)`, "g"))].map((x) => x[1]));
        for (const k of dipakai) c.expect(kode.includes(k), `${k} is raised by ${raiser} without a message of its own`);
        for (const k of kode) {
          c.expect(db.includes(k), `${raiser} raises ${k}, which the screens' contract does not know`);
          c.expect(dipakai.has(k), `${k} has a message in ${raiser} and is raised nowhere`);
        }
        for (const k of db) c.expect(kode.includes(k), `the contract names ${k}, which ${raiser} does not raise`);
        c.expect(new RegExp(`errcode = '${err}'`).test(blok), `${raiser} does not raise ${err}`);
        for (const k of semua) {
          const id = t(kunci(k) as never, "staff"), en = t(kunci(k) as never, "staff", { locale: "en" });
          c.expect(id.length > 10 && en.length > 10 && id !== en, `${k} has no sentence in both languages («${id}» / «${en}»)`);
        }
        c.expect(semua.includes(gagal), `the contract has no fallback ${gagal}`);
      };
      periksa(a, "soal_tolak", KODE_SOAL_DB, KODE_SOAL, (k) => kunciKodeSoal(k as never), "DRAFT_FAILED", "PR180");
      periksa(b, "koreksi_tolak", KODE_KOREKSI_DB, KODE_KOREKSI, (k) => kunciKodeKoreksi(k as never), "CORRECTION_FAILED", "PR190");
      for (const k of [...MASALAH_SOAL_SENDIRI]) {
        c.expect(new RegExp(`'code', '${k}'`).test(a), `the editor's problem ${k} is not returned by the migration`);
        c.expect(t(kunciMasalahSoal(k), "staff") !== t(kunciMasalahSoal(k), "staff", { locale: "en" }), `${k} has no sentence of its own`);
      }
      for (const k of KODE_IDENTITAS_SOAL) {
        c.expect(new RegExp(`package_problem\\('${k}'`).test(a), `the identity problem ${k} is not returned by the migration`);
        c.expect(t(kunciMasalahIdentitas(k), "staff").length > 10 && t(kunciMasalahIdentitas(k), "staff") !== t(kunciMasalahIdentitas(k), "staff", { locale: "en" }),
          `${k} has no sentence in both languages`);
      }
      c.expect(kodeSoalDariGalat({ code: "PR180", details: "DRAFT_EDIT_CONFLICT" }) === "DRAFT_EDIT_CONFLICT"
        && kodeSoalDariGalat({ code: "PR190", details: "DRAFT_EDIT_CONFLICT" }) === "DRAFT_FAILED" && kodeSoalDariGalat(null) === "DRAFT_FAILED"
        && kodeKoreksiDariGalat({ code: "PR190", details: "CORRECTION_OWN_PROPOSAL" }) === "CORRECTION_OWN_PROPOSAL"
        && kodeKoreksiDariGalat({ code: "PR180", details: "CORRECTION_OWN_PROPOSAL" }) === "CORRECTION_FAILED",
        "a refusal is not read by its own SQLSTATE and DETAIL alone");
      // Sharon, blocker 2: recompute_result is not widened; the governed recalculation is its own function
      c.expect(!/function public\.recompute_result/.test(a + b), "a C1w migration redefines recompute_result");
      c.expect(/create or replace function public\.hitung_ulang_koreksi_kunci/.test(b)
        && !/grant execute on function public\.hitung_ulang_koreksi_kunci/.test(b), "the governed recalculation is missing or callable by a client");
      const klien: Array<[string, string]> = [
        [a, "ubah_soal_draf"], [a, "tambah_soal_draf"], [a, "hapus_soal_draf"], [a, "buang_draf"], [a, "suntingan_draf"],
        [a, "unggah_menimpa_suntingan"], [a, "revisi_soal"], [a, "riwayat_soal"], [a, "keadaan_terbitan"],
        [b, "ajukan_koreksi_kunci"], [b, "tolak_koreksi_kunci"], [b, "tegaskan_koreksi_kunci"], [b, "koreksi_kunci_dampak"],
        [b, "koreksi_kunci_antrean"], [b, "hasil_koreksi_saya"], [b, "riwayat_hasil_sesi"], [b, "sertifikat_saya_ditinjau"],
        [b, "putuskan_tinjauan_sertifikat"], [b, "tinjauan_sertifikat_antrean"], [b, "pemberitahuan_koreksi_kunci"],
      ];
      for (const [sql, f] of klien) {
        c.expect(new RegExp(`\\('${f}', '(STAFF|LEARNER)'`).test(sql), `${f} is not declared in client_rpc_registry`);
        c.expect(new RegExp(`revoke all on function public\\.${f}\\([^)]*\\) from public, anon, authenticated;`).test(sql), `${f} is not revoked from public and anon`);
      }
      c.expect(/create table public\.certificate_reviews/.test(b) && !/alter table public\.certificates/.test(b) && !/alter type public\.certificate_status/.test(b),
        "the certificate review is not a side record, or the certificate itself is altered");
      return c.verdict("every code soal_tolak (PR180) and koreksi_tolak (PR190) raises is the contract's, each with its Indonesian and English sentence, "
        + "as are the editor's two problems and the identity column's five; recompute_result is not redefined and the governed recalculation is no client's; "
        + "every client entry is declared and revoked from the signed-out role; the certificate review is a side record");
    },
  },
  {
    id: "C1W-S01",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const X = item("d1", "Pertanyaan awal nomor 1");
      const L: string[] = [
        `perform pg_temp.c1_draf('d1');`, `perform pg_temp.c1_draf('d2');`, `perform pg_temp.c1_paket('p1');`,
        // a save, attributed
        langkah("simpan", "guru", `select (x ->> 'ok') || '|' || (x ->> 'revisi') || '|' || (x -> 'perubahan' -> 'key')::text || '|' || (x -> 'perubahan' ? 'stem')
           from public.ubah_soal_draf(${X}, 1, ${soal("Pertanyaan awal nomor 1 yang sudah diperbaiki?", "B")}) x`),
        langkah("simpan_cek", null, `select i.revision || '|' || (i.edited_by_person_id = ${G("p_guru")}) || '|' || (i.edited_at is not null) || '|' || i.stem
             || '|' || array_to_string(public.soal_kunci(i.id), ',') from public.items i where i.id = ${X}`),
        langkah("simpan_jejak", null, `select count(*) from public.item_draft_edits e where e.item_id = ${X} and e.action = 'ITEM_EDITED'
             and e.by_person_id = ${G("p_guru")} and e.revision_from = 1 and e.revision_to = 2 and e.changed -> 'key' = '{"from": ["A"], "to": ["B"]}'::jsonb
             and not (e.changed::text like '%diperbaiki%')`),
        langkah("simpan_audit", null, audit("content.item_edited", X, `l.actor_person_id = ${G("p_guru")} and (l.summary -> 'to' ->> 'revision')::int = 2`)),
        // two authors on one draft: the second save, made on what it read before the first, is refused
        langkah("bentrok", "guru2", `select public.ubah_soal_draf(${X}, 1, ${soal("Pertanyaan yang ditulis orang kedua?", "A")}) ->> 'ok'`),
        langkah("bentrok_cek", null, `select i.revision || '|' || i.stem from public.items i where i.id = ${X}`),
        // every problem at once, nothing written
        langkah("dua_kunci", "guru", `select string_agg(m ->> 'code', ',' order by m ->> 'code') from jsonb_array_elements(public.ubah_soal_draf(${X}, 2, ${soal("Soal dengan dua kunci?", "A,B", 3)}) -> 'masalah') m`),
        langkah("kosong", "guru", `select string_agg((m ->> 'code') || ':' || coalesce(m ->> 'label', ''), ',') from jsonb_array_elements(public.ubah_soal_draf(${X}, 2, ${soal("Soal dengan pilihan kosong?", "A", 3, "C")}) -> 'masalah') m`),
        langkah("satu", "guru", `select string_agg(m ->> 'code', ',') from jsonb_array_elements(public.ubah_soal_draf(${X}, 2, ${soal("Soal dengan satu pilihan?", "A", 1)}) -> 'masalah') m`),
        langkah("enam", "guru", `select string_agg(distinct m ->> 'code', ',') from jsonb_array_elements(public.ubah_soal_draf(${X}, 2, ${soal("Soal dengan enam pilihan?", "A", 6)}) -> 'masalah') m`),
        langkah("tanpa_kunci", "guru", `select string_agg(m ->> 'code', ',') from jsonb_array_elements(public.ubah_soal_draf(${X}, 2, ${soal("Soal tanpa kunci?", "", 2)}) -> 'masalah') m`),
        langkah("masalah_cek", null, `select i.revision from public.items i where i.id = ${X}`),
        // another school, and a learner-less outsider
        langkah("lain", "lain", `select public.ubah_soal_draf(${X}, 2, ${soal("Soal dari sekolah lain?", "A")}) ->> 'ok'`),
        // add and remove
        langkah("tambah", "guru", `select (x ->> 'ok') || '|' || (x ->> 'revisi') from public.tambah_soal_draf((select i.lesson_id from public.items i where i.id = ${X}), ${soal("Soal latihan baru yang ditambahkan?", "A")}) x`),
        langkah("tambah_tes", "guru", `select (public.tambah_soal_draf((select i.lesson_id from public.items i where i.id = ${X}), ${soal("Soal Pemetaan Awal tambahan?", "B")} || '{"use": "PRE_TEST"}'::jsonb)) ->> 'ok'`),
        langkah("tambah_cek", null, `select (select count(*) from public.items i join public.lessons l on l.id = i.lesson_id join public.modules m on m.id = l.module_id where m.course_id = ${G("d1")})
             || '|' || (select d.item_count from public.assessment_definitions d where d.course_id = ${G("d1")} and d.mode = 'PRE_TEST')
             || '|' || (select string_agg(i.status::text, ',') from public.items i where i.stem like 'Soal%tambah%' and pg_temp.c1_kursus(i.id) = ${G("d1")})`),
        langkah("hapus", "guru", `select public.hapus_soal_draf(${item("d1", "Soal latihan baru")}, 1) ->> 'ok'`),
        langkah("hapus_cek", null, `select count(*) || '|' || (select count(*) from public.item_draft_edits e where e.course_id = ${G("d1")} and e.action = 'ITEM_REMOVED')
             from public.items i where pg_temp.c1_kursus(i.id) = ${G("d1")} and i.stem like 'Soal latihan baru%'`),
        // a checked draft that is edited goes back to be checked
        lakukan("guru", `select selftest.f12_advance(${G("d1")}, 'STRUCTURED')`),
        lakukan("guru", `select selftest.f12_advance(${G("d1")}, 'VALIDATED')`),
        langkah("periksa_lagi", "guru", `select (x ->> 'ok') || '|' || (x ->> 'kembali_ke_periksa') from public.ubah_soal_draf(${X}, 2, ${soal("Pertanyaan awal nomor 1, diperbaiki lagi?", "B")}) x`),
        langkah("periksa_cek", null, `select c.status::text || '|' || (select count(distinct i.status) from public.items i where pg_temp.c1_kursus(i.id) = c.id) || '|'
             || (select string_agg(distinct i.status::text, ',') from public.items i where pg_temp.c1_kursus(i.id) = c.id) from public.courses c where c.id = ${G("d1")}`),
        // submitted: refused; sent back: edited again
        lakukan("guru", `select selftest.f12_advance(${G("d1")}, 'VALIDATED')`),
        langkah("periksa_mentah", "guru", `select public.langkah_konten(${G("d1")}, 'STRUCTURED')`),
        lakukan("guru", `select selftest.f12_advance(${G("d1")}, 'IN_REVIEW')`),
        langkah("diajukan", "guru", `select public.ubah_soal_draf(${X}, 3, ${soal("Diubah saat ditinjau?", "B")}) ->> 'ok'`),
        langkah("diajukan_buang", "guru", `select public.buang_draf(${G("d1")}) ->> 'ok'`),
        lakukan("kadep", `select public.kembalikan_paket(${G("d1")}, 'Mohon perbaiki soal nomor satu terlebih dahulu.')`),
        langkah("dikembalikan", "guru", `select public.ubah_soal_draf(${X}, 3, ${soal("Pertanyaan awal nomor 1 setelah dikembalikan?", "B")}) ->> 'ok'`),
        // a sealed package: refused
        langkah("tersegel", "guru", `select public.ubah_soal_draf(${item("p1", "Pertanyaan awal nomor 1")}, 1, ${soal("Diubah setelah terbit?", "B")}) ->> 'ok'`),
        langkah("tersegel_buang", "guru", `select public.buang_draf(${G("p1")}) ->> 'ok'`),
        // discard: a fresh draft goes whole; a sent-back one keeps its emptied row for the review outcome that names it
        langkah("buang_lain", "lain", `select public.buang_draf(${G("d2")}) ->> 'ok'`),
        langkah("buang", "guru", `select (x ->> 'ok') || '|' || (x ->> 'catatan_disimpan') from public.buang_draf(${G("d2")}, 'Draf ini tidak dipakai.') x`),
        langkah("buang_cek", null, `select (select count(*) from public.courses c where c.id = ${G("d2")}) || '|'
             || (select count(*) from public.modules m where m.course_id = ${G("d2")}) || '|'
             || (select count(*) from public.assessment_definitions d where d.course_id = ${G("d2")}) || '|'
             || (select count(*) from public.audit_log l where l.action = 'content.draft_discarded' and l.target_id = ${S("d2")} and l.actor_person_id = ${G("p_guru")}) || '|'
             || (select count(*) from public.item_draft_edits e where e.course_id = ${G("d2")} and e.action = 'DRAFT_DISCARDED' and e.note = 'Draf ini tidak dipakai.')`),
        langkah("buang_kembali", "guru", `select (x ->> 'ok') || '|' || (x ->> 'catatan_disimpan') from public.buang_draf(${G("d1")}) x`),
        langkah("buang_kembali_cek", null, `select (c.discarded_at is not null) || '|' || (c.discarded_by_person_id = ${G("p_guru")}) || '|'
             || (select count(*) from public.modules m where m.course_id = c.id) || '|' || (select count(*) from public.items i where i.id = ${X})
             || '|' || (select count(*) from public.item_draft_edits e where e.course_id = c.id) from public.courses c where c.id = ${G("d1")}`),
        langkah("buang_lagi", "guru", `select public.ubah_soal_draf(${X}, 4, ${soal("Setelah dibuang?", "B")}) ->> 'ok'`),
      ];
      const m = jalankan(c, repoRoot, L);
      if (!m) return c.verdict("");
      const harap = (k: string, h: string, apa: string) => c.expect(m[k] === h, `${apa}: answered ${m[k]}; expected ${h}`);
      harap("simpan", 'ok:true|2|{"to": ["B"], "from": ["A"]}|true', "the teacher's save of the stem and the key");
      harap("simpan_cek", "ok:2|true|true|Pertanyaan awal nomor 1 yang sudah diperbaiki?|B", "the question after the save (revision, who, when, stem, key)");
      harap("simpan_jejak", "ok:1", "the save's attribution row (who, revision 1 to 2, the key's labels, no text)");
      harap("simpan_audit", "ok:1", "the save's audit row");
      harap("bentrok", "PR180:DRAFT_EDIT_CONFLICT", "a second author's save over what they read before the first");
      harap("bentrok_cek", "ok:2|Pertanyaan awal nomor 1 yang sudah diperbaiki?", "the question after the refused second save (never overwritten)");
      harap("dua_kunci", "ok:ITEM_CORRECT_TOO_MANY", "two keys on a single-answer question");
      harap("kosong", "ok:OPTION_TEXT_MISSING:C", "an empty option");
      harap("satu", "ok:ITEM_OPTIONS_TOO_FEW", "one option");
      harap("enam", "ok:ITEM_OPTIONS_TOO_MANY,OPTION_LABEL_INVALID", "six options");
      harap("tanpa_kunci", "ok:ITEM_CORRECT_MISSING", "no key");
      harap("masalah_cek", "ok:2", "the revision after the five refused saves (nothing written)");
      harap("lain", "PR180:DRAFT_NOT_ALLOWED", "another school's administrator editing the draft");
      harap("tambah", "ok:true|1", "the teacher adding a practice question");
      harap("tambah_tes", "ok:true", "the teacher adding a question to the Pemetaan Awal");
      harap("tambah_cek", "ok:8|4|INGESTED,INGESTED", "the draft's questions, its Pemetaan Awal's count and the new questions' state");
      harap("hapus", "ok:true", "the teacher removing a question");
      harap("hapus_cek", "ok:0|1", "the removed question and its attribution row");
      harap("periksa_lagi", "ok:true|true", "an edit of a checked draft");
      harap("periksa_cek", "ok:STRUCTURED|1|STRUCTURED", "a checked draft after an edit (back to be checked, as one package)");
      c.expect(/^P0001:illegal content transition VALIDATED -> STRUCTURED/.test(m.periksa_mentah ?? ""), `the editor's own edge taken outside the editor: ${m.periksa_mentah}`);
      harap("diajukan", "PR180:DRAFT_SUBMITTED", "an edit while the package is with its reviewer");
      harap("diajukan_buang", "PR180:DRAFT_SUBMITTED", "a discard while the package is with its reviewer");
      harap("dikembalikan", "ok:true", "an edit after the reviewer sent the package back");
      harap("tersegel", "PR180:DRAFT_SEALED", "an edit of a published package's question");
      harap("tersegel_buang", "PR180:DRAFT_SEALED", "discarding a published package");
      harap("buang_lain", "PR180:DRAFT_NOT_ALLOWED", "another school's administrator discarding the draft");
      harap("buang", "ok:true|false", "discarding a fresh draft");
      harap("buang_cek", "ok:0|0|0|1|1", "after the discard: no course, no modules, no tests; its audit row and its attribution row");
      harap("buang_kembali", "ok:true|true", "discarding a sent-back draft");
      harap("buang_kembali_cek", "ok:true|true|0|0|7", "the sent-back draft after the discard (its row kept for its history, emptied; its attribution rows)");
      harap("buang_lagi", "PR180:DRAFT_UNKNOWN", "an edit of a discarded draft");
      return c.verdict("a draft is edited in the app by its school's author: each save attributed (who, when, what by name, never the text) and audited; a "
        + "second author's save over a stale read is refused and nothing is overwritten; every validation problem comes back at once and nothing is "
        + "written (two keys, an empty option, one or six options, no key); another school is refused; a question is added (practice, or to a test whose "
        + "count follows) and removed; a checked draft that is edited goes back to be checked, the edge refused outside the editor; refused once "
        + "submitted, edited again once sent back; refused on a published package; a discarded draft leaves its audit and attribution rows and no content");
    },
  },
  {
    id: "C1W-S02",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      // a corrected package naming, for each question, the question it revises (by matching stems in `asal`)
      const dengan = (judul: string, asal: string, pilih = "i.stem = x ->> 'stem'") => `(select jsonb_set(pk, '{courses,0,modules,0,lessons,0,items}',
          (select jsonb_agg(case when (select i.id from public.items i where pg_temp.c1_kursus(i.id) = ${G(asal)} and ${pilih} limit 1) is null then x
                                 else x || jsonb_build_object('identity', (select i.id from public.items i where pg_temp.c1_kursus(i.id) = ${G(asal)} and ${pilih} limit 1)) end
                             order by ord)
             from jsonb_array_elements(pk -> 'courses' -> 0 -> 'modules' -> 0 -> 'lessons' -> 0 -> 'items') with ordinality as t(x, ord)))
          from (select selftest.f13_paket('${judul}', 3, 2, false) as pk) z)`;
      const unggah = (nama: string, revisi: string | null, paket: string) => `
        perform selftest.as_user_uid(${G("u_guru")});
        insert into public.ingest_batches (institution_id, source_kind, raw_payload, revises_course_id, change_summary)
        values (${G("inst")}, 'STRUCTURED_PACKAGE', ${paket}, ${revisi ? G(revisi) : "null"}, ${revisi ? "'Soal-soal dikoreksi dari unggahan.'" : "null"})
        returning id::text into v_t;
        perform selftest.as_owner();
        perform set_config('c1.${nama}', v_t, true);`;
      const masalah = (b: string) => `select coalesce(string_agg((m ->> 'code') || '@' || coalesce(m ->> 'row', '-'), ',' order by (m ->> 'row')::int nulls first, m ->> 'code'), 'none')
          from jsonb_array_elements(public.prepare_ingest_batch(${G(b)}) -> 'problems') m where m ->> 'code' like 'ITEM_IDENTITY%' or m ->> 'code' like 'REVISION_%'`;
      const L: string[] = [
        `perform pg_temp.c1_paket('p1');`, `perform pg_temp.c1_paket('p3');`,
        // the identity column on every row: every pointer set
        unggah("b_ok", "p1", dengan("C1W koreksi p1", "p1")),
        langkah("ok_siap", "guru", `select public.prepare_ingest_batch(${G("b_ok")}) ->> 'ok'`),
        langkah("ok", "guru", `select set_config('c1.c2', public.confirm_ingest_batch(${G("b_ok")}) -> 'courses' ->> 0, true) is not null`),
        langkah("ok_cek", null, `select count(*) || '|' || count(*) filter (where i.supersedes_item_id is null) || '|'
             || count(*) filter (where (select p.stem from public.items p where p.id = i.supersedes_item_id) = i.stem and pg_temp.c1_kursus(i.supersedes_item_id) = ${G("p1")})
             from public.items i where pg_temp.c1_kursus(i.id) = ${G("c2")}`),
        // without the column: every question is new
        unggah("b_baru", "p3", `selftest.f13_paket('C1W koreksi p3 tanpa identitas', 3, 2, false)`),
        langkah("baru", "guru", `select set_config('c1.c3', public.confirm_ingest_batch(${G("b_baru")}) -> 'courses' ->> 0, true) is not null`),
        langkah("baru_cek", null, `select count(*) || '|' || count(*) filter (where i.supersedes_item_id is null) from public.items i where pg_temp.c1_kursus(i.id) = ${G("c3")}`),
        // refusals, each at its row, nothing materialised. p4: a fresh published package to revise
        `perform pg_temp.c1_paket('p4');`,
        unggah("b_lain", "p4", dengan("C1W identitas paket lain", "p3", "i.stem = x ->> 'stem' and i.stem like 'Pertanyaan awal nomor 1%'")),
        langkah("lain_paket", "guru", masalah("b_lain")),
        `perform set_config('c1.boot_item', coalesce((select i.id::text from public.items i where i.institution_id = ${G("boot")} limit 1), ''), true);`,
        unggah("b_sekolah", "p4", `(select jsonb_set(pk, '{courses,0,modules,0,lessons,0,items,0,identity}', to_jsonb(${S("boot_item")})) from (select selftest.f13_paket('C1W identitas sekolah lain', 3, 2, false) as pk) z)`),
        langkah("lain_sekolah", "guru", masalah("b_sekolah")),
        unggah("b_dua", "p4", `(select jsonb_set(jsonb_set(pk, '{courses,0,modules,0,lessons,0,items,0,identity}', to_jsonb(${item("p4", "Pertanyaan awal nomor 1")})),
             '{courses,0,modules,0,lessons,0,items,1,identity}', to_jsonb(${item("p4", "Pertanyaan awal nomor 1")})) from (select selftest.f13_paket('C1W identitas dua kali', 3, 2, false) as pk) z)`),
        langkah("dua_kali", "guru", masalah("b_dua")),
        unggah("b_tanpa", null, `(select jsonb_set(pk, '{courses,0,modules,0,lessons,0,items,0,identity}', to_jsonb(${item("p4", "Pertanyaan awal nomor 1")})) from (select selftest.f13_paket('C1W identitas tanpa pendahulu', 3, 2, false) as pk) z)`),
        langkah("tanpa", "guru", masalah("b_tanpa")),
        langkah("tolak_simpan", "guru", `select (public.confirm_ingest_batch(${G("b_dua")}) ->> 'ok') || '|' || (select count(*) from public.courses c where c.title = 'C1W identitas dua kali')`),
        // a non-predecessor version: c2 (p1's correction, sent back) is revised citing p1's own question
        lakukan("guru", `select selftest.f12_advance(${G("c2")}, 'STRUCTURED')`),
        lakukan("guru", `select selftest.f12_advance(${G("c2")}, 'VALIDATED')`),
        lakukan("guru", `select selftest.f12_advance(${G("c2")}, 'IN_REVIEW')`),
        lakukan("kadep", `select public.kembalikan_paket(${G("c2")}, 'Mohon periksa lagi soal-soal pemetaan awalnya.')`),
        langkah("ubah_c2", "guru", `select public.ubah_soal_draf(${item("c2", "Pertanyaan awal nomor 2")}, 1, ${soal("Pertanyaan awal nomor 2 diperbaiki di aplikasi?", "A")}) ->> 'ok'`),
        unggah("b_lama", "c2", dengan("C1W identitas versi lama", "p1", "i.stem = x ->> 'stem' and i.stem like 'Pertanyaan awal nomor 3%'")),
        langkah("bukan_pendahulu", "guru", masalah("b_lama")),
        // an upload over in-app edits is detectable
        langkah("menimpa", "guru", `select (x ->> 'ada') || '|' || (x ->> 'jumlah') from public.unggah_menimpa_suntingan(${G("b_lama")}) x`),
        langkah("tidak_menimpa", "guru", `select x ->> 'ada' from public.unggah_menimpa_suntingan(${G("b_lain")}) x`),
        // no lineage pointer crosses owners, whatever path writes it
        langkah("silang", null, `insert into public.items (lesson_id, institution_id, item_type, bank_type, stem, supersedes_item_id)
             values ((select i.lesson_id from public.items i where pg_temp.c1_kursus(i.id) = ${G("c2")} limit 1), ${G("inst")}, 'MCQ_SINGLE', 'PRACTICE',
                     'Soal yang menunjuk sekolah lain?', ${G("boot_item")}) returning id::text`),
      ];
      const m = jalankan(c, repoRoot, [`declare v_t text; begin`, ...L, `end;`]);
      if (!m) return c.verdict("");
      const harap = (k: string, h: string, apa: string) => c.expect(m[k] === h, `${apa}: answered ${m[k]}; expected ${h}`);
      harap("ok_siap", "ok:true", "an upload naming each question's original, prepared");
      harap("ok", "ok:true", "that upload confirmed");
      harap("ok_cek", "ok:6|0|6", "the corrected course's questions (every pointer set, each to its own original in the predecessor)");
      harap("baru", "ok:true", "an upload with no identity column");
      harap("baru_cek", "ok:6|6", "its questions (all new)");
      harap("lain_paket", "ok:ITEM_IDENTITY_OTHER_COURSE@2", "a row citing another course's question");
      harap("lain_sekolah", "ok:ITEM_IDENTITY_UNKNOWN@2", "a row citing another school's question");
      harap("dua_kali", "ok:ITEM_IDENTITY_REPEATED@3", "one question cited twice");
      harap("tanpa", "ok:ITEM_IDENTITY_NO_PREDECESSOR@2", "an identity in an upload that revises nothing");
      harap("tolak_simpan", "ok:false|0", "confirming a refused upload (nothing materialised)");
      harap("bukan_pendahulu", "ok:ITEM_IDENTITY_NOT_PREDECESSOR@4", "a row citing an older version of the same course");
      harap("ubah_c2", "ok:true", "the sent-back correction edited in the app");
      harap("menimpa", "ok:true|1", "an upload over a draft edited in the app");
      harap("tidak_menimpa", "ok:false", "an upload over a course never edited in the app");
      harap("silang", "PR180:LINEAGE_CROSSES_OWNER", "a question pointing to another school's question, written directly");
      return c.verdict("an upload whose rows name their originals sets every item pointer, each to its own original in the predecessor; without the column "
        + "every question is new; a row citing another course, another school (answered as unknown), an older version of the same course, the same "
        + "question twice, or any identity in an upload that revises nothing is refused at its row and nothing is materialised; an upload over in-app "
        + "edits is detectable; no path writes a lineage pointer across owners");
    },
  },
  {
    id: "C1W-S03",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const X = item("p1", "Pertanyaan awal nomor 1");
      const L: string[] = [
        `perform pg_temp.c1_paket('p1');`,
        langkah("revisi_murid", "kadep", `select public.revisi_soal(${X}, 'pendek') ->> 'ok'`),
        langkah("revisi", "guru", `select set_config('c1.r1', x ->> 'course', true) || '|' || set_config('c1.x2', x ->> 'item', true) || '|' || (x ->> 'revisi')
             from public.revisi_soal(${X}, 'Kunci soal nomor satu keliru dan diperbaiki.') x`),
        langkah("penunjuk", null, `select count(*) || '|' || count(*) filter (where i.supersedes_item_id is null) || '|' || count(distinct i.supersedes_item_id)
             || '|' || count(*) filter (where pg_temp.c1_kursus(i.supersedes_item_id) = ${G("p1")}) || '|' || bool_and(i.stem = (select p.stem from public.items p where p.id = i.supersedes_item_id))
             || '|' || ((select x.supersedes_item_id from public.items x where x.id = ${G("x2")}) = ${X})
             from public.items i where pg_temp.c1_kursus(i.id) = ${G("r1")}`),
        langkah("revisi_lagi", "guru", `select public.revisi_soal(${X}, 'Revisi kedua dari soal yang sama.') ->> 'ok'`),
        langkah("ubah_kopi", "guru", `select public.ubah_soal_draf(${G("x2")}, 1, jsonb_build_object('stem', 'Pertanyaan awal nomor 1 tentang pecahan?', 'options', jsonb_build_array(
             jsonb_build_object('label', 'A', 'body', 'Pilihan tepat 1', 'is_correct', false, 'rationale', 'Ini belum tepat.'),
             jsonb_build_object('label', 'B', 'body', 'Pilihan lain 1', 'is_correct', true, 'rationale', 'Ini tepat.')))) ->> 'ok'`),
        `perform set_config('c1.r1_rel', pg_temp.c1_terbitkan(${G("r1")})::text, true);`,
        langkah("ganti", null, `select r.status::text || '|' || (r.replaced_by_release_id = ${G("r1_rel")}) || '|' || (r.withdrawn_at is null) || '|' || public.release_starts_new_sessions(r.id)
             || '|' || (select r2.status::text || ',' || r2.version_label from public.plp_releases r2 where r2.id = ${G("r1_rel")}) from public.plp_releases r where r.id = ${G("p1_rel")}`),
        langkah("ganti_audit", null, audit("RELEASE_REPLACED", G("p1_rel"), `(l.summary ->> 'replaced_by')::uuid = ${G("r1_rel")}`)),
        langkah("beri_lama", "guru", `select public.assign_release(${G("p1_rel")}, ${G("kelas")}, now(), null) ->> 'ok'`),
        langkah("beri_baru", "guru", `select public.assign_release(${G("r1_rel")}, ${G("kelas")}, now(), null) ->> 'ok'`),
        // the question's history
        langkah("riwayat", "kadep", `select (x ->> 'jumlah_versi') || '|' || (x -> 'versi' -> 0 ->> 'item' = ${S("x2")}) || '|' || (x -> 'versi' -> 0 -> 'perubahan' -> 'key')::text
             || '|' || (x -> 'versi' -> 0 -> 'terbitan' ->> 'versi') || '|' || (x -> 'versi' -> 1 -> 'terbitan' ->> 'versi') || '|' || (x -> 'versi' -> 1 -> 'terbitan' ->> 'digantikan')
             || '|' || (x -> 'versi' -> 0 ->> 'dibuat_oleh' = ${S("p_guru")}) || '|' || (x -> 'versi' -> 0 ->> 'diubah_oleh' = ${S("p_guru")}) || '|' || (x -> 'versi' -> 1 -> 'perubahan' is null)
             || '|' || (x::text !~ 'empirical|statistik|benar_persen')
             from public.riwayat_soal(${X}) x`),
        langkah("riwayat_lain", "lain", `select public.riwayat_soal(${X}) ->> 'jumlah_versi'`),
        langkah("bukan_kepala", "guru", `select public.create_course_revision(${G("p1")})`),
        langkah("kepala", "guru", `select public.create_course_revision(${G("r1")}) is not null`),
      ];
      const m = jalankan(c, repoRoot, L);
      if (!m) return c.verdict("");
      const harap = (k: string, h: string, apa: string) => c.expect(m[k] === h, `${apa}: answered ${m[k]}; expected ${h}`);
      harap("revisi_murid", "PR180:REVISION_SUMMARY_REQUIRED", "a revision without a summary");
      c.expect(/^ok:[0-9a-f-]{36}\|[0-9a-f-]{36}\|1$/.test(m.revisi ?? ""), `revising one question of the published package: ${m.revisi}`);
      harap("penunjuk", "ok:6|0|6|6|true|true", "the revision's questions (every one points to its own original; the revised one to the question named)");
      harap("revisi_lagi", "PR180:REVISION_OPEN_EXISTS", "a second revision while one is open");
      harap("ubah_kopi", "ok:true", "the author correcting the copy's key in the draft");
      harap("ganti", "ok:SUPERSEDED|true|true|true|PUBLISHED,1.1.0", "the predecessor once the correction is published (replaced, not withdrawn; its classes go on)");
      harap("ganti_audit", "ok:1", "the replacement's audit row");
      harap("beri_lama", "PR050:ASSIGN_RELEASE_NOT_PUBLISHED", "a new assignment of the replaced release");
      harap("beri_baru", "ok:true", "a new assignment of the correction");
      harap("bukan_kepala", "PR180:REVISION_NOT_HEAD", "create_course_revision of a course that is no longer the head");
      harap("kepala", "ok:true", "create_course_revision of the head");
      harap("riwayat", 'ok:2|true|{"to": ["B"], "from": ["A"]}|1.1.0|1.0.0|true|true|true|true|true', "the question's history (two versions, newest first, the key from A to B, each release, who; no statistic)");
      harap("riwayat_lain", "PR180:QUESTION_NOT_VISIBLE", "another school reading the question's history");
      return c.verdict("one question of a published package is revised: a new revision of the head in which every question points to its own original and the "
        + "revised one to the question named; the author corrects the copy; through review, approval, lock and publication the correction replaces its "
        + "predecessor (SUPERSEDED, marked replaced, not withdrawn, its classes go on; a new assignment of it refused, of the correction accepted; audited); "
        + "create_course_revision revises the head only; the history says two versions newest first, the key from A to B, each release, who; no statistic");
    },
  },
  {
    id: "C1W-S04",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const L: string[] = [
        `perform pg_temp.c1_paket('p1');`, `perform pg_temp.c1_beri('p1');`,
        `perform pg_temp.c1_murid('m1'); perform pg_temp.c1_duduk('m1', ${G("p1_pre")}, true, true, 's1');`,
        `perform pg_temp.c1_murid('m2'); perform pg_temp.c1_murid('m3');`,
        `perform selftest.as_user_uid(${G("u_m2")}); perform set_config('c1.s2', public.start_learning_session(${G("p1_pre")})::text, true); perform selftest.as_owner();`,
        langkah("tarik", "admin", `select public.withdraw_release(${G("p1_rel")}, 'Materi ini dihentikan oleh penerbitnya.') is not null`),
        langkah("tarik_cek", null, `select r.status::text || '|' || (r.withdrawn_by_person_id = ${G("p_admin")}) || '|' || r.withdrawal_reason || '|' || (r.replaced_by_release_id is null)
             from public.plp_releases r where r.id = ${G("p1_rel")}`),
        // no class starts a new sitting on it (red in 4.0)
        langkah("boleh_baru", "m3", `select string_agg(x.ok || ',' || x.reason, '') from public.may_start_assessment(${G("p1_pre")}) x`),
        langkah("mulai_baru", "m3", `select public.start_learning_session(${G("p1_pre")}) is not null`),
        // the open sitting finishes
        langkah("terbuka", "m2", `select count(x.outcome) from public.presented_items p cross join lateral public.record_answer(p.id, 1, selftest.f09_answer(p.id, true)) x where p.session_id = ${G("s2")}`),
        langkah("terbuka_selesai", "m2", `select public.finish_my_session(${G("s2")}) is not null`),
        langkah("terbuka_cek", null, `select s.status::text || '|' || (select count(*) from public.assessment_results r where r.session_id = s.id) from public.assessment_sessions s where s.id = ${G("s2")}`),
        // the finished result stays and counts
        langkah("selesai", "m1", `select (public.session_outcome(${G("s1")}) ->> 'penguasaan') || '|' || (public.learning_delta(${G("p1_la")}) ->> 'status')`),
        langkah("selesai_guru", null, `select count(*) from public.assessment_results r where r.session_id in (${G("s1")}, ${G("s2")})`),
        // teachers and learners read their own state, never the teacher's withdrawal
        langkah("keadaan_guru", "guru", `select (x ->> 'keadaan') || '|' || (x ->> 'sesi_baru') from public.keadaan_terbitan(${G("p1_la")}) x`),
        langkah("keadaan_murid", "m1", `select x ->> 'keadaan' from public.keadaan_terbitan(${G("p1_la")}) x`),
        langkah("keadaan_lain", "lain", `select x ->> 'keadaan' from public.keadaan_terbitan(${G("p1_la")}) x`),
        langkah("penugasan", null, `select la.status::text from public.learning_assignments la where la.id = ${G("p1_la")}`),
      ];
      const m = jalankan(c, repoRoot, L);
      if (!m) return c.verdict("");
      const harap = (k: string, h: string, apa: string) => c.expect(m[k] === h, `${apa}: answered ${m[k]}; expected ${h}`);
      harap("tarik", "ok:true", "the publisher withdrawing the release");
      harap("tarik_cek", "ok:SUPERSEDED|true|Materi ini dihentikan oleh penerbitnya.|true", "the withdrawal as recorded on the release (apart from a replacement)");
      harap("boleh_baru", "ok:false,RELEASE_WITHDRAWN", "may a learner of the class start a new sitting");
      c.expect(/RELEASE_WITHDRAWN/.test(m.mulai_baru ?? "") && !(m.mulai_baru ?? "").startsWith("ok:"), `a learner starting a new sitting on the withdrawn release: ${m.mulai_baru}`);
      harap("terbuka", "ok:3", "the open sitting's answers after the withdrawal");
      harap("terbuka_selesai", "ok:true", "the open sitting handed in");
      harap("terbuka_cek", "ok:FINALIZED|1", "the open sitting, finished, with its result");
      harap("selesai", "ok:1.0000|BARU_PEMETAAN", "the finished result, as its learner reads it");
      harap("selesai_guru", "ok:2", "the class's results, kept");
      harap("keadaan_guru", "ok:DIHENTIKAN_PENERBIT|false", "what the teacher reads of the material");
      harap("keadaan_murid", "ok:DIHENTIKAN_PENERBIT", "what the learner reads of the material");
      harap("keadaan_lain", "PR180:RELEASE_STATE_NOT_VISIBLE", "another school reading the material's state");
      harap("penugasan", "ok:ACTIVE", "the class's assignment (not the teacher's withdrawal)");
      return c.verdict("a release its publisher withdrew starts no new sitting (may_start_assessment says RELEASE_WITHDRAWN, the start is refused); the "
        + "withdrawal is recorded on the release apart from a replacement; a sitting open at that moment takes its answers and finishes with its result; "
        + "a finished result stays and its learner and teacher still read it; teachers and learners read DIHENTIKAN_PENERBIT, never the teacher's "
        + "withdrawal (the assignment stays ACTIVE); another school is refused the read");
    },
  },
  {
    id: "C1W-S05",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const X = item("p1", "Pertanyaan awal nomor 1");
      const Y = item("p1", "Pertanyaan awal nomor 2");
      const Z = item("p1", "Pertanyaan awal nomor 3");
      const L: string[] = [
        `perform pg_temp.c1_paket('p1');`, `perform pg_temp.c1_beri('p1');`,
        `perform pg_temp.c1_murid('m1'); perform pg_temp.c1_duduk('m1', ${G("p1_pre")}, true, true, 's1');`,
        `perform pg_temp.c1_duduk('m1', ${G("p1_post")}, true, true, 's1_post');`,
        `perform pg_temp.c1_murid('m2'); perform pg_temp.c1_duduk('m2', ${G("p1_pre")}, false, true, 's2');`,
        `perform pg_temp.c1_duduk('m2', ${G("p1_post")}, true, true, 's2_post');`,
        langkah("biasa2", "sys", `select public.recompute_result(${G("s2_post")}, 'Penghitungan ulang biasa tanpa koreksi kunci.') is not null`),
        `perform pg_temp.c1_murid('m3'); perform pg_temp.c1_duduk('m3', ${G("p1_pre")}, true, false, 's3');`,
        `perform pg_temp.c1_murid('m4');`,
        `perform pg_temp.c1_murid('m6'); perform pg_temp.c1_duduk('m6', ${G("p1_pre")}, true, false, 's6');`,
        `perform pg_temp.c1_murid('m5'); perform pg_temp.c1_duduk('m5', ${G("p1_pre")}, true, true, 's5');`,
        // an ordinary recalculation before any correction (D11): one is allowed
        langkah("biasa", "sys", `select public.recompute_result(${G("s5")}, 'Penghitungan ulang biasa oleh platform.') is not null`),
        `perform set_config('c1.sidik1', pg_temp.c1_sidik_sesi(${G("s1")}), true); perform set_config('c1.sidik_post', pg_temp.c1_sidik_sesi(${G("s1_post")}), true);`,
        `perform set_config('c1.sidik_kursus', pg_temp.c1_sidik_kursus(${G("p1")}), true);`,
        // who proposes: the content owner
        langkah("aju_guru", "guru", ajukan(X, "B")),
        langkah("aju_sys", "sys", ajukan(X, "B")),
        langkah("aju_kadep", "kadep", ajukan(X, "B")),
        langkah("aju_alasan", "admin", ajukan(X, "B", "pendek")),
        langkah("aju_kunci", "admin", ajukan(X, "A")),
        langkah("aju_label", "admin", ajukan(X, "E")),
        langkah("aju", "admin", `${ajukan(X, "B")} is not null`),
        simpanKoreksi("k1", X, "B"),
        langkah("aju_lagi", "admin", ajukan(X, "B")),
        // the counts before, by the recalculation's own rule
        langkah("dampak", "kadep", `select concat_ws('|', x ->> 'sesi_selesai', x ->> 'sekolah', x ->> 'hasil_berubah', x ->> 'putusan_target_berubah',
             x ->> 'sertifikat_ditinjau', x ->> 'sertifikat_baru_layak', x ->> 'sesi_terbuka', jsonb_array_length(x -> 'daftar'), x ->> 'boleh_tegaskan', x ->> 'konten_platform')
             from public.koreksi_kunci_dampak(${G("k1")}) x`),
        langkah("dampak_pengaju", "admin", `select (x ->> 'boleh_tegaskan') || '|' || (x ->> 'milik_sendiri') from public.koreksi_kunci_dampak(${G("k1")}) x`),
        langkah("dampak_guru", "guru", `select public.koreksi_kunci_dampak(${G("k1")}) ->> 'sesi_selesai'`),
        // who confirms: a different person in the tenant
        langkah("tegas_sendiri", "admin", tegaskan("k1")),
        langkah("tegas_sys", "sys", tegaskan("k1")),
        langkah("tegas_guru", "guru", tegaskan("k1")),
        langkah("tegas_lain", "lain", tegaskan("k1")),
        langkah("tegas", "kadep", `select concat_ws('|', x ->> 'ok', x ->> 'dihitung_ulang', x ->> 'hasil_berubah_tercatat', x ->> 'sesi_terbuka', x ->> 'penugasan_dipindah', x ->> 'versi')
             from public.tegaskan_koreksi_kunci(${G("k1")}) x`),
        langkah("tegas_lagi", "kadep2", tegaskan("k1")),
        // the originals: byte-identical
        langkah("asli", null, `select (pg_temp.c1_sidik_sesi(${G("s1")}) = ${S("sidik1")}) || '|' || (pg_temp.c1_sidik_kursus(${G("p1")}) = ${S("sidik_kursus")})
             || '|' || (pg_temp.c1_sidik_sesi(${G("s1_post")}) = ${S("sidik_post")})`),
        // one superseding result with its basis
        langkah("hasil", null, hasilRingkas("s1")),
        langkah("dasar", null, `select (b.supersedes_result_id = (select r.id from public.assessment_results r where r.session_id = b.session_id and r.supersedes_result_id is null))
             || '|' || (b.key_correction_id = ${G("k1")}) || '|' || (b.basis -> 'soal' -> ${X}::text ->> 'kunci') || '|'
             || ((b.basis -> 'soal' -> ${X}::text ->> 'soal')::uuid = (select k.corrected_item_id from public.key_corrections k where k.id = ${G("k1")}))
             || '|' || ((b.basis -> 'soal' -> ${X}::text ->> 'terbitan')::uuid = (select k.corrected_release_id from public.key_corrections k where k.id = ${G("k1")}))
             || '|' || (b.basis -> 'soal' -> ${Y}::text ->> 'kunci') || '|' || ((b.basis -> 'koreksi') = jsonb_build_array(${S("k1")}))::text
             || '|' || (select r.recomputation_reason from public.assessment_results r where r.id = b.result_id)
             from public.assessment_result_bases b where b.session_id = ${G("s1")}`),
        langkah("hasil_m2", null, hasilRingkas("s2")),
        langkah("hasil_m5", null, hasilRingkas("s5")),
        // an unaffected sitting: untouched, and refused
        langkah("tak_terdampak", null, hasilRingkas("s1_post")),
        langkah("tak_terdampak_paksa", null, `select public.hitung_ulang_koreksi_kunci(${G("s1_post")}, ${G("k1")})`),
        // D11 unchanged
        langkah("d11", "sys", `select public.recompute_result(${G("s5")}, 'Penghitungan ulang biasa yang kedua.')`),
        langkah("d11_kunci", "sys", `select public.recompute_result(${G("s1")}, 'Penghitungan ulang biasa setelah koreksi.')`),
        langkah("d11_kepala", "admin", `select public.recompute_result(${G("s1")}, 'Penghitungan ulang oleh sekolah.')`),
        // the publication and the move: new starts take the corrected key
        langkah("terbit", null, `select r.status::text || '|' || (r.replaced_by_release_id = k.corrected_release_id) || '|' || (select r2.status::text from public.plp_releases r2 where r2.id = k.corrected_release_id)
             || '|' || ((select la.plp_release_id from public.learning_assignments la where la.id = ${G("p1_la")}) = k.corrected_release_id)
             || '|' || (select count(*) from public.learning_assignment_release_moves mv where mv.learning_assignment_id = ${G("p1_la")} and mv.to_release_id = k.corrected_release_id)
             || '|' || (select c.author_person_id = ${G("p_admin")} and c.reviewed_by_person_id = ${G("p_kadep")} from public.courses c where c.id = k.corrected_course_id)
             from public.key_corrections k join public.plp_releases r on r.id = k.release_id where k.id = ${G("k1")}`),
        `perform pg_temp.c1_duduk('m4', ${G("p1_pre")}, true, true, 's4');`,
        langkah("baru", null, `select (s.plp_release_id = k.corrected_release_id) || '|' || (select count(*) from public.presented_items p where p.session_id = s.id and p.item_id = k.corrected_item_id)
             || '|' || (select r.mastery from public.assessment_results r where r.session_id = s.id and r.supersedes_result_id is null) || '|' || (select count(*) from public.assessment_results r where r.session_id = s.id)
             from public.assessment_sessions s, public.key_corrections k where s.id = ${G("s4")} and k.id = ${G("k1")}`),
        // the sitting open at confirmation: recalculated when it finishes
        langkah("terbuka", "m3", `select public.finish_my_session(${G("s3")}) is not null`),
        langkah("terbuka_cek", null, `select (${hasilRingkas("s3")}) || '|' || (select b.key_correction_id = ${G("k1")} from public.assessment_result_bases b where b.session_id = ${G("s3")})`),
        // the sitting open at confirmation that its learner abandons: the A1 deadline job ends it, scores it, and it is recalculated
        paksa(`update public.assessment_sessions set authoritative_deadline = now() - interval '10 minutes' where id = current_setting('c1.s6')::uuid`),
        langkah("jadwal", null, `select public.pengerjaan_tutup_terjadwal(5000) ->> 'ok'`),
        langkah("jadwal_cek", null, `select (${hasilRingkas("s6")}) || '|' || (select s.status::text || ',' || s.closure_kind from public.assessment_sessions s where s.id = ${G("s6")})
             || '|' || (select b.key_correction_id = ${G("k1")} from public.assessment_result_bases b where b.session_id = ${G("s6")})`),
        // the learner and the teacher read the corrected result
        langkah("murid", "m1", `select (x ->> 'penguasaan') || '|' || (x ->> 'dikoreksi') || '|' || (x -> 'koreksi' ->> 'penguasaan_asli') || '|' || (x -> 'koreksi' ->> 'alasan')
             from public.session_outcome(${G("s1")}) x`),
        langkah("murid_saya", "m1", `select (x ->> 'dikoreksi') || '|' || (x -> 'asli' ->> 'penguasaan') || '|' || (x -> 'terkini' ->> 'penguasaan') from public.hasil_koreksi_saya(${G("s1")}) x`),
        langkah("murid_ulasan", "m1", `select count(*) filter (where y.benar) || '/' || count(*) from public.session_review(${G("s1_post")}) y`),
        langkah("murid_biasa", "m2", `select ((x ->> 'dikoreksi') is null) || '|' || (x ->> 'penguasaan') from public.session_outcome(${G("s2_post")}) x`),
        langkah("murid_lain", "m2", `select public.hasil_koreksi_saya(${G("s1")}) ->> 'dikoreksi'`),
        langkah("guru", "guru", `select string_agg(e ->> 'jenis', ',' order by (e ->> 'urutan')::int) || '|' || (select e2 ->> 'jenis' from jsonb_array_elements(x -> 'rantai') e2 where (e2 ->> 'kini')::boolean)
             from public.riwayat_hasil_sesi(${G("s5")}) x, jsonb_array_elements(x -> 'rantai') e group by x`),
        // a second governed correction on the recalculated sitting: it chains, scored from the original answers (O41-22)
        langkah("aju2", "admin", `${ajukan(Y, "B")} is not null`),
        simpanKoreksi("k2", Y, "B"),
        langkah("tegas2", "kadep2", `select (x ->> 'ok') || '|' || (x ->> 'dihitung_ulang') from public.tegaskan_koreksi_kunci(${G("k2")}) x`),
        langkah("rantai", null, `select (${hasilRingkas("s1")}) || '|' || ((with recursive rantai as (
               select r.id, 1 as n from public.assessment_results r where r.session_id = ${G("s1")} and r.supersedes_result_id is null
               union all select x.id, rantai.n + 1 from public.assessment_results x join rantai on x.supersedes_result_id = rantai.id)
             -- RESTATED, C1w (P4): the chain is walked by its supersession links, not ordered by computed_at, which ties
             -- within this one rolled-back transaction and made the order (and this step) depend on the planner
             select string_agg(coalesce(b.key_correction_id::text, 'asli'), ',' order by rantai.n)
               from rantai left join public.assessment_result_bases b on b.result_id = rantai.id)
             = ('asli,' || ${S("k1")} || ',' || ${S("k2")}))::text`),
        langkah("rantai_dasar", null, `select (b.basis -> 'soal' -> ${X}::text ->> 'kunci') || (b.basis -> 'soal' -> ${Y}::text ->> 'kunci') || (b.basis -> 'soal' -> ${Z}::text ->> 'kunci')
             || '|' || jsonb_array_length(b.basis -> 'koreksi') from public.assessment_result_bases b where b.result_id = public.hasil_terkini_id(${G("s1")})`),
        langkah("rantai_m2", null, hasilRingkas("s2")),
        langkah("asli_lagi", null, `select (pg_temp.c1_sidik_sesi(${G("s1")}) = ${S("sidik1")}) || '|' || (pg_temp.c1_sidik_kursus(${G("p1")}) = ${S("sidik_kursus")})`),
        // a decline returns it with a reason, and the question takes a proposal again
        langkah("aju3", "admin", `${ajukan(Z, "B")} is not null`),
        simpanKoreksi("k3", Z, "B"),
        langkah("tolak_pendek", "kadep", `select public.tolak_koreksi_kunci(${G("k3")}, 'tidak') ->> 'ok'`),
        langkah("tolak_sendiri", "admin", `select public.tolak_koreksi_kunci(${G("k3")}, 'Saya menarik usulan saya sendiri.') ->> 'ok'`),
        langkah("tolak", "kadep", `select public.tolak_koreksi_kunci(${G("k3")}, 'Kunci semula sudah benar menurut buku.') ->> 'status'`),
        langkah("tolak_cek", null, `select k.status || '|' || k.decline_reason || '|' || (k.decided_by_person_id = ${G("p_kadep")}) || '|' || (select count(*) from public.assessment_results r where r.session_id = ${G("s1")})
             from public.key_corrections k where k.id = ${G("k3")}`),
        langkah("aju4", "admin", `${ajukan(Z, "B")} is not null`),
        simpanKoreksi("k4", Z, "B"),
        // an unrelated open revision of the package: the owner is told to finish or discard it, never blocked silently
        `perform set_config('c1.z_kepala', public.soal_ujung(${Z})::text, true);`,
        lakukan("guru", `select public.revisi_soal(${G("z_kepala")}, 'Revisi biasa yang belum selesai.')`),
        langkah("revisi_terbuka_aju", "admin", ajukan(Y, "A")),
        langkah("revisi_terbuka_tegas", "kadep", tegaskan("k4")),
        // ---- platform content (O41-18): the platform's own tenant proposes and confirms; other schools are counts only;
        // the correction is distributed onward to every school that held the replaced release
        `perform set_config('c1.kan', (select to_jsonb(x)::text from selftest.canonical_package('C1W kanonik ' || current_setting('c1.tag')) x), true); perform selftest.as_owner();`,
        `perform set_config('c1.u_kadmin', (select u.id::text from auth.users u where u.email = 'kanonik-admin@pintar.test'), true);`,
        `perform selftest.as_user('kanonik-admin@pintar.test');
         perform public.grant_release_distribution((current_setting('c1.kan')::jsonb ->> 'rel')::uuid, ${G("inst")}, 'C1W kanonik');
         perform public.grant_release_distribution((current_setting('c1.kan')::jsonb ->> 'rel')::uuid, ${G("lain_inst")}, 'C1W kanonik');
         perform selftest.as_owner();
         perform selftest.pass_mark(${G("inst")}, (current_setting('c1.kan')::jsonb ->> 'course')::uuid);`,
        `perform selftest.as_user_uid(${G("u_guru")});
         perform set_config('c1.kan_aa', (select x.assessment_assignment_id::text from public.launch_quick_assessment(${G("kelas")}, (current_setting('c1.kan')::jsonb ->> 'modul')::uuid, 3, 30) x), true);
         perform selftest.as_owner();`,
        `perform pg_temp.c1_murid('m7'); perform pg_temp.c1_duduk('m7', ${G("kan_aa")}, true, true, 's7');`,
        `perform set_config('c1.kan_x', (select p.item_id::text from public.presented_items p where p.session_id = ${G("s7")} order by p.position limit 1), true);
         perform set_config('c1.kan_kunci', (select o.label from public.item_options o where o.item_id = ${G("kan_x")} and not o.is_correct order by o.label limit 1), true);`,
        langkah("kan_aju_sekolah", "admin", `select public.ajukan_koreksi_kunci(${G("kan_x")}, array[${S("kan_kunci")}], '${ALASAN}') ->> 'ok'`),
        langkah("kan_aju_sys_tanpa", "kadep", `select public.ajukan_koreksi_kunci(${G("kan_x")}, array[${S("kan_kunci")}], '${ALASAN}') ->> 'ok'`),
        langkah("kan_aju", "kadmin", `select set_config('c1.kk', public.ajukan_koreksi_kunci(${G("kan_x")}, array[${S("kan_kunci")}], '${ALASAN}') ->> 'koreksi', true) is not null`),
        langkah("kan_dampak", "kadmin", `select concat_ws('|', (x ? 'daftar')::text, x ->> 'konten_platform', x ->> 'sekolah', x ->> 'sesi_selesai', x ->> 'hasil_berubah', x ->> 'boleh_tegaskan')
             from public.koreksi_kunci_dampak(${G("kk")}) x`),
        langkah("kan_tegas_sendiri", "kadmin", tegaskan("kk")),
        langkah("kan_tegas_sekolah", "admin", tegaskan("kk")),
        langkah("kan_tegas", "sys", `select (x ->> 'ok') || '|' || (x ->> 'dihitung_ulang') || '|' || (x ->> 'distribusi') from public.tegaskan_koreksi_kunci(${G("kk")}) x`),
        langkah("kan_cek", null, `select (select count(*) from public.release_distributions d where d.plp_release_id = k.corrected_release_id and d.status = 'ACTIVE'
                  and d.institution_id in (${G("inst")}, ${G("lain_inst")})) || '|' || (select r.status::text from public.plp_releases r where r.id = k.release_id)
             || '|' || (select count(*) from public.assessment_results r where r.session_id = ${G("s7")})
             || '|' || (select count(*) from public.key_correction_notices n where n.key_correction_id = k.id and n.institution_id = ${G("inst")} and ${G("s7")} = any (n.session_ids))
             || '|' || (select count(*) from public.key_correction_notices n where n.key_correction_id = k.id and n.institution_id <> ${G("inst")})
             from public.key_corrections k where k.id = ${G("kk")}`),
        // ---- a certificate newly earnable (bootstrap, OFFICIAL): 3 of 6 right under the faulty key, 4 of 6 under the corrected one
        `if ${S("boot")} = '' then raise exception 'the bootstrap school is absent'; end if;`,
        `perform selftest.purge_certificates(); perform set_config('c1.bs2', pg_temp.c1_boot_campur()::text, true);`,
        `perform set_config('c1.bx', (select f.item_id::text from public.session_final_responses(${G("bs2")}) f join public.items i on i.id = f.item_id
              where i.item_type = 'MCQ_SINGLE' and not i.is_safety_critical and public.grade_response(f.item_id, f.value) = 0 order by f.posisi limit 1), true);
         perform set_config('c1.bx_pilih', (select f.value ->> 'pilihan' from public.session_final_responses(${G("bs2")}) f where f.item_id = ${G("bx")}), true);`,
        langkah("baru_sebelum", null, `select (x.eligible)::text || '|' || x.mastery from public.certificate_eligibility(${G("bs2")}) x`),
        langkah("baru_aju", "badmin", `select set_config('c1.kb', public.ajukan_koreksi_kunci(${G("bx")}, array[${S("bx_pilih")}], '${ALASAN}') ->> 'koreksi', true) is not null`),
        langkah("baru_dampak", "bkadep", `select concat_ws('|', x ->> 'sertifikat_baru_layak', x ->> 'putusan_target_berubah', x ->> 'hasil_berubah') from public.koreksi_kunci_dampak(${G("kb")}) x`),
        langkah("baru_tegas", "bkadep", `select (x ->> 'ok') || '|' || (x ->> 'sertifikat_baru_layak') from public.tegaskan_koreksi_kunci(${G("kb")}) x`),
        langkah("baru_sesudah", null, `select (x.eligible)::text || '|' || x.mastery || '|' || (select count(*) from public.certificates c where c.session_id = ${G("bs2")}) from public.certificate_eligibility(${G("bs2")}) x`),
        langkah("baru_siap", null, `select c.already_sealed::text from public.certificate_prepare(${G("bs2")}, 1::smallint) c`),
        langkah("baru_terbit", null, `select (c.canonical_payload -> 'result' ->> 'passed') || '|' || c.status::text from public.certificates c where c.session_id = ${G("bs2")}`),
        // every act audited
        langkah("audit", null, `select (select count(*) from public.audit_log l where l.action = 'key_correction.proposed' and l.actor_person_id = ${G("p_admin")} and l.target_id in (${S("k1")}, ${S("k2")}, ${S("k3")}))
             || '|' || (select count(*) from public.audit_log l where l.action = 'key_correction.confirmed' and l.target_id in (${S("k1")}, ${S("k2")}))
             || '|' || (select count(*) from public.audit_log l where l.action = 'key_correction.declined' and l.target_id = ${S("k3")} and l.actor_person_id = ${G("p_kadep")})
             || '|' || (select count(*) from public.audit_log l where l.action = 'assessment_result.key_corrected' and (l.summary ->> 'session_id')::uuid = ${G("s1")})
             || '|' || (select count(*) from public.key_correction_notices n where n.key_correction_id = ${G("k1")} and n.institution_id = ${G("inst")} and ${G("s1")} = any (n.session_ids))`),
      ];
      const m = jalankan(c, repoRoot, L);
      if (!m) return c.verdict("");
      const harap = (k: string, h: string, apa: string) => c.expect(m[k] === h, `${apa}: answered ${m[k]}; expected ${h}`);
      harap("biasa", "ok:true", "an ordinary recalculation before any correction");
      harap("aju_guru", "PR190:CORRECTION_NOT_ALLOWED", "a teacher proposing a key correction");
      harap("aju_sys", "PR190:CORRECTION_NOT_ALLOWED", "a platform admin proposing a correction of a school's content");
      harap("aju_kadep", "PR190:CORRECTION_NOT_ALLOWED", "a head of department (no CAN_PUBLISH) proposing");
      harap("aju_alasan", "PR190:CORRECTION_REASON_REQUIRED", "a proposal with a 6-character reason");
      harap("aju_kunci", "PR190:CORRECTION_KEY_UNCHANGED", "a proposal of the key the question has");
      harap("aju_label", "PR190:CORRECTION_KEY_INVALID", "a proposal naming an option the question does not have");
      harap("aju", "ok:true", "the school's administrator proposing");
      harap("aju_lagi", "PR190:CORRECTION_PENDING", "a second proposal while one waits");
      harap("dampak", "ok:3|1|3|0|0|0|2|3|true|false", "the counts before confirmation (finished sittings, schools, changing results, target decisions, certificates to review, newly earnable, open sittings; the list; who may confirm)");
      harap("dampak_pengaju", "ok:false|true", "the proposer's own reading (no confirm, marked theirs)");
      harap("dampak_guru", "PR190:CORRECTION_UNKNOWN", "a teacher reading the counts");
      harap("tegas_sendiri", "PR190:CORRECTION_OWN_PROPOSAL", "the proposer confirming");
      harap("tegas_sys", "PR190:CORRECTION_CONFIRM_NOT_ALLOWED", "a platform admin confirming a correction of a school's content");
      harap("tegas_guru", "PR190:CORRECTION_CONFIRM_NOT_ALLOWED", "a teacher confirming");
      harap("tegas_lain", "PR190:CORRECTION_CONFIRM_NOT_ALLOWED", "another school's administrator confirming");
      harap("tegas", "ok:true|3|3|2|1|1.1.0", "the head of department confirming through CAN_REVIEW (recalculated, changed as counted, one open, the assignment moved, the corrected release)");
      harap("tegas_lagi", "PR190:CORRECTION_ALREADY_DECIDED", "a second confirmation");
      harap("asli", "ok:true|true|true", "the original sealed content, the original result, responses and paper, and the unaffected sitting (byte-identical)");
      harap("hasil", "ok:2|1|0.6667", "the affected sitting's results (the sealed original and one superseding result, which is current)");
      harap("dasar", `ok:true|true|["B"]|true|true|["A"]|true|KOREKSI_KUNCI: ${ALASAN}`, "the recalculated result's basis (what it supersedes, its correction, the corrected key, its question and release, the others' keys, the corrections in force, its reason)");
      harap("hasil_m2", "ok:2|1|0.3333", "the sitting answered wrongly (it gains the corrected question)");
      harap("hasil_m5", "ok:3|1|0.6667", "the sitting recalculated ordinarily before the correction (its chain grows by one, never a constraint error)");
      harap("tak_terdampak", "ok:1|1|1.0000", "the sitting that did not present the question (untouched)");
      harap("tak_terdampak_paksa", "PR190:CORRECTION_SITTING_NOT_AFFECTED", "a governed recalculation of a sitting the question was not in");
      c.expect(/^PR011:this sitting has already been recalculated once/.test(m.d11 ?? ""), `a second ordinary recalculation (D11, PR011): ${m.d11}`);
      c.expect(/^PR011:this sitting has already been recalculated once/.test(m.d11_kunci ?? ""), `an ordinary recalculation of a key-corrected sitting (D11, PR011): ${m.d11_kunci}`);
      c.expect(/requires SYSTEM_ADMIN/.test(m.d11_kepala ?? ""), `a school admin on recompute_result (still the platform's): ${m.d11_kepala}`);
      harap("terbit", "ok:SUPERSEDED|true|PUBLISHED|true|1|true", "the corrected release (published, replacing the faulty one, authored by the proposer and reviewed by the confirmer) and the assignment's move");
      harap("baru", "ok:true|1|1.0000|1", "a new sitting after confirmation (on the corrected release, with the corrected question, scored by the corrected key)");
      harap("terbuka", "ok:true", "the sitting open at confirmation, handed in");
      harap("terbuka_cek", "ok:2|1|0.6667|true", "that sitting's results (its sealed result and the governed recalculation, at once)");
      harap("jadwal", "ok:true", "the A1 deadline job");
      harap("jadwal_cek", "ok:2|1|0.6667|FINALIZED,DEADLINE|true", "the abandoned sitting open at confirmation (ended by its deadline, scored, recalculated under the correction)");
      harap("murid", `ok:0.6667|true|1.0000|${ALASAN}`, "the learner's result page (the corrected result as current, marked corrected, why, the original)");
      harap("murid_saya", "ok:true|1.0000|0.6667", "the learner's own reading of the correction");
      harap("murid_ulasan", "ok:2/2", "the learner's review of an unaffected sitting");
      harap("biasa2", "ok:true", "an ordinary recalculation of another sitting");
      harap("murid_biasa", "ok:true|1.0000", "a learner whose sitting was recalculated ordinarily (D14: no correction said, the sealed result read)");
      harap("murid_lain", "PR190:RESULT_NOT_VISIBLE", "another learner reading it");
      harap("guru", "ok:SEALED,RECALCULATED,KEY_CORRECTED|KEY_CORRECTED", "the teacher's chain of the twice-recalculated sitting and which is current");
      harap("aju2", "ok:true", "a second correction of the same package");
      harap("tegas2", "ok:true|6", "the second correction confirmed by another head of department");
      harap("rantai", "ok:3|1|0.3333|true", "the chain after two corrections (sealed, first, second; exactly one current; scored from the original answers)");
      harap("rantai_dasar", 'ok:["B"]["B"]["A"]|2', "the current result's basis (the complete currently authorized key, both corrections in force)");
      harap("rantai_m2", "ok:3|1|0.6667", "the wrongly answered sitting after both corrections");
      harap("asli_lagi", "ok:true|true", "the originals after the second correction");
      harap("aju3", "ok:true", "a third proposal");
      harap("tolak_pendek", "PR190:CORRECTION_REASON_REQUIRED", "a decline without a reason");
      harap("tolak_sendiri", "PR190:CORRECTION_OWN_PROPOSAL", "the proposer declining");
      harap("tolak", "ok:DECLINED", "the second person declining");
      harap("tolak_cek", "ok:DECLINED|Kunci semula sudah benar menurut buku.|true|3", "the decline as recorded (nothing recalculated)");
      harap("aju4", "ok:true", "a new proposal after a decline");
      harap("revisi_terbuka_aju", "PR190:CORRECTION_OPEN_REVISION", "a proposal while an unrelated revision of the package is open");
      harap("revisi_terbuka_tegas", "PR190:CORRECTION_OPEN_REVISION", "a confirmation while an unrelated revision of the package is open");
      harap("kan_aju_sekolah", "PR190:CORRECTION_NOT_ALLOWED", "a school's administrator proposing a correction of platform content");
      harap("kan_aju_sys_tanpa", "PR190:CORRECTION_NOT_ALLOWED", "a school's head of department proposing a correction of platform content");
      harap("kan_aju", "ok:true", "a role on the platform's own tenant proposing it");
      harap("kan_dampak", "ok:false|true|1|1|1|false", "the platform proposer's counts (no list: other schools as counts only; no confirm of their own)");
      harap("kan_tegas_sendiri", "PR190:CORRECTION_OWN_PROPOSAL", "the platform proposer confirming");
      harap("kan_tegas_sekolah", "PR190:CORRECTION_CONFIRM_NOT_ALLOWED", "a school's administrator confirming a correction of platform content");
      harap("kan_tegas", "ok:true|1|2", "the platform admin confirming (one sitting recalculated, two schools distributed onward)");
      harap("kan_cek", "ok:2|SUPERSEDED|2|1|0", "after the platform correction (both schools hold the corrected release; the faulty one replaced; the school's sitting recalculated; one notice, to that school alone)");
      harap("baru_sebelum", "ok:false|0.5000", "the bootstrap sitting under the faulty key (3 of 6: not eligible)");
      harap("baru_aju", "ok:true", "the bootstrap school's administrator proposing");
      harap("baru_dampak", "ok:1|1|1", "the counts before (one certificate newly earnable; the target decision changes)");
      harap("baru_tegas", "ok:true|1", "the bootstrap school's head of department confirming");
      harap("baru_sesudah", "ok:true|0.6667|0", "the sitting after the correction (eligible, and no certificate issued by the correction itself)");
      harap("baru_siap", "ok:false", "the newly earned certificate, prepared by the usual path");
      harap("baru_terbit", "ok:true|ELIGIBLE", "that certificate's payload (passed, on the corrected result; sealed by the usual signing step)");
      harap("audit", "ok:3|2|1|2|1", "the audit rows (proposals, confirmations, the decline, the recalculations) and the school's notice");
      return c.verdict("a key correction is proposed by the content's owner (CAN_PUBLISH through the school's own role; a teacher, a head of department and a "
        + "platform admin refused) with a reason and a changed, valid key, one waiting per question; its exact counts before confirmation are the "
        + "recalculation's own; the proposer, a platform admin, a teacher and another school cannot confirm, a head of department confirms through "
        + "CAN_REVIEW; the corrected revision is published by the proposer's authorship and the confirmer's review and replaces the faulty release; the "
        + "class's new starts take it; every finished sitting that presented the question gets one superseding result with its basis, the originals "
        + "byte-identical; an unaffected sitting is untouched and refused; an open sitting is recalculated as it finishes; recompute_result keeps D11 "
        + "(PR011) and its platform-only authority; a sitting recalculated ordinarily, then corrected, chains with no constraint error; a second "
        + "correction chains again from the original answers with the complete key; exactly one result is current; the learner reads it corrected and "
        + "why, the teacher reads the whole chain; a decline returns it with a reason; every act audited and the school notified");
    },
  },
  {
    id: "C1W-S06",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const sertifikat = `(select x.id from public.certificates x where x.session_id = ${G("bs")} order by x.issued_at desc limit 1)`;
      const verifikasi = `select v.validity || '|' || coalesce(v.pass::text, '-') from public.verify_certificate((select x.verification_token from public.certificates x where x.id = ${G("cert")})) v`;
      const sidikSert = `(select md5(c.canonical_payload::text || coalesce(c.signature, '') || c.certificate_number || c.verification_token || c.status::text) from public.certificates c where c.id = ${G("cert")})`;
      const presented = (n: number) => `(select p.item_id from public.presented_items p where p.session_id = ${G("bs")} order by p.position offset ${n} limit 1)`;
      const tidakDisajikan = `(select i.id from public.items i join public.lessons l on l.id = i.lesson_id join public.modules m on m.id = l.module_id
           join public.assessment_sessions s on s.id = ${G("bs")} join public.plp_releases r on r.id = s.plp_release_id
          where m.course_id = r.course_id and i.bank_type = 'TEST' and i.item_type = 'MCQ_SINGLE'
            and i.id not in (select p.item_id from public.presented_items p where p.session_id = s.id) order by i.id limit 1)`;
      const kunciLain = (it: string) => `(select o.label from public.item_options o where o.item_id = ${it} and not o.is_correct order by o.label limit 1)`;
      const ajukanB = (nama: string, it: string) => `
        perform selftest.as_owner();
        perform set_config('c1.it_${nama}', (${it})::text, true);
        perform set_config('c1.kunci_${nama}', ${kunciLain(G(`it_${nama}`))}, true);
        perform selftest.as_user_uid(${G("u_badmin")});
        perform set_config('c1.${nama}', public.ajukan_koreksi_kunci(${G(`it_${nama}`)}, array[${S(`kunci_${nama}`)}], '${ALASAN}') ->> 'koreksi', true);
        perform selftest.as_owner();`;
      const L: string[] = [
        `if ${S("boot")} = '' then raise exception 'the bootstrap school is absent'; end if;`,
        `perform selftest.purge_certificates();`,
        `perform set_config('c1.bs', selftest.boot_attempt(true)::text, true);`,
        `perform selftest.as_owner(); perform public.certificate_prepare(${G("bs")}, 1::smallint);`,
        `perform set_config('c1.cert', ${sertifikat}::text, true); perform public.certificate_seal(${G("cert")}, 1::smallint, repeat('a', 64));`,
        `perform set_config('c1.sidik', ${sidikSert}, true);`,
        langkah("awal", null, verifikasi),
        // a correction that does not reach the certificate's sitting: it verifies as before
        ajukanB("k0", tidakDisajikan),
        langkah("tak_kena", "bkadep", `select (x ->> 'dihitung_ulang') || '|' || (x ->> 'tinjauan_sertifikat') from public.tegaskan_koreksi_kunci(${G("k0")}) x`),
        langkah("tak_kena_cek", null, verifikasi),
        // the result changes: under review from that moment, nothing of the certificate changed
        ajukanB("k1", presented(0)),
        langkah("dampak", "bkadep", `select (x ->> 'sertifikat_ditinjau') || '|' || (x ->> 'hasil_berubah') || '|' || (x ? 'sertifikat_baru_layak') from public.koreksi_kunci_dampak(${G("k1")}) x`),
        langkah("kena", "bkadep", `select (x ->> 'dihitung_ulang') || '|' || (x ->> 'tinjauan_sertifikat') from public.tegaskan_koreksi_kunci(${G("k1")}) x`),
        langkah("ditinjau", null, `select (${verifikasi}) || '|' || (select c.status::text from public.certificates c where c.id = ${G("cert")}) || '|' || (${sidikSert} = ${S("sidik")})`),
        langkah("ditinjau_anon", null, `select v.validity || '|' || (v::text !~ 'KOREKSI|kunci|0\\.8') from public.verify_certificate((select x.verification_token from public.certificates x where x.id = ${G("cert")})) v`),
        `perform selftest.as_user('boot-siswa@bootstrap.pintar.test');
         v := v || jsonb_build_object('murid', (select concat_ws('|', x ->> 'dikoreksi', x ->> 'sertifikat_ditinjau', public.sertifikat_saya_ditinjau(${G("bs")})::text) from public.hasil_koreksi_saya(${G("bs")}) x));
         perform selftest.as_owner();`,
        langkah("antrean", "badmin", `select jsonb_array_length(x) || '|' || (x -> 0 ->> 'sertifikat' = ${S("cert")}) || '|' || (x -> 0 ->> 'boleh_putuskan') from public.tinjauan_sertifikat_antrean(${G("boot")}) x`),
        langkah("pemberitahuan", "badmin", `select jsonb_array_length(x) || '|' || (x -> 0 ->> 'jumlah_sesi') || '|' || (x -> 0 ->> 'tinjauan_menunggu') || '|' || (x -> 0 ->> 'selesai') from public.pemberitahuan_koreksi_kunci(${G("boot")}) x`),
        // who decides
        `perform set_config('c1.rv1', (select v.id::text from public.certificate_reviews v where v.certificate_id = ${G("cert")} and v.decision is null), true);`,
        langkah("putus_kadep", "bkadep", `select public.putuskan_tinjauan_sertifikat(${G("rv1")}, 'CONFIRMED', 'Hasilnya tetap di atas batas.') ->> 'ok'`),
        langkah("putus_sys", "sys", `select public.putuskan_tinjauan_sertifikat(${G("rv1")}, 'CONFIRMED', 'Hasilnya tetap di atas batas.') ->> 'ok'`),
        langkah("putus_alasan", "badmin", `select public.putuskan_tinjauan_sertifikat(${G("rv1")}, 'CONFIRMED', 'ya') ->> 'ok'`),
        langkah("putus_jenis", "badmin", `select public.putuskan_tinjauan_sertifikat(${G("rv1")}, 'MAYBE', 'Hasilnya tetap di atas batas.') ->> 'ok'`),
        langkah("putus", "badmin", `select public.putuskan_tinjauan_sertifikat(${G("rv1")}, 'CONFIRMED', 'Hasilnya tetap di atas batas.') ->> 'status'`),
        langkah("putus_cek", null, `select (${verifikasi}) || '|' || (${sidikSert} = ${S("sidik")}) || '|' || (select v.decision || ',' || (v.decided_by_person_id = ${G("p_badmin")}) from public.certificate_reviews v where v.id = ${G("rv1")})`),
        langkah("putus_lagi", "badmin", `select public.putuskan_tinjauan_sertifikat(${G("rv1")}, 'REVOKED', 'Berubah pikiran setelah keputusan.') ->> 'ok'`),
        // a decided certificate affected again: a new review
        ajukanB("k2", presented(1)),
        lakukan("bkadep", `select public.tegaskan_koreksi_kunci(${G("k2")})`),
        langkah("lagi", null, `select (${verifikasi}) || '|' || (select count(*) from public.certificate_reviews v where v.certificate_id = ${G("cert")}) || '|' || (select count(*) from public.certificate_reviews v where v.certificate_id = ${G("cert")} and v.decision is null)`),
        // precedence: superseded, then revoked, over under review
        paksa(`update public.certificates set status = 'SUPERSEDED' where id = current_setting('c1.cert')::uuid`),
        langkah("digantikan", null, verifikasi),
        paksa(`update public.certificates set status = 'ISSUED' where id = current_setting('c1.cert')::uuid`),
        `perform set_config('c1.rv2', (select v.id::text from public.certificate_reviews v where v.certificate_id = ${G("cert")} and v.decision is null), true);`,
        langkah("cabut_langsung", "badmin", `select public.revoke_certificate(${G("cert")}, 'Dicabut langsung oleh sekolah penerbit.')::text`),
        langkah("dicabut", null, `select (${verifikasi}) || '|' || (select count(*) from public.certificate_reviews v where v.certificate_id = ${G("cert")} and v.decision is null)`),
        langkah("cabut", "badmin", `select public.putuskan_tinjauan_sertifikat(${G("rv2")}, 'REVOKED', 'Hasil yang dikoreksi di bawah batas lulus.') ->> 'status'`),
        langkah("cabut_cek", null, `select (${verifikasi}) || '|' || (select c.revoked_reason from public.certificates c where c.id = ${G("cert")}) || '|' || (select v.decision from public.certificate_reviews v where v.id = ${G("rv2")})
             || '|' || (select count(*) from public.audit_log l where l.action = 'certificate.revoked' and l.target_id = ${S("cert")})`),
        // the reviews are history
        langkah("riwayat", null, `update public.certificate_reviews set reason = 'ditulis ulang' where id = ${G("rv1")} returning id`),
      ];
      const m = jalankan(c, repoRoot, L);
      if (!m) return c.verdict("");
      const harap = (k: string, h: string, apa: string) => c.expect(m[k] === h, `${apa}: answered ${m[k]}; expected ${h}`);
      harap("awal", "ok:BERLAKU|true", "the issued certificate, verified");
      harap("tak_kena", "ok:0|0", "a correction of a question the certificate's sitting never presented");
      harap("tak_kena_cek", "ok:BERLAKU|true", "the unaffected certificate, verified as before");
      harap("dampak", "ok:1|1|true", "the counts before the affecting correction (a certificate to review)");
      harap("kena", "ok:1|1", "the affecting correction confirmed (one recalculation, one review)");
      harap("ditinjau", "ok:DITINJAU|true|ISSUED|true", "the certificate under review (its status, payload, signature, number and token unchanged)");
      harap("ditinjau_anon", "ok:DITINJAU|true", "the public answer while under review (no reason, no score)");
      harap("antrean", "ok:1|true|true", "the issuing school's queue «Sedang ditinjau»");
      harap("pemberitahuan", "ok:1|1|1|false", "the issuing school's notice (its own sitting and review, one waiting)");
      harap("putus_kadep", "PR190:CERT_REVIEW_NOT_ALLOWED", "a head of department (no CAN_PUBLISH) deciding");
      harap("putus_sys", "PR190:CERT_REVIEW_NOT_ALLOWED", "a platform admin deciding a school's certificate");
      harap("putus_alasan", "PR190:CERT_REVIEW_REASON_REQUIRED", "a decision without a reason");
      harap("putus_jenis", "PR190:CERT_REVIEW_DECISION_INVALID", "a decision that is neither confirm nor revoke");
      harap("putus", "ok:ISSUED", "the school confirming the certificate");
      harap("putus_cek", "ok:BERLAKU|true|true|CONFIRMED,true", "the confirmed certificate (valid again, nothing of it changed, the decision recorded)");
      harap("putus_lagi", "PR190:CERT_REVIEW_DECIDED", "deciding a decided review again");
      harap("lagi", "ok:DITINJAU|true|2|1", "the decided certificate affected again (a new review)");
      harap("digantikan", "ok:DIGANTIKAN|true", "a superseded certificate with a review open");
      harap("cabut_langsung", "ok:REVOKED", "the school revoking the certificate directly while its review is open");
      harap("dicabut", "ok:DICABUT|true|1", "a revoked certificate with a review still open (DICABUT takes precedence)");
      harap("cabut", "ok:REVOKED", "the school closing that review as revoked");
      harap("cabut_cek", "ok:DICABUT|true|Dicabut langsung oleh sekolah penerbit.|REVOKED|1", "the revoked certificate (its first revocation stands; the review closed; one revocation audited)");
      c.expect(!(m.riwayat ?? "ok").startsWith("ok"), `rewriting a decided review: ${m.riwayat}`);
      harap("murid", "true|true|true", "the learner's own reading (corrected; certificate under review)");
      return c.verdict("an issued certificate whose sitting a correction does not reach verifies as before; once its supporting result changes it verifies "
        + "DITINJAU from that moment (no reason, no score), its status, payload, signature, number and token unchanged, in the issuing school's queue and "
        + "notice; a head of department and a platform admin cannot decide; the school confirms (BERLAKU again) or revokes through revoke_certificate "
        + "(DICABUT, its reason recorded); a decided certificate affected again gets a new review; DIGANTIKAN and DICABUT take precedence; a review is history");
    },
  },
  {
    id: "C1W-C01",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const gagal = siapkan(repoRoot);
      if (!c.expect(gagal === null, gagal ?? "")) return c.verdict("");
      // a world of its own, committed: a package, a class, one learner's finished Pemetaan Awal, two waiting corrections
      const dunia = skenario([
        `perform pg_temp.c1_paket('p1'); perform pg_temp.c1_beri('p1');`,
        `perform pg_temp.c1_murid('m1'); perform pg_temp.c1_duduk('m1', ${G("p1_pre")}, true, true, 's1');`,
        lakukan("admin", ajukan(item("p1", "Pertanyaan awal nomor 1"), "B")),
        lakukan("admin", ajukan(item("p1", "Pertanyaan awal nomor 2"), "B")),
        simpanKoreksi("k1", item("p1", "Pertanyaan awal nomor 1"), "B"),
        simpanKoreksi("k2", item("p1", "Pertanyaan awal nomor 2"), "B"),
        `v := v || jsonb_build_object('s1', ${S("s1")}, 'k1', ${S("k1")}, 'k2', ${S("k2")}, 'u1', ${S("u_kadep")}, 'u2', ${S("u_kadep2")}, 'course', ${S("p1")});`,
      ]).replace(/\nrollback;\n$/, "\ncommit;\n");
      const r = spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-At", "-c", dunia, db()], { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
      const baris = r.stdout.split("\n").find((l) => l.startsWith("C1\t"));
      if (!c.expect(r.status === 0 && baris !== undefined, `the world could not be committed: ${(r.stderr || "").split("\n").find((l) => /ERROR/.test(l))}`)) return c.verdict("");
      const w = JSON.parse(baris!.split("\t")[1]) as Record<string, string>;
      const sesi = (u: string, k: string, tidur: number) => `
begin;
select selftest.as_user_uid('${u}');
select 'T0' || chr(9) || extract(epoch from clock_timestamp());
select 'R' || chr(9) || (public.tegaskan_koreksi_kunci('${k}') ->> 'ok');
select 'T1' || chr(9) || extract(epoch from clock_timestamp());
select pg_sleep(${tidur});
commit;`;
      const jalan = (sql: string) => new Promise<{ code: number | null; out: string; err: string }>((res) => {
        const p = spawn("psql", ["-v", "ON_ERROR_STOP=1", "-At", "-c", sql, db()]);
        let out = "", err = "";
        p.stdout.on("data", (d) => { out += d; });
        p.stderr.on("data", (d) => { err += d; });
        p.on("close", (code) => res({ code, out, err }));
      });
      const A = jalan(sesi(w.u1, w.k1, 2));
      await new Promise((x) => setTimeout(x, 600));
      const B = jalan(sesi(w.u2, w.k2, 0));
      const [a, b] = await Promise.all([A, B]);
      const nilai = (o: string, k: string) => o.split("\n").find((l) => l.startsWith(k + "\t"))?.split("\t")[1];
      c.expect(a.code === 0 && nilai(a.out, "R") === "true", `the first confirmation: ${a.code} ${nilai(a.out, "R")} ${a.err.split("\n").find((l) => /ERROR/.test(l)) ?? ""}`);
      c.expect(b.code === 0 && nilai(b.out, "R") === "true", `the second confirmation (never a raw constraint error): ${b.code} ${nilai(b.out, "R")} ${b.err.split("\n").find((l) => /ERROR/.test(l)) ?? ""}`);
      const tunggu = Number(nilai(b.out, "T1")) - Number(nilai(b.out, "T0"));
      c.expect(tunggu >= 1.0, `the second confirmation did not wait for the first (${tunggu.toFixed(2)} s)`);
      const cek = spawnSync("psql", ["-At", "-c", `
select count(*) || '|' || count(*) filter (where not exists (select 1 from public.assessment_results x where x.supersedes_result_id = r.id))
       || '|' || (with recursive rantai as (
                      select r2.id, 1 as n from public.assessment_results r2 where r2.session_id = '${w.s1}' and r2.supersedes_result_id is null
                      union all select x.id, rantai.n + 1 from public.assessment_results x join rantai on x.supersedes_result_id = rantai.id)
                    select string_agg(coalesce(b.key_correction_id::text, 'asli'), ',' order by rantai.n)
                      from rantai left join public.assessment_result_bases b on b.result_id = rantai.id)
       || '|' || (select r3.mastery from public.assessment_results r3 where r3.id = public.hasil_terkini_id('${w.s1}'))
       || '|' || (select jsonb_array_length(b.basis -> 'koreksi') from public.assessment_result_bases b where b.result_id = public.hasil_terkini_id('${w.s1}'))
  from public.assessment_results r where r.session_id = '${w.s1}'`, db()], { encoding: "utf8" });
      const [n, kini, urut, mastery, koreksi] = cek.stdout.trim().split("|");
      c.expect(n === "3" && kini === "1", `the sitting after both: ${n} results, ${kini} current; expected 3 and exactly 1`);
      c.expect(urut === `asli,${w.k1},${w.k2}`, `the chain's order: ${urut}`);
      c.expect(mastery === "0.3333" && koreksi === "2", `the current result scores both corrections from the original answers: ${mastery}, ${koreksi} in force`);
      // the committed world is removed again (the harness, never a product path), so no other test meets it
      const bersih = spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-q", "-At", "-c", bersihkan(w.course), db()], { encoding: "utf8" });
      c.expect(bersih.status === 0 && bersih.stdout.trim().split("\n").pop() === "0",
        `the committed world was not removed cleanly: ${bersih.stdout.trim().split("\n").pop()} ${(bersih.stderr || "").split("\n").find((l) => /ERROR/.test(l)) ?? ""}`);
      // the world's people keep no live role after it (its SYSTEM_ADMIN would otherwise be a second platform admin for
      // every later test, e.g. B0-A04's sole platform admin); the harness ends them as it removed the rest, triggers off
      const peran = spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-q", "-At", "-c", `
begin; set local session_replication_role = replica;
update public.role_assignments ra set revoked_at = now(), revoked_reason = 'selftest: C1W-C01 world removed'
 where ra.revoked_at is null and ra.person_id in (select a.person_id from public.accounts a join auth.users u on u.id = a.auth_user_id
                                                   where u.email like 'c1w-%@local.invalid');
commit;
select count(*) from public.role_assignments ra join public.accounts a on a.person_id = ra.person_id join auth.users u on u.id = a.auth_user_id
 where ra.revoked_at is null and u.email like 'c1w-%@local.invalid';`, db()], { encoding: "utf8" });
      c.expect(peran.status === 0 && peran.stdout.trim().split("\n").pop() === "0",
        `the committed world's people still hold a live role: ${peran.stdout.trim()} ${(peran.stderr || "").split("\n").find((l) => /ERROR/.test(l)) ?? ""}`);
      return c.verdict("two key corrections of one package confirmed at the same moment by two people on two real connections: the second waits for the first "
        + "(the line's lock) and stands on its result; the sitting's chain is the sealed original, the first, the second; exactly one result is current, "
        + "scored from the original answers with both corrections in force; never a raw constraint error");
    },
  },
];
