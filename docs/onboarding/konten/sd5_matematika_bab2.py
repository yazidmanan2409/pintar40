# SD Kelas 5, Matematika, Bab 2 "KPK dan FPB", as a PINTAR lesson workbook in the D-007
# template (sheets Kursus, Bab, Pelajaran, Soal, Pilihan; the column contract is KOLOM in
# src/lib/unggah-kontrak.ts). Built the way Bab 1 was (LANA-01, GATE: PASS @ 69398c9).
#
# Source: Buku Panduan Guru Matematika untuk SD/MI Kelas V (Meita Fitrianawati, Ika Surtiani,
# Ait Istiandaru; Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi, 2022), Bab 2,
# pp. 43-96. Lessons follow its subbab A-E; "pembagian berulang" (p. 82) is left out because the
# book marks it as optional technique, to be met only after the concept.
#
# Text lessons only (D-050). The workbook's "Kode miskonsepsi" column stays empty; the proposed
# codes go to SD5-Matematika-Bab2-miskonsepsi.csv. Every number in a lesson example, question,
# answer or distractor is checked below; the script fails before writing anything if one is wrong.
#
# Run: python3 docs/onboarding/konten/sd5_matematika_bab2.py
import csv
import os
import re
from datetime import date, timedelta
from functools import reduce
from math import gcd, prod

from openpyxl import Workbook
from openpyxl.styles import Alignment, Font

CEK = [0]


def cek(syarat, pesan=""):
    """An assertion that is counted, so the hand-off can say how many passed."""
    assert syarat, pesan
    CEK[0] += 1


def faktor(n):
    return [d for d in range(1, n + 1) if n % d == 0]


def kpk(*b):
    return reduce(lambda a, c: a * c // gcd(a, c), b)


def fpb(*b):
    return reduce(gcd, b)


def prima(n):
    return n > 1 and faktor(n) == [1, n]


def faktorisasi(n):
    """Prime factors of n, smallest first, with repeats."""
    hasil, p = [], 2
    while n > 1:
        while n % p == 0:
            hasil.append(p)
            n //= p
        p += 1
    return hasil


def kelipatan(n, sampai):
    return list(range(n, sampai + 1, n))


def tanggal(bulan, hari, tambah):
    """The date `tambah` days after `hari` `bulan` (2022, as the book's calendars are)."""
    return date(2022, bulan, hari) + timedelta(days=tambah)


# ── Lesson examples ─────────────────────────────────────────────────────────────
PRIMA_100 = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97]
cek([n for n in range(1, 101) if prima(n)] == PRIMA_100 and len(PRIMA_100) == 25)   # book p. 78
# lesson 1
cek(kelipatan(9, 90) == [9, 18, 27, 36, 45, 54, 63, 72, 81, 90] and all(a // 10 + 1 == b // 10 and a % 10 - 1 == b % 10 for a, b in zip(kelipatan(9, 81), kelipatan(9, 90)[1:])))
cek(kelipatan(3, 15) == [3, 6, 9, 12, 15] and kelipatan(4, 40) == [4, 8, 12, 16, 20, 24, 28, 32, 36, 40])
cek(42 % 7 == 0 and 42 // 7 == 6 and 27 % 7 == 6 and 27 // 7 == 3 and 17 % 7 == 3)
# lesson 2
cek([n for n in kelipatan(2, 20) if n % 3 == 0] == [6, 12, 18] and kpk(2, 3) == 6)
cek(kelipatan(8, 24) == [8, 16, 24] and 8 % 6 and 16 % 6 and kpk(6, 8) == 24 and 6 * 8 == 48 and 48 % 24 == 0)
cek(kelipatan(4, 12) == [4, 8, 12] and 4 % 3 and 8 % 3 and kpk(2, 3, 4) == 12)
cek(kpk(3, 5) == 15 and 20 + 15 == 35 and 35 - 31 == 4 and tanggal(8, 20, 15) == date(2022, 9, 4))    # book p. 57
cek(kpk(2, 5) == 10 and tanggal(7, 14, 10) == date(2022, 7, 24))                                    # book p. 60
# lesson 3
cek(6 % 3 == 0 and 6 // 3 == 2 and 6 % 4 == 2)
cek(faktor(12) == [1, 2, 3, 4, 6, 12] and 1 * 12 == 2 * 6 == 3 * 4 == 12)
cek(faktor(18) == [1, 2, 3, 6, 9, 18] and 1 * 18 == 2 * 9 == 3 * 6 == 18)
cek(faktor(28) == [1, 2, 4, 7, 14, 28])
# lesson 4
cek(sorted(set(faktor(12)) & set(faktor(18))) == [1, 2, 3, 6] and fpb(12, 18) == 6)
cek(sorted(set(faktor(8)) & set(faktor(20))) == [1, 2, 4] and fpb(8, 20) == 4)                      # book p. 71
cek(sorted(set(faktor(16)) & set(faktor(24)) & set(faktor(40))) == [1, 2, 4, 8] and fpb(16, 24, 40) == 8)
cek(faktor(9) == [1, 3, 9] and faktor(14) == [1, 2, 7, 14] and fpb(9, 14) == 1)
cek(fpb(36, 48, 24) == 12 and (36 // 12, 48 // 12, 24 // 12) == (3, 4, 2))                           # book p. 76
# lesson 5
cek([faktor(n) for n in range(1, 11)] == [[1], [1, 2], [1, 3], [1, 2, 4], [1, 5], [1, 2, 3, 6], [1, 7], [1, 2, 4, 8], [1, 3, 9], [1, 2, 5, 10]])
cek(not any(prima(n) for n in (9, 15, 21, 51, 91)) and 51 == 3 * 17 and 91 == 7 * 13)
cek(faktorisasi(60) == [2, 2, 3, 5] and 60 // 2 == 30 and 30 // 2 == 15 and 15 == 3 * 5)
cek(faktorisasi(70) == [2, 5, 7] and 70 // 2 == 35)
# lesson 6
cek(faktorisasi(42) == [2, 3, 7] and fpb(42, 60) == 2 * 3 == 6 and kpk(42, 60) == 2 * 2 * 3 * 5 * 7 == 420)  # book p. 85
cek(420 // 42 == 10 and 420 // 60 == 7)
cek(faktorisasi(36) == [2, 2, 3, 3] and faktorisasi(108) == [2, 2, 3, 3, 3] and kpk(36, 108) == 108 and fpb(36, 108) == 36)
# BOOK ERROR (p. 83): "KPK = 2 × 2 × 2 × 2 × 3 × 3 × 3 = 3.888"; those factors make 432. All the factors
# of 36 and 108 multiplied are 2 × 2 × 2 × 2 × 3 × 3 × 3 × 3 × 3 = 3.888 (= 36 × 108). The lesson states 3.888.
cek(2 * 2 * 2 * 2 * 3 * 3 * 3 == 432 and 2 * 2 * 2 * 2 * 3 * 3 * 3 * 3 * 3 == 3_888 == 36 * 108)
cek(2 * 2 * 2 * 2 * 3 * 3 * 3 * 3 == 1_296)                                                          # book p. 84
cek(faktorisasi(24) == [2, 2, 2, 3] and fpb(24, 36, 60) == 12 and kpk(24, 36, 60) == 360)              # book p. 87
cek(fpb(18, 12) == 6 and (18 // 6, 12 // 6) == (3, 2))                                               # book p. 88-89
cek(kpk(15, 24, 36) == 360 and 360 // 60 == 6)                                                       # book p. 89
# BOOK ERROR: the key (p. 89) says 15.30 + 6 menit is pukul 15.41; it is 15.36.
cek(30 + 6 == 36)

SUMBER = ("_Diadaptasi dari Buku Panduan Guru Matematika untuk SD/MI Kelas V, Kementerian Pendidikan, "
          "Kebudayaan, Riset, dan Teknologi, 2022, Bab 2._")

KURSUS = {
    "Judul kursus*": "Matematika Kelas 5 · Bab 2: KPK dan FPB",
    "Mata pelajaran*": "Matematika",
    "Jenjang*": "SD",
    "Kelas*": "Kelas 5",
    "Konteks": "Akademik",
}

BAB = [(1, "KPK dan FPB")]

PELAJARAN = [
    dict(no=1, judul="Kelipatan",
         ringkasan="Kelipatan sebuah bilangan didapat dengan terus menambahkan bilangan itu, atau dengan mengalikannya dengan 1, 2, 3, dan seterusnya.",
         tujuan="Murid dapat menentukan kelipatan sebuah bilangan dan memeriksa apakah suatu bilangan merupakan kelipatannya.",
         bloom="Memahami",
         isi=f"""## Bermain tepuk kelipatan

Bayangkan kalian duduk melingkar dan menyebut bilangan bergantian: 1, 2, 3, 4, ... Setiap kali giliranmu jatuh pada bilangan **3, 6, 9, 12, ...**, kamu bertepuk tangan, bukan menyebut bilangannya.

Bilangan-bilangan itu disebut **kelipatan 3**.

## Cara mendapatkan kelipatan

Ada dua cara yang hasilnya sama.

**Cara 1, menambah terus.** Mulai dari 3, lalu tambahkan 3 setiap langkah:
3, 3 + 3 = 6, 6 + 3 = 9, 9 + 3 = 12, 12 + 3 = 15, ...

**Cara 2, tabel perkalian.** Kalikan 3 dengan 1, 2, 3, 4, 5, ...:
3 × 1 = 3, 3 × 2 = 6, 3 × 3 = 9, 3 × 4 = 12, 3 × 5 = 15, ...

Kelipatan selalu **dimulai dari bilangan itu sendiri**, dan tidak ada habisnya.

**Coba:** tuliskan sepuluh kelipatan 4 yang pertama.
_Periksa: 4, 8, 12, 16, 20, 24, 28, 32, 36, 40._

## Menandai kelipatan di tabel

Tulislah bilangan 1 sampai 50 dalam lima baris, sepuluh bilangan setiap baris. Lalu tandai kelipatan 3: 3, 6, 9, 12, dan seterusnya.

Perhatikan bahwa tanda-tanda itu membentuk pola miring yang teratur, karena setiap tanda berjarak tepat 3 dari tanda sebelumnya.

**Coba:** tandai kelipatan 9 pada tabel 1 sampai 100. Pola apa yang kamu lihat?
_Periksa: 9, 18, 27, 36, ..., 90 membentuk garis miring. Setiap langkah, angka puluhannya naik 1 dan angka satuannya turun 1._

## Apakah bilangan ini kelipatan?

Apakah 42 kelipatan 7? Bagilah: 42 : 7 = 6, **tanpa sisa**. Jadi 42 = 7 × 6, dan 42 adalah kelipatan 7.

Apakah 27 kelipatan 7? 27 : 7 = 3 sisa 6. Ada sisa, jadi 27 **bukan** kelipatan 7.

Hati-hati: angka 7 di belakang 27 atau 17 tidak membuatnya kelipatan 7. Yang menentukan adalah **pembagiannya habis atau tidak**.

{SUMBER}"""),
    dict(no=2, judul="Kelipatan Persekutuan dan KPK",
         ringkasan="Kelipatan yang dimiliki bersama oleh dua bilangan atau lebih disebut kelipatan persekutuan; yang terkecil disebut KPK.",
         tujuan="Murid dapat menentukan kelipatan persekutuan dan KPK dari dua atau tiga bilangan, dan memakainya untuk masalah jadwal.",
         bloom="Menerapkan",
         isi=f"""## Kelipatan bersama

Tuliskan kelipatan 2 dan kelipatan 3:

- Kelipatan 2: 2, 4, **6**, 8, 10, **12**, 14, 16, **18**, 20, ...
- Kelipatan 3: 3, **6**, 9, **12**, 15, **18**, 21, ...

Bilangan 6, 12, dan 18 muncul di kedua daftar. Bilangan seperti ini disebut **kelipatan persekutuan** dari 2 dan 3. "Persekutuan" artinya dimiliki bersama.

## KPK: yang paling kecil

Dari 6, 12, 18, ..., yang paling kecil adalah 6. Kelipatan persekutuan yang paling kecil disebut **Kelipatan Persekutuan Terkecil**, disingkat **KPK**. Jadi KPK dari 2 dan 3 adalah **6**.

Cara cepat mencari KPK dari 6 dan 8:

1. Tulis kelipatan bilangan yang lebih besar: 8, 16, 24, ...
2. Periksa satu per satu, apakah juga kelipatan 6. 8? Bukan. 16? Bukan. 24? Ya, 24 = 6 × 4.
3. Jadi KPK dari 6 dan 8 adalah **24**.

Mengapa bukan 6 × 8 = 48? Karena 48 memang kelipatan persekutuan, tetapi bukan yang **terkecil**. 24 lebih kecil dan sudah memenuhi.

## KPK tiga bilangan

Carilah KPK dari 2, 3, dan 4.

1. Kelipatan 4: 4, 8, 12, ...
2. 4 bukan kelipatan 3. 8 juga bukan kelipatan 3.
3. 12 adalah kelipatan 2, kelipatan 3, **dan** kelipatan 4.

Jadi KPK dari 2, 3, dan 4 adalah **12**. Ingat: bilangan itu harus kelipatan dari **ketiganya**, bukan hanya dua.

## Memakai KPK: jadwal berlatih

Lukas berlatih renang setiap 5 hari sekali, Asep setiap 3 hari sekali. Pada 20 Agustus mereka berlatih bersama. Kapan paling cepat mereka berlatih bersama lagi?

1. "Bersama lagi" berarti hari yang termasuk jadwal keduanya: kelipatan persekutuan.
2. "Paling cepat" berarti yang terkecil: **KPK**. KPK dari 5 dan 3 adalah 15.
3. 20 Agustus + 15 hari = "tanggal 35". Bulan Agustus hanya sampai tanggal 31, jadi 35 − 31 = 4. Tanggalnya **4 September**.

**Coba:** Dinda les piano setiap 2 hari, Amelia setiap 5 hari. Mereka les bersama pada 14 Juli. Kapan paling cepat bersama lagi?
_Periksa: KPK dari 2 dan 5 adalah 10, jadi 14 + 10 = 24 Juli._

{SUMBER}"""),
    dict(no=3, judul="Faktor",
         ringkasan="Faktor sebuah bilangan adalah bilangan yang membaginya habis, tanpa sisa.",
         tujuan="Murid dapat menentukan semua faktor sebuah bilangan dan membedakan faktor dari kelipatan.",
         bloom="Memahami",
         isi=f"""## Membagi tanpa sisa

Ibu guru punya 6 permen dan membagikannya sama banyak kepada 3 siswa. Setiap siswa mendapat 2 permen, dan tidak ada yang tersisa. Karena 6 : 3 habis, **3 adalah faktor dari 6**.

Bagaimana kalau dibagikan kepada 4 siswa? 6 : 4 = 1 sisa 2. Ada sisa, jadi **4 bukan faktor dari 6**.

Faktor sebuah bilangan adalah bilangan yang **membagi habis** bilangan itu.

## Mencari semua faktor dengan pasangan

Bayangkan selembar kertas sepanjang 12 petak yang dipotong-potong sama panjang tanpa sisa. Panjang potongan yang mungkin adalah faktor dari 12.

Cari pasangan perkalian yang hasilnya 12, mulai dari 1:

1. 1 × 12 = 12
2. 2 × 6 = 12
3. 3 × 4 = 12
4. 4 × 3 sudah ada (pasangan 3 × 4), jadi berhenti.

Faktor dari 12 adalah **1, 2, 3, 4, 6, 12**.

Dengan cara yang sama, 18 = 1 × 18 = 2 × 9 = 3 × 6, jadi faktor dari 18 adalah **1, 2, 3, 6, 9, 18**.

1 dan bilangan itu sendiri **selalu** termasuk faktor.

**Coba:** tentukan semua faktor dari 28.
_Periksa: 1 × 28, 2 × 14, 4 × 7. Faktornya 1, 2, 4, 7, 14, 28._

## Faktor dan kelipatan itu berbeda

Keduanya mudah tertukar. Bandingkan untuk bilangan 12:

| | Faktor dari 12 | Kelipatan 12 |
|---|---|---|
| Artinya | membagi habis 12 | hasil 12 × 1, 12 × 2, ... |
| Contoh | 1, 2, 3, 4, 6, 12 | 12, 24, 36, 48, ... |
| Besarnya | tidak lebih dari 12 | tidak kurang dari 12 |
| Banyaknya | ada batasnya | tidak ada habisnya |

Jadi 3 adalah **faktor** dari 12, dan 12 adalah **kelipatan** 3.

{SUMBER}"""),
    dict(no=4, judul="Faktor Persekutuan dan FPB",
         ringkasan="Faktor yang dimiliki bersama oleh dua bilangan atau lebih disebut faktor persekutuan; yang terbesar disebut FPB.",
         tujuan="Murid dapat menentukan faktor persekutuan dan FPB dari dua atau tiga bilangan, dan memakainya untuk membagi barang sama banyak.",
         bloom="Menerapkan",
         isi=f"""## Faktor bersama

- Faktor dari 12: **1, 2, 3**, 4, **6**, 12
- Faktor dari 18: **1, 2, 3, 6**, 9, 18

Bilangan 1, 2, 3, dan 6 ada di kedua daftar. Bilangan-bilangan ini disebut **faktor persekutuan** dari 12 dan 18.

Faktor persekutuan hanya bilangan yang ada di **kedua** daftar. Bilangan 4 hanya faktor dari 12, jadi tidak termasuk.

## FPB: yang paling besar

Dari 1, 2, 3, dan 6, yang paling besar adalah 6. Faktor persekutuan yang paling besar disebut **Faktor Persekutuan Terbesar**, disingkat **FPB**. Jadi FPB dari 12 dan 18 adalah **6**.

Contoh lain, 8 dan 20:

1. Faktor dari 8: 1, 2, 4, 8.
2. Faktor dari 20: 1, 2, 4, 5, 10, 20.
3. Faktor persekutuan: 1, 2, 4.
4. FPB dari 8 dan 20 adalah **4**.

## FPB tiga bilangan, dan FPB yang bernilai 1

Untuk 16, 24, dan 40, faktor persekutuannya harus ada di **ketiga** daftar: 1, 2, 4, 8. Jadi FPB-nya **8**.

Bagaimana dengan 9 dan 14? Faktor dari 9: 1, 3, 9. Faktor dari 14: 1, 2, 7, 14. Yang sama hanya 1, jadi FPB dari 9 dan 14 adalah **1**. FPB-nya tetap ada, yaitu 1, karena 1 adalah faktor dari setiap bilangan.

## Memakai FPB: membuat paket

Untuk ulang tahun, ada 36 susu kotak, 48 permen lolipop, dan 24 bungkus biskuit. Semuanya dibagi ke dalam paket dengan isi setiap paket sama, dan tidak ada yang tersisa. Paling banyak berapa paket yang bisa dibuat?

1. Banyak paket harus membagi habis 36, 48, dan 24: faktor persekutuan.
2. "Paling banyak" berarti yang terbesar: **FPB**. FPB dari 36, 48, dan 24 adalah 12.
3. Jadi ada **12 paket**. Setiap paket berisi 36 : 12 = 3 susu, 48 : 12 = 4 permen, dan 24 : 12 = 2 biskuit.

Perhatikan pertanyaannya: banyak **paket** adalah 12, sedangkan **isi** setiap paket adalah 3, 4, dan 2.

{SUMBER}"""),
    dict(no=5, judul="Bilangan Prima dan Faktorisasi Prima",
         ringkasan="Bilangan prima tepat mempunyai dua faktor; setiap bilangan lain dapat ditulis sebagai perkalian bilangan prima.",
         tujuan="Murid dapat menentukan bilangan prima di bawah 100 dan menuliskan faktorisasi prima sebuah bilangan dengan pohon faktor.",
         bloom="Menerapkan",
         isi=f"""## Bilangan yang faktornya hanya dua

Perhatikan banyak faktor bilangan 1 sampai 10:

| Bilangan | Faktor | Banyak faktor |
|---|---|---|
| 1 | 1 | 1 |
| 2 | 1, 2 | 2 |
| 3 | 1, 3 | 2 |
| 4 | 1, 2, 4 | 3 |
| 5 | 1, 5 | 2 |
| 6 | 1, 2, 3, 6 | 4 |
| 7 | 1, 7 | 2 |
| 8 | 1, 2, 4, 8 | 4 |
| 9 | 1, 3, 9 | 3 |
| 10 | 1, 2, 5, 10 | 4 |

Bilangan 2, 3, 5, dan 7 **tepat mempunyai dua faktor**: 1 dan bilangan itu sendiri. Bilangan seperti ini disebut **bilangan prima**.

1 bukan bilangan prima, karena faktornya hanya satu.

## Saringan Eratosthenes

Untuk menemukan semua bilangan prima sampai 100, tulis bilangan 1 sampai 100, lalu:

1. Coret 1.
2. Lingkari 2, lalu coret semua kelipatan 2 yang lain (4, 6, 8, ...).
3. Lingkari 3, lalu coret semua kelipatan 3 yang lain.
4. Lakukan hal yang sama untuk 5 dan 7.
5. Semua bilangan yang tidak tercoret adalah bilangan prima.

Hasilnya ada 25 bilangan prima di bawah 100:
2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97.

2 adalah satu-satunya bilangan prima yang genap. Tetapi tidak semua bilangan ganjil adalah prima: 9 = 3 × 3, 21 = 3 × 7, 51 = 3 × 17, dan 91 = 7 × 13.

## Pohon faktor

Setiap bilangan yang bukan prima dapat ditulis sebagai perkalian bilangan prima. Tulisan ini disebut **faktorisasi prima**. Kita mencarinya dengan **pohon faktor**.

Faktorisasi prima dari 60:

1. Bagi dengan bilangan prima terkecil yang membagi habis: 60 = 2 × 30.
2. 30 belum prima. 30 = 2 × 15.
3. 15 belum prima. 15 = 3 × 5.
4. 3 dan 5 sudah prima, jadi berhenti.

Faktorisasi prima dari 60 adalah **2 × 2 × 3 × 5**. Periksa: 2 × 2 × 3 × 5 = 60.

Menulis 60 = 4 × 15 belum selesai, karena 4 dan 15 bukan bilangan prima.

**Coba:** buat pohon faktor untuk 70.
_Periksa: 70 = 2 × 35 dan 35 = 5 × 7, jadi 70 = 2 × 5 × 7._

{SUMBER}"""),
    dict(no=6, judul="KPK dan FPB dengan Faktorisasi Prima",
         ringkasan="KPK dan FPB dapat dicari dari faktorisasi prima, lalu dipakai untuk memecahkan masalah sehari-hari.",
         tujuan="Murid dapat menentukan KPK dan FPB dengan faktorisasi prima serta memilih KPK atau FPB untuk memecahkan masalah sehari-hari.",
         bloom="Menganalisis",
         isi=f"""## FPB dari faktorisasi prima

Carilah FPB dari 42 dan 60.

1. Tulis faktorisasi primanya: 42 = 2 × 3 × 7 dan 60 = 2 × 2 × 3 × 5.
2. Pasangkan faktor prima yang ada di **keduanya**: satu 2 dan satu 3.
3. Kalikan pasangan itu, masing-masing **sekali**: 2 × 3 = 6.

FPB dari 42 dan 60 adalah **6**.

## KPK dari faktorisasi prima

Carilah KPK dari 42 dan 60.

1. Ambil **semua** faktor prima yang muncul. Faktor yang berpasangan cukup ditulis sekali.
2. Dari 60: 2 × 2 × 3 × 5. Dari 42 masih ada 7 yang belum ikut.
3. KPK = 2 × 2 × 3 × 5 × 7 = **420**.

Periksa: 420 : 42 = 10 dan 420 : 60 = 7, keduanya habis.

## Hati-hati dengan faktor yang sama

Ambil 36 = 2 × 2 × 3 × 3 dan 108 = 2 × 2 × 3 × 3 × 3. Jawaban yang tepat: FPB = 36 dan KPK = 108.

- Bila untuk KPK hanya faktor yang **berpasangan** yang dikalikan, hasilnya 2 × 2 × 3 × 3 = 36. Itu FPB, bukan KPK.
- Bila untuk KPK **semua** faktor dari keduanya dikalikan, hasilnya 3.888, terlalu besar.
- Bila untuk FPB pasangan ditulis **dua kali**, hasilnya 1.296, juga terlalu besar.

Ingat: pasangan cukup ditulis sekali. FPB memakai pasangannya saja; KPK memakai pasangannya ditambah semua sisanya.

## Tiga bilangan

24 = 2 × 2 × 2 × 3, 36 = 2 × 2 × 3 × 3, dan 60 = 2 × 2 × 3 × 5.

- Faktor yang ada di ketiganya: 2 × 2 × 3, jadi **FPB = 12**.
- KPK: 2 × 2 × 2 (dari 24) × 3 × 3 (dari 36) × 5 (dari 60) = **360**.

## KPK atau FPB?

Baca pertanyaannya dengan teliti.

- **KPK** dipakai bila sesuatu terjadi berulang dan ditanyakan kapan **bersamaan lagi**, paling cepat.
- **FPB** dipakai bila barang **dibagi rata** tanpa sisa dan ditanyakan **paling banyak** bagian atau kelompok.

Contoh FPB: 18 siswa laki-laki dan 12 siswa perempuan dibagi ke kelompok yang sama susunannya. FPB dari 18 dan 12 adalah 6, jadi paling banyak **6 kelompok**, masing-masing 3 laki-laki dan 2 perempuan.

Contoh KPK: tiga lampu lalu lintas menyala merah setiap 15, 24, dan 36 detik, dan menyala bersamaan pukul 15.30. KPK dari 15, 24, dan 36 adalah 360 detik = 6 menit. Mereka bersamaan lagi pukul **15.36**.

## Rangkuman Bab 2

- **Kelipatan**: hasil kali bilangan itu dengan 1, 2, 3, ... **Faktor**: bilangan yang membaginya habis.
- **KPK**: kelipatan persekutuan yang terkecil. **FPB**: faktor persekutuan yang terbesar.
- **Bilangan prima** tepat mempunyai dua faktor. 1 bukan bilangan prima.
- **Faktorisasi prima** ditulis sampai semua faktornya prima.
- Dengan faktorisasi prima: FPB dari pasangannya, KPK dari pasangannya ditambah semua sisanya.
- Bersamaan lagi: **KPK**. Dibagi rata sebanyak-banyaknya: **FPB**.

{SUMBER}"""),
]

for _p in PELAJARAN:
    cek(3 <= _p["isi"].count("\n## ") + _p["isi"].startswith("## ") <= 6, f"lesson {_p['no']}: 3-6 pages")
    cek(_p["isi"].rstrip().endswith(SUMBER), f"lesson {_p['no']}: attribution last")

# ── Misconceptions. The first seven and codes 09/10 come from the book's own Miskonsepsi sections
# (pp. 58, 74, 83-84); the rest from the reasoning behind this chapter's distractors.
MISKONSEPSI = {
    "SD5-M-B2-01": ("Faktor dan kelipatan tertukar",
                    "Diminta faktor, murid menuliskan kelipatan, atau sebaliknya.",
                    "Tanyakan: apakah bilangan ini membagi habis (faktor) atau hasil kali (kelipatan)? Faktor tidak lebih besar dari bilangannya, kelipatan tidak lebih kecil."),
    "SD5-M-B2-02": ("KPK dan FPB tertukar",
                    "Yang dicari KPK, tetapi murid menghitung FPB, atau sebaliknya.",
                    "Hubungkan huruf tengahnya dengan maknanya: Kelipatan-Terkecil dan Faktor-Terbesar, lalu periksa apakah jawabannya lebih besar (KPK) atau lebih kecil (FPB) dari bilangan-bilangannya."),
    "SD5-M-B2-03": ("KPK dianggap hasil kali",
                    "KPK dua bilangan dianggap selalu sama dengan hasil kali keduanya. Hasil kali memang kelipatan persekutuan, tetapi belum tentu yang terkecil.",
                    "Daftar kelipatan bilangan yang lebih besar dan periksa satu per satu; tunjukkan bahwa KPK dari 6 dan 8 adalah 24, lebih kecil dari 6 × 8."),
    "SD5-M-B2-04": ("Tidak semua bilangan diperiksa",
                    "Kelipatan atau faktor persekutuan hanya diperiksa pada sebagian bilangan, misalnya dua dari tiga bilangan.",
                    "Tulis daftar untuk setiap bilangan dalam kolom sendiri dan centang hanya bilangan yang muncul di semua kolom."),
    "SD5-M-B2-05": ("KPK hanya dari faktor yang sama",
                    "Dengan faktorisasi prima, KPK dihitung hanya dari faktor prima yang berpasangan, sehingga hasilnya sebenarnya FPB.",
                    "Setelah memasangkan faktor yang sama, tanyakan: faktor mana yang belum ikut? Semua sisanya harus dikalikan juga untuk KPK."),
    "SD5-M-B2-06": ("Semua faktor prima dikalikan",
                    "Untuk KPK, semua faktor prima dari kedua bilangan dikalikan, sehingga faktor yang berpasangan terhitung dua kali.",
                    "Coret setiap pasangan faktor yang sama menjadi satu sebelum mengalikan, lalu periksa apakah hasilnya dibagi habis oleh kedua bilangan dan tidak ada kelipatan yang lebih kecil."),
    "SD5-M-B2-07": ("Pasangan FPB ditulis dua kali",
                    "Untuk FPB, faktor prima yang berpasangan ditulis dari kedua bilangan, sehingga FPB lebih besar dari bilangan-bilangannya.",
                    "Ingatkan bahwa FPB tidak mungkin lebih besar dari bilangan terkecil; setiap pasangan cukup ditulis sekali."),
    "SD5-M-B2-08": ("Daftar faktor tidak lengkap",
                    "Sebagian faktor terlewat, sering 1, bilangan itu sendiri, atau salah satu anggota pasangan perkalian.",
                    "Cari faktor berpasangan mulai dari 1 × bilangan itu, naik satu per satu sampai pasangan berulang, dan tulis kedua anggota setiap pasangan."),
    "SD5-M-B2-09": ("Bilangan ganjil dianggap prima",
                    "Bilangan ganjil dianggap pasti prima, misalnya 9, 21, 39, 51, atau 91.",
                    "Minta murid mencoba membagi dengan 3, 5, dan 7 sebelum menyebut bilangan ganjil sebagai prima; pakai saringan Eratosthenes sebagai pemeriksa."),
    "SD5-M-B2-10": ("Faktorisasi belum sampai prima",
                    "Pohon faktor dihentikan pada bilangan yang belum prima, misalnya 72 = 8 × 9.",
                    "Periksa setiap ujung pohon faktor: bila masih mempunyai faktor lain selain 1 dan dirinya, cabang itu harus diteruskan."),
    "SD5-M-B2-11": ("Bukan yang terkecil atau terbesar",
                    "Yang dipilih kelipatan persekutuan yang bukan terkecil, atau faktor persekutuan yang bukan terbesar.",
                    "Daftar semua kelipatan atau faktor persekutuan dulu, lalu lingkari yang paling kecil (KPK) atau paling besar (FPB)."),
    "SD5-M-B2-12": ("Jawaban bukan yang ditanyakan",
                    "Hasil hitungan yang benar diberikan sebagai jawaban, padahal pertanyaannya meminta hal lain (misalnya banyak kelompok, bukan isi kelompok), atau ada syarat soal yang terlewat.",
                    "Minta murid menggarisbawahi yang ditanyakan dan menulis kalimat jawaban lengkap dengan satuannya sebelum memilih."),
    "SD5-M-B2-13": ("Waktu tidak dikonversi",
                    "Hari ditambahkan melewati akhir bulan (misalnya tanggal 35), atau detik dan menit tidak diubah (misalnya pukul 20.60).",
                    "Ingatkan jumlah hari setiap bulan dan 1 menit = 60 detik; periksa apakah tanggal atau jam hasilnya benar-benar ada."),
    "SD5-M-B2-14": ("FPB 1 dianggap tidak ada",
                    "Dua bilangan yang faktor persekutuannya hanya 1 dianggap tidak mempunyai FPB.",
                    "Tunjukkan bahwa 1 membagi habis setiap bilangan, jadi selalu ada faktor persekutuan, dan FPB-nya 1."),
    "SD5-M-B2-15": ("Faktor prima berulang terlewat",
                    "Faktor prima yang muncul lebih dari sekali hanya ditulis sekali, sehingga hasil perkaliannya tidak kembali ke bilangan semula.",
                    "Biasakan mengalikan kembali semua faktor prima untuk memeriksa bahwa hasilnya sama dengan bilangan semula."),
    "SD5-M-B2-16": ("1 dianggap prima",
                    "Bilangan 1 dianggap bilangan prima.",
                    "Hitung banyak faktor 1 bersama murid: hanya satu. Bilangan prima tepat mempunyai dua faktor."),
    "SD5-M-B2-17": ("Kelipatan dikenali dari angkanya",
                    "Bilangan yang memuat atau berakhiran angka tertentu dianggap kelipatan angka itu, misalnya 27 dianggap kelipatan 7.",
                    "Periksa dengan pembagian: kelipatan 7 dibagi 7 habis. Bandingkan 27 : 7 dan 28 : 7."),
    "SD5-M-B2-18": ("Kelipatan tidak dimulai dari bilangannya",
                    "Kelipatan dihitung dengan menambah bilangan itu mulai dari bilangan lain, sehingga hasilnya tidak habis dibagi.",
                    "Mulailah dari bilangan itu sendiri (atau dari hasil kali dalam tabel perkalian), lalu tambahkan bilangan yang sama setiap langkah."),
    "SD5-M-B2-19": ("Gabungan dianggap persekutuan",
                    "Semua faktor dari kedua bilangan digabung, padahal faktor persekutuan hanya yang ada di keduanya.",
                    "Tulis faktor kedua bilangan berdampingan dan lingkari hanya yang muncul di kedua daftar."),
    "SD5-M-B2-20": ("Faktor prima dijumlahkan",
                    "Faktor-faktor prima dijumlahkan, bukan dikalikan, untuk mendapatkan bilangannya.",
                    "Ingatkan bahwa tanda × pada faktorisasi berarti perkalian, lalu hitung bersama: 2 × 3 = 6, bukan 5."),
    "SD5-M-B2-21": ("Pembagian bersisa dianggap faktor",
                    "Bilangan yang tidak membagi habis dianggap faktor karena tidak dicek sisanya.",
                    "Minta murid menulis pembagiannya dan memeriksa sisa; faktor selalu menghasilkan sisa 0."),
}

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


def daftar(xs):
    return ", ".join(str(x) for x in xs)


# ── Pemetaan awal (pre-test): multiples, factors, primes and a first common multiple, one each.
cek(42 % 7 == 0 and 27 % 7 and 72 % 7 and 7 % 1 == 0 and 1 in faktor(7))
soal("PA1", 1, "Bilangan manakah yang merupakan kelipatan 7?", [
    ("27", False, "27 berakhiran 7, tetapi 27 : 7 = 3 sisa 6. Kelipatan 7 dibagi 7 selalu habis.", "SD5-M-B2-17"),
    ("42", True, "Benar. 42 = 7 × 6, jadi 42 : 7 habis.", ""),
    ("1", False, "1 adalah faktor dari 7 (membagi habis 7), bukan kelipatannya. Kelipatan 7 dimulai dari 7.", "SD5-M-B2-01"),
    ("72", False, "72 memuat angka 7, tetapi 72 : 7 = 10 sisa 2. Kelipatan ditentukan pembagian, bukan angkanya.", "SD5-M-B2-17"),
], guna="Pemetaan awal")
cek(faktor(12) == [1, 2, 3, 4, 6, 12] and 12 * 4 == 48 and 12 % 5 == 2)
soal("PA2", 3, "Semua faktor dari 12 adalah ...", [
    ("12, 24, 36, 48", False, "Ini kelipatan 12, hasil 12 × 1, 12 × 2, ... Faktor adalah bilangan yang membagi habis 12.", "SD5-M-B2-01"),
    ("1, 2, 3, 4, 5, 6, 12", False, "5 bukan faktor dari 12: 12 : 5 = 2 sisa 2. Faktor harus membagi habis.", "SD5-M-B2-21"),
    ("1, 2, 4, 6, 12", False, "3 terlewat, padahal 3 × 4 = 12. Cari pasangan perkalian satu per satu: 1 × 12, 2 × 6, 3 × 4.", "SD5-M-B2-08"),
    ("1, 2, 3, 4, 6, 12", True, "Benar. Pasangannya 1 × 12, 2 × 6, dan 3 × 4.", ""),
], guna="Pemetaan awal")
cek(prima(13) and not prima(1) and not prima(9) and not prima(21))
soal("PA3", 5, "Manakah yang merupakan bilangan prima?", [
    ("1", False, "1 hanya mempunyai satu faktor. Bilangan prima tepat mempunyai dua faktor.", "SD5-M-B2-16"),
    ("9", False, "9 ganjil, tetapi 9 = 3 × 3, jadi faktornya 1, 3, 9. Tidak semua bilangan ganjil prima.", "SD5-M-B2-09"),
    ("13", True, "Benar. Faktor dari 13 hanya 1 dan 13.", ""),
    ("21", False, "21 ganjil, tetapi 21 = 3 × 7, jadi faktornya lebih dari dua.", "SD5-M-B2-09"),
], guna="Pemetaan awal")
cek(kpk(4, 6) == 12 and 4 * 6 == 24 and fpb(4, 6) == 2 and 48 % 4 == 0 and 48 % 6 == 0)
soal("PA4", 2, "Kelipatan persekutuan terkecil dari 4 dan 6 adalah ...", [
    ("24", False, "4 × 6 = 24 memang kelipatan keduanya, tetapi 12 lebih kecil dan juga kelipatan keduanya.", "SD5-M-B2-03"),
    ("2", False, "2 adalah faktor persekutuan terbesar (FPB) dari 4 dan 6. Kelipatan tidak lebih kecil dari bilangannya.", "SD5-M-B2-02"),
    ("12", True, "Benar. Kelipatan 6: 6, 12. 6 bukan kelipatan 4, tetapi 12 kelipatan 4.", ""),
    ("48", False, "48 kelipatan 4 dan 6, tetapi bukan yang terkecil. 12 dan 24 lebih kecil.", "SD5-M-B2-11"),
], guna="Pemetaan awal")

# ── Cek penguasaan (post-test): every chapter objective, fresh numbers and situations.
cek(kpk(8, 12) == 24 and 8 * 12 == 96 and fpb(8, 12) == 4 and 48 % 8 == 0 and 48 % 12 == 0)
soal("PB1", 2, "KPK dari 8 dan 12 adalah ...", [
    ("48", False, "48 kelipatan 8 dan 12, tetapi bukan yang terkecil. 24 juga kelipatan keduanya.", "SD5-M-B2-11"),
    ("96", False, "8 × 12 = 96 memang kelipatan keduanya, tetapi 24 lebih kecil.", "SD5-M-B2-03"),
    ("24", True, "Benar. Kelipatan 12: 12, 24. 12 bukan kelipatan 8, tetapi 24 = 8 × 3.", ""),
    ("4", False, "4 adalah FPB dari 8 dan 12. KPK tidak mungkin lebih kecil dari bilangan-bilangannya.", "SD5-M-B2-02"),
], guna="Cek penguasaan", sulit="Sedang")
cek(faktor(45) == [1, 3, 5, 9, 15, 45] and 45 % 7 == 3)
soal("PB2", 3, "Semua faktor dari 45 adalah ...", [
    ("1, 3, 5, 9, 15, 45", True, "Benar. Pasangannya 1 × 45, 3 × 15, dan 5 × 9.", ""),
    ("45, 90, 135, 180", False, "Ini kelipatan 45. Faktor adalah bilangan yang membagi habis 45.", "SD5-M-B2-01"),
    ("3, 5, 9, 15", False, "1 dan 45 terlewat. Setiap bilangan mempunyai faktor 1 dan dirinya sendiri.", "SD5-M-B2-08"),
    ("1, 3, 5, 7, 9, 15, 45", False, "7 bukan faktor: 45 : 7 = 6 sisa 3.", "SD5-M-B2-21"),
], guna="Cek penguasaan")
cek(fpb(32, 40) == 8 and kpk(32, 40) == 160 and sorted(set(faktor(32)) & set(faktor(40))) == [1, 2, 4, 8])
soal("PB3", 4, "FPB dari 32 dan 40 adalah ...", [
    ("160", False, "160 adalah KPK dari 32 dan 40. FPB tidak mungkin lebih besar dari bilangan-bilangannya.", "SD5-M-B2-02"),
    ("4", False, "4 adalah faktor persekutuan, tetapi bukan yang terbesar. Faktor persekutuannya 1, 2, 4, 8.", "SD5-M-B2-11"),
    ("2", False, "2 hanya faktor persekutuan pertama sesudah 1. Yang terbesar adalah 8.", "SD5-M-B2-11"),
    ("8", True, "Benar. Faktor persekutuan 32 dan 40 adalah 1, 2, 4, 8, dan yang terbesar 8.", ""),
], guna="Cek penguasaan", sulit="Sedang")
cek(all(prima(n) for n in (2, 29, 53, 71)) and 1 in (1, 13, 37, 59) and 51 == 3 * 17 and 91 == 7 * 13)
soal("PB4", 5, "Kelompok bilangan manakah yang semuanya bilangan prima?", [
    ("1, 13, 37, 59", False, "1 bukan bilangan prima karena faktornya hanya satu.", "SD5-M-B2-16"),
    ("3, 17, 51, 83", False, "51 ganjil, tetapi 51 = 3 × 17, jadi bukan prima.", "SD5-M-B2-09"),
    ("2, 29, 53, 71", True, "Benar. Masing-masing hanya mempunyai faktor 1 dan dirinya sendiri. 2 adalah prima yang genap.", ""),
    ("7, 23, 41, 91", False, "91 ganjil, tetapi 91 = 7 × 13, jadi bukan prima.", "SD5-M-B2-09"),
], guna="Cek penguasaan", sulit="Sedang")
cek(faktorisasi(84) == [2, 2, 3, 7] and 2 * 42 == 84 and 4 * 3 * 7 == 84 and 2 * 3 * 7 == 42)
soal("PB5", 5, "Faktorisasi prima dari 84 adalah ...", [
    ("2 × 42", False, "Pohon faktornya berhenti terlalu cepat: 42 belum prima (42 = 2 × 3 × 7).", "SD5-M-B2-10"),
    ("2 × 2 × 3 × 7", True, "Benar. 84 = 2 × 42, 42 = 2 × 21, 21 = 3 × 7. Periksa: 2 × 2 × 3 × 7 = 84.", ""),
    ("2 × 2 × 3 × 7 × 1", False, "1 ikut ditulis seolah bilangan prima. 1 bukan prima, jadi tidak termasuk faktorisasi prima.", "SD5-M-B2-16"),
    ("2 × 3 × 7", False, "Faktor 2 muncul dua kali tetapi hanya ditulis sekali. 2 × 3 × 7 = 42, bukan 84.", "SD5-M-B2-15"),
], guna="Cek penguasaan", sulit="Sedang")
cek(faktorisasi(28) == [2, 2, 7] and faktorisasi(42) == [2, 3, 7] and kpk(28, 42) == 84 and fpb(28, 42) == 14)
cek(2 * 2 * 7 * 2 * 3 * 7 == 1_176 == 28 * 42 and 2 * 2 * 3 * 7 * 7 == 588)
soal("PB6", 6, "28 = 2 × 2 × 7 dan 42 = 2 × 3 × 7. KPK dari 28 dan 42 adalah ...", [
    ("14", False, "Hanya pasangan faktor yang sama (2 dan 7) yang dikalikan; itu FPB. KPK juga memakai sisa faktornya (2 dan 3).", "SD5-M-B2-05"),
    ("588", False, "Faktor 7 yang berpasangan ditulis dua kali: 2 × 2 × 3 × 7 × 7. Pasangan cukup ditulis sekali.", "SD5-M-B2-06"),
    ("1.176", False, "Semua faktor dari kedua bilangan dikalikan; hasilnya 28 × 42. Itu kelipatan persekutuan, tetapi bukan yang terkecil.", "SD5-M-B2-03"),
    ("84", True, "Benar. Pasangan 2 dan 7 ditulis sekali, ditambah sisanya 2 dan 3: 2 × 2 × 3 × 7 = 84.", ""),
], guna="Cek penguasaan", sulit="Sedang")
cek(kpk(6, 9) == 18 and fpb(6, 9) == 3 and 14 + 18 == 32 and tanggal(3, 14, 18) == date(2022, 4, 1) and 14 + 3 == 17)
soal("PB7", 6, "Rina menyiram tanaman setiap 6 hari sekali dan memberi pupuk setiap 9 hari sekali. Pada 14 Maret ia melakukan keduanya. Paling cepat, kapan ia menyiram dan memberi pupuk bersamaan lagi?", [
    ("32 Maret", False, "KPK-nya benar (18 hari), tetapi Maret hanya sampai tanggal 31. 32 − 31 = 1, jadi tanggal 1 bulan berikutnya.", "SD5-M-B2-13"),
    ("17 Maret", False, "Yang ditambahkan FPB dari 6 dan 9, yaitu 3. Bersamaan lagi paling cepat memakai KPK.", "SD5-M-B2-02"),
    ("1 April", True, "Benar. KPK dari 6 dan 9 adalah 18. 14 Maret + 18 hari = 1 April.", ""),
    ("18 Maret", False, "18 adalah banyak hari sampai bersamaan lagi, bukan tanggalnya. 18 hari harus ditambahkan ke 14 Maret.", "SD5-M-B2-12"),
], guna="Cek penguasaan", sulit="Sedang")
cek(fpb(30, 45) == 15 and (30 // 15, 45 // 15) == (2, 3) and (30 // 5, 45 // 5) == (6, 9) and (30 // 3, 45 // 3) == (10, 15))
soal("PB8", 6, "Bu Sari mempunyai 30 jeruk dan 45 salak. Semua buah dimasukkan ke kantong sehingga setiap kantong berisi jeruk sama banyak dan salak sama banyak, dengan kantong sebanyak mungkin. Berapa isi setiap kantong?", [
    ("2 jeruk dan 3 salak", True, "Benar. FPB dari 30 dan 45 adalah 15 kantong; setiap kantong berisi 30 : 15 = 2 jeruk dan 45 : 15 = 3 salak.", ""),
    ("15 jeruk dan 15 salak", False, "15 adalah banyak kantong (FPB dari 30 dan 45), bukan isinya. Isinya 30 : 15 dan 45 : 15.", "SD5-M-B2-12"),
    ("10 jeruk dan 15 salak", False, "Buahnya dibagi ke 3 kantong, faktor persekutuan terkecil selain 1. Kantong sebanyak mungkin memakai FPB, yaitu 15.", "SD5-M-B2-11"),
    ("6 jeruk dan 9 salak", False, "Buahnya dibagi ke 5 kantong. 5 memang faktor persekutuan, tetapi bukan yang terbesar.", "SD5-M-B2-11"),
], guna="Cek penguasaan", sulit="Sulit")

# ── Latihan (practice), by lesson, from direct use toward a little more reasoning.
cek([n for n in range(41, 60) if n % 9 == 0] == [45, 54] and 63 > 60 and 49 % 9 and 59 % 9 and 42 % 9 and 51 % 9)
soal("LT1", 1, "Kelipatan 9 yang terletak di antara 40 dan 60 adalah ...", [
    ("49 dan 59", False, "Bilangan yang berakhiran 9 belum tentu kelipatan 9: 49 : 9 = 5 sisa 4.", "SD5-M-B2-17"),
    ("45, 54, dan 63", False, "45 dan 54 tepat, tetapi 63 lebih dari 60, jadi tidak di antara 40 dan 60.", "SD5-M-B2-12"),
    ("45 dan 54", True, "Benar. 9 × 5 = 45 dan 9 × 6 = 54; 9 × 7 = 63 sudah lebih dari 60.", ""),
    ("42 dan 51", False, "Dihitung dengan menambah 9 mulai dari 42, padahal 42 bukan kelipatan 9. Mulailah dari 9, 18, 27, ...", "SD5-M-B2-18"),
])
cek(56 == 7 * 8 and 56 % 6 and 56 % 5 and 112 == 2 * 56)
soal("LT2", 1, "56 adalah kelipatan dari ...", [
    ("6", False, "56 berakhiran 6, tetapi 56 : 6 = 9 sisa 2.", "SD5-M-B2-17"),
    ("112", False, "Terbalik: 112 adalah kelipatan 56, sedangkan 56 adalah faktor dari 112.", "SD5-M-B2-01"),
    ("5", False, "56 diawali angka 5, tetapi 56 : 5 = 11 sisa 1.", "SD5-M-B2-17"),
    ("7", True, "Benar. 7 × 8 = 56.", ""),
])
cek([n for n in range(1, 30) if n % 3 == 0 and n % 4 == 0] == [12, 24] and 36 > 30 and 6 % 4 and fpb(3, 4) == 1)
soal("LT3", 2, "Kelipatan persekutuan dari 3 dan 4 yang kurang dari 30 adalah ...", [
    ("12 dan 24", True, "Benar. 12 dan 24 adalah kelipatan 3 dan juga kelipatan 4; berikutnya 36, sudah lebih dari 30.", ""),
    ("12, 24, dan 36", False, "36 memang kelipatan persekutuan, tetapi lebih dari 30.", "SD5-M-B2-12"),
    ("6 dan 12", False, "6 kelipatan 3, tetapi bukan kelipatan 4. Kelipatan persekutuan harus kelipatan keduanya.", "SD5-M-B2-04"),
    ("3, 4, 12, dan 24", False, "3 hanya kelipatan 3 dan 4 hanya kelipatan 4. Kelipatan persekutuan harus kelipatan keduanya.", "SD5-M-B2-04"),
])
cek(kpk(6, 10) == 30 and 6 * 10 == 60 and fpb(6, 10) == 2 and 120 % 6 == 0 and 120 % 10 == 0)
soal("LT4", 2, "KPK dari 6 dan 10 adalah ...", [
    ("2", False, "2 adalah FPB dari 6 dan 10. KPK tidak lebih kecil dari bilangan-bilangannya.", "SD5-M-B2-02"),
    ("30", True, "Benar. Kelipatan 10: 10, 20, 30. 30 adalah kelipatan 6 yang pertama di daftar itu.", ""),
    ("60", False, "6 × 10 = 60 kelipatan keduanya, tetapi 30 lebih kecil.", "SD5-M-B2-03"),
    ("120", False, "120 kelipatan persekutuan, tetapi jauh dari yang terkecil.", "SD5-M-B2-11"),
])
cek(kpk(4, 6, 9) == 36 and kpk(4, 6) == 12 and kpk(6, 9) == 18 and 4 * 6 * 9 == 216 and 12 % 9 and 18 % 4)
soal("LT5", 2, "KPK dari 4, 6, dan 9 adalah ...", [
    ("12", False, "12 kelipatan 4 dan 6, tetapi bukan kelipatan 9. Periksa ketiga bilangan.", "SD5-M-B2-04"),
    ("18", False, "18 kelipatan 6 dan 9, tetapi bukan kelipatan 4. Periksa ketiga bilangan.", "SD5-M-B2-04"),
    ("216", False, "4 × 6 × 9 = 216 kelipatan ketiganya, tetapi bukan yang terkecil.", "SD5-M-B2-03"),
    ("36", True, "Benar. Kelipatan 9: 9, 18, 27, 36. 36 kelipatan 4 dan 6 juga.", ""),
], sulit="Sedang", petunjuk="Tulis kelipatan bilangan terbesar, lalu periksa setiap bilangan pada ketiganya.")
cek(kpk(3, 4) == 12 and tanggal(7, 25, 12) == date(2022, 8, 6) and 25 + 12 == 37 and 37 - 30 == 7 and 25 + fpb(3, 4) == 26)
soal("LT6", 2, "Dayu les tari setiap 3 hari sekali, Made les gamelan setiap 4 hari sekali. Pada 25 Juli mereka les bersamaan. Paling cepat, kapan mereka les bersamaan lagi?", [
    ("37 Juli", False, "KPK-nya tepat (12 hari), tetapi Juli hanya sampai tanggal 31. Tanggalnya pindah ke Agustus.", "SD5-M-B2-13"),
    ("6 Agustus", True, "Benar. KPK dari 3 dan 4 adalah 12. 25 + 12 = 37, dan 37 − 31 = 6, jadi 6 Agustus.", ""),
    ("7 Agustus", False, "Juli dianggap 30 hari (37 − 30 = 7). Bulan Juli mempunyai 31 hari.", "SD5-M-B2-13"),
    ("26 Juli", False, "Yang ditambahkan FPB dari 3 dan 4, yaitu 1. Bersamaan lagi memakai KPK.", "SD5-M-B2-02"),
], sulit="Sedang")
cek(faktor(30) == [1, 2, 3, 5, 6, 10, 15, 30] and 30 % 4 == 2)
soal("LT7", 3, "Semua faktor dari 30 adalah ...", [
    ("1, 2, 3, 5, 6, 10, 15", False, "30 sendiri terlewat. 1 × 30 = 30, jadi 30 juga faktornya.", "SD5-M-B2-08"),
    ("30, 60, 90, 120", False, "Ini kelipatan 30. Faktor adalah bilangan yang membagi habis 30.", "SD5-M-B2-01"),
    ("1, 2, 3, 5, 6, 10, 15, 30", True, "Benar. Pasangannya 1 × 30, 2 × 15, 3 × 10, 5 × 6.", ""),
    ("1, 2, 3, 4, 5, 6, 10, 15, 30", False, "4 bukan faktor dari 30: 30 : 4 = 7 sisa 2.", "SD5-M-B2-21"),
])
cek(20 % 5 == 0 and 20 % 3 == 2 and 20 % 6 == 2 and 40 == 2 * 20)
soal("LT8", 3, "Pak Rudi ingin membagikan 20 kue sama banyak tanpa sisa. Banyak anak yang mungkin menerima kue adalah ...", [
    ("3 anak", False, "20 : 3 = 6 sisa 2. Ada kue yang tersisa, jadi 3 bukan faktor dari 20.", "SD5-M-B2-21"),
    ("5 anak", True, "Benar. 20 : 5 = 4, setiap anak mendapat 4 kue tanpa sisa.", ""),
    ("6 anak", False, "20 : 6 = 3 sisa 2. Ada kue yang tersisa.", "SD5-M-B2-21"),
    ("40 anak", False, "40 adalah kelipatan 20, bukan faktornya. 20 kue tidak cukup untuk 40 anak.", "SD5-M-B2-01"),
])
cek(sorted(set(faktor(16)) & set(faktor(24))) == [1, 2, 4, 8] and sorted(set(faktor(16)) | set(faktor(24))) == [1, 2, 3, 4, 6, 8, 12, 16, 24] and kpk(16, 24) == 48)
soal("LT9", 4, "Faktor persekutuan dari 16 dan 24 adalah ...", [
    ("2, 4, 8", False, "1 terlewat. 1 adalah faktor dari setiap bilangan, jadi selalu termasuk faktor persekutuan.", "SD5-M-B2-08"),
    ("48, 96, 144", False, "Ini kelipatan persekutuan dari 16 dan 24, bukan faktornya.", "SD5-M-B2-01"),
    ("1, 2, 3, 4, 6, 8, 12, 16, 24", False, "Ini semua faktor dari 16 atau 24, digabung. 3, 6, 12, dan 24 bukan faktor dari 16, dan 16 bukan faktor dari 24.", "SD5-M-B2-19"),
    ("1, 2, 4, 8", True, "Benar. Faktor dari 16: 1, 2, 4, 8, 16. Faktor dari 24: 1, 2, 3, 4, 6, 8, 12, 24. Yang ada di keduanya 1, 2, 4, 8.", ""),
])
cek(fpb(18, 27) == 9 and kpk(18, 27) == 54 and 27 % 6 and 18 % 3 == 0 and 27 % 3 == 0)
soal("LT10", 4, "FPB dari 18 dan 27 adalah ...", [
    ("9", True, "Benar. Faktor persekutuannya 1, 3, 9, dan yang terbesar 9.", ""),
    ("54", False, "54 adalah KPK dari 18 dan 27. FPB tidak lebih besar dari bilangan-bilangannya.", "SD5-M-B2-02"),
    ("3", False, "3 faktor persekutuan, tetapi bukan yang terbesar; 9 juga membagi habis keduanya.", "SD5-M-B2-11"),
    ("6", False, "6 adalah faktor dari 18, tetapi bukan faktor dari 27 (27 : 6 = 4 sisa 3).", "SD5-M-B2-04"),
])
cek(fpb(12, 18, 30) == 6 and kpk(12, 18, 30) == 180 and 18 % 12 and 30 % 12)
soal("LT11", 4, "FPB dari 12, 18, dan 30 adalah ...", [
    ("180", False, "180 adalah KPK dari ketiga bilangan itu.", "SD5-M-B2-02"),
    ("6", True, "Benar. Faktor persekutuan ketiganya 1, 2, 3, 6, dan yang terbesar 6.", ""),
    ("3", False, "3 faktor persekutuan ketiganya, tetapi bukan yang terbesar.", "SD5-M-B2-11"),
    ("12", False, "12 adalah bilangan terkecil, tetapi 12 bukan faktor dari 18 dan 30.", "SD5-M-B2-04"),
], sulit="Sedang")
cek(fpb(24, 32) == 8 and kpk(24, 32) == 96 and 24 // 8 == 3 and 32 // 8 == 4 and 4 in set(faktor(24)) & set(faktor(32)))
soal("LT12", 4, "Kakak mempunyai 24 pensil dan 32 buku tulis. Semuanya dibagikan kepada beberapa anak sehingga setiap anak mendapat pensil sama banyak dan buku sama banyak. Paling banyak berapa anak yang dapat menerima?", [
    ("96 anak", False, "96 adalah KPK dari 24 dan 32. Membagi barang sebanyak-banyaknya memakai FPB.", "SD5-M-B2-02"),
    ("4 anak", False, "4 anak memang bisa (6 pensil dan 8 buku), tetapi bukan yang paling banyak.", "SD5-M-B2-11"),
    ("8 anak", True, "Benar. FPB dari 24 dan 32 adalah 8; setiap anak mendapat 3 pensil dan 4 buku.", ""),
    ("3 anak", False, "3 adalah banyak pensil untuk setiap anak (24 : 8), bukan banyak anaknya.", "SD5-M-B2-12"),
], sulit="Sedang")
cek(fpb(20, 50) == 10 and kpk(20, 50) == 100 and fpb(13, 21) == 1 and 20 * 50 == 1_000)
soal("LT13", 4, "Pernyataan manakah yang tepat?", [
    ("FPB dari 20 dan 50 adalah 10.", True, "Tepat. Faktor persekutuannya 1, 2, 5, 10, dan yang terbesar 10.", ""),
    ("FPB dari 20 dan 50 adalah 100.", False, "100 adalah KPK dari 20 dan 50. FPB-nya 10.", "SD5-M-B2-02"),
    ("13 dan 21 tidak mempunyai FPB.", False, "Faktor persekutuannya hanya 1, jadi FPB-nya 1. FPB selalu ada.", "SD5-M-B2-14"),
    ("KPK dari 20 dan 50 adalah 1.000.", False, "1.000 = 20 × 50, kelipatan persekutuan tetapi bukan yang terkecil. KPK-nya 100.", "SD5-M-B2-03"),
], sulit="Sedang")
cek([n for n in range(21, 40) if prima(n)] == [23, 29, 31, 37] and not prima(39) and not prima(21) and not any(prima(n) for n in (25, 27, 33, 35)))
soal("LT14", 5, "Bilangan prima di antara 20 dan 40 adalah ...", [
    ("23, 29, 31, 37, 39", False, "39 ganjil, tetapi 39 = 3 × 13, jadi bukan prima.", "SD5-M-B2-09"),
    ("23, 29, 31, 37", True, "Benar. Keempatnya hanya mempunyai faktor 1 dan dirinya sendiri.", ""),
    ("21, 23, 29, 31, 37", False, "21 ganjil, tetapi 21 = 3 × 7, jadi bukan prima.", "SD5-M-B2-09"),
    ("25, 27, 33, 35", False, "Semuanya ganjil tetapi tidak ada yang prima: 25 = 5 × 5, 27 = 3 × 9, 33 = 3 × 11, 35 = 5 × 7.", "SD5-M-B2-09"),
])
cek(faktorisasi(72) == [2, 2, 2, 3, 3] and 8 * 9 == 72 and 2 * 3 * 12 == 72 and 2 * 2 * 3 * 3 == 36)
soal("LT15", 5, "Faktorisasi prima dari 72 adalah ...", [
    ("2 × 2 × 2 × 3 × 3", True, "Benar. 72 = 2 × 36 = 2 × 2 × 18 = 2 × 2 × 2 × 9 = 2 × 2 × 2 × 3 × 3.", ""),
    ("8 × 9", False, "Hasil kalinya 72, tetapi 8 dan 9 belum prima. Pohon faktornya harus diteruskan.", "SD5-M-B2-10"),
    ("2 × 2 × 3 × 3", False, "Satu faktor 2 terlewat: 2 × 2 × 3 × 3 = 36, bukan 72.", "SD5-M-B2-15"),
    ("2 × 2 × 2 × 3 × 3 × 1", False, "1 ikut ditulis seolah bilangan prima. 1 bukan prima, jadi tidak termasuk faktorisasi prima.", "SD5-M-B2-16"),
])
cek(2 * 3 * 3 * 7 == 126 and 2 + 3 + 3 + 7 == 15 and 2 * 3 * 7 == 42 and 3 * 3 * 7 == 63)
soal("LT16", 5, "Bilangan yang faktorisasi primanya 2 × 3 × 3 × 7 adalah ...", [
    ("126", True, "Benar. 2 × 3 = 6, 6 × 3 = 18, 18 × 7 = 126.", ""),
    ("15", False, "Faktor-faktornya dijumlahkan (2 + 3 + 3 + 7). Tanda × berarti dikalikan.", "SD5-M-B2-20"),
    ("42", False, "Faktor 3 hanya dihitung sekali: 2 × 3 × 7 = 42. Ada dua faktor 3.", "SD5-M-B2-15"),
    ("63", False, "Faktor 2 terlewat: 3 × 3 × 7 = 63. Semua faktor harus dikalikan.", "SD5-M-B2-15"),
])
cek(faktorisasi(42) == [2, 3, 7] and faktorisasi(70) == [2, 5, 7] and fpb(42, 70) == 2 * 7 == 14 and kpk(42, 70) == 210 and 2 * 7 * 2 * 7 == 196)
soal("LT17", 6, "42 = 2 × 3 × 7 dan 70 = 2 × 5 × 7. FPB dari 42 dan 70 adalah ...", [
    ("14", True, "Benar. Pasangannya 2 dan 7, jadi FPB = 2 × 7 = 14.", ""),
    ("2", False, "Hanya pasangan 2 yang diambil. Pasangan 7 juga ada di kedua bilangan.", "SD5-M-B2-11"),
    ("210", False, "210 adalah KPK dari 42 dan 70 (pasangan ditambah sisanya).", "SD5-M-B2-02"),
    ("196", False, "Faktor yang sama dari kedua bilangan ditulis semuanya (2 × 7 × 2 × 7). Setiap pasangan cukup sekali.", "SD5-M-B2-07"),
], sulit="Sedang")
cek(faktorisasi(20) == [2, 2, 5] and faktorisasi(36) == [2, 2, 3, 3] and kpk(20, 36) == 180 and fpb(20, 36) == 4 and 20 * 36 == 720 and 2 * 3 * 5 == 30)
soal("LT18", 6, "20 = 2 × 2 × 5 dan 36 = 2 × 2 × 3 × 3. KPK dari 20 dan 36 adalah ...", [
    ("4", False, "Hanya pasangan 2 × 2 yang dikalikan; itu FPB. KPK juga memakai 3 × 3 dan 5.", "SD5-M-B2-05"),
    ("720", False, "Semua faktor dari kedua bilangan dikalikan, sehingga pasangan 2 × 2 terhitung dua kali.", "SD5-M-B2-06"),
    ("30", False, "Setiap faktor prima hanya ditulis sekali (2 × 3 × 5). 30 bukan kelipatan 20 maupun 36.", "SD5-M-B2-15"),
    ("180", True, "Benar. Pasangan 2 × 2 ditulis sekali, ditambah sisanya 3 × 3 dan 5: 2 × 2 × 3 × 3 × 5 = 180.", ""),
], sulit="Sedang")
soal("LT19", 6, "Masalah manakah yang diselesaikan dengan mencari KPK?", [
    ("Membagi 24 apel dan 36 jeruk ke kantong sebanyak mungkin dengan isi sama", False, "Membagi rata sebanyak-banyaknya diselesaikan dengan FPB.", "SD5-M-B2-02"),
    ("Menentukan kapan dua bus yang datang berkala tiba bersamaan lagi", True, "Tepat. Kejadian berulang yang ditanya kapan bersamaan lagi diselesaikan dengan KPK.", ""),
    ("Memotong dua pita 40 cm dan 60 cm menjadi potongan sama panjang yang terpanjang", False, "Mencari panjang terpanjang yang membagi habis kedua pita diselesaikan dengan FPB.", "SD5-M-B2-02"),
    ("Membagi 18 siswa laki-laki dan 12 perempuan ke kelompok sebanyak mungkin", False, "Membagi ke kelompok sebanyak-banyaknya dengan susunan sama diselesaikan dengan FPB.", "SD5-M-B2-02"),
], sulit="Sedang")
cek(kpk(4, 6, 10) == 60 and kpk(4, 6) == 12 and 4 * 6 * 10 == 240 and 240 // 60 == 4)
soal("LT20", 6, "Tiga lampu hias berkedip setiap 4 detik, 6 detik, dan 10 detik. Ketiganya berkedip bersamaan tepat pukul 20.00. Paling cepat, kapan ketiganya berkedip bersamaan lagi?", [
    ("Pukul 20.01", True, "Benar. KPK dari 4, 6, dan 10 adalah 60 detik = 1 menit, jadi pukul 20.01.", ""),
    ("Pukul 20.60", False, "KPK-nya tepat (60 detik), tetapi 60 detik adalah 1 menit, jadi pukul 20.01.", "SD5-M-B2-13"),
    ("Pukul 20.04", False, "Yang dipakai 4 × 6 × 10 = 240 detik (4 menit). Itu kelipatan persekutuan, tetapi bukan yang terkecil.", "SD5-M-B2-03"),
    ("Pukul 20.00 lewat 12 detik", False, "12 hanya KPK dari 4 dan 6. Lampu yang berkedip setiap 10 detik belum diperhitungkan.", "SD5-M-B2-04"),
], sulit="Sulit")

# ── Whole-chapter checks.
refs = [s["ref"] for s in S]
cek(len(refs) == len(set(refs)))
cek({p["no"] for p in PELAJARAN} == {s["pel"] for s in S}, "every lesson has questions")
PRE = [s for s in S if s["guna"] == "Pemetaan awal"]
POST = [s for s in S if s["guna"] == "Cek penguasaan"]
LAT = [s for s in S if not s["guna"]]
cek(len(PRE) == 4 and len(POST) == 8 and 12 <= len(LAT) <= 20)
cek(sum(1 for s in POST if s["sulit"] == "Sedang") > len(POST) / 2, "post-test mostly Sedang")
for _k in {s["kelompok"] for s in S if s["kelompok"]}:
    cek(len({s["guna"] for s in S if s["kelompok"] == _k} & {"Pemetaan awal", "Cek penguasaan"}) < 2, _k)
HURUF = {}
for s in S:
    h = "ABCD"[[b for _, b, _, _ in s["pilihan"]].index(True)]
    HURUF[h] = HURUF.get(h, 0) + 1
cek(set(HURUF) == set("ABCD") and max(HURUF.values()) * 2 <= len(S), HURUF)
cek(max(HURUF.values()) - min(HURUF.values()) <= 3, HURUF)

# The post-test uses fresh numbers. Bab 2's numbers are small and recur everywhere, so freshness is
# checked per problem: the numbers a post-test question works on must not be a problem a lesson
# works through or one of the book's own exercises (Bab 2, pp. 51-95).
SOAL_BUKU = [(7,), (9,), (6,), (8,), (3,), (2, 3), (5, 7), (6, 8), (3, 4, 5), (2, 5), (12,), (18,), (24,), (36,),
             (54,), (72,), (96,), (6, 12), (8, 20), (12, 28), (18, 24), (14, 28), (15, 20), (13, 26), (20, 28),
             (15, 35), (12, 42), (24, 36, 48), (48, 60), (60, 120), (54, 72, 120), (30, 90), (42, 60), (23, 27),
             (36, 108), (50, 105), (24, 30, 54), (27, 81), (6, 10, 15), (7, 18, 33), (30, 64, 86), (60,), (270,),
             (70,), (120,), (135,), (180,), (150,), (170,), (210,), (225,), (260,), (280,), (45, 135), (96, 120),
             (24, 36, 60), (80, 120, 160), (12, 18), (15, 24, 36), (60, 72), (15, 20, 30), (24, 36), (3, 5, 7), (3, 5)]
SOAL_PELAJARAN = [(3,), (4,), (9,), (7,), (2, 3), (6, 8), (2, 3, 4), (3, 5), (2, 5), (6,), (12,), (18,), (28,),
                  (12, 18), (8, 20), (16, 24, 40), (9, 14), (24, 36, 48), (60,), (70,), (42, 60), (36, 108),
                  (24, 36, 60), (12, 18), (15, 24, 36)]
MASALAH_POST = {"PB1": (8, 12), "PB2": (45,), "PB3": (32, 40), "PB4": (2, 29, 53, 71), "PB5": (84,),
                "PB6": (28, 42), "PB7": (6, 9), "PB8": (30, 45)}
cek(set(MASALAH_POST) == {s["ref"] for s in POST})
for s in POST:
    m = MASALAH_POST[s["ref"]]
    cek(all(str(n) in s["tanya"] or s["ref"] == "PB4" for n in m), f"{s['ref']}: its numbers are in the question")
    cek(tuple(sorted(m)) not in {tuple(sorted(x)) for x in SOAL_BUKU + SOAL_PELAJARAN}, f"{s['ref']}: {m} is not fresh")
cek(not re.search(r"\b(2, 29, 53, 71)\b", " ".join(p["isi"] for p in PELAJARAN)))


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
    tulis(os.path.join(here, "SD5-Matematika-Bab2.xlsx"))
    tulis_miskonsepsi(os.path.join(here, "SD5-Matematika-Bab2-miskonsepsi.csv"))
    halaman = sum(p["isi"].count("## ") for p in PELAJARAN)
    print(f"SD5-Matematika-Bab2.xlsx: lessons {len(PELAJARAN)} ({halaman} pages), questions {len(S)} "
          f"(pre {len(PRE)}, post {len(POST)}, practice {len(LAT)}), answers "
          + " ".join(f"{h}={HURUF[h]}" for h in "ABCD"))
    print(f"SD5-Matematika-Bab2-miskonsepsi.csv: {len(MISKONSEPSI)} codes")
    print(f"assertions passed: {CEK[0]}")
