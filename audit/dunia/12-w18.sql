-- Ruling 79's audit world (track 3c), part 12: W18 (J11, reading the school), in the dev/CI bootstrap tenant, under
-- Bob's W14 conditions (new rows only, seeded rows fingerprinted in 11-w14.sql and checked in 99-periksa.sql; the
-- local-only loader; captures labelled «bukti OFFICIAL di tenant bootstrap dev/CI (sintetis)»).
--
-- The school report (/dekan/ringkasan, generate_report over institution_learning_intelligence, and
-- kesiapan_kelas_per_mapel) reads OFFICIAL evidence only. Its rules (the current catalogue, MC-10):
--   a domain is one learning objective; its mean is shown only with at least 10 learners, every (objective × class)
--   cell at least 5, and no «moved» cell of 1–4 (learners who sat the chapter in a class they have since left);
--   otherwise it is withheld, for 'learners', then 'class', then 'moved'. A class's readiness needs 5 learners.
-- W18 is its own subject, IPA, in its own Angkatan «Kelas 8 (dunia W18)» with classes 8P, 8Q and 8R, so it stands
-- apart from W14's Matematika class (which the same school report also shows: 9A, three learners, its domain
-- withheld for too few learners, and «belum cukup» for Matematika).
--
--   R1 «Sistem Pencernaan» (3 objectives): 10 learners, 5 in 8P and 5 in 8Q, each in their current class. Domain means
--      0.9 (IPA8-C1), 0.7 (IPA8-C2) and 0.4 (IPA8-C3): one in each band (from 0.8; 0.6 to 0.8; below 0.6).
--   R2 «Gaya dan Gerak» (IPA8-G1), WITHHELD 'moved': Lukman sits it in 8R, is moved to 8Q by the school admin
--      (move_learner_to_class), and sits it again in 8Q. The current sittings are 5 in 8P and 5 in 8Q (n = 10, cells 5
--      and 5), and the movers' cell (8R, R2) holds 1.
--   R3 «Cahaya» (IPA8-L1), WITHHELD 'learners': sat by three learners of 8P.
--   8R: UNDER THE MINIMUM SAMPLE: Lukman's old R2 sitting stays recorded there, so IPA in 8R reads 1 of 5.
--   The leader: Kepala sekolah Retno Wulandari, DEAN at the school's root (the report's figures need the root).

do $$ begin perform set_config('app.seed_intent', 'synthetic', true); end $$;

do $$
declare b uuid := dunia.ambil('boot.sekolah')::uuid; ta uuid := dunia.ambil('boot.ta')::uuid; fak uuid; dep uuid; prog uuid; ang uuid;
        kp uuid; kq uuid; kr uuid; n int := 0; nm text; r1 jsonb; r2 jsonb; r3 jsonb;
        nama text[] := array['Putri Ayuningtyas', 'Pandu Wicaksono', 'Prita Handayani', 'Purnomo Saleh', 'Pelangi Ramadhani',
                             'Qonita Azzahra', 'Qomar Hidayat', 'Quinsha Maharani', 'Qurrota Ayun', 'Lukman Hakim'];
        kunci text;
begin
  perform dunia.jaga();
  select parent_id into fak from public.org_nodes where id = dunia.ambil('boot.dep')::uuid;
  insert into public.org_nodes (institution_id, parent_id, kind, name) values (b, fak, 'DEPARTMENT', 'IPA (dunia audit)') returning id into dep;
  insert into public.org_nodes (institution_id, parent_id, kind, name) values (b, dep, 'PROGRAMME', 'IPA Reguler (dunia audit)') returning id into prog;
  insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
  values (b, prog, 'COHORT', 'Kelas 8 (dunia W18)', ta) returning id into ang;
  insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id) values (b, ang, 'CLASS', '8P (dunia)', ta) returning id into kp;
  insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id) values (b, ang, 'CLASS', '8Q (dunia)', ta) returning id into kq;
  insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id) values (b, ang, 'CLASS', '8R (dunia)', ta) returning id into kr;
  insert into public.classes (node_id, subject, status) values (kp, 'IPA', 'ACTIVE'), (kq, 'IPA', 'ACTIVE'), (kr, 'IPA', 'ACTIVE');
  perform dunia.simpan('w18.prog', prog::text); perform dunia.simpan('w18.ang', ang::text);
  perform dunia.simpan('w18.kelas_p', kp::text); perform dunia.simpan('w18.kelas_q', kq::text); perform dunia.simpan('w18.kelas_r', kr::text);

  perform dunia.staf('w18.dekan', 'kepala.bootstrap-dunia@dunia.pintar.test', 'Sintetis-BootKepala-91!', 'Retno Wulandari', 'DEAN', b);
  perform dunia.staf('w18.kaprodi', 'kaprodi-ipa.bootstrap-dunia@dunia.pintar.test', 'Sintetis-BootKaprodiIPA-92!', 'Sigit Prasetyo', 'HEAD_OF_DEPARTMENT', dep);
  perform dunia.staf('w18.guru', 'guru-ipa.bootstrap-dunia@dunia.pintar.test', 'Sintetis-BootGuruIPA-93!', 'Ani Susilowati', 'EDUCATOR', ang);

  foreach nm in array nama loop
    n := n + 1;
    kunci := 'w18.murid' || n;
    perform dunia.murid_email(kunci, lower(replace(nm, ' ', '.')) || '.w18@dunia.pintar.test', 'Sintetis-W18-' || n || '-94!', nm,
                              'boot.sekolah', 'boot.ta', 'w18.prog',
                              array['w18.ang', case when n <= 5 then 'w18.kelas_p' when n <= 9 then 'w18.kelas_q' else 'w18.kelas_r' end],
                              'w14.admin', true);
  end loop;

  -- the three chapters, each given to the Angkatan (so every one of its classes has it)
  r1 := dunia.bab($j${
    "sekolah": "boot.sekolah", "kelas": "w18.ang", "ta": "boot.ta", "penulis": "w18.guru", "peninjau": "w18.kaprodi", "admin": "w14.admin",
    "mapel": "IPA", "jenjang": "SMP", "tingkat": "Kelas 8", "judul": "Sistem Pencernaan", "batas": 60,
    "pelajaran": [{"judul": "Organ pencernaan", "ringkas": "Makanan dicerna dari mulut sampai usus.",
                   "isi": "## Urutan organ\n\nMulut, kerongkongan, lambung, usus halus, usus besar.\n\n## Fungsinya\n\nUsus halus menyerap sari makanan."}],
    "salah_konsep": [["X9W-CERNA", "Urutan organ tertukar", "Organ dibaca tidak berurutan.", "Ikuti jalan makanan dari mulut."]],
    "tujuan": [{"pel": 1, "kode": "IPA8-C1", "pernyataan": "Menyebutkan organ pertama pencernaan."},
               {"pel": 1, "kode": "IPA8-C2", "pernyataan": "Menjelaskan fungsi lambung."},
               {"pel": 1, "kode": "IPA8-C3", "pernyataan": "Menjelaskan tempat penyerapan sari makanan."}],
    "soal": [
      {"pel": 1, "tujuan": "IPA8-C1", "peran": "PRE_TEST", "tipe": "MCQ_SINGLE", "d": 0.2, "stem": "Di mana makanan pertama kali dicerna?",
       "arah": "Ikuti jalan makanan.", "petunjuk": "Mulai dari tempat makanan masuk.",
       "op": [["A", "Mulut", true, "Makanan masuk lewat mulut.", null], ["B", "Lambung", false, "Lambung sesudah kerongkongan.", "X9W-CERNA"],
              ["C", "Usus besar", false, "Usus besar hampir terakhir.", "X9W-CERNA"], ["D", "Usus halus", false, "Usus halus sesudah lambung.", "X9W-CERNA"]]},
      {"pel": 1, "tujuan": "IPA8-C1", "peran": "POST_TEST", "tipe": "MCQ_SINGLE", "d": 0.2, "stem": "Organ pencernaan yang pertama dilalui makanan adalah?",
       "arah": "Ikuti jalan makanan.", "petunjuk": "Tempat makanan dikunyah.",
       "op": [["A", "Kerongkongan", false, "Kerongkongan sesudah mulut.", "X9W-CERNA"], ["B", "Mulut", true, "Makanan dikunyah di mulut.", null],
              ["C", "Lambung", false, "Lambung sesudah kerongkongan.", "X9W-CERNA"], ["D", "Usus halus", false, "Usus halus sesudah lambung.", "X9W-CERNA"]]},
      {"pel": 1, "tujuan": "IPA8-C2", "peran": "POST_TEST", "tipe": "MCQ_SINGLE", "d": 0.4, "stem": "Apa fungsi lambung?",
       "arah": "Ingat isi lambung.", "petunjuk": "Ada asam lambung.",
       "op": [["A", "Mencerna makanan dengan bantuan asam", true, "Asamnya membantu mencerna.", null], ["B", "Menyerap sari makanan", false, "Itu fungsi usus halus.", "X9W-CERNA"],
              ["C", "Menyerap air", false, "Itu fungsi usus besar.", "X9W-CERNA"], ["D", "Mengunyah makanan", false, "Itu di mulut.", "X9W-CERNA"]]},
      {"pel": 1, "tujuan": "IPA8-C3", "peran": "POST_TEST", "tipe": "MCQ_SINGLE", "d": 0.5, "stem": "Di mana sari makanan diserap?",
       "arah": "Ingat fungsi setiap usus.", "petunjuk": "Bukan usus besar.",
       "op": [["A", "Lambung", false, "Lambung mencerna.", "X9W-CERNA"], ["B", "Usus besar", false, "Usus besar menyerap air.", "X9W-CERNA"],
              ["C", "Usus halus", true, "Usus halus menyerap sari makanan.", null], ["D", "Kerongkongan", false, "Kerongkongan menyalurkan.", "X9W-CERNA"]]}
    ], "batas_percobaan": 2, "simpan": "w18.bab1"
  }$j$::jsonb);
  r2 := dunia.bab($j${
    "sekolah": "boot.sekolah", "kelas": "w18.ang", "ta": "boot.ta", "penulis": "w18.guru", "peninjau": "w18.kaprodi", "admin": "w14.admin",
    "mapel": "IPA", "jenjang": "SMP", "tingkat": "Kelas 8", "judul": "Gaya dan Gerak", "batas": 60,
    "pelajaran": [{"judul": "Gaya", "ringkas": "Gaya adalah tarikan atau dorongan.",
                   "isi": "## Gaya\n\nGaya dapat mengubah gerak dan bentuk benda.\n\n## Satuan\n\nSatuan gaya adalah newton."}],
    "salah_konsep": [["X9W-GAYA", "Gaya disamakan dengan massa", "Massa dianggap gaya.", "Gaya adalah tarikan atau dorongan."]],
    "tujuan": [{"pel": 1, "kode": "IPA8-G1", "pernyataan": "Menjelaskan pengertian dan satuan gaya."}],
    "soal": [
      {"pel": 1, "tujuan": "IPA8-G1", "peran": "PRE_TEST", "tipe": "MCQ_SINGLE", "d": 0.3, "stem": "Gaya adalah?",
       "arah": "Pikirkan tarikan dan dorongan.", "petunjuk": "Mendorong meja.",
       "op": [["A", "Tarikan atau dorongan", true, "Itu pengertian gaya.", null], ["B", "Berat benda", false, "Berat adalah gaya gravitasi.", "X9W-GAYA"],
              ["C", "Massa benda", false, "Massa bukan gaya.", "X9W-GAYA"], ["D", "Kecepatan", false, "Kecepatan bukan gaya.", "X9W-GAYA"]]},
      {"pel": 1, "tujuan": "IPA8-G1", "peran": "POST_TEST", "tipe": "MCQ_SINGLE", "d": 0.3, "stem": "Satuan gaya adalah?",
       "arah": "Ingat nama ilmuwannya.", "petunjuk": "Diambil dari nama Isaac.",
       "op": [["A", "Kilogram", false, "Itu satuan massa.", "X9W-GAYA"], ["B", "Newton", true, "Satuan gaya adalah newton.", null],
              ["C", "Meter", false, "Itu satuan panjang.", "X9W-GAYA"], ["D", "Joule", false, "Itu satuan energi.", "X9W-GAYA"]]},
      {"pel": 1, "tujuan": "IPA8-G1", "peran": "POST_TEST", "tipe": "MCQ_SINGLE", "d": 0.4, "stem": "Gaya dapat mengubah?",
       "arah": "Ingat dua akibat gaya.", "petunjuk": "Bola ditendang.",
       "op": [["A", "Gerak dan bentuk benda", true, "Gaya mengubah gerak dan bentuk.", null], ["B", "Massa benda", false, "Massa tetap.", "X9W-GAYA"],
              ["C", "Warna benda", false, "Warna tidak berubah oleh gaya.", "X9W-GAYA"], ["D", "Jenis benda", false, "Jenis tetap.", "X9W-GAYA"]]}
    ], "batas_percobaan": 2, "simpan": "w18.bab2"
  }$j$::jsonb);
  r3 := dunia.bab($j${
    "sekolah": "boot.sekolah", "kelas": "w18.ang", "ta": "boot.ta", "penulis": "w18.guru", "peninjau": "w18.kaprodi", "admin": "w14.admin",
    "mapel": "IPA", "jenjang": "SMP", "tingkat": "Kelas 8", "judul": "Cahaya", "batas": 60,
    "pelajaran": [{"judul": "Sifat cahaya", "ringkas": "Cahaya merambat lurus.", "isi": "## Merambat lurus\n\nBayangan terbentuk karena cahaya merambat lurus."}],
    "salah_konsep": [["X9W-CAHAYA", "Cahaya dianggap berbelok sendiri", "Cahaya dianggap berbelok tanpa sebab.", "Cahaya merambat lurus kecuali dibiaskan."]],
    "tujuan": [{"pel": 1, "kode": "IPA8-L1", "pernyataan": "Menjelaskan sifat cahaya merambat lurus."}],
    "soal": [
      {"pel": 1, "tujuan": "IPA8-L1", "peran": "PRE_TEST", "tipe": "MCQ_SINGLE", "d": 0.3, "stem": "Mengapa bayangan terbentuk?",
       "arah": "Ingat sifat cahaya.", "petunjuk": "Cahaya terhalang benda.",
       "op": [["A", "Cahaya merambat lurus", true, "Benda menghalangi cahaya.", null], ["B", "Cahaya berbelok", false, "Cahaya merambat lurus.", "X9W-CAHAYA"],
              ["C", "Cahaya berwarna hitam", false, "Bayangan bukan cahaya hitam.", "X9W-CAHAYA"], ["D", "Cahaya memantul ke atas", false, "Bukan pemantulan.", "X9W-CAHAYA"]]},
      {"pel": 1, "tujuan": "IPA8-L1", "peran": "POST_TEST", "tipe": "MCQ_SINGLE", "d": 0.3, "stem": "Cahaya senter di ruang gelap terlihat?",
       "arah": "Bayangkan berkasnya.", "petunjuk": "Lurus atau berkelok?",
       "op": [["A", "Berkelok", false, "Cahaya merambat lurus.", "X9W-CAHAYA"], ["B", "Lurus", true, "Cahaya merambat lurus.", null],
              ["C", "Melingkar", false, "Cahaya merambat lurus.", "X9W-CAHAYA"], ["D", "Tidak terlihat sama sekali", false, "Berkasnya terlihat.", "X9W-CAHAYA"]]}
    ], "batas_percobaan": 2, "simpan": "w18.bab3"
  }$j$::jsonb);

  -- R2 first: Lukman (w18.murid10) sits it in 8R; his move to 8Q and his second sitting are a LATER MOMENT
  -- (12b-w18-pindah.sql, its own transaction: one transaction gives every sitting the same now(), and «the latest
  -- sitting» would then be decided by a random id)
  perform dunia.duduk('w18.murid10', (r2 ->> 'pa')::uuid);
  perform dunia.simpan('w18.sesi_pindah_lama', dunia.duduk('w18.murid10', (r2 ->> 'up')::uuid)::text);
  for n in 1..9 loop
    perform dunia.duduk('w18.murid' || n, (r2 ->> 'pa')::uuid);
    perform dunia.duduk('w18.murid' || n, (r2 ->> 'up')::uuid);
  end loop;

  -- R1: every learner, in their current class; the three objectives at 0.9, 0.7 and 0.4 (Lukman sits it after his
  -- move, in 12b-w18-pindah.sql)
  for n in 1..9 loop
    perform dunia.duduk('w18.murid' || n, (r1 ->> 'pa')::uuid);
    perform dunia.duduk('w18.murid' || n, (r1 ->> 'up')::uuid, array_remove(array[
      case when n = 1 then 'Organ pencernaan yang pertama dilalui makanan adalah?' end,
      case when n in (2, 3, 6) then 'Apa fungsi lambung?' end,
      case when n in (4, 5, 7, 8, 9, 10) then 'Di mana sari makanan diserap?' end], null));
  end loop;

  -- R3: three learners of 8P
  for n in 1..3 loop
    perform dunia.duduk('w18.murid' || n, (r3 ->> 'pa')::uuid);
    perform dunia.duduk('w18.murid' || n, (r3 ->> 'up')::uuid);
  end loop;
  raise notice 'dunia: W18 (IPA at the bootstrap: R1 shown in three bands, R2 withheld «moved», R3 withheld «learners», 8R under the minimum)';
end $$;
