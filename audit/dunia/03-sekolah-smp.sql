-- Ruling 79's audit world (track 3c), part 3: SMP Sintetis Cendekia (WIB) and W3, the core chapter.
--
-- W3 (Daisy's §3): a school year with a sealed pass mark of 60; a chapter with 3 lessons, Pemetaan Awal, and a
-- certifying Uji Penguasaan of at least 6 items: single- and multi-answer, one must-be-right item, at least 2
-- objectives with at least 2 items each, plus 1 objective with 1 item (thin evidence). Multi-answer items are allowed
-- in assessments (ruling 88).
--
-- The Uji Penguasaan, exactly (every POST_TEST question is on the paper, so it is the same after every reset):
--   CDK8-1 (lesson 1): 2 items, one of them multi-answer
--   CDK8-2 (lesson 2): 3 items, one multi-answer, one MUST-BE-RIGHT (is_safety_critical)
--   CDK8-3 (lesson 3): 1 item: the thin-evidence objective
-- The Pemetaan Awal: one item per objective. Each lesson carries one practice question for the stepwise help.
--
-- People: staff by email (Admin sekolah, Kepala sekolah, Wakasek kurikulum, Guru 8A). Learners join with the states
-- that need them (04-...).

do $$ begin perform set_config('app.seed_intent', 'synthetic', true); end $$;

do $$
declare sekolah uuid; ta uuid; fak uuid; dep uuid; prog uuid; ang8 uuid; k8a uuid;
begin
  perform dunia.jaga();
  insert into public.institutions (name, slug, is_synthetic, namespace)
  values ('SMP Sintetis Cendekia', 'dunia-smp-cendekia', true, 'CDK') returning id into sekolah;
  perform dunia.simpan('smp.sekolah', sekolah::text);
  perform dunia.sebagai('pintar.admin1');
  perform public.atur_zona_waktu_sekolah(sekolah, 'Asia/Jakarta');   -- WIB
  perform dunia.sebagai(null);
  insert into public.academic_periods (institution_id, name, starts_on, ends_on)
  values (sekolah, dunia.ta_nama(), dunia.ta_mulai(), dunia.ta_selesai()) returning id into ta;
  perform dunia.simpan('smp.ta', ta::text);
  insert into public.org_nodes (institution_id, parent_id, kind, name) values (sekolah, sekolah, 'FACULTY', 'Sekolah Menengah Pertama') returning id into fak;
  insert into public.org_nodes (institution_id, parent_id, kind, name) values (sekolah, fak, 'DEPARTMENT', 'Matematika') returning id into dep;
  insert into public.org_nodes (institution_id, parent_id, kind, name) values (sekolah, dep, 'PROGRAMME', 'SMP Reguler') returning id into prog;
  insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
  values (sekolah, prog, 'COHORT', 'Kelas 8 — 2026/27', ta) returning id into ang8;
  insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
  values (sekolah, ang8, 'CLASS', '8A', ta) returning id into k8a;
  insert into public.classes (node_id, subject, status) values (k8a, 'Matematika', 'ACTIVE');
  perform dunia.simpan('smp.prog', prog::text);
  perform dunia.simpan('smp.ang8', ang8::text);
  perform dunia.simpan('smp.kelas8a', k8a::text);

  perform dunia.staf('smp.admin',   'admin.cendekia@dunia.pintar.test',   'Sintetis-CendekiaAdmin-51!',  'Yohana Simatupang', 'INSTITUTION_ADMIN',  sekolah);
  perform dunia.staf('smp.kepala',  'kepala.cendekia@dunia.pintar.test',  'Sintetis-CendekiaKepala-52!', 'Bambang Prasetyo',  'DEAN',               sekolah);
  perform dunia.staf('smp.wakasek', 'wakasek.cendekia@dunia.pintar.test', 'Sintetis-CendekiaWakasek-53!','Lestari Handayani', 'HEAD_OF_DEPARTMENT', dep);
  perform dunia.staf('smp.guru8a',  'guru8a.cendekia@dunia.pintar.test',  'Sintetis-CendekiaGuru-54!',   'Dimas Saputra',     'EDUCATOR',           k8a);
end $$;

-- W3: the core chapter, given to 8A. Its spec is kept (w3.spec), so a state that needs the same chapter elsewhere
-- (W6's class with an attempt limit of 1) builds it from the same words.
do $$
declare spec jsonb := $j${
    "sekolah": "smp.sekolah", "kelas": "smp.kelas8a", "ta": "smp.ta",
    "penulis": "smp.guru8a", "peninjau": "smp.wakasek", "admin": "smp.admin",
    "mapel": "Matematika", "jenjang": "SMP", "tingkat": "Kelas 8", "judul": "Persamaan Linear Satu Variabel",
    "batas": 60, "batas_alasan": "Batas ketuntasan SMP Cendekia (dunia audit, W3)",
    "pelajaran": [
      {"judul": "Kalimat Terbuka dan Persamaan", "ringkas": "Persamaan adalah kalimat terbuka yang memakai tanda sama dengan.",
       "isi": "## Kalimat terbuka\n\nKalimat terbuka memuat variabel, sehingga benar atau salahnya belum diketahui.\n\n## Persamaan\n\nPersamaan linear satu variabel memuat satu variabel berpangkat satu, misalnya x + 3 = 7.",
       "contoh": [{"judul": "Contoh: apakah x + 4 = 9 persamaan linear satu variabel?", "langkah": ["Cari tanda sama dengan: ada, jadi ini persamaan.", "Hitung variabelnya: hanya x, jadi satu variabel.", "Lihat pangkat x: pangkatnya satu, jadi linear.", "Jadi x + 4 = 9 adalah persamaan linear satu variabel."]}]},
      {"judul": "Menyelesaikan Persamaan", "ringkas": "Kedua ruas diberi operasi yang sama sampai variabelnya sendirian.",
       "isi": "## Operasi yang sama di kedua ruas\n\nUntuk menyelesaikan 2x + 3 = 11, kurangi kedua ruas dengan 3, lalu bagi kedua ruas dengan 2.\n\n## Memeriksa jawaban\n\nSubstitusikan nilai x ke persamaan awal."},
      {"judul": "Persamaan dalam Soal Cerita", "ringkas": "Soal cerita diubah dulu menjadi persamaan.",
       "isi": "## Dari cerita ke persamaan\n\nTentukan apa yang dicari sebagai variabel, lalu tuliskan hubungannya dengan tanda sama dengan."}
    ],
    "salah_konsep": [
      ["CDK-RUAS", "Hanya satu ruas yang diubah", "Operasi diberikan pada satu ruas saja.", "Ingat timbangan: apa yang dilakukan pada satu sisi dilakukan juga pada sisi lain."],
      ["CDK-TANDA", "Tanda tidak berubah saat pindah ruas", "Suku dipindah ruas tanpa mengubah operasinya.", "Pindah ruas berarti melakukan operasi kebalikan pada kedua ruas."],
      ["CDK-VAR", "Variabel dianggap angka tetap", "Belum melihat bahwa variabel mewakili bilangan yang dicari.", "Ganti variabel dengan beberapa bilangan dan periksa mana yang membuat kalimat benar."],
      ["CDK-CERITA", "Salah memilih yang dicari", "Variabel dipakai untuk besaran yang sudah diketahui.", "Garis bawahi apa yang ditanyakan sebelum menulis persamaan."]
    ],
    "tujuan": [
      {"pel": 1, "kode": "CDK8-1", "pernyataan": "Mengenali persamaan linear satu variabel."},
      {"pel": 2, "kode": "CDK8-2", "pernyataan": "Menyelesaikan persamaan linear satu variabel."},
      {"pel": 3, "kode": "CDK8-3", "pernyataan": "Menyusun persamaan dari soal cerita."}
    ],
    "soal": [
      {"pel": 1, "tujuan": "CDK8-1", "peran": "PRE_TEST", "tipe": "MCQ_SINGLE", "d": 0.3,
       "stem": "Manakah yang merupakan persamaan linear satu variabel?",
       "arah": "Cari tanda sama dengan dan satu variabel berpangkat satu.", "petunjuk": "Periksa pangkat variabelnya.",
       "op": [["A", "x + 4 = 9", true, "Satu variabel, pangkat satu, ada tanda sama dengan.", null],
              ["B", "x² = 16", false, "Pangkat variabelnya dua.", "CDK-VAR"],
              ["C", "x + y = 5", false, "Ada dua variabel.", "CDK-VAR"],
              ["D", "3 + 4 = 7", false, "Tidak ada variabelnya.", "CDK-VAR"]]},
      {"pel": 2, "tujuan": "CDK8-2", "peran": "PRE_TEST", "tipe": "MCQ_SINGLE", "d": 0.4,
       "stem": "Berapakah x jika x + 5 = 12?",
       "arah": "Kurangi kedua ruas dengan bilangan yang sama.", "petunjuk": "Kurangi kedua ruas dengan 5.",
       "op": [["A", "17", false, "Itu menjumlahkan, bukan mengurangi.", "CDK-TANDA"], ["B", "7", true, "12 dikurangi 5.", null],
              ["C", "5", false, "Itu bilangan pada soal.", "CDK-VAR"], ["D", "12", false, "Ruas kanan belum diubah.", "CDK-RUAS"]]},
      {"pel": 3, "tujuan": "CDK8-3", "peran": "PRE_TEST", "tipe": "MCQ_SINGLE", "d": 0.5,
       "stem": "Umur Rani 3 tahun lebih tua dari Sita yang berumur s tahun. Umur Rani 15 tahun. Persamaannya?",
       "arah": "Tulis umur Rani dengan s.", "petunjuk": "Lebih tua berarti ditambah.",
       "op": [["A", "s + 3 = 15", true, "Umur Sita ditambah 3 sama dengan 15.", null], ["B", "s − 3 = 15", false, "Lebih tua berarti ditambah.", "CDK-TANDA"],
              ["C", "3s = 15", false, "Bukan tiga kali lipat.", "CDK-CERITA"], ["D", "s = 15", false, "15 adalah umur Rani.", "CDK-CERITA"]]},

      {"pel": 1, "tujuan": "CDK8-1", "peran": "POST_TEST", "tipe": "MCQ_SINGLE", "d": 0.4,
       "stem": "Pada persamaan 3x − 2 = 10, manakah variabelnya?",
       "arah": "Variabel adalah huruf yang mewakili bilangan.", "petunjuk": "Cari hurufnya.",
       "op": [["A", "3", false, "Itu koefisien.", "CDK-VAR"], ["B", "x", true, "Huruf yang mewakili bilangan yang dicari.", null],
              ["C", "10", false, "Itu konstanta.", "CDK-VAR"], ["D", "−2", false, "Itu konstanta.", "CDK-VAR"]]},
      {"pel": 1, "tujuan": "CDK8-1", "peran": "POST_TEST", "tipe": "MCQ_MULTI", "d": 0.5,
       "stem": "Pilih SEMUA yang merupakan persamaan linear satu variabel.",
       "arah": "Periksa satu per satu: satu variabel, pangkat satu, tanda sama dengan.", "petunjuk": "Ada lebih dari satu jawaban.",
       "op": [["A", "2p + 1 = 9", true, "Satu variabel berpangkat satu.", null], ["B", "y − 4 = 0", true, "Satu variabel berpangkat satu.", null],
              ["C", "a² + 1 = 5", false, "Pangkatnya dua.", "CDK-VAR"], ["D", "m + n = 8", false, "Dua variabel.", "CDK-VAR"]]},
      {"pel": 2, "tujuan": "CDK8-2", "peran": "POST_TEST", "tipe": "MCQ_SINGLE", "wajib_tepat": true, "d": 0.5,
       "stem": "Berapakah x jika 2x + 3 = 11?",
       "arah": "Kurangi dulu, lalu bagi.", "petunjuk": "Kurangi kedua ruas dengan 3, lalu bagi dengan 2.",
       "op": [["A", "4", true, "2x = 8, jadi x = 4.", null], ["B", "7", false, "Belum dibagi 2.", "CDK-RUAS"],
              ["C", "8", false, "Itu nilai 2x.", "CDK-RUAS"], ["D", "14", false, "3 ditambahkan, bukan dikurangkan.", "CDK-TANDA"]]},
      {"pel": 2, "tujuan": "CDK8-2", "peran": "POST_TEST", "tipe": "MCQ_SINGLE", "d": 0.6,
       "stem": "Berapakah y jika 5y − 4 = 21?",
       "arah": "Tambahkan dulu, lalu bagi.", "petunjuk": "Tambahkan 4 pada kedua ruas.",
       "op": [["A", "3,4", false, "4 dikurangkan, bukan ditambahkan.", "CDK-TANDA"], ["B", "25", false, "Belum dibagi 5.", "CDK-RUAS"],
              ["C", "5", true, "5y = 25, jadi y = 5.", null], ["D", "17", false, "Ruas kanan dikurangi 4.", "CDK-TANDA"]]},
      {"pel": 2, "tujuan": "CDK8-2", "peran": "POST_TEST", "tipe": "MCQ_MULTI", "d": 0.6,
       "stem": "Pilih SEMUA langkah yang benar untuk menyelesaikan 4x − 8 = 12.",
       "arah": "Setiap langkah dikenakan pada kedua ruas.", "petunjuk": "Ada lebih dari satu jawaban.",
       "op": [["A", "Tambahkan 8 pada kedua ruas: 4x = 20", true, "Operasi sama pada kedua ruas.", null],
              ["B", "Bagi kedua ruas dengan 4: x = 5", true, "Langkah berikutnya, kedua ruas.", null],
              ["C", "Kurangi 8 dari ruas kanan saja: 4x = 4", false, "Hanya satu ruas.", "CDK-RUAS"],
              ["D", "Bagi ruas kiri saja dengan 4: x − 8 = 12", false, "Hanya satu ruas.", "CDK-RUAS"]]},
      {"pel": 3, "tujuan": "CDK8-3", "peran": "POST_TEST", "tipe": "MCQ_SINGLE", "d": 0.6,
       "stem": "Harga 3 buku sama dengan Rp24.000. Jika harga satu buku b rupiah, persamaannya?",
       "arah": "Tiga buku berarti tiga kali harga satu buku.", "petunjuk": "Kalikan, bukan tambahkan.",
       "op": [["A", "b + 3 = 24.000", false, "Tiga buku berarti dikali.", "CDK-CERITA"], ["B", "3b = 24.000", true, "Tiga kali harga satu buku.", null],
              ["C", "b = 3 × 24.000", false, "Yang dicari harga satu buku.", "CDK-CERITA"], ["D", "b − 3 = 24.000", false, "Tiga buku berarti dikali.", "CDK-TANDA"]]},

      {"pel": 1, "tujuan": "CDK8-1", "peran": null, "tipe": "MCQ_SINGLE", "d": 0.3,
       "stem": "Latihan: manakah yang merupakan kalimat terbuka?",
       "arah": "Kalimat terbuka memuat variabel.", "petunjuk": "Cari yang memuat huruf.",
       "op": [["A", "7 + 2 = 9", false, "Tidak memuat variabel.", "CDK-VAR"], ["B", "n + 2 = 9", true, "Memuat variabel n.", null],
              ["C", "7 + 2 = 10", false, "Tidak memuat variabel.", "CDK-VAR"], ["D", "9 = 9", false, "Tidak memuat variabel.", "CDK-VAR"]]},
      {"pel": 2, "tujuan": "CDK8-2", "peran": null, "tipe": "MCQ_SINGLE", "d": 0.4,
       "stem": "Latihan: berapakah x jika x − 6 = 4?",
       "arah": "Tambahkan bilangan yang sama pada kedua ruas.", "petunjuk": "Tambahkan 6 pada kedua ruas.",
       "op": [["A", "−2", false, "6 dikurangkan, bukan ditambahkan.", "CDK-TANDA"], ["B", "10", true, "4 ditambah 6.", null],
              ["C", "4", false, "Ruas kanan belum diubah.", "CDK-RUAS"], ["D", "24", false, "Bukan perkalian.", "CDK-TANDA"]]},
      {"pel": 3, "tujuan": "CDK8-3", "peran": null, "tipe": "MCQ_SINGLE", "d": 0.5,
       "stem": "Latihan: sebuah bilangan ditambah 7 hasilnya 20. Persamaannya?",
       "arah": "Tulis bilangan itu sebagai variabel.", "petunjuk": "Ditambah 7 sama dengan 20.",
       "op": [["A", "n + 7 = 20", true, "Bilangan ditambah 7 sama dengan 20.", null], ["B", "7n = 20", false, "Bukan perkalian.", "CDK-CERITA"],
              ["C", "n = 7 + 20", false, "Hubungannya tertukar.", "CDK-CERITA"], ["D", "n − 7 = 20", false, "Ditambah, bukan dikurang.", "CDK-TANDA"]]}
    ],
    "batas_percobaan": 2, "simpan": "w3.bab"
  }$j$::jsonb;
begin
  perform dunia.simpan('w3.spec', spec::text);
  perform dunia.bab(spec);
end $$;

-- W3's own checks: the Uji Penguasaan's paper is what Daisy named
do $$
declare b jsonb := dunia.ambil('w3.bab')::jsonb; v_up int; v_multi int; v_wajib int; v_tipis int;
begin
  select count(*), count(*) filter (where i.item_type = 'MCQ_MULTI'), count(*) filter (where i.is_safety_critical)
    into v_up, v_multi, v_wajib
    from public.items i join public.lessons l on l.id = i.lesson_id join public.modules m on m.id = l.module_id
   where m.course_id = (b ->> 'kursus')::uuid and i.cycle_role = 'POST_TEST';
  select count(*) into v_tipis from public.items i
   where i.cycle_role = 'POST_TEST' and (b -> 'tujuan' ->> 'CDK8-3')::uuid = any (i.objective_ids);
  if v_up < 6 or v_multi < 1 or v_wajib <> 1 or v_tipis <> 1 then
    raise exception 'W3: the Uji Penguasaan is not as named (items %, multi %, must-be-right %, thin objective items %)', v_up, v_multi, v_wajib, v_tipis;
  end if;
  if (select pass_mark from public.assessment_assignments where id = (b ->> 'up')::uuid) is distinct from 0.60 then
    raise exception 'W3: the Uji Penguasaan is not sealed at 60';
  end if;
  raise notice 'dunia: W3 «Persamaan Linear Satu Variabel»: Uji Penguasaan % items (% multi, 1 must-be-right, thin CDK8-3), sealed at 60', v_up, v_multi;
end $$;
