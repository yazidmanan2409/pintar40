-- D1 — the OFFICIAL-evidence bootstrap tenant.
--
-- WHY IT EXISTS. Every other institution in this project is synthetic, so
-- `derive_evidence_class` caps every session at SYNTHETIC and no certificate
-- can ever be issued. FABLE-03 escalated that rather than improvising around
-- it; Yazid approved Option 1 on 2026-09-13. This is that one clearly named
-- non-synthetic institution, and nothing else in the project is permitted to be
-- one outside production -- 0042 enforces that with a trigger, a single-
-- occupancy index and a counted lint value, so the bootstrap is visible rather
-- than an invisible side effect of having run a seed.
--
-- THE GUARD IS THE POINT. This file runs under the same INV-21 guards as every
-- other seed: it refuses on a production environment and refuses without
-- declared intent. The flag is still spelled `synthetic` even though this
-- tenant is not -- the flag means "this is a seeded fixture environment", not
-- "this row is synthetic", and renaming it would touch FABLE-01's guard for
-- cosmetic reasons. The naming mismatch is recorded in ADR-0008 rather than
-- papered over.
--
-- WHAT IT IS NOT. It is not a production tenant and cannot become one: 0042
-- refuses the bootstrap flag outright when the environment is production. It
-- adds no derivation input -- `derive_evidence_class` is untouched and returns
-- OFFICIAL here for the ordinary reason, because the tenant is genuinely
-- non-synthetic. Monotonicity is untouched: an override can still only weaken.

select set_config('app.seed_intent', 'synthetic', true);

do $$
declare
  v_env text; inst uuid; period uuid; fac uuid; dept uuid; prog uuid; coh uuid; cls uuid;
  u_guru uuid := gen_random_uuid(); u_hod uuid := gen_random_uuid();
  u_admin uuid := gen_random_uuid(); u_siswa uuid := gen_random_uuid();
  p_guru uuid; p_hod uuid; p_admin uuid; p_siswa uuid; e_siswa uuid;
  src uuid; srcv uuid; course uuid; modul uuid; les uuid;
  ob1 uuid; ob2 uuid; tag text; rel uuid; defn uuid; la uuid; aa uuid;
  spec jsonb; entry jsonb; opt jsonb; it uuid; t text;
  v_status text; v_blockers text[]; n int;
begin
  select environment into v_env from public.platform_environment;
  -- L3-F01: fail-closed. This seed creates credential-bearing auth.users
  -- (including a bootstrap ADMIN). It runs only where the local seed pipeline
  -- set the marker; a migrations-only hosted project keeps it false and refuses.
  if not public.synthetic_fixtures_permitted() then
    raise exception 'seed refused: bootstrap credential fixtures are local-only (L3-F01); platform_environment.local_fixtures_enabled is false';
  end if;
  if v_env = 'production' then
    raise exception 'seed refused: the OFFICIAL bootstrap tenant is never created in production (D1, INV-21)';
  end if;
  if current_setting('app.seed_intent', true) is distinct from 'synthetic' then
    raise exception 'seed refused: app.seed_intent must be ''synthetic'' (INV-21)';
  end if;

  -- idempotent: remove only what this seed owns
  if exists (select 1 from public.institutions where slug = 'pintar-bootstrap-official') then
    raise notice 'bootstrap: tenant already present, leaving it alone';
    return;
  end if;

  -- CHANGED BY 0065. D1's "one bootstrap tenant" became "every institution
  -- authorized for non-production OFFICIAL evidence declares a bounded purpose;
  -- at most one per purpose; all refused in production" (ADR B §5). This tenant
  -- must therefore say WHY it is authorized, and the CHECK refuses it if it does
  -- not. Its purpose is unchanged in substance -- it is the engineering
  -- bootstrap it always was -- but it is now declared rather than implied.
  insert into public.institutions (slug, name, is_synthetic, is_official_bootstrap,
                                   official_evidence_purpose)
  values ('pintar-bootstrap-official',
          'PINTAR Bootstrap (OFFICIAL evidence — development and CI only)', false, true,
          'D1_ENGINEERING_BOOTSTRAP')
  returning id into inst;
  tag := right('pintar-bootstrap-official', 14);

  insert into public.academic_periods (institution_id, name, starts_on, ends_on)
  values (inst, '2026/27', date '2026-07-01', date '2027-06-30') returning id into period;
  -- the INSTITUTION root is created by the institutions_after_insert trigger;
  -- doc 02's chain is INSTITUTION > FACULTY > DEPARTMENT > PROGRAMME > COHORT > CLASS
  insert into public.org_nodes (institution_id, parent_id, kind, name)
  values (inst, inst, 'FACULTY', 'Sekolah Dasar') returning id into fac;
  insert into public.org_nodes (institution_id, parent_id, kind, name)
  values (inst, fac, 'DEPARTMENT', 'Matematika') returning id into dept;
  insert into public.org_nodes (institution_id, parent_id, kind, name)
  values (inst, dept, 'PROGRAMME', 'SD Bootstrap') returning id into prog;
  insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
  values (inst, prog, 'COHORT', 'Angkatan 5', period) returning id into coh;
  insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
  values (inst, coh, 'CLASS', '5B', period) returning id into cls;

  insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
                          raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
                          confirmation_token, recovery_token, email_change_token_new, email_change)
  values
   (u_guru,  '00000000-0000-0000-0000-000000000000','authenticated','authenticated',
    'boot-guru@bootstrap.pintar.test', extensions.crypt('Bootstrap-Guru-7741!', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{"display_name":"Guru Bootstrap"}', now(), now(), '', '', '', ''),
   (u_hod,   '00000000-0000-0000-0000-000000000000','authenticated','authenticated',
    'boot-kaprodi@bootstrap.pintar.test', extensions.crypt('Bootstrap-Kaprodi-5528!', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{"display_name":"Kaprodi Bootstrap"}', now(), now(), '', '', '', ''),
   (u_admin, '00000000-0000-0000-0000-000000000000','authenticated','authenticated',
    'boot-admin@bootstrap.pintar.test', extensions.crypt('Bootstrap-Admin-9163!', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{"display_name":"Admin Bootstrap"}', now(), now(), '', '', '', ''),
   (u_siswa, '00000000-0000-0000-0000-000000000000','authenticated','authenticated',
    'boot-siswa@bootstrap.pintar.test', extensions.crypt('Bootstrap-Siswa-3082!', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{"display_name":"Siswa Bootstrap"}', now(), now(), '', '', '', '');

  insert into auth.identities (id, user_id, provider_id, identity_data, provider,
                               last_sign_in_at, created_at, updated_at)
  select gen_random_uuid(), u.id, u.id::text,
         jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
         'email', now(), now(), now()
    from auth.users u where u.id in (u_guru, u_hod, u_admin, u_siswa);

  select person_id into p_guru  from public.accounts where auth_user_id = u_guru;
  select person_id into p_hod   from public.accounts where auth_user_id = u_hod;
  select person_id into p_admin from public.accounts where auth_user_id = u_admin;
  select person_id into p_siswa from public.accounts where auth_user_id = u_siswa;

  -- scoped to the institution's own root node: the check constraint requires a
  -- scope, and the trigger derives institution_id from it
  insert into public.role_assignments (person_id, role, scope_node_id, valid_until) values
    (p_admin, 'INSTITUTION_ADMIN',  inst, now() + interval '10 years'),
    (p_hod,   'HEAD_OF_DEPARTMENT', dept, now() + interval '10 years'),
    (p_guru,  'EDUCATOR',           cls,  now() + interval '10 years');

  insert into public.enrollments (person_id, institution_id, academic_period_id, programme_id, status)
  values (p_siswa, inst, period, prog, 'ACTIVE') returning id into e_siswa;
  insert into public.memberships (enrollment_id, node_id, academic_period_id)
  values (e_siswa, coh, period), (e_siswa, cls, period);

  -- ------------------------------------------------------------- content
  insert into public.sources (institution_id, title, publisher, isbn, note)
  values (inst, 'Bahan Ajar Bootstrap PINTAR — Pengukuran', 'PINTAR (bootstrap)', null,
          'Konten fixture untuk jalur sertifikat. Bukan terbitan nyata; sumber sebenarnya menunggu OD-3.')
  returning id into src;
  insert into public.source_versions (source_id, institution_id, version_label)
  values (src, inst, 'bootstrap-1') returning id into srcv;

  insert into public.courses (institution_id, subject, stage, grade_label, title, author_person_id)
  values (inst, 'Matematika', 'SD', 'Kelas 5', 'Pengukuran', p_guru) returning id into course;
  insert into public.modules (course_id, institution_id, ordinal, title, author_person_id)
  values (course, inst, 1, 'Satuan Panjang', p_guru) returning id into modul;
  insert into public.lessons (module_id, institution_id, ordinal, title, summary, body_markdown,
                              worked_examples, media, source_version_id, page_citation, author_person_id)
  values (modul, inst, 1, 'Mengubah Satuan Panjang',
          'Satuan panjang berubah sepuluh kali setiap turun satu tingkat.',
          E'## Tangga satuan\n\nSetiap turun satu tingkat, angkanya dikali sepuluh.\n\n## Naik tingkat\n\nSetiap naik satu tingkat, angkanya dibagi sepuluh.',
          '[{"judul":"2 m menjadi cm","langkah":["Dari m ke cm turun dua tingkat.","Dikali sepuluh dua kali.","Hasilnya 200 cm."]}]'::jsonb,
          '[]'::jsonb, srcv, 'Bagian 1 · halaman 4–9', p_guru)
  returning id into les;

  insert into public.learning_objectives (lesson_id, institution_id, code, statement, bloom, is_core) values
    (les, inst, 'MTK5-B1', 'Mengubah satuan panjang satu tingkat.', 'APPLY', true),
    (les, inst, 'MTK5-B2', 'Mengubah satuan panjang beberapa tingkat.', 'APPLY', true);
  select id into ob1 from public.learning_objectives where lesson_id=les and code='MTK5-B1';
  select id into ob2 from public.learning_objectives where lesson_id=les and code='MTK5-B2';

  insert into public.misconception_taxonomy (code, institution_id, label, description, remediation) values
    ('MK-UKR-01-' || tag, inst, 'Membagi ketika seharusnya mengali',
     'Peserta didik membalik arah tangga satuan.',
     'Gambar tangganya lebih dulu, lalu tentukan arahnya sebelum menghitung.'),
    ('MK-UKR-02-' || tag, inst, 'Melewatkan satu tingkat',
     'Peserta didik menghitung satu tingkat lebih sedikit.',
     'Hitung tingkatnya satu per satu sambil menunjuk gambarnya.');

  -- Twelve items, four per difficulty band, two safety-critical. Option
  -- lengths are kept close and correct labels spread, because run_mcq_quality()
  -- looks for exactly those patterns and a fixture that trips its own gate is
  -- not a fixture.
  spec := jsonb_build_array(
    jsonb_build_object('d',0.20,'sc',false,'o',ob1,'stem','Berapa cm dalam 3 m?','ans','B',
      'opts', jsonb_build_array('30 cm','300 cm','3.000 cm','0,03 cm')),
    jsonb_build_object('d',0.22,'sc',false,'o',ob1,'stem','Berapa mm dalam 4 cm?','ans','C',
      'opts', jsonb_build_array('0,4 mm','4 mm','40 mm','400 mm')),
    jsonb_build_object('d',0.24,'sc',false,'o',ob1,'stem','Berapa dm dalam 7 m?','ans','A',
      'opts', jsonb_build_array('70 dm','7 dm','700 dm','0,7 dm')),
    jsonb_build_object('d',0.26,'sc',true ,'o',ob1,'stem','Berapa cm dalam 1 m?','ans','D',
      'opts', jsonb_build_array('10 cm','1.000 cm','0,1 cm','100 cm')),
    jsonb_build_object('d',0.48,'sc',false,'o',ob2,'stem','Berapa mm dalam 2 m?','ans','B',
      'opts', jsonb_build_array('200 mm','2.000 cm','20 mm','20.000 mm')),
    jsonb_build_object('d',0.50,'sc',false,'o',ob2,'stem','Berapa km dalam 5.000 m?','ans','A',
      'opts', jsonb_build_array('5 km','50 km','0,5 km','500 km')),
    jsonb_build_object('d',0.52,'sc',false,'o',ob2,'stem','Berapa m dalam 250 cm?','ans','C',
      'opts', jsonb_build_array('25 m','0,25 m','2,5 m','250 m')),
    jsonb_build_object('d',0.54,'sc',true ,'o',ob2,'stem','Berapa m dalam 3 km?','ans','D',
      'opts', jsonb_build_array('30 m','300 m','30.000 m','3.000 m')),
    jsonb_build_object('d',0.76,'sc',false,'o',ob2,'stem','Berapa mm dalam 1,5 m?','ans','A',
      'opts', jsonb_build_array('1.500 mm','150 mm','15 mm','15.000 mm')),
    jsonb_build_object('d',0.78,'sc',false,'o',ob2,'stem','Berapa cm dalam 0,4 km?','ans','B',
      'opts', jsonb_build_array('4.000 cm','40.000 cm','400 cm','400.000 cm')),
    jsonb_build_object('d',0.80,'sc',false,'o',ob2,'stem','Berapa dm dalam 6,5 m?','ans','C',
      'opts', jsonb_build_array('6,5 dm','650 dm','65 dm','0,65 dm')),
    jsonb_build_object('d',0.82,'sc',false,'o',ob2,'stem','Berapa m dalam 12.500 cm?','ans','D',
      'opts', jsonb_build_array('1,25 m','1.250 m','12,5 m','125 m')));

  for entry in select * from jsonb_array_elements(spec) loop
    insert into public.items (lesson_id, institution_id, item_type, bank_type, stem,
      petunjuk, arah_berpikir, objective_ids, is_safety_critical, predicted_difficulty,
      source_version_id, page_citation, status, author_person_id)
    values (les, inst, 'MCQ_SINGLE', 'TEST', entry ->> 'stem',
      'Tentukan arah tangganya dulu, lalu hitung tingkatnya satu per satu.',
      'Perhatikan apakah satuannya menjadi lebih kecil atau lebih besar.',
      array[(entry ->> 'o')::uuid], (entry ->> 'sc')::boolean, (entry ->> 'd')::numeric,
      srcv, 'Bagian 1 · halaman 4–9', 'INGESTED', p_guru)
    returning id into it;
    for opt in select * from jsonb_array_elements(entry -> 'opts') loop
      insert into public.item_options (item_id, institution_id, label, body, is_correct,
        rationale, misconception_code)
      values (it, inst,
        chr(65 + (select count(*) from public.item_options where item_id = it)::int),
        opt #>> '{}',
        chr(65 + (select count(*) from public.item_options where item_id = it)::int) = (entry ->> 'ans'),
        case when chr(65 + (select count(*) from public.item_options where item_id = it)::int) = (entry ->> 'ans')
             then 'Arah dan banyaknya tingkat sudah tepat, sehingga hasilnya benar.'
             else 'Arah tangga atau banyaknya tingkat belum tepat, sehingga hasilnya meleset.' end,
        case when chr(65 + (select count(*) from public.item_options where item_id = it)::int) = (entry ->> 'ans')
             then null
             when (random() < 0.5) then 'MK-UKR-01-' || tag else 'MK-UKR-02-' || tag end);
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

  -- Approve AS the Head of Department. From 0057 an approval is a capability
  -- act performed by the reviewer of record; the authoring above stays the
  -- educator's, which is why the two are separated here rather than merged.
  perform set_config('request.jwt.claim.sub', u_hod::text, true);
  perform set_config('request.jwt.claims',
    json_build_object('sub', u_hod, 'role','authenticated')::text, true);
  update public.items   set status='APPROVED', reviewed_by_person_id=p_hod, reviewed_at=now()
   where lesson_id = les;
  update public.lessons set status='APPROVED', reviewed_by_person_id=p_hod, reviewed_at=now() where id = les;
  update public.modules set status='APPROVED', reviewed_by_person_id=p_hod, reviewed_at=now() where id = modul;
  update public.courses set status='APPROVED', reviewed_by_person_id=p_hod, reviewed_at=now() where id = course;
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claims', '', true);

  -- the definition that certifies: POST_TEST, which mode_policy marks certifying
  insert into public.assessment_definitions (institution_id, module_id, title, mode,
    bank_type, item_count, safety_critical_minimum, difficulty_mix, passing_rules, attempt_limit,
    allows_pause, offline_tolerant, late_sync_grace_seconds, hesitation_window_seconds,
    shuffle_policy, status, author_person_id, reviewed_by_person_id, reviewed_at)
  values (inst, modul, 'Penguasaan Satuan Panjang', 'POST_TEST', 'TEST', 6, 1,
    jsonb_build_object('MUDAH', 2, 'SEDANG', 2, 'SULIT', 2),
    jsonb_build_object('mastery_min', 0.6), 1, false, true, 300, 25, 'ITEMS_AND_OPTIONS',
    'INGESTED', p_guru, null, null)
  returning id into defn;
  foreach t in array array['STRUCTURED','VALIDATED','IN_REVIEW'] loop
    update public.assessment_definitions set status = t::public.content_status where id = defn;
  end loop;
  perform set_config('request.jwt.claim.sub', u_hod::text, true);
  perform set_config('request.jwt.claims',
    json_build_object('sub', u_hod, 'role','authenticated')::text, true);
  update public.assessment_definitions set status='APPROVED', reviewed_by_person_id=p_hod, reviewed_at=now()
   where id = defn;
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claims', '', true);

  -- the real quality gate, not a bypass
  perform public.validate_course_content(course);
  perform public.run_mcq_quality(course);
  select status, blockers into v_status, v_blockers from public.publish_readiness(course);
  if v_status <> 'READY' then
    raise exception 'bootstrap content is not publishable (%): % — fix the fixture, never the gate',
      v_status, array_to_string(v_blockers, '; ');
  end if;

  insert into public.plp_releases (institution_id, course_id, version_label, author_person_id)
  values (inst, course, '1.0.0', p_guru) returning id into rel;
  foreach t in array array['STRUCTURED','VALIDATED','IN_REVIEW'] loop
    update public.plp_releases set status = t::public.content_status where id = rel;
  end loop;
  perform set_config('request.jwt.claim.sub', (select id::text from auth.users where id = u_hod), true);
  perform set_config('request.jwt.claims',
    json_build_object('sub', u_hod, 'role','authenticated')::text, true);
  update public.plp_releases set status='APPROVED', reviewed_by_person_id=p_hod, reviewed_at=now() where id = rel;
  update public.plp_releases set status='FROZEN' where id = rel;
  perform set_config('request.jwt.claim.sub', (select id::text from auth.users where id = u_admin), true);
  update public.plp_releases set status='PUBLISHED' where id = rel;
  -- the admin context stays for the assignments, which require
  -- CAN_ASSIGN_LEARNING in the owning institution

  -- assignments walk their own lifecycle: created at DRAFT, then moved
  insert into public.learning_assignments (institution_id, plp_release_id, course_id, node_id,
    academic_period_id, is_required, learning_cycle, assigned_by_person_id, assigned_at)
  values (inst, rel, course, cls, period, true,
          jsonb_build_object('post_test', defn), p_admin, now())
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

  select count(*) into n from public.drawable_items_for_definition(defn);
  raise notice 'bootstrap: OFFICIAL tenant % ready — release %, definition %, assignment %, % drawable item(s)',
    inst, rel, defn, aa, n;
end $$;
