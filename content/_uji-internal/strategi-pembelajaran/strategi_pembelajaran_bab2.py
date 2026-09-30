# [UJI INTERNAL] Strategi Pembelajaran, Bab 2 "Klasifikasi dan Pemilihan Strategi Pembelajaran", as a
# PINTAR lesson workbook in the
# D-007 template (sheets Kursus, Bab, Pelajaran, Soal, Pilihan; the column contract is KOLOM in
# src/lib/unggah-kontrak.ts). LANA-23, the internal educator demo (D-069(g), D-070(d), (e)).
#
# INTERNAL DEMO ONLY. Close adaptation is approved for this demo and nothing else: this folder
# stays on the lesson author's branch, is never merged to main, never goes to production or
# Pustaka PINTAR, and is deleted after the demo unless rights are obtained (D-070(e)).
#
# Source: Dr. Siti Nurhasanah, M.Pd; Dr. (Cdt) Agus Jayadi, M.Pd; Dr. Rika Sa'diyah, M.Pd;
# Syafrimen, M.Ed, Ph.D, "Strategi Pembelajaran", Penerbit EDU PUSTAKA, Jakarta, 2019 (Cetakan
# Pertama), ISBN 978-623-90461-7-0, Bab II, pp. 37-82 of the print. The Bab 2 scan is the typed
# manuscript (28 pages, no printed page numbers); every page cited here is a page of that scan.
#
#   - The reader is a practising educator: «Anda», classroom situations, professional judgement,
#     no praise words and no gamification (EDUCATOR-LEARNING-CONTENT-STANDARD).
#   - Every lesson section names the FAKTA it rests on (JEJAK); every fact has its page and the
#     book's words, and `--kutipan` finds each one in the scan's text.
#   - Every option names the fact that decides it; every key is the option its facts support.
#   - No long verbatim passage: with `--kutipan`, no run of VERBATIM_MAKS + 1 words of learner
#     text appears in the book.
#   - Statements that are doubtful, dated or book errors are kept out, and DILUAR asserts it.
#   - No misconception codes (non-scope for this demo; D-063's mechanism is not built).
#   - From LANA-22's rounds: every distractor is a move a teacher might really make that the chapter
#     rules out; no distractor carries an absolute the key lacks (MUTLAK); a stem that asks what to
#     do or choose has four actions; the post-test reuses no lesson's situation.
#   - Naming: the book's «Empirik»; Bab 1's «melalui pengalaman» is named exactly once.
#
# Run: python3 content/_uji-internal/strategi-pembelajaran/strategi_pembelajaran_bab2.py
#          [--kutipan bab2.txt,depan.txt]
import os
import re
import sys

from openpyxl import Workbook
from openpyxl.styles import Alignment, Font

CEK = [0]


def cek(syarat, pesan=""):
    """An assertion that is counted, so the hand-off can say how many passed."""
    assert syarat, pesan
    CEK[0] += 1


def norm(teks):
    teks = teks.lower().replace("ﬁ", "fi").replace("ﬂ", "fl")
    return re.sub(r"[^0-9a-z]", "", teks)


def kata(teks):
    teks = teks.lower().replace("ﬁ", "fi").replace("ﬂ", "fl")
    return re.findall(r"[0-9a-z]+", teks)


FAKTA = {}


def fakta(id_, hal, kutipan):
    cek(id_ not in FAKTA, id_)
    cek(len(kutipan.split()) <= 40, f"{id_}: a fact quotes at most 40 words")
    FAKTA[id_] = (hal, kutipan)


def notasi(teks, dimana):
    """The notation contract: no LaTeX, HTML or tables, braces balanced, no bare ^ or _."""
    cek("\n|" not in teks and not teks.startswith("|"), f"{dimana}: a table")
    cek("\\" not in teks and not re.search(r"<[a-zA-Z/]", teks), f"{dimana}: LaTeX or HTML")
    cek(not re.search(r"\^", teks) and not re.search(r"_", teks.replace("_Diadaptasi", "").replace("._", ".")),
        f"{dimana}: a bare ^ or _")
    cek(teks.count("{") == teks.count("}") == 0, f"{dimana}: braces")
    cek(not re.search(r"(?<![\d.])\d+\.\d{1,2}(?!\d)", teks), f"{dimana}: decimal point")


# The standard's register: an adult reader, addressed as «Anda»; no praise, no gamification; and
# the doctrine lexicon's forbidden words (periksa_mutu.py LEKSIKON).
TERLARANG = [r"\bkalian\b", r"\bkamu\b", r"\bhebat\b", r"\bkeren\b", r"pasti bisa", r"luar biasa", r"\bselamat\b",
             r"bagus sekali", r"\bmantap\b", r"\bayo\b", r"\bpoin\b", r"\blencana\b", r"\bbintang\b", r"\bsalah\b",
             r"\bgagal\b", r"\bbodoh\b", r"\bmalas\b", r"PINTAR\s*4"]


def register(teks, dimana):
    for pola in TERLARANG:
        cek(not re.search(pola, teks, re.I), f"{dimana}: {pola}")


# ── FAKTA: page of the Bab 2 scan, and the book's own words (typos kept, so --kutipan finds them).
# Front matter (the index scan, pp. ii and vi of the print)
fakta("isbn", "ii", "ISBN 978-623-90461-7-0")
fakta("terbit", "ii", "Penerbit EDU PUSTAKA")
fakta("cetakan", "ii", "Cetakan Pertama, 2019")
fakta("daftar_isi", "vi", "KLASIFIKASI DAN PEMILIHAN STRATEGI PEMBELAJARAN")
# A. Klasifikasi strategi pembelajaran (pp. 1-4)
fakta("dasar", 1, "Dasar kualifikasi adalah kriteria atau titik tolak yang digunakan untuk mengelompokkan sesuatu")
fakta("raka_joni", 1, "1) pengaturan guru dan siswa; 2) pengolahan pesan; 3) struktus peristiwa belajar mengajar; dan 4) tujuan belajar")
fakta("pengaturan_guru", 1, "a. strategi pembelajaran oleh seorang guru; b. strategi pembelajaran oleh team teaching lebih dari satu orang guru")
fakta("tatap_muka", 1, "guru dan siswa berada dalam satu ruangan/ kelas dengan komunikasi/ interaksi pembelajaran yang berlangsung secara face-to-face communication")
fakta("jarak_jauh", 1, "komunikasi/ interaksi pembelajaran berlangsung melalui penggunaan media/ teknologi pembelajaran sebagai perantara")
fakta("individual", 2, "pemberian kesempatan kepada setiap siswa secara individual untuk belajar sesuai dengan kemampuan sendiri")
fakta("kelompok_kecil", 2, "siswa diorganisir dalam kelompok-kelompok kecil, besarnya 4-7 orang untuk mendiskusikan dan/ atau mengerjakan topic/ tugas-tugas")
fakta("klasikal", 2, "(besarnya sekitar 35-45 orang) yang diasumsikan memilki usia dan kemampuan yang relative sama")
fakta("klasikal_format", 2, "diajar oleh seorang guru dengan menggunakan format pembelajaran yang sama untuk seluruh murid dalam kelas")
fakta("ekspositorik", 2, "semua pesan pembelajaran (yang diharapkan untuk dikuasai oleh murid) telah diolah dalam bentuk barang jadi oleh guru untuk selanjutnya disampaikan kepada murid")
fakta("ekspositorik_peran", 2, "Peran guru dalam strategi pembelajaran ekspositorik ini adalah penyusun program pembelajaran, pemberi informasi yang benar, penyedia")
fakta("heuristik", 3, "menghendaki siswa untuk terlibat aktif dalam proses pengolahan pesan- peasan belajar")
fakta("heuristik_tujuan", 3, "bertujuan untuk mengembangkan kemampuan intelektual, berpikir kritis, dan memecahkan masalah dari para siswa")
fakta("heuristik_guru", 3, "menciptakan suasana berpikir sehingga murid berani bereksplorasi dalam penemuan dan pemecahan masalah")
fakta("deduktif", 3, "proses pengolahan pesan yang berlangsung dari hal-hal yang bersifat umum menuju ke hal-hal yang bersifat khusus")
fakta("deduktif_langkah", 3, "(1) guru mengemukakan generalisasi; (2) penjelasan konsep-konsep; dan (3) pencarian data yang dilakukan oleh siswa")
fakta("induktif", 3, "proses pengolahan pesan yang berlangsung dari hal-hal yang bersifat khusus menuju hal-hal yang bersifat umum")
fakta("induktif_langkah", 3, "1) pengajuan data/ fakta atau peristiwa khusus; 2) penyusunan konsep berdasarkan fakta-fakta; 3) penyusunan generalisasi berdasarkan konsep-konsep")
fakta("saskatchewan", 4, "strategi pembelajaran langsung (direct instruction) , tidak langsung (indirect instruction), interaktif, mandiri, dan pengalaman (experiental)")
# B. Strategi pembelajaran langsung (pp. 4-10)
fakta("langsung_def", 4, "procedural (pengetahuan tentang bagaimana melaksanakan sesuatu) dan pengetahuan deklaratif (pengetahuan tentang sesuatu yang dapat berupa fakta, konsep, prinsip, atau generalisasi)")
fakta("langsung_libat", 4, "Pengajaran langsung tersebut berpusat pada guru dan harus menjamin terjadinya keterlibatan siswa")
fakta("langsung_format", 4, "guru menyampaikan isi/ materi akademik dalam format yang terstruktur, mengarahkan kegiatan para siswa, dan menguji keterampilan siswa melalui latihan- latihan")
fakta("langsung_tahap", 5, "Strategi ini efektif untuk menentukan informasi atau membangun keterampilan tahap demi tahap")
fakta("langsung_deduktif", 5, "Pembelajaran langsung biasanya bersifat dedukatif")
fakta("langsung_lemah", 5, "kelemahan utamanya adalah dalam mengembangkan kemampuan-kemampuan, proses-proses, dan sikap yang diperlukan untuk pemikiran kritis dan hubungan interpersonal serta belajar kelompok")
fakta("langsung_kombinasi", 5, "strategi pembelajaran langsung perlu dikombinasikan dengan strategi pembelajaran yang lain")
fakta("langsung_tujuan", 5, "mengandung uraian yang jelas tentang situasi penilaian (kondisi evaluasi), dan mengandung tingkat ketercapaian kinerja yang diharapkan ( criteria keberhasilan)")
fakta("lima_fase", 5, "Tahap 1: Menyampaikan tujuan dan mempersiapkan siswa; Tahap 2: Mendemonstrasi pengetahuan dan keterampilan; Tahap 3: Membimbing pelatihan; Tahap 4: Memeriksa pemahaman dan memberikan umpan balik; Tahap 5:")
fakta("lingkungan", 5, "ruangan yang tenang dengan penerangan cukup, termasuk alat atau media yang sesuai")
fakta("kendali", 6, "Guru dapat mengendalikan isi materi dan urutan informasi yang diterima oleh siswa, sehingga dapat mempertahankan focus mengenai apa yang harus dicapai oleh siswa")
fakta("besar_kecil", 6, "Dapat diterapkan secara efektif dalam kelas yang besar maupun kecil")
fakta("prestasi_rendah", 6, "keterampilan-keterampilan yang eksplisit kepada siswa yang berprestasi rendah")
fakta("ceramah_guna", 6, "menyampaikan informasi kepada siswa yang tidak suka membaca atau yang tidak memiliki keterampilan dalam menyusun dan menafsirkan informasi")
fakta("arah_diri", 6, "Siswa yang tidak dapat mengarahkan diri sendiri dapat tetap berprestasi apabila model pembelajaran langsung digunakan secara efektif")
fakta("beda", 7, "sulit untuk mengatasi perbedaan dalam hal kemampuan, pengetahuan awal, tingkat pembelajaran dan pemahaman, gaya belajar atau ketertarikan siswa")
fakta("sosial", 7, "sulit bagi siswa untuk mengembangkan keterampilan social dan interpersonal mereka")
fakta("image_guru", 7, "kesuksesan strategi pembelajaran ini bergantung pada image guru")
fakta("komunikasi", 7, "Model pembelajaran langsung sangat bergantung pada gaya komunikasi guru")
fakta("fase1", 7, "Tujuan langkah awal ini untuk menarik dan memusatkan perhatian siswa, serta memotivasi mereka untuk berperan serta dalam pembelajaran")
fakta("fase1_papan", 7, "menuliskannya di papan tulis, atau menempelkan informasi tertulis pada papan bulletin yang berisi tahapan-tahapan dan isinya, serta alokasi waktu")
fakta("fase2", 8, "Kunci keberhasilan dalam tahap ini adalah mempresentasikan informasi sejelas mungkin dan mengikuti langkah-langkah demonstrasi yang efektif")
fakta("fase2_kecil", 8, "Penyajian materi dalam langkah-langkah kecil, sehingga materi dapat dikuasai siswa dalam waktu relative pendek")
fakta("fase2_ulang", 8, "Menjelaskan ulang hal-hal sulit")
fakta("fase3", 8, "Bimbingan dilakukan dengan mengajukan pertanyaan-pertanyaan untuk menilai tingkat pemahaman siswa dan mengoreksi kesalahan konsep")
fakta("fase3_monitor", 8, "Pada fase ini peran guru adalah memonitor dan memberikan bimbingan jika diperlukan")
fakta("fase4", 8, "Guru memeriksa atau mengecek kemampuan siswa seperti member kuis terkini")
fakta("fase4_ulang", 8, "mengulang keterampilan jika diperlukan")
fakta("fase5", 8, "perhatian khusus terhadap penerapan pada situasi lebih kompleks dan kehidupan sehari-hari")
fakta("tabel31", 9, "Tabel 3.1 Tahapan-tahapan Pembelajaran Langsung: Menyampaikan tujuan dan mempersiapkan siswa; Mendemonstrasikan pengetahuan dan keterampilan; Membimbing pelatihan; Mengecek pemahaman dan memberika umpan balik; Memberikan latihan dan penerapan konsep")
# C. Strategi pembelajaran tidak langsung (pp. 10-13)
fakta("tl_nama", 10, "Strategi pembelajaran tidak langsung sering disebut inkuiri, induktif, pemecahan masalah, pengambilang keputusan, dan penemuan")
fakta("tl_lengkap", 10, "meskipun dua strategi tersebut dapat saling melengkapi")
fakta("tl_peran", 10, "peran guru beralih dari penceramah menjadi fasilitator, pendukung, dan sumber personal (resource person)")
fakta("tl_libat", 10, "keterlibatan tinggi siswa dalam melakukan observasi, penyelidikan, pengambaran inferensi berdasarkan data atau pembentukan hipotesis")
fakta("tl_bahan", 10, "mensyaratkan digunakannya bahan-bahan cetak, non-cetak, dan sumber-sumber manusia")
fakta("tl_tanya", 10, "pengajuan pertanyaan yang tidak mengarah, dan selanjutnya memungkinkan muncul ide pada diri siswa")
fakta("tl_inti", 10, "menangkap inti pembicaraan atau jawaban siswa yang dapat digunakan untuk menolong mereka dalam melihat permasalahan secara lebih teliti")
fakta("tl_tunggu", 11, "menggunakan waktu tunggu untuk member kesempatan berpikir pada siswa")
fakta("tl_cocok", 11, "hasil belajar berkenaan dengan kemampuan berpikir, sikap, dan nilai; 2) proses sama pentingnya dengan produk; 3) siswa perlu melakukan investigasi atau menemukan sesuatu; 4) solusi masalah yang diberikan bersifat terbuka")
fakta("tl_cocok2", 11, "berkaitan dengan pengambilan keputusan atau masalah yang perlu dicari solusinya; dan 7) berkaitan dengan pengembangan kemampuan life- long learning")
fakta("tl_masalah", 12, "Bahan utama dikemas dalam bentuk sajian masalah")
fakta("scaffolding", 12, "pengajuan pertanyaan, pemberian hints (isyarat), dan pengajuan masalah yang berbeda, baik sebagai pembanding maupun untuk keperluan pengembangan")
fakta("multiarah", 12, "Model interaksi yang dikembangkan bersifat multiarah")
fakta("tl_model", 12, "1) inkuiri; 2) induktif; 3) pemecahan masalah; 4) action research 5) pengambilan keputusan; 6) penemuan; 7) investigasi; 8) eksplorasi; dan 9) eksperimen")
fakta("tl_lebih", 13, "1) mendorong ketertarikan dan keinginntahuan peserta didik; 2) menciptakan alternative dan menyelesaikan masalah 3) mendorong kreativitas dan pengembangan keterampilan interpersonal")
fakta("tl_kurang", 13, "kekurangan dari pembelajaran ini adalah memerlukan waktu panjang, outcome sulit diprediksi")
fakta("tl_cepat", 13, "Strategi pembelajaran ini juga tidak cocok apabila peserta didik perlu mengingat materi dengan cepat")
# D. Strategi pembelajaran interaktif (pp. 13-20)
fakta("int_def", 13, "Strategi pembelajaran interaktif merujuk kepada bentuk diskusi dan saling berbagi di antara peserta didik")
fakta("int_reaksi", 13, "memberikan reaksi terhadap gagasan, pengalaman, pandangan, dan pengetahuan guru atau kelompok, serta mencoba mencari alternative dalam berfikir")
fakta("int_bentuk", 13, "dikembangkan dalam rentang pengelompokan dan metode- metode interaktif, yang di dalamnya terdapat bentuk-bentuk diskusi kelas")
fakta("int_bentuk2", 14, "kelompok kecil atau pengerjaan tugas berkelompok dan kerjasama siswa secara berpasangan")
fakta("int_konstruktivis", 14, "Pembelajaran interaktif adalah suatu pendekatan yang merujuk pada pandangan konstruktivis")
fakta("int_bertanya", 14, "pembelajaran interaktif dirancang agar siswa mau bertanya, kemudian menemukan jawaban mereka sendiri")
fakta("int_peran", 14, "guru berperaan sebagai pengajar, motivator, fasilitator, mediator, evaluator, pembimbing, dan pembaru")
fakta("int_awal", 15, "Pertanyaan-pertanyaan yang muncul dari siswa dapat dimanfaatkan oleh guru untuk mengetahui kemampuan awal siswa")
fakta("int_tanya3", 15, "1) meninngkatkan tingkat berpikir siswa; 2) mengecek pemahaman siswa; dan 3) meningkatkan partisipasi belajar siswa")
fakta("int_ciri", 15, "Adanya variasi kegiatan klasikal, kelompok dan perseorangan")
fakta("int_ciri2", 15, "Menerapkan pola komunikasi banyak arah")
fakta("int_ciri3", 15, "Suasana kelas yang fleksibel, demokratis, menantang, dan tetap terkendali oleh tujuan")
fakta("int_campuran", 16, "hal ini sulit terjadi pada mixed ability, karena pada umumnya interaksi hanya terjadi antara siswa pandai dengan guru")
fakta("int_multiarah", 16, "pola interaksi optimal antara guru dengan siswa, antara siswa dengan guru, dan antara siswa dengan siswa merupakan komunikasi multiarah")
fakta("tujuh_tahap", 16, "1) tahap persiapan (preparation); 2) tahap pengetahuan awal (before view); 3) tahap kegiatan (exploratory); 4) tahap pertanyaan anak (children question); 5) tahap penyelidikan ( investigation)")
fakta("tahap_67", 16, "6) tahap pengetahuan akhir (afters view); 7) tahap refleksi (reflection)")
fakta("persiapan", 17, "Guru mengumpulkan sumber-sumber yang akan digunakan dalam kegiatan pembelajaran")
fakta("pengetahuan_awal", 17, "Pengetahuan awal siswa dapat menjadi tolak ukur untuk dibandingkan dengan pengetahuan mereka setelah melakukan kegiatan")
fakta("eksplorasi", 18, "Kegiatan yang dilakukan untuk memunculkan keingintahuan siswa bias diajukan dalam bentuk pertanyaan, demonstrasi, menampilkan fenomena melalui video atau gambar")
fakta("pertanyaan_siswa", 18, "hendaknya guru mengarahkan siswa untukk memilih pertanyaan yang berkaitan dengan topic yang jawabannya dapat diselidiki melalui kegiatan penyelidikan dan investigasi")
fakta("penyelidikan", 18, "siswa diberi kesempatan untuk menemukan konsep melalui pengumpulan, pengorganisasian dan menganalisis data")
fakta("pengetahuan_akhir", 19, "siswa diminta untuk membandingkan apa yang sekarang mereka ketahui dengan apa yang sebelumnya mereka ketahui")
fakta("refleksi", 19, "guru memberikan penguatan serta meluruskan hal-hal yang massih keliru")
fakta("pemantul", 19, "memberi kesempatan kepada siswa untuk mendiskusikan jawaban, dan menjadi ”dinding pemantul” atas jawaban siswa")
fakta("int_lebih", 19, "peserta didik belajar mengajukan pertanyaan, mencoba merumuskan pertanyaan, dan mecoba menemukan jawaban terhadap pertanyaan sendiri dengan melakukan observasi")
fakta("int_argumen", 20, "mengorganisasika pemikiran dan membangun argument yang rasional")
fakta("int_kurang", 20, "kekurangan dari strategi ini adalah sangat bergantung pada kecakapan guru dalam menyusun dan mengembangkan dinamika kelompok")
fakta("gambar32", 17, "Gambar 3.2 Tahapan Pembelajaran Interaktif: Persiapan; Pengetahuan awal; Kegiatan eksplorasi; Pertanyaan siswa; penyelidikan; Pengetahuan akhir; refleksi; perbandingan; Pertanyaan susulan")
# E. Strategi pembelajaran empirik (pp. 20-24)
fakta("emp_def", 20, "Strategi pembelajaran melalui pengalaman menggunakan bentuk sekuens induktif, berpusat pada siswa")
fakta("emp_proses", 20, "Penekanan dalam strategi pembelajaran melalui pengalaman adalah pada proses belajar, bukan pada hasil belajar")
fakta("emp_simulasi", 20, "di dalam kelas dapat digunakan metode simulasi, sedangkan diluar kelas dapat dikembangkan dengan metode observasi")
fakta("emp_bukan_transfer", 20, "hasil pembelajaran berlangsung secraa alamiah dalam bentuk kegiatan siswa bekerja dan mengalami, bukan transfer pengetahuan dari guru pada siswa")
fakta("kolb", 21, "dikembangkan oleh David Kolb sekitar awal 1980-an")
fakta("emp_utama", 21, "Dalam Experiental Learning, pengalaman mempunyai peran utama dalam proses belajar")
fakta("emp_tiga", 21, "a. Mengubah struktur kognitif murid; b. Mengubah sikap murid; c. Memperluas ketrampilan-ketrampilan murid yang telah ada")
fakta("emp_kualitas", 21, "mencakup keterlibatan murid secara personal, berinisiatif, evaluasi oleh murid sendiri, dan adanya efek yang membekas pada murid")
fakta("emp_empat", 22, "a. Tahap pengalaman nyata; b. Tahap observasi refleksi; c. Tahap konseptualisasi; d. Tahap implementasi")
fakta("emp_refleksi", 22, "Pengalaman tersebut kemudian direfleksikan secara individu")
fakta("emp_konsep", 22, "Refleksi ini menjadi dasar konseptualisasi atau proses pemahaman prinsip-prinsip yang mendasari pengalaman yang dialami")
fakta("finding_out", 23, "Proses pengalaman dan refleksi dikategorikab sebagar proses penemuan (finding out) sedangkan proses konseptualisasi dan implementasi dikategorokan dalam proses penerapan (taking action)")
fakta("tabel32", 23, "Tabel 3.2: Concrete Experience (CE) Feeling (perasaan); Reflection observation (RO) Watching (mengamati); Abstract Conceptualization (AC) Thinking (berpikir); Active experimentation (AE) Doing (berbuat)")
fakta("siklus", 24, "Hasil dari tahap eksperimen akan menuntut kembali pembelajaran menuju tahap pengalaman konkret")
fakta("stimulus", 24, "Aktivitas yang disediakan biasa di dalam ataupun di luar kelas, dan dikkerjakan oleh pribadi atau kelompok")
# F. Strategi pembelajaran mandiri (pp. 24-27)
fakta("mandiri_def", 24, "pengaturan program belajar yang diorganisasikan sedemikian rupa sehinggga tiap peserta didik dapat memilih atau menentukan bahan dan kemajuan belajar sendiri")
fakta("mandiri_tujuan", 25, "bertujuan untuk membangun inisiatif individu, kemandirian, dan peningkatan diri")
fakta("mandiri_teman", 25, "Belajar mandiri juga bias dilakukan dengan teman atau sebagai bagian dari kelompok kecil")
fakta("mandiri_klasikal", 25, "Pembelajaran mandiri dimaksudkan untuk mengatasi kelemahan pengajaran klasikal, terutama dengan maksud memberi kesempatankepada sisiwa untuk maju sesuai dengan kecepatan masing-masing")
fakta("langkah_pendek", 25, "Prinsip dasar pengajaran berprogram dan modul adalah belajar dengan langkah pendek")
fakta("unit_kecil", 25, "bahan belajar harus dipecah menjadi unit terkecil dan siswa harus lebih aktif mengikuti pembelajaran")
fakta("berhasil", 25, "Siswa akan lebih giat belajar bila ia merasa berhasil")
fakta("bertahap", 25, "materi pelajaran harus di ajarkan secara bertahapdan berkesinambungan")
fakta("penentuan", 26, "a. Tujuan belajar, jenis, dan jenjangnya b. Cara penyajian bahan pelajaran c. Media yang digunakan d. Biaya yang diperlukan e. Waktu yang diberikan dan jadwalnya")
fakta("dikendalikan", 26, "variable yang dapat di control oleh penyelengara system belajar mandiri adalah waktu yang diberikan dan kualitas instruksional")
fakta("ketat_luwes", 26, "Waktu yang diberikan dapat bersifat ketat atau luwes")
fakta("kualitas", 27, "Kualitas instruksional mengandung empat rujukan, yaitu kesesuaian, daya tarik, evektif, dan efisien")
fakta("tempat_waktu", 27, "Peserta diharapkan mampu belajar di tempat yang di tentukan sendiri, pada waktu yang dipilihnya sendiri, dan dengan cara belajar sendiri")
fakta("tergantung", 27, "Namun hal ini tergantung pada kondisi dan karakteristik peserta, serta kualitas bahan pelajaran")
fakta("mastery", 27, "kegitan belajar ini tidak dibatasi waktu, jadi lebih ditekankan pada pendekatan penguasaan (mastery concept)")
fakta("bukti", 27, "dengan seft-test (tes sendiri), tes baku yang dapat diambilkapan saja, tes kolokium, dan pembuatan fortofolio")
fakta("psikomotor", 27, "Materi yang mengandung aspek psikomotor lebih sulit untuk dikembangkan, apalagi kalau harus berpegangan pada satu medium saja")
# G. Memilih strategi pembelajaran yang tepat (p. 28)
fakta("metode_bagian", 28, "Metode pembelajaran merupakan bagian dari strategi pembelajaran")
fakta("tidak_setiap", 28, "tidak setiap metode pembelajaran biasa digunakan atau sesuai untuk mencapai tujuan pembelajaran tertentu")
fakta("kaku", 28, "guru merasa kaku dengan mempergunakan satu atau dua metodemenerjemahkan metode itu secara sempit")
fakta("variatif", 28, "metode- metode dapat digunakan secara farativ, dalam arti tidak monoton dalam satu metode")
fakta("kriteria_a", 28, "Kesesuaian antara strategi pembelajaran dengan tujuan atau kompetensi")
fakta("kriteria_b", 28, "Kesesuaian strategi pembelajaran dngan jenis pengetahuan yang akan disampaikan")
fakta("kriteria_c", 28, "Kesesuaian strategi pembelajaran dengan sasaran (kemampuan awal, karakteristik yang berhubungan dengan latar belakang dan status social, karakteristik yang berkaitan dengan perbedaan-perbedaan kepribadian)")
fakta("kriteria_d", 28, "d. Biaya e. Kemampuan strategi pembelajaran (kelompok atau individu)")
fakta("kriteria_f", 28, "Karakteristik strategi pembelajaran (kelemahan maupun kelebihanya)")
# For the book-error record only (used by no lesson section and no option)
fakta("ras", 1, "ras mongoloid, ras kaukasoid, dan ras negroid")
fakta("jarak_jauh_ini", 2, "kegiatan-kegiatan perkuliahan yang diikuti dalam rangka program pendidikan jarak jauh ini")
fakta("gambar31", 4, "Gambar 3.1 Klasifikasi Strategi Pembelajaran")
fakta("menentukan_info", 5, "efektif untuk menentukan informasi")
fakta("matematika", 7, "dalam hal ini adalah pembelajaran matematika")
fakta("sepuluh_menit", 7, "siswa akan kehilangan perhatian setelah 10-15 menit")
fakta("eternity", 9, "langit-langit rumah dari eternity")
fakta("pendekatan_langsung", 11, "Menurut Robertson dan lang (1991), pendekatan langsung antara lain memiliki karakteristik sebagai berikut : 1) investigasi")
fakta("terpotong", 16, "Oleh karena itu, agar siswa termotivasi dalam komunikasi multiarah, maka")
fakta("efektif_afektif", 21, "cenderung ebih menekankan sisi kognisi daripada efektif")
fakta("tidak_efektif", 21, "apabila salah satu elemen tidak ada, maka kedua elemen lainnya tidak efektif")
fakta("roses", 24, "dimulai dari sebuah pengalaman konkret yang ditunjukkan dengan roses refleksi")
fakta("kurang_kompeten", 25, "untuk mengatasi kesulitan mengajar bagi guru yang kurang kompeten")
fakta("carroll", 26, "keberhasilan belajar = waktu yang diperlukan dan waktu yang digunakan")
fakta("budaya", 27, "belum berbudaya membaca, apalagi membaca secara mandiri")
fakta("kriteria_1", 28, "guru harus mengacu pada kriteria sebagai berikut: 1.")
REKAMAN = {"ras", "jarak_jauh_ini", "gambar31", "menentukan_info", "matematika", "sepuluh_menit", "eternity", "pendekatan_langsung",
           "terpotong", "efektif_afektif", "tidak_efektif", "roses", "kurang_kompeten", "carroll", "budaya", "kriteria_1"}
# Tables and diagrams printed as images; read by eye.
GAMBAR = {"tabel31", "gambar32", "tabel32"}
DEPAN = {k for k, (h, _) in FAKTA.items() if isinstance(h, str)}

# ── The lessons.
SUMBER = ("_Diadaptasi dari Strategi Pembelajaran, Siti Nurhasanah dkk., Penerbit EDU PUSTAKA, 2019, "
          "Bab II. Materi uji internal, bukan untuk distribusi._")
PEMBERITAHUAN = "**UJI INTERNAL / MATERI PERAGAAN — TIDAK UNTUK DISTRIBUSI PRODUKSI**"
SITASI = ("Sumber: Dr. Siti Nurhasanah, M.Pd; Dr. (Cdt) Agus Jayadi, M.Pd; Dr. Rika Sa'diyah, M.Pd; "
          "Syafrimen, M.Ed, Ph.D. *Strategi Pembelajaran*. Jakarta: Penerbit EDU PUSTAKA, 2019, Cetakan Pertama. "
          "ISBN 978-623-90461-7-0. Bab II «Klasifikasi dan Pemilihan Strategi Pembelajaran», hlm. 37–82.")
UJI = "[UJI INTERNAL] "

KURSUS = {
    "Judul kursus*": "[UJI INTERNAL] Strategi Pembelajaran — Bab 2: Klasifikasi dan Pemilihan Strategi Pembelajaran",
    "Mata pelajaran*": "Pengembangan Kompetensi",
    "Jenjang*": "Guru",
    "Kelas*": "Guru",
    "Konteks": "Pengembangan profesi",
}

BAB = [(1, UJI + "Klasifikasi dan Pemilihan Strategi Pembelajaran")]

PELAJARAN = [
    dict(no=1, judul=UJI + "Klasifikasi Strategi Pembelajaran",
         ringkasan="Strategi pembelajaran dapat dikelompokkan menurut beberapa dasar: pengaturan guru dan peserta didik, pengolahan pesan, dan lima kelompok Saskatchewan.",
         tujuan="Anda dapat menggolongkan suatu rencana pembelajaran menurut dasar klasifikasi yang tepat dan menyadari keputusan apa yang sedang Anda ambil.",
         bloom="Memahami",
         jejak=[("(pembuka)", ["isbn", "terbit", "cetakan", "daftar_isi"]),
                ("Dasar klasifikasi", ["dasar", "raka_joni"]),
                ("Pengaturan guru dan peserta didik", ["pengaturan_guru", "tatap_muka", "jarak_jauh", "individual", "kelompok_kecil",
                                                     "klasikal", "klasikal_format"]),
                ("Pengolahan pesan", ["ekspositorik", "ekspositorik_peran", "heuristik", "heuristik_tujuan", "heuristik_guru",
                                     "deduktif", "deduktif_langkah", "induktif", "induktif_langkah"]),
                ("Lima kelompok strategi", ["saskatchewan", "emp_def", "daftar_isi"]),
                ("Situasi di kelas", ["klasikal", "ekspositorik", "deduktif", "kelompok_kecil", "heuristik", "induktif"])],
         isi=PEMBERITAHUAN + "\n\n" + SITASI + " Materi ini adalah adaptasi dekat untuk peragaan internal.\n\n" + """## Dasar klasifikasi

Mengelompokkan strategi memerlukan dasar, yaitu kriteria atau titik tolak pengelompokan. Satu strategi dapat digolongkan secara berbeda menurut dasar yang dipakai. Mengutip Raka Joni, bab ini menyebut empat sudut pandang: pengaturan guru dan peserta didik, pengolahan pesan, struktur peristiwa belajar-mengajar, dan tujuan belajar. Dua yang pertama diuraikan di bawah ini.

## Pengaturan guru dan peserta didik

- **Pengaturan guru**: diajar oleh seorang guru, atau oleh tim yang terdiri atas lebih dari satu guru (*team teaching*).
- **Hubungan guru dan peserta didik**: tatap muka, ketika guru dan peserta didik berada dalam satu ruang dan berkomunikasi langsung; atau jarak jauh, ketika interaksi berlangsung melalui media atau teknologi.
- **Pengaturan peserta didik**: individual, ketika setiap peserta didik belajar sesuai kemampuannya sendiri; kelompok kecil, sekitar 4–7 orang yang berdiskusi atau mengerjakan tugas; dan klasikal, sekitar 35–45 orang yang dianggap setara usia dan kemampuannya, lalu diajar dengan format yang sama untuk semua.

## Pengolahan pesan

Dari **peran** guru dan peserta didik dalam mengolah pesan:

- **Ekspositorik**: berorientasi pada guru. Guru mengolah pesan menjadi «barang jadi», lalu menyampaikannya. Guru menyusun program, memberi informasi, menyediakan fasilitas, membimbing, dan menilai; peserta didik menerima informasi dan menyelesaikan tugas.
- **Heuristik**: peserta didik terlibat aktif mengolah pesan. Tujuannya kemampuan intelektual, berpikir kritis, dan pemecahan masalah. Guru menciptakan suasana berpikir agar peserta didik berani menjelajah dan menemukan.

Dari **proses** pengolahan pesan:

- **Deduktif**: dari yang umum ke yang khusus. Guru mengemukakan generalisasi, menjelaskan konsep, lalu peserta didik mencari data.
- **Induktif**: dari yang khusus ke yang umum. Peserta didik mulai dari data atau peristiwa khusus, menyusun konsep, merumuskan generalisasi, menerapkannya pada data baru, lalu menarik kesimpulan lanjut.

## Lima kelompok strategi

Bab ini juga memakai klasifikasi Saskatchewan Education (1991) yang membagi strategi menjadi lima: langsung, tidak langsung, interaktif, empirik, dan mandiri. Kelompok empirik adalah yang di Bab 1 disebut strategi «melalui pengalaman». Pelajaran 2–6 membahas kelimanya satu per satu, dan pelajaran 7 membahas cara memilih di antaranya.

## Situasi di kelas

Seorang guru Fisika SMA mengajar 36 peserta didik. Ia membuka pelajaran dengan menjelaskan hukum Archimedes lalu memberi contoh soal; setelah itu kelompok berlima mengukur benda di air dan merumuskan sendiri polanya.

Bagian pertama dapat digolongkan sebagai klasikal, ekspositorik, dan deduktif. Bagian kedua adalah kelompok kecil, heuristik, dan induktif. Satu pertemuan dapat digolongkan menurut beberapa dasar sekaligus. Dengan menyebut dasarnya, Anda tahu keputusan mana yang sedang Anda ambil: cara mengatur peserta didik, siapa yang mengolah pesan, atau arah penalarannya.

""" + SUMBER),
    dict(no=2, judul=UJI + "Strategi Pembelajaran Langsung",
         ringkasan="Pembelajaran langsung berpusat pada guru, berjalan dalam lima fase, dan kuat untuk pengetahuan prosedural dan deklaratif yang terstruktur.",
         tujuan="Anda dapat menyusun pembelajaran langsung dalam lima fase dan menilai kapan strategi ini perlu dipadukan dengan strategi lain.",
         bloom="Menerapkan",
         jejak=[("Pengertian", ["langsung_def", "langsung_libat", "langsung_format", "langsung_tahap", "langsung_deduktif", "langsung_tujuan"]),
                ("Lima fase", ["lima_fase", "tabel31", "fase1", "fase1_papan", "fase2", "fase2_kecil", "fase2_ulang", "fase3", "fase3_monitor",
                               "fase4", "fase4_ulang", "fase5", "lingkungan"]),
                ("Kelebihan dan keterbatasan", ["kendali", "besar_kecil", "prestasi_rendah", "ceramah_guna", "arah_diri", "beda", "sosial",
                                               "image_guru", "komunikasi", "langsung_lemah", "langsung_kombinasi"]),
                ("Situasi di kelas", ["fase2_kecil", "fase3", "fase3_monitor", "fase2_ulang", "fase5", "langsung_kombinasi"])],
         isi="""## Pengertian

Pembelajaran langsung dirancang untuk dua jenis pengetahuan yang terstruktur baik dan dapat dipelajari selangkah demi selangkah: pengetahuan prosedural (cara melakukan sesuatu) dan pengetahuan deklaratif (fakta, konsep, prinsip, generalisasi). Strategi ini berpusat pada guru, tetapi tetap harus menjamin keterlibatan peserta didik. Guru menyajikan materi dalam format terstruktur, mengarahkan kegiatan, dan menguji keterampilan melalui latihan terbimbing. Pembelajaran langsung biasanya deduktif dan efektif untuk membangun keterampilan tahap demi tahap.

Tujuannya dirumuskan spesifik dan berorientasi pada peserta didik, dengan kondisi penilaian dan kriteria keberhasilan yang jelas.

## Lima fase

1. **Menyampaikan tujuan dan menyiapkan peserta didik.** Menarik dan memusatkan perhatian serta memotivasi. Tujuan dapat ditulis di papan bersama tahapan pelajaran dan alokasi waktunya.
2. **Mendemonstrasikan pengetahuan dan keterampilan.** Kuncinya penyajian sejelas mungkin: langkah-langkah kecil, contoh, pemodelan, dan penjelasan ulang untuk bagian yang sulit.
3. **Membimbing pelatihan.** Peserta didik berlatih; guru memantau, bertanya untuk menilai pemahaman, dan mengoreksi kesalahan konsep.
4. **Mengecek pemahaman dan memberi umpan balik.** Misalnya dengan kuis singkat dan tinjauan, lalu mengulang keterampilan bila perlu.
5. **Latihan lanjutan dan penerapan.** Tugas mandiri, dengan perhatian pada situasi yang lebih kompleks dan kehidupan sehari-hari.

Strategi ini memerlukan ruang yang tenang, penerangan cukup, dan media yang sesuai.

## Kelebihan dan keterbatasan

Kelebihan yang disebut bab ini:

- guru mengendalikan isi dan urutan informasi, sehingga fokus pada apa yang harus dicapai terjaga;
- dapat efektif di kelas besar maupun kecil;
- efektif untuk konsep dan keterampilan eksplisit bagi peserta didik berprestasi rendah;
- ceramah membantu peserta didik yang kurang suka membaca atau belum terampil menafsirkan informasi;
- peserta didik yang belum mampu mengarahkan dirinya sendiri tetap dapat berprestasi.

Keterbatasannya:

- sulit melayani perbedaan kemampuan, pengetahuan awal, dan gaya belajar;
- kesempatan terlibat aktif sedikit, sehingga keterampilan sosial dan interpersonal sulit berkembang;
- keberhasilannya bergantung pada kesiapan, kepercayaan diri, dan gaya komunikasi guru.

Kelemahan utamanya ada pada pengembangan pemikiran kritis, hubungan interpersonal, dan belajar kelompok. Karena itu bab ini menganjurkan agar pembelajaran langsung dipadukan dengan strategi lain.

## Situasi di kelas

Seorang guru Matematika SMP mengajarkan cara melukis segitiga dengan jangka. Setelah demonstrasi, separuh kelas keliru pada langkah yang sama saat latihan.

Menurut fase-fase di atas, masalahnya muncul di antara fase 2 dan 3. Guru dapat memecah langkah itu menjadi langkah yang lebih kecil, menjelaskannya ulang, lalu kembali berkeliling sambil bertanya selama latihan terbimbing. Latihan mandiri baru diberikan setelah pemahaman dicek. Bila tujuan berikutnya adalah menalar mengapa lukisan itu benar, Anda dapat beralih ke strategi yang melibatkan diskusi.

""" + SUMBER),
    dict(no=3, judul=UJI + "Strategi Pembelajaran Tidak Langsung",
         ringkasan="Strategi tidak langsung berpusat pada peserta didik yang menyelidiki masalah, dengan guru sebagai fasilitator; ia memerlukan waktu dan tidak cocok untuk hafalan cepat.",
         tujuan="Anda dapat menilai kapan strategi tidak langsung tepat dipakai dan memfasilitasi penyelidikan tanpa memberikan jawabannya.",
         bloom="Mengevaluasi",
         jejak=[("Pengertian", ["tl_nama", "tl_lengkap", "tl_peran", "tl_libat", "tl_bahan"]),
                ("Kapan strategi ini cocok", ["tl_cocok", "tl_cocok2", "tl_model"]),
                ("Cara guru memfasilitasi", ["tl_masalah", "tl_tanya", "tl_inti", "tl_tunggu", "scaffolding", "multiarah"]),
                ("Kelebihan dan kekurangan", ["tl_lebih", "tl_kurang", "tl_cepat"]),
                ("Situasi di kelas", ["scaffolding", "tl_tanya", "tl_tunggu", "tl_cocok"])],
         isi="""## Pengertian

Strategi tidak langsung sering disebut inkuiri, induktif, pemecahan masalah, pengambilan keputusan, atau penemuan. Strategi ini berpusat pada peserta didik, tetapi dapat saling melengkapi dengan strategi langsung. Peserta didik terlibat tinggi dalam mengamati, menyelidiki, menarik inferensi dari data, dan membentuk hipotesis. Guru tidak lagi berceramah, tetapi menjadi fasilitator, pendukung, dan narasumber. Strategi ini memerlukan bahan cetak, noncetak, dan sumber manusia.

## Kapan strategi ini cocok

Mengutip Robertson dan Lang, bab ini menyebut strategi tidak langsung cocok bila:

- hasil belajar yang dituju berupa kemampuan berpikir, sikap, dan nilai;
- proses sama pentingnya dengan hasil;
- peserta didik perlu menyelidiki atau menemukan sesuatu;
- masalahnya terbuka, dengan lebih dari satu solusi;
- pembelajaran diarahkan pada pemahaman pribadi yang bertahan lama, pengambilan keputusan, atau kemampuan belajar sepanjang hayat.

Sebelum memakai strategi ini, periksa apakah tujuan pertemuan Anda termasuk di antaranya. Model yang termasuk di dalamnya antara lain inkuiri, pemecahan masalah, penelitian tindakan, penemuan, investigasi, eksplorasi, dan eksperimen.

## Cara guru memfasilitasi

Bahan utama disajikan sebagai masalah. Guru membantu secara tidak langsung, melalui *scaffolding*:

- pertanyaan yang tidak mengarahkan pada satu jawaban, agar gagasan muncul dari peserta didik;
- menangkap inti jawaban peserta didik untuk membantu mereka melihat masalah lebih teliti;
- isyarat (*hints*) dan masalah pembanding;
- waktu tunggu agar peserta didik sempat berpikir.

Interaksi di kelas bersifat multiarah.

## Kelebihan dan kekurangan

Strategi ini mendorong rasa ingin tahu, kemampuan mencari alternatif dan memecahkan masalah, kreativitas, keterampilan interpersonal, dan pemahaman yang lebih baik. Kekurangannya: memerlukan waktu panjang, hasilnya sulit diprediksi, dan tidak cocok bila peserta didik perlu mengingat materi dengan cepat.

## Situasi di kelas

Seorang guru Geografi SMA meminta kelompok merumuskan cara mengurangi banjir di kampung sekitar sekolah. Setelah sepuluh menit, satu kelompok masih buntu.

Guru tidak memberikan jawabannya. Ia bertanya, «Air dari mana saja yang masuk ke saluran itu?», lalu memberi waktu tunggu. Pertanyaan itu adalah isyarat yang membuka jalan tanpa menutup penyelidikan. Ketika kelompok-kelompok kemudian mengusulkan solusi yang berbeda, guru tidak memilih satu jawaban yang dianggap benar: masalahnya terbuka, sehingga setiap usulan ditimbang dari data dan alasannya.

""" + SUMBER),
    dict(no=4, judul=UJI + "Strategi Pembelajaran Interaktif",
         ringkasan="Strategi interaktif bertumpu pada diskusi dan pertanyaan peserta didik, berjalan dalam tujuh tahap, dan bergantung pada kecakapan guru mengelola dinamika kelompok.",
         tujuan="Anda dapat menjalankan tahap-tahap pembelajaran interaktif dan menjaga agar interaksi di kelas benar-benar multiarah.",
         bloom="Menerapkan",
         jejak=[("Pengertian", ["int_def", "int_reaksi", "int_bentuk", "int_bentuk2", "int_konstruktivis", "int_bertanya", "int_peran"]),
                ("Ciri dan peran pertanyaan", ["int_ciri", "int_ciri2", "int_ciri3", "int_awal", "int_tanya3", "int_campuran", "int_multiarah"]),
                ("Tujuh tahap", ["tujuh_tahap", "tahap_67", "gambar32", "persiapan", "pengetahuan_awal", "eksplorasi", "pertanyaan_siswa",
                                 "penyelidikan", "pengetahuan_akhir", "refleksi", "pemantul"]),
                ("Kelebihan dan kekurangan", ["int_lebih", "int_argumen", "int_kurang"]),
                ("Situasi di kelas", ["eksplorasi", "pertanyaan_siswa", "pengetahuan_awal", "pengetahuan_akhir", "refleksi"])],
         isi="""## Pengertian

Strategi interaktif bertumpu pada diskusi dan saling berbagi antarpeserta didik. Melalui diskusi, peserta didik menanggapi gagasan, pengalaman, dan pengetahuan guru maupun teman, lalu mencari cara berpikir alternatif. Bentuknya diskusi kelas, diskusi kelompok kecil atau tugas kelompok, dan kerja berpasangan.

Bab ini menempatkan strategi interaktif dalam pandangan konstruktivis: pembelajaran dirancang agar peserta didik mau bertanya, lalu menemukan jawabannya sendiri. Guru dapat berperan sebagai motivator, fasilitator, mediator, pembimbing, evaluator, dan pembaru, di samping sebagai pengajar.

## Ciri dan peran pertanyaan

Ciri pembelajaran interaktif antara lain:

- kegiatan klasikal, kelompok, dan perseorangan yang bervariasi;
- keterlibatan pikiran dan perasaan peserta didik yang tinggi;
- komunikasi banyak arah;
- suasana fleksibel, demokratis, dan menantang, tetapi tetap terkendali oleh tujuan.

Pertanyaan peserta didik memperlihatkan kemampuan awal mereka. Pertanyaan dalam pembelajaran bertujuan meningkatkan tingkat berpikir, mengecek pemahaman, dan meningkatkan partisipasi. Pola yang dituju adalah komunikasi multiarah: guru dengan peserta didik, dan peserta didik dengan peserta didik. Di kelas yang kemampuannya beragam, pola ini sulit tercapai, karena interaksi cenderung terjadi antara guru dan peserta didik yang pandai.

## Tujuh tahap

Mengikuti Faire dan Cosgrove:

1. **Persiapan**: guru menyiapkan sumber, alat, dan media.
2. **Pengetahuan awal**: guru menyajikan masalah dan menanyakan pendapat peserta didik; jawaban ini menjadi tolok ukur pembanding.
3. **Kegiatan eksplorasi**: demonstrasi, video, atau gambar untuk memancing rasa ingin tahu.
4. **Pertanyaan peserta didik**: kelompok menulis pertanyaan; guru mengajak kelas memilih yang berkaitan dengan topik dan dapat diselidiki.
5. **Penyelidikan**: peserta didik mengumpulkan, mengorganisasikan, dan menganalisis data.
6. **Pengetahuan akhir**: peserta didik membandingkan apa yang kini mereka ketahui dengan pengetahuan awalnya.
7. **Refleksi**: peserta didik menimbang apa yang dipelajari dan boleh mengajukan pertanyaan susulan; guru memberi penguatan dan meluruskan pemahaman yang keliru.

Saat bertanya, guru memberi kesempatan untuk mendiskusikan jawaban dan menjadi «dinding pemantul» bagi jawaban peserta didik.

## Kelebihan dan kekurangan

Peserta didik belajar merumuskan pertanyaan dan mencari jawabannya lewat pengamatan, belajar dari teman, serta menyusun argumen yang rasional. Kekurangannya: keberhasilan strategi ini sangat bergantung pada kecakapan guru mengelola dinamika kelompok.

## Situasi di kelas

Seorang guru IPA kelas IX memperlihatkan telur yang tenggelam di air tawar tetapi mengapung di air garam. Pertanyaan kelompok berdatangan, sebagian tidak berkaitan dengan topik. Guru menulis semuanya di papan, lalu bersama kelas memilih pertanyaan yang dapat diselidiki dengan alat yang tersedia.

Sebelum penyelidikan, guru sudah mencatat dugaan awal tiap kelompok. Setelah kelompok mengukur kadar garam dan mencatat hasilnya, ia meminta mereka membandingkan temuan itu dengan dugaan awalnya, lalu menutup dengan refleksi dan pertanyaan susulan. Dengan urutan ini Anda dapat melihat seberapa jauh pemahaman peserta didik bergeser.

""" + SUMBER),
    dict(no=5, judul=UJI + "Strategi Pembelajaran Empirik",
         ringkasan="Strategi empirik membangun pengetahuan dari pengalaman melalui siklus Kolb: pengalaman konkret, refleksi, konseptualisasi, dan penerapan.",
         tujuan="Anda dapat merancang pembelajaran empirik yang melalui keempat tahap siklus Kolb, termasuk tahap refleksi.",
         bloom="Menerapkan",
         jejak=[("Pengertian", ["emp_def", "emp_proses", "emp_simulasi", "emp_bukan_transfer"]),
                ("Dasar dari Kolb", ["kolb", "emp_utama", "emp_tiga", "emp_kualitas"]),
                ("Siklus empat tahap", ["emp_empat", "tabel32", "emp_refleksi", "emp_konsep", "finding_out", "siklus", "stimulus"]),
                ("Situasi di kelas", ["emp_simulasi", "emp_refleksi", "emp_konsep", "siklus"])],
         isi="""## Pengertian

Strategi empirik memakai urutan induktif, berpusat pada peserta didik, dan berorientasi pada aktivitas. Tekanannya pada proses belajar, bukan pada hasil belajar. Strategi ini dapat dipakai di dalam kelas, misalnya melalui simulasi, maupun di luar kelas, misalnya melalui observasi. Hasil belajar tumbuh dari peserta didik yang bekerja dan mengalami, bukan dari pemindahan pengetahuan guru kepada peserta didik.

## Dasar dari Kolb

Dasar strategi ini adalah *Experiential Learning Theory* yang dikembangkan David Kolb sekitar awal 1980-an. Dalam teori ini pengalaman memegang peran utama dalam belajar. Pembelajaran empirik bertujuan mengubah struktur kognitif, mengubah sikap, dan memperluas keterampilan peserta didik. Mutunya tampak dari keterlibatan pribadi peserta didik, inisiatifnya, evaluasi oleh peserta didik sendiri, dan kesan yang membekas.

## Siklus empat tahap

1. **Pengalaman konkret** (merasakan): peserta didik diberi rangsangan untuk melakukan suatu aktivitas, di dalam atau di luar kelas, sendiri atau berkelompok.
2. **Observasi reflektif** (mengamati): pengalaman itu direfleksikan secara individu; peserta didik berusaha memahami apa yang terjadi.
3. **Konseptualisasi abstrak** (berpikir): refleksi menjadi dasar untuk memahami prinsip di balik pengalaman.
4. **Penerapan atau eksperimen aktif** (berbuat): konsep diterapkan dan diuji pada situasi baru.

Pengalaman dan refleksi adalah tahap menemukan (*finding out*); konseptualisasi dan penerapan adalah tahap bertindak (*taking action*). Hasil penerapan membawa peserta didik ke pengalaman konkret berikutnya, sehingga siklus berulang.

## Situasi di kelas

Seorang guru Ekonomi SMA mengadakan simulasi pasar: sebagian peserta didik menjadi penjual, sebagian pembeli, dengan persediaan barang yang berubah tiap babak. Sesudahnya, ia tidak langsung menjelaskan permintaan dan penawaran. Ia meminta setiap peserta didik menuliskan apa yang terjadi pada harga dan mengapa, lalu kelas merumuskan konsepnya dari catatan itu. Pada pertemuan berikutnya, konsep itu diterapkan untuk menentukan harga di bazar sekolah.

Tahap yang paling mudah terlewat adalah refleksi. Tanpa refleksi, pengalaman tinggal menjadi kegiatan yang menyenangkan, dan konsepnya kembali disampaikan guru. Saat merancang kegiatan empirik, sediakan waktu refleksi dalam jadwal Anda sejak awal.

""" + SUMBER),
    dict(no=6, judul=UJI + "Strategi Pembelajaran Mandiri",
         ringkasan="Belajar mandiri memberi peserta didik kendali atas bahan dan kemajuan belajarnya; mutunya ditentukan oleh bahan ajar, waktu, dan cara membuktikan penguasaan.",
         tujuan="Anda dapat merancang belajar mandiri dengan bahan berlangkah pendek, waktu yang sesuai, dan bukti penguasaan yang tepat.",
         bloom="Menerapkan",
         jejak=[("Konsep dasar", ["mandiri_def", "mandiri_tujuan", "mandiri_teman", "mandiri_klasikal", "langkah_pendek", "unit_kecil", "bertahap",
                                  "berhasil"]),
                ("Yang dapat Anda kendalikan", ["penentuan", "dikendalikan", "ketat_luwes", "kualitas"]),
                ("Kegiatan dan bukti penguasaan", ["tempat_waktu", "tergantung", "mastery", "bukti", "psikomotor"]),
                ("Situasi di kelas", ["unit_kecil", "ketat_luwes", "kualitas", "bukti", "psikomotor"])],
         isi="""## Konsep dasar

Belajar mandiri adalah pengaturan program belajar yang memungkinkan setiap peserta didik memilih atau menentukan bahan dan kemajuan belajarnya sendiri. Tujuannya membangun inisiatif, kemandirian, dan peningkatan diri, dengan fokus pada perencanaan belajar oleh peserta didik dan bantuan guru. Belajar mandiri dapat juga dilakukan bersama teman atau dalam kelompok kecil.

Bab ini menyebut belajar mandiri sebagai cara mengatasi kelemahan pengajaran klasikal: setiap peserta didik dapat maju sesuai kecepatannya. Bentuk yang banyak dipakai adalah modul, yang berprinsip belajar dengan langkah pendek:

- bahan dipecah menjadi unit-unit kecil;
- peserta didik dirangsang aktif, misalnya dengan tugas atau pertanyaan;
- materi disajikan bertahap dan berkesinambungan;
- rasa berhasil mendorong peserta didik untuk terus belajar.

## Yang dapat Anda kendalikan

Penentuan strategi belajar mandiri mencakup tujuan, cara penyajian, media, biaya, waktu dan jadwal, prosedur kegiatan, serta instrumen penilaian. Dua hal yang dapat dikendalikan penyelenggara adalah:

- **waktu yang diberikan**, yang dapat ketat atau luwes;
- **kualitas bahan ajar**, dengan empat ukuran: kesesuaian dengan peserta didik, daya tarik, efektivitas, dan efisiensi.

## Kegiatan dan bukti penguasaan

Idealnya peserta didik belajar di tempat, pada waktu, dan dengan cara yang dipilihnya sendiri; seberapa jauh ini mungkin bergantung pada kondisi peserta didik dan mutu bahan. Pada bentuk idealnya, belajar mandiri tidak dibatasi waktu dan menekankan penguasaan. Penguasaan dapat dibuktikan melalui tes mandiri, tes baku yang dapat diambil kapan saja, tes kolokium, dan portofolio.

Materi psikomotor lebih sulit dikembangkan untuk belajar mandiri, terutama bila hanya memakai satu medium seperti bahan cetak.

## Situasi di kelas

Seorang guru memberi modul pengayaan kepada peserta didik kelas X. Setelah seminggu, sebagian besar berhenti di unit kedua, yang panjang dan padat.

Menurut bab ini, yang perlu diperiksa lebih dulu adalah mutu bahan dan waktu yang diberikan. Unit itu dapat dipecah menjadi langkah pendek dengan pertanyaan di tiap langkah, batas waktunya dibuat luwes, dan tes mandiri di akhir unit memberi peserta didik bukti bahwa mereka berhasil. Bila modul itu juga memuat keterampilan praktik, bahan cetak saja tidak cukup.

""" + SUMBER),
    dict(no=7, judul=UJI + "Memilih Strategi Pembelajaran yang Tepat",
         ringkasan="Strategi dipilih dengan enam kriteria, dimulai dari kesesuaian dengan tujuan; metode adalah bagian strategi dan dapat divariasikan.",
         tujuan="Anda dapat memilih dan memadukan strategi untuk suatu pertemuan dengan menimbang keenam kriteria pemilihan.",
         bloom="Mengevaluasi",
         jejak=[("Metode sebagai bagian dari strategi", ["metode_bagian", "tidak_setiap", "kaku", "variatif"]),
                ("Enam kriteria pemilihan", ["kriteria_a", "kriteria_b", "kriteria_c", "kriteria_d", "kriteria_f"]),
                ("Menimbang dengan pelajaran sebelumnya", ["kriteria_b", "langsung_def", "tl_cocok", "tl_cepat", "langsung_lemah",
                                                          "int_argumen", "kriteria_f"]),
                ("Situasi di kelas", ["kriteria_a", "kriteria_c", "kriteria_d", "langsung_tahap", "tl_cocok", "int_bentuk2", "langsung_kombinasi"])],
         isi="""## Metode sebagai bagian dari strategi

Metode adalah bagian dari strategi: cara menyajikan, menguraikan, memberi contoh, dan memberi latihan. Tidak setiap metode sesuai untuk setiap tujuan. Bab ini mencatat bahwa guru kadang terpaku pada satu atau dua metode. Metode dapat dikembangkan dari pengalaman dan dipakai secara bervariasi, tidak monoton.

## Enam kriteria pemilihan

Dalam memilih strategi, guru mengacu pada kriteria berikut:

1. kesesuaian dengan tujuan atau kompetensi;
2. kesesuaian dengan jenis pengetahuan yang akan dipelajari;
3. kesesuaian dengan sasaran, yaitu kemampuan awal, latar belakang dan status sosial, serta perbedaan kepribadian peserta didik;
4. biaya;
5. kemampuan strategi melayani kelompok atau individu;
6. karakteristik strategi, yaitu kelebihan dan kelemahannya.

## Menimbang dengan pelajaran sebelumnya

Kriteria itu menjadi tajam bila dipadukan dengan pelajaran 2–6:

- Pengetahuan prosedural dan deklaratif yang terstruktur cocok dengan strategi langsung.
- Tujuan berupa kemampuan berpikir, sikap, nilai, atau masalah terbuka cocok dengan strategi tidak langsung, kecuali bila materi harus diingat dengan cepat.
- Kelemahan satu strategi dapat ditutup strategi lain. Misalnya, strategi langsung lemah dalam berpikir kritis dan kerja kelompok, sedangkan strategi interaktif melatih argumen.

## Situasi di kelas

Seorang guru Sejarah SMA mengajar 40 peserta didik tanpa proyektor. Tujuan pertemuannya ada dua: peserta didik dapat mengurutkan peristiwa sekitar Proklamasi, dan dapat menilai dua kesaksian yang berbeda tentang peristiwa yang sama.

Untuk tujuan pertama, strategi langsung yang singkat sudah memadai. Untuk tujuan kedua, ia memilih strategi tidak langsung atau interaktif dalam kelompok kecil dengan salinan cetak kedua kesaksian itu: sesuai tujuan, sesuai sasaran, dan murah. Dua strategi dalam satu pertemuan adalah hasil pemilihan yang disengaja, bukan kompromi. Saat Anda merancang pertemuan, mulailah dari tujuan, lalu timbang kriteria lainnya.

""" + SUMBER),
]

# Doubtful, dated or erroneous wording of the book stays out of every learner text.
DILUAR = ("mongoloid", "kaukasoid", "negroid", " ras ", "warna kulit", "jarak jauh ini", "menentukan informasi", "10-15 menit", "10–15 menit",
          "eternity", "kurang kompeten", "berbudaya membaca", "waktu yang diperlukan dan waktu yang digunakan",
          "pendekatan langsung antara lain", "Gambar 3.", "Tabel 3.", "Fellnz", "Usmanr", "kedua elemen lainnya tidak efektif")
JUDUL_BAGIAN = re.compile(r"^## (.+)$", re.M)
for _p in PELAJARAN:
    _isi = _p["isi"]
    judul = JUDUL_BAGIAN.findall(_isi)
    cek(3 <= len(judul) <= 6, f"lesson {_p['no']}: 3-6 pages")
    cek(_p["judul"].startswith(UJI), f"lesson {_p['no']}: [UJI INTERNAL] on the title")
    cek(_isi.rstrip().endswith(SUMBER), f"lesson {_p['no']}: attribution last")
    bagian = [j for j, _ in _p["jejak"] if j != "(pembuka)"]
    cek(bagian == judul, f"lesson {_p['no']}: JEJAK {bagian} against sections {judul}")
    for j, fids in _p["jejak"]:
        cek(fids and all(f in FAKTA and f not in REKAMAN for f in fids), f"lesson {_p['no']} {j}: facts {fids}")
    for bidang in ("judul", "ringkasan", "tujuan", "isi"):
        cek(not any(w in _p[bidang] for w in DILUAR), f"lesson {_p['no']} {bidang}: {[w for w in DILUAR if w in _p[bidang]]}")
        register(_p[bidang], f"lesson {_p['no']} {bidang}")
        notasi(_p[bidang], f"lesson {_p['no']} {bidang}")
    cek("Anda" in _isi, f"lesson {_p['no']}: the reader is addressed as Anda")
cek(PELAJARAN[0]["isi"].startswith(PEMBERITAHUAN + "\n\n" + SITASI))
cek(all(PEMBERITAHUAN not in p["isi"] for p in PELAJARAN[1:]))
cek(all(s in SITASI for s in ("978-623-90461-7-0", "EDU PUSTAKA", "2019", "Siti Nurhasanah", "Agus Jayadi", "Rika Sa'diyah", "Syafrimen")))
cek(KURSUS["Judul kursus*"].startswith(UJI) and all(b[1].startswith(UJI) for b in BAB))
# Naming: the book's «Empirik» throughout, and Bab 1's «melalui pengalaman» named exactly once, in lesson 1.
cek(sum(p[b].count("melalui pengalaman") for p in PELAJARAN for b in ("judul", "ringkasan", "tujuan", "isi")) == 1)
cek("melalui pengalaman" in PELAJARAN[0]["isi"] and "Empirik" in PELAJARAN[4]["judul"])

# ── Questions.
S = []
# Absolutes an educator rules out without the chapter; no distractor may carry one the key lacks.
MUTLAK = [r"apa pun", r"satu-satunya", r"sama persis", r"sama sekali", r"\bhanya\b", r"\bselalu\b", r"\bpasti\b",
          r"\btentu\b", r"tidak perlu", r"\bmenjamin\b"]


def soal(ref, pel, tanya, jawab, pilihan, guna="", sulit="Mudah", petunjuk=""):
    """`pilihan` lists the correct option first; `jawab` is the letter it is shown at. Each option
    is (teks, benar, alasan, fakta): the fact that decides whether the option holds."""
    cek(len(pilihan) == 4 and pilihan[0][1] and not any(p[1] for p in pilihan[1:]), ref)
    for teks, benar, alasan, fid in pilihan:
        cek(alasan.strip() != "", f"{ref}: every option has an Alasan")
        cek(fid in FAKTA and fid not in REKAMAN, f"{ref}: fact {fid}")
        for t in (teks, alasan):
            notasi(t, f"{ref} {teks}")
            register(t, f"{ref} {teks}")
            cek(not any(w in t for w in DILUAR), f"{ref}: kept-out wording in {t}")
    notasi(tanya, ref)
    register(tanya, ref)
    notasi(petunjuk, ref)
    register(petunjuk, ref)
    cek(len({p[0] for p in pilihan}) == 4, f"{ref}: four different options")
    # periksa_mutu's rules, applied here so that a failing option is caught where it is written.
    kunci, pengecoh = pilihan[0][0], [p[0] for p in pilihan[1:]]
    for token in {t for t in kunci.lower().split(" ") if len(t) >= 6}:
        cek(not (token in tanya.lower() and not any(token in d.lower() for d in pengecoh)),
            f"{ref}: STEM_REVEALS_ANSWER '{token}'")
    for pola in MUTLAK:
        cek(not any(re.search(pola, d) for d in pengecoh) or re.search(pola, kunci), f"{ref}: a distractor carries the absolute {pola}")
    rata = sum(len(p[0]) for p in pilihan) / 4
    cek(all(len(d) * 3 >= rata for d in pengecoh), f"{ref}: IMPLAUSIBLE_DISTRACTOR")
    cek(len(kunci) <= 2 * max(len(d) for d in pengecoh), f"{ref}: CORRECT_OPTION_LENGTH_IMBALANCE")
    cek(not all(len(kunci) > len(d) for d in pengecoh), f"{ref}: the correct option is strictly the longest")
    i = "ABCD".index(jawab)
    S.append(dict(ref=ref, pel=pel, tanya=tanya, pilihan=pilihan[1:i + 1] + [pilihan[0]] + pilihan[i + 1:],
                  guna=guna, sulit=sulit, petunjuk=petunjuk))


PA, PB = "Pemetaan awal", "Cek penguasaan"

# ── Pemetaan awal (pre-test): lessons 1, 2, 4 and 7.
soal("PA1", 1, "Seorang guru menjelaskan bahwa semua isi pelajarannya sudah ia olah menjadi rangkuman jadi, lalu ia sampaikan, dan peserta didik mencatat serta mengerjakan tugas. Dari segi peran guru dan peserta didik dalam mengolah pesan, strategi ini termasuk ...", "A", [
    ("strategi ekspositorik", True, "Pada strategi ekspositorik guru mengolah pesan menjadi barang jadi lalu menyampaikannya; peserta didik menerima dan menyelesaikan tugas.", "ekspositorik"),
    ("strategi heuristik", False, "Strategi heuristik menuntut peserta didik aktif mengolah pesan sendiri; di sini guru yang mengolahnya.", "heuristik"),
    ("strategi deduktif", False, "Deduktif menggolongkan arah penalaran, dari umum ke khusus; pertanyaannya tentang siapa yang mengolah pesan.", "deduktif"),
    ("strategi pembelajaran klasikal", False, "Klasikal menggolongkan pengaturan peserta didik dalam kelas; pertanyaannya tentang peran dalam mengolah pesan.", "klasikal"),
], guna=PA, sulit="Mudah")
soal("PA2", 2, "Setelah mendemonstrasikan cara menyusun tabel distribusi frekuensi, seorang guru meminta peserta didik mengerjakan dua soal serupa sementara ia berkeliling, bertanya, dan mengoreksi langkah yang keliru. Fase pembelajaran langsung ini adalah ...", "B", [
    ("membimbing pelatihan", True, "Pada fase ini peserta didik berlatih sementara guru memantau, bertanya untuk menilai pemahaman, dan mengoreksi kesalahan konsep.", "fase3"),
    ("mengecek pemahaman dan memberi umpan balik", False, "Fase keempat mengecek kemampuan, misalnya dengan kuis dan tinjauan, setelah latihan terbimbing selesai.", "fase4"),
    ("latihan lanjutan dan penerapan", False, "Latihan lanjutan berupa tugas mandiri dan penerapan pada situasi yang lebih kompleks, bukan latihan yang dipantau langsung.", "fase5"),
    ("mendemonstrasikan pengetahuan dan keterampilan", False, "Demonstrasi sudah selesai; sekarang peserta didik sendiri yang berlatih.", "fase2"),
], guna=PA, sulit="Mudah")
soal("PA3", 4, "Setelah menayangkan video gunung meletus, seorang guru meminta tiap kelompok menuliskan hal yang ingin mereka ketahui tentang video itu, lalu bersama kelas memilih mana yang dapat diselidiki. Tahap pembelajaran interaktif ini adalah ...", "C", [
    ("tahap pertanyaan peserta didik", True, "Pada tahap ini kelompok menulis pertanyaan, lalu guru mengajak kelas memilih yang berkaitan dengan topik dan dapat diselidiki.", "pertanyaan_siswa"),
    ("tahap kegiatan eksplorasi dengan demonstrasi", False, "Tayangan video adalah kegiatan eksplorasi; menulis dan memilih pertanyaan adalah tahap sesudahnya.", "eksplorasi"),
    ("tahap penyelidikan", False, "Penyelidikan adalah mengumpulkan dan menganalisis data untuk menjawab pertanyaan yang sudah dipilih.", "penyelidikan"),
    ("tahap pengetahuan awal", False, "Pengetahuan awal menggali pendapat peserta didik sebelum eksplorasi, sebagai tolok ukur pembanding.", "pengetahuan_awal"),
], guna=PA, sulit="Mudah")
soal("PA4", 7, "Seorang guru ingin peserta didiknya dapat menulis surat lamaran kerja dengan format baku. Ia tertarik memakai debat karena kelasnya aktif berpendapat. Kriteria pemilihan mana yang paling tidak terpenuhi oleh pilihan ini?", "D", [
    ("kesesuaian strategi dengan tujuan atau kompetensi", True, "Debat melatih argumentasi, sedangkan tujuannya menulis surat dengan format baku; kriteria pertama adalah kesesuaian dengan tujuan.", "kriteria_a"),
    ("kesesuaian strategi dengan sasaran, yaitu karakteristik peserta didik", False, "Kelas yang aktif berpendapat justru cocok dengan debat; yang tidak cocok adalah tujuannya.", "kriteria_c"),
    ("biaya yang diperlukan untuk menjalankan strategi", False, "Debat hampir tidak memerlukan biaya; biaya bukan masalah di sini.", "kriteria_d"),
    ("karakteristik strategi, yaitu kelebihan dan kelemahannya", False, "Kelebihan debat nyata; masalahnya bukan kelemahan debat, tetapi debat tidak diarahkan pada tujuan pertemuan ini.", "kriteria_f"),
], guna=PA, sulit="Mudah")

# ── Cek penguasaan (post-test): every lesson; PB2, PB3, PB5, PB6, PB7 and PB8 ask for an action, PB1 and PB4 for a diagnosis.
soal("PB1", 1, "Seorang guru kelas IV mengajar 38 peserta didik yang kemampuan membacanya sangat beragam. Selama ini ia memakai satu lembar kerja dan satu tempo untuk semua, dan kelompok yang lambat makin tertinggal. Apa yang paling tepat menjelaskan keadaan ini?", "B", [
    ("pembelajaran klasikal mengandaikan kemampuan yang relatif setara, padahal kemampuan kelas ini berbeda-beda", True, "Pembelajaran klasikal dirancang untuk peserta didik yang diasumsikan setara usia dan kemampuannya, dengan format yang sama untuk semua.", "klasikal"),
    ("kelompok yang lambat kurang terbiasa belajar mandiri, sehingga tidak dapat mengikuti lembar kerja yang sama dengan temannya", False, "Masalahnya ada pada pengaturan peserta didik: satu format untuk kemampuan yang berbeda, bukan pada kebiasaan belajar mandiri.", "individual"),
    ("jumlah 38 peserta didik terlalu kecil untuk pembelajaran klasikal yang efektif", False, "Bab ini menyebut kelas klasikal sekitar 35–45 orang; ukurannya wajar, yang tidak sesuai adalah asumsi kesetaraan kemampuan.", "klasikal"),
    ("pembelajaran tatap muka kurang cocok untuk kelas dengan kemampuan membaca yang beragam", False, "Tatap muka menggolongkan hubungan guru dan peserta didik, bukan cara mengatur peserta didik dengan kemampuan berbeda.", "tatap_muka"),
], guna=PB, sulit="Sedang")
soal("PB2", 2, "Seorang guru Fisika memakai pembelajaran langsung sepanjang semester. Nilai tes prosedur peserta didik baik, tetapi mereka kesulitan ketika diminta berdiskusi dan menilai argumen teman. Apa yang paling tepat ia lakukan?", "C", [
    ("memadukan pembelajaran langsung dengan strategi lain yang melatih berpikir kritis dan kerja kelompok", True, "Kelemahan utama pembelajaran langsung ada pada pemikiran kritis dan belajar kelompok, sehingga bab ini menganjurkan perpaduan dengan strategi lain.", "langsung_kombinasi"),
    ("menambah fase latihan terbimbing agar keterampilan berdiskusi terlatih langkah demi langkah", False, "Latihan terbimbing tetap berada dalam pembelajaran langsung, yang lemah justru untuk pemikiran kritis dan hubungan interpersonal.", "langsung_lemah"),
    ("memperpanjang demonstrasi agar contoh argumen yang baik terlihat lebih jelas oleh peserta didik", False, "Demonstrasi yang lebih panjang menambah porsi guru; keterampilan sosial sulit berkembang bila kesempatan terlibat aktif sedikit.", "sosial"),
    ("mengganti pembelajaran langsung sepenuhnya dengan penemuan, termasuk untuk prosedur yang sudah berjalan baik", False, "Pembelajaran langsung efektif untuk pengetahuan prosedural; bab ini menganjurkan perpaduan, bukan penggantian.", "langsung_def"),
], guna=PB, sulit="Sedang")
soal("PB3", 3, "Dua minggu sebelum ujian, seorang guru Biologi harus memastikan peserta didik mengingat banyak istilah sistem pencernaan. Ia sedang memakai strategi penemuan untuk topik itu. Apa yang paling tepat ia lakukan?", "D", [
    ("memakai penjelasan langsung untuk istilah itu, dan menyisakan penemuan untuk pertanyaan yang menuntut penalaran", True, "Strategi tidak langsung memerlukan waktu panjang dan tidak cocok bila materi perlu diingat dengan cepat; kedua strategi dapat saling melengkapi.", "tl_cepat"),
    ("melanjutkan penemuan dan menambah waktu tunggu agar peserta didik menemukan sendiri setiap istilah yang akan diujikan", False, "Waktu tunggu adalah teknik fasilitasi yang baik, tetapi strategi ini tetap tidak cocok untuk mengingat materi dengan cepat.", "tl_cepat"),
    ("memakai isyarat yang lebih banyak agar penemuan setiap istilah berlangsung lebih cepat", False, "Isyarat membantu penyelidikan, tetapi tidak mengubah sifat strategi yang memerlukan waktu panjang.", "tl_kurang"),
    ("membagi kelas menjadi kelompok penyelidikan, masing-masing menemukan sebagian istilah", False, "Membagi istilah ke kelompok tetap memakai penemuan untuk tujuan mengingat cepat, yang tidak cocok dengan strategi ini.", "tl_cepat"),
], guna=PB, sulit="Sedang")
soal("PB4", 4, "Dalam diskusi kelas, seorang guru melihat bahwa yang bertanya dan menjawab selalu empat peserta didik yang nilainya tertinggi, sedangkan yang lain diam. Menurut bab ini, apa yang paling tepat menjelaskan keadaan itu?", "A", [
    ("interaksinya hanya antara guru dan peserta didik yang pandai, belum multiarah", True, "Bab ini mencatat bahwa di kelas berkemampuan campuran interaksi cenderung terjadi antara siswa pandai dan guru, padahal pola yang dituju adalah multiarah.", "int_campuran"),
    ("strategi interaktif memang kurang cocok untuk kelas yang kemampuannya beragam", False, "Bab ini tidak menolak strategi interaktif untuk kelas campuran; ia menunjukkan pola interaksi yang perlu diperluas.", "int_multiarah"),
    ("diskusi kelas belum termasuk strategi interaktif; yang interaktif adalah kerja kelompok kecil", False, "Diskusi kelas termasuk bentuk strategi interaktif, di samping kelompok kecil dan kerja berpasangan.", "int_bentuk"),
    ("kelas itu sudah interaktif, karena tanya jawab guru dan peserta didik berjalan lancar", False, "Pola optimal mencakup interaksi antarpeserta didik juga; tanya jawab dengan segelintir peserta didik belum multiarah.", "int_multiarah"),
], guna=PB, sulit="Sedang")
soal("PB5", 5, "Seorang guru IPA mengajak peserta didik mencatat suhu air yang dipanaskan setiap dua menit. Setelah percobaan selesai, ia langsung menjelaskan konsep kalor, lalu memberi soal latihan. Menurut siklus Kolb, apa yang paling tepat ia lakukan pada kesempatan berikutnya?", "B", [
    ("memberi waktu bagi peserta didik untuk merefleksikan apa yang mereka amati dalam percobaan sebelum konsep dirumuskan", True, "Siklus Kolb bergerak dari pengalaman konkret ke refleksi, lalu ke konseptualisasi; di sini refleksi terlewat.", "emp_refleksi"),
    ("mengadakan percobaan kedua segera, agar pengalaman konkret peserta didik bertambah", False, "Pengalaman kedua tanpa refleksi tetap melewatkan tahap yang menjadi dasar konseptualisasi.", "emp_konsep"),
    ("memberi tes hafalan istilah kalor, agar hasil belajar percobaan dapat diukur", False, "Strategi empirik menekankan proses belajar, bukan hasil hafalan; tes ini tidak mengisi tahap yang hilang.", "emp_proses"),
    ("menjelaskan konsep lebih rinci sebelum percobaan dimulai, agar peserta didik tahu apa yang harus mereka amati dan catat", False, "Strategi empirik memakai urutan induktif: pengalaman lebih dulu, konsep sesudahnya.", "emp_def"),
], guna=PB, sulit="Sedang")
soal("PB6", 6, "Seorang guru SMK memakai modul cetak untuk belajar mandiri tentang teknik menjahit kampuh. Tes tertulis menunjukkan peserta didik memahami langkah-langkahnya, tetapi banyak hasil jahitan mereka belum rapi. Apa yang paling tepat ia lakukan?", "C", [
    ("melengkapi modul dengan demonstrasi atau video dan praktik yang ia pantau", True, "Materi psikomotor sulit dikembangkan bila hanya memakai satu medium seperti bahan cetak.", "psikomotor"),
    ("menambah halaman penjelasan di modul agar setiap langkah diuraikan lebih lengkap", False, "Penjelasan tertulis yang lebih panjang tetap satu medium cetak, yang lemah untuk materi psikomotor.", "psikomotor"),
    ("menetapkan tenggat yang lebih ketat agar peserta didik lebih disiplin berlatih", False, "Belajar mandiri menekankan penguasaan, bukan batas waktu; tenggat tidak memperbaiki keterampilan tangan.", "mastery"),
    ("menambah soal tes tertulis tentang langkah menjahit agar penguasaannya terukur", False, "Tes tertulis sudah menunjukkan pemahaman langkah; yang belum terbukti adalah keterampilannya, misalnya lewat portofolio hasil jahitan.", "bukti"),
], guna=PB, sulit="Sedang")
soal("PB7", 7, "Seorang guru Bahasa Indonesia kelas VIII ingin peserta didiknya dapat membandingkan dua iklan produk dan menilai mana yang menyesatkan. Kelasnya berisi 32 peserta didik, dan sekolah tidak menyediakan dana tambahan. Strategi mana yang paling tepat ia pilih?", "D", [
    ("memakai strategi tidak langsung atau interaktif dalam kelompok kecil, dengan salinan cetak kedua iklan", True, "Menilai dan menyimpulkan adalah kemampuan berpikir yang cocok dengan strategi tidak langsung atau interaktif; bahan cetak memenuhi kriteria biaya.", "kriteria_a"),
    ("memakai strategi langsung, karena ceramah paling mudah dikendalikan untuk 32 peserta didik", False, "Pembelajaran langsung memang mudah dikendalikan, tetapi lemah untuk pemikiran kritis yang dituju pertemuan ini.", "langsung_lemah"),
    ("memakai belajar mandiri dengan modul, agar setiap peserta didik bekerja sesuai kecepatannya", False, "Menilai iklan yang berbeda memerlukan saling menanggapi argumen, yang dilatih strategi interaktif, bukan modul perorangan.", "int_argumen"),
    ("memakai strategi empirik dengan kunjungan ke pusat perbelanjaan, agar peserta didik mengamati iklan langsung", False, "Kunjungan memerlukan biaya yang tidak tersedia; kriteria biaya termasuk dalam pemilihan strategi.", "kriteria_d"),
], guna=PB, sulit="Sedang")
soal("PB8", 2, "Seorang guru menyusun pembelajaran langsung untuk keterampilan menulis kalimat efektif dengan urutan: latihan di rumah, demonstrasi di kelas, lalu kuis. Apa yang paling tepat ia lakukan terhadap rancangan ini?", "A", [
    ("menyusun ulang: tujuan di awal, demonstrasi, latihan terbimbing, kuis dan umpan balik, lalu latihan lanjutan", True, "Pembelajaran langsung berjalan dalam lima fase berurutan: tujuan, demonstrasi, latihan terbimbing, pengecekan pemahaman, dan latihan lanjutan.", "lima_fase"),
    ("memindahkan latihan di rumah ke bagian akhir, karena fase-fase lainnya sudah lengkap dan urutannya sudah tepat", False, "Memindahkan latihan saja masih melewatkan fase penyampaian tujuan dan latihan terbimbing.", "lima_fase"),
    ("menyusun demonstrasi kedua sebagai pengganti latihan terbimbing agar contoh lebih jelas", False, "Latihan terbimbing adalah fase tersendiri tempat guru memantau dan mengoreksi; demonstrasi tambahan tidak menggantikannya.", "fase3"),
    ("mengganti kuis dengan diskusi kelompok agar peserta didik lebih aktif", False, "Kuis adalah bagian fase pengecekan pemahaman; masalah rancangan ini adalah fase yang hilang dan urutannya.", "fase4"),
], guna=PB, sulit="Sulit")

# ── Latihan (practice), at most two per lesson.
soal("LT1", 1, "Seorang guru Geografi menunjukkan data curah hujan lima kota, meminta peserta didik mencari polanya, lalu bersama-sama merumuskan generalisasi. Dari segi proses pengolahan pesan, strategi ini ...", "C", [
    ("induktif, karena bergerak dari data khusus ke generalisasi", True, "Strategi induktif bergerak dari data atau fakta khusus menuju konsep dan generalisasi.", "induktif"),
    ("deduktif, karena guru yang menyiapkan data sejak awal", False, "Deduktif dimulai dari generalisasi yang dikemukakan guru; di sini generalisasi dirumuskan di akhir.", "deduktif_langkah"),
    ("ekspositorik, karena data sudah disiapkan oleh guru", False, "Ekspositorik menggolongkan peran dalam mengolah pesan; yang ditanya adalah arah prosesnya.", "ekspositorik"),
    ("klasikal, karena seluruh kelas merumuskan generalisasi bersama", False, "Klasikal menggolongkan pengaturan peserta didik; yang ditanya adalah arah prosesnya.", "klasikal"),
], sulit="Mudah")
soal("LT2", 2, "Mengapa pembelajaran langsung sering tepat bagi peserta didik yang belum mampu mengarahkan belajarnya sendiri?", "D", [
    ("guru mengendalikan isi dan urutan, sehingga fokus pada tujuan tetap terjaga", True, "Bab ini menyebut kendali guru atas isi dan urutan sebagai kelebihan, dan peserta didik yang belum mengarahkan diri tetap dapat berprestasi.", "arah_diri"),
    ("guru menyesuaikan penjelasan dengan gaya belajar setiap peserta didik", False, "Bab ini justru mencatat bahwa pembelajaran langsung sulit melayani perbedaan kemampuan dan gaya belajar.", "beda"),
    ("peserta didik banyak terlibat aktif dalam kelompok, sehingga terbiasa bekerja sama", False, "Pembelajaran langsung memberi sedikit kesempatan terlibat aktif, sehingga keterampilan sosial sulit berkembang.", "sosial"),
    ("peserta didik cukup mendengarkan ceramah, tanpa perlu latihan terbimbing", False, "Latihan terbimbing adalah fase ketiga pembelajaran langsung, tempat guru memantau dan mengoreksi.", "fase3"),
], sulit="Mudah")
soal("LT3", 3, "Dalam pembelajaran pemecahan masalah, sebuah kelompok buntu selama sepuluh menit. Apa yang paling tepat dilakukan guru?", "A", [
    ("mengajukan pertanyaan atau isyarat yang membantu mereka melihat persoalannya lebih teliti", True, "Scaffolding berupa pertanyaan, isyarat, dan masalah pembanding membantu tanpa memberikan jawabannya.", "scaffolding"),
    ("memberikan langkah-langkah penyelesaiannya agar waktu pelajaran yang tersisa tidak terbuang", False, "Memberikan langkah penyelesaian menutup penyelidikan; bantuan dalam strategi ini bersifat tidak langsung.", "tl_inti"),
    ("memindahkan anggota kelompok itu ke kelompok yang sudah berhasil", False, "Kelompok yang buntu perlu dibantu melihat masalahnya, bukan dibubarkan.", "tl_inti"),
    ("membiarkan mereka bekerja tanpa bantuan agar tetap mandiri", False, "Guru tetap memfasilitasi, antara lain dengan pertanyaan dan isyarat.", "scaffolding"),
], sulit="Mudah")
soal("LT4", 3, "Tujuan mana yang paling cocok dicapai dengan strategi tidak langsung?", "B", [
    ("peserta didik merumuskan beberapa alternatif solusi untuk masalah sampah di sekolah", True, "Strategi ini cocok untuk masalah terbuka dan pengambilan keputusan.", "tl_cocok"),
    ("peserta didik menghafal nama dan lambang dua puluh unsur kimia pertama", False, "Strategi tidak langsung tidak cocok bila materi perlu diingat dengan cepat.", "tl_cepat"),
    ("peserta didik mengikuti prosedur keselamatan laboratorium dengan urutan yang benar", False, "Prosedur yang terstruktur cocok dengan pembelajaran langsung.", "langsung_def"),
    ("peserta didik mengetahui tanggal-tanggal penting di sekitar peristiwa Proklamasi Kemerdekaan", False, "Pengetahuan deklaratif seperti ini lebih cocok dengan pembelajaran langsung.", "langsung_def"),
], sulit="Sedang")
soal("LT5", 4, "Pertanyaan peserta didik yang terkumpul di papan banyak, dan sebagian tidak berkaitan dengan topik. Apa yang paling tepat dilakukan guru?", "C", [
    ("mengajak peserta didik memilih pertanyaan yang berkaitan dan dapat dijawab melalui penyelidikan", True, "Guru mengarahkan peserta didik memilih pertanyaan yang berkaitan dengan topik dan dapat diselidiki.", "pertanyaan_siswa"),
    ("menjawab sendiri semua pertanyaan itu satu per satu agar tidak ada satu pun pertanyaan yang terabaikan", False, "Pembelajaran interaktif dirancang agar peserta didik menemukan jawabannya sendiri.", "int_bertanya"),
    ("mengganti pertanyaan peserta didik dengan pertanyaan yang sudah ia siapkan", False, "Pertanyaan peserta didik adalah inti strategi ini dan memperlihatkan kemampuan awal mereka.", "int_awal"),
    ("menunda pertanyaan yang tidak berkaitan sampai akhir pelajaran dan melanjutkan penjelasan", False, "Pertanyaan dipilih sebelum penyelidikan, karena penyelidikan dilakukan untuk menjawabnya.", "penyelidikan"),
], sulit="Mudah")
soal("LT6", 5, "Setelah kunjungan ke pasar tradisional, peserta didik menulis catatan tentang apa yang mereka amati dan mengapa pedagang bertindak seperti itu. Kegiatan ini berada pada tahap ...", "D", [
    ("observasi reflektif", True, "Pengalaman yang sudah dialami direfleksikan: peserta didik berusaha memahami apa yang terjadi.", "emp_refleksi"),
    ("pengalaman konkret", False, "Kunjungannya adalah pengalaman konkret; menulis tentang apa yang terjadi adalah tahap sesudahnya.", "stimulus"),
    ("konseptualisasi abstrak", False, "Konseptualisasi merumuskan prinsip dari hasil refleksi; di sini peserta didik baru memahami apa yang terjadi.", "emp_konsep"),
    ("penerapan atau eksperimen aktif", False, "Penerapan menguji konsep pada situasi baru; belum ada konsep yang diterapkan.", "siklus"),
], sulit="Sedang")
soal("LT7", 6, "Seorang guru memakai modul untuk belajar mandiri. Cara mana yang paling sesuai untuk membuktikan penguasaan peserta didik?", "A", [
    ("tes sendiri di akhir tiap unit dan portofolio hasil kerja", True, "Penguasaan dalam belajar mandiri dapat dibuktikan melalui tes mandiri, tes baku yang dapat diambil kapan saja, kolokium, dan portofolio.", "bukti"),
    ("satu ujian tertulis serentak pada tanggal yang sama untuk seluruh kelas", False, "Belajar mandiri menekankan penguasaan dan kemajuan masing-masing, sehingga tes dapat diambil kapan saja.", "mastery"),
    ("lamanya waktu yang dipakai peserta didik untuk menyelesaikan modul", False, "Belajar mandiri tidak dibatasi waktu; lamanya belajar bukan bukti penguasaan.", "mastery"),
    ("nilai rata-rata kelas pada ulangan harian bersama", False, "Rata-rata kelas tidak memperlihatkan penguasaan tiap peserta didik atas unit yang ia pelajari.", "bukti"),
], sulit="Mudah")
soal("LT8", 7, "Seorang guru memilih pembelajaran berbasis proyek yang memerlukan bahan praktik mahal untuk 40 peserta didik, padahal dana sekolah terbatas. Kriteria pemilihan mana yang paling perlu ia tinjau ulang?", "B", [
    ("biaya", True, "Biaya termasuk kriteria pemilihan strategi, dan di sini dana tidak mencukupi.", "kriteria_d"),
    ("kesesuaian dengan tujuan", False, "Tidak ada keterangan bahwa proyek itu tidak sesuai dengan tujuan; yang tidak terpenuhi adalah dananya.", "kriteria_a"),
    ("kesesuaian dengan jenis pengetahuan", False, "Tidak ada keterangan tentang jenis pengetahuan yang tidak cocok; kendalanya dana.", "kriteria_b"),
    ("karakteristik strategi", False, "Kelebihan dan kelemahan proyek tidak menjadi soal di sini; kendalanya dana.", "kriteria_f"),
], sulit="Mudah")

# Every option answers the same question: a stem that asks what to do or choose has four actions.
for s in S:
    if re.search(r"(lakukan|pilih)\b[^?]*\?$", s["tanya"]):
        cek(all(p[0].split()[0].startswith("me") for p in s["pilihan"]), f"{s['ref']}: an action stem with a non-action option")

# ── Whole-chapter checks.
refs = [s["ref"] for s in S]
cek(len(refs) == len(set(refs)))
cek({p["no"] for p in PELAJARAN} == {s["pel"] for s in S}, "every lesson has questions")
PRE = [s for s in S if s["guna"] == PA]
POST = [s for s in S if s["guna"] == PB]
LAT = [s for s in S if not s["guna"]]
cek(len(PRE) == 4 and len(POST) == 8 and 1 <= len(LAT), "4 Pemetaan awal, 8 Uji penguasaan, some Latihan")
cek(all(sum(1 for s in LAT if s["pel"] == p["no"]) <= 2 for p in PELAJARAN), "Latihan at most 2 per lesson")
cek(len({s["pel"] for s in PRE}) == 4, "the pre-test samples four lessons")
cek({s["pel"] for s in POST} == {p["no"] for p in PELAJARAN}, "the post-test covers every lesson")
cek(sum(1 for s in POST if s["sulit"] == "Sedang") > len(POST) / 2, "post-test mostly Sedang")
HURUF = {}
for s in S:
    h = "ABCD"[[p[1] for p in s["pilihan"]].index(True)]
    HURUF[h] = HURUF.get(h, 0) + 1
cek(set(HURUF) == set("ABCD") and max(HURUF.values()) - min(HURUF.values()) <= 1, HURUF)
# Every fact outside the error record is used by a lesson section or an option.
DIPAKAI = {f for p in PELAJARAN for _, fs in p["jejak"] for f in fs} | {p[3] for s in S for p in s["pilihan"]}
cek(set(FAKTA) - REKAMAN - DIPAKAI == set(), f"facts used by nothing: {set(FAKTA) - REKAMAN - DIPAKAI}")
cek(REKAMAN & DIPAKAI == set())
# Questions test understanding or judgement: most stems are a situation, not a definition.
SITUASI = [s for s in S if re.match(r"(Seorang|Sebuah|Dua|Setelah|Dalam|Tujuan|Pertanyaan peserta)", s["tanya"])]
cek(len(SITUASI) >= 16 and all(s in SITUASI for s in POST), f"{len(SITUASI)} situation stems")
# The post-test does not reuse a lesson's situation: no stem shares an 8-word run with a lesson.


def runs(teks, n):
    w = kata(teks)
    return {" ".join(w[i:i + n]) for i in range(len(w) - n + 1)}


LESSON_RUNS = set().union(*(runs(p["isi"], 8) for p in PELAJARAN))
for s in POST:
    cek(not runs(s["tanya"], 8) & LESSON_RUNS, f"{s['ref']}: stem reuses a lesson's wording")

VERBATIM_MAKS = 9     # no run of 10 or more words of learner text appears in the book


def teks_pembelajar():
    for p in PELAJARAN:
        for b in ("judul", "ringkasan", "tujuan"):
            yield f"lesson {p['no']} {b}", p[b]
        yield f"lesson {p['no']} isi", p["isi"].replace(SITASI, "").replace(SUMBER, "")
    for s in S:
        yield s["ref"], s["tanya"]
        for p in s["pilihan"]:
            yield s["ref"], p[0] + " " + p[2]


def periksa_kutipan(paths):
    teks = "\n".join(open(p, encoding="utf-8").read() for p in paths)
    buku = norm(teks)
    ada, gambar = 0, []
    for fid, (hal, kutipan) in FAKTA.items():
        if norm(kutipan) in buku:
            ada += 1
        else:
            gambar.append(fid)
    cek(set(gambar) <= GAMBAR, f"quotations not in the book: {set(gambar) - GAMBAR}")
    # The longest run of words that learner text shares with the book.
    bw = kata(teks)
    terpanjang, dimana = 0, ""
    for n in range(4, 40):
        buku_n = {" ".join(bw[i:i + n]) for i in range(len(bw) - n + 1)}
        kena = [(d, r) for d, t in teks_pembelajar() for r in runs(t, n) if r in buku_n]
        if not kena:
            break
        terpanjang, dimana = n, kena[0]
    cek(terpanjang <= VERBATIM_MAKS, f"a verbatim run of {terpanjang} words: {dimana}")
    return ada, gambar, terpanjang, dimana


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
    # No misconception codes in this demo (non-scope); the column stays empty.
    lembar("Pilihan", ["Kode soal", "Pilihan", "Teks pilihan", "Benar", "Alasan", "Kode miskonsepsi"],
           [[s["ref"], "ABCD"[i], p[0], "Ya" if p[1] else "Tidak", p[2], ""] for s in S for i, p in enumerate(s["pilihan"])])
    wb.save(path)


def tulis_jejak(path):
    """The trace a reviewer reads: each lesson section and each option, with the pages it rests on."""
    def hal(fids):
        return ", ".join(sorted({str(FAKTA[f][0]) for f in fids}, key=lambda h: (not h.isdigit(), int(h) if h.isdigit() else 0, h)))
    baris = ["# [UJI INTERNAL] Strategi Pembelajaran, Bab 2: jejak halaman", "",
             "Generated by strategi_pembelajaran_bab2.py. Pages are pages of the Bab 2 scan (the typed manuscript, "
             "28 pages); ii and vi are pages of the front-matter scan. Internal demo only (D-070(e)).", ""]
    for p in PELAJARAN:
        baris.append(f"## Pelajaran {p['no']}: {p['judul']}")
        baris.append("")
        for j, fids in p["jejak"]:
            baris.append(f"- **{j}**: hal. {hal(fids)} ({', '.join(fids)})")
        baris.append("")
    baris.append("## Soal")
    baris.append("")
    for s in S:
        kunci = "ABCD"[[q[1] for q in s["pilihan"]].index(True)]
        baris.append(f"- **{s['ref']}** (pelajaran {s['pel']}, {s['guna'] or 'Latihan'}, kunci {kunci}): "
                     + "; ".join(f"{'ABCD'[i]} hal. {FAKTA[q[3]][0]} ({q[3]})" for i, q in enumerate(s["pilihan"])))
    baris.append("")
    baris.append("## Fakta")
    baris.append("")
    for fid, (h, k) in FAKTA.items():
        tanda = " — catatan kesalahan buku" if fid in REKAMAN else (" — dibaca dari gambar" if fid in GAMBAR else "")
        baris.append(f"- `{fid}` hal. {h}{tanda}: «{k}»")
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(baris) + "\n")


if __name__ == "__main__":
    here = os.path.dirname(os.path.abspath(__file__))
    tulis(os.path.join(here, "StrategiPembelajaran-Bab2.xlsx"))
    tulis_jejak(os.path.join(here, "StrategiPembelajaran-Bab2-jejak.md"))
    halaman = sum(len(JUDUL_BAGIAN.findall(p["isi"])) for p in PELAJARAN)
    print(f"StrategiPembelajaran-Bab2.xlsx: lessons {len(PELAJARAN)} ({halaman} pages), questions {len(S)} "
          f"(pre {len(PRE)}, post {len(POST)}, practice {len(LAT)}), answers "
          + " ".join(f"{h}={HURUF[h]}" for h in "ABCD"))
    bab = [h for h, _ in FAKTA.values() if isinstance(h, int)]
    print(f"facts traced: {len(FAKTA)} (scan pages {min(bab)}-{max(bab)}, front matter {len(DEPAN)}); "
          f"book-error record {len(REKAMAN)}; lesson sections traced {sum(len(p['jejak']) for p in PELAJARAN)}")
    if "--kutipan" in sys.argv:
        ada, gambar, n, dimana = periksa_kutipan(sys.argv[sys.argv.index("--kutipan") + 1].split(","))
        print(f"quotations found in the book's text: {ada} of {len(FAKTA)}; figures read by eye: {', '.join(gambar) or 'none'}")
        print(f"longest run of words shared with the book: {n} ({dimana[0]}: «{dimana[1]}»)")
    print(f"assertions passed: {CEK[0]}")
