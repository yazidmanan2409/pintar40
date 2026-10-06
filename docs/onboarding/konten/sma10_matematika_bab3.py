# SMA Kelas X, Matematika, Bab 3 "Perbandingan Trigonometri", as a PINTAR lesson workbook in the D-007
# template (sheets Kursus, Bab, Pelajaran, Soal, Pilihan; the column contract is KOLOM in
# src/lib/unggah-kontrak.ts). Built with the method of Bab 1 (LANA-17).
#
# Source: the student book "Matematika untuk SMA/MA/SMK/MAK Kelas X (Edisi Revisi)" (Dicky Susanto
# dkk.; Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi, 2023; ISBN 978-623-118-558-7),
# Bab 3, pp. 71-106. It has no numbered Contoh (its worked examples are the shadows, the pyramid
# and the kite); its Latihan and Uji Kompetensi have no keys, so every key here is ours, and every
# key is computed.
#
#   - Every number in a lesson, key or distractor is computed here and asserted: exact fractions
#     for side ratios, and for the special angles the squares of sin, cos and tan are exact
#     fractions checked against math.sin/cos/tan; every triangle is checked against Pythagoras.
#   - Every definition and property is in FAKTA with its page and the book's words; `--kutipan`
#     checks the prose against the book's text. Formulas were read from the page images (the text
#     layer loses fractions and degree signs: sin 30° extracts as "sin 30o"), so formulas are
#     proven by computation.
#   - Statements that are false or doubtful outside the book are kept out, and DILUAR asserts it.
#   - Notation: × and :, decimal comma, thousands point; degrees as 30°; squares as Unicode
#     superscripts (a², sin² α); roots as √3/2, with parentheses when the radicand is longer
#     than one symbol (√(2² − 1²)).
#     No LaTeX, HTML or tables; the book's tables become value lines.
#
# Run: python3 docs/onboarding/konten/sma10_matematika_bab3.py [--kutipan book.txt]
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




# Bab 3 pembuka dan A. Perbandingan trigonometri (pp. 73-81)
fakta("trigonometri", 73, "Trigonometri merupakan suatu metode mengukur secara tidak langsung yang memanfaatkan pola perbandingan antara sudut dan sisi segitiga.")
fakta("pythagoras", 74, "Untuk siap mempelajari perbandingan trigonometri, kamu perlu mengingat teorema Pythagoras yang berlaku pada segitiga siku-siku.")
fakta("rasio", 74, "Rasio adalah nilai/bilangan yang menjelaskan keterkaitan antara dua hal.")
fakta("penggaris", 74, "Jika tinggi penggaris 3 cm dan tinggi bayangan 6 cm, kita dapat mengambil kesimpulan bahwa tinggi pohon adalah 300 cm dan tinggi bayangan pohon adalah 600 cm.")
fakta("sebangun", 74, "Dua segitiga dapat memenuhi syarat kesebangunan jika: • setiap pasang sudut yang berpadanan sama besar atau • setiap pasang sisi yang berpadanan sebanding (mempunyai nilai rasio yang sama) atau • dua pasang sisi yang berpadanan sebanding dan sudut apit dari kedua sisi tersebut sama besar.")
fakta("sisi_depan", 78, "Definisi: sisi yang berada tepat di depan sudut θ.")
fakta("sisi_samping", 78, "Definisi: sisi yang berada di samping sudut θ.")
fakta("sisi_miring", 78, "Definisi: sisi yang berada di seberang sudut siku-siku.")
fakta("tangen", 79, "Nilai perbandingan ini mempunyai nama khusus, yaitu tangen atau disingkat tan. Jadi, tangen suatu sudut dapat ditentukan dengan membagi panjang sisi depan dengan sisi samping segitiga.")
fakta("tan_sudut", 79, "nilai tan hanya ditentukan oleh besarnya sudut. Jika sudut berubah maka nilai tan pasti berubah.")
fakta("bayangan", 80, "Dengan mengetahui nilai perbandingan tinggi anak kecil dan bayangannya (tan θ), kamu dapat mencari panjang bayangan anak remaja dan tinggi orang dewasa yang sebenarnya.")
fakta("remaja", 81, "Panjang bayangan remaja adalah 259,65 cm.")
# B. Pemanfaatan perbandingan trigonometri (pp. 86-102)
fakta("elevasi", 86, "alat bernama klinometer yang berfungsi mengukur sudut kemiringan, elevasi (tingkat kenaikan), atau depresi (tingkat penurunan).")
fakta("sinus_cosinus", 90, "Nilai perbandingan sisi depan terhadap sisi miring disebut sebagai sinus. • Nilai perbandingan sisi samping terhadap sisi miring disebut sebagai cosinus.")
fakta("piramida", 90, "Ia tahu θ = 41◦ dan panjang rusuk piramida adalah 600 m.")
fakta("piramida_tinggi", 91, "Tinggi piramida adalah 396 m.")
fakta("piramida_lorong", 91, "Panjang lorong bawah tanah yang perlu digali adalah 450 m.")
fakta("pythagoras_kata", 91, "Segitiga siku-siku memenuhi teorema Pythagoras, yaitu bahwa kuadrat sisi miringnya sama dengan jumlah kuadrat masing-masing sisi lainnya.")
fakta("pythagoras_trigonometri", 92, "Ternyata, teorema Pythagoras dapat dituliskan dalam bentuk trigonometri.")
fakta("tan_sin_cos", 93, "Nilai apa yang kamu peroleh dari")
fakta("layangan", 93, "Ia berhasil menaikkan layangan sampai ketinggian 3,5 m sambil memegang ujung layangan pada ketinggian 60 cm dari permukaan tanah.")
fakta("surya", 94, "Jawaban Surya tidak tepat.")
fakta("kebalikan", 96, "ada lagi tiga perbandingan trigonometri yang jarang digunakan.")
fakta("sudut_istimewa", 97, "Sudut istimewa dalam perbandingan trigonometri adalah sudut-sudut yang nilai perbandingannya dapat ditentukan secara eksak.")
fakta("sama_sisi", 98, "Gambar sebuah segitiga sama sisi dengan panjang setiap sisinya 2 satuan.")
fakta("sama_kaki", 99, "Gambar sebuah segitiga siku-siku sama kaki dengan panjang 1 satuan.")
fakta("sin30_cos60", 100, "Pada sudut istimewa perbandingan trigonometri sin 30o dan cos 60o bernilai sama.")
fakta("komplemen", 102, "Istilah co- dalam matematika berkaitan dengan komplemen sudut.")
fakta("komplemen_def", 102, "sehingga β adalah komplemen dari sudut α.")
# For the book-error record only (not used by any question)
fakta("tan30_057", 79, "Contoh yang kamu kerjakan menunjukkan bahwa tan 30◦= 0, 57.")
fakta("tan30_057b", 81, "Diketahui bahwa tan 30o = 0,57.")
fakta("tan70", 80, "Apakah kamu dapat mencari nilai perbandingan tan 70o?")
fakta("giza", 89, "Pada Piramida Giza, piramida yang tertua dan terbesar di dunia, sudut θ adalah sebesar 41o.")
fakta("eratosthenes", 75, "Tahukah kamu kalau 2.000 tahun yang lalu seorang matematikawan telah menemukan perkiraan bilangan yang sama?")
fakta("setangah", 90, "setangah diagonal alas")
fakta("tambah_c2", 92, "a2 c2 + b2 c2 + c2 c2")
fakta("catatan_kotak", 93, "Sebaiknya persamaan terakhir dimasukkan ke dalam kotak")
fakta("surya_satuan", 94, "x cm = 10,29 m")
fakta("sudut_532", 94, "∠P = 53,2 o dan besaran ∠Q = 36,8 o.")
fakta("tan55", 96, "tan 55o = 1.43")
fakta("klm_ganda", 100, "KLM adalah segitiga dengan besar sudut dan panjang seperti pada gambar di samping. KLM adalah segitiga dengan besar sudut dan panjang seperti pada gambar di samping.")
REKAMAN = {"tan30_057", "tan30_057b", "tan70", "giza", "eratosthenes", "setangah", "tambah_c2", "catatan_kotak",
           "surya_satuan", "sudut_532", "tan55", "klm_ganda"}
GAMBAR = {"surya_satuan"}     # Surya's working on p. 94 is printed as an image; read by eye


def sin_(d):
    return math.sin(math.radians(d))


def cos_(d):
    return math.cos(math.radians(d))


def tan_(d):
    return math.tan(math.radians(d))


def dekat(x, y):
    return math.isclose(x, y, rel_tol=0, abs_tol=1e-12)


def siku(a, b, c):
    """a² + b² = c², exactly (the arguments may be Fractions or square roots given as squares)."""
    return F(a) ** 2 + F(b) ** 2 == F(c) ** 2


# ── What can be computed (every number the lessons use) ──
cek(siku(3, 4, 5) and siku(6, 8, 10) and F(6, 3) == F(8, 4) == F(10, 5) == 2)       # Gambar 3.7
cek(3 * 100 == 300 and 6 * 100 == 600)                                                # penggaris 1/100
# Lesson 2: the shadows of Gambar 3.15
cek(F(114, 200) == F(57, 100))
cek(desimal(math.degrees(math.atan(0.57)), 1) == "29,7")                               # «sekitar 30°»
cek(desimal(148 * 200 / 114, 2) == "259,65" and desimal(148 / 0.57, 2) == "259,65")
cek(F(148 * 200, 114) == F(148) / F(57, 100))                                          # both ways agree exactly
cek(F(75, 100) * 12 == 9)                                                              # tinggi pohon
# Lesson 3
cek(F(6, 10) == F(3, 5) and F(8, 10) == F(4, 5) and F(6, 8) == F(3, 4) and siku(6, 8, 10))
cek(desimal(sin_(41), 2) == "0,66" and desimal(cos_(41), 2) == "0,75")
cek(F(66, 100) * 600 == 396 and F(75, 100) * 600 == 450)
cek(396 ** 2 + 450 ** 2 == 359316 and abs(math.sqrt(359316) - 600) < 1)               # rounding, not an error
NAIK = {d: (sin_(d), cos_(d)) for d in (30, 41, 60)}
cek(desimal(NAIK[30][0], 2) == "0,50" and desimal(NAIK[30][1], 2) == "0,87" and desimal(NAIK[60][0], 2) == "0,87"
    and desimal(NAIK[60][1], 2) == "0,50")
cek(all(sin_(d) < sin_(d + 1) and cos_(d) > cos_(d + 1) for d in range(0, 90)))         # sin up, cos down
cek(desimal(sin_(20), 2) == "0,34" and desimal(3.5 / 0.34, 2) == "10,29")
cek(F(35, 10) - F(6, 10) == F(29, 10) and desimal(2.9 / 0.34, 1) == "8,5" and desimal(2.9 / sin_(20), 1) == "8,5")
# Lesson 4
cek(siku(8, 15, 17) and F(8, 17) ** 2 + F(15, 17) ** 2 == 1 and F(8, 17) / F(15, 17) == F(8, 15))
cek(1 / F(15, 17) == F(17, 15) and 1 / F(8, 17) == F(17, 8) and 1 / F(8, 15) == F(15, 8))
cek(all(dekat(sin_(d) ** 2 + cos_(d) ** 2, 1) and dekat(sin_(d) / cos_(d), tan_(d)) and dekat(sin_(d), cos_(90 - d))
        for d in range(1, 90)))
# Lesson 5: the exact values, from the triangles and by computation
cek(2 ** 2 - 1 ** 2 == 3 and 1 ** 2 + 1 ** 2 == 2)                                     # heights √3 and √2
ISTIMEWA = {30: (F(1, 4), F(3, 4), F(1, 3)), 45: (F(1, 2), F(1, 2), F(1)), 60: (F(3, 4), F(1, 4), F(3))}
for _d, (_s2, _c2, _t2) in ISTIMEWA.items():                                             # squares of the exact values
    cek(dekat(sin_(_d) ** 2, float(_s2)) and dekat(cos_(_d) ** 2, float(_c2)) and dekat(tan_(_d) ** 2, float(_t2)))
    cek(_s2 + _c2 == 1 and _s2 / _c2 == _t2)
R2, R3 = math.sqrt(2), math.sqrt(3)
cek(dekat(sin_(30), 1 / 2) and dekat(cos_(30), R3 / 2) and dekat(tan_(30), R3 / 3) and dekat(tan_(30), 1 / R3))
cek(dekat(sin_(45), R2 / 2) and dekat(cos_(45), R2 / 2) and dekat(tan_(45), 1) and dekat(1 / R2, R2 / 2))
cek(dekat(sin_(60), R3 / 2) and dekat(cos_(60), 1 / 2) and dekat(tan_(60), R3))
cek(desimal(R2 / 2, 2) == "0,71" and desimal(R3 / 2, 2) == "0,87" and desimal(R3 / 3, 2) == "0,58" and desimal(R3, 2) == "1,73")
cek(dekat(6 * sin_(60), 3 * R3) and desimal(3 * R3, 2) == "5,20" and dekat(6 * cos_(60), 3) and 27 + 9 == 36)   # tangga
# Lesson 6
cek(dekat(20 * tan_(45), 20) and F(20) + F(15, 10) == F(215, 10))
# BOOK INCONSISTENCIES (checked here, kept out of lessons and questions):
# pp. 79, 81: «tan 30° = 0,57»; tan 30° = √3/3 ≈ 0,577, which rounds to 0,58. The ratio 0,57 of
# Gambar 3.15 (114 : 200) belongs to an angle of about 29,7°.
cek(desimal(tan_(30), 2) == "0,58" and desimal(tan_(30), 3) == "0,577")
# p. 80, Latihan 3.2 no. 1: the figure's 15 cm and 7 cm give 15/7 ≈ 2,14, but tan 70° ≈ 2,75.
cek(desimal(15 / 7, 2) == "2,14" and desimal(tan_(70), 2) == "2,75")
# p. 94, Latihan 3.5 no. 1: in the 3-4-5 triangle ∠P ≈ 53,1° and ∠Q ≈ 36,9°, not 53,2° and 36,8°.
cek(siku(3, 4, 5) and desimal(math.degrees(math.atan2(4, 3)), 1) == "53,1" and desimal(math.degrees(math.atan2(3, 4)), 1) == "36,9")
# p. 96: «tan 55° = 1.43» uses a decimal point; tan 55° ≈ 1,43.
cek(desimal(tan_(55), 2) == "1,43" and desimal(cos_(43), 2) == "0,73")
# Figures checked against Pythagoras: 3-4-5 and 6-8-10 (p. 75), 3-4-5 and 5-12-13 (p. 94),
# KLM with 3, 2, √13 and ∠K ≈ 33,7° (p. 100), 5-12-13 (p. 99), cos x = 20/29 (p. 103).
cek(siku(5, 12, 13) and F(3) ** 2 + F(2) ** 2 == 13 and desimal(math.degrees(math.atan2(2, 3)), 1) == "33,7")
cek(siku(20, 21, 29) and desimal(math.degrees(math.atan2(3, 2)), 1) == "56,3")
# p. 84, Latihan 3.4 no. 5: BC = 1.151 m, CA = 814 m, right angle at A gives AB ≈ 813,8 m (consistent).
cek(desimal(math.sqrt(1151 ** 2 - 814 ** 2), 1) == "813,8")

SUMBER = ("_Diadaptasi dari Matematika untuk SMA/MA/SMK/MAK Kelas X (Edisi Revisi), Dicky Susanto dkk., "
          "Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi, 2023, Bab 3._")

KURSUS = {
    "Judul kursus*": "Matematika Kelas X · Bab 3: Perbandingan Trigonometri",
    "Mata pelajaran*": "Matematika",
    "Jenjang*": "SMA",
    "Kelas*": "Kelas X",
    "Konteks": "Akademik",
}

BAB = [(1, "Perbandingan Trigonometri")]

PELAJARAN = [
    dict(no=1, judul="Sisi-Sisi Segitiga Siku-Siku",
         ringkasan="Teorema Pythagoras, rasio, dan kesebangunan menjadi bekal trigonometri; sisi segitiga siku-siku diberi nama menurut sudut yang diperhatikan.",
         tujuan="Kamu dapat memakai teorema Pythagoras dan menamai sisi depan, sisi samping, dan sisi miring sebuah segitiga siku-siku.",
         bloom="Memahami",
         isi="""## Mengukur tanpa menyentuh

Tinggi gunung atau gedung pencakar langit tidak diukur langsung dengan meteran. Para ahli memakai trigonometri. **Trigonometri** merupakan suatu metode mengukur secara tidak langsung yang memanfaatkan pola perbandingan antara sudut dan sisi segitiga. Kata trigonometri berasal dari bahasa Yunani dan berarti pengukuran segitiga.

## Teorema Pythagoras dan rasio

Pada segitiga siku-siku ABC dengan sudut siku-siku di C, sisi a dan b mengapit sudut siku-siku, dan sisi c berada di seberangnya. Berlaku

a² + b² = c²

Contoh: jika a = 3 cm dan b = 4 cm, maka c² = 9 + 16 = 25, jadi c = 5 cm.

**Rasio** adalah nilai atau bilangan yang menjelaskan keterkaitan antara dua hal. Misalnya, perbandingan tinggi penggaris dengan tinggi pohon adalah 1/100. Jika tinggi penggaris 3 cm, tinggi pohon 3 × 100 = 300 cm.

## Segitiga sebangun

Dua segitiga sebangun jika:

- setiap pasang sudut yang berpadanan sama besar, atau
- setiap pasang sisi yang berpadanan sebanding (nilai rasionya sama), atau
- dua pasang sisi yang berpadanan sebanding dan sudut apit kedua sisi itu sama besar.

Contoh: segitiga dengan sisi 3 cm, 4 cm, 5 cm sebangun dengan segitiga bersisi 6 cm, 8 cm, 10 cm, karena 6 : 3 = 8 : 4 = 10 : 5 = 2.

## Nama sisi segitiga siku-siku

Nama sisi ditentukan oleh sudut lancip θ yang sedang diperhatikan:

- **sisi depan**: sisi yang berada tepat di depan sudut θ;
- **sisi samping**: sisi yang berada di samping sudut θ, selain sisi miring;
- **sisi miring** (hipotenusa): sisi yang berada di seberang sudut siku-siku.

Sisi miring selalu sisi yang terpanjang, karena c² = a² + b² lebih besar daripada a² dan b². Sisi depan dan sisi samping bertukar jika sudut yang diperhatikan berganti. Pada segitiga siku-siku dengan sudut 30° dan 60°, sisi depan sudut 30° adalah sisi samping sudut 60°.

""" + SUMBER),
    dict(no=2, judul="Perbandingan Tangen",
         ringkasan="Tangen sebuah sudut adalah perbandingan sisi depan terhadap sisi samping; nilainya hanya ditentukan oleh besar sudut.",
         tujuan="Kamu dapat menentukan nilai tan θ dan memakainya untuk mencari panjang sisi yang tidak diketahui.",
         bloom="Menerapkan",
         isi="""## Bayangan dan tinggi badan

Pada suatu saat, seorang anak setinggi 114 cm mempunyai bayangan sepanjang 200 cm. Tubuh anak, bayangannya, dan garis dari ujung kepala ke ujung bayangan membentuk segitiga siku-siku. Nilai perbandingan tinggi badan terhadap panjang bayangan:

114 : 200 = 0,57

Orang lain yang berdiri di tempat yang sama pada saat yang sama membentuk segitiga yang sebangun, dengan sudut θ yang sama, jadi nilai perbandingannya juga 0,57.

## Tangen

Nilai perbandingan sisi depan terhadap sisi samping disebut **tangen**, disingkat tan:

tan θ = sisi depan/sisi samping

Nilai tan hanya ditentukan oleh besarnya sudut; besar kecilnya segitiga tidak berpengaruh. Jika sudutnya berubah, nilai tan juga berubah.

Pada contoh bayangan tadi, tan θ = 0,57, dan sudut θ-nya sekitar 30°.

## Contoh: bayangan remaja

Pada saat yang sama, seorang remaja setinggi 148 cm berdiri di tempat itu. Berapa panjang bayangannya? Misalkan panjangnya x cm.

1. Dengan segitiga sebangun: 114/200 = 148/x, jadi x = 148 × 200 : 114 = 29.600 : 114 ≈ 259,65.
2. Dengan tangen: tan θ = 148/x = 0,57, jadi x = 148 : 0,57 ≈ 259,65.

Kedua cara memberi hasil yang sama: panjang bayangan remaja sekitar **259,65 cm**.

## Contoh: tinggi pohon

Pada suatu sore, nilai tan θ untuk sudut antara bayangan dan sinar matahari adalah 0,75. Bayangan sebuah pohon panjangnya 12 m. Berapa tinggi pohon itu?

1. Tinggi pohon adalah sisi depan, dan bayangannya sisi samping.
2. tan θ = tinggi/12 = 0,75, jadi tinggi = 0,75 × 12 = **9 m**.

""" + SUMBER),
    dict(no=3, judul="Sinus dan Cosinus",
         ringkasan="Sinus adalah perbandingan sisi depan terhadap sisi miring, dan cosinus perbandingan sisi samping terhadap sisi miring.",
         tujuan="Kamu dapat menentukan nilai sin θ dan cos θ serta memilih perbandingan yang tepat untuk mencari panjang sisi.",
         bloom="Menerapkan",
         isi="""## Tiga perbandingan trigonometri

Selain tangen, ada dua perbandingan lain yang memakai sisi miring:

- **sinus**: sin θ = sisi depan/sisi miring
- **cosinus**: cos θ = sisi samping/sisi miring
- **tangen**: tan θ = sisi depan/sisi samping

Contoh: sebuah segitiga siku-siku bersisi 6, 8, dan 10, dan sisi depan sudut θ adalah 6. Maka sin θ = 6/10 = 0,6, cos θ = 8/10 = 0,8, dan tan θ = 6/8 = 0,75.

## Contoh: piramida

Sebuah piramida digambarkan dengan segitiga siku-siku: tinggi piramida (sisi depan θ), setengah diagonal alas (sisi samping), dan rusuk piramida (sisi miring). Misalkan θ = 41° dan panjang rusuknya 600 m. Berapa tinggi piramida dan panjang setengah diagonal alasnya?

1. Dengan kalkulator, sin 41° ≈ 0,66. Tinggi = 0,66 × 600 = **396 m**.
2. Dengan kalkulator, cos 41° ≈ 0,75. Setengah diagonal alas = 0,75 × 600 = **450 m**.

Periksa dengan Pythagoras: 396² + 450² = 359.316, dekat dengan 600² = 360.000. Selisihnya muncul karena nilai sin dan cos dibulatkan.

## Makin besar sudutnya

- θ = 30° → sin θ = 0,50 dan cos θ ≈ 0,87
- θ = 41° → sin θ ≈ 0,66 dan cos θ ≈ 0,75
- θ = 60° → sin θ ≈ 0,87 dan cos θ = 0,50

Untuk sudut lancip, makin besar θ, nilai sin θ makin besar dan nilai cos θ makin kecil.

## Contoh: tali layangan

Wanimbo menaikkan layangan sampai ketinggian 3,5 m sambil memegang ujung tali pada ketinggian 60 cm dari tanah. Tali membentuk sudut 20° dengan garis mendatar. Berapa panjang tali yang sudah diulurkan?

Seorang siswa menghitung 3,5 : sin 20° ≈ 3,5 : 0,34 ≈ 10,29 m. Jawaban itu keliru: 3,5 m diukur dari tanah, padahal segitiga siku-sikunya dimulai dari tangan Wanimbo.

1. Sisi depan sudut 20° adalah 3,5 m − 0,6 m = 2,9 m. Tali adalah sisi miring, jadi dipakai sinus.
2. sin 20° ≈ 0,34, jadi panjang tali ≈ 2,9 : 0,34 ≈ **8,5 m**.

""" + SUMBER),
    dict(no=4, judul="Hubungan Antarperbandingan Trigonometri",
         ringkasan="Teorema Pythagoras memberi sin² α + cos² α = 1; tan α = sin α/cos α; sec, csc, dan cot adalah kebalikan cos, sin, dan tan.",
         tujuan="Kamu dapat memakai hubungan antarperbandingan trigonometri untuk menentukan nilai perbandingan yang lain.",
         bloom="Menerapkan",
         isi="""## Pythagoras dalam bentuk trigonometri

Pada segitiga siku-siku, sisi a berada di depan sudut α, sisi b di samping sudut α, dan c sisi miring. Dari a² + b² = c², bagi kedua ruas dengan c²:

(a/c)² + (b/c)² = 1

Karena a/c = sin α dan b/c = cos α, diperoleh

sin² α + cos² α = 1

Contoh: segitiga bersisi 8, 15, dan 17 (8² + 15² = 64 + 225 = 289 = 17²). Untuk sudut α di depan sisi 8: sin α = 8/17 dan cos α = 15/17, dan (8/17)² + (15/17)² = 64/289 + 225/289 = 1.

## Tangen dari sinus dan cosinus

sin α/cos α = a/c × c/b = a/b, jadi

tan α = sin α/cos α

Pada segitiga tadi: tan α = (8/17) : (15/17) = 8/15.

## Tiga perbandingan kebalikan

Ada tiga perbandingan lain yang jarang digunakan:

- **secan**: sec α = c/b = 1/cos α
- **cosecan**: csc α = c/a = 1/sin α
- **cotangen**: cot α = b/a = 1/tan α

Pada segitiga tadi: sec α = 17/15, csc α = 17/8, dan cot α = 15/8.

## Sudut komplemen

Pada segitiga siku-siku dengan sudut lancip α dan β berlaku α + β = 90°; β disebut **komplemen** dari sudut α. Sisi depan α adalah sisi samping β, sehingga

- sin α = cos β
- cos α = sin β
- tan α = cot β

Istilah co- pada cosinus, cosecan, dan cotangen berkaitan dengan komplemen sudut. Contoh: sin 30° = cos 60°, karena 30° + 60° = 90°.

""" + SUMBER),
    dict(no=5, judul="Sudut Istimewa",
         ringkasan="Nilai sin, cos, dan tan untuk sudut 30°, 45°, dan 60° dapat ditentukan secara eksak dari segitiga sama sisi dan segitiga siku-siku sama kaki.",
         tujuan="Kamu dapat menurunkan dan memakai nilai perbandingan trigonometri sudut 30°, 45°, dan 60°.",
         bloom="Menerapkan",
         isi="""## Sudut 30° dan 60°

Sudut 30°, 45°, dan 60° disebut **sudut istimewa**, karena nilai perbandingan trigonometrinya dapat ditentukan secara eksak dari segitiga sederhana.

Gambar segitiga sama sisi dengan panjang setiap sisi 2 satuan; semua sudutnya 60°. Belah dua dengan garis tinggi. Setiap bagian adalah segitiga siku-siku dengan sudut 30° dan 60°, sisi miring 2, sisi terpendek 1, dan tinggi √(2² − 1²) = √3.

- sin 30° = 1/2, cos 30° = √3/2, tan 30° = 1/√3 = √3/3
- sin 60° = √3/2, cos 60° = 1/2, tan 60° = √3/1 = √3

## Sudut 45°

Gambar segitiga siku-siku sama kaki dengan kaki 1 satuan. Kedua sudut lancipnya 45°, dan sisi miringnya √(1² + 1²) = √2.

- sin 45° = 1/√2 = √2/2
- cos 45° = √2/2
- tan 45° = 1/1 = 1

## Nilai-nilai sudut istimewa

- 30° → sin = 1/2, cos = √3/2, tan = √3/3
- 45° → sin = √2/2, cos = √2/2, tan = 1
- 60° → sin = √3/2, cos = 1/2, tan = √3

Nilai desimalnya: √2/2 ≈ 0,71, √3/2 ≈ 0,87, √3/3 ≈ 0,58, dan √3 ≈ 1,73. Perhatikan bahwa sin 30° = cos 60° dan sin 60° = cos 30°, karena 30° dan 60° saling berkomplemen.

## Contoh: tangga

Sebuah tangga sepanjang 6 m bersandar pada dinding dan membentuk sudut 60° dengan tanah. Berapa tinggi ujung atas tangga, dan berapa jarak kaki tangga ke dinding?

1. Tinggi adalah sisi depan sudut 60°, dan tangga sisi miring: tinggi = 6 × sin 60° = 6 × √3/2 = **3√3 m** ≈ 5,20 m.
2. Jarak kaki tangga adalah sisi samping: 6 × cos 60° = 6 × 1/2 = **3 m**.

Periksa dengan Pythagoras: (3√3)² + 3² = 27 + 9 = 36 = 6².

""" + SUMBER),
    dict(no=6, judul="Menerapkan Perbandingan Trigonometri",
         ringkasan="Pilih sin, cos, atau tan menurut sisi yang diketahui dan dicari; sudut elevasi dipakai untuk mengukur tinggi benda.",
         tujuan="Kamu dapat memilih perbandingan trigonometri yang tepat dan memakainya untuk menyelesaikan masalah sehari-hari.",
         bloom="Menerapkan",
         isi="""## Memilih perbandingan yang tepat

Tandai dahulu sudut θ dan nama setiap sisi, lalu pilih perbandingan yang memuat sisi yang diketahui dan sisi yang dicari:

- sisi depan dan sisi miring → sin θ
- sisi samping dan sisi miring → cos θ
- sisi depan dan sisi samping → tan θ

Jika sisi yang dicari berada di pembilang, kalikan; jika berada di penyebut, bagi.

## Sudut elevasi

**Sudut elevasi** adalah sudut antara garis mendatar dan garis pandang ke atas, ke arah benda yang dilihat. Alat seperti klinometer atau teodolit dipakai untuk mengukurnya. Jika jarak mendatar ke benda diketahui, tinggi benda dapat dihitung dengan tan θ.

## Contoh: tinggi menara air

Rina berdiri 20 m dari kaki sebuah menara air. Sudut elevasi dari matanya ke puncak menara 45°, dan matanya 1,5 m di atas tanah. Berapa tinggi menara itu?

1. Jarak mendatar 20 m adalah sisi samping, dan bagian menara di atas mata Rina adalah sisi depan: tan 45° = sisi depan/20.
2. Sisi depan = 20 × tan 45° = 20 × 1 = 20 m.
3. Garis mendatar itu setinggi mata Rina, jadi tambahkan 1,5 m: tinggi menara = 20 + 1,5 = **21,5 m**.

## Rangkuman Bab 3

- Sisi depan, sisi samping, dan sisi miring dinamai menurut sudut θ yang diperhatikan.
- sin θ = sisi depan/sisi miring, cos θ = sisi samping/sisi miring, tan θ = sisi depan/sisi samping.
- sin² θ + cos² θ = 1 dan tan θ = sin θ/cos θ; sec, csc, dan cot adalah kebalikan cos, sin, dan tan.
- sin 30° = 1/2, sin 45° = √2/2, sin 60° = √3/2; tan 45° = 1.
- Nilai perbandingan trigonometri hanya ditentukan oleh besar sudut, bukan oleh ukuran segitiga.

""" + SUMBER),
]

# Statements that are false or doubtful outside the book, or book errors, stay out of the lessons.
DILUAR = ("tan 30° = 0,57", "tan 30° ≈ 0,57", "Giza", "tertua", "2.000 tahun", "1.43", "53,2", "36,8", "x cm =",
          "setangah", "dimasukkan ke dalam kotak", "+ c²/c²", "trigono,", "hampir dua kali")
for _p in PELAJARAN:
    cek(3 <= _p["isi"].count("\n## ") + _p["isi"].startswith("## ") <= 6, f"lesson {_p['no']}: 3-6 pages")
    cek(_p["isi"].rstrip().endswith(SUMBER), f"lesson {_p['no']}: attribution last")
    cek(_p["isi"].count("Coba pikirkan") <= 1, f"lesson {_p['no']}: at most one Coba pikirkan")
    cek(not any(w in _p["isi"] for w in DILUAR), f"lesson {_p['no']}: {[w for w in DILUAR if w in _p['isi']]}")
    notasi(_p["isi"], f"lesson {_p['no']}")
    notasi(_p["ringkasan"], f"lesson {_p['no']} ringkasan")
    cek(not re.search(r"\d ?(derajat|o\b)", _p["isi"]), f"lesson {_p['no']}: degrees written with °")
# Every exact value printed in lesson 5 is one of the computed ones.
_L5 = PELAJARAN[4]["isi"]
for _t in ("sin 30° = 1/2", "cos 30° = √3/2", "tan 30° = 1/√3 = √3/3", "sin 60° = √3/2", "cos 60° = 1/2",
           "tan 60° = √3/1 = √3", "sin 45° = 1/√2 = √2/2", "cos 45° = √2/2", "tan 45° = 1/1 = 1"):
    cek(_t in _L5, _t)
cek("Sudut 30°, 45°, dan 60° disebut **sudut istimewa**" in _L5 and "Sudut istimewa adalah sudut-sudut" not in _L5)

# ── Misconceptions: the book has no Miskonsepsi section; these come from the distractors.
MISKONSEPSI = {
    "SMA10-M-B3-01": ("Teorema Pythagoras keliru",
                      "Sisi-sisinya dijumlahkan tanpa dikuadratkan, akarnya lupa ditarik, atau sisi miring dikira sisi yang lain.",
                      "Kuadratkan kedua sisi yang mengapit sudut siku-siku, jumlahkan, lalu tarik akarnya."),
    "SMA10-M-B3-02": ("Nama sisi tertukar",
                      "Sisi depan, sisi samping, dan sisi miring tertukar, atau nama sisi dianggap tidak bergantung pada sudut.",
                      "Tandai sudut θ dahulu; sisi miring di seberang sudut siku-siku, sisi depan di seberang θ."),
    "SMA10-M-B3-03": ("Perbandingan terbalik",
                      "Pembilang dan penyebut tertukar, misalnya tan θ ditulis sisi samping dibagi sisi depan.",
                      "Hafalkan urutannya: sin = depan/miring, cos = samping/miring, tan = depan/samping."),
    "SMA10-M-B3-04": ("Sinus, cosinus, dan tangen tertukar",
                      "Perbandingan yang dipakai tidak sesuai dengan sisi yang diketahui dan dicari.",
                      "Tulis nama sisi yang diketahui dan yang dicari, lalu pilih perbandingan yang memuat keduanya."),
    "SMA10-M-B3-05": ("Nilai perbandingan dikira bergantung pada ukuran segitiga",
                      "Segitiga yang lebih besar dikira mempunyai nilai sin, cos, atau tan yang lebih besar.",
                      "Bandingkan dua segitiga sebangun: sisi-sisinya berubah dengan faktor yang sama, jadi perbandingannya tetap."),
    "SMA10-M-B3-06": ("Mengali dan membagi tertukar",
                      "Sisi yang diketahui dikalikan dengan nilai perbandingan padahal seharusnya dibagi, atau sebaliknya.",
                      "Tulis persamaan perbandingannya lengkap, lalu selesaikan untuk sisi yang dicari."),
    "SMA10-M-B3-07": ("Tinggi pengamat terlupa",
                      "Segitiga siku-siku dianggap dimulai dari tanah, padahal dimulai dari mata atau tangan pengamat.",
                      "Gambar garis mendatar dari mata atau tangan, lalu tambahkan atau kurangkan tingginya."),
    "SMA10-M-B3-08": ("Nilai sudut istimewa tertukar",
                      "Nilai sin, cos, dan tan untuk 30°, 45°, dan 60° tertukar satu sama lain.",
                      "Turunkan lagi dari segitiga bersisi 1, √3, 2 dan segitiga bersisi 1, 1, √2."),
    "SMA10-M-B3-09": ("Besar sudut dianggap nilai perbandingan",
                      "Nilai perbandingan dikira sebanding dengan besar sudut, misalnya 30° dianggap 1/3 dari 90°.",
                      "Nilai perbandingan berasal dari sisi-sisi segitiga, bukan dari membagi besar sudut."),
    "SMA10-M-B3-10": ("Hubungan sin² + cos² = 1 keliru",
                      "Dipakai sin θ = 1 − cos θ, atau akarnya lupa ditarik.",
                      "Kuadratkan dahulu: sin² θ = 1 − cos² θ, lalu tarik akarnya."),
    "SMA10-M-B3-11": ("Perbandingan kebalikan keliru",
                      "sec, csc, dan cot dipasangkan dengan perbandingan yang salah, atau kebalikan dikira bilangan negatif.",
                      "sec = 1/cos, csc = 1/sin, cot = 1/tan: tukar pembilang dan penyebutnya."),
    "SMA10-M-B3-12": ("Sudut komplemen keliru",
                      "Komplemen dihitung dari 180°, atau sin α dikira sama dengan sin β.",
                      "Pada segitiga siku-siku α + β = 90°, dan sisi depan α adalah sisi samping β."),
    "SMA10-M-B3-13": ("Perbandingan diganti selisih",
                      "Pada segitiga sebangun, selisih sisi dianggap tetap, padahal yang tetap adalah perbandingannya.",
                      "Bagi, jangan kurangkan: periksa bahwa kedua pecahan bernilai sama."),
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




# ── Pemetaan awal (pre-test): Pythagoras, the sisi miring, a tangent, sin 30°.
cek(siku(6, 8, 10) and 6 + 8 == 14 and 6 ** 2 + 8 ** 2 == 100 and 8 ** 2 - 6 ** 2 == 28)
soal("PA1", 1, "Dua sisi yang mengapit sudut siku-siku sebuah segitiga panjangnya 6 cm dan 8 cm. Panjang sisi miringnya adalah ...", "A", [
    ("10 cm", True, "Benar. c² = 6² + 8² = 36 + 64 = 100, jadi c = 10 cm.", "", "=pythagoras_kata"),
    ("14 cm", False, "Kedua sisi dijumlahkan tanpa dikuadratkan. Kuadratkan dahulu: 36 + 64 = 100.", "SMA10-M-B3-01", "=pythagoras_kata"),
    ("100 cm", False, "Itu nilai c². Panjang sisi miringnya √100 = 10 cm.", "SMA10-M-B3-01", "=pythagoras_kata"),
    ("√28 cm", False, "Kuadratnya dikurangkan (64 − 36). Untuk mencari sisi miring, kuadrat kedua sisi dijumlahkan.", "SMA10-M-B3-01", "=pythagoras_kata"),
], guna="Pemetaan awal")
soal("PA2", 3, "Pada segitiga siku-siku, nilai sin θ adalah ...", "C", [
    ("sisi depan dibagi sisi miring", True, "Benar. Nilai perbandingan sisi depan terhadap sisi miring disebut sinus.", "", "sinus_cosinus"),
    ("sisi samping dibagi sisi miring", False, "Itu cos θ.", "SMA10-M-B3-04", "sinus_cosinus"),
    ("sisi depan dibagi sisi samping", False, "Itu tan θ.", "SMA10-M-B3-04", "tangen"),
    ("sisi miring dibagi sisi depan", False, "Pembilang dan penyebut tertukar; itu csc θ.", "SMA10-M-B3-03", "kebalikan"),
], guna="Pemetaan awal")
cek(siku(9, 12, 15) and F(9, 12) == F(3, 4) and F(12, 9) == F(4, 3) and F(9, 15) == F(3, 5) and F(12, 15) == F(4, 5))
soal("PA3", 2, "Pada sebuah segitiga siku-siku, sisi depan sudut θ panjangnya 9 cm, sisi sampingnya 12 cm, dan sisi miringnya 15 cm. Nilai tan θ adalah ...", "B", [
    ("3/4", True, "Benar. tan θ = sisi depan/sisi samping = 9/12 = 3/4.", "", "=tangen"),
    ("4/3", False, "Pembilang dan penyebut tertukar (12/9). tan θ = sisi depan/sisi samping.", "SMA10-M-B3-03", "=tangen"),
    ("3/5", False, "Itu sisi depan/sisi miring = 9/15, yaitu sin θ.", "SMA10-M-B3-04", "=sinus_cosinus"),
    ("4/5", False, "Itu sisi samping/sisi miring = 12/15, yaitu cos θ.", "SMA10-M-B3-04", "=sinus_cosinus"),
], guna="Pemetaan awal")
soal("PA4", 5, "Nilai sin 30° adalah ...", "D", [
    ("1/2", True, "Benar. Pada separuh segitiga sama sisi bersisi 2, sisi depan sudut 30° adalah 1 dan sisi miringnya 2, jadi sin 30° = 1/2.", "", "=sudut_istimewa"),
    ("√3/2", False, "Itu cos 30° (sisi samping √3 dibagi sisi miring 2).", "SMA10-M-B3-08", "=sama_sisi"),
    ("√3/3", False, "Itu tan 30° (1/√3).", "SMA10-M-B3-08", "=sama_sisi"),
    ("1/3", False, "30° adalah 1/3 dari 90°, tetapi nilai sinus berasal dari perbandingan sisi, bukan dari besar sudut.", "SMA10-M-B3-09", "=sudut_istimewa"),
], guna="Pemetaan awal")

# ── Cek penguasaan (post-test): every lesson; fresh numbers, no Contoh, Latihan or Uji Kompetensi
# item with its numbers barely changed.
cek(siku(7, 24, 25) and 7 + 24 == 31 and 7 ** 2 + 24 ** 2 == 625 and 24 - 7 == 17)
soal("PB1", 1, "Sebuah papan landai berbentuk segitiga siku-siku. Sisi-sisi yang mengapit sudut siku-sikunya 7 dm dan 24 dm. Panjang sisi miringnya adalah ...", "B", [
    ("25 dm", True, "Benar. c² = 7² + 24² = 49 + 576 = 625, jadi c = 25 dm.", "", "=pythagoras_kata"),
    ("31 dm", False, "Kedua sisi dijumlahkan tanpa dikuadratkan (7 + 24).", "SMA10-M-B3-01", "=pythagoras_kata"),
    ("625 dm", False, "Itu nilai c². Sisi miringnya √625 = 25 dm.", "SMA10-M-B3-01", "=pythagoras_kata"),
    ("17 dm", False, "Kedua sisi dikurangkan (24 − 7). Kuadrat keduanya dijumlahkan, lalu diakarkan.", "SMA10-M-B3-01", "=pythagoras_kata"),
], guna="Cek penguasaan", sulit="Mudah")
cek(F(3, 4) * 20 == 15 and F(4, 3) * 20 == F(80, 3) and desimal(80 / 3, 1) == "26,7" and 20 - (4 - 3) == 19 and 20 * 3 == 60)
soal("PB2", 2, "Pada suatu siang, tiang setinggi 3 m mempunyai bayangan 4 m. Pada saat yang sama, bayangan sebuah gedung panjangnya 20 m. Tinggi gedung itu adalah ...", "D", [
    ("15 m", True, "Benar. Nilai tan θ sama untuk keduanya: 3/4 = t/20, jadi t = 3/4 × 20 = 15 m.", "", "=tan_sudut"),
    ("≈ 26,7 m", False, "Perbandingannya terbalik (4/3 × 20). Tinggi dibagi bayangan: 3/4 = t/20.", "SMA10-M-B3-03", "=tangen"),
    ("19 m", False, "Selisih tinggi dan bayangan (1 m) dianggap tetap. Pada segitiga sebangun yang tetap adalah perbandingannya.", "SMA10-M-B3-13", "=tan_sudut"),
    ("60 m", False, "Bayangan dikalikan 3 tanpa dibagi 4. Tinggi = 3/4 × 20.", "SMA10-M-B3-06", "=tangen"),
], guna="Cek penguasaan", sulit="Sedang")
cek(F(8, 10) * 10 == 8 and F(10) / F(8, 10) == F(25, 2) and siku(6, 8, 10))
soal("PB3", 3, "Sebuah tangga sepanjang 10 m bersandar pada dinding. Sudut θ antara tangga dan tanah memenuhi sin θ = 0,8. Tinggi ujung atas tangga dari tanah adalah ...", "C", [
    ("8 m", True, "Benar. Tinggi adalah sisi depan θ dan tangga sisi miring: tinggi = 0,8 × 10 = 8 m.", "", "=sinus_cosinus"),
    ("12,5 m", False, "Panjang tangga dibagi 0,8. Sisi depan = sin θ × sisi miring. Lagi pula, tinggi tidak mungkin melebihi panjang tangga.", "SMA10-M-B3-06", "=sinus_cosinus"),
    ("6 m", False, "Itu jarak kaki tangga ke dinding (√(100 − 64) = 6), yaitu sisi samping.", "SMA10-M-B3-02", "=sinus_cosinus"),
    ("0,8 m", False, "Nilai sin θ belum dikalikan panjang tangga.", "SMA10-M-B3-06", "=sinus_cosinus"),
], guna="Cek penguasaan", sulit="Sedang")
cek(siku(12, 35, 37) and 37 ** 2 - 12 ** 2 == 35 ** 2 and 1 - F(12, 37) == F(25, 37))
soal("PB4", 4, "Diketahui α sudut lancip dan sin α = 12/37. Nilai cos α adalah ...", "A", [
    ("35/37", True, "Benar. cos² α = 1 − (12/37)² = (1.369 − 144)/1.369 = 1.225/1.369, jadi cos α = 35/37.", "", "=pythagoras_trigonometri"),
    ("25/37", False, "Dipakai cos α = 1 − sin α. Yang benar cos² α = 1 − sin² α.", "SMA10-M-B3-10", "=pythagoras_trigonometri"),
    ("12/35", False, "Itu tan α = sisi depan/sisi samping.", "SMA10-M-B3-04", "=tangen"),
    ("37/35", False, "Itu sec α = 1/cos α.", "SMA10-M-B3-11", "=kebalikan"),
], guna="Cek penguasaan", sulit="Sedang")
cek(1 - F(6, 10) == F(4, 10) and siku(6, 8, 10) and F(6, 10) ** 2 == F(36, 100))
soal("PB5", 4, "Pada segitiga siku-siku, α dan β adalah kedua sudut lancipnya, dan sin α = 0,6. Nilai cos β adalah ...", "C", [
    ("0,6", True, "Benar. α + β = 90°, dan sisi depan α adalah sisi samping β, jadi cos β = sin α = 0,6.", "", "=komplemen_def"),
    ("0,8", False, "Itu cos α. Yang ditanya cos β, dan sisi samping β adalah sisi depan α.", "SMA10-M-B3-12", "=komplemen_def"),
    ("0,4", False, "Dihitung 1 − 0,6. Sudut komplemen tidak berarti nilainya saling melengkapi menjadi 1.", "SMA10-M-B3-12", "=komplemen"),
    ("0,36", False, "Itu sin² α. Tidak ada yang perlu dikuadratkan: cos β = sin α.", "SMA10-M-B3-10", "=komplemen"),
], guna="Cek penguasaan", sulit="Sedang")
cek(desimal(4 * R3, 2) == "6,93" and dekat(12 * tan_(30), 4 * R3) and dekat(12 * tan_(60), 12 * R3) and dekat(12 * sin_(30), 6) and dekat(12 / cos_(30), 8 * R3))
soal("PB6", 5, "Dari titik di tanah yang berjarak 12 m dari kaki sebuah tiang, sudut elevasi ke puncak tiang 30°. Tinggi tiang itu adalah ...", "A", [
    ("4√3 m", True, "Benar. tan 30° = t/12, jadi t = 12 × √3/3 = 4√3 m (sekitar 6,93 m).", "", "=sudut_istimewa"),
    ("12√3 m", False, "Dipakai tan 60° = √3. Sudutnya 30°, dan tan 30° = √3/3.", "SMA10-M-B3-08", "=sudut_istimewa"),
    ("6 m", False, "Dipakai sin 30° = 1/2. Jarak 12 m adalah sisi samping, bukan sisi miring, jadi dipakai tan.", "SMA10-M-B3-04", "=sudut_istimewa"),
    ("8√3 m", False, "Itu 12 : cos 30°, panjang garis pandang ke puncak (sisi miring), bukan tinggi tiang.", "SMA10-M-B3-02", "=sudut_istimewa"),
], guna="Cek penguasaan", sulit="Sedang")
cek(dekat(9 / cos_(60), 18) and dekat(9 * cos_(60), 4.5) and dekat(9 * tan_(60), 9 * R3) and dekat(9 / sin_(60), 6 * R3))
soal("PB7", 6, "Seutas kawat penahan menara diikat ke tanah 9 m dari kaki menara dan membentuk sudut 60° dengan tanah. Panjang kawat itu adalah ...", "D", [
    ("18 m", True, "Benar. Jarak 9 m adalah sisi samping dan kawat sisi miring: cos 60° = 9/k, jadi k = 9 : 1/2 = 18 m.", "", "=sudut_istimewa"),
    ("4,5 m", False, "Jarak dikalikan cos 60°. Kawat berada di penyebut, jadi 9 dibagi cos 60°. Kawat (sisi miring) juga tidak mungkin lebih pendek dari 9 m.", "SMA10-M-B3-06", "=sudut_istimewa"),
    ("9√3 m", False, "Itu 9 × tan 60°, yaitu tinggi titik ikat kawat pada menara, bukan panjang kawat.", "SMA10-M-B3-04", "=sudut_istimewa"),
    ("6√3 m", False, "Dipakai sin 60°. Jarak 9 m adalah sisi samping sudut 60°, jadi dipakai cos.", "SMA10-M-B3-04", "=sudut_istimewa"),
], guna="Cek penguasaan", sulit="Sulit")
soal("PB8", 6, "Panjang sebuah papan landai dan sudutnya terhadap tanah diketahui. Untuk menghitung tinggi ujung atas papan, perbandingan yang paling tepat dipakai adalah ...", "B", [
    ("sinus", True, "Benar. Tinggi adalah sisi depan sudut dan papan sisi miring, jadi dipakai sin θ = sisi depan/sisi miring.", "", "sinus_cosinus"),
    ("cosinus", False, "cos θ memakai sisi samping, yaitu jarak mendatar, bukan tinggi.", "SMA10-M-B3-04", "sinus_cosinus"),
    ("tangen", False, "tan θ memakai sisi depan dan sisi samping, padahal yang diketahui sisi miring.", "SMA10-M-B3-04", "tangen"),
    ("secan", False, "sec θ = sisi miring/sisi samping, dan tidak memuat tinggi.", "SMA10-M-B3-11", "kebalikan"),
], guna="Cek penguasaan", sulit="Sedang")

# ── Latihan (practice), by lesson.
soal("LT1", 1, "Segitiga KLM siku-siku di M. Sisi depan sudut K adalah ...", "D", [
    ("LM", True, "Benar. LM berada tepat di depan sudut K (tidak menyentuh titik K).", "", "sisi_depan"),
    ("KM", False, "KM mengapit sudut K; itu sisi samping sudut K.", "SMA10-M-B3-02", "sisi_samping"),
    ("KL", False, "KL berada di seberang sudut siku-siku M; itu sisi miring.", "SMA10-M-B3-02", "sisi_miring"),
    ("tidak ada", False, "Setiap sudut lancip segitiga siku-siku mempunyai sisi depan: sisi yang tidak menyentuh sudut itu.", "SMA10-M-B3-02", "sisi_depan"),
])
cek(siku(10, 24, 26) and 10 + 26 == 36 and 26 - 10 == 16 and 10 ** 2 + 26 ** 2 == 776)
soal("LT2", 1, "Sisi miring sebuah segitiga siku-siku 26 cm dan salah satu sisi lainnya 10 cm. Panjang sisi ketiga adalah ...", "B", [
    ("24 cm", True, "Benar. b² = 26² − 10² = 676 − 100 = 576, jadi b = 24 cm.", "", "=pythagoras_kata"),
    ("36 cm", False, "Kedua sisi dijumlahkan. Sisi ketiga pasti lebih pendek dari sisi miring.", "SMA10-M-B3-01", "=pythagoras_kata"),
    ("16 cm", False, "Kedua sisi dikurangkan tanpa dikuadratkan (26 − 10).", "SMA10-M-B3-01", "=pythagoras_kata"),
    ("√776 cm", False, "Kuadratnya dijumlahkan, seolah 26 bukan sisi miring. Sisi miringnya diketahui, jadi dikurangkan: 676 − 100.", "SMA10-M-B3-01", "=pythagoras_kata"),
])
cek(siku(9, 40, 41) and not siku(10, 20, 30) and not siku(4, 5, 6) and not siku(6, 7, 8))
soal("LT3", 1, "Tiga bilangan manakah yang dapat menjadi panjang sisi sebuah segitiga siku-siku?", "A", [
    ("9, 40, 41", True, "Benar. 9² + 40² = 81 + 1.600 = 1.681 = 41².", "", "=pythagoras_kata"),
    ("10, 20, 30", False, "10² + 20² = 500, bukan 900. Selisih yang sama tidak membuat segitiga siku-siku.", "SMA10-M-B3-01", "=pythagoras_kata"),
    ("4, 5, 6", False, "4² + 5² = 41, bukan 36.", "SMA10-M-B3-01", "=pythagoras_kata"),
    ("6, 7, 8", False, "6² + 7² = 85, bukan 64.", "SMA10-M-B3-01", "=pythagoras_kata"),
])
soal("LT4", 1, "Sebuah segitiga siku-siku mempunyai sudut 35° dan 55°. Sisi depan sudut 35° bagi sudut 55° adalah ...", "C", [
    ("sisi samping", True, "Benar. Sisi di depan sudut 35° mengapit sudut 55°, jadi bagi sudut 55° sisi itu sisi samping.", "", "sisi_samping"),
    ("sisi depan juga", False, "Nama sisi bergantung pada sudut yang diperhatikan. Sisi depan sudut 35° menyentuh sudut 55°.", "SMA10-M-B3-02", "sisi_depan"),
    ("sisi miring", False, "Sisi miring berada di seberang sudut siku-siku dan sama bagi kedua sudut lancip.", "SMA10-M-B3-02", "sisi_miring"),
    ("tidak mempunyai nama", False, "Setiap sisi segitiga siku-siku mempunyai nama terhadap setiap sudut lancipnya.", "SMA10-M-B3-02", "sisi_samping"),
])
soal("LT5", 2, "Nilai tan θ pada segitiga siku-siku adalah ...", "A", [
    ("sisi depan dibagi sisi samping", True, "Benar. Tangen suatu sudut ditentukan dengan membagi panjang sisi depan dengan sisi samping.", "", "tangen"),
    ("sisi samping dibagi sisi depan", False, "Pembilang dan penyebut tertukar; itu cot θ.", "SMA10-M-B3-03", "kebalikan"),
    ("sisi depan dibagi sisi miring", False, "Itu sin θ.", "SMA10-M-B3-04", "sinus_cosinus"),
    ("sisi samping dibagi sisi miring", False, "Itu cos θ.", "SMA10-M-B3-04", "sinus_cosinus"),
])
cek(siku(5, 12, 13) and F(5, 12) != F(12, 5))
soal("LT6", 2, "Pada sebuah segitiga siku-siku, sisi depan sudut θ panjangnya 5 cm dan sisi sampingnya 12 cm. Nilai tan θ adalah ...", "D", [
    ("5/12", True, "Benar. tan θ = sisi depan/sisi samping = 5/12.", "", "=tangen"),
    ("12/5", False, "Pembilang dan penyebut tertukar.", "SMA10-M-B3-03", "=tangen"),
    ("5/13", False, "Sisi miringnya 13 (5² + 12² = 13²), dan 5/13 adalah sin θ.", "SMA10-M-B3-04", "=sinus_cosinus"),
    ("12/13", False, "Itu cos θ = sisi samping/sisi miring.", "SMA10-M-B3-04", "=sinus_cosinus"),
])
cek(F(2 * 3, 2 * 4) == F(3, 4))
soal("LT7", 2, "Dua segitiga siku-siku sebangun mempunyai sudut θ yang sama besar. Setiap sisi segitiga kedua dua kali panjang sisi segitiga pertama. Nilai tan θ pada segitiga kedua ... nilai tan θ pada segitiga pertama.", "C", [
    ("sama dengan", True, "Benar. Sisi depan dan sisi samping sama-sama dikali 2, jadi perbandingannya tetap. Nilai tan hanya ditentukan oleh besar sudut.", "", "tan_sudut"),
    ("dua kali", False, "Pembilang dan penyebut sama-sama dikali 2, jadi hasil baginya tidak berubah.", "SMA10-M-B3-05", "tan_sudut"),
    ("setengah dari", False, "Segitiga yang lebih besar tidak mengubah nilai tan untuk sudut yang sama.", "SMA10-M-B3-05", "tan_sudut"),
    ("empat kali", False, "Luasnya menjadi empat kali, tetapi tan adalah perbandingan dua sisi, bukan luas.", "SMA10-M-B3-05", "tan_sudut"),
])
cek(F(4, 10) * 15 == 6 and F(15) / F(4, 10) == F(75, 2) and F(15) + F(4, 10) == F(154, 10) and siku(6, 8, 10))
soal("LT8", 2, "Nilai tan θ untuk sudut antara bayangan dan sinar matahari adalah 0,4. Bayangan sebuah pohon panjangnya 15 m. Tinggi pohon itu adalah ...", "B", [
    ("6 m", True, "Benar. tan θ = tinggi/bayangan, jadi tinggi = 0,4 × 15 = 6 m.", "", "=tangen"),
    ("37,5 m", False, "Bayangan dibagi 0,4. Tinggi ada di pembilang, jadi dikalikan.", "SMA10-M-B3-06", "=tangen"),
    ("15,4 m", False, "0,4 ditambahkan pada panjang bayangan. tan θ adalah perbandingan, jadi dikalikan.", "SMA10-M-B3-13", "=tangen"),
    ("0,4 m", False, "Nilai tan θ belum dikalikan panjang bayangan.", "SMA10-M-B3-06", "=tangen"),
])
cek(siku(7, 24, 25) and F(24, 25) != F(7, 25))
soal("LT9", 3, "Sebuah segitiga siku-siku bersisi 7, 24, dan 25, dan sisi depan sudut θ adalah 7. Nilai cos θ adalah ...", "A", [
    ("24/25", True, "Benar. cos θ = sisi samping/sisi miring = 24/25.", "", "=sinus_cosinus"),
    ("7/25", False, "Itu sin θ = sisi depan/sisi miring.", "SMA10-M-B3-04", "=sinus_cosinus"),
    ("7/24", False, "Itu tan θ = sisi depan/sisi samping.", "SMA10-M-B3-04", "=tangen"),
    ("25/24", False, "Pembilang dan penyebut tertukar; itu sec θ.", "SMA10-M-B3-03", "=kebalikan"),
])
cek(F(64, 100) * 50 == 32 and F(50) / F(64, 100) == F(625, 8) and desimal(50 / 0.64, 1) == "78,1" and F(50) + F(64, 100) == F(5064, 100))
soal("LT10", 3, "Pada segitiga siku-siku, sisi miringnya 50 m dan cos θ ≈ 0,64. Panjang sisi samping sudut θ kira-kira ...", "C", [
    ("32 m", True, "Benar. cos θ = sisi samping/sisi miring, jadi sisi samping ≈ 0,64 × 50 = 32 m.", "", "=sinus_cosinus"),
    ("78,1 m", False, "Sisi miring dibagi 0,64. Sisi samping tidak mungkin lebih panjang dari sisi miring.", "SMA10-M-B3-06", "=sinus_cosinus"),
    ("50,64 m", False, "0,64 ditambahkan. Nilai cos adalah perbandingan, jadi dikalikan.", "SMA10-M-B3-13", "=sinus_cosinus"),
    ("0,64 m", False, "Nilai cos θ belum dikalikan sisi miring.", "SMA10-M-B3-06", "=sinus_cosinus"),
])
cek(F(52, 10) - F(12, 10) == 4 and F(4) / F(1, 2) == 8 and F(52, 10) / F(1, 2) == F(104, 10) and (F(52, 10) + F(12, 10)) / F(1, 2) == F(128, 10) and F(4) * F(1, 2) == 2)
soal("LT11", 3, "Sebuah layangan terbang 5,2 m di atas tanah. Ujung talinya dipegang 1,2 m di atas tanah, dan tali membentuk sudut θ dengan garis mendatar, dengan sin θ = 0,5. Panjang tali yang terulur adalah ...", "D", [
    ("8 m", True, "Benar. Sisi depan = 5,2 − 1,2 = 4 m, dan tali sisi miring: 4 : 0,5 = 8 m.", "", "=layangan"),
    ("10,4 m", False, "Tinggi tangan tidak dikurangkan (5,2 : 0,5). Segitiganya dimulai dari tangan.", "SMA10-M-B3-07", "=layangan"),
    ("12,8 m", False, "Tinggi tangan malah ditambahkan ((5,2 + 1,2) : 0,5). Tinggi tangan dikurangkan.", "SMA10-M-B3-07", "=layangan"),
    ("2 m", False, "Sisi depan dikalikan 0,5. Tali adalah sisi miring, jadi 4 dibagi sin θ.", "SMA10-M-B3-06", "=sinus_cosinus"),
])
cek(cos_(20) > cos_(70) and sin_(20) < sin_(70))
soal("LT12", 3, "Untuk sudut lancip θ, jika θ makin besar, nilai cos θ ...", "B", [
    ("makin kecil", True, "Benar. Misalnya cos 30° ≈ 0,87, cos 41° ≈ 0,75, dan cos 60° = 0,5.", "", "=sinus_cosinus"),
    ("makin besar", False, "Itu berlaku untuk sin θ. Sisi samping makin pendek dibanding sisi miring, jadi cos θ makin kecil.", "SMA10-M-B3-04", "=sinus_cosinus"),
    ("tetap", False, "Nilai perbandingan berubah jika sudutnya berubah.", "SMA10-M-B3-05", "tan_sudut"),
    ("selalu 1", False, "cos θ = 1 hanya jika sisi samping sama dengan sisi miring, yang tidak terjadi untuk sudut lancip.", "SMA10-M-B3-09", "=sinus_cosinus"),
])
cek(1 - F(6, 10) ** 2 == F(64, 100) and F(8, 10) ** 2 == F(64, 100) and 1 - F(6, 10) == F(4, 10) and 1 + F(6, 10) == F(16, 10))
soal("LT13", 4, "Diketahui θ sudut lancip dan cos θ = 0,6. Nilai sin θ adalah ...", "C", [
    ("0,8", True, "Benar. sin² θ = 1 − 0,6² = 1 − 0,36 = 0,64, jadi sin θ = 0,8.", "", "=pythagoras_trigonometri"),
    ("0,4", False, "Dipakai sin θ = 1 − cos θ. Yang benar sin² θ = 1 − cos² θ.", "SMA10-M-B3-10", "=pythagoras_trigonometri"),
    ("0,64", False, "Itu sin² θ. Akarnya belum ditarik.", "SMA10-M-B3-10", "=pythagoras_trigonometri"),
    ("1,6", False, "Dihitung 1 + 0,6. Nilai sin θ untuk sudut lancip selalu kurang dari 1.", "SMA10-M-B3-10", "=pythagoras_trigonometri"),
])
cek(F(3, 5) / F(4, 5) == F(3, 4) and F(3, 5) * F(4, 5) == F(12, 25) and F(3, 5) + F(4, 5) == F(7, 5))
soal("LT14", 4, "Diketahui sin θ = 3/5 dan cos θ = 4/5. Nilai tan θ adalah ...", "D", [
    ("3/4", True, "Benar. tan θ = sin θ/cos θ = (3/5) : (4/5) = 3/4.", "", "=tan_sin_cos"),
    ("4/3", False, "Pembagiannya terbalik (cos θ/sin θ); itu cot θ.", "SMA10-M-B3-03", "=tan_sin_cos"),
    ("12/25", False, "sin θ dan cos θ dikalikan. tan θ adalah hasil bagi keduanya.", "SMA10-M-B3-04", "=tan_sin_cos"),
    ("7/5", False, "sin θ dan cos θ dijumlahkan. tan θ adalah hasil bagi keduanya.", "SMA10-M-B3-04", "=tan_sin_cos"),
])
cek(1 / F(2, 3) == F(3, 2) and 1 - F(2, 3) == F(1, 3) and 9 - 4 == 5)
soal("LT15", 4, "Diketahui cos θ = 2/3. Nilai sec θ adalah ...", "A", [
    ("3/2", True, "Benar. sec θ = 1/cos θ = 3/2.", "", "=kebalikan"),
    ("1/3", False, "Dihitung 1 − 2/3. Kebalikan berarti 1 dibagi 2/3.", "SMA10-M-B3-11", "=kebalikan"),
    ("√5/3", False, "Itu sin θ (sisi depan √(9 − 4) = √5). sec θ adalah kebalikan cos θ.", "SMA10-M-B3-11", "=kebalikan"),
    ("−2/3", False, "Kebalikan bukan lawan tanda. sec θ = 1/cos θ.", "SMA10-M-B3-11", "=kebalikan"),
])
cek(90 - 25 == 65 and 180 - 25 == 155 and 90 + 25 == 115 and dekat(sin_(25), cos_(65)))
soal("LT16", 4, "sin 25° sama dengan ...", "B", [
    ("cos 65°", True, "Benar. 25° + 65° = 90°, jadi sin 25° = cos 65°.", "", "=komplemen"),
    ("cos 25°", False, "sin dan cos sudut yang sama umumnya berbeda. Pasangan komplemen 25° adalah 65°.", "SMA10-M-B3-12", "=komplemen"),
    ("cos 155°", False, "Komplemen dihitung dari 180°. Pada segitiga siku-siku, α + β = 90°.", "SMA10-M-B3-12", "=komplemen_def"),
    ("cos 115°", False, "25° ditambahkan pada 90°. Komplemen 25° adalah 90° − 25° = 65°.", "SMA10-M-B3-12", "=komplemen_def"),
])
soal("LT17", 5, "Nilai tan 45° adalah ...", "C", [
    ("1", True, "Benar. Pada segitiga siku-siku sama kaki, sisi depan dan sisi samping sama panjang, jadi tan 45° = 1/1 = 1.", "", "=sama_kaki"),
    ("√2/2", False, "Itu sin 45° atau cos 45°.", "SMA10-M-B3-08", "=sama_kaki"),
    ("√2", False, "Itu panjang sisi miringnya, bukan perbandingan.", "SMA10-M-B3-02", "=sama_kaki"),
    ("1/2", False, "45° adalah setengah dari 90°, tetapi nilai tan berasal dari perbandingan sisi.", "SMA10-M-B3-09", "=sama_kaki"),
])
soal("LT18", 5, "Nilai cos 30° adalah ...", "D", [
    ("√3/2", True, "Benar. Pada separuh segitiga sama sisi bersisi 2, sisi samping sudut 30° adalah √3 dan sisi miring 2.", "", "=sama_sisi"),
    ("1/2", False, "Itu sin 30° atau cos 60°.", "SMA10-M-B3-08", "=sin30_cos60"),
    ("√3/3", False, "Itu tan 30°.", "SMA10-M-B3-08", "=sama_sisi"),
    ("√3", False, "Itu tan 60°.", "SMA10-M-B3-08", "=sama_sisi"),
])
cek(2 ** 2 - 1 ** 2 == 3 and 1 ** 2 + 2 ** 2 == 5)
soal("LT19", 5, "Segitiga sama sisi bersisi 2 satuan dibelah dua oleh garis tingginya. Panjang garis tinggi itu adalah ...", "A", [
    ("√3", True, "Benar. Sisi miring 2 dan alas separuhnya 1, jadi tinggi = √(2² − 1²) = √3.", "", "=sama_sisi"),
    ("√5", False, "Kuadratnya dijumlahkan (1² + 2²). Sisi 2 adalah sisi miring, jadi dikurangkan.", "SMA10-M-B3-01", "=sama_sisi"),
    ("1", False, "Itu separuh alasnya, bukan tingginya.", "SMA10-M-B3-02", "=sama_sisi"),
    ("2", False, "Itu panjang sisi segitiga, yang menjadi sisi miring.", "SMA10-M-B3-02", "=sama_sisi"),
])
cek(dekat(4 * sin_(30), 2) and dekat(4 * cos_(30), 2 * R3) and dekat(4 / sin_(30), 8) and dekat(4 * tan_(30), 4 * R3 / 3))
soal("LT20", 6, "Sebuah perosotan lurus sepanjang 4 m membentuk sudut 30° dengan tanah. Tinggi puncak perosotan adalah ...", "B", [
    ("2 m", True, "Benar. Tinggi adalah sisi depan dan perosotan sisi miring: 4 × sin 30° = 4 × 1/2 = 2 m.", "", "=sudut_istimewa"),
    ("2√3 m", False, "Dipakai cos 30°. Itu jarak mendatar kaki perosotan, bukan tingginya.", "SMA10-M-B3-04", "=sudut_istimewa"),
    ("8 m", False, "4 dibagi sin 30°. Perosotan adalah sisi miring, jadi dikalikan.", "SMA10-M-B3-06", "=sudut_istimewa"),
    ("4√3/3 m", False, "Dipakai tan 30°, padahal 4 m adalah sisi miring, bukan sisi samping.", "SMA10-M-B3-04", "=sudut_istimewa"),
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
# changed. The book's items (its worked examples included) and each post-test question's own numbers:
BUKU = {
    "Gambar 3.15": "anak 114 cm dan 200 cm, remaja 148 cm, dewasa 305 cm", "Piramida": "41°, rusuk 600 m",
    "Layangan": "3,5 m, 60 cm, 20°",
    "Latihan 3.1": "sisi x, y, z dengan 45°; Putri m, n, o dengan 30°",
    "Latihan 3.2": "15 cm, 7 cm, 70°; segitiga 40°",
    "Latihan 3.3": "tinggi orang dewasa; tan θ = 0,47, b = 12 cm",
    "Latihan 3.4": "22,7 cm 62°; 3 m 18° 72°; 18 cm 32° 58°; 30° dan 60°; tan A = 4/3; 814 m dan 1.151 m; menara 150 m dan 125 m 60°; pesawat 3° 200 m; sungai 400 m 31°; 330,8 m 36°; Dimas 34° 52 m",
    "Latihan 3.5": "PQR 3, 4, 5 dengan 53,2° dan 36,8°; cos θ = 4/5; sin θ = 5/13",
    "Latihan 3.6": "dua sisi 8 cm; Nia 5√3 cm, 5 cm, 15 cm",
    "Latihan 3.7": "9,2 dan 30°; ABC 5, 12, 13; KLM 3, 2, √13; x, y, z dengan 8, 45°, 60°; gedung 120 m 30°; segitiga 30° dengan 4; diagonal dua kali lebar; tiang 50 m 45° dan 60°",
    "Uji Kompetensi": "cos x = 20/29; tangga 75° dan lantai 3,2 m; cos B = sin A",
}
POST_ANGKA = {"PB1": "7 dm dan 24 dm", "PB2": "3 m, 4 m, 20 m", "PB3": "10 m, sin θ = 0,8", "PB4": "sin α = 12/37",
              "PB5": "sin α = 0,6", "PB6": "12 m, 30°", "PB7": "9 m, 60°", "PB8": "papan landai"}
cek(set(POST_ANGKA) == {s["ref"] for s in POST} and not set(POST_ANGKA.values()) & set(BUKU.values()))
for s in POST:
    cek(all(w in s["tanya"] for w in POST_ANGKA[s["ref"]].replace(" dan ", ", ").split(", ")), s["ref"])
cek(not any(w in s["tanya"] for s in POST for w in ("114", "148", "305", "600 m", "41°", "3,5 m", "0,47", "4/3", "814",
                                                   "1.151", "150 m", "200 m", "400 m", "52 m", "4/5", "5/13", "8 cm",
                                                   "120 m", "50 m", "20/29", "75°", "3,2 m", "70°", "40°")))


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
    tulis(os.path.join(here, "SMA10-Matematika-Bab3.xlsx"))
    tulis_miskonsepsi(os.path.join(here, "SMA10-Matematika-Bab3-miskonsepsi.csv"))
    halaman = sum(p["isi"].count("## ") for p in PELAJARAN)
    print(f"SMA10-Matematika-Bab3.xlsx: lessons {len(PELAJARAN)} ({halaman} pages), questions {len(S)} "
          f"(pre {len(PRE)}, post {len(POST)}, practice {len(LAT)}), answers "
          + " ".join(f"{h}={HURUF[h]}" for h in "ABCD"))
    print(f"SMA10-Matematika-Bab3-miskonsepsi.csv: {len(MISKONSEPSI)} codes")
    print(f"facts traced: {len(FAKTA)} (pages {min(h for h, _ in FAKTA.values())}-{max(h for h, _ in FAKTA.values())})")
    if "--kutipan" in sys.argv:
        ada, gambar = periksa_kutipan(sys.argv[sys.argv.index("--kutipan") + 1])
        print(f"quotations found in the book's text: {ada} of {len(FAKTA)}; figures read by eye: {', '.join(gambar) or 'none'}")
    print(f"assertions passed: {CEK[0]}")
