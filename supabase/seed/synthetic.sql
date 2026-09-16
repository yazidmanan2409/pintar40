-- Persona harness seed — SYNTHETIC tenants only (doc 16 §3; FABLE-01 §2).
-- Guards (INV-21): refuses on a production environment, and requires the
-- caller to declare synthetic intent for this transaction. Idempotent: it
-- removes and recreates only rows it owns (tagged by the *.synthetic.pintar.test
-- email domain and the synth-* institution slugs).
--
-- Personas (password for every EMAIL persona: see PW below — realistic,
-- distinct per persona, never a shared default):
--   sysadmin        platform SYSTEM_ADMIN
--   alpha-admin     INSTITUTION_ADMIN of Sekolah Sintetis Alpha
--   alpha-dean      DEAN (reads only)
--   alpha-hod       HEAD_OF_DEPARTMENT over Alpha's department
--   alpha-guru      EDUCATOR over class 5A (2026/27)
--   alpha-siswa-1   learner (email account), class 5A
--   alpha-siswa-2   learner (classroom card 7001, PIN 2468)
--   beta-admin      INSTITUTION_ADMIN of Sekolah Sintetis Beta
--   beta-siswa-1    learner at Beta
--   public user     no row (anonymous)

select set_config('app.seed_intent', 'synthetic', true);

do $$
declare
  v_env text;
  pepper text := 'synthetic-card-pepper-fable01-32plus';  -- must equal CARD_PEPPER used by the selftest env
  -- institutions
  alpha uuid; beta uuid;
  -- periods
  alpha_p1 uuid; alpha_p2 uuid; beta_p1 uuid;
  -- nodes
  a_fac uuid; a_dept uuid; a_prog uuid; a_coh5 uuid; a_cls5a uuid; a_coh6 uuid; a_cls6b uuid;
  b_fac uuid; b_dept uuid; b_prog uuid; b_coh uuid; b_cls uuid;
  -- auth users
  u_sys uuid := gen_random_uuid(); u_aadmin uuid := gen_random_uuid(); u_adean uuid := gen_random_uuid();
  u_ahod uuid := gen_random_uuid(); u_aguru uuid := gen_random_uuid(); u_as1 uuid := gen_random_uuid();
  u_as2 uuid := gen_random_uuid(); u_badmin uuid := gen_random_uuid(); u_bs1 uuid := gen_random_uuid();
  p_sys uuid; p_aadmin uuid; p_adean uuid; p_ahod uuid; p_aguru uuid; p_as1 uuid; p_as2 uuid; p_badmin uuid; p_bs1 uuid;
  e_as1 uuid; e_as2 uuid; e_bs1 uuid;
  pw_sys text := 'Sintetis-Sys-91!'; pw_aadmin text := 'Sintetis-AlphaAdmin-27!'; pw_adean text := 'Sintetis-AlphaDean-33!';
  pw_ahod text := 'Sintetis-AlphaHod-48!'; pw_aguru text := 'Sintetis-AlphaGuru-52!'; pw_as1 text := 'Sintetis-AlphaSiswa1-76!';
  pw_badmin text := 'Sintetis-BetaAdmin-61!'; pw_bs1 text := 'Sintetis-BetaSiswa1-19!';
  card2 text := '7001'; pin2 text := '2468';
  pw_as2 text;
begin
  select environment into v_env from public.platform_environment;
  if v_env = 'production' then raise exception 'seed refused: environment is production (INV-21)'; end if;
  -- L3-F01: fail-closed. Refuses on any database where the local seed pipeline
  -- has not set the marker -- which is every hosted (migrations-only) project.
  if not public.synthetic_fixtures_permitted() then
    raise exception 'seed refused: synthetic credential fixtures are local-only (L3-F01); platform_environment.local_fixtures_enabled is false';
  end if;
  if current_setting('app.seed_intent', true) is distinct from 'synthetic' then
    raise exception 'seed refused: app.seed_intent must be ''synthetic'' (INV-21)';
  end if;

  -- ---------------------------------------------------------------- reset
  -- Remove previous synthetic auth users (cascades to accounts). Persons,
  -- enrollments, memberships, audit rows are append-only by design, so a
  -- re-seed leaves prior synthetic history in place and creates fresh
  -- institutions with unique slugs per run.
  delete from auth.users where email like '%@synthetic.pintar.test' or email like '%@cards.synthetic.pintar.test';

  -- ---------------------------------------------------------- institutions
  insert into public.institutions (name, slug, is_synthetic)
  values ('Sekolah Sintetis Alpha', 'synth-alpha-' || to_char(now(),'YYYYMMDDHH24MISS'), true) returning id into alpha;
  insert into public.institutions (name, slug, is_synthetic)
  values ('Sekolah Sintetis Beta', 'synth-beta-' || to_char(now(),'YYYYMMDDHH24MISS'), true) returning id into beta;

  insert into public.academic_periods (institution_id, name, starts_on, ends_on)
  values (alpha, 'TA 2026/2027', '2026-07-13', '2027-06-26') returning id into alpha_p1;
  insert into public.academic_periods (institution_id, name, starts_on, ends_on)
  values (alpha, 'TA 2027/2028', '2027-07-12', '2028-06-24') returning id into alpha_p2;
  insert into public.academic_periods (institution_id, name, starts_on, ends_on)
  values (beta, 'TA 2027/2028', '2027-07-12', '2028-06-24') returning id into beta_p1;

  insert into public.org_nodes (institution_id, parent_id, kind, name) values (alpha, alpha, 'FACULTY', 'Sekolah Dasar') returning id into a_fac;
  insert into public.org_nodes (institution_id, parent_id, kind, name) values (alpha, a_fac, 'DEPARTMENT', 'Matematika') returning id into a_dept;
  insert into public.org_nodes (institution_id, parent_id, kind, name) values (alpha, a_dept, 'PROGRAMME', 'SD Reguler') returning id into a_prog;
  insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id) values (alpha, a_prog, 'COHORT', 'Kelas 5 — 2026/27', alpha_p1) returning id into a_coh5;
  insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id) values (alpha, a_coh5, 'CLASS', '5A', alpha_p1) returning id into a_cls5a;
  insert into public.classes (node_id, subject, status) values (a_cls5a, 'Matematika', 'ACTIVE');
  insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id) values (alpha, a_prog, 'COHORT', 'Kelas 6 — 2027/28', alpha_p2) returning id into a_coh6;
  insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id) values (alpha, a_coh6, 'CLASS', '6B', alpha_p2) returning id into a_cls6b;
  insert into public.classes (node_id, subject, status) values (a_cls6b, 'Matematika', 'SCHEDULED');

  insert into public.org_nodes (institution_id, parent_id, kind, name) values (beta, beta, 'FACULTY', 'Sekolah Dasar') returning id into b_fac;
  insert into public.org_nodes (institution_id, parent_id, kind, name) values (beta, b_fac, 'DEPARTMENT', 'Matematika') returning id into b_dept;
  insert into public.org_nodes (institution_id, parent_id, kind, name) values (beta, b_dept, 'PROGRAMME', 'SD Reguler') returning id into b_prog;
  insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id) values (beta, b_prog, 'COHORT', 'Kelas 6 — 2027/28', beta_p1) returning id into b_coh;
  insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id) values (beta, b_coh, 'CLASS', '6B', beta_p1) returning id into b_cls;
  insert into public.classes (node_id, subject, status) values (b_cls, 'Matematika', 'ACTIVE');

  -- ------------------------------------------------------------ auth users
  pw_as2 := encode(extensions.digest(pepper || '|' || card2 || '|' || pin2, 'sha256'), 'hex');

  insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
                          raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
                          confirmation_token, recovery_token, email_change_token_new, email_change)
  values
   (u_sys,    '00000000-0000-0000-0000-000000000000','authenticated','authenticated','sysadmin@synthetic.pintar.test',      extensions.crypt(pw_sys,    extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Admin Platform (sintetis)"}', now(), now(), '', '', '', ''),
   (u_aadmin, '00000000-0000-0000-0000-000000000000','authenticated','authenticated','alpha-admin@synthetic.pintar.test',   extensions.crypt(pw_aadmin, extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Admin Alpha (sintetis)"}', now(), now(), '', '', '', ''),
   (u_adean,  '00000000-0000-0000-0000-000000000000','authenticated','authenticated','alpha-dean@synthetic.pintar.test',    extensions.crypt(pw_adean,  extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Dekan Alpha (sintetis)"}', now(), now(), '', '', '', ''),
   (u_ahod,   '00000000-0000-0000-0000-000000000000','authenticated','authenticated','alpha-hod@synthetic.pintar.test',     extensions.crypt(pw_ahod,   extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Kaprodi Alpha (sintetis)"}', now(), now(), '', '', '', ''),
   (u_aguru,  '00000000-0000-0000-0000-000000000000','authenticated','authenticated','alpha-guru@synthetic.pintar.test',    extensions.crypt(pw_aguru,  extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Guru Alpha (sintetis)"}', now(), now(), '', '', '', ''),
   (u_as1,    '00000000-0000-0000-0000-000000000000','authenticated','authenticated','alpha-siswa-1@synthetic.pintar.test', extensions.crypt(pw_as1,    extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Siswa Alpha Satu (sintetis)"}', now(), now(), '', '', '', ''),
   (u_as2,    '00000000-0000-0000-0000-000000000000','authenticated','authenticated','card-7001@cards.synthetic.pintar.test', extensions.crypt(pw_as2, extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"],"account_kind":"CLASSROOM_CARD","card_number":"7001"}', '{"display_name":"Siswa Alpha Dua (sintetis)"}', now(), now(), '', '', '', ''),
   (u_badmin, '00000000-0000-0000-0000-000000000000','authenticated','authenticated','beta-admin@synthetic.pintar.test',    extensions.crypt(pw_badmin, extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Admin Beta (sintetis)"}', now(), now(), '', '', '', ''),
   (u_bs1,    '00000000-0000-0000-0000-000000000000','authenticated','authenticated','beta-siswa-1@synthetic.pintar.test',  extensions.crypt(pw_bs1,    extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Siswa Beta Satu (sintetis)"}', now(), now(), '', '', '', '');

  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  select gen_random_uuid(), u.id, u.id::text, jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true), 'email', now(), now(), now()
    from auth.users u where u.id in (u_sys,u_aadmin,u_adean,u_ahod,u_aguru,u_as1,u_as2,u_badmin,u_bs1);

  -- persons were created by the on_auth_user_created trigger
  select person_id into p_sys    from public.accounts where auth_user_id = u_sys;
  select person_id into p_aadmin from public.accounts where auth_user_id = u_aadmin;
  select person_id into p_adean  from public.accounts where auth_user_id = u_adean;
  select person_id into p_ahod   from public.accounts where auth_user_id = u_ahod;
  select person_id into p_aguru  from public.accounts where auth_user_id = u_aguru;
  select person_id into p_as1    from public.accounts where auth_user_id = u_as1;
  select person_id into p_as2    from public.accounts where auth_user_id = u_as2;
  select person_id into p_badmin from public.accounts where auth_user_id = u_badmin;
  select person_id into p_bs1    from public.accounts where auth_user_id = u_bs1;

  -- -------------------------------------------------------- role grants
  -- (no auth context here; permitted only because seed_intent=synthetic and env≠production)
  insert into public.role_assignments (person_id, role, scope_node_id, valid_until) values
    (p_sys,    'SYSTEM_ADMIN',       null,    now() + interval '10 years'),
    (p_aadmin, 'INSTITUTION_ADMIN',  alpha,   now() + interval '10 years'),
    (p_adean,  'DEAN',               alpha,   now() + interval '10 years'),
    (p_ahod,   'HEAD_OF_DEPARTMENT', a_dept,  now() + interval '10 years'),
    (p_aguru,  'EDUCATOR',           a_cls5a, now() + interval '10 years'),
    (p_badmin, 'INSTITUTION_ADMIN',  beta,    now() + interval '10 years');

  -- -------------------------------------------------- learners: enroll + place
  insert into public.enrollments (person_id, institution_id, academic_period_id, programme_id, status)
  values (p_as1, alpha, alpha_p1, a_prog, 'ACTIVE') returning id into e_as1;
  insert into public.enrollments (person_id, institution_id, academic_period_id, programme_id, status)
  values (p_as2, alpha, alpha_p1, a_prog, 'ACTIVE') returning id into e_as2;
  insert into public.enrollments (person_id, institution_id, academic_period_id, programme_id, status)
  values (p_bs1, beta, beta_p1, b_prog, 'ACTIVE') returning id into e_bs1;
  insert into public.memberships (enrollment_id, node_id, academic_period_id) values
    (e_as1, a_coh5, alpha_p1), (e_as1, a_cls5a, alpha_p1),
    (e_as2, a_coh5, alpha_p1), (e_as2, a_cls5a, alpha_p1),
    (e_bs1, b_coh, beta_p1),   (e_bs1, b_cls, beta_p1);

  -- harness handles the selftest reads back by slug prefix; nothing else to export
  raise notice 'synthetic seed complete: alpha=% beta=%', alpha, beta;
end $$;
