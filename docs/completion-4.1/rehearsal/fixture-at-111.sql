-- The production-upgrade rehearsal's own fixture, applied at migration 111 (production's release 5b5b68d) after that
-- commit's seed and before the BEFORE read. SYNTHETIC ONLY: every name is obviously fictitious ("Fiktif"), every email
-- is on example.invalid, every signature is a placeholder. It never runs anywhere but the rehearsal's throw-away local
-- stack (the workflow applies it with psql to the runner's own database).
--
-- WHY. The September seed holds none of the shapes most of 4.1's data migrations act on (Sharon, REHEARSAL-STAGE1,
-- (c)). This file adds them, written against 111's schema and, wherever 111 offers one, through 111's own functions
-- (launch_quick_assessment, start_learning_session, record_answer, finish_my_session, certificate_prepare,
-- certificate_seal, pause_session, session_enforce_deadline, withdraw_release), so each row is a shape production
-- itself could hold. Where 111 has no function for a state, the row is written directly and the comment says so.
--
-- THE SHAPES, and the migration of 112-282 each one is for:
--   F1  a locked auth user (banned_until = infinity)          -> 20270116130000 (L-1's lock rewrite)
--       a suspended auth user (banned_until finite, future)   -> must be left alone by the same rewrite
--   F2  a person with no account, and an activation grant      -> stage 2's account shapes; 20261021100000 (pintar_id)
--   F3  open sittings: CREATED, IN_PROGRESS, PAUSED, one past its deadline still IN_PROGRESS, one EXPIRED with no
--       result                                                 -> 20270114100000/110000 (A1's closer), 20270119*
--       (the emergency marks), 20261102100000 (pass_mark backfill on sessions)
--   F4  a learner with two live enrolments (two schools) and an open class membership in each; a departed learner
--       (enrolment ENDED, memberships closed)                  -> 20270112160000 (one live enrolment per school year)
--   F5  a SEALED certificate from a QUICK session (ISSUED, placeholder signature), and a finished QUICK session with
--       no certificate                                         -> 20261113100000 (a quick assessment does not certify),
--       20261201100000 / 20270113110000 (certificate columns added after 111)
--   F6  A3's lineage shapes: two definitions sharing (institution, title, mode); a course chain of depth 2 with a
--       module matched by supersedes_module_id and one unmatched -> kept for A3's lineage backfill
--   F7  a withdrawn release (SUPERSEDED, audited RELEASE_WITHDRAWN) -> 20270115100000 (withdrawn_* backfill)
--   F8  a PRE_TEST assignment whose definition names a mastery_min -> 20261102100000 (must NOT be backfilled)
--   F9  a storage object's metadata row                        -> the extra-state fingerprint (storage.objects)
--
-- NOT HERE, ON PURPOSE: an ELIGIBLE (unsigned) certificate from a QUICK session. 20261113100000 refuses to apply over
-- one; the workflow proves that refusal separately, inside a transaction it rolls back.

select set_config('app.seed_intent', 'synthetic', true);

create or replace function pg_temp.fx_as(p_auth uuid) returns void language sql as $$
  select set_config('request.jwt.claim.sub', coalesce(p_auth::text, ''), true),
         set_config('request.jwt.claims',
                    case when p_auth is null then '' else json_build_object('sub', p_auth, 'role', 'authenticated')::text end,
                    true);
$$;

-- a synthetic learner: an auth user (the 111 trigger makes the person and the EMAIL account)
create or replace function pg_temp.fx_learner(p_n int, out auth_id uuid, out person_id uuid) language plpgsql as $$
begin
  auth_id := gen_random_uuid();
  insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
                          raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
                          confirmation_token, recovery_token, email_change_token_new, email_change)
  values (auth_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
          format('fiktif-murid-%s@example.invalid', lpad(p_n::text, 2, '0')),
          extensions.crypt(format('Fiktif-Sandi-%s-!', p_n), extensions.gen_salt('bf')), now(),
          '{"provider":"email","providers":["email"]}',
          jsonb_build_object('display_name', format('Murid Fiktif %s', lpad(p_n::text, 2, '0'))),
          now(), now(), '', '', '', '');
  select a.person_id into person_id from public.accounts a where a.auth_user_id = auth_id;
  if person_id is null then raise exception 'fixture: the 111 trigger made no person for learner %', p_n; end if;
end $$;

-- enrol a person ACTIVE and place them in a cohort and a class (111's direct writes, as the seed does)
create or replace function pg_temp.fx_enrol(p_person uuid, p_inst uuid, p_period uuid, p_prog uuid, p_coh uuid, p_cls uuid)
returns uuid language plpgsql as $$
declare v uuid;
begin
  insert into public.enrollments (person_id, institution_id, academic_period_id, programme_id, status)
  values (p_person, p_inst, p_period, p_prog, 'ACTIVE') returning id into v;
  insert into public.memberships (enrollment_id, node_id, academic_period_id)
  values (v, p_coh, p_period), (v, p_cls, p_period);
  return v;
end $$;

-- answer every presented item of a session correctly, as its learner (the seed's own loop)
create or replace function pg_temp.fx_answer_all(p_session uuid, p_limit int default 1000) returns int language plpgsql as $$
declare r record; v_pos int; n int := 0;
begin
  for r in select pi.id as pid, pi.item_id from public.presented_items pi
            where pi.session_id = p_session order by pi.position limit p_limit loop
    select d.display_position into v_pos
      from public.option_display_order(p_session, r.item_id) d
      join public.item_options o on o.item_id = r.item_id and o.label = d.label
     where o.is_correct limit 1;
    perform public.record_answer(r.pid, 1, jsonb_build_object('posisi', v_pos));
    n := n + 1;
  end loop;
  return n;
end $$;

do $$
declare
  v_inst uuid; v_period uuid; v_prog uuid; v_coh uuid; v_cls uuid; v_rel uuid; v_la uuid; v_aa_post uuid;
  v_def_post uuid; v_module uuid; v_course uuid;
  a_admin uuid; a_hod uuid; a_guru uuid; p_admin uuid; p_hod uuid; p_guru uuid;
  s_inst uuid; s_period uuid; s_prog uuid; s_coh uuid; s_cls uuid; s_aa uuid;
  l record; v_q record; v_q2 record; v_sess uuid; v_cert uuid; v_status text; n int; t text;
  v_course2 uuid; v_course3 uuid; v_mod2 uuid; v_mod3 uuid; v_rel2 uuid; v_def_pre uuid; v_aa_pre uuid;
  v_person_noacct uuid;
begin
  if (select environment from public.platform_environment) = 'production' then
    raise exception 'fixture refused: this database is marked production';
  end if;
  if not public.synthetic_fixtures_permitted() then
    raise exception 'fixture refused: synthetic fixtures are not permitted on this database';
  end if;
  if (select count(*) from supabase_migrations.schema_migrations) <> 111 then
    raise exception 'fixture refused: it is written for migration 111, this database has %',
      (select count(*) from supabase_migrations.schema_migrations);
  end if;

  -- ------------------------------------------------------------ the context: the seed's OFFICIAL bootstrap school
  select i.id into v_inst from public.institutions i where i.slug = 'pintar-bootstrap-official';
  select e.academic_period_id, e.programme_id into v_period, v_prog
    from public.enrollments e where e.institution_id = v_inst order by e.created_at limit 1;
  select id into v_coh from public.org_nodes where institution_id = v_inst and kind = 'COHORT' and academic_period_id = v_period limit 1;
  select id into v_cls from public.org_nodes where institution_id = v_inst and kind = 'CLASS' and academic_period_id = v_period limit 1;
  select la.id, la.plp_release_id into v_la, v_rel from public.learning_assignments la where la.institution_id = v_inst limit 1;
  select aa.id, aa.assessment_definition_id into v_aa_post, v_def_post
    from public.assessment_assignments aa where aa.learning_assignment_id = v_la limit 1;
  select d.module_id into v_module from public.assessment_definitions d where d.id = v_def_post;
  select m.course_id into v_course from public.modules m where m.id = v_module;
  select ac.auth_user_id, ra.person_id into a_admin, p_admin from public.role_assignments ra
    join public.accounts ac on ac.person_id = ra.person_id where ra.institution_id = v_inst and ra.role = 'INSTITUTION_ADMIN' limit 1;
  select ac.auth_user_id, ra.person_id into a_hod, p_hod from public.role_assignments ra
    join public.accounts ac on ac.person_id = ra.person_id where ra.institution_id = v_inst and ra.role = 'HEAD_OF_DEPARTMENT' limit 1;
  select ac.auth_user_id, ra.person_id into a_guru, p_guru from public.role_assignments ra
    join public.accounts ac on ac.person_id = ra.person_id where ra.institution_id = v_inst and ra.role = 'EDUCATOR' limit 1;
  if v_inst is null or v_cls is null or v_aa_post is null or a_admin is null or a_hod is null or a_guru is null then
    raise exception 'fixture: the 111 seed does not hold the bootstrap school it builds on';
  end if;

  -- the second school: the seed's learning-cycle school (its Uji Penguasaan allows pausing)
  select i.id into s_inst from public.institutions i where i.slug like 'synth-siklus-%' order by i.created_at desc limit 1;
  select aa.id into s_aa from public.assessment_assignments aa
    join public.assessment_definitions d on d.id = aa.assessment_definition_id
   where aa.institution_id = s_inst and d.mode = 'POST_TEST' and d.allows_pause limit 1;
  select aa.node_id, n2.academic_period_id into s_cls, s_period from public.assessment_assignments aa
    join public.org_nodes n2 on n2.id = aa.node_id where aa.id = s_aa;
  select parent_id into s_coh from public.org_nodes where id = s_cls;
  select e.programme_id into s_prog from public.enrollments e where e.institution_id = s_inst limit 1;

  -- ------------------------------------------------------------ F5: a sealed certificate from a QUICK session
  -- The Uji Cepat as 111 launches it: the class's educator, launch_quick_assessment (ad hoc, QUICK, mastery_min 0.6).
  perform pg_temp.fx_as(a_guru);
  select * into v_q from public.launch_quick_assessment(v_cls, v_module, 6, 30);
  perform pg_temp.fx_as(null);

  select * into l from pg_temp.fx_learner(1);                          -- Murid Fiktif 01: the certified one
  perform pg_temp.fx_enrol(l.person_id, v_inst, v_period, v_prog, v_coh, v_cls);
  perform pg_temp.fx_as(l.auth_id);
  v_sess := public.start_learning_session(v_q.assessment_assignment_id);
  perform pg_temp.fx_answer_all(v_sess);
  perform public.finish_my_session(v_sess);
  perform pg_temp.fx_as(null);
  select c.certificate_id into v_cert from public.certificate_prepare(v_sess, 1::smallint) c;
  v_status := public.certificate_seal(v_cert, 1::smallint,
                'FIKTIF-signature-placeholder-not-a-real-key-' || repeat('0', 40))::text;
  if v_status <> 'ISSUED' then raise exception 'fixture: the QUICK certificate did not seal (%)', v_status; end if;

  select * into l from pg_temp.fx_learner(2);                          -- Murid Fiktif 02: QUICK finished, no certificate
  perform pg_temp.fx_enrol(l.person_id, v_inst, v_period, v_prog, v_coh, v_cls);
  perform pg_temp.fx_as(l.auth_id);
  v_sess := public.start_learning_session(v_q.assessment_assignment_id);
  perform pg_temp.fx_answer_all(v_sess);
  perform public.finish_my_session(v_sess);
  perform pg_temp.fx_as(null);
  if not (select e.eligible from public.certificate_eligibility(v_sess) e) then
    raise exception 'fixture: the uncertified QUICK session is not eligible at 111, so it would prove nothing';
  end if;

  -- ------------------------------------------------------------ F3: open sittings at upgrade time
  select * into l from pg_temp.fx_learner(3);                          -- 03: CREATED (opened, never begun)
  perform pg_temp.fx_enrol(l.person_id, v_inst, v_period, v_prog, v_coh, v_cls);
  perform public.open_assessment_session(
    (select e.id from public.enrollments e where e.person_id = l.person_id), v_def_post, v_rel, 'ONLINE', 'POST_TEST',
    public.engine_version(), public.scoring_policy_version(), v_cls, v_coh, now() + interval '2 days', v_la, v_aa_post);

  select * into l from pg_temp.fx_learner(4);                          -- 04: IN_PROGRESS, one answer given
  perform pg_temp.fx_enrol(l.person_id, v_inst, v_period, v_prog, v_coh, v_cls);
  perform pg_temp.fx_as(l.auth_id);
  v_sess := public.start_learning_session(v_aa_post);
  perform pg_temp.fx_answer_all(v_sess, 1);
  perform pg_temp.fx_as(null);
  if (select status from public.assessment_sessions where id = v_sess) <> 'IN_PROGRESS' then
    raise exception 'fixture: learner 04''s sitting is not IN_PROGRESS';
  end if;

  -- 05: PAUSED, in the second school (whose Uji Penguasaan allows pausing), through pause_session; 05 is also
  -- enrolled at the bootstrap school, so 05 is the learner with two live enrolments and two open class memberships
  select * into l from pg_temp.fx_learner(5);
  perform pg_temp.fx_enrol(l.person_id, v_inst, v_period, v_prog, v_coh, v_cls);
  perform pg_temp.fx_enrol(l.person_id, s_inst, s_period, s_prog, s_coh, s_cls);
  perform pg_temp.fx_as(l.auth_id);
  v_sess := public.start_learning_session(s_aa);
  perform pg_temp.fx_answer_all(v_sess, 1);
  perform public.pause_session(v_sess);
  perform pg_temp.fx_as(null);

  -- 06: past its deadline, still IN_PROGRESS (nothing has enforced the deadline yet). 111 opens a sitting with any
  -- authoritative deadline; CREATED -> IN_PROGRESS is the allow-listed transition start takes.
  select * into l from pg_temp.fx_learner(6);
  perform pg_temp.fx_enrol(l.person_id, v_inst, v_period, v_prog, v_coh, v_cls);
  v_sess := public.open_assessment_session(
    (select e.id from public.enrollments e where e.person_id = l.person_id), v_def_post, v_rel, 'ONLINE', 'POST_TEST',
    public.engine_version(), public.scoring_policy_version(), v_cls, v_coh, now() - interval '20 minutes', v_la, v_aa_post);
  perform public.assemble_session(v_sess);
  update public.assessment_sessions set status = 'IN_PROGRESS' where id = v_sess;

  -- 07: EXPIRED and not finalised: the same, then 111's own deadline enforcement, and no result
  select * into l from pg_temp.fx_learner(7);
  perform pg_temp.fx_enrol(l.person_id, v_inst, v_period, v_prog, v_coh, v_cls);
  v_sess := public.open_assessment_session(
    (select e.id from public.enrollments e where e.person_id = l.person_id), v_def_post, v_rel, 'ONLINE', 'POST_TEST',
    public.engine_version(), public.scoring_policy_version(), v_cls, v_coh, now() - interval '3 hours', v_la, v_aa_post);
  perform public.assemble_session(v_sess);
  update public.assessment_sessions set status = 'IN_PROGRESS' where id = v_sess;
  if public.session_enforce_deadline(v_sess)::text <> 'EXPIRED' then raise exception 'fixture: 07 did not expire'; end if;

  -- ------------------------------------------------------------ F4: a departed learner
  select * into l from pg_temp.fx_learner(8);                          -- 08: enrolment ENDED (WITHDRAWN), placements closed
  perform pg_temp.fx_enrol(l.person_id, v_inst, v_period, v_prog, v_coh, v_cls);
  update public.memberships m set valid_to = now(), close_reason = 'ENROLLMENT_ENDED'
   where m.enrollment_id = (select e.id from public.enrollments e where e.person_id = l.person_id) and m.valid_to is null;
  update public.enrollments set status = 'ENDED', end_reason = 'WITHDRAWN', valid_to = now() where person_id = l.person_id;

  -- ------------------------------------------------------------ F1: a locked and a suspended auth user
  select * into l from pg_temp.fx_learner(9);                          -- 09: locked (L-1's predicate)
  perform pg_temp.fx_enrol(l.person_id, v_inst, v_period, v_prog, v_coh, v_cls);
  update auth.users set banned_until = 'infinity' where id = l.auth_id;
  select * into l from pg_temp.fx_learner(10);                         -- 10: suspended until a date
  perform pg_temp.fx_enrol(l.person_id, v_inst, v_period, v_prog, v_coh, v_cls);
  update auth.users set banned_until = timestamptz '2027-12-31 00:00:00+00' where id = l.auth_id;

  -- ------------------------------------------------------------ F2: a person with no account, and a grant
  insert into public.persons (display_name) values ('Orang Fiktif Tanpa Akun') returning id into v_person_noacct;
  insert into public.account_activation_grants (email, person_id, kind, institution_id, authorized_by, expires_at)
  values ('fiktif-tanpa-akun@example.invalid', v_person_noacct, 'EMAIL', v_inst, p_admin, now() + interval '7 days');

  -- ------------------------------------------------------------ F6: A3's lineage shapes
  -- (b) a course chain of depth 2 (course3 -> course2 -> the bootstrap course): course2's module names the original
  --     module as its predecessor; course3's module names none (the "unmatched module" A3 would have to refuse)
  insert into public.courses (institution_id, subject, stage, grade_label, title, author_person_id, supersedes_course_id)
  select c.institution_id, c.subject, c.stage, c.grade_label, c.title || ' (revisi fiktif 2)', p_hod, c.id
    from public.courses c where c.id = v_course returning id into v_course2;
  insert into public.modules (course_id, institution_id, ordinal, title, author_person_id, supersedes_module_id)
  select v_course2, m.institution_id, m.ordinal, m.title, p_hod, m.id from public.modules m where m.id = v_module
  returning id into v_mod2;
  insert into public.courses (institution_id, subject, stage, grade_label, title, author_person_id, supersedes_course_id)
  select c.institution_id, c.subject, c.stage, c.grade_label, c.title || ' (revisi fiktif 3)', p_hod, v_course2
    from public.courses c where c.id = v_course returning id into v_course3;
  insert into public.modules (course_id, institution_id, ordinal, title, author_person_id)
  values (v_course3, v_inst, 1, 'Modul Fiktif Tanpa Pendahulu', p_hod) returning id into v_mod3;
  -- (a) a second definition under the same (institution, title, mode) as the bootstrap Uji Penguasaan: version 2,
  --     an unreviewed draft in the next revision of its course (the unique key is (institution, title, mode, version);
  --     a frozen course takes no new definition, so it sits under course2's module, below)
  insert into public.assessment_definitions (institution_id, module_id, title, mode, bank_type, item_count,
    safety_critical_minimum, difficulty_mix, passing_rules, attempt_limit, shuffle_policy, status, author_person_id, version)
  select d.institution_id, v_mod2, d.title, d.mode, d.bank_type, d.item_count, d.safety_critical_minimum,
         d.difficulty_mix, d.passing_rules, d.attempt_limit, d.shuffle_policy, 'INGESTED', p_hod, d.version + 1
    from public.assessment_definitions d where d.id = v_def_post;
  insert into public.assessment_definitions (institution_id, module_id, title, mode, bank_type, item_count,
    safety_critical_minimum, difficulty_mix, passing_rules, status, author_person_id)
  values (v_inst, v_mod2, 'Uji Fiktif Revisi 2', 'POST_TEST', 'TEST', 4, 0, '{"SEDANG": 4}', '{"mastery_min": 0.7}',
          'INGESTED', p_hod),
         (v_inst, v_mod3, 'Uji Fiktif Revisi 3', 'POST_TEST', 'TEST', 4, 0, '{"SEDANG": 4}', '{"mastery_min": 0.7}',
          'INGESTED', p_hod);

  -- ------------------------------------------------------------ F7: a withdrawn release
  -- a second release of the bootstrap course, published by 111's own walk, then withdrawn by withdraw_release
  insert into public.plp_releases (institution_id, course_id, version_label, author_person_id)
  values (v_inst, v_course, '1.0.1', p_guru) returning id into v_rel2;
  foreach t in array array['STRUCTURED','VALIDATED','IN_REVIEW'] loop
    update public.plp_releases set status = t::public.content_status where id = v_rel2;
  end loop;
  perform pg_temp.fx_as(a_hod);
  update public.plp_releases set status = 'APPROVED', reviewed_by_person_id = p_hod, reviewed_at = now() where id = v_rel2;
  update public.plp_releases set status = 'FROZEN' where id = v_rel2;
  perform pg_temp.fx_as(a_admin);
  update public.plp_releases set status = 'PUBLISHED' where id = v_rel2;
  perform public.withdraw_release(v_rel2, 'rilis fiktif ditarik untuk gladi peningkatan');
  perform pg_temp.fx_as(null);
  if (select status from public.plp_releases where id = v_rel2) <> 'SUPERSEDED' then
    raise exception 'fixture: the withdrawn release is not SUPERSEDED';
  end if;

  -- ------------------------------------------------------------ F8: a PRE_TEST assignment that names a mastery_min
  insert into public.assessment_definitions (institution_id, module_id, title, mode, bank_type, item_count,
    safety_critical_minimum, difficulty_mix, passing_rules, status, author_person_id)
  values (v_inst, v_mod2, 'Pemetaan Awal Fiktif', 'PRE_TEST', 'TEST', 4, 0, '{"SEDANG": 4}', '{"mastery_min": 0.5}',
          'INGESTED', p_guru) returning id into v_def_pre;
  foreach t in array array['STRUCTURED','VALIDATED','IN_REVIEW'] loop
    update public.assessment_definitions set status = t::public.content_status where id = v_def_pre;
  end loop;
  perform pg_temp.fx_as(a_hod);
  update public.assessment_definitions set status = 'APPROVED', reviewed_by_person_id = p_hod, reviewed_at = now()
   where id = v_def_pre;
  perform pg_temp.fx_as(a_admin);
  insert into public.assessment_assignments (institution_id, assessment_definition_id, learning_assignment_id, node_id,
    academic_period_id, opens_at, closes_at, assigned_by_person_id, assigned_at)
  values (v_inst, v_def_pre, v_la, v_cls, v_period, now() - interval '1 hour', now() + interval '10 days', p_admin, now())
  returning id into v_aa_pre;
  perform pg_temp.fx_as(null);

  -- ------------------------------------------------------------ F9: a storage object's metadata (no content)
  insert into storage.objects (bucket_id, name, metadata)
  values ((select id from storage.buckets order by id limit 1), 'fiktif/gladi-peningkatan.txt',
          '{"size": 17, "mimetype": "text/plain", "note": "synthetic rehearsal row"}');

  select count(*) into n from public.persons p join public.accounts a on a.person_id = p.id
    join auth.users u on u.id = a.auth_user_id where u.email like 'fiktif-%@example.invalid';
  raise notice 'rehearsal fixture at 111: % synthetic learners, QUICK certificate %, release withdrawn %', n, v_cert, v_rel2;
end $$;
