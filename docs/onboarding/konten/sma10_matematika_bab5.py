# SMA Kelas X, Matematika, Bab 5 "Persamaan dan Fungsi Kuadrat", as a PINTAR lesson workbook in the D-007
# template (sheets Kursus, Bab, Pelajaran, Soal, Pilihan; the column contract is KOLOM in
# src/lib/unggah-kontrak.ts). Built with the method of Bab 1 (LANA-19).
#
# Source: the student book "Matematika untuk SMA/MA/SMK/MAK Kelas X (Edisi Revisi)" (Dicky Susanto
# dkk.; Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi, 2023; ISBN 978-623-118-558-7),
# Bab 5, pp. 129-176. It has no numbered Contoh; its worked examples (the factorisations, the
# completed squares, the new-roots examples, Gambar 5.10, K-L-M) are checked here. Its Latihan and
# Uji Kompetensi have no keys, so every key here is ours, and every key is computed.
#
#   - Every number in a lesson, key or distractor is computed here and asserted: roots exactly
#     (Fractions; irrational roots checked in floating point), factorisations expanded back for a
#     range of x, vertices by −b/(2a), and every distractor's own value.
#   - Every definition and property is in FAKTA with its page and the book's words; `--kutipan`
#     checks the prose against the book's text. Formulas were read from the page images (the text
#     layer loses most formulas of this chapter), so formulas are proven by computation.
#   - Statements that are false or doubtful outside the book are kept out, and DILUAR asserts it.
#   - Notation: × and :, decimal comma, thousands point; «−» as minus; x², subscripts as x_{1};
#     roots as √5 and √(b² − 4ac); points as (1, −4); graphs and tables become value lines.
#     No LaTeX, HTML or tables; the book's tables become value lines.
#
# Run: python3 docs/onboarding/konten/sma10_matematika_bab5.py [--kutipan book.txt]
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




# A. Persamaan kuadrat (pp. 131-149)
fakta("persegi", 131, "Contoh sederhana dari penerapan persamaan kuadrat adalah menentukan sisi sebuah persegi jika diketahui luasnya, yaitu x2 = 16.")
fakta("pk_def", 133, "Persamaan kuadrat merupakan suatu persamaan matematika yang melibatkan bentuk kuadrat.")
fakta("pk_syarat", 133, "dengan a, b, dan c merupakan bilangan real dan a̸ = 0. Persamaan kuadrat tetap berlaku jika b atau c atau keduanya sama dengan nol.")
fakta("polinom", 133, "Persamaan kuadrat merupakan suatu polinom dengan pangkat tertinggi adalah 2.")
fakta("akar", 133, "Solusi persamaan kuadrat disebut juga sebagai akar-akar persamaan kuadrat.")
fakta("dua_bilangan", 133, "Perkalian dua bilangan adalah 63. Penjumlahannya adalah 16.")
fakta("kendaraan", 133, "Sebuah kendaraan menempuh jarak sejauh 320 km dengan kelajuan tertentu dalam waktu tertentu. Jika kendaraan melaju lebih cepat 24 km/jam daripada biasanya, maka waktu tempuhnya berkurang tiga jam untuk menempuh jarak yang sama.")
fakta("ubin", 136, "persamaan kuadrat x2 + 3x + 2 = 0 dapat dinyatakan dalam (x + 1)(x + 2) = 0")
fakta("bentuk_faktor", 137, "a(x −x1)(x −x2) jika dilakukan faktorisasi dengan x1 dan x2 merupakan dua solusi persamaan kuadrat")
fakta("koef_b", 138, "Jika a = 1 maka nilai b merupakan penjumlahan kedua faktor.")
fakta("contoh_b", 138, "9 −3b + 6 = 0 maka b = 5.")
fakta("nol_sembilan", 138, "Akar-akarnya adalah 0 dan 9.")
fakta("kali_ac", 141, "Kalikan 3 dengan -10")
fakta("tidak_semua", 142, "Catatan: Tidak semua persamaan kuadrat dapat diselesaikan dengan pemfaktoran.")
fakta("melengkapi", 144, "Melengkapi kuadrat sempurna adalah mengubah bentuk persamaan kuadrat ax2 + bx + c = 0 menjadi bentuk (x + m)2 = n")
fakta("x14", 144, "Suatu persamaan kuadrat berbentuk x2 + 14x = 32")
fakta("rumus", 145, "Persamaan kuadrat dapat diselesaikan dengan menggunakan rumus persamaan kuadrat.")
fakta("rumus_abc", 145, "x = −b ± √ b2 −4ac 2a")
fakta("jumlah_kali", 145, "hubungan antara penjumlahan kedua akar dengan koefisien-koefisien persamaan kuadrat, yaitu x1 + x2 = −b a.")
fakta("akar_baru", 146, "Persamaan kuadrat yang baru adalah Ax2 + 8Ax + 12A = 0 atau x2 + 8x + 12 = 0")
fakta("jenis_akar", 148, "Ada tiga jenis solusi persamaan kuadrat, yaitu solusi dengan dua akar real yang berbeda, solusi dengan akar real yang kembar (sama)")
fakta("diskriminan", 148, "Jika b2 −4ac = 0 maka akan diperoleh solusi persamaan kuadrat yang berupa akar real yang kembar (atau yang sama). Jika b2 −4ac bernilai positif maka akan diperoleh solusi persamaan kuadrat yang berupa dua nilai akar real berbeda.")
fakta("d_nama", 148, "Pernyataan matematika b2 −4ac disebut sebagai diskriminan (D).")
fakta("x248", 148, "Selesaikan x2 + 4x + 8 = 0")
# B. Fungsi kuadrat (pp. 149-166)
fakta("nonlinear", 149, "Fungsi kuadrat adalah salah satu fungsi nonlinear. Grafiknya tentu bukan merupakan garis lurus.")
fakta("tabel_x2", 151, "(-2,4), (-1,1), (0,0), (1,1), dan (2,4)")
fakta("arah", 154, "Berdasarkan Eksplorasi 5.6 kamu menemukan bahwa fungsi kuadrat terbuka ke atas jika")
fakta("sumbu_y", 154, "menentukan titik potong grafik dengan sumbu y.")
fakta("puncak", 157, "Vertex disebut juga sebagai titik puncak, dapat berupa titik maksimum atau titik minimum")
fakta("contoh_grafik", 157, "Titik-titik potong dengan sumbu x, yaitu (-1,0) dan")
fakta("sumbu_x_akar", 157, "Titik potong dengan sumbu x menunjukkan bahwa , artinya kamu mencari akar-akar persamaan kuadrat.")
fakta("d_titik", 158, "maka ada dua titik potong dengan sumbu x. (dua akar real berbeda) maka ada satu titik potong dengan sumbu x. (akar real kembar)")
fakta("tiga_titik", 161, "Kamu dapat menggunakan sistem persamaan tiga variabel untuk menentukan nilai")
fakta("klm", 161, "a = 1, b = −2, c = −3")
fakta("sumbu_simetri", 163, "Sumbu simetri adalah garis yang melalui titik puncak.")
fakta("tiga_bentuk", 163, "Berdasarkan eksplorasi kamu melihat ada tiga bentuk untuk menuliskan fungsi kuadrat.")
fakta("kawat", 165, "Panjang kawat adalah 96 m. Berapa luas maksimum yang dapat dibuat oleh petani?")
fakta("maksimum", 165, "Dua contoh di atas menunjukkan salah satu kegunaan fungsi kuadrat untuk dapat mengetahui nilai maksimum atau minimum.")
fakta("buku", 166, "Harga 1 buku diberikan oleh h = 900 −0, 25x")
# For the book-error record only (not used by any question)
fakta("pq_tanda", 146, "pq = −c/a = 3")
fakta("akar_baru_salah", 147, "x² + 4/21 x − 1/84 = 0")
fakta("imajiner", 148, "Jika b2 −4ac bernilai negatif maka akan diperoleh solusi persamaan kuadrat yang berupa dua nilai akar imajiner berbeda.")
fakta("imajiner_grafik", 158, "maka tidak ada titik potong dengan sumbu x. (dua akar imajiner)")
fakta("quadatrus", 133, "Istilah kuadrat berasal dari kata bahasa Latin, yaitu quadatrus, yang berarti membuat persegi.")
fakta("biaya_0", 159, "Biaya Produksi 0 500 400 500 800 1300 Jumlah 0 10 20 30 40 50")
fakta("pulpen", 169, "3000 rupiah 2000 2700 rupiah 1800 2400 rupiah 1600")
fakta("lat59", 164, "Fungsi kuadrat dengan titik puncak (2,6) dan melalui titik (1,7). Nyatakan fungsi kuadrat dalam ketiga bentuk.")
fakta("listrik", 131, "Jika biaya sebesar Rp1.467,28 per kWh untuk batas daya 1300 VA")
REKAMAN = {"pq_tanda", "akar_baru_salah", "imajiner", "imajiner_grafik", "quadatrus", "biaya_0", "pulpen", "lat59", "listrik"}
GAMBAR = {"pq_tanda", "akar_baru_salah"}     # pp. 146-147 are typeset as images; read by eye


def D(a, b, c):
    return F(b) ** 2 - 4 * F(a) * F(c)


def akar(a, b, c):
    """The real roots of ax² + bx + c = 0 when the discriminant is a perfect square (exact), else None."""
    d = D(a, b, c)
    if d < 0:
        return []
    n, m = d.numerator, d.denominator
    rn, rm = math.isqrt(n), math.isqrt(m)
    if rn * rn != n or rm * rm != m:
        return None
    r = F(rn, rm)
    return sorted({(-F(b) - r) / (2 * F(a)), (-F(b) + r) / (2 * F(a))})


def nilai(a, b, c, x):
    return F(a) * F(x) ** 2 + F(b) * F(x) + F(c)


def puncak(a, b, c):
    h = -F(b) / (2 * F(a))
    return h, nilai(a, b, c, h)


# ── What can be computed (every number the lessons use) ──
cek(akar(1, 0, -16) == [-4, 4])                                                              # x² = 16: sisi 4
cek(akar(1, -16, 63) == [7, 9] and 7 * 9 == 63 and 7 + 9 == 16)
cek(akar(1, 3, 2) == [-2, -1] and nilai(1, 3, 2, -1) == 0 and nilai(1, 3, 2, -2) == 0)
cek(all(nilai(1, 6, 8, x) == (x + 2) * (x + 4) for x in range(-9, 9)) and 2 * 4 == 8 and 2 + 4 == 6)
cek(all(nilai(2, 7, 6, x) == (2 * x + 3) * (x + 2) for x in range(-9, 9)) and 2 * 2 + 1 * 3 == 7)
cek(3 * -10 == -30 and 15 * -2 == -30 and 15 - 2 == 13 and all(nilai(3, 13, -10, x) == (3 * x - 2) * (x + 5) for x in range(-9, 9)))
cek(akar(3, 13, -10) == [-5, F(2, 3)])
cek(9 - 3 * 5 + 6 == 0 and akar(1, 5, 6) == [-3, -2])                                           # root −3, b = 5
cek(akar(2, -18, 0) == [0, 9] and all(nilai(2, -18, 0, x) == 2 * x * (x - 9) for x in range(-9, 9)))
cek(akar(1, -2, -3) == [-1, 3] and akar(2, 5, -3) == [-3, F(1, 2)])
# Lesson 3: completing the square
cek(akar(1, 4, 2) is None and D(1, 4, 2) == 8 and all(nilai(1, 4, 2, x) == (x + 2) ** 2 - 2 for x in range(-9, 9)))
cek(akar(2, 8, -10) == [-5, 1] and akar(1, 4, -5) == [-5, 1] and 5 + 4 == 9)
cek(abs((-2 + math.sqrt(2)) ** 2 + 4 * (-2 + math.sqrt(2)) + 2) < 1e-12 and abs((-2 - math.sqrt(2)) ** 2 + 4 * (-2 - math.sqrt(2)) + 2) < 1e-12)
cek(F(14, 2) ** 2 == 49 and 32 + 49 == 81 and akar(1, 14, -32) == [-16, 2])
# Lesson 4: the formula, the discriminant, sums and products
cek(D(1, 24, -2560) == 10816 == 104 ** 2 and akar(1, 24, -2560) == [-64, 40])
cek(F(320, 40) - F(320, 64) == 3 and 40 + 24 == 64 and 320 * 24 == 3 * 40 * 64)                  # the vehicle checks out
cek(D(1, 4, 8) == -16 and akar(1, 4, 8) == [])
cek(akar(1, 4, 3) == [-3, -1] and akar(1, 8, 12) == [-6, -2] and [2 * r for r in akar(1, 4, 3)] == akar(1, 8, 12))
cek(F(-4, 1) == -3 + -1 and F(3, 1) == (-3) * (-1))
# Lesson 5: the graph
cek([nilai(1, 0, 0, x) for x in (-2, -1, 0, 1, 2)] == [4, 1, 0, 1, 4])
cek(akar(1, -2, -3) == [-1, 3] and nilai(1, -2, -3, 0) == -3 and puncak(1, -2, -3) == (1, -4))
cek(D(1, -2, -3) == 16 and F(16, -4 * 1) == -4 == puncak(1, -2, -3)[1])                                              # k = D/(−4a)
cek(all(nilai(1, -2, -3, x) == (x + 1) * (x - 3) == (x - 1) ** 2 - 4 for x in range(-9, 9)))
cek(all(nilai(1, -2, -3, 1 - t) == nilai(1, -2, -3, 1 + t) for t in range(0, 9)))              # symmetric about x = 1
# Lesson 6: constructing and maximising
KLM_A, KLM_B = [[1, -1, 1], [0, 0, 1], [1, 1, 1]], [0, -3, -4]
cek(nilai(1, -2, -3, -1) == 0 and nilai(1, -2, -3, 0) == -3 and nilai(1, -2, -3, 1) == -4)
cek(-3 == 1 * (0 - 1) ** 2 - 4)
# Kawat 96 m, three pens of width x and depth y: 6x + 4y = 96, L = 3xy = 72x − 4,5x².
cek(all(3 * F(x) * (24 - F(3, 2) * x) == 72 * F(x) - F(9, 2) * F(x) ** 2 for x in range(0, 17)))
cek(puncak(-F(9, 2), 72, 0) == (8, 288) and 24 - F(3, 2) * 8 == 12 and 6 * 8 + 4 * 12 == 96 and 3 * 8 * 12 == 288)
cek(max(3 * F(x, 10) * (24 - F(3, 2) * F(x, 10)) for x in range(0, 161)) == 288)
# Buku: R = x(900 − 0,25x) = 900x − 0,25x², maximum at x = 1.800.
cek(puncak(-F(1, 4), 900, 0) == (1800, 810000) and 900 - F(1, 4) * 1800 == 450 and 1800 * 450 == 810000)
# BOOK INCONSISTENCIES (checked here, kept out of lessons and questions):
# p. 146: «pq = −c/a = 3»; the product is c/a (for x² + 4x + 3 it is +3 = c/a, and −c/a = −3).
cek(F(3, 1) == (-3) * (-1) and -F(3, 1) != 3)
# pp. 146-147: new roots 1/(2p), 1/(2q) of x² + 4x − 21 = 0 (p, q = 3, −7). The book takes
# pq = 21 and ends with x² + 4/21 x − 1/84 = 0; the sum is 2/21 and the product −1/84, so the
# equation is x² − 2/21 x − 1/84 = 0.
P_, Q_ = akar(1, 4, -21)
cek((P_, Q_) == (-7, 3) and P_ * Q_ == -21)
cek(1 / (2 * P_) + 1 / (2 * Q_) == F(2, 21) and 1 / (2 * P_) * (1 / (2 * Q_)) == -F(1, 84))
cek(all(nilai(1, -F(2, 21), -F(1, 84), r) == 0 for r in (1 / (2 * P_), 1 / (2 * Q_))))
cek(nilai(1, F(4, 21), -F(1, 84), 1 / (2 * Q_)) != 0)                                           # the book's equation misses
# p. 159, Latihan 5.8 no. 4: costs 0, 500, 400, 500, 800, 1.300 for 0-50 items are not quadratic;
# symmetry about 20 needs 800 at 0 (then second differences are all 200).
BIAYA = [0, 500, 400, 500, 800, 1300]
cek(len({BIAYA[i + 2] - 2 * BIAYA[i + 1] + BIAYA[i] for i in range(4)}) > 1)
BIAYA8 = [800] + BIAYA[1:]
cek({BIAYA8[i + 2] - 2 * BIAYA8[i + 1] + BIAYA8[i] for i in range(4)} == {200})
# p. 169, Uji Kompetensi 6: J(p) = 2p/3 rises with the price, so the profit (p − 2.000) × 2p/3
# opens upward and has no maximum.
cek(F(2000, 3000) == F(1800, 2700) == F(1600, 2400) == F(2, 3) and puncak(F(2, 3), -F(4000, 3), 0)[0] == 1000)
# p. 164, Latihan 5.9 no. 1: vertex (2, 6) through (1, 7) gives x² − 4x + 10 with D = −24 < 0,
# so it has no factor form a(x − p)(x − q) with real p and q.
cek(nilai(1, -4, 10, 1) == 7 and puncak(1, -4, 10) == (2, 6) and D(1, -4, 10) == -24)
# The Latihan and Uji items behave (checked, not used):
cek(akar(2, -11, -6) == [-F(1, 2), 6] and akar(3, -17, -6) == [-F(1, 3), 6] and akar(2, -3, -90) == [-6, F(15, 2)])
cek(akar(2, -8, 6) == [1, 3] and akar(2, 0, -18) == [-3, 3] and akar(2, -5, -18) == [-2, F(9, 2)])
cek(akar(1, -84, 864) == [12, 72] and F(1, 72 - 36) + F(1, 72) == F(1, 24))                    # pipa B: 72 menit
cek(akar(1, -1, -600) == [-24, 25] and akar(1, -5, -14) == [-2, 7])
cek(puncak(-F(3, 10000), F(9, 100), 0) == (150, F(27, 4)) and akar(-F(3, 10000), F(9, 100), 0) == [0, 300])

SUMBER = ("_Diadaptasi dari Matematika untuk SMA/MA/SMK/MAK Kelas X (Edisi Revisi), Dicky Susanto dkk., "
          "Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi, 2023, Bab 5._")

KURSUS = {
    "Judul kursus*": "Matematika Kelas X · Bab 5: Persamaan dan Fungsi Kuadrat",
    "Mata pelajaran*": "Matematika",
    "Jenjang*": "SMA",
    "Kelas*": "Kelas X",
    "Konteks": "Akademik",
}

BAB = [(1, "Persamaan dan Fungsi Kuadrat")]

PELAJARAN = [
    dict(no=1, judul="Persamaan Kuadrat",
         ringkasan="Persamaan kuadrat berbentuk ax² + bx + c = 0 dengan a ≠ 0; penyelesaiannya disebut akar-akar persamaan kuadrat.",
         tujuan="Kamu dapat mengenali persamaan kuadrat dan merumuskan masalah sehari-hari sebagai persamaan kuadrat.",
         bloom="Memahami",
         isi="""## Bentuk umum

**Persamaan kuadrat** adalah persamaan yang dapat ditulis dalam bentuk

ax² + bx + c = 0

dengan a, b, dan c bilangan real dan a ≠ 0. Persamaan itu tetap persamaan kuadrat jika b atau c atau keduanya sama dengan nol, misalnya x² − 16 = 0 atau 2x² − 18x = 0. Persamaan kuadrat adalah polinom dengan pangkat tertinggi 2.

Penyelesaian persamaan kuadrat disebut **akar-akar** persamaan kuadrat.

## Mengenali persamaan kuadrat

- 3x² + 2x − 1 = 0 → persamaan kuadrat (a = 3, b = 2, c = −1)
- x² − 16 = 0 → persamaan kuadrat (b = 0)
- x³ + x² + x = 0 → bukan, karena pangkat tertingginya 3
- 2x + 5 = 0 → bukan, karena tidak ada suku x² (a = 0)

## Dari masalah ke persamaan

**Sisi persegi.** Luas sebuah persegi 16 m². Berapa panjang sisinya? Jika sisinya x, maka x² = 16. Persamaan ini dipenuhi oleh x = 4 dan x = −4, tetapi panjang sisi positif, jadi sisinya **4 m**.

**Dua bilangan.** Hasil kali dua bilangan 63 dan jumlahnya 16. Berapa kedua bilangan itu? Misalkan bilangan pertama x; bilangan kedua 16 − x, sehingga x(16 − x) = 63, atau

x² − 16x + 63 = 0

Periksa x = 7: 49 − 112 + 63 = 0. Kedua bilangan itu **7 dan 9**, karena 7 × 9 = 63 dan 7 + 9 = 16.

## Menjabarkan

Perkalian dua bentuk linear menghasilkan bentuk kuadrat. Contoh:

(x + 2)(x + 3) = x² + 3x + 2x + 6 = x² + 5x + 6

Setiap suku di kurung pertama dikalikan dengan setiap suku di kurung kedua.

""" + SUMBER),
    dict(no=2, judul="Menyelesaikan dengan Faktorisasi",
         ringkasan="Jika ax² + bx + c dapat ditulis sebagai hasil kali dua faktor, akar-akarnya diperoleh dengan membuat setiap faktor bernilai nol.",
         tujuan="Kamu dapat menyelesaikan persamaan kuadrat dengan faktorisasi.",
         bloom="Menerapkan",
         isi="""## Faktor dan akar

Ubin aljabar x², x, dan 1 untuk x² + 3x + 2 dapat disusun menjadi persegi panjang bersisi (x + 1) dan (x + 2). Jadi

x² + 3x + 2 = 0 dapat dinyatakan dalam (x + 1)(x + 2) = 0

Hasil kali dua bilangan bernilai nol jika sedikitnya satu bilangan itu nol: x + 1 = 0 atau x + 2 = 0. Akar-akarnya **x = −1 dan x = −2**.

Secara umum, jika x_{1} dan x_{2} akar-akarnya, maka ax² + bx + c = a(x − x_{1})(x − x_{2}).

## Jika a = 1

Cari dua bilangan yang hasil kalinya c dan jumlahnya b.

- x² + 6x + 8: 2 × 4 = 8 dan 2 + 4 = 6, jadi (x + 2)(x + 4).
- x² − 2x − 3: 1 × (−3) = −3 dan 1 + (−3) = −2, jadi (x + 1)(x − 3), dengan akar −1 dan 3.

**Contoh.** Diketahui −3 adalah akar x² + bx + 6 = 0. Tentukan b dan akar lainnya. Substitusi x = −3: 9 − 3b + 6 = 0, jadi b = 5. Maka x² + 5x + 6 = (x + 3)(x + 2) = 0, dan akar lainnya **−2**.

## Jika a ≠ 1

Selesaikan 3x² + 13x − 10 = 0.

1. Kalikan a dengan c: 3 × (−10) = −30.
2. Cari dua bilangan yang hasil kalinya −30 dan jumlahnya 13: 15 dan −2.
3. Pecah suku tengah: 3x² + 15x − 2x − 10 = 3x(x + 5) − 2(x + 5) = (3x − 2)(x + 5).
4. Akar-akarnya **x = 2/3 dan x = −5**.

## Faktor persekutuan

Jika c = 0, keluarkan x: 2x² − 18x = 2x(x − 9) = 0, jadi akar-akarnya **0 dan 9**. Jangan membagi kedua ruas dengan x, karena akar x = 0 akan hilang.

Tidak semua persamaan kuadrat dapat diselesaikan dengan pemfaktoran. Untuk persamaan seperti itu dipakai cara pada pelajaran berikutnya.

""" + SUMBER),
    dict(no=3, judul="Melengkapi Kuadrat Sempurna",
         ringkasan="Persamaan kuadrat diubah menjadi bentuk (x + m)² = n, lalu kedua ruas diakarkan.",
         tujuan="Kamu dapat menyelesaikan persamaan kuadrat dengan melengkapi kuadrat sempurna.",
         bloom="Menerapkan",
         isi="""## Gagasannya

**Melengkapi kuadrat sempurna** adalah mengubah persamaan kuadrat menjadi bentuk (x + m)² = n. Kuncinya:

(x + m)² = x² + 2mx + m²

Jadi pada x² + bx, bilangan yang perlu ditambahkan adalah (b/2)².

## Contoh: x² + 14x = 32

Pada gambar luas, x² + 14x adalah persegi x × x dan dua persegi panjang 7 × x. Untuk melengkapinya menjadi persegi, tambahkan persegi 7 × 7 = 49 di kedua ruas:

1. x² + 14x + 49 = 32 + 49, jadi (x + 7)² = 81.
2. x + 7 = 9 atau x + 7 = −9.
3. Akar-akarnya **x = 2 dan x = −16**.

Ingat: akar kuadrat dari 81 adalah 9 **dan** −9, karena keduanya jika dikuadratkan menghasilkan 81.

## Contoh: x² + 4x + 2 = 0

Persamaan ini sulit difaktorkan.

1. Pindahkan c: x² + 4x = −2.
2. Tambahkan (4/2)² = 4 di kedua ruas: x² + 4x + 4 = 2, jadi (x + 2)² = 2.
3. x + 2 = √2 atau x + 2 = −√2, jadi **x = −2 + √2 atau x = −2 − √2**.

## Jika a ≠ 1

Bagi dahulu kedua ruas dengan a, supaya koefisien x² menjadi 1. Contoh: 2x² + 8x − 10 = 0 menjadi x² + 4x − 5 = 0, lalu x² + 4x + 4 = 9, (x + 2)² = 9, dan x = 1 atau x = −5.

""" + SUMBER),
    dict(no=4, judul="Rumus Kuadrat dan Diskriminan",
         ringkasan="Akar-akar ax² + bx + c = 0 adalah x = (−b ± √(b² − 4ac))/(2a); diskriminan D = b² − 4ac menentukan jenis akarnya.",
         tujuan="Kamu dapat memakai rumus kuadrat, menentukan jenis akar dengan diskriminan, dan memakai jumlah serta hasil kali akar.",
         bloom="Menerapkan",
         isi="""## Rumus kuadrat

Melengkapi kuadrat sempurna pada ax² + bx + c = 0 secara umum menghasilkan rumus

x = (−b ± √(b² − 4ac))/(2a)

**Contoh: kelajuan kendaraan.** Sebuah kendaraan menempuh 320 km. Jika melaju 24 km/jam lebih cepat, waktunya berkurang 3 jam. Berapa kelajuan mula-mula v? Dari 320/v − 320/(v + 24) = 3 diperoleh v² + 24v − 2.560 = 0.

1. a = 1, b = 24, c = −2.560; b² − 4ac = 576 + 10.240 = 10.816 = 104².
2. v = (−24 + 104)/2 = 40 atau v = (−24 − 104)/2 = −64.
3. Kelajuan tidak negatif, jadi v = **40 km/jam**. Periksa: 320 : 40 = 8 jam dan 320 : 64 = 5 jam, selisihnya 3 jam.

## Diskriminan

Bilangan D = b² − 4ac disebut **diskriminan**. Nilainya menentukan jenis akar:

- D > 0 → dua akar real yang berbeda
- D = 0 → akar real kembar (sama)
- D < 0 → tidak ada akar real, karena √D tidak real

Contoh: x² + 4x + 8 = 0 mempunyai D = 16 − 32 = −16 < 0, jadi tidak mempunyai akar real.

## Jumlah dan hasil kali akar

Jika x_{1} dan x_{2} akar-akar ax² + bx + c = 0, maka

- x_{1} + x_{2} = −b/a
- x_{1} × x_{2} = c/a

Contoh: x² + 4x + 3 = 0 mempunyai akar −1 dan −3; jumlahnya −4 = −4/1 dan hasil kalinya 3 = 3/1.

## Menyusun persamaan kuadrat baru

Akar-akar x² + 4x + 3 = 0 adalah p dan q. Susun persamaan kuadrat yang akar-akarnya 2p dan 2q.

1. p + q = −4 dan pq = 3.
2. Akar baru: 2p + 2q = 2(p + q) = −8 dan 2p × 2q = 4pq = 12.
3. Persamaan dengan jumlah akar −8 dan hasil kali 12 adalah x² − (−8)x + 12 = 0, yaitu **x² + 8x + 12 = 0**.

Periksa: akar x² + 8x + 12 = 0 adalah −2 dan −6, dua kali −1 dan −3.

""" + SUMBER),
    dict(no=5, judul="Grafik Fungsi Kuadrat",
         ringkasan="Grafik f(x) = ax² + bx + c adalah parabola; a menentukan arah terbukanya, c titik potong dengan sumbu y, dan D banyak titik potong dengan sumbu x.",
         tujuan="Kamu dapat menentukan arah terbuka, titik potong, sumbu simetri, dan titik puncak grafik fungsi kuadrat.",
         bloom="Menerapkan",
         isi="""## Parabola

Fungsi kuadrat f(x) = ax² + bx + c dengan a ≠ 0 adalah fungsi nonlinear; grafiknya bukan garis lurus, melainkan **parabola**. Contoh f(x) = x²:

- x = −2 → f(x) = 4
- x = −1 → f(x) = 1
- x = 0 → f(x) = 0
- x = 1 → f(x) = 1
- x = 2 → f(x) = 4

Grafiknya melalui (−2, 4), (−1, 1), (0, 0), (1, 1), dan (2, 4), dengan titik terendah (0, 0).

## Peran a, c, dan D

- a > 0 → parabola terbuka ke atas dan mempunyai titik minimum; a < 0 → terbuka ke bawah dan mempunyai titik maksimum.
- Titik potong dengan sumbu y adalah (0, c), karena f(0) = c.
- Titik potong dengan sumbu x adalah akar-akar f(x) = 0. Banyaknya ditentukan D = b² − 4ac: dua titik jika D > 0, satu titik jika D = 0, dan tidak ada jika D < 0.

## Sumbu simetri dan titik puncak

**Sumbu simetri** adalah garis tegak yang melalui titik puncak:

x = −b/(2a)

**Titik puncak** adalah titik minimum atau maksimum, (−b/(2a), f(−b/(2a))). Ordinatnya juga dapat dihitung dengan D/(−4a).

## Contoh: f(x) = x² − 2x − 3

- a = 1 > 0 → terbuka ke atas
- titik potong dengan sumbu y → (0, −3)
- x² − 2x − 3 = (x + 1)(x − 3) = 0 → titik potong dengan sumbu x (−1, 0) dan (3, 0)
- sumbu simetri → x = −(−2)/(2 × 1) = 1
- titik puncak (minimum) → (1, f(1)) = (1, −4); periksa: D/(−4a) = 16/(−4) = −4

## Tiga bentuk fungsi kuadrat

- bentuk umum: f(x) = ax² + bx + c
- bentuk titik potong dengan sumbu x di (p, 0) dan (q, 0): f(x) = a(x − p)(x − q)
- bentuk titik puncak (h, k): f(x) = a(x − h)² + k

Fungsi pada contoh dapat ditulis x² − 2x − 3 = (x + 1)(x − 3) = (x − 1)² − 4.

""" + SUMBER),
    dict(no=6, judul="Mengonstruksi Fungsi Kuadrat dan Nilai Optimum",
         ringkasan="Fungsi kuadrat dapat disusun dari tiga titik atau dari titik puncaknya; titik puncak memberi nilai maksimum atau minimum dalam masalah sehari-hari.",
         tujuan="Kamu dapat menyusun fungsi kuadrat dari informasi grafiknya dan menentukan nilai maksimum atau minimum dalam masalah.",
         bloom="Menerapkan",
         isi="""## Dari tiga titik

Carilah fungsi kuadrat yang grafiknya melalui K(−1, 0), L(0, −3), dan M(1, −4).

**Cara 1: sistem persamaan.** Substitusi setiap titik ke f(x) = ax² + bx + c:

- K(−1, 0) → a − b + c = 0
- L(0, −3) → c = −3
- M(1, −4) → a + b + c = −4

Selesaikan: a = 1, b = −2, c = −3, jadi **f(x) = x² − 2x − 3**.

**Cara 2: titik puncak.** Jika diketahui M(1, −4) adalah titik puncaknya, maka f(x) = a(x − 1)² − 4. Substitusi L(0, −3): −3 = a(0 − 1)² − 4, jadi a = 1 dan f(x) = (x − 1)² − 4 = x² − 2x − 3.

## Contoh: luas maksimum

Seorang petani memagari tiga petak berdampingan yang masing-masing selebar x m dan sedalam y m dengan kawat sepanjang 96 m. Berapa luas maksimumnya?

1. Kawat dipakai untuk dua sisi panjang 3x dan empat sisi y: 6x + 4y = 96, jadi y = 24 − 1,5x.
2. Luas L = 3x × y = 3x(24 − 1,5x) = 72x − 4,5x².
3. a = −4,5 < 0, jadi ada nilai maksimum di x = −72/(2 × (−4,5)) = 8.
4. y = 24 − 12 = 12, dan L = 3 × 8 × 12 = **288 m²**.

## Contoh: pendapatan maksimum

Harga sebuah buku h = 900 − 0,25x rupiah jika x buku diproduksi, dan pendapatannya R = hx. Berapa buku yang harus diproduksi agar pendapatannya maksimum?

1. R = x(900 − 0,25x) = 900x − 0,25x².
2. a < 0, jadi maksimum di x = −900/(2 × (−0,25)) = **1.800 buku**.
3. Harganya 900 − 450 = 450 rupiah, dan R = 1.800 × 450 = **Rp810.000**.

## Rangkuman Bab 5

- Persamaan kuadrat ax² + bx + c = 0 (a ≠ 0) diselesaikan dengan faktorisasi, melengkapi kuadrat sempurna, atau rumus x = (−b ± √(b² − 4ac))/(2a).
- D = b² − 4ac: dua akar real berbeda jika D > 0, akar kembar jika D = 0, tidak ada akar real jika D < 0.
- x_{1} + x_{2} = −b/a dan x_{1} × x_{2} = c/a.
- Grafik f(x) = ax² + bx + c: terbuka ke atas jika a > 0, ke bawah jika a < 0; memotong sumbu y di (0, c); sumbu simetri x = −b/(2a).
- Titik puncak memberi nilai minimum (a > 0) atau maksimum (a < 0).

""" + SUMBER),
]

# Statements that are false or doubtful outside the book, or book errors, stay out of the lessons.
DILUAR = ("imajiner", "quadatrus", "1.467,28", "4/21", "1/84", "pq = −c/a", "0, 500, 400", "Babilonia")
for _p in PELAJARAN:
    cek(3 <= _p["isi"].count("\n## ") + _p["isi"].startswith("## ") <= 6, f"lesson {_p['no']}: 3-6 pages")
    cek(_p["isi"].rstrip().endswith(SUMBER), f"lesson {_p['no']}: attribution last")
    cek(_p["isi"].count("Coba pikirkan") <= 1, f"lesson {_p['no']}: at most one Coba pikirkan")
    cek(not any(w in _p["isi"] for w in DILUAR), f"lesson {_p['no']}: {[w for w in DILUAR if w in _p['isi']]}")
    cek(not re.search(r"\bsalah\b", _p["isi"]), f"lesson {_p['no']}: «salah»")
    notasi(_p["isi"], f"lesson {_p['no']}")
    notasi(_p["ringkasan"], f"lesson {_p['no']} ringkasan")
# The product of the roots is c/a (p. 146 prints −c/a); lesson 4 states it once.
cek(sum(_p["isi"].count("x_{1} × x_{2} = c/a") for _p in PELAJARAN) == 2)

# ── Misconceptions: the book has no Miskonsepsi section; these come from the distractors.
MISKONSEPSI = {
    "SMA10-M-B5-01": ("Bentuk persamaan kuadrat tidak dikenali",
                      "Persamaan berpangkat tiga, tanpa suku x², atau dengan x di penyebut dianggap persamaan kuadrat.",
                      "Periksa bentuk ax² + bx + c = 0: pangkat tertinggi 2 dan a ≠ 0."),
    "SMA10-M-B5-02": ("Tanda akar dari faktor terbalik",
                      "Dari faktor (x + 3), akarnya ditulis 3, bukan −3.",
                      "Buat faktor bernilai nol: x + 3 = 0 berarti x = −3."),
    "SMA10-M-B5-03": ("Faktorisasi hanya memeriksa hasil kali",
                      "Dipilih dua bilangan dengan hasil kali c, tetapi jumlahnya tidak sama dengan b.",
                      "Periksa kedua syarat, lalu jabarkan kembali faktornya."),
    "SMA10-M-B5-04": ("Koefisien a atau akar nol terlupa",
                      "Koefisien a diabaikan saat memfaktorkan, atau kedua ruas dibagi x sehingga akar 0 hilang.",
                      "Jabarkan kembali faktornya; keluarkan x sebagai faktor, jangan membagi dengan x."),
    "SMA10-M-B5-05": ("Melengkapi kuadrat keliru",
                      "Yang ditambahkan b² atau b/2, bukan (b/2)², atau hanya satu ruas yang ditambah.",
                      "Tulis (x + m)² = x² + 2mx + m², lalu tambahkan m² di kedua ruas."),
    "SMA10-M-B5-06": ("Akar kuadrat hanya positif",
                      "Dari (x + m)² = n hanya diambil akar positif, sehingga satu akar hilang.",
                      "Ingat ±: x + m = √n atau x + m = −√n."),
    "SMA10-M-B5-07": ("Rumus kuadrat keliru",
                      "Tanda −b terlupa, b² − 4ac ditulis b² + 4ac, atau hanya √D yang dibagi 2a.",
                      "Tulis rumus lengkap dengan kurung: (−b ± √(b² − 4ac))/(2a)."),
    "SMA10-M-B5-08": ("Diskriminan keliru dihitung",
                      "Tanda pada −4ac keliru, atau b tidak dikuadratkan.",
                      "Hitung b² dan 4ac terpisah, lalu kurangkan."),
    "SMA10-M-B5-09": ("Jenis akar dari D tertukar",
                      "D = 0, D > 0, dan D < 0 dipasangkan dengan jenis akar yang keliru.",
                      "Ingat √D dalam rumus: √D real dan bukan nol memberi dua akar, √0 memberi satu akar kembar."),
    "SMA10-M-B5-10": ("Jumlah dan hasil kali akar keliru",
                      "Tanda −b/a dan c/a tertukar, atau jumlah dan hasil kali tertukar.",
                      "Periksa dengan contoh: x² − 5x + 6 = (x − 2)(x − 3), jumlahnya 5 dan hasil kalinya 6."),
    "SMA10-M-B5-11": ("Arah parabola dibaca dari b atau c",
                      "Arah terbuka parabola ditentukan dari tanda b, c, atau D, bukan dari a.",
                      "Hanya tanda a yang menentukan: a > 0 ke atas, a < 0 ke bawah."),
    "SMA10-M-B5-12": ("Sumbu simetri atau titik puncak keliru",
                      "Dipakai −b/a atau b/(2a), atau ordinat puncak diambil dari c.",
                      "Hitung h = −b/(2a), lalu substitusikan h ke f(x) untuk mendapat k."),
    "SMA10-M-B5-13": ("Titik potong sumbu x dan sumbu y tertukar",
                      "Titik (0, c) dianggap titik potong dengan sumbu x, atau koordinatnya dibalik.",
                      "Sumbu y: x = 0, jadi (0, c). Sumbu x: f(x) = 0, jadi (akar, 0)."),
    "SMA10-M-B5-14": ("Model atau penjabaran keliru",
                      "Hubungan dalam masalah ditulis linear, tandanya tertukar, atau perkalian kurung tidak lengkap.",
                      "Tulis arti variabel, lalu kalikan setiap suku di kurung pertama dengan setiap suku di kurung kedua."),
    "SMA10-M-B5-15": ("Syarat masalah optimum terlupa",
                      "Nilai maksimum dihitung tanpa memakai hubungan antarukuran, sehingga ukurannya tidak mungkin.",
                      "Nyatakan semua ukuran dengan satu variabel sebelum mencari titik puncak."),
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




# ── Pemetaan awal (pre-test): recognising, factorising, a discriminant, the y-intercept.
soal("PA1", 1, "Manakah yang merupakan persamaan kuadrat?", "A", [
    ("3x² − 2x + 1 = 0", True, "Benar. Bentuknya ax² + bx + c = 0 dengan a = 3 ≠ 0.", "", "pk_syarat"),
    ("x³ + 2x² − 4 = 0", False, "Pangkat tertingginya 3, jadi bukan persamaan kuadrat.", "SMA10-M-B5-01", "polinom"),
    ("2x + 5 = 0", False, "Tidak ada suku x² (a = 0); ini persamaan linear.", "SMA10-M-B5-01", "pk_syarat"),
    ("1/x + x = 3", False, "Ada x di penyebut, jadi bentuknya bukan ax² + bx + c = 0.", "SMA10-M-B5-01", "pk_def"),
], guna="Pemetaan awal")
cek(akar(1, -5, 6) == [2, 3] and 1 * 6 == 6 and 1 + 6 == 7 and nilai(1, -5, 6, 5) == 6)
soal("PA2", 2, "Akar-akar persamaan x² − 5x + 6 = 0 adalah ...", "B", [
    ("2 dan 3", True, "Benar. x² − 5x + 6 = (x − 2)(x − 3) = 0, jadi x = 2 atau x = 3.", "", "=ubin"),
    ("−2 dan −3", False, "Dari faktor (x − 2) dan (x − 3), akarnya ditulis dengan tanda terbalik. x − 2 = 0 berarti x = 2.", "SMA10-M-B5-02", "=ubin"),
    ("1 dan 6", False, "Hasil kalinya 6, tetapi jumlahnya 1 + 6 = 7, bukan 5.", "SMA10-M-B5-03", "=koef_b"),
    ("5 dan 6", False, "Itu jumlah dan hasil kali akar (−b/a = 5 dan c/a = 6), bukan akarnya. Untuk x = 5: 25 − 25 + 6 = 6, bukan 0.", "SMA10-M-B5-10", "=jumlah_kali"),
], guna="Pemetaan awal")
cek(D(1, 2, 5) == -16 and 4 + 20 == 24 and 2 - 20 == -18)
soal("PA3", 4, "Nilai diskriminan persamaan x² + 2x + 5 = 0 adalah ...", "C", [
    ("−16", True, "Benar. D = b² − 4ac = 2² − 4 × 1 × 5 = 4 − 20 = −16.", "", "=d_nama"),
    ("24", False, "4ac ditambahkan (4 + 20). D = b² − 4ac.", "SMA10-M-B5-08", "=d_nama"),
    ("16", False, "Tanda hasilnya terlupa: 4 − 20 = −16.", "SMA10-M-B5-08", "=d_nama"),
    ("−18", False, "b tidak dikuadratkan (2 − 20). b² = 4.", "SMA10-M-B5-08", "=d_nama"),
], guna="Pemetaan awal")
cek(nilai(1, -4, 3, 0) == 3 and akar(1, -4, 3) == [1, 3])
soal("PA4", 5, "Grafik y = x² − 4x + 3 memotong sumbu y di titik ...", "D", [
    ("(0, 3)", True, "Benar. Pada sumbu y, x = 0, dan y = 0 − 0 + 3 = 3.", "", "=sumbu_y"),
    ("(3, 0)", False, "Koordinatnya terbalik. Titik pada sumbu y mempunyai x = 0.", "SMA10-M-B5-13", "=sumbu_y"),
    ("(0, −4)", False, "−4 adalah koefisien b. Titik potong dengan sumbu y adalah (0, c).", "SMA10-M-B5-13", "=sumbu_y"),
    ("(1, 0)", False, "Itu titik potong dengan sumbu x, karena x² − 4x + 3 = (x − 1)(x − 3).", "SMA10-M-B5-13", "=sumbu_x_akar"),
], guna="Pemetaan awal")

# ── Cek penguasaan (post-test): every lesson; fresh numbers, no Latihan or Uji Kompetensi item
# and no worked example of the book with its numbers barely changed.
cek(akar(1, 3, -40) == [-8, 5] and 5 * (5 + 3) == 40)
soal("PB1", 1, "Panjang sebuah persegi panjang 3 cm lebih dari lebarnya, dan luasnya 40 cm². Jika lebarnya x cm, persamaan yang tepat adalah ...", "B", [
    ("x² + 3x − 40 = 0", True, "Benar. x(x + 3) = 40, jadi x² + 3x − 40 = 0. Lebarnya 5 cm, karena 5 × 8 = 40.", "", "=pk_def"),
    ("x² + 3x + 40 = 0", False, "40 dipindahkan ke ruas kiri tanpa mengubah tandanya.", "SMA10-M-B5-14", "=pk_def"),
    ("2x + 3 = 40", False, "Lebar dan panjang dijumlahkan, padahal luas adalah hasil kali panjang dan lebar.", "SMA10-M-B5-14", "=pk_def"),
    ("x² + 3 = 40", False, "x(x + 3) dijabarkan menjadi x² + 3, padahal x(x + 3) = x² + 3x.", "SMA10-M-B5-14", "=pk_def"),
], guna="Cek penguasaan", sulit="Sedang")
cek(akar(2, 1, -6) == [-2, F(3, 2)] and all(nilai(2, 1, -6, x) == (2 * x - 3) * (x + 2) for x in range(-5, 6)))
cek(akar(1, -1, -6) == [-2, 3] and akar(1, 1, -6) == [-3, 2])
soal("PB2", 2, "Akar-akar persamaan 2x² + x − 6 = 0 adalah ...", "C", [
    ("3/2 dan −2", True, "Benar. 2x² + x − 6 = (2x − 3)(x + 2) = 0, jadi x = 3/2 atau x = −2.", "", "=bentuk_faktor"),
    ("−3/2 dan 2", False, "Tandanya terbalik. 2x − 3 = 0 berarti x = 3/2, dan x + 2 = 0 berarti x = −2.", "SMA10-M-B5-02", "=bentuk_faktor"),
    ("3 dan −2", False, "Koefisien 2 diabaikan: (x − 3)(x + 2) = x² − x − 6, bukan 2x² + x − 6.", "SMA10-M-B5-04", "=bentuk_faktor"),
    ("2 dan −3", False, "Koefisien 2 diabaikan: (x − 2)(x + 3) = x² + x − 6, bukan 2x² + x − 6.", "SMA10-M-B5-04", "=bentuk_faktor"),
], guna="Cek penguasaan", sulit="Sedang")
cek(7 + 9 == 16 and akar(1, 6, -7) == [-7, 1] and 7 + 36 == 43 and 7 - 9 == -2)
soal("PB3", 3, "Persamaan x² + 6x = 7 diselesaikan dengan melengkapi kuadrat sempurna. Bentuk yang tepat adalah ...", "A", [
    ("(x + 3)² = 16", True, "Benar. Tambahkan (6/2)² = 9 di kedua ruas: x² + 6x + 9 = 16. Akarnya x = 1 atau x = −7.", "", "=melengkapi"),
    ("(x + 3)² = 7", False, "9 hanya ditambahkan di ruas kiri. Ruas kanan juga harus ditambah 9.", "SMA10-M-B5-05", "=melengkapi"),
    ("(x + 6)² = 43", False, "Setengah dari b tidak diambil: (x + 6)² = x² + 12x + 36, bukan x² + 6x + 36.", "SMA10-M-B5-05", "=melengkapi"),
    ("(x + 3)² = −2", False, "9 dikurangkan dari ruas kanan (7 − 9), padahal harus ditambahkan.", "SMA10-M-B5-05", "=melengkapi"),
], guna="Cek penguasaan", sulit="Sedang")
cek(D(9, -12, 4) == 0 and akar(9, -12, 4) == [F(2, 3)])
soal("PB4", 4, "Jenis akar persamaan 9x² − 12x + 4 = 0 adalah ...", "D", [
    ("dua akar real kembar", True, "Benar. D = (−12)² − 4 × 9 × 4 = 144 − 144 = 0, jadi akarnya kembar, yaitu x = 2/3.", "", "=diskriminan"),
    ("dua akar real berbeda", False, "Itu terjadi jika D > 0. Di sini D = 144 − 144 = 0.", "SMA10-M-B5-09", "=diskriminan"),
    ("tidak mempunyai akar real", False, "Itu terjadi jika D < 0. Di sini D = 0.", "SMA10-M-B5-09", "=diskriminan"),
    ("hanya akar x = 0", False, "D = 0 tidak berarti akarnya 0. Akarnya −b/(2a) = 12/18 = 2/3.", "SMA10-M-B5-09", "=diskriminan"),
], guna="Cek penguasaan", sulit="Sedang")
cek(akar(1, -7, 10) == [2, 5] and 2 + 5 == 7 and 2 * 5 == 10)
soal("PB5", 4, "Akar-akar x² − 7x + 10 = 0 adalah p dan q. Nilai p + q dan pq adalah ...", "D", [
    ("p + q = 7, pq = 10", True, "Benar. p + q = −b/a = 7 dan pq = c/a = 10. Periksa: akarnya 2 dan 5.", "", "=jumlah_kali"),
    ("p + q = −7, pq = 10", False, "Jumlah akar adalah −b/a = −(−7) = 7, bukan b/a.", "SMA10-M-B5-10", "=jumlah_kali"),
    ("p + q = 10, pq = 7", False, "Jumlah dan hasil kali tertukar.", "SMA10-M-B5-10", "=jumlah_kali"),
    ("p + q = 7, pq = −10", False, "Hasil kali akar adalah c/a = 10, tanpa tanda minus.", "SMA10-M-B5-10", "=jumlah_kali"),
], guna="Cek penguasaan", sulit="Sedang")
cek(puncak(1, -6, 5) == (3, -4) and nilai(1, -6, 5, -3) == 32 and nilai(1, -6, 5, 6) == 5)
soal("PB6", 5, "Titik puncak grafik f(x) = x² − 6x + 5 adalah ...", "A", [
    ("(3, −4)", True, "Benar. x = −b/(2a) = 6/2 = 3, dan f(3) = 9 − 18 + 5 = −4.", "", "=sumbu_simetri"),
    ("(−3, 32)", False, "Dipakai b/(2a) = −3, sehingga f(−3) = 9 + 18 + 5 = 32. Sumbu simetrinya x = −b/(2a) = 3.", "SMA10-M-B5-12", "=sumbu_simetri"),
    ("(3, 5)", False, "Ordinatnya diambil dari c. Ordinat puncak adalah f(3) = −4.", "SMA10-M-B5-12", "=puncak"),
    ("(6, 5)", False, "Dipakai −b/a = 6, dan f(6) = 36 − 36 + 5 = 5. Pembaginya 2a.", "SMA10-M-B5-12", "=sumbu_simetri"),
], guna="Cek penguasaan", sulit="Sedang")
cek(D(-1, 2, -3) == -8 and akar(-1, 2, -3) == [])
soal("PB7", 5, "Grafik f(x) = −x² + 2x − 3 ...", "C", [
    ("terbuka ke bawah dan tidak memotong sumbu x", True, "Benar. a = −1 < 0, jadi terbuka ke bawah; D = 4 − 12 = −8 < 0, jadi tidak memotong sumbu x.", "", "=d_titik"),
    ("terbuka ke atas dan tidak memotong sumbu x", False, "Arah terbuka ditentukan oleh a = −1 < 0, jadi ke bawah.", "SMA10-M-B5-11", "=arah"),
    ("terbuka ke bawah dan memotong sumbu x di dua titik", False, "Dua titik potong memerlukan D > 0. Di sini D = 4 − 12 = −8.", "SMA10-M-B5-09", "=d_titik"),
    ("terbuka ke atas dan memotong sumbu x di dua titik", False, "a = −1 < 0 (terbuka ke bawah), dan D = −8 < 0 (tidak memotong sumbu x).", "SMA10-M-B5-11", "=arah"),
], guna="Cek penguasaan", sulit="Sedang")
cek(puncak(-2, 40, 0) == (10, 200) and 10 * 10 == 100 and 10 * 30 == 300 and 20 + 20 + 20 == 60 > 40)
soal("PB8", 6, "Pak Tani memagari kebun berbentuk persegi panjang di tepi tembok dengan pagar sepanjang 40 m; sisi yang menempel tembok tidak dipagar. Luas kebun terbesar yang mungkin adalah ...", "B", [
    ("200 m²", True, "Benar. Jika lebarnya x, panjangnya 40 − 2x, dan L = 40x − 2x². Maksimum di x = 10: L = 10 × 20 = 200 m².", "", "=maksimum"),
    ("100 m²", False, "Kebun dianggap persegi 10 × 10 yang dipagar keliling. Sisi di tembok tidak memerlukan pagar.", "SMA10-M-B5-15", "=maksimum"),
    ("300 m²", False, "Dipakai lebar 10 dan panjang 40 − 10 = 30, padahal kedua sisi lebar memakai pagar: panjangnya 40 − 20 = 20.", "SMA10-M-B5-15", "=maksimum"),
    ("400 m²", False, "Kebun 20 × 20 memerlukan 20 + 20 + 20 = 60 m pagar, lebih dari 40 m.", "SMA10-M-B5-15", "=maksimum"),
], guna="Cek penguasaan", sulit="Sulit")

# ── Latihan (practice), by lesson.
soal("LT1", 1, "Pada persamaan ax² + bx + c = 0, syarat agar persamaan itu persamaan kuadrat adalah ...", "C", [
    ("a ≠ 0", True, "Benar. Jika a = 0, suku x² hilang dan persamaannya menjadi linear.", "", "pk_syarat"),
    ("b ≠ 0", False, "b boleh nol, misalnya x² − 16 = 0.", "SMA10-M-B5-01", "pk_syarat"),
    ("c ≠ 0", False, "c boleh nol, misalnya 2x² − 18x = 0.", "SMA10-M-B5-01", "pk_syarat"),
    ("a, b, c ≠ 0", False, "Hanya a yang tidak boleh nol; b dan c boleh nol.", "SMA10-M-B5-01", "pk_syarat"),
])
cek(akar(1, 0, -49) == [-7, 7] and F(49, 2) == F(245, 10))
soal("LT2", 1, "Luas sebuah persegi 49 cm². Panjang sisinya adalah ...", "A", [
    ("7 cm", True, "Benar. x² = 49 dipenuhi x = 7 dan x = −7, dan panjang sisi positif.", "", "=persegi"),
    ("−7 cm", False, "(−7)² = 49, tetapi panjang sisi tidak mungkin negatif.", "SMA10-M-B5-14", "=persegi"),
    ("24,5 cm", False, "49 dibagi 2. Luas persegi adalah sisi × sisi, jadi dicari x dengan x² = 49.", "SMA10-M-B5-14", "=persegi"),
    ("49 cm", False, "Itu luasnya, bukan panjang sisinya.", "SMA10-M-B5-14", "=persegi"),
])
cek(akar(1, -11, 24) == [3, 8] and 3 + 8 == 11 and 3 * 8 == 24)
soal("LT3", 1, "Jumlah dua bilangan 11 dan hasil kalinya 24. Persamaan kuadrat yang akar-akarnya kedua bilangan itu adalah ...", "D", [
    ("x² − 11x + 24 = 0", True, "Benar. x(11 − x) = 24 memberi x² − 11x + 24 = 0, dengan akar 3 dan 8.", "", "=dua_bilangan"),
    ("x² + 11x + 24 = 0", False, "Akar persamaan ini −3 dan −8, jumlahnya −11.", "SMA10-M-B5-10", "=dua_bilangan"),
    ("x² − 24x + 11 = 0", False, "Jumlah dan hasil kali tertukar.", "SMA10-M-B5-10", "=dua_bilangan"),
    ("x² + 11x − 24 = 0", False, "Tanda b dan c keliru: jumlah akarnya −11 dan hasil kalinya −24.", "SMA10-M-B5-10", "=dua_bilangan"),
])
cek(all((x + 2) * (x - 5) == nilai(1, -3, -10, x) for x in range(-6, 7)))
soal("LT4", 1, "Hasil penjabaran (x + 2)(x − 5) adalah ...", "B", [
    ("x² − 3x − 10", True, "Benar. x² − 5x + 2x − 10 = x² − 3x − 10.", "", "=bentuk_faktor"),
    ("x² + 3x − 10", False, "Suku tengahnya −5x + 2x = −3x, bukan +3x.", "SMA10-M-B5-14", "=bentuk_faktor"),
    ("x² − 3x + 10", False, "Suku tetapnya 2 × (−5) = −10.", "SMA10-M-B5-14", "=bentuk_faktor"),
    ("x² − 10", False, "Suku tengah −5x + 2x terlupa.", "SMA10-M-B5-14", "=bentuk_faktor"),
])
cek(akar(1, 7, 12) == [-4, -3] and 2 * 6 == 12 and 2 + 6 == 8 and 1 + 12 == 13)
soal("LT5", 2, "Akar-akar persamaan x² + 7x + 12 = 0 adalah ...", "B", [
    ("−3 dan −4", True, "Benar. x² + 7x + 12 = (x + 3)(x + 4) = 0, jadi x = −3 atau x = −4.", "", "=koef_b"),
    ("3 dan 4", False, "Tandanya terbalik. x + 3 = 0 berarti x = −3.", "SMA10-M-B5-02", "=koef_b"),
    ("−2 dan −6", False, "Hasil kalinya 12, tetapi jumlahnya 2 + 6 = 8, bukan 7.", "SMA10-M-B5-03", "=koef_b"),
    ("−1 dan −12", False, "Hasil kalinya 12, tetapi jumlahnya 1 + 12 = 13, bukan 7.", "SMA10-M-B5-03", "=koef_b"),
])
cek(akar(3, -12, 0) == [0, 4])
soal("LT6", 2, "Akar-akar persamaan 3x² − 12x = 0 adalah ...", "D", [
    ("0 dan 4", True, "Benar. 3x(x − 4) = 0, jadi x = 0 atau x = 4.", "", "=nol_sembilan"),
    ("4 saja", False, "Kedua ruas dibagi x sehingga akar x = 0 hilang. Keluarkan 3x sebagai faktor.", "SMA10-M-B5-04", "=nol_sembilan"),
    ("0 dan −4", False, "x − 4 = 0 berarti x = 4, bukan −4.", "SMA10-M-B5-02", "=nol_sembilan"),
    ("3 dan 12", False, "Itu koefisiennya, bukan akarnya. Untuk x = 3: 27 − 36 = −9, bukan 0.", "SMA10-M-B5-04", "=nol_sembilan"),
])
cek(4 + 2 * 3 - 10 == 0 and akar(1, 3, -10) == [-5, 2] and 2 * -5 == -10 and 4 + 2 * 5 - 10 != 0)
soal("LT7", 2, "Diketahui 2 adalah akar persamaan x² + bx − 10 = 0. Nilai b adalah ...", "A", [
    ("3", True, "Benar. 4 + 2b − 10 = 0, jadi 2b = 6 dan b = 3. Akar yang lain −5.", "", "=contoh_b"),
    ("−3", False, "Tandanya keliru saat memindahkan ruas: 2b = 10 − 4 = 6, jadi b = 3.", "SMA10-M-B5-14", "=contoh_b"),
    ("5", False, "Hanya −10 yang dipindahkan (2b = 10), padahal 4 juga harus dikurangkan: 2b = 10 − 4.", "SMA10-M-B5-14", "=contoh_b"),
    ("−5", False, "Itu akar yang lain (2 × (−5) = −10), bukan b.", "SMA10-M-B5-10", "=contoh_b"),
])
cek(akar(2, -7, 3) == [F(1, 2), 3] and akar(1, -4, 3) == [1, 3] and 6 * 1 == 2 * 3 and 6 + 1 == 7)
soal("LT8", 2, "Akar-akar persamaan 2x² − 7x + 3 = 0 adalah ...", "C", [
    ("1/2 dan 3", True, "Benar. 2x² − 7x + 3 = (2x − 1)(x − 3) = 0, jadi x = 1/2 atau x = 3.", "", "=kali_ac"),
    ("−1/2 dan −3", False, "Tandanya terbalik. 2x − 1 = 0 berarti x = 1/2.", "SMA10-M-B5-02", "=kali_ac"),
    ("1 dan 3", False, "Koefisien 2 diabaikan: (x − 1)(x − 3) = x² − 4x + 3.", "SMA10-M-B5-04", "=kali_ac"),
    ("6 dan 1", False, "Itu dua bilangan pemecah suku tengah (6 × 1 = 2 × 3 dan 6 + 1 = 7), bukan akar-akarnya.", "SMA10-M-B5-03", "=kali_ac"),
])
cek(F(8, 2) ** 2 == 16 and 8 ** 2 == 64 and F(8, 2) == 4)
soal("LT9", 3, "Pada x² + 8x = −5, bilangan yang ditambahkan di kedua ruas agar ruas kiri menjadi kuadrat sempurna adalah ...", "A", [
    ("16", True, "Benar. (8/2)² = 4² = 16, sehingga x² + 8x + 16 = (x + 4)².", "", "=melengkapi"),
    ("64", False, "Itu b² = 8². Yang ditambahkan (b/2)².", "SMA10-M-B5-05", "=melengkapi"),
    ("8", False, "Itu b. Yang ditambahkan (b/2)² = 16.", "SMA10-M-B5-05", "=melengkapi"),
    ("4", False, "Itu b/2. Bilangan itu masih dikuadratkan: 4² = 16.", "SMA10-M-B5-05", "=melengkapi"),
])
cek(akar(1, -10, 16) == [2, 8] and 5 + 9 == 14 and 5 - 9 == -4)
soal("LT10", 3, "Penyelesaian (x − 5)² = 9 adalah ...", "C", [
    ("8 dan 2", True, "Benar. x − 5 = 3 atau x − 5 = −3, jadi x = 8 atau x = 2.", "", "=melengkapi"),
    ("8 saja", False, "Akar −3 dari 9 terlupa: x − 5 = −3 memberi x = 2.", "SMA10-M-B5-06", "=melengkapi"),
    ("14 dan −4", False, "9 tidak diakarkan (5 ± 9). √9 = 3.", "SMA10-M-B5-06", "=melengkapi"),
    ("−8 dan −2", False, "Tandanya terbalik. x − 5 = 3 berarti x = 8.", "SMA10-M-B5-02", "=melengkapi"),
])
cek(akar(1, -4, -1) is None and D(1, -4, -1) == 20 and 1 + 4 == 5 and 1 + 16 == 17 and akar(1, -4, 3) == [1, 3])
cek(abs((2 + math.sqrt(5)) ** 2 - 4 * (2 + math.sqrt(5)) - 1) < 1e-12 and abs((2 - math.sqrt(5)) ** 2 - 4 * (2 - math.sqrt(5)) - 1) < 1e-12)
soal("LT11", 3, "Penyelesaian x² − 4x − 1 = 0 dengan melengkapi kuadrat sempurna adalah ...", "B", [
    ("2 ± √5", True, "Benar. x² − 4x = 1, tambahkan 4: (x − 2)² = 5, jadi x = 2 ± √5.", "", "=melengkapi"),
    ("−2 ± √5", False, "Tanda di dalam kuadrat terbalik: (x − 2)² = 5 memberi x = 2 ± √5.", "SMA10-M-B5-02", "=melengkapi"),
    ("3 dan 1", False, "4 hanya ditambahkan di ruas kiri, sehingga (x − 2)² = 1. Ruas kanan juga ditambah 4: 1 + 4 = 5.", "SMA10-M-B5-05", "=melengkapi"),
    ("4 ± √17", False, "Dipakai (x − 4)² dengan menambahkan 16, padahal (x − 4)² = x² − 8x + 16. Setengah dari 4 adalah 2.", "SMA10-M-B5-05", "=melengkapi"),
])
soal("LT12", 4, "Rumus akar-akar persamaan ax² + bx + c = 0 adalah ...", "D", [
    ("x = (−b ± √(b² − 4ac))/(2a)", True, "Benar. Rumus ini diperoleh dengan melengkapi kuadrat sempurna pada ax² + bx + c = 0.", "", "rumus_abc"),
    ("x = (b ± √(b² − 4ac))/(2a)", False, "Tanda minus pada −b terlupa.", "SMA10-M-B5-07", "rumus_abc"),
    ("x = (−b ± √(b² + 4ac))/(2a)", False, "Di bawah akar b² − 4ac, bukan b² + 4ac.", "SMA10-M-B5-07", "rumus_abc"),
    ("x = (−b ± √(b² − 4ac))/a", False, "Pembaginya 2a, bukan a.", "SMA10-M-B5-07", "rumus_abc"),
])
cek(D(2, 3, -2) == 25 and 9 - 16 == -7 and akar(2, 3, -2) == [-2, F(1, 2)])
soal("LT13", 4, "Jenis akar persamaan 2x² + 3x − 2 = 0 adalah ...", "D", [
    ("dua akar real berbeda", True, "Benar. D = 9 − 4 × 2 × (−2) = 9 + 16 = 25 > 0. Akarnya 1/2 dan −2.", "", "=diskriminan"),
    ("dua akar real kembar", False, "Akar kembar memerlukan D = 0. Di sini D = 25.", "SMA10-M-B5-09", "=diskriminan"),
    ("tidak mempunyai akar real", False, "Tanda −4ac keliru, sehingga D dihitung 9 − 16 = −7. Karena c = −2, D = 9 + 16 = 25.", "SMA10-M-B5-08", "=diskriminan"),
    ("hanya satu akar real", False, "Satu akar (kembar) terjadi jika D = 0. Di sini D = 25 > 0.", "SMA10-M-B5-09", "=diskriminan"),
])
cek(akar(2, -6, -8) == [-1, 4] and -1 * 4 == -4 and -1 + 4 == 3)
soal("LT14", 4, "Hasil kali akar-akar persamaan 2x² − 6x − 8 = 0 adalah ...", "B", [
    ("−4", True, "Benar. x_{1} × x_{2} = c/a = −8/2 = −4. Periksa: akarnya 4 dan −1.", "", "=jumlah_kali"),
    ("4", False, "Dipakai −c/a. Hasil kali akar adalah c/a.", "SMA10-M-B5-10", "=jumlah_kali"),
    ("3", False, "Itu jumlah akar, −b/a = 6/2 = 3.", "SMA10-M-B5-10", "=jumlah_kali"),
    ("−8", False, "c belum dibagi a = 2.", "SMA10-M-B5-10", "=jumlah_kali"),
])
cek(akar(1, -3, 2) == [1, 2] and akar(1, -6, 8) == [2, 4] and 2 * 2 == 4 and 1 * 2 * 4 == 8)
soal("LT15", 4, "Akar-akar x² − 3x + 2 = 0 adalah p dan q. Persamaan kuadrat yang akar-akarnya 2p dan 2q adalah ...", "C", [
    ("x² − 6x + 8 = 0", True, "Benar. 2p + 2q = 2 × 3 = 6 dan 2p × 2q = 4 × 2 = 8. Periksa: akarnya 2 dan 4.", "", "=akar_baru"),
    ("x² − 6x + 4 = 0", False, "pq dikali 2, padahal 2p × 2q = 4pq = 8.", "SMA10-M-B5-10", "=akar_baru"),
    ("x² + 6x + 8 = 0", False, "Koefisien x adalah −(jumlah akar) = −6.", "SMA10-M-B5-10", "=akar_baru"),
    ("x² − 3x + 8 = 0", False, "Jumlah akar tidak dikali 2: 2p + 2q = 6.", "SMA10-M-B5-10", "=akar_baru"),
])
cek(D(1, -2, -4) == 20 and 20 == 4 * 5)
cek(abs((1 + math.sqrt(5)) ** 2 - 2 * (1 + math.sqrt(5)) - 4) < 1e-12 and abs((1 - math.sqrt(5)) ** 2 - 2 * (1 - math.sqrt(5)) - 4) < 1e-12)
soal("LT16", 4, "Dengan rumus kuadrat, akar-akar x² − 2x − 4 = 0 adalah ...", "A", [
    ("1 ± √5", True, "Benar. x = (2 ± √(4 + 16))/2 = (2 ± √20)/2 = (2 ± 2√5)/2 = 1 ± √5.", "", "=rumus_abc"),
    ("−1 ± √5", False, "Tanda −b terlupa: −b = −(−2) = 2.", "SMA10-M-B5-07", "=rumus_abc"),
    ("1 ± 2√5", False, "Hanya 2 yang dibagi 2; √20 = 2√5 juga harus dibagi 2.", "SMA10-M-B5-07", "=rumus_abc"),
    ("2 ± 2√5", False, "Pembagian dengan 2a = 2 terlupa.", "SMA10-M-B5-07", "=rumus_abc"),
])
cek(D(-2, 1, 5) == 41)
soal("LT17", 5, "Grafik f(x) = −2x² + x + 5 terbuka ...", "C", [
    ("ke bawah, karena a = −2 < 0", True, "Benar. Tanda a menentukan arah: a < 0 berarti terbuka ke bawah.", "", "=arah"),
    ("ke atas, karena c = 5 > 0", False, "c menentukan titik potong dengan sumbu y, bukan arah terbuka.", "SMA10-M-B5-11", "=sumbu_y"),
    ("ke atas, karena b = 1 > 0", False, "b tidak menentukan arah terbuka; yang menentukan adalah a.", "SMA10-M-B5-11", "=arah"),
    ("ke bawah, karena D = 41 > 0", False, "Arahnya memang ke bawah, tetapi karena a < 0. D menentukan banyak titik potong dengan sumbu x.", "SMA10-M-B5-11", "=arah"),
])
cek(puncak(2, -8, 1)[0] == 2 and -F(-8, 2 * 2) == 2)
soal("LT18", 5, "Sumbu simetri grafik f(x) = 2x² − 8x + 1 adalah ...", "A", [
    ("x = 2", True, "Benar. x = −b/(2a) = 8/4 = 2.", "", "=sumbu_simetri"),
    ("x = −2", False, "Dipakai b/(2a). Sumbu simetrinya −b/(2a) = 2.", "SMA10-M-B5-12", "=sumbu_simetri"),
    ("x = 4", False, "Dipakai −b/a = 8/2. Pembaginya 2a = 4.", "SMA10-M-B5-12", "=sumbu_simetri"),
    ("x = 1", False, "c tidak menentukan sumbu simetri.", "SMA10-M-B5-12", "=sumbu_simetri"),
])
cek(D(1, 2, 1) == 0 and akar(1, 2, 1) == [-1] and nilai(1, 2, 1, 0) == 1)
soal("LT19", 5, "Grafik f(x) = x² + 2x + 1 memotong sumbu x di ...", "D", [
    ("satu titik, yaitu (−1, 0)", True, "Benar. D = 4 − 4 = 0, dan x² + 2x + 1 = (x + 1)² = 0 memberi x = −1.", "", "=d_titik"),
    ("satu titik, yaitu (0, 1)", False, "(0, 1) adalah titik potong dengan sumbu y.", "SMA10-M-B5-13", "=sumbu_y"),
    ("dua titik, yaitu (−1, 0) dan (1, 0)", False, "Dua titik memerlukan D > 0. Di sini D = 0, dan f(1) = 4, bukan 0.", "SMA10-M-B5-09", "=d_titik"),
    ("tidak ada titik potong", False, "Tidak ada titik potong jika D < 0. Di sini D = 0.", "SMA10-M-B5-09", "=d_titik"),
])
cek(all(nilai(1, -4, 3, x) == (x - 2) ** 2 - 1 for x in range(-5, 6)) and nilai(1, -4, 3, 0) == 3 and puncak(1, -4, 3) == (2, -1))
cek(nilai(1, 4, 3, 0) == 3 and puncak(1, 4, 3) == (-2, -1) and nilai(1, 0, -5, 0) != 3 and nilai(1, -4, -1, 0) != 3)
soal("LT20", 6, "Grafik sebuah fungsi kuadrat mempunyai titik puncak (2, −1) dan melalui (0, 3). Fungsinya adalah ...", "B", [
    ("f(x) = x² − 4x + 3", True, "Benar. f(x) = a(x − 2)² − 1; dari (0, 3): 4a − 1 = 3, jadi a = 1 dan f(x) = x² − 4x + 3.", "", "=tiga_bentuk"),
    ("f(x) = x² + 4x + 3", False, "Tanda h terbalik: ini (x + 2)² − 1, dengan puncak (−2, −1).", "SMA10-M-B5-12", "=tiga_bentuk"),
    ("f(x) = x² − 5", False, "(x − 2)² dijabarkan menjadi x² − 4. Yang benar x² − 4x + 4.", "SMA10-M-B5-14", "=tiga_bentuk"),
    ("f(x) = x² − 4x − 1", False, "(x − 2)² dijabarkan menjadi x² − 4x, tanpa +4. Grafik ini melalui (0, −1), bukan (0, 3).", "SMA10-M-B5-14", "=tiga_bentuk"),
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
    "Eksplorasi 5.1": "kelas 4 m × 6 m; hasil kali 63, jumlah 16; 320 km, 24 km/jam, 3 jam",
    "Latihan 5.1": "x³ + x² + x = 0; (x + 2)(x + 3); (x/3 − 4)(x + 9); (2x − 8)(x + 5); luas 20 m²; luas 150 m²",
    "Contoh faktorisasi": "x² + 3x + 2; x² + 6x + 8; 2x² + 7x + 6; x² + bx + 6 akar −3; 2x² − 18x; x² − 2x − 3; 2x² + 5x − 3; 3x² + 13x − 10",
    "Latihan 5.2": "2x² − bx − 6 akar 6; ax² − 17x − 6; 2x² − 3x + c akar −6; 2x² − 8x + 6; 2x² − 18; 2x² − 5x − 18; akar −1/2 dan 3; akar 2/3 dan −4; angka 12; pipa 24 menit",
    "Eksplorasi 5.3": "x² + 4x + 2; x² + 10x + 6; x² + 14x = 32",
    "Latihan 5.3-5.4": "x² + 5x + 6; 2x² + 6x + 3; 6x² + 2x + 1/6; x² − 12x − 15; 3x²/2 − 8x − 6; x²/2 + 4x + 6; 2x²/3 + 2x − 12",
    "Akar baru": "x² + 4x + 3 akar 2p, 2q; x² + 4x − 21 akar 1/(2p), 1/(2q)",
    "Latihan 5.5": "4x² + 20x + 25; 2x² − 5x + 6; 3x² + 5x − 7; x²/2 + 5x + 9; x²/3 + 4x − 3",
    "Latihan 5.7-5.8": "jarak 5, 6, 9, 14; 0, 5, 8, 9; keuntungan 800, 1.200, 1.250; 3x² + 4x + 1; −4x² + 4x + 5; jarak 8, 13, 16, 17; biaya 500, 400",
    "Gambar 5.10 dan K-L-M": "x² − 2x − 3; K(−1, 0), L(0, −3), M(1, −4)",
    "Latihan 5.9-5.10": "puncak (2, 6) melalui (1, 7); bola 4 m dan 8 m; kawat 96 m; buku 900 − 0,25x; jarak 2, 4, 6 dan 3, 8, 15",
    "Uji Kompetensi": "luas dikurangi sisi 600; x² − 5x − 14; 2x² − 7x − 6; C(t) = −0,0003t² + 0,09t; pulpen 3.000, 2.700, 2.400",
}
POST_ANGKA = {"PB1": "3 cm, 40 cm²", "PB2": "2x² + x − 6", "PB3": "x² + 6x = 7", "PB4": "9x² − 12x + 4",
              "PB5": "x² − 7x + 10", "PB6": "x² − 6x + 5", "PB7": "−x² + 2x − 3", "PB8": "40 m"}
cek(set(POST_ANGKA) == {s["ref"] for s in POST} and not set(POST_ANGKA.values()) & set(BUKU.values()))
for s in POST:
    cek(all(w in s["tanya"] for w in POST_ANGKA[s["ref"]].split(", ")), s["ref"])
cek(not any(w in s["tanya"] for s in POST for w in ("63", "320", "x² + 3x + 2", "x² + 6x + 8", "2x² + 7x + 6", "x² − 2x − 3",
                                                   "3x² + 13x", "2x² − 18", "x² + 4x + 2", "x² + 14x", "x² + 4x + 3",
                                                   "x² + 4x − 21", "x² + 5x + 6", "96 m", "900", "600", "x² − 5x − 14",
                                                   "2x² − 7x − 6", "(2, 6)", "4x² + 20x + 25")))


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
    tulis(os.path.join(here, "SMA10-Matematika-Bab5.xlsx"))
    tulis_miskonsepsi(os.path.join(here, "SMA10-Matematika-Bab5-miskonsepsi.csv"))
    halaman = sum(p["isi"].count("## ") for p in PELAJARAN)
    print(f"SMA10-Matematika-Bab5.xlsx: lessons {len(PELAJARAN)} ({halaman} pages), questions {len(S)} "
          f"(pre {len(PRE)}, post {len(POST)}, practice {len(LAT)}), answers "
          + " ".join(f"{h}={HURUF[h]}" for h in "ABCD"))
    print(f"SMA10-Matematika-Bab5-miskonsepsi.csv: {len(MISKONSEPSI)} codes")
    print(f"facts traced: {len(FAKTA)} (pages {min(h for h, _ in FAKTA.values())}-{max(h for h, _ in FAKTA.values())})")
    if "--kutipan" in sys.argv:
        ada, gambar = periksa_kutipan(sys.argv[sys.argv.index("--kutipan") + 1])
        print(f"quotations found in the book's text: {ada} of {len(FAKTA)}; figures read by eye: {', '.join(gambar) or 'none'}")
    print(f"assertions passed: {CEK[0]}")
