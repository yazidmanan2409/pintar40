# SMA Kelas X, Matematika, Bab 2 "Barisan dan Deret", as a PINTAR lesson workbook in the D-007
# template (sheets Kursus, Bab, Pelajaran, Soal, Pilihan; the column contract is KOLOM in
# src/lib/unggah-kontrak.ts). Built with the method of Bab 1 (LANA-16).
#
# Source: the student book "Matematika untuk SMA/MA/SMK/MAK Kelas X (Edisi Revisi)" (Dicky Susanto
# dkk.; Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi, 2023; ISBN 978-623-118-558-7),
# Bab 2, pp. 35-70. Its Contoh are worked; its Latihan and Uji Kompetensi have no keys, so every key
# here is ours, and every key is computed.
#
#   - Every number in a lesson, key or distractor is computed here (exact fractions) and asserted.
#   - Every definition and property is in FAKTA with its page and the book's words; `--kutipan`
#     checks the prose against the book's text. Formulas were read from the page images (the text
#     layer loses superscripts and subscripts: U₁ extracts as "U1"), so formulas are proven by
#     computation.
#   - Statements that are false or doubtful outside the book are kept out, and DILUAR asserts it.
#   - Notation: × and :, decimal comma, thousands point; integer and one-letter exponents as
#     Unicode superscripts (3⁹, rⁿ); other exponents as ^{…} (r^{n−1}); subscripts as _{…} (U_{n}).
#     No LaTeX, HTML or tables; the book's tables become value lines.
#
# Run: python3 docs/onboarding/konten/sma10_matematika_bab2.py [--kutipan book.txt]
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



# A. Barisan (pp. 38-48)
fakta("barisan_bilangan", 38, "Jika diamati lebih teliti, pola bilangan di atas disusun berdasarkan aturan tertentu. Pola bilangan yang demikian disebut dengan barisan bilangan.")
fakta("meja", 38, "Jika terdapat 20 orang yang akan makan bersama di satu meja, maka berapa meja yang perlu disatukan?")
fakta("bentuk_umum", 39, "Sehingga, barisan bilangan dapat dinyatakan dalam bentuk umum, yaitu U1,U2,U3,U4, … ,Un.")
fakta("aritmetika_def", 39, "Suatu barisan dengan beda atau selisih antara dua suku berurutan selalu tetap atau konstan disebut BARISAN ARITMETIKA. Beda pada barisan aritmetika dilambangkan dengan b.")
fakta("beda", 39, "Jadi, beda pada barisan aritmetika dapat dinyatakan dengan b = Un  – U(n–1)")
fakta("gedung", 40, "Baris ke-1 = 20 Baris ke-2 = 24 Baris ke-3 = 28 Baris ke-4 = 32 Baris ke-5 = 36 Berapakah jumlah kursi pada baris ke-15?")
fakta("un_aritmetika", 41, "Jadi, rumus umum menentukan suku ke-n pada barisan aritmetika adalah: Un  = a + (n - 1) b")
fakta("contoh1", 41, "Jadi, rumus suku ke-n dari barisan tersebut adalah Un = 3n")
fakta("contoh2", 42, "Jadi, uang yang ditabung Rudi untuk pertama kalinya adalah sebesar Rp50.000,00.")
fakta("kue", 44, "Dikatakan rasio kue yang diambil terhadap kue yang diterima adalah setengah.")
fakta("lipat", 45, "maka kertas akan terbagi menjadi 2 bagian sama besar.")
fakta("geometri_def", 46, "Suatu barisan dengan rasio antara dua suku berurutan selalu tetap atau konstan disebut BARISAN GEOMETRI. Rasio pada barisan geometri dilambangkan dengan r.")
fakta("rasio_bagi", 46, "untuk mencari rasio dapat dengan membagi dua suku yang berurutan.")
fakta("bakteri", 46, "Dalam waktu dua jam, satu sel bakteri membelah diri menjadi 3 bagian")
fakta("un_geometri", 47, "Jadi, rumus umum menentukan suku ke-n pada barisan geometri adalah:")
fakta("contoh3", 48, "Jadi, rasio barisan geometri tersebut adalah 3.")
fakta("contoh4", 48, "Jadi, panjang tali pada potongan ketiga adalah 36 cm.")
# B. Deret (pp. 51-61)
fakta("jabat_tangan", 51, "Setiap pasangan berjabat tangan tepat satu kali.")
fakta("deret_def", 52, "Jadi, deret bilangan adalah jumlah suku-suku penyusun barisan bilangan.")
fakta("gauss", 52, "Ia mengelompokkan suku-suku pada deret tersebut sehingga memiliki nilai yang sama ketika dijumlahkan.")
fakta("deret_aritmetika", 53, "Deret aritmetika adalah suatu deret yang diperoleh dari menjumlahkan suku-suku pada barisan aritmetika.")
fakta("sn_aritmetika", 55, "Rumus untuk menghitung jumlah suku-suku deret aritmetika adalah")
fakta("contoh5", 55, "Jumlah 30 suku pertama deret tersebut adalah")
fakta("sn_geometri", 57, "Sehingga, rumus untuk menghitung jumlah suku-suku deret geometri adalah:")
fakta("r_satu", 57, "Apa yang terjadi jika r = 1 ?")
fakta("contoh6", 58, "Jadi, total hasil produksi sepeda hingga bulan Mei adalah sebanyak 14.520 unit.")
fakta("tak_hingga", 61, "Deret geometri tak hingga adalah deret geometri yang memiliki banyak sekali suku (tak terhingga banyaknya).")
fakta("konvergen", 61, "Deret geometri konvergen memiliki |r| < 1 dan jumlah deretnya menuju ke suatu nilai tertentu. (Konvergen artinya menuju ke suatu nilai tertentu.)")
fakta("divergen", 61, "Deret geometri divergen, yaitu deret geometri yang memiliki nilai |r| > 1.")
fakta("s_tak_hingga", 61, "(1 −r)S = a")
# C. Bunga (pp. 64-66)
fakta("bunga_simpanan", 64, "bunga simpanan adalah balas jasa dari bank kepada nasabah atas jasa nasabah menyimpan uangnya di bank.")
fakta("bunga_pinjaman", 64, "Sedangkan bunga pinjaman adalah balas jasa yang ditetapkan bank kepada peminjam atas pinjaman yang didapatkannya.")
fakta("bunga_tunggal", 64, "Bunga tunggal adalah bunga yang besarnya hanya ditentukan oleh pokok uangnya.")
fakta("angga", 64, "Angga menabung di bank sebesar Rp1.000.000,00. Setiap tahun dia mendapat bunga sebesar 5%.")
fakta("bunga_majemuk", 65, "Dalam perhitungan bunga majemuk, bunga yang didapat dalam periode sebelumnya dimasukkan ke pokok tabungan. Bunga periode berikutnya dihitung dengan nilai pokok tabungan yang baru.")
fakta("majemuk_tabel", 65, "5% × 1.050.000 = 52.500")
# For the book-error record only (not used by any question)
fakta("tabel_50", 65, "50% × 1.000.000 = 50.000")
fakta("rn_positif", 60, "makin besar nilai n maka nilai rn makin kecil, namun selalu merupakan bilangan positif.")
fakta("divergen_besar", 61, "Pada deret geometri divergen, Sn makin lama makin besar, tanpa batasan tertentu. Dikatakan nilai Sn = ±∞.")
fakta("gauss_usia", 52, "Gauss yang saat itu masih berusia 10 tahun")
fakta("gauss_5050", 53, "101 101 101 101 50.50")
fakta("ratio", 58, "Sebelum menentukan S5, harus dicari ratio (r) terlebih dahulu.")
fakta("bakteri_n10", 47, "Dalam 20 jam, terjadi pembelahan sebanyak 20 jam : 2 jam = · · · kali →n = 10.")
fakta("eksplorasi29", 66, "Tentukan bentuk umum untuk nilai uang setelah disimpan  tahun. U1 = . . .")
fakta("lingkaran", 64, "luas lingkaran terbesar adalah 1.368 cm2 dan luas lingkaran terkecil adalah 154 cm2.")
fakta("covid", 56, "Berikut data yang dihimpun dari Gugus Covid-19 kota tersebut.")
fakta("dua_jenis", 52, "Deret bilangan, terdiri atas deret aritmetika dan deret geometri.")
REKAMAN = {"tabel_50", "rn_positif", "divergen_besar", "gauss_usia", "gauss_5050", "ratio", "bakteri_n10",
           "eksplorasi29", "lingkaran", "covid", "dua_jenis"}
GAMBAR = set()


def ua(a, b, n):
    """U_{n} of an arithmetic sequence."""
    return a + (n - 1) * b


def sa(a, b, n):
    """S_{n} of an arithmetic series, summed term by term and checked against both formulas."""
    s = sum(ua(a, b, k) for k in range(1, n + 1))
    cek(s == F(n, 2) * (2 * a + (n - 1) * b) == F(n, 2) * (a + ua(a, b, n)))
    return s


def ug(a, r, n):
    """U_{n} of a geometric sequence."""
    return a * F(r) ** (n - 1)


def sg(a, r, n):
    """S_{n} of a geometric series, summed term by term and checked against both formulas."""
    s = sum(ug(a, r, k) for k in range(1, n + 1))
    if r != 1:
        cek(s == a * (F(r) ** n - 1) / (F(r) - 1) == a * (1 - F(r) ** n) / (1 - F(r)))
    return s


def rupiah(v):
    """A whole number with a thousands point."""
    cek(v == int(v))
    return f"{int(v):,}".replace(",", ".")


# ── What can be computed (every number the lessons use) ──
MEJA = {n: ua(4, 2, n) for n in range(1, 5)}
cek(MEJA == {1: 4, 2: 6, 3: 8, 4: 10} and all(ua(4, 2, n) == 2 * n + 2 for n in range(1, 30)))
cek(2 * 9 + 2 == 20 and ua(4, 2, 9) == 20)                                            # 20 orang → 9 meja
cek([ua(30, -5, n) for n in (1, 2, 3)] == [30, 25, 20])
GEDUNG = [ua(20, 4, n) for n in range(1, 6)]
cek(GEDUNG == [20, 24, 28, 32, 36] and ua(20, 4, 15) == 20 + 14 * 4 == 76)
b1 = F(18 - 9, 6 - 3)
cek(b1 == 3 and 9 - 2 * b1 == 3 and all(ua(3, 3, n) == 3 * n for n in range(1, 30)))  # Contoh 1
b2 = F(90000 - 70000, 9 - 5)
cek(b2 == 5000 and 70000 - 4 * b2 == 50000 and ua(50000, 5000, 9) == 90000)           # Contoh 2
KUE = [F(1, 2) ** k for k in (1, 2, 3)]
cek(KUE == [F(1, 2), F(1, 4), F(1, 8)])
LIPAT = [2 ** k for k in (1, 2, 3, 4)]
cek(LIPAT == [2, 4, 8, 16] and {F(LIPAT[i + 1], LIPAT[i]) for i in range(3)} == {2})
BAKTERI = [ug(2, 3, n) for n in (1, 2, 3, 4)]
cek(BAKTERI == [2, 6, 18, 54] and 20 // 2 == 10 and ug(2, 3, 11) == 2 * 3 ** 10 == 118098)
# p. 47 counts 10 divisions but stops at U₁₀ = 2 × 3⁹, the count after 18 hours.
cek(ug(2, 3, 10) == 2 * 3 ** 9 == 39366 != 118098)
cek(F(108, 4) == 27 == 3 ** 3 and ug(4, 3, 4) == 108)                                  # Contoh 3
cek(F(81, 16) == F(3, 2) ** 4 and ug(16, F(3, 2), 3) == 36 and ug(16, F(3, 2), 5) == 81)   # Contoh 4
JABAT = {n: sum(range(1, n)) for n in (2, 3, 4, 5)}
cek(JABAT == {2: 1, 3: 3, 4: 6, 5: 10} and all(JABAT[n] == n * (n - 1) // 2 for n in JABAT))
cek(sum(range(1, 101)) == 50 * 101 == 5050 == sa(1, 1, 100))                             # Gauss
cek(all(k + (101 - k) == 101 for k in range(1, 51)))
cek(sa(13, 3, 30) == 15 * (26 + 87) == 15 * 113 == 1695)                                # Contoh 5
cek(sg(5, 3, 4) == 5 + 15 + 45 + 135 == 200 == F(5 * 80, 2))
cek(sg(7, 1, 4) == 28 == 4 * 7)                                                          # r = 1
cek(F(3240, 120) == 27 and sg(120, 3, 5) == 120 * F(242, 2) == 120 * 121 == 14520)      # Contoh 6
cek([ug(120, 3, n) for n in range(1, 6)] == [120, 360, 1080, 3240, 9720])
KERTAS = [sg(F(1, 2), F(1, 2), n) for n in (1, 2, 3, 4)]
cek(KERTAS == [F(1, 2), F(3, 4), F(7, 8), F(15, 16)] and all(1 - KERTAS[i] == F(1, 2) ** (i + 1) for i in range(4)))
cek(F(1, 2) / (1 - F(1, 2)) == 1)
cek(F(10) / (1 - F(-1, 2)) == F(20, 3) and [ug(10, F(-1, 2), n) for n in (1, 2, 3, 4)] == [10, -5, F(5, 2), F(-5, 4)])
cek(abs(sg(10, F(-1, 2), 40) - F(20, 3)) < F(1, 10 ** 10))
cek(abs(F(-1, 2) ** 20) < F(1, 10 ** 6) and F(-1, 2) ** 3 < 0 < F(-1, 2) ** 4)         # rⁿ → 0, not always positive
cek(ug(1, 3, 5) == 81 and sg(1, 3, 5) == 121)
TUNGGAL = {n: ua(1050000, 50000, n) for n in (1, 2, 3, 4)}
cek(F(5, 100) * 1000000 == 50000 and TUNGGAL == {1: 1050000, 2: 1100000, 3: 1150000, 4: 1200000})
MAJEMUK = {n: ug(1050000, F(105, 100), n) for n in (1, 2, 3)}
cek(MAJEMUK == {1: 1050000, 2: 1102500, 3: 1157625})
cek(F(5, 100) * 1050000 == 52500 and F(5, 100) * 1102500 == 55125 and 1102500 + 55125 == 1157625)
cek(all(ug(1050000, F(105, 100), n) == 1000000 * F(105, 100) ** n for n in range(1, 10)))
cek(MAJEMUK[3] > TUNGGAL[3])
# BOOK INCONSISTENCIES (checked here, kept out of lessons and questions):
# p. 65: the table computes the 5% interest as «50% × 1.000.000 = 50.000».
cek(F(50, 100) * 1000000 == 500000 != 50000 == F(5, 100) * 1000000)
# p. 60: for |r| < 1, rⁿ is «selalu … positif», false for r < 0.
cek(F(-1, 2) ** 3 < 0)
# p. 61: divergent Sₙ «makin lama makin besar»; for r = −2 the partial sums swing in sign.
cek([sg(1, -2, n) for n in (1, 2, 3, 4)] == [1, -1, 3, -5])
# p. 64, Latihan 2.5 no. 10: area 154 gives r = 7 with π = 22/7, but 1.368 gives no whole radius.
cek(F(22, 7) * 7 ** 2 == 154 and F(1368 * 7, 22) != int(F(1368 * 7, 22)) and F(22, 7) * 21 ** 2 == 1386)
# p. 53: the illustration writes «50.50» for 5.050.

SUMBER = ("_Diadaptasi dari Matematika untuk SMA/MA/SMK/MAK Kelas X (Edisi Revisi), Dicky Susanto dkk., "
          "Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi, 2023, Bab 2._")

KURSUS = {
    "Judul kursus*": "Matematika Kelas X · Bab 2: Barisan dan Deret",
    "Mata pelajaran*": "Matematika",
    "Jenjang*": "SMA",
    "Kelas*": "Kelas X",
    "Konteks": "Akademik",
}

BAB = [(1, "Barisan dan Deret")]

PELAJARAN = [
    dict(no=1, judul="Barisan Aritmetika",
         ringkasan="Barisan aritmetika adalah barisan yang selisih dua suku berurutannya selalu tetap; suku ke-n dihitung dengan U_{n} = a + (n − 1)b.",
         tujuan="Kamu dapat mengenali barisan aritmetika, menentukan bedanya, dan menghitung suku ke-n.",
         bloom="Menerapkan",
         isi="""## Barisan bilangan

Sebuah meja segi empat dikelilingi 4 kursi. Jika beberapa meja disatukan memanjang, banyak kursinya:

- 1 meja → 4 kursi
- 2 meja → 6 kursi
- 3 meja → 8 kursi
- 4 meja → 10 kursi

Bilangan 4, 6, 8, 10, … disusun berdasarkan aturan tertentu. Pola bilangan seperti ini disebut **barisan bilangan**. Setiap bilangannya disebut suku: suku ke-1 ditulis U_{1}, suku ke-2 ditulis U_{2}, dan suku ke-n ditulis U_{n}. Bentuk umumnya U_{1}, U_{2}, U_{3}, …, U_{n}.

## Barisan aritmetika

Pada barisan 4, 6, 8, 10, selisih dua suku yang berdekatan selalu 2:

- U_{2} − U_{1} = 6 − 4 = 2
- U_{3} − U_{2} = 8 − 6 = 2
- U_{4} − U_{3} = 10 − 8 = 2

Barisan dengan beda atau selisih antara dua suku berurutan yang selalu tetap disebut **barisan aritmetika**. Bedanya dilambangkan dengan b:

b = U_{n} − U_{n−1}

Beda dapat bernilai negatif. Pada barisan 30, 25, 20, … bedanya 25 − 30 = −5.

## Rumus suku ke-n

Di sebuah gedung pertunjukan, baris ke-1 berisi 20 kursi, dan setiap baris berikutnya bertambah 4 kursi: 20, 24, 28, 32, 36, … Berapa kursi pada baris ke-15?

- baris ke-2 → 20 + (1 × 4) = 24
- baris ke-3 → 20 + (2 × 4) = 28
- baris ke-5 → 20 + (4 × 4) = 36
- baris ke-15 → 20 + (14 × 4) = 76

Suku pertama ditambah beda sebanyak (n − 1) kali. Jadi rumus suku ke-n barisan aritmetika adalah

U_{n} = a + (n − 1)b

dengan a suku pertama, b beda, dan n nomor suku. Baris ke-15 berisi **76** kursi.

Kembali ke meja tadi. Berapa meja yang perlu disatukan agar 20 orang dapat makan bersama? U_{n} = 4 + (n − 1) × 2 = 2n + 2, dan 2n + 2 = 20 memberi 2n = 18, jadi n = 9. Perlu **9** meja.

## Contoh 1 dan Contoh 2

**Contoh 1.** Suku ke-3 suatu barisan aritmetika adalah 9 dan suku ke-6 adalah 18. Tentukan rumus suku ke-n.

1. U_{6} − U_{3} = (a + 5b) − (a + 2b) = 3b, jadi 3b = 18 − 9 = 9 dan b = 3.
2. U_{3} = a + 2b = 9, jadi a = 9 − 6 = 3.
3. U_{n} = 3 + (n − 1) × 3 = **3n**.

**Contoh 2.** Rudi menabung setiap bulan, dan kenaikan nominal tabungannya antarbulan tetap. Pada bulan ke-5 ia menabung Rp70.000 dan pada bulan ke-9 Rp90.000. (a) Berapa selisih nominal tabungan antarbulan? (b) Berapa uang yang ditabung Rudi pertama kali?

1. U_{5} = a + 4b = 70.000 dan U_{9} = a + 8b = 90.000.
2. Kurangkan kedua persamaan: 4b = 20.000, jadi b = 5.000.
3. a + 4 × 5.000 = 70.000, jadi a = 50.000.

Jadi (a) selisihnya **Rp5.000** setiap bulan, dan (b) Rudi pertama kali menabung **Rp50.000**.

""" + SUMBER),
    dict(no=2, judul="Barisan Geometri",
         ringkasan="Barisan geometri adalah barisan yang rasio dua suku berurutannya selalu tetap; suku ke-n dihitung dengan U_{n} = a × r^{n−1}.",
         tujuan="Kamu dapat mengenali barisan geometri, menentukan rasionya, dan menghitung suku ke-n.",
         bloom="Menerapkan",
         isi="""## Pengali yang tetap

Lima anak berbagi sebuah kue. Anak pertama mengambil setengah kue dan memberikan sisanya kepada anak kedua. Anak kedua mengambil setengah dari yang diterimanya dan memberikan sisanya kepada anak ketiga, dan seterusnya. Bagian kue yang diambil:

- anak ke-1 → 1/2
- anak ke-2 → 1/4
- anak ke-3 → 1/8

Perbandingan kue yang diambil dengan kue yang diterima selalu setengah.

Contoh lain: selembar kertas dilipat menjadi dua bagian sama besar, lalu dilipat lagi, dan seterusnya.

- 1 kali lipat → 2 bagian
- 2 kali lipat → 4 bagian
- 3 kali lipat → 8 bagian
- 4 kali lipat → 16 bagian

Di sini pengalinya tetap: 4 : 2 = 8 : 4 = 16 : 8 = 2.

## Barisan geometri

Barisan dengan rasio antara dua suku berurutan yang selalu tetap disebut **barisan geometri**. Rasionya dilambangkan dengan r dan dicari dengan membagi dua suku yang berurutan:

r = U_{n}/U_{n−1}

Bandingkan: pada barisan aritmetika, suku berikutnya diperoleh dengan **menambahkan** beda; pada barisan geometri, dengan **mengalikan** rasio.

## Rumus suku ke-n

Dalam waktu dua jam, satu sel bakteri membelah menjadi 3. Mula-mula ada 2 sel. Berapa sel setelah 20 jam?

- U_{1} = 2 (mula-mula)
- U_{2} = 2 × 3 = 6 (setelah 2 jam)
- U_{3} = 2 × 3² = 18 (setelah 4 jam)
- U_{4} = 2 × 3³ = 54 (setelah 6 jam)

Suku pertama dikalikan rasio sebanyak (n − 1) kali. Jadi rumus suku ke-n barisan geometri adalah

U_{n} = a × r^{n−1}

dengan a suku pertama, r rasio, dan n nomor suku.

Dalam 20 jam terjadi 20 : 2 = 10 kali pembelahan. Karena U_{1} adalah keadaan mula-mula, keadaan setelah 10 kali pembelahan adalah suku ke-11: U_{11} = 2 × 3¹⁰ = **118.098** sel.

## Contoh 3 dan Contoh 4

**Contoh 3.** Suku pertama suatu barisan geometri adalah 4 dan suku ke-4 adalah 108. Tentukan rasionya.

1. U_{4} = a × r³, jadi 4 × r³ = 108.
2. r³ = 108 : 4 = 27, jadi r = ∛27 = **3**.

**Contoh 4.** Seutas tali dipotong menjadi 5 bagian yang panjangnya membentuk barisan geometri. Potongan terpendek 16 cm dan terpanjang 81 cm. Berapa panjang potongan ketiga?

1. a = 16 dan U_{5} = 16 × r⁴ = 81, jadi r⁴ = 81/16.
2. Semua panjang positif, jadi r = 3/2.
3. U_{3} = 16 × (3/2)² = 16 × 9/4 = **36 cm**.

## Coba pikirkan

Seorang teman berkata: jika rasio suatu barisan geometri negatif, semua sukunya negatif. Periksa pendapat itu dengan barisan 1, −2, 4, −8, …

""" + SUMBER),
    dict(no=3, judul="Deret Aritmetika",
         ringkasan="Deret aritmetika adalah jumlah suku-suku barisan aritmetika; jumlah n suku pertamanya S_{n} = n/2 × (a + U_{n}).",
         tujuan="Kamu dapat membedakan barisan dan deret serta menghitung jumlah n suku pertama deret aritmetika.",
         bloom="Menerapkan",
         isi="""## Dari barisan ke deret

Dalam satu kelompok, setiap pasangan berjabat tangan tepat satu kali. Banyak jabat tangannya:

- 2 orang → 1
- 3 orang → 1 + 2 = 3
- 4 orang → 1 + 2 + 3 = 6
- 5 orang → 1 + 2 + 3 + 4 = 10

Banyak jabat tangan itu adalah penjumlahan suku-suku sebuah barisan. **Deret bilangan** adalah jumlah suku-suku penyusun barisan bilangan. Tidak semua deret termasuk salah satu jenis tertentu; misalnya 1 + 4 + 9 + 16 + … bukan deret aritmetika dan bukan deret geometri. Bab ini mempelajari dua jenis deret, yaitu deret aritmetika dan deret geometri.

**Deret aritmetika** adalah deret yang diperoleh dari menjumlahkan suku-suku barisan aritmetika: U_{1} + U_{2} + U_{3} + … + U_{n}. Jumlah n suku pertamanya ditulis S_{n}.

## Cara Gauss

Carl Friedrich Gauss (1777–1855) adalah seorang matematikawan Jerman. Sebuah cerita terkenal menyebutkan bahwa semasa sekolah ia menjumlahkan 1 + 2 + 3 + … + 100 dengan cepat. Caranya: ia mengelompokkan suku-suku yang jumlahnya sama.

(1 + 100) + (2 + 99) + (3 + 98) + … + (50 + 51)

Ada 50 pasang, dan setiap pasang berjumlah 101. Jadi jumlahnya 50 × 101 = **5.050**.

## Rumus jumlah n suku pertama

Tulis S_{n} dua kali, sekali dari depan dan sekali dari belakang:

- S_{n} = a + (a + b) + … + (a + (n − 1)b)
- S_{n} = (a + (n − 1)b) + (a + (n − 2)b) + … + a

Jumlahkan kedua baris. Setiap pasangan suku yang sejajar berjumlah 2a + (n − 1)b, dan ada n pasangan:

2S_{n} = n × (2a + (n − 1)b)

Jadi rumus jumlah n suku pertama deret aritmetika adalah

S_{n} = n/2 × (2a + (n − 1)b) atau S_{n} = n/2 × (a + U_{n})

Periksa dengan cara Gauss: S_{100} = 100/2 × (1 + 100) = 50 × 101 = 5.050. Hasilnya sama.

## Contoh 5

Diketahui deret 13 + 16 + 19 + 22 + … Berapa jumlah 30 suku pertamanya?

1. a = 13, b = 16 − 13 = 3, dan n = 30.
2. S_{30} = 30/2 × (2 × 13 + (30 − 1) × 3) = 15 × (26 + 87) = 15 × 113.
3. Jadi S_{30} = **1.695**.

""" + SUMBER),
    dict(no=4, judul="Deret Geometri",
         ringkasan="Deret geometri adalah jumlah suku-suku barisan geometri; untuk r ≠ 1, S_{n} = a(rⁿ − 1)/(r − 1).",
         tujuan="Kamu dapat menghitung jumlah n suku pertama deret geometri dan memakainya dalam masalah sehari-hari.",
         bloom="Menerapkan",
         isi="""## Deret geometri

Deret geometri diperoleh dari menjumlahkan suku-suku barisan geometri:

a + ar + ar² + … + ar^{n−1}

Contoh: 5 + 15 + 45 + 135 adalah deret geometri dengan a = 5 dan r = 3. Jumlahnya 200.

## Rumus jumlah n suku pertama

Tulis S_{n}, lalu kalikan dengan r:

- S_{n} = a + ar + ar² + … + ar^{n−1}
- rS_{n} = ar + ar² + … + ar^{n−1} + arⁿ

Kurangkan baris pertama dari baris kedua. Suku-suku di tengah saling menghapus:

rS_{n} − S_{n} = arⁿ − a, jadi (r − 1)S_{n} = a(rⁿ − 1).

Jadi rumus jumlah n suku pertama deret geometri adalah

S_{n} = a(rⁿ − 1)/(r − 1) atau S_{n} = a(1 − rⁿ)/(1 − r), untuk r ≠ 1

Kedua bentuk memberi hasil yang sama. Periksa: S_{4} = 5 × (3⁴ − 1)/(3 − 1) = 5 × 80/2 = 200.

## Bagaimana jika r = 1?

Jika r = 1, penyebut r − 1 bernilai 0, jadi rumus di atas tidak dapat dipakai. Semua sukunya sama dengan a, sehingga S_{n} = a + a + … + a = n × a.

Contoh: 7 + 7 + 7 + 7 = 4 × 7 = 28.

## Contoh 6

Hasil produksi sebuah perusahaan sepeda pada tahun 2020 meningkat setiap bulan dan membentuk barisan geometri. Produksi bulan Januari 120 unit dan produksi bulan April 3.240 unit. Berapa total hasil produksi sampai bulan Mei?

1. a = 120 dan U_{4} = 120 × r³ = 3.240, jadi r³ = 27 dan r = 3.
2. Januari sampai Mei ada 5 bulan: S_{5} = 120 × (3⁵ − 1)/(3 − 1) = 120 × 242/2 = 120 × 121.
3. Jadi total produksinya **14.520** unit.

Periksa dengan menjumlahkan: 120 + 360 + 1.080 + 3.240 + 9.720 = 14.520.

""" + SUMBER),
    dict(no=5, judul="Deret Geometri Tak Hingga",
         ringkasan="Deret geometri tak hingga konvergen jika |r| < 1, dan jumlahnya S_{∞} = a/(1 − r); jika |r| ≥ 1, deretnya divergen.",
         tujuan="Kamu dapat menentukan apakah deret geometri tak hingga konvergen atau divergen dan menghitung jumlah deret yang konvergen.",
         bloom="Menganalisis",
         isi="""## Memotong kertas

Selembar kertas dipotong menjadi dua bagian sama besar. Satu potongan dipotong lagi menjadi dua, dan seterusnya. Besar potongan-potongannya 1/2, 1/4, 1/8, 1/16, … dari kertas awal. Jika potongan-potongan itu dikumpulkan:

- 1 potongan → 1/2
- 2 potongan → 1/2 + 1/4 = 3/4
- 3 potongan → 3/4 + 1/8 = 7/8
- 4 potongan → 7/8 + 1/16 = 15/16

Bagian yang belum terkumpul sama dengan potongan terakhir, dan bagian itu makin kecil. Jumlahnya makin dekat ke 1, yaitu kertas utuh.

## Konvergen dan divergen

**Deret geometri tak hingga** adalah deret geometri yang memiliki banyak sekali suku (tak terhingga banyaknya). Ada dua jenis:

- **Deret geometri konvergen** memiliki |r| < 1, dan jumlah deretnya menuju ke suatu nilai tertentu. Konvergen artinya menuju ke suatu nilai tertentu.
- **Deret geometri divergen** memiliki |r| ≥ 1, dan jumlahnya tidak menuju ke suatu nilai tertentu:
  - jika |r| > 1, suku-sukunya makin jauh dari 0;
  - jika r = 1, misalnya 3 + 3 + 3 + …, jumlahnya terus bertambah: 3, 6, 9, 12, …;
  - jika r = −1, misalnya 1 − 1 + 1 − 1 + …, jumlah sementaranya 1, 0, 1, 0, … berganti-ganti dan tidak menuju satu nilai.

Contoh: 1/2 + 1/4 + 1/8 + … konvergen (r = 1/2), sedangkan 1 + 3 + 9 + 27 + … divergen (r = 3).

## Rumus jumlah deret konvergen

Misalkan S = a + ar + ar² + ar³ + … dengan |r| < 1.

- rS = ar + ar² + ar³ + …
- S − rS = a, jadi (1 − r)S = a.

S_{∞} = a/(1 − r), untuk |r| < 1

Mengapa hanya untuk |r| < 1? Pada S_{n} = a(1 − rⁿ)/(1 − r), jika |r| < 1 maka rⁿ makin dekat ke 0 ketika n makin besar, sehingga S_{n} makin dekat ke a/(1 − r).

Periksa dengan kertas tadi: a = 1/2 dan r = 1/2, jadi S_{∞} = (1/2)/(1 − 1/2) = (1/2)/(1/2) = **1**, yaitu kertas utuh.

## Contoh: rasio negatif

Tentukan jumlah deret 10 − 5 + 5/2 − 5/4 + …

1. a = 10 dan r = −5 : 10 = −1/2. Karena |r| = 1/2 < 1, deretnya konvergen.
2. S_{∞} = 10/(1 − (−1/2)) = 10/(3/2) = **20/3**.

Suku-sukunya berganti tanda (10, −5, 5/2, −5/4, …), tetapi makin dekat ke 0, dan jumlahnya menuju 20/3.

""" + SUMBER),
    dict(no=6, judul="Bunga Tunggal dan Bunga Majemuk",
         ringkasan="Nilai uang dengan bunga tunggal membentuk barisan aritmetika; nilai uang dengan bunga majemuk membentuk barisan geometri.",
         tujuan="Kamu dapat membedakan bunga tunggal dan bunga majemuk serta menghitung nilai uang dengan barisan aritmetika dan barisan geometri.",
         bloom="Menerapkan",
         isi="""## Bunga simpanan dan bunga pinjaman

Jika kamu menabung di bank, kamu mendapat bunga. Jika kamu meminjam uang dari bank, bank mengenakan bunga. Menurut Otoritas Jasa Keuangan, **bunga simpanan** adalah balas jasa dari bank kepada nasabah atas jasa nasabah menyimpan uangnya di bank. **Bunga pinjaman** adalah balas jasa yang ditetapkan bank kepada peminjam atas pinjaman yang didapatkannya.

Ada dua jenis bunga, yaitu bunga tunggal dan bunga majemuk.

## Bunga tunggal

**Bunga tunggal** adalah bunga yang besarnya hanya ditentukan oleh pokok uangnya. Berapa pun lamanya uang disimpan, bunganya hanya bergantung pada nilai pokok.

Angga menabung Rp1.000.000 dengan bunga tunggal 5% per tahun. Bunga setiap tahun 5% × 1.000.000 = 50.000.

- tahun ke-1 → 1.000.000 + 50.000 = 1.050.000
- tahun ke-2 → 1.050.000 + 50.000 = 1.100.000
- tahun ke-3 → 1.100.000 + 50.000 = 1.150.000
- tahun ke-4 → 1.150.000 + 50.000 = 1.200.000

Nilai uangnya membentuk **barisan aritmetika** dengan U_{1} = 1.050.000 dan b = 50.000. Nilai uang setelah n tahun:

U_{n} = 1.050.000 + (n − 1) × 50.000

## Bunga majemuk

Dalam perhitungan **bunga majemuk**, bunga yang didapat dalam periode sebelumnya dimasukkan ke pokok tabungan. Bunga periode berikutnya dihitung dengan nilai pokok tabungan yang baru.

Misalkan tabungan Angga berbunga majemuk 5% per tahun:

- tahun ke-1 → bunga 5% × 1.000.000 = 50.000, tabungan 1.050.000
- tahun ke-2 → bunga 5% × 1.050.000 = 52.500, tabungan 1.102.500
- tahun ke-3 → bunga 5% × 1.102.500 = 55.125, tabungan 1.157.625

Setiap tahun tabungannya dikalikan 1 + 5% = 1,05. Nilai uangnya membentuk **barisan geometri** dengan U_{1} = 1.050.000 dan r = 1,05. Nilai uang setelah n tahun:

U_{n} = 1.050.000 × 1,05^{n−1}

Setelah 3 tahun, bunga majemuk memberi Rp1.157.625, lebih banyak daripada bunga tunggal, Rp1.150.000.

## Rangkuman Bab 2

- Barisan aritmetika: b = U_{n} − U_{n−1} dan U_{n} = a + (n − 1)b.
- Barisan geometri: r = U_{n}/U_{n−1} dan U_{n} = a × r^{n−1}.
- Deret aritmetika: S_{n} = n/2 × (2a + (n − 1)b) = n/2 × (a + U_{n}).
- Deret geometri: S_{n} = a(rⁿ − 1)/(r − 1) untuk r ≠ 1; deret tak hingga konvergen jika |r| < 1, dengan S_{∞} = a/(1 − r).
- Bunga tunggal membentuk barisan aritmetika; bunga majemuk membentuk barisan geometri.

""" + SUMBER),
]

# Statements that are false or doubtful outside the book, or book errors, stay out of the lessons.
DILUAR = ("berusia 10 tahun", "kelas 4 SD", "selalu merupakan bilangan positif", "±∞", "50%", "1.368", "ratio",
          "Covid", "39.366", "50.50", "makin lama makin besar", "U_{10} = 2 × 3⁹",
          "terdiri atas deret aritmetika dan deret geometri", "memiliki |r| > 1.")
for _p in PELAJARAN:
    cek(3 <= _p["isi"].count("\n## ") + _p["isi"].startswith("## ") <= 6, f"lesson {_p['no']}: 3-6 pages")
    cek(_p["isi"].rstrip().endswith(SUMBER), f"lesson {_p['no']}: attribution last")
    cek(_p["isi"].count("Coba pikirkan") <= 1, f"lesson {_p['no']}: at most one Coba pikirkan")
    cek(not any(w in _p["isi"] for w in DILUAR), f"lesson {_p['no']}: {[w for w in DILUAR if w in _p['isi']]}")
    notasi(_p["isi"], f"lesson {_p['no']}")
    notasi(_p["ringkasan"], f"lesson {_p['no']} ringkasan")
# Divergence covers |r| = 1 (p. 61 names only |r| > 1): the lesson classifies r = 1 and r = −1.
_L5 = PELAJARAN[4]["isi"]
cek("**Deret geometri divergen** memiliki |r| ≥ 1" in _L5 and "jika r = 1, misalnya 3 + 3 + 3 + …" in _L5
    and "jika r = −1, misalnya 1 − 1 + 1 − 1 + …" in _L5 and "jika |r| ≥ 1, deretnya divergen" in PELAJARAN[4]["ringkasan"])
cek(_L5.count("makin jauh dari 0") == _L5.count("jika |r| > 1, suku-sukunya makin jauh dari 0") == 1)
cek([sg(3, 1, n) for n in (1, 2, 3, 4)] == [3, 6, 9, 12] and [sg(1, -1, n) for n in (1, 2, 3, 4)] == [1, 0, 1, 0])
cek(all(sg(1, -1, n) in (0, 1) for n in range(1, 50)) and sg(3, 1, 1000) == 3000)
# p. 52 says every series is arithmetic or geometric; 1 + 4 + 9 + 16 is neither.
cek(len({4 - 1, 9 - 4, 16 - 9}) > 1 and len({F(4, 1), F(9, 4), F(16, 9)}) > 1)
cek("Bab ini mempelajari dua jenis deret" in PELAJARAN[2]["isi"])
# Every formula with a denominator that can vanish states its condition next to it.
cek(sum(_p["isi"].count("S_{n} = a(1 − rⁿ)/(1 − r), untuk r ≠ 1") for _p in PELAJARAN) == 1)
cek(sum(_p["isi"].count("S_{∞} = a/(1 − r), untuk |r| < 1") for _p in PELAJARAN) == 1)

# ── Misconceptions: the book has no Miskonsepsi section; these come from the distractors.
MISKONSEPSI = {
    "SMA10-M-B2-01": ("Tanda beda keliru",
                      "Beda dihitung dari suku sebelumnya dikurangi suku sesudahnya, sehingga tandanya terbalik.",
                      "Hitung b = U_{2} − U_{1}: suku sesudah dikurangi suku sebelum. Barisan yang turun bedanya negatif."),
    "SMA10-M-B2-02": ("Suku dan beda atau rasio tertukar",
                      "Yang ditulis suku lain dari barisan, bukan beda atau rasionya, atau selisih dua suku yang tidak berdekatan.",
                      "Beda dan rasio selalu dihitung dari dua suku yang berdekatan."),
    "SMA10-M-B2-03": ("Banyak langkah n, bukan n − 1",
                      "Beda atau rasio dipakai sebanyak n kali, padahal dari U_{1} ke U_{n} hanya ada n − 1 langkah.",
                      "Tulis U_{1}, U_{2}, U_{3} dan hitung berapa kali beda ditambahkan atau rasio dikalikan."),
    "SMA10-M-B2-04": ("Aritmetika dan geometri tertukar",
                      "Barisan yang dikalikan tetap dianggap bertambah tetap, atau sebaliknya.",
                      "Periksa selisih dan hasil bagi dua suku berurutan: yang tetap menentukan jenis barisannya."),
    "SMA10-M-B2-05": ("Rasio keliru",
                      "Rasio dihitung terbalik (suku sebelum dibagi suku sesudah) atau dianggap sama dengan selisih.",
                      "Hitung r = U_{2}/U_{1} dan periksa bahwa U_{1} × r = U_{2}."),
    "SMA10-M-B2-06": ("Rumus suku ke-n geometri keliru",
                      "Suku pertama ikut dipangkatkan, atau rasio dikalikan dengan nomor suku.",
                      "Hitung r^{n−1} dahulu, lalu kalikan dengan a."),
    "SMA10-M-B2-07": ("Jumlah deret aritmetika keliru",
                      "Hasil tidak dibagi 2, atau yang dihitung hanya suku terakhir atau jumlah suku pertama dan terakhir.",
                      "Pasangkan suku depan dan belakang seperti Gauss: ada n/2 pasang, masing-masing a + U_{n}."),
    "SMA10-M-B2-08": ("Barisan dan deret tertukar",
                      "Suku ke-n dianggap jumlah, atau jumlah dianggap suku.",
                      "Barisan adalah daftar suku; deret adalah jumlah suku-suku itu."),
    "SMA10-M-B2-09": ("Jumlah deret geometri keliru",
                      "Pada S_{n} = a(rⁿ − 1)/(r − 1), dikurangi 1 atau pembagian dengan r − 1 terlupa.",
                      "Periksa rumus dengan menjumlahkan beberapa suku pertama satu per satu."),
    "SMA10-M-B2-10": ("Syarat konvergen keliru",
                      "Deret dianggap konvergen karena sukunya positif atau sama, bukan karena |r| < 1.",
                      "Hitung r, lalu periksa apakah |r| < 1."),
    "SMA10-M-B2-11": ("Rumus jumlah tak hingga keliru",
                      "Dipakai a/r, a/(1 + r), atau 1 − r tertukar dengan r.",
                      "Turunkan lagi: S − rS = a, jadi S_{∞} = a/(1 − r)."),
    "SMA10-M-B2-12": ("Jumlah beberapa suku dianggap jumlah tak hingga",
                      "Hanya beberapa suku pertama yang dijumlahkan, padahal deretnya tidak berhenti.",
                      "Hitung S_{∞} dengan rumus, lalu bandingkan dengan jumlah beberapa suku pertama."),
    "SMA10-M-B2-13": ("Bunga tunggal dan majemuk tertukar",
                      "Bunga majemuk dihitung seperti bunga tunggal dari pokok awal, atau sebaliknya.",
                      "Tulis pokok setiap tahun: tetap pada bunga tunggal, bertambah pada bunga majemuk."),
    "SMA10-M-B2-14": ("Bunga, nilai uang, dan lama periode tertukar",
                      "Yang ditulis besar bunga padahal yang ditanya nilai uang, atau banyak tahunnya salah dihitung.",
                      "Buat daftar tahun demi tahun: pokok, bunga, dan nilai uang di akhir tahun."),
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



# ── Pemetaan awal (pre-test): a beda, a rasio, a sum, a simple interest.
cek(11 - 7 == 4 and 7 - 11 == -4 and ua(7, 4, 5) == 23)
soal("PA1", 1, "Beda barisan aritmetika 7, 11, 15, 19, … adalah ...", "A", [
    ("4", True, "Benar. b = U_{2} − U_{1} = 11 − 7 = 4, dan selisih suku-suku berikutnya juga 4.", "", "=aritmetika_def"),
    ("−4", False, "Suku sebelum dikurangi suku sesudah (7 − 11). Beda dihitung U_{2} − U_{1} = 11 − 7 = 4.", "SMA10-M-B2-01", "=beda"),
    ("7", False, "Itu suku pertama. Beda adalah selisih dua suku berurutan.", "SMA10-M-B2-02", "=beda"),
    ("23", False, "Itu suku berikutnya (19 + 4). Yang ditanya bedanya, yaitu 4.", "SMA10-M-B2-02", "=beda"),
], guna="Pemetaan awal")
cek(F(6, 3) == 2 and F(3, 6) == F(1, 2) and 6 - 3 == 3 and 24 * 2 == 48)
soal("PA2", 2, "Rasio barisan geometri 3, 6, 12, 24, … adalah ...", "C", [
    ("2", True, "Benar. r = U_{2}/U_{1} = 6/3 = 2, dan 12/6 = 24/12 = 2.", "", "=geometri_def"),
    ("3", False, "Itu selisih 6 − 3, bukan hasil bagi. Selisihnya pun tidak tetap (6, lalu 12). Rasio adalah hasil bagi dua suku berurutan.", "SMA10-M-B2-05", "=rasio_bagi"),
    ("1/2", False, "Pembagiannya terbalik (3/6). Rasio = suku sesudah dibagi suku sebelum.", "SMA10-M-B2-05", "=rasio_bagi"),
    ("48", False, "Itu suku berikutnya (24 × 2). Yang ditanya rasionya, yaitu 2.", "SMA10-M-B2-02", "=rasio_bagi"),
], guna="Pemetaan awal")
cek(sa(1, 1, 10) == 55 and 5 * 10 == 50 and 10 * 11 == 110 and sa(1, 1, 9) == 45)
soal("PA3", 3, "Hasil 1 + 2 + 3 + … + 10 adalah ...", "B", [
    ("55", True, "Benar. Pasangkan (1 + 10) + (2 + 9) + … + (5 + 6): ada 5 pasang yang masing-masing berjumlah 11, jadi 5 × 11 = 55.", "", "=gauss"),
    ("50", False, "Banyak pasangan dikalikan suku terakhir (5 × 10). Setiap pasang berjumlah 1 + 10 = 11.", "SMA10-M-B2-07", "=gauss"),
    ("110", False, "10 × 11 belum dibagi 2. Setiap suku dihitung dua kali, jadi hasilnya dibagi 2.", "SMA10-M-B2-07", "=sn_aritmetika"),
    ("45", False, "Suku 10 terlewat (1 + 2 + … + 9 = 45).", "SMA10-M-B2-03", "=deret_aritmetika"),
], guna="Pemetaan awal")
cek(F(10, 100) * 200000 == 20000 and 200000 + 20000 == 220000 and F(1, 100) * 200000 == 2000 and 200000 - 20000 == 180000)
soal("PA4", 6, "Dina menabung Rp200.000 dengan bunga tunggal 10% per tahun. Besar bunga yang ia terima setiap tahun adalah ...", "D", [
    ("Rp20.000", True, "Benar. Bunga = 10% × 200.000 = 20.000, dan pada bunga tunggal besarnya sama setiap tahun.", "", "=bunga_tunggal"),
    ("Rp220.000", False, "Itu nilai tabungan setelah satu tahun (200.000 + 20.000). Yang ditanya besar bunganya.", "SMA10-M-B2-14", "=bunga_tunggal"),
    ("Rp2.000", False, "Itu 1% dari 200.000. 10% dari 200.000 adalah 20.000.", "SMA10-M-B2-14", "=bunga_tunggal"),
    ("Rp180.000", False, "Bunga dikurangkan dari pokok. Bunga simpanan diterima penabung, jadi tabungannya bertambah.", "SMA10-M-B2-14", "=bunga_simpanan"),
], guna="Pemetaan awal")

# ── Cek penguasaan (post-test): every lesson; fresh numbers, no Contoh, Latihan or Uji Kompetensi
# item with its numbers barely changed.
cek(ua(5, 4, 20) == 81 and 5 + 20 * 4 == 85 and 4 * 20 == 80 and ua(5, 4, 19) == 77)
soal("PB1", 1, "Suku ke-20 barisan aritmetika 5, 9, 13, 17, … adalah ...", "B", [
    ("81", True, "Benar. a = 5, b = 4, jadi U_{20} = 5 + (20 − 1) × 4 = 5 + 76 = 81.", "", "=un_aritmetika"),
    ("85", False, "Beda ditambahkan 20 kali (5 + 20 × 4). Dari U_{1} ke U_{20} hanya ada 19 langkah.", "SMA10-M-B2-03", "=un_aritmetika"),
    ("80", False, "Nomor suku dikalikan beda saja (20 × 4). Suku pertama 5 juga harus diperhitungkan: U_{20} = 5 + 19 × 4.", "SMA10-M-B2-03", "=un_aritmetika"),
    ("77", False, "Itu U_{19} = 5 + 18 × 4. Untuk U_{20}, beda ditambahkan 19 kali.", "SMA10-M-B2-03", "=un_aritmetika"),
], guna="Cek penguasaan", sulit="Mudah")
cek(ua(18, 3, 15) == 60 and ua(18, 3, 14) == 57 and 60 // 3 == 20 and 60 - 18 == 42)
soal("PB2", 1, "Baris pertama sebuah tribun berisi 18 kursi, dan setiap baris berikutnya berisi 3 kursi lebih banyak. Baris ke berapa yang berisi 60 kursi?", "D", [
    ("15", True, "Benar. 18 + (n − 1) × 3 = 60, jadi (n − 1) × 3 = 42, n − 1 = 14, dan n = 15.", "", "=un_aritmetika"),
    ("14", False, "Itu nilai n − 1. Nomor barisnya n = 14 + 1 = 15.", "SMA10-M-B2-03", "=un_aritmetika"),
    ("20", False, "60 dibagi beda (60 : 3). Suku pertama 18 belum diperhitungkan.", "SMA10-M-B2-03", "=un_aritmetika"),
    ("42", False, "Itu selisih kursinya (60 − 18), bukan nomor baris. Selisih itu masih dibagi beda 3.", "SMA10-M-B2-02", "=un_aritmetika"),
], guna="Cek penguasaan", sulit="Sulit")
cek(ug(2, 3, 6) == 486 and ug(2, 3, 7) == 1458 and (2 * 3) ** 5 != 486 and 3 ** 6 == 729 and ua(2, 4, 6) == 22)
soal("PB3", 2, "Suku ke-6 barisan geometri 2, 6, 18, … adalah ...", "A", [
    ("486", True, "Benar. a = 2, r = 3, jadi U_{6} = 2 × 3⁵ = 2 × 243 = 486.", "", "=un_geometri"),
    ("1.458", False, "Rasio dikalikan 6 kali (2 × 3⁶). Dari U_{1} ke U_{6} hanya ada 5 langkah.", "SMA10-M-B2-03", "=un_geometri"),
    ("729", False, "Suku pertama tidak dipakai sebagai pengali (3⁶). U_{6} = a × r⁵ = 2 × 3⁵.", "SMA10-M-B2-06", "=un_geometri"),
    ("22", False, "Barisan dianggap aritmetika dengan beda 4 (2 + 5 × 4). Suku-sukunya dikalikan 3, bukan ditambah 4.", "SMA10-M-B2-04", "=geometri_def"),
], guna="Cek penguasaan", sulit="Sedang")
cek(sa(3, 2, 12) == 168 and ua(3, 2, 12) == 25 and 12 * (3 + 25) == 336 and F(12, 2) * (2 * 3 + 12 * 2) == 180)
soal("PB4", 3, "Kaleng disusun bertingkat: 3 kaleng di tingkat paling atas, dan setiap tingkat di bawahnya berisi 2 kaleng lebih banyak. Susunan itu terdiri atas 12 tingkat. Banyak seluruh kaleng adalah ...", "C", [
    ("168", True, "Benar. U_{12} = 3 + 11 × 2 = 25, jadi S_{12} = 12/2 × (3 + 25) = 6 × 28 = 168.", "", "=sn_aritmetika"),
    ("25", False, "Itu banyak kaleng di tingkat ke-12 saja. Yang ditanya jumlah seluruh tingkat.", "SMA10-M-B2-08", "=deret_aritmetika"),
    ("336", False, "12 × (3 + 25) belum dibagi 2. S_{n} = n/2 × (a + U_{n}).", "SMA10-M-B2-07", "=sn_aritmetika"),
    ("180", False, "Pada 2a + (n − 1)b, n − 1 diganti n (6 × (6 + 12 × 2)). Seharusnya 6 × (6 + 11 × 2) = 168.", "SMA10-M-B2-03", "=sn_aritmetika"),
], guna="Cek penguasaan", sulit="Sedang")
cek(sg(2000, 2, 6) == 126000 and ug(2000, 2, 6) == 64000 and 2000 * 2 ** 6 == 128000 and 2000 * 6 == 12000)
soal("PB5", 4, "Pada minggu pertama Sinta menyisihkan Rp2.000. Setiap minggu berikutnya ia menyisihkan dua kali lipat dari minggu sebelumnya. Jumlah uang yang ia sisihkan selama 6 minggu adalah ...", "C", [
    ("Rp126.000", True, "Benar. a = 2.000, r = 2, jadi S_{6} = 2.000 × (2⁶ − 1)/(2 − 1) = 2.000 × 63 = 126.000.", "", "=sn_geometri"),
    ("Rp64.000", False, "Itu uang yang disisihkan pada minggu ke-6 saja (2.000 × 2⁵). Yang ditanya jumlah enam minggu.", "SMA10-M-B2-08", "=sn_geometri"),
    ("Rp128.000", False, "Pada rⁿ − 1, bagian −1 terlupa (2.000 × 2⁶). S_{6} = 2.000 × (64 − 1).", "SMA10-M-B2-09", "=sn_geometri"),
    ("Rp12.000", False, "Uangnya dianggap tetap 2.000 setiap minggu (6 × 2.000). Setiap minggu uangnya dikali 2.", "SMA10-M-B2-04", "=geometri_def"),
], guna="Cek penguasaan", sulit="Sedang")
cek(F(18) / (1 - F(1, 3)) == 27 and 18 + 6 + 2 == 26 and F(18) / (1 + F(1, 3)) == F(27, 2) and F(18) / F(1, 3) == 54)
soal("PB6", 5, "Jumlah deret geometri tak hingga 18 + 6 + 2 + … adalah ...", "A", [
    ("27", True, "Benar. a = 18, r = 6/18 = 1/3, dan |r| < 1, jadi S_{∞} = 18/(1 − 1/3) = 18/(2/3) = 27.", "", "=s_tak_hingga"),
    ("26", False, "Hanya tiga suku yang dijumlahkan (18 + 6 + 2). Deretnya tidak berhenti, jadi dipakai S_{∞} = a/(1 − r).", "SMA10-M-B2-12", "=konvergen"),
    ("13,5", False, "Dipakai a/(1 + r) = 18/(4/3). Rumusnya S_{∞} = a/(1 − r).", "SMA10-M-B2-11", "=s_tak_hingga"),
    ("54", False, "Dipakai a/r = 18/(1/3). Rumusnya S_{∞} = a/(1 − r).", "SMA10-M-B2-11", "=s_tak_hingga"),
], guna="Cek penguasaan", sulit="Sedang")
cek(ug(4000000, F(11, 10), 3) == 4840000 and 4000000 + 2 * 400000 == 4800000 and ug(4000000, F(11, 10), 2) == 4400000)
soal("PB7", 6, "Pak Budi menabung Rp4.000.000 dengan bunga majemuk 10% per tahun. Nilai tabungannya setelah 2 tahun adalah ...", "D", [
    ("Rp4.840.000", True, "Benar. Tahun ke-1: 4.000.000 × 1,1 = 4.400.000. Tahun ke-2: 4.400.000 × 1,1 = 4.840.000.", "", "=bunga_majemuk"),
    ("Rp4.800.000", False, "Bunga tahun ke-2 dihitung dari pokok awal (2 × 400.000). Pada bunga majemuk, bunga tahun ke-2 dihitung dari 4.400.000.", "SMA10-M-B2-13", "=bunga_majemuk"),
    ("Rp4.400.000", False, "Itu nilai tabungan setelah 1 tahun. Masih ada satu tahun lagi.", "SMA10-M-B2-14", "=bunga_majemuk"),
    ("Rp840.000", False, "Itu besar seluruh bunganya (4.840.000 − 4.000.000). Yang ditanya nilai tabungannya.", "SMA10-M-B2-14", "=bunga_majemuk"),
], guna="Cek penguasaan", sulit="Sedang")
soal("PB8", 5, "Deret geometri tak hingga dengan rasio r mempunyai jumlah yang menuju ke suatu nilai tertentu (konvergen) jika ...", "B", [
    ("−1 < r < 1", True, "Benar. Deret geometri konvergen memiliki |r| < 1, yaitu −1 < r < 1; untuk nilai itu rⁿ makin dekat ke 0.", "", "=konvergen"),
    ("r > 1 atau r < −1", False, "Itu |r| > 1, yang membuat deret divergen: suku-sukunya makin jauh dari 0.", "SMA10-M-B2-10", "=divergen"),
    ("r > 0", False, "Tanda rasio tidak menentukan. Deret 1 + 2 + 4 + … memiliki r = 2 > 0, tetapi divergen.", "SMA10-M-B2-10", "=konvergen"),
    ("r = 1", False, "Jika r = 1, semua suku sama dengan a, dan jumlahnya n × a tidak menuju suatu nilai tertentu (untuk a ≠ 0), jadi deretnya divergen.", "SMA10-M-B2-10", "=r_satu"),
], guna="Cek penguasaan", sulit="Sedang")

# ── Latihan (practice), by lesson.
cek(17 - 20 == -3 and 14 - 17 == -3 and 14 - 3 == 11 and 14 - 20 == -6)
soal("LT1", 1, "Beda barisan aritmetika 20, 17, 14, … adalah ...", "D", [
    ("−3", True, "Benar. b = 17 − 20 = −3. Barisannya turun, jadi bedanya negatif.", "", "=beda"),
    ("3", False, "Suku sebelum dikurangi suku sesudah (20 − 17). Beda = U_{2} − U_{1} = −3.", "SMA10-M-B2-01", "=beda"),
    ("11", False, "Itu suku berikutnya (14 − 3). Yang ditanya bedanya.", "SMA10-M-B2-02", "=beda"),
    ("−6", False, "Itu selisih U_{3} dan U_{1} (14 − 20). Beda dihitung dari dua suku yang berdekatan.", "SMA10-M-B2-02", "=beda"),
])
cek({7 - 3, 11 - 7, 15 - 11} == {4} and {6 - 3, 12 - 6} == {3, 6} and {4 - 1, 9 - 4, 16 - 9} == {3, 5, 7} and {3 - 1, 6 - 3, 10 - 6} == {2, 3, 4})
soal("LT2", 1, "Barisan manakah yang merupakan barisan aritmetika?", "B", [
    ("3, 7, 11, 15", True, "Benar. Selisih dua suku berurutan selalu 4.", "", "=aritmetika_def"),
    ("3, 6, 12, 24", False, "Selisihnya 3, 6, 12 (tidak tetap). Barisan ini dikalikan 2, jadi barisan geometri.", "SMA10-M-B2-04", "=aritmetika_def"),
    ("1, 4, 9, 16", False, "Selisihnya 3, 5, 7 (tidak tetap).", "SMA10-M-B2-04", "=aritmetika_def"),
    ("1, 3, 6, 10", False, "Selisihnya 2, 3, 4 (tidak tetap).", "SMA10-M-B2-04", "=aritmetika_def"),
])
cek(4 * 12 - 1 == 47 and 4 * 12 == 48 and 4 * 11 - 1 == 43 and 4 * 13 - 1 == 51)
soal("LT3", 1, "Rumus suku ke-n suatu barisan adalah U_{n} = 4n − 1. Nilai U_{12} adalah ...", "A", [
    ("47", True, "Benar. U_{12} = 4 × 12 − 1 = 48 − 1 = 47.", "", "=bentuk_umum"),
    ("48", False, "Bagian −1 terlupa. U_{12} = 4 × 12 − 1.", "SMA10-M-B2-02", "=bentuk_umum"),
    ("43", False, "Itu U_{11} = 4 × 11 − 1. Ganti n dengan 12.", "SMA10-M-B2-03", "=bentuk_umum"),
    ("51", False, "Itu U_{13} = 4 × 13 − 1. Ganti n dengan 12.", "SMA10-M-B2-03", "=bentuk_umum"),
])
cek(all(ua(10, -2, n) == 12 - 2 * n for n in range(1, 20)) and ua(10, 2, 3) == 8 + 2 * 3 and 10 - 2 * 1 != ua(10, -2, 1))
soal("LT4", 1, "Suku pertama suatu barisan aritmetika 10 dan bedanya −2. Rumus suku ke-n barisan itu adalah ...", "C", [
    ("U_{n} = 12 − 2n", True, "Benar. U_{n} = 10 + (n − 1)(−2) = 10 − 2n + 2 = 12 − 2n. Periksa: U_{1} = 10.", "", "=un_aritmetika"),
    ("U_{n} = 10 − 2n", False, "n − 1 diganti n. Periksa: rumus ini memberi U_{1} = 8, padahal U_{1} = 10.", "SMA10-M-B2-03", "=un_aritmetika"),
    ("U_{n} = 8 + 2n", False, "Tanda beda terbalik (b = 2). Barisannya turun, jadi bedanya −2.", "SMA10-M-B2-01", "=un_aritmetika"),
    ("U_{n} = 10n − 2", False, "Suku pertama dikalikan n dan beda ditambahkan sekali. U_{n} = a + (n − 1)b.", "SMA10-M-B2-02", "=un_aritmetika"),
])
cek({F(-6, 3), F(12, -6), F(-24, 12)} == {-2} and {-6 - (-3), -9 - (-6)} == {-3} and {6 - 3, 9 - 6, 12 - 9} == {3})
soal("LT5", 2, "Barisan manakah yang merupakan barisan geometri?", "A", [
    ("3, −6, 12, −24", True, "Benar. Setiap suku dikalikan −2: −6 : 3 = 12 : (−6) = −2. Rasio boleh negatif.", "", "=geometri_def"),
    ("−3, −6, −9, −12", False, "Selisihnya tetap −3, jadi ini barisan aritmetika. Hasil baginya 2, lalu 3/2 (tidak tetap).", "SMA10-M-B2-04", "=geometri_def"),
    ("3, 6, 9, 12", False, "Selisihnya tetap 3, jadi ini barisan aritmetika. Hasil baginya 2, lalu 3/2 (tidak tetap).", "SMA10-M-B2-04", "=geometri_def"),
    ("3, 6, 12, 21", False, "Hasil baginya 2, 2, lalu 7/4 (tidak tetap).", "SMA10-M-B2-05", "=geometri_def"),
])
cek(ug(5, 2, 4) == 40 and 5 * 2 ** 4 == 80 and (5 * 2) ** 3 == 1000 and ua(5, 2, 4) == 11)
soal("LT6", 2, "Rumus suku ke-n suatu barisan geometri adalah U_{n} = 5 × 2^{n−1}. Nilai U_{4} adalah ...", "D", [
    ("40", True, "Benar. U_{4} = 5 × 2³ = 5 × 8 = 40.", "", "=un_geometri"),
    ("80", False, "Pangkatnya n, bukan n − 1 (5 × 2⁴). Pangkatnya 4 − 1 = 3.", "SMA10-M-B2-03", "=un_geometri"),
    ("1.000", False, "Suku pertama ikut dipangkatkan ((5 × 2)³). Hanya 2 yang dipangkatkan.", "SMA10-M-B2-06", "=un_geometri"),
    ("11", False, "Rumusnya dibaca sebagai barisan aritmetika (5 + 3 × 2). Rasio 2 dikalikan, bukan ditambahkan.", "SMA10-M-B2-04", "=un_geometri"),
])
cek(ug(F(1, 2), F(1, 2), 4) == F(1, 16) and ug(F(1, 2), F(1, 2), 3) == F(1, 8) and ug(F(1, 2), F(1, 2), 5) == F(1, 32) and sg(F(1, 2), F(1, 2), 4) == F(15, 16))
soal("LT7", 2, "Beberapa anak berbagi kue. Setiap anak mengambil setengah dari kue yang diterimanya dan memberikan sisanya kepada anak berikutnya. Anak pertama menerima kue utuh. Bagian kue yang diambil anak keempat adalah ...", "C", [
    ("1/16", True, "Benar. Bagian yang diambil 1/2, 1/4, 1/8, 1/16: barisan geometri dengan r = 1/2, jadi U_{4} = 1/2 × (1/2)³ = 1/16.", "", "=kue"),
    ("1/8", False, "Itu bagian anak ketiga. Bagian anak keempat setengahnya lagi.", "SMA10-M-B2-03", "=kue"),
    ("1/32", False, "Itu bagian anak kelima: rasio dikalikan satu kali terlalu banyak.", "SMA10-M-B2-03", "=kue"),
    ("15/16", False, "Itu jumlah bagian empat anak (1/2 + 1/4 + 1/8 + 1/16). Yang ditanya bagian anak keempat saja.", "SMA10-M-B2-08", "=kue"),
])
cek(ug(3, 2, 6) == 96 == 3 * 2 ** 5 and ug(3, 2, 5) == 48 and 3 + 5 * 2 == 13 and 3 ** 5 == 243)
soal("LT8", 2, "Mula-mula ada 3 sel. Setiap jam, setiap sel membelah menjadi 2. Banyak sel setelah 5 jam adalah ...", "B", [
    ("96", True, "Benar. U_{1} = 3 adalah keadaan mula-mula; setelah 5 kali pembelahan kita sampai di U_{6} = 3 × 2⁵ = 96.", "", "=un_geometri"),
    ("48", False, "Itu U_{5} = 3 × 2⁴, keadaan setelah 4 jam. Setelah 5 jam sudah terjadi 5 kali pembelahan.", "SMA10-M-B2-03", "=un_geometri"),
    ("13", False, "Banyak sel dianggap bertambah 2 setiap jam (3 + 5 × 2). Setiap sel membelah, jadi banyaknya dikali 2.", "SMA10-M-B2-04", "=un_geometri"),
    ("243", False, "Suku pertama dipakai sebagai rasio (3⁵). a = 3 dan r = 2.", "SMA10-M-B2-06", "=un_geometri"),
])
soal("LT9", 3, "Deret aritmetika adalah ...", "A", [
    ("jumlah suku-suku barisan aritmetika", True, "Benar. Deret aritmetika diperoleh dari menjumlahkan suku-suku pada barisan aritmetika.", "", "deret_aritmetika"),
    ("barisan yang selisih dua suku berurutannya tetap", False, "Itu pengertian barisan aritmetika. Deret adalah jumlah suku-sukunya.", "SMA10-M-B2-08", "aritmetika_def"),
    ("jumlah suku-suku barisan geometri", False, "Itu deret geometri. Deret aritmetika berasal dari barisan aritmetika.", "SMA10-M-B2-04", "deret_def"),
    ("hasil kali suku-suku barisan aritmetika", False, "Deret adalah jumlah, bukan hasil kali, suku-suku barisan.", "SMA10-M-B2-08", "deret_def"),
])
cek(sa(3, 4, 20) == 820 and ua(3, 4, 20) == 79 and 20 * (6 + 19 * 4) == 1640 and 10 * (6 + 20 * 4) == 860)
soal("LT10", 3, "Jumlah 20 suku pertama deret 3 + 7 + 11 + … adalah ...", "D", [
    ("820", True, "Benar. S_{20} = 20/2 × (2 × 3 + 19 × 4) = 10 × 82 = 820.", "", "=sn_aritmetika"),
    ("79", False, "Itu U_{20} = 3 + 19 × 4, suku ke-20 saja. Yang ditanya jumlah 20 suku.", "SMA10-M-B2-08", "=sn_aritmetika"),
    ("1.640", False, "20 × 82 belum dibagi 2. S_{n} = n/2 × (2a + (n − 1)b).", "SMA10-M-B2-07", "=sn_aritmetika"),
    ("860", False, "n − 1 diganti n (10 × (6 + 20 × 4)). Seharusnya 10 × (6 + 19 × 4).", "SMA10-M-B2-03", "=sn_aritmetika"),
])
cek(ua(2, 2, 30) == 60 and sa(2, 2, 30) == 930 and 30 * 62 == 1860 and 2 + 60 == 62 and F(29, 2) * 60 == 870)
soal("LT11", 3, "Hasil 2 + 4 + 6 + … + 60 adalah ...", "C", [
    ("930", True, "Benar. Ada 30 suku (60 = 2 + (n − 1) × 2 memberi n = 30), jadi S_{30} = 30/2 × (2 + 60) = 15 × 62 = 930.", "", "=sn_aritmetika"),
    ("1.860", False, "30 × 62 belum dibagi 2.", "SMA10-M-B2-07", "=sn_aritmetika"),
    ("62", False, "Itu hanya a + U_{n} (2 + 60). Hasil itu masih dikalikan n/2 = 15.", "SMA10-M-B2-07", "=sn_aritmetika"),
    ("870", False, "Banyak suku dihitung 29 ((60 − 2) : 2), lalu dipakai 29/2 × 60. Banyak sukunya (60 − 2) : 2 + 1 = 30.", "SMA10-M-B2-03", "=sn_aritmetika"),
])
cek(sg(3, 2, 5) == 93 and ug(3, 2, 5) == 48 and 3 * 2 ** 5 == 96 and sa(3, 2, 5) == 35)
soal("LT12", 4, "Suku pertama suatu deret geometri 3 dan rasionya 2. Jumlah 5 suku pertamanya adalah ...", "B", [
    ("93", True, "Benar. S_{5} = 3 × (2⁵ − 1)/(2 − 1) = 3 × 31 = 93. Periksa: 3 + 6 + 12 + 24 + 48 = 93.", "", "=sn_geometri"),
    ("48", False, "Itu U_{5} = 3 × 2⁴, suku ke-5 saja. Yang ditanya jumlah 5 suku.", "SMA10-M-B2-08", "=sn_geometri"),
    ("96", False, "Pada 2⁵ − 1, bagian −1 terlupa (3 × 2⁵).", "SMA10-M-B2-09", "=sn_geometri"),
    ("35", False, "Rasio 2 dipakai sebagai beda: 3 + 5 + 7 + 9 + 11 = 35. Suku-suku deret geometri dikalikan 2.", "SMA10-M-B2-04", "=geometri_def"),
])
cek(sg(5, 1, 10) == 50 and 10 * 5 == 50)
soal("LT13", 4, "Jumlah 10 suku pertama deret 5 + 5 + 5 + … adalah ...", "A", [
    ("50", True, "Benar. Rasionya 1, jadi semua suku sama dengan 5 dan S_{10} = 10 × 5 = 50.", "", "=r_satu"),
    ("5", False, "Itu satu suku saja. Ada 10 suku yang masing-masing 5.", "SMA10-M-B2-08", "=r_satu"),
    ("0", False, "Pembilang 5 × (1¹⁰ − 1) = 0 dianggap hasilnya, padahal penyebut r − 1 juga 0. Rumus itu hanya berlaku untuk r ≠ 1; untuk r = 1, S_{n} = n × a.", "SMA10-M-B2-09", "=sn_geometri"),
    ("10", False, "Itu banyak sukunya. Setiap suku bernilai 5, jadi jumlahnya 10 × 5.", "SMA10-M-B2-08", "=r_satu"),
])
cek(sg(5, 2, 6) == 315 and F(315, 5) == 63 and 2 ** 6 == 64 and ug(5, 2, 6) == 5 * 2 ** 5)
soal("LT14", 4, "Deret geometri 5 + 10 + 20 + … berjumlah 315. Banyak suku deret itu adalah ...", "D", [
    ("6", True, "Benar. 5 × (2ⁿ − 1)/(2 − 1) = 315, jadi 2ⁿ − 1 = 63, 2ⁿ = 64, dan n = 6.", "", "=sn_geometri"),
    ("5", False, "Itu pangkat pada suku terakhir, 5 × 2⁵ = 160. Pangkatnya n − 1, jadi n = 6.", "SMA10-M-B2-03", "=un_geometri"),
    ("63", False, "Itu nilai 2ⁿ − 1 (315 : 5). Masih dicari n sehingga 2ⁿ = 64.", "SMA10-M-B2-09", "=sn_geometri"),
    ("64", False, "Itu nilai 2ⁿ. Banyak sukunya n, dan 2⁶ = 64.", "SMA10-M-B2-09", "=sn_geometri"),
])
cek(abs(F(4, 8)) < 1 and F(2, 1) > 1 and F(3, 3) == 1 and abs(F(-6, 2)) > 1)
soal("LT15", 5, "Deret geometri tak hingga manakah yang konvergen?", "C", [
    ("8 + 4 + 2 + …", True, "Benar. r = 4/8 = 1/2, dan |r| < 1.", "", "=konvergen"),
    ("1 + 2 + 4 + …", False, "r = 2 dan |r| > 1, jadi deretnya divergen.", "SMA10-M-B2-10", "=divergen"),
    ("3 + 3 + 3 + …", False, "r = 1. Jumlahnya terus bertambah 3 (3, 6, 9, …), jadi deretnya divergen.", "SMA10-M-B2-10", "=konvergen"),
    ("2 − 6 + 18 − …", False, "r = −3 dan |r| = 3 > 1, jadi deretnya divergen. Tanda yang berganti tidak membuatnya konvergen.", "SMA10-M-B2-10", "=divergen"),
])
cek(F(12) / (1 - F(1, 4)) == 16 and 12 + 3 + F(3, 4) == F(63, 4) and F(12) / (1 + F(1, 4)) == F(48, 5) and F(12) / F(1, 4) == 48)
soal("LT16", 5, "Jumlah deret geometri tak hingga 12 + 3 + 3/4 + … adalah ...", "B", [
    ("16", True, "Benar. a = 12, r = 3/12 = 1/4, jadi S_{∞} = 12/(1 − 1/4) = 12/(3/4) = 16.", "", "=s_tak_hingga"),
    ("15,75", False, "Hanya tiga suku yang dijumlahkan (12 + 3 + 0,75). Deretnya tidak berhenti.", "SMA10-M-B2-12", "=konvergen"),
    ("9,6", False, "Dipakai a/(1 + r) = 12/(5/4). Rumusnya S_{∞} = a/(1 − r).", "SMA10-M-B2-11", "=s_tak_hingga"),
    ("48", False, "Dipakai a/r = 12/(1/4). Rumusnya S_{∞} = a/(1 − r).", "SMA10-M-B2-11", "=s_tak_hingga"),
])
cek(F(20) / (1 - F(1, 5)) == 25 and 1 - F(1, 5) == F(4, 5) and 25 - 20 == 5 and F(25, 20) == F(5, 4))
soal("LT17", 5, "Suku pertama suatu deret geometri tak hingga 20 dan jumlahnya 25. Rasio deret itu adalah ...", "A", [
    ("1/5", True, "Benar. 20/(1 − r) = 25, jadi 1 − r = 20/25 = 4/5 dan r = 1/5.", "", "=s_tak_hingga"),
    ("4/5", False, "Itu nilai 1 − r. Rasionya r = 1 − 4/5 = 1/5.", "SMA10-M-B2-11", "=s_tak_hingga"),
    ("5", False, "Itu selisih 25 − 20. Lagi pula, deret dengan r = 5 divergen.", "SMA10-M-B2-10", "=konvergen"),
    ("5/4", False, "Jumlah dibagi suku pertama (25/20). Deret dengan |r| > 1 divergen dan tidak mempunyai jumlah.", "SMA10-M-B2-10", "=konvergen"),
])
soal("LT18", 6, "Bunga tunggal adalah bunga yang ...", "D", [
    ("besarnya hanya ditentukan oleh pokok uangnya", True, "Benar. Berapa pun lamanya uang disimpan, bunga tunggal hanya bergantung pada nilai pokok.", "", "bunga_tunggal"),
    ("periode berikutnya dihitung dari pokok ditambah bunga sebelumnya", False, "Itu bunga majemuk.", "SMA10-M-B2-13", "bunga_majemuk"),
    ("besarnya bertambah setiap tahun", False, "Yang bertambah setiap tahun adalah bunga majemuk. Bunga tunggal besarnya sama setiap tahun.", "SMA10-M-B2-13", "bunga_majemuk"),
    ("dibayar nasabah kepada bank atas simpanannya", False, "Bunga simpanan dibayar bank kepada nasabah, bukan sebaliknya.", "SMA10-M-B2-14", "bunga_simpanan"),
])
cek(F(6, 100) * 5000000 == 300000 and ua(5300000, 300000, 3) == 5900000 and ug(5000000, F(106, 100), 4) == 5955080 and 3 * 300000 == 900000)
soal("LT19", 6, "Uang Rp5.000.000 disimpan dengan bunga tunggal 6% per tahun. Nilai uang itu setelah 3 tahun adalah ...", "C", [
    ("Rp5.900.000", True, "Benar. Bunga setiap tahun 6% × 5.000.000 = 300.000, jadi setelah 3 tahun 5.000.000 + 3 × 300.000 = 5.900.000.", "", "=bunga_tunggal"),
    ("Rp5.955.080", False, "Itu dihitung dengan bunga majemuk (5.000.000 × 1,06³). Pada bunga tunggal, bunga selalu dihitung dari pokok 5.000.000.", "SMA10-M-B2-13", "=bunga_tunggal"),
    ("Rp5.300.000", False, "Itu nilai uang setelah 1 tahun. Masih ada dua tahun lagi.", "SMA10-M-B2-14", "=bunga_tunggal"),
    ("Rp900.000", False, "Itu besar seluruh bunganya (3 × 300.000). Yang ditanya nilai uangnya.", "SMA10-M-B2-14", "=bunga_tunggal"),
])
cek(F(1102500, 1050000) == F(1157625, 1102500) == F(105, 100) and 1102500 - 1050000 == 52500 != 1157625 - 1102500)
soal("LT20", 6, "Tabungan dengan bunga majemuk 5% per tahun bernilai 1.050.000; 1.102.500; 1.157.625; … pada akhir tahun ke-1, ke-2, dan ke-3. Nilai-nilai itu membentuk ...", "B", [
    ("barisan geometri dengan r = 1,05", True, "Benar. 1.102.500 : 1.050.000 = 1.157.625 : 1.102.500 = 1,05.", "", "=bunga_majemuk"),
    ("barisan aritmetika dengan b = 52.500", False, "Selisihnya 52.500, lalu 55.125 (tidak tetap). Yang tetap adalah pengalinya, 1,05.", "SMA10-M-B2-04", "=bunga_majemuk"),
    ("barisan aritmetika dengan b = 50.000", False, "Itu bunga tunggal dari pokok 1.000.000. Pada bunga majemuk, bunganya bertambah setiap tahun.", "SMA10-M-B2-13", "=bunga_tunggal"),
    ("barisan geometri dengan r = 0,05", False, "0,05 adalah suku bunganya. Setiap tahun tabungan dikalikan 1 + 0,05 = 1,05.", "SMA10-M-B2-05", "=bunga_majemuk"),
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

# The post-test never reuses a Contoh, Latihan or Uji Kompetensi item with its numbers barely
# changed. The book's items and each post-test question's own numbers:
BUKU = {
    "Contoh 1": "U₃ = 9, U₆ = 18", "Contoh 2": "Rudi Rp70.000 dan Rp90.000", "Contoh 3": "a = 4, U₄ = 108",
    "Contoh 4": "tali 5 bagian, 16 cm dan 81 cm", "Contoh 5": "13 + 16 + 19, 30 suku", "Contoh 6": "sepeda 120 dan 3.240 unit",
    "Latihan 2.1": "8, 5, 2; 5, −2, −9 suku ke-50; U₃ = −4 1/2, U₈ = −2; nasi 10 bungkus; permen 3, 5, 7",
    "Latihan 2.2": "1/8, 1/4, 1/2; 25, 5, 1; 64, 32, 16 suku ke-10; U₂ = 80, U₆ = 5; foto 3 teman; sel tahap ke-20",
    "Latihan 2.3": "kelipatan 4 antara 10 dan 99; a = 9, r = 3, 9.837; 3/2 + 3 + … = 762/4; permen 2, 5, 8; foto 2 teman 7 hari",
    "Latihan 2.4": "S∞ = 10; 1 + (m − 1) + …; 4 + 12 + 36",
    "Latihan 2.5": "28.500 dan 22.500; U₃ = 20, U₅ = 80; 1 + 5/3 + 7/3 … + 23/3; 1/27 + 1/9 … + 243; kue sepertiga; bola 1 m 1/4; penduduk 10 dan 90; telur 30.000; pasien 24 dan 96; bola 8 m 3/5; lingkaran; 3 dan 192; segitiga 20 cm",
    "Latihan 2.6": "Firman Rp10.000.000 3%; Gigih Rp10.000.000 3%; Made Rp2.500.000 4%; Dina Rp3.000.000 3%",
    "Uji Kompetensi": "4 + 2 + 1; 4 + 1 + (−2); U₂ + U₅ + U₂₀ = 54; pipa 4 dan 324 cm; kursi 1 : 2, 50 kursi; 1/x + 1/(xy)",
}
POST_ANGKA = {"PB1": "5, 9, 13, 17", "PB2": "18 kursi, 3 kursi, 60 kursi", "PB3": "2, 6, 18", "PB4": "3 kaleng, 2 kaleng, 12 tingkat",
              "PB5": "Rp2.000, dua kali lipat, 6 minggu", "PB6": "18 + 6 + 2", "PB7": "Rp4.000.000, 10%, 2 tahun", "PB8": "−1 < r < 1"}
cek(set(POST_ANGKA) == {s["ref"] for s in POST} and not set(POST_ANGKA.values()) & set(BUKU.values()))
for s in POST:
    cek(POST_ANGKA[s["ref"]].split(",")[0] in s["tanya"] or POST_ANGKA[s["ref"]] in s["pilihan"][[p[1] for p in s["pilihan"]].index(True)][0], s["ref"])
cek(not any(w in s["tanya"] for s in POST for w in ("13 + 16", "120 unit", "3.240", "Rp70.000", "16 cm", "108", "4 + 2 + 1",
                                                   "4 + 12", "1.000.000", "10.000.000", "2.500.000", "3.000.000", "324", "9.837",
                                                   "762", "192", "30.000", "28.500", "64, 32")))


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
    tulis(os.path.join(here, "SMA10-Matematika-Bab2.xlsx"))
    tulis_miskonsepsi(os.path.join(here, "SMA10-Matematika-Bab2-miskonsepsi.csv"))
    halaman = sum(p["isi"].count("## ") for p in PELAJARAN)
    print(f"SMA10-Matematika-Bab2.xlsx: lessons {len(PELAJARAN)} ({halaman} pages), questions {len(S)} "
          f"(pre {len(PRE)}, post {len(POST)}, practice {len(LAT)}), answers "
          + " ".join(f"{h}={HURUF[h]}" for h in "ABCD"))
    print(f"SMA10-Matematika-Bab2-miskonsepsi.csv: {len(MISKONSEPSI)} codes")
    print(f"facts traced: {len(FAKTA)} (pages {min(h for h, _ in FAKTA.values())}-{max(h for h, _ in FAKTA.values())})")
    if "--kutipan" in sys.argv:
        ada, gambar = periksa_kutipan(sys.argv[sys.argv.index("--kutipan") + 1])
        print(f"quotations found in the book's text: {ada} of {len(FAKTA)}; figures read by eye: {', '.join(gambar) or 'none'}")
    print(f"assertions passed: {CEK[0]}")
