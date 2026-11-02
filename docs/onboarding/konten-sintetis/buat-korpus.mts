// F-4 (D-145(b)): THE SYNTHETIC DEVELOPMENT CORPUS. Two short chapters of SD Kelas 5 Matematika, written new for
// Batch 1 by the engineering lane (0 items, 0 options, 0 rationales and 0 lesson lines taken or paraphrased from real
// teaching material). Real chapters with their answer keys left the public tree (F-4) and live in the private content
// store; nothing in development, CI or the audits needs them.
//
// What this script writes, every time, from the text below and nothing else:
//   docs/onboarding/konten-sintetis/SD5-Sintetis-Bab{1,2}.xlsx       the workbook, as a school would upload it
//   docs/onboarding/konten-sintetis/SD5-Sintetis-Bab{1,2}.paket.json what the upload page makes of that workbook,
//                                                                   with the app's own reader and converter
//   audit/fixtures/sd5-sintetis-bab{1,2}.paket.json                  the same package, for audit/journey.mjs
//
// The chapters carry keys on purpose (they are synthetic; scripts/guard/allowlist.json declares each file
// «sintetis»). The text a learner would read never says «sintetis»: the database's learner-text check
// (public.doctrine_lexicon) treats internal evidence words in learner text as findings. The note that says so sits on a
// «Catatan» sheet, which the importer ignores.
//
// The corpus deliberately exercises every markup the shared lesson renderer draws (DAISY-30): pages at "## ", **bold**,
// whole italic lines («_Periksa: …_», «_Diadaptasi dari …_»), "- " lists with indented, nested items, and pipe tables;
// and every rule the upload, the misconception sheet and Studio's question-quality pass check (PENUTUPAN-M04,
// run_mcq_quality, validate_learner_text): four options A–D, exactly one correct, a reason on every option, every wrong
// option naming a misconception its own «Miskonsepsi» sheet defines and every definition used, unique questions, the
// key spread over the four letters, 4 «Pemetaan awal» and 8 «Cek penguasaan» questions per chapter.
//
// Run: npx tsx docs/onboarding/konten-sintetis/buat-korpus.mts
//      python3 docs/onboarding/konten/periksa_mutu.py docs/onboarding/konten-sintetis/SD5-Sintetis-Bab1.paket.json
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { KOLOM, type NamaLembar } from "../../../src/lib/unggah-kontrak";
import { bacaBukuKerja } from "../../../src/lib/xlsx";
import { bukuKerjaKePaket } from "../../../src/lib/unggah-kontrak";
import { tulisBukuKerja } from "../../../src/components/unggah/templat";

type Huruf = "A" | "B" | "C" | "D";
/** A distractor: its text, its reason, and the misconception (the number on its chapter's sheet). */
type Pengecoh = [teks: string, alasan: string, miskonsepsi: number];
type Soal = {
  pelajaran: number;
  guna: "" | "Pemetaan awal" | "Cek penguasaan";
  sulit: "Mudah" | "Sedang" | "Sulit";
  tanya: string;
  /** Where the correct option stands, and the three distractors in the order they fill the other letters. */
  kunci: Huruf;
  benar: [teks: string, alasan: string];
  pengecoh: [Pengecoh, Pengecoh, Pengecoh];
};
type Pelajaran = { judul: string; ringkasan: string; tujuan: string; berpikir: string; isi: string[] };
type Miskonsepsi = { nama: string; penjelasan: string; bantuan: string };
type Bab = { berkas: string; fixture: string; kode: string; judulBab: string; pelajaran: Pelajaran[]; miskonsepsi: Miskonsepsi[]; soal: Soal[] };

// ═══════════════════════════════════════════════════════════════════ Bab 1: Pola Bilangan

const BAB1: Bab = {
  berkas: "SD5-Sintetis-Bab1",
  fixture: "sd5-sintetis-bab1",
  kode: "SINT5-B1",
  judulBab: "Pola Bilangan",
  pelajaran: [
    {
      judul: "Mengenal Pola Bertambah",
      ringkasan: "Barisan yang setiap langkahnya bertambah dengan bilangan yang sama, selisihnya, dan cara melanjutkannya.",
      tujuan: "Kalian dapat menentukan selisih pola bertambah tetap dan melanjutkan barisannya.",
      berpikir: "Memahami",
      isi: [
        "## Apa itu pola bertambah",
        "Lihat barisan 2, 5, 8, 11. Dari 2 ke 5 bertambah 3, dari 5 ke 8 bertambah 3, dan dari 8 ke 11 juga bertambah 3.",
        "",
        "Barisan yang setiap langkahnya bertambah dengan bilangan yang sama disebut **pola bertambah tetap**. Bilangan yang ditambahkan itu disebut **selisih**.",
        "",
        "Setiap bilangan dalam barisan disebut **suku**:",
        "- 2 adalah suku ke-1",
        "- 5 adalah suku ke-2",
        "- 8 adalah suku ke-3",
        "- 11 adalah suku ke-4",
        "",
        "## Mencari selisih",
        "Untuk mencari selisih, kurangkan suku dari suku sesudahnya. Periksa paling sedikit tiga pasang suku, bukan satu pasang saja.",
        "",
        "Contoh: barisan 7, 12, 17, 22.",
        "- 12 − 7 = 5",
        "- 17 − 12 = 5",
        "- 22 − 17 = 5",
        "",
        "Selisihnya selalu 5, jadi barisan ini pola bertambah tetap dengan selisih **5**.",
        "",
        "**Coba:** berapa selisih barisan 9, 13, 17, 21?",
        "_Periksa: 13 − 9 = 4, 17 − 13 = 4, dan 21 − 17 = 4. Selisihnya 4._",
        "",
        "## Melanjutkan barisan",
        "Jika selisihnya sudah diketahui, suku berikutnya didapat dengan menambahkan selisih pada suku terakhir. Barisan 7, 12, 17, 22 dilanjutkan menjadi 27, 32, 37, dan seterusnya.",
        "",
        "Ingat dua hal:",
        "- tambahkan selisihnya, bukan suku pertamanya",
        "- hitung langkah satu per satu sampai suku yang diminta",
        "",
        "**Coba:** lanjutkan barisan 3, 9, 15, 21 dua suku lagi.",
        "_Periksa: selisihnya 6, jadi 21 + 6 = 27 dan 27 + 6 = 33._",
      ],
    },
    {
      judul: "Pola Berkurang",
      ringkasan: "Barisan yang setiap langkahnya berkurang dengan bilangan yang sama, dan contohnya sehari-hari.",
      tujuan: "Kalian dapat menentukan selisih pola berkurang tetap dan melanjutkan barisannya.",
      berpikir: "Menerapkan",
      isi: [
        "## Barisan yang turun",
        "Barisan 40, 36, 32, 28 makin kecil. Setiap langkah berkurang 4. Barisan seperti ini disebut **pola berkurang tetap**.",
        "",
        "Cara mencari selisihnya sama: kurangkan suku sesudahnya dari suku sebelumnya.",
        "- 40 − 36 = 4",
        "- 36 − 32 = 4",
        "- 32 − 28 = 4",
        "",
        "## Melanjutkan pola berkurang",
        "Untuk melanjutkan, kurangkan selisih dari suku terakhir: 28 − 4 = 24, lalu 24 − 4 = 20.",
        "",
        "Pola berkurang sering kita temui sehari-hari:",
        "- sisa air di botol yang diminum sedikit demi sedikit",
        "- sisa halaman buku yang belum dibaca",
        "- sisa uang saku sesudah jajan setiap hari",
        "",
        "**Coba:** barisan 63, 56, 49, 42. Berapa dua suku berikutnya?",
        "_Periksa: selisihnya 7, jadi 42 − 7 = 35 dan 35 − 7 = 28._",
      ],
    },
    {
      judul: "Pola pada Tabel dan Gambar",
      ringkasan: "Pola yang tampak pada susunan benda dan pada tabel, serta cara melengkapi tabelnya.",
      tujuan: "Kalian dapat membaca pola dari gambar atau tabel dan melengkapi nilai yang belum ada.",
      berpikir: "Menerapkan",
      isi: [
        "## Pola pada gambar",
        "Sebuah susunan persegi dibuat dari batang lidi. Persegi pertama memerlukan 4 lidi. Setiap persegi yang ditempel di sampingnya memerlukan 3 lidi lagi.",
        "- 1 persegi: 4 lidi",
        "- 2 persegi: 7 lidi",
        "- 3 persegi: 10 lidi",
        "",
        "Banyak lidi membentuk barisan 4, 7, 10 dengan selisih 3.",
        "",
        "## Pola pada tabel",
        "Pola juga dapat dituliskan dalam tabel. Baris atas menunjukkan urutan, baris bawah menunjukkan nilainya.",
        "",
        "| Banyak persegi | 1 | 2 | 3 | 4 | 5 |",
        "|---|---|---|---|---|---|",
        "| Banyak lidi | 4 | 7 | 10 | 13 | 16 |",
        "",
        "Bacalah tabel per kolom: untuk 4 persegi, cari kolom yang atasnya 4, lalu baca angka di bawahnya, yaitu 13.",
        "",
        "## Melengkapi tabel",
        "Tabel harga pensil di koperasi sekolah:",
        "",
        "| Banyak pensil | Harga |",
        "|---|---|",
        "| 1 | Rp2.500 |",
        "| 2 | Rp5.000 |",
        "| 3 | Rp7.500 |",
        "",
        "Setiap pensil menambah Rp2.500. Untuk melengkapi tabel:",
        "- tentukan selisih pada kolom harga",
        "- tambahkan selisih itu baris demi baris",
        "  - 4 pensil: Rp7.500 + Rp2.500 = Rp10.000",
        "  - 5 pensil: Rp10.000 + Rp2.500 = Rp12.500",
        "",
        "_Periksa: 5 × Rp2.500 = Rp12.500, sama dengan hasil penjumlahan berulang._",
      ],
    },
    {
      judul: "Memecahkan Masalah dengan Pola",
      ringkasan: "Langkah memakai pola untuk soal cerita: jadwal, susunan benda, dan pola yang dikali.",
      tujuan: "Kalian dapat memakai pola bertambah, berkurang, atau dikali untuk memecahkan masalah sehari-hari.",
      berpikir: "Menganalisis",
      isi: [
        "## Langkah memecahkan masalah",
        "Banyak soal cerita dapat diselesaikan dengan pola. Gunakan langkah berikut:",
        "- tuliskan beberapa suku pertama",
        "- cari selisihnya",
        "- lanjutkan sampai suku yang diminta",
        "- periksa jawaban dengan cara lain",
        "",
        "## Contoh: jadwal kereta mainan",
        "Kereta mainan di taman berangkat pukul 08.00 dan berangkat lagi setiap 20 menit.",
        "",
        "| Keberangkatan ke- | Pukul |",
        "|---|---|",
        "| 1 | 08.00 |",
        "| 2 | 08.20 |",
        "| 3 | 08.40 |",
        "| 4 | 09.00 |",
        "",
        "Keberangkatan ke-4 adalah pukul **09.00**.",
        "",
        "## Contoh: menyusun kursi",
        "Kursi di aula disusun berbaris. Baris pertama berisi 6 kursi, dan setiap baris berikutnya 2 kursi lebih banyak.",
        "- baris ke-1: 6 kursi",
        "- baris ke-2: 8 kursi",
        "- baris ke-3: 10 kursi",
        "",
        "Banyak kursi pada tiga baris pertama adalah 6 + 8 + 10 = **24 kursi**.",
        "_Periksa: baris pertama ikut dijumlahkan, bukan hanya baris yang terakhir._",
        "",
        "## Pola yang dikali",
        "Tidak semua pola bertambah tetap. Pada barisan 3, 6, 12, 24, setiap suku adalah **dua kali** suku sebelumnya.",
        "",
        "Untuk mengenali jenis pola, periksa dua hal:",
        "- apakah selisihnya selalu sama?",
        "  - jika ya, polanya bertambah atau berkurang tetap",
        "- apakah hasil baginya selalu sama?",
        "  - jika ya, polanya dikali tetap",
        "",
        "**Coba:** lanjutkan barisan 2, 6, 18 satu suku lagi.",
        "_Periksa: setiap suku dikali 3, jadi 18 × 3 = 54._",
      ],
    },
  ],
  miskonsepsi: [
    { nama: "Suku pertama dipakai sebagai selisih", penjelasan: "Murid menambahkan suku pertama pada suku terakhir, seolah-olah suku pertama adalah selisihnya.", bantuan: "Tuliskan pengurangan dua suku berurutan di bawah barisan, lalu tambahkan hasil pengurangan itu." },
    { nama: "Arah pola terbalik", penjelasan: "Murid menambah pada pola yang berkurang, atau mengurangi pada pola yang bertambah.", bantuan: "Tandai dengan panah naik atau turun di antara suku sebelum melanjutkan barisan." },
    { nama: "Banyak langkah meleset", penjelasan: "Murid berhenti satu langkah terlalu cepat atau terlalu jauh dari suku yang diminta.", bantuan: "Beri nomor urut di bawah setiap suku dan berhenti tepat pada nomor yang diminta." },
    { nama: "Pola tambah dan pola kali tertukar", penjelasan: "Murid mengalikan pada pola yang ditambah tetap, atau menambah tetap pada pola yang dikali.", bantuan: "Periksa dulu selisih dan hasil bagi dua suku berurutan; pilih yang selalu sama." },
    { nama: "Pola dianggap selalu naik atau turun satu", penjelasan: "Murid menambah atau mengurangi 1, tanpa melihat selisih barisan itu.", bantuan: "Hitung selisih tiga pasang suku dan bandingkan hasilnya sebelum melanjutkan." },
    { nama: "Nilai dibaca dari baris atau kolom lain", penjelasan: "Murid mengambil angka dari baris atau kolom tabel yang bukan pasangannya.", bantuan: "Tunjuk urutan pada baris atas, lalu turunkan jari lurus ke nilai pasangannya." },
    { nama: "Semua suku dijumlahkan", penjelasan: "Murid menjumlahkan suku-suku yang terlihat, padahal yang diminta satu suku tertentu.", bantuan: "Garis bawahi kata tanya pada soal: suku keberapa yang diminta, atau jumlah semuanya." },
    { nama: "Selisih dan suku tertukar", penjelasan: "Murid menjawab selisih atau besar perubahan, padahal yang diminta sukunya, atau sebaliknya.", bantuan: "Tuliskan dua baris terpisah: baris suku dan baris selisih, lalu pilih baris yang ditanyakan." },
    { nama: "Suku pertama lupa dijumlahkan", penjelasan: "Saat menjumlahkan suku-suku, murid tidak menghitung suku pertama.", bantuan: "Coret setiap suku yang sudah dijumlahkan, mulai dari suku pertama." },
  ],
  soal: [
    { pelajaran: 1, guna: "Pemetaan awal", sulit: "Mudah", kunci: "A",
      tanya: "Barisan 4, 7, 10, 13, ... bertambah tetap. Bilangan berapa yang datang sesudah 13?",
      benar: ["16", "Setiap langkah bertambah 3, jadi 13 + 3 = 16."],
      pengecoh: [
        ["17", "17 didapat dari 13 + 4; 4 adalah suku pertama, sedangkan selisihnya 7 − 4 = 3.", 1],
        ["26", "26 adalah 13 × 2. Barisan ini ditambah 3 setiap langkah, tidak dikali.", 4],
        ["14", "14 hanya menambah 1. Selisih dua suku berurutan pada barisan ini 3.", 5],
      ] },
    { pelajaran: 1, guna: "Pemetaan awal", sulit: "Mudah", kunci: "B",
      tanya: "Berapa selisih tetap pada barisan 5, 11, 17, 23, ...?",
      benar: ["6", "11 − 5 = 6, 17 − 11 = 6, dan 23 − 17 = 6."],
      pengecoh: [
        ["5", "5 adalah suku pertama. Selisih adalah jarak dari satu suku ke suku sesudahnya.", 1],
        ["29", "29 adalah suku berikutnya (23 + 6). Yang ditanyakan selisihnya.", 8],
        ["56", "56 adalah 5 + 11 + 17 + 23, jumlah keempat suku. Yang ditanyakan selisih dua suku berurutan.", 7],
      ] },
    { pelajaran: 1, guna: "Cek penguasaan", sulit: "Sedang", kunci: "C",
      tanya: "Pada barisan 3, 8, 13, 18, ..., berapakah suku ke-6?",
      benar: ["28", "Suku ke-5 adalah 23, dan suku ke-6 adalah 23 + 5 = 28."],
      pengecoh: [
        ["23", "23 adalah suku ke-5. Satu langkah lagi: 23 + 5 = 28.", 3],
        ["33", "33 adalah suku ke-7; hitungan sudah lewat satu langkah.", 3],
        ["36", "36 adalah 18 × 2. Barisan ini bertambah 5 setiap langkah.", 4],
      ] },
    { pelajaran: 1, guna: "Cek penguasaan", sulit: "Sedang", kunci: "D",
      tanya: "Rina mengumpulkan kelereng. Hari pertama ia punya 6 butir, lalu setiap hari bertambah 4 butir. Berapa kelereng Rina pada hari ke-5?",
      benar: ["22", "6, 10, 14, 18, 22: pada hari ke-5 Rina punya 22 kelereng."],
      pengecoh: [
        ["18", "18 adalah banyak kelereng pada hari ke-4.", 3],
        ["26", "26 adalah banyak kelereng pada hari ke-6; hari ke-1 sudah 6 butir.", 3],
        ["30", "30 adalah 6 × 5. Setiap hari kelerengnya ditambah 4, tidak dikali.", 4],
      ] },
    { pelajaran: 1, guna: "", sulit: "Mudah", kunci: "A",
      tanya: "Lanjutkan barisan 20, 30, 40, 50, ... Bilangan berapa yang datang sesudah 50?",
      benar: ["60", "Selisihnya 10, jadi 50 + 10 = 60."],
      pengecoh: [
        ["51", "51 hanya menambah 1, padahal setiap langkah bertambah 10.", 5],
        ["70", "70 didapat dari 50 + 20; 20 adalah suku pertama, sedangkan selisihnya 10.", 1],
        ["100", "100 adalah 50 × 2; barisan ini ditambah 10 setiap langkah.", 4],
      ] },
    { pelajaran: 1, guna: "", sulit: "Sedang", kunci: "B",
      tanya: "Barisan 2, 9, 16, 23, ... bertambah tetap. Manakah pernyataan yang tepat?",
      benar: ["Selisihnya 7 dan suku berikutnya 30", "9 − 2 = 7, jadi suku berikutnya 23 + 7 = 30."],
      pengecoh: [
        ["Selisihnya 2 dan suku berikutnya 25", "2 adalah suku pertama. Selisihnya 9 − 2 = 7.", 1],
        ["Selisihnya 7 dan suku berikutnya 46", "46 adalah 23 × 2; suku berikutnya didapat dengan menambah 7.", 4],
        ["Selisihnya 1 dan suku berikutnya 24", "Barisan ini tidak naik satu-satu; periksa 9 − 2.", 5],
      ] },
    { pelajaran: 2, guna: "Pemetaan awal", sulit: "Mudah", kunci: "C",
      tanya: "Barisan 50, 45, 40, 35, ... berkurang tetap. Bilangan berapa yang datang sesudah 35?",
      benar: ["30", "35 − 5 = 30."],
      pengecoh: [
        ["40", "40 sudah ada di barisan; menambah 5 berarti arah polanya terbalik.", 2],
        ["34", "34 hanya berkurang 1, padahal setiap langkah berkurang 5.", 5],
        ["25", "25 adalah dua langkah sesudah 35, bukan satu langkah.", 3],
      ] },
    { pelajaran: 2, guna: "Cek penguasaan", sulit: "Sedang", kunci: "A",
      tanya: "Tandon sekolah berisi 96 liter air. Setiap hari terpakai 8 liter. Berapa liter air yang tersisa sesudah 4 hari?",
      benar: ["64 liter", "Dalam 4 hari terpakai 4 × 8 = 32 liter, jadi tersisa 96 − 32 = 64 liter."],
      pengecoh: [
        ["72 liter", "72 liter adalah sisa air sesudah 3 hari.", 3],
        ["128 liter", "128 liter didapat dengan menambah 32; air yang terpakai harus dikurangkan.", 2],
        ["32 liter", "32 liter adalah air yang terpakai selama 4 hari, bukan air yang tersisa.", 8],
      ] },
    { pelajaran: 2, guna: "Cek penguasaan", sulit: "Sulit", kunci: "D",
      tanya: "Barisan 81, 74, 67, 60, ... berkurang tetap. Suku keberapa yang bernilai 39?",
      benar: ["Suku ke-7", "81, 74, 67, 60, 53, 46, 39: bilangan 39 adalah suku ke-7."],
      pengecoh: [
        ["Suku ke-6", "Suku ke-6 bernilai 46. Ada 6 langkah dari 81 ke 39, dan suku pertama juga dihitung.", 3],
        ["Suku ke-42", "42 adalah 81 − 39, besar perubahannya, bukan urutan suku.", 8],
        ["Suku ke-8", "Suku ke-8 bernilai 32; 39 sudah tercapai satu langkah sebelumnya.", 3],
      ] },
    { pelajaran: 2, guna: "", sulit: "Mudah", kunci: "B",
      tanya: "Barisan 100, 90, 80, 70, ... berkurang 10 setiap langkah. Bilangan berapa yang datang sesudah 70?",
      benar: ["60", "70 − 10 = 60."],
      pengecoh: [
        ["80", "80 adalah suku sebelum 70; barisan ini turun.", 2],
        ["69", "69 hanya berkurang 1, padahal setiap langkah berkurang 10.", 5],
        ["340", "340 adalah jumlah keempat suku, bukan suku berikutnya.", 7],
      ] },
    { pelajaran: 2, guna: "", sulit: "Sedang", kunci: "C",
      tanya: "Di gudang ada 40 kursi. Setiap jam 6 kursi dibawa ke aula. Berapa kursi yang tersisa di gudang sesudah 3 jam?",
      benar: ["22 kursi", "Dalam 3 jam dibawa 3 × 6 = 18 kursi; 40 − 18 = 22."],
      pengecoh: [
        ["34 kursi", "34 kursi adalah sisa sesudah 1 jam; masih ada 2 jam lagi.", 3],
        ["58 kursi", "58 didapat dengan menambah 18; kursi yang dibawa pergi harus dikurangkan.", 2],
        ["18 kursi", "18 kursi adalah yang dibawa ke aula, bukan yang tersisa.", 8],
      ] },
    { pelajaran: 3, guna: "Pemetaan awal", sulit: "Sedang", kunci: "A",
      tanya: "Gambar ke-1 memakai 3 batang korek, gambar ke-2 memakai 5 batang, dan gambar ke-3 memakai 7 batang. Berapa batang korek pada gambar ke-4?",
      benar: ["9 batang", "Setiap gambar menambah 2 batang: 7 + 2 = 9."],
      pengecoh: [
        ["10 batang", "10 didapat dari 7 + 3; 3 adalah banyak batang gambar ke-1, bukan tambahannya.", 1],
        ["8 batang", "8 hanya menambah 1 batang; tambahannya 2 setiap gambar.", 5],
        ["15 batang", "15 adalah 3 + 5 + 7, jumlah batang ketiga gambar.", 7],
      ] },
    { pelajaran: 3, guna: "Cek penguasaan", sulit: "Sedang", kunci: "B",
      tanya: "Daftar harga di koperasi: 1 buku Rp4.000, 2 buku Rp8.000, 3 buku Rp12.000. Jika polanya tetap, berapa harga 5 buku?",
      benar: ["Rp20.000", "Setiap buku menambah Rp4.000, jadi 5 buku seharga Rp20.000."],
      pengecoh: [
        ["Rp16.000", "Rp16.000 adalah harga 4 buku.", 3],
        ["Rp24.000", "Rp24.000 adalah Rp12.000 × 2; harganya bertambah Rp4.000 per buku.", 4],
        ["Rp60.000", "Rp60.000 memakai harga 3 buku seolah-olah harga 1 buku.", 6],
      ] },
    { pelajaran: 3, guna: "Cek penguasaan", sulit: "Sulit", kunci: "C",
      tanya: "Tinggi sebuah tanaman: minggu ke-1 5 cm, minggu ke-2 8 cm, minggu ke-3 11 cm. Jika bertambah tetap, pada minggu keberapa tingginya 20 cm?",
      benar: ["Minggu ke-6", "5, 8, 11, 14, 17, 20: tinggi 20 cm dicapai pada minggu ke-6."],
      pengecoh: [
        ["Minggu ke-5", "Pada minggu ke-5 tingginya baru 17 cm.", 3],
        ["Minggu ke-15", "15 adalah pertambahan tinggi dari 5 cm ke 20 cm, bukan urutan minggu.", 8],
        ["Minggu ke-7", "Pada minggu ke-7 tingginya sudah 23 cm.", 3],
      ] },
    { pelajaran: 3, guna: "", sulit: "Sedang", kunci: "D",
      tanya: "Baris pertama sebuah tabel berisi banyak meja: 1, 2, 3, 4. Baris kedua berisi banyak kursi: 4, 8, 12, 16. Berapa kursi untuk 6 meja?",
      benar: ["24 kursi", "Setiap meja mendapat 4 kursi: 6 × 4 = 24."],
      pengecoh: [
        ["20 kursi", "20 kursi adalah pasangan untuk 5 meja.", 3],
        ["6 kursi", "6 adalah banyak meja; banyak kursi dibaca di baris kedua.", 6],
        ["40 kursi", "40 adalah 4 + 8 + 12 + 16, jumlah semua kursi pada tabel.", 7],
      ] },
    { pelajaran: 4, guna: "Cek penguasaan", sulit: "Sedang", kunci: "D",
      tanya: "Bus pertama berangkat pukul 06.00, lalu setiap 15 menit berangkat bus berikutnya. Pukul berapa bus keempat berangkat?",
      benar: ["Pukul 06.45", "Bus ke-1 06.00, ke-2 06.15, ke-3 06.30, ke-4 06.45."],
      pengecoh: [
        ["Pukul 07.00", "Pukul 07.00 adalah keberangkatan bus kelima.", 3],
        ["Pukul 06.30", "Pukul 06.30 adalah keberangkatan bus ketiga.", 3],
        ["Pukul 06.04", "06.04 menambah satu menit untuk setiap bus; selangnya 15 menit.", 5],
      ] },
    { pelajaran: 4, guna: "Cek penguasaan", sulit: "Sulit", kunci: "B",
      tanya: "Pak Dimas menyusun batu bata bertingkat. Tingkat paling atas berisi 2 bata, dan setiap tingkat di bawahnya berisi 3 bata lebih banyak. Ada 4 tingkat. Berapa bata seluruhnya?",
      benar: ["26 bata", "Tingkatnya berisi 2, 5, 8, dan 11 bata; 2 + 5 + 8 + 11 = 26."],
      pengecoh: [
        ["11 bata", "11 bata hanya isi tingkat paling bawah; yang ditanyakan jumlah semua tingkat.", 8],
        ["24 bata", "24 adalah 5 + 8 + 11; tingkat paling atas belum ikut dijumlahkan.", 9],
        ["12 bata", "12 adalah 3 × 4; 3 adalah tambahan setiap tingkat, bukan isi tingkatnya.", 8],
      ] },
    { pelajaran: 4, guna: "", sulit: "Sulit", kunci: "C",
      tanya: "Sebuah barisan dimulai dari 1, dan setiap suku adalah dua kali suku sebelumnya: 1, 2, 4, 8, ... Berapakah suku ke-6?",
      benar: ["32", "1, 2, 4, 8, 16, 32: suku ke-6 adalah 32."],
      pengecoh: [
        ["16", "16 adalah suku ke-5; masih satu langkah lagi.", 3],
        ["11", "11 didapat jika setiap langkah ditambah 2; barisan ini dikali 2.", 4],
        ["64", "64 adalah suku ke-7; hitungan sudah lewat satu langkah.", 3],
      ] },
  ],
};

// ═══════════════════════════════════════════════════════════════════ Bab 2: Data Sederhana

const BAB2: Bab = {
  berkas: "SD5-Sintetis-Bab2",
  fixture: "sd5-sintetis-bab2",
  kode: "SINT5-B2",
  judulBab: "Data Sederhana",
  pelajaran: [
    {
      judul: "Mengumpulkan Data dengan Turus",
      ringkasan: "Cara mengumpulkan data, mencatatnya dengan turus, dan menuliskannya dalam tabel.",
      tujuan: "Kalian dapat mencatat data dengan turus dan membaca nilainya.",
      berpikir: "Memahami",
      isi: [
        "## Apa itu data",
        "Data adalah kumpulan keterangan, misalnya warna kesukaan teman sekelas atau banyak buku yang dibaca setiap minggu.",
        "",
        "Data dapat dikumpulkan dengan cara:",
        "- bertanya langsung kepada teman",
        "- mengamati dan mencatat",
        "- membaca catatan yang sudah ada",
        "",
        "## Mencatat dengan turus",
        "Saat menghitung sambil mengamati, kita memakai **turus**. Setiap data dicatat dengan satu garis tegak. Garis kelima dibuat miring, mencoret empat garis sebelumnya, sehingga satu ikat turus bernilai **5**.",
        "",
        "Cara membaca turus:",
        "- hitung ikatnya, lalu kalikan 5",
        "- tambahkan garis yang belum diikat",
        "",
        "_Periksa: 3 ikat dan 2 garis bernilai 3 × 5 + 2 = 17._",
        "",
        "## Dari turus ke tabel",
        "Hasil turus lalu ditulis sebagai bilangan dalam tabel.",
        "",
        "| Kendaraan | Banyaknya |",
        "|---|---|",
        "| Sepeda | 17 |",
        "| Motor | 12 |",
        "| Mobil | 6 |",
        "",
        "**Coba:** berapa kendaraan yang tercatat seluruhnya?",
        "_Periksa: 17 + 12 + 6 = 35 kendaraan._",
      ],
    },
    {
      // DAISY-30-TEKS-01 renders this lesson on every page: 3 pages, one table headed «Buku dipinjam» (a head and four
      // rows), exactly 9 bold phrases, a «_Periksa: …_» line and a «_Diadaptasi dari …_» line
      judul: "Membaca Tabel Data",
      ringkasan: "Baris, kolom, dan judul kolom; membaca satu nilai, membandingkan, dan menjumlahkan data tabel.",
      tujuan: "Kalian dapat membaca, membandingkan, dan menjumlahkan data yang disajikan dalam tabel.",
      berpikir: "Menerapkan",
      isi: [
        "## Bagian-bagian tabel",
        "Tabel menyusun data dalam **baris** dan **kolom**. Baris pertama berisi **judul kolom**, yang memberi tahu arti setiap angka di bawahnya.",
        "",
        "Perpustakaan kelas mencatat buku yang dipinjam selama empat hari:",
        "",
        "| Hari | Buku dipinjam |",
        "|---|---|",
        "| Senin | 12 |",
        "| Selasa | 9 |",
        "| Rabu | 15 |",
        "| Kamis | 8 |",
        "",
        "## Membaca nilai dan membandingkan",
        "Untuk membaca satu nilai, cari barisnya lebih dulu, lalu ikuti ke kolom yang diminta. Pada hari Rabu dipinjam **15 buku**.",
        "",
        "Untuk membandingkan, lihat semua angka dalam satu kolom:",
        "- paling banyak: Rabu, **15 buku**",
        "- paling sedikit: Kamis, **8 buku**",
        "- selisihnya: 15 − 8 = **7 buku**",
        "",
        "## Menjumlahkan data tabel",
        "Jumlah seluruh buku yang dipinjam adalah 12 + 9 + 15 + 8 = **44 buku**.",
        "",
        "**Coba:** berapa buku yang dipinjam pada hari Senin dan Selasa?",
        "_Periksa: 12 + 9 = 21 buku._",
        "",
        "_Diadaptasi dari contoh catatan perpustakaan kelas yang ditulis tim penulis untuk latihan._",
      ],
    },
    {
      judul: "Modus",
      ringkasan: "Nilai yang paling sering muncul dalam sekumpulan data, dan langkah mencarinya.",
      tujuan: "Kalian dapat menentukan modus sekumpulan data.",
      berpikir: "Menerapkan",
      isi: [
        "## Nilai yang paling sering muncul",
        "**Modus** adalah nilai yang paling sering muncul dalam sekumpulan data.",
        "",
        "Data ukuran baju: 30, 32, 32, 34, 32, 30.",
        "- 30 muncul 2 kali",
        "- 32 muncul 3 kali",
        "- 34 muncul 1 kali",
        "",
        "Modusnya 32, karena 32 paling sering muncul.",
        "",
        "## Hal yang perlu diingat",
        "Modus adalah nilai datanya, bukan banyak kemunculannya. Pada contoh di atas modusnya 32, bukan 3.",
        "",
        "Langkah mencari modus:",
        "- kelompokkan data yang sama",
        "- hitung kemunculan setiap nilai",
        "  - pakai turus jika datanya banyak",
        "- pilih nilai dengan kemunculan terbanyak",
        "",
        "_Periksa: data 5, 7, 7, 9 memiliki modus 7._",
      ],
    },
    {
      judul: "Rata-rata Sederhana",
      ringkasan: "Arti rata-rata, cara menghitungnya, dan cara memeriksa hasilnya.",
      tujuan: "Kalian dapat menghitung rata-rata sekumpulan data dan memeriksa apakah hasilnya masuk akal.",
      berpikir: "Menerapkan",
      isi: [
        "## Arti rata-rata",
        "Rata-rata adalah nilai yang mewakili sekumpulan data jika semuanya dibagi sama rata.",
        "",
        "Cara menghitung rata-rata:",
        "- jumlahkan semua data",
        "- bagi dengan banyak data",
        "",
        "## Contoh menghitung",
        "Berat tiga kantong beras: 2 kg, 3 kg, dan 4 kg.",
        "",
        "| Kantong | Berat |",
        "|---|---|",
        "| Pertama | 2 kg |",
        "| Kedua | 3 kg |",
        "| Ketiga | 4 kg |",
        "",
        "Jumlahnya 2 + 3 + 4 = 9 kg. Banyak datanya 3, jadi rata-ratanya 9 : 3 = **3 kg**.",
        "",
        "## Memeriksa hasil",
        "Rata-rata selalu berada di antara nilai terkecil dan nilai terbesar.",
        "- jika hasilnya lebih besar dari nilai terbesar, mungkin data belum dibagi",
        "- jika hasilnya terlalu kecil, periksa pembaginya",
        "  - pembagi harus sama dengan banyak data",
        "  - hitung ulang banyak data sebelum membagi",
        "",
        "**Coba:** hitung rata-rata dari 6, 8, dan 10.",
        "_Periksa: 6 + 8 + 10 = 24 dan 24 : 3 = 8._",
      ],
    },
  ],
  miskonsepsi: [
    { nama: "Turus dibaca keliru", penjelasan: "Murid menghitung satu ikat turus sebagai 4 atau sebagai 1, padahal bernilai 5.", bantuan: "Hitung setiap garis dalam satu ikat sambil menunjuknya, termasuk garis miringnya." },
    { nama: "Baris atau kolom tertukar", penjelasan: "Murid membaca angka dari baris atau kolom tabel yang tidak ditanyakan.", bantuan: "Tunjuk nama barisnya dulu, lalu geser jari ke kolom yang diminta." },
    { nama: "Nilai terbesar dianggap jawabannya", penjelasan: "Murid memilih nilai data terbesar sebagai modus atau rata-rata.", bantuan: "Bandingkan arti modus dan rata-rata dengan arti nilai terbesar memakai satu contoh kecil." },
    { nama: "Banyak kemunculan dianggap modus", penjelasan: "Murid menjawab berapa kali nilai itu muncul, bukan nilai datanya.", bantuan: "Buat tabel dua kolom, nilai dan banyak kemunculan, lalu lingkari kolom nilai." },
    { nama: "Semua data dijumlahkan saja", penjelasan: "Murid menjumlahkan semua data, padahal yang ditanyakan modus atau rata-rata.", bantuan: "Tuliskan langkah rata-rata: jumlahkan, lalu bagi; untuk modus, hitung kemunculan." },
    { nama: "Pembagi rata-rata tidak tepat", penjelasan: "Murid membagi jumlah data dengan bilangan yang bukan banyak datanya.", bantuan: "Hitung banyak data dengan menunjuk satu per satu sebelum membagi." },
    { nama: "Perbandingan terbalik", penjelasan: "Murid memilih yang paling sedikit saat ditanya yang paling banyak, atau menjumlahkan saat ditanya selisih.", bantuan: "Garis bawahi kata kunci soal: paling banyak, paling sedikit, selisih, atau jumlah." },
    { nama: "Data yang dijumlahkan tidak lengkap", penjelasan: "Murid menjumlahkan lebih sedikit atau lebih banyak data daripada yang diminta.", bantuan: "Centang setiap data yang diminta pada tabel sebelum menjumlahkan." },
    { nama: "Modus dipilih tanpa menghitung", penjelasan: "Murid memilih nilai yang pertama berulang atau yang letaknya di tengah, tanpa menghitung kemunculan setiap nilai.", bantuan: "Hitung kemunculan setiap nilai dengan turus sebelum memilih modus." },
  ],
  soal: [
    { pelajaran: 1, guna: "Pemetaan awal", sulit: "Mudah", kunci: "B",
      tanya: "Satu ikat turus terdiri atas empat garis tegak yang dicoret satu garis miring. Berapa nilai satu ikat turus?",
      benar: ["5", "Empat garis tegak dan satu garis miring, semuanya 5."],
      pengecoh: [
        ["4", "4 hanya menghitung garis tegak; garis miringnya juga satu data.", 1],
        ["1", "Satu ikat mewakili beberapa data; setiap garis bernilai satu.", 1],
        ["10", "Satu ikat bernilai 5; dua ikat baru bernilai 10.", 1],
      ] },
    { pelajaran: 1, guna: "Pemetaan awal", sulit: "Mudah", kunci: "D",
      tanya: "Data warna kesukaan: merah dipilih 7 anak, biru 5 anak, dan hijau 3 anak. Berapa anak yang ditanya seluruhnya?",
      benar: ["15 anak", "7 + 5 + 3 = 15 anak."],
      pengecoh: [
        ["12 anak", "12 hanya merah dan biru; hijau belum ikut dijumlahkan.", 8],
        ["7 anak", "7 anak hanya yang memilih merah; semua warna harus dijumlahkan.", 8],
        ["4 anak", "4 adalah selisih merah dan hijau; yang ditanyakan jumlah seluruhnya.", 7],
      ] },
    { pelajaran: 1, guna: "Cek penguasaan", sulit: "Sedang", kunci: "A",
      tanya: "Turus sepeda yang lewat: pagi 3 ikat dan 2 garis, siang 2 ikat dan 4 garis. Berapa sepeda yang lewat pada pagi dan siang?",
      benar: ["31 sepeda", "Pagi 3 × 5 + 2 = 17, siang 2 × 5 + 4 = 14, jumlahnya 31."],
      pengecoh: [
        ["26 sepeda", "26 didapat jika satu ikat dihitung 4; satu ikat bernilai 5.", 1],
        ["17 sepeda", "17 sepeda hanya yang lewat pagi hari.", 8],
        ["11 sepeda", "11 didapat jika satu ikat dihitung 1; satu ikat bernilai 5.", 1],
      ] },
    { pelajaran: 1, guna: "", sulit: "Mudah", kunci: "C",
      tanya: "Dua ikat turus dan 3 garis tegak menunjukkan bilangan berapa?",
      benar: ["13", "5 + 5 + 3 = 13."],
      pengecoh: [
        ["11", "11 didapat jika satu ikat dihitung 4.", 1],
        ["5", "5 didapat jika satu ikat dihitung 1.", 1],
        ["23", "Angka ikat dan garis tidak ditulis berdampingan; hitung 5 + 5 + 3.", 1],
      ] },
    { pelajaran: 1, guna: "", sulit: "Sedang", kunci: "A",
      tanya: "Kelas 5A mencatat hewan peliharaan: kucing 9 anak, ikan 6 anak, dan burung 4 anak. Berapa selisih pemelihara kucing dan pemelihara burung?",
      benar: ["5 anak", "9 − 4 = 5 anak."],
      pengecoh: [
        ["13 anak", "13 adalah 9 + 4; yang ditanyakan selisihnya.", 7],
        ["3 anak", "3 adalah 9 − 6; angka 6 milik baris ikan.", 2],
        ["4 anak", "4 anak adalah pemelihara burung saja; selisih dihitung 9 − 4.", 7],
      ] },
    { pelajaran: 2, guna: "Pemetaan awal", sulit: "Mudah", kunci: "C",
      tanya: "Perpustakaan mencatat buku yang dipinjam: Senin 14, Selasa 10, dan Rabu 17. Pada hari apa buku paling banyak dipinjam?",
      benar: ["Rabu", "17 lebih besar dari 14 dan 10."],
      pengecoh: [
        ["Senin", "Senin berada di baris pertama, tetapi angkanya 14.", 2],
        ["Selasa", "Selasa adalah hari dengan pinjaman paling sedikit.", 7],
        ["Tidak dapat diketahui", "Banyak buku setiap hari tercatat; bandingkan ketiga angkanya.", 2],
      ] },
    { pelajaran: 2, guna: "Cek penguasaan", sulit: "Sedang", kunci: "B",
      tanya: "Tabel pengunjung kebun binatang mini: Sabtu 120 orang, Minggu 150 orang. Berapa orang lebih banyak yang datang pada hari Minggu?",
      benar: ["30 orang", "150 − 120 = 30 orang."],
      pengecoh: [
        ["270 orang", "270 adalah 120 + 150; yang ditanyakan selisihnya.", 7],
        ["150 orang", "150 orang adalah pengunjung hari Minggu saja.", 2],
        ["120 orang", "120 orang adalah pengunjung hari Sabtu saja.", 2],
      ] },
    { pelajaran: 2, guna: "Cek penguasaan", sulit: "Sulit", kunci: "D",
      tanya: "Tabel tabungan: Ani Rp15.000, Beni Rp22.000, Cici Rp18.000, Dodi Rp25.000. Berapa jumlah tabungan Ani dan Cici?",
      benar: ["Rp33.000", "Rp15.000 + Rp18.000 = Rp33.000."],
      pengecoh: [
        ["Rp37.000", "Rp37.000 adalah tabungan Ani dan Beni; Beni ada di baris lain.", 2],
        ["Rp3.000", "Rp3.000 adalah selisih tabungan Cici dan Ani; yang ditanyakan jumlahnya.", 7],
        ["Rp80.000", "Rp80.000 adalah tabungan keempat anak; yang diminta hanya dua.", 8],
      ] },
    { pelajaran: 2, guna: "", sulit: "Mudah", kunci: "A",
      tanya: "Kolom pertama sebuah tabel berisi nama buah dan kolom kedua berisi banyaknya. Baris mangga berisi 12 dan baris jeruk berisi 20. Berapa banyak jeruk?",
      benar: ["20 buah", "Baris jeruk, kolom kedua: 20."],
      pengecoh: [
        ["12 buah", "12 ada di baris mangga.", 2],
        ["32 buah", "32 adalah 12 + 20; yang ditanyakan jeruk saja.", 8],
        ["8 buah", "8 adalah selisih jeruk dan mangga.", 7],
      ] },
    { pelajaran: 2, guna: "", sulit: "Sedang", kunci: "B",
      tanya: "Suhu udara pagi: Senin 24 °C, Selasa 26 °C, Rabu 23 °C, Kamis 25 °C. Pada hari apa suhunya paling rendah?",
      benar: ["Rabu", "23 °C adalah suhu yang paling rendah."],
      pengecoh: [
        ["Selasa", "Selasa adalah hari dengan suhu paling tinggi.", 7],
        ["Senin", "Senin berada di baris pertama, tetapi suhunya 24 °C.", 2],
        ["Kamis", "Kamis berada di baris terakhir, tetapi suhunya 25 °C.", 2],
      ] },
    { pelajaran: 3, guna: "Pemetaan awal", sulit: "Mudah", kunci: "D",
      tanya: "Data ukuran sepatu: 34, 35, 35, 36, 35, 37. Berapa modusnya?",
      benar: ["35", "35 muncul tiga kali, lebih sering dari ukuran lainnya."],
      pengecoh: [
        ["37", "37 adalah ukuran terbesar, tetapi hanya muncul sekali.", 3],
        ["3", "3 adalah banyak kemunculan ukuran 35, bukan ukurannya.", 4],
        ["36", "36 letaknya di tengah daftar; hitung dulu kemunculan setiap ukuran.", 9],
      ] },
    { pelajaran: 3, guna: "Cek penguasaan", sulit: "Sedang", kunci: "A",
      tanya: "Banyak telur yang dipanen setiap hari selama seminggu: 6, 8, 6, 7, 8, 8, 5. Berapa modus data itu?",
      benar: ["8", "8 muncul tiga kali, lebih sering dari nilai lainnya."],
      pengecoh: [
        ["3", "3 adalah banyak kemunculan nilai 8, bukan nilainya.", 4],
        ["6", "6 berulang lebih dulu, tetapi hanya dua kali; 8 muncul tiga kali.", 9],
        ["48", "48 adalah jumlah semua data; modus adalah nilai yang paling sering muncul.", 5],
      ] },
    { pelajaran: 3, guna: "Cek penguasaan", sulit: "Sulit", kunci: "C",
      tanya: "Nilai kuis delapan anak: 70, 85, 90, 85, 70, 85, 60, 95. Manakah pernyataan yang tepat?",
      benar: ["Modusnya 85 karena muncul tiga kali", "85 muncul tiga kali, 70 dua kali, dan nilai lain sekali."],
      pengecoh: [
        ["Modusnya 95 karena nilainya terbesar", "Nilai terbesar belum tentu paling sering muncul; 95 muncul sekali.", 3],
        ["Modusnya 3 karena 85 muncul tiga kali", "3 adalah banyak kemunculannya; modusnya nilai 85.", 4],
        ["Modusnya 70 karena muncul paling awal", "70 muncul dua kali, lebih jarang dari 85.", 9],
      ] },
    { pelajaran: 3, guna: "", sulit: "Sedang", kunci: "B",
      tanya: "Banyak saudara kandung sepuluh murid: 1, 2, 2, 0, 3, 2, 1, 1, 2, 4. Berapa modusnya?",
      benar: ["2", "2 muncul empat kali, lebih sering dari nilai lainnya."],
      pengecoh: [
        ["1", "1 muncul tiga kali, sedangkan 2 muncul empat kali.", 9],
        ["4", "4 adalah banyak kemunculan nilai 2, bukan nilainya.", 4],
        ["18", "18 adalah jumlah semua data, bukan nilai yang paling sering muncul.", 5],
      ] },
    { pelajaran: 4, guna: "Cek penguasaan", sulit: "Sedang", kunci: "C",
      tanya: "Berat empat semangka: 3 kg, 5 kg, 4 kg, dan 4 kg. Berapa rata-rata beratnya?",
      benar: ["4 kg", "3 + 5 + 4 + 4 = 16, dan 16 : 4 = 4 kg."],
      pengecoh: [
        ["16 kg", "16 kg adalah jumlah beratnya; jumlah itu masih harus dibagi 4.", 5],
        ["8 kg", "8 didapat dari 16 : 2; banyak semangkanya 4.", 6],
        ["5 kg", "5 kg adalah berat terbesar, bukan rata-ratanya.", 3],
      ] },
    { pelajaran: 4, guna: "Cek penguasaan", sulit: "Sedang", kunci: "D",
      tanya: "Uang saku Lina selama lima hari: Rp5.000, Rp7.000, Rp9.000, Rp4.000, dan Rp5.000. Berapa rata-rata uang sakunya per hari?",
      benar: ["Rp6.000", "Jumlahnya Rp30.000, dan Rp30.000 : 5 = Rp6.000."],
      pengecoh: [
        ["Rp30.000", "Rp30.000 adalah jumlah lima hari; jumlah itu masih harus dibagi 5.", 5],
        ["Rp7.500", "Rp7.500 didapat dari pembagian dengan 4; datanya ada 5.", 6],
        ["Rp9.000", "Rp9.000 adalah uang saku terbesar, bukan rata-ratanya.", 3],
      ] },
    { pelajaran: 4, guna: "Cek penguasaan", sulit: "Sulit", kunci: "A",
      tanya: "Rata-rata tiga nilai ulangan Tono adalah 80. Nilai ulangan pertama 75 dan kedua 85. Berapa nilai ulangan ketiga?",
      benar: ["80", "Jumlah ketiga nilai 3 × 80 = 240, jadi nilai ketiga 240 − 75 − 85 = 80."],
      pengecoh: [
        ["160", "160 adalah 75 + 85, jumlah dua nilai pertama.", 8],
        ["240", "240 adalah jumlah ketiga nilai; nilai ketiga didapat dari 240 − 160.", 5],
        ["75", "75 adalah nilai ulangan pertama; nilai ketiga dihitung dari jumlah seluruhnya.", 2],
      ] },
    { pelajaran: 4, guna: "", sulit: "Sedang", kunci: "D",
      tanya: "Tinggi lima tanaman cabai: 20 cm, 24 cm, 22 cm, 18 cm, dan 26 cm. Berapa rata-rata tingginya?",
      benar: ["22 cm", "Jumlahnya 110 cm, dan 110 : 5 = 22 cm."],
      pengecoh: [
        ["110 cm", "110 cm adalah jumlah tingginya; jumlah itu masih harus dibagi 5.", 5],
        ["27,5 cm", "27,5 didapat dari 110 : 4; tanamannya ada 5.", 6],
        ["26 cm", "26 cm adalah tanaman tertinggi, bukan rata-ratanya.", 3],
      ] },
  ],
};

// ═══════════════════════════════════════════════════════════════════ the workbook, the package, the copies

const HURUF: Huruf[] = ["A", "B", "C", "D"];
const kepala = (nama: NamaLembar) => KOLOM[nama].map((k) => k.judul);

function lembarBab(b: Bab): { nama: string; baris: string[][]; bekukanJudul: boolean }[] {
  const kodeMis = (n: number) => `${b.kode}-${String(n).padStart(2, "0")}`;
  const soalBaris: string[][] = [], pilihanBaris: string[][] = [];
  b.soal.forEach((s, i) => {
    const ref = `S${i + 1}`;
    // Kode soal, No bab, No pelajaran, Jenis soal, Pertanyaan, Bacaan, Petunjuk, Kegunaan, Tingkat kesulitan, Kelompok paralel
    soalBaris.push([ref, "1", String(s.pelajaran), "Pilihan ganda", s.tanya, "", "", s.guna, s.sulit, ""]);
    const sisa = [...s.pengecoh];
    for (const h of HURUF) {
      // Kode soal, Pilihan, Teks pilihan, Benar, Alasan, Kode miskonsepsi
      if (h === s.kunci) pilihanBaris.push([ref, h, s.benar[0], "Ya", s.benar[1], ""]);
      else { const [teks, alasan, m] = sisa.shift()!; pilihanBaris.push([ref, h, teks, "Tidak", alasan, kodeMis(m)]); }
    }
  });
  return [
    { nama: "Catatan", bekukanJudul: false, baris: [
      ["Catatan"],
      ["Buku kerja sintetis untuk pengembangan dan pengujian PINTAR (F-4, D-145). Semua pelajaran, soal, pilihan, alasan dan miskonsepsinya ditulis baru; tidak ada yang diambil dari bahan ajar sekolah. Dibuat oleh docs/onboarding/konten-sintetis/buat-korpus.mts; lembar ini diabaikan saat diunggah."],
    ] },
    { nama: "Kursus", bekukanJudul: true, baris: [kepala("Kursus"), [`Matematika Kelas 5 · Bab ${b.berkas.slice(-1)}: ${b.judulBab}`, "Matematika", "SD", "Kelas 5", "Akademik"]] },
    { nama: "Bab", bekukanJudul: true, baris: [kepala("Bab"), ["1", b.judulBab]] },
    { nama: "Pelajaran", bekukanJudul: true, baris: [kepala("Pelajaran"),
      ...b.pelajaran.map((p, i) => ["1", String(i + 1), p.judul, p.ringkasan, p.isi.join("\n"), p.tujuan, p.berpikir, "", ""])] },
    { nama: "Soal", bekukanJudul: true, baris: [kepala("Soal"), ...soalBaris] },
    { nama: "Pilihan", bekukanJudul: true, baris: [kepala("Pilihan"), ...pilihanBaris] },
    { nama: "Miskonsepsi", bekukanJudul: true, baris: [kepala("Miskonsepsi"),
      ...b.miskonsepsi.map((m, i) => [kodeMis(i + 1), m.nama, m.penjelasan, m.bantuan])] },
  ];
}

const akar = join(import.meta.dirname, "..", "..", "..");
for (const b of [BAB1, BAB2]) {
  const xlsx = tulisBukuKerja(lembarBab(b));
  const baca = bacaBukuKerja(xlsx);
  if (!baca.ok) throw new Error(`${b.berkas}: the written workbook does not read back: ${baca.code}`);
  const hasil = bukuKerjaKePaket(baca.lembar);
  if (!hasil.ok) throw new Error(`${b.berkas}: ${JSON.stringify(hasil.problems)}`);
  const json = JSON.stringify(hasil.paket, null, 1) + "\n";
  writeFileSync(join(akar, "docs", "onboarding", "konten-sintetis", `${b.berkas}.xlsx`), xlsx);
  writeFileSync(join(akar, "docs", "onboarding", "konten-sintetis", `${b.berkas}.paket.json`), json);
  writeFileSync(join(akar, "audit", "fixtures", `${b.fixture}.paket.json`), json);
  if (readFileSync(join(akar, "audit", "fixtures", `${b.fixture}.paket.json`), "utf8") !== json) throw new Error("copy differs");
  const guna = (g: string) => b.soal.filter((s) => s.guna === g).length;
  console.log(`${b.berkas}: ${b.pelajaran.length} lessons, ${b.soal.length} questions (pre ${guna("Pemetaan awal")}, post ${guna("Cek penguasaan")}, practice ${guna("")}), ${b.miskonsepsi.length} misconceptions`);
}
