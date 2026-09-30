# [UJI INTERNAL] Strategi Pembelajaran, Bab 1 "Pendahuluan", as a PINTAR lesson workbook in the
# D-007 template (sheets Kursus, Bab, Pelajaran, Soal, Pilihan; the column contract is KOLOM in
# src/lib/unggah-kontrak.ts). LANA-22, the internal educator demo (D-069(g), D-070(d), (e)).
#
# INTERNAL DEMO ONLY. Close adaptation is approved for this demo and nothing else: this folder
# stays on the lesson author's branch, is never merged to main, never goes to production or
# Pustaka PINTAR, and is deleted after the demo unless rights are obtained (D-070(e)).
#
# Source: Dr. Siti Nurhasanah, M.Pd; Dr. (Cdt) Agus Jayadi, M.Pd; Dr. Rika Sa'diyah, M.Pd;
# Syafrimen, M.Ed, Ph.D, "Strategi Pembelajaran", Penerbit EDU PUSTAKA, Jakarta, 2019 (Cetakan
# Pertama), ISBN 978-623-90461-7-0, Bab I, pp. 1-36 of the print. The Bab 1 scan is the typed
# manuscript (22 pages, no printed page numbers); every page cited here is a page of that scan.
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
#
# Run: python3 content/_uji-internal/strategi-pembelajaran/strategi_pembelajaran_bab1.py
#          [--kutipan bab1.txt,depan.txt]
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


# ── FAKTA: page of the Bab 1 scan, and the book's own words (typos kept, so --kutipan finds them).
# Front matter (the index scan, p. ii of the print)
fakta("isbn", "ii", "ISBN 978-623-90461-7-0")
fakta("terbit", "ii", "Penerbit EDU PUSTAKA")
fakta("cetakan", "ii", "Cetakan Pertama, 2019")
fakta("daftar_isi", "vi", "KLASIFIKASI DAN PEMILIHAN STRATEGI PEMBELAJARAN")
# A. Pengertian strategi pembelajaran (pp. 1-8)
fakta("rekayasa", 1, "guru sendiri pun berhak menentukan strategi pembelajaran mana yann paling tepat untuk digunakan di dalam kelas dan mata pelajaran tertentu")
fakta("militer", 1, "Pada mulanya istilah strategi digunakan dalam dunia militer")
fakta("menimbang", 1, "ia akan menimbang bagaimana kekuatan pasukan yang dimilikinya baik dilihat dari kuantitas maupun kualitasnya")
fakta("faktor", 1, "dalam menyusun strategi perlu memperhitungkan berbagai faktor, baik dari dalam maupun dari luar")
fakta("sp_rencana", 2, "strategi pembelajaran dapat diartikan sebagai perencanaan yang berisi tentang rangkaian kegiatan yang didesain untuk mencapai tujuan pendidikan tertentu")
fakta("strategos", 2, "stratēgos dapat diterjemahkan sebagai 'komandan militer'")
fakta("strategi_def", 3, "starategi adalah suatu pola yang direncanakan dan ditetapkan secara sengaja untuk melakukan kegiatan atau tindakan")
fakta("uu", 3, "Pembelajaran adalah Proses interaksi peserta didik dengan pendidik dan sumber belajar pada suatu lingkungan belajar")
fakta("konotasi", 3, "Pembelajaran mempunyai pengertian yang mirip dengan pengajaran, walaupun mempunyai konotasi yang berbeda")
fakta("pp19", 3, "Proses pembelajaran pada satuan pendidikan diselenggarakan secara interaktif, inspiratif, menyenangkan, menantang, memotivasi peserta didik untuk berpartisipasi secara aktif")
fakta("primer", 4, "Kegiatan belajar adalah kegiatan primer, sedangkan mengajar adalah kegiatan sekunder yang dimaksudkan agar terjadi kegiatan secara optimal")
fakta("satu_pihak", 4, "Pengajaran memberi kesan hanya sebagai pekerjaan satu pihak, yaitu pekerjaan guru saja. Sedangkan pembelajaran juga menyiratkan adanya interaksi antara guru dengan peserta didik.")
fakta("komponen", 4, "kegiatan pembelajaran merupakan kegiatan yang melibatkan beberapa komponen")
fakta("tujuan_komp", 5, "Tujuan, Pernyataan tentang perubahan perilaku ( kognitif, psikomotorik, afektif ) yang diinginkan terjadi pada siswa setelah mengikuti kegiatan pembelajaran")
fakta("materi_komp", 5, "Materi Pelajaran, Segala informasi berupa fakta, prinsip, dan konsep yang diperlukan untuk mencapai tujuan")
fakta("metode_komp", 5, "Metode, Cara yang teratur untuk memberikan kesempatan kepada siswa untuk mendapat informasi yang dibutuhkan mereka untuk mencapai tujuan")
fakta("media_komp", 5, "Media, Bahan pengajaran dengan atau tanpa peralatan yang digunakan untuk menyajikan informasi kepada siswa")
fakta("evaluasi_komp", 5, "Evaluasi, Cara tertentu yang digunakan untuk menilai suatu proses dan hasilnya")
fakta("kemp", 5, "strategi pembelajaran adalah suatu kegiatan pembelajaran yang harus dikerjakan guru dan siswa agar tujuan pembelajaran dapat dicapai secara efektif dan efisien")
fakta("dick_carey", 6, "strategi pembelajaran bukan hanya terbatas pada prosedur atau tahapan kegiatan belajar saja, melainkan termasuk juga pengaturan materi atau paket program pembelajaran")
fakta("gerlach", 6, "strategi pembelajaran dimaksud meliputi; sifat, lingkup, dan urutan kegiatan pembelajaran yang dapat memberikan pengalaman belajar kepada peserta didik")
fakta("dua_ciri", 7, "strategi pembelajaran merupakan suatu rencana tindakan (rangkaian kegiatan) yang termasuk juga penggunaan metode dan pemanfaatan berbagai sumber daya dalam pembelajaran")
fakta("belum_tindakan", 7, "penyusunan suatu strategi baru sampai pada proses penyusunan rencana kerja belum sampai pada tindakan")
fakta("arah", 7, "arah dari semua keputusan penyusunan strategi adalah pencapaian tujuan")
fakta("roh", 8, "sebelum menentukan strategi, perlu dirumuskan tujuan yang jelas yang dapat diukur keberhasilannya, sebab tujuan adalah rohnya dalam implementasi suatu strategi")
# B. Jenis-jenis strategi pembelajaran (pp. 8-10)
fakta("unsur_1", 8, "menetapkan spesifikasi dan kualifikasi tujuan pembelajran, yakni perubahan profil perilaku dan pribadi peserta didik")
fakta("unsur_2", 8, "mempertimbangkan dan memilih sistem pendekatan pembelajaran yang dipandang paling efektif")
fakta("unsur_3", 8, "mempertimbangkan dan menetapkan langkah-langkah atau prosedur; etode; dan tekhnik pembelajaran")
fakta("unsur_4", 8, "menetapkan norma-norma dan batas minimum ukuran keberhasilan atau kriteria dan ukuran baku keberhasilan")
fakta("konseptual", 9, "strategi masih bersifat konseptual tentang keputusan-keputusan yang akan diambil dalam suatu pelaksanaan pembelajaran")
fakta("rowntree", 9, "exposition-discovery learning dan group-individual learning")
fakta("induktif", 9, "strategi pembelajran induktif dan strategi pembelajran deduktif")
fakta("lewat_metode", 9, "untuk mengimplementasikannya digunakan berbagai metode pembelajaran tertentu")
fakta("saskatchewan", 9, "klasifikasi strategi pembelajaran yang dikemukaan dalam artikel Saskatchewan Educational (1991)")
fakta("langsung", 9, "Strategi pembelajaran langsung merupakan strategi yang berpusat pada gurunya, dan strategi ini paling sering digunakan")
fakta("langsung_metode", 9, "termasuk di dalamnya metode ceramah, pertanyaan didaktik, pengajaran eksplisit, praktek dan latihan serta demostrasi")
fakta("langsung_efektif", 9, "efektif digunakana untuk memperluas informasi atau mengembangkan ketrampilan langkah demi langkah")
fakta("tidak_langsung", 9, "keterlibatan siswa yang tinggi dalam melakukan observasi, penyelidikan, penggambaran inferensi berdasarkan data, atau pembentukan hipotesis")
fakta("fasilitator", 10, "peran guru beralih dari penceramah menjadi fasilitator, pendukung, dan sumber personal (resource person)")
fakta("rancang_ling", 10, "Guru merancang lingkungan belajar, memberikan kesempatan siswa untuk terlibat, dan jika memungkinkan memberikan umpan balik kepada siswa ketika mereka melakukan inkuiri")
fakta("bahan_tl", 10, "mensyaratkan digunakannya bahan- bahan cetak, non cetak, dan sumber-sumber manusia")
fakta("interaktif", 10, "merujuk kepada bentuk diskusi dan saling berbagi di antara peserta didik")
fakta("interaktif_bentuk", 10, "bentuk diskusi kelas, diskusi kelompok kecil atau pengerjaan tugas kelompok, dan kerja sama siswa secara berpasangan")
fakta("pengalaman", 10, "menggunakan bentuk sekuens induktif, berpusat pada siswa, dan beroreintasi pada aktivitas")
fakta("proses", 10, "penekanan dalam strategi belajar melalui pengalaman adalah proses belajar dan bukan hasil belajar")
fakta("simulasi", 10, "di dalam kelas dapat digunakan metode simulasi, sendangkan di luar kelas dapat dikembangkan metode observasi")
fakta("mandiri", 10, "bertujuan untuk membangun inisiatif individu, kemandirian, dan peningkatan diri")
fakta("mandiri_rencana", 10, "Fokusnya adalah perencanaan belajar mandiri oleh peserta didik dengan bantuan guru")
fakta("mandiri_teman", 10, "Belajar mandiri juga bisa dilakukan dengan teman atau sebagi bagian dari kelompok kecil")
# C. Sasaran kegiatan pembelajaran (p. 11)
fakta("sasaran", 11, "Setiap kegiatan belajar-mengajar mempunyai saran atau tujuan")
fakta("berjenjang", 11, "Tujuan itu bertahap dan berjenjang, mulai dari yang sangat operasional dan konkret yakni tujuan pembelajran khusus, tujuan pembelajran umum, tujuan kurikulerr, dan tujuan nasional sampai pada tujuan yang bersifat universal")
fakta("sistem", 11, "seperangkat komponen yang saling bergantung satu sama lain untuk mencapai tujuan")
fakta("sistem_komp", 11, "tujuan pembelajaran, bahan ajar, siswa yang menerima pelayanan belajar, guru, metode dan pendekatan, situasi dan evaluasi kemajuan belajar")
fakta("organisasi", 11, "semua komponen yang ada harus diorganisasikan dengan baik sehingga diantara komponen itu terjadi kerja sama")
fakta("peran", 11, "guru berperan sebgai pengajar, pembimbing, perantara sekolah dengan masyarakat, administrator, dan lain-lain")
fakta("aspek_1", 11, "kecerdasan dan bakat khusus, 2) prestasi sejak permulaan sekolah, 3) perkembangan jasmani dan kesehatan, 4) kecendrungan emosi dan karakternya")
fakta("aspek_2", 11, "sikap dan minat belajar, 6)cita-cita, 7) kebiasaan belajar dan bekerja, 8) hobi dan penggunaan waktu senggang")
fakta("aspek_3", 11, "hubungan sosial di sekolah dan di rumah, 10) latar belakang keluarga, 11) lingkungan tempat tinggal, serta 12) sifat-sifat khusus dan kesulitan belajar anak didik")
fakta("evaluasi_pahami", 11, "Usaha untuk memahami anak didik ini bisa dilakukan melalui evaluasi")
fakta("lapor", 11, "melaporkan perkembangan hasil belajar para siswa kepada kepala sekolah, orang tua serta instansi terkait")
# D. Tahapan kegiatan pembelajaran (pp. 11-17)
fakta("tiga_tahap", 11, "tahapan permulaan (prainstruksional), selanjutnya tahapan pengajaran (instruksional) dan terakhir tahapan penilaian dan tindak lanjut")
fakta("pra_tujuan", 12, "mengungkapkan kembali tanggapan siswa terhadap bahan yang telah diterimanya, dan menumbuhkan kondisi belajar dalam hubungannya dengan pelajaran hari itu")
fakta("pemanasan", 12, "mirip dengan kegiatan pemanasan dalam olahraga")
fakta("tegang", 12, "supaya siswa tidak merasa tegang, kaku, bahkan takut mengikuti pembelajaran")
fakta("kehadiran", 12, "guru dapat mengajukan pertanyaan kepada siswa yang hadir tentang siswa yang tidak hadir dan alasan ketidakhadirannya")
fakta("kesiapan", 12, "guru perlu membantu pengembangan kesiapan belajar dan menumbuhkan semangat siswa dalam belajarnya")
fakta("kesiapan_sumber", 13, "Membantu atau membimbing siswa dalam mempersiapkan fasilitas/sumber belajar yang diperlukan dalam kegiatan belajar")
fakta("kesiapan_media", 13, "Menggunakan berbagai media pembelajaran sesuai dengan tujuan pembelajaran dan minat siswa")
fakta("demokratis", 13, "berani menjawab, berani bertanya, berani berpendapat atau berani mengeluarkan ide-ide")
fakta("materi_lalu", 13, "Apabila materi yang akan dibahas memiliki kaitan langsung atau menuntut penguasaan siswa terhadap materi sebelumnya")
fakta("manfaat", 13, "Siswa akan termotivasi untuk mengikuti pelajaran apabila mereka melihat manfaat yang akan diperoleh apabila mereka menguasai materi tersebut")
fakta("pengalaman_siswa", 14, "guru dapat meminta siswa untuk mengemukakan pengalamannya yang berkaitan dengan materi yang akan dibahas")
fakta("inti", 14, "Kegiatan inti pembelajaran pada dasarnya adalah kegiatan pokok siswa untuk mempelajari materi yang telah direncanakan")
fakta("inti_interaksi", 14, "kegiatan inti pembelajaran dengan kata lain adalah proses interaksi antara siswa dengan lingkungan pembelajaran")
fakta("tidak_dominasi", 14, "guru dalam melakukan kegiatan inti pembelajaran tidak mendominasi kegiatan pembelajaran")
fakta("beri_tujuan", 15, "Kegiatan paling awal yang perlu dilakukan guru sebelum membahas pelajaran, adalah memberitahukan tujuan atau garis besar materi dan kemampuan apa yang akan dipelajari siswa")
fakta("alternatif", 15, "Efektivitas dan efisiensi belajar sangat dipengaruhi oleh teknik belajar yang digunakan siswa")
fakta("bahas", 15, "Pembahasan atau penyampaian materi pelajaran harus mengutamakan aktivitas siswa, sehingga dalam prosesnya guru lebih banyak berperan sebagai fasilitator dan pembimbing")
fakta("simpul", 16, "Menyimpulkan pelajaran dirumuskan oleh siswa di bawah bimbingan guru")
fakta("simpul_penguatan", 16, "sebagai teknik untuk penguatan terhadap hasil belajar siswa secara menyeluruh")
fakta("simpul_kriteria", 16, "Singkat, jelas dan bahasa (tulis/lisan) mudah dipahami oleh siswa. 3) Kesimpulan tidak keluar dari topik yang telah dibahas. 4) Dapat menggunakan waktu sesingkat mungkin")
fakta("akhir_tujuan", 16, "Tujuan tahapan ini ialah untuk mengetahui tingkat keberhasilan dari tahapan instruksional")
fakta("akhir_bukan_tutup", 16, "tidak hanya diartikan sebagai kegiatan untuk menutup pelajaran, tetapi juga sebagai kegiatan penilaian hasil belajar siswa dan kegiatan tindak lanjut")
fakta("tindak_dasar", 16, "Kegiatan tindak lanjut harus ditempuh berdasarkan pada proses dan hasil belajar siswa")
fakta("akhir_daftar", 16, "Memberikan tugas/latihan yang dikerjakan di luar jam pelajaran. c. Memberikan motivasi dan bimbingan belajar")
fakta("pengayaan", 16, "program pembelajaran secara perorangan atau kelompok untuk melaksanakan program pengayaan dan atau perbaikan")
fakta("formatif_baik", 16, "Siswa yang telah mencapai hasil baik dalam tes formatif dapat meneruskan ke bagian pelajaran selanjutnya atau mempelajari bahan tambahan")
fakta("formatif_kurang", 16, "harus mengulang isi pelajaran tersebut dengan menggunakan bahan instruksional yang sama atau berbeda")
fakta("terpadu", 17, "Ketiga tahap yang telah dibahas di atas, merupakan satu rangkaian kegiatan yang terpadu, tidak terpisahkan satu sama lain")
fakta("fleksibel", 17, "Guru dituntut untuk mampu dan dapat mengatur waktu dan kegiatan secara fleksibel")
fakta("teori_praktik", 17, "secara teo-retis mudah dikuasai, namun dalam praktiknya tidak semudah seperti digam-barkan")
fakta("latihan_kebiasaan", 17, "Hanya dengan latihan dan kebiasaan yang terencana, kemampuan itu dapat diperoleh")
# E. Istilah dalam strategi pembelajaran (pp. 17-22)
fakta("istilah", 17, "Beberapa istilah yang hampir sama dengan strategi yaitu metode, pendekatan, teknik atau taktik dalam pembelajaran")
fakta("joyce", 17, "(1) model interaksi sosial; (2) model pengolahan informasi; (3) model personal-humanistik; dan (4) model modifikasi tingkah laku")
fakta("identik", 17, "seringkali penggunaan istilah model pembelajaran tersebut diidentikkan dengan strategi pembelajaran")
fakta("hierarki", 18, "Model Pembelajaran: Pendekatan Pembelajaran; Strategi Pembelajaran; Metode Pembelajaran; Teknik dan Taktik Pembelajaran")
fakta("model_def", 18, "a plan or pattern that we can use to design face to face taching in the classroom or tutorial setting and to shape instructional material")
fakta("desain", 18, "desain pembelajaran lebih menunjuk kepada cara-cara merencanakan suatu sistem lingkungan belajar tertentu setelah ditetapkan strategi pembelajaran tertentu")
fakta("rumah", 18, "Sedangkan desain adalah menetapkan cetak biru (blue print) rumah yang akan dibangun beserta bahan-bahan yang diperlukan dan urutan-urutan langkah konstruksinya, maupun kriteria penyelesaiannya")
fakta("rumah_tipe", 18, "strategi membicarakan tentang berbagai kemungkinan tipe atau jenis rumah yang hendak dibangun (rumah joglo, rumah gadang, rumah modern, dan sebagainya)")
fakta("kembangkan_model", 19, "guru pun dapat secara kreatif mencobakan dan mengembangkan model pembelajaran tersendiri yang khas, sesuai dengan kondisi nyata di tempat kerja masing-masing")
fakta("pendekatan", 19, "Pendekatan (approach) merupakan titik tolak atau sudut pandang kita terhadap proses pembelajaran")
fakta("killen_guru", 19, "Pendekatan yang berpusat pada guru menurunkan strategi pembelajaran langsung (direct instruction), pembelajaran deduktif atau pembelajaran ekspositori")
fakta("killen_siswa", 19, "pendekatan pembelajaran yang berpusat pada siswa menurunkan strategi pembelajaran discovery dan inkuiri serta strategi pembelajaran induktif")
fakta("metode", 20, "Metode digunakan untuk merealisasikan strategi yang telah ditetapkan")
fakta("metode_nyata", 20, "metode pembelajaran di sini dapat diartikan sebagai cara yang digunakan untuk mengimplementasikan rencana yang sudah disusun dalam bentuk kegiatan nyata dan praktis untuk mencapai tujuan pembelajaran")
fakta("berbagai_metode", 20, "Dengan demikian suatu strategi dapat dilaksanakan dengan berbagai metode")
fakta("daftar_metode", 20, "(1) ceramah; (2) demonstrasi; (3) diskusi; (4) simulasi; (5) laboratorium; (6) pengalaman lapangan; (7) brainstorming; (8) debat, (9) simposium")
fakta("sifat_mapel", 21, "Sifat dari mata pelajaran menentukan pemilihan metode untuk melaksanakan tugas mengajar")
fakta("sifat_tujuan", 21, "Sifat dari tujuan pembelajaran yang merupakan faktor dalam memutuskan strategi mengajar yang sesuai atau cocok")
fakta("kriteria_tes", 21, "dievaluasi dalam hal realisasi tujuan yang ditetapkan dengan menggunakan tes yang mengacu pada kriteria")
fakta("modifikasi", 21, "Strategi mengajar selalu dimungkinkan untuk dimodifikasi demi kepentingan realisasi terbaik dari perangkat tujuan pada kondisi saat ini")
fakta("komprehensif", 21, "Strategi mengajar lebih komprehensif sebagaimana bisa digunakannya bermacam metode, teknik, alat bantu")
fakta("teknik", 22, "teknik pembelajaran dapat diatikan sebagai cara yang dilakukan seseorang dalam mengimplementasikan suatu metode secara spesifik")
fakta("teknik_ceramah", 22, "penggunaan metode ceramah pada kelas dengan jumlah siswa yang relatif banyak membutuhkan teknik tersendiri")
fakta("teknik_diskusi", 22, "perlu digunakan teknik yang berbeda pada kelas yang siswanya tergolong aktif dengan kelas yang siswanya tergolong pasif")
fakta("taktik", 22, "taktik pembelajaran merupakan gaya seseorang dalam melaksanakan metode atau teknik pembelajaran tertentu yang sifatnya individual")
fakta("taktik_contoh", 22, "terdapat dua orang sama-sama menggunakan metode ceramah, tetapi mungkin akan sangat berbeda dalam taktik yang digunakannya")
fakta("kekhasan", 22, "sesuai dengan kemampuan, pengalaman dan tipe kepribadian dari guru yang bersangkutan")
fakta("majid", 22, "Sumber : Abddul Majid, Strategi Pembelajaran, h.23")
# For the book-error record only (used by no lesson section and no option)
fakta("uu_pasal", 3, "( UU No. 20/2003, Bab I Pasal Ayat 20)")
fakta("ulang_p4", 4, "psikomoto r) seseorang peserta didik")
fakta("ciri", 5, "8) Ciri - ciri Pembelajaran")
fakta("fellnz", 10, "Seaman dan Fellnz (1989)")
fakta("ulang_p12", 12, "sehingga menyenangkan ini harus diciptakan mulai dari awal pembelajaran hingga")
fakta("ulang_p13", 13, "siswa melihat bahwa materi dan siswa melihat bahwa materi yang dipelajari tidak berdiri tetapi saling berkaitan")
fakta("delapan", 14, "harus mencerminkan delapan unsur pokok")
fakta("dewey", 18, "Menurut Dewey dalam Joyce dan Weil (1986)")
fakta("terjemah", 18, "atau di luar kelas dengan menambahakn materi pengajaran")
fakta("ktsp", 19, "sebagaimana diisyaratkan dalam Kurikulum Tingkat Satuan Pendidikan")
fakta("tabel_ganda", 21, "Tabel 1.1. Perbedaan antra Metode dan Strategi Mengajar")
REKAMAN = {"uu_pasal", "ulang_p4", "ciri", "fellnz", "ulang_p12", "ulang_p13", "delapan", "dewey", "terjemah", "ktsp", "tabel_ganda", "majid"}
# The diagram on p. 18 (and Gambar 1.2, p. 20) is an image; its boxes were read by eye.
GAMBAR = {"hierarki"}
DEPAN = {k for k, (h, _) in FAKTA.items() if isinstance(h, str)}

# ── The lessons.
SUMBER = ("_Diadaptasi dari Strategi Pembelajaran, Siti Nurhasanah dkk., Penerbit EDU PUSTAKA, 2019, "
          "Bab I. Materi uji internal, bukan untuk distribusi._")
PEMBERITAHUAN = "**UJI INTERNAL / MATERI PERAGAAN — TIDAK UNTUK DISTRIBUSI PRODUKSI**"
SITASI = ("Sumber: Dr. Siti Nurhasanah, M.Pd; Dr. (Cdt) Agus Jayadi, M.Pd; Dr. Rika Sa'diyah, M.Pd; "
          "Syafrimen, M.Ed, Ph.D. *Strategi Pembelajaran*. Jakarta: Penerbit EDU PUSTAKA, 2019, Cetakan Pertama. "
          "ISBN 978-623-90461-7-0. Bab I «Pendahuluan», hlm. 1–36.")
UJI = "[UJI INTERNAL] "

KURSUS = {
    "Judul kursus*": "[UJI INTERNAL] Strategi Pembelajaran — Bab 1: Pendahuluan",
    "Mata pelajaran*": "Pengembangan Kompetensi",
    "Jenjang*": "Guru",
    "Kelas*": "Guru",
    "Konteks": "Pengembangan profesi",
}

BAB = [(1, UJI + "Pendahuluan")]

PELAJARAN = [
    dict(no=1, judul=UJI + "Pengertian Strategi Pembelajaran",
         ringkasan="Strategi pembelajaran adalah rencana rangkaian kegiatan untuk mencapai tujuan tertentu; tujuan dirumuskan lebih dulu.",
         tujuan="Anda dapat membedakan pembelajaran dari pengajaran dan menilai apakah suatu rencana sudah memenuhi dua ciri strategi pembelajaran.",
         bloom="Memahami",
         jejak=[("(pembuka)", ["isbn", "terbit", "cetakan", "daftar_isi"]),
                ("Dari strategi ke strategi pembelajaran", ["militer", "strategos", "menimbang", "faktor", "strategi_def", "sp_rencana"]),
                ("Pembelajaran, bukan sekadar pengajaran", ["uu", "konotasi", "satu_pihak", "primer", "komponen", "tujuan_komp",
                                                          "materi_komp", "metode_komp", "media_komp", "evaluasi_komp"]),
                ("Dua ciri yang perlu Anda cermati", ["kemp", "dick_carey", "gerlach", "dua_ciri", "belum_tindakan", "roh"]),
                ("Situasi di kelas", ["arah", "roh", "rekayasa"])],
         isi=PEMBERITAHUAN + "\n\n" + SITASI + " Materi ini adalah adaptasi dekat untuk peragaan internal.\n\n" + """## Dari strategi ke strategi pembelajaran

Istilah strategi berasal dari dunia militer; kata Yunani *stratēgos* berarti komandan militer. Sebelum bertindak, seorang komandan menimbang jumlah dan mutu pasukannya serta memperhitungkan faktor dari dalam dan dari luar. Baru sesudah itu ia menyusun tindakan.

Dari akar itu, bab ini merumuskan strategi sebagai pola yang sengaja direncanakan dan ditetapkan untuk melakukan suatu tindakan. Dalam pendidikan, **strategi pembelajaran** adalah perencanaan yang memuat rangkaian kegiatan yang dirancang untuk mencapai tujuan pendidikan tertentu.

## Pembelajaran, bukan sekadar pengajaran

Undang-Undang No. 20 Tahun 2003 merumuskan pembelajaran sebagai proses interaksi peserta didik dengan pendidik dan sumber belajar dalam suatu lingkungan belajar. Pembelajaran dan pengajaran bermakna mirip, tetapi konotasinya berbeda:

- **Pengajaran** berkesan pekerjaan satu pihak, yaitu guru.
- **Pembelajaran** menyiratkan interaksi guru dengan peserta didik. Belajar adalah kegiatan primer; mengajar adalah kegiatan sekunder yang mengupayakan agar belajar berlangsung optimal.

Kegiatan pembelajaran melibatkan beberapa komponen:

- **peserta didik** dan **guru**;
- **tujuan**: pernyataan perubahan perilaku (kognitif, afektif, psikomotorik) yang diharapkan sesudah pembelajaran;
- **materi**: fakta, prinsip, dan konsep yang dibutuhkan untuk mencapai tujuan;
- **metode**: cara teratur agar peserta didik memperoleh informasi yang mereka butuhkan;
- **media**: bahan, dengan atau tanpa peralatan, untuk menyajikan informasi;
- **evaluasi**: cara menilai proses dan hasilnya.

## Dua ciri yang perlu Anda cermati

Para ahli yang dirangkum bab ini memberi tekanan yang berbeda. Kemp menekankan kegiatan guru dan peserta didik agar tujuan tercapai secara efektif dan efisien. Dick dan Carey menambahkan bahwa strategi tidak terbatas pada prosedur, tetapi juga mencakup pengaturan materi. Gerlach dan Ely menyebut sifat, lingkup, dan urutan kegiatan yang memberi pengalaman belajar.

Dari rumusan-rumusan itu, bab ini menarik dua ciri:

1. Strategi adalah **rencana tindakan**, termasuk penggunaan metode dan pemanfaatan sumber daya. Pada tahap ini strategi masih berupa rencana kerja; ia belum sampai pada tindakan.
2. Strategi disusun **untuk mencapai tujuan**. Karena itu, sebelum menentukan strategi, rumuskan dulu tujuan yang jelas dan dapat diukur keberhasilannya. Bab ini menyebut tujuan sebagai roh pelaksanaan strategi.

## Situasi di kelas

Seorang guru IPA SMP sudah menyiapkan tayangan yang menarik dan lembar kerja untuk topik fotosintesis. Ketika ditanya apa yang harus dapat dilakukan peserta didik di akhir pertemuan, ia belum dapat menjawab dengan pasti.

Menurut bab ini, bahan itu belum menjadi strategi yang utuh, karena semua keputusan strategi diarahkan pada tujuan. Langkah yang tepat adalah merumuskan tujuan yang terukur lebih dulu, lalu menilai apakah tayangan dan lembar kerja benar-benar melayani tujuan itu. Keputusan tentang strategi yang paling tepat untuk kelas dan mata pelajaran Anda tetap ada di tangan Anda.

""" + SUMBER),
    dict(no=2, judul=UJI + "Jenis-Jenis Strategi Pembelajaran",
         ringkasan="Setiap strategi memuat empat unsur; bab ini mengelompokkan strategi menjadi langsung, tidak langsung, interaktif, melalui pengalaman, dan mandiri.",
         tujuan="Anda dapat mengenali unsur sebuah strategi dan memilih kelompok strategi yang sesuai dengan sifat tujuan pembelajaran.",
         bloom="Menerapkan",
         jejak=[("Empat unsur setiap strategi", ["unsur_1", "unsur_2", "unsur_3", "unsur_4", "konseptual", "lewat_metode"]),
                ("Cara mengelompokkan strategi", ["rowntree", "induktif", "saskatchewan", "langsung", "langsung_metode", "langsung_efektif",
                                                 "tidak_langsung", "fasilitator", "rancang_ling", "bahan_tl", "interaktif", "interaktif_bentuk",
                                                 "pengalaman", "proses", "simulasi", "mandiri", "mandiri_rencana", "mandiri_teman", "daftar_isi"]),
                ("Situasi di kelas", ["langsung_efektif", "langsung_metode", "tidak_langsung", "rancang_ling", "fasilitator", "sifat_tujuan", "unsur_4"])],
         isi="""## Empat unsur setiap strategi

Bab ini mengambil empat unsur strategi dari Newman dan Logan, lalu menerapkannya pada pembelajaran:

1. menetapkan tujuan secara rinci, yaitu perubahan perilaku dan pribadi peserta didik yang dituju;
2. memilih pendekatan pembelajaran yang dipandang paling efektif;
3. menetapkan langkah, prosedur, metode, dan teknik pembelajaran;
4. menetapkan kriteria dan batas minimum keberhasilan.

Strategi masih bersifat konseptual: ia berisi keputusan yang akan diambil. Untuk melaksanakannya, guru memakai metode tertentu.

## Cara mengelompokkan strategi

Rowntree membedakan strategi ekspositori dan penemuan (*exposition-discovery*), serta strategi kelompok dan individual (*group-individual*). Menurut cara penyajian dan pengolahannya, strategi juga dapat bersifat induktif atau deduktif.

Bab ini kemudian memakai klasifikasi Saskatchewan (1991) yang membagi strategi menjadi lima kelompok:

- **Langsung.** Berpusat pada guru dan paling sering dipakai; mencakup ceramah, pertanyaan didaktik, pengajaran eksplisit, praktik dan latihan, serta demonstrasi. Efektif untuk memperluas informasi atau mengembangkan keterampilan langkah demi langkah.
- **Tidak langsung.** Peserta didik terlibat tinggi dalam mengamati, menyelidiki, menarik inferensi dari data, atau membentuk hipotesis. Guru tidak lagi berceramah, tetapi menjadi fasilitator, pendukung, dan narasumber; ia merancang lingkungan belajar dan, bila mungkin, memberi umpan balik selama penyelidikan. Strategi ini memerlukan bahan cetak, noncetak, dan sumber manusia.
- **Interaktif.** Diskusi dan saling berbagi antarpeserta didik, dalam bentuk diskusi kelas, diskusi kelompok kecil atau tugas kelompok, dan kerja berpasangan.
- **Melalui pengalaman.** Urutan induktif, berpusat pada peserta didik, dan berorientasi aktivitas; yang ditekankan adalah proses belajar, bukan hasilnya. Dapat dipakai di dalam kelas, misalnya simulasi, maupun di luar kelas, misalnya observasi.
- **Mandiri.** Membangun inisiatif, kemandirian, dan peningkatan diri. Fokusnya perencanaan belajar oleh peserta didik sendiri dengan bantuan guru; dapat juga dilakukan bersama teman atau dalam kelompok kecil.

Bab 2 buku ini membahas kelima kelompok tersebut lebih rinci.

## Situasi di kelas

Seorang guru Biologi SMA mempunyai dua tujuan pada minggu yang sama. Pertama, peserta didik dapat memakai mikroskop dengan urutan langkah yang aman. Kedua, peserta didik dapat merumuskan dugaan tentang pengaruh cahaya terhadap pertumbuhan kecambah dari data pengamatan mereka sendiri.

Tujuan pertama adalah keterampilan langkah demi langkah, sehingga strategi langsung, misalnya demonstrasi lalu praktik dan latihan, sesuai. Tujuan kedua menuntut peserta didik menarik inferensi dan membentuk hipotesis dari data, sehingga strategi tidak langsung lebih sesuai; peran Anda bergeser menjadi perancang lingkungan belajar dan pemberi umpan balik.

Pilihan strategi mengikuti sifat tujuan, bukan kebiasaan. Dalam satu minggu Anda dapat memakai strategi yang berbeda untuk tujuan yang berbeda, asalkan kriteria keberhasilan masing-masing sudah ditetapkan sejak awal.

""" + SUMBER),
    dict(no=3, judul=UJI + "Sasaran Kegiatan Pembelajaran",
         ringkasan="Tujuan pembelajaran berjenjang; belajar-mengajar adalah sistem yang komponennya saling bergantung, dan guru perlu memahami peserta didiknya.",
         tujuan="Anda dapat menilai keselarasan komponen pembelajaran dan menentukan informasi tentang peserta didik yang perlu dipahami sebelum memilih strategi.",
         bloom="Menganalisis",
         jejak=[("Tujuan yang berjenjang", ["sasaran", "berjenjang"]),
                ("Belajar-mengajar sebagai sistem", ["sistem", "sistem_komp", "organisasi"]),
                ("Peran guru dan pemahaman tentang peserta didik", ["peran", "aspek_1", "aspek_2", "aspek_3", "evaluasi_pahami", "lapor"]),
                ("Situasi di kelas", ["aspek_2", "aspek_3", "evaluasi_pahami", "sistem", "organisasi"])],
         isi="""## Tujuan yang berjenjang

Setiap kegiatan belajar-mengajar mempunyai sasaran atau tujuan. Tujuan itu bertahap dan berjenjang: dari yang paling operasional dan konkret, yaitu tujuan pembelajaran khusus, ke tujuan pembelajaran umum, tujuan kurikuler, dan tujuan nasional, sampai tujuan yang bersifat universal.

Tujuan yang Anda tulis untuk satu pertemuan berada di jenjang paling konkret dari rangkaian itu.

## Belajar-mengajar sebagai sistem

Bab ini memandang belajar-mengajar sebagai sistem instruksional, yaitu seperangkat komponen yang saling bergantung untuk mencapai tujuan. Komponennya antara lain tujuan, bahan ajar, peserta didik, guru, metode dan pendekatan, situasi, serta evaluasi kemajuan belajar.

Agar tujuan tercapai, semua komponen harus diorganisasikan dengan baik sehingga saling bekerja sama. Karena komponen-komponen itu saling bergantung, satu komponen yang tidak selaras dapat melemahkan yang lain.

## Peran guru dan pemahaman tentang peserta didik

Dalam sistem itu guru berperan sebagai pengajar dan pembimbing, penghubung sekolah dengan masyarakat, administrator, dan peran lain. Karena itu wajar bila guru memahami berbagai aspek pribadi peserta didiknya. Bab ini menyebut dua belas aspek, yang dapat dikelompokkan sebagai berikut:

- kecerdasan dan bakat khusus, serta prestasi sejak awal sekolah;
- perkembangan jasmani dan kesehatan, kecenderungan emosi, dan karakter;
- sikap dan minat belajar, cita-cita, kebiasaan belajar dan bekerja, serta hobi dan penggunaan waktu luang;
- hubungan sosial di sekolah dan di rumah, latar belakang keluarga, dan lingkungan tempat tinggal;
- sifat khusus dan kesulitan belajar.

Pemahaman ini dapat diperoleh melalui evaluasi. Guru juga berkewajiban melaporkan perkembangan hasil belajar kepada kepala sekolah, orang tua, dan instansi terkait.

## Situasi di kelas

Seorang guru kelas V memperhatikan bahwa tiga peserta didik yang biasanya aktif kini sering tidak menyelesaikan tugas. Ia sempat berencana mengganti metode untuk seluruh kelas.

Sebelum mengubah strategi, bab ini mengarahkan Anda untuk memahami dulu peserta didik yang bersangkutan: kebiasaan belajarnya, hubungan sosialnya, keadaan keluarganya, dan kemungkinan kesulitan belajar tertentu. Evaluasi dapat menjadi jalannya. Informasi itu kemudian menjadi masukan bagi komponen lain dalam sistem, termasuk pilihan metode dan bentuk evaluasi berikutnya.

""" + SUMBER),
    dict(no=4, judul=UJI + "Tahapan Kegiatan Pembelajaran",
         ringkasan="Kegiatan pembelajaran terdiri atas tahap awal, inti, serta penilaian dan tindak lanjut yang membentuk satu rangkaian terpadu.",
         tujuan="Anda dapat merancang kegiatan awal, inti, dan akhir pembelajaran serta menentukan tindak lanjut berdasarkan hasil penilaian.",
         bloom="Menerapkan",
         jejak=[("Tiga tahap", ["tiga_tahap", "terpadu", "fleksibel", "teori_praktik", "latihan_kebiasaan"]),
                ("Tahap awal", ["pra_tujuan", "pemanasan", "tegang", "kehadiran", "kesiapan", "kesiapan_sumber", "kesiapan_media",
                               "demokratis", "materi_lalu", "manfaat", "pengalaman_siswa"]),
                ("Tahap inti", ["inti", "inti_interaksi", "tidak_dominasi", "beri_tujuan", "alternatif", "bahas", "simpul",
                               "simpul_penguatan", "simpul_kriteria", "pp19", "cetakan"]),
                ("Tahap penilaian dan tindak lanjut", ["akhir_bukan_tutup", "akhir_tujuan", "tindak_dasar", "akhir_daftar", "pengayaan",
                                                      "formatif_baik", "formatif_kurang"]),
                ("Situasi di kelas", ["inti", "tidak_dominasi", "bahas", "simpul", "akhir_tujuan", "tindak_dasar"])],
         isi="""## Tiga tahap

Bab ini membagi kegiatan pembelajaran menjadi tiga tahap pokok: pra-instruksional (awal), instruksional (inti), serta penilaian dan tindak lanjut. Ketiganya membentuk satu rangkaian terpadu. Guru mengatur waktu dan kegiatan secara fleksibel agar peserta didik menerima rangkaian itu secara utuh. Menurut bab ini, kemampuan tersebut mudah dikuasai secara teori, tetapi tidak semudah itu dalam praktik; ia diperoleh melalui latihan dan kebiasaan yang terencana.

## Tahap awal

Tahap awal bertujuan menghidupkan kembali tanggapan peserta didik terhadap materi yang sudah diterima dan menumbuhkan kondisi belajar untuk pelajaran hari itu. Bab ini menyamakannya dengan pemanasan dalam olahraga. Upaya yang disebutkan:

- menciptakan suasana yang membuat peserta didik tidak tegang, kaku, atau takut;
- memeriksa kehadiran, misalnya dengan menanyakan kepada yang hadir siapa yang tidak hadir dan apa alasannya;
- menumbuhkan kesiapan belajar, termasuk membantu menyiapkan sumber belajar dan memakai media yang sesuai dengan tujuan dan minat peserta didik;
- membangun suasana demokratis agar peserta didik berani bertanya, menjawab, dan berpendapat;
- bertanya tentang materi sebelumnya bila materi baru bergantung padanya;
- memperlihatkan manfaat materi bagi kehidupan peserta didik;
- meminta peserta didik menceritakan pengalaman yang berkaitan dengan materi.

## Tahap inti

Kegiatan inti adalah kegiatan pokok peserta didik untuk mempelajari materi yang telah direncanakan, yaitu interaksi mereka dengan lingkungan belajar. Guru adalah bagian dari lingkungan itu: ia memfasilitasi, tidak mendominasi. Langkahnya:

1. Sampaikan tujuan pertemuan, atau setidaknya garis besar materi dan kemampuan yang dituju.
2. Sampaikan alternatif kegiatan belajar yang akan ditempuh, karena teknik belajar peserta didik memengaruhi efektivitas dan efisiensi belajarnya.
3. Bahas materi dengan mengutamakan aktivitas peserta didik; guru lebih banyak menjadi fasilitator dan pembimbing.
4. Minta peserta didik merumuskan kesimpulan di bawah bimbingan Anda. Kesimpulan menguatkan hasil belajar; ia singkat, jelas, tidak keluar dari topik, dan tidak memakan banyak waktu.

Bab ini juga mengutip PP No. 19 Tahun 2005 yang meminta proses pembelajaran berlangsung interaktif, inspiratif, menyenangkan, menantang, dan memotivasi peserta didik untuk aktif. Buku ini terbit tahun 2019; periksa rumusan standar proses yang berlaku saat ini.

## Tahap penilaian dan tindak lanjut

Tahap akhir tidak sekadar menutup pelajaran. Tujuannya mengetahui tingkat keberhasilan tahap inti, dan tindak lanjutnya harus berdasarkan proses dan hasil belajar. Kegiatannya antara lain menilai hasil, memberi tugas di luar jam pelajaran, memberi motivasi dan bimbingan, menyampaikan alternatif kegiatan belajar, dan menyusun program pengayaan atau perbaikan, perorangan maupun kelompok.

Sesudah tes formatif dan umpan balik, peserta didik yang hasilnya baik dapat meneruskan ke bagian berikutnya atau mendalami bahan tambahan. Peserta didik yang hasilnya belum memadai mempelajari ulang isi pelajaran dengan bahan yang sama atau berbeda, dengan petunjuk dari guru.

## Situasi di kelas

Seorang guru Matematika SMA sering kehabisan waktu: penjelasannya memakan hampir seluruh jam, lalu ia menutup kelas dengan merangkum sendiri. Bab ini memberi dua pertimbangan. Pertama, kegiatan inti adalah kegiatan peserta didik, sehingga porsi penjelasan dapat dipangkas untuk memberi ruang bagi aktivitas mereka. Kedua, kesimpulan dirumuskan peserta didik dengan bimbingan guru, dan tahap akhir perlu menyisakan waktu untuk penilaian singkat yang menjadi dasar tindak lanjut.

Untuk pertemuan Anda berikutnya, perkirakan berapa bagian waktu yang dipakai peserta didik untuk beraktivitas, dan siapa yang merumuskan kesimpulan.

""" + SUMBER),
    dict(no=5, judul=UJI + "Istilah dalam Strategi Pembelajaran",
         ringkasan="Pendekatan, strategi, metode, teknik, dan taktik tersusun dari yang paling umum ke yang paling spesifik; desain disusun sesudah strategi ditetapkan.",
         tujuan="Anda dapat menempatkan suatu keputusan mengajar pada tingkat yang tepat: pendekatan, strategi, metode, teknik, taktik, atau desain.",
         bloom="Menganalisis",
         jejak=[("Istilah yang sering tertukar", ["istilah", "hierarki", "pendekatan", "killen_guru", "killen_siswa", "sp_rencana", "metode",
                                                 "metode_nyata", "berbagai_metode", "daftar_metode", "teknik", "teknik_ceramah",
                                                 "teknik_diskusi", "taktik", "kekhasan", "taktik_contoh"]),
                ("Model dan desain pembelajaran", ["joyce", "model_def", "identik", "kembangkan_model", "desain", "rumah", "rumah_tipe"]),
                ("Metode dan strategi: perbedaan tekanan", ["sifat_mapel", "sifat_tujuan", "kriteria_tes", "modifikasi", "komprehensif"]),
                ("Situasi di kelas", ["interaktif_bentuk", "teknik_diskusi", "teknik", "taktik", "kekhasan"])],
         isi="""## Istilah yang sering tertukar

Pendekatan, strategi, metode, teknik, dan taktik sering dipakai bergantian. Bab ini menyusunnya dalam satu hierarki yang dibingkai oleh model pembelajaran, dari yang paling umum ke yang paling spesifik:

1. **Pendekatan**: titik tolak atau sudut pandang terhadap proses pembelajaran. Killen membedakan pendekatan yang berpusat pada guru, yang menurunkan strategi langsung, deduktif, atau ekspositori, dan pendekatan yang berpusat pada peserta didik, yang menurunkan strategi penemuan (*discovery*), inkuiri, dan induktif.
2. **Strategi**: rencana rangkaian kegiatan untuk mencapai tujuan (pelajaran 1).
3. **Metode**: cara mewujudkan strategi dalam kegiatan yang nyata dan praktis. Satu strategi dapat dilaksanakan dengan berbagai metode, misalnya ceramah, demonstrasi, diskusi, simulasi, laboratorium, pengalaman lapangan, curah pendapat, debat, dan simposium.
4. **Teknik**: cara spesifik melaksanakan suatu metode sesuai kondisi kelas. Ceramah di kelas besar memerlukan teknik yang berbeda dari ceramah di kelas kecil; diskusi di kelas yang aktif berbeda tekniknya dari diskusi di kelas yang pasif.
5. **Taktik**: gaya pribadi guru dalam melaksanakan metode atau teknik, sesuai kemampuan, pengalaman, dan kepribadiannya. Dua guru dengan metode yang sama dapat sangat berbeda taktiknya.

## Model dan desain pembelajaran

Joyce dan Weil mengelompokkan model pembelajaran menjadi empat: interaksi sosial, pengolahan informasi, personal-humanistik, dan modifikasi tingkah laku. Model adalah rencana atau pola untuk merancang pembelajaran tatap muka, baik di kelas maupun dalam tutorial, dan untuk membentuk bahan ajar. Dalam praktik, istilah model sering disamakan dengan strategi. Bab ini juga menegaskan bahwa guru yang memahami konsep dasar pembelajaran dapat mengembangkan model sendiri yang sesuai dengan kondisi nyata di tempat kerjanya.

**Desain pembelajaran** berbeda lagi. Bab ini memakai analogi membangun rumah: strategi memilih tipe rumah, misalnya joglo, rumah gadang, atau rumah modern; desain menetapkan cetak birunya, termasuk bahan, urutan langkah, dan kriteria penyelesaian. Desain disusun sesudah strategi ditetapkan.

## Metode dan strategi: perbedaan tekanan

Tabel yang dikutip bab ini dari Abdul Majid menonjolkan beberapa perbedaan:

- Pilihan metode lebih ditentukan oleh sifat mata pelajaran; pilihan strategi oleh sifat tujuan pembelajaran.
- Keberhasilan strategi dinilai dari tercapainya tujuan, dengan tes yang mengacu pada kriteria.
- Strategi fleksibel dan selalu dapat dimodifikasi agar tujuan tercapai sebaik mungkin dalam kondisi saat ini.
- Strategi lebih menyeluruh: ia dapat memakai berbagai metode, teknik, dan alat bantu untuk mengorganisasikan lingkungan belajar.

## Situasi di kelas

Dua guru Bahasa Indonesia di sekolah yang sama memakai strategi interaktif dengan metode diskusi. Kelas pertama berisi 36 peserta didik yang cenderung pasif; kelas kedua 24 peserta didik yang aktif. Metodenya tetap diskusi, tetapi tekniknya berbeda: di kelas pertama guru dapat memulai dengan diskusi berpasangan sebelum diskusi kelas, sedangkan di kelas kedua guru dapat langsung membuka diskusi kelompok. Perbedaan yang lahir dari kondisi kelas inilah yang disebut teknik.

Bila masing-masing guru kemudian membawa gaya pribadinya, misalnya humor atau penguasaan alat digital, perbedaan itu termasuk taktik. Saat merencanakan, Anda dapat memisahkan ketiga keputusan itu: metode mengikuti strategi, teknik mengikuti kondisi kelas, dan taktik mengikuti kekuatan pribadi Anda.

""" + SUMBER),
]

# Doubtful, dated or erroneous wording of the book stays out of every learner text.
DILUAR = ("Dewey", "Kurikulum Tingkat Satuan Pendidikan", "KTSP", "delapan unsur", "Abddul", "Fellnz", "Saskatchewan Educational",
          "Ciri - ciri", "Pasal Ayat", "menambahakn", "di luar kelas dengan menambah", "tujuan pendidikan tertentu. Jadi")
JUDUL_BAGIAN = re.compile(r"^## (.+)$", re.M)
for _p in PELAJARAN:
    _isi = _p["isi"]
    judul = JUDUL_BAGIAN.findall(_isi)
    cek(3 <= len(judul) <= 6, f"lesson {_p['no']}: 3-6 pages")
    cek(_p["judul"].startswith(UJI), f"lesson {_p['no']}: [UJI INTERNAL] on the title")
    cek(_isi.rstrip().endswith(SUMBER), f"lesson {_p['no']}: attribution last")
    # Every section is traced: JEJAK lists exactly the sections, in order, each with its facts.
    bagian = [j for j, _ in _p["jejak"] if j != "(pembuka)"]
    cek(bagian == judul, f"lesson {_p['no']}: JEJAK {bagian} against sections {judul}")
    for j, fids in _p["jejak"]:
        cek(fids and all(f in FAKTA and f not in REKAMAN for f in fids), f"lesson {_p['no']} {j}: facts {fids}")
    for bidang in ("judul", "ringkasan", "tujuan", "isi"):
        cek(not any(w in _p[bidang] for w in DILUAR), f"lesson {_p['no']} {bidang}: {[w for w in DILUAR if w in _p[bidang]]}")
        register(_p[bidang], f"lesson {_p['no']} {bidang}")
        notasi(_p[bidang], f"lesson {_p['no']} {bidang}")
    cek("Anda" in _isi, f"lesson {_p['no']}: the reader is addressed as Anda")
# The first lesson opens with the internal-demo notice and the full citation; only it does.
cek(PELAJARAN[0]["isi"].startswith(PEMBERITAHUAN + "\n\n" + SITASI))
cek(all(PEMBERITAHUAN not in p["isi"] for p in PELAJARAN[1:]))
cek(all(s in SITASI for s in ("978-623-90461-7-0", "EDU PUSTAKA", "2019", "Siti Nurhasanah", "Agus Jayadi", "Rika Sa'diyah", "Syafrimen")))
cek(KURSUS["Judul kursus*"].startswith(UJI) and all(b[1].startswith(UJI) for b in BAB))
# Every fact outside the error record is used by some section or some option (checked below).

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

# ── Pemetaan awal (pre-test): lessons 1, 2, 4 and 5.
soal("PA1", 1, "Seorang guru baru menyusun rencana untuk pertemuan pertamanya. Menurut pengertian strategi pembelajaran dalam bab ini, apa yang perlu ia rumuskan sebelum menentukan strategi?", "B", [
    ("tujuan pembelajaran yang jelas dan dapat diukur keberhasilannya", True, "Bab ini menyebut tujuan sebagai roh strategi: arah semua keputusan strategi adalah tujuan, jadi tujuan dirumuskan lebih dulu.", "roh"),
    ("daftar metode mengajar yang paling ia kuasai dan paling sering ia pakai", False, "Metode dipakai untuk mewujudkan strategi yang sudah ditetapkan, jadi dipilih sesudah strategi, bukan sebelumnya.", "metode"),
    ("media pembelajaran dan alat peraga yang tersedia di sekolah", False, "Media memang komponen pembelajaran, tetapi pilihannya mengikuti tujuan; tanpa tujuan, tidak ada dasar untuk memilih media.", "arah"),
    ("urutan bab dalam buku teks yang dipakai sekolah", False, "Urutan buku teks berkaitan dengan materi; strategi ditentukan oleh sifat tujuan pembelajaran.", "sifat_tujuan"),
], guna=PA, sulit="Mudah")
soal("PA2", 2, "Seorang guru ingin peserta didik menguasai cara memakai neraca laboratorium, langkah demi langkah, dalam waktu singkat. Kelompok strategi mana yang paling sesuai menurut klasifikasi dalam bab ini?", "C", [
    ("strategi pembelajaran langsung", True, "Strategi langsung efektif untuk mengembangkan keterampilan langkah demi langkah, misalnya melalui demonstrasi lalu praktik dan latihan.", "langsung_efektif"),
    ("strategi belajar mandiri", False, "Belajar mandiri menekankan inisiatif dan perencanaan belajar oleh peserta didik sendiri, bukan penguasaan prosedur yang cepat dan terpandu.", "mandiri_rencana"),
    ("strategi pembelajaran interaktif", False, "Strategi interaktif berupa diskusi dan saling berbagi; ia tidak diarahkan pada latihan urutan langkah suatu prosedur.", "interaktif"),
    ("strategi belajar melalui pengalaman", False, "Strategi ini menekankan proses belajar yang induktif, bukan penguasaan prosedur yang cepat.", "proses"),
], guna=PA, sulit="Mudah")
soal("PA3", 4, "Di awal pertemuan, seorang guru bertanya kepada peserta didik tentang materi minggu lalu yang menjadi dasar topik hari ini. Kegiatan ini termasuk tahap apa?", "A", [
    ("tahap pra-instruksional (awal pembelajaran)", True, "Tahap awal menghidupkan kembali tanggapan peserta didik terhadap materi yang sudah diterima; bertanya tentang materi sebelumnya termasuk upayanya.", "pra_tujuan"),
    ("tahap instruksional (kegiatan inti)", False, "Kegiatan inti adalah saat peserta didik mempelajari materi baru yang direncanakan; kegiatan ini mendahuluinya.", "inti"),
    ("tahap penilaian dan tindak lanjut", False, "Tahap akhir menilai keberhasilan tahap inti pertemuan itu; pertanyaan ini diajukan sebelum materi baru dimulai.", "akhir_tujuan"),
    ("tahap desain pembelajaran sebelum kelas dimulai", False, "Desain adalah perencanaan sebelum pembelajaran berlangsung, bukan bagian dari tiga tahap kegiatan di kelas.", "desain"),
], guna=PA, sulit="Mudah")
soal("PA4", 5, "Menurut hierarki istilah dalam bab ini, urutan mana yang bergerak dari yang paling umum ke yang paling spesifik?", "D", [
    ("pendekatan → strategi → metode → teknik dan taktik", True, "Diagram bab ini menempatkan pendekatan di atas strategi, lalu metode, lalu teknik dan taktik.", "hierarki"),
    ("strategi → pendekatan → metode → teknik dan taktik", False, "Pendekatan adalah sudut pandang yang menurunkan strategi, jadi ia berada di atas strategi.", "killen_guru"),
    ("pendekatan → metode → strategi → teknik dan taktik", False, "Metode dipakai untuk mewujudkan strategi, jadi metode berada di bawah strategi.", "metode"),
    ("metode → strategi → pendekatan → teknik dan taktik", False, "Urutan ini membalik tiga tingkat teratas; pendekatan adalah yang paling umum.", "pendekatan"),
], guna=PA, sulit="Mudah")

# ── Cek penguasaan (post-test): every lesson; scenarios that no lesson uses.
soal("PB1", 1, "Seorang wakil kepala sekolah menerima dokumen «strategi pembelajaran» dari seorang guru. Dokumen itu berisi urutan kegiatan, metode, dan sumber belajar yang akan dipakai, tetapi belum dilaksanakan di kelas. Bagaimana dokumen itu dinilai menurut pengertian strategi dalam bab ini?", "C", [
    ("sesuai, karena strategi memang masih rencana tindakan; yang perlu dicek adalah kejelasan tujuannya", True, "Strategi adalah rencana tindakan yang belum sampai pada pelaksanaan, dan tujuannya harus jelas serta terukur.", "belum_tindakan"),
    ("belum dapat disebut strategi, karena strategi baru terbentuk setelah kegiatan berlangsung di kelas", False, "Bab ini menegaskan kebalikannya: penyusunan strategi baru sampai pada rencana kerja, belum pada tindakan.", "belum_tindakan"),
    ("perlu dirapikan dulu, karena sumber belajar termasuk media dan sebaiknya dipisahkan dari strategi", False, "Bab ini memasukkan penggunaan metode dan pemanfaatan berbagai sumber daya ke dalam strategi itu sendiri.", "dua_ciri"),
    ("sudah cukup asalkan tujuan tidak dimasukkan, karena tujuan ditetapkan terpisah dari strategi", False, "Tujuan adalah arah semua keputusan strategi dan harus dirumuskan sebelum strategi ditentukan.", "roh"),
], guna=PB, sulit="Sedang")
soal("PB2", 2, "Seorang guru IPS ingin peserta didik menyusun dugaan sendiri tentang penyebab kemacetan di sekitar sekolah, berdasarkan data lalu lintas yang mereka kumpulkan. Peran guru mana yang paling sesuai dengan strategi yang cocok untuk tujuan ini?", "A", [
    ("fasilitator yang merancang lingkungan belajar dan memberi umpan balik selama penyelidikan", True, "Tujuannya menarik inferensi dan membentuk hipotesis dari data, yaitu strategi tidak langsung; di sini guru menjadi fasilitator dan perancang lingkungan belajar.", "rancang_ling"),
    ("penceramah yang menjelaskan penyebab kemacetan secara runtut sebelum pengamatan dimulai", False, "Ini peran dalam strategi langsung, yang efektif untuk memperluas informasi; dugaan peserta didik tidak lagi lahir dari data mereka.", "langsung_efektif"),
    ("pengamat yang membiarkan peserta didik bekerja tanpa rancangan kegiatan dan tanpa umpan balik", False, "Dalam strategi tidak langsung guru tetap merancang lingkungan belajar dan, bila mungkin, memberi umpan balik.", "rancang_ling"),
    ("moderator debat yang membagi kelas menjadi pihak pro dan kontra sejak awal pelajaran", False, "Debat adalah bentuk interaktif untuk saling menanggapi gagasan; tujuan ini menuntut inferensi dari data yang dikumpulkan sendiri.", "tidak_langsung"),
], guna=PB, sulit="Sedang")
soal("PB3", 3, "Seorang guru Bahasa Inggris SMP menerima kelas baru di tengah tahun ajaran dan ingin segera menentukan strategi untuk kelas itu. Menurut bab ini, apa yang sebaiknya ia lakukan lebih dulu?", "D", [
    ("memahami aspek pribadi peserta didik, seperti minat, kebiasaan belajar, dan kesulitan belajarnya", True, "Bab ini menyebut pemahaman atas aspek pribadi peserta didik sebagai bagian wajar dari peran guru, dan evaluasi sebagai jalan untuk itu.", "aspek_2"),
    ("memakai strategi yang berhasil di kelas lamanya, lalu menyesuaikannya setelah beberapa pertemuan", False, "Strategi memang dapat dimodifikasi, tetapi bab ini mengarahkan guru untuk memahami aspek pribadi peserta didiknya lebih dulu; strategi kelas lama dipilih untuk peserta didik lain.", "aspek_1"),
    ("menunggu hasil ujian akhir semester sebelum mulai mengenal peserta didiknya", False, "Evaluasi memang sarana untuk memahami peserta didik, tetapi pemahaman itu dibutuhkan sebelum strategi dipilih, bukan di akhir semester.", "evaluasi_pahami"),
    ("memakai nilai rapor semester lalu sebagai dasar utama memilih strategi untuk kelas itu", False, "Prestasi hanyalah satu dari dua belas aspek yang disebut bab ini; minat, kebiasaan belajar, dan kesulitan belajar tidak tampak dari nilai rapor.", "aspek_3"),
], guna=PB, sulit="Sedang")
soal("PB4", 4, "Pada akhir pembelajaran, tes formatif menunjukkan sekitar sepertiga peserta didik belum mencapai tujuan, sedangkan yang lain sudah. Menurut bab ini, tindak lanjut mana yang paling tepat?", "B", [
    ("perbaikan dengan bahan yang sama atau berbeda bagi yang belum tuntas, pengayaan bagi yang sudah", True, "Tindak lanjut berdasar pada hasil belajar: yang hasilnya baik meneruskan atau mendalami, yang belum mengulang dengan bahan yang sama atau berbeda.", "formatif_kurang"),
    ("mengulang seluruh materi untuk semua peserta didik agar seluruh kelas tetap bergerak bersama-sama", False, "Peserta didik yang sudah mencapai tujuan dapat meneruskan ke bagian berikutnya atau mendalami bahan tambahan.", "formatif_baik"),
    ("melanjutkan ke materi berikutnya untuk semua, karena sebagian besar kelas sudah tuntas", False, "Peserta didik yang hasilnya belum memadai perlu mengulang isi pelajaran; tindak lanjut ditentukan oleh hasil tiap peserta didik.", "tindak_dasar"),
    ("memberi tes ulang yang sama kepada yang belum tuntas, tanpa pembelajaran ulang lebih dulu", False, "Menurut bab ini, peserta didik yang hasilnya belum memadai perlu mempelajari ulang isi pelajaran, dengan bahan yang sama atau berbeda, sebelum dinilai lagi.", "formatif_kurang"),
], guna=PB, sulit="Sedang")
soal("PB5", 5, "Dua guru mengajar di dua kelas paralel yang setara, tiap kelas berisi 32 peserta didik yang aktif, dengan metode diskusi yang sama. Guru pertama sering membuka diskusi dengan cerita dari pengalamannya sendiri; guru kedua memakai papan tulis digital karena ia sangat menguasainya. Perbedaan ini paling tepat disebut perbedaan ...", "A", [
    ("taktik pembelajaran, karena bersumber dari gaya pribadi masing-masing guru", True, "Taktik adalah gaya individual guru dalam melaksanakan metode, sesuai kemampuan, pengalaman, dan kepribadiannya.", "kekhasan"),
    ("teknik pembelajaran, karena kondisi kedua kelas menuntut cara yang berbeda", False, "Teknik berbeda bila kondisi kelas berbeda, misalnya aktif dan pasif; kedua kelas ini setara.", "teknik_diskusi"),
    ("metode pembelajaran, karena cerita dan papan digital adalah dua metode", False, "Metode keduanya sama, yaitu diskusi; cerita dan papan digital adalah cara pribadi melaksanakannya.", "metode"),
    ("strategi pembelajaran, karena cara membuka diskusi mencerminkan rencana tindakan guru", False, "Strategi ditentukan oleh sifat tujuan, dan tujuan kedua kelas tidak berbeda; cara pribadi melaksanakan metode yang sama adalah taktik.", "sifat_tujuan"),
], guna=PB, sulit="Sedang")
soal("PB6", 5, "Seorang guru sudah memutuskan memakai strategi pembelajaran tidak langsung untuk topik ekosistem. Kini ia menentukan cara konkret yang akan dipakai di kelas untuk mewujudkan strategi itu. Keputusan ini berada pada tingkat ...", "D", [
    ("metode, misalnya observasi lapangan atau diskusi kelompok", True, "Metode adalah cara mewujudkan strategi dalam kegiatan nyata, dan satu strategi dapat dilaksanakan dengan berbagai metode.", "metode_nyata"),
    ("pendekatan, karena pendekatan menjabarkan strategi menjadi kegiatan", False, "Pendekatan berada di atas strategi: ia adalah sudut pandang yang menurunkan strategi, bukan penjabarannya.", "pendekatan"),
    ("taktik, karena setiap cara konkret di kelas adalah gaya pribadi guru", False, "Taktik adalah gaya individual dalam melaksanakan metode atau teknik; cara konkret untuk mewujudkan strategi adalah metode.", "taktik"),
    ("model, karena model adalah tingkat yang paling konkret dalam hierarki", False, "Model membingkai seluruh hierarki; tingkat paling spesifik adalah teknik dan taktik.", "hierarki"),
], guna=PB, sulit="Sedang")
soal("PB7", 4, "Seorang guru memulai kegiatan inti dengan langsung membagikan lembar kerja, tanpa menjelaskan apa yang akan dipelajari dan bagaimana peserta didik akan bekerja. Banyak peserta didik kebingungan. Menurut langkah kegiatan inti dalam bab ini, apa yang terlewat?", "C", [
    ("menyampaikan tujuan atau garis besar kemampuan, serta alternatif kegiatan belajar yang akan ditempuh", True, "Bab ini menyebut penyampaian tujuan sebagai kegiatan paling awal, diikuti penyampaian kegiatan belajar yang akan ditempuh.", "beri_tujuan"),
    ("memperlihatkan manfaat materi bagi kehidupan peserta didik sebelum lembar kerja dibagikan", False, "Memperlihatkan manfaat adalah upaya tahap awal untuk memotivasi; ia tidak memberi tahu peserta didik apa yang akan dipelajari dan bagaimana mereka bekerja.", "manfaat"),
    ("bertanya tentang materi minggu lalu sebelum kegiatan inti, untuk mengaitkannya dengan lembar kerja hari ini", False, "Bertanya tentang materi sebelumnya adalah upaya tahap awal; ia tidak menyampaikan tujuan dan cara kerja yang menjadi langkah pertama kegiatan inti.", "materi_lalu"),
    ("menjelaskan seluruh materi lebih dulu, lalu membagikan lembar kerja sebagai latihan penguatan", False, "Guru dalam kegiatan inti tidak mendominasi; pembahasan materi mengutamakan aktivitas peserta didik, dan tujuan tetap perlu disampaikan lebih dulu.", "tidak_dominasi"),
], guna=PB, sulit="Sedang")
soal("PB8", 3, "Seorang guru sudah merumuskan tujuan yang baik dan memilih metode diskusi kelompok. Namun ruang kelasnya tidak memungkinkan kelompok duduk bersama, dan tes akhirnya hanya menguji hafalan. Menurut pandangan belajar-mengajar sebagai sistem, apa yang paling tepat ia lakukan?", "B", [
    ("menyelaraskan ruang dan tes dengan tujuan dan metode sebelum mengajar, karena komponennya saling bergantung", True, "Komponen sistem saling bergantung dan harus diorganisasikan agar bekerja sama; ruang kelas dan evaluasi perlu diselaraskan dengan tujuan dan metode sebelum pembelajaran berlangsung.", "organisasi"),
    ("metodenya perlu diganti ceramah agar sesuai dengan ruang kelas, sedangkan tujuan dan tesnya tetap", False, "Mengganti satu komponen tidak menyelaraskan sistem: tes hafalan tetap tidak mengukur tujuan, dan semua komponen harus diorganisasikan agar bekerja sama.", "organisasi"),
    ("tujuannya perlu dirumuskan ulang menjadi hafalan agar selaras dengan tes akhir yang sudah ada", False, "Tujuan adalah arah semua keputusan dan dirumuskan lebih dulu; evaluasi yang harus mengukur tercapainya tujuan, bukan sebaliknya.", "roh"),
    ("tempat duduk ditata ulang agar diskusi dapat berjalan, dan tes akhirnya diperbaiki pada semester berikutnya", False, "Evaluasi adalah komponen sistem saat ini juga; keberhasilan dinilai dengan tes yang mengacu pada kriteria tujuan, jadi tes hafalan tidak mengukur tujuan pertemuan ini.", "kriteria_tes"),
], guna=PB, sulit="Sulit")

# ── Latihan (practice), one or two per lesson.
soal("LT1", 1, "Menurut bab ini, apa perbedaan pokok antara «pengajaran» dan «pembelajaran»?", "D", [
    ("pembelajaran menekankan interaksi guru dan peserta didik; pengajaran berkesan kerja guru saja", True, "Bab ini menyatakan pengajaran berkesan pekerjaan satu pihak, sedangkan pembelajaran menyiratkan interaksi.", "satu_pihak"),
    ("pembelajaran menekankan hasil yang dikuasai peserta didik, sedangkan pengajaran menekankan proses di kelas", False, "Bab ini membedakan keduanya dari pihak yang terlibat: pengajaran berkesan kerja guru saja, pembelajaran menyiratkan interaksi guru dan peserta didik.", "satu_pihak"),
    ("pembelajaran adalah kegiatan primer guru, sedangkan pengajaran adalah kegiatan sekunder peserta didik", False, "Bab ini menyebut belajar sebagai kegiatan primer dan mengajar sebagai kegiatan sekunder yang mengupayakan agar belajar terjadi; pernyataan ini membaliknya dan melewatkan pembeda pokoknya, yaitu interaksi.", "primer"),
    ("pengajaran berpusat pada kegiatan peserta didik, sedangkan pembelajaran pada penyampaian materi oleh guru", False, "Pernyataan ini membalik keduanya: pengajaran yang berkesan kerja satu pihak, yaitu guru.", "satu_pihak"),
], sulit="Mudah")
soal("LT2", 1, "Seorang guru menulis: «Setelah praktikum, peserta didik dapat menyusun laporan pengamatan dengan format yang disepakati.» Dalam komponen kegiatan pembelajaran, rumusan ini termasuk ...", "A", [
    ("tujuan, karena menyatakan perubahan perilaku yang diharapkan", True, "Tujuan adalah pernyataan perubahan perilaku yang diharapkan terjadi sesudah pembelajaran.", "tujuan_komp"),
    ("materi pelajaran, karena menyebut isi yang harus dipelajari", False, "Materi berupa fakta, prinsip, dan konsep; rumusan ini menyatakan kemampuan yang diharapkan.", "materi_komp"),
    ("metode, karena menyebut cara peserta didik memperoleh informasi", False, "Metode adalah cara teratur memberi kesempatan memperoleh informasi; rumusan ini menyatakan hasil yang dituju.", "metode_komp"),
    ("evaluasi, karena menyebut hasil yang akan dinilai di akhir", False, "Evaluasi adalah cara menilai proses dan hasil; rumusan ini menyatakan apa yang dituju, bukan cara menilainya.", "evaluasi_komp"),
], sulit="Sedang")
soal("LT3", 2, "Seorang guru meminta peserta didik kelas XI menyusun sendiri rencana belajar untuk proyek individu selama satu bulan, dengan konsultasi berkala kepadanya. Strategi yang ia pakai adalah ...", "B", [
    ("belajar mandiri", True, "Belajar mandiri berfokus pada perencanaan belajar oleh peserta didik sendiri dengan bantuan guru.", "mandiri_rencana"),
    ("pembelajaran langsung", False, "Strategi langsung berpusat pada guru; di sini peserta didik yang menyusun rencana belajarnya.", "langsung"),
    ("pembelajaran interaktif", False, "Strategi interaktif berupa diskusi dan saling berbagi antarpeserta didik; proyek ini individual.", "interaktif"),
    ("belajar melalui pengalaman", False, "Strategi ini menekankan urutan induktif dan proses; ciri utama situasi ini adalah perencanaan belajar oleh peserta didik sendiri.", "pengalaman"),
], sulit="Mudah")
soal("LT4", 2, "Seorang guru sudah menetapkan tujuan, memilih pendekatan, dan menyusun langkah-langkah pembelajaran. Unsur strategi mana yang menurut bab ini masih belum ada?", "C", [
    ("kriteria dan batas minimum keberhasilan", True, "Unsur keempat strategi adalah menetapkan kriteria dan batas minimum ukuran keberhasilan.", "unsur_4"),
    ("pemilihan media yang paling menarik bagi peserta didik", False, "Media adalah komponen pembelajaran, tetapi tidak termasuk empat unsur strategi.", "unsur_3"),
    ("rumusan visi sekolah sebagai induk semua tujuan", False, "Tujuan yang lebih tinggi memang berjenjang di atas tujuan pembelajaran, tetapi merumuskannya bukan unsur strategi pembelajaran; unsur yang belum ada adalah ukuran keberhasilan.", "berjenjang"),
    ("taktik pribadi guru dalam menyampaikan materi", False, "Taktik adalah gaya pribadi dalam melaksanakan metode, bukan unsur strategi.", "taktik"),
], sulit="Sedang")
soal("LT5", 3, "Seorang guru mata pelajaran melihat bahwa seorang peserta didik yang dulu aktif kini sering diam di kelas. Langkah mana yang paling sejalan dengan bab ini?", "A", [
    ("memahami aspek pribadinya, seperti hubungan sosial dan latar belakang keluarga, melalui evaluasi", True, "Guru wajar memahami aspek pribadi peserta didik, termasuk hubungan sosial dan latar belakang keluarga, dan evaluasi dapat menjadi jalannya.", "aspek_3"),
    ("langsung melaporkannya kepada orang tua dan kepala sekolah sebelum memahami keadaan peserta didik itu", False, "Guru memang melaporkan perkembangan hasil belajar kepada orang tua, tetapi langkah pertama adalah memahami peserta didik itu.", "lapor"),
    ("memindahkannya ke kelompok lain tanpa mencari tahu penyebab perubahan sikapnya", False, "Memindahkan kelompok tanpa memahami penyebabnya melewatkan aspek pribadi yang disebut bab ini.", "aspek_1"),
    ("menunggu beberapa minggu dulu, karena perubahan sikap remaja sering hilang dengan sendirinya", False, "Guru juga berperan sebagai pembimbing; bab ini mengarahkan guru untuk memahami aspek pribadi peserta didik, bukan menunggu.", "peran"),
], sulit="Mudah")
soal("LT6", 4, "Seorang guru Ekonomi SMA membuka pelajaran tentang anggaran pribadi dengan mengaitkannya pada cara peserta didik mengatur uang saku mereka. Upaya pra-instruksional ini terutama bertujuan ...", "D", [
    ("memperlihatkan manfaat materi agar peserta didik termotivasi mengikuti pelajaran", True, "Peserta didik termotivasi bila melihat manfaat yang diperoleh dari menguasai materi.", "manfaat"),
    ("memeriksa kesiapan fasilitas belajar sebelum kegiatan inti dimulai", False, "Menyiapkan fasilitas adalah upaya kesiapan yang lain; di sini guru mengaitkan materi dengan kehidupan peserta didik.", "kesiapan_sumber"),
    ("menilai hasil belajar pertemuan sebelumnya secara menyeluruh", False, "Penilaian hasil belajar termasuk tahap akhir, bukan pembukaan seperti ini.", "akhir_tujuan"),
    ("menyampaikan kesimpulan pelajaran kepada peserta didik lebih awal agar mereka tahu arah pelajaran", False, "Kesimpulan dirumuskan peserta didik di akhir kegiatan inti, di bawah bimbingan guru.", "simpul"),
], sulit="Mudah")
soal("LT7", 4, "Pernyataan mana yang paling tepat tentang hubungan ketiga tahap kegiatan pembelajaran?", "B", [
    ("ketiganya satu rangkaian terpadu; waktunya diatur fleksibel sesuai keadaan kelas", True, "Bab ini menyebut ketiga tahap sebagai rangkaian terpadu yang tidak terpisahkan, dengan waktu dan kegiatan yang diatur fleksibel.", "terpadu"),
    ("tahap inti adalah pembelajaran yang sesungguhnya; tahap awal dan akhir bersifat pelengkap", False, "Bab ini menyebut ketiga tahap sebagai satu rangkaian terpadu yang tidak terpisahkan; tahap awal pun memengaruhi keberhasilan peserta didik.", "terpadu"),
    ("tahap penilaian boleh dilewati bila waktu habis, karena kegiatan inti sudah selesai", False, "Tahap akhir diperlukan untuk mengetahui keberhasilan tahap inti dan menentukan tindak lanjut.", "akhir_tujuan"),
    ("pembagian waktu tiap tahap ditetapkan di RPP dan tidak diubah selama pelajaran berlangsung", False, "Guru dituntut mengatur waktu dan kegiatan secara fleksibel sesuai jalannya pembelajaran.", "fleksibel"),
], sulit="Sedang")
soal("LT8", 5, "Sebuah tim guru sudah sepakat memakai strategi berbasis penyelidikan untuk satu semester. Kini mereka menyusun urutan langkah, bahan, dan kriteria penyelesaian untuk setiap pertemuan. Kegiatan ini disebut ...", "C", [
    ("desain pembelajaran", True, "Desain menetapkan cetak biru, bahan, urutan langkah, dan kriteria penyelesaian sesudah strategi ditetapkan.", "rumah"),
    ("pendekatan pembelajaran", False, "Pendekatan adalah sudut pandang yang mendahului strategi, bukan penyusunan rincian sesudahnya.", "pendekatan"),
    ("model pembelajaran", False, "Model adalah pola umum yang membingkai hierarki; rincian langkah sesudah strategi dipilih disebut desain.", "joyce"),
    ("taktik pembelajaran", False, "Taktik adalah gaya pribadi seorang guru, bukan rancangan bersama sebuah tim.", "taktik"),
], sulit="Sedang")

# ── Whole-chapter checks.
refs = [s["ref"] for s in S]
cek(len(refs) == len(set(refs)))
cek({p["no"] for p in PELAJARAN} == {s["pel"] for s in S}, "every lesson has questions")
PRE = [s for s in S if s["guna"] == PA]
POST = [s for s in S if s["guna"] == PB]
LAT = [s for s in S if not s["guna"]]
cek(len(PRE) == 4 and len(POST) == 8 and 1 <= len(LAT) <= 10, "4 Pemetaan awal, 8 Uji penguasaan, a few Latihan")
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
SITUASI = [s for s in S if re.match(r"(Seorang|Sebuah|Dua|Di awal|Pada akhir)", s["tanya"])]
cek(len(SITUASI) >= 15 and all(s in SITUASI for s in POST if s["ref"] != "PA4"), f"{len(SITUASI)} situation stems")
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
    baris = ["# [UJI INTERNAL] Strategi Pembelajaran, Bab 1: jejak halaman", "",
             "Generated by strategi_pembelajaran_bab1.py. Pages are pages of the Bab 1 scan (the typed manuscript, "
             "22 pages); ii and vi are pages of the front-matter scan. Internal demo only (D-070(e)).", ""]
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
    tulis(os.path.join(here, "StrategiPembelajaran-Bab1.xlsx"))
    tulis_jejak(os.path.join(here, "StrategiPembelajaran-Bab1-jejak.md"))
    halaman = sum(len(JUDUL_BAGIAN.findall(p["isi"])) for p in PELAJARAN)
    print(f"StrategiPembelajaran-Bab1.xlsx: lessons {len(PELAJARAN)} ({halaman} pages), questions {len(S)} "
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
