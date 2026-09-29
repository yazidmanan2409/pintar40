# SMA Kelas XI, Geografi, Bab 1 "Posisi Strategis Indonesia, Potensi Sumber Daya Alam, dan
# Pengaruhnya Terhadap Kehidupan", as a PINTAR lesson workbook in the D-007 template (sheets Kursus,
# Bab, Pelajaran, Soal, Pilihan; the column contract is KOLOM in src/lib/unggah-kontrak.ts).
#
# Source: the student book "Geografi untuk SMA/MA Kelas XI (Edisi Revisi)" (Budi Handoyo, Nisa
# Maulia; Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi, 2024), Bab I, pp. 1-66. The book
# has no answer keys, so every key here is ours, and every question is answerable from its text.
#
# "Every number is proven" becomes "every fact is traced":
#   - FAKTA holds the chapter's facts, each with its page and a quotation from the book;
#   - every option of every question names the fact it rests on (a distractor is a true fact that
#     answers a different question), and the generator checks that the option's content words
#     are in that fact's quotation;
#   - what can be computed is asserted: the coordinate span against the boundary points, the time
#     zones against the 15-degree rule, the earthquake averages, the nickel and gold shares;
#   - classifications (the time zone of a province, the inner or outer arc, the kinds of natural
#     resource, the mining classes) are checked against models built from the book's own lists,
#     as the quadrilaterals were in SD5 Bab 7.
# With `--kutipan <text file of the book>` every quotation is also checked against the book's
# text (whitespace, punctuation and the fi/fl ligatures the PDF drops are ignored).
#
# Text lessons only (D-050): what a map or figure shows is put into words, and a table is one fact
# per line. The workbook's "Kode miskonsepsi" column stays empty; the proposed codes go to
# SMA11-Geografi-Bab1-miskonsepsi.csv.
#
# Run: python3 docs/onboarding/konten/sma11_geografi_bab1.py [--kutipan book.txt]
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
    """Lower case, the fi/fl ligatures as the PDF extracts them ("geograis", "lora"), and only
    letters and digits, so a quotation can be found in the extracted text."""
    teks = teks.lower().replace("ﬁ", "i").replace("ﬂ", "l").replace("fi", "i").replace("fl", "l")
    return re.sub(r"[^0-9a-z]", "", teks)


# ── The facts, with their pages. The id names the fact; `kutipan` is the book's own wording. ──
FAKTA = {}


def fakta(id_, hal, kutipan):
    cek(id_ not in FAKTA, id_)
    FAKTA[id_] = (hal, kutipan)


# A.1 Letak astronomis (pp. 4-7)
fakta("ast_rentang", 4, "Indonesia berada di antara 6°LU (Lintang Utara)–11°LS (Lintang Selatan) dan 95°BT (Bujur Timur)–141°BT (Bujur Timur).")
fakta("batas_utara", 4, "Batas wilayah utara di 6º 08' LU adalah Pulau We (pulau paling utara di Provinsi Nanggroe Aceh Darussalam).")
fakta("batas_selatan", 4, "Batas wilayah selatan di 11º 15' LS adalah Pulau Rote (pulau paling selatan di Provinsi Nusa Tenggara Timur).")
fakta("batas_barat", 4, "Batas wilayah barat pada 95º 45' BT adalah Pulau Beureuh (pulau paling barat di Provinsi Nanggroe Aceh Darussalam).")
fakta("batas_timur", 4, "Batas wilayah timur pada 141º 05' BT adalah Sungai Fly (sungai yang berada di Kota Merauke Provinsi Papua).")
fakta("letak_absolut", 4, "Letak Indonesia berdasarkan garis lintang dan garis bujur merupakan wujud letak astronomis (letak absolut).")
fakta("iklim_tropis", 5, "Indonesia dikategorikan negara beriklim tropis dengan rata-rata bersuhu panas dan memiliki kelembapan udara yang tinggi.")
fakta("sinar_12jam", 5, "Wilayah Indonesia mendapat penyinaran matahari sepanjang tahun dalam durasi waktu sekitar 12 jam sehingga mengakibatkan suhu udara tinggi")
fakta("hutan_hujan", 5, "Memiliki hutan hujan tropis yang luas dengan berbagai jenis flora dan fauna.")
fakta("zona_iklim", 5, "Iklim Tropis 23½° LU 0° 23½° LS Iklim Sub Tropis 35° LS Iklim Sedang 66½° LS Iklim Dingin 90° KS")   # Gambar 1.3
fakta("rotasi", 5, "Bumi merupakan salah satu planet yang berotasi 24 jam sehingga terjadi 360 derajat : 24 jam = 15 derajat/jam. Dengan demikian terdapat perbedaan waktu selama 1 jam setiap 15 derajat bujur.")
fakta("keppres", 5, "Keputusan Presiden Nomor 41 Tahun 1987 menetapkan tiga zona waktu yang berlaku di Indonesia. Tiga zona waktu tersebut adalah WIB (Waktu Indonesia Barat/GMT + 7), WITA (Waktu Indonesia Tengah/GMT + 8), dan WIT (Waktu Indonesia Timur/GMT + 9).")
fakta("keuntungan_ast", 7, "Indonesia memiliki hutan hujan tropis luas yang bermanfaat dalam menyuplai oksigen yang dibutuhkan untuk mengurangi pemanasan global, selain habitat ideal bagi flora dan fauna untuk tumbuh secara beragam. Keuntungan letak astronomis Indonesia lain adalah tersedianya lahan pertanian dan perkebunan")
# Gambar 1.4 (p. 6) lists the provinces in each zone; the quotation is the figure's own list.
fakta("zona_wib", 6, "ACEH BANTEN BENGKULU DAERAH ISTIMEWA YOGYAKARTA DKI JAKARTA JAMBI JAWA BARAT JAWA TENGAH JAWA TIMUR KALIMANTAN BARAT KALIMANTAN TENGAH KEPULAUAN BANGKA BELITUNG KEPULAUAN RIAU LAMPUNG RIAU SUMATRA BARAT SUMATRA SELATAN SUMATRA UTARA WIB")
fakta("zona_wita", 6, "BALI GORONTALO KALIMANTAN SELATAN KALIMANTAN TIMUR KALIMANTAN UTARA NUSA TENGGARA BARAT NUSA TENGGARA TIMUR SULAWESI BARAT SULAWESI SELATAN SULAWESI TENGAH SULAWESI TENGGARA SULAWESI UTARA WITA")
fakta("zona_wit", 6, "MALUKU MALUKU UTARA PAPUA PAPUA BARAT WIT")
# A.2 Letak geografis (pp. 8-10)
fakta("geo_benua", 8, "Indonesia secara geografis terletak di antara dua benua (Asia dan Australia) dan dua samudra (Samudra Pasifik dan Hindia).")
fakta("muson", 8, "Angin muson barat laut bersifat basah dan mengandung banyak uap air laut sehingga mendatangkan musim hujan. Sementara itu, angin muson tenggara bersifat kering sehingga mendatangkan musim kemarau.")
fakta("jalur_silang", 9, "Indonesia berada pada jalur silang lalu lintas pelayaran dan perdagangan dunia. Posisi silang tersebut memungkinkan masuknya pengaruh peradaban dan kebudayaan dari negara lain")
fakta("poros_maritim", 9, "Selain itu, juga mendorong potensi Indonesia sebagai poros maritim dunia.")
fakta("selat", 10, "Indonesia dilalui dua selat yang menghubungkan dengan perairan dunia, yaitu Selat Sunda dan Selat Karimata. Kedua selat tersebut merupakan jalur pelayaran dunia yang ramai")
fakta("agraris", 10, "Indonesia dilalui dua angin muson yang mengakibatkan terjadi musim hujan dan musim kemarau. Kedua musim tersebut menjadikan cuaca dan iklim yang potensial untuk pengembangan pertanian")
fakta("tanah_subur", 10, "Curah hujan yang menyebar di seluruh wilayah Indonesia dari kategori kering hingga sangat basah berperan penting dalam menciptakan tanah yang subur.")
fakta("akulturasi", 10, "Posisi lalu lintas internasional mengakibatkan banyaknya kapal-kapal negara luar singgah di Indonesia sehingga mengakibatkan terjadinya proses akulturasi budaya dan suku bangsa.")
# A.3 Letak geologis (pp. 11-15)
fakta("geologis_def", 11, "Letak geologis adalah letak suatu negara yang didasarkan pada struktur batu-batuan di dalam bumi.")
fakta("geo_tiga", 11, "Indonesia secara geologis dilalui oleh dua jalur pegunungan muda, pertemuan tiga lempeng dunia, dan dua dangkalan perairan laut. Kedua pegunungan muda dunia adalah Sirkum Mediterania dan Sirkum Pasifik, ketiga lempeng dunia adalah Lempeng Eurasia, Lempeng Indo-Australia, dan Lempeng Pasifik, dan kedua dangkalan perairan adalah Dangkalan Sunda dan Dangkalan Sahul.")
fakta("paparan", 12, "Paparan Sunda berhubungan langsung dengan Benua Asia, membentang dari Pulau Kalimantan hingga Pulau Jawa meliputi wilayah Semenanjung Malaysia, Sumatra, Jawa, Madura, Bali, serta pulau- pulau kecil di sekitarnya, sedangkan Paparan Sahul terletak di Indonesia bagian timur.")
fakta("busur_dalam", 12, "Busur dalam atau inner arc bersifat aktif (vulkanik). Pegunungan busur dalam memanjang dari Bukit Barisan di Pulau Sumatra menuju Jawa, Bali, Nusa Tenggara hingga Maluku membentuk jalur gunung")   # "api." is over the page break
fakta("gunung_aktif", 13, "Ada 127 gunung berapi aktif yang muncul antara lain Gunung Leuser, Gunung Krakatau, Gunung Merapi, Gunung Bromo, Gunung Semeru, Gunung Agung, Gunung Rinjani dan lainnya.")
fakta("busur_luar", 13, "pegunungan busur luar (outer arc) bersifat tidak aktif. Di Indonesia, pegunungan busur luar ini muncul berupa Pulau Simeulue, Nias, Enggano, dan Kepulauan Mentawai.")
fakta("busur_luar_timur", 13, "Gunung-gunung busur luar tersebut kembali muncul ke permukaan di daratan Pulau Sawu, Rote, Timor, Babar, Kepulauan Kei, Pulau Seram, dan Pulau Buru.")
fakta("topografi", 13, "Indonesia memiliki wilayah dengan topografi yang kompleks berupa dataran rendah, dataran tinggi, gunung, dan pegunungan")
fakta("iklim_topografi", 14, "Wilayah dataran rendah beriklim tropis yang rata-rata suhunya hangat, sedangkan dataran tinggi, gunung, dan pegunungan beriklim subtropis atau sedang dengan suhu udara yang sejuk atau dingin.")
fakta("gempa_jumlah", 14, "Sejak tahun 2009 hingga 2019 tercatat sebanyak 71.628 kejadian gempa. Jika di rata-rata jumlah gempa sebanyak 6.512 kali per tahunnya, 543 kali per bulan, dan 18 kejadian gempa per harinya")
fakta("gempa_provinsi", 14, "Provinsi Maluku menjadi provinsi dengan kejadian gempa bumi terbanyak, diikuti dengan Provinsi Sulawesi Tengah, kemudian Maluku Utara, Nusa Tenggara Barat, dan dilanjutkan dengan Nusa Tenggara Timur. Sementara itu, Kalimantan termasuk yang jarang mengalami gempa bumi.")
fakta("gempa_2020", 14, "Data BNPB tahun 2020, tercatat sebanyak 29 kejadian gempa bumi di Indonesia.")
# B.1 Pengertian dan klasifikasi SDA (pp. 17-20)
fakta("sda_def", 17, "Segala sesuatu di alam dan dapat dimanfaatkan untuk memenuhi kebutuhan serta kesejahteraan manusia disebut sumber daya alam.")
fakta("abiotik", 17, "Sumber daya alam abiotik adalah sumber daya alam fisik yang berbentuk benda mati di lingkungan kita. Contohnya mineral, batuan, udara, air, dan tanah. Jenis sumber daya alam ini dibagi menjadi dua, yaitu sumber daya dapat diperbarui (air dan udara) dan sumber daya tidak dapat diperbaharui (mineral).")
fakta("biotik", 17, "Sumber daya alam ini berupa makhluk hidup (tumbuhan dan hewan). Contohnya tanaman pertanian, hewan liar, pakan ternak, hutan, dan hewan peliharaan.")
fakta("biotik_renewable", 17, "Sumber daya alam hayati dapat terus meregenerasi dan memproduksi selama kondisi lingkungan tetap baik dan menguntungkan. Ini yang menyebabkan sumber daya hayati (biotik) termasuk pada renewable resources")
fakta("renewable", 18, "Jenis sumber daya alam ini memiliki kemampuan untuk regenerasi (pemulihan). Ketika persediaannya habis maka dengan periode waktu yang singkat dapat diproduksi kembali melalui proses mekanis, kimiawi, maupun fisik. SDA ini dapat dibagi menjadi abiotik (air, energi matahari, dan angin) dan biotik (hewan dan tumbuhan).")
fakta("unrenewable", 18, "Sumber daya alam tidak dapat diperbarui (tak terbarukan) adalah sumber daya alam yang akan habis dan tidak tersedia lagi setelah dikonsumsi atau dipakai selama kurun waktu tertentu.")
fakta("unrenewable_contoh", 19, "Gambar 1.18 1. Batubara, 2. Nikel, 3. Bijih besi, 4. Gas alam Cair-LPG, 5. Minyak bumi, 6. Emas.")
fakta("potensi_materi", 19, "Sumber Daya Alam Materi. Sumber daya yang dapat dimanfaatkan bentuk fisiknya seperti kayu, emas, besi, dan batu.")
fakta("potensi_energi", 19, "Sumber Daya Alam Energi. Sumber daya yang dimanfaatkan energinya seperti energi pasang surut, sinar matahari, gas bumi, dan minyak bumi.")
fakta("potensi_ruang", 19, "Sumber daya alam ini adalah sumber daya yang berbentuk ruang. Sumber daya alam ini digunakan untuk tempat tinggal dan beraktivitas manusia")
fakta("ruang_contoh", 20, "Gambar 1.19 Sumber Daya Ruang Dataran, Ruang Pesisir, Ruang Sabana, Ruang Pegunungan")
# B.2 Potensi dan sebaran: hutan dan laut (pp. 20-28)
fakta("hutan_brazil", 20, "Indonesia merupakan salah satu negara yang memiliki hutan tropis terluas di dunia setelah Brazil.")
fakta("hutan_potensi", 20, "Contohnya seperti menyediakan udara yang kaya oksigen, menyediakan air tawar yang jernih, bahkan memiliki potensi menyediakan plasma nutfah yang penting untuk bahan obat-obatan.")
fakta("hutan_luas", 21, "Indonesia memiliki tutupan hutan seluas 101,22 juta hektare (ha). Tutupan hutan paling besar berada di Papua. Papua 32,9 juta hektare Kalimantan 28,5 Sumatra 16 Sulawesi 11,6 Maluku 6,8 Bali-Nusa Tenggara 2,7 Jawa 1,6")   # Gambar 1.21, databoks 2023 (BPS)
fakta("hutan_konservasi", 22, "Hutan konservasi yaitu kawasan hutan dengan ciri khas tertentu yang mempunyai fungsi pokok pengawetan keanekaragaman tumbuhan dan satwa beserta ekosistemnya.")
fakta("taman_buru", 22, "Taman buru adalah kawasan hutan yang ditetapkan sebagai tempat wisata berburu.")
fakta("hutan_lindung", 22, "Hutan lindung yaitu kawasan hutan yang mempunyai fungsi pokok sebagai perlindungan sistem penyangga kehidupan untuk mengatur tata air, mencegah banjir, mengendalikan erosi, mencegah intrusi (penerobosan) air laut, dan memelihara kesuburan tanah.")
fakta("hutan_produksi", 22, "Hutan produksi adalah kawasan hutan yang mempunyai fungsi untuk memproduksi hasil hutan seperti kayu, rotan, dan gaharu.")
fakta("laut_luas", 23, "Wilayah Indonesia sebagian besar berupa perairan laut seluas 5,9 juta Km2 dengan garis pantai sepanjang 95.161 km (Arianto, 2020).")
fakta("pantai_kanada", 24, "wilayah indonesia adalah lautan dan memiliki garis pantai terpanjang kedua dunia setelah Kanada")
fakta("laut_jenis", 24, "Potensi SDA kelautan yang dapat diperbaharui terdiri atas potensi kelautan, hutan mangrove, dan potensi bioteknologi. Sementara itu, potensi SDA kelautan yang tak dapat dapat diperbaharui antara lain tambang dasar laut (alumunium, mangan, tembaga, timah, dan sebagainya).")
fakta("mangrove", 25, "Hutan mangrove adalah hutan yang tumbuh di sepanjang pantai (estuari) pada daerah tropis yang dipengaruhi oleh pasang surut air laut. Secara ekologis, hutan mangrove dapat berfungsi mencegah erosi, abrasi air laut, mengolah limbah beracun, dan lainnya. Secara ekonomis, hutan ini dapat dijadikan sebagai sumber penghasil kayu, tempat wisata, bahan bangunan, dan lainnya. Secara biologis, dapat dijadikan sebagai sumber plasma nutfah, tempat pemijahan dan perkembangbiakan ikan")
fakta("mangrove_papua", 25, "Gambar 1.24 Potensi Hutan Mangrove Papua Terbesar se Indonesia")
fakta("pelagis", 26, "Jenis ikan pelagis besar, tuna, dan cakalang banyak ditemukan di Indonesia bagian timur. Sedangkan jenis ikan pelagis kecil banyak ditemukan di Indonesia bagian barat. Selain jenis ikan ini, ikan bandeng dan udang merupakan jenis ikan yang banyak dibudidayakan oleh masyarakat pesisir Indonesia.")
fakta("karang", 27, "Potensi terumbu karang terluas di dunia ada di Indonesia. SDA hayati memiliki 590 jenis karang, 2.500 jenis moluska, 1.500 jenis udang-udangan, dan 2.500 jenis ikan.")
fakta("karang_fungsi", 27, "(1) benteng pelindung daerah pesisir dan pencegahan abrasi dari gelombang laut (fungsi ekologis); (2) pendapatan keluarga melalui kegiatan pariwisata (fungsi ekonomi); (3) makanan tambahan yang mengandung protein (fungsi ketahanan pangan")
fakta("karang_sebaran", 27, "Terumbu karang banyak tersebar di wilayah Indonesia bagian tengah dan timur, meliputi perairan di Papua, Sulawesi, Lombok, dan Bali. Namun, terumbu karang juga dapat ditemui di pantai barat dan ujung Sumatra, serta di Kepulauan Riau")
# B.2 Potensi dan sebaran: tambang (pp. 29-49)
fakta("tambang_def", 29, "Kegiatan pengambilan endapan bahan galian berharga dan bernilai ekonomis dari dalam kulit bumi, baik secara mekanis maupun manual yang terletak di permukaan, di bawah permukaan bumi, dan di bawah permukaan air disebut pertambangan.")
fakta("golongan", 29, "Bahan galian A berfungsi untuk pertahanan, keamanan, dan perekonomian negara, seperti minyak bumi, batu bara dan gas alam. Bahan galian B berfungsi strategis untuk menjamin kepentingan hidup orang banyak seperti besi, mangan, tembaga, dan sebagainya. Bahan galian C tidak termasuk dalam bahan galian A dan B, serta mudah didapatkan seperti marmer, pasir, pasir kuarsa, dan sebagainya.")
fakta("minyak_teori", 30, "Dalam teori organik, minyak bumi terbentuk melalui proses pelapukan dan penguraian mikroorganisme yang hidup di laut jutaan tahun lalu dalam batuan berpori secara anaerob. Sementara itu, dalam teori anorganik, minyak bumi berasal dari reaksi antara karbit dengan air yang menghasilkan asetilen")
fakta("minyak_produksi", 31, "Produksi minyak Indonesia pada tahun 2023 sekitar 605 ribu barel per hari. Sementara, kebutuhan konsumsi minyak mencapai lebih 1,3 juta barel. Untuk memenuhi kekurangannya, Indonesia harus impor minyak bumi dari beberapa negara, terutama negara di kawasan Timur Tengah.")
fakta("minyak_sebaran", 31, "Sebaran minyak bumi dan gas bumi terdapat di beberapa wilayah, seperti: Sumatra (Loekseumawe, Riau, Sumatra Selatan), Jawa (Jati, Majalengka, Wonokromo, Cepu, Cilacap), Kalimantan (Tarakan, Balikpapan, Kalimantan Selatan), Maluku (Seram dan Tenggara), Papua (Klamono, Sorong, dan Babo).")
fakta("gas_asal", 32, "Gas bumi berasal dari fosil tanaman, hewan, dan mikroorganisme yang telah tersimpan di bawah tanah selama ribuan hingga jutaan tahun")
fakta("gas_cadangan", 33, "Dari total potensi cadangan gas bumi tersebut, 85% berada di wilayah timur Indonesia (Saragih, et al., 2022). Cadangan gas bumi terbesar di Indonesia berada di Natuna, Papua, Maluku, dan Kalimantan")
fakta("gas_cng", 34, "Compressed Natural Gas (CNG) yang memiliki sifat tidak berbau dan tidak korosif. CNG banyak dimanfaatkan untuk keperluan gas industri.")
fakta("gas_lng", 34, "Liquefied Natural Gas (LNG), merupakan gas alam yang banyak dimanfaatkan sebagai bahan bakar.")
fakta("gas_lpg", 34, "LPG banyak digunakan oleh masyarakat Indonesia untuk bahan bakar memasak.")
fakta("batubara_asal", 35, "Batu bara terbentuk dari fosil tumbuhan yang tertimbun pada cekungan berisi air dalam waktu sangat lama hingga jutaan tahun.")
fakta("batubara_sebaran", 35, "batu bara banyak dihasilkan di Sumatra dan Kalimantan, dan hanya sebagian saja dihasilkan di Sulawesi, Maluku, dan Papua.")
fakta("batubara_produksi", 36, "Pada tahun 2017 sebanyak 461.087.221 ton, tahun 2018 naik menjadi 557.983.706 ton, dan tahun 2019 sebanyak 616.154.054 ton (BPS, 2017). Hingga tahun 2023 produksi batubara juga meningkat sebesar 775 juta ton")
fakta("batubara_asia", 36, "menduduki peringkat 4 untuk total cadangan batu bara di Asia Pasifik setelah Australia, Cina, dan India")
fakta("nikel_produksi", 37, "Produksi nikel Indonesia tertinggi di dunia sebesar 1,6 juta metrik ton atau menyumbang 48,48% dari total produksi nikel dunia. Produksi nikel dunia diperkirakan mencapai 3,3 juta metrik ton pada 2022.")
fakta("nikel_cadangan", 37, "Indonesia dan Australia masing-masing menyumbang 21% dari total cadangan nikel global sepanjang tahun lalu.")
fakta("nikel_lokasi", 37, "Tambang nikel ditemukan di beberapa wilayah, Halmahera Timur di Maluku Utara, Morowali di Sulawesi Tengah, Pulau Obi di Maluku Utara, dan Pulau Gag di Kepulauan Raja Ampat.")
fakta("besi_lokasi", 39, "Penambangan bijih besi skala besar di Indonesia banyak dilakukan di daerah Kalimantan Selatan.")
fakta("bauksit", 40, "Bauksit adalah mineral bijih utama untuk memproduksi logam aluminium.")
fakta("bauksit_kalbar", 41, "Provinsi Kalimantan Barat. Produksinya mencapai 66,77% dari total produksi nasional.")
fakta("bauksit_lain", 41, "Provinsi Riau. Wilayah Kepulauan Riau memiliki potensi bauksit sekitar 180,97 juta ton. (3) Bangka Belitung. Daerah Sigembir sebagai salah satu daerah produksi bauksit terbesar di Indonesia")
fakta("emas_asal", 42, "Emas tergolong logam mulia dan terbentuk karena adanya proses magmatisme.")
fakta("emas_cadangan", 43, "Pada 2023, Indonesia memiliki volume cadangan emas sebesar 2.600 metrik ton. Porsinya mencapai 4,4% dari cadangan emas global yang totalnya mencapai 59.000 metrik ton.")
fakta("emas_papua", 44, "Wilayah penghasil emas terbesar di Indonesia adalah Papua. Produksi emas di Papua pada tahun 2022 mencapai 60 ton.")
fakta("tembaga_mimika", 46, "Wilayah penghasil tembaga terbesar di Indonesia hingga saat ini berada di Mimika, Papua, PT Freeport Indonesia.")
fakta("timah_cina", 47, "Cadangan timah Indonesia merupakan terbesar kedua setelah Cina.")
fakta("timah_babel", 48, "Wilayah penghasil timah terbesar di Indonesia berada di Provinsi Kepulauan Bangka Belitung.")
# B.3 Pengelolaan berkelanjutan (pp. 49-56)
fakta("hutan_kelola", 50, "Aktivitas dalam pengelolaan hutan berkelanjutan ini meliputi kegiatan inventarisasi, perencanaan, implementasi, dan pengawasan.")
fakta("intensifikasi", 51, "Intensifikasi, yaitu usaha peningkatan produksi pertanian dengan cara-cara yang modern dan produktif, seperti penyediaan benih/bibit unggul, pemeliharaan yang baik, pemupukan yang tepat, dan pemberantasan hama/penyakit terpadu.")
fakta("ekstensifikasi", 51, "Ekstensifikasi, yaitu peningkatan produksi pertanian dengan cara memperluas lahan, seperti pembukaan lahan pertanian baru melalui program transmigrasi.")
fakta("reboisasi", 53, "Gambar 1.60 Reboisasi Area Bekas Tambang")
fakta("industri", 53, "Industri yang berkelanjutan akan terwujud apabila terdapat kombinasi yang seimbang dari ketiga faktor yang terpengaruh tersebut.")
fakta("ikan_jaring", 54, "Melestarikan anak ikan dan larangan penangkapan anak ikan yang belum dewasa dengan menggunakan alat penangkapan yang ukuran jaringnya ditentukan.")
fakta("ikan_kuota", 54, "Menggunakan sistem kuota dengan menentukan bagian perairan yang boleh diambil ikannya pada musim tertentu disertai kontrol yang baik.")
fakta("ikan_musim", 54, "Menutup musim penangkapan yang bertujuan agar jumlah induk ikan tidak berkurang, dan waktu pemijahan serta pembesaran anak ikan tidak terganggu.")
fakta("ikan_daerah", 54, "Menutup daerah perikanan, yaitu larangan menangkap ikan di daerah pemijahan dan pembesaran ikan, terutama di daerah yang mengalami penurunan populasi ikan.")
fakta("wisata_pad", 55, "Meningkatnya pendapatan masyarakat dan penerimaan pajak bagi pemerintah daerah yang berpotensi pada meningkatnya pendapatan asli daerah.")

# ── What can be computed, and the models built from the book's lists ──
# The span (p. 4) is the boundary points rounded down to whole degrees.
BATAS = {"utara": ("Pulau We", 6, 8, "LU"), "selatan": ("Pulau Rote", 11, 15, "LS"), "barat": ("Pulau Beureuh", 95, 45, "BT"),
         "timur": ("Sungai Fly", 141, 5, "BT")}
cek([BATAS[k][1] for k in ("utara", "selatan", "barat", "timur")] == [6, 11, 95, 141])
cek(all(norm(v[0]) in norm(FAKTA["batas_" + k][1]) for k, v in BATAS.items()))
LINTANG = Fraction(6 * 60 + 8, 60) + Fraction(11 * 60 + 15, 60)
BUJUR = Fraction(141 * 60 + 5, 60) - Fraction(95 * 60 + 45, 60)
cek(LINTANG == Fraction(1043, 60) and BUJUR == Fraction(2720, 60))   # 17°23' of latitude, 45°20' of longitude
# 15 degrees an hour (p. 5): 45°20' of longitude is three 15-degree belts, as the three zones.
cek(360 // 24 == 15 and BUJUR // 15 == 3)
ZONA = {"WIB": 7, "WITA": 8, "WIT": 9}
PROVINSI = {}
for zona, fid in (("WIB", "zona_wib"), ("WITA", "zona_wita"), ("WIT", "zona_wit")):
    teks = FAKTA[fid][1].rsplit(" ", 1)[0]
    for nama in ["DAERAH ISTIMEWA YOGYAKARTA", "DKI JAKARTA", "JAWA BARAT", "JAWA TENGAH", "JAWA TIMUR", "KALIMANTAN BARAT",
                 "KALIMANTAN TENGAH", "KEPULAUAN BANGKA BELITUNG", "KEPULAUAN RIAU", "SUMATRA BARAT", "SUMATRA SELATAN",
                 "SUMATRA UTARA", "KALIMANTAN SELATAN", "KALIMANTAN TIMUR", "KALIMANTAN UTARA", "NUSA TENGGARA BARAT",
                 "NUSA TENGGARA TIMUR", "SULAWESI BARAT", "SULAWESI SELATAN", "SULAWESI TENGAH", "SULAWESI TENGGARA",
                 "SULAWESI UTARA", "MALUKU UTARA", "PAPUA BARAT"]:
        if nama in teks:
            PROVINSI[nama.title().replace("Dki", "DKI")] = zona
            teks = teks.replace(nama, "")
    for nama in teks.split():
        PROVINSI[nama.title()] = zona
cek([sum(1 for z in PROVINSI.values() if z == k) for k in ZONA] == [18, 12, 4] and len(PROVINSI) == 34)
cek(PROVINSI["Bali"] == "WITA" and PROVINSI["Kalimantan Barat"] == "WIB" and PROVINSI["Kalimantan Timur"] == "WITA" and PROVINSI["Papua"] == "WIT")


def jam(pukul, dari, ke):
    return pukul + ZONA[ke] - ZONA[dari]


BUSUR = {"dalam": ["Bukit Barisan", "Jawa", "Bali", "Nusa Tenggara"],     # Maluku is left out: Seram and Buru are outer arc
         "luar": ["Simeulue", "Nias", "Enggano", "Mentawai", "Sawu", "Rote", "Timor", "Babar", "Kei", "Seram", "Buru"]}
cek(all(norm(t) in norm(FAKTA["busur_dalam"][1]) for t in BUSUR["dalam"])
    and all(norm(t) in norm(FAKTA["busur_luar"][1] + FAKTA["busur_luar_timur"][1]) for t in BUSUR["luar"]))
cek(not set(BUSUR["dalam"]) & set(BUSUR["luar"]))
cek(71628 // 11 == 6511 and round(71628 / 11) == 6512 and round(6512 / 12) == 543 and round(6512 / 365) == 18)   # p. 14
cek(Fraction(16, 10) / Fraction(33, 10) * 100 > Fraction(4848, 100) and round(16 / 33 * 100, 2) == 48.48)          # p. 37
cek(round(2600 / 59000 * 100, 1) == 4.4)                                                                          # p. 43
cek(461087221 < 557983706 < 616154054 < 775_000_000)                                                             # p. 36
cek(605_000 < 1_300_000)                                                                                          # p. 31
HUTAN = {"Papua": 32.9, "Kalimantan": 28.5, "Sumatra": 16, "Sulawesi": 11.6, "Maluku": 6.8, "Bali-Nusa Tenggara": 2.7, "Jawa": 1.6}
cek(max(HUTAN, key=HUTAN.get) == "Papua" and min(HUTAN, key=HUTAN.get) == "Jawa" and sorted(HUTAN, key=HUTAN.get)[-2] == "Kalimantan")
# BOOK ERROR (p. 21): the parts add up to 100,1 juta ha, not the 101,22 stated.
cek(round(sum(HUTAN.values()), 1) == 100.1 != 101.22)

# Natural resources, by the book's three classifications (pp. 17-20). Only what the book itself
# lists on an axis is placed on that axis.
JENIS = {"abiotik": ["mineral", "batuan", "udara", "air", "tanah"],
         "biotik": ["tanaman pertanian", "hewan liar", "pakan ternak", "hutan", "hewan peliharaan"]}
SIFAT = {"dapat diperbarui": ["air", "udara", "energi matahari", "angin", "hewan", "tumbuhan"] + JENIS["biotik"],
         "tidak dapat diperbarui": ["mineral", "batubara", "nikel", "bijih besi", "minyak bumi", "emas"]}
POTENSI = {"materi": ["kayu", "emas", "besi", "batu"], "energi": ["energi pasang surut", "sinar matahari", "gas bumi", "minyak bumi"],
           "ruang": ["dataran", "pesisir", "sabana", "pegunungan"]}
cek(all(norm(x) in norm(FAKTA["abiotik"][1]) for x in JENIS["abiotik"]) and all(norm(x) in norm(FAKTA["biotik"][1]) for x in JENIS["biotik"]))
cek(all(norm(x) in norm(FAKTA["potensi_" + k][1] if k != "ruang" else FAKTA["ruang_contoh"][1]) for k, v in POTENSI.items() for x in v))
cek(not set(SIFAT["dapat diperbarui"]) & set(SIFAT["tidak dapat diperbarui"]))


def sda(nama):
    return ({k for k, v in JENIS.items() if nama in v}, {k for k, v in SIFAT.items() if nama in v}, {k for k, v in POTENSI.items() if nama in v})


cek(sda("air") == ({"abiotik"}, {"dapat diperbarui"}, set()) and sda("mineral") == ({"abiotik"}, {"tidak dapat diperbarui"}, set()))
GOLONGAN = {"A": ["minyak bumi", "batu bara", "gas alam"], "B": ["besi", "mangan", "tembaga"], "C": ["marmer", "pasir", "pasir kuarsa"]}
cek(all(norm(x) in norm(FAKTA["golongan"][1]) for v in GOLONGAN.values() for x in v))

SUMBER = ("_Diadaptasi dari Geografi untuk SMA/MA Kelas XI (Edisi Revisi), Budi Handoyo dan Nisa Maulia, Kementerian "
          "Pendidikan, Kebudayaan, Riset, dan Teknologi, 2024, Bab I._")

KURSUS = {
    "Judul kursus*": "Geografi Kelas XI · Bab 1: Posisi Strategis Indonesia, Potensi Sumber Daya Alam, dan Pengaruhnya Terhadap Kehidupan",
    "Mata pelajaran*": "Geografi",
    "Jenjang*": "SMA",
    "Kelas*": "Kelas XI",
    "Konteks": "Akademik",
}

BAB = [(1, "Posisi Strategis Indonesia, Potensi Sumber Daya Alam, dan Pengaruhnya Terhadap Kehidupan")]


def daftar_zona(z):
    return ", ".join(sorted(p for p, v in PROVINSI.items() if v == z))


PELAJARAN = [
    dict(no=1, judul="Letak Astronomis Indonesia",
         ringkasan="Letak astronomis adalah letak menurut garis lintang dan garis bujur; letak ini memengaruhi iklim, pembagian zona waktu, dan kekayaan flora dan fauna Indonesia.",
         tujuan="Kalian dapat menyebutkan letak astronomis dan batas-batas Indonesia serta menjelaskan pengaruhnya terhadap iklim dan zona waktu.",
         bloom="Memahami",
         isi=f"""## Letak menurut lintang dan bujur

Letak Indonesia berdasarkan garis lintang dan garis bujur disebut **letak astronomis** atau letak absolut.

Indonesia berada di antara **6° LU – 11° LS** dan **95° BT – 141° BT**.

Titik-titik batasnya:
- Utara, 6° 08' LU: Pulau We, pulau paling utara di Provinsi Nanggroe Aceh Darussalam.
- Selatan, 11° 15' LS: Pulau Rote, pulau paling selatan di Provinsi Nusa Tenggara Timur.
- Barat, 95° 45' BT: Pulau Beureuh, pulau paling barat di Provinsi Nanggroe Aceh Darussalam.
- Timur, 141° 05' BT: Sungai Fly, di Kota Merauke, Provinsi Papua.

## Pengaruh terhadap iklim

Letak astronomis memengaruhi iklim karena setiap wilayah menerima intensitas sinar matahari yang berbeda.

Menurut pembagian iklim matahari, iklim tropis berada di antara 23½° LU dan 23½° LS. Iklim subtropis berada sampai 35°, iklim sedang sampai 66½°, dan iklim dingin sampai kutub (90°). Seluruh wilayah Indonesia, dari 6° LU sampai 11° LS, berada di dalam jalur tropis.

Akibatnya:
- Indonesia beriklim tropis: rata-rata bersuhu panas dan kelembapan udaranya tinggi.
- Penyinaran matahari berlangsung sepanjang tahun, sekitar 12 jam sehari, sehingga suhu udara tinggi (lebih dari 18 °C).
- Indonesia memiliki hutan hujan tropis yang luas dengan berbagai jenis flora dan fauna.

## Pembagian zona waktu

Bumi berotasi 360° dalam 24 jam, jadi 360° : 24 = **15° setiap jam**. Setiap 15° bujur, waktunya berbeda 1 jam.

Wilayah Indonesia terbentang dari 95° 45' BT sampai 141° 05' BT, lebih dari 45° bujur, yaitu tiga kali 15°. Keputusan Presiden Nomor 41 Tahun 1987 menetapkan **tiga zona waktu**:
- WIB (Waktu Indonesia Barat), GMT + 7.
- WITA (Waktu Indonesia Tengah), GMT + 8.
- WIT (Waktu Indonesia Timur), GMT + 9.

Semakin ke timur, jamnya semakin besar. Saat pukul 07.00 WIB, di wilayah WITA pukul 08.00 dan di wilayah WIT pukul 09.00.

## Provinsi di setiap zona

Menurut peta pembagian daerah waktu:
- WIB: {daftar_zona("WIB")}.
- WITA: {daftar_zona("WITA")}.
- WIT: {daftar_zona("WIT")}.

Perhatikan Kalimantan: Kalimantan Barat dan Kalimantan Tengah memakai WIB, sedangkan Kalimantan Selatan, Kalimantan Timur, dan Kalimantan Utara memakai WITA.

## Keuntungan letak astronomis

- Hutan hujan tropis yang luas menyuplai oksigen untuk mengurangi pemanasan global.
- Hutan itu menjadi habitat ideal bagi flora dan fauna yang beragam.
- Tersedia lahan pertanian dan perkebunan untuk menghasilkan berbagai komoditas pangan.

**Coba:** saat pukul 10.00 di Kalimantan Barat, pukul berapa di Bali?
_Periksa: Kalimantan Barat WIB, Bali WITA; WITA satu jam lebih besar, jadi pukul 11.00._

{SUMBER}"""),
    dict(no=2, judul="Letak Geografis Indonesia",
         ringkasan="Secara geografis Indonesia terletak di antara dua benua dan dua samudra; letak ini menentukan musim dan menempatkan Indonesia di jalur silang pelayaran dunia.",
         tujuan="Kalian dapat menjelaskan letak geografis Indonesia serta pengaruhnya terhadap iklim, lalu lintas dunia, ekonomi, dan budaya.",
         bloom="Memahami",
         isi=f"""## Di antara dua benua dan dua samudra

Secara geografis, Indonesia terletak di antara:
- dua benua: **Asia** (di utara) dan **Australia** (di selatan);
- dua samudra: **Samudra Pasifik** dan **Samudra Hindia**.

## Pengaruh terhadap musim

Indonesia mempunyai dua musim, musim hujan dan musim kemarau. Keduanya terjadi karena angin muson.

- **Angin muson barat laut** bersifat basah dan membawa banyak uap air laut, sehingga mendatangkan **musim hujan**.
- **Angin muson tenggara** bersifat kering, sehingga mendatangkan **musim kemarau**.

Pada peta pergerakan angin, kedua angin ini digambarkan sebagai muson barat dan muson timur yang bergerak berlawanan arah melintasi kepulauan Indonesia.

## Di persimpangan lalu lintas dunia

Letak di antara dua benua dan dua samudra menempatkan Indonesia pada **jalur silang** lalu lintas pelayaran dan perdagangan dunia.

- Posisi silang ini memungkinkan masuknya pengaruh peradaban dan kebudayaan dari negara lain, dalam perdagangan, teknologi, persenjataan, dan bidang lain.
- Posisi ini juga mendorong potensi Indonesia sebagai **poros maritim dunia**.

## Keuntungan letak geografis

- **Lintas perdagangan internasional.** Indonesia dilalui Selat Sunda dan Selat Karimata, jalur pelayaran dunia yang ramai.
- **Negara agraris.** Dua angin muson memberi musim hujan dan kemarau, iklim yang cocok untuk berbagai tanaman.
- **Tanah yang subur.** Curah hujan yang menyebar dari kategori kering sampai sangat basah membantu menciptakan tanah yang subur.
- **Keberagaman budaya.** Banyak kapal negara luar singgah di Indonesia, sehingga terjadi akulturasi budaya dan suku bangsa.

**Coba pikirkan:** di daerah kalian, musim apa yang datang ketika angin bertiup dari arah tenggara? Bandingkan dengan pengalaman kalian sehari-hari.

{SUMBER}"""),
    dict(no=3, judul="Letak Geologis Indonesia",
         ringkasan="Secara geologis Indonesia dilalui dua jalur pegunungan muda, berada di pertemuan tiga lempeng, dan mencakup dua dangkalan; letak ini membentuk gunung api, topografi yang beragam, dan gempa bumi.",
         tujuan="Kalian dapat menjelaskan letak geologis Indonesia dan pengaruhnya terhadap gunung api, topografi, iklim, dan gempa bumi.",
         bloom="Menganalisis",
         isi=f"""## Letak menurut struktur batuan

**Letak geologis** adalah letak suatu negara berdasarkan struktur batu-batuan di dalam bumi. Secara geologis, Indonesia:
- dilalui **dua jalur pegunungan muda**: Sirkum Mediterania dan Sirkum Pasifik;
- berada di pertemuan **tiga lempeng**: Lempeng Eurasia, Lempeng Indo-Australia, dan Lempeng Pasifik;
- mencakup **dua dangkalan**: Dangkalan (Paparan) Sunda dan Dangkalan (Paparan) Sahul.

## Paparan Sunda dan Paparan Sahul

- **Paparan Sunda** berhubungan langsung dengan Benua Asia. Paparan ini meliputi Semenanjung Malaysia, Sumatra, Kalimantan, Jawa, Madura, Bali, dan pulau-pulau kecil di sekitarnya.
- **Paparan Sahul** terletak di Indonesia bagian timur.

## Busur dalam dan busur luar

Kedua jalur pegunungan muda membentuk dua busur di Indonesia.

- **Busur dalam** (inner arc) bersifat **aktif** atau vulkanik. Busur ini memanjang dari Bukit Barisan di Sumatra ke Jawa, Bali, Nusa Tenggara, sampai Maluku, membentuk jalur gunung api. Ada 127 gunung berapi aktif, antara lain Krakatau, Merapi, Bromo, Semeru, Agung, dan Rinjani.
- **Busur luar** (outer arc) bersifat **tidak aktif**. Busur ini muncul sebagai Pulau Simeulue, Nias, Enggano, dan Kepulauan Mentawai, lalu memanjang di dasar laut pantai barat Sumatra sampai selatan Jawa, dan muncul kembali sebagai Pulau Sawu, Rote, Timor, Babar, Kepulauan Kei, Pulau Seram, dan Pulau Buru.

## Topografi dan iklim

Letak geologis membuat topografi Indonesia kompleks: dataran rendah, dataran tinggi, gunung, dan pegunungan.

Topografi yang beragam membuat iklimnya pun beragam:
- dataran rendah beriklim tropis, rata-rata suhunya hangat;
- dataran tinggi, gunung, dan pegunungan beriklim subtropis atau sedang, suhunya sejuk atau dingin.

Keragaman iklim ini memunculkan beragam budi daya pertanian dan wisata.

## Gempa bumi

- Dari tahun 2009 sampai 2019 tercatat 71.628 kejadian gempa. Rata-ratanya 6.512 kali setahun, 543 kali sebulan, dan 18 kali sehari.
- Provinsi dengan gempa terbanyak adalah Maluku, diikuti Sulawesi Tengah, Maluku Utara, Nusa Tenggara Barat, dan Nusa Tenggara Timur.
- Kalimantan termasuk wilayah yang jarang mengalami gempa bumi.
- Menurut data BNPB tahun 2020, tercatat 29 kejadian gempa bumi di Indonesia.

**Coba:** 71.628 kejadian dalam 11 tahun (2009 sampai 2019). Berapa rata-ratanya setahun?
_Periksa: 71.628 : 11 ≈ 6.512 kejadian._

{SUMBER}"""),
    dict(no=4, judul="Pengertian dan Klasifikasi Sumber Daya Alam",
         ringkasan="Sumber daya alam dapat dikelompokkan menurut jenisnya (hayati dan nonhayati), sifatnya (dapat dan tidak dapat diperbarui), dan potensinya (materi, energi, dan ruang).",
         tujuan="Kalian dapat mengelompokkan sumber daya alam menurut jenis, sifat, dan potensinya beserta contohnya.",
         bloom="Menganalisis",
         isi=f"""## Pengertian

Segala sesuatu di alam yang dapat dimanfaatkan untuk memenuhi kebutuhan dan kesejahteraan manusia disebut **sumber daya alam** (SDA).

SDA dapat dikelompokkan dengan tiga cara: menurut **jenis**, **sifat**, dan **potensinya**. Satu SDA dapat masuk ke tiga kelompok sekaligus, satu dari setiap cara.

## Menurut jenisnya

- **SDA nonhayati (abiotik)**: SDA fisik yang berbentuk benda mati. Contohnya mineral, batuan, udara, air, dan tanah. Sebagian dapat diperbarui (air dan udara), sebagian tidak (mineral).
- **SDA hayati (biotik)**: makhluk hidup, yaitu tumbuhan dan hewan. Contohnya tanaman pertanian, hewan liar, pakan ternak, hutan, dan hewan peliharaan.

SDA hayati dapat terus beregenerasi selama kondisi lingkungan tetap baik. Karena itu SDA hayati termasuk SDA yang dapat diperbarui.

## Menurut sifatnya

- **Dapat diperbarui** (renewable resources): mampu beregenerasi. Bila persediaannya habis, dalam waktu singkat dapat diproduksi kembali. Contohnya air, energi matahari, dan angin (abiotik), serta hewan dan tumbuhan (biotik).
- **Tidak dapat diperbarui** (unrenewable resources): akan habis dan tidak tersedia lagi setelah dipakai selama kurun waktu tertentu. Contohnya batu bara, nikel, bijih besi, gas alam cair (LPG), minyak bumi, dan emas.

## Menurut potensinya

- **SDA materi**: dimanfaatkan bentuk fisiknya, seperti kayu, emas, besi, dan batu.
- **SDA energi**: dimanfaatkan energinya, seperti energi pasang surut, sinar matahari, gas bumi, dan minyak bumi.
- **SDA ruang**: berbentuk ruang, dipakai untuk tempat tinggal dan beraktivitas, seperti ruang dataran, pesisir, sabana, dan pegunungan.

**Coba:** kelompokkan emas menurut sifat dan potensinya.
_Periksa: tidak dapat diperbarui, dan SDA materi (dimanfaatkan bentuk fisiknya)._

{SUMBER}"""),
    dict(no=5, judul="Potensi Hutan dan Laut Indonesia",
         ringkasan="Indonesia memiliki hutan tropis terluas di dunia setelah Brazil dan laut yang luas dengan mangrove, perikanan, dan terumbu karang terluas di dunia.",
         tujuan="Kalian dapat menjelaskan potensi dan sebaran sumber daya hutan dan laut Indonesia.",
         bloom="Memahami",
         isi=f"""## Hutan

Indonesia adalah salah satu negara dengan **hutan tropis terluas di dunia setelah Brazil**. Hutan tidak hanya menghasilkan kayu, tetapi juga menyediakan udara yang kaya oksigen, air tawar yang jernih, dan plasma nutfah untuk bahan obat-obatan.

Menurut data BPS (databoks, 2023), tutupan hutan Indonesia seluas 101,22 juta hektare:
- Papua 32,9 juta hektare, yang terluas;
- Kalimantan 28,5 juta hektare;
- Sumatra 16 juta hektare;
- Sulawesi 11,6 juta hektare;
- Maluku 6,8 juta hektare;
- Bali-Nusa Tenggara 2,7 juta hektare;
- Jawa 1,6 juta hektare, yang tersempit.

## Hutan menurut fungsinya

- **Hutan konservasi**: fungsi pokoknya pengawetan keanekaragaman tumbuhan dan satwa beserta ekosistemnya. Termasuk di dalamnya kawasan suaka alam, kawasan pelestarian alam, dan taman buru (kawasan untuk wisata berburu).
- **Hutan lindung**: fungsi pokoknya melindungi sistem penyangga kehidupan, yaitu mengatur tata air, mencegah banjir, mengendalikan erosi, mencegah intrusi air laut, dan memelihara kesuburan tanah.
- **Hutan produksi**: fungsinya memproduksi hasil hutan seperti kayu, rotan, dan gaharu.

## Laut

Sebagian besar wilayah Indonesia berupa laut seluas 5,9 juta km², dengan garis pantai sepanjang 95.161 km (Arianto, 2020). Dua pertiga wilayah Indonesia adalah lautan, dan garis pantainya terpanjang kedua di dunia setelah Kanada.

Potensi SDA laut ada dua jenis:
- dapat diperbarui: potensi kelautan, hutan mangrove, dan potensi bioteknologi;
- tidak dapat diperbarui: tambang dasar laut seperti aluminium, mangan, tembaga, dan timah.

## Mangrove dan perikanan

**Hutan mangrove** tumbuh di sepanjang pantai (estuari) daerah tropis yang dipengaruhi pasang surut air laut. Mangrove terbesar di Indonesia ada di Papua. Fungsinya:
- ekologis: mencegah erosi dan abrasi, mengolah limbah beracun;
- ekonomis: sumber kayu, tempat wisata, bahan bangunan;
- biologis: sumber plasma nutfah, tempat pemijahan dan perkembangbiakan ikan, kerang, kepiting, dan burung.

**Perikanan:** ikan pelagis besar, tuna, dan cakalang banyak ditemukan di Indonesia bagian timur; ikan pelagis kecil di bagian barat. Bandeng dan udang banyak dibudidayakan masyarakat pesisir.

## Terumbu karang

Terumbu karang terluas di dunia ada di Indonesia, dengan 590 jenis karang, 2.500 jenis moluska, 1.500 jenis udang-udangan, dan 2.500 jenis ikan.

Fungsinya:
- ekologis: benteng pelindung pesisir dan pencegah abrasi dari gelombang laut;
- ekonomi: pendapatan keluarga melalui pariwisata;
- ketahanan pangan: makanan tambahan yang mengandung protein.

Terumbu karang banyak tersebar di Indonesia bagian tengah dan timur (Papua, Sulawesi, Lombok, Bali), juga di pantai barat dan ujung Sumatra serta Kepulauan Riau.

{SUMBER}"""),
    dict(no=6, judul="Potensi dan Sebaran Bahan Tambang",
         ringkasan="Bahan galian dibagi dalam golongan A, B, dan C; Indonesia kaya minyak bumi, gas bumi, batu bara, nikel, bijih besi, bauksit, emas, tembaga, dan timah yang tersebar di berbagai wilayah.",
         tujuan="Kalian dapat menjelaskan golongan bahan galian serta potensi dan sebaran bahan tambang utama di Indonesia.",
         bloom="Memahami",
         isi=f"""## Pertambangan dan golongan bahan galian

**Pertambangan** adalah kegiatan mengambil endapan bahan galian yang berharga dan bernilai ekonomis dari dalam kulit bumi, baik secara mekanis maupun manual.

Bahan galian dibagi dalam tiga golongan:
- **Golongan A**: untuk pertahanan, keamanan, dan perekonomian negara, seperti minyak bumi, batu bara, dan gas alam.
- **Golongan B**: strategis untuk menjamin kepentingan hidup orang banyak, seperti besi, mangan, dan tembaga.
- **Golongan C**: bukan golongan A atau B, dan mudah didapat, seperti marmer, pasir, dan pasir kuarsa.

## Minyak bumi dan gas bumi

**Minyak bumi.** Menurut teori organik, minyak bumi terbentuk dari pelapukan dan penguraian mikroorganisme laut jutaan tahun lalu dalam batuan berpori secara anaerob. Menurut teori anorganik, minyak bumi berasal dari reaksi karbit dengan air yang menghasilkan asetilen.
- Produksi tahun 2023 sekitar 605 ribu barel per hari, sedangkan kebutuhan konsumsi lebih dari 1,3 juta barel. Kekurangannya diimpor, terutama dari kawasan Timur Tengah.
- Sebarannya antara lain di Sumatra (Riau, Sumatra Selatan), Jawa (Cepu, Cilacap, Wonokromo), Kalimantan (Tarakan, Balikpapan), Maluku (Seram), dan Papua (Klamono, Sorong, Babo).

**Gas bumi** berasal dari fosil tanaman, hewan, dan mikroorganisme yang tersimpan di bawah tanah selama ribuan sampai jutaan tahun.
- 85% cadangan gas bumi berada di wilayah timur Indonesia. Cadangan terbesar ada di Natuna, Papua, Maluku, dan Kalimantan.
- CNG banyak dipakai untuk gas industri, LNG sebagai bahan bakar, dan LPG untuk memasak di rumah tangga.

## Batu bara

Batu bara terbentuk dari fosil tumbuhan yang tertimbun dalam cekungan berisi air selama jutaan tahun, tanpa oksigen (anaerob).
- Batu bara banyak dihasilkan di Sumatra dan Kalimantan; sebagian kecil di Sulawesi, Maluku, dan Papua.
- Cadangannya peringkat ke-4 di Asia Pasifik, setelah Australia, Cina, dan India.
- Produksinya terus naik: 461.087.221 ton (2017), 557.983.706 ton (2018), 616.154.054 ton (2019), dan 775 juta ton (2023).

## Nikel, bijih besi, dan bauksit

- **Nikel.** Produksi nikel Indonesia tertinggi di dunia, 1,6 juta metrik ton, atau 48,48% dari produksi nikel dunia (diperkirakan 3,3 juta metrik ton pada 2022). Cadangan nikel Indonesia dan Australia masing-masing 21% dari cadangan global. Tambang nikel ada di Halmahera Timur (Maluku Utara), Morowali (Sulawesi Tengah), Pulau Obi (Maluku Utara), dan Pulau Gag (Raja Ampat).
- **Bijih besi.** Sumber dayanya sekitar 1 miliar ton. Penambangan skala besar banyak dilakukan di Kalimantan Selatan.
- **Bauksit** adalah bijih utama untuk memproduksi logam aluminium. Kalimantan Barat menghasilkan 66,77% produksi nasional; Kepulauan Riau berpotensi sekitar 180,97 juta ton; Sigembir di Bangka Belitung termasuk daerah produksi terbesar.

## Emas, tembaga, dan timah

- **Emas** terbentuk karena proses magmatisme. Pada 2023 cadangan emas Indonesia 2.600 metrik ton, atau 4,4% dari cadangan dunia (59.000 metrik ton), terbesar keenam di dunia. Penghasil terbesar adalah Papua, dengan produksi 60 ton pada 2022.
- **Tembaga.** Penghasil terbesar berada di Mimika, Papua (PT Freeport Indonesia).
- **Timah.** Cadangan timah Indonesia terbesar kedua setelah Cina. Penghasil timah terbesar adalah Provinsi Kepulauan Bangka Belitung; penghasil lainnya Riau, Kepulauan Riau, dan Kalimantan Barat.

{SUMBER}"""),
    dict(no=7, judul="Pengelolaan Sumber Daya Alam yang Berkelanjutan",
         ringkasan="Sumber daya alam dikelola dengan prinsip berkelanjutan di bidang kehutanan, pertanian, pertambangan, industri, kelautan, dan pariwisata.",
         tujuan="Kalian dapat menjelaskan prinsip dan cara pengelolaan sumber daya alam yang berkelanjutan di berbagai bidang.",
         bloom="Mengevaluasi",
         isi=f"""## Kehutanan dan pertanian

**Kehutanan berkelanjutan.** Hutan penting secara hidrologis, klimatologis, litologis, dan sebagai persediaan kayu. Prinsip pengelolaannya antara lain:
- kebijakan yang memadukan ekologi dan ekonomi;
- kebijakan untuk menekan jumlah produksi agar SDA tetap ada untuk masa depan;
- pendekatan multidisiplin dalam perencanaan wilayah dan tata guna lahan;
- kegiatan inventarisasi, perencanaan, implementasi, dan pengawasan.

**Pertanian berkelanjutan.** Produksi pertanian ditingkatkan dengan dua cara:
- **intensifikasi**: cara modern dan produktif, seperti benih unggul, pemeliharaan yang baik, pemupukan yang tepat, dan pemberantasan hama terpadu;
- **ekstensifikasi**: memperluas lahan, seperti membuka lahan baru melalui program transmigrasi.

## Pertambangan dan industri

**Pertambangan berkelanjutan** memerhatikan dampak ekonomi, kesehatan, sosial, dan lingkungan; melibatkan perempuan, masyarakat lokal, dan masyarakat adat; serta menaati hukum dan etika bisnis. Bekas tambang dipulihkan, misalnya dengan reboisasi.

**Industri berkelanjutan** terwujud bila ada kombinasi yang seimbang antara faktor ekonomi, sosial, dan lingkungan. Hambatan negara berkembang antara lain pemanfaatan SDA yang belum optimal dan kurangnya dukungan pemerintah terhadap pembangunan berkelanjutan.

## Kelautan berkelanjutan

Produksi kelautan dapat menurun karena kesalahan pengelolaan ikan. Kegiatan pengelolaan perikanan:
- melestarikan anak ikan: melarang menangkap ikan yang belum dewasa, dengan ukuran jaring yang ditentukan;
- sistem kuota: menentukan bagian perairan yang boleh diambil ikannya pada musim tertentu;
- menutup musim penangkapan: agar jumlah induk ikan tidak berkurang dan pemijahan tidak terganggu;
- menutup daerah perikanan: melarang menangkap ikan di daerah pemijahan dan pembesaran, terutama yang populasinya menurun.

## Pariwisata berkelanjutan

Manfaat pariwisata berkelanjutan:
- keseimbangan dan kelestarian lingkungan budaya dan alam setempat;
- meningkatnya rasa peduli masyarakat terhadap lingkungan;
- meningkatnya devisa negara dari wisatawan asing;
- meluasnya lapangan kerja;
- meningkatnya pendapatan masyarakat dan pajak daerah, sehingga pendapatan asli daerah meningkat;
- pembangunan daerah yang menunjang pariwisata.

## Rangkuman Bab 1

- Letak astronomis (6° LU – 11° LS, 95° BT – 141° BT) membuat Indonesia beriklim tropis dan memiliki tiga zona waktu.
- Letak geografis (dua benua, dua samudra) memberi dua musim dan posisi silang lalu lintas dunia.
- Letak geologis (dua jalur pegunungan, tiga lempeng, dua dangkalan) memberi gunung api, topografi beragam, dan gempa bumi.
- SDA dikelompokkan menurut jenis, sifat, dan potensinya.
- Hutan, laut, dan bahan tambang Indonesia sangat kaya dan tersebar luas.
- SDA harus dikelola secara berkelanjutan agar dapat dimanfaatkan dalam jangka waktu yang lama.

{SUMBER}"""),
]

for _p in PELAJARAN:
    cek(3 <= _p["isi"].count("\n## ") + _p["isi"].startswith("## ") <= 6, f"lesson {_p['no']}: 3-6 pages")
    cek(_p["isi"].rstrip().endswith(SUMBER), f"lesson {_p['no']}: attribution last")
    cek("\n|" not in _p["isi"], f"lesson {_p['no']}: no Markdown table")
cek(jam(7, "WIB", "WITA") == 8 and jam(7, "WIB", "WIT") == 9 and jam(10, "WIB", "WITA") == 11)
cek(PROVINSI["Kalimantan Barat"] == "WIB" and PROVINSI["Bali"] == "WITA" and "emas" in SIFAT["tidak dapat diperbarui"] and "emas" in POTENSI["materi"])

# ── Misconceptions: the book has no Miskonsepsi section; these come from the distractors.
MISKONSEPSI = {
    "SMA11-G-B1-01": ("Batas wilayah atau arahnya tertukar",
                      "Titik batas utara, selatan, barat, dan timur Indonesia tertukar, atau lintang utara dan selatan tertukar.",
                      "Minta murid menuliskan keempat titik batas pada sketsa peta, masing-masing dengan arah dan koordinatnya."),
    "SMA11-G-B1-02": ("Jenis letak tertukar",
                      "Letak astronomis, geografis, dan geologis tertukar: misalnya benua dan samudra dianggap letak geologis, atau lempeng dianggap letak geografis.",
                      "Bandingkan dasar ketiganya: lintang dan bujur (astronomis), wilayah di sekitarnya (geografis), struktur batuan (geologis)."),
    "SMA11-G-B1-03": ("Pengaruh letak tertukar",
                      "Suatu akibat dikaitkan dengan letak yang keliru, misalnya iklim tropis dianggap akibat letak di antara dua benua.",
                      "Buat tiga kolom (astronomis, geografis, geologis) dan minta murid menempatkan setiap akibat di kolom yang tepat beserta alasannya."),
    "SMA11-G-B1-04": ("Zona waktu keliru",
                      "Provinsi ditempatkan di zona yang keliru, atau selisih jam dihitung ke arah yang keliru (wilayah timur dianggap lebih lambat).",
                      "Ingatkan: semakin ke timur, jamnya semakin besar (WIB +7, WITA +8, WIT +9). Periksa zona provinsi pada peta pembagian daerah waktu."),
    "SMA11-G-B1-05": ("Sifat angin muson tertukar",
                      "Angin muson barat laut dan angin muson tenggara, atau musim yang dibawanya, tertukar.",
                      "Kaitkan asal angin: muson barat laut melewati lautan luas sehingga basah; muson tenggara bersifat kering."),
    "SMA11-G-B1-06": ("Busur dalam dan busur luar tertukar",
                      "Pulau pada busur luar yang tidak aktif dianggap busur dalam yang vulkanik, atau sebaliknya.",
                      "Minta murid menelusuri kedua busur pada peta: busur dalam melalui Bukit Barisan, Jawa, Bali, Nusa Tenggara; busur luar melalui Simeulue, Nias, Enggano, Mentawai."),
    "SMA11-G-B1-07": ("Unsur geologis tertukar",
                      "Pegunungan muda, lempeng, dan dangkalan tertukar, atau Paparan Sunda dan Paparan Sahul tertukar.",
                      "Buat tabel tiga baris: dua pegunungan muda, tiga lempeng, dua dangkalan; tandai dangkalan yang berhubungan dengan Asia (Sunda)."),
    "SMA11-G-B1-08": ("Klasifikasi SDA menurut jenis atau sifat keliru",
                      "SDA hayati dan nonhayati, atau yang dapat dan tidak dapat diperbarui, tertukar.",
                      "Tanyakan dua hal untuk setiap SDA: apakah ia makhluk hidup? apakah ia dapat pulih dalam waktu singkat setelah dipakai?"),
    "SMA11-G-B1-09": ("Klasifikasi SDA menurut potensi keliru",
                      "SDA materi, energi, dan ruang tertukar, misalnya sinar matahari dianggap SDA materi.",
                      "Tanyakan apa yang dimanfaatkan: bentuk fisiknya (materi), energinya (energi), atau ruangnya (ruang)."),
    "SMA11-G-B1-10": ("Fungsi hutan atau ekosistem tertukar",
                      "Fungsi hutan konservasi, lindung, dan produksi, atau fungsi ekologis, ekonomis, dan biologis mangrove dan terumbu karang, tertukar.",
                      "Minta murid mencari kata kunci fungsi pokoknya: pengawetan (konservasi), tata air dan banjir (lindung), hasil hutan (produksi)."),
    "SMA11-G-B1-11": ("Sebaran SDA tertukar",
                      "Daerah penghasil suatu SDA tertukar dengan daerah penghasil SDA lain.",
                      "Buat peta sebaran sederhana: satu simbol untuk setiap bahan tambang, lalu tempatkan daerah penghasil utamanya."),
    "SMA11-G-B1-12": ("Golongan bahan galian tertukar",
                      "Bahan galian golongan A, B, dan C tertukar.",
                      "Kaitkan setiap golongan dengan fungsinya: A untuk pertahanan dan perekonomian negara, B untuk hajat hidup orang banyak, C yang mudah didapat."),
    "SMA11-G-B1-13": ("Data atau urutan tertukar",
                      "Angka, persentase, atau peringkat milik fakta lain dipakai sebagai jawaban, misalnya angka cadangan dipakai untuk produksi.",
                      "Minta murid membaca kembali satuan dan keterangan setiap angka (produksi atau cadangan, per hari atau per tahun, tahun datanya)."),
    "SMA11-G-B1-14": ("Cara pengelolaan tertukar",
                      "Cara pengelolaan SDA berkelanjutan tertukar, misalnya intensifikasi dan ekstensifikasi, atau sistem kuota dan penutupan musim.",
                      "Minta murid menyebutkan tujuan setiap cara dengan kata-katanya sendiri sebelum memilih."),
    "SMA11-G-B1-15": ("Proses pembentukan tertukar",
                      "Proses terbentuknya satu bahan tambang dipakai untuk bahan tambang lain, misalnya magmatisme untuk minyak bumi.",
                      "Buat pasangan bahan tambang dan proses pembentukannya, lalu minta murid menjelaskan asal bahannya."),
}

S = []
STOP = {"karena", "yaitu", "adalah", "dengan", "sebagai", "termasuk", "bukan", "hanya", "dapat", "menjadi", "tidak", "sehingga",
        "berada", "antara", "untuk", "dalam", "wilayah", "indonesia", "pukul", "setiap", "seperti", "terutama", "masing", "serta", "maupun"}


def kata_isi(teks):
    return [w for w in re.findall(r"[0-9a-zA-Z,.%°'’-]+", teks) if len(norm(w)) >= 5 and norm(w) not in {norm(s) for s in STOP}]


def soal(ref, pel, tanya, jawab, pilihan, guna="", sulit="Mudah", petunjuk=""):
    """`pilihan` lists the correct option first; `jawab` is the letter it is shown at. Each option
    is (teks, benar, alasan, kode, fakta): `fakta` is the FAKTA id it rests on. A fakta starting
    with "=" is computed (a clock time) and the question's own assertion proves it."""
    cek(len(pilihan) == 4 and pilihan[0][1] and not any(p[1] for p in pilihan[1:]), ref)
    for teks, benar, alasan, kode, fid in pilihan:
        cek(alasan.strip() != "", f"{ref}: every option has an Alasan")
        cek((kode == "") == benar, f"{ref}: a code on every distractor, none on the answer ({teks})")
        cek(kode == "" or kode in MISKONSEPSI, f"{ref}: unknown code {kode}")
        if fid.startswith("="):
            cek(fid[1:] in FAKTA, f"{ref}: {fid}")
            continue
        cek(fid in FAKTA, f"{ref}: unknown fact {fid}")
        luput = [w for w in kata_isi(teks) if norm(w) not in norm(FAKTA[fid][1])]
        cek(not luput, f"{ref}: {luput} of '{teks}' is not in fact {fid}")
    cek(len({p[0] for p in pilihan}) == 4, f"{ref}: four different options")
    i = "ABCD".index(jawab)
    S.append(dict(ref=ref, pel=pel, tanya=tanya, pilihan=pilihan[1:i + 1] + [pilihan[0]] + pilihan[i + 1:],
                  guna=guna, sulit=sulit, petunjuk=petunjuk))


# ── Pemetaan awal (pre-test): a boundary, the shelves, a resource by potential, farming.
soal("PA1", 1, "Pulau yang menjadi batas wilayah paling utara Indonesia adalah ...", "B", [
    ("Pulau We", True, "Tepat. Pulau We, pada 6° 08' LU, adalah pulau paling utara di Aceh.", "", "batas_utara"),
    ("Pulau Rote", False, "Pulau Rote (11° 15' LS) adalah batas paling selatan.", "SMA11-G-B1-01", "batas_selatan"),
    ("Pulau Beureuh", False, "Pulau Beureuh (95° 45' BT) adalah batas paling barat.", "SMA11-G-B1-01", "batas_barat"),
    ("Sungai Fly", False, "Sungai Fly (141° 05' BT) adalah batas paling timur.", "SMA11-G-B1-01", "batas_timur"),
], guna="Pemetaan awal")
soal("PA2", 3, "Dangkalan yang berhubungan langsung dengan Benua Asia adalah ...", "D", [
    ("Paparan Sunda", True, "Tepat. Paparan Sunda berhubungan langsung dengan Benua Asia, meliputi Sumatra, Kalimantan, Jawa, dan Bali.", "", "paparan"),
    ("Paparan Sahul", False, "Paparan Sahul terletak di Indonesia bagian timur.", "SMA11-G-B1-07", "paparan"),
    ("Sirkum Mediterania", False, "Sirkum Mediterania adalah jalur pegunungan muda, bukan dangkalan.", "SMA11-G-B1-07", "geo_tiga"),
    ("Lempeng Eurasia", False, "Lempeng Eurasia adalah salah satu dari tiga lempeng, bukan dangkalan.", "SMA11-G-B1-07", "geo_tiga"),
], guna="Pemetaan awal")
cek("gas bumi" in POTENSI["energi"] and "kayu" in POTENSI["materi"] and "pesisir" in POTENSI["ruang"])
soal("PA3", 4, "Menurut potensinya, sumber daya alam manakah yang dimanfaatkan energinya?", "A", [
    ("gas bumi", True, "Tepat. Gas bumi termasuk SDA energi, bersama energi pasang surut, sinar matahari, dan minyak bumi.", "", "potensi_energi"),
    ("kayu", False, "Kayu dimanfaatkan bentuk fisiknya, jadi termasuk SDA materi.", "SMA11-G-B1-09", "potensi_materi"),
    ("emas", False, "Emas dimanfaatkan bentuk fisiknya, jadi termasuk SDA materi.", "SMA11-G-B1-09", "potensi_materi"),
    ("ruang pesisir", False, "Ruang pesisir dipakai untuk tempat tinggal dan beraktivitas, jadi termasuk SDA ruang.", "SMA11-G-B1-09", "ruang_contoh"),
], guna="Pemetaan awal")
soal("PA4", 7, "Peningkatan produksi pertanian dengan cara memperluas lahan disebut ...", "C", [
    ("ekstensifikasi", True, "Tepat. Ekstensifikasi memperluas lahan, misalnya membuka lahan baru melalui transmigrasi.", "", "ekstensifikasi"),
    ("intensifikasi pertanian", False, "Intensifikasi meningkatkan produksi dengan cara modern di lahan yang ada, seperti benih unggul dan pemupukan.", "SMA11-G-B1-14", "intensifikasi"),
    ("reboisasi", False, "Reboisasi adalah penanaman kembali, misalnya di area bekas tambang.", "SMA11-G-B1-14", "reboisasi"),
    ("sistem kuota", False, "Sistem kuota adalah cara pengelolaan perikanan.", "SMA11-G-B1-14", "ikan_kuota"),
], guna="Pemetaan awal")

# ── Cek penguasaan (post-test): every lesson; no book assessment item (pp. 57-63), no lesson example.
cek(jam(8, "WIB", "WIT") == 10 and jam(8, "WIT", "WIB") == 6 and jam(8, "WIB", "WITA") == 9 and PROVINSI["Papua"] == "WIT" and PROVINSI["DKI Jakarta"] == "WIB")
soal("PB1", 1, "Saat pukul 08.00 di DKI Jakarta, pukul berapa di Provinsi Papua?", "C", [
    ("10.00", True, "Benar. Jakarta WIB (GMT + 7), Papua WIT (GMT + 9): dua jam lebih besar.", "", "=keppres"),
    ("06.00", False, "Selisihnya dikurangkan. Wilayah yang lebih timur jamnya lebih besar.", "SMA11-G-B1-04", "=keppres"),
    ("09.00", False, "Papua dianggap WITA. Menurut peta pembagian waktu, Papua memakai WIT.", "SMA11-G-B1-04", "=zona_wit"),
    ("11.00", False, "Selisihnya dianggap tiga jam karena ada tiga zona. Dari WIB ke WIT hanya dua langkah.", "SMA11-G-B1-04", "=keppres"),
], guna="Cek penguasaan", sulit="Sedang")
soal("PB2", 7, "Dalam pengelolaan perikanan berkelanjutan, menutup musim penangkapan bertujuan ...", "A", [
    ("agar jumlah induk ikan tidak berkurang", True, "Tepat. Juga agar waktu pemijahan dan pembesaran anak ikan tidak terganggu.", "", "ikan_musim"),
    ("menentukan bagian perairan yang boleh diambil ikannya pada musim tertentu", False, "Ini sistem kuota.", "SMA11-G-B1-14", "ikan_kuota"),
    ("larangan penangkapan anak ikan dengan ukuran jaring yang ditentukan", False, "Ini cara melestarikan anak ikan.", "SMA11-G-B1-14", "ikan_jaring"),
    ("larangan menangkap ikan di daerah pemijahan dan pembesaran ikan", False, "Ini menutup daerah perikanan, bukan menutup musim.", "SMA11-G-B1-14", "ikan_daerah"),
], guna="Cek penguasaan", sulit="Sedang")
soal("PB3", 2, "Musim kemarau di Indonesia terjadi karena ...", "B", [
    ("angin muson tenggara yang bersifat kering", True, "Tepat. Angin muson tenggara bersifat kering sehingga mendatangkan musim kemarau.", "", "muson"),
    ("angin muson barat laut yang mengandung banyak uap air laut", False, "Angin muson barat laut bersifat basah dan mendatangkan musim hujan.", "SMA11-G-B1-05", "muson"),
    ("penyinaran matahari sepanjang tahun sekitar 12 jam", False, "Penyinaran 12 jam adalah pengaruh letak astronomis terhadap suhu, bukan penyebab musim kemarau.", "SMA11-G-B1-03", "sinar_12jam"),
    ("dataran tinggi yang beriklim subtropis atau sedang", False, "Iklim dataran tinggi adalah pengaruh topografi, bukan penyebab musim kemarau.", "SMA11-G-B1-03", "iklim_topografi"),
], guna="Cek penguasaan", sulit="Sedang")
soal("PB4", 2, "Dua selat di Indonesia yang disebut sebagai jalur pelayaran dunia yang ramai adalah ...", "D", [
    ("Selat Sunda dan Selat Karimata", True, "Tepat. Kedua selat ini menghubungkan Indonesia dengan perairan dunia.", "", "selat"),
    ("Samudra Pasifik dan Samudra Hindia", False, "Keduanya samudra yang mengapit Indonesia, bukan selat.", "SMA11-G-B1-02", "geo_benua"),
    ("Dangkalan Sunda dan Dangkalan Sahul", False, "Keduanya dangkalan dalam letak geologis, bukan selat.", "SMA11-G-B1-02", "geo_tiga"),
    ("Sirkum Mediterania dan Sirkum Pasifik", False, "Keduanya jalur pegunungan muda, bukan selat.", "SMA11-G-B1-02", "geo_tiga"),
], guna="Cek penguasaan", sulit="Sedang")
cek("Nias" in BUSUR["luar"] and "Bali" in BUSUR["dalam"] and "Jawa" in BUSUR["dalam"])
soal("PB5", 3, "Pulau manakah yang merupakan bagian pegunungan busur luar yang tidak aktif?", "C", [
    ("Pulau Nias", True, "Tepat. Busur luar muncul sebagai Pulau Simeulue, Nias, Enggano, dan Kepulauan Mentawai.", "", "busur_luar"),
    ("Pulau Bali", False, "Bali berada pada busur dalam yang aktif (vulkanik).", "SMA11-G-B1-06", "busur_dalam"),
    ("Pulau Jawa", False, "Jawa berada pada busur dalam yang aktif, dengan gunung seperti Merapi, Bromo, dan Semeru.", "SMA11-G-B1-06", "busur_dalam"),
    ("Pulau Madura", False, "Madura disebut buku sebagai bagian Paparan Sunda, bukan busur luar.", "SMA11-G-B1-07", "paparan"),
], guna="Cek penguasaan", sulit="Sedang")
cek(sda("air") == ({"abiotik"}, {"dapat diperbarui"}, set()) and sda("mineral")[1] == {"tidak dapat diperbarui"}
    and sda("hewan peliharaan")[0] == {"biotik"} and sda("emas")[1] == {"tidak dapat diperbarui"})
soal("PB6", 4, "Manakah yang termasuk SDA nonhayati yang dapat diperbarui?", "B", [
    ("air", True, "Tepat. Air adalah benda mati (abiotik) dan termasuk SDA yang dapat diperbarui.", "", "abiotik"),
    ("mineral", False, "Mineral memang nonhayati, tetapi tidak dapat diperbarui.", "SMA11-G-B1-08", "abiotik"),
    ("hewan peliharaan", False, "Hewan peliharaan dapat diperbarui, tetapi termasuk SDA hayati (makhluk hidup).", "SMA11-G-B1-08", "biotik"),
    ("emas", False, "Emas nonhayati, tetapi termasuk SDA yang tidak dapat diperbarui.", "SMA11-G-B1-08", "unrenewable_contoh"),
], guna="Cek penguasaan", sulit="Sedang")
soal("PB7", 5, "Hutan yang fungsi pokoknya mengatur tata air, mencegah banjir, dan mencegah intrusi air laut disebut ...", "D", [
    ("hutan lindung", True, "Tepat. Hutan lindung melindungi sistem penyangga kehidupan.", "", "hutan_lindung"),
    ("hutan konservasi", False, "Fungsi pokok hutan konservasi adalah pengawetan keanekaragaman tumbuhan dan satwa.", "SMA11-G-B1-10", "hutan_konservasi"),
    ("hutan produksi", False, "Hutan produksi berfungsi memproduksi hasil hutan seperti kayu, rotan, dan gaharu.", "SMA11-G-B1-10", "hutan_produksi"),
    ("taman buru", False, "Taman buru adalah kawasan hutan untuk wisata berburu.", "SMA11-G-B1-10", "taman_buru"),
], guna="Cek penguasaan", sulit="Sedang")
soal("PB8", 6, "Provinsi yang menghasilkan 66,77% produksi bauksit nasional adalah ...", "A", [
    ("Kalimantan Barat", True, "Tepat. Contohnya Kabupaten Sanggau dan Tayan dengan cadangan besar.", "", "bauksit_kalbar"),
    ("Kepulauan Riau", False, "Kepulauan Riau berpotensi bauksit sekitar 180,97 juta ton, tetapi bukan penghasil 66,77%.", "SMA11-G-B1-11", "bauksit_lain"),
    ("Bangka Belitung", False, "Sigembir di Bangka Belitung termasuk daerah produksi bauksit terbesar, tetapi bukan 66,77% produksi nasional.", "SMA11-G-B1-11", "bauksit_lain"),
    ("Kalimantan Selatan", False, "Kalimantan Selatan dikenal sebagai daerah penambangan bijih besi skala besar.", "SMA11-G-B1-11", "besi_lokasi"),
], guna="Cek penguasaan", sulit="Sulit")

# ── Latihan (practice), by lesson.
soal("LT1", 1, "Pulau Rote, batas paling selatan Indonesia, terletak pada ...", "A", [
    ("11° 15' LS", True, "Benar. Pulau Rote berada pada 11° 15' LS, di Nusa Tenggara Timur.", "", "=batas_selatan"),
    ("6° 08' LU", False, "Ini letak Pulau We, batas paling utara.", "SMA11-G-B1-01", "=batas_utara"),
    ("95° 45' BT", False, "Ini letak Pulau Beureuh, batas paling barat.", "SMA11-G-B1-01", "=batas_barat"),
    ("141° 05' BT", False, "Ini letak Sungai Fly, batas paling timur.", "SMA11-G-B1-01", "=batas_timur"),
])
cek(6 < Fraction(47, 2) and 11 < Fraction(47, 2))
soal("LT2", 1, "Mengapa seluruh wilayah Indonesia beriklim tropis?", "C", [
    ("Karena seluruhnya berada di antara 23½° LU dan 23½° LS", True, "Tepat. Indonesia (6° LU – 11° LS) berada di dalam jalur iklim tropis.", "", "=zona_iklim"),
    ("Karena terletak di antara dua benua dan dua samudra", False, "Ini letak geografis, yang memengaruhi musim dan lalu lintas dunia.", "SMA11-G-B1-03", "geo_benua"),
    ("Karena dilalui dua jalur pegunungan muda dunia", False, "Ini letak geologis, yang memengaruhi gunung api dan topografi.", "SMA11-G-B1-03", "geo_tiga"),
    ("Karena berada di antara 95° Bujur Timur dan 141° Bujur Timur", False, "Bujur menentukan pembagian zona waktu, bukan jalur iklim.", "SMA11-G-B1-03", "ast_rentang"),
], sulit="Sedang")
cek(PROVINSI["Bali"] == "WITA" and PROVINSI["Kalimantan Barat"] == "WIB" and PROVINSI["Maluku"] == "WIT" and PROVINSI["Jawa Timur"] == "WIB")
soal("LT3", 1, "Provinsi manakah yang memakai WITA?", "D", [
    ("Bali", True, "Benar. Bali termasuk wilayah WITA (GMT + 8).", "", "zona_wita"),
    ("Kalimantan Barat", False, "Kalimantan Barat memakai WIB, berbeda dengan Kalimantan Selatan, Timur, dan Utara.", "SMA11-G-B1-04", "zona_wib"),
    ("Maluku", False, "Maluku memakai WIT.", "SMA11-G-B1-04", "zona_wit"),
    ("Jawa Timur", False, "Seluruh Pulau Jawa memakai WIB.", "SMA11-G-B1-04", "zona_wib"),
])
soal("LT4", 2, "Secara geografis, Indonesia terletak di antara ...", "B", [
    ("Benua Asia dan Australia serta Samudra Pasifik dan Hindia", True, "Tepat. Dua benua dan dua samudra.", "", "geo_benua"),
    ("Lempeng Eurasia, Lempeng Indo-Australia, dan Lempeng Pasifik", False, "Ketiga lempeng ini termasuk letak geologis.", "SMA11-G-B1-02", "geo_tiga"),
    ("Sirkum Mediterania dan Sirkum Pasifik", False, "Kedua jalur pegunungan muda ini termasuk letak geologis.", "SMA11-G-B1-02", "geo_tiga"),
    ("6° LU – 11° LS dan 95° BT – 141° BT", False, "Ini letak astronomis, menurut garis lintang dan bujur.", "SMA11-G-B1-02", "=ast_rentang"),
])
soal("LT5", 2, "Menurut letak geografisnya, apa yang menjadikan Indonesia negara agraris?", "A", [
    ("Dilalui dua angin muson yang mengakibatkan dua musim", True, "Tepat. Musim hujan dan musim kemarau menjadikan cuaca dan iklim yang cocok untuk pertanian.", "", "agraris"),
    ("Berada pada jalur silang lalu lintas pelayaran dan perdagangan dunia", False, "Ini keuntungan di bidang perdagangan, bukan penyebab negara agraris.", "SMA11-G-B1-03", "jalur_silang"),
    ("Banyak kapal negara luar singgah sehingga terjadi akulturasi budaya", False, "Ini keuntungan di bidang budaya.", "SMA11-G-B1-03", "akulturasi"),
    ("Ada 127 gunung berapi aktif", False, "Gunung api adalah pengaruh letak geologis, bukan letak geografis.", "SMA11-G-B1-02", "gunung_aktif"),
], sulit="Sedang")
soal("LT6", 3, "Menurut buku, provinsi dengan kejadian gempa bumi terbanyak adalah ...", "D", [
    ("Maluku", True, "Benar. Maluku diikuti Sulawesi Tengah, Maluku Utara, Nusa Tenggara Barat, dan Nusa Tenggara Timur.", "", "gempa_provinsi"),
    ("Sulawesi Tengah", False, "Sulawesi Tengah berada di urutan kedua.", "SMA11-G-B1-13", "gempa_provinsi"),
    ("Nusa Tenggara Timur", False, "Nusa Tenggara Timur berada di urutan kelima.", "SMA11-G-B1-13", "gempa_provinsi"),
    ("Kalimantan", False, "Kalimantan justru termasuk yang jarang mengalami gempa bumi.", "SMA11-G-B1-13", "gempa_provinsi"),
])
cek(round(71628 / 11 / 365) == 18)
soal("LT7", 3, "Dari tahun 2009 sampai 2019, rata-rata kejadian gempa di Indonesia setiap hari adalah ...", "B", [
    ("18 kejadian", True, "Benar. Rata-rata 6.512 kali setahun, 543 kali sebulan, dan 18 kali sehari.", "", "gempa_jumlah"),
    ("543 kejadian", False, "Ini rata-rata setiap bulan.", "SMA11-G-B1-13", "gempa_jumlah"),
    ("6.512 kejadian", False, "Ini rata-rata setiap tahun.", "SMA11-G-B1-13", "gempa_jumlah"),
    ("29 kejadian", False, "Ini jumlah gempa menurut data BNPB tahun 2020, bukan rata-rata harian 2009 sampai 2019.", "SMA11-G-B1-13", "gempa_2020"),
], sulit="Sedang")
soal("LT8", 3, "Bagaimana iklim di dataran tinggi, gunung, dan pegunungan Indonesia?", "C", [
    ("Subtropis atau sedang, sejuk atau dingin", True, "Tepat. Topografi yang beragam membuat iklim bervariasi.", "", "iklim_topografi"),
    ("Tropis dengan rata-rata suhu yang hangat", False, "Ini iklim dataran rendah.", "SMA11-G-B1-03", "iklim_topografi"),
    ("Tropis dengan kelembapan udara yang tinggi", False, "Ini gambaran umum iklim Indonesia karena letak astronomisnya, bukan iklim khusus dataran tinggi.", "SMA11-G-B1-03", "iklim_tropis"),
    ("Kering karena angin muson tenggara", False, "Angin muson tenggara mendatangkan musim kemarau di seluruh Indonesia, bukan iklim khusus dataran tinggi.", "SMA11-G-B1-05", "muson"),
])
soal("LT9", 4, "SDA hayati termasuk SDA yang dapat diperbarui karena ...", "A", [
    ("dapat terus meregenerasi selama lingkungan baik", True, "Tepat. Tumbuhan dan hewan dapat terus berkembang biak dan berproduksi.", "", "biotik_renewable"),
    ("berbentuk benda mati di lingkungan kita", False, "Ini ciri SDA nonhayati (abiotik).", "SMA11-G-B1-08", "abiotik"),
    ("akan habis setelah dipakai selama kurun waktu tertentu", False, "Ini ciri SDA yang tidak dapat diperbarui.", "SMA11-G-B1-08", "unrenewable"),
    ("dapat dimanfaatkan bentuk fisiknya", False, "Ini ciri SDA materi, pengelompokan menurut potensi.", "SMA11-G-B1-09", "potensi_materi"),
], sulit="Sedang")
cek("sinar matahari" in POTENSI["energi"])
soal("LT10", 4, "Menurut potensinya, sinar matahari termasuk SDA ...", "D", [
    ("energi", True, "Benar. Yang dimanfaatkan dari sinar matahari adalah energinya.", "", "potensi_energi"),
    ("materi", False, "SDA materi dimanfaatkan bentuk fisiknya, seperti kayu, emas, besi, dan batu.", "SMA11-G-B1-09", "potensi_materi"),
    ("ruang", False, "SDA ruang dipakai untuk tempat tinggal dan beraktivitas.", "SMA11-G-B1-09", "potensi_ruang"),
    ("hayati", False, "Hayati adalah pengelompokan menurut jenis (makhluk hidup); sinar matahari bukan makhluk hidup.", "SMA11-G-B1-08", "biotik_renewable"),
])
cek(max(HUTAN, key=HUTAN.get) == "Papua")
soal("LT11", 5, "Menurut data BPS (databoks, 2023), wilayah dengan tutupan hutan terluas di Indonesia adalah ...", "C", [
    ("Papua", True, "Benar. Papua memiliki tutupan hutan 32,9 juta hektare.", "", "hutan_luas"),
    ("Kalimantan", False, "Kalimantan di urutan kedua, 28,5 juta hektare.", "SMA11-G-B1-13", "hutan_luas"),
    ("Sumatra", False, "Sumatra di urutan ketiga, 16 juta hektare.", "SMA11-G-B1-13", "hutan_luas"),
    ("Jawa", False, "Jawa justru yang tersempit, 1,6 juta hektare.", "SMA11-G-B1-13", "hutan_luas"),
])
soal("LT12", 5, "Secara ekonomis, hutan mangrove dapat dimanfaatkan sebagai ...", "B", [
    ("sumber penghasil kayu dan tempat wisata", True, "Tepat. Juga sebagai bahan bangunan.", "", "mangrove"),
    ("mencegah erosi dan abrasi air laut", False, "Ini fungsi ekologis mangrove.", "SMA11-G-B1-10", "mangrove"),
    ("tempat pemijahan dan perkembangbiakan ikan", False, "Ini fungsi biologis mangrove.", "SMA11-G-B1-10", "mangrove"),
    ("sumber plasma nutfah", False, "Ini fungsi biologis mangrove.", "SMA11-G-B1-10", "mangrove"),
], sulit="Sedang")
soal("LT13", 5, "Terumbu karang sebagai benteng pelindung pesisir dari gelombang laut menjalankan fungsi ...", "A", [
    ("ekologis", True, "Benar. Benteng pesisir dan pencegahan abrasi adalah fungsi ekologis.", "", "karang_fungsi"),
    ("ekonomi", False, "Fungsi ekonomi terumbu karang adalah pendapatan keluarga melalui pariwisata.", "SMA11-G-B1-10", "karang_fungsi"),
    ("ketahanan pangan", False, "Fungsi ketahanan pangan adalah makanan tambahan yang mengandung protein.", "SMA11-G-B1-10", "karang_fungsi"),
    ("biologis", False, "Fungsi biologis disebut buku untuk mangrove, misalnya tempat pemijahan ikan.", "SMA11-G-B1-10", "mangrove"),
])
cek(set(GOLONGAN["C"]) == {"marmer", "pasir", "pasir kuarsa"})
soal("LT14", 6, "Bahan galian golongan C, yang mudah didapatkan, contohnya ...", "D", [
    ("marmer, pasir, dan pasir kuarsa", True, "Benar. Golongan C bukan golongan A atau B dan mudah didapatkan.", "", "golongan"),
    ("minyak bumi, batu bara, dan gas alam", False, "Ini golongan A, untuk pertahanan, keamanan, dan perekonomian negara.", "SMA11-G-B1-12", "golongan"),
    ("besi, mangan, dan tembaga", False, "Ini golongan B, strategis untuk kepentingan hidup orang banyak.", "SMA11-G-B1-12", "golongan"),
    ("alumunium, mangan, tembaga, dan timah di dasar laut", False, "Ini contoh tambang dasar laut yang tidak dapat diperbarui, bukan golongan C.", "SMA11-G-B1-12", "laut_jenis"),
])
soal("LT15", 6, "Menurut teori organik, minyak bumi terbentuk dari ...", "C", [
    ("penguraian mikroorganisme laut secara anaerob", True, "Tepat. Prosesnya terjadi dalam batuan berpori selama jutaan tahun.", "", "minyak_teori"),
    ("reaksi karbit dengan air yang menghasilkan asetilen", False, "Ini teori anorganik.", "SMA11-G-B1-15", "minyak_teori"),
    ("fosil tumbuhan yang tertimbun pada cekungan berisi air", False, "Ini proses terbentuknya batu bara.", "SMA11-G-B1-15", "batubara_asal"),
    ("proses magmatisme", False, "Ini proses terbentuknya emas.", "SMA11-G-B1-15", "emas_asal"),
], sulit="Sedang")
soal("LT16", 6, "Produksi nikel Indonesia, yang tertinggi di dunia, menyumbang berapa persen produksi nikel dunia?", "B", [
    ("48,48%", True, "Benar. 1,6 juta dari 3,3 juta metrik ton.", "", "nikel_produksi"),
    ("21%", False, "21% adalah bagian Indonesia dari cadangan nikel global, bukan produksi.", "SMA11-G-B1-13", "nikel_cadangan"),
    ("4,4%", False, "4,4% adalah bagian cadangan emas Indonesia dari cadangan emas dunia.", "SMA11-G-B1-13", "emas_cadangan"),
    ("66,77%", False, "66,77% adalah bagian Kalimantan Barat dari produksi bauksit nasional.", "SMA11-G-B1-13", "bauksit_kalbar"),
], sulit="Sedang")
soal("LT17", 6, "Wilayah penghasil timah terbesar di Indonesia adalah ...", "A", [
    ("Kepulauan Bangka Belitung", True, "Benar. Di sana berada PT Timah Tbk.", "", "timah_babel"),
    ("Mimika, Papua", False, "Mimika adalah penghasil tembaga terbesar.", "SMA11-G-B1-11", "tembaga_mimika"),
    ("Halmahera Timur di Maluku Utara", False, "Halmahera Timur adalah lokasi tambang nikel.", "SMA11-G-B1-11", "nikel_lokasi"),
    ("Kalimantan Selatan", False, "Kalimantan Selatan adalah daerah penambangan bijih besi skala besar.", "SMA11-G-B1-11", "besi_lokasi"),
])
soal("LT18", 7, "Contoh intensifikasi pertanian adalah ...", "C", [
    ("benih unggul, pemupukan tepat, dan pemberantasan hama", True, "Tepat. Intensifikasi meningkatkan produksi dengan cara modern dan produktif.", "", "intensifikasi"),
    ("pembukaan lahan pertanian baru melalui program transmigrasi", False, "Ini ekstensifikasi, memperluas lahan.", "SMA11-G-B1-14", "ekstensifikasi"),
    ("kegiatan inventarisasi, perencanaan, implementasi, dan pengawasan", False, "Ini aktivitas pengelolaan hutan berkelanjutan.", "SMA11-G-B1-14", "hutan_kelola"),
    ("sistem kuota dengan menentukan bagian perairan", False, "Ini cara pengelolaan perikanan.", "SMA11-G-B1-14", "ikan_kuota"),
])
soal("LT19", 7, "Industri berkelanjutan akan terwujud apabila ...", "B", [
    ("terdapat kombinasi yang seimbang dari ketiga faktor yang terpengaruh", True, "Tepat. Ketiga faktor itu adalah ekonomi, sosial, dan lingkungan.", "", "industri"),
    ("pendapatan masyarakat dan penerimaan pajak bagi pemerintah daerah meningkat", False, "Ini manfaat pariwisata berkelanjutan.", "SMA11-G-B1-14", "wisata_pad"),
    ("kegiatan inventarisasi, perencanaan, implementasi, dan pengawasan hutan", False, "Ini aktivitas pengelolaan hutan berkelanjutan.", "SMA11-G-B1-14", "hutan_kelola"),
    ("sistem kuota perairan disertai kontrol yang baik", False, "Ini cara pengelolaan perikanan.", "SMA11-G-B1-14", "ikan_kuota"),
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
cek({s["pel"] for s in POST} == {p["no"] for p in PELAJARAN}, "the post-test covers every lesson")
cek(sum(1 for s in POST if s["sulit"] == "Sedang") > len(POST) / 2, "post-test mostly Sedang")
HURUF = {}
for s in S:
    h = "ABCD"[[p[1] for p in s["pilihan"]].index(True)]
    HURUF[h] = HURUF.get(h, 0) + 1
cek(set(HURUF) == set("ABCD") and max(HURUF.values()) * 2 <= len(S) and max(HURUF.values()) - min(HURUF.values()) <= 3, HURUF)

# The post-test never reuses a book assessment question (pp. 57-63) or a lesson example. The
# topics the book's assessment asks, and the topic of each post-test question:
TOPIK_UJI = {"benua dan perdagangan", "samudra dan transit", "gempa dan lempeng", "tropis dan hutan hujan",
             "pengertian tak terbarukan", "pengelolaan tidak berkelanjutan", "penurunan produksi minyak", "strategi batu bara",
             "deforestasi global", "pengertian letak astronomis", "lempeng penyebab gempa", "bahan baku baterai",
             "pengertian berkelanjutan", "energi terbarukan", "keuntungan letak geografis", "corak iklim",
             "SDA belum menyejahterakan", "pengelolaan SDA tak terbarukan", "strategi SDA terbarukan"}
TOPIK_POST = {"PB1": "selisih zona waktu", "PB2": "penutupan musim penangkapan", "PB3": "penyebab musim kemarau",
              "PB4": "selat pelayaran dunia", "PB5": "pulau busur luar", "PB6": "SDA nonhayati dapat diperbarui",
              "PB7": "hutan lindung", "PB8": "sebaran bauksit"}
cek({s_["ref"] for s_ in POST} == set(TOPIK_POST) and not set(TOPIK_POST.values()) & TOPIK_UJI)
KUNCI_UJI = {"letak astronomis", "letak geologis", "nikel", "berkelanjutan", "hutan hujan tropis", "tak terbarukan", "energi alternatif"}
for s_ in POST:
    benar = next(p[0] for p in s_["pilihan"] if p[1]).lower()
    cek(not any(k in benar for k in KUNCI_UJI), f"{s_['ref']}: its key is a book assessment key")
# The lessons' worked examples: Kalimantan Barat to Bali at 10.00; 71.628 : 11; emas by sifat and potensi.
cek("Bali" not in POST[0]["tanya"] and "Kalimantan" not in POST[0]["tanya"] and not any("emas" == p[0] for s_ in POST for p in s_["pilihan"] if p[1]))


# Facts read off a figure whose words the PDF's text layer lays out in another order: Gambar 1.3
# (the climate belts, p. 5) and Gambar 1.21 (the forest chart, p. 21, an image with no text layer).
GAMBAR = {"zona_iklim", "hutan_luas"}


def periksa_kutipan(path):
    """Every quotation is in the book's text (whitespace, punctuation and ligatures aside). The
    figure quotations (time zones, the climate belts, the forest chart) are the figure's words in
    reading order; those that the PDF's text layer lays out differently are reported, not failed."""
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
                c.number_format = "@"   # 10.00 and 48,48% stay text

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
    tulis(os.path.join(here, "SMA11-Geografi-Bab1.xlsx"))
    tulis_miskonsepsi(os.path.join(here, "SMA11-Geografi-Bab1-miskonsepsi.csv"))
    halaman = sum(p["isi"].count("## ") for p in PELAJARAN)
    print(f"SMA11-Geografi-Bab1.xlsx: lessons {len(PELAJARAN)} ({halaman} pages), questions {len(S)} "
          f"(pre {len(PRE)}, post {len(POST)}, practice {len(LAT)}), answers "
          + " ".join(f"{h}={HURUF[h]}" for h in "ABCD"))
    print(f"SMA11-Geografi-Bab1-miskonsepsi.csv: {len(MISKONSEPSI)} codes")
    print(f"facts traced: {len(FAKTA)} (pages {min(h for h, _ in FAKTA.values())}-{max(h for h, _ in FAKTA.values())})")
    if "--kutipan" in sys.argv:
        ada, gambar = periksa_kutipan(sys.argv[sys.argv.index("--kutipan") + 1])
        print(f"quotations found in the book's text: {ada} of {len(FAKTA)}; figures read by eye: {', '.join(gambar) or 'none'}")
    print(f"assertions passed: {CEK[0]}")
