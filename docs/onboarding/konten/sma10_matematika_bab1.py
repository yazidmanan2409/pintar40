# SMA Kelas X, Matematika, Bab 1 "Eksponen", as a PINTAR lesson workbook in the D-007 template
# (sheets Kursus, Bab, Pelajaran, Soal, Pilihan; the column contract is KOLOM in
# src/lib/unggah-kontrak.ts). Built with SD5's and Geografi's methods together (LANA-15).
#
# Source: the student book "Matematika untuk SMA/MA/SMK/MAK Kelas X (Edisi Revisi)" (Dicky Susanto
# dkk.; Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi, 2023; ISBN 978-623-118-558-7),
# Bab 1, pp. 1-34. Its Contoh are worked; its Latihan and Uji Kompetensi have no keys, so every key
# here is ours, and every key is computed.
#
#   - Every number in a lesson, key or distractor is computed here (exact fractions) and asserted.
#   - Every definition and property is in FAKTA with its page and the book's words; `--kutipan`
#     checks the prose against the book's text. Formulas were read from the page images (the text
#     layer loses superscripts: 2⁶ extracts as "26"), so formulas are proven by computation.
#   - Statements that are false or doubtful outside the book are kept out, and DILUAR asserts it.
#   - Notation: × and :, decimal comma, thousands point; integer and one-letter exponents as
#     Unicode superscripts (2⁶, a⁻³, 3ˣ); other exponents as ^{…} (a^{m/n}); subscripts as _{…};
#     √ ∛ ∜ with the radicand in parentheses when longer than one symbol. No LaTeX, HTML or tables.
#
# Run: python3 docs/onboarding/konten/sma10_matematika_bab1.py [--kutipan book.txt]
import csv
import math
import os
import re
import sys
from fractions import Fraction as F

from openpyxl import Workbook
from openpyxl.styles import Alignment, Font

CEK = [0]


def cek(syarat, pesan=""):
    """An assertion that is counted, so the hand-off can say how many passed."""
    assert syarat, pesan
    CEK[0] += 1


def norm(teks):
    teks = teks.lower().replace("ﬁ", "i").replace("ﬂ", "l").replace("fi", "i").replace("fl", "l")
    return re.sub(r"[^0-9a-z]", "", teks)


def desimal(v, d):
    """A decimal with d places and a decimal comma."""
    return f"{v:.{d}f}".replace(".", ",")


FAKTA = {}


def fakta(id_, hal, kutipan):
    cek(id_ not in FAKTA, id_)
    FAKTA[id_] = (hal, kutipan)


# A. Definisi Eksponen (pp. 4-7)
fakta("perkalian_berulang", 4, "Perkalian berulang adalah perkalian yang dilakukan secara berulang dengan faktor yang sama.")
fakta("pola_pangkat", 6, "Bentuk 21, 22, 23, 24 dan 2n ini merupakan bentuk bilangan pangkat.")
fakta("eksponen_def", 7, "Jika a adalah bilangan real dan n adalah bilangan bulat positif, maka an menyatakan hasil kali bilangan a sebanyak n faktor")
fakta("pangkat_negatif", 7, "Jika a adalah bilangan real dengan a ⁄=0 dan n bilangan bulat positif, maka a−n =")
fakta("pangkat_pecahan", 7, "sehingga pn = a")
# B. Sifat-sifat eksponen (p. 8)
fakta("sifat", 8, "Itu merupakan beberapa sifat-sifat yang berlaku pada eksponen.")
# C. Fungsi eksponensial (pp. 11-19)
fakta("fungsi_def", 11, "dengan a adalah bilangan pokok, a> 0, a ⁄=1, n adalah bilangan real tak nol dan x adalah sebarang bilangan real.")
fakta("dua_bentuk", 12, "Fungsi eksponensial dibedakan menjadi dua bentuk, yaitu pertumbuhan eksponensial dan peluruhan eksponensial.")
fakta("pertumbuhan", 12, "pertumbuhan eksponen, yang tingkat pertumbuhannya berbanding lurus dengan besarnya nilai kuantitasnya")
fakta("pertumbuhan_fungsi", 13, "f (x)= ax  dengan a> 1")
fakta("contoh3", 14, "terdapat 30 bakteri. Setelah diamati, bakteri tersebut membelah menjadi dua setiap 30 menit.")
fakta("contoh4", 17, "Jadi, banyaknya bakteri setelah 10 jam adalah 2.048.000 bakteri.")
fakta("peluruhan", 18, "Fungsi eksponensial juga menggambarkan penurunan secara konsisten pada periode waktu tertentu. Ini disebut peluruhan eksponen.")
fakta("peluruhan_fungsi", 18, "dengan 0 <a< 1 , n bilangan real tak nol, x adalah  sebarang bilangan real.")
fakta("contoh5", 19, "Jadi, dosis pada 1 jam pertama tersisa 25 mikrogram, pada 2 jam pertama tersisa 12,5 mikrogram, dan setelah 3 jam tersisa 6,25 mikrogram.")
# D. Bentuk akar (pp. 21-22)
fakta("bentuk_akar", 21, "Untuk setiap bilangan pangkat rasional m n, dengan m dan n adalah bilangan bulat dan n> 0, didefinisikan")
fakta("akar_sifat", 21, "Sifat-sifat eksponen juga dapat kamu gunakan untuk bentuk pangkat pecahan ini.")
fakta("merasionalkan", 22, "Untuk merasionalkan bentuk akar, maka yang dapat dilakukan adalah dengan mengalikannya dengan bentuk akar sekawannya.")
# Logaritma (pp. 27-32)
fakta("log_masalah", 29, "Dengan kata lain untuk mendapatkan nilai x kamu mencari nilai perpangkatan dua yang hasilnya adalah 50.")
fakta("log_def", 29, "dengan, a adalah bilangan pokok atau basis logaritma b adalah numerus c adalah hasil logaritma")
fakta("log_invers", 29, "Logaritma adalah inversi atau kebalikan dari eksponen.")
fakta("log_umum", 30, "Logaritma yang memiliki basis 10 disebut dengan logaritma umum")
fakta("log_sifat", 30, "Misalkan a> 0 dan a ⁄=1, b> 0, c> 0,  m> 0, m ⁄=1, dengan a, b, c, m, n adalah bilangan Real, maka berlaku:")
fakta("kalkulator", 29, "Sekarang ini kamu dapat menggunakan kalkulator saintifik untuk menentukan nilai logaritma.")
# For the book-error record only (not used by any question)
fakta("eksponenial", 10, "C. Fungsi Eksponenial")
fakta("bakteri_baru", 14, "Pada jam ke-5 berapa banyak bakteri baru yang tumbuh?")
fakta("meluruh", 21, "Setelah 30 menit, banyak dosis obat yang meluruh adalah")
fakta("hiv", 17, "Pada tahun 2015 kasus positif HIV-AIDS berjumlah sekitar 36 juta jiwa.")
fakta("bunga_05", 32, "berlaku: 9.000.000 = 3 .000.000(1 + 0, 5)t")
fakta("peluruhan_n", 18, "Fungsi peluruhan eksponen dapat dituliskan sebagai")
fakta("sifat8_b", 30, "8. alog c =alog b× blogc")
fakta("latihan26", 33, "Latihan  2.6  1. Sederhanakan bentuk akar berikut ini.")
REKAMAN = {"peluruhan_n", "sifat8_b", "eksponenial", "bakteri_baru", "meluruh", "hiv", "bunga_05", "latihan26"}
GAMBAR = set()

# ── What can be computed (every number the lessons use) ──
cek(2 ** 6 == 64 and 5 ** 8 == 390625 and 3 ** 4 == 81 and 3 * 4 == 12)
HOAKS = {n: 2 ** n for n in range(0, 6)}
cek(HOAKS == {0: 1, 1: 2, 2: 4, 3: 8, 4: 16, 5: 32})
cek(F(1, 2) ** 3 == F(1, 8) and F(2) ** -3 == F(1, 8))                       # 2⁻³ = (1/2)³ = 1/8
cek(2 ** 3 == 8 and round(27 ** (1 / 3)) ** 2 == 9 and 3 ** 3 == 27)          # 8^{1/3} = 2; 27^{2/3} = 9
DUA = {n: 2 ** n for n in range(1, 11)}
cek(DUA[10] == 1024 and DUA[2] * DUA[3] == 32 == DUA[5])
cek(F(2 ** 8, 2 ** 6) == 4 and (2 ** 3) ** 2 == 64 == 2 ** 6)
cek((2 * 5) ** 3 == 2 ** 3 * 5 ** 3 == 1000)
cek(F(2 ** 5 * 2 ** 3, 2 ** 2) == 2 ** 6)                                         # Contoh 1
cek(F(1, 3) * 2 + F(4, 3) == 2)                                                   # Contoh 2: (x^{1/3})² × x^{4/3} = x²
VIRUS = {x: 3 ** x for x in range(1, 8)}
cek(VIRUS[7] == 2187)
BAKTERI3 = {x: 30 * 2 ** x for x in range(0, 6)}
cek(list(BAKTERI3.values()) == [30, 60, 120, 240, 480, 960] and 30 * 2 ** 10 == 30720)
a2 = F(32000, 8000)
cek(a2 == 4 and 2 ** 2 == 4 and F(8000, 4) == 2000 and 2 ** 10 * 2000 == 2048000)    # Contoh 4
OBAT = {x: 50 * F(1, 2) ** x for x in range(0, 4)}
cek(OBAT == {0: 50, 1: 25, 2: F(25, 2), 3: F(25, 4)})                           # 50; 25; 12,5; 6,25
cek(2 ** 5 == 32 and 2 ** 3 == 8)                                                 # 32^{3/5} = (⁵√32)³ = 8
cek(F(1, 2) + F(1, 3) == F(5, 6) and 2 * 3 == 6)                                  # Contoh 6
cek(math.isqrt(9 + 16) ** 2 == 25 and math.isqrt(9) + math.isqrt(16) == 7)
cek(F(6, 2) == 3)                                                                 # 6/√2 = 3√2
cek(9 - 7 == 2 and F(2, 2) == 1)                                                  # 2/(3 − √7) = 3 + √7
LOG_BAKTERI = {x: 2000 * 2 ** x for x in range(0, 7)}
cek(LOG_BAKTERI[5] == 64000 and LOG_BAKTERI[6] == 128000 and 64000 < 100000 < 128000 and 100000 // 2000 == 50)
cek(2 ** 5 == 32 and 3 ** 2 == 9 and F(5) ** -2 == F(1, 25) and 7 ** 0 == 1 and 10 ** 2 == 100)
cek(16 * 8 == 128 == 2 ** 7)                                                      # Contoh 8
L3, L105 = math.log10(3), math.log10(1.05)
cek(desimal(L3, 4) == "0,4771" and desimal(L105, 4) == "0,0212" and desimal(0.4771 / 0.0212, 1) == "22,5")   # Contoh 9
cek(abs(1.05 ** (L3 / L105) - 3) < 1e-9)
cek(F(105, 100) ** 22 < 3 <= F(105, 100) ** 23)                                     # Contoh 9: year 23
cek(desimal(float(F(105, 100) ** 22), 2) == "2,93" and desimal(float(F(105, 100) ** 23), 2) == "3,07")
# BOOK INCONSISTENCIES (checked here, kept out of lessons and questions):
# p. 28: f(5,5) = 2.000 × 45,25 = 90.509, but 2.000 × 45,25 = 90.500 (and 2^{5,5} ≈ 45,2548).
cek(2000 * F(4525, 100) == 90500 != 90509 and round(2 ** 5.5, 4) == 45.2548)
# p. 15: Contoh 3 asks for the new bacteria at hour 5 and answers the total 30.720.
cek(30 * 2 ** 10 - 30 == 30690 != 30720)

SUMBER = ("_Diadaptasi dari Matematika untuk SMA/MA/SMK/MAK Kelas X (Edisi Revisi), Dicky Susanto dkk., "
          "Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi, 2023, Bab 1._")

KURSUS = {
    "Judul kursus*": "Matematika Kelas X · Bab 1: Eksponen",
    "Mata pelajaran*": "Matematika",
    "Jenjang*": "SMA",
    "Kelas*": "Kelas X",
    "Konteks": "Akademik",
}

BAB = [(1, "Eksponen")]

PELAJARAN = [
    dict(no=1, judul="Definisi Eksponen",
         ringkasan="Perkalian berulang dengan faktor yang sama ditulis sebagai bilangan berpangkat; pangkat negatif dan pangkat pecahan juga didefinisikan.",
         tujuan="Kamu dapat menuliskan perkalian berulang sebagai bilangan berpangkat dan menghitung pangkat bulat, negatif, dan pecahan.",
         bloom="Memahami",
         isi=f"""## Perkalian berulang

**Perkalian berulang** adalah perkalian yang dilakukan secara berulang dengan faktor yang sama. Perkalian seperti ini ditulis lebih singkat dengan pangkat.

- 2 × 2 × 2 × 2 × 2 × 2 ditulis 2⁶.
- 5 × 5 × 5 × 5 × 5 × 5 × 5 × 5 ditulis 5⁸.
- a × a × a × a × a × a × a ditulis a⁷.

Nilai 2⁶ adalah 64, karena 2 dikalikan dengan dirinya sendiri sebanyak 6 faktor.

## Pola penyebaran pesan

Seseorang meneruskan sebuah pesan kepada 2 orang, dan setiap penerima meneruskannya lagi kepada 2 orang lain. Banyak penerima pada setiap fase:

- fase 1 → 2 = 2¹
- fase 2 → 4 = 2 × 2 = 2²
- fase 3 → 8 = 2 × 2 × 2 = 2³
- fase 4 → 16 = 2⁴
- fase 5 → 32 = 2⁵

Pada fase ke-n, banyak penerimanya 2ⁿ. Bentuk 2¹, 2², 2³, 2⁴, dan 2ⁿ disebut **bilangan berpangkat**. Pola yang sama juga memberi 1 = 2⁰.

## Definisi bilangan berpangkat

Jika a bilangan real dan n bilangan bulat positif, maka aⁿ adalah hasil kali bilangan a sebanyak n faktor:

aⁿ = a × a × a × … × a (n faktor)

Pada aⁿ, a disebut **bilangan pokok** dan n disebut **pangkat**.

Contoh: 3⁴ = 3 × 3 × 3 × 3 = 81. Hati-hati, 3⁴ bukan 3 × 4 = 12.

## Pangkat negatif dan pangkat pecahan

1. Untuk a ≠ 0 dan n bilangan bulat positif: a⁻ⁿ = (1/a)ⁿ.
   Contoh: 2⁻³ = (1/2)³ = 1/8.
2. Untuk a > 0 dan n bilangan bulat positif: a^{{1/n}} = p, dengan p bilangan real positif sehingga pⁿ = a.
   Contoh: 8^{{1/3}} = 2, karena 2³ = 8.
3. Untuk a > 0 dan m, n bilangan bulat positif: a^{{m/n}} = (a^{{1/n}})ᵐ.
   Contoh: 27^{{2/3}} = (27^{{1/3}})² = 3² = 9.

## Coba pikirkan

Pada pola penyebaran pesan tadi, pada fase ke berapa banyak penerimanya pertama kali lebih dari 200 orang?

{SUMBER}"""),
    dict(no=2, judul="Sifat-Sifat Eksponen",
         ringkasan="Perkalian, pembagian, dan perpangkatan bilangan berpangkat dengan bilangan pokok yang sama dapat disederhanakan dengan sifat-sifat eksponen.",
         tujuan="Kamu dapat menyederhanakan bentuk eksponen dengan sifat-sifat eksponen.",
         bloom="Menerapkan",
         isi=f"""## Menemukan polanya

Nilai beberapa perpangkatan 2:

- 2¹ = 2, 2² = 4, 2³ = 8, 2⁴ = 16, 2⁵ = 32
- 2⁶ = 64, 2⁷ = 128, 2⁸ = 256, 2⁹ = 512, 2¹⁰ = 1.024

Perhatikan 2² · 2³ = 4 × 8 = 32 = 2⁵. Pangkatnya dijumlahkan: 2 + 3 = 5.

## Sifat 1 sampai 3

Untuk a ≠ 0 dan m, n bilangan bulat:

1. aᵐ · aⁿ = a^{{m+n}}
2. aᵐ/aⁿ = a^{{m−n}}
3. (aᵐ)ⁿ = a^{{m×n}}

Contoh:
- 2⁸/2⁶ = 2^{{8−6}} = 2² = 4. Periksa: 256 : 64 = 4.
- (2³)² = 2^{{3×2}} = 2⁶ = 64.

## Sifat 4 dan 5

4. (ab)ᵐ = aᵐ × bᵐ, dengan a, b ≠ 0 dan m bilangan bulat.
5. (a/b)ᵐ = aᵐ/bᵐ, dengan b ≠ 0 dan m bilangan bulat.

Contoh: (2 × 5)³ = 2³ × 5³ = 8 × 125 = 1.000, sama dengan 10³.

Setiap faktor di dalam kurung ikut dipangkatkan, termasuk bilangannya.

## Sifat 6 dan 7: pangkat pecahan

Untuk a > 0:

6. (a^{{m/n}})(a^{{p/n}}) = a^{{(m+p)/n}}, dengan n ≠ 0.
7. (a^{{m/n}})(a^{{p/q}}) = a^{{m/n + p/q}}, dengan n, q ≠ 0.

Pangkat pecahan dijumlahkan seperti menjumlahkan pecahan biasa.

## Dua contoh

**Contoh 1.** (2⁵ × 2³)/2² = 2^{{5+3}}/2² = 2⁸/2² = 2^{{8−2}} = 2⁶.

**Contoh 2.** (x^{{1/3}})² × x^{{4/3}} = x^{{2/3}} × x^{{4/3}} = x^{{2/3 + 4/3}} = x^{{6/3}} = x².

{SUMBER}"""),
    dict(no=3, judul="Fungsi Eksponensial dan Pertumbuhan Eksponen",
         ringkasan="Fungsi eksponensial berbentuk f(x) = n × aˣ; bila a > 1, fungsinya menggambarkan pertumbuhan eksponen, seperti perkembangbiakan bakteri.",
         tujuan="Kamu dapat mengenali fungsi eksponensial dan memodelkan serta menghitung pertumbuhan eksponen.",
         bloom="Menerapkan",
         isi=f"""## Dari penularan virus

Seseorang menulari 3 orang, dan setiap orang yang tertular menulari 3 orang lagi. Banyak orang yang tertular pada setiap fase:

- x = 1 → 3 = 3¹
- x = 2 → 9 = 3²
- x = 3 → 27 = 3³
- x = 4 → 81 = 3⁴
- x = 5 → 243 = 3⁵
- x = 6 → 729 = 3⁶
- x = 7 → 2.187 = 3⁷

Jika x adalah fase dan f(x) banyak orang yang tertular, maka f(x) = 3ˣ. Fungsi ini adalah contoh **fungsi eksponensial**.

## Definisi fungsi eksponensial

Fungsi eksponensial dinyatakan dengan

f(x) = n × aˣ

dengan a bilangan pokok, a > 0, a ≠ 1, n bilangan real tak nol, dan x sebarang bilangan real.

Contoh lain: f(x) = 4ˣ, f(x) = 3^{{x+1}}, dan f(x) = 5^{{2x−1}}.

**Coba pikirkan:** bagaimana bentuk f(x) = n × aˣ jika a = 1?

## Pertumbuhan eksponen

Fungsi eksponensial dibedakan menjadi dua bentuk: **pertumbuhan eksponensial** dan **peluruhan eksponensial**.

Fungsi pertumbuhan eksponen dituliskan f(x) = aˣ dengan a > 1. Tingkat pertumbuhannya berbanding lurus dengan besarnya nilai kuantitasnya: makin banyak, makin cepat bertambah. Contohnya pertumbuhan bakteri.

## Contoh 3: bakteri yang membelah

Pada awal pengamatan ada 30 bakteri, dan setiap 30 menit setiap bakteri membelah menjadi dua. Misalkan x adalah fase (setiap 30 menit).

- x = 0 → 30
- x = 1 → 60 = 2¹ · 30
- x = 2 → 120 = 2² · 30
- x = 3 → 240 = 2³ · 30
- x = 4 → 480 = 2⁴ · 30
- x = 5 → 960 = 2⁵ · 30

Modelnya f(x) = 30 × 2ˣ. Jam ke-5 adalah fase ke-10, karena setiap jam ada 2 fase. Jadi f(10) = 30 × 2¹⁰ = 30 × 1.024 = **30.720** bakteri.

## Contoh 4: mencari bilangan pokok

Banyak bakteri setelah 2 jam 8.000, dan setelah 4 jam 32.000. Berapa banyak bakteri setelah 10 jam? Misalkan x_{{0}} banyak bakteri mula-mula dan a hasil pembelahan setiap jam, sehingga x_{{t}} = aᵗ · x_{{0}}.

1. x_{{4}} : x_{{2}} = 32.000 : 8.000, jadi a² = 4 dan a = 2.
2. 8.000 = 2² · x_{{0}} = 4 · x_{{0}}, jadi x_{{0}} = 2.000.
3. x_{{10}} = 2¹⁰ · 2.000 = 1.024 · 2.000 = **2.048.000** bakteri.

{SUMBER}"""),
    dict(no=4, judul="Peluruhan Eksponen",
         ringkasan="Bila 0 < a < 1, fungsi f(x) = n × aˣ menggambarkan penurunan yang konsisten pada periode waktu tertentu, yang disebut peluruhan eksponen.",
         tujuan="Kamu dapat membedakan pertumbuhan dan peluruhan eksponen serta menghitung nilai fungsi peluruhan.",
         bloom="Menerapkan",
         isi=f"""## Pengertian peluruhan eksponen

Fungsi eksponensial tidak hanya menggambarkan pertumbuhan. Fungsi eksponensial juga menggambarkan penurunan secara konsisten pada periode waktu tertentu, yang disebut **peluruhan eksponen**.

Fungsi peluruhan eksponen dituliskan

f(x) = n × aˣ, dengan 0 < a < 1, n bilangan real positif, dan x sebarang bilangan real.

## Contoh 5: dosis obat

Dosis obat yang disuntikkan 50 mikrogram. Setiap satu jam, setengah dari dosis yang ada luruh dan dikeluarkan dari tubuh. Misalkan f(x) dosis yang tersisa setelah x jam.

- x = 0 → f(0) = 50
- x = 1 → f(1) = 1/2 × 50 = 25
- x = 2 → f(2) = 1/2 × 25 = 12,5
- x = 3 → f(3) = 1/2 × 12,5 = 6,25

Modelnya f(x) = 50 × (1/2)ˣ.

## Pertumbuhan atau peluruhan?

Bandingkan f(x) = 2ˣ dan g(x) = (1/2)ˣ:

- x = 0 → f(0) = 1 dan g(0) = 1
- x = 1 → f(1) = 2 dan g(1) = 1/2
- x = 2 → f(2) = 4 dan g(2) = 1/4
- x = 3 → f(3) = 8 dan g(3) = 1/8

Jika a > 1, nilainya makin besar (pertumbuhan). Jika 0 < a < 1, nilainya makin kecil (peluruhan).

## Coba pikirkan

Pada Contoh 5, setelah berapa jam dosis yang tersisa kurang dari 0,1 mikrogram?

{SUMBER}"""),
    dict(no=5, judul="Bentuk Akar",
         ringkasan="Pangkat pecahan dapat ditulis sebagai bentuk akar; bentuk akar di penyebut dirasionalkan dengan mengalikan sekawannya.",
         tujuan="Kamu dapat mengubah pangkat pecahan menjadi bentuk akar, menyederhanakannya, dan merasionalkan penyebut bentuk akar.",
         bloom="Menerapkan",
         isi=f"""## Pangkat pecahan dan akar

Bentuk lain dari (0,5)^{{1/2}} adalah √0,5. Bentuk seperti ini disebut **bentuk akar**.

Untuk a > 0 dan setiap pangkat rasional m/n, dengan m dan n bilangan bulat dan n > 0:

a^{{m/n}} = (ⁿ√a)ᵐ atau a^{{m/n}} = ⁿ√(aᵐ)

Contoh: 32^{{3/5}} = (⁵√32)³ = 2³ = 8.

Sifat-sifat eksponen juga berlaku untuk pangkat pecahan.

## Contoh 6

Sederhanakan (2√x)(3∛x) untuk x > 0.

1. Tulis dalam pangkat pecahan: (2x^{{1/2}})(3x^{{1/3}}).
2. Kalikan bilangannya, jumlahkan pangkatnya: 2 × 3 × x^{{1/2 + 1/3}}.
3. 1/2 + 1/3 = 3/6 + 2/6 = 5/6, jadi hasilnya **6x^{{5/6}}**.

## Hati-hati dengan penjumlahan di bawah akar

√(a + b) tidak sama dengan √a + √b. Contoh:

- √(9 + 16) = √25 = 5
- √9 + √16 = 3 + 4 = 7

Hasilnya berbeda, jadi akar tidak boleh "dibagi" ke setiap suku.

## Merasionalkan bentuk akar

Untuk merasionalkan bentuk akar, kalikan dengan bentuk akar sekawannya.

- a/√b dikalikan √b/√b: a/√b = (a/b)√b.
  Contoh: 6/√2 = 6√2/2 = 3√2.
- √a + √b dan √a − √b adalah sekawan; a + √b dan a − √b juga sekawan.
  Contoh: 2/(3 − √7) = 2(3 + √7)/((3 − √7)(3 + √7)) = 2(3 + √7)/(9 − 7) = 3 + √7.

{SUMBER}"""),
    dict(no=6, judul="Logaritma",
         ringkasan="Logaritma adalah kebalikan dari eksponen: ᵃlog b = c jika dan hanya jika b = aᶜ.",
         tujuan="Kamu dapat mengubah bentuk eksponen menjadi bentuk logaritma dan sebaliknya, serta menentukan nilai logaritma sederhana.",
         bloom="Memahami",
         isi=f"""## Masalah yang memerlukan logaritma

Sebuah koloni 2.000 bakteri membelah menjadi dua setiap jam, sehingga f(x) = 2.000 × 2ˣ.

- x = 5 → f(5) = 64.000
- x = 6 → f(6) = 128.000

Kapan banyaknya 100.000? Waktunya di antara 5 dan 6 jam. Dari 100.000 = 2.000 × 2ˣ, kedua ruas dibagi 2.000: 50 = 2ˣ. Kita mencari pangkat dua yang hasilnya 50.

## Definisi logaritma

Misalkan a bilangan positif dengan 0 < a < 1 atau a > 1, dan b > 0.

ᵃlog b = c jika dan hanya jika b = aᶜ

- a disebut **bilangan pokok** atau basis logaritma,
- b disebut **numerus**,
- c disebut **hasil logaritma**.

Jadi 50 = 2ˣ ditulis x = ²log 50. Logaritma adalah kebalikan dari eksponen.

## Bentuk eksponen dan bentuk logaritma

- 2⁵ = 32 ↔ ²log 32 = 5
- 3² = 9 ↔ ³log 9 = 2
- 5⁻² = 1/25 ↔ ⁵log (1/25) = −2
- 7⁰ = 1 ↔ ⁷log 1 = 0

## Logaritma umum

Logaritma yang basisnya 10 disebut **logaritma umum**, dan basisnya biasa tidak ditulis:

¹⁰log a = log a

Contoh: log 100 = 2, karena 10² = 100. Nilai logaritma yang lain dapat ditentukan dengan kalkulator saintifik.

{SUMBER}"""),
    dict(no=7, judul="Sifat-Sifat Logaritma",
         ringkasan="Sifat-sifat logaritma mengubah perkalian menjadi penjumlahan, pembagian menjadi pengurangan, dan pangkat menjadi perkalian.",
         tujuan="Kamu dapat menyederhanakan bentuk logaritma dan memakai logaritma untuk menyelesaikan masalah pertumbuhan.",
         bloom="Menerapkan",
         isi=f"""## Sifat 1 sampai 3

Misalkan a > 0, a ≠ 1, b > 0, c > 0, m > 0, dan m ≠ 1. Maka:

1. ᵃlog a = 1
2. ᵃlog 1 = 0
3. ᵃlog aⁿ = n

Contoh: ⁵log 5 = 1, ⁵log 1 = 0, dan ²log 2⁷ = 7.

## Sifat 4 sampai 6

4. ᵃlog (b × c) = ᵃlog b + ᵃlog c
5. ᵃlog (b/c) = ᵃlog b − ᵃlog c
6. ᵃlog bⁿ = n × ᵃlog b

Yang dikalikan atau dibagi adalah numerusnya; hasil logaritmanya dijumlahkan atau dikurangkan.

## Sifat 7 dan 8

7. ᵃlog b = ᵐlog b / ᵐlog a
8. ᵃlog c = ᵃlog b × ᵇlog c, dengan b ≠ 1.

## Contoh 7: membuktikan sifat 4

Misalkan ᵃlog b = m dan ᵃlog c = n. Maka b = aᵐ dan c = aⁿ.

1. b × c = aᵐ · aⁿ = a^{{m+n}}.
2. Menurut definisi logaritma, ᵃlog (b × c) = m + n.
3. Jadi ᵃlog (b × c) = ᵃlog b + ᵃlog c.

## Contoh 8 dan Contoh 9

**Contoh 8.** ²log 16 + ²log 8 = ²log (16 × 8) = ²log 128 = ²log 2⁷ = 7.

**Contoh 9.** Tabungan Arif Rp3.000.000 berbunga 5% per tahun. Kapan menjadi tiga kali lipat, Rp9.000.000?

1. 9.000.000 = 3.000.000 × (1 + 0,05)ᵗ, jadi 3 = 1,05ᵗ.
2. log 3 = log 1,05ᵗ = t × log 1,05.
3. t = log 3 / log 1,05 ≈ 0,4771 / 0,0212 ≈ 22,5.

Nilai t yang memenuhi persamaan itu kira-kira 22,5. Bunga ditambahkan sekali setahun, jadi periksa tahun-tahun bulat:

- t = 22 → 1,05²² ≈ 2,93, belum tiga kali lipat
- t = 23 → 1,05²³ ≈ 3,07, sudah lebih dari tiga kali lipat

Jadi tabungan Arif pertama kali mencapai tiga kali lipat pada akhir tahun ke-23.

## Rangkuman Bab 1

- aⁿ adalah hasil kali a sebanyak n faktor; a⁻ⁿ = (1/a)ⁿ; a^{{m/n}} = ⁿ√(aᵐ).
- aᵐ · aⁿ = a^{{m+n}}, aᵐ/aⁿ = a^{{m−n}}, (aᵐ)ⁿ = a^{{m×n}}.
- f(x) = n × aˣ: pertumbuhan jika a > 1, peluruhan jika 0 < a < 1.
- Penyebut bentuk akar dirasionalkan dengan sekawannya.
- ᵃlog b = c jika dan hanya jika b = aᶜ; logaritma adalah kebalikan dari eksponen.

{SUMBER}"""),
]

# Statements that are false or doubtful outside the book, or book errors, stay out of the lessons.
DILUAR = ("90.509", "45,25", "HIV", "36 juta", "bakteri baru", "22,5 tahun", "(1 + 0,5)", "yang meluruh adalah",
          "Eksponenial", "Eksplorasi 2", "Latihan 2", "a ≠ 0 dan n bilangan bulat positif: a^{", "p/n bilangan", "dan dan",
          "1 / ᵇlog a", "0 < a < 1, n bilangan real tak nol", "Arif membutuhkan waktu 22,5")
for _p in PELAJARAN:
    cek(3 <= _p["isi"].count("\n## ") + _p["isi"].startswith("## ") <= 6, f"lesson {_p['no']}: 3-6 pages")
    cek(_p["isi"].rstrip().endswith(SUMBER), f"lesson {_p['no']}: attribution last")
    cek(_p["isi"].count("Coba pikirkan") <= 1, f"lesson {_p['no']}: at most one Coba pikirkan")
    cek(not any(w in _p["isi"] for w in DILUAR), f"lesson {_p['no']}: {[w for w in DILUAR if w in _p['isi']]}")


def notasi(teks, dimana):
    """The notation contract: markup only as ^{…} and _{…}, braces balanced, no LaTeX, HTML or
    tables, × not x between numbers, decimal comma, no ASCII hyphen as a minus sign."""
    cek("\n|" not in teks and not teks.startswith("|"), f"{dimana}: a table")
    cek("\\" not in teks and not re.search(r"<[a-zA-Z/]", teks), f"{dimana}: LaTeX or HTML")
    cek(not re.search(r"\^(?!\{)", teks) and not re.search(r"_(?!\{)", teks.replace("_Diadaptasi", "").replace("._", ".")),
        f"{dimana}: a bare ^ or _")
    d, low = 0, 0
    for ch in teks:
        d += (ch == "{") - (ch == "}")
        low = min(low, d)
    cek(d == 0 and low == 0, f"{dimana}: unbalanced braces")
    cek(not re.search(r"\d ?[xX] ?\d", teks), f"{dimana}: x as multiplication")
    cek(not re.search(r"(?<![\d.])\d+\.\d{1,2}(?!\d)", teks), f"{dimana}: decimal point")
    cek(not re.search(r"(?<=[\s(=])-(?=\d)", teks), f"{dimana}: hyphen as minus")


# p. 30 lets b = 1 in sifat 8; wherever ᵇlog c appears, the lesson states b ≠ 1.
cek(all(_p["isi"].count("× ᵇlog c") == _p["isi"].count("× ᵇlog c, dengan b ≠ 1") for _p in PELAJARAN))
cek(sum(_p["isi"].count("× ᵇlog c, dengan b ≠ 1") for _p in PELAJARAN) == 1)
for _p in PELAJARAN:
    notasi(_p["isi"], f"lesson {_p['no']}")
    notasi(_p["ringkasan"], f"lesson {_p['no']} ringkasan")

# ── Misconceptions: the book has no Miskonsepsi section; these come from the distractors.
MISKONSEPSI = {
    "SMA10-M-B1-01": ("Pangkat dikira perkalian biasa",
                      "Bilangan pokok dikalikan dengan pangkatnya, atau bilangan pokok dan pangkat tertukar.",
                      "Tulis perkalian berulangnya lengkap, misalnya 3⁴ = 3 × 3 × 3 × 3, lalu hitung."),
    "SMA10-M-B1-02": ("Pangkat nol atau negatif keliru",
                      "Pangkat negatif dikira membuat hasilnya negatif, atau a⁰ dikira 0.",
                      "Turunkan pola 2³, 2², 2¹, 2⁰, 2⁻¹ dengan membagi 2 setiap langkah."),
    "SMA10-M-B1-03": ("Pangkat pecahan keliru",
                      "Pangkat pecahan dikalikan atau dibagikan dengan bilangan pokoknya, atau hanya sebagian yang dihitung.",
                      "Tulis a^{m/n} sebagai (ⁿ√a)ᵐ: tentukan akarnya dahulu, lalu pangkatkan."),
    "SMA10-M-B1-04": ("Sifat perkalian dan pembagian eksponen keliru",
                      "Pada aᵐ · aⁿ atau aᵐ/aⁿ, pangkatnya dikalikan atau dibagi, atau bilangan pokoknya ikut dikalikan.",
                      "Tulis kedua perkalian berulang dan hitung banyak faktornya bersama-sama."),
    "SMA10-M-B1-05": ("Pangkat dari pangkat keliru",
                      "Pada (aᵐ)ⁿ, pangkatnya dijumlahkan, bukan dikalikan.",
                      "Tulis (a³)² sebagai a³ · a³ dan hitung faktornya."),
    "SMA10-M-B1-06": ("Koefisien tidak ikut dipangkatkan",
                      "Pada (ab)ᵐ atau (a/b)ᵐ, hanya sebagian faktor yang dipangkatkan.",
                      "Tulis (2a²b)³ sebagai tiga faktor yang sama dan kalikan setiap bagiannya."),
    "SMA10-M-B1-07": ("Substitusi ke fungsi eksponensial keliru",
                      "Nilai x dikalikan dengan bilangan pokok, bukan menjadi pangkatnya, atau koefisien ikut dipangkatkan.",
                      "Hitung aˣ dahulu, baru kalikan dengan koefisiennya."),
    "SMA10-M-B1-08": ("Banyak fase salah dihitung",
                      "Waktu tidak diubah menjadi banyak fase, atau fase ke-0 dilupakan.",
                      "Buat daftar nilai x = 0, 1, 2, … dan tuliskan waktunya di samping setiap fase."),
    "SMA10-M-B1-09": ("Pertumbuhan dan peluruhan tertukar",
                      "Syarat a > 1 dan 0 < a < 1 tertukar, atau fungsi yang bukan eksponensial dianggap eksponensial.",
                      "Hitung f(0), f(1), f(2): naik berarti pertumbuhan, turun berarti peluruhan."),
    "SMA10-M-B1-10": ("Pertumbuhan dianggap linear",
                      "Yang sama setiap fase dianggap selisihnya, padahal yang tetap adalah pengalinya.",
                      "Bandingkan tabel yang bertambah tetap dengan tabel yang dikali tetap."),
    "SMA10-M-B1-11": ("Bentuk akar dan pangkat pecahan tertukar",
                      "Pembilang dan penyebut pangkat pecahan tertukar saat ditulis sebagai akar.",
                      "Ingat: penyebut menjadi indeks akar, pembilang menjadi pangkat."),
    "SMA10-M-B1-12": ("Akar dibagi ke setiap suku",
                      "√(a + b) dianggap sama dengan √a + √b.",
                      "Hitung keduanya dengan bilangan, misalnya √(9 + 16) dan √9 + √16."),
    "SMA10-M-B1-13": ("Merasionalkan keliru",
                      "Sekawan salah dipilih, atau penyebut hasil perkalian sekawan salah dihitung.",
                      "Kalikan (a − √b)(a + √b) langkah demi langkah sampai mendapat a² − b."),
    "SMA10-M-B1-14": ("Definisi logaritma tertukar",
                      "Basis, numerus, dan hasil logaritma tertukar saat mengubah bentuk eksponen.",
                      "Beri warna: basis pada eksponen menjadi basis logaritma, pangkat menjadi hasilnya."),
    "SMA10-M-B1-15": ("Sifat logaritma keliru",
                      "Numerus dijumlahkan atau dikurangkan, bukan dikalikan atau dibagi, atau hasil logaritma disamakan dengan numerusnya.",
                      "Tulis sifatnya dan tandai: yang dikalikan numerus, yang dijumlahkan hasil logaritma."),
}

S = []


def soal(ref, pel, tanya, jawab, pilihan, guna="", sulit="Mudah", petunjuk=""):
    """`pilihan` lists the correct option first; `jawab` is the letter it is shown at. Each option
    is (teks, benar, alasan, kode, fakta). Every option names the FAKTA it rests on; a fakta
    starting with "=" means the option is a computed value, proven by the assertion next to it."""
    cek(len(pilihan) == 4 and pilihan[0][1] and not any(p[1] for p in pilihan[1:]), ref)
    for teks, benar, alasan, kode, fid in pilihan:
        cek(alasan.strip() != "", f"{ref}: every option has an Alasan")
        cek((kode == "") == benar, f"{ref}: a code on every distractor, none on the answer ({teks})")
        cek(kode == "" or kode in MISKONSEPSI, f"{ref}: unknown code {kode}")
        cek(fid.lstrip("=") in FAKTA and fid.lstrip("=") not in REKAMAN, f"{ref}: fact {fid}")
        for t in (teks, alasan):
            notasi(t, f"{ref} {teks}")
            cek(not any(w in t for w in DILUAR), f"{ref}: kept-out wording in {t}")
    notasi(tanya, ref)
    notasi(petunjuk, ref)
    cek(len({p[0] for p in pilihan}) == 4, f"{ref}: four different options")
    i = "ABCD".index(jawab)
    S.append(dict(ref=ref, pel=pel, tanya=tanya, pilihan=pilihan[1:i + 1] + [pilihan[0]] + pilihan[i + 1:],
                  guna=guna, sulit=sulit, petunjuk=petunjuk))


# ── Pemetaan awal (pre-test): writing a power, multiplying powers, an exponential value, a logarithm.
cek(5 ** 4 == 625 != 4 ** 5 and 5 * 4 == 20)
soal("PA1", 1, "Perkalian 5 × 5 × 5 × 5 ditulis sebagai bilangan berpangkat ...", "A", [
    ("5⁴", True, "Benar. Ada 4 faktor 5, jadi pangkatnya 4.", "", "=eksponen_def"),
    ("4⁵", False, "Bilangan pokok dan pangkat tertukar. Yang dikalikan berulang adalah 5, sebanyak 4 faktor.", "SMA10-M-B1-01", "=eksponen_def"),
    ("5 × 4", False, "Itu perkalian biasa, bernilai 20. Perkalian berulang 5 sebanyak 4 faktor ditulis 5⁴ = 625.", "SMA10-M-B1-01", "=perkalian_berulang"),
    ("5⁵", False, "Tanda × ikut dihitung sebagai faktor. Faktornya hanya 4.", "SMA10-M-B1-01", "=eksponen_def"),
], guna="Pemetaan awal")
cek(4 + 2 == 6 and 4 * 2 == 8 and 4 - 2 == 2 and 3 ** 4 * 3 ** 2 == 3 ** 6 and 9 ** 6 != 3 ** 6)
soal("PA2", 2, f"Bentuk sederhana dari 3⁴ · 3² adalah ...", "C", [
    ("3⁶", True, "Benar. Bilangan pokoknya sama, jadi pangkatnya dijumlahkan: 4 + 2 = 6.", "", "=sifat"),
    ("3⁸", False, "Pangkatnya dikalikan (4 × 2). Pada perkalian dengan bilangan pokok sama, pangkatnya dijumlahkan.", "SMA10-M-B1-04", "=sifat"),
    ("9⁶", False, "Bilangan pokoknya ikut dikalikan (3 × 3). Bilangan pokok tetap 3.", "SMA10-M-B1-04", "=sifat"),
    ("3²", False, "Pangkatnya dikurangkan (4 − 2). Itu sifat pembagian, bukan perkalian.", "SMA10-M-B1-04", "=sifat"),
], guna="Pemetaan awal")
cek(2 ** 5 == 32 and 2 * 5 == 10 and 5 ** 2 == 25 and 2 ** 6 == 64)
soal("PA3", 3, "Diketahui f(x) = 2ˣ. Nilai f(5) adalah ...", "B", [
    ("32", True, "Benar. f(5) = 2⁵ = 2 × 2 × 2 × 2 × 2 = 32.", "", "=fungsi_def"),
    ("10", False, "Bilangan pokok dikalikan dengan x (2 × 5). Nilai x menjadi pangkat.", "SMA10-M-B1-07", "=fungsi_def"),
    ("25", False, "Bilangan pokok dan pangkat tertukar (5²).", "SMA10-M-B1-01", "=fungsi_def"),
    ("64", False, "Faktor 2 dihitung satu kali terlalu banyak (2⁶).", "SMA10-M-B1-01", "=fungsi_def"),
], guna="Pemetaan awal")
cek(2 ** 3 == 8 and F(8, 2) == 4 and 8 * 2 == 16 and 2 ** 8 == 256)
soal("PA4", 6, "Nilai ²log 8 adalah ...", "D", [
    ("3", True, "Benar. ²log 8 = 3, karena 2³ = 8.", "", "=log_def"),
    ("4", False, "Numerus dibagi basis (8 : 2). Logaritma mencari pangkat, yaitu 2 dipangkatkan berapa agar hasilnya 8.", "SMA10-M-B1-14", "=log_def"),
    ("16", False, "Numerus dikalikan basis (8 × 2). Logaritma mencari pangkatnya.", "SMA10-M-B1-14", "=log_def"),
    ("256", False, "Ini 2⁸: numerus dipakai sebagai pangkat. Yang dicari adalah pangkatnya, 3.", "SMA10-M-B1-14", "=log_def"),
], guna="Pemetaan awal")

# ── Cek penguasaan (post-test): every lesson; fresh numbers, no Contoh, Latihan or Uji Kompetensi
# item with its numbers barely changed.
cek(F(4) ** -2 == F(1, 16) and F(1, 4) ** 2 == F(1, 16) and 4 * 2 == 8 and -F(1, 16) != F(4) ** -2)
soal("PB1", 1, "Nilai 4⁻² adalah ...", "B", [
    ("1/16", True, "Benar. 4⁻² = (1/4)² = 1/16.", "", "=pangkat_negatif"),
    ("−16", False, "Pangkat negatif dikira membuat hasilnya negatif. 4⁻² = (1/4)², hasilnya positif.", "SMA10-M-B1-02", "=pangkat_negatif"),
    ("−1/16", False, "Kebalikannya sudah tepat, tetapi tanda negatif ikut ditulis. Pangkat negatif tidak membuat hasilnya negatif.", "SMA10-M-B1-02", "=pangkat_negatif"),
    ("1/8", False, "Kebalikannya sudah tepat, tetapi 4 dikalikan 2, bukan dipangkatkan 2: 4² = 16.", "SMA10-M-B1-01", "=pangkat_negatif"),
], guna="Cek penguasaan", sulit="Sedang")
cek(3 * 4 + 2 - 5 == 9 and 3 + 4 + 2 - 5 == 4 and 3 * 4 + 2 + 5 == 19 and F(3 * 4 + 2, 5) == F(14, 5))
soal("PB2", 2, "Bentuk sederhana dari (a³)⁴ · a² / a⁵, dengan a ≠ 0, adalah ...", "D", [
    ("a⁹", True, "Benar. (a³)⁴ = a¹², lalu a¹² · a² = a¹⁴, dan a¹⁴/a⁵ = a⁹.", "", "=sifat"),
    ("a⁴", False, "Pada (a³)⁴ pangkatnya dijumlahkan (3 + 4 = 7). Pangkat dari pangkat dikalikan: 3 × 4 = 12.", "SMA10-M-B1-05", "=sifat"),
    ("a¹⁹", False, "Pada pembagian pangkatnya dijumlahkan (12 + 2 + 5). Pada pembagian, pangkat penyebut dikurangkan.", "SMA10-M-B1-04", "=sifat"),
    ("a^{14/5}", False, "Pangkat pembilang dibagi pangkat penyebut (14 : 5). Pada pembagian, pangkatnya dikurangkan: 14 − 5.", "SMA10-M-B1-04", "=sifat"),
], guna="Cek penguasaan", sulit="Sedang")
FASE_PB3 = 120 // 20
cek(FASE_PB3 == 6 and 40 * 2 ** 6 == 2560 and 40 * 2 ** 2 == 160 and 40 * 2 ** 5 == 1280 and 40 + 40 * 6 == 280)
soal("PB3", 3, "Sebuah koloni berisi 40 bakteri. Setiap 20 menit, setiap bakteri membelah menjadi dua. Berapa banyak bakteri setelah 2 jam?", "A", [
    ("2.560", True, "Benar. 2 jam = 120 menit = 6 fase, jadi 40 × 2⁶ = 40 × 64 = 2.560.", "", "=pertumbuhan_fungsi"),
    ("160", False, "Jam dipakai sebagai banyak fase (40 × 2²). Setiap jam ada 3 fase, jadi 2 jam = 6 fase.", "SMA10-M-B1-08", "=pertumbuhan_fungsi"),
    ("1.280", False, "Fasenya dihitung 5 (40 × 2⁵). Dari 0 sampai 120 menit ada 120 : 20 = 6 fase.", "SMA10-M-B1-08", "=pertumbuhan_fungsi"),
    ("280", False, "Setiap fase ditambah 40 (40 + 6 × 40), seperti pertumbuhan linear. Setiap fase banyaknya dikali 2.", "SMA10-M-B1-10", "=pertumbuhan"),
], guna="Cek penguasaan", sulit="Sulit")
cek(243 * F(2, 3) ** 3 == 72 and 243 * F(2, 3) ** 2 == 108 and 243 * F(2, 3) == 162 and 243 * F(1, 3) ** 3 == 9)
soal("PB4", 4, "Kadar suatu zat dalam darah 243 mg. Setiap jam, kadarnya tinggal 2/3 dari kadar satu jam sebelumnya. Berapa kadarnya setelah 3 jam?", "C", [
    ("72 mg", True, "Benar. f(3) = 243 × (2/3)³ = 243 × 8/27 = 72.", "", "=peluruhan_fungsi"),
    ("108 mg", False, "Ini kadar setelah 2 jam, 243 × (2/3)². Setelah 3 jam dikalikan 2/3 sekali lagi.", "SMA10-M-B1-08", "=peluruhan_fungsi"),
    ("162 mg", False, "Ini kadar setelah 1 jam. Setiap jam dikalikan 2/3, jadi tiga kali.", "SMA10-M-B1-08", "=peluruhan_fungsi"),
    ("9 mg", False, "Yang dipakai bagian yang hilang, 1/3, bukan yang tersisa: 243 × (1/3)³. Setiap jam tersisa 2/3.", "SMA10-M-B1-09", "=peluruhan_fungsi"),
], guna="Cek penguasaan", sulit="Sedang")
cek(F(10, 5) == 2 and 10 * 5 ** 0 == 10 and F(10, 2) == 5)
soal("PB5", 5, "Bentuk rasional dari 10/√5 adalah ...", "A", [
    ("2√5", True, "Benar. 10/√5 × √5/√5 = 10√5/5 = 2√5.", "", "=merasionalkan"),
    ("10√5", False, "Pembilang sudah dikalikan √5, tetapi hasilnya belum dibagi penyebut baru, √5 × √5 = 5.", "SMA10-M-B1-13", "=merasionalkan"),
    ("5√5", False, "Penyebutnya dianggap 2, seolah √5 × √5 = 2. Nilainya 5, jadi 10√5/5.", "SMA10-M-B1-13", "=merasionalkan"),
    ("2", False, "√5 di pembilang terlewat. 10√5/5 = 2√5, bukan 2.", "SMA10-M-B1-13", "=merasionalkan"),
], guna="Cek penguasaan", sulit="Sedang")
cek(4 ** 3 == 64)
soal("PB6", 6, "Bentuk logaritma dari 4³ = 64 adalah ...", "B", [
    ("⁴log 64 = 3", True, "Benar. Basis 4 menjadi basis logaritma, 64 numerus, dan pangkat 3 hasilnya.", "", "=log_def"),
    ("³log 64 = 4", False, "Pangkat dan basis tertukar. Basis logaritmanya adalah bilangan pokok eksponen, yaitu 4.", "SMA10-M-B1-14", "=log_def"),
    ("⁶⁴log 4 = 3", False, "Basis dan numerus tertukar. Numerusnya adalah hasil perpangkatan, 64.", "SMA10-M-B1-14", "=log_def"),
    ("⁴log 3 = 64", False, "Numerus dan hasil tertukar. Hasil logaritmanya adalah pangkat, 3.", "SMA10-M-B1-14", "=log_def"),
], guna="Cek penguasaan", sulit="Sedang")
cek(math.isclose(math.log2(3) * math.log(16, 3), 4) and 2 ** 4 == 16 and 3 * 16 == 48)
soal("PB7", 7, "Nilai ²log 3 × ³log 16 adalah ...", "D", [
    ("4", True, "Benar. Menurut sifat 8, ²log 3 × ³log 16 = ²log 16 = 4, karena 2⁴ = 16.", "", "=log_sifat"),
    ("²log 48", False, "Numerusnya dikalikan (3 × 16). Sifat 8 menghubungkan basis dan numerus yang sama: ²log 3 × ³log 16 = ²log 16.", "SMA10-M-B1-15", "=log_sifat"),
    ("16", False, "Hasilnya disamakan dengan numerus ²log 16. Nilai ²log 16 adalah pangkatnya, 4.", "SMA10-M-B1-15", "=log_sifat"),
    ("⁶log 48", False, "Basis dan numerus masing-masing dikalikan. Sifat 8 menghilangkan 3 yang muncul dua kali: hasilnya ²log 16.", "SMA10-M-B1-15", "=log_sifat"),
], guna="Cek penguasaan", sulit="Sedang")
cek(2 ** 3 == 8 and 2 * 3 == 6 and 2 + 3 == 5 and 1 + 3 == 4)
soal("PB8", 2, "Bentuk sederhana dari (2a²b)³ adalah ...", "C", [
    ("8a⁶b³", True, "Benar. Setiap faktor dipangkatkan 3: 2³ = 8, (a²)³ = a⁶, dan b³.", "", "=sifat"),
    ("2a⁶b³", False, "Koefisien 2 tidak ikut dipangkatkan. (ab)ᵐ = aᵐ × bᵐ berlaku juga untuk bilangannya: 2³ = 8.", "SMA10-M-B1-06", "=sifat"),
    ("6a⁶b³", False, "Koefisien 2 dikalikan 3, bukan dipangkatkan 3: 2³ = 8.", "SMA10-M-B1-06", "=sifat"),
    ("8a⁵b⁴", False, "Pangkatnya dijumlahkan dengan 3 (2 + 3 dan 1 + 3). Pangkat dari pangkat dikalikan.", "SMA10-M-B1-05", "=sifat"),
], guna="Cek penguasaan", sulit="Sedang")

# ── Latihan (practice), by lesson.
cek([2 ** n for n in (4, 3, 2, 1, 0)] == [16, 8, 4, 2, 1] and F(2) ** -1 == F(1, 2))
soal("LT1", 1, "Pola 2⁴ = 16, 2³ = 8, 2² = 4, 2¹ = 2 dilanjutkan dengan membagi 2 setiap langkah. Nilai 2⁰ adalah ...", "A", [
    ("1", True, "Benar. 2 : 2 = 1, jadi 2⁰ = 1.", "", "=pola_pangkat"),
    ("0", False, "Pangkat 0 dikira membuat hasilnya 0. Polanya: 2 : 2 = 1.", "SMA10-M-B1-02", "=pola_pangkat"),
    ("2", False, "Nilai 2¹ diulang. Setiap langkah turun, nilainya dibagi 2.", "SMA10-M-B1-02", "=pola_pangkat"),
    ("1/2", False, "Pembagian dilakukan satu langkah terlalu jauh: 1/2 = 1 : 2 adalah 2⁻¹. Dari 2¹ = 2, satu langkah turun memberi 2 : 2 = 1.", "SMA10-M-B1-02", "=pola_pangkat"),
])
cek(F(1, 5) ** 3 == F(5) ** -3 and -(5 ** 3) == -125)
soal("LT2", 1, "Bentuk (1/5)³ sama dengan ...", "D", [
    ("5⁻³", True, "Benar. Menurut definisi, a⁻ⁿ = (1/a)ⁿ, jadi (1/5)³ = 5⁻³.", "", "=pangkat_negatif"),
    ("−5³", False, "Pangkat negatif dikira tanda negatif di depan bilangan. −5³ = −125, sedangkan (1/5)³ = 1/125.", "SMA10-M-B1-02", "=pangkat_negatif"),
    ("5^{1/3}", False, "Pecahan 1/5 dipindah ke pangkat. 5^{1/3} adalah akar pangkat tiga dari 5.", "SMA10-M-B1-03", "=pangkat_negatif"),
    ("3⁻⁵", False, "Bilangan pokok dan pangkat tertukar. Bilangan pokoknya 5.", "SMA10-M-B1-01", "=pangkat_negatif"),
])
cek(3 ** 4 == 81 and F(81, 4) == F(8100, 400) and 9 ** 2 == 81 and 81 * 4 == 324)
soal("LT3", 1, "Nilai 81^{1/4} adalah ...", "C", [
    ("3", True, "Benar. 81^{1/4} adalah bilangan positif p dengan p⁴ = 81, dan 3⁴ = 81.", "", "=pangkat_pecahan"),
    ("20,25", False, "81 dibagi 4. Pangkat 1/4 berarti mencari bilangan yang dipangkatkan 4 hasilnya 81.", "SMA10-M-B1-03", "=pangkat_pecahan"),
    ("9", False, "Ini akar pangkat dua dari 81 (9² = 81). Yang dicari p⁴ = 81.", "SMA10-M-B1-03", "=pangkat_pecahan"),
    ("324", False, "81 dikalikan 4. Pangkat 1/4 berarti akar pangkat empat.", "SMA10-M-B1-03", "=pangkat_pecahan"),
])
cek(7 - 3 == 4 and F(7, 3) == F(7, 3) and 7 + 3 == 10)
soal("LT4", 2, "Bentuk sederhana dari 2⁷ / 2³ adalah ...", "B", [
    ("2⁴", True, "Benar. aᵐ/aⁿ = a^{m−n}, jadi 2^{7−3} = 2⁴.", "", "=sifat"),
    ("2^{7/3}", False, "Pangkatnya dibagi (7 : 3). Pada pembagian, pangkatnya dikurangkan.", "SMA10-M-B1-04", "=sifat"),
    ("1⁴", False, "Bilangan pokoknya ikut dibagi (2 : 2). Bilangan pokok tetap 2.", "SMA10-M-B1-04", "=sifat"),
    ("2¹⁰", False, "Pangkatnya dijumlahkan. Itu sifat perkalian, bukan pembagian.", "SMA10-M-B1-04", "=sifat"),
])
cek(F(3, 2) ** 3 == F(27, 8) and F(3 * 3, 2 * 3) == F(9, 6) and F(27, 2) == F(27, 2) and F(9, 8) == F(9, 8))
soal("LT5", 2, "Nilai (3/2)³ adalah ...", "A", [
    ("27/8", True, "Benar. (a/b)ᵐ = aᵐ/bᵐ, jadi 3³/2³ = 27/8.", "", "=sifat"),
    ("9/6", False, "Pembilang dan penyebut dikalikan 3, bukan dipangkatkan 3.", "SMA10-M-B1-01", "=sifat"),
    ("27/2", False, "Hanya pembilang yang dipangkatkan. Penyebut juga: 2³ = 8.", "SMA10-M-B1-06", "=sifat"),
    ("9/8", False, "Pembilang dikalikan 3, penyebut dipangkatkan 3. Keduanya dipangkatkan: 3³ = 27.", "SMA10-M-B1-06", "=sifat"),
])
cek(F(1, 2) + F(3, 2) == 2 and F(1, 2) * F(3, 2) == F(3, 4) and F(1 + 3, 2 + 2) == 1 and F(1, 2) / F(3, 2) == F(1, 3))
soal("LT6", 2, "Untuk a > 0, bentuk sederhana dari a^{1/2} · a^{3/2} adalah ...", "C", [
    ("a²", True, "Benar. Pangkatnya dijumlahkan: 1/2 + 3/2 = 4/2 = 2.", "", "=sifat"),
    ("a^{3/4}", False, "Pangkatnya dikalikan (1/2 × 3/2). Pada perkalian, pangkatnya dijumlahkan.", "SMA10-M-B1-04", "=sifat"),
    ("a¹", False, "Pembilang dan penyebut pangkat sama-sama dijumlahkan: (1 + 3)/(2 + 2) = 1. Penyebutnya sudah sama, jadi cukup pembilangnya yang dijumlahkan.", "SMA10-M-B1-03", "=sifat"),
    ("a^{1/3}", False, "Pangkatnya dibagi (1/2 : 3/2). Pada perkalian, pangkatnya dijumlahkan.", "SMA10-M-B1-04", "=sifat"),
])
soal("LT7", 3, "Menurut definisi, manakah yang merupakan fungsi eksponensial?", "D", [
    ("f(x) = 5 × 2ˣ", True, "Benar. Bentuknya n × aˣ dengan a = 2 (a > 0, a ≠ 1) dan n = 5 (tak nol).", "", "=fungsi_def"),
    ("f(x) = 1ˣ", False, "Bilangan pokoknya 1, padahal definisinya mensyaratkan a ≠ 1.", "SMA10-M-B1-09", "=fungsi_def"),
    ("f(x) = x³", False, "Di sini x menjadi bilangan pokok, bukan pangkat. Pada fungsi eksponensial, x adalah pangkatnya.", "SMA10-M-B1-09", "=fungsi_def"),
    ("f(x) = 0 × 4ˣ", False, "Koefisiennya 0, padahal definisinya mensyaratkan n bilangan real tak nol.", "SMA10-M-B1-09", "=fungsi_def"),
])
cek(3 * 2 ** 4 == 48 and 6 ** 4 == 1296 and 3 * 2 * 4 == 24 and 3 ** 4 == 81)
soal("LT8", 3, "Diketahui f(x) = 3 × 2ˣ. Nilai f(4) adalah ...", "B", [
    ("48", True, "Benar. f(4) = 3 × 2⁴ = 3 × 16 = 48.", "", "=fungsi_def"),
    ("1.296", False, "Koefisien ikut dipangkatkan: (3 × 2)⁴ = 6⁴. Hitung 2⁴ dahulu, baru kalikan 3.", "SMA10-M-B1-07", "=fungsi_def"),
    ("24", False, "Nilai x dikalikan (3 × 2 × 4). Nilai x adalah pangkat dari 2.", "SMA10-M-B1-07", "=fungsi_def"),
    ("81", False, "Koefisien 3 dipakai sebagai bilangan pokok (3⁴). Bilangan pokoknya 2.", "SMA10-M-B1-07", "=fungsi_def"),
])
soal("LT9", 3, "Fungsi f(x) = aˣ menggambarkan pertumbuhan eksponen bila ...", "A", [
    ("a > 1", True, "Benar. Fungsi pertumbuhan eksponen dituliskan f(x) = aˣ dengan a > 1.", "", "=pertumbuhan_fungsi"),
    ("0 < a < 1", False, "Ini syarat peluruhan eksponen: nilainya makin kecil.", "SMA10-M-B1-09", "=peluruhan_fungsi"),
    ("a = 1", False, "Bilangan pokok 1 tidak diperbolehkan pada fungsi eksponensial.", "SMA10-M-B1-09", "=fungsi_def"),
    ("a < 0", False, "Bilangan pokok fungsi eksponensial harus positif (a > 0).", "SMA10-M-B1-09", "=fungsi_def"),
])
soal("LT10", 4, "Manakah fungsi peluruhan eksponen?", "C", [
    ("f(x) = 20 × (1/4)ˣ", True, "Benar. Bilangan pokoknya 1/4, di antara 0 dan 1.", "", "=peluruhan_fungsi"),
    ("f(x) = 20 × 4ˣ", False, "Bilangan pokoknya 4, lebih dari 1, jadi ini pertumbuhan.", "SMA10-M-B1-09", "=pertumbuhan_fungsi"),
    ("f(x) = 20 − 4x", False, "Ini fungsi linear: berkurang tetap 4 setiap langkah, tidak dikali tetap.", "SMA10-M-B1-10", "=peluruhan"),
    ("f(x) = (1/4) × 20ˣ", False, "Yang 1/4 adalah koefisiennya. Bilangan pokoknya 20, jadi ini pertumbuhan.", "SMA10-M-B1-09", "=pertumbuhan_fungsi"),
])
cek(64 * F(1, 2) ** 3 == 8 and 64 * F(1, 2) == 32 and 64 - 3 == 61 and 64 * F(1, 2) ** 2 == 16)
soal("LT11", 4, "Diketahui f(x) = 64 × (1/2)ˣ. Nilai f(3) adalah ...", "D", [
    ("8", True, "Benar. f(3) = 64 × (1/2)³ = 64 × 1/8 = 8.", "", "=peluruhan_fungsi"),
    ("32", False, "Baru dikalikan 1/2 satu kali. Pangkat 3 berarti tiga kali.", "SMA10-M-B1-01", "=peluruhan_fungsi"),
    ("61", False, "Setiap langkah dikurangi 1 (64 − 3), seperti fungsi linear. Setiap langkah dikalikan 1/2.", "SMA10-M-B1-10", "=peluruhan_fungsi"),
    ("16", False, "Ini f(2). Untuk f(3), 64 dikalikan 1/2 sebanyak tiga kali.", "SMA10-M-B1-08", "=peluruhan_fungsi"),
])
soal("LT12", 5, "Bentuk akar dari x^{3/5} adalah ...", "A", [
    ("(⁵√x)³", True, "Benar. a^{m/n} = (ⁿ√a)ᵐ: penyebut 5 menjadi indeks akar, pembilang 3 menjadi pangkat.", "", "=bentuk_akar"),
    ("(∛x)⁵", False, "Pembilang dan penyebut pangkat tertukar. Penyebutnya, 5, menjadi indeks akar.", "SMA10-M-B1-11", "=bentuk_akar"),
    ("x³ : 5", False, "Pangkat pecahan dibaca sebagai pembagian oleh 5. Penyebut 5 menjadi indeks akar, bukan pembagi.", "SMA10-M-B1-03", "=bentuk_akar"),
    ("x⁻²", False, "Pembilang dikurangi penyebut (3 − 5). Pangkat pecahan bukan pengurangan.", "SMA10-M-B1-03", "=bentuk_akar"),
])
cek(math.isqrt(36 + 64) == 10 and math.isqrt(36) + math.isqrt(64) == 14 and 36 + 64 == 100)
soal("LT13", 5, "Nilai √(36 + 64) adalah ...", "B", [
    ("10", True, "Benar. √(36 + 64) = √100 = 10.", "", "=bentuk_akar"),
    ("14", False, "Akarnya dibagi ke setiap suku: √36 + √64 = 6 + 8. √(a + b) tidak sama dengan √a + √b.", "SMA10-M-B1-12", "=bentuk_akar"),
    ("100", False, "Akarnya belum diambil. 36 + 64 = 100, lalu √100 = 10.", "SMA10-M-B1-12", "=bentuk_akar"),
    ("50", False, "100 dibagi 2. Akar kuadrat 100 adalah bilangan yang dikuadratkan hasilnya 100.", "SMA10-M-B1-03", "=bentuk_akar"),
])
cek(F(1, 2) + F(1, 4) == F(3, 4) and 3 * 4 == 12 and 3 + 4 == 7 and F(1, 2) * F(1, 4) == F(1, 8) and F(1 + 1, 2 + 4) == F(1, 3))
soal("LT14", 5, "Untuk x > 0, bentuk sederhana dari (3√x)(4∜x) adalah ...", "C", [
    ("12x^{3/4}", True, "Benar. 3 × 4 = 12, dan x^{1/2} · x^{1/4} = x^{1/2 + 1/4} = x^{3/4}.", "", "=akar_sifat"),
    ("7x^{3/4}", False, "Koefisiennya dijumlahkan (3 + 4). Koefisien dikalikan: 3 × 4 = 12.", "SMA10-M-B1-04", "=akar_sifat"),
    ("12x^{1/8}", False, "Pangkatnya dikalikan (1/2 × 1/4). Pada perkalian, pangkatnya dijumlahkan.", "SMA10-M-B1-04", "=akar_sifat"),
    ("12x^{1/3}", False, "Pembilang dan penyebut pangkat dijumlahkan: (1 + 1)/(2 + 4). Samakan penyebutnya: 2/4 + 1/4 = 3/4.", "SMA10-M-B1-03", "=akar_sifat"),
], sulit="Sedang")
cek(5 - 1 == 4 and F(4, 4) == 1 and 5 + 1 == 6 and F(4, 6) == F(2, 3) and F(4, 5) == F(4, 5))
soal("LT15", 5, "Bentuk rasional dari 4/(√5 − 1) adalah ...", "D", [
    ("√5 + 1", True, "Benar. Kalikan dengan sekawan (√5 + 1): 4(√5 + 1)/(5 − 1) = √5 + 1.", "", "=merasionalkan"),
    ("√5 − 1", False, "Yang dipakai bentuk yang sama, bukan sekawannya. Sekawan dari √5 − 1 adalah √5 + 1.", "SMA10-M-B1-13", "=merasionalkan"),
    ("(2√5 + 2)/3", False, "Penyebutnya dihitung 5 + 1 = 6. (√5 − 1)(√5 + 1) = 5 − 1 = 4.", "SMA10-M-B1-13", "=merasionalkan"),
    ("4√5/5", False, "Hanya dikalikan √5/√5, seperti merasionalkan 4/√5. Karena ada − 1, kalikan dengan sekawan √5 + 1.", "SMA10-M-B1-13", "=merasionalkan"),
], sulit="Sulit", petunjuk="Kalikan pembilang dan penyebut dengan sekawan penyebutnya.")
cek(F(2) ** -3 == F(1, 8) and 2 ** 3 == 8)
soal("LT16", 6, "Nilai ²log (1/8) adalah ...", "A", [
    ("−3", True, "Benar. 2⁻³ = 1/8, jadi ²log (1/8) = −3.", "", "=log_def"),
    ("3", False, "Ini ²log 8. Untuk 1/8, pangkatnya negatif: 2⁻³ = 1/8.", "SMA10-M-B1-02", "=log_def"),
    ("1/3", False, "Hasilnya ditulis sebagai kebalikan dari 3. Yang dicari pangkat c dengan 2ᶜ = 1/8, yaitu c = −3.", "SMA10-M-B1-14", "=log_def"),
    ("−1/3", False, "Tanda negatif sudah tepat, tetapi hasilnya dibalik. 2⁻³ = 1/8, jadi hasilnya −3.", "SMA10-M-B1-14", "=log_def"),
])
cek(10 ** 3 == 1000 and 1000 // 10 == 100 and 10 * 1000 == 10000)
soal("LT17", 6, "Nilai log 1.000 adalah ...", "C", [
    ("3", True, "Benar. Logaritma umum berbasis 10, dan 10³ = 1.000.", "", "=log_umum"),
    ("100", False, "Numerus dibagi basis (1.000 : 10). Yang dicari pangkatnya.", "SMA10-M-B1-14", "=log_umum"),
    ("4", False, "Yang dihitung banyak angka pada 1.000. Yang dicari pangkat 10 yang hasilnya 1.000.", "SMA10-M-B1-14", "=log_umum"),
    ("10.000", False, "Numerus dikalikan basis (10 × 1.000). Yang dicari pangkatnya.", "SMA10-M-B1-14", "=log_umum"),
])
soal("LT18", 6, "Jika 2ˣ = 20, maka x = ...", "B", [
    ("²log 20", True, "Benar. Menurut definisi, b = aᶜ berarti ᵃlog b = c, jadi x = ²log 20.", "", "=log_def"),
    ("²⁰log 2", False, "Basis dan numerus tertukar. Basisnya 2, bilangan pokok eksponen.", "SMA10-M-B1-14", "=log_def"),
    ("10", False, "20 dibagi 2. Nilai x adalah pangkat 2 yang hasilnya 20, dan 2¹⁰ = 1.024, bukan 20.", "SMA10-M-B1-14", "=log_def"),
    ("20²", False, "Yang dicari pangkatnya, bukan 20 dipangkatkan.", "SMA10-M-B1-14", "=log_def"),
])
cek(8 * 2 == 16 == 4 ** 2 and 8 + 2 == 10 and 4 + 4 == 8)
soal("LT19", 7, "Nilai ⁴log 8 + ⁴log 2 adalah ...", "D", [
    ("2", True, "Benar. ⁴log 8 + ⁴log 2 = ⁴log (8 × 2) = ⁴log 16 = 2, karena 4² = 16.", "", "=log_sifat"),
    ("⁴log 10", False, "Numerusnya dijumlahkan (8 + 2). Menurut sifat 4, numerusnya dikalikan.", "SMA10-M-B1-15", "=log_sifat"),
    ("16", False, "Hasilnya disamakan dengan numerus ⁴log 16. Nilainya pangkatnya, 2.", "SMA10-M-B1-15", "=log_sifat"),
    ("⁸log 16", False, "Basisnya juga dijumlahkan (4 + 4). Basisnya tetap 4.", "SMA10-M-B1-15", "=log_sifat"),
])
cek(3 ** 2 == 9 and 5 * 2 == 10 and 9 * 5 == 45 and 5 + 2 == 7)
soal("LT20", 7, "Nilai ³log 9⁵ adalah ...", "B", [
    ("10", True, "Benar. ³log 9⁵ = 5 × ³log 9 = 5 × 2 = 10.", "", "=log_sifat"),
    ("5", False, "³log 9 dianggap 1. Nilainya 2, karena 3² = 9, jadi 5 × 2 = 10.", "SMA10-M-B1-15", "=log_sifat"),
    ("45", False, "Numerus dikalikan pangkatnya (9 × 5). Menurut sifat 6, pangkat numerus menjadi pengali hasil logaritma.", "SMA10-M-B1-15", "=log_sifat"),
    ("7", False, "Pangkat dan ³log 9 dijumlahkan (5 + 2). Keduanya dikalikan.", "SMA10-M-B1-15", "=log_sifat"),
])

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
    h = "ABCD"[[p[1] for p in s["pilihan"]].index(True)]
    HURUF[h] = HURUF.get(h, 0) + 1
cek(set(HURUF) == set("ABCD") and max(HURUF.values()) * 2 <= len(S) and max(HURUF.values()) - min(HURUF.values()) <= 3, HURUF)
for s in S:
    panjang = [len(p[0]) for p in s["pilihan"]]
    i = [p[1] for p in s["pilihan"]].index(True)
    cek(not all(panjang[i] > panjang[j] for j in range(4) if j != i), f"{s['ref']}: the correct option is strictly the longest")

# The post-test never reuses a Contoh, Latihan or Uji Kompetensi item with its numbers barely
# changed. The book's items and each post-test question's own numbers:
BUKU = {
    "Contoh 1": "(2⁵ × 2³)/2²", "Contoh 2": "(x^{1/3})² × x^{4/3}", "Contoh 3": "30 bakteri, setiap 30 menit, 5 jam",
    "Contoh 4": "8.000 dan 32.000 bakteri", "Contoh 5": "50 mikrogram, setengah setiap jam", "Contoh 6": "(2√x)(3∛x)",
    "Contoh 7": "bukti sifat 4", "Contoh 8": "²log 16 + ²log 8", "Contoh 9": "Rp3.000.000, 5%, tiga kali lipat",
    "Latihan 2.1": "(3⁴)², bᵖb⁵, (3π)ᵖ, sederhanakan 3 bentuk", "Latihan 2.2": "E.coli 50 bakteri, HIV 2%",
    "Latihan 2.3": "200 mg 50%, 0,3 kg 15%, bola 3 m 3/5", "Latihan 2.4": "sederhanakan akar; rasionalkan 2/∜(b³), 2/(√3 + √5), m/(√m + n)",
    "Latihan 2.5": "bentuk pangkat, akar pangkat tiga, bangun kongruen, fraktal, tas 3/4, cangkang, 7^{123}, filter 60%",
    "Latihan 2.6": "⁹log 81, ²log 64 − ²log 16, ⁴log 16¹⁰, ¹²log 100, penduduk 6%, bunga 12%",
    "Uji Kompetensi": "tiga bentuk pangkat, (p + q)/(√p − √q), 500 bakteri",
}
POST_ANGKA = {"PB1": "4⁻²", "PB2": "(a³)⁴ · a² / a⁵", "PB3": "40 bakteri, 20 menit, 2 jam", "PB4": "243 mg, 2/3, 3 jam",
              "PB5": "10/√5", "PB6": "4³ = 64", "PB7": "²log 3 × ³log 16", "PB8": "(2a²b)³"}
cek(set(POST_ANGKA) == {s["ref"] for s in POST} and not set(POST_ANGKA.values()) & set(BUKU.values()))
for s in POST:
    cek(POST_ANGKA[s["ref"]].split(",")[0] in s["tanya"], s["ref"])
cek(not any(w in s["tanya"] for s in POST for w in ("30 bakteri", "50 mikrogram", "8.000", "²log 16 +", "2/(√3", "500 bakteri", "E.coli")))


def periksa_kutipan(path):
    buku = norm(open(path, encoding="utf-8").read())
    ada, gambar = 0, []
    for fid, (hal, kutipan) in FAKTA.items():
        if norm(kutipan) in buku:
            ada += 1
        else:
            gambar.append(fid)
    cek(set(gambar) <= GAMBAR, f"quotations not in the book: {set(gambar) - GAMBAR}")
    return ada, gambar


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
                c.number_format = "@"   # 2.560 and 20,25 stay text

    lembar("Kursus", list(KURSUS), [list(KURSUS.values())])
    lembar("Bab", ["No bab*", "Judul bab*"], [list(b) for b in BAB])
    lembar("Pelajaran", ["No bab", "No pelajaran", "Judul pelajaran", "Ringkasan", "Isi pelajaran", "Tujuan pembelajaran", "Tingkat berpikir", "Media", "Transkrip"],
           [[1, p["no"], p["judul"], p["ringkasan"], p["isi"], p["tujuan"], p["bloom"], "", ""] for p in PELAJARAN])
    lembar("Soal", ["Kode soal", "No bab", "No pelajaran", "Jenis soal", "Pertanyaan", "Bacaan", "Petunjuk", "Kegunaan", "Tingkat kesulitan", "Kelompok paralel"],
           [[s["ref"], 1, s["pel"], "Pilihan ganda", s["tanya"], "", s["petunjuk"], s["guna"], s["sulit"], ""] for s in S])
    # every distractor names its misconception's code, defined on the «Miskonsepsi» sheet (CR-50, D-063 M5, D-120 Q9)
    lembar("Pilihan", ["Kode soal", "Pilihan", "Teks pilihan", "Benar", "Alasan", "Kode miskonsepsi"],
           [[s["ref"], "ABCD"[i], p[0], "Ya" if p[1] else "Tidak", p[2], p[3]] for s in S for i, p in enumerate(s["pilihan"])])
    lembar("Miskonsepsi", ["Kode", "Nama", "Penjelasan", "Cara membantu"],
           [[k, label, desk, rem] for k, (label, desk, rem) in MISKONSEPSI.items()])
    wb.save(path)


def tulis_miskonsepsi(path):
    pakai = {k: [] for k in MISKONSEPSI}
    for s in S:
        for i, p in enumerate(s["pilihan"]):
            if p[3]:
                pakai[p[3]].append(f"{s['ref']}:{'ABCD'[i]}")
    for k, v in pakai.items():
        cek(v, f"{k} is proposed but no distractor uses it")
    with open(path, "w", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        w.writerow(["code", "label", "description", "remediation", "questions"])
        for k, (label, desk, rem) in MISKONSEPSI.items():
            w.writerow([k, label, desk, rem, ";".join(pakai[k])])


if __name__ == "__main__":
    here = os.path.dirname(os.path.abspath(__file__))
    tulis(os.path.join(here, "SMA10-Matematika-Bab1.xlsx"))
    tulis_miskonsepsi(os.path.join(here, "SMA10-Matematika-Bab1-miskonsepsi.csv"))
    halaman = sum(p["isi"].count("## ") for p in PELAJARAN)
    print(f"SMA10-Matematika-Bab1.xlsx: lessons {len(PELAJARAN)} ({halaman} pages), questions {len(S)} "
          f"(pre {len(PRE)}, post {len(POST)}, practice {len(LAT)}), answers "
          + " ".join(f"{h}={HURUF[h]}" for h in "ABCD"))
    print(f"SMA10-Matematika-Bab1-miskonsepsi.csv: {len(MISKONSEPSI)} codes")
    print(f"facts traced: {len(FAKTA)} (pages {min(h for h, _ in FAKTA.values())}-{max(h for h, _ in FAKTA.values())})")
    if "--kutipan" in sys.argv:
        ada, gambar = periksa_kutipan(sys.argv[sys.argv.index("--kutipan") + 1])
        print(f"quotations found in the book's text: {ada} of {len(FAKTA)}; figures read by eye: {', '.join(gambar) or 'none'}")
    print(f"assertions passed: {CEK[0]}")
