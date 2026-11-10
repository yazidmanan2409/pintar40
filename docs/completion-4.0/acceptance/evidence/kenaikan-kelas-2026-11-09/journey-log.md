
## Phase 1 — schools and administrators (2026-11-09T09:36:52.131Z)
OPERATOR SQL: schools A=d9ceed7c-0632-4d3c-aabb-5eca92bc7353 B=668c76a9-f9c2-4494-8620-b8c916f7054c, each with academic period 2026/2027
platform admin signed in, at /
Aktivasi «Orang baru di luar pendataan» Admin Demo Kenaikan: "Admin Demo Kenaikan · Akun dibuat untuk alamat admin.naik@demo-rollover.pintar.test PINTAR tidak mengirim email ke orang ini sekarang. Beri dulu perannya di Konfigurasi. Lalu minta orang ini membuka 127.0.0.1:3999/aktifkan, dan mengetik alamat email ini. Kode aktivasi dikirim saat itu."
«Menunjuk admin sekolah pertama» Admin Demo Kenaikan at SD Sintetis Kenaikan: {"hasil":"ok","kode":"ROLE_GRANTED"}
Aktivasi «Orang baru di luar pendataan» Admin Demo Penerima: "Admin Demo Penerima · Akun dibuat untuk alamat admin.terima@demo-rollover.pintar.test PINTAR tidak mengirim email ke orang ini sekarang. Beri dulu perannya di Konfigurasi. Lalu minta orang ini membuka 127.0.0.1:3999/aktifkan, dan mengetik alamat email ini. Kode aktivasi dikirim saat itu."
«Menunjuk admin sekolah pertama» Admin Demo Penerima at SD Sintetis Penerima: {"hasil":"ok","kode":"ROLE_GRANTED"}
Admin Demo Kenaikan activated by emailed code, landed /konfigurasi
Admin Demo Penerima activated by emailed code, landed /konfigurasi

## Phase 2 — structure and people (2026-11-09T09:38:23.118Z)
A: school code on Pendataan: DKN
A: Struktur sekolah: Bagian «Kelas Tinggi», Tingkat «Kelas 5» (2026/2027)=448c1b12-45ee-4616-896b-b9ff068a0f66, Kelas «Kelas 5A»=2d985509-ebb5-4887-9242-4358adc5da99
A: Pendataan recorded: Murid Demo Dua:PENDING, Murid Demo Empat:PENDING, Murid Demo Enam:PENDING, Murid Demo Lima:PENDING, Murid Demo Satu:PENDING, Murid Demo Tiga:PENDING, Murid Demo Tujuh:PENDING
A: Guru recorded, account by email, «Berikan peran» Guru at Kelas 5A: {"hasil":"ok","kode":"ROLE_GRANTED"}
card sign-in Murid Demo Satu: landed /belajar
card sign-in Murid Demo Enam: landed /belajar
card sign-in Murid Demo Tujuh: landed /belajar
A enrolments now: Murid Demo Dua:PENDING, Murid Demo Empat:PENDING, Murid Demo Enam:ACTIVE, Murid Demo Lima:PENDING, Murid Demo Satu:ACTIVE, Murid Demo Tiga:PENDING, Murid Demo Tujuh:ACTIVE
Guru activated, landed /mengajar
B: code DPN; Tingkat «Kelas 6» (2027/2028)=ed04db0e-6c47-48de-a529-f17e85c3aaa6, Kelas «Kelas 6B»=54f7424f-26bb-4f05-afb2-5fabf0540bbb; periods: 2026/2027, 2027/2028

## Phase 3 — evidence in Kelas 5A 2026/2027 (2026-11-09T09:41:15.318Z)
platform admin grants the library package: ?bagian=izin-beri&hasil=ok&kode=DISTRIBUTION_GRANTED
Batas ketuntasan does not list the course: Nilai minimum kelulusan setiap pelajaran di sekolah ini, dalam persen bulat dari 0 sampai 100. Guru baru bisa menyediakan sebuah pelajaran untuk kelas setelah batasnya ditetapkan. Perubahan berlaku untuk pelajaran yang disediakan sesudahnya; hasil dan sertifikat yang sudah ada tidak berubah. Penguku
Guru «Sediakan» to Kelas 5A: ?terbitan=3182629b-4517-447d-baf6-60fb67a6a890&kode=ASSIGN_PRE_TEST_MISSING&mulai=2026-11-09&sampai=2026-12-09; learning_assignment=

## Phase 4 — 2027/2028 structure (2026-11-09T09:43:57.633Z)
A: 2027/2028: Tingkat Kelas 6=03a286a5-3295-44a4-bad3-3be2e47e4d28, Kelas 6A=249eb764-e072-4f8b-8a4a-2a7e5f8d1a17, Kelas 6Z=e7604bc9-dfd2-4d02-9359-76c15bb6df88, Tingkat Kelas 5=4a92e707-27a0-410a-9f84-b7339a31dbb8, Kelas 5A=183c63b1-15fd-421b-8d9e-548445d615e3
A periods: 2026/2027 (a99728a9-cc6f-419f-8e86-082751ebb7f7), 2027/2028 (b5b425ee-5333-492a-a9d9-66e6b7d271c5)
Kelas 6Z active after «Nonaktifkan»: f
Pendataan places offered: ["Tidak dipakai","nama","Kelas Tinggi","Kelas Tinggi · Kelas 5 · 2026/2027","Kelas Tinggi · Kelas 5 · Kelas 5A · 2026/2027","Kelas Tinggi · Kelas 5 · 2027/2028","Kelas Tinggi · Kelas 5 · Kelas 5A · 2027/2028","Kelas Tinggi · Kelas 6 · 2027/2028","Kelas Tinggi · Kelas 6 · Kelas 6A · 2027/2028"]
Delapan recorded at «Kelas Tinggi · Kelas 5 · 2026/2027»: COHORT Kelas 5

## Phase 5 — transfer (2026-11-09T09:45:21.823Z)
A «Perpindahan murid» opens: "Belum ada. Ajukan perpindahan ke sekolah lain Cari sekolah tujuan dengan nama lengkapnya atau kodenya. Sekolah tujuan yang menerima perpindahan dan memilih tahun ajarannya. Nama lengkap atau kode sekolah tujuan Cari sekolah"
A searches «SD Sintetis Penerima»; destinations: ["SD Sintetis Penerima (DPN)"]; learners offered: ["—","Murid Demo Tujuh · 2026/2027","Murid Demo Enam · 2026/2027","Murid Demo Satu · 2026/2027"]
A «Ajukan perpindahan» → ?bagian=transfers&hasil=ok&kode=TRANSFER_REQUESTED; screen: "Murid Demo Enam · SD Sintetis Kenaikan → —Diajukan Keluarga pindah domisili (sintetis) Belum diterima sekolah tujuan. Sekolah itu yang memilih tahun ajarannya. Tolak · Murid Demo Enam Menampilkan 1–1 perpindahan Sebelumnya Halaman 1 Berikutnya Ajukan perpindahan ke sekolah lain Cari sekolah tujuan dengan nama lengkapnya atau kodenya. Sekolah tujuan yang menerima perpindahan dan memilih tahun ajarannya. Nama lengkap atau kode sekolah tujuan Cari sekolah ✓Selesai. Perpindahan diajukan dan kini men"
B sees: "Murid Demo Enam · — → SD Sintetis PenerimaDiajukan Keluarga pindah domisili (sintetis) Tolak · Murid Demo Enam Menampilkan 1–1 perpindahan Sebelumnya Halaman 1 Berikutnya Permintaan pindah masuk Murid Demo Enam · dari SD Sintetis Kenaikan (DKN) Keluarga pindah domisili (sintetis) Tahun ajaran di sekolah ini — 2026/2027 2027/2028 Program (opsional) — Reguler Kelas di sekolah ini — Kelas 6 Kelas 6B Terima perpindahan Ajukan perpindahan ke sekolah lain Cari sekolah tujuan dengan nama lengkapnya atau kodenya. Sekolah tujuan yang menerima perpindahan dan memilih tahun ajarannya. Nama lengkap atau k"
B year options: ["—","2026/2027","2027/2028"]; places: ["—","Kelas 6","Kelas 6B"]
B «Terima perpindahan» → ?bagian=transfers&hasil=ok&asal=terima&kode=TRANSFER_ACCEPTED; screen: "Murid Demo Enam · — → SD Sintetis PenerimaDisetujui Keluarga pindah domisili (sintetis) Laksanakan · Murid Demo Enam Tolak · Murid Demo Enam Menampilkan 1–1 perpindahan Sebelumnya Halaman 1 Berikutnya ✓Selesai. Perpindahan diterima ke tahun ajaran yang dipilih. Sekarang bisa dijalankan. Ajukan perpindahan ke sekolah lain Cari sekolah tujuan dengan nama lengkapnya atau kodenya. Sekolah tujuan yang menerima perpindahan dan memilih tahun ajarannya. Nama lengkap atau kode sekolah tujuan Cari sekolah"
A sees after acceptance: "Murid Demo Enam · SD Sintetis Kenaikan → —Disetujui Keluarga pindah domisili (sintetis) Laksanakan · Murid Demo Enam Tolak · Murid Demo Enam Menampilkan 1–1 perpindahan Sebelumnya Halaman 1 Berikutnya Ajukan perpindahan ke sekolah lain Cari sekolah tujuan dengan nama lengkapnya atau kodenya. Sekolah tujuan yang menerima perpindahan dan memilih tahun ajarannya. Nama lengkap atau kode sekolah tujuan"
A «Laksanakan» → ?bagian=transfers&hasil=ok&asal=baris&hal_pindah=1&kode=TRANSFER_EXECUTED; screen: "Murid Demo Enam · SD Sintetis Kenaikan → —Selesai Keluarga pindah domisili (sintetis) ✓Selesai. Perpindahan dijalankan. Menampilkan 1–1 perpindahan Sebelumnya Halaman 1 Berikutnya Ajukan perpindahan ke sekolah lain Cari sekolah tujuan dengan nama lengkapnya atau kodenya. Sekolah tujuan yang menerima perpindahan dan memilih tahun ajarannya. Nama lengkap atau kode sekolah tujuan Cari sekolah"
B after execution: "Murid Demo Enam · — → SD Sintetis PenerimaSelesai Keluarga pindah domisili (sintetis) Menampilkan 1–1 perpindahan Sebelumnya Halaman 1 Berikutnya Ajukan perpindahan ke sekolah lain Cari sekolah tujuan dengan nama lengkapnya atau kodenya. Sekolah tujuan yang menerima perpindahan dan memilih tahun aja"

## Phase 6 — withdrawal attempt (2026-11-09T09:46:20.631Z)
pages linked from the admin's Konfigurasi: /konfigurasi /pendataan /aktivasi /studio /konfigurasi/keamanan /konfigurasi/sertifikat /lapor /akun /lapor/saya /konfigurasi/pindah /konfigurasi/roles /konfigurasi/struktur /konfigurasi/ketuntasan /konfigurasi/rollover /konfigurasi/system /konfigurasi/transfers /konfigurasi/peserta /konfigurasi/audit /konfigurasi/laporan /konfigurasi/intelligence /konfigurasi/laporan-masalah /konfigurasi/pemeliharaan
withdrawal wording found per page: /konfigurasi: -; /pendataan: -; /aktivasi: -; /studio: -; /konfigurasi/keamanan: -; /konfigurasi/sertifikat: -; /lapor: -; /akun: -; /lapor/saya: -; /konfigurasi/pindah: -; /konfigurasi/roles: -; /konfigurasi/struktur: -; /konfigurasi/ketuntasan: lulus; /konfigurasi/rollover: -; /konfigurasi/system: -; /konfigurasi/transfers: -; /konfigurasi/peserta: -; /konfigurasi/audit: -; /konfigurasi/laporan: -; /konfigurasi/intelligence: -; /konfigurasi/laporan-masalah: -; /konfigurasi/pemeliharaan: -
Pindah kelas, Tujuh's row: "Murid Demo Tujuh"; destinations offered: []
Aktivasi, Tujuh's row: ""; buttons: []
Struktur «Nonaktifkan» Kelas 5A 2026/2027: "KELAS Kelas 5A 2026/2027 6 murid Nonaktifkan Kelas Kelas 5A? Setelah dinonaktifkan, tempat ini tidak bisa diaktifkan lagi dari layar ini. Namanya boleh dipakai lagi untuk yang baru. Alasan Ya, nonaktifkan Batal Masih ada murid di sini. Pindahkan mereka dulu."; still active: t
Perpindahan murid searched «keluar»: "Murid Demo Enam · SD Sintetis Kenaikan → —Selesai Keluarga pindah domisili (sintetis) Menampilkan 1–1 perpindahan Sebelumnya Halaman 1 Berikutnya Ajukan perpindahan ke sekolah lain Cari sekolah tujuan dengan nama lengkapnya atau kodenya. Sekolah tujuan yang menerima perpindahan dan memilih tahun aja"
Tujuh after all attempts: ACTIVE -

## Phase 7 — authorization (2026-11-09T09:49:00.869Z)
Guru opens /konfigurasi/rollover: HTTP 200, lands /konfigurasi/rollover; forms with «Jalankan pergantian»: 0; page: "PINTAR Halaman ini hanya untuk Admin sekolah atau Admin platform. Jika ini keliru, tanyakan kepada yang mengurus PINTAR di sekolah Anda. Ke halaman awal Masuk sebagai Guru Demo Kelas Lima Keluar Dr. dr. Gladys DT Tubarad, M.Pd.Ked PT ZAYD PINTAR SELALU info@pintarselalu.com pintarselalu.com"
Guru RPC period_rollover(School A, 2026/2027→2027/2028, 5A→6A): data=null error={"code":"P0001","details":null,"hint":null,"message":"INSTITUTION_ADMIN required"}
Guru RPC move_learner_to_class(Lima → somewhere): error={"code":"42501","details":null,"hint":null,"message":"moving a learner needs INSTITUTION_ADMIN over the place they are in and the Kelas they move to, in one school"}
Admin B's «Pergantian tahun ajaran»: "Pilih kelas tujuan untuk setiap kelas asal. Keanggotaan lama ditutup, yang baru dibuat; riwayat tetap utuh. SD Sintetis Penerima Dari tahun ajaran — 2026/2027 2027/2028 Ke tahun ajaran — 2026/2027 2027/2028 Kelas 6 · 2027/2028 — tidak dipindahkan — Kelas 6B · 2027/2028 — tidak dipindahkan — Jalankan pergantian"; mentions School A: false
Admin B RPC period_rollover(School A ...): data=null error={"code":"P0001","details":null,"hint":null,"message":"INSTITUTION_ADMIN required"}
Admin B RPC period_rollover(p_institution = School B, School A's periods and nodes): data=null error={"code":"P0001","details":null,"hint":null,"message":"periods must belong to the institution"}
Admin B PostgREST select School A Kelas 5A memberships: rows=1 error=null
Admin B PostgREST update School A memberships: rows=0 error=null
open memberships in School A Kelas 5A 2026/2027 before 6, after 6; audit rows period.rollover for School A: 0
Admin B's readable School A Kelas 5A memberships: Murid Demo Enam (ENROLLMENT_ENDED) — via portable_visibility after the transfer (inferred from the policy)
Admin B PostgREST select School A enrolments: [{"id":"cd6e71cf-5ba2-479c-a6cf-2d102a8b2f83","status":"ENDED","end_reason":"TRANSFERRED_OUT"}]

## Phase 8 — the rollover (2026-11-09T09:50:23.263Z)
8 form: "Pilih kelas tujuan untuk setiap kelas asal. Keanggotaan lama ditutup, yang baru dibuat; riwayat tetap utuh. SD Sintetis Kenaikan Dari tahun ajaran — 2026/2027 2027/2028 Ke tahun ajaran — 2026/2027 2027/2028 Kelas 5 · 2027/2028 — tidak dipindahkan — Kelas 5 · 2026/2027 Kelas 6 · 2027/2028 Kelas 5 · 2"
8 rows (one per Kelas/Tingkat, each a select): ["Kelas 5 · 2027/2028 — tidak dipindahkan — Kelas 5 · 2026/2027 Kelas 6 · 2027/2028","Kelas 5 · 2026/2027 — tidak dipindahkan — Kelas 5 · 2027/2028 Kelas 6 · 2027/2028","Kelas 5A · 2027/2028 — tidak dipindahkan — Kelas 5A · 2026/2027 Kelas 6A · 2027/2028 Kelas 6Z · 2027/2028","Kelas 5A · 2026/2027 — tidak dipindahkan — Kelas 5A · 2027/2028 Kelas 6A · 2027/2028 Kelas 6Z · 2027/2028","Kelas 6 · 2027/2028 — tidak dipindahkan — Kelas 5 · 2027/2028 Kelas 5 · 2026/2027","Kelas 6A · 2027/2028 — tidak dipindahkan — Kelas 5A · 2027/2028 Kelas 5A · 2026/2027 Kelas 6Z · 2027/2028","Kelas 6Z · 2027/2028 — tidak dipindahkan — Kelas 5A · 2027/2028 Kelas 5A · 2026/2027 Kelas 6A · 2027/2028"]
8 options for Kelas 5A 2026/2027: ["— tidak dipindahkan —","Kelas 5A · 2027/2028","Kelas 6A · 2027/2028","Kelas 6Z · 2027/2028"]
8A open before: Murid Demo Delapan@Kelas 5/2026/2027, Murid Demo Dua@Kelas 5A/2026/2027, Murid Demo Empat@Kelas 5A/2026/2027, Murid Demo Lima@Kelas 5A/2026/2027, Murid Demo Satu@Kelas 5A/2026/2027, Murid Demo Tiga@Kelas 5A/2026/2027, Murid Demo Tujuh@Kelas 5A/2026/2027
8A result: {"q":"?bagian=rollover&hasil=gagal&kode=ACTION_PLACE_INACTIVE","said":"Belum berhasil. Tempat yang dipilih sudah dinonaktifkan. Muat ulang halaman, lalu pilih tempat yang masih aktif."}
8A open after: Murid Demo Delapan@Kelas 5/2026/2027, Murid Demo Dua@Kelas 5A/2026/2027, Murid Demo Empat@Kelas 5A/2026/2027, Murid Demo Lima@Kelas 5A/2026/2027, Murid Demo Satu@Kelas 5A/2026/2027, Murid Demo Tiga@Kelas 5A/2026/2027, Murid Demo Tujuh@Kelas 5A/2026/2027
8A audit period.rollover rows: 0
8B form sent: institution=d9ceed7c from_period=a99728a9 to_period=b5b425ee map[2d985509-ebb5-4887-9242-4358adc5da99]=249eb764
8B result: {"q":"?bagian=rollover&hasil=ok&kode=ROLLOVER_DONE&n=6","said":"✓Selesai. Keanggotaan kelas yang dipindahkan ke tahun ajaran baru: 6."}
8B audit period.rollover rows now: 1 [{"to_node": "249eb764-e072-4f8b-8a4a-2a7e5f8d1a17", "from_node": "2d985509-ebb5-4887-9242-4358adc5da99"}]
8B open after: Murid Demo Delapan@Kelas 5/2026/2027, Murid Demo Dua@Kelas 6A/2027/2028, Murid Demo Empat@Kelas 6A/2027/2028, Murid Demo Lima@Kelas 6A/2027/2028, Murid Demo Satu@Kelas 6A/2027/2028, Murid Demo Tiga@Kelas 6A/2027/2028, Murid Demo Tujuh@Kelas 6A/2027/2028
8C result: {"q":"?bagian=rollover&hasil=ok&kode=ROLLOVER_DONE&n=0","said":"✓Selesai. Keanggotaan kelas yang dipindahkan ke tahun ajaran baru: 0."}
8C audit period.rollover rows now: 2
8D Pindah kelas from Kelas 6A 2027/2028, destinations for Lima: ["Pindahkan ke kelas","Kelas 5A (2027/2028)"]
8D result: ?bagian=pindah&hasil=ok&kode=LEARNER_MOVED&dari=183c63b1-15fd-421b-8d9e-548445d615e3&sekolah=d9ceed7c-0632-4d3c-aabb-5eca92bc7353; screen: "Pindahkan seorang murid ke Kelas lain di sekolah ini, pada tahun ajaran yang sama, atau tempatkan murid yang dicatat di sebuah Tingkat ke salah satu Kelasnya. Ia tetap murid yang sama. Apa yang sudah ia kerjakan tetap tercatat di kelas tempat ia mengerjakannya, dan kelas lamanya tidak lagi menghitungnya sebagai muridnya sekarang. Kelas murid sekarang — Kelas 5A (2026/2027) Kelas 5A (2027/2028) Kel"
8E before: Delapan open: Kelas 5/2026/2027
8E result: {"q":"?bagian=rollover&hasil=ok&kode=ROLLOVER_DONE&n=1","said":"✓Selesai. Keanggotaan kelas yang dipindahkan ke tahun ajaran baru: 1."}
final open: Murid Demo Delapan@Kelas 6/2027/2028, Murid Demo Dua@Kelas 6A/2027/2028, Murid Demo Empat@Kelas 6A/2027/2028, Murid Demo Lima@Kelas 5A/2027/2028, Murid Demo Satu@Kelas 6A/2027/2028, Murid Demo Tiga@Kelas 6A/2027/2028, Murid Demo Tujuh@Kelas 6A/2027/2028

## Phase 9 — audit reader and after-views (2026-11-09T09:51:27.083Z)
Jejak audit (adminA) columns: ["Waktu","Tindakan","Sasaran"]; 50 rows shown:
  9 Nov 2026, 16.50 WIB | Keanggotaan diakhiri | Keanggotaan · SD Sintetis Kenaikan
  9 Nov 2026, 16.50 WIB | Keanggotaan dibuat | Keanggotaan · SD Sintetis Kenaikan
  9 Nov 2026, 16.50 WIB | Tahun ajaran dilanjutkan | Tahun ajaran · SD Sintetis Kenaikan
  9 Nov 2026, 16.50 WIB | Keanggotaan diakhiri | Keanggotaan · SD Sintetis Kenaikan
  9 Nov 2026, 16.50 WIB | Keanggotaan dibuat | Keanggotaan · SD Sintetis Kenaikan
  9 Nov 2026, 16.50 WIB | Tahun ajaran dilanjutkan | Tahun ajaran · SD Sintetis Kenaikan
  9 Nov 2026, 16.50 WIB | Keanggotaan diakhiri | Keanggotaan · SD Sintetis Kenaikan
  9 Nov 2026, 16.50 WIB | Keanggotaan dibuat | Keanggotaan · SD Sintetis Kenaikan
  9 Nov 2026, 16.50 WIB | Keanggotaan diakhiri | Keanggotaan · SD Sintetis Kenaikan
  9 Nov 2026, 16.50 WIB | Keanggotaan dibuat | Keanggotaan · SD Sintetis Kenaikan
  9 Nov 2026, 16.50 WIB | Keanggotaan diakhiri | Keanggotaan · SD Sintetis Kenaikan
  9 Nov 2026, 16.50 WIB | Keanggotaan dibuat | Keanggotaan · SD Sintetis Kenaikan
  9 Nov 2026, 16.50 WIB | Keanggotaan diakhiri | Keanggotaan · SD Sintetis Kenaikan
  9 Nov 2026, 16.50 WIB | Keanggotaan dibuat | Keanggotaan · SD Sintetis Kenaikan
  9 Nov 2026, 16.50 WIB | Keanggotaan diakhiri | Keanggotaan · SD Sintetis Kenaikan
  9 Nov 2026, 16.50 WIB | Keanggotaan dibuat | Keanggotaan · SD Sintetis Kenaikan
  9 Nov 2026, 16.50 WIB | Keanggotaan diakhiri | Keanggotaan · SD Sintetis Kenaikan
  9 Nov 2026, 16.50 WIB | Keanggotaan dibuat | Keanggotaan · SD Sintetis Kenaikan
  9 Nov 2026, 16.50 WIB | Tahun ajaran dilanjutkan | Tahun ajaran · SD Sintetis Kenaikan
  9 Nov 2026, 16.48 WIB | Perubahan tercatat | Sekolah · SD Sintetis Kenaikan
  9 Nov 2026, 16.45 WIB | Keanggotaan diakhiri | Keanggotaan · SD Sintetis Kenaikan
  9 Nov 2026, 16.45 WIB | Keanggotaan kelas | Keanggotaan kelas · SD Sintetis Kenaikan
  9 Nov 2026, 16.45 WIB | Pindah sekolah | Pindah sekolah · SD Sintetis Kenaikan
  9 Nov 2026, 16.45 WIB | Pindah sekolah | Pindah sekolah · SD Sintetis Kenaikan
  9 Nov 2026, 16.45 WIB | Pindah sekolah | Pindah sekolah · SD Sintetis Kenaikan
  9 Nov 2026, 16.45 WIB | Perubahan tercatat | Sekolah · SD Sintetis Kenaikan
  9 Nov 2026, 16.44 WIB | Murid dimasukkan ke kelas | Keanggotaan kelas · SD Sintetis Kenaikan
  9 Nov 2026, 16.44 WIB | Keanggotaan dibuat | Keanggotaan · SD Sintetis Kenaikan
  9 Nov 2026, 16.44 WIB | Pendataan selesai | Pendataan · SD Sintetis Kenaikan
  9 Nov 2026, 16.44 WIB | Pendataan disetujui | Pendataan · SD Sintetis Kenaikan
  9 Nov 2026, 16.44 WIB | Bagian struktur dinonaktifkan | Struktur sekolah · SD Sintetis Kenaikan
  9 Nov 2026, 16.44 WIB | Kelas dibuat | Struktur sekolah · SD Sintetis Kenaikan
  9 Nov 2026, 16.44 WIB | Tingkat dibuat | Struktur sekolah · SD Sintetis Kenaikan
  9 Nov 2026, 16.44 WIB | Kelas dibuat | Struktur sekolah · SD Sintetis Kenaikan
  9 Nov 2026, 16.44 WIB | Kelas dibuat | Struktur sekolah · SD Sintetis Kenaikan
  9 Nov 2026, 16.44 WIB | Tahun ajaran dibuat | Tahun ajaran · SD Sintetis Kenaikan
  9 Nov 2026, 16.44 WIB | Tingkat dibuat | Struktur sekolah · SD Sintetis Kenaikan
  9 Nov 2026, 16.41 WIB | Terbitan materi dibagikan ke sekolah | Pembagian materi · SD Sintetis Kenaikan
  9 Nov 2026, 16.39 WIB | Keanggotaan kelas | Keanggotaan kelas · SD Sintetis Kenaikan
  9 Nov 2026, 16.39 WIB | Akun diaktifkan | Orang · SD Sintetis Kenaikan
  9 Nov 2026, 16.39 WIB | Keanggotaan kelas | Keanggotaan kelas · SD Sintetis Kenaikan
  9 Nov 2026, 16.39 WIB | Akun diaktifkan | Orang · SD Sintetis Kenaikan
  9 Nov 2026, 16.39 WIB | Keanggotaan kelas | Keanggotaan kelas · SD Sintetis Kenaikan
  9 Nov 2026, 16.39 WIB | Akun diaktifkan | Orang · SD Sintetis Kenaikan
  9 Nov 2026, 16.39 WIB | Peran diberikan | Peran · SD Sintetis Kenaikan
  9 Nov 2026, 16.39 WIB | Akun diaktifkan | Orang · SD Sintetis Kenaikan
  9 Nov 2026, 16.38 WIB | Pendataan selesai | Pendataan · SD Sintetis Kenaikan
  9 Nov 2026, 16.38 WIB | Pendataan disetujui | Pendataan · SD Sintetis Kenaikan
  9 Nov 2026, 16.38 WIB | Murid dimasukkan ke kelas | Keanggotaan kelas · SD Sintetis Kenaikan
  9 Nov 2026, 16.38 WIB | Keanggotaan dibuat | Keanggotaan · SD Sintetis Kenaikan
Jejak audit (adminB) columns: ["Waktu","Tindakan","Sasaran"]; 16 rows shown:
  9 Nov 2026, 16.45 WIB | Murid dimasukkan ke kelas | Keanggotaan kelas · SD Sintetis Penerima
  9 Nov 2026, 16.45 WIB | Keanggotaan dibuat | Keanggotaan · SD Sintetis Penerima
  9 Nov 2026, 16.45 WIB | Pindah sekolah | Pindah sekolah · SD Sintetis Penerima
  9 Nov 2026, 16.45 WIB | Pindah sekolah | Pindah sekolah · SD Sintetis Penerima
  9 Nov 2026, 16.45 WIB | Pindah sekolah | Pindah sekolah · SD Sintetis Penerima
  9 Nov 2026, 16.39 WIB | Kelas dibuat | Struktur sekolah · SD Sintetis Penerima
  9 Nov 2026, 16.39 WIB | Tahun ajaran dibuat | Tahun ajaran · SD Sintetis Penerima
  9 Nov 2026, 16.39 WIB | Tingkat dibuat | Struktur sekolah · SD Sintetis Penerima
  9 Nov 2026, 16.39 WIB | Jenjang dibuat | Struktur sekolah · SD Sintetis Penerima
  9 Nov 2026, 16.39 WIB | Program reguler dibuat | Struktur sekolah · SD Sintetis Penerima
  9 Nov 2026, 16.39 WIB | Bagian dibuat | Struktur sekolah · SD Sintetis Penerima
  9 Nov 2026, 16.39 WIB | Kode sekolah dipesan | Sekolah · SD Sintetis Penerima
  9 Nov 2026, 16.37 WIB | Peran diberikan | Peran · SD Sintetis Penerima
  9 Nov 2026, 16.36 WIB | Sekolah dibuat | Sekolah · SD Sintetis Penerima
  9 Nov 2026, 16.36 WIB | Templat laporan disiapkan | Templat laporan · SD Sintetis Penerima
  9 Nov 2026, 16.36 WIB | Templat laporan disiapkan | Templat laporan · SD Sintetis Penerima
Guru /mengajar after the rollover: "SD Sintetis Kenaikan / 2026/2027 SENIN, 9 NOV 2026 Selamat sore, Guru Demo Kelas Lima Satu hal yang paling layak dikerjakan lebih dulu, lalu kelas dalam lingkup mengajar Anda. Layak dikerjakan lebih dulu Materi yang diterbitkan sekolah belum disediakan untuk Kelas 5A Siapkan materi Lihat Kelas 5A KELAS DALAM LINGKUP MENGAJAR ANDA Berdasarkan penugasan dari sekolah. PINTAR tidak menandai kelas sebagai milik seseorang; yang tampil adalah kelas yang tercakup dalam penugasan Anda. Kelas 5A 0 murid S"
Guru /mengajar/<Kelas 5A 2026/2027>: HTTP 200 "← Mengajar SD Sintetis Kenaikan / Kelas 5A / 2026/2027 ANDA SEDANG MELIHAT Kelas 5A Kelas ini tampil karena sekolah menugaskan Anda ke lingkup yang mencakupnya. Daftar murid berasal dari pendaftaran sekolah, bukan dari PINTAR. MATA PELAJARAN — MURID TERDAFTAR 0 MATERI TERSEDIA Belum ada Siapkan materi Uji Cepat Lihat bukti Ringkasan Kelas Langkah berikutnya Umpan balik kelas YANG SEDANG BERJALAN DI KELAS INI Tidak ada yang sedang berjalan. MATERI UNTUK KELAS INI Urutan mengikuti kurikulum sekolah. Menyediakan materi tidak sama dengan menerbitkannya; penerbitan dilakukan sekolah. Pengukuran Nas"
Guru /mengajar/<Kelas 6A 2027/2028>: HTTP 200 "PINTAR Masuk sebagai Guru Demo Kelas Lima Keluar Mau ke mana hari ini? Halo, Guru Demo Kelas Lima. Saya mengajar · SD Sintetis Kenaikan"
