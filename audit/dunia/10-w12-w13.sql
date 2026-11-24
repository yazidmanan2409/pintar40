-- Ruling 79's audit world (track 3c), part 10: W12 and W13 (J6, authoring with AI drafts).
--
--   W12  SMP Sintetis Cendekia is entitled to AI drafting, and its 8A teacher holds a draft package, «Perbandingan dan
--        Skala» (as an upload leaves it: INGESTED, two lessons with their objectives, three questions of her own).
--        The provider is C3w-1's LOCAL STAND-IN, labelled as such everywhere it is named: «penyedia lokal (stand-in),
--        bukan penyedia AI nyata». It answers only under PINTAR_AI_STUB_HARNESS=1 (src/lib/ai/pilih-penyedia.ts), which
--        the capture's app sets; it is not stubbed by the harness. No real provider is called, ever.
--        THE ALLOWANCE IS NEAR ITS END: a request reserves its worst case first (ai_cadangkan: 4000 out + 8000 prompt +
--        one per excerpt character, at a price of 1), and the school's allowance is 14,500. So one request with a short
--        excerpt (up to about 2,000 characters) is admitted, and a long excerpt, or a second request once the first
--        has settled, is refused AI_JATAH_HABIS: J6's «the allowance used up» branch, reached through the screens.
--        The platform ceiling and the option's ceiling stand well above it (J6's ceiling branch is staged by the
--        operator at capture time, and recorded there).
--   W13  SD Sintetis Melati has NO entitlement row (D7: unset is never unlimited), and its 4A teacher holds a draft
--        package too, «Bangun Datar», so the absent AI button is seen on a real package.
-- The entitlement rows are operator-written (C3w-1: no client role reads or writes them), as here.

do $$ begin perform set_config('app.seed_intent', 'synthetic', true); end $$;

do $$
declare o uuid; w12 jsonb; w13 jsonb;
begin
  perform dunia.jaga();
  insert into public.ai_opsi (kunci, nama_tampilan, model_ident, harga_dasar, status, plafon_biaya, henti_keras_terverifikasi)
  values ('penyedia-lokal', 'penyedia lokal (stand-in), bukan penyedia AI nyata', 'stub-lokal',
          '{"masuk": 1, "keluar": 1}'::jsonb, 'QUALIFIED', 1000000, true) returning id into o;
  insert into public.ai_plafon_platform (plafon, berhenti) values (1000000, false);
  insert into public.ai_hak_sekolah (sekolah, opsi, aktif, jatah, batas_per_pendidik, mulai, berakhir)
  values (dunia.ambil('smp.sekolah')::uuid, o, true, 14500, null, now() - interval '30 days', null);
  perform dunia.simpan('w12.opsi', o::text);

  w12 := dunia.bab($j${
    "sekolah": "smp.sekolah", "kelas": "smp.kelas8a", "ta": "smp.ta",
    "penulis": "smp.guru8a", "peninjau": "smp.wakasek", "admin": "smp.admin", "tahap": "draf",
    "mapel": "Matematika", "jenjang": "SMP", "tingkat": "Kelas 8", "judul": "Perbandingan dan Skala",
    "pelajaran": [
      {"judul": "Perbandingan senilai", "ringkas": "Dua besaran senilai bertambah bersama dengan faktor yang sama.",
       "isi": "## Perbandingan senilai\n\nJika 2 buku harganya Rp10.000, maka 4 buku harganya Rp20.000. Banyak buku dan harga bertambah dengan faktor yang sama.\n\n## Menyelesaikan soal\n\nTuliskan perbandingannya, lalu kalikan kedua ruas dengan faktor yang sama."},
      {"judul": "Skala pada peta", "ringkas": "Skala 1 : 100.000 berarti 1 cm di peta sama dengan 100.000 cm sebenarnya.",
       "isi": "## Membaca skala\n\nSkala 1 : 100.000 berarti setiap 1 cm di peta mewakili 100.000 cm, yaitu 1 km, di tempat sebenarnya.\n\n## Menghitung jarak sebenarnya\n\nKalikan jarak di peta dengan penyebut skala, lalu ubah satuannya."}
    ],
    "salah_konsep": [["CDK-SKALA", "Satuan tidak diubah", "Hasil dalam cm dibaca sebagai km.", "Ubah cm ke km: bagi dengan 100.000."],
                     ["CDK-SENILAI", "Faktor hanya pada satu besaran", "Hanya satu besaran yang dikalikan.", "Kalikan kedua besaran dengan faktor yang sama."]],
    "tujuan": [{"pel": 1, "kode": "CDK8-P1", "pernyataan": "Menyelesaikan masalah perbandingan senilai."},
               {"pel": 2, "kode": "CDK8-P2", "pernyataan": "Menghitung jarak sebenarnya dari skala peta."}],
    "soal": [
      {"pel": 1, "tujuan": "CDK8-P1", "peran": "PRE_TEST", "tipe": "MCQ_SINGLE", "d": 0.3,
       "stem": "Harga 2 pensil Rp6.000. Berapa harga 6 pensil?", "arah": "Cari faktornya dulu.", "petunjuk": "6 adalah 3 kali 2.",
       "op": [["A", "Rp18.000", true, "Faktornya 3.", null], ["B", "Rp12.000", false, "Faktornya 3, bukan 2.", "CDK-SENILAI"],
              ["C", "Rp6.000", false, "Harganya ikut bertambah.", "CDK-SENILAI"], ["D", "Rp36.000", false, "Faktornya 3, bukan 6.", "CDK-SENILAI"]]},
      {"pel": 2, "tujuan": "CDK8-P2", "peran": "POST_TEST", "tipe": "MCQ_SINGLE", "d": 0.5,
       "stem": "Pada peta berskala 1 : 100.000, jarak dua kota 5 cm. Berapa jarak sebenarnya?", "arah": "Kalikan, lalu ubah satuan.", "petunjuk": "1 km = 100.000 cm.",
       "op": [["A", "5 km", true, "5 × 100.000 cm = 5 km.", null], ["B", "500.000 km", false, "Satuannya masih cm.", "CDK-SKALA"],
              ["C", "50 km", false, "Hitung ulang perkaliannya.", "CDK-SKALA"], ["D", "0,5 km", false, "Hitung ulang perkaliannya.", "CDK-SKALA"]]},
      {"pel": 1, "tujuan": "CDK8-P1", "peran": "POST_TEST", "tipe": "MCQ_SINGLE", "d": 0.4,
       "stem": "3 kg beras harganya Rp45.000. Berapa harga 5 kg?", "arah": "Cari harga 1 kg dulu.", "petunjuk": "Rp45.000 dibagi 3.",
       "op": [["A", "Rp75.000", true, "Rp15.000 × 5.", null], ["B", "Rp60.000", false, "Harga 1 kg Rp15.000.", "CDK-SENILAI"],
              ["C", "Rp90.000", false, "Itu harga 6 kg.", "CDK-SENILAI"], ["D", "Rp50.000", false, "Harga 1 kg Rp15.000.", "CDK-SENILAI"]]}
    ],
    "batas_percobaan": 2, "simpan": "w12.paket"
  }$j$::jsonb);

  w13 := dunia.bab($j${
    "sekolah": "sd.sekolah", "kelas": "sd.kelas4a", "ta": "sd.ta",
    "penulis": "sd.guru4a", "peninjau": "sd.wakasek", "admin": "sd.admin", "tahap": "draf",
    "mapel": "Matematika", "jenjang": "SD", "tingkat": "Kelas 4", "judul": "Bangun Datar",
    "pelajaran": [{"judul": "Persegi dan persegi panjang", "ringkas": "Persegi punya empat sisi sama panjang.",
                   "isi": "## Mengenal persegi\n\nPersegi punya empat sisi yang sama panjang dan empat sudut siku-siku."}],
    "salah_konsep": [["MLT-SISI", "Sisi tertukar", "Persegi panjang dianggap persegi.", "Bandingkan panjang setiap sisi."]],
    "tujuan": [{"pel": 1, "kode": "MLT4-B1", "pernyataan": "Mengenali persegi dari sisinya."}],
    "soal": [
      {"pel": 1, "tujuan": "MLT4-B1", "peran": "PRE_TEST", "tipe": "MCQ_SINGLE", "d": 0.2,
       "stem": "Bangun mana yang keempat sisinya sama panjang?", "arah": "Bandingkan sisinya.", "petunjuk": "Ukur setiap sisi.",
       "op": [["A", "Persegi", true, "Keempat sisinya sama.", null], ["B", "Persegi panjang", false, "Dua sisinya lebih panjang.", "MLT-SISI"],
              ["C", "Segitiga", false, "Segitiga punya tiga sisi.", "MLT-SISI"], ["D", "Trapesium", false, "Sisinya tidak sama.", "MLT-SISI"]]},
      {"pel": 1, "tujuan": "MLT4-B1", "peran": "POST_TEST", "tipe": "MCQ_SINGLE", "d": 0.2,
       "stem": "Berapa banyak sisi persegi?", "arah": "Hitung sisinya.", "petunjuk": "Lihat gambarnya.",
       "op": [["A", "4", true, "Persegi punya empat sisi.", null], ["B", "3", false, "Itu segitiga.", "MLT-SISI"],
              ["C", "5", false, "Hitung lagi sisinya.", "MLT-SISI"], ["D", "6", false, "Hitung lagi sisinya.", "MLT-SISI"]]}
    ],
    "batas_percobaan": 2, "simpan": "w13.paket"
  }$j$::jsonb);

  -- the states' own checks: the entitlement as the product reads it, as each teacher
  perform dunia.sebagai('smp.guru8a');
  if not public.ai_tersedia((w12 ->> 'kursus')::uuid) then raise exception 'W12: AI drafting is not available on the package'; end if;
  perform dunia.sebagai('sd.guru4a');
  if public.ai_tersedia((w13 ->> 'kursus')::uuid) then raise exception 'W13: the school was meant to have no entitlement'; end if;
  perform dunia.sebagai(null);
  if (select status::text from public.courses where id = (w12 ->> 'kursus')::uuid) <> 'INGESTED' then
    raise exception 'W12: the package is not a draft';
  end if;
  raise notice 'dunia: W12 (Cendekia entitled, allowance 14,500 near its end, a draft package), W13 (Melati, no entitlement, a draft package)';
end $$;
