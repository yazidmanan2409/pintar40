# SD Kelas 5, Matematika, Bab 9 "Bilangan Cacah sampai 1.000.000", as a PINTAR lesson workbook
# in the D-007 template (sheets Kursus, Bab, Pelajaran, Soal, Pilihan; the column contract is
# KOLOM in src/lib/unggah-kontrak.ts). Built the way Bab 1-8 were (all passed).
#
# Source: Buku Panduan Guru Matematika untuk SD/MI Kelas V (Meita Fitrianawati, Ika Surtiani,
# Ait Istiandaru; Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi, 2022), Bab 9,
# pp. 395-416. Lessons follow subbab A-C: A (membaca, menulis, nilai tempat) in two lessons, B
# (membandingkan, mengurutkan) in two, C (komposisi, dekomposisi) in one, and a last lesson on the
# story problems the overview and the Uji Kompetensi ask for.
#
# Every number word is written by `terbilang()`, which reproduces the book's readings before any
# question uses it; every slip a distractor names is computed by the function for that slip
# (`baca_ribu_ganda`, `tanpa_nol`, `lebih_besar_dari_belakang`, `kurang_terbalik`, ...).
#
# Text lessons only (D-050). The workbook's "Kode miskonsepsi" column stays empty; the proposed
# codes go to SD5-Matematika-Bab9-miskonsepsi.csv.
#
# Run: python3 docs/onboarding/konten/sd5_matematika_bab9.py
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


SATUAN = ["", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan"]
TEMPAT = ["satuan", "puluhan", "ratusan", "ribuan", "puluh ribuan", "ratus ribuan", "jutaan"]


def bawah_seribu(n):
    ratus, sisa = divmod(n, 100)
    kata = []
    if ratus:
        kata.append("seratus" if ratus == 1 else f"{SATUAN[ratus]} ratus")
    if sisa == 10:
        kata.append("sepuluh")
    elif sisa == 11:
        kata.append("sebelas")
    elif 12 <= sisa <= 19:
        kata.append(f"{SATUAN[sisa - 10]} belas")
    elif sisa >= 20:
        kata.append(f"{SATUAN[sisa // 10]} puluh" + (f" {SATUAN[sisa % 10]}" if sisa % 10 else ""))
    elif sisa:
        kata.append(SATUAN[sisa])
    return " ".join(kata)


def terbilang(n):
    if n == 1_000_000:
        return "satu juta"
    ribu, sisa = divmod(n, 1000)
    kata = []
    if ribu:
        kata.append("seribu" if ribu == 1 else f"{bawah_seribu(ribu)} ribu")
    if sisa:
        kata.append(bawah_seribu(sisa))
    return " ".join(kata)


def titik(n):
    return f"{n:,}".replace(",", ".")


def angka(teks):
    return int(teks.replace("Rp", "").replace(".", ""))


def nilai_tempat(n, d):
    """The places (from TEMPAT) where digit d stands in n."""
    return [TEMPAT[i] for i, c in enumerate(reversed(str(n))) if c == str(d)]


def nilai_angka(n, tempat):
    i = TEMPAT.index(tempat)
    return int(str(n)[::-1][i]) * 10 ** i


def urai(n):
    return [int(c) * 10 ** i for i, c in reversed(list(enumerate(reversed(str(n))))) if c != "0"]


# ── The slips, each as the child would make it ──
def baca_ribu_ganda(n):
    """The thousands group read in two parts, each with "ribu": 296.575 -> "dua ratus ribu
    sembilan puluh enam ribu ..." (the book's own slip, p. 403)."""
    ribu, sisa = divmod(n, 1000)
    ratus, puluh = divmod(ribu, 100)
    return f"{bawah_seribu(ratus * 100)} ribu {bawah_seribu(puluh)} ribu {bawah_seribu(sisa)}".strip()


def tanpa_nol(n):
    return int(str(n).replace("0", ""))


def lebih_besar_dari_belakang(a, b):
    """Compare from the last digit (the book's Miskonsepsi, p. 406)."""
    for x, y in zip(reversed(str(a).zfill(7)), reversed(str(b).zfill(7))):
        if x != y:
            return x > y
    return False


def lebih_besar_angka_depan(a, b):
    """Compare the first digits only, whatever the lengths."""
    return str(a)[0] > str(b)[0]


def kurang_terbalik(a, b):
    """Subtract the smaller digit from the larger in every column, never borrowing."""
    s, t = str(a).zfill(7), str(b).zfill(7)
    return int("".join(str(abs(int(x) - int(y))) for x, y in zip(s, t)))


# ── Book keys (checked; see handoff/LANA-09.md for the ones that are not right) ──
BACAAN_BUKU = {979875: "sembilan ratus tujuh puluh sembilan ribu delapan ratus tujuh puluh lima",       # p. 401
               179500: "seratus tujuh puluh sembilan ribu lima ratus",                                     # p. 403
               834759: "delapan ratus tiga puluh empat ribu tujuh ratus lima puluh sembilan",
               159899: "seratus lima puluh sembilan ribu delapan ratus sembilan puluh sembilan",
               132795: "seratus tiga puluh dua ribu tujuh ratus sembilan puluh lima",
               149641: "seratus empat puluh sembilan ribu enam ratus empat puluh satu",                    # p. 410
               345675: "tiga ratus empat puluh lima ribu enam ratus tujuh puluh lima",
               550303: "lima ratus lima puluh ribu tiga ratus tiga"}                                      # p. 411
cek(all(terbilang(n) == w for n, w in BACAAN_BUKU.items()))
# BOOK ERROR (p. 403): 296.575 is read "Dua ratus ribu sembilan puluh enam ribu lima ratus tujuh
# puluh lima", the thousands read twice. It is:
cek(terbilang(296575) == "dua ratus sembilan puluh enam ribu lima ratus tujuh puluh lima"
    and baca_ribu_ganda(296575) == "dua ratus ribu sembilan puluh enam ribu lima ratus tujuh puluh lima")
# BOOK ERROR (p. 411): Uji Kompetensi 1b is worded "Sembilan ratus ribu tiga puluh tiga ribu empat
# ratus tiga", the same slip; its key 933.403 is read:
cek(terbilang(933403) == "sembilan ratus tiga puluh tiga ribu empat ratus tiga" and baca_ribu_ganda(933403).startswith("sembilan ratus ribu tiga puluh tiga ribu"))
PRODUK = {"Speaker aktif": 296575, "Mouse": 179500, "Hardisk eksternal": 834759, "Headset": 159899, "Kabel USB": 132795}
cek([nilai_tempat(n, 9) for n in PRODUK.values()]
    == [["puluh ribuan"], ["ribuan"], ["satuan"], ["satuan", "puluhan", "ribuan"], ["puluhan"]])                  # p. 403
cek(445000 < 545000 and 657000 < 675000 and 876000 > 867000 and 876987 > 876789)                              # p. 406
cek([978500 + 1000 * i for i in range(5)] == [978500, 979500, 980500, 981500, 982500]
    and [300000 + 200000 * i for i in range(5)][-1] == 1_100_000 and [462350 + 20 * i for i in range(5)][-1] == 462430)
# Uji Kompetensi 4 (p. 410): a Benar, b Salah, c Salah, d keyed Salah, e Salah.
cek(275000 > 256000 and sorted([676785, 786897, 789876, 789867]) != [676785, 786897, 789876, 789867]
    and not 900025 > 900052 and 2 * 100000 + 3 * 1000 + 3 * 10 + 5 == 203035 != 203305)
# BOOK ERROR (p. 410): 4d reads "678.987 mempunyai komposisi enam ratus ribuan, tujuh puluh ribuan,
# delapan ribuan, sembilan ratusan, delapan puluhan dan tujuh satuan", which is true, yet it is keyed
# Salah. The rubric's copy (p. 413) says "delapan ratusan", which would make Salah right.
cek(urai(678987) == [600000, 70000, 8000, 900, 80, 7] and nilai_angka(678987, "ratusan") == 900 != 800)
# BOOK ERROR (pp. 410-413): the three Uji Kompetensi 3 keys (327.100, 505.401, 857.259) do not
# match the three questions:
cek(3 * 10000 + 7 * 1000 + 1 * 1000 == 38000 != 327100 and 3 * 10000 + 4 == 30004 != 505401
    and 2 * 10000 + 7 * 1000 + 9 * 100 == 27900 != 857259)
# Uji Kompetensi 5 (p. 411), the matching: every pair is right.
cek(450000 - (4 * 100000 + 4 * 10000 + 3 * 1000) == 7000 and max(345600, 354500) == 354500
    and 250000 - 15400 == 234600 and terbilang(567000) == "lima ratus enam puluh tujuh ribu")

# ── Lesson examples ─────────────────────────────────────────────────────────────
cek(len(str(1_000_000)) == 7 and terbilang(1_000_000) == "satu juta" and 99999 < 100000 and lebih_besar_angka_depan(99999, 100000))
cek(nilai_angka(296575, "puluh ribuan") == 90000 and nilai_tempat(296575, 9) == ["puluh ribuan"])
cek(900052 > 900025 and not lebih_besar_dari_belakang(876987, 876789) and 876987 > 876789)
cek(sorted([179500, 132795, 159899, 296575, 834759]) == [132795, 159899, 179500, 296575, 834759])
cek(tanpa_nol(550303) == 5533 and urai(203035) == [200000, 3000, 30, 5])

SUMBER = ("_Diadaptasi dari Buku Panduan Guru Matematika untuk SD/MI Kelas V, Kementerian Pendidikan, "
          "Kebudayaan, Riset, dan Teknologi, 2022, Bab 9._")

KURSUS = {
    "Judul kursus*": "Matematika Kelas 5 · Bab 9: Bilangan Cacah sampai 1.000.000",
    "Mata pelajaran*": "Matematika",
    "Jenjang*": "SD",
    "Kelas*": "Kelas 5",
    "Konteks": "Akademik",
}

BAB = [(1, "Bilangan Cacah sampai 1.000.000")]

TABEL_TEMPAT = "\n".join(
    f"| {nama} | {titik(n)} | " + " | ".join(str(n)) + " |" for nama, n in PRODUK.items())

PELAJARAN = [
    dict(no=1, judul="Membaca dan Menulis Bilangan sampai 1.000.000",
         ringkasan="Bilangan enam angka dibaca per kelompok tiga angka: kelompok ribuan dahulu dengan kata ribu, lalu kelompok sisanya.",
         tujuan="Kalian dapat membaca dan menulis bilangan cacah sampai 1.000.000.",
         bloom="Memahami",
         isi=f"""## Harga sebuah lemari

Nisa dan Ibu membeli lemari di Jepara, Jawa Tengah, kota yang terkenal dengan mebel berukir. Harga lemari yang dipilih Nisa **Rp979.875**.

Bilangan seperti ini sering kita temui pada harga, nota, atau jumlah penduduk. Bagaimana membacanya?

## Kelompok tiga angka

Titik memisahkan bilangan menjadi kelompok tiga angka, dihitung dari kanan:

979.875 → **979** | **875**

1. Baca kelompok kiri seperti bilangan ratusan biasa, lalu tambahkan kata **ribu**: sembilan ratus tujuh puluh sembilan ribu.
2. Baca kelompok kanan: delapan ratus tujuh puluh lima.

Jadi 979.875 dibaca **{terbilang(979875)}**.

Kata "ribu" hanya diucapkan **satu kali**, sesudah kelompok kiri. Membaca 296.575 sebagai "dua ratus ribu sembilan puluh enam ribu ..." tidak tepat; yang tepat **{terbilang(296575)}**.

## Angka nol

Angka nol tidak diucapkan, tetapi tempatnya tetap ada.

- 550.303 dibaca {terbilang(550303)}.
- 406.250 dibaca {terbilang(406250)}.

Waktu menulis dari kata-kata, setiap kelompok harus tetap tiga angka. "Lima ratus lima puluh ribu tiga ratus tiga" ditulis 550.**303**, bukan 550.33.

## Menulis dari kata-kata

Tulis "seratus empat puluh sembilan ribu enam ratus empat puluh satu":

1. Yang sebelum "ribu": seratus empat puluh sembilan → 149.
2. Yang sesudah "ribu": enam ratus empat puluh satu → 641.
3. Gabungkan: **149.641**.

## Satu juta

Sesudah 999.999 datang **1.000.000**, dibaca **satu juta** atau sejuta. Bilangan ini mempunyai tujuh angka: satu angka 1 dan enam angka 0.

**Coba:** tulislah "tiga ratus empat puluh lima ribu enam ratus tujuh puluh lima".
_Periksa: 345.675._

{SUMBER}"""),
    dict(no=2, judul="Nilai Tempat",
         ringkasan="Setiap angka dalam bilangan mempunyai tempat (satuan sampai ratus ribuan) dan nilai: angka itu dikalikan dengan nilai tempatnya.",
         tujuan="Kalian dapat menentukan nilai tempat dan nilai angka pada bilangan cacah sampai 1.000.000.",
         bloom="Memahami",
         isi=f"""## Enam tempat

Bilangan enam angka mempunyai enam tempat. Dari kiri ke kanan:

**ratus ribuan, puluh ribuan, ribuan, ratusan, puluhan, satuan**

Harga beberapa barang di toko komputer:

| Barang | Harga (Rp) | Ratus ribuan | Puluh ribuan | Ribuan | Ratusan | Puluhan | Satuan |
|---|---|---|---|---|---|---|---|
{TABEL_TEMPAT}

## Tempat sebuah angka

Di mana angka 9 pada harga speaker aktif, 296.575? Angka 9 berada di tempat **puluh ribuan**.

Pada harga headset, 159.899, angka 9 muncul tiga kali: di tempat ribuan, puluhan, dan satuan. Angka yang sama dapat menempati tempat yang berbeda.

## Nilai sebuah angka

**Nilai** angka adalah angka itu dikalikan dengan nilai tempatnya.

- Pada 296.575, angka 9 di puluh ribuan: nilainya 9 × 10.000 = **90.000**.
- Pada 159.899, angka 9 di ribuan bernilai 9.000, di puluhan bernilai 90, di satuan bernilai 9.

Bedakan tiga hal ini: **angkanya** (9), **tempatnya** (puluh ribuan), dan **nilainya** (90.000).

## Nilai tempat berlipat sepuluh

Setiap tempat bernilai sepuluh kali tempat di sebelah kanannya:

1 → 10 → 100 → 1.000 → 10.000 → 100.000 → 1.000.000

Karena itu, memindahkan sebuah angka satu tempat ke kiri membuat nilainya sepuluh kali lebih besar.

**Coba:** berapa nilai angka 8 pada 834.759?
_Periksa: angka 8 di ratus ribuan, jadi 800.000._

{SUMBER}"""),
    dict(no=3, judul="Membandingkan Bilangan",
         ringkasan="Bandingkan banyak angkanya dahulu; bila sama, bandingkan angka demi angka mulai dari yang paling kiri.",
         tujuan="Kalian dapat membandingkan dua bilangan cacah sampai 1.000.000 dengan tanda <, >, atau =.",
         bloom="Menerapkan",
         isi=f"""## Tiga tanda

- **<** artinya lebih kecil dari: 445.000 < 545.000.
- **>** artinya lebih besar dari: 876.000 > 867.000.
- **=** artinya sama dengan: 126.789 = 126.789.

Ujung lancip tanda selalu menunjuk ke bilangan yang lebih kecil.

## Langkah 1: banyak angkanya

Bilangan yang angkanya lebih banyak selalu lebih besar.

99.999 mempunyai lima angka, 100.000 mempunyai enam angka. Jadi 99.999 < 100.000, walaupun angka pertamanya 9 dan angka pertama 100.000 hanya 1.

## Langkah 2: dari kiri

Bila banyak angkanya sama, bandingkan angka demi angka **mulai dari kiri** (ratus ribuan), sampai menemukan angka yang berbeda.

657.000 dan 675.000:

1. Ratus ribuan: 6 dan 6, sama.
2. Puluh ribuan: 5 dan 7, berbeda. 5 < 7.

Jadi 657.000 < 675.000. Angka-angka sesudahnya tidak perlu diperiksa lagi.

## Jangan mulai dari belakang

876.987 dan 876.789: ratus ribuan, puluh ribuan, dan ribuan sama (8, 7, 6). Pada ratusan, 9 > 7. Jadi **876.987 > 876.789**.

Bila dibandingkan dari belakang, angka satuannya 7 dan 9, seolah-olah 876.789 yang lebih besar. Angka belakang bernilai paling kecil, jadi tidak menentukan.

Begitu pula 900.052 > 900.025: yang menentukan adalah puluhan, 5 > 2.

**Coba:** 900.025 ... 900.052, tanda apa yang tepat?
_Periksa: <, karena pada puluhan 2 < 5._

{SUMBER}"""),
    dict(no=4, judul="Mengurutkan Bilangan dan Pola Bilangan",
         ringkasan="Mengurutkan berarti membandingkan beberapa bilangan sekaligus; pada pola bilangan, selisih dua bilangan yang berurutan selalu sama.",
         tujuan="Kalian dapat mengurutkan bilangan cacah sampai 1.000.000 dan melanjutkan pola bilangan.",
         bloom="Menerapkan",
         isi=f"""## Dari yang termurah

Urutkan harga barang dari yang termurah: Rp296.575, Rp179.500, Rp834.759, Rp159.899, Rp132.795.

1. Semua mempunyai enam angka. Lihat ratus ribuannya: 2, 1, 8, 1, 1.
2. Yang ratus ribuannya 1 ada tiga: 179.500, 159.899, 132.795. Bandingkan puluh ribuannya: 7, 5, 3.
3. Urutannya: **132.795; 159.899; 179.500; 296.575; 834.759**.

Termurah kabel USB (Rp132.795), termahal hardisk eksternal (Rp834.759).

## Naik atau turun

- Urutan **naik**: dari yang terkecil ke yang terbesar.
- Urutan **turun**: dari yang terbesar ke yang terkecil.

Baca pertanyaannya dengan teliti, lalu periksa bilangan pertama: pada urutan naik, bilangan pertama harus yang terkecil.

## Pola bilangan

978.500; 979.500; 980.500; ...

Selisih dua bilangan yang berurutan: 979.500 − 978.500 = 1.000. Setiap langkah bertambah 1.000, jadi berikutnya **981.500**, lalu 982.500.

Perhatikan loncatan dari 979.500 ke 980.500: angka ribuan 9 menjadi 0, dan puluh ribuan bertambah satu.

## Pola dengan langkah kecil

462.350; 462.370; 462.390; ...

Setiap langkah bertambah 20, jadi berikutnya **462.410**, lalu 462.430. Yang berubah hanya puluhan dan ratusan.

**Coba:** pola 300.000; 500.000; 700.000; ... Berapa bilangan berikutnya?
_Periksa: bertambah 200.000, jadi 900.000._

{SUMBER}"""),
    dict(no=5, judul="Komposisi dan Dekomposisi Bilangan",
         ringkasan="Menyusun bilangan dari nilai-nilai tempatnya (komposisi) dan menguraikan bilangan menjadi nilai-nilai tempatnya (dekomposisi); uang pecahan membantu.",
         tujuan="Kalian dapat menyusun dan menguraikan bilangan cacah sampai 1.000.000, termasuk dengan pecahan uang.",
         bloom="Menerapkan",
         isi=f"""## Menguraikan bilangan

**Dekomposisi** berarti menguraikan bilangan menurut nilai tempatnya.

678.987 = 600.000 + 70.000 + 8.000 + 900 + 80 + 7

Artinya 678.987 terdiri atas 6 ratus ribuan, 7 puluh ribuan, 8 ribuan, 9 ratusan, 8 puluhan, dan 7 satuan.

## Menyusun bilangan

**Komposisi** berarti menyusun bilangan dari bagian-bagiannya.

2 ratus ribuan, 3 ribuan, 3 puluhan, dan 5 satuan:

| Ratus ribuan | Puluh ribuan | Ribuan | Ratusan | Puluhan | Satuan |
|---|---|---|---|---|---|
| 2 | 0 | 3 | 0 | 3 | 5 |

Hasilnya **203.035**. Tempat yang kosong diisi 0. Hati-hati: bukan 203.305, karena 3 puluhan berada di tempat puluhan, bukan ratusan.

## Dengan uang pecahan

Ibu mempunyai 4 lembar seratus ribuan, 4 lembar sepuluh ribuan, dan 3 lembar seribuan.

- 4 × 100.000 = 400.000
- 4 × 10.000 = 40.000
- 3 × 1.000 = 3.000

Jumlahnya **Rp443.000**. Banyak lembar (4, 4, 3) bukan nilai uangnya; setiap lembar dikalikan dengan nilainya.

## Banyak cara

Satu jumlah uang dapat disusun dengan berbagai cara. Rp250.000 dapat berupa:

- 2 lembar seratus ribuan dan 1 lembar lima puluh ribuan;
- 2 lembar seratus ribuan dan 5 lembar sepuluh ribuan;
- 5 lembar lima puluh ribuan.

**Coba:** uraikan 550.303.
_Periksa: 500.000 + 50.000 + 300 + 3._

{SUMBER}"""),
    dict(no=6, judul="Memecahkan Masalah dengan Bilangan sampai 1.000.000",
         ringkasan="Pada soal cerita, tentukan dahulu yang ditanyakan, pilih operasinya, lalu hitung dengan teliti, termasuk saat meminjam.",
         tujuan="Kalian dapat memecahkan masalah sehari-hari yang berkaitan dengan bilangan sampai 1.000.000.",
         bloom="Menerapkan",
         isi=f"""## Uangnya kurang berapa?

Ibu akan membeli seragam seharga Rp450.000. Uang Ibu Rp443.000 (4 lembar seratus ribuan, 4 lembar sepuluh ribuan, 3 lembar seribuan).

1. Yang ditanyakan: kekurangannya.
2. Operasinya: pengurangan, harga dikurangi uang yang ada.
3. 450.000 − 443.000 = **Rp7.000**.

## Harga dari kembalian

Nisa membawa Rp250.000 untuk membeli buku dan menerima kembalian Rp15.400.

Harga buku = uang yang dibayarkan − kembalian = 250.000 − 15.400 = **Rp234.600**.

Periksa: 234.600 + 15.400 = 250.000. Cocok.

## Meminjam dengan teliti

250.000 − 15.400, dihitung dari kanan:

1. Satuan dan puluhan: 0 − 0 = 0.
2. Ratusan: 0 − 4 tidak bisa. Pinjam dari tempat di kirinya. Ribuan juga 0, jadi pinjaman diambil dari puluh ribuan: 5 menjadi 4, ribuan menjadi 9, ratusan menjadi 10.
3. Ratusan: 10 − 4 = 6. Ribuan: 9 − 5 = 4. Puluh ribuan: 4 − 1 = 3. Ratus ribuan: 2.
4. Hasilnya 234.600.

Jangan mengurangkan angka yang kecil dari yang besar di setiap tempat (misalnya 4 − 0 pada ratusan). Cara itu tidak meminjam dan memberi hasil yang keliru.

## Mana yang lebih banyak?

Kelompok Yohana mengumpulkan Rp345.600, kelompok Komang Rp354.500.

Ratus ribuannya sama (3). Puluh ribuannya 4 dan 5. Jadi dana kelompok Komang, **Rp354.500**, lebih banyak. Selisihnya 354.500 − 345.600 = Rp8.900.

## Rangkuman Bab 9

- Bilangan dibaca per kelompok tiga angka; kata "ribu" diucapkan sekali. Angka nol tetap menempati tempatnya.
- Nilai angka = angka × nilai tempatnya. Setiap tempat bernilai sepuluh kali tempat di kanannya.
- Membandingkan: banyak angka dahulu, lalu angka demi angka dari kiri.
- Pola bilangan: cari selisih yang tetap.
- Komposisi dan dekomposisi: tempat yang kosong diisi 0; banyak lembar uang dikalikan dengan nilainya.
- Soal cerita: tentukan yang ditanyakan, pilih operasi, periksa kembali.

{SUMBER}"""),
]

for _p in PELAJARAN:
    cek(3 <= _p["isi"].count("\n## ") + _p["isi"].startswith("## ") <= 6, f"lesson {_p['no']}: 3-6 pages")
    cek(_p["isi"].rstrip().endswith(SUMBER), f"lesson {_p['no']}: attribution last")
cek(terbilang(345675).startswith("tiga ratus empat puluh lima ribu") and nilai_angka(834759, "ratus ribuan") == 800000)
cek(sorted(PRODUK.values())[0] == PRODUK["Kabel USB"] and max(PRODUK.values()) == PRODUK["Hardisk eksternal"])
cek(300000 + 3 * 200000 == 900000 and urai(550303) == [500000, 50000, 300, 3])
cek(4 * 100000 + 4 * 10000 + 3 * 1000 == 443000 and 2 * 100000 + 50000 == 2 * 100000 + 5 * 10000 == 5 * 50000 == 250000)
cek(250000 - 15400 == 234600 == int("2" + str(4 - 1) + str(9 - 5) + str(10 - 4) + "00") and 234600 + 15400 == 250000 and 354500 - 345600 == 8900)
cek(terbilang(406250) == "empat ratus enam ribu dua ratus lima puluh")

# ── Misconceptions. 01 and 05 are the book's own Miskonsepsi (pp. 402, 406) and 10 its note on
# story problems (p. 409); the rest come from this chapter's distractors.
MISKONSEPSI = {
    "SD5-M-B9-01": ("Kelompok ribuan keliru dibaca",
                    "Bilangan tidak dibaca per kelompok tiga angka, misalnya kata ribu diucapkan dua kali (dua ratus ribu sembilan puluh enam ribu) atau kelompoknya tergeser.",
                    "Tutup kelompok kanan dengan jari, baca kelompok kiri lalu ucapkan ribu, kemudian baca kelompok kanan."),
    "SD5-M-B9-02": ("Angka nol terlewat",
                    "Angka nol sebagai penanda tempat dihilangkan, sehingga bilangan kehilangan satu tempat atau lebih.",
                    "Tulis bilangan pada tabel nilai tempat; setiap kolom harus terisi, dan yang kosong diisi 0."),
    "SD5-M-B9-03": ("Nilai tempat tertukar",
                    "Tempat sebuah angka keliru ditentukan, misalnya puluh ribuan dianggap ribuan, atau angka ditulis di kolom yang bergeser.",
                    "Hitung tempat dari kanan dengan jari: satuan, puluhan, ratusan, ribuan, puluh ribuan, ratus ribuan."),
    "SD5-M-B9-04": ("Angka, tempat, dan nilai tertukar",
                    "Angkanya saja (misalnya 7) atau nama tempatnya diberikan saat yang ditanyakan nilainya (70.000), atau sebaliknya.",
                    "Tulis tiga baris untuk setiap angka: angkanya, tempatnya, nilainya (angka × nilai tempat)."),
    "SD5-M-B9-05": ("Membandingkan dari belakang",
                    "Dua bilangan dibandingkan mulai dari angka paling kanan, padahal angka itu bernilai paling kecil.",
                    "Tunjuk angka paling kiri lebih dahulu, dan bandingkan ke kanan sampai menemukan angka yang berbeda."),
    "SD5-M-B9-06": ("Banyak angka tidak diperhatikan",
                    "Bilangan dengan angka depan lebih besar dianggap lebih besar walaupun angkanya lebih sedikit (99.870 dianggap lebih dari 100.200).",
                    "Minta murid menghitung banyak angka setiap bilangan sebelum membandingkan angka pertamanya."),
    "SD5-M-B9-07": ("Arah urutan terbalik",
                    "Urutan dari yang terbesar diberikan saat yang diminta dari yang terkecil, atau sebaliknya.",
                    "Minta murid menandai kata terkecil atau terbesar pada soal dan memeriksa bilangan pertama urutannya."),
    "SD5-M-B9-08": ("Langkah pola keliru",
                    "Selisih pola salah ditentukan, atau tempat yang berubah saat penjumlahan melewati 1.000 tidak disimpan.",
                    "Hitung selisih dua pasang bilangan yang berurutan; bila sama, tambahkan selisih itu pada bilangan terakhir dengan teliti."),
    "SD5-M-B9-09": ("Banyak lembar dianggap nilai",
                    "Banyak lembar atau keping uang dijumlahkan atau ditulis langsung, tanpa dikalikan dengan nilai setiap lembar.",
                    "Pakai uang mainan: kelompokkan per jenis, kalikan banyak lembar dengan nilainya, lalu jumlahkan."),
    "SD5-M-B9-10": ("Soal cerita keliru dipahami",
                    "Operasi yang dipilih tidak sesuai dengan cerita, jawaban bukan yang ditanyakan, atau pengurangan dilakukan tanpa meminjam.",
                    "Minta murid menceritakan ulang soal dengan kata-katanya sendiri dan menulis yang ditanyakan sebelum menghitung; periksa pengurangan dengan penjumlahan."),
    "SD5-M-B9-11": ("Satu juta keliru ditulis",
                    "Satu juta ditulis dengan banyak nol yang keliru, tertukar dengan seratus ribu atau sepuluh juta.",
                    "Hitung bersama: 10 kali seratus ribu adalah sejuta, yang ditulis 1 diikuti enam angka 0."),
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
    bil = [re.fullmatch(r"(Rp)?\d{1,3}(\.\d{3})*", t) for t, *_ in pilihan]
    if all(bil):   # a question that asks for a value: no distractor has the answer's value
        cek(len({angka(t) for t, *_ in pilihan}) == 4, f"{ref}: a distractor has the answer's value")
    i = "ABCD".index(jawab)
    S.append(dict(ref=ref, pel=pel, tanya=tanya, pilihan=pilihan[1:i + 1] + [pilihan[0]] + pilihan[i + 1:],
                  guna=guna, sulit=sulit, petunjuk=petunjuk))


# ── Pemetaan awal (pre-test): reading, a place, comparing, composing.
N = 406250
cek(int(str(N).replace("0", "", 1)) == 46250 and terbilang(46250) == "empat puluh enam ribu dua ratus lima puluh" and terbilang(406025) == "empat ratus enam ribu dua puluh lima"
    and baca_ribu_ganda(N) == "empat ratus ribu enam ribu dua ratus lima puluh")
soal("PA1", 1, "Bilangan 406.250 dibaca ...", "B", [
    (terbilang(N), True, "Benar. Kelompok kiri 406 (empat ratus enam) ribu, kelompok kanan 250 (dua ratus lima puluh).", ""),
    (terbilang(46250), False, "Ini bacaan 46.250; angka 0 di puluh ribuan terlewat, sehingga 4 bergeser ke puluh ribuan.", "SD5-M-B9-02"),
    (baca_ribu_ganda(N), False, "Kata ribu diucapkan dua kali. Kelompok 406 dibaca utuh, lalu satu kali ribu.", "SD5-M-B9-01"),
    (terbilang(406025), False, "Ini bacaan 406.025. Kelompok kanan adalah 250, dua ratus lima puluh.", "SD5-M-B9-03"),
], guna="Pemetaan awal")
cek(nilai_tempat(583194, 8) == ["puluh ribuan"])
soal("PA2", 2, "Pada bilangan 583.194, angka 8 menempati nilai tempat ...", "D", [
    ("puluh ribuan", True, "Benar. Dari kanan: 4 satuan, 9 puluhan, 1 ratusan, 3 ribuan, 8 puluh ribuan.", ""),
    ("ribuan", False, "Ribuan ditempati angka 3. Angka 8 satu tempat lebih ke kiri.", "SD5-M-B9-03"),
    ("ratus ribuan", False, "Ratus ribuan ditempati angka 5, yang paling kiri.", "SD5-M-B9-03"),
    ("80.000", False, "80.000 adalah nilai angka 8. Yang ditanyakan nama tempatnya.", "SD5-M-B9-04"),
], guna="Pemetaan awal")
cek(99870 < 100200 and lebih_besar_angka_depan(99870, 100200))
soal("PA3", 3, "Pernyataan manakah yang tepat tentang 99.870 dan 100.200?", "A", [
    ("99.870 < 100.200", True, "Benar. 99.870 mempunyai lima angka, 100.200 enam angka, jadi 99.870 lebih kecil.", ""),
    ("99.870 > 100.200", False, "Angka pertama 9 dianggap menentukan. Hitung dahulu banyak angkanya: lima dan enam.", "SD5-M-B9-06"),
    ("99.870 = 100.200", False, "Kedua bilangan berbeda; 100.200 lebih besar.", "SD5-M-B9-06"),
    ("Tidak dapat dibandingkan", False, "Bilangan dengan banyak angka berbeda tetap dapat dibandingkan: yang angkanya lebih banyak lebih besar.", "SD5-M-B9-06"),
], guna="Pemetaan awal")
K = 3 * 100000 + 5 * 10000 + 2 * 100 + 7
cek(K == 350207 and tanpa_nol(K) == 3527 and 3 * 100000 + 5 * 10000 + 2 * 10 + 7 * 100 == 350720 and 3 * 10000 + 5 * 1000 + 2 * 100 + 7 == 35207)
soal("PA4", 5, "Bilangan yang terdiri atas 3 ratus ribuan, 5 puluh ribuan, 2 ratusan, dan 7 satuan adalah ...", "C", [
    (titik(K), True, "Benar. Ribuan dan puluhan kosong, jadi diisi 0: 350.207.", ""),
    (titik(3527), False, "Angka-angka ditulis berjajar tanpa 0 untuk tempat yang kosong.", "SD5-M-B9-02"),
    (titik(350720), False, "2 ratusan dan 7 satuan ditulis di tempat yang bergeser: 7 di ratusan, 2 di puluhan.", "SD5-M-B9-03"),
    (titik(35207), False, "Ratus ribuan ditulis sebagai puluh ribuan; satu tempat 0 terlewat.", "SD5-M-B9-02"),
], guna="Pemetaan awal")

# ── Cek penguasaan (post-test): fresh numbers, every lesson.
cek(terbilang(608040) == "enam ratus delapan ribu empat puluh" and terbilang(680040) != terbilang(608040))
soal("PB1", 1, "Bilangan \"enam ratus delapan ribu empat puluh\" ditulis ...", "C", [
    ("608.040", True, "Benar. Sebelum ribu: 608; sesudah ribu: 040.", ""),
    ("680.040", False, "Delapan ribu ditulis di puluh ribuan. Enam ratus delapan adalah 608.", "SD5-M-B9-03"),
    ("608.400", False, "Empat puluh ditulis di ratusan. Kelompok kanan 040.", "SD5-M-B9-03"),
    ("6.008.040", False, "Enam ratus dan delapan ribu ditulis terpisah (600 lalu 8.040). Keduanya satu kelompok: 608 ribu.", "SD5-M-B9-01"),
], guna="Cek penguasaan", sulit="Sedang")
cek(nilai_angka(472315, "puluh ribuan") == 70000 and nilai_tempat(472315, 7) == ["puluh ribuan"])
soal("PB2", 2, "Berapa nilai angka 7 pada bilangan 472.315?", "A", [
    ("70.000", True, "Benar. Angka 7 di puluh ribuan: 7 × 10.000 = 70.000.", ""),
    ("Puluh ribuan", False, "Ini nama tempat angka 7. Yang ditanyakan nilainya: 7 × 10.000.", "SD5-M-B9-04"),
    ("7.000", False, "Angka 7 dianggap di ribuan. Ribuan ditempati angka 2.", "SD5-M-B9-03"),
    ("700.000", False, "Angka 7 dianggap di ratus ribuan. Ratus ribuan ditempati angka 4.", "SD5-M-B9-03"),
], guna="Cek penguasaan", sulit="Sedang")
A_, B_ = 806591, 806519
cek(A_ > B_ and not lebih_besar_dari_belakang(A_, B_) and sorted(str(A_)) == sorted(str(B_)) and 95910 < B_)
soal("PB3", 3, "Pernyataan manakah yang tepat?", "D", [
    ("806.591 > 806.519", True, "Benar. Ratus ribuan sampai ratusan sama; pada puluhan 9 > 1.", ""),
    ("806.591 < 806.519", False, "Yang dibandingkan angka satuannya (1 dan 9). Mulailah dari kiri; puluhanlah yang pertama berbeda.", "SD5-M-B9-05"),
    ("806.591 = 806.519", False, "Angka-angkanya sama, tetapi tempatnya berbeda, jadi nilainya berbeda.", "SD5-M-B9-03"),
    ("95.910 > 806.519", False, "Angka pertama 9 dianggap menentukan. 95.910 hanya mempunyai lima angka.", "SD5-M-B9-06"),
], guna="Cek penguasaan", sulit="Sedang")
DAFTAR = [540812, 504089, 548005, 540083]
NAIK = sorted(DAFTAR)
DARI_BELAKANG = sorted(DAFTAR, key=lambda n: str(n)[::-1])
cek(NAIK == [504089, 540083, 540812, 548005] and DARI_BELAKANG != NAIK and DARI_BELAKANG != NAIK[::-1])
soal("PB4", 4, "Urutan 540.812; 504.089; 548.005; 540.083 dari yang terkecil adalah ...", "B", [
    ("; ".join(titik(n) for n in NAIK), True, "Benar. Puluh ribuan 0 paling kecil (504.089); lalu 540.083 dan 540.812 dibedakan di ratusan.", ""),
    ("; ".join(titik(n) for n in NAIK[::-1]), False, "Ini urutan dari yang terbesar.", "SD5-M-B9-07"),
    ("; ".join(titik(n) for n in DARI_BELAKANG), False, "Bilangan diurutkan dari angka belakangnya. Mulailah dari angka paling kiri.", "SD5-M-B9-05"),
    ("; ".join(titik(n) for n in [504089, 540812, 540083, 548005]), False, "540.812 dan 540.083 tertukar: pada ratusan 0 < 8, jadi 540.083 lebih kecil.", "SD5-M-B9-03"),
], guna="Cek penguasaan", sulit="Sedang")
POLA = [725400, 725650, 725900]
cek(POLA[1] - POLA[0] == POLA[2] - POLA[1] == 250 and POLA[2] + 250 == 726150 and 725150 == POLA[2] + 250 - 1000
    and POLA[2] + 50 == 725950 and POLA[2] + 1000 == 726900)
soal("PB5", 4, "Pola bilangan: 725.400; 725.650; 725.900; ... Bilangan berikutnya adalah ...", "C", [
    ("726.150", True, "Benar. Setiap langkah bertambah 250: 725.900 + 250 = 726.150.", ""),
    ("725.150", False, "900 + 250 = 1.150; seribunya tidak disimpan ke ribuan.", "SD5-M-B9-08"),
    ("725.950", False, "Langkahnya dianggap 50. Selisih dua bilangan yang berurutan adalah 250.", "SD5-M-B9-08"),
    ("726.900", False, "Langkahnya dianggap 1.000. Selisih dua bilangan yang berurutan adalah 250.", "SD5-M-B9-08"),
], guna="Cek penguasaan", sulit="Sedang")
cek(urai(704036) == [700000, 4000, 30, 6] and 700000 + 40000 + 30 + 6 != 704036 and 70000 + 4000 + 300 + 6 != 704036)
soal("PB6", 5, "Bentuk uraian (dekomposisi) 704.036 adalah ...", "A", [
    ("700.000 + 4.000 + 30 + 6", True, "Benar. 7 ratus ribuan, 4 ribuan, 3 puluhan, 6 satuan; puluh ribuan dan ratusan 0.", ""),
    ("700.000 + 40.000 + 30 + 6", False, "Angka 4 di ribuan, bukan di puluh ribuan. Puluh ribuannya 0.", "SD5-M-B9-03"),
    ("70.000 + 4.000 + 300 + 6", False, "Setiap angka digeser satu tempat ke kanan; angka 7 berada di ratus ribuan.", "SD5-M-B9-03"),
    ("7 + 4 + 3 + 6", False, "Ini angka-angkanya saja; nilainya belum dikalikan dengan nilai tempat.", "SD5-M-B9-04"),
], guna="Cek penguasaan", sulit="Sedang")
UANG = 6 * 100000 + 3 * 10000 + 8 * 1000
cek(UANG == 638000 and 6 + 3 + 8 == 17 and 6 * 100000 + 8 * 10000 + 3 * 1000 == 683000)
soal("PB7", 5, "Ayah membayar dengan 6 lembar seratus ribuan, 3 lembar sepuluh ribuan, dan 8 lembar seribuan. Berapa uang yang dibayarkan?", "D", [
    ("Rp638.000", True, "Benar. 600.000 + 30.000 + 8.000 = 638.000.", ""),
    ("Rp63.800", False, "Setiap jenis uang ditulis satu tempat terlalu ke kanan. Seratus ribuan menempati ratus ribuan.", "SD5-M-B9-03"),
    ("Rp683.000", False, "Sepuluh ribuan dan seribuan tertukar: 3 lembar sepuluh ribuan bernilai 30.000.", "SD5-M-B9-03"),
    ("Rp17.000", False, "Banyak lembarnya dijumlahkan (6 + 3 + 8). Setiap lembar dikalikan dengan nilainya.", "SD5-M-B9-09"),
], guna="Cek penguasaan", sulit="Sedang")
cek(875000 - 628500 == 246500 and 875000 + 628500 == 1503500 and kurang_terbalik(875000, 628500) == 253500
    and 875000 - 628500 + 1000 == 247500)
soal("PB8", 6, "Harga sepeda Rp875.000. Doni sudah menabung Rp628.500. Berapa lagi yang harus ditabung Doni?", "B", [
    ("Rp246.500", True, "Benar. 875.000 − 628.500 = 246.500. Periksa: 628.500 + 246.500 = 875.000.", ""),
    ("Rp1.503.500", False, "Kedua bilangan dijumlahkan. Kekurangan dicari dengan pengurangan.", "SD5-M-B9-10"),
    ("Rp253.500", False, "Di setiap tempat angka kecil dikurangkan dari angka besar, tanpa meminjam.", "SD5-M-B9-10"),
    ("Rp247.500", False, "Pinjaman dari ribuan tidak dikurangkan. Periksa: 628.500 + 247.500 = 876.000.", "SD5-M-B9-10"),
], guna="Cek penguasaan", sulit="Sulit", petunjuk="Periksa jawaban kalian dengan menjumlahkannya kembali dengan tabungan Doni.")

# ── Latihan (practice), by lesson.
cek(terbilang(320018) == "tiga ratus dua puluh ribu delapan belas" and terbilang(302018) == "tiga ratus dua ribu delapan belas"
    and terbilang(3218) == "tiga ribu dua ratus delapan belas" and terbilang(320080) == "tiga ratus dua puluh ribu delapan puluh")
soal("LT1", 1, "Bilangan 320.018 dibaca ...", "A", [
    (terbilang(320018), True, "Benar. 320 ribu dan 018, yaitu delapan belas.", ""),
    (terbilang(320080), False, "Ini bacaan 320.080. Kelompok kanan 018: delapan belas.", "SD5-M-B9-03"),
    (terbilang(3218), False, "Ini bacaan 3.218; semua angka 0 terlewat.", "SD5-M-B9-02"),
    (terbilang(302018), False, "Ini bacaan 302.018. Kelompok kiri 320: tiga ratus dua puluh.", "SD5-M-B9-03"),
])
cek(terbilang(900050) == "sembilan ratus ribu lima puluh" and terbilang(950000) == "sembilan ratus lima puluh ribu")
soal("LT2", 1, "Bilangan \"sembilan ratus ribu lima puluh\" ditulis ...", "C", [
    ("900.050", True, "Benar. Sebelum ribu: 900; sesudah ribu: 050.", ""),
    ("950.000", False, "Ini sembilan ratus lima puluh ribu. Lima puluh datang sesudah kata ribu.", "SD5-M-B9-01"),
    ("9.050", False, "Nol di ratus ribuan dan puluh ribuan terlewat; 9 harus di ratus ribuan.", "SD5-M-B9-02"),
    ("900.500", False, "Lima puluh ditulis di ratusan. Kelompok kanan 050.", "SD5-M-B9-03"),
])
soal("LT3", 1, "Satu juta ditulis ...", "B", [
    ("1.000.000", True, "Benar. Angka 1 diikuti enam angka 0.", ""),
    ("100.000", False, "Ini seratus ribu. Satu juta adalah sepuluh kali seratus ribu.", "SD5-M-B9-11"),
    ("10.000.000", False, "Ini sepuluh juta; ada tujuh angka 0.", "SD5-M-B9-11"),
    ("1.000", False, "Ini seribu. Satu juta adalah seribu kali seribu.", "SD5-M-B9-11"),
])
cek(nilai_tempat(316924, 6) == ["ribuan"])
soal("LT4", 2, "Pada bilangan 316.924, angka 6 menempati nilai tempat ...", "D", [
    ("ribuan", True, "Benar. Dari kanan: 4, 2, 9, lalu 6 di ribuan.", ""),
    ("puluh ribuan", False, "Puluh ribuan ditempati angka 1.", "SD5-M-B9-03"),
    ("ratusan", False, "Ratusan ditempati angka 9.", "SD5-M-B9-03"),
    ("6.000", False, "6.000 adalah nilai angka 6. Yang ditanyakan nama tempatnya.", "SD5-M-B9-04"),
])
cek(nilai_angka(158203, "puluh ribuan") == 50000)
soal("LT5", 2, "Berapa nilai angka 5 pada bilangan 158.203?", "A", [
    ("50.000", True, "Benar. 5 di puluh ribuan: 5 × 10.000 = 50.000.", ""),
    ("5.000", False, "Angka 5 dianggap di ribuan. Ribuan ditempati angka 8.", "SD5-M-B9-03"),
    ("Puluh ribuan", False, "Ini nama tempat angka 5. Yang ditanyakan nilainya: 5 × 10.000.", "SD5-M-B9-04"),
    ("500.000", False, "Angka 5 dianggap di ratus ribuan. Ratus ribuan ditempati angka 1.", "SD5-M-B9-03"),
])
PILIH = [452108, 245108, 154208, 128504]
cek([n for n in PILIH if nilai_tempat(n, 4) == ["ratus ribuan"]] == [452108]
    and [nilai_tempat(n, 4) for n in PILIH[1:]] == [["puluh ribuan"], ["ribuan"], ["satuan"]])
soal("LT6", 2, "Pada bilangan manakah angka 4 bernilai 400.000?", "C", [
    ("452.108", True, "Benar. Angka 4 di ratus ribuan.", ""),
    ("245.108", False, "Angka 4 di puluh ribuan, bernilai 40.000.", "SD5-M-B9-03"),
    ("154.208", False, "Angka 4 di ribuan, bernilai 4.000.", "SD5-M-B9-03"),
    ("128.504", False, "Angka 4 di satuan, bernilai 4.", "SD5-M-B9-03"),
], sulit="Sedang")
cek(700009 > 699999 and not lebih_besar_dari_belakang(700009, 699999))
soal("LT7", 3, "Pernyataan manakah yang tepat tentang 700.009 dan 699.999?", "B", [
    ("700.009 > 699.999", True, "Benar. Ratus ribuan 7 > 6, jadi 700.009 lebih besar.", ""),
    ("700.009 < 699.999", False, "Yang dibandingkan angka-angka belakangnya (banyak 9 pada 699.999). Mulailah dari kiri: 7 > 6.", "SD5-M-B9-05"),
    ("700.009 = 699.999", False, "Kedua bilangan berbeda; ratus ribuannya 7 dan 6.", "SD5-M-B9-05"),
    ("Tidak dapat dibandingkan", False, "Keduanya mempunyai enam angka dan dapat dibandingkan dari kiri.", "SD5-M-B9-05"),
])
soal("LT8", 3, "Dua bilangan enam angka dibandingkan mulai dari ...", "D", [
    ("angka paling kiri, yaitu ratus ribuan", True, "Benar. Angka paling kiri bernilai paling besar.", ""),
    ("angka paling kanan, yaitu satuan", False, "Satuan bernilai paling kecil, jadi tidak menentukan bila angka di kirinya berbeda.", "SD5-M-B9-05"),
    ("angka yang paling besar di setiap bilangan", False, "Yang dibandingkan angka pada tempat yang sama, mulai dari kiri.", "SD5-M-B9-05"),
    ("jumlah semua angka pada setiap bilangan", False, "Jumlah angka tidak menentukan: 900.000 (jumlah 9) lebih besar dari 199.999 (jumlah 46).", "SD5-M-B9-06"),
])
HARGA = [215900, 209990, 251000, 219500]
cek(min(HARGA) == 209990 and max(HARGA) == 251000)
soal("LT9", 4, "Di toko ada empat sepeda dengan harga berbeda. Harga manakah yang termurah?", "C", [
    ("Rp209.990", True, "Benar. Ratus ribuan keempat harga sama, 2; puluh ribuannya 1, 0, 5, 1. Yang 0 paling kecil.", ""),
    ("Rp251.000", False, "Ini harga termahal. Yang ditanyakan termurah.", "SD5-M-B9-07"),
    ("Rp215.900", False, "Hanya ribuan yang dibandingkan. Pada puluh ribuan, 209.990 mempunyai 0.", "SD5-M-B9-03"),
    ("Rp219.500", False, "Angka-angka belakangnya yang dibandingkan. Mulailah dari angka paling kiri.", "SD5-M-B9-05"),
])
cek(301000 - 300750 == 250 and 301000 + 250 == 301250)
soal("LT10", 4, "Pola bilangan: 300.500; 300.750; 301.000; ... Bilangan berikutnya adalah ...", "A", [
    ("301.250", True, "Benar. Setiap langkah bertambah 250.", ""),
    ("301.500", False, "Langkahnya dianggap 500. Selisih yang berurutan 250.", "SD5-M-B9-08"),
    ("302.000", False, "Langkahnya dianggap 1.000. Selisih yang berurutan 250.", "SD5-M-B9-08"),
    ("301.025", False, "250 ditulis di tempat yang bergeser. 301.000 + 250 = 301.250.", "SD5-M-B9-03"),
])
K2 = 5 * 100000 + 6 * 1000 + 4 * 100
cek(K2 == 506400 and tanpa_nol(K2) == 564 and 5 * 100000 + 6 * 10000 + 4 * 100 == 560400 and 5 * 10000 + 6 * 1000 + 4 * 100 == 56400)
soal("LT11", 5, "Bilangan yang terdiri atas 5 ratus ribuan, 6 ribuan, dan 4 ratusan adalah ...", "D", [
    (titik(K2), True, "Benar. Puluh ribuan, puluhan, dan satuan diisi 0.", ""),
    (titik(564), False, "Angka-angka ditulis berjajar tanpa 0 untuk tempat yang kosong.", "SD5-M-B9-02"),
    (titik(560400), False, "6 ribuan ditulis di puluh ribuan.", "SD5-M-B9-03"),
    (titik(56400), False, "Nol di puluh ribuan terlewat, sehingga 5 turun ke puluh ribuan.", "SD5-M-B9-02"),
])
cek(urai(680090) == [600000, 80000, 90])
soal("LT12", 5, "Bentuk uraian 680.090 adalah ...", "B", [
    ("600.000 + 80.000 + 90", True, "Benar. 6 ratus ribuan, 8 puluh ribuan, 9 puluhan.", ""),
    ("600.000 + 8.000 + 90", False, "Angka 8 di puluh ribuan, bernilai 80.000.", "SD5-M-B9-03"),
    ("600.000 + 80.000 + 900", False, "Angka 9 di puluhan, bernilai 90.", "SD5-M-B9-03"),
    ("6 + 8 + 9", False, "Ini angka-angkanya saja; kalikan dengan nilai tempatnya.", "SD5-M-B9-04"),
])
cek(2 * 100000 + 5 * 10000 == 250000 and 2 * 100000 + 5 * 1000 == 205000 and 25 * 1000 == 25000 and 5 * 50000 + 2 * 10000 == 270000)
soal("LT13", 5, "Susunan uang manakah yang nilainya Rp250.000?", "C", [
    ("2 lembar seratus ribuan dan 5 lembar sepuluh ribuan", True, "Benar. 200.000 + 50.000 = 250.000.", ""),
    ("2 lembar seratus ribuan dan 5 lembar seribuan", False, "5 lembar seribuan hanya 5.000, jadi jumlahnya 205.000.", "SD5-M-B9-09"),
    ("25 lembar seribuan", False, "25 lembar seribuan hanya 25.000.", "SD5-M-B9-09"),
    ("5 lembar lima puluh ribuan dan 2 lembar sepuluh ribuan", False, "5 × 50.000 sudah 250.000; ditambah 20.000 menjadi 270.000.", "SD5-M-B9-09"),
], sulit="Sedang")
PUNYA = 2 * 100000 + 9 * 10000 + 5 * 1000
cek(PUNYA == 295000 and 320000 - PUNYA == 25000 and 320000 + PUNYA == 615000 and kurang_terbalik(320000, PUNYA) == 175000)
soal("LT14", 6, "Harga tas Rp320.000. Rina mempunyai 2 lembar seratus ribuan, 9 lembar sepuluh ribuan, dan 5 lembar seribuan. Berapa kekurangan uang Rina?", "A", [
    ("Rp25.000", True, "Benar. Uang Rina 295.000; 320.000 − 295.000 = 25.000.", ""),
    ("Rp615.000", False, "Harga dan uang dijumlahkan. Kekurangan dicari dengan pengurangan.", "SD5-M-B9-10"),
    ("Rp175.000", False, "Di setiap tempat angka kecil dikurangkan dari angka besar, tanpa meminjam.", "SD5-M-B9-10"),
    ("Rp295.000", False, "Ini uang yang dimiliki Rina. Yang ditanyakan kekurangannya.", "SD5-M-B9-10"),
], sulit="Sedang")
cek(500000 - 62300 == 437700 and 500000 + 62300 == 562300 and 500000 - 62300 + 10000 == 447700)
soal("LT15", 6, "Nisa membayar Rp500.000 dan menerima kembalian Rp62.300. Berapa harga barang yang dibelinya?", "D", [
    ("Rp437.700", True, "Benar. 500.000 − 62.300 = 437.700. Periksa: 437.700 + 62.300 = 500.000.", ""),
    ("Rp562.300", False, "Uang dan kembalian dijumlahkan. Harga = uang yang dibayarkan − kembalian.", "SD5-M-B9-10"),
    ("Rp447.700", False, "Pinjaman pada puluh ribuan terlupa. Periksa: 447.700 + 62.300 = 510.000.", "SD5-M-B9-10"),
    ("Rp62.300", False, "Ini kembaliannya. Yang ditanyakan harga barang.", "SD5-M-B9-10"),
], sulit="Sedang")
cek(450570 - 405750 == 44820 and 450570 + 405750 == 856320 and kurang_terbalik(450570, 405750) == 55220)
soal("LT16", 6, "Kelompok A mengumpulkan dana Rp405.750, kelompok B Rp450.570. Berapa selisih dana kedua kelompok?", "B", [
    ("Rp44.820", True, "Benar. 450.570 − 405.750 = 44.820.", ""),
    ("Rp856.320", False, "Kedua dana dijumlahkan. Selisih dicari dengan pengurangan.", "SD5-M-B9-10"),
    ("Rp55.220", False, "Di setiap tempat angka kecil dikurangkan dari angka besar, tanpa meminjam.", "SD5-M-B9-10"),
    ("Rp450.570", False, "Ini dana yang lebih banyak. Yang ditanyakan selisihnya.", "SD5-M-B9-10"),
], sulit="Sulit")

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
    h = "ABCD"[[b for _, b, _, _ in s["pilihan"]].index(True)]
    HURUF[h] = HURUF.get(h, 0) + 1
cek(set(HURUF) == set("ABCD") and max(HURUF.values()) * 2 <= len(S) and max(HURUF.values()) - min(HURUF.values()) <= 3, HURUF)

# The post-test uses fresh numbers: no number of four or more digits in a post-test stem or answer
# is one the book or a lesson uses, and no run of three values of a post-test list appears, in
# order, in a book or lesson list (the rule kept from Bab 8).
BILANGAN_BUKU = {979875, 296575, 179500, 834759, 159899, 132795, 445000, 545000, 657000, 675000, 876000, 867000,
                 126789, 876987, 876789, 300000, 500000, 700000, 900000, 1100000, 550303, 933403, 149641, 345675,
                 327100, 505401, 857259, 275000, 256000, 676785, 786897, 789876, 789867, 900025, 900052, 678987,
                 203305, 203035, 450000, 443000, 7000, 345600, 354500, 250000, 15400, 234600, 567000, 38000, 30004, 27900}
BILANGAN_BUKU |= {978500 + 1000 * i for i in range(5)} | {462350 + 20 * i for i in range(5)}
BILANGAN_PELAJARAN = {99999, 100000, 1000000, 406250, 8900}
DAFTAR_BUKU = [[978500 + 1000 * i for i in range(5)], [300000 + 200000 * i for i in range(5)], [462350 + 20 * i for i in range(5)],
               [676785, 786897, 789876, 789867], sorted(PRODUK.values()), list(PRODUK.values())]
DAFTAR_POST = {"PB4": NAIK, "PB5": POLA}


def tiga(xs):
    return {tuple(xs[i:i + 3]) for i in range(len(xs) - 2)}


for s_ in POST:
    benar = next(t for t, b, _, _ in s_["pilihan"] if b)
    bil = {angka(n) for n in re.findall(r"\d{1,3}(?:\.\d{3})+", s_["tanya"] + " " + benar)}
    bil = {n for n in bil if len(str(n).strip("0")) > 1}   # 700.000 in a decomposition is a place value, not data
    cek(not bil & (BILANGAN_BUKU | BILANGAN_PELAJARAN), f"{s_['ref']}: {bil & (BILANGAN_BUKU | BILANGAN_PELAJARAN)} is a book or lesson number")
for ref, xs in DAFTAR_POST.items():
    cek(all(not tiga(xs) & tiga(d) and not tiga(xs) & tiga(d[::-1]) for d in DAFTAR_BUKU), ref)


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
                c.number_format = "@"   # 608.040 stays text: Excel must not read it as 608,04

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
    tulis(os.path.join(here, "SD5-Matematika-Bab9.xlsx"))
    tulis_miskonsepsi(os.path.join(here, "SD5-Matematika-Bab9-miskonsepsi.csv"))
    halaman = sum(p["isi"].count("## ") for p in PELAJARAN)
    print(f"SD5-Matematika-Bab9.xlsx: lessons {len(PELAJARAN)} ({halaman} pages), questions {len(S)} "
          f"(pre {len(PRE)}, post {len(POST)}, practice {len(LAT)}), answers "
          + " ".join(f"{h}={HURUF[h]}" for h in "ABCD"))
    print(f"SD5-Matematika-Bab9-miskonsepsi.csv: {len(MISKONSEPSI)} codes")
    print(f"assertions passed: {CEK[0]}")
