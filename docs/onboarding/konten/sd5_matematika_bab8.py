# SD Kelas 5, Matematika, Bab 8 "Data", as a PINTAR lesson workbook in the D-007 template
# (sheets Kursus, Bab, Pelajaran, Soal, Pilihan; the column contract is KOLOM in
# src/lib/unggah-kontrak.ts). Built the way Bab 1-7 were (all passed).
#
# Source: Buku Panduan Guru Matematika untuk SD/MI Kelas V (Meita Fitrianawati, Ika Surtiani,
# Ait Istiandaru; Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi, 2022), Bab 8,
# pp. 345-394. Lessons follow subbab A-C: A (mengumpulkan data) in two lessons, B (piktogram) in
# two, C (diagram batang) in two.
#
# The player shows each line of a lesson as text, and draws no charts. So a chart is written as
# text lines the generator builds from the data, never typed by hand:
#   - `piktogram()` writes a row of symbols: ● a whole picture, ◕ ◐ ◔ three quarters, a half and a
#     quarter of one (the book's own parts, p. 362), and asserts the row is worth the data;
#   - `batang()` writes a bar of █ blocks, one block per unit;
#   - `turus()` writes tally marks in fives ("||||/" is four upright and one slanted, p. 354).
# Every number a question uses, and every slip a distractor names, is computed and asserted.
#
# Text lessons only (D-050). The workbook's "Kode miskonsepsi" column stays empty; the proposed
# codes go to SD5-Matematika-Bab8-miskonsepsi.csv.
#
# Run: python3 docs/onboarding/konten/sd5_matematika_bab8.py
import csv
import os
import re
from fractions import Fraction

from openpyxl import Workbook
from openpyxl.styles import Alignment, Font

CEK = [0]


def cek(syarat, pesan=""):
    """An assertion that is counted, so the hand-off can say how many passed."""
    assert syarat, pesan
    CEK[0] += 1


BAGIAN = {Fraction(0): "", Fraction(1, 4): "◔", Fraction(1, 2): "◐", Fraction(3, 4): "◕"}
NAMA_BAGIAN = {Fraction(1, 4): "seperempat gambar", Fraction(1, 2): "setengah gambar", Fraction(3, 4): "tiga perempat gambar"}


def gambar(nilai, kunci):
    """How many whole pictures, and which part of one more, show `nilai` when one picture is
    worth `kunci`. Only the book's parts (a quarter, a half, three quarters) are allowed."""
    utuh, sisa = divmod(nilai, kunci)
    bagian = Fraction(sisa, kunci)
    cek(bagian in BAGIAN, f"{nilai} with a key of {kunci} needs a part the book does not use")
    return utuh, bagian


def nilai_gambar(utuh, bagian, kunci):
    return utuh * kunci + bagian * kunci


def piktogram(nilai, kunci):
    utuh, bagian = gambar(nilai, kunci)
    baris = " ".join(["●"] * utuh + ([BAGIAN[bagian]] if bagian else []))
    cek(nilai_gambar(baris.count("●"), sum(Fraction(k) for k, v in BAGIAN.items() if v and v in baris), kunci) == nilai)
    return baris


def batang(n):
    return "█" * n + f" {n}"


def turus(n):
    lima, sisa = divmod(n, 5)
    teks = " ".join(["||||/"] * lima + (["|" * sisa] if sisa else []))
    cek(baca_turus(teks) == n)
    return teks


def baca_turus(teks):
    return sum(5 if kelompok == "||||/" else len(kelompok) for kelompok in teks.split())


# ── The book's data and keys (checked; see handoff/LANA-08.md for the ones that are not right) ──
DONAT = {"Senin": (3, 6, 4, 4), "Selasa": (4, 4, 6, 3), "Rabu": (5, 3, 4, 2), "Kamis": (5, 4, 5, 1),
         "Jumat": (6, 3, 3, 0), "Sabtu": (7, 5, 4, 0)}                                          # p. 351
KACANG = [v[3] for v in DONAT.values()]
COKELAT = [v[0] for v in DONAT.values()]
cek(KACANG == sorted(KACANG, reverse=True) and COKELAT == sorted(COKELAT))
SAYURAN = {"Bayam": 7, "Kangkung": 6, "Wortel": 8, "Tomat": 6, "Buncis": 4, "Sawi": 5, "Kol": 3}  # p. 353
cek(max(SAYURAN, key=SAYURAN.get) == "Wortel" and min(SAYURAN, key=SAYURAN.get) == "Kol" and SAYURAN["Bayam"] > SAYURAN["Tomat"])
cek(sum(SAYURAN.values()) == 39)
# BOOK ERROR (p. 354): "ada 8 anak yang menyukai sayuran bayam"; the table (turus and frekuensi)
# says 7. Wortel is the 8.
cek(SAYURAN["Bayam"] == 7 != 8 == SAYURAN["Wortel"])
NILAI = {40: 2, 50: 1, 60: 5, 70: 6, 80: 7, 90: 3, 100: 1}                                   # p. 356
cek(max(NILAI) == 100 and NILAI[100] == 1 and NILAI[40] + NILAI[50] + NILAI[60] == 2 + 1 + 5 == 8 and sum(NILAI.values()) == 25)
APEM = {"Senin": 40, "Selasa": 35, "Rabu": 30, "Kamis": 37, "Jumat": 27, "Sabtu": 29}           # pp. 360-361, key 4
cek([gambar(v, 4) for v in APEM.values()] == [(10, 0), (8, Fraction(3, 4)), (7, Fraction(1, 2)), (9, Fraction(1, 4)),
                                              (6, Fraction(3, 4)), (7, Fraction(1, 4))])
cek(sum(APEM.values()) == 198 and 300 * 198 == 59400 and 9 * 4 == 36 != 37)
TOMAT_GAMBAR = [5, 7, 10, 6, 2]                                                                # p. 363, key 2 kg
TOMAT = [2 * g for g in TOMAT_GAMBAR]
cek(TOMAT == [10, 14, 20, 12, 4] and sum(TOMAT) == 60 and TOMAT[3] - TOMAT[2] == TOMAT[4] - TOMAT[3] == -8
    and max(TOMAT) - min(TOMAT) == 16 == 2 * (max(TOMAT_GAMBAR) - min(TOMAT_GAMBAR)))
BERANGKAT = {"Jalan kaki": 6, "Naik sepeda": 8, "Angkutan umum": 4, "Diantar orang tua": 6}   # p. 365
MEDALI = {2013: 65, 2015: 47, 2017: 38, 2019: 72, 2021: 69}                                    # p. 368 (read off the bars, lines of 4)
cek(MEDALI[2013] - MEDALI[2015] == 18 and MEDALI[2015] - MEDALI[2017] == 9 and 72 + 84 + 111 == 267
    and max(MEDALI, key=MEDALI.get) == 2019 and min(MEDALI, key=MEDALI.get) == 2017 and 20 // 5 == 4 and (36 + 40) // 2 == 38)
LELE = {"Kolam 1": 32, "Kolam 2": 28, "Kolam 3": 21, "Kolam 4": 16, "Kolam 5": 25}              # p. 372
cek(sum(LELE.values()) == 122 and LELE["Kolam 1"] + LELE["Kolam 4"] == 48 > Fraction(122, 4) == Fraction(61, 2)
    and 122 * 22000 == 2684000 and max(LELE, key=LELE.get) == "Kolam 1")
SISWA = {2017: (14, 10), 2018: (11, 13), 2019: (16, 12), 2020: (12, 16), 2021: (15, 14)}       # p. 377
cek(SISWA[2019][0] - SISWA[2019][1] == 4 and all(l != p for l, p in SISWA.values()) and sum(SISWA[2021]) == 29
    and max(SISWA, key=lambda t: sum(SISWA[t])) == 2021 and [t for t, (l, p) in SISWA.items() if l > p] == [2017, 2019, 2021]
    and SISWA[2017][0] == SISWA[2021][1] and SISWA[2019][1] == SISWA[2020][0] and SISWA[2019][0] == SISWA[2020][1])
KALORI = {"Nasi putih": 130, "Nasi jagung": 150, "Daging sapi": 290, "Daging ayam": 260, "Tahu goreng": 270,
          "Tempe goreng": 240, "Sayuran hijau": 60}                                            # p. 380, per 100 g
cek(max(KALORI, key=KALORI.get) == "Daging sapi" and min(KALORI, key=KALORI.get) == "Sayuran hijau")
cek(KALORI["Nasi putih"] // 2 + KALORI["Daging ayam"] // 2 + KALORI["Sayuran hijau"] == 65 + 130 + 60 == 255)
cek(3 * KALORI["Nasi putih"] + 2 * KALORI["Daging ayam"] + KALORI["Sayuran hijau"] + 300 + 350 == 1620)
PERPUSTAKAAN = {"Senin": 42, "Selasa": 60, "Rabu": 50, "Kamis": 36, "Jumat": 24, "Sabtu": 48}  # p. 382
cek(sorted(PERPUSTAKAAN, key=PERPUSTAKAAN.get) == ["Jumat", "Kamis", "Senin", "Sabtu", "Rabu", "Selasa"]
    and PERPUSTAKAAN["Kamis"] - PERPUSTAKAAN["Jumat"] == 12 and all(gambar(v, 4) for v in PERPUSTAKAAN.values()))
# Uji Kompetensi 2 (pp. 384-388): the pictogram rows are 4¼, 6, 5¼, 4½ and 5¾ pictures; with the
# key the answers use (one picture is Rp4.000, since week 2 is Rp24.000 in 6 pictures) that is
# 17, 24, 21, 18 and 23 thousand, total 103 thousand, as the key says.
TABUNGAN = [nilai_gambar(u, b, 4000) for u, b in [(4, Fraction(1, 4)), (6, 0), (5, Fraction(1, 4)), (4, Fraction(1, 2)), (5, Fraction(3, 4))]]
cek(TABUNGAN == [17000, 24000, 21000, 18000, 23000] and sum(TABUNGAN) == 103000 and TABUNGAN[1] - TABUNGAN[4] == 1000
    and 150000 - 103000 == 47000)
# BOOK ERROR: both bar diagrams (A, the keyed one, and B) show week 3 at Rp20.000, not the
# pictogram's Rp21.000, so diagram A adds up to 102 thousand. Diagram B also has week 2 at
# Rp21.000 (the difference the key names).
DIAGRAM_A = [17000, 24000, 20000, 18000, 23000]
cek(sum(DIAGRAM_A) == 102000 != sum(TABUNGAN) and DIAGRAM_A[2] != TABUNGAN[2])
INTERNET = {"13-17": (570, 680), "18-24": (1590, 1480), "25-34": (1930, 1480), "35-44": (740, 570),
            "45-54": (320, 240), "55-64": (100, 70), "65+": (150, 90)}                           # p. 386, hundredths of a percent
cek([sum(v) for v in INTERNET.values()] == [1250, 3070, 3410, 1310, 560, 170, 240])
cek(sorted(INTERNET, key=lambda k: sum(INTERNET[k])) == ["55-64", "65+", "45-54", "13-17", "35-44", "18-24", "25-34"]
    and 3410 - 3070 == 340 and min(p for _, p in INTERNET.values()) == 70)
# Pengayaan (p. 393): the menu key lists nasi goreng at 300 kkal; Tabel 8.11 says 330. With the
# table's 330 the day is 1.523 kkal, not 1.493. The protein total, 70,7 g, is right.
MENU = [300, 100, 120, 60, 204, 100, 25, 105, 204, 70, 150, 55]
PROTEIN = [125, 70, 80, 12, 40, 25, 20, 15, 40, 15, 265, 0]
cek(sum(MENU) == 1493 and sum(MENU) - 300 + 330 == 1523 and sum(PROTEIN) == 707 and 2050 - 1493 == 557)

# ── Lesson examples ─────────────────────────────────────────────────────────────
cek(turus(7) == "||||/ ||" and turus(11) == "||||/ ||||/ |" and baca_turus("||||/ ||||/ |") == 11)
cek(NILAI[80] + NILAI[90] + NILAI[100] == 11 and max(NILAI, key=NILAI.get) == 80)
cek(TOMAT[1] + TOMAT[3] == 26)

SUMBER = ("_Diadaptasi dari Buku Panduan Guru Matematika untuk SD/MI Kelas V, Kementerian Pendidikan, "
          "Kebudayaan, Riset, dan Teknologi, 2022, Bab 8._")

KURSUS = {
    "Judul kursus*": "Matematika Kelas 5 · Bab 8: Data",
    "Mata pelajaran*": "Matematika",
    "Jenjang*": "SD",
    "Kelas*": "Kelas 5",
    "Konteks": "Akademik",
}

BAB = [(1, "Data")]


# The player shows each line as a paragraph and collapses runs of spaces, so labels cannot be
# padded into a column. A bar therefore starts the line (every bar begins at the left edge, so
# lengths compare), and its label follows. A pictogram row keeps its label first, "Senin: ● ●".
def baris_pikto(data, kunci):
    return "\n".join(f"{k}: {piktogram(v, kunci)}" for k, v in data.items())


def baris_batang(data):
    return "\n".join(f"{batang(v)} ({k})" for k, v in data.items())


PIKTO_APEM = baris_pikto(APEM, 4)
PIKTO_TOMAT = baris_pikto({f"Minggu ke-{i + 1}": v for i, v in enumerate(TOMAT)}, 2)
BATANG_BERANGKAT = baris_batang(BERANGKAT)
BATANG_GANDA = "\n".join(f"{batang(l)} ({t}, laki-laki)\n{batang(p)} ({t}, perempuan)" for t, (l, p) in SISWA.items())
TURUS_SAYURAN = "\n".join(f"- {k}: {turus(v)}  ({v})" for k, v in SAYURAN.items())
cek(PIKTO_APEM.count("●") == sum(v // 4 for v in APEM.values()) and "◕" in PIKTO_APEM and "◔" in PIKTO_APEM)

PELAJARAN = [
    dict(no=1, judul="Mengumpulkan Data dengan Turus",
         ringkasan="Data dicatat dengan turus agar tidak ada yang terlewat atau terhitung dua kali; banyaknya setiap data disebut frekuensi.",
         tujuan="Kalian dapat mengumpulkan data sederhana dari sekitarnya, mencatatnya dengan turus, dan menentukan frekuensinya.",
         bloom="Menerapkan",
         isi=f"""## Data membantu memutuskan

Anggi berjualan donat. Ia mencatat banyak donat yang terjual setiap hari:

| Hari | Cokelat | Keju | Stroberi | Kacang |
|---|---|---|---|---|
""" + "\n".join(f"| {h} | {c} | {k} | {s} | {n} |" for h, (c, k, s, n) in DONAT.items()) + f"""

Dari catatan itu terlihat bahwa donat kacang makin sedikit terjual, dari 4 pada hari Senin sampai tidak ada yang terjual pada hari Jumat dan Sabtu. Donat cokelat justru makin banyak terjual.

Catatan seperti ini disebut **data**. Data membantu Anggi memutuskan: membuat lebih banyak donat cokelat dan lebih sedikit donat kacang.

## Mencatat dengan turus

Kelas V SD Pancasila ditanya sayuran kesukaannya. Setiap jawaban dicatat dengan satu garis. Garis-garis ini disebut **turus**.

Turus dibuat dalam kelompok lima: empat garis tegak, lalu garis kelima dibuat **miring** melintang. Dengan begitu kita dapat menghitung lima-lima, tanpa menghitung garis satu per satu.

Contoh: ||||/ || berarti satu kelompok lima dan dua garis lagi, yaitu 5 + 2 = **7**.

## Frekuensi

Banyaknya suatu data muncul disebut **frekuensi**. Hasil pencatatan sayuran kesukaan:

{TURUS_SAYURAN}

Frekuensi bayam 7: ada 7 anak yang menyukai bayam. Perhatikan bedanya: "bayam" adalah datanya, 7 adalah frekuensinya.

## Agar tidak ada yang terlewat

Kesalahan yang paling sering terjadi saat mencatat adalah ada jawaban yang terlewat atau terhitung dua kali. Caranya menghindari:

1. Coret setiap jawaban yang sudah dibuatkan turus.
2. Setelah selesai, jumlahkan semua frekuensi.
3. Bandingkan dengan banyak anak yang ditanya. Di sini 7 + 6 + 8 + 6 + 4 + 5 + 3 = 39, jadi harus ada 39 jawaban.

**Coba:** turus ||||/ ||||/ | menunjukkan frekuensi berapa?
_Periksa: 5 + 5 + 1 = 11._

{SUMBER}"""),
    dict(no=2, judul="Membaca Tabel Frekuensi",
         ringkasan="Tabel frekuensi memuat daftar data dan frekuensinya; dari tabel itu kita dapat mencari yang terbanyak, yang tersedikit, dan jumlahnya.",
         tujuan="Kalian dapat menyajikan data dalam tabel frekuensi dan membaca informasi dari tabel itu.",
         bloom="Menganalisis",
         isi=f"""## Tabel frekuensi

**Tabel frekuensi** adalah tabel yang memuat daftar semua data yang diamati beserta frekuensinya.

| Nama sayuran | Frekuensi |
|---|---|
""" + "\n".join(f"| {k} | {v} |" for k, v in SAYURAN.items()) + f"""

Membaca data dari tabel lebih mudah daripada dari catatan yang masih berupa daftar panjang.

## Memeriksa pernyataan

Tiga anak membaca tabel sayuran itu:

- Nisa: "Sayuran yang paling banyak disukai adalah wortel." Tepat, frekuensi wortel 8, yang terbesar.
- Lukas: "Yang menyukai tomat lebih banyak daripada yang menyukai bayam." Kurang tepat: tomat 6, bayam 7.
- Asep: "Sayuran yang paling sedikit disukai adalah buncis." Kurang tepat: buncis 4, tetapi kol hanya 3.

Selalu periksa pernyataan dengan angka pada tabel.

## Nilai dan frekuensi

Tabel ini memuat nilai ulangan satu kelas:

| Nilai | Frekuensi |
|---|---|
""" + "\n".join(f"| {k} | {v} |" for k, v in NILAI.items()) + f"""

Kolom kiri adalah **nilai** (datanya). Kolom kanan adalah **frekuensi** (banyak siswa yang mendapat nilai itu).

- Nilai tertinggi adalah **100**, diperoleh oleh **1** siswa.
- Nilai yang paling banyak diperoleh adalah **80**, oleh 7 siswa. Jawabannya 80 (nilainya), bukan 7.

## Menghitung dari tabel

- Banyak siswa seluruhnya: jumlahkan frekuensinya, 2 + 1 + 5 + 6 + 7 + 3 + 1 = **25** siswa.
- Bila siswa yang nilainya kurang dari 70 mengikuti remedi, banyaknya 2 + 1 + 5 = **8** siswa. Nilai 70 tidak ikut, karena 70 tidak kurang dari 70.

**Coba:** berapa siswa yang nilainya 80 atau lebih?
_Periksa: 7 + 3 + 1 = 11 siswa._

{SUMBER}"""),
    dict(no=3, judul="Membuat Piktogram",
         ringkasan="Piktogram menyajikan data dengan gambar; kunci menyatakan nilai satu gambar, dan bagian gambar mewakili bagian nilai itu.",
         tujuan="Kalian dapat membuat piktogram dengan kunci yang tepat, termasuk memakai bagian gambar.",
         bloom="Menerapkan",
         isi=f"""## Satu gambar mewakili beberapa

Piktogram menyajikan data dengan gambar. Satu gambar tidak harus mewakili satu benda. Bila datanya besar, satu gambar dapat mewakili 2, 4, 10, atau lebih.

Nilai satu gambar ditulis pada **kunci**. Tanpa kunci, piktogram tidak dapat dibaca.

## Menentukan banyak gambar

Penjualan kue apem selama enam hari: Senin 40, Selasa 35, Rabu 30, Kamis 37, Jumat 27, Sabtu 29.

Kuncinya: ● mewakili **4 kue apem**.

Senin: 40 : 4 = **10 gambar** utuh.

## Bagian gambar

Bila pembagiannya bersisa, sisanya digambar sebagai bagian gambar:

- Selasa 35: 8 gambar utuh = 32, sisa 3 dari 4, jadi **tiga perempat gambar** (◕).
- Rabu 30: 7 gambar utuh = 28, sisa 2 dari 4, jadi **setengah gambar** (◐).
- Kamis 37: 9 gambar utuh = 36, sisa 1 dari 4, jadi **seperempat gambar** (◔).

Bila Kamis digambar 9 gambar utuh saja, piktogram itu hanya menunjukkan 36 kue, kurang satu.

## Piktogram penjualan kue apem

{PIKTO_APEM}

Kunci: ● mewakili 4 kue apem. ◕ = 3 kue, ◐ = 2 kue, ◔ = 1 kue.

## Yang harus diperhatikan

- Piktogram memerlukan **judul**, **keterangan** setiap baris, dan **kunci**.
- Semua gambar dibuat **sama besar**, karena mewakili nilai yang sama. Gambar yang lebih besar akan tampak seperti nilai yang lebih banyak.
- Pilih kunci yang memudahkan. Untuk 40 kue, kunci 4 memberi 10 gambar; kunci 1 akan memberi 40 gambar.

**Coba:** berapa banyak kue apem yang terjual selama enam hari?
_Periksa: 40 + 35 + 30 + 37 + 27 + 29 = 198 kue._

{SUMBER}"""),
    dict(no=4, judul="Membaca dan Menganalisis Piktogram",
         ringkasan="Untuk membaca piktogram, lihat kuncinya dahulu, lalu kalikan banyak gambar dengan nilai satu gambar.",
         tujuan="Kalian dapat membaca data dari piktogram dan menganalisis kenaikan, penurunan, jumlah, dan selisihnya.",
         bloom="Menganalisis",
         isi=f"""## Lihat kuncinya dahulu

Piktogram hasil panen tomat Pak Chandra selama lima minggu:

{PIKTO_TOMAT}

Kunci: ● mewakili **2 kg** tomat.

Minggu ke-1 ada 5 gambar. Hasilnya bukan 5 kg, tetapi 5 × 2 kg = **10 kg**.

## Membaca setiap baris

| Minggu | Banyak gambar | Hasil panen |
|---|---|---|
""" + "\n".join(f"| {i + 1} | {g} | {g} × 2 = {2 * g} kg |" for i, g in enumerate(TOMAT_GAMBAR)) + f"""

Jumlah hasil panen selama lima minggu: 10 + 14 + 20 + 12 + 4 = **60 kg**.

## Naik dan turun

- Minggu ke-2 naik 4 kg (dari 10 ke 14), minggu ke-3 naik 6 kg (dari 14 ke 20).
- Minggu ke-4 turun 8 kg (dari 20 ke 12), minggu ke-5 turun lagi 8 kg (dari 12 ke 4).

Kenaikan dan penurunan adalah **selisih** dua minggu yang berurutan, bukan hasil minggu itu sendiri.

## Selisih tertinggi dan terendah

Hasil tertinggi 20 kg (minggu ke-3), terendah 4 kg (minggu ke-5). Selisihnya 20 − 4 = **16 kg**.

Cara lain: selisih banyak gambarnya 10 − 2 = 8 gambar, lalu 8 × 2 kg = 16 kg. Kedua cara memberi hasil yang sama.

**Coba:** berapa hasil panen minggu ke-2 dan minggu ke-4 bersama-sama?
_Periksa: 14 + 12 = 26 kg._

{SUMBER}"""),
    dict(no=5, judul="Diagram Batang dan Skalanya",
         ringkasan="Diagram batang menyajikan data dengan batang; nilainya dibaca dari skala pada sumbu, jadi nilai setiap langkah skala harus diketahui.",
         tujuan="Kalian dapat membuat dan membaca diagram batang vertikal dan horizontal dengan memperhatikan skalanya.",
         bloom="Menganalisis",
         isi=f"""## Diagram batang

Cara siswa kelas V SD Pancasila berangkat ke sekolah, sebagai diagram batang (setiap █ mewakili 1 siswa):

{BATANG_BERANGKAT}

Batang yang paling panjang menunjukkan data yang paling banyak: **naik sepeda**. Untuk mencari yang terbanyak atau tersedikit, cukup bandingkan panjang batangnya.

Bila batangnya berdiri tegak, diagramnya disebut **diagram batang vertikal**. Bila batangnya mendatar, seperti di atas, disebut **diagram batang horizontal**. Datanya sama; hanya arah batangnya yang berbeda.

## Skala

Pada sumbu diagram batang ada angka-angka **skala**. Angka ditulis tepat pada garisnya, bukan di antara dua garis, dan jarak antargaris selalu sama.

Diagram perolehan medali emas Indonesia di SEA Games memakai angka 0, 20, 40, 60, 80. Di antara dua angka ada 4 garis tipis, jadi dari 0 ke 20 ada 5 langkah. Setiap langkah bernilai 20 : 5 = **4** medali.

Batang tahun 2017 berhenti tepat di tengah antara garis 36 dan garis 40. Nilainya **38**.

## Membaca diagram medali

Perolehan medali emas: 2013 sebanyak 65, 2015 sebanyak 47, 2017 sebanyak 38, 2019 sebanyak 72, 2021 sebanyak 69.

- Paling banyak pada tahun 2019, paling sedikit pada tahun 2017.
- Dari 2013 ke 2015 turun 65 − 47 = 18 medali; dari 2015 ke 2017 turun 47 − 38 = 9 medali.

## Diagram batang horizontal

Hasil panen lele Pak Bajuri: kolam 1 sebanyak 32 kg, kolam 2 sebanyak 28 kg, kolam 3 sebanyak 21 kg, kolam 4 sebanyak 16 kg, kolam 5 sebanyak 25 kg.

- Batang terpanjang: kolam 1.
- Jumlah seluruhnya: 32 + 28 + 21 + 16 + 25 = **122 kg**.
- Seperempat dari jumlah itu: 122 : 4 = 30,5 kg. Kolam 1 dan kolam 4 bersama-sama menghasilkan 32 + 16 = 48 kg, lebih dari seperempat hasil panen.

## Kesalahan yang sering terjadi

- Angka skala ditulis di antara garis, sehingga nilainya terbaca meleset.
- Jarak skala tidak sama, misalnya angka pada sumbu langsung ditulis 4, 6, 7, 8 mengikuti datanya.
- Diagram tanpa judul dan tanpa keterangan pada sumbu-sumbunya.

{SUMBER}"""),
    dict(no=6, judul="Diagram Batang Ganda dan Membandingkan Diagram",
         ringkasan="Dua diagram hanya dapat dibandingkan dari tinggi batangnya bila skalanya sama; diagram batang ganda menyajikan dua data berdampingan dengan satu skala.",
         tujuan="Kalian dapat membandingkan data pada dua diagram batang dengan memperhatikan skala dan membaca diagram batang ganda.",
         bloom="Mengevaluasi",
         isi=f"""## Tinggi batang saja belum cukup

Pak Guru menunjukkan dua diagram: banyak siswa laki-laki dan banyak siswa perempuan kelas V dari tahun 2017 sampai 2021. Asep berkata, "Setiap tahun siswa perempuan lebih banyak, karena batangnya lebih tinggi."

Perhatikan skalanya. Diagram siswa laki-laki memakai angka 0, 10, 20, 30, sedangkan diagram siswa perempuan memakai angka 0, 2, 4, sampai 18. Skalanya berbeda, jadi tinggi batang kedua diagram **tidak dapat langsung dibandingkan**.

## Data sebenarnya

| Tahun | Laki-laki | Perempuan |
|---|---|---|
""" + "\n".join(f"| {t} | {l} | {p} |" for t, (l, p) in SISWA.items()) + f"""

Pada tahun 2017, 2019, dan 2021 siswa laki-laki justru lebih banyak. Pendapat Asep kurang tepat.

## Diagram batang ganda

Kedua data dapat digabung dalam satu diagram dengan **satu skala**. Batang laki-laki dan perempuan setiap tahun diletakkan berdampingan (setiap █ mewakili 1 siswa):

{BATANG_GANDA}

Sekarang kedua batang dapat langsung dibandingkan.

## Membaca diagram batang ganda

- Selisih laki-laki dan perempuan tahun 2019: 16 − 12 = **4** siswa.
- Tidak ada tahun yang banyak siswa laki-lakinya sama dengan siswa perempuan.
- Jumlah siswa terbanyak pada tahun 2021: 15 + 14 = **29** siswa.

## Kapan tidak digabung

Dua data sebaiknya tidak digabung bila nilainya berbeda sangat jauh. Misalnya siswa laki-laki kelas V satu kecamatan ratusan, sedangkan siswa perempuan satu sekolah hanya belasan. Batang yang belasan akan menjadi sangat pendek dan sulit dibaca.

## Rangkuman Bab 8

- Data dicatat dengan turus; banyaknya suatu data muncul disebut frekuensi.
- Tabel frekuensi: daftar data dan frekuensinya. Bedakan nilai data dan frekuensinya.
- Piktogram: lihat kuncinya dahulu; bagian gambar mewakili bagian nilai; gambar dibuat sama besar.
- Diagram batang: perhatikan nilai setiap langkah skala.
- Dua diagram dibandingkan dari tinggi batangnya hanya bila skalanya sama.

{SUMBER}"""),
]

for _p in PELAJARAN:
    cek(3 <= _p["isi"].count("\n## ") + _p["isi"].startswith("## ") <= 6, f"lesson {_p['no']}: 3-6 pages")
    cek(_p["isi"].rstrip().endswith(SUMBER), f"lesson {_p['no']}: attribution last")
cek(sum(SAYURAN.values()) == 7 + 6 + 8 + 6 + 4 + 5 + 3 and sum(NILAI.values()) == 25 and sum(TOMAT) == 60)
cek(sum(LELE.values()) == 32 + 28 + 21 + 16 + 25 and 65 - 47 == 18 and 47 - 38 == 9 and 16 - 12 == 4)

# ── Misconceptions. 01-09 are the book's own Miskonsepsi (pp. 356, 362, 378-379); the rest come
# from this chapter's distractors.
MISKONSEPSI = {
    "SD5-M-B8-01": ("Data terlewat atau terhitung dua kali",
                    "Saat merekap data, ada hasil pengamatan yang tidak tercatat atau dicatat dua kali, sehingga frekuensi atau jumlahnya tidak cocok.",
                    "Minta murid mencoret setiap data yang sudah dibuatkan turus, lalu mencocokkan jumlah frekuensi dengan banyak data."),
    "SD5-M-B8-02": ("Kunci piktogram diabaikan",
                    "Banyak gambar dibaca sebagai nilai data, tanpa dikalikan dengan nilai satu gambar pada kunci.",
                    "Minta murid membaca kunci dengan suara keras sebelum membaca baris mana pun, lalu menulis perkaliannya."),
    "SD5-M-B8-03": ("Bagian gambar keliru",
                    "Bagian gambar (seperempat, setengah, tiga perempat) dihitung sebagai satu gambar penuh, diabaikan, atau dibuat dari sisa yang tidak sesuai.",
                    "Hitung bersama: setengah gambar mewakili setengah dari nilai kunci. Pakai kunci 4 agar setiap bagian bernilai bilangan bulat."),
    "SD5-M-B8-04": ("Satu gambar dianggap mewakili satu",
                    "Satu gambar dianggap harus mewakili tepat satu benda, sehingga piktogram yang dibuat memuat terlalu banyak gambar.",
                    "Bandingkan piktogram 40 gambar dengan piktogram 10 gambar berkunci 4 untuk data yang sama."),
    "SD5-M-B8-05": ("Ukuran gambar tidak sama",
                    "Gambar-gambar yang mewakili nilai yang sama dibuat berbeda besar, sehingga piktogram menyesatkan pembaca.",
                    "Tunjukkan dua baris yang sama nilainya tetapi berbeda ukuran gambarnya, lalu tanyakan mana yang tampak lebih banyak."),
    "SD5-M-B8-06": ("Nilai skala keliru dibaca",
                    "Nilai satu langkah skala dianggap 1, atau ujung batang di antara dua garis dibaca ke garis terdekat.",
                    "Minta murid menghitung dahulu nilai satu langkah: selisih dua angka dibagi banyak langkah di antaranya."),
    "SD5-M-B8-07": ("Skala tidak tepat saat membuat diagram",
                    "Jarak skala tidak sama, angka skala ditulis mengikuti data, atau dua data yang nilainya berbeda sangat jauh digabung dalam satu diagram.",
                    "Pakai kertas berpetak: setiap petak satu langkah yang sama nilainya, dan angka ditulis tepat pada garis."),
    "SD5-M-B8-08": ("Hanya tinggi batang yang dibandingkan",
                    "Dua diagram dengan skala berbeda dibandingkan hanya dari tinggi batangnya.",
                    "Minta murid menuliskan nilai setiap batang dari skalanya masing-masing sebelum membandingkan."),
    "SD5-M-B8-09": ("Bagian penting diagram dilupakan",
                    "Judul, keterangan sumbu, atau kunci tidak dianggap perlu, sehingga diagram tidak dapat dibaca orang lain.",
                    "Minta teman membaca diagram tanpa penjelasan; tanyakan bagian mana yang membuatnya bingung."),
    "SD5-M-B8-10": ("Jawaban bukan yang ditanyakan",
                    "Jumlah, selisih, atau satu nilai tertukar dengan yang ditanyakan, atau ada data yang terlewat dalam hitungan.",
                    "Minta murid menggarisbawahi kata tanya (jumlah, selisih, kenaikan, terbanyak) sebelum menghitung."),
    "SD5-M-B8-11": ("Turus keliru dihitung",
                    "Satu kelompok turus dihitung 4 (garis miringnya terlewat), atau setiap kelompok dihitung 1.",
                    "Bersama-sama buat turus 1 sampai 10 sambil menghitung; tunjukkan bahwa garis miring adalah yang kelima."),
    "SD5-M-B8-12": ("Terbanyak dan tersedikit tertukar",
                    "Data yang paling sedikit (batang terpendek) dipilih saat yang ditanyakan paling banyak, atau sebaliknya.",
                    "Minta murid menunjuk batang terpanjang dan terpendek dahulu, lalu membaca kembali pertanyaannya."),
    "SD5-M-B8-13": ("Nilai data dan frekuensi tertukar",
                    "Frekuensi diberikan saat yang ditanyakan nilai datanya, atau nilai data dijumlahkan seolah-olah frekuensi.",
                    "Tunjuk kedua kolom tabel: kiri adalah datanya, kanan adalah berapa kali data itu muncul."),
}

S = []


def soal(ref, pel, tanya, jawab, pilihan, guna="", sulit="Mudah", petunjuk=""):
    """`pilihan` lists the correct option first; `jawab` is the letter it is shown at."""
    cek(len(pilihan) == 4 and pilihan[0][1] and not any(b for _, b, _, _ in pilihan[1:]), ref)
    for teks, benar, alasan, kode in pilihan:
        cek(alasan.strip() != "", f"{ref}: every option has an Alasan")
        cek((kode == "") == benar, f"{ref}: a code on every distractor, none on the answer ({teks})")
        cek(kode == "" or kode in MISKONSEPSI, f"{ref}: unknown code {kode}")
    cek(len({t for t, *_ in pilihan}) == 4, f"{ref}: four different options")
    angka = [re.fullmatch(r"(Rp)?(\d+(?:[.,]\d+)?)( [a-z]+)?", t) for t, *_ in pilihan]
    if all(angka):   # a question that asks for a value: no distractor has the answer's value
        cek(len({m[2] for m in angka}) == 4, f"{ref}: a distractor has the answer's value")
    i = "ABCD".index(jawab)
    S.append(dict(ref=ref, pel=pel, tanya=tanya, pilihan=pilihan[1:i + 1] + [pilihan[0]] + pilihan[i + 1:],
                  guna=guna, sulit=sulit, petunjuk=petunjuk))


# ── Pemetaan awal (pre-test): tally marks, a pictogram key, a scale, comparing two diagrams.
cek(baca_turus("||||/ |||") == 8 and 4 + 3 == 7)
soal("PA1", 1, "Turus ||||/ ||| terdiri atas satu kelompok lengkap (empat garis tegak dan satu garis miring) dan 3 garis tegak. Frekuensinya adalah ...", "C", [
    ("8", True, "Benar. Satu kelompok lengkap bernilai 5, ditambah 3: 5 + 3 = 8.", ""),
    ("7", False, "Kelompok lengkap dihitung 4; garis miringnya terlewat. Satu kelompok bernilai 5.", "SD5-M-B8-11"),
    ("3", False, "Hanya garis tegak yang terpisah yang dihitung; kelompok lima terlewat.", "SD5-M-B8-01"),
    ("2", False, "Yang dihitung banyak kelompoknya (satu kelompok dan satu kelompok kecil), bukan banyak garisnya.", "SD5-M-B8-11"),
], guna="Pemetaan awal")
cek(6 * 5 == 30 and 6 + 5 == 11)
soal("PA2", 4, "Pada sebuah piktogram, satu gambar mewakili 5 buku. Baris kelas VA memuat 6 gambar. Berapa buku yang dibaca kelas VA?", "A", [
    ("30", True, "Benar. 6 gambar × 5 buku = 30 buku.", ""),
    ("6", False, "Ini banyak gambarnya. Setiap gambar mewakili 5 buku, jadi harus dikalikan.", "SD5-M-B8-02"),
    ("11", False, "Banyak gambar ditambah nilai kunci. Seharusnya dikalikan: 6 × 5.", "SD5-M-B8-10"),
    ("5", False, "Ini nilai satu gambar pada kunci, bukan nilai seluruh baris.", "SD5-M-B8-02"),
], guna="Pemetaan awal")
cek((40 + 50) // 2 == 45)
soal("PA3", 5, "Angka skala sebuah diagram batang adalah 0, 10, 20, 30, 40, 50. Ujung sebuah batang berada tepat di tengah antara garis 40 dan garis 50. Berapa nilai batang itu?", "D", [
    ("45", True, "Benar. Di tengah antara 40 dan 50 adalah 45.", ""),
    ("41", False, "Setiap bagian di atas 40 dianggap bernilai 1. Jarak dari 40 ke 50 adalah 10, jadi tengahnya 45.", "SD5-M-B8-06"),
    ("50", False, "Batang dibaca ke garis di atasnya. Ujungnya belum sampai 50.", "SD5-M-B8-06"),
    ("40", False, "Batang dibaca ke garis di bawahnya. Ujungnya sudah melewati 40.", "SD5-M-B8-06"),
], guna="Pemetaan awal")
cek(3 * 10 > 5 * 2)
soal("PA4", 6, "Diagram A memakai skala 10 untuk setiap garis, diagram B memakai skala 2 untuk setiap garis. Batang Senin di diagram A setinggi 3 garis, di diagram B setinggi 5 garis. Batang Senin manakah yang nilainya lebih besar?", "B", [
    ("Batang di diagram A", True, "Benar. Di A nilainya 3 × 10 = 30, di B hanya 5 × 2 = 10.", ""),
    ("Batang di diagram B, karena lebih tinggi", False, "Tinggi batang hanya dapat dibandingkan bila skalanya sama. Hitung nilainya: A 30, B 10.", "SD5-M-B8-08"),
    ("Keduanya sama besar", False, "Nilainya berbeda: A 3 × 10 = 30, B 5 × 2 = 10.", "SD5-M-B8-06"),
    ("Tidak dapat dibandingkan sama sekali", False, "Dapat dibandingkan setelah nilai setiap batang dibaca dari skalanya masing-masing.", "SD5-M-B8-08"),
], guna="Pemetaan awal")

# ── Cek penguasaan (post-test): fresh data, every lesson.
WARNA = {"merah": 9, "biru": 13, "hijau": 7, "kuning": 6}
cek(sum(WARNA.values()) == 35 and len(WARNA) == 4 and max(WARNA.values()) == 13 and 35 - 7 == 28)
soal("PB1", 2, "Tabel frekuensi warna kesukaan siswa: merah 9, biru 13, hijau 7, kuning 6. Berapa siswa yang ditanya?", "B", [
    ("35", True, "Benar. Jumlahkan semua frekuensi: 9 + 13 + 7 + 6 = 35.", ""),
    ("4", False, "Ini banyak jenis warna, bukan banyak siswa.", "SD5-M-B8-13"),
    ("13", False, "Ini frekuensi warna yang paling banyak disukai. Yang ditanyakan jumlah seluruh siswa.", "SD5-M-B8-10"),
    ("28", False, "Frekuensi hijau (7) terlewat. Semua frekuensi harus dijumlahkan.", "SD5-M-B8-01"),
], guna="Cek penguasaan", sulit="Sedang")
cek(baca_turus("||||/ ||||/ ||||") == 14 and 4 + 4 + 4 == 12 and 5 + 5 == 10)
soal("PB2", 1, "Andi mencatat turus: dua kelompok lengkap (masing-masing empat garis tegak dan satu garis miring), lalu 4 garis tegak. Berapa frekuensinya?", "D", [
    ("14", True, "Benar. 5 + 5 + 4 = 14.", ""),
    ("12", False, "Setiap kelompok lengkap dihitung 4; garis miringnya terlewat. Satu kelompok bernilai 5.", "SD5-M-B8-11"),
    ("6", False, "Setiap kelompok dihitung 1: 1 + 1 + 4. Satu kelompok lengkap bernilai 5.", "SD5-M-B8-11"),
    ("10", False, "Hanya kedua kelompok lengkap yang dihitung; 4 garis terakhir terlewat.", "SD5-M-B8-01"),
], guna="Cek penguasaan", sulit="Sedang")
cek(gambar(20, 8) == (2, Fraction(1, 2)) and gambar(20, 8) != (2, Fraction(1, 4)) and 3 * 8 == 24 != 20)
soal("PB3", 3, "Satu gambar buku pada piktogram mewakili 8 buku. Perpustakaan meminjamkan 20 buku pada hari Selasa. Bagaimana baris Selasa digambar?", "A", [
    ("2 gambar utuh dan setengah gambar", True, "Benar. 2 gambar = 16 buku, sisanya 4 dari 8, yaitu setengah gambar.", ""),
    ("20 gambar buku", False, "Satu gambar mewakili 8 buku, bukan 1. 20 gambar berarti 160 buku.", "SD5-M-B8-04"),
    ("2 gambar utuh dan seperempat gambar", False, "Sisa 4 buku dari 8 adalah setengah, bukan seperempat.", "SD5-M-B8-03"),
    ("3 gambar utuh", False, "3 gambar mewakili 24 buku, lebih dari 20.", "SD5-M-B8-03"),
], guna="Cek penguasaan", sulit="Sedang")
cek(nilai_gambar(4, Fraction(1, 2), 6) == 27 and 4 * 6 == 24 and 5 * 6 == 30 and 24 + 1 == 25)
soal("PB4", 4, "Pada piktogram hasil panen, satu gambar mewakili 6 kg. Baris minggu ke-3 memuat 4 gambar utuh dan setengah gambar. Berapa hasil panen minggu ke-3?", "C", [
    ("27 kg", True, "Benar. 4 × 6 kg = 24 kg, setengah gambar = 3 kg, jadi 27 kg.", ""),
    ("24 kg", False, "Setengah gambar terlewat. Setengah gambar mewakili 3 kg.", "SD5-M-B8-03"),
    ("30 kg", False, "Setengah gambar dihitung sebagai satu gambar penuh.", "SD5-M-B8-03"),
    ("25 kg", False, "Setengah gambar dihitung 1 kg. Setengah gambar mewakili setengah dari 6 kg.", "SD5-M-B8-03"),
], guna="Cek penguasaan", sulit="Sedang")
PANEN = [3, 8, 6, 1]
cek((max(PANEN) - min(PANEN)) * 3 == 21 and max(PANEN) - min(PANEN) == 7 and max(PANEN) * 3 == 24 and (max(PANEN) + min(PANEN)) * 3 == 27)
soal("PB5", 4, "Piktogram hasil panen jagung, satu gambar mewakili 3 kg: minggu ke-1 ada 3 gambar, minggu ke-2 ada 8 gambar, minggu ke-3 ada 6 gambar, minggu ke-4 ada 1 gambar. Berapa selisih hasil tertinggi dan terendah?", "D", [
    ("21 kg", True, "Benar. Tertinggi 8 × 3 = 24 kg, terendah 1 × 3 = 3 kg, selisihnya 21 kg.", ""),
    ("7 kg", False, "Ini selisih banyak gambarnya. Kalikan dengan 3 kg.", "SD5-M-B8-02"),
    ("24 kg", False, "Ini hasil tertinggi saja. Yang ditanyakan selisihnya dengan hasil terendah.", "SD5-M-B8-10"),
    ("27 kg", False, "Tertinggi dan terendah dijumlahkan. Selisih berarti dikurangkan.", "SD5-M-B8-10"),
], guna="Cek penguasaan", sulit="Sedang")
cek(28 + (32 - 28) // 2 == 30 and 28 + 1 == 29)
soal("PB6", 5, "Pada sebuah diagram batang, angka skalanya 0, 4, 8, 12, sampai 32. Batang hari Kamis berhenti tepat di tengah antara garis 28 dan garis 32. Berapa nilainya?", "B", [
    ("30", True, "Benar. Setiap langkah bernilai 4; di tengah antara 28 dan 32 adalah 30.", ""),
    ("29", False, "Bagian di atas 28 dianggap bernilai 1. Tengah dari langkah 4 adalah 2, jadi 28 + 2 = 30.", "SD5-M-B8-06"),
    ("32", False, "Batang dibaca ke garis di atasnya. Ujungnya belum sampai 32.", "SD5-M-B8-06"),
    ("28", False, "Batang dibaca ke garis di bawahnya. Ujungnya sudah melewati 28.", "SD5-M-B8-06"),
], guna="Cek penguasaan", sulit="Sedang")
KUNJUNG = {"Senin": 35, "Selasa": 50, "Rabu": 42, "Kamis": 28}
cek(min(KUNJUNG, key=KUNJUNG.get) == "Kamis" and max(KUNJUNG.values()) - min(KUNJUNG.values()) == 22
    and max(KUNJUNG.values()) + min(KUNJUNG.values()) == 78)
soal("PB7", 5, "Diagram batang pengunjung pameran: Senin 35, Selasa 50, Rabu 42, Kamis 28 orang. Hari manakah pengunjungnya paling sedikit, dan berapa selisihnya dengan hari yang paling banyak?", "A", [
    ("Kamis, selisih 22 orang", True, "Benar. Terendah Kamis 28, tertinggi Selasa 50: 50 − 28 = 22.", ""),
    ("Selasa, selisih 22 orang", False, "Selasa adalah hari yang paling banyak (batang terpanjang), bukan paling sedikit.", "SD5-M-B8-12"),
    ("Kamis, selisih 78 orang", False, "50 dan 28 dijumlahkan. Selisih berarti dikurangkan.", "SD5-M-B8-10"),
    ("Kamis, selisih 7 orang", False, "Kamis dibandingkan dengan Senin (35 − 28), bukan dengan hari yang paling banyak.", "SD5-M-B8-10"),
], guna="Cek penguasaan", sulit="Sedang")
cek(4 * 5 == 20 and 9 * 2 == 18 and 20 > 18 and 4 * 2 == 8)
soal("PB8", 6, "Diagram kelas A memakai skala 5 untuk setiap garis, diagram kelas B memakai skala 2. Batang Januari kelas A setinggi 4 garis, kelas B setinggi 9 garis. Rina berkata, \"Kelas B lebih banyak karena batangnya lebih tinggi.\" Tanggapan yang tepat adalah ...", "C", [
    ("kurang tepat; kelas A 20, kelas B 18", True, "Benar. 4 × 5 = 20 dan 9 × 2 = 18. Skalanya berbeda, jadi tinggi batang tidak dapat langsung dibandingkan.", ""),
    ("tepat; batang kelas B memang lebih tinggi daripada kelas A", False, "Tinggi batang hanya dapat dibandingkan bila skalanya sama.", "SD5-M-B8-08"),
    ("tepat; kelas B 18, kelas A hanya 8", False, "Kelas A dibaca dengan skala 2 milik diagram B (4 × 2 = 8). Skala kelas A adalah 5: 4 × 5 = 20.", "SD5-M-B8-06"),
    ("kurang tepat; keduanya sama, 20", False, "Kelas B: 9 × 2 = 18, bukan 20.", "SD5-M-B8-06"),
], guna="Cek penguasaan", sulit="Sulit")

# ── Latihan (practice), by lesson.
soal("LT1", 1, "Mengapa garis kelima pada turus dibuat miring melintang?", "A", [
    ("Agar mudah dihitung lima-lima", True, "Benar. Setiap kelompok bernilai 5, jadi kita dapat menghitung 5, 10, 15, dan seterusnya.", ""),
    ("Agar garis kelima tidak ikut dihitung", False, "Garis miring justru ikut dihitung; ia adalah garis kelima.", "SD5-M-B8-11"),
    ("Karena garis kelima mewakili 10 data", False, "Setiap garis, termasuk yang miring, mewakili satu data.", "SD5-M-B8-11"),
    ("Agar turusnya terlihat lebih rapi saja", False, "Kerapian bukan tujuannya; garis miring menandai kelompok lima agar mudah dihitung.", "SD5-M-B8-09"),
])
soal("LT2", 1, "Frekuensi adalah ...", "D", [
    ("banyaknya suatu data muncul", True, "Benar. Misalnya 7 anak menyukai bayam: frekuensi bayam 7.", ""),
    ("nilai data yang paling besar", False, "Itu nilai tertinggi, bukan frekuensi.", "SD5-M-B8-13"),
    ("garis-garis yang dipakai untuk mencatat", False, "Itu turus. Frekuensi adalah bilangan hasil menghitung turus itu.", "SD5-M-B8-11"),
    ("banyaknya jenis data yang dicatat", False, "Banyak jenis data berbeda dengan frekuensi setiap data.", "SD5-M-B8-13"),
])
SEPATU = [34, 35, 34, 36, 35, 34, 37, 35, 34, 36]
cek(SEPATU.count(34) == 4 and len(SEPATU) == 10)
soal("LT3", 1, "Ukuran sepatu 10 anak: 34, 35, 34, 36, 35, 34, 37, 35, 34, 36. Berapa frekuensi ukuran 34?", "B", [
    ("4", True, "Benar. Ukuran 34 muncul 4 kali.", ""),
    ("3", False, "Ada satu data 34 yang terlewat. Coret setiap data yang sudah dihitung.", "SD5-M-B8-01"),
    ("5", False, "Ada data yang terhitung dua kali. Coret setiap data yang sudah dihitung.", "SD5-M-B8-01"),
    ("34", False, "Ini nilai datanya (ukuran sepatu), bukan berapa kali ukuran itu muncul.", "SD5-M-B8-13"),
])
ULANGAN = {60: 3, 70: 5, 80: 8, 90: 4, 100: 2}
cek(ULANGAN[60] + ULANGAN[70] == 8 and ULANGAN[60] + ULANGAN[70] + ULANGAN[80] == 16 and 60 + 70 == 130)
soal("LT4", 2, "Tabel nilai ulangan: nilai 60 ada 3 siswa, 70 ada 5 siswa, 80 ada 8 siswa, 90 ada 4 siswa, 100 ada 2 siswa. Berapa siswa yang nilainya kurang dari 80?", "C", [
    ("8", True, "Benar. Nilai 60 dan 70: 3 + 5 = 8 siswa.", ""),
    ("3", False, "Hanya nilai 60 yang dihitung; nilai 70 juga kurang dari 80.", "SD5-M-B8-01"),
    ("16", False, "Nilai 80 ikut dihitung. Kurang dari 80 tidak termasuk 80.", "SD5-M-B8-10"),
    ("130", False, "Yang dijumlahkan nilainya (60 + 70). Yang dihitung banyak siswanya, yaitu frekuensinya.", "SD5-M-B8-13"),
], sulit="Sedang")
cek(max(ULANGAN, key=ULANGAN.get) == 80 and sum(ULANGAN.values()) == 22)
soal("LT5", 2, "Dari tabel nilai ulangan yang sama (60: 3 siswa, 70: 5, 80: 8, 90: 4, 100: 2), nilai berapa yang paling banyak diperoleh siswa?", "A", [
    ("80", True, "Benar. Nilai 80 diperoleh oleh 8 siswa, frekuensi terbesar.", ""),
    ("8", False, "Ini frekuensinya. Yang ditanyakan nilainya.", "SD5-M-B8-13"),
    ("100", False, "100 adalah nilai tertinggi, tetapi hanya diperoleh 2 siswa.", "SD5-M-B8-13"),
    ("22", False, "Ini banyak siswa seluruhnya.", "SD5-M-B8-10"),
])
cek(gambar(35, 10) == (3, Fraction(1, 2)))
soal("LT6", 3, "Satu gambar mewakili 10 pengunjung. Bagaimana menggambar 35 pengunjung?", "D", [
    ("3 gambar utuh dan setengah gambar", True, "Benar. 3 gambar = 30, sisa 5 dari 10 adalah setengah gambar.", ""),
    ("35 gambar utuh", False, "Satu gambar mewakili 10, bukan 1. 35 gambar berarti 350 pengunjung.", "SD5-M-B8-04"),
    ("4 gambar utuh", False, "4 gambar mewakili 40, lebih dari 35.", "SD5-M-B8-03"),
    ("3 gambar utuh dan seperempat gambar", False, "Sisa 5 dari 10 adalah setengah, bukan seperempat.", "SD5-M-B8-03"),
])
soal("LT7", 3, "Rudi membuat piktogram. Gambar pada baris Senin ia buat lebih besar daripada gambar pada baris Selasa, padahal kuncinya sama. Apa akibatnya?", "B", [
    ("Pembaca dapat mengira data Senin lebih banyak", True, "Benar. Gambar yang mewakili nilai sama harus sama besar agar tidak menyesatkan.", ""),
    ("Tidak ada akibatnya, asal banyak gambarnya benar", False, "Gambar yang lebih besar tampak lebih banyak, sehingga pembaca dapat keliru.", "SD5-M-B8-05"),
    ("Setiap gambar Senin bernilai lebih dari kuncinya", False, "Kuncinya tetap sama; hanya tampilannya yang menyesatkan.", "SD5-M-B8-05"),
    ("Piktogram tidak lagi memerlukan kunci", False, "Kunci tetap diperlukan untuk membaca nilai setiap gambar.", "SD5-M-B8-09"),
], sulit="Sedang")
soal("LT8", 3, "Bagian manakah yang harus ada pada piktogram agar nilainya dapat dibaca?", "C", [
    ("Kunci yang menyatakan nilai satu gambar", True, "Benar. Tanpa kunci, pembaca tidak tahu satu gambar mewakili berapa.", ""),
    ("Warna yang berbeda di setiap baris", False, "Warna boleh saja, tetapi tidak menyatakan nilai. Yang diperlukan adalah kunci.", "SD5-M-B8-09"),
    ("Satu gambar untuk setiap satu benda", False, "Satu gambar boleh mewakili banyak benda, asal kuncinya ditulis.", "SD5-M-B8-04"),
    ("Gambar yang semakin besar untuk data yang besar", False, "Gambar harus sama besar; besar data ditunjukkan oleh banyak gambar.", "SD5-M-B8-05"),
])
cek(7 * 2 == 14 and 7 + 2 == 9 and 6 * 2 == 12)
soal("LT9", 4, "Pada piktogram hasil panen, satu gambar mewakili 2 kg. Baris minggu ke-2 memuat 7 gambar. Berapa hasil panen minggu ke-2?", "A", [
    ("14 kg", True, "Benar. 7 × 2 kg = 14 kg.", ""),
    ("7 kg", False, "Ini banyak gambarnya. Setiap gambar mewakili 2 kg.", "SD5-M-B8-02"),
    ("9 kg", False, "Banyak gambar ditambah 2. Seharusnya dikalikan: 7 × 2.", "SD5-M-B8-10"),
    ("12 kg", False, "Hanya 6 gambar yang terhitung. Hitung ulang gambarnya: ada 7.", "SD5-M-B8-01"),
])
cek(nilai_gambar(8, Fraction(1, 4), 4) == 33 and 8 * 4 == 32 and 8 * 4 + 2 == 34 and 9 * 4 == 36)
soal("LT10", 4, "Satu gambar mewakili 4 kue. Baris hari Rabu memuat 8 gambar utuh dan seperempat gambar. Berapa kue yang terjual hari Rabu?", "D", [
    ("33", True, "Benar. 8 × 4 = 32, seperempat gambar = 1 kue, jadi 33.", ""),
    ("32", False, "Seperempat gambar terlewat. Ia mewakili 1 kue.", "SD5-M-B8-03"),
    ("34", False, "Seperempat gambar dihitung 2 kue, seperti setengah gambar. Seperempat dari 4 adalah 1.", "SD5-M-B8-03"),
    ("36", False, "Seperempat gambar dihitung sebagai satu gambar penuh.", "SD5-M-B8-03"),
], sulit="Sedang")
cek((6 - 3) * 5 == 15 and 6 - 3 == 3 and (6 + 3) * 5 == 45 and 6 * 5 == 30)
soal("LT11", 4, "Satu gambar mewakili 5 kg. Minggu ke-1 ada 3 gambar, minggu ke-2 ada 6 gambar. Berapa kenaikan hasil panen dari minggu ke-1 ke minggu ke-2?", "B", [
    ("15 kg", True, "Benar. 6 × 5 − 3 × 5 = 30 − 15 = 15 kg, atau (6 − 3) × 5 = 15 kg.", ""),
    ("3 kg", False, "Ini selisih banyak gambarnya. Kalikan dengan 5 kg.", "SD5-M-B8-02"),
    ("45 kg", False, "Kedua minggu dijumlahkan. Kenaikan adalah selisihnya.", "SD5-M-B8-10"),
    ("30 kg", False, "Ini hasil minggu ke-2 saja. Kenaikan adalah selisih kedua minggu.", "SD5-M-B8-10"),
], sulit="Sedang")
cek(80 // 20 == 4 and 20 // 5 == 4 and 60 + 2 * 4 == 68 and 60 + 2 == 62 and 60 + 2 * 10 == 80)
soal("LT12", 5, "Angka skala sebuah diagram batang: 0, 20, 40, 60, 80. Di antara dua angka ada 4 garis tipis, sehingga ada 5 langkah yang sama. Sebuah batang berhenti tepat di garis tipis kedua di atas 60. Berapa nilainya?", "C", [
    ("68", True, "Benar. Setiap langkah 20 : 5 = 4, jadi 60 + 2 × 4 = 68.", ""),
    ("62", False, "Setiap langkah dianggap 1. Dari 60 ke 80 ada 5 langkah, jadi setiap langkah 4.", "SD5-M-B8-06"),
    ("80", False, "Setiap langkah dianggap 10. Dari 60 ke 80 ada 5 langkah, bukan 2.", "SD5-M-B8-06"),
    ("64", False, "Hanya satu langkah yang dihitung. Batang berhenti di garis tipis kedua.", "SD5-M-B8-06"),
], sulit="Sedang")
KOLAM = [30, 24, 18, 27]
cek(sum(KOLAM) == 99 and Fraction(99, 4) == Fraction(2475, 100) and KOLAM[0] > Fraction(99, 4) and 99 // 3 == 33 and KOLAM[0] < 33)
soal("LT13", 5, "Diagram batang horizontal hasil panen ikan: kolam 1 sebanyak 30 kg, kolam 2 sebanyak 24 kg, kolam 3 sebanyak 18 kg, kolam 4 sebanyak 27 kg. Apakah hasil kolam 1 lebih dari seperempat hasil seluruhnya?", "A", [
    ("Ya, karena 30 kg lebih dari 24,75 kg", True, "Benar. Seluruhnya 99 kg; seperempatnya 99 : 4 = 24,75 kg.", ""),
    ("Tidak, karena 30 kg kurang dari 99 kg", False, "Yang dibandingkan seperempat dari jumlahnya, bukan jumlahnya sendiri.", "SD5-M-B8-10"),
    ("Tidak, karena seperempatnya 33 kg", False, "99 dibagi 3. Seperempat berarti dibagi 4: 24,75 kg.", "SD5-M-B8-10"),
    ("Tidak, karena kolam 1 batangnya paling pendek", False, "Batang kolam 1 justru paling panjang; batang terpendek adalah kolam 3.", "SD5-M-B8-12"),
], sulit="Sulit", petunjuk="Jumlahkan dahulu semua hasilnya, lalu bagi 4.")
soal("LT14", 5, "Apa perbedaan diagram batang vertikal dan diagram batang horizontal?", "D", [
    ("Arah batangnya: tegak atau mendatar", True, "Benar. Datanya boleh sama; hanya arah batangnya yang berbeda.", ""),
    ("Diagram horizontal tidak memerlukan skala", False, "Keduanya memerlukan skala pada sumbunya.", "SD5-M-B8-09"),
    ("Diagram horizontal hanya untuk data yang kecil", False, "Kedua jenis dapat dipakai untuk data besar maupun kecil.", "SD5-M-B8-07"),
    ("Pada diagram vertikal, batang terpendek bernilai terbesar", False, "Pada kedua jenis, batang yang paling panjang bernilai paling besar.", "SD5-M-B8-12"),
])
GANDA = {2020: (12, 14), 2021: (16, 11), 2022: (13, 13), 2023: (15, 18)}
cek(max(GANDA, key=lambda t: abs(GANDA[t][0] - GANDA[t][1])) == 2021 and max(GANDA, key=lambda t: max(GANDA[t])) == 2023
    and min(GANDA, key=lambda t: abs(GANDA[t][0] - GANDA[t][1])) == 2022 and abs(12 - 14) == 2)
soal("LT15", 6, "Diagram batang ganda siswa laki-laki dan perempuan: 2020 (12 dan 14), 2021 (16 dan 11), 2022 (13 dan 13), 2023 (15 dan 18). Pada tahun berapa selisih laki-laki dan perempuan paling besar?", "B", [
    ("2021", True, "Benar. Selisihnya 16 − 11 = 5, yang terbesar.", ""),
    ("2023", False, "Tahun 2023 mempunyai batang paling tinggi (18), tetapi selisihnya hanya 3.", "SD5-M-B8-10"),
    ("2022", False, "Pada 2022 selisihnya 0, yang paling kecil.", "SD5-M-B8-12"),
    ("2020", False, "Selisih 2020 hanya 14 − 12 = 2.", "SD5-M-B8-10"),
], sulit="Sedang")
soal("LT16", 6, "Mengapa dua diagram batang yang akan dibandingkan dari tinggi batangnya harus memakai skala yang sama?", "C", [
    ("Agar tinggi batang menunjukkan nilai yang sama", True, "Benar. Dengan skala yang sama, batang yang lebih tinggi pasti bernilai lebih besar.", ""),
    ("Agar kedua diagram terlihat lebih menarik bagi pembacanya", False, "Tampilan bukan alasannya; skala berbeda membuat tinggi batang menyesatkan.", "SD5-M-B8-08"),
    ("Agar semua batang menjadi sama tinggi", False, "Skala yang sama tidak membuat batang sama tinggi; nilainya tetap berbeda.", "SD5-M-B8-08"),
    ("Agar diagram tidak memerlukan judul lagi", False, "Judul tetap diperlukan pada setiap diagram.", "SD5-M-B8-09"),
])
soal("LT17", 6, "Kapan dua data sebaiknya tidak digabung dalam satu diagram batang ganda?", "A", [
    ("Bila nilainya berbeda sangat jauh, ratusan dan belasan", True, "Benar. Batang yang belasan akan sangat pendek dan sulit dibaca.", ""),
    ("Bila kedua data mencatat tahun-tahun yang sama", False, "Tahun yang sama justru memudahkan penggabungan.", "SD5-M-B8-07"),
    ("Bila kedua data memakai satuan yang sama, yaitu banyak siswa", False, "Satuan yang sama tidak menjadi masalah; yang perlu diperhatikan besar nilainya.", "SD5-M-B8-07"),
    ("Bila kedua data sudah memakai skala yang sama", False, "Skala yang sama justru syarat agar batangnya dapat dibandingkan.", "SD5-M-B8-08"),
], sulit="Sedang")

# ── Whole-chapter checks.
refs = [s["ref"] for s in S]
cek(len(refs) == len(set(refs)))
cek({p["no"] for p in PELAJARAN} == {s["pel"] for s in S}, "every lesson has questions")
PRE = [s for s in S if s["guna"] == "Pemetaan awal"]
POST = [s for s in S if s["guna"] == "Cek penguasaan"]
LAT = [s for s in S if not s["guna"]]
cek(len(PRE) == 4 and len(POST) == 8 and 12 <= len(LAT) <= 20)
cek(len({s["pel"] for s in PRE}) == 4, "the pre-test samples four lessons")
cek({s["pel"] for s in POST} == {p["no"] for p in PELAJARAN}, "the post-test covers every lesson")
cek(sum(1 for s in POST if s["sulit"] == "Sedang") > len(POST) / 2, "post-test mostly Sedang")
HURUF = {}
for s in S:
    h = "ABCD"[[b for _, b, _, _ in s["pilihan"]].index(True)]
    HURUF[h] = HURUF.get(h, 0) + 1
cek(set(HURUF) == set("ABCD") and max(HURUF.values()) * 2 <= len(S) and max(HURUF.values()) - min(HURUF.values()) <= 3, HURUF)

# The post-test uses fresh data. Small counts recur by chance (a set of four numbers under 10 almost
# always shares three with some book table), so what is checked is the data itself: no run of
# three values of a post-test data list appears, in order, in any of the book's data lists (the
# lessons use the book's), no pictogram key and count is one the book or a lesson reads, and no
# answer is a key the book or a lesson gives.
DATA_BUKU = [list(v) for v in zip(*DONAT.values())] + [list(SAYURAN.values()), list(NILAI), list(NILAI.values()),
             list(APEM.values()), TOMAT, TOMAT_GAMBAR, list(BERANGKAT.values()), list(MEDALI.values()), list(LELE.values()),
             [l for l, _ in SISWA.values()], [p for _, p in SISWA.values()], list(KALORI.values()),
             list(PERPUSTAKAAN.values()), [t // 1000 for t in TABUNGAN]]
DATA_POST = {"PB1": list(WARNA.values()), "PB5": PANEN, "PB7": list(KUNJUNG.values()), "PB2": [14],
             "PB3": [8, 20], "PB4": [6, 4], "PB6": [28, 32], "PB8": [5, 2, 4, 9]}


def tiga(xs):
    return {tuple(xs[i:i + 3]) for i in range(len(xs) - 2)}


for ref, xs in DATA_POST.items():
    for d in DATA_BUKU:
        cek(not tiga(xs) & tiga(d) and not tiga(xs) & tiga(d[::-1]), f"{ref}: {xs} repeats the book's data {d}")
KUNCI_PIKTO = {(4, v) for v in APEM.values()} | {(2, v) for v in TOMAT} | {(4, v) for v in PERPUSTAKAAN.values()} | {(4000, v) for v in TABUNGAN}
JAWABAN_BUKU = {39, 25, 8, 198, 60, 16, 38, 122, 29, 4, 12, 18, 9, 11, 26}
cek({s_["ref"] for s_ in POST} == set(DATA_POST))
for s_ in POST:
    benar = next(t for t, b, _, _ in s_["pilihan"] if b)
    m = re.match(r"(?:\D*?)(\d+)", benar)
    cek(not m or int(m[1]) not in JAWABAN_BUKU, f"{s_['ref']}: the answer {benar} is a book or lesson key")
cek(all((k, v) not in KUNCI_PIKTO for k, v in [(8, 20), (6, 27), (3, 21), (3, 6)]))


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
                c.number_format = "@"   # answers such as 24,75 stay text

    lembar("Kursus", list(KURSUS), [list(KURSUS.values())])
    lembar("Bab", ["No bab*", "Judul bab*"], [list(b) for b in BAB])
    lembar("Pelajaran", ["No bab", "No pelajaran", "Judul pelajaran", "Ringkasan", "Isi pelajaran", "Tujuan pembelajaran", "Tingkat berpikir", "Media", "Transkrip"],
           [[1, p["no"], p["judul"], p["ringkasan"], p["isi"], p["tujuan"], p["bloom"], "", ""] for p in PELAJARAN])
    lembar("Soal", ["Kode soal", "No bab", "No pelajaran", "Jenis soal", "Pertanyaan", "Bacaan", "Petunjuk", "Kegunaan", "Tingkat kesulitan", "Kelompok paralel"],
           [[s["ref"], 1, s["pel"], "Pilihan ganda", s["tanya"], "", s["petunjuk"], s["guna"], s["sulit"], ""] for s in S])
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
    tulis(os.path.join(here, "SD5-Matematika-Bab8.xlsx"))
    tulis_miskonsepsi(os.path.join(here, "SD5-Matematika-Bab8-miskonsepsi.csv"))
    halaman = sum(p["isi"].count("## ") for p in PELAJARAN)
    print(f"SD5-Matematika-Bab8.xlsx: lessons {len(PELAJARAN)} ({halaman} pages), questions {len(S)} "
          f"(pre {len(PRE)}, post {len(POST)}, practice {len(LAT)}), answers "
          + " ".join(f"{h}={HURUF[h]}" for h in "ABCD"))
    print(f"SD5-Matematika-Bab8-miskonsepsi.csv: {len(MISKONSEPSI)} codes")
    print(f"assertions passed: {CEK[0]}")
