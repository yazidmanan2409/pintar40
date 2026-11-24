-- Ruling 79's audit world (track 3c), part 11: W14 (J7, a key correction after results exist).
--
-- WHERE: the dev/CI bootstrap tenant pintar-bootstrap-official («PINTAR Bootstrap (OFFICIAL evidence — development and
-- CI only)»), Bob's ruling (24 Nov). A certificate needs OFFICIAL evidence (INV-20: certificate_eligibility reads
-- official_sessions), and outside production the only non-synthetic school is the declared bootstrap (0042). Bob's
-- conditions, each kept here:
--   1. new classes and new people of the world's own; the seeded rows untouched (a fingerprint of every seeded row of
--      the tenant is taken first, and 99-periksa.sql fails the load unless every one is unchanged);
--   2. the tenant's namespace, X9W, WORLD-ONLY, set inside this load transaction after a reset (PINTAR IDs need one);
--   3. the certificates are issued through the product's own route after the load (audit/dunia/terbitkan.mjs: each
--      holder signs in and POSTs /api/certificates/issue, signed with CI's synthetic CERT_SECRET_KEY_V1), never by SQL;
--   4. the loader refuses every database but the local stack's (muat.sh);
--   5. W14's captures are labelled «bukti OFFICIAL di tenant bootstrap dev/CI (sintetis)».
--
--   W14  Class «9A (dunia)» at the bootstrap, its own year, admin, head of department (the reviewer and approver) and
--        teacher. The chapter «Perkalian Bilangan Cacah», sealed at 60 %, Uji Penguasaan of 6 single-answer questions,
--        no must-be-right question. ONE KEY IS WRONG: «Berapakah 7 × 8?» is keyed 54 (A); the true answer is 56 (B).
--          Ratih (w14.murid_terbit)  6 of 6 (answers A, the key): 100 %; after the correction 5 of 6 (83 %): still
--                                    passes, so her certificate is REISSUED (J7 step 7, first case)
--          Bayu  (w14.murid_benar)   5 of 6 (answers B, the truth): 83 %; after the correction 6 of 6. No certificate
--                                    is issued for him by the world: the recalculation upward, old beside new (step 3)
--          Citra (w14.murid_cabut)   4 of 6 (answers A, and two others wrong): 67 %; after the correction 3 of 6
--                                    (50 %): below the mark, so her certificate is REVOKED (step 7, second case)
--        Ratih's and Citra's certificates are issued by terbitkan.mjs.

do $$ begin perform set_config('app.seed_intent', 'synthetic', true); end $$;

create table dunia.benih (tabel text not null, id text not null, sidik text not null, primary key (tabel, id));

-- the fingerprint of every seeded row of the bootstrap tenant, before the world touches it (Bob's condition 1)
do $$
declare b uuid; t record;
begin
  perform dunia.jaga();
  select id into b from public.institutions where slug = 'pintar-bootstrap-official' and is_official_bootstrap;
  if b is null then raise exception 'W14: the dev/CI bootstrap tenant is missing'; end if;
  perform dunia.simpan('boot.sekolah', b::text);
  for t in select c.table_name from information_schema.columns c join information_schema.tables x
             on x.table_schema = c.table_schema and x.table_name = c.table_name and x.table_type = 'BASE TABLE'
            where c.table_schema = 'public' and c.column_name = 'institution_id'
              and exists (select 1 from information_schema.columns k where k.table_schema = 'public'
                           and k.table_name = c.table_name and k.column_name = 'id') loop
    execute format('insert into dunia.benih select %L, x.id::text, md5(row_to_json(x)::text) from public.%I x where x.institution_id = $1',
                   t.table_name, t.table_name) using b;
  end loop;
  insert into dunia.benih select 'institutions', i.id::text, md5((to_jsonb(i) - 'namespace')::text)
    from public.institutions i where i.id = b;
  raise notice 'dunia: W14 fingerprinted % seeded row(s) of the bootstrap tenant', (select count(*) from dunia.benih);
end $$;

do $$
declare b uuid := dunia.ambil('boot.sekolah')::uuid; ta uuid; fak uuid; dep uuid; prog uuid; ang uuid; kls uuid; w jsonb;
begin
  perform dunia.jaga();
  update public.institutions set namespace = 'X9W' where id = b and namespace is null;
  if (select namespace from public.institutions where id = b) <> 'X9W' then raise exception 'W14: the namespace was not set'; end if;
  insert into public.academic_periods (institution_id, name, starts_on, ends_on)
  values (b, dunia.ta_nama() || ' (dunia audit)', dunia.ta_mulai(), dunia.ta_selesai()) returning id into ta;
  insert into public.org_nodes (institution_id, parent_id, kind, name) values (b, b, 'FACULTY', 'SMP (dunia audit)') returning id into fak;
  insert into public.org_nodes (institution_id, parent_id, kind, name) values (b, fak, 'DEPARTMENT', 'Matematika (dunia audit)') returning id into dep;
  insert into public.org_nodes (institution_id, parent_id, kind, name) values (b, dep, 'PROGRAMME', 'SMP Reguler (dunia audit)') returning id into prog;
  insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
  values (b, prog, 'COHORT', 'Kelas 9 (dunia audit)', ta) returning id into ang;
  insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
  values (b, ang, 'CLASS', '9A (dunia)', ta) returning id into kls;
  insert into public.classes (node_id, subject, status) values (kls, 'Matematika', 'ACTIVE');
  perform dunia.simpan('boot.ta', ta::text); perform dunia.simpan('boot.prog', prog::text); perform dunia.simpan('boot.dep', dep::text);
  perform dunia.simpan('boot.ang', ang::text); perform dunia.simpan('boot.kelas9a', kls::text);

  perform dunia.staf('w14.admin', 'admin.bootstrap-dunia@dunia.pintar.test', 'Sintetis-BootAdmin-81!', 'Yohana Simanjuntak', 'INSTITUTION_ADMIN', b);
  perform dunia.staf('w14.kaprodi', 'kaprodi.bootstrap-dunia@dunia.pintar.test', 'Sintetis-BootKaprodi-82!', 'Made Wirawan', 'HEAD_OF_DEPARTMENT', dep);
  perform dunia.staf('w14.guru', 'guru9a.bootstrap-dunia@dunia.pintar.test', 'Sintetis-BootGuru-83!', 'Nur Aisyah', 'EDUCATOR', kls);
  perform dunia.murid_email('w14.murid_terbit', 'ratih.kusuma@dunia.pintar.test', 'Sintetis-RatihK-84!', 'Ratih Kusuma',
                            'boot.sekolah', 'boot.ta', 'boot.prog', array['boot.ang', 'boot.kelas9a'], 'w14.admin', true);
  perform dunia.murid_email('w14.murid_benar', 'bayu.pratama@dunia.pintar.test', 'Sintetis-BayuP-85!', 'Bayu Pratama',
                            'boot.sekolah', 'boot.ta', 'boot.prog', array['boot.ang', 'boot.kelas9a'], 'w14.admin', true);
  perform dunia.murid_email('w14.murid_cabut', 'citra.lestari@dunia.pintar.test', 'Sintetis-CitraL-86!', 'Citra Lestari',
                            'boot.sekolah', 'boot.ta', 'boot.prog', array['boot.ang', 'boot.kelas9a'], 'w14.admin', true);

  w := dunia.bab($j${
    "sekolah": "boot.sekolah", "kelas": "boot.kelas9a", "ta": "boot.ta",
    "penulis": "w14.guru", "peninjau": "w14.kaprodi", "admin": "w14.admin",
    "mapel": "Matematika", "jenjang": "SMP", "tingkat": "Kelas 9", "judul": "Perkalian Bilangan Cacah", "batas": 60,
    "pelajaran": [{"judul": "Perkalian", "ringkas": "Perkalian adalah penjumlahan berulang.",
                   "isi": "## Perkalian sebagai penjumlahan berulang\n\n7 × 8 berarti 8 dijumlahkan sebanyak 7 kali.\n\n## Sifat pertukaran\n\n7 × 8 sama dengan 8 × 7."}],
    "salah_konsep": [["X9W-TAMBAH", "Dijumlahkan, bukan dikalikan", "Kedua bilangan dijumlahkan.", "Ingat: perkalian adalah penjumlahan berulang."],
                     ["X9W-HAFAL", "Fakta perkalian tertukar", "Hasil perkalian di sebelahnya dipakai.", "Hitung ulang dengan penjumlahan berulang."]],
    "tujuan": [{"pel": 1, "kode": "X9W-K1", "pernyataan": "Menghitung hasil perkalian dua bilangan satu angka."}],
    "soal": [
      {"pel": 1, "tujuan": "X9W-K1", "peran": "PRE_TEST", "tipe": "MCQ_SINGLE", "d": 0.2,
       "stem": "Berapakah 3 × 4?", "arah": "Jumlahkan 4 sebanyak 3 kali.", "petunjuk": "4 + 4 + 4.",
       "op": [["A", "12", true, "4 + 4 + 4 = 12.", null], ["B", "7", false, "Itu 3 + 4.", "X9W-TAMBAH"],
              ["C", "16", false, "Itu 4 × 4.", "X9W-HAFAL"], ["D", "9", false, "Itu 3 × 3.", "X9W-HAFAL"]]},
      {"pel": 1, "tujuan": "X9W-K1", "peran": "POST_TEST", "tipe": "MCQ_SINGLE", "d": 0.4,
       "stem": "Berapakah 7 × 8?", "arah": "Jumlahkan 8 sebanyak 7 kali.", "petunjuk": "7 × 8 sama dengan 8 × 7.",
       "op": [["A", "54", true, "Hasil perkalian 7 dan 8.", null], ["B", "56", false, "Hitung ulang penjumlahannya.", "X9W-HAFAL"],
              ["C", "15", false, "Itu 7 + 8.", "X9W-TAMBAH"], ["D", "63", false, "Itu 7 × 9.", "X9W-HAFAL"]]},
      {"pel": 1, "tujuan": "X9W-K1", "peran": "POST_TEST", "tipe": "MCQ_SINGLE", "d": 0.3,
       "stem": "Berapakah 6 × 5?", "arah": "Jumlahkan 5 sebanyak 6 kali.", "petunjuk": "5 + 5 + 5 + 5 + 5 + 5.",
       "op": [["A", "11", false, "Itu 6 + 5.", "X9W-TAMBAH"], ["B", "30", true, "Enam kali lima.", null],
              ["C", "35", false, "Itu 7 × 5.", "X9W-HAFAL"], ["D", "25", false, "Itu 5 × 5.", "X9W-HAFAL"]]},
      {"pel": 1, "tujuan": "X9W-K1", "peran": "POST_TEST", "tipe": "MCQ_SINGLE", "d": 0.3,
       "stem": "Berapakah 9 × 3?", "arah": "Jumlahkan 9 sebanyak 3 kali.", "petunjuk": "9 + 9 + 9.",
       "op": [["A", "27", true, "9 + 9 + 9 = 27.", null], ["B", "12", false, "Itu 9 + 3.", "X9W-TAMBAH"],
              ["C", "24", false, "Itu 8 × 3.", "X9W-HAFAL"], ["D", "36", false, "Itu 9 × 4.", "X9W-HAFAL"]]},
      {"pel": 1, "tujuan": "X9W-K1", "peran": "POST_TEST", "tipe": "MCQ_SINGLE", "d": 0.3,
       "stem": "Berapakah 4 × 8?", "arah": "Jumlahkan 8 sebanyak 4 kali.", "petunjuk": "8 + 8 + 8 + 8.",
       "op": [["A", "12", false, "Itu 4 + 8.", "X9W-TAMBAH"], ["B", "28", false, "Itu 4 × 7.", "X9W-HAFAL"],
              ["C", "32", true, "Empat kali delapan.", null], ["D", "36", false, "Itu 4 × 9.", "X9W-HAFAL"]]},
      {"pel": 1, "tujuan": "X9W-K1", "peran": "POST_TEST", "tipe": "MCQ_SINGLE", "d": 0.3,
       "stem": "Berapakah 5 × 7?", "arah": "Jumlahkan 7 sebanyak 5 kali.", "petunjuk": "7 + 7 + 7 + 7 + 7.",
       "op": [["A", "35", true, "Lima kali tujuh.", null], ["B", "12", false, "Itu 5 + 7.", "X9W-TAMBAH"],
              ["C", "30", false, "Itu 5 × 6.", "X9W-HAFAL"], ["D", "40", false, "Itu 5 × 8.", "X9W-HAFAL"]]},
      {"pel": 1, "tujuan": "X9W-K1", "peran": "POST_TEST", "tipe": "MCQ_SINGLE", "d": 0.3,
       "stem": "Berapakah 8 × 2?", "arah": "Jumlahkan 2 sebanyak 8 kali.", "petunjuk": "Atau 8 + 8.",
       "op": [["A", "10", false, "Itu 8 + 2.", "X9W-TAMBAH"], ["B", "16", true, "8 + 8 = 16.", null],
              ["C", "18", false, "Itu 9 × 2.", "X9W-HAFAL"], ["D", "14", false, "Itu 7 × 2.", "X9W-HAFAL"]]}
    ],
    "batas_percobaan": 2, "simpan": "w14.bab"
  }$j$::jsonb);

  perform dunia.duduk('w14.murid_terbit', (w ->> 'pa')::uuid);
  perform dunia.simpan('w14.sesi_terbit', dunia.duduk('w14.murid_terbit', (w ->> 'up')::uuid)::text);
  perform dunia.duduk('w14.murid_benar', (w ->> 'pa')::uuid);
  perform dunia.simpan('w14.sesi_benar', dunia.duduk('w14.murid_benar', (w ->> 'up')::uuid, '{}', null,
                                                     '{"Berapakah 7 × 8?": "B"}'::jsonb)::text);
  perform dunia.duduk('w14.murid_cabut', (w ->> 'pa')::uuid);
  perform dunia.simpan('w14.sesi_cabut', dunia.duduk('w14.murid_cabut', (w ->> 'up')::uuid,
                                                     array['Berapakah 6 × 5?', 'Berapakah 9 × 3?'])::text);
  perform dunia.simpan('w14.soal_salah_kunci', (select i.id::text from public.items i join public.lessons l on l.id = i.lesson_id
    join public.modules m on m.id = l.module_id where m.course_id = (w ->> 'kursus')::uuid and i.stem = 'Berapakah 7 × 8?'));
  raise notice 'dunia: W14 (the bootstrap tenant, namespace X9W; «7 × 8» keyed 54; Ratih 100 %%, Bayu 83 %%, Citra 67 %%)';
end $$;

-- W14's own checks: OFFICIAL evidence, and each holder eligible, as the product decides it
do $$
declare k text; e record;
begin
  foreach k in array array['w14.sesi_terbit', 'w14.sesi_benar', 'w14.sesi_cabut'] loop
    if public.effective_evidence_class(dunia.ambil(k)::uuid) <> 'OFFICIAL' then raise exception 'W14: % is not OFFICIAL evidence', k; end if;
    select * into e from public.certificate_eligibility(dunia.ambil(k)::uuid);
    if not e.eligible then raise exception 'W14: % is not eligible: % (mastery %)', k, e.reason, e.mastery; end if;
  end loop;
  raise notice 'dunia: W14 checks: three OFFICIAL sittings, each eligible (two certificates issued after the load)';
end $$;
