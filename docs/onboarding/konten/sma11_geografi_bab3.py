# SMA Kelas XI, Geografi, Bab 3 "Lingkungan dan Kependudukan", as a PINTAR lesson workbook in the
# D-007 template (sheets Kursus, Bab, Pelajaran, Soal, Pilihan; the column contract is KOLOM in
# src/lib/unggah-kontrak.ts). Built the way Bab 1 and Bab 2 were (LANA-10, LANA-11, passed).
#
# Source: the student book "Geografi untuk SMA/MA Kelas XI (Edisi Revisi)" (Budi Handoyo, Nisa
# Maulia; Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi, 2024), Bab III, pp. 137-194.
# The book has no answer keys, so every key here is ours, and every question is answerable from its
# text.
#
# Every fact is traced, as in Bab 1 and 2:
#   - FAKTA holds the chapter's facts, each with its page and a quotation from the book;
#   - every option names the fact it rests on (a distractor is a true fact that answers a
#     different question), and the generator checks the option's content words against that
#     fact's quotation;
#   - what can be computed is asserted: the book's three growth formulas (p. 161-162), which the
#     worked examples and two questions use with fresh numbers; the IKLH rise; the regional shares
#     and the age groups adding up to 100%; the sex ratio of 102; the transmigration totals;
#   - classifications are checked against models built from the book's own lists: producers,
#     consumers and decomposers; biotic, abiotic and social-cultural components; the three
#     population pyramids; the ways of collecting population data.
# With `--kutipan <text file of the book>` every quotation is also checked against the book's text.
#
# Text lessons only (D-050): what a figure or table shows is put into words, one fact per line. The
# workbook's "Kode miskonsepsi" column stays empty; the proposed codes go to
# SMA11-Geografi-Bab3-miskonsepsi.csv.
#
# Run: python3 docs/onboarding/konten/sma11_geografi_bab3.py [--kutipan book.txt]
import csv
import os
import re
import sys
from fractions import Fraction

from openpyxl import Workbook
from openpyxl.styles import Alignment, Font

CEK = [0]


def cek(syarat, pesan=""):
    """An assertion that is counted, so the hand-off can say how many passed."""
    assert syarat, pesan
    CEK[0] += 1


def norm(teks):
    """Lower case, the fi/fl ligatures as the PDF extracts them ("isik", "proil"), and only letters
    and digits, so a quotation can be found in the extracted text."""
    teks = teks.lower().replace("ﬁ", "i").replace("ﬂ", "l").replace("fi", "i").replace("fl", "l")
    return re.sub(r"[^0-9a-z]", "", teks)


FAKTA = {}


def fakta(id_, hal, kutipan):
    cek(id_ not in FAKTA, id_)
    FAKTA[id_] = (hal, kutipan)


# A.1 Lingkungan, ekosistem, etika (pp. 140-146)
fakta("lingkungan_def", 140, "Lingkungan hidup adalah kesatuan ruang dengan segala benda, daya, keadaan, dan makhluk hidup termasuk manusia dan perilakunya.")
fakta("ekologi", 141, "Ilmu yang mempelajari lingkungan disebut ekologi, ilmu antara makhluk hidup dan lingkungan.")
fakta("etika", 141, "Etika lingkungan merupakan nilai-nilai keseimbangan dalam kehidupan manusia dalam interaksi terhadap lingkungan hidupnya, yang terdiri atas aspek abiotik, biotik, dan budaya")
fakta("jenis_lingkungan", 141, "Lingkungan hidup dibagi menjadi beberapa bagian, yaitu lingkungan biotik, abiotik, dan sosial budaya.")
fakta("biotik", 141, "Unsur biotik atau hayati adalah unsur lingkungan hidup yang terdiri dari manusia, hewan, tumbuhan, dan organisme kecil yang tidak terlihat.")
fakta("produsen", 142, "Produsen adalah makhluk hidup yang mampu mengubah zat anorganik menjadi zat organik.")
fakta("produsen_contoh", 142, "tumbuhan yang berklorofil dengan cara fotosintesis, seperti tumbuhan hijau, alga, dan lumut.")
fakta("konsumen", 142, "Konsumen adalah organisme yang tidak dapat membuat makanannya sendiri dan bergantung kepada organisme lain, seperti manusia dan hewan.")
fakta("pengurai", 142, "Pengurai merupakan organisme yang mendapatkan energi dari menguraikan bahan organik dari organisme mati, seperti bakteri, jamur, dan cacing tanah.")
fakta("abiotik", 142, "Contoh lingkungan abiotik adalah air, tanah, udara, cahaya matahari, kelembapan udara, suhu, dan iklim.")
fakta("iklim_def", 143, "Iklim adalah keadaan rata-rata cuaca di wilayah yang sangat luas dalam jangka waktu yang lama.")
fakta("sosial", 144, "Lingkungan sosial merupakan lingkungan antarmanusia atau antarkelompok yang secara langsung maupun tidak langsung memengaruhi individu")
fakta("budaya", 144, "lingkungan budaya adalah benda-benda hasil daya cipta manusia, seperti bangunan, karya seni, sistem kepercayaan, dan tatanan kelembagaan sosial.")
fakta("alami", 145, "Lingkungan alami terdiri dari komponen biotik, abiotik, organisme kecil, dan semua kondisi yang berfungsi secara dinamis tanpa campur tangan manusia.")
fakta("alami_air_darat", 145, "Lingkungan hidup air terdiri atas danau, laut, rawa, dan sungai, sedangkan lingkungan hidup darat terdiri atas bukit, gunung, hutan, lembah, dan padang rumput.")
fakta("buatan", 146, "Lingkungan buatan adalah lingkungan yang dibuat oleh manusia secara sadar dengan memanfaatkan teknologi")
fakta("buatan_contoh", 146, "Contoh lingkungan buatan termasuk jalan, sekolah, taman, dan kawasan industri.")
# A.2-A.3 Manfaat dan kualitas lingkungan (pp. 147-151)
fakta("mikroorganisme", 147, "Mikroorganisme diperlukan untuk menguraikan sisa-sisa makhluk hidup yang sudah mati. Sisa-sisa tersebut diproses oleh mikroorganisme menjadi tanah yang subur.")
fakta("penyedia_sda", 147, "Contoh sumber daya alam di lingkungan hidup adalah gas alam dan minyak bumi.")
fakta("oksigen", 147, "Setiap makhluk hidup membutuhkan oksigen untuk bernapas.")
fakta("penyedia_tanah", 147, "Bagi tumbuhan, tanah berfungsi sebagai tempat hidup. Bagi manusia, tanah berfungsi sebagai tempat berkebun, berladang, bahkan mendirikan rumah.")
fakta("daya_dukung", 148, "Daya dukung lingkungan adalah ukuran kemampuan suatu lingkungan untuk mendukung kelompok atau populasi dari berbagai jenis makhluk hidup tertentu untuk hidup dalam lingkungan tertentu.")
fakta("iklh", 149, "Dasar penilaian IKLH di Indonesia menggunakan tiga indikator utama, yaitu Indeks Kualitas Air (IKA), Indeks Kualitas Udara (IKU), dan Kualitas Lahan (IKL)")
fakta("iklh_2020", 149, "Indeks Kualitas Lingkungan Hidup (IKLH) Indonesia meningkat sebesar 3,72 poin, dari 66,55 pada tahun 2019 menjadi 70,27 pada tahun 2020. IKLH pada tahun 2020 telah melampaui target yang diamanatkan di Rencana Pembangunan Jangka Menengah Nasional (RPJMN) sebesar 68,71")
fakta("faktor_alam", 150, "Iklim merupakan salah satu faktor yang memengaruhi aktivitas manusia di lingkungannya.")
fakta("erosi", 151, "Erosi merupakan salah satu faktor yang dapat menurunkan daya dukung lingkungan.")
fakta("gunung_api", 151, "Ada kalanya aktivitas gunung api mengeluarkan gas yang berbahaya bagi lingkungan sekitar.")
fakta("iptek", 151, "Masyarakat yang menguasai ilmu pengetahuan dan teknologi akan mampu merespons dan meningkatkan kualitas lingkungan.")
fakta("tradisi", 151, "Pada umumnya, masyarakat memiliki nilai-nilai tradisi dalam menjaga kualitas lingkungan. Misal, apabila seorang anggota masyarakat menebang satu pohon, mereka harus mengganti 10 pohon serupa.")
# A.4 Masalah lingkungan dan upaya (pp. 152-158)
fakta("gw_dampak", 152, "Peningkatan suhu ini dapat menyebabkan lapisan es di kutub mencair dan permukaan air laut naik.")
fakta("gw_musim", 152, "pemanasan global juga mengubah pola alami musim dan curah hujan hingga perubahan cuaca yang berdampak pada produksi pertanian dan kehutanan.")
fakta("cfc", 152, "Salah satu penyebab penipisan lapisan ozon adalah polusi gas klorin dan bromida yang ditemukan di Chloro Fluoro Carbon (CFC).")
fakta("udara", 153, "Pencemaran udara disebabkan oleh pembakaran bahan bakar fosil")
fakta("hujan_asam", 153, "Air hujan tersebut memiliki derajat tingkat keasaman (pH) lebih kecil dari 5,6 dan mengandung sulfur dioksida dan oksida nitrogen.")
fakta("air", 154, "Pencemaran air seringkali terjadi sebagai dampak dari industri, permukiman, dan penggunaan teknologi yang kurang ramah lingkungan.")
fakta("citarum", 154, "Contoh pencemaran air terjadi di Sungai Citarum yang membentang dari Kabupaten Bandung hingga Kabupaten Bekasi pada tahun 2018.")
fakta("laut_faktor", 155, "Faktor alami bersumber dari alam, seperti letusan gunung berapi di dasar laut yang menghasilkan gas-gas beracun, sedangkan faktor nonalami bersumber dari aktivitas manusia di perairan laut, seperti membuang sampah sembarangan")
fakta("tanah_cemar", 155, "Pencemaran tanah terjadi akibat penggunaan bahan pestisida atau bahan industri lainnya yang tidak mudah terurai, kontaminasi logam berat")
fakta("upaya_gw", 157, "Upaya untuk mengatasi pemanasan global adalah meningkatkan tutupan hutan dengan menggunakan tanaman penutup tanah untuk mengurangi jumlah CO 2 di atmosfer.")
fakta("upaya_udara", 157, "Upaya pelestarian udara antara lain dengan penanaman pohon, pengurangan emisi pembuangan gas sisa pembakaran, dan penghindaran penggunaan bahan kimia yang dapat merusak lapisan ozon di atmosfer.")
fakta("upaya_air", 157, "Cara mengatasi masalah lingkungan air adalah dengan pembuangan limbah industri, limbah kimia dan radioaktif yang tepat, dan meminimalkan polusi plastik.")
fakta("upaya_laut", 157, "Upaya mengatasi permasalahan laut dan pantai dapat dilakukan dengan cara melestarikan hutan bakau di sekitar pantai dan terumbu karang, dan menghindari penggunaan bahan peledak maupun penggunaan pukat harimau saat melakukan penangkapan ikan.")
fakta("upaya_tanah", 158, "Upaya pelestarian tanah yaitu dengan melakukan reboisasi atau penanaman kembali hutan-hutan yang gundul, dan pembuatan terasering atau sengkedan pada lahan yang miring.")
# B.1 Dinamika kependudukan (pp. 158-166)
fakta("penduduk_def", 158, "Penduduk adalah seseorang/sekelompok orang yang bertempat tinggal di suatu daerah selama enam bulan atau lebih, atau kurang dari enam bulan dan bertujuan untuk menetap.")
fakta("pbb", 159, "Proyeksi median terbarunya adalah perkiraan populasi 9,7 miliar pada tahun 2050 dan 10,9 miliar pada tahun 2100.")
fakta("laju_sedang", 160, "Indonesia mengalami laju pertumbuhan penduduk sebesar 1.49% atau sekitar empat juta jiwa per tahun dan termasuk dalam kategori sedang, karena tumbuh berkisar 1-2% per tahun.")
fakta("alami_rumus", 161, "Pertumbuhan Penduduk Alami P = L - M Keterangan: P : Pertumbuhan penduduk L : Lahir M: Mati")
fakta("imigrasi", 161, "Imigrasi adalah perpindahan penduduk yang berasal dari luar daerah dengan bertujuan menetap. Sementara itu, emigrasi adalah perpindahan penduduk keluar daerah dengan tujuan untuk menetap.")
fakta("nonalami_rumus", 162, "Pertumbuhan Penduduk Non Alami P = I - E")
fakta("total_rumus", 162, "Pertumbuhan Penduduk Total P = (L-M) + (I-E)")
fakta("sensus_tujuan", 163, "tujuan sensus penduduk Indonesia adalah menyediakan data tentang jumlah, komposisi, distribusi, dan karakteristik penduduk Indonesia.")
fakta("de_facto", 163, "Sensus de facto adalah proses pencacahan penduduk yang dihasilkan terhadap semua orang yang ditemui oleh petugas ketika dilaksanakan sensus")
fakta("de_jure", 163, "Sensus de jure adalah proses pencacahan penduduk yang dilaksanakan terhadap semua orang yang benar-benar tercatat dan bertempat tinggal di suatu wilayah, umumnya sesuai dengan Kartu Tanda Penduduk (KTP)")
fakta("canvasser", 163, "Metode canvasser adalah pelaksanaan sensus dengan cara petugas mendatangi tempat tinggal penduduk dan mengisi daftar pertanyaan.")
fakta("householder", 164, "Metode householder adalah pelaksanaan sensus dengan pengisian daftar pertanyaan dilakukan oleh penduduk sendiri.")
fakta("sensus_7", 164, "Sensus penduduk sudah dilaksanakan 7x di Indonesia, yaitu pada tahun 1961, 1971, 1980, 1990, 2000, 2010, dan 2020.")
fakta("registrasi", 164, "Registrasi penduduk merupakan pencatatan tentang identitas atau ciri-ciri status dan kondisi penduduk yang dilaksanakan secara terus menerus oleh pemerintah mulai tingkat terendah yaitu desa atau kelurahan.")
fakta("survei", 165, "Survei penduduk adalah salah satu metode menjaring data penduduk dalam beberapa peristiwa demografi atau ekonomi dengan tidak menghitung seluruh responden yang ada di suatu negara, melainkan dengan cara penarikan sampel")
# B.2-B.3 SDM dan kuantitas penduduk (pp. 166-176)
fakta("sdm_makro", 167, "secara makro, SDM adalah penduduk suatu negara yang sudah memasuki usia angkatan kerja, baik yang belum bekerja maupun yang sudah bekerja.")
fakta("sdm_mikro", 166, "Secara mikro, SDM adalah individu yang bekerja dan menjadi anggota suatu perusahaan atau institusi")
fakta("kuantitas_kualitas", 167, "Kuantitas menyangkut jumlah sumber daya manusia, sedangkan kualitas merupakan mutu dari sumber daya manusia yang menyangkut kemampuan fisik dan non fisik.")
fakta("fisik_nonfisik", 167, "Kualitas SDM pada aspek fisik ditinjau dari kesehatan dan gizi masyarakat. Sedangkan, pada aspek nonfisik berupa kecerdasan dan mental.")
fakta("kepadatan", 168, "Luas daratan di Indonesia adalah sebesar 1,92 juta kilometer persegi dengan jumlah kepadatan penduduk Indonesia sebanyak 141 jiwa per kilometer persegi.")
fakta("kepadatan_sensus", 168, "Pada sensus penduduk tahun 2010 yaitu sebanyak 124 jiwa per kilometer persegi, sedangkan pada hasil sensus penduduk tahun 2020 mencapai 107 jiwa per kilometer persegi")
fakta("jawa", 169, "pulau Jawa adalah rumah bagi 151,59 juta jiwa atau 56,10% dari penduduk Indonesia.")
fakta("jawa_luas", 169, "Meskipun luas wilayah geografisnya hanya mencakup sekitar tujuh persen dari seluruh wilayah Indonesia")
fakta("sumatra", 169, "Jumlah penduduk Pulau Sumatra adalah sebanyak 58,56 juta jiwa atau sebesar 21,68% dari penduduk Indonesia.")
fakta("wilayah_lain", 169, "pulau Sulawesi sebesar 7,36%, pulau Kalimantan sebesar 6,15%, dan di wilayah Bali, Nusa Tenggara, Maluku, dan Papua masing masing sebesar 5,54% dan 3,17%.")
fakta("generasi", 169, "Jumlah proporsi Generasi Z adalah 27,94% dari total populasi penduduk Indonesia, dan Generasi Milenial sebanyak 25,87% dari total populasi penduduk Indonesia.")
fakta("produktif", 170, "Pada tahun 1971, proporsi penduduk pada kelompok usia produktif adalah 53,39% dari total penduduk. pada tahun 2020 terjadi peningkatan menjadi 70,72%.")
fakta("bonus", 170, "Proporsi persentase penduduk pada usia produktif yang lebih tinggi dibandingkan penduduk pada usia tidak produktif tersebut menunjukkan bahwa Indonesia berada dalam masa era bonus demografi.")
fakta("lansia", 171, "proporsi penduduk lanjut usia di Indonesia meningkat dari 7,59% pada tahun 2010 menjadi 9,87% pada tahun 2020.")
fakta("ageing", 171, "era ageing population yang ditandai dengan jumlah presentase penduduk usia 60 tahun ke atas mencapai lebih dari 10%.")
fakta("rasio", 171, "jumlah penduduk laki-laki di Indonesia sebanyak 136,66 juta jiwa, atau 50,58% dari penduduk Indonesia. Sementara itu, jumlah penduduk perempuan sebanyak 133,54 juta jiwa")
fakta("rasio_102", 172, "rasio jenis kelamin penduduk Indonesia adalah 102. Artinya, pada tahun 2020 terdapat 102 laki-laki untuk setiap 100 perempuan di Indonesia")
fakta("rasio_umur", 172, "Rasio jenis kelamin tertinggi pada kelompok usia 0–9 tahun adalah sebesar 107 dan terendah pada kelompok usia 75 tahun ke atas adalah 79.")
fakta("rasio_provinsi", 172, "terdapat dua provinsi di Indonesia yang jumlah penduduk laki-lakinya lebih sedikit dibandingkan penduduk perempuan, yaitu Sulawesi Selatan dan Daerah Istimewa Yogyakarta.")
fakta("piramida_muda", 173, "Dasar lebar menunjukkan tingkat kelahiran yang tinggi. Banyak bayi yang lahir setiap tahun.")
fakta("piramida_muda_negara", 173, "Piramida ini banyak dijumpai di negara berkembang dengan tingkat kelahiran (fertilitas) yang tinggi dan kemajuan kesehatan yang belum merata, seperti Nigeria, Uganda, dan sebagian besar negara di Afrika Sub-Sahara.")
fakta("piramida_tua", 174, "Dasar sempit menunjukkan tingkat kelahiran yang rendah. Sedikit bayi yang lahir setiap tahun. Puncak lebar menunjukkan bahwa banyak orang hidup sampai usia tua karena tingkat kematian rendah dan harapan hidup tinggi.")
fakta("piramida_tua_negara", 174, "Piramida jenis ini sering ditemukan di negara maju dengan tingkat fertilitas rendah dan sistem kesehatan yang baik, seperti Jepang, Jerman, dan Italia.")
fakta("piramida_stasioner", 174, "Dasar dan puncak relatif seimbang menunjukkan tingkat kelahiran dan kematian yang relatif seimbang.")
fakta("piramida_stasioner_negara", 174, "seperti Amerika Serikat, Australia, dan beberapa negara di Eropa Barat.")
fakta("piramida_2020", 175, "Usia 0-14 tahun sekitar 23,33% Usia 15-64 tahun sekitar 70,72% Usia 65 tahun ke atas sekitar 5,95%")
fakta("piramida_transisi", 175, "Hasil piramida penduduk Indonesia tersebut menunjukkan transisi demografi dari piramida ekspansif menuju piramida yang lebih stasioner")
# B.4-B.5 Kualitas dan pengembangan SDM (pp. 176-180)
fakta("ipm", 176, "Indikator kualitas SDM dapat dilihat pada aspek kesehatan, pendidikan, dan kesejahteraan penduduk. Kualitas penduduk biasa diistilahkan dalam Indeks Pembangunan Manusia (IPM).")
fakta("mulyadi_miskin", 176, "Peningkatan kualitas bagi penduduk miskin dicapai dengan memberikan keterampilan praktis, mendorong sikap kerja yang produktif, dan mendorong semangat kemandirian.")
fakta("mulyadi_kb", 176, "Mengurangi laju pertumbuhan penduduk dengan meningkatkan pelaksanaan gerakan keluarga berencana dan mendistribusikan kepadatan penduduk melalui transmigrasi.")
fakta("mulyadi_kesehatan", 176, "Pada aspek pembangunan kesehatan dilakukan melalui penyebaran budaya hidup sehat dan perluasan jangkauan pelayanan kesehatan masyarakat, terutama bagi penduduk di daerah terpencil.")
fakta("ahh", 177, "Angka Harapan Hidup (AHH) adalah jumlah rata-rata perkiraan tahun yang dapat ditempuh seseorang selama hidupnya.")
fakta("pendidikan_manfaat", 177, "Menciptakan tenaga kerja yang lebih produktif karena bertambahnya pengetahuan dan keahlian.")
fakta("pengembangan_def", 179, "Pengembangan sumber daya manusia adalah suatu proses peningkatan pengetahuan, keterampilan, dan kapasitas dari semua penduduk suatu masyarakat.")
fakta("fleksibilitas", 179, "Dengan beragamnya keterampilan yang dimiliki oleh pegawai menjadikannya lebih fleksibel dan memudahkannya untuk beradaptasi dengan kemungkinan perubahan lingkungan organisasi.")
fakta("turn_over", 180, "Turn over adalah proses pergantian pegawai pada sebuah perusahaan, baik atas inisiatif pribadi atau keputusan pimpinan.")
# B.6-B.7 Masalah dan upaya (pp. 180-184)
fakta("jumlah_besar", 180, "Permasalahan utama jumlah penduduk yang besar adalah sulitnya penjaminan terpenuhinya kebutuhan hidup rakyat")
fakta("tabel31", 180, "1961 – 1971 2,10% 1971 – 1980 2,31% 1980 – 1990 1,98% 1990 – 2000 1,44% 2000 – 2010 1,49% 2010 – 2020 1,25%")
fakta("negara_maju", 181, "negara maju seperti Belanda yang laju pertumbuhannya hanya 0,3%, Inggris 0,1%, dan Finlandia 0,2%.")
fakta("tidak_merata", 181, "Tidak meratanya penduduk yang memusat di Pulau Jawa menyebabkan luas lahan pertanian semakin sempit karena dijadikan lahan pemukiman dan industri.")
fakta("kb", 182, "pertumbuhan penduduk harus ditekan semaksimal mungkin, salah satunya melalui program Keluarga Berencana.")
fakta("transmigrasi", 183, "Transmigrasi bertujuan meningkatkan kesejahteraan, pemerataan pembangunan, memperluas lapangan kerja, serta memperkokoh persatuan dan kesatuan bangsa.")
fakta("transmigran", 183, "sebanyak 637.943 kepala keluarga, yang terdiri dari 251.755 kepala keluarga dari transmigran umum dan 386.188 kepala keluarga dari transmigrasi swakarsa.")
fakta("pertanian", 184, "Peningkatan hasil pertanian ini dilakukan melalui intensifikasi, ekstensifikasi, dan diversifikasi.")
# For the book-error record only (not used in lessons or questions)
fakta("fotosintesis_matahari", 143, "Air mampu menyerap cahaya sehingga proses fotosintesis dapat terjadi di sekitar permukaan matahari.")

GAMBAR = set()   # every quotation here is in the book's text layer

# ── What can be computed ──
cek(Fraction(7027, 100) - Fraction(6655, 100) == Fraction(372, 100) and Fraction(7027, 100) > Fraction(6871, 100))     # IKLH, p. 149
cek(Fraction(7027 - 6871, 100) == Fraction(156, 100) and Fraction(6871 - 6655, 100) == Fraction(216, 100))
cek(len([1961, 1971, 1980, 1990, 2000, 2010, 2020]) == 7)                                                          # p. 164
BAGIAN = {"Jawa": Fraction(5610, 100), "Sumatra": Fraction(2168, 100), "Sulawesi": Fraction(736, 100), "Kalimantan": Fraction(615, 100),
          "Bali-Nusa Tenggara": Fraction(554, 100), "Maluku-Papua": Fraction(317, 100)}
cek(sum(BAGIAN.values()) == 100)                                                                                   # p. 169
cek(round(15159 / 27020 * 100, 1) == 56.1 and round(5856 / 27020 * 100, 1) == 21.7)                              # 151,59 and 58,56 of 270,2 juta
cek(Fraction(2333 + 7072 + 595, 100) == 100)                                                                       # p. 175
cek(Fraction(13666 + 13354, 100) == Fraction(27020, 100) and round(13666 / 13354 * 100) == 102
    and round(13666 / 27020 * 100, 2) == 50.58)                                                                     # pp. 171-172
cek(251755 + 386188 == 637943 and round((386188 - 251755) / 251755 * 100, 2) == 53.40)                            # p. 183
cek(round(27020 / 192) == 141)                                                                                     # 270,2 juta : 1,92 juta km², p. 168
TABEL31 = {"1961–1971": Fraction(210, 100), "1971–1980": Fraction(231, 100), "1980–1990": Fraction(198, 100),
           "1990–2000": Fraction(144, 100), "2000–2010": Fraction(149, 100), "2010–2020": Fraction(125, 100)}
cek(max(TABEL31, key=TABEL31.get) == "1971–1980" and min(TABEL31, key=TABEL31.get) == "2010–2020")
# BOOK INCONSISTENCIES (checked here, kept out of lessons and questions):
# p. 181 says the rate has fallen "sejak tahun 1971", but 2000-2010 (1,49%) is above 1990-2000 (1,44%);
cek(TABEL31["2000–2010"] > TABEL31["1990–2000"])
# p. 168 calls 124 (2010) to 107 (2020) jiwa/km² an increase, and 107 disagrees with the 141 above;
cek(107 < 124 and 107 != 141)
# p. 160 gives 1,49% as about 4 juta a year and the target 1,19% as 1-2 juta a year, which cannot
# both hold for one population (1,19/1,49 of 4 juta is over 3 juta).
cek(Fraction(119, 149) * 4 > 3)


def alami(l, m):
    return l - m


def nonalami(i, e):
    return i - e


def total(l, m, i, e):
    """The book's formula (p. 162): P = (L - M) + (I - E)."""
    return alami(l, m) + nonalami(i, e)


def rasio(laki, perempuan):
    """Men for every 100 women, as the book reads 102 (p. 172)."""
    return round(Fraction(laki, perempuan) * 100)


cek(rasio(13666, 13354) == 102)

# Classifications from the book's own lists.
BIOTIK = {"produsen_contoh": ["tumbuhan hijau", "alga", "lumut"], "konsumen": ["manusia", "hewan"], "pengurai": ["bakteri", "jamur", "cacing tanah"]}
cek(all(norm(x) in norm(FAKTA[k][1]) for k, v in BIOTIK.items() for x in v))
KOMPONEN = {"abiotik": ["air", "tanah", "udara", "cahaya matahari"], "budaya": ["bangunan", "karya seni"]}
cek(all(norm(x) in norm(FAKTA[k][1]) for k, v in KOMPONEN.items() for x in v))
PIRAMIDA = {"muda": ("lebar", "sempit", ["Nigeria", "Uganda"]), "tua": ("sempit", "lebar", ["Jepang", "Jerman", "Italia"]),
            "stasioner": ("seimbang", "seimbang", ["Amerika Serikat", "Australia"])}
cek(all(norm(n) in norm(FAKTA[f"piramida_{k}_negara"][1]) for k, (_, _, v) in PIRAMIDA.items() for n in v))
DATA_PENDUDUK = {"sensus": ["de facto", "de jure", "canvasser", "householder"], "registrasi": [], "survei": []}

SUMBER = ("_Diadaptasi dari Geografi untuk SMA/MA Kelas XI (Edisi Revisi), Budi Handoyo dan Nisa Maulia, Kementerian "
          "Pendidikan, Kebudayaan, Riset, dan Teknologi, 2024, Bab III._")

KURSUS = {
    "Judul kursus*": "Geografi Kelas XI · Bab 3: Lingkungan dan Kependudukan",
    "Mata pelajaran*": "Geografi",
    "Jenjang*": "SMA",
    "Kelas*": "Kelas XI",
    "Konteks": "Akademik",
}

BAB = [(1, "Lingkungan dan Kependudukan")]

CONTOH_TOTAL = (2400, 900, 350, 600)          # the lesson's worked example
cek(total(*CONTOH_TOTAL) == 1250 and alami(2400, 900) == 1500 and nonalami(350, 600) == -250)

PELAJARAN = [
    dict(no=1, judul="Lingkungan Hidup dan Ekosistem",
         ringkasan="Lingkungan hidup terdiri atas unsur biotik, abiotik, dan sosial budaya yang saling memengaruhi, dan dapat berupa lingkungan alami atau buatan.",
         tujuan="Kalian dapat menjelaskan pengertian lingkungan hidup, ekosistem, dan etika lingkungan serta membedakan jenis-jenis lingkungan hidup.",
         bloom="Memahami",
         isi=f"""## Lingkungan, ekologi, dan etika

**Lingkungan hidup** adalah kesatuan ruang dengan segala benda, daya, keadaan, dan makhluk hidup, termasuk manusia dan perilakunya (UU No. 32 Tahun 2009).

- **Ekologi** adalah ilmu yang mempelajari lingkungan, yaitu hubungan antara makhluk hidup dan lingkungannya.
- **Ekosistem** adalah komunitas tumbuhan dan hewan bersama unsur tak hidup di lingkungannya.
- **Etika lingkungan** adalah nilai-nilai keseimbangan dalam interaksi manusia dengan lingkungan hidupnya, yang terdiri atas aspek abiotik, biotik, dan budaya.

## Lingkungan biotik

Lingkungan hidup dibagi menjadi lingkungan **biotik**, **abiotik**, dan **sosial budaya**.

Unsur biotik (hayati) terdiri atas manusia, hewan, tumbuhan, dan organisme kecil. Menurut perannya:
- **Produsen**: mengubah zat anorganik menjadi zat organik melalui fotosintesis, seperti tumbuhan hijau, alga, dan lumut.
- **Konsumen**: tidak dapat membuat makanannya sendiri dan bergantung pada organisme lain, seperti manusia dan hewan.
- **Pengurai**: mendapat energi dengan menguraikan bahan organik dari organisme mati, seperti bakteri, jamur, dan cacing tanah.

## Lingkungan abiotik dan sosial budaya

**Abiotik** adalah unsur benda mati yang ikut memengaruhi kehidupan: air, tanah, udara, cahaya matahari, kelembapan udara, suhu, dan iklim. Iklim adalah keadaan rata-rata cuaca di wilayah yang sangat luas dalam jangka waktu yang lama.

**Sosial budaya:**
- lingkungan sosial adalah lingkungan antarmanusia atau antarkelompok, termasuk norma, aturan, dan adat istiadat;
- lingkungan budaya adalah hasil daya cipta manusia, seperti bangunan, karya seni, sistem kepercayaan, dan kelembagaan sosial.

Ketiga unsur itu saling memengaruhi, dan manusia adalah agen perubahan yang dominan di alam.

## Lingkungan alami dan buatan

- **Lingkungan alami** berfungsi secara dinamis tanpa campur tangan manusia. Lingkungan hidup air: danau, laut, rawa, dan sungai. Lingkungan hidup darat: bukit, gunung, hutan, lembah, dan padang rumput.
- **Lingkungan buatan** dibuat manusia secara sadar dengan teknologi untuk memenuhi kebutuhannya, contohnya jalan, sekolah, taman, dan kawasan industri.

**Coba pikirkan:** lingkungan apa saja di sekitar sekolah kalian yang termasuk lingkungan buatan?

{SUMBER}"""),
    dict(no=2, judul="Manfaat dan Kualitas Lingkungan",
         ringkasan="Lingkungan menjadi tempat hidup dan penyedia kebutuhan; kualitasnya diukur, antara lain, dengan Indeks Kualitas Lingkungan Hidup (IKLH) dan dipengaruhi faktor alam serta sosial budaya.",
         tujuan="Kalian dapat menjelaskan manfaat lingkungan, pengertian daya dukung dan IKLH, serta faktor-faktor yang memengaruhi kualitas lingkungan.",
         bloom="Menganalisis",
         isi=f"""## Manfaat lingkungan

Manfaat unsur lingkungan hidup bagi manusia:
- tempat hidup dan tempat berinteraksi sosial;
- penghasil pangan, yaitu makanan dan air;
- penyedia sumber daya alam, misalnya gas alam dan minyak bumi;
- penyedia mikroorganisme, yang menguraikan sisa makhluk hidup yang mati menjadi tanah yang subur;
- penyedia oksigen untuk bernapas;
- penyedia tanah: tempat hidup tumbuhan, dan tempat manusia berkebun, berladang, dan mendirikan rumah.

## Kualitas dan daya dukung lingkungan

Kualitas lingkungan ditandai dengan suasana yang membuat orang nyaman tinggal di tempatnya sendiri dan dapat memenuhi berbagai kebutuhan hidupnya.

Untuk menjaganya, **daya dukung lingkungan** harus diperhatikan. Daya dukung lingkungan adalah ukuran kemampuan suatu lingkungan untuk mendukung populasi makhluk hidup tertentu, misalnya sawah, hutan, sungai, kota, atau kawasan industri.

## Indeks Kualitas Lingkungan Hidup

Kualitas lingkungan dapat diukur dengan **IKLH**. Di Indonesia, IKLH memakai tiga indikator utama:
- Indeks Kualitas Air (IKA);
- Indeks Kualitas Udara (IKU);
- Indeks Kualitas Lahan (IKL).

Menurut KLHK (2021), IKLH Indonesia naik dari 66,55 pada tahun 2019 menjadi 70,27 pada tahun 2020, yaitu naik 70,27 − 66,55 = **3,72 poin**. Nilai 70,27 itu melampaui target RPJMN sebesar 68,71.

## Faktor yang memengaruhi kualitas lingkungan

Kualitas lingkungan dapat turun dan membaik kembali. Faktor-faktornya:

**Faktor alam:**
- iklim dan perubahan cuaca yang ekstrem dapat menghambat aktivitas manusia;
- kesuburan tanah menaikkan nilai daya dukung daerah agraris;
- erosi dapat menurunkan daya dukung lingkungan;
- aktivitas gunung api dapat mengeluarkan gas berbahaya.

**Faktor sosial budaya:**
- penguasaan ilmu pengetahuan dan teknologi;
- tradisi masyarakat setempat, misalnya: menebang satu pohon harus diganti 10 pohon serupa;
- cara berpikir masyarakat: memandang lingkungan sebagai sesuatu yang dapat dieksploitasi terus-menerus berisiko merusak lingkungan.

{SUMBER}"""),
    dict(no=3, judul="Masalah Lingkungan dan Upaya Mengatasinya",
         ringkasan="Pemanasan global, pencemaran udara, air, laut, dan tanah, serta pertambahan penduduk adalah masalah lingkungan yang diatasi dengan upaya pelestarian yang sesuai.",
         tujuan="Kalian dapat menganalisis masalah-masalah lingkungan beserta penyebabnya dan upaya mengatasinya.",
         bloom="Menganalisis",
         isi=f"""## Pemanasan global

**Pemanasan global** terjadi akibat efek gas rumah kaca, sehingga suhu bumi naik.

Akibatnya:
- lapisan es di kutub mencair dan permukaan air laut naik;
- pola musim dan curah hujan berubah, sehingga produksi pertanian dan kehutanan terganggu;
- kebakaran hutan makin mungkin terjadi karena kemarau yang panjang.

Penipisan lapisan ozon, yang melindungi bumi dari radiasi berbahaya, salah satunya disebabkan polusi gas klorin dari CFC (Chloro Fluoro Carbon).

## Pencemaran udara dan air

**Pencemaran udara** disebabkan pembakaran bahan bakar fosil, terutama oleh kendaraan bermotor, industri, dan kebakaran hutan. Pencemaran udara dapat menimbulkan **hujan asam**: air hujan dengan pH lebih kecil dari 5,6 yang mengandung sulfur dioksida dan oksida nitrogen. Hujan asam merusak kesehatan, bangunan, danau, hutan, dan tanaman.

**Pencemaran air** sering terjadi akibat industri, permukiman, dan teknologi yang kurang ramah lingkungan, misalnya logam berat, tumpahan minyak, pestisida, dan deterjen. Contohnya pencemaran Sungai Citarum, dari Kabupaten Bandung sampai Kabupaten Bekasi, pada tahun 2018.

## Pencemaran laut, tanah, dan pengaruh penduduk

**Pantai dan laut.** Kerusakannya disebabkan faktor alami, seperti letusan gunung berapi di dasar laut yang menghasilkan gas beracun, dan faktor nonalami (antropogenik), seperti membuang sampah sembarangan.

**Tanah.** Pencemaran tanah terjadi akibat pestisida dan bahan industri yang tidak mudah terurai, logam berat, pupuk yang berlebihan, dan limbah domestik.

**Penduduk.** Pertambahan penduduk menaikkan kebutuhan lahan bangunan dan konsumsi air, makanan, dan bahan bakar, sehingga memengaruhi daya dukung lingkungan.

## Upaya mengelola lingkungan

- **Pemanasan global:** meningkatkan tutupan hutan dengan tanaman penutup tanah untuk mengurangi CO₂.
- **Udara:** menanam pohon, mengurangi emisi gas sisa pembakaran, dan menghindari bahan kimia perusak ozon.
- **Air:** membuang limbah industri, kimia, dan radioaktif dengan tepat, dan meminimalkan polusi plastik.
- **Laut dan pantai:** melestarikan hutan bakau dan terumbu karang, dan tidak memakai bahan peledak atau pukat harimau.
- **Tanah:** reboisasi hutan yang gundul, dan membuat terasering atau sengkedan di lahan miring untuk menahan erosi.

{SUMBER}"""),
    dict(no=4, judul="Dinamika dan Pertumbuhan Penduduk",
         ringkasan="Jumlah penduduk berubah karena kelahiran, kematian, dan perpindahan; pertumbuhannya dihitung dengan rumus alami, nonalami, dan total, dan datanya dikumpulkan melalui sensus, registrasi, dan survei.",
         tujuan="Kalian dapat menghitung pertumbuhan penduduk dan membedakan cara pengumpulan data kependudukan.",
         bloom="Menerapkan",
         isi=f"""## Penduduk dan pertumbuhannya

**Penduduk** adalah orang yang bertempat tinggal di suatu daerah selama enam bulan atau lebih, atau kurang dari enam bulan tetapi bertujuan menetap.

- **Dunia.** PBB memperkirakan populasi dunia 9,7 miliar pada tahun 2050 dan 10,9 miliar pada tahun 2100. Sejak Perang Dunia Kedua, populasi bertambah satu miliar setiap 12 sampai 15 tahun.
- **Indonesia.** Menurut BPS (2021), pertumbuhan penduduk Indonesia termasuk kategori **sedang**, karena berkisar 1–2% per tahun. Salah satu penyebabnya adalah angka kelahiran yang tinggi dan angka kematian yang rendah.

## Tiga rumus pertumbuhan

- **Pertumbuhan alami:** P = L − M (lahir dikurangi mati).
- **Pertumbuhan nonalami** (karena migrasi): P = I − E. Imigrasi adalah perpindahan penduduk dari luar daerah untuk menetap; emigrasi adalah perpindahan penduduk keluar daerah untuk menetap.
- **Pertumbuhan total:** P = (L − M) + (I − E).

## Contoh menghitung

Dalam setahun, sebuah kabupaten mencatat 2.400 kelahiran, 900 kematian, 350 imigran, dan 600 emigran.

1. Pertumbuhan alami: 2.400 − 900 = 1.500.
2. Pertumbuhan nonalami: 350 − 600 = −250 (lebih banyak yang keluar).
3. Pertumbuhan total: 1.500 + (−250) = **1.250 jiwa**.

Perhatikan tanda negatif: bila emigran lebih banyak daripada imigran, migrasi mengurangi jumlah penduduk.

## Sensus penduduk

Sensus penduduk menyediakan data tentang jumlah, komposisi, distribusi, dan karakteristik penduduk. Di Indonesia, sensus sudah dilaksanakan 7 kali: 1961, 1971, 1980, 1990, 2000, 2010, dan 2020.

Menurut orang yang dicacah:
- **de facto**: semua orang yang ditemui petugas ketika sensus;
- **de jure**: semua orang yang benar-benar tercatat dan tinggal di suatu wilayah, umumnya sesuai KTP.

Menurut cara pengisian:
- **canvasser**: petugas mendatangi tempat tinggal penduduk dan mengisi daftar pertanyaan (datanya lebih lengkap, tetapi lama);
- **householder**: daftar pertanyaan diisi penduduk sendiri (lebih cepat, tetapi kebenaran datanya kurang terjamin).

## Registrasi dan survei

- **Registrasi penduduk** adalah pencatatan identitas dan kondisi penduduk secara terus-menerus oleh pemerintah, mulai dari desa atau kelurahan: kelahiran, kematian, perkawinan, perceraian, dan perpindahan.
- **Survei penduduk** tidak menghitung seluruh penduduk, tetapi menarik sampel yang mewakili. Informasinya lebih terbatas cakupannya, tetapi lebih luas dan mendalam.

{SUMBER}"""),
    dict(no=5, judul="Sumber Daya Manusia dan Komposisi Penduduk",
         ringkasan="Penduduk adalah sumber daya pembangunan; distribusi, komposisi umur, generasi, rasio jenis kelamin, dan bentuk piramida menggambarkan kuantitas penduduk.",
         tujuan="Kalian dapat menjelaskan konsep SDM dan menganalisis distribusi serta komposisi penduduk Indonesia.",
         bloom="Menganalisis",
         isi=f"""## Sumber daya manusia

- **Secara mikro**, SDM adalah individu yang bekerja dan menjadi anggota suatu perusahaan atau institusi.
- **Secara makro**, SDM adalah penduduk suatu negara yang sudah memasuki usia angkatan kerja, baik yang sudah maupun belum bekerja.

**Kuantitas** SDM menyangkut jumlahnya; **kualitas** SDM menyangkut mutunya:
- aspek fisik: kesehatan dan gizi;
- aspek nonfisik: kecerdasan dan mental.

Dalam pembangunan, kualitas lebih dipentingkan daripada kuantitas.

## Distribusi penduduk

Menurut BPS, sebaran penduduk Indonesia tahun 2020:
- Jawa: 151,59 juta jiwa atau 56,10%, padahal luas wilayahnya hanya sekitar tujuh persen dari seluruh Indonesia.
- Sumatra: 58,56 juta jiwa atau 21,68%.
- Sulawesi: 7,36%.
- Kalimantan: 6,15%.
- Bali dan Nusa Tenggara: 5,54%.
- Maluku dan Papua: 3,17%.

Jumlah keenam bagian itu 100%.

## Komposisi umur dan generasi

- Penduduk usia produktif (15–64 tahun) naik dari 53,39% pada tahun 1971 menjadi 70,72% pada tahun 2020. Karena usia produktif jauh lebih banyak daripada usia tidak produktif, Indonesia berada dalam era **bonus demografi**.
- Menurut sensus 2020, Generasi Z sebesar 27,94% dan Generasi Milenial 25,87% dari penduduk.
- Penduduk lanjut usia (60 tahun ke atas) naik dari 7,59% (2010) menjadi 9,87% (2020). Indonesia menuju era **ageing population**, yang ditandai penduduk berusia 60 tahun ke atas lebih dari 10%.

## Rasio jenis kelamin

**Rasio jenis kelamin** adalah banyak laki-laki untuk setiap 100 perempuan.

Sensus 2020: laki-laki 136,66 juta jiwa, perempuan 133,54 juta jiwa.
1. Bagi: 136,66 : 133,54 ≈ 1,02.
2. Kalikan 100: rasionya **102**, artinya ada 102 laki-laki untuk setiap 100 perempuan.

Rasio tertinggi pada usia 0–9 tahun (107) dan terendah pada usia 75 tahun ke atas (79). Hanya dua provinsi yang laki-lakinya lebih sedikit daripada perempuan: Sulawesi Selatan dan DI Yogyakarta.

## Tiga jenis piramida penduduk

- **Piramida muda (ekspansif):** dasar lebar dan puncak sempit; kelahiran dan kematian tinggi; misalnya Nigeria, Uganda, dan sebagian besar Afrika Sub-Sahara.
- **Piramida tua (kontraktif):** dasar sempit dan puncak lebar; kelahiran dan kematian rendah, harapan hidup tinggi; misalnya Jepang, Jerman, dan Italia.
- **Piramida stasioner (stabil):** dasar dan puncak relatif seimbang; misalnya Amerika Serikat, Australia, dan beberapa negara Eropa Barat.

Indonesia tahun 2020 (sekitar 270,2 juta jiwa): usia 0–14 tahun sekitar 23,33%, 15–64 tahun sekitar 70,72%, dan 65 tahun ke atas sekitar 5,95%. Piramidanya sedang bertransisi dari ekspansif menuju lebih stasioner.

{SUMBER}"""),
    dict(no=6, judul="Kualitas dan Pengembangan Sumber Daya Manusia",
         ringkasan="Kualitas penduduk dilihat dari kesehatan, pendidikan, dan kesejahteraan, dan ditingkatkan melalui kebijakan kesehatan, pendidikan, dan pengembangan SDM.",
         tujuan="Kalian dapat menjelaskan indikator kualitas penduduk serta cara meningkatkan dan mengembangkan kualitas SDM.",
         bloom="Memahami",
         isi=f"""## Indikator kualitas penduduk

Kualitas SDM menunjukkan tingkat kesejahteraan penduduk suatu negara. Indikatornya adalah **kesehatan, pendidikan, dan kesejahteraan** penduduk, yang biasa diringkas dalam **Indeks Pembangunan Manusia (IPM)**.

Menurut UU No. 52 Tahun 2009, kualitas penduduk adalah kondisi penduduk dalam aspek fisik dan nonfisik, antara lain derajat kesehatan, pendidikan, pekerjaan, dan produktivitas.

## Kebijakan meningkatkan kualitas

Menurut Mulyadi (2003):
- kesehatan: menyebarkan budaya hidup sehat dan memperluas pelayanan kesehatan, terutama di daerah terpencil;
- pendidikan: diarahkan pada pembangunan ekonomi masa mendatang;
- penduduk miskin: memberi keterampilan praktis, mendorong sikap kerja produktif, dan semangat kemandirian;
- laju pertumbuhan: ditekan dengan keluarga berencana, dan kepadatan disebarkan melalui transmigrasi.

## Kesehatan dan pendidikan

**Kesehatan.** Menurut UU No. 36 Tahun 2009, kesehatan adalah kondisi sehat secara fisik, mental, spiritual, dan sosial yang memungkinkan orang hidup produktif. Kualitas kesehatan dapat dilihat dari **Angka Harapan Hidup (AHH)**, yaitu rata-rata perkiraan tahun yang dapat ditempuh seseorang selama hidupnya.

**Pendidikan.** Manfaatnya bagi pembangunan ekonomi:
- menciptakan tenaga kerja yang lebih produktif;
- kesempatan kerja yang lebih luas;
- kelompok pemimpin yang terdidik;
- program pelatihan yang menurunkan angka buta huruf.

## Pengembangan SDM

**Pengembangan SDM** adalah proses meningkatkan pengetahuan, keterampilan, dan kapasitas semua penduduk. Manfaatnya dalam organisasi:
- meminimalkan kinerja yang buruk;
- meningkatkan produktivitas;
- meningkatkan fleksibilitas angkatan kerja, karena pegawai dengan keterampilan beragam mudah beradaptasi;
- meningkatkan komitmen pegawai;
- mengurangi **turn over** (pergantian pegawai) dan ketidakhadiran.

{SUMBER}"""),
    dict(no=7, judul="Masalah Kependudukan dan Upaya Mengatasinya",
         ringkasan="Jumlah yang besar, pertumbuhan yang cepat, persebaran yang tidak merata, dan kualitas yang belum tinggi diatasi dengan KB, pelayanan kesehatan, transmigrasi, pendidikan, dan peningkatan produksi pertanian.",
         tujuan="Kalian dapat menganalisis masalah kependudukan Indonesia dan upaya mengatasinya.",
         bloom="Mengevaluasi",
         isi=f"""## Empat masalah kependudukan

- **Jumlah penduduk yang besar**, lebih dari 270,2 juta jiwa: sulit menjamin kebutuhan hidup rakyat, seperti lapangan kerja, kesehatan, fasilitas umum, pangan, dan lahan.
- **Pertumbuhan yang cepat**: bila tidak seimbang dengan daya dukung lingkungan, muncul masalah lingkungan, ekonomi, dan sosial.
- **Persebaran yang tidak merata**: penduduk memusat di Jawa, sehingga lahan pertanian makin sempit karena dijadikan permukiman dan industri, sedangkan pulau lain kekurangan SDM.
- **Kualitas yang belum tinggi**, misalnya status gizi balita (SSGI 2022) yang masih termasuk rendah.

## Laju pertumbuhan penduduk

Laju pertumbuhan penduduk Indonesia (Tabel 3.1):
- 1961–1971: 2,10%.
- 1971–1980: 2,31%, yang tertinggi.
- 1980–1990: 1,98%.
- 1990–2000: 1,44%.
- 2000–2010: 1,49%.
- 2010–2020: 1,25%, yang terendah.

Laju ini masih relatif tinggi dibandingkan negara maju seperti Belanda (0,3%), Inggris (0,1%), dan Finlandia (0,2%).

## Keluarga berencana dan kesehatan

- **Program Keluarga Berencana** menekan laju pertumbuhan penduduk.
- **Pelayanan kesehatan** meningkatkan derajat kesehatan dan gizi masyarakat, dengan pelayanan yang lebih dekat, bermutu, dan terjangkau.

## Transmigrasi

Transmigrasi menyebarkan dan meratakan penduduk. Tujuannya meningkatkan kesejahteraan, pemerataan pembangunan, memperluas lapangan kerja, serta memperkokoh persatuan dan kesatuan bangsa.

Selama lima tahun terakhir (menurut buku) ada 637.943 kepala keluarga transmigran: 251.755 transmigran umum dan 386.188 transmigran swakarsa. Transmigran swakarsa lebih banyak (386.188 − 251.755) : 251.755 ≈ 53,40% daripada transmigran umum.

## Pendidikan dan pertanian

- **Pendidikan dan keterampilan** ditingkatkan agar lahir tenaga terampil dan wiraswasta yang menciptakan lapangan kerja baru, khususnya di luar Jawa.
- **Produksi pertanian** ditingkatkan melalui intensifikasi, ekstensifikasi, dan diversifikasi.

## Rangkuman Bab 3

- Lingkungan hidup: biotik (produsen, konsumen, pengurai), abiotik, dan sosial budaya; alami atau buatan.
- Kualitas lingkungan diukur dengan IKLH dan dipengaruhi faktor alam serta sosial budaya.
- Masalah lingkungan: pemanasan global dan pencemaran udara, air, laut, dan tanah.
- Pertumbuhan penduduk: P = (L − M) + (I − E). Data dikumpulkan dengan sensus, registrasi, dan survei.
- Indonesia berada dalam era bonus demografi dan menuju ageing population.
- Masalah kependudukan diatasi dengan KB, kesehatan, transmigrasi, pendidikan, dan pertanian.

{SUMBER}"""),
]

for _p in PELAJARAN:
    cek(3 <= _p["isi"].count("\n## ") + _p["isi"].startswith("## ") <= 6, f"lesson {_p['no']}: 3-6 pages")
    cek(_p["isi"].rstrip().endswith(SUMBER), f"lesson {_p['no']}: attribution last")
    cek("\n|" not in _p["isi"], f"lesson {_p['no']}: no Markdown table")
    cek("permukaan matahari" not in _p["isi"] and "107 jiwa" not in _p["isi"] and "1.49%" not in _p["isi"], f"lesson {_p['no']}: a book error kept out")
    cek(not any(w in _p["isi"] for w in ("dipantulkan", "bromida", "hanya dapat dilakukan")), f"lesson {_p['no']}: a doubtful claim kept out")

# ── Misconceptions: the book has no Miskonsepsi section; these come from the distractors.
MISKONSEPSI = {
    "SMA11-G-B3-01": ("Peran biotik tertukar",
                      "Produsen, konsumen, dan pengurai tertukar, misalnya jamur dikira produsen.",
                      "Tanyakan dari mana makhluk itu mendapat makanan atau energinya: membuat sendiri, memakan yang lain, atau menguraikan yang mati."),
    "SMA11-G-B3-02": ("Unsur lingkungan tertukar",
                      "Unsur biotik, abiotik, dan sosial budaya tertukar.",
                      "Minta murid memeriksa: hidup atau tidak hidup? hasil ciptaan manusia atau bukan?"),
    "SMA11-G-B3-03": ("Lingkungan alami dan buatan tertukar",
                      "Lingkungan alami (air atau darat) dan lingkungan buatan tertukar.",
                      "Tanyakan apakah lingkungan itu dibuat manusia dengan teknologi atau terbentuk tanpa campur tangan manusia."),
    "SMA11-G-B3-04": ("Manfaat lingkungan tertukar",
                      "Manfaat satu unsur lingkungan dipakai untuk unsur lain.",
                      "Buat daftar enam manfaat lingkungan dan cocokkan dengan contohnya."),
    "SMA11-G-B3-05": ("Angka atau indikator kualitas lingkungan tertukar",
                      "Nilai IKLH, targetnya, atau selisihnya tertukar, atau indikator IKLH tertukar dengan indeks lain.",
                      "Tuliskan nilai tahun 2019, 2020, dan targetnya berdampingan, lalu tentukan selisih yang ditanyakan."),
    "SMA11-G-B3-06": ("Faktor kualitas lingkungan tertukar",
                      "Faktor alam dan faktor sosial budaya yang memengaruhi kualitas lingkungan tertukar.",
                      "Tanyakan apakah faktor itu berasal dari alam atau dari cara hidup dan berpikir masyarakat."),
    "SMA11-G-B3-07": ("Penyebab masalah lingkungan tertukar",
                      "Penyebab atau ciri satu masalah lingkungan dipakai untuk masalah lain.",
                      "Buat peta konsep: setiap masalah dengan penyebab dan akibatnya."),
    "SMA11-G-B3-08": ("Upaya pengelolaan tertukar",
                      "Upaya untuk satu masalah lingkungan atau kependudukan dipakai untuk masalah lain.",
                      "Pasangkan setiap upaya dengan masalah yang diatasinya dan minta murid menjelaskan alasannya."),
    "SMA11-G-B3-09": ("Rumus pertumbuhan penduduk keliru",
                      "Hanya sebagian rumus dipakai, tanda imigrasi dan emigrasi tertukar, atau semua angka dijumlahkan.",
                      "Tulis rumus P = (L − M) + (I − E), isi setiap huruf, dan hitung dua kurung secara terpisah."),
    "SMA11-G-B3-10": ("Cara pengumpulan data penduduk tertukar",
                      "Sensus, registrasi, dan survei, atau de facto dan de jure, atau canvasser dan householder, tertukar.",
                      "Buat tabel: siapa yang dicacah, siapa yang mengisi, seluruh penduduk atau sampel, sekali atau terus-menerus."),
    "SMA11-G-B3-11": ("Data komposisi atau distribusi tertukar",
                      "Persentase atau angka milik kelompok atau wilayah lain dipakai sebagai jawaban.",
                      "Minta murid membaca kembali keterangan setiap angka: wilayah, kelompok umur, atau tahun."),
    "SMA11-G-B3-12": ("Rasio jenis kelamin keliru dihitung",
                      "Rasio dihitung terbalik (perempuan per 100 laki-laki), atau yang dihitung selisih atau persentase.",
                      "Ingatkan arti rasio 102: banyak laki-laki untuk setiap 100 perempuan. Bagi laki-laki dengan perempuan, lalu kalikan 100."),
    "SMA11-G-B3-13": ("Jenis piramida penduduk tertukar",
                      "Ciri piramida muda, tua, dan stasioner tertukar.",
                      "Hubungkan dasar piramida dengan kelahiran dan puncaknya dengan penduduk usia tua."),
    "SMA11-G-B3-14": ("Konsep SDM tertukar",
                      "SDM mikro dan makro, kuantitas dan kualitas, atau aspek fisik dan nonfisik tertukar.",
                      "Minta murid menyebut contoh untuk setiap istilah sebelum memilih."),
    "SMA11-G-B3-15": ("Data laju pertumbuhan tertukar",
                      "Laju pertumbuhan satu periode atau satu negara dipakai untuk periode atau negara lain.",
                      "Tuliskan tabel laju pertumbuhan satu baris per periode, lalu cari nilai tertinggi dan terendahnya."),
}



S = []
STOP = {"karena", "yaitu", "adalah", "dengan", "sebagai", "termasuk", "bukan", "hanya", "dapat", "menjadi", "tidak", "sehingga",
        "berada", "antara", "untuk", "dalam", "wilayah", "indonesia", "setiap", "seperti", "terutama", "masing", "serta", "maupun",
        "sekitar", "tempat"}


# An option may correct the book's spelling; the word is then checked in the book's spelling.
EJAAN = {"persentase": "presentase"}      # p. 171


def kata_isi(teks):
    return [w for w in re.findall(r"[0-9a-zA-Z,.%°'’-]+", teks) if len(norm(w)) >= 5 and norm(w) not in {norm(s) for s in STOP}]


def soal(ref, pel, tanya, jawab, pilihan, guna="", sulit="Mudah", petunjuk=""):
    """`pilihan` lists the correct option first; `jawab` is the letter it is shown at. Each option
    is (teks, benar, alasan, kode, fakta): `fakta` is the FAKTA id it rests on. A fakta starting
    with "=" is computed (a temperature) and the question's own assertion proves it."""
    cek(len(pilihan) == 4 and pilihan[0][1] and not any(p[1] for p in pilihan[1:]), ref)
    for teks, benar, alasan, kode, fid in pilihan:
        cek(alasan.strip() != "", f"{ref}: every option has an Alasan")
        cek((kode == "") == benar, f"{ref}: a code on every distractor, none on the answer ({teks})")
        cek(kode == "" or kode in MISKONSEPSI, f"{ref}: unknown code {kode}")
        if fid.startswith("="):
            cek(fid[1:] in FAKTA, f"{ref}: {fid}")
            continue
        cek(fid in FAKTA, f"{ref}: unknown fact {fid}")
        luput = [w for w in kata_isi(teks) if norm(EJAAN.get(w, w)) not in norm(FAKTA[fid][1])]
        cek(not luput, f"{ref}: {luput} of '{teks}' is not in fact {fid}")
    cek(len({p[0] for p in pilihan}) == 4, f"{ref}: four different options")
    i = "ABCD".index(jawab)
    S.append(dict(ref=ref, pel=pel, tanya=tanya, pilihan=pilihan[1:i + 1] + [pilihan[0]] + pilihan[i + 1:],
                  guna=guna, sulit=sulit, petunjuk=petunjuk))


# ── Pemetaan awal (pre-test): biotic roles, acid rain, natural growth, transmigration.
soal("PA1", 1, "Bakteri, jamur, dan cacing tanah dalam ekosistem berperan sebagai ...", "B", [
    ("pengurai", True, "Tepat. Pengurai mendapat energi dengan menguraikan bahan organik dari organisme mati.", "", "pengurai"),
    ("produsen", False, "Produsen mengubah zat anorganik menjadi zat organik, seperti tumbuhan hijau, alga, dan lumut.", "SMA11-G-B3-01", "produsen"),
    ("konsumen", False, "Konsumen tidak dapat membuat makanannya sendiri, seperti manusia dan hewan.", "SMA11-G-B3-01", "konsumen"),
    ("lingkungan abiotik", False, "Bakteri, jamur, dan cacing tanah adalah makhluk hidup, jadi termasuk unsur biotik.", "SMA11-G-B3-02", "abiotik"),
], guna="Pemetaan awal")
soal("PA2", 3, "Air hujan yang memiliki pH lebih kecil dari 5,6 dan mengandung sulfur dioksida serta oksida nitrogen disebut ...", "D", [
    ("hujan asam", True, "Tepat. Hujan asam adalah salah satu dampak pencemaran udara.", "", "hujan_asam"),
    ("pemanasan global", False, "Pemanasan global adalah naiknya suhu bumi karena gas rumah kaca.", "SMA11-G-B3-07", "gw_musim"),
    ("penipisan lapisan ozon", False, "Penipisan lapisan ozon antara lain disebabkan gas klorin dari CFC.", "SMA11-G-B3-07", "cfc"),
    ("pencemaran air", False, "Pencemaran air terjadi akibat industri, permukiman, dan teknologi yang kurang ramah lingkungan.", "SMA11-G-B3-07", "air"),
], guna="Pemetaan awal")
cek(alami(180, 65) == 115 and 180 + 65 == 245 and alami(65, 180) == -115)
soal("PA3", 4, "Dalam setahun, sebuah desa mencatat 180 kelahiran dan 65 kematian. Pertumbuhan penduduk alaminya adalah ...", "A", [
    ("115 jiwa", True, "Benar. P = L − M = 180 − 65 = 115 jiwa.", "", "=alami_rumus"),
    ("245 jiwa", False, "Kelahiran dan kematian dijumlahkan. Kematian mengurangi penduduk, jadi dikurangkan.", "SMA11-G-B3-09", "=alami_rumus"),
    ("−115 jiwa", False, "Pengurangannya terbalik (M − L). Rumusnya P = L − M.", "SMA11-G-B3-09", "=alami_rumus"),
    ("180 jiwa", False, "Ini hanya jumlah kelahiran; kematiannya belum dikurangkan.", "SMA11-G-B3-09", "=alami_rumus"),
], guna="Pemetaan awal")
soal("PA4", 7, "Salah satu tujuan transmigrasi adalah ...", "C", [
    ("memperluas lapangan kerja", True, "Tepat. Transmigrasi juga bertujuan meningkatkan kesejahteraan dan pemerataan pembangunan.", "", "transmigrasi"),
    ("mengurangi laju pertumbuhan penduduk", False, "Menurut Mulyadi, laju pertumbuhan dikurangi dengan keluarga berencana; transmigrasi menyebarkan kepadatan penduduk.", "SMA11-G-B3-08", "mulyadi_kb"),
    ("peningkatan hasil pertanian", False, "Hasil pertanian ditingkatkan melalui intensifikasi, ekstensifikasi, dan diversifikasi.", "SMA11-G-B3-08", "pertanian"),
    ("penyebaran budaya hidup sehat", False, "Ini kebijakan di bidang kesehatan.", "SMA11-G-B3-08", "mulyadi_kesehatan"),
], guna="Pemetaan awal")

# ── Cek penguasaan (post-test): every lesson; no book assessment item (pp. 185-191), no lesson example.
soal("PB1", 1, "Dalam ekosistem, peran produsen dapat dilakukan oleh ...", "C", [
    ("tumbuhan yang berklorofil", True, "Tepat. Dengan fotosintesis, tumbuhan berklorofil mengubah zat anorganik menjadi zat organik.", "", "produsen_contoh"),
    ("bakteri, jamur, dan cacing tanah", False, "Mereka adalah pengurai, yang menguraikan bahan organik dari organisme mati.", "SMA11-G-B3-01", "pengurai"),
    ("manusia dan hewan", False, "Manusia dan hewan adalah konsumen, karena tidak dapat membuat makanannya sendiri.", "SMA11-G-B3-01", "konsumen"),
    ("air, tanah, udara, dan cahaya matahari", False, "Ini lingkungan abiotik, yaitu benda tak hidup, sehingga tidak dapat berperan sebagai produsen.", "SMA11-G-B3-02", "abiotik"),
], guna="Cek penguasaan", sulit="Sedang")
soal("PB2", 2, "Tiga indikator utama dasar penilaian IKLH di Indonesia adalah ...", "A", [
    ("kualitas air, kualitas udara, dan kualitas lahan", True, "Tepat. Ketiganya disingkat IKA, IKU, dan IKL.", "", "iklh"),
    ("kesehatan, pendidikan, dan kesejahteraan penduduk", False, "Ini indikator kualitas SDM, yang diringkas dalam Indeks Pembangunan Manusia.", "SMA11-G-B3-05", "ipm"),
    ("jumlah, komposisi, distribusi, dan karakteristik penduduk", False, "Ini data yang disediakan sensus penduduk.", "SMA11-G-B3-05", "sensus_tujuan"),
    ("kesehatan dan gizi masyarakat, kecerdasan dan mental", False, "Ini aspek fisik dan nonfisik kualitas SDM.", "SMA11-G-B3-14", "fisik_nonfisik"),
], guna="Cek penguasaan", sulit="Sedang")
soal("PB3", 3, "Upaya yang tepat untuk melestarikan tanah pada lahan yang miring adalah ...", "D", [
    ("pembuatan terasering atau sengkedan", True, "Tepat. Terasering atau sengkedan menahan erosi di lahan miring.", "", "upaya_tanah"),
    ("melestarikan hutan bakau dan terumbu karang", False, "Ini upaya mengatasi permasalahan laut dan pantai.", "SMA11-G-B3-08", "upaya_laut"),
    ("pengurangan emisi pembuangan gas sisa pembakaran", False, "Ini upaya pelestarian udara.", "SMA11-G-B3-08", "upaya_udara"),
    ("meminimalkan polusi plastik", False, "Ini cara mengatasi masalah lingkungan air.", "SMA11-G-B3-08", "upaya_air"),
], guna="Cek penguasaan", sulit="Sedang")
PB4 = (1340, 430, 210, 380)
cek(total(*PB4) == 740 and alami(1340, 430) == 910 and alami(1340, 430) - nonalami(210, 380) == 1080
    and alami(1340, 430) + 210 + 380 == 1500 and PB4 != CONTOH_TOTAL)
soal("PB4", 4, "Dalam setahun, sebuah kecamatan mencatat 1.340 kelahiran, 430 kematian, 210 imigran, dan 380 emigran. Pertumbuhan penduduk totalnya adalah ...", "B", [
    ("740 jiwa", True, "Benar. P = (L − M) + (I − E) = (1.340 − 430) + (210 − 380) = 910 + (−170) = 740 jiwa.", "", "=total_rumus"),
    ("910 jiwa", False, "Ini baru pertumbuhan alami (L − M). Migrasinya (I − E) belum dihitung.", "SMA11-G-B3-09", "=total_rumus"),
    ("1.080 jiwa", False, "Tanda migrasi terbalik: I − E = 210 − 380 = −170, jadi mengurangi, bukan menambah.", "SMA11-G-B3-09", "=total_rumus"),
    ("1.500 jiwa", False, "Imigran dan emigran sama-sama ditambahkan. Emigran keluar dari daerah, jadi dikurangkan.", "SMA11-G-B3-09", "=total_rumus"),
], guna="Cek penguasaan", sulit="Sulit")
cek(PIRAMIDA["tua"][:2] == ("sempit", "lebar"))
soal("PB5", 5, "Piramida penduduk yang dasarnya sempit dan puncaknya lebar menunjukkan ...", "A", [
    ("tingkat kelahiran rendah dan harapan hidup tinggi", True, "Tepat. Ini piramida tua, seperti di Jepang, Jerman, dan Italia.", "", "piramida_tua"),
    ("tingkat kelahiran tinggi dan banyak bayi lahir", False, "Ini ciri piramida muda, yang dasarnya lebar.", "SMA11-G-B3-13", "piramida_muda"),
    ("tingkat kelahiran dan kematian relatif seimbang", False, "Ini ciri piramida stasioner, yang dasar dan puncaknya relatif seimbang.", "SMA11-G-B3-13", "piramida_stasioner"),
    ("fertilitas tinggi dan kemajuan kesehatan belum merata", False, "Ini ciri negara berpiramida muda, seperti Nigeria dan Uganda.", "SMA11-G-B3-13", "piramida_muda_negara"),
], guna="Cek penguasaan", sulit="Sedang")
soal("PB6", 6, "Salah satu manfaat pendidikan bagi pembangunan ekonomi adalah ...", "C", [
    ("menciptakan tenaga kerja yang lebih produktif", True, "Tepat. Pengetahuan dan keahlian tenaga kerja bertambah.", "", "pendidikan_manfaat"),
    ("penyebaran budaya hidup sehat", False, "Ini kebijakan pembangunan kesehatan menurut Mulyadi.", "SMA11-G-B3-08", "mulyadi_kesehatan"),
    ("mendistribusikan kepadatan penduduk melalui transmigrasi", False, "Ini kebijakan untuk persebaran penduduk.", "SMA11-G-B3-08", "mulyadi_kb"),
    ("pencatatan identitas penduduk secara terus menerus", False, "Ini pengertian registrasi penduduk.", "SMA11-G-B3-10", "registrasi"),
], guna="Cek penguasaan", sulit="Sedang")
soal("PB7", 7, "Menurut Tabel 3.1, laju pertumbuhan penduduk Indonesia paling tinggi terjadi pada periode ...", "B", [
    ("1971–1980", True, "Tepat. Lajunya 2,31% per tahun.", "", "tabel31"),
    ("1961–1971", False, "Laju periode ini 2,10%, lebih rendah dari 2,31%.", "SMA11-G-B3-15", "tabel31"),
    ("2000–2010", False, "Laju periode ini 1,49%.", "SMA11-G-B3-15", "tabel31"),
    ("2010–2020", False, "Periode ini justru yang terendah, 1,25%.", "SMA11-G-B3-15", "tabel31"),
], guna="Cek penguasaan", sulit="Sedang")
soal("PB8", 5, "Secara makro, sumber daya manusia (SDM) adalah ...", "D", [
    ("penduduk suatu negara yang sudah memasuki usia angkatan kerja", True, "Tepat. Baik yang sudah maupun belum bekerja.", "", "sdm_makro"),
    ("individu yang bekerja dan menjadi anggota suatu perusahaan", False, "Ini pengertian SDM secara mikro.", "SMA11-G-B3-14", "sdm_mikro"),
    ("jumlah sumber daya manusia", False, "Ini pengertian kuantitas SDM.", "SMA11-G-B3-14", "kuantitas_kualitas"),
    ("mutu sumber daya manusia yang menyangkut kemampuan fisik dan non fisik", False, "Ini pengertian kualitas SDM.", "SMA11-G-B3-14", "kuantitas_kualitas"),
], guna="Cek penguasaan", sulit="Sedang")

# ── Latihan (practice), by lesson.
soal("L1", 1, "Manusia dan hewan berperan sebagai konsumen dalam ekosistem karena ...", "A", [
    ("tidak dapat membuat makanannya sendiri", True, "Tepat. Konsumen bergantung kepada organisme lain.", "", "konsumen"),
    ("mampu mengubah zat anorganik menjadi zat organik", False, "Ini peran produsen.", "SMA11-G-B3-01", "produsen"),
    ("mendapatkan energi dari menguraikan bahan organik", False, "Ini peran pengurai.", "SMA11-G-B3-01", "pengurai"),
    ("berfungsi secara dinamis tanpa campur tangan manusia", False, "Ini ciri lingkungan alami, bukan peran makhluk hidup.", "SMA11-G-B3-03", "alami"),
])
cek(set(KOMPONEN["abiotik"]) == {"air", "tanah", "udara", "cahaya matahari"})
soal("L2", 1, "Kelompok berikut yang seluruhnya termasuk lingkungan abiotik adalah ...", "C", [
    ("air, tanah, udara, dan cahaya matahari", True, "Tepat. Semuanya benda tak hidup yang memengaruhi kehidupan.", "", "abiotik"),
    ("bangunan, karya seni, dan sistem kepercayaan", False, "Ini lingkungan budaya, hasil daya cipta manusia.", "SMA11-G-B3-02", "budaya"),
    ("tumbuhan hijau, alga, dan lumut", False, "Ini makhluk hidup (produsen), jadi termasuk unsur biotik.", "SMA11-G-B3-02", "produsen_contoh"),
    ("bakteri, jamur, dan cacing tanah", False, "Ini makhluk hidup (pengurai), jadi termasuk unsur biotik.", "SMA11-G-B3-02", "pengurai"),
])
soal("L3", 1, "Danau, laut, rawa, dan sungai termasuk ...", "B", [
    ("lingkungan hidup air", True, "Tepat. Keempatnya bagian dari lingkungan alami.", "", "alami_air_darat"),
    ("lingkungan hidup darat", False, "Lingkungan hidup darat terdiri atas bukit, gunung, hutan, lembah, dan padang rumput.", "SMA11-G-B3-03", "alami_air_darat"),
    ("lingkungan buatan", False, "Lingkungan buatan dibuat manusia, misalnya jalan, sekolah, dan taman.", "SMA11-G-B3-03", "buatan"),
    ("lingkungan sosial", False, "Lingkungan sosial adalah lingkungan antarmanusia atau antarkelompok.", "SMA11-G-B3-02", "sosial"),
])
soal("L4", 2, "Salah satu manfaat lingkungan adalah menyediakan mikroorganisme, yang berguna untuk ...", "D", [
    ("menguraikan sisa makhluk hidup yang mati", True, "Tepat. Sisa-sisa itu diproses menjadi tanah yang subur.", "", "mikroorganisme"),
    ("tempat berkebun, berladang, dan mendirikan rumah", False, "Ini manfaat tanah bagi manusia.", "SMA11-G-B3-04", "penyedia_tanah"),
    ("sumber daya alam seperti gas alam dan minyak bumi", False, "Ini manfaat lingkungan sebagai penyedia sumber daya alam.", "SMA11-G-B3-04", "penyedia_sda"),
    ("oksigen untuk bernapas bagi makhluk hidup", False, "Ini manfaat lingkungan sebagai penyedia oksigen, bukan manfaat mikroorganisme.", "SMA11-G-B3-04", "oksigen"),
])
soal("L5", 2, "IKLH Indonesia tahun 2019 sebesar 66,55 dan tahun 2020 sebesar 70,27. Kenaikannya adalah ...", "A", [
    ("3,72 poin", True, "Benar. 70,27 − 66,55 = 3,72 poin.", "", "iklh_2020"),
    ("68,71 poin", False, "68,71 adalah target RPJMN, bukan kenaikannya.", "SMA11-G-B3-05", "iklh_2020"),
    ("1,56 poin", False, "Ini selisih nilai 2020 dengan target RPJMN (70,27 − 68,71).", "SMA11-G-B3-05", "=iklh_2020"),
    ("2,16 poin", False, "Ini selisih target RPJMN dengan nilai 2019 (68,71 − 66,55).", "SMA11-G-B3-05", "=iklh_2020"),
])
soal("L6", 2, "Di suatu desa, warga yang menebang satu pohon harus mengganti 10 pohon serupa. Faktor yang memengaruhi kualitas lingkungan di desa itu adalah ...", "C", [
    ("nilai-nilai tradisi masyarakat", True, "Tepat. Tradisi termasuk faktor sosial budaya.", "", "tradisi"),
    ("ilmu pengetahuan dan teknologi", False, "Ini faktor sosial budaya yang lain: kemampuan merespons dan meningkatkan kualitas lingkungan.", "SMA11-G-B3-06", "iptek"),
    ("aktivitas gunung api", False, "Ini faktor alam.", "SMA11-G-B3-06", "gunung_api"),
    ("erosi yang menurunkan daya dukung", False, "Ini faktor alam.", "SMA11-G-B3-06", "erosi"),
])
soal("L7", 3, "Menurut buku, salah satu akibat pemanasan global adalah ...", "B", [
    ("lapisan es di kutub mencair dan permukaan air laut naik", True, "Tepat. Pemanasan global juga mengubah pola musim dan curah hujan.", "", "gw_dampak"),
    ("air hujan mengandung sulfur dioksida dan oksida nitrogen", False, "Ini ciri hujan asam, dampak pencemaran udara.", "SMA11-G-B3-07", "hujan_asam"),
    ("kontaminasi logam berat", False, "Ini salah satu penyebab pencemaran tanah.", "SMA11-G-B3-07", "tanah_cemar"),
    ("gas-gas beracun dari letusan gunung berapi di dasar laut", False, "Ini faktor alami penyebab kerusakan laut.", "SMA11-G-B3-07", "laut_faktor"),
])
soal("L8", 3, "Contoh faktor nonalami yang menyebabkan kerusakan pantai dan laut adalah ...", "D", [
    ("membuang sampah sembarangan", True, "Tepat. Faktor nonalami bersumber dari aktivitas manusia.", "", "laut_faktor"),
    ("letusan gunung berapi di dasar laut", False, "Ini faktor alami, yang bersumber dari alam.", "SMA11-G-B3-07", "laut_faktor"),
    ("melestarikan hutan bakau di sekitar pantai", False, "Ini upaya mengatasi permasalahan laut dan pantai, bukan penyebabnya.", "SMA11-G-B3-08", "upaya_laut"),
    ("tanaman penutup tanah", False, "Ini upaya mengatasi pemanasan global.", "SMA11-G-B3-08", "upaya_gw"),
])
soal("L9", 3, "Salah satu penyebab penipisan lapisan ozon adalah ...", "A", [
    ("polusi gas klorin dari CFC", True, "Tepat. Lapisan ozon melindungi bumi dari radiasi berbahaya.", "", "cfc"),
    ("pembakaran bahan bakar fosil", False, "Menurut buku, ini penyebab pencemaran udara.", "SMA11-G-B3-07", "udara"),
    ("penggunaan bahan pestisida atau bahan industri lainnya", False, "Ini penyebab pencemaran tanah.", "SMA11-G-B3-07", "tanah_cemar"),
    ("industri dan permukiman", False, "Ini penyebab pencemaran air.", "SMA11-G-B3-07", "air"),
])
cek(nonalami(320, 450) == -130 and 320 + 450 == 770)
soal("L10", 4, "Dalam setahun, 320 orang pindah masuk ke sebuah kota untuk menetap (imigran) dan 450 orang pindah keluar untuk menetap (emigran). Pertumbuhan penduduk nonalaminya adalah ...", "C", [
    ("−130 jiwa", True, "Benar. P = I − E = 320 − 450 = −130. Penduduknya berkurang karena migrasi.", "", "=nonalami_rumus"),
    ("130 jiwa", False, "Pengurangannya terbalik (E − I). Rumusnya P = I − E.", "SMA11-G-B3-09", "=nonalami_rumus"),
    ("770 jiwa", False, "Imigran dan emigran dijumlahkan. Emigran dikurangkan.", "SMA11-G-B3-09", "=nonalami_rumus"),
    ("−450 jiwa", False, "Hanya emigran yang dihitung; 320 imigran belum ditambahkan.", "SMA11-G-B3-09", "=nonalami_rumus"),
])
cek("de jure" in DATA_PENDUDUK["sensus"])
soal("L11", 4, "Sensus yang mencacah semua orang yang benar-benar tercatat dan bertempat tinggal di suatu wilayah, umumnya sesuai KTP, disebut sensus ...", "B", [
    ("de jure", True, "Tepat.", "", "de_jure"),
    ("de facto", False, "Sensus de facto mencacah semua orang yang ditemui petugas ketika sensus.", "SMA11-G-B3-10", "de_facto"),
    ("canvasser", False, "Canvasser adalah cara pengisian: petugas mendatangi penduduk.", "SMA11-G-B3-10", "canvasser"),
    ("householder", False, "Householder adalah cara pengisian: penduduk mengisi sendiri.", "SMA11-G-B3-10", "householder"),
])
soal("L12", 4, "Dalam sensus dengan metode canvasser, ...", "A", [
    ("petugas mendatangi penduduk dan mengisi daftar pertanyaan", True, "Tepat. Datanya lebih lengkap, tetapi prosesnya lama.", "", "canvasser"),
    ("pengisian daftar pertanyaan dilakukan oleh penduduk sendiri", False, "Ini metode householder.", "SMA11-G-B3-10", "householder"),
    ("pencacahan semua orang yang ditemui oleh petugas", False, "Ini sensus de facto.", "SMA11-G-B3-10", "de_facto"),
    ("tidak menghitung seluruh responden, melainkan penarikan sampel", False, "Ini survei penduduk, bukan sensus.", "SMA11-G-B3-10", "survei"),
])
soal("L13", 4, "Cara menjaring data penduduk dengan menarik sampel, tanpa menghitung seluruh penduduk, disebut ...", "D", [
    ("survei penduduk", True, "Tepat. Cakupannya lebih terbatas, tetapi informasinya lebih mendalam.", "", "survei"),
    ("sensus penduduk", False, "Sensus mencacah penduduk untuk menyediakan data jumlah, komposisi, distribusi, dan karakteristiknya.", "SMA11-G-B3-10", "sensus_tujuan"),
    ("registrasi penduduk", False, "Registrasi adalah pencatatan terus-menerus oleh pemerintah, mulai dari desa atau kelurahan.", "SMA11-G-B3-10", "registrasi"),
    ("sensus de facto", False, "Sensus de facto mencacah semua orang yang ditemui petugas.", "SMA11-G-B3-10", "de_facto"),
])
cek(rasio(48300, 46000) == 105 and rasio(46000, 48300) == 95 and 48300 - 46000 == 2300
    and round(Fraction(48300, 48300 + 46000) * 100) == 51)
soal("L14", 5, "Sebuah kabupaten berpenduduk 48.300 laki-laki dan 46.000 perempuan. Rasio jenis kelaminnya adalah ...", "C", [
    ("105", True, "Benar. 48.300 : 46.000 = 1,05, dikali 100 = 105 laki-laki untuk setiap 100 perempuan.", "", "=rasio_102"),
    ("95", False, "Pembagiannya terbalik (perempuan : laki-laki). Rasio jenis kelamin adalah laki-laki untuk setiap 100 perempuan.", "SMA11-G-B3-12", "=rasio_102"),
    ("2.300", False, "Ini selisih laki-laki dan perempuan, bukan rasio.", "SMA11-G-B3-12", "=rasio_102"),
    ("51", False, "Ini persentase laki-laki dari seluruh penduduk (sekitar 51%), bukan rasio.", "SMA11-G-B3-12", "=rasio_102"),
])
cek(max(BAGIAN, key=BAGIAN.get) == "Jawa" and BAGIAN["Jawa"] == Fraction(5610, 100))
soal("L15", 5, "Menurut BPS, pulau yang pada tahun 2020 menjadi rumah bagi 56,10% penduduk Indonesia adalah ...", "B", [
    ("Pulau Jawa", True, "Tepat. Padahal luasnya hanya sekitar tujuh persen wilayah Indonesia.", "", "jawa"),
    ("Pulau Sumatra", False, "Penduduk Sumatra 21,68%.", "SMA11-G-B3-11", "sumatra"),
    ("Pulau Sulawesi", False, "Penduduk Sulawesi 7,36%.", "SMA11-G-B3-11", "wilayah_lain"),
    ("Pulau Kalimantan", False, "Penduduk Kalimantan 6,15%.", "SMA11-G-B3-11", "wilayah_lain"),
])
cek(Fraction(7072, 100) > 50)
soal("L16", 5, "Indonesia disebut berada dalam era bonus demografi karena ...", "A", [
    ("usia produktif lebih tinggi dibandingkan usia tidak produktif", True, "Tepat. Penduduk usia produktif tahun 2020 sebesar 70,72%.", "", "bonus"),
    ("jumlah persentase penduduk usia 60 tahun ke atas lebih dari 10%", False, "Ini ciri era ageing population, yang sedang dituju Indonesia.", "SMA11-G-B3-11", "ageing"),
    ("rasio jenis kelamin tertinggi pada usia 0–9 tahun", False, "Ini keterangan rasio jenis kelamin menurut umur.", "SMA11-G-B3-11", "rasio_umur"),
    ("tingkat kelahiran yang rendah", False, "Ini ciri piramida tua.", "SMA11-G-B3-13", "piramida_tua"),
])
soal("L17", 6, "Menurut Mulyadi (2003), peningkatan kualitas bagi penduduk miskin dicapai antara lain dengan ...", "C", [
    ("memberikan keterampilan praktis", True, "Tepat. Juga dengan mendorong sikap kerja yang produktif dan semangat kemandirian.", "", "mulyadi_miskin"),
    ("gerakan keluarga berencana dan transmigrasi", False, "Ini kebijakan untuk laju pertumbuhan dan kepadatan penduduk.", "SMA11-G-B3-08", "mulyadi_kb"),
    ("perluasan jangkauan pelayanan kesehatan masyarakat", False, "Ini kebijakan pembangunan kesehatan.", "SMA11-G-B3-08", "mulyadi_kesehatan"),
    ("intensifikasi, ekstensifikasi, dan diversifikasi", False, "Ini cara meningkatkan hasil pertanian.", "SMA11-G-B3-08", "pertanian"),
])
soal("L18", 6, "Proses pergantian pegawai pada sebuah perusahaan, atas inisiatif pribadi atau keputusan pimpinan, disebut ...", "D", [
    ("turn over", True, "Tepat. Pengembangan SDM dapat mengurangi turn over.", "", "turn_over"),
    ("pengembangan sumber daya manusia", False, "Ini proses peningkatan pengetahuan, keterampilan, dan kapasitas penduduk.", "SMA11-G-B3-14", "pengembangan_def"),
    ("angka harapan hidup", False, "Ini rata-rata perkiraan tahun yang dapat ditempuh seseorang selama hidupnya.", "SMA11-G-B3-14", "ahh"),
    ("Indeks Pembangunan Manusia", False, "Ini ukuran kualitas penduduk dari aspek kesehatan, pendidikan, dan kesejahteraan.", "SMA11-G-B3-14", "ipm"),
])
MAJU = {"Belanda": Fraction(3, 10), "Inggris": Fraction(1, 10), "Finlandia": Fraction(2, 10)}
cek(min(MAJU, key=MAJU.get) == "Inggris")
soal("L19", 7, "Di antara negara maju yang disebut buku, negara yang laju pertumbuhan penduduknya paling rendah adalah ...", "B", [
    ("Inggris", True, "Tepat. Laju pertumbuhan Inggris hanya 0,1%.", "", "negara_maju"),
    ("Belanda", False, "Laju pertumbuhan Belanda 0,3%.", "SMA11-G-B3-15", "negara_maju"),
    ("Finlandia", False, "Laju pertumbuhan Finlandia 0,2%.", "SMA11-G-B3-15", "negara_maju"),
    ("Jepang", False, "Jepang disebut sebagai contoh negara berpiramida tua; laju pertumbuhannya tidak disebut buku.", "SMA11-G-B3-15", "piramida_tua_negara"),
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
# The doubtful claims of round 2 stay out of every question: the greenhouse "reflection", bromine
# in CFCs, and producers being "only" green plants.
_teks = " ".join(s["tanya"] + " " + " ".join(p[0] + " " + p[2] for p in s["pilihan"]) for s in S)
cek(not any(w in _teks for w in ("dipantulkan", "bromida", "hanya dapat dilakukan")))
# No question rests on a fact kept only for the book-error record.
cek(not any(p[4].lstrip("=") == "fotosintesis_matahari" for s in S for p in s["pilihan"]))

# The post-test never reuses a book assessment question (pp. 185-191) or a lesson example. The
# topics of the book's assessment, and of each post-test question:
TOPIK_UJI = {"sampah 2022 tidak terkelola", "kondisi lingkungan pada gambar", "angka harapan sekolah Aceh Utara",
             "UHH dan bayi lahir mati", "masalah pada piramida", "arti lingkungan hidup", "arti kualitas lingkungan",
             "arti etika lingkungan", "arti penduduk", "arti sensus", "efek rumah kaca", "penghijauan dan polusi",
             "alih fungsi lahan", "angka harapan sekolah 12,9", "registrasi penduduk", "sampah anorganik", "IKLH Riau",
             "plastik sekali pakai", "data gizi", "indeks kebahagiaan", "faktor sosial budaya", "nelayan berkelanjutan",
             "arti rasio 102", "pencemaran kota", "rancangan lingkungan berkelanjutan"}
TOPIK_POST = {"PB1": "pelaku peran produsen", "PB2": "indikator IKLH", "PB3": "pelestarian tanah di lahan miring",
              "PB4": "pertumbuhan penduduk total", "PB5": "ciri piramida tua", "PB6": "manfaat pendidikan bagi ekonomi",
              "PB7": "periode laju pertumbuhan tertinggi", "PB8": "SDM secara makro"}
cek(len(TOPIK_UJI) == 25)
cek({s_["ref"] for s_ in POST} == set(TOPIK_POST) and not set(TOPIK_POST.values()) & TOPIK_UJI)
KUNCI_UJI = {"lingkungan hidup", "kualitas lingkungan", "etika", "sensus", "registrasi", "efek rumah kaca", "sampah", "102"}
for s_ in POST:
    benar = next(p[0] for p in s_["pilihan"] if p[1]).lower()
    cek(not any(k in benar for k in KUNCI_UJI), f"{s_['ref']}: its key is a book assessment key")
# The lesson's worked growth example (2.400, 900, 350, 600) is not the post-test's.
cek("1.340 kelahiran" in POST[3]["tanya"] and "2.400" not in POST[3]["tanya"] and "1.250" not in POST[3]["tanya"])


def periksa_kutipan(path):
    """Every quotation is in the book's text (whitespace, punctuation and ligatures aside), except
    the figure facts named in GAMBAR."""
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
                c.number_format = "@"   # 17,5 °C and 1.260 stay text

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
    tulis(os.path.join(here, "SMA11-Geografi-Bab3.xlsx"))
    tulis_miskonsepsi(os.path.join(here, "SMA11-Geografi-Bab3-miskonsepsi.csv"))
    halaman = sum(p["isi"].count("## ") for p in PELAJARAN)
    print(f"SMA11-Geografi-Bab3.xlsx: lessons {len(PELAJARAN)} ({halaman} pages), questions {len(S)} "
          f"(pre {len(PRE)}, post {len(POST)}, practice {len(LAT)}), answers "
          + " ".join(f"{h}={HURUF[h]}" for h in "ABCD"))
    print(f"SMA11-Geografi-Bab3-miskonsepsi.csv: {len(MISKONSEPSI)} codes")
    print(f"facts traced: {len(FAKTA)} (pages {min(h for h, _ in FAKTA.values())}-{max(h for h, _ in FAKTA.values())})")
    if "--kutipan" in sys.argv:
        ada, gambar = periksa_kutipan(sys.argv[sys.argv.index("--kutipan") + 1])
        print(f"quotations found in the book's text: {ada} of {len(FAKTA)}; figures read by eye: {', '.join(gambar) or 'none'}")
    print(f"assertions passed: {CEK[0]}")
