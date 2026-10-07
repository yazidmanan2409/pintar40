# SD Kelas 5, Matematika, Bab 6 "Sudut", as a PINTAR lesson workbook in the D-007 template
# (sheets Kursus, Bab, Pelajaran, Soal, Pilihan; the column contract is KOLOM in
# src/lib/unggah-kontrak.ts). Built the way Bab 1-5 were (all passed).
#
# Source: Buku Panduan Guru Matematika untuk SD/MI Kelas V (Meita Fitrianawati, Ika Surtiani,
# Ait Istiandaru; Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi, 2022), Bab 6,
# pp. 247-284. Lessons follow subbab A-D; subbab C (mengukur dan membandingkan) is split in three
# (the protractor; kinds of angle by size and comparing; angles on a clock, which the book's own
# exercises and Uji Kompetensi use throughout).
#
# The player draws no angles, so angles are given by what makes them: the hands of a clock, a
# turn, a folded paper, the reading on a protractor described in words. `sudut_jam()` computes
# every clock angle and `bacaan_busur()` every protractor reading, so answers and distractors are
# checked, not typed.
#
# Text lessons only (D-050). The workbook's "Kode miskonsepsi" column names each distractor's code,
# defined on its "Miskonsepsi" sheet (CR-50, D-063 M5); SD5-Matematika-Bab6-miskonsepsi.csv lists
# the same codes with the questions using them.
#
# Run: python3 docs/onboarding/konten/sd5_matematika_bab6.py
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


def sudut_jam(jam, menit=0):
    """The smaller angle between the hands: the hour hand moves 30 degrees an hour and half a
    degree a minute, the minute hand 6 degrees a minute."""
    pendek = Fraction(30) * (jam % 12) + Fraction(1, 2) * menit
    panjang = Fraction(6) * menit
    d = abs(pendek - panjang) % 360
    return min(d, 360 - d)


def jarum_pendek_diam(jam, menit=0):
    """The slip: the hour hand left on the hour while the minutes pass."""
    d = abs(30 * (jam % 12) - 6 * menit) % 360
    return min(d, 360 - d)


def bacaan_busur(kaki_pada_nol, skala_dalam):
    """A leg through `skala_dalam` on the inner scale also sits at 180 - that on the outer scale.
    The angle is read on the scale whose 0 lies on the other leg."""
    luar = 180 - skala_dalam
    return skala_dalam if kaki_pada_nol == "dalam" else luar, luar


def jenis(derajat):
    if derajat == 0:
        return "nol"
    if derajat < 90:
        return "lancip"
    if derajat == 90:
        return "siku-siku"
    if derajat < 180:
        return "tumpul"
    if derajat == 180:
        return "lurus"
    if derajat < 360:
        return "refleks"
    return "satu putaran"


# ── Book keys (checked; see handoff/LANA-06.md for the ones that are not right) ──
cek([sudut_jam(1), sudut_jam(9), sudut_jam(4), sudut_jam(1, 30)] == [30, 90, 120, 135])          # p. 267
cek([sudut_jam(10), sudut_jam(15), sudut_jam(7), sudut_jam(4, 30)] == [60, 90, 150, 45])          # p. 268
cek([sudut_jam(11), sudut_jam(8), sudut_jam(6)] == [30, 120, 180])                              # p. 276
cek(jenis(sudut_jam(8)) == "tumpul" and jenis(sudut_jam(10, 30)) == "tumpul")                   # pp. 261-262
cek(max(105, 130, 135, 85) == 135 and 180 + 60 == 360 - 120 == 240)                            # pp. 265-266
cek(360 // 5 == 72 and (180 - 72) // 2 == 54 and 2 * 54 == 108)                                 # p. 277
# BOOK ERROR (p. 277): the pentagon's triangle is labelled 72, 56, 56, which is 184 degrees; the
# base angles are 54 (and 2 x 54 = 108, the angle the key then uses).
cek(72 + 56 + 56 == 184 != 180 and 72 + 54 + 54 == 180)
# p. 278 leaves both gaps blank: Pola 1 (square and two pentagons) 54, Pola 2 (three pentagons) 36.
cek(360 - 90 - 2 * 108 == 54 and 360 - 3 * 108 == 36)
# Uji Kompetensi 2 (roads): the four angles given, 110 + 90 + 25 + 130 = 355, are not the four
# angles round one crossing (360). The figure is in the student book, so it cannot be checked here.
cek(110 + 90 + 25 + 130 == 355)

# ── Lesson examples ─────────────────────────────────────────────────────────────
cek(sudut_jam(3) == 90 and jenis(sudut_jam(11)) == "lancip" and jenis(sudut_jam(8)) == "tumpul" and sudut_jam(6) == 180)
cek(sudut_jam(4, 30) == 45 and jarum_pendek_diam(4, 30) == 60)
cek(bacaan_busur("dalam", 50) == (50, 130) and jenis(50) == "lancip")
cek(360 - 120 == 240 and jenis(240) == "refleks")
cek(360 - 90 - 108 - 108 == 54 and 180 - 35 == 145)

SUMBER = ("_Diadaptasi dari Buku Panduan Guru Matematika untuk SD/MI Kelas V, Kementerian Pendidikan, "
          "Kebudayaan, Riset, dan Teknologi, 2022, Bab 6._")

KURSUS = {
    "Judul kursus*": "Matematika Kelas 5 · Bab 6: Sudut",
    "Mata pelajaran*": "Matematika",
    "Jenjang*": "SD",
    "Kelas*": "Kelas 5",
    "Konteks": "Akademik",
}

BAB = [(1, "Sudut")]

PELAJARAN = [
    dict(no=1, judul="Sudut Siku-Siku",
         ringkasan="Sudut siku-siku seperti pojok bingkai atau pojok buku; kita dapat memeriksanya dengan kertas yang dilipat.",
         tujuan="Kalian dapat menemukan sudut siku-siku di sekitarnya dan memeriksanya dengan alat sederhana.",
         bloom="Memahami",
         isi=f"""## Pojok bingkai

Perhatikan pojok bingkai foto, pojok buku, atau pojok jendela. Pojok-pojok itu membentuk **sudut siku-siku**.

Tukang kayu memakai **penggaris siku-siku** untuk memastikan pojok bingkai yang dibuatnya benar-benar siku-siku.

## Membuat alat pemeriksa

Kalian dapat membuat alat seperti penggaris siku-siku dari selembar kertas bekas:

1. Lipat kertas menjadi dua.
2. Lipat sekali lagi sehingga garis lipatan pertama bertemu dengan dirinya sendiri.
3. Pojok yang terbentuk di tengah lipatan adalah sudut siku-siku.

Untuk memeriksa sebuah pojok, tempelkan pojok kertas itu. Satu sisi kertas harus **berimpit** tepat dengan satu tepi benda.

- Bila tepi yang lain juga berimpit, pojok itu siku-siku.
- Bila tepi yang lain masuk ke dalam kertas, sudutnya lebih kecil dari siku-siku.
- Bila tepi yang lain berada di luar kertas, sudutnya lebih besar dari siku-siku.

## Posisinya boleh apa saja

Sudut siku-siku tidak harus mempunyai satu sisi yang mendatar. Pojok buku yang diletakkan miring di atas meja tetap siku-siku. Pojok ubin yang dilihat dari samping juga tetap siku-siku.

Yang menentukan hanyalah besar bukaannya, bukan arahnya.

**Coba:** berapa sudut siku-siku pada sebuah persegi panjang?
_Periksa: 4, satu di setiap pojok._

{SUMBER}"""),
    dict(no=2, judul="Pengertian dan Jenis Sudut",
         ringkasan="Sudut dibentuk oleh dua kaki sudut yang bertemu di satu titik sudut; sudut lancip lebih kecil dan sudut tumpul lebih besar dari sudut siku-siku.",
         tujuan="Kalian dapat menyebutkan bagian-bagian sudut dan mengelompokkan sudut menjadi lancip, siku-siku, dan tumpul.",
         bloom="Memahami",
         isi=f"""## Bagian-bagian sudut

Sebuah **sudut** dibentuk oleh dua garis lurus yang bertemu di satu titik.

- Kedua garis lurus itu disebut **kaki sudut**.
- Titik tempat keduanya bertemu disebut **titik sudut**.

Pojok meja yang tajam adalah sudut: ada dua tepi lurus yang bertemu di satu titik.

## Pojok yang bukan sudut

Pojok kotak pensil yang **membulat** bukan sudut. Di situ tidak ada dua garis lurus yang bertemu tepat di satu titik; tepinya melengkung.

Jadi tidak semua pojok adalah sudut. Periksa dahulu: adakah dua kaki lurus dan satu titik sudut?

## Lancip, siku-siku, tumpul

Bandingkan sebuah sudut dengan sudut siku-siku:

| Jenis | Dibandingkan dengan sudut siku-siku | Contoh |
|---|---|---|
| Sudut lancip | lebih kecil | gunting yang terbuka sedikit |
| Sudut siku-siku | sama | pojok jendela |
| Sudut tumpul | lebih besar | kipas yang terbuka lebar |

## Sudut pada jarum jam

Jarum pendek dan jarum panjang jam juga membentuk sudut. Titik sudutnya adalah poros di tengah jam.

- Pukul 03.00: siku-siku.
- Pukul 11.00: lebih kecil dari siku-siku, jadi **lancip**.
- Pukul 08.00: lebih besar dari siku-siku, jadi **tumpul**.

**Coba:** pukul 01.00 membentuk sudut apa?
_Periksa: lancip, lebih kecil dari pukul 03.00._

{SUMBER}"""),
    dict(no=3, judul="Mengukur Sudut dengan Busur Derajat",
         ringkasan="Besar sudut diukur dalam derajat dengan busur derajat; yang dibaca adalah skala yang dimulai dari 0 pada salah satu kaki sudut.",
         tujuan="Kalian dapat mengukur besar sudut dengan busur derajat dan membaca skalanya dengan tepat.",
         bloom="Menerapkan",
         isi=f"""## Satuan derajat

Besar sudut diukur dalam **derajat**, ditulis dengan tanda °.

- Satu putaran penuh besarnya **360°**.
- Setengah putaran (sudut lurus) besarnya **180°**.
- Seperempat putaran (sudut siku-siku) besarnya **90°**.

Alat untuk mengukurnya disebut **busur derajat**. Busur berbentuk setengah lingkaran, dengan angka 0 sampai 180.

## Langkah mengukur

1. Letakkan **titik pusat** busur tepat di titik sudut.
2. Impitkan **garis dasar** busur dengan salah satu kaki sudut.
3. Lihat skala yang angka **0**-nya ada di kaki itu.
4. Ikuti skala itu sampai kaki sudut yang lain, lalu baca angkanya.

## Dua skala

Busur mempunyai dua deret angka: skala dalam dan skala luar. Keduanya berjalan berlawanan arah. Di tempat skala dalam menunjukkan 50, skala luar menunjukkan 130, karena 50 + 130 = 180.

Mana yang dibaca? Yang **0-nya berada di kaki pertama**. Bila kaki pertama ada di angka 0 skala dalam dan kaki kedua melewati 50 (dalam) dan 130 (luar), sudutnya **50°**.

Periksa dengan jenisnya: sudut itu tampak lebih kecil dari siku-siku, jadi lancip, dan 50° memang lancip. Bila kalian membaca 130°, itu tumpul, tidak cocok.

## Posisi busur

Busur tidak harus selalu mendatar. Putar busurnya mengikuti arah kaki sudut, sampai garis dasarnya berimpit dengan salah satu kaki.

{SUMBER}"""),
    dict(no=4, judul="Jenis Sudut Menurut Besarnya dan Membandingkan Sudut",
         ringkasan="Sudut dikelompokkan menurut besarnya dalam derajat; besar sudut ditentukan oleh bukaannya, bukan oleh panjang kakinya.",
         tujuan="Kalian dapat menentukan jenis sudut dari besarnya, menghitung sudut refleks, dan membandingkan besar sudut.",
         bloom="Menerapkan",
         isi=f"""## Jenis sudut menurut besarnya

| Jenis | Besar |
|---|---|
| Sudut nol | 0° |
| Sudut lancip | lebih dari 0° dan kurang dari 90° |
| Sudut siku-siku | tepat 90° |
| Sudut tumpul | lebih dari 90° dan kurang dari 180° |
| Sudut lurus | tepat 180° |
| Sudut refleks | lebih dari 180° dan kurang dari 360° |
| Satu putaran | 360° |

Perhatikan batasnya: 90° adalah siku-siku, bukan lancip dan bukan tumpul. 180° adalah sudut lurus, bukan tumpul.

## Sudut refleks

Dua kaki sudut selalu membentuk dua sudut: bagian yang kecil dan bagian yang besar di baliknya. Keduanya bersama-sama membentuk satu putaran, 360°.

Bila bagian yang kecil 120°, bagian yang besar adalah 360° − 120° = **240°**. Sudut 240° disebut sudut **refleks**.

Busur hanya sampai 180°, jadi sudut refleks dihitung dengan mengurangkan dari 360°.

## Membandingkan sudut

Tari pakarena dari Sulawesi Selatan memakai kipas. Kipas yang terbuka paling lebar adalah kipas yang **sudutnya paling besar**.

Panjang bilah kipas tidak menentukan besar sudut. Kipas kecil yang dibuka 120° lebih lebar bukaannya daripada kipas besar yang dibuka 90°.

Begitu juga dua sudut yang sama besar, misalnya 40°, tetap sama besar walaupun kaki yang satu 10 cm dan yang lain 3 cm. Jarak antara ujung-ujung kakinya memang berbeda, tetapi bukaannya sama.

## Mengurutkan

Urutkan 95°, 180°, 45°, dan 270° dari yang terkecil: **45°; 95°; 180°; 270°**. Lancip, tumpul, lurus, lalu refleks.

{SUMBER}"""),
    dict(no=5, judul="Sudut pada Jam",
         ringkasan="Jarak antara dua angka yang berdekatan pada jam adalah 30°; jarum pendek ikut bergerak saat menit berjalan.",
         tujuan="Kalian dapat menghitung besar sudut yang dibentuk jarum jam pada waktu tertentu.",
         bloom="Menerapkan",
         isi=f"""## Setiap angka 30°

Angka 1 sampai 12 pada jam membagi satu putaran penuh (360°) menjadi 12 bagian yang sama. Jadi dari satu angka ke angka berikutnya besarnya **360° : 12 = 30°**.

Pukul 04.00: jarum panjang di angka 12, jarum pendek di angka 4. Ada 4 langkah angka di antaranya: 4 × 30° = **120°**.

## Sudut terkecil

Dari jarum yang satu ke jarum yang lain dapat dihitung ke dua arah. Yang biasa ditanyakan adalah **sudut terkecil**.

Pukul 10.00: dari angka 10 ke angka 12 ada 2 langkah, 2 × 30° = **60°**. Arah yang lain, 10 langkah, memberi 300°. Itu sudut refleksnya, bukan sudut terkecil.

## Jarum pendek ikut bergerak

Pada pukul 04.30, jarum panjang di angka 6. Jarum pendek **tidak** tepat di angka 4: setengah jam sudah lewat, jadi ia berada di tengah-tengah angka 4 dan 5.

1. Dari angka 4 ke angka 6 ada 2 langkah: 60°.
2. Jarum pendek sudah maju setengah langkah (15°) ke arah angka 6.
3. Jadi sudutnya 60° − 15° = **45°**.

Bila jarum pendek dianggap tetap di angka 4, hasilnya 60°, terlalu besar.

**Coba:** pukul 01.30.
_Periksa: dari angka 1 ke 6 ada 5 langkah (150°), jarum pendek sudah maju 15° ke arah angka 6, jadi 150° − 15° = 135°._

{SUMBER}"""),
    dict(no=6, judul="Melukis Sudut dan Memecahkan Masalah",
         ringkasan="Sudut dilukis dengan busur derajat; sudut-sudut di sekeliling satu titik berjumlah 360° dan sudut-sudut pada garis lurus berjumlah 180°.",
         tujuan="Kalian dapat melukis sudut dengan besar tertentu dan memecahkan masalah dengan sudut di sekeliling satu titik.",
         bloom="Menerapkan",
         isi=f"""## Langkah melukis sudut

Melukis sudut 120°:

1. Gambar satu garis lurus sebagai kaki pertama. Salah satu ujungnya akan menjadi titik sudut.
2. Letakkan titik pusat busur di ujung itu, dan impitkan garis dasar busur dengan garisnya.
3. Cari skala yang angka **0**-nya ada di garis itu. Ikuti skala itu sampai angka 120, lalu beri titik.
4. Hubungkan titik sudut dengan titik tadi. Itulah kaki kedua.

Periksa: 120° harus tumpul. Bila yang terlukis lancip, kalian membaca skala yang lain dan melukis 60°.

## Arah bebas

Kaki pertama tidak harus mendatar. Garisnya boleh miring ke mana saja; putar busurnya mengikuti garis itu. Besar sudutnya tetap sama.

## Sudut di sekeliling satu titik

Sudut-sudut yang mengelilingi satu titik tanpa celah dan tanpa tumpang tindih berjumlah **360°**.

Tukang keramik memasang satu ubin persegi (sudutnya 90°) dan dua ubin segi lima beraturan (sudutnya 108°) di satu titik. Berapa besar celah yang tersisa?

360° − 90° − 108° − 108° = **54°**. Celah itu dapat diisi dengan potongan ubin yang sudutnya 54°.

## Sudut pada garis lurus

Sudut-sudut yang bersama-sama membentuk garis lurus berjumlah **180°**. Bila satu bagiannya 35°, bagian yang lain 180° − 35° = **145°**.

## Rangkuman Bab 6

- **Sudut** dibentuk oleh dua kaki lurus yang bertemu di titik sudut. Pojok yang membulat bukan sudut.
- Lancip < 90° = siku-siku < tumpul < 180° = lurus < refleks < 360° = satu putaran.
- Mengukur dan melukis: titik pusat busur di titik sudut, baca skala yang 0-nya di kaki pertama, lalu periksa jenisnya.
- Besar sudut ditentukan oleh bukaannya, bukan panjang kakinya.
- Pada jam, satu angka = 30°; jarum pendek ikut bergerak.
- Di sekeliling satu titik 360°; pada garis lurus 180°.

{SUMBER}"""),
]

for _p in PELAJARAN:
    cek(3 <= _p["isi"].count("\n## ") + _p["isi"].startswith("## ") <= 6, f"lesson {_p['no']}: 3-6 pages")
    cek(_p["isi"].rstrip().endswith(SUMBER), f"lesson {_p['no']}: attribution last")
cek(360 // 12 == 30 and sudut_jam(1) == 30 and sudut_jam(1, 30) == 135 and 150 - 15 == 135)

# ── Misconceptions. 01, 02, 04 and 05 are the book's own Miskonsepsi (pp. 255, 260, 264, 266,
# 274-275); the rest come from this chapter's distractors.
MISKONSEPSI = {
    "SD5-M-B6-01": ("Sudut hanya dikenali pada posisi biasa",
                    "Sudut siku-siku (atau sudut lain) dianggap harus mempunyai kaki yang mendatar; sudut yang miring dinilai keliru.",
                    "Tunjukkan sudut yang sama dalam berbagai posisi dan periksa dengan kertas lipat atau busur yang diputar mengikuti kakinya."),
    "SD5-M-B6-02": ("Pojok melengkung dianggap sudut",
                    "Setiap pojok benda dianggap sudut, termasuk pojok yang membulat tanpa dua kaki lurus dan titik sudut.",
                    "Minta murid menunjuk dua kaki lurus dan titik sudutnya; bila tidak ada, itu bukan sudut."),
    "SD5-M-B6-03": ("Jenis sudut keliru",
                    "Lancip, siku-siku, tumpul, lurus, dan refleks tertukar, terutama di sekitar batas 90° dan 180°.",
                    "Pakai sudut siku-siku (90°) dan sudut lurus (180°) sebagai patokan, lalu bandingkan dengan tabel jenis sudut."),
    "SD5-M-B6-04": ("Skala busur terbalik",
                    "Angka dibaca dari skala yang 0-nya tidak berada di kaki pertama, sehingga hasilnya 180° dikurangi besar yang sebenarnya.",
                    "Sebelum membaca, tunjuk angka 0 yang berada di kaki pertama dan ikuti skala itu; periksa hasilnya dengan jenis sudut."),
    "SD5-M-B6-05": ("Panjang kaki dianggap menentukan",
                    "Sudut dengan kaki yang lebih panjang, atau ujung kaki yang lebih berjauhan, dianggap lebih besar.",
                    "Gambar dua sudut sama besar dengan kaki berbeda panjang dan ukur keduanya dengan busur."),
    "SD5-M-B6-06": ("Jarum pendek dianggap diam",
                    "Pada waktu seperti 04.30, jarum pendek dianggap masih tepat di angka jam, padahal ia ikut bergerak.",
                    "Amati jam sungguhan pada pukul 04.00 dan 04.30; tunjukkan bahwa jarum pendek sudah berada di tengah angka 4 dan 5."),
    "SD5-M-B6-07": ("Derajat per angka jam keliru",
                    "Jarak satu angka jam dianggap bukan 30°, misalnya 60° atau 10°.",
                    "Hitung bersama: satu putaran 360° dibagi 12 angka = 30° untuk setiap langkah angka."),
    "SD5-M-B6-08": ("Sudut refleks tertukar",
                    "Sudut terkecil tertukar dengan sudut refleksnya (bagian yang besar di baliknya), atau sudut refleks dihitung tanpa mengurangkan dari 360°.",
                    "Tunjukkan kedua bagian di antara dua kaki yang sama dan jumlahkan: keduanya selalu 360°."),
    "SD5-M-B6-09": ("Sudut istimewa keliru",
                    "Besar sudut istimewa tertukar: satu putaran dianggap 180°, sudut lurus dianggap 360°, atau siku-siku dianggap bagian dari 180° yang lain.",
                    "Peragakan dengan berputar: seperempat putaran 90°, setengah putaran 180°, satu putaran 360°."),
    "SD5-M-B6-10": ("Jawaban bukan yang ditanyakan",
                    "Jumlah sudut yang diketahui atau hasil satu langkah diberikan sebagai jawaban, atau ada bagian soal yang terlewat.",
                    "Minta murid menulis yang ditanyakan dan memeriksa apakah jawabannya bersama sudut-sudut lain memenuhi 180° atau 360°."),
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
    angka = [re.fullmatch(r"(\d+)°", t) for t, *_ in pilihan]
    if all(angka):   # a question that asks for a value: no distractor has the answer's value
        cek(len({int(m[1]) for m in angka}) == 4, f"{ref}: a distractor has the answer's value")
    i = "ABCD".index(jawab)
    S.append(dict(ref=ref, pel=pel, tanya=tanya, pilihan=pilihan[1:i + 1] + [pilihan[0]] + pilihan[i + 1:],
                  guna=guna, sulit=sulit, petunjuk=petunjuk))


# ── Pemetaan awal (pre-test): a right angle around us, the kinds, a clock, comparing.
soal("PA1", 1, "Pojok manakah yang membentuk sudut siku-siku?", "B", [
    ("Pojok halaman buku", True, "Benar. Pojok buku seperti pojok bingkai: siku-siku.", ""),
    ("Ujung gunting yang terbuka sedikit", False, "Gunting yang terbuka sedikit membentuk sudut yang lebih kecil dari siku-siku, yaitu lancip.", "SD5-M-B6-03"),
    ("Kipas yang terbuka lebar", False, "Kipas yang terbuka lebar membentuk sudut yang lebih besar dari siku-siku, yaitu tumpul.", "SD5-M-B6-03"),
    ("Pojok kotak pensil yang membulat", False, "Pojok yang membulat tidak mempunyai dua kaki lurus yang bertemu di satu titik, jadi bukan sudut.", "SD5-M-B6-02"),
], guna="Pemetaan awal")
soal("PA2", 2, "Sudut yang lebih kecil dari sudut siku-siku disebut sudut ...", "D", [
    ("lancip", True, "Benar. Sudut lancip lebih kecil dari sudut siku-siku.", ""),
    ("tumpul", False, "Sudut tumpul justru lebih besar dari sudut siku-siku.", "SD5-M-B6-03"),
    ("lurus", False, "Sudut lurus besarnya 180°, dua kali sudut siku-siku.", "SD5-M-B6-03"),
    ("refleks", False, "Sudut refleks lebih besar dari sudut lurus, jauh lebih besar dari siku-siku.", "SD5-M-B6-03"),
], guna="Pemetaan awal")
cek(jenis(sudut_jam(9)) == "siku-siku")
soal("PA3", 5, "Pada pukul 09.00, jarum pendek dan jarum panjang jam membentuk sudut ...", "A", [
    ("siku-siku", True, "Benar. Dari angka 9 ke angka 12 ada 3 langkah, 3 × 30° = 90°.", ""),
    ("lancip, lebih kecil dari 90°", False, "Sudutnya tepat seperempat putaran (90°), bukan lebih kecil.", "SD5-M-B6-03"),
    ("tumpul", False, "Sudutnya tepat 90°, bukan lebih besar dari siku-siku.", "SD5-M-B6-03"),
    ("lurus", False, "Sudut lurus terbentuk bila kedua jarum berseberangan, misalnya pukul 06.00.", "SD5-M-B6-09"),
], guna="Pemetaan awal")
soal("PA4", 4, "Sudut A mempunyai kaki sepanjang 10 cm dan sudut B kaki sepanjang 3 cm. Keduanya dibuka tepat sebesar sudut siku-siku. Manakah yang lebih besar?", "C", [
    ("Sama besar", True, "Benar. Keduanya dibuka sebesar sudut siku-siku; panjang kaki tidak memengaruhi besar sudut.", ""),
    ("Sudut A, karena kakinya lebih panjang", False, "Kaki yang panjang membuat ujungnya lebih berjauhan, tetapi bukaannya tetap sama.", "SD5-M-B6-05"),
    ("Sudut B, karena kakinya lebih pendek", False, "Kaki yang pendek tidak membuat bukaan lebih kecil atau lebih besar.", "SD5-M-B6-05"),
    ("Tidak dapat dibandingkan", False, "Besar sudut dapat dibandingkan dari bukaannya, walaupun panjang kakinya berbeda.", "SD5-M-B6-05"),
], guna="Pemetaan awal")

# ── Cek penguasaan (post-test): fresh angles and times, every subbab.
cek(jenis(118) == "tumpul")
soal("PB1", 4, "Sudut yang besarnya 118° termasuk sudut ...", "B", [
    ("tumpul", True, "Benar. 118° lebih dari 90° dan kurang dari 180°.", ""),
    ("lancip", False, "Sudut lancip kurang dari 90°. 118° lebih dari 90°.", "SD5-M-B6-03"),
    ("refleks", False, "Sudut refleks lebih dari 180°. 118° masih kurang dari 180°.", "SD5-M-B6-03"),
    ("lurus", False, "Sudut lurus tepat 180°. 118° kurang dari itu.", "SD5-M-B6-03"),
], guna="Cek penguasaan")
cek(bacaan_busur("dalam", 65) == (65, 115) and 360 - 65 == 295 and 90 - 65 == 25)
soal("PB2", 3, "Sebuah sudut diukur dengan busur. Kaki pertama berimpit dengan garis dasar di angka 0 pada skala dalam. Kaki kedua melewati angka 65 pada skala dalam dan 115 pada skala luar. Berapa besar sudut itu?", "D", [
    ("65°", True, "Benar. Angka 0 skala dalam ada di kaki pertama, jadi yang dibaca skala dalam: 65°.", ""),
    ("115°", False, "Ini dibaca pada skala luar, yang 0-nya tidak berada di kaki pertama. 115° = 180° − 65°.", "SD5-M-B6-04"),
    ("295°", False, "Ini sudut refleks di baliknya (360° − 65°). Busur mengukur bagian yang kecil.", "SD5-M-B6-08"),
    ("25°", False, "65° dikurangkan dari 90°. Besar sudut dibaca langsung pada skala yang 0-nya di kaki pertama.", "SD5-M-B6-09"),
], guna="Cek penguasaan", sulit="Sedang")
cek(sudut_jam(2) == 60 and 2 * 60 == 120 and 360 - 60 == 300)
soal("PB3", 5, "Berapa besar sudut terkecil yang dibentuk jarum jam pada pukul 02.00?", "C", [
    ("60°", True, "Benar. Dari angka 12 ke angka 2 ada 2 langkah, 2 × 30° = 60°.", ""),
    ("120°", False, "Setiap langkah angka dihitung 60°. Satu langkah angka jam 30° (360° : 12).", "SD5-M-B6-07"),
    ("30°", False, "Hanya satu langkah yang dihitung. Dari angka 12 ke angka 2 ada 2 langkah.", "SD5-M-B6-07"),
    ("300°", False, "Ini sudut refleks, lewat arah yang panjang. Yang ditanyakan sudut terkecil.", "SD5-M-B6-08"),
], guna="Cek penguasaan", sulit="Sedang")
cek(sudut_jam(3, 30) == 75 and jarum_pendek_diam(3, 30) == 90 and 360 - 75 == 285 and 30 * 3 + 15 == 105)
soal("PB4", 5, "Berapa besar sudut terkecil yang dibentuk jarum jam pada pukul 03.30?", "A", [
    ("75°", True, "Benar. Dari angka 3 ke angka 6 ada 90°, tetapi jarum pendek sudah maju 15° ke arah angka 4, jadi 90° − 15° = 75°.", ""),
    ("90°", False, "Jarum pendek dianggap tetap di angka 3. Setengah jam kemudian ia sudah di tengah angka 3 dan 4.", "SD5-M-B6-06"),
    ("285°", False, "Ini sudut refleksnya. Yang ditanyakan sudut terkecil.", "SD5-M-B6-08"),
    ("105°", False, "Ini sudut jarum pendek dari angka 12, bukan sudut di antara kedua jarum.", "SD5-M-B6-10"),
], guna="Cek penguasaan", sulit="Sulit", petunjuk="Ingat bahwa jarum pendek ikut bergerak selama setengah jam itu.")
cek(360 - 70 == 290 and 180 - 70 == 110 and 180 + 70 == 250 and 90 - 70 == 20)
soal("PB5", 4, "Dua kaki sudut membentuk sudut lancip 70°. Berapa besar sudut refleks di baliknya?", "B", [
    ("290°", True, "Benar. Keduanya bersama membentuk satu putaran: 360° − 70° = 290°.", ""),
    ("110°", False, "70° dikurangkan dari 180°. Sudut dan refleksnya bersama membentuk satu putaran, 360°.", "SD5-M-B6-09"),
    ("250°", False, "70° ditambahkan ke 180°. Sudut refleks didapat dari 360° − 70°.", "SD5-M-B6-08"),
    ("20°", False, "70° dikurangkan dari 90°. Sudut refleks lebih dari 180°.", "SD5-M-B6-09"),
], guna="Cek penguasaan", sulit="Sedang")
cek(180 - 128 == 52 and 360 - 128 == 232 and 128 - 90 == 38 and 180 + 128 == 308)
soal("PB6", 6, "Dua sudut bersama-sama membentuk sudut lurus. Salah satunya 128°. Berapa besar sudut yang lain?", "D", [
    ("52°", True, "Benar. Sudut lurus 180°, jadi 180° − 128° = 52°.", ""),
    ("232°", False, "128° dikurangkan dari 360°. Sudut lurus besarnya 180°, bukan satu putaran.", "SD5-M-B6-09"),
    ("38°", False, "128° dikurangi 90°. Keduanya membentuk sudut lurus (180°), bukan siku-siku.", "SD5-M-B6-09"),
    ("308°", False, "128° ditambahkan ke 180°. Kedua sudut bersama berjumlah 180°, jadi dikurangkan.", "SD5-M-B6-10"),
], guna="Cek penguasaan", sulit="Sedang")
cek(70 > 65 and 70 - 65 == 5)
soal("PB7", 4, "Sudut P besarnya 70° dengan kaki sepanjang 2 cm. Sudut Q besarnya 65° dengan kaki sepanjang 8 cm. Pernyataan manakah yang tepat?", "A", [
    ("P lebih besar 5° daripada Q", True, "Benar. 70° − 65° = 5°. Panjang kaki tidak memengaruhi besar sudut.", ""),
    ("Q lebih besar karena kakinya lebih panjang", False, "Kaki yang panjang tidak membuat sudut lebih besar. Yang dibandingkan besar bukaannya: 70° dan 65°.", "SD5-M-B6-05"),
    ("Sama besar karena keduanya lancip", False, "Keduanya memang lancip, tetapi besarnya berbeda: 70° dan 65°.", "SD5-M-B6-03"),
    ("Tidak dapat dibandingkan karena kakinya berbeda", False, "Sudut dapat dibandingkan dari besarnya walaupun panjang kakinya berbeda.", "SD5-M-B6-05"),
], guna="Cek penguasaan", sulit="Sedang")
cek(360 - 2 * 90 - 120 == 60 and 2 * 90 + 120 == 300 and 360 - 90 - 120 == 150 and 360 - 120 == 240)
soal("PB8", 6, "Di satu titik lantai bertemu dua ubin persegi (sudut 90°) dan satu ubin segi enam beraturan (sudut 120°). Berapa besar sudut potongan ubin yang dapat mengisi celah di titik itu?", "C", [
    ("60°", True, "Benar. Di sekeliling satu titik 360°, jadi 360° − 90° − 90° − 120° = 60°.", ""),
    ("300°", False, "Ini jumlah sudut ketiga ubin. Yang ditanyakan sisa celahnya.", "SD5-M-B6-10"),
    ("150°", False, "Hanya satu ubin persegi yang dikurangkan. Ada dua ubin persegi.", "SD5-M-B6-10"),
    ("240°", False, "Hanya ubin segi enam yang dikurangkan; kedua ubin persegi terlewat.", "SD5-M-B6-10"),
], guna="Cek penguasaan", sulit="Sulit")

# ── Latihan (practice), by lesson, from direct use toward a little more reasoning.
soal("LT1", 1, "Sebuah buku diletakkan miring di atas meja. Pojok buku itu membentuk sudut ...", "C", [
    ("siku-siku", True, "Benar. Pojok buku tetap siku-siku walaupun bukunya miring.", ""),
    ("lancip, karena bukunya miring", False, "Memiringkan buku tidak mengubah besar pojoknya. Arah tidak menentukan jenis sudut.", "SD5-M-B6-01"),
    ("tumpul, karena bukunya miring", False, "Memiringkan buku tidak mengubah besar pojoknya.", "SD5-M-B6-01"),
    ("bukan sudut, karena tidak ada sisi yang mendatar", False, "Sudut tidak harus mempunyai kaki yang mendatar. Pojok buku tetap mempunyai dua kaki lurus dan titik sudut.", "SD5-M-B6-01"),
])
soal("LT2", 1, "Bangun manakah yang dapat mempunyai tepat 2 sudut yang besarnya 90°?", "A", [
    ("Trapesium siku-siku", True, "Benar. Trapesium siku-siku yang sisi sejajarnya hanya sepasang mempunyai tepat 2 sudut 90°, di kedua ujung sisi tegaknya.", ""),
    ("Persegi panjang", False, "Persegi panjang mempunyai 4 sudut siku-siku, satu di setiap pojok.", "SD5-M-B6-03"),
    ("Segitiga sama sisi", False, "Semua sudut segitiga sama sisi lancip; tidak ada yang siku-siku.", "SD5-M-B6-03"),
    ("Jajargenjang yang miring", False, "Sisi jajargenjang yang miring membentuk dua sudut lancip dan dua sudut tumpul, tidak ada yang siku-siku.", "SD5-M-B6-03"),
], sulit="Sedang")
soal("LT3", 2, "Pojok manakah yang merupakan sudut?", "D", [
    ("Pojok meja persegi yang tajam", True, "Benar. Dua tepi lurus meja bertemu di satu titik.", ""),
    ("Pojok kotak pensil yang membulat", False, "Tepinya melengkung; tidak ada dua kaki lurus yang bertemu di satu titik.", "SD5-M-B6-02"),
    ("Tepi piring yang melengkung", False, "Tepi piring melengkung, tidak ada kaki lurus maupun titik sudut.", "SD5-M-B6-02"),
    ("Ujung penghapus yang membulat", False, "Ujung yang membulat tidak mempunyai titik sudut.", "SD5-M-B6-02"),
])
cek(jenis(sudut_jam(5)) == "tumpul" and sudut_jam(5) == 150)
soal("LT4", 2, "Pada pukul 05.00, jarum jam membentuk sudut ...", "B", [
    ("tumpul", True, "Benar. Sudutnya lebih besar dari pukul 03.00 (siku-siku), yaitu 150°.", ""),
    ("lancip", False, "Dari angka 12 ke angka 5 lebih jauh daripada ke angka 3, jadi sudutnya lebih besar dari siku-siku.", "SD5-M-B6-03"),
    ("siku-siku", False, "Siku-siku terbentuk pukul 03.00 atau 09.00. Pukul 05.00 lebih lebar.", "SD5-M-B6-03"),
    ("lurus", False, "Sudut lurus terbentuk pukul 06.00, saat kedua jarum berseberangan.", "SD5-M-B6-09"),
])
cek(bacaan_busur("luar", 40) == (140, 140) and 360 - 140 == 220 and 360 - 40 == 320)
soal("LT5", 3, "Kaki pertama sebuah sudut berimpit dengan garis dasar busur di angka 0 pada skala luar. Kaki kedua melewati angka 40 pada skala dalam dan 140 pada skala luar. Berapa besar sudutnya?", "A", [
    ("140°", True, "Benar. Angka 0 skala luar ada di kaki pertama, jadi dibaca pada skala luar: 140°.", ""),
    ("40°", False, "Ini dibaca pada skala dalam, yang 0-nya tidak di kaki pertama.", "SD5-M-B6-04"),
    ("220°", False, "Ini refleks dari 140°. Busur mengukur sudut hingga 180°.", "SD5-M-B6-08"),
    ("320°", False, "Ini refleks dari 40°, dan 40° pun dibaca pada skala yang lain.", "SD5-M-B6-08"),
], sulit="Sedang")
soal("LT6", 3, "Langkah pertama mengukur sudut dengan busur derajat adalah ...", "C", [
    ("meletakkan titik pusat busur tepat di titik sudut", True, "Benar. Titik pusat busur harus berada di titik sudut, baru garis dasarnya diimpitkan dengan satu kaki.", ""),
    ("meletakkan angka 90 busur di salah satu kaki", False, "Yang diimpitkan dengan kaki adalah garis dasar (angka 0), bukan angka 90.", "SD5-M-B6-04"),
    ("mengukur panjang kedua kaki sudut dengan penggaris", False, "Panjang kaki tidak diperlukan; besar sudut tidak bergantung padanya.", "SD5-M-B6-05"),
    ("memutar gambar sampai satu kaki mendatar", False, "Busurnya yang diputar mengikuti kaki sudut; gambarnya tidak perlu diputar.", "SD5-M-B6-01"),
])
soal("LT7", 3, "Satu putaran penuh besarnya ...", "D", [
    ("360°", True, "Benar. Satu putaran penuh 360°.", ""),
    ("180°", False, "180° adalah setengah putaran (sudut lurus).", "SD5-M-B6-09"),
    ("90°", False, "90° adalah seperempat putaran (sudut siku-siku).", "SD5-M-B6-09"),
    ("100°", False, "Derajat bukan persen; satu putaran penuh dibagi menjadi 360 derajat.", "SD5-M-B6-09"),
])
cek(360 - 135 == 225 and 180 - 135 == 45 and 360 + 135 == 495)
soal("LT8", 4, "Sebuah sudut besarnya 135°. Berapa besar sudut refleks di baliknya?", "B", [
    ("225°", True, "Benar. 360° − 135° = 225°.", ""),
    ("45°", False, "135° dikurangkan dari 180°. Sudut dan refleksnya bersama 360°.", "SD5-M-B6-09"),
    ("135°", False, "Ini sudut yang diketahui, bukan refleksnya.", "SD5-M-B6-08"),
    ("495°", False, "135° ditambahkan ke 360°. Refleks didapat dengan mengurangkan dari 360°.", "SD5-M-B6-08"),
])
cek(jenis(180) == "lurus")
soal("LT9", 4, "Sudut yang besarnya tepat 180° disebut sudut ...", "C", [
    ("lurus", True, "Benar. Kedua kakinya membentuk satu garis lurus.", ""),
    ("tumpul", False, "Sudut tumpul kurang dari 180°. Tepat 180° adalah sudut lurus.", "SD5-M-B6-03"),
    ("refleks", False, "Sudut refleks lebih dari 180°. Tepat 180° adalah sudut lurus.", "SD5-M-B6-03"),
    ("satu putaran", False, "Satu putaran 360°. 180° baru setengah putaran.", "SD5-M-B6-09"),
])
cek(sorted([95, 180, 45, 270]) == [45, 95, 180, 270])
soal("LT10", 4, "Urutan sudut 95°, 180°, 45°, dan 270° dari yang terkecil adalah ...", "A", [
    ("45°; 95°; 180°; 270°", True, "Benar. Lancip, tumpul, lurus, lalu refleks.", ""),
    ("270°; 180°; 95°; 45°", False, "Ini urutan dari yang terbesar.", "SD5-M-B6-10"),
    ("45°; 95°; 270°; 180°", False, "Sudut refleks 270° dianggap lebih kecil dari sudut lurus. Refleks selalu lebih dari 180°.", "SD5-M-B6-08"),
    ("45°; 180°; 95°; 270°", False, "Sudut lurus dianggap lebih kecil dari sudut tumpul. Tumpul selalu kurang dari 180°.", "SD5-M-B6-03"),
], sulit="Sedang")
cek(sudut_jam(5) == 150 and 5 * 60 == 300 and 360 - 150 == 210 and 5 * 10 == 50)
soal("LT11", 5, "Berapa besar sudut terkecil yang dibentuk jarum jam pada pukul 05.00?", "D", [
    ("150°", True, "Benar. Dari angka 12 ke angka 5 ada 5 langkah, 5 × 30° = 150°.", ""),
    ("300°", False, "Setiap langkah dihitung 60°. Satu langkah angka jam 30°.", "SD5-M-B6-07"),
    ("210°", False, "Ini sudut refleksnya (7 langkah ke arah lain). Yang ditanyakan sudut terkecil.", "SD5-M-B6-08"),
    ("50°", False, "Setiap langkah dihitung 10°. Satu langkah angka jam 30°.", "SD5-M-B6-07"),
])
cek(sudut_jam(6, 30) == 15 and jarum_pendek_diam(6, 30) == 0 and 360 - 15 == 345 and abs(30 * 7 - 6 * 30) == 30)
soal("LT12", 5, "Berapa besar sudut terkecil yang dibentuk jarum jam pada pukul 06.30?", "B", [
    ("15°", True, "Benar. Jarum panjang di angka 6, jarum pendek sudah setengah jalan ke angka 7: 30° : 2 = 15°.", ""),
    ("0°", False, "Jarum pendek dianggap tetap di angka 6, sehingga kedua jarum berimpit. Setengah jam kemudian ia sudah maju 15°.", "SD5-M-B6-06"),
    ("345°", False, "Ini sudut refleksnya. Yang ditanyakan sudut terkecil.", "SD5-M-B6-08"),
    ("30°", False, "Jarum pendek dianggap sudah sampai di angka 7. Pada pukul 06.30 ia baru di tengah angka 6 dan 7.", "SD5-M-B6-06"),
], sulit="Sulit")
cek(sudut_jam(6) == 180 and sudut_jam(3) == 90 and sudut_jam(12) == 0 and sudut_jam(9) == 90)
soal("LT13", 5, "Pada pukul berapa jarum jam membentuk sudut lurus?", "A", [
    ("06.00", True, "Benar. Jarum panjang di angka 12 dan jarum pendek di angka 6, berseberangan: 180°.", ""),
    ("03.00", False, "Pukul 03.00 membentuk sudut siku-siku (90°), bukan sudut lurus.", "SD5-M-B6-09"),
    ("12.00", False, "Pukul 12.00 kedua jarum berimpit: sudut nol.", "SD5-M-B6-09"),
    ("09.00", False, "Pukul 09.00 membentuk sudut siku-siku (90°).", "SD5-M-B6-09"),
])
soal("LT14", 6, "Rani akan melukis sudut 120°. Titik pusat busur sudah di ujung garis dan garis dasarnya sudah berimpit dengan garis itu. Apa langkah berikutnya?", "D", [
    ("Memberi titik di angka 120 pada skala yang 0-nya di garis itu", True, "Benar. Skala yang dimulai dari 0 pada garis itulah yang menunjukkan 120° yang benar.", ""),
    ("Memberi titik di angka 120 pada skala mana saja, dalam atau luar", False, "Bila skala yang lain dipakai, yang terlukis 60° (180° − 120°), sudut lancip.", "SD5-M-B6-04"),
    ("Memberi titik di angka 60 karena 60 + 120 = 180", False, "Angka 60 pada skala yang benar menghasilkan sudut 60°, bukan 120°.", "SD5-M-B6-04"),
    ("Memutar kertas sampai garisnya mendatar", False, "Garis tidak harus mendatar; busurnya sudah mengikuti arah garis.", "SD5-M-B6-01"),
], sulit="Sedang")
cek(180 - 120 == 60 and jenis(60) == "lancip" and jenis(120) == "tumpul")
soal("LT15", 6, "Dodi ingin melukis sudut 120°, tetapi sudut yang terlukis ternyata lancip. Apa yang kemungkinan terjadi?", "C", [
    ("Ia membaca skala yang 0-nya tidak di garis pertama", True, "Benar. Pada skala yang lain, angka 120 berada di tempat 60° yang sebenarnya, jadi yang dilukis 60°.", ""),
    ("Kaki sudut yang ia gambar terlalu pendek", False, "Panjang kaki tidak memengaruhi besar sudut.", "SD5-M-B6-05"),
    ("Garis pertamanya tidak mendatar", False, "Garis pertama boleh miring; besar sudut tidak berubah karena arahnya.", "SD5-M-B6-01"),
    ("Busur yang ia pakai lebih kecil dari busur temannya", False, "Busur kecil dan besar menunjukkan derajat yang sama.", "SD5-M-B6-05"),
], sulit="Sedang")
cek(180 - 40 - 75 == 65 and 360 - 115 == 245 and 40 + 75 == 115 and 180 - 75 == 105)
soal("LT16", 6, "Tiga sudut bersama-sama membentuk sudut lurus. Dua di antaranya 40° dan 75°. Berapa besar sudut ketiga?", "B", [
    ("65°", True, "Benar. 180° − 40° − 75° = 65°.", ""),
    ("245°", False, "Dikurangkan dari 360°. Ketiga sudut membentuk sudut lurus, 180°.", "SD5-M-B6-09"),
    ("115°", False, "Ini jumlah dua sudut yang diketahui. Yang ditanyakan sudut ketiga.", "SD5-M-B6-10"),
    ("105°", False, "Hanya 75° yang dikurangkan dari 180°; sudut 40° terlewat.", "SD5-M-B6-10"),
], sulit="Sedang")
cek(360 // 120 == 3 and 360 % 120 == 0 and 180 // 120 == 1 and 4 * 90 == 360)
soal("LT17", 6, "Ubin segi enam beraturan mempunyai sudut 120° di setiap pojok. Berapa ubin segi enam yang dapat bertemu di satu titik tanpa celah?", "A", [
    ("3 ubin", True, "Benar. 3 × 120° = 360°, satu putaran penuh.", ""),
    ("2 ubin", False, "Di sekeliling satu titik dianggap 180°. Satu putaran penuh 360°, jadi 360° : 120° = 3.", "SD5-M-B6-09"),
    ("4 ubin", False, "4 ubin memerlukan 480°, lebih dari satu putaran; ubinnya akan bertumpuk.", "SD5-M-B6-10"),
    ("6 ubin", False, "Angka 6 diambil dari nama segi enam. Banyak ubin dihitung dari 360° : 120°.", "SD5-M-B6-10"),
], sulit="Sedang")
cek(sudut_jam(2, 30) == 105 and jarum_pendek_diam(2, 30) == 120 and 120 - 15 == 105 and 360 - 105 == 255)
soal("LT18", 5, "Nina menghitung sudut jarum jam pada pukul 02.30 sebagai berikut: dari angka 2 ke angka 6 ada 4 langkah, jadi 4 × 30° = 120°. Mengapa jawabannya belum tepat?", "C", [
    ("Jarum pendek sudah maju 15°, jadi 105°", True, "Benar. Setengah jam kemudian jarum pendek berada di tengah angka 2 dan 3, sehingga sudutnya 120° − 15° = 105°.", ""),
    ("Satu langkah angka jam seharusnya 60°", False, "Satu langkah angka jam memang 30° (360° : 12). Langkah Nina sudah tepat di bagian ini.", "SD5-M-B6-07"),
    ("Yang ditanyakan sudut refleksnya, 255°", False, "Yang biasa ditanyakan sudut terkecil. Kekurangan Nina ada pada posisi jarum pendek.", "SD5-M-B6-08"),
    ("Jarum panjang pada pukul 02.30 berada di angka 3", False, "Pada menit ke-30 jarum panjang berada di angka 6, sudah tepat.", "SD5-M-B6-06"),
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
HURUF = {}
for s in S:
    h = "ABCD"[[b for _, b, _, _ in s["pilihan"]].index(True)]
    HURUF[h] = HURUF.get(h, 0) + 1
cek(set(HURUF) == set("ABCD") and max(HURUF.values()) * 2 <= len(S) and max(HURUF.values()) - min(HURUF.values()) <= 3, HURUF)

# The post-test uses fresh numbers. A clock question is fresh when its time is not one the book or
# a lesson works through (every whole-hour angle is some book key, so the answer cannot be the test
# there). Every other post-test answer is checked against the book's keys for the same kind of
# problem, and its angles against the lesson examples.
WAKTU_BUKU = {"01.00", "09.00", "04.00", "01.30", "10.00", "15.00", "07.00", "04.30", "11.00", "08.00", "06.00", "10.30"}
WAKTU_PELAJARAN = {"03.00", "11.00", "08.00", "01.00", "04.00", "10.00", "04.30", "01.30"}
KUNCI_BUKU = {"jenis": set(), "busur": {105, 130, 135, 85, 90, 60, 240}, "refleks": {240}, "lurus": {180},
              "banding": {105, 130, 135, 85}, "ubin": {54, 36, 72, 108}}
JENIS_POST = {"PB1": "jenis", "PB2": "busur", "PB5": "refleks", "PB6": "lurus", "PB7": "banding", "PB8": "ubin"}
SUDUT_PELAJARAN = {50, 130, 240, 35, 145}
UBIN_PELAJARAN = [sorted([90, 108, 108])]
for s_ in POST:
    waktu = set(re.findall(r"\d\d\.\d\d", s_["tanya"]))
    if waktu:
        cek(not waktu & (WAKTU_BUKU | WAKTU_PELAJARAN), f"{s_['ref']}: {waktu} is worked in the book or a lesson")
        continue
    benar = next(t for t, b, _, _ in s_["pilihan"] if b)
    m = re.match(r"(\d+)°", benar)
    if m:
        cek(int(m[1]) not in KUNCI_BUKU[JENIS_POST[s_["ref"]]], f"{s_['ref']}: the answer {benar} is a book key")
    sudut = [int(n) for n in re.findall(r"(\d+)°", s_["tanya"])]
    if JENIS_POST[s_["ref"]] == "ubin":   # tiles: the whole set of tiles must be new
        cek(sorted([90, 90, 120]) not in UBIN_PELAJARAN and "dua ubin persegi" in s_["tanya"], s_["ref"])
    else:
        cek(not set(sudut) & SUDUT_PELAJARAN, f"{s_['ref']}: an angle in it is a lesson example")
cek({s_["ref"] for s_ in POST} == set(JENIS_POST) | {"PB3", "PB4"})


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
                c.number_format = "@"   # times such as 06.00 stay text

    lembar("Kursus", list(KURSUS), [list(KURSUS.values())])
    lembar("Bab", ["No bab*", "Judul bab*"], [list(b) for b in BAB])
    lembar("Pelajaran", ["No bab", "No pelajaran", "Judul pelajaran", "Ringkasan", "Isi pelajaran", "Tujuan pembelajaran", "Tingkat berpikir", "Media", "Transkrip"],
           [[1, p["no"], p["judul"], p["ringkasan"], p["isi"], p["tujuan"], p["bloom"], "", ""] for p in PELAJARAN])
    lembar("Soal", ["Kode soal", "No bab", "No pelajaran", "Jenis soal", "Pertanyaan", "Bacaan", "Petunjuk", "Kegunaan", "Tingkat kesulitan", "Kelompok paralel"],
           [[s["ref"], 1, s["pel"], "Pilihan ganda", s["tanya"], "", s["petunjuk"], s["guna"], s["sulit"], ""] for s in S])
    # every distractor names its misconception's code, defined on the «Miskonsepsi» sheet (CR-50, D-063 M5, D-120 Q9)
    lembar("Pilihan", ["Kode soal", "Pilihan", "Teks pilihan", "Benar", "Alasan", "Kode miskonsepsi"],
           [[s["ref"], "ABCD"[i], t, "Ya" if b else "Tidak", alasan, kode] for s in S for i, (t, b, alasan, kode) in enumerate(s["pilihan"])])
    lembar("Miskonsepsi", ["Kode", "Nama", "Penjelasan", "Cara membantu"],
           [[k, label, desk, rem] for k, (label, desk, rem) in MISKONSEPSI.items()])
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
    tulis(os.path.join(here, "SD5-Matematika-Bab6.xlsx"))
    tulis_miskonsepsi(os.path.join(here, "SD5-Matematika-Bab6-miskonsepsi.csv"))
    halaman = sum(p["isi"].count("## ") for p in PELAJARAN)
    print(f"SD5-Matematika-Bab6.xlsx: lessons {len(PELAJARAN)} ({halaman} pages), questions {len(S)} "
          f"(pre {len(PRE)}, post {len(POST)}, practice {len(LAT)}), answers "
          + " ".join(f"{h}={HURUF[h]}" for h in "ABCD"))
    print(f"SD5-Matematika-Bab6-miskonsepsi.csv: {len(MISKONSEPSI)} codes")
    print(f"assertions passed: {CEK[0]}")
