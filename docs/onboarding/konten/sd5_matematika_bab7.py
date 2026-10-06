# SD Kelas 5, Matematika, Bab 7 "Membandingkan Ciri-Ciri Bangun Datar", as a PINTAR lesson
# workbook in the D-007 template (sheets Kursus, Bab, Pelajaran, Soal, Pilihan; the column
# contract is KOLOM in src/lib/unggah-kontrak.ts). Built the way Bab 1-6 were (all passed).
#
# Source: Buku Panduan Guru Matematika untuk SD/MI Kelas V (Meita Fitrianawati, Ika Surtiani,
# Ait Istiandaru; Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi, 2022), Bab 7,
# pp. 285-344. Lessons follow the book's eleven explorations: subbab A (segitiga) in four lessons,
# subbab B (segi empat) in three.
#
# The player draws no shapes, so every shape is given by its sides, its angles or its list of
# ciri. The generator checks the answers instead of typing them:
#   - `bisa_segitiga()` applies the book's rule (two sides together longer than the third);
#   - `sudut_ketiga()` and `jenis_sudut()` give a triangle's missing angle and its kind;
#   - `CIRI` lists each quadrilateral's ciri as the book does, `tutup()` adds what the ciri force
#     (a jajargenjang with one right angle has four), and `termasuk(x, y)` says whether x can be
#     called y: every ciri of y is a ciri of x (the book's rule, pp. 312 and 338).
#
# The book uses the inclusive trapesium ("setidaknya sepasang sisi sejajar", p. 318), and so do
# the lessons.
#
# Text lessons only (D-050). The workbook's "Kode miskonsepsi" column stays empty; the proposed
# codes go to SD5-Matematika-Bab7-miskonsepsi.csv.
#
# Run: python3 docs/onboarding/konten/sd5_matematika_bab7.py
import csv
import os
import re

from openpyxl import Workbook
from openpyxl.styles import Alignment, Font

CEK = [0]


def cek(syarat, pesan=""):
    """An assertion that is counted, so the hand-off can say how many passed."""
    assert syarat, pesan
    CEK[0] += 1


def bisa_segitiga(a, b, c):
    """The book's rule (p. 297): every two sides together are longer than the third."""
    return a + b > c and a + c > b and b + c > a


def sudut_ketiga(x, y):
    return 180 - x - y


def jenis_sudut(sudut):
    """A triangle by its angles: one right angle makes it siku-siku, one obtuse angle tumpul."""
    cek(sum(sudut) == 180, sudut)
    if any(s == 90 for s in sudut):
        return "siku-siku"
    if any(s > 90 for s in sudut):
        return "tumpul"
    return "lancip"


def jenis_sisi(a, b, c):
    if a == b == c:
        return "sama sisi"
    if a == b or b == c or a == c:
        return "sama kaki"
    return "sembarang"


# ── Quadrilaterals by their ciri (pp. 316-338). Names of ciri:
#   4sisi               dibatasi empat sisi
#   sejajar1 / sejajar2 setidaknya sepasang / dua pasang sisi berhadapan sejajar
#   sisi_hadap_sama     sisi-sisi berhadapan sama panjang
#   sudut_hadap_sama    sudut-sudut berhadapan sama besar (both pairs)
#   sudut_hadap1        setidaknya sepasang sudut berhadapan sama besar
#   diag_bagi_dua       diagonal saling membagi dua sama panjang
#   siku1 / siku_semua  setidaknya satu / semua sudut siku-siku
#   simetri_tengah      sumbu simetri yang membagi dua sisi-sisi sejajar (trapesium sama kaki)
#   sisi_semua_sama     keempat sisi sama panjang
#   sisi_urut_sama      sepasang sisi berurutan sama panjang
#   sisi_urut_2pasang   dua pasang sisi berurutan sama panjang (layang-layang)
#   diag_tegak          diagonal berpotongan tegak lurus
#   diag_simetri1 / 2   satu / kedua diagonal merupakan sumbu simetri
JAJARGENJANG = {"4sisi", "sejajar1", "sejajar2", "sisi_hadap_sama", "sudut_hadap_sama", "sudut_hadap1", "diag_bagi_dua"}
BELAH_KETUPAT_TAMBAH = {"sisi_semua_sama", "sisi_urut_sama", "sisi_urut_2pasang", "diag_tegak", "diag_simetri1", "diag_simetri2"}
PERSEGI_PANJANG_TAMBAH = {"siku1", "siku_semua", "simetri_tengah"}
CIRI = {
    "segi empat": {"4sisi"},
    "trapesium": {"4sisi", "sejajar1"},
    "trapesium siku-siku": {"4sisi", "sejajar1", "siku1"},
    "trapesium sama kaki": {"4sisi", "sejajar1", "simetri_tengah"},
    "jajargenjang": JAJARGENJANG,
    "persegi panjang": JAJARGENJANG | PERSEGI_PANJANG_TAMBAH,
    "belah ketupat": JAJARGENJANG | BELAH_KETUPAT_TAMBAH,
    "persegi": JAJARGENJANG | PERSEGI_PANJANG_TAMBAH | BELAH_KETUPAT_TAMBAH,
    "layang-layang": {"4sisi", "sisi_urut_2pasang", "sudut_hadap1", "diag_tegak", "diag_simetri1"},
}


def tutup(ciri):
    """What the ciri force (the book's own steps): a jajargenjang with one right angle has four
    (p. 325, the straws); a jajargenjang with two adjacent sides equal has all four equal; a
    quadrilateral whose two diagonals are both sumbu simetri, or whose four sides are equal, is a
    belah ketupat (pp. 327, 338)."""
    ciri = set(ciri)
    while True:
        lama = set(ciri)
        if {"siku1", "sejajar2"} <= ciri:
            ciri |= PERSEGI_PANJANG_TAMBAH
        if {"sisi_urut_sama", "sisi_hadap_sama"} <= ciri:
            ciri.add("sisi_semua_sama")
        if "4sisi" in ciri and ({"sisi_semua_sama"} <= ciri or {"diag_simetri2"} <= ciri):
            ciri |= JAJARGENJANG | BELAH_KETUPAT_TAMBAH
        if ciri == lama:
            return ciri


def termasuk(x, y):
    """x can be called y when every ciri of y is a ciri of x."""
    return CIRI[y] <= tutup(CIRI[x])


def menjadi(x, tambah):
    """The most particular shape that x becomes once the ciri `tambah` is added."""
    ciri = tutup(CIRI[x] | set(tambah))
    cocok = [n for n in CIRI if CIRI[n] <= ciri]
    return max(cocok, key=lambda n: len(CIRI[n]))


SIMETRI_LIPAT = {"segitiga sama kaki": 1, "segitiga sama sisi": 3, "segitiga sembarang": 0,
                 "trapesium sama kaki": 1, "jajargenjang": 0, "persegi panjang": 2, "belah ketupat": 2,
                 "persegi": 4, "layang-layang": 1}
SIMETRI_PUTAR = {"segitiga sama kaki": 1, "segitiga sama sisi": 3, "segitiga sembarang": 1}

# ── The model reproduces the book's conclusions ────────────────────────────────
for x, y in [("jajargenjang", "trapesium"), ("persegi panjang", "jajargenjang"), ("belah ketupat", "jajargenjang"),
             ("persegi", "belah ketupat"), ("persegi", "persegi panjang"), ("belah ketupat", "layang-layang"),
             ("jajargenjang", "segi empat")]:
    cek(termasuk(x, y) and not termasuk(y, x), f"{x} is a {y}, not the other way (pp. 321-338)")
cek(not termasuk("jajargenjang", "trapesium sama kaki"))                       # p. 322, Uji Kompetensi 5
cek(menjadi("jajargenjang", {"siku1"}) == "persegi panjang")                   # p. 326
cek(menjadi("belah ketupat", {"siku1"}) == "persegi")                          # p. 332
cek(menjadi("persegi panjang", {"sisi_urut_sama"}) == "persegi")               # p. 334
cek(menjadi("layang-layang", {"diag_simetri2"}) == "belah ketupat")            # p. 338
cek(not termasuk("layang-layang", "jajargenjang") and not termasuk("layang-layang", "trapesium"))
# Pengayaan 2 (p. 343): 4 sisi, sepasang sisi sejajar, sepasang sisi sama panjang: jajargenjang and
# trapesium sama kaki have all three, a layang-layang need not have a parallel pair.
cek("sejajar1" in CIRI["jajargenjang"] and "sejajar1" in CIRI["trapesium sama kaki"] and "sejajar1" not in CIRI["layang-layang"])

# ── Book keys (checked; see handoff/LANA-07.md for the ones that are not right) ──
SEDOTAN_BUKU = [(5, 6, 7), (4, 6, 6), (5, 4, 12), (10, 5, 15), (5, 12, 13)]                   # p. 295
cek([bisa_segitiga(*t) for t in SEDOTAN_BUKU] == [True, True, False, False, True])
cek([(b + c, a + c, a + b) for a, b, c in SEDOTAN_BUKU] == [(13, 12, 11), (12, 10, 10), (16, 17, 9), (20, 25, 15), (25, 18, 17)])
cek(90 + 90 == 180 and sudut_ketiga(90, 90) == 0)                                              # p. 303
cek((180 - 90) // 2 == 45 and 180 // 3 == 60)                                                   # pp. 307-308
# Uji Kompetensi (p. 339): 1 S, 2 S, 3 B, 4 B, 5 S, 6 B, 7 B, 8 S, 9 S, 10 B.
cek(not bisa_segitiga(5, 7, 1) and jenis_sudut([90, 45, 45]) == "siku-siku" and 45 != 90)
cek(termasuk("persegi panjang", "jajargenjang") and termasuk("belah ketupat", "layang-layang") and termasuk("persegi", "persegi panjang")
    and termasuk("persegi", "belah ketupat") and SIMETRI_LIPAT["layang-layang"] == 1)
# Pengayaan 1 (p. 343): 3 sisi, two angles of 45: the third is 90, so not lancip; sama kaki and
# siku-siku sama kaki.
cek(sudut_ketiga(45, 45) == 90 and jenis_sudut([45, 45, 90]) != "lancip")

# ── Lesson examples ─────────────────────────────────────────────────────────────
SEDOTAN_PELAJARAN = SEDOTAN_BUKU + [(4, 5, 10), (5, 5, 3)]
cek(not bisa_segitiga(4, 5, 10) and 4 + 5 == 9 and bisa_segitiga(5, 5, 3) and jenis_sisi(5, 5, 3) == "sama kaki")
cek(jenis_sudut([35, 40, 105]) == "tumpul" and jenis_sudut([90, 60, 30]) == "siku-siku")
cek(sudut_ketiga(30, 80) == 70 and sudut_ketiga(60, 60) == 60)
cek((180 - 100) // 2 == 40 and 100 + 40 + 40 == 180 and jenis_sudut([100, 40, 40]) == "tumpul")
SUDUT_PELAJARAN = {35, 40, 105, 90, 60, 30, 80, 70, 100, 45}

SUMBER = ("_Diadaptasi dari Buku Panduan Guru Matematika untuk SD/MI Kelas V, Kementerian Pendidikan, "
          "Kebudayaan, Riset, dan Teknologi, 2022, Bab 7._")

KURSUS = {
    "Judul kursus*": "Matematika Kelas 5 · Bab 7: Membandingkan Ciri-Ciri Bangun Datar",
    "Mata pelajaran*": "Matematika",
    "Jenjang*": "SD",
    "Kelas*": "Kelas 5",
    "Konteks": "Akademik",
}

BAB = [(1, "Membandingkan Ciri-Ciri Bangun Datar")]

PELAJARAN = [
    dict(no=1, judul="Syarat Tiga Ruas Garis Membentuk Segitiga",
         ringkasan="Tiga ruas garis dapat membentuk segitiga bila jumlah panjang dua sisi mana pun lebih dari panjang sisi ketiga.",
         tujuan="Kalian dapat memeriksa apakah tiga ruas garis dengan panjang tertentu dapat membentuk segitiga.",
         bloom="Menganalisis",
         isi=f"""## Tiga sedotan dan seutas tali

Segitiga adalah bangun datar yang dibatasi tiga sisi. Apakah sembarang tiga ruas garis pasti dapat dirangkai menjadi segitiga?

Ayo coba: masukkan seutas tali ke dalam tiga sedotan, lalu ikat kedua ujung tali. Inilah hasil percobaan dengan lima kelompok sedotan:

| No. | Panjang sedotan (cm) | Membentuk segitiga? |
|---|---|---|
| 1 | 5, 6, 7 | Bisa |
| 2 | 4, 6, 6 | Bisa |
| 3 | 5, 4, 12 | Tidak bisa |
| 4 | 10, 5, 15 | Tidak bisa |
| 5 | 5, 12, 13 | Bisa |

Jadi, tidak semua kelompok tiga sedotan dapat dibuat segitiga.

## Perhatikan jumlahnya

Jumlahkan dua sedotan yang lebih pendek, lalu bandingkan dengan sedotan yang terpanjang:

- Nomor 1: 5 + 6 = 11, lebih dari 7. Bisa.
- Nomor 3: 5 + 4 = 9, kurang dari 12. Kedua sedotan pendek tidak sampai untuk bertemu.
- Nomor 4: 10 + 5 = 15, sama dengan 15. Tidak bisa juga.
- Nomor 5: 5 + 12 = 17, lebih dari 13. Bisa.

## Syaratnya

Tiga ruas garis dapat membentuk segitiga bila **jumlah panjang dua sisi mana pun lebih dari panjang sisi ketiga**.

Cara cepat memeriksanya:

1. Cari sisi yang terpanjang.
2. Jumlahkan dua sisi yang lain.
3. Bila jumlahnya **lebih dari** sisi terpanjang, segitiga dapat dibuat.

Menjumlahkan sisi terpanjang dengan sisi lain tidak memberi tahu apa-apa: hasilnya selalu lebih dari sisi yang tersisa. Yang harus diperiksa adalah dua sisi yang lebih pendek.

## Sama dengan belum cukup

Pada kelompok nomor 4, sedotan 10 cm dan 5 cm bersama-sama tepat 15 cm. Keduanya hanya dapat berbaring lurus di atas sedotan 15 cm, tanpa ujung yang terangkat. Tidak ada pojok ketiga, jadi tidak ada segitiga.

Jumlah dua sisi harus **lebih dari** sisi ketiga, tidak cukup sama dengan.

**Coba:** sedotan 4 cm, 5 cm, dan 10 cm.
_Periksa: 4 + 5 = 9, kurang dari 10. Tidak dapat dibuat segitiga._

{SUMBER}"""),
    dict(no=2, judul="Segitiga Menurut Besar Sudutnya",
         ringkasan="Menurut besar sudutnya, segitiga dapat berupa segitiga lancip, segitiga siku-siku, atau segitiga tumpul.",
         tujuan="Kalian dapat membandingkan segitiga lancip, siku-siku, dan tumpul dari besar sudut-sudutnya.",
         bloom="Memahami",
         isi=f"""## Mengingat jenis sudut

Di Bab 6 kalian sudah mengenal jenis sudut:

- **sudut lancip**: lebih dari 0° dan kurang dari 90°;
- **sudut siku-siku**: tepat 90°;
- **sudut tumpul**: lebih dari 90° dan kurang dari 180°.

Sudut dalam segitiga dapat diperiksa dengan sudut siku-siku dari lipatan kertas.

## Segitiga lancip

Sebuah segitiga yang **ketiga sudutnya lancip** disebut **segitiga lancip**.

Periksa ketiga sudutnya satu per satu. Bila semuanya lebih kecil dari pojok lipatan kertas, segitiga itu lancip.

## Segitiga siku-siku dan segitiga tumpul

- Segitiga yang salah satu sudutnya siku-siku disebut **segitiga siku-siku**.
- Segitiga yang salah satu sudutnya tumpul disebut **segitiga tumpul**.

Pada segitiga siku-siku hanya **satu** sudut yang siku-siku; dua sudut lainnya lancip. Pada segitiga tumpul pun hanya **satu** sudut yang tumpul; dua sudut lainnya lancip.

## Periksa ketiga sudutnya

Sebuah segitiga mempunyai sudut 35°, 40°, dan 105°.

1. 35° lancip.
2. 40° lancip.
3. 105° tumpul.

Ada satu sudut tumpul, jadi segitiga itu **segitiga tumpul**. Dua sudut lancip tidak membuatnya segitiga lancip; syarat segitiga lancip adalah **ketiga** sudutnya lancip.

**Coba:** sudut 90°, 60°, dan 30°.
_Periksa: ada satu sudut siku-siku, jadi segitiga siku-siku._

{SUMBER}"""),
    dict(no=3, judul="Jumlah Sudut-Sudut dalam Segitiga",
         ringkasan="Jumlah ketiga sudut dalam setiap segitiga adalah 180°, sehingga sudut ketiga dapat dihitung dari dua sudut yang diketahui.",
         tujuan="Kalian dapat menemukan bahwa jumlah sudut dalam segitiga 180° dan memakainya untuk menghitung sudut yang belum diketahui.",
         bloom="Menerapkan",
         isi=f"""## Percobaan Asep

Asep menggambar segitiga lancip pada kertas dan memberi tanda pada ketiga sudutnya. Ia memotong ketiga pojok itu, lalu mengimpitkan potongannya rapat-rapat, berdampingan di satu titik.

Ketiga pojok itu membentuk **sudut lurus**, yaitu garis lurus. Sudut lurus besarnya **180°**.

## Percobaan Lukas

Lukas menggambar segitiga tumpul, lalu membuat dua segitiga lagi yang bentuk dan ukurannya sama. Ia mengimpitkan tiga sudut yang berbeda dari ketiga segitiga itu di satu titik.

Hasilnya juga garis lurus, 180°.

Jadi, **jumlah sudut-sudut dalam segitiga adalah 180°**, untuk segitiga lancip, siku-siku, maupun tumpul.

## Mencari sudut ketiga

Dua sudut sebuah segitiga besarnya 30° dan 80°. Berapa sudut ketiga?

1. Jumlahkan sudut yang diketahui: 30° + 80° = 110°.
2. Kurangkan dari 180°: 180° − 110° = **70°**.
3. Periksa: 30° + 80° + 70° = 180°. Cocok.

Jawabannya sudut ketiga, 70°, bukan jumlah 110°.

## Mengapa hanya satu yang siku-siku?

Andaikan sebuah segitiga mempunyai dua sudut siku-siku. Maka 90° + 90° = 180°, dan untuk sudut ketiga tersisa 180° − 180° = 0°. Tidak ada sudut ketiga, jadi segitiga itu tidak mungkin ada.

Dengan cara yang sama, dua sudut tumpul sudah lebih dari 180°. Karena itu segitiga hanya dapat mempunyai **paling banyak satu** sudut siku-siku atau satu sudut tumpul.

**Coba:** dua sudut segitiga 60° dan 60°.
_Periksa: 180° − 60° − 60° = 60°. Ketiga sudutnya sama besar._

{SUMBER}"""),
    dict(no=4, judul="Segitiga Menurut Panjang Sisinya",
         ringkasan="Menurut panjang sisinya, segitiga dapat berupa segitiga sama kaki, sama sisi, atau sembarang; segitiga sama sisi juga termasuk segitiga sama kaki.",
         tujuan="Kalian dapat membandingkan ciri-ciri segitiga sama kaki, sama sisi, dan sembarang, termasuk sisi, sudut, dan simetrinya.",
         bloom="Menganalisis",
         isi=f"""## Segitiga sama kaki

Impitkan sisi-sisi sebuah model segitiga dari kertas satu sama lain. Bila ada **dua sisi** yang tepat berimpit, keduanya sama panjang. Kedua sisi itu disebut **kaki**, dan segitiganya disebut **segitiga sama kaki**.

Ciri-ciri segitiga sama kaki:

- setidaknya 2 sisi sama panjang;
- setidaknya 2 sudut sama besar, yaitu sudut yang menghadap kedua kaki;
- 1 simetri lipat dan 1 simetri putar.

Segitiga sama kaki dapat juga siku-siku (**segitiga siku-siku sama kaki**) atau tumpul (**segitiga tumpul sama kaki**). Nama menurut sudut dan nama menurut sisi dipakai bersama.

## Menghitung sudut segitiga sama kaki

Pada segitiga siku-siku sama kaki, sudut siku-sikunya diapit oleh kedua kaki. Dua sudut yang lain sama besar.

1. Sisa untuk dua sudut itu: 180° − 90° = 90°.
2. Bagi dua: 90° : 2 = **45°** masing-masing.

Pada segitiga tumpul sama kaki yang sudut di antara kedua kakinya 100°: 180° − 100° = 80°, dan 80° : 2 = **40°** masing-masing.

## Segitiga sama sisi

Bila **ketiga sisi** tepat berimpit satu sama lain, ketiganya sama panjang. Segitiga itu disebut **segitiga sama sisi**.

- Ketiga sudutnya sama besar: 180° : 3 = **60°**.
- Mempunyai 3 simetri lipat dan 3 simetri putar.

## Segitiga sembarang

Segitiga yang panjang sisi-sisinya berbeda satu sama lain disebut **segitiga sembarang**.

- Tidak ada sisi yang sama panjang dan tidak ada sudut yang sama besar.
- Tidak mempunyai simetri lipat.
- Simetri putarnya 1: ia hanya menempati bingkainya kembali setelah diputar satu putaran penuh.

## Sama sisi juga sama kaki

Aturan menggolongkan bangun: **bila semua ciri bangun A dimiliki bangun B, bangun B dapat disebut bangun A juga.**

Segitiga sama sisi mempunyai setidaknya 2 sisi sama panjang, setidaknya 2 sudut sama besar, setidaknya 1 simetri lipat, dan setidaknya 1 simetri putar. Semua ciri segitiga sama kaki ada padanya, jadi **segitiga sama sisi juga segitiga sama kaki**.

Sebaliknya tidak selalu. Segitiga dengan sisi 5 cm, 5 cm, dan 3 cm adalah segitiga sama kaki, tetapi ketiga sisinya tidak sama panjang, jadi bukan segitiga sama sisi.

{SUMBER}"""),
    dict(no=5, judul="Trapesium dan Jajargenjang",
         ringkasan="Trapesium adalah segi empat yang mempunyai setidaknya sepasang sisi sejajar; jajargenjang termasuk trapesium, tetapi bukan trapesium sama kaki.",
         tujuan="Kalian dapat membandingkan ciri-ciri trapesium dan jajargenjang serta menjelaskan mengapa jajargenjang termasuk trapesium.",
         bloom="Menganalisis",
         isi=f"""## Segi empat

**Segi empat** adalah bangun datar yang dibatasi oleh empat sisi. Trapesium, jajargenjang, persegi panjang, belah ketupat, persegi, dan layang-layang semuanya segi empat.

## Trapesium

Di kelas IV kalian belajar bahwa trapesium mempunyai sepasang sisi sejajar. Di bab ini kita memakai pengertian berikut:

**Trapesium adalah segi empat yang mempunyai setidaknya sepasang sisi sejajar.**

Ada juga buku yang memakai "tepat sepasang". Kedua pengertian itu sama-sama mempunyai alasan yang kuat, dan kelak kalian akan mempelajari bedanya. Di bab ini kita bersepakat memakai "setidaknya sepasang".

Cara memeriksa dua sisi sejajar: tarik garis tegak lurus dari sisi yang satu ke sisi yang lain di dua tempat. Bila kedua jaraknya sama, sisi-sisi itu sejajar.

## Trapesium siku-siku dan trapesium sama kaki

- **Trapesium siku-siku** adalah trapesium yang salah satu sudutnya siku-siku.
- **Trapesium sama kaki** adalah trapesium yang mempunyai **1 simetri lipat**. Kedua kakinya sama panjang, dan sudut-sudut pada alasnya sama besar.

Trapesium yang tidak siku-siku dan tidak sama kaki disebut **trapesium sembarang**. Ia tidak mempunyai sumbu simetri.

## Jajargenjang

Ciri-ciri jajargenjang:

- sisi-sisi yang berhadapan sejajar (dua pasang);
- sisi-sisi yang berhadapan sama panjang;
- sudut-sudut yang berhadapan sama besar;
- tidak mempunyai sumbu simetri.

## Jajargenjang adalah trapesium

Jajargenjang mempunyai setidaknya sepasang sisi sejajar; bahkan dua pasang. Jadi **jajargenjang termasuk trapesium**, yaitu trapesium yang kaki-kakinya juga sejajar.

Namun jajargenjang **bukan trapesium sama kaki**:

- trapesium sama kaki mempunyai 1 sumbu simetri, sedangkan jajargenjang tidak mempunyai sumbu simetri;
- sudut-sudut pada alas trapesium sama kaki sama besar, sedangkan sudut-sudut pada alas jajargenjang tidak.

Kaki-kaki jajargenjang memang sama panjang, tetapi itu belum cukup.

{SUMBER}"""),
    dict(no=6, judul="Persegi Panjang, Belah Ketupat, dan Persegi",
         ringkasan="Persegi panjang dan belah ketupat termasuk jajargenjang, dan persegi termasuk keduanya; setiap bangun yang lebih khusus mempunyai ciri tambahan.",
         tujuan="Kalian dapat menggolongkan persegi panjang, belah ketupat, dan persegi dengan membandingkan ciri-cirinya, dan menyebutkan ciri yang harus ditambahkan.",
         bloom="Menganalisis",
         isi=f"""## Arah menggolongkan

Ingat aturannya: **bila semua ciri bangun A dimiliki bangun B, bangun B dapat disebut bangun A.**

Perhatikan arahnya. Yang diperiksa adalah ciri-ciri A. Bila semuanya ada pada B, kesimpulannya "B adalah A", bukan "A adalah B".

## Persegi panjang dan jajargenjang

Periksa ciri-ciri jajargenjang pada persegi panjang:

- sisi-sisi berhadapan sejajar? Ya.
- sisi-sisi berhadapan sama panjang? Ya.
- sudut-sudut berhadapan sama besar? Ya.

Semua ciri jajargenjang dimiliki persegi panjang, jadi **persegi panjang termasuk jajargenjang**.

Rangkailah dua pasang sedotan yang sama panjang menjadi jajargenjang. Bila satu sudutnya diubah menjadi siku-siku, sudut-sudut yang lain ikut menjadi siku-siku, dan terbentuklah persegi panjang. Jadi **persegi panjang adalah jajargenjang yang salah satu sudutnya siku-siku**.

## Belah ketupat dan jajargenjang

Ciri-ciri belah ketupat: keempat sisinya sama panjang, sisi-sisi berhadapan sejajar, sudut-sudut berhadapan sama besar, kedua diagonalnya saling membagi dua sama panjang dan berpotongan tegak lurus, dan kedua diagonalnya merupakan sumbu simetri.

Semua ciri jajargenjang ada pada belah ketupat, jadi **belah ketupat termasuk jajargenjang**.

Sebaliknya tidak: jajargenjang tidak harus mempunyai empat sisi yang sama panjang, dan diagonalnya tidak harus tegak lurus. Jadi sembarang jajargenjang belum tentu belah ketupat.

## Persegi dan belah ketupat

Persegi mempunyai semua ciri belah ketupat: keempat sisinya sama panjang, sudut berhadapan sama besar, diagonalnya tegak lurus dan menjadi sumbu simetri. Jadi **persegi termasuk belah ketupat**.

Apa yang harus ditambahkan pada belah ketupat agar menjadi persegi? **Salah satu sudutnya harus siku-siku.**

## Persegi dan persegi panjang

Persegi juga mempunyai semua ciri persegi panjang: sisi berhadapan sejajar dan sama panjang, semua sudutnya siku-siku, diagonalnya saling membagi dua sama panjang. Jadi **persegi termasuk persegi panjang**.

Yang harus ditambahkan pada persegi panjang agar menjadi persegi: **sisi-sisi yang berurutan harus sama panjang**.

**Coba:** apakah setiap persegi panjang adalah persegi?
_Periksa: tidak. Sisi-sisi persegi panjang yang berurutan tidak harus sama panjang._

{SUMBER}"""),
    dict(no=7, judul="Layang-Layang dan Belah Ketupat",
         ringkasan="Layang-layang adalah segi empat yang salah satu diagonalnya merupakan sumbu simetri; belah ketupat termasuk layang-layang.",
         tujuan="Kalian dapat membandingkan ciri-ciri layang-layang dan belah ketupat serta merangkum hubungan antarbangun datar di bab ini.",
         bloom="Mengevaluasi",
         isi=f"""## Ciri-ciri layang-layang

Lipat sebuah layang-layang ABCD menurut salah satu diagonalnya. Kedua bagiannya tepat berimpit, jadi diagonal itu adalah **sumbu simetri**.

Ciri-ciri layang-layang:

- ada 2 pasang sisi berurutan yang sama panjang;
- ada sepasang sudut berhadapan yang sama besar;
- diagonal-diagonalnya berpotongan tegak lurus;
- salah satu diagonalnya merupakan sumbu simetri.

**Layang-layang adalah segi empat yang salah satu diagonalnya merupakan sumbu simetri.**

## Belah ketupat juga layang-layang

Periksa ciri-ciri layang-layang pada belah ketupat:

- 2 pasang sisi berurutan sama panjang? Ya, keempat sisinya sama panjang.
- sepasang sudut berhadapan sama besar? Ya, bahkan dua pasang.
- diagonal berpotongan tegak lurus? Ya.
- salah satu diagonal merupakan sumbu simetri? Ya, bahkan keduanya.

Semua ciri layang-layang dimiliki belah ketupat, jadi **belah ketupat termasuk layang-layang**.

## Yang ditambahkan

Pada layang-layang hanya satu diagonal yang menjadi sumbu simetri. Bila **kedua diagonalnya** menjadi sumbu simetri, layang-layang itu menjadi belah ketupat.

**Belah ketupat adalah layang-layang yang semua diagonalnya merupakan sumbu simetri.**

Karena itu, tidak setiap layang-layang adalah belah ketupat.

## Banyak sumbu simetri

| Bangun | Sumbu simetri |
|---|---|
| Segitiga sama kaki | 1 |
| Segitiga sama sisi | 3 |
| Segitiga sembarang | 0 |
| Trapesium sama kaki | 1 |
| Jajargenjang | 0 |
| Persegi panjang | 2 |
| Belah ketupat | 2 (kedua diagonalnya) |
| Persegi | 4 |
| Layang-layang | 1 (satu diagonalnya) |

## Rangkuman Bab 7

- Tiga ruas garis membentuk segitiga bila jumlah dua sisi mana pun **lebih dari** sisi ketiga.
- Menurut sudutnya: segitiga lancip, siku-siku, tumpul. Jumlah ketiga sudut 180°, jadi paling banyak satu sudut siku-siku atau tumpul.
- Menurut sisinya: segitiga sama kaki, sama sisi, sembarang. Segitiga sama sisi juga segitiga sama kaki.
- Bila semua ciri A dimiliki B, B dapat disebut A.
- Jajargenjang termasuk trapesium, tetapi bukan trapesium sama kaki.
- Persegi panjang dan belah ketupat termasuk jajargenjang; persegi termasuk keduanya.
- Belah ketupat termasuk layang-layang.

{SUMBER}"""),
]

for _p in PELAJARAN:
    cek(3 <= _p["isi"].count("\n## ") + _p["isi"].startswith("## ") <= 6, f"lesson {_p['no']}: 3-6 pages")
    cek(_p["isi"].rstrip().endswith(SUMBER), f"lesson {_p['no']}: attribution last")
# The lessons' tables and statements agree with the model.
cek(all(SIMETRI_LIPAT[n] == 0 for n in ("segitiga sembarang", "jajargenjang")) and SIMETRI_PUTAR["segitiga sembarang"] == 1)
cek(not termasuk("persegi panjang", "persegi") and not termasuk("jajargenjang", "belah ketupat") and not termasuk("layang-layang", "belah ketupat"))
cek(all(f"| {n[0].upper() + n[1:]} | {k}" in PELAJARAN[6]["isi"] for n, k in SIMETRI_LIPAT.items()))

# ── Misconceptions. 01, 04, 08 and 09 are the book's own Miskonsepsi (pp. 312, 338); the rest
# come from this chapter's distractors.
MISKONSEPSI = {
    "SD5-M-B7-01": ("Sembarang tiga ruas garis dianggap membentuk segitiga",
                    "Tiga ruas garis dianggap selalu dapat dirangkai menjadi segitiga, tanpa memperhatikan panjangnya.",
                    "Rangkai sedotan 5 cm, 4 cm, dan 12 cm bersama murid, lalu bandingkan 5 + 4 dengan 12."),
    "SD5-M-B7-02": ("Jumlah yang sama dengan sisi ketiga dianggap cukup",
                    "Dua sisi yang jumlahnya tepat sama dengan sisi ketiga dianggap masih dapat membentuk segitiga.",
                    "Rangkai sedotan 10 cm, 5 cm, dan 15 cm: kedua sedotan pendek hanya berbaring lurus di atas yang panjang. Tekankan kata lebih dari."),
    "SD5-M-B7-03": ("Pasangan sisi yang diperiksa keliru",
                    "Hanya pasangan yang memuat sisi terpanjang yang dijumlahkan, sehingga syarat segitiga tampak selalu terpenuhi.",
                    "Minta murid selalu menjumlahkan dua sisi yang lebih pendek dan membandingkannya dengan sisi terpanjang."),
    "SD5-M-B7-04": ("Jenis segitiga dinilai dari sebagian sudut",
                    "Jenis segitiga ditentukan dari satu atau dua sudut saja, atau semua sudut segitiga siku-siku dan tumpul dianggap siku-siku atau tumpul.",
                    "Minta murid menghitung atau mengukur ketiga sudut, lalu mencari apakah ada satu sudut siku-siku atau tumpul."),
    "SD5-M-B7-05": ("Jumlah sudut segitiga keliru",
                    "Jumlah sudut dalam segitiga dianggap 360° atau 90°, bukan 180°.",
                    "Ulangi percobaan memotong ketiga pojok segitiga dan mengimpitkannya menjadi garis lurus (180°)."),
    "SD5-M-B7-06": ("Langkah menghitung tidak lengkap",
                    "Hasil satu langkah (misalnya jumlah dua sudut atau sisa yang belum dibagi dua) diberikan sebagai jawaban, atau yang dicari bukan yang ditanyakan.",
                    "Minta murid menuliskan yang ditanyakan, lalu memeriksa apakah ketiga sudut bersama jawabannya berjumlah 180°."),
    "SD5-M-B7-07": ("Nama segitiga menurut sisi keliru",
                    "Segitiga sama kaki, sama sisi, dan sembarang tertukar, atau segitiga dianggap sama kaki tanpa ada sisi yang sama panjang.",
                    "Minta murid membandingkan panjang ketiga sisi satu per satu sebelum memberi nama."),
    "SD5-M-B7-08": ("Arah penggolongan terbalik",
                    "Setelah menemukan bahwa semua ciri A dimiliki B, murid menyimpulkan A adalah B, bukan B adalah A (misalnya persegi panjang dianggap persegi).",
                    "Tulis aturannya di papan: bila semua ciri A dimiliki B, maka B adalah A. Periksa dengan contoh yang berlawanan, misalnya persegi panjang yang sisinya 6 cm dan 3 cm."),
    "SD5-M-B7-09": ("Ciri tambahan keliru",
                    "Ciri yang sudah dimiliki bangun itu, atau ciri milik bangun lain, disebut sebagai ciri yang harus ditambahkan agar menjadi bangun yang lebih khusus.",
                    "Buat dua daftar ciri berdampingan dan coret yang sama; ciri yang tersisa pada bangun yang lebih khusus adalah ciri tambahannya."),
    "SD5-M-B7-10": ("Pengertian trapesium keliru",
                    "Trapesium dianggap harus mempunyai tepat sepasang sisi sejajar, atau jajargenjang dianggap trapesium sama kaki karena kakinya sama panjang.",
                    "Pakai pengertian bab ini (setidaknya sepasang sisi sejajar), lalu periksa sumbu simetri: trapesium sama kaki mempunyai satu, jajargenjang tidak."),
    "SD5-M-B7-11": ("Banyak sumbu simetri keliru",
                    "Banyak sumbu simetri sebuah bangun tertukar dengan bangun lain, misalnya belah ketupat dianggap mempunyai 4 atau layang-layang 2.",
                    "Lipat model kertas setiap bangun dan hitung garis lipatan yang membuat kedua bagian tepat berimpit."),
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
    angka = [re.fullmatch(r"(\d+)(°| cm)", t) for t, *_ in pilihan]
    if all(angka):   # a question that asks for a value: no distractor has the answer's value
        cek(len({int(m[1]) for m in angka}) == 4, f"{ref}: a distractor has the answer's value")
    i = "ABCD".index(jawab)
    S.append(dict(ref=ref, pel=pel, tanya=tanya, pilihan=pilihan[1:i + 1] + [pilihan[0]] + pilihan[i + 1:],
                  guna=guna, sulit=sulit, petunjuk=petunjuk))


# ── Pemetaan awal (pre-test): the triangle rule, a missing angle, naming by sides, classifying.
cek(bisa_segitiga(6, 7, 9) and not bisa_segitiga(3, 4, 9) and not bisa_segitiga(5, 5, 10) and not bisa_segitiga(2, 8, 12))
soal("PA1", 1, "Tiga ruas garis manakah yang dapat dirangkai menjadi segitiga?", "B", [
    ("6 cm, 7 cm, dan 9 cm", True, "Benar. 6 + 7 = 13, lebih dari 9.", ""),
    ("3 cm, 4 cm, dan 9 cm", False, "3 + 4 = 7, kurang dari 9. Kedua ruas garis pendek tidak dapat bertemu.", "SD5-M-B7-01"),
    ("5 cm, 5 cm, dan 10 cm", False, "5 + 5 = 10, hanya sama dengan 10. Kedua ruas garis berbaring lurus di atas yang panjang.", "SD5-M-B7-02"),
    ("2 cm, 8 cm, dan 12 cm", False, "2 + 8 = 10, kurang dari 12. Tidak semua tiga ruas garis dapat membentuk segitiga.", "SD5-M-B7-01"),
], guna="Pemetaan awal")
cek(sudut_ketiga(40, 85) == 55 and 40 + 85 == 125 and 360 - 125 == 235 and 180 - 40 == 140)
soal("PA2", 3, "Dua sudut sebuah segitiga besarnya 40° dan 85°. Berapa besar sudut ketiganya?", "D", [
    ("55°", True, "Benar. 180° − 40° − 85° = 55°.", ""),
    ("125°", False, "Ini jumlah kedua sudut yang diketahui. Yang ditanyakan sudut ketiga.", "SD5-M-B7-06"),
    ("235°", False, "Dikurangkan dari 360°. Jumlah sudut dalam segitiga 180°.", "SD5-M-B7-05"),
    ("140°", False, "Hanya 40° yang dikurangkan dari 180°; sudut 85° terlewat.", "SD5-M-B7-06"),
], guna="Pemetaan awal")
cek(jenis_sisi(7, 7, 4) == "sama kaki" and bisa_segitiga(7, 7, 4))
soal("PA3", 4, "Panjang sisi-sisi sebuah segitiga 7 cm, 7 cm, dan 4 cm. Segitiga itu termasuk ...", "A", [
    ("segitiga sama kaki", True, "Benar. Ada dua sisi yang sama panjang, 7 cm dan 7 cm.", ""),
    ("segitiga sama sisi", False, "Segitiga sama sisi memerlukan ketiga sisi sama panjang. Sisi 4 cm berbeda.", "SD5-M-B7-07"),
    ("segitiga sembarang", False, "Segitiga sembarang tidak mempunyai sisi yang sama panjang, padahal di sini ada dua sisi 7 cm.", "SD5-M-B7-07"),
    ("bukan segitiga, karena tidak dapat dibentuk", False, "4 + 7 = 11, lebih dari 7, jadi segitiga ini dapat dibentuk.", "SD5-M-B7-01"),
], guna="Pemetaan awal")
cek(termasuk("persegi panjang", "jajargenjang") and not termasuk("persegi panjang", "belah ketupat")
    and not termasuk("persegi panjang", "persegi") and not termasuk("persegi panjang", "layang-layang"))
soal("PA4", 6, "Persegi panjang dapat digolongkan juga sebagai ...", "C", [
    ("jajargenjang", True, "Benar. Semua ciri jajargenjang dimiliki persegi panjang: sisi berhadapan sejajar dan sama panjang, sudut berhadapan sama besar.", ""),
    ("belah ketupat", False, "Belah ketupat memerlukan keempat sisi sama panjang. Sisi-sisi persegi panjang yang berurutan tidak harus sama.", "SD5-M-B7-08"),
    ("persegi", False, "Arahnya terbalik: persegilah yang termasuk persegi panjang, bukan sebaliknya.", "SD5-M-B7-08"),
    ("layang-layang", False, "Diagonal persegi panjang tidak harus berpotongan tegak lurus dan tidak harus menjadi sumbu simetri.", "SD5-M-B7-08"),
], guna="Pemetaan awal")

# ── Cek penguasaan (post-test): fresh lengths and angles, every lesson.
cek(bisa_segitiga(4, 9, 7) and not bisa_segitiga(4, 9, 5) and 4 + 5 == 9 and not bisa_segitiga(4, 9, 3)
    and not bisa_segitiga(4, 9, 14) and 14 + 4 > 9)
soal("PB1", 1, "Rina mempunyai dua sedotan, 4 cm dan 9 cm. Sedotan ketiga manakah yang dapat melengkapinya menjadi segitiga?", "C", [
    ("7 cm", True, "Benar. 4 + 7 = 11, lebih dari 9, dan 4 + 9 = 13, lebih dari 7.", ""),
    ("5 cm", False, "4 + 5 = 9, hanya sama dengan 9, belum lebih. Kedua sedotan pendek berbaring lurus.", "SD5-M-B7-02"),
    ("3 cm", False, "4 + 3 = 7, kurang dari 9. Tidak semua panjang dapat dipakai.", "SD5-M-B7-01"),
    ("14 cm", False, "Yang diperiksa hanya 14 + 4 > 9. Pasangan 4 + 9 = 13 kurang dari 14.", "SD5-M-B7-03"),
], guna="Cek penguasaan", sulit="Sedang")
cek(sudut_ketiga(90, 38) == 52 and 180 - 38 == 142 and 90 + 38 == 128)
soal("PB2", 3, "Sebuah segitiga siku-siku mempunyai sudut lancip 38°. Berapa besar sudut lancip yang lain?", "A", [
    ("52°", True, "Benar. 180° − 90° − 38° = 52°.", ""),
    ("142°", False, "Hanya 38° yang dikurangkan dari 180°; sudut siku-siku 90° terlewat.", "SD5-M-B7-06"),
    ("38°", False, "Kedua sudut lancip dianggap sama besar. Itu hanya pada segitiga siku-siku sama kaki.", "SD5-M-B7-07"),
    ("128°", False, "Ini jumlah 90° dan 38°. Yang ditanyakan sudut yang tersisa.", "SD5-M-B7-06"),
], guna="Cek penguasaan", sulit="Sedang")
cek(sudut_ketiga(20, 48) == 112 and jenis_sudut([20, 48, 112]) == "tumpul")
soal("PB3", 2, "Dua sudut sebuah segitiga besarnya 20° dan 48°. Segitiga itu termasuk segitiga ...", "D", [
    ("tumpul", True, "Benar. Sudut ketiganya 180° − 20° − 48° = 112°, sudut tumpul.", ""),
    ("lancip", False, "Hanya dua sudut yang diketahui yang dilihat. Sudut ketiganya 112°, tumpul.", "SD5-M-B7-04"),
    ("siku-siku", False, "Sudut ketiga dianggap 90°. Hitunglah: 180° − 20° − 48° = 112°.", "SD5-M-B7-04"),
    ("sama kaki", False, "Nama sama kaki berasal dari sisi yang sama panjang. Ketiga sudutnya (20°, 48°, 112°) berbeda.", "SD5-M-B7-07"),
], guna="Cek penguasaan", sulit="Sedang")
cek((180 - 50) // 2 == 65 and 50 + 65 + 65 == 180 and 180 - 50 == 130 and 50 // 2 == 25)
soal("PB4", 4, "Pada sebuah segitiga sama kaki, sudut yang diapit kedua kakinya besarnya 50°. Berapa besar setiap sudut yang lain?", "B", [
    ("65°", True, "Benar. 180° − 50° = 130°, dibagi dua sama besar: 65°.", ""),
    ("130°", False, "130° adalah sisa untuk dua sudut bersama-sama. Masih harus dibagi dua.", "SD5-M-B7-06"),
    ("50°", False, "Ketiga sudut dianggap sama besar. Itu hanya pada segitiga sama sisi.", "SD5-M-B7-07"),
    ("25°", False, "50° yang dibagi dua. Yang dibagi dua adalah sisanya, 180° − 50° = 130°.", "SD5-M-B7-06"),
], guna="Cek penguasaan", sulit="Sedang", petunjuk="Dua sudut yang lain sama besar, dan ketiga sudut berjumlah 180°.")
cek(jenis_sisi(6, 6, 6) == "sama sisi" and SIMETRI_LIPAT["segitiga sama sisi"] == 3)
soal("PB5", 4, "Panjang sisi-sisi sebuah segitiga 6 cm, 6 cm, dan 6 cm. Nama manakah yang tepat untuknya?", "A", [
    ("Segitiga sama sisi, dan juga segitiga sama kaki", True, "Benar. Semua ciri segitiga sama kaki ada pada segitiga sama sisi, jadi keduanya tepat.", ""),
    ("Hanya segitiga sama sisi, tidak boleh sama kaki", False, "Segitiga sama sisi mempunyai setidaknya 2 sisi sama panjang, jadi ia juga segitiga sama kaki.", "SD5-M-B7-08"),
    ("Hanya segitiga sama kaki, karena dua sisinya 6 cm", False, "Ketiga sisinya sama panjang, jadi ia segitiga sama sisi juga.", "SD5-M-B7-07"),
    ("Segitiga siku-siku sama kaki dengan sisi 6 cm", False, "Ketiga sudutnya 60°, tidak ada yang siku-siku.", "SD5-M-B7-04"),
], guna="Cek penguasaan", sulit="Sedang")
cek(termasuk("jajargenjang", "trapesium") and not termasuk("jajargenjang", "trapesium sama kaki")
    and not termasuk("jajargenjang", "persegi panjang") and not termasuk("jajargenjang", "belah ketupat"))
soal("PB6", 5, "Jajargenjang dapat digolongkan juga sebagai ...", "C", [
    ("trapesium", True, "Benar. Jajargenjang mempunyai setidaknya sepasang sisi sejajar.", ""),
    ("trapesium sama kaki", False, "Trapesium sama kaki mempunyai 1 sumbu simetri, sedangkan jajargenjang tidak mempunyai sumbu simetri.", "SD5-M-B7-10"),
    ("persegi panjang", False, "Arahnya terbalik: persegi panjanglah yang termasuk jajargenjang. Jajargenjang tidak harus mempunyai sudut siku-siku.", "SD5-M-B7-08"),
    ("belah ketupat", False, "Arahnya terbalik: belah ketupatlah yang termasuk jajargenjang. Sisi jajargenjang tidak harus sama semua.", "SD5-M-B7-08"),
], guna="Cek penguasaan", sulit="Sedang")
cek(menjadi("jajargenjang", {"sisi_semua_sama"}) == "belah ketupat" and not termasuk("belah ketupat", "persegi")
    and not termasuk("belah ketupat", "persegi panjang") and not termasuk("belah ketupat", "trapesium sama kaki"))
soal("PB7", 6, "Sebuah jajargenjang ternyata mempunyai empat sisi yang sama panjang. Bangun itu dapat disebut ...", "D", [
    ("belah ketupat", True, "Benar. Jajargenjang yang keempat sisinya sama panjang adalah belah ketupat.", ""),
    ("persegi", False, "Persegi juga memerlukan sudut siku-siku. Belum ada keterangan tentang sudutnya.", "SD5-M-B7-09"),
    ("persegi panjang", False, "Persegi panjang memerlukan sudut siku-siku, bukan sisi yang sama semua.", "SD5-M-B7-09"),
    ("trapesium sama kaki", False, "Jajargenjang tidak pernah menjadi trapesium sama kaki: ia tidak mempunyai sumbu simetri seperti trapesium sama kaki.", "SD5-M-B7-10"),
], guna="Cek penguasaan", sulit="Sedang")
cek(termasuk("layang-layang", "layang-layang") and not termasuk("layang-layang", "belah ketupat")
    and not termasuk("layang-layang", "jajargenjang") and not termasuk("layang-layang", "persegi"))
soal("PB8", 7, "Sebuah segi empat mempunyai dua pasang sisi berurutan yang sama panjang, dan hanya satu diagonalnya yang merupakan sumbu simetri. Bangun itu adalah ...", "B", [
    ("layang-layang, bukan belah ketupat", True, "Benar. Belah ketupat memerlukan kedua diagonalnya menjadi sumbu simetri.", ""),
    ("belah ketupat, karena sisinya berpasangan", False, "Hanya satu diagonal yang menjadi sumbu simetri, jadi bangun ini belum belah ketupat.", "SD5-M-B7-09"),
    ("jajargenjang, karena sisinya berpasangan", False, "Pada jajargenjang, sisi yang sama panjang adalah sisi berhadapan, bukan berurutan, dan tidak ada sumbu simetri.", "SD5-M-B7-09"),
    ("persegi, karena ada sumbu simetri", False, "Persegi mempunyai 4 sumbu simetri, bukan satu.", "SD5-M-B7-11"),
], guna="Cek penguasaan", sulit="Sulit")

# ── Latihan (practice), by lesson.
cek(not bisa_segitiga(3, 5, 8) and 3 + 5 == 8 and 5 + 8 > 3)
soal("LT1", 1, "Dapatkah sedotan 3 cm, 5 cm, dan 8 cm dirangkai menjadi segitiga?", "A", [
    ("Tidak, karena 3 + 5 = 8, tidak lebih dari 8", True, "Benar. Jumlah dua sisi harus lebih dari sisi ketiga, tidak cukup sama dengan.", ""),
    ("Ya, karena 3 + 5 sudah sama panjang dengan sedotan 8 cm", False, "Sama dengan belum cukup. Kedua sedotan pendek hanya berbaring lurus di atas sedotan 8 cm.", "SD5-M-B7-02"),
    ("Ya, karena ada tiga sedotan", False, "Tidak semua tiga sedotan dapat membentuk segitiga; panjangnya harus diperiksa.", "SD5-M-B7-01"),
    ("Ya, karena 5 + 8 lebih dari 3", False, "Pasangan yang memuat sisi terpanjang selalu lebih. Yang harus diperiksa 3 + 5 terhadap 8.", "SD5-M-B7-03"),
])
cek(bisa_segitiga(6, 10, 15) and not bisa_segitiga(6, 10, 16) and not bisa_segitiga(6, 10, 17) and not bisa_segitiga(6, 10, 4))
soal("LT2", 1, "Dua sisi sebuah segitiga 6 cm dan 10 cm. Panjang sisi ketiga berupa bilangan cacah. Berapa panjang terbesar yang mungkin?", "D", [
    ("15 cm", True, "Benar. 6 + 10 = 16, jadi sisi ketiga harus kurang dari 16 cm; yang terbesar 15 cm.", ""),
    ("16 cm", False, "6 + 10 = 16, hanya sama dengan 16. Sisi ketiga harus kurang dari jumlah itu.", "SD5-M-B7-02"),
    ("17 cm", False, "Yang diperiksa hanya 17 + 6 > 10. Pasangan 6 + 10 = 16 kurang dari 17.", "SD5-M-B7-03"),
    ("4 cm", False, "Yang ditanyakan panjang terbesar. Lagi pula 6 + 4 = 10 hanya sama dengan 10.", "SD5-M-B7-06"),
], sulit="Sulit", petunjuk="Jumlah dua sisi yang diketahui harus lebih dari sisi ketiga.")
cek(jenis_sudut([90, 50, 40]) == "siku-siku")
soal("LT3", 2, "Segitiga yang salah satu sudutnya 90° disebut segitiga ...", "B", [
    ("siku-siku", True, "Benar. Satu sudut siku-siku sudah cukup.", ""),
    ("lancip", False, "Dua sudut lainnya memang lancip, tetapi segitiga lancip memerlukan ketiga sudutnya lancip.", "SD5-M-B7-04"),
    ("tumpul", False, "Sudut 90° tepat siku-siku, bukan tumpul. Sudut tumpul lebih dari 90°.", "SD5-M-B7-04"),
    ("sama kaki", False, "Nama sama kaki berasal dari sisi, bukan dari sudut 90°.", "SD5-M-B7-07"),
])
cek(jenis_sudut([30, 110, 40]) == "tumpul")
soal("LT4", 2, "Segitiga PQR mempunyai sudut P = 30°, sudut Q = 110°, dan sudut R = 40°. Segitiga itu termasuk segitiga ...", "C", [
    ("tumpul", True, "Benar. Sudut Q = 110° adalah sudut tumpul.", ""),
    ("lancip", False, "Dua sudut lancip belum cukup. Ada satu sudut tumpul, 110°.", "SD5-M-B7-04"),
    ("siku-siku", False, "Tidak ada sudut yang tepat 90°.", "SD5-M-B7-04"),
    ("sembarang", False, "Sembarang adalah nama menurut sisi. Yang ditanyakan dari sudut-sudutnya.", "SD5-M-B7-07"),
])
soal("LT5", 3, "Jumlah ketiga sudut dalam sebuah segitiga adalah ...", "A", [
    ("180°", True, "Benar. Ketiga pojok yang diimpitkan membentuk garis lurus, 180°.", ""),
    ("360°", False, "360° adalah satu putaran penuh. Ketiga pojok segitiga hanya membentuk garis lurus.", "SD5-M-B7-05"),
    ("90°", False, "90° adalah satu sudut siku-siku. Ketiga sudut bersama-sama 180°.", "SD5-M-B7-05"),
    ("270°", False, "Setiap sudut dianggap siku-siku (3 × 90°). Sudut segitiga tidak semuanya siku-siku.", "SD5-M-B7-04"),
])
cek(90 + 90 == 180 and sudut_ketiga(90, 90) == 0)
soal("LT6", 3, "Mengapa sebuah segitiga tidak dapat mempunyai dua sudut siku-siku?", "D", [
    ("Karena 90° + 90° sudah 180°, tak tersisa untuk sudut ketiga", True, "Benar. Sudut ketiga menjadi 0°, jadi tidak ada segitiga.", ""),
    ("Karena sudut siku-siku hanya boleh ada pada segi empat", False, "Segitiga siku-siku mempunyai satu sudut siku-siku. Yang tidak mungkin adalah dua.", "SD5-M-B7-04"),
    ("Karena segitiga harus mempunyai satu sudut tumpul", False, "Segitiga lancip dan siku-siku tidak mempunyai sudut tumpul.", "SD5-M-B7-04"),
    ("Dapat saja, asalkan ketiga sisi segitiga itu dibuat cukup panjang", False, "Panjang sisi tidak mengubah jumlah sudut, yang selalu 180°.", "SD5-M-B7-05"),
], sulit="Sedang")
cek(sudut_ketiga(45, 72) == 63 and 45 + 72 == 117 and 360 - 117 == 243 and 180 - 45 == 135)
soal("LT7", 3, "Dua sudut sebuah segitiga besarnya 45° dan 72°. Berapa besar sudut ketiga?", "B", [
    ("63°", True, "Benar. 180° − 45° − 72° = 63°.", ""),
    ("117°", False, "Ini jumlah kedua sudut yang diketahui. Yang ditanyakan sudut ketiga.", "SD5-M-B7-06"),
    ("243°", False, "Dikurangkan dari 360°. Jumlah sudut dalam segitiga 180°.", "SD5-M-B7-05"),
    ("135°", False, "Hanya 45° yang dikurangkan dari 180°; sudut 72° terlewat.", "SD5-M-B7-06"),
])
soal("LT8", 4, "Berapa banyak simetri lipat segitiga sama sisi?", "C", [
    ("3 simetri lipat", True, "Benar. Segitiga sama sisi dapat dilipat tepat di tiga cara.", ""),
    ("1 simetri lipat", False, "1 simetri lipat adalah milik segitiga sama kaki yang tidak sama sisi.", "SD5-M-B7-11"),
    ("Tidak ada simetri lipat", False, "Yang tidak mempunyai simetri lipat adalah segitiga sembarang.", "SD5-M-B7-11"),
    ("6 simetri lipat", False, "Tiga sisi dan tiga sudut dihitung terpisah. Setiap garis lipat melalui satu pojok dan tengah sisi di depannya.", "SD5-M-B7-11"),
])
cek(180 // 3 == 60)
soal("LT9", 4, "Setiap sudut segitiga sama sisi besarnya ...", "A", [
    ("60°", True, "Benar. Ketiga sudutnya sama besar: 180° : 3 = 60°.", ""),
    ("90°", False, "Segitiga sama sisi tidak mempunyai sudut siku-siku; 3 × 90° = 270°, lebih dari 180°.", "SD5-M-B7-05"),
    ("180°", False, "180° adalah jumlah ketiga sudut. Setiap sudut sepertiganya.", "SD5-M-B7-06"),
    ("120°", False, "360° dibagi tiga. Jumlah sudut segitiga 180°, bukan 360°.", "SD5-M-B7-05"),
])
cek(SIMETRI_LIPAT["segitiga sama kaki"] == 1)
soal("LT10", 4, "Sebuah segitiga siku-siku mempunyai dua sisi yang sama panjang. Nama yang paling lengkap untuknya adalah segitiga ...", "D", [
    ("siku-siku sama kaki", True, "Benar. Nama menurut sudut dan nama menurut sisi dipakai bersama.", ""),
    ("siku-siku sama sisi", False, "Segitiga sama sisi sudutnya 60° semua, jadi tidak dapat siku-siku.", "SD5-M-B7-07"),
    ("tumpul sama kaki", False, "Segitiga ini mempunyai sudut siku-siku, bukan sudut tumpul.", "SD5-M-B7-04"),
    ("siku-siku sembarang", False, "Segitiga sembarang tidak mempunyai sisi yang sama panjang, padahal di sini ada dua.", "SD5-M-B7-07"),
], sulit="Sedang")
soal("LT11", 5, "Menurut pengertian di bab ini, trapesium adalah segi empat yang mempunyai ...", "B", [
    ("setidaknya sepasang sisi sejajar", True, "Benar. Di bab ini kita memakai pengertian setidaknya sepasang.", ""),
    ("tepat sepasang sisi sejajar, tidak lebih", False, "Itu pengertian yang dipakai di kelas IV dan di sebagian buku. Di bab ini kita bersepakat memakai setidaknya sepasang.", "SD5-M-B7-10"),
    ("dua pasang sisi berhadapan yang sejajar", False, "Itu ciri jajargenjang. Trapesium cukup mempunyai satu pasang.", "SD5-M-B7-10"),
    ("dua pasang sisi berurutan sama panjang", False, "Itu ciri layang-layang, bukan trapesium.", "SD5-M-B7-09"),
])
cek(SIMETRI_LIPAT["trapesium sama kaki"] == 1)
soal("LT12", 5, "Berapa banyak sumbu simetri trapesium sama kaki?", "A", [
    ("1 sumbu simetri", True, "Benar. Garis lipatnya melalui tengah kedua sisi yang sejajar.", ""),
    ("2 sumbu simetri", False, "2 sumbu simetri adalah milik persegi panjang dan belah ketupat.", "SD5-M-B7-11"),
    ("Tidak ada sumbu simetri", False, "Yang tidak mempunyai sumbu simetri adalah trapesium sembarang dan jajargenjang.", "SD5-M-B7-11"),
    ("4 sumbu simetri", False, "4 sumbu simetri adalah milik persegi.", "SD5-M-B7-11"),
])
soal("LT13", 5, "Kaki-kaki jajargenjang sama panjang. Mengapa jajargenjang tetap bukan trapesium sama kaki?", "C", [
    ("Karena jajargenjang tidak mempunyai sumbu simetri", True, "Benar. Trapesium sama kaki mempunyai 1 sumbu simetri dan sudut alas yang sama besar.", ""),
    ("Karena jajargenjang tidak mempunyai sisi yang sejajar", False, "Jajargenjang mempunyai dua pasang sisi sejajar.", "SD5-M-B7-10"),
    ("Karena jajargenjang bukan segi empat", False, "Jajargenjang dibatasi empat sisi, jadi segi empat.", "SD5-M-B7-10"),
    ("Karena trapesium hanya boleh mempunyai sepasang sisi sejajar", False, "Di bab ini trapesium mempunyai setidaknya sepasang sisi sejajar, jadi jajargenjang tetap trapesium.", "SD5-M-B7-10"),
], sulit="Sedang")
cek(CIRI["persegi panjang"] <= CIRI["persegi"] and termasuk("persegi", "persegi panjang") and not termasuk("persegi panjang", "persegi"))
soal("LT14", 6, "Andi memeriksa bahwa semua ciri persegi panjang dimiliki oleh persegi. Kesimpulan manakah yang tepat?", "D", [
    ("Persegi dapat digolongkan sebagai persegi panjang", True, "Benar. Bila semua ciri A dimiliki B, B adalah A. Di sini B adalah persegi.", ""),
    ("Persegi panjang dapat digolongkan sebagai persegi", False, "Arahnya terbalik. Sisi-sisi persegi panjang yang berurutan tidak harus sama panjang.", "SD5-M-B7-08"),
    ("Persegi dan persegi panjang adalah bangun yang sama persis", False, "Persegi mempunyai ciri tambahan: sisi-sisi berurutan sama panjang.", "SD5-M-B7-09"),
    ("Persegi bukan persegi panjang karena sisinya sama", False, "Sisi yang sama semua tidak menghapus ciri persegi panjang; persegi tetap memiliki semuanya.", "SD5-M-B7-08"),
], sulit="Sedang")
cek(menjadi("jajargenjang", {"siku1"}) == "persegi panjang" and menjadi("jajargenjang", {"sisi_semua_sama"}) == "belah ketupat"
    and {"sisi_hadap_sama", "sejajar1"} <= CIRI["jajargenjang"])
soal("LT15", 6, "Ciri apa yang harus ditambahkan pada jajargenjang agar menjadi persegi panjang?", "B", [
    ("Salah satu sudutnya siku-siku", True, "Benar. Bila satu sudut siku-siku, keempat sudutnya ikut siku-siku.", ""),
    ("Sisi-sisi yang berhadapan sama panjang", False, "Ciri ini sudah dimiliki jajargenjang.", "SD5-M-B7-09"),
    ("Keempat sisinya sama panjang", False, "Ciri ini membuat jajargenjang menjadi belah ketupat, bukan persegi panjang.", "SD5-M-B7-09"),
    ("Mempunyai sepasang sisi yang sejajar", False, "Jajargenjang sudah mempunyai dua pasang sisi sejajar.", "SD5-M-B7-09"),
])
cek("siku_semua" in tutup(JAJARGENJANG | {"siku1"}))
soal("LT16", 6, "Empat sedotan dirangkai menjadi jajargenjang. Lalu satu sudutnya diubah menjadi siku-siku. Bagaimana sudut-sudut yang lain?", "C", [
    ("Semuanya ikut menjadi siku-siku", True, "Benar. Bangunnya menjadi persegi panjang.", ""),
    ("Tetap dua lancip dan dua tumpul", False, "Sudut-sudut berhadapan pada jajargenjang sama besar, jadi sudut di depan sudut siku-siku itu juga siku-siku, dan dua sudut lainnya menyusul.", "SD5-M-B7-04"),
    ("Hanya sudut di depannya yang ikut siku-siku", False, "Dua sudut lainnya pun menjadi siku-siku. Coba dengan sedotan: bangunnya menjadi persegi panjang, yang keempat sudutnya siku-siku.", "SD5-M-B7-04"),
    ("Semuanya menjadi tumpul", False, "Sudut yang diubah sudah siku-siku, bukan tumpul. Sudut di depannya sama besar dengannya, jadi juga siku-siku.", "SD5-M-B7-04"),
], sulit="Sedang")
cek(SIMETRI_LIPAT["belah ketupat"] == 2)
soal("LT17", 7, "Berapa banyak sumbu simetri belah ketupat?", "A", [
    ("2, yaitu kedua diagonalnya", True, "Benar. Belah ketupat dapat dilipat tepat menurut kedua diagonalnya.", ""),
    ("4, seperti persegi", False, "Persegi mempunyai 4 karena sudutnya siku-siku. Belah ketupat hanya 2.", "SD5-M-B7-11"),
    ("1, seperti layang-layang", False, "Layang-layang hanya mempunyai 1. Pada belah ketupat kedua diagonalnya sumbu simetri.", "SD5-M-B7-11"),
    ("Tidak ada, seperti jajargenjang", False, "Jajargenjang tidak mempunyai sumbu simetri, tetapi belah ketupat mempunyai 2.", "SD5-M-B7-11"),
])
cek(menjadi("layang-layang", {"diag_simetri2"}) == "belah ketupat" and menjadi("layang-layang", {"siku1"}) != "belah ketupat"
    and {"sisi_urut_2pasang", "diag_tegak"} <= CIRI["layang-layang"])
soal("LT18", 7, "Ciri apa yang harus ditambahkan pada layang-layang agar menjadi belah ketupat?", "D", [
    ("Kedua diagonalnya merupakan sumbu simetri", True, "Benar. Belah ketupat adalah layang-layang yang semua diagonalnya sumbu simetri.", ""),
    ("Salah satu sudutnya siku-siku", False, "Sudut siku-siku adalah ciri tambahan dari belah ketupat ke persegi.", "SD5-M-B7-09"),
    ("Dua pasang sisi berurutan sama panjang", False, "Ciri ini sudah dimiliki layang-layang.", "SD5-M-B7-09"),
    ("Diagonal-diagonalnya berpotongan saling tegak lurus", False, "Diagonal layang-layang sudah berpotongan tegak lurus.", "SD5-M-B7-09"),
], sulit="Sedang")
cek(not termasuk("layang-layang", "jajargenjang") and all(termasuk(n, "jajargenjang") for n in ("persegi", "persegi panjang", "belah ketupat")))
soal("LT19", 7, "Bangun manakah yang tidak dapat digolongkan sebagai jajargenjang?", "B", [
    ("Layang-layang", True, "Benar. Sisi-sisi layang-layang yang sama panjang berurutan, dan sisinya tidak harus sejajar.", ""),
    ("Persegi", False, "Persegi mempunyai semua ciri jajargenjang, jadi termasuk jajargenjang.", "SD5-M-B7-08"),
    ("Persegi panjang", False, "Persegi panjang adalah jajargenjang yang sudutnya siku-siku.", "SD5-M-B7-08"),
    ("Belah ketupat", False, "Belah ketupat mempunyai semua ciri jajargenjang, jadi termasuk jajargenjang.", "SD5-M-B7-08"),
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
cek(sum(1 for s in POST if s["sulit"] == "Sedang") > len(POST) / 2, "post-test mostly Sedang")
HURUF = {}
for s in S:
    h = "ABCD"[[b for _, b, _, _ in s["pilihan"]].index(True)]
    HURUF[h] = HURUF.get(h, 0) + 1
cek(set(HURUF) == set("ABCD") and max(HURUF.values()) * 2 <= len(S) and max(HURUF.values()) - min(HURUF.values()) <= 3, HURUF)

# The post-test uses fresh numbers: no set of sides is one the book or a lesson works through, no
# angle in a stem is a lesson example, and no answer is a book key (45°, 60°, 90°, 180°). The
# classification items (PB5-PB8) ask about shapes the lessons name, as they must; none of them is
# an Uji Kompetensi statement.
KUNCI_BUKU = {45, 60, 90, 180, 0}
UJI_KOMPETENSI = ["5 cm, 7 cm, dan 1 cm", "Semua sudut pada segitiga siku-siku", "Segitiga sama sisi juga dapat digolongkan",
                  "Jajargenjang merupakan trapesium sama kaki", "Persegi panjang adalah jajargenjang yang",
                  "Belah ketupat dapat digolongkan sebagai jajargenjang", "Persegi tidak dapat disebut", "Persegi bukan belah ketupat",
                  "Salah satu diagonal pada layang-layang"]
for s_ in POST:
    cm = [int(n) for n in re.findall(r"(\d+) cm", s_["tanya"])]
    if cm:
        cek(not any(set(cm) <= set(t) for t in SEDOTAN_PELAJARAN if len(set(cm)) > 1) and tuple(cm) not in SEDOTAN_PELAJARAN, s_["ref"])
    sudut = [int(n) for n in re.findall(r"(\d+)°", s_["tanya"])]
    cek(not set(sudut) & SUDUT_PELAJARAN, f"{s_['ref']}: an angle in it is a lesson example")
    benar = next(t for t, b, _, _ in s_["pilihan"] if b)
    m = re.fullmatch(r"(\d+)°", benar)
    cek(not m or int(m[1]) not in KUNCI_BUKU | SUDUT_PELAJARAN, f"{s_['ref']}: the answer {benar} is a book key or lesson answer")
    cek(not any(u.lower() in (s_["tanya"] + benar).lower() for u in UJI_KOMPETENSI), s_["ref"])
cek(bisa_segitiga(4, 9, 7) and (4, 9, 7) not in SEDOTAN_PELAJARAN)


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
                c.number_format = "@"

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
    tulis(os.path.join(here, "SD5-Matematika-Bab7.xlsx"))
    tulis_miskonsepsi(os.path.join(here, "SD5-Matematika-Bab7-miskonsepsi.csv"))
    halaman = sum(p["isi"].count("## ") for p in PELAJARAN)
    print(f"SD5-Matematika-Bab7.xlsx: lessons {len(PELAJARAN)} ({halaman} pages), questions {len(S)} "
          f"(pre {len(PRE)}, post {len(POST)}, practice {len(LAT)}), answers "
          + " ".join(f"{h}={HURUF[h]}" for h in "ABCD"))
    print(f"SD5-Matematika-Bab7-miskonsepsi.csv: {len(MISKONSEPSI)} codes")
    print(f"assertions passed: {CEK[0]}")
