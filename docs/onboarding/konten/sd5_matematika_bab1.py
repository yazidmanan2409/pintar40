# SD Kelas 5, Matematika, Bab 1 "Bilangan Cacah sampai 100.000", as a PINTAR lesson
# workbook in the D-007 template (sheets Kursus, Bab, Pelajaran, Soal, Pilihan; the column
# contract is KOLOM in src/lib/unggah-kontrak.ts).
#
# Adapted from Buku Panduan Guru Matematika untuk SD/MI Kelas V, Bab 1
# (Kemendikbudristek, 2022) and the school's own study guide. Every number in a question,
# answer or distractor is checked by the assertions below before the workbook is written.
#
# Run: python3 docs/onboarding/konten/sd5_matematika_bab1.py
import os
from openpyxl import Workbook
from openpyxl.styles import Alignment, Font

# ── Arithmetic behind the questions (fails loudly if any is wrong) ─────────────
assert 76_598 + 12_456 == 89_054
assert 67_987 - 13_453 == 54_534
assert 147 * 456 == 67_032
assert 567 * 107 == 60_669          # the guide's key says 55.566, which is 567 x 98
assert 567 * 98 == 55_566
assert 5_468 + 2_375 == 7_843
assert 5_468 - 2_375 == 3_093
assert 76_598 - 12_456 == 64_142
assert 67_987 + 13_453 == 81_440
assert 3 * 10_000 + 7 * 1_000 + 10 * 100 == 38_000
assert 3 * 10_000 + 4 * 1_000 == 34_000
assert 2 * 27_500 == 55_000 and 53_000 < 55_000
assert (2 * 35_000 - 53_000) // 2 == 8_500 and 35_000 - 53_000 // 2 == 8_500
assert 45_000 + 4_000 == 49_000 and 100_000 // 2 == 50_000 and 100_000 - 53_000 == 47_000
assert 45_500 - 42_000 == 3_500
assert 2 * 20_000 + 10_000 + 5_000 + 1_000 + 500 + 4 * 100 == 56_900
assert 2 * 20_000 + 10_000 + 5_000 + 1_000 + 500 + 2 * 100 == 56_700
assert 2 * 20_000 + 10_000 + 5_000 + 500 + 4 * 100 == 55_900

# Post-test PB1-PB5 use fresh numbers (24 Sep): the chapter's own exercises, with their
# answers, are in the NotebookLM summary students now receive in lesson 5.
assert 42_458 + 35_687 == 78_145 and 42_458 - 35_687 == 6_771


def tanpa_simpan(a, b):
    """a + b with every carry forgotten, digit by digit."""
    hasil, tempat = 0, 1
    while a or b:
        hasil += (a % 10 + b % 10) % 10 * tempat
        a, b, tempat = a // 10, b // 10, tempat * 10
    return hasil


assert tanpa_simpan(42_458, 35_687) == 77_035
assert 78_145 - 1_000 == 77_145     # only the carry from ratusan to ribuan forgotten (4 + 6 + 1 = 11)
assert str(57_689)[1] == "7" and 36_954 < 63_495 and 7 * 10_000 + 2 * 100 + 8 == 70_208


def cara_bayar_pas(total, dompet):
    """Every exact way to pay `total` from the wallet {denomination: count}."""
    nilai = sorted(dompet, reverse=True)
    hasil = []

    def cari(i, sisa, pilih):
        if sisa == 0:
            hasil.append(dict(pilih))
            return
        if i == len(nilai):
            return
        d = nilai[i]
        for n in range(min(dompet[d], sisa // d), -1, -1):
            pilih[d] = n
            cari(i + 1, sisa - n * d, pilih)
        pilih.pop(d, None)

    cari(0, total, {})
    return [{d: n for d, n in c.items() if n} for c in hasil]


CARA_SAGA = cara_bayar_pas(59_000, {20_000: 2, 10_000: 3, 5_000: 2, 2_000: 5})
assert len(CARA_SAGA) == 2, CARA_SAGA

SUMBER = "_Diadaptasi dari Buku Panduan Guru Matematika untuk SD/MI Kelas V, Bab 1 (Kemendikbudristek, 2022)._"

KURSUS = {
    "Judul kursus*": "Matematika Kelas 5 · Bab 1: Bilangan Cacah sampai 100.000",
    "Mata pelajaran*": "Matematika",
    "Jenjang*": "SD",
    "Kelas*": "Kelas 5",
    "Konteks": "Akademik",
}

BAB = [(1, "Bilangan Cacah sampai 100.000")]

PELAJARAN = [
    dict(no=1, judul="Membaca, Menulis, dan Nilai Tempat",
         ringkasan="Bilangan sampai 100.000 dibaca per kelompok ribuan, dan setiap angka punya nilai tempatnya sendiri.",
         tujuan="Murid dapat membaca, menulis, dan menentukan nilai tempat bilangan cacah sampai 100.000.",
         bloom="Memahami",
         isi=f"""## Bilangan di sekitar kita

Harga di toko, jumlah penduduk, dan jarak antarkota sering ditulis dengan lima angka.
Harga sebotol jus mangga **Rp6.375**. Jumlah penduduk Kecamatan Kayu Tanam **26.932** jiwa.

## Nilai tempat

Setiap angka menempati satu tempat. Untuk bilangan lima angka, dari kiri ke kanan:
**puluh ribuan, ribuan, ratusan, puluhan, satuan**.

Pada bilangan **26.932**:

- 2 di tempat puluh ribuan, nilainya 20.000
- 6 di tempat ribuan, nilainya 6.000
- 9 di tempat ratusan, nilainya 900
- 3 di tempat puluhan, nilainya 30
- 2 di tempat satuan, nilainya 2

Jadi 26.932 = 20.000 + 6.000 + 900 + 30 + 2.

## Cara membaca

Titik memisahkan kelompok ribuan. Baca dulu bagian di depan titik, tambahkan kata **ribu**, lalu baca sisanya.

- 26.932 dibaca **dua puluh enam ribu** sembilan ratus tiga puluh dua
- 15.229 dibaca lima belas ribu dua ratus dua puluh sembilan
- 72.135 dibaca tujuh puluh dua ribu seratus tiga puluh lima

Jangan membaca angkanya satu per satu, seperti "dua enam sembilan tiga dua".

## Cara menulis

"Lima puluh ribu tiga ratus tiga" ditulis **50.303**.
Tidak ada ribuan selain lima puluh, dan tidak ada puluhan, jadi tempat itu diisi **0**.
Angka 0 tetap ditulis supaya setiap angka lain berada di tempatnya.

## Ayo mencoba

Cari struk belanja di rumahmu. Bacalah harga-harganya dengan suara keras, lalu sebutkan nilai tempat setiap angkanya.

{SUMBER}"""),
    dict(no=2, judul="Membandingkan dan Mengurutkan",
         ringkasan="Bandingkan dua bilangan mulai dari angka paling kiri, lalu urutkan dari yang terkecil atau terbesar.",
         tujuan="Murid dapat membandingkan dan mengurutkan bilangan cacah sampai 100.000.",
         bloom="Menerapkan",
         isi=f"""## Tiga tanda

- **>** artinya lebih besar dari
- **<** artinya lebih kecil dari
- **=** artinya sama dengan

## Mulai dari kiri

Bandingkan angka pada nilai tempat **tertinggi** lebih dulu, yaitu angka paling kiri.

- 76.675 **>** 67.765, karena di tempat puluh ribuan 7 lebih besar dari 6.
- 45.867 **<** 55.876, karena di tempat puluh ribuan 4 lebih kecil dari 5.

Bila angka paling kiri sama, pindah ke tempat berikutnya:

- 86.567 **<** 86.576. Puluh ribuan sama (8), ribuan sama (6), ratusan sama (5), lalu di puluhan 6 lebih kecil dari 7.

Hati-hati: jangan memulai dari angka paling belakang. Angka satuan yang besar tidak membuat bilangannya lebih besar.

## Mana yang lebih murah?

Robot seharga Rp45.500 dan boneka seharga Rp42.000. Di tempat puluh ribuan keduanya 4. Di tempat ribuan, 2 lebih kecil dari 5. Jadi **boneka lebih murah**, selisihnya Rp3.500.

## Pola bilangan

- 15.500, 16.500, 17.500, 18.500, ... (bertambah 1.000)
- 85.350, 85.400, 85.450, 85.500, ... (bertambah 50)

{SUMBER}"""),
    dict(no=3, judul="Komposisi dan Dekomposisi",
         ringkasan="Menyusun bilangan dari bagian-bagiannya dan menguraikannya kembali, misalnya dengan uang.",
         tujuan="Murid dapat menyusun (komposisi) dan menguraikan (dekomposisi) bilangan cacah sampai 100.000, termasuk dengan uang.",
         bloom="Menerapkan",
         isi=f"""## Komposisi: menyusun

Komposisi adalah menyusun beberapa bagian menjadi satu bilangan.

- 3 lembar sepuluh ribuan dan 4 lembar seribuan: 30.000 + 4.000 = **34.000**
- 3 lembar sepuluh ribuan, 7 lembar seribuan, dan 10 keping seratusan: 30.000 + 7.000 + 1.000 = **38.000**

Ingat: 10 keping seratusan sama dengan 1.000.

## Dekomposisi: menguraikan

Dekomposisi adalah menguraikan satu bilangan menjadi bagian-bagiannya. Satu bilangan bisa diuraikan dengan lebih dari satu cara.

Rp59.000 dapat dibayar dengan:

- 20.000 + 20.000 + 10.000 + 5.000 + 2.000 + 2.000
- 20.000 + 10.000 + 10.000 + 10.000 + 5.000 + 2.000 + 2.000

## Uang pas

Saat membayar dengan uang pas, pilih lembaran terbesar dulu, lalu lengkapi sisanya dengan lembaran yang lebih kecil. Periksa lagi dengan menjumlahkan semuanya.

{SUMBER}"""),
    dict(no=4, judul="Operasi Hitung dan Soal Cerita",
         ringkasan="Menjumlah, mengurang, mengali, dan membagi bilangan sampai 100.000, lalu memakainya untuk masalah sehari-hari.",
         tujuan="Murid dapat menghitung operasi bilangan cacah sampai 100.000 dan memecahkan masalah sehari-hari.",
         bloom="Menerapkan",
         isi=f"""## Penjumlahan bersusun

Susun angka sesuai nilai tempatnya, lalu jumlahkan dari kanan.

76.598 + 12.456:

- satuan: 8 + 6 = 14, tulis 4, simpan 1
- puluhan: 9 + 5 + 1 = 15, tulis 5, simpan 1
- ratusan: 5 + 4 + 1 = 10, tulis 0, simpan 1
- ribuan: 6 + 2 + 1 = 9
- puluh ribuan: 7 + 1 = 8

Hasilnya **89.054**.

## Pengurangan bersusun

67.987 − 13.453 = **54.534**. Kurangkan dari kanan, tempat demi tempat.

## Perkalian

567 × 107 = 567 × 100 + 567 × 7 = 56.700 + 3.969 = **60.669**

## Pembagian

67.032 : 147 = **456**. Periksa dengan perkalian: 147 × 456 = 67.032.

## Soal cerita

1. Baca soalnya dua kali.
2. Tentukan operasinya: menambah, mengurangi, mengali, atau membagi.
3. Hitung dengan teliti.
4. Periksa apakah jawabanmu masuk akal.

Contoh: Nisa memiliki Rp100.000 dan berbelanja Rp53.000. Sisanya 100.000 − 53.000 = **Rp47.000**.

{SUMBER}"""),
    dict(no=5, judul="Rangkuman Bab 1: Video, Infografik, dan Ringkasan",
         ringkasan="Mengulang seluruh Bab 1 lewat video podcast dengan contoh sehari-hari, infografik, dan ringkasan tertulis.",
         tujuan="Murid dapat menghubungkan membaca, nilai tempat, membandingkan, komposisi, dan operasi hitung bilangan sampai 100.000 dengan kehidupan sehari-hari.",
         bloom="Memahami",
         media="sd5_matematika_1_video.mp4; sd5_matematika_1_doc.jpg; sd5_matematika_1_text.pdf",
         transkrip_berkas="sd5_matematika_1_video.txt",
         isi=f"""## Mengulang Bab 1

Kamu sudah belajar membaca, menulis, membandingkan, menyusun, dan menghitung bilangan sampai 100.000. Sekarang ulangi semuanya dengan cara yang berbeda.

1. **Tonton video podcast.** Dua orang membahas Bab 1 dengan contoh sehari-hari: harga di toko, uang kembalian, dan data penduduk. Transkripnya ada di bawah video.
2. **Lihat infografik** "Petualangan Angka". Coba baca setiap bilangan di dalamnya dengan suara keras.
3. **Baca ringkasan (PDF).** Kerjakan kuis latihannya lebih dulu, baru periksa kunci jawabannya.

Setelah itu, kerjakan **Cek penguasaan** untuk melihat seberapa jauh kamu sudah menguasai Bab 1.

_Media rangkuman disiapkan oleh sekolah dengan NotebookLM._"""),
    dict(no=6, judul="Diskusi Bab 1 (Audio)",
         ringkasan="Mendengarkan diskusi tentang Bab 1 dan mengikuti transkripnya.",
         tujuan="Murid dapat mengikuti penjelasan lisan tentang bilangan cacah sampai 100.000 dan mengenali konsep Bab 1 di dalamnya.",
         bloom="Memahami",
         media="sd5_matematika_1_audio.m4a",
         transkrip_berkas="sd5_matematika_1_audio.txt",
         isi=f"""## Dengarkan diskusinya

Dengarkan diskusi tentang Bab 1. Kamu boleh berhenti kapan saja dan mengulang bagian yang belum jelas. Transkripnya ada di bawah audio, untuk dibaca sambil mendengarkan atau bila kamu tidak dapat memutar suara.

Saat mendengarkan, catat:

- satu bilangan besar yang disebut, lalu tulis dengan angka;
- satu contoh membandingkan dua bilangan;
- satu soal cerita, lalu hitung jawabannya sendiri.

_Media diskusi disiapkan oleh sekolah dengan NotebookLM._"""),
]

# Transcripts: machine drafts from content-draft-transcripts.yml, kept beside this file
# until a teacher checks them. A lesson with audio or video is refused without one.
TRANSKRIP_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "transkrip")
for _p in PELAJARAN:
    _p.setdefault("media", "")
    _p["transkrip"] = ""
    if _p.get("transkrip_berkas"):
        _f = os.path.join(TRANSKRIP_DIR, _p["transkrip_berkas"])
        assert os.path.exists(_f), f"lesson {_p['no']} has audio or video but no transcript at {_f}"
        _p["transkrip"] = open(_f, encoding="utf-8").read().strip()
        assert len(_p["transkrip"]) > 200, f"transcript for lesson {_p['no']} is suspiciously short"

# ── Questions. Each: ref, lesson, stem, options [(text, correct, reason)], use, level, group, hint.
S = []


def soal(ref, pel, tanya, pilihan, guna="", sulit="Mudah", kelompok="", petunjuk=""):
    assert 2 <= len(pilihan) <= 5
    assert sum(1 for _, b, _ in pilihan if b) == 1, ref
    S.append(dict(ref=ref, pel=pel, tanya=tanya, pilihan=pilihan, guna=guna, sulit=sulit, kelompok=kelompok, petunjuk=petunjuk))


# Pemetaan awal (pre-test, D-008): where the class starts. PA1-PA4 test the same skills as
# PB1-PB4 (reading, place value, comparing, adding), with different numbers. They are NOT put in
# a Kelompok paralel together: a parallel group means equivalent questions, and INV-24 keeps a
# learner's post-test clear of every sibling of their pre-test questions, so pairing them left
# only 4 of the 8 post-test questions drawable (Bob, 24 Sep; assign_release refuses it).
soal("PA1", 1, "Bagaimana cara membaca 6.375?", [
    ("Enam ribu tiga ratus tujuh puluh lima", True, "Benar. Bagian di depan titik (6) dibaca enam ribu, lalu 375 dibaca tiga ratus tujuh puluh lima."),
    ("Enam tiga tujuh lima", False, "Angkanya dibaca satu per satu. Setiap angka harus dibaca sesuai nilai tempatnya."),
    ("Enam puluh tiga ribu tujuh ratus lima", False, "Itu cara membaca 63.705. Titik ada setelah angka 6, jadi hanya 6 yang menjadi ribuan."),
    ("Enam ratus tiga puluh tujuh ribu lima", False, "Itu terlalu besar. Bilangan ini hanya punya empat angka, jadi paling besar ribuan."),
], guna="Pemetaan awal")
soal("PA2", 1, "Pada bilangan 8.456, angka 4 menempati nilai tempat ...", [
    ("satuan", False, "Satuan adalah angka paling kanan, yaitu 6."),
    ("puluhan", False, "Puluhan adalah angka kedua dari kanan, yaitu 5."),
    ("ratusan", True, "Benar. Dari kanan: 6 satuan, 5 puluhan, 4 ratusan, 8 ribuan."),
    ("ribuan", False, "Ribuan adalah angka di depan titik, yaitu 8."),
], guna="Pemetaan awal")
soal("PA3", 2, "Tanda yang tepat untuk 4.587 ... 4.857 adalah ...", [
    (">", False, "Ribuannya sama (4). Di ratusan, 5 lebih kecil dari 8, jadi 4.587 lebih kecil."),
    ("<", True, "Benar. Ribuannya sama, lalu di ratusan 5 lebih kecil dari 8."),
    ("=", False, "Kedua bilangan memakai angka yang sama, tetapi letaknya berbeda, jadi nilainya berbeda."),
    ("Tidak dapat dibandingkan", False, "Dua bilangan cacah selalu dapat dibandingkan, mulai dari angka paling kiri."),
], guna="Pemetaan awal")
soal("PA4", 4, "5.468 + 2.375 = ...", [
    ("7.843", True, "Benar. 8 + 5 = 13, tulis 3 simpan 1; 6 + 7 + 1 = 14, tulis 4 simpan 1; 4 + 3 + 1 = 8; 5 + 2 = 7."),
    ("7.733", False, "Angka yang disimpan terlupa. 8 + 5 = 13 dan 6 + 7 = 13 masing-masing menyimpan 1 ke tempat berikutnya."),
    ("7.743", False, "Simpanan dari satuan sudah dipakai, tetapi simpanan dari puluhan ke ratusan terlupa."),
    ("3.093", False, "Ini hasil pengurangan 5.468 − 2.375. Soalnya meminta penjumlahan."),
], guna="Pemetaan awal")

# Cek penguasaan (post-test, D-008), from the chapter's Uji Kompetensi. PB1-PB5 carry fresh
# numbers: the chapter's own versions (72.135, 87.986, 45.867/55.876, 76.598 + 12.456, 50.303)
# appear with their answers in the NotebookLM summary given in lesson 5.
soal("PB1", 1, "Bagaimana cara membaca 84.216?", [
    ("Delapan puluh empat ribu dua ratus enam belas", True, "Benar. 84 di depan titik dibaca delapan puluh empat ribu, lalu 216 dibaca dua ratus enam belas."),
    ("Delapan empat ribu dua ratus enam belas", False, "84 adalah delapan puluh empat, bukan delapan empat."),
    ("Delapan ratus empat puluh dua ribu enam belas", False, "Itu cara membaca 842.016. Titik ada setelah 84."),
    ("Delapan puluh empat dua ratus enam belas", False, "Kata ribu terlupa. 84 di depan titik adalah delapan puluh empat ribu."),
], guna="Cek penguasaan")
soal("PB2", 1, "Angka 7 pada bilangan 57.689 menempati nilai tempat ...", [
    ("puluh ribuan", False, "Puluh ribuan adalah angka paling kiri, yaitu 5."),
    ("ribuan", True, "Benar. 5 puluh ribuan, 7 ribuan, 6 ratusan, 8 puluhan, 9 satuan."),
    ("ratusan", False, "Ratusan adalah angka pertama setelah titik, yaitu 6."),
    ("puluhan", False, "Puluhan adalah angka kedua dari kanan, yaitu 8."),
], guna="Cek penguasaan")
soal("PB3", 2, "Tanda yang tepat untuk 36.954 ... 63.495 adalah ...", [
    (">", False, "Di tempat puluh ribuan, 3 lebih kecil dari 6, jadi 36.954 lebih kecil."),
    ("<", True, "Benar. Mulai dari kiri: di puluh ribuan 3 lebih kecil dari 6."),
    ("=", False, "Angka paling kirinya sudah berbeda (3 dan 6), jadi keduanya tidak sama."),
    ("Tidak dapat dibandingkan", False, "Dua bilangan cacah selalu dapat dibandingkan, mulai dari angka paling kiri."),
], guna="Cek penguasaan", sulit="Sedang")
soal("PB4", 4, "42.458 + 35.687 = ...", [
    ("78.145", True, "Benar. Tiga kali menyimpan: dari satuan, puluhan, dan ratusan."),
    ("77.035", False, "Tidak ada angka yang disimpan. 8 + 7 = 15 menyimpan 1 ke puluhan, dan seterusnya."),
    ("77.145", False, "Simpanan dari ratusan ke ribuan terlupa: 4 + 6 + 1 = 11, jadi 1 disimpan ke ribuan."),
    ("6.771", False, "Ini hasil pengurangan 42.458 − 35.687. Soalnya meminta penjumlahan."),
], guna="Cek penguasaan", sulit="Sedang")
soal("PB5", 1, "\"Tujuh puluh ribu dua ratus delapan\" ditulis ...", [
    ("70.208", True, "Benar. Tujuh puluh ribu (70.000), dua ratus (200), delapan (8); tempat ribuan dan puluhan diisi 0."),
    ("7.208", False, "Itu tujuh ribu dua ratus delapan. Tujuh puluh ribu ditulis 70 di depan titik."),
    ("70.280", False, "Itu tujuh puluh ribu dua ratus delapan puluh. Delapan di sini adalah satuan, bukan puluhan."),
    ("72.008", False, "Itu tujuh puluh dua ribu delapan. Dua ratus ada di tempat ratusan, setelah titik."),
], guna="Cek penguasaan")
soal("PB6", 3, "3 lembar sepuluh ribuan, 7 lembar seribuan, dan 10 keping seratusan jumlahnya ...", [
    ("Rp38.000", True, "Benar. 30.000 + 7.000 + 1.000 (10 keping seratusan) = 38.000."),
    ("Rp37.100", False, "10 keping seratusan bernilai 10 × 100 = 1.000, bukan 100."),
    ("Rp37.010", False, "10 keping seratusan bernilai 1.000, bukan 10."),
    ("Rp3.710", False, "Tiga lembar sepuluh ribuan bernilai 30.000, bukan 3.000."),
], guna="Cek penguasaan", sulit="Sedang")
soal("PB7", 4, "67.032 : 147 = ...", [
    ("456", True, "Benar. Periksa: 147 × 456 = 67.032."),
    ("546", False, "Angkanya tertukar. 147 × 546 = 80.262, bukan 67.032."),
    ("4.560", False, "Terlalu besar: 147 × 4.560 lebih dari 600.000."),
    ("465", False, "147 × 465 = 68.355, bukan 67.032. Periksa hasil bagi dengan perkalian."),
], guna="Cek penguasaan", sulit="Sulit")
soal("PB8", 4, "Zafran dan Ula masing-masing memiliki Rp35.000. Mereka membeli satu Paket B seharga Rp53.000 dan membayarnya sama rata. Berapa sisa uang masing-masing?", [
    ("Rp8.500", True, "Benar. Masing-masing membayar 53.000 : 2 = 26.500, jadi sisanya 35.000 − 26.500 = 8.500."),
    ("Rp17.000", False, "Itu sisa uang mereka berdua (70.000 − 53.000). Soal menanyakan sisa masing-masing."),
    ("Rp26.500", False, "Itu yang dibayar masing-masing, bukan sisanya."),
    ("Rp18.000", False, "Coba hitung lagi: masing-masing membayar 26.500 dari uang 35.000."),
], guna="Cek penguasaan", sulit="Sulit")

# Latihan (practice), from the chapter's Ayo Berlatih and study guide.
soal("LT1", 1, "Harga sebuah tas Rp15.590. Cara membacanya ...", [
    ("Lima belas ribu lima ratus sembilan puluh rupiah", True, "Benar. 15 di depan titik dibaca lima belas ribu, lalu 590 dibaca lima ratus sembilan puluh."),
    ("Seratus lima puluh lima ribu sembilan puluh rupiah", False, "Itu 155.090. Titik ada setelah 15."),
    ("Lima belas ribu lima sembilan puluh rupiah", False, "5 di tempat ratusan dibaca lima ratus."),
    ("Lima belas ribu lima ratus sembilan rupiah", False, "90 dibaca sembilan puluh, bukan sembilan."),
])
soal("LT2", 1, "Pada bilangan 56.786, angka 7 bernilai ...", [
    ("7", False, "7 berada di tempat ratusan, jadi nilainya lebih dari 7."),
    ("70", False, "70 adalah nilai bila 7 berada di tempat puluhan."),
    ("700", True, "Benar. 7 berada di tempat ratusan, jadi nilainya 700."),
    ("7.000", False, "7.000 adalah nilai bila 7 berada di tempat ribuan."),
], petunjuk="Tentukan dulu tempat angka 7, lalu tuliskan nilainya.")
soal("LT3", 1, "Bilangan yang terdiri atas 2 puluh ribuan, 6 ribuan, 9 ratusan, 3 puluhan, dan 2 satuan adalah ...", [
    ("26.932", True, "Benar. 20.000 + 6.000 + 900 + 30 + 2 = 26.932."),
    ("29.632", False, "Ribuan dan ratusan tertukar. Ribuannya 6, ratusannya 9."),
    ("62.932", False, "Puluh ribuan dan ribuan tertukar. Puluh ribuannya 2."),
    ("2.693", False, "Satu tempat hilang. Bilangan ini punya lima angka."),
])
soal("LT4", 2, "Manakah urutan dari yang terkecil ke yang terbesar?", [
    ("43.217; 78.897; 89.876", True, "Benar. Di puluh ribuan: 4 < 7 < 8."),
    ("89.876; 78.897; 43.217", False, "Ini urutan dari yang terbesar ke yang terkecil."),
    ("78.897; 43.217; 89.876", False, "43.217 lebih kecil dari 78.897, jadi harus di depan."),
    ("43.217; 89.876; 78.897", False, "89.876 lebih besar dari 78.897, jadi harus di belakang."),
])
soal("LT5", 2, "Tanda yang tepat untuk 86.567 ... 86.576 adalah ...", [
    (">", False, "Angka satuan 7 memang lebih besar, tetapi kita mulai dari kiri. Di puluhan, 6 lebih kecil dari 7."),
    ("<", True, "Benar. Puluh ribuan, ribuan, dan ratusannya sama; di puluhan 6 lebih kecil dari 7."),
    ("=", False, "Angka puluhan dan satuannya berbeda, jadi nilainya berbeda."),
    ("Tidak dapat dibandingkan", False, "Dua bilangan cacah selalu dapat dibandingkan."),
], sulit="Sedang", petunjuk="Mulailah dari angka paling kiri, lalu geser ke kanan sampai menemukan angka yang berbeda.")
soal("LT6", 2, "Lanjutkan polanya: 15.500, 16.500, 17.500, ...", [
    ("18.500", True, "Benar. Setiap langkah bertambah 1.000."),
    ("17.600", False, "Polanya bertambah 1.000, bukan 100."),
    ("18.000", False, "Tambahkan 1.000 ke 17.500, hasilnya 18.500."),
    ("19.500", False, "Itu dua langkah sesudahnya. Bilangan berikutnya 18.500."),
])
soal("LT7", 2, "Robot seharga Rp45.500 dan boneka seharga Rp42.000. Mana yang lebih murah, dan berapa selisihnya?", [
    ("Boneka, selisihnya Rp3.500", True, "Benar. 42.000 < 45.500, dan 45.500 − 42.000 = 3.500."),
    ("Robot, selisihnya Rp3.500", False, "Selisihnya benar, tetapi robot lebih mahal: di ribuan 5 lebih besar dari 2."),
    ("Boneka, selisihnya Rp4.500", False, "Boneka memang lebih murah, tetapi 45.500 − 42.000 = 3.500."),
    ("Boneka, selisihnya Rp13.500", False, "Periksa pengurangannya lagi: 45.500 − 42.000 = 3.500."),
], sulit="Sedang")
soal("LT8", 3, "Uang Rp34.000 dapat disusun dari ...", [
    ("3 lembar Rp10.000 dan 4 lembar Rp1.000", True, "Benar. 30.000 + 4.000 = 34.000."),
    ("4 lembar Rp10.000 dan 3 lembar Rp1.000", False, "Itu 43.000. Banyak lembarannya tertukar."),
    ("3 lembar Rp10.000 dan 4 keping Rp100", False, "Itu 30.400. Seribuan dan seratusan berbeda nilainya."),
    ("34 keping Rp100", False, "Itu hanya 3.400."),
])
soal("LT9", 3, "Ibu Saga berbelanja Rp59.000. Di dompetnya ada 2 lembar Rp20.000, 3 lembar Rp10.000, 2 lembar Rp5.000, dan 5 lembar Rp2.000. Ada berapa cara membayar dengan uang pas?", [
    ("1 cara", False, "Ada cara lain: satu lembar Rp20.000 diganti dua lembar Rp10.000."),
    ("2 cara", True, "Benar. 20.000 + 20.000 + 10.000 + 5.000 + 2.000 + 2.000, atau 20.000 + 10.000 + 10.000 + 10.000 + 5.000 + 2.000 + 2.000."),
    ("3 cara", False, "Tanpa tepat satu lembar Rp5.000, jumlahnya tidak bisa pas, jadi hanya ada 2 cara."),
    ("4 cara", False, "Coba daftarkan semua cara. Tanpa tepat satu lembar Rp5.000, jumlahnya tidak bisa pas."),
], sulit="Sulit")
soal("LT10", 3, "Harga belanjaan Rp56.900. Susunan uang pas yang tepat adalah ...", [
    ("2 × Rp20.000, 1 × Rp10.000, 1 × Rp5.000, 1 × Rp1.000, 1 × Rp500, 4 × Rp100", True, "Benar. 40.000 + 10.000 + 5.000 + 1.000 + 500 + 400 = 56.900."),
    ("2 × Rp20.000, 1 × Rp10.000, 1 × Rp5.000, 1 × Rp1.000, 1 × Rp500, 2 × Rp100", False, "Jumlahnya 56.700, kurang 200."),
    ("2 × Rp20.000, 1 × Rp10.000, 1 × Rp5.000, 1 × Rp500, 4 × Rp100", False, "Jumlahnya 55.900, kurang 1.000."),
    ("3 × Rp20.000", False, "Jumlahnya 60.000. Itu lebih dari harganya, jadi bukan uang pas."),
], sulit="Sulit")
soal("LT11", 4, "67.987 − 13.453 = ...", [
    ("54.534", True, "Benar. Kurangkan dari kanan: 7−3, 8−5, 9−4, 7−3, 6−1."),
    ("81.440", False, "Ini hasil penjumlahan. Soalnya meminta pengurangan."),
    ("54.543", False, "Angka puluhan dan satuan tertukar."),
    ("53.534", False, "Periksa tempat ribuan: 7 − 3 = 4."),
])
soal("LT12", 4, "567 × 107 = ...", [
    ("60.669", True, "Benar. 567 × 100 + 567 × 7 = 56.700 + 3.969 = 60.669."),
    ("56.700", False, "Itu baru 567 × 100. Tambahkan juga 567 × 7."),
    ("3.969", False, "Itu baru 567 × 7. Tambahkan juga 567 × 100."),
    ("55.566", False, "Itu hasil 567 × 98, bukan 567 × 107."),
], sulit="Sulit")
soal("LT13", 4, "Yohana membeli dua bungkus mangga seharga Rp45.000 (untuk kedua bungkus) dan satu bungkus jeruk seharga Rp4.000. Berapa yang harus ia bayar?", [
    ("Rp49.000", True, "Benar. 45.000 + 4.000 = 49.000."),
    ("Rp94.000", False, "Rp45.000 sudah harga kedua bungkus mangga, jadi tidak dikali 2."),
    ("Rp41.000", False, "Belanjaan dijumlahkan, bukan dikurangkan."),
    ("Rp49.500", False, "Periksa lagi: 45.000 + 4.000 = 49.000."),
])
soal("LT14", 4, "Ibu mempunyai Rp100.000 dan membagikannya sama rata kepada dua anaknya. Berapa yang diterima setiap anak?", [
    ("Rp50.000", True, "Benar. 100.000 : 2 = 50.000."),
    ("Rp200.000", False, "Membagikan sama rata berarti membagi, bukan mengali."),
    ("Rp98.000", False, "Membagi dua bukan berarti mengurangi 2."),
    ("Rp25.000", False, "Itu bila dibagi empat. Anaknya ada dua."),
])
soal("LT15", 4, "Nisa memiliki Rp100.000. Ia berbelanja buah seharga Rp53.000. Berapa sisa uangnya?", [
    ("Rp47.000", True, "Benar. 100.000 − 53.000 = 47.000."),
    ("Rp153.000", False, "Sisa uang dihitung dengan mengurangi, bukan menjumlahkan."),
    ("Rp57.000", False, "Periksa pengurangan dengan meminjam: 100.000 − 53.000 = 47.000."),
    ("Rp53.000", False, "Itu harga belanjaannya, bukan sisa uangnya."),
])
soal("LT16", 4, "Paket A (1 ayam goreng, 1 nasi, 1 teh manis) harganya Rp27.500. Zafran dan Ula masing-masing membeli 1 Paket A. Berapa jumlah yang dibayar?", [
    ("Rp55.000", True, "Benar. 2 × 27.500 = 55.000."),
    ("Rp27.500", False, "Itu harga satu paket. Mereka membeli dua."),
    ("Rp54.000", False, "Periksa lagi: 27.500 + 27.500 = 55.000."),
    ("Rp53.000", False, "Itu harga Paket B, bukan dua Paket A."),
], sulit="Sedang")

refs = [s["ref"] for s in S]
assert len(refs) == len(set(refs))
assert {p["no"] for p in PELAJARAN} >= {s["pel"] for s in S}
assert sum(1 for s in S if s["guna"] == "Pemetaan awal") == 4 and sum(1 for s in S if s["guna"] == "Cek penguasaan") == 8
# INV-24: no parallel group may hold both a Pemetaan awal and a Cek penguasaan question.
for _k in {s["kelompok"] for s in S if s["kelompok"]}:
    assert len({s["guna"] for s in S if s["kelompok"] == _k} & {"Pemetaan awal", "Cek penguasaan"}) < 2, _k


def tulis(path):
    wb = Workbook()
    wb.remove(wb.active)

    def lembar(nama, header, rows):
        ws = wb.create_sheet(nama)
        ws.append(header)
        for c in ws[1]:
            c.font = Font(bold=True)
        for r in rows:
            ws.append(r)
        for col in ws.columns:
            w = max(len(str(c.value or "")) for c in col)
            ws.column_dimensions[col[0].column_letter].width = min(max(12, w * 0.9), 70)
            for c in col:
                c.alignment = Alignment(wrap_text=True, vertical="top")

    lembar("Kursus", list(KURSUS), [list(KURSUS.values())])
    lembar("Bab", ["No bab*", "Judul bab*"], [list(b) for b in BAB])
    lembar("Pelajaran", ["No bab", "No pelajaran", "Judul pelajaran", "Ringkasan", "Isi pelajaran", "Tujuan pembelajaran", "Tingkat berpikir", "Media", "Transkrip"],
           [[1, p["no"], p["judul"], p["ringkasan"], p["isi"], p["tujuan"], p["bloom"], p["media"], p["transkrip"]] for p in PELAJARAN])
    lembar("Soal", ["Kode soal", "No bab", "No pelajaran", "Jenis soal", "Pertanyaan", "Bacaan", "Petunjuk", "Kegunaan", "Tingkat kesulitan", "Kelompok paralel"],
           [[s["ref"], 1, s["pel"], "Pilihan ganda", s["tanya"], "", s["petunjuk"], s["guna"], s["sulit"], s["kelompok"]] for s in S])
    lembar("Pilihan", ["Kode soal", "Pilihan", "Teks pilihan", "Benar", "Alasan", "Kode miskonsepsi"],
           [[s["ref"], "ABCDE"[i], t, "Ya" if b else "Tidak", alasan, ""] for s in S for i, (t, b, alasan) in enumerate(s["pilihan"])])
    wb.save(path)


if __name__ == "__main__":
    here = os.path.dirname(os.path.abspath(__file__))
    out = os.path.join(here, "SD5-Matematika-Bab1.xlsx")
    tulis(out)
    print(out, f"lessons {len(PELAJARAN)}, questions {len(S)} (pre 4, post 8, practice {len(S) - 12}), options {sum(len(s['pilihan']) for s in S)}")
    print("Rp59.000 exact ways:", CARA_SAGA)
