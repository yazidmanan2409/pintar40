-- Ruling 79's audit world (track 3c), part 5: J2's learner, and the results W4, W5 and W6 (J2, J3).
--
-- Every result here is SAT, through the product's own functions, by the learner as themself (dunia.duduk:
-- start_learning_session, record_answer, finish_my_session). The Pemetaan Awal is sat first, as the product requires.
--   j2.murid      Hana Wirawan, 8A, by email, activated: W3 untouched (J2 starts at the beginning)
--   W4            «Statistika Dasar», given to 8A BEFORE the school set a pass mark; Hana has finished its Uji
--                 Penguasaan: a result with no verdict. A LEGACY STATE: the product now refuses such a gift
--                 (ASSIGN_PASS_MARK_MISSING), so it is written past that one guard (dunia.bab "warisan"; see 02-bab.sql)
--   W5            Rizky Ramadhan, 8A: W3's Uji Penguasaan finished, only the thin-evidence objective's question wrong
--                 (5 of 6; CDK8-3 is the one objective below the mark)
--   W6            Sinta Maharani, class 8B: the same chapter with an attempt limit of 1; 5 of 6 (83 %) against 60 %,
--                 with the must-be-right question missed. The teacher of 8B is not the approver: a retake is decided by
--                 the head of department (CAN_REVIEW_INTEGRITY), Lestari Handayani.

do $$ begin perform set_config('app.seed_intent', 'synthetic', true); end $$;

do $$
declare k8b uuid; w3 jsonb := dunia.ambil('w3.bab')::jsonb; w6 jsonb; w4 jsonb; spec jsonb;
begin
  perform dunia.jaga();

  -- 8B, its own teacher, and W3's chapter with an attempt limit of 1
  insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
  values (dunia.ambil('smp.sekolah')::uuid, dunia.ambil('smp.ang8')::uuid, 'CLASS', '8B', dunia.ambil('smp.ta')::uuid)
  returning id into k8b;
  insert into public.classes (node_id, subject, status) values (k8b, 'Matematika', 'ACTIVE');
  perform dunia.simpan('smp.kelas8b', k8b::text);
  perform dunia.staf('smp.guru8b', 'guru8b.cendekia@dunia.pintar.test', 'Sintetis-CendekiaGuru8B-55!', 'Wulan Puspitasari', 'EDUCATOR', k8b);
  spec := (dunia.ambil('w3.spec'))::jsonb || jsonb_build_object('kelas', 'smp.kelas8b', 'penulis', 'smp.guru8b',
            'judul', 'Persamaan Linear Satu Variabel (8B)', 'batas_percobaan', 1, 'simpan', 'w6.bab');
  w6 := dunia.bab(spec);

  -- the learners
  perform dunia.murid_email('j2.murid', 'hana.wirawan@dunia.pintar.test', 'Sintetis-HanaW-71!', 'Hana Wirawan',
                            'smp.sekolah', 'smp.ta', 'smp.prog', array['smp.ang8', 'smp.kelas8a'], 'smp.admin', true);
  perform dunia.murid_email('w5.murid', 'rizky.ramadhan@dunia.pintar.test', 'Sintetis-RizkyR-72!', 'Rizky Ramadhan',
                            'smp.sekolah', 'smp.ta', 'smp.prog', array['smp.ang8', 'smp.kelas8a'], 'smp.admin', true);
  perform dunia.murid_email('w6.murid', 'sinta.maharani@dunia.pintar.test', 'Sintetis-SintaM-73!', 'Sinta Maharani',
                            'smp.sekolah', 'smp.ta', 'smp.prog', array['smp.ang8', 'smp.kelas8b'], 'smp.admin', true);

  -- W5: the Pemetaan Awal, then the Uji Penguasaan with only CDK8-3's question wrong
  perform dunia.duduk('w5.murid', (w3 ->> 'pa')::uuid);
  perform dunia.simpan('w5.sesi', dunia.duduk('w5.murid', (w3 ->> 'up')::uuid,
    array['Harga 3 buku sama dengan Rp24.000. Jika harga satu buku b rupiah, persamaannya?'])::text);

  -- W6: 5 of 6 with the must-be-right question missed
  perform dunia.duduk('w6.murid', (w6 ->> 'pa')::uuid);
  perform dunia.simpan('w6.sesi', dunia.duduk('w6.murid', (w6 ->> 'up')::uuid, array['Berapakah x jika 2x + 3 = 11?'])::text);

  -- W4: a chapter given before a pass mark existed; Hana finishes it
  w4 := dunia.bab($j${
    "sekolah": "smp.sekolah", "kelas": "smp.kelas8a", "ta": "smp.ta",
    "penulis": "smp.guru8a", "peninjau": "smp.wakasek", "admin": "smp.admin",
    "mapel": "Matematika", "jenjang": "SMP", "tingkat": "Kelas 8", "judul": "Statistika Dasar", "batas": null, "warisan": true,
    "pelajaran": [{"judul": "Rata-rata", "ringkas": "Rata-rata adalah jumlah data dibagi banyak data.",
                   "isi": "## Menghitung rata-rata\n\nJumlahkan semua data, lalu bagi dengan banyaknya data."}],
    "salah_konsep": [["CDK-RATA", "Lupa membagi", "Jumlah data dianggap rata-rata.", "Setelah menjumlahkan, bagi dengan banyak data."]],
    "tujuan": [{"pel": 1, "kode": "CDK8-S1", "pernyataan": "Menghitung rata-rata sekumpulan data."}],
    "soal": [
      {"pel": 1, "tujuan": "CDK8-S1", "peran": "PRE_TEST", "tipe": "MCQ_SINGLE", "d": 0.3,
       "stem": "Rata-rata dari 2, 4 dan 6 adalah?", "arah": "Jumlahkan, lalu bagi.", "petunjuk": "Ada tiga data.",
       "op": [["A", "4", true, "12 dibagi 3.", null], ["B", "12", false, "Belum dibagi.", "CDK-RATA"],
              ["C", "6", false, "Itu data terbesar.", "CDK-RATA"], ["D", "3", false, "Itu banyak data.", "CDK-RATA"]]},
      {"pel": 1, "tujuan": "CDK8-S1", "peran": "POST_TEST", "tipe": "MCQ_SINGLE", "d": 0.4,
       "stem": "Rata-rata dari 3, 5, 7 dan 9 adalah?", "arah": "Jumlahkan, lalu bagi.", "petunjuk": "Ada empat data.",
       "op": [["A", "24", false, "Belum dibagi.", "CDK-RATA"], ["B", "6", true, "24 dibagi 4.", null],
              ["C", "4", false, "Itu banyak data.", "CDK-RATA"], ["D", "9", false, "Itu data terbesar.", "CDK-RATA"]]},
      {"pel": 1, "tujuan": "CDK8-S1", "peran": "POST_TEST", "tipe": "MCQ_SINGLE", "d": 0.5,
       "stem": "Rata-rata dari 10, 20 dan 30 adalah?", "arah": "Jumlahkan, lalu bagi.", "petunjuk": "Ada tiga data.",
       "op": [["A", "20", true, "60 dibagi 3.", null], ["B", "60", false, "Belum dibagi.", "CDK-RATA"],
              ["C", "30", false, "Itu data terbesar.", "CDK-RATA"], ["D", "3", false, "Itu banyak data.", "CDK-RATA"]]}
    ],
    "batas_percobaan": 2, "simpan": "w4.bab"
  }$j$::jsonb);
  perform dunia.duduk('j2.murid', (w4 ->> 'pa')::uuid);
  perform dunia.simpan('w4.sesi', dunia.duduk('j2.murid', (w4 ->> 'up')::uuid)::text);

  -- the states' own checks, against what the product recorded
  if (select pass_mark from public.assessment_assignments where id = (w4 ->> 'up')::uuid) is not null then
    raise exception 'W4: the chapter was meant to be given before any pass mark';
  end if;
  if (select count(*) from public.assessment_sessions where id in (dunia.ambil('w5.sesi')::uuid, dunia.ambil('w6.sesi')::uuid,
        dunia.ambil('w4.sesi')::uuid) and finalized_at is not null) <> 3 then
    raise exception 'W4/W5/W6: a sitting did not finish';
  end if;
  raise notice 'dunia: W4 (no pass mark, Hana finished), W5 (only CDK8-3 wrong), W6 (83 %%, must-be-right missed, 8B, limit 1)';
end $$;
