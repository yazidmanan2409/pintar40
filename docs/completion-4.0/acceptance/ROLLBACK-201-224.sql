-- ROLLBACK OF MIGRATIONS 201-224 (20270110100000 .. 20270113160000): the System Integrity work, the lifecycle actions,
-- Kenaikan kelas, Jejak audit by run, the school's own clock. The staging promotion's recovery arrangement for
-- candidate ab4146da.
--
-- NOT A MIGRATION and NEVER APPLIED BY ANY WORKFLOW. Run as the database owner, in its one transaction, only on the
-- owner's say. The physical backup remains the recovery point for data; this script is the schema's way back without
-- a restore. It names no environment: the operator chooses the target by its connection string.
--
-- HOW IT WAS MADE. Not written by hand: 201-224 change too much for that (46 functions replaced, 67 added, 6 views,
-- 11 policies, 4 tables altered, 2 tables added, the metric catalogue moved from MC-8 to MC-10). It is generated from
-- two real local databases, one at 200 and one at 224 (pg_dump, schema public), object by object: every definition
-- below is 200's own, as PostgreSQL printed it.
--
-- WHAT IT DOES, in order: refuses a database not at 200..224, and one holding a row only 224 allows (step 1); drops
-- 201-224's triggers; puts back 200's policies; drops the six changed views (with the three views and seventeen
-- calc_* functions that read them); takes 201-224's columns, constraints, indexes and two tables away; drops the 67
-- added functions; recreates the views and what they carried, then 200's bodies of the 46 changed functions, with
-- their grants; restores the two table grants 201-224 narrowed (enrollments, memberships) and period_rollover's;
-- removes 201-224's reference rows and returns the catalogue in force to MC-8; removes the 24 schema_migrations rows
-- so that `supabase migration up` re-applies 201-224 cleanly; and checks itself.
--
-- WHAT A ROLLBACK KEEPS AND LOSES, by design:
--   * KEPT: every row of every table that existed at 200 (people, enrolments, sittings, answers, results,
--     certificates, the audit trail). Rows written by 201-224's functions stay as they are.
--   * LOST: the two tables 201-224 added, WITH THEIR ROWS (account_requests, person_suspensions: a suspension or a
--     closure request recorded since the promotion); each school's zona_waktu (every school reads as WIB again); a
--     corrected certificate's correction_reason and corrected_by; the catalogue versions MC-9 and MC-10.
--   * IT REFUSES, changing nothing, where it cannot be faithful: a device session ended for a reason 200 does not know
--     (step 1); and, by PostgreSQL's own foreign keys, any row that still points at MC-9/MC-10 or at a dropped table.
--     The owner then decides those rows; the script is not widened to delete them.
--   * LOCKS: it rewrites audit_log once (dropping the stored run_id) and takes ACCESS EXCLUSIVE on the tables it
--     alters; run it in a quiet window.
--
-- EVERY STATE A DEPLOYMENT CAN LEAVE. `supabase db push` applies each file in its own transaction and stops at the
-- first failure, so the database is at 200, 224 or any count between. Every statement is a no-op where its object is
-- absent, so one script serves all of them and is safe to run twice.
--
-- REHEARSED LOCALLY on 10-11 Nov 2026, each from its real state; "equal to 200" means pg_dump of schema public compared
-- with 200's object by object (0 missing, 0 different, 0 left over), and the nine reference tables row by row:
--   224 (no seed)          -> this script -> 200 migrations, equal to 200;
--   200                    -> this script again -> no change, equal to 200;
--   `supabase migration up` -> 224, equal to 224's own dump (0, 0, 0);
--   201, 208, 215 and 221 (reset --version) -> this script -> 200, equal to 200, each;
--   224 with the seeds      -> this script -> 200, equal to 200; the row counts of persons, enrollments, memberships,
--                              sittings, answers, results, certificates, audit_log and institutions unchanged;
--   224 with a device session ended 'DITANGGUHKAN' -> refused at step 1, still 224, nothing changed; the row removed
--                              -> this script -> 200, equal to 200.
-- NOT REHEARSED: staging's own data, and the time the audit_log rewrite takes there.

begin;

-- 0. only a database at 200..224 of this line
do $$
declare n int;
begin
  select count(*) into n from supabase_migrations.schema_migrations;
  if n < 200 or n > 224 or exists (select 1 from supabase_migrations.schema_migrations where version > '20270113160000') then
    raise exception 'ROLLBACK-201-224: this database is not at 200..224 (% migrations)', n;
  end if;
end $$;

-- 1. refuse where a row holds a value only 201-224 allow (the 200 constraint could not be restored over it)
do $$
begin
  if exists (select 1 from public.device_sessions where ended_reason is not null and ended_reason not in ('PIN_GAGAL','KUNCI_HABIS','KELUAR','KELUAR_SEMUA','KREDENSIAL_DIGANTI','PASSWORD_PERTAMA')) then
    raise exception 'ROLLBACK-201-224: device_sessions holds an ended_reason 200 does not know; decide those rows first';
  end if;
end $$;

-- 2. triggers of 201-224
drop trigger if exists audit_log_run_parent on public.audit_log;
drop trigger if exists enrollments_programme_alone on public.enrollments;

-- 3. policies: those 201-224 changed or dropped, as 200 had them
drop policy if exists assessment_sessions_select on public.assessment_sessions;
CREATE POLICY assessment_sessions_select ON public.assessment_sessions FOR SELECT TO authenticated USING (((person_id = public.current_person_id()) OR
CASE
    WHEN public.release_is_professional(plp_release_id) THEN (public.professional_audience(COALESCE(class_node_id, cohort_node_id)) && ARRAY['FACILITATOR'::text, 'HEAD'::text, 'DEAN'::text, 'ADMIN'::text, 'PLATFORM'::text])
    ELSE (public.can_in_institution('CAN_REVIEW_INTEGRITY'::text, institution_id) OR public.can_in_institution('CAN_ASSIGN_LEARNING'::text, institution_id))
END));
drop policy if exists evidence_class_overrides_insert on public.evidence_class_overrides;
CREATE POLICY evidence_class_overrides_insert ON public.evidence_class_overrides FOR INSERT TO authenticated WITH CHECK (public.can_in_institution('CAN_REVIEW_INTEGRITY'::text, institution_id));
drop policy if exists evidence_class_overrides_select on public.evidence_class_overrides;
CREATE POLICY evidence_class_overrides_select ON public.evidence_class_overrides FOR SELECT TO authenticated USING (public.can_in_institution('CAN_REVIEW_INTEGRITY'::text, institution_id));
drop policy if exists integrity_signals_select on public.integrity_signals;
CREATE POLICY integrity_signals_select ON public.integrity_signals FOR SELECT TO authenticated USING (
CASE
    WHEN public.session_is_professional(session_id) THEN public.is_system_admin()
    ELSE public.can_in_institution('CAN_REVIEW_INTEGRITY'::text, institution_id)
END);
drop policy if exists lesson_progress_select on public.lesson_progress;
CREATE POLICY lesson_progress_select ON public.lesson_progress FOR SELECT TO authenticated USING (((person_id = public.current_person_id()) OR
CASE
    WHEN public.release_is_professional(plp_release_id) THEN public.professional_progress_readable(person_id, plp_release_id, institution_id)
    ELSE public.can_in_institution('CAN_ASSIGN_LEARNING'::text, institution_id)
END));
drop policy if exists presented_items_select on public.presented_items;
CREATE POLICY presented_items_select ON public.presented_items FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.assessment_sessions s
  WHERE ((s.id = presented_items.session_id) AND ((s.person_id = public.current_person_id()) OR
        CASE
            WHEN public.release_is_professional(s.plp_release_id) THEN public.is_system_admin()
            ELSE public.can_in_institution('CAN_REVIEW_INTEGRITY'::text, s.institution_id)
        END)))));
drop policy if exists responses_select on public.responses;
CREATE POLICY responses_select ON public.responses FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.assessment_sessions s
  WHERE ((s.id = responses.session_id) AND ((s.person_id = public.current_person_id()) OR
        CASE
            WHEN public.release_is_professional(s.plp_release_id) THEN public.is_system_admin()
            ELSE public.can_in_institution('CAN_REVIEW_INTEGRITY'::text, s.institution_id)
        END)))));
drop policy if exists enrollments_insert on public.enrollments;
CREATE POLICY enrollments_insert ON public.enrollments FOR INSERT TO authenticated WITH CHECK (public.has_scope('INSTITUTION_ADMIN'::public.app_role, institution_id));
drop policy if exists enrollments_update on public.enrollments;
CREATE POLICY enrollments_update ON public.enrollments FOR UPDATE TO authenticated USING (public.has_scope('INSTITUTION_ADMIN'::public.app_role, institution_id)) WITH CHECK (public.has_scope('INSTITUTION_ADMIN'::public.app_role, institution_id));
drop policy if exists memberships_insert on public.memberships;
CREATE POLICY memberships_insert ON public.memberships FOR INSERT TO authenticated WITH CHECK (public.has_scope('INSTITUTION_ADMIN'::public.app_role, node_id));
drop policy if exists memberships_update on public.memberships;
CREATE POLICY memberships_update ON public.memberships FOR UPDATE TO authenticated USING (public.has_scope('INSTITUTION_ADMIN'::public.app_role, node_id)) WITH CHECK (public.has_scope('INSTITUTION_ADMIN'::public.app_role, node_id));

-- 4. views 201-224 changed: dropped here with what reads them, all recreated as 200 had them in step 8
drop view if exists public.service_distractor_uptake cascade;
drop view if exists public.service_item_statistics cascade;
drop view if exists public.scoped_certificates cascade;
drop view if exists public.scoped_service_cohort_misconceptions cascade;
drop view if exists public.service_cohort_misconceptions cascade;
drop view if exists public.scoped_official_sessions cascade;

-- 6. tables: columns, constraints and indexes of 201-224; the two new tables
drop index if exists public.account_requests_one_open;
drop index if exists public.audit_log_run_idx;
drop index if exists public.audit_log_run_parent_uq;
drop index if exists public.certificates_one_sealed_replacement;
drop index if exists public.enrollments_one_live_per_school_year;
drop index if exists public.person_suspensions_one_open;
alter table public.audit_log drop column if exists run_id;
alter table public.certificates drop constraint if exists certificate_correction_is_a_replacement, drop constraint if exists certificates_correction_reason_check, drop constraint if exists certificates_corrected_by_person_id_fkey, drop column if exists correction_reason, drop column if exists corrected_by_person_id;
alter table public.institutions drop constraint if exists institutions_zona_waktu_check, drop column if exists zona_waktu;
alter table public.device_sessions drop constraint if exists device_sessions_ended_reason_check;
alter table public.device_sessions add constraint device_sessions_ended_reason_check CHECK ((ended_reason = ANY (ARRAY['PIN_GAGAL'::text, 'KUNCI_HABIS'::text, 'KELUAR'::text, 'KELUAR_SEMUA'::text, 'KREDENSIAL_DIGANTI'::text, 'PASSWORD_PERTAMA'::text])));
drop table if exists public.account_requests;
drop table if exists public.person_suspensions;

-- 7. the functions 201-224 added
drop function if exists public.akhiri_pendaftaran(uuid, text, text, date);
drop function if exists public.akhiri_penugasan(uuid, text, text, boolean);
drop function if exists public.akhiri_penugasan_pratinjau(uuid);
drop function if exists public.akhiri_tugas_staf(uuid, uuid, text, text, date);
drop function if exists public.aktifkan_kembali_akun(uuid, text);
drop function if exists public.akun_keadaan(uuid);
drop function if exists public.akun_kunci(uuid, boolean);
drop function if exists public.akun_tolak(text);
drop function if exists public.atur_zona_waktu_sekolah(uuid, text);
drop function if exists public.audit_run_parent_check();
drop function if exists public.boleh_akhiri_penugasan(uuid);
drop function if exists public.boleh_atas_sesi(uuid, text);
drop function if exists public.boleh_koreksi_sesi(uuid);
drop function if exists public.buka_kembali_akun(uuid, text);
drop function if exists public.sesi_dari_penugasan_ditarik(uuid);
drop function if exists public.sesi_ditarik_dikecualikan(uuid);
drop function if exists public.calc_class_chapter_mastery(uuid, uuid, text);
drop function if exists public.ditarik_dikecualikan(uuid);
drop function if exists public.daftarkan_kembali(uuid, uuid, text, text, uuid, uuid);
drop function if exists public.dari_penugasan_ditarik(uuid);
drop function if exists public.enrollments_programme_alone();
drop function if exists public.hapus_data_pribadi(uuid, text);
drop function if exists public.hari_sekolah(uuid);
drop function if exists public.integrity_signals_waiting_elsewhere();
drop function if exists public.jawaban_untuk_pemeriksaan(uuid, text);
drop function if exists public.judul_materi_kelas(uuid);
drop function if exists public.kenaikan_guru(uuid);
drop function if exists public.kenaikan_hasil(uuid);
drop function if exists public.kenaikan_populasi(uuid);
drop function if exists public.kenaikan_rencana(uuid);
drop function if exists public.kenaikan_tetapkan(uuid, uuid, jsonb, boolean, boolean);
drop function if exists public.minta_akun(text, boolean);
drop function if exists public.minta_buka_kembali(text, text);
drop function if exists public.murid_keluar(uuid);
drop function if exists public.murid_sudah_keluar(uuid, uuid);
drop function if exists public.murid_tanpa_kelas(uuid);
drop function if exists public.my_learning_history();
drop function if exists public.orang_ditangguhkan(uuid);
drop function if exists public.penugasan_sesi(uuid);
drop function if exists public.penugasan_tolak(text);
drop function if exists public.peran_orang(uuid, uuid);
drop function if exists public.permintaan_akun_antrean();
drop function if exists public.permintaan_akun_saya();
drop function if exists public.quick_assessment_label(timestamp with time zone, uuid);
drop function if exists public.riwayat_penugasan_kelas(uuid);
drop function if exists public.sekolah_memegang(uuid, uuid);
drop function if exists public.sertifikat_koreksi_kini(uuid);
drop function if exists public.sertifikat_koreksi_pratinjau(uuid);
drop function if exists public.sertifikat_koreksi_segel(uuid, smallint, text);
drop function if exists public.sertifikat_koreksi_siapkan(uuid, text, smallint);
drop function if exists public.sertifikat_koreksi_tolak(text);
drop function if exists public.sesi_saya_dihitung_ulang(uuid);
drop function if exists public.sesi_tempat(uuid);
drop function if exists public.sesi_tempat_koreksi(uuid);
drop function if exists public.staf_antrean(uuid, uuid[], jsonb, uuid);
drop function if exists public.staf_boleh(uuid);
drop function if exists public.staf_peran_hidup(uuid, uuid);
drop function if exists public.staf_sidik(uuid, uuid);
drop function if exists public.staf_tanggung_jawab(public.app_role);
drop function if exists public.staf_tolak(text);
drop function if exists public.studio_langkah_terbitan();
drop function if exists public.tangguhkan_akun(uuid, text, text);
drop function if exists public.target_kelas(uuid);
drop function if exists public.tempatkan_murid(uuid, uuid);
drop function if exists public.tutup_asesmen_terbuka(uuid, text);
drop function if exists public.ubah_peran(uuid, uuid, jsonb, uuid[], text, text, boolean, boolean);
drop function if exists public.zona_sekolah(uuid);

-- 8. the views, as 200 had them and in 200's own order: those changed, and those that read them; then the functions the drop carried away; then grants and comments
CREATE VIEW public.scoped_official_sessions AS
 SELECT id,
    person_id,
    institution_id,
    enrollment_id,
    academic_period_id,
    class_node_id,
    cohort_node_id,
    plp_release_id,
    assessment_definition_id,
    assessment_definition_version,
    engine_version,
    scoring_policy_version,
    evidence_channel,
    mode,
    status,
    started_at,
    submitted_at,
    finalized_at,
    created_at
   FROM public.official_sessions s
  WHERE (public.row_in_metric_boundary(institution_id, COALESCE(class_node_id, cohort_node_id), person_id) AND public.row_in_learning_context(plp_release_id));
CREATE VIEW public.scoped_official_results AS
 SELECT id,
    session_id,
    institution_id,
    person_id,
    engine_version,
    scoring_policy_version,
    mastery,
    per_domain,
    safety_gate_passed,
    delta_inputs,
    supersedes_result_id,
    recomputation_reason,
    computed_at
   FROM public.official_results r
  WHERE (EXISTS ( SELECT 1
           FROM public.scoped_official_sessions s
          WHERE (s.id = r.session_id)));
CREATE VIEW public.service_cohort_misconceptions WITH (security_invoker='true') AS
 SELECT s.institution_id,
    s.cohort_node_id,
    s.class_node_id,
    o.misconception_code,
    mt.label,
    mt.remediation,
    (count(*))::integer AS occurrences
   FROM ((((public.academic_responses r
     JOIN public.assessment_sessions s ON ((s.id = r.session_id)))
     JOIN public.presented_items p ON ((p.id = r.presented_item_id)))
     JOIN public.item_options o ON (((o.item_id = p.item_id) AND (o.label = (r.value ->> 'pilihan'::text)) AND (NOT o.is_correct))))
     JOIN public.misconception_taxonomy mt ON (((mt.code = o.misconception_code) AND (mt.institution_id = o.institution_id))))
  WHERE (o.misconception_code IS NOT NULL)
  GROUP BY s.institution_id, s.cohort_node_id, s.class_node_id, o.misconception_code, mt.label, mt.remediation;
CREATE VIEW public.scoped_service_cohort_misconceptions AS
 SELECT institution_id,
    cohort_node_id,
    class_node_id,
    misconception_code,
    label,
    remediation,
    occurrences
   FROM public.service_cohort_misconceptions m
  WHERE public.row_in_metric_boundary(institution_id, COALESCE(class_node_id, cohort_node_id), NULL::uuid);
CREATE VIEW public.scoped_certificates AS
 SELECT id,
    session_id,
    person_id,
    institution_id,
    snapshot_id,
    certificate_number,
    verification_token,
    status,
    issued_at,
    issued_at_iso,
    canonical_payload,
    signature,
    key_version,
    revoked_at,
    revoked_reason,
    supersedes_certificate_id,
    created_at
   FROM public.academic_certificates c
  WHERE public.person_in_metric_boundary(institution_id, person_id);
CREATE VIEW public.service_item_statistics WITH (security_invoker='true') AS
 SELECT i.id AS item_id,
    i.institution_id,
    i.lesson_id,
    i.bank_type,
    i.item_type,
    (count(*))::integer AS evidence_count,
    (count(*) FILTER (WHERE o.is_correct))::integer AS correct_count,
        CASE
            WHEN (count(*) = 0) THEN NULL::numeric
            ELSE round(((count(*) FILTER (WHERE o.is_correct))::numeric / (count(*))::numeric), 4)
        END AS correctness_rate,
    (avg(EXTRACT(epoch FROM (r.received_at - p.presented_at))))::numeric(10,3) AS mean_response_seconds,
    min(p."position") AS first_position,
    max(p."position") AS last_position
   FROM (((public.items i
     JOIN public.presented_items p ON ((p.item_id = i.id)))
     JOIN public.academic_responses r ON ((r.presented_item_id = p.id)))
     LEFT JOIN public.item_options o ON (((o.item_id = i.id) AND (o.label = (r.value ->> 'pilihan'::text)))))
  GROUP BY i.id, i.institution_id, i.lesson_id, i.bank_type, i.item_type;
CREATE VIEW public.scoped_service_item_statistics AS
 SELECT item_id,
    institution_id,
    lesson_id,
    bank_type,
    item_type,
    evidence_count,
    correct_count,
    correctness_rate,
    mean_response_seconds,
    first_position,
    last_position
   FROM public.service_item_statistics st
  WHERE public.tenant_in_metric_boundary(institution_id);
CREATE VIEW public.service_distractor_uptake WITH (security_invoker='true') AS
 SELECT i.id AS item_id,
    i.institution_id,
    o.label,
    o.is_correct,
    o.misconception_code,
    (count(*))::integer AS chosen_count
   FROM (((public.items i
     JOIN public.item_options o ON ((o.item_id = i.id)))
     JOIN public.presented_items p ON ((p.item_id = i.id)))
     JOIN public.academic_responses r ON (((r.presented_item_id = p.id) AND ((r.value ->> 'pilihan'::text) = o.label))))
  GROUP BY i.id, i.institution_id, o.label, o.is_correct, o.misconception_code;
CREATE VIEW public.scoped_service_distractor_uptake AS
 SELECT item_id,
    institution_id,
    label,
    is_correct,
    misconception_code,
    chosen_count
   FROM public.service_distractor_uptake u
  WHERE public.tenant_in_metric_boundary(institution_id);
CREATE OR REPLACE FUNCTION public.calc_class_comprehension(p_node uuid, p_institution uuid, p_catalogue text) RETURNS jsonb
    LANGUAGE sql STABLE
    SET search_path TO 'public', 'pg_temp'
    BEGIN ATOMIC
 SELECT jsonb_build_object('value', round(avg(x.mastery), 4), 'sample', count(*)) AS jsonb_build_object
    FROM ( SELECT DISTINCT ON (r.session_id) r.mastery
            FROM (public.scoped_official_results r
              JOIN public.scoped_official_sessions s ON ((s.id = r.session_id)))
           WHERE ((s.institution_id = calc_class_comprehension.p_institution) AND (s.class_node_id = calc_class_comprehension.p_node) AND (s.mode = 'POST_TEST'::public.assessment_mode))
           ORDER BY r.session_id, r.computed_at DESC) x;
END;
CREATE OR REPLACE FUNCTION public.calc_class_misconceptions(p_node uuid, p_institution uuid, p_catalogue text) RETURNS jsonb
    LANGUAGE sql STABLE
    SET search_path TO 'public', 'pg_temp'
    BEGIN ATOMIC
 SELECT jsonb_build_object('value', COALESCE(jsonb_agg(jsonb_build_object('code', m.misconception_code, 'label', m.label, 'remediation', m.remediation, 'occurrences', m.occurrences) ORDER BY m.occurrences DESC), '[]'::jsonb), 'sample', COALESCE(sum(m.occurrences), (0)::bigint)) AS jsonb_build_object
    FROM public.scoped_service_cohort_misconceptions m
   WHERE ((m.institution_id = calc_class_misconceptions.p_institution) AND (m.class_node_id = calc_class_misconceptions.p_node));
END;
CREATE OR REPLACE FUNCTION public.calc_class_net_gain(p_node uuid, p_institution uuid, p_catalogue text) RETURNS jsonb
    LANGUAGE sql STABLE
    SET search_path TO 'public', 'pg_temp'
    BEGIN ATOMIC
 SELECT jsonb_build_object('value', round(avg((g.post - g.pre)), 4), 'sample', count(DISTINCT g.person_id)) AS jsonb_build_object
    FROM ( SELECT s.person_id,
             s.plp_release_id,
             max(
                 CASE
                     WHEN (s.mode = 'PRE_TEST'::public.assessment_mode) THEN r.mastery
                     ELSE NULL::numeric
                 END) AS pre,
             max(
                 CASE
                     WHEN (s.mode = 'POST_TEST'::public.assessment_mode) THEN r.mastery
                     ELSE NULL::numeric
                 END) AS post
            FROM (public.scoped_official_sessions s
              JOIN public.scoped_official_results r ON ((r.session_id = s.id)))
           WHERE ((s.institution_id = calc_class_net_gain.p_institution) AND (s.class_node_id = calc_class_net_gain.p_node) AND (s.mode = ANY (ARRAY['PRE_TEST'::public.assessment_mode, 'POST_TEST'::public.assessment_mode])))
           GROUP BY s.person_id, s.plp_release_id) g
   WHERE ((g.pre IS NOT NULL) AND (g.post IS NOT NULL));
END;
CREATE OR REPLACE FUNCTION public.calc_class_participants(p_node uuid, p_institution uuid, p_catalogue text) RETURNS jsonb
    LANGUAGE sql STABLE
    SET search_path TO 'public', 'pg_temp'
    BEGIN ATOMIC
 SELECT jsonb_build_object('value', count(DISTINCT s.person_id), 'sample', count(DISTINCT s.person_id)) AS jsonb_build_object
    FROM public.scoped_official_sessions s
   WHERE ((s.institution_id = calc_class_participants.p_institution) AND (s.class_node_id = calc_class_participants.p_node));
END;
CREATE OR REPLACE FUNCTION public.calc_class_readiness_distribution(p_node uuid, p_institution uuid, p_catalogue text) RETURNS jsonb
    LANGUAGE sql STABLE
    SET search_path TO 'public', 'pg_temp'
    BEGIN ATOMIC
 WITH assessed AS (
          SELECT DISTINCT ON (s.person_id) s.person_id,
             r.mastery,
             r.safety_gate_passed
            FROM (public.scoped_official_sessions s
              JOIN public.scoped_official_results r ON ((r.session_id = s.id)))
           WHERE ((s.institution_id = calc_class_readiness_distribution.p_institution) AND (s.class_node_id = calc_class_readiness_distribution.p_node) AND (s.mode = 'POST_TEST'::public.assessment_mode))
           ORDER BY s.person_id, r.computed_at DESC
         ), bands AS (
          SELECT COALESCE(t.tier_key, lowest.tier_key) AS tier_key,
             count(*) AS n
            FROM ((assessed learner
              LEFT JOIN LATERAL ( SELECT t2.tier_key
                    FROM public.readiness_tiers t2
                   WHERE ((t2.catalogue_version = calc_class_readiness_distribution.p_catalogue) AND (t2.min_mastery IS NOT NULL) AND (learner.mastery >= t2.min_mastery) AND (learner.mastery < t2.max_mastery) AND (learner.safety_gate_passed IS NOT FALSE))
                  LIMIT 1) t ON (true))
              LEFT JOIN LATERAL ( SELECT t3.tier_key
                    FROM public.readiness_tiers t3
                   WHERE ((t3.catalogue_version = calc_class_readiness_distribution.p_catalogue) AND (t3.min_mastery IS NOT NULL))
                   ORDER BY t3.min_mastery
                  LIMIT 1) lowest ON (true))
           GROUP BY COALESCE(t.tier_key, lowest.tier_key)
         ), placed AS (
          SELECT DISTINCT pl.person_id
            FROM public.scoped_class_placements pl
           WHERE ((pl.institution_id = calc_class_readiness_distribution.p_institution) AND (pl.class_node_id = calc_class_readiness_distribution.p_node))
         )
  SELECT jsonb_build_object('value', COALESCE(( SELECT jsonb_object_agg(b.tier_key, b.n) AS jsonb_object_agg
            FROM bands b), '{}'::jsonb), 'sample', ( SELECT count(*) AS count
            FROM assessed), 'population', jsonb_build_object('placed', ( SELECT count(*) AS count
            FROM placed), 'assessed', ( SELECT count(*) AS count
            FROM assessed), 'not_yet', ( SELECT count(*) AS count
            FROM placed p
           WHERE (NOT (EXISTS ( SELECT 1
                    FROM assessed a
                   WHERE (a.person_id = p.person_id))))))) AS jsonb_build_object;
END;
CREATE OR REPLACE FUNCTION public.calc_class_topic_mastery(p_node uuid, p_institution uuid, p_catalogue text) RETURNS jsonb
    LANGUAGE sql STABLE
    SET search_path TO 'public', 'pg_temp'
    BEGIN ATOMIC
 SELECT jsonb_build_object('value', COALESCE(jsonb_agg(jsonb_build_object('objective_id', d.objective_id, 'code', d.code, 'competency', d.statement, 'mean_score', d.avg_score, 'learners', d.n) ORDER BY d.avg_score, d.statement, d.code), '[]'::jsonb), 'sample', COALESCE(max(d.n), (0)::bigint)) AS jsonb_build_object
    FROM ( SELECT t.objective_id,
             min(t.code) AS code,
             COALESCE(min(lo.statement), min(t.code)) AS statement,
             round(avg(((t.recorded ->> 'penguasaan'::text))::numeric), 4) AS avg_score,
             count(*) AS n
            FROM (( SELECT kv.key AS code,
                     kv.value AS recorded,
                     ( SELECT o.id
                            FROM ((public.assessment_definitions ad
                              JOIN public.lessons l ON ((l.module_id = ad.module_id)))
                              JOIN public.learning_objectives o ON ((o.lesson_id = l.id)))
                           WHERE ((ad.id = latest.assessment_definition_id) AND (o.code = kv.key))
                           ORDER BY l.ordinal, o.id
                          LIMIT 1) AS objective_id
                    FROM ( SELECT DISTINCT ON (r.session_id) r.per_domain,
                             r.session_id,
                             s.assessment_definition_id
                            FROM (public.scoped_official_results r
                              JOIN public.scoped_official_sessions s ON ((s.id = r.session_id)))
                           WHERE ((s.institution_id = calc_class_topic_mastery.p_institution) AND (s.class_node_id = calc_class_topic_mastery.p_node) AND (s.mode = 'POST_TEST'::public.assessment_mode))
                           ORDER BY r.session_id, r.computed_at DESC) latest,
                     LATERAL jsonb_each(COALESCE(latest.per_domain, '{}'::jsonb)) kv(key, value)
                   WHERE ((jsonb_typeof(kv.value) = 'object'::text) AND (jsonb_typeof((kv.value -> 'penguasaan'::text)) = 'number'::text))) t
              LEFT JOIN public.learning_objectives lo ON ((lo.id = t.objective_id)))
           GROUP BY t.objective_id, COALESCE((t.objective_id)::text, t.code)) d;
END;
CREATE OR REPLACE FUNCTION public.calc_institution_cohort_comparison(p_node uuid, p_institution uuid, p_catalogue text) RETURNS jsonb
    LANGUAGE sql STABLE
    SET search_path TO 'public', 'pg_temp'
    BEGIN ATOMIC
 SELECT jsonb_build_object('value', COALESCE(jsonb_agg(jsonb_build_object('cohort_node_id', c.cohort_node_id, 'learners', c.learners, 'mean_mastery', c.mean_mastery) ORDER BY c.mean_mastery DESC NULLS LAST), '[]'::jsonb), 'sample', COALESCE(sum(c.learners), (0)::numeric)) AS jsonb_build_object
    FROM ( SELECT s.cohort_node_id,
             count(DISTINCT s.person_id) AS learners,
             round(avg(r.mastery), 4) AS mean_mastery
            FROM (public.scoped_official_sessions s
              JOIN public.scoped_official_results r ON ((r.session_id = s.id)))
           WHERE ((s.institution_id = calc_institution_cohort_comparison.p_institution) AND (s.mode = 'POST_TEST'::public.assessment_mode))
           GROUP BY s.cohort_node_id) c;
END;
CREATE OR REPLACE FUNCTION public.calc_institution_competency_outcomes(p_node uuid, p_institution uuid, p_catalogue text) RETURNS jsonb
    LANGUAGE sql STABLE
    SET search_path TO 'public', 'pg_temp'
    BEGIN ATOMIC
 SELECT jsonb_build_object('value', COALESCE(jsonb_agg(jsonb_build_object('objective_id', d.objective_id, 'code', d.code, 'competency', d.statement, 'mean_score', d.avg_score, 'learners', d.n) ORDER BY d.avg_score DESC, d.statement, d.code), '[]'::jsonb), 'sample', COALESCE(max(d.n), (0)::bigint)) AS jsonb_build_object
    FROM ( SELECT t.objective_id,
             min(t.code) AS code,
             COALESCE(min(lo.statement), min(t.code)) AS statement,
             round(avg(((t.recorded ->> 'penguasaan'::text))::numeric), 4) AS avg_score,
             count(*) AS n
            FROM (( SELECT kv.key AS code,
                     kv.value AS recorded,
                     ( SELECT o.id
                            FROM ((public.assessment_definitions ad
                              JOIN public.lessons l ON ((l.module_id = ad.module_id)))
                              JOIN public.learning_objectives o ON ((o.lesson_id = l.id)))
                           WHERE ((ad.id = latest.assessment_definition_id) AND (o.code = kv.key))
                           ORDER BY l.ordinal, o.id
                          LIMIT 1) AS objective_id
                    FROM ( SELECT DISTINCT ON (r.session_id) r.per_domain,
                             r.session_id,
                             s.assessment_definition_id
                            FROM (public.scoped_official_results r
                              JOIN public.scoped_official_sessions s ON ((s.id = r.session_id)))
                           WHERE ((s.institution_id = calc_institution_competency_outcomes.p_institution) AND (s.mode = 'POST_TEST'::public.assessment_mode))
                           ORDER BY r.session_id, r.computed_at DESC) latest,
                     LATERAL jsonb_each(COALESCE(latest.per_domain, '{}'::jsonb)) kv(key, value)
                   WHERE ((jsonb_typeof(kv.value) = 'object'::text) AND (jsonb_typeof((kv.value -> 'penguasaan'::text)) = 'number'::text))) t
              LEFT JOIN public.learning_objectives lo ON ((lo.id = t.objective_id)))
           GROUP BY t.objective_id, COALESCE((t.objective_id)::text, t.code)) d;
END;
CREATE OR REPLACE FUNCTION public.calc_institution_net_gain(p_node uuid, p_institution uuid, p_catalogue text) RETURNS jsonb
    LANGUAGE sql STABLE
    SET search_path TO 'public', 'pg_temp'
    BEGIN ATOMIC
 SELECT jsonb_build_object('value', round(avg((g.post - g.pre)), 4), 'sample', count(DISTINCT g.person_id)) AS jsonb_build_object
    FROM ( SELECT s.person_id,
             s.plp_release_id,
             max(
                 CASE
                     WHEN (s.mode = 'PRE_TEST'::public.assessment_mode) THEN r.mastery
                     ELSE NULL::numeric
                 END) AS pre,
             max(
                 CASE
                     WHEN (s.mode = 'POST_TEST'::public.assessment_mode) THEN r.mastery
                     ELSE NULL::numeric
                 END) AS post
            FROM (public.scoped_official_sessions s
              JOIN public.scoped_official_results r ON ((r.session_id = s.id)))
           WHERE ((s.institution_id = calc_institution_net_gain.p_institution) AND (s.mode = ANY (ARRAY['PRE_TEST'::public.assessment_mode, 'POST_TEST'::public.assessment_mode])))
           GROUP BY s.person_id, s.plp_release_id) g
   WHERE ((g.pre IS NOT NULL) AND (g.post IS NOT NULL));
END;
CREATE OR REPLACE FUNCTION public.calc_institution_participants(p_node uuid, p_institution uuid, p_catalogue text) RETURNS jsonb
    LANGUAGE sql STABLE
    SET search_path TO 'public', 'pg_temp'
    BEGIN ATOMIC
 SELECT jsonb_build_object('value', count(DISTINCT s.person_id), 'sample', count(DISTINCT s.person_id)) AS jsonb_build_object
    FROM public.scoped_official_sessions s
   WHERE (s.institution_id = calc_institution_participants.p_institution);
END;
CREATE OR REPLACE FUNCTION public.calc_institution_safety_gate_pass_rate(p_node uuid, p_institution uuid, p_catalogue text) RETURNS jsonb
    LANGUAGE sql STABLE
    SET search_path TO 'public', 'pg_temp'
    BEGIN ATOMIC
 SELECT jsonb_build_object('value', round(((count(*) FILTER (WHERE x.safety_gate_passed))::numeric / (NULLIF(count(*), 0))::numeric), 4), 'sample', count(*)) AS jsonb_build_object
    FROM ( SELECT DISTINCT ON (r.session_id) r.safety_gate_passed
            FROM (public.scoped_official_results r
              JOIN public.scoped_official_sessions s ON ((s.id = r.session_id)))
           WHERE ((s.institution_id = calc_institution_safety_gate_pass_rate.p_institution) AND (s.mode = 'POST_TEST'::public.assessment_mode))
           ORDER BY r.session_id, r.computed_at DESC) x;
END;
CREATE OR REPLACE FUNCTION public.calc_institution_verified_credentials(p_node uuid, p_institution uuid, p_catalogue text) RETURNS jsonb
    LANGUAGE sql STABLE
    SET search_path TO 'public', 'pg_temp'
    BEGIN ATOMIC
 SELECT jsonb_build_object('value', count(*) FILTER (WHERE (c.revoked_at IS NULL)), 'sample', count(*)) AS jsonb_build_object
    FROM public.scoped_certificates c
   WHERE (c.institution_id = calc_institution_verified_credentials.p_institution);
END;
CREATE OR REPLACE FUNCTION public.calc_item_correctness_rate(p_node uuid, p_institution uuid, p_catalogue text) RETURNS jsonb
    LANGUAGE sql STABLE
    SET search_path TO 'public', 'pg_temp'
    BEGIN ATOMIC
 SELECT jsonb_build_object('value', max(st.correctness_rate), 'sample', COALESCE(max(st.evidence_count), 0)) AS jsonb_build_object
    FROM public.scoped_service_item_statistics st
   WHERE ((st.institution_id = calc_item_correctness_rate.p_institution) AND (st.item_id = calc_item_correctness_rate.p_node));
END;
CREATE OR REPLACE FUNCTION public.calc_item_distractor_uptake(p_node uuid, p_institution uuid, p_catalogue text) RETURNS jsonb
    LANGUAGE sql STABLE
    SET search_path TO 'public', 'pg_temp'
    BEGIN ATOMIC
 SELECT jsonb_build_object('value', COALESCE(jsonb_agg(jsonb_build_object('label', u.label, 'is_correct', u.is_correct, 'misconception_code', u.misconception_code, 'chosen', u.chosen_count) ORDER BY u.label), '[]'::jsonb), 'sample', COALESCE(sum(u.chosen_count), (0)::bigint)) AS jsonb_build_object
    FROM public.scoped_service_distractor_uptake u
   WHERE ((u.institution_id = calc_item_distractor_uptake.p_institution) AND (u.item_id = calc_item_distractor_uptake.p_node));
END;
CREATE OR REPLACE FUNCTION public.calc_item_position_effect(p_node uuid, p_institution uuid, p_catalogue text) RETURNS jsonb
    LANGUAGE sql STABLE
    SET search_path TO 'public', 'pg_temp'
    BEGIN ATOMIC
 SELECT jsonb_build_object('value', jsonb_build_object('first_position', max(st.first_position), 'last_position', max(st.last_position), 'mean_response_seconds', max(st.mean_response_seconds)), 'sample', COALESCE(max(st.evidence_count), 0)) AS jsonb_build_object
    FROM public.scoped_service_item_statistics st
   WHERE ((st.institution_id = calc_item_position_effect.p_institution) AND (st.item_id = calc_item_position_effect.p_node));
END;
CREATE OR REPLACE FUNCTION public.calc_learner_result(p_node uuid, p_institution uuid, p_catalogue text) RETURNS jsonb
    LANGUAGE sql STABLE
    SET search_path TO 'public', 'pg_temp'
    BEGIN ATOMIC
 SELECT jsonb_build_object('value', COALESCE(jsonb_agg(jsonb_build_object('session_id', x.session_id, 'mode', x.mode, 'mastery', x.mastery, 'safety_gate_passed', x.safety_gate_passed) ORDER BY x.finalized_at), '[]'::jsonb), 'sample', count(*)) AS jsonb_build_object
    FROM ( SELECT DISTINCT ON (r.session_id) r.session_id,
             s.mode,
             r.mastery,
             r.safety_gate_passed,
             s.finalized_at
            FROM (public.scoped_official_results r
              JOIN public.scoped_official_sessions s ON ((s.id = r.session_id)))
           WHERE ((s.institution_id = calc_learner_result.p_institution) AND (s.person_id = calc_learner_result.p_node))
           ORDER BY r.session_id, r.computed_at DESC) x;
END;
COMMENT ON VIEW public.scoped_official_sessions IS 'official_sessions, narrowed to the boundary the engine bound. The narrowing is in the SOURCE so that a calculator cannot decline to apply it.';
GRANT ALL ON TABLE public.scoped_official_sessions TO service_role;
GRANT ALL ON TABLE public.scoped_official_results TO service_role;
revoke all on function public.calc_class_comprehension(p_node uuid, p_institution uuid, p_catalogue text) from public, anon, authenticated;
REVOKE ALL ON FUNCTION public.calc_class_comprehension(p_node uuid, p_institution uuid, p_catalogue text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.calc_class_comprehension(p_node uuid, p_institution uuid, p_catalogue text) TO service_role;
GRANT ALL ON TABLE public.service_cohort_misconceptions TO service_role;
GRANT ALL ON TABLE public.scoped_service_cohort_misconceptions TO service_role;
revoke all on function public.calc_class_misconceptions(p_node uuid, p_institution uuid, p_catalogue text) from public, anon, authenticated;
REVOKE ALL ON FUNCTION public.calc_class_misconceptions(p_node uuid, p_institution uuid, p_catalogue text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.calc_class_misconceptions(p_node uuid, p_institution uuid, p_catalogue text) TO service_role;
revoke all on function public.calc_class_net_gain(p_node uuid, p_institution uuid, p_catalogue text) from public, anon, authenticated;
REVOKE ALL ON FUNCTION public.calc_class_net_gain(p_node uuid, p_institution uuid, p_catalogue text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.calc_class_net_gain(p_node uuid, p_institution uuid, p_catalogue text) TO service_role;
revoke all on function public.calc_class_participants(p_node uuid, p_institution uuid, p_catalogue text) from public, anon, authenticated;
REVOKE ALL ON FUNCTION public.calc_class_participants(p_node uuid, p_institution uuid, p_catalogue text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.calc_class_participants(p_node uuid, p_institution uuid, p_catalogue text) TO service_role;
revoke all on function public.calc_class_readiness_distribution(p_node uuid, p_institution uuid, p_catalogue text) from public, anon, authenticated;
REVOKE ALL ON FUNCTION public.calc_class_readiness_distribution(p_node uuid, p_institution uuid, p_catalogue text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.calc_class_readiness_distribution(p_node uuid, p_institution uuid, p_catalogue text) TO service_role;
revoke all on function public.calc_class_topic_mastery(p_node uuid, p_institution uuid, p_catalogue text) from public, anon, authenticated;
REVOKE ALL ON FUNCTION public.calc_class_topic_mastery(p_node uuid, p_institution uuid, p_catalogue text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.calc_class_topic_mastery(p_node uuid, p_institution uuid, p_catalogue text) TO service_role;
revoke all on function public.calc_institution_cohort_comparison(p_node uuid, p_institution uuid, p_catalogue text) from public, anon, authenticated;
REVOKE ALL ON FUNCTION public.calc_institution_cohort_comparison(p_node uuid, p_institution uuid, p_catalogue text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.calc_institution_cohort_comparison(p_node uuid, p_institution uuid, p_catalogue text) TO service_role;
revoke all on function public.calc_institution_competency_outcomes(p_node uuid, p_institution uuid, p_catalogue text) from public, anon, authenticated;
REVOKE ALL ON FUNCTION public.calc_institution_competency_outcomes(p_node uuid, p_institution uuid, p_catalogue text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.calc_institution_competency_outcomes(p_node uuid, p_institution uuid, p_catalogue text) TO service_role;
revoke all on function public.calc_institution_net_gain(p_node uuid, p_institution uuid, p_catalogue text) from public, anon, authenticated;
REVOKE ALL ON FUNCTION public.calc_institution_net_gain(p_node uuid, p_institution uuid, p_catalogue text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.calc_institution_net_gain(p_node uuid, p_institution uuid, p_catalogue text) TO service_role;
revoke all on function public.calc_institution_participants(p_node uuid, p_institution uuid, p_catalogue text) from public, anon, authenticated;
REVOKE ALL ON FUNCTION public.calc_institution_participants(p_node uuid, p_institution uuid, p_catalogue text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.calc_institution_participants(p_node uuid, p_institution uuid, p_catalogue text) TO service_role;
revoke all on function public.calc_institution_safety_gate_pass_rate(p_node uuid, p_institution uuid, p_catalogue text) from public, anon, authenticated;
REVOKE ALL ON FUNCTION public.calc_institution_safety_gate_pass_rate(p_node uuid, p_institution uuid, p_catalogue text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.calc_institution_safety_gate_pass_rate(p_node uuid, p_institution uuid, p_catalogue text) TO service_role;
GRANT ALL ON TABLE public.scoped_certificates TO service_role;
revoke all on function public.calc_institution_verified_credentials(p_node uuid, p_institution uuid, p_catalogue text) from public, anon, authenticated;
REVOKE ALL ON FUNCTION public.calc_institution_verified_credentials(p_node uuid, p_institution uuid, p_catalogue text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.calc_institution_verified_credentials(p_node uuid, p_institution uuid, p_catalogue text) TO service_role;
GRANT ALL ON TABLE public.service_item_statistics TO service_role;
GRANT ALL ON TABLE public.scoped_service_item_statistics TO service_role;
revoke all on function public.calc_item_correctness_rate(p_node uuid, p_institution uuid, p_catalogue text) from public, anon, authenticated;
REVOKE ALL ON FUNCTION public.calc_item_correctness_rate(p_node uuid, p_institution uuid, p_catalogue text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.calc_item_correctness_rate(p_node uuid, p_institution uuid, p_catalogue text) TO service_role;
GRANT ALL ON TABLE public.service_distractor_uptake TO service_role;
GRANT ALL ON TABLE public.scoped_service_distractor_uptake TO service_role;
revoke all on function public.calc_item_distractor_uptake(p_node uuid, p_institution uuid, p_catalogue text) from public, anon, authenticated;
REVOKE ALL ON FUNCTION public.calc_item_distractor_uptake(p_node uuid, p_institution uuid, p_catalogue text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.calc_item_distractor_uptake(p_node uuid, p_institution uuid, p_catalogue text) TO service_role;
revoke all on function public.calc_item_position_effect(p_node uuid, p_institution uuid, p_catalogue text) from public, anon, authenticated;
REVOKE ALL ON FUNCTION public.calc_item_position_effect(p_node uuid, p_institution uuid, p_catalogue text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.calc_item_position_effect(p_node uuid, p_institution uuid, p_catalogue text) TO service_role;
revoke all on function public.calc_learner_result(p_node uuid, p_institution uuid, p_catalogue text) from public, anon, authenticated;
REVOKE ALL ON FUNCTION public.calc_learner_result(p_node uuid, p_institution uuid, p_catalogue text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.calc_learner_result(p_node uuid, p_institution uuid, p_catalogue text) TO service_role;

-- 5. functions: the 46 that 201-224 changed, as 200 had them; then the 67 they added are dropped
CREATE OR REPLACE FUNCTION public.assert_academic_sources_are_context_bound() RETURNS TABLE(ok boolean, detail text)
    LANGUAGE plpgsql STABLE
    SET search_path TO 'public', 'pg_temp'
    AS $$
declare v_bad text := ''; v_def text; v_rel text; n_checked int := 0;
begin
  -- EVERY RESPONSE-DERIVED ACADEMIC SOURCE READS THE ACADEMIC BOUNDARY, and
  -- none of them reaches past it to official_responses or responses.
  foreach v_rel in array array['service_item_statistics', 'service_distractor_uptake',
                               'service_cohort_misconceptions'] loop
    n_checked := n_checked + 1;
    v_def := lower(pg_get_viewdef(('public.' || v_rel)::regclass, true));
    if v_def not like '%academic_responses%' then
      v_bad := v_bad || format('%s does not read the academic evidence boundary; ', v_rel);
    end if;
    if v_def ~ '\mofficial_responses\M' or v_def ~ '\mpublic\.responses\M' then
      v_bad := v_bad || format('%s reaches past the academic boundary to raw responses; ', v_rel);
    end if;
  end loop;

  -- THE CREDENTIAL SOURCE COUNTS ACADEMIC CREDENTIALS. A PD certificate is
  -- valid and verifiable; it is simply not one of these.
  n_checked := n_checked + 1;
  v_def := lower(pg_get_viewdef('public.scoped_certificates'::regclass, true));
  if v_def not like '%academic_certificates%' then
    v_bad := v_bad || 'the credential metric source does not read academic certificates; ';
  end if;

  -- AND THE BOUNDARIES THEMSELVES STILL ASK THE QUESTION.
  foreach v_rel in array array['academic_responses', 'academic_certificates'] loop
    n_checked := n_checked + 1;
    if to_regclass('public.' || v_rel) is null then
      v_bad := v_bad || format('%s is gone; ', v_rel);
    else
      v_def := lower(pg_get_viewdef(('public.' || v_rel)::regclass, true));
      if v_def not like '%learning_context%' or v_def not like '%academic%' then
        v_bad := v_bad || format('%s no longer narrows by learning context; ', v_rel);
      end if;
      -- fail closed: an outer join would admit rows whose provenance cannot
      -- be resolved, which is how "unknown" becomes "academic"
      if v_def ~ '\mleft join\M' or v_def ~ '\mright join\M' or v_def ~ '\mfull join\M' then
        v_bad := v_bad || format('%s resolves provenance with an outer join, so unknown becomes academic; ', v_rel);
      end if;
      -- AND IT READS ITS SOURCE WITH THE CALLER'S RIGHTS, like the OFFICIAL
      -- boundary it sits beside. A definer view in an invoker chain quietly
      -- changes whose rights the rows are filtered for.
      if not exists (select 1 from pg_class cl
                      where cl.oid = ('public.' || v_rel)::regclass
                        and cl.reloptions::text like '%security_invoker=true%') then
        v_bad := v_bad || format('%s does not read its source with the caller''s rights; ', v_rel);
      end if;
    end if;
  end loop;

  -- THE FOURTH FAMILY. Eleven of the sixteen calculators reach evidence
  -- through the session/result pair rather than through responses or
  -- certificates, so the guard names that narrowing too -- otherwise it would
  -- cover three of the four families and read as if it covered all of them,
  -- which is the same mistake as the crown test it replaces.
  n_checked := n_checked + 1;
  v_def := lower(pg_get_viewdef('public.scoped_official_sessions'::regclass, true));
  if v_def not like '%row_in_learning_context%' then
    v_bad := v_bad || 'the session evidence source no longer narrows by learning context; ';
  end if;
  if v_def not like '%row_in_metric_boundary%' then
    v_bad := v_bad || 'the session evidence source lost WP1''s organizational boundary; ';
  end if;
  n_checked := n_checked + 1;
  v_def := lower(pg_get_viewdef('public.scoped_official_results'::regclass, true));
  if v_def not like '%scoped_official_sessions%' then
    v_bad := v_bad || 'the result source no longer inherits the session source''s narrowing; ';
  end if;

  -- AND EVERY CALCULATOR REACHES EVIDENCE THROUGH ONE OF THOSE FAMILIES.
  -- A seventeenth metric pointed at a raw relation fails here by name.
  select string_agg(distinct cl.relname, ', ' order by cl.relname) into v_def
    from public.metric_definitions m
    join pg_proc p on p.proname = 'calc_' || m.calculation_key
                  and p.pronamespace = 'public'::regnamespace
    join pg_depend d on d.objid = p.oid and d.classid = 'pg_proc'::regclass
    join pg_class cl on cl.oid = d.refobjid and cl.relkind in ('v', 'r')
   where m.catalogue_version = public.current_metric_catalogue()
     and cl.relname not in ('scoped_official_sessions', 'scoped_official_results',
                            'scoped_service_item_statistics', 'scoped_service_distractor_uptake',
                            'scoped_service_cohort_misconceptions', 'scoped_certificates',
                            'readiness_tiers',
                            -- D-088(g): THE CONTENT FAMILY. What a chapter teaches -- its assessment's
                            -- chapter, its lessons, their objectives and statements. No learner evidence:
                            -- checked below, none of them carries a person.
                            'assessment_definitions', 'lessons', 'learning_objectives',
                            -- D-121(c): THE PLACEMENT FAMILY. Who is placed in a class now, for the not-yet state: no
                            -- evidence, checked below.
                            'scoped_class_placements');
  if v_def is not null then
    v_bad := v_bad || format('a calculator reaches a relation outside the narrowed source families: %s; ', v_def);
  end if;
  n_checked := n_checked + 1;

  -- D-088(g): THE CONTENT FAMILY HOLDS NO LEARNER. A relation admitted above as
  -- content must never carry a person, or it would be evidence by another name.
  n_checked := n_checked + 1;
  select string_agg(distinct c.table_name, ', ') into v_def
    from information_schema.columns c
   where c.table_schema = 'public'
     and c.table_name in ('assessment_definitions', 'lessons', 'learning_objectives')
     and c.column_name in ('person_id', 'enrollment_id', 'session_id', 'learner_id');
  if v_def is not null then
    v_bad := v_bad || format('a content-family relation carries a learner: %s; ', v_def);
  end if;

  -- D-121(c): THE PLACEMENT FAMILY CARRIES THE BOUNDARY AND NO EVIDENCE. It names learners (that is its job), so it
  -- must keep the organizational boundary every scoped source keeps, read only CLASS placements (academic classes;
  -- professional learning sits in cohorts), and reach no session, result, response or certificate.
  n_checked := n_checked + 1;
  if to_regclass('public.scoped_class_placements') is not null then
    v_def := lower(pg_get_viewdef('public.scoped_class_placements'::regclass, true));
    if v_def not like '%row_in_metric_boundary%' then
      v_bad := v_bad || 'the placement source lost the organizational boundary; ';
    end if;
    if v_def not like '%''class''%' then
      v_bad := v_bad || 'the placement source is not narrowed to class placements; ';
    end if;
    if v_def ~ '\m(assessment_sessions|assessment_results|official_\w+|academic_\w+|responses|certificates)\M' then
      v_bad := v_bad || 'the placement source reaches evidence; ';
    end if;
  end if;

  -- AND A REVISION STILL INHERITS.
  n_checked := n_checked + 1;
  v_def := lower(pg_get_functiondef('public.create_course_revision(uuid)'::regprocedure));
  if v_def not like '%learning_context%' then
    v_bad := v_bad || 'create_course_revision does not carry the learning context forward; ';
  end if;

  if v_bad <> '' then
    return query select false, v_bad;
  else
    return query select true, format(
      '%s academic source(s) and boundary(ies) checked: every response-derived aggregate reads '
      || 'academic_responses and none reaches raw responses, the credential source counts academic '
      || 'certificates, both boundaries still narrow by learning context and resolve provenance with '
      || 'inner joins so unknown provenance is absent rather than assumed academic, and a course '
      || 'revision carries its predecessor''s context forward', n_checked);
  end if;
end $$;
CREATE OR REPLACE FUNCTION public.audit_write(p_action text, p_target_table text, p_target_id text, p_institution_id uuid, p_summary jsonb DEFAULT '{}'::jsonb) RETURNS bigint
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $_$
declare v_id bigint; v_person uuid; v_sha text;
        v_eval_actor uuid; v_eval_session uuid;
        v_summary jsonb := coalesce(p_summary, '{}'::jsonb); v_role text;
begin
  begin
    select a.person_id into v_person from public.accounts a where a.auth_user_id = auth.uid();
  exception when undefined_table then v_person := null; end;

  -- ADDED IN 0067. The second identity, derived here and nowhere else.
  -- `ended_at is null` alone, and deliberately NOT the session's expiry -- see
  -- that migration's header: an expired-but-unended session must still be
  -- recorded, or expiry becomes a laundering window that opens on a timer.
  begin
    select s.evaluator_person_id, s.id into v_eval_actor, v_eval_session
      from public.evaluation_sessions s
     where s.persona_auth_user_id = auth.uid() and s.ended_at is null
     order by s.started_at desc
     limit 1;
  exception when undefined_table then v_eval_actor := null; v_eval_session := null; end;

  -- ADDED BY D-093 T2: the role the acting person holds, unless the writer named it
  if v_person is not null and not (v_summary ? 'actor_role') then
    v_role := public.audit_actor_role(p_institution_id);
    if v_role is not null then v_summary := v_summary || jsonb_build_object('actor_role', v_role); end if;
  end if;

  v_sha := nullif(current_setting('app.build_sha', true), '');
  if v_sha is null then
    begin
      v_sha := nullif(current_setting('request.headers', true), '')::jsonb ->> 'x-pintar-build';
    exception when others then v_sha := null; end;
  end if;
  if v_sha !~ '^[0-9a-f]{7,40}$' then v_sha := null; end if;

  insert into public.audit_log (actor_auth_uid, actor_person_id, action, target_table, target_id,
                                institution_id, summary, build_sha,
                                evaluation_actor_person_id, evaluation_session_id)
  values (auth.uid(), v_person, p_action, p_target_table, p_target_id, p_institution_id,
          v_summary, v_sha, v_eval_actor, v_eval_session)
  returning id into v_id;
  return v_id;
end $_$;
CREATE OR REPLACE FUNCTION public.auth_email_correction_guard() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
declare v_akun public.accounts; r public.email_corrections;
begin
  if new.email is not distinct from old.email then
    return new;
  end if;
  select a.* into v_akun from public.accounts a where a.auth_user_id = new.id and a.kind = 'EMAIL';
  if v_akun.id is null then
    return new;
  end if;
  -- D-152(a): this very change converted the account from a card (auth_card_email_guard, earlier on this row)
  if coalesce(current_setting('pintar.kartu_jadi_email', true), '') = v_akun.id::text then
    perform set_config('pintar.kartu_jadi_email', '', true);
    return new;
  end if;
  select c.* into r from public.email_corrections c
   where c.account_id = v_akun.id and c.consumed_at is null and c.expires_at > clock_timestamp()
     and c.new_email = lower(btrim(coalesce(new.email, '')))
   order by c.created_at desc limit 1
   for update;
  if r.id is null then
    raise exception using errcode = 'PR040', detail = 'EMAIL_CHANGE_REFUSED',
      message = 'an email account''s address changes only through a governed correction (D-120 QN1)';
  end if;
  update public.email_corrections set consumed_at = clock_timestamp() where id = r.id;

  new.confirmation_token := '';
  new.recovery_token := '';
  new.email_change := '';
  new.email_change_token_new := '';
  new.email_change_token_current := '';
  new.reauthentication_token := '';
  delete from auth.one_time_tokens t where t.user_id = new.id;

  if not r.activated then
    new.encrypted_password := '';
    update public.account_setup s set password_set_at = null, name_confirmed_at = null
     where s.account_id = v_akun.id and s.state = 'REQUIRED';
    update public.person_pins set reset_required = true where person_id = v_akun.person_id;
  end if;
  perform public.sesi_akhiri_orang(new.id, 'KREDENSIAL_DIGANTI');

  perform public.audit_write('identity.email_corrected', 'persons', v_akun.person_id::text, r.institution_id,
    jsonb_build_object('person_id', v_akun.person_id, 'reason', r.reason,
                       'from', jsonb_build_object('email', r.old_email),
                       'to', jsonb_build_object('email', r.new_email),
                       'activated', r.activated,
                       'authorized_by', r.authorized_by, 'actor_role', r.authorized_role,
                       'authorized_at', r.created_at, 'correction_id', r.id, 'outcome', 'EMAIL_CORRECTED'));
  return new;
end $$;
CREATE OR REPLACE FUNCTION public.authorize_account_activation(p_person uuid, p_kind text, p_email text, p_card_number text DEFAULT NULL::text) RETURNS TABLE(display_name text, institution_id uuid)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $_$
declare v_actor uuid; v_name text; v_inst uuid; v_email text;
begin
  v_actor := public.current_person_id();
  if v_actor is null then raise exception 'no person in this session'; end if;
  select ii.institution_id into v_inst from public.institutional_identities ii
   where ii.person_id = p_person and public.can_on_node('CAN_PROVISION_PEOPLE', ii.institution_id)
   limit 1;
  if v_inst is null and not public.is_system_admin() then
    raise exception 'activating an account requires CAN_PROVISION_PEOPLE in the person''s institution';
  end if;
  select p.display_name into v_name from public.persons p where p.id = p_person;
  if v_name is null then raise exception 'unknown person'; end if;
  if p_kind not in ('EMAIL', 'CLASSROOM_CARD') then
    raise exception 'an account is EMAIL or CLASSROOM_CARD, not %', p_kind;
  end if;
  v_email := lower(btrim(coalesce(p_email, '')));
  if v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'an account needs a valid email address';
  end if;
  if (p_kind = 'CLASSROOM_CARD') <> (p_card_number is not null)
     or (p_card_number is not null and p_card_number !~ '^[0-9]{10}$') then
    raise exception 'a classroom card account names its ten-digit card, and only a card account does';
  end if;
  if exists (select 1 from public.accounts a where a.person_id = p_person) then
    raise exception 'this person already has an account';
  end if;
  -- CR-91 (D-145(a)): a class card is a learner's alone. Refused before any grant is written.
  if p_kind = 'CLASSROOM_CARD' and public.memegang_peran_staf(p_person) then
    raise exception using errcode = '42501', detail = 'CARD_FOR_STAFF',
      message = 'a class card is for learners only: this person holds a staff role and activates with email (CR-91)';
  end if;
  insert into public.account_activation_grants (email, person_id, kind, card_number, institution_id, authorized_by,
                                                authorized_role)
  values (v_email, p_person, p_kind::public.account_kind, p_card_number, v_inst, v_actor,
          public.audit_actor_role(v_inst));
  -- D-093 T3: no audit row here. This is an intention; 'account.activated' is written when the account exists.
  display_name := v_name; institution_id := v_inst; return next;
end $_$;
CREATE OR REPLACE FUNCTION public.authorize_card_conversion(p_person uuid, p_email text, p_reason text) RETURNS TABLE(auth_user_id uuid, display_name text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $_$
#variable_conflict use_column
declare
  v_actor uuid := public.current_person_id(); v_inst uuid; v_akun public.accounts; v_nama text;
  v_email text := lower(btrim(coalesce(p_email, '')));
begin
  if v_actor is null then
    raise exception using errcode = '42501', message = 'no person in this session';
  end if;
  select ii.institution_id into v_inst from public.institutional_identities ii
   where ii.person_id = p_person and public.can_on_node('CAN_PROVISION_PEOPLE', ii.institution_id)
   limit 1;
  if v_inst is null and not public.is_system_admin() then
    raise exception using errcode = '42501',
      message = 'converting a class card requires CAN_PROVISION_PEOPLE in the learner''s school';
  end if;
  if char_length(btrim(coalesce(p_reason, ''))) not between 10 and 500 then
    raise exception using errcode = 'PR040', detail = 'REASON_REQUIRED', message = 'a conversion says why (10 to 500 characters)';
  end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or length(v_email) > 254 then
    raise exception using errcode = 'PR040', detail = 'EMAIL_INVALID', message = 'not an email address';
  end if;
  select a.* into v_akun from public.accounts a where a.person_id = p_person and a.kind = 'CLASSROOM_CARD' for update;
  if v_akun.id is null then
    raise exception using errcode = 'PR040', detail = 'CARD_NOT_FOUND', message = 'this person has no class card to convert';
  end if;
  if exists (select 1 from auth.users u where lower(u.email) = v_email)
     or exists (select 1 from public.card_conversions c where c.new_email = v_email
                   and c.consumed_at is null and c.expires_at > clock_timestamp() and c.account_id <> v_akun.id) then
    raise exception using errcode = 'PR040', detail = 'EMAIL_TAKEN', message = 'that address is already an account''s';
  end if;
  select p.display_name into v_nama from public.persons p where p.id = p_person;
  delete from public.card_conversions c where c.account_id = v_akun.id and c.consumed_at is null;
  insert into public.card_conversions (person_id, account_id, old_card_number, new_email, reason, institution_id,
                                       authorized_by, authorized_role, expires_at)
  values (p_person, v_akun.id, v_akun.card_number, v_email, btrim(p_reason), v_inst, v_actor,
          public.audit_actor_role(v_inst), clock_timestamp() + interval '2 minutes');
  -- D-093 T3: no audit row here. 'account.card_converted_to_email' is written when Auth moves the address.
  auth_user_id := v_akun.auth_user_id; display_name := v_nama; return next;
end $_$;
CREATE OR REPLACE FUNCTION public.authorize_card_reissue(p_person uuid, p_reason text, p_new_card text) RETURNS TABLE(auth_user_id uuid, display_name text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $_$
#variable_conflict use_column
declare v_actor uuid := public.current_person_id(); v_inst uuid; v_akun public.accounts; v_nama text;
begin
  if v_actor is null then
    raise exception using errcode = '42501', message = 'no person in this session';
  end if;
  select ii.institution_id into v_inst from public.institutional_identities ii
   where ii.person_id = p_person and public.can_on_node('CAN_PROVISION_PEOPLE', ii.institution_id)
   limit 1;
  if v_inst is null and not public.is_system_admin() then
    raise exception using errcode = '42501', message = 're-issuing a card requires CAN_PROVISION_PEOPLE in the learner''s school';
  end if;
  if p_reason is null or p_reason not in ('HILANG', 'RUSAK') then
    raise exception using errcode = 'PR040', detail = 'REASON_INVALID', message = 'a re-issue says why: HILANG or RUSAK';
  end if;
  if p_new_card is null or p_new_card !~ '^[0-9]{10}$' then
    raise exception using errcode = '22023', message = 'authorize_card_reissue: a ten-digit card number';
  end if;
  select a.* into v_akun from public.accounts a where a.person_id = p_person and a.kind = 'CLASSROOM_CARD' for update;
  if v_akun.id is null then
    raise exception using errcode = 'PR040', detail = 'CARD_NOT_FOUND', message = 'this person has no class card to re-issue';
  end if;
  -- CR-91 (D-145(a)): never a card for a person who holds a staff role (the account invariant should make this
  -- unreachable; it is refused here by name all the same)
  if public.memegang_peran_staf(p_person) then
    raise exception using errcode = '42501', detail = 'CARD_FOR_STAFF',
      message = 'a class card is for learners only: this person holds a staff role (CR-91)';
  end if;
  if exists (select 1 from public.accounts a where a.card_number = p_new_card)
     or exists (select 1 from public.card_reissues r where r.new_card_number = p_new_card
                   and r.consumed_at is null and r.expires_at > clock_timestamp()) then
    raise exception using errcode = 'PR040', detail = 'CARD_NUMBER_TAKEN', message = 'that card number is taken';
  end if;
  select p.display_name into v_nama from public.persons p where p.id = p_person;
  delete from public.card_reissues r where r.account_id = v_akun.id and r.consumed_at is null;
  insert into public.card_reissues (person_id, account_id, old_card_number, new_card_number, reason, institution_id,
                                    authorized_by, authorized_role, expires_at)
  values (p_person, v_akun.id, v_akun.card_number, p_new_card, p_reason, v_inst, v_actor,
          public.audit_actor_role(v_inst), clock_timestamp() + interval '2 minutes');
  insert into public.password_write_permits (auth_user_id, purpose, expires_at)
  values (v_akun.auth_user_id, 'CARD_REISSUE', clock_timestamp() + interval '1 minute')
  on conflict (auth_user_id) do update set purpose = excluded.purpose, expires_at = excluded.expires_at;
  -- D-093 T3: no audit row here. This is an intention; 'account.card_reissued' is written when Auth moves the card.
  auth_user_id := v_akun.auth_user_id; display_name := v_nama; return next;
end $_$;
CREATE OR REPLACE FUNCTION public.authorize_email_correction(p_person uuid, p_email text, p_reason text) RETURNS TABLE(auth_user_id uuid, old_email text, activated boolean, pintar_id text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $_$
#variable_conflict use_column
declare v_actor uuid := public.current_person_id(); v_inst uuid; v_akun public.accounts; v_lama text;
        v_baru text := lower(btrim(coalesce(p_email, ''))); v_alasan text := btrim(coalesce(p_reason, ''));
        v_aktif boolean; v_id text;
begin
  if v_actor is null then
    raise exception using errcode = '42501', message = 'no person in this session';
  end if;
  select ii.institution_id into v_inst from public.institutional_identities ii
   where ii.person_id = p_person and public.can_on_node('CAN_PROVISION_PEOPLE', ii.institution_id)
   limit 1;
  if v_inst is null and not public.is_system_admin() then
    raise exception using errcode = '42501',
      message = 'correcting an email requires CAN_PROVISION_PEOPLE in the person''s school, or the platform administrator';
  end if;
  select a.* into v_akun from public.accounts a
   where a.person_id = p_person and a.kind = 'EMAIL' and not public.adalah_persona(a.person_id)
   for update;
  if v_akun.id is null then
    raise exception using errcode = 'PR040', detail = 'EMAIL_ACCOUNT_NOT_FOUND', message = 'this person has no email account';
  end if;
  -- activated: anything but a set-up still REQUIRED (an account without a set-up row was never activated by the wizard
  -- and is treated as the credential channel it is)
  v_aktif := not exists (select 1 from public.account_setup s where s.account_id = v_akun.id and s.state = 'REQUIRED');
  if v_aktif and not public.is_system_admin() then
    raise exception using errcode = '42501',
      message = 'after activation an email is corrected by the platform administrator only (D-120 QN1)';
  end if;
  if v_alasan = '' or length(v_alasan) > 500 then
    raise exception using errcode = 'PR040', detail = 'REASON_REQUIRED', message = 'a correction states its reason (1 to 500 characters)';
  end if;
  if v_baru !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' or length(v_baru) > 254 or v_baru ~ '^card-[0-9]{10}@' then
    raise exception using errcode = 'PR040', detail = 'EMAIL_INVALID', message = 'that is not an email address a person can be given';
  end if;
  select lower(u.email) into v_lama from auth.users u where u.id = v_akun.auth_user_id;
  if v_baru = v_lama then
    raise exception using errcode = 'PR040', detail = 'EMAIL_UNCHANGED', message = 'that is already the person''s email';
  end if;
  if exists (select 1 from auth.users u where lower(u.email) = v_baru)
     or exists (select 1 from public.email_corrections c where c.new_email = v_baru and c.consumed_at is null
                   and c.expires_at > clock_timestamp() and c.account_id <> v_akun.id)
     or exists (select 1 from public.account_activation_grants g where g.email = v_baru and g.consumed_at is null
                   and g.expires_at > clock_timestamp()) then
    raise exception using errcode = 'PR040', detail = 'EMAIL_TAKEN', message = 'that address belongs to another account';
  end if;
  select p.pintar_id into v_id from public.persons p where p.id = p_person;
  delete from public.email_corrections c where c.account_id = v_akun.id and c.consumed_at is null;
  insert into public.email_corrections (person_id, account_id, old_email, new_email, activated, reason, institution_id,
                                        authorized_by, authorized_role, expires_at)
  values (p_person, v_akun.id, v_lama, v_baru, v_aktif, v_alasan, v_inst, v_actor, public.audit_actor_role(v_inst),
          clock_timestamp() + interval '2 minutes');
  -- D-093 T3: no audit row here. This is an intention; 'identity.email_corrected' is written when Auth moves it.
  auth_user_id := v_akun.auth_user_id; old_email := v_lama; activated := v_aktif; pintar_id := v_id; return next;
end $_$;
CREATE OR REPLACE FUNCTION public.calc_class_comprehension(p_node uuid, p_institution uuid, p_catalogue text) RETURNS jsonb
    LANGUAGE sql STABLE
    SET search_path TO 'public', 'pg_temp'
    BEGIN ATOMIC
 SELECT jsonb_build_object('value', round(avg(x.mastery), 4), 'sample', count(*)) AS jsonb_build_object
    FROM ( SELECT DISTINCT ON (r.session_id) r.mastery
            FROM (public.scoped_official_results r
              JOIN public.scoped_official_sessions s ON ((s.id = r.session_id)))
           WHERE ((s.institution_id = calc_class_comprehension.p_institution) AND (s.class_node_id = calc_class_comprehension.p_node) AND (s.mode = 'POST_TEST'::public.assessment_mode))
           ORDER BY r.session_id, r.computed_at DESC) x;
END;
CREATE OR REPLACE FUNCTION public.calc_class_misconceptions(p_node uuid, p_institution uuid, p_catalogue text) RETURNS jsonb
    LANGUAGE sql STABLE
    SET search_path TO 'public', 'pg_temp'
    BEGIN ATOMIC
 SELECT jsonb_build_object('value', COALESCE(jsonb_agg(jsonb_build_object('code', m.misconception_code, 'label', m.label, 'remediation', m.remediation, 'occurrences', m.occurrences) ORDER BY m.occurrences DESC), '[]'::jsonb), 'sample', COALESCE(sum(m.occurrences), (0)::bigint)) AS jsonb_build_object
    FROM public.scoped_service_cohort_misconceptions m
   WHERE ((m.institution_id = calc_class_misconceptions.p_institution) AND (m.class_node_id = calc_class_misconceptions.p_node));
END;
CREATE OR REPLACE FUNCTION public.calc_class_net_gain(p_node uuid, p_institution uuid, p_catalogue text) RETURNS jsonb
    LANGUAGE sql STABLE
    SET search_path TO 'public', 'pg_temp'
    BEGIN ATOMIC
 SELECT jsonb_build_object('value', round(avg((g.post - g.pre)), 4), 'sample', count(DISTINCT g.person_id)) AS jsonb_build_object
    FROM ( SELECT s.person_id,
             s.plp_release_id,
             max(
                 CASE
                     WHEN (s.mode = 'PRE_TEST'::public.assessment_mode) THEN r.mastery
                     ELSE NULL::numeric
                 END) AS pre,
             max(
                 CASE
                     WHEN (s.mode = 'POST_TEST'::public.assessment_mode) THEN r.mastery
                     ELSE NULL::numeric
                 END) AS post
            FROM (public.scoped_official_sessions s
              JOIN public.scoped_official_results r ON ((r.session_id = s.id)))
           WHERE ((s.institution_id = calc_class_net_gain.p_institution) AND (s.class_node_id = calc_class_net_gain.p_node) AND (s.mode = ANY (ARRAY['PRE_TEST'::public.assessment_mode, 'POST_TEST'::public.assessment_mode])))
           GROUP BY s.person_id, s.plp_release_id) g
   WHERE ((g.pre IS NOT NULL) AND (g.post IS NOT NULL));
END;
CREATE OR REPLACE FUNCTION public.calc_class_readiness_distribution(p_node uuid, p_institution uuid, p_catalogue text) RETURNS jsonb
    LANGUAGE sql STABLE
    SET search_path TO 'public', 'pg_temp'
    BEGIN ATOMIC
 WITH assessed AS (
          SELECT DISTINCT ON (s.person_id) s.person_id,
             r.mastery,
             r.safety_gate_passed
            FROM (public.scoped_official_sessions s
              JOIN public.scoped_official_results r ON ((r.session_id = s.id)))
           WHERE ((s.institution_id = calc_class_readiness_distribution.p_institution) AND (s.class_node_id = calc_class_readiness_distribution.p_node) AND (s.mode = 'POST_TEST'::public.assessment_mode))
           ORDER BY s.person_id, r.computed_at DESC
         ), bands AS (
          SELECT COALESCE(t.tier_key, lowest.tier_key) AS tier_key,
             count(*) AS n
            FROM ((assessed learner
              LEFT JOIN LATERAL ( SELECT t2.tier_key
                    FROM public.readiness_tiers t2
                   WHERE ((t2.catalogue_version = calc_class_readiness_distribution.p_catalogue) AND (t2.min_mastery IS NOT NULL) AND (learner.mastery >= t2.min_mastery) AND (learner.mastery < t2.max_mastery) AND (learner.safety_gate_passed IS NOT FALSE))
                  LIMIT 1) t ON (true))
              LEFT JOIN LATERAL ( SELECT t3.tier_key
                    FROM public.readiness_tiers t3
                   WHERE ((t3.catalogue_version = calc_class_readiness_distribution.p_catalogue) AND (t3.min_mastery IS NOT NULL))
                   ORDER BY t3.min_mastery
                  LIMIT 1) lowest ON (true))
           GROUP BY COALESCE(t.tier_key, lowest.tier_key)
         ), placed AS (
          SELECT DISTINCT pl.person_id
            FROM public.scoped_class_placements pl
           WHERE ((pl.institution_id = calc_class_readiness_distribution.p_institution) AND (pl.class_node_id = calc_class_readiness_distribution.p_node))
         )
  SELECT jsonb_build_object('value', COALESCE(( SELECT jsonb_object_agg(b.tier_key, b.n) AS jsonb_object_agg
            FROM bands b), '{}'::jsonb), 'sample', ( SELECT count(*) AS count
            FROM assessed), 'population', jsonb_build_object('placed', ( SELECT count(*) AS count
            FROM placed), 'assessed', ( SELECT count(*) AS count
            FROM assessed), 'not_yet', ( SELECT count(*) AS count
            FROM placed p
           WHERE (NOT (EXISTS ( SELECT 1
                    FROM assessed a
                   WHERE (a.person_id = p.person_id))))))) AS jsonb_build_object;
END;
CREATE OR REPLACE FUNCTION public.calc_class_topic_mastery(p_node uuid, p_institution uuid, p_catalogue text) RETURNS jsonb
    LANGUAGE sql STABLE
    SET search_path TO 'public', 'pg_temp'
    BEGIN ATOMIC
 SELECT jsonb_build_object('value', COALESCE(jsonb_agg(jsonb_build_object('objective_id', d.objective_id, 'code', d.code, 'competency', d.statement, 'mean_score', d.avg_score, 'learners', d.n) ORDER BY d.avg_score, d.statement, d.code), '[]'::jsonb), 'sample', COALESCE(max(d.n), (0)::bigint)) AS jsonb_build_object
    FROM ( SELECT t.objective_id,
             min(t.code) AS code,
             COALESCE(min(lo.statement), min(t.code)) AS statement,
             round(avg(((t.recorded ->> 'penguasaan'::text))::numeric), 4) AS avg_score,
             count(*) AS n
            FROM (( SELECT kv.key AS code,
                     kv.value AS recorded,
                     ( SELECT o.id
                            FROM ((public.assessment_definitions ad
                              JOIN public.lessons l ON ((l.module_id = ad.module_id)))
                              JOIN public.learning_objectives o ON ((o.lesson_id = l.id)))
                           WHERE ((ad.id = latest.assessment_definition_id) AND (o.code = kv.key))
                           ORDER BY l.ordinal, o.id
                          LIMIT 1) AS objective_id
                    FROM ( SELECT DISTINCT ON (r.session_id) r.per_domain,
                             r.session_id,
                             s.assessment_definition_id
                            FROM (public.scoped_official_results r
                              JOIN public.scoped_official_sessions s ON ((s.id = r.session_id)))
                           WHERE ((s.institution_id = calc_class_topic_mastery.p_institution) AND (s.class_node_id = calc_class_topic_mastery.p_node) AND (s.mode = 'POST_TEST'::public.assessment_mode))
                           ORDER BY r.session_id, r.computed_at DESC) latest,
                     LATERAL jsonb_each(COALESCE(latest.per_domain, '{}'::jsonb)) kv(key, value)
                   WHERE ((jsonb_typeof(kv.value) = 'object'::text) AND (jsonb_typeof((kv.value -> 'penguasaan'::text)) = 'number'::text))) t
              LEFT JOIN public.learning_objectives lo ON ((lo.id = t.objective_id)))
           GROUP BY t.objective_id, COALESCE((t.objective_id)::text, t.code)) d;
END;
CREATE OR REPLACE FUNCTION public.calc_institution_cohort_comparison(p_node uuid, p_institution uuid, p_catalogue text) RETURNS jsonb
    LANGUAGE sql STABLE
    SET search_path TO 'public', 'pg_temp'
    BEGIN ATOMIC
 SELECT jsonb_build_object('value', COALESCE(jsonb_agg(jsonb_build_object('cohort_node_id', c.cohort_node_id, 'learners', c.learners, 'mean_mastery', c.mean_mastery) ORDER BY c.mean_mastery DESC NULLS LAST), '[]'::jsonb), 'sample', COALESCE(sum(c.learners), (0)::numeric)) AS jsonb_build_object
    FROM ( SELECT s.cohort_node_id,
             count(DISTINCT s.person_id) AS learners,
             round(avg(r.mastery), 4) AS mean_mastery
            FROM (public.scoped_official_sessions s
              JOIN public.scoped_official_results r ON ((r.session_id = s.id)))
           WHERE ((s.institution_id = calc_institution_cohort_comparison.p_institution) AND (s.mode = 'POST_TEST'::public.assessment_mode))
           GROUP BY s.cohort_node_id) c;
END;
CREATE OR REPLACE FUNCTION public.calc_institution_competency_outcomes(p_node uuid, p_institution uuid, p_catalogue text) RETURNS jsonb
    LANGUAGE sql STABLE
    SET search_path TO 'public', 'pg_temp'
    BEGIN ATOMIC
 SELECT jsonb_build_object('value', COALESCE(jsonb_agg(jsonb_build_object('objective_id', d.objective_id, 'code', d.code, 'competency', d.statement, 'mean_score', d.avg_score, 'learners', d.n) ORDER BY d.avg_score DESC, d.statement, d.code), '[]'::jsonb), 'sample', COALESCE(max(d.n), (0)::bigint)) AS jsonb_build_object
    FROM ( SELECT t.objective_id,
             min(t.code) AS code,
             COALESCE(min(lo.statement), min(t.code)) AS statement,
             round(avg(((t.recorded ->> 'penguasaan'::text))::numeric), 4) AS avg_score,
             count(*) AS n
            FROM (( SELECT kv.key AS code,
                     kv.value AS recorded,
                     ( SELECT o.id
                            FROM ((public.assessment_definitions ad
                              JOIN public.lessons l ON ((l.module_id = ad.module_id)))
                              JOIN public.learning_objectives o ON ((o.lesson_id = l.id)))
                           WHERE ((ad.id = latest.assessment_definition_id) AND (o.code = kv.key))
                           ORDER BY l.ordinal, o.id
                          LIMIT 1) AS objective_id
                    FROM ( SELECT DISTINCT ON (r.session_id) r.per_domain,
                             r.session_id,
                             s.assessment_definition_id
                            FROM (public.scoped_official_results r
                              JOIN public.scoped_official_sessions s ON ((s.id = r.session_id)))
                           WHERE ((s.institution_id = calc_institution_competency_outcomes.p_institution) AND (s.mode = 'POST_TEST'::public.assessment_mode))
                           ORDER BY r.session_id, r.computed_at DESC) latest,
                     LATERAL jsonb_each(COALESCE(latest.per_domain, '{}'::jsonb)) kv(key, value)
                   WHERE ((jsonb_typeof(kv.value) = 'object'::text) AND (jsonb_typeof((kv.value -> 'penguasaan'::text)) = 'number'::text))) t
              LEFT JOIN public.learning_objectives lo ON ((lo.id = t.objective_id)))
           GROUP BY t.objective_id, COALESCE((t.objective_id)::text, t.code)) d;
END;
CREATE OR REPLACE FUNCTION public.calc_institution_net_gain(p_node uuid, p_institution uuid, p_catalogue text) RETURNS jsonb
    LANGUAGE sql STABLE
    SET search_path TO 'public', 'pg_temp'
    BEGIN ATOMIC
 SELECT jsonb_build_object('value', round(avg((g.post - g.pre)), 4), 'sample', count(DISTINCT g.person_id)) AS jsonb_build_object
    FROM ( SELECT s.person_id,
             s.plp_release_id,
             max(
                 CASE
                     WHEN (s.mode = 'PRE_TEST'::public.assessment_mode) THEN r.mastery
                     ELSE NULL::numeric
                 END) AS pre,
             max(
                 CASE
                     WHEN (s.mode = 'POST_TEST'::public.assessment_mode) THEN r.mastery
                     ELSE NULL::numeric
                 END) AS post
            FROM (public.scoped_official_sessions s
              JOIN public.scoped_official_results r ON ((r.session_id = s.id)))
           WHERE ((s.institution_id = calc_institution_net_gain.p_institution) AND (s.mode = ANY (ARRAY['PRE_TEST'::public.assessment_mode, 'POST_TEST'::public.assessment_mode])))
           GROUP BY s.person_id, s.plp_release_id) g
   WHERE ((g.pre IS NOT NULL) AND (g.post IS NOT NULL));
END;
CREATE OR REPLACE FUNCTION public.calc_institution_safety_gate_pass_rate(p_node uuid, p_institution uuid, p_catalogue text) RETURNS jsonb
    LANGUAGE sql STABLE
    SET search_path TO 'public', 'pg_temp'
    BEGIN ATOMIC
 SELECT jsonb_build_object('value', round(((count(*) FILTER (WHERE x.safety_gate_passed))::numeric / (NULLIF(count(*), 0))::numeric), 4), 'sample', count(*)) AS jsonb_build_object
    FROM ( SELECT DISTINCT ON (r.session_id) r.safety_gate_passed
            FROM (public.scoped_official_results r
              JOIN public.scoped_official_sessions s ON ((s.id = r.session_id)))
           WHERE ((s.institution_id = calc_institution_safety_gate_pass_rate.p_institution) AND (s.mode = 'POST_TEST'::public.assessment_mode))
           ORDER BY r.session_id, r.computed_at DESC) x;
END;
CREATE OR REPLACE FUNCTION public.calc_learner_result(p_node uuid, p_institution uuid, p_catalogue text) RETURNS jsonb
    LANGUAGE sql STABLE
    SET search_path TO 'public', 'pg_temp'
    BEGIN ATOMIC
 SELECT jsonb_build_object('value', COALESCE(jsonb_agg(jsonb_build_object('session_id', x.session_id, 'mode', x.mode, 'mastery', x.mastery, 'safety_gate_passed', x.safety_gate_passed) ORDER BY x.finalized_at), '[]'::jsonb), 'sample', count(*)) AS jsonb_build_object
    FROM ( SELECT DISTINCT ON (r.session_id) r.session_id,
             s.mode,
             r.mastery,
             r.safety_gate_passed,
             s.finalized_at
            FROM (public.scoped_official_results r
              JOIN public.scoped_official_sessions s ON ((s.id = r.session_id)))
           WHERE ((s.institution_id = calc_learner_result.p_institution) AND (s.person_id = calc_learner_result.p_node))
           ORDER BY r.session_id, r.computed_at DESC) x;
END;
CREATE OR REPLACE FUNCTION public.enforce_assignment_status() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
declare v_inst uuid; v_owner uuid; v_release uuid; v_legal boolean;
begin
  -- THE ASSIGNMENT'S TENANT IS THE NODE'S TENANT. The school that owns the
  -- class owns the decision to teach something to it (FABLE-05 §5.5).
  select n.institution_id into v_inst from public.org_nodes n where n.id = new.node_id;
  if v_inst is null then raise exception 'the assigned class or cohort does not exist'; end if;
  new.institution_id := v_inst;

  if tg_table_name = 'learning_assignments' then
    select r.institution_id into v_owner from public.plp_releases r where r.id = new.plp_release_id;
    v_release := new.plp_release_id;
  else
    select d.institution_id into v_owner from public.assessment_definitions d
     where d.id = new.assessment_definition_id;
    -- a canonical definition is never reachable on its own: it rides the
    -- learning assignment's release grant, exactly as in the session guard
    select l.plp_release_id into v_release from public.learning_assignments l
     where l.id = new.learning_assignment_id;
  end if;
  if v_owner is null then raise exception 'the assigned artefact does not exist'; end if;

  -- The artefact is this school's, or it is canonical content this school has
  -- been authorized to teach. Same predicate as the session guard (0055).
  if v_owner <> v_inst
     and not (v_release is not null and public.release_is_distributed_to(v_release, v_inst)) then
    raise exception
      'the assigned content belongs to another institution and is not canonical content distributed to this one';
  end if;

  if tg_op = 'INSERT' then
    if new.status <> 'DRAFT' then
      raise exception 'an assignment is created at DRAFT, not %', new.status;
    end if;
    return new;
  end if;

  if new.status is distinct from old.status then
    if tg_table_name = 'learning_assignments' then
      select exists (select 1 from public.learning_assignment_status_transitions t
                      where t.from_status = old.status and t.to_status = new.status) into v_legal;
    else
      select exists (select 1 from public.assessment_assignment_status_transitions t
                      where t.from_status = old.status and t.to_status = new.status) into v_legal;
    end if;
    if not v_legal then
      raise exception 'illegal assignment transition % -> % on %', old.status, new.status, tg_table_name;
    end if;
    -- assigning learning is a capability, not a side effect of editing a row
    -- one trigger serves two enums, so the comparison is on the label.
    -- CHANGED IN 0059: asked of the ASSIGNING school, which is the tenant that
    -- must hold the capability -- not of whoever authored the content.
    if new.status::text in ('ACTIVE','SCHEDULED','OPEN') then
      if not public.can_in_institution('CAN_ASSIGN_LEARNING', v_inst) then
        raise exception 'assigning requires CAN_ASSIGN_LEARNING in the owning institution';
      end if;
      new.assigned_by_person_id := coalesce(new.assigned_by_person_id, public.current_person_id());
      new.assigned_at := coalesce(new.assigned_at, now());
    end if;
  end if;
  return new;
end $$;
CREATE OR REPLACE FUNCTION public.enforce_certificate_write() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
begin
  if tg_op = 'DELETE' then
    raise exception 'a certificate is never deleted; revocation keeps the row (doc 16 §2)';
  end if;
  if tg_op = 'INSERT' then return new; end if;

  if new.session_id <> old.session_id or new.person_id <> old.person_id
     or new.institution_id <> old.institution_id or new.snapshot_id <> old.snapshot_id
     or new.certificate_number <> old.certificate_number
     or new.verification_token <> old.verification_token
     or new.issued_at is distinct from old.issued_at
     or new.issued_at_iso is distinct from old.issued_at_iso
     or new.canonical_payload is distinct from old.canonical_payload
     -- CR-02: what the certificate was issued under is part of it
     or new.institution_as_issued is distinct from old.institution_as_issued
     or new.course_subject_as_issued is distinct from old.course_subject_as_issued
     or new.course_title_as_issued is distinct from old.course_title_as_issued
     or new.language_as_issued is distinct from old.language_as_issued then
    raise exception 'a certificate is immutable; a correction is a new chain-linked row (§8)';
  end if;
  if old.status <> 'ELIGIBLE' and (new.signature is distinct from old.signature
                                or new.key_version is distinct from old.key_version) then
    raise exception 'the signature of an issued certificate is immutable (INV-05)';
  end if;
  if not (
       (old.status = 'ELIGIBLE'   and new.status in ('ELIGIBLE','ISSUED'))
    or (old.status = 'ISSUED'     and new.status in ('ISSUED','REVOKED','SUPERSEDED'))
    or (old.status = 'REVOKED'    and new.status = 'REVOKED')
    or (old.status = 'SUPERSEDED' and new.status = 'SUPERSEDED')) then
    raise exception 'illegal certificate transition % -> % (doc 04 §7)', old.status, new.status;
  end if;
  -- D-093 T2: a revocation records when and why, and stands as first recorded
  if new.status = 'REVOKED' and old.status <> 'REVOKED'
     and (new.revoked_at is null or coalesce(btrim(new.revoked_reason), '') = '') then
    raise exception 'a revocation records when and why (D-093)';
  end if;
  if old.status = 'REVOKED' and (new.revoked_at is distinct from old.revoked_at
                                 or new.revoked_reason is distinct from old.revoked_reason) then
    raise exception 'a revocation stands as first recorded: its time and reason are not rewritten (D-093)';
  end if;
  return new;
end $$;
CREATE OR REPLACE FUNCTION public.enforce_evidence_override() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
declare v_inst uuid; v_current public.evidence_class; v_actor uuid;
begin
  if tg_op <> 'INSERT' then
    raise exception 'an evidence reclassification is append-only: file another override';
  end if;
  select s.institution_id into v_inst from public.assessment_sessions s where s.id = new.session_id;
  if v_inst is null then raise exception 'unknown session %', new.session_id; end if;
  new.institution_id := v_inst;

  v_actor := public.current_person_id();
  if v_actor is null then
    raise exception 'reclassifying evidence is a human act and needs a known person';
  end if;
  if not public.can_in_institution('CAN_REVIEW_INTEGRITY', v_inst) then
    raise exception 'reclassifying evidence requires CAN_REVIEW_INTEGRITY in the owning institution';
  end if;
  new.decided_by_person_id := v_actor;

  v_current := public.effective_evidence_class(new.session_id);
  new.from_class := v_current;

  if public.evidence_class_min(v_current, new.to_class) <> new.to_class then
    raise exception 'an override may only reduce eligibility: % -> % would promote it',
      v_current, new.to_class;
  end if;

  perform public.audit_write('EVIDENCE_RECLASSIFIED', 'assessment_sessions',
    new.session_id::text, v_inst,
    jsonb_build_object('from_class', v_current, 'to_class', new.to_class, 'reason', new.reason));
  return new;
end $$;
CREATE OR REPLACE FUNCTION public.enrollments_guard() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public', 'pg_temp'
    AS $$
begin
  if tg_op = 'DELETE' then raise exception 'enrollments are append-only (INV-23)'; end if;
  if tg_op = 'INSERT' then
    if not exists (select 1 from public.academic_periods ap where ap.id = new.academic_period_id and ap.institution_id = new.institution_id) then
      raise exception 'academic period belongs to another institution';
    end if;
    if new.programme_id is not null and not exists (
      select 1 from public.org_nodes n where n.id = new.programme_id and n.kind = 'PROGRAMME' and n.institution_id = new.institution_id) then
      raise exception 'programme_id must be a PROGRAMME node of the same institution';
    end if;
    if new.status not in ('PENDING','ACTIVE') then raise exception 'new enrollment must be PENDING or ACTIVE'; end if;
    return new;
  end if;
  -- UPDATE: identity columns immutable; only lifecycle transitions allowed.
  if new.person_id <> old.person_id or new.institution_id <> old.institution_id
     or new.academic_period_id <> old.academic_period_id or new.valid_from <> old.valid_from then
    raise exception 'enrollment identity columns are immutable';
  end if;
  if new.status <> old.status then
    if not ((old.status='PENDING' and new.status in ('ACTIVE','CANCELLED'))
         or (old.status='ACTIVE' and new.status='ENDED')) then
      raise exception 'invalid enrollment transition % → %', old.status, new.status;
    end if;
    if new.status in ('ENDED','CANCELLED') and new.valid_to is null then new.valid_to := now(); end if;
  elsif old.status in ('ENDED','CANCELLED') then
    raise exception 'a closed enrollment is immutable';
  end if;
  return new;
end $$;
CREATE OR REPLACE FUNCTION public.extend_session_deadline(p_session uuid, p_minutes integer, p_reason text) RETURNS timestamp with time zone
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
declare v_actor uuid; v_s public.assessment_sessions; v_old timestamptz; v_new timestamptz;
begin
  v_actor := public.current_person_id();
  if v_actor is null then raise exception 'no person in this session'; end if;
  select * into v_s from public.assessment_sessions where id = p_session;
  if v_s.id is null then raise exception 'unknown session %', p_session; end if;
  if not public.can_in_institution('CAN_ASSIGN_LEARNING', v_s.institution_id) then
    raise exception 'extending a deadline requires CAN_ASSIGN_LEARNING in that institution';
  end if;
  if p_reason is null or btrim(p_reason) = '' then
    raise exception 'an extension records why (doc 04 §5: no silent extension)';
  end if;
  if p_minutes is null or p_minutes < 1 or p_minutes > 120 then
    raise exception 'an extension is between 1 and 120 minutes, not %', p_minutes;
  end if;
  if v_s.deadline_extended_count >= 3 then
    raise exception 'this session has already been extended % times; a fourth is an assignment decision, not an extension',
      v_s.deadline_extended_count;
  end if;
  if v_s.status in ('FINALIZED','TERMINATED') then
    raise exception 'a % session has no deadline to extend', v_s.status;
  end if;

  v_old := v_s.authoritative_deadline;
  v_new := coalesce(v_old, now()) + make_interval(mins => p_minutes);
  update public.assessment_sessions
     set authoritative_deadline = v_new,
         deadline_extended_count = deadline_extended_count + 1
   where id = p_session;

  perform public.audit_write('assessment_session.deadline_extended', 'assessment_sessions',
    p_session::text, v_s.institution_id,
    jsonb_build_object('session_id', p_session, 'old_deadline', v_old, 'new_deadline', v_new,
                       'minutes', p_minutes, 'reason', p_reason, 'actor', v_actor));
  return v_new;
end $$;
CREATE OR REPLACE FUNCTION public.integrity_signals_awaiting_review() RETURNS TABLE(signal_id uuid, session_id uuid, institution_id uuid, category public.integrity_category, observed_at timestamp with time zone, may_refer boolean)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
  select s.id, s.session_id, s.institution_id, s.category, s.observed_at,
         (not public.session_is_professional(s.session_id) and ses.class_node_id is not null
          and public.can_on_node('CAN_REVIEW_INTEGRITY', ses.class_node_id))
    from public.integrity_signals s
    join public.assessment_sessions ses on ses.id = s.session_id
   where public.current_person_id() is not null
     and public.can_in_institution('CAN_REVIEW_INTEGRITY', s.institution_id)
     and (not public.session_is_professional(s.session_id) or public.is_system_admin())
     and not public.integrity_signal_decided(s.id)
   order by s.observed_at desc, s.id
   limit 200
$$;
CREATE OR REPLACE FUNCTION public.issue_institutional_id(p_person uuid, p_institution uuid) RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
declare v_ns text; v_next integer; v_id text; v_existing text; v_suffix text;
begin
  -- ALREADY HAS ONE -> THAT ONE. Not a second number and not an error: the
  -- pair already has an identity and this is what it is. This is the row-level
  -- idempotency the import path leans on.
  select ii.institutional_id into v_existing from public.institutional_identities ii
   where ii.person_id = p_person and ii.institution_id = p_institution;
  if v_existing is not null then return v_existing; end if;

  -- The row lock serialises allocation inside one school; the unique
  -- constraint on (institution_id, sequence_number) is what makes it true.
  select i.namespace into v_ns from public.institutions i
   where i.id = p_institution for update;
  if v_ns is null then
    raise exception 'this institution has reserved no namespace, so it can issue no institutional ID';
  end if;

  select coalesce(max(ii.sequence_number), 0) + 1 into v_next
    from public.institutional_identities ii where ii.institution_id = p_institution;
  if v_next > 999999 then
    raise exception 'this institution has issued all 999999 institutional person IDs available under %', v_ns;
  end if;

  -- Two uppercase alphanumerics carrying no meaning and no secret; the
  -- namespace and the number already make the ID unique, and
  -- institutional_identities_id_unique is the backstop that says so.
  v_suffix := (select string_agg(substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
                                        1 + floor(random() * 36)::int, 1), '')
                 from generate_series(1, 2));
  v_id := v_ns || lpad(v_next::text, 6, '0') || v_suffix;

  insert into public.institutional_identities
    (person_id, institution_id, institutional_id, sequence_number, issued_by_person_id)
  values (p_person, p_institution, v_id, v_next, public.current_person_id());
  return v_id;
end $$;
CREATE OR REPLACE FUNCTION public.kenaikan_awal_akhir(p_class uuid) RETURNS TABLE(awal numeric, akhir numeric, pasangan integer, orang integer)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
declare v_inst uuid; v_ok text;
begin
  if public.current_person_id() is null or p_class is null then return; end if;
  select n.institution_id into v_inst from public.org_nodes n where n.id = p_class and n.kind = 'CLASS';
  if v_inst is null then return; end if;
  -- the reader's own Kenaikan: its audiences, minimum and boundary decide; anything but «ok» answers nothing
  v_ok := public.metric_evaluate('class.net_gain', p_class, v_inst) ->> 'status';
  if v_ok is distinct from 'ok' then return; end if;
  begin
    perform set_config('pintar.metric_boundary_node', p_class::text, true);
    perform set_config('pintar.metric_boundary_person', '', true);
    return query
      -- calc_class_net_gain's own pairing (MC-8): one (learner, chapter) with both tests
      select round(avg(g.pre), 4), round(avg(g.post), 4), count(*)::integer, count(distinct g.person_id)::integer
        from (select s.person_id, s.plp_release_id,
                     max(case when s.mode = 'PRE_TEST'::public.assessment_mode then r.mastery end) as pre,
                     max(case when s.mode = 'POST_TEST'::public.assessment_mode then r.mastery end) as post
                from public.scoped_official_sessions s
                join public.scoped_official_results r on r.session_id = s.id
               where s.institution_id = v_inst and s.class_node_id = p_class
                 and s.mode = any (array['PRE_TEST'::public.assessment_mode, 'POST_TEST'::public.assessment_mode])
               group by s.person_id, s.plp_release_id) g
       where g.pre is not null and g.post is not null
      having count(*) > 0;
    perform set_config('pintar.metric_boundary_node', '', true);
  exception when others then
    perform set_config('pintar.metric_boundary_node', '', true);
    raise;
  end;
end $$;
CREATE OR REPLACE FUNCTION public.launch_quick_assessment(p_node uuid, p_module uuid, p_item_count integer, p_minutes integer) RETURNS TABLE(assessment_definition_id uuid, assessment_assignment_id uuid)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
declare
  v_actor uuid; v_inst uuid; v_course uuid; v_tier public.bank_type;
  v_period uuid; v_def uuid; v_assign uuid; v_drawable int; v_kind public.org_kind;
  v_label text; v_title text; v_try int;
  -- ADDED IN 0062. The module's owner is a SEPARATE fact from the assigning
  -- school's, and conflating them is the defect this migration repairs.
  v_module_inst uuid; v_canonical boolean := false;
begin
  v_actor := public.current_person_id();
  if v_actor is null then raise exception 'no person in this session'; end if;

  select n.institution_id, n.kind, n.academic_period_id into v_inst, v_kind, v_period
    from public.org_nodes n where n.id = p_node;
  if v_inst is null then raise exception 'unknown class %', p_node; end if;
  if v_kind not in ('CLASS','COHORT') then
    raise exception 'a quick assessment is launched for a class or cohort, not a %', v_kind;
  end if;
  if not public.can_on_node('CAN_QUICK_ASSESSMENT', p_node) then
    raise exception 'launching a quick assessment requires CAN_QUICK_ASSESSMENT over this class';
  end if;

  -- CHANGED IN 0062. `v_inst` stays the ASSIGNING school's -- it is the tenant
  -- of the class, the definition, the assignment and the audit line. The
  -- module's owner is read into its own variable and then TESTED, never copied.
  select m.course_id, c.institution_id into v_course, v_module_inst
    from public.modules m join public.courses c on c.id = m.course_id where m.id = p_module;
  if v_course is null then raise exception 'unknown module %', p_module; end if;

  if v_module_inst is distinct from v_inst then
    -- ADR-0018: eligibility for an ad-hoc paper follows AUTHORIZATION. The
    -- predicate carries the whole rule, including the tenant-kind conjunct
    -- that makes one school's grant unusable by another; restating any part of
    -- it here would create a second answer to the same question.
    select exists (
      select 1 from public.plp_releases r
       where r.course_id = v_course
         and public.release_is_distributed_to(r.id, v_inst)
         and public.caller_may_read_distributed_release(r.id))
      into v_canonical;
    if not v_canonical then
      raise exception 'that module belongs to another institution (INV-13)';
    end if;
  end if;

  if p_item_count is null or p_item_count < 3 or p_item_count > 20 then
    raise exception 'a quick assessment carries between 3 and 20 questions, not %', p_item_count;
  end if;
  if p_minutes is null or p_minutes < 5 or p_minutes > 60 then
    raise exception 'a quick assessment runs between 5 and 60 minutes, not %', p_minutes;
  end if;

  select m.max_bank_tier into v_tier from public.mode_policy m where m.mode = 'QUICK';
  if v_tier is null then raise exception 'QUICK has no mode policy row'; end if;
  if v_tier = 'EXAM' then
    raise exception 'the QUICK mode policy reaches the EXAM tier; that is an INV-12 violation, not a configuration';
  end if;

  -- REPAIRED IN 0049. The title was the minute stamp alone, and
  -- (institution_id, title, mode, version) is UNIQUE: two educators in one
  -- institution launching inside the same minute produced a raw unique
  -- violation on the second launch. In a phase whose stated target is "about
  -- one minute from intent to learners answering" that is not a corner case,
  -- it is the normal case at the start of a period.
  --
  -- The title stays a human label -- a teacher recognises "Uji Cepat" and the
  -- time -- and takes a counter only when it has to. The counter is NOT a
  -- version: two quick assessments launched in the same minute are different
  -- instruments, not revisions of one, and overloading `version` would make
  -- the definition history lie.
  --
  -- RENAMED IN 0090. 'Kuis Cepat' until this migration; "Uji Cepat" is the
  -- ruled Indonesian name, and "kuis" was one of four names this one thing had.
  -- Forward-only: rows written before this read the old label and keep it.
  --
  -- DATED IN JAKARTA IN BOB-33. The stamp was the current time formatted with
  -- an English month abbreviation, in the database session's time zone (UTC):
  -- a teacher in WIB launching at 07:15 read 00:15, and one launching before
  -- 07:00 read the previous day's date. Now it is quick_assessment_label(now()):
  -- Jakarta time, the numeric date, the same in both languages. Forward-only
  -- again: stored titles keep their stamp.
  v_label := 'Uji Cepat — ' || public.quick_assessment_label(now());
  v_title := v_label;
  v_try := 1;
  loop
    begin
      insert into public.assessment_definitions (
        institution_id, module_id, title, mode, bank_type, item_count,
        safety_critical_minimum, difficulty_mix, passing_rules, attempt_limit,
        allows_pause, offline_tolerant, hesitation_window_seconds, shuffle_policy,
        status, author_person_id, is_ad_hoc)
      values (
        -- THE ASSIGNING SCHOOL, always. Over canonical content this row is the
        -- school's instrument about someone else's chapter; the chapter's owner
        -- is recorded where it belongs, on the items and the release the
        -- session cites.
        v_inst, p_module,
        v_title,
        'QUICK', v_tier, p_item_count,
        0, jsonb_build_object('SEDANG', greatest(p_item_count / 2, 1), 'MUDAH', p_item_count - greatest(p_item_count / 2, 1)),
        jsonb_build_object('mastery_min', 0.6), 1,
        false, false, 25, 'ITEMS_AND_OPTIONS',
        'INGESTED', v_actor,
        -- INV-04: an ad-hoc instrument is outside the taught-content release, which
        -- is the only reason it may be created over a course that is already sealed
        true)
      returning id into v_def;
      exit;
    exception when unique_violation then
      v_try := v_try + 1;
      if v_try > 200 then
        raise exception 'too many quick assessments launched in this minute for this institution';
      end if;
      v_title := v_label || ' (' || v_try || ')';
    end;
  end loop;

  -- ADDED IN 0062 (ADR-0018). One content owner per ad-hoc paper, decided in
  -- the ADR and enforced at creation -- before the assignment exists, so a
  -- refused launch leaves no half-built instrument behind.
  perform public.enforce_ad_hoc_single_owner(v_def);

  select count(*) into v_drawable from public.drawable_items_for_definition(v_def);
  if v_drawable < p_item_count then
    raise exception 'this module has % drawable question(s) at the % tier; a % question quick assessment cannot be filled',
      v_drawable, v_tier, p_item_count;
  end if;

  insert into public.assessment_assignments (
    institution_id, assessment_definition_id, node_id, academic_period_id,
    opens_at, closes_at, assigned_by_person_id, assigned_at)
  values (v_inst, v_def, p_node, v_period, now(), now() + make_interval(mins => p_minutes),
          v_actor, now())
  returning id into v_assign;
  update public.assessment_assignments set status = 'SCHEDULED' where id = v_assign;
  update public.assessment_assignments set status = 'OPEN' where id = v_assign;

  perform public.audit_write('quick_assessment.launched', 'assessment_assignments', v_assign::text,
    v_inst,
    jsonb_build_object('definition', v_def, 'assignment', v_assign, 'node', p_node,
                       'items', p_item_count, 'minutes', p_minutes, 'tier', v_tier, 'ad_hoc', true,
                       -- provenance, not authority: which owner's chapter this
                       -- instrument is about. The authorization itself lives in
                       -- the distribution row and its own audit line.
                       'content_owner', v_module_inst, 'over_canonical', v_canonical));
  assessment_definition_id := v_def; assessment_assignment_id := v_assign;
  return next;
end $$;
CREATE OR REPLACE FUNCTION public.may_start_assessment(p_assessment_assignment uuid) RETURNS TABLE(ok boolean, reason text)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
declare
  v_aa public.assessment_assignments; v_d public.assessment_definitions;
  v_person uuid; v_enrol uuid; v_attempts integer;
begin
  v_person := public.current_person_id();
  if v_person is null then ok := false; reason := 'NO_PERSON'; return next; return; end if;
  select * into v_aa from public.assessment_assignments where id = p_assessment_assignment;
  if v_aa.id is null then ok := false; reason := 'UNKNOWN_ASSIGNMENT'; return next; return; end if;
  if v_aa.status <> 'OPEN' then
    ok := false; reason := 'ASSIGNMENT_' || v_aa.status::text; return next; return;
  end if;
  if (v_aa.opens_at is not null and now() < v_aa.opens_at)
     or (v_aa.closes_at is not null and now() >= v_aa.closes_at) then
    ok := false; reason := 'OUTSIDE_WINDOW'; return next; return;
  end if;
  select e.id into v_enrol from public.enrollments e
   where e.person_id = v_person and e.institution_id = v_aa.institution_id
     and e.status = 'ACTIVE'
   order by e.created_at desc limit 1;
  if v_enrol is null then ok := false; reason := 'NO_ACTIVE_ENROLMENT'; return next; return; end if;
  -- ACTIVE membership under the assigned node: PUBLISH is not ASSIGN, and an
  -- assignment reaches a learner only through the class or cohort they are in.
  if not exists (select 1 from public.memberships m
                   join public.org_nodes n on n.id = m.node_id
                  where m.enrollment_id = v_enrol and m.valid_to is null
                    and (n.id = v_aa.node_id or n.jalur @> array[v_aa.node_id])) then
    ok := false; reason := 'NO_ACTIVE_MEMBERSHIP'; return next; return;
  end if;
  select * into v_d from public.assessment_definitions where id = v_aa.assessment_definition_id;
  if v_d.attempt_limit is not null then
    select count(*) into v_attempts from public.assessment_sessions s
     where s.person_id = v_person and s.assessment_assignment_id = p_assessment_assignment;
    if v_attempts >= v_d.attempt_limit then
      ok := false; reason := 'ATTEMPT_LIMIT_REACHED'; return next; return;
    end if;
  end if;
  -- ADDED IN 20261229100000 (W6.10, D-186; ADM-15). The Uji Penguasaan of a chapter given with a Pemetaan Awal waits
  -- for that Pemetaan Awal to be finished. The screens held this order; a direct call did not.
  if v_aa.learning_assignment_id is not null and v_d.mode = 'POST_TEST'
     and exists (select 1 from public.assessment_assignments a
                   join public.assessment_definitions d on d.id = a.assessment_definition_id
                  where a.learning_assignment_id = v_aa.learning_assignment_id and d.mode = 'PRE_TEST')
     and not exists (select 1 from public.assessment_sessions s
                      where s.person_id = v_person and s.learning_assignment_id = v_aa.learning_assignment_id
                        and s.mode = 'PRE_TEST' and s.status = 'FINALIZED') then
    ok := false; reason := 'PRE_TEST_NOT_FINALIZED'; return next; return;
  end if;
  ok := true; reason := 'OK'; return next;
end $$;
CREATE OR REPLACE FUNCTION public.metric_evaluate(p_metric_id text, p_node uuid, p_institution uuid, p_catalogue_version text DEFAULT NULL::text) RETURNS jsonb
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $_$
declare
  v_cat text; d public.metric_definitions; v_out jsonb; v_permitted boolean;
  v_me uuid; v_gov text; v_governing uuid; v_bind_node uuid; v_bind_person uuid;
  v_have numeric; v_ready public.evidence_readiness_state;
begin
  v_cat := coalesce(p_catalogue_version, public.current_metric_catalogue());
  if v_cat is null then
    raise exception 'no live metric catalogue: a report cannot cite a version that does not exist';
  end if;
  if not exists (select 1 from public.metric_catalogue c where c.version = v_cat) then
    raise exception 'no such catalogue version: %', v_cat;
  end if;
  v_me := public.current_person_id();

  select * into d from public.metric_definitions m
   where m.catalogue_version = v_cat and m.metric_id = p_metric_id;

  if d.metric_id is null then
    return jsonb_build_object('status', 'unavailable',
                              'statement_key', 'laporan.metrik.tidak_dikenal');
  end if;

  select s.governing_scope into v_gov
    from public.metric_calculator_scope s where s.calculation_key = d.calculation_key;
  if v_gov is null then
    return jsonb_build_object('status', 'not_permitted',
                              'statement_key', 'laporan.metrik.bukan_untuk_anda');
  end if;

  v_governing := case v_gov
                   when 'NODE'   then p_node
                   when 'TENANT' then p_institution
                   else null
                 end;

  -- AUTHORIZATION FIRST, and R5 CHANGES NOTHING ABOVE THIS LINE. Readiness is
  -- a fact about a population's evidence; a reader with no right to the
  -- population has no right to that fact either.
  v_permitted := false;
  if public.is_system_admin() then
    v_permitted := true;
    v_bind_node := coalesce(v_governing, p_institution);
  elsif v_gov = 'LEARNER' then
    if v_me is not null and p_node = v_me and 'STUDENT' = any(d.allowed_audiences) then
      v_permitted := true; v_bind_person := v_me;
    else
      v_bind_node := public.audience_scope_over_learner(d.allowed_audiences, p_node, p_institution);
      v_permitted := v_bind_node is not null;
    end if;
  elsif v_gov = 'ITEM' then
    v_permitted := exists (select 1 from public.role_assignments ra
                            where ra.person_id = v_me and ra.institution_id = p_institution
                              and ra.revoked_at is null
                              and now() >= ra.valid_from and now() < ra.valid_until
                              and ra.role = any(d.allowed_audiences));
    if v_permitted then v_bind_node := p_institution; end if;
  else
    v_permitted := public.audience_on_node(d.allowed_audiences, v_governing);
    if v_permitted then v_bind_node := v_governing; end if;
  end if;

  if not v_permitted then
    return jsonb_build_object('status', 'not_permitted',
                              'statement_key', 'laporan.metrik.bukan_untuk_anda');
  end if;

  if d.deprecated then
    return jsonb_build_object('metric_id', p_metric_id, 'catalogue_version', v_cat,
                              'status', 'deprecated', 'label_key', d.label_key,
                              'statement_key', coalesce(d.deprecation_note_key, 'laporan.metrik.diganti'));
  end if;

  begin
    perform set_config('pintar.metric_boundary_node',   coalesce(v_bind_node::text, ''),   true);
    perform set_config('pintar.metric_boundary_person', coalesce(v_bind_person::text, ''), true);
    execute format('select public.%I($1, $2, $3)', 'calc_' || d.calculation_key)
       into v_out using p_node, p_institution, v_cat;
    perform set_config('pintar.metric_boundary_node', '', true);
    perform set_config('pintar.metric_boundary_person', '', true);
  exception when others then
    perform set_config('pintar.metric_boundary_node', '', true);
    perform set_config('pintar.metric_boundary_person', '', true);
    raise;
  end;

  v_have  := coalesce((v_out ->> 'sample')::numeric, 0);
  v_ready := public.evidence_readiness(v_have, d.minimum_sample);

  -- A COUNT THAT CLEARS THE MINIMUM BUT PRODUCED NO FIGURE HAS NOT PRODUCED
  -- THE INTERPRETATION. Returning `ok` with a null value would hand a consumer
  -- an interpretation that does not exist, and §4 is explicit that a
  -- calculator returning zero, NULL or an empty object must not become one.
  -- The structure required to say this particular thing is not there, so this
  -- is NOT_YET_EVALUABLE rather than a quiet null.
  if v_ready = 'SUFFICIENT_EVIDENCE'
     and (v_out -> 'value' is null or jsonb_typeof(v_out -> 'value') = 'null') then
    v_ready := 'NOT_YET_EVALUABLE';
  end if;

  if v_ready <> 'SUFFICIENT_EVIDENCE' then
    -- `status` keeps its existing vocabulary so every consumer written against
    -- it goes on working unchanged; `readiness` is the new, finer truth beside
    -- it. No value is emitted on this path and none ever was.
    return jsonb_build_object('metric_id', p_metric_id, 'catalogue_version', v_cat,
                              'status', 'below_minimum', 'label_key', d.label_key,
                              'readiness', v_ready,
                              'statement_key',
                              case v_ready
                                when 'NOT_YET_EVALUABLE' then 'laporan.metrik.belum_ada_bukti'
                                else 'laporan.metrik.belum_cukup_data'
                              end,
                              'have', v_have,
                              'needed', d.minimum_sample)
           -- CR-81 (D-123(3)): who is in the population is no performance figure; it is said whatever the floor
           || case when v_out ? 'population' then jsonb_build_object('population', v_out -> 'population') else '{}'::jsonb end;
  end if;

  return jsonb_build_object('metric_id', p_metric_id, 'catalogue_version', v_cat,
                            'status', 'ok', 'scope', d.scope,
                            'readiness', v_ready,
                            'label_key', d.label_key, 'meaning_key', d.meaning_key,
                            'allowed_visualizations', to_jsonb(d.allowed_visualizations),
                            'value', v_out -> 'value', 'sample', v_out -> 'sample')
         || case when v_out ? 'population' then jsonb_build_object('population', v_out -> 'population') else '{}'::jsonb end;
end $_$;
CREATE OR REPLACE FUNCTION public.move_learner_to_class(p_membership uuid, p_kelas uuid) RETURNS uuid
    LANGUAGE plpgsql
    SET search_path TO 'public', 'pg_temp'
    AS $$
declare v_m record; v_to record; v_status public.enrollment_status; v_new uuid; v_n int;
begin
  if p_membership is null or p_kelas is null then
    raise exception using errcode = '22023', message = 'a placement and a destination Kelas are both required';
  end if;

  select m.id, m.enrollment_id, m.node_id, m.academic_period_id, m.valid_to, n.kind, n.institution_id
    into v_m
    from public.memberships m join public.org_nodes n on n.id = m.node_id
   where m.id = p_membership;
  select n.id, n.kind, n.institution_id, n.academic_period_id, n.jalur
    into v_to
    from public.org_nodes n where n.id = p_kelas;
  if v_m.id is null or v_to.id is null or v_to.institution_id <> v_m.institution_id
     or not public.has_scope('INSTITUTION_ADMIN', v_m.node_id)
     or not public.has_scope('INSTITUTION_ADMIN', v_to.id) then
    raise exception using errcode = '42501',
      message = 'moving a learner needs INSTITUTION_ADMIN over the place they are in and the Kelas they move to, in one school';
  end if;

  select e.status into v_status from public.enrollments e where e.id = v_m.enrollment_id;
  if v_m.valid_to is not null or v_status is null or v_status not in ('PENDING', 'ACTIVE') then
    raise exception using errcode = 'PR070', detail = 'MOVE_NOT_CURRENT',
      message = 'this placement has already ended';
  end if;
  -- a Kelas to another Kelas; or a Tingkat placement into a Kelas of that Tingkat (J3.6)
  if v_to.kind <> 'CLASS'
     or v_m.kind not in ('CLASS', 'COHORT')
     or (v_m.kind = 'COHORT' and not (v_to.jalur @> array[v_m.node_id])) then
    raise exception using errcode = 'PR070', detail = 'MOVE_NOT_A_KELAS',
      message = 'a placement moves to a Kelas: from a Kelas, or from a Tingkat into one of its Kelas';
  end if;
  if v_m.kind = 'COHORT' and exists (
       select 1 from public.memberships k join public.org_nodes kn on kn.id = k.node_id
        where k.enrollment_id = v_m.enrollment_id and k.valid_to is null and kn.kind = 'CLASS'
          and kn.jalur @> array[v_m.node_id]) then
    raise exception using errcode = 'PR070', detail = 'MOVE_ALREADY_IN_KELAS',
      message = 'the learner already has a Kelas in this Tingkat; move them from that Kelas';
  end if;
  if v_to.id = v_m.node_id then
    raise exception using errcode = 'PR070', detail = 'MOVE_SAME_KELAS',
      message = 'the learner is already in this Kelas';
  end if;
  if v_to.academic_period_id is distinct from v_m.academic_period_id then
    raise exception using errcode = 'PR070', detail = 'MOVE_OTHER_YEAR',
      message = 'the destination Kelas is in another academic year; the rollover moves a class into the next year';
  end if;

  update public.memberships
     set valid_to = now(), close_reason = 'MOVED'
   where id = v_m.id and valid_to is null;
  get diagnostics v_n = row_count;
  if v_n <> 1 then
    raise exception using errcode = 'PR070', detail = 'MOVE_NOT_CURRENT',
      message = 'this placement has already ended';
  end if;

  insert into public.memberships (enrollment_id, node_id, academic_period_id)
  values (v_m.enrollment_id, v_to.id, v_m.academic_period_id)
  returning id into v_new;
  return v_new;
end $$;
CREATE OR REPLACE FUNCTION public.murid_perlu_penguatan(p_class uuid) RETURNS TABLE(person_id uuid, display_name text, benar integer, total integer, soal_wajib_tepat boolean)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
declare
  v_me uuid; v_inst uuid; v_jalur uuid[]; v_cat text; v_aud public.app_role[]; v_lowest text;
begin
  v_me := public.current_person_id();
  if v_me is null or p_class is null then return; end if;

  select n.institution_id, n.jalur into v_inst, v_jalur
    from public.org_nodes n where n.id = p_class and n.kind = 'CLASS'
     and n.member_kind = 'LEARNER';   -- a class of learners: a PD class's participants are never named by band (D-069)
  if v_inst is null then return; end if;

  -- the audiences the catalogue gives a learner's record, less the learner's own
  v_cat := public.current_metric_catalogue();
  select array(select a from unnest(m.allowed_audiences) a where a <> 'STUDENT') into v_aud
    from public.metric_definitions m
   where m.catalogue_version = v_cat and m.metric_id = 'learner.result';
  if v_aud is null or cardinality(v_aud) = 0 then return; end if;

  -- the reader stands over THIS class
  if not exists (select 1 from public.role_assignments ra
                  where ra.person_id = v_me
                    and ra.revoked_at is null
                    and now() >= ra.valid_from and now() < ra.valid_until
                    and ra.role = any (v_aud)
                    and ra.scope_node_id is not null
                    and v_jalur @> array[ra.scope_node_id]) then
    return;
  end if;

  -- the lowest band of the catalogue in force
  select t.tier_key into v_lowest from public.readiness_tiers t
   where t.catalogue_version = v_cat and t.min_mastery is not null
   order by t.min_mastery limit 1;
  if v_lowest is null then return; end if;

  begin
    perform set_config('pintar.metric_boundary_node', p_class::text, true);
    perform set_config('pintar.metric_boundary_person', '', true);
    return query
      with learner as (
        -- calc_class_readiness_distribution's reading: the latest official Uji Penguasaan result in this class
        select distinct on (s.person_id) s.person_id, r.mastery, r.safety_gate_passed, r.per_domain
          from public.scoped_official_sessions s
          join public.scoped_official_results r on r.session_id = s.id
         where s.institution_id = v_inst and s.class_node_id = p_class
           and s.mode = 'POST_TEST'::public.assessment_mode
         order by s.person_id, r.computed_at desc
      ), banded as (
        select l.person_id, l.safety_gate_passed, l.per_domain,
               coalesce((select t2.tier_key from public.readiness_tiers t2
                          where t2.catalogue_version = v_cat and t2.min_mastery is not null
                            and l.mastery >= t2.min_mastery and l.mastery < t2.max_mastery
                            and l.safety_gate_passed is not false
                          limit 1), v_lowest) as tier_key
          from learner l
      )
      select b.person_id, p.display_name,
             (select coalesce(sum((kv.value ->> 'benar')::int), 0)::int from jsonb_each(coalesce(b.per_domain, '{}'::jsonb)) kv
               where jsonb_typeof(kv.value) = 'object' and jsonb_typeof(kv.value -> 'benar') = 'number'),
             (select coalesce(sum((kv.value ->> 'total')::int), 0)::int from jsonb_each(coalesce(b.per_domain, '{}'::jsonb)) kv
               where jsonb_typeof(kv.value) = 'object' and jsonb_typeof(kv.value -> 'total') = 'number'),
             b.safety_gate_passed
        from banded b
        join public.persons p on p.id = b.person_id
       where b.tier_key = v_lowest
         and exists (select 1 from public.memberships m
                       join public.enrollments e on e.id = m.enrollment_id
                      where m.node_id = p_class and m.valid_to is null
                        and e.person_id = b.person_id and e.institution_id = v_inst
                        and e.status in ('PENDING', 'ACTIVE'))
       order by p.display_name, b.person_id;
    perform set_config('pintar.metric_boundary_node', '', true);
  exception when others then
    perform set_config('pintar.metric_boundary_node', '', true);
    raise;
  end;
end $$;
CREATE OR REPLACE FUNCTION public.my_cycle_state(p_learning_assignment uuid) RETURNS TABLE(pre_assignment uuid, pre_session uuid, pre_status public.session_status, post_assignment uuid, post_session uuid, post_status public.session_status)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
declare v_person uuid;
begin
  v_person := public.current_person_id();
  if v_person is null
     or not exists (select 1 from public.my_learning_assignments() m
                     where m.learning_assignment_id = p_learning_assignment) then
    perform public.assign_refuse('CYCLE_NOT_ASSIGNED');
  end if;
  return query
  with aa as (
    select a.id, d.mode
      from public.assessment_assignments a
      join public.assessment_definitions d on d.id = a.assessment_definition_id
     where a.learning_assignment_id = p_learning_assignment
  ),
  latest as (
    select distinct on (s.mode) s.mode, s.id, s.status
      from public.assessment_sessions s
     where s.person_id = v_person and s.learning_assignment_id = p_learning_assignment
     order by s.mode, s.created_at desc
  )
  select (select id from aa where mode = 'PRE_TEST'),
         (select id from latest where mode = 'PRE_TEST'),
         (select status from latest where mode = 'PRE_TEST'),
         (select id from aa where mode = 'POST_TEST'),
         (select id from latest where mode = 'POST_TEST'),
         (select status from latest where mode = 'POST_TEST');
end $$;
CREATE OR REPLACE FUNCTION public.open_assessment_session(p_enrollment uuid, p_definition uuid, p_plp_release uuid, p_channel public.evidence_channel, p_mode public.assessment_mode, p_engine_version text, p_scoring_policy_version text, p_class_node uuid DEFAULT NULL::uuid, p_cohort_node uuid DEFAULT NULL::uuid, p_authoritative_deadline timestamp with time zone DEFAULT NULL::timestamp with time zone, p_learning_assignment uuid DEFAULT NULL::uuid, p_assessment_assignment uuid DEFAULT NULL::uuid) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
declare v_id uuid; v_version integer; v_inst uuid;
begin
  select d.version into v_version from public.assessment_definitions d where d.id = p_definition;
  if v_version is null then raise exception 'unknown assessment definition %', p_definition; end if;
  select e.institution_id into v_inst from public.enrollments e where e.id = p_enrollment;

  -- an assignment named here belongs to the same institution as the enrolment,
  -- or the provenance would name two tenants at once
  if p_learning_assignment is not null
     and not exists (select 1 from public.learning_assignments la
                      where la.id = p_learning_assignment and la.institution_id = v_inst) then
    raise exception 'the learning assignment does not belong to the enrolment''s institution';
  end if;
  if p_assessment_assignment is not null
     and not exists (select 1 from public.assessment_assignments aa
                      where aa.id = p_assessment_assignment and aa.institution_id = v_inst) then
    raise exception 'the assessment assignment does not belong to the enrolment''s institution';
  end if;
  -- INV-27 read from the other side: a CLOSED window starts nothing new
  if p_assessment_assignment is not null
     and exists (select 1 from public.assessment_assignments aa
                  where aa.id = p_assessment_assignment and aa.status = 'CLOSED') then
    raise exception 'this assessment assignment is CLOSED and starts no new session (INV-27)';
  end if;

  insert into public.assessment_sessions (
    person_id, institution_id, academic_period_id,           -- overwritten by the trigger
    enrollment_id, class_node_id, cohort_node_id, plp_release_id,
    assessment_definition_id, assessment_definition_version,
    engine_version, scoring_policy_version, evidence_channel,
    evidence_class,                                          -- overwritten by the trigger
    mode, authoritative_deadline, learning_assignment_id, assessment_assignment_id)
  values (
    '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000000',
    p_enrollment, p_class_node, p_cohort_node, p_plp_release,
    p_definition, v_version, p_engine_version, p_scoring_policy_version, p_channel,
    'OFFICIAL',
    p_mode, p_authoritative_deadline, p_learning_assignment, p_assessment_assignment)
  returning id into v_id;
  return v_id;
end $$;
CREATE OR REPLACE FUNCTION public.period_rollover(p_institution uuid, p_from_period uuid, p_to_period uuid, p_mapping jsonb) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
declare m record; v_count int := 0; v_n int; v_from uuid; v_to uuid;
begin
  if not public.has_scope('INSTITUTION_ADMIN', p_institution) then raise exception 'INSTITUTION_ADMIN required'; end if;
  if not exists (select 1 from public.academic_periods where id = p_to_period and institution_id = p_institution)
     or not exists (select 1 from public.academic_periods where id = p_from_period and institution_id = p_institution) then
    raise exception 'periods must belong to the institution';
  end if;
  for m in select (x->>'from_node')::uuid as from_node, (x->>'to_node')::uuid as to_node from jsonb_array_elements(p_mapping) x loop
    v_from := m.from_node; v_to := m.to_node;
    if not exists (select 1 from public.org_nodes where id = v_from and institution_id = p_institution and academic_period_id = p_from_period)
       or not exists (select 1 from public.org_nodes where id = v_to and institution_id = p_institution and academic_period_id = p_to_period) then
      raise exception 'mapping node not in the expected institution/period';
    end if;
    with closed as (
      update public.memberships mm set valid_to = now(), close_reason = 'PERIOD_ROLLOVER'
       where mm.node_id = v_from and mm.valid_to is null
         -- (1) recorded and not yet signed in (PENDING) moves with the class, as ACTIVE does
         and exists (select 1 from public.enrollments e where e.id = mm.enrollment_id and e.status in ('PENDING', 'ACTIVE'))
       returning mm.enrollment_id
    )
    insert into public.memberships (enrollment_id, node_id, academic_period_id)
    select c.enrollment_id, v_to, p_to_period from closed c;
    -- (2) every class's count, not the last one's
    get diagnostics v_n = row_count;
    v_count := v_count + v_n;
  end loop;
  perform public.audit_write('period.rollover', 'academic_periods', p_to_period::text, p_institution,
    jsonb_build_object('from_period', p_from_period, 'to_period', p_to_period, 'mapping', p_mapping));
  return v_count;
end $$;
CREATE OR REPLACE FUNCTION public.person_visible_to_me(p_person uuid) RETURNS boolean
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
declare v_me uuid;
begin
  if p_person is null then return false; end if;
  v_me := public.current_person_id();
  if v_me is null then return false; end if;
  if v_me = p_person then return true; end if;
  if public.is_system_admin() then return true; end if;
  if exists (select 1 from public.enrollments e
              where e.person_id = p_person and public.has_scope('INSTITUTION_ADMIN', e.institution_id)) then
    return true;
  end if;
  if exists (select 1 from public.memberships m join public.enrollments e on e.id = m.enrollment_id
              where e.person_id = p_person and public.can_on_node('CAN_VIEW_LEARNER_ROSTER', m.node_id)) then
    return true;
  end if;
  if exists (select 1 from public.portable_visibility pv
              where pv.person_id = p_person and public.has_scope('INSTITUTION_ADMIN', pv.institution_id)) then
    return true;
  end if;
  -- D-048: the school's own staff -- the school's number, or a role held there
  if exists (select 1 from public.institutional_identities ii
              where ii.person_id = p_person and public.has_scope('INSTITUTION_ADMIN', ii.institution_id)) then
    return true;
  end if;
  if exists (select 1 from public.role_assignments ra
              where ra.person_id = p_person and ra.role <> 'SYSTEM_ADMIN'
                and ra.revoked_at is null and now() < ra.valid_until
                and ra.institution_id is not null
                and public.has_scope('INSTITUTION_ADMIN', ra.institution_id)) then
    return true;
  end if;
  return false;
exception when others then return false;
end $$;
CREATE OR REPLACE FUNCTION public.recompute_result(p_session uuid, p_reason text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
declare v_prev public.assessment_results; v_e record; v_id uuid;
begin
  if not public.is_system_admin() then
    raise exception 'recomputation requires SYSTEM_ADMIN (INV-29: it is an audited act)';
  end if;
  if p_reason is null or btrim(p_reason) = '' then
    raise exception 'a recomputation records why it happened';
  end if;
  select * into v_prev from public.assessment_results
   where session_id = p_session and supersedes_result_id is null;
  if v_prev.id is null then raise exception 'session % has no root result to recompute', p_session; end if;

  select * into v_e from public.evaluate_session(p_session);
  insert into public.assessment_results (
    session_id, institution_id, person_id, evidence_class,
    engine_version, scoring_policy_version, mastery, per_domain,
    safety_gate_passed, delta_inputs, supersedes_result_id, recomputation_reason)
  values (
    p_session, '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000000', 'SYNTHETIC',
    public.engine_version(), public.scoring_policy_version(), v_e.mastery, v_e.per_domain,
    v_e.safety_gate_passed,
    jsonb_build_object('item_total', v_e.item_total, 'answered', v_e.answered,
                       'correct', v_e.correct, 'safety_total', v_e.safety_total,
                       'safety_correct', v_e.safety_correct),
    v_prev.id, p_reason)
  returning id into v_id;
  perform public.audit_write('assessment_result.recomputed', 'assessment_results', v_id::text,
    v_prev.institution_id,
    jsonb_build_object('session_id', p_session, 'supersedes', v_prev.id,
                       'new_result', v_id, 'reason', p_reason));
  return v_id;
end $$;
CREATE OR REPLACE FUNCTION public.record_integrity_review(p_signal uuid, p_decision text, p_note text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
declare v_actor uuid; sig record;
begin
  v_actor := public.current_person_id();
  if v_actor is null then raise exception 'recording an integrity review requires an authenticated actor'; end if;
  if p_decision not in ('NO_CONCERN', 'DISCUSSED_WITH_LEARNER', 'REFERRED_TO_INSTITUTION') then
    raise exception
      'an integrity review records what the reviewer did, not a verdict about the learner: unknown decision %',
      p_decision;
  end if;

  select s.id, s.institution_id, s.session_id, s.category into sig
    from public.integrity_signals s where s.id = p_signal;
  if sig.id is null then raise exception 'unknown integrity signal %', p_signal; end if;
  if not public.can_in_institution('CAN_REVIEW_INTEGRITY', sig.institution_id)
     -- BOB-46 (D-069(c)): a professional-learning signal reaches no school role
     or (public.session_is_professional(sig.session_id) and not public.is_system_admin()) then
    raise exception 'reviewing an integrity signal requires CAN_REVIEW_INTEGRITY in the owning institution';
  end if;

  -- No second log table (doc 16): the decision is an audit row, and the signal
  -- row itself is not mutated into carrying an outcome. W2.7: the row says it is
  -- this observation's decision (scope 'signal'), not its sitting's.
  perform public.audit_write('INTEGRITY_SIGNAL_REVIEWED', 'integrity_signals', p_signal::text,
    sig.institution_id,
    jsonb_build_object('session_id', sig.session_id, 'category', sig.category,
                       'decision', p_decision, 'note', p_note, 'scope', 'signal'));

  -- BOB-39: a referral is Management's to consider, so it reaches their queue.
  -- Same transaction: if the referral is refused, so is the review.
  if p_decision = 'REFERRED_TO_INSTITUTION' then
    perform public.refer_integrity_signal(p_signal, p_note);
  end if;
  return p_signal;
end $$;
CREATE OR REPLACE FUNCTION public.recovery_assist_school(p_person uuid) RETURNS uuid
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
  select mine.institution_id
    from public.role_assignments mine
    join public.org_nodes o on o.institution_id = mine.institution_id and o.kind = 'INSTITUTION'
   where mine.person_id = public.current_person_id() and p_person is distinct from public.current_person_id()
     and mine.role = 'INSTITUTION_ADMIN' and mine.revoked_at is null and now() >= mine.valid_from and now() < mine.valid_until
     and public.has_scope('INSTITUTION_ADMIN', o.id)
     and (exists (select 1 from public.institutional_identities ii
                   where ii.person_id = p_person and ii.institution_id = mine.institution_id)
          or exists (select 1 from public.role_assignments ra
                      where ra.person_id = p_person and ra.institution_id = mine.institution_id
                        and ra.role <> 'SYSTEM_ADMIN' and ra.revoked_at is null and now() < ra.valid_until)
          or exists (select 1 from public.enrollments e
                      where e.person_id = p_person and e.institution_id = mine.institution_id
                        and e.status in ('PENDING', 'ACTIVE')))
   order by mine.institution_id
   limit 1
$$;
CREATE OR REPLACE FUNCTION public.refer_integrity_signal(p_signal uuid, p_note text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
declare v_actor uuid; v_sig record; v_open uuid; v_id uuid;
begin
  v_actor := public.current_person_id();
  if v_actor is null or p_signal is null then
    raise exception 'referring an integrity signal requires an authenticated actor and a signal';
  end if;

  select s.id, s.institution_id, s.session_id, s.category,
         ses.class_node_id, ses.person_id, public.release_is_professional(ses.plp_release_id) as pd
    into v_sig
    from public.integrity_signals s
    join public.assessment_sessions ses on ses.id = s.session_id
   where s.id = p_signal;

  -- AUTHORIZATION BEFORE ANYTHING ELSE, and one message for every refusal, so
  -- an unknown signal and a signal in the next department are indistinguishable
  -- from outside. BOB-46: a professional-learning signal is one no school role
  -- may reach, so it is answered the same way.
  if v_sig.id is null or v_sig.class_node_id is null
     or not public.can_on_node('CAN_REVIEW_INTEGRITY', v_sig.class_node_id)
     or (v_sig.pd and not public.is_system_admin()) then
    raise exception 'referring an integrity signal requires CAN_REVIEW_INTEGRITY over the node it was observed in';
  end if;
  -- D-069(c), R8: recorded, never referred -- Admin platform included
  if v_sig.pd then perform public.professional_refuse('PD_SIGNAL_NOT_REFERRED'); end if;

  -- IDEMPOTENT. A second referral of the same still-open signal is the same
  -- referral; it returns the existing row and writes no second audit record,
  -- because nothing happened the first one did not already record.
  select d.id into v_open from public.management_decisions d
   where d.family = 'INTEGRITY_REFERRAL' and d.source_table = 'integrity_signals'
     and d.source_id = p_signal and d.state <> 'DECIDED';
  if v_open is not null then return v_open; end if;

  insert into public.management_decisions
    (family, institution_id, scope_node_id, subject_person_id, source_table, source_id,
     state, raised_by_person_id, raised_note)
  values ('INTEGRITY_REFERRAL', v_sig.institution_id, v_sig.class_node_id, v_sig.person_id,
          'integrity_signals', p_signal, 'AWAITING_REVIEW', v_actor, p_note)
  returning management_decisions.id into v_id;

  perform public.audit_write('management_decision.raised', 'management_decisions', v_id::text,
    v_sig.institution_id,
    jsonb_build_object('family', 'INTEGRITY_REFERRAL', 'source_table', 'integrity_signals',
                       'source_id', p_signal, 'scope_node_id', v_sig.class_node_id,
                       'category', v_sig.category));
  return v_id;
end $$;
CREATE OR REPLACE FUNCTION public.sebaran_murid_kelas(p_class uuid) RETURNS TABLE(mastery numeric, tier_key text)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
declare
  v_me uuid; v_inst uuid; v_jalur uuid[]; v_cat text; v_aud public.app_role[]; v_lowest text;
begin
  v_me := public.current_person_id();
  if v_me is null or p_class is null then return; end if;
  select n.institution_id, n.jalur into v_inst, v_jalur from public.org_nodes n where n.id = p_class and n.kind = 'CLASS'
     and n.member_kind = 'LEARNER';   -- a class of learners only (D-069: a PD class is never drawn by result)
  if v_inst is null then return; end if;
  v_cat := public.current_metric_catalogue();
  select array(select a from unnest(m.allowed_audiences) a where a <> 'STUDENT') into v_aud
    from public.metric_definitions m where m.catalogue_version = v_cat and m.metric_id = 'learner.result';
  if v_aud is null or cardinality(v_aud) = 0 then return; end if;
  if not exists (select 1 from public.role_assignments ra
                  where ra.person_id = v_me and ra.revoked_at is null
                    and now() >= ra.valid_from and now() < ra.valid_until
                    and ra.role = any (v_aud) and ra.scope_node_id is not null
                    and v_jalur @> array[ra.scope_node_id]) then
    return;
  end if;
  select t.tier_key into v_lowest from public.readiness_tiers t
   where t.catalogue_version = v_cat and t.min_mastery is not null order by t.min_mastery limit 1;
  if v_lowest is null then return; end if;
  begin
    perform set_config('pintar.metric_boundary_node', p_class::text, true);
    perform set_config('pintar.metric_boundary_person', '', true);
    return query
      with learner as (
        select distinct on (s.person_id) s.person_id, r.mastery, r.safety_gate_passed
          from public.scoped_official_sessions s
          join public.scoped_official_results r on r.session_id = s.id
         where s.institution_id = v_inst and s.class_node_id = p_class
           and s.mode = 'POST_TEST'::public.assessment_mode
         order by s.person_id, r.computed_at desc
      )
      select round(l.mastery, 4),
             coalesce((select t2.tier_key from public.readiness_tiers t2
                        where t2.catalogue_version = v_cat and t2.min_mastery is not null
                          and l.mastery >= t2.min_mastery and l.mastery < t2.max_mastery
                          and l.safety_gate_passed is not false
                        limit 1), v_lowest)
        from learner l
       order by 1, 2;
    perform set_config('pintar.metric_boundary_node', '', true);
  exception when others then
    perform set_config('pintar.metric_boundary_node', '', true);
    raise;
  end;
end $$;
CREATE OR REPLACE FUNCTION public.start_learning_session(p_assessment_assignment uuid) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
declare
  v_person uuid; v_ok boolean; v_reason text;
  v_aa public.assessment_assignments; v_la public.learning_assignments;
  v_d public.assessment_definitions; v_enrol uuid; v_session uuid;
  v_deadline timestamptz; v_cohort uuid; v_class uuid;
  v_release uuid; v_course uuid;
begin
  v_person := public.current_person_id();
  select e.ok, e.reason into v_ok, v_reason from public.may_start_assessment(p_assessment_assignment) e;
  if not v_ok then raise exception 'cannot start this assessment: % (INV-27)', v_reason; end if;

  select * into v_aa from public.assessment_assignments where id = p_assessment_assignment;
  select * into v_d  from public.assessment_definitions where id = v_aa.assessment_definition_id;

  -- CHANGED IN 0062. An ad-hoc assignment names no learning assignment by
  -- construction, and until then that refusal ended the Quick Assessment flow
  -- before a learner could answer anything. Everything else about the session
  -- is unchanged: same opener, same assembler, same provenance guard, same
  -- evidence derivation.
  if v_aa.learning_assignment_id is null and not coalesce(v_d.is_ad_hoc, false) then
    raise exception 'this phase starts learning-cycle sessions only; the assignment names no learning assignment';
  end if;
  if v_aa.learning_assignment_id is not null then
    select * into v_la from public.learning_assignments where id = v_aa.learning_assignment_id;
    if v_la.status <> 'ACTIVE' then
      raise exception 'the learning assignment is % and assigns nothing', v_la.status;
    end if;
  end if;

  select e.id into v_enrol from public.enrollments e
   where e.person_id = v_person and e.institution_id = v_aa.institution_id and e.status = 'ACTIVE'
   order by e.created_at desc limit 1;

  -- the learner's own class/cohort under the assigned node, for exposure
  -- cooling and cohort aggregates
  select (array_agg(n.id) filter (where n.kind = 'CLASS'))[1],
         (array_agg(n.id) filter (where n.kind = 'COHORT'))[1]
    into v_class, v_cohort
    from public.memberships m join public.org_nodes n on n.id = m.node_id
   where m.enrollment_id = v_enrol and m.valid_to is null
     and (n.id = v_aa.node_id or n.jalur @> array[v_aa.node_id]);

  if v_aa.closes_at is not null then v_deadline := v_aa.closes_at; end if;

  if v_aa.learning_assignment_id is not null then
    -- the release is the one the LEARNING assignment binds, never "the newest"
    v_release := v_la.plp_release_id;
    -- ADDED IN 0102. An ACTIVE assignment is not a licence to write evidence
    -- over content that can still be edited. The ad-hoc arm below has asked
    -- this question since 0063; this arm never did, so a school could answer
    -- its own unfinished chapter and the session's release binding -- the
    -- frozen answer to "what did this learner see" -- pinned nothing. Same
    -- rule, one predicate, both arms.
    if not public.release_starts_new_sessions(v_release) then
      raise exception
        'this assignment is over material that cannot begin a new attempt: the chapter it binds has not been published';
    end if;
  else
    -- ADDED IN 0062, CORRECTED IN 0063, NARROWED CORRECTLY IN 0064. An ad-hoc
    -- paper binds a module or a course, not a release, so the release is
    -- resolved from the content the definition is bound to: this school's own
    -- release of that course, or -- for canonical content -- one it holds an
    -- ACTIVE grant for.
    --
    -- `status in ('PUBLISHED','SUPERSEDED')` is "sealed, AND was published",
    -- which is exactly what the session binding needs and nothing more. Sealed,
    -- because `enforce_taught_content_immutable` only fires on a sealed course
    -- and an unsealed release therefore pins nothing (that was F1). Published,
    -- because doc 08 puts publication upstream of use -- so FROZEN, the one
    -- sealed status that was never published, stays refused.
    --
    -- SUPERSEDED is admitted deliberately. Release status gates new sessions
    -- nowhere else in this system, correction is never automatic here
    -- (ADR-0016), and the audited lever for "stop using this" is withdrawing the
    -- DISTRIBUTION, which `release_is_distributed_to` already enforces below.
    --
    -- That predicate is the same one the session guard re-applies immediately
    -- afterwards, so a grant withdrawn between launch and start refuses here
    -- rather than producing a session the guard would then reject.
    select coalesce(v_d.course_id, m.course_id) into v_course
      from public.modules m where m.id = v_d.module_id;
    if v_course is null then v_course := v_d.course_id; end if;
    select r.id into v_release
      from public.plp_releases r
     where r.course_id = v_course
       and r.status in ('PUBLISHED', 'SUPERSEDED')
       and (r.institution_id = v_aa.institution_id
         or public.release_is_distributed_to(r.id, v_aa.institution_id))
     -- a live PUBLISHED release wins over a SUPERSEDED one for the same course:
     -- `published_at desc nulls last` puts the later publication first.
     order by (r.institution_id = v_aa.institution_id) desc,
              (r.status = 'PUBLISHED') desc,
              r.published_at desc nulls last, r.created_at desc
     limit 1;
    if v_release is null then
      raise exception
        'this quick assessment is over material this school cannot use right now: either the chapter has not been published, or it is no longer shared with you';
    end if;
  end if;

  v_session := public.open_assessment_session(
    v_enrol, v_d.id, v_release, 'ONLINE', v_d.mode,
    public.engine_version(), public.scoring_policy_version(),
    v_class, v_cohort, v_deadline, v_aa.learning_assignment_id, v_aa.id);

  perform public.assemble_session(v_session);
  return v_session;
end $$;
CREATE OR REPLACE FUNCTION public.studio_home() RETURNS TABLE(bucket text, institution_id uuid, count integer)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
  with mine as (
    select i.id, i.name from public.institutions i
     where public.can_in_institution('CAN_DRAFT', i.id)
        or public.can_in_institution('CAN_REVIEW', i.id)
        or public.can_in_institution('CAN_ASSIGN_LEARNING', i.id)
  )
  select 'ACTION_REQUIRED', m.id, count(*)::int
    from mine m join public.courses c on c.institution_id = m.id
   where public.can_in_institution('CAN_DRAFT', m.id)
     and c.status in ('INGESTED','STRUCTURED','VALIDATION_FAILED')
     and not exists (select 1 from public.courses n where n.supersedes_course_id = c.id)
   group by m.id having count(*) > 0
  union all
  select 'AWAITING_MY_REVIEW', m.id, count(*)::int
    from mine m join public.courses c on c.institution_id = m.id
   where public.can_in_institution('CAN_REVIEW', m.id)
     and c.status = 'IN_REVIEW'
     and c.author_person_id is distinct from public.current_person_id()
     and not exists (select 1 from public.courses n where n.supersedes_course_id = c.id)
   group by m.id having count(*) > 0
  union all
  select 'BLOCKED', m.id, count(distinct f.course_id)::int
    from mine m join public.mcq_quality_findings f on f.institution_id = m.id
   where public.can_in_institution('CAN_DRAFT', m.id)
     and f.severity = 'ERROR' and f.acknowledged_at is null
     and not exists (select 1 from public.courses n where n.supersedes_course_id = f.course_id)
   group by m.id having count(*) > 0
  union all
  select 'QUESTION_HEALTH', m.id, count(*)::int
    from mine m join public.question_health q on q.institution_id = m.id
   where public.can_in_institution('CAN_REVIEW_QUESTION_HEALTH', m.id)
     and q.state = 'SIGNAL_RAISED'
   group by m.id having count(*) > 0
  union all
  select 'DISTRIBUTED_CANONICAL', d.institution_id, count(*)::int
    from public.release_distributions d
   where d.status = 'ACTIVE'
     and (public.can_in_institution('CAN_ASSIGN_LEARNING', d.institution_id)
       or public.can_in_institution('CAN_DRAFT', d.institution_id))
   group by d.institution_id having count(*) > 0
$$;
CREATE OR REPLACE FUNCTION public.submit_session(p_session uuid) RETURNS public.session_status
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
declare v_status public.session_status;
begin
  if not public.session_is_mine(p_session) then
    raise exception 'this session belongs to someone else';
  end if;
  v_status := public.session_enforce_deadline(p_session);
  if v_status = 'FINALIZED' then return v_status; end if;  -- already scored; nothing to submit
  if v_status = 'EXPIRED'   then return v_status; end if;  -- finalize scores what was answered
  if v_status = 'SUBMITTED' then return v_status; end if;
  if v_status = 'TERMINATED' then
    raise exception 'this session was ended and accepts no submission';
  end if;
  if v_status = 'PAUSED' then
    update public.assessment_sessions set status = 'IN_PROGRESS' where id = p_session;
  end if;
  update public.assessment_sessions set status = 'SUBMITTED' where id = p_session;
  return 'SUBMITTED';
end $$;
CREATE OR REPLACE FUNCTION public.terminate_session(p_session uuid, p_cause public.termination_cause, p_reason text) RETURNS public.session_status
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
declare v_actor uuid; v_s public.assessment_sessions; v_kept int;
begin
  v_actor := public.current_person_id();
  if v_actor is null then raise exception 'no person in this session'; end if;
  select * into v_s from public.assessment_sessions where id = p_session;
  if v_s.id is null then raise exception 'unknown session %', p_session; end if;
  if not public.can_in_institution('CAN_REVIEW_INTEGRITY', v_s.institution_id) then
    raise exception 'ending another person''s assessment requires CAN_REVIEW_INTEGRITY in that institution';
  end if;
  if p_reason is null or btrim(p_reason) = '' then
    raise exception 'a termination records why';
  end if;
  if v_s.status in ('FINALIZED','TERMINATED') then return v_s.status; end if;

  select count(*) into v_kept from public.responses where session_id = p_session;
  update public.assessment_sessions
     set status = 'TERMINATED', termination_cause = p_cause,
         termination_reason = p_reason, terminated_by_person_id = v_actor
   where id = p_session;

  perform public.audit_write('assessment_session.terminated', 'assessment_sessions', p_session::text,
    v_s.institution_id,
    jsonb_build_object('session_id', p_session, 'cause', p_cause, 'reason', p_reason,
                       'actor', v_actor, 'responses_retained', v_kept));
  return 'TERMINATED';
end $$;
CREATE OR REPLACE FUNCTION public.transfer_execute(p_transfer uuid) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
declare t record; v_new uuid;
begin
  select * into t from public.transfers where id = p_transfer for update;
  if t.id is null then raise exception 'transfer not found'; end if;
  if t.status <> 'AUTHORIZED' then raise exception 'transfer is not AUTHORIZED'; end if;
  if not (public.can_on_node('CAN_AUTHORIZE_TRANSFER', t.to_institution_id) or public.can_on_node('CAN_AUTHORIZE_TRANSFER', t.from_institution_id)) then
    raise exception 'not authorized to execute';
  end if;
  if t.to_academic_period_id is null then
    raise exception using errcode = 'PR040', detail = 'TRANSFER_PERIOD_MISSING',
      message = 'the receiving school has not chosen the school year';
  end if;
  insert into public.enrollments (person_id, institution_id, academic_period_id, programme_id, status)
  values (t.person_id, t.to_institution_id, t.to_academic_period_id, t.to_programme_id, 'ACTIVE') returning id into v_new;
  update public.memberships set valid_to = now(), close_reason = 'ENROLLMENT_ENDED'
   where enrollment_id = t.from_enrollment_id and valid_to is null;
  update public.enrollments set status = 'ENDED', end_reason = 'TRANSFERRED_OUT', valid_to = now()
   where id = t.from_enrollment_id;
  -- the placement at the receiving school, in the place it named on accepting
  if t.to_node_id is not null then
    insert into public.memberships (enrollment_id, node_id, academic_period_id)
    values (v_new, t.to_node_id, t.to_academic_period_id);
  end if;
  insert into public.portable_visibility (person_id, institution_id, transfer_id)
  values (t.person_id, t.to_institution_id, t.id)
  on conflict (person_id, institution_id) do update set transfer_id = excluded.transfer_id, granted_at = now();
  update public.transfers set status = 'EXECUTED', to_enrollment_id = v_new, executed_at = now() where id = p_transfer;
  return v_new;
end $$;
CREATE OR REPLACE FUNCTION public.tujuan_belum_tercapai(p_class uuid, p_learner uuid) RETURNS TABLE(objective_id uuid, statement text)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
declare
  v_me uuid; v_inst uuid; v_jalur uuid[]; v_cat text; v_aud public.app_role[];
begin
  v_me := public.current_person_id();
  if v_me is null or p_class is null or p_learner is null then return; end if;

  select n.institution_id, n.jalur into v_inst, v_jalur
    from public.org_nodes n where n.id = p_class and n.kind = 'CLASS';
  if v_inst is null then return; end if;

  -- the audiences the catalogue gives the learner's record, less the learner's own
  v_cat := public.current_metric_catalogue();
  select array(select a from unnest(m.allowed_audiences) a where a <> 'STUDENT') into v_aud
    from public.metric_definitions m
   where m.catalogue_version = v_cat and m.metric_id = 'learner.result';
  if v_aud is null or cardinality(v_aud) = 0 then return; end if;

  -- the reader stands over THIS class
  if not exists (select 1 from public.role_assignments ra
                  where ra.person_id = v_me
                    and ra.revoked_at is null
                    and now() >= ra.valid_from and now() < ra.valid_until
                    and ra.role = any (v_aud)
                    and ra.scope_node_id is not null
                    and v_jalur @> array[ra.scope_node_id]) then
    return;
  end if;

  -- the learner is in this class now
  if not exists (select 1 from public.memberships m
                   join public.enrollments e on e.id = m.enrollment_id
                  where m.node_id = p_class and m.valid_to is null
                    and e.person_id = p_learner and e.institution_id = v_inst
                    and e.status in ('PENDING', 'ACTIVE')) then
    return;
  end if;

  begin
    perform set_config('pintar.metric_boundary_node', p_class::text, true);
    perform set_config('pintar.metric_boundary_person', '', true);
    return query
      with latest as (
        -- each of the learner's official Uji Penguasaan attempts in this class, its latest result
        select distinct on (r.session_id) r.session_id, r.per_domain, s.assessment_definition_id, s.finalized_at
          from public.scoped_official_results r
          join public.scoped_official_sessions s on s.id = r.session_id
         where s.institution_id = v_inst
           and s.class_node_id = p_class
           and s.person_id = p_learner
           and s.mode = 'POST_TEST'::public.assessment_mode
         order by r.session_id, r.computed_at desc
      ), per_objective as (
        select kv.key as code,
               (kv.value ->> 'penguasaan')::numeric as penguasaan,
               a.pass_mark,
               l.finalized_at, l.session_id,
               (select o.id
                  from public.assessment_definitions ad
                  join public.lessons le on le.module_id = ad.module_id
                  join public.learning_objectives o on o.lesson_id = le.id
                 where ad.id = l.assessment_definition_id and o.code = kv.key
                 order by le.ordinal, o.id
                 limit 1) as objective_id
          from latest l
          join public.assessment_sessions a on a.id = l.session_id,
               lateral jsonb_each(coalesce(l.per_domain, '{}'::jsonb)) kv(key, value)
         where jsonb_typeof(kv.value) = 'object'
           and jsonb_typeof(kv.value -> 'penguasaan') = 'number'
      ), newest as (
        -- the learner's most recent attempt that recorded each objective
        select distinct on (coalesce(p.objective_id::text, p.code)) p.*
          from per_objective p
         order by coalesce(p.objective_id::text, p.code), p.finalized_at desc nulls last, p.session_id
      )
      select x.objective_id, coalesce(lo.statement, x.code) as statement
        from newest x
        left join public.learning_objectives lo on lo.id = x.objective_id
       where x.pass_mark is not null and x.penguasaan < x.pass_mark
       order by coalesce(lo.statement, x.code), x.code;
    perform set_config('pintar.metric_boundary_node', '', true);
  exception when others then
    perform set_config('pintar.metric_boundary_node', '', true);
    raise;
  end;
end $$;
CREATE OR REPLACE FUNCTION public.verify_certificate(p_token text) RETURNS TABLE(pass boolean, predikat text, institution text, date text, validity text)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
declare v_c public.certificates; v_inst text;
begin
  if p_token is null or length(p_token) < 43 then return; end if;
  select * into v_c from public.certificates c where c.verification_token = p_token;
  -- an unknown token yields no row at all: no existence oracle, no distinguishable error
  if v_c.id is null then return; end if;
  if v_c.status = 'ELIGIBLE' then return; end if;   -- not yet issued is not public
  select i.name into v_inst from public.institutions i where i.id = v_c.institution_id;
  pass       := (v_c.canonical_payload -> 'result' ->> 'passed')::boolean;
  predikat   := v_c.canonical_payload -> 'result' ->> 'predikat';
  -- CR-02: the school's name as issued; a certificate issued before the seal reads it as before
  institution:= coalesce(v_c.institution_as_issued, v_inst);
  date       := left(v_c.issued_at_iso, 10);
  validity   := case v_c.status when 'ISSUED' then 'BERLAKU'
                                when 'REVOKED' then 'DICABUT'
                                when 'SUPERSEDED' then 'DIGANTIKAN' end;
  return next;
end $$;

-- 9. table grants 201-224 narrowed, as 200 had them
revoke all on table public.enrollments from anon, authenticated;
GRANT ALL ON TABLE public.enrollments TO service_role;
GRANT SELECT,INSERT,UPDATE ON TABLE public.enrollments TO authenticated;
revoke all on table public.memberships from anon, authenticated;
GRANT ALL ON TABLE public.memberships TO service_role;
GRANT SELECT,INSERT,UPDATE ON TABLE public.memberships TO authenticated;
revoke all on function public.period_rollover(p_institution uuid, p_from_period uuid, p_to_period uuid, p_mapping jsonb) from public, anon, authenticated;
REVOKE ALL ON FUNCTION public.period_rollover(p_institution uuid, p_from_period uuid, p_to_period uuid, p_mapping jsonb) FROM PUBLIC;
GRANT ALL ON FUNCTION public.period_rollover(p_institution uuid, p_from_period uuid, p_to_period uuid, p_mapping jsonb) TO service_role;
GRANT ALL ON FUNCTION public.period_rollover(p_institution uuid, p_from_period uuid, p_to_period uuid, p_mapping jsonb) TO authenticated;

-- 10. reference rows of 201-224. The catalogue's guards are lifted for these statements only, inside this transaction
delete from public.client_rpc_registry where function_name in ('akhiri_pendaftaran', 'akhiri_penugasan', 'akhiri_penugasan_pratinjau', 'akhiri_tugas_staf', 'aktifkan_kembali_akun', 'akun_keadaan', 'atur_zona_waktu_sekolah', 'boleh_atas_sesi', 'boleh_koreksi_sesi', 'buka_kembali_akun', 'daftarkan_kembali', 'hapus_data_pribadi', 'integrity_signals_waiting_elsewhere', 'jawaban_untuk_pemeriksaan', 'judul_materi_kelas', 'kenaikan_hasil', 'kenaikan_rencana', 'kenaikan_tetapkan', 'minta_akun', 'move_learner_to_class', 'murid_keluar', 'murid_tanpa_kelas', 'my_learning_history', 'peran_orang', 'permintaan_akun_antrean', 'permintaan_akun_saya', 'riwayat_penugasan_kelas', 'sertifikat_koreksi_pratinjau', 'sertifikat_koreksi_siapkan', 'sesi_saya_dihitung_ulang', 'studio_langkah_terbitan', 'tangguhkan_akun', 'target_kelas', 'tempatkan_murid', 'ubah_peran');
insert into public.client_rpc_registry (note, exposure, function_name, authorization_kind, authorization_requirement) select 'INV-23 rollover; INSTITUTION_ADMIN', 'STAFF', 'period_rollover', 'SCOPE', 'INSTITUTION_ADMIN' where not exists (select 1 from public.client_rpc_registry where function_name = 'period_rollover');
delete from public.public_surface_registry where surface in ('reopen_request', 'reopen_request_api');
delete from public.record_class_registry where table_name in ('account_requests', 'person_suspensions');
delete from public.metric_calculator_scope where calculation_key in ('class_chapter_mastery');
alter table public.metric_definitions disable trigger metric_definitions_immutable;
alter table public.readiness_tiers disable trigger readiness_tiers_immutable;
alter table public.metric_sources disable trigger metric_sources_immutable;
alter table public.question_health_thresholds disable trigger question_health_thresholds_immutable;
alter table public.metric_catalogue disable trigger metric_catalogue_header_guard;
delete from public.metric_definitions where catalogue_version in ('MC-10', 'MC-9');
delete from public.readiness_tiers where catalogue_version in ('MC-10', 'MC-9');
delete from public.metric_sources where catalogue_version in ('MC-10', 'MC-9');
delete from public.question_health_thresholds where catalogue_version in ('MC-10', 'MC-9');
update public.metric_catalogue set superseded_by = null where version = 'MC-8';
delete from public.metric_catalogue where version in ('MC-10', 'MC-9');
alter table public.metric_definitions enable trigger metric_definitions_immutable;
alter table public.readiness_tiers enable trigger readiness_tiers_immutable;
alter table public.metric_sources enable trigger metric_sources_immutable;
alter table public.question_health_thresholds enable trigger question_health_thresholds_immutable;
alter table public.metric_catalogue enable trigger metric_catalogue_header_guard;

-- 11. the bookkeeping, so that `supabase migration up` re-applies 201-224 cleanly
delete from supabase_migrations.schema_migrations where version in ('20270110100000', '20270111100000', '20270112100000', '20270112110000', '20270112120000', '20270112130000', '20270112140000', '20270112150000', '20270112160000', '20270112170000', '20270112180000', '20270112190000', '20270112195000', '20270112200000', '20270112210000', '20270112220000', '20270112230000', '20270113100000', '20270113110000', '20270113120000', '20270113130000', '20270113140000', '20270113150000', '20270113160000');

-- 12. the checks
do $$
begin
  if (select count(*) from supabase_migrations.schema_migrations) <> 200 then raise exception 'ROLLBACK-201-224: not 200 migrations'; end if;
  if exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname in ('akhiri_pendaftaran', 'akhiri_penugasan', 'akhiri_penugasan_pratinjau', 'akhiri_tugas_staf', 'aktifkan_kembali_akun', 'akun_keadaan', 'akun_kunci', 'akun_tolak', 'atur_zona_waktu_sekolah', 'audit_run_parent_check', 'boleh_akhiri_penugasan', 'boleh_atas_sesi', 'boleh_koreksi_sesi', 'buka_kembali_akun', 'calc_class_chapter_mastery', 'daftarkan_kembali', 'dari_penugasan_ditarik', 'ditarik_dikecualikan', 'enrollments_programme_alone', 'hapus_data_pribadi', 'hari_sekolah', 'integrity_signals_waiting_elsewhere', 'jawaban_untuk_pemeriksaan', 'judul_materi_kelas', 'kenaikan_guru', 'kenaikan_hasil', 'kenaikan_populasi', 'kenaikan_rencana', 'kenaikan_tetapkan', 'minta_akun', 'minta_buka_kembali', 'murid_keluar', 'murid_sudah_keluar', 'murid_tanpa_kelas', 'my_learning_history', 'orang_ditangguhkan', 'penugasan_sesi', 'penugasan_tolak', 'peran_orang', 'permintaan_akun_antrean', 'permintaan_akun_saya', 'riwayat_penugasan_kelas', 'sekolah_memegang', 'sertifikat_koreksi_kini', 'sertifikat_koreksi_pratinjau', 'sertifikat_koreksi_segel', 'sertifikat_koreksi_siapkan', 'sertifikat_koreksi_tolak', 'sesi_dari_penugasan_ditarik', 'sesi_ditarik_dikecualikan', 'sesi_saya_dihitung_ulang', 'sesi_tempat', 'sesi_tempat_koreksi', 'staf_antrean', 'staf_boleh', 'staf_peran_hidup', 'staf_sidik', 'staf_tanggung_jawab', 'staf_tolak', 'studio_langkah_terbitan', 'tangguhkan_akun', 'target_kelas', 'tempatkan_murid', 'tutup_asesmen_terbuka', 'ubah_peran', 'zona_sekolah')) then
    raise exception 'ROLLBACK-201-224: a function of 201-224 is still present';
  end if;
  if to_regclass('public.account_requests') is not null or to_regclass('public.person_suspensions') is not null then raise exception 'ROLLBACK-201-224: a table of 201-224 is still present'; end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and (table_name, column_name) in (('audit_log','run_id'),('institutions','zona_waktu'),('certificates','correction_reason'),('certificates','corrected_by_person_id'))) then
    raise exception 'ROLLBACK-201-224: a column of 201-224 is still present';
  end if;
  if (select count(*) from public.metric_catalogue where superseded_by is null) <> 1 or not exists (select 1 from public.metric_catalogue where version = 'MC-8' and superseded_by is null) then
    raise exception 'ROLLBACK-201-224: the catalogue in force is not MC-8';
  end if;
end $$;

commit;
