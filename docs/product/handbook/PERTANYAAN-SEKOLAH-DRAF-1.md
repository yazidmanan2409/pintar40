**INTERNAL — untuk tim PINTAR saja; jangan dibagikan ke sekolah. FAQ untuk sekolah akan menjadi dokumen terpisah yang diturunkan dari jawaban canonical, bukan dokumen ini dengan bagian yang dihapus.**

# PINTAR — 100 Pertanyaan yang Mungkin Ditanyakan Sekolah
## Draf 1 — Handbook Pengetahuan & Kepercayaan (INTERNAL)

**Status dokumen: LANGKAH 1C — revisi atas tinjauan 1B dan putusan D-112; jawaban lengkap untuk Q001–Q100. Draf untuk diperiksa pemilik produk dan Second Eye; belum canonical dan belum materi training.**

- Penyusun: FIONA
- Tanggal baca: 6 Oktober 2026
- Commit yang dibaca: `178e915cf773af142d9560a89f33ad110e9fbc1b` (`main` di `origin`, digabung ke branch ini dengan merge, bukan rebase; putaran 1B memakai `e5d2e35`, putaran 1C awal memakai `1b45612`). Dokumen ini ditulis di branch `claude/new-session-nfib2w`.
- Brief kondisi terkini yang dibaca: `docs/coordination/briefs/RESUME-2026-10-06.md` (yang terbaru, termasuk daftar putusan D-112).
- Dibaca ulang pada putaran 1C: D-111 dan D-112 (`DECISIONS.md`), `docs/recovery/EVIDENCE-INDEX-150.md`, `docs/product/SCHOOL-DATA-EXPORT-4.0.md` bagian D (dua lapis cadangan dipisahkan), `CLOSURE-PLAN-150.md`, `OFFSITE-BACKUP-DESIGN.md` (catatan "superseded"), SCOPE-INVENTORY J8.7 (catatan "superseded").
- **Dokumen #150 (CLOSURE-PLAN, RESUME, JOURNEY-LOG) masih berubah minggu ini. Bila commit `main` berubah, bagian backup/pemulihan (Q070–Q072, Q085) dan Q004, Q088, Q100 harus diperiksa ulang.**

### Sumber yang dibaca

`docs/product/SCHOOL-DATA-EXPORT-4.0.md`; `docs/coordination/DECISIONS.md` (D-001 s/d D-110, dibaca terarah); `docs/recovery/PINTAR-4.0-SCOPE-INVENTORY.md`; `docs/rebuild/03, 05, 06, 07, 09, 10, 11, 12` (dibaca terarah); `selftest/manifest.json` (kolom "proves", dicari per topik); `docs/recovery/JOURNEY-LOG.md` (butir 13, 14, 28, 29, 33, 35, 36–43, baris 97–98, 137, 139 dan lainnya); `docs/recovery/BACKUP-DR-REVIEW-2026-10-05.md`; `docs/recovery/CLOSURE-PLAN-150.md`; `docs/recovery/OWNER-INSTRUCTIONS-150.md`; `docs/recovery/OFFSITE-BACKUP-DESIGN.md`; `docs/recovery/custody.json` dan `durable-secrets.json` (struktur saja); `docs/coordination/RELEASE-CHECKLIST.md`; `docs/coordination/RELEASES.md`; `docs/coordination/briefs/RESUME-2026-10-06.md`; `src/` dan `supabase/migrations/` (dibaca terarah per pertanyaan); `src/ai-gateway/*`; `docs/onboarding/*`. Voice Guide dan Terminology Inventory dipakai untuk pilihan kata; tidak seluruhnya dibaca baris demi baris.

### Metode dan batas (baca ini)

1. Pengumpulan bukti dibagi ke lima agen baca-saja berdasarkan kelompok pertanyaan, lalu FIONA menyusun jawaban. FIONA memeriksa ulang sendiri klaim yang paling berisiko (hasil uji beban L1, status produksi 111 migrasi, D-089, D-101, ID tes F04-T07/F06-P15/F16-R01/BOB29, keberadaan badan hukum di footer). **Sitasi baris kode dan sebagian besar ID tes tidak diperiksa ulang satu per satu**; Second Eye sebaiknya memeriksa sampel.
2. **"TERSEDIA DI 4.0" berarti ada di kode `main`/staging dan dibuktikan oleh tes atau catatan verifikasi.** Produksi masih menjalankan build lama (`5b5b68d`, 111 migrasi), jadi **tidak satu pun jawaban boleh dibaca sebagai "sudah berjalan di sekolah nyata"**. Semua pengujian manusia dilakukan di staging dengan data sintetis.
3. Tidak ada nama orang atau sekolah nyata di dokumen ini. Satu-satunya nama yang disebut adalah badan hukum yang tertulis di footer aplikasi (Q002), dan itu ditandai PERLU VERIFIKASI HUKUM.
4. Dokumen ini tidak menyelesaikan gap, tidak membuat keputusan produk, tidak mengubah roadmap, dan tidak membuat janji atas nama PINTAR. Jawaban singkat adalah kalimat yang aman diucapkan; bila status bukan TERSEDIA DI 4.0, jawaban singkat adalah jawaban sementara yang jujur.
5. Perubahan dari tinjauan Langkah 1A (7 pertanyaan digabung, 4 rumusan diperluas, 7 pertanyaan baru, koreksi status) sudah diterapkan; pemetaan nomor lama → baru ada di Lampiran.
6. **Putaran 1C (6 Okt):** `main` digabung ulang (178e915); tinjauan 1B diterapkan (±930 sitasi diperiksa pemeriksa, ±94% tepat; sitasi yang salah dikoreksi); aturan baru dipatuhi: tidak ada detail keamanan sensitif (D-110(e)), tidak ada nama orang, tidak ada fakta internal tentang staf dalam jawaban singkat, setiap "TERSEDIA DI 4.0" diberi penanda `(main/staging; belum di produksi)`, dan "dijadwalkan" tidak dipakai untuk apa pun di luar 4.0. D-112 diterapkan: AI (Q049, Q055: produk vs alat berbantuan AI tidak digabung), Q032/Q034 (ditahan untuk keputusan produk), Q006/Q007 (lisensi bahan kementerian), kohort (Q003, Q004, Q088, Q090), dan model hak atas data (Q061, Q075, Q082, G2.2). D-111 adalah GREEN untuk melanjutkan persiapan infrastruktur, **bukan** #150 lulus dan bukan siap produksi. Dokumen ini INTERNAL (D-112(f)).

### Daftar isi

| Kelompok | Isi | Pertanyaan |
|---|---|---|
| 1 | Tentang PINTAR, perusahaan, konten, implementasi, guru | Q001–Q022 |
| 2 | Siswa, asesmen, laporan, sertifikat, AI | Q023–Q050 |
| 3 | Integritas, privasi, kepemilikan data, ekspor, keamanan, akun | Q051–Q069 |
| 4 | Backup, pemulihan, kesalahan manusia, perpindahan, hak akses, orang tua, retensi, keluar, dukungan | Q070–Q087 |
| 5 | Skalabilitas, regulasi, biaya, sistem lain, roadmap | Q088–Q100 |
| — | Pertanyaan yang PINTAR belum dapat jawab dengan yakin (gap, G1–G5) | — |
| — | Glosarium | — |
| — | Ringkasan: jumlah per status dan sensitivitas | — |
| — | Lampiran: pemetaan nomor | — |


---

## Kelompok 1 — Tentang PINTAR, perusahaan, konten, implementasi, guru (Q001–Q022)

> **Catatan lintas-pertanyaan untuk pembaca kelompok ini.**
> - Kondisi per `RESUME-2026-10-06.md`: ENGINEERING COMPLETE dinyatakan 5 Okt 2026 (JOURNEY-LOG butir 35; D-070(f)); produksi tetap di build `5b5b68d` dengan 111 migrasi, staging dan `main` 162. Semua "terbukti" di bawah berarti terbukti di kode, tes, dan staging dengan data sintetis; **bukan di produksi dan bukan dengan sekolah nyata**.
> - Dokumen ini tidak menyebut nama orang atau sekolah nyata. Peran disebut sebagai "pemilik produk", "Admin platform", "tim operasi PINTAR".

### Q001 — Sebenarnya PINTAR itu apa? Apa bedanya dengan LMS atau aplikasi ujian yang sudah kami pakai?

**Siapa yang kemungkinan bertanya:** Kepala sekolah
**Kemungkinan ditanya:** TINGGI

**Jawaban singkat:**
"PINTAR adalah platform untuk satu siklus belajar yang utuh di sekolah: guru menyiapkan pelajaran, siswa belajar dan diuji, lalu sekolah melihat bukti penguasaan dan, bila memenuhi syarat, sertifikat yang bisa diverifikasi. Kami tidak punya perbandingan tertulis dengan produk lain, jadi kami tidak akan mengatakan lebih baik dari siapa pun."

**Penjelasan:** Lingkup 4.0 (dibekukan lewat D-084/D-086, SCOPE-INVENTORY J1–J10): impor buku kerja Excel → tinjau, bekukan, terbitkan (J4) → guru menyediakan ke kelas (J5.4) → murid mengerjakan Pemetaan Awal, belajar, Uji Penguasaan, dan melihat hasil (J6) → bukti kelas untuk guru, kepala departemen, dekan (J7) → sertifikat yang dapat diverifikasi publik (J8). Ada juga Uji Cepat sekitar satu menit (J5.5). Sinyal integritas hanya ditinjau manusia dan tidak mengubah skor (J7.6). Siklus pra-uji/pasca-uji tanpa soal yang sama (D-008, D-040). Siklus ini dijalankan dari awal sampai akhir di staging dengan data sintetis (JOURNEY-LOG butir 33, 5 Okt). D-069(j) menyatakan modul pembelajaran pendidik bukan LMS, sistem SDM, atau platform CPD. Tidak ada dokumen perbandingan resmi dengan LMS atau aplikasi ujian tertentu, dan tidak ada satu kalimat definisi resmi 4.0.

**Mengapa PINTAR seperti ini:** Premis produk adalah bukti belajar yang dapat dipercaya (doc 06), bukan sekadar tempat menaruh materi atau ujian.

**Bukti / mekanisme di PINTAR:** Halaman `src/app/belajar`, `mengajar`, `studio`, `verifikasi/[token]`; JOURNEY-LOG butir 33.

**Sumber:**
- MEMBUKTIKAN: kode di atas; JOURNEY-LOG butir 33 (staging).
- MENETAPKAN ATURAN/LINGKUP: SCOPE-INVENTORY J1–J10; D-008, D-040, D-069(j), D-084, D-086; `docs/product/PINTAR-3.0-PHILOSOPHY.md` (dokumen era 3.0).
- Perbandingan produk lain: **tidak ditemukan** (dicari "LMS", "bandingkan").

**Yang tidak boleh dikatakan:** "Lebih baik dari LMS X"; "AI yang mengajar atau menilai"; "LMS lengkap"; "sudah dipakai banyak sekolah"; "ada aplikasi seluler / offline penuh".

**Status:** SEBAGIAN
**Tingkat sensitivitas:** PENTING

---

### Q002 — Siapa perusahaan di belakang PINTAR, badan hukumnya apa, dan siapa pemiliknya?

**Siapa yang kemungkinan bertanya:** Pengurus yayasan
**Kemungkinan ditanya:** TINGGI

**Jawaban singkat:**
"Footer aplikasi kami mencantumkan nama badan hukum, tetapi dokumen pendukungnya, seperti akta, izin usaha, dan susunan kepemilikan, tidak ada di tim produk. Kami akan menyerahkan informasi resminya langsung dari pemilik, dan tidak akan menebak di luar itu."

**Penjelasan:** Fakta yang ditemukan: footer aplikasi memuat empat baris, yaitu penanggung jawab, badan hukum, email, dan domain, tanpa klaim hukum apa pun. Badan hukum yang tertulis adalah **"PT ZAYD PINTAR SELALU"** (konstanta `BADAN_HUKUM` di `src/components/KakiPintar.tsx:29` dan `src/components/email/bingkai.ts:92`; tes UX1-S1-KAKI-01). Domain `pintarselalu.com`. Yang **tidak** ditemukan: akta, NIB/NPWP, izin usaha, pemilik atau pemegang saham, alamat perusahaan, ketentuan layanan, kebijakan privasi, kontrak, SLA (dicari "badan hukum", "legal entity", "kontrak", "SLA", "terms"). Apakah nama itu benar, aktif, dan menjadi pihak yang akan menandatangani kontrak dengan sekolah **tidak dapat dipastikan dari repositori**. D-031 memuat isi MOU (harapan sedikitnya 150 sekolah × 400 siswa pada tahun pertama); yang tidak disebut hanya para pihaknya.

**Mengapa PINTAR seperti ini:** Footer sengaja hanya memuat fakta identitas yang diberikan pemilik; klaim hukum tidak ditambahkan (UX1-S1-KAKI-01).

**Bukti / mekanisme di PINTAR:** Footer aplikasi dan templat email.

**Sumber:** MEMBUKTIKAN: `src/components/KakiPintar.tsx:29`; `src/components/email/bingkai.ts:92-94`; tes UX1-S1-KAKI-01. MENETAPKAN ATURAN: D-031. Dokumen badan hukum: **tidak ditemukan**.

**Yang tidak boleh dikatakan:** status badan hukum (aktif, terdaftar, berizin), struktur kepemilikan, atau kesediaan menandatangani kontrak sebagai pihak itu; "MOU" sebagai referensi tanpa seizin pemilik.

**Status:** PERLU VERIFIKASI HUKUM
**Tingkat sensitivitas:** PENTING

---

### Q003 — Sekolah mana saja yang sudah memakai PINTAR? Boleh kami tanya langsung ke mereka, dan apakah ada sekolah yang pernah berhenti, dan mengapa?

**Siapa yang kemungkinan bertanya:** Pengurus yayasan, komite sekolah
**Kemungkinan ditanya:** TINGGI

**Jawaban singkat:**
"Belum ada sekolah pengguna yang bisa dijadikan referensi."

**Penjelasan:** Produksi memuat dua sekolah milik pemilik produk yang diklasifikasikan sebagai sekolah nyata (D-003), dibuat lewat database oleh koordinator, dengan dua periode akademik 2026/2027, "satu orang dan tanpa sesi ujian" (RELEASES.md; D-103). Karena belum ada sekolah pengguna lain, tidak ada catatan sekolah yang berhenti. Semua uji manusia di staging sintetis (D-036; D-064; D-084 "Golden School" memakai orang fiktif). D-083 menarik tanggal uji 5 Oktober dan menyatakan kesiapan sekitar 1 Desember sebagai horizon perencanaan, bukan tanggal rilis; kedua kohort D-035 (1 November dan 1 Desember) masih terbuka ("both need a decision"), jadi jangan disebut sebagai jadwal. Tidak ditemukan: daftar sekolah pelanggan, testimoni, referensi, catatan sekolah yang berhenti (dicari testimon, referensi sekolah, churn, berhenti).

**Mengapa PINTAR seperti ini:** Aturan: jangan mengklaim sekolah nyata memakai, jumlah pengguna, atau testimoni tanpa catatan resmi.

**Bukti / mekanisme di PINTAR:** Tidak ada.

**Sumber:** MEMBUKTIKAN: `docs/coordination/RELEASES.md` ("Production data operations"). MENETAPKAN ATURAN: D-003, D-035, D-036, D-064, D-083, D-103. Referensi sekolah: **tidak ditemukan**.

**Yang tidak boleh dikatakan:** "Sekolah X sudah memakai"; "boleh tanya sekolah lain"; "belum ada yang berhenti" (tidak ada dasar; hanya belum ada pengguna).

**Status:** PERLU VERIFIKASI TEKNIS (tidak ada catatan sekolah pengguna)
**Tingkat sensitivitas:** PENTING

---

### Q004 — Apakah PINTAR sudah siap dipakai di sekolah sungguhan, atau masih tahap uji coba?

**Siapa yang kemungkinan bertanya:** Pengurus yayasan
**Kemungkinan ditanya:** TINGGI

**Jawaban singkat:**
"Rekayasanya dinyatakan selesai pada 5 Oktober dan sudah diuji di lingkungan uji, tetapi itu belum berarti siap produksi. Pekerjaan backup dan pemulihan belum lulus, uji beban 1.000 siswa belum memenuhi target, dan produksi masih menjalankan versi lama. Saat ini kami berada di tahap uji terkendali, bukan penerimaan sekolah luas."

**Penjelasan:**
- ENGINEERING COMPLETE dinyatakan 5 Okt (JOURNEY-LOG butir 35; D-070(f) hanya menetapkan syaratnya). Gerbang berikutnya: UI/UX POLISHED → persetujuan pemilik → persetujuan penguji penerimaan → pilot pendidik sekitar 20–30 orang → perluasan (D-052(b)); tidak ditemukan catatan bahwa gerbang itu sudah dilewati.
- #150 (backup/DR) NOT PASS, diterima; gerbang keras PRODUCTION READY (D-104, D-106). D-111 (6 Okt) menyatakan GREEN untuk melanjutkan persiapan infrastruktur milik pemilik; **itu bukan #150 lulus dan bukan siap produksi**. Kunci/escrow, kustodian kedua, dan salinan eksternal masih menunggu pemilik (RESUME-2026-10-06). RPO 24 jam sementara, tanpa PITR (D-103).
- Beban: uji L1 pada 1.000 siswa bersamaan gagal pada konfigurasi sekarang (CAP-02 FAIL; D-089); selama pengujian awal maksimal 50 orang sekaligus (D-089(d)).
- Produksi tertinggal (111 vs 162 migrasi). D-106(d): ketahanan administrator kedua wajib sebelum penggunaan sekolah nyata. Lokasi data Singapura (RELEASES.md:34).
- Konflik sumber kecil: JOURNEY-LOG butir 35 menyatakan polesan UI hanya setelah #150; D-104(e) (6 Okt, lebih baru) mengizinkan kerja UI/UX berjalan terpisah untuk uji terkendali. Yang baru berlaku.

**Mengapa PINTAR seperti ini:** Tahapan gerbang dibuat berurutan agar kesiapan dibuktikan, bukan diumumkan.

**Bukti / mekanisme di PINTAR:** Lihat Q070–Q072 dan Q088.

**Sumber:**
- MEMBUKTIKAN: JOURNEY-LOG butir 35 (deklarasi ENGINEERING COMPLETE), 38, 41–43; RELEASE-CHECKLIST CAP-02; RESUME-2026-10-06; `docs/coordination/RELEASES.md:34`.
- MENETAPKAN ATURAN: D-052(b), D-070(f), D-083, D-089, D-103, D-104, D-106, D-111.

**Yang tidak boleh dikatakan:** "Sudah siap produksi"; "ENGINEERING COMPLETE berarti siap pakai"; "sudah lulus uji beban"; "backup/DR sudah aman"; "#150 sudah lulus" atau "GREEN" (D-111 hanya izin melanjutkan persiapan infrastruktur); tanggal mulai.

**Status:** SEBAGIAN
**Tingkat sensitivitas:** KRITIS

---

### Q005 — Apa saja yang TIDAK bisa dilakukan PINTAR?

**Siapa yang kemungkinan bertanya:** Kepala sekolah yang skeptis
**Kemungkinan ditanya:** TINGGI

**Jawaban singkat:**
"Yang paling penting untuk diketahui: PINTAR tidak punya portal orang tua, tidak bisa mengekspor data sekolah ke Excel, tidak terhubung ke Dapodik atau e-Rapor, tidak bisa dipakai penuh tanpa internet, dan AI tidak menilai atau menerbitkan apa pun. Kami lebih suka Anda tahu ini sejak awal."

**Penjelasan:** Di luar 4.0 (SCOPE-INVENTORY §10): email undangan, notifikasi keamanan ke admin sekolah, ganti nama pengguna mandiri, MDM, layar pembuatan sekolah atau pendaftaran mandiri, lencana dan poin, helpdesk sebagai produk (ditinjau 2027), tautan ajaib atau email-kata sandi untuk murid, remediasi adaptif otomatis, ulang pasca-uji tanpa batas, umpan jawaban langsung, layanan produksi kartu, jaminan kotak masuk email, foto murid di kartu atau sertifikat. LATER (doc 09, tanpa versi): pengalaman orang tua, SSO/integrasi, alur ujian kertas, kasus integritas, IRT, laporan terjadwal, berbagi konten antar institusi. PARK: pengawasan webcam/mikrofon/layar, platform offline luas, OMR, kartu NFC, perbandingan antar sekolah, SQL/metrik bebas. Masuk lewat WhatsApp dipindahkan keluar dari 4.0; tidak ada jadwal (D-098(c)). Video/audio/slide di luar pengujian awal (D-050). Tidak ada ekspor data sekolah (hanya cetak; kandidat 4.5, D-110(b)). Tidak ada PITR (D-103, D-106(h)). AI hanya fondasi tanpa pemanggilan penyedia, dan AI tidak berotoritas pedagogis (doc 10 §2). Juga tidak ada: aplikasi seluler; penyunting soal di layar («Untuk mengubah soal, unggah buku kerja yang sudah diperbaiki di Buat Paket.», `src/lib/hle.ts:3469`); perpanjangan tenggat dari layar guru; penonaktifan akun guru (Q022).

**Mengapa PINTAR seperti ini:** Prinsip: katakan "PINTAR tidak melakukan itu" bila itu jawabannya.

**Bukti / mekanisme di PINTAR:** `docs/product/SCHOOL-DATA-EXPORT-4.0.md`; `src/ai-gateway/README.md`.

**Sumber:**
- MEMBUKTIKAN: SCHOOL-DATA-EXPORT-4.0.md; `src/lib/hle.ts:3469`; `src/ai-gateway/README.md`.
- MENETAPKAN ATURAN: SCOPE-INVENTORY §10; `docs/rebuild/09`; `docs/rebuild/10` §2; D-050, D-098(c), D-103, D-106(h), D-110(b).

**Yang tidak boleh dikatakan:** "Orang tua bisa memantau"; "bisa ekspor ke Excel"; "bisa offline penuh"; "AI menyusun atau menilai"; "semua mata pelajaran dan kurikulum".

**Status:** TIDAK DILAKUKAN PINTAR (daftar batas, dengan bukti dan aturan di atas)
**Tingkat sensitivitas:** PENTING

---

### Q006 — Siapa yang membuat dan memeriksa konten pelajaran di PINTAR, dan apakah ada yang dibuat oleh AI? Bagaimana kami tahu isinya benar?

**Siapa yang kemungkinan bertanya:** Wakil kepala sekolah kurikulum
**Kemungkinan ditanya:** TINGGI

**Jawaban singkat:**
"Ada dua asal konten: konten standar PINTAR dan konten sekolah sendiri. Alur penerbitan mengharuskan orang kedua menyetujui sebelum terbit. Untuk konten standar yang kami siapkan, kami belum punya catatan bahwa guru mata pelajaran memeriksanya, dan persiapannya dibantu AI dengan pemeriksaan oleh koordinator."

**Penjelasan:**
- Dua asal konten (J4.11; D-085 M6). Alur Studio dikunci di database: susun dan ajukan (Guru, Kepala departemen, Admin sekolah) → setujui (Kepala departemen/Admin sekolah; penulis tidak boleh menyetujui pekerjaannya sendiri) → kunci rilis (orang kedua) → terbitkan (hanya Admin sekolah; Kepala departemen tidak bisa). Peninjau melihat soal, kunci, dan alasan. Catatan mutu soal ditinjau satu per satu sebelum terbit. Dekan tidak punya kemampuan Studio (INV-19; F06-N02).
- Konten yang ada (SD kelas 5 Matematika Bab 1–9, SMA kelas X Matematika Bab 1–7, SMA kelas XI Geografi Bab 1–4; 20 buku kerja di `docs/onboarding/konten/`) disusun lewat persiapan berbantuan AI dengan pemeriksaan oleh koordinator (`LANA.md:5`), lalu diuji alurnya di staging. Sumbernya berbeda: sembilan buku kerja SD kelas 5 "diadaptasi dari Buku Panduan Guru Matematika untuk SD/MI Kelas V" (`docs/onboarding/konten/sd5_*.py`); Geografi kelas XI dan Matematika kelas X dari buku siswa (`LANA.md:25, 56`). Papan kerja mencatat "CONTENT PASS", bukan tinjauan guru mata pelajaran.
- Tidak ditemukan: catatan tinjauan manusia ahli bidang atas konten itu; pernyataan lisensi atau hak pakai bahan sumber (D-069(g) hanya untuk demo pendidik); ini masuk G2.3 dan G4. "Diadaptasi dari" bukan izin (D-112(c)); buku panduan guru (sembilan buku kerja SD kelas 5) dan buku siswa (Geografi XI, Matematika X) adalah bahan yang berbeda dan hak pakainya harus diverifikasi terpisah.
- Pengisian pustaka standar pusat tertahan: JOURNEY-LOG baris 139 (2 Okt) "belum ada jalur authoring"; D-029 menolak impor ke pustaka kanonik; G2 (siapa menyiapkan dan menyetujui) belum diputuskan. Jalur penampilan ke guru ada (`src/app/studio/kanonik`; M6-S01, M6-K01), pengisian pustaka belum.
- AI tidak menerbitkan apa pun sendiri; penerbitan selalu oleh manusia (INV-32; doc 10).

**Mengapa PINTAR seperti ini:** Otoritas pedagogis ada pada manusia; penulis tidak boleh menyetujui pekerjaannya sendiri.

**Bukti / mekanisme di PINTAR:** `src/components/studio/langkah.ts`; tes F06-N02, M6-S01, M6-K01; `docs/onboarding/konten/` (20 berkas).

**Sumber:**
- MEMBUKTIKAN: `src/components/studio/langkah.ts`; tes di atas; JOURNEY-LOG butir 13, baris 139.
- MENETAPKAN ATURAN: D-029, D-041, D-085 (M6), D-088(h); SCOPE-INVENTORY J1.5, J4.3, J4.11; INV-32; `docs/coordination/briefs/LANA.md`; BOARD (LANA-01–21). Tinjauan ahli bidang dan lisensi bahan sumber: **tidak ditemukan**.

**Yang tidak boleh dikatakan:** "berlisensi", "resmi dari kementerian", "boleh dipakai bebas" ("diadaptasi dari" bukan izin; D-112(c)); "Semua konten diperiksa guru atau pakar"; "konten standar sudah tersedia untuk semua sekolah"; "AI tidak dipakai membuat konten"; "kesesuaian kurikulum terjamin".

**Status:** SEBAGIAN; kedua: PERLU VERIFIKASI HUKUM (lisensi dan hak pakai bahan kementerian harus diverifikasi sebelum distribusi ke sekolah nyata, D-112(c))
**Tingkat sensitivitas:** PENTING

---

### Q007 — Apakah isinya sesuai Kurikulum Merdeka dan capaian pembelajaran? Mata pelajaran dan kelas apa saja yang sudah ada?

**Siapa yang kemungkinan bertanya:** Wakil kepala sekolah kurikulum
**Kemungkinan ditanya:** TINGGI

**Jawaban singkat:**
"Yang ada hari ini adalah buku kerja Matematika kelas 5 dan kelas X, serta Geografi kelas XI. Kami belum punya pemetaan resmi ke capaian pembelajaran Kurikulum Merdeka, jadi kami tidak akan mengklaim kesesuaian."

**Penjelasan:** Buku kerja yang ada: SD kelas 5 Matematika Bab 1–9; SMA kelas X Matematika Bab 1–7; SMA kelas XI Geografi Bab 1–4 (20 berkas di `docs/onboarding/konten/`). Keberadaan berkas bukan bukti bahwa konten tersedia di sekolah. Kolom "tujuan pembelajaran" opsional di templat (`src/lib/unggah-kontrak.ts:56-112`). Tidak ditemukan kata "Kurikulum Merdeka" atau "Capaian Pembelajaran" di kode, teks layar, atau keputusan; tidak ada peta ke fase atau CP. Sumber penyusunan: SD kelas 5 diadaptasi dari Buku Panduan Guru Matematika untuk SD/MI Kelas V; Geografi kelas XI dan Matematika kelas X dari buku siswa (`LANA.md:25, 56`). Sumber itu tidak sama dengan klaim kesesuaian CP. Lisensi bahan sumber: lihat G2.3 dan G4. Buku panduan guru (SD5) dan buku siswa (Geografi XI, Matematika X) dibedakan; "diadaptasi dari" bukan izin (D-112(c)). Konten di produksi tidak diverifikasi.

**Mengapa PINTAR seperti ini:** Kesesuaian kurikulum membutuhkan pemeriksaan yang belum dilakukan.

**Bukti / mekanisme di PINTAR:** `docs/onboarding/konten/*.xlsx`; templat `src/lib/unggah-kontrak.ts`.

**Sumber:** MEMBUKTIKAN: keberadaan berkas; BOARD (LANA-01–21). Pemetaan CP: **tidak ditemukan** (dicari "kurikulum merdeka", "capaian pembelajaran", "fase" di `docs/`, `src/`, `supabase/`).

**Yang tidak boleh dikatakan:** "berlisensi", "resmi dari kementerian", "boleh dipakai bebas" (D-112(c)); "Sesuai Kurikulum Merdeka"; "selaras CP"; "tersedia untuk semua mata pelajaran dan kelas"; "sudah dipakai di sekolah".

**Status:** PERLU VERIFIKASI TEKNIS; kedua: PERLU VERIFIKASI HUKUM (lisensi dan hak pakai bahan kementerian sebelum distribusi ke sekolah nyata, D-112(c))
**Tingkat sensitivitas:** PENTING

---

### Q008 — Apakah PINTAR menjamin nilai siswa naik?

**Siapa yang kemungkinan bertanya:** Komite sekolah
**Kemungkinan ditanya:** SEDANG

**Jawaban singkat:**
"Tidak. PINTAR mengukur dan menunjukkan bukti penguasaan, bukan menjamin hasil. Perbandingan selalu dengan diri siswa sendiri."

**Penjelasan:** Tidak ada klaim atau komitmen kenaikan nilai di sumber. PINTAR mengukur selisih Pemetaan Awal ke Uji Penguasaan dan penguasaan terhadap batas yang ditetapkan sekolah (D-081, M3). Teks layar menyatakan perbandingan selalu dengan diri sendiri. Hasil tidak mengubah apa pun secara otomatis; "bukti belum cukup" bukan hasil buruk (X.5). Tidak ada bukti dampak dari sekolah nyata (Q009).

**Mengapa PINTAR seperti ini:** Produk berbasis bukti tidak boleh menjanjikan hasil yang tidak dapat dibuktikan.

**Bukti / mekanisme di PINTAR:** Hasil dan penguasaan di layar siswa dan guru.

**Sumber:** MENETAPKAN ATURAN: D-081, D-085 (M3); SCOPE-INVENTORY J6.11, X.5; teks `tur.nt.5.isi` di `src/lib/hle.ts`.

**Yang tidak boleh dikatakan:** "Meningkatkan nilai atau peringkat"; "terbukti naik"; jaminan hasil ujian apa pun.

**Status:** TIDAK DILAKUKAN PINTAR (tidak dijanjikan)
**Tingkat sensitivitas:** TINGGI

---

### Q009 — Kalau kami pakai tiga bulan, apa yang konkret berubah di sekolah kami? Adakah buktinya dari sekolah lain?

**Siapa yang kemungkinan bertanya:** Kepala sekolah
**Kemungkinan ditanya:** TINGGI

**Jawaban singkat:**
"Yang bisa kami tunjukkan adalah apa yang bisa dilakukan sekolah dengan PINTAR: siklus belajar, bukti kelas, laporan cetak, dan sertifikat. Bukti dampak dari sekolah lain belum ada, jadi kami tidak akan menyebut angka."

**Penjelasan:** Yang dapat dijalankan (di staging sintetis): siklus Pemetaan Awal → pelajaran → Uji Penguasaan, bukti kelas, laporan cetak, sertifikat, «Minta membaca lagi» (JOURNEY-LOG baris 77 dan 94); cetak laporan: `SCHOOL-DATA-EXPORT-4.0.md:22`. Bukti kelas tampil hanya bila bukti resmi cukup (J7.1; D-064). "Kelas pilot nyata pertama" adalah konfirmasi operasional, bukan prasyarat (D-064). Tidak ditemukan data dampak, studi, atau studi kasus dari sekolah nyata (dicari impact, dampak, case study).

**Mengapa PINTAR seperti ini:** Tidak ada sekolah nyata yang sudah memakai; mengarang dampak merusak kepercayaan.

**Bukti / mekanisme di PINTAR:** Alur belajar dan laporan (lihat Q019, Q039).

**Sumber:** MEMBUKTIKAN: JOURNEY-LOG baris 77, 94; SCHOOL-DATA-EXPORT-4.0.md:22. MENETAPKAN ATURAN: D-064; SCOPE-INVENTORY J7.1. Data dampak: **tidak ditemukan**.

**Yang tidak boleh dikatakan:** angka peningkatan; "hasil dari sekolah lain"; "dalam tiga bulan Anda akan melihat X".

**Status:** PERLU VERIFIKASI TEKNIS (tidak ada bukti dampak)
**Tingkat sensitivitas:** PENTING

---

### Q010 — Dari daftar sampai guru bisa mulai mengajar, langkahnya apa saja dan siapa mengerjakan apa?

**Siapa yang kemungkinan bertanya:** Administrator sekolah
**Kemungkinan ditanya:** TINGGI

**Jawaban singkat:**
"Tim operasi PINTAR menyiapkan sekolah dan admin pertamanya; selanjutnya admin sekolah menyusun struktur, staf, siswa, dan kartu sendiri, lalu pelajaran diunggah, ditinjau, dan diterbitkan sebelum guru menyediakannya ke kelas. Urutan ini sudah dilalui di lingkungan uji, tetapi belum oleh sekolah nyata dan belum ada ukuran lamanya."

**Penjelasan:** Urutan terbukti pada sekolah uji di staging (JOURNEY-LOG butir 33):
1. Operator PINTAR mendirikan sekolah lewat skrip tunggal `operator_found_school` (alur `found-school.yml`, hanya staging; migrasi `20261108100000`).
2. Operator mencatat admin sekolah pertama dan memberinya peran «Admin sekolah».
3. Admin sekolah mengaktifkan akunnya sendiri (kode email → nama pengguna → PIN → kata sandi), lalu: kode sekolah 3 karakter (Pendataan), struktur Bagian/Tingkat/Kelas (Konfigurasi), staf (Aktivasi + Peran & akses), siswa (Pendataan: tempel atau CSV, pilih Kelas, pemetaan; 50 baris pertama diperiksa bila >100 baris), dan kartu kelas dalam satu tekan (cetak).
4. Unggah buku kerja (Studio), Kepala departemen/Admin meninjau, menyetujui, mengunci; Admin menerbitkan dan menetapkan «Batas ketuntasan» per pelajaran (tanpa nilai bawaan; D-081, D-088(b)).
5. Guru mengaktifkan akun, Siapkan → Sediakan ke Kelas; siswa masuk dengan kartu dan PIN. «Persiapan sekolah» menampilkan sisa langkah (ADM-02).
Tidak ditemukan: panduan pelaksanaan yang benar-benar dipakai (Panduan Penguji Pilot berstatus "Belum dipakai" dan sebagian usang); langkah ini belum dijalankan di produksi atau oleh sekolah nyata; tidak ada estimasi waktu terukur.

**Mengapa PINTAR seperti ini:** Sekolah menjalankan dirinya sendiri setelah serah-terima (J1.1); tanpa SQL tangan.

**Bukti / mekanisme di PINTAR:** `.github/workflows/found-school.yml`; halaman Konfigurasi, Aktivasi, Pendataan, Studio, Mengajar.

**Sumber:**
- MEMBUKTIKAN: JOURNEY-LOG butir 33 (GS-01–21); `.github/workflows/found-school.yml`; migrasi `20261108100000`.
- MENETAPKAN ATURAN: D-081, D-085 (M1), D-088(b); SCOPE-INVENTORY J1.1, J3; `docs/onboarding/PINTAR-Panduan-Penguji-Pilot.md` (draf, sebagian usang).

**Yang tidak boleh dikatakan:** durasi atau lamanya; "sekolah menyiapkan sendiri semuanya" (pendirian sekolah oleh tim PINTAR); "sudah dilakukan sekolah nyata".

**Status:** SEBAGIAN
**Tingkat sensitivitas:** PENTING

---

### Q011 — Siapa yang membuat akun sekolah kami? Bisa kami buat sendiri?

**Siapa yang kemungkinan bertanya:** Administrator sekolah
**Kemungkinan ditanya:** TINGGI

**Jawaban singkat:**
"Tidak bisa mendaftar sendiri. Sekolah disiapkan oleh tim operasi PINTAR lewat proses yang terkendali dan tercatat; setelah serah-terima, admin sekolah Anda mengelola sisanya sendiri."

**Penjelasan:** Sekolah didirikan Admin platform atau operator lewat proses terkendali, berversi, dan teraudit (J1.1; D-085 M1; D-084). Tanpa pendaftaran mandiri, tanpa layar pembuatan sekolah, tanpa SQL tangan (SCOPE-INVENTORY §10). `operator_found_school` hanya dipanggil oleh `found-school.yml` (jalur manual, **hanya staging**, tanpa target produksi). Pendirian sekolah di produksi memerlukan persetujuan pemilik (komentar alur; M1). Dua sekolah produksi saat ini dibuat lewat database sebelum jalur ini ada (RELEASES.md; D-013). Setelah serah-terima, admin sekolah mengelola struktur, staf, siswa sendiri (J3; D-101; JOURNEY-LOG GS-04–GS-11).

**Mengapa PINTAR seperti ini:** Tidak ada pendaftaran publik; setiap sekolah masuk dengan persiapan dan serah-terima yang teraudit.

**Bukti / mekanisme di PINTAR:** `.github/workflows/found-school.yml:1-12`.

**Sumber:**
- MEMBUKTIKAN: `.github/workflows/found-school.yml`; JOURNEY-LOG GS-04–GS-11.
- MENETAPKAN ATURAN: D-013, D-084, D-085 (M1), D-101; SCOPE-INVENTORY J1.1, §10.

**Yang tidak boleh dikatakan:** "Daftar dan langsung jalan"; "buat akun sendiri di situs".

**Status:** SEBAGIAN (disiapkan admin platform; sekolah tidak bisa mendaftar sendiri)
**Tingkat sensitivitas:** PENTING

---

### Q012 — Data siswa kami ada di Excel atau Dapodik. Bisa langsung dimasukkan sekaligus, atau harus diketik satu per satu?

**Siapa yang kemungkinan bertanya:** Operator sekolah
**Kemungkinan ditanya:** TINGGI

**Jawaban singkat:**
"Daftar siswa bisa dimasukkan sekaligus lewat berkas CSV atau tempel dari spreadsheet. Kami tidak mengimpor langsung dari Dapodik, dan staf tidak bisa dimasukkan massal."

**Penjelasan:** Siswa: Pendataan (hanya Admin sekolah/Admin platform) menerima CSV/TSV/TXT atau tempel dari spreadsheet; kolom dipetakan ke lima bidang saja (nama, ID orang, kelas, peran, program); hanya peran siswa; hanya nama yang wajib; database memeriksa tiap baris; kegagalan per baris tidak dibuang diam-diam; di atas 100 baris proses berhenti setelah 50 baris pertama sampai admin memeriksa; tahan koneksi putus. Tes: UX1-DATA-BERKAS-01, UX1-DATA-TAHAP-01, F10-M01, F10-M02, F18-I01. ID institusi dibuat PINTAR, bukan dari berkas. Staf: tidak lewat impor massal (baris staf ditolak, F10-M01); dimasukkan satu per satu lewat Aktivasi dan Peran & akses. Buku kerja pelajaran (.xlsx) berbeda dari daftar siswa: batas 5 MB, 10.000 baris, 200 kolom (D-030(a)); putaran Excel dan Google Sheets lulus (ADM-09). Tidak ada: .xlsx langsung untuk daftar siswa (harus disimpan sebagai CSV atau ditempel); kolom NIS/NISN/email/tanggal lahir/jenis kelamin; impor Dapodik.

**Mengapa PINTAR seperti ini:** Siswa dimasukkan melalui pemeriksaan database agar tidak ada yang masuk dengan salah tanpa terlihat.

**Bukti / mekanisme di PINTAR:** `src/lib/pendataan-kontrak.ts`; `src/components/pendataan/BacaDanPetakan.tsx:100`; migrasi `20260926110000`.

**Sumber:**
- MEMBUKTIKAN: kode dan tes di atas.
- MENETAPKAN ATURAN: D-016, D-030(a); SCOPE-INVENTORY J3.6.
- Impor Dapodik: **tidak ditemukan**.

**Yang tidak boleh dikatakan:** "Impor Dapodik atau Excel langsung"; "semua data siswa terbawa (NISN dan seterusnya)"; "impor staf sekaligus".

**Status:** SEBAGIAN
**Tingkat sensitivitas:** PENTING

---

### Q013 — Yayasan kami punya beberapa unit sekolah. Bisa dikelola dari satu tempat?

**Siapa yang kemungkinan bertanya:** Pengurus yayasan
**Kemungkinan ditanya:** SEDANG

**Jawaban singkat:**
"Beberapa sekolah bisa memakai PINTAR, tetapi belum ada tingkat yayasan: tidak ada dasbor gabungan atau laporan lintas unit. Tiap sekolah berdiri sebagai satu lingkungan terpisah."

**Penjelasan:** Pohon organisasi: sekolah → Jenjang (tersembunyi) → Bagian → Reguler (tersembunyi) → Tingkat → Kelas; akar adalah satu sekolah tanpa induk (migrasi `organisation.sql:77-82`). Tiap sekolah adalah tenant terpisah (INV-13). Satu orang dapat memegang peran di beberapa sekolah (Admin sekolah di dua sekolah: F10-G02; Pendataan punya pemilih sekolah). Guru yang pindah antar sekolah: belum ada alur resmi (D-049(d)). Tidak ditemukan: level yayasan atau grup, laporan gabungan, dasbor yayasan, peran yayasan. Perbandingan antar sekolah adalah PARK; berbagi konten antar institusi adalah LATER.

**Mengapa PINTAR seperti ini:** Batas tenant adalah institusi (INV-13).

**Bukti / mekanisme di PINTAR:** `supabase/migrations/20260912004244_organisation.sql:77-82`; `src/app/pendataan/page.tsx`.

**Sumber:** MEMBUKTIKAN: migrasi di atas; tes F10-G02. MENETAPKAN ATURAN: D-006, D-049; INV-13; `docs/rebuild/09`. Peran yayasan: **tidak ditemukan**.

**Yang tidak boleh dikatakan:** "Satu dasbor yayasan"; "laporan gabungan"; "satu login untuk semua unit".

**Status:** SEBAGIAN (beberapa sekolah bisa ada; tidak ada pengelolaan satu pintu)
**Tingkat sensitivitas:** PENTING

---

### Q014 — Kami sekarang pakai sistem lain. Bisa memindahkan data dari sana?

**Siapa yang kemungkinan bertanya:** Administrator sekolah yang pindah sistem
**Kemungkinan ditanya:** SEDANG

**Jawaban singkat:**
"Daftar siswa dan materi pelajaran bisa dimasukkan lewat berkas. Riwayat nilai lama dan sambungan otomatis dari sistem lain belum bisa."

**Penjelasan:** Sama dengan Q012: daftar siswa via CSV dan buku kerja untuk konten. Format JSON "Paket Terstruktur" tersedia untuk konten dari produsen mesin. Perpindahan siswa antar sekolah PINTAR hanya di dalam PINTAR dan hanya keanggotaan dan pendaftaran yang ikut (SCHOOL-DATA-EXPORT-4.0.md §D). Tidak ada: impor riwayat nilai, hasil, atau bukti dari sistem lain; konektor ke LMS, Dapodik, rapor (dicari moodle, classroom, dapodik, rapor, NISN, SIAKAD: tidak ada); SSO/integrasi adalah LATER.

**Mengapa PINTAR seperti ini:** Bukti belajar PINTAR dibuat dari aktivitas di PINTAR (doc 06), bukan diimpor.

**Bukti / mekanisme di PINTAR:** Lihat Q012.

**Sumber:** MEMBUKTIKAN: SCHOOL-DATA-EXPORT-4.0.md §D; `src/lib/hle.ts` (`studio.unggah.mudah_penjelasan`). MENETAPKAN ATURAN: `docs/rebuild/09` (LATER).

**Yang tidak boleh dikatakan:** "Data lama dimigrasi"; "bawa nilai lama"; "integrasi dengan sistem kami".

**Status:** SEBAGIAN
**Tingkat sensitivitas:** PENTING

---

### Q015 — Siapa yang melatih guru kami? Apakah ada panduan atau pelatihan?

**Siapa yang kemungkinan bertanya:** Kepala sekolah
**Kemungkinan ditanya:** TINGGI

**Jawaban singkat:**
"Di dalam PINTAR ada tur pertama kali untuk guru dan tombol Bantuan, serta «Laporkan masalah». Program pelatihan guru yang terjadwal belum ada dan belum diputuskan siapa yang menyelenggarakannya."

**Penjelasan:** Dalam produk: tur pertama kali 7 langkah untuk pengajar (di `/mengajar`; tes TOUR-P01, TOUR-N01–N03, UX1-TUR-*); tombol Bantuan di shell; «Laporkan masalah» untuk staf (D-037). Tier 1 adalah admin sekolah dan tim operasi PINTAR; Tier 2 koordinator. Draf Panduan Penguji (`docs/onboarding/PINTAR-Panduan-Penguji-Pilot.md`) berstatus "Draf… Belum dipakai", untuk pilot pendidik di staging; sebagian usang. Tidak ditemukan: program atau jadwal pelatihan, pelatih yang ditunjuk, bahan pelatihan untuk sekolah, kebijakan pelatihan (dicari pelatihan, training, workshop). Modul pembelajaran pendidik (J9) adalah materi strategi mengajar (demo [UJI INTERNAL]), bukan pelatihan memakai PINTAR.

**Mengapa PINTAR seperti ini:** Pelatihan belum menjadi baris lingkup 4.0.

**Bukti / mekanisme di PINTAR:** `src/app/mengajar/page.tsx:224` (tur); tes TOUR-*, UX1-TUR-*.

**Sumber:** MEMBUKTIKAN: tes di atas. MENETAPKAN ATURAN: D-037, D-069(g). Program pelatihan: **tidak ditemukan**.

**Yang tidak boleh dikatakan:** "Kami melatih guru Anda"; "ada pelatihan tersertifikasi"; jadwal atau biaya.

**Status:** KEBIJAKAN BELUM DIPUTUSKAN — ▲ BELUM DIPUTUSKAN HARI INI
**Tingkat sensitivitas:** PENTING

---

### Q016 — Kami pernah kecewa dengan vendor teknologi yang menghilang setelah kontrak. Apa yang membuat PINTAR berbeda?

**Siapa yang kemungkinan bertanya:** Sekolah yang pernah kecewa dengan vendor
**Kemungkinan ditanya:** TINGGI

**Jawaban singkat:**
"Yang bisa kami tawarkan adalah prinsip dan kejujuran: data sekolah tetap milik sekolah dan kami tidak boleh menahannya. Tetapi unduh data dan alur keluar belum dibangun, dan pemulihan kami masih punya celah yang kami sebutkan terbuka, jadi kami tidak akan berjanji lebih dari yang ada."

**Penjelasan:** D-110 (NO HOSTAGE DATA): data sekolah milik sekolah; tidak boleh ada hambatan teknis atau kontrak untuk keluar; (b) ekspor mandiri adalah kandidat 4.5, belum ada; (f) keputusan bukan bukti implementasi. Kode: tidak ada ekspor data; tidak ada alat tim untuk mengekstrak satu sekolah (SCHOOL-DATA-EXPORT-4.0.md). Sertifikat tetap dapat diverifikasi lewat tautan (J8.6). Pemulihan: #150 NOT PASS; tidak ada salinan eksternal aktif; escrow dan kustodian kedua menunggu pemilik (RESUME-2026-10-06; D-106, D-107, D-109). Satu Admin platform; yang kedua wajib sebelum 23 September 2027 (J1.2) dan sebelum penggunaan sekolah nyata (D-106(d)). Break-glass: dokumen dan uji wajib sebelum produksi (J1.7). Tidak ada: kontrak, SLA, eskrow kode, rencana kesinambungan bisnis, jaminan retensi atau penghapusan.

**Mengapa PINTAR seperti ini:** Kepercayaan harus ditunjukkan dengan perilaku produk, bukan diklaim.

**Bukti / mekanisme di PINTAR:** Verifikasi sertifikat publik (`/verifikasi/[token]`).

**Sumber:**
- MEMBUKTIKAN: SCHOOL-DATA-EXPORT-4.0.md; tes F04-T10; RESUME-2026-10-06.
- MENETAPKAN ATURAN: D-110(a)(b)(f), D-106, D-107, D-109; SCOPE-INVENTORY J1.2, J1.7.

**Yang tidak boleh dikatakan:** "Data Anda bisa diunduh kapan saja"; "kami berkomitmen kontrak X"; "pemulihan bencana teruji"; "tidak akan hilang".

**Status:** SEBAGIAN (prinsip D-110 ada; fiturnya belum)
**Tingkat sensitivitas:** PENTING

---

### Q017 — Guru kami kurang nyaman dengan komputer. Seberapa sulit memakainya, dan apakah ini menambah beban administrasi guru yang sudah banyak?

**Siapa yang kemungkinan bertanya:** Kepala sekolah, guru
**Kemungkinan ditanya:** TINGGI

**Jawaban singkat:**
"Layar guru dirancang sederhana: satu langkah lanjutan di beranda, dan guru tidak membuat akun siswa atau kartu. Tetapi kami belum mengukurnya dengan guru nyata, jadi kami belum bisa mengatakan beban administrasi berkurang. Penyiapan pelajaran masih lewat templat Excel."

**Penjelasan:** Layar guru: beranda dengan satu aksi lanjutan (EDU-02), Siapkan → Sediakan, Uji Cepat (pilih bab → centang soal → tinjau → sediakan; D-085 T2), bukti dan nama siswa, dalam bahasa Indonesia dan Inggris, layar 320 px; dilalui pada sekolah uji di staging (butir 33); alur Uji Cepat dibuktikan T2-S01 dan T2-K01. Tur dan Bantuan (Q015). Guru tidak membuat akun siswa atau kartu (itu admin). Pelajaran dibuat lewat templat Excel; tidak ada penyunting soal di layar; tiap catatan mutu soal ditinjau sebelum terbit. Beban admin sekolah: struktur, staf, siswa, kartu, batas ketuntasan (J3). Tidak ada: uji kegunaan dengan guru nyata, studi waktu atau beban administrasi, catatan pilot pendidik yang sudah berjalan (dicari usability, waktu menyiapkan, kesulitan).

**Mengapa PINTAR seperti ini:** Satu aksi berikutnya yang jelas dan keadaan kosong yang jujur (EDU-02, X.5).

**Bukti / mekanisme di PINTAR:** `src/app/mengajar/*`; tes T2-S01, T2-K01, UX1-S3-CEPAT-01.

**Sumber:** MEMBUKTIKAN: JOURNEY-LOG butir 33; kode di atas. MENETAPKAN ATURAN: D-085 (T2); SCOPE-INVENTORY J5.1, J5.5, X.6. Uji kegunaan: **tidak ditemukan**.

**Yang tidak boleh dikatakan:** "Mudah atau intuitif untuk semua guru"; "mengurangi beban administrasi"; "guru tidak perlu Excel".

**Status:** SEBAGIAN
**Tingkat sensitivitas:** PENTING

---

### Q018 — Berapa lama guru perlu menyiapkan satu pelajaran? Bisakah memakai soal atau materi yang sudah kami punya di Excel?

**Siapa yang kemungkinan bertanya:** Guru matematika kelas 5
**Kemungkinan ditanya:** TINGGI

**Jawaban singkat:**
"Bisa, asalkan disusun mengikuti templat PINTAR: lima lembar, dengan alasan untuk setiap pilihan jawaban. Kami belum mengukur berapa lama penyiapan satu pelajaran, jadi kami tidak menyebut durasi."

**Penjelasan:** Alur guru: Studio → Buat Paket: unduh templat, isi, «Periksa buku kerja», simpan; ajukan ke tinjauan; setelah terbit, Siapkan → Sediakan. Syarat: lima lembar; soal bertanda "Pemetaan awal" dan "Cek penguasaan" (pelajaran tanpa keduanya tidak bisa disediakan, D-008); kunci dan **alasan wajib untuk setiap pilihan**; bab dan pelajaran bernomor (`src/lib/unggah-kontrak.ts`); pra dan pasca-uji tanpa soal yang sama atau paralel (D-040). Putaran Excel dan Google Sheets lulus (ADM-09). Uji Cepat sekitar satu menit memilih soal dari bank yang diizinkan, setelah admin menetapkan batas ketuntasan. Tidak ada: pengukuran waktu penyiapan; pemetaan otomatis dari susunan Excel bebas milik sekolah ke templat; impor soal tanpa alasan atau pilihan.

**Mengapa PINTAR seperti ini:** Setiap pilihan jawaban membawa alasan agar jawaban salah menjadi bukti cara berpikir (INV-03).

**Bukti / mekanisme di PINTAR:** `src/components/studio/langkah.ts`; `src/lib/unggah-kontrak.ts`; tes DAISY-06-TEMPLAT-01, UX1-S3-CEPAT-01.

**Sumber:** MEMBUKTIKAN: kode dan tes di atas; checklist ADM-09. MENETAPKAN ATURAN: D-008, D-030, D-040; INV-03; SCOPE-INVENTORY J4.1, J5.5.

**Yang tidak boleh dikatakan:** "X menit per pelajaran"; "unggah Excel soal Anda apa adanya".

**Status:** SEBAGIAN
**Tingkat sensitivitas:** NORMAL

---

### Q019 — Apakah guru bisa melihat siswa mana yang tertinggal dan di bagian apa?

**Siapa yang kemungkinan bertanya:** Guru
**Kemungkinan ditanya:** TINGGI

**Jawaban singkat:**
"Pada versi yang sudah dibangun dan diuji (belum di produksi), ya, bila sudah ada hasil resmi yang cukup. Guru bisa melihat penguasaan per bagian, siswa yang di bawah target, dan soal yang paling sulit setelah asesmen ditutup, lalu meminta siswa tertentu membaca ulang materi. PINTAR tidak melabeli siswa berisiko secara otomatis."

**Penjelasan:** «Lihat bukti» kelas dari bukti resmi saja, kecukupan eksplisit, tanpa nol palsu (J7.1; D-064). Daftar murid → catatan satu murid (progres, status per asesmen, penguasaan; «di bawah target» terhadap batas yang sudah tersegel; M4, M4-K01). «Lihat per soal»: soal tersulit dan murid yang mungkin perlu bantuan setelah asesmen ditutup, tanpa umpan jawaban langsung, integritas, atau Question Health (D-088(k); D088K-K01). «Penguasaan per bagian» dinamai tujuan pembelajaran (D-088(g)). «Minta membaca lagi» menugaskan ulang materi ke murid terpilih tanpa remediasi otomatis (M3; M3R-S01, M3R-K01). EDU-09 lulus di staging. Syarat: ada hasil resmi cukup; hanya kelas yang diajar guru. Dibuktikan dengan lima murid fiktif; belum dengan siswa nyata. Produksi belum menjalankan versi ini.

**Mengapa PINTAR seperti ini:** Bukti tanpa penghakiman; guru melihat apa yang boleh dilihatnya dan memutuskan sendiri (J5.8).

**Bukti / mekanisme di PINTAR:** `src/app/mengajar/[kelas]/murid/[orang]`; `src/app/mengajar/[kelas]/soal/page.tsx`.

**Sumber:** MEMBUKTIKAN: tes M4-K01, D088K-K01, M3R-S01, M3R-K01; JOURNEY-LOG butir 33. MENETAPKAN ATURAN: D-064, D-085 (M3, M4, M5), D-088(g)(k); SCOPE-INVENTORY J5.12–J5.14, J7.1.

**Yang tidak boleh dikatakan:** "Deteksi otomatis siswa berisiko"; "prediksi"; "sudah terbukti dengan sekolah nyata".

**Status:** TERSEDIA DI 4.0 (main/staging; belum di produksi)
**Tingkat sensitivitas:** PENTING

---

### Q020 — Apakah guru masih memegang keputusan akhir atas nilai dan kelulusan? Bisakah guru mengubah nilai siswa?

**Siapa yang kemungkinan bertanya:** Guru, kepala sekolah
**Kemungkinan ditanya:** TINGGI

**Jawaban singkat:**
"Keputusan nilai rapor dan kelulusan tetap di sekolah, di luar PINTAR. Di PINTAR guru tidak bisa mengubah skor hasil asesmen; skor dihitung server dari jawaban siswa, dan yang bisa diatur manusia adalah batas ketuntasan yang ditetapkan admin sekolah."

**Penjelasan:** Skor dihitung server dari jawaban mentah; klien hanya dapat membaca hasil (`evidence_response_result.sql:218`; INV-09). Tidak ditemukan layar atau fungsi bagi guru atau siapa pun di sekolah untuk mengubah skor atau hasil yang tersegel (dicari override, regrade, ubah nilai, kelulusan, naik kelas). Yang diatur manusia: batas ketuntasan per sekolah per pelajaran oleh Admin sekolah (D-081, J3.8; guru tidak memilihnya), tersegel pada tugas dan sesi; perubahannya tidak mengubah hasil atau sertifikat lama. Kelayakan sertifikat diturunkan dari batas tersegel, bukti resmi, dan gerbang keamanan (J8.1); satu Uji Cepat tidak menerbitkan sertifikat (D-082(d)). Koreksi isi = rilis baru, pengalaman lama tidak diganti (J4.12). Perpanjangan tenggat ada di database dengan alasan dan audit tetapi tanpa layar guru. Tidak ada: nilai rapor, kenaikan kelas, kelulusan, penilaian esai manual.

**Mengapa PINTAR seperti ini:** Skor yang bisa diubah sembarang orang merusak nilai bukti dan sertifikat.

**Bukti / mekanisme di PINTAR:** `supabase/migrations/20260912140823_evidence_response_result.sql:218`.

**Sumber:**
- MEMBUKTIKAN: migrasi di atas; pencarian kode (tidak ada jalur ubah skor).
- MENETAPKAN ATURAN: D-078, D-081, D-082(d); INV-09; SCOPE-INVENTORY J3.8, J4.12, J8.1.

**Yang tidak boleh dikatakan:** "Guru dapat mengoreksi atau mengubah nilai di PINTAR"; "PINTAR menentukan kelulusan"; "nilai PINTAR sama dengan nilai rapor".

**Status:** SEBAGIAN
**Tingkat sensitivitas:** TINGGI

---

### Q021 — Apakah PINTAR dipakai untuk menilai kinerja guru? Bisakah kepala sekolah memantau semua yang dilakukan guru?

**Siapa yang kemungkinan bertanya:** Guru
**Kemungkinan ditanya:** TINGGI

**Jawaban singkat:**
"PINTAR tidak punya fitur penilaian kinerja atau peringkat guru. Tetapi kami tidak akan mengatakan 'tidak ada pemantauan sama sekali': Kepala departemen dan Dekan melihat angka dalam lingkupnya, Admin sekolah membaca jejak audit sekolah, dan kepala departemen dapat melihat umpan balik kelas dari siswa."

**Penjelasan:** Teks layar: "Bukan penilaian kinerja dan bukan peringkat" (`src/lib/hle.ts:2725`, untuk pembelajaran pendidik); D-069(c): integritas pembelajaran pendidik tidak ditampilkan ke pimpinan, "bukan penilaian SDM, tanpa alur disipliner"; D-069(j): bukan sistem SDM. Pimpinan (Kepala departemen, Dekan) melihat angka dalam lingkup kelas atau bagian dan daftar murid (J7.2, J7.3); komentar kode: "nothing compares two educators". Jejak audit sekolah dibaca **Admin sekolah**, bukan Dekan atau Kepala departemen (Admin sekolah bahkan ditolak dari beranda Pimpinan; UX1-PIMPINAN-AKSES-01): 50 baris terakhir (waktu, aksi, target, build) tanpa kolom pelaku. Pembukaan detail murid oleh Kepala departemen dicatat. «Umpan balik kelas»: lima pertanyaan tetap, ringkasan per kelas dan guru, hasil ditahan di bawah ambang anonimitas, dapat dilihat Kepala departemen; ada di `main` **tanpa sumber lingkup** menunggu putusan pemilik (SCOPE-INVENTORY §11 B1). Dekan tidak dapat menulis. Guru tidak melihat integritas atau Question Health (J5.8). Tidak ada: dasbor aktivitas per guru, peringkat guru, laporan jam masuk. Konflik: doc 05 (rancangan) mengizinkan guru membaca sinyal integritas kelasnya; J5.8/EDU-09 melarang; yang berlaku EDU-09.

**Mengapa PINTAR seperti ini:** PINTAR mengukur pembelajaran siswa, bukan menilai guru.

**Bukti / mekanisme di PINTAR:** `src/app/pimpinan/[simpul]/page.tsx:113-116`; `src/app/konfigurasi/page.tsx:137, 1105-1122`.

**Sumber:**
- MEMBUKTIKAN: kode di atas; tes F06-N02, UX1-PIMPINAN-AKSES-01.
- MENETAPKAN ATURAN: D-069(c)(j); SCOPE-INVENTORY J5.8, J7.2, J7.3, §11 (B1); INV-19.

**Yang tidak boleh dikatakan:** "Tidak ada pemantauan guru sama sekali"; "PINTAR menilai guru"; "kepala sekolah bisa melihat semua aktivitas guru"; "umpan balik siswa anonim mutlak".

**Status:** PERLU VERIFIKASI TEKNIS
**Tingkat sensitivitas:** TINGGI

---

### Q022 — Guru honorer yang kontraknya habis atau guru yang pindah: akunnya dan data kelasnya bagaimana?

**Siapa yang kemungkinan bertanya:** Administrator sekolah
**Kemungkinan ditanya:** SEDANG

**Jawaban singkat:**
"Admin sekolah bisa mencabut peran guru dengan alasan, dan itu tercatat. Tetapi akun guru belum bisa dinonaktifkan dan belum ada serah-terima kelas otomatis kepada guru pengganti."

**Penjelasan:** Admin sekolah mencabut peran dengan alasan wajib dan audit (`revokeRoleAction`, `src/app/konfigurasi/actions.ts:143-151`; F08-P10; D-097(a)). Riwayat peran tidak ditulis ulang. Data murid, sesi, dan bukti tetap di kelas; orang dan audit tidak bisa dihapus. Kelas baru: beri peran Guru pada Kelas yang sama. Pindah ke sekolah PINTAR lain: satu orang PINTAR, tidak boleh ada orang ganda (D-049(c)), tetapi alur resmi relasi ke sekolah kedua belum ada (D-049(d)). Tidak ada: penonaktifan akun (tinjauan silang ADM-J14, 1 Okt: tidak bisa dinonaktifkan; tidak ditemukan perubahan setelahnya); serah-terima kelas atau materi; kebijakan retensi atau penghapusan data pribadi. Konten Studio buatan guru tetap berada di sekolah; tidak ada alur transfer kepemilikan.

**Mengapa PINTAR seperti ini:** Riwayat tidak ditulis ulang; tindakan penting meninggalkan jejak.

**Bukti / mekanisme di PINTAR:** `src/app/konfigurasi/actions.ts:143-151`; fungsi `revoke_role`.

**Sumber:** MEMBUKTIKAN: kode dan tes F08-P10, F01-T04; `docs/product/SCHOOL-DATA-EXPORT-4.0.md` §D. MENETAPKAN ATURAN: D-049(c)(d), D-097(a); `docs/recovery/PINTAR-4.0-JOURNEY-COVERAGE-CROSS-CHECK-2026-10-01.md` (ADM-J14).

**Yang tidak boleh dikatakan:** "Akun otomatis nonaktif"; "data guru dihapus"; "kelas otomatis diserahkan".

**Status:** SEBAGIAN
**Tingkat sensitivitas:** TINGGI

---


## Kelompok 2 — Siswa, asesmen, laporan, sertifikat, AI (Q023–Q050)

> **Catatan lintas-pertanyaan untuk pembaca kelompok ini.**
> 1. **Produksi tertinggal dari `main`.** `RESUME-2026-10-06.md`: produksi tetap di build `5b5b68d` (111 migrasi, terakhir `20261005120000`). Yang ada di `main` dan staging tetapi **tidak** di produksi antara lain: batas percobaan dan jeda masuk kartu (migrasi 125), PINTAR ID (127), batas ketuntasan sekolah (139), koreksi ke depan M10 (142–143), jejak audit pencabutan sertifikat (148), koreksi nama (149), kartu diterbitkan ulang dan pemulihan PIN (153), kunci perangkat bersama (154), wewenang pemulihan oleh sekolah (159). "TERSEDIA" di bawah berarti ada di `main` dan terbukti di tes/staging, bukan berjalan di produksi.
> 2. Pekerjaan backup/DR (#150) belum lulus (D-104 s/d D-109).
> 3. Uji beban 1.000 siswa bersamaan belum memenuhi target. Pada 50 siswa, target terpenuhi hanya lewat jalur RPC; lewat aplikasi nyata yang diukur dari AS tidak terpenuhi, dan di atas 50 belum terbukti (JOURNEY-LOG:98). Penguji dibatasi 50 orang (D-089).
> 4. Dokumen lama kadang usang: JOURNEY-LOG daftar "WAITING FOR OWNER" butir 6 dan 11 menyebut kartu ulang dan kunci PIN "not built", sedangkan entri 25 dan 26 (4 Okt) menyatakan keduanya dibangun; yang baru berlaku.

### Q023 — Siswa kami masuk bagaimana? Apakah harus punya email atau password?

**Siapa yang kemungkinan bertanya:** Guru, kepala sekolah
**Kemungkinan ditanya:** TINGGI

**Jawaban singkat:**
"Pada versi yang sudah dibangun dan diuji (belum di produksi), siswa masuk dengan Kartu PINTAR dan PIN yang dicetak sekolah. Mereka tidak perlu email atau kata sandi, dan email yang tercatat tidak memberi cara masuk lain."

**Penjelasan:** Satu model masuk untuk siswa: nomor kartu 10 digit + PIN (J2.19; D-085 M2). Tidak ada tautan ajaib, email/kata sandi, atau "pilih cara masuk". Salah kartu atau PIN dijawab sama (401) dan layar tidak membedakannya (UX1-MASUK-PRIVASI-01). Lima percobaan dalam 15 menit gratis; sesudahnya ada jeda 30 → 300 detik, tidak pernah mengunci permanen (BOB12-A01; F15-P01/P02/C01). Sesi kartu berumur 3.600 detik (BOB05-R01). Siswa punya PINTAR ID, tetapi tidak ada layar yang menampilkannya dan tidak ada halaman "Akun saya" untuk siswa di 4.0 (J2.16; `src/app/akun/page.tsx:17-18`). Kartu dibuat sekolah per Kelas sebagai lembar cetak; PIN tampil sekali pada lembar kartu dan tidak disimpan (M7-K01; SCHOOL-DATA-EXPORT-4.0.md §A; F09-A02). Tidak ada: masuk siswa dengan email, kata sandi, atau Google; kartu desain khusus siswa (D-059(g), §10). Jeda percobaan (migrasi 125) belum di produksi.

**Mengapa PINTAR seperti ini:** Siswa tidak bergantung pada akun email; pemulihan dibantu sekolah (D-085 M2).

**Bukti / mekanisme di PINTAR:** Rute `POST /masuk/kartu`; `src/app/akun/page.tsx:16-20`.

**Sumber:**
- MEMBUKTIKAN: tes BOB12-A01, F15-P01/P02/C01, BOB05-R01, UX1-MASUK-PRIVASI-01, M7-K01, F09-A02.
- MENETAPKAN ATURAN: SCOPE-INVENTORY J2.19, §10; D-085 (M2); D-059(g).

**Yang tidak boleh dikatakan:** "Siswa bisa masuk dengan email"; "tanpa batas percobaan"; "sudah berjalan di produksi".

**Status:** TERSEDIA DI 4.0 (main/staging; belum di produksi)
**Tingkat sensitivitas:** PENTING

---

### Q024 — Siswa lupa PIN atau kartunya hilang. Siapa yang menolong dan secepat apa?

**Siapa yang kemungkinan bertanya:** Guru
**Kemungkinan ditanya:** TINGGI

**Jawaban singkat:**
"Admin sekolah menerbitkan kartu baru di PINTAR: kartu lama langsung mati dan akun serta hasil belajar siswa tetap. Kami belum menetapkan target waktu, jadi kami tidak menjanjikan kecepatan."

**Penjelasan:** Admin sekolah (pemegang kewenangan menyiapkan orang) menerbitkan kartu baru di Aktivasi → «Kartu hilang atau rusak»: nomor dan PIN baru; kartu lama langsung mati; sesi lama berakhir; akun, kelas, dan hasil tetap; alasan, pelaku, dan kedua nomor dicatat di audit (`authorize_card_reissue`, migrasi `20261116100000`; `KartuUlang.tsx`; BOB28-A03; D101-A01/D01). Guru ditolak (BOB28-A03). Tanpa Admin sekolah: Admin platform sebagai otoritas terakhir (D-101(b)(c)). D-099: PIN yang lupa diselesaikan dengan penerbitan ulang oleh sekolah. Tidak ada: angka waktu penyelesaian (D-037 hanya untuk laporan staf); siswa tidak bisa mengganti PIN sendiri; lembar kartu lama tidak bisa dicetak ulang (PIN tidak disimpan); pilihan alasan di layar hanya "hilang" atau "rusak", tidak ada "lupa PIN" (celah antara D-099 dan layar); koreksi email yang salah (J2.21 bagian kedua) tidak ditemukan layarnya. Siswa memberi tahu gurunya; siswa tidak memakai «Laporkan masalah» (PR100).

**Mengapa PINTAR seperti ini:** "Dapatkah sekolah menyelesaikannya sendiri dengan aman? Jika ya, PINTAR mengaktifkannya" (D-101(f)).

**Bukti / mekanisme di PINTAR:** `src/components/aktivasi/KartuUlang.tsx`; `src/lib/hle.ts:3738-3748`.

**Sumber:**
- MEMBUKTIKAN: tes BOB28-A03, D101-A01, D101-D01; migrasi `20261116100000`; JOURNEY-LOG baris 183.
- MENETAPKAN ATURAN: D-099, D-101, D-037; SCOPE-INVENTORY J2.21.

**Yang tidak boleh dikatakan:** "Selesai dalam X menit atau jam"; "siswa bisa mengatur ulang PIN sendiri"; "bisa koreksi email di PINTAR".

**Status:** SEBAGIAN (penerbitan ulang kartu ada di `main`/staging; koreksi email dan target waktu tidak ada)
**Tingkat sensitivitas:** PENTING

---

### Q025 — Siswa kami banyak yang hanya punya HP dan kuota terbatas. Bisa dipakai? Berapa kuota yang terpakai?

**Siapa yang kemungkinan bertanya:** Kepala sekolah, siswa
**Kemungkinan ditanya:** TINGGI

**Jawaban singkat:**
"Tata letak sudah diuji untuk lebar layar HP kecil, tetapi kami belum mengukur berapa kuota yang terpakai dan belum mengujinya di HP siswa sungguhan. Karena itu kami belum bisa menyebut angka."

**Penjelasan:** Lebar 320 px adalah syarat P0 (X.6). Penelusuran otomatis membuka 269 halaman untuk 14 peran pada 320 px; hasil lokal: 0 dari 269 melebar (awalnya 34 gagal). Tes CSS: UX1-S0-MUAT-01, UX1-S3-FAKTA-01. D-099: asumsi normal SD/SMP adalah komputer sekolah bersama, siswa tidak membawa HP. Jawaban disimpan di perangkat lalu dikirim ulang. Tidak ada: pengukuran kuota atau ukuran halaman (tidak ditemukan `transferSize` di skrip audit); angka MB per sesi; pemutar video memakai `<video controls>` tanpa pengaturan preload dan video pelajaran bisa besar; uji pada HP sungguhan (bukan emulasi).

**Mengapa PINTAR seperti ini:** Responsif adalah bagian dari PASS (D-046), tetapi konsumsi data belum menjadi baris pengukuran.

**Bukti / mekanisme di PINTAR:** `audit/crawl.mjs:151-157, 241-244`; `src/app/belajar/_components/ItemPlayer.tsx:14-19, 100-150`; `LessonPlayer.tsx:248`.

**Sumber:** MEMBUKTIKAN: tes UX1-S0-MUAT-01, UX1-S3-FAKTA-01; JOURNEY-LOG baris 85; `docs/recovery/CHECKLIST-PROGRESS-2026-10-02.md` baris 49. MENETAPKAN ATURAN: SCOPE-INVENTORY X.6; D-046, D-099. Pengukuran kuota: **tidak ditemukan**.

**Yang tidak boleh dikatakan:** "Hemat kuota"; "X MB per ujian"; "sudah diuji di HP siswa".

**Status:** PERLU VERIFIKASI TEKNIS
**Tingkat sensitivitas:** PENTING

---

### Q026 — Kami hanya punya beberapa komputer lab atau tablet yang dipakai bergantian. Apakah siswa lain bisa melihat akun teman sebelumnya?

**Siapa yang kemungkinan bertanya:** Guru, bagian IT
**Kemungkinan ditanya:** SEDANG

**Jawaban singkat:**
"Pada versi yang sudah dibangun dan diuji (belum di produksi), sesi siswa terkunci setelah 5 menit tanpa aktivitas, layar kunci tidak menampilkan nama siswa, dan hanya PIN kartu yang membukanya. Siswa berikutnya bisa menekan «Bukan akun Anda?» untuk mengakhiri sesi."

**Penjelasan:** Setiap sesi kartu terkunci setelah 5 menit tanpa aktivitas, ditegakkan **server** (permintaan data sesi terkunci ditolak dengan 423). PIN kartu melanjutkan; 3 PIN salah mengakhiri sesi itu; terkunci 60 menit mengakhiri sesi. «Bukan akun Anda?» mengakhiri sesi di komputer itu (BOB29-A02, BOB29-D01, BOB29-K01; D-085 T1; D-086(c)). Siswa disapa nama depan saja (D-020). Posisi pelajaran terikat ke orang, bukan perangkat (W2-K01). Walk GS-20 di staging: kunci muncul pada 303 detik tanpa menyebut nama. Tombol Back dan muat ulang setelah «Keluar» sudah terbukti (RELEASE-CHECKLIST:97, STU-19 PASS; walk S21c). Tidak ditemukan: tes perilaku jawaban ujian yang belum terkirim (disimpan di penyimpanan lokal peramban) setelah keluar di perangkat bersama. Konflik: D-009 (60 menit diam untuk kartu) diubah oleh D-085 T1. Kunci perangkat bersama (migrasi 154) belum di produksi.

**Mengapa PINTAR seperti ini:** Anak berikutnya di perangkat bersama tidak boleh melihat nama atau data anak sebelumnya (D-020; U-PRIV).

**Bukti / mekanisme di PINTAR:** `src/components/PenjagaSesi.tsx:25-32`; layar `/terkunci`.

**Sumber:**
- MEMBUKTIKAN: tes BOB29-A02, BOB29-D01, BOB29-K01, W2-K01, DAISY-10-SAPA-01/02; RELEASE-CHECKLIST:97 (STU-19 PASS); JOURNEY-LOG baris 184, ~403.
- MENETAPKAN ATURAN: D-020, D-085 (T1), D-086(c); SCOPE-INVENTORY J2.20.

**Yang tidak boleh dikatakan:** "Tidak mungkin ada kebocoran"; "kunci otomatis di produksi hari ini".

**Status:** TERSEDIA DI 4.0 (main/staging; belum di produksi)
**Tingkat sensitivitas:** TINGGI

---

### Q027 — Apakah siswa bisa melihat nilai atau peringkat teman?

**Siapa yang kemungkinan bertanya:** Orang tua, siswa
**Kemungkinan ditanya:** SEDANG

**Jawaban singkat:**
"Pada versi yang sudah dibangun dan diuji (belum di produksi): tidak. Siswa hanya melihat hasil dan pertumbuhan dirinya sendiri, tanpa peringkat, rata-rata kelas, atau siswa lain."

**Penjelasan:** J6.11: hasil menampilkan penguasaan dan maknanya serta pertumbuhan sendiri, tanpa peringkat, rata-rata kelas, atau murid lain. Siswa membaca hasil sendiri (F06-P12: "learner sees themselves alone"; M3R-S01). Laporan guru dan pimpinan mengurutkan nama berdasarkan abjad dan diberi kalimat "bukan peringkat" (UX1-S3-NAMA-01, UX1-PIMPINAN-KATA-01). Catatan jujur: tidak ada tes HTTP ujung-ke-ujung yang membaca halaman hasil siswa lain dengan identitas siswa (F06-P12 bekerja di tingkat database). Laporan sekolah memuat metrik `institution.cohort_comparison` yang mengurutkan angkatan menurut rata-rata penguasaan, hanya untuk Kepala departemen, Dekan, dan Admin sekolah di dalam satu sekolah.

**Mengapa PINTAR seperti ini:** Perbandingan seorang siswa selalu dengan dirinya sendiri.

**Bukti / mekanisme di PINTAR:** Halaman hasil siswa; `calc_institution_cohort_comparison`.

**Sumber:** MEMBUKTIKAN: tes F06-P12, M3R-S01, UX1-S3-NAMA-01, UX1-PIMPINAN-KATA-01; RELEASE-CHECKLIST:93 (STU-15 PASS). MENETAPKAN ATURAN: SCOPE-INVENTORY J6.11 (baris 140), X.8.

**Yang tidak boleh dikatakan:** "Siswa tidak mungkin melihat teman" tanpa dasar tes HTTP; "tidak ada peringkat sama sekali" (ada urutan angkatan di laporan sekolah).

**Status:** TERSEDIA DI 4.0 (main/staging; belum di produksi)
**Tingkat sensitivitas:** TINGGI

---

### Q028 — Apakah ada game, poin, atau lencana untuk memotivasi siswa?

**Siapa yang kemungkinan bertanya:** Guru, siswa
**Kemungkinan ditanya:** SEDANG

**Jawaban singkat:**
"Tidak. PINTAR 4.0 sengaja tidak memakai lencana, poin, atau permainan, dan kami tidak punya rencana bertanggal untuk itu."

**Penjelasan:** D-059(e): tanpa lencana, poin, hadiah, atau mekanisme mengoleksi di 4.0. SCOPE-INVENTORY §10 mencantumkannya sebagai di luar 4.0. `docs/rebuild/09` menempatkan "unnecessary gamification (confetti, badges as decoration)" di PARK. Tidak ditemukan konfeti, streak, XP, atau lencana di kode; satu komentar sengaja menolak streak. Tidak ada sumber yang menyebut versi untuk fitur ini.

**Mengapa PINTAR seperti ini:** Teknologi tidak ditambahkan hanya karena populer.

**Bukti / mekanisme di PINTAR:** Tidak ada; `src/app/belajar/[tugas]/lanjut/page.tsx:27`.

**Sumber:** MENETAPKAN ATURAN: D-059(e); SCOPE-INVENTORY §10; `docs/rebuild/09-PINTAR-V1-SCOPE-BOUNDARIES.md` baris 143 (PARK).

**Yang tidak boleh dikatakan:** "Segera hadir"; "ada di roadmap 4.1".

**Status:** TIDAK DI 4.0 (PARK: gamifikasi; SCOPE-INVENTORY §10)
**Tingkat sensitivitas:** NORMAL

---

### Q029 — Apakah PINTAR bisa dipakai untuk ujian resmi (UTS/UAS) dan hasilnya masuk rapor?

**Siapa yang kemungkinan bertanya:** Kepala sekolah, wakil kepala sekolah
**Kemungkinan ditanya:** TINGGI

**Jawaban singkat:**
"PINTAR menyelenggarakan asesmen dengan bukti resmi di dalam siklus belajar, tetapi tidak punya buku nilai, bobot UTS/UAS, atau rapor, dan tidak terhubung ke e-Rapor. Hasilnya tidak otomatis masuk rapor."

**Penjelasan:** Yang ada dan terjangkau: Uji Penguasaan (siklus belajar) dan Uji Cepat (maksimal 20 soal, 1 percobaan). Hasilnya menjadi bukti RESMI (OFFICIAL) untuk sekolah nyata (D-003, D-038) dan terbaca di laporan (GS-17). Mode ujian formal (EXAM) ada di database dan pembuat definisi Studio, tetapi tidak ditemukan layar yang menugaskannya ke kelas. Penanda lulus: nilai ≥ batas ketuntasan sekolah yang disegel dan gerbang keselamatan (D-081; BOB49-S01; F03-T07). Tidak ada: buku nilai, bobot, entitas UTS/UAS, rapor, integrasi Dapodik/e-Rapor (pencarian di `src/` dan `supabase/`: nol); pengawasan kamera/layar (PARK); ekspor Excel.

**Mengapa PINTAR seperti ini:** Cakupan 4.0 adalah siklus belajar dan bukti, bukan administrasi rapor.

**Bukti / mekanisme di PINTAR:** `launch_quick_assessment`, `assign_release`; `src/app/studio/definisi/page.tsx:78`.

**Sumber:** MEMBUKTIKAN: JOURNEY-LOG baris 94 (GS-17); tes BOB49-S01, F03-T07; `docs/product/SCHOOL-DATA-EXPORT-4.0.md`. MENETAPKAN ATURAN: D-003, D-038, D-081; `docs/rebuild/09` baris 120 (alur kertas, LATER), 124 (SSO, LATER), 136-137 (pengawasan kamera/layar, PARK).

**Yang tidak boleh dikatakan:** "Hasil otomatis masuk rapor"; "bisa dipakai untuk UAS resmi"; "ada pengawasan ujian".

**Status:** SEBAGIAN
**Tingkat sensitivitas:** TINGGI

---

### Q030 — Siapa yang menentukan batas lulus sebuah pelajaran? Apakah ada angka bawaan?

**Siapa yang kemungkinan bertanya:** Wakil kepala sekolah kurikulum
**Kemungkinan ditanya:** SEDANG

**Jawaban singkat:**
"Pada versi yang sudah dibangun dan diuji (belum di produksi), sekolah yang menentukan, lewat Admin sekolah, per pelajaran. Tidak ada angka bawaan: pelajaran tanpa batas ketuntasan tidak bisa disediakan."

**Penjelasan:** Admin sekolah mengatur «Batas ketuntasan» per pelajaran per sekolah: bilangan bulat 0–100, dengan alasan, riwayat, dan audit, di Konfigurasi. Guru, Kepala departemen, dan siswa tidak bisa mengaturnya (D-081 Q1–Q4; D-088(b); BOB49-S01, BOB49-K01; migrasi `20261102100000`). Pelajaran tanpa batas ditolak (`ASSIGN_PASS_MARK_MISSING`); layar berbunyi «Batas ketuntasan belum ditetapkan». Batas disegel pada penugasan dan percobaan, sehingga perubahan hanya berlaku ke depan. Pita kinerja tetap (≥80 «Mantap», 60–79 «Berkembang», <60 «Perlu penguatan») bukan batas lulus (D-095). Catatan: `passing_rules mastery_min 0.6` masih tertulis di definisi buatan buku kerja, tetapi BOB49-K01 menyatakan pembaca tidak memakai 0,6 sendiri.

**Mengapa PINTAR seperti ini:** Kelulusan adalah kewenangan sekolah, bukan angka bawaan produk.

**Bukti / mekanisme di PINTAR:** `src/lib/batas-ketuntasan.ts`; migrasi `20261102100000`.

**Sumber:**
- MEMBUKTIKAN: tes BOB49-S01, BOB49-K01; JOURNEY-LOG baris 70.
- MENETAPKAN ATURAN: D-081, D-088(b), D-095; SCOPE-INVENTORY J3.8.

**Yang tidak boleh dikatakan:** "PINTAR memakai 60% atau 70%"; "guru bisa mengatur batas lulus"; "mengubah batas mengubah hasil lama".

**Status:** TERSEDIA DI 4.0 (main/staging; belum di produksi)
**Tingkat sensitivitas:** TINGGI

---

### Q031 — Kalau guru salah menerbitkan soal atau ada soal yang keliru, apakah bisa diperbaiki? Bagaimana dengan siswa yang sudah mengerjakan?

**Siapa yang kemungkinan bertanya:** Guru
**Kemungkinan ditanya:** TINGGI

**Jawaban singkat:**
"Soal yang sudah dipakai tidak diubah diam-diam; perbaikannya berupa revisi baru yang tercatat, dan dipakai untuk pembelajaran berikutnya. Hasil siswa yang sudah mengerjakan tidak dinilai ulang otomatis."

**Penjelasan:** Konten yang sudah dipakai tidak berubah; koreksi adalah revisi baru dalam garis yang sama dengan ringkasan, penulis, waktu, dan audit (D-041; D-085 M10; M10-S01, M10-S02, M10-K01, M10-K02; F05-T12). Guru mengunggah buku kerja koreksi untuk kursus terkunci; hanya rilis terbaru yang ditawarkan untuk pembelajaran baru. Siswa yang sudah mengerjakan: sesi, hasil, dan sertifikat lama tidak berubah; penugasan baru memakai rilis terbaru; pemindahan rilis setelah ada siswa mulai ditolak (`RELEASE_MOVE_STARTED`; F05-T14, F05-T14b, F05-C01). Tidak ada: menilai ulang hasil lama, membatalkan satu soal, atau membuang soal dari hasil yang ada (dicari rescore, annul, retract, void). Konflik: doc 08 (rancangan) menjelaskan "intervensi terkelola" bagi siswa aktif; perilaku terbukti menolak pemindahan; yang berlaku perilaku terbukti. Migrasi 142–143 belum di produksi.

**Mengapa PINTAR seperti ini:** Konten yang sudah dialami tidak boleh diganti di bawah pengalaman belajar yang aktif (J4.12).

**Bukti / mekanisme di PINTAR:** Alur Studio koreksi ke depan.

**Sumber:**
- MEMBUKTIKAN: tes M10-S01/S02/K01/K02, F05-T12, F05-T14, F05-T14b, F05-C01; JOURNEY-LOG baris 74–76.
- MENETAPKAN ATURAN/RANCANGAN: D-041, D-085 (M10); SCOPE-INVENTORY J4.12; `docs/rebuild/08` (rancangan).

**Yang tidak boleh dikatakan:** "Nilai siswa otomatis dikoreksi"; "soal bisa diedit diam-diam setelah dipakai".

**Status:** SEBAGIAN (koreksi ke depan ada; koreksi retroaktif tidak ada)
**Tingkat sensitivitas:** TINGGI

---

### Q032 — Bisakah siswa mengintip kunci jawaban lewat browser?

**Siapa yang kemungkinan bertanya:** Bagian IT, guru
**Kemungkinan ditanya:** SEDANG

**Jawaban singkat:**
"Selama siswa mengerjakan, kunci jawaban dirancang tidak dikirim ke peramban, dan itu dipaksa di database serta diuji. Setelah sebuah percobaan selesai, tinjauan menampilkan benar atau salah beserta penjelasannya. Bagaimana percobaan kedua sebaiknya bekerja masih menunggu keputusan produk, dan kami belum melakukan uji dari luar terhadap aplikasi yang berjalan."

**Penjelasan:** Perilaku sekarang, dijelaskan apa adanya tanpa menilainya:
- Selama pengerjaan: muatan soal yang dikirim ke siswa hanya jenis soal, pertanyaan, stimulus, dan pilihan (INV-01; `sanitized_item` di migrasi `20260913090000` dan `20260918130000`; F06-P02, F03-S02, F06-P01, F03-T03; `src/lib/assessment-engine/types.ts:13-22`). Konteks bantuan menolak bidang kunci (F03-S03).
- Setelah sesi dikumpulkan (bukan Pemetaan Awal): `session_review` menampilkan jawaban yang dipilih siswa, benar atau salah, dan penjelasan opsi yang dipilihnya; ditolak sebelum FINALIZED dan untuk pre-test.
- Uji Penguasaan dari buku kerja memiliki 2 percobaan dan percobaan kedua menarik soal bertanda yang sama (Q034).
- **Ditahan untuk keputusan produk (D-112(b)):** tidak ada yang diubah sekarang; perilaku ini bisa disengaja secara pedagogis, tetapi harus disengaja. Dokumen ini tidak menilainya.
- Tidak ditemukan: uji kotak-hitam lewat REST dengan identitas siswa asli seperti yang diminta INV-01 (F03-T03 memakai `set_config` pada suite database). Detail teknis lain: tim teknis.

**Mengapa PINTAR seperti ini:** Validitas asesmen bergantung pada kunci yang tidak bocor selama asesmen berlangsung (INV-01).

**Bukti / mekanisme di PINTAR:** `sanitized_item`; migrasi `20260913091500` (`session_review`).

**Sumber:** MEMBUKTIKAN: tes F06-P02, F03-S02, F06-P01, F03-T03, F03-S03; migrasi di atas. MENETAPKAN ATURAN: `docs/rebuild/03-PINTAR-INVARIANTS.md` baris 17 (INV-01); D-112(b). Uji kotak-hitam klien: **tidak ditemukan**.

**Yang tidak boleh dikatakan:** "Kunci tidak pernah terlihat siswa"; "tidak mungkin dibobol"; "sudah diuji penetrasi"; penilaian bahwa percobaan kedua baik atau buruk.

**Status:** KEBIJAKAN BELUM DIPUTUSKAN (ditahan untuk keputusan produk, D-112(b)); kedua: PERLU VERIFIKASI TEKNIS (uji kotak-hitam klien belum ada) — ▲ BELUM DIPUTUSKAN HARI INI
**Tingkat sensitivitas:** KRITIS

---

### Q033 — Apakah soal esai atau uraian bisa dinilai di PINTAR?

**Siapa yang kemungkinan bertanya:** Guru
**Kemungkinan ditanya:** TINGGI

**Jawaban singkat:**
"Belum. PINTAR 4.0 hanya mendukung soal pilihan ganda (satu atau beberapa jawaban); esai dan uraian tidak bisa dibuat maupun dinilai."

**Penjelasan:** Jenis soal yang diterima unggahan: «Pilihan ganda» dan «Pilihan ganda banyak jawaban» saja (`src/lib/unggah-kontrak.ts:42`). Database menyebut jenis lain (angka, kisi, benar-salah, menjodohkan, berjangkar gambar), tetapi tidak ada jenis esai, dan `grade_response` hanya mengimplementasikan `exact_option` dan `set_match`; kontrak lain menghasilkan galat "no implementation in this phase (OD-8)". OD-8 masih terbuka. Tidak ada penilaian esai manual atau otomatis dan tidak ada AI yang menilai.

**Mengapa PINTAR seperti ini:** Penilaian harus dapat direproduksi dan dijelaskan (INV-09).

**Bukti / mekanisme di PINTAR:** Migrasi `20260912112712:19-20`; `20260913091500:46-77`.

**Sumber:** MEMBUKTIKAN: migrasi dan kode di atas. MENETAPKAN ATURAN: OD-8 (`docs/rebuild/11`); `docs/rebuild/07`.

**Yang tidak boleh dikatakan:** "Esai dinilai AI"; "tipe soal lain tersedia" (ada di database, tidak bisa dibuat atau dinilai).

**Status:** TIDAK DILAKUKAN PINTAR di 4.0 (hanya pilihan ganda; bukan roadmap bernomor)
**Tingkat sensitivitas:** PENTING

---

### Q034 — Apakah siswa boleh mengulang ujian? Berapa kali?

**Siapa yang kemungkinan bertanya:** Guru, orang tua
**Kemungkinan ditanya:** SEDANG

**Jawaban singkat:**
"Tidak ada pengulangan tanpa batas. Untuk Uji Penguasaan buatan buku kerja, saat ini diberi 2 percobaan; Pemetaan Awal 1. Guru dapat menugaskan ulang materi bacaan, tetapi tidak bisa menambah percobaan satu siswa lewat layar."

**Penjelasan:** `attempt_limit` per definisi; `start` menolak `ATTEMPT_LIMIT_REACHED`. Batas platform: 5 (bawaan) dan 1 untuk QUICK, EXAM, PAPER. Definisi dari buku kerja: Pemetaan Awal 1, Uji Penguasaan 2 (migrasi `20261106100000`). Aturan: "tidak ada pengulangan tak terbatas" (D-085 M3; J6.15). Guru dapat menugaskan ulang materi (M3R-S01). Percobaan kedua menarik soal bertanda yang sama dengan percobaan pertama; ditahan untuk keputusan produk (D-112(b); Q032). Orientasi memberi tahu percobaan ke berapa (UX1-S2-ORIENT-01). Tidak ditemukan: tes yang menyebut `ATTEMPT_LIMIT_REACHED`; bukti percobaan kedua berjalan ujung-ke-ujung; penjelasan percobaan mana yang dihitung ke laporan atau sertifikat. Konflik: komentar tes `selftest/db/fable06.sql:3605` menulis batas 1 untuk "most POST_TEST"; migrasi terbaru memberi 2.

**Mengapa PINTAR seperti ini:** Selesai mengerjakan tidak sama dengan mencapai target; ulang tak terbatas ditolak (M3).

**Bukti / mekanisme di PINTAR:** Migrasi `20260913090000:280-284`, `20260915150000:205-222`, `20261106100000`.

**Sumber:** MEMBUKTIKAN: migrasi di atas; tes M3R-S01, UX1-S2-ORIENT-01. MENETAPKAN ATURAN: D-085 (M3); SCOPE-INVENTORY J5.12, J6.15, §10.

**Yang tidak boleh dikatakan:** "Tiga kali"; "guru bebas mengatur jumlah percobaan"; "selalu 2 kali".

**Status:** SEBAGIAN
**Tingkat sensitivitas:** TINGGI

---

### Q035 — Kalau ujian berlangsung dan internet sekolah mati, apa yang terjadi pada jawaban siswa?

**Siapa yang kemungkinan bertanya:** Guru, bagian IT
**Kemungkinan ditanya:** TINGGI

**Jawaban singkat:**
"Jawaban siswa ditulis dulu ke perangkatnya dan dikirim ulang saat koneksi kembali; layar menampilkan 'Sedang luring', bukan 'sudah ditutup', dan 'Tersimpan' hanya muncul setelah server mengakui. Tetapi ujian tidak bisa dimulai tanpa internet, dan jawaban yang belum terkirim hilang bila peramban dihapus atau perangkat diganti."

**Penjelasan:** Setiap jawaban ditulis ke simpanan lokal peramban sebelum dikirim; «Sedang luring…» bukan «sudah ditutup»; setelah daring, terkirim; «Tersimpan» hanya setelah server mengakui (D-096; JOURNEY-LOG baris 84 dan 100–101; tes EFF-K01, W3-K01, F03-T05, F09-R01). «Kumpulkan» menunggu semua jawaban sampai server (F09-R02). Jawaban terlambat dalam masa tenggang 120 detik tetap dinilai; lewat itu disimpan sebagai bukti tetapi tidak dinilai (F04-T05, F09-R03). Pemeliharaan terencana: ujian berjalan boleh selesai (M148-*). Tidak ada: memulai ujian saat luring; pemulihan jawaban belum terkirim bila peramban dihapus atau ganti perangkat; beban 1.000 siswa bersamaan belum lolos (Q088). Jaringan sepenuhnya mati: platform offline luas adalah PARK. Dokumen butir 17 JOURNEY-LOG berstatus usang (diselesaikan D-096 dan EFF-K01).

**Mengapa PINTAR seperti ini:** Tidak ada yang hilang diam-diam; offline dibedakan dari ditolak (J6.8, J6.9).

**Bukti / mekanisme di PINTAR:** `src/app/belajar/_components/ItemPlayer.tsx`; kunci `pintar.outbox.<sesi>.*`.

**Sumber:**
- MEMBUKTIKAN: tes EFF-K01, W3-K01, F03-T05, F04-T05, F09-R01/R02/R03; JOURNEY-LOG baris 84, 100–101.
- MENETAPKAN ATURAN: D-096; SCOPE-INVENTORY J6.8, J6.9; `docs/rebuild/09` (PARK: offline luas).

**Yang tidak boleh dikatakan:** "Tidak ada jawaban yang pernah hilang"; "ujian bisa dikerjakan tanpa internet".

**Status:** SEBAGIAN
**Tingkat sensitivitas:** KRITIS

---

### Q036 — Kalau listrik padam atau perangkat siswa rusak atau mati di tengah ujian, bagaimana?

**Siapa yang kemungkinan bertanya:** Guru, bagian IT
**Kemungkinan ditanya:** TINGGI

**Jawaban singkat:**
"Jawaban yang sudah diakui server aman, dan sesi ada di server serta terikat ke siswa, bukan ke perangkat. Tetapi jawaban yang belum sempat terkirim saat perangkat mati bisa hilang, dan guru belum punya layar untuk menambah waktu satu siswa."

**Penjelasan:** Sesi dan tenggat otoritatif ada di server (doc 07; F09-R03). Pelajaran terbukti berlanjut di peramban kedua (S21e). Ujian: soal pertama tanpa jawaban dibuka (W3-K01). `allows_pause` benar untuk Uji Penguasaan dari buku kerja. Tidak ada: tes melanjutkan **sesi ujian** di perangkat lain (STU-J19 baru dibuktikan untuk pelajaran); layar guru untuk memperpanjang waktu satu siswa (`extend_session_deadline` ada di database, F04-T06, tanpa layar: `mengajar/[kelas]/langkah/page.tsx:22-33`); pemulihan jawaban yang belum terkirim saat perangkat mati.

**Mengapa PINTAR seperti ini:** Sesi terikat ke orang dan server menjadi sumber kebenaran waktu.

**Bukti / mekanisme di PINTAR:** `extend_session_deadline`; JOURNEY-LOG baris 61.

**Sumber:** MEMBUKTIKAN: tes F09-R03, W3-K01, F04-T06; JOURNEY-LOG baris 61. MENETAPKAN ATURAN: `docs/rebuild/07` (continue permission).

**Yang tidak boleh dikatakan:** "Guru bisa menambah waktu"; "ujian otomatis dilanjutkan di perangkat lain".

**Status:** SEBAGIAN; kedua: PERLU VERIFIKASI TEKNIS
**Tingkat sensitivitas:** TINGGI

---

### Q037 — Siswa tidak sengaja menutup tab atau menekan "kirim" terlalu cepat. Apakah bisa dipulihkan?

**Siapa yang kemungkinan bertanya:** Guru
**Kemungkinan ditanya:** SEDANG

**Jawaban singkat:**
"Menutup tab tidak menghilangkan jawaban yang sudah tersimpan, dan ujian dibuka lagi di soal pertama yang belum dijawab. Tetapi setelah dikumpulkan, jawaban tidak bisa diubah; yang ada hanya pertanyaan konfirmasi sebelum mengumpulkan."

**Penjelasan:** Tab ditutup: jawaban tersimpan tetap; sisa di simpanan lokal dikirim ulang saat dibuka (F09-R01/R02, W3-K01); posisi baca pelajaran dipulihkan (W5-K01). «Kumpulkan» didahului konfirmasi: "Setelah dikumpulkan, jawaban tidak bisa diubah" (`src/lib/hle.ts:3155`); jawaban di layar yang belum tersimpan diambil dulu. Setelah FINALIZED: terminal (doc 04 baris 142-155). Tidak ditemukan fungsi atau layar untuk membuka kembali sesi yang sudah dikumpulkan, oleh siswa maupun guru.

**Mengapa PINTAR seperti ini:** Hasil yang sudah final tidak boleh berubah.

**Bukti / mekanisme di PINTAR:** Konfirmasi kumpulkan di pemutar ujian.

**Sumber:** MEMBUKTIKAN: tes F09-R01, F09-R02, W3-K01, W5-K01. MENETAPKAN ATURAN/RANCANGAN: `docs/rebuild/04-PINTAR-STATE-MACHINES.md` baris 142-155.

**Yang tidak boleh dikatakan:** "Bisa dibatalkan setelah dikumpulkan".

**Status:** SEBAGIAN
**Tingkat sensitivitas:** TINGGI

---

### Q038 — Apakah ada ujian kertas (paper) untuk siswa yang tidak punya perangkat?

**Siapa yang kemungkinan bertanya:** Kepala sekolah
**Kemungkinan ditanya:** SEDANG

**Jawaban singkat:**
"Belum. Alur ujian kertas belum ada di PINTAR 4.0 dan kami tidak punya versi atau tanggal untuk itu."

**Penjelasan:** Kanal bukti kertas (`PAPER_MANUAL_ENTRY`, `PAPER_IMPORTED`) hanya fondasi: tidak ada alur kertas yang dikirim (doc 09 baris 87-88). Alur kertas adalah LATER (doc 09 baris 117-122); OMR adalah PARK. Jenis asesmen PAPER ada di enum database dan layar punya label «Lembar kertas» (`src/lib/hle.ts:1987`), tetapi tidak ada layar kertas. Tidak ada: input nilai manual, impor hasil kertas, cetak lembar ujian.

**Mengapa PINTAR seperti ini:** Fondasi bukti disiapkan agar kertas kelak tidak mengubah arsitektur, tanpa membangun alurnya sekarang.

**Bukti / mekanisme di PINTAR:** Tidak ada selain label.

**Sumber:** MENETAPKAN ATURAN/LINGKUP: `docs/rebuild/09-PINTAR-V1-SCOPE-BOUNDARIES.md` baris 87-88, 117-122 (LATER), PARK (OMR); `docs/rebuild/06` (kanal bukti).

**Yang tidak boleh dikatakan:** "Ada mode kertas" (label ada, fitur tidak); "akan ada di 4.1".

**Status:** TIDAK DI 4.0 (LATER, tanpa versi dan tanggal)
**Tingkat sensitivitas:** PENTING

---

### Q039 — Laporan apa saja yang dilihat kepala sekolah, guru, dan kepala bagian? Dari mana angkanya?

**Siapa yang kemungkinan bertanya:** Kepala sekolah
**Kemungkinan ditanya:** TINGGI

**Jawaban singkat:**
"Pada versi yang sudah dibangun dan diuji (belum di produksi), guru melihat bukti kelasnya, Kepala departemen dan Dekan melihat ringkasan dalam lingkupnya, dan Admin sekolah melihat laporan ringkasan sekolah dan kelas. Angkanya dihitung dari bukti resmi saja, dan setiap pembaca hanya melihat apa yang menjadi haknya."

**Penjelasan:** Guru: Mengajar → kelas → «Lihat bukti» (kesimpulan kelas, daftar nama berabjad, hasil resmi per murid; GS-17; UX1-S3-BUKTI-01). Kepala departemen dan Dekan: halaman Pimpinan per Kelas dan ringkasan; Dekan: ringkasan sekolah. Admin sekolah: Konfigurasi → Laporan. «Kepala sekolah» bukan peran tersendiri di PINTAR; sekolah memberi peran sesuai kebutuhan. Angka dihasilkan `generate_report` → `metric_evaluate` per metrik katalog, hanya bukti OFFICIAL, dengan otorisasi ulang per pembaca; 12 metrik: class.participants/comprehension/net_gain/readiness_distribution/topic_mastery/misconceptions dan institution.participants/net_gain/safety_gate_pass_rate/cohort_comparison/competency_outcomes/verified_credentials (migrasi `20260918100000:288-312`). Angka GS-17 dibandingkan dengan perhitungan mentah di walk. Isolasi lingkup: F06-P09, F06-P10, F06-P12. Tidak ada: laporan terjadwal (LATER); bentuk laporan akreditasi (OD-1 terbuka). Bukti penggunaan untuk pengawas: tidak ada paket khusus; yang ada ringkasan cetak (Q041).

**Mengapa PINTAR seperti ini:** Hanya bukti resmi yang boleh membentuk laporan (INV-20).

**Bukti / mekanisme di PINTAR:** `generate_report`; `src/app/dekan/ringkasan`; `src/app/edukator/ringkasan`.

**Sumber:** MEMBUKTIKAN: tes UX1-S3-BUKTI-01, F06-P09, F06-P10, F06-P12; JOURNEY-LOG baris 94. MENETAPKAN ATURAN: D-095; INV-20; SCOPE-INVENTORY J7; OD-1.

**Yang tidak boleh dikatakan:** "Laporan akreditasi siap"; "ada laporan per mata pelajaran lintas kelas untuk semua orang".

**Status:** TERSEDIA DI 4.0 (main/staging; belum di produksi)
**Tingkat sensitivitas:** PENTING

---

### Q040 — Apakah sekolah kami dibandingkan atau diperingkat dengan sekolah lain, oleh PINTAR atau dinas?

**Siapa yang kemungkinan bertanya:** Kepala sekolah
**Kemungkinan ditanya:** SEDANG

**Jawaban singkat:**
"PINTAR tidak punya fitur peringkat antar sekolah, dan tidak ada peran untuk dinas di dalamnya. Tetapi kebijakan tertulis tentang pemakaian data gabungan oleh PINTAR belum ada, jadi kami tidak akan mengatakan 'tidak akan pernah'."

**Penjelasan:** Perbandingan antar sekolah adalah PARK ("cross-school benchmarking", doc 09 baris 141). Katalog metrik tidak memuat metrik lintas sekolah; `cohort_comparison` hanya membandingkan angkatan dalam satu sekolah. Pembaca dibatasi sekolahnya (F06-P10). Peran hanya murid, guru, Kepala departemen, Dekan, Admin sekolah, Admin platform; tidak ada peran dinas atau pengawas. Tidak ada layar peringkat sekolah. Admin platform dapat membaca ringkasan tiap sekolah (SCHOOL-DATA-EXPORT-4.0.md §B). Tidak ditemukan keputusan tertulis bahwa PINTAR tidak akan membandingkan atau memeringkat.

**Mengapa PINTAR seperti ini:** Perbandingan antar sekolah dinilai bukan kebutuhan 4.0 dan berisiko.

**Bukti / mekanisme di PINTAR:** `calc_institution_cohort_comparison`; enum `app_role`.

**Sumber:** MEMBUKTIKAN: tes F06-P10; migrasi `20260912004158:39`; SCHOOL-DATA-EXPORT-4.0.md §B. MENETAPKAN ATURAN: `docs/rebuild/09` baris 141 (PARK).

**Yang tidak boleh dikatakan:** "Tidak akan pernah dibandingkan" (tidak ada keputusan tertulis); "dinas bisa masuk" (tidak ada peran).

**Status:** PERLU VERIFIKASI TEKNIS (fakta: tidak ada fitur peringkat); kedua: KEBIJAKAN BELUM DIPUTUSKAN (pemakaian data agregat) — ▲ BELUM DIPUTUSKAN HARI INI
**Tingkat sensitivitas:** TINGGI

---

### Q041 — Bisakah laporan diunduh ke Excel atau dicetak untuk rapat, pengawas, dan akreditasi? Bukti penggunaan apa yang bisa kami tunjukkan kepada pengawas?

**Siapa yang kemungkinan bertanya:** Wakil kepala sekolah, pengawas
**Kemungkinan ditanya:** TINGGI

**Jawaban singkat:**
"Laporan ringkasan kelas dan sekolah bisa dicetak atau disimpan sebagai PDF lewat peramban, tetapi tidak bisa diunduh ke Excel. Unduh data sekolah baru dipertimbangkan sebagai kandidat 4.5 dan belum dijanjikan. Paket 'bukti penggunaan' khusus untuk pengawas belum ada."

**Penjelasan:** `SCHOOL-DATA-EXPORT-4.0.md` (D-110(b), dari kode): tidak ada CSV/XLSX/JSON/PDF data sekolah dari PINTAR. Yang bisa: «Cetak laporan» ringkasan kelas dan sekolah (cetak peramban, hanya agregat; `AksiLaporan.tsx:30`); sertifikat milik siswa (cetak atau simpan PDF; `AksiCetak.tsx`); lembar kartu kelas baru; verifikasi sertifikat publik; satu berkas Storage sekali. Layar lain hanya bisa Ctrl+P. Jejak audit hanya di layar (50 baris terakhir). Tidak ada: unduh Excel; ekspor jawaban atau hasil mentah; daftar sertifikat untuk staf; laporan tersimpan yang bisa dibuka ulang (`generated_reports` ditulis tetapi tidak ada layarnya); alat ekstraksi satu sekolah bahkan untuk tim PINTAR. Tidak ada tes yang menegaskan tombol cetak sertifikat yang sudah TERBIT. Yang bisa ditunjukkan kepada pengawas: cetakan ringkasan dan sertifikat dengan tautan verifikasi.

**Mengapa PINTAR seperti ini:** Prinsip NO HOSTAGE DATA ada (D-110), tetapi fiturnya belum.

**Bukti / mekanisme di PINTAR:** `src/components/laporan/AksiLaporan.tsx:30`; `src/components/sertifikat/AksiCetak.tsx`.

**Sumber:**
- MEMBUKTIKAN: `docs/product/SCHOOL-DATA-EXPORT-4.0.md` §A, §B, §C.
- MENETAPKAN ATURAN: D-110(a)(b).

**Yang tidak boleh dikatakan:** "Unduh ke Excel"; "ekspor semua data kapan saja"; "bukti akreditasi siap".

**Status:** SEBAGIAN (hanya cetak); kedua: ROADMAP 4.5 (kandidat) untuk ekspor
**Tingkat sensitivitas:** TINGGI

---

### Q042 — Apa artinya "data belum cukup" di laporan? Mengapa tidak ditampilkan angka nol saja?

**Siapa yang kemungkinan bertanya:** Kepala sekolah, guru
**Kemungkinan ditanya:** SEDANG

**Jawaban singkat:**
"Pada versi yang sudah dibangun dan diuji (belum di produksi), artinya jumlah hasil resmi belum cukup untuk menampilkan angka yang adil. Kami tidak menampilkan nol karena nol akan terbaca sebagai hasil buruk, padahal yang terjadi adalah belum ada cukup bukti."

**Penjelasan:** Tiap metrik punya ambang sampel sendiri: peserta 1; pemahaman, kenaikan, kesiapan, topik 5; miskonsepsi 3; kenaikan sekolah, gerbang keselamatan, kompetensi 10; kredensial terverifikasi (`institution.verified_credentials`) 1; angkatan 5 (migrasi `20260918100000:288-312`). Di bawah ambang status `below_minimum` dan tidak ada nilai. Tiga keadaan berbeda: NOT_YET_EVALUABLE («Belum ada yang memenuhi syarat»), INSUFFICIENT_EVIDENCE («Sudah ada, belum cukup»), SUFFICIENT_EVIDENCE (F06-P16). Teks layar: «Belum cukup data untuk menampilkan angka ini» dan «Belum cukup bukan berarti buruk — artinya belum». Tiap angka yang kurang diberi kalimat syarat munculnya (DAISY-07-LAPORAN-01). Aturan "tanpa nol rekaan" bersumber J7.1 (SCOPE-INVENTORY baris 150), dengan D-003, D-038, D-064. Catatan: frasa persis «data belum cukup» tidak ada di layar; yang ada «Belum cukup data…» dan «bukti belum cukup».

**Mengapa PINTAR seperti ini:** Ketiadaan bukan temuan (X.5).

**Bukti / mekanisme di PINTAR:** `src/lib/hle.ts:2062, 2165-2168, 4518`.

**Sumber:** MEMBUKTIKAN: tes F06-P16, DAISY-07-LAPORAN-01. MENETAPKAN ATURAN: D-003, D-038, D-064; SCOPE-INVENTORY J7.1, X.5.

**Yang tidak boleh dikatakan:** "Belum cukup berarti nilainya jelek"; "angka 0".

**Status:** TERSEDIA DI 4.0 (main/staging; belum di produksi)
**Tingkat sensitivitas:** NORMAL

---

### Q043 — Apakah sertifikat PINTAR resmi? Apakah diakui dinas atau sekolah lain?

**Siapa yang kemungkinan bertanya:** Orang tua, kepala sekolah
**Kemungkinan ditanya:** TINGGI

**Jawaban singkat:**
"Sertifikat PINTAR dapat diverifikasi keasliannya lewat tautan atau kode QR dan tidak bisa dipalsukan dengan mengubah isinya. Tetapi kami tidak punya keputusan atau dokumen yang menyatakan sertifikat ini diakui dinas, kementerian, atau sekolah lain, jadi kami tidak mengatakan 'resmi' dalam arti hukum."

**Penjelasan:** Yang dibuktikan: ditandatangani secara kriptografis oleh server, dapat diverifikasi publik, tidak bisa dipalsukan dari muatan yang diubah (F04-S05, F04-S04, EVAL-S02, UX1-S1-QR-01). Syarat terbit: bukti OFFICIAL, mode bersertifikat, gerbang keselamatan, nilai ≥ batas sekolah yang disegel (D-078, D-081, D-082(d)); satu Uji Cepat tidak menerbitkan sertifikat (BOB-50; migrasi `20261113100000`). Footer halaman hanya memuat empat baris identitas, tanpa klaim hukum (UX1-S1-KAKI-01). D-003: sertifikat dari dua sekolah produksi adalah sertifikat nyata. Tidak ditemukan: dokumen atau keputusan pengakuan oleh dinas, kementerian, atau sekolah lain; kerja sama akreditasi; klaim ijazah (dicari diakui, Kemendikbud, ijazah, BSN). Kata «resmi» di PINTAR berarti "bukti OFFICIAL" (bukan pengakuan hukum).

**Mengapa PINTAR seperti ini:** Keaslian teknis dapat dibuktikan; pengakuan hukum bukan wewenang produk.

**Bukti / mekanisme di PINTAR:** `/verifikasi/[token]`; tes di atas.

**Sumber:**
- MEMBUKTIKAN: tes F04-S05, F04-S04, EVAL-S02, UX1-S1-QR-01, UX1-S1-KAKI-01; migrasi `20261113100000`.
- MENETAPKAN ATURAN: D-003, D-078, D-081, D-082(d). Pengakuan pihak luar: **tidak ditemukan**.

**Yang tidak boleh dikatakan:** "Sertifikat resmi diakui dinas"; "setara ijazah"; "sah menurut hukum".

**Status:** PERLU VERIFIKASI HUKUM (pengakuan pihak luar); keaslian teknis: TERSEDIA DI 4.0
**Tingkat sensitivitas:** TINGGI

---

### Q044 — Bagaimana pihak luar memeriksa keaslian sertifikat? Apakah data siswa ikut terbuka?

**Siapa yang kemungkinan bertanya:** Orang tua, komite sekolah
**Kemungkinan ditanya:** SEDANG

**Jawaban singkat:**
"Pada versi yang sudah dibangun dan diuji (belum di produksi), siapa pun dengan tautan atau kode QR dapat memeriksa. Yang tampil hanya status lulus, predikat, sekolah, tanggal, dan status keabsahan, tanpa nama, skor, atau foto siswa. Pemeriksa mencocokkan dengan sertifikat cetak yang memuat nama."

**Penjelasan:** Satu rute publik `/verifikasi/[token]` (halaman) dan `/api/verifikasi/[token]` (JSON); token acak 32 byte, tidak diturunkan dari apa pun (F04-T10, F04-S01, F01-R07). Yang terbuka: persis lima bidang `{pass, predikat, institution, date, validity}` ("validity" berarti status keabsahan SAH atau TIDAK SAH, bukan tanggal kedaluwarsa; `route.ts:34-36`); tanpa nama, foto, skor, kunci, atau muatan (F04-T10, F04-S05, EVAL-S02). Status BERLAKU, DICABUT, DIGANTIKAN, atau TIDAK SAH. Token acak, belum terbit, atau salah bentuk menghasilkan jawaban yang sama (tanpa oracle keberadaan; F04-S05, DAISY-04-TIDAK-ADA-01). Konflik antara keputusan dan kode: D-080(8) menetapkan domain kanonik `verifikasi.pintarselalu.com` dan D-080(2) memutuskan nomor berbentuk `<PINTAR ID>/<urut>` (D-076(c) hanya usulan; D-073(b) mencatat format kode sekarang), sedangkan kode membangun tautan dari alamat aplikasi (`sertifikat/page.tsx:121`) dan memakai format `PINTAR/<slug>/<tahun>/<urut>`; BOB-48/DAISY-36 tampak belum dibangun.

**Mengapa PINTAR seperti ini:** Verifikasi harus mudah bagi pihak luar tanpa membocorkan data pribadi.

**Bukti / mekanisme di PINTAR:** `src/app/api/verifikasi/[token]/route.ts:25-30`; migrasi `20260914103000`.

**Sumber:** MEMBUKTIKAN: tes F04-T10, F04-S01, F04-S05, EVAL-S02, F01-R07, DAISY-04-TIDAK-ADA-01. MENETAPKAN ATURAN: D-073(b), D-076(c) (usulan), D-080(2)(8).

**Yang tidak boleh dikatakan:** "Verifikasi di verifikasi.pintarselalu.com"; "nomor memakai PINTAR ID"; "tidak ada data pribadi sama sekali" (sekolah, tanggal, dan predikat terbuka).

**Status:** TERSEDIA DI 4.0 (main/staging; belum di produksi); kedua: SEBAGIAN (domain dan format nomor belum sesuai keputusan)
**Tingkat sensitivitas:** KRITIS

---

### Q045 — Kalau nama di sertifikat salah, atau sertifikat sudah diterbitkan lalu ternyata keliru, bagaimana?

**Siapa yang kemungkinan bertanya:** Administrator sekolah
**Kemungkinan ditanya:** SEDANG

**Jawaban singkat:**
"Nama yang salah hanya dapat dikoreksi oleh Admin platform dengan alasan, dan sertifikat yang sudah terbit tidak ditulis ulang. Pencabutan sertifikat yang keliru ada di tingkat database, tetapi belum ada layar untuk sekolah, dan penerbitan ulang belum ada."

**Penjelasan:** Nama pada sertifikat adalah salinan saat terbit; koreksi nama kemudian tidak menulis ulang sertifikat lama (F18-N04; D-077(d)). Hanya Admin platform yang dapat `correct_person_name`, dengan alasan dan audit; Admin sekolah, guru, orang itu, dan kartu ditolak (F18-N03). Pencabutan: `revoke_certificate` (butuh kewenangan menerbitkan di sekolah, alasan wajib, audit, tidak dicabut dua kali; migrasi `20261111100000:354-377`); halaman siswa menampilkan banner «dicabut». Tidak ada: layar pencabutan dan layar koreksi nama (tidak ditemukan di `src/`); penerbitan ulang dengan nama baru ("tidak ada jalur penerbitan ulang"); ADM-18 mencatat pencabutan dan risiko tabrakan nomor belum pernah diuji (PHASE-1-STATUS baris 188, 1 Okt; F04-T10 kemudian menutup pencabutan di database); tidak ditemukan tes konkurensi nomor. Nama sekolah dan bahasa sertifikat belum disegel (J8.3; BOB-48 tampak belum dibangun); foto masih disalin ke salinan sertifikat padahal T4 melarangnya (tidak ada foto sehingga tidak berdampak, Q059).

**Mengapa PINTAR seperti ini:** Sertifikat yang terbit tidak ditulis ulang diam-diam (J8.3).

**Bukti / mekanisme di PINTAR:** Migrasi `20261112100000:296-301`, `20261111100000:354-377`.

**Sumber:**
- MEMBUKTIKAN: tes F18-N01/N02/N03/N04, F04-T10 (pencabutan); migrasi di atas.
- MENETAPKAN ATURAN: D-077(d); SCOPE-INVENTORY J8.3, J8.5; `docs/recovery/PHASE-1-STATUS.md:188`.

**Yang tidak boleh dikatakan:** "Sekolah bisa memperbaiki nama sendiri"; "sertifikat diterbitkan ulang otomatis"; "nama sekolah dikunci pada sertifikat".

**Status:** SEBAGIAN
**Tingkat sensitivitas:** TINGGI

---

### Q046 — Apakah AI yang menentukan siswa lulus atau tidak?

**Siapa yang kemungkinan bertanya:** Guru, orang tua
**Kemungkinan ditanya:** TINGGI

**Jawaban singkat:**
"Tidak. Penilaian dihitung oleh aturan yang pasti di server dari jawaban siswa, dan lulus ditentukan oleh batas yang ditetapkan sekolah. Tidak ada kecerdasan buatan di dalam penentuan itu."

**Penjelasan:** Penilaian per soal deterministik di database (`grade_response`: `exact_option`, `set_match`); skor dan gerbang keselamatan dihitung server dari jawaban mentah (INV-09, INV-10). Lulus berarti penguasaan ≥ batas sekolah yang disegel dan gerbang keselamatan lolos (F03-T07, BOB49-S01). Bantuan tidak memengaruhi skor (INV-11; F03-T08). Sinyal integritas tidak mengubah skor (F04-T07: "no scoring function or view can read the table; it carries no verdict column"). Tidak ada kode pemanggilan model di `src/` atau `supabase/` (Q048).

**Mengapa PINTAR seperti ini:** AI tidak memiliki otoritas pedagogis dan tidak menerbitkan apa pun sendiri (INV-32).

**Bukti / mekanisme di PINTAR:** Migrasi `20260913091500`.

**Sumber:** MEMBUKTIKAN: tes F03-T07, F03-T08, BOB49-S01, F04-T07. MENETAPKAN ATURAN: INV-09, INV-10, INV-11, INV-32; D-081.

**Yang tidak boleh dikatakan:** "AI membantu menilai"; "nilai dihitung kecerdasan buatan".

**Status:** TIDAK DILAKUKAN PINTAR (ini fakta kode, bukan hanya janji)
**Tingkat sensitivitas:** KRITIS

---

### Q047 — Apakah PINTAR akan menggantikan guru?

**Siapa yang kemungkinan bertanya:** Guru honorer, orang yang skeptis terhadap AI
**Kemungkinan ditanya:** TINGGI

**Jawaban singkat:**
"Tidak ada fitur di PINTAR yang mengerjakan tugas guru secara mandiri. Gurulah yang meluncurkan asesmen, menugaskan materi, melihat siswa yang butuh bantuan, dan memutuskan tindak lanjut."

**Penjelasan:** Guru meluncurkan Uji Cepat, menyediakan materi, melihat siswa di bawah target, dan menugaskan baca ulang (J5.12; M3R-S01); "tidak ada remediasi adaptif otomatis" (J5.12; §10). Saran «apa berikutnya» bersifat bantuan berbasis aturan (BOB40-K01; J5.10). Pimpinan: «PINTAR mengusulkan, manusia memutuskan» (UX1-PIMPINAN-KEPUTUSAN-01: "automates nothing"). Konten sekolah ditinjau orang kedua sebelum terbit (INV-32; `content_lifecycle.sql:142`; F12-P03). Tidak ada tutor AI, guru virtual, atau pembelajaran adaptif otomatis. Tidak ditemukan keputusan tertulis yang menyatakan sikap resmi "PINTAR tidak menggantikan guru"; jawaban ini bersandar pada ketiadaan fitur.

**Mengapa PINTAR seperti ini:** PINTAR mengamati dan menyorot; pendidik memutuskan.

**Bukti / mekanisme di PINTAR:** Alur guru; tes BOB40-K01, M3R-S01.

**Sumber:** MEMBUKTIKAN: tes BOB40-K01, M3R-S01, UX1-PIMPINAN-KEPUTUSAN-01, F12-P03. MENETAPKAN ATURAN: SCOPE-INVENTORY J5.10, J5.12, §10; INV-32; `docs/rebuild/10` §2.

**Yang tidak boleh dikatakan:** "PINTAR mengajar menggantikan guru"; "personalisasi AI".

**Status:** PERLU VERIFIKASI TEKNIS (fakta: tidak ada fitur yang menggantikan; sikap resmi tertulis tidak ditemukan)
**Tingkat sensitivitas:** PENTING

---

### Q048 — AI apa saja yang benar-benar ada di PINTAR hari ini, dan bisakah sekolah memakai PINTAR tanpa fitur AI?

**Siapa yang kemungkinan bertanya:** Orang yang skeptis terhadap AI, bagian IT
**Kemungkinan ditanya:** TINGGI

**Jawaban singkat:**
"Berdasarkan kode kami, hari ini tidak ada fitur AI yang aktif di PINTAR: tidak ada pemanggilan ke penyedia model AI. Ada sebuah fondasi 'AI Provider Gateway' yang baru berupa kontrak dan batas keamanan, belum dipakai. Jadi sekolah memakai PINTAR tanpa AI secara bawaan."

**Penjelasan:** Pencarian `anthropic|openai|gemini|gpt|llm|bedrock|vertex|mistral|cohere|ollama|huggingface|langchain` di `src/`, `supabase/`, `package.json`, skrip, `vercel.json`, `next.config.ts`: nol hasil di kode produk. Dependensi runtime hanya `@supabase/ssr`, `@supabase/supabase-js`, `next`, `nodemailer`, `react`, `react-dom`. Tidak ada `supabase/functions`; tidak ada ekstensi jaringan di database. `src/ai-gateway/` berisi `README.md` dan `contexts.ts`: kontrak konteks bantuan pelajar yang dibangun ulang dari daftar putih dan menolak bidang kunci (INV-31); tidak ada penyedia, rute, nama model, kunci, atau panggilan (F03-S03). Bahwa kode aplikasi tidak mengimpornya adalah hasil pencarian kode, bukan hasil tes. Doc 09: gateway = FOUNDATION NOW; "multi-provider AI routing" dan "sophisticated AI academic analysis" = LATER. Petunjuk siswa adalah teks buatan penulis yang dilayani `open_assistance()` dan divalidasi INV-02 (F02-T22, F03-T09); validator konten "coaching" berbasis aturan (F02-T19).

**Mengapa PINTAR seperti ini:** Domain dan UI tidak memanggil penyedia AI secara langsung; AI tidak berotoritas pedagogis (INV-31, INV-32).

**Bukti / mekanisme di PINTAR:** `src/ai-gateway/README.md`, `contexts.ts`; `package.json`.

**Sumber:**
- MEMBUKTIKAN: pencarian kode (ketiadaan); `src/ai-gateway/README.md`; tes F03-S03, F02-T19, F02-T22, F03-T09.
- MENETAPKAN ATURAN: `docs/rebuild/09` baris 77-81, 117; INV-31, INV-32.

**Yang tidak boleh dikatakan:** "PINTAR memakai AI untuk personalisasi, penilaian, atau petunjuk"; "AI Provider Gateway sudah aktif".

**Status:** SEBAGIAN (tidak ada fitur AI aktif; gateway = DIBANGUN, BELUM AKTIF, berupa kontrak saja)
**Tingkat sensitivitas:** TINGGI

---

### Q049 — Apakah data siswa dikirim ke perusahaan AI di luar negeri?

**Siapa yang kemungkinan bertanya:** Petugas perlindungan data
**Kemungkinan ditanya:** TINGGI

**Jawaban singkat:**
"Produk PINTAR sendiri tidak mengirim data sekolah ke penyedia AI; itu hasil pencarian kode kami. Soal alat berbantuan AI yang dipakai personel pengembangan dan operasi PINTAR, kebijakannya belum ada. Data produksi juga disimpan di Singapura lewat penyedia infrastruktur, jadi kami tidak akan mengatakan 'tidak ada data keluar negeri'."

**Penjelasan:** Dua hal berikut tidak pernah digabung (D-112(a)).
- **(i) Produk PINTAR (temuan pencarian kode, di `main`/staging):** tidak ditemukan satu pun panggilan keluar ke penyedia AI. Pemanggilan `fetch` di `src/` hanya ke asal PINTAR sendiri dan Supabase; host eksternal dalam kode hanya domain PINTAR. Database tidak punya ekstensi jaringan. Font dilayani sendiri. Surel lewat `nodemailer` ke SMTP (BOB25-K01). Verifikasi runtime atau log jaringan tidak dilakukan.
- **(ii) Personel pengembangan dan operasi PINTAR:** mereka memakai alat berbantuan AI yang dapat menjangkau sistem hosted, misalnya sesi koordinator yang membaca staging dan produksi lewat konektor database (D-112(a); RESUME-2026-10-06; BACKUP-DR-REVIEW:423). Ini **kebijakan yang belum diputuskan**: siapa boleh memakai alat semacam itu, terhadap lingkungan dan data mana, untuk tujuan apa, dengan audit dan minimisasi apa. Dokumen ini tidak merumuskannya.
- Lokasi data: Supabase ap-southeast-1 (Singapura) dan Vercel `sin1`; salinan luar situs dirancang di AWS S3 Singapura, belum aktif. Tidak ada kebijakan pengolah data, perjanjian pemrosesan data, atau kebijakan privasi tertulis (hanya OD-5 tentang retensi).

**Mengapa PINTAR seperti ini:** Konteks AI di produk dibatasi allow-list dan belum ada penyedia (INV-31).

**Bukti / mekanisme di PINTAR:** Pencarian `fetch(` di `src/`; `vercel.json`; `package.json`.

**Sumber:** MEMBUKTIKAN: pencarian kode; `src/ai-gateway/README.md`; tes BOB25-K01, F03-S03. MENETAPKAN ATURAN: D-112(a); OD-5 (`docs/rebuild/11` baris 80-95). Kebijakan alat berbantuan AI dan pengolah data: **tidak ditemukan**.

**Yang tidak boleh dikatakan:** "Tidak ada data keluar negeri"; "tidak ada AI yang menyentuh data kami"; menyatukan (i) dan (ii) dalam satu kalimat; merumuskan kebijakan (ii) sebelum diputuskan.

**Status:** PERLU VERIFIKASI TEKNIS (i: temuan pencarian kode; belum diverifikasi runtime); kedua: KEBIJAKAN BELUM DIPUTUSKAN (ii: alat berbantuan AI, D-112(a)) dan PERLU VERIFIKASI HUKUM — ▲ BELUM DIPUTUSKAN HARI INI
**Tingkat sensitivitas:** KRITIS

---

### Q050 — Kalau AI salah, siapa yang bertanggung jawab?

**Siapa yang kemungkinan bertanya:** Kepala sekolah, pengurus yayasan
**Kemungkinan ditanya:** TINGGI

**Jawaban singkat:**
"Secara produk, AI tidak mengambil keputusan dan tidak menerbitkan apa pun sendiri: selalu ada manusia yang menerbitkan dan menyetujui. Soal siapa yang menanggung secara kontrak bila ada kesalahan, belum ada ketentuan tertulis, dan itu perlu dijawab bersama penasihat hukum."

**Penjelasan:** AI tidak punya otoritas dan tidak ada di produk (Q046, Q048). Aturan: "AI mengusulkan → PINTAR memvalidasi → manusia memerintah"; tidak ada AI atau alat luar yang bisa menerbitkan atau menugaskan konten; wajib manusia berkewenangan menerbitkan (INV-32; F02-T03, F02-T08). Konten sekolah: penulis dan peninjau berbeda orang (D-041; D-088(h)). Konten contoh PINTAR disusun oleh sesi kerja berbantuan AI dari PDF buku yang diberikan pemilik dan diperiksa koordinator (juga sesi AI) (`docs/coordination/briefs/LANA.md`; D-082(c)); tidak ada penanda "dibuat AI" di data (hanya `producer_identifier` teks bebas opsional). Tidak ditemukan: kebijakan tanggung jawab atau liabilitas, ketentuan layanan, penanggung jawab keputusan pedagogis tertulis; peninjauan manusia atas konten nyata tidak terbukti oleh repositori.

**Mengapa PINTAR seperti ini:** PINTAR tidak menjadikan AI alasan untuk keputusan yang tidak dapat dijelaskan kepada manusia.

**Bukti / mekanisme di PINTAR:** Kewenangan menerbitkan yang hanya dipegang manusia; migrasi `20260912201500:258`.

**Sumber:**
- MEMBUKTIKAN: tes F02-T03, F02-T08; `src/app/studio/actions.ts:345`.
- MENETAPKAN ATURAN: INV-32 (`docs/rebuild/03` baris 48); D-041, D-082(c), D-088(h). Kebijakan tanggung jawab: **tidak ditemukan**.

**Yang tidak boleh dikatakan:** "Semua konten ditinjau guru ahli"; "PINTAR menanggung kesalahan AI"; "konten bebas AI" (konten contoh disusun dengan bantuan AI).

**Status:** SEBAGIAN; kedua: KEBIJAKAN BELUM DIPUTUSKAN / PERLU VERIFIKASI HUKUM — ▲ BELUM DIPUTUSKAN HARI INI
**Tingkat sensitivitas:** TINGGI

---


## Kelompok 3 — Integritas, privasi, kepemilikan data, ekspor, keamanan, akun (Q051–Q069)

> **Catatan lintas-pertanyaan untuk pembaca kelompok ini.**
> 1. **Produksi belum memuat sebagian besar yang dikutip.** `RESUME-2026-10-06.md`: produksi masih menjalankan build `5b5b68d` dengan 111 migrasi; `main` dan staging 162. Fitur dari migrasi ≥112 (masuk dengan kata sandi, pemulihan, kunci komputer bersama, «Laporkan masalah», antrean keputusan rujukan integritas) terbukti ada di kode `main`/staging dan oleh tes, **bukan terbukti aktif di produksi**. Sebelum klaim ke sekolah, status produksi harus diperiksa.
> 2. Cadangan/pemulihan (#150) belum lulus (lihat Q070–Q072). Berkas Storage tidak ikut cadangan database.
> 3. **Tidak ditemukan di repositori:** kebijakan privasi, ketentuan layanan, perjanjian pemrosesan data, prosedur insiden/kebocoran, laporan uji penetrasi, sertifikasi keamanan, pernyataan tertulis tentang pemakaian data untuk iklan/riset/pelatihan model.
> 4. "Admin platform" (SYSTEM_ADMIN) adalah satu-satunya peran staf PINTAR di dalam aplikasi; hanya satu orang yang ditunjuk, dan admin kedua harus ditunjuk sebelum 23 September 2027 (D-001).

### Q051 — Apakah PINTAR merekam kamera, layar, atau ketikan siswa selama ujian?

**Siapa yang kemungkinan bertanya:** Orang tua, siswa
**Kemungkinan ditanya:** TINGGI

**Jawaban singkat:**
"Tidak. PINTAR tidak memakai kamera, mikrofon, rekaman layar, atau pencatat ketikan. Yang dicatat hanya beberapa sinyal sederhana, misalnya tab ujian disembunyikan, koneksi putus lalu tersambung, atau jawaban diganti berulang kali dengan cepat, dan siswa diberi tahu tentang itu sebelum mulai."

**Penjelasan:**
- Kode di sisi siswa hanya mengirim tiga jenis pengamatan: tab tersembunyi, koneksi putus-lalu-tersambung, dan pilihan jawaban diubah ≥3 kali dalam 5 detik; paling banyak satu per jenis per 10 detik. Isinya fakta (misalnya status tab, nomor soal, jumlah perubahan), bukan isi jawaban dan bukan ketikan. Tabel `integrity_signals` tidak punya kolom vonis.
- Dua kategori lain yang ada di skema (`NAVIGATION`, `SUBMISSION_ANOMALY`) tidak punya pengirim di kode, jadi tidak benar-benar direkam.
- Terpisah dari itu PINTAR mencatat telemetri belajar: lama siswa menatap tiap soal dan bantuan yang dibuka (petunjuk, contoh, glosarium, baca-keras). Itu tidak dipakai menilai dan tidak bisa dibaca dari sisi siswa.
- Pencarian kode kamera, mikrofon, `getUserMedia`, perekam ketikan di `src/`: kosong.
- Sebelum asesmen dimulai, siswa membaca: «Selama asesmen, aktivitas sesi tertentu dapat dicatat untuk menjaga integritas proses. Catatan ini merupakan observasi dan tidak menentukan hasil Anda secara otomatis.» Tes memastikan kata "dipantau", "monitored", "webcam", "screen recording" tidak muncul di layar itu.

**Mengapa PINTAR seperti ini:** Pengawasan invasif ditolak: bukti integritas harus proporsional dan hanya menjadi bahan pertimbangan manusia, tidak pernah vonis.

**Bukti / mekanisme di PINTAR:** `src/app/belajar/_components/ItemPlayer.tsx:362-390, 495-505`; `src/app/belajar/actions.ts:79-92`; `supabase/migrations/20260912194342_telemetry_and_integrity.sql:40-80`; teks orientasi `src/lib/hle.ts:3238`; tes F04-T07, F02-T16, UX1-S2-MELIHAT-01.

**Sumber:**
- MEMBUKTIKAN: kode dan migrasi di atas; tes F04-T07, F02-T16, UX1-S2-MELIHAT-01.
- MENETAPKAN ATURAN: `docs/rebuild/06-PINTAR-EVIDENCE-AND-TELEMETRY-CONTRACT.md` baris 110; `docs/rebuild/09-PINTAR-V1-SCOPE-BOUNDARIES.md` (PARK: pengawasan webcam/mikrofon/layar, perekam ketikan).

**Yang tidak boleh dikatakan:** "Tidak ada yang direkam" (ada sinyal dan telemetri waktu); "ujian anti-curang" atau "diawasi ketat"; "lima kategori direkam" (hanya tiga yang dikirim).

**Status:** SEBAGIAN (yang direkam: tiga sinyal + telemetri; yang tidak dilakukan: kamera, mikrofon, layar, ketikan = PARK)
**Tingkat sensitivitas:** KRITIS

---

### Q052 — Aktivitas yang dianggap tidak biasa otomatis berarti siswa menyontek?

**Siapa yang kemungkinan bertanya:** Guru, orang tua
**Kemungkinan ditanya:** TINGGI

**Jawaban singkat:**
"Pada versi yang sudah dibangun dan diuji (belum di produksi), tidak. Sinyal itu hanya bahan pertimbangan untuk manusia. Sinyal tidak mengubah nilai, tidak membuat kesimpulan tentang siswa, dan tidak menghasilkan keputusan apa pun sampai seseorang di sekolah meninjaunya."

**Penjelasan:** Sinyal tidak punya kolom vonis dan tidak bisa dibaca oleh fungsi penilaian. Tidak ada ambang yang mengubah sinyal menjadi hasil: tes F06-P15 menyatakan "sinyal tidak menciptakan apa pun: tidak ada catatan Manajemen dan tidak ada hasil sampai seorang manusia bertindak". Peninjau memilih salah satu dari tiga tindakan yang menggambarkan apa yang *peninjau* lakukan, bukan sesuatu tentang siswa: «Tidak ada yang perlu ditindaklanjuti», «Sudah dibicarakan dengan siswa», «Diteruskan ke pihak sekolah». Keputusan itu menjadi baris audit; «Diteruskan ke pihak sekolah» (REFERRED_TO_INSTITUTION) juga membuat satu rujukan dengan status AWAITING_REVIEW (F06-P22). Penghentian sesi: F04-T06.
Catatan jujur: di database ada fungsi untuk menurunkan kelas bukti sebuah sesi dari OFFICIAL dan fungsi menghentikan sesi (tes F06-P04). Tidak ditemukan halaman atau tombol yang memanggilnya, jadi tidak terjangkau pengguna sekolah. Namun itu berarti "sinyal tidak pernah berdampak apa pun pada hasil" tidak boleh diucapkan secara mutlak.

**Mengapa PINTAR seperti ini:** "Automatic cheating verdicts" ditolak; keputusan integritas butuh otoritas manusia (INV, doc 10 baris 54).

**Bukti / mekanisme di PINTAR:** `src/lib/hle.ts:3456-3460`; `supabase/migrations/20260915160000_studio_surfaces.sql:187-221`; layar tinjauan `/studio/integritas`.

**Sumber:**
- MEMBUKTIKAN: tes F04-T07, F02-T16, F06-P15, F06-P22.
- MENETAPKAN ATURAN: `docs/rebuild/10-PINTAR-REMOVED-AND-REJECTED-FEATURES.md` baris 54; SCOPE-INVENTORY J7.6.

**Yang tidak boleh dikatakan:** "Sistem mendeteksi kecurangan"; "sinyal tidak berdampak apa pun pada hasil" tanpa catatan di atas.

**Status:** TERSEDIA DI 4.0 (main/staging; belum di produksi)
**Tingkat sensitivitas:** KRITIS

---

### Q053 — Siapa yang melihat sinyal integritas? Apakah siswa atau orang tua diberi tahu? Bagaimana siswa membela diri?

**Siapa yang kemungkinan bertanya:** Orang tua, kepala sekolah
**Kemungkinan ditanya:** SEDANG

**Jawaban singkat:**
"Sinyal dilihat oleh pihak sekolah yang berwenang meninjau, bukan oleh siswa atau orang tua, dan PINTAR tidak mengirim pemberitahuan kepada mereka. Alur banding resmi di dalam PINTAR belum ada; yang ada hanya pembicaraan antara sekolah dan siswa di luar sistem."

**Penjelasan:**
- Pembaca: pemegang kewenangan meninjau integritas, yaitu Kepala departemen, Admin sekolah, dan Admin platform. Guru dan Dekan tidak. Siswa tidak melihat sinyal ("karena sinyal bukan tuduhan", komentar kebijakan migrasi).
- Layar `/studio/integritas` hanya menampilkan ID sesi pendek, jenis sinyal, dan waktu (maksimal 50 baris) dengan formulir catat tinjauan.
- Pilihan «Diteruskan ke pihak sekolah» membuat satu antrean keputusan Pimpinan di kelas atau departemen terkait.
- Tidak ada kode yang memberi tahu siswa atau orang tua. «Sudah dibicarakan dengan siswa» hanya pilihan yang dicatat peninjau.
- Orang tua bukan pengguna di 4.0.
- Alur banding/hak membela diri: **tidak ditemukan** (dicari banding, appeal, membela diri, hak jawab, sanggah). "Integrity Case workflow" ada di LATER.
- Konflik sumber: doc 05 baris 108 menyebut guru boleh membaca sinyal kelasnya, sedangkan kode dan J5.8 menyatakan guru tidak. Yang berlaku: kode dan J5.8. Selain itu, kebijakan baca sinyal di database berlaku untuk seluruh sekolah, sedangkan rujukan dibatasi kelas/departemen (D-062(d)); apakah Kepala departemen secara teknis dapat membaca sinyal departemen lain **perlu verifikasi teknis**.

**Mengapa PINTAR seperti ini:** Sinyal bukan tuduhan; manusia di sekolah yang memutuskan (doc 06, D-062(d)).

**Bukti / mekanisme di PINTAR:** `src/app/studio/integritas/page.tsx`; kebijakan `integrity_signals_select`; peran `role_capabilities` (migrasi `20260926100000`).

**Sumber:**
- MEMBUKTIKAN: tes F06-P15, F06-P22, BOB39-K01.
- MENETAPKAN ATURAN: SCOPE-INVENTORY J7.6, J5.8; D-062(d); D-069(c); `docs/rebuild/09` (LATER: orang tua, Integrity Case workflow).

**Yang tidak boleh dikatakan:** "Siswa bisa mengajukan banding"; "orang tua diberi tahu"; "siswa dan orang tua melihat catatannya".

**Status:** SEBAGIAN (peninjauan manusia ada; pemberitahuan siswa/orang tua dan alur banding tidak ada)
**Tingkat sensitivitas:** KRITIS

---

### Q054 — Data apa saja tentang siswa yang dikumpulkan PINTAR?

**Siapa yang kemungkinan bertanya:** Petugas perlindungan data, orang tua
**Kemungkinan ditanya:** TINGGI

**Jawaban singkat:**
"Secara garis besar: nama tampilan, nomor kartu, keanggotaan kelas, dan seluruh jejak belajar siswa di PINTAR: jawaban, hasil, kemajuan, serta catatan waktu dan bantuan. Siswa tidak memakai email. Daftar resmi dan kebijakan privasi tertulis belum ada, jadi kami akan menyusunnya sebelum menjanjikan daftar final."

**Penjelasan:** Dari skema database (bukan dari kebijakan):
- `persons`: nama tampilan, jalur foto profil (belum ada layar; lihat Q059), tanda anonimisasi.
- `accounts`: nomor kartu (akun kartu kelas). Siswa tidak memakai email untuk masuk (sebuah alamat sintetis dibuat untuk akun kartu: `src/lib/card.ts:19-21`); tidak ada kolom NISN, tanggal lahir, alamat, atau telepon di skema ini.
- Pendaftaran, keanggotaan, nomor induk sekolah; sesi asesmen, jawaban, soal yang ditampilkan, hasil, kemajuan pelajaran.
- Telemetri waktu/bantuan dan sinyal integritas (Q051).
- Catatan audit: waktu, pelaku, tindakan, target, ringkasan, build (hanya tambah, tidak bisa diubah).
- «Laporkan masalah» hanya untuk staf, tetapi teks bebasnya dapat menyebut siswa.
- Retensi belum berjalan dan data orang tidak bisa dihapus (lihat Q081).

**Mengapa PINTAR seperti ini:** Bukti belajar adalah inti produk; dikumpulkan seperlunya dan terikat sekolah.

**Bukti / mekanisme di PINTAR:** `supabase/migrations/20260912004321_identity_enrollment.sql:12-34`; `20260912004158_foundation_base.sql:73-95`; `20261119100000_a_staff_member_reports_a_problem.sql:22-60`; `src/lib/card.ts:19-21`.

**Sumber:**
- MEMBUKTIKAN: migrasi di atas; `docs/product/SCHOOL-DATA-EXPORT-4.0.md` §D.
- MENETAPKAN ATURAN: SCOPE-INVENTORY J2.19; `docs/rebuild/06` (kategori bukti). Inventaris data resmi: **tidak ditemukan**.

**Yang tidak boleh dikatakan:** "Kami hanya mengumpulkan nama dan hasil belajar"; "tidak ada data perilaku".

**Status:** SEBAGIAN; kedua: PERLU VERIFIKASI TEKNIS (daftar berasal dari skema, belum dari dokumen yang disetujui)
**Tingkat sensitivitas:** KRITIS

---

### Q055 — Siapa di PINTAR yang bisa melihat data dan nilai siswa kami? Apakah staf PINTAR bisa membuka nilai siswa?

**Siapa yang kemungkinan bertanya:** Kepala sekolah, bagian IT
**Kemungkinan ditanya:** TINGGI

**Jawaban singkat:**
"Secara teknis, ya: ada beberapa jalur bagi pihak PINTAR untuk mengakses data sekolah, termasuk hasil individual siswa. Kebijakan tertulis tentang kapan itu boleh dilakukan dan pencatatan semua akses belum ada, jadi kami tidak akan mengatakan 'tidak bisa'."

**Penjelasan:** Jalur akses yang ada:
1. **Admin platform** (peran di dalam aplikasi): memegang kewenangan melihat hasil siswa dan, lewat aturan akses database, dapat membaca hasil individual, daftar murid, dan log audit semua sekolah. Jawaban mentah dapat dibaca siswa itu sendiri atau pemegang kewenangan meninjau integritas di sekolah tersebut, termasuk Admin platform.
2. **Server aplikasi:** berjalan dengan kunci server yang memintas aturan akses baris (detail teknis: tim teknis).
3. **Pemilik project database:** dasbor dan SQL langsung; tidak ada kebijakan akses di repositori.
4. **Cadangan penyedia database** dan, setelah aktif, salinan independen; salinan independen memuat data semua sekolah (D-107(c)).
5. **Alat berbantuan AI milik personel pengembangan dan operasi** yang dapat menjangkau sistem hosted (misalnya sesi koordinator yang membaca staging dan produksi lewat konektor database; RESUME-2026-10-06; BACKUP-DR-REVIEW:423). Ini **kebijakan yang belum diputuskan** (D-112(a); lihat Q049).
Pencatatan: sebagian pembacaan **diaudit**, misalnya pembukaan detail murid oleh pimpinan (`learner_detail.opened`, F06-P12), tetapi tidak ada log akses-baca menyeluruh untuk Admin platform, pemilik project, atau alat berbantuan AI. Admin sekolah tidak memegang kewenangan melihat hasil individual; Dekan hanya daftar (R6). Konflik sumber: doc 05 baris 55 ("jawaban mentah: SERVICE saja") berbeda dari kebijakan database (peninjau integritas juga bisa).

**Mengapa PINTAR seperti ini:** Tim operasional perlu dapat membantu sekolah, tetapi kontrol tertulis atas akses staf belum dibuat.

**Bukti / mekanisme di PINTAR:** `supabase/migrations/20260924100000_an_administrator_is_not_an_examiner.sql`; `20260912004431_authorization.sql:36-44, 91, 130-136`; `20261118100000_an_educator_learns_as_a_participant.sql:768-775`.

**Sumber:**
- MEMBUKTIKAN: migrasi di atas; tes F06-P12; RESUME-2026-10-06; BACKUP-DR-REVIEW:423.
- MENETAPKAN ATURAN: D-107(c), D-112(a); `docs/rebuild/05-PINTAR-AUTHORIZATION-MATRIX.md` baris 55 (rancangan).
- Kebijakan akses staf PINTAR / log akses-baca: **tidak ditemukan**.

**Yang tidak boleh dikatakan:** "Staf PINTAR tidak bisa melihat nilai siswa"; "semua akses dicatat"; "hanya sekolah Anda yang bisa membukanya"; jumlah orang yang memegang peran.

**Status:** SEBAGIAN; kedua: PERLU VERIFIKASI TEKNIS dan KEBIJAKAN BELUM DIPUTUSKAN (kebijakan akses staf dan alat berbantuan AI, D-112(a)) — ▲ BELUM DIPUTUSKAN HARI INI
**Tingkat sensitivitas:** KRITIS

---

### Q056 — Apakah sekolah lain bisa melihat data kami?

**Siapa yang kemungkinan bertanya:** Kepala sekolah, bagian IT
**Kemungkinan ditanya:** TINGGI

**Jawaban singkat:**
"Pada versi yang sudah dibangun dan diuji (belum di produksi), tidak untuk sekolah lain pada umumnya: data tiap sekolah dipisahkan oleh aturan akses di database dan ini diuji. Ada dua pengecualian yang harus kami sebut: siswa yang dipindahkan antar sekolah PINTAR, dan verifikasi sertifikat publik yang hanya menampilkan fakta terbatas. Tim PINTAR sendiri dapat melihat semua sekolah (lihat Q055)."

**Penjelasan:** Invarian INV-13: data satu tenant tidak terbaca tenant lain. Dibuktikan oleh tes: admin sekolah melihat nol baris milik sekolah lain (F01-T02); admin tidak melihat staf sekolah lain atau Admin platform (F10-V02); node sekolah lain ditolak tanpa membocorkan keberadaannya (F10-S04); konten buatan sekolah tak terlihat sekolah lain (F05-T09, QAC-T04, F02-T10, F02-T18); admin sekolah lain ditolak (F09-A02, F08-P05).
Pengecualian: (1) transfer siswa antar sekolah PINTAR memberi sekolah penerima visibilitas atas person dan enrolmen/keanggotaan; sertifikat, konten, audit, dan peran tetap di sekolah asal (tes F01-T10, F07-P10; aturan persetujuan masih terbuka, OD-9); (2) verifikasi sertifikat publik menampilkan lulus, predikat, institusi, tanggal; (3) Admin platform melihat semua.
Catatan: pembuktian ini pada kode `main`; belum di produksi untuk kebijakan versi terbaru.

**Mengapa PINTAR seperti ini:** Batas tenant adalah institusi dan ditegakkan di lapisan data, tidak hanya antarmuka.

**Bukti / mekanisme di PINTAR:** Aturan akses baris (RLS) pada tabel; tes di atas.

**Sumber:**
- MEMBUKTIKAN: tes F01-T02, F10-V02, F10-S04, F05-T09, QAC-T04, F02-T10, F02-T18, F09-A02, F08-P05, F01-T10, F07-P10; `docs/product/SCHOOL-DATA-EXPORT-4.0.md` §D.
- MENETAPKAN ATURAN: `docs/rebuild/03-PINTAR-INVARIANTS.md` INV-13; OD-9.

**Yang tidak boleh dikatakan:** "Mustahil sekolah lain melihat data Anda"; "terisolasi sepenuhnya, bahkan dari PINTAR".

**Status:** TERSEDIA DI 4.0 (main/staging; belum di produksi)
**Tingkat sensitivitas:** KRITIS

---

### Q057 — Apakah data siswa dipakai untuk iklan, dijual, atau dipakai melatih produk lain?

**Siapa yang kemungkinan bertanya:** Orang tua, petugas perlindungan data
**Kemungkinan ditanya:** TINGGI

**Jawaban singkat:**
"Kami belum punya pernyataan tertulis yang bisa dijadikan janji. Yang bisa kami sampaikan: kode PINTAR saat ini tidak memuat pelacak iklan atau analitik pihak ketiga dan tidak memanggil penyedia AI. Kebijakan resmi tentang pemakaian data untuk riset atau pelatihan produk masih harus diputuskan."

**Penjelasan:** Tidak ada SDK analitik atau iklan di dependensi; pencarian analytics, sentry, posthog, mixpanel, gtag di `src/`, `package.json`, `next.config.ts`, `vercel.json` tidak menemukan integrasi. `src/ai-gateway/` hanya berisi kontrak dan README tanpa panggilan jaringan; `src/integrations/README.md`: belum ada adaptor pihak ketiga. Huruf disimpan lokal dan kode QR dibuat sendiri agar pihak ketiga tidak tahu siapa membuka sertifikat. Pemroses pihak ketiga yang ada: Supabase (database, autentikasi, penyimpanan), Vercel (server), penyedia pengiriman email, GitHub Actions (CI/cadangan), dan rencana AWS S3 untuk cadangan (daftar ini disusun dari konfigurasi, bukan dokumen resmi). Statistik soal dan Question Health memakai bukti OFFICIAL di dalam sekolah dan bukan penjualan data. Tidak ada kebijakan privasi, ketentuan layanan, atau komitmen tertulis.

**Mengapa PINTAR seperti ini:** Prinsip D-110: data sekolah tetap milik sekolah; tetapi kebijakan pemakaian data oleh PINTAR belum dirumuskan.

**Bukti / mekanisme di PINTAR:** `package.json`; `src/ai-gateway/README.md`; `src/integrations/README.md`; `src/app/globals.css:42`; `src/lib/qr.ts:7`.

**Sumber:**
- MEMBUKTIKAN: kode di atas (ketiadaan integrasi).
- MENETAPKAN ATURAN: D-110(a)(e). Kebijakan penggunaan data: **tidak ditemukan**.

**Yang tidak boleh dikatakan:** "Kami berjanji tidak pernah memakai data untuk riset atau pelatihan model" (belum ada komitmen); "data tidak dijual" sebagai janji hukum.

**Status:** KEBIJAKAN BELUM DIPUTUSKAN; kedua: PERLU VERIFIKASI HUKUM — ▲ BELUM DIPUTUSKAN HARI INI
**Tingkat sensitivitas:** KRITIS

---

### Q058 — Data kami disimpan di mana? Di Indonesia?

**Siapa yang kemungkinan bertanya:** Petugas perlindungan data, pengawas
**Kemungkinan ditanya:** TINGGI

**Jawaban singkat:**
"Berdasarkan konfigurasi kami, data produksi disimpan di Singapura, bukan di Indonesia. Apakah itu memenuhi aturan yang berlaku bagi sekolah Anda perlu diperiksa secara hukum, dan kami tidak akan menyatakan sebaliknya sebelum itu."

**Penjelasan:** Database Supabase produksi `pintar-production` berada di region ap-southeast-1 (Singapura), paket Pro; staging juga Singapura. Fungsi server Vercel di `sin1`. Rencana salinan independen (AWS S3 dengan Object Lock) juga di Singapura (D-107 D1); alurnya sudah ada di `main` tetapi belum aktif (O3–O7 belum dimulai). Cadangan ada dalam dua lapis (SCHOOL-DATA-EXPORT-4.0.md §D): **hari ini** cadangan harian bawaan Supabase, disimpan **7 hari** (D-103); **setelah aktif** (dibangun, belum dinyalakan: O3–O7) salinan independen terenkripsi, disimpan **35 hari** (harian) dan **12 bulan** (bulanan) (D-107 D4). Berkas Storage tidak ikut cadangan database. Lokasi server email: tidak ditemukan. Tidak ada data di Indonesia yang ditemukan di konfigurasi mana pun. Analisis UU PDP/transfer lintas negara: tidak ditemukan.

**Mengapa PINTAR seperti ini:** Keputusan penyedia diambil per konfigurasi teknis; penilaian hukumnya belum dibuat.

**Bukti / mekanisme di PINTAR:** `vercel.json`; konfigurasi Supabase; `docs/coordination/RELEASES.md:34`; `docs/deployment/STAGING.md:5`.

**Sumber:**
- MEMBUKTIKAN: `docs/coordination/RELEASES.md:34`; `vercel.json`; `docs/recovery/BACKUP-DR-REVIEW-2026-10-05.md` (baris ~423, 439).
- MEMBUKTIKAN tambahan: `docs/product/SCHOOL-DATA-EXPORT-4.0.md` §D (dua lapis cadangan). MENETAPKAN ATURAN: D-103, D-107 D1/D4; `docs/recovery/OFFSITE-BACKUP-DESIGN.md:79-81`.

**Yang tidak boleh dikatakan:** "Data disimpan di Indonesia"; "sesuai UU PDP"; "cadangan di luar Supabase sudah berjalan".

**Status:** PERLU VERIFIKASI HUKUM (konfigurasi: Singapura, terbukti)
**Tingkat sensitivitas:** KRITIS

---

### Q059 — Foto siswa: apakah dikumpulkan, dan di mana tampil?

**Siapa yang kemungkinan bertanya:** Orang tua
**Kemungkinan ditanya:** SEDANG

**Jawaban singkat:**
"Saat ini siswa belum bisa mengunggah foto di PINTAR, jadi foto tidak dikumpulkan. Aturannya sudah ditetapkan: kalau ada, foto hanya tampil di profil siswa, tidak di Kartu PINTAR dan tidak di sertifikat."

**Penjelasan:** Ada kolom `persons.photo_path` dan jalur unggah/baca berkas bertanda tangan 60 detik. Tetapi tidak ada layar unggah atau tampil foto di kode (`JOURNEY-LOG.md:137`: "belum ada layar"). Kartu kelas tanpa foto (tes M7-K01). Masalah terbuka: fungsi penerbitan sertifikat (`certificate_prepare`) masih menyalin jalur foto ke snapshot sertifikat, bertentangan dengan aturan T4; karena belum ada foto, tidak ada sertifikat yang membawanya. Konflik: SCOPE-INVENTORY J8.8 menyatakan "4.0 menyediakan" foto profil, sedangkan kode belum punya layarnya.

**Mengapa PINTAR seperti ini:** Foto tidak boleh mengubah makna identitas kartu/sertifikat (D-085 T4, D-086 G1).

**Bukti / mekanisme di PINTAR:** `src/app/api/assets/upload-url/route.ts:30`; `read-url/route.ts:31-77`; tes BOB11-A02, F01-T17, M7-K01.

**Sumber:**
- MEMBUKTIKAN: kode dan tes di atas; `docs/recovery/JOURNEY-LOG.md:137`.
- MENETAPKAN ATURAN: SCOPE-INVENTORY J8.8, §10; D-085 T4; D-086 G1.

**Yang tidak boleh dikatakan:** "Siswa bisa mengunggah foto profil"; "foto tampil di sertifikat/kartu"; "foto tidak akan pernah dikumpulkan".

**Status:** SEBAGIAN (jalur data ada; fitur terjangkau pengguna belum ada)
**Tingkat sensitivitas:** TINGGI

---

### Q060 — Apakah siswa bisa berkirim pesan atau dihubungi orang asing lewat PINTAR?

**Siapa yang kemungkinan bertanya:** Orang tua
**Kemungkinan ditanya:** SEDANG

**Jawaban singkat:**
"Di kode PINTAR yang kami periksa tidak ada fitur pesan, obrolan, atau komentar, dan orang luar tidak bisa mendaftar. Siswa hanya masuk dengan Kartu PINTAR yang diterbitkan sekolah."

**Penjelasan:** Tidak ada fitur pesan/chat/komentar/forum di `src/` (pencarian chat, inbox, komentar, direct message). Umpan balik kelas (B1) hanya lima pertanyaan pilihan tertutup tanpa teks bebas; B1 tercatat "dibangun tanpa sumber lingkup" dan belum diputuskan masuk 4.0. Tanpa swa-registrasi: identitas dibuat sekolah (J1.1, D-054(a), tes L2-TIDAK-DIBUAT-01). «Laporkan masalah» hanya untuk staf. Halaman publik: verifikasi sertifikat, halaman ID PINTAR tanpa data, masuk, aktivasi, pemulihan, dan pemeliharaan. Kata penting: pemeriksaan teknis menyeluruh tetap perlu sebelum klaim mutlak.

**Mengapa PINTAR seperti ini:** Cakupan 4.0 tidak mencakup komunikasi antar pengguna; akun hanya diterbitkan sekolah.

**Bukti / mekanisme di PINTAR:** `supabase/migrations/20260930100000...sql:120` ("no free text anywhere"); tes UX1-UB-ALUR-01, L2-TIDAK-DIBUAT-01, BOB28-S01.

**Sumber:**
- MEMBUKTIKAN: tes di atas; pencarian kode (tidak ditemukan).
- MENETAPKAN ATURAN: SCOPE-INVENTORY J1.1, J2.19, §11 (B1); D-054(a).

**Yang tidak boleh dikatakan:** "Dijamin tidak ada kontak apa pun dengan orang asing". Boleh: tidak ada fitur pesan, obrolan, atau komentar dan tidak ada pendaftaran terbuka.

**Status:** PERLU VERIFIKASI TEKNIS (tidak ditemukan fitur; klaim mutlak belum diverifikasi penuh)
**Tingkat sensitivitas:** KRITIS

---

### Q061 — Data siswa dan hasil belajarnya itu milik siapa?

**Siapa yang kemungkinan bertanya:** Pengurus yayasan, kepala sekolah, petugas perlindungan data
**Kemungkinan ditanya:** TINGGI

**Jawaban singkat:**
"Prinsip kami: data milik sekolah tetap milik sekolah dan PINTAR tidak boleh menahannya. Tetapi itu bukan berarti sekolah memiliki setiap data tentang seseorang; pembagian hak atas berbagai jenis data belum kami putuskan, jadi kami tidak akan menyederhanakannya."

**Penjelasan:** Ini **bukan kontradiksi, tetapi perlu model hak atas data** (D-112(e)).
- D-110: data milik sekolah tetap milik sekolah; PINTAR tidak boleh memakai pembatasan teknis, format tertutup, gesekan kontrak, atau hambatan operasional untuk menghalangi sekolah mendapatkan data yang berhak atau keluar. D-110(b): ini prinsip, bukan fitur; ekspor mandiri tetap kandidat 4.5. D-110(e): jangan menjanjikan kepemilikan atas data yang secara hukum/operasional milik pihak lain.
- Dokumen 02 (baris 56-59) dan 06 (baris 150-156): identitas seseorang adalah "paspor belajar seumur hidup" yang tidak pernah dimiliki institusi, dan catatan portabel tetap milik siswa. Catatan terikat institusi (misalnya sinyal integritas) tidak ikut siswa. Sertifikat memuat salinan identitas permanen.
- D-112(e): D-110 adalah prinsip, bukan klaim bahwa sekolah memiliki setiap data tentang seseorang; catatan belajar portabel seorang siswa dapat membawa hak dan kepentingan yang berbeda dari catatan institusional sekolah. Desain portabilitas dan keluar untuk 4.5 akan **mengklasifikasikan data** daripada memilih satu pemilik universal: data institusional sekolah, data portabel siswa, data kontekstual bersama, bukti operasional dan keamanan PINTAR, dan catatan yang wajib disimpan menurut hukum. D-110 tidak ditulis ulang begitu saja.
- Tidak ada ketentuan layanan atau kontrak di repositori yang menyatakan kepemilikan; isi MOU tidak ada.
- Hak subjek data: koreksi nama ada (`correct_person_name`, F18-N03; `confirm_my_name`, F18-N02) dan siswa membaca hasilnya sendiri; yang tidak ada hanya penghapusan (orang tidak dapat dihapus, retensi belum berjalan).
**Ini masuk daftar gap (G2.2). Tidak diselesaikan di dokumen ini.**

**Mengapa PINTAR seperti ini:** Prinsip NO HOSTAGE DATA ada; model hak atas data belum.

**Bukti / mekanisme di PINTAR:** Tidak ada mekanisme kepemilikan; hanya cetak (SCHOOL-DATA-EXPORT-4.0.md).

**Sumber:**
- MEMBUKTIKAN: `docs/product/SCHOOL-DATA-EXPORT-4.0.md` (seluruhnya).
- MENETAPKAN ATURAN/RANCANGAN: D-110(a)(b)(e)(f); D-112(e); `docs/rebuild/02-PINTAR-CANONICAL-DOMAIN-MODEL.md` baris 56-59; `docs/rebuild/06` baris 150-156.

**Yang tidak boleh dikatakan:** "Semua data milik sekolah"; "semua data milik siswa"; "Anda bisa mengambilnya kapan saja"; jangan mengutip D-110 sebagai fitur.

**Status:** KEBIJAKAN BELUM DIPUTUSKAN; kedua: PERLU VERIFIKASI HUKUM — ▲ BELUM DIPUTUSKAN HARI INI
**Tingkat sensitivitas:** KRITIS

---

### Q062 — Soal dan materi yang dibuat guru kami di PINTAR itu milik siapa? Bisakah dipakai sekolah lain tanpa izin kami?

**Siapa yang kemungkinan bertanya:** Wakil kepala sekolah kurikulum
**Kemungkinan ditanya:** SEDANG

**Jawaban singkat:**
"Secara teknis, konten buatan sekolah Anda tidak terlihat oleh sekolah lain. Tetapi soal siapa pemilik hak atas konten itu dan apakah ada lisensi bagi PINTAR, kami belum punya ketentuan tertulis, jadi kami tidak akan mengatakan 'sepenuhnya milik Anda'."

**Penjelasan:** Isolasi terbukti oleh tes: konten sekolah tak terlihat sekolah lain atau tenant kanonik (F05-T09, QAC-T04); konten dan rilis tidak dapat dibawa antar institusi (F02-T10); isi pelajaran tidak publik (F02-T18, D-032). D-029: impor hanya ke dalam sekolah. M6 (D-085) kemudian menetapkan materi standar PINTAR disiapkan dan didistribusikan pusat, sedangkan materi sekolah ditambahkan lokal tanpa mengubah rilis pusat (J1.5, J4.11); ketegangan M6 versus D-029 masih terbuka dan penulisan ke pustaka PINTAR tertahan (JOURNEY-LOG:139). Berbagi konten antar institusi adalah LATER (doc 09, OD-4). Hak cipta, lisensi, atau ketentuan kepemilikan konten guru: **tidak ditemukan**. Admin platform dapat membaca konten dan kunci jawaban semua sekolah.

**Mengapa PINTAR seperti ini:** Dua asal konten dipisah dan asalnya selalu jelas (J4.11).

**Bukti / mekanisme di PINTAR:** Tes isolasi di atas; tes M6-S01.

**Sumber:**
- MEMBUKTIKAN: tes F05-T09, QAC-T04, F02-T10, F02-T18, M6-S01; `docs/recovery/JOURNEY-LOG.md:139`.
- MENETAPKAN ATURAN: D-029, D-032, D-085 (M6); SCOPE-INVENTORY J1.5, J4.11; `docs/rebuild/09` (LATER); `docs/rebuild/11` OD-4.

**Yang tidak boleh dikatakan:** "Konten Anda 100% milik Anda"; "PINTAR tidak punya hak apa pun atas konten"; "sekolah lain tidak akan pernah bisa memakainya" tanpa menyebut belum ada kebijakan lisensi.

**Status:** KEBIJAKAN BELUM DIPUTUSKAN; kedua: PERLU VERIFIKASI TEKNIS — ▲ BELUM DIPUTUSKAN HARI INI
**Tingkat sensitivitas:** TINGGI

---

### Q063 — Bisakah kami mengunduh seluruh data sekolah dan membukanya di Excel?

**Siapa yang kemungkinan bertanya:** Pengurus yayasan, administrator sekolah, bagian IT
**Kemungkinan ditanya:** TINGGI

**Jawaban singkat:**
"Belum. Di PINTAR 4.0 sekolah tidak bisa mengunduh data dalam bentuk berkas yang bisa dibuka di Excel. Yang bisa dicetak atau disimpan sebagai PDF lewat peramban adalah laporan ringkasan dan sertifikat. Unduh data sekolah sedang dipertimbangkan sebagai kandidat untuk 4.5 dan belum dijanjikan."

**Penjelasan:**
- "Sekolah tidak dapat mengekspor datanya dalam bentuk terstruktur hari ini." Tidak ada CSV, XLSX, JSON, atau PDF data sekolah yang dihasilkan PINTAR; tidak ada route yang mengatur unduhan. Satu-satunya unduhan adalah templat buku kerja .xlsx kosong.
- Yang bisa dicetak lewat peramban: ringkasan kelas dan sekolah (hanya agregat), sertifikat milik siswa sendiri, dan lembar kartu kelas yang baru diterbitkan di sesi itu. Satu berkas Storage per tautan bertanda tangan.
- Tidak bisa diekspor: jawaban mentah, hasil dan bukti/penguasaan, log audit, konten buatan sekolah, daftar pengguna/peran/pendaftaran, sinyal integritas, laporan tersimpan, umpan balik, laporan dukungan.
- Tim PINTAR juga tidak punya alat mengambil data satu sekolah: hanya cadangan seluruh database. Melakukannya akan menjadi rekayasa baru atas data produksi dan memerlukan persetujuan pemilik.
- D-110(b): prinsip, bukan fitur; kandidat 4.5 sampai dirancang dan disetujui terpisah.

**Mengapa PINTAR seperti ini:** Prinsip NO HOSTAGE DATA; tetapi prinsip tidak membuktikan fitur (D-110(f)).

**Bukti / mekanisme di PINTAR:** Cetak laporan (`src/components/laporan/AksiLaporan.tsx:30`); cetak sertifikat (`src/components/sertifikat/AksiCetak.tsx`); templat unggah (`src/components/unggah/PanelUnggah.tsx:95-107`).

**Sumber:**
- MEMBUKTIKAN: `docs/product/SCHOOL-DATA-EXPORT-4.0.md` ringkasan, §A, §B, §C (baris 5-16, 22-60, 89).
- MENETAPKAN ATURAN/RANCANGAN: D-110(b)(d); `docs/rebuild/06` baris 150-156; `docs/rebuild/04` baris 112-114.

**Yang tidak boleh dikatakan:** "Anda bisa mengekspor ke Excel"; "ekspor akan ada di 4.5" (hanya "kandidat"); "cetak sebagai PDF" sebagai ekspor data.

**Status:** TIDAK DI 4.0; kedua: ROADMAP 4.5 (kandidat, D-110(b))
**Tingkat sensitivitas:** KRITIS

---

### Q064 — Apakah kami perlu izin PINTAR untuk mendapatkan data kami sendiri? Ada biayanya? Apakah formatnya hanya bisa dibaca PINTAR?

**Siapa yang kemungkinan bertanya:** Pengurus yayasan, bendahara
**Kemungkinan ditanya:** SEDANG

**Jawaban singkat:**
"Hari ini belum ada jalur untuk mengambil data sekolah, baik mandiri maupun lewat PINTAR, jadi pertanyaan izin, biaya, dan format belum punya jawaban yang bisa kami janjikan. Prinsipnya sudah ditetapkan: PINTAR tidak boleh mempersulit sekolah mendapatkan data atau pergi, tetapi prosedurnya belum dibangun."

**Penjelasan:** Tidak ada alat ekstraksi satu sekolah, bahkan bagi tim PINTAR (SCHOOL-DATA-EXPORT-4.0.md §B). D-110(a): dilarang memakai pembatasan teknis, format proprietari, friksi kontrak, atau hambatan operasional. D-110(c): implementasi eventual harus menentukan klasifikasi data, format, otorisasi, auditabilitas, retensi, dan lainnya. Biaya, tarif, izin, atau SLA untuk pengambilan data: **tidak ditemukan**. Format ekspor belum ditetapkan sehingga klaim "bukan format tertutup" belum bisa dibuktikan. Yang tersedia: cetak (Q063); sertifikat tetap dapat diverifikasi lewat tautan. Saluran sekarang: «Laporkan masalah» (D-037), tanpa saluran khusus "permintaan data".

**Mengapa PINTAR seperti ini:** NO HOSTAGE DATA (D-110).

**Bukti / mekanisme di PINTAR:** Tidak ada jalur selain cetak.

**Sumber:**
- MEMBUKTIKAN: `docs/product/SCHOOL-DATA-EXPORT-4.0.md` §B.
- MENETAPKAN ATURAN: D-110(a)(c)(e); D-037.

**Yang tidak boleh dikatakan:** "Gratis"; "tanpa izin"; "format terbuka (CSV/Excel)"; "selesai dalam X hari".

**Status:** KEBIJAKAN BELUM DIPUTUSKAN (prinsip ada; prosedur, biaya, dan format belum) — ▲ BELUM DIPUTUSKAN HARI INI
**Tingkat sensitivitas:** KRITIS

---

### Q065 — Bagaimana PINTAR melindungi dari peretasan? Pernah diaudit pihak luar? Punya sertifikasi keamanan (misalnya ISO 27001)?

**Siapa yang kemungkinan bertanya:** Bagian IT, compliance
**Kemungkinan ditanya:** TINGGI

**Jawaban singkat:**
"PINTAR punya kontrol keamanan yang kami uji secara internal, tetapi kami belum punya audit keamanan atau uji penetrasi oleh pihak luar, dan belum punya sertifikasi seperti ISO 27001. Kami tidak akan mengklaim sebaliknya. Detail teknis: tim teknis."

**Penjelasan:** Kontrol yang dibuktikan kode dan tes, secara umum: aturan akses per sekolah di database; rahasia server hanya di sisi server (F01-S03); data fixture sintetis tertutup di host produksi (F06-N05); penyimpanan privat dengan unggah lewat tautan bertanda tangan; pembatasan percobaan masuk kartu (BOB-12); jawaban seragam untuk identitas yang tidak ada (BOB27-A01, BOB28-A01); penguncian bertahap pada pemulihan dengan PIN (F16-R01); penjaga penulisan kata sandi (F18-P01). Header keamanan HTTP: tidak ditemukan di konfigurasi yang diperiksa; dicatat di G3. "Second Eye" dan "Layer-3" adalah peninjauan internal. Uji penetrasi, audit pihak ketiga, ISO 27001, SOC 2, bug bounty: **tidak ditemukan**. Cadangan dan pemulihan belum lulus (Q070–Q072). Temuan teknis lain dicatat di G3 tanpa detail.

**Mengapa PINTAR seperti ini:** Batas keamanan ditegakkan di lapisan data (INV-37), bukan sekadar disembunyikan di layar. Detail keamanan sensitif tidak dibuka (D-110(e)).

**Bukti / mekanisme di PINTAR:** Tes F01-S03, F06-N05, BOB27-A01, BOB28-A01, F16-R01, F18-P01.

**Sumber:**
- MEMBUKTIKAN: tes di atas (manifest).
- MENETAPKAN ATURAN: D-033, D-110(e); INV-14, INV-15, INV-37 (`docs/rebuild/03`). Audit pihak luar/sertifikasi: **tidak ditemukan**.

**Yang tidak boleh dikatakan:** "Sudah diaudit/uji penetrasi pihak luar"; "bersertifikat ISO 27001"; "aman dari peretasan"; "enkripsi menyeluruh" (enkripsi diam/transit adalah fitur platform penyedia dan tidak dibuktikan di repositori).

**Status:** PERLU VERIFIKASI TEKNIS (kontrol internal ada dan teruji; verifikasi pihak luar tidak ada)
**Tingkat sensitivitas:** KRITIS

---

### Q066 — Bagaimana PIN siswa dan kata sandi guru disimpan? Apakah staf PINTAR bisa membacanya?

**Siapa yang kemungkinan bertanya:** Bagian IT
**Kemungkinan ditanya:** SEDANG

**Jawaban singkat:**
"Pada versi yang sudah dibangun dan diuji (belum di produksi), PIN siswa tidak disimpan oleh PINTAR; PIN hanya tampil satu kali, pada lembar kartu saat kartu diterbitkan. Untuk staf, PIN dan kata sandi dilindungi dan tidak ditampilkan kepada admin. Detail teknis penyimpanan: tim teknis."

**Penjelasan:** Siswa: PIN tidak disimpan; karena itu lembar kartu hanya bisa dicetak sekali pada sesi penerbitan, dan kartu yang sudah terbit tidak bisa dicetak ulang (hanya diterbitkan ulang) (M7-K01; `SCHOOL-DATA-EXPORT-4.0.md` §A). Lembar kartu itu menampilkan PIN satu kali. Staf: PIN pribadi dan kata sandi hanya ada di versi `main`/staging (belum di produksi); PIN diverifikasi di server dan tidak pernah ditampilkan ke admin (D-056(a); F16-P01); kata sandi minimal 8 karakter dengan perlindungan kata sandi bocor (D-082(a)); penulisan dijaga (F18-P01). Konflik sumber: D-033(c) ("tidak ada kata sandi pilihan manusia") digantikan D-082 dan J2.5. Analisis ketahanan dan algoritma tidak dimuat di dokumen ini; tim teknis menilainya dan temuan dicatat di G3.

**Mengapa PINTAR seperti ini:** Siswa tidak perlu mengingat kata sandi; PIN yang tidak disimpan tidak dapat dibocorkan dari database.

**Bukti / mekanisme di PINTAR:** Lembar kartu kelas (`src/components/aktivasi/LembarKartu.tsx`).

**Sumber:**
- MEMBUKTIKAN: tes M7-K01, F16-P01, F18-P01; `docs/product/SCHOOL-DATA-EXPORT-4.0.md` §A.
- MENETAPKAN ATURAN: D-056(a), D-082(a), D-110(e); D-033(c) (digantikan).

**Yang tidak boleh dikatakan:** "Tidak ada layar yang menampilkan PIN" (lembar kartu menampilkannya sekali); "tidak ada yang bisa mengakses akun siswa"; "siswa punya kata sandi" (siswa hanya kartu + PIN); detail teknis penyimpanan.

**Status:** TERSEDIA DI 4.0 (main/staging; belum di produksi); kedua: PERLU VERIFIKASI TEKNIS (detail teknis)
**Tingkat sensitivitas:** KRITIS

---

### Q067 — Kalau terjadi kebocoran data, apakah sekolah diberi tahu, oleh siapa, dan kapan?

**Siapa yang kemungkinan bertanya:** Petugas perlindungan data, bagian IT
**Kemungkinan ditanya:** SEDANG

**Jawaban singkat:**
"Kami belum punya prosedur tertulis untuk memberi tahu sekolah saat terjadi kebocoran data, jadi kami tidak bisa menjanjikan siapa, kapan, atau lewat apa. Ini sedang kami catat sebagai hal yang harus diputuskan, termasuk kewajiban hukumnya."

**Penjelasan:** Prosedur insiden/kebocoran, tenggat pemberitahuan, kontak, atau templat: **tidak ditemukan**. Satu-satunya pemberitahuan keamanan otomatis: ke pemilik akun dan ke alamat email admin platform untuk kunci PIN, penangguhan, pemulihan PIN, dan reset (D-057(b)); itu bukan pemberitahuan kebocoran, dan "tidak ada pemberitahuan ke admin sekolah di 4.0". Dukungan: «Laporkan masalah»; D-037 punya target internal (laporan yang menghentikan kelas dijawab pada hari sekolah yang sama), tetapi tidak ada SLA kontraktual. D-107(c) mengakui bahwa kompromi kredensial cadangan dapat mengekspos seluruh database; tidak ada rencana komunikasi ke sekolah. Kewajiban menurut UU PDP: tidak ada analisis hukum di repositori.

**Mengapa PINTAR seperti ini:** Prosedur belum dibuat; tidak boleh dikarang.

**Bukti / mekanisme di PINTAR:** Hanya `src/app/api/_email/keamanan.ts` untuk pemberitahuan akun.

**Sumber:** MENETAPKAN ATURAN: D-057(b); D-037; D-107(c). Prosedur insiden: **tidak ditemukan**.

**Yang tidak boleh dikatakan:** "Kami memberi tahu dalam 72 jam"; "ada tim insiden 24/7"; "Anda akan diberi tahu otomatis".

**Status:** KEBIJAKAN BELUM DIPUTUSKAN; kedua: PERLU VERIFIKASI HUKUM — ▲ BELUM DIPUTUSKAN HARI INI
**Tingkat sensitivitas:** KRITIS

---

### Q068 — Kalau akun kepala sekolah dibajak, apa yang terjadi dan siapa yang diberi tahu?

**Siapa yang kemungkinan bertanya:** Kepala sekolah, bagian IT
**Kemungkinan ditanya:** TINGGI

**Jawaban singkat:**
"Pemilik akun dapat memulihkan akunnya lewat email atau lewat PINTAR ID dan PIN; pemulihan mengakhiri sesi di perangkat lain dan pemilik diberi tahu lewat email. Tetapi PINTAR belum mendeteksi login mencurigakan dan belum memberi tahu sekolah atau siapa pun saat akun dipakai orang lain."

**Penjelasan:** (Padanan peran di PINTAR: Admin sekolah.)
- Pemulihan email: reset mengakhiri sesi lain dan mengirim email perubahan kata sandi ke pemilik (D-055(f); tes BOB27-A01).
- Pemulihan ID+PIN: tangga kunci (3 salah → 1 jam; lalu 4 jam; lalu ditangguhkan); pemulihan hanya lewat email + PIN baru atau reset Admin platform yang tercatat (D-056; F16-R01).
- Pemberitahuan keamanan (kunci, penangguhan, pemulihan, reset): ke pemilik akun dan admin platform, tidak ke Admin sekolah lain di 4.0 (D-057(b)).
- D-101: Admin sekolah lain di sekolah yang sama dapat mencabut dan menerbitkan ulang kredensial; bila tidak ada atau kasus keamanan, eskalasi ke Admin platform; penggantian mengakhiri sesi terkait dan diaudit; sekolah disarankan memiliki dua admin.
- «Keluar dari semua perangkat» tersedia.
- Tidak ada: peringatan login dari perangkat atau lokasi baru, pembatasan IP, pemberitahuan ke sekolah/siswa saat data diakses. Penyerang yang berhasil masuk tidak memicu notifikasi; hanya perubahan kata sandi atau ambang kunci yang memicu. Kotak masuk admin platform adalah satu alamat email (satu titik).
- Fitur ini ada di `main`/staging (migrasi ≥112), bukan terbukti di produksi.

**Mengapa PINTAR seperti ini:** Tidak ada yang memulihkan kredensial istimewanya sendiri (D-101).

**Bukti / mekanisme di PINTAR:** Alur pemulihan dan pemberitahuan keamanan.

**Sumber:**
- MEMBUKTIKAN: tes BOB27-A01, F16-R01, BOB28-D01, BOB28-A01, BOB29-A03.
- MENETAPKAN ATURAN: D-055(f)(g), D-056, D-057(b), D-101; SCOPE-INVENTORY J2.11–J2.13.

**Yang tidak boleh dikatakan:** "Sekolah langsung diberi tahu"; "kami mendeteksi login mencurigakan"; "akun yang dibajak otomatis dikunci"; "siswa diberi tahu bila datanya diakses".

**Status:** SEBAGIAN (pemulihan dan pemberitahuan pemilik/admin platform ada; deteksi pembajakan dan pemberitahuan ke sekolah tidak ada)
**Tingkat sensitivitas:** KRITIS

---

### Q069 — Guru lupa keluar (logout) di komputer bersama. Apa yang melindungi?

**Siapa yang kemungkinan bertanya:** Bagian IT
**Kemungkinan ditanya:** SEDANG

**Jawaban singkat:**
"Pada versi yang sudah dibangun dan diuji (belum di produksi), di komputer yang dinyatakan bersama, layar terkunci setelah 5 menit tanpa aktivitas dan hanya terbuka dengan PIN guru; sesi berakhir setelah 60 menit terkunci, atau setelah tiga PIN salah. Ini hanya berlaku bila komputer dinyatakan bersama, dan pelindungannya dipastikan oleh server, bukan hanya oleh layar."

**Penjelasan:** D-055(b): di perangkat bersama, 5 menit diam → kunci PIN yang ditegakkan server; PIN benar melanjutkan; 3 PIN salah mengakhiri sesi itu; 60 menit terkunci mengakhiri sesi itu; sesi di perangkat lain tidak terganggu. Tes: BOB29-D01 (sesi bersama diam 5 menit ditolak, tiga PIN salah menghapus sesi), BOB29-A01 (halaman mengajar dialihkan ke `/terkunci`, token yang diperbarui pun ditolak, PIN benar memulihkan), BOB29-A03, BOB29-K01. Siswa: kunci setelah 5 menit, hanya PIN kartu yang membuka, layar kunci tanpa nama siswa, «Bukan akun Anda?» mengakhiri sesi (BOB29-A02). Pertanyaan «Komputer siapa ini?» diajukan di peramban yang tidak dikenal; itu pernyataan pengguna, bukan bukti kepemilikan. Bila guru memilih perangkat pribadi, sesi sekitar 7 hari dan kunci tidak berlaku. «Keluar» ada di setiap layar dan hanya mengakhiri perangkat ini; «Keluar dari semua perangkat» terpisah. Kelemahan: kunci tidak berlaku bila guru menyatakan komputer pribadi; fitur ada di `main`/staging dan belum di produksi (migrasi 154).

**Mengapa PINTAR seperti ini:** Perangkat kelas dipakai bergantian; orang berikutnya tidak boleh melanjutkan sebagai orang sebelumnya (D-009, D-055).

**Bukti / mekanisme di PINTAR:** Migrasi `20261117100000`; `src/app/terkunci`; JOURNEY-LOG item 26 (4 Okt).

**Sumber:**
- MEMBUKTIKAN: tes BOB29-D01, BOB29-A01, BOB29-A02, BOB29-A03, BOB29-K01, BOB05-K01; JOURNEY-LOG item 26.
- MENETAPKAN ATURAN: D-009, D-055; SCOPE-INVENTORY J2.9, J2.10, J2.20.

**Yang tidak boleh dikatakan:** "Komputer otomatis keluar dalam 5 menit" (terkunci 5 menit, keluar 60 menit, pada komputer yang dinyatakan bersama); "terlindungi sepenuhnya bila memilih pribadi"; "sudah aktif di produksi".

**Status:** TERSEDIA DI 4.0 (main/staging; belum di produksi)
**Tingkat sensitivitas:** TINGGI

---


## Kelompok 4 — Backup, pemulihan, kesalahan manusia, perpindahan, hak akses, orang tua, retensi, keluar, dukungan (Q070–Q087)

> **Catatan lintas-pertanyaan untuk pembaca kelompok ini.**
> 1. **Produksi belum di-upgrade.** `RESUME-2026-10-06.md`: produksi tetap di build `5b5b68d` dengan 111 migrasi; migrasi 112 dan seterusnya hanya ada di `main` dan staging. Terdampak antara lain: «Pindah kelas» (`20261027100000`), struktur sekolah dengan alasan wajib, koreksi nama (`20261112100000`), «Laporkan masalah» (`20261119100000`). Produksi saat ini memuat 2 sekolah, 1 orang, dan tanpa sitting asesmen (BACKUP-DR-REVIEW Part II §1; D-103). "TERSEDIA" di bawah berarti "ada di `main`/staging dan terbukti oleh tes"; pernyataan tentang produksi menunggu PRODUCTION READY, yang digerbang #150 (D-104(d)).
> 2. Pekerjaan backup dan disaster recovery (#150) **belum lulus** (NOT PASS, diterima oleh D-104(a)). Dokumen #150 masih berubah; status di bawah adalah per commit yang dibaca.

### Q070 — Kalau server rusak total, apakah data kami masih ada, termasuk salinan di luar penyedia utama?

**Siapa yang kemungkinan bertanya:** Bagian IT, pengurus yayasan
**Kemungkinan ditanya:** TINGGI

**Jawaban singkat:**
"Hari ini data produksi dicadangkan setiap hari oleh penyedia database kami, dan pemulihan bawaan pernah diuji satu kali pada salinan lingkungan uji. Pemulihan produksi belum pernah dilakukan. Salinan independen di luar penyedia itu sudah kami bangun tetapi belum dinyalakan, dan berkas seperti foto dan media pelajaran tidak ikut dalam cadangan harian. Kami tidak akan mengatakan data tidak mungkin hilang."

**Penjelasan:**
- Supabase Pro membuat cadangan fisik harian, disimpan 7 hari; pemilik melihat 7 cadangan di dasbor produksi, terbaru 5 Okt 2026 19:24 UTC. Daftar itu tidak punya kolom status, sehingga "selesai" tidak dapat dinyatakan dari tangkapan layar.
- Supabase menghapus cadangan bersama project-nya. Storage (foto, media pelajaran, tangkapan layar laporan) tidak termasuk cadangan mana pun.
- **Salinan di luar Supabase: belum ada yang berjalan.** Yang sudah ada: kode (`scripts/recovery/*`, alur `backup-offsite.yml`, migrasi 162 untuk akun cadangan khusus) di `main`, terbukti oleh tes DR-S08..S16 dan DR-D02. Semua jadwalnya mati sampai pemilik menyalakan variabel `PINTAR_OFFSITE_BACKUP`. Belum dilakukan: akun AWS, kunci, penunjukan kustodian, dan langkah pemilik O3–O7.
- Cadangan produksi dan penyimpanan rahasia ditolak oleh kode sampai dua kustodian terpisah masing-masing membuktikan memegang kuncinya (D-109(c)). Di `custody.json`, bukti kepemilikan R1 belum tercatat dan R2 belum ditunjuk.
- Rancangan: AWS S3 Singapura dengan Object Lock, enkripsi untuk dua penerima, harian 35 hari dan bulanan 12 bulan (D-107 D1, D2, D4).
- Kode aplikasi ada di Git dan skema ada sebagai migrasi.
- **Tidak ada:** salinan off-platform aktif; salinan Storage; escrow terverifikasi untuk rahasia kriptografis PINTAR (detail teknis: tim teknis). Ada penjaga yang mencegah pembuatan ulang diam-diam (DR-S01..S03), tetapi escrow belum dibuat.
- D-111 (6 Okt): GREEN untuk melanjutkan persiapan infrastruktur milik pemilik, tanpa escrow sementara dengan satu kustodian; **itu bukan #150 lulus dan bukan siap produksi**.

**Mengapa PINTAR seperti ini:** Pemulihan harus dilakukan dan dibuktikan sebelum sekolah nyata bergantung pada produksi (D-104, D-106); salinan independen dianggap wajib sebelum PRODUCTION READY (D-106(b)).

**Bukti / mekanisme di PINTAR:** `scripts/recovery/*`; `.github/workflows/backup-offsite.yml` (baris 24, 55: dimatikan sampai variabel dinyalakan); tes DR-S09, DR-S10, DR-S11; JOURNEY-LOG butir 41–43.

**Sumber:**
- MEMBUKTIKAN: `docs/recovery/BACKUP-DR-REVIEW-2026-10-05.md` Part I (G1 Part 1) dan Part II §2; JOURNEY-LOG butir 41–43; tes DR-S08..S16, DR-D02; `docs/recovery/custody.json`, `durable-secrets.json` (hanya struktur).
- MENETAPKAN ATURAN: D-103, D-104, D-106(b), D-107 D1/D2/D4, D-109(b)(c), D-111; RESUME-2026-10-06; `docs/recovery/EVIDENCE-INDEX-150.md`; `docs/recovery/CLOSURE-PLAN-150.md`; `docs/recovery/OWNER-INSTRUCTIONS-150.md`.

**Yang tidak boleh dikatakan:** "Data kami dicadangkan di dua tempat / di luar Supabase"; "foto dan media ikut dicadangkan"; "cadangan terenkripsi sudah berjalan"; "lulus uji backup"; "#150 sudah lulus" atau "GREEN" (D-111 hanya izin melanjutkan persiapan infrastruktur); "bisa dipulihkan" tanpa menyebut bahwa pemulihan produksi belum pernah dilakukan; lokasi selain Singapura.

**Status:** SEBAGIAN; kedua: DIBANGUN, BELUM AKTIF (salinan independen)
**Tingkat sensitivitas:** KRITIS

---

### Q071 — Berapa banyak data yang bisa hilang kalau terjadi masalah besar?

**Siapa yang kemungkinan bertanya:** Bagian IT, kepala sekolah
**Kemungkinan ditanya:** TINGGI

**Jawaban singkat:**
"Pada pemulihan dari cadangan harian, sampai sekitar 24 jam data bisa hilang. Pemulihan ke titik waktu tertentu tidak kami aktifkan saat ini. Itu keputusan sementara yang akan ditinjau kembali sebelum siswa sekolah nyata mengerjakan ujian di produksi."

**Penjelasan:**
- Titik pemulihan produksi adalah cadangan fisik harian: satu pemulihan dapat kehilangan hingga 24 jam penulisan (D-103(a)). Pemulihan ke titik waktu (PITR) tidak aktif dan tidak dibeli (butuh compute di atas tingkat sekarang plus add-on, sekitar USD 100 per bulan); ini keputusan sengaja yang **sementara**, ditinjau ulang paling lambat saat murid sekolah nyata mulai ujian di produksi (D-103(b)(c)).
- Skenario lebih buruk (analisis, bukan jaminan): bila project atau akun Supabase hilang, semuanya hilang karena cadangan ikut terhapus dan belum ada salinan luar; Storage hilang total bila Storage hilang.
- Sebelum migrasi produksi, penjaga G6 mewajibkan cadangan COMPLETED yang tidak lebih tua dari 26 jam; selama pembacaan otomatis itu belum tersedia, setiap penerapan produksi ditolak (DR-S04, DR-S05).
- Jika satu cadangan gagal, kehilangan bisa lebih dari 24 jam; pemantauan produksi (watch) default mati sehingga kegagalan tidak terlihat secara otomatis (DR-S06).

**Mengapa PINTAR seperti ini:** Satu hari kehilangan dianggap tertoleransi selama produksi hanya berisi dua sekolah, satu orang, dan tanpa ujian (D-103); itu berubah saat kelas nyata mulai ujian.

**Bukti / mekanisme di PINTAR:** `scripts/release/restore-point.mjs` (penjaga G6); `production-watch.yml:44`.

**Sumber:**
- MEMBUKTIKAN: tes DR-S04, DR-S05, DR-S06; BACKUP-DR-REVIEW Part I (G1 Part 1), Part II §4.
- MENETAPKAN ATURAN: D-103(a)–(d), D-106(h).

**Yang tidak boleh dikatakan:** "Maksimal kehilangan 24 jam dijamin"; "tidak ada kehilangan / real-time"; "ada point-in-time recovery"; "jawaban siswa yang sedang ujian aman bila server rusak".

**Status:** SEBAGIAN (RPO 24 jam adalah keputusan sementara, bukan jaminan)
**Tingkat sensitivitas:** KRITIS

---

### Q072 — Apakah backup PINTAR pernah benar-benar diuji untuk dipulihkan? Berapa lama pulihnya?

**Siapa yang kemungkinan bertanya:** Bagian IT, compliance
**Kemungkinan ditanya:** TINGGI

**Jawaban singkat:**
"Ya, satu kali, pada salinan lingkungan uji kami (bukan produksi): pemulihan bawaan penyedia selesai dan terverifikasi dalam sekitar 8 menit. Tetapi itu skala data kecil dan hanya database. Pekerjaan backup dan pemulihan kami secara keseluruhan belum lulus, jadi kami tidak mengatakan 'teruji penuh'."

**Penjelasan:**
- 6 Okt 2026, di staging (bukan produksi): "Restore to a New Project" dari cadangan 5 Okt 23:34 UTC. Dari mulai sampai terverifikasi: 8 menit 03 detik. 157 tabel identik byte per byte; 24 dari 24 pemeriksaan kesiapan lulus; tanpa perbaikan; project sementara dihapus pemilik.
- Catatan Second Eye: terbukti "pada skala staging saat ini", tidak menetapkan waktu pulih skala produksi; konfigurasi Auth/platform dan objek Storage perlu prosedur terpisah.
- Yang tidak direproduksi atau tidak diverifikasi: kunci API dan pengaturan Auth tidak ikut (perlindungan kata sandi bocor mati di salinan); berkas Storage tidak diverifikasi; versi Postgres berbeda (17.11 vs 17.6).
- Pemulihan logis 5 Okt gagal sesuai prosedur penyedia; setelah dipaksa, 150 dari 157 tabel identik, tiga pemicu `auth.users` hilang, hak akses terbuka lebar. Sebagian dikoreksi di kode (DR-S08, DR-D01, DR-D02). DR-D02: bundel dari `backup.mjs` dipulihkan ke stack Supabase kosong di CI dengan 0 perbedaan, tetapi itu pengganti lokal, bukan restore hosted.
- **#150 = NOT PASS** (D-104(a)); gerbang keras PRODUCTION READY (D-104(d)). D-111 (6 Okt) menyatakan GREEN untuk melanjutkan persiapan infrastruktur; itu bukan lulus. D-106 menambah syarat B3–B9 yang belum selesai. Runbook pemulihan penuh (`RUNBOOK-NATIVE-RESTORE.md`) **belum ada**; DR-S12/S13 tidak ada di manifest. "ENGINEERING COMPLETE" tidak melunakkan ini.
- Tidak ada: restore produksi; pengukuran waktu pulih skala produksi; bukti pemulihan Storage nyata.

**Mengapa PINTAR seperti ini:** Pemulihan harus dilakukan, bukan dijelaskan, sebelum sekolah nyata bergantung pada produksi (D-104).

**Bukti / mekanisme di PINTAR:** Catatan G2 di BACKUP-DR-REVIEW; JOURNEY-LOG butir 38.

**Sumber:**
- MEMBUKTIKAN: `docs/recovery/JOURNEY-LOG.md` butir 38, 41; `docs/recovery/BACKUP-DR-REVIEW-2026-10-05.md` Part I (G2: result) dan Verdict; tes DR-S08, DR-D01, DR-D02.
- MENETAPKAN ATURAN: D-103, D-104, D-105, D-106, D-107, D-111; `docs/recovery/EVIDENCE-INDEX-150.md`.

**Yang tidak boleh dikatakan:** "Backup kami sudah teruji penuh"; "pulih dalam 8 menit" (itu staging, dataset kecil, hanya database); "#150 lulus", "GREEN" (D-111 bukan lulus), atau "siap produksi".

**Status:** SEBAGIAN (belum lulus, #150)
**Tingkat sensitivitas:** KRITIS

---

### Q073 — Admin kami salah memasukkan siswa ke kelas lain atau salah menonaktifkan kelas. Bisakah dibatalkan dan apakah tercatat?

**Siapa yang kemungkinan bertanya:** Administrator sekolah
**Kemungkinan ditanya:** TINGGI

**Jawaban singkat:**
"Siswa yang salah kelas bisa dipindahkan ke kelas yang benar, dengan riwayat tetap utuh dan tercatat. Kelas yang sudah dinonaktifkan tidak bisa diaktifkan lagi dari layar, tetapi PINTAR menolak menonaktifkan kelas yang masih berisi siswa atau staf."

**Penjelasan:**
- Salah kelas: ada bagian «Pindah kelas» di Konfigurasi. Satu transaksi menutup keanggotaan lama (alasan MOVED) dan membuka yang baru; identitas dan riwayat tetap. Penolakan bernama: MOVE_NOT_CURRENT, MOVE_NOT_A_KELAS, MOVE_SAME_KELAS, MOVE_OTHER_YEAR. Tercatat di log audit. Tidak ada tombol "Batalkan"; memindahkan lagi ke kelas asal tidak dilarang kode, tetapi tidak ada tes "pindah balik" (pembacaan kode).
- Salah menonaktifkan Kelas: layar meminta konfirmasi dan menyatakan "tidak bisa diaktifkan lagi dari layar ini"; alasan wajib (D-097(a)); ditolak bila masih ada anak aktif, murid, atau staf (HAS_ACTIVE_CHILDREN, HAS_MEMBERS, HAS_STAFF). Nama dapat dipakai lagi untuk Kelas baru. **Fungsi reaktivasi tidak ditemukan**; D-022 menyatakan tidak ada reaktivasi di sprint 1 dan tidak ada keputusan yang membatalkannya.
- Pencatatan: log audit hanya-tambah. Namun layar «Jejak audit» di Konfigurasi hanya menampilkan 50 baris terakhir dan **tidak menampilkan kolom pelaku maupun alasan**. Dibaca oleh Admin platform dan Admin sekolah untuk sekolahnya.
- Fitur pindah kelas ada di `main`/staging (migrasi 20261027100000), belum di produksi.

**Mengapa PINTAR seperti ini:** Riwayat tidak pernah ditulis ulang (D-085 M9 untuk pindah kelas; koreksi ke depan untuk konten adalah M10).

**Bukti / mekanisme di PINTAR:** `supabase/migrations/20261027100000_*.sql`; `src/app/konfigurasi/actions.ts:156-175`; `src/lib/hle.ts:2890`; `src/components/struktur/tampilan.ts:46`; `src/app/konfigurasi/page.tsx:124-137, 1106-1122`.

**Sumber:**
- MEMBUKTIKAN: tes M9-S01, M9-K01, ADM09-S01, F08-P10, F10-S06; migrasi dan kode di atas.
- MENETAPKAN ATURAN: D-022, D-097(a), D-085 (M9); SCOPE-INVENTORY J3.3, J3.12; INV-18 (log audit tidak bisa diubah).

**Yang tidak boleh dikatakan:** "Bisa dibatalkan dengan satu klik"; "kelas yang salah dinonaktifkan bisa diaktifkan kembali"; "jejak audit lengkap terlihat oleh admin".

**Status:** SEBAGIAN
**Tingkat sensitivitas:** TINGGI

---

### Q074 — Kalau ada nilai atau data yang salah, siapa yang boleh mengoreksi dan apakah riwayat perubahannya terlihat? Misalnya kalau orang tua memprotes nilai, bukti apa yang bisa kami tunjukkan?

**Siapa yang kemungkinan bertanya:** Administrator sekolah, guru
**Kemungkinan ditanya:** TINGGI

**Jawaban singkat:**
"Nama yang salah hanya dikoreksi oleh Admin platform dengan alasan dan tercatat. Nilai hasil asesmen dihitung server dan guru atau admin tidak bisa mengubahnya di PINTAR. Kalau ada protes, yang bisa ditunjukkan adalah catatan hasil dan bukti per siswa dan per soal, tetapi jalur banding resmi untuk orang tua belum ada."

**Penjelasan:**
- Nama: hanya Admin platform lewat `correct_person_name`, dengan alasan; tercatat dari/ke/alasan/siapa. Admin sekolah, guru, orangnya sendiri, dan kartu kelas ditolak. Sertifikat yang sudah terbit tetap memuat nama saat terbit (D-077(d)). Tidak ada layar untuk fungsi ini.
- Hasil asesmen: ditulis sistem lewat pemicu; skema punya `supersedes_result_id`, tetapi **tidak ditemukan layar atau fungsi klien** bagi guru atau admin untuk mengoreksi nilai (dicari: regrade, rescore, supersedes_result).
- Penurunan kelas bukti sebuah sesi (`evidence_class_overrides`): hanya boleh melemahkan, hanya-tambah, memerlukan kewenangan meninjau integritas, yaitu Admin platform, Admin sekolah, dan Kepala departemen (migrasi `20260912201500:465-466`, `20260926100000:144-157`; F06-P04); doc 05:110 hanya rancangan. Tanpa layar di aplikasi.
- Perpanjangan waktu ujian: fungsi database ada (1–120 menit, alasan wajib, maksimal 3 kali, tercatat) tetapi tidak ada layar guru.
- Bukti yang bisa ditunjukkan: guru melihat catatan satu murid di kelasnya (hasil resmi dengan penguasaan tercatat; M4-K01) dan tampilan per soal setelah asesmen ditutup; hasil dan keanggotaan lama tetap dengan konteks aslinya (M9-S01). Sinyal integritas bukan tuduhan dan tidak mengubah skor.
- Murid tidak punya formulir «Laporkan masalah»; mereka bicara ke guru (D-037).
- **Tidak ada:** layar riwayat perubahan nilai; mekanisme "nilai direvisi"; jalur banding terstruktur untuk orang tua (dicari: appeal, banding, dispute, koreksi nilai).

**Mengapa PINTAR seperti ini:** Skor tidak boleh diubah sembarang orang; evidence harus tahan uji (INV-09, INV-23).

**Bukti / mekanisme di PINTAR:** `supabase/migrations/20260912140823_evidence_response_result.sql`; halaman `/mengajar/[kelas]/murid/[orang]` dan `/mengajar/[kelas]/soal`; migrasi `20260914094500_resilience_late_sync_termination.sql:233-262`.

**Sumber:**
- MEMBUKTIKAN: tes F18-N03, F18-N01, F18-N04, M4-K01, M9-S01, F06-P04, T2-K01; migrasi di atas.
- MENETAPKAN ATURAN: D-077(d), D-037; SCOPE-INVENTORY J5.13, J5.14, J7.6; doc 05 (rancangan, override eligibility).

**Yang tidak boleh dikatakan:** "Guru atau admin bisa mengoreksi nilai di PINTAR"; "riwayat perubahan nilai bisa dilihat"; "orang tua bisa mengajukan banding lewat PINTAR".

**Status:** SEBAGIAN (koreksi nama dan jejak audit ada; koreksi nilai oleh sekolah tidak ada)
**Tingkat sensitivitas:** TINGGI

---

### Q075 — Kalau siswa pindah sekolah atau lulus, siapa yang memegang riwayat belajar dan sertifikatnya, dan apakah masih bisa diakses?

**Siapa yang kemungkinan bertanya:** Orang tua, administrator sekolah
**Kemungkinan ditanya:** TINGGI

**Jawaban singkat:**
"Siswa tetap punya PINTAR ID yang sama, dan sertifikatnya tetap bisa diverifikasi lewat tautan. Tetapi riwayat belajar terinci tetap tersimpan di sekolah asal dan tidak ikut pindah. Status 'lulus' atau alumni belum ada di PINTAR."

**Penjelasan:**
- Pindah antar sekolah PINTAR: alur permintaan → persetujuan → eksekusi dibangun di Konfigurasi. **Yang ikut pindah hanya pendaftaran (enrollment) dan keanggotaan.** Hasil, jawaban, bukti, dan sertifikat terikat ke sekolah ("evidence never travels with a learner"; "a transfer carries no certificate row"). Sekolah penerima hanya melihat catatan keanggotaan.
- Identitas: PINTAR ID permanen dan global (D-059(a)); satu `persons` per orang, tidak pernah dihapus.
- Persetujuan: tombol setujui mengirim catatan persetujuan kosong; aturan persetujuan (kewenangan, orang tua/wali, pengirim yang tidak responsif atau sudah bukan pelanggan) adalah OD-9, **terbuka, harus diputuskan sebelum Transfer dibuka untuk institusi nyata**.
- Sertifikat: murid membaca sertifikatnya sendiri; verifikasi publik lewat `/verifikasi/[token]` tetap bisa (halaman PINTAR sendiri, jadi PINTAR harus berjalan). Sertifikat tidak ditulis ulang saat nama dikoreksi (F18-N04).
- Lulus: skema punya alasan akhir enrolmen 'COMPLETED', tetapi **tidak ada konsep, layar, atau status "lulus/alumni"**. Apakah murid dengan enrolmen berakhir masih bisa masuk dan membuka sertifikatnya: belum ditelusuri; PERLU VERIFIKASI TEKNIS.
- Pindah ke sekolah non-PINTAR (ekspor catatan portabel): dirancang (doc 04 §3c), tidak dibangun.
- Hak atas data sekolah dan catatan portabel siswa: bukan kontradiksi, tetapi perlu model hak atas data (D-112(e); Q061).

**Mengapa PINTAR seperti ini:** Bukti belajar terikat sekolah tempat bukti dibuat; identitas dan sertifikat tidak ditulis ulang.

**Bukti / mekanisme di PINTAR:** `supabase/migrations/20260912004527_transfer_rollover.sql:15-19`; `src/app/konfigurasi/actions.ts:68-110`.

**Sumber:**
- MEMBUKTIKAN: tes F01-T10, F07-P10, F04-T13, F04-T10, F18-N04; `docs/product/SCHOOL-DATA-EXPORT-4.0.md` §D.
- MENETAPKAN ATURAN/RANCANGAN: D-059(a); `docs/rebuild/11-PINTAR-OPEN-DECISIONS.md` OD-9 (baris 134-148); `docs/rebuild/04-PINTAR-STATE-MACHINES.md` baris 112-114; SCOPE-INVENTORY J3.10 (P2).

**Yang tidak boleh dikatakan:** "Riwayat belajar mengikuti siswa ke sekolah baru"; "alumni tetap bisa masuk dan mengakses semuanya"; "orang tua menyetujui perpindahan di PINTAR".

**Status:** SEBAGIAN (perpindahan antar sekolah PINTAR dibangun, kebijakan persetujuan belum diputuskan; kelulusan tidak ada)
**Tingkat sensitivitas:** KRITIS

---

### Q076 — Siapa yang bisa melihat apa? Apakah kepala sekolah bisa melihat semua guru dan semua siswa?

**Siapa yang kemungkinan bertanya:** Kepala sekolah, guru
**Kemungkinan ditanya:** TINGGI

**Jawaban singkat:**
"Pada versi yang sudah dibangun dan diuji (belum di produksi), itu bergantung pada peran yang diberikan sekolah. 'Kepala sekolah' bukan peran tersendiri di PINTAR. Admin sekolah mengelola struktur dan orang, tetapi tidak membaca hasil akademik siswa; Dekan melihat angka dalam lingkupnya; guru melihat kelasnya; siswa hanya dirinya sendiri."

**Penjelasan:**
- Peran di database ada enam: murid, guru, kepala departemen, dekan, admin sekolah, admin platform. Nama layar: Guru, Kepala departemen, Dekan, Admin sekolah, Admin platform. «Kepala sekolah» adalah taksonomi desain, bukan peran (D-059(c)).
- Terbukti oleh tes: murid hanya dirinya; guru hanya kelasnya; kepala departemen hanya subtree departemennya, tidak departemen saudara; Dekan melihat departemen di bawah lingkupnya dan tak seorang pun di luar (F06-P12, F06-P10). Membuka detail satu murid lewat `management_learner_detail`: Kepala departemen dan Dekan boleh di dalam lingkup, ditolak di luar; tiap pembukaan masuk audit (F06-P12).
- Admin sekolah menyimpan daftar orang tetapi **tidak membaca hasil akademik murid** (F06-P14) dan ditolak dari beranda Pimpinan (UX1-PIMPINAN-AKSES-01). Dekan hanya baca (F01-T06, F06-N02, F01-R02).
- Admin platform melihat semua sekolah.
- Konflik sumber: doc 05 (rancangan) berbeda dari tes F06-P12/P14 soal Dekan dan Admin sekolah; tes dan kode berlaku.
- Tidak ada: peran "kepala sekolah" yang melihat semuanya; matriks hak akses yang bisa dibaca sekolah dari layar.

**Mengapa PINTAR seperti ini:** Otorisasi dipaksa di lapisan database, tidak hanya antarmuka (INV-37; doc 05).

**Bukti / mekanisme di PINTAR:** `supabase/migrations/20260912004158_foundation_base.sql:39-40`; `src/lib/hle.ts:3072-3076`.

**Sumber:**
- MEMBUKTIKAN: tes F06-P10, F06-P12, F06-P14, F01-T06, F06-N02, F01-R02, UX1-PIMPINAN-AKSES-01, M4-K01; `docs/product/SCHOOL-DATA-EXPORT-4.0.md` §A.
- MENETAPKAN ATURAN: D-059(c); INV-19; `docs/rebuild/05-PINTAR-AUTHORIZATION-MATRIX.md` (rancangan; dikalahkan tes).

**Yang tidak boleh dikatakan:** "Kepala sekolah melihat semua guru dan siswa"; "Admin sekolah bisa melihat nilai semua siswa"; "hak akses cukup diatur lewat tampilan".

**Status:** TERSEDIA DI 4.0 (main/staging; belum di produksi)
**Tingkat sensitivitas:** TINGGI

---

### Q077 — Apakah orang tua bisa melihat perkembangan anaknya di PINTAR?

**Siapa yang kemungkinan bertanya:** Orang tua, komite sekolah
**Kemungkinan ditanya:** TINGGI

**Jawaban singkat:**
"Belum. PINTAR 4.0 tidak punya akun atau portal orang tua, dan kami tidak punya tanggal untuk itu. Orang tua dapat melihat perkembangan anak lewat guru atau sekolah."

**Penjelasan:** "Parent experience" ada di kelompok LATER (`docs/rebuild/09`, baris 127), tanpa versi atau tanggal. Peran database tidak punya orang tua atau wali; tidak ada rute atau layar orang tua di `src/`. "Guardian" hanya muncul sebagai pihak persetujuan transfer yang belum diputuskan (OD-9). Akun murid memakai Kartu PINTAR dan PIN; membagikannya kepada orang tua bukan fitur. Karena belum ada akun orang tua, "melalui guru atau sekolah" berarti sekolah menunjukkan laporan yang dapat dicetak; itu bukan fitur khusus untuk orang tua.

**Mengapa PINTAR seperti ini:** Cakupan 4.0 dibatasi pada pengguna sekolah; pengalaman orang tua belum masuk lingkup.

**Bukti / mekanisme di PINTAR:** Tidak ada.

**Sumber:** MENETAPKAN ATURAN: `docs/rebuild/09-PINTAR-V1-SCOPE-BOUNDARIES.md` baris 127 (LATER); OD-9. Tidak ada peran/rute orang tua di kode (dicari `orang tua|parent|guardian` di `src/`).

**Yang tidak boleh dikatakan:** "Portal orang tua segera hadir / ada di 4.5"; "orang tua bisa melihat lewat akun anak".

**Status:** TIDAK DI 4.0 (LATER, tanpa versi dan tanggal)
**Tingkat sensitivitas:** PENTING

---

### Q078 — Apakah orang tua harus memberi izin sebelum data anak masuk ke PINTAR?

**Siapa yang kemungkinan bertanya:** Orang tua, petugas perlindungan data
**Kemungkinan ditanya:** TINGGI

**Jawaban singkat:**
"PINTAR sendiri tidak punya mekanisme persetujuan orang tua. Apakah sekolah wajib meminta izin orang tua, dan siapa yang bertanggung jawab atas itu, adalah pertanyaan hukum yang belum kami jawab, jadi kami tidak akan mengatakan perlu atau tidak perlu."

**Penjelasan:** Data murid masuk lewat unggahan daftar oleh Admin sekolah di Pendataan; layar meminta persetujuan *admin* sebelum mencatat siapa pun, bukan orang tua. Tidak ditemukan kolom, alur, atau layar persetujuan orang tua (dicari consent, persetujuan, izin orang tua, guardian). Satu-satunya: transfer menyimpan catatan persetujuan yang bentuknya masih konfigurasi (OD-9). Foto profil (J8.8) tidak punya mekanisme persetujuan. Peran hukum PINTAR (pengendali/pemroses) dan perjanjian pemrosesan data: tidak ditemukan. Retensi dan hak data subjek: lihat Q080, Q081.

**Mengapa PINTAR seperti ini:** Persyaratan hukum belum dianalisis; produk tidak boleh mengarangnya.

**Bukti / mekanisme di PINTAR:** Persetujuan admin pada Pendataan (`src/lib/hle.ts:2210`).

**Sumber:** MENETAPKAN ATURAN: OD-5, OD-9 (`docs/rebuild/11`); SCOPE-INVENTORY J8.8. Persetujuan orang tua: **tidak ditemukan**.

**Yang tidak boleh dikatakan:** "Sesuai UU PDP"; "PINTAR meminta izin orang tua"; "tidak perlu izin orang tua".

**Status:** PERLU VERIFIKASI HUKUM; kedua: KEBIJAKAN BELUM DIPUTUSKAN — ▲ BELUM DIPUTUSKAN HARI INI
**Tingkat sensitivitas:** KRITIS

---

### Q079 — Orang tua siswa berkebutuhan khusus bertanya: apakah anak saya bisa memakai PINTAR dengan alat bantu atau waktu tambahan?

**Siapa yang kemungkinan bertanya:** Orang tua siswa berkebutuhan khusus, guru
**Kemungkinan ditanya:** SEDANG

**Jawaban singkat:**
"Kami belum punya fitur akomodasi khusus yang dapat kami janjikan, dan belum menguji PINTAR dengan pembaca layar atau alat bantu lain. Perpanjangan waktu ujian ada di sisi database tetapi belum punya layar untuk guru."

**Penjelasan:** Waktu tambahan per sitting: fungsi database `extend_session_deadline` (1–120 menit, alasan wajib, maksimal 3 kali, tercatat) untuk pemegang kewenangan menugaskan; **tidak ada layar** (komentar kode di halaman mengajar). Aksesibilitas yang terbukti oleh tes: kontras warna dihitung dari token (UX1-S0-CONTRAST-01); dialog tur berlabel dan fokus (UX1-TUR-AKSES-01); kolom masuk dengan atribut dan fokus benar (UX1-MASUK-AKSES-01); layar 320 px (tanpa ID tes khusus untuk klaim ini di bagian ini). Itu tes komponen tertentu, bukan sertifikasi aksesibilitas. Tidak ditemukan: akomodasi per murid (waktu tambahan terprogram, teks besar, pembaca layar teruji, mode disleksia) maupun keputusan tentangnya (dicari aksesibilitas, berkebutuhan khusus, ABK, disleksia, extra time).

**Mengapa PINTAR seperti ini:** Aksesibilitas khusus belum menjadi baris lingkup 4.0.

**Bukti / mekanisme di PINTAR:** `supabase/migrations/20260914094500_resilience_late_sync_termination.sql:233-262`; `src/app/mengajar/[kelas]/langkah/page.tsx:20-33`.

**Sumber:** MEMBUKTIKAN: tes UX1-S0-CONTRAST-01, UX1-TUR-AKSES-01, UX1-MASUK-AKSES-01. MENETAPKAN ATURAN: SCOPE-INVENTORY X.6. Fitur akomodasi: **tidak ditemukan**.

**Yang tidak boleh dikatakan:** "PINTAR ramah ABK / mendukung pembaca layar"; "guru bisa memberi waktu tambahan di layar"; "memenuhi standar WCAG".

**Status:** PERLU VERIFIKASI TEKNIS
**Tingkat sensitivitas:** TINGGI

---

### Q080 — Orang tua minta data anaknya dilihat, dikoreksi, atau dihapus. Bagaimana prosesnya?

**Siapa yang kemungkinan bertanya:** Orang tua, petugas perlindungan data
**Kemungkinan ditanya:** SEDANG

**Jawaban singkat:**
"PINTAR belum punya proses resmi untuk permintaan semacam itu. Saat ini permintaan hanya bisa ditangani secara manual lewat sekolah dan tim PINTAR, dan kami belum bisa menjanjikan hasil atau waktu."

**Penjelasan:** Tidak ada alur permintaan subjek data di kode atau dokumen. Melihat: murid membaca data miliknya sendiri (hasil, sertifikat); tidak ada ekspor (SCHOOL-DATA-EXPORT-4.0.md §C). Koreksi: nama hanya oleh Admin platform tanpa layar; kartu hilang diterbitkan ulang oleh admin sekolah. Hapus: orang tidak bisa dihapus (pemicu `persons_no_delete`); tidak ada fungsi anonimisasi; institusi dan log audit juga tidak bisa dihapus; `institutions.retention_days` tidak dipakai. D-110(c) mewajibkan implementasi nanti mendefinisikan hak data pribadi, retensi dan penghapusan, dan kedaluwarsa cadangan; itu keputusan prinsip, bukan fitur (D-110(f)). «Laporkan masalah» hanya untuk staf.

**Mengapa PINTAR seperti ini:** Hak subjek data belum dirancang; prinsip ada, mekanisme belum.

**Bukti / mekanisme di PINTAR:** Tidak ada alur khusus.

**Sumber:**
- MEMBUKTIKAN: `docs/product/SCHOOL-DATA-EXPORT-4.0.md` §C, §D; migrasi `organisation.sql:11-19`; tes F18-N03.
- MENETAPKAN ATURAN: D-110(c)(f); D-037.

**Yang tidak boleh dikatakan:** "Orang tua bisa meminta data lewat PINTAR"; "data anak dihapus dalam X hari"; "hak data pribadi dipenuhi".

**Status:** KEBIJAKAN BELUM DIPUTUSKAN; kedua: PERLU VERIFIKASI HUKUM — ▲ BELUM DIPUTUSKAN HARI INI
**Tingkat sensitivitas:** KRITIS

---

### Q081 — Berapa lama data siswa disimpan?

**Siapa yang kemungkinan bertanya:** Petugas perlindungan data, pengurus yayasan
**Kemungkinan ditanya:** TINGGI

**Jawaban singkat:**
"Durasi retensi belum diputuskan, dan kami tidak akan mengarang angka. Saat ini data tinggal tanpa batas karena PINTAR belum punya mekanisme penghapusan, sementara aturan durasi menurut hukum masih terbuka."

**Penjelasan:** OD-5: "arsitektur sudah diputuskan; durasi hukum terbuka"; PINTAR tidak boleh mengarang durasi retensi hukum (doc 06; doc 11). `institutions.retention_days` kosong berarti "tidak dikonfigurasi, job mati" dan tidak dipakai. Praktiknya: orang, institusi, dan log audit tidak bisa dihapus (SCHOOL-DATA-EXPORT-4.0.md §D). Rancangan: log audit disimpan tanpa batas atau menurut kebijakan institusi; sertifikat menyimpan snapshot identitas (INV-30). Cadangan: data yang sudah dihapus tetap ada di cadangan hingga kedaluwarsa, paling lama 12 bulan untuk salinan independen (belum aktif; OFFSITE-BACKUP-DESIGN baris 79-81); cadangan bawaan Supabase 7 hari. Catatan pemberitahuan privasi tentang retensi cadangan (O11) belum dilakukan.

**Mengapa PINTAR seperti ini:** Durasi hukum adalah keputusan pemilik/penasihat hukum, bukan produk.

**Bukti / mekanisme di PINTAR:** `institutions.retention_days` (tidak dipakai).

**Sumber:**
- MEMBUKTIKAN: `docs/product/SCHOOL-DATA-EXPORT-4.0.md` §D.
- MENETAPKAN ATURAN/RANCANGAN: `docs/rebuild/11-PINTAR-OPEN-DECISIONS.md` OD-5 (baris 80-95); `docs/rebuild/06` bagian Retention; D-107 D4; `docs/recovery/OFFSITE-BACKUP-DESIGN.md:79-81`.

**Yang tidak boleh dikatakan:** angka retensi apa pun ("5 tahun", "sampai lulus"); "data dihapus otomatis".

**Status:** KEBIJAKAN BELUM DIPUTUSKAN (OD-5 terbuka) — ▲ BELUM DIPUTUSKAN HARI INI
**Tingkat sensitivitas:** KRITIS

---

### Q082 — Kalau kami berhenti berlangganan, apa yang terjadi dengan data kami dan sertifikat siswa?

**Siapa yang kemungkinan bertanya:** Pengurus yayasan, kepala sekolah
**Kemungkinan ditanya:** TINGGI

**Jawaban singkat:**
"Prinsip kami: PINTAR tidak boleh menahan data sekolah atau mempersulit sekolah yang ingin pergi. Tetapi alur keluar, unduh data, dan penghapusan belum dibangun di 4.0, jadi kami belum bisa menjanjikan prosesnya. Sertifikat yang sudah terbit dirancang tetap dapat diverifikasi lewat tautan."

**Penjelasan:**
- D-110(a): NO HOSTAGE DATA (prinsip, bukan klaim bahwa sekolah memiliki setiap data tentang seseorang; D-112(e), Q061). D-110(d): perjalanan keluar tertib (permintaan → pengakuan → penjelasan status → penyerahan data yang berhak → penjelasan retensi/penghapusan → selesai) "harus pada akhirnya ada". D-110(b)(f): prinsip, bukan fitur; ekspor mandiri adalah kandidat 4.5, belum dirancang atau disetujui.
- Kenyataan kode: tidak ada ekspor terstruktur, tidak ada alat ekstraksi satu sekolah, jalur keluar dan retensi tidak dibangun. Yang bisa dicetak: dua laporan ringkasan, sertifikat milik murid, lembar kartu yang baru diterbitkan.
- Sertifikat: verifikasi publik lewat `/verifikasi/[token]` bekerja hari ini; rancangan keluar menyatakan sertifikat tetap dapat diverifikasi setelah sekolah keluar (doc 06 baris 150-156), tetapi **alur keluar belum dibangun dan tidak ada tes "sekolah dinonaktifkan lalu sertifikat diverifikasi"**. Jangan menjanjikannya.
- Tidak ada layar atau alur "berhenti berlangganan" dan tidak ada model langganan di kode.

**Mengapa PINTAR seperti ini:** Sekolah bertahan karena nilai, bukan karena sulit membawa data keluar (D-110).

**Bukti / mekanisme di PINTAR:** Hanya cetak dan verifikasi sertifikat publik.

**Sumber:**
- MEMBUKTIKAN: `docs/product/SCHOOL-DATA-EXPORT-4.0.md` ringkasan, §A–§D; tes F04-T10.
- MENETAPKAN ATURAN/RANCANGAN: D-110(a)(b)(d)(f); `docs/rebuild/06` baris 150-156.

**Yang tidak boleh dikatakan:** "Anda bisa mengunduh semua data kapan saja"; "data Anda dihapus saat berhenti"; "ekspor akan ada di 4.5" (hanya "kandidat"); "bisa dibuka di Excel"; "sertifikat dijamin tetap terverifikasi".

**Status:** SEBAGIAN (alur keluar belum dibangun)
**Tingkat sensitivitas:** KRITIS

---

### Q083 — Bisakah kami meminta semua data kami dihapus, dan apakah salinan di backup juga hilang?

**Siapa yang kemungkinan bertanya:** Petugas perlindungan data
**Kemungkinan ditanya:** SEDANG

**Jawaban singkat:**
"Belum ada fitur penghapusan data sekolah di PINTAR, dan kebijakannya belum diputuskan. Salinan di cadangan tidak dihapus segera; cadangan akan habis masa simpannya dengan sendirinya."

**Penjelasan:** Tidak ada fungsi penghapusan data sekolah atau orang; institusi dan orang tidak bisa dihapus oleh desain. D-110(c) menyebut penghapusan, kedaluwarsa cadangan, dan retensi yang wajib secara hukum sebagai hal yang harus didefinisikan. Cadangan: cadangan bawaan Supabase 7 hari; salinan independen (belum aktif) hingga 12 bulan dengan Object Lock yang mencegah penghapusan dini (D-107 D4; OFFSITE-BACKUP-DESIGN baris 79-81). CLOSURE-PLAN menyatakan data pribadi produksi meninggalkan Supabase dan bertahan hingga 12 bulan (O11).

**Mengapa PINTAR seperti ini:** Prinsip ada (D-110); mekanisme belum.

**Bukti / mekanisme di PINTAR:** Tidak ada.

**Sumber:** MENETAPKAN ATURAN/RANCANGAN: D-110(c); D-107 D4; `docs/recovery/OFFSITE-BACKUP-DESIGN.md` baris 79-81; `docs/recovery/CLOSURE-PLAN-150.md` (O11, residual risks). MEMBUKTIKAN: `docs/product/SCHOOL-DATA-EXPORT-4.0.md` §D.

**Yang tidak boleh dikatakan:** "Kami bisa menghapus seluruh data Anda"; "backup ikut terhapus segera"; "data dihapus permanen".

**Status:** KEBIJAKAN BELUM DIPUTUSKAN (belum dibangun) — ▲ BELUM DIPUTUSKAN HARI INI
**Tingkat sensitivitas:** KRITIS

---

### Q084 — Kalau perusahaan yang mengoperasikan PINTAR tutup, bagaimana kami mengambil data?

**Siapa yang kemungkinan bertanya:** Pengurus yayasan, bagian IT
**Kemungkinan ditanya:** TINGGI

**Jawaban singkat:**
"Kami belum punya rencana tertulis untuk situasi itu, dan saat ini sekolah belum bisa mengunduh datanya sendiri. Kami tidak akan menjanjikan mekanisme yang belum ada."

**Penjelasan:** Tidak ditemukan rencana kelangsungan, penutupan usaha, atau eskrow kode/data (dicari wind-down, insolvensi, continuity, succession, source escrow, perusahaan tutup; hanya SYS-08 "Succession" tentang administrator kedua). D-110 berlaku sebagai prinsip, bukan mekanisme; ekspor mandiri = kandidat 4.5; hari ini tidak ada alat ekstraksi per sekolah, bahkan untuk tim PINTAR. Akun infrastruktur (Supabase, Vercel, GitHub, registrar, host email, dan nanti AWS) dipegang satu orang (pemilik); salinan independen nanti masuk akun AWS milik pemilik. Tidak ada berkas lisensi di akar repositori. OD-9 (pengirim yang tidak lagi pelanggan) belum dijawab.

**Mengapa PINTAR seperti ini:** Skenario ini belum menjadi keputusan produk.

**Bukti / mekanisme di PINTAR:** Tidak ada.

**Sumber:** MEMBUKTIKAN: `docs/product/SCHOOL-DATA-EXPORT-4.0.md` ringkasan, §B. MENETAPKAN ATURAN/RANCANGAN: D-110(f); BACKUP-DR-REVIEW Part II §1, §6; CLOSURE-PLAN-150 WP-D; OD-9. Rencana kelangsungan: **tidak ditemukan**.

**Yang tidak boleh dikatakan:** "Data Anda aman dalam eskrow"; "Anda selalu bisa mengambil data"; "ada rencana kelangsungan bisnis".

**Status:** KEBIJAKAN BELUM DIPUTUSKAN — ▲ BELUM DIPUTUSKAN HARI INI
**Tingkat sensitivitas:** KRITIS

---

### Q085 — Kalau pendiri atau orang kunci di PINTAR berhalangan, siapa yang menjalankan dan memulihkan PINTAR?

**Siapa yang kemungkinan bertanya:** Pengurus yayasan
**Kemungkinan ditanya:** TINGGI

**Jawaban singkat:**
"Itu risiko yang kami catat sendiri, dan kami sudah menetapkan bahwa ketahanan ini wajib dipenuhi sebelum PINTAR dipakai sekolah nyata di produksi. Pelaksanaannya, seperti penunjukan administrator dan kustodian kunci tambahan, belum selesai."

**Penjelasan:**
- Sudah **diputuskan wajib**: D-001 (admin kedua sebelum 23 September 2027), D-054(e) (prosedur break-glass teruji sebelum rilis produksi), D-106(d) (administrator kedua untuk tiap sistem eksternal, sebelum penggunaan sekolah nyata), D-109(c) dan D-111(b) (dua kustodian terpisah yang masing-masing membuktikan kepemilikan kunci sebelum escrow atau cadangan produksi).
- **Belum dilaksanakan:** penunjukan administrator kedua dan kustodian kunci (O9); latihan break-glass (C-11 tercatat TODO; bukti latihan tidak ditemukan); `docs/recovery/RECOVERY-AUTHORITY.md` direncanakan dan belum ada; runbook native restore belum ditulis. Saat ini ketergantungan pada satu orang untuk pemulihan diakui sebagai celah terbuka (BACKUP-DR-REVIEW Part II §1, §6; SYS-08 FAIL).
- D-101: Admin platform adalah otoritas pemulihan terakhir dan hanya dipulihkan oleh Admin platform lain (D101-S01).
- Dokumen koordinasi tidak konsisten tentang pemegang peran; dirapikan koordinator.

**Mengapa PINTAR seperti ini:** Pemulihan yang hanya bisa dibuka oleh satu kustodian adalah ketergantungan yang justru ingin dihilangkan #150 (D-111).

**Bukti / mekanisme di PINTAR:** Tes D101-S01; struktur `docs/recovery/custody.json` (belum terisi).

**Sumber:**
- MEMBUKTIKAN: BACKUP-DR-REVIEW Part II §1, §6; `docs/recovery/PHASE-1-STATUS.md:200`; `docs/recovery/custody.json` (struktur).
- MENETAPKAN ATURAN: D-001, D-054(e), D-101, D-106(d), D-109(c), D-111(b); `docs/recovery/CLOSURE-PLAN-150.md` WP-D (baris 441–462).

**Yang tidak boleh dikatakan:** "Ada tim yang bisa mengambil alih"; "pemulihan tidak bergantung pada satu orang"; "break-glass sudah teruji"; jumlah orang yang memegang peran tertentu.

**Status:** SEBAGIAN (kewajiban sudah diputuskan; pelaksanaan belum)
**Tingkat sensitivitas:** KRITIS

---

### Q086 — Kalau ada masalah saat ujian sedang berlangsung, kami hubungi siapa dan secepat apa dijawab?

**Siapa yang kemungkinan bertanya:** Guru, administrator sekolah
**Kemungkinan ditanya:** TINGGI

**Jawaban singkat:**
"Pada versi yang sudah dibangun dan diuji (belum di produksi), staf menekan «Laporkan masalah» di dalam PINTAR dan menandai bahwa kelas terhenti. Targetnya laporan yang menghentikan kelas dijawab pada hari sekolah yang sama, tetapi itu target kami, bukan jaminan kontrak, dan belum ada nomor darurat."

**Penjelasan:**
- «Laporkan masalah» tersedia untuk staf (Guru, Kepala departemen, Dekan, Admin sekolah, Admin platform): apa yang dilakukan, yang diharapkan, yang terjadi, kotak "menghentikan kelas", tangkapan layar opsional; halaman, kode rujukan, peran, sekolah, build, dan perangkat terlampir otomatis. Murid tidak mendapat formulir; mereka memberi tahu gurunya. Dibaca oleh pelapor, Admin sekolah, dan Admin platform.
- Tingkat dukungan (D-037): Tier 1 = Admin sekolah dan tim operasi PINTAR; Tier 2 = koordinator. "Laporan yang menghentikan kelas dijawab pada hari sekolah yang sama (WIB); selebihnya dalam satu hari sekolah." Helpdesk penuh dipertimbangkan ulang 2027. Teks layar mengulang janji itu.
- Tidak ada: SLA mengikat, jam kerja, telepon/WhatsApp, eskalasi darurat saat ujian, pemberitahuan email ke pelapor (BOB15-K01 menegaskan tidak ada yang menjanjikan email), dan pemantauan produksi aktif.
- Konflik sumber: PHASE-1-STATUS dan RELEASE-CHECKLIST REL-13 menyebut belum dibangun, sedangkan JOURNEY-LOG butir 28 (5 Okt, lebih baru) dan tes BOB15-* menunjukkan sudah dibangun. Yang baru berlaku, tetapi **migrasi `20261119100000` belum ada di produksi**.

**Mengapa PINTAR seperti ini:** Dukungan dibuat ramping dan semua laporan tetap di dalam PINTAR agar nama siswa tidak tercecer di obrolan (D-037).

**Bukti / mekanisme di PINTAR:** `src/app/lapor/page.tsx`, `saya/page.tsx`, `actions.ts`; migrasi `20261119100000`; teks `src/lib/hle.ts:2774-2775`.

**Sumber:**
- MEMBUKTIKAN: tes BOB15-K01, BOB15-S01, BOB15-D01; JOURNEY-LOG butir 28.
- MENETAPKAN ATURAN: D-037; SCOPE-INVENTORY J10.1. SLA: **tidak ditemukan**.

**Yang tidak boleh dikatakan:** "Dijawab dalam X menit/jam" atau "24/7"; "ada SLA"; "siswa bisa melapor langsung"; "Anda akan diberi tahu lewat email".

**Status:** SEBAGIAN (kanal ada di `main`/staging; target hari sekolah yang sama adalah target D-037, bukan SLA)
**Tingkat sensitivitas:** TINGGI

---

### Q087 — Setelah kami melapor masalah, bagaimana kami tahu laporannya diterima dan sedang ditangani?

**Siapa yang kemungkinan bertanya:** Guru, administrator sekolah
**Kemungkinan ditanya:** SEDANG

**Jawaban singkat:**
"Pada versi yang sudah dibangun dan diuji (belum di produksi), setelah mengirim, Anda langsung melihat 'Laporan Anda diterima' dan bisa mengikuti statusnya di «Laporan saya»: Diterima, Ditangani, Selesai. Setiap perpindahan status disertai catatan 'langkah berikutnya' untuk Anda. Tidak ada email otomatis, jadi Anda perlu membuka halaman itu."

**Penjelasan:** Status hanya maju dan setiap perpindahan wajib menulis "langkah berikutnya" untuk pelapor (maksimal 500 karakter). Tier 1 (Admin sekolah, di Konfigurasi «Laporan masalah») dan Tier 2 (Admin platform) mengubah status; pengiriman dan perpindahan masuk audit. Hanya untuk staf: murid dan orang tua tidak punya akses. Pembuktian berasal dari tes dan CI hijau; catatan uji manusia untuk J10 tidak ditemukan. Ada di `main`/staging; belum di produksi.

**Mengapa PINTAR seperti ini:** Prinsip: terima → akui → jelaskan status → berikan langkah berikutnya; pengguna tidak boleh merasa laporannya masuk lubang hitam.

**Bukti / mekanisme di PINTAR:** `src/app/lapor/actions.ts`; kunci teks `lapor.diterima`, `lapor.status.*`, `lapor.kode.report_next_step_required`.

**Sumber:**
- MEMBUKTIKAN: tes BOB15-D01, BOB15-K01; JOURNEY-LOG butir 28.
- MENETAPKAN ATURAN: D-037.

**Yang tidak boleh dikatakan:** "Kami akan memberi tahu lewat email/SMS"; "laporan murid atau orang tua diterima lewat PINTAR"; "status berjalan otomatis" (dipindah manual oleh admin).

**Status:** TERSEDIA DI 4.0 (main/staging; belum di produksi)
**Tingkat sensitivitas:** NORMAL

---


## Kelompok 5 — Skalabilitas, regulasi, biaya, sistem lain, roadmap (Q088–Q100)

### Q088 — Seribu siswa ujian bersamaan, apakah kuat? Berapa sekolah yang sudah diuji, dan apakah ada batas jumlah kelas dan siswa yang bisa kami tambahkan?

**Siapa yang kemungkinan bertanya:** Bagian IT, pengurus yayasan
**Kemungkinan ditanya:** TINGGI

**Jawaban singkat:**
"Jujur: pengujian kami menunjukkan 50 siswa mengerjakan bersamaan berjalan aman, tetapi 1.000 siswa bersamaan pada konfigurasi saat ini belum memenuhi target kami, dan kami belum mengujinya lagi. Karena itu kami membatasi jumlah penguji dan menaikkan kapasitas bertahap, bukan sekaligus."

**Penjelasan:**
- Target kapasitas ditetapkan bertahap: L1 = 1.000 siswa, L2 = 5.000, L3 = 10.000, L4 = 20.000, L5 = 60.000 (titik patah dicatat, lulus tidak wajib). Jumlah siswa terdaftar tidak boleh melebihi level terakhir yang lulus (D-035).
- Hasil uji L1 di lingkungan staging (siswa sintetis, satu sekolah sintetis, bukan sekolah nyata): 1.000 siswa bersamaan **tidak memenuhi** target. Tidak ada jawaban hilang atau ganda, tetapi waktu simpan jawaban p95 11,7 detik (batas 1 detik), p99 29,7 detik (batas 3 detik), galat server 0,133% (batas 0,1%), kolam koneksi habis, CPU database 98%. Database pulih ke kondisi normal dalam 194 detik (D-089(a)).
- Pada 50 siswa bersamaan: aman (0 jawaban hilang, 0 ganda, 0 galat; CPU database maksimum 18%). Lewat jalur uji langsung ke database, target D-031 terpenuhi; lewat aplikasi sungguhan dari peramban, p95 simpan 1.366 ms sehingga belum memenuhi 1 detik sebagaimana diukur.
- Selama pengujian awal, jumlah penguji dibatasi 50 orang pada satu waktu (D-089(d)). Ukuran komputasi (tier) produksi diputuskan sebelum produksi berdasarkan uji kapasitas (D-089(c), CAP-08).
- Gelombang masuk pagi hari dengan Kartu PINTAR (CAP-01) belum pernah diuji. Ada risiko yang tercatat: batas permintaan per alamat server pada layanan masuk dapat menolak banyak siswa sekaligus (D-031).
- Batas keras jumlah sekolah/kelas/siswa **tidak ditemukan** di kode. Yang membatasi adalah kebijakan penerimaan bertahap (D-031/D-035/D-089(d)), bukan batas sistem.
- Kohort D-035 (1 November dan 1 Desember) **bukan lagi komitmen jadwal**; D-083 yang berlaku, dan keduanya tetap terbuka sampai PRODUCTION READY (D-112(d)). Jangan menyebut tanggal itu kepada sekolah. Hasil uji L1 yang gagal (D-089) berdiri sendiri dan tidak boleh ditutupi oleh hasil skala kecil yang lulus.

**Mengapa PINTAR seperti ini:** Kapasitas harus diketahui, bukan diasumsikan. Angka yang penting adalah aktivitas bersamaan, bukan jumlah akun, karena ujian menulis banyak data (D-031, D-089).

**Bukti / mekanisme di PINTAR:** Uji beban di staging dengan siswa sintetis; hasil dicatat apa adanya, termasuk yang gagal (JOURNEY-LOG baris 97–98; RELEASE-CHECKLIST CAP-01..CAP-10).

**Sumber:**
- MEMBUKTIKAN: `docs/recovery/JOURNEY-LOG.md` baris 97–98 (L1 dan 50 siswa); `docs/coordination/RELEASE-CHECKLIST.md` CAP-01, CAP-02 (FAIL), CAP-07 (PARTIAL), CAP-08 (PARTIAL), CAP-09/CAP-10.
- MENETAPKAN ATURAN: D-031, D-035, D-083, D-089(a)–(d), D-112(d).

**Yang tidak boleh dikatakan:** "Kuat untuk seribu siswa"; "sudah diuji di X sekolah" (uji memakai satu sekolah sintetis); "mendukung 60.000 siswa"; "ada batas teknis N sekolah"; tanggal kapan kapasitas tercapai.

**Status:** SEBAGIAN; kedua: PERLU VERIFIKASI TEKNIS
**Tingkat sensitivitas:** PENTING

---

### Q089 — Apakah PINTAR sudah mematuhi UU Pelindungan Data Pribadi dan terdaftar sebagai PSE di Komdigi? Siapa pengendali dan pemroses data menurut hukum, dan adakah perjanjian pemrosesan data dengan sekolah?

**Siapa yang kemungkinan bertanya:** Petugas perlindungan data, compliance, pengawas
**Kemungkinan ditanya:** TINGGI

**Jawaban singkat:**
"Kami tidak akan menjawab 'ya' sebelum itu benar-benar diperiksa oleh penasihat hukum. Status kepatuhan UU PDP, pendaftaran PSE, dan pembagian peran pengendali dan pemroses data belum kami tetapkan secara tertulis. Kami akan menyampaikan hasilnya kepada Anda setelah pemeriksaan hukum selesai."

**Penjelasan:** Di repositori tidak ditemukan: dokumen status kepatuhan UU PDP, bukti pendaftaran PSE, penetapan pengendali/pemroses, perjanjian pemrosesan data dengan sekolah, atau kebijakan privasi/syarat layanan di aplikasi. Yang ada hanya teks privasi lokal pada layar tertentu (formulir «Laporkan masalah» dan umpan balik kelas) dan pengakuan bahwa durasi retensi hukum masih terbuka (OD-5). Jangan menyebut nomor pasal.

**Mengapa PINTAR seperti ini:** Aturan produk melarang mengarang kewajiban hukum atau durasi retensi (OD-5). Hukum ditetapkan penasihat hukum, bukan tim produk.

**Bukti / mekanisme di PINTAR:** Tidak ada dokumen kepatuhan. Fakta teknis yang relevan: data per sekolah dipisahkan oleh aturan akses di database (lihat Q056); lokasi data Singapura (lihat Q058); salinan independen yang kelak aktif akan memuat data semua sekolah dan diperlakukan sangat sensitif (D-107(c); detail teknis: tim teknis).

**Sumber:**
- MENETAPKAN ATURAN/RANCANGAN: `docs/rebuild/11-PINTAR-OPEN-DECISIONS.md` OD-5; `docs/recovery/OFFSITE-BACKUP-DESIGN.md:79-81`; D-107(c).
- Bukti kepatuhan: **tidak ditemukan** (dicari: UU PDP, PSE, Komdigi, pengendali, pemroses, DPA, kebijakan privasi di `docs/`, `src/`, `supabase/`).

**Yang tidak boleh dikatakan:** "Patuh UU PDP"; "terdaftar PSE"; "sekolah adalah pengendali dan PINTAR pemroses" (belum ditetapkan); "ada perjanjian pemrosesan data"; "data hanya di Indonesia"; nomor pasal apa pun.

**Status:** PERLU VERIFIKASI HUKUM
**Tingkat sensitivitas:** KRITIS

---

### Q090 — Berapa biayanya, bagaimana cara bayarnya, dan apakah bisa mencoba dulu sebelum membayar?

**Siapa yang kemungkinan bertanya:** Bendahara, pengurus yayasan
**Kemungkinan ditanya:** TINGGI

**Jawaban singkat:**
"Soal harga dan cara pembayaran belum ada ketetapan tertulis yang bisa kami sampaikan hari ini, jadi kami tidak mau menyebut angka. Kami akan kembalikan ke Anda dengan penawaran resmi dari pihak yang berwenang."

**Penjelasan:** Tidak ditemukan harga, tarif, penagihan, faktur, langganan, atau uji coba gratis di dokumen maupun kode (tidak ada kode penagihan sama sekali). Sekolah masuk lewat penyiapan oleh operasi PINTAR dan tidak ada pendaftaran mandiri sekolah (D-085 M1; SCOPE-INVENTORY §10). Kohort D-035 bukan jadwal (D-083; D-112(d)) dan tidak boleh disebut kepada sekolah; belum tertulis apakah masa awal itu gratis. Isi MOU tidak ada di repositori. Uji coba dengan penguji memakai lingkungan staging dengan formulir laporan (`docs/onboarding/PINTAR-Panduan-Penguji-Pilot.md`), tetapi itu bukan tawaran "coba dulu" untuk sekolah.

**Mengapa PINTAR seperti ini:** Harga dan kontrak adalah keputusan bisnis pemilik, bukan produk; tidak boleh diisi tim produk.

**Bukti / mekanisme di PINTAR:** Tidak ada.

**Sumber:** MENETAPKAN ATURAN: D-083, D-085 (M1), D-112(d). Harga/uji coba: **tidak ditemukan**.

**Yang tidak boleh dikatakan:** angka harga; "gratis"; "uji coba 30 hari"; metode pembayaran tertentu.

**Status:** KEBIJAKAN BELUM DIPUTUSKAN (tidak tercatat) — ▲ BELUM DIPUTUSKAN HARI INI
**Tingkat sensitivitas:** TINGGI

---

### Q091 — Bisakah dibayar dengan dana BOS, dan apakah ada dokumen pendukung untuk pertanggungjawaban?

**Siapa yang kemungkinan bertanya:** Bendahara, kepala sekolah
**Kemungkinan ditanya:** TINGGI

**Jawaban singkat:**
"Kami belum bisa memastikan. Apakah layanan seperti PINTAR boleh dibayar dari dana BOS bergantung pada aturan penggunaan BOS yang berlaku, dan itu perlu diperiksa secara hukum. Dokumen penagihan juga belum kami tetapkan."

**Penjelasan:** Kata "BOS" tidak muncul di sumber; tidak ada fitur faktur, kuitansi, atau dokumen pertanggungjawaban. Yang bisa dihasilkan sekolah hanya laporan ringkasan dan sertifikat yang dicetak lewat peramban, bukan dokumen keuangan (SCHOOL-DATA-EXPORT-4.0.md §A).

**Mengapa PINTAR seperti ini:** Aturan BOS adalah ranah regulasi; PINTAR tidak boleh menyimpulkannya.

**Bukti / mekanisme di PINTAR:** Tidak ada.

**Sumber:** Tidak ditemukan (dicari: BOS, kuitansi, faktur, SPJ di `docs/`, `src/`). Fakta cetak: `docs/product/SCHOOL-DATA-EXPORT-4.0.md` §A.

**Yang tidak boleh dikatakan:** "Bisa dibayar dengan BOS"; "kami sediakan kuitansi/RAB/dokumen SPJ".

**Status:** PERLU VERIFIKASI HUKUM; kedua: KEBIJAKAN BELUM DIPUTUSKAN — ▲ BELUM DIPUTUSKAN HARI INI
**Tingkat sensitivitas:** TINGGI

---

### Q092 — Kontraknya berapa lama? Bisakah berhenti kapan saja? Apakah harga bisa naik?

**Siapa yang kemungkinan bertanya:** Pengurus yayasan, bendahara
**Kemungkinan ditanya:** TINGGI

**Jawaban singkat:**
"Syarat kontrak belum bisa kami sampaikan karena belum ada ketetapan tertulis yang kami pegang. Yang bisa kami pastikan adalah prinsipnya: data milik sekolah tetap milik sekolah dan PINTAR tidak boleh mempersulit sekolah yang ingin pergi, dengan batas bahwa PINTAR tidak menjanjikan kepemilikan atas data yang secara hukum atau operasional milik pihak lain. Alat untuk mengambil data secara mandiri dan alur keluarnya belum ada di versi 4.0."

**Penjelasan:**
- Durasi, terminasi, dan kenaikan harga: tidak ditemukan.
- Prinsip NO HOSTAGE DATA (D-110(a)): PINTAR tidak boleh memakai hambatan teknis, format tertutup, gesekan kontrak, atau hambatan operasional untuk menahan sekolah. Alur keluar tertib (permintaan → pengakuan → penjelasan status → penyerahan data yang berhak → penjelasan retensi/penghapusan → selesai) hanya ditetapkan sebagai apa yang pada akhirnya harus ada (D-110(d)); alurnya **belum dirancang dan belum dibangun** (D-110(b)).
- Ekspor mandiri adalah kandidat 4.5, belum dijanjikan (D-110(b)). Di 4.0 sekolah hanya bisa mencetak; tim PINTAR pun tidak punya alat untuk mengambil data satu sekolah (SCHOOL-DATA-EXPORT-4.0.md §B).
- D-110(f): keputusan menetapkan perilaku yang wajib, tetapi tidak membuktikan perilaku itu sudah ada.

**Mengapa PINTAR seperti ini:** Sekolah bertahan karena nilai, bukan karena sulit membawa data keluar (D-110).

**Bukti / mekanisme di PINTAR:** Tidak ada alur keluar di kode; hanya cetak laporan dan sertifikat.

**Sumber:**
- MEMBUKTIKAN: `docs/product/SCHOOL-DATA-EXPORT-4.0.md` ringkasan, §A–§D.
- MENETAPKAN ATURAN/RANCANGAN: D-110(a)(b)(d)(f); `docs/rebuild/06-PINTAR-EVIDENCE-AND-TELEMETRY-CONTRACT.md:150-156`; `docs/rebuild/04-PINTAR-STATE-MACHINES.md:112-114`.
- Syarat kontrak: **tidak ditemukan**.

**Yang tidak boleh dikatakan:** "Bisa berhenti kapan saja" tanpa catatan; "data bisa diunduh saat keluar"; "harga tidak akan naik"; durasi kontrak.

**Status:** KEBIJAKAN BELUM DIPUTUSKAN (kontrak/harga); kedua: ROADMAP 4.5 (kandidat) untuk ekspor data — ▲ BELUM DIPUTUSKAN HARI INI
**Tingkat sensitivitas:** TINGGI

---

### Q093 — Apakah bisa tersambung ke Dapodik atau e-Rapor? Nilai di PINTAR harus diketik ulang?

**Siapa yang kemungkinan bertanya:** Operator Dapodik, administrator sekolah
**Kemungkinan ditanya:** TINGGI

**Jawaban singkat:**
"Saat ini PINTAR tidak terhubung ke Dapodik maupun e-Rapor. Jadi kalau Anda perlu memasukkan nilai ke e-Rapor, itu masih dilakukan secara manual dari tampilan di PINTAR. Kami tidak menjanjikan integrasi."

**Penjelasan:** Tidak ditemukan integrasi atau rencana khusus untuk Dapodik/e-Rapor di kode maupun dokumen. Dokumen 09 hanya menyebut "SSO / integrations" sebagai LATER dan sebuah titik batas integrasi yang "belum membangun apa pun". Data siswa masuk hanya lewat unggah berkas pendataan (impor saja), dan tidak ada ekspor hasil: hasil dan bukti hanya tampil di layar (SCHOOL-DATA-EXPORT-4.0.md §C). Yang bisa dilakukan: mencetak ringkasan laporan.

**Mengapa PINTAR seperti ini:** Cakupan 4.0 dibatasi pada perjalanan manusia inti; integrasi dengan sistem pemerintah tidak termasuk.

**Bukti / mekanisme di PINTAR:** Tidak ada integrasi.

**Sumber:** `docs/rebuild/09-PINTAR-V1-SCOPE-BOUNDARIES.md` (FOUNDATION NOW: batas integrasi, nothing built; LATER: SSO/integrations); `docs/product/SCHOOL-DATA-EXPORT-4.0.md` §A, §C. Dicari "dapodik", "e-rapor", "api": tidak ditemukan.

**Yang tidak boleh dikatakan:** "Terhubung ke Dapodik/e-Rapor"; "nilai otomatis masuk e-Rapor"; "ada API".

**Status:** TIDAK DI 4.0 (LATER, tanpa versi dan tanggal)
**Tingkat sensitivitas:** TINGGI

---

### Q094 — Sekolah kami madrasah di bawah Kemenag. Apakah bisa dipakai dengan EMIS, dan apakah isinya sesuai kurikulum madrasah?

**Siapa yang kemungkinan bertanya:** Kepala madrasah
**Kemungkinan ditanya:** SEDANG

**Jawaban singkat:**
"Tidak ada integrasi dengan EMIS, dan kami tidak punya catatan bahwa isi PINTAR sudah disusun untuk kurikulum madrasah. Madrasah dapat memasukkan materi dan soal sendiri, tetapi kami tidak akan mengklaim kesesuaian kurikulum yang belum kami periksa."

**Penjelasan:** EMIS, Kemenag, dan kurikulum madrasah tidak ditemukan di dokumen, kode, migrasi, maupun skrip. Konten yang terbukti ada adalah pelajaran yang diunggah sekolah lewat templat Excel (J4.1) dan satu contoh "Matematika Kelas 5 Bab 1" untuk uji. Konten standar PINTAR yang dikelola pusat sebagai pustaka penuh belum bisa dimasukkan; ketegangan antara M6 dan D-029 masih terbuka (JOURNEY-LOG baris 139).

**Mengapa PINTAR seperti ini:** Konten sekolah dimiliki dan disusun sekolah; PINTAR tidak mengklaim kesesuaian kurikulum tanpa pemeriksaan.

**Bukti / mekanisme di PINTAR:** Unggah templat pelajaran Excel (J4.1; tes DAISY-06-TEMPLAT-01, DAISY-06-UNGGAH-01/02).

**Sumber:** MEMBUKTIKAN: JOURNEY-LOG baris 90, 139. MENETAPKAN ATURAN: SCOPE-INVENTORY J4.1, J4.11; D-007, D-029. Dukungan madrasah/EMIS: **tidak ditemukan**.

**Yang tidak boleh dikatakan:** "Kompatibel dengan EMIS"; "sesuai kurikulum madrasah".

**Status:** TIDAK DI 4.0 (integrasi EMIS tidak ada; kesesuaian kurikulum madrasah tidak ditemukan, G1.3)
**Tingkat sensitivitas:** PENTING

---

### Q095 — Apakah bisa dipakai untuk persiapan ANBK atau asesmen dari pemerintah?

**Siapa yang kemungkinan bertanya:** Kepala sekolah, wakil kepala sekolah
**Kemungkinan ditanya:** SEDANG

**Jawaban singkat:**
"PINTAR tidak punya soal atau simulasi ANBK, dan kami tidak mengklaim selaras dengan ANBK. Yang bisa dilakukan guru adalah membuat latihan dan ujian sendiri di PINTAR dengan soal dari sekolah."

**Penjelasan:** ANBK, AKM, dan asesmen nasional tidak ditemukan di dokumen maupun kode. Yang ada adalah asesmen PINTAR sendiri (Pemetaan Awal, Uji Penguasaan, Uji Cepat) dengan konten dari sekolah, dan sekolah menetapkan batas lulus sendiri (D-081).

**Mengapa PINTAR seperti ini:** Cakupan 4.0 adalah siklus belajar sekolah, bukan simulasi asesmen pemerintah.

**Bukti / mekanisme di PINTAR:** Asesmen yang ada: lihat Q029–Q038.

**Sumber:** SCOPE-INVENTORY J3.8, J5.5, J6; D-081. Kemampuan ANBK: **tidak ditemukan**.

**Yang tidak boleh dikatakan:** "Mempersiapkan ANBK"; "setara/selaras ANBK".

**Status:** TIDAK DI 4.0 (kemampuan khusus ANBK tidak ada; kesesuaian kurikulum: G1.3)
**Tingkat sensitivitas:** PENTING

---

### Q096 — Apakah siswa dan guru bisa masuk dengan akun Google atau Microsoft sekolah kami?

**Siapa yang kemungkinan bertanya:** Bagian IT
**Kemungkinan ditanya:** SEDANG

**Jawaban singkat:**
"Tidak. Siswa masuk dengan Kartu PINTAR dan PIN, guru dan staf dengan email atau nama pengguna dan kata sandi. Masuk dengan akun Google atau Microsoft tidak ada di 4.0, dan kami tidak punya tanggal untuk itu."

**Penjelasan:** Siswa: Kartu PINTAR + PIN adalah satu-satunya model masuk normal; email yang tercatat tidak memberi metode masuk lain (J2.19). Staf: email atau nama pengguna + kata sandi (J2.5). Pembuatan identitas dilakukan sekolah, bukan lewat masuk (tes L2-KONTRAK-01, L2-TIDAK-DIBUAT-01). Tidak ditemukan kode masuk Google/Microsoft/SAML di `src/` maupun migrasi. SSO adalah LATER tanpa versi dan tanggal. Masuk via WhatsApp (#147) dipindahkan keluar dari 4.0; tidak ada jadwal (D-098(c)); itu bukan SSO. Masuk staf dengan kata sandi hanya ada di versi `main`/staging.

**Mengapa PINTAR seperti ini:** Siswa tidak bergantung pada akun email; pemulihan dibantu sekolah, bukan penyedia email (D-085 M2).

**Bukti / mekanisme di PINTAR:** Kartu PINTAR dan masuk staf.

**Sumber:** MEMBUKTIKAN: tes L2-KONTRAK-01, L2-TIDAK-DIBUAT-01 (manifest). MENETAPKAN ATURAN: SCOPE-INVENTORY J2.5, J2.19, §10; `docs/rebuild/09` (LATER: SSO); D-098(c).

**Yang tidak boleh dikatakan:** "Bisa masuk dengan Google/Microsoft"; "SSO segera hadir"; "akan ada SSO" atau "WhatsApp dijadwalkan" (WhatsApp dipindahkan keluar dari 4.0 tanpa jadwal).

**Status:** TIDAK DI 4.0 (LATER, tanpa versi dan tanggal)
**Tingkat sensitivitas:** PENTING

---

### Q097 — Apakah dinas pendidikan atau pengawas bisa melihat data sekolah kami?

**Siapa yang kemungkinan bertanya:** Kepala sekolah, pengawas
**Kemungkinan ditanya:** SEDANG

**Jawaban singkat:**
"Di PINTAR 4.0 tidak ada peran untuk dinas atau pengawas, jadi mereka tidak bisa masuk dan melihat data sekolah Anda. Yang bisa dilakukan sekolah adalah mencetak laporan ringkasan dan menunjukkannya sendiri."

**Penjelasan:** Peran di layar: Guru, Kepala departemen, Dekan, Admin sekolah, Admin platform (D-006). Cakupan Dekan dan Admin sekolah adalah satu sekolah; hanya Admin platform (tim PINTAR) yang melihat semua sekolah. Tidak ditemukan peran atau lingkup lintas sekolah untuk pihak luar. Satu-satunya akses luar adalah verifikasi sertifikat publik yang hanya menampilkan lulus, predikat, institusi, tanggal, dan masa berlaku (tes F04-T10, F04-S05).

**Mengapa PINTAR seperti ini:** Batas tenant adalah institusi (INV-13); data sekolah tidak dibuka ke pihak lain.

**Bukti / mekanisme di PINTAR:** Peran dan cakupan; cetak laporan (SCHOOL-DATA-EXPORT-4.0.md §A).

**Sumber:** MEMBUKTIKAN: tes F04-T10, F04-S05; SCHOOL-DATA-EXPORT-4.0.md §A. MENETAPKAN ATURAN/RANCANGAN: D-006; `docs/rebuild/05-PINTAR-AUTHORIZATION-MATRIX.md`; `docs/rebuild/03-PINTAR-INVARIANTS.md` (INV-13). Peran dinas: **tidak ditemukan**.

**Yang tidak boleh dikatakan:** "Dinas/pengawas bisa melihat dasbor"; "ada peran pengawas".

**Status:** TIDAK DI 4.0 (tidak ada rencana tertulis; tidak ada sumber yang menyebut LATER untuk dinas atau pengawas)
**Tingkat sensitivitas:** TINGGI

---

### Q098 — Fitur yang katanya "akan ada" (misalnya unduh data, portal orang tua), apakah bisa kami tagih? Kapan?

**Siapa yang kemungkinan bertanya:** Pengurus yayasan, kepala sekolah
**Kemungkinan ditanya:** TINGGI

**Jawaban singkat:**
"Yang belum ada hari ini tidak boleh dianggap sebagai janji. Unduh data sekolah adalah kandidat untuk 4.5 dan belum dijanjikan; portal orang tua belum ada di 4.0. Kami tidak menyebut tanggal."

**Penjelasan:**
- Unduh data: kandidat 4.5 "sampai dirancang dan disetujui terpisah"; prinsip ditetapkan di D-110, fiturnya belum.
- Portal orang tua: "parent experience" LATER, tanpa versi dan tanggal; tidak ada peran orang tua di kode.
- Hal lain yang disebut sumber: masuk lewat WhatsApp dipindahkan keluar dari 4.0; tidak ada jadwal (D-098(c)). Tinjauan arsitektur (Horizon Review, bukan keputusan) menyebut ide-ide 4.5/5.0; tidak ada yang sudah ditiket atau dibangun.
- Tidak ditemukan komitmen kontraktual atau jadwal untuk fitur mana pun. Apakah sebuah roadmap boleh ditagih adalah soal kontrak (belum diputuskan).

**Mengapa PINTAR seperti ini:** Aturan: jangan mencampur roadmap dengan yang sudah tersedia; "kandidat" bukan "akan ada".

**Bukti / mekanisme di PINTAR:** Tidak ada (bukan fitur yang sudah ada).

**Sumber:** MENETAPKAN ATURAN: D-110(b); D-098(c); `docs/rebuild/09` (LATER: parent experience). Rancangan: `docs/reports/ARCHITECTURE-HORIZON-REVIEW-2026-09-29.md` §7 (tinjauan, bukan keputusan). Fakta: SCHOOL-DATA-EXPORT-4.0.md.

**Yang tidak boleh dikatakan:** tanggal rilis; "pasti ada"; "bisa ditagih"; "portal orang tua segera".

**Status:** ROADMAP 4.5 (kandidat) untuk unduh data; TIDAK DI 4.0 (LATER, tanpa versi) untuk portal orang tua; kebijakan "tagih/tanggal" = KEBIJAKAN BELUM DIPUTUSKAN — ▲ BELUM DIPUTUSKAN HARI INI
**Tingkat sensitivitas:** TINGGI

---

### Q099 — Kalau PINTAR berubah tampilan atau cara kerjanya di tengah tahun ajaran, bagaimana kami diberi tahu?

**Siapa yang kemungkinan bertanya:** Administrator sekolah, guru
**Kemungkinan ditanya:** SEDANG

**Jawaban singkat:**
"Pada versi yang sudah dibangun dan diuji (belum di produksi), pemeliharaan terjadwal dapat menampilkan pemberitahuan di layar sebelum mulai. Untuk perubahan tampilan atau cara kerja, kami belum punya kebijakan pemberitahuan atau catatan rilis untuk sekolah yang bisa kami janjikan."

**Penjelasan:**
- Pemeliharaan terjadwal dan pengumuman terbatas (#148) sudah dibangun di versi `main`/staging: Admin sekolah untuk sekolahnya, Admin platform untuk sekolah terpilih atau semuanya; pemberitahuan di layar pada T-60/30/15 menit, mulai asesmen baru ditolak dari T-15, sesi yang berjalan dibiarkan selesai (D-094, D-100(b)(c); tes M148-K01, M148-S01, M148-D01, M148-D02).
- **Produksi saat ini masih menjalankan build lama (111 migrasi)** sementara `main` dan staging 162; jadi fitur ini tidak terbukti ada di produksi (RESUME-2026-10-06).
- Pengumuman bukan sistem pesan umum (D-094(b)). Tidak ditemukan catatan rilis "apa yang baru" untuk sekolah, kebijakan pemberitahuan perubahan antarmuka, atau komitmen waktu. RELEASES.md adalah log internal koordinator.
- Konflik sumber: D-094 (2 Okt) menyatakan belum diimplementasi; JOURNEY-LOG item 29 dan tes M148 menyatakan sudah dibangun (5 Okt). Yang lebih baru dan berbukti kode berlaku.

**Mengapa PINTAR seperti ini:** Tidak ada sesi yang boleh terputus diam-diam saat ujian; pemeliharaan harus terlihat.

**Bukti / mekanisme di PINTAR:** `src/components/pemeliharaan/*`, `src/app/konfigurasi/actions.ts`, migrasi `20261120100000`.

**Sumber:** MEMBUKTIKAN: tes M148-K01/S01/D01/D02; JOURNEY-LOG baris 229 (item 29). MENETAPKAN ATURAN: D-094, D-100(b)(c). Status produksi: RESUME-2026-10-06. Kebijakan catatan rilis: **tidak ditemukan**.

**Yang tidak boleh dikatakan:** "Anda selalu diberi tahu sebelum ada perubahan"; "ada catatan rilis untuk sekolah"; "pemberitahuan lewat SMS/WhatsApp/email".

**Status:** SEBAGIAN (pemeliharaan di `main`/staging, belum terbukti di produksi); kedua: KEBIJAKAN BELUM DIPUTUSKAN (pemberitahuan perubahan tampilan) — ▲ BELUM DIPUTUSKAN HARI INI
**Tingkat sensitivitas:** NORMAL

---

### Q100 — Setelah presentasi: "Apa yang paling mungkin salah dari PINTAR, dan apa yang Anda lakukan kalau itu terjadi pada kami?"

**Siapa yang kemungkinan bertanya:** Orang yang diam selama presentasi lalu mengajukan satu pertanyaan sulit
**Kemungkinan ditanya:** SEDANG

**Jawaban singkat:**
"Yang paling mungkin bermasalah, menurut catatan kami sendiri: kapasitas saat banyak siswa mulai bersamaan, dan pemulihan data kalau terjadi masalah besar. Keduanya belum lulus uji kami, dan kami akan menjelaskan apa adanya. Pada versi yang sudah dibangun dan diuji (belum di produksi), guru atau admin yang menghadapi masalah di kelas bisa menekan «Laporkan masalah» dan melihat statusnya."

**Penjelasan:** Daftar keterbatasan nyata menurut bukti (bukan peringkat resmi):
1. Kapasitas: pada 1.000 siswa bersamaan, konfigurasi saat ini jenuh; aman hanya terbukti pada 50 (Q088). Gelombang masuk dengan kartu belum diuji (CAP-01).
2. Cadangan dan pemulihan (#150) belum lulus: pemulihan dapat kehilangan hingga 24 jam data, pemulihan ke titik waktu tidak aktif (D-103); salinan independen di luar penyedia utama dibangun tetapi belum aktif; berkas Storage tidak ikut pemulihan bawaan; kunci kriptografi belum ber-escrow; pemulihan bergantung pada satu administrator platform (lihat Q070–Q072, Q085).
3. Email masuk staf: di `main`, email yang ditolak tidak lagi tampil sebagai terkirim (JOURNEY-LOG:181 butir 23; D-098(c)); perilaku lama masih ada di produksi.
4. Konten: penerbitan bab sempat tertahan peringatan miskonsepsi palsu (item 13); konten standar PINTAR belum bisa masuk sebagai pustaka (M6 vs D-029).
5. Ekspor dan keluar data belum ada; retensi/penghapusan belum dibangun (OD-5).
Jika masalah terjadi pada sekolah: staf menekan «Laporkan masalah» (halaman, peran, sekolah, build, dan perangkat terlampir otomatis; status Diterima → Ditangani → Selesai). Tier 1 adalah admin sekolah dan tim operasi PINTAR; Tier 2 koordinator. Siswa memberi tahu gurunya (tidak punya formulir). Target D-037: laporan yang menghentikan kelas dijawab pada hari sekolah yang sama (WIB), lainnya dalam satu hari sekolah. **Ini target keputusan, bukan SLA mengikat.** Dukungan di luar jam sekolah tidak ditemukan.
- Dokumen 12 (mode kegagalan) adalah pre-mortem pencegahan, bukan catatan insiden; jangan disajikan sebagai kejadian.

**Mengapa PINTAR seperti ini:** Kepercayaan dibangun dengan mengatakan keterbatasan sebelum ditanya.

**Bukti / mekanisme di PINTAR:** «Laporkan masalah» (migrasi `20261119100000`; tes BOB15-K01/S01/D01; JOURNEY-LOG item 28) berada di `main`/staging; produksi belum terbukti (build 111).

**Sumber:** MEMBUKTIKAN: JOURNEY-LOG baris 97–98, item 13, 14, 28; tes BOB15-*. MENETAPKAN ATURAN: D-037, D-103–D-109. Rancangan: `docs/rebuild/12-PINTAR-FAILURE-MODES.md`. Kondisi: RESUME-2026-10-06; BACKUP-DR-REVIEW-2026-10-05; CLOSURE-PLAN-150.

**Yang tidak boleh dikatakan:** "Tidak ada risiko besar"; "backup sudah terjamin/siap produksi"; "#150 sudah lulus" atau "GREEN" (D-111 bukan lulus); "SLA 24 jam"; "kami pulihkan data dalam X jam" (waktu pulih produksi tidak diketahui); "berkas/foto tidak akan hilang"; "sinyal integritas menuduh siswa".

**Status:** SEBAGIAN
**Tingkat sensitivitas:** KRITIS

---


---

## PERTANYAAN YANG PINTAR BELUM DAPAT JAWAB DENGAN YAKIN

Bagian ini adalah salah satu hasil terpenting dokumen. Tanda **▲ BELUM DIPUTUSKAN HARI INI** pada sebuah pertanyaan di atas berarti jawaban yang jujur hari ini adalah "belum diputuskan" (status utama atau kedua = KEBIJAKAN BELUM DIPUTUSKAN). FIONA tidak menyelesaikan gap ini sendiri dan tidak membuat keputusan baru.

Pemutus yang mungkin: **pemilik produk**, **tim teknis**, **penasihat hukum**.

### G1. Keputusan produk

| Gap | Pertanyaan | Apa yang perlu diputuskan atau diperiksa | Siapa |
|---|---|---|---|
| G1.1 | Q003, Q004, Q088, Q090 | Kohort D-035 (1 November dan 1 Desember) **bukan lagi komitmen jadwal**; D-083 yang berlaku, dan keduanya tetap terbuka sampai PRODUCTION READY (D-112(d)). Hasil uji beban L1 yang gagal (D-089) tetap terlihat tersendiri. Tingkat komputasi produksi (CAP-08) dan apakah "50 siswa serentak" menjadi batas penerimaan resmi masih terbuka. | Pemilik produk |
| ▲ G1.2 | Q032, Q034 | Percobaan kedua Uji Penguasaan: tinjauan menampilkan benar atau salah beserta penjelasan, dan percobaan kedua menarik soal bertanda yang sama. **Ditahan untuk keputusan produk (D-112(b))**: bisa disengaja secara pedagogis, tetapi harus disengaja. Tidak ada yang berubah sekarang. | Pemilik produk |
| G1.3 | Q006, Q062 | Siapa menyiapkan dan menyetujui konten standar PINTAR dan jalur pengisian pustaka pusat (M6 vs D-029; G2/CF11). | Pemilik produk |
| G1.4 | Q007, Q094, Q095 | Apakah isi PINTAR akan dipetakan ke capaian pembelajaran Kurikulum Merdeka, kurikulum madrasah, atau ANBK; saat ini tidak ada klaim. | Pemilik produk |
| G1.5 | Q024 | Pilihan alasan «lupa PIN» di layar penerbitan ulang kartu (D-099 menyebutnya, layar hanya "hilang/rusak"); layar koreksi email salah (J2.21). | Pemilik produk |
| G1.6 | Q034, Q036, Q079 | Layar guru untuk memperpanjang waktu satu siswa dan jalur resmi percobaan tambahan; akomodasi siswa berkebutuhan khusus. | Pemilik produk |
| G1.7 | Q045, Q074 | Layar koreksi nama, layar pencabutan sertifikat, jalur penerbitan ulang sertifikat; koreksi nilai oleh sekolah dan **jalur banding nilai oleh orang tua** (keduanya saat ini tidak ada). | Pemilik produk |
| G1.8 | Q044, Q045 | Domain verifikasi kanonik dan format nomor sertifikat (D-080(2)(8)) vs kode; penyegelan nama sekolah dan bahasa (J8.3, BOB-48/DAISY-36). | Pemilik produk |
| G1.9 | Q059 | Foto profil siswa: layar belum ada; penerbit sertifikat masih menyalin jalur foto (bertentangan dengan T4). | Pemilik produk |
| G1.10 | Q053 | Alur banding/hak membela diri atas sinyal integritas; pemberitahuan siswa/orang tua; cakupan baca sinyal. | Pemilik produk |
| G1.11 | Q073 | Reaktivasi Kelas yang salah dinonaktifkan (D-022); jejak audit lengkap (pelaku dan alasan) di layar. | Pemilik produk |
| G1.12 | Q022, Q075 | Penonaktifan akun staf, serah-terima kelas, pindah sekolah staf (D-049(d)); status lulus/alumni; **ekspor catatan saat siswa pindah ke sekolah non-PINTAR (doc 04 §3c; hanya dirancang)**. | Pemilik produk |
| G1.13 | Q013, Q012, Q014 | Tingkat yayasan/multi-unit; impor staf massal dan .xlsx langsung untuk siswa; migrasi dari sistem lain. | Pemilik produk |
| G1.14 | Q093, Q094, Q096, Q097, Q040 | Integrasi Dapodik/e-Rapor: tidak ada keputusan. SSO: LATER tanpa versi dan tanggal. EMIS, peran dinas/pengawas: tidak ada sumber yang menyebutnya (bahkan sebagai LATER). | Pemilik produk |
| G1.15 | Q021, Q060 | Apakah «Umpan balik kelas» (B1) masuk lingkup 4.0 (SCOPE-INVENTORY §11). | Pemilik produk |
| ▲ G1.16 | Q099 | Catatan rilis dan kebijakan pemberitahuan perubahan produk ke sekolah (selain pemberitahuan pemeliharaan, yang hanya ada di `main`/staging). | Pemilik produk |

### G2. Keputusan kebijakan  (▲ = jawaban hari ini "belum diputuskan"; juga dipakai untuk aspek tertentu dari pertanyaan berstatus SEBAGIAN, misalnya SLA pada Q086)

| Gap | Pertanyaan | Apa yang perlu diputuskan | Siapa |
|---|---|---|---|
| ▲ G2.1 | Q090, Q091, Q092 | Harga, cara bayar, uji coba, dokumen pertanggungjawaban BOS, lama kontrak, terminasi, kenaikan harga. Isi MOU memuat harapan 150 sekolah × 400 siswa (D-031); para pihaknya tidak disebut. | Pemilik produk (dengan penasihat hukum) |
| ▲ G2.2 | Q061, Q075, Q082 | **Model hak atas data (D-112(e)):** bukan kontradiksi antara D-110 dan dokumen 02/06, tetapi perlu model. D-110 adalah prinsip, bukan klaim bahwa sekolah memiliki setiap data tentang seseorang. Untuk 4.5 diklasifikasikan: data institusional sekolah, data portabel siswa, data kontekstual bersama, bukti operasional dan keamanan PINTAR, dan catatan yang wajib disimpan menurut hukum. | Pemilik produk + penasihat hukum |
| ▲ G2.3 | Q062, Q050, Q006 | Kepemilikan dan lisensi konten buatan guru; berbagi antar sekolah. (Lisensi bahan kementerian: lihat G4.2.) | Pemilik produk + penasihat hukum |
| ▲ G2.4 | Q057, Q040 | Pernyataan resmi tentang iklan, penjualan, riset, pelatihan model, dan pemakaian data agregat/perbandingan antar sekolah. | Pemilik produk + penasihat hukum |
| ▲ G2.5 | Q081, Q083, Q080 | Retensi (OD-5: durasi hukum terbuka), penghapusan, anonimisasi, kedaluwarsa cadangan, proses hak subjek data. | Pemilik produk + penasihat hukum |
| ▲ G2.6 | Q063, Q064, Q082 | Alur keluar sekolah (D-110(d) hanya menetapkan apa yang pada akhirnya harus ada), format ekspor, biaya, izin, apakah sertifikat tetap dapat diverifikasi setelah keluar; ekspor mandiri baru kandidat 4.5. | Pemilik produk |
| ▲ G2.7 | Q084 | Rencana jika perusahaan yang mengoperasikan PINTAR tutup. | Pemilik produk |
| ▲ G2.8 | Q055 | Kebijakan akses staf PINTAR ke data siswa dan pencatatan akses-baca. | Pemilik produk |
| ▲ G2.9 | Q049, Q055 | **Kebijakan akses dan pengungkapan alat berbantuan AI:** siapa, lingkungan dan data mana, untuk tujuan apa, dengan audit dan minimisasi apa; sebelum sekolah nyata (D-112(a)). | Pemilik produk + penasihat hukum |
| ▲ G2.10 | Q067 | Prosedur insiden/kebocoran dan pemberitahuan ke sekolah. | Pemilik produk + penasihat hukum |
| ▲ G2.11 | Q086, Q024 | Dukungan: SLA mengikat, jam dukungan, kanal darurat saat ujian (D-037 hanya target internal). | Pemilik produk |
| ▲ G2.12 | Q015 | Pelatihan guru: siapa, bahan, jadwal. | Pemilik produk |
| ▲ G2.13 | Q050, Q047 | Tanggung jawab kontraktual bila AI atau konten keliru; sikap resmi "tidak menggantikan guru". | Pemilik produk + penasihat hukum |
| ▲ G2.14 | Q075 | OD-9: persetujuan transfer (orang tua/wali, pengirim tidak responsif atau bukan pelanggan). | Pemilik produk + penasihat hukum |
| ▲ G2.15 | Q098 | Apakah fitur roadmap boleh "ditagih" dan bagaimana berkomunikasi tentangnya. | Pemilik produk |
| ▲ G2.16 | Q078 | Apakah PINTAR menyediakan mekanisme persetujuan orang tua atas data anak, atau itu sepenuhnya kewajiban sekolah. | Pemilik produk + penasihat hukum |

### G3. Verifikasi teknis

| Gap | Pertanyaan | Apa yang perlu diperiksa | Siapa |
|---|---|---|---|
| G3.1 | Hampir semua kelompok | **Produksi masih di build `5b5b68d` (111 migrasi); `main`/staging 162.** Setiap "TERSEDIA" berarti di `main`/staging. Penerapan produksi diblokir sampai O2 selesai (penjaga DR-S04/S05), jadi produksi tidak bisa menerima versi baru sebelum itu. Perlu daftar fitur yang belum ada di produksi (tanpa menyebut tanggal kepada sekolah). | Tim teknis |
| G3.2 | Q088 | CAP-01 (gelombang masuk kartu), L2–L5, CAP-09/10 belum dijalankan; CAP-07 PARTIAL; CAP-02 gagal pada konfigurasi sekarang. | Tim teknis |
| G3.3 | Q025 | Pengukuran kuota dan uji di HP sungguhan. | Tim teknis |
| G3.4 | Q032 | Uji kotak-hitam: kunci jawaban tidak terbaca dengan identitas siswa lewat REST selama pengerjaan. | Tim teknis |
| G3.5 | Q053 | Cakupan baca sinyal integritas di database (seluruh sekolah) vs rujukan per departemen. | Tim teknis |
| G3.6 | Q065, Q066 | Header keamanan HTTP; ketahanan penyimpanan PIN dan kata sandi. Rincian: tim teknis (tidak dimuat di dokumen ini). | Tim teknis |
| G3.7 | Q075 | Apakah siswa dengan enrolmen berakhir masih bisa masuk dan membuka sertifikatnya. | Tim teknis |
| G3.8 | Q035, Q036 | Perilaku simpanan lokal jawaban yang belum terkirim di perangkat bersama; melanjutkan sesi ujian di perangkat lain. | Tim teknis |
| G3.9 | Q034 | Percobaan kedua Uji Penguasaan berjalan ujung-ke-ujung dan percobaan mana yang dihitung. | Tim teknis |
| G3.10 | Q049, Q048 | Verifikasi runtime/log jaringan bahwa produk tidak mengirim data ke penyedia AI. | Tim teknis |
| G3.11 | Q060 | Pemeriksaan penuh tidak ada jalur pesan/kontak dari luar. | Tim teknis |
| G3.12 | Q070, Q071, Q072 | #150: salinan independen (O3–O7), escrow dan kustodian, runbook pemulihan, pemulihan Storage, waktu pulih skala produksi. D-111 adalah GREEN untuk melanjutkan persiapan, bukan lulus. | Tim teknis + pemilik produk |
| G3.13 | Q071 | D-103(c): RPO dan PITR ditinjau ulang paling lambat sebelum ujian sekolah nyata. | Pemilik produk + tim teknis |
| G3.14 | Q071 | B7: pemantauan produksi (watch) masih mati. | Tim teknis |
| G3.15 | Q079 | Uji aksesibilitas dengan alat bantu (pembaca layar, WCAG); saat ini hanya tes komponen tertentu. | Tim teknis |

### G4. Verifikasi hukum / compliance

| Gap | Pertanyaan | Apa yang perlu diperiksa | Siapa |
|---|---|---|---|
| G4.1 | Q002 | Badan hukum: apakah nama di footer benar dan menjadi pihak kontrak; susunan kepemilikan. | Penasihat hukum |
| G4.2 | Q006, Q007 | **Lisensi dan hak pakai bahan kementerian** (buku panduan guru untuk sembilan buku kerja SD5; buku siswa untuk Geografi XI dan Matematika X) harus diverifikasi sebelum distribusi ke sekolah nyata (D-112(c)); "diadaptasi dari" bukan izin. | Penasihat hukum |
| G4.3 | Q089 | Status UU PDP, pendaftaran PSE di Komdigi, peran pengendali/pemroses, perjanjian pemrosesan data. | Penasihat hukum |
| G4.4 | Q058, Q049 | Konsekuensi hukum data disimpan di Singapura dan pemroses pihak ketiga. | Penasihat hukum |
| G4.5 | Q078 | Apakah izin orang tua diperlukan untuk data anak, dan siapa yang meminta. | Penasihat hukum |
| G4.6 | Q080, Q081, Q083 | Hak subjek data dan durasi retensi menurut hukum. | Penasihat hukum |
| G4.7 | Q067 | Kewajiban pemberitahuan kebocoran. | Penasihat hukum |
| G4.8 | Q091 | Apakah layanan dapat dibayar dengan dana BOS. | Penasihat hukum |
| G4.9 | Q043 | Pengakuan sertifikat oleh dinas, kementerian, sekolah lain; makna "resmi". | Penasihat hukum |
| G4.10 | Q050 | Tanggung jawab bila AI atau konten keliru. | Penasihat hukum |

### G5. Kebutuhan evidence tambahan dan tindakan pemilik

| Gap | Pertanyaan | Bukti atau tindakan yang belum ada | Siapa |
|---|---|---|---|
| G5.1 | Q003, Q009 | Sekolah pengguna nyata, referensi, bukti dampak. | Pemilik produk |
| G5.2 | Q017 | Uji kegunaan dengan guru nyata. | Pemilik produk / tim UX |
| G5.3 | Q006, Q007 | Tinjauan pakar mata pelajaran atas konten standar; pemetaan CP. | Pemilik produk |
| G5.4 | Q065 | Audit/uji penetrasi pihak luar; sertifikasi keamanan. | Pemilik produk + tim teknis |
| G5.5 | Q085, Q072 | Pelaksanaan yang sudah diputuskan wajib (D-001, D-054(e), D-106(d), D-109(c), D-111(b)): penunjukan administrator dan kustodian kedua (O9), latihan break-glass (C-11), restore produksi dan waktu pulih. | Pemilik produk + tim teknis |
| G5.6 | Q010 | Waktu nyata onboarding sekolah. | Pemilik produk |
| G5.7 | Q086, Q087 | Uji manusia untuk «Laporkan masalah» (J10); saat ini hanya tes dan CI. | Pemilik produk / tim UX |

### Konflik antar sumber yang ditemukan (belum diselesaikan oleh dokumen ini)

- D-035 (kohort) vs D-083 vs D-089: kohort bukan lagi komitmen jadwal (D-112(d)); lihat G1.1 (Q088, Q004).
- Dokumen 05 (rancangan) vs kode/tes soal hak baca guru atas sinyal integritas, jawaban mentah, dan peran Dekan/Admin sekolah (Q021, Q053, Q055, Q076).
- SCOPE-INVENTORY J8.8 ("4.0 menyediakan" foto profil) vs JOURNEY-LOG baris 137 (Q059).
- D-080(2)(8) vs kode (domain dan format nomor sertifikat) (Q044).
- D-094 ("belum diimplementasi") vs JOURNEY-LOG butir 29 (sudah dibangun) (Q099).
- PHASE-1-STATUS dan RELEASE-CHECKLIST (REL-13) vs JOURNEY-LOG butir 28 dan tes BOB15 (Q086).
- JOURNEY-LOG butir terbuka 6/11/17 vs entri 25/26 dan D-096 (Q024, Q026, Q035).
- D-009 vs D-085 T1/D-055 (Q026).
- D-033(c) vs D-082(a) (Q066).
- doc 08 (intervensi pada siswa aktif) vs F05-T14 (Q031).
- Dokumen koordinasi tidak konsisten tentang pemegang peran; dirapikan koordinator.
- Hak atas data: bukan konflik antara D-110 dan dokumen 02/06, tetapi memerlukan model hak atas data (D-112(e); G2.2).


---

## Glosarium — istilah internal → kata yang dipakai kepada sekolah

| Istilah internal | Kata kepada sekolah | Catatan |
|---|---|---|
| SYSTEM_ADMIN / platform admin | Admin platform (tim operasi PINTAR) | Satu-satunya peran staf PINTAR di dalam aplikasi. |
| INSTITUTION_ADMIN | Admin sekolah | |
| HEAD_OF_DEPARTMENT | Kepala departemen | Layar memakai «lingkup» untuk cakupan (D-068). |
| DEAN | Dekan | Hanya baca; tidak ada kemampuan Studio. |
| Kepala sekolah | (bukan peran di PINTAR) | Taksonomi desain, bukan peran (D-059(c)). Sekolah memberi peran sesuai kebutuhan. |
| Tenant / institusi | Sekolah | Batas data adalah sekolah (INV-13). |
| Org tree: Faculty/Department/Programme/Cohort/Class | Bagian, Tingkat, Kelas | Jenjang dan Reguler tersembunyi (D-006, D-027). |
| Class card / Kartu kelas / PINTAR card | Kartu PINTAR | Siswa masuk dengan kartu dan PIN; staf punya Kartu Digital. |
| PINTAR ID | PINTAR ID | Permanen dan global (D-059(a)). |
| Pre-test / post-test | Pemetaan Awal / Uji Penguasaan | Di buku kerja ditandai «Pemetaan awal» dan «Cek penguasaan» (D-008). |
| Quick quiz | Uji Cepat | D-015. |
| Mastery target / pass mark | Batas ketuntasan | Ditetapkan Admin sekolah, tersegel (D-081). |
| Official evidence | Bukti resmi | Hanya bukti OFFICIAL masuk laporan (INV-20). |
| Integrity signal | Sinyal integritas / bahan pertimbangan manusia | Bukan tuduhan dan tidak mengubah skor. |
| Question Health | Catatan mutu soal | Observasi, ditinjau manusia. |
| Release (PLP release) | Rilis pelajaran | Pengalaman belajar terikat rilis yang dialami. |
| Studio | Studio | Tempat menyusun, meninjau, menerbitkan konten. |
| Workbook | Buku kerja pelajaran (Excel) | Satu kursus per berkas; lima lembar. |
| RLS / row-level security | Aturan akses di database | Jangan dijelaskan lebih teknis dari perlu. |
| Kunci server / rahasia kriptografis | Rahasia server | Tidak pernah ada di sisi pengguna; detail teknis: tim teknis. |
| Audit log | Jejak audit | Hanya-tambah; layar menampilkan 50 baris terakhir. |
| Break-glass | Prosedur darurat pemulihan akses | Dokumen dan uji wajib sebelum produksi (D-054(e)). |
| RPO | Berapa banyak data yang bisa hilang | Sementara: sampai 24 jam (D-103). |
| RTO | Berapa lama pulih | Skala produksi belum diketahui. |
| PITR | Pemulihan ke titik waktu tertentu | Tidak aktif (D-103). |
| #150 | Pekerjaan backup dan pemulihan | NOT PASS; gerbang PRODUCTION READY. |
| ENGINEERING COMPLETE | Rekayasa selesai | Bukan "siap produksi". |
| PRODUCTION READY | Siap dipakai sekolah nyata di produksi | Belum tercapai. |
| Staging | Lingkungan uji | Data sintetis. |
| Golden School | Sekolah uji | Orang fiktif; bukan sekolah nyata. |
| PARK / LATER | Tidak dikerjakan di 4.0 | LATER bukan roadmap bernomor versi. |
| Kandidat 4.5 | "Sedang dipertimbangkan, belum dijanjikan" | Jangan "akan ada"; jangan tanggal. |
| NO HOSTAGE DATA (D-110) | "Data sekolah adalah milik sekolah" | Prinsip, bukan fitur yang sudah ada. |
| «Laporkan masalah» | Laporkan masalah | Untuk staf; status Diterima → Ditangani → Selesai. |
| Tier 1 / Tier 2 | Admin sekolah dan tim operasi / koordinator | D-037. |


---

## Ringkasan (dihitung ulang pada putaran 1C)

### Jumlah pertanyaan per status utama

| Status utama | Jumlah |
|---|---|
| TERSEDIA DI 4.0 (main/staging; belum di produksi) | 14 |
| SEBAGIAN | 42 |
| DIBANGUN, BELUM AKTIF | 0 |
| TIDAK DILAKUKAN PINTAR | 4 |
| TIDAK DI 4.0 | 9 |
| ROADMAP | 1 |
| KEBIJAKAN BELUM DIPUTUSKAN | 13 |
| PERLU VERIFIKASI TEKNIS | 11 |
| PERLU VERIFIKASI HUKUM | 6 |
| **Total** | **100** |

Catatan: status kedua (misalnya DIBANGUN, BELUM AKTIF atau ROADMAP 4.5 kandidat) tidak dihitung di tabel ini. "TIDAK DI 4.0" mencakup PARK dan LATER tanpa versi dan tanggal, serta hal yang tidak ada dan tidak ada rencana tertulisnya. Pertanyaan yang jawabannya hari ini "belum diputuskan" (status utama atau kedua = KEBIJAKAN BELUM DIPUTUSKAN, ditandai ▲): 21 pertanyaan: Q015, Q032, Q040, Q049, Q050, Q055, Q057, Q061, Q062, Q064, Q067, Q078, Q080, Q081, Q083, Q084, Q090, Q091, Q092, Q098, Q099.

### Jumlah pertanyaan per tingkat sensitivitas

| Sensitivitas | Jumlah |
|---|---|
| KRITIS | 35 |
| TINGGI | 32 |
| PENTING | 28 |
| NORMAL | 5 |
| **Total** | **100** |

**Pembacaan singkat:** hanya 14 dari 100 pertanyaan berstatus TERSEDIA DI 4.0, dan semuanya hanya berlaku di `main`/staging, belum di produksi. Pertanyaan KRITIS (35) mengelompok pada privasi data anak, kehilangan data, keluar dari PINTAR, dan hukum; di sanalah jawaban jujur paling sering berbunyi "belum diputuskan", "tidak ada", atau "perlu verifikasi hukum". Dokumen ini INTERNAL.

## Lampiran — pemetaan nomor tinjauan 1A → nomor akhir

| Nomor akhir | Nomor lama (1A) | Catatan |
|---|---|---|
| Q001 | 1 |  |
| Q002 | 2 |  |
| Q003 | 3 | menggabungkan lama 100 |
| Q004 | 4 |  |
| Q005 | 5 |  |
| Q006 | 6 | menggabungkan lama 48 |
| Q007 | 7 |  |
| Q008 | 8 |  |
| Q009 | 9 |  |
| Q010 | 10 |  |
| Q011 | 11 |  |
| Q012 | 12 |  |
| Q013 | 13 |  |
| Q014 | 14 |  |
| Q015 | 15 |  |
| Q016 | 16 |  |
| Q017 | 17 | rumusan diperluas |
| Q018 | 18 |  |
| Q019 | 19 |  |
| Q020 | 20 |  |
| Q021 | N2 | pertanyaan baru |
| Q022 | 21 |  |
| Q023 | 22 |  |
| Q024 | 23 |  |
| Q025 | 24 |  |
| Q026 | 25 |  |
| Q027 | 26 |  |
| Q028 | 27 |  |
| Q029 | 28 |  |
| Q030 | 29 |  |
| Q031 | 30 |  |
| Q032 | 31 |  |
| Q033 | 32 |  |
| Q034 | 33 |  |
| Q035 | 34 |  |
| Q036 | 35 |  |
| Q037 | 36 |  |
| Q038 | 37 |  |
| Q039 | 38 |  |
| Q040 | N7 | pertanyaan baru |
| Q041 | 39 | menggabungkan lama 95 |
| Q042 | 40 |  |
| Q043 | 41 |  |
| Q044 | 42 |  |
| Q045 | 43 |  |
| Q046 | 44 |  |
| Q047 | N3 | pertanyaan baru |
| Q048 | 45 | menggabungkan lama 49 |
| Q049 | 46 |  |
| Q050 | 47 |  |
| Q051 | 50 |  |
| Q052 | 51 |  |
| Q053 | 52 |  |
| Q054 | 53 |  |
| Q055 | 54 |  |
| Q056 | 55 |  |
| Q057 | 56 |  |
| Q058 | 57 |  |
| Q059 | 58 |  |
| Q060 | N6 | pertanyaan baru |
| Q061 | 59 |  |
| Q062 | N5 | pertanyaan baru |
| Q063 | 60 |  |
| Q064 | 61 |  |
| Q065 | 62 |  |
| Q066 | 63 |  |
| Q067 | N4 | pertanyaan baru |
| Q068 | 64 |  |
| Q069 | 65 |  |
| Q070 | 66 | menggabungkan lama 69 |
| Q071 | 67 |  |
| Q072 | 68 |  |
| Q073 | 70 |  |
| Q074 | 71 | rumusan diperluas |
| Q075 | 72 | rumusan diperluas |
| Q076 | 73 |  |
| Q077 | 74 |  |
| Q078 | 75 |  |
| Q079 | 76 |  |
| Q080 | 77 |  |
| Q081 | 78 |  |
| Q082 | 79 |  |
| Q083 | 80 |  |
| Q084 | 81 |  |
| Q085 | N1 | pertanyaan baru |
| Q086 | 82 |  |
| Q087 | 83 |  |
| Q088 | 84 | menggabungkan lama 98 |
| Q089 | 85 | menggabungkan lama 86 |
| Q090 | 87 | rumusan diperluas |
| Q091 | 88 |  |
| Q092 | 89 |  |
| Q093 | 90 |  |
| Q094 | 91 |  |
| Q095 | 92 |  |
| Q096 | 93 |  |
| Q097 | 94 |  |
| Q098 | 96 |  |
| Q099 | 97 |  |
| Q100 | 99 |  |

Nomor lama yang dilepas karena digabung: 100 → Q003, 98 → Q088, 69 → Q070, 86 → Q089, 49 → Q048, 48 → Q006, 95 → Q041.
