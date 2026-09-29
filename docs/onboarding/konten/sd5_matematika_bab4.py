# SD Kelas 5, Matematika, Bab 4 "Keliling Bangun Datar", as a PINTAR lesson workbook in the D-007
# template (sheets Kursus, Bab, Pelajaran, Soal, Pilihan; the column contract is KOLOM in
# src/lib/unggah-kontrak.ts). Built the way Bab 1-3 were (all passed).
#
# Source: Buku Panduan Guru Matematika untuk SD/MI Kelas V (Meita Fitrianawati, Ika Surtiani,
# Ait Istiandaru; Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi, 2022), Bab 4,
# pp. 113-176. Lessons follow subbab A-E; subbab C (segi empat) is split in two because it holds
# six shapes.
#
# The lesson player draws only fraction bars, so every shape here is described in words. A
# bangun gabungan is given as a walk around its edge ("ke kanan 10 m, ke bawah 4 m, ..."), which
# is also what keliling means; `jalan()` below checks that every walk closes and computes its
# perimeter, and `pelingkup()` checks whether the bounding-rectangle shortcut holds for it.
#
# Text lessons only (D-050). The workbook's "Kode miskonsepsi" column stays empty; the proposed
# codes go to SD5-Matematika-Bab4-miskonsepsi.csv.
#
# Run: python3 docs/onboarding/konten/sd5_matematika_bab4.py
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


ARAH = {"kanan": (1, 0), "kiri": (-1, 0), "bawah": (0, -1), "atas": (0, 1)}


def jalan(langkah):
    """A walk [(arah, panjang), ...] around a shape: returns its perimeter, and checks it closes
    and never runs back along the edge it just walked."""
    x = y = 0
    for i, (a, n) in enumerate(langkah):
        dx, dy = ARAH[a]
        x, y = x + dx * n, y + dy * n
        if i:
            pdx, pdy = ARAH[langkah[i - 1][0]]
            cek((dx, dy) != (-pdx, -pdy), "a walk never doubles back on itself")
    cek((x, y) == (0, 0), f"the walk closes: ended at {(x, y)}")
    return sum(n for _, n in langkah)


def pelingkup(langkah):
    """Perimeter of the rectangle around the walk: 2 x (width + height)."""
    x = y = 0
    xs, ys = [0], [0]
    for a, n in langkah:
        dx, dy = ARAH[a]
        x, y = x + dx * n, y + dy * n
        xs.append(x)
        ys.append(y)
    return 2 * ((max(xs) - min(xs)) + (max(ys) - min(ys)))


def luas_ortogonal(langkah):
    """Area inside a walk of horizontal and vertical steps (shoelace formula)."""
    x = y = 0
    pts = [(0, 0)]
    for a, n in langkah:
        dx, dy = ARAH[a]
        x, y = x + dx * n, y + dy * n
        pts.append((x, y))
    return abs(sum(pts[i][0] * pts[i + 1][1] - pts[i + 1][0] * pts[i][1] for i in range(len(pts) - 1))) // 2


def kalimat_jalan(langkah):
    return ", ".join(f"ke {a} {n}" for a, n in langkah)


# ── Lesson examples ─────────────────────────────────────────────────────────────
LAPANGAN = [("kanan", 100), ("bawah", 50), ("kiri", 100), ("atas", 50)]
cek(jalan(LAPANGAN) == 300 == 100 + 50 + 100 + 50)                                    # book p. 123
cek(3 * 100 == 300 and 6 * 50 == 300)                                                  # Nisa's and Lukas's routes
cek(4 + 4 + 4 + 4 == 16 and 5 + 4 + 5 + 5 == 19)                                       # book p. 127
cek(3 + 5 + 6 == 14 and 7 + 4 + 5 == 16)                                               # book pp. 130-131
cek(5 + 5 + 5 == 3 * 5 == 15 and 3 * 6 == 18)                                          # book pp. 133-134
cek(6 + 6 + 4 == 2 * 6 + 4 == 16)                                                      # book p. 137
cek(5 + 3 + 5 + 3 == 2 * 5 + 2 * 3 == 16)                                              # book p. 141
cek(2 * 3 + 2 * 7 == 20)                                                               # lesson 3 kite
# BOOK ERROR (p. 146): the kite 2 + 2 + 4 + 4 is worked as "= 4 + 8 = 16" and then "14 cm"; it is 12.
cek(2 + 2 + 4 + 4 == 2 * 2 + 2 * 4 == 12)
cek(4 * 3 == 12 and 4 + 2 + 5 + 3 == 14)                                               # book pp. 148, 152
cek(5 * 3 == 15 and 6 * 3 == 18 and 8 * 4 == 32)                                       # book pp. 156-157
L_PELAJARAN = [("kanan", 8), ("bawah", 3), ("kiri", 5), ("bawah", 4), ("kiri", 3), ("atas", 7)]
cek(jalan(L_PELAJARAN) == 30 == pelingkup(L_PELAJARAN) == 2 * (8 + 7))
cek(8 * 3 + 3 * 4 == luas_ortogonal(L_PELAJARAN) == 36 and 2 * (8 + 3) + 2 * (3 + 4) == 36)  # the two rooms' keliling add to 36
U_PELAJARAN = [("kanan", 2), ("bawah", 2), ("kanan", 3), ("atas", 2), ("kanan", 2), ("bawah", 5), ("kiri", 7), ("atas", 5)]
cek(jalan(U_PELAJARAN) == 28 and pelingkup(U_PELAJARAN) == 24 == 2 * (7 + 5) and 24 + 2 * 2 == 28)
# BOOK ERROR (pp. 166-167): the worked example's numbers disagree with its own figure (top drawn
# 20 cm, used 18 cm; CE stated 10 cm, used 9 cm), so its 82 cm is not used.
# BOOK ERROR (pp. 173-174): the school wall is 94 m, correctly; 18 galon x 5 m = 90 m < 94 m, so
# 18 galon is NOT enough. The key argues with 20 galon (100 m) and says "lebih dari cukup".
# the key's own lengths: top IH 24, right 20, bottom 12, notch CD 3 (to the right), AB = 24 - 12 + 3 = 15
SEKOLAH = [("kanan", 24), ("bawah", 20), ("kiri", 12), ("atas", 3), ("kanan", 3), ("atas", 9), ("kiri", 15), ("atas", 8)]
cek(jalan(SEKOLAH) == 94 and 18 * 5 == 90 < 94 and 19 * 5 >= 94)

SUMBER = ("_Diadaptasi dari Buku Panduan Guru Matematika untuk SD/MI Kelas V, Kementerian Pendidikan, "
          "Kebudayaan, Riset, dan Teknologi, 2022, Bab 4._")

KURSUS = {
    "Judul kursus*": "Matematika Kelas 5 · Bab 4: Keliling Bangun Datar",
    "Mata pelajaran*": "Matematika",
    "Jenjang*": "SD",
    "Kelas*": "Kelas 5",
    "Konteks": "Akademik",
}

BAB = [(1, "Keliling Bangun Datar")]

PELAJARAN = [
    dict(no=1, judul="Apakah Keliling Itu?",
         ringkasan="Keliling adalah panjang jalan yang menyusuri semua tepi sebuah bangun satu kali sampai kembali ke titik awal.",
         tujuan="Kalian dapat mengenali masalah yang melibatkan keliling dan menghitung keliling sebagai jumlah panjang semua sisi.",
         bloom="Memahami",
         isi=f"""## Berlari 300 meter

Pak Guru meminta anak-anak berlari sejauh 300 m di lapangan sepak bola yang panjangnya 100 m dan lebarnya 50 m. Setelah berlari, mereka harus kembali ke tempat semula untuk melapor.

- Nisa berlari bolak-balik di sisi panjang: 100 + 100 + 100 = 300 m. Tetapi ia berhenti di ujung lapangan yang lain, jauh dari Pak Guru.
- Lukas berlari bolak-balik di sisi pendek enam kali: 6 × 50 = 300 m.
- Asep menyusuri **semua tepi** lapangan satu kali: 100 + 50 + 100 + 50 = 300 m, dan ia tiba kembali di tempat semula.

Rute Asep disebut **mengelilingi** lapangan.

## Arti keliling

Asep berangkat dari satu titik, menyusuri tepi lapangan, dan berhenti di titik yang sama. Setiap sisi dilewati **tepat satu kali**. Panjang rute itu adalah **keliling** lapangan.

**Keliling bangun datar adalah jumlah panjang semua sisinya.**

Keliling lapangan = 100 + 50 + 100 + 50 = **300 m**.

Bolak-balik di satu sisi, atau melintasi tengah lapangan, bukan keliling.

## Menghitung keliling

Sebuah persegi mempunyai empat sisi yang masing-masing 4 cm.
Keliling = 4 + 4 + 4 + 4 = **16 cm**.

Sebuah segi empat mempunyai sisi 5 cm, 4 cm, 5 cm, dan 5 cm.
Keliling = 5 + 4 + 5 + 5 = **19 cm**.

Keliling adalah panjang, jadi satuannya cm atau m, sama dengan satuan sisinya.

## Keliling di sekitar kita

Kita menghitung keliling bila yang diukur adalah **tepi**:

- panjang pagar yang mengelilingi kebun,
- panjang kayu untuk bingkai foto,
- panjang pita untuk menghias tepi kado,
- panjang benteng yang mengelilingi Keraton Yogyakarta.

Bila yang ditanyakan berapa ubin untuk **menutup** lantai, itu bukan keliling, tetapi luas.

{SUMBER}"""),
    dict(no=2, judul="Keliling Segitiga",
         ringkasan="Keliling segitiga adalah jumlah ketiga sisinya; sisi yang sama panjang dapat dihitung dengan perkalian.",
         tujuan="Kalian dapat menghitung keliling segitiga sembarang, segitiga sama sisi, dan segitiga sama kaki.",
         bloom="Menerapkan",
         isi=f"""## Segitiga sembarang

Pada segitiga sembarang, ketiga sisinya berbeda panjang. Jumlahkan saja ketiganya.

Segitiga dengan sisi 3 cm, 5 cm, dan 6 cm:
Keliling = 3 + 5 + 6 = **14 cm**.

**Keliling = sisi pertama + sisi kedua + sisi ketiga**

## Segitiga sama sisi

Ketiga sisi segitiga sama sisi sama panjang. Bila sisinya 5 cm:

Keliling = 5 + 5 + 5 = 15 cm.

Menjumlahkan tiga bilangan yang sama sama dengan mengalikannya dengan 3:
Keliling = 3 × 5 = **15 cm**.

**Keliling = 3 × panjang sisi**

**Coba:** segitiga sama sisi dengan sisi 6 cm.
_Periksa: 3 × 6 = 18 cm._

## Segitiga sama kaki

Segitiga sama kaki mempunyai setidaknya **dua** sisi yang sama panjang, yaitu kakinya. Sisi ketiga disebut alas.

Kaki 6 cm dan alas 4 cm:

1. Dua kaki: 2 × 6 = 12.
2. Tambah alas: 12 + 4 = 16.
3. Keliling = **16 cm**.

**Keliling = (2 × panjang kaki) + panjang alas**

Hati-hati memilih sisi mana yang dikali 2: yang dikali 2 adalah sisi yang **ada dua**, yaitu kakinya.

## Mencari sisi dari keliling

Keliling segitiga sama sisi 27 cm. Berapa panjang sisinya?

Keliling = 3 × sisi, jadi sisi = 27 : 3 = **9 cm**. Periksa: 3 × 9 = 27.

{SUMBER}"""),
    dict(no=3, judul="Keliling Persegi Panjang, Jajargenjang, dan Layang-Layang",
         ringkasan="Ketiga bangun ini mempunyai dua pasang sisi yang sama panjang, jadi kelilingnya dua kali sisi yang satu ditambah dua kali sisi yang lain.",
         tujuan="Kalian dapat menghitung keliling persegi panjang, jajargenjang, dan layang-layang.",
         bloom="Menerapkan",
         isi=f"""## Persegi panjang

Sisi-sisi yang berhadapan pada persegi panjang sama panjang. Persegi panjang dengan panjang 5 cm dan lebar 3 cm mempunyai sisi 5, 3, 5, dan 3 cm.

1. Keliling = 5 + 3 + 5 + 3.
2. Kelompokkan yang sama: (5 + 5) + (3 + 3) = (2 × 5) + (2 × 3).
3. = 10 + 6 = **16 cm**.

**Keliling = (2 × panjang) + (2 × lebar)**

Pada gambar biasanya hanya panjang dan lebar yang ditulis. Dua sisi lainnya tidak ditulis karena sudah pasti sama. Jangan sampai terlewat.

## Jajargenjang

Sisi-sisi yang berhadapan pada jajargenjang juga sama panjang. Jajargenjang dengan sisi alas 5 cm dan sisi samping 3 cm:

Keliling = (2 × 5) + (2 × 3) = 10 + 6 = **16 cm**.

**Keliling = (2 × sisi alas) + (2 × sisi samping)**

## Layang-layang

Layang-layang juga mempunyai dua pasang sisi yang sama panjang, tetapi letaknya **berurutan**, bukan berhadapan: dua sisi pendek bertemu di satu ujung, dan dua sisi panjang bertemu di ujung yang lain.

Layang-layang dengan sisi pendek 3 cm dan sisi panjang 7 cm:

Keliling = 3 + 3 + 7 + 7 = (2 × 3) + (2 × 7) = 6 + 14 = **20 cm**.

**Keliling = (2 × sisi pendek) + (2 × sisi panjang)**

## Satu pola untuk tiga bangun

Ketiga bangun mempunyai **dua pasang** sisi yang sama panjang, jadi rumusnya berpola sama:

(2 × sisi yang satu) + (2 × sisi yang lain)

Banyaknya sisi yang sama panjang menjadi pengalinya.

{SUMBER}"""),
    dict(no=4, judul="Keliling Persegi, Belah Ketupat, Trapesium, dan Segi Empat Sembarang",
         ringkasan="Persegi dan belah ketupat mempunyai empat sisi sama panjang; trapesium dan segi empat sembarang dihitung dengan menjumlahkan keempat sisinya.",
         tujuan="Kalian dapat menghitung keliling persegi, belah ketupat, trapesium, dan segi empat sembarang.",
         bloom="Menerapkan",
         isi=f"""## Persegi

Keempat sisi persegi sama panjang. Persegi dengan sisi 3 cm:

Keliling = 3 + 3 + 3 + 3 = 4 × 3 = **12 cm**.

**Keliling = 4 × panjang sisi**

## Belah ketupat

Keempat sisi belah ketupat juga sama panjang, walaupun bentuknya miring. Jadi kelilingnya dihitung seperti persegi.

Belah ketupat dengan sisi 3 cm: Keliling = 4 × 3 = **12 cm**.

**Keliling = 4 × panjang sisi**

## Trapesium dan segi empat sembarang

Pada trapesium dan segi empat sembarang, sisi-sisinya biasanya tidak sama panjang. Tidak ada pengali, jadi **jumlahkan keempat sisinya satu per satu**.

Trapesium dengan sisi 4 cm, 2 cm, 5 cm, dan 3 cm:
Keliling = 4 + 2 + 5 + 3 = **14 cm**.

**Keliling = sisi 1 + sisi 2 + sisi 3 + sisi 4**

## Kapan boleh mengalikan?

Perkalian hanya boleh dipakai untuk sisi yang **benar-benar sama panjang**.

| Bangun | Sisi yang sama | Keliling |
|---|---|---|
| Persegi, belah ketupat | keempatnya | 4 × sisi |
| Persegi panjang, jajargenjang, layang-layang | dua pasang | (2 × sisi satu) + (2 × sisi lain) |
| Trapesium, segi empat sembarang | biasanya tidak ada | jumlahkan keempat sisi |

**Coba:** trapesium dengan sisi 10 cm, 6 cm, 5 cm, dan 5 cm. Bolehkah ditulis 4 × 10?
_Periksa: tidak, sisinya tidak sama panjang. Keliling = 10 + 6 + 5 + 5 = 26 cm._

{SUMBER}"""),
    dict(no=5, judul="Keliling Segi Banyak Beraturan",
         ringkasan="Pada segi banyak beraturan semua sisi sama panjang, jadi kelilingnya adalah banyak sisi dikali panjang satu sisi.",
         tujuan="Kalian dapat menghitung keliling segi lima, segi enam, dan segi delapan beraturan.",
         bloom="Menerapkan",
         isi=f"""## Segi lima beraturan

Segi lima beraturan mempunyai **5 sisi** yang sama panjang. Bila setiap sisinya 3 cm:

Keliling = 3 + 3 + 3 + 3 + 3 = 5 × 3 = **15 cm**.

## Segi enam dan segi delapan beraturan

Segi enam beraturan mempunyai 6 sisi sama panjang. Sisi 3 cm:
Keliling = 6 × 3 = **18 cm**.

Segi delapan beraturan mempunyai 8 sisi sama panjang. Sisi 4 cm:
Keliling = 8 × 4 = **32 cm**.

## Polanya

| Bangun beraturan | Banyak sisi | Keliling |
|---|---|---|
| Persegi | 4 | 4 × panjang sisi |
| Segi lima | 5 | 5 × panjang sisi |
| Segi enam | 6 | 6 × panjang sisi |
| Segi delapan | 8 | 8 × panjang sisi |

**Keliling segi banyak beraturan = banyak sisi × panjang satu sisi**

Nama bangunnya memberi tahu pengalinya: segi **enam** berarti dikali **6**.

Bila sisinya **tidak** sama panjang, pola ini tidak berlaku: jumlahkan semua sisinya satu per satu.

## Mencari panjang sisi

Keliling segi delapan beraturan 56 cm. Berapa panjang sisinya?

Keliling = 8 × sisi, jadi sisi = 56 : 8 = **7 cm**. Periksa: 8 × 7 = 56.

{SUMBER}"""),
    dict(no=6, judul="Keliling Bangun Gabungan",
         ringkasan="Keliling bangun gabungan adalah jumlah panjang sisi-sisi terluarnya; sisi yang belum tertulis dicari dari sisi di seberangnya.",
         tujuan="Kalian dapat menguraikan bangun gabungan dan menghitung kelilingnya dari sisi-sisi terluarnya.",
         bloom="Menganalisis",
         isi=f"""## Hanya tepi terluar

Denah sebuah rumah terdiri atas dua ruangan: ruang A berukuran 8 m × 3 m, dan ruang B berukuran 3 m × 4 m tepat di bawah ujung kiri ruang A. Dinding di antara kedua ruangan ada di **dalam** rumah.

Berapa panjang dinding terluar rumah itu? Bayangkan kalian berjalan menyusuri tepi luarnya, mulai dari pojok kiri atas:

ke kanan 8 m, ke bawah 3 m, ke kiri 5 m, ke bawah 4 m, ke kiri 3 m, lalu naik 7 m kembali ke titik awal.

Keliling = 8 + 3 + 5 + 4 + 3 + 7 = **30 m**.

Menjumlahkan keliling kedua ruangan, 22 + 14 = 36 m, **tidak** tepat: dinding di dalam rumah ikut terhitung dua kali.

## Mencari sisi yang belum tertulis

Sering ada sisi yang panjangnya tidak tertulis. Carilah dari sisi di seberangnya.

Pada rumah tadi, anggap hanya tertulis: atas 8 m, kanan 3 m, bawah ruang B 3 m, dan kiri 7 m.

1. Sisi mendatar ke kiri harus sama dengan sisi atas: 8 = ... + 3, jadi sisi mendatar di tengah = 8 − 3 = **5 m**.
2. Sisi tegak ke bawah harus sama dengan sisi kiri: 7 = 3 + ..., jadi sisi tegak ruang B = 7 − 3 = **4 m**.

Sekarang semua sisi terluar diketahui, dan kelilingnya 30 m.

## Cara cepat: persegi panjang pelingkup

Pada rumah tadi, semua sisi mendatar yang "ke kiri" jumlahnya sama dengan sisi atas (5 + 3 = 8), dan semua sisi tegak yang "ke bawah" sama dengan sisi kiri (3 + 4 = 7). Jadi kelilingnya sama dengan keliling persegi panjang 8 m × 7 m yang melingkupinya:

Keliling = (2 × 8) + (2 × 7) = **30 m**.

Cara ini hanya berlaku bila tepinya seperti tangga, tanpa **lekukan** ke dalam.

## Bila ada lekukan

Sebuah bangun berbentuk huruf U. Mulai dari pojok kiri atas: ke kanan 2 m, ke bawah 2 m, ke kanan 3 m, ke atas 2 m, ke kanan 2 m, ke bawah 5 m, ke kiri 7 m, dan naik 5 m.

Keliling = 2 + 2 + 3 + 2 + 2 + 5 + 7 + 5 = **28 m**.

Persegi panjang pelingkupnya 7 m × 5 m, kelilingnya 24 m. Hasil itu kurang 4 m, karena dua dinding lekukan (masing-masing 2 m) tidak ikut terhitung. Bila ada lekukan, jumlahkan semua sisi satu per satu.

## Rangkuman Bab 4

- **Keliling** adalah jumlah panjang semua sisi terluar, dilewati tepat satu kali.
- Segitiga sama sisi: 3 × sisi. Segitiga sama kaki: (2 × kaki) + alas.
- Persegi panjang, jajargenjang, layang-layang: (2 × sisi satu) + (2 × sisi lain).
- Persegi, belah ketupat: 4 × sisi. Segi banyak beraturan: banyak sisi × panjang sisi.
- Trapesium, segi empat sembarang, dan bangun lain yang sisinya berbeda: jumlahkan semua sisinya.
- Bangun gabungan: hanya sisi terluar; cari sisi yang belum tertulis dari sisi di seberangnya.

{SUMBER}"""),
]

for _p in PELAJARAN:
    cek(3 <= _p["isi"].count("\n## ") + _p["isi"].startswith("## ") <= 6, f"lesson {_p['no']}: 3-6 pages")
    cek(_p["isi"].rstrip().endswith(SUMBER), f"lesson {_p['no']}: attribution last")
cek("ke kanan 8 m, ke bawah 3 m, ke kiri 5 m, ke bawah 4 m, ke kiri 3 m, lalu naik 7 m" in PELAJARAN[5]["isi"])
cek("ke kanan 2 m, ke bawah 2 m, ke kanan 3 m, ke atas 2 m, ke kanan 2 m, ke bawah 5 m, ke kiri 7 m, dan naik 5 m" in PELAJARAN[5]["isi"])
cek(2 * (8 + 3) == 22 and 2 * (3 + 4) == 14 and 8 - 3 == 5 and 7 - 3 == 4 and 2 * 8 + 2 * 7 == 30)
cek(10 + 6 + 5 + 5 == 26 and 56 // 8 == 7 and 27 // 3 == 9)

# ── Misconceptions. 01 and 07 are the book's own (p. 166: keliling gabungan as the sum of the
# parts' keliling; the bounding rectangle used where it does not hold); 02, 03 and 05 are the
# slips its teacher tables anticipate (pp. 130, 137, 141, 161); the rest come from the reasoning
# behind this chapter's distractors.
MISKONSEPSI = {
    "SD5-M-B4-01": ("Sisi dalam ikut dihitung",
                    "Keliling bangun gabungan dianggap sama dengan jumlah keliling bangun-bangun penyusunnya, sehingga sisi yang ada di dalam ikut dihitung.",
                    "Minta murid menelusuri tepi terluar dengan jari dan mencentang setiap sisi yang dilewati; sisi yang tidak tersentuh jari tidak termasuk keliling."),
    "SD5-M-B4-02": ("Ada sisi yang terlewat",
                    "Hanya sisi yang tertulis angkanya yang dijumlahkan, misalnya keliling persegi panjang dianggap panjang + lebar.",
                    "Hitung banyak sisi bangun lebih dulu, lalu pastikan banyak bilangan yang dijumlahkan sama dengan banyak sisinya."),
    "SD5-M-B4-03": ("Keliling tertukar dengan luas",
                    "Panjang sisi dikalikan (misalnya panjang × lebar), padahal yang ditanyakan panjang tepi.",
                    "Bedakan dengan pertanyaan: apakah yang diukur tepinya (pagar, bingkai, pita) atau yang menutup bagian dalamnya (ubin, cat lantai)?"),
    "SD5-M-B4-04": ("Pengali tidak sesuai banyak sisi",
                    "Panjang sisi dikalikan dengan bilangan yang bukan banyak sisinya yang sama panjang, misalnya segi enam dikali 5 atau persegi dikali 2.",
                    "Sebut nama bangunnya dan hitung sisinya bersama; nama segi-n memberi tahu pengalinya."),
    "SD5-M-B4-05": ("Sisi kembar segitiga sama kaki tertukar",
                    "Pada segitiga sama kaki, alas yang dikalikan 2, bukan kakinya.",
                    "Tandai dua sisi yang sama panjang dengan garis kecil; yang bertanda itulah yang dikali 2."),
    "SD5-M-B4-06": ("Semua sisi dianggap sama",
                    "Bangun yang sisinya berbeda panjang dihitung seolah-olah beraturan, dengan mengalikan satu sisi dengan banyak sisi.",
                    "Periksa dulu apakah semua sisi sama panjang; bila tidak, jumlahkan sisi satu per satu."),
    "SD5-M-B4-07": ("Persegi panjang pelingkup dipakai pada lekukan",
                    "Keliling bangun yang mempunyai lekukan ke dalam dihitung dengan keliling persegi panjang pelingkupnya, sehingga dinding lekukan tidak terhitung.",
                    "Tunjukkan dua dinding lekukan yang tidak ada pada persegi panjang pelingkup, lalu jumlahkan semua sisi satu per satu."),
    "SD5-M-B4-08": ("Sisi tak tertulis tidak dicari",
                    "Pada bangun gabungan, sisi yang panjangnya tidak tertulis diabaikan, padahal dapat dicari dari sisi di seberangnya.",
                    "Minta murid menandai setiap sisi tanpa angka dan mencari panjangnya dari sisi seberang (atas = semua sisi mendatar di bawahnya)."),
    "SD5-M-B4-09": ("Jawaban bukan yang ditanyakan",
                    "Hasil satu langkah diberikan sebagai jawaban akhir, atau ada syarat soal yang terlewat (banyak putaran, pintu gerbang, banyak bingkai).",
                    "Minta murid menggarisbawahi yang ditanyakan dan setiap syarat, lalu mencentang syarat itu setelah dipakai."),
    "SD5-M-B4-10": ("Sisi dilewati lebih dari sekali",
                    "Keliling dianggap sama dengan rute bolak-balik atau dihitung dua kali, padahal setiap sisi dilewati tepat satu kali.",
                    "Ulangi arti keliling dengan berjalan menyusuri tepi meja atau lapangan: mulai dan berhenti di titik yang sama, tiap sisi satu kali."),
    "SD5-M-B4-11": ("Operasi terbalik keliru",
                    "Saat mencari panjang sisi dari keliling, keliling dikalikan atau dikurangi, bukan dibagi dengan pengalinya.",
                    "Tulis rumusnya (keliling = 5 × sisi), lalu tanyakan: 5 dikali berapa sama dengan kelilingnya? Periksa jawaban dengan mengalikannya kembali."),
    "SD5-M-B4-12": ("Lintasan tertutup dihitung seperti garis",
                    "Banyak titik di sekeliling bangun dihitung seperti pada garis lurus (ditambah satu), padahal titik awal dan akhir lintasan tertutup sama.",
                    "Gambar titik-titiknya di sekeliling persegi panjang kecil dan hitung bersama; titik terakhir kembali ke titik pertama."),
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
    angka = [re.match(r"\d+(?:\.\d{3})*", t) for t, *_ in pilihan]
    if all(angka):   # a question that asks for a value: no distractor has the answer's value
        nilai = [int(m[0].replace(".", "")) for m in angka]
        cek(len(set(nilai)) == 4, f"{ref}: a distractor has the answer's value")
    i = "ABCD".index(jawab)
    S.append(dict(ref=ref, pel=pel, tanya=tanya, pilihan=pilihan[1:i + 1] + [pilihan[0]] + pilihan[i + 1:],
                  guna=guna, sulit=sulit, petunjuk=petunjuk))


# ── Pemetaan awal (pre-test): what keliling means, a triangle, a square, and when keliling is asked.
cek(2 * 30 + 2 * 20 == 100 and 30 + 20 == 50 and 30 * 20 == 600 and 2 * 100 == 200)
soal("PA1", 1, "Taman berbentuk persegi panjang dengan panjang 30 m dan lebar 20 m. Rani berjalan mengelilingi taman itu satu kali. Berapa jauh ia berjalan?", "C", [
    ("100 m", True, "Benar. 30 + 20 + 30 + 20 = 100 m.", ""),
    ("50 m", False, "Hanya panjang dan lebar yang dijumlahkan; dua sisi lainnya terlewat.", "SD5-M-B4-02"),
    ("600 m", False, "Panjang dan lebar dikalikan. Itu luas taman, bukan panjang jalan di tepinya.", "SD5-M-B4-03"),
    ("200 m", False, "Keliling dihitung dua kali. Rani berjalan satu kali putaran.", "SD5-M-B4-10"),
], guna="Pemetaan awal")
cek(7 + 9 + 11 == 27 and 7 + 11 == 18 and 3 * 7 == 21 and 3 * 11 == 33)
soal("PA2", 2, "Sebuah segitiga mempunyai sisi 7 cm, 9 cm, dan 11 cm. Berapa kelilingnya?", "A", [
    ("27 cm", True, "Benar. 7 + 9 + 11 = 27 cm.", ""),
    ("18 cm", False, "Hanya dua sisi yang dijumlahkan (7 + 11); sisi 9 cm terlewat.", "SD5-M-B4-02"),
    ("21 cm", False, "Sisi 7 cm dikali 3, seolah ketiga sisinya sama panjang. Sisinya berbeda, jadi dijumlahkan satu per satu.", "SD5-M-B4-06"),
    ("33 cm", False, "Sisi 11 cm dikali 3, seolah segitiga sama sisi. Sisinya berbeda panjang.", "SD5-M-B4-06"),
], guna="Pemetaan awal")
cek(4 * 6 == 24 and 6 * 6 == 36 and 2 * 6 == 12 and 3 * 6 == 18)
soal("PA3", 4, "Sebuah persegi mempunyai sisi 6 cm. Berapa kelilingnya?", "D", [
    ("24 cm", True, "Benar. Persegi mempunyai 4 sisi sama panjang: 4 × 6 = 24 cm.", ""),
    ("36 cm", False, "Sisi dikali sisi (6 × 6). Itu luas persegi, bukan kelilingnya.", "SD5-M-B4-03"),
    ("12 cm", False, "Sisi dikali 2. Persegi mempunyai 4 sisi, jadi dikali 4.", "SD5-M-B4-04"),
    ("18 cm", False, "Sisi dikali 3, seperti segitiga sama sisi. Persegi mempunyai 4 sisi.", "SD5-M-B4-04"),
], guna="Pemetaan awal")
soal("PA4", 1, "Manakah yang dihitung dengan keliling?", "B", [
    ("Panjang pita untuk menghias tepi bingkai foto", True, "Benar. Pita dipasang di sepanjang tepi, jadi yang dihitung keliling bingkai.", ""),
    ("Banyak ubin untuk menutup lantai kelas", False, "Ubin menutup seluruh bagian dalam lantai. Itu luas, bukan keliling.", "SD5-M-B4-03"),
    ("Banyak cat untuk mengecat seluruh permukaan meja", False, "Cat menutup seluruh permukaan meja. Itu luas, bukan keliling.", "SD5-M-B4-03"),
    ("Panjang tali dari ujung ke ujung satu sisi lapangan", False, "Itu hanya satu sisi. Keliling menyusuri semua sisi sampai kembali ke titik awal.", "SD5-M-B4-02"),
], guna="Pemetaan awal")

# ── Cek penguasaan (post-test): fresh numbers and situations, every subbab.
cek(2 * 9 + 5 == 23 and 2 * 5 + 9 == 19 and 9 + 5 == 14 and 3 * 9 == 27)
soal("PB1", 2, "Sebuah segitiga sama kaki mempunyai kaki 9 cm dan alas 5 cm. Berapa kelilingnya?", "B", [
    ("23 cm", True, "Benar. Dua kaki 2 × 9 = 18, ditambah alas 5: 18 + 5 = 23 cm.", ""),
    ("19 cm", False, "Alas yang dikali 2 (2 × 5 + 9). Yang ada dua adalah kakinya.", "SD5-M-B4-05"),
    ("14 cm", False, "Hanya satu kaki dan alas yang dijumlahkan; kaki yang lain terlewat.", "SD5-M-B4-02"),
    ("27 cm", False, "Kaki dikali 3, seolah segitiga sama sisi. Alasnya berbeda panjang.", "SD5-M-B4-06"),
], guna="Cek penguasaan", sulit="Sedang")
cek(2 * 16 + 2 * 9 == 50 and 16 + 9 == 25 and 16 * 9 == 144 and 2 * 50 == 100)
soal("PB2", 3, "Papan tulis berbentuk persegi panjang dengan panjang 16 dm dan lebar 9 dm. Berapa keliling papan tulis itu?", "D", [
    ("50 dm", True, "Benar. (2 × 16) + (2 × 9) = 32 + 18 = 50 dm.", ""),
    ("25 dm", False, "Hanya panjang dan lebar yang dijumlahkan; dua sisi yang berhadapan terlewat.", "SD5-M-B4-02"),
    ("144 dm", False, "Panjang dikali lebar. Itu luas papan tulis, bukan kelilingnya.", "SD5-M-B4-03"),
    ("100 dm", False, "Keliling dihitung dua kali: (2 × 16) + (2 × 9) sudah memuat keempat sisi.", "SD5-M-B4-10"),
], guna="Cek penguasaan")
cek(2 * 12 + 2 * 7 == 38 and 12 + 7 == 19 and 12 * 7 == 84 and 4 * 12 == 48)
soal("PB3", 3, "Sebuah jajargenjang mempunyai sisi alas 12 cm dan sisi samping 7 cm. Berapa kelilingnya?", "A", [
    ("38 cm", True, "Benar. Sisi yang berhadapan sama panjang: (2 × 12) + (2 × 7) = 24 + 14 = 38 cm.", ""),
    ("19 cm", False, "Hanya sisi alas dan sisi samping yang dijumlahkan; dua sisi di seberangnya terlewat.", "SD5-M-B4-02"),
    ("84 cm", False, "Kedua sisi dikalikan. Keliling adalah jumlah panjang sisinya.", "SD5-M-B4-03"),
    ("48 cm", False, "Sisi alas dikali 4, seolah keempat sisinya sama. Sisi samping lebih pendek.", "SD5-M-B4-06"),
], guna="Cek penguasaan", sulit="Sedang")
cek(14 + 8 + 5 + 5 == 32 and 14 + 8 + 5 == 27 and 4 * 14 == 56 and 14 + 8 == 22)
soal("PB4", 4, "Sebuah trapesium mempunyai sisi sejajar 14 cm dan 8 cm. Kedua sisi miringnya sama panjang, yaitu 5 cm. Berapa keliling trapesium itu?", "C", [
    ("32 cm", True, "Benar. 14 + 8 + 5 + 5 = 32 cm.", ""),
    ("27 cm", False, "Sisi miring hanya dihitung satu. Ada dua sisi miring yang masing-masing 5 cm.", "SD5-M-B4-02"),
    ("56 cm", False, "Sisi 14 cm dikali 4, seolah keempat sisinya sama. Sisi trapesium berbeda-beda.", "SD5-M-B4-06"),
    ("22 cm", False, "Hanya dua sisi sejajar yang dijumlahkan; kedua sisi miring terlewat.", "SD5-M-B4-02"),
], guna="Cek penguasaan", sulit="Sedang")
cek(6 * 7 == 42 and 5 * 7 == 35 and 8 * 7 == 56 and 7 * 7 == 49)
soal("PB5", 5, "Sebuah ubin berbentuk segi enam beraturan dengan panjang sisi 7 cm. Berapa keliling ubin itu?", "D", [
    ("42 cm", True, "Benar. Segi enam beraturan mempunyai 6 sisi sama panjang: 6 × 7 = 42 cm.", ""),
    ("35 cm", False, "Dikali 5, seperti segi lima. Segi enam mempunyai 6 sisi.", "SD5-M-B4-04"),
    ("56 cm", False, "Dikali 8, seperti segi delapan. Segi enam mempunyai 6 sisi.", "SD5-M-B4-04"),
    ("49 cm", False, "Sisi dikali dirinya sendiri (7 × 7). Pengalinya adalah banyak sisi, yaitu 6.", "SD5-M-B4-04"),
], guna="Cek penguasaan", sulit="Sedang")
cek(45 // 5 == 9 and 45 % 5 == 0 and 45 * 5 == 225 and 45 - 5 == 40 and 45 // 3 == 15)
soal("PB6", 5, "Keliling sebuah segi lima beraturan 45 cm. Berapa panjang setiap sisinya?", "B", [
    ("9 cm", True, "Benar. Keliling = 5 × sisi, jadi sisi = 45 : 5 = 9 cm. Periksa: 5 × 9 = 45.", ""),
    ("225 cm", False, "Keliling dikali 5. Satu sisi pasti lebih pendek dari kelilingnya, jadi dibagi 5.", "SD5-M-B4-11"),
    ("40 cm", False, "Keliling dikurangi 5. Keliling = 5 × sisi, jadi sisi didapat dengan membagi.", "SD5-M-B4-11"),
    ("15 cm", False, "Dibagi 3, seperti segitiga sama sisi. Segi lima mempunyai 5 sisi.", "SD5-M-B4-04"),
], guna="Cek penguasaan", sulit="Sedang")
L_POST = [("kanan", 10), ("bawah", 4), ("kiri", 6), ("bawah", 5), ("kiri", 4), ("atas", 9)]
cek(jalan(L_POST) == 38 == pelingkup(L_POST) and 10 + 4 + 6 + 5 + 4 == 29 and luas_ortogonal(L_POST) == 60)
cek(2 * (10 + 4) + 2 * (4 + 5) == 46)
soal("PB7", 6, "Kebun Pak Tani berbentuk huruf L. Mulai dari pojok kiri atas, tepinya: ke kanan 10 m, ke bawah 4 m, ke kiri 6 m, ke bawah 5 m, ke kiri 4 m, lalu naik lurus kembali ke titik awal. Berapa keliling kebun itu?", "C", [
    ("38 m", True, "Benar. Sisi terakhir naik 4 + 5 = 9 m, jadi 10 + 4 + 6 + 5 + 4 + 9 = 38 m.", ""),
    ("29 m", False, "Sisi terakhir yang naik kembali tidak dihitung. Panjangnya 4 + 5 = 9 m.", "SD5-M-B4-08"),
    ("46 m", False, "Keliling dua persegi panjang penyusunnya (28 + 18) dijumlahkan; sisi di dalam kebun ikut terhitung.", "SD5-M-B4-01"),
    ("60 m", False, "Itu luas kebun (40 + 20). Keliling adalah panjang tepinya.", "SD5-M-B4-03"),
], guna="Cek penguasaan", sulit="Sedang")
cek(2 * 25 + 2 * 12 - 3 == 71 and 2 * 25 + 2 * 12 == 74 and 25 * 12 - 3 == 297 and 25 + 12 - 3 == 34)
soal("PB8", 3, "Kebun berbentuk persegi panjang, 25 m × 12 m, akan dipagari di sekelilingnya. Bagian selebar 3 m dibiarkan terbuka untuk pintu. Berapa meter pagar yang diperlukan?", "A", [
    ("71 m", True, "Benar. Keliling (2 × 25) + (2 × 12) = 74 m, dikurangi pintu 3 m = 71 m.", ""),
    ("74 m", False, "Itu keliling seluruh kebun. Pintu selebar 3 m tidak dipagari.", "SD5-M-B4-09"),
    ("297 m", False, "Panjang dikali lebar (luas) lalu dikurangi 3. Pagar mengikuti tepi kebun.", "SD5-M-B4-03"),
    ("34 m", False, "Hanya panjang dan lebar yang dijumlahkan (25 + 12 − 3); dua sisi lainnya terlewat.", "SD5-M-B4-02"),
], guna="Cek penguasaan", sulit="Sulit")

# ── Latihan (practice), by lesson, from direct use toward a little more reasoning.
cek(2 * (2 * 60 + 2 * 40) == 400 and 2 * 60 + 2 * 40 == 200 and 60 + 40 == 100 and 2 * 60 * 40 == 4_800)
soal("LT1", 1, "Dodi berlari mengelilingi lapangan yang panjangnya 60 m dan lebarnya 40 m sebanyak 2 kali. Berapa jauh Dodi berlari?", "B", [
    ("400 m", True, "Benar. Satu putaran 60 + 40 + 60 + 40 = 200 m, jadi 2 putaran 400 m.", ""),
    ("200 m", False, "Itu satu putaran. Dodi berlari 2 kali.", "SD5-M-B4-09"),
    ("100 m", False, "Hanya panjang dan lebar yang dijumlahkan, dan hanya untuk satu putaran.", "SD5-M-B4-02"),
    ("4.800 m", False, "Panjang dikali lebar (luas), lalu dikali 2. Berlari mengelilingi berarti menjumlahkan sisi-sisinya.", "SD5-M-B4-03"),
], sulit="Sedang")
soal("LT2", 1, "Rute manakah yang panjangnya sama dengan keliling lapangan?", "D", [
    ("Menyusuri semua tepi satu kali sampai kembali ke awal", True, "Benar. Keliling melewati setiap sisi tepat satu kali dan kembali ke titik awal.", ""),
    ("Berlari bolak-balik di sepanjang satu sisi lapangan", False, "Bolak-balik di satu sisi melewati sisi yang sama berulang kali; sisi lainnya tidak dilewati.", "SD5-M-B4-10"),
    ("Berlari melintasi tengah lapangan dari sudut ke sudut", False, "Bagian tengah bukan tepi lapangan. Keliling hanya menyusuri tepinya.", "SD5-M-B4-01"),
    ("Menyusuri dua sisi lapangan, lalu berhenti", False, "Baru dua sisi yang dilewati. Keliling menyusuri semua sisi sampai kembali ke titik awal.", "SD5-M-B4-02"),
])
cek(8 + 12 + 15 == 35 and 8 + 12 == 20 and 3 * 8 == 24 and 3 * 15 == 45)
soal("LT3", 2, "Sebuah segitiga sembarang mempunyai sisi 8 cm, 12 cm, dan 15 cm. Berapa kelilingnya?", "A", [
    ("35 cm", True, "Benar. 8 + 12 + 15 = 35 cm.", ""),
    ("20 cm", False, "Hanya dua sisi yang dijumlahkan; sisi 15 cm terlewat.", "SD5-M-B4-02"),
    ("24 cm", False, "Sisi 8 cm dikali 3, seolah ketiga sisinya sama. Pada segitiga sembarang, sisinya dijumlahkan.", "SD5-M-B4-06"),
    ("45 cm", False, "Sisi 15 cm dikali 3, seolah ketiga sisinya sama. Sisinya berbeda panjang.", "SD5-M-B4-06"),
])
cek(3 * 11 == 33 and 2 * 11 == 22 and 11 * 11 == 121 and 4 * 11 == 44)
soal("LT4", 2, "Sebuah rambu lalu lintas berbentuk segitiga sama sisi dengan sisi 11 dm. Berapa kelilingnya?", "C", [
    ("33 dm", True, "Benar. Ketiga sisinya sama: 3 × 11 = 33 dm.", ""),
    ("22 dm", False, "Dikali 2. Segitiga mempunyai 3 sisi.", "SD5-M-B4-04"),
    ("121 dm", False, "Sisi dikali dirinya sendiri (11 × 11). Pengalinya banyak sisi, yaitu 3.", "SD5-M-B4-04"),
    ("44 dm", False, "Dikali 4, seperti persegi. Segitiga mempunyai 3 sisi.", "SD5-M-B4-04"),
])
cek((30 - 8) // 2 == 11 and 2 * 11 + 8 == 30 and 30 - 8 == 22 and 30 // 3 == 10 and 30 // 2 == 15)
soal("LT5", 2, "Keliling sebuah segitiga sama kaki 30 cm dan alasnya 8 cm. Berapa panjang setiap kakinya?", "B", [
    ("11 cm", True, "Benar. Dua kaki = 30 − 8 = 22 cm, jadi satu kaki = 22 : 2 = 11 cm. Periksa: 11 + 11 + 8 = 30.", ""),
    ("22 cm", False, "22 cm adalah panjang kedua kaki bersama, hasil langkah pertama. Satu kaki = 22 : 2.", "SD5-M-B4-09"),
    ("10 cm", False, "Keliling dibagi 3, seolah ketiga sisinya sama. Alasnya berbeda, 8 cm.", "SD5-M-B4-06"),
    ("15 cm", False, "Keliling dibagi 2 tanpa mengurangi alasnya lebih dahulu.", "SD5-M-B4-02"),
], sulit="Sulit", petunjuk="Kurangi keliling dengan alasnya dahulu. Sisanya adalah panjang dua kaki.")
cek(2 * 18 + 2 * 7 == 50 and 18 + 7 == 25 and 18 * 7 == 126 and 2 * 18 + 7 == 43)
soal("LT6", 3, "Sebuah meja berbentuk persegi panjang dengan panjang 18 dm dan lebar 7 dm. Berapa keliling meja itu?", "C", [
    ("50 dm", True, "Benar. (2 × 18) + (2 × 7) = 36 + 14 = 50 dm.", ""),
    ("25 dm", False, "Hanya panjang dan lebar yang dijumlahkan; dua sisi di seberangnya terlewat.", "SD5-M-B4-02"),
    ("126 dm", False, "Panjang dikali lebar. Itu luas meja.", "SD5-M-B4-03"),
    ("43 dm", False, "Panjang dikali 2, tetapi lebar hanya dihitung sekali. Ada dua sisi lebar.", "SD5-M-B4-02"),
])
cek(2 * 5 + 2 * 9 == 28 and 5 + 9 == 14 and 5 * 9 == 45 and 4 * 5 == 20)
soal("LT7", 3, "Sebuah layang-layang mempunyai sisi pendek 5 dm dan sisi panjang 9 dm. Berapa panjang bingkai bambu yang mengelilinginya?", "A", [
    ("28 dm", True, "Benar. Ada dua sisi pendek dan dua sisi panjang: (2 × 5) + (2 × 9) = 10 + 18 = 28 dm.", ""),
    ("14 dm", False, "Hanya satu sisi pendek dan satu sisi panjang yang dijumlahkan.", "SD5-M-B4-02"),
    ("45 dm", False, "Kedua sisi dikalikan. Keliling adalah jumlah sisinya.", "SD5-M-B4-03"),
    ("20 dm", False, "Sisi pendek dikali 4, seolah keempat sisinya sama. Dua sisinya lebih panjang.", "SD5-M-B4-06"),
])
cek((40 - 2 * 12) // 2 == 8 and 2 * 12 + 2 * 8 == 40 and 40 - 12 == 28 and 40 - 24 == 16 and 40 // 4 == 10)
soal("LT8", 3, "Keliling sebuah persegi panjang 40 cm dan panjangnya 12 cm. Berapa lebarnya?", "D", [
    ("8 cm", True, "Benar. Dua panjang = 24 cm, jadi dua lebar = 40 − 24 = 16 cm, dan satu lebar = 8 cm.", ""),
    ("28 cm", False, "Keliling hanya dikurangi satu panjang. Persegi panjang mempunyai dua sisi panjang.", "SD5-M-B4-02"),
    ("16 cm", False, "16 cm adalah panjang kedua lebar bersama. Satu lebar = 16 : 2.", "SD5-M-B4-09"),
    ("10 cm", False, "Keliling dibagi 4, seolah persegi. Panjang dan lebarnya berbeda.", "SD5-M-B4-06"),
], sulit="Sulit")
cek(4 * 13 == 52 and 2 * 13 == 26 and 13 * 13 == 169 and 3 * 13 == 39)
soal("LT9", 4, "Sebuah persegi mempunyai sisi 13 cm. Berapa kelilingnya?", "B", [
    ("52 cm", True, "Benar. 4 × 13 = 52 cm.", ""),
    ("26 cm", False, "Dikali 2. Persegi mempunyai 4 sisi sama panjang.", "SD5-M-B4-04"),
    ("169 cm", False, "Sisi dikali sisi. Itu luas persegi.", "SD5-M-B4-03"),
    ("39 cm", False, "Dikali 3, seperti segitiga sama sisi. Persegi mempunyai 4 sisi.", "SD5-M-B4-04"),
])
cek(4 * 45 == 180 and 2 * 45 == 90 and 45 * 45 == 2_025 and 3 * 45 == 135)
soal("LT10", 4, "Taplak meja berbentuk belah ketupat dengan sisi 45 cm. Ibu ingin memasang renda di seluruh tepinya. Berapa panjang renda yang diperlukan?", "C", [
    ("180 cm", True, "Benar. Keempat sisi belah ketupat sama panjang: 4 × 45 = 180 cm.", ""),
    ("90 cm", False, "Dikali 2. Belah ketupat mempunyai 4 sisi sama panjang.", "SD5-M-B4-04"),
    ("2.025 cm", False, "Sisi dikali sisi. Renda dipasang di tepi, jadi yang dihitung keliling.", "SD5-M-B4-03"),
    ("135 cm", False, "Dikali 3; ada satu sisi yang terlewat. Belah ketupat mempunyai 4 sisi.", "SD5-M-B4-04"),
], sulit="Sedang")
cek(6 + 9 + 4 + 11 == 30 and 4 * 6 == 24 and 4 * 11 == 44 and 6 + 9 + 4 == 19)
soal("LT11", 4, "Sebuah segi empat sembarang mempunyai sisi 6 cm, 9 cm, 4 cm, dan 11 cm. Berapa kelilingnya?", "D", [
    ("30 cm", True, "Benar. Sisinya berbeda-beda, jadi dijumlahkan: 6 + 9 + 4 + 11 = 30 cm.", ""),
    ("24 cm", False, "Sisi pertama dikali 4, seolah persegi. Sisi-sisinya berbeda.", "SD5-M-B4-06"),
    ("44 cm", False, "Sisi terpanjang dikali 4. Sisi-sisinya berbeda, jadi dijumlahkan satu per satu.", "SD5-M-B4-06"),
    ("19 cm", False, "Sisi 11 cm terlewat. Segi empat mempunyai 4 sisi.", "SD5-M-B4-02"),
])
cek(8 * 6 == 48 and 6 * 6 == 36 and 5 * 6 == 30 and 4 * 6 == 24)
soal("LT12", 5, "Sebuah rambu berhenti berbentuk segi delapan beraturan dengan sisi 6 dm. Berapa kelilingnya?", "A", [
    ("48 dm", True, "Benar. Segi delapan beraturan mempunyai 8 sisi: 8 × 6 = 48 dm.", ""),
    ("36 dm", False, "Dikali 6, seperti segi enam. Segi delapan mempunyai 8 sisi.", "SD5-M-B4-04"),
    ("30 dm", False, "Dikali 5, seperti segi lima. Segi delapan mempunyai 8 sisi.", "SD5-M-B4-04"),
    ("24 dm", False, "Dikali 4, seperti persegi. Segi delapan mempunyai 8 sisi.", "SD5-M-B4-04"),
])
cek(54 // 6 == 9 and 54 % 6 == 0 and 54 * 6 == 324 and 54 - 6 == 48 and 54 // 2 == 27)
soal("LT13", 5, "Keliling sebuah segi enam beraturan 54 cm. Berapa panjang setiap sisinya?", "C", [
    ("9 cm", True, "Benar. Sisi = 54 : 6 = 9 cm. Periksa: 6 × 9 = 54.", ""),
    ("324 cm", False, "Keliling dikali 6. Satu sisi pasti lebih pendek dari keliling, jadi dibagi.", "SD5-M-B4-11"),
    ("48 cm", False, "Keliling dikurangi 6. Keliling = 6 × sisi, jadi sisi didapat dengan membagi.", "SD5-M-B4-11"),
    ("27 cm", False, "Dibagi 2. Segi enam mempunyai 6 sisi, jadi dibagi 6.", "SD5-M-B4-04"),
], sulit="Sedang")
cek(3 * 6 + 2 * 6 == 30 and 4 * 6 + 3 * 6 == 42 and 30 + 6 == 36 and 4 * 6 == 24)
soal("LT14", 6, "Gambar rumah dibuat dari sebuah persegi bersisi 6 cm dengan segitiga sama sisi bersisi 6 cm di atasnya sebagai atap. Berapa keliling gambar rumah itu?", "B", [
    ("30 cm", True, "Benar. Tepi terluarnya 3 sisi persegi dan 2 sisi atap: 5 × 6 = 30 cm. Sisi di antara dinding dan atap ada di dalam.", ""),
    ("42 cm", False, "Keliling persegi (24) dan keliling segitiga (18) dijumlahkan; sisi di antara keduanya terhitung dua kali.", "SD5-M-B4-01"),
    ("36 cm", False, "Sisi di antara dinding dan atap ikut dihitung. Sisi itu ada di dalam gambar, bukan di tepi.", "SD5-M-B4-01"),
    ("24 cm", False, "Hanya keliling persegi yang dihitung; dua sisi atap terlewat.", "SD5-M-B4-02"),
], sulit="Sedang")
L_LAT = [("kanan", 7), ("bawah", 3), ("kanan", 5), ("bawah", 6), ("kiri", 12), ("atas", 9)]
cek(jalan(L_LAT) == 42 == pelingkup(L_LAT) and 7 + 3 + 5 + 6 == 21 and 21 + 9 == 30 and luas_ortogonal(L_LAT) == 93)
soal("LT15", 6, "Mulai dari pojok kiri atas, tepi sebuah lantai: ke kanan 7 m, ke bawah 3 m, ke kanan 5 m, ke bawah 6 m, lalu lurus ke kiri dan naik kembali ke titik awal. Berapa keliling lantai itu?", "D", [
    ("42 m", True, "Benar. Sisi bawah 7 + 5 = 12 m dan sisi kiri 3 + 6 = 9 m, jadi 7 + 3 + 5 + 6 + 12 + 9 = 42 m.", ""),
    ("21 m", False, "Dua sisi yang tidak tertulis (bawah dan kiri) tidak dihitung. Panjangnya bisa dicari dari sisi seberangnya.", "SD5-M-B4-08"),
    ("93 m", False, "Itu luas lantai (21 + 72). Keliling adalah panjang tepinya.", "SD5-M-B4-03"),
    ("30 m", False, "Sisi kiri 9 m sudah dicari, tetapi sisi bawah 12 m belum ikut dijumlahkan.", "SD5-M-B4-08"),
], sulit="Sedang")
U_LAT = [("kanan", 3), ("bawah", 3), ("kanan", 4), ("atas", 3), ("kanan", 3), ("bawah", 6), ("kiri", 10), ("atas", 6)]
cek(jalan(U_LAT) == 38 and pelingkup(U_LAT) == 32 and 32 + 3 == 35 and luas_ortogonal(U_LAT) == 48)
soal("LT16", 6, "Sebuah kolam berbentuk huruf U. Mulai dari pojok kiri atas, tepinya: ke kanan 3 m, ke bawah 3 m, ke kanan 4 m, ke atas 3 m, ke kanan 3 m, ke bawah 6 m, ke kiri 10 m, lalu naik 6 m. Berapa keliling kolam itu?", "A", [
    ("38 m", True, "Benar. 3 + 3 + 4 + 3 + 3 + 6 + 10 + 6 = 38 m.", ""),
    ("32 m", False, "Dihitung dengan persegi panjang pelingkup 10 m × 6 m. Kolam ini mempunyai lekukan, jadi dua dinding lekukan (3 m dan 3 m) tidak terhitung.", "SD5-M-B4-07"),
    ("48 m", False, "Itu luas kolam. Keliling adalah panjang tepinya.", "SD5-M-B4-03"),
    ("35 m", False, "Hanya satu dinding lekukan yang ditambahkan ke keliling pelingkup. Lekukan mempunyai dua dinding.", "SD5-M-B4-07"),
], sulit="Sulit")
cek(3 * (2 * 25 + 2 * 18) == 258 and 2 * 25 + 2 * 18 == 86 and 3 * (25 + 18) == 129 and 25 * 18 == 450)
soal("LT17", 3, "Ayah membuat 3 bingkai foto berbentuk persegi panjang, masing-masing 25 cm × 18 cm. Berapa panjang kayu yang diperlukan untuk ketiga bingkai?", "B", [
    ("258 cm", True, "Benar. Satu bingkai (2 × 25) + (2 × 18) = 86 cm, jadi tiga bingkai 3 × 86 = 258 cm.", ""),
    ("86 cm", False, "Itu kayu untuk satu bingkai. Ayah membuat 3 bingkai.", "SD5-M-B4-09"),
    ("129 cm", False, "Setiap bingkai hanya dihitung panjang + lebar; dua sisi lainnya terlewat.", "SD5-M-B4-02"),
    ("450 cm", False, "Panjang dikali lebar (luas satu bingkai). Kayu bingkai mengikuti tepinya.", "SD5-M-B4-03"),
], sulit="Sedang")
cek((2 * 20 + 2 * 15) // 5 == 14 and (2 * 20 + 2 * 15) % 5 == 0 and 14 + 1 == 15 and 2 * 20 + 2 * 15 == 70 and 20 * 15 // 5 == 60)
soal("LT18", 3, "Taman berbentuk persegi panjang, 20 m × 15 m. Di sepanjang tepinya ditanam pohon setiap 5 m, mulai dari satu pojok sampai kembali ke pojok itu. Berapa banyak pohon yang ditanam?", "C", [
    ("14 pohon", True, "Benar. Keliling 70 m, dan 70 : 5 = 14. Pohon terakhir akan jatuh di pojok awal yang sudah ada pohonnya.", ""),
    ("15 pohon", False, "Ditambah satu seperti menanam di sepanjang garis lurus. Pada tepi yang tertutup, titik akhir sama dengan titik awal.", "SD5-M-B4-12"),
    ("70 pohon", False, "70 adalah keliling taman dalam meter, bukan banyak pohon. Pohon ditanam setiap 5 m.", "SD5-M-B4-09"),
    ("60 pohon", False, "Yang dibagi 5 adalah luas taman (300). Pohon ditanam di tepi, jadi yang dibagi keliling.", "SD5-M-B4-03"),
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

# The post-test uses fresh numbers: the side lengths a post-test question works on are not a problem
# a lesson works through nor one of the book's (Uji Kompetensi and pengayaan, pp. 168-174), and no
# post-test answer is one of the book's keys.
SOAL_BUKU = [{100, 50}, {4}, {5, 4}, {3, 5, 6}, {7, 4, 5}, {5}, {6}, {6, 4}, {5, 3}, {2, 4}, {3}, {4, 2, 5, 3},
             {8}, {10}, {12, 16, 20}, {8, 3, 7, 12}, {24, 20, 3, 12}, {12, 20}, {20, 3, 9}]
SOAL_PELAJARAN = [{100, 50}, {4}, {5, 4}, {3, 5, 6}, {5}, {6}, {6, 4}, {27, 3}, {5, 3}, {3, 7}, {3}, {4, 2, 5, 3},
                  {10, 6, 5}, {4}, {56, 8}, {8, 3, 5, 4, 7}, {2, 3, 5, 7}]
KUNCI_BUKU = {300, 16, 19, 14, 15, 18, 12, 24, 20, 80, 72, 46, 64, 82, 48, 94}
for s in POST:
    angka = {int(n) for n in re.findall(r"\d+", s["tanya"])}
    cek(angka not in SOAL_BUKU + SOAL_PELAJARAN, f"{s['ref']}: {sorted(angka)} is worked in a lesson or the book")
    benar = next(t for t, b, _, _ in s["pilihan"] if b)
    cek(int(re.match(r"\d+", benar)[0]) not in KUNCI_BUKU, f"{s['ref']}: the answer {benar} is one of the book's keys")


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
    tulis(os.path.join(here, "SD5-Matematika-Bab4.xlsx"))
    tulis_miskonsepsi(os.path.join(here, "SD5-Matematika-Bab4-miskonsepsi.csv"))
    halaman = sum(p["isi"].count("## ") for p in PELAJARAN)
    print(f"SD5-Matematika-Bab4.xlsx: lessons {len(PELAJARAN)} ({halaman} pages), questions {len(S)} "
          f"(pre {len(PRE)}, post {len(POST)}, practice {len(LAT)}), answers "
          + " ".join(f"{h}={HURUF[h]}" for h in "ABCD"))
    print(f"SD5-Matematika-Bab4-miskonsepsi.csv: {len(MISKONSEPSI)} codes")
    print(f"assertions passed: {CEK[0]}")
