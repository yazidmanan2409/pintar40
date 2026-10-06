# PINTAR — 100 Pertanyaan yang Mungkin Ditanyakan Sekolah
## Draf 1 — Handbook Pengetahuan & Kepercayaan (INTERNAL)

**Status dokumen: LANGKAH 1A — daftar pertanyaan saja. Jawaban (Langkah 1B) BELUM ditulis; menunggu tinjauan Yazid.**

- Penyusun: FIONA
- Tanggal baca: 6 Oktober 2026
- Commit yang dibaca: `e5d2e35dc825e49a496efed92f5cf153b2f290c4` (branch `claude/new-session-nfib2w`)
- Sumber yang sudah dibaca untuk menyusun daftar ini (belum seluruhnya; pembacaan penuh dilakukan di Langkah 1B):
  `docs/product/SCHOOL-DATA-EXPORT-4.0.md`, `docs/recovery/PINTAR-4.0-SCOPE-INVENTORY.md` (seluruhnya),
  `docs/rebuild/10-PINTAR-REMOVED-AND-REJECTED-FEATURES.md`, `docs/rebuild/09-PINTAR-V1-SCOPE-BOUNDARIES.md` (bagian LATER/PARK),
  `docs/coordination/DECISIONS.md` (D-001–D-035 dan D-037, D-057, D-062, D-103–D-110), `docs/coordination/briefs/RESUME-2026-10-06.md` (bagian awal),
  `src/ai-gateway/README.md`, daftar rute `src/app/`.
- Belum dibaca: `selftest/manifest.json`, `JOURNEY-LOG.md`, `BACKUP-DR-REVIEW`, `CLOSURE-PLAN-150`, dokumen 03–07 dan 11–12 di `docs/rebuild/`, Voice Guide, Terminology Inventory, kode halaman secara rinci.

### Cara membaca kolom "Dugaan status"

Ini **dugaan awal** dari sumber yang sudah dibaca, **bukan putusan**. Status final ditetapkan di Langkah 1B setelah bukti implementasi diperiksa.
Singkatan: **TERSEDIA** · **SEBAGIAN** · **BELUM AKTIF** (dibangun, belum dinyalakan) · **TIDAK** (tidak dilakukan PINTAR) · **ROADMAP?** (kandidat/belum dijanjikan) ·
**KEBIJAKAN?** (belum diputuskan) · **VER-TEKNIS** · **VER-HUKUM**.
Tanda `*` = dugaan kuat bahwa dokumen/keputusan menetapkan aturan, tetapi bukti implementasi belum saya periksa.

Kolom "Ditanya": T = tinggi, S = sedang, R = rendah. Kolom "Sens.": N = normal, P = penting, TG = tinggi, K = kritis.

| No | Pertanyaan | Siapa yang bertanya | Kat. | Ditanya | Sens. | Dugaan status |
|---|---|---|---|---|---|---|
| 1 | Sebenarnya PINTAR itu apa? Apa bedanya dengan LMS atau aplikasi ujian yang sudah kami pakai? | Kepala sekolah | A | T | P | TERSEDIA* |
| 2 | Siapa perusahaan di belakang PINTAR, badan hukumnya apa, dan siapa pemiliknya? | Pengurus yayasan | AL | T | P | VER-HUKUM |
| 3 | Sekolah mana saja yang sudah memakai PINTAR? Boleh kami tanya langsung ke mereka? | Pengurus yayasan, komite | AL | T | P | VER-TEKNIS / tidak ada catatan resmi |
| 4 | Apakah PINTAR sudah siap dipakai di sekolah sungguhan, atau masih tahap uji coba? | Pengurus yayasan | AG | T | K | SEBAGIAN (ENGINEERING COMPLETE ≠ siap produksi) |
| 5 | Apa saja yang TIDAK bisa dilakukan PINTAR? | Kepala sekolah yang skeptis | AF | T | P | TERSEDIA* |
| 6 | Siapa yang membuat dan memeriksa konten pelajaran di PINTAR? Bagaimana kami tahu isinya benar? | Wakasek kurikulum | AI | T | P | SEBAGIAN |
| 7 | Apakah isinya sesuai Kurikulum Merdeka dan capaian pembelajaran? Mata pelajaran dan kelas apa saja yang sudah ada? | Wakasek kurikulum | AI | T | P | VER-TEKNIS |
| 8 | Apakah PINTAR menjamin nilai siswa naik? | Komite sekolah | B | S | TG | TIDAK (jangan dijanjikan) |
| 9 | Kalau kami pakai tiga bulan, apa yang konkret berubah di sekolah kami? Adakah buktinya dari sekolah lain? | Kepala sekolah | B | T | P | VER-TEKNIS / tidak ada bukti dampak |
| 10 | Dari daftar sampai guru bisa mulai mengajar, langkahnya apa saja dan siapa mengerjakan apa? | Administrator sekolah | C | T | P | SEBAGIAN |
| 11 | Siapa yang membuat akun sekolah kami? Bisa kami buat sendiri? | Administrator sekolah | C | T | P | SEBAGIAN (disiapkan admin platform, D-085 M1) |
| 12 | Data siswa kami ada di Excel/Dapodik. Bisa langsung dimasukkan sekaligus, atau harus diketik satu per satu? | Operator sekolah | C | T | P | SEBAGIAN |
| 13 | Yayasan kami punya beberapa unit sekolah. Bisa dikelola dari satu tempat? | Pengurus yayasan | C | S | P | VER-TEKNIS |
| 14 | Kami sekarang pakai sistem lain. Bisa memindahkan data dari sana? | Admin sekolah yang pindah sistem | C | S | P | VER-TEKNIS |
| 15 | Siapa yang melatih guru kami? Apakah ada panduan atau pelatihan? | Kepala sekolah | C | T | P | KEBIJAKAN? |
| 16 | Kami pernah kecewa dengan vendor teknologi yang menghilang setelah kontrak. Apa yang membuat PINTAR berbeda? | Sekolah yang pernah kecewa | AL | S | P | SEBAGIAN (D-110 prinsip; fitur belum) |
| 17 | Guru kami kurang nyaman dengan komputer. Seberapa sulit memakainya? | Kepala sekolah, guru | D | T | P | SEBAGIAN |
| 18 | Berapa lama guru perlu menyiapkan satu pelajaran? Bisakah memakai soal/materi yang sudah kami punya di Excel? | Guru matematika kelas 5 | D | T | N | TERSEDIA* |
| 19 | Apakah guru bisa melihat siswa mana yang tertinggal dan di bagian apa? | Guru | D | T | P | TERSEDIA* |
| 20 | Apakah guru masih memegang keputusan akhir atas nilai dan kelulusan? Bisakah guru mengubah nilai siswa? | Guru, kepala sekolah | D | T | TG | SEBAGIAN |
| 21 | Guru honorer yang kontraknya habis atau guru yang pindah: akunnya dan data kelasnya bagaimana? | Admin sekolah | V | S | TG | SEBAGIAN |
| 22 | Siswa kami masuk bagaimana? Apakah harus punya email atau password? | Guru, kepala sekolah | E | T | P | TERSEDIA* (Kartu PINTAR) |
| 23 | Siswa lupa PIN atau kartunya hilang. Siapa yang menolong dan secepat apa? | Guru | E | T | P | TERSEDIA* |
| 24 | Siswa kami banyak yang hanya punya HP dan kuota terbatas. Bisa dipakai? Berapa kuota yang terpakai? | Kepala sekolah, siswa | AJ | T | P | VER-TEKNIS |
| 25 | Kami hanya punya beberapa komputer lab/tablet yang dipakai bergantian. Apakah siswa lain bisa melihat akun teman sebelumnya? | Guru, bagian IT | E | S | TG | TERSEDIA* |
| 26 | Apakah siswa bisa melihat nilai atau peringkat teman? | Orang tua, siswa | E | S | TG | TERSEDIA* |
| 27 | Apakah ada game, poin, atau lencana untuk memotivasi siswa? | Guru, siswa | E | S | N | TIDAK / ROADMAP? (5.0) |
| 28 | Apakah PINTAR bisa dipakai untuk ujian resmi (UTS/UAS) dan hasilnya masuk rapor? | Kepala sekolah, wakasek | F | T | TG | SEBAGIAN |
| 29 | Siapa yang menentukan batas lulus sebuah pelajaran? Apakah ada angka bawaan? | Wakasek kurikulum | F | S | TG | TERSEDIA* (D-081) |
| 30 | Kalau guru salah menerbitkan soal atau ada soal yang keliru, apakah bisa diperbaiki? Bagaimana dengan siswa yang sudah mengerjakan? | Guru | S | T | TG | SEBAGIAN (koreksi ke depan) |
| 31 | Bisakah siswa mengintip kunci jawaban lewat browser? | Bagian IT, guru | F | S | K | VER-TEKNIS |
| 32 | Apakah soal esai/uraian bisa dinilai di PINTAR? | Guru | F | T | P | VER-TEKNIS |
| 33 | Apakah siswa boleh mengulang ujian? Berapa kali? | Guru, orang tua | F | S | TG | SEBAGIAN |
| 34 | Kalau ujian berlangsung dan internet sekolah mati, apa yang terjadi pada jawaban siswa? | Guru, bagian IT | Q | T | K | SEBAGIAN |
| 35 | Kalau listrik padam atau perangkat siswa rusak/mati di tengah ujian, bagaimana? | Guru, bagian IT | R | T | TG | SEBAGIAN |
| 36 | Siswa tidak sengaja menutup tab atau menekan "kirim" terlalu cepat. Apakah bisa dipulihkan? | Guru | S | S | TG | SEBAGIAN |
| 37 | Apakah ada ujian kertas (paper) untuk siswa yang tidak punya perangkat? | Kepala sekolah | F | S | P | ROADMAP? (LATER) |
| 38 | Laporan apa saja yang dilihat kepala sekolah, guru, dan kepala bagian? Dari mana angkanya? | Kepala sekolah | G | T | P | TERSEDIA* |
| 39 | Bisakah laporan diunduh ke Excel atau dicetak untuk rapat, pengawas, dan akreditasi? | Wakasek, pengawas | L | T | TG | SEBAGIAN (hanya cetak) |
| 40 | Apa artinya "data belum cukup" di laporan? Mengapa tidak ditampilkan angka nol saja? | Kepala sekolah, guru | G | S | N | TERSEDIA* |
| 41 | Apakah sertifikat PINTAR resmi? Apakah diakui dinas atau sekolah lain? | Orang tua, kepala sekolah | G | T | TG | VER-HUKUM |
| 42 | Bagaimana pihak luar memeriksa keaslian sertifikat? Apakah data siswa ikut terbuka? | Orang tua, komite | G | S | K | TERSEDIA* |
| 43 | Kalau nama di sertifikat salah, atau sertifikat sudah diterbitkan lalu ternyata keliru, bagaimana? | Admin sekolah | T | S | TG | SEBAGIAN |
| 44 | Apakah AI yang menentukan siswa lulus atau tidak? | Guru, orang tua | H | T | K | TIDAK |
| 45 | AI apa saja yang benar-benar ada di PINTAR hari ini? | Orang yang skeptis terhadap AI | H | T | TG | SEBAGIAN / VER-TEKNIS |
| 46 | Apakah data siswa dikirim ke perusahaan AI di luar negeri? | Petugas perlindungan data | H | T | K | VER-TEKNIS |
| 47 | Kalau AI salah, siapa yang bertanggung jawab? | Kepala sekolah, yayasan | H | T | TG | TERSEDIA* (tanpa otoritas pedagogis, INV-32) |
| 48 | Apakah soal dan materi dibuat oleh AI? | Wakasek kurikulum | H | S | P | VER-TEKNIS |
| 49 | Bisakah kami memakai PINTAR tanpa fitur AI sama sekali? | Orang yang skeptis terhadap AI | H | S | P | VER-TEKNIS |
| 50 | Apakah PINTAR merekam kamera, layar, atau ketikan siswa selama ujian? | Orang tua, siswa | I | T | K | TIDAK (PARK: pengawasan invasif) |
| 51 | Aktivitas yang dianggap tidak biasa otomatis berarti siswa menyontek? | Guru, orang tua | I | T | K | TERSEDIA* (sinyal bukan tuduhan) |
| 52 | Siapa yang melihat sinyal integritas? Apakah siswa atau orang tua diberi tahu? Bagaimana siswa membela diri? | Orang tua, kepala sekolah | I | S | K | SEBAGIAN |
| 53 | Data apa saja tentang siswa yang dikumpulkan PINTAR? | Petugas perlindungan data | J | T | K | SEBAGIAN |
| 54 | Siapa di PINTAR yang bisa melihat data dan nilai siswa kami? Apakah staf PINTAR bisa membuka nilai siswa? | Kepala sekolah, bagian IT | J | T | K | SEBAGIAN / VER-TEKNIS |
| 55 | Apakah sekolah lain bisa melihat data kami? | Kepala sekolah, bagian IT | J | T | K | TERSEDIA* |
| 56 | Apakah data siswa dipakai untuk iklan, dijual, atau dipakai melatih produk lain? | Orang tua, petugas perlindungan data | K | T | K | KEBIJAKAN? |
| 57 | Data kami disimpan di mana? Di Indonesia? | Petugas perlindungan data, pengawas | J | T | K | VER-HUKUM (konfigurasi: Singapura) |
| 58 | Foto siswa: apakah dikumpulkan, dan di mana tampil? | Orang tua | J | S | TG | SEBAGIAN |
| 59 | Data siswa dan hasil belajarnya itu milik siapa? | Pengurus yayasan, kepala sekolah | K | T | K | KEBIJAKAN? (prinsip D-110) |
| 60 | Bisakah kami mengunduh seluruh data sekolah dan membukanya di Excel? | Yayasan, admin, bagian IT | L | T | K | ROADMAP? (kandidat 4.5; tidak ada di 4.0) |
| 61 | Apakah kami perlu izin PINTAR untuk mendapatkan data kami sendiri? Ada biayanya? Apakah formatnya hanya bisa dibaca PINTAR? | Yayasan, bendahara | L | S | K | KEBIJAKAN? |
| 62 | Bagaimana PINTAR melindungi dari peretasan? Pernah diaudit pihak luar? Punya sertifikasi keamanan (misalnya ISO 27001)? | Bagian IT, compliance | M | T | K | VER-TEKNIS (jangan mengarang) |
| 63 | Bagaimana PIN siswa dan kata sandi guru disimpan? Apakah staf PINTAR bisa membacanya? | Bagian IT | M | S | K | TERSEDIA* |
| 64 | Kalau akun kepala sekolah dibajak, apa yang terjadi dan siapa yang diberi tahu? | Kepala sekolah, bagian IT | N | T | K | SEBAGIAN |
| 65 | Guru lupa keluar (logout) di komputer bersama. Apa yang melindungi? | Bagian IT | N | S | TG | TERSEDIA* |
| 66 | Kalau server rusak total, apakah data kami masih ada? | Bagian IT, yayasan | P | T | K | SEBAGIAN |
| 67 | Berapa banyak data yang bisa hilang kalau terjadi masalah besar? | Bagian IT, kepala sekolah | P | T | K | SEBAGIAN (hingga 24 jam; PITR tidak aktif) |
| 68 | Apakah backup PINTAR pernah benar-benar diuji untuk dipulihkan? Berapa lama pulihnya? | Bagian IT, compliance | O | T | K | SEBAGIAN (belum lulus, #150) |
| 69 | Apakah ada salinan data di luar penyedia utama, kalau penyedia itu bermasalah? | Bagian IT, compliance | O | S | K | BELUM AKTIF |
| 70 | Admin kami salah memasukkan siswa ke kelas lain atau salah menonaktifkan kelas. Bisakah dibatalkan dan apakah tercatat? | Admin sekolah | S | T | TG | SEBAGIAN |
| 71 | Kalau ada nilai atau data yang salah, siapa yang boleh mengoreksi dan apakah riwayat perubahannya terlihat? | Admin, guru | T | T | TG | SEBAGIAN |
| 72 | Kalau siswa pindah sekolah, siapa yang memegang riwayat belajarnya? | Orang tua, admin | U | T | K | SEBAGIAN |
| 73 | Siapa yang bisa melihat apa? Apakah kepala sekolah bisa melihat semua guru dan semua siswa? | Kepala sekolah, guru | X | T | TG | TERSEDIA* |
| 74 | Apakah orang tua bisa melihat perkembangan anaknya di PINTAR? | Orang tua, komite | W | T | P | ROADMAP? (LATER; bukan 4.0) |
| 75 | Apakah orang tua harus memberi izin sebelum data anak masuk ke PINTAR? | Orang tua, petugas perlindungan data | AD | T | K | VER-HUKUM |
| 76 | Orang tua siswa berkebutuhan khusus bertanya: apakah anak saya bisa memakai PINTAR dengan alat bantu atau waktu tambahan? | Orang tua ABK, guru | AK | S | TG | VER-TEKNIS |
| 77 | Orang tua minta data anaknya dilihat, dikoreksi, atau dihapus. Bagaimana prosesnya? | Orang tua, petugas perlindungan data | W | S | K | KEBIJAKAN? |
| 78 | Berapa lama data siswa disimpan? | Petugas perlindungan data, yayasan | Y | T | K | KEBIJAKAN? (OD-5 terbuka) |
| 79 | Kalau kami berhenti berlangganan, apa yang terjadi dengan data kami dan sertifikat siswa? | Yayasan, kepala sekolah | Z | T | K | SEBAGIAN |
| 80 | Bisakah kami meminta semua data kami dihapus, dan apakah salinan di backup juga hilang? | Petugas perlindungan data | Z | S | K | KEBIJAKAN? (belum dibangun) |
| 81 | Kalau perusahaan yang mengoperasikan PINTAR tutup, bagaimana kami mengambil data? | Yayasan, bagian IT | AA | S | K | KEBIJAKAN? |
| 82 | Kalau ada masalah saat ujian sedang berlangsung, kami hubungi siapa dan secepat apa dijawab? | Guru, admin | AB | T | TG | SEBAGIAN (D-037; tanpa SLA tercatat) |
| 83 | Setelah kami melapor masalah, bagaimana kami tahu laporannya diterima dan sedang ditangani? | Guru, admin | AB | S | P | TERSEDIA* |
| 84 | Seribu siswa ujian bersamaan, apakah kuat? Berapa sekolah yang sudah diuji? | Bagian IT, yayasan | AC | T | P | VER-TEKNIS |
| 85 | Apakah PINTAR sudah mematuhi UU Pelindungan Data Pribadi dan terdaftar sebagai PSE di Komdigi? | Compliance, pengawas | AD | T | K | VER-HUKUM |
| 86 | Siapa yang menjadi pengendali dan pemroses data menurut hukum, dan adakah perjanjian pemrosesan data dengan sekolah? | Petugas perlindungan data | AD | S | K | VER-HUKUM |
| 87 | Berapa biayanya, dan bagaimana cara bayarnya? | Bendahara, yayasan | AE | T | TG | KEBIJAKAN? (harga tidak ditemukan) |
| 88 | Bisakah dibayar dengan dana BOS, dan apakah ada dokumen pendukung untuk pertanggungjawaban? | Bendahara, kepala sekolah | AE | T | TG | VER-HUKUM / KEBIJAKAN? |
| 89 | Kontraknya berapa lama? Bisakah berhenti kapan saja? Apakah harga bisa naik? | Yayasan, bendahara | AE | T | TG | KEBIJAKAN? |
| 90 | Apakah bisa tersambung ke Dapodik atau e-Rapor? Nilai di PINTAR harus diketik ulang? | Operator Dapodik | AH | T | P | VER-TEKNIS (kemungkinan TIDAK / LATER) |
| 91 | Sekolah kami madrasah di bawah Kemenag. Apakah bisa dipakai dengan EMIS, dan apakah isinya sesuai kurikulum madrasah? | Kepala madrasah | AH | S | P | VER-TEKNIS |
| 92 | Apakah bisa dipakai untuk persiapan ANBK atau asesmen dari pemerintah? | Kepala sekolah, wakasek | AH | S | P | VER-TEKNIS |
| 93 | Apakah siswa dan guru bisa masuk dengan akun Google atau Microsoft sekolah kami? | Bagian IT | AH | S | P | TIDAK / ROADMAP? (SSO: LATER) |
| 94 | Apakah dinas pendidikan atau pengawas bisa melihat data sekolah kami? | Kepala sekolah, pengawas | X | S | TG | VER-TEKNIS |
| 95 | Pengawas/dinas ingin melihat bukti penggunaan PINTAR. Apa yang bisa kami tunjukkan? | Pengawas, dinas | G | S | P | SEBAGIAN |
| 96 | Fitur yang katanya "akan ada" (misalnya unduh data, portal orang tua), apakah bisa kami tagih? Kapan? | Yayasan, kepala sekolah | AG | T | TG | ROADMAP? (tanpa tanggal) |
| 97 | Kalau PINTAR berubah tampilan atau cara kerjanya di tengah tahun ajaran, bagaimana kami diberi tahu? | Admin, guru | AG | S | N | KEBIJAKAN? |
| 98 | Berapa banyak kelas dan siswa yang bisa kami tambahkan? Apakah ada batas? | Admin, yayasan | AC | S | N | VER-TEKNIS |
| 99 | Setelah presentasi, pertanyaan diam-diam: "Apa yang paling mungkin salah dari PINTAR, dan apa yang Anda lakukan kalau itu terjadi pada kami?" | Orang yang diam lalu bertanya | AF | S | K | SEBAGIAN |
| 100 | Apakah sekolah lain pernah berhenti memakai PINTAR, dan mengapa? | Sekolah yang mempertimbangkan berhenti | Z | R | P | VER-TEKNIS / tidak ada catatan |

### Catatan penyusun untuk peninjau (Yazid)

1. **Cakupan kategori.** Semua kategori A–AL tersentuh. Kategori yang saya gabung ke satu pertanyaan karena alasan tumpang tindih: AC (skalabilitas, Q84 dan Q98), Q (internet mati, Q34), R (listrik/perangkat, Q35), N (akun dibajak, Q64–Q65), O dan P (backup/DR, Q66–Q69). Beri tahu jika ingin dipecah.
2. **Bobot.** Saya sengaja memberi bobot pada privasi, data anak, kehilangan data, keluar dari PINTAR, dan hukum (±35 pertanyaan berstatus KRITIS), karena di situlah jawaban salah paling mahal.
3. **Pertanyaan tentang perusahaan (Q2, Q3, Q100)** mungkin tidak punya sumber di repositori. Jawabannya akan berstatus VER-HUKUM / "tidak ditemukan", dan itu disengaja.
4. **Dugaan status bisa berubah.** Beberapa yang saya tandai `TERSEDIA*` (misalnya Q22, Q26, Q55, Q73) harus dibuktikan dengan kode atau ID tes di `selftest/manifest.json` sebelum boleh berstatus TERSEDIA DI 4.0.
5. **Tidak ada pertanyaan ganda yang saya ketahui**, tetapi Q20/Q71 (koreksi nilai vs koreksi data) dan Q39/Q60 (cetak laporan vs ekspor seluruh data) saling berdekatan; saya pisahkan karena jawabannya berbeda.

**STOP — menunggu tinjauan Yazid sebelum Langkah 1B.**
