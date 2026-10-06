# SMA Kelas X, Matematika, Bab 7 "Peluang", as a PINTAR lesson workbook in the D-007
# template (sheets Kursus, Bab, Pelajaran, Soal, Pilihan; the column contract is KOLOM in
# src/lib/unggah-kontrak.ts). Built with the method of Bab 1 (LANA-21).
#
# Source: the student book "Matematika untuk SMA/MA/SMK/MAK Kelas X (Edisi Revisi)" (Dicky Susanto
# dkk.; Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi, 2023; ISBN 978-623-118-558-7),
# Bab 7, pp. 239-269. It has no numbered Contoh; its worked examples (the six two-dice
# probabilities on pp. 244-245, the relative frequency 8/20, the 5/36 of Eksplorasi 7.3) are
# checked here. Its Latihan and Uji Kompetensi have no keys, so every key here is ours.
#
#   - Every probability in a lesson, key or distractor is computed here and asserted by
#     enumerating the sample space (one die, two dice, coins, a bag) with exact Fractions, and
#     every distractor's own value by the procedure its rationale names.
#   - Every definition and property is in FAKTA with its page and the book's words; `--kutipan`
#     checks the prose against the book's text. Formulas were read from the page images (the text
#     layer keeps most of this chapter), so the data sets are re-read and recomputed.
#   - Statements that are false or doubtful outside the book are kept out, and DILUAR asserts it.
#   - Notation: × and :, decimal comma; probabilities as fractions (5/36) or decimals (0,56);
#     P(A ∪ B), P(A ∩ B); sample-space grids and tables become value lines.
#     No LaTeX, HTML or tables; the book's tables become value lines.
#
# Run: python3 docs/onboarding/konten/sma10_matematika_bab7.py [--kutipan book.txt]
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




# Pembuka dan A. Distribusi peluang (pp. 241-249)
fakta("peluang_def", 241, "Peluang adalah suatu ukuran tentang kemungkinan suatu kejadian (event) yang akan terjadi (atau tidak terjadi) di masa mendatang.")
fakta("nol_satu", 241, "Jika sebuah kejadian tidak mungkin terjadi, maka peluangnya 0. • Jika sebuah kejadian pasti terjadi, maka peluangnya 1. • Peluang memiliki nilai antara 0 dan 1 inklusif (0 dan 1 termasuk).")
fakta("ruang_sampel", 241, "Ruang sampel adalah himpunan semua hasil yang mungkin dalam suatu percobaan (eksperimen) peluang dan diberikan lambang S.")
fakta("titik_sampel", 241, "Titik sampel adalah anggota dari ruang sampel.")
fakta("peluang_rumus", 241, "adalah banyaknya anggota dalam kejadian A dan adalah banyaknya anggota dalam himpunan ruang sampel.")
fakta("dadu_adil", 242, "Dadu memiliki bentuk simetris dan dengan asumsi dadu tersebut adil sehingga setiap sisi memiliki kemungkinan yang sama besarnya saat dadu dilempar.")
fakta("tiga_puluh_enam", 243, "Untuk dadu yang adil, semua 36 hasil pada ruang sampel sama kemungkinannya untuk terjadi.")
fakta("contoh_11", 244, "Peluang jumlah 11 adalah")
fakta("distribusi", 246, "Distribusi peluang adalah deskripsi dari semua kemungkinan hasil dari situasi acak bersama dengan peluang terjadinya masing-masing.")
# B. Aturan penjumlahan (pp. 250-257)
fakta("atau", 251, "Dalam matematika, kata “atau” berarti “salah satu atau kedua-duanya”.")
fakta("saling_lepas", 252, "Dua kejadian dikatakan saling lepas (atau disjoint) jika tidak mungkin bagi keduanya untuk terjadi pada hasil yang sama.")
fakta("delapan_20", 252, "Jika jawabanmu adalah 8 20 atau 2 5, maka kamu benar.")
fakta("frek_relatif", 252, "Peluang dari hasil percobaan atau eksperimen disebut juga frekuensi relatif, dan didapatkan dengan membagi jumlah kejadian yang diinginkan dengan jumlah percobaan yang dilakukan.")
fakta("mendekati", 252, "Tentu dengan makin banyak percobaan yang dilakukan, maka hasilnya akan makin mendekati peluang teoretis.")
fakta("frek_harapan", 253, "Ini disebut dengan frekuensi harapan, yaitu berapa banyak kali hasil yang diharapkan akan muncul.")
fakta("tidak_dijamin", 253, "Perlu diingat meskipun kamu berharap mendapatkan angka genap sebanyak 80 kali, hal ini tidak dijamin, dan hasil sebenarnya mungkin akan berbeda.")
fakta("penjumlahan_lepas", 255, "Peraturan ini disebut aturan penjumlahan untuk kejadian saling lepas.")
fakta("penjumlahan", 256, "P(A) + P(B) – . Aturan ini disebut aturan penjumlahan.")
# C. Aturan perkalian (pp. 257-260)
fakta("saling_bebas", 258, "Pasangan kejadian pada masalah di atas adalah saling bebas, yaitu kejadian yang satu tidak memengaruhi peluang kejadian yang lainnya.")
fakta("perkalian", 259, "jika dua kejadian adalah saling bebas, maka untuk menentukan peluang terjadinya kedua kejadian tersebut dapat menggunakan aturan perkalian.")
fakta("dobel", 259, "P (tidak dobel pada lemparan pertama)∙ P (dobel pada lemparan kedua)")
fakta("tidak_bebas", 259, "Namun jika setelah ambil bola pertama, kamu tidak mengembalikan bola pertama, maka kejadiannya tidak saling bebas.")
# For the book-error record only (not used by any question)
fakta("aturan_lepas", 255, "P(A ∪ B) = P(A atau B)")
fakta("duplikat", 243, "sama besarnya dengan peluang mendapatkan angka yang berbeda dengan peluang mendapatkan angka yang berbeda")
fakta("tabel_nomor", 246, "Misalnya, Tabel 7.2 distribusi peluang di bawah ini menunjukkan semua kemungkinan jumlah yang dapat diperoleh dari lemparan dua dadu. Tabel 7.1 Distribusi Peluang untuk Jumlah Dua Dadu")
fakta("akan_26", 253, "kamu akan mendapatkan angka genap sebanyak 26 kali")
fakta("gambar74", 256, "Pada Gambar 7.4, diagram mana yang menggambarkan situasi dua kejadian yang tidak saling lepas?")
fakta("jumlah5_pa", 256, "Peluang mendapatkan jumlah 5 adalah P(A) =")
fakta("bola_bebas", 259, "Pilihan bola pertama tidak memengaruhi pilihan bola kedua.")
fakta("covid", 241, "Berapa persen kemungkinan seseorang terpapar Covid-19?")
fakta("sepanag", 258, "Lemparan Pertama Sepanag Dadu")
REKAMAN = {"aturan_lepas", "duplikat", "tabel_nomor", "akan_26", "gambar74", "jumlah5_pa", "bola_bebas", "covid", "sepanag"}
GAMBAR = {"aturan_lepas"}     # the p. 255 rule is typeset as an image; read by eye

DUA_DADU = [(a, b) for a in range(1, 7) for b in range(1, 7)]
DADU = list(range(1, 7))


def P(kejadian, ruang):
    """Peluang = n(A) : n(S) for equally likely outcomes, exactly."""
    return F(sum(1 for h in ruang if kejadian(h)), len(ruang))


def jml(h):
    return h[0] + h[1]


def sama(h):
    return h[0] == h[1]


# ── What can be computed (every number the lessons use) ──
cek(len(DUA_DADU) == 36 and (3, 2) in DUA_DADU and (2, 3) in DUA_DADU and (3, 2) != (2, 3))
cek(P(lambda x: x % 2 == 0, DADU) == F(1, 2) and P(lambda x: x == 7, DADU) == 0 and P(lambda x: x <= 6, DADU) == 1)
DIST = {s: P(lambda h, s=s: jml(h) == s, DUA_DADU) for s in range(2, 13)}
cek([DIST[s] * 36 for s in range(2, 13)] == [1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1] and sum(DIST.values()) == 1)
cek(max(DIST, key=DIST.get) == 7 and DIST[7] == F(1, 6))
# The book's worked examples (pp. 244-245), all correct:
cek(DIST[11] == F(1, 18))
cek(P(lambda h: 2 in h or jml(h) == 2, DUA_DADU) == F(1, 3) and P(lambda h: 2 in h, DUA_DADU) == F(11, 36))
cek(P(lambda h: sama(h) and jml(h) == 8, DUA_DADU) == F(1, 36) and P(lambda h: sama(h) or jml(h) == 8, DUA_DADU) == F(5, 18))
cek(P(lambda h: jml(h) <= 9, DUA_DADU) == F(5, 6) and P(lambda h: jml(h) >= 9, DUA_DADU) == F(5, 18))
cek(1 - P(lambda h: jml(h) >= 10, DUA_DADU) == F(5, 6))
KOIN2 = [(a, b) for a in "GA" for b in "GA"]
cek([P(lambda h, k=k: h.count("G") == k, KOIN2) for k in (0, 1, 2)] == [F(1, 4), F(1, 2), F(1, 4)])
# Lesson 3
cek(F(8, 20) == F(2, 5) == F(4, 10) and F(1, 2) * 200 == 100 and F(4, 10) * 200 == 80)
cek(F(1, 6) * 60 == 10)
# Lesson 4: disjoint events
cek(not any(sama(h) and jml(h) == 7 for h in DUA_DADU))
cek(P(lambda h: sama(h) or jml(h) == 7, DUA_DADU) == F(6, 36) + F(6, 36) == F(1, 3))
cek(DIST[3] + DIST[4] == F(5, 36) == P(lambda h: jml(h) in (3, 4), DUA_DADU))
cek(P(lambda h: 2 in h, DUA_DADU) + DIST[2] == F(12, 36) and not any(2 in h and jml(h) == 2 for h in DUA_DADU))
# Lesson 5: events that are not disjoint
cek(F(6, 36) + F(5, 36) - F(1, 36) == F(10, 36) == F(5, 18) and F(6, 36) + F(5, 36) == F(11, 36))
cek(P(lambda x: x % 2 == 0 or x > 3, DADU) == F(3, 6) + F(3, 6) - F(2, 6) == F(2, 3))
# Lesson 6: independent events
cek(F(5, 6) * F(1, 6) == F(5, 36) and P(lambda h: not sama(h), DUA_DADU) == F(5, 6))
cek(len([(x, y) for x in DUA_DADU for y in DUA_DADU if not sama(x) and sama(y)]) == 30 * 6 == 180 and F(180, 36 * 36) == F(5, 36))
cek(F(1, 2) * F(1, 2) == F(1, 4))
cek(F(5, 12) * F(7, 12) == F(35, 144) and F(5, 12) * F(7, 11) == F(35, 132))               # with and without replacement
# BOOK INCONSISTENCIES (checked here, kept out of lessons and questions):
# p. 253: the expected count 26,4 is an expectation, not «akan mendapatkan … 26 kali».
cek(F(40, 100) * 66 == F(132, 5) and desimal(132 / 5, 1) == "26,4")
# Latihan 7.3 (checked, not used): lamps 30 + 75 + 160 + 35 = 300; not kidal 0,77 × 10.000 = 7.700.
cek(30 + 75 + 160 + 35 == 300 and F(35, 300) * 2000 == F(700, 3) and (1 - F(23, 100)) * 10000 == 7700)
cek(14 + 28 + 20 + 5 + 13 == 80 and F(5, 80) * 480 == 30)

SUMBER = ("_Diadaptasi dari Matematika untuk SMA/MA/SMK/MAK Kelas X (Edisi Revisi), Dicky Susanto dkk., "
          "Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi, 2023, Bab 7._")

KURSUS = {
    "Judul kursus*": "Matematika Kelas X · Bab 7: Peluang",
    "Mata pelajaran*": "Matematika",
    "Jenjang*": "SMA",
    "Kelas*": "Kelas X",
    "Konteks": "Akademik",
}

BAB = [(1, "Peluang")]

PELAJARAN = [
    dict(no=1, judul="Ruang Sampel dan Peluang",
         ringkasan="Peluang suatu kejadian adalah bilangan dari 0 sampai 1; jika semua hasil sama kemungkinannya, P(A) = n(A) : n(S).",
         tujuan="Kamu dapat menentukan ruang sampel dan menghitung peluang kejadian dengan hasil-hasil yang sama kemungkinannya.",
         bloom="Memahami",
         isi="""## Apa itu peluang

**Peluang** adalah ukuran kemungkinan suatu kejadian akan terjadi (atau tidak terjadi).

- Kejadian yang tidak mungkin terjadi mempunyai peluang 0.
- Kejadian yang pasti terjadi mempunyai peluang 1.
- Peluang selalu bernilai dari 0 sampai 1, termasuk 0 dan 1. Peluang ditulis sebagai pecahan, desimal, atau persen.

## Ruang sampel

**Ruang sampel** S adalah himpunan semua hasil yang mungkin dari suatu percobaan. Setiap anggotanya disebut **titik sampel**, dan banyaknya anggota S ditulis n(S).

- Sebuah dadu dilempar: S = {1, 2, 3, 4, 5, 6}, n(S) = 6.
- Dua keping uang logam dilempar: S = {GG, GA, AG, AA}, n(S) = 4.
- Dadu merah dan dadu putih dilempar: setiap hasil adalah pasangan (merah, putih), misalnya (3, 2). Hasil (3, 2) berbeda dengan (2, 3), karena dadunya dapat dibedakan. Ada 6 × 6 = 36 hasil.

## Menghitung peluang

Jika semua hasil sama kemungkinannya, seperti pada dadu yang adil, peluang kejadian A adalah

P(A) = n(A) : n(S)

dengan n(A) banyaknya hasil dalam kejadian A.

**Contoh.** Sebuah dadu dilempar. Berapa peluang muncul bilangan genap? Hasil genapnya 2, 4, dan 6, jadi P(genap) = 3/6 = **1/2**.

**Contoh.** Dua dadu dilempar. Berapa peluang jumlahnya 11? Hasilnya (5, 6) dan (6, 5), jadi P = 2/36 = **1/18**.

""" + SUMBER),
    dict(no=2, judul="Distribusi Peluang",
         ringkasan="Distribusi peluang mendaftar semua hasil yang mungkin beserta peluangnya; jumlah semua peluangnya 1.",
         tujuan="Kamu dapat menyusun dan memakai distribusi peluang, misalnya untuk jumlah dua dadu.",
         bloom="Menerapkan",
         isi="""## Jumlah dua dadu

**Distribusi peluang** adalah daftar semua hasil yang mungkin dari suatu situasi acak beserta peluang terjadinya masing-masing. Untuk jumlah angka dua dadu (dari 36 hasil):

- jumlah 2 → 1/36
- jumlah 3 → 2/36
- jumlah 4 → 3/36
- jumlah 5 → 4/36
- jumlah 6 → 5/36
- jumlah 7 → 6/36
- jumlah 8 → 5/36
- jumlah 9 → 4/36
- jumlah 10 → 3/36
- jumlah 11 → 2/36
- jumlah 12 → 1/36

Jumlah semua peluangnya 36/36 = 1. Jumlah yang paling mungkin adalah 7.

## Hasil yang tidak sama kemungkinannya

Ada 11 jumlah yang mungkin (2 sampai 12), tetapi peluang jumlah 7 **bukan** 1/11. Jumlah-jumlah itu tidak sama kemungkinannya: jumlah 7 dapat terjadi dengan 6 cara, sedangkan jumlah 2 hanya dengan 1 cara, (1, 1). Peluang dihitung dari 36 hasil yang sama kemungkinannya.

## Memakai distribusi

- P(jumlah setidaknya 9) = (4 + 3 + 2 + 1)/36 = 10/36 = **5/18**
- P(jumlah tidak lebih dari 9) = 1 − P(jumlah 10, 11, atau 12) = 1 − 6/36 = **5/6**

Cara kedua memakai kenyataan bahwa jumlah semua peluang adalah 1.

## Dua uang logam

Untuk banyaknya gambar (G) pada dua uang logam, dari S = {GG, GA, AG, AA}:

- 0 gambar → 1/4
- 1 gambar → 2/4 = 1/2
- 2 gambar → 1/4

""" + SUMBER),
    dict(no=3, judul="Frekuensi Relatif dan Frekuensi Harapan",
         ringkasan="Frekuensi relatif adalah peluang dari hasil percobaan; frekuensi harapan adalah peluang dikali banyaknya percobaan.",
         tujuan="Kamu dapat membedakan peluang teoretis dan frekuensi relatif serta menghitung frekuensi harapan.",
         bloom="Menerapkan",
         isi="""## Frekuensi relatif

Secara teoretis, peluang muncul angka genap pada sebuah dadu adalah 3/6 = 1/2. Dalam percobaan, hasilnya dapat berbeda. Misalnya dadu dilempar 20 kali dan angka genap muncul 8 kali.

**Frekuensi relatif** adalah peluang dari hasil percobaan:

frekuensi relatif = banyak kejadian yang diinginkan : banyak percobaan = 8/20 = 2/5 = 0,4

Makin banyak percobaan yang dilakukan, frekuensi relatif makin mendekati peluang teoretis.

## Frekuensi harapan

**Frekuensi harapan** adalah berapa kali suatu hasil diharapkan muncul:

frekuensi harapan = peluang × banyak percobaan

**Contoh.** Sebuah dadu dilempar 200 kali. Berapa kali angka genap diharapkan muncul?

- Dengan peluang teoretis 1/2: 1/2 × 200 = **100 kali**.
- Dengan frekuensi relatif percobaan tadi, 0,4: 0,4 × 200 = 80 kali.

## Harapan, bukan kepastian

Frekuensi harapan adalah perkiraan, bukan jaminan. Jika dadu dilempar 200 kali, angka genap mungkin muncul 97 kali atau 104 kali; yang diharapkan sekitar 100 kali.

Frekuensi harapan juga tidak harus bilangan bulat. Contoh: angka 6 pada 60 lemparan dadu diharapkan muncul 1/6 × 60 = 10 kali, sedangkan pada 50 lemparan diharapkan 50/6 ≈ 8,3 kali.

""" + SUMBER),
    dict(no=4, judul="Kejadian Saling Lepas",
         ringkasan="Dua kejadian saling lepas jika tidak mungkin terjadi pada hasil yang sama; peluang A atau B adalah P(A) + P(B).",
         tujuan="Kamu dapat mengenali kejadian saling lepas dan memakai aturan penjumlahannya.",
         bloom="Menerapkan",
         isi="""## Arti kata «atau»

Dalam matematika, «A atau B» berarti A terjadi, B terjadi, atau keduanya terjadi. Misalnya, kejadian «siswa naik sepeda atau motor» mencakup siswa yang hanya naik sepeda, yang hanya naik motor, dan yang dapat memakai keduanya.

## Saling lepas

Dua kejadian **saling lepas** jika keduanya tidak mungkin terjadi pada hasil yang sama. Pada diagram Venn, lingkaran A dan B tidak beririsan, jadi P(A ∩ B) = 0.

- Dua dadu: «jumlah 7» dan «dua angka sama» saling lepas, karena dua angka sama selalu berjumlah genap.
- Dua dadu: «jumlah 8» dan «dua angka sama» tidak saling lepas, karena (4, 4) memenuhi keduanya.

## Aturan penjumlahan untuk kejadian saling lepas

Jika A dan B saling lepas, maka

P(A ∪ B) = P(A) + P(B)

**Contoh.** Dua dadu dilempar. Berapa peluang jumlahnya 7 atau kedua angkanya sama?

1. P(jumlah 7) = 6/36 dan P(dua angka sama) = 6/36.
2. Kedua kejadian saling lepas, jadi P = 6/36 + 6/36 = 12/36 = **1/3**.

**Contoh.** Peluang jumlah 3 atau 4: 2/36 + 3/36 = **5/36**.

## Periksa dahulu

Sebelum menjumlahkan, periksa apakah ada hasil yang termasuk kedua kejadian. Contoh: «muncul angka 2 pada setidaknya satu dadu» (11 hasil) dan «jumlahnya 2» (hanya (1, 1)) saling lepas, karena (1, 1) tidak memuat angka 2. Jadi peluangnya 11/36 + 1/36 = 12/36 = **1/3**.

""" + SUMBER),
    dict(no=5, judul="Kejadian Tidak Saling Lepas",
         ringkasan="Jika A dan B dapat terjadi bersamaan, P(A ∪ B) = P(A) + P(B) − P(A ∩ B), supaya irisannya tidak terhitung dua kali.",
         tujuan="Kamu dapat memakai aturan penjumlahan untuk dua kejadian yang tidak saling lepas.",
         bloom="Menerapkan",
         isi="""## Irisan terhitung dua kali

Jika A dan B dapat terjadi pada hasil yang sama, lingkaran A dan B pada diagram Venn beririsan. Saat P(A) dan P(B) dijumlahkan, hasil-hasil di irisan A ∩ B terhitung dua kali. Karena itu irisannya dikurangkan satu kali.

## Aturan penjumlahan

P(A ∪ B) = P(A) + P(B) − P(A ∩ B)

Jika A dan B saling lepas, P(A ∩ B) = 0 dan aturan ini menjadi P(A) + P(B).

## Contoh: dua dadu

Dua dadu dilempar. Berapa peluang kedua angkanya sama atau jumlahnya 8?

1. P(dua angka sama) = 6/36: (1, 1), (2, 2), …, (6, 6).
2. P(jumlah 8) = 5/36: (2, 6), (3, 5), (4, 4), (5, 3), (6, 2).
3. P(keduanya) = 1/36: hanya (4, 4).
4. P = 6/36 + 5/36 − 1/36 = 10/36 = **5/18**.

Jika irisannya tidak dikurangkan, hasilnya 11/36, karena (4, 4) terhitung dua kali.

## Contoh: satu dadu

Sebuah dadu dilempar. Berapa peluang muncul angka genap atau angka lebih dari 3?

1. Genap: {2, 4, 6}, lebih dari 3: {4, 5, 6}, keduanya: {4, 6}.
2. P = 3/6 + 3/6 − 2/6 = 4/6 = **2/3**. Periksa: hasilnya {2, 4, 5, 6}, empat dari enam.

""" + SUMBER),
    dict(no=6, judul="Kejadian Saling Bebas dan Aturan Perkalian",
         ringkasan="Dua kejadian saling bebas jika yang satu tidak memengaruhi peluang yang lain; peluang keduanya terjadi adalah P(A) × P(B).",
         tujuan="Kamu dapat mengenali kejadian saling bebas dan memakai aturan perkalian.",
         bloom="Menerapkan",
         isi="""## Saling bebas

Dua kejadian **saling bebas** jika terjadinya kejadian yang satu tidak memengaruhi peluang kejadian yang lain. Contoh: hasil lemparan pertama sebuah dadu tidak memengaruhi hasil lemparan kedua.

Untuk kejadian saling bebas berlaku **aturan perkalian**:

P(A dan B) = P(A) × P(B)

Kedua kejadian boleh terjadi berurutan (koin pertama lalu koin kedua) atau bersamaan (dua koin dilempar sekaligus).

## Contoh: dobel pada lemparan kedua

Sepasang dadu dilempar dua kali. Berapa peluang lemparan pertama tidak dobel (angka tidak sama) dan lemparan kedua dobel?

1. P(tidak dobel) = 30/36 = 5/6 dan P(dobel) = 6/36 = 1/6.
2. Kedua lemparan saling bebas, jadi P = 5/6 × 1/6 = **5/36**.

Dengan model luas: dari 36 × 36 = 1.296 pasangan hasil, ada 30 × 6 = 180 yang memenuhi, dan 180/1.296 = 5/36.

## Tidak saling bebas

Sebuah tas berisi 5 bola merah dan 7 bola biru. Dua bola diambil satu per satu.

- **Dengan pengembalian:** bola pertama dikembalikan, jadi peluang bola kedua tidak berubah. P(merah lalu biru) = 5/12 × 7/12 = 35/144.
- **Tanpa pengembalian:** setelah bola merah diambil, tinggal 11 bola, 7 di antaranya biru. Kejadiannya tidak saling bebas, dan P(merah lalu biru) = 5/12 × 7/11 = 35/132.

## Rangkuman Bab 7

- P(A) = n(A) : n(S) untuk hasil yang sama kemungkinannya; 0 ≤ P(A) ≤ 1.
- Distribusi peluang: semua hasil beserta peluangnya; jumlahnya 1.
- Frekuensi relatif = banyak kejadian : banyak percobaan; frekuensi harapan = peluang × banyak percobaan, sebuah perkiraan.
- Saling lepas: P(A ∪ B) = P(A) + P(B). Tidak saling lepas: P(A ∪ B) = P(A) + P(B) − P(A ∩ B).
- Saling bebas: P(A dan B) = P(A) × P(B).

""" + SUMBER),
]

# Statements that are false or doubtful outside the book, or book errors, stay out of the lessons.
DILUAR = ("Covid", "akan mendapatkan angka genap sebanyak", "P(A ∪ B) = P(A atau B)", "Sepanag", "Pilihan bola pertama tidak memengaruhi")
for _p in PELAJARAN:
    cek(3 <= _p["isi"].count("\n## ") + _p["isi"].startswith("## ") <= 6, f"lesson {_p['no']}: 3-6 pages")
    cek(_p["isi"].rstrip().endswith(SUMBER), f"lesson {_p['no']}: attribution last")
    cek(_p["isi"].count("Coba pikirkan") <= 1, f"lesson {_p['no']}: at most one Coba pikirkan")
    cek(not any(w in _p["isi"] for w in DILUAR), f"lesson {_p['no']}: {[w for w in DILUAR if w in _p['isi']]}")
    cek(not re.search(r"\b[Ss]alah\b", _p["isi"]), f"lesson {_p['no']}: «salah»")
    notasi(_p["isi"], f"lesson {_p['no']}")
    notasi(_p["ringkasan"], f"lesson {_p['no']} ringkasan")
# p. 255 prints the disjoint rule without P(A) + P(B); lesson 4 states it.
cek("P(A ∪ B) = P(A) + P(B)\n" in PELAJARAN[3]["isi"])
# The distribution printed in lesson 2 is the computed one.
cek(all(f"jumlah {s} → {DIST[s] * 36}/36" in PELAJARAN[1]["isi"] for s in range(2, 13)))
cek(F(50, 6) == F(25, 3) and desimal(50 / 6, 1) == "8,3")

# ── Misconceptions: the book has no Miskonsepsi section; these come from the distractors.
MISKONSEPSI = {
    "SMA10-M-B7-01": ("Peluang di luar 0 sampai 1",
                      "Nilai peluang lebih dari 1 atau negatif dianggap mungkin, atau peluang ditulis sebagai banyaknya hasil.",
                      "Ingat: peluang adalah bagian dari seluruh hasil, jadi selalu dari 0 sampai 1."),
    "SMA10-M-B7-02": ("Ruang sampel keliru",
                      "Urutan hasil diabaikan (misalnya (2, 3) dan (3, 2) dianggap satu), atau banyaknya dijumlahkan, bukan dikalikan.",
                      "Tulis semua pasangan dalam tabel 6 × 6 untuk dua dadu."),
    "SMA10-M-B7-03": ("Hasil yang tidak sama kemungkinannya dianggap sama",
                      "Peluang dihitung dari daftar hasil yang tidak sama kemungkinannya, misalnya 11 jumlah dua dadu.",
                      "Hitung dari hasil-hasil dasar yang sama kemungkinannya, misalnya 36 pasangan dadu."),
    "SMA10-M-B7-04": ("Titik sampel terlewat atau berlebih",
                      "Ada hasil dalam kejadian yang tidak terhitung, atau bilangan yang tidak memenuhi ikut dihitung.",
                      "Daftarkan hasil kejadian satu per satu, lalu periksa setiap hasil."),
    "SMA10-M-B7-05": ("Frekuensi relatif dan peluang teoretis tertukar",
                      "Frekuensi relatif hasil percobaan disamakan dengan peluang teoretis, atau sebaliknya.",
                      "Frekuensi relatif = banyak kejadian : banyak percobaan dari data percobaan."),
    "SMA10-M-B7-06": ("Frekuensi harapan keliru",
                      "Peluang tidak dikalikan dengan banyak percobaan, atau frekuensi harapan dianggap pasti terjadi.",
                      "Frekuensi harapan = peluang × banyak percobaan, dan itu perkiraan."),
    "SMA10-M-B7-07": ("Kejadian saling lepas tidak dikenali",
                      "Dua kejadian yang dapat terjadi bersamaan dianggap saling lepas, atau sebaliknya.",
                      "Cari satu hasil yang memenuhi kedua kejadian; jika ada, keduanya tidak saling lepas."),
    "SMA10-M-B7-08": ("Irisan tidak dikurangkan",
                      "Pada kejadian yang tidak saling lepas, P(A) dan P(B) dijumlahkan tanpa mengurangkan P(A ∩ B).",
                      "Gambar diagram Venn: irisannya terhitung dua kali."),
    "SMA10-M-B7-09": ("Aturan penjumlahan dan perkalian tertukar",
                      "Untuk «atau» peluangnya dikalikan, atau untuk «dan» peluangnya dijumlahkan.",
                      "«Atau» memakai aturan penjumlahan; «dan» pada kejadian saling bebas memakai aturan perkalian."),
    "SMA10-M-B7-10": ("Pengurangan irisan keliru",
                      "Yang dikurangkan bukan P(A ∩ B), atau irisan dikurangkan lebih dari sekali.",
                      "Kurangkan tepat satu kali peluang irisan."),
    "SMA10-M-B7-11": ("Kejadian saling bebas tidak dikenali",
                      "Pengambilan tanpa pengembalian dianggap saling bebas, atau lemparan terpisah dianggap saling memengaruhi.",
                      "Tanyakan: apakah hasil pertama mengubah peluang hasil kedua?"),
    "SMA10-M-B7-12": ("Banyaknya kejadian dianggap peluang",
                      "Yang ditulis banyaknya hasil atau banyaknya kejadian dalam percobaan, bukan perbandingannya.",
                      "Bagi dengan banyak seluruh hasil atau banyak seluruh percobaan."),
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




# ── Pemetaan awal (pre-test): a simple probability, a two-dice sum, disjoint events, two coins.
cek(P(lambda x: x % 2 == 0, DADU) == F(1, 2) and F(2, 6) == F(1, 3) and F(1, 6) == P(lambda x: x == 6, DADU))
soal("PA1", 1, "Sebuah dadu dilempar. Peluang muncul bilangan genap adalah ...", "A", [
    ("1/2", True, "Benar. Ada 3 bilangan genap (2, 4, 6) dari 6 hasil: 3/6 = 1/2.", "", "=peluang_rumus"),
    ("1/3", False, "Hanya dua bilangan genap yang terhitung (2/6). Bilangan genapnya 2, 4, dan 6.", "SMA10-M-B7-04", "=peluang_rumus"),
    ("3", False, "Itu banyaknya hasil genap. Peluang = 3 : 6.", "SMA10-M-B7-12", "=peluang_rumus"),
    ("1/6", False, "Itu peluang satu angka tertentu, misalnya angka 6.", "SMA10-M-B7-04", "=peluang_rumus"),
], guna="Pemetaan awal")
cek(DIST[7] == F(1, 6) and F(3, 36) == F(1, 12) and F(7, 36) != DIST[7])
soal("PA2", 2, "Dua dadu dilempar. Peluang jumlah kedua angkanya 7 adalah ...", "C", [
    ("1/6", True, "Benar. Ada 6 pasangan berjumlah 7 dari 36: (1, 6), (2, 5), (3, 4), (4, 3), (5, 2), (6, 1). 6/36 = 1/6.", "", "=tiga_puluh_enam"),
    ("1/12", False, "Hanya (1, 6), (2, 5), (3, 4) yang dihitung. (6, 1), (5, 2), (4, 3) adalah hasil yang berbeda.", "SMA10-M-B7-02", "=tiga_puluh_enam"),
    ("7/36", False, "Jumlah 7 dipakai sebagai banyaknya hasil. Banyaknya pasangan berjumlah 7 adalah 6.", "SMA10-M-B7-04", "=tiga_puluh_enam"),
    ("1/11", False, "Jumlah 2 sampai 12 tidak sama kemungkinannya, jadi peluangnya tidak dapat dihitung dari 11 jumlah itu.", "SMA10-M-B7-03", "=distribusi"),
], guna="Pemetaan awal")
cek(not any(sama(h) and jml(h) == 7 for h in DUA_DADU) and (4, 4) in DUA_DADU and all(jml(h) % 2 == 0 for h in DUA_DADU if sama(h)))
soal("PA3", 4, "Dua dadu dilempar. Pasangan kejadian manakah yang saling lepas?", "B", [
    ("jumlah 7 dan dua angka sama", True, "Benar. Dua angka yang sama selalu berjumlah genap, jadi tidak mungkin berjumlah 7.", "", "saling_lepas"),
    ("jumlah 8 dan dua angka sama", False, "(4, 4) memenuhi keduanya, jadi tidak saling lepas.", "SMA10-M-B7-07", "saling_lepas"),
    ("jumlah 12 dan muncul angka 6", False, "(6, 6) memenuhi keduanya, jadi tidak saling lepas.", "SMA10-M-B7-07", "saling_lepas"),
    ("jumlah genap dan dua angka sama", False, "Setiap hasil dengan dua angka sama berjumlah genap, jadi keduanya dapat terjadi bersamaan.", "SMA10-M-B7-07", "saling_lepas"),
], guna="Pemetaan awal")
cek(P(lambda h: h == ("G", "G"), KOIN2) == F(1, 4) and P(lambda h: "G" in h, KOIN2) == F(3, 4))
soal("PA4", 6, "Dua uang logam dilempar. Peluang keduanya muncul gambar adalah ...", "D", [
    ("1/4", True, "Benar. Kedua lemparan saling bebas: 1/2 × 1/2 = 1/4. Dari GG, GA, AG, AA hanya GG yang memenuhi.", "", "=perkalian"),
    ("1/2", False, "Itu peluang untuk satu uang logam saja.", "SMA10-M-B7-09", "=perkalian"),
    ("1/3", False, "GG, satu G, dan AA dianggap tiga hasil yang sama kemungkinannya. Satu G dapat terjadi dengan dua cara, GA dan AG.", "SMA10-M-B7-03", "=ruang_sampel"),
    ("3/4", False, "Itu peluang setidaknya satu gambar.", "SMA10-M-B7-04", "=ruang_sampel"),
], guna="Pemetaan awal")

# ── Cek penguasaan (post-test): every lesson; fresh numbers, no Latihan or Uji Kompetensi item
# and no worked example of the book with its numbers barely changed.
TAS = ["merah"] * 3 + ["biru"] * 5 + ["hijau"] * 2
cek(P(lambda b: b != "biru", TAS) == F(1, 2) and P(lambda b: b == "merah", TAS) == F(3, 10) and P(lambda b: b == "hijau", TAS) == F(1, 5) and F(5, 5) == 1)
soal("PB1", 1, "Sebuah kantong berisi 3 bola merah, 5 bola biru, dan 2 bola hijau. Satu bola diambil secara acak. Peluang yang terambil bukan bola biru adalah ...", "C", [
    ("1/2", True, "Benar. Ada 3 + 2 = 5 bola yang bukan biru dari 10 bola: 5/10 = 1/2.", "", "=peluang_rumus"),
    ("3/10", False, "Hanya bola merah yang dihitung. Bola hijau juga bukan biru.", "SMA10-M-B7-04", "=peluang_rumus"),
    ("1/5", False, "Hanya bola hijau yang dihitung. Bola merah juga bukan biru.", "SMA10-M-B7-04", "=peluang_rumus"),
    ("1", False, "Banyak bola bukan biru dibagi banyak bola biru (5 : 5). Pembaginya banyak seluruh bola, 10.", "SMA10-M-B7-01", "=peluang_rumus"),
], guna="Cek penguasaan", sulit="Sedang")
cek(P(lambda h: jml(h) >= 10, DUA_DADU) == F(1, 6) and F(3 + 2, 36) == F(5, 36) and DIST[10] == F(1, 12))
soal("PB2", 2, "Dua dadu dilempar. Peluang jumlah kedua angkanya setidaknya 10 adalah ...", "A", [
    ("1/6", True, "Benar. Jumlah 10, 11, dan 12 dapat terjadi dengan 3 + 2 + 1 = 6 cara: 6/36 = 1/6.", "", "=distribusi"),
    ("5/36", False, "Jumlah 12, yaitu (6, 6), terlewat: yang dihitung hanya 3 + 2 cara.", "SMA10-M-B7-04", "=distribusi"),
    ("1/12", False, "Itu peluang jumlah 10 saja (3/36). «Setidaknya 10» juga mencakup 11 dan 12.", "SMA10-M-B7-04", "=distribusi"),
    ("3/11", False, "Tiga jumlah dari 11 jumlah yang mungkin dianggap sama kemungkinannya, padahal tidak.", "SMA10-M-B7-03", "=distribusi"),
], guna="Cek penguasaan", sulit="Sedang")
cek(F(1, 6) * 240 == 40 and 240 - 40 == 200 and F(2, 6) * 240 == 80)
soal("PB3", 3, "Sebuah dadu yang adil dilempar 240 kali. Frekuensi harapan muncul angka 6 adalah ...", "D", [
    ("40", True, "Benar. Frekuensi harapan = peluang × banyak percobaan = 1/6 × 240 = 40 kali.", "", "=frek_harapan"),
    ("200", False, "Itu frekuensi harapan muncul angka selain 6 (240 − 40).", "SMA10-M-B7-06", "=frek_harapan"),
    ("6", False, "Itu angka mata dadunya, bukan berapa kali ia diharapkan muncul.", "SMA10-M-B7-06", "=frek_harapan"),
    ("80", False, "Dipakai peluang 2/6, misalnya angka 5 atau 6. Peluang angka 6 adalah 1/6.", "SMA10-M-B7-06", "=frek_harapan"),
], guna="Cek penguasaan", sulit="Sedang")
cek(F(28, 50) == F(56, 100) and F(22, 50) == F(44, 100))
soal("PB4", 3, "Sebuah uang logam dilempar 50 kali dan gambar muncul 28 kali. Frekuensi relatif muncul gambar adalah ...", "B", [
    ("0,56", True, "Benar. Frekuensi relatif = 28 : 50 = 0,56.", "", "=frek_relatif"),
    ("0,5", False, "Itu peluang teoretisnya. Frekuensi relatif dihitung dari hasil percobaan.", "SMA10-M-B7-05", "=frek_relatif"),
    ("28", False, "Itu banyaknya gambar muncul. Masih dibagi banyak percobaan.", "SMA10-M-B7-12", "=frek_relatif"),
    ("0,44", False, "Itu frekuensi relatif angka (22 : 50), bukan gambar.", "SMA10-M-B7-05", "=frek_relatif"),
], guna="Cek penguasaan", sulit="Sedang")
cek(DIST[3] + DIST[11] == F(1, 9) and DIST[3] == F(1, 18) and DIST[3] * DIST[11] == F(1, 324))
soal("PB5", 4, "Dua dadu dilempar. Peluang jumlah kedua angkanya 3 atau 11 adalah ...", "B", [
    ("1/9", True, "Benar. Kedua kejadian saling lepas: 2/36 + 2/36 = 4/36 = 1/9.", "", "=penjumlahan_lepas"),
    ("1/18", False, "Itu peluang salah satu jumlah saja (2/36). «Atau» menjumlahkan kedua peluang.", "SMA10-M-B7-09", "=penjumlahan_lepas"),
    ("1/324", False, "Kedua peluang dikalikan. Untuk «atau» pada kejadian saling lepas, peluangnya dijumlahkan.", "SMA10-M-B7-09", "=penjumlahan_lepas"),
    ("2/11", False, "Dua jumlah dari 11 jumlah dianggap sama kemungkinannya, padahal tidak.", "SMA10-M-B7-03", "=distribusi"),
], guna="Cek penguasaan", sulit="Sedang")
cek(F(5, 10) + F(4, 10) - F(2, 10) == F(7, 10) and F(5, 10) + F(4, 10) + F(2, 10) == F(11, 10))
soal("PB6", 5, "Diketahui P(A) = 0,5, P(B) = 0,4, dan P(A ∩ B) = 0,2. Nilai P(A ∪ B) adalah ...", "D", [
    ("0,7", True, "Benar. P(A ∪ B) = 0,5 + 0,4 − 0,2 = 0,7.", "", "=penjumlahan"),
    ("0,9", False, "P(A ∩ B) belum dikurangkan, padahal A dan B tidak saling lepas.", "SMA10-M-B7-08", "=penjumlahan"),
    ("0,2", False, "Itu P(A ∩ B), peluang A dan B terjadi bersamaan.", "SMA10-M-B7-10", "=penjumlahan"),
    ("1,1", False, "P(A ∩ B) ditambahkan, bukan dikurangkan. Peluang juga tidak mungkin lebih dari 1.", "SMA10-M-B7-10", "=penjumlahan"),
], guna="Cek penguasaan", sulit="Sedang")
cek(P(lambda h: sama(h) or jml(h) == 10, DUA_DADU) == F(2, 9) == F(6 + 3 - 1, 36) and F(6 + 3, 36) == F(1, 4) and F(6 + 3 - 2, 36) == F(7, 36))
soal("PB7", 5, "Dua dadu dilempar. Peluang kedua angkanya sama atau jumlahnya 10 adalah ...", "A", [
    ("2/9", True, "Benar. 6/36 + 3/36 − 1/36 = 8/36 = 2/9. Irisannya (5, 5).", "", "=penjumlahan"),
    ("1/4", False, "Irisan (5, 5) tidak dikurangkan: 6/36 + 3/36 = 9/36.", "SMA10-M-B7-08", "=penjumlahan"),
    ("1/36", False, "Itu peluang keduanya terjadi, yaitu (5, 5) saja.", "SMA10-M-B7-10", "=penjumlahan"),
    ("7/36", False, "Irisan dikurangkan dua kali: (6 + 3 − 2)/36. Irisan dikurangkan satu kali.", "SMA10-M-B7-10", "=penjumlahan"),
], guna="Cek penguasaan", sulit="Sulit")
cek(F(1, 6) * F(1, 2) == F(1, 12) and F(1, 6) + F(1, 2) == F(2, 3) and F(1, 6) + F(1, 2) - F(1, 12) == F(7, 12))
soal("PB8", 6, "Sebuah dadu dan sebuah uang logam dilempar bersamaan. Peluang muncul angka 6 pada dadu dan gambar pada uang logam adalah ...", "C", [
    ("1/12", True, "Benar. Kedua kejadian saling bebas: 1/6 × 1/2 = 1/12.", "", "=perkalian"),
    ("2/3", False, "Kedua peluang dijumlahkan. Untuk «dan» pada kejadian saling bebas, peluangnya dikalikan.", "SMA10-M-B7-09", "=perkalian"),
    ("1/6", False, "Itu peluang angka 6 saja; syarat gambar belum diperhitungkan.", "SMA10-M-B7-09", "=perkalian"),
    ("7/12", False, "Itu peluang angka 6 atau gambar (1/6 + 1/2 − 1/12). Yang ditanya keduanya terjadi.", "SMA10-M-B7-09", "=perkalian"),
], guna="Cek penguasaan", sulit="Sedang")

# ── Latihan (practice), by lesson.
soal("LT1", 1, "Manakah yang tidak mungkin menjadi nilai sebuah peluang?", "D", [
    ("1,2", True, "Benar. Peluang selalu dari 0 sampai 1, jadi 1,2 tidak mungkin.", "", "nol_satu"),
    ("0", False, "Peluang 0 berarti kejadian tidak mungkin terjadi; nilai ini mungkin.", "SMA10-M-B7-01", "nol_satu"),
    ("1", False, "Peluang 1 berarti kejadian pasti terjadi; nilai ini mungkin.", "SMA10-M-B7-01", "nol_satu"),
    ("0,5", False, "0,5 berada di antara 0 dan 1; nilai ini mungkin.", "SMA10-M-B7-01", "nol_satu"),
])
cek(len(DUA_DADU) == 36 and 6 + 6 == 12 and len({tuple(sorted(h)) for h in DUA_DADU}) == 21)
soal("LT2", 1, "Sebuah dadu merah dan sebuah dadu putih dilempar bersamaan. Banyaknya titik sampel adalah ...", "B", [
    ("36", True, "Benar. Setiap angka dadu merah dapat berpasangan dengan setiap angka dadu putih: 6 × 6 = 36.", "", "=tiga_puluh_enam"),
    ("12", False, "Banyaknya sisi dijumlahkan (6 + 6). Pasangannya dihitung dengan 6 × 6.", "SMA10-M-B7-02", "=tiga_puluh_enam"),
    ("21", False, "Pasangan seperti (2, 3) dan (3, 2) dianggap sama. Dadunya berbeda warna, jadi keduanya hasil yang berbeda.", "SMA10-M-B7-02", "=tiga_puluh_enam"),
    ("6", False, "Itu banyaknya hasil satu dadu saja.", "SMA10-M-B7-02", "=ruang_sampel"),
])
soal("LT3", 1, "Pada pelemparan dadu merah dan dadu putih, hasil (3, 2) dan (2, 3) adalah ...", "A", [
    ("dua hasil yang berbeda", True, "Benar. (3, 2) berarti merah 3 dan putih 2, sedangkan (2, 3) berarti merah 2 dan putih 3.", "", "titik_sampel"),
    ("hasil yang sama", False, "Angkanya sama, tetapi dadu yang menunjukkannya berbeda.", "SMA10-M-B7-02", "titik_sampel"),
    ("hanya satu yang boleh dihitung", False, "Keduanya titik sampel dan keduanya dihitung dalam 36 hasil.", "SMA10-M-B7-02", "tiga_puluh_enam"),
    ("tidak termasuk ruang sampel", False, "Keduanya termasuk ruang sampel, yang memuat semua 36 pasangan.", "SMA10-M-B7-02", "ruang_sampel"),
])
cek(P(lambda x: x in (2, 3, 5), DADU) == F(1, 2) and F(4, 6) == F(2, 3) and F(2, 6) == F(1, 3))
soal("LT4", 1, "Sebuah dadu dilempar. Peluang muncul bilangan prima adalah ...", "C", [
    ("1/2", True, "Benar. Bilangan prima pada dadu adalah 2, 3, dan 5: 3/6 = 1/2.", "", "=peluang_rumus"),
    ("2/3", False, "1 ikut dihitung (4/6). 1 bukan bilangan prima.", "SMA10-M-B7-04", "=peluang_rumus"),
    ("1/3", False, "2 terlewat (hanya 3 dan 5). 2 adalah bilangan prima.", "SMA10-M-B7-04", "=peluang_rumus"),
    ("1/6", False, "Hanya satu bilangan prima yang dihitung.", "SMA10-M-B7-04", "=peluang_rumus"),
])
cek(DIST[2] + DIST[3] == F(1, 12) and DIST[2] == F(1, 36) and DIST[3] == F(1, 18))
soal("LT5", 2, "Dua dadu dilempar. Peluang jumlah kedua angkanya 2 atau 3 adalah ...", "B", [
    ("1/12", True, "Benar. Jumlah 2: (1, 1); jumlah 3: (1, 2) dan (2, 1). Jadi 3/36 = 1/12.", "", "=distribusi"),
    ("1/36", False, "Itu peluang jumlah 2 saja.", "SMA10-M-B7-04", "=distribusi"),
    ("2/11", False, "Dua jumlah dari 11 jumlah dianggap sama kemungkinannya, padahal tidak.", "SMA10-M-B7-03", "=distribusi"),
    ("1/18", False, "Itu peluang jumlah 3 saja.", "SMA10-M-B7-04", "=distribusi"),
])
soal("LT6", 2, "Jumlah semua peluang dalam sebuah distribusi peluang adalah ...", "D", [
    ("1", True, "Benar. Distribusi peluang memuat semua hasil yang mungkin, jadi jumlah peluangnya 1.", "", "distribusi"),
    ("36", False, "Itu banyaknya hasil dua dadu, bukan jumlah peluangnya.", "SMA10-M-B7-12", "distribusi"),
    ("0", False, "Setiap peluang tidak negatif dan sedikitnya satu hasil pasti terjadi, jadi jumlahnya 1.", "SMA10-M-B7-01", "distribusi"),
    ("11", False, "Itu banyaknya jumlah yang mungkin pada dua dadu, bukan jumlah peluangnya.", "SMA10-M-B7-12", "distribusi"),
])
cek(P(lambda h: h.count("G") == 1, KOIN2) == F(1, 2))
soal("LT7", 2, "Dua uang logam dilempar. Peluang muncul tepat satu gambar adalah ...", "C", [
    ("1/2", True, "Benar. Tepat satu gambar: GA atau AG, 2 dari 4 hasil.", "", "=ruang_sampel"),
    ("1/3", False, "GG, satu G, dan AA dianggap sama kemungkinannya. Satu G dapat terjadi dengan dua cara.", "SMA10-M-B7-03", "=ruang_sampel"),
    ("1/4", False, "Hanya GA yang dihitung; AG juga memuat tepat satu gambar.", "SMA10-M-B7-02", "=ruang_sampel"),
    ("3/4", False, "Itu peluang setidaknya satu gambar; GG memuat dua gambar.", "SMA10-M-B7-04", "=ruang_sampel"),
])
soal("LT8", 2, "Pada pelemparan dua dadu, jumlah yang paling mungkin muncul adalah ...", "A", [
    ("7", True, "Benar. Jumlah 7 dapat terjadi dengan 6 cara, lebih banyak daripada jumlah lainnya.", "", "=distribusi"),
    ("12", False, "Jumlah 12 hanya dapat terjadi dengan 1 cara, (6, 6).", "SMA10-M-B7-03", "=distribusi"),
    ("2", False, "Jumlah 2 hanya dapat terjadi dengan 1 cara, (1, 1).", "SMA10-M-B7-03", "=distribusi"),
    ("6 dan 8", False, "Masing-masing dapat terjadi dengan 5 cara, satu cara lebih sedikit daripada jumlah 7.", "SMA10-M-B7-03", "=distribusi"),
])
cek(F(3, 10) * 50 == 15 and 50 - 15 == 35 and F(3, 10) * 10 == 3)
soal("LT9", 3, "Peluang sebuah kejadian adalah 0,3. Jika percobaannya dilakukan 50 kali, frekuensi harapannya adalah ...", "A", [
    ("15", True, "Benar. 0,3 × 50 = 15 kali.", "", "=frek_harapan"),
    ("0,3", False, "Itu peluangnya. Masih dikalikan dengan banyak percobaan.", "SMA10-M-B7-06", "=frek_harapan"),
    ("35", False, "Itu frekuensi harapan kejadian itu tidak terjadi (50 − 15).", "SMA10-M-B7-06", "=frek_harapan"),
    ("3", False, "0,3 dikalikan 10, bukan 50.", "SMA10-M-B7-06", "=frek_harapan"),
])
soal("LT10", 3, "Makin banyak percobaan yang dilakukan, frekuensi relatif suatu kejadian ...", "C", [
    ("makin mendekati peluang teoretis", True, "Benar. Dengan makin banyak percobaan, frekuensi relatif makin mendekati peluang teoretis.", "", "mendekati"),
    ("makin menjauhi peluang teoretis", False, "Kebalikannya: percobaan yang lebih banyak membuat hasilnya makin mendekati peluang teoretis.", "SMA10-M-B7-05", "mendekati"),
    ("selalu sama dengan peluang teoretis", False, "Frekuensi relatif dapat berbeda dari peluang teoretis, misalnya 8/20 untuk angka genap.", "SMA10-M-B7-05", "delapan_20"),
    ("makin besar", False, "Frekuensi relatif tidak selalu naik; ia makin mendekati peluang teoretis.", "SMA10-M-B7-05", "mendekati"),
])
cek(F(12, 60) == F(1, 5) and F(48, 60) == F(4, 5))
soal("LT11", 3, "Sebuah dadu dilempar 60 kali dan angka 3 muncul 12 kali. Frekuensi relatif muncul angka 3 adalah ...", "D", [
    ("1/5", True, "Benar. 12 : 60 = 1/5.", "", "=frek_relatif"),
    ("1/6", False, "Itu peluang teoretisnya. Frekuensi relatif dihitung dari hasil percobaan.", "SMA10-M-B7-05", "=frek_relatif"),
    ("12", False, "Itu banyaknya angka 3 muncul. Masih dibagi 60.", "SMA10-M-B7-12", "=frek_relatif"),
    ("4/5", False, "Itu frekuensi relatif muncul angka selain 3 (48 : 60).", "SMA10-M-B7-05", "=frek_relatif"),
])
soal("LT12", 3, "Frekuensi harapan angka genap pada 200 lemparan dadu adalah 100. Artinya, angka genap akan muncul ...", "B", [
    ("sekitar 100 kali, tetapi tidak dijamin tepat 100", True, "Benar. Frekuensi harapan adalah perkiraan; hasil sebenarnya mungkin berbeda.", "", "tidak_dijamin"),
    ("tepat 100 kali, karena 1/2 × 200 = 100 pasti terjadi", False, "1/2 × 200 = 100 adalah harapan; hasil sebenarnya dapat berbeda.", "SMA10-M-B7-06", "tidak_dijamin"),
    ("100 kali atau lebih", False, "Hasil sebenarnya dapat juga kurang dari 100.", "SMA10-M-B7-06", "tidak_dijamin"),
    ("kurang dari 100 kali", False, "Hasil sebenarnya dapat juga 100 atau lebih.", "SMA10-M-B7-06", "tidak_dijamin"),
])
soal("LT13", 4, "Dua kejadian disebut saling lepas jika keduanya ...", "C", [
    ("tidak mungkin terjadi pada hasil yang sama", True, "Benar. Saling lepas berarti tidak ada hasil yang memenuhi keduanya.", "", "saling_lepas"),
    ("selalu terjadi bersamaan", False, "Kebalikannya: kejadian saling lepas tidak dapat terjadi bersamaan.", "SMA10-M-B7-07", "saling_lepas"),
    ("peluangnya sama besar", False, "Besar peluang tidak menentukan saling lepas atau tidaknya.", "SMA10-M-B7-07", "saling_lepas"),
    ("yang satu tidak memengaruhi peluang yang lain", False, "Itu pengertian kejadian saling bebas, bukan saling lepas.", "SMA10-M-B7-11", "saling_bebas"),
])
cek(not {1} & {2, 4, 6} and {2, 4, 6} & {4, 5, 6} == {4, 6} and {2, 3, 5} & {1, 3, 5} == {3, 5} and {1, 2} & {2, 4, 6} == {2})
soal("LT14", 4, "Sebuah dadu dilempar. Pasangan kejadian manakah yang saling lepas?", "A", [
    ("angka 1 dan angka genap", True, "Benar. 1 bukan bilangan genap, jadi keduanya tidak dapat terjadi bersamaan.", "", "saling_lepas"),
    ("angka genap dan angka lebih dari 3", False, "4 dan 6 memenuhi keduanya.", "SMA10-M-B7-07", "saling_lepas"),
    ("angka prima dan angka ganjil", False, "3 dan 5 memenuhi keduanya.", "SMA10-M-B7-07", "saling_lepas"),
    ("angka kurang dari 3 dan angka genap", False, "2 memenuhi keduanya.", "SMA10-M-B7-07", "saling_lepas"),
])
cek(F(1, 6) + F(1, 6) == F(1, 3) and F(1, 6) * F(1, 6) == F(1, 36) and F(2, 24) == F(1, 12))
soal("LT15", 4, "Sebuah dadu dilempar. Peluang muncul angka 1 atau angka 6 adalah ...", "B", [
    ("1/3", True, "Benar. Kedua kejadian saling lepas: 1/6 + 1/6 = 2/6 = 1/3.", "", "=penjumlahan_lepas"),
    ("1/36", False, "Kedua peluang dikalikan. Untuk «atau» pada kejadian saling lepas, peluangnya dijumlahkan.", "SMA10-M-B7-09", "=penjumlahan_lepas"),
    ("1/6", False, "Itu peluang satu angka saja.", "SMA10-M-B7-09", "=penjumlahan_lepas"),
    ("1/12", False, "Dua hasil dibagi 24, seolah ada 24 hasil. Ruang sampelnya hanya 6.", "SMA10-M-B7-02", "=ruang_sampel"),
])
soal("LT16", 5, "Aturan penjumlahan untuk dua kejadian A dan B yang tidak saling lepas adalah ...", "D", [
    ("P(A ∪ B) = P(A) + P(B) − P(A ∩ B)", True, "Benar. Irisannya dikurangkan satu kali karena terhitung dua kali.", "", "penjumlahan"),
    ("P(A ∪ B) = P(A) + P(B)", False, "Itu hanya berlaku jika A dan B saling lepas.", "SMA10-M-B7-08", "penjumlahan_lepas"),
    ("P(A ∪ B) = P(A) × P(B)", False, "Perkalian dipakai untuk «dan» pada kejadian saling bebas, bukan untuk «atau».", "SMA10-M-B7-09", "perkalian"),
    ("P(A ∪ B) = P(A) + P(B) + P(A ∩ B)", False, "Irisannya dikurangkan, bukan ditambahkan.", "SMA10-M-B7-10", "penjumlahan"),
])
cek(P(lambda x: x % 2 == 0 or x > 3, DADU) == F(2, 3) and F(3 + 3, 6) == 1 and F(2, 6) == F(1, 3))
soal("LT17", 5, "Sebuah dadu dilempar. Peluang muncul angka genap atau angka lebih dari 3 adalah ...", "D", [
    ("2/3", True, "Benar. 3/6 + 3/6 − 2/6 = 4/6 = 2/3; hasilnya {2, 4, 5, 6}.", "", "=penjumlahan"),
    ("1", False, "Irisan {4, 6} tidak dikurangkan: 3/6 + 3/6 = 1.", "SMA10-M-B7-08", "=penjumlahan"),
    ("1/3", False, "Itu peluang irisannya, {4, 6}.", "SMA10-M-B7-10", "=penjumlahan"),
    ("1/2", False, "Itu peluang angka genap saja.", "SMA10-M-B7-04", "=penjumlahan"),
])
soal("LT18", 5, "Mengapa P(A ∩ B) dikurangkan dalam aturan penjumlahan untuk kejadian yang tidak saling lepas?", "B", [
    ("karena hasil di irisan terhitung dua kali", True, "Benar. Hasil di irisan termasuk A dan juga B, jadi terhitung pada P(A) dan pada P(B).", "", "penjumlahan"),
    ("karena jumlah P(A) dan P(B) harus lebih kecil dari 1", False, "Jumlah P(A) dan P(B) boleh lebih dari 1; yang dikurangkan adalah bagian yang terhitung dua kali.", "SMA10-M-B7-10", "penjumlahan"),
    ("karena A dan B saling bebas", False, "Aturan penjumlahan tidak memerlukan kejadian saling bebas.", "SMA10-M-B7-11", "penjumlahan"),
    ("karena irisan selalu kosong", False, "Jika irisannya kosong, kejadiannya saling lepas dan tidak ada yang dikurangkan.", "SMA10-M-B7-07", "saling_lepas"),
])
KOIN3 = [(a, b, c) for a in "GA" for b in "GA" for c in "GA"]
cek(P(lambda h: h == ("G", "G", "G"), KOIN3) == F(1, 8) == F(1, 2) ** 3 and P(lambda h: h.count("G") == 2, KOIN3) == F(3, 8) and F(1, 2 + 2 + 2) == F(1, 6))
soal("LT19", 6, "Sebuah uang logam dilempar tiga kali. Peluang ketiganya muncul gambar adalah ...", "A", [
    ("1/8", True, "Benar. Lemparan saling bebas: 1/2 × 1/2 × 1/2 = 1/8.", "", "=perkalian"),
    ("1/6", False, "Banyaknya hasil dijumlahkan (2 + 2 + 2). Ruang sampelnya 2 × 2 × 2 = 8.", "SMA10-M-B7-02", "=perkalian"),
    ("3/8", False, "Itu peluang tepat dua gambar.", "SMA10-M-B7-04", "=perkalian"),
    ("1/2", False, "Itu peluang satu lemparan saja. Ketiga lemparan harus gambar.", "SMA10-M-B7-09", "=perkalian"),
])
soal("LT20", 6, "Dua bola diambil satu per satu dari sebuah tas tanpa mengembalikan bola pertama. Kejadian pada pengambilan pertama dan kedua ...", "C", [
    ("tidak saling bebas, karena isi tas berubah", True, "Benar. Setelah bola pertama diambil, banyak dan warna bola di tas berubah, jadi peluang pengambilan kedua ikut berubah.", "", "tidak_bebas"),
    ("saling bebas, karena bolanya sama", False, "Tanpa pengembalian, peluang pengambilan kedua bergantung pada hasil pertama.", "SMA10-M-B7-11", "tidak_bebas"),
    ("saling lepas, karena bola berbeda", False, "Saling lepas membicarakan dua kejadian pada satu hasil; yang ditanya apakah pengambilan pertama memengaruhi yang kedua.", "SMA10-M-B7-07", "saling_lepas"),
    ("saling bebas, karena diambil satu per satu", False, "Diambil satu per satu tidak cukup; tanpa pengembalian, isi tas berubah.", "SMA10-M-B7-11", "tidak_bebas"),
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

# The post-test never reuses a Latihan or Uji Kompetensi item or a worked example of the book with
# its numbers barely changed. The book's items and each post-test question's own numbers:
BUKU = {
    "Contoh pp. 244-245": "jumlah 11; angka 2 atau jumlah 2; sama dan jumlah 8; sama atau jumlah 8; jumlah ≤ 9; jumlah ≥ 9",
    "Latihan 7.1-7.2": "jumlah 2 atau 3; > 3; ≥ 3; < 3; angka lebih besar; nilai mutlak selisih; dua koin",
    "Frekuensi": "genap 8 dari 20; 66 dan 200 lemparan", "Latihan 7.3": "Ali 14 dari 100; lampu 300; film 80 dan 480; kidal 0,23",
    "Latihan 7.4": "sama atau jumlah 5; sama atau jumlah 2; selisih 2 atau jumlah 5; selisih 2 atau jumlah 11",
    "Eksplorasi 7.3": "tidak dobel lalu dobel 5/36", "Latihan 7.5": "Kirana dobel lalu jumlah 6; Sani 0,1 dan Oka 0,2; dadu dua kali; 12 bola, 5 merah",
    "Latihan 7.6": "koin tiga kali; dadu tetrahedron; koin tujuh dan empat kali; dadu khusus; tiga kejadian",
    "Uji Kompetensi": "satu dadu 4; dadu oktahedral jumlah 7 dan 8",
}
POST_ANGKA = {"PB1": "3 bola merah, 5 bola biru, 2 bola hijau", "PB2": "setidaknya 10", "PB3": "240 kali", "PB4": "50 kali, 28 kali",
              "PB5": "3 atau 11", "PB6": "P(A) = 0,5, P(B) = 0,4", "PB7": "jumlahnya 10", "PB8": "angka 6 pada dadu dan gambar"}
cek(set(POST_ANGKA) == {s["ref"] for s in POST} and not set(POST_ANGKA.values()) & set(BUKU.values()))
for s in POST:
    cek(all(w in s["tanya"] for w in POST_ANGKA[s["ref"]].split(", ")), s["ref"])
cek(not any(w in s["tanya"] for s in POST for w in ("jumlah 11", "jumlah 8", "jumlah 5", "20 kali", "66", "14 kali", "0,23",
                                                   "Sani", "Oka", "12 bola", "oktahedral", "tetrahedron", "tidak dobel")))


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
    tulis(os.path.join(here, "SMA10-Matematika-Bab7.xlsx"))
    tulis_miskonsepsi(os.path.join(here, "SMA10-Matematika-Bab7-miskonsepsi.csv"))
    halaman = sum(p["isi"].count("## ") for p in PELAJARAN)
    print(f"SMA10-Matematika-Bab7.xlsx: lessons {len(PELAJARAN)} ({halaman} pages), questions {len(S)} "
          f"(pre {len(PRE)}, post {len(POST)}, practice {len(LAT)}), answers "
          + " ".join(f"{h}={HURUF[h]}" for h in "ABCD"))
    print(f"SMA10-Matematika-Bab7-miskonsepsi.csv: {len(MISKONSEPSI)} codes")
    print(f"facts traced: {len(FAKTA)} (pages {min(h for h, _ in FAKTA.values())}-{max(h for h, _ in FAKTA.values())})")
    if "--kutipan" in sys.argv:
        ada, gambar = periksa_kutipan(sys.argv[sys.argv.index("--kutipan") + 1])
        print(f"quotations found in the book's text: {ada} of {len(FAKTA)}; figures read by eye: {', '.join(gambar) or 'none'}")
    print(f"assertions passed: {CEK[0]}")
