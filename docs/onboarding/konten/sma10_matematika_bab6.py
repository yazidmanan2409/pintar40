# SMA Kelas X, Matematika, Bab 6 "Representasi dan Interpretasi Data", as a PINTAR lesson workbook in the D-007
# template (sheets Kursus, Bab, Pelajaran, Soal, Pilihan; the column contract is KOLOM in
# src/lib/unggah-kontrak.ts). Built with the method of Bab 1 (LANA-20).
#
# Source: the student book "Matematika untuk SMA/MA/SMK/MAK Kelas X (Edisi Revisi)" (Dicky Susanto
# dkk.; Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi, 2023; ISBN 978-623-118-558-7),
# Bab 6, pp. 177-238. It has no numbered Contoh; its worked examples (the histogram areas, the OSIS
# clothes, the shoe sales, the download speeds, the energy box plots, Bima's scatter plot) are
# checked here. Its Latihan and Uji Kompetensi have no keys, so every key here is ours.
#
#   - Every number in a lesson, key or distractor is computed here and asserted: medians and
#     quartiles by the book's own position rule (n × 1/4, 1/2, 3/4; a whole number → the middle of
#     two data, otherwise round up), means with Fractions, interpolations exactly, and every
#     distractor's own value by the procedure its rationale names.
#   - Every definition and property is in FAKTA with its page and the book's words; `--kutipan`
#     checks the prose against the book's text. Formulas were read from the page images (the text
#     layer keeps most of this chapter), so the data sets are re-read and recomputed.
#   - Statements that are false or doubtful outside the book are kept out, and DILUAR asserts it.
#   - Notation: × and :, decimal comma, thousands point; «−» as minus; x̄ = Σx : n; Q1, Q2, Q3;
#     charts, tables and number lines become value lines.
#     No LaTeX, HTML or tables; the book's tables become value lines.
#
# Run: python3 docs/onboarding/konten/sma10_matematika_bab6.py [--kutipan book.txt]
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




# A. Representasi data (pp. 180-192)
fakta("histogram_fungsi", 182, "Histogram biasanya digunakan untuk menunjukkan distribusi dari suatu kelompok data, sedangkan diagram batang digunakan untuk membandingkan data.")
fakta("histogram_kuantitatif", 183, "kuantitatif dengan rentang data yang dikelompokkan ke dalam interval, sedangkan diagram batang menampilkan data yang sifatnya kategori.")
fakta("histogram_menempel", 183, "Perbedaan lainnya, pada histogram, gambar batang menempel satu sama lain, sedangkan pada diagram batang, ada spasi antarbatang.")
fakta("histogram_luas", 183, "frekuensi data dalam diagram batang dilihat dari panjang batang, sedangkan frekuensi dalam histogram diberikan berdasarkan area pada masing-masing batang.")
fakta("luas_16", 183, "Frekuensi Kelas 0–2 adalah 8, luas persegi panjangnya adalah 2 # 8 = 16")
fakta("frek_relatif", 187, "Histogram juga dapat menggunakan persentase sebagai frekuensi relatif dari setiap kelas intervalnya.")
fakta("enam_belas", 187, "ditunjukkan bahwa ada 16% siswa yang mendapatkan nilai matematika antara 70 sampai 75.")
fakta("relatif_banding", 188, "Histogram dengan frekuensi relatif sangat efektif jika digunakan untuk membandingkan dua kelompok data dengan jumlah data yang berbeda")
fakta("grafik_dani", 192, "Hal manakah pada grafik ini yang menyebabkan grafik ini memberikan kesimpulan yang")
# B. Statistik deskriptif (pp. 193-205)
fakta("median_def", 193, "Median adalah nilai data yang berada tepat di tengah ketika seluruh data diurutkan dari yang terkecil sampai yang terbesar. Untuk mencari letak median, bagilah banyaknya data dengan 2.")
fakta("median_letak", 193, "Jika hasilnya adalah bilangan bulat, m, maka median terletak di tengah-tengah antara urutan ke-m dan ke-(m + 1).")
fakta("median_bulat", 193, "Jika hasil baginya bukan merupakan bilangan bulat, bulatkanlah hasilnya ke atas, maka median terletak di urutan sesuai hasil pembulatan.")
fakta("modus_def", 193, "Modus dari sebuah kumpulan data adalah data yang paling sering muncul atau memiliki frekuensi paling besar.")
fakta("jangkauan", 193, "Jangkauan adalah selisih antara data terkecil dengan data terbesar.")
fakta("mean_def", 196, "Kamu dapat menghitung mean dengan cara menambahkan seluruh nilai data dan membagi dengan total banyaknya data.")
fakta("osis", 196, "3 5 7 10 5 3 4 6 9 8")
fakta("pakai_median", 198, "Biasanya median digunakan ketika ada data yang memiliki nilai yang ekstrem (pencilan), sehingga data ekstrem tersebut tidak memiliki dampak yang besar seperti pada mean.")
fakta("pakai_mean", 198, "Digunakan untuk jenis data kuantitatif dan menggunakan seluruh data. Namun, mean terpengaruh oleh data dengan nilai yang ekstrem.")
fakta("pakai_modus", 198, "Digunakan ketika jenis data adalah data kualitatif")
fakta("nilai_tengah", 198, "Cara menghitung rata-rata dari data kelompok di atas adalah menggunakan nilai tengah dari tiap kelompok.")
fakta("tabel65", 198, "Ukuran 37–39 40–42 43–45 46–48 Frekuensi 2 11 16 1")
fakta("bimodal", 201, "kelompok data ini memiliki dua modus atau disebut bimodal, yaitu 43 dan 44")
fakta("kelas_modus", 201, "Pada data kelompok, kita dapat melihat bahwa kelas modus adalah kelas 43–45 yaitu dengan frekuensi 16.")
fakta("tepi", 202, "Tepi bawah kelas 43–45 adalah 42,5 dan tepi atasnya adalah 45,5.")
fakta("median_kelompok", 202, "Ternyata median dari data berkelompok, yaitu 42,875 tidak jauh berbeda dengan median dari data tunggal, yaitu 43.")
fakta("kuartil_letak", 203, "untuk mencari letak kuartil bawah atau Q1, bagilah banyaknya data dengan 4.")
fakta("q3_letak", 205, "Karena 15 merupakan bilangan bulat, maka letak Q3 ada di antara data ke-15 dan ke-16.")
# C. Representasi data lanjutan (pp. 205-219)
fakta("boxplot", 206, "Diagram ini menampilkan data berdasarkan lima ukuran data yaitu: nilai minimum, kuartil pertama (Q1), median, kuartil ketiga (Q3), dan nilai maksimum.")
fakta("iqr", 206, "Jangkauan Inter Kuartil atau Inter Quartile Range (IQR), adalah rentang dengan 50% data tengah berada.")
fakta("pencilan", 206, "Pencilan, adalah data yang letaknya jauh dari data-data lainnya. Biasanya lebih dari 1,5 kali IQR di atas Q3 atau di bawah Q1.")
fakta("unduh", 207, "20, 25, 23, 22, 26, 24, 23, 22, 23, 21, 36, 24, 25, 26, 23, 25, 24, 27, 25, 26")
fakta("unduh_q3", 207, "Q3: Nilai tengah antara median dan angka terakhir = (25+26)/2 = 25,5")
fakta("pencar_def", 215, "Diagram Pencar (juga dikenal sebagai Scatter Plot) adalah diagram dengan dua set data direpresentasikan sebagai titik-titik di sebuah bidang dengan koordinat Kartesius.")
fakta("korelasi_jenis", 215, "Korelasi Positif: Ketika nilai satu variabel meningkat, nilai variabel lainnya juga meningkat. • Korelasi Negatif: Ketika nilai satu variabel meningkat, nilai variabel lainnya menurun.")
fakta("korelasi_kuat", 216, "Pada korelasi positif kuat, titik-titik data pada Scatter Plot cenderung sangat dekat dan menyerupai garis linear.")
fakta("bukan_sebab", 219, "Perlu kamu ketahui, bahwa tidak semua korelasi menunjukkan hubungan sebab-akibat ya.")
fakta("bima", 214, "Jumlah Buku yang Dibaca per Bulan 2 4 1 3 5 0 6 7 3 2")
# For the book-error record only (not used by any question)
fakta("covid_200", 179, "Indonesia mencapai 3%, atau jika ada 6.000 pasien baru, maka diperkirakan rata-rata 200 pasien akan berakhir dengan kematian.")
fakta("hist_kanan", 184, "Jadi, kelas 0–2 dan 2–4 pada histogram kiri memiliki luas yang sama dengan kelas 2–4 pada histogram kanan")
fakta("median_q1", 204, "Dari ilustrasi di atas, kamu dapat melihat bahwa Median = Q1")
fakta("batas_atas", 208, "Batas atas: Q3 + 1.5 x IQR = 26 + 3.75 = 29,75")
fakta("kumis", 208, "Diagram Box-and-Whisker akan memiliki whisker atau “kumis” atas yang panjang, menunjukkan adanya outlier di angka 36.")
fakta("sebab_akibat", 215, "dapat disimpulkan hubungan sebab-akibat sebagai berikut: makin banyak buku yang dibaca, maka nilai ujian bahasa akan makin baik.")
fakta("panjang_kelas", 198, "dengan panjang kelas sama dengan 2 sehingga menjadi tabel frekuensi data kelompok sebagai berikut.")
fakta("tabel66", 199, "Jika data penjualan sepatu di toko A pada Tabel 6.4 kita ubah menjadi tabel Frekuensi data tunggal sebagai berikut.")
fakta("tidak_terpengaruh", 193, "Kedua ukuran pemusatan ini memiliki keuntungan, yaitu tidak terpengaruh jika kumpulan data memiliki data pencilan")
fakta("p10_85", 225, "P10 = data ke 85 100 dari total data")
fakta("p65_4631", 227, "35% warga menunggu lebih dari 46,31 menit.")
fakta("musim", 229, "hanya terdapat 2 musim, yaitu musim panas dan musim hujan.")
REKAMAN = {"covid_200", "hist_kanan", "median_q1", "batas_atas", "kumis", "sebab_akibat", "panjang_kelas", "tabel66",
           "tidak_terpengaruh", "p10_85", "p65_4631", "musim"}
GAMBAR = set()


def urut(data):
    return sorted(F(x) for x in data)


def letak(n, p):
    """The book's rule for the position of the p-th fraction (1/4, 1/2, 3/4) of n sorted data:
    a whole number m → between m and m + 1; otherwise round up."""
    k = F(n) * p
    return (int(k), int(k) + 1) if k == int(k) else (math.ceil(k),)


def ukuran(data, p):
    s = urut(data)
    pos = letak(len(s), p)
    return sum(s[i - 1] for i in pos) / len(pos)


def rerata(data):
    return sum(F(x) for x in data) / len(data)


def modus(data):
    m = max(data.count(x) for x in data)
    return sorted({x for x in data if data.count(x) == m})


def pencilan_batas(data):
    q1, q3 = ukuran(data, F(1, 4)), ukuran(data, F(3, 4))
    return q1 - F(3, 2) * (q3 - q1), q3 + F(3, 2) * (q3 - q1)


# ── What can be computed (every number the lessons use) ──
cek(2 * 8 + 2 * 16 == 48 == 4 * 12)                                                        # histogram areas
cek(F(16, 100) * 200 == 32)
KELAS40 = [6, 10, 14, 8, 2]
cek(sum(KELAS40) == 40 and [F(f * 100, 40) for f in KELAS40] == [15, 25, 35, 20, 5] and sum(F(f * 100, 40) for f in KELAS40) == 100)
cek(F(9 * 100, 25) == 36 and F(14 * 100, 40) == 35 and 14 > 9)                              # 14 of 40 against 9 of 25
OSIS = [3, 5, 7, 10, 5, 3, 4, 6, 9, 8]
cek(rerata(OSIS) == 6 and ukuran(OSIS, F(1, 2)) == F(11, 2) and modus(OSIS) == [3, 5] and max(OSIS) - min(OSIS) == 7)
OSIS2 = OSIS + [20, 22]
cek(rerata(OSIS2) == F(17, 2) and ukuran(OSIS2, F(1, 2)) == F(13, 2) and modus(OSIS2) == [3, 5] and max(OSIS2) - min(OSIS2) == 19)
cek(letak(10, F(1, 2)) == (5, 6) and letak(12, F(1, 2)) == (6, 7) and letak(15, F(1, 2)) == (8,))
# The shoes: Tabel 6.4 (25 sales) plus the 5 found later = the 30 of Tabel 6.5 and 6.6.
SEPATU25 = [43, 44, 38, 43, 44, 42, 42, 39, 43, 43, 44, 45, 44, 44, 40, 41, 42, 43, 42, 40, 45, 41, 41, 42, 43]
SEPATU = SEPATU25 + [41, 43, 44, 44, 46]
cek(len(SEPATU25) == 25 and len(SEPATU) == 30 and SEPATU25.count(45) == 2)
cek({k: SEPATU.count(k) for k in range(38, 47)} == {38: 1, 39: 1, 40: 2, 41: 4, 42: 5, 43: 7, 44: 7, 45: 2, 46: 1})
KELOMPOK = [(37, 39, 2), (40, 42, 11), (43, 45, 16), (46, 48, 1)]
cek(all(sum(1 for x in SEPATU if a <= x <= b) == f for a, b, f in KELOMPOK))
cek([F(a + b, 2) for a, b, _ in KELOMPOK] == [38, 41, 44, 47])
MEAN_K = sum(F(a + b, 2) * f for a, b, f in KELOMPOK) / 30
cek(MEAN_K == F(213, 5) and desimal(float(MEAN_K), 1) == "42,6" and 2 * 38 + 11 * 41 + 16 * 44 + 47 == 1278)
cek(rerata(SEPATU) == F(638, 15) and desimal(float(rerata(SEPATU)), 2) == "42,53")
cek(modus(SEPATU) == [43, 44] and ukuran(SEPATU, F(1, 2)) == 43)
cek(F(30, 2) == 15 and 2 + 11 == 13 and 2 + 11 + 16 == 29)
MED_K = F(425, 10) + F(15 - 13, 16) * 3
cek(MED_K == F(343, 8) and desimal(float(MED_K), 3) == "42,875" and F(2, 16) * 3 == F(3, 8))
# Quartiles and the box plot of the shoes
cek(letak(20, F(1, 4)) == (5, 6) and letak(20, F(3, 4)) == (15, 16) and letak(30, F(1, 4)) == (8,) and letak(30, F(3, 4)) == (23,))
cek([min(SEPATU), ukuran(SEPATU, F(1, 4)), ukuran(SEPATU, F(1, 2)), ukuran(SEPATU, F(3, 4)), max(SEPATU)] == [38, 41, 43, 44, 46])
# The download speeds (p. 207)
UNDUH = [20, 25, 23, 22, 26, 24, 23, 22, 23, 21, 36, 24, 25, 26, 23, 25, 24, 27, 25, 26]
cek([ukuran(UNDUH, F(1, 4)), ukuran(UNDUH, F(1, 2)), ukuran(UNDUH, F(3, 4))] == [23, 24, F(51, 2)])
cek(pencilan_batas(UNDUH) == (F(77, 4), F(117, 4)) and desimal(77 / 4, 2) == "19,25" and desimal(117 / 4, 2) == "29,25")
cek([x for x in UNDUH if x > F(117, 4) or x < F(77, 4)] == [36] and max(x for x in UNDUH if x != 36) == 27 and min(UNDUH) == 20)
# The book's p. 208 uses 26 for Q3: 26 + 3,75 = 29,75.
cek(26 + F(15, 4) == F(119, 4) and desimal(119 / 4, 2) == "29,75")
# Bima's books and marks (Tabel 6.8): a strong positive correlation.
BUKU_B = [2, 4, 1, 3, 5, 0, 6, 7, 3, 2]
NILAI_B = [60, 70, 55, 65, 75, 50, 80, 85, 67, 58]
_mx, _my = rerata(BUKU_B), rerata(NILAI_B)
_sxy = sum((F(x) - _mx) * (F(y) - _my) for x, y in zip(BUKU_B, NILAI_B))
_r = float(_sxy) / math.sqrt(float(sum((F(x) - _mx) ** 2 for x in BUKU_B) * sum((F(y) - _my) ** 2 for y in NILAI_B)))
cek(_r > 0.99 and all((y2 - y1) * (x2 - x1) >= 0 for (x1, y1) in zip(BUKU_B, NILAI_B) for (x2, y2) in zip(BUKU_B, NILAI_B)))
# BOOK INCONSISTENCIES (checked here, kept out of lessons and questions):
# p. 179: 3% of 6.000 is 180, not 200; and 5 of 40.000 is 0,0125%, so «300 kali» is about 240.
cek(F(3, 100) * 6000 == 180 != 200 and F(5 * 100, 40000) == F(1, 80) and F(3, 100) / F(5, 40000) == 240)
# p. 198: the classes 37–39, 40–42 … hold three sizes each; «panjang kelas sama dengan 2».
cek(all(b - a + 1 == 3 for a, b, _ in KELOMPOK))
# p. 199: Tabel 6.6 has 30 sales, so it is Tabel 6.4 plus the 5 late ones, not Tabel 6.4 (25).
cek(sum([1, 1, 2, 4, 5, 7, 7, 2, 1]) == 30 != len(SEPATU25))
# Tabel 6.3 (p. 190): both columns add up to 100%.
cek(F(405, 10) + F(186, 10) + F(158, 10) + F(251, 10) == 100 == F(496, 10) + F(218, 10) + F(171, 10) + F(115, 10))
# The energy example (pp. 209-211) is consistent.
ANGIN = [140, 142, 145, 147, 141, 150, 146, 143, 148, 144]
SURYA = [150, 170, 160, 155, 165, 158, 162, 168, 163, 159]
cek([min(ANGIN), ukuran(ANGIN, F(1, 4)), ukuran(ANGIN, F(1, 2)), ukuran(ANGIN, F(3, 4)), max(ANGIN)] == [140, 142, F(289, 2), 147, 150])
cek([min(SURYA), ukuran(SURYA, F(1, 4)), ukuran(SURYA, F(1, 2)), ukuran(SURYA, F(3, 4)), max(SURYA)] == [150, 158, 161, 165, 170])
cek(pencilan_batas(ANGIN) == (F(269, 2), F(309, 2)) and pencilan_batas(SURYA) == (F(295, 2), F(351, 2)))
# Uji Kompetensi 3-4 (checked, not used): Dodi's mean 80 and median 80; the combined mean 69,2.
cek(rerata([81, 79, 90, 70]) == 80 and ukuran([81, 79, 90, 70], F(1, 2)) == 80 and F(8 * 65 + 12 * 72, 20) == F(346, 5))

SUMBER = ("_Diadaptasi dari Matematika untuk SMA/MA/SMK/MAK Kelas X (Edisi Revisi), Dicky Susanto dkk., "
          "Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi, 2023, Bab 6._")

KURSUS = {
    "Judul kursus*": "Matematika Kelas X · Bab 6: Representasi dan Interpretasi Data",
    "Mata pelajaran*": "Matematika",
    "Jenjang*": "SMA",
    "Kelas*": "Kelas X",
    "Konteks": "Akademik",
}

BAB = [(1, "Representasi dan Interpretasi Data")]

PELAJARAN = [
    dict(no=1, judul="Histogram dan Diagram Batang",
         ringkasan="Histogram menampilkan distribusi data kuantitatif dalam interval, dengan batang yang menempel; diagram batang membandingkan data kategori.",
         tujuan="Kamu dapat membedakan histogram dan diagram batang, membaca frekuensi dari luas batang, dan mengenali grafik yang menyesatkan.",
         bloom="Memahami",
         isi="""## Dua jenis diagram

**Histogram** biasanya dipakai untuk menunjukkan distribusi suatu kelompok data, sedangkan **diagram batang** dipakai untuk membandingkan data.

- Histogram menampilkan data kuantitatif (misalnya tinggi badan atau lama memakai telepon genggam) yang dikelompokkan ke dalam interval. Diagram batang menampilkan data kategori (misalnya merek telepon genggam).
- Pada histogram, batang-batangnya menempel satu sama lain; pada diagram batang ada jarak antarbatang.
- Pada diagram batang, frekuensi dilihat dari panjang batang. Pada histogram, frekuensi ditunjukkan oleh **luas** setiap batang.

## Luas batang histogram

Batang histogram boleh berbeda lebarnya, asalkan luasnya sesuai dengan frekuensinya. Contoh: pada sebuah histogram, kelas 0–2 jam mempunyai tinggi 8 dan kelas 2–4 jam mempunyai tinggi 16.

- luas kelas 0–2 → 2 × 8 = 16
- luas kelas 2–4 → 2 × 16 = 32
- luas gabungan → 16 + 32 = 48

Jika kedua kelas digabung menjadi satu kelas 0–4 selebar 4, tinggi batangnya harus 48 : 4 = 12, supaya luasnya tetap 48. Kedua histogram itu menampilkan data yang sama.

## Grafik yang menyesatkan

Dani membuat diagram batang nilai kuisnya, tetapi sumbu tegaknya dimulai dari 60, bukan dari 0. Nilai 70 dan 90 lalu tampak seperti batang setinggi 10 dan 30, sehingga batang nilai 90 terlihat tiga kali batang nilai 70, padahal 90 : 70 kurang dari 1,3.

Saat membaca atau membuat diagram batang, periksa di mana sumbu tegaknya dimulai.

## Coba pikirkan

Kapan sebuah kelompok data sebaiknya ditampilkan dengan histogram, dan kapan dengan diagram batang?

""" + SUMBER),
    dict(no=2, judul="Frekuensi Relatif",
         ringkasan="Frekuensi relatif menyatakan frekuensi setiap kelas sebagai persentase dari seluruh data; jumlahnya 100% dan berguna untuk membandingkan kelompok yang berbeda ukurannya.",
         tujuan="Kamu dapat menghitung dan membaca frekuensi relatif serta memakainya untuk membandingkan dua kelompok data.",
         bloom="Menerapkan",
         isi="""## Frekuensi sebagai persentase

Histogram juga dapat memakai persentase sebagai **frekuensi relatif** setiap kelas intervalnya:

frekuensi relatif = frekuensi kelas : banyak seluruh data × 100%

Contoh: nilai ulangan 40 siswa.

- kelas 1 → 6 siswa → 6 : 40 × 100% = 15%
- kelas 2 → 10 siswa → 25%
- kelas 3 → 14 siswa → 35%
- kelas 4 → 8 siswa → 20%
- kelas 5 → 2 siswa → 5%

Jumlah seluruh frekuensi relatif selalu 100%: 15 + 25 + 35 + 20 + 5 = 100.

## Dari persentase ke banyak data

Persentase bukan banyaknya data. Jika 16% siswa mendapat nilai antara 70 dan 75, itu belum berarti ada 16 siswa. Jika yang ikut ulangan 200 siswa, banyaknya 16% × 200 = **32 siswa**.

## Membandingkan dua kelompok

Frekuensi relatif sangat berguna untuk membandingkan dua kelompok data yang berbeda banyaknya.

Contoh: di kelas A (40 siswa), 14 siswa gemar membaca; di kelas B (25 siswa), 9 siswa gemar membaca. Kelas A lebih banyak orangnya (14 > 9), tetapi persentasenya 14 : 40 = 35%, sedangkan kelas B 9 : 25 = 36%. Dengan persentase, kedua kelas dapat dibandingkan secara adil: bagiannya hampir sama.

""" + SUMBER),
    dict(no=3, judul="Modus, Median, dan Mean",
         ringkasan="Modus adalah data yang paling sering muncul, median data yang tepat di tengah setelah diurutkan, dan mean jumlah seluruh data dibagi banyaknya data.",
         tujuan="Kamu dapat menentukan modus, median, mean, dan jangkauan data tunggal serta memilih ukuran pemusatan yang tepat.",
         bloom="Menerapkan",
         isi="""## Tiga ukuran pemusatan

- **Modus** adalah data yang paling sering muncul atau memiliki frekuensi paling besar. Sebuah data dapat mempunyai dua modus (bimodal).
- **Median** adalah nilai data yang berada tepat di tengah setelah seluruh data diurutkan dari yang terkecil sampai yang terbesar.
- **Mean** (rata-rata) adalah jumlah seluruh nilai data dibagi banyaknya data: x̄ = Σx : n.

**Jangkauan** adalah selisih antara data terbesar dan data terkecil.

## Letak median

Bagilah banyaknya data n dengan 2.

- Jika hasilnya bilangan bulat m, median terletak di tengah-tengah data ke-m dan ke-(m + 1).
- Jika hasilnya bukan bilangan bulat, bulatkan ke atas; median adalah data pada urutan itu.

Contoh: n = 15 → 15 : 2 = 7,5 → median data ke-8. n = 10 → 10 : 2 = 5 → median di tengah data ke-5 dan ke-6.

## Contoh: sumbangan baju

Sepuluh pengurus OSIS mengumpulkan baju bekas: 3, 5, 7, 10, 5, 3, 4, 6, 9, 8. Berapa mean, median, dan modusnya?

1. Urutkan: 3, 3, 4, 5, 5, 6, 7, 8, 9, 10.
2. Mean = 60 : 10 = **6**.
3. Median: 10 : 2 = 5, jadi di tengah data ke-5 dan ke-6: (5 + 6) : 2 = **5,5**.
4. Modus: 3 dan 5, masing-masing muncul dua kali (**bimodal**). Jangkauannya 10 − 3 = 7.

## Pengaruh data ekstrem

Dua siswa lain menambahkan 20 dan 22 baju. Dengan 12 data, mean menjadi 102 : 12 = 8,5, median menjadi (6 + 7) : 2 = 6,5, dan modus tetap 3 dan 5.

Mean naik paling banyak, karena mean memakai semua nilai dan terpengaruh oleh data yang sangat berbeda (**pencilan**). Median berubah sedikit, dan modus tidak berubah.

- Modus cocok untuk data kualitatif, misalnya merek atau warna yang paling banyak dipilih. Modus juga berguna untuk data kuantitatif seperti ukuran sepatu, jika yang penting adalah ukuran yang paling laku.
- Median cocok untuk data kuantitatif yang mempunyai pencilan.
- Mean memakai seluruh data, tetapi terpengaruh oleh pencilan.

""" + SUMBER),
    dict(no=4, judul="Ukuran Pemusatan Data Kelompok",
         ringkasan="Mean data kelompok dihitung dengan nilai tengah setiap kelas; median data kelompok ditaksir dengan interpolasi di kelas median.",
         tujuan="Kamu dapat menghitung mean, menentukan kelas modus, dan menaksir median data kelompok.",
         bloom="Menerapkan",
         isi="""## Data kelompok

Sebuah toko mencatat 30 ukuran sepatu yang terjual. Data itu dikelompokkan ke dalam kelas-kelas yang masing-masing memuat tiga ukuran:

- 37–39 → 2
- 40–42 → 11
- 43–45 → 16
- 46–48 → 1

Setiap kelas mempunyai **nilai tengah**: (37 + 39) : 2 = 38, lalu 41, 44, dan 47. Kelas 43–45 mempunyai **tepi bawah** 42,5 dan **tepi atas** 45,5.

## Mean data kelompok

Data dalam setiap kelas dianggap tersebar merata, sehingga nilai tengah mewakili kelasnya.

mean = (2 × 38 + 11 × 41 + 16 × 44 + 1 × 47) : 30 = 1.278 : 30 = **42,6**

Mean dari 30 data tunggalnya 1.276 : 30 ≈ 42,53. Kedua hasil cukup dekat.

## Kelas modus

Kelas dengan frekuensi terbesar disebut **kelas modus**. Di sini kelas modusnya 43–45 (frekuensi 16). Data tunggalnya bimodal, yaitu 43 dan 44, dan keduanya memang terletak di kelas itu.

## Median dengan interpolasi

Berapa median data kelompok ini?

1. Letak median: 30 : 2 = 15, jadi data ke-15.
2. Sebelum kelas 43–45 ada 2 + 11 = 13 data, dan sampai akhir kelas itu ada 13 + 16 = 29 data. Jadi data ke-15 berada di kelas 43–45.
3. Bandingkan jaraknya: (median − 42,5) : (15 − 13) = (45,5 − 42,5) : (29 − 13), jadi median − 42,5 = 2 × 3/16 = 0,375.
4. Median ≈ 42,5 + 0,375 = **42,875**.

Median data tunggalnya 43 (data ke-15 dan ke-16 sama-sama 43), jadi taksiran dari data kelompok cukup dekat.

""" + SUMBER),
    dict(no=5, judul="Kuartil dan Box Plot",
         ringkasan="Kuartil membagi data terurut menjadi empat bagian sama banyak; box plot menampilkan data minimum, Q1, median, Q3, dan maksimum, dan memperlihatkan pencilan.",
         tujuan="Kamu dapat menentukan kuartil dan jangkauan interkuartil, membaca box plot, dan mengenali pencilan.",
         bloom="Menerapkan",
         isi="""## Kuartil

Kuartil membagi data yang sudah diurutkan menjadi empat bagian sama banyak: Q1 (kuartil bawah), Q2 (median), dan Q3 (kuartil atas). Letaknya dicari seperti median:

- Q1: kalikan n dengan 1/4; Q3: kalikan n dengan 3/4.
- Jika hasilnya bilangan bulat m, kuartil di tengah-tengah data ke-m dan ke-(m + 1); jika tidak, bulatkan ke atas.

Contoh: n = 20 → Q1 di tengah data ke-5 dan ke-6, Q2 di tengah data ke-10 dan ke-11, Q3 di tengah data ke-15 dan ke-16. Setiap bagian memuat 5 data.

## Box plot

**Box plot** (diagram box-and-whisker) menampilkan lima ukuran data: nilai minimum, Q1, median, Q3, dan nilai maksimum. Kotaknya membentang dari Q1 sampai Q3.

**Jangkauan interkuartil** (IQR) = Q3 − Q1 adalah rentang tempat 50% data yang di tengah berada.

Contoh: untuk 30 ukuran sepatu pada pelajaran 4, letak Q1 = 30 × 1/4 = 7,5 → data ke-8, dan letak Q3 = 22,5 → data ke-23.

- minimum → 38
- Q1 → 41
- median → 43
- Q3 → 44
- maksimum → 46

IQR = 44 − 41 = 3.

## Pencilan

**Pencilan** adalah data yang letaknya jauh dari data lainnya, biasanya lebih dari 1,5 × IQR di atas Q3 atau di bawah Q1.

**Contoh: kecepatan unduh.** Kecepatan unduh 20 pelanggan (Mbps), setelah diurutkan: 20, 21, 22, 22, 23, 23, 23, 23, 24, 24, 24, 25, 25, 25, 25, 26, 26, 26, 27, 36. Adakah pencilan?

1. Q1 = (23 + 23) : 2 = 23, median = (24 + 24) : 2 = 24, Q3 = (25 + 26) : 2 = 25,5.
2. IQR = 25,5 − 23 = 2,5, dan 1,5 × 2,5 = 3,75.
3. Batas atas = Q3 + 3,75 = 25,5 + 3,75 = 29,25; batas bawah = Q1 − 3,75 = 23 − 3,75 = 19,25.
4. Data 36 lebih dari 29,25, jadi **36 adalah pencilan**. Tidak ada data di bawah 19,25.

Pada box plot, pencilan digambar sebagai titik tersendiri. Kumis atas berhenti di 27, data terbesar yang bukan pencilan.

""" + SUMBER),
    dict(no=6, judul="Diagram Pencar dan Korelasi",
         ringkasan="Diagram pencar menampilkan pasangan data sebagai titik-titik untuk melihat korelasi; korelasi tidak selalu berarti sebab-akibat.",
         tujuan="Kamu dapat membaca diagram pencar, menentukan jenis dan kekuatan korelasi, dan membedakan korelasi dari sebab-akibat.",
         bloom="Menganalisis",
         isi="""## Diagram pencar

**Diagram pencar** (scatter plot) menampilkan dua kelompok data yang berpasangan sebagai titik-titik pada bidang koordinat Kartesius. Koordinat x mewakili satu nilai dan koordinat y mewakili nilai pasangannya. Tujuannya melihat hubungan (**korelasi**) antara kedua kelompok data.

Contoh: Bima mencatat banyak buku yang ia baca dan nilai ulangan Bahasa Indonesianya selama 10 bulan. Sebagian datanya:

- 0 buku → 50
- 2 buku → 58 dan 60
- 4 buku → 70
- 6 buku → 80
- 7 buku → 85

Titik-titiknya cenderung naik dan hampir membentuk garis lurus.

## Jenis korelasi

- **Korelasi positif**: jika nilai satu variabel meningkat, nilai variabel lainnya juga meningkat.
- **Korelasi negatif**: jika nilai satu variabel meningkat, nilai variabel lainnya menurun.
- **Tidak ada korelasi**: tidak tampak hubungan yang jelas.

Korelasi **kuat** jika titik-titiknya sangat dekat dengan sebuah garis lurus, dan **sedang** jika titik-titiknya tersebar lebih jauh dari garis itu. Data Bima menunjukkan korelasi positif yang kuat.

## Korelasi bukan sebab-akibat

Tidak semua korelasi menunjukkan hubungan sebab-akibat. Data Bima saja belum membuktikan bahwa membaca buku **menyebabkan** nilai naik; mungkin ada hal lain, misalnya Bima juga makin rajin belajar. Teman Bima yang membaca buku sama banyaknya bisa saja mendapat nilai jauh berbeda.

Contoh lain: di sebuah kota, penjualan es krim dan jumlah orang yang berenang sama-sama naik pada bulan-bulan panas. Keduanya berkorelasi positif, tetapi es krim tidak menyebabkan orang berenang; keduanya dipengaruhi cuaca.

## Rangkuman Bab 6

- Histogram untuk data kuantitatif dalam interval (frekuensi = luas batang); diagram batang untuk data kategori.
- Frekuensi relatif (persen) berjumlah 100% dan dipakai untuk membandingkan kelompok yang berbeda ukurannya.
- Modus, median, dan mean; median dan modus lebih tahan terhadap pencilan daripada mean.
- Data kelompok: mean dengan nilai tengah, median dengan interpolasi.
- Kuartil, IQR = Q3 − Q1, box plot, dan pencilan (lebih dari 1,5 × IQR dari kotak).
- Diagram pencar menunjukkan korelasi positif, negatif, atau tidak ada; korelasi bukan bukti sebab-akibat.

""" + SUMBER),
]

# Statements that are false or doubtful outside the book, or book errors, stay out of the lessons.
DILUAR = ("Covid", "vaksin", "Median = Q1", "panjang kelas sama dengan 2", "musim panas dan musim hujan",
          "sebab-akibat sebagai berikut", "tidak terpengaruh jika", "46,31", "Olimpiade")
# The book's 29,75 (p. 208) stays out of the lessons; LT18 B names it as the distractor it is.
DILUAR_PELAJARAN = DILUAR + ("29,75",)
for _p in PELAJARAN:
    cek(3 <= _p["isi"].count("\n## ") + _p["isi"].startswith("## ") <= 6, f"lesson {_p['no']}: 3-6 pages")
    cek(_p["isi"].rstrip().endswith(SUMBER), f"lesson {_p['no']}: attribution last")
    cek(_p["isi"].count("Coba pikirkan") <= 1, f"lesson {_p['no']}: at most one Coba pikirkan")
    cek(not any(w in _p["isi"] for w in DILUAR_PELAJARAN), f"lesson {_p['no']}: {[w for w in DILUAR_PELAJARAN if w in _p['isi']]}")
    cek(not re.search(r"\b[Ss]alah\b", _p["isi"]), f"lesson {_p['no']}: «salah»")
    notasi(_p["isi"], f"lesson {_p['no']}")
    notasi(_p["ringkasan"], f"lesson {_p['no']} ringkasan")
# Round 2: shoe size is quantitative; the qualitative example is merek or warna; no «musim panas».
cek("Modus cocok untuk data kualitatif, misalnya merek atau warna" in PELAJARAN[2]["isi"]
    and "data kualitatif, misalnya ukuran sepatu" not in PELAJARAN[2]["isi"]
    and "Modus juga berguna untuk data kuantitatif seperti ukuran sepatu" in PELAJARAN[2]["isi"])
cek(not any("musim panas" in _p["isi"] for _p in PELAJARAN))
# The value lines of Bima's data in lesson 6 are the data of Tabel 6.8.
cek(all(v in NILAI_B for v in (50, 58, 60, 70, 80, 85)) and dict(zip(BUKU_B, NILAI_B))[0] == 50)
cek(sorted(y for x, y in zip(BUKU_B, NILAI_B) if x == 2) == [58, 60] and dict(zip(BUKU_B, NILAI_B))[7] == 85)
cek(F(90, 70) < F(13, 10) and (90 - 60) == 3 * (70 - 60))                                     # Dani's axis from 60

# ── Misconceptions: the book has no Miskonsepsi section; these come from the distractors.
MISKONSEPSI = {
    "SMA10-M-B6-01": ("Histogram dan diagram batang tertukar",
                      "Data kategori ditampilkan dengan histogram, atau batang histogram diberi jarak seperti diagram batang.",
                      "Tanyakan: datanya angka yang dikelompokkan dalam interval, atau kategori?"),
    "SMA10-M-B6-02": ("Frekuensi histogram dibaca dari tinggi saja",
                      "Pada histogram dengan lebar kelas berbeda, frekuensi dibaca dari tinggi batang, bukan dari luasnya.",
                      "Hitung luas setiap batang: lebar × tinggi."),
    "SMA10-M-B6-03": ("Grafik menyesatkan tidak dikenali",
                      "Sumbu tegak yang tidak dimulai dari nol membuat perbedaan tampak jauh lebih besar.",
                      "Periksa angka awal sumbu tegak sebelum membandingkan panjang batang."),
    "SMA10-M-B6-04": ("Persentase dianggap banyak data",
                      "Frekuensi relatif (persen) dibaca sebagai banyaknya data, atau jumlah seluruh persen tidak 100.",
                      "Kalikan persentase dengan banyak seluruh data untuk mendapat banyaknya."),
    "SMA10-M-B6-05": ("Median tanpa mengurutkan data",
                      "Median diambil dari data di tengah daftar yang belum diurutkan, atau letaknya keliru dihitung.",
                      "Urutkan data dahulu, lalu hitung letaknya dengan n : 2."),
    "SMA10-M-B6-06": ("Ukuran pemusatan tertukar",
                      "Modus, median, dan mean tertukar pengertiannya.",
                      "Modus paling sering, median di tengah, mean dibagi rata."),
    "SMA10-M-B6-07": ("Mean keliru dihitung",
                      "Jumlah data dibagi bilangan yang keliru, atau hanya dua data yang dirata-ratakan.",
                      "Jumlahkan semua data, lalu bagi dengan banyaknya data."),
    "SMA10-M-B6-08": ("Pengaruh pencilan diabaikan",
                      "Mean dipilih untuk data yang mempunyai pencilan, atau median dikira ikut berubah besar.",
                      "Bandingkan mean dan median sebelum dan sesudah pencilan ditambahkan."),
    "SMA10-M-B6-09": ("Nilai tengah atau tepi kelas keliru",
                      "Mean data kelompok memakai batas kelas atau tanpa frekuensi, atau tepi kelas tidak dikurangi 0,5.",
                      "Nilai tengah = (batas bawah + batas atas) : 2; tepi bawah = batas bawah − 0,5."),
    "SMA10-M-B6-10": ("Interpolasi median keliru",
                      "Yang ditulis nilai tengah atau tepi kelas median, bukan hasil interpolasi.",
                      "Bandingkan jarak data ke-(n/2) dari awal kelas dengan panjang kelasnya."),
    "SMA10-M-B6-11": ("Kuartil atau IQR keliru",
                      "IQR tertukar dengan jangkauan, atau letak kuartil tidak dihitung dengan aturan n × 1/4 dan n × 3/4.",
                      "IQR = Q3 − Q1; jangkauan = maksimum − minimum."),
    "SMA10-M-B6-12": ("Batas pencilan keliru",
                      "Batas pencilan dihitung dari median atau data terbesar, atau data tepat di batas dianggap pencilan.",
                      "Batas atas = Q3 + 1,5 × IQR, batas bawah = Q1 − 1,5 × IQR; pencilan berada di luar batas."),
    "SMA10-M-B6-13": ("Jenis korelasi tertukar",
                      "Korelasi positif dan negatif tertukar, atau kuat dan sedang tertukar.",
                      "Lihat arah titik-titik: naik berarti positif, turun berarti negatif; dekat garis berarti kuat."),
    "SMA10-M-B6-14": ("Korelasi dianggap sebab-akibat",
                      "Dua variabel yang berkorelasi dianggap pasti yang satu menyebabkan yang lain.",
                      "Cari faktor lain yang dapat memengaruhi keduanya sebelum menyimpulkan sebab-akibat."),
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




# ── Pemetaan awal (pre-test): a histogram's data, a median, an IQR, a correlation.
soal("PA1", 1, "Data manakah yang paling tepat ditampilkan dengan histogram?", "A", [
    ("tinggi badan siswa dalam cm", True, "Benar. Tinggi badan adalah data kuantitatif yang dapat dikelompokkan ke dalam interval.", "", "histogram_kuantitatif"),
    ("merek sepatu yang dibeli siswa", False, "Merek adalah data kategori; lebih tepat dengan diagram batang.", "SMA10-M-B6-01", "histogram_kuantitatif"),
    ("warna kesukaan siswa", False, "Warna adalah data kategori; lebih tepat dengan diagram batang.", "SMA10-M-B6-01", "histogram_kuantitatif"),
    ("provinsi asal siswa", False, "Provinsi adalah data kategori; lebih tepat dengan diagram batang.", "SMA10-M-B6-01", "histogram_kuantitatif"),
], guna="Pemetaan awal")
PA2_D = [2, 9, 4, 12, 6]
cek(ukuran(PA2_D, F(1, 2)) == 6 and PA2_D[2] == 4 and rerata(PA2_D) == F(33, 5) and max(PA2_D) - min(PA2_D) == 10)
soal("PA2", 3, "Median dari data 2, 9, 4, 12, 6 adalah ...", "C", [
    ("6", True, "Benar. Setelah diurutkan: 2, 4, 6, 9, 12. Data yang tepat di tengah adalah 6.", "", "=median_def"),
    ("4", False, "4 berada di tengah daftar yang belum diurutkan. Urutkan dahulu.", "SMA10-M-B6-05", "=median_def"),
    ("6,6", False, "Itu mean: 33 : 5 = 6,6.", "SMA10-M-B6-06", "=mean_def"),
    ("10", False, "Itu jangkauan: 12 − 2 = 10.", "SMA10-M-B6-06", "=jangkauan"),
], guna="Pemetaan awal")
cek(28 - 20 == 8 and 20 + 28 == 48 and 20 + 12 == 32 and F(8, 2) == 4)
soal("PA3", 5, "Sebuah data mempunyai Q1 = 12, median 16, dan Q3 = 20. Jangkauan interkuartilnya adalah ...", "B", [
    ("8", True, "Benar. IQR = Q3 − Q1 = 20 − 12 = 8.", "", "=iqr"),
    ("32", False, "Q1 dan Q3 dijumlahkan (12 + 20). IQR adalah selisihnya.", "SMA10-M-B6-11", "=iqr"),
    ("16", False, "Itu median, bukan jangkauan interkuartil.", "SMA10-M-B6-11", "=iqr"),
    ("4", False, "Selisih Q3 − Q1 dibagi 2. IQR adalah selisihnya saja.", "SMA10-M-B6-11", "=iqr"),
], guna="Pemetaan awal")
soal("PA4", 6, "Makin lama siswa belajar, makin tinggi nilai ulangannya. Jenis korelasinya adalah ...", "D", [
    ("korelasi positif", True, "Benar. Kedua variabel bergerak ke arah yang sama: yang satu naik, yang lain juga naik.", "", "korelasi_jenis"),
    ("korelasi negatif", False, "Pada korelasi negatif, jika yang satu naik, yang lain turun.", "SMA10-M-B6-13", "korelasi_jenis"),
    ("tidak ada korelasi", False, "Ada kecenderungan yang jelas: keduanya naik bersama.", "SMA10-M-B6-13", "korelasi_jenis"),
    ("korelasi sebab-akibat", False, "Korelasi tidak dibagi menjadi jenis «sebab-akibat»; korelasi saja belum membuktikan sebab-akibat.", "SMA10-M-B6-14", "bukan_sebab"),
], guna="Pemetaan awal")

# ── Cek penguasaan (post-test): every lesson; fresh numbers, no Latihan or Uji Kompetensi item
# and no worked example of the book with its numbers barely changed.
soal("PB1", 1, "Pada histogram yang lebar kelasnya berbeda-beda, banyaknya data dalam setiap kelas ditunjukkan oleh ...", "D", [
    ("luas batang", True, "Benar. Frekuensi dalam histogram diberikan oleh luas setiap batang (lebar × tinggi).", "", "histogram_luas"),
    ("tinggi batang", False, "Jika lebarnya berbeda, tinggi saja tidak cukup; yang dibandingkan luasnya.", "SMA10-M-B6-02", "histogram_luas"),
    ("lebar batang", False, "Lebar batang adalah panjang interval kelasnya, bukan banyaknya data.", "SMA10-M-B6-02", "histogram_luas"),
    ("jarak antarbatang", False, "Batang histogram menempel; tidak ada jarak antarbatang.", "SMA10-M-B6-01", "histogram_menempel"),
], guna="Cek penguasaan", sulit="Sedang")
cek(F(12, 100) * 250 == 30 and 250 - 30 == 220 and F(250, 10) == 25)
soal("PB2", 2, "Dari 250 siswa, 12% mendapat nilai antara 80 dan 89. Banyak siswa itu adalah ...", "A", [
    ("30", True, "Benar. 12% × 250 = 30 siswa.", "", "=frek_relatif"),
    ("12", False, "Persentase dianggap banyak siswa. 12% masih dikalikan dengan 250.", "SMA10-M-B6-04", "=frek_relatif"),
    ("220", False, "Itu banyak siswa yang tidak mendapat nilai 80–89 (250 − 30).", "SMA10-M-B6-04", "=frek_relatif"),
    ("25", False, "Dipakai 10% (250 : 10), bukan 12%.", "SMA10-M-B6-04", "=frek_relatif"),
], guna="Cek penguasaan", sulit="Sedang")
cek(F(4 * 75 + 85, 5) == 77 and F(75 + 85, 2) == 80 and F(4 * 75 + 85, 4) == F(385, 4) and desimal(385 / 4, 2) == "96,25")
soal("PB3", 3, "Rata-rata nilai 4 ulangan Rina adalah 75. Nilai ulangan ke-5-nya 85. Rata-rata kelima nilai itu adalah ...", "C", [
    ("77", True, "Benar. Jumlah 4 nilai = 4 × 75 = 300; jumlah 5 nilai = 385; rata-ratanya 385 : 5 = 77.", "", "=mean_def"),
    ("80", False, "Hanya 75 dan 85 yang dirata-ratakan, padahal 75 mewakili empat nilai: (4 × 75 + 85) : 5.", "SMA10-M-B6-07", "=mean_def"),
    ("96,25", False, "Jumlah 385 dibagi 4, padahal ada 5 nilai.", "SMA10-M-B6-07", "=mean_def"),
    ("75", False, "Rata-rata dianggap tidak berubah; nilai 85 di atas rata-rata menaikkannya.", "SMA10-M-B6-07", "=mean_def"),
], guna="Cek penguasaan", sulit="Sedang")
GAJI = [4, 4, 5, 5, 6, 30]
cek(ukuran(GAJI, F(1, 2)) == 5 and rerata(GAJI) == 9 and modus(GAJI) == [4, 5] and max(GAJI) - min(GAJI) == 26)
soal("PB4", 3, "Gaji 6 karyawan (juta rupiah) adalah 4, 4, 5, 5, 6, dan 30. Ukuran pemusatan yang paling mewakili gaji kebanyakan karyawan adalah ...", "B", [
    ("median, yaitu 5 juta", True, "Benar. Data 30 adalah pencilan. Median (5 + 5) : 2 = 5 tidak banyak terpengaruh olehnya.", "", "=pakai_median"),
    ("mean, yaitu 9 juta", False, "Mean 54 : 6 = 9 lebih besar daripada gaji lima karyawan, karena terpengaruh pencilan 30.", "SMA10-M-B6-08", "=pakai_mean"),
    ("modus, yaitu 4 dan 5 juta", False, "Data ini mempunyai dua modus, sehingga tidak memberi satu nilai pusat.", "SMA10-M-B6-06", "=modus_def"),
    ("jangkauan, yaitu 26 juta", False, "Jangkauan (30 − 4) adalah ukuran sebaran, bukan ukuran pemusatan.", "SMA10-M-B6-06", "=jangkauan"),
], guna="Cek penguasaan", sulit="Sedang")
PB5_K = [(10, 14, 3), (15, 19, 5), (20, 24, 2)]
cek(sum(F(a + b, 2) * f for a, b, f in PB5_K) / 10 == F(33, 2) and F(12 + 17 + 22, 3) == 17)
cek(sum(F(a + b, 2) * f for a, b, f in PB5_K) / 3 == 55 and F(3 * 10 + 5 * 15 + 2 * 20, 10) == F(29, 2))
soal("PB5", 4, "Data kelompok: 10–14 (3 data), 15–19 (5 data), dan 20–24 (2 data). Mean data ini dengan memakai nilai tengah adalah ...", "B", [
    ("16,5", True, "Benar. Nilai tengahnya 12, 17, 22: (3 × 12 + 5 × 17 + 2 × 22) : 10 = 165 : 10 = 16,5.", "", "=nilai_tengah"),
    ("17", False, "Nilai tengah dirata-ratakan tanpa frekuensi: (12 + 17 + 22) : 3 = 17.", "SMA10-M-B6-09", "=nilai_tengah"),
    ("55", False, "Jumlah 165 dibagi banyaknya kelas (3), bukan banyaknya data (10).", "SMA10-M-B6-07", "=nilai_tengah"),
    ("14,5", False, "Dipakai batas bawah kelas: (3 × 10 + 5 × 15 + 2 × 20) : 10 = 14,5. Yang dipakai nilai tengah.", "SMA10-M-B6-09", "=nilai_tengah"),
], guna="Cek penguasaan", sulit="Sedang")
PB6_D = [3, 5, 6, 8, 9, 10, 12, 13, 15, 16, 18, 20]
cek(ukuran(PB6_D, F(1, 4)) == 7 and ukuran(PB6_D, F(3, 4)) == F(31, 2) and F(31, 2) - 7 == F(17, 2))
cek(max(PB6_D) - min(PB6_D) == 17 and PB6_D[8] - PB6_D[2] == 9)
soal("PB6", 5, "Jangkauan interkuartil data terurut 3, 5, 6, 8, 9, 10, 12, 13, 15, 16, 18, 20 adalah ...", "D", [
    ("8,5", True, "Benar. n = 12: Q1 di tengah data ke-3 dan ke-4, (6 + 8) : 2 = 7; Q3 di tengah data ke-9 dan ke-10, (15 + 16) : 2 = 15,5. IQR = 8,5.", "", "=kuartil_letak"),
    ("17", False, "Itu jangkauan: 20 − 3 = 17.", "SMA10-M-B6-11", "=jangkauan"),
    ("9", False, "Dipakai data ke-9 dikurangi data ke-3 (15 − 6). Karena 12 × 1/4 = 3 bilangan bulat, Q1 di tengah data ke-3 dan ke-4.", "SMA10-M-B6-11", "=kuartil_letak"),
    ("15,5", False, "Itu Q3. IQR = Q3 − Q1 = 15,5 − 7.", "SMA10-M-B6-11", "=iqr"),
], guna="Cek penguasaan", sulit="Sedang")
cek(28 + F(3, 2) * 8 == 40 and 20 - F(3, 2) * 8 == 8 and 42 > 40 and 38 <= 40 and 10 >= 8)
soal("PB7", 5, "Sebuah data mempunyai Q1 = 20 dan Q3 = 28. Nilai manakah yang merupakan pencilan?", "A", [
    ("42", True, "Benar. IQR = 8 dan 1,5 × 8 = 12. Batas atas 28 + 12 = 40, dan 42 lebih dari 40.", "", "=pencilan"),
    ("38", False, "38 masih di bawah batas atas 40.", "SMA10-M-B6-12", "=pencilan"),
    ("10", False, "Batas bawahnya 20 − 12 = 8, dan 10 masih di atas batas itu.", "SMA10-M-B6-12", "=pencilan"),
    ("8", False, "8 tepat pada batas bawah, bukan di luar batas.", "SMA10-M-B6-12", "=pencilan"),
], guna="Cek penguasaan", sulit="Sulit")
soal("PB8", 6, "Di sebuah kota, penjualan es krim dan banyaknya orang yang tenggelam di pantai sama-sama naik pada bulan-bulan panas. Kesimpulan yang tepat adalah ...", "C", [
    ("keduanya naik bersama, tetapi belum tentu yang satu menyebabkan yang lain", True, "Benar. Ada korelasi positif, tetapi keduanya dapat dipengaruhi hal lain, misalnya cuaca panas yang membuat orang membeli es krim dan berenang.", "", "bukan_sebab"),
    ("es krim menyebabkan orang tenggelam", False, "Korelasi tidak membuktikan sebab-akibat.", "SMA10-M-B6-14", "bukan_sebab"),
    ("korelasinya negatif", False, "Keduanya naik bersama, jadi korelasinya positif.", "SMA10-M-B6-13", "korelasi_jenis"),
    ("makin banyak es krim terjual, makin banyak orang tenggelam karena memakan es krim", False, "Kalimat ini menganggap korelasi sebagai sebab-akibat; faktor lain (cuaca) belum diperhitungkan.", "SMA10-M-B6-14", "bukan_sebab"),
], guna="Cek penguasaan", sulit="Sedang")

# ── Latihan (practice), by lesson.
soal("LT1", 1, "Pada histogram, batang-batangnya ...", "B", [
    ("saling menempel", True, "Benar. Pada histogram, batang menempel satu sama lain, karena intervalnya bersambung.", "", "histogram_menempel"),
    ("diberi jarak yang sama", False, "Jarak antarbatang ada pada diagram batang, bukan histogram.", "SMA10-M-B6-01", "histogram_menempel"),
    ("selalu sama tinggi", False, "Tinggi batang berbeda-beda sesuai frekuensinya.", "SMA10-M-B6-02", "histogram_luas"),
    ("disusun menurut abjad", False, "Batang histogram disusun menurut interval angka, bukan abjad.", "SMA10-M-B6-01", "histogram_kuantitatif"),
])
cek(F(2 * 8 + 2 * 16, 4) == 12 and 8 + 16 == 24)
soal("LT2", 1, "Kelas 0–2 (tinggi 8) dan kelas 2–4 (tinggi 16) pada sebuah histogram digabung menjadi satu kelas 0–4. Agar data yang ditampilkan sama, tinggi batang yang baru adalah ...", "C", [
    ("12", True, "Benar. Luas gabungan 2 × 8 + 2 × 16 = 48, dan lebarnya 4, jadi tingginya 48 : 4 = 12.", "", "=luas_16"),
    ("24", False, "Tinggi kedua batang dijumlahkan (8 + 16), padahal lebarnya menjadi 4. Yang harus tetap adalah luasnya.", "SMA10-M-B6-02", "=luas_16"),
    ("48", False, "Itu luas batangnya. Tinggi = luas : lebar = 48 : 4.", "SMA10-M-B6-02", "=luas_16"),
    ("16", False, "Itu tinggi batang yang lebih besar saja.", "SMA10-M-B6-02", "=luas_16"),
])
soal("LT3", 1, "Pada diagram batang nilai kuis Dani, batang nilai 90 tampak tiga kali tinggi batang nilai 70. Apa yang membuat diagram itu menyesatkan?", "A", [
    ("sumbu tegaknya dimulai dari 60, bukan 0", True, "Benar. Dari 60, batangnya setinggi 30 dan 10, sehingga tampak tiga kali lipat, padahal 90 : 70 kurang dari 1,3.", "", "grafik_dani"),
    ("batangnya terlalu lebar", False, "Lebar batang tidak mengubah kesan perbandingan tinggi.", "SMA10-M-B6-03", "grafik_dani"),
    ("urutan kuisnya dibalik", False, "Urutan tidak membuat satu batang tampak tiga kali lainnya.", "SMA10-M-B6-03", "grafik_dani"),
    ("tidak ada; nilai 90 memang tiga kali nilai 70", False, "90 : 70 kurang dari 1,3, jadi nilai 90 tidak tiga kali nilai 70.", "SMA10-M-B6-03", "grafik_dani"),
])
soal("LT4", 2, "Jumlah seluruh frekuensi relatif (dalam persen) semua kelas pada sebuah histogram adalah ...", "D", [
    ("100%", True, "Benar. Setiap data masuk ke tepat satu kelas, jadi jumlah seluruh persentasenya 100%.", "", "frek_relatif"),
    ("sama dengan banyak data", False, "Itu jumlah frekuensi biasa, bukan frekuensi relatif.", "SMA10-M-B6-04", "frek_relatif"),
    ("50% dari banyak data", False, "Seluruh data sama dengan 100%, bukan 50%.", "SMA10-M-B6-04", "frek_relatif"),
    ("tergantung banyak kelas", False, "Berapa pun banyak kelasnya, jumlah persentasenya tetap 100%.", "SMA10-M-B6-04", "frek_relatif"),
])
cek(F(16, 100) * 200 == 32 and 200 - 16 == 184 and F(16, 100) * 20 == F(16, 5))
soal("LT5", 2, "Pada sebuah histogram, 16% siswa mendapat nilai antara 70 dan 75. Jika ada 200 siswa, banyak siswa itu adalah ...", "C", [
    ("32", True, "Benar. 16% × 200 = 32 siswa.", "", "=enam_belas"),
    ("16", False, "Persentase dianggap banyak siswa.", "SMA10-M-B6-04", "=enam_belas"),
    ("184", False, "16 dikurangkan dari 200. 16% masih dikalikan dengan 200.", "SMA10-M-B6-04", "=enam_belas"),
    ("3,2", False, "16% dikalikan 20, bukan 200.", "SMA10-M-B6-04", "=enam_belas"),
])
soal("LT6", 2, "Kelas A terdiri atas 40 siswa dan kelas B atas 25 siswa. Mengapa hasil ulangan kedua kelas sebaiknya dibandingkan dengan frekuensi relatif?", "D", [
    ("karena banyak siswa kedua kelas berbeda", True, "Benar. Dengan persentase, kelas yang berbeda banyak siswanya dapat dibandingkan secara adil.", "", "relatif_banding"),
    ("karena frekuensi relatif selalu lebih besar", False, "Frekuensi relatif tidak lebih besar; ia hanya menyatakan bagian dari seluruh data.", "SMA10-M-B6-04", "relatif_banding"),
    ("karena histogram tidak dapat memakai frekuensi", False, "Histogram dapat memakai frekuensi maupun frekuensi relatif.", "SMA10-M-B6-04", "frek_relatif"),
    ("karena kelas A pasti lebih baik", False, "Kelas A lebih banyak siswanya, tetapi itu tidak berarti hasilnya lebih baik.", "SMA10-M-B6-04", "relatif_banding"),
])
LT7_D = [2, 3, 3, 5, 7, 7, 7, 9]
cek(modus(LT7_D) == [7] and LT7_D.count(3) == 2 and ukuran(LT7_D, F(1, 2)) == 6 and rerata(LT7_D) == F(43, 8) and desimal(43 / 8, 3) == "5,375")
soal("LT7", 3, "Modus dari data 2, 3, 3, 5, 7, 7, 7, 9 adalah ...", "B", [
    ("7", True, "Benar. 7 muncul tiga kali, paling sering.", "", "=modus_def"),
    ("3", False, "3 hanya muncul dua kali, sedangkan 7 tiga kali.", "SMA10-M-B6-06", "=modus_def"),
    ("6", False, "Itu median: (5 + 7) : 2 = 6.", "SMA10-M-B6-06", "=median_def"),
    ("5,375", False, "Itu mean: 43 : 8 = 5,375.", "SMA10-M-B6-06", "=mean_def"),
])
cek(letak(15, F(1, 2)) == (8,))
soal("LT8", 3, "Sebanyak 15 data diurutkan. Median adalah ...", "A", [
    ("data ke-8", True, "Benar. 15 : 2 = 7,5, bukan bilangan bulat, jadi dibulatkan ke atas: data ke-8.", "", "median_bulat"),
    ("data ke-7", False, "7,5 dibulatkan ke bawah. Aturannya dibulatkan ke atas.", "SMA10-M-B6-05", "median_bulat"),
    ("data ke-7,5", False, "Tidak ada data ke-7,5; bulatkan ke atas menjadi data ke-8.", "SMA10-M-B6-05", "median_bulat"),
    ("rata-rata data ke-7 dan ke-8", False, "Rata-rata dua data dipakai jika n : 2 bilangan bulat. 15 : 2 = 7,5.", "SMA10-M-B6-05", "median_letak"),
])
cek(ukuran(OSIS, F(1, 2)) == F(11, 2) and F(OSIS[4] + OSIS[5], 2) == 4 and rerata(OSIS) == 6)
soal("LT9", 3, "Median data baju OSIS 3, 5, 7, 10, 5, 3, 4, 6, 9, 8 adalah ...", "A", [
    ("5,5", True, "Benar. Setelah diurutkan: 3, 3, 4, 5, 5, 6, 7, 8, 9, 10. Median = (5 + 6) : 2 = 5,5.", "", "=median_letak"),
    ("4", False, "Diambil dari data ke-5 dan ke-6 yang belum diurutkan, (5 + 3) : 2 = 4.", "SMA10-M-B6-05", "=median_def"),
    ("6", False, "Itu mean: 60 : 10 = 6.", "SMA10-M-B6-06", "=mean_def"),
    ("3 dan 5", False, "Itu modusnya.", "SMA10-M-B6-06", "=modus_def"),
])
LT10_D = [3, 4, 4, 5, 6, 100]
cek(rerata(LT10_D) == F(61, 3) and ukuran(LT10_D, F(1, 2)) == F(9, 2) and modus(LT10_D) == [4])
cek(rerata(LT10_D[:-1]) == F(22, 5) and ukuran(LT10_D[:-1], F(1, 2)) == 4 and modus(LT10_D[:-1]) == [4])
soal("LT10", 3, "Pada data 3, 4, 4, 5, 6, 100, ukuran pemusatan manakah yang paling terpengaruh oleh data 100?", "B", [
    ("mean", True, "Benar. Tanpa 100 mean-nya 4,4; dengan 100 mean-nya sekitar 20,3. Median hanya berubah dari 4 menjadi 4,5, dan modus tetap 4.", "", "=pakai_mean"),
    ("median", False, "Median hanya berubah dari 4 menjadi 4,5.", "SMA10-M-B6-08", "=pakai_median"),
    ("modus", False, "Modus tetap 4, karena 4 tetap paling sering muncul.", "SMA10-M-B6-08", "=modus_def"),
    ("tidak ada yang terpengaruh", False, "Mean berubah jauh: dari 4,4 menjadi sekitar 20,3.", "SMA10-M-B6-08", "=pakai_mean"),
])
cek(desimal(61 / 3, 1) == "20,3" and F(40 + 44, 2) == 42 and 44 - 40 + 1 == 5)
soal("LT11", 4, "Nilai tengah kelas 40–44 adalah ...", "D", [
    ("42", True, "Benar. (40 + 44) : 2 = 42.", "", "=nilai_tengah"),
    ("40", False, "Itu batas bawah kelas.", "SMA10-M-B6-09", "=nilai_tengah"),
    ("44", False, "Itu batas atas kelas.", "SMA10-M-B6-09", "=nilai_tengah"),
    ("5", False, "Itu panjang kelasnya (40, 41, 42, 43, 44).", "SMA10-M-B6-09", "=nilai_tengah"),
])
soal("LT12", 4, "Tepi bawah kelas 43–45 adalah ...", "C", [
    ("42,5", True, "Benar. Tepi bawah = batas bawah − 0,5 = 43 − 0,5 = 42,5.", "", "=tepi"),
    ("43", False, "Itu batas bawah. Tepi bawahnya 0,5 lebih kecil.", "SMA10-M-B6-09", "=tepi"),
    ("42", False, "Batas bawah dikurangi 1. Tepi bawahnya 43 − 0,5.", "SMA10-M-B6-09", "=tepi"),
    ("43,5", False, "0,5 ditambahkan. Tepi bawah = batas bawah − 0,5.", "SMA10-M-B6-09", "=tepi"),
])
LT13_K = [("50–59", 6), ("60–69", 14), ("70–79", 9), ("80–89", 11)]
cek(max(LT13_K, key=lambda k: k[1])[0] == "60–69" and 11 < 14)
soal("LT13", 4, "Nilai ulangan dikelompokkan: 50–59 (6 siswa), 60–69 (14 siswa), 70–79 (9 siswa), 80–89 (11 siswa). Kelas modusnya adalah ...", "D", [
    ("60–69", True, "Benar. Kelas 60–69 mempunyai frekuensi terbesar, 14.", "", "=kelas_modus"),
    ("80–89", False, "Frekuensinya 11, lebih kecil daripada 14.", "SMA10-M-B6-06", "=kelas_modus"),
    ("70–79", False, "Kelas modus bukan kelas yang terletak di tengah daftar, melainkan kelas dengan frekuensi terbesar.", "SMA10-M-B6-06", "=kelas_modus"),
    ("50–59", False, "Frekuensinya 6, yang terkecil.", "SMA10-M-B6-06", "=kelas_modus"),
])
LT14_MED = F(195, 10) + F(20 - 6, 16) * 10
cek(20 + F(20 - 6, 16) * 10 == F(115, 4) and desimal(115 / 4, 2) == "28,75")
cek(LT14_MED == F(113, 4) and desimal(113 / 4, 2) == "28,25" and 6 < 20 <= 6 + 16 and F(20 + 29, 2) == F(49, 2))
soal("LT14", 4, "Data kelompok: 10–19 (6 data), 20–29 (16 data), 30–39 (18 data). Taksiran median dengan interpolasi adalah ...", "C", [
    ("28,25", True, "Benar. Data ke-20 ada di kelas 20–29 (sebelumnya 6 data). Median = 19,5 + (20 − 6) : 16 × 10 = 19,5 + 8,75 = 28,25.", "", "=median_kelompok"),
    ("24,5", False, "Itu nilai tengah kelas median. Interpolasi memperhitungkan letak data ke-20 di dalam kelas itu.", "SMA10-M-B6-10", "=median_kelompok"),
    ("29,5", False, "Itu tepi atas kelas median.", "SMA10-M-B6-10", "=tepi"),
    ("28,75", False, "Dipakai batas bawah 20, bukan tepi bawah 19,5: 20 + 8,75 = 28,75.", "SMA10-M-B6-09", "=tepi"),
])
cek(letak(30, F(1, 4)) == (8,) and letak(30, F(1, 2)) == (15, 16))
soal("LT15", 5, "Sebanyak 30 data diurutkan. Kuartil bawah (Q1) adalah ...", "A", [
    ("data ke-8", True, "Benar. 30 × 1/4 = 7,5, bukan bilangan bulat, jadi dibulatkan ke atas: data ke-8.", "", "=kuartil_letak"),
    ("data ke-7", False, "7,5 dibulatkan ke bawah. Aturannya dibulatkan ke atas.", "SMA10-M-B6-11", "=kuartil_letak"),
    ("di tengah data ke-7 dan ke-8", False, "Posisi di tengah dua data dipakai jika hasilnya bilangan bulat. 7,5 bukan bilangan bulat.", "SMA10-M-B6-11", "=kuartil_letak"),
    ("data ke-15", False, "Data ke-15 dan ke-16 menentukan median, bukan Q1.", "SMA10-M-B6-11", "=kuartil_letak"),
])
soal("LT16", 5, "Manakah yang tidak termasuk lima ukuran pada box plot?", "B", [
    ("mean", True, "Benar. Box plot memakai nilai minimum, Q1, median, Q3, dan nilai maksimum; mean tidak termasuk.", "", "boxplot"),
    ("median", False, "Median (Q2) adalah garis di dalam kotak.", "SMA10-M-B6-06", "boxplot"),
    ("kuartil bawah (Q1)", False, "Q1 adalah ujung kiri kotak.", "SMA10-M-B6-11", "boxplot"),
    ("nilai maksimum", False, "Nilai maksimum adalah ujung kumis kanan.", "SMA10-M-B6-11", "boxplot"),
])
soal("LT17", 5, "Jangkauan interkuartil (IQR) menunjukkan ...", "B", [
    ("rentang 50% data yang di tengah", True, "Benar. IQR = Q3 − Q1 adalah rentang tempat 50% data yang di tengah berada.", "", "iqr"),
    ("selisih data terbesar dan terkecil", False, "Itu jangkauan.", "SMA10-M-B6-11", "jangkauan"),
    ("letak median", False, "Median adalah Q2, bukan IQR.", "SMA10-M-B6-11", "iqr"),
    ("banyaknya pencilan", False, "IQR dipakai untuk menentukan batas pencilan, tetapi bukan banyaknya pencilan.", "SMA10-M-B6-12", "pencilan"),
])
cek(F(51, 2) + F(3, 2) * F(5, 2) == F(117, 4) and 26 + F(15, 4) == F(119, 4) and F(51, 2) + F(5, 2) == 28)
soal("LT18", 5, "Data kecepatan unduh mempunyai Q1 = 23 dan Q3 = 25,5. Batas atas pencilannya adalah ...", "A", [
    ("29,25", True, "Benar. IQR = 2,5, jadi batas atas = 25,5 + 1,5 × 2,5 = 25,5 + 3,75 = 29,25.", "", "=pencilan"),
    ("29,75", False, "Dipakai 26 sebagai Q3 (26 + 3,75). Q3-nya 25,5.", "SMA10-M-B6-12", "=unduh_q3"),
    ("28", False, "Q3 ditambah IQR saja (25,5 + 2,5). Yang ditambahkan 1,5 × IQR.", "SMA10-M-B6-12", "=pencilan"),
    ("36", False, "Itu data terbesar, yang justru merupakan pencilan.", "SMA10-M-B6-12", "=unduh"),
])
soal("LT19", 6, "Makin tua umur sebuah mobil, makin rendah harga jualnya. Jenis korelasinya adalah ...", "C", [
    ("korelasi negatif", True, "Benar. Jika umur naik, harga turun: kedua variabel bergerak berlawanan arah.", "", "korelasi_jenis"),
    ("korelasi positif", False, "Pada korelasi positif, keduanya naik bersama.", "SMA10-M-B6-13", "korelasi_jenis"),
    ("tidak ada korelasi", False, "Ada kecenderungan yang jelas: harga turun jika umur naik.", "SMA10-M-B6-13", "korelasi_jenis"),
    ("korelasi sebab-akibat", False, "Korelasi tidak dibagi menjadi jenis «sebab-akibat».", "SMA10-M-B6-14", "bukan_sebab"),
])
soal("LT20", 6, "Pada sebuah diagram pencar, titik-titiknya sangat dekat dengan sebuah garis lurus yang naik. Korelasinya adalah ...", "D", [
    ("korelasi positif kuat", True, "Benar. Naik berarti positif, dan sangat dekat dengan garis lurus berarti kuat.", "", "korelasi_kuat"),
    ("korelasi positif sedang", False, "Korelasi sedang jika titik-titiknya tersebar lebih jauh dari garis.", "SMA10-M-B6-13", "korelasi_kuat"),
    ("korelasi negatif kuat", False, "Garisnya naik, jadi korelasinya positif.", "SMA10-M-B6-13", "korelasi_jenis"),
    ("tidak ada korelasi", False, "Titik-titik yang dekat dengan garis lurus menunjukkan korelasi yang jelas.", "SMA10-M-B6-13", "korelasi_jenis"),
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
    "Tabel 6.1": "pasien baru 1.170 … 2.120", "Histogram HP": "kelas 0–2 tinggi 8, 2–4 tinggi 16, 0–4 tinggi 12",
    "Latihan 6.1-6.2": "lintas alam 1998; tabel perkalian 0-12; survei 40,5 / 18,6 / 15,8 / 25,1; kuis Dani",
    "Eksplorasi 6.2": "16% nilai 70–75; 200 siswa", "Tabel 6.4-6.6": "30 ukuran sepatu 38-46; 37–39, 40–42, 43–45, 46–48",
    "Eksplorasi 6.4": "baju OSIS 3, 5, 7, 10, 5, 3, 4, 6, 9, 8; 20 dan 22",
    "Latihan 6.3": "kue 0, 3, 2, 7 …; 13 data 3-13; tinggi kelas A dan B; diameter 19–21 … 28–30",
    "Box plot": "unduh 20, 25, 23 … 36; listrik 300 … 750; surya dan angin; rumah A dan B",
    "Latihan 6.4": "pengisian HP 68-80; listrik 750; model AI P dan Q; belajar Andi, Budi, Clara, Troy",
    "Tabel 6.8-6.9": "buku Bima 2, 4, 1 …; nilai 60, 70, 55 …; pohon dan PM2.5; AI dan pengikut",
    "Uji Kompetensi": "Dodi 81, 79, 90, 70; rata-rata 65 dan 72; absen; lari 20–29 … 60–69",
}
POST_ANGKA = {"PB1": "lebar kelasnya berbeda-beda", "PB2": "250 siswa, 12%", "PB3": "75, 85", "PB4": "4, 4, 5, 5, 6, dan 30",
              "PB5": "10–14, 15–19, 20–24", "PB6": "3, 5, 6, 8, 9, 10, 12, 13, 15, 16, 18, 20", "PB7": "Q1 = 20, Q3 = 28",
              "PB8": "es krim"}
cek(set(POST_ANGKA) == {s["ref"] for s in POST} and not set(POST_ANGKA.values()) & set(BUKU.values()))
for s in POST:
    cek(all(w in s["tanya"] for w in POST_ANGKA[s["ref"]].split(", ")), s["ref"])
cek(not any(w in s["tanya"] for s in POST for w in ("200 siswa", "16%", "3, 5, 7, 10", "37–39", "43–45", "36", "750",
                                                   "81, 79", "65", "72", "Bima", "OSIS", "sepatu", "1.170")))


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
    tulis(os.path.join(here, "SMA10-Matematika-Bab6.xlsx"))
    tulis_miskonsepsi(os.path.join(here, "SMA10-Matematika-Bab6-miskonsepsi.csv"))
    halaman = sum(p["isi"].count("## ") for p in PELAJARAN)
    print(f"SMA10-Matematika-Bab6.xlsx: lessons {len(PELAJARAN)} ({halaman} pages), questions {len(S)} "
          f"(pre {len(PRE)}, post {len(POST)}, practice {len(LAT)}), answers "
          + " ".join(f"{h}={HURUF[h]}" for h in "ABCD"))
    print(f"SMA10-Matematika-Bab6-miskonsepsi.csv: {len(MISKONSEPSI)} codes")
    print(f"facts traced: {len(FAKTA)} (pages {min(h for h, _ in FAKTA.values())}-{max(h for h, _ in FAKTA.values())})")
    if "--kutipan" in sys.argv:
        ada, gambar = periksa_kutipan(sys.argv[sys.argv.index("--kutipan") + 1])
        print(f"quotations found in the book's text: {ada} of {len(FAKTA)}; figures read by eye: {', '.join(gambar) or 'none'}")
    print(f"assertions passed: {CEK[0]}")
