-- FABLE-03 learning-cycle content fixture — its own SYNTHETIC tenant.
--
-- §"Depends on": this phase is built end to end against one seeded course in a
-- synthetic tenant, whose evidence is SYNTHETIC. Real content waits on OD-3, so
-- nothing here cites a real book: the Source is named as a fixture, carries no
-- ISBN, and says so in its note. A page citation pointing at a real edition
-- nobody confirmed would be the invented citation doc 11 forbids.
--
-- WHY A THIRD INSTITUTION RATHER THAN ALPHA. FABLE-01's suite exercises period
-- rollover and transfer, and both are institution-wide by design: the rollover
-- closes every 2026/27 membership in the tenant it runs against, and the
-- transfer can end an enrolment outright. That is those features working. But
-- a learning assignment scoped to a class in that tenant then reaches nobody,
-- and every FABLE-03 test fails on NO_ACTIVE_MEMBERSHIP for a reason that has
-- nothing to do with the learning cycle.
--
-- Three attempts to repair the shared personas from inside the suite each
-- surfaced a different consequence of the same root cause — first the closed
-- membership, then a second enrolment in the other tenant, then the rollover
-- reaching the replacement learners too. So the cause is fixed instead: this
-- phase seeds its own institution, its own period, its own class, its own
-- staff and its own two learners, which no other suite touches (doc 12, "each
-- test seeds and tears down its own tenant/data"). One learner arrives by
-- email and one by classroom card, because §8 requires both to share the same
-- Person and the same downstream session model.
--
-- Runs after supabase/seed/synthetic.sql and under the same INV-21 guards:
-- refuses on a production environment and requires declared synthetic intent.

select set_config('app.seed_intent', 'synthetic', true);

do $$
declare
  v_env text;
  inst uuid; period uuid; cls uuid; coh uuid; fac uuid; dept uuid; prog uuid;
  p_hod uuid; p_admin uuid; p_guru uuid;
  u_guru uuid := gen_random_uuid(); u_hod uuid := gen_random_uuid(); u_admin uuid := gen_random_uuid();
  src uuid; srcv uuid; course uuid; modul uuid; l1 uuid; l2 uuid; tag text;
  o11 uuid; o12 uuid; o21 uuid; o22 uuid;
  rel uuid; def_pre uuid; def_post uuid; la uuid;
  it uuid; grp uuid; i int;
  v_ready text; v_blockers text[];
begin
  select environment into v_env from public.platform_environment;
  if v_env = 'production' then raise exception 'seed refused: environment is production (INV-21)'; end if;
  if current_setting('app.seed_intent', true) is distinct from 'synthetic' then
    raise exception 'seed refused: app.seed_intent must be ''synthetic'' (INV-21)';
  end if;

  insert into public.institutions (name, slug, is_synthetic)
  values ('Sekolah Sintetis Siklus', 'synth-siklus-' || to_char(clock_timestamp(),'YYYYMMDDHH24MISSMS'), true)
  returning id into inst;

  insert into public.academic_periods (institution_id, name, starts_on, ends_on)
  values (inst, 'TA 2026/2027', '2026-07-13', '2027-06-26') returning id into period;
  insert into public.org_nodes (institution_id, parent_id, kind, name)
  values (inst, inst, 'FACULTY', 'Sekolah Dasar') returning id into fac;
  insert into public.org_nodes (institution_id, parent_id, kind, name)
  values (inst, fac, 'DEPARTMENT', 'Matematika') returning id into dept;
  insert into public.org_nodes (institution_id, parent_id, kind, name)
  values (inst, dept, 'PROGRAMME', 'SD Reguler') returning id into prog;
  insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
  values (inst, prog, 'COHORT', 'Kelas 5 Siklus', period) returning id into coh;
  insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
  values (inst, coh, 'CLASS', '5S', period) returning id into cls;
  insert into public.classes (node_id, subject, status) values (cls, 'Matematika', 'ACTIVE');

  -- staff of this tenant: an author, a reviewer who may freeze, and an admin
  -- who may publish. The fixture walks the real lifecycle, so it needs real
  -- capability holders rather than an exemption.
  insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
                          raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
                          confirmation_token, recovery_token, email_change_token_new, email_change)
  values
   (u_guru,  '00000000-0000-0000-0000-000000000000','authenticated','authenticated',
    'siklus-guru@synthetic.pintar.test',  extensions.crypt('Sintetis-SiklusGuru-11!',  extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{"display_name":"Guru Siklus (sintetis)"}', now(), now(), '', '', '', ''),
   (u_hod,   '00000000-0000-0000-0000-000000000000','authenticated','authenticated',
    'siklus-kaprodi@synthetic.pintar.test', extensions.crypt('Sintetis-SiklusKaprodi-22!', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{"display_name":"Kaprodi Siklus (sintetis)"}', now(), now(), '', '', '', ''),
   (u_admin, '00000000-0000-0000-0000-000000000000','authenticated','authenticated',
    'siklus-admin@synthetic.pintar.test', extensions.crypt('Sintetis-SiklusAdmin-33!', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{"display_name":"Admin Siklus (sintetis)"}', now(), now(), '', '', '', '');
  insert into auth.identities (id, user_id, provider_id, identity_data, provider,
                               last_sign_in_at, created_at, updated_at)
  select gen_random_uuid(), u.id, u.id::text,
         jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
         'email', now(), now(), now()
    from auth.users u where u.id in (u_guru, u_hod, u_admin);

  select person_id into p_guru  from public.accounts where auth_user_id = u_guru;
  select person_id into p_hod   from public.accounts where auth_user_id = u_hod;
  select person_id into p_admin from public.accounts where auth_user_id = u_admin;
  insert into public.role_assignments (person_id, role, scope_node_id, valid_until) values
    (p_guru,  'EDUCATOR',           cls,  now() + interval '10 years'),
    (p_hod,   'HEAD_OF_DEPARTMENT', dept, now() + interval '10 years'),
    (p_admin, 'INSTITUTION_ADMIN',  inst, now() + interval '10 years');

  -- Misconception codes are a global primary key and append-only, so a fixture
  -- that reran would either collide or point one tenant's options at another
  -- tenant's taxonomy. The institution's own slug tail makes them unique per
  -- run without making them unpredictable: every test resolves a code through
  -- the option that references it.
  tag := right((select slug from public.institutions where id = inst), 14);


  -- ---------------------------------------------------------------- source
  insert into public.sources (institution_id, title, publisher, isbn, note)
  values (inst, 'Bahan Ajar Sintetis PINTAR — Pecahan', 'PINTAR (sintetis)', null,
          'Konten fixture untuk pengujian. Bukan terbitan nyata; sumber sebenarnya menunggu OD-3.')
  returning id into src;
  insert into public.source_versions (source_id, institution_id, version_label)
  values (src, inst, 'fixture-1') returning id into srcv;

  -- --------------------------------------------------------------- course
  insert into public.courses (institution_id, subject, stage, grade_label, title, author_person_id)
  values (inst, 'Matematika', 'SD', 'Kelas 5', 'Pecahan', p_guru) returning id into course;
  insert into public.modules (course_id, institution_id, ordinal, title, author_person_id)
  values (course, inst, 1, 'Mengenal Pecahan', p_guru) returning id into modul;

  insert into public.lessons (module_id, institution_id, ordinal, title, summary, body_markdown,
                              worked_examples, media, source_version_id, page_citation, author_person_id)
  values (modul, inst, 1,
          'Pecahan Senilai',
          'Dua pecahan bisa terlihat berbeda tetapi bernilai sama.',
          E'## Apa itu pecahan senilai\n\nPecahan senilai adalah dua pecahan yang menunjukkan bagian yang sama besar, walaupun angkanya berbeda.\n\n[[visual:pecahan|1/2]]\n\n## Mengalikan pembilang dan penyebut\n\nKalau pembilang dan penyebut dikalikan dengan angka yang sama, nilainya tidak berubah.\n\n[[visual:pecahan|2/4]]\n\n## Menyederhanakan\n\nMembagi pembilang dan penyebut dengan angka yang sama juga tidak mengubah nilainya.',
          '[{"judul":"Menyamakan 1/2 dan 2/4","langkah":["Mulai dari 1/2.","Kalikan pembilang dan penyebut dengan 2.","Hasilnya 2/4, bagian yang ditutup sama besar."]}]'::jsonb,
          '[{"jenis":"audio","path":"pelajaran/pecahan-senilai.mp3","transcript":"Pecahan senilai menunjukkan bagian yang sama besar walaupun angkanya berbeda."},
            {"jenis":"pdf","path":"pelajaran/pecahan-senilai-ringkasan.pdf"}]'::jsonb,
          srcv, 'Bagian 1 · halaman 3–8', p_guru)
  returning id into l1;

  insert into public.lessons (module_id, institution_id, ordinal, title, summary, body_markdown,
                              worked_examples, media, source_version_id, page_citation, author_person_id)
  values (modul, inst, 2,
          'Menjumlahkan Pecahan',
          'Menjumlahkan pecahan dimulai dengan menyamakan penyebutnya.',
          E'## Penyebut yang sama\n\nKalau penyebutnya sudah sama, pembilangnya tinggal dijumlahkan.\n\n[[visual:pecahan|3/8]]\n\n## Penyebut yang berbeda\n\nSamakan dulu penyebutnya, baru jumlahkan pembilangnya.\n\n[[visual:pecahan|5/8]]',
          '[{"judul":"1/4 + 1/2","langkah":["Samakan penyebut menjadi 4.","1/2 menjadi 2/4.","1/4 + 2/4 = 3/4."]}]'::jsonb,
          '[{"jenis":"video","path":"pelajaran/menjumlahkan-pecahan.mp4","transcript":"Untuk menjumlahkan pecahan, samakan dulu penyebutnya, lalu jumlahkan pembilangnya."}]'::jsonb,
          srcv, 'Bagian 2 · halaman 9–15', p_guru)
  returning id into l2;

  insert into public.learning_objectives (lesson_id, institution_id, code, statement, bloom, is_core) values
    (l1, inst, 'MTK5-1.1', 'Menjelaskan arti pecahan senilai.', 'UNDERSTAND', true),
    (l1, inst, 'MTK5-1.2', 'Menentukan pecahan yang senilai dengan pecahan tertentu.', 'APPLY', true),
    (l2, inst, 'MTK5-2.1', 'Menyamakan penyebut dua pecahan.', 'APPLY', true),
    (l2, inst, 'MTK5-2.2', 'Menjumlahkan dua pecahan berpenyebut berbeda.', 'APPLY', true);
  select id into o11 from public.learning_objectives where lesson_id=l1 and code='MTK5-1.1';
  select id into o12 from public.learning_objectives where lesson_id=l1 and code='MTK5-1.2';
  select id into o21 from public.learning_objectives where lesson_id=l2 and code='MTK5-2.1';
  select id into o22 from public.learning_objectives where lesson_id=l2 and code='MTK5-2.2';

  insert into public.misconception_taxonomy (code, institution_id, label, description, remediation) values
    ('MK-PEC-01-' || tag, inst, 'Menjumlahkan penyebut',
     'Peserta didik menjumlahkan pembilang dan penyebut sekaligus.',
     'Kembali ke gambar pecahan: perhatikan bahwa penyebut menyatakan banyaknya bagian, bukan jumlah yang ditambahkan.'),
    ('MK-PEC-02-' || tag, inst, 'Menganggap angka besar berarti pecahan besar',
     'Peserta didik membandingkan pecahan hanya dari besarnya angka.',
     'Bandingkan dua gambar pecahan berdampingan sebelum melihat angkanya.'),
    ('MK-PEC-03-' || tag, inst, 'Menyederhanakan hanya pembilang',
     'Peserta didik membagi pembilang saja tanpa membagi penyebut.',
     'Latih kembali aturan bahwa pembilang dan penyebut selalu diperlakukan bersama.'),
    ('MK-PEC-04-' || tag, inst, 'Lupa menyamakan penyebut',
     'Peserta didik langsung menjumlahkan pembilang tanpa menyamakan penyebut.',
     'Ulangi langkah pertama pada contoh: samakan penyebut sebelum menjumlahkan.');
  raise notice 'fixture: course % lessons % %', course, l1, l2;
end $$;

-- ---------------------------------------------------------------------------
-- Items. Sixteen, all TEST tier, so a five-item pre-test and a five-item
-- post-test can both be drawn with INV-24's exclusion of every pre-test item
-- AND every parallel sibling of one still leaving a full paper behind.
--
-- Three pairs share a parallel_group: those are the siblings the post-test
-- draw has to refuse, and without them the INV-24 test would only ever prove
-- the easy half of the rule.
--
-- Correct answers are spread across labels and option lengths are kept close,
-- because run_mcq_quality() looks for exactly those patterns and a fixture
-- that trips its own quality gate is not a fixture.
-- ---------------------------------------------------------------------------
do $$
declare
  inst uuid; course uuid; l1 uuid; l2 uuid; modul uuid;
  o11 uuid; o12 uuid; o21 uuid; o22 uuid;
  spec jsonb; entry jsonb; opt jsonb; it uuid; grp uuid; tag text; p_guru uuid;
  -- §6's three-level assistance reads arah_berpikir and petunjuk. Written per
  -- objective rather than per item: the direction of thinking for "menyamakan
  -- penyebut" is the same whichever instance is on the paper. None names an
  -- option or narrows to one, so hint_reveals_answer_shape() passes them at
  -- write time and again at serve time.
  hints jsonb := jsonb_build_object(
    '11.arah',     'Bayangkan gambarnya: bagian yang sama besar bisa ditulis dengan angka yang berbeda.',
    '11.petunjuk', 'Kalikan pembilang dan penyebut dengan angka yang sama, lalu bandingkan gambarnya.',
    '12.arah',     'Cari satu angka yang bisa membagi pembilang dan penyebut sekaligus.',
    '12.petunjuk', 'Mulai dari pembagi terkecil, lalu periksa apakah keduanya masih bisa dibagi lagi.',
    '21.arah',     'Perhatikan penyebutnya lebih dulu, jangan pembilangnya.',
    '21.petunjuk', 'Cari satu angka yang habis dibagi oleh kedua penyebut itu.',
    '22.arah',     'Ubah dulu menjadi pecahan berpenyebut sama, baru kerjakan pembilangnya.',
    '22.petunjuk', 'Setelah penyebutnya sama, jumlahkan pembilangnya saja dan biarkan penyebutnya.');
  groups jsonb := '{}'::jsonb;
begin
  if current_setting('app.seed_intent', true) is distinct from 'synthetic' then
    raise exception 'seed refused: app.seed_intent must be ''synthetic'' (INV-21)';
  end if;
  select id into inst from public.institutions where slug like 'synth-siklus-%' order by created_at desc limit 1;
  tag := right((select slug from public.institutions where id = inst), 14);
  select a.person_id into p_guru from public.accounts a join auth.users u on u.id=a.auth_user_id
   where u.email='siklus-guru@synthetic.pintar.test';
  select id into course from public.courses where institution_id = inst and title = 'Pecahan' order by created_at desc limit 1;
  select id into modul from public.modules where course_id = course and ordinal = 1;
  select id into l1 from public.lessons where module_id = modul and ordinal = 1;
  select id into l2 from public.lessons where module_id = modul and ordinal = 2;
  select id into o11 from public.learning_objectives where lesson_id=l1 and code='MTK5-1.1';
  select id into o12 from public.learning_objectives where lesson_id=l1 and code='MTK5-1.2';
  select id into o21 from public.learning_objectives where lesson_id=l2 and code='MTK5-2.1';
  select id into o22 from public.learning_objectives where lesson_id=l2 and code='MTK5-2.2';

  spec := jsonb_build_array(
    jsonb_build_object('l','1','obj','11','tipe','MCQ_SINGLE','aman',false,'d',0.80,'grup','A',
      'stem','Manakah yang bernilai sama dengan 1/2?',
      'op', jsonb_build_array(
        jsonb_build_array('A','2/4',true, 'Mengalikan pembilang dan penyebut dengan 2 tidak mengubah nilainya.', null),
        jsonb_build_array('B','1/4',false,'Seperempat lebih kecil dari setengah; bandingkan gambarnya.','MK-PEC-02'),
        jsonb_build_array('C','2/3',false,'Dua per tiga lebih besar dari setengah.','MK-PEC-02'),
        jsonb_build_array('D','3/4',false,'Tiga per empat lebih besar dari setengah.','MK-PEC-02'))),
    jsonb_build_object('l','1','obj','11','tipe','MCQ_SINGLE','aman',false,'d',0.78,'grup','A',
      'stem','Manakah yang bernilai sama dengan 1/3?',
      'op', jsonb_build_array(
        jsonb_build_array('A','1/6',false,'Seperenam lebih kecil dari sepertiga.','MK-PEC-02'),
        jsonb_build_array('B','2/6',true, 'Mengalikan pembilang dan penyebut dengan 2 tidak mengubah nilainya.', null),
        jsonb_build_array('C','3/6',false,'Tiga per enam sama dengan setengah, bukan sepertiga.','MK-PEC-02'),
        jsonb_build_array('D','2/3',false,'Dua per tiga dua kali lipat dari sepertiga.','MK-PEC-02'))),
    jsonb_build_object('l','1','obj','12','tipe','MCQ_SINGLE','aman',false,'d',0.55,'grup','B',
      'stem','Bentuk paling sederhana dari 4/8 adalah?',
      'op', jsonb_build_array(
        jsonb_build_array('A','2/8',false,'Pembilang dibagi dua tetapi penyebut tidak ikut dibagi.','MK-PEC-03'),
        jsonb_build_array('B','4/4',false,'Penyebut dibagi dua tetapi pembilang tidak ikut dibagi.','MK-PEC-03'),
        jsonb_build_array('C','1/2',true, 'Pembilang dan penyebut sama-sama dibagi empat.', null),
        jsonb_build_array('D','8/4',false,'Pembilang dan penyebut tertukar tempatnya.','MK-PEC-02'))),
    jsonb_build_object('l','1','obj','12','tipe','MCQ_SINGLE','aman',false,'d',0.52,'grup','B',
      'stem','Bentuk paling sederhana dari 6/9 adalah?',
      'op', jsonb_build_array(
        jsonb_build_array('A','3/9',false,'Pembilang dibagi dua tetapi penyebut tidak ikut dibagi.','MK-PEC-03'),
        jsonb_build_array('B','6/3',false,'Pembilang dan penyebut tertukar tempatnya.','MK-PEC-02'),
        jsonb_build_array('C','2/6',false,'Pembilang dibagi tiga tetapi penyebut dibagi lain.','MK-PEC-03'),
        jsonb_build_array('D','2/3',true, 'Pembilang dan penyebut sama-sama dibagi tiga.', null))),
    jsonb_build_object('l','2','obj','21','tipe','MCQ_SINGLE','aman',true,'d',0.45,'grup','C',
      'stem','Sebelum menjumlahkan 1/4 dan 1/2, langkah pertamanya adalah?',
      'op', jsonb_build_array(
        jsonb_build_array('A','Menyamakan penyebut kedua pecahan itu',true,'Penjumlahan baru sah setelah penyebutnya sama.', null),
        jsonb_build_array('B','Menjumlahkan penyebut kedua pecahan itu',false,'Penyebut tidak pernah dijumlahkan.','MK-PEC-01'),
        jsonb_build_array('C','Menjumlahkan pembilang kedua pecahan itu',false,'Pembilang dijumlahkan setelah penyebut sama.','MK-PEC-04'),
        jsonb_build_array('D','Mengurutkan kedua pecahan dari terkecil',false,'Urutan tidak memengaruhi hasil penjumlahan.','MK-PEC-02'))),
    jsonb_build_object('l','2','obj','21','tipe','MCQ_SINGLE','aman',true,'d',0.43,'grup','C',
      'stem','Sebelum menjumlahkan 1/3 dan 1/6, langkah pertamanya adalah?',
      'op', jsonb_build_array(
        jsonb_build_array('A','Mengurutkan kedua pecahan dari terbesar',false,'Urutan tidak memengaruhi hasil penjumlahan.','MK-PEC-02'),
        jsonb_build_array('B','Menyamakan penyebut kedua pecahan itu',true,'Penjumlahan baru sah setelah penyebutnya sama.', null),
        jsonb_build_array('C','Menjumlahkan penyebut kedua pecahan itu',false,'Penyebut tidak pernah dijumlahkan.','MK-PEC-01'),
        jsonb_build_array('D','Menjumlahkan pembilang kedua pecahan itu',false,'Pembilang dijumlahkan setelah penyebut sama.','MK-PEC-04'))),
    jsonb_build_object('l','2','obj','22','tipe','MCQ_SINGLE','aman',true,'d',0.35,'grup',null,
      'stem','Berapakah hasil dari 1/4 + 1/2?',
      'op', jsonb_build_array(
        jsonb_build_array('A','2/6',false,'Pembilang dan penyebut sama-sama dijumlahkan.','MK-PEC-01'),
        jsonb_build_array('B','3/4',true, 'Satu per dua menjadi dua per empat, lalu ditambah satu per empat.', null),
        jsonb_build_array('C','1/6',false,'Penyebut dijumlahkan dan pembilang diabaikan.','MK-PEC-01'),
        jsonb_build_array('D','2/4',false,'Pembilang langsung dijumlahkan tanpa menyamakan penyebut.','MK-PEC-04'))),
    jsonb_build_object('l','2','obj','22','tipe','MCQ_SINGLE','aman',false,'d',0.38,'grup',null,
      'stem','Berapakah hasil dari 1/3 + 1/6?',
      'op', jsonb_build_array(
        jsonb_build_array('A','2/9',false,'Pembilang dan penyebut sama-sama dijumlahkan.','MK-PEC-01'),
        jsonb_build_array('B','1/9',false,'Penyebut dijumlahkan dan pembilang diabaikan.','MK-PEC-01'),
        jsonb_build_array('C','2/6',false,'Pembilang langsung dijumlahkan tanpa menyamakan penyebut.','MK-PEC-04'),
        jsonb_build_array('D','1/2',true, 'Sepertiga menjadi dua per enam, lalu ditambah satu per enam.', null))),
    jsonb_build_object('l','1','obj','11','tipe','MCQ_MULTI','aman',false,'d',0.40,'grup',null,
      'stem','Pilih semua yang bernilai sama dengan 1/2.',
      'op', jsonb_build_array(
        jsonb_build_array('A','2/4',true, 'Pembilang dan penyebut dikalikan dua.', null),
        jsonb_build_array('B','3/6',true, 'Pembilang dan penyebut dikalikan tiga.', null),
        jsonb_build_array('C','2/3',false,'Dua per tiga lebih besar dari setengah.','MK-PEC-02'),
        jsonb_build_array('D','1/4',false,'Seperempat lebih kecil dari setengah.','MK-PEC-02'))),
    jsonb_build_object('l','1','obj','12','tipe','MCQ_MULTI','aman',false,'d',0.42,'grup',null,
      'stem','Pilih semua yang bernilai sama dengan 2/3.',
      'op', jsonb_build_array(
        jsonb_build_array('A','3/4',false,'Tiga per empat lebih besar dari dua per tiga.','MK-PEC-02'),
        jsonb_build_array('B','4/6',true, 'Pembilang dan penyebut dikalikan dua.', null),
        jsonb_build_array('C','6/9',true, 'Pembilang dan penyebut dikalikan tiga.', null),
        jsonb_build_array('D','2/6',false,'Dua per enam sama dengan sepertiga.','MK-PEC-02'))),
    jsonb_build_object('l','1','obj','11','tipe','MCQ_SINGLE','aman',false,'d',0.72,'grup',null,
      'stem','Gambar yang dibagi empat dan dua bagiannya diwarnai menyatakan pecahan?',
      'op', jsonb_build_array(
        jsonb_build_array('A','4/2',false,'Pembilang dan penyebut tertukar tempatnya.','MK-PEC-02'),
        jsonb_build_array('B','2/4',true, 'Dua bagian diwarnai dari empat bagian yang sama.', null),
        jsonb_build_array('C','2/2',false,'Dua per dua berarti seluruh gambar diwarnai.','MK-PEC-02'),
        jsonb_build_array('D','4/4',false,'Empat per empat berarti seluruh gambar diwarnai.','MK-PEC-02'))),
    jsonb_build_object('l','1','obj','12','tipe','MCQ_SINGLE','aman',false,'d',0.65,'grup',null,
      'stem','Manakah pecahan yang paling besar?',
      'op', jsonb_build_array(
        jsonb_build_array('A','2/3',false,'Disamakan menjadi 16/24, lebih kecil dari 18/24.','MK-PEC-02'),
        jsonb_build_array('B','3/4',true, 'Disamakan menjadi 18/24, yang terbesar di antara keempatnya.', null),
        jsonb_build_array('C','5/8',false,'Disamakan menjadi 15/24, lebih kecil dari 18/24.','MK-PEC-02'),
        jsonb_build_array('D','7/12',false,'Disamakan menjadi 14/24, yang terkecil di antara keempatnya.','MK-PEC-02'))),
    jsonb_build_object('l','2','obj','21','tipe','MCQ_SINGLE','aman',false,'d',0.60,'grup',null,
      'stem','Penyebut yang sama untuk 1/2 dan 1/5 adalah?',
      'op', jsonb_build_array(
        jsonb_build_array('A','7',false,'Penyebut dijumlahkan, bukan disamakan.','MK-PEC-01'),
        jsonb_build_array('B','5',false,'Lima tidak habis dibagi dua.','MK-PEC-04'),
        jsonb_build_array('C','10',true,'Sepuluh habis dibagi dua dan lima.', null),
        jsonb_build_array('D','2',false,'Dua tidak habis dibagi lima.','MK-PEC-04'))),
    jsonb_build_object('l','2','obj','22','tipe','MCQ_SINGLE','aman',false,'d',0.30,'grup',null,
      'stem','Berapakah hasil dari 2/5 + 1/10?',
      'op', jsonb_build_array(
        jsonb_build_array('A','3/15',false,'Pembilang dan penyebut sama-sama dijumlahkan.','MK-PEC-01'),
        jsonb_build_array('B','3/10',false,'Dua per lima belum diubah menjadi empat per sepuluh.','MK-PEC-04'),
        jsonb_build_array('C','1/2',true, 'Dua per lima menjadi empat per sepuluh, lalu ditambah satu per sepuluh.', null),
        jsonb_build_array('D','2/10',false,'Pembilang langsung dijumlahkan tanpa menyamakan penyebut.','MK-PEC-04'))),
    jsonb_build_object('l','2','obj','22','tipe','MCQ_MULTI','aman',false,'d',0.33,'grup',null,
      'stem','Pilih semua penjumlahan yang hasilnya 1.',
      'op', jsonb_build_array(
        jsonb_build_array('A','1/2 + 1/2',true, 'Dua setengah bagian menutup satu utuh.', null),
        jsonb_build_array('B','1/4 + 3/4',true, 'Satu dan tiga perempat menutup satu utuh.', null),
        jsonb_build_array('C','1/3 + 1/3',false,'Baru dua per tiga, belum satu utuh.','MK-PEC-04'),
        jsonb_build_array('D','1/2 + 1/4',false,'Baru tiga per empat, belum satu utuh.','MK-PEC-04'))),
    jsonb_build_object('l','1','obj','11','tipe','MCQ_SINGLE','aman',true,'d',0.50,'grup',null,
      'stem','Pada pecahan 3/5, angka 5 disebut apa?',
      'op', jsonb_build_array(
        jsonb_build_array('A','Pembilang',false,'Pembilang adalah angka di atas garis.','MK-PEC-02'),
        jsonb_build_array('B','Penyebut',true, 'Penyebut adalah angka di bawah garis, menyatakan banyaknya bagian.', null),
        jsonb_build_array('C','Hasil bagi',false,'Hasil bagi adalah nilai pecahan itu sendiri.','MK-PEC-02'),
        jsonb_build_array('D','Sisa bagi',false,'Sisa bagi muncul pada pembagian, bukan penamaan pecahan.','MK-PEC-02'))),
    jsonb_build_object('l','1','obj','11','tipe','MCQ_SINGLE','aman',true,'d',0.46,'grup',null,
      'stem','Pada pecahan 3/5, angka 3 disebut apa?',
      'op', jsonb_build_array(
        jsonb_build_array('A','Penyebut',false,'Penyebut adalah angka di bawah garis.','MK-PEC-02'),
        jsonb_build_array('B','Sisa bagi',false,'Sisa bagi muncul pada pembagian, bukan penamaan pecahan.','MK-PEC-02'),
        jsonb_build_array('C','Pembilang',true, 'Pembilang adalah angka di atas garis, menyatakan bagian yang diambil.', null),
        jsonb_build_array('D','Hasil bagi',false,'Hasil bagi adalah nilai pecahan itu sendiri.','MK-PEC-02'))),
    jsonb_build_object('l','2','obj','21','tipe','MCQ_SINGLE','aman',true,'d',0.38,'grup',null,
      'stem','Dua pecahan boleh dijumlahkan langsung bila penyebutnya?',
      'op', jsonb_build_array(
        jsonb_build_array('A','Berbeda satu angka',false,'Selisih satu tetap berbeda; samakan dulu.','MK-PEC-04'),
        jsonb_build_array('B','Salah satu lebih besar',false,'Besar kecilnya tidak menentukan; harus sama.','MK-PEC-04'),
        jsonb_build_array('C','Sudah sama besarnya',true, 'Penjumlahan pembilang sah hanya ketika penyebutnya sama.', null),
        jsonb_build_array('D','Keduanya bilangan ganjil',false,'Ganjil genap tidak menentukan; harus sama.','MK-PEC-04'))),
    jsonb_build_object('l','2','obj','22','tipe','MCQ_SINGLE','aman',true,'d',0.33,'grup',null,
      'stem','Berapakah hasil dari 3/8 + 1/8?',
      'op', jsonb_build_array(
        jsonb_build_array('A','4/16',false,'Penyebut ikut dijumlahkan padahal sudah sama.','MK-PEC-01'),
        jsonb_build_array('B','4/8',true, 'Penyebut sudah sama, jadi pembilangnya tinggal dijumlahkan.', null),
        jsonb_build_array('C','3/16',false,'Penyebut dijumlahkan dan pembilang diabaikan.','MK-PEC-01'),
        jsonb_build_array('D','1/2 lebih',false,'Hasilnya tepat setengah, tidak lebih.','MK-PEC-02'))),
    jsonb_build_object('l','1','obj','11','tipe','MCQ_SINGLE','aman',false,'d',0.68,'grup',null,
      'stem','Kalau pembilang dan penyebut dikalikan angka yang sama, nilainya?',
      'op', jsonb_build_array(
        jsonb_build_array('A','Tetap sama seperti semula',true,'Itulah yang membuat dua pecahan senilai.', null),
        jsonb_build_array('B','Selalu menjadi lebih besar',false,'Angkanya membesar, nilainya tidak.','MK-PEC-02'),
        jsonb_build_array('C','Selalu menjadi lebih kecil',false,'Angkanya membesar, nilainya tidak.','MK-PEC-02'),
        jsonb_build_array('D','Berubah tak menentu arahnya',false,'Perubahannya tidak acak; nilainya tetap.','MK-PEC-02')))
  );

  for entry in select * from jsonb_array_elements(spec) loop
    grp := null;
    if entry ->> 'grup' is not null then
      if not (groups ? (entry ->> 'grup')) then
        groups := groups || jsonb_build_object(entry ->> 'grup', gen_random_uuid()::text);
      end if;
      grp := (groups ->> (entry ->> 'grup'))::uuid;
    end if;
    insert into public.items (lesson_id, institution_id, item_type, bank_type, stem,
                              petunjuk, arah_berpikir,
                              objective_ids, is_safety_critical, parallel_group,
                              predicted_difficulty, source_version_id, page_citation,
                              author_person_id)
    values (case entry ->> 'l' when '1' then l1 else l2 end, inst,
            (entry ->> 'tipe')::public.item_type, 'TEST', entry ->> 'stem',
            hints ->> (entry ->> 'obj' || '.petunjuk'), hints ->> (entry ->> 'obj' || '.arah'),
            array[case entry ->> 'obj' when '11' then o11 when '12' then o12
                                       when '21' then o21 else o22 end],
            (entry ->> 'aman')::boolean, grp, (entry ->> 'd')::numeric,
            (select source_version_id from public.lessons where id = l1),
            (select page_citation from public.lessons
              where id = case entry ->> 'l' when '1' then l1 else l2 end),
            p_guru)
    returning id into it;

    for opt in select * from jsonb_array_elements(entry -> 'op') loop
      insert into public.item_options (item_id, institution_id, label, body, is_correct,
                                       rationale, misconception_code)
      values (it, inst, opt ->> 0, opt ->> 1, (opt ->> 2)::boolean, opt ->> 3, case when opt ->> 4 is null then null else (opt ->> 4) || '-' || tag end);
    end loop;
  end loop;

  raise notice 'fixture: % items, % parallel groups',
    (select count(*) from public.items where institution_id = inst),
    (select count(distinct parallel_group) from public.items where institution_id = inst and parallel_group is not null);
end $$;

-- ---------------------------------------------------------------------------
-- Lifecycle, release, and the two assignments.
--
-- The fixture walks the real path — INGESTED → STRUCTURED → VALIDATED →
-- IN_REVIEW → APPROVED, then the release FROZEN and PUBLISHED — adopting the
-- synthetic Head of Department's and Institution Admin's identities through
-- the same JWT claim PostgREST sets. Nothing here is granted an exemption: if
-- the reviewer were the author, or the freezer lacked CAN_FREEZE_RELEASE, or
-- publish readiness were not READY, this seed would fail exactly where a real
-- one would.
-- ---------------------------------------------------------------------------
do $$
declare
  inst uuid; course uuid; modul uuid; rel uuid; def_pre uuid; def_post uuid;
  la uuid; aa_pre uuid; aa_post uuid; period uuid; cls uuid;
  p_guru uuid; p_hod uuid; p_admin uuid; u_hod uuid; u_admin uuid;
  v_status text; v_blockers text[]; v_findings int; v_mcq int; t text;
begin
  if current_setting('app.seed_intent', true) is distinct from 'synthetic' then
    raise exception 'seed refused: app.seed_intent must be ''synthetic'' (INV-21)';
  end if;
  select id into inst from public.institutions where slug like 'synth-siklus-%' order by created_at desc limit 1;
  select id into course from public.courses where institution_id = inst and title = 'Pecahan' order by created_at desc limit 1;
  select id into modul from public.modules where course_id = course and ordinal = 1;
  select id into period from public.academic_periods where institution_id = inst order by starts_on limit 1;
  select id into cls from public.org_nodes where institution_id = inst and kind='CLASS' order by created_at limit 1;
  select a.person_id into p_guru from public.accounts a join auth.users u on u.id=a.auth_user_id
   where u.email='siklus-guru@synthetic.pintar.test';
  select a.person_id, u.id into p_hod, u_hod from public.accounts a join auth.users u on u.id=a.auth_user_id
   where u.email='siklus-kaprodi@synthetic.pintar.test';
  select a.person_id, u.id into p_admin, u_admin from public.accounts a join auth.users u on u.id=a.auth_user_id
   where u.email='siklus-admin@synthetic.pintar.test';

  -- ------------------------------------------------------ definitions
  insert into public.assessment_definitions (institution_id, module_id, title, mode, bank_type,
    item_count, difficulty_mix, safety_critical_minimum, passing_rules, hesitation_window_seconds,
    shuffle_policy, allows_pause, offline_tolerant, late_sync_grace_seconds, attempt_limit,
    author_person_id)
  values (inst, modul, 'Pemetaan Awal — Pecahan', 'PRE_TEST', 'TEST',
          5, '{"MUDAH":2,"SEDANG":2,"SULIT":1}'::jsonb, 1, '{}'::jsonb, 25,
          'ITEMS_AND_OPTIONS', false, true, 120, 1, p_guru)
  returning id into def_pre;

  insert into public.assessment_definitions (institution_id, module_id, title, mode, bank_type,
    item_count, difficulty_mix, safety_critical_minimum, passing_rules, hesitation_window_seconds,
    shuffle_policy, allows_pause, offline_tolerant, late_sync_grace_seconds, attempt_limit,
    author_person_id)
  values (inst, modul, 'Uji Penguasaan — Pecahan', 'POST_TEST', 'TEST',
          5, '{"SEDANG":2,"SULIT":2}'::jsonb, 1, '{"mastery_min":0.6}'::jsonb, 25,
          'ITEMS_AND_OPTIONS', true, true, 120, 2, p_guru)
  returning id into def_post;

  -- --------------------------------------------- content through review
  foreach t in array array['STRUCTURED','VALIDATED','IN_REVIEW'] loop
    update public.courses               set status = t::public.content_status where id = course;
    update public.modules               set status = t::public.content_status where course_id = course;
    update public.lessons               set status = t::public.content_status where module_id = modul;
    update public.items                 set status = t::public.content_status where lesson_id in
      (select id from public.lessons where module_id = modul);
    update public.assessment_definitions set status = t::public.content_status where module_id = modul;
  end loop;
  -- Approve AS the Head of Department. From 0057 an approval is a capability
  -- act performed by the reviewer of record, not a field two statements can
  -- fill in on their behalf, so the fixture names its reviewer by acting as one.
  perform set_config('request.jwt.claims',
    json_build_object('sub', u_hod, 'role','authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', u_hod::text, true);
  update public.courses                set status='APPROVED', reviewed_by_person_id=p_hod where id = course;
  update public.modules                set status='APPROVED', reviewed_by_person_id=p_hod where course_id = course;
  update public.lessons                set status='APPROVED', reviewed_by_person_id=p_hod where module_id = modul;
  update public.items                  set status='APPROVED', reviewed_by_person_id=p_hod where lesson_id in
    (select id from public.lessons where module_id = modul);
  update public.assessment_definitions set status='APPROVED', reviewed_by_person_id=p_hod where module_id = modul;
  perform set_config('request.jwt.claims', '', true);
  perform set_config('request.jwt.claim.sub', '', true);

  -- ------------------------------------------- validator and MCQ quality
  -- Run them for real. A fixture that skipped its own quality gate would tell
  -- the acceptance suite nothing about whether the gate works.
  v_findings := public.validate_course_content(course);
  v_mcq := public.run_mcq_quality(course);
  select status, blockers into v_status, v_blockers from public.publish_readiness(course);
  if v_status <> 'READY' then
    raise exception 'fixture content is not publishable (% findings, % mcq): % — fix the fixture, never the gate',
      v_findings, v_mcq, array_to_string(v_blockers, '; ');
  end if;

  -- ------------------------------------------------------------ release
  insert into public.plp_releases (institution_id, course_id, version_label, author_person_id)
  values (inst, course, '1.0.0', p_guru) returning id into rel;
  foreach t in array array['STRUCTURED','VALIDATED','IN_REVIEW'] loop
    update public.plp_releases set status = t::public.content_status where id = rel;
  end loop;
  -- approve and freeze as the Head of Department (CAN_REVIEW, CAN_FREEZE_RELEASE)
  perform set_config('request.jwt.claims',
    json_build_object('sub', u_hod, 'role','authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', u_hod::text, true);
  update public.plp_releases set status='APPROVED', reviewed_by_person_id=p_hod where id = rel;
  update public.plp_releases set status='FROZEN' where id = rel;

  -- publish as the Institution Admin (CAN_PUBLISH); HoD deliberately cannot
  perform set_config('request.jwt.claims',
    json_build_object('sub', u_admin, 'role','authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', u_admin::text, true);
  update public.plp_releases set status='PUBLISHED' where id = rel;

  -- -------------------------------------------------------- assignments
  insert into public.learning_assignments (institution_id, plp_release_id, course_id, node_id,
    academic_period_id, is_required, learning_cycle, assigned_by_person_id, assigned_at)
  values (inst, rel, course, cls, period, true,
          jsonb_build_object('pre_test', def_pre, 'post_test', def_post), p_admin, now())
  returning id into la;
  update public.learning_assignments set status='ACTIVE' where id = la;

  insert into public.assessment_assignments (institution_id, assessment_definition_id,
    learning_assignment_id, node_id, academic_period_id, opens_at, closes_at,
    assigned_by_person_id, assigned_at)
  values (inst, def_pre, la, cls, period, now() - interval '1 day', now() + interval '180 days', p_admin, now())
  returning id into aa_pre;
  insert into public.assessment_assignments (institution_id, assessment_definition_id,
    learning_assignment_id, node_id, academic_period_id, opens_at, closes_at,
    assigned_by_person_id, assigned_at)
  values (inst, def_post, la, cls, period, now() - interval '1 day', now() + interval '180 days', p_admin, now())
  returning id into aa_post;
  foreach t in array array['SCHEDULED','OPEN'] loop
    update public.assessment_assignments set status = t::public.assessment_assignment_status
     where id in (aa_pre, aa_post);
  end loop;

  perform set_config('request.jwt.claims', '', true);
  perform set_config('request.jwt.claim.sub', '', true);

  raise notice 'fixture: release % published, pre=% post=%, learning assignment %', rel, aa_pre, aa_post, la;
end $$;

-- ---------------------------------------------------------------------------
-- Learners of this phase's own.
--
-- The fixture deliberately does NOT reuse alpha-siswa-1 and the 7001 card.
-- FABLE-01's suite exercises period rollover and transfer against those two,
-- and correctly moves them: the rollover closes their 2026/27 membership in
-- 5A and opens a 2027/28 one in 6B, and the transfer can end their Alpha
-- enrolment altogether. Nothing is wrong with that — but a learning assignment
-- scoped to 5A then reaches nobody, and every FABLE-03 test would fail on
-- NO_ACTIVE_MEMBERSHIP for a reason that has nothing to do with FABLE-03.
--
-- Three attempts to repair the shared personas from inside the suite each
-- surfaced a different consequence of the same root cause, so the cause is
-- fixed instead: this phase provisions two learners of its own, in the
-- fixture's own class, which no other suite touches (doc 12, "each test seeds
-- its own data; no shared global fixture mutated across tests"). One arrives
-- by email and one by classroom card, because §8 requires both to share the
-- same Person and downstream session model.
-- ---------------------------------------------------------------------------
do $$
declare
  inst uuid; period uuid; cls uuid; coh uuid; prog uuid;
  u_mail uuid := gen_random_uuid(); u_card uuid := gen_random_uuid();
  p_mail uuid; p_card uuid; e_mail uuid; e_card uuid;
  pepper text := 'synthetic-card-pepper-fable01-32plus';   -- same constant the selftest env uses
  pw_mail text := 'Sintetis-SiklusEmail-84!';
  card text := '7002'; pin text := '1357'; pw_card text;
begin
  if current_setting('app.seed_intent', true) is distinct from 'synthetic' then
    raise exception 'seed refused: app.seed_intent must be ''synthetic'' (INV-21)';
  end if;
  select id into inst from public.institutions where slug like 'synth-siklus-%' order by created_at desc limit 1;
  select id into period from public.academic_periods where institution_id = inst order by starts_on limit 1;
  select id into cls  from public.org_nodes where institution_id = inst and kind='CLASS'  order by created_at limit 1;
  select id into coh  from public.org_nodes where institution_id = inst and kind='COHORT' order by created_at limit 1;
  select id into prog from public.org_nodes where institution_id = inst and kind='PROGRAMME' order by created_at limit 1;

  pw_card := encode(extensions.digest(pepper || '|' || card || '|' || pin, 'sha256'), 'hex');

  insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
                          raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
                          confirmation_token, recovery_token, email_change_token_new, email_change)
  values
   (u_mail, '00000000-0000-0000-0000-000000000000','authenticated','authenticated',
    'siklus-email@synthetic.pintar.test', extensions.crypt(pw_mail, extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{"display_name":"Siswa Siklus Email (sintetis)"}',
    now(), now(), '', '', '', ''),
   (u_card, '00000000-0000-0000-0000-000000000000','authenticated','authenticated',
    'card-7002@cards.synthetic.pintar.test', extensions.crypt(pw_card, extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"],"account_kind":"CLASSROOM_CARD","card_number":"7002"}',
    '{"display_name":"Siswa Siklus Kartu (sintetis)"}', now(), now(), '', '', '', '');

  insert into auth.identities (id, user_id, provider_id, identity_data, provider,
                               last_sign_in_at, created_at, updated_at)
  select gen_random_uuid(), u.id, u.id::text,
         jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
         'email', now(), now(), now()
    from auth.users u where u.id in (u_mail, u_card);

  select person_id into p_mail from public.accounts where auth_user_id = u_mail;
  select person_id into p_card from public.accounts where auth_user_id = u_card;

  insert into public.enrollments (person_id, institution_id, academic_period_id, programme_id, status)
  values (p_mail, inst, period, prog, 'ACTIVE') returning id into e_mail;
  insert into public.enrollments (person_id, institution_id, academic_period_id, programme_id, status)
  values (p_card, inst, period, prog, 'ACTIVE') returning id into e_card;
  insert into public.memberships (enrollment_id, node_id, academic_period_id) values
    (e_mail, coh, period), (e_mail, cls, period),
    (e_card, coh, period), (e_card, cls, period);

  raise notice 'fixture: cycle learners siklus-email and card-% placed in the fixture class', card;
end $$;
