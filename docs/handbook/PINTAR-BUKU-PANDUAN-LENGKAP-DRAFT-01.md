# PINTAR
## Buku Panduan Lengkap

### Memahami, memakai, dan bertumbuh bersama PINTAR — dari 4.0 hingga 5.0

**Draf 01a · 17 November 2026**
**Untuk ditinjau pemilik. Belum disetujui, belum untuk dibagikan ke sekolah.**

Disusun berdasarkan *PINTAR Consolidated Roadmap 4.0–5.0, Revisi 3 (16 November 2026), termasuk koreksi daftar 4.2 pada Revisi 3.1*, Terminologi PINTAR v1, dan teks layar PINTAR yang berlaku saat penyusunan.

PT ZAYD PINTAR SELALU (ZPS)

---

## Catatan untuk peninjau draf

Bagian ini akan dihapus sebelum buku diterbitkan.

1. **Status fitur.** Setiap fitur diberi tanda versi dan status (lihat Bab 2). Pada saat draf ini ditulis, layanan yang dipakai sekolah (produksi) masih memakai versi September 2026 dan belum menerima 4.0 maupun 4.1. Fondasi PINTAR 4.0 sudah selesai dan diuji di lingkungan uji (*staging*). PINTAR 4.1 sedang dikembangkan; bagian pertamanya sudah diterima di lingkungan uji. Versi 4.2, 4.5, dan 5.0 masih berupa rencana atau arah. Buku ini menjelaskan pengalaman yang dituju untuk setiap versi. Buku ini **tidak** menyatakan bahwa suatu fitur sudah dapat dipakai sekolah.
2. **Istilah.** Buku ini mengikuti Terminologi PINTAR v1 yang dipakai di layar: *murid* (bukan siswa atau peserta didik), *Guru*, *Sekolah*, *Admin sekolah*, *Admin PINTAR*, dan sapaan *Anda*. Peran yang disebut dalam penugasan sebagai "Pimpinan Sekolah", "Peninjau Materi", dan "Fasilitator Pengembangan Profesional" bukan peran sistem tersendiri. Buku ini menjelaskannya sebagai tanggung jawab yang dipegang oleh peran yang ada (Bab 4).
3. **Teks layar.** Kata dalam tanda «…» adalah teks layar PINTAR 4.0/4.1 sebagaimana tercatat saat penyusunan. Sebagian teks masih dapat berubah sebelum rilis.
4. **Tanda [Perlu konfirmasi: …]** menandai hal yang belum dapat dipastikan dari sumber. Daftar lengkapnya ada di berkas *PINTAR-HANDBOOK-FEATURE-COVERAGE.md*.
5. **[Ilustrasi: …]** menandai tempat gambar atau diagram yang akan dibuat kemudian. Tidak ada tangkapan layar yang dibuat-buat.
6. **Perubahan di Draf 01a.** Langkah penyiapan akun bagi pengguna email lama setelah pembaruan (5.2); daftar 4.2 disesuaikan dengan koreksi Revisi 3.1 (7.18, Lampiran A); penegakan masa simpan data kini bertanda «versi belum ditetapkan» (6.10); kemudahan jalur AI sendiri dicatat sebagai usulan 4.2 (10.10). Rinciannya ada di berkas cakupan, bagian 7.

---

## Daftar isi

**Prakata**

**Bagian I · Mengenal PINTAR**
1. Apa itu PINTAR
2. Cara memakai buku ini
3. Prinsip PINTAR dalam keseharian
4. Siapa melakukan apa: peran di PINTAR
5. Dasar yang sama untuk semua pengguna

**Bagian II · Panduan untuk setiap peran**

6. Admin PINTAR
7. Admin sekolah
8. Pimpinan: Kepala departemen dan Dekan
9. Guru
10. Menyusun dan meninjau materi di Studio
11. Murid
12. Pengembangan profesi guru: fasilitator dan peserta
13. Memeriksa keaslian sertifikat

**Bagian III · PINTAR ke depan: memahami dan bertindak**

14. PINTAR 4.5 · Memahami
15. PINTAR 5.0 · Bertindak dan bertumbuh

**Bagian IV · Perjalanan terpadu di sekolah**

16. Sepuluh perjalanan yang menghubungkan semuanya

**Bagian V · Pertanyaan dan situasi khusus**

17. Pertanyaan umum
18. Ketika sesuatu tidak berjalan seperti biasa

**Lampiran**

- A. Panduan ketersediaan fitur per versi
- B. Usulan, hal yang ditunda, dan hal yang belum ditetapkan
- C. Glosarium
- D. Daftar ilustrasi yang direncanakan
- E. Rujukan silang cepat: "Saya ingin…"

---

# Prakata

Setiap guru pernah mengalaminya. Seorang murid mendapat nilai 6 dari 10. Angka itu memberi tahu bahwa ada yang belum dikuasai, tetapi tidak memberi tahu *apa*. Apakah ia belum paham cara menyamakan penyebut? Apakah ia keliru membaca soal? Ataukah soalnya sendiri yang kurang jelas?

PINTAR dibuat untuk membantu menjawab pertanyaan seperti itu dengan tenang dan jujur. PINTAR menghubungkan pelajaran, asesmen, dan laporan sehingga guru dapat melihat bagian mana yang sudah dikuasai, soal mana yang sulit bagi kelas, dan kapan buktinya belum cukup untuk disimpulkan. Setelah itu keputusan tetap di tangan guru.

Buku ini ditulis untuk semua orang yang memakai PINTAR: murid, guru, pimpinan, dan orang-orang yang mengurus PINTAR di sekolah dan di tingkat platform. Kami menulisnya seperti seorang rekan yang sudah lama memakai PINTAR dan sedang menjelaskannya kepada rekan baru. Kami menjelaskan untuk apa sebuah fitur ada sebelum menjelaskan cara memakainya, dan kami selalu bertanya: *lalu apa yang terjadi berikutnya?*

Buku ini juga jujur tentang waktu. PINTAR berkembang secara bertahap. Fondasi 4.0 menjaga agar bukti belajar dapat dipercaya. Versi 4.1 menjaga bukti itu tetap utuh ketika ada koreksi, gangguan, atau pemeliharaan. Versi 4.2 melengkapi pekerjaan administrasi sehari-hari. Versi 4.5 membantu guru *memahami* apa yang sebenarnya didukung oleh bukti. Versi 5.0 membantu guru *bertindak*, mengamati hasilnya, dan bertumbuh. Setiap kali kami menjelaskan sebuah fitur, kami menandai dengan jelas apakah fitur itu bagian dari fondasi, sedang diselesaikan, direncanakan, atau baru merupakan arah.

Satu kalimat merangkum sikap PINTAR: **PINTAR mengusulkan, manusia memutuskan.**

Selamat membaca.

---

# Bagian I · Mengenal PINTAR

# Bab 1 · Apa itu PINTAR

## 1.1 Satu kalimat tentang PINTAR

PINTAR adalah platform pendidikan berbasis bukti untuk sekolah, perguruan tinggi, dan program pelatihan. PINTAR membantu murid belajar dengan langkah yang jelas, membantu guru memahami apa yang sudah dan belum dikuasai, dan membantu sekolah menjaga catatan belajar yang dapat dijelaskan dari tahun ke tahun.

Di layar masuk PINTAR tertulis: «Belajar dengan bukti. Memahami sebelum memutuskan.» Kalimat itu menjadi pegangan seluruh buku ini.

## 1.2 Masalah yang ingin dibantu PINTAR

Sebuah nilai mencatat *hasil*. Nilai tidak mencatat *penyebabnya*. Dua murid dengan nilai yang sama bisa kesulitan di bagian yang berbeda dan membutuhkan bantuan yang berbeda pula.

Data yang sedikit juga mudah disalahartikan. Jika baru tiga dari dua puluh empat murid yang mengerjakan sebuah asesmen, rata-ratanya bisa tampak rendah atau tinggi tanpa alasan yang sebenarnya.

Catatan belajar pun mudah terputus. Ketika murid pindah kelas, naik kelas, atau pindah sekolah, dan ketika guru berganti tugas, jejak belajarnya sering tertinggal.

PINTAR menjawab ketiga masalah ini dengan cara yang sama: mencatat bukti dengan rapi, menunjukkan batas bukti itu dengan jujur, dan menjaga catatan tetap utuh ketika keadaan berubah.

## 1.3 Dari tujuan pembelajaran ke langkah mengajar berikutnya

Cara kerja PINTAR dapat diringkas dalam empat langkah yang akan Anda temui berulang kali di buku ini:

1. **Tujuan pembelajaran.** Apa yang perlu dapat dilakukan murid.
2. **Bukti.** Jawaban murid dari Pemetaan Awal, latihan, dan Uji Penguasaan.
3. **Pertimbangan guru.** Guru membaca bukti itu bersama apa yang ia ketahui tentang kelasnya.
4. **Langkah mengajar berikutnya.** Apa yang diulang, untuk siapa, dan apa yang dilanjutkan.

PINTAR menyiapkan bukti untuk langkah 1 dan 2. Langkah 3 dan 4 tetap milik guru.

> **[Ilustrasi 1.1]** Empat langkah dari tujuan pembelajaran ke langkah mengajar berikutnya, dengan langkah 3 diberi warna berbeda untuk menandai keputusan manusia.

## 1.4 Siklus belajar PINTAR

Bagi murid, belajar di PINTAR mengikuti satu siklus yang tetap:

| Tahap | Pertanyaan yang dijawab | Yang terjadi di PINTAR |
|---|---|---|
| Petakan | Apa yang sudah diketahui? | **Pemetaan Awal** menunjukkan apa yang sudah dikuasai murid. |
| Arahkan | Dari mana sebaiknya mulai? | **Peta Bacaan Personal** menyarankan urutan bacaan awal. |
| Belajar | Bagaimana memahaminya? | Pelajaran dan latihan, dengan bantuan bertahap bila diperlukan. |
| Uji | Apakah sudah dikuasai? | **Uji Penguasaan**, dengan aturan yang terlihat sebelum mulai. |
| Jelaskan | Apa artinya? | Laporan menjelaskan hasilnya, dan mengatakannya bila datanya belum cukup. |
| Verifikasi | Bisakah dipercaya? | Hasil dapat ditelusuri ke materi dan aturan yang dipakai; keaslian sertifikat dapat diperiksa. |
| Perbaiki | Apa langkah berikutnya? | Guru memutuskan apa yang diulang dan apa yang dilanjutkan. |

Setelah tahap Perbaiki, siklus kembali ke awal dengan bukti yang baru.

> **[Ilustrasi 1.2]** Siklus tujuh tahap dalam bentuk ular tangga (1 sampai 4 di atas, 5 sampai 7 kembali di bawah), dengan panah kembali ke tahap Petakan.

## 1.5 Apa yang bukan PINTAR

Penting untuk mengetahui sejak awal apa yang *tidak* dilakukan PINTAR:

- PINTAR **tidak memeringkat** murid. Laporan menjelaskan pembelajaran; laporan tidak mengurutkan murid dari yang terbaik hingga terburuk.
- PINTAR **tidak memutuskan** nilai akhir, kenaikan kelas, atau tindakan terhadap murid secara otomatis. Keputusan itu milik orang yang berwenang.
- PINTAR **tidak memantau** perilaku. PINTAR mencatat tindakan penting demi akuntabilitas, misalnya siapa yang masuk atau meminta cetakan resmi. PINTAR tidak merekam klik, tidak mengamati layar, dan tidak memakai kamera.
- PINTAR **tidak membandingkan** sekolah satu dengan sekolah lain.
- PINTAR **tidak membiarkan AI memutuskan**. Ketika AI membantu menyusun draf soal, draf itu selalu diperiksa dan diputuskan oleh guru, lalu ditinjau orang kedua sebelum dirilis. Murid tidak pernah berinteraksi dengan AI.

## 1.6 PINTAR dari versi ke versi

PINTAR dibangun bertahap. Setiap versi berdiri di atas versi sebelumnya.

| Versi | Nama | Inti perubahannya bagi pengguna |
|---|---|---|
| **4.0** | Fondasi | Sekolah, akun, peran, kelas, tahun ajaran, perpindahan, Studio, pelajaran, asesmen, hasil, laporan, sertifikat, dan pengembangan profesi guru. Bukti belajar dapat dipercaya. |
| **4.1** | Integritas, kesinambungan, dan pemulihan | Guru dapat mengatur sesi asesmen seorang murid, kunci jawaban yang keliru dapat dikoreksi dengan benar, pemeliharaan dapat dijadwalkan, penghentian darurat melindungi pekerjaan murid, tindakan penting tercatat, catatan peninjau, dan pemulihan antarperangkat. AI terpadu untuk menyusun draf soal sedang dikembangkan sebagai tambahan berbayar yang opsional, dan belum pasti. |
| **4.2** | Kematangan operasional | Mode Ujian, jabatan dan penugasan di dua sekolah, ekspor data sekolah, laporan periode lalu, beberapa perbaikan akun, catatan, dan struktur sekolah, tampilan kelas tanpa guru dan serah terima kelas, serta statistik Kesehatan soal terjadwal. |
| **4.5** | Memahami | PINTAR membantu guru memahami apa yang sebenarnya didukung oleh bukti: mutu soal, sebaran hasil, penjelasan yang tenang dan relevan, sejarah yang dapat dijelaskan, serta evaluasi guru yang diatur institusi dengan perlindungan bagi guru. |
| **5.0** | Bertindak dan bertumbuh | Guru memilih tujuan pertumbuhannya sendiri, mencatat tindakan perbaikan (intervensi), mengamati apa yang terjadi, dan merenungkan hasilnya. Sekolah dapat menjalankan siklus perbaikan di tingkat bagian atau sekolah. |

Bab 2 menjelaskan cara membaca tanda versi di setiap bagian buku ini. Lampiran A memuat daftar lengkapnya.

---

# Bab 2 · Cara memakai buku ini

## 2.1 Baca bagian yang Anda perlukan

Anda tidak perlu membaca buku ini dari awal sampai akhir.

- **Semua orang** sebaiknya membaca Bagian I, karena di sana dijelaskan prinsip, peran, dan dasar yang sama bagi semua pengguna, seperti cara masuk, akun, dan pemeliharaan.
- **Lalu baca bab untuk peran Anda** di Bagian II. Jika Anda memegang lebih dari satu peran, misalnya Guru sekaligus Kepala departemen, baca kedua bab itu.
- **Bagian III** menjelaskan PINTAR 4.5 dan 5.0. Bacalah jika Anda ingin memahami ke mana PINTAR akan berkembang.
- **Bagian IV** menceritakan perjalanan lengkap yang melibatkan banyak orang sekaligus, misalnya satu tahun ajaran dari awal sampai kenaikan kelas.
- **Bagian V** menjawab pertanyaan umum dan menjelaskan apa yang terjadi ketika sesuatu tidak berjalan seperti biasa.
- **Lampiran E** membantu Anda menemukan jawaban dengan cepat: "Saya ingin…".

## 2.2 Tanda versi dan status

Setiap fitur di buku ini diberi tanda seperti berikut:

| Tanda | Artinya |
|---|---|
| **〔4.0〕** | Bagian dari fondasi PINTAR 4.0. Sudah dibangun dan diuji, belum dirilis ke sekolah. |
| **〔4.1〕** | Bagian dari cakupan PINTAR 4.1 yang sudah disetujui. 4.1 sedang diselesaikan dan akan diterima melalui sesi bersama para pendidik sebelum digunakan sekolah. |
| **〔4.2 · direncanakan〕** | Pekerjaan yang sudah diputuskan untuk dipindahkan ke 4.2. Rincian dan rencana kerjanya masih akan ditetapkan. |
| **〔4.2 · usulan〕** | Usulan untuk 4.2 yang belum disetujui. |
| **〔4.5 · arah〕** | Arah PINTAR 4.5 yang sudah disetujui. Rencana rinci dan izin pembangunannya masih terpisah. |
| **〔5.0 · arah〕** | Arah PINTAR 5.0 yang sudah disetujui. Rencana rinci dan izin pembangunannya masih terpisah. |
| **〔belum ditetapkan〕** | Usulan, hal yang ditunda tanpa versi pasti, atau gagasan riset. Bukan janji. |

Untuk fitur 4.0 dan 4.1, buku ini menjelaskan langkah-langkahnya dengan teks layar yang tercatat. Untuk fitur 4.2, 4.5, dan 5.0, buku ini menjelaskan *pengalaman yang dituju* tanpa mengarang tombol atau menu. Layar dan langkah tepatnya akan ditetapkan dalam rencana versi itu.

## 2.3 Cara membaca teks layar

Teks yang muncul di layar PINTAR ditulis dalam tanda «…», misalnya «Mulai Uji Penguasaan». Nama halaman dan bagian ditulis dengan huruf tebal, misalnya **Konfigurasi**.

## 2.4 Kotak khusus

> **Mengapa begini?** Kotak ini menjelaskan alasan di balik sebuah aturan.

> **Jika terjadi kendala** Kotak ini menjelaskan apa yang dapat dilakukan ketika sesuatu tidak berjalan seperti biasa.

> **Contoh** Kotak ini berisi contoh dari keseharian sekolah di Indonesia.

---

# Bab 3 · Prinsip PINTAR dalam keseharian

Prinsip hanya berarti jika terlihat dalam keputusan sehari-hari. Bab ini menjelaskan enam prinsip PINTAR melalui situasi nyata.

## 3.1 Bukti sebelum kesimpulan

PINTAR membedakan dengan cermat antara apa yang **tercatat**, apa yang **dapat dihitung**, apa yang **dapat disimpulkan dengan aturan yang jelas**, dan apa yang **belum dapat disimpulkan**.

> **Contoh** Bu Rina mengajar matematika di kelas 7B. Baru tiga dari dua puluh empat muridnya yang mengerjakan Uji Penguasaan. PINTAR tidak menampilkan rata-rata kelas. Di layar tertulis bahwa datanya belum cukup, berapa murid yang sudah mengerjakan, dan berapa yang dibutuhkan. Begitu jumlah minimum tercapai, angkanya muncul, beserta jumlah murid yang menjadi dasarnya.

Di PINTAR 4.0, setiap angka laporan memiliki jumlah data minimum. Misalnya, angka tingkat kelas baru ditampilkan jika sedikitnya lima murid memberikan bukti. Di bawah jumlah itu, layar menulis bahwa datanya belum cukup, bukan angka nol. Di layar guru tertulis: «Belum cukup bukan berarti buruk — artinya belum.»

Mulai PINTAR 4.5, pembedaan ini menjadi lebih tegas. Setiap pernyataan yang dibuat PINTAR akan diberi jenis: tercatat, terhitung, disimpulkan, atau belum dapat disimpulkan (Bab 14).

## 3.2 Guru tetap memegang pertimbangan

PINTAR menyiapkan bukti. Guru yang menafsirkannya.

> **Contoh** Dua belas dari dua puluh empat murid memilih jawaban B pada satu soal pecahan. Jawaban B menjumlahkan penyebutnya. PINTAR menampilkan angka itu. PINTAR tidak menyimpulkan bahwa separuh kelas "tidak paham". Mungkin soalnya kurang jelas. Mungkin ada hal lain. Guru yang memutuskan: besok ia meminta beberapa murid menjelaskan cara mereka menjawab, lalu mengulang penyamaan penyebut bila memang perlu.

Prinsip ini berlaku juga untuk tindakan. PINTAR tidak pernah mengirim tugas tambahan, menurunkan nilai, atau menghubungi orang tua secara otomatis.

## 3.3 AI membantu, manusia memutuskan

AI dapat membantu guru menyiapkan draf soal dengan dua cara. Pertama, guru boleh memakai AI milik sendiri atau sekolah, lalu mengunggah hasilnya melalui buku kerja Studio tanpa biaya tambahan. Kedua, PINTAR sedang mengembangkan AI terpadu sebagai tambahan berbayar yang opsional bagi sekolah; fitur ini belum pasti tersedia (Bab 10.10). Aturannya sama untuk keduanya:

- Draf AI tidak pernah terbit atau ditugaskan dengan sendirinya.
- Guru memeriksa, mengubah, menolak, atau meminta draf baru, dan tetap bertanggung jawab atas isinya.
- Soal yang diterima tetap ditinjau orang kedua sebelum dirilis.
- Tidak ada data yang dapat mengenali murid yang boleh diberikan kepada AI.
- Murid tidak pernah berinteraksi dengan AI.
- Guru selalu dapat menulis soal sendiri.

Mulai PINTAR 4.5, AI dapat membantu *menyampaikan* kesimpulan yang sudah disetujui dengan bahasa yang mudah dipahami. AI tidak membuat kesimpulan pendidikan sendiri dan tidak membuat penilaian resmi.

## 3.4 Perbaikan lebih penting daripada peringkat

Tidak ada peringkat murid di PINTAR. Daftar murid diurutkan menurut abjad. Di layar guru tertulis: «Nama diurutkan abjad; tidak ada peringkat.»

Hal yang sama berlaku untuk guru. Mulai 4.5, ketika institusi menjalankan evaluasi guru secara resmi, PINTAR tidak membuat peringkat guru, tidak membandingkan guru yang disebut namanya, dan tidak memicu sanksi secara otomatis. Mulai 5.0, catatan pertumbuhan guru dilindungi oleh kesepakatan bersama dan tidak dapat dipakai untuk menghukum.

Tujuan bukti adalah menemukan kebutuhan belajar dan mendukung perbaikan yang dipikirkan dengan baik.

## 3.5 Menghormati pengguna

PINTAR menghormati setiap penggunanya:

- **Akses secukupnya.** Setiap orang melihat apa yang diperlukan perannya, tidak lebih. Guru melihat kelas yang ia ajar. Pimpinan melihat lingkup yang ia pimpin. Membuka catatan satu murid adalah tindakan tersendiri dan tercatat.
- **Privasi.** Layar yang dipakai bersama hanya menyapa murid dengan nama depannya. Kartu kelas dan sertifikat tidak memuat foto murid.
- **Pemulihan akun.** Murid yang lupa PIN dibantu oleh sekolah, tanpa perlu email. Staf dapat memulihkan password melalui email atau dengan PINTAR ID dan PIN pribadi.
- **Koreksi.** Data yang keliru dapat dikoreksi oleh orang yang berwenang, dengan alasan yang tercatat, tanpa menghapus jejak aslinya.
- **Hak untuk pergi.** Staf dapat meminta akunnya ditutup atau data pribadinya dihapus dari **Akun saya**. Untuk murid, permintaan itu diajukan oleh sekolah bersama keluarga (Bab 11).

## 3.6 Kesinambungan dan keadilan

Gangguan, perpindahan, revisi, dan koreksi tidak boleh menghapus bukti belajar yang sah secara diam-diam.

> **Contoh** Raka sedang mengerjakan Uji Penguasaan ketika listrik di sekolah padam. Jawaban yang sudah tersimpan tidak hilang. Ketika ia kembali, ia melanjutkan dari jawaban terakhir yang tersimpan.

> **Contoh** Setelah Uji Penguasaan dinilai, ternyata kunci jawaban satu soal keliru. Kuncinya dikoreksi melalui proses dua orang. Hasil murid yang terdampak dihitung ulang dari jawaban aslinya. Hasil yang lama dan jawaban murid tetap tersimpan, dan hasil baru diberi tanda «Dihitung ulang».

> **Contoh** Dinda pindah dari kelas 8A ke 8C di tengah semester. Pekerjaannya di 8A tetap tercatat di 8A, tempat pekerjaan itu dilakukan. Mulai sekarang ia mengikuti tugas 8C.

---

# Bab 4 · Siapa melakukan apa: peran di PINTAR

## 4.1 Peran dan lingkup

Di PINTAR, apa yang dapat dilakukan seseorang ditentukan oleh **peran** yang diberikan kepadanya dan **lingkup** tempat peran itu berlaku. Lingkup dapat berupa seluruh sekolah, satu Bagian (misalnya SMP), satu Tingkat (misalnya kelas 8), atau satu Kelas (misalnya 8B).

Satu orang memiliki satu akun dan satu identitas, meskipun ia memegang beberapa peran. Misalnya, seorang guru dapat mengajar kelas 8B sekaligus menjadi Kepala departemen untuk Bagian SMP.

Setiap peran diberikan dengan tanggal berakhir yang jelas («Berlaku sampai»). PINTAR mengingatkan pemegangnya dan Admin sekolah sebelum masa itu habis.

## 4.2 Peran di PINTAR

PINTAR memiliki enam peran:

| Peran | Siapa biasanya | Yang menjadi tanggung jawabnya |
|---|---|---|
| **Murid** | Siswa sekolah, mahasiswa, atau peserta pelatihan akademik | Belajar dan mengerjakan asesmen di halaman **Belajar**. |
| **Guru** | Guru, dosen, fasilitator | Menyediakan materi untuk kelas, mengadakan Uji Cepat, melihat bukti kelas, mengatur sesi asesmen murid, dan menyusun materi di Studio. |
| **Kepala departemen** | Kepala jurusan, koordinator mata pelajaran, wakil kepala bidang kurikulum | Semua yang dapat dilakukan Guru dalam lingkupnya, ditambah meninjau dan menyetujui materi, memeriksa mutu soal, meninjau catatan integritas, menyetujui kesempatan tambahan, dan memutuskan hal yang menunggu di halaman **Pimpinan**. |
| **Dekan** | Pimpinan yang perlu melihat gambaran lingkup yang ia pimpin | Melihat daftar murid dan ringkasan dalam lingkupnya, serta memutuskan hal yang menunggu di halaman **Pimpinan**. Dekan tidak mengubah materi atau data. |
| **Admin sekolah** | Operator sekolah, staf tata usaha, admin institusi | Mengurus PINTAR di sekolahnya: struktur sekolah dan tahun ajaran, pendataan, aktivasi dan kartu kelas, peran staf, kenaikan kelas, perpindahan, sertifikat sekolah, pemeliharaan terjadwal, dan menerbitkan materi sekolah. |
| **Admin PINTAR** | Tim PINTAR | Mengurus platform: membuka sekolah baru, materi standar PINTAR, akun di tingkat platform, penangguhan, dan penghentian darurat. Di layar juga disebut «Admin platform». |

> **Mengapa begini?** Admin sekolah mengurus data dan akses, tetapi tidak melihat hasil belajar murid satu per satu. Admin bukan penguji. Hasil belajar dilihat oleh guru dan pimpinan yang berwenang, sesuai lingkupnya.

[Perlu konfirmasi: contoh "siapa biasanya" pada kolom kedua adalah penjelasan editorial, bukan aturan sistem.]

## 4.3 Tanggung jawab yang bukan peran tersendiri

Beberapa tanggung jawab penting di PINTAR tidak memiliki peran sendiri. Tanggung jawab itu dipegang oleh peran yang sudah ada:

- **Kepala sekolah.** PINTAR tidak memiliki peran bernama «Kepala sekolah». Sekolah memberikan peran sesuai tanggung jawab orangnya. Sebelum memilih, perhatikan batas setiap peran: Kepala departemen dapat meninjau dan menyetujui materi di lingkupnya, tetapi tidak menerbitkan; Dekan melihat gambaran lingkupnya dan memutuskan hal yang menunggu, tetapi sengaja tidak dapat mengubah materi atau data; Admin sekolah mengurus struktur dan orang, tetapi tidak membaca hasil belajar murid (Bab 7 dan 8). [Perlu konfirmasi: peran untuk kepala sekolah.]
- **Peninjau materi.** Meninjau dan menyetujui materi adalah kewenangan yang dipegang Kepala departemen, Admin sekolah, dan Admin PINTAR. Aturan pentingnya adalah *dua orang*: penyusun tidak dapat menyetujui materinya sendiri. Di layar tertulis: «Persetujuannya harus dari orang lain, bukan dari penyusun.» (Bab 10)
- **Fasilitator pengembangan profesi.** Fasilitator adalah seorang Guru yang ditugaskan di kelas pengembangan profesi. Guru yang mengikuti pengembangan profesi disebut **Peserta**, bukan murid. (Bab 12)
- **Yang mengurus PINTAR di sekolah Anda.** Di layar bantuan dan pemulihan, PINTAR sering memakai ungkapan ini alih-alih nama peran. Biasanya yang dimaksud adalah Admin sekolah.

## 4.4 Pintu masuk menurut peran

Di halaman awal PINTAR tertulis «Mau ke mana hari ini?», dengan empat pintu:

- «Saya mau belajar» untuk murid,
- «Saya mengajar» untuk guru,
- «Saya mengelola sekolah» untuk Admin sekolah dan Admin PINTAR,
- «Saya memimpin bagian sekolah» untuk Kepala departemen dan Dekan.

Setelah masuk, setiap orang tiba di halaman utama perannya: **Belajar**, **Mengajar**, **Konfigurasi**, atau **Pimpinan**. Orang yang memegang beberapa peran dapat berpindah di antara halaman-halaman itu.

> **[Ilustrasi 4.1]** Peta peran: enam peran, lingkupnya, dan halaman utamanya.

## 4.5 Ke depan: jabatan dan dua sekolah 〔4.2 · direncanakan〕

PINTAR 4.2 merencanakan tiga hal yang berkaitan dengan peran:

- **Jabatan resmi**, misalnya wakil kepala sekolah bidang kurikulum.
- **Penugasan pelaksana tugas**, misalnya Plt. kepala sekolah selama kepala sekolah cuti.
- **Peran di dua sekolah**, misalnya guru yang mengajar di dua sekolah dalam satu yayasan.

Prinsipnya sudah ditetapkan: perubahan peran tidak boleh mengubah catatan siapa melakukan apa di masa lalu, dan peran di satu sekolah tidak pernah memberi akses ke sekolah lain. Tanggal mulai, tanggal berakhir, tumpang tindih, dan cara memilih sekolah yang sedang dikerjakan akan ditetapkan dalam rencana 4.2.

---

# Bab 5 · Dasar yang sama untuk semua pengguna

## 5.1 Bahasa

PINTAR tersedia dalam Bahasa Indonesia dan bahasa Inggris. Bahasa Indonesia adalah bahasa bawaan. Setiap layar dapat dialihkan ke bahasa lain. Isi pelajaran tidak diterjemahkan otomatis; materi tampil dalam bahasa penyusunannya.

## 5.2 Mengaktifkan akun staf 〔4.0〕

Akun di PINTAR tidak dibuat sendiri melalui pendaftaran umum. Sekolah mendata orangnya terlebih dahulu, lalu orang itu mengaktifkan akunnya.

Untuk staf, misalnya guru, pimpinan, dan Admin sekolah, aktivasi dilakukan sendiri di halaman «Aktifkan akun PINTAR Anda». Langkahnya:

1. **Kirim kode.** Masukkan email yang didaftarkan sekolah. PINTAR mengirim kode aktivasi enam angka ke email itu.
2. **Masukkan kode aktivasi.**
3. **Pilih username.** Username tidak dapat diganti setelah dipilih.
4. **Buat password**, minimal delapan karakter. PINTAR menolak password yang diketahui pernah bocor.
5. **Buat PIN pribadi** empat angka. Di layar tertulis: «Jangan beri tahu siapa pun, termasuk yang mengurus PINTAR di sekolah Anda.»
6. **Periksa nama Anda.** «Nama ini dipakai di seluruh PINTAR, termasuk di sertifikat Anda.» Pilih «Sudah benar» atau «Ubah nama».
7. Selesai: «Akun Anda sudah aktif.»

Anda dapat berhenti di tengah dengan «Keluar dan lanjutkan nanti».

**Sudah memakai PINTAR dengan email sebelum pembaruan?** Setelah sekolah Anda menerima PINTAR versi baru, setiap akun email yang sudah ada, milik staf maupun murid, perlu menyelesaikan penyiapan akun ini satu kali. Masuklah seperti biasa. PINTAR lalu membuka halaman aktivasi dan menahan Anda di sana sampai langkahnya selesai. Jika Anda memilih «Keluar dan lanjutkan nanti», halaman yang sama akan muncul lagi saat Anda masuk berikutnya. Murid yang masuk dengan kartu kelas tidak mengalami langkah ini. PINTAR hanya menampilkan langkah yang belum lengkap untuk akun Anda; langkah yang sudah lengkap dilewati. [Perlu konfirmasi: langkah mana yang biasanya tersisa bagi akun lama, misalnya apakah password perlu dibuat ulang.]

[Ilustrasi: halaman aktivasi yang muncul setelah masuk, dengan langkah yang tersisa]

Setelah aktif, staf mendapat **PINTAR ID** dan **Kartu PINTAR**, yaitu kartu identitas digital yang dapat dilihat di **Akun saya**. PINTAR ID adalah tanda pengenal, bukan kunci untuk masuk. Di halaman kartu tertulis: «PINTAR ID bukan kunci…»

> **Jika terjadi kendala** Kode tidak sampai? Periksa folder spam, lalu kirim ulang. PINTAR tidak dapat memastikan email sampai di kotak masuk. Jika tetap tidak sampai, hubungi yang mengurus PINTAR di sekolah Anda untuk memeriksa alamat email yang didaftarkan.

## 5.3 Masuk ke PINTAR 〔4.0〕

Ada dua cara masuk:

- **Staf** masuk dengan email atau username, lalu password: «Masuk dengan email atau username, dan password Anda.»
- **Murid** masuk dengan **kartu kelas**: «Masukkan nomor kartu dan PIN yang tertera pada kartu.» Murid tidak memerlukan email.

Jika data yang dimasukkan tidak cocok, PINTAR menjawab dengan kalimat yang sama, apa pun penyebabnya. Misalnya: «Belum cocok. Coba periksa nomor kartu dan PIN, lalu coba sekali lagi.»

> **Mengapa begini?** Mulai 4.1, akun yang ditangguhkan, ditutup, atau tidak ada pun mendapat jawaban yang sama dengan password yang salah. Dengan begitu, orang lain tidak dapat menebak keadaan akun seseorang dari luar.

## 5.4 Komputer bersama dan komputer pribadi 〔4.0〕

Saat staf masuk dari peramban yang belum dikenal, PINTAR bertanya «Komputer siapa ini?»:

- **«Komputer bersama»**, misalnya komputer laboratorium atau ruang guru. PINTAR terkunci setelah beberapa saat tidak dipakai. Sesaat sebelumnya muncul peringatan dengan tombol «Saya masih di sini». Untuk membuka kunci, masukkan PIN. Jika terkunci terlalu lama, atau setelah beberapa kali salah memasukkan PIN, sesi berakhir dan Anda perlu masuk lagi.
- **«Komputer pribadi saya»**. Anda tetap masuk lebih lama di perangkat itu.

Murid yang memakai komputer bersama dilindungi dengan cara yang sama. Halaman **PINTAR terkunci** tidak menyebut nama murid. Murid membuka kunci dengan PIN kartunya, lalu kembali ke halaman tempat ia berhenti. Jika yang duduk di depan komputer adalah murid lain, tautan «Bukan akun Anda?» mengeluarkan akun sebelumnya dengan aman.

Kemajuan belajar mengikuti *orangnya*, bukan komputernya. Murid dapat berpindah komputer tanpa kehilangan posisi bacaannya.

## 5.5 Keluar

- «Keluar» mengakhiri sesi di perangkat ini saja.
- «Keluar dari semua perangkat», di **Akun saya**, mengakhiri sesi di semua perangkat. Tindakan ini meminta konfirmasi.

## 5.6 Lupa password atau PIN 〔4.0〕

**Staf yang lupa password** memakai «Lupa password?» di halaman masuk. Ketik email atau username. Jika akunnya sudah aktif, PINTAR mengirim kode ke email akun itu untuk membuat password baru. Setelah password baru disimpan, akun itu keluar dari semua perangkat lain, dan pemiliknya diberi tahu.

Jika email tidak dapat diakses, staf dapat memakai «Pakai PINTAR ID dan PIN». Untuk melindungi akun, setelah beberapa kali salah memasukkan PIN, cara ini ditutup sementara, dan jika terus salah, ditutup sampai dipulihkan melalui email atau oleh Admin sekolah atau Admin PINTAR melalui **Keamanan akun**. Akunnya sendiri tidak terkunci; hanya cara pemulihan ini yang ditutup. Jika Anda mengalaminya, hubungi yang mengurus PINTAR di sekolah Anda.

**Murid yang lupa PIN atau kehilangan kartu** meminta bantuan guru atau Admin sekolah. Di layar tertulis: «Lupa PIN? Tanyakan kepada guru.» Admin sekolah menerbitkan kartu baru, kartu lama langsung tidak berlaku, dan semua hasil belajar murid tetap utuh (Bab 7).

**Mengganti password saat sedang masuk** 〔4.2 · direncanakan〕 belum tersedia di 4.0. Sampai saat itu, gunakan «Lupa password?».

## 5.7 Akun saya

Halaman **Akun saya** memuat PINTAR ID dan Kartu PINTAR Anda. Dari sini Anda dapat:

- «Kirim kartu ke email saya»,
- «Buat PIN baru»,
- mengganti foto profil (foto hanya tampil di profil, tidak di kartu kelas atau sertifikat),
- «Keluar dari semua perangkat»,
- dan, di bagian «Meninggalkan PINTAR», meminta «Tutup akun saya» atau «Hapus data pribadi saya».

Untuk murid, permintaan menutup akun atau menghapus data tidak diajukan sendiri. Layar menjelaskan bahwa permintaan itu diajukan oleh sekolah bersama keluarga, dan meminta murid menyampaikannya kepada wali kelas atau guru. [Perlu konfirmasi: apakah murid sudah dapat membuka **Akun saya** di 4.0.]

Akun yang sudah ditutup dapat diminta dibuka kembali melalui «Minta dibuka kembali» di halaman masuk (Bab 6).

## 5.8 Pemeliharaan dan penghentian sementara 〔4.0, diperluas di 4.1〕

Sesekali PINTAR perlu dipelihara. Ada dua jenis keadaan:

**Pemeliharaan terjadwal.** Waktunya diumumkan lebih dulu. Mulai 4.1, pemeliharaan dapat dijadwalkan untuk satu kelas atau lebih, satu sekolah, atau seluruh platform. Pengguna yang terdampak melihat:

- pemberitahuan 60, 30, dan 15 menit sebelumnya, dengan waktu menurut zona sekolah (WIB, WITA, atau WIT);
- dalam 15 menit terakhir sebelum pemeliharaan dan selama pemeliharaan, asesmen baru untuk pekerjaan yang terdampak belum dapat dimulai. Tombol «Mulai» tidak aktif dan diikuti kalimat penjelasan;
- asesmen yang sudah berjalan **tetap dapat diselesaikan** seperti biasa;
- untuk pemeliharaan satu kelas, bagian PINTAR lain tetap dapat dipakai. Pemeliharaan kelas 7A tidak menghalangi pekerjaan di kelas 7B;
- untuk pemeliharaan seluruh platform, muncul halaman «PINTAR sedang dalam pemeliharaan».

**Penghentian darurat.** Jika terjadi masalah serius, Admin PINTAR dapat menghentikan PINTAR sementara untuk satu kelas, sekolah tertentu, atau seluruh platform. Pengguna melihat «PINTAR dihentikan sementara». Yang penting: penghentian **tidak** mengumpulkan dan **tidak** menilai asesmen yang sedang dikerjakan. Asesmen itu *ditahan*, dengan sisa waktunya disimpan. Murid melihat: «Asesmen ini ditahan selama penghentian. Sisa waktu Anda: … menit.» Setelah penghentian berakhir, asesmen dapat dilanjutkan dengan sisa waktu yang persis sama.

Rinciannya dibahas di Bab 6 (Admin PINTAR), Bab 7 (Admin sekolah), dan Bab 18.

## 5.9 Waktu dan zona waktu

PINTAR menampilkan waktu menurut zona waktu sekolah: WIB, WITA, atau WIT. Zona waktu sekolah ditetapkan oleh Admin PINTAR saat sekolah dibuka. Batas waktu tugas, jadwal pemeliharaan, dan waktu cetak semuanya mengikuti zona ini.

## 5.10 Ketika sesuatu gagal

Ketika ada kendala, PINTAR tidak menampilkan pesan teknis mentah. PINTAR menjelaskan dengan tenang apa yang terjadi, apa yang dapat Anda lakukan, dan apa yang *tidak* hilang. Jika perlu, PINTAR memberi kode rujukan pendek («Kode rujukan») yang dapat Anda sampaikan kepada yang mengurus PINTAR.

Staf dapat melaporkan masalah melalui «Laporkan masalah» dan melihat perkembangannya di «Laporan saya».

## 5.11 Tur PINTAR dan Bantuan 〔4.0〕

Saat pertama kali memakai PINTAR, murid dan guru dapat mengikuti **Tur PINTAR**: «Tur halaman Belajar» untuk murid dan «Tur untuk guru» untuk guru. Tur berjalan langkah demi langkah dengan «Berikutnya» dan «Kembali», dan dapat dilewati dengan «Lewati tur». Jika Anda memilih «Jangan tampilkan tur ini lagi», tur tidak muncul otomatis lagi, tetapi tetap dapat dibuka kapan saja dari **Bantuan** dengan «Mulai tur». Dari **Bantuan** Anda juga dapat membuka satu langkah tur saja. Butuh bantuan lain? Murid diarahkan untuk bertanya kepada guru; staf diarahkan ke layanan sekolah.

## 5.12 Ke depan: cara masuk dan keamanan staf

- **Masuk dengan WhatsApp** 〔4.5 · arah〕. PINTAR 4.5 mencatat rencana untuk masuk melalui WhatsApp. Penyedia, biaya, cara kerja, pemulihan, dan tinjauan keamanannya masih harus diputuskan, termasuk bagaimana cara ini berhubungan dengan kartu kelas dan pemulihan yang dibantu sekolah bagi murid.
- **Pemeriksaan akses tidak biasa untuk staf** 〔4.5 · arah〕. Jika akun staf masuk dengan cara yang tidak biasa, PINTAR dapat meminta pemeriksaan tambahan. Tanda yang dipakai, cara tantangan, dan pemulihannya akan ditetapkan dalam rencana 4.5. Pemeriksaan identitas untuk semua pengguna belum direncanakan.

---

# Bagian II · Panduan untuk setiap peran

# Bab 6 · Admin PINTAR

Bab ini untuk tim PINTAR yang memegang peran Admin PINTAR, atau «Admin platform». Peran ini tidak pernah diberikan oleh sekolah. Admin PINTAR menjaga platform secara keseluruhan dan membantu sekolah dalam hal-hal yang tidak boleh dilakukan sekolah sendiri.

Admin PINTAR memakai halaman **Konfigurasi** yang sama dengan Admin sekolah, dengan lingkup «Seluruh platform».

## 6.1 Gambaran tanggung jawab

| Tanggung jawab | Contoh |
|---|---|
| Membuka sekolah baru | Menyiapkan sekolah dan menunjuk Admin sekolah pertama. |
| Materi standar PINTAR | Menyusun dan merilis Pustaka PINTAR, lalu memberi izin pemakaiannya kepada sekolah. |
| Koreksi identitas | Membetulkan nama, username, atau email staf setelah aktivasi. |
| Penangguhan dan penutupan akun | Menangguhkan akun karena alasan keamanan, menangani permintaan tutup akun dan hapus data. |
| Kesinambungan admin | Memastikan platform dan sekolah tidak pernah kehilangan admin terakhirnya. |
| Pemeliharaan dan penghentian darurat | Menjadwalkan pemeliharaan platform, menghentikan PINTAR dalam keadaan darurat, dan mengakhiri penghentian itu. |
| Kesehatan layanan dan email | Memeriksa keadaan platform dan menjawab "apa yang terjadi dengan email ini?". |

## 6.2 Membuka sekolah baru 〔4.0〕

Sekolah tidak mendaftar sendiri dan tidak ada layar untuk membuat sekolah. Sekolah dibuka melalui proses terkendali yang tercatat:

1. Admin PINTAR menjalankan proses pembukaan sekolah. Nama sekolah, zona waktu, dan fondasi kelembagaannya disiapkan dan diperiksa.
2. Admin PINTAR mendata orang yang akan menjadi Admin sekolah pertama, lalu memberinya peran Admin sekolah.
3. PINTAR tidak mengirim email otomatis saat orang didata. Calon admin mengaktifkan akunnya sendiri melalui halaman aktivasi (Bab 5.2).
4. Setelah aktif, Admin sekolah mengambil alih pekerjaan sehari-hari: menyusun struktur sekolah, mendata murid dan staf, dan seterusnya (Bab 7).

**Lalu apa yang terjadi?** Sejak Admin sekolah pertama aktif, sekolah berjalan sendiri. Admin PINTAR kembali hanya untuk hal yang memang di luar kewenangan sekolah.

**Batas saat ini.** Hanya Admin PINTAR yang menetapkan zona waktu sekolah. Mengganti nama sekolah belum tersedia 〔4.2 · direncanakan〕. Menutup atau mengarsipkan sekolah ditunda ke setelah 4.2 〔belum ditetapkan〕. [Perlu konfirmasi: jalur pembukaan sekolah untuk produksi masih menunggu keputusan pemilik.]

> **Mengapa begini?** Pembukaan sekolah menentukan batas data dan akses untuk tahun-tahun ke depan. Karena itu, pembukaan sekolah dilakukan melalui proses yang dapat diulang dan diperiksa, bukan diketik langsung ke basis data.

## 6.3 Materi standar PINTAR dan Pustaka PINTAR 〔4.0〕

PINTAR menyediakan materi standar di **Pustaka PINTAR**. Admin PINTAR menyusun dan merilis materi ini melalui Studio dengan aturan tinjauan yang sama seperti materi sekolah (Bab 10), lalu memberi izin pemakaiannya kepada sekolah.

- Sekolah memakai rilis pusat itu, tidak menyalinnya. Jika materi standar dikoreksi, koreksinya berlaku melalui rilis baru dalam garis yang sama.
- Sekolah tidak dapat mengubah isi Pustaka PINTAR.
- Mencabut izin pemakaian memerlukan alasan. Sesi asesmen yang sudah dimulai tidak terganggu.
- Penyesuaian materi platform oleh sekolah ditunda ke setelah 4.2 〔belum ditetapkan〕.

## 6.4 Koreksi identitas 〔4.0〕

Beberapa data identitas sengaja tidak dapat diubah sendiri, agar tidak disalahgunakan. Admin PINTAR dapat:

- membetulkan nama seseorang,
- membetulkan username,
- membetulkan email staf setelah aktivasi. Diperlukan alasan, dan pemberitahuan dikirim ke alamat lama dan alamat baru,
- mengatur ulang pemulihan PIN dengan catatan alasan. Pemiliknya kemudian harus membuat PIN baru.

Semua tindakan ini tercatat di **Jejak audit**.

## 6.5 Penangguhan dan penutupan akun 〔4.0, dilengkapi 4.1〕

Halaman «Penangguhan dan penutupan akun» hanya untuk Admin PINTAR.

**Menangguhkan akun.** Penangguhan menghentikan akses seseorang ke seluruh PINTAR, segera dan di semua sesinya. Setiap penangguhan wajib memilih kategori alasan: keamanan, administratif, atau lainnya. Penangguhan tidak pernah mengubah bukti belajar atau hasil.

> **Mengapa begini?** Penangguhan bukan cara untuk mengakhiri keikutsertaan biasa. Murid yang lulus atau guru yang pensiun diakhiri pendaftaran atau tugasnya oleh sekolah (Bab 7), bukan ditangguhkan.

Mulai 4.1:

- Jika murid yang ditangguhkan sedang mengerjakan asesmen, sesinya **ditahan** segera. Jawaban dan sisa waktunya disimpan. Sesi itu tidak berlanjut sendiri dan tidak mendapat waktu tambahan. Setelah penangguhan dicabut, guru memutuskan: «Lanjutkan» dengan sisa waktu yang sama, atau «Akhiri tanpa menghitung» (Bab 9).
- Akun yang ditangguhkan mendapat jawaban yang sama dengan password yang salah ketika mencoba masuk.

**Memulihkan akun** («Pulihkan akun») mengembalikan akses yang ditangguhkan.

**Permintaan tutup akun dan hapus data.** Staf dapat mengajukan «Tutup akun saya» atau «Hapus data pribadi saya» dari **Akun saya**. Admin PINTAR menangani antrean permintaan ini.

**Membuka kembali akun yang ditutup** («Buka kembali akun»). Orang yang akunnya ditutup dapat mengirim permintaan melalui «Minta dibuka kembali» di halaman masuk, dengan pesan untuk Admin PINTAR. Admin PINTAR mencatat bagaimana identitas orang itu diverifikasi sebelum membuka kembali akunnya.

Mulai 4.1, orang yang data pribadinya sudah dihapus **tidak dapat** dibuka kembali. Penghapusan bersifat final: tidak ada sertifikat baru yang diterbitkan untuknya, dan sertifikat pengganti ditolak.

## 6.6 Tidak ada sekolah tanpa admin 〔4.1〕

Sebuah sekolah, atau platform itu sendiri, tidak boleh kehilangan admin terakhirnya. Mulai 4.1:

- Peran Admin PINTAR terakhir yang masih dapat dipakai tidak dapat dicabut atau diakhiri.
- Admin sekolah terakhir di sebuah sekolah tidak dapat dicabut oleh Admin sekolah lain, dan tidak dapat hilang lewat pengakhiran tugas atau perubahan peran. Admin PINTAR masih dapat melakukannya, dan layar memberi peringatan.
- Akun yang ditangguhkan, ditutup, atau datanya dihapus tidak dihitung sebagai admin yang dapat dipakai.
- Peringatan masa berlaku peran muncul 30 hari sebelum berakhir di halaman «Peran & akses», dan 7 hari sebelumnya di halaman utama pemegang peran.
- Admin PINTAR terakhir dapat memperpanjang perannya sendiri. Inilah satu-satunya pemberian peran kepada diri sendiri yang diizinkan.

Jika keadaan darurat tetap terjadi, tim PINTAR memiliki prosedur khusus yang tercatat untuk menunjuk seseorang sebagai Admin PINTAR.

## 6.7 Pemeliharaan platform dan penghentian darurat

### Pemeliharaan terjadwal 〔4.0, diperluas 4.1〕

Admin PINTAR dapat menjadwalkan pemeliharaan untuk seluruh platform di **Konfigurasi** › «Pemeliharaan dan pengumuman». Langkah dan aturannya sama dengan pemeliharaan sekolah (Bab 7.12). Untuk lingkup seluruh platform, pengguna diarahkan ke halaman «PINTAR sedang dalam pemeliharaan» selama 15 menit terakhir sebelum dan selama pemeliharaan.

### Penghentian darurat 〔4.0, diperluas 4.1〕

Penghentian darurat dipakai ketika ada masalah serius yang membutuhkan PINTAR berhenti *sekarang*. Hanya Admin PINTAR yang dapat menghentikan dan mengakhiri penghentian.

**Cara menghentikan:**

1. Pilih lingkupnya: seluruh platform, sekolah tertentu, atau (mulai 4.1) kelas tertentu.
2. Tuliskan alasannya.
3. Ketik frasa konfirmasi «HENTIKAN SEKARANG».
4. Tekan «Hentikan PINTAR sekarang».

**Apa yang terjadi selama penghentian:**

- Pengguna dalam lingkup itu melihat «PINTAR dihentikan sementara».
- Asesmen yang sedang dikerjakan **tidak** dikumpulkan, **tidak** dinilai, dan waktunya **tidak** diubah. Asesmen itu ditahan, dengan jawaban yang sudah diterima dan sisa waktunya tersimpan.
- Pengakhiran pendaftaran murid tetap dapat dicatat dan tidak menghasilkan nilai apa pun.
- Kenaikan kelas ditolak untuk murid yang sesinya sedang dilindungi penghentian.

**Mengakhiri penghentian:** tekan «Akhiri penghentian». Setiap sesi yang ditahan memiliki persis sisa waktu yang dimilikinya saat dihentikan.

> **Mengapa begini?** Penghentian darurat adalah perlindungan, bukan hukuman. Murid yang sedang mengerjakan Uji Penguasaan tidak boleh kehilangan waktu atau kesempatan karena gangguan yang bukan kesalahannya.

> **Contoh** Sebuah gangguan jaringan terjadi di satu sekolah di Makassar pada pukul 09.40 WITA. Admin PINTAR menghentikan PINTAR untuk sekolah itu saja. Sekolah lain tetap berjalan. Pada pukul 10.05 gangguan selesai, Admin PINTAR mengakhiri penghentian, dan murid-murid melanjutkan Uji Penguasaan dengan sisa waktu yang sama seperti pada pukul 09.40.

## 6.8 Kesehatan layanan dan email 〔4.0〕

Admin PINTAR dapat melihat keadaan platform dan menjawab pertanyaan "apa yang terjadi dengan email ini?". PINTAR mencatat setiap email melalui beberapa tahap: diminta, diterima, dikirim atau diserahkan ke layanan email, lalu ditolak atau gagal bila memang begitu. Ada juga daftar email yang tertahan.

PINTAR tidak pernah menyatakan sebuah email "terkirim" bila catatannya sendiri berkata lain. PINTAR juga tidak menjamin email sampai ke kotak masuk penerima.

## 6.9 Jejak audit

Admin PINTAR dapat membaca **Jejak audit** di seluruh platform: siapa melakukan tindakan penting, dengan peran apa, kapan, dan alasannya.

## 6.10 Admin PINTAR di versi berikutnya

- **Penegakan masa simpan data** 〔belum ditetapkan〕. Pekerjaan ini tidak termasuk daftar 4.2, dan versinya belum ditetapkan. Kelak, Admin PINTAR dan pengurus data sekolah yang berwenang akan dapat menegakkan masa simpan data sesuai kebijakan yang berlaku. Catatan mana yang tercakup, pengecualiannya, dan cara menjaga keutuhan sejarah masih harus ditetapkan. Kebijakan masa simpan bukti pendidikan diputuskan tersendiri oleh pemilik PINTAR sebelum data sekolah sungguhan dipakai (Bab 18 dan Lampiran B).
- **Penutupan sekolah dan fondasi banyak sekolah** 〔belum ditetapkan〕. Ditunda ke setelah 4.2.
- **Pemeriksaan akses tidak biasa untuk staf** dan **masuk dengan WhatsApp** 〔4.5 · arah〕 (Bab 5.12).

---

# Bab 7 · Admin sekolah

Bab ini untuk orang yang mengurus PINTAR di sekolahnya, dengan peran **Admin sekolah**. Di banyak sekolah, peran ini dipegang operator sekolah atau staf tata usaha.

Admin sekolah bekerja di halaman **Konfigurasi**. Halaman ini dikelompokkan menjadi: «Sekolah dan tahun ajaran», «Murid», «Staf dan akses», «Laporan dan templat», dan «Dukungan».

> **Mengapa begini?** Admin sekolah mengurus data dan akses, tetapi tidak melihat hasil belajar murid satu per satu. Di PINTAR, seorang admin bukan penguji.

## 7.1 Perjalanan Admin sekolah dalam satu tahun

Sebelum masuk ke rinciannya, berikut gambaran satu tahun kerja Admin sekolah:

1. **Sekolah bergabung.** Admin PINTAR membuka sekolah dan menunjuk Anda sebagai Admin sekolah pertama. Anda mengaktifkan akun.
2. **Menyiapkan sekolah.** Anda menyusun struktur sekolah untuk tahun ajaran (Bagian, Tingkat, Kelas), menetapkan batas ketuntasan, dan mengatur peran staf.
3. **Mendata dan mengaktifkan.** Anda mendata murid dan staf, menempatkan murid di kelas, lalu menyiapkan kartu kelas murid dan aktivasi staf.
4. **Sepanjang tahun.** Anda membantu murid yang kehilangan kartu, memindahkan murid antarkelas, mengurus perpindahan sekolah, mencatat murid yang keluar, mengakhiri tugas staf yang pindah, menjadwalkan pemeliharaan, dan mengurus sertifikat sekolah.
5. **Akhir tahun.** Anda menjalankan kenaikan kelas dan kelulusan, lalu menyiapkan tahun ajaran berikutnya.

Sepanjang tahun itu, PINTAR menjaga agar semua catatan lama tetap utuh dan setiap perubahan tercatat.

> **[Ilustrasi 7.1]** Lini masa satu tahun ajaran Admin sekolah, dari Juli ke Juni.

## 7.2 Masuk pertama kali dan Persiapan sekolah 〔4.0〕

Anda mengaktifkan akun dengan kode yang dikirim ke email (Bab 5.2). Setelah masuk, Anda tiba di **Konfigurasi**. Daftar **Persiapan sekolah** menunjukkan apa yang masih perlu disiapkan, dan bagian **Yang menunggu** menampilkan hal yang menunggu tindakan Anda.

## 7.3 Struktur sekolah dan tahun ajaran 〔4.0〕

PINTAR menyusun sekolah dalam tiga tingkat:

- **Bagian**, misalnya SD, SMP, SMA, atau Program Pengembangan Profesi,
- **Tingkat**, misalnya Kelas 7,
- **Kelas**, misalnya 7A.

Di layar tertulis: «Susun sekolah dari atas ke bawah: Bagian, lalu Tingkat, lalu Kelas…». Setiap kelas terikat pada satu tahun ajaran, ditulis seperti «2026/2027».

**Tahun ajaran** di PINTAR berjalan tetap dari 1 Juli sampai 30 Juni dan tidak dibagi semester. Tanggal tahun ajaran yang dapat diubah ditunda ke setelah 4.2 〔belum ditetapkan〕.

**Menonaktifkan kelas** memerlukan konfirmasi dan alasan. PINTAR menolak menonaktifkan kelas yang masih berisi murid: «Masih ada murid di sini. Pindahkan mereka dulu.» Kelas yang sudah dinonaktifkan tidak dapat diaktifkan kembali dari layar, tetapi namanya boleh dipakai lagi. Mengaktifkan kembali atau memindahkan kelas direncanakan untuk 4.2 〔4.2 · direncanakan〕.

## 7.4 Batas ketuntasan 〔4.0〕

**Batas ketuntasan** adalah nilai minimum, dalam persen bulat dari 0 sampai 100, yang menentukan apakah murid mencapai target pada Uji Penguasaan. Admin sekolah menetapkannya dengan tombol «Tetapkan».

- Tidak ada nilai bawaan. Sekolah harus menetapkannya secara sadar.
- Guru belum dapat menyediakan materi untuk kelas sebelum batas ketuntasan ditetapkan.
- Perubahan batas ketuntasan hanya berlaku untuk penugasan yang dibuat setelahnya. Hasil dan sertifikat yang sudah ada tidak berubah.

> **Mengapa begini?** Murid berhak tahu target yang berlaku saat ia belajar. Jika target berubah di tengah jalan, hasil yang sudah diraih tetap dinilai dengan aturan yang berlaku waktu itu.

## 7.5 Mendata murid dan staf 〔4.0〕

**Pendataan** («Menambahkan orang») dilakukan sekaligus dari berkas, misalnya data dari Excel. Langkahnya: cocokkan kolom, periksa pratinjau, lalu selesai dengan «Ya, catat orang-orang ini». Untuk data besar, PINTAR memproses 50 orang pertama sebagai uji coba. Setelah Anda memeriksanya, tekan «Sudah saya periksa, lanjutkan sisanya».

Perlu diingat: «Pendataan tidak membuat akun». Pendataan mencatat orangnya. Akun dibuat melalui aktivasi (7.6).

Setelah didata, murid **ditempatkan** di kelas. Murid ikut tahun ajaran kelasnya. Staf tidak pernah menjadi murid.

Setiap murid memiliki **No. Registrasi Sekolah**.

**Belum tersedia di 4.0:** menambahkan satu orang di luar pendataan berkas, dan membetulkan nama setelah aktivasi oleh sekolah 〔4.2 · direncanakan〕. Sampai saat itu, koreksi nama dilakukan oleh Admin PINTAR (Bab 6.4).

## 7.6 Mengaktifkan akun: kartu kelas murid dan aktivasi staf 〔4.0〕

Di halaman **Aktifkan akun** ada dua jalan:

- **«Aktifkan dengan email»** untuk staf. Staf menerima petunjuk lalu mengaktifkan akunnya sendiri (Bab 5.2).
- **«Buat kartu kelas»** untuk murid.

**Kartu kelas untuk satu kelas sekaligus.** Pilih kelas, tekan «Buat kartu untuk kelas ini», lalu «Cetak kartu kelas». Setiap kartu memuat nomor kartu dan PIN. «PIN hanya ditampilkan sekali», jadi cetak dan bagikan kartunya dengan rapi. Kartu kelas tidak memuat foto murid.

Saat murid pertama kali masuk dengan kartunya, pendaftarannya menjadi aktif.

> **Contoh** Pada minggu pertama Juli, Pak Hendra, operator SMP Negeri 3, membuat kartu untuk enam kelas 7. Ia mencetak lembar kartu per kelas, memasukkannya ke amplop berlabel nama kelas, dan menyerahkannya kepada wali kelas masing-masing.

## 7.7 Kartu hilang atau PIN terlupa 〔4.0〕

Murid tidak memerlukan email, sehingga pemulihan akunnya dibantu sekolah.

1. Buka **Aktifkan akun** › «Kartu hilang atau rusak».
2. Tekan «Terbitkan kartu baru». Konfirmasinya: «Kartu lama akan langsung berhenti berlaku. Terbitkan kartu baru sekarang?»
3. Serahkan kartu baru kepada murid.

Semua hasil belajar murid tetap utuh. Hanya kartunya yang berganti.

Sekolah hanya dapat melakukan ini untuk murid yang **saat ini** terdaftar di sekolah itu. Nomor registrasi lama saja tidak memberi kewenangan.

Untuk staf yang pemulihan PIN-nya tertutup, Admin sekolah dapat memakai **Keamanan akun** › «Atur ulang pemulihan PIN», dengan alasan. Pemiliknya kemudian membuat PIN baru di **Akun saya**.

## 7.8 Peran staf 〔4.0〕

Di **Peran & akses**, Admin sekolah memberi peran kepada staf: Guru, Kepala departemen, Dekan, atau Admin sekolah. Peran Admin PINTAR tidak pernah diberikan oleh sekolah.

- Setiap peran wajib memiliki tanggal «Berlaku sampai».
- Tidak ada yang dapat memberi peran kepada dirinya sendiri atau menaikkan kewenangannya sendiri.
- Memberi peran Admin sekolah memerlukan konfirmasi kedua.

**«Ubah peran & tanggung jawab»** mengubah peran seseorang dalam satu langkah. PINTAR menampilkan pratinjau tanggung jawab yang didapat, yang tetap, yang hilang, dan yang tidak diberikan. PINTAR juga memperingatkan jika ada keputusan yang akan tertinggal tanpa penanggung jawab.

Tanggung jawab ditampilkan dengan kalimat yang mudah dipahami, misalnya «Menyediakan materi untuk kelas», «Menyetujui isi paket», «Menerbitkan paket dan mengelola sertifikat», «Mendata orang dan mengaktifkan akun», atau «Mengatur sesi asesmen murid».

**«Perpanjang peran»** memperpanjang masa berlaku sebelum habis. PINTAR mengingatkan 30 hari sebelumnya (Bab 6.6).

**Peran di dua sekolah** dan **jabatan resmi** direncanakan untuk 4.2 (Bab 4.5).

## 7.9 Memindahkan murid antarkelas 〔4.0〕

«Pindah kelas» memindahkan murid ke kelas lain di sekolah yang sama dan tahun ajaran yang sama. Muridnya tetap orang yang sama.

- Pekerjaan lama tetap tercatat di kelas tempat pekerjaan itu dilakukan.
- Kelas lama berhenti menghitung murid itu, dan kelas baru mulai menghitungnya.
- Anda memerlukan kewenangan Admin sekolah atas kelas asal dan kelas tujuan.

**Lalu apa yang terjadi?** Murid melihat tugas kelas barunya. Guru kelas lama tidak lagi melihat murid itu dalam ringkasan kelasnya, tetapi bukti lama tetap ada di kelas lama.

## 7.10 Perpindahan murid ke sekolah PINTAR lain 〔4.0〕

Jika murid pindah ke sekolah lain yang juga memakai PINTAR, perpindahannya dilakukan bersama oleh kedua sekolah:

1. **Sekolah asal** mencari sekolah tujuan menurut nama atau kodenya, lalu menekan «Ajukan perpindahan ke sekolah lain» dengan alasan.
2. **Sekolah tujuan** melihat permintaan itu dan menekan «Terima perpindahan», sambil memilih tahun ajaran dan kelas tujuan. Sekolah tujuan juga dapat menolak.
3. **Sekolah asal** melaksanakan perpindahan.

Status perpindahan tampil sebagai Diajukan, Disetujui, Selesai, Ditolak, atau Dibatalkan.

**Lalu apa yang terjadi?**

- Pendaftaran di sekolah asal berakhir sebagai pindah keluar, dan sesi asesmen yang masih terbuka diakhiri.
- Hasil dan sertifikat lama tetap tercatat atas nama sekolah asal dan murid itu.
- Mulai saat itu, sekolah tujuan yang mengatur akses murid.
- Satu identitas yang sama tidak memberi akses ke seluruh sekolah dan tidak membuka perbandingan antarsekolah.

[Perlu konfirmasi: apa yang dapat dilihat guru di sekolah tujuan dari hasil murid di sekolah asal.] [Perlu konfirmasi: murid yang belum pernah masuk saat ini belum dapat diajukan untuk perpindahan.]

## 7.11 Murid keluar, kembali, dan staf yang pindah tugas 〔4.0〕

**Mengakhiri pendaftaran murid** («Akhiri pendaftaran»). Pilih alasannya: lulus, pindah ke sekolah di luar PINTAR, pindah ke luar negeri, mengundurkan diri, meninggal dunia, atau lainnya (dengan penjelasan 10–300 karakter). Tanggal berlakunya hari ini atau sebelumnya.

- Akses murid berakhir saat dicatat.
- Hasil dan sertifikatnya tidak pernah diubah.
- Murid yang sudah keluar tampil di «Murid yang sudah keluar».

**Mendaftarkan kembali** («Daftarkan kembali») memiliki dua jenis:

- *Koreksi*, untuk membatalkan pengakhiran yang keliru;
- *Kembali*, untuk mendaftarkan kembali orang yang **sama** dengan nomor registrasi yang sama, misalnya murid yang kembali setelah cuti.

**Mengakhiri tugas staf** («Akhiri tugas di sekolah ini»). Pilih kategorinya: pensiun, mengundurkan diri, diberhentikan, pindah tugas, masa tugas selesai, salah catat, atau lainnya. Tuliskan alasan dan tanggal.

- Kewenangan staf di sekolah ini berakhir sejak permintaan berikutnya.
- Akunnya sendiri dan perannya di tempat lain tidak tersentuh.
- Semua pekerjaannya tetap tercatat atas namanya, misalnya materi yang ia tulis atau keputusan yang ia ambil.

> **Contoh** Bu Sari, guru Bahasa Indonesia, pensiun pada akhir Juni. Admin sekolah mencatat «Akhiri tugas di sekolah ini» dengan kategori pensiun. Paket pembelajaran yang ia susun tetap tercatat atas namanya dan tetap dapat dipakai guru lain.

**Sesi yang masih terbuka.** Mulai 4.1, sesi asesmen yang ditinggalkan murid ditutup secara terjadwal ketika batas waktunya lewat, dan guru dapat mengakhiri sesi satu murid (Bab 9.8). Dengan begitu, sesi yang terbuka tidak menghalangi pengakhiran pendaftaran.

Dua tampilan direncanakan untuk 4.2 〔4.2 · direncanakan〕: daftar **kelas yang belum memiliki guru** bagi Admin sekolah, dan **tampilan serah terima** bagi guru yang mengambil alih kelas, berisi pekerjaan rekannya yang masih terbuka (Bab 7.18).

## 7.12 Menjadwalkan pemeliharaan 〔4.1〕

Kadang sekolah perlu memastikan tidak ada asesmen baru yang dimulai, misalnya saat listrik atau jaringan sekolah diperbaiki. Admin sekolah dapat menjadwalkan pemeliharaan di **Konfigurasi** › «Pemeliharaan dan pengumuman»:

1. «Jadwalkan pemeliharaan».
2. Pilih lingkupnya («Untuk»): satu kelas atau lebih, atau seluruh sekolah.
3. Pilih alasannya: «Pemeliharaan rutin», «Pembaruan sistem», «Perbaikan gangguan», «Pemeliharaan jaringan atau listrik», atau «Lainnya» (maksimal 120 karakter).
4. Tetapkan waktu mulai dan selesai. «Periksa waktu ini» menunjukkan berapa banyak yang terdampak.

Selama pemeliharaan berjalan, Anda dapat «Perpanjang» (waktu selesai baru harus lebih lambat) atau «Akhiri sekarang» (dengan konfirmasi). Anda juga dapat «Terbitkan pengumuman».

**Apa yang dialami orang lain:**

- Pengguna yang terdampak melihat pemberitahuan 60, 30, dan 15 menit sebelumnya, menurut zona waktu sekolah.
- Dalam 15 menit terakhir sebelum mulai dan selama pemeliharaan, asesmen baru untuk pekerjaan yang terdampak tidak dapat dimulai.
- Asesmen yang sudah berjalan **tetap dapat diselesaikan** seperti biasa. Tidak ada jeda otomatis, tambahan waktu, atau pengumpulan paksa.
- Pemeliharaan kelas hanya memengaruhi pekerjaan kelas itu. Guru yang mengajar 7A dan 7B hanya terhalang untuk pekerjaan 7A. Di layar tertulis: «Pekerjaan {untuk} tidak dapat diubah sampai pemeliharaan selesai.»
- Selama pemeliharaan sebuah kelas, guru tidak dapat menambah waktu, melanjutkan, atau mengakhiri sesi, menyediakan materi, mengadakan Uji Cepat, atau mengubah jadwal untuk kelas itu.
- Kenaikan kelas ditolak seluruhnya jika menyentuh kelas yang sedang dipelihara.

> **Mengapa begini?** Asesmen di PINTAR saat ini tidak memiliki durasi. Tanggal penutupan tugas adalah batas waktu, bukan lama pengerjaan. Karena itu, PINTAR hanya menghalangi *awal* asesmen menjelang pemeliharaan, dan tidak menebak apakah sebuah asesmen "cukup waktu" untuk diselesaikan.

Admin sekolah tidak memiliki tombol penghentian darurat. Jika ada keadaan darurat, hubungi tim PINTAR (Bab 6.7).

## 7.13 Kesempatan tambahan untuk murid 〔4.1〕

Ketika guru meminta satu kesempatan lagi untuk seorang murid (Bab 9.8), permintaannya masuk ke **Konfigurasi** › «Permintaan kesempatan tambahan». Orang yang berwenang meninjau integritas di lingkup itu, misalnya Kepala departemen atau Admin sekolah, menekan «Setujui» atau «Tolak».

- Orang yang meminta tidak dapat menyetujui permintaannya sendiri.
- Admin PINTAR tidak menyetujui kesempatan untuk sesi akademik.
- Hasil sebelumnya tidak berubah sama sekali.

## 7.14 Kenaikan kelas dan kelulusan 〔4.0〕

Di akhir tahun ajaran, Admin sekolah mencatat apa yang terjadi pada setiap murid di **Kenaikan kelas dan kelulusan**. Prosesnya tiga langkah:

1. **«Pilih kelas»**. Kelas ditampilkan menurut tahun ajaran.
2. **«Keputusan untuk setiap murid»**. Setiap murid harus mendapat keputusan. «Naikkan semua ke …» memilihkan naik kelas untuk semua sekaligus. Pengecualian diatur satu per satu: tinggal kelas (langsung ke tingkat yang sama di tahun berikutnya), keluar (dengan alasannya), atau ke kelas lain. Murid yang tercatat hanya di Tingkat, belum di Kelas, tetap ditampilkan dan ditandai, tidak terlewat diam-diam.
3. **«Tinjau lalu konfirmasi»**. Tinjauan memuat hasil setiap murid menurut nama, serta guru kelas asal dan kelas tujuan. Centang «Saya sudah meninjau penugasan guru», lalu tekan «Konfirmasi kenaikan kelas».

Kemungkinan hasilnya: **naik kelas**, **tinggal kelas**, **lulus**, **keluar dari sekolah**, atau **pindah**.

**Aturan yang menjaga keadilan:**

- «…semuanya diterapkan bersama atau tidak sama sekali.» Tidak ada kenaikan setengah jadi.
- Tinggal kelas dicatat langsung sebagai tinggal kelas, bukan "naik lalu dikembalikan".
- «Penugasan guru tidak ikut pindah ke tahun ajaran baru.» Guru ditugaskan kembali secara sadar untuk tahun berikutnya.
- Keanggotaan kelas lama ditutup, tidak dihapus. Tidak ada murid yang memiliki dua pendaftaran aktif.
- Sesi asesmen tetap tercatat pada angkatannya.

Setelah selesai, PINTAR menampilkan «Selesai. n murid diproses» beserta tempat setiap murid sekarang. **Jejak audit** mencatat siapa yang menjalankannya dan dengan peran apa.

> **Jika terjadi kendala** Salah mencatat keputusan seorang murid? Kenaikan kelas tidak dapat dibatalkan sekaligus. Perbaiki untuk murid itu saja, misalnya dengan «Pindah kelas» atau «Daftarkan kembali». Membatalkan satu putaran kenaikan sekaligus direncanakan untuk 4.2 〔4.2 · direncanakan〕.

> **[Ilustrasi 7.2]** Tiga langkah kenaikan kelas, dengan contoh tinjauan yang mengelompokkan murid menurut hasilnya.

**Lalu apa yang terjadi?** Pada tahun ajaran baru, murid melihat kelas barunya. Guru melihat kelas yang ditugaskan kepadanya untuk tahun itu. Laporan tahun lalu tetap ada dan tetap bermakna, karena bukti lama tetap tercatat di kelas dan tahun tempat bukti itu dibuat.

## 7.15 Sertifikat sekolah 〔4.0, dilengkapi 4.1〕

Di **Konfigurasi** › «Sertifikat sekolah», Admin sekolah dapat:

- **Mencabut** sertifikat («Cabut»), dengan alasan. Pencabutan bersifat final dan tercatat. Membatalkan pencabutan ditunda ke setelah 4.2.
- **Membetulkan atau mengganti** sertifikat («Terbitkan ulang»). Sertifikat asli tetap tersimpan, dan pemeriksaan keaslian sertifikat lama menunjukkan «Digantikan sertifikat yang lebih baru».
- Mulai 4.1, menangani sertifikat yang berstatus **«Sedang ditinjau»** setelah koreksi kunci jawaban mengubah hasil yang mendasarinya (Bab 10.8).

## 7.16 Catatan masuk dan cetak 〔4.1〕

Halaman «Catatan masuk dan cetak» menampilkan «Siapa yang masuk, gagal masuk, keluar, atau meminta cetakan resmi, selama 12 bulan terakhir.»

- Catatan ini hanya dapat dibaca: tidak dapat diekspor atau dihapus.
- Admin sekolah hanya membaca catatan sekolahnya. Admin PINTAR membaca seluruhnya.
- Anda dapat mencari nama, PINTAR ID, atau **referensi cetak** (diawali «CTK-»). Dengan begitu, jika seseorang membawa laporan cetak, Anda dapat memeriksa siapa yang mencetaknya dan kapan.
- PINTAR tidak menyimpan password, kode, PIN, alamat IP lengkap, atau jenis peramban. PINTAR juga tidak merekam klik atau halaman yang dibuka.
- Setelah 12 bulan, catatan ini dihapus.

> **Mengapa begini?** Ini akuntabilitas, bukan pengawasan. Sekolah perlu dapat memeriksa siapa yang masuk ke akun dan siapa yang mencetak laporan resmi. Sekolah tidak perlu tahu apa saja yang dilihat setiap orang.

## 7.17 Jejak audit, laporan, dan dukungan 〔4.0〕

- **Jejak audit** menampilkan tindakan penting di sekolah: siapa pelakunya, dengan peran apa, dan alasannya.
- **Laporan sekolah**: Admin sekolah dapat membuka **Ringkasan Sekolah** dan mengatur **Templat laporan** (Bab 8).
- **Laporan masalah**: daftar masalah yang dilaporkan staf beserta statusnya.
- **Peserta pengembangan profesi**: lihat Bab 12.
- **Kirim email uji** untuk memeriksa apakah email dari PINTAR sampai ke sekolah.

## 7.18 Admin sekolah di versi berikutnya

**PINTAR 4.2 · Kematangan operasional** 〔4.2 · direncanakan〕. Rencana 4.2 memuat pekerjaan yang ditunda pemilik PINTAR dari 4.1, ditambah dua pekerjaan yang ditetapkan oleh rencana pelaksanaan. Banyak di antaranya menyangkut pekerjaan Admin sekolah:

- **Jabatan resmi, riwayat jabatan, pelaksana tugas, peran yang mulai pada tanggal tertentu, dan peran di dua sekolah.** Admin sekolah mencatat tanggung jawab resmi, dan pemegang peran bekerja di sekolah yang tepat (Bab 4.5).
- **Ekspor data sekolah.** Staf yang berwenang dapat mengambil data sekolah sesuai mandatnya. Setiap ekspor disertai catatan akuntabilitasnya sendiri. Jenis data, formatnya, siapa yang boleh menerimanya, dan penanganan data sensitif akan ditetapkan dalam rencana.
- **Membuka laporan periode lalu.** Pembaca laporan yang berwenang dapat membuka laporan periode sebelumnya dengan pemilih periode. Makna laporan lama dan batas aksesnya tetap dijaga. Pernah mencetak sebuah laporan tidak dengan sendirinya memberi hak membukanya kembali.
- **Menolak permintaan akun dan mengganti password saat masuk.** Admin dapat menyelesaikan permintaan akun dengan penolakan yang jelas, dan pengguna dapat mengganti password-nya sendiri ketika sedang masuk.
- **Koreksi catatan pengembangan profesi** (mengakhiri program, mengeluarkan peserta, sekolah mengakhiri sesi pengembangan profesinya sendiri) **dan koreksi struktur sekolah** (mengaktifkan kembali atau memindahkan kelas, mengganti nama sekolah, membatalkan satu putaran kenaikan kelas sekaligus). Izin, jejak audit, dan bukti sejarahnya tetap dijaga.
- **Menambahkan satu orang di luar pendataan berkas, dan membetulkan nama setelah aktivasi.** Satu orang tetap satu identitas. Siapa yang boleh membetulkan nama, dan bagaimana nama itu tampil pada catatan yang sudah terbit, akan ditetapkan dalam rencana.
- **Daftar kelas yang belum memiliki guru.** Tampilan baca saja, dalam lingkup sekolah Anda.
- **Tampilan serah terima kelas** *(dari rencana pelaksanaan)*. Guru yang mengambil alih kelas melihat pekerjaan rekannya yang masih terbuka. Nama penyusun aslinya tetap tercatat, dan guru baru tidak mendapat akses di luar kelas itu.
- **Statistik Kesehatan soal terjadwal** *(dari rencana pelaksanaan)* (Bab 10.11).

Rincian, layar, dan urutannya ditetapkan dalam rencana 4.2.

**Bukan bagian dari 4.2.** Penegakan masa simpan data tidak termasuk daftar 4.2; versinya belum ditetapkan (Bab 6.10).

**Setelah 4.2, kecuali diputuskan lain** 〔belum ditetapkan〕: menutup atau mengarsipkan sekolah; fondasi di atas beberapa sekolah; tanggal tahun ajaran dan semester yang dapat diubah; membatalkan pencabutan sertifikat; memulihkan rilis materi yang sudah ditarik; penyesuaian materi platform oleh sekolah; pengarahan (*briefing*); serta penghapusan data murid dan keluarga, yang memerlukan kajian hukum. Versi pastinya belum ditetapkan. [Perlu konfirmasi: maksud "pengarahan" dalam catatan keputusan.]

---

# Bab 8 · Pimpinan: Kepala departemen dan Dekan

Bab ini untuk orang yang memimpin sebagian atau seluruh sekolah: kepala jurusan, koordinator mata pelajaran, wakil kepala bidang kurikulum, kepala sekolah, atau dekan. Di PINTAR, kepemimpinan dijalankan dengan dua peran, **Kepala departemen** dan **Dekan**. Halaman utamanya adalah **Pimpinan**.

## 8.1 Dua peran pimpinan

**Kepala departemen** memegang semua kewenangan Guru dalam lingkupnya. Selain itu, Kepala departemen:

- meninjau dan menyetujui materi di Studio. Kepala departemen tidak dapat *menerbitkan*; penerbitan dilakukan oleh orang lain dengan kewenangan menerbitkan (Bab 10);
- membuat dan mengunci terbitan;
- memeriksa sinyal mutu soal (**Kesehatan soal**);
- meninjau catatan integritas;
- menyetujui permintaan kesempatan tambahan untuk murid;
- memutuskan hal yang menunggu di **Pimpinan**.

**Dekan** melihat gambaran lingkup yang ia pimpin: daftar murid dan ringkasan, serta memutuskan hal yang menunggu di **Pimpinan**. Dekan tidak mengubah materi atau data. Senioritas tidak menambah hak mengubah.

> **Mengapa begini?** Memimpin berarti memahami dan memutuskan, bukan mengubah catatan orang lain. Karena itu, peran Dekan sengaja terbatas pada melihat dan memutuskan.

Untuk kepala sekolah, lihat Bab 4.3.

## 8.2 Lingkup yang Anda pimpin 〔4.0〕

Semua yang Anda lihat dibatasi oleh **lingkup** Anda. Di layar tertulis: «Lingkup yang Anda pimpin». Jika lingkup Anda Bagian SMP, Anda melihat kelas-kelas SMP. Halaman di luar lingkup ditolak dengan sopan: «Halaman ini untuk Kepala departemen dan Dekan, dalam lingkup yang mereka pimpin.»

Ringkasan seluruh sekolah hanya terbuka bagi pimpinan yang lingkupnya mencakup seluruh sekolah.

## 8.3 Halaman Pimpinan: apa yang menunggu Anda 〔4.0〕

Halaman **Pimpinan** dibuka dengan pertanyaan «Apa yang menunggu Anda». Di sini Anda melihat hal yang perlu diputuskan dalam lingkup Anda. Untuk setiap hal, Anda dapat menekan «Saya yang menangani», sehingga rekan lain tahu bahwa hal itu sudah ada yang mengurus, lalu «Catat keputusan» setelah Anda memutuskan.

Halaman ini juga menampilkan gambaran per topik untuk lingkup Anda. Pertanyaan yang biasanya dijawab Kepala departemen di sini: «Kelas mana… paling perlu perhatian?»

**Murid dalam lingkup ini** menampilkan nama murid saja. Di layar tertulis: «Membuka catatan satu murid adalah tindakan tersendiri, dan tercatat.»

> **Contoh** Pak Yusuf, Kepala departemen Matematika, membuka **Pimpinan** pada Senin pagi. Ia melihat bahwa topik pecahan di kelas 7 paling sering berada di pita «Perlu penguatan». Ia tidak membuka catatan murid satu per satu. Ia mengajak tiga guru kelas 7 berdiskusi di rapat MGMP sekolah tentang cara mengajarkan penyamaan penyebut.

## 8.4 Ringkasan Sekolah dan Ringkasan Kelas 〔4.0〕

**Ringkasan Sekolah** menunjukkan kesiapan per mata pelajaran untuk seluruh sekolah. Laporan ini dapat dicetak sebagai ringkasan A4 untuk rapat. **Ringkasan Kelas** juga dapat dibuka oleh Kepala departemen, tanpa bagian yang memuat nama murid perorangan; bagian itu hanya untuk guru kelasnya.

Angka yang Anda temui meliputi «Pemahaman», «Kenaikan» (perubahan dari Pemetaan Awal), «Sebaran hasil Uji Penguasaan», «Penguasaan per topik», «Pemahaman keliru yang berulang», «Soal wajib», «Capaian kompetensi», dan «Sertifikat terbit». Untuk sertifikat, yang ditampilkan hanya jumlah dan fakta verifikasinya.

**Pita kesiapan.** Laporan memakai tiga pita:

| Pita | Artinya |
|---|---|
| **Mantap** | Sekitar 80% atau lebih. |
| **Berkembang** | Sekitar 60% sampai 79%. |
| **Perlu penguatan** | Di bawah 60%, atau ada soal wajib yang belum tepat. |

Pita ini membantu membaca laporan. Pita tidak menentukan sertifikat dan tidak menghakimi murid.

## 8.5 Membaca laporan dengan jujur: apa yang dapat dan tidak dapat disimpulkan 〔4.0〕

Pimpinan sering diminta mengambil kesimpulan dari angka. PINTAR membantu dengan menunjukkan batasnya:

- **Jumlah data minimum.** Angka kelas memerlukan sedikitnya lima murid. Angka kompetensi dan kenaikan di tingkat sekolah memerlukan sedikitnya sepuluh. Pola pemahaman keliru memerlukan sedikitnya lima murid per pola. Statistik per soal memerlukan sedikitnya tiga puluh jawaban.
- **Di bawah minimum**, angka ditahan dan layar menulis bahwa datanya belum cukup, misalnya «belum cukup data, Sekarang n murid; perlu 5». Layar tidak menulis nol. «Belum ada bukti» hanya muncul jika sama sekali belum ada bukti.
- **Angka gabungan** ditahan jika salah satu bagiannya terlalu kecil. Angka itu tidak dihitung ulang dengan diam-diam membuang bagian yang kecil.
- **Murid dihitung sekali.**
- **Tidak ada perbandingan antarsekolah.** Laporan PINTAR bukan alat pemeringkatan sekolah.

Seorang Dekan dalam rapat harus dapat menjelaskan mengapa sebuah angka ditahan. Jawabannya selalu sama: bukti yang ada belum cukup untuk mendukung angka itu.

## 8.6 Catatan integritas 〔4.0〕

Kepala departemen dapat membuka **Tinjauan Integritas**. Catatan integritas, misalnya pola pengerjaan yang tidak biasa, ditinjau oleh manusia. Catatan itu:

- tidak pernah mengubah nilai,
- tidak pernah dilihat murid,
- bukan bukti kesalahan, melainkan sesuatu yang perlu diperiksa dengan bijak.

Mengakhiri sesi asesmen karena alasan integritas hanya dapat dilakukan oleh orang yang berwenang meninjau integritas.

## 8.7 Uji Cepat dan pengembangan profesi 〔4.0〕

- Kepala departemen dapat mengadakan **Uji Cepat** di Bagian yang ia pimpin, seperti guru (Bab 9.5).
- Pimpinan **mengawasi** pengembangan profesi guru, tetapi tidak menugaskannya. Penugasan dilakukan fasilitator (Bab 12). Hasil pengembangan profesi tidak muncul di layar keputusan manajemen.

## 8.8 Mendukung guru 〔4.0 dan seterusnya〕

Pimpinan dapat mendukung guru dengan cara yang sejalan dengan prinsip PINTAR:

- Membaca **Pimpinan** dan **Ringkasan Sekolah** untuk menemukan topik yang perlu dibahas bersama, bukan guru yang perlu ditegur.
- Menyetujui kesempatan tambahan bagi murid dengan cepat dan adil (Bab 7.13).
- Meninjau materi di Studio dengan catatan yang membantu penyusun memperbaikinya (Bab 10).

**Ringkasan otomatis untuk pimpinan** (taklimat) disembunyikan di 4.0 〔belum ditetapkan〕.

## 8.9 Pimpinan di PINTAR 4.5: evaluasi guru yang diatur institusi 〔4.5 · arah〕

Mulai 4.5, PINTAR mendukung **evaluasi resmi terhadap guru** yang diatur dan disegel oleh manusia. Inilah satu-satunya jalan bagi bukti tentang guru untuk menjadi penilaian resmi. Prosesnya sudah disetujui dalam garis besar:

1. Institusi menetapkan periode evaluasi dan aturan bukti yang sah.
2. Bukti yang sah terkumpul, beserta asal-usul, lingkup, revisi, keikutsertaan, pengecualian, dan kondisi asesmen yang tidak biasa. Keputusan asesmen yang diambil guru tetap terlihat.
3. Periode ditutup menurut kebijakan institusi, sehingga jelas bukti apa yang tersedia pada titik itu.
4. PINTAR menyiapkan **draf berbasis bukti**. Draf ini menyebutkan keterbatasan dan ketidakpastiannya, dan tidak memuat kesimpulan yang tidak didukung bukti.
5. **Penilai manusia yang berwenang** meninjau draf, termasuk bukti yang mendukung dan yang bertentangan.
6. Penilai dapat menerima atau menyesuaikan kesimpulan dan skor menurut rubrik yang disepakati.
7. Setiap penyesuaian disertai alasan yang tercatat.
8. Draf asli dan keputusan penilai disimpan, dengan bukti yang dapat ditelusuri, aturan berversi, dan akses yang tercatat.
9. Penilai menyelesaikan dan **menyegel** evaluasi. Evaluasi yang tersegel dapat ditampilkan kembali persis seperti saat disegel.
10. Guru menerima evaluasi yang sudah final.
11. Evaluasi menyajikan bukti pendukung, kekuatan, hal yang perlu diperhatikan, dan rekomendasi yang spesifik.
12. Aturan tentang pemeriksaan, koreksi, tanggapan guru, siapa yang boleh membaca, dan masa simpan diterapkan.

**Perlindungan bagi guru:**

- Bukti yang tidak cukup atau tidak dapat dibandingkan tidak dapat mendukung kesimpulan resmi.
- Tidak ada peringkat guru otomatis, perbandingan antara guru yang disebut namanya, atau sanksi otomatis.
- Guru memiliki hak yang sesuai untuk memeriksa dan menanggapi.
- Umpan balik belajar sehari-hari dan pekerjaan pengembangan diri yang bersifat pribadi dipisahkan dari evaluasi resmi.
- Akses ke bukti yang berkaitan dengan guru diatur berlapis dan tercatat.

**Yang masih akan diputuskan.** Kebijakan evaluasi resmi diputuskan tersendiri oleh pemilik PINTAR bersama institusi. Kebijakan itu menetapkan siapa penilainya, periode, rubrik dan kewenangan skor, hak pemeriksaan dan tanggapan, apakah tanggapan guru ikut disegel, siapa yang membaca, dan masa simpannya. Sampai kebijakan itu ditetapkan, buku ini tidak menjelaskan langkah-langkah layarnya.

> **Mengapa begini?** Evaluasi guru menyangkut karier seseorang. Karena itu, PINTAR hanya boleh menyiapkan draf yang jujur tentang keterbatasannya. Penilaian dan segelnya tetap tanggung jawab manusia yang berwenang.

## 8.10 Pimpinan di PINTAR 5.0: perbaikan di tingkat bagian dan sekolah 〔5.0 · arah〕

Mulai 5.0, siklus "pahami, pilih, bertindak, amati, bandingkan, renungkan, perbaiki" (Bab 15) dapat dijalankan di tingkat departemen atau sekolah. Pimpinan yang berwenang membaca **angka gabungan**, memilih tindakan perbaikan, lalu meninjau apa yang terjadi. Catatan perorangan tetap terlindungi: hak melihat angka gabungan tidak memberi hak membuka catatan seseorang.

Model institusi yang lebih luas, misalnya yayasan dengan banyak unit sekolah, masih merupakan keputusan arsitektur yang terbuka 〔belum ditetapkan〕.

---

# Bab 9 · Guru

Bab ini untuk guru, dosen, dan fasilitator yang memegang peran **Guru**. Halaman utamanya adalah **Mengajar**. Jika Anda juga menyusun materi, baca Bab 10. Jika Anda membimbing pengembangan profesi rekan guru, baca Bab 12.

## 9.1 Perjalanan seorang guru

Inilah perjalanan seorang guru di PINTAR, dari menyiapkan materi hingga bertumbuh sebagai pendidik:

1. **Menyiapkan materi.** Guru memakai materi standar dari Pustaka PINTAR atau materi sekolahnya sendiri. Jika menyusun materi sendiri, materinya ditinjau orang kedua sebelum diterbitkan (Bab 10).
2. **Menyediakan materi untuk kelas.** Guru memilih materi yang sudah terbit dan menetapkan jendela waktunya.
3. **Murid belajar.** Murid mengerjakan Pemetaan Awal, membaca menurut Peta Bacaan Personal, lalu mengerjakan Uji Penguasaan.
4. **Membaca bukti.** Guru melihat ringkasan kelas, soal yang sulit, dan murid yang perlu penguatan.
5. **Memutuskan langkah berikutnya.** Guru memutuskan apa yang diulang, untuk siapa, dan apa yang dilanjutkan. Guru dapat meminta murid membaca lagi materi tertentu.
6. **Menjaga keadilan.** Guru mengatur sesi asesmen satu murid bila perlu, misalnya memberi tambahan waktu atau meminta satu kesempatan lagi.
7. **Melihat bukti berikutnya.** Guru membandingkan bukti baru dengan yang lama.
8. **Bertumbuh.** Guru mengikuti pengembangan profesi (Bab 12).

Mulai **4.5**, PINTAR membantu guru memahami apa yang sebenarnya didukung oleh bukti (9.13). Mulai **5.0**, guru dapat memilih tindakan perbaikan, mengamati apa yang terjadi, dan merenungkan efektivitasnya (9.14).

## 9.2 Halaman Mengajar 〔4.0〕

Halaman **Mengajar** menyapa Anda sesuai waktu: «Selamat pagi», «Selamat siang», «Selamat sore», atau «Selamat malam». Halaman ini menunjukkan:

- **«Layak dikerjakan lebih dulu»**, satu tindakan berikutnya yang paling berguna;
- **«Kelas dalam lingkup mengajar Anda»**;
- **«Sedang berjalan»**, misalnya Uji Cepat yang masih terbuka.

Jika tidak ada yang perlu Anda putuskan: «Tidak ada yang menunggu keputusan Anda hari ini.»

Anda hanya melihat kelas yang ditugaskan kepada Anda. Halaman kelas lain akan ditolak.

**Halaman kelas** memuat tindakan «Siapkan», «Uji Cepat», «Lihat bukti», dan «Langkah berikutnya», serta bagian «Materi untuk kelas ini» dan «Murid». Daftar murid diurutkan menurut abjad: «Nama diurutkan abjad; tidak ada peringkat.»

## 9.3 Menyediakan materi untuk kelas 〔4.0〕

Menyediakan materi berarti memberikan satu bab, berupa Paket Pembelajaran yang sudah terbit, kepada kelas Anda. Langkahnya, dari halaman kelas › «Siapkan»:

1. **«Pilih materi»**. Anda melihat materi standar PINTAR dan materi sekolah, dengan asal-usulnya.
2. **«Tinjau yang akan diterima murid»**.
3. Tetapkan **«Jendela»**, yaitu kapan materi «Mulai» dan «Sampai». Waktu mengikuti zona sekolah.
4. **«Sediakan»**. Hasilnya: «Materi disediakan untuk kelas ini.»

Sebelum menekan «Sediakan», layar mengingatkan bahwa Anda «…tidak bisa menarik kembali pekerjaan yang sudah dimulai murid.»

**PINTAR menolak menyediakan materi jika:**

- babnya belum memiliki Pemetaan Awal dan Uji Penguasaan, atau
- sekolah belum menetapkan batas ketuntasan (Bab 7.4).

> **Mengapa begini?** Tanpa Pemetaan Awal, PINTAR tidak dapat menyusun Peta Bacaan Personal dan tidak dapat menghitung kenaikan. Tanpa batas ketuntasan, hasil Uji Penguasaan tidak memiliki target yang jelas.

**Menerbitkan tidak sama dengan menyediakan.** Materi yang sudah terbit di Studio belum otomatis sampai ke murid. Guru yang menyediakannya untuk kelas.

**Mengakhiri atau menarik penugasan.** Di «Akhiri atau tarik penugasan», pilih:

- «Diakhiri: materi sudah selesai dibahas» → «Akhiri penugasan», atau
- «Ditarik: diberikan karena keliru» → «Tarik penugasan».

Pekerjaan murid yang sudah selesai tetap tersimpan.

**Mengubah jadwal** 〔4.1〕. «Ubah jadwal» menetapkan jendela baru, dengan alasan. Sesi asesmen yang sudah terbuka tetap memakai batas waktunya sendiri.

## 9.4 Apa yang dialami murid 〔4.0〕

Setelah materi disediakan, murid melihatnya di halaman **Belajar**. Murid mengerjakan **Pemetaan Awal** (satu kali), membaca pelajaran menurut **Peta Bacaan Personal**, lalu mengerjakan **Uji Penguasaan** (dua kesempatan). Rinciannya ada di Bab 11. Pahamilah alurnya dari sisi murid, karena laporan Anda bersumber dari langkah-langkah ini.

[Perlu konfirmasi: jumlah kesempatan per jenis asesmen, yaitu Pemetaan Awal 1 kali dan Uji Penguasaan 2 kali.]

## 9.5 Uji Cepat 〔4.0〕

**Uji Cepat** adalah asesmen singkat di kelas untuk memeriksa pemahaman saat itu juga, misalnya di akhir pelajaran.

1. Dari halaman kelas › «Uji Cepat», pilih bank soal atau topik.
2. Lihat soal-soal yang tersedia, lalu centang yang ingin dipakai.
3. «Tinjau».
4. «Sediakan Uji Cepat sekarang», dengan durasi dalam menit. Uji Cepat tertutup sendiri setelah waktunya habis.
5. Murid menjawab. Selama berjalan, Anda melihat «Uji Cepat sedang berjalan».
6. «Hasil Uji Cepat» menampilkan skor kelas lebih dulu, lalu skor setiap murid bila Anda membukanya, lalu hasil per soal. Daftarnya «Diurutkan abjad. Bukan peringkat.»

**Aturan Uji Cepat:**

- Anda memilih dari soal yang sudah ada. Uji Cepat bukan tempat menulis soal baru.
- Uji Cepat **tidak pernah** menerbitkan sertifikat dan tidak dihitung dalam catatan penguasaan murid.
- Uji Cepat yang sudah lewat tidak menghalangi Uji Cepat berikutnya.
- Menghentikan Uji Cepat sebelum waktunya belum tersedia 〔belum ditetapkan〕.

## 9.6 Membaca bukti kelas 〔4.0〕

Setelah murid bekerja, PINTAR membantu Anda menjawab pertanyaan yang paling penting. Halaman-halamannya diberi judul sesuai pertanyaan itu:

- **«Apa yang sudah bisa disimpulkan»**, yaitu **Ringkasan Kelas**. Isinya pita kesiapan (Mantap, Berkembang, Perlu penguatan), nama murid yang perlu penguatan, topik terlemah, dan kenaikan dari Pemetaan Awal. Jika data belum cukup: «Belum cukup bukan berarti buruk — artinya belum.»
- **«Siapa yang sudah mengumpulkan»**.
- **«Soal mana yang sulit bagi kelas ini»**, yaitu **Per soal**. Halaman ini menampilkan berapa yang menjawab benar dan pilihan mana yang dipilih. Per soal hanya terbuka setelah asesmen dikumpulkan atau ditutup, bukan selama murid sedang mengerjakan. Untuk Uji Cepat, Per soal terbuka segera setelah ditutup.
- **«Catatan murid»**, yaitu halaman satu murid: kemajuan, hasil, penguasaan, dan tujuan pembelajaran yang belum tercapai. Halaman ini tampilan pendidikan, bukan berkas pribadi, dan tidak memuat catatan integritas.

Guru tidak melihat catatan integritas dan statistik Kesehatan soal. Keduanya ditangani pimpinan dan peninjau.

> **Contoh** Bu Rina membuka «Soal mana yang sulit bagi kelas ini» untuk Uji Penguasaan pecahan di kelas 7B. Soal 4 hanya dijawab benar oleh 7 dari 24 murid, dan 12 murid memilih jawaban B, yang menjumlahkan penyebutnya. Dua tujuan lain di bab itu sudah lebih kuat. Bu Rina menyimpulkan bahwa yang perlu diulang mungkin hanya satu bagian, bukan seluruh bab. Ia mencatat untuk dirinya sendiri: besok minta beberapa murid menjelaskan cara mereka menjawab soal 4, lalu ulang penyamaan penyebut dengan pita pecahan bila perlu.

> **[Ilustrasi 9.1]** Laporan satu soal dengan tiga catatan bernomor tentang apa yang diperhatikan guru. Diberi label "Ilustrasi konsep · data contoh".

## 9.7 Memutuskan langkah berikutnya 〔4.0〕

PINTAR tidak memberikan perbaikan otomatis. Andalah yang memutuskan. Ada dua cara yang tersedia di PINTAR:

- **«Minta membaca lagi»**. Minta murid tertentu membaca kembali bagian tertentu. Murid melihat permintaan itu di halaman **Belajar** sebagai «Diminta guru Anda». «Hasil murid tidak berubah, dan tidak ada tes baru.»
- **Memberikan materi lagi** kepada murid tertentu yang belum mencapai target.

Selebihnya, langkah berikutnya terjadi di kelas Anda: penjelasan ulang, contoh baru, kerja kelompok, atau bimbingan.

## 9.8 Mengatur sesi asesmen satu murid 〔4.1〕

Kadang keadaan seorang murid membutuhkan perlakuan khusus. Mulai 4.1, Anda dapat mengatur sesi asesmen satu murid dari daftar «Siapa yang sudah mengumpulkan», dengan tombol «Atur» di baris murid itu. Setiap tindakan memerlukan alasan dan tercatat.

**«Tambah waktu»**. Tambahkan 1 sampai 120 menit, paling banyak tiga kali, untuk satu sesi yang masih terbuka. Konfirmasinya, misalnya: «Tambah 15 menit untuk Raka? Batas baru 10.45.»

**«Akhiri sesi»**. Akhiri sesi satu murid. Tidak ada pilihan bawaan, jadi Anda harus memilih salah satu dengan sadar:

- **«Akhiri dan nilai»**. Sesi dinilai dari jawaban yang sudah diterima dan memakai satu kesempatan.
- **«Akhiri tanpa menghitung»**. Tidak ada hasil, tidak memakai kesempatan, dan jawaban tetap tersimpan. Gunakan ini untuk keadaan seperti murid yang keliru membuka asesmen atau gangguan teknis.

**«Minta satu kesempatan lagi»**. Minta kesempatan tambahan untuk seorang murid, dengan alasan. Kesempatan itu baru berlaku setelah disetujui **orang lain** yang berwenang meninjau integritas di lingkup itu, misalnya Kepala departemen atau Admin sekolah (Bab 7.13). Selama menunggu, murid tidak melihat apa-apa, dan tidak pernah melihat kata "ditolak". Setelah disetujui, tombol «Mulai» muncul kembali bagi murid. Hasil sebelumnya tetap persis sama.

**«Lanjutkan»** untuk sesi yang ditahan. Jika murid ditangguhkan saat mengerjakan asesmen, sesinya tampil «Ditahan». Setelah penangguhan dicabut, pilih «Lanjutkan» dengan sisa waktu yang persis sama, atau «Akhiri tanpa menghitung».

**Yang tidak dapat dilakukan:**

- mengatur sesi murid di kelas yang bukan kelas Anda,
- menambah waktu pada sesi yang sudah berakhir,
- meminta kesempatan lagi ketika masih ada sesi yang terbuka,
- mengubah jawaban yang sudah tercatat atau hasil yang sudah selesai,
- mengakhiri sesi karena alasan integritas (hanya untuk peninjau integritas),
- mengatur sesi pengembangan profesi.

Selama pemeliharaan terjadwal untuk kelas itu, menambah waktu, melanjutkan, dan mengakhiri sesi juga ditolak. Menolak permintaan kesempatan yang masih menunggu tetap dapat dilakukan.

> **Contoh** Pada hari Uji Penguasaan, Sinta terlambat 20 menit karena banjir di jalan menuju sekolah. Bu Rina menambah 20 menit untuk sesi Sinta dengan alasan "terlambat karena banjir". Tambahan itu tercatat dan hanya berlaku untuk Sinta.

> **Mengapa begini?** Keputusan untuk seorang murid harus adil, tercatat, dan tidak boleh mengubah bukti yang sudah ada. Meminta kesempatan tambahan memerlukan orang kedua, agar tidak ada yang memberi kesempatan kepada dirinya sendiri atau kepada muridnya tanpa pemeriksaan.

## 9.9 Ketika batas waktu lewat, atau sesi ditinggalkan 〔4.1〕

- Sesi yang batas waktunya lewat ditutup oleh PINTAR. Sesi itu dinilai dari jawaban yang sudah tercatat dan memakai satu kesempatan. Soal yang belum dijawab tetap tidak terjawab. Murid dan guru diberi tahu bahwa sesi berakhir karena batas waktunya lewat, bukan karena dikumpulkan.
- Sesi yang tidak memiliki batas waktu sendiri berakhir ketika jendela penugasannya ditutup atau penugasannya diakhiri.
- Murid mendapat pemberitahuan yang berbeda untuk setiap keadaan: diakhiri dan dinilai, diakhiri dan tidak dihitung, atau penugasannya diakhiri.

## 9.10 Ketika kunci jawaban dikoreksi 〔4.1〕

Jika ternyata kunci jawaban sebuah soal keliru, kuncinya dikoreksi melalui proses dua orang di Studio (Bab 10.8). Bagi guru:

- «Per soal» menandai kunci yang berlaku dan memberi catatan bahwa kunci soal ini sudah diperbaiki, beserta kunci aslinya.
- Hasil murid yang terdampak dihitung ulang dari jawaban aslinya. Murid melihat tanda «Dihitung ulang».
- Pola pemahaman keliru dan Peta Bacaan mengikuti kunci yang sudah diperbaiki.
- Penjelasan yang sudah tidak cocok karena koreksi itu ditarik.

## 9.11 Bila murid berpindah perangkat 〔4.1〕

PINTAR 4.1 merencanakan pemulihan antarperangkat dengan satu aturan dasar: **satu sesi hanya boleh ditulis dari satu perangkat pada satu waktu**.

- Untuk asesmen berisiko rendah, murid dapat melanjutkan di perangkat lain setelah masuk kembali.
- Untuk **Uji Penguasaan**, perpindahan perangkat memerlukan **izin guru**, dari layar pengaturan sesi yang sama.
- Jawaban yang sudah diterima tetap tersimpan. Perangkat lama yang sudah tidak berhak tidak dapat lagi menulis jawaban.

[Perlu konfirmasi: layar dan langkah pemulihan antarperangkat karena fitur ini belum dibangun saat penyusunan.]

## 9.12 Guru di PINTAR 4.2 〔4.2 · direncanakan dan usulan〕

- **Mode Ujian** 〔4.2 · direncanakan〕. Guru menyelenggarakan, dan murid mengerjakan, asesmen dalam kondisi ujian yang dimaksud. Mode Ujian memakai perlindungan pemulihan dan "satu perangkat penulis" dari 4.1. Kondisi ujian, tindakan yang diizinkan, dan alur normal maupun saat terganggu akan ditetapkan dalam rencana 4.2.
- **Batas waktu per asesmen** 〔4.2 · usulan〕. Saat ini asesmen tidak memiliki durasi; yang ada hanya tanggal penutupan tugas. Usulan untuk 4.2 adalah agar guru dapat menetapkan durasi untuk satu asesmen dan murid memahami waktu yang tersedia. Usulan ini belum disetujui. Tujuan pendidikannya dan cara kerjanya bersama batas waktu, tambahan waktu, pemulihan, dan pemeliharaan harus disetujui lebih dulu.
- **Membuka laporan periode lalu** 〔4.2 · direncanakan〕 (Bab 7.18).

## 9.13 Guru di PINTAR 4.5: memahami apa yang didukung bukti 〔4.5 · arah〕

Mulai 4.5, PINTAR menambahkan lapisan pemahaman di atas bukti yang sudah ada. Bab 14 menjelaskannya secara lengkap. Bagi guru, perubahannya terasa seperti ini:

1. **Mutu soal diperiksa lebih dulu.** Sebelum menyimpulkan apa pun tentang murid, PINTAR memeriksa soalnya: kuncinya, revisinya, perilaku pilihan jawabannya, dan apakah buktinya cukup. Soal yang dibuat kurang baik tidak boleh dengan sendirinya dianggap sebagai tanda bahwa murid belum paham.
2. **Kompetensi yang sama dikenali sebagai sama.** Soal-soal yang menguji keterampilan yang sama dihubungkan, meskipun berada di bab, tahun, atau revisi kurikulum yang berbeda, asalkan hubungan itu sudah ditetapkan.
3. **Sebaran hasil ditampilkan dengan jujur.** Guru melihat sebaran hasil kelas, jumlah murid yang menjadi dasarnya, siapa yang dikecualikan, dan batas-batasnya.
4. **Penjelasan yang tenang.** Ketika guru membutuhkannya, PINTAR menampilkan penjelasan singkat yang relevan. Tujuannya, guru dapat mengenali prioritasnya dalam sekitar satu menit. PINTAR dapat menjelaskan pola yang didukung bukti, atau justru mengatakan bahwa kesimpulan tentang kompetensi itu belum dapat dibuat.
5. **Hipotesis prasyarat dari guru.** Guru dapat menuliskan dugaan tentang prasyarat, misalnya "mungkin murid perlu menguasai KPK sebelum menyamakan penyebut". PINTAR memperlakukannya sebagai hipotesis guru, bukan kesimpulan sistem.
6. **Keputusan tetap milik guru.** Guru memutuskan apakah akan memeriksa soalnya, mengumpulkan bukti lain, atau mengulang konsepnya.

> **Contoh** Banyak murid memilih jawaban keliru yang sama pada satu soal pecahan. PINTAR 4.5 lebih dulu memeriksa kunci, revisi, perilaku pengecoh, dan kecukupan buktinya. Ternyata kalimat soalnya ambigu. PINTAR tidak menyimpulkan bahwa murid lemah dalam pecahan. PINTAR menunjukkan bahwa soal itu perlu diperiksa. Bu Rina memutuskan untuk meminta soal itu diperbaiki melalui Studio.

## 9.14 Guru di PINTAR 5.0: bertindak, mengamati, merenungkan 〔5.0 · arah〕

Mulai 5.0, guru dapat menjalankan siklus perbaikan lengkap di PINTAR (Bab 15):

1. **Memahami.** Guru membaca penjelasan bahwa sekelompok murid mungkin kesulitan dengan pecahan, lalu memeriksa bukti dan batasnya.
2. **Memilih.** Guru memilih tindakan, misalnya mengajarkan ulang pecahan senilai dengan model visual.
3. **Bertindak.** Guru menjalankan tindakan itu. PINTAR mencatat apa yang dilakukan, untuk murid mana, kapan, dan konteksnya.
4. **Mengamati.** Bukti belajar dan asesmen berikutnya terkumpul.
5. **Membandingkan.** PINTAR membandingkan hasil hanya jika alat ukur, cakupan kompetensi, dan kelompok yang terlibat memungkinkan, dan menunjukkan pengecualian serta penjelasan lain yang mungkin.
6. **Merenungkan.** Guru memutuskan untuk melanjutkan, mengubah, atau menghentikan tindakan itu.

PINTAR hanya akan menyatakan salah satu dari tiga hal (Bab 15.3): tindakan itu *tercatat*; hasil sesudahnya *sejalan dengan perbaikan*; atau pengamatan berulang memberi *dukungan yang lebih kuat*. Perbandingan sebelum dan sesudah tidak membuktikan sebab-akibat.

Guru juga dapat memilih **tujuan pertumbuhan** sendiri yang dikaitkan dengan bukti, di bawah **Kesepakatan Pertumbuhan Bersama** yang melindungi catatan pertumbuhan dari penggunaan untuk menghukum (Bab 15.5).

---

# Bab 10 · Menyusun dan meninjau materi di Studio

Bab ini untuk semua orang yang menyusun, memeriksa, meninjau, atau menerbitkan materi: guru yang menulis paket pembelajaran, Kepala departemen yang meninjaunya, Admin sekolah yang menerbitkannya, dan Admin PINTAR yang mengurus materi standar.

## 10.1 Mengapa ada Studio

Materi pelajaran adalah dasar dari semua bukti. Jika soalnya keliru, hasilnya keliru. Karena itu, PINTAR memperlakukan materi dengan hati-hati:

- Materi disusun sebagai draf, ditinjau oleh orang kedua, lalu diterbitkan.
- Materi yang sudah terbit dan sudah dipakai murid tidak pernah diubah diam-diam. Koreksi menjadi versi baru.
- Setiap murid tetap terikat pada versi materi yang benar-benar ia kerjakan.

**Studio** adalah tempat semua ini terjadi. Menunya: «Studio», «Buat Paket», «Antrean Tinjauan», «Pustaka PINTAR», «Aturan Asesmen», «Tinjauan Integritas», «Sertifikat», «Bank Soal», dan «Uji Cepat». Setiap orang hanya melihat menu yang sesuai kewenangannya.

## 10.2 Siapa melakukan apa di Studio

| Tanggung jawab | Siapa |
|---|---|
| Menyusun paket (draf) | Guru, Kepala departemen, Admin sekolah, Admin PINTAR |
| Meninjau dan menyetujui isi | Kepala departemen, Admin sekolah, Admin PINTAR, tetapi **bukan** penyusun paket itu sendiri |
| Membuat dan mengunci terbitan | Kepala departemen, Admin sekolah, Admin PINTAR |
| Menerbitkan | Admin sekolah (materi sekolah), Admin PINTAR (materi standar). Kepala departemen tidak menerbitkan. |
| Menyediakan materi untuk kelas | Guru dan Kepala departemen, di kelasnya (Bab 9) |

Ada dua jenis asal materi:

- **Materi standar PINTAR**, di **Pustaka PINTAR**, yang disusun dan diterbitkan oleh Admin PINTAR.
- **Materi sekolah**, yang disusun di sekolah dan hanya dipakai di sekolah itu.

Materi PINTAR tidak pernah terbuka untuk umum.

## 10.3 Menyusun Paket Pembelajaran 〔4.0〕

Satu **Paket Pembelajaran** biasanya berisi satu bab: tujuan pembelajaran, bacaan, Pemetaan Awal, dan Uji Penguasaan (di buku kerja ditandai «Pemetaan awal» dan «Cek penguasaan»).

Paket disusun dengan **buku kerja** Excel:

1. Di «Buat Paket Pembelajaran», tekan «Unduh templat Excel». Contoh isian juga tersedia: «Unduh contoh isian».
2. Isi buku kerja, misalnya dengan Excel atau Google Sheets, lalu simpan sebagai .xlsx.
3. Unggah. PINTAR menjalankan «Periksa buku kerja». Jika ada masalah, PINTAR menunjukkan baris mana dan apa yang perlu diperbaiki, dalam bahasa Indonesia.
4. «Unggah media» bila ada gambar atau video.
5. «Simpan ke Studio». Hasilnya: «Tersimpan di Studio sebagai draf.»

## 10.4 Langkah menuju terbit 〔4.0〕

Di halaman paket, PINTAR menampilkan **«Langkah menuju terbit»** dalam tujuh langkah:

1. **«Susun isi»** → «Tandai sudah tersusun».
2. **«Periksa isi»** → «Tandai lolos pemeriksaan».
3. **«Ajukan untuk ditinjau»**.
4. **«Setujui isi»**, oleh peninjau yang bukan penyusun.
5. **«Buat terbitan»**.
6. **«Terbitkan»**, oleh orang yang berwenang menerbitkan.
7. **«Terbit»**.

Kapan saja, «Lihat seperti murid» menunjukkan bagaimana paket itu akan tampil bagi murid.

Aturan dua orang dijaga di setiap langkah penting: «Penyusun paket tidak bisa mengunci terbitannya sendiri.»

Ingat juga: «Menerbitkan belum menyediakan…». Materi yang terbit baru sampai ke murid setelah guru menyediakannya untuk kelas (Bab 9.3).

> **[Ilustrasi 10.1]** Alur dari draf, tinjauan orang kedua, persetujuan, sampai rilis, dengan jalur "dikembalikan dengan catatan" dan pemakaian bersama oleh institusi yang diberi izin.

## 10.5 Meninjau materi 〔4.0〕

Peninjau bekerja dari **«Antrean Tinjauan»**. Jika kosong: «Tidak ada yang menunggu tinjauan Anda.»

Peninjau membaca soal beserta kuncinya, lalu memilih:

- **Menyetujui** isi, lalu terbitan dibuat dan dikunci («Kunci»), atau
- **«Kembalikan ke penyusun»** dengan alasan sepanjang 10 sampai 1000 karakter.

Penyusun melihat siapa yang mengembalikan dan alasannya sebagai «Alasan peninjau», memperbaikinya, lalu mengunggah ulang. Alasan itu tetap tersimpan di «Riwayat perbaikan».

**Bank Soal** dipakai untuk menjelajah, menyaring, dan meninjau soal beserta kunci dan alasannya. Keputusan peninjau di Bank Soal misalnya «Sudah ditinjau, soal ini wajar». Di 4.0, Bank Soal bukan tempat menulis soal.

> **Contoh** Pak Yusuf meninjau paket "Pecahan Senilai" yang disusun Bu Rina. Pada soal 6, dua pilihan jawaban sama-sama benar. Ia mengembalikannya dengan alasan: "Pilihan B (2/4) dan D (4/8) sama-sama senilai dengan 1/2. Mohon salah satu diganti." Bu Rina memperbaikinya dan mengajukannya lagi pada hari yang sama.

## 10.6 Aturan Asesmen dan pemahaman keliru 〔4.0〕

- **Aturan Asesmen** mengatur cara sebuah asesmen dinilai dan dijalankan.
- **Pemahaman keliru** (miskonsepsi) dapat dikaitkan dengan pilihan jawaban. PINTAR memiliki definisi bersama di Pustaka PINTAR, dan sekolah dapat memiliki definisinya sendiri. Di layar, PINTAR tidak memakai kata "salah" untuk ini.
- **Soal wajib** (soal penting) adalah soal yang harus dijawab benar. Jika soal wajib belum tepat, murid berada di pita «Perlu penguatan», berapa pun persentasenya.

## 10.7 Mengoreksi materi yang sudah terbit 〔4.0, dilengkapi 4.1〕

Materi yang sudah dipakai tidak pernah diubah. Untuk mengoreksinya, terbitkan **revisi** dalam garis yang sama.

- Murid tetap terikat pada versi yang benar-benar ia lihat. Tidak ada yang diganti di tengah sesi yang sedang berjalan.
- Revisi menggantikan versi lama untuk **penugasan baru**.
- Revisi tidak memberi kesempatan baru. Batas kesempatan berlaku untuk semua versi asesmen yang sama. Jalan yang wajar untuk kesempatan tambahan adalah permintaan guru yang disetujui orang lain (Bab 9.8).
- Riwayat revisi dapat dibaca orang.

**Menarik terbitan** («Tarik») memerlukan alasan. Mulai 4.1, terbitan yang ditarik tidak dapat dimulai lagi. Guru dan murid melihat «Dihentikan penerbit · tidak dapat dimulai lagi; hasil tetap dihitung». Kata «Ditarik» hanya dipakai di dalam Studio.

**Meja kerja soal** 〔4.1〕. Mulai 4.1, soal dalam draf dapat diubah langsung di aplikasi, satu per satu, tanpa mengunggah ulang buku kerja: kalimat soal, pilihan, kunci, alasan, kode pemahaman keliru, dan tujuan pembelajaran. Tombolnya «Ubah soal ini», «Tambah soal», dan «Simpan soal». Draf juga dapat dibuang («Buang draf ini»). Setiap simpanan tercatat atas nama penyimpannya. Setelah draf diajukan untuk ditinjau, soalnya tidak dapat diubah lagi.

Satu soal dapat direvisi tersendiri. Versi barunya terhubung ke versi asli, dan «Riwayat soal (n versi)» menampilkan sejarahnya. PINTAR tidak membandingkan statistik antarversi, karena dua versi soal belum tentu dapat dibandingkan.

## 10.8 Memperbaiki kunci jawaban yang keliru 〔4.1〕

Kadang kekeliruan baru ditemukan setelah murid mengerjakan asesmen: kunci jawabannya salah. PINTAR 4.1 menyediakan proses yang adil untuk memperbaikinya.

Di soal itu, tekan «Kunci jawaban keliru?» › «Perbaiki kunci jawaban». Prosesnya tiga langkah:

1. **«Kunci yang benar»**. Pemilik materi yang berwenang mengusulkan kunci yang benar. Untuk materi sekolah, pengusulnya orang sekolah. Untuk materi standar, pemilik materi platform.
2. **«Yang terdampak»**. PINTAR menampilkan sesi yang terdampak dengan jumlah pastinya. Sekolah lain hanya tampil sebagai jumlah, tanpa nama.
3. **«Kirim untuk konfirmasi»**.

Lalu **orang yang berbeda**, yang berwenang menerbitkan atau meninjau, menekan «Konfirmasi perbaikan» atau «Tolak». Pengusul tidak melihat tombol konfirmasi.

**Lalu apa yang terjadi?**

- Setiap hasil yang terdampak dihitung ulang dari jawaban asli murid terhadap kunci yang berlaku sekarang. Layar menulis: «Selesai. n hasil dihitung ulang… Hasil asli dan jawaban murid tetap tersimpan.»
- Hasil baru menggantikan hasil lama sebagai hasil yang berlaku. Hasil lama, jawaban murid, dan otorisasi koreksi tetap dapat dilihat. Pada satu waktu, selalu tepat ada **satu** hasil yang berlaku.
- Murid melihat tanda «Dihitung ulang»: «Hasil ini dihitung ulang karena penilaian satu soal diperbaiki. Hasil asli tetap tersimpan.» Jika nilainya berubah, penjelasan soal yang sudah tidak cocok ditarik.
- Sesi yang masih terbuka dan sesi baru memakai revisi yang sudah diperbaiki.
- Sertifikat yang terdampak berpindah ke status **«Sedang ditinjau»** (Bab 13). Sertifikat yang sudah terbit tetap tersegel; sertifikat tidak diterbitkan ulang, ditulis ulang, atau dicabut secara diam-diam. Sekolah menanganinya dari «Sertifikat sekolah».
- Sekolah yang terdampak mendapat satu baris pemberitahuan di «Yang menunggu».
- Koreksi berikutnya pada soal yang sama juga diizinkan melalui proses yang sama.

> **Mengapa begini?** Murid berhak dinilai dengan kunci yang benar. Tetapi sekolah juga berhak tahu apa yang dulu tercatat. Karena itu, koreksi tidak menghapus apa pun. Koreksi menambahkan hasil baru yang berlaku, dan semua yang lama tetap dapat ditelusuri.

## 10.9 Catatan peninjau di samping soal 〔4.1〕

PINTAR 4.1 merencanakan **catatan peninjau** di samping soal yang sudah tersegel:

- Catatan diberi nama penulis dan tanggal, dan tidak dapat diubah. Penggantinya adalah catatan baru.
- Catatan menunjukkan revisi soal yang dirujuknya, dan memberi peringatan jika catatan itu ditulis sebelum kunci jawaban dikoreksi.
- Catatan tidak pernah tampil bagi murid, tidak muncul di cetakan, dan tidak masuk ke perhitungan laporan.

Catatan berkode tentang jenis pemahaman keliru belum termasuk 4.1 dan masih menunggu keputusan tersendiri 〔belum ditetapkan〕.

[Perlu konfirmasi: layar catatan peninjau karena fitur ini belum dibangun saat penyusunan.]

## 10.10 Menyiapkan soal dengan bantuan AI

Ada tiga cara menyiapkan soal di PINTAR. Ketiganya berakhir di jalur yang sama: draf, tinjauan orang kedua, persetujuan, dan penerbitan (10.4).

1. **Menulis sendiri**, di buku kerja atau, mulai 4.1, di meja kerja soal.
2. **Memakai AI Anda sendiri, lalu mengunggah hasilnya.** Tersedia, tanpa biaya tambahan.
3. **Memakai AI terpadu PINTAR.** Tambahan berbayar yang opsional, sedang dikembangkan, dan belum pasti tersedia.

**AI membantu. Guru memutuskan.** Apa pun caranya, guru tetap penulisnya dan bertanggung jawab atas isinya. Murid tidak pernah berinteraksi dengan AI.

### Memakai AI Anda sendiri

Anda boleh memakai layanan AI yang sudah Anda atau sekolah Anda punya untuk membuat **draf** pelajaran dan soal, lalu mengunggahnya ke PINTAR. PINTAR tidak memungut biaya tambahan untuk materi yang diunggah dengan cara ini, dan PINTAR tidak memerlukan kata sandi atau kunci layanan AI Anda.

**Sebelum mulai: yang tidak boleh masuk ke AI.** Aturannya: jangan memasukkan apa pun yang dapat mengenali seorang murid, langsung maupun bila digabung dengan keterangan lain. Jangan pernah memasukkan:

- data murid: nama, NISN, NIK atau ID PINTAR, tanggal lahir, alamat, nomor telepon, email, atau data orang tua dan wali;
- catatan tentang murid: nilai, jawaban, laporan, kehadiran, catatan perilaku, keadaan kesehatan, atau kebutuhan khusus;
- tulisan atau karya murid sendiri, walaupun tanpa nama;
- daftar kelas, foto, tangkapan layar PINTAR, dan berkas yang diunduh dari PINTAR;
- kata sandi, tautan masuk, kode undangan, dan tautan akun atau kelas;
- data pribadi guru lain dan data sekolah yang tidak untuk umum;
- soal ujian yang harus tetap rahasia;
- materi yang bukan hak Anda.

Apa pun yang Anda tempel ke layanan AI di luar PINTAR diolah oleh perusahaan AI itu menurut aturannya sendiri. PINTAR tidak dapat melihatnya dan tidak dapat menariknya kembali. Pakai akun yang disetujui sekolah dan periksa pengaturannya lebih dulu. Anda dan sekolah Anda bertanggung jawab atas apa yang Anda tempel.

**Langkah-langkahnya:**

1. Di **Studio › Buat Paket**, pilih «Unduh templat Excel». Bila perlu, unduh juga «Unduh contoh isian».
2. Salin salah satu perintah contoh dari PINTAR ke layanan AI Anda. Ganti setiap bagian yang perlu diisi dan tempel materi Anda.
3. Salin tabel jawaban AI ke lembar yang sama namanya di templat, mulai dari baris 2.
4. Unggah buku kerja itu di **Studio › Buat Paket**. PINTAR memeriksa setiap baris lebih dulu. Bila ada yang salah, PINTAR menyebut lembar, baris, dan masalahnya, dan belum menyimpan apa pun.
5. Baca setiap pelajaran, setiap soal, dan kuncinya. Perbaiki yang salah, lalu «Ajukan untuk ditinjau».

**Sebelum mengunggah, periksa:** tidak ada data yang dapat mengenali murid, termasuk dalam soal cerita (ganti nama yang sama dengan nama murid yang Anda kenal); setiap soal punya tepat satu jawaban benar; setiap pilihan punya alasan; dan setiap kode dan nomor cocok antarlembar.

Satu buku kerja berisi satu kursus utuh. Untuk menambah beberapa soal ke pelajaran yang sudah ada, tulis langsung di Studio. PINTAR tidak menangani layanan AI di luar PINTAR, akunnya, atau biayanya.

**Ke depan** 〔4.2 · usulan〕. Beberapa kemudahan untuk jalur ini diusulkan untuk rencana 4.2: cara menempel hasil AI yang lebih mudah, mengunggah soal saja tanpa satu kursus utuh, dan kolom tempat guru menyatakan sendiri bahwa sebuah draf disusun dengan bantuan AI. Usulan ini belum disetujui.

[Perlu konfirmasi: tempat terbit panduan dan perintah contoh untuk sekolah.]

### AI terpadu PINTAR 〔4.1 · dalam pengembangan, belum pasti〕

PINTAR sedang mengembangkan AI terpadu untuk menyusun draf soal pilihan ganda langsung di Studio. Statusnya perlu dipahami dengan jelas:

- Fitur ini **opsional** dan merupakan **tambahan berbayar** yang diaktifkan per sekolah. Sekolah dapat memakai PINTAR sepenuhnya tanpa fitur ini.
- Fitur ini **hanya untuk guru**.
- PINTAR hanya akan menawarkan penyedia AI yang lolos penilaian PINTAR: mutu pendidikan, kontrak, keamanan, dan operasional. Sekolah memilih dari pilihan yang lolos, dengan perbandingan yang sama dan harganya, sebelum mengaktifkannya.
- Penilaian penyedia masih berjalan. Belum ada penyedia, harga, paket, atau kuota yang diputuskan. Pemilik PINTAR sudah memutuskan: jika tidak ada penyedia yang mengizinkan cara kerja ini, penyusunan draf soal dengan AI terpadu dikeluarkan dari rencana PINTAR, dan PINTAR tetap berjalan dengan penulisan soal oleh guru dan unggah buku kerja. Keputusan ini tidak menahan pengembangan bagian PINTAR yang lain.

Pengalaman yang dituju, jika fitur ini tersedia:

1. **Guru memilih** sumber yang diizinkan dan satu tujuan pembelajaran.
2. **AI menyusun draf**: soal pilihan ganda, usulan jawaban, penjelasan, dan rujukan ke sumbernya. Draf masuk ke meja kerja soal lengkap dengan asal-usulnya.
3. **Draf diperiksa**: format, duplikasi, jawaban yang ambigu, dan kecocokan dengan sumber.
4. **Guru memutuskan**: menerima, mengubah, menolak, atau meminta draf baru.
5. **Ditinjau, lalu dirilis** melalui alur biasa, termasuk tinjauan orang kedua. Baru setelah itu soal dapat ditugaskan.

Tidak ada data pribadi murid yang dikirim ke penyedia AI. Jika pembuatan draf gagal atau kosong, tidak ada yang dibuat. Guru dan peninjau melihat asal-usul AI; murid melihat soal yang sudah terbit seperti soal lain. Mengganti pilihan penyedia hanya berlaku untuk permintaan baru; soal yang sudah ada tetap memakai asal-usulnya dan tetap dapat dipakai.

[Perlu konfirmasi: layar dan teks fitur ini.]

## 10.11 Kesehatan soal 〔4.0; dijadwalkan di 4.2; diperbaiki dan diperluas di 4.5〕

**Kesehatan soal** menunjukkan sinyal mutu sebuah soal, misalnya soal yang perlu ditinjau ulang. Statusnya antara lain «Sedang diamati», «Perlu ditinjau guru», dan «Belum cukup jawaban untuk dinilai». Kesehatan soal dibaca oleh peninjau yang berwenang, bukan oleh guru kelas, dan terpisah dari halaman Per soal.

- **4.2 · direncanakan**: statistik Kesehatan soal diperbarui secara terjadwal, sehingga pembaca tahu seberapa baru angkanya. Pembaruan terjadwal hanya menyegarkan perhitungan yang sudah ada; pembaruan itu tidak membuktikan perhitungannya benar.
- **4.5 · arah**: beberapa perhitungan statistik soal diketahui masih memiliki keterbatasan, misalnya cara menghitung perubahan jawaban, soal dengan lebih dari satu jawaban benar, dan kapan waktu pengerjaan soal mulai dihitung. Keterbatasan ini akan diperiksa ulang dan diperbaiki di awal 4.5, sebelum dipakai untuk kesimpulan baru. Sampai saat itu, angka Kesehatan soal sebaiknya dibaca dengan hati-hati.

## 10.12 Studio di PINTAR 4.5: Kecerdasan Soal 〔4.5 · arah〕

Mulai 4.5, **Kecerdasan Soal** (*Question Intelligence*) memeriksa mutu soal dengan lebih mendalam: tingkat kesulitan, perilaku pilihan jawaban dan pengecoh, daya pembeda bila didukung data, pengaruh revisi, dan keandalan asesmen bila memungkinkan. "Bukti belum cukup" adalah hasil yang wajar.

Kecerdasan Soal juga menetapkan, dengan konfirmasi manusia, kapan dua versi soal atau dua asesmen dapat dibandingkan, dan menghubungkan soal dengan **identitas kompetensi** yang stabil. Kemungkinan memakai rujukan kurikulum nasional Indonesia sebagai jangkar kompetensi sedang diteliti. Pemetaan pemahaman keliru juga termasuk di sini. Lihat Bab 14.

**Pembobotan soal** ditunda ke setelah 5.0 〔belum ditetapkan〕.

---

# Bab 11 · Murid

Bab ini untuk murid: siswa sekolah, mahasiswa, atau peserta program pelatihan. Bab ini juga berguna bagi guru dan orang tua yang ingin memahami apa yang dilihat murid.

## 11.1 Perjalanan seorang murid

1. Murid menerima **kartu kelas** dari sekolah.
2. Murid **masuk** dengan nomor kartu dan PIN.
3. Di halaman **Belajar**, murid melihat materi yang disediakan gurunya dan satu langkah berikutnya.
4. Murid mengerjakan **Pemetaan Awal**, membaca menurut **Peta Bacaan Personal**, lalu mengerjakan **Uji Penguasaan**.
5. Murid melihat **hasilnya**, per tujuan pembelajaran.
6. Jika mencapai target, murid mendapat **sertifikat** yang keasliannya dapat diperiksa orang lain.
7. Jika terjadi gangguan, misalnya listrik padam atau internet putus, jawaban yang sudah tersimpan tidak hilang.

## 11.2 Kartu kelas dan masuk 〔4.0〕

Murid masuk ke PINTAR hanya dengan **kartu kelas**. Kartu itu memuat nomor kartu dan PIN.

1. Di halaman masuk, pilih «Gunakan kartu kelas».
2. Masukkan «Nomor kartu» dan «PIN».
3. «Masuk dengan kartu».

Murid tidak memerlukan email atau password. Kartu kelas tidak memuat foto.

> **Jika terjadi kendala** Lupa PIN atau kartunya hilang? «Lupa PIN? Tanyakan kepada guru.» Sekolah akan menerbitkan kartu baru. Kartu lama langsung tidak berlaku, dan semua hasil belajar Anda tetap utuh.

Jika nomor kartu terlalu sering dicoba dengan PIN yang salah, PINTAR menutupnya sementara: «Nomor kartu ini sudah terlalu sering dicoba.» Mintalah bantuan guru atau yang mengurus PINTAR di sekolah Anda.

Di 4.0, halaman PINTAR ID dan Kartu PINTAR belum tersedia untuk murid; keduanya hanya untuk staf.

## 11.3 Komputer yang dipakai bersama 〔4.0〕

Di laboratorium komputer, PINTAR melindungi Anda:

- Jika tidak dipakai beberapa saat, PINTAR terkunci. Halaman kunci tidak menyebut nama Anda.
- Untuk melanjutkan, masukkan PIN kartu Anda. Anda kembali ke halaman tempat Anda berhenti.
- Setelah beberapa kali salah memasukkan PIN, sesi di komputer itu berakhir. Kartu Anda tetap dapat dipakai di komputer lain. «Lupa PIN? Keluar, lalu minta bantuan guru Anda.»
- Jika komputer itu akan dipakai teman, tekan «Bukan akun Anda?» untuk keluar dengan aman.
- Di layar yang dipakai bersama, PINTAR hanya menyebut nama depan Anda.

Posisi bacaan Anda mengikuti Anda, bukan komputernya.

## 11.4 Halaman Belajar 〔4.0〕

PINTAR menyapa «Halo» dengan nama depan Anda: «Ini yang sedang berjalan hari ini.» Di bawahnya ada **«Langkah berikutnya»**, misalnya «Mulai Pemetaan Awal», «Mulai pelajaran», «Mulai Uji Penguasaan», atau «Lihat hasil».

Jika guru meminta Anda membaca lagi bagian tertentu, Anda akan melihat «Diminta guru Anda».

Jika belum ada materi: «Belum ada materi yang disediakan untuk Anda.» Jika Anda belum terdaftar di kelas mana pun, layar menjelaskannya dan Anda dapat bertanya kepada guru.

Membuka sebuah bab hanya untuk melihat isinya tidak berarti Anda mulai mengerjakan. Sebuah asesmen baru dimulai ketika Anda menekan tombol mulai, dan hanya sekali.

## 11.5 Pemetaan Awal 〔4.0〕

**Pemetaan Awal** dikerjakan sekali di awal bab. Untuk murid SD, layar menjelaskan: «Ini bukan ulangan. Jawaban Anda dipakai untuk memilih bacaan yang pas.» Kalimat itu berlaku untuk semua murid: Pemetaan Awal tidak menentukan hasil Anda. Pemetaan Awal membantu memilih dari mana Anda mulai membaca.

Gunakan «Berikutnya» dan «Kembali» untuk berpindah soal, lalu «Selesaikan pemetaan». Setelah itu: «Pemetaan selesai. Peta bacaan Anda sudah siap.»

## 11.6 Peta Bacaan Personal dan pelajaran 〔4.0〕

**Peta Bacaan Personal** menyarankan urutan bacaan: «Mulailah dari kartu paling atas…». Setiap bagian diberi tanda:

- «Baca ini lebih dulu»,
- «Perlu dibaca»,
- «Sebaiknya dibaca»,
- «Sudah dikuasai».

Tekan «Buka pelajarannya» untuk membaca. Di dalam pelajaran, gunakan «Halaman sebelumnya» dan «Halaman berikutnya». PINTAR menyimpan tempat Anda berhenti: «Posisi bacaan tersimpan.» Pelajaran dihitung sudah dibaca ketika Anda sampai di halaman terakhirnya.

Bantuan bertahap tersedia bila Anda membutuhkannya. Bantuan itu memberi arah berpikir lebih dulu, lalu langkah demi langkah, tetapi tidak memberikan jawabannya. Nama tombolnya menyesuaikan jenjang: «Perlu contoh?» (SD), «Perlu petunjuk?» (SMP), «Perlu arah?» (SMA), dan «Perlu arah berpikir?» (perguruan tinggi).

Peta Bacaan Personal adalah urutan bacaan *awal* yang disarankan dari Pemetaan Awal. Peta itu bukan jalur belajar yang terus menyesuaikan diri. Jalur yang lebih menyesuaikan diri adalah arah PINTAR 5.0.

## 11.7 Uji Penguasaan 〔4.0〕

**Uji Penguasaan** menunjukkan apakah Anda sudah menguasai tujuan pembelajaran bab itu. Aturannya terlihat sebelum Anda mulai. «Kerjakan dengan tenang. Anda bisa menandai soal dan kembali lagi.»

Tombol yang tersedia:

- «Tandai soal ini», untuk kembali ke soal itu nanti,
- «Daftar soal», untuk melihat semua soal,
- «Simpan jawaban ini» (lalu muncul «Tersimpan»),
- «Simpan & Jeda», untuk menjeda bila aturan asesmen mengizinkan,
- «Kumpulkan».

Sebelum mengumpulkan, PINTAR bertanya: «Kumpulkan sekarang? Setelah dikumpulkan, jawaban tidak bisa diubah.» PINTAR menunggu sampai semua jawaban tersimpan sebelum mengumpulkannya.

Uji Penguasaan memiliki dua kesempatan. Jumlah kesempatan tidak bertambah kembali walaupun guru mengakhiri lalu memberikan asesmen yang sama lagi, dan tidak bertambah walaupun asesmennya direvisi: kesempatan dihitung untuk semua versi asesmen yang sama. Kesempatan tambahan hanya dapat diberikan melalui permintaan guru yang disetujui orang lain (Bab 9.8).

> **Jika terjadi kendala** Internet putus di tengah Uji Penguasaan? Jawaban yang sudah tersimpan tidak hilang. Setelah tersambung kembali, lanjutkan.

## 11.8 Hasil 〔4.0〕

Setelah mengumpulkan, Anda melihat **Hasil**:

- **«Penguasaan»** dan **«Per tujuan pembelajaran»**,
- **«Perubahan dari Pemetaan Awal»**,
- jawaban Anda sendiri, dengan tanda «Sudah tepat» atau «Belum tepat», beserta penjelasannya.

Hasilnya dinyatakan sebagai «Target tercapai.» atau «Belum mencapai target.», menurut batas ketuntasan sekolah.

Jika ada soal wajib yang belum tepat: «Ada soal penting yang belum tepat. Mari kita lihat bersama.»

Selesai mengerjakan dan menguasai materi adalah dua hal yang berbeda. Jika belum mencapai target, PINTAR mengarahkan Anda untuk membaca kembali bagian yang perlu. Tidak ada percobaan ulang tanpa batas.

Halaman **«Hasil belajar»** menampilkan semua bab Anda dan apa yang perlu dipelajari lagi.

**Yang tidak pernah Anda lihat:** peringkat, rata-rata kelas, hasil teman, kunci jawaban sebelum tinjauan, dan catatan integritas.

> **Mengapa begini?** Belajar bukan perlombaan. Hasil Anda dibandingkan dengan tujuan pembelajaran, bukan dengan teman sekelas.

## 11.9 Sertifikat 〔4.0〕

Jika Uji Penguasaan Anda mencapai target, sertifikat disiapkan otomatis. Di halaman hasil ada tombol «Ambil sertifikat». Selama disiapkan: «Sertifikat Anda sedang disiapkan». «Tidak ada yang perlu dilakukan…»

Sertifikat Penguasaan memuat nama kursus, nama sekolah, nama Anda, dan predikatnya bila ada:

| Predikat | Hasil |
|---|---|
| Sangat Baik | 90% atau lebih |
| Baik | 80% sampai di bawah 90% |
| Cukup | 70% sampai di bawah 80% |

Di bawah 70%, sertifikat tetap dapat terbit bila target sekolah tercapai, tetapi tanpa baris predikat. Batas ketuntasan sekolah tidak dicetak di sertifikat.

Dari halaman sertifikat Anda dapat «Periksa keaslian», «Cetak atau simpan PDF», dan «Salin tautan verifikasi». Semua sertifikat Anda ada di **«Sertifikat Anda»**.

Uji Cepat tidak pernah menerbitkan sertifikat.

## 11.10 Pemberitahuan khusus 〔4.1〕

Mulai 4.1, Anda mungkin melihat pemberitahuan berikut:

- **Asesmen berakhir karena batas waktu.** Asesmen dinilai dari jawaban yang sudah tersimpan. Soal yang belum dijawab tetap tidak terjawab. Pemberitahuan menjelaskan bahwa asesmen berakhir karena batas waktu, bukan karena Anda mengumpulkannya.
- **Guru mengakhiri asesmen.** Ada tiga kemungkinan: diakhiri dan dinilai, diakhiri dan tidak dihitung, atau penugasannya diakhiri.
- **Hasil dihitung ulang.** «Hasil ini dihitung ulang karena penilaian satu soal diperbaiki. Hasil asli tetap tersimpan.»
- **Pemeliharaan.** Pemberitahuan muncul 60, 30, dan 15 menit sebelumnya, menyebut kelas dan zona waktunya. Dalam 15 menit terakhir dan selama pemeliharaan, tombol «Mulai» tidak aktif dan disertai penjelasan. Asesmen yang sudah berjalan tetap dapat Anda selesaikan.
- **Penghentian darurat.** «Asesmen ini ditahan selama penghentian. Sisa waktu Anda: … menit.»
- **Kesempatan tambahan.** Jika guru meminta kesempatan tambahan untuk Anda dan disetujui, tombol «Mulai» muncul kembali.

## 11.11 Melanjutkan di perangkat lain 〔4.1〕

PINTAR 4.1 merencanakan cara aman untuk melanjutkan asesmen di perangkat lain, misalnya ketika laptop sekolah mati di tengah asesmen:

- Untuk asesmen berisiko rendah, Anda dapat melanjutkan setelah masuk kembali di perangkat lain.
- Untuk Uji Penguasaan, Anda memerlukan izin guru.
- Hanya satu perangkat yang dapat menyimpan jawaban pada satu waktu. Jawaban yang sudah tersimpan tetap ada.

## 11.12 Bahasa dan jenjang

Semua layar murid dapat dialihkan antara Bahasa Indonesia dan bahasa Inggris. Isi pelajaran tetap dalam bahasa aslinya. Beberapa kalimat, misalnya tombol bantuan, menyesuaikan jenjang SD, SMP, SMA, atau perguruan tinggi.

## 11.13 Akun dan meninggalkan PINTAR

Foto profil, jika ada, hanya tampil di profil, tidak di kartu kelas atau sertifikat.

Untuk murid, menutup akun atau menghapus data diajukan oleh sekolah bersama keluarga, bukan oleh murid sendiri: «…diajukan oleh sekolah bersama keluarga Anda. Sampaikan kepada wali kelas atau guru Anda.» Penutupan akun murid dan penghapusan data anak masih menunggu kajian hukum tentang perlindungan data pribadi dan persetujuan orang tua 〔belum ditetapkan〕.

## 11.14 Murid di versi berikutnya

- **Mode Ujian** 〔4.2 · direncanakan〕: murid mengerjakan asesmen dalam kondisi ujian (Bab 9.12).
- **Batas waktu per asesmen** 〔4.2 · usulan〕 (Bab 9.12).
- **Jalur belajar yang diatur** 〔5.0 · arah〕. Di 5.0, guru dapat menetapkan beberapa bentuk perjalanan belajar yang disetujui, misalnya untuk intervensi atau prasyarat. Kemajuan dan penyelesaiannya dijaga oleh PINTAR sendiri, bukan hanya oleh layar. Guru tetap memilih intervensi dan merancang urutannya. Jalur yang menyesuaikan diri secara otomatis tidak termasuk.
- **Bantuan yang perlu tetap tersedia** 〔5.0 · arah〕. Jika guru sedang mengamati hasil sebuah intervensi, murid yang membutuhkan bantuan tetap mendapatkannya, meskipun itu membuat perbandingan tidak dapat dilakukan.
- **Portal orang tua** 〔belum ditetapkan〕. Tidak termasuk dalam versi mana pun saat ini.

---

# Bab 12 · Pengembangan profesi guru: fasilitator dan peserta

Guru juga belajar. PINTAR menyediakan ruang untuk **pengembangan profesi (guru)**, dan ruang itu sengaja dipisahkan dari pembelajaran akademik murid.

## 12.1 Tiga hal yang harus dipahami lebih dulu

1. **Guru yang belajar disebut Peserta**, tidak pernah murid.
2. **Pengembangan profesi bukan penilaian kinerja.** Di layar tertulis: «Catatan baca-saja per peserta dan paket. Bukan penilaian kinerja dan bukan peringkat.»
3. **Bukti pengembangan profesi tidak bercampur dengan bukti akademik.** Materi akademik dan materi pengembangan profesi tidak pernah saling melintas. Laporan akademik harus tetap persis sama, ada atau tidak ada kegiatan pengembangan profesi.

## 12.2 Menyiapkan program pengembangan profesi 〔4.0〕

1. **Admin sekolah** membuat tempat pengembangan profesi di struktur sekolahnya sendiri: sebuah Bagian, Tingkat, dan Kelas khusus, misalnya "Program Pengembangan Profesi › Angkatan 2026 › Literasi Numerasi".
2. Admin sekolah menugaskan **fasilitator**, yaitu seorang Guru yang lingkupnya mencakup kelas pengembangan profesi itu.
3. Hanya **staf yang sudah ada** yang dapat didaftarkan sebagai peserta. PINTAR memeriksanya saat penempatan. Tidak ada yang ditambahkan ke kelas murid.

## 12.3 Peran fasilitator 〔4.0〕

Fasilitator mendaftarkan peserta dan menyediakan materi pengembangan profesi, seperti guru menyediakan materi untuk kelasnya. Pimpinan **mengawasi**, tetapi tidak menugaskan sendiri. Tidak ada jalur penugasan tandingan oleh manajemen.

## 12.4 Pengalaman peserta 〔4.0〕

Peserta belajar dan mengerjakan asesmen seperti murid, dengan bahasa yang sesuai: mereka disebut peserta.

- **Peserta dapat melihat siapa yang melihat hasilnya.** Siapa yang dapat melihat apa, untuk setiap pihak, dijaga di tingkat basis data.
- Untuk setiap kelas, tersedia satu **Catatan pengembangan profesi** yang hanya dapat dibaca.
- Catatan integritas tercatat, tetapi tidak ditampilkan kepada pimpinan.
- Tidak ada penilaian kepegawaian.
- Peserta yang mencapai target mendapat **sertifikat pengembangan profesi**, yang diterbitkan dan dapat diperiksa keasliannya dengan cara yang sama seperti sertifikat lain (Bab 13).

## 12.5 Batas yang dijaga 〔4.0〕

- Kelas pengembangan profesi tidak muncul di tampilan guru tentang murid dan ditolak di halaman Per soal.
- Hasil pengembangan profesi tidak muncul di layar keputusan manajemen.
- Pengaturan sesi oleh guru di 4.1 (Bab 9.8) tidak berlaku untuk sesi pengembangan profesi. Hanya Admin PINTAR yang dapat mengakhiri penugasan dan sesi pengembangan profesi.

> **Mengapa begini?** Guru perlu ruang aman untuk belajar, termasuk untuk mencoba dan keliru. Jika hasil belajar guru dapat dipakai untuk menilai kinerjanya, ruang itu tidak lagi aman.

## 12.6 Pengembangan profesi di versi berikutnya

- **Koreksi catatan pengembangan profesi** 〔4.2 · direncanakan〕: Admin dan peninjau yang berwenang dapat membetulkan catatan operasional, dengan tetap menjaga izin, jejak audit, dan bukti sejarahnya. Jenis koreksi dan pelakunya akan ditetapkan dalam rencana.
- **Mengakhiri program, mengeluarkan peserta, dan sekolah mengakhiri sesi pengembangan profesinya sendiri** termasuk daftar 4.2 〔4.2 · direncanakan〕.
- **Batas dengan evaluasi resmi** 〔4.5 · arah〕: ketika evaluasi guru resmi tersedia (Bab 8.9), keikutsertaan pengembangan profesi tetap terpisah. Bukti pengembangan profesi tidak otomatis mengalir ke evaluasi resmi.
- **Perjalanan pertumbuhan guru** 〔5.0 · arah〕: berbeda dengan keikutsertaan dalam program, guru di 5.0 dapat memilih tujuan pertumbuhannya sendiri yang dikaitkan dengan bukti (Bab 15.5).

---

# Bab 13 · Memeriksa keaslian sertifikat

Bab ini untuk siapa saja yang menerima sertifikat PINTAR dan ingin memeriksa keasliannya, misalnya sekolah lanjutan, panitia beasiswa, atau tempat kerja. Pemeriksa tidak perlu memiliki akun PINTAR.

## 13.1 Cara memeriksa 〔4.0〕

Pindai **kode QR** pada sertifikat, atau ketik tautan pendek yang tercetak pada sertifikat. Halaman **«Verifikasi Sertifikat»** terbuka.

## 13.2 Yang ditampilkan 〔4.0〕

Halaman verifikasi menampilkan **status** lebih dulu, lalu hanya lima keterangan: kelulusan, predikat, institusi penerbit, tanggal terbit, dan keberlakuan.

Statusnya:

| Status | Artinya |
|---|---|
| **Berlaku** | Sertifikat benar diterbitkan dan masih berlaku. |
| **Dicabut oleh penerbit** | Sekolah penerbit telah mencabutnya. |
| **Digantikan sertifikat yang lebih baru** | Sertifikat ini telah diganti, misalnya karena ada koreksi. |
| **Sedang ditinjau** 〔4.1〕 | Hasil yang mendasari sertifikat sedang ditinjau, misalnya setelah koreksi kunci jawaban. Alasan sekolah tidak ditampilkan kepada umum. |
| **Tidak sah** | Sertifikat tidak dapat dipastikan keasliannya. |

Jika tautannya tidak dikenal: «Sertifikat dengan tautan ini tidak ditemukan.» Halaman ini tidak memberi petunjuk apakah sebuah sertifikat ada atau tidak.

## 13.3 Yang tidak ditampilkan 〔4.0〕

Halaman verifikasi **tidak pernah** menampilkan nama pemegang, foto, rincian skor, tanda tangan, atau data akun. Sertifikat yang memenuhi syarat tetapi belum diterbitkan tidak menampilkan apa pun.

> **Mengapa begini?** Pemeriksa perlu tahu apakah sertifikat itu asli dan masih berlaku. Pemeriksa tidak perlu melihat catatan belajar pemegangnya. Pemegang sertifikat sudah memperlihatkan sertifikatnya sendiri.

## 13.4 Bagaimana sertifikat diterbitkan 〔4.0〕

- Sertifikat hanya terbit dari bukti resmi **Uji Penguasaan** yang mencapai batas ketuntasan sekolah. Uji Cepat tidak pernah menerbitkan sertifikat.
- Penerbitan disiapkan otomatis dari halaman hasil, satu kali untuk setiap sesi. Membuka halaman saja tidak menerbitkan sertifikat.
- Saat terbit, sertifikat **disegel**: nama kursus, nama sekolah sebagaimana tercatat, bahasa, dan nama pemegang. Koreksi data di kemudian hari tidak menulis ulang sertifikat yang sudah terbit.
- Nomor sertifikat terdiri atas PINTAR ID pemegang dan nomor urut. Tautan verifikasinya acak dan tidak berasal dari PINTAR ID.
- Sertifikat cetak tetap memuat kode QR.

## 13.5 Ke depan 〔4.5 · arah〕

Mulai 4.5, **sejarah yang dapat dijelaskan** memungkinkan PINTAR menampilkan kembali sertifikat yang dibuat dari "potret" persis seperti saat diterbitkan, termasuk versi templatnya, walaupun hal lain berubah di kemudian hari.

Fungsi kode QR sertifikat dan referensi cetak laporan tetap terpisah dari gagasan berbagi lain yang belum ditetapkan, seperti Share & Learn atau kode QR kesinambungan (Lampiran B).

---

# Bagian III · PINTAR ke depan: memahami dan bertindak

Bagian ini menjelaskan arah PINTAR 4.5 dan 5.0 yang sudah disetujui pemilik PINTAR. Keduanya masih memerlukan rencana rinci dan izin pembangunan tersendiri. Karena itu, bagian ini menjelaskan **pengalaman yang dituju** dan prinsipnya, bukan tombol dan menu.

Nama-nama di bagian ini, seperti *Quiet Intelligence*, *Kecerdasan Soal*, dan *Kesepakatan Pertumbuhan Bersama*, adalah nama kerja. [Perlu konfirmasi: nama Indonesia yang akan dipakai di layar.]

# Bab 14 · PINTAR 4.5 · Memahami

## 14.1 Gagasan utama

Di 4.5, PINTAR membantu guru memahami apa yang sebenarnya didukung oleh bukti. Urutannya:

**Bukti → Pengukuran → Penafsiran → Penjelasan → Keputusan guru**

| Tahap | Apa yang terjadi | Batasnya |
|---|---|---|
| **Bukti** | Catatan sah dari pembelajaran dan asesmen, termasuk revisi soal, aturan penilaian, kondisi pengerjaan, dan koreksi yang sah. | Akses mengikuti batas izin yang sudah ada. |
| **Pengukuran** | Aturan yang terdokumentasi dan berversi. Jumlah data dan pengecualian ditampilkan. Mutu soal diperiksa. Kompetensi dan alat ukur dicocokkan sebelum bukti digabungkan. | Tidak menggabungkan yang tidak dapat dibandingkan. |
| **Penafsiran** | Setiap pernyataan diberi jenis: tercatat, terhitung, disimpulkan, atau belum dapat disimpulkan. | Jika pemeriksaan kecukupan gagal, hasilnya "belum dapat disimpulkan". |
| **Penjelasan** | Bukti, keterbatasan, dan konteks disajikan dengan tenang. AI dapat membantu menyampaikan kesimpulan yang sudah disetujui. | AI tidak membuat kesimpulan sendiri. |
| **Keputusan guru** | Guru menilai apa arti bukti itu bagi pengajarannya dan memilih apakah akan bertindak. | Penilaian resmi terhadap guru melalui proses manusia yang terpisah (Bab 8.9). |

> **[Ilustrasi 14.1]** Lima tahap dari bukti sampai keputusan guru, dengan tanda batas di setiap tahap.

## 14.2 Empat jenis pernyataan

Mulai 4.5, setiap pernyataan PINTAR tentang belajar diberi salah satu dari empat jenis:

| Jenis | Artinya | Contoh |
|---|---|---|
| **Tercatat** | Diamati langsung. | "Raka menjawab soal 4 dengan pilihan B." |
| **Terhitung** | Hasil perhitungan yang dapat diulang. | "12 dari 24 murid memilih B." |
| **Disimpulkan** | Hasil aturan yang jelas dan berversi, setelah syarat kecukupannya terpenuhi. | "Pada tiga soal yang dapat dibandingkan untuk kompetensi ini, pola jawabannya sejalan dengan kesulitan menyamakan penyebut." |
| **Belum dapat disimpulkan** | Bukti tidak cukup atau tidak cocok. | "Bukti belum cukup untuk menyimpulkan apa pun tentang kompetensi ini." |

Setiap pernyataan disertai rujukan buktinya, versinya, jumlah datanya, pengecualiannya, dan keterbatasannya bila relevan. "Belum dapat disimpulkan" adalah hasil yang wajar dan jujur, bukan kegagalan.

## 14.3 Kecerdasan Soal: memeriksa soal sebelum menilai murid

**Kecerdasan Soal** (*Question Intelligence*) adalah fondasi 4.5. Isinya:

- tingkat kesulitan soal,
- perilaku pilihan jawaban dan pengecoh,
- daya pembeda, bila didukung data,
- pengaruh revisi soal,
- keandalan asesmen, bila memungkinkan.

Kecerdasan Soal juga menentukan, dengan konfirmasi manusia, kapan dua revisi soal atau dua asesmen dapat dibandingkan. Penghitungan ulang selalu memakai aturan penilaian yang berlaku pada sesi itu sendiri.

Sebelum dibangun, beberapa keterbatasan perhitungan statistik soal yang sudah ada akan diperiksa ulang dan diperbaiki (Bab 10.11).

## 14.4 Identitas kompetensi

Agar bukti dari bab, tahun, sekolah, atau revisi kurikulum yang berbeda dapat dibaca bersama, PINTAR 4.5 menetapkan **identitas kompetensi** yang stabil. Tiga hal ditentukan secara terpisah:

- **Identitas**: apakah dua soal menguji kompetensi yang sama;
- **Kesetaraan**: apakah keduanya setara;
- **Keterbandingan**: apakah hasilnya boleh dibaca bersama.

Kemungkinan memakai rujukan kurikulum nasional Indonesia sebagai jangkar sedang diteliti. Keputusan tentang jangkar kompetensi menunggu keputusan pemilik PINTAR. Pemetaan pemahaman keliru juga termasuk di sini.

Guru dapat menuliskan **hipotesis prasyarat**, misalnya bahwa sebuah kompetensi memerlukan kompetensi lain lebih dulu. PINTAR selalu memperlakukannya sebagai hipotesis guru.

## 14.5 Quiet Intelligence: penjelasan yang tenang

***Quiet Intelligence*** adalah cara PINTAR 4.5 menyajikan pemahaman kepada guru. Namanya menggambarkan sifatnya: tenang, relevan, dan muncul ketika guru membutuhkannya.

- Hanya bukti yang cukup dan relevan yang ditampilkan, dengan penjelasan yang dapat ditindaklanjuti.
- Isinya mencakup **Sebaran Hasil** (*Performance Distribution*), pola dari waktu ke waktu yang dapat dibandingkan, dan hipotesis prasyarat dari guru.
- Jumlah data, pengecualian, dan batas selalu ditampilkan.
- Tujuannya, guru dapat mengenali prioritasnya dalam sekitar satu menit.
- PINTAR dapat menyampaikan pola yang didukung bukti, atau mengatakan bahwa kesimpulan tentang sebuah kompetensi belum dapat dibuat.

Quiet Intelligence menggantikan gagasan lama tentang "laporan cerdas" dan dasbor yang disusun sendiri oleh pengguna. Dasbor rakitan pengguna tidak termasuk dalam rencana.

Apakah dan bagaimana kegunaan Quiet Intelligence akan diukur masih perlu ditetapkan dalam rencana 4.5. Usulannya adalah tinjauan bersama guru secara terstruktur dan umpan balik sukarela. Usulan itu tidak memantau atau menilai staf.

## 14.6 Contoh lengkap: pecahan

Banyak murid memilih jawaban keliru yang sama pada sebuah soal pecahan.

1. **Kecerdasan Soal** memeriksa lebih dulu: apakah kuncinya benar, revisi mana yang dipakai, bagaimana perilaku pengecohnya, dan apakah buktinya cukup. Kalimat soal yang ambigu atau pengecoh yang cacat dapat menjelaskan nilai yang rendah, sehingga soal yang kurang baik tidak dengan sendirinya membuktikan pemahaman murid yang lemah.
2. **Identitas kompetensi** menghubungkan soal-soal yang dapat dipercaya ke keterampilan yang sama.
3. **Keterbandingan** menentukan sebaran mana yang boleh dibaca bersama.
4. **Sebaran Hasil** menunjukkan penyebaran hasil dan jumlah muridnya.
5. **Quiet Intelligence** menjelaskan pola yang didukung bukti pada soal-soal yang memenuhi syarat, atau menyatakan bahwa kesimpulan tentang kompetensi itu belum dapat dibuat.
6. **Guru memutuskan**: memeriksa soalnya, mengumpulkan bukti lain, atau mengulang konsepnya.

## 14.7 Sejarah yang dapat dijelaskan

Laporan, evaluasi yang tersegel, dan sertifikat yang dibuat dari potret harus dapat ditampilkan kembali persis seperti saat diterbitkan. Untuk itu, PINTAR 4.5 memakai potret yang tidak dapat diubah, penyusunan ulang "per tanggal", dan templat berversi.

Ini berbeda dari dua fitur lain:

- **Laporan periode lalu** 〔4.2〕 memilih periode yang ingin dibaca.
- **Referensi cetak** 〔4.1〕 membuktikan siapa yang mencetak sebuah laporan dan kapan.

Sejarah yang dapat dijelaskan menyusun ulang apa yang *dikatakan* sebuah keluaran pada saat itu.

## 14.8 Evaluasi guru dan perlindungan guru

Lihat Bab 8.9 untuk proses evaluasi resmi. Satu hal penting: sebelum bukti yang berkaitan dengan guru dibagikan dengan cara apa pun, perlindungan guru harus berlaku lebih dulu. Perlindungan itu meliputi akses berlapis yang tercatat, hak guru untuk melihat dan menanggapi, pemisahan catatan pengembangan dari evaluasi resmi, dan larangan perbandingan yang tidak didukung bukti.

## 14.9 Yang tidak akan dilakukan PINTAR 4.5

- Melacak perilaku pengguna.
- Membiarkan AI membuat klaim sebab-akibat.
- Membuat penilaian otomatis.
- Memprediksi atau mendiagnosis kegagalan murid.
- Membandingkan sekolah satu dengan sekolah lain.
- Memberi akses analitik tingkat layanan atau memperluas data murid yang dapat dilihat.

## 14.10 Kemampuan operasional yang dibawa ke 4.5

- **Masuk dengan WhatsApp** dan **pemeriksaan akses tidak biasa untuk staf** (Bab 5.12).
- **Share & Learn** 〔belum ditetapkan〕. Gagasan berbagi melalui tautan dan kode QR pernah dicatat sebagai arah 4.5, tetapi sumber resmi dan cakupannya belum dipastikan. Sebelum dibangun, harus diputuskan siapa penerimanya, apa yang boleh dibagikan, persetujuan atau kewenangannya, masa berlaku, dan cara mencabutnya.

## 14.11 Yang masih harus diputuskan sebelum 4.5 dibangun

- Kebijakan masa simpan, penghapusan, dan penyamaran bukti pendidikan, yang harus ditetapkan sebelum data sekolah sungguhan dipakai.
- Kebijakan evaluasi guru resmi.
- Jangkar kompetensi.
- Pemeriksaan ulang pengukuran dan keterbandingan.
- Perlindungan guru sebelum berbagi bukti yang sensitif.

---

# Bab 15 · PINTAR 5.0 · Bertindak dan bertumbuh

## 15.1 Gagasan utama

Di 5.0, guru dapat memilih apa yang akan dilakukan, mengikuti apa yang terjadi, dan menyempurnakan praktiknya. Semua ini berdiri di atas fondasi 4.5: mutu pengukuran, keterbandingan alat ukur, identitas kompetensi, jenis pernyataan, dan perlindungan guru.

## 15.2 Siklus perbaikan PINTAR

**Pahami → Pilih → Bertindak → Amati → Bandingkan → Renungkan → Perbaiki**

> **Contoh** Bu Rina membaca penjelasan Quiet Intelligence bahwa sekelompok murid kelas 7B mungkin kesulitan dengan pecahan senilai. Ia memeriksa bukti dan batasnya. Ia memilih untuk mengajarkan ulang pecahan senilai dengan model visual selama dua pertemuan. PINTAR mencatat apa yang dilakukan, murid mana yang terlibat, kapan, dan konteksnya. Bukti belajar dan asesmen berikutnya terkumpul. PINTAR membandingkan hasilnya sejauh alat ukur, cakupan kompetensi, dan kelompok yang terlibat memungkinkan, serta menunjukkan pengecualian dan penjelasan lain yang mungkin. Bu Rina memutuskan untuk melanjutkan model visual itu, tetapi menambah latihan untuk tiga murid yang belum terbantu.

> **[Ilustrasi 15.1]** Siklus tujuh langkah perbaikan, dengan keputusan guru di langkah "Pilih" dan "Renungkan".

## 15.3 Tiga hal yang dapat dikatakan tentang sebuah intervensi

| Yang dapat dikatakan | Dasarnya |
|---|---|
| **Intervensi itu tercatat** | Catatan resmi menunjukkan apa yang dilakukan. |
| **Hasil sesudahnya sejalan dengan perbaikan** | Pengamatan yang sah dan dapat dibandingkan menunjukkan pola yang sejalan dengan perbaikan, dengan batas yang dinyatakan. |
| **Pola perbaikan mendapat dukungan yang lebih kuat** | Pengamatan berulang yang dirancang dengan tepat telah menjawab penjelasan lain yang relevan. Kekuatan klaimnya tetap bergantung pada bukti dan rancangannya. |

Perbandingan sederhana sebelum dan sesudah dapat mendukung refleksi yang berguna, tetapi **tidak dapat membuktikan sebab-akibat**. PINTAR selalu menyebutkan penjelasan lain yang mungkin dan batas buktinya.

## 15.4 Intervensi dan tindak lanjut

- PINTAR mencatat tindakan yang dipilih guru, untuk siapa, dan kapan.
- Perbaikan diukur dari waktu ke waktu dengan bukti yang dapat dibandingkan. PINTAR menjelaskan perubahan kelompok, keikutsertaan, pengecualian, konteks sekolah, dan hal-hal yang mungkin memengaruhi.
- **Mulai bertahap.** Intervensi hanya boleh dimulai bertahap, misalnya satu kelompok lebih dulu agar ada pembanding, di bawah aturan yang disepakati, dengan keputusan sekolah yang diinformasikan, dan guru selalu dapat menghentikan penundaan bagi seorang murid. Aturan ini, termasuk siapa yang menyetujui, bagaimana keluarga diberi tahu, dan apa yang dihitung sebagai bantuan pendidikan yang perlu, menunggu keputusan pemilik PINTAR.
- **Bantuan yang perlu selalu tersedia**, bahkan jika itu membuat perbandingan tidak dapat dilakukan.
- Guru memutuskan untuk melanjutkan, mengubah, atau menghentikan.

## 15.5 Pertumbuhan Guru dan Kesepakatan Pertumbuhan Bersama

**Pertumbuhan Guru** (*Educator Growth*) memungkinkan guru memilih tujuan pengembangan diri yang dikaitkan dengan bukti, misalnya "memperbaiki cara saya mengajarkan pecahan senilai".

**Kesepakatan Pertumbuhan Bersama** (*Shared Growth Compact*) adalah syarat yang disepakati bersama tentang:

- siapa yang dapat melihat catatan pertumbuhan,
- untuk apa catatan itu boleh dipakai,
- bagaimana aksesnya tercatat,
- dan jaminan bahwa bukti pertumbuhan **tidak dipakai untuk menghukum**.

Pekerjaan pengembangan diri yang bersifat pribadi tetap terpisah dari evaluasi resmi. Catatan pertumbuhan tidak menghasilkan skor disiplin otomatis.

Hal yang masih akan ditetapkan dalam rencana 5.0: bagaimana tujuan diubah, bagaimana guru menarik diri, dan bagaimana perubahan audiens ditangani.

## 15.6 Jalur belajar yang diatur

PINTAR 5.0 akan mendukung sejumlah kecil **bentuk perjalanan belajar** yang disetujui, untuk intervensi dan prasyarat. Kemajuan dan penyelesaiannya dijaga oleh sistem PINTAR, tidak bergantung pada layar saja. Guru tetap memilih intervensi dan merancang urutannya.

Yang **tidak** termasuk: jalur yang menyesuaikan diri secara otomatis, penyusun alur kerja umum, aktivitas yang dibuat murid sendiri, dan dasbor rakitan pengguna. Penyusun sistem pembelajaran umum dan aktivitas buatan murid ditunda ke setelah 5.0 〔belum ditetapkan〕.

## 15.7 Perbaikan di tingkat institusi

Siklus perbaikan dapat dibawa ke tingkat departemen dan sekolah dengan **angka gabungan**. Pimpinan memilih dan meninjau tindakan perbaikan bagian atau sekolah, sementara catatan perorangan tetap terlindungi (Bab 8.10).

## 15.8 Bagaimana semuanya saling berhubungan

- **Quiet Intelligence** menjelaskan bukti awalnya.
- **Evaluasi resmi** bekerja pada catatan yang diatur institusi dan disegel manusia.
- **Pertumbuhan Guru** memakai bukti untuk tujuan yang dipilih guru sendiri, di bawah Kesepakatan.
- **Pengukuran intervensi** memeriksa apa yang terjadi setelah sebuah tindakan.
- **Perbaikan institusi** memakai angka gabungan untuk memilih dan memeriksa tindakan di tingkat bagian atau sekolah, dengan catatan perorangan terlindungi.

## 15.9 Yang tidak akan dilakukan PINTAR 5.0

- Peringkat guru berdasarkan catatan pertumbuhan.
- Jalur belajar yang menyesuaikan diri secara otomatis.
- Penyusun alur kerja umum.
- Dasbor yang dirakit sendiri oleh pengguna.

---

# Bagian IV · Perjalanan terpadu di sekolah

# Bab 16 · Sepuluh perjalanan yang menghubungkan semuanya

Bab-bab sebelumnya menjelaskan PINTAR dari sudut pandang satu peran. Kenyataannya, hampir setiap tindakan di PINTAR memengaruhi orang lain. Bab ini menceritakan sepuluh perjalanan yang melibatkan banyak orang sekaligus, dengan bertanya terus: *lalu apa yang terjadi? Apa lagi yang berubah?*

Nama orang dan sekolah dalam bab ini rekaan.

## 16.1 Perjalanan A · Satu tahun ajaran, dari sekolah bergabung sampai kenaikan kelas 〔4.0–4.1〕

**Juni.** SMP Harapan Bangsa di Bandung bergabung dengan PINTAR. Admin PINTAR membuka sekolah itu dengan zona waktu WIB dan menunjuk Pak Hendra, operator sekolah, sebagai Admin sekolah pertama. Pak Hendra mengaktifkan akunnya sendiri dengan kode dari email (Bab 6.2, 5.2).

*Lalu apa yang terjadi?* Pak Hendra menyusun struktur tahun ajaran 2026/2027: Bagian SMP, Tingkat 7–9, dan Kelas 7A sampai 9F. Ia menetapkan batas ketuntasan 75. Tanpa langkah ini, guru belum dapat menyediakan materi (Bab 7.3, 7.4).

**Juli.** Pak Hendra mendata 540 murid dari Excel. PINTAR memproses 50 orang pertama sebagai uji coba, Pak Hendra memeriksanya, lalu melanjutkan sisanya. Ia menempatkan murid di kelas, mendata 32 guru, dan memberi mereka peran Guru dengan masa berlaku sampai 30 Juni 2027. Pak Yusuf mendapat peran tambahan Kepala departemen untuk Matematika (Bab 7.5, 7.8).

*Apa lagi yang berubah?* Guru mengaktifkan akunnya masing-masing. Pak Hendra mencetak kartu kelas per kelas. Pada hari pertama, wali kelas membagikan kartu, dan saat murid pertama kali masuk, pendaftaran mereka menjadi aktif (Bab 7.6).

**Agustus–Mei.** Guru menyediakan materi, murid belajar, guru membaca bukti, dan pimpinan membaca ringkasan (Perjalanan B). Sepanjang tahun ada perubahan biasa: dua murid kehilangan kartu, satu murid pindah dari 8A ke 8C, satu murid pindah ke sekolah lain (Perjalanan G), dan seorang guru pensiun pada bulan Maret (Bab 7.11).

**Juni.** Pak Hendra menjalankan kenaikan kelas untuk setiap kelas. Untuk kelas 7B, ia menekan «Naikkan semua ke…», lalu mengatur dua pengecualian: satu murid tinggal kelas dan satu keluar karena pindah ke luar kota. Ia meninjau hasilnya menurut nama, mencentang bahwa ia sudah meninjau penugasan guru, lalu mengonfirmasi (Bab 7.14).

*Lalu apa yang terjadi?*

- Tahun 2027/2028 dimulai dengan daftar kelas yang benar.
- Guru tidak otomatis terbawa ke tahun berikutnya. Pak Hendra menugaskan mereka kembali secara sadar.
- Bukti lama tetap tercatat di kelas dan tahun tempat bukti itu dibuat, dengan nama pelakunya.
- Laporan tahun lalu tetap dapat dijelaskan, dan siapa yang boleh membacanya tetap diatur.

## 16.2 Perjalanan B · Dari asesmen sampai pemahaman 〔4.0–4.5〕

**Studio.** Bu Rina menyusun paket "Pecahan" dan mengajukannya untuk ditinjau. Pak Yusuf meninjaunya dan menyetujuinya. Pak Hendra, yang berwenang menerbitkan, menerbitkannya (Bab 10.4).

**Kelas.** Bu Rina menyediakan paket itu untuk 7B dengan jendela dua minggu. Murid mengerjakan Pemetaan Awal, membaca, lalu Uji Penguasaan. Setiap murid mengerjakan revisi soal yang persis sama, dan hasilnya dinilai (Bab 9.3, 11).

**Kekeliruan ditemukan.** Seminggu setelah Uji Penguasaan, Bu Rina menyadari bahwa kunci soal 9 keliru. Ia mengusulkan perbaikan kunci di Studio. PINTAR menunjukkan 24 sesi yang terdampak di sekolahnya. Pak Yusuf, orang yang berbeda, mengonfirmasi perbaikan itu (Bab 10.8).

*Lalu apa yang terjadi?*

- 24 hasil dihitung ulang dari jawaban asli murid. Hasil yang lama tetap tersimpan, dan hasil baru menjadi satu-satunya hasil yang berlaku.
- Murid melihat tanda «Dihitung ulang».
- Ringkasan Kelas memakai hasil yang berlaku.
- Tiga sertifikat yang hasil dasarnya berubah masuk status «Sedang ditinjau», dan pemeriksa sertifikat melihat status itu. Pak Hendra menanganinya di «Sertifikat sekolah».
- Sekolah mendapat pemberitahuan di «Yang menunggu».

*Apa lagi yang berubah?* Laporan yang sudah dicetak sebelumnya tetap membawa waktu dan referensinya sendiri. Laporan itu tidak berubah diam-diam, dan cetakan baru memakai hasil yang berlaku.

**Di 4.5.** Kecerdasan Soal memakai bukti yang sudah dikoreksi dan memenuhi syarat untuk menghitung mutu soal. Revisi soal yang berbeda tidak dibandingkan begitu saja. Sejarah yang dapat dijelaskan membedakan apa yang dikatakan laporan saat itu dari apa yang berlaku sekarang (Bab 14).

[Perlu konfirmasi: aturan pembaruan keluaran turunan setelah koreksi akan ditetapkan dalam rencana 4.2 dan 4.5.]

## 16.3 Perjalanan C · Ketika asesmen terganggu 〔4.0–4.2〕

**Internet putus.** Di tengah Uji Penguasaan, koneksi Wi-Fi laboratorium putus. Jawaban yang sudah diterima PINTAR aman. Setelah tersambung kembali, murid melanjutkan.

**Laptop mati** 〔4.1〕. Laptop Dimas mati di tengah Uji Penguasaan. Ia pindah ke laptop lain. Karena ini Uji Penguasaan, Bu Rina memberi izin dari layar pengaturan sesi. Laptop yang baru menjadi satu-satunya penulis sesi itu. Jika laptop lama menyala lagi, laptop itu tidak dapat menyimpan jawaban (Bab 9.11).

**Pemeliharaan terjadwal** 〔4.1〕. Pak Hendra menjadwalkan pemeliharaan untuk kelas 9A dan 9B pukul 13.00–14.00 karena kabel jaringan lab diperbaiki. Murid dan guru kelas itu melihat pemberitahuan pada pukul 12.00, 12.30, dan 12.45. Sejak pukul 12.45, asesmen baru untuk 9A dan 9B tidak dapat dimulai. Murid yang sudah mulai pada pukul 12.30 tetap dapat menyelesaikannya. Kelas lain tidak terpengaruh (Bab 7.12).

**Penghentian darurat** 〔4.1〕. Gangguan serius terjadi, dan Admin PINTAR menghentikan PINTAR untuk sekolah itu. Asesmen yang sedang berjalan ditahan, tidak dinilai, dan tidak dikumpulkan. Setelah penghentian diakhiri, setiap murid memiliki sisa waktu yang persis sama (Bab 6.7).

*Lalu apa yang terjadi?* Pada akhirnya, setiap sesi diselesaikan oleh satu penulis yang sah, atau ditutup dengan cara yang jelas: dikumpulkan, ditutup karena batas waktu, diakhiri guru dengan atau tanpa nilai, atau diakhiri karena alasan integritas oleh yang berwenang. Penilaian selalu memakai jawaban yang sudah diterima, dan setiap tindakan tercatat atas nama pelakunya.

**Di 4.2.** Mode Ujian menambahkan kondisi ujian di atas perlindungan yang sama (Bab 9.12).

## 16.4 Perjalanan D · Peran berganti, peran di dua sekolah 〔4.0–4.2 dan seterusnya〕

Pak Ahmad mengajar di SMP A. Tahun depan, ia juga menjadi admin di SMP B, sekolah lain dalam yayasan yang sama, sementara salah satu perannya di SMP A berakhir.

**Di 4.0–4.1:** setiap peran memiliki tanggal berakhir. PINTAR mengingatkan sebelum masa itu habis. Saat peran berakhir, kewenangannya berakhir, tetapi pekerjaan lamanya tetap tercatat atas namanya, dengan peran dan sekolah saat itu.

**Di 4.2** 〔4.2 · direncanakan〕: peran di dua sekolah dicatat sebagai pemberian peran yang terpisah, masing-masing dengan tanggalnya. Pak Ahmad memilih sekolah tempat ia sedang bekerja. Untuk tindakan penting, kewenangannya diperiksa ulang pada saat itu. Jika perannya berakhir ketika ia sedang membuka laporan atau mengekspor data, tindakan itu diperiksa lagi.

*Apa yang tidak pernah terjadi?* Peran di SMP A tidak pernah memberi akses baca atau tulis di SMP B. Pekerjaan lama tetap berada di lingkup aslinya.

## 16.5 Perjalanan E · Dari bukti ke perbaikan 〔4.5–5.0〕

Bu Rina melihat kemungkinan kebutuhan belajar di kelasnya.

1. **Di 4.5**, PINTAR memastikan soal-soalnya layak dan dapat dibandingkan untuk kompetensi itu, lalu menjelaskan pola yang didukung bukti beserta batasnya.
2. **Di 5.0**, Bu Rina memilih tindakan, misalnya mengajarkan ulang dengan model visual. PINTAR mencatatnya.
3. Pengamatan yang memenuhi syarat terkumpul.
4. PINTAR membandingkan hasilnya hanya sejauh klaim yang didukung bukti (Bab 15.3).
5. Bu Rina memutuskan untuk melanjutkan, mengubah, atau menghentikan.

*Sepanjang perjalanan:* murid yang membutuhkan bantuan selalu mendapatkannya. Angka gabungan untuk pimpinan tetap menunjukkan lingkup dan ketidakpastiannya.

## 16.6 Perjalanan F · Evaluasi resmi dan pertumbuhan guru 〔4.5–5.0〕

**Di 4.5**, SMA Cendekia membuka periode evaluasi guru dan menunjuk penilai. Bukti yang sah terkumpul, PINTAR menyiapkan draf yang jujur tentang batasnya, dan penilai meninjau, menyesuaikan dengan alasan, lalu menyegelnya. Pak Dimas, guru Fisika, menerima evaluasinya dan dapat memeriksa serta menanggapinya sesuai kebijakan (Bab 8.9).

**Di 5.0**, Pak Dimas memilih tujuan pertumbuhannya sendiri, misalnya memperbaiki cara mengajarkan hukum Newton, di bawah Kesepakatan Pertumbuhan Bersama (Bab 15.5).

*Apa yang dijaga?* Evaluasi asli dan penyesuaiannya dapat ditelusuri. Catatan pertumbuhan tetap pribadi sesuai kesepakatan, tidak dipakai untuk menghukum, dan tidak mengalir otomatis ke evaluasi resmi. Bukti yang datang setelah evaluasi disegel tetap dapat dibedakan dari bukti yang dipakai saat itu.

## 16.7 Perjalanan G · Murid pindah sekolah 〔4.0–4.5〕

Nadia, murid kelas 8 di SMP A yang sudah memiliki dua sertifikat, pindah ke SMP B karena orang tuanya pindah tugas.

1. SMP A mengajukan perpindahan. SMP B menerimanya dan memilih kelasnya. SMP A melaksanakannya (Bab 7.10).
2. Pendaftaran Nadia di SMP A berakhir. Sesi asesmennya yang masih terbuka diakhiri.
3. Hasil dan kedua sertifikatnya tetap tercatat atas nama SMP A dan Nadia. Sertifikatnya tetap dapat diperiksa keasliannya.
4. Mulai saat itu, SMP B yang mengatur akses Nadia.

*Apa yang tidak terjadi?* Identitas yang sama tidak memberi akses ke seluruh sekolah, dan tidak membuka perbandingan antarsekolah.

[Perlu konfirmasi: apa yang dapat dilihat guru di SMP B dari hasil Nadia di SMP A, dan bagaimana bukti lama dipakai dalam pengukuran jangka panjang di 4.5.]

## 16.8 Perjalanan H · Masa simpan data dan penyusunan ulang 〔4.1–5.0〕

Suatu hari, sebuah catatan mencapai batas masa simpannya, padahal catatan itu dirujuk oleh laporan, sertifikat, jejak audit, hasil yang dikoreksi, evaluasi, atau ekspor.

Prinsip yang sudah ditetapkan:

- Aturan masa simpan untuk setiap jenis catatan harus jelas lebih dulu.
- Semua catatan yang bergantung padanya harus dikenali sebelum tindakan apa pun diambil.
- Jika sebuah catatan tidak dapat lagi disusun ulang, PINTAR mengatakannya dengan jujur.
- Pernah mengekspor atau mencetak sebuah catatan tidak memperpanjang hak akses atau masa simpannya.

Catatan akuntabilitas masuk dan cetak memiliki masa simpan sendiri, yaitu 12 bulan (Bab 7.16). Kebijakan masa simpan bukti pendidikan diputuskan tersendiri oleh pemilik PINTAR sebelum data sekolah sungguhan dipakai. Bagaimana sebuah catatan ditampilkan setelah disposisi sengaja belum diputuskan.

## 16.9 Perjalanan I · Dari draf AI sampai bukti jangka panjang 〔4.1 · dalam pengembangan · 4.5〕

1. Bu Rina memilih bab yang sudah disetujui sekolah sebagai sumber, lalu meminta AI menyusun draf soal, dengan AI terpadu jika sekolahnya kelak mengaktifkannya, atau dengan AI sekolahnya sendiri lalu mengunggah hasilnya (Bab 10.10).
2. AI menghasilkan draf, atau tidak menghasilkan apa pun jika gagal. Tidak ada data murid yang diberikan kepada AI.
3. Bu Rina memeriksa dan mengubah draf, lalu menerimanya. Soal itu ditinjau Pak Yusuf, lalu diterbitkan.
4. Murid mengerjakan soal yang sudah terbit, dan bukti terkumpul. Murid melihat soal itu seperti soal lain.
5. Kemudian soal itu direvisi. Hasil lama tetap terikat pada revisi lamanya.
6. **Di 4.5**, mutu soal dapat dihitung ulang dalam lingkup yang tepat. Revisi hanya dibandingkan setelah divalidasi dan disetujui.

*Apa yang dijaga?* Asal-usul AI tetap tercatat untuk staf yang berwenang. Membandingkan soal buatan AI dengan soal buatan manusia adalah gagasan riset setelah 5.0.

## 16.10 Perjalanan J · Akses dari luar sekolah 〔belum ditetapkan〕

Kadang orang tua atau pihak luar ingin melihat sesuatu. Saat ini, PINTAR hanya memiliki dua jalan resmi ke luar:

- **Pemeriksaan keaslian sertifikat** melalui kode QR (Bab 13),
- **Referensi cetak** pada laporan resmi (Bab 7.16).

Gagasan lain, seperti **portal orang tua**, **Share & Learn**, atau **kode QR kesinambungan**, belum ditetapkan. Jika suatu hari diusulkan, beberapa hal harus diputuskan lebih dulu: tujuan kelembagaannya, siapa yang berhak menerimanya, identitas dan persetujuan, cakupan tautan, apakah tautan dapat diteruskan, cara mencabutnya, masa berlakunya, sejarahnya, dan jejak auditnya.

---

# Bagian V · Pertanyaan dan situasi khusus

# Bab 17 · Pertanyaan umum

### Untuk semua

**Apakah PINTAR memeringkat murid atau guru?**
Tidak. Daftar murid diurutkan menurut abjad, dan laporan tidak mengurutkan murid dari yang terbaik hingga terburuk. Evaluasi guru di 4.5 dan catatan pertumbuhan di 5.0 tidak membuat peringkat atau perbandingan antara guru yang disebut namanya (Bab 3.4).

**Apakah PINTAR memantau apa yang saya lakukan?**
Tidak. PINTAR mencatat tindakan penting demi akuntabilitas, misalnya masuk, keluar, meminta cetakan resmi, dan tindakan administratif. PINTAR tidak merekam klik, halaman yang dibuka, atau layar Anda (Bab 7.16).

**Apakah AI memutuskan nilai atau soal?**
Tidak. AI hanya menyusun draf soal yang harus diputuskan guru dan ditinjau orang kedua. Mulai 4.5, AI dapat membantu menyampaikan kesimpulan yang sudah disetujui. AI tidak membuat kesimpulan sendiri (Bab 3.3).

**Apakah PINTAR membandingkan sekolah kami dengan sekolah lain?**
Tidak. Laporan PINTAR bukan alat pemeringkatan sekolah, dan perbandingan antarsekolah dikecualikan di 4.5.

**Di mana saya mengubah bahasa?**
Di setiap layar ada pilihan bahasa Indonesia dan Inggris. Isi pelajaran tidak diterjemahkan.

### Untuk murid

**Saya lupa PIN. Apa yang harus saya lakukan?**
Tanyakan kepada guru atau yang mengurus PINTAR di sekolah Anda. Sekolah akan menerbitkan kartu baru. Hasil belajar Anda tidak hilang (Bab 11.2).

**Apakah Pemetaan Awal itu ulangan?**
Bukan. Pemetaan Awal dipakai untuk memilih bacaan yang pas bagi Anda (Bab 11.5).

**Mengapa saya tidak dapat melihat nilai teman?**
Karena belajar bukan perlombaan. Hasil Anda dibandingkan dengan tujuan pembelajaran, bukan dengan teman (Bab 11.8).

**Hasil saya diberi tanda «Dihitung ulang». Apa artinya?**
Kunci jawaban satu soal ternyata keliru dan sudah diperbaiki. Hasil Anda dihitung ulang dari jawaban asli Anda. Hasil yang lama tetap tersimpan (Bab 10.8).

**Saya belum mencapai target. Apakah saya bisa mencoba lagi?**
Uji Penguasaan memiliki dua kesempatan. Gunakan Peta Bacaan dan permintaan baca ulang dari guru untuk memperdalam pemahaman. Jika ada alasan khusus, guru dapat meminta satu kesempatan tambahan yang perlu disetujui orang lain (Bab 9.8).

### Untuk guru

**Mengapa saya tidak dapat menyediakan materi untuk kelas saya?**
Ada dua kemungkinan: sekolah belum menetapkan batas ketuntasan, atau babnya belum memiliki Pemetaan Awal dan Uji Penguasaan. Mulai 4.1, ada kemungkinan ketiga: kelas itu sedang dalam pemeliharaan terjadwal (Bab 9.3, 7.12).

**Mengapa angka Ringkasan Kelas saya tidak muncul?**
Datanya belum cukup. Angka kelas memerlukan sedikitnya lima murid. Layar menunjukkan berapa yang sudah ada dan berapa yang dibutuhkan (Bab 8.5).

**Bisakah saya mengubah nilai seorang murid?**
Tidak. Jawaban yang sudah tercatat dan hasil yang sudah selesai tidak dapat diubah. Jika kunci jawaban keliru, gunakan perbaikan kunci jawaban (Bab 10.8). Jika keadaan murid perlu ditangani khusus, gunakan pengaturan sesi (Bab 9.8).

**Mengapa saya tidak melihat Kesehatan soal atau catatan integritas?**
Keduanya ditangani oleh peninjau dan pimpinan. Guru melihat «Per soal» untuk kelasnya sendiri (Bab 9.6).

**Apakah hasil pengembangan profesi saya dilihat kepala sekolah?**
Hasil pengembangan profesi tidak muncul di layar keputusan manajemen. Anda dapat melihat siapa yang dapat melihat hasil Anda (Bab 12.4).

**Apakah draf soal dari AI memakai data murid saya?**
Tidak boleh. AI terpadu PINTAR tidak mengirim data pribadi murid. Jika Anda memakai AI sendiri, jangan pernah memasukkan apa pun yang dapat mengenali murid (Bab 10.10).

**Apakah sekolah harus membayar untuk memakai AI?**
Tidak harus. Memakai AI sekolah sendiri lalu mengunggah hasilnya melalui buku kerja tidak dikenai biaya tambahan. AI terpadu PINTAR, yang masih dikembangkan, direncanakan sebagai tambahan berbayar yang opsional (Bab 10.10).

### Untuk pimpinan

**Mengapa saya tidak dapat menerbitkan materi?**
Kepala departemen menyetujui isi, tetapi penerbitan dilakukan oleh orang lain yang berwenang menerbitkan. Ini menjaga aturan dua orang (Bab 10.2).

**Mengapa saya tidak dapat membuka Ringkasan Sekolah?**
Ringkasan seluruh sekolah hanya terbuka bagi pimpinan yang lingkupnya mencakup seluruh sekolah (Bab 8.2).

**Bisakah saya membuka catatan seorang murid?**
Bisa, jika murid itu dalam lingkup Anda. Membuka catatan satu murid adalah tindakan tersendiri dan tercatat (Bab 8.3).

### Untuk Admin sekolah

**Mengapa saya tidak dapat melihat hasil belajar murid?**
Di PINTAR, admin mengurus data dan akses tetapi bukan penguji. Hasil belajar dilihat oleh guru dan pimpinan dalam lingkupnya (Bab 7).

**Saya salah mencatat kenaikan kelas seorang murid. Bisakah saya membatalkannya?**
Perbaiki untuk murid itu saja. Membatalkan satu putaran kenaikan kelas sekaligus direncanakan untuk 4.2 (Bab 7.14).

**Bisakah sekolah kami menghentikan PINTAR dalam keadaan darurat?**
Tidak. Sekolah dapat menjadwalkan pemeliharaan dan mengakhirinya lebih awal, tetapi penghentian darurat hanya dilakukan oleh Admin PINTAR (Bab 7.12).

**Bisakah kami mengekspor data sekolah?**
Belum. Ekspor data sekolah direncanakan untuk 4.2 (Bab 7.18).

---

# Bab 18 · Ketika sesuatu tidak berjalan seperti biasa

Bab ini mengumpulkan situasi khusus di satu tempat. Setiap situasi dijelaskan dengan pola yang sama: apa yang terjadi, siapa yang bertindak, apa yang tetap aman, dan apa yang berubah.

| Situasi | Siapa bertindak | Apa yang tetap aman | Lihat |
|---|---|---|---|
| Murid lupa PIN atau kehilangan kartu | Admin sekolah menerbitkan kartu baru | Semua hasil belajar | 7.7 |
| Staf lupa password | Staf sendiri, dengan «Lupa password?» | Akun dan semua pekerjaannya | 5.6 |
| Setelah pembaruan, PINTAR membuka halaman aktivasi saat masuk | Staf sendiri menyelesaikan langkahnya | Akun yang sama; murid dengan kartu kelas tidak terdampak | 5.2 |
| Pemulihan dengan PIN tertutup | Staf melalui email, atau Admin sekolah atau Admin PINTAR mengatur ulang | Akunnya tidak terkunci | 5.6, 7.7 |
| Internet putus saat asesmen | Murid melanjutkan setelah tersambung | Jawaban yang sudah diterima | 11.7 |
| Perangkat mati saat asesmen | Murid masuk di perangkat lain; untuk Uji Penguasaan dengan izin guru 〔4.1〕 | Jawaban yang sudah diterima; satu penulis | 9.11 |
| Murid terlambat atau terganggu | Guru: «Tambah waktu» 〔4.1〕 | Tercatat dan hanya untuk murid itu | 9.8 |
| Murid keliru membuka asesmen | Guru: «Akhiri tanpa menghitung» 〔4.1〕 | Tidak memakai kesempatan; jawaban tersimpan | 9.8 |
| Murid perlu satu kesempatan lagi | Guru meminta, orang lain menyetujui 〔4.1〕 | Hasil sebelumnya tetap persis sama | 9.8, 7.13 |
| Asesmen ditinggalkan dan batas waktunya lewat | PINTAR menutupnya 〔4.1〕 | Dinilai dari jawaban yang tercatat; murid diberi tahu alasannya | 9.9 |
| Kunci jawaban keliru | Pengusul dan orang kedua 〔4.1〕 | Hasil asli dan jawaban murid; satu hasil berlaku | 10.8 |
| Materi terbit ternyata keliru | Penyusun menerbitkan revisi; penerbit dapat menarik | Murid terikat pada versi yang ia kerjakan | 10.7 |
| Sertifikat terdampak koreksi | Admin sekolah meninjau 〔4.1〕 | Sertifikat tersegel; status «Sedang ditinjau» | 7.15, 13.2 |
| Sertifikat perlu dicabut atau diganti | Admin sekolah | Sertifikat asli tersimpan; status di halaman verifikasi | 7.15 |
| Pemeliharaan sekolah | Admin sekolah menjadwalkan 〔4.1〕 | Asesmen yang berjalan dapat diselesaikan | 7.12 |
| Keadaan darurat | Admin PINTAR menghentikan dan mengakhiri | Sesi ditahan dengan sisa waktu yang sama | 6.7 |
| Murid ditangguhkan saat asesmen | Admin PINTAR; lalu guru memutuskan 〔4.1〕 | Jawaban dan sisa waktu | 6.5, 9.8 |
| Murid pindah kelas | Admin sekolah | Bukti lama tetap di kelas lama | 7.9 |
| Murid pindah sekolah | Kedua sekolah | Hasil dan sertifikat lama | 7.10 |
| Murid keluar, lalu kembali | Admin sekolah | Orang yang sama, nomor registrasi yang sama | 7.11 |
| Guru pensiun atau pindah tugas | Admin sekolah | Pekerjaannya tetap tercatat atas namanya | 7.11 |
| Admin terakhir hampir berakhir masa perannya | Admin memperpanjang; PINTAR mengingatkan 〔4.1〕 | Sekolah tidak pernah tanpa admin | 6.6 |
| Akun ditutup, lalu ingin kembali | Orang itu meminta; Admin PINTAR memverifikasi | Riwayat; kecuali data pribadi sudah dihapus | 6.5 |
| Email tidak sampai | Periksa spam; Admin PINTAR dapat menelusuri statusnya | PINTAR tidak menyatakan "terkirim" tanpa bukti | 6.8 |
| Cetakan resmi tidak dapat dicatat | Coba lagi | Tidak ada cetakan tanpa referensi | 18.2 |

## 18.1 Prinsip yang berlaku di semua situasi

1. **Bukti yang sah tidak pernah dihapus diam-diam.** Koreksi menambahkan, tidak menimpa.
2. **Satu hasil yang berlaku.** Setelah koreksi, hanya ada satu hasil yang berlaku, dan semua yang lama tetap dapat ditelusuri.
3. **Gangguan bukan kesalahan murid.** Penghentian dan pemeliharaan tidak mengurangi waktu atau kesempatan murid.
4. **Dua orang untuk keputusan penting.** Menyetujui materi, memperbaiki kunci jawaban, dan memberi kesempatan tambahan selalu melibatkan orang kedua.
5. **Setiap tindakan penting memiliki alasan dan pelaku yang tercatat.**
6. **Layar selalu memberi langkah berikutnya.** Ketika sesuatu ditolak, PINTAR menjelaskan mengapa dan apa yang dapat dilakukan.

## 18.2 Mencetak laporan resmi 〔4.1〕

Laporan resmi, seperti Ringkasan Kelas, Ringkasan Sekolah, catatan pengembangan profesi, dan Hasil belajar, dicetak dengan tombol «Cetak laporan».

- PINTAR mencatat permintaan cetak lebih dulu, baru kemudian mencetak.
- Kaki halaman memuat «Dicetak oleh {nama} · {tanggal, jam, zona} · Ref. CTK-XXXX-XXXX» dan «Halaman n dari m».
- Setiap tekan tombol menghasilkan referensi baru.
- Jika pencatatan gagal, tidak ada yang dicetak: «Cetakan belum dapat dicatat, jadi belum dicetak. Coba lagi.»
- Tombol cetak tidak tersedia untuk laporan yang kosong.
- Mencetak dari menu peramban menghasilkan cetakan bertanda «Dicetak dari browser · tanpa nomor referensi».
- Sertifikat cetak tidak memakai kaki halaman ini; sertifikat tetap memakai kode QR-nya.

Admin sekolah dapat mencari referensi cetak selama 12 bulan (Bab 7.16).

## 18.3 Hal yang masih dibatasi sampai versi berikutnya

| Batas saat ini | Direncanakan |
|---|---|
| Asesmen belum memiliki durasi sendiri | Usulan 4.2 |
| Belum ada Mode Ujian | 4.2 |
| Mengganti password saat masuk belum tersedia | 4.2 |
| Ekspor data sekolah belum tersedia | 4.2 |
| Laporan periode lalu belum dapat dipilih | 4.2 |
| Membatalkan satu putaran kenaikan kelas belum tersedia | 4.2 |
| Peran di dua sekolah belum tersedia | 4.2 |
| Statistik soal masih memiliki keterbatasan yang diketahui | Diperbaiki di awal 4.5 |
| Penutupan akun murid dan penghapusan data anak | Menunggu kajian hukum |
| Penutupan sekolah | Setelah 4.2 |

---

# Lampiran

## Lampiran A · Panduan ketersediaan fitur per versi

Status per 17 November 2026. **Layanan yang dipakai sekolah (produksi) masih memakai versi September 2026; belum ada fitur 4.0 atau 4.1 di sana.** Fondasi 4.0 sudah selesai dan diuji di lingkungan uji. Bagian pertama 4.1 sudah diterima di lingkungan uji; bagian lainnya masih dikembangkan. Penggunaan di sekolah memerlukan penerimaan bersama para pendidik, langkah rilis tersendiri, dan izin pemilik PINTAR.

### PINTAR 4.0 · Fondasi

| Bidang | Fitur | Bab |
|---|---|---|
| Platform | Pembukaan sekolah terkendali; Admin sekolah pertama | 6.2 |
| Platform | Pustaka PINTAR dan izin materi standar | 6.3 |
| Platform | Koreksi identitas; penangguhan, penutupan, dan pembukaan kembali akun | 6.4–6.5 |
| Platform | Kesehatan layanan dan status email | 6.8 |
| Akun | Aktivasi staf, PINTAR ID, Kartu PINTAR, PIN pribadi | 5.2, 5.7 |
| Akun | Masuk staf; masuk murid dengan kartu kelas | 5.3, 11.2 |
| Akun | Komputer bersama dan pribadi; kunci; keluar dari semua perangkat | 5.4–5.5 |
| Akun | Lupa password; pemulihan dengan PINTAR ID dan PIN; kartu baru | 5.6, 7.7 |
| Akun | Tutup akun dan hapus data pribadi (staf) | 5.7, 6.5 |
| Sekolah | Struktur sekolah dan tahun ajaran | 7.3 |
| Sekolah | Batas ketuntasan | 7.4 |
| Sekolah | Pendataan; penempatan; kartu kelas per kelas | 7.5–7.6 |
| Sekolah | Peran dan masa berlaku; ubah peran & tanggung jawab | 7.8 |
| Sekolah | Pindah kelas; perpindahan antarsekolah | 7.9–7.10 |
| Sekolah | Akhiri pendaftaran; daftarkan kembali; akhiri tugas staf | 7.11 |
| Sekolah | Kenaikan kelas dan kelulusan | 7.14 |
| Sekolah | Sertifikat sekolah: cabut, terbitkan ulang | 7.15 |
| Sekolah | Jejak audit; laporan masalah; email uji | 7.17 |
| Sekolah | Pemeliharaan sekolah atau platform; penghentian darurat platform atau sekolah | 5.8, 6.7 |
| Studio | Paket Pembelajaran dari buku kerja; langkah menuju terbit; tinjauan dua orang | 10.3–10.5 |
| Studio | Bank Soal; Aturan Asesmen; pemahaman keliru; soal wajib | 10.5–10.6 |
| Unggah buku kerja, termasuk draf dari AI milik sekolah sendiri (tanpa biaya tambahan) | 10.3, 10.10 |
| Studio | Revisi dalam satu garis; menarik terbitan | 10.7 |
| Studio | Kesehatan soal | 10.11 |
| Mengajar | Menyediakan materi; mengakhiri atau menarik penugasan | 9.3 |
| Mengajar | Uji Cepat | 9.5 |
| Mengajar | Ringkasan Kelas; Per soal; Catatan murid; minta membaca lagi | 9.6–9.7 |
| Belajar | Pemetaan Awal; Peta Bacaan Personal; pelajaran; bantuan bertahap; Uji Penguasaan; Hasil | 11.4–11.8 |
| Belajar | Sertifikat Penguasaan dengan predikat | 11.9 |
| Pimpinan | Halaman Pimpinan; lingkup; Murid dalam lingkup | 8.2–8.3 |
| Pimpinan | Ringkasan Sekolah; pita kesiapan; jumlah data minimum | 8.4–8.5 |
| Pimpinan | Tinjauan Integritas | 8.6 |
| Pengembangan profesi | Kelas pengembangan profesi; fasilitator; peserta; sertifikat | 12 |
| Publik | Verifikasi sertifikat | 13 |

### PINTAR 4.1 · Integritas, kesinambungan, dan pemulihan

| Fitur | Bab |
|---|---|
| Sekolah dan platform tidak pernah kehilangan admin terakhir; peringatan masa berlaku peran | 6.6 |
| Pengaturan sesi satu murid: tambah waktu, akhiri sesi, minta satu kesempatan lagi, ubah jadwal, lanjutkan sesi yang ditahan | 9.3, 9.8 |
| Hasil yang jelas untuk sesi yang ditinggalkan atau lewat batas waktu | 9.9 |
| Meja kerja soal; revisi soal dan riwayatnya; terbitan yang ditarik tidak dapat dimulai lagi | 10.7 |
| Perbaikan kunci jawaban dengan dua orang; hasil dihitung ulang; sertifikat «Sedang ditinjau» | 10.8 |
| Catatan masuk dan cetak (12 bulan); referensi cetak pada laporan resmi | 7.16, 18.2 |
| Penghentian darurat untuk satu kelas; perlindungan sesi selama penghentian | 6.7 |
| Pemeliharaan terjadwal per kelas, sekolah, atau platform dengan pemberitahuan 60/30/15 menit | 7.12 |
| Jawaban yang sama untuk akun yang ditangguhkan, ditutup, atau salah password | 5.3 |
| Data pribadi yang dihapus tidak dapat dibuka kembali | 6.5 |
| Catatan peninjau di samping soal | 10.9 |
| Pemulihan antarperangkat dengan satu penulis | 9.11, 11.11 |
| AI terpadu untuk draf soal: tambahan berbayar yang opsional, dalam pengembangan, belum pasti | 10.10 |

### PINTAR 4.2 · Kematangan operasional 〔direncanakan〕

| Fitur | Status | Bab |
|---|---|---|
| Mode Ujian | Ditunda ke 4.2 | 9.12 |
| Batas waktu per asesmen | Usulan, belum disetujui | 9.12 |
| Jabatan resmi, pelaksana tugas, peran di dua sekolah | Ditunda ke 4.2 | 4.5, 16.4 |
| Koreksi catatan pengembangan profesi dan struktur sekolah | Ditunda ke 4.2 | 7.18, 12.6 |
| Menambahkan satu orang di luar pendataan berkas; membetulkan nama setelah aktivasi | Ditunda ke 4.2 | 7.5, 7.18 |
| Daftar kelas yang belum memiliki guru | Ditunda ke 4.2 | 7.11, 7.18 |
| Tampilan serah terima kelas | Ke 4.2 melalui rencana pelaksanaan | 7.11, 7.18 |
| Ekspor data sekolah | Ditunda ke 4.2 | 7.18 |
| Membuka laporan periode lalu | Ditunda ke 4.2 | 7.18 |
| Menolak permintaan akun; mengganti password saat masuk | Ditunda ke 4.2 | 5.6, 7.18 |
| Statistik Kesehatan soal terjadwal | Ke 4.2 melalui rencana pelaksanaan | 10.11 |
| Kemudahan jalur AI sendiri (menempel hasil, unggah soal saja, pernyataan bantuan AI) | Usulan, belum disetujui | 10.10 |

Penegakan masa simpan data **tidak** termasuk 4.2. Versinya belum ditetapkan, dan memerlukan kebijakan pemilik PINTAR lebih dulu (6.10).

### PINTAR 4.5 · Memahami 〔arah yang disetujui〕

| Fitur | Bab |
|---|---|
| Kecerdasan Soal dan keterbandingan | 14.3 |
| Identitas kompetensi dan hipotesis prasyarat dari guru | 14.4 |
| Empat jenis pernyataan | 14.2 |
| Quiet Intelligence, termasuk Sebaran Hasil | 14.5 |
| Evaluasi guru yang diatur institusi | 8.9 |
| Perlindungan guru | 14.8 |
| Sejarah yang dapat dijelaskan; sertifikat dari potret | 14.7, 13.5 |
| Masuk dengan WhatsApp; pemeriksaan akses tidak biasa untuk staf | 5.11 |
| Perbaikan perhitungan statistik soal | 10.11 |

### PINTAR 5.0 · Bertindak dan bertumbuh 〔arah yang disetujui〕

| Fitur | Bab |
|---|---|
| Pertumbuhan Guru dan Kesepakatan Pertumbuhan Bersama | 15.5 |
| Intervensi dan tindak lanjut; tiga jenis klaim | 15.3–15.4 |
| Jalur belajar yang diatur | 15.6 |
| Perbaikan di tingkat institusi | 15.7 |

### Pekerjaan internal setelah 4.1

Setelah 4.1 diterima, tim PINTAR akan menjalankan audit untuk membuat PINTAR lebih ringan, lebih cepat, dan lebih mudah dirawat, tanpa mengubah perilaku yang sudah disetujui kecuali peningkatan kecepatan yang terukur. Pengguna tidak perlu melakukan apa pun.

---

## Lampiran B · Usulan, hal yang ditunda, dan hal yang belum ditetapkan

Hal-hal berikut **bukan** janji PINTAR 5.0. Hal-hal ini dicatat agar pembaca tahu bahwa gagasannya pernah dibicarakan dan apa statusnya.

| Gagasan | Status |
|---|---|
| Batas waktu per asesmen | Usulan 4.2, memerlukan persetujuan tersendiri. |
| Penutupan sekolah; fondasi banyak sekolah yang lebih luas; penghapusan data atas permintaan keluarga; penyesuaian materi platform oleh sekolah | Ditunda ke setelah 4.2; versi pasti belum ditetapkan. |
| Model institusi yang lebih luas (misalnya yayasan dengan banyak unit) | Belum ditetapkan; memerlukan keputusan pemilik. |
| Share & Learn (berbagi dengan tautan atau kode QR) | Pernah dicatat sebagai arah 4.5; sumber dan cakupannya belum dipastikan. |
| Portal orang tua | Belum ditetapkan. |
| Kode QR kesinambungan; Context Passport ke luar sekolah | Ditunda ke setelah 5.0. Sejarah internal termasuk 4.5. |
| Continuous PINTAR | Belum ditetapkan. |
| Analitik umum | Belum ditetapkan; pengukuran tertentu termasuk 4.5 dan 5.0. |
| Penyusun sistem pembelajaran umum; aktivitas buatan murid | Ditunda ke setelah 5.0. |
| Pembobotan soal | Ditunda ke setelah 5.0. |
| Penelusuran percakapan dan antarmuka pengaya (*plugin API*) | Ditunda ke setelah 5.0, tanpa komitmen. |
| Tema dan pilihan tampilan terkendali | Ditunda, tanpa versi pasti. |
| Lapisan Pengalaman Lokal; agregasi privasi untuk kelas kecil | Pernah dikaji; belum ada penugasan. |
| Catatan berkode tentang jenis pemahaman keliru | Menunggu keputusan tersendiri. |
| Mengukur kegunaan Quiet Intelligence secara resmi | Perlu dipastikan dalam rencana 4.5. |
| Ringkasan otomatis untuk pimpinan (taklimat) | Disembunyikan di 4.0. |
| Menghentikan Uji Cepat sebelum waktunya | Belum ditetapkan. |
| Membatalkan pencabutan sertifikat; tanggal tahun ajaran yang dapat diubah | Setelah 4.2. |
| Kerja dengan kertas, masuk tunggal (SSO), pengawasan ujian, kartu NFC, gamifikasi | Tidak termasuk cakupan saat ini. |

**Cakrawala riset setelah 5.0** 〔belum ditetapkan〕: bank soal yang terkalibrasi, perbandingan soal buatan AI dan buatan manusia, kecerdasan pemahaman keliru yang menetap, kecerdasan pendidikan jangka panjang, personalisasi yang disetujui guru, siklus perbaikan institusi yang matang, riset lintas sekolah yang diatur, dan studi intervensi yang lebih kuat. Semuanya memerlukan volume bukti yang memadai, ukuran yang dapat dibandingkan, masa simpan, penyamaran data, dan tata kelola riset. Riset lintas sekolah adalah kemungkinan di masa depan, berbeda dari larangan perbandingan antarsekolah di 4.5.

***Contextual Intelligence*** adalah kemungkinan arah riset untuk 6.0. Gagasan ini belum memiliki persetujuan, versi, atau komitmen.

---

## Lampiran C · Glosarium

| Istilah | Penjelasan |
|---|---|
| **Admin PINTAR** (Admin platform) | Peran tim PINTAR yang mengurus platform. Tidak pernah diberikan oleh sekolah. |
| **Admin sekolah** | Peran yang mengurus PINTAR di sebuah sekolah. |
| **Akhiri pendaftaran** | Mencatat bahwa murid tidak lagi bersekolah di sini, dengan alasannya. Hasilnya tidak berubah. |
| **Aktivasi** | Langkah ketika seseorang yang sudah didata mulai memakai akunnya. |
| **Angkatan** | Kelompok tahun ajaran tempat sebuah sesi tercatat. |
| **Asesmen** | Kegiatan yang menghasilkan bukti belajar: Pemetaan Awal, Uji Penguasaan, Uji Cepat. |
| **Bagian · Tingkat · Kelas** | Tiga tingkat struktur sekolah, misalnya SMP · Kelas 7 · 7A. |
| **Bank Soal** | Tempat menjelajah dan meninjau soal. |
| **Batas ketuntasan** | Nilai minimum (0–100) yang ditetapkan sekolah untuk mencapai target. |
| **Belum dapat disimpulkan** | 〔4.5〕 Hasil yang jujur ketika bukti tidak cukup atau tidak cocok. |
| **Bukti** | Catatan dari pembelajaran dan asesmen yang menjadi dasar laporan. |
| **Buku kerja** | Berkas Excel (.xlsx) untuk menyusun Paket Pembelajaran. |
| **Catatan masuk dan cetak** | 〔4.1〕 Catatan akuntabilitas 12 bulan tentang siapa yang masuk, keluar, atau mencetak laporan resmi. |
| **Dekan** | Peran pimpinan yang melihat gambaran lingkupnya dan memutuskan hal yang menunggu. |
| **Dihitung ulang** | 〔4.1〕 Tanda pada hasil yang dihitung ulang setelah koreksi kunci jawaban. |
| **Ditahan** | 〔4.1〕 Keadaan sesi asesmen selama penghentian darurat atau penangguhan, dengan jawaban dan sisa waktu tersimpan. |
| **Guru** | Peran untuk mengajar: menyediakan materi, Uji Cepat, membaca bukti, mengatur sesi. |
| **Identitas kompetensi** | 〔4.5〕 Cara mengenali bahwa soal-soal yang berbeda menguji keterampilan yang sama. |
| **Intervensi** | 〔5.0〕 Tindakan perbaikan yang dipilih guru dan dicatat untuk diamati hasilnya. |
| **Jejak audit** | Catatan tindakan penting: siapa, peran apa, kapan, dan alasannya. |
| **Jendela** | Rentang waktu sebuah materi tersedia untuk kelas («Mulai» dan «Sampai»). |
| **Kartu kelas** | Kartu berisi nomor kartu dan PIN, dipakai murid untuk masuk. |
| **Kartu PINTAR** | Kartu identitas digital staf, memuat PINTAR ID. |
| **Kecerdasan Soal** (*Question Intelligence*) | 〔4.5〕 Pemeriksaan mutu soal yang lebih mendalam. Nama kerja. |
| **Kenaikan** | Perubahan hasil dari Pemetaan Awal ke Uji Penguasaan. |
| **Kenaikan kelas dan kelulusan** | Proses akhir tahun ajaran: naik, tinggal, lulus, keluar, atau pindah. |
| **Kepala departemen** | Peran pimpinan dengan kewenangan Guru ditambah meninjau materi, mutu soal, integritas, dan keputusan. |
| **Kesempatan** | Jumlah percobaan sebuah asesmen. Uji Penguasaan memiliki dua kesempatan. |
| **Kesepakatan Pertumbuhan Bersama** (*Shared Growth Compact*) | 〔5.0〕 Syarat bersama tentang siapa yang dapat melihat dan memakai catatan pertumbuhan guru. Nama kerja. |
| **Kesehatan soal** | Sinyal mutu soal untuk peninjau. |
| **Lingkup** | Bagian sekolah tempat sebuah peran berlaku. |
| **Mantap · Berkembang · Perlu penguatan** | Tiga pita kesiapan di laporan. |
| **Mode Ujian** | 〔4.2〕 Penyelenggaraan asesmen dalam kondisi ujian. |
| **Murid** | Peran untuk belajar: siswa, mahasiswa, atau peserta pelatihan akademik. |
| **Paket Pembelajaran** | Satu bab materi: tujuan, bacaan, Pemetaan Awal, dan Uji Penguasaan. |
| **Pemahaman keliru** | Miskonsepsi yang dapat dikaitkan dengan pilihan jawaban. |
| **Pemeliharaan** | Waktu terjadwal ketika asesmen baru belum dapat dimulai di lingkup tertentu. |
| **Pemetaan Awal** | Asesmen awal sebuah bab untuk memilih bacaan yang pas. Bukan ulangan. |
| **Pendataan** | Mencatat orang-orang dari berkas. Tidak membuat akun. |
| **Penghentian darurat** | Penghentian sementara oleh Admin PINTAR. Sesi ditahan, tidak dinilai. |
| **Penyediaan** («Sediakan») | Memberikan materi yang sudah terbit kepada kelas. |
| **Peserta** | Guru yang mengikuti pengembangan profesi. |
| **Peta Bacaan Personal** | Urutan bacaan awal yang disarankan dari Pemetaan Awal. |
| **PIN pribadi** | PIN empat angka milik staf, dipakai untuk membuka kunci dan memulihkan akun. |
| **PINTAR ID** | Tanda pengenal staf di PINTAR. Bukan kunci untuk masuk. |
| **Pimpinan** | Sebutan umum untuk Kepala departemen dan Dekan, dan nama halaman utama mereka. |
| **Predikat** | Keterangan di sertifikat: Cukup (≥ 70%), Baik (≥ 80%), Sangat Baik (≥ 90%). |
| **Pustaka PINTAR** | Kumpulan materi standar dari PINTAR. |
| **Quiet Intelligence** | 〔4.5〕 Penjelasan yang tenang dan relevan tentang apa yang didukung bukti. Nama kerja. |
| **Referensi cetak** | 〔4.1〕 Kode «CTK-…» pada laporan resmi yang dicetak. |
| **Revisi** | Versi baru sebuah materi atau soal dalam garis yang sama. |
| **Ringkasan Kelas · Ringkasan Sekolah** | Laporan tingkat kelas dan tingkat sekolah. |
| **Sebaran Hasil** (*Performance Distribution*) | 〔4.5〕 Tampilan penyebaran hasil dengan jumlah data. Nama kerja. |
| **Sertifikat Penguasaan** | Sertifikat dari Uji Penguasaan yang mencapai target. |
| **Sesi** | Satu kali pengerjaan sebuah asesmen oleh seorang murid. |
| **Soal wajib** | Soal penting yang harus dijawab benar. |
| **Studio** | Tempat menyusun, meninjau, dan menerbitkan materi. |
| **Terbitan** | Versi materi yang dikunci untuk diterbitkan. |
| **Uji Cepat** | Asesmen singkat di kelas. Tidak menerbitkan sertifikat. |
| **Uji Penguasaan** | Asesmen akhir sebuah bab yang menentukan apakah target tercapai. |
| **Verifikasi Sertifikat** | Halaman umum untuk memeriksa keaslian sertifikat. |
| **Yang menunggu** | Daftar hal yang menunggu tindakan Admin sekolah. |

---

## Lampiran D · Daftar ilustrasi yang direncanakan

| No. | Isi | Bab |
|---|---|---|
| 1.1 | Empat langkah dari tujuan pembelajaran ke langkah mengajar berikutnya | 1.3 |
| 1.2 | Siklus belajar tujuh tahap dengan jalan kembali | 1.4 |
| 4.1 | Peta peran: enam peran, lingkup, dan halaman utama | 4.4 |
| 7.1 | Lini masa satu tahun ajaran Admin sekolah | 7.1 |
| 7.2 | Tiga langkah kenaikan kelas | 7.14 |
| 9.1 | Laporan satu soal dengan catatan guru (ilustrasi konsep, data contoh) | 9.6 |
| 10.1 | Alur dari draf sampai terbit dan pemakaian bersama | 10.4 |
| 14.1 | Lima tahap dari bukti ke keputusan guru | 14.1 |
| 15.1 | Siklus tujuh langkah perbaikan | 15.2 |

Tangkapan layar asli dari PINTAR, dengan data contoh, dapat ditambahkan setelah PINTAR 4.1 diterima. Tidak ada tangkapan layar yang boleh dibuat-buat.

---

## Lampiran E · Rujukan silang cepat: "Saya ingin…"

| Saya ingin… | Lihat |
|---|---|
| mengaktifkan akun staf saya | 5.2 |
| masuk dengan kartu kelas | 11.2 |
| memulihkan password atau PIN | 5.6 |
| keluar dari semua perangkat | 5.5 |
| menutup akun saya | 5.7, 6.5 |
| menyusun struktur sekolah | 7.3 |
| menetapkan batas ketuntasan | 7.4 |
| mendata murid dan staf | 7.5 |
| mencetak kartu kelas | 7.6 |
| menerbitkan kartu baru untuk murid | 7.7 |
| memberi atau mengubah peran staf | 7.8 |
| memindahkan murid ke kelas lain | 7.9 |
| memindahkan murid ke sekolah lain | 7.10 |
| mencatat murid keluar atau guru pensiun | 7.11 |
| menjalankan kenaikan kelas | 7.14 |
| menjadwalkan pemeliharaan | 7.12 |
| mencari siapa yang mencetak sebuah laporan | 7.16 |
| menyusun Paket Pembelajaran | 10.3 |
| meninjau materi | 10.5 |
| memperbaiki kunci jawaban | 10.8 |
| menyediakan materi untuk kelas | 9.3 |
| mengadakan Uji Cepat | 9.5 |
| melihat soal yang sulit bagi kelas | 9.6 |
| menambah waktu atau meminta kesempatan lagi untuk murid | 9.8 |
| membaca Ringkasan Sekolah | 8.4 |
| memeriksa keaslian sertifikat | 13 |
| memahami arah 4.5 dan 5.0 | 14, 15 |

---

*Akhir Draf 01a. Draf ini disusun untuk ditinjau pemilik PINTAR dan belum disetujui.*
