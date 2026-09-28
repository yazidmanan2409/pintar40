-- The Human Evaluation institution — ADR-0020, Task 2 §7.
--
-- ONE SCHOOL, ONE JOURNEY, FIVE PERSPECTIVES. The learner persona's enrolment,
-- class, assignment, material, assessment, answers and evidence are the SAME
-- ROWS the educator persona reviews, the reviewer persona approved, and the dean
-- sees in aggregate. Five fake universes would be less convincing, not more, and
-- would triple this file.
--
-- WHY IT IS NON-SYNTHETIC, WHICH IS THE WHOLE POINT OF §5. `derive_evidence_class`
-- caps a synthetic tenant at SYNTHETIC, and only OFFICIAL evidence reaches
-- ELIGIBLE. A synthetic demonstration school would therefore show Dr Gladys
-- everything except the one surface the patent work most needs. This school is
-- genuinely non-synthetic and declares `official_evidence_purpose =
-- 'HUMAN_EVALUATION'`, so its evidence is OFFICIAL for the ORDINARY reason --
-- through the same cap model that makes the D1 tenant OFFICIAL, provable by the
-- same query. Evaluation Mode changes who you are; it never changes what
-- evidence means.
--
-- WHERE THIS SEED STOPS, AND WHY THAT IS THE ORDINARY PATH. It carries the
-- learner to a finalised POST_TEST with an OFFICIAL result, which is the state
-- `certificate_eligibility` reads to return ELIGIBLE. It does NOT write a sealed
-- certificate row. Sealing requires a signature over the payload, computed with
-- `CERT_SECRET_KEY_V1`, which is an application secret and is not in the
-- database -- putting it here to pre-bake a certificate would be exactly the
-- special-casing Task 2 §7 forbids. The evaluator issues the certificate through
-- the ordinary surface, with the ordinary key, and the eligibility it rests on
-- is real.
--
-- PERSONA CREDENTIALS: THERE ARE NONE, AND THAT IS THE POINT (0070).
--
-- An earlier version of this seed derived a password per persona from a pepper,
-- on the classroom-card model. That was wrong in a way the card discipline is
-- not. A derived password is still a password: anyone holding the pepper -- or
-- any evaluator who ever observed one -- can authenticate as a persona
-- INDEPENDENTLY, outside any evaluation session. There is then no expiry to
-- cross, no `ended_at`, and no dual-identity stamp at all, because `audit_write`
-- finds no live session to key on: the action records as GENUINE. That is worse
-- than the expiry hole it was meant to sit behind.
--
-- So persona accounts are created with NO password. They cannot be signed into
-- by anyone; a session for them is minted only inside the assume flow, by the
-- server, with the service role. `assert_evaluation_boundary` measures this
-- against `auth.users` rather than trusting this comment.
--
-- The evaluator DOES have a password -- they are a real person who signs in
-- normally, and they are the only one who does.

select set_config('app.seed_intent', 'synthetic', true);

do $$
declare
  v_env text; inst uuid; period uuid; fac uuid; dept uuid; prog uuid; coh uuid; cls uuid;
  u_siswa uuid := gen_random_uuid(); u_guru uuid := gen_random_uuid();
  u_hod uuid := gen_random_uuid(); u_dekan uuid := gen_random_uuid();
  u_admin uuid := gen_random_uuid(); u_eval uuid := gen_random_uuid();
  p_siswa uuid; p_guru uuid; p_hod uuid; p_dekan uuid; p_admin uuid; p_eval uuid;
  e_siswa uuid;
  src uuid; srcv uuid; course uuid; modul uuid; les uuid; tag text;
  ob1 uuid; ob2 uuid; rel uuid; defn uuid; la uuid; aa uuid;
  spec jsonb; entry jsonb; opt jsonb; it uuid; t text;
  v_status text; v_blockers jsonb; n int;
  canon uuid; canon_rel uuid; canon_admin uuid; dist uuid;
  v_session uuid; r record; v_pos integer; v_elig record;
  v_persona_ids uuid[];
begin
  select environment into v_env from public.platform_environment;
  -- L3-F01: fail-closed. This seed creates a credential-bearing evaluator
  -- account; local-only, same marker as every other fixture credential seed.
  if not public.synthetic_fixtures_permitted() then
    raise exception 'seed refused: evaluation credential fixtures are local-only (L3-F01); platform_environment.local_fixtures_enabled is false';
  end if;
  if v_env = 'production' then
    raise exception 'seed refused: the human-evaluation facility is never created in production (ADR-0020, INV-21)';
  end if;
  if current_setting('app.seed_intent', true) is distinct from 'synthetic' then
    raise exception 'seed refused: app.seed_intent must be ''synthetic'' (INV-21)';
  end if;

  if exists (select 1 from public.institutions where slug = 'pintar-human-evaluation') then
    raise notice 'human-evaluation: school already present, leaving it alone';
    return;
  end if;

  insert into public.institutions (slug, name, is_synthetic, is_active,
                                   is_official_bootstrap, official_evidence_purpose)
  values ('pintar-human-evaluation',
          'SD Cendekia Nusantara (sekolah peragaan)', false, true,
          true, 'HUMAN_EVALUATION')
  returning id into inst;
  tag := right('pintar-human-evaluation', 14);

  insert into public.academic_periods (institution_id, name, starts_on, ends_on)
  values (inst, '2026/27', date '2026-07-01', date '2027-06-30') returning id into period;
  insert into public.org_nodes (institution_id, parent_id, kind, name)
  values (inst, inst, 'FACULTY', 'Sekolah Dasar') returning id into fac;
  insert into public.org_nodes (institution_id, parent_id, kind, name)
  values (inst, fac, 'DEPARTMENT', 'Matematika') returning id into dept;
  insert into public.org_nodes (institution_id, parent_id, kind, name)
  values (inst, dept, 'PROGRAMME', 'SD Cendekia') returning id into prog;
  insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
  values (inst, prog, 'COHORT', 'Angkatan 5', period) returning id into coh;
  insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
  values (inst, coh, 'CLASS', '5A', period) returning id into cls;

  -- ------------------------------------------------------------- accounts
  -- Five personas and one evaluator. The evaluator is NOT a persona and cannot
  -- become one -- 0066 refuses that in both directions, because collapsing the
  -- two identities is what the dual-identity audit exists to prevent.
  insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
                          raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
                          confirmation_token, recovery_token, email_change_token_new, email_change)
  values
   (u_siswa, '00000000-0000-0000-0000-000000000000','authenticated','authenticated',
    'peraga-siswa@evaluasi.pintar.test',
    null, now(),
    '{"provider":"email","providers":["email"]}', '{"display_name":"Aisyah (peraga)"}', now(), now(), '', '', '', ''),
   (u_guru,  '00000000-0000-0000-0000-000000000000','authenticated','authenticated',
    'peraga-guru@evaluasi.pintar.test',
    null, now(),
    '{"provider":"email","providers":["email"]}', '{"display_name":"Pak Rahmat (peraga)"}', now(), now(), '', '', '', ''),
   (u_hod,   '00000000-0000-0000-0000-000000000000','authenticated','authenticated',
    'peraga-kaprodi@evaluasi.pintar.test',
    null, now(),
    '{"provider":"email","providers":["email"]}', '{"display_name":"Bu Sari (peraga)"}', now(), now(), '', '', '', ''),
   (u_dekan, '00000000-0000-0000-0000-000000000000','authenticated','authenticated',
    'peraga-kepala@evaluasi.pintar.test',
    null, now(),
    '{"provider":"email","providers":["email"]}', '{"display_name":"Pak Hendra (peraga)"}', now(), now(), '', '', '', ''),
   (u_admin, '00000000-0000-0000-0000-000000000000','authenticated','authenticated',
    'peraga-admin@evaluasi.pintar.test',
    null, now(),
    '{"provider":"email","providers":["email"]}', '{"display_name":"Bu Ratna (peraga)"}', now(), now(), '', '', '', ''),
   (u_eval,  '00000000-0000-0000-0000-000000000000','authenticated','authenticated',
    'penilai@evaluasi.pintar.test',
    extensions.crypt('Penilai-Evaluasi-4417!', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{"display_name":"Penilai PINTAR"}', now(), now(), '', '', '', '');

  insert into auth.identities (id, user_id, provider_id, identity_data, provider,
                               last_sign_in_at, created_at, updated_at)
  select gen_random_uuid(), u.id, u.id::text,
         jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
         'email', now(), now(), now()
    from auth.users u where u.id in (u_siswa, u_guru, u_hod, u_dekan, u_admin, u_eval);

  select person_id into p_siswa from public.accounts where auth_user_id = u_siswa;
  select person_id into p_guru  from public.accounts where auth_user_id = u_guru;
  select person_id into p_hod   from public.accounts where auth_user_id = u_hod;
  select person_id into p_dekan from public.accounts where auth_user_id = u_dekan;
  select person_id into p_admin from public.accounts where auth_user_id = u_admin;
  select person_id into p_eval  from public.accounts where auth_user_id = u_eval;

  -- Every grant is SCOPED to a node inside this school. None is unscoped and
  -- none is SYSTEM_ADMIN -- 0066's persona guard refuses both, and that refusal
  -- is why there is no sixth persona to seed.
  insert into public.role_assignments (person_id, role, scope_node_id, valid_until) values
    (p_admin, 'INSTITUTION_ADMIN',  inst, now() + interval '10 years'),
    (p_dekan, 'DEAN',               fac,  now() + interval '10 years'),
    (p_hod,   'HEAD_OF_DEPARTMENT', dept, now() + interval '10 years'),
    (p_guru,  'EDUCATOR',           cls,  now() + interval '10 years');

  insert into public.enrollments (person_id, institution_id, academic_period_id, programme_id, status)
  values (p_siswa, inst, period, prog, 'ACTIVE') returning id into e_siswa;
  insert into public.memberships (enrollment_id, node_id, academic_period_id)
  values (e_siswa, coh, period), (e_siswa, cls, period);

  -- ------------------------------------------------------------- content
  insert into public.sources (institution_id, title, publisher, isbn, note)
  values (inst, 'Bahan Ajar Peragaan — Pecahan', 'PINTAR (peragaan)', null,
          'Konten peragaan untuk evaluasi manusia. Bukan terbitan nyata.')
  returning id into src;
  insert into public.source_versions (source_id, institution_id, version_label)
  values (src, inst, 'peragaan-1') returning id into srcv;

  insert into public.courses (institution_id, subject, stage, grade_label, title, author_person_id)
  values (inst, 'Matematika', 'SD', 'Kelas 5', 'Pecahan Senilai', p_guru) returning id into course;
  insert into public.modules (course_id, institution_id, ordinal, title, author_person_id)
  values (course, inst, 1, 'Mengenal Pecahan Senilai', p_guru) returning id into modul;
  insert into public.lessons (module_id, institution_id, ordinal, title, summary, body_markdown,
                              worked_examples, media, source_version_id, page_citation, author_person_id)
  values (modul, inst, 1, 'Pecahan yang Nilainya Sama',
          'Dua pecahan senilai bila pembilang dan penyebutnya dikali atau dibagi bilangan yang sama.',
          E'## Mengali\n\nKalikan pembilang dan penyebut dengan bilangan yang sama.\n\n## Membagi\n\nBagi keduanya dengan bilangan yang sama.',
          '[{"judul":"1/2 menjadi 2/4","langkah":["Kalikan pembilang dengan dua.","Kalikan penyebut dengan dua.","Nilainya tetap sama."]}]'::jsonb,
          '[]'::jsonb, srcv, 'Bagian 2 · halaman 11–17', p_guru)
  returning id into les;

  insert into public.learning_objectives (lesson_id, institution_id, code, statement, bloom, is_core) values
    (les, inst, 'MTK5-P1', 'Menentukan pecahan senilai dengan mengali.', 'APPLY', true),
    (les, inst, 'MTK5-P2', 'Menentukan pecahan senilai dengan membagi.', 'APPLY', true);
  select id into ob1 from public.learning_objectives where lesson_id=les and code='MTK5-P1';
  select id into ob2 from public.learning_objectives where lesson_id=les and code='MTK5-P2';

  insert into public.misconception_taxonomy (code, institution_id, label, description, remediation) values
    ('MK-PCH-01-' || tag, inst, 'Hanya mengubah pembilang',
     'Peserta didik mengali pembilang saja dan membiarkan penyebutnya.',
     'Tunjukkan bahwa keduanya harus dikali bilangan yang sama.'),
    ('MK-PCH-02-' || tag, inst, 'Menambah alih-alih mengali',
     'Peserta didik menambahkan bilangan yang sama ke pembilang dan penyebut.',
     'Bandingkan hasilnya dengan gambar; nilainya berubah.');

  spec := jsonb_build_array(
    jsonb_build_object('d',0.20,'sc',false,'o',ob1,'stem','Pecahan senilai dengan 1/2 adalah?','ans','B',
      'opts', jsonb_build_array('1/4 saja','2/4 dan 3/6','1/3 dan 1/5','2/3 dan 3/4')),
    jsonb_build_object('d',0.22,'sc',false,'o',ob1,'stem','1/3 senilai dengan pecahan mana?','ans','C',
      'opts', jsonb_build_array('1/6 saja','3/1 saja','2/6 dan 3/9','2/5 dan 3/7')),
    jsonb_build_object('d',0.24,'sc',false,'o',ob1,'stem','2/5 dikali dua menjadi?','ans','A',
      'opts', jsonb_build_array('4/10','4/5','2/10','6/15')),
    jsonb_build_object('d',0.26,'sc',true ,'o',ob1,'stem','3/4 senilai dengan?','ans','D',
      'opts', jsonb_build_array('3/8 saja','6/4 saja','3/12 saja','6/8 dan 9/12')),
    jsonb_build_object('d',0.48,'sc',false,'o',ob2,'stem','6/8 disederhanakan menjadi?','ans','B',
      'opts', jsonb_build_array('2/4 saja','3/4 tepat','6/4 tepat','8/6 tepat')),
    jsonb_build_object('d',0.50,'sc',false,'o',ob2,'stem','10/15 disederhanakan menjadi?','ans','A',
      'opts', jsonb_build_array('2/3 tepat','5/3 tepat','1/5 tepat','3/2 tepat')),
    jsonb_build_object('d',0.52,'sc',false,'o',ob2,'stem','12/16 disederhanakan menjadi?','ans','C',
      'opts', jsonb_build_array('6/4 tepat','4/3 tepat','3/4 tepat','2/8 tepat')),
    jsonb_build_object('d',0.54,'sc',true ,'o',ob2,'stem','9/12 disederhanakan menjadi?','ans','D',
      'opts', jsonb_build_array('9/4 tepat','3/12 saja','4/3 tepat','3/4 tepat')),
    jsonb_build_object('d',0.76,'sc',false,'o',ob2,'stem','Mana yang TIDAK senilai dengan 2/3?','ans','A',
      'opts', jsonb_build_array('3/4 jelas','4/6 jelas','6/9 jelas','8/12 jelas')),
    jsonb_build_object('d',0.78,'sc',false,'o',ob2,'stem','20/25 disederhanakan menjadi?','ans','B',
      'opts', jsonb_build_array('5/4 tepat','4/5 tepat','2/5 tepat','5/2 tepat')),
    jsonb_build_object('d',0.80,'sc',false,'o',ob2,'stem','Mana yang senilai dengan 5/10?','ans','C',
      'opts', jsonb_build_array('5/2 jelas','2/5 jelas','1/2 jelas','10/5 jelas')),
    jsonb_build_object('d',0.82,'sc',false,'o',ob2,'stem','18/24 disederhanakan menjadi?','ans','D',
      'opts', jsonb_build_array('4/3 tepat','6/4 tepat','2/8 tepat','3/4 tepat')));

  for entry in select * from jsonb_array_elements(spec) loop
    insert into public.items (lesson_id, institution_id, item_type, bank_type, stem,
      petunjuk, arah_berpikir, objective_ids, is_safety_critical, predicted_difficulty,
      source_version_id, page_citation, status, author_person_id)
    values (les, inst, 'MCQ_SINGLE', 'TEST', entry ->> 'stem',
      'Ingat bahwa pembilang dan penyebut diperlakukan sama.',
      'Periksa apakah keduanya dikali atau dibagi bilangan yang sama.',
      array[(entry ->> 'o')::uuid], (entry ->> 'sc')::boolean, (entry ->> 'd')::numeric,
      srcv, 'Bagian 2 · halaman 11–17', 'INGESTED', p_guru)
    returning id into it;
    for opt in select * from jsonb_array_elements(entry -> 'opts') loop
      insert into public.item_options (item_id, institution_id, label, body, is_correct,
        rationale, misconception_code)
      values (it, inst,
        chr(65 + (select count(*) from public.item_options where item_id = it)::int),
        opt #>> '{}',
        chr(65 + (select count(*) from public.item_options where item_id = it)::int) = (entry ->> 'ans'),
        case when chr(65 + (select count(*) from public.item_options where item_id = it)::int) = (entry ->> 'ans')
             then 'Pembilang dan penyebut diperlakukan sama, sehingga nilainya tetap.'
             else 'Pembilang dan penyebut tidak diperlakukan sama, sehingga nilainya berubah.' end,
        case when chr(65 + (select count(*) from public.item_options where item_id = it)::int) = (entry ->> 'ans')
             then null
             when (random() < 0.5) then 'MK-PCH-01-' || tag else 'MK-PCH-02-' || tag end);
    end loop;
    foreach t in array array['STRUCTURED','VALIDATED','IN_REVIEW'] loop
      update public.items set status = t::public.content_status where id = it;
    end loop;
  end loop;

  foreach t in array array['STRUCTURED','VALIDATED','IN_REVIEW'] loop
    update public.lessons set status = t::public.content_status where id = les;
    update public.modules set status = t::public.content_status where id = modul;
    update public.courses set status = t::public.content_status where id = course;
  end loop;

  -- Approved AS the reviewer persona, because approval is a capability act by
  -- the reviewer of record and the authoring above is the educator's. Those two
  -- perspectives are exactly what the evaluator switches between.
  perform set_config('request.jwt.claim.sub', u_hod::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', u_hod, 'role','authenticated')::text, true);
  update public.items   set status='APPROVED', reviewed_by_person_id=p_hod, reviewed_at=now() where lesson_id = les;
  update public.lessons set status='APPROVED', reviewed_by_person_id=p_hod, reviewed_at=now() where id = les;
  update public.modules set status='APPROVED', reviewed_by_person_id=p_hod, reviewed_at=now() where id = modul;
  update public.courses set status='APPROVED', reviewed_by_person_id=p_hod, reviewed_at=now() where id = course;
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claims', '', true);

  insert into public.assessment_definitions (institution_id, module_id, title, mode,
    bank_type, item_count, safety_critical_minimum, difficulty_mix, passing_rules, attempt_limit,
    allows_pause, offline_tolerant, late_sync_grace_seconds, hesitation_window_seconds,
    shuffle_policy, status, author_person_id, reviewed_by_person_id, reviewed_at)
  values (inst, modul, 'Penguasaan Pecahan Senilai', 'POST_TEST', 'TEST', 6, 1,
    jsonb_build_object('MUDAH', 2, 'SEDANG', 2, 'SULIT', 2),
    jsonb_build_object('mastery_min', 0.6), 1, false, true, 300, 25, 'ITEMS_AND_OPTIONS',
    'INGESTED', p_guru, null, null)
  returning id into defn;
  foreach t in array array['STRUCTURED','VALIDATED','IN_REVIEW'] loop
    update public.assessment_definitions set status = t::public.content_status where id = defn;
  end loop;
  perform set_config('request.jwt.claim.sub', u_hod::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', u_hod, 'role','authenticated')::text, true);
  update public.assessment_definitions set status='APPROVED', reviewed_by_person_id=p_hod, reviewed_at=now()
   where id = defn;
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claims', '', true);

  -- The real quality gate. A demonstration fixture that could not pass the gate
  -- would demonstrate the wrong thing.
  -- run as the Head of Department, who holds CAN_DRAFT (0085).
  perform set_config('request.jwt.claim.sub', u_hod::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', u_hod, 'role','authenticated')::text, true);
  perform public.validate_course_content(course);
  perform public.run_mcq_quality(course);
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claims', '', true);
  select status, blockers into v_status, v_blockers from public.publish_readiness(course);
  if v_status <> 'READY' then
    raise exception 'evaluation content is not publishable (%): % — fix the fixture, never the gate',
      v_status, v_blockers::text;
  end if;

  insert into public.plp_releases (institution_id, course_id, version_label, author_person_id)
  values (inst, course, '1.0.0', p_guru) returning id into rel;
  foreach t in array array['STRUCTURED','VALIDATED','IN_REVIEW'] loop
    update public.plp_releases set status = t::public.content_status where id = rel;
  end loop;
  perform set_config('request.jwt.claim.sub', u_hod::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', u_hod, 'role','authenticated')::text, true);
  update public.plp_releases set status='APPROVED', reviewed_by_person_id=p_hod, reviewed_at=now() where id = rel;
  update public.plp_releases set status='FROZEN' where id = rel;
  perform set_config('request.jwt.claim.sub', u_admin::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', u_admin, 'role','authenticated')::text, true);
  update public.plp_releases set status='PUBLISHED' where id = rel;

  insert into public.learning_assignments (institution_id, plp_release_id, course_id, node_id,
    academic_period_id, is_required, learning_cycle, assigned_by_person_id, assigned_at)
  values (inst, rel, course, cls, period, true, jsonb_build_object('post_test', defn), p_admin, now())
  returning id into la;
  update public.learning_assignments set status='ACTIVE' where id = la;

  insert into public.assessment_assignments (institution_id, assessment_definition_id,
    learning_assignment_id, node_id, academic_period_id, opens_at, closes_at,
    assigned_by_person_id, assigned_at)
  values (inst, defn, la, cls, period, now() - interval '1 hour', now() + interval '30 days',
          p_admin, now()) returning id into aa;
  foreach t in array array['SCHEDULED','OPEN'] loop
    update public.assessment_assignments set status = t::public.assessment_assignment_status where id = aa;
  end loop;
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claims', '', true);

  -- --------------------------------------------------- canonical material
  -- So the evaluator sees the distribution model working: a release the school
  -- did not author and cannot edit, granted by its owner and usable here.
  select id into canon from public.institutions where tenant_kind = 'PLATFORM_CANONICAL' limit 1;
  if canon is not null then
    -- aliased `rel_c`, not `r`: `r` is the record variable the answer loop below
    -- uses, and plpgsql resolves a name to the variable before the alias.
    select rel_c.id into canon_rel from public.plp_releases rel_c
     where rel_c.institution_id = canon and rel_c.status = 'PUBLISHED'
     order by rel_c.published_at desc nulls last, rel_c.created_at desc limit 1;
    select ra.person_id into canon_admin from public.role_assignments ra
     where ra.institution_id = canon and ra.role in ('INSTITUTION_ADMIN','SYSTEM_ADMIN')
       and ra.revoked_at is null limit 1;
    if canon_rel is not null and canon_admin is not null then
      perform set_config('request.jwt.claim.sub',
        (select a.auth_user_id::text from public.accounts a where a.person_id = canon_admin), true);
      perform set_config('request.jwt.claims',
        json_build_object('sub', (select a.auth_user_id from public.accounts a where a.person_id = canon_admin),
                          'role','authenticated')::text, true);
      dist := public.grant_release_distribution(canon_rel, inst, 'materi kanonik untuk sekolah peragaan');
      perform set_config('request.jwt.claim.sub', '', true);
      perform set_config('request.jwt.claims', '', true);
    end if;
  end if;
  if dist is null then
    raise notice 'human-evaluation: no canonical release to distribute; the school works without it';
  end if;

  -- --------------------------------------------------- the learner's journey
  -- Run AS the learner persona, through the ordinary functions. These are the
  -- rows the educator persona will review and the dean will see in aggregate --
  -- there is no second copy of them anywhere.
  perform set_config('request.jwt.claim.sub', u_siswa::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', u_siswa, 'role','authenticated')::text, true);
  v_session := public.start_learning_session(aa);
  for r in select pi.id as pid, pi.item_id from public.presented_items pi
            where pi.session_id = v_session order by pi.position
  loop
    select d.display_position into v_pos
      from public.option_display_order(v_session, r.item_id) d
      join public.item_options o on o.item_id = r.item_id and o.label = d.label
     where o.is_correct limit 1;
    perform public.record_answer(r.pid, 1, jsonb_build_object('posisi', v_pos));
  end loop;
  perform public.finish_my_session(v_session);
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claims', '', true);

  -- The eligibility is real or this seed is a lie. Checked, not assumed.
  select * into v_elig from public.certificate_eligibility(v_session);
  if not v_elig.eligible then
    raise exception 'the demonstration learner did not reach ELIGIBLE (%): the certificate journey is not reachable',
      v_elig.reason;
  end if;
  if (select s.evidence_class from public.assessment_sessions s where s.id = v_session) <> 'OFFICIAL' then
    raise exception 'the demonstration session is not OFFICIAL evidence; §5''s whole reason is unmet';
  end if;

  -- --------------------------------------------------- the facility itself
  -- FIVE personas. There is no sixth: 0066 refuses a SYSTEM_ADMIN perspective
  -- outright, so this is a fact about the schema rather than a choice made here.
  -- Five personas. There is no sixth: 0066 refuses a SYSTEM_ADMIN perspective
  -- outright, so this is a fact about the schema rather than a choice made here.
  --
  -- Their role grants are STANDING, and 0069 explains why they have to be: a
  -- grant cannot be made at assume time, because `role_assignments_guard`
  -- refuses an evaluator as grantor (INV-16), and it cannot be narrowed later,
  -- because grants are immutable. Expiry is therefore carried entirely by the
  -- persona's access token, which is minted without refresh material.
  insert into public.evaluation_personas (person_id, institution_id, label, role_perspective, ordinal) values
    (p_siswa, inst, 'Murid',                  'STUDENT',            1),
    (p_guru,  inst, 'Guru',                   'EDUCATOR',           2),
    (p_hod,   inst, 'Penelaah & Penerbit',    'HEAD_OF_DEPARTMENT', 3),
    (p_dekan, inst, 'Pimpinan Sekolah',       'DEAN',               4),
    (p_admin, inst, 'Administrator Sekolah',  'INSTITUTION_ADMIN',  5);
  select array_agg(id) into v_persona_ids from public.evaluation_personas where institution_id = inst;
  if array_length(v_persona_ids, 1) <> 5 then
    raise exception 'the evaluation hub has % persona(s), expected exactly five', array_length(v_persona_ids, 1);
  end if;

  insert into public.evaluation_evaluators (person_id, note)
  values (p_eval, 'penilai evaluasi manusia');

  -- and the boundary holds over what was just built, measured rather than hoped
  if not (select a.ok from public.assert_evaluation_boundary() a) then
    raise exception 'the evaluation boundary is false over this seed: %',
      (select a.detail from public.assert_evaluation_boundary() a);
  end if;

  select count(*) into n from public.presented_items where session_id = v_session;
  raise notice 'human-evaluation: school % ready — release %, session % (% items, %, predikat %), 5 personas, 1 evaluator%',
    inst, rel, v_session, n, v_elig.mastery, v_elig.predikat,
    case when dist is null then '' else ', canonical distribution granted' end;
end $$;
