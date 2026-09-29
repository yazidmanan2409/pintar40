# SMA Kelas X, Matematika, Bab 4 "Sistem Persamaan dan Pertidaksamaan Linear", as a PINTAR lesson workbook in the D-007
# template (sheets Kursus, Bab, Pelajaran, Soal, Pilihan; the column contract is KOLOM in
# src/lib/unggah-kontrak.ts). Built with the method of Bab 1 (LANA-18).
#
# Source: the student book "Matematika untuk SMA/MA/SMK/MAK Kelas X (Edisi Revisi)" (Dicky Susanto
# dkk.; Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi, 2023; ISBN 978-623-118-558-7),
# Bab 4, pp. 107-128. It has no numbered Contoh (its worked examples are the stationery packs, the balls,
# Tabel 4.1, Pak Eko's fruit and Kiki's budget); its Latihan and Uji Kompetensi have no keys, so
# every key here is ours, and every key is computed.
#
#   - Every number in a lesson, key or distractor is computed here and asserted: every system is
#     solved exactly (Gauss-Jordan over fractions) and every solution substituted back; every
#     inequality claim is evaluated at its point.
#   - Every definition and property is in FAKTA with its page and the book's words; `--kutipan`
#     checks the prose against the book's text. Formulas were read from the page images (the text
#     layer breaks the systems into single symbols), so systems are proven by computation.
#   - Statements that are false or doubtful outside the book are kept out, and DILUAR asserts it.
#   - Notation: × and :, decimal comma, thousands point; «−» as minus; ≤ ≥ < >; points as (2, 3);
#     graphs become value lines and statements about lines.
#     No LaTeX, HTML or tables; the book's tables become value lines.
#
# Run: python3 docs/onboarding/konten/sma10_matematika_bab4.py [--kutipan book.txt]
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




# Pembuka dan A. Sistem persamaan linear (pp. 109-116)
fakta("spl_def", 109, "Sistem persamaan linear adalah gabungan beberapa persamaan linear. Penyelesaiannya adalah nilai yang memenuhi semua persamaan linear.")
fakta("sptl_def", 109, "Mirip dengan itu, sistem pertidaksamaan linear terdiri atas beberapa pertidaksamaan linear dan penyelesaiannya membuat semua pertidaksamaan linear bernilai benar.")
fakta("paket", 110, "Paket A seharga Rp18.000,00 berisi lima buku tulis dan dua pensil. Paket B berisi sebuah buku tulis dan dua pensil dihargai Rp10.000,00.")
fakta("bola", 110, "Pada penimbangan pertama, Kinan menimbang dua bola basket, sebuah bola kaki, dan tiga bola voli dan hasilnya 2.500 g. Penimbangan kedua, sebuah bola basket, dua buah bola kaki, dan dua buah bola voli beratnya 2.050 g. Penimbangan ketiga, dua buah bola basket dan sebuah bola voli beratnya 1.550 g.")
fakta("solusi", 113, "Solusi/penyelesaian adalah nilai yang memenuhi semua persamaan.")
fakta("eliminasi", 113, "Kamu telah mengenal metode eliminasi dan substitusi untuk menyelesaikan sistem persamaan linear dengan dua variabel.")
fakta("tiga_kemungkinan", 114, "Sistem persamaan linear memiliki satu solusi. Grafiknya berupa dua garis yang berpotongan. Solusinya adalah titik potong kedua garis. • Sistem persamaan linear tidak memiliki solusi. Grafiknya berupa dua garis yang sejajar. • Sistem persamaan linear memiliki banyak solusi. Grafiknya berupa dua garis yang berimpit. Semua titik pada garis ini merupakan solusi.")
fakta("tiga_dimensi", 115, "Untuk menggambarkan persamaan linear dengan tiga variabel dibutuhkan grafik tiga dimensi.")
fakta("tidak_pernah", 115, "pernyataan 0 = −3 tidak pernah benar, atau tidak memiliki solusi.")
fakta("selalu_benar", 115, "selalu benar, berapa pun nilai variabel-variabelnya, atau memiliki banyak solusi.")
fakta("satu_pasangan", 116, "Hanya ada satu pasangan nilai yang menyebabkan persamaan linear bernilai benar.")
fakta("prinsip", 116, "Prinsip yang sama dapat diterapkan pada sistem persamaan linear dengan tiga (atau lebih) variabel. Lakukan eliminasi dan perhatikan apa yang kamu dapatkan.")
# B. Sistem pertidaksamaan linear (pp. 119-123)
fakta("eko", 119, "Dua buah apel dan lima buah jeruk beratnya kurang dari 1 kg. Enam buah apel dan dua buah jeruk beratnya lebih dari 1 kg.")
fakta("ons", 120, "Model matematikanya (dalam satuan ons, 1 kg = 10 ons):")
fakta("kiki", 121, "Dari kas RT ada uang sebesar Rp500.000,00 yang dapat digunakan. Untuk penyelenggaraan perlombaan, dibutuhkan Rp20.000,00 per anak. Hadiah untuk pemenang dianggarkan Rp40.000,00 untuk setiap jenis perlombaan. Diharapkan ada lebih dari 13 anak yang berpartisipasi.")
fakta("berpadanan", 122, "Gambarkan grafik sistem persamaan linear yang berpadanan, yaitu sistem persamaan linear yang didapat dengan mengubah tanda pertidaksamaan menjadi tanda persamaan.")
fakta("garis", 122, "garis yang didapat dari pertidaksamaan lebih atau sama dengan dan kurang atau sama dengan digambarkan dengan garis utuh (artinya garis tersebut termasuk daerah jawaban) sedangkan garis yang didapat dari pertidaksamaan lebih dari atau kurang dari digambarkan dengan garis putus-putus (artinya garis tersebut hanya batas, tidak termasuk daerah jawaban).")
fakta("uji_titik", 122, "Pilih sebuah titik, misalnya (0,0), lalu substitusikan ke dalam pertidaksamaan.")
fakta("irisan", 123, "Solusinya adalah daerah yang merupakan irisan semua daerah jawab.")
# For the book-error record only (not used by any question)
fakta("ketidaksamaan", 115, "Perhatikan bahwa setelah melakukan eliminasi, didapatkan sebuah ketidaksamaan")
fakta("tabel_7", 114, "6x −4y = 7")
fakta("contoh_5", 115, "6x − 4y = 5")
fakta("dobel", 115, "Pada sistem persamaan linear dengan tiga variabel, juga ada tiga kemungkinan banyaknya solusi. Sistem persamaan linear dengan tiga variabel juga memiliki tiga kemungkinan banyaknya solusi.")
fakta("langkah_kosong", 113, "10. 11. 12. Kamu telah mengenal metode eliminasi")
fakta("kiki_ribu", 122, "20x + 40y ≤ 500")
fakta("budi", 126, "Pak Budi ingin mendapatkan bunga setidaknya Rp550.000,00 namun ia tidak ingin mendepositokan uangnya pada satu bank saja.")
REKAMAN = {"ketidaksamaan", "tabel_7", "contoh_5", "dobel", "langkah_kosong", "kiki_ribu", "budi"}
GAMBAR = {"kiki_ribu"}     # the model on p. 122 is typeset as an image; read by eye


def selesaikan(A, b):
    """Gauss-Jordan elimination over the fractions; None when the system has no unique solution."""
    n = len(A)
    M = [[F(v) for v in baris] + [F(k)] for baris, k in zip(A, b)]
    for i in range(n):
        p = next((r for r in range(i, n) if M[r][i] != 0), None)
        if p is None:
            return None
        M[i], M[p] = M[p], M[i]
        for r in range(n):
            if r != i and M[r][i] != 0:
                f = M[r][i] / M[i][i]
                M[r] = [a - f * c for a, c in zip(M[r], M[i])]
    return [M[i][n] / M[i][i] for i in range(n)]


def memenuhi(A, b, x):
    return all(sum(F(a) * v for a, v in zip(baris, x)) == k for baris, k in zip(A, b))


def banyak_solusi_2(a1, b1, c1, a2, b2, c2):
    """For a₁x + b₁y = c₁ and a₂x + b₂y = c₂: 'satu', 'tidak ada' or 'banyak'."""
    if a1 * b2 - a2 * b1 != 0:
        return "satu"
    return "banyak" if a1 * c2 - a2 * c1 == 0 and b1 * c2 - b2 * c1 == 0 else "tidak ada"


# ── What can be computed (every number the lessons use) ──
PAKET = selesaikan([[5, 2], [1, 2]], [18000, 10000])
cek(PAKET == [2000, 4000] and 18000 - 10000 == 8000 and F(8000, 4) == 2000)                  # buku, pensil
BOLA_A, BOLA_B = [[2, 1, 3], [1, 2, 2], [2, 0, 1]], [2500, 2050, 1550]
cek(selesaikan(BOLA_A, BOLA_B) == [650, 450, 250] and memenuhi(BOLA_A, BOLA_B, [650, 450, 250]))
cek(2 * 2500 - 2050 == 2950 and [2 * 2 - 1, 2 * 1 - 2, 2 * 3 - 2] == [3, 0, 4])                # (1) × 2 − (2): 3x + 4z = 2.950
cek(3 * 650 + 4 * 250 == 2950 and 2 * 650 + 250 == 1550 and 4 * 1550 == 6200 and 6200 - 5 * 650 == 2950)
cek(1550 * 4 - 2950 == 3250 and F(3250, 5) == 650 and 1550 - 2 * 650 == 250 and 2500 - 2 * 650 - 3 * 250 == 450)
cek(selesaikan([[2, -1], [1, 2]], [-4, 3]) == [-1, 2] and 2 * (-4) + 3 == -5)                  # Tabel 4.1 no. 1
cek(banyak_solusi_2(3, -2, 1, 6, -4, 7) == "tidak ada" and 7 - 2 * 1 == 5 and [2 * 3, 2 * -2] == [6, -4])                      # 0 = −5
cek(banyak_solusi_2(2, 3, 1, 4, 6, 2) == "banyak" and 2 - 2 * 1 == 0)                           # 0 = 0
cek(selesaikan([[1, 1, 1], [2, 2, 2], [1, -1, 0]], [6, 10, 0]) is None and 10 - 2 * 6 == -2)
# Pak Eko (in ons): the boundary lines meet at (15/13, 20/13).
cek(selesaikan([[2, 5], [6, 2]], [10, 10]) == [F(15, 13), F(20, 13)])
cek(desimal(15 / 13, 2) == "1,15" and desimal(20 / 13, 2) == "1,54")
cek((2 * 0 + 5 * 0 < 10) and not (6 * 0 + 2 * 0 > 10))                                       # the test point (0, 0)
cek(2 * 2 + 5 * 1 == 9 < 10 and 6 * 2 + 2 * 1 == 14 > 10)                                      # apel 2 ons, jeruk 1 ons
cek(not (2 * 1 + 5 * 2 < 10) and not (6 * 1 + 2 * 1 > 10))                                     # (1, 2) fails both
# Kiki (in thousands of rupiah): 20x + 40y ≤ 500 and x > 13, x and y whole, y ≥ 1.
KIKI = {(x, y) for x in range(0, 30) for y in range(1, 15) if 20 * x + 40 * y <= 500 and x > 13}
cek(all(20 * x + 40 * y <= 500 for x, y in KIKI) and max(y for _, y in KIKI) == 5 and min(x for x, _ in KIKI) == 14)
cek(max(x for x, y in KIKI if y == 1) == 23 and sorted(x for x, y in KIKI if y == 5) == [14, 15])
cek(max(x for x, y in KIKI if y == 3) == 19 and 19 + 2 * 3 == 25 and (20, 2) in KIKI and 20 * 20 + 40 * 2 == 480 and (16, 5) not in KIKI and 20 * 16 + 40 * 5 == 520)
# Lesson 6: Rina, in thousands: 8x + 3y ≤ 60, x ≥ 2.
cek(8 * 3 + 3 * 10 == 54 <= 60 and 8 * 6 + 3 * 5 == 63 > 60)
# BOOK INCONSISTENCIES (checked here, kept out of lessons and questions):
# p. 114 Tabel 4.1 no. 2 is 6x − 4y = 7, but the elimination on p. 115 uses 6x − 4y = 5 (0 = −3).
cek(5 - 2 * 1 == 3 and 7 - 2 * 1 == 5)
# p. 126, Uji Kompetensi 2: at 4% and 6% on Rp100.000.000 the interest is at least 4.000.000,
# so «setidaknya Rp550.000» holds for every split.
cek(all(F(4, 100) * a + F(6, 100) * (100000000 - a) >= 4000000 > 550000 for a in (0, 50000000, 100000000)))
# The Latihan systems behave as their questions expect (checked, not used):
cek(selesaikan([[3, 2, 1], [1, 3, 2], [-2, 0, 1]], [455, 545, 0]) == [55, 90, 110])           # Asep
cek(selesaikan([[3, 2, 3], [3, 1, 2], [0, 2, 2]], [4700, 3300, 2800]) is None)                # Bonar: banyak
cek(selesaikan([[3, 3, 1], [2, 2, 1], [1, 1, 0]], [130000, 100000, 50000]) is None and 130000 - 100000 == 30000 != 50000)  # Bu Wati: tidak ada
cek(2 * 50000 != 95000)                                                                         # Pak Musa: tidak ada
cek(selesaikan([[4, 2, 1], [1, 3, 2], [3, 1, 1]], [640000, 550000, 450000]) == [90000, 100000, 80000])   # Uji 3
cek(selesaikan([[5, 1, 8], [10, 2, 4], [0, 3, 12]], [F(3, 2), 2, 2]) == [F(1, 10), F(1, 3), F(1, 12)])  # Uji 4
cek(selesaikan([[25, -15, 10], [32, 16, -12], [-21, 7, 14]], [100, 240, 140]) == [F(180, 29), F(360, 29), F(380, 29)])  # Uji 6
cek(selesaikan([[1, -3, 2], [2, 1, -3], [3, -2, -1]], [20, 15, 35]) is None and 20 + 15 == 35)  # Latihan 4.1 no. 4d

SUMBER = ("_Diadaptasi dari Matematika untuk SMA/MA/SMK/MAK Kelas X (Edisi Revisi), Dicky Susanto dkk., "
          "Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi, 2023, Bab 4._")

KURSUS = {
    "Judul kursus*": "Matematika Kelas X · Bab 4: Sistem Persamaan dan Pertidaksamaan Linear",
    "Mata pelajaran*": "Matematika",
    "Jenjang*": "SMA",
    "Kelas*": "Kelas X",
    "Konteks": "Akademik",
}

BAB = [(1, "Sistem Persamaan dan Pertidaksamaan Linear")]

PELAJARAN = [
    dict(no=1, judul="Sistem Persamaan Linear Dua Variabel",
         ringkasan="Sistem persamaan linear adalah gabungan beberapa persamaan linear; penyelesaiannya memenuhi semua persamaan sekaligus.",
         tujuan="Kamu dapat memodelkan masalah dengan sistem persamaan linear dua variabel dan menyelesaikannya dengan eliminasi dan substitusi.",
         bloom="Menerapkan",
         isi="""## Sistem persamaan linear

**Sistem persamaan linear** adalah gabungan beberapa persamaan linear. Penyelesaiannya (solusinya) adalah nilai yang memenuhi semua persamaan linear itu sekaligus.

Pada persamaan linear, setiap variabel berpangkat satu dan variabel-variabel tidak saling dikalikan. Contoh: 5x + 2y = 18 adalah persamaan linear, sedangkan x² + y = 5 dan xy = 6 bukan.

## Contoh: paket alat tulis

Sebuah toko menjual Paket A berisi lima buku tulis dan dua pensil seharga Rp18.000, dan Paket B berisi sebuah buku tulis dan dua pensil seharga Rp10.000. Berapa harga sebuah buku tulis dan sebuah pensil?

Misalkan x harga sebuah buku tulis dan y harga sebuah pensil (dalam rupiah):

- 5x + 2y = 18.000 … (1)
- x + 2y = 10.000 … (2)

## Eliminasi dan substitusi

1. **Eliminasi y:** kurangkan (2) dari (1): 4x = 8.000, jadi x = 2.000.
2. **Substitusi** x = 2.000 ke (2): 2.000 + 2y = 10.000, jadi 2y = 8.000 dan y = 4.000.
3. **Periksa** di kedua persamaan: 5 × 2.000 + 2 × 4.000 = 18.000 dan 2.000 + 2 × 4.000 = 10.000.

Jadi harga sebuah buku tulis **Rp2.000** dan sebuah pensil **Rp4.000**.

Saat mengeliminasi, kedua ruas persamaan harus dikalikan atau dikurangkan bersama-sama, bukan hanya ruas kirinya.

""" + SUMBER),
    dict(no=2, judul="Sistem Persamaan Linear Tiga Variabel",
         ringkasan="Sistem tiga variabel diselesaikan dengan mengeliminasi satu variabel sehingga menjadi sistem dua variabel, lalu mensubstitusi kembali.",
         tujuan="Kamu dapat memodelkan dan menyelesaikan sistem persamaan linear tiga variabel.",
         bloom="Menerapkan",
         isi="""## Menimbang bola

Kinan menimbang bola di lemari sekolah tiga kali:

- dua bola basket, sebuah bola kaki, dan tiga bola voli: 2.500 g;
- sebuah bola basket, dua bola kaki, dan dua bola voli: 2.050 g;
- dua bola basket dan sebuah bola voli: 1.550 g.

Berapa berat setiap jenis bola? Misalkan x berat bola basket, y berat bola kaki, dan z berat bola voli (dalam gram):

- 2x + y + 3z = 2.500 … (1)
- x + 2y + 2z = 2.050 … (2)
- 2x + z = 1.550 … (3)

Gabungan (1), (2), dan (3) adalah sistem persamaan linear tiga variabel. Persamaan (3) tidak memuat y, tetapi sistemnya tetap sistem tiga variabel.

## Menjadikan dua variabel

Persamaan (3) tidak memuat y, jadi y dieliminasi dari (1) dan (2). Kalikan (1) dengan 2, lalu kurangkan (2):

(4x + 2y + 6z) − (x + 2y + 2z) = 5.000 − 2.050, jadi 3x + 4z = 2.950 … (4)

Sekarang (3) dan (4) membentuk sistem dua variabel, x dan z.

## Menyelesaikan dan memeriksa

1. Dari (3): z = 1.550 − 2x. Substitusi ke (4): 3x + 4(1.550 − 2x) = 2.950, jadi 6.200 − 5x = 2.950 dan x = 650.
2. z = 1.550 − 2 × 650 = 250.
3. Dari (1): y = 2.500 − 2 × 650 − 3 × 250 = 450.
4. Periksa (2): 650 + 2 × 450 + 2 × 250 = 2.050.

Jadi bola basket **650 g**, bola kaki **450 g**, dan bola voli **250 g**.

Solusi harus memenuhi **semua** persamaan. Nilai yang memenuhi satu atau dua persamaan saja bukan solusi sistem.

## Coba pikirkan

Mengapa Kinan perlu menimbang tiga kali? Apa yang terjadi jika ia hanya menimbang dua kali?

""" + SUMBER),
    dict(no=3, judul="Banyaknya Solusi",
         ringkasan="Sistem persamaan linear dapat mempunyai satu solusi, tidak mempunyai solusi, atau mempunyai banyak solusi; hasil eliminasi menunjukkannya.",
         tujuan="Kamu dapat menentukan banyaknya solusi sistem persamaan linear dari grafik dan dari hasil eliminasi.",
         bloom="Menganalisis",
         isi="""## Tiga kemungkinan

Sistem persamaan linear dua variabel mempunyai satu dari tiga kemungkinan:

- **satu solusi**: grafiknya dua garis yang berpotongan, dan solusinya titik potong kedua garis;
- **tidak ada solusi**: grafiknya dua garis yang sejajar;
- **banyak solusi**: grafiknya dua garis yang berimpit, dan semua titik pada garis itu solusi.

## Contohnya

1. 2x − y = −4 dan x + 2y = 3. Kalikan persamaan pertama dengan 2 lalu jumlahkan: 5x = −5, jadi x = −1 dan y = 2. Hanya ada satu pasangan nilai, (−1, 2), dan kedua garis berpotongan di titik itu.
2. 3x − 2y = 1 dan 6x − 4y = 7. Kalikan persamaan pertama dengan 2: 6x − 4y = 2. Kurangkan dari persamaan kedua: 0 = 5. Pernyataan ini tidak pernah benar, jadi sistem **tidak mempunyai solusi**; kedua garis sejajar.
3. 2x + 3y = 1 dan 4x + 6y = 2. Kalikan persamaan pertama dengan 2 lalu kurangkan: 0 = 0. Pernyataan ini selalu benar, berapa pun nilai variabelnya, jadi sistem mempunyai **banyak solusi**; kedua garis berimpit.

## Tanpa menggambar grafik

Persamaan linear tiga variabel memerlukan grafik tiga dimensi, jadi banyaknya solusi lebih mudah dilihat dari hasil eliminasi:

- muncul pernyataan yang tidak pernah benar, seperti 0 = 5 → tidak ada solusi;
- muncul pernyataan yang selalu benar, seperti 0 = 0 → banyak solusi (jika tidak ada pernyataan yang tidak benar);
- semua variabel mendapat satu nilai → satu solusi.

Contoh: x + y + z = 6 dan 2x + 2y + 2z = 10. Kalikan yang pertama dengan 2 lalu kurangkan: 0 = −2. Tidak ada solusi.

""" + SUMBER),
    dict(no=4, judul="Pertidaksamaan Linear dan Daerah Hasil",
         ringkasan="Penyelesaian sistem pertidaksamaan linear adalah daerah pada bidang koordinat yang membuat semua pertidaksamaan bernilai benar.",
         tujuan="Kamu dapat menggambar daerah hasil pertidaksamaan linear dengan garis batas dan uji titik.",
         bloom="Menerapkan",
         isi="""## Menimbang buah

Pak Eko menimbang buah. Dua apel dan lima jeruk beratnya kurang dari 1 kg, sedangkan enam apel dan dua jeruk beratnya lebih dari 1 kg. Setiap apel sama beratnya, dan setiap jeruk sama beratnya. Berapa berat setiap buah?

Misalkan x berat sebuah apel dan y berat sebuah jeruk, dalam ons (1 kg = 10 ons):

- 2x + 5y < 10
- 6x + 2y > 10

Ini **sistem pertidaksamaan linear**. Penyelesaiannya membuat semua pertidaksamaannya bernilai benar sekaligus.

## Garis batas

Ubah setiap tanda pertidaksamaan menjadi tanda sama dengan, lalu gambar garisnya: 2x + 5y = 10 dan 6x + 2y = 10.

- Untuk < atau >, garis digambar **putus-putus**: garis itu hanya batas dan tidak termasuk daerah hasil.
- Untuk ≤ atau ≥, garis digambar **utuh**: garis itu termasuk daerah hasil.

Pada soal Pak Eko, kedua garis putus-putus. Keduanya berpotongan di (15/13, 20/13), kira-kira (1,15; 1,54).

## Uji titik

Pilih sebuah titik yang tidak terletak pada garis, misalnya (0, 0), lalu substitusikan:

- 2 × 0 + 5 × 0 = 0 < 10 benar → daerah yang memuat (0, 0) adalah daerah hasil 2x + 5y < 10;
- 6 × 0 + 2 × 0 = 0 > 10 tidak benar → daerah hasil 6x + 2y > 10 adalah sisi garis yang **tidak** memuat (0, 0).

Penyelesaian sistem adalah **irisan** semua daerah hasil: titik yang memenuhi kedua pertidaksamaan.

## Satu kemungkinan jawaban

Apel 2 ons dan jeruk 1 ons: 2 × 2 + 5 × 1 = 9 < 10 dan 6 × 2 + 2 × 1 = 14 > 10. Keduanya benar, jadi (2, 1) termasuk penyelesaian. Titik (1, 2) tidak: 2 × 1 + 5 × 2 = 12, tidak kurang dari 10.

Jawabannya bukan satu pasangan nilai, melainkan sebuah daerah: banyak pasangan berat yang mungkin.

""" + SUMBER),
    dict(no=5, judul="Sistem Pertidaksamaan Linear dalam Masalah",
         ringkasan="Masalah dengan batasan seperti anggaran dan jumlah minimum dimodelkan dengan sistem pertidaksamaan linear; solusinya irisan semua daerah hasil.",
         tujuan="Kamu dapat memodelkan masalah dengan sistem pertidaksamaan linear dan menafsirkan daerah hasilnya.",
         bloom="Menerapkan",
         isi="""## Perayaan hari kemerdekaan

Kiki adalah panitia perayaan hari kemerdekaan di RT. Dari kas RT ada Rp500.000 yang dapat digunakan. Penyelenggaraan perlombaan membutuhkan Rp20.000 per anak, dan hadiah dianggarkan Rp40.000 untuk setiap jenis perlombaan. Diharapkan ada lebih dari 13 anak yang berpartisipasi. Apa saja kemungkinannya?

Misalkan x banyak anak dan y banyak jenis perlombaan. Dalam ribuan rupiah:

- 20x + 40y ≤ 500 (biaya tidak melebihi kas)
- x > 13 (lebih dari 13 anak)

Karena x dan y banyaknya anak dan perlombaan, keduanya bilangan cacah, dan paling sedikit ada satu perlombaan (y ≥ 1).

## Membaca daerah hasil

Garis 20x + 40y = 500 digambar utuh (tanda ≤), dan garis x = 13 putus-putus (tanda >). Uji (0, 0): 0 ≤ 500 benar, tetapi 0 > 13 tidak benar. Daerah hasil adalah irisan: di bawah atau pada garis pertama, dan di sebelah kanan garis x = 13.

## Kemungkinannya

Pertidaksamaan pertama dapat disederhanakan menjadi x + 2y ≤ 25.

- y = 1 → x dari 14 sampai 23
- y = 3 → x dari 14 sampai 19
- y = 5 → x = 14 atau 15

Jadi paling banyak 5 jenis perlombaan. Contoh: 20 anak dan 2 perlombaan memerlukan 20 × 20 + 40 × 2 = 480 ribu rupiah, masih cukup. 16 anak dan 5 perlombaan memerlukan 520 ribu rupiah, tidak cukup.

""" + SUMBER),
    dict(no=6, judul="Memodelkan Masalah",
         ringkasan="Kata seperti setidaknya, paling banyak, dan tidak lebih dari menentukan tanda pertidaksamaan; pilih persamaan atau pertidaksamaan menurut masalahnya.",
         tujuan="Kamu dapat menerjemahkan masalah sehari-hari menjadi sistem persamaan atau pertidaksamaan linear.",
         bloom="Menerapkan",
         isi="""## Langkah memodelkan

1. Tentukan variabelnya: apa yang dicari? Tulis artinya dan satuannya.
2. Terjemahkan setiap keterangan menjadi persamaan atau pertidaksamaan.
3. Selesaikan, lalu periksa jawabannya pada masalah awal.

Jika keterangannya berupa jumlah yang tepat («seharga», «beratnya»), gunakan persamaan. Jika berupa batasan («paling banyak», «lebih dari»), gunakan pertidaksamaan.

## Menerjemahkan kata-kata

- «lebih dari 13» → x > 13
- «kurang dari 1 kg» → … < 10 (dalam ons)
- «setidaknya 5» atau «paling sedikit 5» → y ≥ 5
- «tidak lebih dari 10» atau «paling banyak 10» → x + y ≤ 10
- «tidak kurang dari 2» → x ≥ 2

## Contoh

Rina punya Rp60.000 untuk membeli buku seharga Rp8.000 dan pena seharga Rp3.000. Ia ingin membeli setidaknya 2 buku. Apakah 3 buku dan 10 pena mungkin? Bagaimana dengan 6 buku dan 5 pena?

Misalkan x banyak buku dan y banyak pena. Dalam ribuan rupiah: 8x + 3y ≤ 60 dan x ≥ 2.

- 3 buku dan 10 pena: 8 × 3 + 3 × 10 = 54 ≤ 60 dan 3 ≥ 2. **Mungkin.**
- 6 buku dan 5 pena: 8 × 6 + 3 × 5 = 63, lebih dari 60. **Tidak mungkin.**

## Rangkuman Bab 4

- Sistem persamaan linear: solusinya memenuhi semua persamaan; diselesaikan dengan eliminasi dan substitusi.
- Sistem tiga variabel dijadikan sistem dua variabel dengan mengeliminasi satu variabel.
- Hasil eliminasi 0 = (bilangan bukan nol) berarti tidak ada solusi; 0 = 0 berarti banyak solusi.
- Sistem pertidaksamaan linear: garis batas putus-putus untuk < dan >, utuh untuk ≤ dan ≥; uji titik; solusinya irisan semua daerah hasil.

""" + SUMBER),
]

# Statements that are false or doubtful outside the book, or book errors, stay out of the lessons.
DILUAR = ("0 = −3", "6x − 4y = 5", "ketidaksamaan", "550.000")
for _p in PELAJARAN:
    cek(3 <= _p["isi"].count("\n## ") + _p["isi"].startswith("## ") <= 6, f"lesson {_p['no']}: 3-6 pages")
    cek(_p["isi"].rstrip().endswith(SUMBER), f"lesson {_p['no']}: attribution last")
    cek(_p["isi"].count("Coba pikirkan") <= 1, f"lesson {_p['no']}: at most one Coba pikirkan")
    cek(not any(w in _p["isi"] for w in DILUAR), f"lesson {_p['no']}: {[w for w in DILUAR if w in _p['isi']]}")
    notasi(_p["isi"], f"lesson {_p['no']}")
    notasi(_p["ringkasan"], f"lesson {_p['no']} ringkasan")
# Lesson 5 states the units the book's model leaves implicit.
cek("Dalam ribuan rupiah" in PELAJARAN[4]["isi"] and "20x + 40y ≤ 500" in PELAJARAN[4]["isi"])

# ── Misconceptions: the book has no Miskonsepsi section; these come from the distractors.
MISKONSEPSI = {
    "SMA10-M-B4-01": ("Eliminasi keliru",
                      "Persamaan dijumlahkan padahal harus dikurangkan, atau hanya sebagian suku yang dikalikan.",
                      "Tulis kedua persamaan bersusun, kalikan seluruh ruasnya, lalu periksa koefisien variabel yang hendak dihapus."),
    "SMA10-M-B4-02": ("Nilai variabel yang lain dijawab",
                      "Yang ditulis nilai variabel lain atau hasil antara, bukan variabel yang ditanya.",
                      "Tulis arti setiap variabel di awal, lalu baca kembali pertanyaannya."),
    "SMA10-M-B4-03": ("Solusi hanya memenuhi sebagian persamaan",
                      "Nilai yang memenuhi satu persamaan dianggap solusi sistem.",
                      "Substitusikan jawaban ke semua persamaan; solusi harus membuat semuanya benar."),
    "SMA10-M-B4-04": ("Hasil eliminasi keliru dibaca",
                      "0 = 0 dan 0 = (bilangan bukan nol) tertukar, atau dikira berarti x = 0.",
                      "Tanyakan: apakah pernyataan itu selalu benar, tidak pernah benar, atau benar untuk satu nilai?"),
    "SMA10-M-B4-05": ("Grafik dan banyaknya solusi tertukar",
                      "Garis sejajar, berimpit, dan berpotongan dipasangkan dengan banyak solusi yang keliru.",
                      "Solusi adalah titik bersama: berpotongan satu titik, sejajar tidak ada, berimpit semua titik."),
    "SMA10-M-B4-06": ("Persamaan yang bukan linear dianggap linear",
                      "Persamaan dengan pangkat dua, perkalian variabel, atau variabel di penyebut dianggap linear.",
                      "Periksa setiap suku: variabel berpangkat satu dan tidak dikalikan dengan variabel lain."),
    "SMA10-M-B4-07": ("Kata batasan keliru diterjemahkan",
                      "«Setidaknya», «tidak lebih dari», dan «lebih dari» diterjemahkan dengan tanda yang keliru.",
                      "Uji dengan satu bilangan: apakah batasnya sendiri boleh? Jika boleh, pakai ≤ atau ≥."),
    "SMA10-M-B4-08": ("Garis batas keliru",
                      "Garis untuk < dan > digambar utuh, atau titik pada garis putus-putus dianggap penyelesaian.",
                      "Tanda tanpa garis bawah (< dan >) berarti garisnya tidak termasuk."),
    "SMA10-M-B4-09": ("Uji titik keliru",
                      "Hasil uji titik dibaca terbalik, atau titik uji diambil pada garis batas.",
                      "Substitusikan titik di luar garis; benar berarti sisi itu daerah hasil, tidak benar berarti sisi lainnya."),
    "SMA10-M-B4-10": ("Hanya satu syarat diperiksa",
                      "Titik yang memenuhi satu pertidaksamaan dianggap penyelesaian sistem.",
                      "Penyelesaian sistem adalah irisan: periksa setiap pertidaksamaan satu per satu."),
    "SMA10-M-B4-11": ("Model tidak sesuai masalah",
                      "Koefisien atau variabel tertukar, atau persamaan dipakai padahal masalahnya berupa batasan.",
                      "Tulis arti setiap variabel dan cocokkan setiap angka dengan keterangannya."),
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




# ── Pemetaan awal (pre-test): a two-variable system, reading 0 = 5, a test point, a word for ≤.
cek(selesaikan([[1, 1], [1, -1]], [10, 4]) == [7, 3] and 7 + 3 == 10 and 7 - 3 == 4)
soal("PA1", 1, "Penyelesaian sistem x + y = 10 dan x − y = 4 adalah ...", "A", [
    ("x = 7, y = 3", True, "Benar. Jumlahkan kedua persamaan: 2x = 14, jadi x = 7 dan y = 10 − 7 = 3.", "", "=solusi"),
    ("x = 3, y = 7", False, "Nilai x dan y tertukar. Periksa: 3 − 7 = −4, bukan 4.", "SMA10-M-B4-02", "=solusi"),
    ("x = 14, y = −4", False, "2x = 14 belum dibagi 2. x = 7.", "SMA10-M-B4-01", "=eliminasi"),
    ("x = 6, y = 4", False, "Hanya memenuhi x + y = 10; 6 − 4 = 2, bukan 4.", "SMA10-M-B4-03", "=solusi"),
], guna="Pemetaan awal")
soal("PA2", 3, "Saat menyelesaikan sebuah sistem persamaan linear dengan eliminasi, diperoleh 0 = 5. Artinya ...", "C", [
    ("sistem tidak mempunyai solusi", True, "Benar. 0 = 5 tidak pernah benar, berapa pun nilai variabelnya, jadi tidak ada solusi.", "", "tidak_pernah"),
    ("sistem mempunyai banyak solusi", False, "Banyak solusi ditandai pernyataan yang selalu benar, seperti 0 = 0.", "SMA10-M-B4-04", "selalu_benar"),
    ("solusinya x = 0", False, "0 = 5 tidak memuat x. Pernyataan itu tidak benar untuk semua nilai.", "SMA10-M-B4-04", "tidak_pernah"),
    ("solusinya 5", False, "0 = 5 bukan nilai variabel, melainkan pernyataan yang tidak pernah benar.", "SMA10-M-B4-04", "tidak_pernah"),
], guna="Pemetaan awal")
cek(3 * 0 + 2 * 0 < 12 and not 3 * 4 + 2 * 0 < 12 and 3 * 2 + 2 * 4 == 14 and 3 * 4 + 2 * 1 == 14)
soal("PA3", 4, "Titik manakah yang memenuhi pertidaksamaan 3x + 2y < 12?", "B", [
    ("(0, 0)", True, "Benar. 3 × 0 + 2 × 0 = 0, dan 0 < 12 benar.", "", "=uji_titik"),
    ("(4, 0)", False, "3 × 4 + 2 × 0 = 12, dan 12 < 12 tidak benar. Titik ini terletak pada garis batas yang putus-putus.", "SMA10-M-B4-08", "=garis"),
    ("(2, 4)", False, "3 × 2 + 2 × 4 = 14, tidak kurang dari 12.", "SMA10-M-B4-09", "=uji_titik"),
    ("(4, 1)", False, "3 × 4 + 2 × 1 = 14, tidak kurang dari 12.", "SMA10-M-B4-09", "=uji_titik"),
], guna="Pemetaan awal")
soal("PA4", 6, "Banyak jam kerja x tidak lebih dari 10 jam. Pertidaksamaan yang tepat adalah ...", "D", [
    ("x ≤ 10", True, "Benar. «Tidak lebih dari 10» berarti 10 atau kurang, jadi 10 sendiri boleh.", "", "=sptl_def"),
    ("x < 10", False, "Tanda < tidak membolehkan tepat 10 jam, padahal 10 jam tidak lebih dari 10.", "SMA10-M-B4-07", "=sptl_def"),
    ("x ≥ 10", False, "Arahnya terbalik: x ≥ 10 berarti setidaknya 10 jam.", "SMA10-M-B4-07", "=sptl_def"),
    ("x > 10", False, "Itu berarti lebih dari 10 jam, kebalikan dari yang diminta.", "SMA10-M-B4-07", "=sptl_def"),
], guna="Pemetaan awal")

# ── Cek penguasaan (post-test): every lesson; fresh numbers, no Latihan or Uji Kompetensi item
# and no worked example of the book with its numbers barely changed.
cek(selesaikan([[2, 3], [1, 2]], [58000, 32000]) == [20000, 6000] and 58000 - 32000 == 26000 and F(26000, 2) == 13000)
soal("PB1", 1, "Harga 2 kg apel dan 3 kg jeruk Rp58.000, sedangkan harga 1 kg apel dan 2 kg jeruk Rp32.000. Harga 1 kg jeruk adalah ...", "C", [
    ("Rp6.000", True, "Benar. Kalikan persamaan kedua dengan 2: 2a + 4j = 64.000. Kurangkan persamaan pertama: j = 6.000.", "", "=eliminasi"),
    ("Rp20.000", False, "Itu harga 1 kg apel (a = 32.000 − 2 × 6.000). Yang ditanya jeruk.", "SMA10-M-B4-02", "=eliminasi"),
    ("Rp26.000", False, "Kedua persamaan dikurangkan tanpa menyamakan koefisien, sehingga yang didapat a + j = 26.000, bukan harga jeruk.", "SMA10-M-B4-01", "=eliminasi"),
    ("Rp13.000", False, "a + j = 26.000 dibagi 2, seolah apel dan jeruk sama harganya.", "SMA10-M-B4-01", "=eliminasi"),
], guna="Cek penguasaan", sulit="Sedang")
PB2_A, PB2_B = [[1, 1, 1], [2, -1, 1], [1, 2, -1]], [9, 5, 4]
cek(selesaikan(PB2_A, PB2_B) == [2, 3, 4] and memenuhi(PB2_A, PB2_B, [2, 3, 4]))
cek(all(sum(t) == 9 and not memenuhi(PB2_A, PB2_B, t) for t in ([3, 2, 4], [4, 3, 2], [2, 4, 3])))
cek([2 * 3 - 2 + 4, 2 * 4 - 3 + 2, 2 * 2 - 4 + 3] == [8, 7, 3])
soal("PB2", 2, "Penyelesaian sistem x + y + z = 9, 2x − y + z = 5, dan x + 2y − z = 4 adalah (x, y, z) = ...", "A", [
    ("(2, 3, 4)", True, "Benar. 2 + 3 + 4 = 9, 4 − 3 + 4 = 5, dan 2 + 6 − 4 = 4: ketiga persamaan terpenuhi.", "", "=solusi"),
    ("(3, 2, 4)", False, "Hanya memenuhi persamaan pertama: 2 × 3 − 2 + 4 = 8, bukan 5.", "SMA10-M-B4-03", "=solusi"),
    ("(4, 3, 2)", False, "Hanya memenuhi persamaan pertama: 2 × 4 − 3 + 2 = 7, bukan 5.", "SMA10-M-B4-03", "=solusi"),
    ("(2, 4, 3)", False, "Hanya memenuhi persamaan pertama: 2 × 2 − 4 + 3 = 3, bukan 5.", "SMA10-M-B4-03", "=solusi"),
], guna="Cek penguasaan", sulit="Sedang")
cek(banyak_solusi_2(1, 3, 5, 2, 6, 10) == "banyak" and 10 - 2 * 5 == 0)
soal("PB3", 3, "Sistem x + 3y = 5 dan 2x + 6y = 10 mempunyai ...", "D", [
    ("banyak solusi", True, "Benar. Kalikan persamaan pertama dengan 2 lalu kurangkan: 0 = 0, selalu benar. Kedua garis berimpit.", "", "=selalu_benar"),
    ("tepat satu solusi", False, "Satu solusi memerlukan dua garis berpotongan. Persamaan kedua adalah persamaan pertama dikali 2, jadi garisnya berimpit.", "SMA10-M-B4-05", "=tiga_kemungkinan"),
    ("tidak ada solusi", False, "Eliminasi memberi 0 = 0, bukan pernyataan yang tidak benar.", "SMA10-M-B4-04", "=selalu_benar"),
    ("tepat dua solusi", False, "Sistem persamaan linear tidak mungkin mempunyai tepat dua solusi: satu, tidak ada, atau banyak.", "SMA10-M-B4-05", "=tiga_kemungkinan"),
], guna="Cek penguasaan", sulit="Sedang")
cek(banyak_solusi_2(2, -1, 3, 4, -2, 8) == "tidak ada" and 8 - 2 * 3 == 2)
soal("PB4", 3, "Grafik persamaan 2x − y = 3 dan 4x − 2y = 8 berupa ...", "B", [
    ("dua garis sejajar", True, "Benar. Kalikan yang pertama dengan 2: 4x − 2y = 6. Kurangkan dari yang kedua: 0 = 2, tidak pernah benar. Tidak ada titik bersama, jadi garisnya sejajar.", "", "=tiga_kemungkinan"),
    ("dua garis berimpit", False, "Garis berimpit memberi 0 = 0. Di sini eliminasi memberi 0 = 2.", "SMA10-M-B4-05", "=tiga_kemungkinan"),
    ("dua garis berpotongan di satu titik", False, "Kedua persamaan mempunyai koefisien x dan y yang sebanding (4 : 2 = −2 : −1), jadi garisnya tidak berpotongan.", "SMA10-M-B4-05", "=tiga_kemungkinan"),
    ("dua garis yang saling tegak lurus", False, "Garis tegak lurus pasti berpotongan. Eliminasi memberi 0 = 2, jadi tidak ada titik bersama.", "SMA10-M-B4-05", "=tiga_kemungkinan"),
], guna="Cek penguasaan", sulit="Sedang")
PB5 = lambda x, y: 2 * x + y <= 8 and x - y > 1
cek(PB5(3, 1) and not PB5(4, 1) and 2 * 4 + 1 == 9 and not PB5(2, 1) and 2 - 1 == 1 and not PB5(0, 0))
soal("PB5", 4, "Titik manakah yang termasuk penyelesaian sistem 2x + y ≤ 8 dan x − y > 1?", "B", [
    ("(3, 1)", True, "Benar. 2 × 3 + 1 = 7 ≤ 8 dan 3 − 1 = 2 > 1: kedua pertidaksamaan benar.", "", "=irisan"),
    ("(4, 1)", False, "x − y = 3 > 1 benar, tetapi 2 × 4 + 1 = 9, lebih dari 8. Kedua syarat harus dipenuhi.", "SMA10-M-B4-10", "=irisan"),
    ("(2, 1)", False, "x − y = 1, dan 1 > 1 tidak benar. Titik ini terletak pada garis batas putus-putus, yang tidak termasuk.", "SMA10-M-B4-08", "=garis"),
    ("(0, 0)", False, "2 × 0 + 0 ≤ 8 benar, tetapi 0 − 0 = 0 > 1 tidak benar.", "SMA10-M-B4-10", "=irisan"),
], guna="Cek penguasaan", sulit="Sedang")
soal("PB6", 4, "Saat menggambar daerah hasil x + 2y ≥ 6, garis x + 2y = 6 digambar ...", "D", [
    ("utuh, karena titik pada garis termasuk daerah hasil", True, "Benar. Tanda ≥ membolehkan x + 2y = 6, jadi garisnya termasuk dan digambar utuh.", "", "garis"),
    ("putus-putus, karena titik pada garis tidak termasuk daerah hasil", False, "Garis putus-putus dipakai untuk < dan >. Tanda ≥ memuat «sama dengan».", "SMA10-M-B4-08", "garis"),
    ("utuh, karena semua garis batas digambar utuh", False, "Tidak semua: garis untuk < dan > digambar putus-putus.", "SMA10-M-B4-08", "garis"),
    ("putus-putus, karena garis hanya batas", False, "Itu berlaku untuk < dan >. Untuk ≥, garisnya termasuk daerah hasil.", "SMA10-M-B4-08", "garis"),
], guna="Cek penguasaan", sulit="Mudah")
soal("PB7", 6, "Sebuah aula dapat menampung paling banyak 60 kursi. Panitia memakai x kursi lipat dan y kursi plastik, dengan paling sedikit 20 kursi lipat. Model yang tepat adalah ...", "A", [
    ("x + y ≤ 60 dan x ≥ 20", True, "Benar. «Paling banyak 60» berarti x + y ≤ 60, dan «paling sedikit 20» berarti x ≥ 20.", "", "=sptl_def"),
    ("x + y < 60 dan x > 20", False, "Tanda < dan > tidak membolehkan tepat 60 kursi atau tepat 20 kursi lipat, padahal keduanya boleh.", "SMA10-M-B4-07", "=sptl_def"),
    ("x + y ≥ 60 dan x ≤ 20", False, "Kedua tanda terbalik: «paling banyak» memakai ≤ dan «paling sedikit» memakai ≥.", "SMA10-M-B4-07", "=sptl_def"),
    ("x + y = 60 dan x = 20", False, "Masalahnya berupa batasan, bukan jumlah yang tepat, jadi dipakai pertidaksamaan.", "SMA10-M-B4-11", "=sptl_def"),
], guna="Cek penguasaan", sulit="Sulit")
PB8 = lambda x, y: 30 * x + 50 * y <= 300 and x >= 2 and y >= 1
cek(PB8(5, 2) and 30 * 5 + 50 * 2 == 250 and not PB8(6, 3) and 30 * 6 + 50 * 3 == 330)
cek(not PB8(1, 5) and 30 + 250 == 280 <= 300 and not PB8(5, 0) and 150 <= 300)
soal("PB8", 5, "Kelas menyewa meja seharga Rp30.000 per meja dan tenda seharga Rp50.000 per tenda. Anggarannya tidak lebih dari Rp300.000, dan diperlukan setidaknya 2 meja dan 1 tenda. Pilihan manakah yang mungkin?", "C", [
    ("5 meja dan 2 tenda", True, "Benar. 30 × 5 + 50 × 2 = 250 ribu ≤ 300 ribu, 5 ≥ 2, dan 2 ≥ 1: semua syarat terpenuhi.", "", "=irisan"),
    ("6 meja dan 3 tenda", False, "Banyak meja dan tenda cukup, tetapi biayanya 180 + 150 = 330 ribu, melebihi anggaran.", "SMA10-M-B4-10", "=irisan"),
    ("1 meja dan 5 tenda", False, "Biayanya 280 ribu, masih cukup, tetapi mejanya kurang dari 2.", "SMA10-M-B4-10", "=irisan"),
    ("5 meja dan tanpa tenda", False, "Biayanya cukup, tetapi diperlukan setidaknya 1 tenda.", "SMA10-M-B4-10", "=irisan"),
], guna="Cek penguasaan", sulit="Sedang")

# ── Latihan (practice), by lesson.
soal("LT1", 1, "Penyelesaian sebuah sistem persamaan linear adalah nilai yang ...", "B", [
    ("memenuhi semua persamaan", True, "Benar. Penyelesaiannya adalah nilai yang memenuhi semua persamaan linear dalam sistem.", "", "spl_def"),
    ("memenuhi satu persamaan saja", False, "Nilai yang hanya memenuhi satu persamaan belum tentu memenuhi yang lain.", "SMA10-M-B4-03", "solusi"),
    ("membuat semua persamaan bernilai nol", False, "Yang dicari nilai variabel yang membuat setiap persamaan benar, bukan bernilai nol.", "SMA10-M-B4-04", "solusi"),
    ("sama untuk setiap variabel", False, "Nilai setiap variabel boleh berbeda, seperti buku Rp2.000 dan pensil Rp4.000.", "SMA10-M-B4-02", "solusi"),
])
cek(selesaikan([[1, 1], [1, -1]], [7, 1]) == [4, 3] and 7 - 1 == 6)
# The 6 is 7 − 1 taken as x; the rationale says so and gives the real sum (2x = 8).
LT2_C = "Hasil 7 − 1 = 6 langsung dianggap nilai x. Jumlahkan kedua persamaan: 2x = 8, jadi x = 4."
cek(7 - 1 == 6 != 4 and 7 + 1 == 8 and F(8, 2) == 4 and "7 − 1 = 6 langsung dianggap nilai x" in LT2_C and "sambil ruas kiri" not in LT2_C)
soal("LT2", 1, "Diketahui x + y = 7 dan x − y = 1. Nilai x adalah ...", "D", [
    ("4", True, "Benar. Jumlahkan kedua persamaan: 2x = 8, jadi x = 4 (dan y = 3).", "", "=eliminasi"),
    ("3", False, "Itu nilai y.", "SMA10-M-B4-02", "=eliminasi"),
    ("8", False, "Itu nilai 2x. Masih dibagi 2.", "SMA10-M-B4-01", "=eliminasi"),
    ("6", False, LT2_C, "SMA10-M-B4-01", "=eliminasi"),
])
cek(selesaikan([[-2, 1], [1, 1]], [0, 12]) == [4, 8] and 12 // 2 == 6 and 2 * 12 == 24)
soal("LT3", 1, "Diketahui y = 2x dan x + y = 12. Nilai y adalah ...", "A", [
    ("8", True, "Benar. Substitusi: x + 2x = 12, jadi x = 4 dan y = 2 × 4 = 8.", "", "=eliminasi"),
    ("4", False, "Itu nilai x.", "SMA10-M-B4-02", "=eliminasi"),
    ("6", False, "12 dibagi 2, seolah x = y. Padahal y = 2x.", "SMA10-M-B4-02", "=eliminasi"),
    ("24", False, "12 dikalikan 2. Substitusikan y = 2x ke x + y = 12 lebih dahulu.", "SMA10-M-B4-02", "=eliminasi"),
])
soal("LT4", 1, "Misalkan b harga sebuah buku dan p harga sebuah pena. «Harga 2 buku dan 1 pena Rp13.000» ditulis ...", "C", [
    ("2b + p = 13.000", True, "Benar. Dua buku seharga 2b, ditambah satu pena seharga p.", "", "=spl_def"),
    ("b + 2p = 13.000", False, "Koefisiennya tertukar: 2 untuk buku, 1 untuk pena.", "SMA10-M-B4-11", "=spl_def"),
    ("2bp = 13.000", False, "Harga dijumlahkan, bukan dikalikan; 2bp juga bukan bentuk linear.", "SMA10-M-B4-06", "=spl_def"),
    ("2b + p < 13.000", False, "Harganya tepat Rp13.000, jadi dipakai persamaan.", "SMA10-M-B4-11", "=spl_def"),
])
soal("LT5", 2, "Persamaan manakah yang merupakan persamaan linear tiga variabel?", "C", [
    ("2x − y + 4z = 7", True, "Benar. Setiap variabel berpangkat satu dan tidak dikalikan dengan variabel lain.", "", "spl_def"),
    ("x² + y + z = 3", False, "x² berpangkat dua, jadi bukan linear.", "SMA10-M-B4-06", "spl_def"),
    ("xy + z = 5", False, "xy adalah perkalian dua variabel, jadi bukan linear.", "SMA10-M-B4-06", "spl_def"),
    ("x + y + 1/z = 2", False, "1/z memuat variabel di penyebut, jadi bukan linear.", "SMA10-M-B4-06", "spl_def"),
])
cek(6 - 1 - 2 == 3 and 6 + 1 + 2 == 9 and 1 + 2 - 6 == -3)
soal("LT6", 2, "Diketahui x = 1 dan y = 2 merupakan bagian dari penyelesaian x + y + z = 6. Nilai z adalah ...", "A", [
    ("3", True, "Benar. 1 + 2 + z = 6, jadi z = 3.", "", "=solusi"),
    ("6", False, "Itu ruas kanan persamaan. x dan y belum dikurangkan.", "SMA10-M-B4-02", "=solusi"),
    ("9", False, "x dan y ditambahkan ke 6. Pindahkan ke ruas kanan dengan mengurangkan: 6 − 1 − 2.", "SMA10-M-B4-01", "=solusi"),
    ("−3", False, "Tandanya terbalik (1 + 2 − 6). z = 6 − 1 − 2 = 3.", "SMA10-M-B4-01", "=solusi"),
])
cek(10 - 4 == 6 and F(6, 2) == 3 and 10 + 4 == 14 and 10 - 3 == 7)
soal("LT7", 2, "Dari x + y + z = 10 dan x + y − z = 4, nilai z adalah ...", "D", [
    ("3", True, "Benar. Kurangkan persamaan kedua dari yang pertama: 2z = 6, jadi z = 3.", "", "=eliminasi"),
    ("6", False, "Itu nilai 2z. Masih dibagi 2.", "SMA10-M-B4-01", "=eliminasi"),
    ("7", False, "Itu nilai x + y = 10 − 3.", "SMA10-M-B4-02", "=eliminasi"),
    ("14", False, "Kedua persamaan dijumlahkan, sehingga z hilang: 2x + 2y = 14. Untuk mencari z, kurangkan.", "SMA10-M-B4-01", "=eliminasi"),
])
soal("LT8", 2, "Agar sistem persamaan linear tiga variabel mempunyai tepat satu solusi, diperlukan setidaknya ... persamaan.", "B", [
    ("tiga", True, "Benar. Dengan hanya dua persamaan, satu variabel selalu tersisa bebas, sehingga solusinya tidak tunggal. Karena itu Kinan menimbang tiga kali.", "", "prinsip"),
    ("dua", False, "Dua persamaan hanya cukup untuk dua variabel. Pada tiga variabel, satu variabel tersisa bebas.", "SMA10-M-B4-11", "prinsip"),
    ("satu", False, "Satu persamaan tiga variabel mempunyai banyak sekali solusi.", "SMA10-M-B4-04", "prinsip"),
    ("enam", False, "Tiga persamaan sudah dapat cukup; tidak perlu dua persamaan untuk setiap variabel.", "SMA10-M-B4-11", "prinsip"),
])
soal("LT9", 3, "Saat mengeliminasi sebuah sistem persamaan linear dua variabel, diperoleh 0 = 0. Sistem itu mempunyai ...", "D", [
    ("banyak solusi", True, "Benar. 0 = 0 selalu benar, berapa pun nilai variabelnya; kedua garis berimpit.", "", "selalu_benar"),
    ("tidak ada solusi", False, "Tidak ada solusi ditandai pernyataan yang tidak pernah benar, seperti 0 = 5.", "SMA10-M-B4-04", "tidak_pernah"),
    ("satu solusi, yaitu x = 0", False, "0 = 0 tidak memuat x, jadi bukan nilai x.", "SMA10-M-B4-04", "selalu_benar"),
    ("satu solusi, yaitu x = 0 dan y = 0", False, "0 = 0 bukan nilai variabel; pernyataan itu benar untuk semua nilai.", "SMA10-M-B4-04", "selalu_benar"),
])
soal("LT10", 3, "Jika grafik sistem persamaan linear dua variabel berupa dua garis berpotongan, solusinya adalah ...", "B", [
    ("titik potong kedua garis", True, "Benar. Hanya titik potong yang terletak pada kedua garis sekaligus.", "", "tiga_kemungkinan"),
    ("semua titik pada kedua garis", False, "Titik pada satu garis saja hanya memenuhi satu persamaan.", "SMA10-M-B4-03", "tiga_kemungkinan"),
    ("titik potong garis dengan sumbu x", False, "Titik pada sumbu x belum tentu terletak pada garis yang lain.", "SMA10-M-B4-05", "tiga_kemungkinan"),
    ("tidak ada", False, "Tidak ada solusi terjadi pada garis sejajar. Garis yang berpotongan mempunyai satu titik bersama.", "SMA10-M-B4-05", "tiga_kemungkinan"),
])
cek(banyak_solusi_2(3, 1, 5, 6, 2, 12) == "tidak ada" and 12 - 2 * 5 == 2)
soal("LT11", 3, "Sistem 3x + y = 5 dan 6x + 2y = 12 mempunyai ...", "C", [
    ("tidak ada solusi", True, "Benar. Kalikan yang pertama dengan 2: 6x + 2y = 10. Kurangkan: 0 = 2, tidak pernah benar.", "", "=tidak_pernah"),
    ("banyak solusi", False, "Banyak solusi memerlukan 0 = 0. Di sini diperoleh 0 = 2.", "SMA10-M-B4-04", "=tidak_pernah"),
    ("tepat satu solusi", False, "Koefisien x dan y sebanding (6 : 3 = 2 : 1), jadi garisnya tidak berpotongan.", "SMA10-M-B4-05", "=tiga_kemungkinan"),
    ("tepat dua solusi", False, "Tepat dua solusi tidak mungkin terjadi.", "SMA10-M-B4-05", "=tiga_kemungkinan"),
])
cek(banyak_solusi_2(1, 1, 4, 1, -1, 2) == "satu" and banyak_solusi_2(1, 1, 4, 2, 2, 8) == "banyak"
    and banyak_solusi_2(1, 1, 4, 1, 1, 6) == "tidak ada" and banyak_solusi_2(1, -1, 2, 3, -3, 6) == "banyak")
soal("LT12", 3, "Sistem manakah yang mempunyai tepat satu solusi?", "A", [
    ("x + y = 4 dan x − y = 2", True, "Benar. Jumlahkan: 2x = 6, jadi x = 3 dan y = 1, satu-satunya solusi.", "", "=satu_pasangan"),
    ("x + y = 4 dan 2x + 2y = 8", False, "Persamaan kedua sama dengan yang pertama dikali 2: banyak solusi.", "SMA10-M-B4-05", "=selalu_benar"),
    ("x + y = 4 dan x + y = 6", False, "x + y tidak mungkin 4 dan 6 sekaligus: tidak ada solusi.", "SMA10-M-B4-05", "=tidak_pernah"),
    ("x − y = 2 dan 3x − 3y = 6", False, "Persamaan kedua sama dengan yang pertama dikali 3: banyak solusi.", "SMA10-M-B4-05", "=selalu_benar"),
])
cek(4 * 0 + 3 * 0 < 12)
soal("LT13", 4, "Apakah titik (0, 0) termasuk daerah hasil 4x + 3y < 12?", "A", [
    ("ya, karena 0 < 12 benar", True, "Benar. 4 × 0 + 3 × 0 = 0, dan 0 < 12 benar, jadi daerah yang memuat (0, 0) adalah daerah hasil.", "", "=uji_titik"),
    ("tidak, karena 0 < 12 tidak benar", False, "0 < 12 justru benar.", "SMA10-M-B4-09", "=uji_titik"),
    ("tidak, karena (0, 0) terletak pada garis batas", False, "Pada garis batas 4x + 3y = 12. Di (0, 0) nilainya 0, jadi titik itu tidak pada garis.", "SMA10-M-B4-09", "=uji_titik"),
    ("hanya jika garisnya digambar utuh", False, "Jenis garis hanya menentukan titik pada garis batas. (0, 0) tidak pada garis.", "SMA10-M-B4-08", "=garis"),
])
cek(4 + 3 > 5 and not 2 + 2 > 5 and not 5 + 0 > 5 and not 0 + 0 > 5)
soal("LT14", 4, "Titik manakah yang memenuhi x + y > 5?", "C", [
    ("(4, 3)", True, "Benar. 4 + 3 = 7 > 5.", "", "=uji_titik"),
    ("(2, 2)", False, "2 + 2 = 4, tidak lebih dari 5.", "SMA10-M-B4-09", "=uji_titik"),
    ("(5, 0)", False, "5 + 0 = 5, dan 5 > 5 tidak benar. Titik ini terletak pada garis batas putus-putus.", "SMA10-M-B4-08", "=garis"),
    ("(0, 0)", False, "0 + 0 = 0, tidak lebih dari 5.", "SMA10-M-B4-09", "=uji_titik"),
])
soal("LT15", 4, "Garis batas daerah hasil 3x − y < 6 digambar sebagai ...", "B", [
    ("garis putus-putus", True, "Benar. Tanda < tidak memuat «sama dengan», jadi titik pada garis tidak termasuk.", "", "garis"),
    ("garis utuh", False, "Garis utuh dipakai untuk ≤ dan ≥.", "SMA10-M-B4-08", "garis"),
    ("garis utuh yang diarsir", False, "Yang diarsir adalah daerahnya, dan garis untuk < digambar putus-putus.", "SMA10-M-B4-08", "garis"),
    ("tidak perlu digambar", False, "Garis batas diperlukan untuk memisahkan daerah hasil dari yang bukan.", "SMA10-M-B4-08", "berpadanan"),
])
soal("LT16", 4, "Daerah penyelesaian sebuah sistem pertidaksamaan linear adalah ...", "D", [
    ("irisan semua daerah hasil", True, "Benar. Solusinya adalah daerah yang merupakan irisan semua daerah jawab.", "", "irisan"),
    ("gabungan semua daerah hasil", False, "Gabungan memuat titik yang hanya memenuhi satu pertidaksamaan.", "SMA10-M-B4-10", "irisan"),
    ("daerah hasil pertidaksamaan pertama saja", False, "Setiap pertidaksamaan dalam sistem harus dipenuhi.", "SMA10-M-B4-10", "sptl_def"),
    ("titik potong garis-garis batasnya", False, "Penyelesaiannya sebuah daerah, bukan hanya satu titik.", "SMA10-M-B4-05", "irisan"),
])
KK = lambda x, y: 20 * x + 40 * y <= 500 and x > 13
cek(KK(15, 5) and 20 * 15 + 40 * 5 == 500 and not KK(13, 5) and 20 * 13 + 40 * 5 == 460 and not KK(16, 5) and not KK(20, 3) and 400 + 120 == 520)
soal("LT17", 5, "Pada soal Kiki, 20x + 40y ≤ 500 (dalam ribuan rupiah) dan x > 13, dengan x banyak anak dan y banyak perlombaan. Pasangan manakah yang mungkin?", "D", [
    ("15 anak dan 5 lomba", True, "Benar. 20 × 15 + 40 × 5 = 500 ≤ 500, dan 15 > 13.", "", "=kiki"),
    ("13 anak dan 5 lomba", False, "Biayanya 460 ribu, cukup, tetapi 13 > 13 tidak benar: harus lebih dari 13 anak.", "SMA10-M-B4-10", "=kiki"),
    ("16 anak dan 5 lomba", False, "Biayanya 320 + 200 = 520 ribu, melebihi 500 ribu.", "SMA10-M-B4-10", "=kiki"),
    ("20 anak dan 3 lomba", False, "Biayanya 400 + 120 = 520 ribu, melebihi 500 ribu.", "SMA10-M-B4-10", "=kiki"),
])
soal("LT18", 6, "Nova ingin membeli setidaknya 5 tanaman. Jika y banyak tanaman, pertidaksamaannya ...", "B", [
    ("y ≥ 5", True, "Benar. «Setidaknya 5» berarti 5 atau lebih.", "", "=sptl_def"),
    ("y > 5", False, "Tanda > tidak membolehkan tepat 5 tanaman, padahal 5 tanaman sudah memenuhi.", "SMA10-M-B4-07", "=sptl_def"),
    ("y ≤ 5", False, "Arahnya terbalik: itu berarti paling banyak 5.", "SMA10-M-B4-07", "=sptl_def"),
    ("y < 5", False, "Itu berarti kurang dari 5, kebalikan dari yang diminta.", "SMA10-M-B4-07", "=sptl_def"),
])
soal("LT19", 6, "Sari berlatih renang x jam dan lari y jam setiap minggu, paling banyak 8 jam seluruhnya. Pertidaksamaannya ...", "C", [
    ("x + y ≤ 8", True, "Benar. «Paling banyak 8» berarti jumlahnya 8 atau kurang.", "", "=sptl_def"),
    ("x + y < 8", False, "Tanda < tidak membolehkan tepat 8 jam.", "SMA10-M-B4-07", "=sptl_def"),
    ("x + y ≥ 8", False, "Arahnya terbalik: itu berarti paling sedikit 8 jam.", "SMA10-M-B4-07", "=sptl_def"),
    ("x + y = 8", False, "«Paling banyak» adalah batasan, bukan jumlah yang tepat.", "SMA10-M-B4-11", "=sptl_def"),
])
soal("LT20", 6, "Masalah manakah yang dimodelkan dengan pertidaksamaan?", "A", [
    ("anggaran paling banyak Rp50.000 untuk buku dan pena", True, "Benar. «Paling banyak» adalah batasan, jadi dipakai pertidaksamaan.", "", "sptl_def"),
    ("2 buku dan 1 pena seharga Rp13.000, berapa harga masing-masing", False, "Harganya tepat, jadi dipakai persamaan.", "SMA10-M-B4-11", "spl_def"),
    ("tiga bola beratnya 1.550 g, berapa berat setiap bola", False, "Beratnya tepat, jadi dipakai persamaan.", "SMA10-M-B4-11", "spl_def"),
    ("jumlah dua bilangan 20 dan selisihnya 4", False, "Jumlah dan selisihnya tepat, jadi dipakai persamaan.", "SMA10-M-B4-11", "spl_def"),
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
    "Paket alat tulis": "5 buku 2 pensil Rp18.000; 1 buku 2 pensil Rp10.000",
    "Eksplorasi 4.1": "bola 2.500 g, 2.050 g, 1.550 g", "Tabel 4.1": "2x − y = −4; 3x − 2y = 1; 2x + 3y = 1",
    "Latihan 4.1": "tongkat 455 cm, 545 cm; minuman 4.700, 3.300, 2.800 ml; buah Rp130.000, Rp100.000, Rp50.000; empat model; beras Rp50.000, Rp91.000, Rp95.000",
    "Eksplorasi 4.2": "2 apel 5 jeruk < 1 kg; 6 apel 2 jeruk > 1 kg", "Eksplorasi 4.3": "Rp500.000, Rp20.000, Rp40.000, lebih dari 13 anak",
    "Latihan 4.2": "Bonar Rp15.000, Rp9.000, 10 jam, Rp120.000; Nova Rp100.000, Rp20.000, Rp10.000, 5 tanaman; telur Rp22.000, Rp30.000, Rp150.000, 6 kg; sabun Rp15.000, Rp10.000, Rp500.000, Rp2.500.000, 150 liter",
    "Uji Kompetensi": "paket alat tulis; deposito Rp100.000.000, 4%, 6%; tiket Rp640.000, Rp550.000, Rp450.000; buah 1,5 kg, 2 kg; bus 168 siswa 12 guru; 25x − 15y + 10z = 100; 3x + y < 10, x − 2y ≥ 5",
}
POST_ANGKA = {"PB1": "Rp58.000, Rp32.000", "PB2": "x + y + z = 9, 2x − y + z = 5, x + 2y − z = 4", "PB3": "x + 3y = 5, 2x + 6y = 10",
              "PB4": "2x − y = 3, 4x − 2y = 8", "PB5": "2x + y ≤ 8, x − y > 1", "PB6": "x + 2y ≥ 6",
              "PB7": "60 kursi, 20 kursi lipat", "PB8": "Rp30.000, Rp50.000, Rp300.000"}
cek(set(POST_ANGKA) == {s["ref"] for s in POST} and not set(POST_ANGKA.values()) & set(BUKU.values()))
for s in POST:
    cek(all(w in s["tanya"] for w in POST_ANGKA[s["ref"]].split(", ")), s["ref"])
cek(not any(w in s["tanya"] for s in POST for w in ("18.000", "10.000", "2.500", "2.050", "1.550", "455", "545", "130.000",
                                                   "500.000", "20.000", "40.000", "13 anak", "15.000", "9.000", "120.000",
                                                   "100.000", "150.000", "640.000", "3x − 2y = 1", "2x + 3y = 1", "2x − y = −4",
                                                   "3x + y < 10", "x − 2y ≥ 5")))


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
    # Kode miskonsepsi stays empty: no code is registered yet, and an unknown code fails the upload.
    lembar("Pilihan", ["Kode soal", "Pilihan", "Teks pilihan", "Benar", "Alasan", "Kode miskonsepsi"],
           [[s["ref"], "ABCD"[i], p[0], "Ya" if p[1] else "Tidak", p[2], ""] for s in S for i, p in enumerate(s["pilihan"])])
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
    tulis(os.path.join(here, "SMA10-Matematika-Bab4.xlsx"))
    tulis_miskonsepsi(os.path.join(here, "SMA10-Matematika-Bab4-miskonsepsi.csv"))
    halaman = sum(p["isi"].count("## ") for p in PELAJARAN)
    print(f"SMA10-Matematika-Bab4.xlsx: lessons {len(PELAJARAN)} ({halaman} pages), questions {len(S)} "
          f"(pre {len(PRE)}, post {len(POST)}, practice {len(LAT)}), answers "
          + " ".join(f"{h}={HURUF[h]}" for h in "ABCD"))
    print(f"SMA10-Matematika-Bab4-miskonsepsi.csv: {len(MISKONSEPSI)} codes")
    print(f"facts traced: {len(FAKTA)} (pages {min(h for h, _ in FAKTA.values())}-{max(h for h, _ in FAKTA.values())})")
    if "--kutipan" in sys.argv:
        ada, gambar = periksa_kutipan(sys.argv[sys.argv.index("--kutipan") + 1])
        print(f"quotations found in the book's text: {ada} of {len(FAKTA)}; figures read by eye: {', '.join(gambar) or 'none'}")
    print(f"assertions passed: {CEK[0]}")
