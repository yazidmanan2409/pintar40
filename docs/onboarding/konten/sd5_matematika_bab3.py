# SD Kelas 5, Matematika, Bab 3 "Bilangan Pecahan", as a PINTAR lesson workbook in the D-007
# template (sheets Kursus, Bab, Pelajaran, Soal, Pilihan; the column contract is KOLOM in
# src/lib/unggah-kontrak.ts). Built the way Bab 1 and Bab 2 were (both GATE: PASS).
#
# Source: Buku Panduan Guru Matematika untuk SD/MI Kelas V (Meita Fitrianawati, Ika Surtiani,
# Ait Istiandaru; Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi, 2022), Bab 3,
# pp. 97-112. This guide gives the chapter's scope (subbab A: membandingkan dan mengurutkan;
# B: penjumlahan; C: pengurangan; with pecahan biasa and campuran, penyebut sama and berbeda) and
# its misconceptions, but not the student book's examples or the Uji Kompetensi questions. So the
# examples and numbers here are PINTAR's own, within that scope, and every one is checked below.
# Lesson 1 is the review the guide opens with (pecahan, senilai, campuran; p. 99).
#
# Fraction diagrams use the lesson player's `[[visual:pecahan|a/b]]` (a line on its own; a proper
# fraction only; src/app/belajar/_components/LessonPlayer.tsx).
#
# Text lessons only (D-050). The workbook's "Kode miskonsepsi" column stays empty; the proposed
# codes go to SD5-Matematika-Bab3-miskonsepsi.csv.
#
# Run: python3 docs/onboarding/konten/sd5_matematika_bab3.py
import csv
import os
import re
from fractions import Fraction
from math import gcd

from openpyxl import Workbook
from openpyxl.styles import Alignment, Font

CEK = [0]


def cek(syarat, pesan=""):
    """An assertion that is counted, so the hand-off can say how many passed."""
    assert syarat, pesan
    CEK[0] += 1


def P(teks):
    """'3/8', '2 1/4' or '5' as a Fraction."""
    teks = teks.strip()
    m = re.fullmatch(r"(\d+) (\d+)/(\d+)", teks)
    if m:
        return int(m[1]) + Fraction(int(m[2]), int(m[3]))
    return Fraction(teks)


def campuran(f):
    """A Fraction written the way the lessons write it: '1 3/4', '5/12' or '2'."""
    b, s = divmod(f.numerator, f.denominator)
    if s == 0:
        return str(b)
    return f"{b} {Fraction(s, f.denominator)}" if b else str(Fraction(s, f.denominator))


def _pb(teks):
    """'4/10' as written (numerator 4, denominator 10), not reduced as Fraction would."""
    a, b = teks.split("/")
    return int(a), int(b)


def tanpa_samakan(a, b, op):
    """The slip: numerators with numerators, denominators with denominators (1/2 + 1/3 = 2/5)."""
    (pa, qa), (pb, qb) = _pb(a), _pb(b)
    return f"{op(pa, pb)}/{op(qa, qb)}"


def penyebut_saja(a, b, op):
    """The book's slip (p. 104): the denominator made common, the numerators left as they were."""
    (pa, qa), (pb, qb) = _pb(a), _pb(b)
    return f"{op(pa, pb)}/{qa * qb // gcd(qa, qb)}"


tambah = lambda x, y: x + y  # noqa: E731
kurang = lambda x, y: x - y  # noqa: E731

# ── Lesson examples ─────────────────────────────────────────────────────────────
# lesson 1
cek(P("1/2") == P("2/4") == P("4/8") and P("3/4") == P("6/8") and Fraction(3 * 2, 4 * 2) == P("6/8"))
cek(gcd(12, 18) == 6 and P("12/18") == P("2/3") and P("12/18") == Fraction(12 // 6, 18 // 6))
cek(P("2 1/4") == P("9/4") and 2 * 4 + 1 == 9 and divmod(7, 3) == (2, 1) and P("7/3") == P("2 1/3"))
# lesson 2
cek(P("3/7") < P("5/7") and P("1/4") > P("1/8") and P("2/3") == P("8/12") and P("3/4") == P("9/12") and P("2/3") < P("3/4"))
cek(sorted([P("2 1/2"), P("2 1/4"), P("2 2/5")]) == [P("2 1/4"), P("2 2/5"), P("2 1/2")])     # book key p. 104
cek(P("1/4") == P("5/20") and P("2/5") == P("8/20") and P("1/2") == P("10/20"))
# lesson 3
cek(P("2/7") + P("3/7") == P("5/7") and tanpa_samakan("2/7", "3/7", tambah) == "5/14")
cek(P("1/4") + P("2/3") == P("11/12") and P("1/4") == P("3/12") and P("2/3") == P("8/12"))
cek(P("3/8") + P("5/8") == 1)
cek(P("1/6") + P("1/3") == P("1/2") and P("1/3") == P("2/6") and P("3/6") == P("1/2"))
# lesson 4
cek(P("1 1/5") + P("2 3/5") == P("3 4/5"))
cek(P("1 5/6") + P("2 1/3") == P("4 1/6") and P("5/6") + P("2/6") == P("7/6") == P("1 1/6"))
# lesson 5
cek(P("5/7") - P("2/7") == P("3/7"))
cek(P("2/3") - P("1/4") == P("5/12") and P("8/12") - P("3/12") == P("5/12"))
# lesson 6
cek(P("3 1/3") - P("1 2/3") == P("1 2/3") and P("3 1/3") == 2 + P("4/3") and P("4/3") - P("2/3") == P("2/3"))
cek(3 - P("1/4") == P("2 3/4") and 3 == 2 + P("4/4"))
cek(P("2 1/2") - P("3/4") == P("1 3/4") and P("2 1/2") == 1 + P("6/4"))
cek(P("1 1/2") + P("3/4") == P("2 1/4") and 4 - P("2 1/4") == P("1 3/4"))

SUMBER = ("_Diadaptasi dari Buku Panduan Guru Matematika untuk SD/MI Kelas V, Kementerian Pendidikan, "
          "Kebudayaan, Riset, dan Teknologi, 2022, Bab 3._")

KURSUS = {
    "Judul kursus*": "Matematika Kelas 5 · Bab 3: Bilangan Pecahan",
    "Mata pelajaran*": "Matematika",
    "Jenjang*": "SD",
    "Kelas*": "Kelas 5",
    "Konteks": "Akademik",
}

BAB = [(1, "Bilangan Pecahan")]

PELAJARAN = [
    dict(no=1, judul="Pecahan, Pecahan Senilai, dan Pecahan Campuran",
         ringkasan="Mengingat kembali arti pecahan, pecahan yang senilai, cara menyederhanakan, dan pecahan campuran.",
         tujuan="Murid dapat menentukan pecahan senilai, menyederhanakan pecahan, dan mengubah pecahan biasa menjadi pecahan campuran atau sebaliknya.",
         bloom="Memahami",
         isi=f"""## Arti pecahan

Sebatang cokelat dibagi menjadi 8 bagian yang sama besar. Rani makan 5 bagian.

[[visual:pecahan|5/8]]

Bagian yang dimakan Rani ditulis **5/8** dan dibaca lima per delapan.

- Angka bawah, **penyebut** (8), menunjukkan menjadi berapa bagian sama besar sesuatu dibagi.
- Angka atas, **pembilang** (5), menunjukkan berapa bagian yang diambil.

**Coba:** berapa bagian cokelat yang tersisa?
_Periksa: 3 dari 8 bagian, yaitu 3/8._

## Pecahan senilai

Perhatikan tiga batang yang sama panjang ini.

[[visual:pecahan|1/2]]

[[visual:pecahan|2/4]]

[[visual:pecahan|4/8]]

Bagian yang diarsir sama panjang, jadi 1/2 = 2/4 = 4/8. Pecahan seperti ini disebut **pecahan senilai**.

Untuk membuat pecahan senilai, kalikan pembilang **dan** penyebut dengan bilangan yang **sama**:

3/4 = (3 × 2)/(4 × 2) = 6/8

Mengapa boleh? Setiap bagian dipotong menjadi 2, jadi banyak bagian dan banyak yang diambil sama-sama menjadi dua kali lipat. Besar arsirannya tidak berubah.

Menambahkan angka yang sama (misalnya 3/4 menjadi 5/6) **tidak** menghasilkan pecahan senilai.

## Menyederhanakan pecahan

Menyederhanakan berarti membagi pembilang dan penyebut dengan bilangan yang sama sampai tidak bisa dibagi lagi. Pakailah **FPB** yang kamu pelajari di Bab 2.

Sederhanakan 12/18:

1. FPB dari 12 dan 18 adalah 6.
2. 12 : 6 = 2 dan 18 : 6 = 3.
3. Jadi 12/18 = **2/3**.

## Pecahan campuran

Pita sepanjang 2 meter lebih 1/4 meter ditulis **2 1/4** meter, dibaca dua satu per empat. Artinya 2 + 1/4. Pecahan seperti ini disebut **pecahan campuran**.

**Dari campuran ke pecahan biasa.** 2 1/4 = ?/4

1. Setiap 1 utuh sama dengan 4/4, jadi 2 utuh = 8/4.
2. Tambahkan 1/4: 8/4 + 1/4 = 9/4.

Cara singkatnya: (2 × 4 + 1)/4 = **9/4**.

**Dari pecahan biasa ke campuran.** 7/3 = ?

1. 7 : 3 = 2 sisa 1.
2. Hasil bagi (2) menjadi bilangan utuh, sisanya (1) menjadi pembilang.
3. Jadi 7/3 = **2 1/3**.

{SUMBER}"""),
    dict(no=2, judul="Membandingkan dan Mengurutkan Pecahan",
         ringkasan="Pecahan dibandingkan dengan melihat penyebutnya dulu; bila penyebutnya berbeda, samakan dulu dengan KPK.",
         tujuan="Murid dapat membandingkan dan mengurutkan pecahan biasa dan pecahan campuran.",
         bloom="Menerapkan",
         isi=f"""## Penyebut sama

Bila penyebutnya sama, ukuran setiap bagian sama. Tinggal bandingkan **pembilangnya**.

3/7 < 5/7, karena 3 bagian lebih sedikit dari 5 bagian yang sama besar.

## Pembilang 1, penyebut berbeda

Mana yang lebih besar, 1/4 atau 1/8?

[[visual:pecahan|1/4]]

[[visual:pecahan|1/8]]

Makin besar penyebutnya, makin **kecil** setiap bagiannya, karena sesuatu dibagi menjadi lebih banyak potongan. Jadi **1/4 > 1/8**.

Hati-hati: penyebut yang besar tidak berarti pecahannya besar.

## Penyebut berbeda: samakan dulu

Bandingkan 2/3 dan 3/4.

1. Cari penyebut yang sama. KPK dari 3 dan 4 adalah 12.
2. Ubah kedua pecahan: 2/3 = (2 × 4)/(3 × 4) = 8/12, dan 3/4 = (3 × 3)/(4 × 3) = 9/12.
3. Bandingkan pembilangnya: 8 < 9.

Jadi **2/3 < 3/4**.

Ingat: saat penyebut diubah, pembilang **juga** harus dikali dengan bilangan yang sama. Bila hanya penyebutnya yang diubah, nilai pecahannya berubah.

## Pecahan campuran dan mengurutkan

Tiga potong pita panjangnya 2 1/2 m, 2 1/4 m, dan 2 2/5 m. Urutkan dari yang **terpendek**.

1. Bandingkan bilangan utuhnya dulu. Ketiganya 2, jadi lihat pecahannya.
2. Samakan penyebut 2, 4, dan 5. KPK-nya 20: 1/2 = 10/20, 1/4 = 5/20, 2/5 = 8/20.
3. Urutkan pembilangnya: 5 < 8 < 10.

Urutan dari terpendek: **2 1/4 m, 2 2/5 m, 2 1/2 m**.

Bila bilangan utuhnya berbeda, bilangan utuh itulah yang menentukan. 3 1/8 lebih besar dari 2 7/8, walaupun 1/8 lebih kecil dari 7/8.

{SUMBER}"""),
    dict(no=3, judul="Penjumlahan Pecahan",
         ringkasan="Pecahan dijumlahkan dengan menjumlahkan pembilangnya, setelah penyebutnya sama.",
         tujuan="Murid dapat menjumlahkan pecahan berpenyebut sama dan berpenyebut berbeda, lalu menyederhanakan hasilnya.",
         bloom="Menerapkan",
         isi=f"""## Penyebut sama

Hitung 2/7 + 3/7.

Ada 2 bagian ditambah 3 bagian, dan setiap bagian berukuran 1/7. Jadi hasilnya 5 bagian berukuran 1/7:

2/7 + 3/7 = (2 + 3)/7 = **5/7**

[[visual:pecahan|5/7]]

Penyebutnya **tidak** dijumlahkan. Penyebut menunjukkan ukuran bagian, dan ukuran itu tidak berubah. Kalau ditulis 5/14, setiap bagian seolah menjadi lebih kecil, padahal tidak ada yang dipotong lagi.

## Penyebut berbeda

Hitung 1/4 + 2/3. Bagian berukuran 1/4 dan 1/3 tidak bisa langsung dijumlahkan, jadi samakan dulu ukurannya.

1. KPK dari 4 dan 3 adalah 12.
2. 1/4 = 3/12 dan 2/3 = 8/12.
3. Jumlahkan pembilangnya: 3/12 + 8/12 = **11/12**.

## Sederhanakan hasilnya

Hitung 1/6 + 1/3.

1. KPK dari 6 dan 3 adalah 6, jadi 1/3 = 2/6.
2. 1/6 + 2/6 = 3/6.
3. Sederhanakan dengan FPB 3: 3/6 = **1/2**.

Kadang hasilnya satu utuh: 3/8 + 5/8 = 8/8 = **1**.

## Soal cerita

Ayah mengecat 1/4 pagar pada pagi hari dan 2/3 pagar pada sore hari. Berapa bagian pagar yang sudah dicat?

"Pagi dan sore" digabung, jadi dijumlahkan: 1/4 + 2/3 = 3/12 + 8/12 = **11/12** bagian pagar.

**Coba:** berapa bagian pagar yang belum dicat?
_Periksa: 1 − 11/12 = 12/12 − 11/12 = 1/12._

{SUMBER}"""),
    dict(no=4, judul="Penjumlahan Pecahan Campuran",
         ringkasan="Pecahan campuran dijumlahkan dengan menjumlahkan bilangan utuh dan pecahannya; pecahan yang lebih dari 1 dijadikan bilangan utuh.",
         tujuan="Murid dapat menjumlahkan pecahan campuran, termasuk bila jumlah pecahannya lebih dari 1.",
         bloom="Menerapkan",
         isi=f"""## Utuh dengan utuh, pecahan dengan pecahan

Hitung 1 1/5 + 2 3/5.

1. Jumlahkan bilangan utuhnya: 1 + 2 = 3.
2. Jumlahkan pecahannya: 1/5 + 3/5 = 4/5.
3. Gabungkan: **3 4/5**.

## Bila pecahannya lebih dari 1

Hitung 1 5/6 + 2 1/3.

1. Bilangan utuh: 1 + 2 = 3.
2. Pecahan: samakan penyebut, 1/3 = 2/6. Lalu 5/6 + 2/6 = 7/6.
3. 7/6 lebih dari 1: 7/6 = 1 1/6.
4. Gabungkan: 3 + 1 1/6 = **4 1/6**.

Jangan lupa langkah 3. Satu utuh yang muncul dari pecahan harus ditambahkan ke bilangan utuhnya, seperti menyimpan pada penjumlahan bersusun.

## Cara lain: ubah dulu ke pecahan biasa

1 5/6 = 11/6 dan 2 1/3 = 7/3 = 14/6.

11/6 + 14/6 = 25/6. 25 : 6 = 4 sisa 1, jadi 25/6 = **4 1/6**. Hasilnya sama.

Pilih cara yang menurutmu paling mudah, lalu periksa dengan cara yang lain.

{SUMBER}"""),
    dict(no=5, judul="Pengurangan Pecahan",
         ringkasan="Pecahan dikurangkan dengan mengurangkan pembilangnya, setelah penyebutnya sama.",
         tujuan="Murid dapat mengurangkan pecahan berpenyebut sama dan berpenyebut berbeda.",
         bloom="Menerapkan",
         isi=f"""## Penyebut sama

Hitung 5/7 − 2/7.

Dari 5 bagian berukuran 1/7, diambil 2 bagian. Tersisa 3 bagian:

5/7 − 2/7 = (5 − 2)/7 = **3/7**

Seperti pada penjumlahan, penyebutnya **tidak** dikurangkan. Ukuran bagiannya tetap 1/7.

## Penyebut berbeda

Hitung 2/3 − 1/4.

1. KPK dari 3 dan 4 adalah 12.
2. 2/3 = 8/12 dan 1/4 = 3/12.
3. Kurangkan pembilangnya: 8/12 − 3/12 = **5/12**.

Periksa dengan penjumlahan: 5/12 + 3/12 = 8/12 = 2/3. Cocok.

## Penjumlahan dan pengurangan itu mirip

Langkahnya sama:

1. Samakan penyebut dengan KPK.
2. Ubah pembilang dengan pengali yang sama.
3. Jumlahkan atau kurangkan **pembilangnya saja**.
4. Sederhanakan hasilnya.

Yang berbeda hanya langkah 3: menambah atau mengurangi. Karena itu, baca soalnya: kata **sisa** dan **selisih** berarti mengurangi.

{SUMBER}"""),
    dict(no=6, judul="Pengurangan Pecahan Campuran dan Soal Cerita",
         ringkasan="Pengurangan pecahan campuran kadang perlu meminjam 1 utuh; soal cerita diselesaikan dengan memilih operasi yang tepat.",
         tujuan="Murid dapat mengurangkan pecahan campuran dan memecahkan masalah sehari-hari dengan penjumlahan dan pengurangan pecahan.",
         bloom="Menerapkan",
         isi=f"""## Meminjam 1 utuh

Hitung 3 1/3 − 1 2/3.

Pecahan 1/3 lebih kecil dari 2/3, jadi 1/3 − 2/3 tidak bisa langsung dihitung.

1. Pinjam 1 dari bilangan utuh: 3 1/3 = 2 + 1 + 1/3 = 2 + 3/3 + 1/3 = **2 4/3**.
2. Sekarang kurangkan: bilangan utuh 2 − 1 = 1, pecahan 4/3 − 2/3 = 2/3.
3. Hasilnya **1 2/3**.

Perhatikan: setelah meminjam, bilangan utuhnya berkurang satu (dari 3 menjadi 2). Jangan membalik pengurangannya menjadi 2/3 − 1/3.

## Bilangan utuh dikurangi pecahan

Hitung 3 − 1/4.

1. Pinjam 1 utuh dan tulis sebagai 4/4: 3 = 2 4/4.
2. 2 4/4 − 1/4 = **2 3/4**.

## Soal cerita satu langkah

Pita Nia panjangnya 2 1/2 m. Sepanjang 3/4 m dipakai untuk bando. Berapa sisa pitanya?

1. Ditanyakan **sisa**, jadi dikurangi.
2. Samakan penyebut: 2 1/2 = 2 2/4.
3. 2/4 lebih kecil dari 3/4, jadi pinjam 1 utuh: 2 2/4 = 1 6/4.
4. 1 6/4 − 3/4 = **1 3/4** m.

## Soal cerita dua langkah

Ibu membeli 4 kg beras. Ia memakai 1 1/2 kg pada hari Senin dan 3/4 kg pada hari Selasa. Berapa sisa berasnya?

1. Jumlah yang dipakai: 1 1/2 + 3/4 = 1 2/4 + 3/4 = 1 5/4 = 2 1/4 kg.
2. Sisa: 4 − 2 1/4 = 3 4/4 − 2 1/4 = **1 3/4** kg.

Hasil langkah 1 (2 1/4 kg) bukan jawabannya. Itu baru beras yang dipakai.

## Rangkuman Bab 3

- **Pecahan senilai** didapat dengan mengali atau membagi pembilang dan penyebut dengan bilangan yang sama.
- **Membandingkan**: samakan penyebut dengan KPK, lalu bandingkan pembilangnya. Pada pecahan campuran, bilangan utuhnya dilihat lebih dulu.
- **Menjumlah dan mengurang**: samakan penyebut, lalu hitung pembilangnya saja. Penyebutnya tetap.
- Pecahan campuran: bila jumlah pecahannya lebih dari 1, jadikan bilangan utuh. Bila pecahannya kurang untuk dikurangi, pinjam 1 utuh.
- Sederhanakan hasil akhirnya dengan FPB.

{SUMBER}"""),
]

for _p in PELAJARAN:
    cek(3 <= _p["isi"].count("\n## ") + _p["isi"].startswith("## ") <= 6, f"lesson {_p['no']}: 3-6 pages")
    cek(_p["isi"].rstrip().endswith(SUMBER), f"lesson {_p['no']}: attribution last")
    for v in re.findall(r"^\[\[visual:pecahan\|(\d+)/(\d+)\]\]$", _p["isi"], re.M):
        cek(0 <= int(v[0]) <= int(v[1]) and int(v[1]) > 0, "the player draws only proper fractions")

# ── Misconceptions. 02 and 06 are the book's own (pp. 104, 107, 109: making the denominator
# common without the numerator, and slips with pecahan campuran); the rest come from the
# reasoning behind this chapter's distractors.
MISKONSEPSI = {
    "SD5-M-B3-01": ("Penyebut ikut dihitung",
                    "Pembilang dijumlahkan atau dikurangkan dengan pembilang, dan penyebut dengan penyebut (misalnya 1/2 + 1/3 = 2/5).",
                    "Gambarlah kedua pecahan sebagai potongan dari benda yang sama; tunjukkan bahwa penyebut adalah ukuran potongan, yang tidak berubah saat potongan digabung."),
    "SD5-M-B3-02": ("Penyebut disamakan, pembilang tidak",
                    "Penyebut diubah menjadi KPK, tetapi pembilangnya tidak dikali dengan bilangan yang sama, sehingga nilai pecahannya berubah.",
                    "Tulis pengalinya di atas dan di bawah garis pecahan setiap kali (× 4 / × 4), lalu periksa dengan gambar bahwa pecahannya tetap senilai."),
    "SD5-M-B3-03": ("Penyebut dijadikan patokan",
                    "Besar kecilnya pecahan ditentukan dari penyebutnya saja, misalnya 1/8 dianggap lebih besar dari 1/4 karena 8 lebih besar dari 4.",
                    "Bandingkan dua batang yang sama panjang yang dibagi 4 dan dibagi 8; makin banyak potongan, makin kecil setiap potongannya."),
    "SD5-M-B3-04": ("Pembilang dijadikan patokan",
                    "Pecahan dengan penyebut berbeda dibandingkan dari pembilangnya saja, misalnya 5/6 dianggap lebih kecil dari 7/9 karena 5 lebih kecil dari 7.",
                    "Samakan penyebut dulu, baru bandingkan pembilangnya; pembilang hanya bisa dibandingkan bila ukuran bagiannya sama."),
    "SD5-M-B3-05": ("Bilangan utuh diabaikan",
                    "Pada pecahan campuran, bilangan utuhnya tidak diperhitungkan: yang dibandingkan atau dihitung hanya bagian pecahannya.",
                    "Minta murid menandai bilangan utuh lebih dulu dan membandingkan atau menjumlahkannya sebelum melihat pecahannya."),
    "SD5-M-B3-06": ("Mengubah pecahan campuran keliru",
                    "Pecahan campuran diubah menjadi pecahan biasa (atau sebaliknya) tanpa mengalikan bilangan utuh dengan penyebut, atau hasil bagi dan sisanya tertukar.",
                    "Tuliskan setiap bilangan utuh sebagai pecahan berpenyebut sama (1 = 4/4), lalu jumlahkan; periksa kembali dengan pembagian."),
    "SD5-M-B3-07": ("Pecahan lebih dari 1 tidak dijadikan utuh",
                    "Saat menjumlah pecahan campuran, pecahan yang hasilnya lebih dari 1 tidak diubah, atau satu utuh yang muncul darinya hilang.",
                    "Setelah menjumlah pecahannya, tanyakan: apakah pembilangnya lebih besar dari penyebut? Bila ya, keluarkan satu utuh dan tambahkan ke bilangan utuhnya."),
    "SD5-M-B3-08": ("Meminjam 1 utuh keliru",
                    "Pada pengurangan pecahan campuran, pecahan yang lebih kecil dikurangi dari yang lebih besar dengan membalik urutannya, atau setelah meminjam, bilangan utuhnya tidak dikurangi.",
                    "Tulis ulang bilangan yang dipinjami dalam bentuk barunya (3 1/3 = 2 4/3) sebelum mengurangi, lalu periksa hasilnya dengan penjumlahan."),
    "SD5-M-B3-09": ("Pecahan senilai tanpa perkalian",
                    "Pecahan senilai dibuat dengan menambah pembilang dan penyebut dengan bilangan yang sama, atau hanya salah satunya yang diubah.",
                    "Tunjukkan dengan gambar bahwa 2/3 dan 4/5 tidak sama besar, lalu buat pecahan senilai dengan mengali keduanya dengan bilangan yang sama."),
    "SD5-M-B3-10": ("Penyederhanaan belum tuntas",
                    "Pecahan dibagi dengan faktor persekutuan yang bukan FPB sehingga masih bisa disederhanakan, atau dibagi dengan bilangan yang tidak membagi keduanya.",
                    "Cari FPB pembilang dan penyebut dulu dan bagi keduanya dengan FPB itu; periksa apakah hasilnya masih mempunyai faktor persekutuan selain 1."),
    "SD5-M-B3-11": ("Pembilang dan penyebut tertukar",
                    "Pembilang dan penyebut tertukar tempat, atau penyebut diambil dari banyak bagian yang tidak diambil, bukan dari banyak seluruh bagian.",
                    "Ingatkan bahwa penyebut adalah banyak seluruh bagian yang sama besar, dan pembilang adalah bagian yang dimaksud; hitung keduanya pada gambar."),
    "SD5-M-B3-12": ("Jawaban bukan yang ditanyakan",
                    "Operasi dipilih dari angka yang tampak, bukan dari pertanyaannya (menjumlah saat ditanya sisa), atau hasil langkah pertama diberikan sebagai jawaban akhir.",
                    "Minta murid menggarisbawahi kata kunci pertanyaan (sisa, selisih, semuanya) dan menulis kalimat jawaban sebelum menghitung."),
    "SD5-M-B3-13": ("Urutan terbalik",
                    "Urutan dari terkecil tertukar dengan urutan dari terbesar.",
                    "Setelah mengurutkan, periksa bilangan pertama: apakah memang yang diminta, terkecil atau terbesar?"),
    "SD5-M-B3-14": ("Beda penyebut dianggap tidak dapat dibandingkan",
                    "Pecahan yang penyebutnya berbeda dianggap tidak dapat dibandingkan, atau dianggap sama besar karena pembilangnya sama.",
                    "Tunjukkan bahwa setiap dua pecahan dapat dibandingkan setelah penyebutnya disamakan, atau dengan gambar batang yang sama panjang."),
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
    i = "ABCD".index(jawab)
    urut = pilihan[1:i + 1] + [pilihan[0]] + pilihan[i + 1:]
    S.append(dict(ref=ref, pel=pel, tanya=tanya, pilihan=urut, guna=guna, sulit=sulit, petunjuk=petunjuk))


def nilai_beda(ref, benar, *salah):
    """No distractor may equal the answer in value (e.g. 4/8 for 1/2), so the key is unique."""
    for s in salah:
        cek(P(s) != P(benar), f"{ref}: {s} has the same value as the answer {benar}")


BESAR, KECIL = "lebih besar dari (>)", "lebih kecil dari (<)"

# ── Pemetaan awal (pre-test): what a pecahan is, senilai, comparing, adding (Kelas 4).
nilai_beda("PA1", "3/8", "8/3", "3/5", "5/8")
soal("PA1", 1, "Sebuah pizza dipotong menjadi 8 bagian sama besar. Dodi makan 3 potong. Berapa bagian pizza yang dimakan Dodi?", "B", [
    ("3/8", True, "Benar. Pizza dibagi 8 bagian (penyebut), dan 3 bagian dimakan (pembilang).", ""),
    ("8/3", False, "Pembilang dan penyebut tertukar. Penyebut adalah banyak seluruh bagian, yaitu 8.", "SD5-M-B3-11"),
    ("3/5", False, "Penyebutnya diambil dari 5 potong yang tersisa. Penyebut adalah seluruh bagian pizza, 8.", "SD5-M-B3-11"),
    ("5/8", False, "5/8 adalah bagian yang tidak dimakan. Yang ditanyakan bagian yang dimakan Dodi.", "SD5-M-B3-12"),
], guna="Pemetaan awal")
cek(P("2/3") == P("8/12") and P("4/5") != P("2/3") and P("2/6") != P("2/3") and P("6/12") != P("2/3") and (2 * 3, 3 * 4) == (6, 12))
soal("PA2", 1, "Pecahan yang senilai dengan 2/3 adalah ...", "D", [
    ("8/12", True, "Benar. Pembilang dan penyebut dikali 4: (2 × 4)/(3 × 4) = 8/12.", ""),
    ("4/5", False, "Pembilang dan penyebut ditambah 2. Pecahan senilai dibuat dengan mengali, bukan menambah.", "SD5-M-B3-09"),
    ("2/6", False, "Hanya penyebutnya yang dikali 2. Pembilangnya juga harus dikali 2, menjadi 4/6.", "SD5-M-B3-09"),
    ("6/12", False, "Pembilang dikali 3 tetapi penyebut dikali 4. Keduanya harus dikali dengan bilangan yang sama.", "SD5-M-B3-09"),
], guna="Pemetaan awal")
cek(P("1/4") > P("1/6"))
soal("PA3", 2, "Manakah yang lebih besar, 1/4 atau 1/6?", "A", [
    ("1/4, karena setiap bagiannya lebih besar", True, "Benar. Dibagi 4 menghasilkan potongan yang lebih besar daripada dibagi 6.", ""),
    ("1/6, karena penyebutnya lebih besar", False, "Penyebut 6 memang lebih besar, tetapi makin besar penyebut, makin kecil setiap bagian.", "SD5-M-B3-03"),
    ("Sama besar, karena pembilangnya sama", False, "Pembilangnya sama-sama 1, tetapi ukuran bagiannya berbeda: seperempat lebih besar dari seperenam.", "SD5-M-B3-14"),
    ("Tidak dapat dibandingkan, karena penyebutnya berbeda", False, "Pecahan dengan penyebut berbeda tetap dapat dibandingkan, misalnya dengan menyamakan penyebut.", "SD5-M-B3-14"),
], guna="Pemetaan awal")
cek(P("3/10") + P("4/10") == P("7/10") and tanpa_samakan("3/10", "4/10", tambah) == "7/20")
nilai_beda("PA4", "7/10", "7/20", "1/10", "7/100")
soal("PA4", 3, "3/10 + 4/10 = ...", "C", [
    ("7/10", True, "Benar. Penyebutnya sama, jadi pembilangnya dijumlahkan: 3 + 4 = 7. Penyebut tetap 10.", ""),
    ("7/20", False, "Penyebutnya ikut dijumlahkan. Penyebut menunjukkan ukuran bagian, yang tetap 1/10.", "SD5-M-B3-01"),
    ("1/10", False, "Pembilangnya dikurangkan (4 − 3). Tanda + berarti dijumlahkan.", "SD5-M-B3-12"),
    ("7/100", False, "Penyebutnya dikalikan (10 × 10). Penyebut tetap 10 karena ukuran bagiannya sama.", "SD5-M-B3-01"),
], guna="Pemetaan awal")

# ── Cek penguasaan (post-test): fresh numbers, every objective (compare, order, add, subtract;
# biasa and campuran).
cek(P("5/6") == P("15/18") and P("7/9") == P("14/18") and P("5/6") > P("7/9"))
soal("PB1", 2, "Pernyataan yang tepat tentang 5/6 dan 7/9 adalah ...", "C", [
    ("5/6 > 7/9, karena 15/18 > 14/18", True, "Benar. KPK dari 6 dan 9 adalah 18; 5/6 = 15/18 dan 7/9 = 14/18.", ""),
    ("5/6 < 7/9, karena 5 < 7", False, "Hanya pembilangnya yang dibandingkan, padahal penyebutnya berbeda. Samakan penyebut dulu.", "SD5-M-B3-04"),
    ("5/6 < 7/9, karena 5/18 < 7/18", False, "Penyebut sudah disamakan menjadi 18, tetapi pembilangnya tidak ikut dikali (5 × 3 dan 7 × 2).", "SD5-M-B3-02"),
    ("5/6 < 7/9, karena penyebut 9 lebih besar", False, "Penyebut yang lebih besar tidak membuat pecahan lebih besar; ukuran bagiannya justru lebih kecil.", "SD5-M-B3-03"),
], guna="Cek penguasaan", sulit="Sedang")
cek(sorted([P("3 2/5"), P("3 1/3"), P("2 5/6")]) == [P("2 5/6"), P("3 1/3"), P("3 2/5")] and P("1/3") == P("5/15") and P("2/5") == P("6/15"))
cek(sorted([P("2/5"), P("1/3"), P("5/6")]) == [P("1/3"), P("2/5"), P("5/6")])
soal("PB2", 2, "Tiga karung beras beratnya 3 2/5 kg, 3 1/3 kg, dan 2 5/6 kg. Urutan dari yang paling ringan adalah ...", "A", [
    ("2 5/6 kg; 3 1/3 kg; 3 2/5 kg", True, "Benar. 2 utuh paling ringan. Lalu 1/3 = 5/15 < 2/5 = 6/15.", ""),
    ("3 1/3 kg; 3 2/5 kg; 2 5/6 kg", False, "Yang dibandingkan hanya pecahannya (1/3 < 2/5 < 5/6), bilangan utuhnya diabaikan. 2 5/6 kurang dari 3.", "SD5-M-B3-05"),
    ("3 2/5 kg; 3 1/3 kg; 2 5/6 kg", False, "Ini urutan dari yang paling berat. Yang diminta dari yang paling ringan.", "SD5-M-B3-13"),
    ("2 5/6 kg; 3 2/5 kg; 3 1/3 kg", False, "2/5 dianggap lebih kecil dari 1/3 karena penyebutnya lebih besar. Setelah disamakan, 2/5 = 6/15 dan 1/3 = 5/15.", "SD5-M-B3-03"),
], guna="Cek penguasaan", sulit="Sedang")
cek(P("3/8") + P("1/3") == P("17/24") and tanpa_samakan("3/8", "1/3", tambah) == "4/11"
    and penyebut_saja("3/8", "1/3", tambah) == "4/24" and P("3/8") - P("1/3") == P("1/24"))
nilai_beda("PB3", "17/24", "4/11", "4/24", "17/48")
cek(9 + 8 == 17 and 24 + 24 == 48)
soal("PB3", 3, "3/8 + 1/3 = ...", "D", [
    ("17/24", True, "Benar. KPK dari 8 dan 3 adalah 24; 3/8 = 9/24 dan 1/3 = 8/24, jadi 9/24 + 8/24 = 17/24.", ""),
    ("4/11", False, "Pembilang dijumlahkan dengan pembilang, penyebut dengan penyebut. Samakan penyebut dulu.", "SD5-M-B3-01"),
    ("4/24", False, "Penyebutnya sudah 24, tetapi pembilangnya tidak ikut dikali: 3 × 3 = 9 dan 1 × 8 = 8.", "SD5-M-B3-02"),
    ("17/48", False, "Penyebutnya sudah disamakan menjadi 24, lalu ikut dijumlahkan (24 + 24). Penyebut tetap 24.", "SD5-M-B3-01"),
], guna="Cek penguasaan", sulit="Sedang")
cek(P("2 2/3") + P("1 3/4") == P("4 5/12") and P("2/3") + P("3/4") == P("17/12") == P("1 5/12")
    and P("2 2/3") - P("1 3/4") == P("11/12"))
nilai_beda("PB4", "4 5/12", "3 5/12", "3 5/7", "11/12")
soal("PB4", 4, "2 2/3 + 1 3/4 = ...", "B", [
    ("4 5/12", True, "Benar. 2 + 1 = 3; 2/3 + 3/4 = 8/12 + 9/12 = 17/12 = 1 5/12; jadi 3 + 1 5/12 = 4 5/12.", ""),
    ("3 5/12", False, "17/12 sudah diubah menjadi 1 5/12, tetapi satu utuhnya tidak ditambahkan ke 3.", "SD5-M-B3-07"),
    ("3 5/7", False, "Pecahannya dijumlahkan pembilang dengan pembilang dan penyebut dengan penyebut (2 + 3)/(3 + 4).", "SD5-M-B3-01"),
    ("11/12", False, "Ini hasil pengurangan 2 2/3 − 1 3/4. Tanda + berarti dijumlahkan.", "SD5-M-B3-12"),
], guna="Cek penguasaan", sulit="Sedang")
cek(P("5/6") - P("1/4") == P("7/12") and tanpa_samakan("5/6", "1/4", kurang) == "4/2"
    and penyebut_saja("5/6", "1/4", kurang) == "4/12" and P("5/6") + P("1/4") == P("1 1/12"))
nilai_beda("PB5", "7/12", "4/2", "4/12", "1 1/12")
soal("PB5", 5, "5/6 − 1/4 = ...", "C", [
    ("7/12", True, "Benar. KPK dari 6 dan 4 adalah 12; 10/12 − 3/12 = 7/12.", ""),
    ("4/2", False, "Pembilang dikurangi pembilang dan penyebut dikurangi penyebut, (5 − 1)/(6 − 4). Samakan penyebut dulu.", "SD5-M-B3-01"),
    ("4/12", False, "Penyebutnya sudah 12, tetapi pembilangnya tidak ikut dikali: 5 × 2 = 10 dan 1 × 3 = 3.", "SD5-M-B3-02"),
    ("1 1/12", False, "Ini hasil penjumlahan 10/12 + 3/12. Tanda − berarti dikurangkan.", "SD5-M-B3-12"),
], guna="Cek penguasaan", sulit="Sedang")
cek(P("4 1/5") - P("1 1/2") == P("2 7/10") and P("4 1/5") == P("4 2/10") == 3 + P("12/10")
    and P("1/2") - P("1/5") == P("3/10") and P("4 1/5") + P("1 1/2") == P("5 7/10"))
nilai_beda("PB6", "2 7/10", "3 3/10", "3 7/10", "5 7/10")
soal("PB6", 6, "4 1/5 − 1 1/2 = ...", "A", [
    ("2 7/10", True, "Benar. 4 2/10 − 1 5/10: pinjam 1 utuh, 3 12/10 − 1 5/10 = 2 7/10.", ""),
    ("3 3/10", False, "Pecahannya dibalik menjadi 5/10 − 2/10, supaya tidak perlu meminjam. 2/10 lebih kecil dari 5/10, jadi pinjam 1 utuh.", "SD5-M-B3-08"),
    ("3 7/10", False, "Sudah meminjam 1 utuh (12/10 − 5/10 = 7/10), tetapi bilangan utuhnya tidak dikurangi satu: 3 − 1 = 2.", "SD5-M-B3-08"),
    ("5 7/10", False, "Ini hasil penjumlahan. Tanda − berarti dikurangkan.", "SD5-M-B3-12"),
], guna="Cek penguasaan", sulit="Sedang")
cek(P("3/4") - P("1/3") == P("5/12") and tanpa_samakan("3/4", "1/3", kurang) == "2/1"
    and penyebut_saja("3/4", "1/3", kurang) == "2/12" and P("3/4") + P("1/3") == P("1 1/12"))
nilai_beda("PB7", "5/12", "2/1", "2/12", "1 1/12")
soal("PB7", 6, "Ibu mempunyai 3/4 kg gula. Sebanyak 1/3 kg dipakai untuk membuat kue. Berapa kilogram sisa gulanya?", "B", [
    ("5/12 kg", True, "Benar. 3/4 − 1/3 = 9/12 − 4/12 = 5/12 kg.", ""),
    ("2/1 kg", False, "Pembilang dikurangi pembilang dan penyebut dikurangi penyebut. Sisanya tidak mungkin lebih banyak dari gula semula.", "SD5-M-B3-01"),
    ("2/12 kg", False, "Penyebutnya sudah 12, tetapi pembilangnya tidak ikut dikali: 3/4 = 9/12 dan 1/3 = 4/12.", "SD5-M-B3-02"),
    ("1 1/12 kg", False, "Gulanya dijumlahkan. Sisa berarti dikurangi.", "SD5-M-B3-12"),
], guna="Cek penguasaan", sulit="Sedang")
cek(6 - (P("2 1/3") + P("1 1/2")) == P("2 1/6") and P("2 1/3") + P("1 1/2") == P("3 5/6") and 6 - P("2 1/3") == P("3 2/3"))
cek(6 - 3 + (1 - P("5/6")) == P("3 1/6") and 6 == 5 + P("6/6"))
nilai_beda("PB8", "2 1/6", "3 5/6", "3 2/3", "3 1/6")
soal("PB8", 6, "Kak Maya mempunyai pita sepanjang 6 m. Ia memotong 2 1/3 m untuk Rani dan 1 1/2 m untuk Sita. Berapa meter sisa pitanya?", "D", [
    ("2 1/6 m", True, "Benar. Yang dipotong 2 2/6 + 1 3/6 = 3 5/6 m, jadi sisanya 5 6/6 − 3 5/6 = 2 1/6 m.", ""),
    ("3 5/6 m", False, "Ini panjang pita yang dipotong, hasil langkah pertama. Yang ditanyakan sisanya.", "SD5-M-B3-12"),
    ("3 2/3 m", False, "Hanya potongan untuk Rani yang dikurangkan. Potongan untuk Sita juga harus dikurangkan.", "SD5-M-B3-12"),
    ("3 1/6 m", False, "6 − 3 = 3, lalu 1/6 diambil dari 6/6 − 5/6. Setelah meminjam 1 utuh, bilangan utuhnya tinggal 5 − 3 = 2.", "SD5-M-B3-08"),
], guna="Cek penguasaan", sulit="Sulit")

# ── Latihan (practice), by lesson, from direct use toward a little more reasoning.
cek(P("3/4") == P("9/12") and P("5/6") != P("3/4") and P("3/8") != P("3/4") and P("6/12") != P("3/4") and (3 * 2, 4 * 3) == (6, 12))
soal("LT1", 1, "Pecahan yang senilai dengan 3/4 adalah ...", "C", [
    ("9/12", True, "Benar. Pembilang dan penyebut dikali 3: (3 × 3)/(4 × 3) = 9/12.", ""),
    ("5/6", False, "Pembilang dan penyebut ditambah 2. Pecahan senilai dibuat dengan mengali.", "SD5-M-B3-09"),
    ("3/8", False, "Hanya penyebutnya yang dikali 2; pembilangnya juga harus dikali 2, menjadi 6/8.", "SD5-M-B3-09"),
    ("6/12", False, "Pembilang dikali 2 tetapi penyebut dikali 3. Keduanya harus dikali dengan bilangan yang sama.", "SD5-M-B3-09"),
])
cek(gcd(18, 24) == 6 and P("18/24") == P("3/4") and P("9/12") == P("3/4") and P("6/8") == P("3/4") and P("3/24") != P("3/4"))
soal("LT2", 1, "Bentuk paling sederhana dari 18/24 adalah ...", "B", [
    ("3/4", True, "Benar. FPB dari 18 dan 24 adalah 6; 18 : 6 = 3 dan 24 : 6 = 4.", ""),
    ("9/12", False, "Dibagi 2, faktor persekutuan yang bukan terbesar. 9/12 masih bisa dibagi 3.", "SD5-M-B3-10"),
    ("6/8", False, "Dibagi 3, faktor persekutuan yang bukan terbesar. 6/8 masih bisa dibagi 2.", "SD5-M-B3-10"),
    ("3/24", False, "Hanya pembilangnya yang dibagi 6. Penyebut juga harus dibagi dengan bilangan yang sama.", "SD5-M-B3-09"),
])
cek(P("3 2/5") == P("17/5") and 3 * 5 + 2 == 17 and P("5/5") != P("17/5") and P("6/5") != P("17/5"))
soal("LT3", 1, "3 2/5 jika ditulis sebagai pecahan biasa adalah ...", "D", [
    ("17/5", True, "Benar. 3 utuh = 15/5, ditambah 2/5 menjadi 17/5.", ""),
    ("5/5", False, "Bilangan utuh 3 hanya dijumlahkan dengan pembilang 2. Setiap utuh bernilai 5/5, jadi 3 utuh = 15/5.", "SD5-M-B3-06"),
    ("6/5", False, "Bilangan utuh dikali pembilang (3 × 2). Yang dikali seharusnya penyebutnya: 3 × 5 = 15.", "SD5-M-B3-06"),
    ("17/15", False, "Penyebutnya ikut dikali 3. Penyebut tetap 5, karena ukuran bagiannya tetap seperlima.", "SD5-M-B3-06"),
])
cek(divmod(11, 4) == (2, 3) and P("11/4") == P("2 3/4") and P("1 7/4") == P("11/4") and P("3 2/4") != P("11/4") and P("2 3/11") != P("11/4"))
soal("LT4", 1, "11/4 jika ditulis sebagai pecahan campuran adalah ...", "A", [
    ("2 3/4", True, "Benar. 11 : 4 = 2 sisa 3; hasil bagi menjadi bilangan utuh, sisa menjadi pembilang.", ""),
    ("3 2/4", False, "Hasil bagi dan sisanya tertukar. 11 : 4 = 2 sisa 3, jadi utuhnya 2 dan pembilangnya 3.", "SD5-M-B3-06"),
    ("1 7/4", False, "Baru satu utuh yang dikeluarkan; 7/4 masih lebih dari 1 dan harus dijadikan utuh lagi.", "SD5-M-B3-07"),
    ("2 3/11", False, "Penyebutnya diganti menjadi 11. Penyebut tetap 4.", "SD5-M-B3-06"),
])
cek(max(P("1/3"), P("1/5"), P("1/8"), P("1/10")) == P("1/3"))
soal("LT5", 2, "Manakah pecahan yang paling besar?", "C", [
    ("1/3", True, "Benar. Semua pembilangnya 1, jadi bagian terbesar adalah yang dibagi paling sedikit, yaitu 3.", ""),
    ("1/10", False, "Penyebut 10 paling besar, tetapi dibagi 10 menghasilkan bagian yang paling kecil.", "SD5-M-B3-03"),
    ("1/8", False, "Dibagi 8 menghasilkan bagian yang lebih kecil dari dibagi 3.", "SD5-M-B3-03"),
    ("1/5", False, "Seperlima lebih kecil dari sepertiga, karena dibagi menjadi lebih banyak bagian.", "SD5-M-B3-03"),
])
cek(sorted([P("2/3"), P("3/4"), P("5/8")]) == [P("5/8"), P("2/3"), P("3/4")] and (P("5/8"), P("2/3"), P("3/4")) == (P("15/24"), P("16/24"), P("18/24")))
soal("LT6", 2, "Urutan 2/3, 3/4, dan 5/8 dari yang terkecil adalah ...", "B", [
    ("5/8; 2/3; 3/4", True, "Benar. Dengan penyebut 24: 5/8 = 15/24, 2/3 = 16/24, 3/4 = 18/24.", ""),
    ("3/4; 2/3; 5/8", False, "Ini urutan dari yang terbesar. Yang diminta dari yang terkecil.", "SD5-M-B3-13"),
    ("2/3; 3/4; 5/8", False, "Diurutkan dari pembilangnya (2, 3, 5), padahal penyebutnya berbeda. Samakan penyebut dulu.", "SD5-M-B3-04"),
    ("5/8; 3/4; 2/3", False, "Diurutkan dari penyebutnya: penyebut besar dianggap kecil. Setelah disamakan, 2/3 = 16/24 lebih kecil dari 3/4 = 18/24.", "SD5-M-B3-03"),
], sulit="Sedang", petunjuk="Samakan dulu ketiga penyebutnya dengan KPK dari 3, 4, dan 8.")
cek(sorted([P("1 3/4"), P("2 1/6"), P("1 2/3")]) == [P("1 2/3"), P("1 3/4"), P("2 1/6")] and P("2/3") == P("8/12") and P("3/4") == P("9/12"))
cek(sorted([P("3/4"), P("1/6"), P("2/3")]) == [P("1/6"), P("2/3"), P("3/4")])
soal("LT7", 2, "Urutan tali 1 3/4 m, 2 1/6 m, dan 1 2/3 m dari yang terpendek adalah ...", "D", [
    ("1 2/3 m; 1 3/4 m; 2 1/6 m", True, "Benar. 2 1/6 paling panjang karena utuhnya 2. Lalu 2/3 = 8/12 < 3/4 = 9/12.", ""),
    ("2 1/6 m; 1 2/3 m; 1 3/4 m", False, "Hanya pecahannya yang diurutkan (1/6 < 2/3 < 3/4); bilangan utuh 2 diabaikan.", "SD5-M-B3-05"),
    ("2 1/6 m; 1 3/4 m; 1 2/3 m", False, "Ini urutan dari yang terpanjang. Yang diminta dari yang terpendek.", "SD5-M-B3-13"),
    ("1 3/4 m; 1 2/3 m; 2 1/6 m", False, "3/4 dianggap lebih kecil dari 2/3 karena penyebut 4 lebih besar. Setelah disamakan, 3/4 = 9/12 lebih dari 2/3 = 8/12.", "SD5-M-B3-03"),
], sulit="Sedang")
cek(P("2/9") + P("5/9") == P("7/9") and tanpa_samakan("2/9", "5/9", tambah) == "7/18" and P("5/9") - P("2/9") == P("3/9"))
nilai_beda("LT8", "7/9", "7/18", "3/9", "10/81")
soal("LT8", 3, "2/9 + 5/9 = ...", "A", [
    ("7/9", True, "Benar. Penyebutnya sama; 2 + 5 = 7, penyebut tetap 9.", ""),
    ("7/18", False, "Penyebutnya ikut dijumlahkan. Ukuran bagiannya tetap sepersembilan.", "SD5-M-B3-01"),
    ("3/9", False, "Pembilangnya dikurangkan (5 − 2). Tanda + berarti dijumlahkan.", "SD5-M-B3-12"),
    ("10/81", False, "Pembilang dan penyebut dikalikan. Pada penjumlahan, pembilangnya dijumlahkan dan penyebutnya tetap.", "SD5-M-B3-12"),
])
cek(P("1/6") + P("3/4") == P("11/12") and tanpa_samakan("1/6", "3/4", tambah) == "4/10"
    and penyebut_saja("1/6", "3/4", tambah) == "4/12" and 1 + 9 == 10)
nilai_beda("LT9", "11/12", "4/10", "4/12", "10/12")
soal("LT9", 3, "1/6 + 3/4 = ...", "C", [
    ("11/12", True, "Benar. KPK dari 6 dan 4 adalah 12; 1/6 = 2/12 dan 3/4 = 9/12, jadi 2/12 + 9/12 = 11/12.", ""),
    ("4/10", False, "Pembilang dijumlahkan dengan pembilang dan penyebut dengan penyebut. Samakan penyebut dulu.", "SD5-M-B3-01"),
    ("4/12", False, "Penyebutnya sudah 12, tetapi kedua pembilangnya tidak ikut dikali.", "SD5-M-B3-02"),
    ("10/12", False, "3/4 sudah diubah menjadi 9/12, tetapi 1/6 tidak: pembilangnya harus dikali 2 menjadi 2/12.", "SD5-M-B3-02"),
])
cek(P("5/8") + P("7/8") == P("1 1/2") and P("12/8") == P("1 1/2") and tanpa_samakan("5/8", "7/8", tambah) == "12/16"
    and P("7/8") - P("5/8") == P("2/8"))
nilai_beda("LT10", "1 1/2", "12/16", "2/8", "1 1/4")
soal("LT10", 3, "5/8 + 7/8 = ... (dalam bentuk paling sederhana)", "B", [
    ("1 1/2", True, "Benar. 5/8 + 7/8 = 12/8 = 1 4/8 = 1 1/2.", ""),
    ("12/16", False, "Penyebutnya ikut dijumlahkan. Penyebut tetap 8.", "SD5-M-B3-01"),
    ("2/8", False, "Pembilangnya dikurangkan (7 − 5). Tanda + berarti dijumlahkan.", "SD5-M-B3-12"),
    ("1 1/4", False, "12/8 sudah menjadi 1 4/8, tetapi 4/8 disederhanakan menjadi 1/4. FPB dari 4 dan 8 adalah 4, jadi 4/8 = 1/2.", "SD5-M-B3-10"),
], sulit="Sedang")
cek(P("1/3") + P("2/5") == P("11/15") and tanpa_samakan("1/3", "2/5", tambah) == "3/8"
    and penyebut_saja("1/3", "2/5", tambah) == "3/15" and P("2/5") - P("1/3") == P("1/15"))
nilai_beda("LT11", "11/15", "11/30", "3/15", "1/15")
cek(5 + 6 == 11 and 15 + 15 == 30)
soal("LT11", 3, "Dina minum 1/3 liter susu di pagi hari dan 2/5 liter di sore hari. Berapa liter susu yang diminum Dina hari itu?", "D", [
    ("11/15 liter", True, "Benar. 1/3 + 2/5 = 5/15 + 6/15 = 11/15 liter.", ""),
    ("11/30 liter", False, "Penyebutnya sudah disamakan menjadi 15, lalu ikut dijumlahkan (15 + 15). Penyebut tetap 15.", "SD5-M-B3-01"),
    ("3/15 liter", False, "Penyebutnya sudah 15, tetapi pembilangnya tidak ikut dikali: 1 × 5 = 5 dan 2 × 3 = 6.", "SD5-M-B3-02"),
    ("1/15 liter", False, "Susunya dikurangkan. Pagi dan sore digabung, jadi dijumlahkan.", "SD5-M-B3-12"),
], sulit="Sedang")
cek(P("1 2/5") + P("2 1/5") == P("3 3/5") and P("2 1/5") - P("1 2/5") == P("4/5") and P("3/5") != P("3 3/5"))
nilai_beda("LT12", "3 3/5", "3 3/10", "3/5", "4/5")
soal("LT12", 4, "1 2/5 + 2 1/5 = ...", "A", [
    ("3 3/5", True, "Benar. 1 + 2 = 3 dan 2/5 + 1/5 = 3/5.", ""),
    ("3 3/10", False, "Penyebutnya ikut dijumlahkan. Penyebut tetap 5.", "SD5-M-B3-01"),
    ("3/5", False, "Hanya pecahannya yang dijumlahkan; bilangan utuh 1 dan 2 terlewat.", "SD5-M-B3-05"),
    ("4/5", False, "Ini hasil pengurangan 2 1/5 − 1 2/5. Tanda + berarti dijumlahkan.", "SD5-M-B3-12"),
])
cek(P("1 3/4") + P("2 1/2") == P("4 1/4") and P("3/4") + P("2/4") == P("5/4") and P("2 1/2") - P("1 3/4") == P("3/4"))
nilai_beda("LT13", "4 1/4", "3 1/4", "3 4/6", "3/4")
soal("LT13", 4, "Sebuah paket beratnya 1 3/4 kg dan paket lain 2 1/2 kg. Berapa berat kedua paket?", "C", [
    ("4 1/4 kg", True, "Benar. 1 + 2 = 3; 3/4 + 2/4 = 5/4 = 1 1/4; jadi 3 + 1 1/4 = 4 1/4 kg.", ""),
    ("3 1/4 kg", False, "5/4 sudah menjadi 1 1/4, tetapi satu utuhnya tidak ditambahkan ke 3.", "SD5-M-B3-07"),
    ("3 4/6 kg", False, "Pecahannya dijumlahkan pembilang dengan pembilang dan penyebut dengan penyebut (3 + 1)/(4 + 2).", "SD5-M-B3-01"),
    ("3/4 kg", False, "Ini selisih kedua paket. Berat kedua paket berarti dijumlahkan.", "SD5-M-B3-12"),
], sulit="Sedang")
cek(P("5/6") - P("1/3") == P("1/2") and tanpa_samakan("5/6", "1/3", kurang) == "4/3"
    and P("5/6") - P("1/6") == P("4/6") and P("5/6") + P("1/3") == P("7/6"))
nilai_beda("LT14", "1/2", "4/3", "4/6", "7/6")
soal("LT14", 5, "5/6 − 1/3 = ... (dalam bentuk paling sederhana)", "B", [
    ("1/2", True, "Benar. 1/3 = 2/6, jadi 5/6 − 2/6 = 3/6 = 1/2.", ""),
    ("4/3", False, "Pembilang dikurangi pembilang dan penyebut dikurangi penyebut, (5 − 1)/(6 − 3).", "SD5-M-B3-01"),
    ("4/6", False, "1/3 dianggap 1/6: penyebutnya diubah menjadi 6 tanpa mengali pembilangnya.", "SD5-M-B3-02"),
    ("7/6", False, "Ini hasil penjumlahan 5/6 + 2/6. Tanda − berarti dikurangkan.", "SD5-M-B3-12"),
])
cek(P("3/4") - P("2/5") == P("7/20") and tanpa_samakan("3/4", "2/5", kurang) == "1/-1" and (3 - 2, 5 - 4) == (1, 1)
    and penyebut_saja("3/4", "2/5", kurang) == "1/20" and P("3/4") + P("2/5") == P("23/20"))
nilai_beda("LT15", "7/20", "1/1", "1/20", "23/20")
soal("LT15", 5, "3/4 − 2/5 = ...", "D", [
    ("7/20", True, "Benar. KPK dari 4 dan 5 adalah 20; 15/20 − 8/20 = 7/20.", ""),
    ("1/1", False, "Pembilang dikurangi pembilang (3 − 2) dan penyebut besar dikurangi yang kecil (5 − 4).", "SD5-M-B3-01"),
    ("1/20", False, "Penyebutnya sudah 20, tetapi pembilangnya tidak ikut dikali: 3 × 5 = 15 dan 2 × 4 = 8.", "SD5-M-B3-02"),
    ("23/20", False, "Ini hasil penjumlahan 15/20 + 8/20. Tanda − berarti dikurangkan.", "SD5-M-B3-12"),
], sulit="Sedang")
cek(P("3 1/4") - P("1 1/2") == P("1 3/4") and P("1/2") - P("1/4") == P("1/4") and 3 - 1 == 2 and P("5/4") - P("2/4") == P("3/4")
    and P("3 1/4") + P("1 1/2") == P("4 3/4"))
nilai_beda("LT16", "1 3/4", "2 1/4", "2 3/4", "4 3/4")
soal("LT16", 6, "3 1/4 − 1 1/2 = ...", "A", [
    ("1 3/4", True, "Benar. 3 1/4 − 1 2/4: pinjam 1 utuh, 2 5/4 − 1 2/4 = 1 3/4.", ""),
    ("2 1/4", False, "Pecahannya dibalik menjadi 2/4 − 1/4 supaya tidak perlu meminjam. 1/4 lebih kecil dari 2/4, jadi pinjam 1 utuh.", "SD5-M-B3-08"),
    ("2 3/4", False, "Sudah meminjam 1 utuh (5/4 − 2/4 = 3/4), tetapi bilangan utuhnya tidak dikurangi satu: 2 − 1 = 1.", "SD5-M-B3-08"),
    ("4 3/4", False, "Ini hasil penjumlahan. Tanda − berarti dikurangkan.", "SD5-M-B3-12"),
], sulit="Sedang", petunjuk="Samakan penyebutnya dulu, lalu periksa apakah pecahan pertama cukup untuk dikurangi.")
cek(2 - P("3/4") == P("1 1/4") and 2 + P("3/4") == P("2 3/4") and P("1/4") != P("1 1/4") and P("1 3/4") != P("1 1/4"))
soal("LT17", 6, "Sebuah botol berisi 2 liter air. Sebanyak 3/4 liter diminum. Berapa liter air yang tersisa?", "B", [
    ("1 1/4 liter", True, "Benar. 2 = 1 4/4, jadi 1 4/4 − 3/4 = 1 1/4 liter.", ""),
    ("2 3/4 liter", False, "Airnya dijumlahkan. Yang diminum berkurang, jadi dikurangi.", "SD5-M-B3-12"),
    ("1 3/4 liter", False, "Setelah meminjam 1 utuh (4/4), yang ditulis 3/4, padahal 4/4 − 3/4 = 1/4.", "SD5-M-B3-08"),
    ("1/4 liter", False, "Pecahannya benar, tetapi bilangan utuh 1 yang tersisa terlewat.", "SD5-M-B3-05"),
])
cek(P("1/2") + P("1/3") == P("5/6") and tanpa_samakan("1/2", "1/3", tambah) == "2/5" and P("3/4") < P("5/6") and P("2 1/3") == P("7/3"))
soal("LT18", 6, "Pernyataan manakah yang tepat?", "C", [
    ("1/2 + 1/3 = 5/6", True, "Tepat. 3/6 + 2/6 = 5/6.", ""),
    ("1/2 + 1/3 = 2/5", False, "Pembilang dijumlahkan dengan pembilang dan penyebut dengan penyebut. Hasilnya 5/6.", "SD5-M-B3-01"),
    ("3/4 > 5/6, karena penyebut 4 lebih kecil", False, "Penyebut yang lebih kecil tidak menentukan bila pembilangnya berbeda. 3/4 = 9/12 < 5/6 = 10/12.", "SD5-M-B3-03"),
    ("2 1/3 = 3/3", False, "Bilangan utuh 2 hanya dijumlahkan dengan pembilang. 2 utuh = 6/3, jadi 2 1/3 = 7/3.", "SD5-M-B3-06"),
], sulit="Sedang")

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

# The post-test uses fresh numbers: the fractions a post-test question works on are not a problem a
# lesson works through, nor the book's (the ribbons of p. 104); and no post-test answer is one of
# the Uji Kompetensi keys of p. 110 (3/5, 13/60, 7/40, 1), whose questions this guide does not give.
FR = re.compile(r"\d+ \d+/\d+|\d+/\d+")
SOAL_PELAJARAN = {frozenset(x) for x in [
    ("5/8",), ("3/4", "6/8"), ("12/18",), ("2 1/4",), ("7/3",), ("3/7", "5/7"), ("1/4", "1/8"), ("2/3", "3/4"),
    ("2 1/2", "2 1/4", "2 2/5"), ("2/7", "3/7"), ("1/4", "2/3"), ("1/6", "1/3"), ("3/8", "5/8"), ("1 1/5", "2 3/5"),
    ("1 5/6", "2 1/3"), ("5/7", "2/7"), ("3 1/3", "1 2/3"), ("1/4",), ("2 1/2", "3/4"), ("1 1/2", "3/4")]}
KUNCI_BUKU = {P("3/5"), P("13/60"), P("7/40"), P("1")}
for s in POST:
    soalnya = frozenset(FR.findall(s["tanya"]))
    cek(soalnya not in SOAL_PELAJARAN, f"{s['ref']}: {sorted(soalnya)} is worked in a lesson")
    benar = next(t for t, b, _, _ in s["pilihan"] if b)
    m = re.match(r"\d+ \d+/\d+|\d+/\d+", benar)
    if m and ";" not in benar:
        cek(P(m[0]) not in KUNCI_BUKU, f"{s['ref']}: the answer {m[0]} is one of the book's keys")


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
                c.number_format = "@"   # fractions stay text: Excel must not turn 3/8 into a date

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
    tulis(os.path.join(here, "SD5-Matematika-Bab3.xlsx"))
    tulis_miskonsepsi(os.path.join(here, "SD5-Matematika-Bab3-miskonsepsi.csv"))
    halaman = sum(p["isi"].count("## ") for p in PELAJARAN)
    print(f"SD5-Matematika-Bab3.xlsx: lessons {len(PELAJARAN)} ({halaman} pages), questions {len(S)} "
          f"(pre {len(PRE)}, post {len(POST)}, practice {len(LAT)}), answers "
          + " ".join(f"{h}={HURUF[h]}" for h in "ABCD"))
    print(f"SD5-Matematika-Bab3-miskonsepsi.csv: {len(MISKONSEPSI)} codes")
    print(f"assertions passed: {CEK[0]}")
