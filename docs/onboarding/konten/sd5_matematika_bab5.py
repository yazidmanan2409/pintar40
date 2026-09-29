# SD Kelas 5, Matematika, Bab 5 "Luas Daerah Bangun Datar", as a PINTAR lesson workbook in the
# D-007 template (sheets Kursus, Bab, Pelajaran, Soal, Pilihan; the column contract is KOLOM in
# src/lib/unggah-kontrak.ts). Built the way Bab 1-4 were (all passed).
#
# Source: Buku Panduan Guru Matematika untuk SD/MI Kelas V (Meita Fitrianawati, Ika Surtiani,
# Ait Istiandaru; Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi, 2022), Bab 5,
# pp. 177-246. Lessons follow subbab A-D; subbab B (seven shapes) is split in three, the way the
# book derives them: persegi panjang and persegi; segitiga and jajargenjang from the persegi
# panjang; trapesium, belah ketupat and layang-layang from those.
#
# The player draws only fraction bars, so shapes are described in words and composite shapes as a
# walk around the edge (as in Bab 4, which the LANA-04 gate asked to keep); `jalan()` checks each
# walk closes, and `luas_ortogonal()` gives its true area.
#
# Text lessons only (D-050). The workbook's "Kode miskonsepsi" column stays empty; the proposed
# codes go to SD5-Matematika-Bab5-miskonsepsi.csv.
#
# Run: python3 docs/onboarding/konten/sd5_matematika_bab5.py
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


ARAH = {"kanan": (1, 0), "kiri": (-1, 0), "bawah": (0, -1), "atas": (0, 1)}


def titik(langkah):
    x = y = 0
    pts = [(0, 0)]
    for a, n in langkah:
        dx, dy = ARAH[a]
        x, y = x + dx * n, y + dy * n
        pts.append((x, y))
    return pts


def jalan(langkah):
    """A walk [(arah, panjang), ...] around a shape: checks it closes, returns its keliling."""
    cek(titik(langkah)[-1] == (0, 0), "the walk closes")
    return sum(n for _, n in langkah)


def luas_ortogonal(langkah):
    """Area inside a walk of horizontal and vertical steps (shoelace formula)."""
    p = titik(langkah)
    return abs(sum(p[i][0] * p[i + 1][1] - p[i + 1][0] * p[i][1] for i in range(len(p) - 1))) // 2


def pelingkup(langkah):
    xs, ys = zip(*titik(langkah))
    return (max(xs) - min(xs)) * (max(ys) - min(ys))


SETENGAH = Fraction(1, 2)


def segitiga(a, t):
    return SETENGAH * a * t


def trapesium(a, b, t):
    return SETENGAH * (a + b) * t


def diagonal(d1, d2):
    return SETENGAH * d1 * d2


def persegi_panjang_terluas(keliling):
    """All whole-number rectangles (persegi included) with this keliling, and the largest area."""
    ukuran = [(p, keliling // 2 - p) for p in range(1, keliling // 2) if p >= keliling // 2 - p]
    return ukuran, max(p * l for p, l in ukuran)


# ── Lesson examples ─────────────────────────────────────────────────────────────
cek(3 * 2 == 6 and 3 * 3 == 9 and 2 * 1 == 2 and 3 * 4 + 1 == 13 and 13 + 2 * 9 + 6 + 2 == 39)   # book pp. 185-194
cek(8 + SETENGAH + SETENGAH == 9)                                                               # book p. 198
cek(2 * 1 == 2 and 5 * 2 == 10 and 4 * 3 == 12 and 2 * 3 == 6)                                   # book p. 203
cek([s * s for s in (1, 2, 3, 4)] == [1, 4, 9, 16])                                              # book p. 206
cek(segitiga(4, 4) == 4 * 2 == 8 and segitiga(5, 4) == 5 * 2 == 10)                             # book pp. 210, 212
cek(4 * 2 == 8)                                                                                  # book p. 216
cek(trapesium(5, 2, 2) == (5 + 2) * 1 == 7)                                                      # book p. 219
cek(diagonal(2, 4) == 2 * 2 == 4 and diagonal(5, 4) == 5 * 2 == 10)                             # book pp. 223, 226
cek(diagonal(5, 4) + segitiga(5, 2) == 15 and 5 * 2 + segitiga(5, 2) == 15)                     # book pp. 230-231
UKURAN60, TERLUAS60 = persegi_panjang_terluas(60)
cek(TERLUAS60 == 225 == 15 * 15 and 20 * 10 == 200 and 25 * 5 == 125 and 18 * 12 == 216)        # book p. 234
# Uji Kompetensi (pp. 236-241)
cek(diagonal(24, 18) == 216 and 16 * 8 + segitiga(16, 12) == 224)
cek(diagonal(5, 4) + trapesium(2, 4, 4) == 22 and segitiga(4, 1) + trapesium(4, 6, 4) == 22)
# BOOK ERROR: item 4 (figure B, p. 236) is 2 x 4 + 3 x 2 + trapesium with parallel sides 1 and 2
# and height 4 = 20 (as p. 237 has it); the rubric on p. 241 works it with sides 3 and 1 and gets 22.
cek(2 * 4 + 3 * 2 + trapesium(1, 2, 4) == 20 and 2 * 4 + 3 * 2 + trapesium(3, 1, 4) == 22)
# BOOK ERROR (p. 243): a path 1 m wide round a 15 m x 6 m pool makes the outside 17 m x 8 m, not
# 16 m x 7 m (the key's figure adds 1 m once to each dimension, i.e. 0.5 m a side). Path 46 m2, not 22.
cek(17 * 8 - 15 * 6 == 46 and 16 * 7 - 15 * 6 == 22)
# lesson examples of PINTAR's own
cek(4 * 3 == 12 and 5 * 4 == 20 and 6 * 6 == 36 and 72 // 8 == 9)
cek(segitiga(10, 6) == 30 and 10 * 6 == 60)
cek(8 * 5 == 40 and 8 * 6 != 40)
cek(trapesium(6, 10, 4) == 32 and diagonal(8, 6) == 24 and diagonal(10, 4) == 20)
L_PELAJARAN = [("kanan", 8), ("bawah", 3), ("kiri", 5), ("bawah", 4), ("kiri", 3), ("atas", 7)]
cek(jalan(L_PELAJARAN) == 30 and luas_ortogonal(L_PELAJARAN) == 8 * 3 + 3 * 4 == 36 == 8 * 7 - 5 * 4)
cek(10 * 6 - 8 * 4 == 28 and 12 * 8 - 10 * 6 == 36)
UKURAN24, TERLUAS24 = persegi_panjang_terluas(24)
cek(UKURAN24 == [(6, 6), (7, 5), (8, 4), (9, 3), (10, 2), (11, 1)] and TERLUAS24 == 36)
cek([p * l for p, l in UKURAN24] == [36, 35, 32, 27, 20, 11])
cek(2 * (2 + 6) == 16 and 2 * (3 + 4) == 14 and 2 * (1 + 12) == 26 and 2 * 6 == 12 == 3 * 4 == 1 * 12)

SUMBER = ("_Diadaptasi dari Buku Panduan Guru Matematika untuk SD/MI Kelas V, Kementerian Pendidikan, "
          "Kebudayaan, Riset, dan Teknologi, 2022, Bab 5._")

KURSUS = {
    "Judul kursus*": "Matematika Kelas 5 · Bab 5: Luas Daerah Bangun Datar",
    "Mata pelajaran*": "Matematika",
    "Jenjang*": "SD",
    "Kelas*": "Kelas 5",
    "Konteks": "Akademik",
}

BAB = [(1, "Luas Daerah Bangun Datar")]

PELAJARAN = [
    dict(no=1, judul="Apakah Luas Daerah Itu?",
         ringkasan="Luas daerah adalah ukuran besar kecilnya daerah yang dibatasi sebuah bangun datar, dihitung dengan banyaknya persegi satuan yang menutupinya.",
         tujuan="Murid dapat mengenali masalah yang melibatkan luas daerah dan menghitung luas dengan persegi satuan.",
         bloom="Memahami",
         isi=f"""## Memasang ubin

Lantai sebuah dapur akan dipasangi ubin berukuran 1 m × 1 m. Ubin dipasang rapat, tidak ada yang renggang atau bertumpuk. Dapurnya 3 m panjang dan 2 m lebar, jadi ada 2 baris, masing-masing 3 ubin: **6 ubin**.

Kamar tidurnya 3 m × 3 m, jadi 3 baris, masing-masing 3 ubin: **9 ubin**.

Makin luas lantainya, makin banyak ubin yang diperlukan. Dua lantai yang sama luas memerlukan ubin yang sama banyak.

## Arti luas daerah

**Luas daerah** adalah ukuran besar kecilnya daerah yang dibatasi oleh sebuah bangun datar. Luas diukur dengan banyaknya **persegi satuan** yang menutupi daerah itu dengan rapat.

- Persegi satuan 1 cm × 1 cm luasnya **1 cm²**, dibaca satu sentimeter persegi.
- Persegi satuan 1 m × 1 m luasnya **1 m²**, dibaca satu meter persegi.

Jadi lantai dapur tadi luasnya 6 m² dan kamar tidurnya 9 m².

Bedakan dengan keliling: keliling mengukur **tepi** (satuannya m atau cm), luas mengukur **daerah di dalamnya** (satuannya m² atau cm²).

## Petak yang tidak utuh

Kadang sebuah bangun tidak menutupi petak secara utuh. Misalnya sebuah bangun menutupi 8 petak utuh dan 2 petak yang masing-masing terisi setengah.

Dua potongan setengah dapat disatukan menjadi satu petak utuh:
Luas = 8 + 1/2 + 1/2 = **9 satuan luas**.

Memindahkan potongan tidak mengubah luasnya, karena tidak ada bagian yang hilang atau bertambah.

Hati-hati: petak yang tidak utuh tetap harus dihitung, tetapi setengah petak bernilai setengah, bukan satu.

{SUMBER}"""),
    dict(no=2, judul="Luas Persegi Panjang dan Persegi",
         ringkasan="Luas persegi panjang adalah panjang dikali lebar; persegi adalah persegi panjang yang panjang dan lebarnya sama.",
         tujuan="Murid dapat menghitung luas persegi panjang dan persegi, serta mencari sisi yang belum diketahui dari luasnya.",
         bloom="Menerapkan",
         isi=f"""## Menemukan pola

Hitung petak pada beberapa persegi panjang:

| Panjang | Lebar | Banyak petak |
|---|---|---|
| 2 | 1 | 2 |
| 5 | 2 | 10 |
| 4 | 3 | 12 |
| 2 | 3 | 6 |

Banyak barisnya sama dengan lebarnya, dan setiap baris berisi petak sebanyak panjangnya. Jadi banyak petak = panjang × lebar.

**Luas persegi panjang = panjang × lebar**

## Contoh

Sebuah papan panjangnya 5 m dan lebarnya 4 m.

1. Ada 4 baris persegi satuan.
2. Setiap baris berisi 5 persegi satuan.
3. Luas = 5 × 4 = **20 m²**.

Bandingkan dengan kelilingnya: 5 + 4 + 5 + 4 = 18 m. Luas dan keliling adalah dua ukuran yang berbeda.

## Persegi

Persegi adalah persegi panjang yang panjang dan lebarnya sama. Keduanya disebut **sisi**.

**Luas persegi = sisi × sisi**

Persegi dengan sisi 6 cm: Luas = 6 × 6 = **36 cm²**.

Jangan menulis 6 × 2 atau 6 × 4. Itu bukan luas: 6 × 4 adalah keliling persegi.

## Mencari sisi dari luas

Luas sebuah persegi panjang 72 m² dan lebarnya 8 m. Berapa panjangnya?

Luas = panjang × 8, jadi panjang = 72 : 8 = **9 m**. Periksa: 9 × 8 = 72.

{SUMBER}"""),
    dict(no=3, judul="Luas Segitiga dan Jajargenjang",
         ringkasan="Segitiga dan jajargenjang dapat dipotong dan disusun ulang menjadi persegi panjang, sehingga luasnya dapat dihitung dari alas dan tingginya.",
         tujuan="Murid dapat menghitung luas segitiga dan jajargenjang dengan alas dan tinggi.",
         bloom="Menerapkan",
         isi=f"""## Jajargenjang menjadi persegi panjang

Sebuah jajargenjang mempunyai alas 8 cm. **Tingginya** adalah jarak tegak lurus dari alas ke sisi di seberangnya, yaitu 5 cm.

Potong segitiga kecil di ujung kiri jajargenjang dan tempelkan di ujung kanan. Hasilnya persegi panjang dengan panjang 8 cm (alasnya) dan lebar 5 cm (tingginya). Tidak ada bagian yang hilang, jadi luasnya sama.

Luas = 8 × 5 = **40 cm²**.

**Luas jajargenjang = alas × tinggi**

## Tinggi, bukan sisi miring

Pada jajargenjang tadi, sisi miringnya 6 cm. Sisi miring **bukan** tinggi: sisi miring lebih panjang daripada jarak tegak lurusnya.

8 × 6 = 48 cm² terlalu besar. Yang dikalikan dengan alas adalah tingginya, 5 cm.

## Segitiga

Sebuah segitiga mempunyai alas 10 cm dan tinggi 6 cm.

Potong segitiga itu setengah tingginya, lalu pindahkan bagian atasnya ke samping. Terbentuk persegi panjang dengan panjang 10 cm (alas) dan lebar 3 cm (setengah tinggi).

Luas = 10 × 3 = **30 cm²**.

**Luas segitiga = 1/2 × alas × tinggi**

## Mengapa setengah?

Dua segitiga yang sama dapat disusun menjadi satu persegi panjang (atau jajargenjang) dengan alas dan tinggi yang sama. Jadi satu segitiga adalah setengahnya.

Segitiga tadi: 10 × 6 = 60 cm² adalah luas **dua** segitiga. Satu segitiga: 60 : 2 = **30 cm²**.

**Coba:** segitiga dengan alas 7 cm dan tinggi 4 cm.
_Periksa: 1/2 × 7 × 4 = 14 cm²._

{SUMBER}"""),
    dict(no=4, judul="Luas Trapesium, Belah Ketupat, dan Layang-Layang",
         ringkasan="Trapesium dihitung dari kedua sisi sejajar dan tingginya; belah ketupat dan layang-layang dari kedua diagonalnya.",
         tujuan="Murid dapat menghitung luas trapesium, belah ketupat, dan layang-layang.",
         bloom="Menerapkan",
         isi=f"""## Trapesium

Sebuah trapesium mempunyai dua sisi sejajar, 6 cm dan 10 cm, dan tinggi 4 cm.

Potong trapesium itu setengah tingginya, lalu putar bagian atasnya dan tempelkan di samping. Terbentuk jajargenjang dengan alas 6 + 10 = 16 cm dan tinggi 2 cm (setengah tinggi).

Luas = 16 × 2 = **32 cm²**.

**Luas trapesium = 1/2 × (sisi sejajar 1 + sisi sejajar 2) × tinggi**

Kedua sisi sejajar **dijumlahkan** dulu, baru dikali tinggi dan dibagi dua.

## Belah ketupat

Belah ketupat mempunyai dua **diagonal**, yaitu garis yang menghubungkan pojok-pojok yang berhadapan. Keduanya berpotongan tegak lurus.

Belah ketupat dengan diagonal 8 cm dan 6 cm dapat dipotong dan disusun menjadi persegi panjang 8 cm × 3 cm.

Luas = 8 × 3 = **24 cm²**, atau 1/2 × 8 × 6 = 24 cm².

**Luas belah ketupat = 1/2 × diagonal 1 × diagonal 2**

## Layang-layang

Diagonal layang-layang juga berpotongan tegak lurus, jadi luasnya dihitung dengan cara yang sama.

Layang-layang dengan diagonal 10 cm dan 4 cm:
Luas = 1/2 × 10 × 4 = **20 cm²**.

**Luas layang-layang = 1/2 × diagonal 1 × diagonal 2**

Untuk kedua bangun ini, yang dipakai adalah **diagonal**, bukan sisi.

## Rangkuman rumus

| Bangun | Luas |
|---|---|
| Persegi panjang | panjang × lebar |
| Persegi | sisi × sisi |
| Jajargenjang | alas × tinggi |
| Segitiga | 1/2 × alas × tinggi |
| Trapesium | 1/2 × (jumlah sisi sejajar) × tinggi |
| Belah ketupat, layang-layang | 1/2 × diagonal 1 × diagonal 2 |

{SUMBER}"""),
    dict(no=5, judul="Luas Bangun Gabungan",
         ringkasan="Luas bangun gabungan dihitung dengan membaginya menjadi bangun-bangun yang dikenal, atau dengan mengurangkan bagian yang tidak termasuk.",
         tujuan="Murid dapat menguraikan bangun gabungan dan menghitung luasnya dengan menjumlahkan atau mengurangkan luas bangun penyusunnya.",
         bloom="Menganalisis",
         isi=f"""## Membagi menjadi bangun yang dikenal

Sebuah denah berbentuk huruf L. Mulai dari pojok kiri atas, tepinya:
ke kanan 8 m, ke bawah 3 m, ke kiri 5 m, ke bawah 4 m, ke kiri 3 m, lalu naik 7 m kembali ke titik awal.

Bagi denah itu dengan garis mendatar:

1. Bagian atas: persegi panjang 8 m × 3 m = 24 m².
2. Bagian bawah: persegi panjang 3 m × 4 m = 12 m².
3. Luas = 24 + 12 = **36 m²**.

Setiap bagian hanya dihitung **sekali**. Bagian bawah lebarnya 3 m, bukan 8 m.

## Cara lain: mengurangkan

Denah L tadi dapat dilihat sebagai persegi panjang besar 8 m × 7 m yang pojok kanan bawahnya (5 m × 4 m) tidak termasuk.

Luas = (8 × 7) − (5 × 4) = 56 − 20 = **36 m²**. Hasilnya sama.

Pilih cara yang paling mudah, lalu periksa dengan cara yang lain.

## Jalan di sekeliling kolam

Sebuah kolam berukuran 8 m × 4 m dikelilingi jalan selebar 1 m. Berapa luas jalannya?

1. Jalan ada di **semua** sisi. Panjang daerah luar = 1 + 8 + 1 = 10 m, lebarnya = 1 + 4 + 1 = 6 m.
2. Luas daerah luar = 10 × 6 = 60 m².
3. Luas jalan = daerah luar − kolam = 60 − 32 = **28 m²**.

Lebar jalan ditambahkan **dua kali** pada setiap ukuran, karena jalannya ada di kiri dan kanan, juga di atas dan bawah.

## Segitiga di atas persegi

Gambar sebuah rumah terdiri atas persegi 6 cm × 6 cm dan atap segitiga dengan alas 6 cm dan tinggi 4 cm.

Luas = (6 × 6) + (1/2 × 6 × 4) = 36 + 12 = **48 cm²**.

{SUMBER}"""),
    dict(no=6, judul="Hubungan Keliling dan Luas",
         ringkasan="Bangun-bangun dengan keliling yang sama dapat mempunyai luas yang berbeda, dan sebaliknya.",
         tujuan="Murid dapat membandingkan keliling dan luas persegi panjang dan menentukan ukuran dengan luas terbesar bila kelilingnya diketahui.",
         bloom="Menganalisis",
         isi=f"""## Kawat 24 cm

Bapak mempunyai kawat 24 cm untuk membuat kerangka persegi panjang. Panjang + lebar harus 24 : 2 = 12 cm. Beberapa kemungkinannya:

| Panjang | Lebar | Keliling | Luas |
|---|---|---|---|
| 11 cm | 1 cm | 24 cm | 11 cm² |
| 10 cm | 2 cm | 24 cm | 20 cm² |
| 8 cm | 4 cm | 24 cm | 32 cm² |
| 7 cm | 5 cm | 24 cm | 35 cm² |
| 6 cm | 6 cm | 24 cm | 36 cm² |

Kelilingnya **sama**, tetapi luasnya **berbeda**.

## Mana yang paling luas?

Dari tabel tadi, luas terbesar adalah 6 cm × 6 cm = **36 cm²**. Makin mendekati persegi, makin besar luasnya. Makin panjang dan kurus, makin kecil luasnya.

Persegi juga termasuk persegi panjang: panjang dan lebarnya kebetulan sama. Jadi 6 cm × 6 cm boleh dipilih.

## Luas sama, keliling berbeda

Tiga persegi panjang mempunyai luas yang sama, 12 cm²:

- 3 cm × 4 cm, kelilingnya 14 cm
- 2 cm × 6 cm, kelilingnya 16 cm
- 1 cm × 12 cm, kelilingnya 26 cm

Luasnya **sama**, tetapi kelilingnya **berbeda**. Jadi dari luas saja kita tidak dapat mengetahui kelilingnya, dan sebaliknya.

## Rangkuman Bab 5

- **Luas** adalah banyaknya persegi satuan yang menutupi daerah; satuannya cm² atau m².
- Persegi panjang: panjang × lebar. Persegi: sisi × sisi.
- Jajargenjang: alas × tinggi. Segitiga: 1/2 × alas × tinggi. Tinggi selalu diukur tegak lurus, bukan sisi miring.
- Trapesium: 1/2 × (jumlah sisi sejajar) × tinggi. Belah ketupat dan layang-layang: 1/2 × diagonal 1 × diagonal 2.
- Bangun gabungan: bagi menjadi bangun yang dikenal, atau kurangkan bagian yang tidak termasuk.
- Keliling yang sama tidak berarti luas yang sama.

{SUMBER}"""),
]

for _p in PELAJARAN:
    cek(3 <= _p["isi"].count("\n## ") + _p["isi"].startswith("## ") <= 6, f"lesson {_p['no']}: 3-6 pages")
    cek(_p["isi"].rstrip().endswith(SUMBER), f"lesson {_p['no']}: attribution last")
cek("ke kanan 8 m, ke bawah 3 m, ke kiri 5 m, ke bawah 4 m, ke kiri 3 m, lalu naik 7 m" in PELAJARAN[4]["isi"])
cek(8 * 7 == 56 and 5 * 4 == 20 and 1 + 8 + 1 == 10 and 1 + 4 + 1 == 6 and 8 * 4 == 32 and 60 - 32 == 28)
cek(6 * 6 + segitiga(6, 4) == 48 and segitiga(7, 4) == 14 and 5 + 4 + 5 + 4 == 18)

# ── Misconceptions. 04, 06 and 07 are the book's own (pp. 199, 227, 231, 235: counting only whole
# squares; the halved measure after rearranging; a square is also a rectangle); 07 is also the
# slip in the book's own pool key (p. 243); the rest come from this chapter's distractors.
MISKONSEPSI = {
    "SD5-M-B5-01": ("Luas tertukar dengan keliling",
                    "Ukuran-ukuran sisi dijumlahkan, sehingga yang dihitung panjang tepi, bukan daerah di dalamnya.",
                    "Tanyakan: apakah yang diukur tepinya (pagar, bingkai) atau yang menutup bagian dalamnya (ubin, karpet, cat)? Untuk luas, bayangkan baris-baris persegi satuan."),
    "SD5-M-B5-02": ("Faktor setengah keliru",
                    "Setengah terlupa pada segitiga, trapesium, belah ketupat, atau layang-layang; atau setengah dipakai dua kali, atau dipakai pada bangun yang tidak memerlukannya.",
                    "Hubungkan setiap rumus dengan bangun asalnya: segitiga adalah setengah persegi panjang, jajargenjang tidak; periksa dengan menggambar dua segitiga menjadi satu persegi panjang."),
    "SD5-M-B5-03": ("Sisi miring dipakai sebagai tinggi",
                    "Pada segitiga atau jajargenjang, sisi miring dikalikan dengan alas, padahal tinggi adalah jarak tegak lurus.",
                    "Tandai tinggi dengan garis tegak lurus dari alas; tunjukkan bahwa sisi miring selalu lebih panjang dari tinggi."),
    "SD5-M-B5-04": ("Petak tidak utuh dihitung keliru",
                    "Hanya petak utuh yang dihitung, atau setiap potongan dihitung sebagai satu petak utuh.",
                    "Pasangkan dua potongan setengah menjadi satu petak utuh dan hitung pasangannya."),
    "SD5-M-B5-05": ("Sisi sejajar trapesium keliru",
                    "Pada trapesium, hanya satu sisi sejajar yang dipakai, atau kedua sisi sejajar dikalikan satu sama lain.",
                    "Ingatkan bahwa trapesium disusun ulang menjadi jajargenjang yang alasnya jumlah kedua sisi sejajar."),
    "SD5-M-B5-06": ("Bagian gabungan dihitung keliru",
                    "Pada bangun gabungan, satu bagian terhitung dua kali, bagian yang tidak termasuk tidak dikurangkan, atau ada bagian yang terlewat.",
                    "Minta murid mewarnai setiap bagian dengan warna berbeda; setiap petak harus berwarna tepat satu kali."),
    "SD5-M-B5-07": ("Lebar jalan ditambahkan sekali",
                    "Pada jalan atau bingkai di sekeliling sebuah bangun, lebarnya hanya ditambahkan sekali pada panjang dan lebar, padahal jalan ada di kedua sisi.",
                    "Gambar jalannya di keempat sisi dan tulis ukuran luar sebagai 1 + panjang + 1."),
    "SD5-M-B5-08": ("Keliling sama dianggap luas sama",
                    "Bangun yang kelilingnya sama dianggap pasti sama luas, atau yang luasnya sama dianggap pasti sama kelilingnya.",
                    "Buat beberapa persegi panjang dengan tali yang sama panjang pada kertas berpetak dan hitung petaknya."),
    "SD5-M-B5-09": ("Persegi dianggap bukan persegi panjang",
                    "Persegi tidak dianggap sebagai persegi panjang, sehingga ukuran persegi tidak dipilih walaupun luasnya terbesar.",
                    "Ulangi ciri persegi panjang: sisi berhadapan sama panjang dan semua sudut siku-siku; persegi memenuhi semuanya."),
    "SD5-M-B5-10": ("Jawaban bukan yang ditanyakan",
                    "Hasil satu bagian atau satu langkah diberikan sebagai jawaban akhir, atau ada bagian soal yang terlewat.",
                    "Minta murid menggarisbawahi yang ditanyakan dan mencentang setiap bagian soal setelah dipakai."),
    "SD5-M-B5-11": ("Satu ukuran dipakai dua kali",
                    "Luas dihitung dengan mengalikan satu ukuran dengan dirinya sendiri atau dengan 2, misalnya lebar × lebar atau sisi × 2.",
                    "Tuliskan nama setiap ukuran (panjang, lebar, sisi) sebelum mengalikan dan periksa bahwa setiap ukuran dipakai sesuai rumusnya."),
    "SD5-M-B5-12": ("Persegi dianggap selalu terbesar",
                    "Persegi dianggap selalu paling besar dalam segala hal, misalnya kelilingnya dianggap terpanjang di antara persegi panjang yang sama luas.",
                    "Bandingkan keliling 6 × 6, 4 × 9, dan 3 × 12; yang paling kurus justru kelilingnya paling panjang."),
    "SD5-M-B5-13": ("Keliling dibagi dua dijadikan sisi",
                    "Setengah keliling (panjang + lebar) dipakai sebagai panjang sisi, sehingga luasnya terlalu besar.",
                    "Ingatkan bahwa setengah keliling adalah panjang dan lebar bersama; bagi lagi menjadi dua bagian sebelum mengalikan."),
    "SD5-M-B5-14": ("Operasi terbalik keliru",
                    "Saat mencari satu ukuran dari luasnya, luas dikurangi atau dikali dengan ukuran yang diketahui, bukan dibagi.",
                    "Tulis rumusnya (luas = panjang × lebar), lalu tanyakan: 9 dikali berapa sama dengan 72? Periksa jawaban dengan mengalikannya kembali."),
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
        cek(len({int(m[0].replace(".", "")) for m in angka}) == 4, f"{ref}: a distractor has the answer's value")
    i = "ABCD".index(jawab)
    S.append(dict(ref=ref, pel=pel, tanya=tanya, pilihan=pilihan[1:i + 1] + [pilihan[0]] + pilihan[i + 1:],
                  guna=guna, sulit=sulit, petunjuk=petunjuk))


# ── Pemetaan awal (pre-test): what luas measures, counting unit squares, a square, a triangle.
soal("PA1", 1, "Manakah yang dihitung dengan luas daerah?", "C", [
    ("Banyak ubin untuk menutup lantai kamar", True, "Tepat. Ubin menutup seluruh daerah lantai, jadi yang dihitung luas.", ""),
    ("Panjang pagar di sekeliling kebun", False, "Pagar mengikuti tepi kebun. Itu keliling, bukan luas.", "SD5-M-B5-01"),
    ("Panjang pita untuk tepi bingkai foto", False, "Pita dipasang di tepi. Itu keliling, bukan luas.", "SD5-M-B5-01"),
    ("Jarak berlari satu kali mengelilingi lapangan", False, "Berlari mengelilingi lapangan menyusuri tepinya. Itu keliling.", "SD5-M-B5-01"),
], guna="Pemetaan awal")
cek(6 * 4 == 24 and 6 + 4 == 10 and 2 * (6 + 4) == 20 and 2 * 6 + 2 * 4 - 4 == 16)
soal("PA2", 1, "Lantai teras dipasangi ubin 1 m × 1 m sebanyak 6 baris, dan setiap baris berisi 4 ubin. Berapa luas lantai teras?", "A", [
    ("24 m²", True, "Benar. 6 baris × 4 ubin = 24 ubin, masing-masing 1 m².", ""),
    ("10 m²", False, "Banyak baris dan banyak ubin setiap baris dijumlahkan. Setiap baris berisi 4 ubin, jadi dikalikan.", "SD5-M-B5-01"),
    ("20 m²", False, "Ini keliling teras, 2 × (6 + 4). Luas menghitung semua ubin di dalamnya.", "SD5-M-B5-01"),
    ("16 m²", False, "Hanya ubin di tepi yang dihitung. Ubin di bagian dalam juga menutupi lantai.", "SD5-M-B5-01"),
], guna="Pemetaan awal")
cek(7 * 7 == 49 and 4 * 7 == 28 and 2 * 7 == 14 and 3 * 7 == 21)
soal("PA3", 2, "Sebuah persegi mempunyai sisi 7 cm. Berapa luasnya?", "D", [
    ("49 cm²", True, "Benar. Luas persegi = sisi × sisi = 7 × 7 = 49 cm².", ""),
    ("28 cm²", False, "Sisi dikali 4. Itu keliling persegi, bukan luasnya.", "SD5-M-B5-01"),
    ("14 cm²", False, "Sisi dikali 2. Luas persegi adalah sisi dikali sisi.", "SD5-M-B5-11"),
    ("21 cm²", False, "Sisi dikali 3. Luas persegi adalah sisi dikali sisi.", "SD5-M-B5-11"),
], guna="Pemetaan awal")
cek(segitiga(10, 6) == 30 and 10 * 6 == 60 and 10 + 6 == 16 and (10 + 6) // 2 == 8)
soal("PA4", 3, "Sebuah segitiga mempunyai alas 10 cm dan tinggi 6 cm. Berapa luasnya?", "B", [
    ("30 cm²", True, "Benar. 1/2 × 10 × 6 = 30 cm².", ""),
    ("60 cm²", False, "Setengahnya terlupa. 10 × 6 adalah luas dua segitiga yang sama.", "SD5-M-B5-02"),
    ("16 cm²", False, "Alas dan tinggi dijumlahkan. Luas didapat dengan mengalikan.", "SD5-M-B5-01"),
    ("8 cm²", False, "Alas dan tinggi dijumlahkan lalu dibagi dua. Keduanya harus dikalikan.", "SD5-M-B5-01"),
], guna="Pemetaan awal")

# ── Cek penguasaan (post-test): fresh numbers and situations, every subbab.
cek(13 * 7 == 91 and 2 * (13 + 7) == 40 and 13 + 7 == 20 and 7 * 7 == 49)
soal("PB1", 2, "Sebuah kebun sayur berbentuk persegi panjang dengan panjang 13 m dan lebar 7 m. Berapa luas kebun itu?", "C", [
    ("91 m²", True, "Benar. 13 × 7 = 91 m².", ""),
    ("40 m²", False, "Ini keliling kebun, 2 × (13 + 7). Luas adalah panjang × lebar.", "SD5-M-B5-01"),
    ("20 m²", False, "Panjang dan lebar dijumlahkan. Luas didapat dengan mengalikan.", "SD5-M-B5-01"),
    ("49 m²", False, "Lebar dikali lebar (7 × 7). Yang dikalikan adalah panjang dan lebar.", "SD5-M-B5-11"),
], guna="Cek penguasaan")
cek(segitiga(14, 9) == 63 and 14 * 9 == 126 and segitiga(14, 11) == 77 and 14 + 9 + 11 == 34)
soal("PB2", 3, "Sebuah segitiga mempunyai alas 14 cm dan tinggi 9 cm. Sisi miringnya 11 cm. Berapa luas segitiga itu?", "A", [
    ("63 cm²", True, "Benar. 1/2 × 14 × 9 = 63 cm². Sisi miring tidak dipakai.", ""),
    ("126 cm²", False, "Setengahnya terlupa: 14 × 9 adalah luas dua segitiga.", "SD5-M-B5-02"),
    ("77 cm²", False, "Sisi miring 11 cm dipakai sebagai tinggi. Tinggi adalah jarak tegak lurus, yaitu 9 cm.", "SD5-M-B5-03"),
    ("34 cm²", False, "Ketiga ukuran dijumlahkan. Luas segitiga adalah 1/2 × alas × tinggi.", "SD5-M-B5-01"),
], guna="Cek penguasaan", sulit="Sedang")
cek(12 * 7 == 84 and 12 * 9 == 108 and 12 * 7 // 2 == 42)
cek(2 * (12 + 7) == 38)
soal("PB3", 3, "Sebuah jajargenjang mempunyai alas 12 cm, tinggi 7 cm, dan sisi miring 9 cm. Berapa luasnya?", "D", [
    ("84 cm²", True, "Benar. Luas jajargenjang = alas × tinggi = 12 × 7 = 84 cm².", ""),
    ("108 cm²", False, "Sisi miring 9 cm dipakai sebagai tinggi. Tinggi adalah jarak tegak lurus, 7 cm.", "SD5-M-B5-03"),
    ("42 cm²", False, "Dikali setengah seperti segitiga. Jajargenjang disusun ulang menjadi persegi panjang utuh, tanpa setengah.", "SD5-M-B5-02"),
    ("38 cm²", False, "Ini keliling bila tinggi dianggap sisi, 2 × (12 + 7). Luas adalah alas × tinggi.", "SD5-M-B5-01"),
], guna="Cek penguasaan", sulit="Sedang")
cek(trapesium(10, 6, 5) == 40 and (10 + 6) * 5 == 80 and 10 * 6 * 5 == 300 and segitiga(10, 5) == 25)
soal("PB4", 4, "Sebuah trapesium mempunyai sisi sejajar 10 cm dan 6 cm, dengan tinggi 5 cm. Berapa luasnya?", "B", [
    ("40 cm²", True, "Benar. 1/2 × (10 + 6) × 5 = 1/2 × 16 × 5 = 40 cm².", ""),
    ("80 cm²", False, "Setengahnya terlupa: (10 + 6) × 5 adalah luas dua trapesium.", "SD5-M-B5-02"),
    ("300 cm²", False, "Kedua sisi sejajar dan tingginya dikalikan semuanya. Sisi sejajar dijumlahkan dulu.", "SD5-M-B5-05"),
    ("25 cm²", False, "Hanya sisi sejajar 10 cm yang dipakai. Kedua sisi sejajar harus dijumlahkan.", "SD5-M-B5-05"),
], guna="Cek penguasaan", sulit="Sedang")
cek(diagonal(16, 10) == 80 and 16 * 10 == 160 and 16 + 10 == 26 and SETENGAH * 16 * SETENGAH * 10 == 40)
soal("PB5", 4, "Sebuah layang-layang mempunyai diagonal 16 cm dan 10 cm. Berapa luasnya?", "C", [
    ("80 cm²", True, "Benar. 1/2 × 16 × 10 = 80 cm².", ""),
    ("160 cm²", False, "Setengahnya terlupa: 16 × 10 adalah luas persegi panjang di sekeliling layang-layang.", "SD5-M-B5-02"),
    ("26 cm²", False, "Kedua diagonal dijumlahkan. Luas didapat dengan mengalikan.", "SD5-M-B5-01"),
    ("40 cm²", False, "Setengah dipakai dua kali (1/2 × 16 × 1/2 × 10). Cukup satu kali setengah.", "SD5-M-B5-02"),
], guna="Cek penguasaan", sulit="Sedang")
L_POST = [("kanan", 9), ("bawah", 3), ("kiri", 5), ("bawah", 4), ("kiri", 4), ("atas", 7)]
cek(luas_ortogonal(L_POST) == 43 == 9 * 3 + 4 * 4 and jalan(L_POST) == 32 and pelingkup(L_POST) == 63 and 9 * 3 + 4 * 7 == 55)
soal("PB6", 5, "Sebuah ruangan berbentuk huruf L. Mulai dari pojok kiri atas, tepinya: ke kanan 9 m, ke bawah 3 m, ke kiri 5 m, ke bawah 4 m, ke kiri 4 m, lalu naik 7 m kembali ke titik awal. Berapa luas lantai ruangan itu?", "D", [
    ("43 m²", True, "Benar. Bagian atas 9 × 3 = 27 m², bagian bawah 4 × 4 = 16 m², jadi 27 + 16 = 43 m².", ""),
    ("32 m²", False, "Ini keliling ruangan (jumlah semua langkah). Luas menghitung daerah di dalamnya.", "SD5-M-B5-01"),
    ("63 m²", False, "Ini luas persegi panjang 9 m × 7 m di sekelilingnya. Pojok kanan bawah 5 m × 4 m tidak termasuk ruangan.", "SD5-M-B5-06"),
    ("55 m²", False, "Bagian kiri dihitung setinggi 7 m (4 × 7) padahal 3 m teratasnya sudah termasuk bagian atas; bagian itu terhitung dua kali.", "SD5-M-B5-06"),
], guna="Cek penguasaan", sulit="Sedang")
cek(12 * 6 - 10 * 4 == 32 and 11 * 5 - 10 * 4 == 15 and 12 * 6 == 72 and 2 * (10 + 4) == 28)
soal("PB7", 5, "Sebuah kolam berukuran 10 m × 4 m dikelilingi jalan selebar 1 m di semua sisinya. Berapa luas jalan itu?", "A", [
    ("32 m²", True, "Benar. Daerah luar (1 + 10 + 1) × (1 + 4 + 1) = 12 × 6 = 72 m², dikurangi kolam 40 m² = 32 m².", ""),
    ("15 m²", False, "Lebar jalan hanya ditambahkan sekali (11 × 5). Jalan ada di kedua sisi, jadi setiap ukuran bertambah 2 m.", "SD5-M-B5-07"),
    ("72 m²", False, "Ini luas daerah luar seluruhnya. Kolamnya bukan jalan dan harus dikurangkan.", "SD5-M-B5-10"),
    ("28 m²", False, "Keliling kolam dikali lebar jalan (28 × 1). Keempat pojok jalan (masing-masing 1 m²) terlewat.", "SD5-M-B5-06"),
], guna="Cek penguasaan", sulit="Sulit", petunjuk="Hitung dulu ukuran daerah luar, termasuk jalan di kedua sisi.")
UKURAN36, TERLUAS36 = persegi_panjang_terluas(36)
cek(TERLUAS36 == 81 == 9 * 9 and max(p * l for p, l in UKURAN36 if p != l) == 80 == 10 * 8 and 18 * 18 == 324 and 17 * 1 == 17)
soal("PB8", 6, "Pak Tani mempunyai tali 36 m untuk membatasi kebun berbentuk persegi panjang. Berapa luas kebun terbesar yang dapat ia buat, bila panjang dan lebarnya bilangan bulat meter?", "B", [
    ("81 m²", True, "Benar. Panjang + lebar = 18 m. Yang paling luas 9 m × 9 m = 81 m²; persegi juga persegi panjang.", ""),
    ("80 m²", False, "10 m × 8 m dipilih karena persegi dianggap bukan persegi panjang. 9 m × 9 m boleh dan lebih luas.", "SD5-M-B5-09"),
    ("324 m²", False, "Setengah keliling (18 m) dipakai sebagai sisi. 18 m adalah panjang dan lebar bersama.", "SD5-M-B5-13"),
    ("17 m²", False, "Ini luas yang paling kecil (17 m × 1 m). Keliling yang sama tidak berarti luas yang sama.", "SD5-M-B5-08"),
], guna="Cek penguasaan", sulit="Sedang")

# ── Latihan (practice), by lesson, from direct use toward a little more reasoning.
cek(10 + SETENGAH * 4 == 12 and 10 + 4 == 14 and 10 + 4 * 2 == 18)
soal("LT1", 1, "Sebuah bangun pada kertas berpetak menutupi 10 petak utuh dan 4 petak yang masing-masing terisi setengah. Berapa luasnya?", "B", [
    ("12 satuan luas", True, "Benar. Empat setengah petak sama dengan 2 petak utuh, jadi 10 + 2 = 12.", ""),
    ("10 satuan luas", False, "Hanya petak utuh yang dihitung. Potongan setengah juga menutupi daerah bangun itu.", "SD5-M-B5-04"),
    ("14 satuan luas", False, "Setiap potongan setengah dihitung sebagai satu petak utuh.", "SD5-M-B5-04"),
    ("18 satuan luas", False, "Setiap potongan setengah dihitung dua petak. Dua potongan setengah baru sama dengan satu petak.", "SD5-M-B5-04"),
])
cek(2 * 3 * 3 + 3 * 2 == 24 and 3 * 3 + 3 * 2 == 15 and 2 * 3 * 3 == 18 and 3 * 2 == 6)
soal("LT2", 1, "Sebuah rumah mempunyai dua kamar tidur, masing-masing 3 m × 3 m, dan dapur 3 m × 2 m. Berapa ubin 1 m × 1 m yang diperlukan untuk semua ruangan itu?", "C", [
    ("24 ubin", True, "Benar. Dua kamar 2 × 9 = 18 ubin, dapur 6 ubin, jadi 24 ubin.", ""),
    ("15 ubin", False, "Hanya satu kamar tidur yang dihitung. Ada dua kamar tidur.", "SD5-M-B5-10"),
    ("18 ubin", False, "Dapurnya terlewat; 18 ubin baru untuk dua kamar tidur.", "SD5-M-B5-10"),
    ("6 ubin", False, "Itu baru ubin untuk dapur. Kamar tidur juga harus dipasangi ubin.", "SD5-M-B5-10"),
])
cek(25 * 12 == 300 and 2 * (25 + 12) == 74 and 25 + 12 == 37 and 12 * 12 == 144)
soal("LT3", 2, "Sebuah lapangan bulu tangkis mini berukuran 25 m × 12 m. Berapa luasnya?", "A", [
    ("300 m²", True, "Benar. 25 × 12 = 300 m².", ""),
    ("74 m²", False, "Ini keliling lapangan, 2 × (25 + 12).", "SD5-M-B5-01"),
    ("37 m²", False, "Panjang dan lebar dijumlahkan. Luas didapat dengan mengalikan.", "SD5-M-B5-01"),
    ("144 m²", False, "Lebar dikali lebar (12 × 12). Yang dikalikan panjang dan lebar.", "SD5-M-B5-11"),
])
cek(9 * 9 == 81 and 4 * 9 == 36 and 2 * 9 == 18 and 3 * 9 == 27)
soal("LT4", 2, "Sebuah taplak meja berbentuk persegi dengan sisi 9 dm. Berapa luasnya?", "D", [
    ("81 dm²", True, "Benar. 9 × 9 = 81 dm².", ""),
    ("36 dm²", False, "Sisi dikali 4. Itu keliling taplak.", "SD5-M-B5-01"),
    ("18 dm²", False, "Sisi dikali 2. Luas persegi adalah sisi × sisi.", "SD5-M-B5-11"),
    ("27 dm²", False, "Sisi dikali 3. Luas persegi adalah sisi × sisi.", "SD5-M-B5-11"),
])
cek(72 // 9 == 8 and 72 % 9 == 0 and 72 - 9 == 63 and 72 * 9 == 648 and 72 // 2 - 9 == 27)
soal("LT5", 2, "Luas sebuah persegi panjang 72 cm² dan panjangnya 9 cm. Berapa lebarnya?", "B", [
    ("8 cm", True, "Benar. 9 × lebar = 72, jadi lebar = 72 : 9 = 8 cm.", ""),
    ("63 cm", False, "Luas dikurangi panjang. Luas = panjang × lebar, jadi lebar didapat dengan membagi.", "SD5-M-B5-14"),
    ("648 cm", False, "Luas dikali panjang. Lebar pasti lebih kecil dari luasnya, jadi dibagi.", "SD5-M-B5-14"),
    ("27 cm", False, "Luas diperlakukan seperti keliling (72 : 2 − 9). Luas adalah panjang × lebar.", "SD5-M-B5-01"),
], sulit="Sulit")
cek(segitiga(12, 5) == 30 and 12 * 5 == 60 and 12 + 5 == 17 and SETENGAH * 12 * SETENGAH * 5 == 15)
soal("LT6", 3, "Sebuah segitiga mempunyai alas 12 cm dan tinggi 5 cm. Berapa luasnya?", "C", [
    ("30 cm²", True, "Benar. 1/2 × 12 × 5 = 30 cm².", ""),
    ("60 cm²", False, "Setengahnya terlupa: 12 × 5 adalah luas dua segitiga.", "SD5-M-B5-02"),
    ("17 cm²", False, "Alas dan tinggi dijumlahkan. Luas didapat dengan mengalikan.", "SD5-M-B5-01"),
    ("15 cm²", False, "Setengah dipakai dua kali (1/2 × 12 × 1/2 × 5). Cukup satu kali setengah.", "SD5-M-B5-02"),
])
cek(segitiga(8, 6) == 24 and segitiga(8, 10) == 40 and 8 * 10 == 80 and 8 * 6 == 48)
soal("LT7", 3, "Sebuah segitiga siku-siku mempunyai alas 8 cm, tinggi 6 cm, dan sisi miring 10 cm. Berapa luasnya?", "A", [
    ("24 cm²", True, "Benar. 1/2 × 8 × 6 = 24 cm². Sisi miring tidak dipakai.", ""),
    ("40 cm²", False, "Sisi miring 10 cm dipakai sebagai tinggi. Tingginya 6 cm, tegak lurus dengan alas.", "SD5-M-B5-03"),
    ("80 cm²", False, "Alas dikali sisi miring tanpa setengah. Yang dipakai alas dan tinggi, dengan setengah.", "SD5-M-B5-03"),
    ("48 cm²", False, "Setengahnya terlupa: 8 × 6 adalah luas dua segitiga.", "SD5-M-B5-02"),
], sulit="Sedang")
cek(15 * 8 == 120 and 15 * 10 == 150 and 15 * 8 // 2 == 60 and 2 * (15 + 10) == 50)
soal("LT8", 3, "Sebuah jajargenjang mempunyai alas 15 cm, tinggi 8 cm, dan sisi miring 10 cm. Berapa luasnya?", "D", [
    ("120 cm²", True, "Benar. 15 × 8 = 120 cm².", ""),
    ("150 cm²", False, "Sisi miring dipakai sebagai tinggi. Tingginya 8 cm.", "SD5-M-B5-03"),
    ("60 cm²", False, "Dikali setengah seperti segitiga. Jajargenjang tidak memakai setengah.", "SD5-M-B5-02"),
    ("50 cm²", False, "Ini keliling jajargenjang, 2 × (15 + 10). Luas adalah alas × tinggi.", "SD5-M-B5-01"),
], sulit="Sedang")
cek(trapesium(7, 13, 6) == 60 and (7 + 13) * 6 == 120 and 7 * 13 * 6 == 546 and segitiga(13, 6) == 39)
soal("LT9", 4, "Sebuah trapesium mempunyai sisi sejajar 7 cm dan 13 cm, dengan tinggi 6 cm. Berapa luasnya?", "A", [
    ("60 cm²", True, "Benar. 1/2 × (7 + 13) × 6 = 1/2 × 20 × 6 = 60 cm².", ""),
    ("120 cm²", False, "Setengahnya terlupa.", "SD5-M-B5-02"),
    ("546 cm²", False, "Semua ukuran dikalikan. Kedua sisi sejajar dijumlahkan dulu.", "SD5-M-B5-05"),
    ("39 cm²", False, "Hanya sisi sejajar 13 cm yang dipakai. Kedua sisi sejajar dijumlahkan.", "SD5-M-B5-05"),
])
cek(diagonal(12, 9) == 54 and 12 * 9 == 108 and 12 + 9 == 21 and SETENGAH * 12 * SETENGAH * 9 == 27)
soal("LT10", 4, "Sebuah belah ketupat mempunyai diagonal 12 cm dan 9 cm. Berapa luasnya?", "C", [
    ("54 cm²", True, "Benar. 1/2 × 12 × 9 = 54 cm².", ""),
    ("108 cm²", False, "Setengahnya terlupa.", "SD5-M-B5-02"),
    ("21 cm²", False, "Kedua diagonal dijumlahkan. Luas didapat dengan mengalikan.", "SD5-M-B5-01"),
    ("27 cm²", False, "Setengah dipakai dua kali. Cukup satu kali.", "SD5-M-B5-02"),
])
cek(diagonal(20, 14) == 140 and 20 * 14 == 280 and 20 + 14 == 34 and SETENGAH * 20 * SETENGAH * 14 == 70)
soal("LT11", 4, "Nia membuat layang-layang dengan bilah bambu sepanjang 20 dm dan 14 dm sebagai diagonalnya. Berapa luas kertas yang menutupinya?", "B", [
    ("140 dm²", True, "Benar. 1/2 × 20 × 14 = 140 dm².", ""),
    ("280 dm²", False, "Setengahnya terlupa: 20 × 14 adalah luas persegi panjang di sekeliling layang-layang.", "SD5-M-B5-02"),
    ("34 dm²", False, "Kedua bilah dijumlahkan. Luas didapat dengan mengalikan.", "SD5-M-B5-01"),
    ("70 dm²", False, "Setengah dipakai dua kali. Cukup satu kali.", "SD5-M-B5-02"),
], sulit="Sedang")
cek(trapesium(40, 60, 25) == 1_250 and (40 + 60) * 25 == 2_500 and 40 * 60 * 25 == 60_000 and segitiga(60, 25) == 750)
soal("LT12", 4, "Sawah Pak Budi berbentuk trapesium. Sisi sejajarnya 40 m dan 60 m, dan jarak antara kedua sisi itu 25 m. Berapa luas sawahnya?", "D", [
    ("1.250 m²", True, "Benar. 1/2 × (40 + 60) × 25 = 1/2 × 100 × 25 = 1.250 m².", ""),
    ("2.500 m²", False, "Setengahnya terlupa.", "SD5-M-B5-02"),
    ("60.000 m²", False, "Semua ukuran dikalikan. Kedua sisi sejajar dijumlahkan dulu.", "SD5-M-B5-05"),
    ("750 m²", False, "Hanya sisi 60 m yang dipakai. Kedua sisi sejajar dijumlahkan.", "SD5-M-B5-05"),
], sulit="Sedang")
cek(10 * 8 + segitiga(10, 6) == 110 and 10 * 8 + 10 * 6 == 140 and 10 * 8 == 80 and segitiga(10, 6) == 30)
soal("LT13", 5, "Dinding depan sebuah rumah terdiri atas persegi panjang 10 m × 8 m dan di atasnya segitiga dengan alas 10 m dan tinggi 6 m. Berapa luas dinding itu?", "A", [
    ("110 m²", True, "Benar. 10 × 8 = 80 m² ditambah 1/2 × 10 × 6 = 30 m², jadi 110 m².", ""),
    ("140 m²", False, "Setengah pada segitiga terlupa: 10 × 6 = 60, padahal segitiga luasnya 30 m².", "SD5-M-B5-02"),
    ("80 m²", False, "Hanya persegi panjangnya yang dihitung; segitiga di atasnya terlewat.", "SD5-M-B5-06"),
    ("30 m²", False, "Hanya segitiganya yang dihitung; persegi panjang di bawahnya terlewat.", "SD5-M-B5-06"),
], sulit="Sedang")
cek(20 * 15 - 6 * 4 == 276 and 20 * 15 + 6 * 4 == 324 and 20 * 15 == 300 and 6 * 4 == 24)
soal("LT14", 5, "Sebuah taman berukuran 20 m × 15 m. Di tengahnya ada kolam 6 m × 4 m. Bagian taman selain kolam ditanami rumput. Berapa luas rumputnya?", "C", [
    ("276 m²", True, "Benar. 20 × 15 = 300 m², dikurangi kolam 6 × 4 = 24 m², jadi 276 m².", ""),
    ("324 m²", False, "Luas kolam ditambahkan. Kolam tidak ditanami rumput, jadi dikurangkan.", "SD5-M-B5-06"),
    ("300 m²", False, "Kolamnya tidak dikurangkan. Rumput hanya ditanam di luar kolam.", "SD5-M-B5-10"),
    ("24 m²", False, "Itu luas kolamnya. Yang ditanyakan luas rumput.", "SD5-M-B5-10"),
], sulit="Sedang")
U_LAT = [("kanan", 3), ("bawah", 4), ("kanan", 2), ("atas", 4), ("kanan", 3), ("bawah", 6), ("kiri", 8), ("atas", 6)]
cek(luas_ortogonal(U_LAT) == 40 == 8 * 6 - 2 * 4 and pelingkup(U_LAT) == 48 and jalan(U_LAT) == 36 and 48 - 2 * 2 * 4 == 32)
soal("LT15", 5, "Sebuah papan berbentuk huruf U. Mulai dari pojok kiri atas, tepinya: ke kanan 3 cm, ke bawah 4 cm, ke kanan 2 cm, ke atas 4 cm, ke kanan 3 cm, ke bawah 6 cm, ke kiri 8 cm, lalu naik 6 cm. Berapa luas papan itu?", "D", [
    ("40 cm²", True, "Benar. Persegi panjang 8 × 6 = 48 cm², dikurangi lekukan 2 × 4 = 8 cm², jadi 40 cm².", ""),
    ("48 cm²", False, "Lekukan 2 cm × 4 cm di tengah atas tidak dikurangkan. Lekukan itu bukan bagian papan.", "SD5-M-B5-06"),
    ("36 cm²", False, "Ini keliling papan (jumlah semua langkah). Luas menghitung daerah di dalamnya.", "SD5-M-B5-01"),
    ("32 cm²", False, "Lekukan dikurangkan dua kali (48 − 16). Lekukannya hanya satu, 2 × 4 = 8 cm².", "SD5-M-B5-06"),
], sulit="Sulit")
cek(6 * 6 > 8 * 4 and 2 * (6 + 6) == 2 * (8 + 4) == 24 and (36, 32) == (6 * 6, 8 * 4))
soal("LT16", 6, "Persegi panjang P berukuran 8 cm × 4 cm dan persegi Q bersisi 6 cm. Keliling keduanya 24 cm. Pernyataan manakah yang tepat?", "B", [
    ("Q lebih luas: 36 cm² dibanding 32 cm²", True, "Tepat. Keliling sama, tetapi luas Q = 36 cm² dan luas P = 32 cm².", ""),
    ("Luasnya sama karena kelilingnya sama", False, "Keliling yang sama tidak berarti luas yang sama: 36 cm² dan 32 cm².", "SD5-M-B5-08"),
    ("P lebih luas karena lebih panjang", False, "P memang lebih panjang, tetapi juga lebih kurus. Luasnya 32 cm², lebih kecil dari 36 cm².", "SD5-M-B5-08"),
    ("Tidak dapat dibandingkan karena Q persegi", False, "Persegi juga persegi panjang, dan luas keduanya dapat dihitung lalu dibandingkan.", "SD5-M-B5-09"),
], sulit="Sedang")
cek(4 * 9 == 6 * 6 == 3 * 12 == 36 and 2 * (3 + 12) == 30 > 2 * (4 + 9) == 26 > 2 * (6 + 6) == 24)
soal("LT17", 6, "Tiga persegi panjang mempunyai luas yang sama, 36 cm²: 3 cm × 12 cm, 4 cm × 9 cm, dan 6 cm × 6 cm. Manakah yang kelilingnya paling panjang?", "A", [
    ("3 cm × 12 cm", True, "Benar. Kelilingnya 30 cm, lebih panjang dari 26 cm (4 × 9) dan 24 cm (6 × 6).", ""),
    ("6 cm × 6 cm", False, "Persegi justru kelilingnya paling pendek di antara ketiganya, 24 cm. Persegi tidak selalu paling besar dalam segala hal.", "SD5-M-B5-12"),
    ("Kelilingnya sama karena luasnya sama", False, "Luas yang sama tidak berarti keliling yang sama: 30 cm, 26 cm, dan 24 cm.", "SD5-M-B5-08"),
    ("4 cm × 9 cm", False, "Kelilingnya 26 cm, masih lebih pendek dari 3 cm × 12 cm yang 30 cm. Makin kurus, makin panjang kelilingnya.", "SD5-M-B5-12"),
], sulit="Sedang")
UKURAN32, TERLUAS32 = persegi_panjang_terluas(32)
cek(TERLUAS32 == 64 == 8 * 8 and 9 * 7 == 63 and 16 * 16 == 256 and 15 * 1 == 15)
soal("LT18", 6, "Kawat sepanjang 32 cm dibentuk menjadi persegi panjang dengan ukuran bilangan bulat sentimeter. Berapa luas terbesar yang dapat dibuat?", "C", [
    ("64 cm²", True, "Benar. Panjang + lebar = 16 cm; yang paling luas 8 cm × 8 cm = 64 cm².", ""),
    ("63 cm²", False, "9 cm × 7 cm dipilih karena persegi dianggap bukan persegi panjang. 8 cm × 8 cm boleh dan lebih luas.", "SD5-M-B5-09"),
    ("256 cm²", False, "Setengah keliling (16 cm) dipakai sebagai sisi. 16 cm adalah panjang dan lebar bersama.", "SD5-M-B5-13"),
    ("15 cm²", False, "Ini luas yang paling kecil (15 cm × 1 cm).", "SD5-M-B5-08"),
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

# The post-test uses fresh numbers: the measures a post-test question works on are not a problem a
# lesson works through nor one of the book's (pp. 185-243), and no post-test answer is a book key.
SOAL_BUKU = [{3, 2}, {3}, {2, 1}, {3, 4}, {1, 2}, {5, 2}, {4, 3}, {2, 3}, {4}, {5, 4}, {4, 2}, {5, 2, 2}, {2, 4},
             {5, 4, 2}, {60}, {24, 18}, {16, 8, 12}, {15, 6, 1, 40, 5}, {20, 10}, {15}]
SOAL_PELAJARAN = [{1, 3, 2}, {3}, {8, 2}, {5, 4}, {6}, {72, 8}, {8, 5}, {6}, {10, 6}, {7, 4}, {6, 10, 4}, {8, 6},
                  {10, 4}, {8, 3, 5, 4, 7}, {8, 4, 1}, {6, 4}, {24}, {12}]
KUNCI_BUKU = {6, 9, 2, 13, 18, 39, 8, 10, 12, 16, 7, 4, 15, 225, 200, 216, 224, 22, 20, 28}
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
                c.number_format = "@"   # "1/2" in the text stays text

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
    tulis(os.path.join(here, "SD5-Matematika-Bab5.xlsx"))
    tulis_miskonsepsi(os.path.join(here, "SD5-Matematika-Bab5-miskonsepsi.csv"))
    halaman = sum(p["isi"].count("## ") for p in PELAJARAN)
    print(f"SD5-Matematika-Bab5.xlsx: lessons {len(PELAJARAN)} ({halaman} pages), questions {len(S)} "
          f"(pre {len(PRE)}, post {len(POST)}, practice {len(LAT)}), answers "
          + " ".join(f"{h}={HURUF[h]}" for h in "ABCD"))
    print(f"SD5-Matematika-Bab5-miskonsepsi.csv: {len(MISKONSEPSI)} codes")
    print(f"assertions passed: {CEK[0]}")
