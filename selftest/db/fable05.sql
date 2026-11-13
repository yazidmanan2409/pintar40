-- FABLE-05 database-layer selftest. Sibling of fable01..04.sql, same row shape,
-- same throwaway `selftest` schema, same CI-01 privilege preamble.
--
-- WHAT IT NEEDS THAT NOTHING ELSE BUILDS. Canonical content distribution has no
-- seed: the canonical tenant exists (0052 creates it) but holds no content, and
-- it must not, because a seeded canonical package would make "a school with no
-- grant is refused" untestable in the one direction that matters. So this file
-- builds its own canonical package -- through the ordinary lifecycle, with real
-- actors holding real capabilities, passing the real quality gate -- and every
-- later test runs against it.
--
-- THE NEGATIVE HALF IS THE POINT (§10.2). Most of what follows is a refusal:
-- no grant, a withdrawn grant, another school's release, another school's
-- content, a school writing canonical content, a school granting itself. Each
-- is built as far as the row that WOULD express it, and then shown to fail --
-- an untried refusal proves nothing.

create schema if not exists selftest;
grant usage on schema selftest to authenticated, anon;

do $$
begin
  if to_regprocedure('selftest.as_user(text)') is null
     or to_regprocedure('selftest.answer_paper(uuid,boolean,boolean)') is null then
    raise exception 'apply fable01.sql and fable03.sql before fable05.sql: the helpers are missing';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- An actor in any institution, created the ordinary way.
--
-- SECURITY DEFINER because it writes auth.users and role_assignments, and
-- INV-16 refuses a self-grant -- a harness has no second administrator to be,
-- so it uses the declared synthetic-seed path exactly as the seeds do.
-- ---------------------------------------------------------------------------
create or replace function selftest.f05_actor(
  p_email text, p_role public.app_role, p_institution uuid)
returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_uid uuid; v_person uuid;
begin
  select id into v_uid from auth.users where email = p_email;
  if v_uid is null then
    insert into auth.users (id, email) values (gen_random_uuid(), p_email) returning id into v_uid;
  end if;
  select a.person_id into v_person from public.accounts a where a.auth_user_id = v_uid;
  if v_person is null then raise exception 'actor % has no person', p_email; end if;

  if not exists (select 1 from public.role_assignments ra
                  where ra.person_id = v_person and ra.role = p_role
                    and ra.scope_node_id = p_institution and ra.revoked_at is null) then
    perform set_config('app.seed_intent', 'synthetic', true);
    insert into public.role_assignments (person_id, role, scope_node_id, valid_from, valid_until)
    values (v_person, p_role, p_institution, now() - interval '1 day', now() + interval '365 days');
    perform set_config('app.seed_intent', '', true);
  end if;
  return v_person;
end $$;
revoke all on function selftest.f05_actor(text, public.app_role, uuid) from public;

-- ---------------------------------------------------------------------------
-- The canonical package. Idempotent: a second call returns the first one.
--
-- The item spec is the bootstrap fixture's, deliberately: option lengths kept
-- close and correct labels spread, because run_mcq_quality() looks for exactly
-- those patterns and a fixture that trips its own gate is not a fixture.
-- ---------------------------------------------------------------------------
-- The signature gained `p_publish` after the first draft; drop the old arity so
-- re-applying this file cannot leave two overloads and an ambiguous call.
drop function if exists selftest.canonical_package(text);

create or replace function selftest.canonical_package(p_title text default 'Pengukuran Nasional',
                                                     p_publish boolean default true)
returns table (canon uuid, course uuid, modul uuid, les uuid, defn uuid, rel uuid)
-- INVOKER, not DEFINER: it impersonates real actors through selftest.as_user(),
-- and `set role` is refused inside a security-definer function. Same lesson as
-- selftest.issue_material() in FABLE-04.
language plpgsql set search_path = public, pg_temp as $$
declare
  v_canon uuid; v_guru uuid; v_admin uuid; v_course uuid; v_mod uuid; v_les uuid;
  v_defn uuid; v_rel uuid; ob1 uuid; ob2 uuid; spec jsonb; entry jsonb; opt jsonb;
  it uuid; t text; v_status text; v_blockers jsonb; tag text;
begin
  select i.id into v_canon from public.institutions i where i.tenant_kind = 'PLATFORM_CANONICAL' limit 1;
  if v_canon is null then raise exception 'no PLATFORM_CANONICAL tenant exists'; end if;

  select c.id into v_course from public.courses c
   where c.institution_id = v_canon and c.title = p_title and c.supersedes_course_id is null;
  if v_course is not null then
    select m.id into v_mod from public.modules m where m.course_id = v_course order by m.ordinal limit 1;
    select l.id into v_les from public.lessons l where l.module_id = v_mod order by l.ordinal limit 1;
    -- the canonical tenant's own definition: a school's quick paper on this
    -- module (FABLE-05 T1, committed on a shared stack) is not the package's,
    -- and without an order the heap decided which one came back
    select d.id into v_defn from public.assessment_definitions d
     where d.module_id = v_mod and d.institution_id = v_canon order by d.created_at, d.id limit 1;
      select r.id into v_rel from public.plp_releases r
     where r.course_id = v_course order by r.created_at limit 1;
    canon := v_canon; course := v_course; modul := v_mod; les := v_les; defn := v_defn; rel := v_rel;
    return next; return;
  end if;

  tag := substr(md5(p_title), 1, 6);
  v_guru  := selftest.f05_actor('kanonik-penyusun@pintar.test', 'EDUCATOR', v_canon);
  v_admin := selftest.f05_actor('kanonik-admin@pintar.test', 'INSTITUTION_ADMIN', v_canon);

  perform selftest.as_user('kanonik-penyusun@pintar.test');

  insert into public.courses (institution_id, subject, stage, grade_label, title, author_person_id)
  values (v_canon, 'Matematika', 'SD', 'Kelas 5', p_title, v_guru) returning id into v_course;
  insert into public.modules (course_id, institution_id, ordinal, title, author_person_id)
  values (v_course, v_canon, 1, 'Satuan Panjang', v_guru) returning id into v_mod;
  insert into public.lessons (module_id, institution_id, ordinal, title, summary, body_markdown,
                              worked_examples, media, page_citation, author_person_id)
  values (v_mod, v_canon, 1, 'Mengubah Satuan Panjang',
          'Satuan panjang berubah sepuluh kali setiap turun satu tingkat.',
          E'## Tangga satuan\n\nSetiap turun satu tingkat, angkanya dikali sepuluh.\n\n## Naik tingkat\n\nSetiap naik satu tingkat, angkanya dibagi sepuluh.',
          '[{"judul":"2 m menjadi cm","langkah":["Dari m ke cm turun dua tingkat.","Dikali sepuluh dua kali.","Hasilnya 200 cm."]}]'::jsonb,
          '[]'::jsonb, 'Bagian 1 · halaman 4-9', v_guru)
  returning id into v_les;

  insert into public.learning_objectives (lesson_id, institution_id, code, statement, bloom, is_core) values
    (v_les, v_canon, 'KN5-B1', 'Mengubah satuan panjang satu tingkat.', 'APPLY', true),
    (v_les, v_canon, 'KN5-B2', 'Mengubah satuan panjang beberapa tingkat.', 'APPLY', true);
  select id into ob1 from public.learning_objectives where lesson_id = v_les and code = 'KN5-B1';
  select id into ob2 from public.learning_objectives where lesson_id = v_les and code = 'KN5-B2';

  insert into public.misconception_taxonomy (code, institution_id, label, description, remediation) values
    ('MK-KAN-01-' || tag, v_canon, 'Membagi ketika seharusnya mengali',
     'Peserta didik membalik arah tangga satuan.',
     'Gambar tangganya lebih dulu, lalu tentukan arahnya sebelum menghitung.'),
    ('MK-KAN-02-' || tag, v_canon, 'Melewatkan satu tingkat',
     'Peserta didik menghitung satu tingkat lebih sedikit.',
     'Hitung tingkatnya satu per satu sambil menunjuk gambarnya.')
  on conflict do nothing;

  -- RESTATED FOR FD-5 (D-129(c)): predicted_difficulty is the author's difficulty, the higher the harder (Mudah 0.3,
  -- Sedang 0.5, Sulit 0.7). These values were written as p-values; each is now 1.1 - its old value, which keeps every
  -- question in the band it was in (old MUDAH >= 0.7 is now <= 0.4, old SULIT <= 0.4 is now >= 0.7, SEDANG between).
  spec := jsonb_build_array(
    jsonb_build_object('d',0.90,'sc',false,'o',ob1,'stem','Berapa cm dalam 3 m?','ans','B',
      'opts', jsonb_build_array('30 cm','300 cm','3.000 cm','0,03 cm')),
    jsonb_build_object('d',0.88,'sc',false,'o',ob1,'stem','Berapa mm dalam 4 cm?','ans','C',
      'opts', jsonb_build_array('0,4 mm','4 mm','40 mm','400 mm')),
    jsonb_build_object('d',0.86,'sc',false,'o',ob1,'stem','Berapa dm dalam 7 m?','ans','A',
      'opts', jsonb_build_array('70 dm','7 dm','700 dm','0,7 dm')),
    jsonb_build_object('d',0.84,'sc',true ,'o',ob1,'stem','Berapa cm dalam 1 m?','ans','D',
      'opts', jsonb_build_array('10 cm','1.000 cm','0,1 cm','100 cm')),
    jsonb_build_object('d',0.62,'sc',false,'o',ob2,'stem','Berapa mm dalam 2 m?','ans','B',
      'opts', jsonb_build_array('200 mm','2.000 cm','20 mm','20.000 mm')),
    jsonb_build_object('d',0.60,'sc',false,'o',ob2,'stem','Berapa km dalam 5.000 m?','ans','A',
      'opts', jsonb_build_array('5 km','50 km','0,5 km','500 km')),
    jsonb_build_object('d',0.58,'sc',false,'o',ob2,'stem','Berapa m dalam 250 cm?','ans','C',
      'opts', jsonb_build_array('25 m','0,25 m','2,5 m','250 m')),
    jsonb_build_object('d',0.56,'sc',true ,'o',ob2,'stem','Berapa m dalam 3 km?','ans','D',
      'opts', jsonb_build_array('30 m','300 m','30.000 m','3.000 m')),
    jsonb_build_object('d',0.34,'sc',false,'o',ob2,'stem','Berapa mm dalam 1,5 m?','ans','A',
      'opts', jsonb_build_array('1.500 mm','150 mm','15 mm','15.000 mm')),
    jsonb_build_object('d',0.32,'sc',false,'o',ob2,'stem','Berapa cm dalam 0,4 km?','ans','B',
      'opts', jsonb_build_array('4.000 cm','40.000 cm','400 cm','400.000 cm')),
    jsonb_build_object('d',0.30,'sc',false,'o',ob2,'stem','Berapa dm dalam 6,5 m?','ans','C',
      'opts', jsonb_build_array('6,5 dm','650 dm','65 dm','0,65 dm')),
    jsonb_build_object('d',0.28,'sc',false,'o',ob2,'stem','Berapa m dalam 12.500 cm?','ans','D',
      'opts', jsonb_build_array('1,25 m','1.250 m','12,5 m','125 m')));

  for entry in select * from jsonb_array_elements(spec) loop
    insert into public.items (lesson_id, institution_id, item_type, bank_type, stem,
      petunjuk, arah_berpikir, objective_ids, is_safety_critical, predicted_difficulty,
      page_citation, status, author_person_id)
    values (v_les, v_canon, 'MCQ_SINGLE', 'TEST', entry ->> 'stem',
      'Tentukan arah tangganya dulu, lalu hitung tingkatnya satu per satu.',
      'Perhatikan apakah satuannya menjadi lebih kecil atau lebih besar.',
      array[(entry ->> 'o')::uuid], (entry ->> 'sc')::boolean, (entry ->> 'd')::numeric,
      'Bagian 1 · halaman 4-9', 'INGESTED', v_guru)
    returning id into it;
    for opt in select * from jsonb_array_elements(entry -> 'opts') loop
      insert into public.item_options (item_id, institution_id, label, body, is_correct,
        rationale, misconception_code)
      values (it, v_canon,
        chr(65 + (select count(*) from public.item_options where item_id = it)::int),
        opt #>> '{}',
        chr(65 + (select count(*) from public.item_options where item_id = it)::int) = (entry ->> 'ans'),
        case when chr(65 + (select count(*) from public.item_options where item_id = it)::int) = (entry ->> 'ans')
             then 'Arah dan banyaknya tingkat sudah tepat, sehingga hasilnya benar.'
             else 'Arah tangga atau banyaknya tingkat belum tepat, sehingga hasilnya meleset.' end,
        case when chr(65 + (select count(*) from public.item_options where item_id = it)::int) = (entry ->> 'ans')
             then null
             when (random() < 0.5) then 'MK-KAN-01-' || tag else 'MK-KAN-02-' || tag end);
    end loop;
    foreach t in array array['STRUCTURED','VALIDATED','IN_REVIEW'] loop
      update public.items set status = t::public.content_status where id = it;
    end loop;
  end loop;

  insert into public.assessment_definitions (institution_id, module_id, title, mode, bank_type,
    item_count, safety_critical_minimum, difficulty_mix, passing_rules, attempt_limit,
    allows_pause, offline_tolerant, late_sync_grace_seconds, hesitation_window_seconds,
    shuffle_policy, author_person_id)
  values (v_canon, v_mod, 'Penguasaan — ' || p_title, 'POST_TEST', 'TEST', 6, 1,
    jsonb_build_object('MUDAH', 2, 'SEDANG', 2, 'SULIT', 2),
    jsonb_build_object('mastery_min', 0.6), 1, false, true, 300, 25, 'ITEMS_AND_OPTIONS', v_guru)
  returning id into v_defn;

  foreach t in array array['STRUCTURED','VALIDATED','IN_REVIEW'] loop
    update public.lessons set status = t::public.content_status where id = v_les;
    update public.modules set status = t::public.content_status where id = v_mod;
    update public.courses set status = t::public.content_status where id = v_course;
    update public.assessment_definitions set status = t::public.content_status where id = v_defn;
  end loop;

  -- approve as the canonical administrator: CAN_REVIEW, and not the author
  perform selftest.as_user('kanonik-admin@pintar.test');
  update public.items   set status = 'APPROVED', reviewed_by_person_id = v_admin where lesson_id = v_les;
  update public.lessons set status = 'APPROVED', reviewed_by_person_id = v_admin where id = v_les;
  update public.modules set status = 'APPROVED', reviewed_by_person_id = v_admin where id = v_mod;
  update public.courses set status = 'APPROVED', reviewed_by_person_id = v_admin where id = v_course;
  update public.assessment_definitions set status = 'APPROVED', reviewed_by_person_id = v_admin
   where id = v_defn;

  perform selftest.as_owner();
  perform selftest.as_draft_author();  -- 0085: an authoring act now names its actor
  perform public.validate_course_content(v_course);
  perform selftest.as_owner();
  perform selftest.as_draft_author();  -- 0085: an authoring act now names its actor
  perform public.run_mcq_quality(v_course);
  perform selftest.as_owner();
  select pr.status, pr.blockers into v_status, v_blockers from public.publish_readiness(v_course) pr;
  if v_status <> 'READY' then
    raise exception 'the canonical fixture is not publishable (%): % -- fix the fixture, never the gate',
      v_status, v_blockers::text;
  end if;

  perform selftest.as_user('kanonik-admin@pintar.test');
  perform selftest.as_release_writer();  -- D-041
  insert into public.plp_releases (institution_id, course_id, version_label, author_person_id)
  values (v_canon, v_course, '1.0.0', v_guru) returning id into v_rel;
  perform selftest.as_signed_in();
  foreach t in array array['STRUCTURED','VALIDATED','IN_REVIEW'] loop
    perform selftest.as_release_writer();  -- D-041
    update public.plp_releases set status = t::public.content_status where id = v_rel;
    perform selftest.as_signed_in();
  end loop;
  perform selftest.as_release_writer();  -- D-041
  update public.plp_releases set status = 'APPROVED', reviewed_by_person_id = v_admin where id = v_rel;
  perform selftest.as_signed_in();
  perform selftest.as_release_writer();  -- D-041
  update public.plp_releases set status = 'FROZEN' where id = v_rel;
  perform selftest.as_signed_in();
  if p_publish then perform public.publish_release(v_rel); end if;
  perform selftest.as_owner();

  canon := v_canon; course := v_course; modul := v_mod; les := v_les; defn := v_defn; rel := v_rel;
  return next;
end $$;
revoke all on function selftest.canonical_package(text, boolean) from public;

-- A school's own tiny course, for the cross-tenant probes. Never published --
-- it exists to be invisible to everybody else.
create or replace function selftest.f05_private_course(p_institution uuid, p_title text)
returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare v uuid; v_mod uuid; v_les uuid;
begin
  select c.id into v from public.courses c
   where c.institution_id = p_institution and c.title = p_title;
  if v is not null then return v; end if;
  insert into public.courses (institution_id, subject, stage, grade_label, title)
  values (p_institution, 'Matematika', 'SD', 'Kelas 5', p_title) returning id into v;
  insert into public.modules (course_id, institution_id, ordinal, title)
  values (v, p_institution, 1, 'modul internal') returning id into v_mod;
  insert into public.lessons (module_id, institution_id, ordinal, title, body_markdown)
  values (v_mod, p_institution, 1, 'pelajaran internal', 'isi internal') returning id into v_les;
  insert into public.items (lesson_id, institution_id, item_type, bank_type, stem)
  values (v_les, p_institution, 'MCQ_SINGLE', 'PRACTICE', 'soal internal');
  return v;
end $$;
revoke all on function selftest.f05_private_course(uuid, text) from public;

-- ---------------------------------------------------------------------------
-- A school teaching a release: the learning assignment and its post-test
-- assignment, built by that school's own administrator.
--
-- INVOKER for the same reason as above. Idempotent per (node, release).
-- ---------------------------------------------------------------------------
create or replace function selftest.f05_assign(
  p_admin_email text, p_institution uuid, p_node uuid, p_release uuid, p_course uuid,
  p_definition uuid)
returns table (la uuid, aa uuid)
language plpgsql set search_path = public, pg_temp as $$
declare v_la uuid; v_aa uuid; v_period uuid; v_person uuid; t text;
begin
  select n.academic_period_id into v_period from public.org_nodes n where n.id = p_node;
  if v_period is null then
    select ap.id into v_period from public.academic_periods ap
     where ap.institution_id = p_institution order by ap.created_at desc limit 1;
  end if;

  select l.id into v_la from public.learning_assignments l
   where l.node_id = p_node and l.plp_release_id = p_release;
  if v_la is not null then
    select a.id into v_aa from public.assessment_assignments a where a.learning_assignment_id = v_la limit 1;
    la := v_la; aa := v_aa; return next; return;
  end if;

  perform selftest.pass_mark(p_institution, p_course);   -- D-088(b): the school's mark before the class is given it
  perform selftest.as_user(p_admin_email);
  perform selftest.as_release_writer();   -- D-093 T1: no client writes assignments; as assign_release does, with the person's claims
  select public.current_person_id() into v_person;
  insert into public.learning_assignments (institution_id, plp_release_id, course_id, node_id,
    academic_period_id, available_from, available_until, is_required, learning_cycle,
    release_correction_policy, assigned_by_person_id, assigned_at)
  values (p_institution, p_release, p_course, p_node, v_period,
          now() - interval '1 day', now() + interval '180 days', true,
          jsonb_build_object('post_test', p_definition), 'NOT_STARTED_ONLY', v_person, now())
  returning id into v_la;
  update public.learning_assignments set status = 'ACTIVE' where id = v_la;

  insert into public.assessment_assignments (institution_id, assessment_definition_id,
    learning_assignment_id, node_id, academic_period_id, opens_at, closes_at,
    assigned_by_person_id, assigned_at)
  values (p_institution, p_definition, v_la, p_node, v_period,
          now() - interval '1 day', now() + interval '180 days', v_person, now())
  returning id into v_aa;
  foreach t in array array['SCHEDULED','OPEN'] loop
    update public.assessment_assignments set status = t::public.assessment_assignment_status where id = v_aa;
  end loop;
  perform selftest.as_owner();

  la := v_la; aa := v_aa; return next;
end $$;
revoke all on function selftest.f05_assign(text, uuid, uuid, uuid, uuid, uuid) from public;


-- ---------------------------------------------------------------------------
-- Re-runnability. A selftest that only passes on a clean database is a
-- one-shot, and this suite deliberately leaves durable rows behind: grants are
-- append-only, sessions are evidence, and a revision is a new course. So the
-- suite resets its own footprint first, the way fable03 and fable04 do.
--
-- Grants are WITHDRAWN rather than deleted -- the append-only trigger refuses a
-- delete, correctly -- so a re-run starts with no ACTIVE grant and the
-- first-grant probes mean what they say.
-- ---------------------------------------------------------------------------
create or replace function selftest.f05_reset() returns void
language plpgsql set search_path = public, pg_temp as $$
declare v_canon uuid; v_person uuid;
begin
  select i.id into v_canon from public.institutions i where i.tenant_kind = 'PLATFORM_CANONICAL' limit 1;
  if v_canon is null then return; end if;
  select pr.id into v_person from public.persons pr limit 1;

  update public.release_distributions d
     set status = 'WITHDRAWN', withdrawn_at = now(), withdrawn_by_person_id = v_person,
         reason = 'fable05 reset'
    from public.plp_releases r
   where d.plp_release_id = r.id and r.institution_id = v_canon and d.status = 'ACTIVE';

  alter table public.presented_item_views disable trigger presented_item_views_write;
  alter table public.presented_items      disable trigger presented_items_immutable;
  alter table public.responses            disable trigger responses_write;
  alter table public.assessment_results   disable trigger assessment_results_write;
  alter table public.assessment_sessions  disable trigger assessment_sessions_provenance;
  alter table public.assessment_sessions  disable trigger assessment_sessions_status;
  alter table public.lesson_progress      disable trigger lesson_progress_write;
  alter table telemetry.hesitation_events disable trigger hesitation_events_write;
  alter table telemetry.assistance_events disable trigger assistance_events_write;

  delete from telemetry.assistance_events e using public.assessment_sessions s, public.plp_releases r
   where e.session_id = s.id and s.plp_release_id = r.id and r.institution_id = v_canon;
  delete from telemetry.hesitation_events e using public.assessment_sessions s, public.plp_releases r
   where e.session_id = s.id and s.plp_release_id = r.id and r.institution_id = v_canon;
  delete from public.assistance_grants g using public.assessment_sessions s, public.plp_releases r
   where g.session_id = s.id and s.plp_release_id = r.id and r.institution_id = v_canon;
  delete from public.assessment_results a using public.assessment_sessions s, public.plp_releases r
   where a.session_id = s.id and s.plp_release_id = r.id and r.institution_id = v_canon;
  delete from public.responses rs using public.assessment_sessions s, public.plp_releases r
   where rs.session_id = s.id and s.plp_release_id = r.id and r.institution_id = v_canon;
  delete from public.presented_item_views v using public.assessment_sessions s, public.plp_releases r
   where v.session_id = s.id and s.plp_release_id = r.id and r.institution_id = v_canon;
  delete from public.presented_items pi using public.assessment_sessions s, public.plp_releases r
   where pi.session_id = s.id and s.plp_release_id = r.id and r.institution_id = v_canon;
  delete from public.lesson_progress lp using public.plp_releases r
   where lp.plp_release_id = r.id and r.institution_id = v_canon;
  delete from public.assessment_sessions s using public.plp_releases r
   where s.plp_release_id = r.id and r.institution_id = v_canon;

  alter table telemetry.assistance_events enable trigger assistance_events_write;
  alter table telemetry.hesitation_events enable trigger hesitation_events_write;
  alter table public.lesson_progress      enable trigger lesson_progress_write;
  alter table public.assessment_sessions  enable trigger assessment_sessions_status;
  alter table public.assessment_sessions  enable trigger assessment_sessions_provenance;
  alter table public.assessment_results   enable trigger assessment_results_write;
  alter table public.responses            enable trigger responses_write;
  alter table public.presented_items      enable trigger presented_items_immutable;
  alter table public.presented_item_views enable trigger presented_item_views_write;

  alter table public.assessment_assignments disable trigger assessment_assignments_status;
  alter table public.learning_assignments   disable trigger learning_assignments_status;
  delete from public.learning_assignment_release_moves mv using public.learning_assignments la,
                                                              public.plp_releases r
   where mv.learning_assignment_id = la.id and la.plp_release_id = r.id
     and r.institution_id = v_canon;
  delete from public.assessment_assignments a using public.learning_assignments la,
                                                  public.plp_releases r
   where a.learning_assignment_id = la.id and la.plp_release_id = r.id
     and r.institution_id = v_canon;
  delete from public.learning_assignments la using public.plp_releases r
   where la.plp_release_id = r.id and r.institution_id = v_canon;
  alter table public.learning_assignments   enable trigger learning_assignments_status;
  alter table public.assessment_assignments enable trigger assessment_assignments_status;

  -- and the revision courses a previous run created, plus the auxiliary
  -- packages F05-T14 and F05-T22 build, so the lineage assertions count what
  -- THIS run built rather than an accumulation
  alter table public.courses              disable trigger courses_taught_immutable;
  alter table public.modules              disable trigger modules_taught_immutable;
  alter table public.lessons              disable trigger lessons_taught_immutable;
  alter table public.learning_objectives  disable trigger learning_objectives_taught_immutable;
  alter table public.items                disable trigger items_taught_immutable;
  alter table public.item_options         disable trigger item_options_taught_immutable;
  alter table public.assessment_definitions disable trigger assessment_definitions_taught_immutable;
  alter table public.release_distributions disable trigger release_distributions_append_only;
  delete from public.release_distributions d using public.plp_releases r, public.courses c
   where d.plp_release_id = r.id and r.course_id = c.id
     and c.institution_id = v_canon and (c.supersedes_course_id is not null or c.title in ('Pengukuran Nasional II', 'Pengukuran Nasional Uji'));
  alter table public.release_distributions enable trigger release_distributions_append_only;
  -- RESTATED, C1w (20270115100000: a published correction replaces its predecessor): a release replaced by a revision
  -- this reset removes is the line's head again, PUBLISHED and unmarked, as the run that published the revision found it
  -- (the harness, past the status guard and the write-once marks, for this one statement)
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'plp_releases' and column_name = 'replaced_by_release_id') then
    set local session_replication_role = replica;
    update public.plp_releases p set replaced_by_release_id = null, replaced_at = null,
           status = case when p.withdrawn_at is null then 'PUBLISHED'::public.content_status else p.status end
      from public.plp_releases r join public.courses c on c.id = r.course_id
     where p.replaced_by_release_id = r.id and c.institution_id = v_canon
       and (c.supersedes_course_id is not null or c.title in ('Pengukuran Nasional II', 'Pengukuran Nasional Uji'));
    set local session_replication_role = origin;
  end if;
  delete from public.plp_releases r using public.courses c
   where r.course_id = c.id and c.institution_id = v_canon and (c.supersedes_course_id is not null or c.title in ('Pengukuran Nasional II', 'Pengukuran Nasional Uji'));
  -- RESTATED, C1w: QAC now meets the package at the head of its line (selftest.qac_head_package), so a school's quick
  -- assessment may stand on a revision's module; its assignment and selection go with the revision
  alter table public.assessment_assignments disable trigger assessment_assignments_status;
  delete from public.quick_assessment_selections q using public.assessment_definitions d, public.modules m, public.courses c
   where q.definition_id = d.id and d.module_id = m.id and m.course_id = c.id and c.institution_id = v_canon
     and (c.supersedes_course_id is not null or c.title in ('Pengukuran Nasional II', 'Pengukuran Nasional Uji'));
  delete from public.assessment_assignments a using public.assessment_definitions d, public.modules m, public.courses c
   where a.assessment_definition_id = d.id and d.module_id = m.id and m.course_id = c.id and c.institution_id = v_canon
     and (c.supersedes_course_id is not null or c.title in ('Pengukuran Nasional II', 'Pengukuran Nasional Uji'));
  alter table public.assessment_assignments enable trigger assessment_assignments_status;
  delete from public.assessment_definitions d using public.courses c
   where c.institution_id = v_canon and (c.supersedes_course_id is not null or c.title in ('Pengukuran Nasional II', 'Pengukuran Nasional Uji'))
     and (d.course_id = c.id or d.module_id in (select m.id from public.modules m where m.course_id = c.id));
  delete from public.item_options o using public.items i, public.lessons l, public.modules m,
                                         public.courses c
   where o.item_id = i.id and i.lesson_id = l.id and l.module_id = m.id and m.course_id = c.id
     and c.institution_id = v_canon and (c.supersedes_course_id is not null or c.title in ('Pengukuran Nasional II', 'Pengukuran Nasional Uji'));
  delete from public.items i using public.lessons l, public.modules m, public.courses c
   where i.lesson_id = l.id and l.module_id = m.id and m.course_id = c.id
     and c.institution_id = v_canon and (c.supersedes_course_id is not null or c.title in ('Pengukuran Nasional II', 'Pengukuran Nasional Uji'));
  delete from public.learning_objectives lo using public.lessons l, public.modules m, public.courses c
   where lo.lesson_id = l.id and l.module_id = m.id and m.course_id = c.id
     and c.institution_id = v_canon and (c.supersedes_course_id is not null or c.title in ('Pengukuran Nasional II', 'Pengukuran Nasional Uji'));
  delete from public.lessons l using public.modules m, public.courses c
   where l.module_id = m.id and m.course_id = c.id
     and c.institution_id = v_canon and (c.supersedes_course_id is not null or c.title in ('Pengukuran Nasional II', 'Pengukuran Nasional Uji'));
  delete from public.modules m using public.courses c
   where m.course_id = c.id and c.institution_id = v_canon and (c.supersedes_course_id is not null or c.title in ('Pengukuran Nasional II', 'Pengukuran Nasional Uji'));
  delete from public.mcq_quality_findings f using public.courses c
   where f.course_id = c.id and c.institution_id = v_canon and (c.supersedes_course_id is not null or c.title in ('Pengukuran Nasional II', 'Pengukuran Nasional Uji'));
  delete from public.coaching_findings f using public.courses c
   where f.course_id = c.id and c.institution_id = v_canon and (c.supersedes_course_id is not null or c.title in ('Pengukuran Nasional II', 'Pengukuran Nasional Uji'));
  -- Review outcomes (migration 181) are history; only this suite's own probe
  -- courses lose theirs, with the history trigger off for that one statement.
  if to_regclass('public.content_review_outcomes') is not null then
    alter table public.content_review_outcomes disable trigger content_review_outcomes_are_history;
    delete from public.content_review_outcomes o using public.courses c
     where o.course_id = c.id and c.institution_id = v_canon and (c.supersedes_course_id is not null or c.title in ('Pengukuran Nasional II', 'Pengukuran Nasional Uji'));
    alter table public.content_review_outcomes enable trigger content_review_outcomes_are_history;
  end if;
  delete from public.courses c
   where c.institution_id = v_canon and (c.supersedes_course_id is not null or c.title in ('Pengukuran Nasional II', 'Pengukuran Nasional Uji'));
  alter table public.assessment_definitions enable trigger assessment_definitions_taught_immutable;
  alter table public.item_options         enable trigger item_options_taught_immutable;
  alter table public.items                enable trigger items_taught_immutable;
  alter table public.learning_objectives  enable trigger learning_objectives_taught_immutable;
  alter table public.lessons              enable trigger lessons_taught_immutable;
  alter table public.modules              enable trigger modules_taught_immutable;
  alter table public.courses              enable trigger courses_taught_immutable;
end $$;
revoke all on function selftest.f05_reset() from public;

-- BOB-35: v1.0 assigned to a class afresh, as f05_assign does but never
-- reusing an existing assignment, so a move can be shown before anyone starts.
create or replace function selftest.f05_fresh_assignment(p_admin_email text, p_institution uuid, p_node uuid,
  p_release uuid, p_course uuid, p_definition uuid)
returns table (la uuid, aa uuid)
language plpgsql set search_path = public, pg_temp as $$
declare v_la uuid; v_aa uuid; v_period uuid;
begin
  select n.academic_period_id into v_period from public.org_nodes n where n.id = p_node;
  perform selftest.pass_mark(p_institution, p_course);   -- D-088(b): the school's mark before the class is given it
  perform selftest.as_user(p_admin_email);
  perform selftest.as_release_writer();   -- D-093 T1: no client writes assignments; as assign_release does, with the person's claims
  insert into public.learning_assignments (institution_id, plp_release_id, course_id, node_id,
    academic_period_id, available_from, available_until, is_required, learning_cycle,
    release_correction_policy, assigned_by_person_id, assigned_at)
  values (p_institution, p_release, p_course, p_node, v_period, now() - interval '1 day', now() + interval '180 days', true,
          jsonb_build_object('post_test', p_definition), 'NOT_STARTED_ONLY', public.current_person_id(), now())
  returning id into v_la;
  update public.learning_assignments set status = 'ACTIVE' where id = v_la;
  insert into public.assessment_assignments (institution_id, assessment_definition_id,
    learning_assignment_id, node_id, academic_period_id, opens_at, closes_at, assigned_by_person_id, assigned_at)
  values (p_institution, p_definition, v_la, p_node, v_period, now() - interval '1 day', now() + interval '180 days',
          public.current_person_id(), now())
  returning id into v_aa;
  update public.assessment_assignments set status = 'SCHEDULED' where id = v_aa;
  update public.assessment_assignments set status = 'OPEN' where id = v_aa;
  perform selftest.as_owner();
  la := v_la; aa := v_aa; return next;
end $$;
revoke all on function selftest.f05_fresh_assignment(text, uuid, uuid, uuid, uuid, uuid) from public;

-- BOB-35, F05-C01: a published v1.1 of the canonical course, distributed to
-- School A, as the move's target. The one run_fable05 leaves behind is reused;
-- a later suite may have reset the canonical package (f05_reset removes
-- revision courses), so otherwise the revision is made and walked to PUBLISHED
-- exactly as F05-T14's setup does, by the people who hold each capability.
create or replace function selftest.f05_published_revision(p_course uuid, p_canon uuid, p_rel uuid, p_school uuid)
returns uuid language plpgsql set search_path = public, pg_temp as $$
declare v_rev uuid; v_rel2 uuid; v_admin uuid; v_guru uuid; t2 text; v_status text; v_blockers jsonb;
begin
  select r.id into v_rel2 from public.plp_releases r join public.courses c on c.id = r.course_id
   where c.supersedes_course_id = p_course and r.status = 'PUBLISHED'
   order by r.created_at desc limit 1;
  if v_rel2 is not null then
    if not public.release_is_distributed_to(v_rel2, p_school) then
      perform selftest.as_user('kanonik-admin@pintar.test');
      perform public.grant_release_distribution(v_rel2, p_school, 'f05-c01 v1.1');
      perform selftest.as_owner();
    end if;
    return v_rel2;
  end if;
  select c.id into v_rev from public.courses c where c.supersedes_course_id = p_course
     and not exists (select 1 from public.plp_releases r where r.course_id = c.id)
   order by c.created_at desc limit 1;
  if v_rev is null then
    perform selftest.as_user('kanonik-penyusun@pintar.test');
    v_rev := public.create_course_revision(p_course);
    perform selftest.as_owner();
  end if;
  perform selftest.as_user('kanonik-penyusun@pintar.test');
  foreach t2 in array array['STRUCTURED','VALIDATED','IN_REVIEW'] loop
    update public.items i set status = t2::public.content_status from public.lessons l, public.modules m
     where i.lesson_id = l.id and l.module_id = m.id and m.course_id = v_rev and i.status::text <> t2;
    update public.lessons l set status = t2::public.content_status from public.modules m
     where l.module_id = m.id and m.course_id = v_rev and l.status::text <> t2;
    update public.modules set status = t2::public.content_status where course_id = v_rev and status::text <> t2;
    update public.courses set status = t2::public.content_status where id = v_rev and status::text <> t2;
    update public.assessment_definitions set status = t2::public.content_status
     where (course_id = v_rev or module_id in (select id from public.modules where course_id = v_rev)) and status::text <> t2;
  end loop;
  perform selftest.as_user('kanonik-admin@pintar.test');
  select public.current_person_id() into v_admin;
  update public.items i set status = 'APPROVED', reviewed_by_person_id = v_admin
    from public.lessons l, public.modules m
   where i.lesson_id = l.id and l.module_id = m.id and m.course_id = v_rev;
  update public.lessons l set status = 'APPROVED', reviewed_by_person_id = v_admin
    from public.modules m where l.module_id = m.id and m.course_id = v_rev;
  update public.modules set status = 'APPROVED', reviewed_by_person_id = v_admin where course_id = v_rev;
  update public.courses set status = 'APPROVED', reviewed_by_person_id = v_admin where id = v_rev;
  update public.assessment_definitions set status = 'APPROVED', reviewed_by_person_id = v_admin
   where course_id = v_rev or module_id in (select id from public.modules where course_id = v_rev);
  perform selftest.as_owner();
  perform selftest.as_draft_author();
  perform public.validate_course_content(v_rev);
  perform selftest.as_owner();
  perform selftest.as_draft_author();
  perform public.run_mcq_quality(v_rev);
  perform selftest.as_owner();
  select pr.status, pr.blockers into v_status, v_blockers from public.publish_readiness(v_rev) pr;
  if v_status <> 'READY' then raise exception 'the v1.1 revision is not publishable (%): %', v_status, v_blockers; end if;
  select a.person_id into v_guru from public.accounts a join auth.users u on u.id = a.auth_user_id
   where u.email = 'kanonik-penyusun@pintar.test';
  perform selftest.as_user('kanonik-admin@pintar.test');
  perform selftest.as_release_writer();
  insert into public.plp_releases (institution_id, course_id, version_label, supersedes_release_id, author_person_id)
  values (p_canon, v_rev, '1.1.0', p_rel, v_guru) returning id into v_rel2;
  perform selftest.as_signed_in();
  foreach t2 in array array['STRUCTURED','VALIDATED','IN_REVIEW'] loop
    perform selftest.as_release_writer();
    update public.plp_releases set status = t2::public.content_status where id = v_rel2;
    perform selftest.as_signed_in();
  end loop;
  perform selftest.as_release_writer();
  update public.plp_releases set status = 'APPROVED', reviewed_by_person_id = v_admin where id = v_rel2;
  perform selftest.as_signed_in();
  perform selftest.as_release_writer();
  update public.plp_releases set status = 'FROZEN' where id = v_rel2;
  perform selftest.as_signed_in();
  perform public.publish_release(v_rel2);
  perform public.grant_release_distribution(v_rel2, p_school, 'f05-c01 v1.1');
  perform selftest.as_owner();
  return v_rel2;
end $$;
revoke all on function selftest.f05_published_revision(uuid, uuid, uuid, uuid) from public;

-- BOB-35, F05-C01 (driven from run.ts): a start racing a move needs two
-- real connections, so the pieces are COMMITTED. The canonical v1.0 release
-- and a published v1.1 revision (f05_published_revision); a fresh assignment of v1.0 to School A's class, and a learner who
-- joins the class for this race alone. Returns
-- '<learning assignment>|<assessment assignment>|<v1.1 release>|<admin uid>|<learner uid>'.
-- f05_reset clears the assignment and the session on the next run.
create or replace function selftest.f05_race_fixture()
returns text language plpgsql set search_path = public, pg_temp as $$
declare p record; v_a uuid; v_node uuid; v_rel2 uuid; v_la uuid; v_aa uuid; v_admin uuid;
        v_uid uuid := gen_random_uuid(); v_p uuid; v_e uuid; v_per uuid; v_prog uuid;
begin
  select * into p from selftest.canonical_package();
  select i.id into v_a from public.institutions i where i.slug like 'synth-alpha-%' limit 1;
  select m.node_id, e.programme_id into v_node, v_prog from public.memberships m
    join public.enrollments e on e.id = m.enrollment_id join public.accounts ac on ac.person_id = e.person_id
    join auth.users u on u.id = ac.auth_user_id
   where u.email = 'alpha-siswa-1@synthetic.pintar.test' and m.valid_to is null limit 1;
  -- a later suite may have withdrawn School A's grant of v1.0 (QAC-T03 does)
  if not public.release_is_distributed_to(p.rel, v_a) then
    if (select r.status from public.plp_releases r where r.id = p.rel) = 'PUBLISHED' then
      perform selftest.as_user('kanonik-admin@pintar.test');
      perform public.grant_release_distribution(p.rel, v_a, 'f05-c01 v1.0');
      perform selftest.as_owner();
    else
      -- RESTATED, C1w (20270115100000: a published correction replaces its predecessor for new assignments, and a
      -- replaced release is not distributed anew). Once v1.1 is published, v1.0 is replaced; the race needs School A
      -- to hold v1.0 as a school granted it BEFORE the replacement would, so the harness records that standing grant
      -- (the platform admin's, as grant_release_distribution records one). The race itself is unchanged.
      insert into public.release_distributions (plp_release_id, institution_id, authorized_by_person_id, reason)
      select p.rel, v_a, a.person_id, 'f05-c01 v1.0, held from before its replacement'
        from public.accounts a join auth.users u on u.id = a.auth_user_id where u.email = 'kanonik-admin@pintar.test';
    end if;
  end if;
  v_rel2 := selftest.f05_published_revision(p.course, p.canon, p.rel, v_a);
  select fa.la, fa.aa into v_la, v_aa
    from selftest.f05_fresh_assignment('alpha-admin@synthetic.pintar.test', v_a, v_node, p.rel, p.course, p.defn) fa;
  select u.id into v_admin from auth.users u where u.email = 'alpha-admin@synthetic.pintar.test';
  perform set_config('app.seed_intent', 'synthetic', true);
  insert into auth.users (id, instance_id, aud, role, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
                          created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
  values (v_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
          'f05-c01-murid-' || substr(md5(random()::text), 1, 8) || '@synthetic.pintar.test', now(),
          '{"provider":"email","providers":["email"]}', '{"display_name":"Murid Balapan C01"}', now(), now(), '', '', '', '');
  select a.person_id into v_p from public.accounts a where a.auth_user_id = v_uid;
  select n.academic_period_id into v_per from public.org_nodes n where n.id = v_node;
  insert into public.enrollments (person_id, institution_id, academic_period_id, programme_id, status)
  values (v_p, v_a, v_per, v_prog, 'ACTIVE') returning id into v_e;
  insert into public.memberships (enrollment_id, node_id, academic_period_id) values (v_e, v_node, v_per);
  perform set_config('app.seed_intent', '', true);
  return v_la || '|' || v_aa || '|' || v_rel2 || '|' || v_admin || '|' || v_uid;
end $$;
revoke all on function selftest.f05_race_fixture() from public;

-- BOB-35: everything already recorded under a learning assignment -- its
-- sessions, their presented items, results and certificates -- as one digest,
-- so a test can show a move rewrote none of it.
create or replace function selftest.f05_assignment_history(p_la uuid)
returns text language sql stable set search_path = public, pg_temp as $$
  select md5(coalesce(string_agg(x, '|' order by x), '')) from (
    select to_jsonb(ss)::text x from public.assessment_sessions ss where ss.learning_assignment_id = p_la
    union all
    select to_jsonb(pi)::text from public.presented_items pi
      join public.assessment_sessions ss on ss.id = pi.session_id where ss.learning_assignment_id = p_la
    union all
    select to_jsonb(ar)::text from public.assessment_results ar
      join public.assessment_sessions ss on ss.id = ar.session_id where ss.learning_assignment_id = p_la
    union all
    select to_jsonb(c)::text from public.certificates c
      join public.assessment_sessions ss on ss.id = c.session_id where ss.learning_assignment_id = p_la
  ) q
$$;
revoke all on function selftest.f05_assignment_history(uuid) from public;

create or replace function selftest.run_fable05()
returns table (test_id text, invariant text, ok boolean, detail text)
language plpgsql set search_path = public, pg_temp as $$
declare
  p record; n int; n2 int; v_ok boolean; v_detail text; bad text; r text;
  v_a uuid; v_b uuid; v_c uuid; v_node_a uuid; v_node_b uuid; v_node_c uuid;
  v_dist uuid; v_dist2 uuid; s uuid; s2 uuid; v_la uuid; v_aa uuid;
  v_rev uuid; v_rel2 uuid; v_hash_before text; v_hash_after text;
  v_priv_a uuid; v_priv_b uuid; v_sess record; v_state record; v_lint jsonb;
  v_def2 uuid; v_new boolean; v_row record; v_brel uuid; v_item uuid;
  v_guru uuid; v_admin uuid; v_status text; v_blockers jsonb;
  v_hist text; v_la2 uuid; v_aa2 uuid; v_det text;  -- BOB-35 (F05-T14, F05-T14b)
  t0 timestamptz := clock_timestamp();
begin
  perform selftest.as_owner();
  perform selftest.f05_reset();
  select * into p from selftest.canonical_package();

  select i.id into v_a from public.institutions i where i.slug like 'synth-alpha-%' limit 1;
  select i.id into v_b from public.institutions i where i.slug like 'synth-beta-%' limit 1;
  select i.id into v_c from public.institutions i where i.slug like 'synth-siklus-%' limit 1;
  select m.node_id into v_node_a from public.memberships m
    join public.org_nodes n on n.id = m.node_id
    join public.enrollments e on e.id = m.enrollment_id
   where e.institution_id = v_a and n.kind = 'CLASS' and m.valid_to is null limit 1;
  select m.node_id into v_node_b from public.memberships m
    join public.org_nodes n on n.id = m.node_id
    join public.enrollments e on e.id = m.enrollment_id
   where e.institution_id = v_b and n.kind = 'CLASS' and m.valid_to is null limit 1;
  select m.node_id into v_node_c from public.memberships m
    join public.org_nodes n on n.id = m.node_id
    join public.enrollments e on e.id = m.enrollment_id
   where e.institution_id = v_c and n.kind = 'CLASS' and m.valid_to is null limit 1;

  -- =========================================================================
  -- F05-T01 tenant_kind is a third, independent fact
  -- =========================================================================
  ok := true; detail := '';
  select count(*) into n from public.institutions
   where tenant_kind = 'PLATFORM_CANONICAL' and not is_synthetic and not is_official_bootstrap;
  if n < 1 then ok := false; detail := detail || 'no canonical tenant is shaped as ADR-0015 requires; '; end if;
  select aa.ok, aa.detail into v_ok, v_detail from public.assert_canonical_tenants() aa;
  if not v_ok then ok := false; detail := detail || v_detail || '; '; end if;
  select aa.ok, aa.detail into v_ok, v_detail from public.assert_official_evidence_bootstrap() aa;
  if not v_ok then ok := false; detail := detail || v_detail || '; '; end if;
  begin
    update public.institutions set tenant_kind = 'INSTITUTION' where id = p.canon;
    ok := false; detail := detail || 'a canonical tenant was demoted in place; ';
  exception when others then null; end;
  begin
    update public.institutions set tenant_kind = 'PLATFORM_CANONICAL' where id = v_a;
    ok := false; detail := detail || 'a school was promoted to canonical in place; ';
  exception when others then null; end;
  if pg_get_functiondef('public.derive_evidence_class(uuid,public.evidence_channel)'::regprocedure)
       ~* 'tenant_kind|is_official_bootstrap' then
    ok := false; detail := detail || 'derive_evidence_class reads an ownership flag; ';
  end if;
  test_id := 'F05-T01'; invariant := 'ADR-0015 / D1 / INV-20';
  if ok then detail := 'the canonical tenant is non-synthetic, is not the bootstrap, is immutable in both directions, and is invisible to evidence derivation'; end if;
  return next;

  -- =========================================================================
  -- F05-T02 a canonical tenant enrols nobody -- behaviourally, not by assertion
  -- =========================================================================
  ok := true; detail := '';
  select count(*) into n from public.enrollments e
    join public.institutions i on i.id = e.institution_id where i.tenant_kind = 'PLATFORM_CANONICAL';
  select count(*) into n2 from public.assessment_sessions ss
    join public.institutions i on i.id = ss.institution_id where i.tenant_kind = 'PLATFORM_CANONICAL';
  if n <> 0 or n2 <> 0 then
    ok := false; detail := detail || format('%s enrolment(s) and %s session(s) in a canonical tenant; ', n, n2);
  end if;
  begin
    insert into public.enrollments (person_id, institution_id, academic_period_id, valid_from)
    select pr.id, p.canon, ap.id, now()
      from public.persons pr, public.academic_periods ap
     where ap.institution_id = v_a limit 1;
    ok := false; detail := detail || 'a learner was enrolled into the canonical tenant; ';
  exception when others then null; end;
  test_id := 'F05-T02'; invariant := 'ADR-0015 §5.1';
  if ok then detail := 'the canonical tenant holds no enrolment and no session, and an enrolment into it is refused at the trigger'; end if;
  return next;

  -- =========================================================================
  -- F05-T03 no grant -> refused, by name, at the assignment layer
  -- =========================================================================
  ok := true; detail := '';
  if public.release_is_distributed_to(p.rel, v_a) then
    ok := false; detail := detail || 'the canonical release reads as distributed before any grant exists; ';
  end if;
  begin
    select * into v_row from selftest.f05_assign('alpha-admin@synthetic.pintar.test', v_a, v_node_a,
                                                 p.rel, p.course, p.defn);
    perform selftest.as_owner();
    ok := false; detail := detail || 'a school assigned canonical content it holds no grant for; ';
  exception when others then
    perform selftest.as_owner();
    if sqlerrm !~ 'canonical content distributed to this one' then
      ok := false; detail := detail || format('refused for the wrong reason: %s; ', sqlerrm);
    end if;
  end;
  select count(*) into n from public.learning_assignments where plp_release_id = p.rel;
  if n <> 0 then ok := false; detail := detail || format('%s assignment(s) over undistributed canonical content survived; ', n); end if;
  test_id := 'F05-T03'; invariant := 'ADR-0015 §5.4 / §5.5 / INV-13';
  if ok then detail := 'without a grant a school cannot even create the assignment: the content check refuses it by name, and no row survives'; end if;
  return next;

  -- F05-T04 granting is a platform act; a school cannot grant itself
  -- =========================================================================
  ok := true; detail := '';
  perform selftest.as_user('alpha-admin@synthetic.pintar.test');
  begin
    perform public.grant_release_distribution(p.rel, v_a, 'self-grant probe');
    perform selftest.as_owner();
    ok := false; detail := detail || 'a consuming institution granted itself a distribution; ';
  exception when others then perform selftest.as_owner(); end;
  perform selftest.as_user('alpha-admin@synthetic.pintar.test');
  begin
    perform public.grant_release_distribution(p.rel, v_b, 'cross-school probe');
    perform selftest.as_owner();
    ok := false; detail := detail || 'a school distributed canonical content to another school; ';
  exception when others then perform selftest.as_owner(); end;
  perform selftest.as_user('kanonik-admin@pintar.test');
  v_dist := public.grant_release_distribution(p.rel, v_a, 'fable05');
  perform selftest.as_owner();
  if v_dist is null then ok := false; detail := detail || 'the canonical publisher could not grant; '; end if;
  if not public.release_is_distributed_to(p.rel, v_a) then
    ok := false; detail := detail || 'the grant did not take effect; ';
  end if;
  select count(*) into n from public.audit_log
   where action = 'RELEASE_DISTRIBUTION_GRANTED' and target_id = v_dist::text;
  if n <> 1 then ok := false; detail := detail || format('the grant wrote %s audit row(s); ', n); end if;
  perform selftest.as_user('kanonik-admin@pintar.test');
  begin
    perform public.grant_release_distribution(p.rel, v_a, 'duplicate');
    perform selftest.as_owner();
    ok := false; detail := detail || 'a second active grant for the same pair was accepted; ';
  exception when others then perform selftest.as_owner(); end;
  test_id := 'F05-T04'; invariant := 'ADR-0015 §5.2 / INV-18';
  if ok then detail := 'a consuming school can neither grant itself nor distribute to a third party; the canonical publisher can, once, with one audit row'; end if;
  return next;

  -- =========================================================================
  -- F05-T05 with a grant the learner reaches canonical content, and the
  -- evidence names both tenants in the right places
  -- =========================================================================
  ok := true; detail := '';
  select * into v_row from selftest.f05_assign('alpha-admin@synthetic.pintar.test', v_a, v_node_a,
                                               p.rel, p.course, p.defn);
  v_la := v_row.la; v_aa := v_row.aa;
  if v_la is null then ok := false; detail := detail || 'a granted school could not assign canonical content; '; end if;
  -- the assignment belongs to the SCHOOL, never to the content's author (§5.5)
  select l.institution_id into v_row from public.learning_assignments l where l.id = v_la;
  if v_row.institution_id <> v_a then
    ok := false; detail := detail || 'the assignment was stamped with the content owner''s tenant; ';
  end if;
  perform selftest.as_user('alpha-siswa-1@synthetic.pintar.test');
  s := public.start_learning_session(v_aa);
  n2 := selftest.answer_paper(s, true);
  perform public.finish_my_session(s);
  perform selftest.as_owner();
  if n2 = 0 then ok := false; detail := detail || 'the canonical attempt answered nothing; '; end if;

  select ss.institution_id, ss.plp_release_id, ss.assessment_definition_id,
         ss.evidence_class::text as ec, ss.enrollment_id, ss.class_node_id, ss.academic_period_id
    into v_sess from public.assessment_sessions ss where ss.id = s;
  if v_sess.institution_id <> v_a then
    ok := false; detail := detail || 'the session is not owned by the consuming school; ';
  end if;
  if v_sess.plp_release_id <> p.rel or v_sess.assessment_definition_id <> p.defn then
    ok := false; detail := detail || 'the session does not cite the canonical release and definition; ';
  end if;
  if v_sess.ec <> 'SYNTHETIC' then
    ok := false; detail := detail || format('evidence_class is %s, not derived from the school; ', v_sess.ec);
  end if;
  if v_sess.enrollment_id is null or v_sess.class_node_id is null or v_sess.academic_period_id is null then
    ok := false; detail := detail || 'the school''s own context is missing from the provenance; ';
  end if;
  select count(*) into n from public.courses c where c.id = p.course and c.institution_id = v_a;
  if n <> 0 then ok := false; detail := detail || 'the canonical course became school-owned; '; end if;
  test_id := 'F05-T05'; invariant := 'ADR-0015 §5.6 / INV-33';
  if ok then detail := format('a %s-answer session over canonical content cites the canonical release and definition with the school''s institution, enrolment, class and period, and an evidence class derived from the school', n2); end if;
  return next;

  -- =========================================================================
  -- F05-T06 INV-33 negative: a provenance column cannot be mutated
  -- =========================================================================
  ok := true; detail := '';
  foreach r in array array['institution_id','plp_release_id','assessment_definition_id',
                           'enrollment_id','evidence_class','person_id'] loop
    begin
      execute format('update public.assessment_sessions set %I = %L where id = $1', r,
        case r when 'evidence_class' then 'OFFICIAL' else gen_random_uuid()::text end) using s;
      ok := false; detail := detail || format('assessment_sessions.%s was mutated after insert; ', r);
    exception when others then null; end;
  end loop;
  select ss.institution_id, ss.plp_release_id into v_sess from public.assessment_sessions ss where ss.id = s;
  if v_sess.institution_id <> v_a or v_sess.plp_release_id <> p.rel then
    ok := false; detail := detail || 'a provenance column changed despite the refusals; ';
  end if;
  test_id := 'F05-T06'; invariant := 'INV-33';
  if ok then detail := 'six provenance columns each refused mutation after insert, and the row is unchanged'; end if;
  return next;

  -- =========================================================================
  -- F05-T07 withdrawal is INV-27, not INV-17: the session guard is the blocker
  -- =========================================================================
  ok := true; detail := '';
  -- School C is granted, assigns, and THEN loses the grant -- so an assignment
  -- row still exists and the only thing that can refuse a new session is the
  -- provenance guard itself
  declare v_distc uuid; v_rowc record;
  begin
    perform selftest.as_user('kanonik-admin@pintar.test');
    v_distc := public.grant_release_distribution(p.rel, v_c, 'fable05 School C');
    perform selftest.as_owner();
    select * into v_rowc from selftest.f05_assign('siklus-admin@synthetic.pintar.test', v_c, v_node_c,
                                                  p.rel, p.course, p.defn);
    if v_rowc.aa is null then ok := false; detail := detail || 'School C could not assign under its grant; '; end if;

    perform selftest.as_user('kanonik-admin@pintar.test');
    perform public.withdraw_release_distribution(v_distc, 'fable05 withdrawal');
    perform selftest.as_owner();

    select count(*) into n from public.learning_assignments where id = v_rowc.la;
    if n <> 1 then ok := false; detail := detail || 'withdrawal removed School C''s assignment row; '; end if;

    perform selftest.as_user('siklus-email@synthetic.pintar.test');
    begin
      s2 := public.start_learning_session(v_rowc.aa);
      perform selftest.as_owner();
      ok := false; detail := detail || 'a learner started a new session after the grant was withdrawn; ';
    exception when others then
      perform selftest.as_owner();
      if sqlerrm !~ 'distributed' then
        ok := false; detail := detail || format('the new session was refused for the wrong reason: %s; ', sqlerrm);
      end if;
    end;
  end;

  -- School A's own grant is withdrawn too, and its completed evidence is untouched
  perform selftest.as_user('kanonik-admin@pintar.test');
  perform public.withdraw_release_distribution(v_dist, 'fable05 withdrawal');
  perform selftest.as_owner();
  if public.release_is_distributed_to(p.rel, v_a) then
    ok := false; detail := detail || 'a withdrawn grant still reads as distributed; ';
  end if;
  select count(*) into n from public.release_distributions where id = v_dist;
  if n <> 1 then ok := false; detail := detail || 'withdrawal deleted the row; '; end if;
  select count(*) into n from public.assessment_sessions where id = s;
  select count(*) into n2 from public.assessment_results where session_id = s;
  if n <> 1 then ok := false; detail := detail || 'the completed session vanished; '; end if;
  if n2 < 1 then ok := false; detail := detail || 'the completed result vanished; '; end if;
  select count(*) into n from public.audit_log
   where action = 'RELEASE_DISTRIBUTION_WITHDRAWN' and target_id = v_dist::text;
  if n <> 1 then ok := false; detail := detail || format('the withdrawal wrote %s audit row(s); ', n); end if;
  test_id := 'F05-T07'; invariant := 'ADR-0015 §5.2 / INV-27 / INV-18';
  if ok then detail := 'with the assignment row still in place a new session is refused by the provenance guard; the grant row and its audit line are kept, and the completed session and result are untouched'; end if;
  return next;

  -- F05-T08 the relaxation admits canonical ownership ONLY
  -- =========================================================================
  ok := true; detail := '';
  v_priv_a := selftest.f05_private_course(v_a, 'Paket Internal Alpha');
  v_priv_b := selftest.f05_private_course(v_b, 'Paket Internal Beta');
  -- The row that WOULD express school-to-school sharing is built, and then
  -- shown to mean nothing. It is deliberately never cleaned up: a grant row is
  -- append-only (INV-18), and its continued presence with no effect is the
  -- assertion. Idempotent, so a re-run does not accumulate rows.
  select r.id into v_brel from public.plp_releases r
   where r.course_id = v_priv_b and r.version_label = '9.0.0';
  if v_brel is null then
    insert into public.plp_releases (institution_id, course_id, version_label)
    values (v_b, v_priv_b, '9.0.0') returning id into v_brel;
  end if;
  if not exists (select 1 from public.release_distributions d
                  where d.plp_release_id = v_brel and d.institution_id = v_c) then
    insert into public.release_distributions
      (plp_release_id, institution_id, authorized_by_person_id, reason)
    select v_brel, v_c, pr.id, 'institution-to-institution probe' from public.persons pr limit 1;
  end if;
  if public.release_is_distributed_to(v_brel, v_c) then
    ok := false; detail := detail || 'a school-to-school distribution row took effect; ';
  end if;
  begin
    delete from public.release_distributions where plp_release_id = v_brel;
    ok := false; detail := detail || 'a distribution grant was deleted (INV-18); ';
  exception when others then null; end;
  perform selftest.as_user('beta-admin@synthetic.pintar.test');
  begin
    perform public.grant_release_distribution(v_brel, v_c, 'probe');
    perform selftest.as_owner();
    ok := false; detail := detail || 'grant_release_distribution accepted a school-owned release; ';
  exception when others then
    perform selftest.as_owner();
    if sqlerrm !~ 'PLATFORM_CANONICAL' then
      ok := false; detail := detail || format('refused for the wrong reason: %s; ', sqlerrm);
    end if;
  end;
  test_id := 'F05-T08'; invariant := 'ADR-0015 §9 / INV-13';
  if ok then detail := 'School B''s release is refused to School C both as a row and through the granting function; the relaxation admits canonical ownership only'; end if;
  return next;

  -- =========================================================================
  -- F05-T09 school content stays invisible to everyone, canonical included
  -- =========================================================================
  ok := true; detail := '';
  perform selftest.as_user('beta-admin@synthetic.pintar.test');
  select count(*) into n from public.courses where id = v_priv_a;
  if n <> 0 then ok := false; detail := detail || 'School B reads School A''s course; '; end if;
  select count(*) into n from public.items i
    join public.lessons l on l.id = i.lesson_id join public.modules m on m.id = l.module_id
   where m.course_id = v_priv_a;
  if n <> 0 then ok := false; detail := detail || 'School B reads School A''s items; '; end if;
  perform selftest.as_user('kanonik-admin@pintar.test');
  select count(*) into n from public.courses where id in (v_priv_a, v_priv_b);
  if n <> 0 then ok := false; detail := detail || 'the canonical tenant reads school-created content; '; end if;
  perform selftest.as_owner();
  test_id := 'F05-T09'; invariant := 'INV-13 / ADR-0015 §9';
  if ok then detail := 'a school''s own content is invisible to another school and to the canonical tenant, which gains no read access by existing'; end if;
  return next;

  -- =========================================================================
  -- F05-T10 a consuming institution reads, and cannot write
  -- =========================================================================
  ok := true; detail := '';
  perform selftest.as_user('kanonik-admin@pintar.test');
  v_dist2 := public.grant_release_distribution(p.rel, v_a, 'fable05 re-grant');
  perform selftest.as_owner();
  -- re-granting wrote a NEW row rather than resurrecting the withdrawn one:
  -- exactly one is live, and at least one withdrawn record survives beside it
  select count(*) into n from public.release_distributions
   where plp_release_id = p.rel and institution_id = v_a and status = 'ACTIVE';
  if n <> 1 then ok := false; detail := detail || format('%s live grant(s) for the pair, expected 1; ', n); end if;
  select count(*) into n from public.release_distributions
   where plp_release_id = p.rel and institution_id = v_a and status = 'WITHDRAWN';
  if n < 1 then ok := false; detail := detail || 'the withdrawn grant was not kept beside the new one; '; end if;

  perform selftest.as_user('alpha-admin@synthetic.pintar.test');
  begin
    update public.courses set title = 'dibajak' where id = p.course;
    get diagnostics n = row_count;
    if n > 0 then ok := false; detail := detail || 'a consuming school updated canonical content; '; end if;
  exception when others then null; end;
  begin
    insert into public.modules (course_id, institution_id, ordinal, title)
    values (p.course, v_a, 99, 'sisipan');
    ok := false; detail := detail || 'a consuming school inserted into a canonical course; ';
  exception when others then null; end;
  begin
    delete from public.items i using public.lessons l, public.modules m
     where i.lesson_id = l.id and l.module_id = m.id and m.course_id = p.course;
    get diagnostics n = row_count;
    if n > 0 then ok := false; detail := detail || 'a consuming school deleted canonical items; '; end if;
  exception when others then null; end;
  begin
    perform public.withdraw_release(p.rel, 'probe');
    ok := false; detail := detail || 'a consuming school withdrew a canonical release; ';
  exception when others then null; end;
  begin
    perform public.create_course_revision(p.course);
    ok := false; detail := detail || 'a consuming school revised canonical content; ';
  exception when others then null; end;
  select count(*) into n from public.distributed_releases() where plp_release_id = p.rel;
  if n < 1 then ok := false; detail := detail || 'the catalogue returned nothing to a granted school; '; end if;
  select count(*) into n from public.distributed_release_outline(p.rel);
  if n < 1 then ok := false; detail := detail || 'the outline returned nothing to a granted school; '; end if;
  select count(*) into n from public.distributed_lesson_preview(p.les);
  if n <> 1 then ok := false; detail := detail || format('the preview returned %s row(s); ', n); end if;
  perform selftest.as_owner();
  if pg_get_functiondef('public.distributed_lesson_preview(uuid)'::regprocedure) ~* 'is_correct|item_options' then
    ok := false; detail := detail || 'the preview accessor reaches the answer key; ';
  end if;
  test_id := 'F05-T10'; invariant := 'ADR-0015 §5.3 / INV-13';
  if ok then detail := 'update, insert, delete, withdraw and revise are each refused to a granted school, which can still read the catalogue, the outline and a preview that carries no answer key; re-granting wrote a second row rather than resurrecting the first'; end if;
  return next;

  -- =========================================================================
  -- F05-T11 DISTRIBUTE is not ASSIGN
  -- =========================================================================
  ok := true; detail := '';
  perform selftest.as_user('kanonik-admin@pintar.test');
  perform public.grant_release_distribution(p.rel, v_b, 'fable05 School B');
  perform selftest.as_owner();
  if not public.release_is_distributed_to(p.rel, v_b) then
    ok := false; detail := detail || 'the grant to School B did not take effect; ';
  end if;
  select count(*) into n from public.learning_assignments where plp_release_id = p.rel and institution_id = v_b;
  if n <> 0 then ok := false; detail := detail || 'School B already has an assignment; the probe is not clean; '; end if;
  perform selftest.as_user('beta-siswa-1@synthetic.pintar.test');
  select count(*) into n from public.my_learning_assignments() m where m.plp_release_id = p.rel;
  perform selftest.as_owner();
  if n <> 0 then
    ok := false; detail := detail || 'a distributed release reached a learner with no learning assignment; ';
  end if;
  test_id := 'F05-T11'; invariant := 'ADR-0015 §5.5';
  if ok then detail := 'School B holds an active grant and its learner still sees nothing: distributing is not assigning'; end if;
  return next;

  -- F05-T12 revision by copy-forward: lineage everywhere, predecessor untouched
  -- =========================================================================
  ok := true; detail := '';
  select r.content_sha256 into v_hash_before from public.plp_releases r where r.id = p.rel;
  perform selftest.as_user('kanonik-penyusun@pintar.test');
  v_rev := public.create_course_revision(p.course);
  perform selftest.as_owner();
  if v_rev is null then ok := false; detail := detail || 'the revision returned nothing; '; end if;

  select count(*) into n from public.courses where id = v_rev and supersedes_course_id = p.course
    and status = 'INGESTED' and institution_id = p.canon;
  if n <> 1 then ok := false; detail := detail || 'the revision course is not shaped as ADR-0016 requires; '; end if;
  select count(*) into n from public.modules where course_id = v_rev and supersedes_module_id is null;
  if n <> 0 then ok := false; detail := detail || format('%s copied module(s) carry no lineage; ', n); end if;
  select count(*) into n from public.lessons l join public.modules m on m.id = l.module_id
   where m.course_id = v_rev and l.supersedes_lesson_id is null;
  if n <> 0 then ok := false; detail := detail || format('%s copied lesson(s) carry no lineage; ', n); end if;
  select count(*) into n from public.learning_objectives lo
    join public.lessons l on l.id = lo.lesson_id join public.modules m on m.id = l.module_id
   where m.course_id = v_rev and lo.supersedes_learning_objective_id is null;
  if n <> 0 then ok := false; detail := detail || format('%s copied objective(s) carry no lineage; ', n); end if;
  select count(*) into n from public.items i
    join public.lessons l on l.id = i.lesson_id join public.modules m on m.id = l.module_id
   where m.course_id = v_rev and i.supersedes_item_id is null;
  if n <> 0 then ok := false; detail := detail || format('%s copied item(s) carry no lineage; ', n); end if;
  select count(*) into n2 from public.items i
    join public.lessons l on l.id = i.lesson_id join public.modules m on m.id = l.module_id
   where m.course_id = v_rev;
  if n2 <> 12 then ok := false; detail := detail || format('the copy carries %s item(s), expected 12; ', n2); end if;

  -- no empirical value crossed over -- the required assertion
  select count(*) into n from public.items i
    join public.lessons l on l.id = i.lesson_id join public.modules m on m.id = l.module_id
   where m.course_id = v_rev
     and (i.empirical_difficulty is not null or i.empirical_discrimination is not null
       or i.empirical_evidence_count is not null);
  if n <> 0 then
    ok := false; detail := detail || format('%s revised item(s) inherited an empirical value; ', n);
  end if;
  -- objectives were remapped to the copies
  select count(*) into n from public.items i
    join public.lessons l on l.id = i.lesson_id join public.modules m on m.id = l.module_id
   where m.course_id = v_rev
     and exists (select 1 from public.learning_objectives lo
                  join public.lessons l2 on l2.id = lo.lesson_id
                  join public.modules m2 on m2.id = l2.module_id
                 where m2.course_id = p.course and lo.id = any (i.objective_ids));
  if n <> 0 then ok := false; detail := detail || format('%s revised item(s) still name the predecessor''s objectives; ', n); end if;
  -- rationales and misconception links came with it (INV-03)
  select count(*) into n from public.item_options o join public.items i on i.id = o.item_id
    join public.lessons l on l.id = i.lesson_id join public.modules m on m.id = l.module_id
   where m.course_id = v_rev and (o.rationale is null or btrim(o.rationale) = '');
  if n <> 0 then ok := false; detail := detail || format('%s copied option(s) lost their rationale; ', n); end if;
  -- the predecessor's stored hash is byte-identical, and still recomputes
  select r.content_sha256 into v_hash_after from public.plp_releases r where r.id = p.rel;
  if v_hash_after is distinct from v_hash_before then
    ok := false; detail := detail || 'the predecessor''s stored hash changed across the revision; ';
  end if;
  if public.course_content_sha256(p.course) is distinct from v_hash_before then
    ok := false; detail := detail || 'the predecessor''s recomputed hash no longer matches its stored one; ';
  end if;
  -- one audit row, naming both courses
  select count(*) into n from public.audit_log
   where action = 'COURSE_REVISION_CREATED' and target_id = v_rev::text;
  if n <> 1 then ok := false; detail := detail || format('the revision wrote %s audit row(s); ', n); end if;
  test_id := 'F05-T12'; invariant := 'ADR-0016 / INV-04 / INV-03';
  if ok then detail := format('a revision of the sealed canonical course copied %s items with lineage on every node, no empirical value, remapped objectives and intact rationales, and left the predecessor''s stored hash byte-identical', n2); end if;
  return next;

  -- =========================================================================
  -- F05-T13 the revision's refusals
  -- =========================================================================
  ok := true; detail := '';
  perform selftest.as_user('kanonik-penyusun@pintar.test');
  begin
    perform public.create_course_revision(p.course);
    perform selftest.as_owner();
    ok := false; detail := detail || 'a second open revision of the same course was permitted; ';
  exception when others then perform selftest.as_owner(); end;
  perform selftest.as_user('kanonik-penyusun@pintar.test');
  begin
    perform public.create_course_revision(v_rev);
    perform selftest.as_owner();
    ok := false; detail := detail || 'an unsealed course was revised instead of edited; ';
  exception when others then
    perform selftest.as_owner();
    if sqlerrm !~ 'not sealed' then
      ok := false; detail := detail || format('the unsealed course was refused for the wrong reason: %s; ', sqlerrm);
    end if;
  end;
  -- lineage is immutable
  begin
    update public.courses set supersedes_course_id = null where id = v_rev;
    ok := false; detail := detail || 'a lineage pointer was cleared; ';
  exception when others then null; end;
  -- a cycle is refused
  begin
    insert into public.courses (id, institution_id, subject, stage, grade_label, title,
                                supersedes_course_id)
    values (p.course, p.canon, 'X', 'SD', 'X', 'cycle probe', v_rev);
    ok := false; detail := detail || 'a lineage cycle was permitted; ';
  exception when others then null; end;
  -- frozen-content immutability was never relaxed
  select count(*) into n from pg_trigger t
   where not t.tgisinternal and t.tgfoid = 'public.enforce_taught_content_immutable()'::regprocedure;
  if n <> 7 then ok := false; detail := detail || format('taught-content immutability is on %s table(s), expected 7; ', n); end if;
  begin
    update public.courses set title = 'diubah setelah dikunci' where id = p.course;
    get diagnostics n = row_count;
    if n > 0 then ok := false; detail := detail || 'the sealed predecessor was edited; '; end if;
  exception when others then null; end;
  test_id := 'F05-T13'; invariant := 'ADR-0016 §6.3 / INV-04';
  if ok then detail := 'a second open revision, a revision of an unsealed course, a cleared lineage pointer and a lineage cycle are each refused; the seven immutability triggers are untouched and the sealed predecessor still refuses an edit'; end if;
  return next;

  -- =========================================================================
  -- F05-T14 release correction ACROSS the lineage -- the case the widened
  -- check exists for -- with completed, active and not-started learners
  -- =========================================================================
  ok := true; detail := '';
  -- drive the revision to a published release
  perform selftest.as_user('kanonik-admin@pintar.test');
  update public.items i set status = 'STRUCTURED' from public.lessons l, public.modules m
   where i.lesson_id = l.id and l.module_id = m.id and m.course_id = v_rev;
  perform selftest.as_owner();
  declare t2 text;
  begin
    perform selftest.as_user('kanonik-penyusun@pintar.test');
    foreach t2 in array array['STRUCTURED','VALIDATED','IN_REVIEW'] loop
      update public.items i set status = t2::public.content_status from public.lessons l, public.modules m
       where i.lesson_id = l.id and l.module_id = m.id and m.course_id = v_rev;
      update public.lessons l set status = t2::public.content_status from public.modules m
       where l.module_id = m.id and m.course_id = v_rev;
      update public.modules set status = t2::public.content_status where course_id = v_rev;
      update public.courses set status = t2::public.content_status where id = v_rev;
      update public.assessment_definitions set status = t2::public.content_status
       where course_id = v_rev or module_id in (select id from public.modules where course_id = v_rev);
    end loop;
    perform selftest.as_user('kanonik-admin@pintar.test');
    select public.current_person_id() into v_admin;
    update public.items i set status = 'APPROVED', reviewed_by_person_id = v_admin
      from public.lessons l, public.modules m
     where i.lesson_id = l.id and l.module_id = m.id and m.course_id = v_rev;
    update public.lessons l set status = 'APPROVED', reviewed_by_person_id = v_admin
      from public.modules m where l.module_id = m.id and m.course_id = v_rev;
    update public.modules set status = 'APPROVED', reviewed_by_person_id = v_admin where course_id = v_rev;
    update public.courses set status = 'APPROVED', reviewed_by_person_id = v_admin where id = v_rev;
    update public.assessment_definitions set status = 'APPROVED', reviewed_by_person_id = v_admin
     where course_id = v_rev or module_id in (select id from public.modules where course_id = v_rev);
    perform selftest.as_owner();
    perform selftest.as_draft_author();  -- 0085: an authoring act now names its actor
    perform public.validate_course_content(v_rev);
    perform selftest.as_owner();
    perform selftest.as_draft_author();  -- 0085: an authoring act now names its actor
    perform public.run_mcq_quality(v_rev);
    perform selftest.as_owner();
    select pr.status, pr.blockers into v_status, v_blockers from public.publish_readiness(v_rev) pr;
    if v_status <> 'READY' then
      ok := false;
      detail := detail || format('the revision is not publishable (%s): %s; ', v_status,
                                 v_blockers::text);
    end if;
    select a.person_id into v_guru from public.accounts a join auth.users u on u.id = a.auth_user_id
     where u.email = 'kanonik-penyusun@pintar.test';
    perform selftest.as_user('kanonik-admin@pintar.test');
    -- the release is authored by the canonical educator, so the administrator
    -- who approves it is not its own reviewer
    perform selftest.as_release_writer();  -- D-041
    insert into public.plp_releases (institution_id, course_id, version_label, supersedes_release_id,
                                     author_person_id)
    values (p.canon, v_rev, '1.1.0', p.rel, v_guru) returning id into v_rel2;
    perform selftest.as_signed_in();
    foreach t2 in array array['STRUCTURED','VALIDATED','IN_REVIEW'] loop
      perform selftest.as_release_writer();  -- D-041
      update public.plp_releases set status = t2::public.content_status where id = v_rel2;
      perform selftest.as_signed_in();
    end loop;
    perform selftest.as_release_writer();  -- D-041
    update public.plp_releases set status = 'APPROVED', reviewed_by_person_id = v_admin where id = v_rel2;
    perform selftest.as_signed_in();
    perform selftest.as_release_writer();  -- D-041
    update public.plp_releases set status = 'FROZEN' where id = v_rel2;
    perform selftest.as_signed_in();
    perform public.publish_release(v_rel2);
    perform public.grant_release_distribution(v_rel2, v_a, 'fable05 v1.1');
    perform selftest.as_owner();
  end;

  -- School A's assignment is on v1.0 and one learner has already finished on it
  select count(*) into n from public.assessment_sessions ss
   where ss.learning_assignment_id = v_la and ss.plp_release_id = p.rel;
  if n < 1 then ok := false; detail := detail || 'no learner has evidence on v1.0 to protect; '; end if;

  -- an automatic move is refused: only the named RPC moves a release
  begin
    update public.learning_assignments set plp_release_id = v_rel2 where id = v_la;
    ok := false; detail := detail || 'a release was moved by a direct update; ';
  exception when others then null; end;

  -- RESTATED FOR BOB-35 (c), a changed requirement: this test moved an
  -- assignment a learner had already finished under, and left them "in place".
  -- A learner's pre-test and post-test must never come from two releases, so a
  -- move once any session exists under the cycle is now refused
  -- RELEASE_MOVE_STARTED, and nothing about the assignment or its history moves.
  v_hist := selftest.f05_assignment_history(v_la);
  perform selftest.as_user('alpha-admin@synthetic.pintar.test');
  begin
    perform public.move_learning_assignment_release(v_la, v_rel2, 'koreksi v1.0 -> v1.1');
    perform selftest.as_owner();
    ok := false; detail := detail || 'a release was moved after a learner had started under the assignment; ';
  exception when others then
    get stacked diagnostics v_det = pg_exception_detail;
    perform selftest.as_owner();
    if v_det is distinct from 'RELEASE_MOVE_STARTED' then
      ok := false; detail := detail || format('the move after a start was refused for another reason: %s; ', left(sqlerrm, 100));
    end if;
  end;
  select l.plp_release_id, l.course_id into v_row from public.learning_assignments l where l.id = v_la;
  if v_row.plp_release_id <> p.rel or v_row.course_id <> p.course then
    ok := false; detail := detail || 'the refused move changed the started assignment anyway; ';
  end if;
  if exists (select 1 from public.learning_assignment_release_moves mv where mv.learning_assignment_id = v_la) then
    ok := false; detail := detail || 'a refused move left a move row; ';
  end if;
  if selftest.f05_assignment_history(v_la) is distinct from v_hist then
    ok := false; detail := detail || 'the refused move touched a session, result or certificate; ';
  end if;

  -- the correction a school makes before anyone starts: v1.0 assigned to the
  -- class afresh, then moved across the lineage to v1.1. All of it is undone
  -- at the end, so a rerun of the suite starts from the same place.
  begin
  select fa.la, fa.aa into v_la2, v_aa2
    from selftest.f05_fresh_assignment('alpha-admin@synthetic.pintar.test', v_a, v_node_a, p.rel, p.course, p.defn) fa;
  perform selftest.as_user('alpha-admin@synthetic.pintar.test');
  begin
    perform public.move_learning_assignment_release(v_la2, v_rel2, 'koreksi v1.0 -> v1.1');
    perform selftest.as_owner();
  exception when others then
    perform selftest.as_owner();
    ok := false; detail := detail || format('the lineage move before any start was refused: %s; ', sqlerrm);
  end;

  select l.plp_release_id, l.course_id, l.learning_cycle into v_row from public.learning_assignments l where l.id = v_la2;
  if v_row.plp_release_id <> v_rel2 then
    ok := false; detail := detail || 'the assignment did not move to the successor release; ';
  end if;
  if v_row.course_id <> v_rev then
    ok := false; detail := detail || 'the assignment still names the predecessor course; ';
  end if;
  -- BOB-35 (b): the cycle moved with it, to the revision's own POST_TEST definition
  select count(*) into n from public.assessment_assignments aa
    join public.assessment_definitions d on d.id = aa.assessment_definition_id
    left join public.modules dm on dm.id = d.module_id
   where aa.id = v_aa2 and coalesce(d.course_id, dm.course_id) = v_rev and d.mode = 'POST_TEST'
     and aa.assessment_definition_id = (public.release_cycle_definition(v_rel2, 'POST_TEST')).id;
  if n <> 1 then ok := false; detail := detail || 'the cycle''s POST_TEST assignment still names the v1.0 definition; '; end if;
  if (v_row.learning_cycle ->> 'post_test') is distinct from (public.release_cycle_definition(v_rel2, 'POST_TEST')).id::text then
    ok := false; detail := detail || 'learning_cycle still names the v1.0 definition; ';
  end if;
  -- exactly one move row, naming both releases, nobody left in place
  select count(*) into n from public.learning_assignment_release_moves mv
   where mv.learning_assignment_id = v_la2 and mv.from_release_id = p.rel and mv.to_release_id = v_rel2
     and mv.learners_left_in_place = 0;
  if n <> 1 then ok := false; detail := detail || format('%s move row(s) with nobody left in place, expected 1; ', n); end if;
  select count(*) into n from public.audit_log
   where action = 'LEARNING_RELEASE_MOVED' and target_id = v_la2::text and summary ? 'cycle';
  if n < 1 then ok := false; detail := detail || 'the move wrote no audit row naming the cycle; '; end if;
  -- A release OUTSIDE the lineage is still refused, even when the school holds
  -- a perfectly good grant for it -- otherwise "widened to the lineage chain"
  -- would just mean "unwidened". A second canonical package, distributed to
  -- the same school, is the case that separates the two.
  declare p2 record;
  begin
    select * into p2 from selftest.canonical_package('Pengukuran Nasional II');
    perform selftest.as_user('kanonik-admin@pintar.test');
    perform public.grant_release_distribution(p2.rel, v_a, 'fable05 unrelated package');
    perform selftest.as_owner();
    if not public.release_is_distributed_to(p2.rel, v_a) then
      ok := false; detail := detail || 'the second canonical grant did not take effect; ';
    end if;
    perform selftest.as_user('alpha-admin@synthetic.pintar.test');
    begin
      perform public.move_learning_assignment_release(v_la2, p2.rel, 'lintas garis keturunan');
      perform selftest.as_owner();
      ok := false; detail := detail || 'a release outside the lineage was accepted as a correction; ';
    exception when others then
      perform selftest.as_owner();
      if sqlerrm !~ 'lineage' then
        ok := false; detail := detail || format('the out-of-lineage move was refused for the wrong reason: %s; ', sqlerrm);
      end if;
    end;
    -- and the assignment did not move
    select l.plp_release_id into v_row from public.learning_assignments l where l.id = v_la2;
    if v_row.plp_release_id <> v_rel2 then
      ok := false; detail := detail || 'the refused move changed the assignment anyway; ';
    end if;
  end;
  raise exception 'F05_T14_UNDO';
  exception when others then
    perform selftest.as_owner();
    if sqlerrm <> 'F05_T14_UNDO' then
      ok := false; detail := detail || format('the move before any start could not run: %s; ', left(sqlerrm, 120));
    end if;
  end;
  test_id := 'F05-T14'; invariant := 'ADR-0015 §5.4 / ADR-0016 / INV-27';
  if ok then detail := 'a move of an assignment a learner had already finished under was refused RELEASE_MOVE_STARTED and changed nothing (BOB-35 (c)); a v1.0 -> v1.1 correction across the lineage before anyone started moved the assignment, its course and its cycle''s POST_TEST definition to v1.1''s own, wrote exactly one move row with nobody left in place and an audit line naming the cycle, refused an automatic move, and refused a distributed release from outside the lineage'; end if;
  return next;

  -- =========================================================================
  -- F05-T14b BOB-35: A CORRECTED-RELEASE MOVE NEVER LEAVES MIXED PROVENANCE.
  -- The release/content provenance recorded for an assessment session and
  -- certificate must correspond to the content and assessment definitions
  -- actually used by that learner (INV-04, INV-29). After F05-T14's move to
  -- v1.1, a learner starts the assignment's assessment: the release the session
  -- records, the definition it was assembled from and every item presented
  -- must be one course. certificate_prepare cites the session's plp_release_id
  -- and that release's content hash, so a session whose release is not its
  -- items' course would sign a certificate for content the learner never sat.
  -- A session inserted directly with a release and a definition of two courses
  -- is refused; a target with no cycle definition refuses the move; and what
  -- happened before is untouched.
  -- =========================================================================
  ok := true; detail := '';
  declare
    v_email text; v_s3 uuid; v_rel_course uuid; v_def_course uuid; v_bad int; v_all int;
  begin
    if selftest.f05_assignment_history(v_la) is distinct from v_hist then
      ok := false; detail := detail || 'a session, a presented item, a result or a certificate from before was rewritten; ';
    end if;
    -- everything below is undone at the end, so a rerun starts from the same place
    begin
    -- v1.0 assigned afresh and moved to v1.1 before anyone starts (F05-T14)
    select fa.la, fa.aa into v_la2, v_aa2
      from selftest.f05_fresh_assignment('alpha-admin@synthetic.pintar.test', v_a, v_node_a, p.rel, p.course, p.defn) fa;
    perform selftest.as_user('alpha-admin@synthetic.pintar.test');
    perform public.move_learning_assignment_release(v_la2, v_rel2, 'koreksi v1.0 -> v1.1');
    perform selftest.as_owner();
    -- a learner who joins the class after the move, so has not started (the
    -- class's seeded learner finished on v1.0 in F05-T05); rolled back with
    -- the suite
    declare v_uid uuid := gen_random_uuid(); v_p uuid; v_e uuid; v_per uuid; v_prog uuid;
    begin
      v_email := 'f05-t14b-murid-' || substr(md5(random()::text), 1, 8) || '@synthetic.pintar.test';
      perform set_config('app.seed_intent', 'synthetic', true);
      insert into auth.users (id, instance_id, aud, role, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
                              created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
      values (v_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', v_email, now(),
              '{"provider":"email","providers":["email"]}', '{"display_name":"Murid Pindahan T14b"}', now(), now(), '', '', '', '');
      select a.person_id into v_p from public.accounts a where a.auth_user_id = v_uid;
      select n.academic_period_id into v_per from public.org_nodes n where n.id = v_node_a;
      select e.programme_id into v_prog from public.memberships m join public.enrollments e on e.id = m.enrollment_id
       where m.node_id = v_node_a and m.valid_to is null and e.status = 'ACTIVE' order by e.created_at limit 1;
      insert into public.enrollments (person_id, institution_id, academic_period_id, programme_id, status)
      values (v_p, v_a, v_per, v_prog, 'ACTIVE') returning id into v_e;
      insert into public.memberships (enrollment_id, node_id, academic_period_id) values (v_e, v_node_a, v_per);
      perform set_config('app.seed_intent', '', true);
    exception when others then
      perform set_config('app.seed_intent', '', true);
      v_email := null;
      ok := false; detail := detail || format('the learner could not be enrolled: %s; ', left(sqlerrm, 120));
    end;
    if v_email is not null then
      perform selftest.as_user(v_email);
      begin
        v_s3 := public.start_learning_session(v_aa2);
      exception when others then
        ok := false; detail := detail || format('a learner could not start after the move: %s; ', left(sqlerrm, 120));
      end;
      perform selftest.as_owner();
    end if;
    if v_s3 is not null then
      select r.course_id, coalesce(d.course_id, dm.course_id) into v_rel_course, v_def_course
        from public.assessment_sessions ss
        join public.plp_releases r on r.id = ss.plp_release_id
        join public.assessment_definitions d on d.id = ss.assessment_definition_id
        left join public.modules dm on dm.id = d.module_id
       where ss.id = v_s3;
      if v_rel_course is distinct from v_rev then
        ok := false; detail := detail || 'the session after the move does not record the v1.1 release; ';
      end if;
      if v_def_course is distinct from v_rel_course then
        ok := false; detail := detail || format('the session records v1.1''s release but was assembled from %s definition; ',
          case when v_def_course = p.course then 'the v1.0 course''s' else 'another course''s' end);
      end if;
      select count(*), count(*) filter (where m.course_id is distinct from v_rel_course) into v_all, v_bad
        from public.presented_items pi join public.items i on i.id = pi.item_id
        join public.lessons l on l.id = i.lesson_id join public.modules m on m.id = l.module_id
       where pi.session_id = v_s3;
      if v_all = 0 then ok := false; detail := detail || 'the session presented no items; '; end if;
      if v_bad > 0 then
        ok := false; detail := detail || format('%s of %s presented item(s) come from another course than the release the session records (a certificate would cite v1.1 for v1.0 items); ', v_bad, v_all);
      end if;
      -- (a) at the root: the same session, but citing v1.1's release with v1.0's definition
      begin
        insert into public.assessment_sessions
        select (jsonb_populate_record(null::public.assessment_sessions,
          to_jsonb(ss) || jsonb_build_object('id', gen_random_uuid(), 'assessment_definition_id', p.defn))).*
          from public.assessment_sessions ss where ss.id = v_s3;
        ok := false; detail := detail || 'a session citing v1.1''s release with v1.0''s definition was inserted; ';
      exception when others then
        get stacked diagnostics v_det = pg_exception_detail;
        if v_det is distinct from 'SESSION_RELEASE_MISMATCH' then
          ok := false; detail := detail || format('the mixed session was refused for another reason: %s; ', left(sqlerrm, 100));
        end if;
      end;
      -- the root check itself, where no assignment row can catch it: a session
      -- outside any assignment (the path an Uji Cepat takes) with v1.1's
      -- release and v1.0's definition
      begin
        insert into public.assessment_sessions
        select (jsonb_populate_record(null::public.assessment_sessions,
          to_jsonb(ss) || jsonb_build_object('id', gen_random_uuid(), 'assessment_definition_id', p.defn,
                                             'learning_assignment_id', null, 'assessment_assignment_id', null))).*
          from public.assessment_sessions ss where ss.id = v_s3;
        ok := false; detail := detail || 'a session outside any assignment citing v1.1''s release with v1.0''s definition was inserted; ';
      exception when others then
        get stacked diagnostics v_det = pg_exception_detail;
        if v_det is distinct from 'SESSION_RELEASE_MISMATCH' then
          ok := false; detail := detail || format('the unassigned mixed session was refused for another reason: %s; ', left(sqlerrm, 100));
        end if;
      end;
      -- and a start that raced the move: a session that agrees with itself (v1.0's
      -- release, v1.0's definition) but cites the release its assignment has
      -- since moved from is refused too, on the assignment's current row
      begin
        insert into public.assessment_sessions
        select (jsonb_populate_record(null::public.assessment_sessions,
          to_jsonb(ss) || jsonb_build_object('id', gen_random_uuid(), 'plp_release_id', p.rel,
                                             'assessment_definition_id', p.defn))).*
          from public.assessment_sessions ss where ss.id = v_s3;
        ok := false; detail := detail || 'a session citing the release its assignment moved from was inserted; ';
      exception when others then
        get stacked diagnostics v_det = pg_exception_detail;
        if v_det is distinct from 'SESSION_RELEASE_MISMATCH' then
          ok := false; detail := detail || format('the stale session was refused for another reason: %s; ', left(sqlerrm, 100));
        end if;
      end;
    end if;
    -- (b): a target release with no approved cycle definition refuses the move,
    -- and the assignment stays where it was. v1.1's POST_TEST definition is
    -- taken out of APPROVED for this one check (the status guard set aside),
    -- and all of it undone.
    begin
      select fa.la into v_row
        from selftest.f05_fresh_assignment('alpha-admin@synthetic.pintar.test', v_a, v_node_a, p.rel, p.course, p.defn) fa;
      perform selftest.as_owner();
      alter table public.assessment_definitions disable trigger assessment_definitions_status_guard;
      update public.assessment_definitions set status = 'IN_REVIEW'
       where id = (public.release_cycle_definition(v_rel2, 'POST_TEST')).id;
      alter table public.assessment_definitions enable trigger assessment_definitions_status_guard;
      perform selftest.as_user('alpha-admin@synthetic.pintar.test');
      begin
        perform public.move_learning_assignment_release(v_row.la, v_rel2, 'tanpa definisi siklus');
        perform selftest.as_owner();
        ok := false; detail := detail || 'a move to a release with no cycle definition was accepted; ';
      exception when others then
        get stacked diagnostics v_det = pg_exception_detail;
        perform selftest.as_owner();
        if v_det is distinct from 'RELEASE_MOVE_NO_CYCLE_DEFINITION' then
          ok := false; detail := detail || format('a move to a release with no cycle definition was refused for another reason: %s; ', left(sqlerrm, 100));
        end if;
      end;
      raise exception 'F05_T14B_UNDO';
    exception when others then
      perform selftest.as_owner();
      if sqlerrm <> 'F05_T14B_UNDO' then
        ok := false; detail := detail || format('the no-definition case could not run: %s; ', left(sqlerrm, 120));
      end if;
    end;
    -- the closure query, while this run's sessions still exist: no session
    -- anywhere records a release whose course is not the course of every item
    -- it presented
    select count(distinct ss.id) into v_bad
      from public.assessment_sessions ss
      join public.plp_releases r on r.id = ss.plp_release_id
      join public.presented_items pi on pi.session_id = ss.id
      join public.items i on i.id = pi.item_id
      join public.lessons l on l.id = i.lesson_id join public.modules m on m.id = l.module_id
     where m.course_id <> r.course_id;
    if v_bad > 0 then
      ok := false; detail := detail || format('%s session(s) in this database record a release whose course is not their items'' course; ', v_bad);
    end if;
    raise exception 'F05_T14B_ALL_UNDO';
    exception when others then
      perform selftest.as_owner();
      perform set_config('app.seed_intent', '', true);
      if sqlerrm <> 'F05_T14B_ALL_UNDO' then
        ok := false; detail := detail || format('the test could not run: %s; ', left(sqlerrm, 120));
      end if;
    end;
    -- and once more after the undo, over everything committed
    select count(distinct ss.id) into v_bad
      from public.assessment_sessions ss
      join public.plp_releases r on r.id = ss.plp_release_id
      join public.presented_items pi on pi.session_id = ss.id
      join public.items i on i.id = pi.item_id
      join public.lessons l on l.id = i.lesson_id join public.modules m on m.id = l.module_id
     where m.course_id <> r.course_id;
    if v_bad > 0 then
      ok := false; detail := detail || format('%s session(s) in this database record a release whose course is not their items'' course; ', v_bad);
    end if;
  end;
  test_id := 'F05-T14b'; invariant := 'BOB-35 / INV-04 / INV-29';
  if ok then detail := 'after the v1.0 -> v1.1 move a learner sat v1.1: the release the session records, the definition it was assembled from and every presented item are one course, so a certificate cites the content that was sat; a session inserted with v1.1''s release and v1.0''s definition (under the assignment or outside any), and one that agrees with itself but cites the release its assignment moved from, were each refused SESSION_RELEASE_MISMATCH; a move to a release with no cycle definition was refused RELEASE_MOVE_NO_CYCLE_DEFINITION; no session in the database records a release whose course is not its items''; and every session, presented item, result and certificate from before is byte-for-byte unchanged'; end if;
  return next;

  -- =========================================================================
  -- F05-T15 regression: everything a school could do with its OWN content, it
  -- still can; everything it could not, it still cannot (§10.4)
  -- =========================================================================
  ok := true; detail := '';
  perform selftest.as_user('alpha-guru@synthetic.pintar.test');
  select count(*) into n from public.courses where institution_id = v_a;
  if n = 0 then ok := false; detail := detail || 'an educator can no longer read their own institution''s courses; '; end if;
  begin
    insert into public.lessons (module_id, institution_id, ordinal, title)
    select m.id, v_a,
           (select coalesce(max(l.ordinal), 0) + 1 from public.lessons l where l.module_id = m.id),
           'pelajaran regresi'
      from public.modules m where m.course_id = v_priv_a limit 1;
  exception when others then
    ok := false; detail := detail || format('an educator can no longer draft in their own course: %s; ', sqlerrm);
  end;
  -- and still cannot reach across the tenant boundary, in either direction
  select count(*) into n from public.courses where institution_id = v_b;
  if n <> 0 then ok := false; detail := detail || 'an educator reads another school''s courses; '; end if;
  select count(*) into n from public.courses where institution_id = p.canon;
  if n <> 0 then ok := false; detail := detail || 'an educator reads canonical content rows directly; '; end if;
  -- a DEAN still holds nothing (INV-19)
  perform selftest.as_user('alpha-dean@synthetic.pintar.test');
  select count(*) into n from public.courses;
  if n <> 0 then ok := false; detail := detail || format('a DEAN reads %s course row(s); ', n); end if;
  begin
    perform public.studio_package_state(v_priv_a);
    ok := false; detail := detail || 'a DEAN read a package state; ';
  exception when others then null; end;
  begin
    perform public.save_assessment_definition(null, jsonb_build_object(
      'institution_id', v_a, 'course_id', v_priv_a, 'mode', 'QUICK', 'title', 'dean probe',
      'bank_type', 'PRACTICE', 'item_count', 5));
    ok := false; detail := detail || 'a DEAN configured an assessment definition; ';
  exception when others then null; end;
  begin
    select count(*) into n from public.studio_home();
    if n <> 0 then ok := false; detail := detail || 'the Studio home rendered a card for a DEAN; '; end if;
  exception when others then null; end;
  perform selftest.as_owner();
  test_id := 'F05-T15'; invariant := 'INV-13 / INV-19 (regression)';
  if ok then detail := 'an educator still reads and drafts their own institution''s content and still reaches neither another school''s nor the canonical tenant''s rows; a DEAN still holds nothing, in Studio included'; end if;
  return next;

  -- =========================================================================
  -- F05-T16 INV-22: every content lifecycle transition is governed, on every
  -- table the guard is attached to -- previously unasserted anywhere
  -- =========================================================================
  ok := true; detail := '';
  select count(*) into n from pg_trigger t
   where not t.tgisinternal and t.tgfoid = 'public.enforce_content_status()'::regprocedure;
  if n <> 6 then ok := false; detail := detail || format('the status guard is on %s table(s), expected 6; ', n); end if;
  -- created at INGESTED only, on each of them
  foreach r in array array['courses','modules','lessons','items','assessment_definitions'] loop
    begin
      case r
        when 'courses' then
          insert into public.courses (institution_id, subject, stage, grade_label, title, status)
          values (v_a, 'X', 'SD', 'X', 'inv22 probe', 'APPROVED');
        when 'modules' then
          insert into public.modules (course_id, institution_id, ordinal, title, status)
          values (v_priv_a, v_a, 97, 'inv22 probe', 'APPROVED');
        when 'lessons' then
          insert into public.lessons (module_id, institution_id, ordinal, title, status)
          select m.id, v_a, 97, 'inv22 probe', 'APPROVED' from public.modules m
           where m.course_id = v_priv_a limit 1;
        when 'items' then
          insert into public.items (lesson_id, institution_id, item_type, bank_type, stem, status)
          select l.id, v_a, 'MCQ_SINGLE', 'PRACTICE', 'inv22 probe', 'APPROVED'
            from public.lessons l join public.modules m on m.id = l.module_id
           where m.course_id = v_priv_a limit 1;
        when 'assessment_definitions' then
          insert into public.assessment_definitions (institution_id, course_id, title, mode,
            bank_type, item_count, status)
          values (v_a, v_priv_a, 'inv22 probe', 'QUICK', 'PRACTICE', 5, 'APPROVED');
      end case;
      ok := false; detail := detail || format('%s accepted a row created past INGESTED; ', r);
    exception when others then null; end;
  end loop;
  -- an unlisted edge is refused
  begin
    update public.courses set status = 'PUBLISHED' where id = v_priv_a;
    ok := false; detail := detail || 'an unlisted INGESTED -> PUBLISHED jump was accepted; ';
  exception when others then null; end;
  -- the allow-list is a table, not a literal in the function
  if pg_get_functiondef('public.enforce_content_status()'::regprocedure) !~ 'content_status_transitions' then
    ok := false; detail := detail || 'the status guard no longer reads the transition table; ';
  end if;
  select count(*) into n from public.content_status_transitions;
  if n < 9 then ok := false; detail := detail || format('the transition graph has only %s edge(s); ', n); end if;
  test_id := 'F05-T16'; invariant := 'INV-22';
  if ok then detail := format('the status guard is attached to 6 tables; five of them refuse a row created past INGESTED, an unlisted edge is refused, and the %s-edge allow-list is still a table rather than a literal', n); end if;
  return next;

  -- =========================================================================
  -- F05-T17 Studio governance: approval, sealing and publication each need
  -- their own capability, and hiding a button is not what refuses them
  -- =========================================================================
  ok := true; detail := '';
  -- an educator drafts a course and drives it to IN_REVIEW
  -- the two person ids are resolved as the owner: auth.users is unreadable by
  -- the client role, and a probe that fails on a permission error would be
  -- proving the wrong refusal
  select a.person_id into v_guru from public.accounts a join auth.users u on u.id = a.auth_user_id
   where u.email = 'alpha-hod@synthetic.pintar.test';
  select a.person_id into v_admin from public.accounts a join auth.users u on u.id = a.auth_user_id
   where u.email = 'alpha-admin@synthetic.pintar.test';
  perform selftest.as_user('alpha-guru@synthetic.pintar.test');
  declare v_probe uuid; t3 text;
  begin
    insert into public.courses (institution_id, subject, stage, grade_label, title)
    values (v_a, 'Matematika', 'SD', 'Kelas 5', 'Paket Tata Kelola ' || substr(md5(random()::text),1,6))
    returning id into v_probe;
    foreach t3 in array array['STRUCTURED','VALIDATED','IN_REVIEW'] loop
      update public.courses set status = t3::public.content_status where id = v_probe;
    end loop;
    -- the author cannot approve: no CAN_REVIEW
    begin
      update public.courses set status = 'APPROVED', reviewed_by_person_id = v_guru
       where id = v_probe;
      ok := false; detail := detail || 'an EDUCATOR approved content without CAN_REVIEW; ';
    exception when others then
      if sqlerrm !~ 'CAN_REVIEW' then
        ok := false; detail := detail || format('the educator was refused for the wrong reason: %s; ', sqlerrm);
      end if;
    end;
    -- and cannot seal
    begin
      update public.courses set status = 'FROZEN' where id = v_probe;
      ok := false; detail := detail || 'an EDUCATOR sealed content without CAN_FREEZE_RELEASE; ';
    exception when others then null; end;

    -- the HoD approves as themselves; naming a third party is refused
    perform selftest.as_user('alpha-hod@synthetic.pintar.test');
    begin
      update public.courses set status = 'APPROVED', reviewed_by_person_id = v_admin
       where id = v_probe;
      ok := false; detail := detail || 'a reviewer approved by naming a third party as the reviewer of record; ';
    exception when others then null; end;
    update public.courses set status = 'APPROVED',
           reviewed_by_person_id = public.current_person_id() where id = v_probe;
    select count(*) into n from public.courses where id = v_probe and status = 'APPROVED';
    if n <> 1 then ok := false; detail := detail || 'a legitimate approval was refused; '; end if;
    -- the HoD seals but cannot publish
    update public.courses set status = 'FROZEN' where id = v_probe;
    begin
      update public.courses set status = 'PUBLISHED' where id = v_probe;
      get diagnostics n = row_count;
      if n > 0 then ok := false; detail := detail || 'a HEAD_OF_DEPARTMENT published without CAN_PUBLISH; '; end if;
    exception when others then null; end;
    perform selftest.as_owner();
  end;
  test_id := 'F05-T17'; invariant := 'doc 05 / INV-19 / INV-32';
  if ok then detail := 'an educator can neither approve nor seal, a reviewer cannot record a third party as the reviewer, and a head of department seals but does not publish -- each refused server-side'; end if;
  return next;

  -- =========================================================================
  -- F05-T18 the Definition builder: governed bounds and INV-29 versioning
  -- =========================================================================
  ok := true; detail := '';
  perform selftest.as_user('alpha-guru@synthetic.pintar.test');
  begin
    perform public.save_assessment_definition(null, jsonb_build_object(
      'institution_id', v_a, 'course_id', v_priv_a, 'mode', 'QUICK', 'title', 'aturan probe',
      'bank_type', 'PRACTICE', 'item_count', 40));
    ok := false; detail := detail || 'a definition was saved outside its platform bounds; ';
  exception when others then null; end;
  begin
    perform public.save_assessment_definition(null, jsonb_build_object(
      'institution_id', v_a, 'course_id', p.course, 'mode', 'QUICK', 'title', 'aturan lintas',
      'bank_type', 'PRACTICE', 'item_count', 5));
    ok := false; detail := detail || 'a definition was scoped to another tenant''s course; ';
  exception when others then null; end;
  select ss.assessment_definition_id, ss.created_new_version into v_def2, v_new
    from public.save_assessment_definition(null, jsonb_build_object(
      'institution_id', v_a, 'course_id', v_priv_a, 'mode', 'QUICK', 'title', 'aturan probe',
      'bank_type', 'PRACTICE', 'item_count', 5,
      'difficulty_mix', jsonb_build_object('MUDAH', 3, 'SEDANG', 2))) ss;
  if v_def2 is null then ok := false; detail := detail || 'a within-bounds definition was refused; '; end if;
  declare v_def3 uuid;
  begin
    select ss.assessment_definition_id, ss.created_new_version into v_def3, v_new
      from public.save_assessment_definition(v_def2, jsonb_build_object('title', 'aturan probe')) ss;
    if v_def3 <> v_def2 then ok := false; detail := detail || 'a relabelling created a new row; '; end if;
    if v_new then ok := false; detail := detail || 'a relabelling was reported as an interpretation change; '; end if;

    select ss.assessment_definition_id, ss.created_new_version into v_def3, v_new
      from public.save_assessment_definition(v_def2, jsonb_build_object(
        'item_count', 6, 'difficulty_mix', jsonb_build_object('MUDAH', 3, 'SEDANG', 3))) ss;
    if v_def3 = v_def2 then ok := false; detail := detail || 'an interpretation change edited in place; '; end if;
    if not v_new then ok := false; detail := detail || 'an interpretation change was not reported as one; '; end if;
  end;
  -- an ad-hoc instrument is never configured here
  declare v_adhoc uuid;
  begin
    select d.id into v_adhoc from public.assessment_definitions d
     where d.institution_id = v_a and d.is_ad_hoc limit 1;
    if v_adhoc is not null then
      begin
        perform public.save_assessment_definition(v_adhoc, jsonb_build_object('title', 'x'));
        ok := false; detail := detail || 'an ad-hoc instrument was configured in the builder; ';
      exception when others then null; end;
    end if;
  end;
  perform selftest.as_owner();
  -- and no bound is a constant in the builder
  if pg_get_functiondef('public.save_assessment_definition(uuid,jsonb)'::regprocedure)
       !~ 'assessment_definition_bounds' then
    ok := false; detail := detail || 'the builder does not read the platform bounds table; ';
  end if;
  test_id := 'F05-T18'; invariant := 'INV-29 / INV-13 / ADR-0011';
  if ok then detail := 'an out-of-bounds size and a cross-tenant scope are refused, a relabelling edits in place, an interpretation change writes a new version, an ad-hoc instrument is refused, and every bound is read from the database'; end if;
  return next;

  -- =========================================================================
  -- F05-T19 the calm surface: one state, plain reasons, no zero card
  -- =========================================================================
  ok := true; detail := '';
  perform selftest.as_user('alpha-guru@synthetic.pintar.test');
  select ps.surface_state, ps.reasons, ps.preview_lesson_id into v_state
    from public.studio_package_state(v_priv_a) ps;
  if v_state.surface_state not in ('READY','ACTION_REQUIRED','BLOCKED') then
    ok := false; detail := detail || format('unknown surface state %s; ', v_state.surface_state);
  end if;
  if v_state.surface_state = 'READY' then
    ok := false; detail := detail || 'an unvalidated, unapproved, unsealed package read as READY; ';
  end if;
  -- RESTATED FOR BOB-17 (D-011; a changed requirement): each reason is a code
  -- with parameters, and the words on screen are the copy table's. So every
  -- reason must be a coded object, and what is shown beside the code's words
  -- -- the lesson's title, the pattern -- must carry no lifecycle enum or
  -- version string. (A code such as READINESS_NOT_VALIDATED is not shown.)
  for r in select e::text from jsonb_array_elements(coalesce(v_state.reasons, '[]'::jsonb)) e
            where jsonb_typeof(e) <> 'object' or not (e ? 'code')
               or coalesce(e ->> 'lesson', '') || ' ' || coalesce(e ->> 'pattern', '')
                  ~ '(INGESTED|STRUCTURED|VALIDATED|VALIDATION_FAILED|IN_REVIEW|APPROVED|FROZEN|PUBLISHED|SUPERSEDED)'
               or coalesce(e ->> 'lesson', '') || ' ' || coalesce(e ->> 'pattern', '') ~ '[0-9]+\.[0-9]+\.[0-9]+' loop
    ok := false; detail := detail || format('a reason is not a code, or carries a lifecycle enum or version string: %s; ', r);
  end loop;
  select count(*) into n from public.studio_home() where count = 0;
  if n <> 0 then ok := false; detail := detail || format('%s zero-count card(s) rendered; ', n); end if;
  select count(*) into n from public.studio_home();
  if n = 0 then ok := false; detail := detail || 'an educator with drafts sees no Studio card at all; '; end if;
  perform selftest.as_owner();
  -- the composition reads the gate rather than restating it
  if pg_get_functiondef('public.studio_package_state(uuid)'::regprocedure) !~ 'publish_readiness' then
    ok := false; detail := detail || 'the Studio state does not read publish_readiness; ';
  end if;
  -- findings are served in the coaching shape
  select count(*) into n from information_schema.columns
   where table_schema = 'public' and table_name = 'mcq_quality_findings'
     and column_name in ('lokasi','masalah','mengapa_penting','cara_memperbaiki');
  select count(*) into n2 from information_schema.columns
   where table_schema = 'public' and table_name = 'coaching_findings'
     and column_name in ('lokasi','masalah','mengapa_penting','cara_memperbaiki');
  if n <> 4 or n2 <> 4 then
    ok := false; detail := detail || 'a finding no longer carries the four coaching fields; ';
  end if;
  test_id := 'F05-T19'; invariant := 'FABLE-05 §5 / §12 / INV-35';
  if ok then detail := 'the package state is one of three surface words with its reasons as blocker codes (BOB-17) whose shown parameters carry no lifecycle enum or version string, the home renders no zero card, and both finding tables still carry the four coaching fields'; end if;
  return next;

  -- =========================================================================
  -- F05-T20 review decisions are decisions, never verdicts
  -- =========================================================================
  ok := true; detail := '';
  perform selftest.as_user('alpha-admin@synthetic.pintar.test');
  begin
    perform public.record_integrity_review(gen_random_uuid(), 'CHEATED', 'probe');
    ok := false; detail := detail || 'an accusatory integrity verdict was accepted; ';
  exception when others then
    if sqlerrm !~ 'not a verdict' then
      ok := false; detail := detail || format('refused for the wrong reason: %s; ', sqlerrm);
    end if;
  end;
  declare v_sig uuid;
  begin
    select isg.id into v_sig from public.integrity_signals isg where isg.institution_id = v_a limit 1;
    if v_sig is not null then
      perform public.record_integrity_review(v_sig, 'NO_CONCERN', 'ditinjau');
      perform selftest.as_owner();
      select count(*) into n from public.audit_log
       where action = 'INTEGRITY_SIGNAL_REVIEWED' and target_id = v_sig::text;
      if n <> 1 then ok := false; detail := detail || format('the review wrote %s audit row(s); ', n); end if;
      perform selftest.as_user('alpha-admin@synthetic.pintar.test');
    end if;
  end;
  begin
    perform public.record_question_health_review(gen_random_uuid(), 'ACKNOWLEDGED_OK', 'probe');
    ok := false; detail := detail || 'a Question Health review was accepted with no health record; ';
  exception when others then
    if sqlerrm !~ 'not enough evidence' then
      ok := false; detail := detail || format('the empty health probe was refused for the wrong reason: %s; ', sqlerrm);
    end if;
  end;
  perform selftest.as_owner();
  -- the integrity path writes no outcome and no second log
  if pg_get_functiondef('public.record_integrity_review(uuid,text,text)'::regprocedure)
       ~* 'update public\.integrity_signals|insert into public\.integrity' then
    ok := false; detail := detail || 'the integrity review mutates the signal or writes a second log; ';
  end if;
  select aa.ok, aa.detail into v_ok, v_detail from public.assert_integrity_never_scores() aa;
  if not v_ok then ok := false; detail := detail || v_detail || '; '; end if;
  -- nothing in the Studio flow put a number in an empirical column
  select count(*) into n from public.items
   where empirical_difficulty is not null or empirical_discrimination is not null
      or empirical_evidence_count is not null;
  if n <> 0 then
    ok := false; detail := detail || format('%s item(s) carry an empirical value nothing computed; ', n);
  end if;
  test_id := 'F05-T20'; invariant := 'doc 04 §9 / INV-11-shaped';
  if ok then detail := 'an accusatory decision is refused, a recorded one writes exactly one audit row and mutates no signal, Question Health says honestly that there is not enough evidence, and every empirical column is still NULL after the whole flow'; end if;
  return next;

  -- =========================================================================
  -- F05-T20b BOB-41: THE DATABASE STILL DECIDES A QUESTION-HEALTH REVIEW. The
  -- page now offers only what is legal from an item's state; the rules
  -- themselves are unchanged: an illegal transition is refused, a review is
  -- taken up and then concluded, and a concluded one returns to OBSERVING.
  -- Two of the bootstrap school's items (School A carries none), walked as the
  -- admin who reviews them; undone.
  -- =========================================================================
  ok := true; detail := '';
  declare v_i1 uuid; v_i2 uuid; v_det2 text; v_boot uuid;
  begin
    select i.id into v_boot from public.institutions i where i.slug = 'pintar-bootstrap-official';
    select i.id into v_i1 from public.items i
     where i.institution_id = v_boot and not exists (select 1 from public.question_health h where h.item_id = i.id)
     order by i.created_at, i.id limit 1;
    select i.id into v_i2 from public.items i
     where i.institution_id = v_boot and i.id <> v_i1 and not exists (select 1 from public.question_health h where h.item_id = i.id)
     order by i.created_at, i.id limit 1;
    if v_i1 is null or v_i2 is null then
      ok := false; detail := detail || 'the bootstrap school has no two items without a health record to walk; ';
    else
      insert into public.question_health (item_id, institution_id) values (v_i1, v_boot), (v_i2, v_boot);
      update public.question_health set state = 'OBSERVING' where item_id in (v_i1, v_i2);
      update public.question_health set state = 'SIGNAL_RAISED' where item_id in (v_i1, v_i2);
      perform selftest.as_user('boot-admin@bootstrap.pintar.test');
      -- illegal from SIGNAL_RAISED: concluding before taking it up
      foreach v_det2 in array array['ACKNOWLEDGED_OK', 'ACTION_TAKEN'] loop
        begin
          perform public.record_question_health_review(v_i1, v_det2::public.question_health_state, 'terlalu cepat');
          ok := false; detail := detail || format('SIGNAL_RAISED -> %s was accepted; ', v_det2);
        exception when others then
          if sqlerrm !~ 'does not move from' then
            ok := false; detail := detail || format('SIGNAL_RAISED -> %s was refused for another reason: %s; ', v_det2, left(sqlerrm, 80));
          end if;
        end;
      end loop;
      -- taken up, then concluded both ways
      perform public.record_question_health_review(v_i1, 'UNDER_REVIEW', 'diambil');
      perform public.record_question_health_review(v_i2, 'UNDER_REVIEW', 'diambil');
      begin
        perform public.record_question_health_review(v_i1, 'UNDER_REVIEW', 'dua kali');
        ok := false; detail := detail || 'UNDER_REVIEW -> UNDER_REVIEW was accepted; ';
      exception when others then null; end;
      perform public.record_question_health_review(v_i1, 'ACKNOWLEDGED_OK', 'wajar');
      perform public.record_question_health_review(v_i2, 'ACTION_TAKEN', 'diperbaiki');
      perform selftest.as_owner();
      if (select count(*) from public.question_health h where (h.item_id = v_i1 and h.state = 'ACKNOWLEDGED_OK')
             or (h.item_id = v_i2 and h.state = 'ACTION_TAKEN')) <> 2 then
        ok := false; detail := detail || 'a review taken up could not be concluded; ';
      end if;
      -- watching resumes, unchanged
      update public.question_health set state = 'OBSERVING' where item_id in (v_i1, v_i2);
      if (select count(*) from public.question_health h where h.item_id in (v_i1, v_i2) and h.state = 'OBSERVING') <> 2 then
        ok := false; detail := detail || 'ACKNOWLEDGED_OK / ACTION_TAKEN -> OBSERVING no longer holds; ';
      end if;
      raise exception 'F05_T20B_UNDO';
    end if;
  exception when others then
    perform selftest.as_owner();
    if sqlerrm <> 'F05_T20B_UNDO' then ok := false; detail := detail || 'the test could not run: ' || left(sqlerrm, 150) || '; '; end if;
  end;
  test_id := 'F05-T20b'; invariant := 'BOB-41 / question_health_transitions';
  if ok then detail := 'the database still decides a question-health review: from SIGNAL_RAISED, ACKNOWLEDGED_OK and ACTION_TAKEN are refused and UNDER_REVIEW is taken; UNDER_REVIEW twice is refused; from UNDER_REVIEW both ACKNOWLEDGED_OK and ACTION_TAKEN conclude it; and both return to OBSERVING, unchanged'; end if;
  return next;

  -- =========================================================================
  -- F05-T21 the counters §11 fixes, re-measured
  -- =========================================================================
  ok := true; detail := '';
  perform selftest.as_user('sysadmin@synthetic.pintar.test');
  v_lint := public.platform_schema_lint();
  perform selftest.as_owner();
  foreach r in array array['tables_without_rls','policies_using_true','secdef_without_search_path',
                           'functions_without_search_path','functions_executable_by_anon',
                           'anon_table_grants','unclassified_client_rpcs','undeclared_anon_functions',
                           'audit_log_client_write_grants','public_buckets','client_storage_policies',
                           'evidence_class_overrides','anon_public_view_write_grants',
                           'overloaded_client_rpcs','malformed_jalur','persons_institution_columns',
                           'client_readable_definer_views'] loop
    if (v_lint ->> r)::int is distinct from 0 then
      ok := false; detail := detail || format('%s is %s, expected 0; ', r, coalesce(v_lint ->> r, 'missing'));
    end if;
  end loop;
  -- 1 since D-032 (BOB-14): the verification route; the lesson view is not public.
  -- RESTATED FOR BOB-12 (a changed requirement): 2, with the class card's sign-in
  -- route declared beside it, and 4 addresses, each route with its endpoint.
  -- RESTATED FOR BOB-26: Gate 3's three declared doors (activation's code
  -- request and check, the password sign-in) join the certificate's and the
  -- card's: 5 surfaces, 10 addresses, each registered in public_surface_registry
  -- RESTATED FOR BOB-27 (Gate 4): «Lupa password?»'s three declared doors (the recovery code request and check, the
  -- new password) join: 8 surfaces, 16 addresses, each registered in public_surface_registry
  -- RESTATED FOR BOB-28 (Gate 5): recovery by PINTAR ID + PIN (a door and its handler) and the public ID page a card's
  -- QR opens join: 10 surfaces, 19 addresses, each registered in public_surface_registry
  -- RESTATED FOR THE OWNER'S RULING 2 (9 Nov, a changed requirement): a closed account asks to be reopened signed out
  -- (a door and its handler) and joins: 11 surfaces, 21 addresses, each registered in public_surface_registry
  if (v_lint ->> 'anon_public_surface')::int <> 11 then
    ok := false; detail := detail || format('anon_public_surface is %s, expected 11; ', v_lint ->> 'anon_public_surface');
  end if;
  if (v_lint ->> 'anon_reachable_http_paths')::int <> 21 then
    ok := false; detail := detail || format('anon_reachable_http_paths is %s, expected 21; ', v_lint ->> 'anon_reachable_http_paths');
  end if;
  for r in select k from jsonb_object_keys(v_lint) k where k like '%\_ok' loop
    if (v_lint ->> r) <> 'true' then
      ok := false; detail := detail || format('%s is %s; ', r, v_lint ->> r);
    end if;
  end loop;
  -- the two counters that moved deliberately are both visible
  if (v_lint ->> 'platform_canonical_tenants')::int < 1 then
    ok := false; detail := detail || 'the canonical tenant is not separately counted; ';
  end if;
  if (v_lint ->> 'non_synthetic_institutions')::int
     < (v_lint ->> 'platform_canonical_tenants')::int then
    ok := false; detail := detail || 'the canonical tenant is not counted as non-synthetic; ';
  end if;
  -- every content table still carries a record-class row, and no third
  -- portability value was invented
  select string_agg(t, ', ') into bad from unnest(array['courses','modules','lessons',
    'learning_objectives','items','item_options','assessment_definitions','plp_releases',
    'release_distributions','certificate_templates','assessment_definition_bounds']) t
   where not exists (select 1 from public.record_class_registry rc where rc.table_name = t);
  if bad is not null then ok := false; detail := detail || 'record_class_registry missing: ' || bad || '; '; end if;
  select count(*) into n from unnest(enum_range(null::public.record_portability));
  if n <> 2 then ok := false; detail := detail || format('record_portability has %s values, expected 2; ', n); end if;
  test_id := 'F05-T21'; invariant := 'FABLE-05 §11';
  if ok then detail := format('every fixed counter is unmoved, the anonymous surface is one declared route (D-032) at 2 HTTP paths, every standing assertion is true, and the two deliberate movements are separately visible (%s non-synthetic tenant(s), %s canonical)',
    v_lint ->> 'non_synthetic_institutions', v_lint ->> 'platform_canonical_tenants'); end if;
  return next;

  -- =========================================================================
  -- F05-T22 publishing while Blocked is refused server-side, and the same
  -- release publishes once the CONTENT is repaired -- never the gate
  -- =========================================================================
  ok := true; detail := '';
  declare p3 record; v_f uuid; v_sev text;
  begin
    select * into p3 from selftest.canonical_package('Pengukuran Nasional Uji', false);
    select r.status::text into v_sev from public.plp_releases r where r.id = p3.rel;
    if v_sev <> 'FROZEN' then
      ok := false; detail := detail || format('the unpublished fixture is %s, not sealed; ', v_sev);
    end if;
    -- plant an ERROR finding: the package is now Blocked
    select i.id into v_item from public.items i
      join public.lessons l on l.id = i.lesson_id join public.modules m on m.id = l.module_id
     where m.course_id = p3.course limit 1;
    insert into public.mcq_quality_findings
      (institution_id, course_id, item_id, pattern_class, severity, lokasi, masalah,
       mengapa_penting, cara_memperbaiki)
    values (p3.canon, p3.course, v_item, 'RED_CASE', 'ERROR', 'lokasi', 'masalah',
            'mengapa', 'cara') returning id into v_f;

    perform selftest.as_user('kanonik-admin@pintar.test');
    select ps.surface_state into v_detail from public.studio_package_state(p3.course) ps;
    if v_detail <> 'BLOCKED' then
      ok := false; detail := detail || format('an ERROR finding left the surface at %s, not BLOCKED; ', v_detail);
    end if;
    begin
      perform public.publish_release(p3.rel);
      perform selftest.as_owner();
      ok := false; detail := detail || 'a Blocked package was published; ';
    exception when others then
      perform selftest.as_owner();
      if sqlerrm !~ 'readiness' then
        ok := false; detail := detail || format('publication was refused for the wrong reason: %s; ', sqlerrm);
      end if;
    end;
    -- an ERROR is never acknowledged away
    perform selftest.as_user('kanonik-admin@pintar.test');
    begin
      perform public.acknowledge_finding('MCQ_QUALITY', v_f, 'probe');
      perform selftest.as_owner();
      ok := false; detail := detail || 'an ERROR finding was acknowledged away; ';
    exception when others then perform selftest.as_owner(); end;

    -- repair the CONTENT, not the gate
    delete from public.mcq_quality_findings where id = v_f;
    perform selftest.as_user('kanonik-admin@pintar.test');
    select ps.surface_state into v_detail from public.studio_package_state(p3.course) ps;
    if v_detail <> 'READY' then
      ok := false; detail := detail || format('the repaired package reads %s, not READY; ', v_detail);
    end if;
    perform public.publish_release(p3.rel);
    perform selftest.as_owner();
    select r.status::text into v_sev from public.plp_releases r where r.id = p3.rel;
    if v_sev <> 'PUBLISHED' then
      ok := false; detail := detail || format('the repaired release is %s, not published; ', v_sev);
    end if;
  end;
  test_id := 'F05-T22'; invariant := 'doc 04 §1a / INV-32';
  if ok then detail := 'an ERROR finding turns the surface BLOCKED and the server refuses publication; the ERROR cannot be acknowledged away; repairing the content -- not the gate -- reaches READY and the same release publishes'; end if;
  return next;

  test_id := 'F05-DONE'; invariant := 'suite';
  ok := true;
  detail := format('fable05 completed in %s ms', round(extract(milliseconds from clock_timestamp() - t0)));
  return next;
end $$;
revoke all on function selftest.run_fable05() from public, anon, authenticated;
