-- FABLE-33 · KESETIAAN #6, #7, #18, #21 (owner GO, 7 Nov): THE FOUR REPORT READS, measured against
-- supabase/migrations/20270103100000_the_report_reads_daisy_asked_for.sql and the calculators they must agree with.
--
--   F33-S01  sebaran_murid_kelas: in a class of its own, the class's teacher gets one row per learner with an official
--            Uji Penguasaan in the class (a learner who has since left included), each band as
--            calc_class_readiness_distribution counts it (the per-band counts are equal), and only two columns
--            (mastery, band): no identity. A Kepala departemen over the school, a Dekan, a teacher of another class and
--            an anonymous caller get nothing.
--   F33-K01  kenaikan_awal_akhir: in a class with six learners each holding a (Pemetaan Awal, Uji Penguasaan) pair of one
--            chapter, and one learner whose two tests are of different chapters, the pair's akhir − awal equals
--            calc_class_net_gain's value, over the same pairs (6) and people (6); the Dekan (a net_gain audience) is
--            given the same; a teacher of another class nothing; and a class with four such pairs (under the minimum
--            of five) answers nothing, so the page says «Belum dapat dibandingkan».
--   F33-R01  kesiapan_kelas_per_mapel: for the Dekan of the demonstration school, every (subject, class) row equals an
--            independent count from the official sessions (learners with an official Uji Penguasaan of the subject's
--            chapters in the class), the population is exactly the active classes with an active academic assignment
--            of the subject, and «needed» is the class distribution's minimum; the class's teacher and a Dekan of
--            another school get nothing.
--   F33-A01  kelas_dikecualikan_kartu: in a class of its own, a member with an account is AKUN, a member with no
--            account and a staff role is STAF, a member with neither is not counted (they are offered a card), a
--            learner row of an import waiting for its go is PENDATAAN, and neither a completed import's row, a staff
--            row nor a row naming a learner already placed is counted; each person once. A teacher gets nothing.
--   F33-P01  D-069: the facilitator of a professional-learning class (participants, not learners) whose participants
--            hold official results, one in the lowest band, is given no name by murid_perlu_penguatan and no dot by
--            sebaran_murid_kelas: a PD class is never named or drawn by result.
--
-- EVERY ROW IS ROLLED BACK.

create schema if not exists selftest;

do $$
begin
  if to_regprocedure('selftest.as_user_uid(uuid)') is null or to_regprocedure('selftest.f11_user(text,public.app_role,uuid)') is null
     or to_regprocedure('selftest.as_owner()') is null or to_regprocedure('selftest.as_anon()') is null then
    raise exception 'apply fable01, fable06 and fable11.sql before fable33.sql: the helpers are missing';
  end if;
end $$;

-- one official result for a learner in a class, copied from a real finalized session of the tenant
create or replace function selftest.f33_sesi(p_tmpl uuid, p_person uuid, p_class uuid, p_release uuid, p_mode public.assessment_mode,
                                             p_mastery numeric, p_gate boolean)
returns void language plpgsql set search_path = public, pg_temp as $$
declare t record; v_e uuid; v_new uuid := gen_random_uuid();
begin
  select s.* into t from public.assessment_sessions s where s.id = p_tmpl;
  select e.id into v_e from public.enrollments e where e.person_id = p_person and e.institution_id = t.institution_id limit 1;
  insert into public.assessment_sessions
    (id, person_id, institution_id, enrollment_id, academic_period_id, class_node_id, cohort_node_id,
     plp_release_id, assessment_definition_id, assessment_definition_version, engine_version,
     scoring_policy_version, evidence_channel, evidence_class, mode, status, shuffle_seed,
     started_at, submitted_at, finalized_at, deadline_extended_count)
  values (v_new, p_person, t.institution_id, v_e, t.academic_period_id, p_class, t.cohort_node_id, coalesce(p_release, t.plp_release_id),
          t.assessment_definition_id, t.assessment_definition_version, t.engine_version, t.scoring_policy_version,
          t.evidence_channel, t.evidence_class, p_mode, 'CREATED', t.shuffle_seed, t.started_at, t.submitted_at, t.finalized_at, 0);
  update public.assessment_sessions set status = 'IN_PROGRESS' where id = v_new;
  update public.assessment_sessions set status = 'SUBMITTED'   where id = v_new;
  update public.assessment_sessions set status = 'FINALIZED'   where id = v_new;
  insert into public.assessment_results
    (id, session_id, institution_id, person_id, evidence_class, engine_version, scoring_policy_version,
     mastery, per_domain, safety_gate_passed, delta_inputs, computed_at)
  select gen_random_uuid(), v_new, x.institution_id, p_person, x.evidence_class, x.engine_version, x.scoring_policy_version,
         p_mastery, x.per_domain, p_gate, x.delta_inputs, now()
    from public.assessment_results x where x.session_id = p_tmpl limit 1;
end $$;
revoke all on function selftest.f33_sesi(uuid, uuid, uuid, uuid, public.assessment_mode, numeric, boolean) from public;

-- a learner placed in a class (a new person; an account too when asked)
create or replace function selftest.f33_murid(p_tmpl uuid, p_class uuid, p_nama text, p_akun text default null)
returns uuid language plpgsql set search_path = public, pg_temp as $$
declare t record; v_p uuid; v_e uuid; v_uid uuid;
begin
  select s.* into t from public.assessment_sessions s where s.id = p_tmpl;
  if p_akun is not null then
    v_uid := selftest.f11_user(p_akun, null, null);
    select a.person_id into v_p from public.accounts a where a.auth_user_id = v_uid;
    update public.persons set display_name = p_nama where id = v_p;
  else
    insert into public.persons (display_name) values (p_nama) returning id into v_p;
  end if;
  insert into public.enrollments (person_id, institution_id, academic_period_id, programme_id, status)
  select v_p, t.institution_id, e.academic_period_id, e.programme_id, 'ACTIVE' from public.enrollments e where e.id = t.enrollment_id
  returning id into v_e;
  insert into public.memberships (enrollment_id, node_id, academic_period_id) values (v_e, p_class, t.academic_period_id);
  return v_p;
end $$;
revoke all on function selftest.f33_murid(uuid, uuid, text, text) from public;

create or replace function selftest.run_fable33()
returns table (id text, area text, ok boolean, detail text)
language plpgsql set search_path = public, pg_temp as $$
declare
  v_tag text := to_char(clock_timestamp(), 'HH24MISSUS'); v_fatal text := '';
  s01 text[] := array[]::text[]; k01 text[] := array[]::text[]; r01 text[] := array[]::text[]; a01 text[] := array[]::text[];
  v_inst uuid; v_tmpl record; v_cat text; v_rel2 uuid; v_kls uuid; v_kls2 uuid; v_kls3 uuid; v_kls4 uuid;
  v_guru uuid; v_guru2 uuid; v_kadep uuid; v_dekan uuid; v_dekan_x uuid; v_x uuid; v_adm uuid;
  m record; v_p uuid; v_n int; v_n2 int; v_calc jsonb; v_cols int; v_job uuid; v_err text;
  v_awal numeric; v_akhir numeric; v_pas int; v_org int; v_val numeric; v_beda int;
  p01 text[] := array[]::text[]; v_pd uuid; v_pdk uuid; v_fas uuid; v_uidp uuid;
begin
  perform selftest.as_owner();
  begin
    v_cat := public.current_metric_catalogue();
    select i.id into v_inst from public.institutions i where i.slug = 'pintar-human-evaluation';
    if v_inst is null then raise exception 'the demonstration tenant is absent'; end if;
    select s.* into v_tmpl from public.assessment_sessions s
     where s.institution_id = v_inst and s.status = 'FINALIZED' and s.mode = 'POST_TEST'
       and exists (select 1 from public.official_sessions o where o.id = s.id)
       and exists (select 1 from public.assessment_results x where x.session_id = s.id)
     order by s.id limit 1;
    if v_tmpl.id is null then raise exception 'no finalized official Uji Penguasaan to copy'; end if;
    insert into public.plp_releases (institution_id, course_id, version_label)
    select p.institution_id, p.course_id, '33.0.' || (extract(epoch from clock_timestamp())::bigint % 100000)::text
      from public.plp_releases p where p.id = v_tmpl.plp_release_id returning plp_releases.id into v_rel2;
    for m in select * from (values (1), (2), (3), (4)) x(i) loop
      insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
      select v_inst, o.parent_id, 'CLASS', 'Kelas F33-' || m.i || ' ' || v_tag, o.academic_period_id
        from public.org_nodes o where o.id = v_tmpl.class_node_id returning org_nodes.id into v_p;
      if m.i = 1 then v_kls := v_p; elsif m.i = 2 then v_kls2 := v_p; elsif m.i = 3 then v_kls3 := v_p; else v_kls4 := v_p; end if;
    end loop;
    perform set_config('app.seed_intent', 'synthetic', true);
    insert into public.institutions (name, slug, is_synthetic, is_active)
    values ('Sekolah F33 tetangga ' || v_tag, 'f33x-' || v_tag, true, true) returning institutions.id into v_x;
    perform set_config('app.seed_intent', '', true);
    v_guru    := selftest.f11_user('f33-guru-'  || v_tag || '@local.invalid', 'EDUCATOR', v_kls);
    v_guru2   := selftest.f11_user('f33-guru2-' || v_tag || '@local.invalid', 'EDUCATOR', v_kls4);
    v_kadep   := selftest.f11_user('f33-kadep-' || v_tag || '@local.invalid', 'HEAD_OF_DEPARTMENT', v_inst);
    v_dekan   := selftest.f11_user('f33-dekan-' || v_tag || '@local.invalid', 'DEAN', v_inst);
    v_dekan_x := selftest.f11_user('f33-dekanx-' || v_tag || '@local.invalid', 'DEAN', v_x);
    v_adm     := selftest.f11_user('f33-adm-'   || v_tag || '@local.invalid', 'INSTITUTION_ADMIN', v_inst);

    -- ═════════════════════════════════════════════════════════════════════ F33-S01 the score line
    begin
      for m in select * from (values ('A', 0.40, true), ('B', 0.70, true), ('C', 0.90, false), ('D', 0.85, true), ('E', 0.65, true), ('G', 0.35, true)) x(w, ms, gate) loop
        v_p := selftest.f33_murid(v_tmpl.id, v_kls, 'Murid F33 ' || m.w || ' ' || v_tag);
        perform selftest.f33_sesi(v_tmpl.id, v_p, v_kls, null, 'POST_TEST', m.ms, m.gate);
        if m.w = 'G' then update public.memberships set valid_to = now(), close_reason = 'MOVED' where node_id = v_kls
          and enrollment_id in (select e.id from public.enrollments e where e.person_id = v_p); end if;
      end loop;
      perform selftest.f33_murid(v_tmpl.id, v_kls, 'Murid F33 F ' || v_tag);   -- placed, no Uji Penguasaan: no dot
      perform set_config('pintar.metric_boundary_node', v_kls::text, true);
      v_calc := public.calc_class_readiness_distribution(v_kls, v_inst, v_cat);
      perform set_config('pintar.metric_boundary_node', '', true);
      perform selftest.as_user_uid(v_guru);
      create temp table f33_titik on commit drop as select * from public.sebaran_murid_kelas(v_kls);
      perform selftest.as_owner();
      select count(*) into v_n from f33_titik;
      if v_n <> 6 then s01 := s01 || format('the teacher was given %s dot(s), not the 6 learners with a result here', v_n); end if;
      select count(*) into v_beda from (
        select k as tier_key, (v_calc -> 'value' ->> k)::int as n from jsonb_object_keys(v_calc -> 'value') k
         where k in (select t.tier_key from readiness_tiers t where t.catalogue_version = v_cat and t.min_mastery is not null)) c
        full join (select tier_key, count(*)::int as n from f33_titik group by tier_key) d using (tier_key)
       where c.n is distinct from d.n;
      if v_beda <> 0 then s01 := s01 || format('%s band(s) count differently from calc_class_readiness_distribution', v_beda); end if;
      select count(*) into v_cols from information_schema.parameters pa join information_schema.routines rt on rt.specific_name = pa.specific_name
       where rt.routine_schema = 'public' and rt.routine_name = 'sebaran_murid_kelas' and pa.parameter_mode = 'OUT';
      if v_cols <> 2 then s01 := s01 || format('the answer has %s columns, not mastery and band', v_cols); end if;
      for m in select * from (values (v_kadep, 'a Kepala departemen over the school'), (v_dekan, 'the Dekan'), (v_guru2, 'a teacher of another class')) x(u, siapa) loop
        perform selftest.as_user_uid(m.u);
        select count(*) into v_n from public.sebaran_murid_kelas(v_kls);
        perform selftest.as_owner();
        if v_n <> 0 then s01 := s01 || format('%s was given %s dot(s)', m.siapa, v_n); end if;
      end loop;
      perform selftest.as_anon();
      v_err := null;
      begin select count(*) into v_n from public.sebaran_murid_kelas(v_kls); v_err := 'answered'; exception when others then null; end;
      perform selftest.as_owner();
      if v_err is not null then s01 := s01 || 'an anonymous caller reached it'::text; end if;
    exception when others then perform selftest.as_owner(); s01 := s01 || ('threw: ' || sqlerrm);
    end;

    -- ═════════════════════════════════════════════════════════════════════ F33-K01 the before → after pair
    begin
      for m in select * from (values (1, 0.30, 0.80), (2, 0.50, 0.70), (3, 0.20, 0.65), (4, 0.60, 0.75), (5, 0.40, 0.90), (6, 0.55, 0.60)) x(i, pre, post) loop
        v_p := selftest.f33_murid(v_tmpl.id, v_kls2, 'Murid F33 K' || m.i || ' ' || v_tag);
        perform selftest.f33_sesi(v_tmpl.id, v_p, v_kls2, null, 'PRE_TEST', m.pre, true);
        perform selftest.f33_sesi(v_tmpl.id, v_p, v_kls2, null, 'POST_TEST', m.post, true);
        if m.i <= 4 then
          v_p := selftest.f33_murid(v_tmpl.id, v_kls3, 'Murid F33 L' || m.i || ' ' || v_tag);
          perform selftest.f33_sesi(v_tmpl.id, v_p, v_kls3, null, 'PRE_TEST', m.pre, true);
          perform selftest.f33_sesi(v_tmpl.id, v_p, v_kls3, null, 'POST_TEST', m.post, true);
        end if;
      end loop;
      -- two tests of different chapters: not a pair
      v_p := selftest.f33_murid(v_tmpl.id, v_kls2, 'Murid F33 K7 ' || v_tag);
      perform selftest.f33_sesi(v_tmpl.id, v_p, v_kls2, null, 'PRE_TEST', 0.10, true);
      perform selftest.f33_sesi(v_tmpl.id, v_p, v_kls2, v_rel2, 'POST_TEST', 0.95, true);
      v_guru2 := selftest.f11_user('f33-guru3-' || v_tag || '@local.invalid', 'EDUCATOR', v_kls2);  -- the class's teacher
      perform set_config('pintar.metric_boundary_node', v_kls2::text, true);
      v_val := (public.calc_class_net_gain(v_kls2, v_inst, v_cat) ->> 'value')::numeric;
      perform set_config('pintar.metric_boundary_node', '', true);
      perform selftest.as_user_uid(v_guru2);
      select k.awal, k.akhir, k.pasangan, k.orang into v_awal, v_akhir, v_pas, v_org from public.kenaikan_awal_akhir(v_kls2) k;
      perform selftest.as_owner();
      if v_awal is null then k01 := k01 || 'the class''s teacher was given no pair'::text;
      else
        if round(v_akhir - v_awal, 4) is distinct from v_val then
          k01 := k01 || format('akhir − awal is %s, not Kenaikan''s %s', round(v_akhir - v_awal, 4), v_val);
        end if;
        if v_pas <> 6 or v_org <> 6 then k01 := k01 || format('the pair is over %s pair(s) of %s people, not 6 and 6', v_pas, v_org); end if;
        if v_awal is distinct from 0.4250 or v_akhir is distinct from 0.7333 then
          k01 := k01 || format('the pair reads %s → %s, not 0.4250 → 0.7333', v_awal, v_akhir);
        end if;
      end if;
      perform selftest.as_user_uid(v_dekan);
      select count(*) into v_n from public.kenaikan_awal_akhir(v_kls2);
      perform selftest.as_owner();
      if v_n <> 1 then k01 := k01 || 'the Dekan (a Kenaikan audience) was not given the pair'::text; end if;
      perform selftest.as_user_uid(v_guru);
      select count(*) into v_n from public.kenaikan_awal_akhir(v_kls2);
      perform selftest.as_owner();
      if v_n <> 0 then k01 := k01 || 'a teacher of another class was given the pair'::text; end if;
      perform selftest.as_user_uid(v_dekan);
      select count(*) into v_n from public.kenaikan_awal_akhir(v_kls3);
      perform selftest.as_owner();
      if v_n <> 0 then k01 := k01 || 'a class under the minimum (4 pairs) was given a pair'::text; end if;
    exception when others then perform selftest.as_owner(); k01 := k01 || ('threw: ' || sqlerrm);
    end;

    -- ═════════════════════════════════════════════════════════════════════ F33-R01 readiness per subject
    begin
      -- a class of its own given the chapter's course (its six learners above each hold a result; learner A a second)
      -- by the school's administrator, as the product assigns (CAN_ASSIGN_LEARNING)
      perform set_config('request.jwt.claims', json_build_object('sub', v_adm, 'role', 'authenticated')::text, true);
      perform set_config('request.jwt.claim.sub', v_adm::text, true);
      insert into public.learning_assignments (institution_id, plp_release_id, course_id, node_id, academic_period_id, status, assigned_by_person_id)
      select la.institution_id, la.plp_release_id, la.course_id, v_kls, la.academic_period_id, 'DRAFT', (select a.person_id from public.accounts a where a.auth_user_id = v_adm)
        from public.learning_assignments la join public.plp_releases pr on pr.id = v_tmpl.plp_release_id
       where la.course_id = pr.course_id and la.institution_id = v_inst order by la.created_at limit 1;
      update public.learning_assignments set status = 'ACTIVE' where node_id = v_kls and status = 'DRAFT';
      perform selftest.as_owner();
      perform selftest.f33_sesi(v_tmpl.id, (select e.person_id from public.enrollments e join public.persons p on p.id = e.person_id
                                             where p.display_name = 'Murid F33 A ' || v_tag limit 1), v_kls, null, 'POST_TEST', 0.45, true);
      perform selftest.as_user_uid(v_dekan);
      create temp table f33_siap on commit drop as select * from public.kesiapan_kelas_per_mapel(v_inst);
      perform selftest.as_owner();
      select count(*) into v_n from f33_siap;
      if v_n = 0 then r01 := r01 || 'the Dekan was given no row'::text; end if;
      -- the population, computed independently
      select count(*) into v_beda from (
        select distinct c.subject, k.id from public.org_nodes k
          join public.learning_assignments la on la.status = 'ACTIVE' and k.jalur @> array[la.node_id]
          join public.courses c on c.id = la.course_id and c.learning_context = 'ACADEMIC'
         where k.institution_id = v_inst and k.kind = 'CLASS' and k.is_active and coalesce(btrim(c.subject), '') <> '') a
        full join (select subject, class_id as id from f33_siap) b using (subject, id)
       where a.id is null or b.id is null;
      if v_beda <> 0 then r01 := r01 || format('%s (subject, class) row(s) differ from the active academic assignments', v_beda); end if;
      -- «have», computed independently from the official sessions
      select count(*) into v_beda from f33_siap f
       where f.have is distinct from (select count(distinct s.person_id) from public.official_sessions s
                                        join public.official_results r on r.session_id = s.id
                                        join public.plp_releases pr on pr.id = s.plp_release_id
                                        join public.courses c on c.id = pr.course_id
                                       where s.institution_id = v_inst and s.class_node_id = f.class_id and s.mode = 'POST_TEST'
                                         and c.subject = f.subject)
          or f.needed is distinct from (select md.minimum_sample from public.metric_definitions md
                                         where md.catalogue_version = v_cat and md.metric_id = 'class.readiness_distribution');
      if v_beda <> 0 then r01 := r01 || format('%s row(s) count a different «have» or «needed»', v_beda); end if;
      select f.have into v_n from f33_siap f where f.class_id = v_kls;
      if v_n is distinct from 6 then r01 := r01 || format('the class of its own counts %s, not its 6 learners (one with two results)', coalesce(v_n::text, 'no row')); end if;
      for m in select * from (values (v_guru, 'the class''s teacher'), (v_dekan_x, 'a Dekan of another school')) x(u, siapa) loop
        perform selftest.as_user_uid(m.u);
        select count(*) into v_n from public.kesiapan_kelas_per_mapel(v_inst);
        perform selftest.as_owner();
        if v_n <> 0 then r01 := r01 || format('%s was given %s row(s)', m.siapa, v_n); end if;
      end loop;
    exception when others then perform selftest.as_owner(); r01 := r01 || ('threw: ' || sqlerrm);
    end;

    -- ═════════════════════════════════════════════════════════════════════ F33-A01 who is not offered a card
    begin
      perform selftest.f33_murid(v_tmpl.id, v_kls4, 'Murid F33 berakun ' || v_tag, 'f33-akun-' || v_tag || '@local.invalid');
      v_p := selftest.f33_murid(v_tmpl.id, v_kls4, 'Staf F33 ' || v_tag);
      perform set_config('app.seed_intent', 'synthetic', true);
      insert into public.role_assignments (person_id, role, scope_node_id, valid_from, valid_until)
      values (v_p, 'EDUCATOR', v_kls4, now() - interval '1 day', now() + interval '30 days');
      perform set_config('app.seed_intent', '', true);
      perform selftest.f33_murid(v_tmpl.id, v_kls4, 'Murid F33 menunggu ' || v_tag);          -- offered a card: not counted
      v_n2 := 0;
      insert into public.import_jobs (institution_id, created_by_person_id, state, row_count)
      select v_inst, a.person_id, 'AWAITING_CONFIRMATION', 4 from public.accounts a where a.auth_user_id = v_adm returning import_jobs.id into v_job;
      insert into public.import_rows (job_id, ordinal, payload, state) values
        (v_job, 1, jsonb_build_object('display_name', 'Calon F33 a', 'node_id', v_kls4), 'PENDING'),
        (v_job, 2, jsonb_build_object('display_name', 'Calon F33 b', 'node_id', v_kls4, 'role', 'STUDENT'), 'PENDING'),
        (v_job, 3, jsonb_build_object('display_name', 'Calon F33 guru', 'node_id', v_kls4, 'role', 'EDUCATOR'), 'PENDING'),
        (v_job, 4, jsonb_build_object('display_name', 'Staf F33', 'node_id', v_kls4, 'person_id', v_p), 'PENDING');
      insert into public.import_jobs (institution_id, created_by_person_id, state, row_count, confirmed_by_person_id, confirmed_at, completed_at)
      select v_inst, a.person_id, 'COMPLETED', 1, a.person_id, now(), now() from public.accounts a where a.auth_user_id = v_adm returning import_jobs.id into v_job;
      insert into public.import_rows (job_id, ordinal, payload, state) values
        (v_job, 1, jsonb_build_object('display_name', 'Lama F33', 'node_id', v_kls4), 'PENDING');
      perform selftest.as_user_uid(v_adm);
      select coalesce(jsonb_object_agg(x.alasan, x.jumlah), '{}'::jsonb) into v_calc from public.kelas_dikecualikan_kartu(array[v_kls4]) x;
      perform selftest.as_owner();
      if v_calc is distinct from '{"AKUN": 1, "STAF": 1, "PENDATAAN": 2}'::jsonb then
        a01 := a01 || format('the administrator was given %s, not {AKUN 1, STAF 1, PENDATAAN 2}', v_calc);
      end if;
      perform selftest.as_user_uid(v_guru2);
      select count(*) into v_n from public.kelas_dikecualikan_kartu(array[v_kls4]);
      perform selftest.as_owner();
      if v_n <> 0 then a01 := a01 || 'a teacher was given the counts'::text; end if;
    exception when others then perform selftest.as_owner(); a01 := a01 || ('threw: ' || sqlerrm);
    end;

    -- ═════════════════════════════════════════════════════════════════════ F33-P01 a PD class is never drawn by result
    begin
      -- a professional-learning Bagian beside the demonstration school's own, its Programme, Angkatan and Kelas
      insert into public.org_nodes (institution_id, parent_id, kind, name, learning_context)
      select v_inst, d.parent_id, 'DEPARTMENT', 'Pengembangan F33 ' || v_tag, 'PROFESSIONAL_DEVELOPMENT'
        from public.org_nodes d, public.org_nodes o
       where o.id = v_tmpl.class_node_id and o.jalur @> array[d.id] and d.kind = 'DEPARTMENT'
       limit 1 returning org_nodes.id into v_pd;
      insert into public.org_nodes (institution_id, parent_id, kind, name) values (v_inst, v_pd, 'PROGRAMME', 'Program F33 ' || v_tag)
        returning org_nodes.id into v_pd;
      insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
      select v_inst, v_pd, 'COHORT', 'Guru F33 ' || v_tag, o.academic_period_id from public.org_nodes o where o.id = v_tmpl.class_node_id
        returning org_nodes.id into v_pd;
      insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
      select v_inst, v_pd, 'CLASS', 'Kelas PD F33 ' || v_tag, o.academic_period_id from public.org_nodes o where o.id = v_tmpl.class_node_id
        returning org_nodes.id into v_pdk;
      if (select n.member_kind from public.org_nodes n where n.id = v_pdk) is distinct from 'PARTICIPANT' then
        p01 := p01 || 'the constructed class is not a class of participants'::text;
      end if;
      v_fas := selftest.f11_user('f33-fas-' || v_tag || '@local.invalid', 'EDUCATOR', v_pdk);
      -- three participants placed in it, each with an official result there, one in the lowest band
      for m in select * from (values ('P', 0.30, true), ('Q', 0.70, true), ('R', 0.90, true)) x(w, ms, gate) loop
        -- a participant is a teacher of the school (D-070(c)), placed in the PD class
        v_uidp := selftest.f11_user('f33-peserta-' || lower(m.w) || '-' || v_tag || '@local.invalid', 'EDUCATOR', v_kls3);
        select a.person_id into v_p from public.accounts a where a.auth_user_id = v_uidp;
        update public.persons pp set display_name = 'Peserta F33 ' || m.w || ' ' || v_tag where pp.id = v_p;
        insert into public.enrollments (person_id, institution_id, academic_period_id, programme_id, status)
        select v_p, v_inst, e.academic_period_id, e.programme_id, 'ACTIVE' from public.enrollments e where e.id = v_tmpl.enrollment_id
        returning enrollments.id into v_job;
        insert into public.memberships (enrollment_id, node_id, academic_period_id) values (v_job, v_pdk, v_tmpl.academic_period_id);
        perform selftest.f33_sesi(v_tmpl.id, v_p, v_pdk, null, 'POST_TEST', m.ms, m.gate);
      end loop;
      -- the same evidence the reads would otherwise draw (as owner: three results in the class)
      select count(*) into v_n from public.official_sessions s where s.class_node_id = v_pdk and s.mode = 'POST_TEST';
      if v_n <> 3 then p01 := p01 || format('the PD class holds %s official results, not the 3 planted', v_n); end if;
      perform selftest.as_user_uid(v_fas);
      select count(*) into v_n from public.murid_perlu_penguatan(v_pdk);
      select count(*) into v_n2 from public.sebaran_murid_kelas(v_pdk);
      perform selftest.as_owner();
      if v_n <> 0 then p01 := p01 || format('the facilitator was given %s participant(s) by name in the lowest band', v_n); end if;
      if v_n2 <> 0 then p01 := p01 || format('the facilitator was given %s participant(s) as dots on the score line', v_n2); end if;
    exception when others then perform selftest.as_owner(); p01 := p01 || ('threw: ' || sqlerrm);
    end;

    raise exception 'F33_ROLLBACK';
  exception when others then
    perform set_config('pintar.metric_boundary_node', '', true);
    perform selftest.as_owner();
    if sqlerrm <> 'F33_ROLLBACK' then v_fatal := sqlerrm; end if;
  end;

  for m in select * from (values
      ('F33-S01', 'KESETIAAN #6 -- the score line, for the class''s teacher only', s01,
       'one dot per learner with a result in the class, banded as the readiness calculator counts, no identity; nobody else'),
      ('F33-K01', 'KESETIAAN #7 -- the before → after pair is Kenaikan''s own evidence', k01,
       'akhir − awal equals calc_class_net_gain over the same pairs and people; a Kenaikan audience is given it; '
       || 'another class''s teacher and a class under the minimum are given nothing'),
      ('F33-R01', 'KESETIAAN #18 -- evidence readiness per subject and class', r01,
       'every row matches an independent count, the population is the active academic assignments, the minimum the '
       || 'catalogue''s; a teacher and another school''s Dekan are given nothing'),
      ('F33-A01', 'KESETIAAN #21 -- who is not offered a card, by one reason each', a01,
       'AKUN, STAF and PENDATAAN counted once each, the offered learner, a completed import, a staff row and a placed '
       || 'person not; a teacher is given nothing'),
      ('F33-P01', 'D-069 -- a professional-learning class is never named or drawn by result', p01,
       'the facilitator of a PD class whose participants have official results, one in the lowest band, is given no '
       || 'name and no dot'))
    t(tid, tarea, tprobs, tdetail) loop
    id := m.tid; area := m.tarea;
    if v_fatal <> '' then ok := false; detail := 'the suite aborted before this test could report: ' || left(v_fatal, 200);
    elsif cardinality(m.tprobs) > 0 then ok := false; detail := format('%s problem(s): %s', cardinality(m.tprobs), array_to_string(m.tprobs, '; '));
    else ok := true; detail := m.tdetail; end if;
    return next;
  end loop;
  id := 'F33-DONE'; area := 'suite'; ok := v_fatal = '';
  detail := case when v_fatal = '' then 'FABLE-33 suite complete; every row rolled back' else 'the suite did not complete: ' || left(v_fatal, 200) end;
  return next;
end $$;
revoke all on function selftest.run_fable33() from public;
