/**
 * EDUCATOR AS LEARNER (BOB-43..47, DAISY-32..34; D-069, D-070) — a Guru learns as a participant, never as a «Murid»,
 * and no academic reading moves.
 *
 *  K01  the contracts, run: a place's kind and its words (Murid / Peserta), the refusal codes the screens map
 *       (ASSIGN_CONTEXT_MISMATCH, QUICK_CONTEXT_MISMATCH, PD_*), the record read keeping only the columns returned,
 *       «Pindah kelas» never across a purpose, and every new sentence in both languages.
 *  S01  the source: the Bagian form asks once (a boolean, never the context), Siapkan and the class pages ask the
 *       database which releases a class may be given, «Murid pada bagian ini» and the transfer picker list learners
 *       only, the teacher's counts and lists say «Peserta» from the returned kind, the record is one database read
 *       reached from the facilitator's Kelas and each audience's home, never from the decision queue.
 *  D01  migration 20261118100000 against the database, rolled back: BOB-43's boundary, BOB-44's enrolment, BOB-45's
 *       kinds and the briefing, BOB-46's narrowing with the academic equivalence over every role and table, BOB-47's
 *       record per audience and catalogue MC-5. Written to run on the code before it too, where it shows each defect.
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";
import { t, LOCALES, type HleEvent } from "../src/lib/hle";
import { jenisAnggota, kataAnggota, KATA_PESERTA } from "../src/lib/mengajar";
import { kodeGalatPenugasan, kunciKodePenugasan } from "../src/lib/penugasan-kontrak";
import { kodeUjiCepat } from "../src/lib/ujicepat-kontrak";
import { kodeGalat, kunciKode, KODE_PESERTA } from "../src/lib/galat-kontrak";
import { bacaCatatan, bacaTempatCatatan, alamatCatatan } from "../src/lib/pengembangan-kontrak";
import { tujuanPindah } from "../src/lib/pindah-kelas";
import { jumlahMurid } from "../src/components/struktur/tampilan";
import type { SimpulStruktur } from "../src/lib/struktur-kontrak";

const MIGRASI = "supabase/migrations/20261118100000_an_educator_learns_as_a_participant.sql";

// ═══════════════════════════════════════════════════════════════ the database half
// One transaction, rolled back. The world is the demonstration tenant's WP2 school (selftest.wp2_school) with a
// professional-learning Bagian beside its academic ones. Where the migration is absent (the code before it), the
// place is built as an ordinary Bagian and every measurement still runs, so each defect shows as itself.
export const DB_SKRIP = `
begin;
create function pg_temp.kode(p_sql text) returns text language plpgsql as $f$
declare v_state text; v_detail text;
begin
  execute p_sql; return 'OK';
exception when others then
  get stacked diagnostics v_state = returned_sqlstate, v_detail = pg_exception_detail;
  return v_state || coalesce(':' || nullif(v_detail, ''), '');
end $f$;
-- how many rows of one table this reader sees, of the given ids
create function pg_temp.lihat(p_uid uuid, p_tabel text, p_ids uuid[]) returns int language plpgsql as $f$
declare n int;
begin
  perform selftest.as_user_uid(p_uid);
  execute format('select count(*) from public.%I where id = any ($1)', p_tabel) into n using p_ids;
  perform selftest.as_owner();
  return n;
exception when others then perform selftest.as_owner(); return -1;
end $f$;
do $eal$
declare v jsonb := '{}'::jsonb; c record; ada boolean; baru boolean; v_period uuid; v_tmpl uuid; v_item uuid; v_lbl text;
        pdb uuid; pdp uuid; pdt uuid; pdk uuid; pdk2 uuid; b2 uuid; t text; j jsonb; n int; n2 int;
        fas_u uuid; fas uuid; hpd_u uuid; hpd uuid; lain_u uuid; lain uuid; sys_u uuid; sys uuid; tanpa uuid;
        pd_course uuid; pd_rel uuid; pd_mod uuid; pd_les uuid; pd_la uuid; pd_def uuid; pd_aa uuid; ak_rel uuid; ak_def uuid;
        ps uuid; pi uuid; sig uuid; lp uuid; r_id uuid; enr uuid; v_brief uuid; v_cat text;
        n_orang int; n_akun int; n_nomor int;
        peran record; tabel text; v_eq jsonb := '{}'::jsonb; v_rls text; v_lama text; v_min int := 0;
        v_before jsonb; v_after jsonb;
begin
  perform selftest.as_owner();
  select * into c from selftest.wp2_school();
  ada := exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'org_nodes'
                                                              and column_name = 'learning_context');
  baru := to_regprocedure('public.enrol_for_professional_learning(uuid,uuid)') is not null;
  v := v || jsonb_build_object('fakta', ada, 'baru', baru, 'peserta', c.edu);
  select n0.academic_period_id into v_period from public.org_nodes n0 where n0.id = c.cls_a;
  select s.id into v_tmpl from public.assessment_sessions s
   where s.institution_id = c.inst and s.status = 'FINALIZED' and s.mode = 'POST_TEST'
     and exists (select 1 from public.assessment_results r where r.session_id = s.id)
     and exists (select 1 from public.presented_items p where p.session_id = s.id) order by s.id limit 1;
  select p.item_id into v_item from public.presented_items p where p.session_id = v_tmpl order by p.position limit 1;
  select o.label into v_lbl from public.item_options o where o.item_id = v_item order by o.label limit 1;
  select s.plp_release_id, s.assessment_definition_id into ak_rel, ak_def from public.assessment_sessions s where s.id = v_tmpl;

  -- ── the people: a facilitator of the PD Kelas, the Kepala departemen over the PD Bagian, another Guru (Kelas B),
  --    Admin platform; the participant is the school's own Guru (c.edu, Kelas A); c.hod is the other Bagian's head
  fas_u := selftest.f06p10_person('eal-fasilitator'); hpd_u := selftest.f06p10_person('eal-kaprodi-pd');
  lain_u := selftest.f06p10_person('eal-guru-lain'); sys_u := selftest.f06p10_person('eal-sysadmin');
  select a.person_id into fas from public.accounts a where a.auth_user_id = fas_u;
  select a.person_id into hpd from public.accounts a where a.auth_user_id = hpd_u;
  select a.person_id into lain from public.accounts a where a.auth_user_id = lain_u;
  select a.person_id into sys from public.accounts a where a.auth_user_id = sys_u;

  -- ── BOB-43: the place. Under the WP2 faculty, so the Dekan stands over it as over the academic branch.
  execute format('insert into public.org_nodes (institution_id, parent_id, kind, name%s) values ($1, $2, ''DEPARTMENT'', '
              || '''Pengembangan Guru EAL''%s) returning id',
                 case when ada then ', learning_context' else '' end,
                 case when ada then ', ''PROFESSIONAL_DEVELOPMENT''' else '' end)
     into pdb using c.inst, c.fac;
  insert into public.org_nodes (institution_id, parent_id, kind, name) values (c.inst, pdb, 'PROGRAMME', 'Reguler')
  returning id into pdp;
  insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
  values (c.inst, pdp, 'COHORT', 'Guru EAL', v_period) returning id into pdt;
  insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
  values (c.inst, pdt, 'CLASS', 'Kelas Guru EAL', v_period) returning id into pdk;
  insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
  values (c.inst, pdt, 'CLASS', 'Kelas Guru EAL 2', v_period) returning id into pdk2;
  perform set_config('app.seed_intent', 'synthetic', true);
  insert into public.role_assignments (person_id, role, scope_node_id, valid_until) values
    (fas, 'EDUCATOR', pdk, now() + interval '1 year'),
    (hpd, 'HEAD_OF_DEPARTMENT', pdb, now() + interval '1 year'),
    (lain, 'EDUCATOR', c.cls_b, now() + interval '1 year'),
    (sys, 'SYSTEM_ADMIN', c.root, now() + interval '1 year');
  perform set_config('app.seed_intent', '', true);

  if ada then
    execute 'select string_agg(coalesce(member_kind, ''-''), ''/'' order by array_length(jalur, 1)) from public.org_nodes '
         || 'where id = any ($1)' into t using array[pdb, pdp, pdt, pdk];
    v := v || jsonb_build_object('jenis_pd', t);
    execute 'select member_kind from public.org_nodes where id = $1' into t using c.cls_a;
    v := v || jsonb_build_object('jenis_akademik', t);
  end if;
  -- the Bagian form's own path: create_bagian(.., true) as the school's admin; its Reguler follows it
  if to_regprocedure('public.create_bagian(uuid,text,boolean)') is not null then
    perform selftest.as_user_uid(c.adm_u);
    b2 := public.create_bagian(c.inst, 'Pengembangan Guru EAL B', true);
    perform selftest.as_owner();
    execute 'select string_agg(member_kind, ''/'' order by array_length(jalur, 1)) from public.org_nodes '
         || 'where id = $1 or parent_id = $1' into t using b2;
    v := v || jsonb_build_object('bagian_form', t);
    perform selftest.as_user_uid(c.adm_u);
    select count(*) into n from public.school_structure(c.inst) x where x.node_id = pdk and x.member_kind = 'PARTICIPANT';
    select count(*) into n2 from public.school_structure(c.inst) x where x.node_id = c.cls_a and x.member_kind = 'LEARNER';
    perform selftest.as_owner();
    v := v || jsonb_build_object('struktur_jenis', n = 1 and n2 = 1);
  end if;
  -- immutable, and never moved across
  v := v || jsonb_build_object(
    'ubah_konteks', case when ada then pg_temp.kode(format('update public.org_nodes set learning_context = ''ACADEMIC'' where id = %L', pdk)) else 'TANPA_FAKTA' end,
    'pindah_simpul', pg_temp.kode(format('update public.org_nodes set parent_id = (select parent_id from public.org_nodes where id = %L) where id = %L', c.cls_a, pdk2)));

  -- ── the material: a PD course and release with one chapter and one lesson; the academic release is the template's
  insert into public.courses (institution_id, subject, stage, grade_label, title, learning_context)
  values (c.inst, 'Pengembangan', 'Guru', '-', 'Strategi EAL', 'PROFESSIONAL_DEVELOPMENT') returning id into pd_course;
  insert into public.plp_releases (institution_id, course_id, version_label) values (c.inst, pd_course, '1.0.0') returning id into pd_rel;
  insert into public.modules (course_id, institution_id, ordinal, title) values (pd_course, c.inst, 1, 'Bab 1 EAL') returning id into pd_mod;
  insert into public.lessons (module_id, institution_id, ordinal, title) values (pd_mod, c.inst, 1, 'Pelajaran 1 EAL') returning id into pd_les;
  perform selftest.pass_mark(c.inst, pd_course);

  -- BOB-43 red cases, as the owner, so the boundary is the only thing in the way (every write path meets it)
  v := v || jsonb_build_object(
    'la_pd_ke_akademik', pg_temp.kode(format('insert into public.learning_assignments (institution_id, plp_release_id, course_id, node_id, academic_period_id) values (%L, %L, %L, %L, %L)', c.inst, pd_rel, pd_course, c.cls_a, v_period)),
    'la_akademik_ke_pd', pg_temp.kode(format('insert into public.learning_assignments (institution_id, plp_release_id, course_id, node_id, academic_period_id) select %L, r.id, r.course_id, %L, %L from public.plp_releases r where r.id = %L', c.inst, pdk, v_period, ak_rel)),
    'la_akademik_ke_sekolah', pg_temp.kode(format('insert into public.learning_assignments (institution_id, plp_release_id, course_id, node_id, academic_period_id) select %L, r.id, r.course_id, %L, %L from public.plp_releases r where r.id = %L', c.inst, c.root, v_period, ak_rel)));
  insert into public.learning_assignments (institution_id, plp_release_id, course_id, node_id, academic_period_id)
  values (c.inst, pd_rel, pd_course, pdk, v_period) returning id into pd_la;
  perform selftest.as_user_uid(c.adm_u);
  perform selftest.as_release_writer();
  update public.learning_assignments set status = 'ACTIVE' where id = pd_la;
  perform selftest.as_owner();
  select f.def into pd_def from selftest.wp6_definition_for(v_tmpl, pd_rel) f;
  -- an Uji Cepat-shaped assignment (no learning assignment) of the PD chapter in the academic Kelas
  v := v || jsonb_build_object(
    'aa_pd_ke_akademik', pg_temp.kode(format('insert into public.assessment_assignments (institution_id, assessment_definition_id, node_id, academic_period_id) values (%L, %L, %L, %L)', c.inst, pd_def, c.cls_a, v_period)));
  insert into public.assessment_assignments (institution_id, assessment_definition_id, learning_assignment_id, node_id, academic_period_id)
  values (c.inst, pd_def, pd_la, pdk, v_period) returning id into pd_aa;
  if to_regprocedure('public.releases_matching_place(uuid,uuid[])') is not null then
    perform selftest.as_user_uid(c.adm_u);
    select coalesce(string_agg(case x when pd_rel then 'PD' when ak_rel then 'AK' end, '/' order by 1), '') into t
      from public.releases_matching_place(c.cls_a, array[pd_rel, ak_rel]) x;
    v := v || jsonb_build_object('siapkan_akademik', t);
    select coalesce(string_agg(case x when pd_rel then 'PD' when ak_rel then 'AK' end, '/' order by 1), '') into t
      from public.releases_matching_place(pdk, array[pd_rel, ak_rel]) x;
    v := v || jsonb_build_object('siapkan_pd', t);
    -- a reader who may neither assign nor draft in the school (a student) is told nothing
    perform selftest.as_user_uid(c.la_u);
    select count(*) into n from public.releases_matching_place(pdk, array[pd_rel, ak_rel]);
    perform selftest.as_owner();
    v := v || jsonb_build_object('siapkan_orang_lain', n);
  end if;

  -- ── BOB-44: enrol the Guru (C1), as Admin sekolah; nobody new is made
  select count(*) into n_orang from public.persons;
  select count(*) into n_akun from public.accounts;
  select count(*) into n_nomor from public.institutional_identities;
  if baru then
    perform selftest.as_user_uid(c.adm_u);
    j := public.enrol_for_professional_learning(c.edu, pdk);
    perform selftest.as_owner();
    enr := (j ->> 'enrollment')::uuid;
    v := v || jsonb_build_object('daftar', j ->> 'enrollment_status');
    perform selftest.as_user_uid(c.adm_u);
    j := public.enrol_for_professional_learning(c.edu, pdk2);
    perform selftest.as_owner();
    v := v || jsonb_build_object('pakai_lagi', (j ->> 'enrollment_reused')::boolean and (j ->> 'enrollment')::uuid = enr);
    -- a person who holds a staff role and has no account yet: PENDING, so activation keeps its meaning
    insert into public.persons (display_name) values ('Guru EAL tanpa akun') returning id into tanpa;
    perform set_config('app.seed_intent', 'synthetic', true);
    insert into public.role_assignments (person_id, role, scope_node_id, valid_until) values (tanpa, 'EDUCATOR', c.cls_b, now() + interval '1 year');
    perform set_config('app.seed_intent', '', true);
    perform selftest.as_user_uid(c.adm_u);
    j := public.enrol_for_professional_learning(tanpa, pdk);
    v := v || jsonb_build_object('tanpa_akun', j ->> 'enrollment_status',
      'tolak_akademik', pg_temp.kode(format('select public.enrol_for_professional_learning(%L, %L)', c.edu, c.cls_a)),
      'tolak_murid', pg_temp.kode(format('select public.enrol_for_professional_learning(%L, %L)', c.la, pdk)),
      'tolak_ganda', pg_temp.kode(format('select public.enrol_for_professional_learning(%L, %L)', c.edu, pdk)),
      'tolak_sekolah_lain', pg_temp.kode(format('select public.enrol_for_professional_learning((select ra.person_id from public.role_assignments ra join public.org_nodes s on s.id = ra.scope_node_id where s.institution_id <> %L and ra.role = ''EDUCATOR'' and ra.revoked_at is null and not exists (select 1 from public.role_assignments r2 join public.org_nodes s2 on s2.id = r2.scope_node_id where r2.person_id = ra.person_id and s2.institution_id = %L) limit 1), %L)', c.inst, c.inst, pdk)));
    perform selftest.as_user_uid(c.edu_u);
    v := v || jsonb_build_object('tolak_guru', pg_temp.kode(format('select public.enrol_for_professional_learning(%L, %L)', lain, pdk)));
    perform selftest.as_user_uid(c.hod_u);
    v := v || jsonb_build_object('tolak_kaprodi', pg_temp.kode(format('select public.enrol_for_professional_learning(%L, %L)', lain, pdk)));
    perform selftest.as_user_uid(c.dean_u);
    v := v || jsonb_build_object('tolak_dekan', pg_temp.kode(format('select public.enrol_for_professional_learning(%L, %L)', lain, pdk)));
    perform selftest.as_user_uid(c.adm_u);
    select count(*) into n from public.professional_learning_candidates(c.inst) x where x.person_id = c.edu;
    select count(*) into n2 from public.professional_learning_candidates(c.inst) x where x.person_id = c.la;
    v := v || jsonb_build_object('calon', n = 1 and n2 = 0);
    select count(*) into n from public.professional_learning_places(c.inst) x where x.node_id in (pdk, pdk2);
    select count(*) into n2 from public.professional_learning_places(c.inst) x where x.node_id = c.cls_a;
    v := v || jsonb_build_object('tempat', n = 2 and n2 = 0);
    perform selftest.as_user_uid(c.edu_u);
    select count(*) into n from public.professional_learning_candidates(c.inst);
    perform selftest.as_owner();
    v := v || jsonb_build_object('calon_guru', n);
  else
    insert into public.enrollments (person_id, institution_id, academic_period_id, status)
    values (c.edu, c.inst, v_period, 'ACTIVE') returning id into enr;
    insert into public.memberships (enrollment_id, node_id, academic_period_id) values (enr, pdk, v_period);
  end if;
  -- the membership rule itself, for a direct insert: a Murid is never placed in a PD place
  v := v || jsonb_build_object('murid_langsung', pg_temp.kode(format(
    'insert into public.memberships (enrollment_id, node_id, academic_period_id) select e.id, %L, %L from public.enrollments e where e.person_id = %L and e.institution_id = %L limit 1',
    pdk, v_period, c.la, c.inst)));
  v := v || jsonb_build_object('identitas_tetap',
    (select count(*) from public.persons) = n_orang + (case when baru then 1 else 0 end)
    and (select count(*) from public.accounts) = n_akun
    and (select count(*) from public.institutional_identities) = n_nomor);
  if baru then
    select public.member_kind(e) into t from public.enrollments e where e.id = enr;
    v := v || jsonb_build_object('jenis_pendaftaran', t,
      'jenis_murid', (select public.member_kind(e) from public.enrollments e where e.person_id = c.la and e.institution_id = c.inst limit 1));
  end if;

  -- ── the Guru's professional learning, as the product leaves it: a finished Uji Penguasaan with its answer and
  --    result, one integrity observation, and a lesson read to its end
  ps := selftest.wp6_evidence_session(v_tmpl, c.edu, pdk, pd_rel, pd_aa);
  pi := selftest.wp6_answer(ps, v_item, c.inst, v_lbl, 1::smallint);
  select r.id into r_id from public.responses r where r.session_id = ps limit 1;
  insert into public.integrity_signals (session_id, institution_id, category) values (ps, c.inst, 'NAVIGATION') returning id into sig;
  insert into public.lesson_progress (person_id, lesson_id, plp_release_id, institution_id, furthest_position, total_positions)
  values (c.edu, pd_les, pd_rel, c.inst, 3, 3) returning id into lp;
  v := v || jsonb_build_object('dunia', ps is not null and pi is not null and sig is not null and lp is not null
    and (select mode from public.assessment_sessions where id = ps) = 'POST_TEST');

  -- ── BOB-46: who reads the PD evidence (counts of 1 or 0)
  v := v || jsonb_build_object('baca', jsonb_build_object(
    'sesi_guru_lain', pg_temp.lihat(lain_u, 'assessment_sessions', array[ps]),
    'sesi_fasilitator', pg_temp.lihat(fas_u, 'assessment_sessions', array[ps]),
    'sesi_kaprodi_pd', pg_temp.lihat(hpd_u, 'assessment_sessions', array[ps]),
    'sesi_dekan', pg_temp.lihat(c.dean_u, 'assessment_sessions', array[ps]),
    'sesi_admin', pg_temp.lihat(c.adm_u, 'assessment_sessions', array[ps]),
    'sesi_peserta', pg_temp.lihat(c.edu_u, 'assessment_sessions', array[ps]),
    'sesi_murid', pg_temp.lihat(c.la_u, 'assessment_sessions', array[ps]),
    'kemajuan_guru_lain', pg_temp.lihat(lain_u, 'lesson_progress', array[lp]),
    'kemajuan_fasilitator', pg_temp.lihat(fas_u, 'lesson_progress', array[lp]),
    'kemajuan_dekan', pg_temp.lihat(c.dean_u, 'lesson_progress', array[lp]),
    'kemajuan_admin', pg_temp.lihat(c.adm_u, 'lesson_progress', array[lp]),
    'jawaban_admin', pg_temp.lihat(c.adm_u, 'responses', array[r_id]),
    'jawaban_kaprodi', pg_temp.lihat(c.hod_u, 'responses', array[r_id]),
    'jawaban_kaprodi_pd', pg_temp.lihat(hpd_u, 'responses', array[r_id]),
    'jawaban_fasilitator', pg_temp.lihat(fas_u, 'responses', array[r_id]),
    'jawaban_peserta', pg_temp.lihat(c.edu_u, 'responses', array[r_id]),
    'jawaban_platform', pg_temp.lihat(sys_u, 'responses', array[r_id]),
    'butir_admin', pg_temp.lihat(c.adm_u, 'presented_items', array[pi]),
    'sinyal_kaprodi', pg_temp.lihat(c.hod_u, 'integrity_signals', array[sig]),
    'sinyal_kaprodi_pd', pg_temp.lihat(hpd_u, 'integrity_signals', array[sig]),
    'sinyal_admin', pg_temp.lihat(c.adm_u, 'integrity_signals', array[sig]),
    'sinyal_platform', pg_temp.lihat(sys_u, 'integrity_signals', array[sig])));
  -- referral and review of the PD signal
  perform selftest.as_user_uid(sys_u);
  v := v || jsonb_build_object('rujuk_platform', pg_temp.kode(format('select public.refer_integrity_signal(%L, %L)', sig, 'uji')),
    'tinjau_rujuk_platform', pg_temp.kode(format('select public.record_integrity_review(%L, ''REFERRED_TO_INSTITUTION'', %L)', sig, 'uji')),
    'tinjau_platform', pg_temp.kode(format('select public.record_integrity_review(%L, ''NO_CONCERN'', %L)', sig, 'uji')));
  perform selftest.as_user_uid(hpd_u);
  v := v || jsonb_build_object('rujuk_kaprodi_pd', pg_temp.kode(format('select public.refer_integrity_signal(%L, %L)', sig, 'uji')),
    'tinjau_kaprodi_pd', pg_temp.kode(format('select public.record_integrity_review(%L, ''NO_CONCERN'', %L)', sig, 'uji')));
  perform selftest.as_owner();
  -- and the academic signal is still referred by its own department's head, as before
  perform selftest.as_user_uid(c.hod_u);
  v := v || jsonb_build_object('rujuk_akademik', pg_temp.kode(format('select public.refer_integrity_signal(%L, %L)', c.signal_a, 'uji')));
  perform selftest.as_owner();

  -- THE EQUIVALENCE: for every ACADEMIC row of the five tables, each reader sees exactly what the policy before this
  -- migration admits, evaluated here as the owner on the same rows with the reader's identity
  for peran in select * from (values ('admin', c.adm_u), ('kaprodi', c.hod_u), ('guru', c.edu_u), ('guru_lain', lain_u),
                                      ('fasilitator', fas_u), ('kaprodi_pd', hpd_u), ('dekan', c.dean_u),
                                      ('murid_a', c.la_u), ('murid_b', c.lb_u), ('platform', sys_u)) x(nama, uid) loop
    foreach tabel in array array['assessment_sessions', 'lesson_progress', 'responses', 'presented_items', 'integrity_signals'] loop
      perform selftest.as_user_uid(peran.uid);
      execute format($q$select coalesce(md5(string_agg(t.id::text, ',' order by t.id)), '-') from public.%I t
                        where %s$q$, tabel,
        case tabel when 'assessment_sessions' then 'not pg_temp.pd_rilis(t.plp_release_id)'
                   when 'lesson_progress' then 'not pg_temp.pd_rilis(t.plp_release_id)'
                   else 'not pg_temp.pd_sesi(t.session_id)' end)
        into v_rls;
      perform selftest.as_owner();
      perform set_config('request.jwt.claims', json_build_object('sub', peran.uid, 'role', 'authenticated')::text, true);
      perform set_config('request.jwt.claim.sub', peran.uid::text, true);
      execute format($q$select coalesce(md5(string_agg(t.id::text, ',' order by t.id)), '-') from public.%I t where %s$q$, tabel,
        case tabel
          when 'assessment_sessions' then 'not pg_temp.pd_rilis(t.plp_release_id) and (t.person_id = public.current_person_id() or (coalesce(t.class_node_id, t.cohort_node_id) is not null and (public.can_on_node(''CAN_REVIEW_INTEGRITY'', coalesce(t.class_node_id, t.cohort_node_id)) or public.can_on_node(''CAN_ASSIGN_LEARNING'', coalesce(t.class_node_id, t.cohort_node_id)))))'
          -- RESTATED for the System Integrity Gate (owner, 9 Nov: SI-D01 accepted; D5 approved, least privilege). The
          -- academic reference is 20270112100000 + 20270112110000: every evidence row is read over the sitting's PLACE
          -- (its Kelas, else its Angkatan; nobody else when neither), by can_on_node, never anywhere in the school;
          -- answers and questions shown also need CAN_VIEW_LEARNER_RESULT there (D5: the Admin sekolah is not an
          -- examiner); lesson progress follows a learning assignment of that release to a node the reader holds and the
          -- learner is or was in. So this check still proves the PD migration left every ACADEMIC row as the academic
          -- rule says; the readers it reports differently from the old school-wide shape are the ones SI-D01 removes.
          when 'lesson_progress' then 'not pg_temp.pd_rilis(t.plp_release_id) and (t.person_id = public.current_person_id() or exists (select 1 from public.learning_assignments la where la.plp_release_id = t.plp_release_id and la.institution_id = t.institution_id and public.can_on_node(''CAN_ASSIGN_LEARNING'', la.node_id) and exists (select 1 from public.memberships m join public.enrollments e on e.id = m.enrollment_id join public.org_nodes n on n.id = m.node_id where e.person_id = t.person_id and e.institution_id = t.institution_id and n.jalur @> array[la.node_id])))'
          when 'integrity_signals' then 'not pg_temp.pd_sesi(t.session_id) and exists (select 1 from public.assessment_sessions s where s.id = t.session_id and coalesce(s.class_node_id, s.cohort_node_id) is not null and public.can_on_node(''CAN_REVIEW_INTEGRITY'', coalesce(s.class_node_id, s.cohort_node_id)))'
          else 'not pg_temp.pd_sesi(t.session_id) and exists (select 1 from public.assessment_sessions s where s.id = t.session_id and (s.person_id = public.current_person_id() or (coalesce(s.class_node_id, s.cohort_node_id) is not null and public.can_on_node(''CAN_REVIEW_INTEGRITY'', coalesce(s.class_node_id, s.cohort_node_id)) and public.can_on_node(''CAN_VIEW_LEARNER_RESULT'', coalesce(s.class_node_id, s.cohort_node_id)))))'
        end) into v_lama;
      perform selftest.as_owner();
      if v_rls <> '-' then v_min := v_min + 1; end if;
      if v_rls is distinct from v_lama then
        v_eq := v_eq || jsonb_build_object(peran.nama || '/' || tabel, 'BEDA');
      end if;
    end loop;
  end loop;
  v := v || jsonb_build_object('setara', v_eq, 'setara_isi', v_min);

  -- ── BOB-45: the briefing at the PD Kelas, and Management's learner record of the Guru
  insert into public.briefings (institution_id, scope_node_id) values (c.inst, pdk) returning id into v_brief;
  perform selftest.as_user_uid(fas_u);
  j := public.advance_briefing(v_brief);
  perform selftest.as_owner();
  v := v || jsonb_build_object('taklimat', (j ->> 'have')::int);
  perform selftest.as_user_uid(c.dean_u);
  begin
    j := public.management_learner_detail(c.edu, c.inst);
    v := v || jsonb_build_object('rincian_tempat', jsonb_array_length(j -> 'placement'));
  exception when others then v := v || jsonb_build_object('rincian_tempat', -1);
  end;
  perform selftest.as_owner();

  -- ── BOB-47: the record per audience, catalogue MC-5, and the academic readings unmoved
  v_cat := public.current_metric_catalogue();
  v := v || jsonb_build_object('katalog', v_cat);
  if to_regprocedure('public.professional_learning_record(uuid)') is not null then
    perform selftest.as_user_uid(fas_u);
    j := public.professional_learning_record(pdk);
    v := v || jsonb_build_object('catatan_fasilitator', j);
    perform selftest.as_user_uid(c.dean_u);
    j := public.professional_learning_record(pdk);
    v := v || jsonb_build_object('catatan_dekan', j -> 'columns', 'hasil_dekan',
      (select x -> 'packages' -> 0 -> 'result' from jsonb_array_elements(j -> 'participants') x where x ->> 'person_id' = c.edu::text));
    perform selftest.as_user_uid(hpd_u);
    j := public.professional_learning_record(pdk);
    v := v || jsonb_build_object('catatan_kaprodi_pd', j -> 'columns');
    perform selftest.as_user_uid(c.adm_u);
    j := public.professional_learning_record(pdk);
    v := v || jsonb_build_object('catatan_admin', j);
    perform selftest.as_user_uid(lain_u);
    v := v || jsonb_build_object('catatan_guru_lain', pg_temp.kode(format('select public.professional_learning_record(%L)', pdk)));
    perform selftest.as_user_uid(c.hod_u);
    v := v || jsonb_build_object('catatan_kaprodi_lain', pg_temp.kode(format('select public.professional_learning_record(%L)', pdk)));
    perform selftest.as_user_uid(c.la_u);
    v := v || jsonb_build_object('catatan_murid', pg_temp.kode(format('select public.professional_learning_record(%L)', pdk)));
    perform selftest.as_user_uid(c.adm_u);
    v := v || jsonb_build_object('catatan_akademik', pg_temp.kode(format('select public.professional_learning_record(%L)', c.cls_a)));
    perform selftest.as_user_uid(fas_u);
    select count(*) into n from public.professional_record_places() x where x.node_id = pdk;
    perform selftest.as_user_uid(lain_u);
    select count(*) into n2 from public.professional_record_places() x where x.node_id = pdk;
    v := v || jsonb_build_object('pintu', n = 1 and n2 = 0);
    perform selftest.as_owner();
    -- the gate's second key is closed again after the read
    v := v || jsonb_build_object('kunci_tertutup', coalesce(nullif(current_setting('pintar.metric_professional_place', true), ''), 'tertutup'));
  end if;
  -- class readings AT the PD Kelas stay empty; the facilitator reading the Guru's learner.result through the
  -- ordinary evaluator gets no PD row (only the record admits it)
  perform selftest.as_user_uid(c.adm_u);
  v := v || jsonb_build_object('kelas_pd',
    public.metric_evaluate('class.participants', pdk, c.inst, v_cat) ->> 'status',
    'kelas_pd_pemahaman', public.metric_evaluate('class.comprehension', pdk, c.inst, v_cat) ->> 'status');
  perform selftest.as_user_uid(fas_u);
  j := public.metric_evaluate('learner.result', c.edu, c.inst, v_cat);
  perform selftest.as_owner();
  v := v || jsonb_build_object('evaluator_fasilitator', coalesce(jsonb_array_length(case when jsonb_typeof(j -> 'value') = 'array' then j -> 'value' end), 0));
  -- every academic student's learner.result, for the educator over them and for themselves, with and without the
  -- PD evidence in the world: the PD session is moved out of the way and back, inside this transaction
  perform selftest.as_user_uid(c.edu_u);
  v_before := jsonb_build_object('a', public.metric_evaluate('learner.result', c.la, c.inst, v_cat) - 'catalogue_version');
  perform selftest.as_user_uid(c.la_u);
  v_before := v_before || jsonb_build_object('a_sendiri', public.metric_evaluate('learner.result', c.la, c.inst, v_cat) - 'catalogue_version');
  perform selftest.as_user_uid(c.adm_u);
  v_before := v_before || jsonb_build_object('sekolah', public.metric_evaluate('institution.participants', c.inst, c.inst, v_cat) - 'catalogue_version',
                                             'kelas_a', public.metric_evaluate('class.participants', c.cls_a, c.inst, v_cat) - 'catalogue_version');
  perform selftest.as_owner();
  v := v || jsonb_build_object('akademik', v_before);
  -- ── E-C1-7 (D-069(b), D-167): every OTHER path to the PD participant's result, as Admin sekolah, then a planted leak
  perform selftest.as_owner();
  v := v || jsonb_build_object('sapu_hasil_ada', (select count(*) from public.assessment_results r where r.session_id = ps),
                               'sapu_sertifikat_ada', (select count(*) from public.certificates x where x.session_id = ps));
  perform selftest.as_user_uid(c.adm_u);
  v := v || jsonb_build_object(
    'sapu_hasil', (select count(*) from public.assessment_results r where r.session_id = ps),
    'sapu_hasil_orang', (select count(*) from public.assessment_results r where r.person_id = c.edu),
    'sapu_sertifikat', (select count(*) from public.certificates x where x.session_id = ps or x.person_id = c.edu));
  j := public.metric_evaluate('learner.result', c.edu, c.inst, v_cat);
  v := v || jsonb_build_object('sapu_metrik', j ->> 'status',
    'sapu_metrik_baris', coalesce(jsonb_array_length(case when jsonb_typeof(j -> 'value') = 'array' then j -> 'value' end), 0));
  -- every standard report at the PD Kelas, its Bagian and the school: no entry names the session or the participant
  n := 0; n2 := 0;
  for t in select x.id::text from public.report_templates x where x.institution_id = c.inst or x.is_standard loop
    for j in select public.generate_report(t::uuid, z) from unnest(array[pdk, pdb, c.inst]) z loop
      n := n + 1;
      if j::text like '%' || ps::text || '%' or j::text like '%' || c.edu::text || '%' or j::text like '%0.92%' then n2 := n2 + 1; end if;
    end loop;
  end loop;
  v := v || jsonb_build_object('sapu_laporan', n, 'sapu_laporan_bocor', n2);
  -- the planted control: one permissive read for every signed-in reader, inside this rolled-back transaction; the
  -- same sweep must now see the result, or it could not see a leak at all
  perform selftest.as_owner();
  execute 'create policy eal_bocor_ditanam on public.assessment_results for select to authenticated using (true)';
  perform selftest.as_user_uid(c.adm_u);
  v := v || jsonb_build_object('sapu_tanam', (select count(*) from public.assessment_results r where r.session_id = ps));
  perform selftest.as_owner();
  execute 'drop policy eal_bocor_ditanam on public.assessment_results';
  raise notice 'EAL %', v;
end $eal$;
rollback;
`;

// helpers the equivalence needs, created before the block in the same transaction (old-code safe: they read courses)
const PEMBANTU = `
create function pg_temp.pd_rilis(p uuid) returns boolean language sql stable security definer as $f$
  select coalesce((select c.learning_context::text = 'PROFESSIONAL_DEVELOPMENT' from public.plp_releases r
                     join public.courses c on c.id = r.course_id where r.id = p), false) $f$;
create function pg_temp.pd_sesi(p uuid) returns boolean language sql stable security definer as $f$
  select coalesce((select pg_temp.pd_rilis(s.plp_release_id) from public.assessment_sessions s where s.id = p), false) $f$;
grant execute on function pg_temp.pd_rilis(uuid) to authenticated;
grant execute on function pg_temp.pd_sesi(uuid) to authenticated;
`;

/** Runs the database half against a database and returns its measurements (or the error). */
export function jalankanDb(repoRoot: string, db: string): { ok: boolean; v: Record<string, unknown>; pesan: string } {
  for (const f of ["fable01.sql", "fable06.sql"]) {
    spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-q", "-1", "-f", join(repoRoot, "selftest", "db", f), db], { encoding: "utf8" });
  }
  const skrip = DB_SKRIP.replace("begin;\n", `begin;\n${PEMBANTU}\n`);
  const r = spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-At", "-c", skrip, db], { encoding: "utf8", maxBuffer: 1 << 24 });
  const baris = (r.stderr || "").split("\n");
  const catat = baris.find((l) => l.includes("NOTICE:  EAL "));
  const galat = baris.find((l) => /ERROR/.test(l)) ?? "";
  if (!catat) return { ok: false, v: {}, pesan: galat || (r.stderr || "").trim().split("\n").pop() || "no output" };
  return { ok: true, v: JSON.parse(catat.slice(catat.indexOf("EAL ") + 4)), pesan: "" };
}

const tolak = (x: unknown, kode: string) => x === `PR090:${kode}`;

export const bob43Tests: SelfTest[] = [
  {
    id: "BOB43-K01",
    run: async () => {
      const c = new Checks();
      // a place's kind and its words
      c.expect(jenisAnggota("PARTICIPANT") === "PARTICIPANT" && jenisAnggota("LEARNER") === "LEARNER" && jenisAnggota(null) === "LEARNER"
        && jenisAnggota("PROFESSIONAL") === "LEARNER", "an unread or unknown kind is not LEARNER");
      for (const [murid, peserta] of Object.entries(KATA_PESERTA)) {
        c.expect(kataAnggota(murid as keyof typeof KATA_PESERTA, "LEARNER") === murid && kataAnggota(murid as keyof typeof KATA_PESERTA, "PARTICIPANT") === peserta,
          `${murid} does not map to ${peserta} for a participant and stay itself for a learner`);
        for (const locale of LOCALES) {
          const a = t(murid as HleEvent, "educator", { locale }), b = t(peserta as HleEvent, "educator", { locale });
          c.expect(/murid|learner|student/i.test(a) && /peserta|participant/i.test(b) && !/murid|student|learner/i.test(b),
            `(${locale}) ${murid} «${a}» / ${peserta} «${b}»: the participant word must say «peserta» and never «murid»`);
        }
      }
      c.expect(jumlahMurid(2, "id", "PARTICIPANT") === "2 peserta" && jumlahMurid(2, "id", "LEARNER") === "2 murid" && jumlahMurid(2, "id") === "2 murid",
        `the structure counts read ${jumlahMurid(2, "id", "PARTICIPANT")} / ${jumlahMurid(2, "id")}`);
      // the refusal codes the screens map, by SQLSTATE and DETAIL only
      c.expect(kodeGalatPenugasan({ code: "PR050", details: "ASSIGN_CONTEXT_MISMATCH" }) === "ASSIGN_CONTEXT_MISMATCH"
        && kunciKodePenugasan("ASSIGN_CONTEXT_MISMATCH") === "mengajar.sedia.kode.assign_context_mismatch",
        "Siapkan does not read ASSIGN_CONTEXT_MISMATCH");
      c.expect(kodeUjiCepat({ code: "PR050", details: "ASSIGN_CONTEXT_MISMATCH" }) === "QUICK_CONTEXT_MISMATCH",
        "Uji Cepat does not read the boundary's refusal");
      for (const k of KODE_PESERTA) {
        c.expect(kodeGalat({ code: "PR090", details: k }) === k, `PR090 ${k} is not read as itself`);
      }
      c.expect(kodeGalat({ code: "PR090", details: "PD_SOMETHING_ELSE" }) === "ACTION_FAILED" && kodeGalat({ code: "PR090", details: "PD_NOT_ALLOWED; x" }) === "ACTION_FAILED",
        "an unknown PR090 DETAIL is trusted");
      for (const k of [...KODE_PESERTA, "PD_INPUT_INCOMPLETE", "PD_ENROLLED"]) {
        for (const locale of LOCALES) {
          const kal = t(kunciKode(k), "staff", { locale });
          c.expect(kal.length > 10 && kunciKode(k) !== "galat.action_failed", `(${locale}) ${k} has no sentence of its own`);
        }
      }
      // the record keeps exactly the columns the database returned
      const penuh = bacaCatatan({ node_id: "k", name: "Kelas Guru", columns: "FULL", participants: [{ person_id: "p", display_name: "Bu Guru",
        enrolment_status: "ACTIVE", packages: [{ learning_assignment_id: "la", title: "Bab 1", started: true, pre_test: "SELESAI", post_test: "SELESAI",
          completed: true, lessons_done: 3, lessons_total: 5, result: { mastery: "0.92", passed: true } }] }] });
      const terbatas = bacaCatatan({ node_id: "k", name: "Kelas Guru", columns: "COMPLETION", participants: [{ person_id: "p", display_name: "Bu Guru",
        enrolment_status: "PENDING", packages: [{ learning_assignment_id: "la", title: "Bab 1", started: false, pre_test: "BELUM", post_test: "x", completed: false }] }] });
      const pk = penuh?.peserta[0]?.paket[0];
      c.expect(pk?.pelajaran?.selesai === 3 && pk?.pelajaran?.jumlah === 5 && pk?.hasil?.penguasaan === 0.92 && pk?.hasil?.tercapai === true && pk?.selesai === true,
        `the facilitator's record reads ${JSON.stringify(pk)}`);
      const tk = terbatas?.peserta[0]?.paket[0];
      c.expect(terbatas?.kolom === "COMPLETION" && tk !== undefined && !("pelajaran" in tk) && !("hasil" in tk) && tk.penguasaan === "BELUM"
        && terbatas?.peserta[0]?.terdaftar === "PENDING", `Admin sekolah's record reads ${JSON.stringify(terbatas)}`);
      c.expect(bacaCatatan(null) === null && bacaCatatan({ node_id: 1 }) === null && bacaCatatan("x") === null, "a non-record is read as one");
      c.expect(JSON.stringify(bacaTempatCatatan([{ node_id: "k", name: "Kelas", academic_year: "2026/2027" }, { name: "x" }])) === JSON.stringify([{ id: "k", nama: "Kelas", tahun: "2026/2027" }])
        && alamatCatatan("a b") === "/pengembangan/a%20b", "the record's places or address");
      // «Pindah kelas» never offers a place of the other purpose
      const r = (id: string, level: "KELAS" | "TINGKAT", jenis: string, tahun = "2026/2027"): SimpulStruktur =>
        ({ node_id: id, level, parent_id: null, name: id, academic_year: tahun, is_active: true, active_members: 1, member_kind: jenis });
      const tujuan = tujuanPindah([r("1A", "KELAS", "LEARNER"), r("1B", "KELAS", "LEARNER"), r("G1", "KELAS", "PARTICIPANT"), r("G2", "KELAS", "PARTICIPANT")], "1A").map((x) => x.node_id);
      const tujuanPd = tujuanPindah([r("1A", "KELAS", "LEARNER"), r("G1", "KELAS", "PARTICIPANT"), r("G2", "KELAS", "PARTICIPANT")], "G1").map((x) => x.node_id);
      c.expect(JSON.stringify(tujuan) === '["1B"]' && JSON.stringify(tujuanPd) === '["G2"]', `«Pindah kelas» offers ${JSON.stringify(tujuan)} / ${JSON.stringify(tujuanPd)}`);
      // every new sentence, both languages, none empty
      const hle = readFileSync(join(process.cwd(), "src", "lib", "hle.ts"), "utf8");
      const kunci = [...hle.matchAll(/^ {2}"((?:pengembangan|config\.peserta|config\.struktur\.untuk|config\.struktur\.peserta)[a-zA-Z0-9_.]*)": \{/gm)].map((m) => m[1]);
      c.expect(kunci.length >= 30, `${kunci.length} new copy keys found`);
      for (const k of kunci) for (const locale of LOCALES) c.expect(t(k as HleEvent, "staff", { locale }).trim().length > 0, `${k} (${locale}) is empty`);
      return c.verdict("the kind reaches the words: each learner key and its participant form (Peserta, never Murid, both languages), the structure's " +
        "counts; ASSIGN_CONTEXT_MISMATCH read by Siapkan and Uji Cepat; PR090's six PD_* codes read by DETAIL only, each with its sentence; " +
        "the record keeps exactly the columns returned (Admin sekolah's has no progress or result); «Pindah kelas» never offers the other purpose");
    },
  },
  {
    id: "BOB43-S01",
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const baca = (...p: string[]) => readFileSync(join(repoRoot, ...p), "utf8");
      const aksi = baca("src", "app", "konfigurasi", "actions.ts");
      c.expect(/struktur\("create_bagian", \{ p_institution: institusi, p_name: str\(fd, "nama"\), p_for_educators: str\(fd, "untuk"\) === "guru" \}\)/.test(aksi),
        "the Bagian form does not pass its one choice as a boolean");
      c.expect(/rpc\("enrol_for_professional_learning", \{ p_person: orang, p_node: tempat \}\)/.test(aksi) && /kode: "PD_INPUT_INCOMPLETE"/.test(aksi),
        "«Daftarkan sebagai peserta» does not make the one database call");
      const panel = baca("src", "components", "struktur", "PanelStruktur.tsx");
      c.expect(/name="untuk" value="murid" checked=\{untuk === "murid"\}/.test(panel) && /useState<"murid" \| "guru">\("murid"\)/.test(panel)
        && /simpul\.member_kind === "PARTICIPANT"/.test(panel), "the Bagian form does not preselect the school's teaching, or the purpose is not shown");
      const ajar = baca("src", "lib", "pengajar.ts");
      c.expect(/export async function terbitan\(institusi: string, kelas\?: string\)/.test(ajar) && /rpc\("releases_matching_place", \{ p_node: kelas, p_releases:/.test(ajar)
        && /member_kind"\)\s*\n\s*\.eq\("kind", "CLASS"\)/.test(ajar), "Siapkan does not ask the database which releases a class may be given, or the class's kind is not read");
      for (const f of [["[kelas]", "page.tsx"], ["[kelas]", "langkah", "page.tsx"], ["[kelas]", "siapkan", "page.tsx"]]) {
        c.expect(/ajar\.terbitan\(ctx\.ini\.institusi, id\)/.test(baca("src", "app", "mengajar", ...f)), `${f.join("/")} lists releases without its class`);
      }
      const kelas = baca("src", "app", "mengajar", "[kelas]", "page.tsx");
      c.expect(/kataAnggota\("mengajar\.fakta\.murid", ctx\.ini\.jenis\)/.test(kelas) && /kataAnggota\("mengajar\.murid\.judul", ctx\.ini\.jenis\)/.test(kelas)
        && /ctx\.ini\.jenis === "PARTICIPANT" \? \(\s*<Link className="pin-btn" href=\{alamatCatatan\(id\)\}>/.test(kelas),
        "the class page does not name its people by their kind, or does not lead the facilitator to the record");
      c.expect(/kataAnggota\("mengajar\.bukti\.murid", k\.jenis\)/.test(baca("src", "app", "mengajar", "page.tsx")), "the home's class cards still say «murid» for participants");
      c.expect(/kataAnggota\("mengajar\.bukti\.murid", jenis\)/.test(baca("src", "components", "bukti", "KeadaanHariIni.tsx"))
        && /jenis=\{ctx\.ini\.jenis\}/.test(baca("src", "app", "mengajar", "[kelas]", "bukti", "page.tsx")), "«Keadaan hari ini» still says «murid» for participants");
      c.expect(/kataAnggota\("mengajar\.siapa\.kosong", ctx\.ini\.jenis\)/.test(baca("src", "app", "mengajar", "[kelas]", "siapa", "page.tsx"))
        && /kataAnggota\("mengajar\.siap\.terdaftar", ctx\.ini\.jenis\)/.test(baca("src", "app", "mengajar", "[kelas]", "uji-cepat", "page.tsx")),
        "/siapa or Uji Cepat still say «murid» for participants");
      const pim = baca("src", "lib", "pimpinan.ts");
      c.expect(/node:org_nodes\(member_kind\)/.test(pim) && /\.filter\(\(m\) => m\.node\?\.member_kind !== "PARTICIPANT"\)/.test(pim),
        "«Murid pada bagian ini» still lists professional-learning participants");
      const konf = baca("src", "app", "konfigurasi", "page.tsx");
      // RESTATED FOR W2.17: the enrolments come from school_people_page (ACTIVE only, each with its member_kind; migration
      // 20261230100000) instead of the table's policy, which timed out at 10x staging; the picker's filter is unchanged
      c.expect(/\.rpc\("school_people_page"/.test(konf) && /status: string; member_kind: string; display_name: string/.test(konf)
        && /&& e\.member_kind !== "PARTICIPANT"\)\.map\(\(e\) => \(/.test(konf),
        "the transfer picker still lists professional-learning enrolments");
      c.expect(/<section id="peserta"/.test(konf) && /formulirPeserta\(sekolahStruktur\.id\)/.test(konf) && /action=\{daftarkanPesertaAction\}/.test(konf),
        "Konfigurasi has no enrol form on the database's two reads");
      const halaman = baca("src", "app", "pengembangan", "[simpul]", "page.tsx");
      const lib = baca("src", "lib", "pengembangan.ts");
      c.expect(/rpc\("professional_learning_record", \{ p_node: simpul \}\)/.test(lib) && /catatan\(simpul\)/.test(halaman)
        && !/\.from\(/.test(lib) && /HalamanPenolakan/.test(halaman), "the record is not one database read, or a refusal is not the one refusal page");
      const rumah = baca("src", "app", "pimpinan", "page.tsx");
      const antre = rumah.slice(rumah.indexOf("── B. NEEDS ATTENTION"), rumah.indexOf("── C."));
      c.expect(/tempatCatatan\(\)/.test(rumah) && /── F\. EDUCATORS' PROFESSIONAL LEARNING/.test(rumah) && !/alamatCatatan|tempatCatatan|catatanPd/.test(antre),
        "/pimpinan does not link the records, or links them inside the decision queue");
      // src never names the context (R10, UX1-AJAR-KONTEKS-01's words)
      for (const f of ["src/lib/pengembangan.ts", "src/lib/pengembangan-kontrak.ts", "src/app/pengembangan/[simpul]/page.tsx", "src/lib/mengajar.ts",
        // D-195(4): the result page and the engine ask whether an assignment is professional learning as a boolean
        "src/lib/assessment-engine/index.ts", "src/app/belajar/[tugas]/hasil/page.tsx"]) {
        c.expect(!/learning_context|PROFESSIONAL_DEVELOPMENT/.test(baca(f)), `${f} names the context`);
      }
      const mig = baca(MIGRASI);
      c.expect(/create trigger learning_assignments_context_matches_place/.test(mig) && /create trigger assessment_assignments_context_matches_place/.test(mig)
        && /create trigger memberships_purpose before insert on public\.memberships/.test(mig), "the boundary or the membership rule is not a trigger");
      return c.verdict("the Bagian form passes one boolean with the school's teaching preselected and shows the purpose read-only; Siapkan, the class " +
        "page and «Langkah» ask releases_matching_place for their class; the class page, home, «Keadaan hari ini», /siapa and Uji Cepat name a " +
        "class's people by its returned kind; «Murid pada bagian ini» and the transfer picker list learners only; Konfigurasi's enrol form " +
        "makes the one call on the two reads; the record is one database read, linked from the facilitator's Kelas and /pimpinan outside " +
        "the decision queue; no new src file names the context; the boundary and the membership rule are triggers");
    },
  },
  {
    id: "BOB43-D01",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const hasil = jalankanDb(repoRoot, process.env.SUPABASE_DB_URL!);
      if (!c.expect(hasil.ok, `the database half could not run: ${hasil.pesan}`)) return c.verdict("");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the database's own JSON
      const v: Record<string, any> = hasil.v;
      c.expect(v.fakta === true && v.baru === true, `the migration is absent (fact ${v.fakta}, functions ${v.baru})`);
      c.expect(v.dunia === true, "the professional-learning world was not built (a session, answer, signal and progress)");
      // BOB-43
      c.expect(v.jenis_pd === "PARTICIPANT/PARTICIPANT/PARTICIPANT/PARTICIPANT" && v.jenis_akademik === "LEARNER" && v.bagian_form === "PARTICIPANT/PARTICIPANT"
        && v.struktur_jenis === true, `the place's kind: ${v.jenis_pd}, academic ${v.jenis_akademik}, the form's Bagian ${v.bagian_form}, school_structure ${v.struktur_jenis}`);
      c.expect(v.ubah_konteks === "P0001" && v.pindah_simpul === "P0001", `a context change (${v.ubah_konteks}) or a move across (${v.pindah_simpul}) is not refused`);
      c.expect(v.la_pd_ke_akademik === "PR050:ASSIGN_CONTEXT_MISMATCH" && v.la_akademik_ke_pd === "PR050:ASSIGN_CONTEXT_MISMATCH"
        && v.la_akademik_ke_sekolah === "PR050:ASSIGN_CONTEXT_MISMATCH" && v.aa_pd_ke_akademik === "PR050:ASSIGN_CONTEXT_MISMATCH",
        `the boundary: PD into academic ${v.la_pd_ke_akademik}, academic into PD ${v.la_akademik_ke_pd}, above a Bagian ${v.la_akademik_ke_sekolah}, an Uji Cepat ${v.aa_pd_ke_akademik}`);
      c.expect(v.siapkan_akademik === "AK" && v.siapkan_pd === "PD" && v.siapkan_orang_lain === 0,
        `Siapkan offers ${v.siapkan_akademik} to the academic Kelas and ${v.siapkan_pd} to the PD Kelas; a student asking is told ${v.siapkan_orang_lain}`);
      // BOB-44
      c.expect(v.daftar === "ACTIVE" && v.pakai_lagi === true && v.tanpa_akun === "PENDING" && v.identitas_tetap === true,
        `enrolment: ${v.daftar}, reused ${v.pakai_lagi}, without an account ${v.tanpa_akun}, persons/accounts/numbers unchanged ${v.identitas_tetap}`);
      c.expect(tolak(v.tolak_akademik, "PD_PLACE_NOT_FOR_EDUCATORS") && tolak(v.tolak_murid, "PD_PERSON_NOT_STAFF") && tolak(v.tolak_ganda, "PD_ALREADY_ENROLLED")
        && tolak(v.tolak_sekolah_lain, "PD_PERSON_NOT_STAFF") && tolak(v.tolak_guru, "PD_NOT_ALLOWED") && tolak(v.tolak_kaprodi, "PD_NOT_ALLOWED")
        && tolak(v.tolak_dekan, "PD_NOT_ALLOWED") && tolak(v.murid_langsung, "PD_PERSON_NOT_STAFF"),
        `refusals: ${JSON.stringify([v.tolak_akademik, v.tolak_murid, v.tolak_ganda, v.tolak_sekolah_lain, v.tolak_guru, v.tolak_kaprodi, v.tolak_dekan, v.murid_langsung])}`);
      c.expect(v.calon === true && v.tempat === true && v.calon_guru === 0, `the form's reads: people ${v.calon}, places ${v.tempat}, a Guru asking ${v.calon_guru}`);
      // BOB-45
      c.expect(v.jenis_pendaftaran === "PARTICIPANT" && v.jenis_murid === "LEARNER", `enrolment kinds ${v.jenis_pendaftaran} / ${v.jenis_murid}`);
      c.expect(v.taklimat === 0 && v.rincian_tempat === 0, `the PD Kelas briefing counts ${v.taklimat}; Management's learner record lists ${v.rincian_tempat} PD placement(s)`);
      // BOB-46
      const b = v.baca ?? {};
      const harap: Record<string, number> = {
        sesi_guru_lain: 0, sesi_fasilitator: 1, sesi_kaprodi_pd: 1, sesi_dekan: 1, sesi_admin: 1, sesi_peserta: 1, sesi_murid: 0,
        kemajuan_guru_lain: 0, kemajuan_fasilitator: 1, kemajuan_dekan: 1, kemajuan_admin: 0,
        jawaban_admin: 0, jawaban_kaprodi: 0, jawaban_kaprodi_pd: 0, jawaban_fasilitator: 0, jawaban_peserta: 1, jawaban_platform: 1, butir_admin: 0,
        sinyal_kaprodi: 0, sinyal_kaprodi_pd: 0, sinyal_admin: 0, sinyal_platform: 1,
      };
      const salah = Object.entries(harap).filter(([k, n]) => b[k] !== n).map(([k, n]) => `${k} ${b[k]} (expected ${n})`);
      c.expect(salah.length === 0, `who reads PD evidence: ${salah.join("; ")}`);
      c.expect(tolak(v.rujuk_platform, "PD_SIGNAL_NOT_REFERRED") && tolak(v.tinjau_rujuk_platform, "PD_SIGNAL_NOT_REFERRED") && v.tinjau_platform === "OK"
        && v.rujuk_kaprodi_pd === "P0001" && v.tinjau_kaprodi_pd === "P0001" && v.rujuk_akademik === "OK",
        `referral and review: ${JSON.stringify([v.rujuk_platform, v.tinjau_rujuk_platform, v.tinjau_platform, v.rujuk_kaprodi_pd, v.tinjau_kaprodi_pd, v.rujuk_akademik])}`);
      // RESTATED 15 -> 12 for SI-D01 and D5 (owner, 9 Nov): the floor keeps this check from passing on empty sets; the
      // narrowed rule empties sets by design (the Admin sekolah's answers and questions shown, D5; sitting and progress
      // rows of readers outside the sitting's place), so 12 non-empty reader x table sets remain on this world.
      c.expect(JSON.stringify(v.setara) === "{}" && Number(v.setara_isi) >= 12,
        `academic rows differ from the previous policies for: ${JSON.stringify(v.setara)} (${v.setara_isi} non-empty reader×table sets)`);
      // BOB-47. RESTATED FOR D-121(c): MC-6 is MC-5 copied forward (the not-yet state), PD admission unchanged.
      // RESTATED FOR CR-81 (D-123(3)): MC-7 is MC-6 copied forward (bands and floor over the assessed)
      // RESTATED FOR H31 (7 Nov): MC-8 is MC-7 copied forward (the gain paired within one chapter)
      // RESTATED FOR THE REPORTING QUALITY GATE (9 Nov): MC-9 is MC-8 copied forward (a Studio chapter's topic names)
      // RESTATED FOR THE OWNER'S WITHDRAWN RULING (10 Nov): MC-10 is MC-9 copied forward (a withdrawn assignment not counted)
      c.expect(v.katalog === "MC-10", `the live catalogue is ${v.katalog}`);
      const fasil = v.catatan_fasilitator;
      // the Guru, and the staff member enrolled without an account (PENDING), both participants of the PD Kelas
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the database's own JSON
      const guru = (fasil?.participants ?? []).find((x: any) => x.person_id === v.peserta);
      const paket = guru?.packages?.[0];
      c.expect(fasil?.columns === "FULL" && fasil?.catalogue_version === "MC-10" && fasil?.participants?.length === 2
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the database's own JSON
        && fasil.participants.every((x: any) => x.member_kind === "PARTICIPANT") && guru?.enrolment_status === "ACTIVE"
        && paket?.completed === true && paket?.post_test === "SELESAI" && paket?.lessons_done === 1 && paket?.lessons_total === 1
        && Number(paket?.result?.mastery) === 0.92 && paket?.result?.passed === true,
        `the facilitator's record: ${JSON.stringify(fasil)}`);
      c.expect(v.catatan_dekan === "FULL" && Number(v.hasil_dekan?.mastery) === 0.92 && v.catatan_kaprodi_pd === "FULL",
        `the Dekan's (${v.catatan_dekan}, ${JSON.stringify(v.hasil_dekan)}) or the PD Bagian head's (${v.catatan_kaprodi_pd}) record`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the database's own JSON
      const adm = (v.catatan_admin?.participants ?? []).find((x: any) => x.person_id === v.peserta)?.packages?.[0];
      c.expect(v.catatan_admin?.columns === "COMPLETION" && adm?.completed === true && !("result" in (adm ?? {})) && !("lessons_done" in (adm ?? {}))
        && v.catatan_admin?.catalogue_version == null, `Admin sekolah's record: ${JSON.stringify(v.catatan_admin)}`);
      c.expect(tolak(v.catatan_guru_lain, "PD_RECORD_NOT_ALLOWED") && tolak(v.catatan_kaprodi_lain, "PD_RECORD_NOT_ALLOWED")
        && tolak(v.catatan_murid, "PD_RECORD_NOT_ALLOWED") && tolak(v.catatan_akademik, "PD_RECORD_NOT_ALLOWED") && v.pintu === true,
        `refused: another Guru ${v.catatan_guru_lain}, another Bagian's head ${v.catatan_kaprodi_lain}, a student ${v.catatan_murid}, an academic Kelas ${v.catatan_akademik}; the links ${v.pintu}`);
      c.expect(v.kunci_tertutup === "tertutup", `the gate's key stayed open after the read: ${v.kunci_tertutup}`);
      // E-C1-7: Admin sekolah reaches the PD result by no other path; the planted permissive policy is seen by the same sweep
      c.expect(Number(v.sapu_hasil_ada) >= 1, `the world holds no PD result to protect (${v.sapu_hasil_ada})`);
      c.expect(Number(v.sapu_hasil) === 0 && Number(v.sapu_hasil_orang) === 0 && Number(v.sapu_sertifikat) === 0,
        `Admin sekolah reads the PD result: assessment_results ${v.sapu_hasil} by session, ${v.sapu_hasil_orang} by person; certificates ${v.sapu_sertifikat} (of ${v.sapu_sertifikat_ada})`);
      c.expect(v.sapu_metrik !== "ok" && Number(v.sapu_metrik_baris) === 0, `metric_evaluate('learner.result') gives Admin sekolah ${v.sapu_metrik} with ${v.sapu_metrik_baris} row(s)`);
      c.expect(Number(v.sapu_laporan) >= 3 && Number(v.sapu_laporan_bocor) === 0, `generate_report: ${v.sapu_laporan_bocor} of ${v.sapu_laporan} reports at the PD Kelas, its Bagian or the school name the PD result`);
      c.expect(Number(v.sapu_tanam) >= 1, `the planted permissive policy was not seen by the sweep (${v.sapu_tanam}): it cannot detect a leak`);
      c.expect(v.kelas_pd !== "ok" && v.kelas_pd_pemahaman !== "ok" && v.evaluator_fasilitator === 0,
        `figures at the PD Kelas: participants ${v.kelas_pd}, comprehension ${v.kelas_pd_pemahaman}; the ordinary evaluator gives the facilitator ${v.evaluator_fasilitator} PD row(s)`);
      const a = v.akademik ?? {};
      c.expect(a.a?.status === "ok" && a.a_sendiri?.status === "ok", `the academic control is vacuous: ${JSON.stringify(a)}`);
      return c.verdict("migration 20261118100000 against the database, rolled back, on the WP2 school with a professional-learning Bagian: the place's " +
        "kind is set on the Bagian (create_bagian's boolean too) and inherited, never changed or moved across; the boundary refuses PD material " +
        "in an academic Kelas, academic material in a PD Kelas, any above a Bagian and an Uji Cepat across, ASSIGN_CONTEXT_MISMATCH; Siapkan is " +
        "offered only matching releases; C1 enrols the Guru ACTIVE, reuses the enrolment, enrols a staff member without an account PENDING, " +
        "creates no person, account or number, and refuses an academic Kelas, a Murid (C1 and a direct membership), a duplicate, another " +
        "school's teacher and every caller without CAN_PROVISION_PEOPLE; the briefing and Management's learner record count no PD; PD sessions " +
        "reach the participant, facilitator, PD Bagian head, Dekan and Admin sekolah only, progress not Admin sekolah, answers and signals no " +
        "school role, referral refused for everyone and review for school roles; every academic row is read exactly as the previous policies " +
        "admit, for ten readers and five tables; the record gives the facilitator, Dekan and PD head progress and the 0.92 result through MC-5, " +
        "Admin sekolah completion only, and refuses everyone else; the gate's key closes; no figure at the PD Kelas");
    },
  },
];
