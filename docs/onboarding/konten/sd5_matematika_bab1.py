# SD Kelas 5, Matematika, Bab 1 "Bilangan Cacah sampai 100.000", as a PINTAR lesson
# workbook in the D-007 template (sheets Kursus, Bab, Pelajaran, Soal, Pilihan; the column
# contract is KOLOM in src/lib/unggah-kontrak.ts).
#
# Source: Buku Panduan Guru Matematika untuk SD/MI Kelas V (Meita Fitrianawati, Ika Surtiani,
# Ait Istiandaru; Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi, 2022), Bab 1,
# pp. 15-42. The robot/boneka prices come from the school's study guide.
#
# LANA-01 (28 Sep): text lessons only (D-050), so the two media lessons are gone and their recap
# is now the last page of lesson 5; the post-test uses fresh numbers throughout; answers are
# spread over A-D; every distractor names the mistake behind it (MISKONSEPSI). The workbook's
# "Kode miskonsepsi" column stays empty until codes can be registered; the proposed codes go to
# SD5-Matematika-Bab1-miskonsepsi.csv instead.
#
# Every number in a lesson example, question, answer or distractor is checked below; the script
# fails before writing anything if one is wrong.
#
# Run: python3 docs/onboarding/konten/sd5_matematika_bab1.py
import csv
import os
import re
from openpyxl import Workbook
from openpyxl.styles import Alignment, Font

CEK = [0]


def cek(syarat, pesan=""):
    """An assertion that is counted, so the hand-off can say how many passed."""
    assert syarat, pesan
    CEK[0] += 1


def tanpa_simpan(a, b):
    """a + b with every carry forgotten, digit by digit."""
    hasil, tempat = 0, 1
    while a or b:
        hasil += (a % 10 + b % 10) % 10 * tempat
        a, b, tempat = a // 10, b // 10, tempat * 10
    return hasil


def tanpa_pinjam(a, b):
    """a - b done as 'the smaller digit from the larger' in every place: no borrowing."""
    hasil, tempat = 0, 1
    while a or b:
        hasil += abs(a % 10 - b % 10) * tempat
        a, b, tempat = a // 10, b // 10, tempat * 10
    return hasil


def cara_bayar_pas(total, dompet):
    """Every exact way to pay `total` from the wallet {denomination: count}."""
    nilai = sorted(dompet, reverse=True)
    hasil = []

    def cari(i, sisa, pilih):
        if sisa == 0:
            hasil.append({d: n for d, n in pilih.items() if n})
            return
        if i == len(nilai):
            return
        d = nilai[i]
        for n in range(min(dompet[d], sisa // d), -1, -1):
            pilih[d] = n
            cari(i + 1, sisa - n * d, pilih)
        pilih.pop(d, None)

    cari(0, total, {})
    return hasil


# ── Lesson examples ─────────────────────────────────────────────────────────────
cek(20_000 + 6_000 + 900 + 30 + 2 == 26_932)
cek(20_000 + 2_000 + 200 + 20 + 2 == 22_222)
cek(str(43_518)[1] == "3")                                   # Coba: 3 in 43.518 is ribuan
cek(50 * 1_000 + 303 == 50_303 and 20 * 1_000 + 40 == 20_040)
cek(int("503" + "3") == 5_033 < 50_303)                    # 50.303 with its puluhan 0 left out
cek(76_675 > 67_765 and 70_000 > 67_765)                     # 7 puluh ribuan beats all of 67.765
cek(86_567 < 86_576 and 45_867 < 55_876)
cek(sorted([45_500, 42_000, 38_500]) == [38_500, 42_000, 45_500])
cek(85_400 - 85_350 == 50 and 85_450 + 50 == 85_500)
cek(3 * 10_000 + 4 * 1_000 == 34_000)
cek(3 * 10_000 + 7 * 1_000 + 10 * 100 == 38_000 and 10 * 100 == 1_000)
cek(2 * 10_000 + 15 * 100 == 21_500)                         # Coba in lesson 3
cek(20_000 + 5_000 == 10_000 + 10_000 + 5_000 == 5 * 5_000 == 25_000)
CARA_SAGA = cara_bayar_pas(59_000, {20_000: 2, 10_000: 3, 5_000: 2, 2_000: 5})
cek(len(CARA_SAGA) == 2, CARA_SAGA)                          # book: "2 Cara"
cek({20_000: 2, 10_000: 1, 5_000: 1, 2_000: 2} in CARA_SAGA and {20_000: 1, 10_000: 3, 5_000: 1, 2_000: 2} in CARA_SAGA)
cek(76_598 + 12_456 == 89_054)                               # book 4a
cek(8 + 6 == 14 and 9 + 5 + 1 == 15 and 5 + 4 + 1 == 10 and 6 + 2 + 1 == 9 and 7 + 1 == 8)
cek(45_362 - 17_548 == 27_814 and 27_814 + 17_548 == 45_362)
cek(12 - 8 == 4 and 5 - 4 == 1 and 13 - 5 == 8 and 14 - 7 == 7 and 3 - 1 == 2)
cek(567 * 107 == 567 * 100 + 567 * 7 == 56_700 + 3_969 == 60_669)
# BOOK ERROR: the answer key (Uji Kompetensi 4d, p. 36) gives 567 x 107 = 55.566; that is 567 x 98.
cek(567 * 98 == 55_566 and 567 * 107 != 55_566)
cek(1_245 * 24 == 1_245 * 20 + 1_245 * 4 == 24_900 + 4_980 == 29_880)
cek(67_032 // 147 == 456 and 67_032 % 147 == 0)              # book 4c
cek(670 // 147 == 4 and 670 - 4 * 147 == 82 and 823 // 147 == 5 and 823 - 5 * 147 == 88 and 882 // 147 == 6 and 882 == 6 * 147)
cek(100_000 - 53_000 == 47_000)
cek(2 * 27_500 == 55_000 and 55_000 - 53_000 == 2_000)      # book 6a, 6b
cek(53_000 // 2 == 26_500 and 35_000 - 26_500 == 8_500)      # book 6c
cek(9 * 10_000 + 7 * 1_000 + 5 * 100 == 97_500)              # book 3c (not used; checked to confirm the key)
cek(2 * 20_000 + 10_000 + 5_000 + 1_000 + 500 + 4 * 100 == 56_900 == 2 * 20_000 + 10_000 + 5_000 + 1_000 + 500 + 2 * 200)  # pengayaan

SUMBER = ("_Diadaptasi dari Buku Panduan Guru Matematika untuk SD/MI Kelas V, Kementerian Pendidikan, "
          "Kebudayaan, Riset, dan Teknologi, 2022, Bab 1._")

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
         ringkasan="Bilangan sampai 100.000 dibaca per kelompok ribuan, dan setiap angka bernilai sesuai tempatnya.",
         tujuan="Kalian dapat membaca, menulis, dan menentukan nilai tempat bilangan cacah sampai 100.000.",
         bloom="Memahami",
         isi=f"""## Bilangan lima angka di sekitar kita

Coba perhatikan harga di toko, jumlah penduduk, atau jarak antarkota. Banyak yang ditulis dengan lima angka.

- Harga sebotol jus mangga **Rp6.375**. Bilangan ini punya empat angka.
- Penduduk Kecamatan Kayu Tanam ada **26.932** jiwa. Bilangan ini punya lima angka.

Di bab ini kalian belajar bilangan sampai **100.000** (seratus ribu). Bilangan 100.000 sendiri punya enam angka.

**Coba:** cari satu bilangan lima angka di rumah kalian, misalnya di struk belanja atau kemasan makanan.

## Nilai tempat

Setiap angka dalam bilangan menempati satu **tempat**. Tempat itu menentukan **nilai** angkanya.

| Puluh ribuan | Ribuan | Ratusan | Puluhan | Satuan |
|---|---|---|---|---|
| 2 | 6 | 9 | 3 | 2 |

Pada 26.932:

- 2 di tempat puluh ribuan, nilainya 20.000
- 6 di tempat ribuan, nilainya 6.000
- 9 di tempat ratusan, nilainya 900
- 3 di tempat puluhan, nilainya 30
- 2 di tempat satuan, nilainya 2

Jadi 26.932 = 20.000 + 6.000 + 900 + 30 + 2.

## Angka sama, nilai berbeda

Lihat bilangan **22.222**. Semua angkanya 2, tetapi nilainya berbeda-beda: 20.000, 2.000, 200, 20, dan 2.

Mengapa? Karena setiap tempat bernilai sepuluh kali tempat di kanannya. Makin ke kiri, makin besar nilainya.

**Coba:** pada 43.518, berapa nilai angka 3?
_Periksa: 3 ada di tempat ribuan (tepat di depan titik), jadi nilainya 3.000._

## Membaca bilangan

Titik memisahkan kelompok ribuan. Bacalah dengan tiga langkah:

1. Baca bagian **di depan titik**.
2. Tambahkan kata **ribu**.
3. Baca tiga angka **di belakang titik** seperti biasa.

Contoh 26.932:

1. Di depan titik ada 26: dua puluh enam.
2. Tambahkan ribu: dua puluh enam ribu.
3. Di belakang titik ada 932: sembilan ratus tiga puluh dua.

Jadi 26.932 dibaca **dua puluh enam ribu sembilan ratus tiga puluh dua**.

Bila di depan titik hanya ada angka 1, bacalah **seribu**: 1.250 dibaca seribu dua ratus lima puluh.

Jangan membaca angkanya satu per satu, seperti "dua enam sembilan tiga dua". Cara itu tidak menunjukkan nilai bilangannya.

## Menulis bilangan dengan angka

Tulis "lima puluh ribu tiga ratus tiga" dengan angka.

1. Bagian ribunya: lima puluh, ditulis **50**, lalu titik.
2. Bagian sesudahnya: tiga ratus tiga. Ada 3 ratusan, **0 puluhan**, dan 3 satuan, jadi **303**.
3. Gabungkan: **50.303**.

Angka 0 tetap ditulis. Tanpa 0 itu, angka 3 terakhir bergeser ke tempat lain dan bilangannya menjadi 5.033 (lima ribu tiga puluh tiga), jauh lebih kecil.

**Coba:** tulis "dua puluh ribu empat puluh" dengan angka.
_Periksa: 20.040. Tidak ada ratusan dan satuan, jadi kedua tempat itu diisi 0._

{SUMBER}"""),
    dict(no=2, judul="Membandingkan dan Mengurutkan",
         ringkasan="Dua bilangan dibandingkan mulai dari angka paling kiri; dengan cara itu beberapa bilangan juga dapat diurutkan.",
         tujuan="Kalian dapat membandingkan dan mengurutkan bilangan cacah sampai 100.000.",
         bloom="Menerapkan",
         isi=f"""## Tiga tanda

- **>** artinya lebih besar dari
- **<** artinya lebih kecil dari
- **=** artinya sama dengan

Cara mengingatnya: ujung lancip tanda selalu menunjuk ke bilangan yang **lebih kecil**. Pada 5 > 3, ujung lancipnya menunjuk ke 3.

## Mulai dari angka paling kiri

Bandingkan 76.675 dan 67.765.

1. Lihat tempat paling kiri, yaitu puluh ribuan: 7 dan 6.
2. 7 lebih besar dari 6.
3. Jadi **76.675 > 67.765**.

Kita tidak perlu melihat angka lainnya. Mengapa? Angka 7 di puluh ribuan saja sudah bernilai 70.000, lebih besar dari seluruh 67.765.

Hati-hati: jangan memulai dari angka paling belakang. Angka satuan yang besar tidak membuat bilangannya lebih besar.

## Bila angka depannya sama

Bandingkan 86.567 dan 86.576. Periksa tempat demi tempat dari kiri:

| Tempat | 86.567 | 86.576 |
|---|---|---|
| Puluh ribuan | 8 | 8 (sama) |
| Ribuan | 6 | 6 (sama) |
| Ratusan | 5 | 5 (sama) |
| Puluhan | 6 | 7 (berbeda) |

Angka pertama yang berbeda ada di puluhan: 6 lebih kecil dari 7. Jadi **86.567 < 86.576**.

Bila semua tempat sama, kedua bilangan itu sama: 13.234 = 13.234.

## Mengurutkan

Tiga mainan dijual dengan harga Rp45.500 (robot), Rp42.000 (boneka), dan Rp38.500 (mobil-mobilan). Urutkan dari yang **termurah**.

1. Bandingkan puluh ribuan: 4, 4, dan 3. Yang 3 paling kecil, jadi **Rp38.500** pertama.
2. Sisanya 45.500 dan 42.000. Puluh ribuannya sama, lalu di ribuan 2 lebih kecil dari 5. Jadi **Rp42.000** berikutnya.
3. Terakhir **Rp45.500**.

Urutan dari termurah: Rp38.500; Rp42.000; Rp45.500. Urutan dari **termahal** adalah kebalikannya.

## Pola bilangan

Perhatikan 85.350; 85.400; 85.450; ...

1. Cari selisih dua bilangan yang berdekatan: 85.400 − 85.350 = 50.
2. Periksa pasangan berikutnya: 85.450 − 85.400 = 50. Sama, jadi polanya **bertambah 50**.
3. Bilangan berikutnya: 85.450 + 50 = **85.500**.

**Coba:** apa bilangan sesudah 85.500?
_Periksa: 85.550._

{SUMBER}"""),
    dict(no=3, judul="Komposisi dan Dekomposisi",
         ringkasan="Menyusun bilangan dari bagian-bagiannya dan menguraikannya kembali, misalnya dengan uang.",
         tujuan="Kalian dapat menyusun (komposisi) dan menguraikan (dekomposisi) bilangan cacah sampai 100.000, termasuk jumlah uang.",
         bloom="Menerapkan",
         isi=f"""## Menyusun bilangan (komposisi)

**Komposisi** berarti menyusun beberapa bagian menjadi satu bilangan.

Kalian punya 3 lembar uang sepuluh ribuan dan 4 lembar seribuan. Berapa jumlahnya?

1. 3 lembar sepuluh ribuan: 3 × 10.000 = 30.000
2. 4 lembar seribuan: 4 × 1.000 = 4.000
3. Jumlahkan: 30.000 + 4.000 = **34.000**

## Hitung nilainya, bukan banyaknya

3 lembar sepuluh ribuan, 7 lembar seribuan, dan **10 keping seratusan**. Berapa jumlahnya?

1. 3 × 10.000 = 30.000
2. 7 × 1.000 = 7.000
3. 10 × 100 = **1.000**. Sepuluh keping seratusan bernilai seribu, bukan seratus dan bukan sepuluh.
4. 30.000 + 7.000 + 1.000 = **38.000**

Yang dijumlahkan adalah **nilai** uangnya, bukan banyak lembar atau kepingnya.

**Coba:** 2 lembar sepuluh ribuan dan 15 keping seratusan. Berapa jumlahnya?
_Periksa: 20.000 + 1.500 = 21.500._

## Menguraikan bilangan (dekomposisi)

**Dekomposisi** berarti menguraikan satu bilangan menjadi bagian-bagiannya. Satu bilangan bisa diuraikan dengan lebih dari satu cara.

Rp25.000 bisa berupa:

- 20.000 + 5.000
- 10.000 + 10.000 + 5.000
- 5.000 + 5.000 + 5.000 + 5.000 + 5.000

Semua cara itu benar karena jumlahnya sama: 25.000.

## Membayar dengan uang pas

Ibu Saga berbelanja Rp59.000. Di dompetnya ada 2 lembar Rp20.000, 3 lembar Rp10.000, 2 lembar Rp5.000, dan 5 lembar Rp2.000. Bagaimana ia bisa membayar dengan uang pas?

1. Perhatikan 59.000. Lembar Rp20.000, Rp10.000, dan Rp2.000 selalu menghasilkan ribuan yang **genap**. Supaya muncul 9.000 yang ganjil, harus ada **tepat satu** lembar Rp5.000.
2. Sisanya 59.000 − 5.000 = 54.000, dibayar dengan lembar lain.
3. Cara 1: 20.000 + 20.000 + 10.000 + 2.000 + 2.000 = 54.000.
4. Cara 2: 20.000 + 10.000 + 10.000 + 10.000 + 2.000 + 2.000 = 54.000.

Jadi ada **2 cara**. Setiap kali selesai, jumlahkan lagi semua lembarnya untuk memeriksa.

{SUMBER}"""),
    dict(no=4, judul="Operasi Hitung Bilangan sampai 100.000",
         ringkasan="Menjumlah, mengurang, mengali, dan membagi bilangan sampai 100.000 dengan langkah yang teratur, lalu memeriksa hasilnya.",
         tujuan="Kalian dapat menghitung penjumlahan, pengurangan, perkalian, dan pembagian bilangan cacah sampai 100.000.",
         bloom="Menerapkan",
         isi=f"""## Penjumlahan bersusun

Hitung 76.598 + 12.456. Susun angka sesuai tempatnya, lalu jumlahkan dari kanan.

1. Satuan: 8 + 6 = 14. Tulis 4, **simpan 1** ke puluhan.
2. Puluhan: 9 + 5 + 1 = 15. Tulis 5, simpan 1.
3. Ratusan: 5 + 4 + 1 = 10. Tulis 0, simpan 1.
4. Ribuan: 6 + 2 + 1 = 9.
5. Puluh ribuan: 7 + 1 = 8.

Hasilnya **89.054**.

Mengapa menyimpan? 14 satuan sama dengan 1 puluhan dan 4 satuan. Puluhan itu harus ikut dijumlahkan di tempat puluhan.

## Pengurangan bersusun

Hitung 45.362 − 17.548. Kurangkan dari kanan.

1. Satuan: 2 − 8 tidak bisa. **Pinjam** 1 puluhan, jadi 12 − 8 = 4. Puluhan tinggal 5.
2. Puluhan: 5 − 4 = 1.
3. Ratusan: 3 − 5 tidak bisa. Pinjam 1 ribuan: 13 − 5 = 8. Ribuan tinggal 4.
4. Ribuan: 4 − 7 tidak bisa. Pinjam 1 puluh ribuan: 14 − 7 = 7. Puluh ribuan tinggal 3.
5. Puluh ribuan: 3 − 1 = 2.

Hasilnya **27.814**. Periksa dengan penjumlahan: 27.814 + 17.548 = 45.362. Cocok.

Mengapa meminjam? 1 puluhan sama dengan 10 satuan, jadi satuannya bertambah 10.

## Perkalian

Hitung 567 × 107. Pecah 107 menjadi 100 + 7.

1. 567 × 100 = 56.700
2. 567 × 7 = 3.969
3. Jumlahkan: 56.700 + 3.969 = **60.669**

Contoh lain, 1.245 × 24. Pecah 24 menjadi 20 + 4.

1. 1.245 × 20 = 24.900
2. 1.245 × 4 = 4.980
3. 24.900 + 4.980 = **29.880**

Kedua hasil kali harus dijumlahkan. Bila hanya satu yang dihitung, jawabannya kurang.

## Pembagian bersusun

Hitung 67.032 : 147.

1. Ambil angka dari kiri sampai cukup untuk dibagi 147. 6 dan 67 terlalu kecil, jadi ambil 670. 147 masuk ke 670 sebanyak **4** kali (4 × 147 = 588). Sisa 670 − 588 = 82.
2. Turunkan angka berikutnya (3): 823. 147 masuk **5** kali (5 × 147 = 735). Sisa 88.
3. Turunkan angka terakhir (2): 882. 147 masuk **6** kali (6 × 147 = 882). Sisa 0.

Hasilnya **456**.

## Periksa jawaban kalian

Setiap operasi punya "kebalikan" untuk memeriksa:

- Hasil pengurangan diperiksa dengan penjumlahan.
- Hasil pembagian diperiksa dengan perkalian: 147 × 456 = 67.032. Cocok.

Bila hasil pemeriksaannya tidak cocok, pasti ada langkah yang keliru. Ulangi dari langkah pertama.

{SUMBER}"""),
    dict(no=5, judul="Memecahkan Masalah Sehari-hari",
         ringkasan="Memilih operasi yang tepat untuk soal cerita tentang uang dan belanja, termasuk soal yang perlu dua langkah.",
         tujuan="Kalian dapat memecahkan masalah sehari-hari yang berkaitan dengan bilangan cacah sampai 100.000.",
         bloom="Menerapkan",
         isi=f"""## Empat langkah soal cerita

1. **Baca** soalnya dua kali. Apa yang diketahui? Apa yang ditanyakan?
2. **Pilih operasinya.** Digabung atau dibeli bersama: tambah. Sisa atau selisih: kurang. Beberapa kali yang sama: kali. Dibagi sama rata: bagi.
3. **Hitung** dengan teliti.
4. **Periksa**: apakah jawaban kalian menjawab pertanyaannya, dan apakah masuk akal?

## Satu langkah: mencari sisa

Nisa memiliki Rp100.000. Ia berbelanja buah seharga Rp53.000. Berapa sisa uangnya?

1. Ditanyakan **sisa**, jadi operasinya pengurangan.
2. 100.000 − 53.000 = 47.000.
3. Periksa: 47.000 + 53.000 = 100.000. Cocok.

Sisa uang Nisa **Rp47.000**.

## Dua langkah: memilih paket makan

Di warung, Paket A (1 ayam goreng, 1 nasi, 1 teh manis) harganya Rp27.500. Paket B (2 ayam, 2 nasi, 2 teh manis) harganya Rp53.000. Zafran dan Ula ingin makan siang berdua.

**Bila masing-masing membeli Paket A:** 2 × 27.500 = 55.000.

**Mana yang lebih hemat?** Paket B isinya sama dengan dua Paket A, tetapi harganya Rp53.000. Selisihnya 55.000 − 53.000 = 2.000. Jadi Paket B lebih hemat Rp2.000.

**Bila mereka membeli Paket B dan membayar sama rata**, dan masing-masing membawa Rp35.000:

1. Bagian masing-masing: 53.000 : 2 = 26.500.
2. Sisa masing-masing: 35.000 − 26.500 = **8.500**.

Perhatikan pertanyaannya: sisa **masing-masing**, bukan sisa berdua. Hasil langkah 1 (26.500) juga bukan jawabannya, itu baru bagian yang dibayar.

## Rangkuman Bab 1

- Bilangan sampai 100.000 dibaca per kelompok: bagian di depan titik ditambah kata **ribu**.
- Nilai sebuah angka bergantung pada **tempatnya**.
- Bandingkan bilangan mulai dari angka **paling kiri**.
- Komposisi menyusun bilangan dari bagian-bagiannya; dekomposisi menguraikannya, dan sering ada lebih dari satu cara.
- Saat menjumlah, jangan lupa **menyimpan**; saat mengurang, jangan lupa **meminjam**.
- Pada soal cerita, tentukan dahulu apa yang **ditanyakan**, lalu pilih operasinya.

{SUMBER}"""),
]

for _p in PELAJARAN:
    cek(3 <= _p["isi"].count("\n## ") + _p["isi"].startswith("## ") <= 6, f"lesson {_p['no']}: 3-6 pages")
    cek(_p["isi"].rstrip().endswith(SUMBER), f"lesson {_p['no']}: attribution last")

# ── Misconceptions. Each distractor carries one of these codes; the workbook leaves the column
# empty until codes can be registered (a code a school has not registered fails the upload).
MISKONSEPSI = {
    "SD5-M-B1-01": ("Membaca angka satu per satu",
                    "Bilangan dibaca angka demi angka, tanpa memperhatikan nilai tempat dan kelompok ribuan.",
                    "Tulis bilangan di tabel nilai tempat, lalu baca bagian di depan titik dengan kata \"ribu\" sebelum membaca tiga angka di belakangnya."),
    "SD5-M-B1-02": ("Kelompok ribuan keliru",
                    "Titik pemisah ribuan diabaikan atau diletakkan di tempat lain, sehingga bagian \"ribu\" dibaca terlalu besar, terlalu kecil, atau tidak dibaca.",
                    "Tunjuk titiknya lebih dulu dan tanyakan: angka berapa yang ada di depan titik? Itulah bagian yang diikuti kata \"ribu\"."),
    "SD5-M-B1-03": ("Tempat bernilai nol terlewat",
                    "Tempat yang kosong (nol) tidak ditulis atau tidak diperhitungkan, sehingga angka lain bergeser dari tempatnya.",
                    "Isi tabel nilai tempat kolom demi kolom dan tulis 0 di setiap kolom yang kosong sebelum menyalin bilangannya."),
    "SD5-M-B1-04": ("Tempat angka tertukar",
                    "Angka ditempatkan di kolom tetangga (ribuan dengan ratusan, puluhan dengan satuan), atau tempat dihitung dari arah sebaliknya.",
                    "Beri nama kolom dari kanan (satuan, puluhan, ratusan, ribuan, puluh ribuan) dan cocokkan setiap angka dengan kolomnya."),
    "SD5-M-B1-05": ("Nilai angka sama dengan angkanya",
                    "Nilai sebuah angka dianggap sama dengan angkanya sendiri, tanpa dikalikan nilai tempatnya.",
                    "Bandingkan angka 2 pada 22.222 di setiap tempat: nilainya 20.000, 2.000, 200, 20, dan 2."),
    "SD5-M-B1-06": ("Membandingkan dari belakang",
                    "Bilangan yang angka belakangnya (atau salah satu angkanya) lebih besar dianggap bilangan yang lebih besar.",
                    "Susun kedua bilangan dalam tabel nilai tempat dan bandingkan dari kolom paling kiri sampai menemukan angka yang berbeda."),
    "SD5-M-B1-07": ("Angka sama dianggap bilangan sama",
                    "Dua bilangan yang tersusun dari angka yang sama dianggap sama besar atau tidak dapat dibandingkan, padahal letak angkanya berbeda.",
                    "Tulis kedua bilangan dalam tabel nilai tempat; tunjukkan bahwa angka yang sama di tempat berbeda bernilai berbeda."),
    "SD5-M-B1-08": ("Menghitung banyak, bukan nilai",
                    "Banyak lembar atau keping uang dijumlahkan seolah-olah nilainya, misalnya 10 keping seratusan dianggap 100 atau 10.",
                    "Hitung nilai setiap jenis uang dengan perkalian (10 × 100 = 1.000) sebelum menjumlahkannya."),
    "SD5-M-B1-09": ("Lupa menyimpan",
                    "Pada penjumlahan bersusun, hasil yang lebih dari 9 di satu tempat ditulis angka satuannya saja dan 1 yang disimpan tidak dijumlahkan ke tempat berikutnya.",
                    "Tulis angka simpanan kecil di atas kolom berikutnya dan centang setelah ikut dijumlahkan."),
    "SD5-M-B1-10": ("Operasi tidak sesuai pertanyaan",
                    "Operasi dipilih dari angka yang tampak, bukan dari yang ditanyakan (misalnya menjumlahkan saat ditanya sisa, atau mengali saat dibagi rata).",
                    "Garis bawahi kata kunci pertanyaannya (sisa, selisih, semuanya, masing-masing, dibagi rata) dan pasangkan dengan operasinya sebelum menghitung."),
    "SD5-M-B1-11": ("Hasil kali sebagian",
                    "Pada perkalian dengan bilangan dua atau tiga angka, hanya sebagian hasil kali yang dihitung atau bagian itu tidak digeser ke nilai tempatnya.",
                    "Pecah pengalinya menurut nilai tempat (107 = 100 + 7), hitung setiap bagian, lalu jumlahkan semua hasil kalinya."),
    "SD5-M-B1-12": ("Keliru meminjam",
                    "Pada pengurangan bersusun, angka yang lebih kecil dikurangi dari yang lebih besar di setiap tempat tanpa meminjam, atau tempat yang dipinjami tidak dikurangi 1.",
                    "Periksa setiap kolom: bila angka atas lebih kecil, pinjam 10 dari kolom kirinya dan coret angka kolom itu menjadi satu lebih kecil."),
    "SD5-M-B1-13": ("Syarat soal terlewat",
                    "Ada keterangan di soal yang tidak dipakai, misalnya banyak barang, banyak orang, atau untuk siapa harga itu berlaku.",
                    "Minta murid menuliskan semua yang diketahui dari soal dan mencentang setiap keterangan setelah dipakai dalam perhitungan."),
    "SD5-M-B1-14": ("Menjawab langkah antara",
                    "Pada soal dua langkah, hasil langkah pertama dianggap sebagai jawaban akhir.",
                    "Tulis pertanyaannya sekali lagi sebelum menulis jawaban, lalu periksa apakah angka akhir menjawab pertanyaan itu."),
    "SD5-M-B1-15": ("Lompatan pola keliru",
                    "Besar lompatan pola ditebak dari satu pasangan saja atau dari angka yang berubah, bukan dihitung dari selisihnya.",
                    "Hitung selisih dua pasangan bilangan yang berdekatan, pastikan sama, lalu tambahkan selisih itu ke bilangan terakhir."),
    "SD5-M-B1-16": ("Urutan terbalik",
                    "Urutan dari terkecil tertukar dengan urutan dari terbesar, atau hanya sebagian bilangan yang dibandingkan.",
                    "Tentukan dulu bilangan terkecil dan terbesar, lalu periksa setiap pasangan yang berdampingan dengan tanda < atau >."),
    "SD5-M-B1-17": ("Tidak mendaftar semua cara",
                    "Cara menyusun jumlah uang tidak didaftar dengan teratur, sehingga ada cara yang terlewat atau terhitung dua kali.",
                    "Daftar cara mulai dari lembar terbesar yang dipakai paling banyak, lalu kurangi satu per satu dan periksa jumlahnya setiap kali."),
    "SD5-M-B1-18": ("Hasil bagi tidak diperiksa",
                    "Hasil pembagian ditulis dengan angka tertukar atau nilai tempat bergeser, dan tidak diperiksa dengan perkalian.",
                    "Biasakan mengalikan hasil bagi dengan pembaginya; bila tidak kembali ke bilangan semula, ulangi pembagiannya."),
}

# ── Questions. Each option: (text, correct, reason, misconception code or "").
S = []


def soal(ref, pel, tanya, pilihan, guna="", sulit="Mudah", kelompok="", petunjuk=""):
    cek(len(pilihan) == 4, ref)
    cek(sum(1 for _, b, _, _ in pilihan if b) == 1, ref)
    for teks, benar, alasan, kode in pilihan:
        cek(alasan.strip() != "", f"{ref}: every option has an Alasan")
        cek((kode == "") == benar, f"{ref}: a code on every distractor, none on the answer ({teks})")
        cek(kode == "" or kode in MISKONSEPSI, f"{ref}: unknown code {kode}")
    cek(len({t for t, *_ in pilihan}) == 4, f"{ref}: four different options")
    S.append(dict(ref=ref, pel=pel, tanya=tanya, pilihan=pilihan, guna=guna, sulit=sulit, kelompok=kelompok, petunjuk=petunjuk))


BESAR, KECIL, SAMA, TAK = "lebih besar dari (>)", "lebih kecil dari (<)", "sama dengan (=)", "tidak dapat dibandingkan"

# ── Pemetaan awal (pre-test, D-008): what the learner brings from Kelas 4, one skill each:
# reading, place value, comparing, adding with carries. Not in a Kelas paralel with the post-test
# (INV-24 would then leave too few post-test questions drawable; Bob, 24 Sep).
cek(6_300 + 75 == 6_375)
soal("PA1", 1, "Bagaimana cara membaca 6.375?", [
    ("Enam tiga tujuh lima", False, "Angkanya dibaca satu per satu. Setiap angka harus dibaca menurut tempatnya: 6 di ribuan dibaca enam ribu.", "SD5-M-B1-01"),
    ("Enam ribu tiga ratus tujuh puluh lima", True, "Benar. Di depan titik ada 6, dibaca enam ribu; 375 dibaca tiga ratus tujuh puluh lima.", ""),
    ("Enam puluh tiga ribu tujuh ratus lima", False, "Itu cara membaca 63.705. Titiknya ada sesudah angka 6, jadi hanya 6 yang menjadi ribuan.", "SD5-M-B1-02"),
    ("Enam ratus tiga puluh tujuh ribu lima", False, "Seluruh bilangan dianggap bagian ribuan. Bilangan ini hanya punya empat angka, jadi paling besar ribuan.", "SD5-M-B1-02"),
], guna="Pemetaan awal")
cek(str(8_456)[1] == "4")
soal("PA2", 1, "Pada bilangan 8.456, angka 4 menempati nilai tempat ...", [
    ("satuan", False, "Tempat dihitung dari kiri. Satuan adalah angka paling kanan, yaitu 6.", "SD5-M-B1-04"),
    ("puluhan", False, "Tempat bergeser satu. Puluhan adalah angka kedua dari kanan, yaitu 5.", "SD5-M-B1-04"),
    ("ratusan", True, "Benar. Dari kanan: 6 satuan, 5 puluhan, 4 ratusan, 8 ribuan.", ""),
    ("ribuan", False, "Ribuan adalah angka di depan titik, yaitu 8. Angka 4 ada tepat sesudah titik.", "SD5-M-B1-04"),
], guna="Pemetaan awal")
cek(4_587 < 4_857)
soal("PA3", 2, "Tanda yang tepat untuk 4.587 ... 4.857 adalah ...", [
    (BESAR, False, "Perbandingan dimulai dari belakang: puluhan 8 lebih besar dari 5. Mulailah dari kiri; di ratusan 5 lebih kecil dari 8.", "SD5-M-B1-06"),
    (SAMA, False, "Angka-angkanya memang sama (4, 5, 8, 7), tetapi letaknya berbeda, jadi nilainya berbeda.", "SD5-M-B1-07"),
    (TAK, False, "Dua bilangan cacah selalu dapat dibandingkan, juga bila angka-angkanya sama tetapi letaknya berbeda.", "SD5-M-B1-07"),
    (KECIL, True, "Benar. Ribuannya sama (4); di ratusan 5 lebih kecil dari 8.", ""),
], guna="Pemetaan awal")
cek(5_468 + 2_375 == 7_843 and tanpa_simpan(5_468, 2_375) == 7_733 and 7_843 - 100 == 7_743 and 5_468 - 2_375 == 3_093)
soal("PA4", 4, "5.468 + 2.375 = ...", [
    ("7.843", True, "Benar. 8 + 5 = 13, tulis 3 simpan 1; 6 + 7 + 1 = 14, tulis 4 simpan 1; 4 + 3 + 1 = 8; 5 + 2 = 7.", ""),
    ("7.733", False, "Tidak ada yang disimpan: 8 + 5 = 13 dan 6 + 7 = 13 masing-masing seharusnya menyimpan 1 ke tempat berikutnya.", "SD5-M-B1-09"),
    ("7.743", False, "Simpanan dari satuan sudah dipakai, tetapi simpanan dari puluhan ke ratusan (6 + 7 + 1 = 14) terlupa.", "SD5-M-B1-09"),
    ("3.093", False, "Ini hasil pengurangan 5.468 − 2.375. Tanda + berarti dijumlahkan.", "SD5-M-B1-10"),
], guna="Pemetaan awal")

# ── Cek penguasaan (post-test, D-008): every chapter objective, fresh numbers and situations
# (asserted below against the lessons and the book's exercises).
cek(84_000 + 216 == 84_216)
soal("PB1", 1, "Jarak yang ditempuh sebuah bus dalam setahun adalah 84.216 km. Bagaimana cara membaca bilangan itu?", [
    ("Delapan empat ribu dua ratus enam belas", False, "84 dibaca angka demi angka. Bagian di depan titik dibaca delapan puluh empat.", "SD5-M-B1-01"),
    ("Delapan ratus empat puluh dua ribu enam belas", False, "Titiknya digeser: itu cara membaca 842.016. Titik ada sesudah 84.", "SD5-M-B1-02"),
    ("Delapan puluh empat ribu dua ratus enam belas", True, "Benar. 84 di depan titik dibaca delapan puluh empat ribu, lalu 216 dibaca dua ratus enam belas.", ""),
    ("Delapan puluh empat dua ratus enam belas", False, "Kata ribu terlupa, jadi titiknya diabaikan. 84 di depan titik bernilai delapan puluh empat ribu.", "SD5-M-B1-02"),
], guna="Cek penguasaan")
cek(str(57_689)[1] == "7")
soal("PB2", 1, "Pada bilangan 57.689, angka 7 bernilai ...", [
    ("7 (tujuh)", False, "Nilai angka disamakan dengan angkanya. Angka 7 ada di tempat ribuan, jadi nilainya 7 × 1.000.", "SD5-M-B1-05"),
    ("7.000 (tujuh ribu)", True, "Benar. 7 ada di tempat ribuan (tepat di depan titik), jadi nilainya 7.000.", ""),
    ("700 (tujuh ratus)", False, "Tempat dihitung satu kurang. 700 adalah nilai 7 bila berada di ratusan, tetapi di sini 7 ada di depan titik.", "SD5-M-B1-04"),
    ("70.000 (tujuh puluh ribu)", False, "70.000 adalah nilai 7 di tempat puluh ribuan. Angka paling kiri di sini adalah 5.", "SD5-M-B1-04"),
], guna="Cek penguasaan", sulit="Sedang")
cek(36_954 < 63_495 and sorted(str(36_954)) == sorted(str(63_495)))
soal("PB3", 2, "Tanda yang tepat untuk 36.954 ... 63.495 adalah ...", [
    (KECIL, True, "Benar. Mulai dari kiri: di puluh ribuan 3 lebih kecil dari 6.", ""),
    (BESAR, False, "Yang dilihat angka 9 yang besar di tengah bilangan. Besar bilangan ditentukan mulai dari angka paling kiri: 3 dan 6.", "SD5-M-B1-06"),
    (SAMA, False, "Kedua bilangan memakai angka 3, 4, 5, 6, 9, tetapi letaknya berbeda, jadi nilainya berbeda.", "SD5-M-B1-07"),
    (TAK, False, "Dua bilangan cacah selalu dapat dibandingkan, juga bila angka-angkanya sama tetapi letaknya berbeda.", "SD5-M-B1-07"),
], guna="Cek penguasaan", sulit="Sedang")
cek(42_458 + 35_687 == 78_145 and tanpa_simpan(42_458, 35_687) == 77_035 and 78_145 - 1_000 == 77_145 and 42_458 - 35_687 == 6_771)
soal("PB4", 4, "Sebuah perpustakaan memiliki 42.458 buku cerita dan 35.687 buku pelajaran. Berapa banyak buku seluruhnya?", [
    ("77.035 buku", False, "Tidak ada yang disimpan. 8 + 7 = 15 seharusnya menyimpan 1 ke puluhan, begitu juga di puluhan dan ratusan.", "SD5-M-B1-09"),
    ("6.771 buku", False, "Kedua bilangan dikurangkan. Kata seluruhnya berarti keduanya digabung, jadi dijumlahkan.", "SD5-M-B1-10"),
    ("77.145 buku", False, "Simpanan dari ratusan ke ribuan terlupa: 4 + 6 + 1 = 11, jadi 1 disimpan ke ribuan.", "SD5-M-B1-09"),
    ("78.145 buku", True, "Benar. 42.458 + 35.687 = 78.145, dengan tiga kali menyimpan: dari satuan, puluhan, dan ratusan.", ""),
], guna="Cek penguasaan", sulit="Sedang")
cek(70_000 + 200 + 8 == 70_208 and int("70000" + "208") == 70_000_208)
soal("PB5", 1, "\"Tujuh puluh ribu dua ratus delapan\" ditulis dengan angka ...", [
    ("7.208", False, "Tempat bernilai nol terlewat: tujuh puluh ribu ditulis 70 di depan titik, bukan 7.", "SD5-M-B1-03"),
    ("70.208", True, "Benar. 70 di depan titik, lalu 208: dua ratus, nol puluhan, delapan satuan.", ""),
    ("70.280", False, "Angka 8 digeser ke puluhan. Delapan di sini adalah satuan, dan puluhannya 0.", "SD5-M-B1-04"),
    ("70.000.208", False, "Setiap bagian ditulis lengkap lalu disambung: 70.000 dan 208. Bagian ribu cukup ditulis 70 di depan titik.", "SD5-M-B1-02"),
], guna="Cek penguasaan", sulit="Sedang")
cek(4 * 10_000 + 6 * 1_000 + 20 * 100 == 48_000 and 40_000 + 6_000 + 200 == 46_200 and 40_000 + 6_000 + 20 == 46_020)
cek(4 * 10_000 + 20 * 100 == 42_000)
soal("PB6", 3, "Di celengan Dimas ada 4 lembar uang sepuluh ribuan, 6 lembar seribuan, dan 20 keping seratusan. Berapa jumlah uangnya?", [
    ("Rp46.200", False, "20 keping seratusan dihitung sebagai 200. Nilainya 20 × 100 = 2.000.", "SD5-M-B1-08"),
    ("Rp46.020", False, "20 keping seratusan dihitung sebagai 20. Nilainya 20 × 100 = 2.000.", "SD5-M-B1-08"),
    ("Rp48.000", True, "Benar. 40.000 + 6.000 + 2.000 (20 × 100) = 48.000.", ""),
    ("Rp42.000", False, "6 lembar seribuan terlewat: 40.000 + 2.000. Semua uang di celengan harus dijumlahkan, 40.000 + 6.000 + 2.000.", "SD5-M-B1-13"),
], guna="Cek penguasaan", sulit="Sedang")
cek(58_344 // 136 == 429 and 58_344 % 136 == 0 and 136 * 924 == 125_664 and 136 * 4_290 == 583_440 and 136 * 492 == 66_912)
soal("PB7", 4, "58.344 : 136 = ...", [
    ("924", False, "Angka hasil bagi ditulis terbalik. Periksa: 136 × 924 = 125.664, jauh lebih dari 58.344.", "SD5-M-B1-18"),
    ("4.290", False, "Ada 0 berlebih, sehingga nilai tempatnya bergeser. Periksa: 136 × 4.290 = 583.440.", "SD5-M-B1-18"),
    ("492", False, "Dua angka terakhir tertukar. Periksa: 136 × 492 = 66.912, bukan 58.344.", "SD5-M-B1-18"),
    ("429", True, "Benar. 583 : 136 = 4 sisa 39; 394 : 136 = 2 sisa 122; 1.224 : 136 = 9. Periksa: 136 × 429 = 58.344.", ""),
], guna="Cek penguasaan", sulit="Sedang", petunjuk="Setelah membagi, kalikan hasilnya dengan 136 untuk memeriksa.")
cek(583 // 136 == 4 and 583 - 4 * 136 == 39 and 394 // 136 == 2 and 394 - 2 * 136 == 122 and 1_224 == 9 * 136)
cek(62_000 // 2 == 31_000 and 40_000 - 31_000 == 9_000 and 2 * 40_000 - 62_000 == 18_000 and 62_000 - 40_000 == 22_000)
soal("PB8", 5, "Dina dan Rafi masing-masing membawa Rp40.000. Mereka membeli satu hadiah seharga Rp62.000 untuk ibu guru dan membayarnya sama rata. Berapa sisa uang masing-masing?", [
    ("Rp9.000", True, "Benar. Masing-masing membayar 62.000 : 2 = 31.000, jadi sisanya 40.000 − 31.000 = 9.000.", ""),
    ("Rp18.000", False, "Itu sisa uang mereka berdua (80.000 − 62.000). Yang ditanyakan sisa masing-masing.", "SD5-M-B1-13"),
    ("Rp31.000", False, "Itu bagian yang dibayar masing-masing, hasil langkah pertama. Sisanya masih harus dihitung.", "SD5-M-B1-14"),
    ("Rp22.000", False, "Harga hadiah dikurangi uang satu orang (62.000 − 40.000). Harga hadiah dibagi dua dahulu, baru dikurangkan dari 40.000.", "SD5-M-B1-10"),
], guna="Cek penguasaan", sulit="Sulit")

# ── Latihan (practice), by lesson, from direct use toward a little more reasoning.
cek(15_000 + 590 == 15_590)
soal("LT1", 1, "Harga sebuah tas Rp15.590. Cara membacanya ...", [
    ("seratus lima puluh lima ribu sembilan puluh rupiah", False, "Titiknya digeser: itu 155.090. Di depan titik hanya ada 15.", "SD5-M-B1-02"),
    ("lima belas ribu lima sembilan puluh rupiah", False, "Kata ratus terlupa: 5 di tempat ratusan dibaca lima ratus.", "SD5-M-B1-01"),
    ("lima belas ribu lima ratus sembilan rupiah", False, "90 dibaca sembilan, seolah 9 ada di satuan. 9 ada di puluhan, jadi dibaca sembilan puluh.", "SD5-M-B1-04"),
    ("lima belas ribu lima ratus sembilan puluh rupiah", True, "Benar. 15 di depan titik dibaca lima belas ribu, lalu 590 dibaca lima ratus sembilan puluh.", ""),
])
cek(str(56_786)[2] == "7")
soal("LT2", 1, "Pada bilangan 56.786, angka 7 bernilai ...", [
    ("7", False, "Nilai angka disamakan dengan angkanya. 7 ada di tempat ratusan, jadi nilainya 7 × 100.", "SD5-M-B1-05"),
    ("70", False, "Tempat dihitung satu kurang: 70 adalah nilai 7 di puluhan. Puluhannya di sini 8.", "SD5-M-B1-04"),
    ("700", True, "Benar. 7 ada di tempat ratusan (angka pertama sesudah titik), jadi nilainya 700.", ""),
    ("7.000", False, "7.000 adalah nilai 7 di ribuan. Angka di depan titik di sini 6, bukan 7.", "SD5-M-B1-04"),
], petunjuk="Tentukan dahulu tempat angka 7, lalu tuliskan nilainya.")
cek(4 * 10_000 + 0 * 1_000 + 7 * 100 + 5 * 10 + 1 == 40_751)
soal("LT3", 1, "Bilangan yang terdiri atas 4 puluh ribuan, 0 ribuan, 7 ratusan, 5 puluhan, dan 1 satuan adalah ...", [
    ("4.751", False, "0 ribuan tidak ditulis, sehingga 4 bergeser dari puluh ribuan ke ribuan.", "SD5-M-B1-03"),
    ("40.751", True, "Benar. 40.000 + 0 + 700 + 50 + 1 = 40.751.", ""),
    ("47.051", False, "Ribuan dan ratusan tertukar: ribuannya 0 dan ratusannya 7.", "SD5-M-B1-04"),
    ("40.715", False, "Puluhan dan satuan tertukar: puluhannya 5 dan satuannya 1.", "SD5-M-B1-04"),
])
cek(43_217 < 78_897 < 89_876)
soal("LT4", 2, "Manakah urutan dari yang terkecil ke yang terbesar?", [
    ("43.217; 78.897; 89.876", True, "Benar. Di puluh ribuan: 4 < 7 < 8.", ""),
    ("89.876; 78.897; 43.217", False, "Ini urutan dari yang terbesar ke yang terkecil, terbalik dari yang diminta.", "SD5-M-B1-16"),
    ("78.897; 89.876; 43.217", False, "Yang dilihat angka satuannya (7, 6, 7) atau angka belakang, bukan angka paling kiri.", "SD5-M-B1-06"),
    ("43.217; 89.876; 78.897", False, "Hanya bilangan terkecil yang diperiksa. 89.876 lebih besar dari 78.897, jadi harus paling belakang.", "SD5-M-B1-16"),
])
cek(86_567 < 86_576)
soal("LT5", 2, "Tanda yang tepat untuk 86.567 ... 86.576 adalah ...", [
    (SAMA, False, "Kedua bilangan memakai angka yang sama, tetapi puluhan dan satuannya bertukar tempat, jadi nilainya berbeda.", "SD5-M-B1-07"),
    (KECIL, True, "Benar. Puluh ribuan, ribuan, dan ratusannya sama; di puluhan 6 lebih kecil dari 7.", ""),
    (BESAR, False, "Perbandingan dimulai dari satuan (7 lebih besar dari 6). Mulailah dari kiri dan berhenti di angka pertama yang berbeda.", "SD5-M-B1-06"),
    (TAK, False, "Dua bilangan cacah selalu dapat dibandingkan, walaupun angka-angkanya sama.", "SD5-M-B1-07"),
], sulit="Sedang", petunjuk="Mulailah dari angka paling kiri, lalu geser ke kanan sampai menemukan angka yang berbeda.")
cek(16_500 - 15_500 == 1_000 and 17_500 + 1_000 == 18_500)
soal("LT6", 2, "Lanjutkan polanya: 15.500; 16.500; 17.500; ...", [
    ("17.600", False, "Lompatannya ditebak 100. Hitung selisihnya: 16.500 − 15.500 = 1.000.", "SD5-M-B1-15"),
    ("18.000", False, "Lompatannya dibuat 500. Setiap langkah bertambah 1.000.", "SD5-M-B1-15"),
    ("18.500", True, "Benar. Setiap langkah bertambah 1.000: 17.500 + 1.000 = 18.500.", ""),
    ("27.500", False, "Lompatannya dibuat 10.000, seolah angka di puluh ribuan yang berubah. Yang berubah angka ribuan.", "SD5-M-B1-15"),
])
cek(50_000 - 30_000 == 20_000 and 70_000 + 20_000 == 90_000 and 70_000 + 10_000 == 80_000 and 70_000 + 2_000 == 72_000)
soal("LT7", 2, "Lanjutkan polanya: 30.000; 50.000; 70.000; ...", [
    ("90.000", True, "Benar. Selisihnya 50.000 − 30.000 = 20.000, jadi 70.000 + 20.000 = 90.000.", ""),
    ("80.000", False, "Lompatannya dianggap 10.000, padahal dari 30.000 ke 50.000 bertambah 20.000.", "SD5-M-B1-15"),
    ("72.000", False, "Yang ditambahkan 2.000, seolah angka 2 dari selisih ada di ribuan. Selisihnya 20.000.", "SD5-M-B1-05"),
    ("100.000", False, "Lompatannya dibuat 30.000, dari angka pertama pola. Hitung selisih dua bilangan yang berdekatan: 20.000.", "SD5-M-B1-15"),
])
cek(45_500 - 42_000 == 3_500 and 45_500 + 42_000 == 87_500 and 45 - 42 == 3)
soal("LT8", 2, "Robot seharga Rp45.500 dan boneka seharga Rp42.000. Mana yang lebih murah, dan berapa selisih harganya?", [
    ("Robot, selisihnya Rp3.500", False, "Selisihnya benar, tetapi robot lebih mahal: di ribuan 5 lebih besar dari 2.", "SD5-M-B1-06"),
    ("Boneka, selisihnya Rp87.500", False, "Kedua harga dijumlahkan. Selisih dicari dengan pengurangan.", "SD5-M-B1-10"),
    ("Boneka, selisihnya Rp3.000", False, "Hanya ribuannya yang dikurangkan (45 − 42 = 3 ribu); 500 pada harga robot terlewat.", "SD5-M-B1-13"),
    ("Boneka, selisihnya Rp3.500", True, "Benar. 42.000 < 45.500, dan 45.500 − 42.000 = 3.500.", ""),
], sulit="Sedang")
cek(5 * 10_000 + 2 * 1_000 == 52_000 and 2 * 10_000 + 5 * 1_000 == 25_000 and 5 * 10_000 + 2 * 100 == 50_200 and 52 * 100 == 5_200)
soal("LT9", 3, "Uang Rp52.000 dapat disusun dari ...", [
    ("2 lembar Rp10.000 dan 5 lembar Rp1.000", False, "Banyak lembarnya tertukar; jumlahnya 25.000. Angka 5 di puluh ribuan berarti 5 lembar sepuluh ribuan.", "SD5-M-B1-04"),
    ("5 lembar Rp10.000 dan 2 lembar Rp1.000", True, "Benar. 50.000 + 2.000 = 52.000.", ""),
    ("5 lembar Rp10.000 dan 2 keping Rp100", False, "Seribuan diganti seratusan; jumlahnya 50.200. Dua lembar seribuan bernilai 2.000.", "SD5-M-B1-05"),
    ("52 keping Rp100", False, "Banyak keping disamakan dengan nilainya; 52 × 100 = 5.200, bukan 52.000.", "SD5-M-B1-08"),
])
CARA_KAKAK = cara_bayar_pas(35_000, {20_000: 1, 10_000: 2, 5_000: 3})
cek(len(CARA_KAKAK) == 3, CARA_KAKAK)
cek(20_000 + 10_000 + 5_000 == 20_000 + 3 * 5_000 == 2 * 10_000 + 3 * 5_000 == 35_000)
soal("LT10", 3, "Kakak berbelanja Rp35.000. Di dompetnya ada 1 lembar Rp20.000, 2 lembar Rp10.000, dan 3 lembar Rp5.000. Ada berapa cara membayar dengan uang pas?", [
    ("1 cara", False, "Berhenti setelah menemukan cara pertama (20.000 + 10.000 + 5.000). Masih ada cara lain.", "SD5-M-B1-17"),
    ("2 cara", False, "Cara tanpa lembar Rp20.000 terlewat: 10.000 + 10.000 + 5.000 + 5.000 + 5.000.", "SD5-M-B1-17"),
    ("3 cara", True, "Benar. 20.000 + 10.000 + 5.000; 20.000 + 5.000 + 5.000 + 5.000; dan 10.000 + 10.000 + 5.000 + 5.000 + 5.000.", ""),
    ("4 cara", False, "Satu cara terhitung dua kali karena urutan lembarnya diubah. Urutan membayar tidak membuat cara baru.", "SD5-M-B1-17"),
], sulit="Sulit", petunjuk="Mulailah dari cara yang memakai lembar Rp20.000, lalu cari cara tanpa lembar itu.")
cek(2 * 20_000 + 10_000 + 5_000 + 1_000 + 500 + 2 * 100 == 56_700)
cek(2 * 20_000 + 10_000 + 5_000 + 500 + 4 * 100 == 55_900)
cek(2 * 20_000 + 10_000 + 5_000 + 1_000 + 500 + 4 * 200 == 57_300)
soal("LT11", 3, "Belanjaan Ibu Lukas Rp56.900. Susunan uang manakah yang pas?", [
    ("2 × Rp20.000, 1 × Rp10.000, 1 × Rp5.000, 1 × Rp1.000, 1 × Rp500, 2 × Rp100", False, "Jumlahnya 56.700, kurang 200. Keping Rp100 yang dibutuhkan ada 4.", "SD5-M-B1-13"),
    ("2 × Rp20.000, 1 × Rp10.000, 1 × Rp5.000, 1 × Rp500, 4 × Rp100", False, "Lembar Rp1.000 terlewat, jadi jumlahnya 55.900, kurang 1.000.", "SD5-M-B1-13"),
    ("2 × Rp20.000, 1 × Rp10.000, 1 × Rp5.000, 1 × Rp1.000, 1 × Rp500, 4 × Rp200", False, "4 keping dianggap 400 apa pun kepingnya. 4 keping Rp200 bernilai 800, jadi jumlahnya 57.300.", "SD5-M-B1-08"),
    ("2 × Rp20.000, 1 × Rp10.000, 1 × Rp5.000, 1 × Rp1.000, 1 × Rp500, 4 × Rp100", True, "Benar. 40.000 + 10.000 + 5.000 + 1.000 + 500 + 400 = 56.900.", ""),
], sulit="Sedang")
cek(67_987 - 13_453 == 54_534 and 67_987 + 13_453 == 81_440 and 67_987 - 14_453 == 53_534)
soal("LT12", 4, "67.987 − 13.453 = ...", [
    ("81.440", False, "Kedua bilangan dijumlahkan. Tanda − berarti dikurangkan.", "SD5-M-B1-10"),
    ("53.534", False, "Satu dipinjam dari ribuan padahal tidak perlu (7 − 3 bisa langsung). Ribuannya 7 − 3 = 4.", "SD5-M-B1-12"),
    ("54.534", True, "Benar. Kurangkan dari kanan: 7 − 3, 8 − 5, 9 − 4, 7 − 3, 6 − 1. Tidak perlu meminjam.", ""),
    ("54.543", False, "Puluhan dan satuan hasilnya tertukar tempat. Satuan 7 − 3 = 4 dan puluhan 8 − 5 = 3.", "SD5-M-B1-04"),
])
cek(61_205 - 28_437 == 32_768 and tanpa_pinjam(61_205, 28_437) == 47_232 and 61_205 + 28_437 == 89_642)
cek(32_768 + 1_000 == 33_768)
soal("LT13", 4, "61.205 − 28.437 = ...", [
    ("32.768", True, "Benar. Meminjam di satuan, puluhan, ratusan, dan ribuan. Periksa: 32.768 + 28.437 = 61.205.", ""),
    ("47.232", False, "Di setiap tempat angka kecil dikurangkan dari angka besar tanpa meminjam (misalnya 7 − 5 di satuan).", "SD5-M-B1-12"),
    ("33.768", False, "Sudah meminjam dari ribuan, tetapi ribuannya tidak dikurangi 1 (1 − 8 dihitung sebagai 11 − 8).", "SD5-M-B1-12"),
    ("89.642", False, "Kedua bilangan dijumlahkan. Tanda − berarti dikurangkan.", "SD5-M-B1-10"),
], sulit="Sedang", petunjuk="Mulailah dari satuan. Bila angka atas lebih kecil, pinjam 1 dari tempat di sebelah kirinya.")
cek(438 * 105 == 45_990 and 438 * 100 == 43_800 and 438 * 5 == 2_190 and 438 * 15 == 6_570)
soal("LT14", 4, "438 × 105 = ...", [
    ("43.800", False, "Baru 438 × 100 yang dihitung. 105 = 100 + 5, jadi 438 × 5 juga harus ditambahkan.", "SD5-M-B1-11"),
    ("6.570", False, "Nol di 105 terlewat sehingga dihitung 438 × 15.", "SD5-M-B1-03"),
    ("2.190", False, "Baru 438 × 5 yang dihitung. 438 × 100 juga harus ditambahkan.", "SD5-M-B1-11"),
    ("45.990", True, "Benar. 438 × 100 + 438 × 5 = 43.800 + 2.190 = 45.990.", ""),
], sulit="Sedang")
cek(2_316 * 32 == 74_112 and 2_316 * 30 == 69_480 and 2_316 * 3 + 2_316 * 2 == 11_580 and 2_316 * 2 == 4_632)
soal("LT15", 4, "2.316 × 32 = ...", [
    ("69.480", False, "Baru 2.316 × 30 yang dihitung. 2.316 × 2 juga harus ditambahkan.", "SD5-M-B1-11"),
    ("74.112", True, "Benar. 2.316 × 30 + 2.316 × 2 = 69.480 + 4.632 = 74.112.", ""),
    ("11.580", False, "Angka 3 di puluhan dikalikan sebagai 3, bukan 30: 6.948 + 4.632. Hasil kali puluhan harus bergeser satu tempat.", "SD5-M-B1-11"),
    ("4.632", False, "Baru 2.316 × 2 yang dihitung. 2.316 × 30 juga harus ditambahkan.", "SD5-M-B1-11"),
], sulit="Sedang")
cek(2 * 18_500 + 12_000 == 49_000 and 18_500 + 12_000 == 30_500 and 2 * (18_500 + 12_000) == 61_000 and 2 * 18_500 - 12_000 == 25_000)
soal("LT16", 5, "Yohana membeli 2 bungkus mangga seharga Rp18.500 per bungkus dan 1 bungkus jeruk seharga Rp12.000. Berapa yang harus ia bayar?", [
    ("Rp30.500", False, "Mangga hanya dihitung satu bungkus. Yohana membeli 2 bungkus: 2 × 18.500 = 37.000.", "SD5-M-B1-13"),
    ("Rp61.000", False, "Jeruk ikut dikali 2, padahal jeruknya hanya 1 bungkus.", "SD5-M-B1-13"),
    ("Rp49.000", True, "Benar. 2 × 18.500 = 37.000, lalu 37.000 + 12.000 = 49.000.", ""),
    ("Rp25.000", False, "Harga jeruk dikurangkan. Semua belanjaan dibayar, jadi dijumlahkan.", "SD5-M-B1-10"),
], sulit="Sedang")
cek(84_000 // 3 == 28_000 and 84_000 * 3 == 252_000 and 28_000 // 10 == 2_800 and 84_000 // 2 == 42_000)
soal("LT17", 5, "Kakak menabung Rp84.000 dan membaginya sama rata ke dalam 3 celengan. Berapa isi setiap celengan?", [
    ("Rp28.000", True, "Benar. 84.000 : 3 = 28.000. Periksa: 3 × 28.000 = 84.000.", ""),
    ("Rp252.000", False, "Tabungan dikali 3. Dibagi sama rata berarti dibagi.", "SD5-M-B1-10"),
    ("Rp42.000", False, "Tabungan dibagi 2, seperti membagi dua. Celengannya ada 3.", "SD5-M-B1-13"),
    ("Rp2.800", False, "Satu 0 hilang dari hasil bagi, sehingga nilainya bergeser satu tempat. Periksa: 3 × 2.800 = 8.400, bukan 84.000.", "SD5-M-B1-18"),
])
cek(75_000 - 48_500 == 26_500 and 75_000 + 48_500 == 123_500 and tanpa_pinjam(75_000, 48_500) == 33_500)
cek(26_500 + 1_000 == 27_500)
soal("LT18", 5, "Rafi memiliki Rp75.000. Ia membeli sepatu seharga Rp48.500. Berapa sisa uangnya?", [
    ("Rp123.500", False, "Kedua bilangan dijumlahkan. Sisa dicari dengan pengurangan.", "SD5-M-B1-10"),
    ("Rp33.500", False, "Di setiap tempat angka kecil dikurangkan dari angka besar tanpa meminjam (misalnya 8 − 5 di ribuan).", "SD5-M-B1-12"),
    ("Rp27.500", False, "Sudah meminjam dari ribuan, tetapi ribuannya tidak dikurangi 1 (5 − 8 dihitung sebagai 15 − 8).", "SD5-M-B1-12"),
    ("Rp26.500", True, "Benar. 75.000 − 48.500 = 26.500. Periksa: 26.500 + 48.500 = 75.000.", ""),
], sulit="Sedang")
cek(4 * 12_500 == 50_000 and 4 * 12_000 + 500 == 48_500 and 4 * 12_000 == 48_000 and 12_500 // 4 == 3_125 and 3 * 2_800 == 8_400)
soal("LT19", 5, "Harga tiket kereta mini Rp12.500 per anak. Berapa harga tiket untuk 4 anak?", [
    ("Rp48.000", False, "Hanya 12.000 yang dikali 4; bagian 500 terlewat. 4 × 500 = 2.000 juga harus ditambahkan.", "SD5-M-B1-11"),
    ("Rp50.000", True, "Benar. 4 × 12.500 = 50.000.", ""),
    ("Rp48.500", False, "12.000 sudah dikali 4, tetapi 500 hanya ditambahkan sekali. Setiap anak membayar 500 itu: 4 × 500 = 2.000.", "SD5-M-B1-11"),
    ("Rp3.125", False, "Harga tiket dibagi 4. Setiap anak membayar Rp12.500, jadi dikali 4.", "SD5-M-B1-10"),
])

# ── Whole-chapter checks.
refs = [s["ref"] for s in S]
cek(len(refs) == len(set(refs)))
cek({p["no"] for p in PELAJARAN} == {s["pel"] for s in S}, "every lesson has questions")
PRE = [s for s in S if s["guna"] == "Pemetaan awal"]
POST = [s for s in S if s["guna"] == "Cek penguasaan"]
LAT = [s for s in S if not s["guna"]]
cek(len(PRE) == 4 and len(POST) == 8 and 12 <= len(LAT) <= 20)
cek(sum(1 for s in POST if s["sulit"] == "Sedang") > len(POST) / 2, "post-test mostly Sedang")
# INV-24: no parallel group holds both a Pemetaan awal and a Cek penguasaan question.
for _k in {s["kelompok"] for s in S if s["kelompok"]}:
    cek(len({s["guna"] for s in S if s["kelompok"] == _k} & {"Pemetaan awal", "Cek penguasaan"}) < 2, _k)
# Answers spread over A-D, no letter holding half.
HURUF = {}
for s in S:
    h = "ABCD"[[b for _, b, _, _ in s["pilihan"]].index(True)]
    HURUF[h] = HURUF.get(h, 0) + 1
cek(set(HURUF) == set("ABCD") and max(HURUF.values()) * 2 <= len(S), HURUF)
# The post-test uses fresh numbers: no 4+ digit number in a post-test question is in a lesson or
# in the book's own exercises and keys (Bab 1, pp. 23-42), and no post-test answer is in the book's
# keys. (An answer may be a number a lesson also shows, e.g. a place value like 7.000.)
BUKU = """26.932 13.578 13.354 15.590 16.667 44.567 88.976 54.675 40.350 25.786 13.456 87.986 56.786
43.217 78.897 89.876 15.500 16.500 17.500 18.500 19.500 30.000 50.000 70.000 90.000 85.350 85.400
85.450 85.500 85.550 76.675 67.765 86.567 86.576 45.867 55.876 13.234 49.000 121.500 47.000 64.000
23.000 4.000 100.000 50.303 33.403 72.135 15.229 38.000 34.000 97.500 76.598 12.456 67.987 13.453
67.032 89.054 54.534 55.566 59.000 55.000 53.000 8.500 27.500 35.000 56.900""".split()
ANGKA = re.compile(r"\d{1,3}(?:\.\d{3})+")
TEKS_PELAJARAN = " ".join(p["isi"] for p in PELAJARAN)
for s in POST:
    benar = next(t for t, b, _, _ in s["pilihan"] if b)
    for n in ANGKA.findall(s["tanya"]):
        cek(n not in BUKU and n not in ANGKA.findall(TEKS_PELAJARAN), f"{s['ref']}: {n} in the question is not fresh")
    for n in ANGKA.findall(benar):
        cek(n not in BUKU, f"{s['ref']}: the answer {n} is in the book's keys")


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
           [[1, p["no"], p["judul"], p["ringkasan"], p["isi"], p["tujuan"], p["bloom"], "", ""] for p in PELAJARAN])
    lembar("Soal", ["Kode soal", "No bab", "No pelajaran", "Jenis soal", "Pertanyaan", "Bacaan", "Petunjuk", "Kegunaan", "Tingkat kesulitan", "Kelompok paralel"],
           [[s["ref"], 1, s["pel"], "Pilihan ganda", s["tanya"], "", s["petunjuk"], s["guna"], s["sulit"], s["kelompok"]] for s in S])
    # Kode miskonsepsi stays empty: no code is registered yet, and an unknown code fails the upload.
    lembar("Pilihan", ["Kode soal", "Pilihan", "Teks pilihan", "Benar", "Alasan", "Kode miskonsepsi"],
           [[s["ref"], "ABCD"[i], t, "Ya" if b else "Tidak", alasan, ""] for s in S for i, (t, b, alasan, _) in enumerate(s["pilihan"])])
    wb.save(path)


def tulis_miskonsepsi(path):
    pakai = {k: [] for k in MISKONSEPSI}
    for s in S:
        for i, (_, _, _, kode) in enumerate(s["pilihan"]):
            if kode:
                pakai[kode].append(f"{s['ref']}:{'ABCD'[i]}")
    for k, v in pakai.items():
        cek(v, f"{k} is proposed but no distractor uses it")
    with open(path, "w", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        w.writerow(["code", "label", "description", "remediation", "questions"])
        for k, (label, desk, rem) in MISKONSEPSI.items():
            w.writerow([k, label, desk, rem, ";".join(pakai[k])])


if __name__ == "__main__":
    here = os.path.dirname(os.path.abspath(__file__))
    tulis(os.path.join(here, "SD5-Matematika-Bab1.xlsx"))
    tulis_miskonsepsi(os.path.join(here, "SD5-Matematika-Bab1-miskonsepsi.csv"))
    halaman = sum(p["isi"].count("## ") for p in PELAJARAN)
    print(f"SD5-Matematika-Bab1.xlsx: lessons {len(PELAJARAN)} ({halaman} pages), questions {len(S)} "
          f"(pre {len(PRE)}, post {len(POST)}, practice {len(LAT)}), answers "
          + " ".join(f"{h}={HURUF[h]}" for h in "ABCD"))
    print(f"SD5-Matematika-Bab1-miskonsepsi.csv: {len(MISKONSEPSI)} codes")
    print(f"assertions passed: {CEK[0]}")
