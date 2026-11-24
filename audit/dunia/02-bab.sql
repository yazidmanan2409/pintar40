-- Ruling 79's audit world (track 3c), part 2: the chapter builder, and SD Melati's chapter for 4A (J1's «today's task»).
--
-- dunia.bab(spec) builds one chapter the way a school's chapter really arrives, and walks it through the real
-- lifecycle (learning_cycle.sql's path): written by the author, approved by the reviewer of record, checked by the
-- validator and the MCQ quality pass (publish_readiness must say READY, or the world refuses), released, frozen,
-- published by the school admin, its pass mark set by the school, and given to the class.
-- Its questions are tagged as the product's own import tags them (items.cycle_role, D-008): every PRE_TEST question is
-- on the Pemetaan Awal, every POST_TEST one on the Uji Penguasaan. So each paper is fixed, and the same after a reset.
--
-- spec: { "sekolah": k, "kelas": k, "ta": k, "penulis": k, "peninjau": k, "admin": k,   (keys in dunia.fakta)
--         "mapel", "jenjang", "tingkat", "judul", "batas" (pass mark, or null for none), "batas_alasan",
--         "pelajaran": [ {"judul", "ringkas", "isi"} ],
--         "tujuan": [ {"pel": n, "kode", "pernyataan"} ],
--         "salah_konsep": [ [kode, label, description, remediation] ]   (the school's misconceptions; every wrong
--                    option names one, as the MCQ quality pass asks)
--         "soal": [ {"pel": n, "tujuan": kode, "peran": "PRE_TEST"|"POST_TEST"|null, "tipe": "MCQ_SINGLE"|"MCQ_MULTI",
--                    "wajib_tepat": bool, "d": difficulty, "stem", "petunjuk", "arah",
--                    "op": [[label, body, correct, rationale, misconception kode|null]] } ],
--         "batas_percobaan": n (the Uji Penguasaan's attempt limit), "simpan": k }
--         "tahap": "draf" (optional: stop at the draft package, as an upload leaves it)
-- It records under spec.simpan: course, release, learning assignment, both assessment assignments.

do $$ begin perform set_config('app.seed_intent', 'synthetic', true); end $$;

create function dunia.bab(spec jsonb) returns jsonb language plpgsql as $$
declare
  inst uuid := dunia.ambil(spec ->> 'sekolah')::uuid;
  kelas uuid := dunia.ambil(spec ->> 'kelas')::uuid;
  ta uuid := dunia.ambil(spec ->> 'ta')::uuid;
  p_penulis uuid := (dunia.ambil(spec ->> 'penulis'))::jsonb ->> 'person';
  p_peninjau uuid := (dunia.ambil(spec ->> 'peninjau'))::jsonb ->> 'person';
  p_admin uuid := (dunia.ambil(spec ->> 'admin'))::jsonb ->> 'person';
  src uuid; srcv uuid; kursus uuid; modul uuid; pel uuid[] := '{}'; l uuid; it uuid;
  t jsonb; o jsonb; tujuan jsonb := '{}'; n int := 0;
  def_pre uuid; def_post uuid; rel uuid; la uuid; aa_pre uuid; aa_post uuid;
  k text; v_status text; v_blockers jsonb; v_n int;
begin
  perform dunia.jaga();
  insert into public.sources (institution_id, title, publisher, isbn, note)
  values (inst, 'Bahan Ajar Sintetis Dunia Audit — ' || (spec ->> 'judul'), 'PINTAR (sintetis)', null,
          'Konten dunia audit ruling 79. Bukan terbitan nyata.') returning id into src;
  insert into public.source_versions (source_id, institution_id, version_label) values (src, inst, 'dunia-1') returning id into srcv;
  insert into public.courses (institution_id, subject, stage, grade_label, title, author_person_id)
  values (inst, spec ->> 'mapel', spec ->> 'jenjang', spec ->> 'tingkat', spec ->> 'judul', p_penulis) returning id into kursus;
  insert into public.modules (course_id, institution_id, ordinal, title, author_person_id)
  values (kursus, inst, 1, spec ->> 'judul', p_penulis) returning id into modul;

  for t in select * from jsonb_array_elements(spec -> 'pelajaran') loop
    n := n + 1;
    insert into public.lessons (module_id, institution_id, ordinal, title, summary, body_markdown, worked_examples, media,
                                source_version_id, page_citation, author_person_id)
    values (modul, inst, n, t ->> 'judul', t ->> 'ringkas', t ->> 'isi', '[]'::jsonb, '[]'::jsonb, srcv,
            'Bagian ' || n, p_penulis)
    returning id into l;
    pel := pel || l;
  end loop;
  for t in select * from jsonb_array_elements(coalesce(spec -> 'salah_konsep', '[]')) loop
    insert into public.misconception_taxonomy (code, institution_id, label, description, remediation)
    values (t ->> 0, inst, t ->> 1, t ->> 2, t ->> 3) on conflict do nothing;
  end loop;
  for t in select * from jsonb_array_elements(spec -> 'tujuan') loop
    insert into public.learning_objectives (lesson_id, institution_id, code, statement, bloom, is_core)
    values (pel[(t ->> 'pel')::int], inst, t ->> 'kode', t ->> 'pernyataan', 'APPLY', true) returning id into l;
    tujuan := tujuan || jsonb_build_object(t ->> 'kode', l);
  end loop;
  for t in select * from jsonb_array_elements(spec -> 'soal') loop
    insert into public.items (lesson_id, institution_id, item_type, bank_type, stem, petunjuk, arah_berpikir, objective_ids,
                              is_safety_critical, predicted_difficulty, cycle_role, source_version_id, page_citation,
                              author_person_id)
    values (pel[(t ->> 'pel')::int], inst, (t ->> 'tipe')::public.item_type,
            case when t ->> 'peran' is null then 'PRACTICE' else 'TEST' end::public.bank_type,
            t ->> 'stem', t ->> 'petunjuk', t ->> 'arah', array[(tujuan ->> (t ->> 'tujuan'))::uuid],
            coalesce((t ->> 'wajib_tepat')::boolean, false), (t ->> 'd')::numeric,
            (t ->> 'peran')::public.assessment_mode, srcv, 'Bagian ' || (t ->> 'pel'), p_penulis)
    returning id into it;
    for o in select * from jsonb_array_elements(t -> 'op') loop
      insert into public.item_options (item_id, institution_id, label, body, is_correct, rationale, misconception_code)
      values (it, inst, o ->> 0, o ->> 1, (o ->> 2)::boolean, o ->> 3, o ->> 4);
    end loop;
  end loop;

  -- the Pemetaan Awal and the Uji Penguasaan, as the product's import makes them: every tagged question drawn
  select count(*) into v_n from public.items i join public.lessons ls on ls.id = i.lesson_id
   where ls.module_id = modul and i.cycle_role = 'PRE_TEST';
  insert into public.assessment_definitions (institution_id, course_id, title, mode, bank_type, item_count, difficulty_mix,
    safety_critical_minimum, passing_rules, hesitation_window_seconds, shuffle_policy, allows_pause, offline_tolerant,
    late_sync_grace_seconds, attempt_limit, author_person_id)
  values (inst, kursus, 'Pemetaan Awal — ' || (spec ->> 'judul'), 'PRE_TEST', 'TEST', v_n, '{}'::jsonb, 0, '{}'::jsonb, 25,
          'ITEMS_AND_OPTIONS', false, true, 120, 1, p_penulis) returning id into def_pre;
  select count(*) into v_n from public.items i join public.lessons ls on ls.id = i.lesson_id
   where ls.module_id = modul and i.cycle_role = 'POST_TEST';
  insert into public.assessment_definitions (institution_id, course_id, title, mode, bank_type, item_count, difficulty_mix,
    safety_critical_minimum, passing_rules, hesitation_window_seconds, shuffle_policy, allows_pause, offline_tolerant,
    late_sync_grace_seconds, attempt_limit, author_person_id)
  values (inst, kursus, 'Uji Penguasaan — ' || (spec ->> 'judul'), 'POST_TEST', 'TEST', v_n, '{}'::jsonb,
          (select count(*) from jsonb_array_elements(spec -> 'soal') x where x ->> 'peran' = 'POST_TEST' and (x ->> 'wajib_tepat')::boolean),
          '{"mastery_min":0.6}'::jsonb, 25, 'ITEMS_AND_OPTIONS', true, true, 120,
          coalesce((spec ->> 'batas_percobaan')::int, 2), p_penulis) returning id into def_post;

  -- "tahap": "draf" stops here: the package as an upload leaves it (INGESTED, the author's to edit and submit; J6)
  if spec ->> 'tahap' = 'draf' then
    t := jsonb_build_object('kursus', kursus, 'modul', modul, 'pelajaran', to_jsonb(pel), 'tujuan', tujuan,
                            'def_pa', def_pre, 'def_up', def_post);
    perform dunia.simpan(spec ->> 'simpan', t::text);
    return t;
  end if;

  -- through review, approved by the reviewer of record (never the author)
  foreach k in array array['STRUCTURED','VALIDATED','IN_REVIEW'] loop
    update public.courses set status = k::public.content_status where id = kursus;
    update public.modules set status = k::public.content_status where course_id = kursus;
    update public.lessons set status = k::public.content_status where module_id = modul;
    update public.items set status = k::public.content_status where lesson_id = any (pel);
    update public.assessment_definitions set status = k::public.content_status where course_id = kursus;
  end loop;
  perform dunia.sebagai(spec ->> 'peninjau');
  update public.courses set status = 'APPROVED', reviewed_by_person_id = p_peninjau where id = kursus;
  update public.modules set status = 'APPROVED', reviewed_by_person_id = p_peninjau where course_id = kursus;
  update public.lessons set status = 'APPROVED', reviewed_by_person_id = p_peninjau where module_id = modul;
  update public.items set status = 'APPROVED', reviewed_by_person_id = p_peninjau where lesson_id = any (pel);
  update public.assessment_definitions set status = 'APPROVED', reviewed_by_person_id = p_peninjau where course_id = kursus;
  perform public.validate_course_content(kursus);
  perform public.run_mcq_quality(kursus);
  perform dunia.sebagai(null);
  select status, blockers into v_status, v_blockers from public.publish_readiness(kursus);
  if v_status <> 'READY' then
    raise exception 'dunia.bab «%»: not publishable: % — fix the world, never the gate', spec ->> 'judul', v_blockers::text;
  end if;

  -- released, frozen by the reviewer, published by the school admin
  insert into public.plp_releases (institution_id, course_id, version_label, author_person_id)
  values (inst, kursus, '1.0.0', p_penulis) returning id into rel;
  foreach k in array array['STRUCTURED','VALIDATED','IN_REVIEW'] loop
    update public.plp_releases set status = k::public.content_status where id = rel;
  end loop;
  perform dunia.sebagai(spec ->> 'peninjau');
  update public.plp_releases set status = 'APPROVED', reviewed_by_person_id = p_peninjau where id = rel;
  update public.plp_releases set status = 'FROZEN' where id = rel;
  perform dunia.sebagai(spec ->> 'admin');
  update public.plp_releases set status = 'PUBLISHED' where id = rel;

  -- the school's pass mark (W4 gives a chapter before one exists: "batas" null), then the class is given the chapter
  if spec ->> 'batas' is not null then
    perform public.set_school_pass_mark(inst, kursus, (spec ->> 'batas')::int, coalesce(spec ->> 'batas_alasan', 'Batas ketuntasan sekolah (dunia audit)'));
  elsif not coalesce((spec ->> 'warisan')::boolean, false) then
    raise exception 'dunia.bab «%»: no pass mark, and not marked "warisan" (a legacy state)', spec ->> 'judul';
  end if;
  -- W4, A LEGACY STATE, WRITTEN PAST TODAY'S GUARD: a chapter given before the school had a pass mark (as real data from
  -- before D-088(b) holds). The product now refuses that (seal_assignment_pass_mark: ASSIGN_PASS_MARK_MISSING), so the
  -- one sealing trigger is disabled for this chapter's own assignment rows only, and enabled again at once, as the
  -- selftests do for their fixture-only states. Only a spec marked "warisan" reaches it.
  if coalesce((spec ->> 'warisan')::boolean, false) then
    alter table public.assessment_assignments disable trigger assessment_assignments_the_pass_mark_is_sealed;
  end if;
  insert into public.learning_assignments (institution_id, plp_release_id, course_id, node_id, academic_period_id,
    is_required, learning_cycle, assigned_by_person_id, assigned_at)
  values (inst, rel, kursus, kelas, ta, true, jsonb_build_object('pre_test', def_pre, 'post_test', def_post), p_admin, now())
  returning id into la;
  update public.learning_assignments set status = 'ACTIVE' where id = la;
  insert into public.assessment_assignments (institution_id, assessment_definition_id, learning_assignment_id, node_id,
    academic_period_id, opens_at, closes_at, assigned_by_person_id, assigned_at)
  values (inst, def_pre, la, kelas, ta, now() - interval '1 day', now() + interval '180 days', p_admin, now())
  returning id into aa_pre;
  insert into public.assessment_assignments (institution_id, assessment_definition_id, learning_assignment_id, node_id,
    academic_period_id, opens_at, closes_at, assigned_by_person_id, assigned_at)
  values (inst, def_post, la, kelas, ta, now() - interval '1 day', now() + interval '180 days', p_admin, now())
  returning id into aa_post;
  if coalesce((spec ->> 'warisan')::boolean, false) then
    alter table public.assessment_assignments enable trigger assessment_assignments_the_pass_mark_is_sealed;
  end if;
  foreach k in array array['SCHEDULED','OPEN'] loop
    update public.assessment_assignments set status = k::public.assessment_assignment_status where id in (aa_pre, aa_post);
  end loop;
  perform dunia.sebagai(null);

  t := jsonb_build_object('kursus', kursus, 'rilis', rel, 'tugas', la, 'pa', aa_pre, 'up', aa_post,
                          'def_pa', def_pre, 'def_up', def_post, 'tujuan', tujuan);
  perform dunia.simpan(spec ->> 'simpan', t::text);
  return t;
end $$;

-- SD Melati's chapter for 4A: J1's «today's task». Small, single-answer, for a 9-year-old.
do $$
begin
  perform dunia.bab($j${
    "sekolah": "sd.sekolah", "kelas": "sd.kelas4a", "ta": "sd.ta",
    "penulis": "sd.guru4a", "peninjau": "sd.wakasek", "admin": "sd.admin",
    "mapel": "Matematika", "jenjang": "SD", "tingkat": "Kelas 4", "judul": "Mengenal Pecahan",
    "batas": 60, "batas_alasan": "Batas ketuntasan SD Melati (dunia audit)",
    "pelajaran": [
      {"judul": "Bagian yang Sama Besar", "ringkas": "Pecahan menyebut bagian yang sama besar dari satu benda.",
       "isi": "## Satu kue, empat bagian\n\nKalau satu kue dipotong menjadi empat bagian yang sama besar, setiap bagian disebut seperempat.\n\n[[visual:pecahan|1/4]]"},
      {"judul": "Membaca Pecahan", "ringkas": "Angka atas menyebut bagian yang diambil, angka bawah menyebut semua bagian.",
       "isi": "## Pembilang dan penyebut\n\nPada 3/4, angka 3 adalah bagian yang diambil dan angka 4 adalah banyak semua bagian.\n\n[[visual:pecahan|3/4]]"}
    ],
    "salah_konsep": [
      ["MLT-BAG", "Salah menghitung bagian", "Menghitung bagian tanpa melihat semua potongan.", "Hitung semua potongan dulu, baru sebut satu bagiannya."],
      ["MLT-ATB", "Tertukar atas dan bawah", "Menukar arti pembilang dan penyebut.", "Ingat: angka atas yang diambil, angka bawah semuanya."],
      ["MLT-UTH", "Menganggap pecahan sebagai benda utuh", "Belum melihat bahwa pecahan adalah bagian.", "Bandingkan benda utuh dengan potongannya."]
    ],
    "tujuan": [
      {"pel": 1, "kode": "MLT4-1", "pernyataan": "Mengenali bagian yang sama besar dari satu benda."},
      {"pel": 2, "kode": "MLT4-2", "pernyataan": "Membaca pembilang dan penyebut sebuah pecahan."}
    ],
    "soal": [
      {"pel": 1, "tujuan": "MLT4-1", "peran": "PRE_TEST", "tipe": "MCQ_SINGLE", "d": 0.3,
       "stem": "Satu roti dipotong menjadi 2 bagian yang sama besar. Satu bagiannya disebut?",
       "arah": "Hitung ada berapa bagian semuanya.", "petunjuk": "Dua bagian yang sama besar.",
       "op": [["A", "Setengah", true, "Satu dari dua bagian sama besar."], ["B", "Seperempat", false, "Itu satu dari empat bagian.", "MLT-BAG"],
              ["C", "Sepertiga", false, "Itu satu dari tiga bagian.", "MLT-BAG"], ["D", "Satu utuh", false, "Satu utuh belum dipotong.", "MLT-UTH"]]},
      {"pel": 2, "tujuan": "MLT4-2", "peran": "PRE_TEST", "tipe": "MCQ_SINGLE", "d": 0.4,
       "stem": "Pada pecahan 2/5, angka 5 menyebut apa?",
       "arah": "Angka bawah menyebut semua bagian.", "petunjuk": "Lihat angka yang di bawah garis.",
       "op": [["A", "Bagian yang diambil", false, "Itu angka atas.", "MLT-ATB"], ["B", "Banyak semua bagian", true, "Angka bawah adalah penyebut."],
              ["C", "Jumlah kue", false, "Pecahan menyebut bagian, bukan jumlah kue.", "MLT-UTH"], ["D", "Sisa bagian", false, "Sisa dihitung dari keduanya.", "MLT-BAG"]]},
      {"pel": 1, "tujuan": "MLT4-1", "peran": "POST_TEST", "tipe": "MCQ_SINGLE", "d": 0.4,
       "stem": "Pizza dipotong menjadi 4 bagian yang sama besar. Satu bagiannya disebut?",
       "arah": "Hitung semua potongannya.", "petunjuk": "Empat bagian yang sama besar.",
       "op": [["A", "Setengah", false, "Itu satu dari dua bagian.", "MLT-BAG"], ["B", "Sepertiga", false, "Itu satu dari tiga bagian.", "MLT-BAG"],
              ["C", "Seperempat", true, "Satu dari empat bagian sama besar."], ["D", "Satu utuh", false, "Satu utuh belum dipotong.", "MLT-UTH"]]},
      {"pel": 2, "tujuan": "MLT4-2", "peran": "POST_TEST", "tipe": "MCQ_SINGLE", "d": 0.5,
       "stem": "Pada pecahan 3/8, angka 3 menyebut apa?",
       "arah": "Angka atas menyebut bagian yang diambil.", "petunjuk": "Lihat angka yang di atas garis.",
       "op": [["A", "Bagian yang diambil", true, "Angka atas adalah pembilang."], ["B", "Banyak semua bagian", false, "Itu angka bawah.", "MLT-ATB"],
              ["C", "Jumlah kue", false, "Pecahan menyebut bagian, bukan jumlah kue.", "MLT-UTH"], ["D", "Sisa bagian", false, "Sisa dihitung dari keduanya.", "MLT-BAG"]]},
      {"pel": 2, "tujuan": "MLT4-2", "peran": "POST_TEST", "tipe": "MCQ_SINGLE", "d": 0.5,
       "stem": "Pada pecahan 1/6, ada berapa bagian semuanya?",
       "arah": "Angka bawah menyebut semua bagian.", "petunjuk": "Lihat angka yang di bawah garis.",
       "op": [["A", "1 bagian", false, "Itu bagian yang diambil.", "MLT-ATB"], ["B", "5 bagian", false, "Itu sisa bagiannya.", "MLT-BAG"],
              ["C", "6 bagian", true, "Penyebutnya 6."], ["D", "7 bagian", false, "Pembilang dan penyebut tidak dijumlahkan.", "MLT-ATB"]]}
    ],
    "batas_percobaan": 2, "simpan": "sd.bab4a"
  }$j$::jsonb);
end $$;
