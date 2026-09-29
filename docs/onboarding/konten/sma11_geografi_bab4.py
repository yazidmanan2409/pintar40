# SMA Kelas XI, Geografi, Bab 4 "Perubahan Iklim dan Kebencanaan", as a PINTAR lesson workbook in the
# D-007 template (sheets Kursus, Bab, Pelajaran, Soal, Pilihan; the column contract is KOLOM in
# src/lib/unggah-kontrak.ts). Built the way Bab 1 to 3 were (LANA-10 to LANA-12, passed).
#
# Source: the student book "Geografi untuk SMA/MA Kelas XI (Edisi Revisi)" (Budi Handoyo, Nisa
# Maulia; Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi, 2024), Bab IV, pp. 195-252.
# The book has no answer keys, so every key here is ours, and every question is answerable from its
# text.
#
# Every fact is traced, as in Bab 1 to 3:
#   - FAKTA holds the chapter's facts, each with its page and a quotation from the book;
#   - every option names the fact it rests on (a distractor is a true fact that answers a
#     different question), and the generator checks the option's content words against that
#     fact's quotation;
#   - what can be computed is asserted: the Sitiarjo flood figures, and the book's own
#     inconsistencies (the count of kerentanan types, the tsunami threshold, the Riau months);
#   - classifications are checked against models built from the book's own lists: the four
#     kinds of kerentanan, the mitigation and the adaptation for each disaster, the forms of flood
#     adaptation and those of Desa Sungai Tohor.
# With `--kutipan <text file of the book>` every quotation is also checked against the book's text.
#
# Text lessons only (D-050): what a figure shows is put into words, one fact per line. Statements
# that are doubtful from outside the book are kept out of lessons and questions, and the
# generator asserts it. The workbook's "Kode miskonsepsi" column stays empty; the proposed codes go
# to SMA11-Geografi-Bab4-miskonsepsi.csv.
#
# Run: python3 docs/onboarding/konten/sma11_geografi_bab4.py [--kutipan book.txt]
import csv
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
    """Lower case, the fi/fl ligatures as the PDF extracts them ("isik", "proil"), and only letters
    and digits, so a quotation can be found in the extracted text."""
    teks = teks.lower().replace("ﬁ", "i").replace("ﬂ", "l").replace("fi", "i").replace("fl", "l")
    return re.sub(r"[^0-9a-z]", "", teks)


FAKTA = {}


def fakta(id_, hal, kutipan):
    cek(id_ not in FAKTA, id_)
    FAKTA[id_] = (hal, kutipan)


# A. Perubahan iklim (pp. 198-200)
fakta("musim", 198, "Musim hujan di sebagian besar wilayah Indonesia secara umum berlangsung pada bulan Oktober-April dan kemarau pada bulan April-Oktober.")
fakta("iklim_def", 198, "Iklim merupakan keadaan rata-rata cuaca yang terjadi dalam waktu yang lama dan wilayah yang luas.")
fakta("iklim_30", 198, "Iklim berubah dalam waktu yang lama (lebih 30 tahun), sedangkan cuaca berubah sewaktu-waktu.")
fakta("cuaca_sempit", 198, "Sedangkan cuaca berlangsung cepat dan wilayahnya sempit.")
fakta("perubahan_iklim_def", 198, "Perubahan iklim adalah perubahan suhu rata-rata udara di atas bumi, pola hujan, dan angin yang berlangsung secara regional atau global dalam waktu yang panjang")
fakta("unsur_iklim", 199, "fenomena perubahan iklim berkaitan dengan perubahan unsur-unsur iklim, seperti suhu udara yang meningkat, curah hujan kurang menentu, dan angin yang makin kuat.")
fakta("gejala_hujan", 199, "Pola hujan yang berubah. Pola curah hujan menjadi tidak teratur. Daerah-daerah yang tadinya basah dapat menjadi lebih kering dan daerah-daerah yang tadinya kering dapat menjadi lebih basah.")
fakta("gejala_ekstrem", 199, "Peningkatan intensitas cuaca ekstrem. Badai tropis, topan, banjir, dan kekeringan lebih sering dan lebih intens terjadi.")
fakta("gejala_musim", 199, "Pergeseran musim. Musim panas dan dingin, musim hujan dan kemarau mengalami pergeseran yang mempengaruhi pola tanam, panen, dan migrasi hewan.")
fakta("gejala_ekosistem", 199, "Perubahan iklim dapat menyebabkan kerusakan pada ekosistem, termasuk pemutihan (bleaching) terumbu karang, perubahan dalam distribusi spesies, dan penurunan keanekaragaman hayati.")
fakta("gejala_laut", 199, "Permukaan laut meningkat. Pemanasan global menyebabkan es di kutub-kutub mencair dan air laut memperluas volume ketika suhu meningkat sehingga mengakibatkan peningkatan permukaan laut.")
fakta("gejala_penyakit", 200, "Perubahan iklim dapat mempengaruhi kesehatan manusia melalui peningkatan penyakit menular, perubahan pola alergi, dan dampak langsung dari cuaca ekstrem.")
# B. Pemanasan global (pp. 201-203)
fakta("grk_jenis", 201, "Gas-gas rumah kaca antara lain karbon dioksida (CO2), metana (CH 4), nitrous oksida (N 2O), dan uap air (H 2O).")
fakta("grk_aktivitas", 201, "Aktivitas manusia, seperti pembakaran bahan bakar fosil, deforestasi, dan pertanian intensif telah meningkatkan konsentrasi gas-gas tersebut di atmosfer, sehingga memperkuat efek rumah kaca.")
fakta("pg_def", 201, "Pemanasan global adalah peningkatan suhu rata-rata permukaan bumi secara bertahap yang disebabkan oleh peningkatan konsentrasi gas-gas rumah kaca di atmosfer.")
fakta("grk_panas", 201, "dan uap air menangkap panas dari sinar matahari yang dipancarkan kembali oleh permukaan bumi.")
fakta("siklus", 202, "Peningkatan suhu global dapat memicu perubahan dalam siklus alami, seperti pencairan es di Kutub Utara dan Selatan, peningkatan penguapan air dari lautan, dan perubahan pola cuaca.")
fakta("co2_sumber", 203, "Gas ini dihasilkan dari pembakaran bahan bakar fosil, seperti batu bara, minyak bumi, dan gas alam, serta aktivitas industri, pembakaran hutan, dan perubahan penggunaan lahan.")
fakta("metana", 203, "Metana adalah gas rumah kaca yang lebih kuat daripada CO2, tetapi jumlahnya lebih sedikit di atmosfer. Gas ini dihasilkan dari aktivitas manusia, seperti produksi dan transportasi gas alam, produksi peternakan, dan pembuangan sampah organik.")
fakta("n2o", 203, "Penggunaan pupuk sintetis dalam pertanian adalah sumber utama emisi N2O.")
fakta("hfc", 203, "hydrofluorocarbon (HFC) yang digunakan dalam refrigerasi dan pendinginan.")
# C. Pengaruh perubahan iklim terhadap wilayah Indonesia (pp. 204-210)
fakta("kepulauan", 205, "Wilayah-wilayah kepulauan yang terdampak antara lain Kepulauan Riau, Kepulauan Bangka Belitung, dan Kepulauan Seribu di sekitar Jakarta.")
fakta("kepulauan_hilang", 205, "Sebagian pulau hilang tak terlihat lagi dan sebagian yang lain kadang muncul dan kadang tenggelam.")
fakta("pesisir_jawa", 206, "Daerah pesisir utara Jawa, termasuk wilayah Jakarta, Bekasi, Semarang, Demak, Pati, Tuban dan sekitarnya terdampak kenaikan muka air laut.")
fakta("pesisir_kalimantan", 206, "Ini dapat berdampak pada keseimbangan ekosistem mangrove dan lahan basah lainnya yang penting sebagai penahan banjir dan perlindungan dari badai.")
fakta("pesisir_papua", 206, "rentan terhadap kenaikan muka air laut karena bentang alam yang datar dan pulau-pulau kecil yang tersebar di sepanjang pantai.")
fakta("pesisir_sulawesi", 206, "Wilayah pesisir di sekitar Sulawesi dan Maluku juga menghadapi risiko kenaikan muka air laut, mengingat banyaknya pulau kecil dan topografi yang berbukit-bukit.")
fakta("daratan_suhu", 207, "Kebutuhan prasarana listrik dan pendingin AC meningkat dan akhirnya biaya hidup meningkat atau lebih mahal.")
fakta("daratan_musim", 208, "kadang datang lebih awal dan kadang lebih lambat yang berdampak pada pola musim tanam yang dapat menurunkan produksi panen.")
fakta("daratan_kering", 208, "Perubahan iklim telah membuat wilayah yang mengalami kekeringan semakin luas.")
fakta("daratan_banjir", 209, "Namun, belakangan bencana alam tersebut makin meluas dan semakin sering terjadi.")
fakta("daratan_infra", 210, "Naiknya permukaan air laut di wilayah pesisir mengakibatkan kerusakan infrastruktur jalan dan bangunan perkampungan penduduk.")
fakta("daratan_sda", 210, "Wilayah pesisir memiliki banyak sumber daya alam, seperti hutan mangrove, tambak ikan, dan udang. Kenaikan permukaan air laut mengakibatkan kehilangan sumber daya alam tersebut.")
# D.1.a Bencana dan dinamikanya (pp. 211-214)
fakta("bencana_tiba", 211, "Bencana merupakan suatu kenyataan yang harus dihadapi meskipun datangnya secara tiba-tiba dan sulit diprediksi.")
fakta("bencana_def", 211, "Suatu peristiwa atau rangkaian peristiwa yang mengganggu dan mengancam kehidupan manusia dari faktor alam atau nonalam sehingga mengakibatkan kerugian, seperti kerugian harta benda, kerusakan lingkungan, hingga korban jiwa.")
fakta("kerentanan_umur", 211, "seringkali kita melihat ada kelompok umur anak-anak dan orang tua mendapatkan perhatian khusus dalam proses evakuasi.")
fakta("kerentanan_def", 211, "Kerentanan merupakan keadaan manusia yang menyebabkan ketidakmampuan dalam merespons (perilaku) ancaman.")
fakta("ker_sosial", 212, "Kerentanan sosial adalah kondisi kerapuhan sosial dalam merespons bencana meliputi aspek angka kepadatan penduduk, pertumbuhan penduduk, serta persentase penduduk usia tua dan anak-anak.")
fakta("ker_fisik", 212, "Kerentanan fisik merupakan komponen kerentanan atas fisik benda berharga yang dapat hilang atau rusak apabila terkena ancaman.")
fakta("ker_lingkungan", 212, "Kerentanan lingkungan biasanya dikaitkan dengan kondisi sumberdaya alam seperti hutan lindung, hutan alam, hutan bakau/mangrove, semak belukar dan rawa.")
fakta("ker_ekonomi", 212, "Kerentanan ekonomi adalah kondisi kerapuhan ekonomi dalam merespon bencana yang terjadi meliputi aspek angka persentase rumah tangga yang bekerja dari sektor rentan dan angka persentase rumah tangga dengan ekonomi yang rendah.")
fakta("ancaman_def", 212, "Ancaman adalah peristiwa yang berpotensi mengakibatkan kerugian, kerusakan lingkungan, dan korban jiwa")
fakta("ancaman_sebab", 212, "Penyebab ancaman adalah faktor teknologi, manusia, lingkungan, dan alam.")
fakta("ancaman_bencana", 212, "Ancaman menjadi bencana ketika manusia tidak memiliki kapasitas mengatasi suatu ancaman dan kondisinya dalam keadaan rentan. Sebaliknya, ketika manusia memiliki kapasitas dan tidak dalam kondisi rentan maka suatu ancaman tidak akan menjadi bencana.")
fakta("sitiarjo", 212, "Ketika terjadi banjir penduduk Desa Sitiarjo, Kabupaten Malang tahun 2013 menggenangi 847 KK rumah, sedangkan tahun 2017 menggenangi 350 KK rumah.")
fakta("kapasitas_def", 212, "Kapasitas adalah penguasaan sumber daya dan kemampuan yang dimiliki masyarakat untuk mempersiapkan diri dalam mencegah, menanggulangi, meredam, dan memulihkan kondisi akibat bencana.")
fakta("kapasitas_cara", 213, "dengan kegiatan pencegahan terhadap terjadinya ancaman, mengurangi kekuatan ancaman, dan mengurangi kerentanan terhadap ancaman.")
fakta("semeru", 214, "Korban tersebut dapat terjadi karena ancaman letusan yang tinggi, kerentanan masyarakat yang tinggi, sementara kapasitas dalam mitigasi diri masih kurang.")
# D.1.b Jenis bencana alam (pp. 214-227)
fakta("bencana_alam_def", 214, "Bencana alam merupakan peristiwa yang diakibatkan oleh kejadian atau serangkaian kejadian yang disebabkan oleh alam, antara lain berupa gempa bumi, tsunami, gunung meletus, banjir, kekeringan, angin topan, dan tanah longsor.")
fakta("gempa_def", 214, "Gempa bumi adalah peristiwa terjadinya getaran atau guncangan hingga mencapai permukaan bumi sebagai akibat energi yang dilepaskan dari dalam secara tiba-tiba yang menghasilkan gelombang seismik.")
fakta("lombok", 215, "gempa bumi di Lombok 5 Agustus 2018 dengan magnitudo 7,0 dan kedalaman 15 km.")
fakta("lempeng", 215, "Indonesia memiliki potensi gempa karena berada di atas lempeng Eurasia, Pasifik, dan Indo-Australia.")
fakta("pasifik", 215, "Zona lempeng Pasifik dicirikan dengan adanya palung yang dalam. Lempeng ini berada di Halmahera dan bagian utara Papua.")
fakta("indoaus", 215, "zona lempeng Indo-Australia dan Eurasia berada di lepas pantai selatan Nusa Tenggara, selatan Jawa, dan barat Sumatra.")
fakta("gempa_dampak", 215, "Munculnya rekahan (patahan), longsoran, dan luncuran tanah yang dapat terjadi bersamaan dengan gempa.")
fakta("gempa_tsunami", 215, "Terjadi tsunami jika gempa bumi berasal dari laut dangkal.")
fakta("gempa_patahan", 215, "Bencana gempa bumi sebagian besar diakibatkan oleh patahan (aktivitas tektonik atau deformasi batuan).")
fakta("gempa_wilayah", 216, "Sumatra, Jawa, Nusa Tenggara, Sulawesi bagian utara, dan Papua bagian utara merupakan wilayah potensi gempa.")
fakta("palu", 216, "tsunami berketinggian sekitar 6 m di Palu pada 28 September 2018 yang dipicu oleh gempa bumi dengan kekuatan 7,4 SR")
fakta("tsunami_dampak", 217, "Menyebabkan gagal panen, genangan air, dan pencemaran air asin pada tanah maupun air bersih.")
fakta("tsunami_wilayah", 217, "Wilayah Sumatra bagian selatan, kepulauan Maluku, dan Papua bagian utara memiliki risiko tsunami yang tinggi.")
fakta("erupsi", 218, "Fenomena proses keluarnya magma dari dalam bumi berupa material cair dan padat ke permukaan bumi disebut erupsi. Material-material tersebut meliputi lahar, bom, awan panas, debu vulkanik, dan lapili.")
fakta("erupsi_tanda", 218, "Fenomena bencana ini ditandai adanya getaran gempa kecil, perubahan suhu yang meningkat, layunya tumbuhan di lereng gunung, bermigrasinya binatang, keringnya mata air, dan suara gemuruh yang sering terdengar")
fakta("abu", 218, "Tercemarnya udara dari abu vulkanik, seperti Sulfur Dioksida, Nitrogen Dioksida, Hidrogen Sulfida, dan partikel debu lain yang dapat membunuh makhluk hidup.")
fakta("gunung_ispa", 218, "Material letusan gunung berapi berpotensi menyebabkan penyakit seperti ISPA.")
fakta("gunung_sebaran", 218, "Persebaran gunung berapi di Indonesia berhubungan dengan lokasi zona subduksi lempeng seperti Sumatra, Jawa, Nusa tenggara, Maluku, dan Sulawesi.")
fakta("longsor_sebab", 220, "Kombinasi dari berbagai kondisi seperti lereng terjal, curah hujan tinggi, pengikisan tanah yang tinggi, getaran, tutupan vegetasi yang berkurang, dan tanah yang kurang padat serta tebal memicu terjadinya tanah longsor.")
fakta("longsor_rugi", 220, "buruknya sanitasi lingkungan, harga tanah menurun, infrastruktur di lokasi longsor rusak, jalur transportasi terputus, dan perekonomian tersendat.")
fakta("madiun", 220, "tanah longsor di Madiun pada 2 April 2021 akibat hujan deras di seluruh wilayah Kabupaten Madiun dan lereng Gunung Wilis selama tujuh jam.")
fakta("longsor_wilayah", 220, "Banyak wilayah Indonesia yang berpotensi mengalami bencana tersebut seperti Kabupaten Bogor, Cianjur, Bandung, Purwakarta, Sukabumi, Tegal, Purbalingga, dan Sumedang.")
fakta("banjir_def", 221, "Banjir merupakan peristiwa tergenangnya air dalam jangka waktu tertentu pada wilayah yang mulanya tidak tergenang.")
fakta("banjir_hujan", 221, "Penyebab bencana ini yaitu curah hujan lebat yang berlangsung lama sehingga menyebabkan danau, sungai, atau drainase meluap karena melebihi daya tampungnya.")
fakta("banjir_manusia", 221, "banjir juga diakibatkan oleh perilaku manusia, seperti penggundulan hutan, hunian di bantaran sungai, alih fungsi lahan, pembuangan sampah sembarangan, dan kurangnya daerah resapan air")
fakta("banjir_jakarta", 221, "yang diakibatkan gegabahnya pengelolaan di daerah hulu sehingga membuat limpasan air yang dahsyat.")
fakta("sentani", 222, "Banjir bandang disertai longsor di Sentani, Jayapura pada tanggal 16 – 17 Maret 2019 yang terjadi karena intensitas hujan tinggi dan gundulnya pegunungan Cycloop.")
fakta("kalsel", 222, "Banjir Kalimantan Selatan yang terjadi pada 9 – 29 Januari 2021 akibat anomali cuaca dan curah hujan dengan intensitas tinggi sehingga memicu luapan air sungai.")
fakta("kekeringan_def", 223, "Keadaan kelangkaan air dari sumber hujan pada periode tertentu, satu atau lebih musim penghujan, yang menyebabkan kekurangan air di berbagai kegiatan, lingkungan, atau masyarakat tertentu disebut bencana kekeringan")
fakta("kekeringan_ciri", 223, "Bencana kekeringan terjadi secara perlahan, berlangsung lama hingga musim hujan tiba, berdampak sangat luas, serta bersifat lintas sektor")
fakta("kekeringan_wilayah", 224, "Ancaman bencana kekeringan yang tinggi terdapat pada sebagian besar Pulau Sumatra, Jawa, Kalimantan, dan Papua.")
fakta("kekeringan_faktor", 224, "kondisi curah hujan, iklim yang kering, lahan yang mampu meloloskan air, atau adanya fenomena el nino.")
fakta("karhutla_elnino", 225, "Suatu wilayah akan sangat rentan terjadi karhutla jika didukung adanya fenomena alam El Nino yang membuat curah hujan berkurang dan terjadi peningkatan suhu panas disertai angin")
fakta("riau_tebas", 225, "Salah satu penyebab kebakaran hutan dan lahan di Provinsi Riau adalah aktivitas masyarakat menggunakan metode tebas bakar (slash and burn) untuk pengolahan lahan perkebunan.")
fakta("karhutla_asap", 226, "Asap yang ditimbulkan dapat menyebabkan penyakit Infeksi Saluran Pernafasan Atas (ISPA), asma, penyakit paru obstruktif kronik, penyakit jantung serta iritasi pada mata, tenggorokan dan hidung.")
fakta("karhutla_wilayah", 226, "Bencana ini terutama terjadi di Kalimantan, Sumatra, dan Jawa.")
fakta("puting", 227, "Intensitas fenomena hidrometeorologis yang meningkat pada musim pancaroba (peralihan) mengakibatkan bencana puting beliung. Angin ini merupakan bagian proses pertumbuhan dari awan Cumulonimbus yang muncul akibat intensifnya pemanasan. Ancaman fenomena skala lokal ini sulit diprediksi")
# D.2 Mitigasi (pp. 230-235)
fakta("mitigasi_def", 230, "Mitigasi bencana merupakan serangkaian kegiatan (upaya, strategi, kebijakan, dan kegiatan terkait lainnya) untuk mengurangi risiko bencana.")
fakta("mitigasi_proses", 230, "Proses mitigasi dapat dilakukan dengan kegiatan penyadaran (penyuluhan), pembangunan fisik (sarana prasarana), dan peningkatan kemampuan (kapasitas) menghadapi ancaman bencana.")
fakta("mitigasi_tujuan", 230, "Dampak kerugian dapat dikurangi (kerugian nyawa dan kerusakan lingkungan).")
fakta("struktural", 230, "Mitigasi struktural dilakukan melalui upaya pembangunan fisik maupun sebuah pembangunan prasarana masyarakat dalam hal pengurangan risiko bencana.")
fakta("nonstruktural", 230, "Mitigasi nonstruktural dilakukan dalam upaya penyadaran atau pendidikan dalam mengurangi risiko bencana")
fakta("mit_tsunami", 231, "Penanaman mangrove (bakau) di sepanjang pantai untuk menghambat gelombang tsunami.")
fakta("mit_tsunami_data", 231, "gempa dengan pusat getaran di laut dangkal (0-30 km) hingga laut tengah, kekuatan paling rendah 6,5, SR, dan pola sesar yang turun atau naik.")
fakta("mit_gunung", 232, "Pembangunan tanggul untuk menahan lahar.")
fakta("mit_gunung_selidik", 232, "Penyelidikan gunung berapi menggunakan metode geologi, geofisika, dan geokimia.")
fakta("mit_gempa", 232, "Mendirikan bangunan sesuai aturan baku (tahan gempa).")
fakta("mit_gempa_evakuasi", 233, "Memahami jalur evakuasi dan mengikuti kegiatan simulasi mitigasi bencana gempa.")
fakta("mit_longsor_lereng", 233, "Mengurangi tingkat keterjalan lereng.")
fakta("mit_longsor_teras", 233, "Membuat terasering dengan sistem drainase yang tepat.")
fakta("mit_longsor_hijau", 233, "Melakukan penghijauan dengan tanaman berakar dalam.")
fakta("mit_banjir_waduk", 234, "Pembangunan waduk untuk mencegah terjadinya banjir.")
fakta("mit_banjir_das", 234, "Penataan daerah aliran sungai.")
fakta("mit_banjir_keruk", 234, "Pembersihan sampah dan pengerukan endapan sungai dilakukan secara berkala.")
fakta("mit_kering_irigasi", 235, "Membangun atau melakukan rehabilitasi terhadap jaringan irigasi.")
fakta("mit_kering_hemat", 235, "Melakukan sosialisasi untuk penghematan air.")
# D.3 Adaptasi (pp. 237-243)
fakta("adaptasi_def", 237, "Adaptasi bencana adalah serangkaian upaya atau cara manusia untuk bertahan hidup dengan melakukan penyesuaian lingkungan.")
fakta("adaptasi_faktor", 237, "Kemampuan beradaptasi ditentukan oleh kapasitas, pengambilan keputusan dalam masyarakat, dan ketersediaan teknologi.")
fakta("adp_gempa", 237, "Perubahan konstruksi rumah sebagai bentuk adaptasi terhadap bencana gempa bumi merupakan wujud strategi adaptasi fisik")
fakta("living_food", 237, "aktivitas living food bank yaitu menanam tanaman palawija, kelapa, jengkol, rambutan, pisang, ubi kayu, ubi jalar, dan sebagainya.")
fakta("adp_tsunami", 238, "Upaya adaptasi dalam menghadapi bencana tsunami antara lain sebagai berikut. Mengaktifkan partisipasi masyarakat wilayah pesisir yang mempunyai pengalaman dan pengetahuan terkait bencana gempa yang berpotensi tsunami. Melakukan pembangunan breakwater")
fakta("adp_gunung", 238, "pembuatan rumah yang kokoh, dinding rumah yang tebal, dan atap rumah yang tahan terhadap hujan air dan hujan abu.")
fakta("adp_longsor", 239, "Adaptation by reaction adalah adaptasi yang dilakukan dengan penanaman beberapa pohon di lokasi yang terkena tanah longsor. Adaptation by adjustment, strategi perubahan perilaku masyarakat terhadap lingkungan menjadi lebih baik. Selanjutnya adaptation by withdrawal yaitu adaptasi dengan cara keluar dari lingkungan tempat tinggal ke tempat yang lebih aman.")
fakta("adp_aktif", 240, "Adaptasi aktif ialah strategi optimalisasi sumber daya manusia untuk aktivitas kehidupan sehari-hari dalam menghadapi dinamika lingkungan disebut adaptasi fisik. Contohnya menjadi ojek perahu, meninggikan rumah (dua lantai), dan meninggikan perlengkapan rumah tangga dengan berbagai teknik tertentu.")
fakta("adp_pasif", 240, "Beberapa adaptasi pasif terhadap bencana banjir antara lain pengetahuan prakiraan bulan hujan yang berisiko banjir sehingga masyarakat dapat mempersiapkan diri.")
fakta("adp_sosial", 240, "Adaptasi sosial ketika menghadapi bencana banjir diwujudkan dalam bentuk gotong royong dan rasa solidaritas antarwarga masyarakat")
fakta("adp_ekonomi", 240, "adaptasi ekonomi masyarakat meliputi bantuan gratis dari lembaga-lembaga sosial seperti bantuan makanan, pakaian, dan sebagainya.")
fakta("adp_budaya", 240, "Adaptasi budaya. Ketika bencana banjir datang, masyarakat akan mengadakan tahlilan dan istighosah")
fakta("rob_tambak", 241, "Adaptasi pada lahan tambak, dalam menghadapi rob dapat dilakukan dengan meninggikan tanggul tambak dan memasang jaring waring di sekeliling tambak.")
fakta("rob_ekonomi", 241, "Masyarakat bisa beralih mata pencaharian yang awalnya petani tambak dan nelayan menjadi buruh, pedagang")
fakta("adp_kering_das", 241, "Meningkatkan daya dukung DAS sebagai daerah resapan air.")
fakta("adp_kering_irigasi", 242, "Mengembangkan teknologi irigasi baru untuk intensifikasi pertanian (spray and drip irrigation) sekaligus untuk penghematan air.")
fakta("tohor_fisik", 242, "Adaptasi fisik, keberadaan sekat kanal dan embung di lahan sebagai cadangan menampung air untuk kebun dan saat terjadi kebakaran")
fakta("tohor_ekonomi", 242, "Adaptasi ekonomi, masyarakat mengerjakan beberapa pekerjaan untuk sumber pendapatan sebagai petani, buruh potong, dan buruh angkut tual sagu")
fakta("tohor_struktural", 242, "Adaptasi struktural, masyarakat mengupayakan berbagai aktivitas ramah lingkungan gambut dan melakukan kerjasama dengan pemerintah dan kelembagaan desa")
fakta("tohor_kultural", 243, "Adaptasi kultural, masyarakat menghindari kebiasaan membuka lahan dengan memerun yaitu membakar sisa kayu-kayuan sebagai budaya masyarakat Desa Sungai Tohor.")
fakta("adp_puting", 243, "masyarakat perlu beradaptasi dengan meningkatkan struktur fisik bangunan hunian serta meningkatkan kemampuan serta pengetahuan dalam menghadapi bencana puting beliung")
# For the book-error record only (not used in lessons or questions)
fakta("kerentanan_3", 212, "Ada 3 jenis kerentanan, yaitu:")
fakta("banyuwangi", 216, "Tsunami setinggi 7 m di Banyuwangi pada 03 Juni 1994 dipicu oleh gempa bermagnitudo 5,9")
fakta("riau_8", 225, "Status siaga darurat ditetapkan pada kebakaran hutan yang melanda provinsi Riau selama 8 bulan (1 Januari–31 Oktober 2019)")
fakta("co2_banyak", 203, "CO2 adalah gas rumah kaca yang paling umum dan paling banyak di atmosfer.")
fakta("uap_air", 203, "Uap air merupakan gas rumah kaca yang paling melimpah di atmosfer.")
fakta("cihanjuang", 220, "tanah longsor di Cihanjuang, Sumedang pada 9 Januari 202 yang disebabkan hujan deras")
REKAMAN = {"kerentanan_3", "banyuwangi", "riau_8", "co2_banyak", "uap_air", "cihanjuang"}

GAMBAR = set()   # every quotation here is in the book's text layer

# ── What can be computed ──
cek(847 - 350 == 497 and 350 < 847)                                                              # Sitiarjo, p. 212
# BOOK INCONSISTENCIES (checked here, kept out of lessons and questions):
# p. 212 announces 3 kinds of kerentanan and lists four (a-d);
KERENTANAN = {"sosial": "ker_sosial", "fisik": "ker_fisik", "lingkungan": "ker_lingkungan", "ekonomi": "ker_ekonomi"}
cek(all(norm("Kerentanan " + k) in norm(FAKTA[f][1]) for k, f in KERENTANAN.items()) and len(KERENTANAN) == 4 != 3)
# p. 231 gives 6,5 SR as the lowest tsunami-making strength, but p. 216 has a tsunami from a 5,9;
cek(5.9 < 6.5)
# p. 225 calls 1 Januari-31 Oktober 2019 "8 bulan"; it is ten months;
cek(len(range(1, 10 + 1)) == 10 != 8)
# p. 203 calls both CO2 "paling banyak" and uap air "paling melimpah" in the atmosphere.
cek("paling banyak" in FAKTA["co2_banyak"][1] and "paling melimpah" in FAKTA["uap_air"][1])

# Classifications from the book's own lists.
GRK = ["karbon dioksida", "metana", "nitrous oksida", "uap air"]
cek(all(norm(g) in norm(FAKTA["grk_jenis"][1]) for g in GRK))
MITIGASI = {"tsunami": ["mit_tsunami"], "gunung": ["mit_gunung", "mit_gunung_selidik"], "gempa": ["mit_gempa", "mit_gempa_evakuasi"],
            "longsor": ["mit_longsor_lereng", "mit_longsor_teras", "mit_longsor_hijau"],
            "banjir": ["mit_banjir_waduk", "mit_banjir_das", "mit_banjir_keruk"], "kekeringan": ["mit_kering_irigasi", "mit_kering_hemat"]}
cek(len({f for v in MITIGASI.values() for f in v}) == sum(len(v) for v in MITIGASI.values()))
ADAPTASI_BANJIR = {"aktif": "adp_aktif", "pasif": "adp_pasif", "sosial": "adp_sosial", "ekonomi": "adp_ekonomi", "budaya": "adp_budaya"}
cek(all(norm("adaptasi " + k) in norm(FAKTA[f][1]) for k, f in ADAPTASI_BANJIR.items()))
TOHOR = {"fisik": "tohor_fisik", "ekonomi": "tohor_ekonomi", "struktural": "tohor_struktural", "kultural": "tohor_kultural"}
cek(all(norm("Adaptasi " + k) in norm(FAKTA[f][1]) for k, f in TOHOR.items()))
LONGSOR = {"reaction": "penanaman beberapa pohon", "adjustment": "perubahan perilaku", "withdrawal": "keluar dari lingkungan"}
cek(all(norm(f"adaptation by {k}") in norm(FAKTA["adp_longsor"][1]) and norm(v) in norm(FAKTA["adp_longsor"][1]) for k, v in LONGSOR.items()))

SUMBER = ("_Diadaptasi dari Geografi untuk SMA/MA Kelas XI (Edisi Revisi), Budi Handoyo dan Nisa Maulia, Kementerian "
          "Pendidikan, Kebudayaan, Riset, dan Teknologi, 2024, Bab IV._")

KURSUS = {
    "Judul kursus*": "Geografi Kelas XI · Bab 4: Perubahan Iklim dan Kebencanaan",
    "Mata pelajaran*": "Geografi",
    "Jenjang*": "SMA",
    "Kelas*": "Kelas XI",
    "Konteks": "Akademik",
}

BAB = [(1, "Perubahan Iklim dan Kebencanaan")]

PELAJARAN = [
    dict(no=1, judul="Perubahan Iklim dan Gejalanya",
         ringkasan="Iklim berbeda dari cuaca; perubahan iklim adalah perubahan suhu, pola hujan, dan angin dalam waktu panjang, yang ditandai beberapa gejala.",
         tujuan="Kalian dapat membedakan iklim dan cuaca serta menjelaskan pengertian dan gejala perubahan iklim.",
         bloom="Memahami",
         isi=f"""## Iklim dan cuaca

Musim hujan di sebagian besar wilayah Indonesia umumnya berlangsung pada Oktober–April, dan kemarau pada April–Oktober. Akhir-akhir ini masa dan lama kedua musim itu cenderung bergeser.

- **Iklim** adalah keadaan rata-rata cuaca dalam waktu yang lama dan wilayah yang luas. Iklim berubah dalam waktu yang lama, lebih dari 30 tahun.
- **Cuaca** berlangsung cepat dan wilayahnya sempit, dan dapat berubah sewaktu-waktu.

Contoh: Indonesia beriklim tropis dengan dua musim, hujan dan kemarau. Contoh cuaca: Kota Bukittinggi pada pukul 06.00 WIB yang sejuk, berawan, dan gerimis.

## Pengertian perubahan iklim

**Perubahan iklim** adalah perubahan suhu rata-rata udara di atas bumi, pola hujan, dan angin yang berlangsung secara regional atau global dalam waktu yang panjang (Handoyo, 2021).

Jadi, perubahan iklim berkaitan dengan perubahan unsur-unsur iklim:
- suhu udara yang meningkat;
- curah hujan yang kurang menentu;
- angin yang makin kuat.

Wilayahnya sangat luas, lintas negara bahkan seluruh dunia, dan waktunya panjang, puluhan sampai ratusan tahun.

## Gejala perubahan iklim

Perubahan iklim tidak terjadi tiba-tiba, tetapi ditandai gejala-gejala berikut.
- **Suhu udara rata-rata meningkat** (pemanasan global).
- **Pola hujan berubah**: daerah yang tadinya basah dapat menjadi lebih kering, dan daerah yang tadinya kering dapat menjadi lebih basah.
- **Cuaca ekstrem makin kuat**: badai tropis, topan, banjir, dan kekeringan lebih sering dan lebih intens.
- **Musim bergeser**, sehingga pola tanam, panen, dan migrasi hewan terpengaruh.

## Gejala lain

- **Ekosistem rusak**, misalnya pemutihan terumbu karang, perubahan sebaran spesies, dan turunnya keanekaragaman hayati.
- **Permukaan laut naik**, karena es di kutub mencair dan air laut memperluas volumenya ketika suhu meningkat. Akibatnya dapat terjadi banjir pesisir.
- **Penyakit meningkat**: penyakit menular bertambah, pola alergi berubah, dan cuaca ekstrem berdampak langsung pada kesehatan.

**Coba pikirkan:** apakah musim hujan di daerah kalian datang dan berakhir pada bulan yang sama seperti dulu?

{SUMBER}"""),
    dict(no=2, judul="Pemanasan Global sebagai Penyebab Perubahan Iklim",
         ringkasan="Pemanasan global adalah naiknya suhu rata-rata permukaan bumi karena bertambahnya gas rumah kaca, yang sebagian besar berasal dari aktivitas manusia.",
         tujuan="Kalian dapat menjelaskan pengertian pemanasan global, gas-gas rumah kaca, dan sumbernya.",
         bloom="Memahami",
         isi=f"""## Pengertian pemanasan global

**Pemanasan global** adalah peningkatan suhu rata-rata permukaan bumi secara bertahap yang disebabkan oleh peningkatan konsentrasi gas-gas rumah kaca di atmosfer. Fenomena ini banyak menyita perhatian sejak tahun 1980-an.

Gas-gas rumah kaca antara lain:
- karbon dioksida (CO₂);
- metana (CH₄);
- nitrous oksida (N₂O);
- uap air (H₂O).

Gas-gas ini menangkap panas dari sinar matahari yang dipancarkan kembali oleh permukaan bumi. Akibatnya suhu rata-rata di permukaan bumi naik.

## Prosesnya

Pemanasan global terjadi perlahan, melalui proses yang panjang.
1. **Emisi bertambah.** Bahan bakar fosil (batu bara, minyak bumi, dan gas alam) dipakai untuk energi, industri, transportasi, dan pertanian, sehingga gas rumah kaca bertambah.
2. **Konsentrasi naik.** Gas-gas itu menumpuk di atmosfer dari waktu ke waktu, sehingga efek rumah kaca makin kuat.
3. **Permukaan bumi memanas** secara bertahap, dan suhu rata-rata global naik.
4. **Siklus alami berubah**: es di Kutub Utara dan Selatan mencair, penguapan air dari lautan bertambah, dan pola cuaca berubah.

## Sumber gas rumah kaca

- **Karbon dioksida (CO₂)**: dari pembakaran bahan bakar fosil (batu bara, minyak bumi, gas alam), aktivitas industri, pembakaran hutan, dan perubahan penggunaan lahan.
- **Metana (CH₄)**: lebih kuat daripada CO₂, tetapi jumlahnya lebih sedikit. Sumbernya produksi dan transportasi gas alam, produksi peternakan, dan pembuangan sampah organik.
- **Nitrogen oksida (N₂O)**: dari pertanian, industri, dan pembakaran bahan bakar fosil. Sumber utamanya penggunaan pupuk sintetis dalam pertanian.
- **Uap air (H₂O)**: tidak dihasilkan langsung oleh manusia, tetapi kadarnya dipengaruhi perubahan penggunaan lahan, polusi udara, dan industri.
- **Gas lain** dalam jumlah kecil, misalnya hydrofluorocarbon (HFC) yang dipakai dalam refrigerasi dan pendinginan.

## Peran manusia

Pembakaran bahan bakar fosil, deforestasi, dan pertanian intensif meningkatkan konsentrasi gas rumah kaca di atmosfer, sehingga efek rumah kaca makin kuat. Akibatnya terjadi pemanasan global, yang berdampak pada perubahan iklim di seluruh dunia.

{SUMBER}"""),
    dict(no=3, judul="Pengaruh Perubahan Iklim terhadap Wilayah Indonesia",
         ringkasan="Kenaikan permukaan air laut mengancam wilayah kepulauan dan pesisir, sedangkan di daratan perubahan iklim membuat suhu lebih panas, musim tak menentu, serta kekeringan dan banjir meluas.",
         tujuan="Kalian dapat menganalisis dampak perubahan iklim terhadap wilayah kepulauan, pesisir, dan daratan Indonesia.",
         bloom="Menganalisis",
         isi=f"""## Wilayah kepulauan

Indonesia adalah negara kepulauan dengan lima pulau besar dan ribuan pulau kecil di antara Samudra Pasifik dan Samudra Hindia. Perubahan iklim menaikkan permukaan air laut, dan kenaikan ini berdampak pada wilayah kepulauan.

Wilayah kepulauan yang terdampak antara lain:
- Kepulauan Riau;
- Kepulauan Bangka Belitung;
- Kepulauan Seribu di sekitar Jakarta.

## Wilayah pesisir

Wilayah pesisir yang terdampak kenaikan muka air laut:
- **Pesisir utara Jawa**, termasuk Jakarta, Bekasi, Semarang, Demak, Pati, dan Tuban.
- **Pesisir Kalimantan**, terutama Kalimantan Selatan dan Kalimantan Timur. Keseimbangan ekosistem mangrove dan lahan basah, penahan banjir dan pelindung dari badai, dapat terganggu.
- **Pesisir Papua**, terutama sekitar Teluk Cenderawasih dan Teluk Yos Sudarso, karena bentang alamnya datar dan banyak pulau kecil di sepanjang pantai.
- **Pesisir Sulawesi dan Maluku**, karena banyak pulau kecil dan topografinya berbukit-bukit.

## Wilayah daratan (1)

Dampaknya berbeda-beda, bergantung pada lokasi, ekonomi, infrastruktur, dan kemampuan adaptasi masyarakat.
- **Suhu makin panas.** Rumah, sekolah, tempat kerja, dan kendaraan terasa lebih panas. Kebutuhan listrik dan pendingin AC meningkat, sehingga biaya hidup lebih mahal.
- **Musim hujan tak menentu.** Musim hujan, yang lazimnya Oktober–April, kadang datang lebih awal dan kadang lebih lambat. Pola musim tanam terganggu dan produksi panen dapat turun.
- **Kekeringan meluas** dan datang lebih cepat.

## Wilayah daratan (2)

- **Banjir makin parah**, makin luas, dan makin sering.
- **Infrastruktur rusak**, terutama di pesisir: naiknya air laut merusak jalan dan bangunan perkampungan.
- **Sumber daya alam hilang**: hutan mangrove, tambak ikan, dan udang di pesisir hilang karena kenaikan permukaan air laut.

{SUMBER}"""),
    dict(no=4, judul="Bencana dan Dinamikanya",
         ringkasan="Besar kecilnya dampak bencana ditentukan oleh kerentanan, ancaman, dan kapasitas.",
         tujuan="Kalian dapat menjelaskan pengertian bencana serta hubungan kerentanan, ancaman, dan kapasitas.",
         bloom="Menganalisis",
         isi=f"""## Pengertian bencana

Bencana datang secara tiba-tiba dan sulit diprediksi. **Bencana** adalah peristiwa atau rangkaian peristiwa yang mengganggu dan mengancam kehidupan manusia, dari faktor alam atau nonalam, sehingga menimbulkan kerugian harta benda, kerusakan lingkungan, hingga korban jiwa.

Besar kecilnya dampak bencana dipengaruhi tiga aspek: **kerentanan**, **ancaman**, dan **kapasitas**.

## Kerentanan

**Kerentanan** adalah keadaan manusia yang menyebabkan ketidakmampuan merespons ancaman. Misalnya, anak-anak dan orang tua mendapat perhatian khusus ketika evakuasi.

Buku menjelaskan empat jenis kerentanan:
- **sosial**: kepadatan penduduk, pertumbuhan penduduk, serta persentase penduduk usia tua dan anak-anak;
- **fisik**: benda berharga yang dapat hilang atau rusak bila terkena ancaman;
- **lingkungan**: kondisi sumber daya alam seperti hutan lindung, hutan alam, hutan bakau, semak belukar, dan rawa;
- **ekonomi**: persentase rumah tangga yang bekerja di sektor rentan dan yang ekonominya rendah.

## Ancaman

**Ancaman** adalah peristiwa yang berpotensi menimbulkan kerugian, kerusakan lingkungan, dan korban jiwa. Penyebabnya faktor teknologi, manusia, lingkungan, dan alam.

Contoh: penduduk pesisir terancam tsunami, penduduk lereng gunung berapi terancam letusan, dan penduduk kawasan lereng terancam longsor.

Ancaman menjadi bencana ketika manusia tidak memiliki kapasitas untuk mengatasinya dan kondisinya rentan. Sebaliknya, bila manusia memiliki kapasitas dan tidak rentan, ancaman tidak akan menjadi bencana.

## Kapasitas

**Kapasitas** adalah penguasaan sumber daya dan kemampuan masyarakat untuk mempersiapkan diri dalam mencegah, menanggulangi, meredam, dan memulihkan kondisi akibat bencana. Caranya: mencegah terjadinya ancaman, mengurangi kekuatan ancaman, dan mengurangi kerentanan.

Contoh: banjir di Desa Sitiarjo, Kabupaten Malang, menggenangi 847 rumah pada tahun 2013, tetapi 350 rumah pada tahun 2017, yaitu 847 − 350 = 497 rumah lebih sedikit. Kemampuan masyarakat meminimalkan dampak itu adalah bagian dari peningkatan kapasitas.

Pada letusan Gunung Semeru tahun 2021, korban terjadi karena ancaman letusan yang tinggi dan kerentanan masyarakat yang tinggi, sementara kapasitas mitigasi diri masih kurang.

**Coba pikirkan:** di sekitar tempat tinggal kalian, siapa saja yang paling rentan bila terjadi bencana?

{SUMBER}"""),
    dict(no=5, judul="Jenis dan Sebaran Bencana Alam",
         ringkasan="Gempa bumi, tsunami, letusan gunung berapi, tanah longsor, banjir, kekeringan, kebakaran hutan, dan puting beliung memiliki penyebab, dampak, dan sebaran masing-masing.",
         tujuan="Kalian dapat menjelaskan penyebab, dampak, dan sebaran jenis-jenis bencana alam di Indonesia.",
         bloom="Memahami",
         isi=f"""## Gempa bumi

**Bencana alam** adalah peristiwa yang disebabkan oleh alam, antara lain gempa bumi, tsunami, gunung meletus, banjir, kekeringan, angin topan, dan tanah longsor.

**Gempa bumi** adalah getaran atau guncangan di permukaan bumi akibat energi yang dilepaskan dari dalam secara tiba-tiba, yang menghasilkan gelombang seismik. Sebagian besar gempa disebabkan patahan (aktivitas tektonik atau deformasi batuan).

- Indonesia berada di atas lempeng Eurasia, Pasifik, dan Indo-Australia.
- Zona lempeng Pasifik, yang dicirikan palung dalam, berada di Halmahera dan bagian utara Papua.
- Zona lempeng Indo-Australia dan Eurasia berada di lepas pantai selatan Nusa Tenggara, selatan Jawa, dan barat Sumatra.
- Wilayah potensi gempa: Sumatra, Jawa, Nusa Tenggara, Sulawesi bagian utara, dan Papua bagian utara.
- Contoh: gempa Lombok, 5 Agustus 2018, magnitudo 7,0, kedalaman 15 km.

Dampaknya antara lain transportasi dan komunikasi terganggu, fasilitas umum rusak, muncul rekahan dan longsoran, air bawah tanah berubah, dan tsunami bila gempa berasal dari laut dangkal.

## Tsunami

Contoh: tsunami setinggi sekitar 6 m di Palu pada 28 September 2018.

Dampaknya:
- merusak apa saja yang dilaluinya: sarana prasarana, tumbuhan, dan korban jiwa;
- tanaman pertanian rusak, genangan air, dan pencemaran air asin pada tanah dan air bersih.

Menurut buku, wilayah yang berisiko tsunami tinggi antara lain Sumatra bagian selatan, kepulauan Maluku, dan Papua bagian utara.

## Letusan gunung berapi

**Erupsi** adalah keluarnya magma dari dalam bumi berupa material cair dan padat ke permukaan bumi. Materialnya meliputi lahar, bom, awan panas, debu vulkanik, dan lapili.

Tanda-tandanya: getaran gempa kecil, suhu meningkat, tumbuhan di lereng gunung layu, binatang bermigrasi, mata air mengering, dan sering terdengar suara gemuruh.

Dampaknya:
- udara tercemar abu vulkanik, seperti sulfur dioksida, nitrogen dioksida, dan hidrogen sulfida;
- aktivitas lumpuh, ekosistem rusak, dan bangunan hancur;
- penyakit seperti ISPA;
- batu yang dimuntahkan dapat dimanfaatkan sebagai bahan bangunan.

Sebaran gunung berapi berhubungan dengan zona subduksi lempeng, seperti di Sumatra, Jawa, Nusa Tenggara, Maluku, dan Sulawesi.

## Tanah longsor

Tanah longsor dipicu gabungan kondisi: lereng terjal, curah hujan tinggi, pengikisan tanah yang tinggi, getaran, tutupan vegetasi yang berkurang, dan tanah yang kurang padat serta tebal.

Kerugiannya: sanitasi lingkungan buruk, harga tanah turun, infrastruktur rusak, jalur transportasi terputus, dan perekonomian tersendat.

Wilayah berpotensi longsor antara lain Kabupaten Bogor, Cianjur, Bandung, Purwakarta, Sukabumi, Tegal, Purbalingga, dan Sumedang.

## Banjir

**Banjir** adalah tergenangnya air dalam jangka waktu tertentu pada wilayah yang mulanya tidak tergenang.

Penyebabnya:
- curah hujan lebat yang lama, sehingga danau, sungai, atau drainase meluap;
- perilaku manusia: penggundulan hutan, hunian di bantaran sungai, alih fungsi lahan, pembuangan sampah sembarangan, dan kurangnya daerah resapan air.

Contoh:
- Sentani, Jayapura, 16–17 Maret 2019: hujan tinggi dan gundulnya pegunungan Cycloop.
- Kalimantan Selatan, 9–29 Januari 2021: anomali cuaca dan hujan berintensitas tinggi.

Kerugiannya: jalan, jembatan, dan bangunan rusak; wabah penyakit dan kurangnya air bersih; hasil pertanian hilang dan harga barang naik.

## Kekeringan, kebakaran hutan, dan puting beliung

- **Kekeringan** adalah kelangkaan air dari hujan pada periode tertentu, sehingga air kurang untuk berbagai kegiatan. Terjadinya perlahan, lama, berdampak luas, dan lintas sektor.
- **Kebakaran hutan dan lahan (karhutla)** rentan terjadi bila ada El Nino, yang mengurangi curah hujan dan menaikkan suhu. Di Riau, salah satu penyebabnya metode tebas bakar (slash and burn) untuk membuka kebun. Asapnya menyebabkan ISPA, asma, dan iritasi mata.
- **Puting beliung** terjadi karena fenomena hidrometeorologis yang meningkat pada musim pancaroba (peralihan). Angin ini bagian dari pertumbuhan awan Cumulonimbus, dan ancamannya sulit diprediksi.

{SUMBER}"""),
    dict(no=6, judul="Mitigasi Bencana Alam",
         ringkasan="Mitigasi adalah serangkaian kegiatan untuk mengurangi risiko bencana, secara struktural atau nonstruktural, dan berbeda untuk tiap jenis bencana.",
         tujuan="Kalian dapat menjelaskan pengertian, tujuan, dan bentuk mitigasi, serta memilih mitigasi yang sesuai dengan jenis bencananya.",
         bloom="Menerapkan",
         isi=f"""## Pengertian dan tujuan mitigasi

**Mitigasi bencana** adalah serangkaian kegiatan (upaya, strategi, kebijakan, dan kegiatan lain) untuk mengurangi risiko bencana. Caranya: penyadaran (penyuluhan), pembangunan fisik (sarana prasarana), dan peningkatan kemampuan (kapasitas).

Tujuannya:
- mengurangi kerugian nyawa dan kerusakan lingkungan;
- meningkatkan pengetahuan sebelum, saat, dan sesudah bencana, sehingga masyarakat hidup aman;
- menjadi acuan kebijakan pembangunan wilayah.

## Dua bentuk mitigasi

- **Mitigasi struktural**: pembangunan fisik atau prasarana untuk mengurangi risiko bencana, termasuk melalui pengembangan teknologi.
- **Mitigasi nonstruktural**: penyadaran atau pendidikan untuk mengurangi risiko bencana.

## Tsunami dan gunung berapi

**Tsunami:**
- menanam mangrove (bakau) di sepanjang pantai untuk menghambat gelombang;
- membekali pengetahuan tentang gempa yang berpotensi tsunami: pusatnya di laut dangkal (0–30 km), kekuatannya paling rendah 6,5 SR, dengan sesar naik atau turun;
- sistem peringatan dini dan pemantauan berkala.

**Gunung berapi:**
- membangun tanggul untuk menahan lahar;
- pemantauan berkala dan pemetaan kawasan rawan bencana;
- penyelidikan dengan metode geologi, geofisika, dan geokimia;
- sosialisasi kepada pemerintah daerah dan masyarakat.

## Gempa bumi dan tanah longsor

**Gempa bumi:**
- mendirikan bangunan sesuai aturan baku (tahan gempa);
- menyiapkan senter, P3K, dan makanan instan;
- memahami jalur evakuasi dan mengikuti simulasi.

**Tanah longsor:**
- tidak membangun permukiman di daerah rawan longsor;
- mengurangi tingkat keterjalan lereng;
- membuat terasering dengan sistem drainase yang tepat;
- penghijauan dengan tanaman berakar dalam.

## Banjir dan kekeringan

**Banjir:**
- membangun waduk dan tanggul;
- menata daerah aliran sungai dan menghijaukan daerah hulu, tengah, dan hilir sungai;
- tidak menjadikan bantaran sungai lahan pembangunan;
- membersihkan sampah dan mengeruk endapan sungai secara berkala.

**Kekeringan:**
- membangun waduk agar air tidak kurang di musim kemarau;
- reboisasi dan penghijauan;
- membangun atau merehabilitasi jaringan irigasi;
- sosialisasi penghematan air.

{SUMBER}"""),
    dict(no=7, judul="Adaptasi Bencana Alam",
         ringkasan="Adaptasi adalah cara manusia bertahan hidup dengan menyesuaikan diri dengan lingkungan, dan bentuknya berbeda untuk tiap jenis bencana.",
         tujuan="Kalian dapat membedakan mitigasi dan adaptasi, serta menjelaskan bentuk-bentuk adaptasi terhadap berbagai bencana.",
         bloom="Mengevaluasi",
         isi=f"""## Pengertian adaptasi

**Adaptasi bencana** adalah serangkaian upaya atau cara manusia untuk bertahan hidup dengan melakukan penyesuaian lingkungan, misalnya rumah tahan gempa, rumah antibanjir, dan embung untuk menyiasati kekeringan.

Kemampuan beradaptasi ditentukan oleh kapasitas, pengambilan keputusan dalam masyarakat, dan ketersediaan teknologi.

Bedakan: mitigasi adalah kegiatan untuk mengurangi risiko bencana, sedangkan adaptasi adalah cara bertahan hidup dengan menyesuaikan diri dengan lingkungan.

## Gempa bumi, tsunami, dan gunung meletus

- **Gempa bumi**: mengubah konstruksi rumah sesuai standar kelayakan hunian (adaptasi fisik), dan menjaga ketahanan pangan dengan living food bank, yaitu menanam palawija, kelapa, pisang, dan ubi.
- **Tsunami**: melibatkan masyarakat pesisir yang berpengalaman, membangun breakwater dan seawall, serta memasang papan dan rambu jalur evakuasi.
- **Gunung meletus**: membuat rumah yang kokoh, dinding tebal, dan atap yang tahan hujan air dan hujan abu, serta memakai masker.

## Tanah longsor

Tiga bentuk adaptasi tanah longsor:
- **adaptation by reaction**: menanam pohon di lokasi yang terkena longsor;
- **adaptation by adjustment**: mengubah perilaku masyarakat terhadap lingkungan menjadi lebih baik;
- **adaptation by withdrawal**: keluar dari lingkungan tempat tinggal ke tempat yang lebih aman.

## Banjir dan rob

**Banjir:**
- **aktif**: mengoptimalkan sumber daya manusia untuk kehidupan sehari-hari, misalnya menjadi ojek perahu dan meninggikan rumah menjadi dua lantai;
- **pasif**: mengetahui prakiraan bulan hujan yang berisiko banjir, sehingga masyarakat bersiap;
- **sosial**: gotong royong dan solidaritas antarwarga;
- **ekonomi**: bantuan dari lembaga sosial, dan menaruh barang penting di tempat tinggi;
- **budaya**: tahlilan, istighosah, dan sedekah bumi.

**Rob:** meninggikan lantai rumah, meninggikan tanggul tambak dan memasang jaring waring, gotong royong meninggikan jalan, dan beralih mata pencaharian.

## Kekeringan, kebakaran hutan, dan puting beliung

- **Kekeringan**: meningkatkan daya dukung DAS sebagai daerah resapan air, merehabilitasi bendungan dan waduk, mengembangkan irigasi hemat air (spray and drip irrigation), dan kampanye hemat air.
- **Kebakaran hutan dan lahan**, contoh Desa Sungai Tohor:
  - fisik: sekat kanal dan embung sebagai cadangan air;
  - ekonomi: bekerja sebagai petani, buruh potong, dan buruh angkut sagu;
  - struktural: aktivitas ramah lingkungan gambut, bekerja sama dengan pemerintah dan lembaga desa;
  - kultural: menghindari memerun, yaitu membakar sisa kayu untuk membuka lahan.
- **Puting beliung**: memperkuat struktur fisik bangunan hunian, dan meningkatkan kemampuan serta pengetahuan menghadapinya.

## Rangkuman Bab 4

- Iklim berubah dalam waktu lebih dari 30 tahun; perubahan iklim ditandai suhu naik, pola hujan berubah, cuaca ekstrem, dan musim bergeser.
- Pemanasan global disebabkan bertambahnya gas rumah kaca, terutama dari aktivitas manusia.
- Kenaikan air laut mengancam kepulauan dan pesisir; daratan makin panas, kering, dan sering banjir.
- Dampak bencana bergantung pada kerentanan, ancaman, dan kapasitas.
- Mitigasi mengurangi risiko bencana (struktural dan nonstruktural); adaptasi menyesuaikan cara hidup dengan bencana.

{SUMBER}"""),
]

# Statements that are false or doubtful outside the book (see the hand-off) stay out of the lessons.
DILUAR = ("dipantulkan", "pantulan", "gas cairan", "4.5", "4,5", "227.900", "karbon monoksida", "paling banyak",
          "paling melimpah", "8 bulan", "5,9", "6,8", "Berry", "floodway", "1.367", "2000 pulau", "salinitas", "EPA",
          "Pencemaran udara meningkat", "3 jenis", "Karhutla terutama", "Ancamannya tinggi di sebagian", "terperangkap", "kaktus", "eduanya dipicu", "34 jiwa", "7,4", "tenggara Banda", "tiga jenis kerentanan", "keadaan rata-rata udara", "Banyuwangi",
          "Pangandaran", "Merapi", "gegabah", "Aceh", "hilang tak terlihat")
for _p in PELAJARAN:
    cek(3 <= _p["isi"].count("\n## ") + _p["isi"].startswith("## ") <= 6, f"lesson {_p['no']}: 3-6 pages")
    cek(_p["isi"].rstrip().endswith(SUMBER), f"lesson {_p['no']}: attribution last")
    cek("\n|" not in _p["isi"], f"lesson {_p['no']}: no Markdown table")
    cek(_p["isi"].count("Coba pikirkan") <= 1, f"lesson {_p['no']}: at most one Coba pikirkan")
    cek(not any(w in _p["isi"] for w in DILUAR), f"lesson {_p['no']}: {[w for w in DILUAR if w in _p['isi']]}")

# ── Misconceptions: the book has no Miskonsepsi section; these come from the distractors.
MISKONSEPSI = {
    "SMA11-G-B4-01": ("Iklim, cuaca, dan perubahan iklim tertukar",
                      "Ciri cuaca dipakai untuk iklim, atau pengertian iklim tertukar dengan perubahan iklim.",
                      "Bandingkan lamanya (lebih dari 30 tahun atau sewaktu-waktu) dan luas wilayahnya."),
    "SMA11-G-B4-02": ("Gejala perubahan iklim tertukar",
                      "Satu gejala perubahan iklim disebut dengan nama atau penjelasan gejala lain.",
                      "Buat daftar gejala dengan satu contoh untuk setiap gejala."),
    "SMA11-G-B4-03": ("Gas rumah kaca dan sumbernya tertukar",
                      "Gas lain dikira gas rumah kaca, atau sumber satu gas dipakai untuk gas lain.",
                      "Pasangkan setiap gas rumah kaca dengan sumber utamanya."),
    "SMA11-G-B4-04": ("Cara kerja gas rumah kaca keliru",
                      "Sumber gas atau akibat pemanasan dikira cara gas rumah kaca menaikkan suhu.",
                      "Pisahkan tiga pertanyaan: dari mana gasnya, apa yang dilakukan gas itu, dan apa akibatnya."),
    "SMA11-G-B4-05": ("Dampak perubahan iklim tertukar",
                      "Dampak di satu wilayah atau dari satu gejala dipakai untuk wilayah atau gejala lain.",
                      "Kelompokkan dampak menurut penyebabnya: suhu naik, musim bergeser, atau air laut naik."),
    "SMA11-G-B4-06": ("Lokasi terdampak atau sebaran tertukar",
                      "Tempat yang disebut untuk satu peristiwa atau zona dipakai untuk yang lain.",
                      "Minta murid menyebut peristiwa yang terkait dengan setiap tempat."),
    "SMA11-G-B4-07": ("Unsur dinamika bencana tertukar",
                      "Kerentanan, ancaman, dan kapasitas tertukar.",
                      "Tanyakan: apakah ini keadaan manusia, peristiwa yang berpotensi merugikan, atau kemampuan masyarakat?"),
    "SMA11-G-B4-08": ("Jenis kerentanan tertukar",
                      "Kerentanan sosial, fisik, lingkungan, dan ekonomi tertukar.",
                      "Cocokkan aspek yang diukur dengan jenis kerentanannya: penduduk, benda, alam, atau rumah tangga."),
    "SMA11-G-B4-09": ("Pengertian jenis bencana tertukar",
                      "Pengertian atau istilah satu bencana dipakai untuk bencana lain.",
                      "Minta murid menyebut ciri pembeda setiap bencana sebelum memilih."),
    "SMA11-G-B4-10": ("Penyebab atau tanda bencana tertukar",
                      "Penyebab atau tanda satu bencana dipakai untuk bencana lain.",
                      "Buat peta konsep: setiap bencana dengan penyebab, tanda, dan contohnya."),
    "SMA11-G-B4-11": ("Mitigasi, adaptasi, dan kapasitas tertukar",
                      "Pengertian mitigasi, adaptasi, dan kapasitas tertukar.",
                      "Tanyakan apakah kegiatannya mengurangi risiko, menyesuaikan cara hidup, atau kemampuan yang dimiliki."),
    "SMA11-G-B4-12": ("Mitigasi per bencana tertukar",
                      "Kegiatan mitigasi satu bencana dipakai untuk bencana lain.",
                      "Pasangkan setiap kegiatan dengan bahaya yang dicegahnya: gelombang, lahar, guncangan, lereng, atau air."),
    "SMA11-G-B4-13": ("Mitigasi struktural dan nonstruktural tertukar",
                      "Pembangunan fisik dan penyadaran atau pendidikan tertukar.",
                      "Tanyakan apakah kegiatannya membangun sesuatu atau menambah pengetahuan dan kesadaran."),
    "SMA11-G-B4-14": ("Bentuk adaptasi tertukar",
                      "Bentuk adaptasi (aktif, pasif, sosial, ekonomi, budaya, fisik, kultural, reaction, adjustment, withdrawal) tertukar.",
                      "Minta murid mencocokkan contoh dengan pengertian setiap bentuk adaptasi."),
    "SMA11-G-B4-15": ("Adaptasi per bencana tertukar",
                      "Bentuk adaptasi satu bencana dipakai untuk bencana lain.",
                      "Tanyakan bahaya apa yang ditahan atau disiasati oleh bentuk adaptasi itu."),
}


S = []
STOP = {"karena", "yaitu", "adalah", "dengan", "sebagai", "termasuk", "bukan", "hanya", "dapat", "menjadi", "tidak", "sehingga",
        "berada", "antara", "untuk", "dalam", "wilayah", "indonesia", "setiap", "seperti", "terutama", "masing", "serta", "maupun",
        "sekitar", "tempat"}


# An option may correct the book's spelling; the word is then checked in the book's spelling.
EJAAN = {}      # none needed in this chapter


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


# ── Pemetaan awal (pre-test): greenhouse gases, kerentanan, flood, adaptation.
soal("PA1", 2, "Menurut buku, kelompok berikut yang seluruhnya termasuk gas rumah kaca adalah ...", "A", [
    ("karbon dioksida, metana, dan uap air", True, "Tepat. Nitrous oksida juga termasuk gas rumah kaca.", "", "grk_jenis"),
    ("sulfur dioksida, nitrogen dioksida, dan hidrogen sulfida", False, "Ini gas dari abu vulkanik yang mencemari udara saat gunung meletus.", "SMA11-G-B4-03", "abu"),
    ("lahar, bom, dan awan panas", False, "Ini material erupsi gunung berapi, bukan gas rumah kaca.", "SMA11-G-B4-03", "erupsi"),
    ("debu vulkanik dan lapili", False, "Ini material erupsi gunung berapi, bukan gas rumah kaca.", "SMA11-G-B4-03", "erupsi"),
], guna="Pemetaan awal")
soal("PA2", 4, "Keadaan manusia yang membuatnya tidak mampu merespons suatu peristiwa berbahaya disebut ...", "C", [
    ("kerentanan", True, "Tepat. Misalnya anak-anak dan orang tua memerlukan bantuan saat evakuasi.", "", "kerentanan_def"),
    ("ancaman", False, "Ancaman adalah peristiwa yang berpotensi menimbulkan kerugian, kerusakan lingkungan, dan korban jiwa.", "SMA11-G-B4-07", "ancaman_def"),
    ("kapasitas masyarakat", False, "Kapasitas adalah kemampuan masyarakat untuk mencegah, menanggulangi, dan memulihkan kondisi akibat bencana.", "SMA11-G-B4-07", "kapasitas_def"),
    ("mitigasi", False, "Mitigasi adalah serangkaian kegiatan untuk mengurangi risiko bencana.", "SMA11-G-B4-11", "mitigasi_def"),
], guna="Pemetaan awal")
soal("PA3", 5, "Peristiwa tergenangnya air dalam jangka waktu tertentu pada wilayah yang mulanya tidak tergenang disebut ...", "B", [
    ("banjir", True, "Tepat. Penyebabnya hujan lebat yang lama dan perilaku manusia.", "", "banjir_def"),
    ("kekeringan", False, "Kekeringan adalah kelangkaan air dari hujan pada periode tertentu.", "SMA11-G-B4-09", "kekeringan_def"),
    ("tanah longsor", False, "Tanah longsor dipicu lereng terjal, hujan tinggi, dan tanah yang kurang padat.", "SMA11-G-B4-09", "longsor_sebab"),
    ("tsunami", False, "Tsunami terjadi bila gempa bumi berasal dari laut dangkal.", "SMA11-G-B4-09", "gempa_tsunami"),
], guna="Pemetaan awal")
soal("PA4", 7, "Menurut buku, adaptasi bencana adalah ...", "D", [
    ("cara manusia bertahan hidup dengan penyesuaian lingkungan", True, "Tepat. Contohnya rumah tahan gempa, rumah antibanjir, dan embung.", "", "adaptasi_def"),
    ("serangkaian kegiatan untuk mengurangi risiko bencana", False, "Ini pengertian mitigasi bencana.", "SMA11-G-B4-11", "mitigasi_def"),
    ("penguasaan sumber daya dan kemampuan untuk mempersiapkan diri", False, "Ini pengertian kapasitas.", "SMA11-G-B4-11", "kapasitas_def"),
    ("peristiwa yang berpotensi mengakibatkan kerugian dan korban jiwa", False, "Ini pengertian ancaman.", "SMA11-G-B4-07", "ancaman_def"),
], guna="Pemetaan awal")

# ── Cek penguasaan (post-test): every lesson; no book assessment item (pp. 245-250), no lesson example.
soal("PB1", 1, "Menurut buku, iklim berbeda dengan cuaca. Iklim ...", "B", [
    ("berubah dalam waktu yang lama, lebih dari 30 tahun", True, "Tepat. Contohnya iklim tropis Indonesia dengan dua musim.", "", "iklim_30"),
    ("berlangsung cepat dan wilayahnya sempit", False, "Ini ciri cuaca.", "SMA11-G-B4-01", "cuaca_sempit"),
    ("berubah sewaktu-waktu", False, "Ini ciri cuaca.", "SMA11-G-B4-01", "iklim_30"),
    ("perubahan suhu rata-rata udara, pola hujan, dan angin", False, "Ini pengertian perubahan iklim, bukan iklim.", "SMA11-G-B4-01", "perubahan_iklim_def"),
], guna="Cek penguasaan", sulit="Sedang")
soal("PB2", 2, "Menurut buku, metana dihasilkan dari aktivitas manusia seperti ...", "D", [
    ("produksi peternakan dan pembuangan sampah organik", True, "Tepat. Juga dari produksi dan transportasi gas alam.", "", "metana"),
    ("penggunaan pupuk sintetis dalam pertanian", False, "Ini sumber utama nitrogen oksida (N₂O).", "SMA11-G-B4-03", "n2o"),
    ("refrigerasi dan pendinginan", False, "Di sini dipakai hydrofluorocarbon (HFC).", "SMA11-G-B4-03", "hfc"),
    ("aktivitas industri, pembakaran hutan, dan perubahan penggunaan lahan", False, "Ini sumber karbon dioksida (CO₂).", "SMA11-G-B4-03", "co2_sumber"),
], guna="Cek penguasaan", sulit="Sedang")
soal("PB3", 3, "Di wilayah daratan, suhu udara yang terasa semakin panas akibat perubahan iklim berdampak pada ...", "A", [
    ("kebutuhan pendingin AC meningkat", True, "Tepat. Kebutuhan listrik juga naik, sehingga biaya hidup lebih mahal.", "", "daratan_suhu"),
    ("pola musim tanam yang dapat menurunkan produksi panen", False, "Ini dampak musim hujan yang bergeser.", "SMA11-G-B4-05", "daratan_musim"),
    ("kerusakan infrastruktur jalan dan bangunan perkampungan", False, "Ini dampak naiknya permukaan air laut di pesisir.", "SMA11-G-B4-05", "daratan_infra"),
    ("kehilangan hutan mangrove, tambak ikan, dan udang", False, "Ini dampak kenaikan permukaan air laut di pesisir.", "SMA11-G-B4-05", "daratan_sda"),
], guna="Cek penguasaan", sulit="Sedang")
cek(set(KERENTANAN) == {"sosial", "fisik", "lingkungan", "ekonomi"})
soal("PB4", 4, "Kerentanan yang meliputi aspek kepadatan penduduk, pertumbuhan penduduk, serta persentase penduduk usia tua dan anak-anak disebut kerentanan ...", "C", [
    ("sosial", True, "Tepat. Kerentanan sosial adalah kerapuhan sosial dalam merespons bencana.", "", "ker_sosial"),
    ("fisik", False, "Kerentanan fisik menyangkut benda berharga yang dapat hilang atau rusak.", "SMA11-G-B4-08", "ker_fisik"),
    ("lingkungan", False, "Kerentanan lingkungan dikaitkan dengan sumber daya alam, seperti hutan dan rawa.", "SMA11-G-B4-08", "ker_lingkungan"),
    ("ekonomi", False, "Kerentanan ekonomi menyangkut rumah tangga di sektor rentan dan yang ekonominya rendah.", "SMA11-G-B4-08", "ker_ekonomi"),
], guna="Cek penguasaan", sulit="Sedang")
soal("PB5", 5, "Menurut buku, tanda-tanda akan terjadinya erupsi antara lain ...", "D", [
    ("layunya tumbuhan di lereng gunung dan keringnya mata air", True, "Tepat. Tanda lainnya getaran gempa kecil, suhu meningkat, dan suara gemuruh.", "", "erupsi_tanda"),
    ("awan Cumulonimbus yang muncul akibat intensifnya pemanasan", False, "Ini proses terjadinya angin puting beliung.", "SMA11-G-B4-10", "puting"),
    ("lereng terjal dan tutupan vegetasi yang berkurang", False, "Ini kondisi yang memicu tanah longsor.", "SMA11-G-B4-10", "longsor_sebab"),
    ("fenomena el nino yang membuat curah hujan berkurang", False, "Ini kondisi yang membuat suatu wilayah rentan kebakaran hutan dan lahan.", "SMA11-G-B4-10", "karhutla_elnino"),
], guna="Cek penguasaan", sulit="Sedang")
soal("PB6", 6, "Penyuluhan kepada masyarakat untuk menyadarkan mereka akan risiko bencana termasuk ...", "A", [
    ("mitigasi nonstruktural", True, "Tepat. Mitigasi nonstruktural berupa penyadaran atau pendidikan.", "", "nonstruktural"),
    ("mitigasi struktural", False, "Mitigasi struktural berupa pembangunan fisik atau prasarana.", "SMA11-G-B4-13", "struktural"),
    ("adaptasi sosial", False, "Adaptasi sosial terhadap banjir berupa gotong royong dan solidaritas antarwarga.", "SMA11-G-B4-11", "adp_sosial"),
    ("adaptasi ekonomi masyarakat", False, "Adaptasi ekonomi terhadap banjir antara lain bantuan dari lembaga sosial.", "SMA11-G-B4-11", "adp_ekonomi"),
], guna="Cek penguasaan", sulit="Sedang")
soal("PB7", 7, "Saat banjir datang, sebagian warga menjadi ojek perahu dan meninggikan rumahnya menjadi dua lantai. Menurut buku, ini termasuk adaptasi ...", "B", [
    ("aktif", True, "Tepat. Adaptasi aktif mengoptimalkan sumber daya manusia untuk kehidupan sehari-hari.", "", "adp_aktif"),
    ("pasif", False, "Adaptasi pasif misalnya mengetahui prakiraan bulan hujan yang berisiko banjir.", "SMA11-G-B4-14", "adp_pasif"),
    ("sosial", False, "Adaptasi sosial berupa gotong royong dan solidaritas antarwarga.", "SMA11-G-B4-14", "adp_sosial"),
    ("budaya", False, "Adaptasi budaya misalnya tahlilan dan istighosah.", "SMA11-G-B4-14", "adp_budaya"),
], guna="Cek penguasaan", sulit="Sulit")
cek("mit_tsunami" in MITIGASI["tsunami"])
soal("PB8", 6, "Salah satu kegiatan mitigasi bencana tsunami adalah ...", "C", [
    ("penanaman mangrove (bakau) di sepanjang pantai", True, "Tepat. Mangrove menghambat gelombang tsunami.", "", "mit_tsunami"),
    ("pembangunan tanggul untuk menahan lahar", False, "Ini mitigasi letusan gunung berapi.", "SMA11-G-B4-12", "mit_gunung"),
    ("membuat terasering dengan sistem drainase yang tepat", False, "Ini mitigasi tanah longsor.", "SMA11-G-B4-12", "mit_longsor_teras"),
    ("pembangunan waduk untuk mencegah terjadinya banjir", False, "Ini mitigasi banjir.", "SMA11-G-B4-12", "mit_banjir_waduk"),
], guna="Cek penguasaan", sulit="Sedang")

# ── Latihan (practice), by lesson.
soal("L1", 1, "Keadaan rata-rata cuaca yang terjadi dalam waktu yang lama dan wilayah yang luas disebut ...", "A", [
    ("iklim", True, "Tepat. Iklim berubah dalam waktu lebih dari 30 tahun.", "", "iklim_def"),
    ("cuaca", False, "Cuaca berlangsung cepat dan wilayahnya sempit.", "SMA11-G-B4-01", "cuaca_sempit"),
    ("perubahan iklim", False, "Perubahan iklim adalah perubahan suhu, pola hujan, dan angin dalam waktu yang panjang.", "SMA11-G-B4-01", "perubahan_iklim_def"),
    ("musim hujan", False, "Musim hujan umumnya berlangsung pada Oktober–April.", "SMA11-G-B4-01", "musim"),
])
soal("L2", 1, "Daerah yang tadinya basah menjadi lebih kering, dan daerah yang tadinya kering menjadi lebih basah. Gejala perubahan iklim ini disebut ...", "D", [
    ("pola hujan yang berubah", True, "Tepat. Pola curah hujan menjadi tidak teratur.", "", "gejala_hujan"),
    ("pergeseran musim", False, "Pergeseran musim memengaruhi pola tanam, panen, dan migrasi hewan.", "SMA11-G-B4-02", "gejala_musim"),
    ("peningkatan intensitas cuaca ekstrem", False, "Gejala ini berupa badai tropis, topan, banjir, dan kekeringan yang lebih sering.", "SMA11-G-B4-02", "gejala_ekstrem"),
    ("permukaan laut meningkat", False, "Gejala ini terjadi karena es di kutub mencair dan air laut memperluas volumenya.", "SMA11-G-B4-02", "gejala_laut"),
])
soal("L3", 1, "Menurut buku, permukaan laut meningkat karena ...", "C", [
    ("es di kutub mencair dan air laut memperluas volume", True, "Tepat. Air laut memperluas volumenya ketika suhu meningkat.", "", "gejala_laut"),
    ("pemutihan terumbu karang dan penurunan keanekaragaman hayati", False, "Ini gejala kerusakan ekosistem.", "SMA11-G-B4-02", "gejala_ekosistem"),
    ("peningkatan penyakit menular dan perubahan pola alergi", False, "Ini gejala dampak perubahan iklim pada kesehatan.", "SMA11-G-B4-02", "gejala_penyakit"),
    ("badai tropis, topan, banjir, dan kekeringan lebih sering", False, "Ini gejala peningkatan intensitas cuaca ekstrem.", "SMA11-G-B4-02", "gejala_ekstrem"),
])
soal("L4", 2, "Menurut buku, gas rumah kaca seperti karbon dioksida, metana, dan uap air menaikkan suhu bumi dengan cara ...", "B", [
    ("menangkap panas yang dipancarkan kembali oleh permukaan bumi", True, "Tepat. Karena itu suhu rata-rata permukaan bumi naik.", "", "grk_panas"),
    ("memicu pencairan es di Kutub Utara dan Selatan dan perubahan pola cuaca", False, "Pencairan es adalah akibat peningkatan suhu global, bukan cara kerja gas rumah kaca.", "SMA11-G-B4-04", "siklus"),
    ("dihasilkan dari pembakaran bahan bakar fosil", False, "Ini sumber karbon dioksida, bukan cara gas rumah kaca menaikkan suhu.", "SMA11-G-B4-04", "co2_sumber"),
    ("pertumbuhan awan Cumulonimbus akibat intensifnya pemanasan", False, "Ini proses terjadinya angin puting beliung.", "SMA11-G-B4-04", "puting"),
])
soal("L5", 2, "Menurut buku, sumber utama emisi nitrogen oksida (N₂O) adalah ...", "A", [
    ("penggunaan pupuk sintetis dalam pertanian", True, "Tepat. N₂O juga dihasilkan industri dan pembakaran bahan bakar fosil.", "", "n2o"),
    ("produksi dan transportasi gas alam", False, "Ini salah satu sumber metana.", "SMA11-G-B4-03", "metana"),
    ("refrigerasi dan pendinginan", False, "Di sini dipakai hydrofluorocarbon (HFC).", "SMA11-G-B4-03", "hfc"),
    ("pembakaran hutan dan perubahan penggunaan lahan", False, "Ini sumber karbon dioksida.", "SMA11-G-B4-03", "co2_sumber"),
])
soal("L6", 3, "Salah satu wilayah yang menurut buku terdampak kenaikan permukaan air laut adalah ...", "D", [
    ("Kepulauan Seribu", True, "Tepat. Juga Kepulauan Riau dan Kepulauan Bangka Belitung.", "", "kepulauan"),
    ("pegunungan Cycloop di Jayapura", False, "Gundulnya pegunungan Cycloop disebut sebagai penyebab banjir bandang di Sentani.", "SMA11-G-B4-06", "sentani"),
    ("lereng Gunung Wilis, Madiun", False, "Lereng Gunung Wilis disebut buku sebagai lokasi hujan deras yang memicu tanah longsor di Madiun.", "SMA11-G-B4-06", "madiun"),
    ("Kabupaten Purbalingga", False, "Purbalingga disebut buku sebagai wilayah yang berpotensi tanah longsor.", "SMA11-G-B4-06", "longsor_wilayah"),
])
soal("L7", 3, "Menurut buku, kenaikan muka air laut di pesisir Kalimantan dapat berdampak pada ...", "C", [
    ("keseimbangan ekosistem mangrove dan lahan basah", True, "Tepat. Mangrove dan lahan basah penting sebagai penahan banjir dan pelindung dari badai.", "", "pesisir_kalimantan"),
    ("pola tanam, panen, dan migrasi hewan", False, "Ini dampak pergeseran musim.", "SMA11-G-B4-05", "gejala_musim"),
    ("buruknya sanitasi lingkungan dan harga tanah menurun", False, "Ini kerugian akibat tanah longsor.", "SMA11-G-B4-05", "longsor_rugi"),
    ("kekurangan air di berbagai kegiatan", False, "Ini akibat bencana kekeringan.", "SMA11-G-B4-05", "kekeringan_def"),
])
soal("L8", 4, "Menurut buku, penyebab ancaman bencana adalah faktor ...", "B", [
    ("teknologi, manusia, lingkungan, dan alam", True, "Tepat.", "", "ancaman_sebab"),
    ("kepadatan penduduk dan pertumbuhan penduduk", False, "Ini aspek kerentanan sosial.", "SMA11-G-B4-08", "ker_sosial"),
    ("penyadaran, pembangunan fisik, dan peningkatan kemampuan", False, "Ini cara melakukan mitigasi.", "SMA11-G-B4-11", "mitigasi_proses"),
    ("pencegahan, mengurangi kekuatan ancaman, dan mengurangi kerentanan", False, "Ini cara meningkatkan kapasitas.", "SMA11-G-B4-07", "kapasitas_cara"),
])
soal("L9", 4, "Menurut buku, suatu ancaman menjadi bencana ketika ...", "A", [
    ("manusia tidak memiliki kapasitas dan kondisinya rentan", True, "Tepat.", "", "ancaman_bencana"),
    ("manusia memiliki kapasitas dan tidak dalam kondisi rentan", False, "Dalam keadaan ini ancaman tidak akan menjadi bencana.", "SMA11-G-B4-07", "ancaman_bencana"),
    ("datangnya secara tiba-tiba dan sulit diprediksi", False, "Ini sifat datangnya bencana, bukan syarat ancaman menjadi bencana.", "SMA11-G-B4-07", "bencana_tiba"),
    ("anak-anak dan orang tua mendapat perhatian khusus", False, "Ini contoh kelompok yang rentan saat evakuasi.", "SMA11-G-B4-08", "kerentanan_umur"),
])
cek(847 - 350 == 497)
soal("L10", 4, "Banjir di Desa Sitiarjo, Kabupaten Malang, menggenangi 847 rumah pada tahun 2013 dan 350 rumah pada tahun 2017. Menurut buku, berkurangnya kerugian ini menunjukkan peningkatan ...", "D", [
    ("kapasitas", True, "Tepat. Rumah yang tergenang 497 lebih sedikit karena kemampuan masyarakat meminimalkan dampak.", "", "kapasitas_def"),
    ("kerentanan", False, "Kerentanan yang naik justru memperbesar dampak bencana.", "SMA11-G-B4-07", "kerentanan_def"),
    ("ancaman", False, "Ancaman adalah peristiwa yang berpotensi merugikan; yang berubah di sini kemampuan masyarakat.", "SMA11-G-B4-07", "ancaman_def"),
    ("curah hujan", False, "Curah hujan lebat adalah penyebab banjir, bukan kemampuan masyarakat.", "SMA11-G-B4-10", "banjir_hujan"),
])
soal("L11", 5, "Menurut buku, zona lempeng Pasifik, yang dicirikan palung yang dalam, berada di ...", "C", [
    ("Halmahera dan bagian utara Papua", True, "Tepat.", "", "pasifik"),
    ("lepas pantai selatan Nusa Tenggara, selatan Jawa, dan barat Sumatra", False, "Di sini zona lempeng Indo-Australia dan Eurasia.", "SMA11-G-B4-06", "indoaus"),
    ("Sumatra bagian selatan dan kepulauan Maluku", False, "Ini wilayah yang berisiko tsunami tinggi.", "SMA11-G-B4-06", "tsunami_wilayah"),
    ("Kabupaten Bogor, Cianjur, dan Bandung", False, "Ini wilayah yang berpotensi tanah longsor.", "SMA11-G-B4-06", "longsor_wilayah"),
])
soal("L12", 5, "Proses keluarnya magma dari dalam bumi berupa material cair dan padat ke permukaan bumi disebut ...", "B", [
    ("erupsi", True, "Tepat. Materialnya meliputi lahar, bom, awan panas, debu vulkanik, dan lapili.", "", "erupsi"),
    ("lahar", False, "Lahar adalah salah satu material yang dikeluarkan saat erupsi.", "SMA11-G-B4-09", "erupsi"),
    ("gelombang seismik", False, "Gelombang seismik dihasilkan oleh energi gempa bumi.", "SMA11-G-B4-09", "gempa_def"),
    ("patahan", False, "Patahan adalah penyebab sebagian besar gempa bumi.", "SMA11-G-B4-09", "gempa_patahan"),
])
soal("L13", 5, "Menurut buku, kondisi yang memicu terjadinya tanah longsor antara lain ...", "A", [
    ("lereng terjal dan getaran", True, "Tepat. Juga curah hujan tinggi dan tutupan vegetasi yang berkurang.", "", "longsor_sebab"),
    ("lahan yang mampu meloloskan air", False, "Ini kondisi daerah yang terancam kekeringan.", "SMA11-G-B4-10", "kekeringan_faktor"),
    ("hunian di bantaran sungai", False, "Ini perilaku manusia yang menyebabkan banjir.", "SMA11-G-B4-10", "banjir_manusia"),
    ("gempa bumi berasal dari laut dangkal", False, "Ini penyebab tsunami.", "SMA11-G-B4-10", "gempa_tsunami"),
])
soal("L14", 5, "Selain curah hujan lebat, menurut buku banjir juga diakibatkan perilaku manusia, seperti ...", "D", [
    ("alih fungsi lahan dan pembuangan sampah sembarangan", True, "Tepat. Juga penggundulan hutan dan hunian di bantaran sungai.", "", "banjir_manusia"),
    ("pengikisan tanah yang tinggi dan tanah yang kurang padat", False, "Ini kondisi yang memicu tanah longsor.", "SMA11-G-B4-10", "longsor_sebab"),
    ("fenomena el nino yang membuat curah hujan berkurang", False, "Ini kondisi yang membuat wilayah rentan kebakaran hutan dan lahan.", "SMA11-G-B4-10", "karhutla_elnino"),
    ("penggunaan pupuk sintetis dalam pertanian", False, "Ini sumber utama emisi N₂O.", "SMA11-G-B4-10", "n2o"),
])
soal("L15", 5, "Menurut buku, salah satu penyebab kebakaran hutan dan lahan di Provinsi Riau adalah ...", "C", [
    ("metode tebas bakar (slash and burn)", True, "Tepat. Metode ini dipakai masyarakat untuk mengolah lahan perkebunan.", "", "riau_tebas"),
    ("hunian di bantaran sungai", False, "Ini perilaku manusia yang menyebabkan banjir.", "SMA11-G-B4-10", "banjir_manusia"),
    ("anomali cuaca dan curah hujan dengan intensitas tinggi", False, "Ini penyebab banjir Kalimantan Selatan tahun 2021.", "SMA11-G-B4-10", "kalsel"),
    ("intensitas hujan tinggi dan gundulnya pegunungan Cycloop", False, "Ini penyebab banjir bandang di Sentani tahun 2019.", "SMA11-G-B4-10", "sentani"),
])
cek("mit_longsor_hijau" in MITIGASI["longsor"] and "mit_gempa" in MITIGASI["gempa"])
soal("L16", 6, "Salah satu kegiatan mitigasi bencana tanah longsor adalah ...", "B", [
    ("penghijauan dengan tanaman berakar dalam", True, "Tepat. Mitigasi longsor juga mengurangi keterjalan lereng dan membuat terasering.", "", "mit_longsor_hijau"),
    ("pembersihan sampah dan pengerukan endapan sungai", False, "Ini mitigasi banjir.", "SMA11-G-B4-12", "mit_banjir_keruk"),
    ("melakukan sosialisasi untuk penghematan air", False, "Ini mitigasi kekeringan.", "SMA11-G-B4-12", "mit_kering_hemat"),
    ("penyelidikan gunung berapi dengan metode geologi", False, "Ini mitigasi letusan gunung berapi.", "SMA11-G-B4-12", "mit_gunung_selidik"),
])
soal("L17", 6, "Salah satu kegiatan mitigasi bencana gempa bumi adalah ...", "A", [
    ("mendirikan bangunan sesuai aturan baku", True, "Tepat. Bangunannya dibuat tahan gempa.", "", "mit_gempa"),
    ("mengurangi tingkat keterjalan lereng", False, "Ini mitigasi tanah longsor.", "SMA11-G-B4-12", "mit_longsor_lereng"),
    ("penataan daerah aliran sungai", False, "Ini mitigasi banjir.", "SMA11-G-B4-12", "mit_banjir_das"),
    ("pembangunan tanggul untuk menahan lahar", False, "Ini mitigasi letusan gunung berapi.", "SMA11-G-B4-12", "mit_gunung"),
])
soal("L18", 7, "Pembangunan breakwater dan seawall di pantai merupakan bentuk adaptasi terhadap bencana ...", "D", [
    ("tsunami", True, "Tepat. Juga pemasangan papan dan rambu penunjuk jalur evakuasi.", "", "adp_tsunami"),
    ("kekeringan", False, "Adaptasi kekeringan antara lain irigasi hemat air dan kampanye hemat air.", "SMA11-G-B4-15", "kekeringan_def"),
    ("kebakaran hutan dan lahan", False, "Adaptasinya antara lain sekat kanal dan embung.", "SMA11-G-B4-15", "riau_tebas"),
    ("tanah longsor", False, "Adaptasinya antara lain menanam pohon di lokasi longsor.", "SMA11-G-B4-15", "adp_longsor"),
])
cek(LONGSOR["withdrawal"] == "keluar dari lingkungan")
soal("L19", 7, "Menurut buku, adaptasi bencana tanah longsor dengan cara keluar dari lingkungan tempat tinggal ke tempat yang lebih aman disebut ...", "C", [
    ("adaptation by withdrawal", True, "Tepat.", "", "adp_longsor"),
    ("adaptation by reaction", False, "Adaptation by reaction dilakukan dengan menanam pohon di lokasi longsor.", "SMA11-G-B4-14", "adp_longsor"),
    ("adaptation by adjustment", False, "Adaptation by adjustment adalah perubahan perilaku masyarakat terhadap lingkungan.", "SMA11-G-B4-14", "adp_longsor"),
    ("adaptasi fisik", False, "Menurut buku, perubahan konstruksi rumah terhadap gempa bumi adalah adaptasi fisik.", "SMA11-G-B4-14", "adp_gempa"),
])
cek(TOHOR["kultural"] == "tohor_kultural")
soal("L20", 7, "Masyarakat Desa Sungai Tohor menghindari kebiasaan membuka lahan dengan memerun, yaitu membakar sisa kayu. Menurut buku, ini termasuk adaptasi ...", "B", [
    ("kultural", True, "Tepat. Memerun adalah kebiasaan budaya setempat.", "", "tohor_kultural"),
    ("fisik", False, "Adaptasi fisik mereka berupa sekat kanal dan embung.", "SMA11-G-B4-14", "tohor_fisik"),
    ("ekonomi", False, "Adaptasi ekonomi mereka berupa beberapa pekerjaan sebagai sumber pendapatan.", "SMA11-G-B4-14", "tohor_ekonomi"),
    ("struktural", False, "Adaptasi struktural mereka berupa aktivitas ramah gambut dan kerja sama dengan pemerintah.", "SMA11-G-B4-14", "tohor_struktural"),
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
# No question rests on a fact kept only for the book-error record, and no question carries a
# statement kept out of the lessons.
cek(not any(p[4].lstrip("=") in REKAMAN for s in S for p in s["pilihan"]))
_teks = " ".join(s["tanya"] + " " + " ".join(p[0] + " " + p[2] for p in s["pilihan"]) for s in S)
cek(not any(w in _teks for w in DILUAR), [w for w in DILUAR if w in _teks])

# The post-test never reuses a book assessment question (pp. 245-250) or a lesson example. The
# topics of the book's assessment, and of each post-test question:
TOPIK_UJI = {"arti pemanasan global", "penyebab pemanasan global", "proses efek rumah kaca", "gas rumah kaca dari bahan bakar fosil",
             "pemanasan global dan produktivitas pertanian", "pengelolaan tanah konservatif", "keanekaragaman hayati laut pulau kecil",
             "emisi gas rumah kaca sektor pertanian", "pemantauan gunung berapi", "terumbu karang", "gas rumah kaca kendaraan bermotor",
             "banjir rob dataran rendah", "dampak perubahan iklim terhadap pertanian", "bencana yang sering terjadi",
             "bencana yang mengiringi gempa di laut", "dampak pemanasan global negara kepulauan", "dampak pemanasan global wilayah pesisir",
             "dampak pemanasan global kota pantai", "vegetasi untuk erosi dan lahar", "korban meski ada mitigasi",
             "alternatif kekeringan petani", "adaptasi banjir rob", "kerentanan wilayah terhadap gempa", "adaptasi sekolah terhadap bencana",
             "rancangan mengatasi tanah longsor"}
TOPIK_POST = {"PB1": "perbedaan iklim dan cuaca", "PB2": "sumber metana", "PB3": "dampak suhu panas di daratan",
              "PB4": "kerentanan sosial", "PB5": "tanda letusan gunung berapi", "PB6": "mitigasi nonstruktural",
              "PB7": "adaptasi aktif terhadap banjir", "PB8": "mitigasi tsunami"}
cek(len(TOPIK_UJI) == 25)
cek({s_["ref"] for s_ in POST} == set(TOPIK_POST) and not set(TOPIK_POST.values()) & TOPIK_UJI)
KUNCI_UJI = {"karbon dioksida", "rob", "tsunami", "kekeringan", "pemutihan", "emisi gas rumah kaca", "suhu rata-rata",
             "risiko bencana", "banjir", "tanah longsor", "gempa bumi", "konservatif", "metan"}
for s_ in POST:
    benar = next(p[0] for p in s_["pilihan"] if p[1]).lower()
    cek(not any(re.search(rf"\b{re.escape(k)}\b", benar) for k in KUNCI_UJI), f"{s_['ref']}: its key is a book assessment key")
# The lesson's worked example (Sitiarjo, Semeru) is not in the post-test.
cek(not any(w in s_["tanya"] for s_ in POST for w in ("Sitiarjo", "Semeru", "847")))


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
    tulis(os.path.join(here, "SMA11-Geografi-Bab4.xlsx"))
    tulis_miskonsepsi(os.path.join(here, "SMA11-Geografi-Bab4-miskonsepsi.csv"))
    halaman = sum(p["isi"].count("## ") for p in PELAJARAN)
    print(f"SMA11-Geografi-Bab4.xlsx: lessons {len(PELAJARAN)} ({halaman} pages), questions {len(S)} "
          f"(pre {len(PRE)}, post {len(POST)}, practice {len(LAT)}), answers "
          + " ".join(f"{h}={HURUF[h]}" for h in "ABCD"))
    print(f"SMA11-Geografi-Bab4-miskonsepsi.csv: {len(MISKONSEPSI)} codes")
    print(f"facts traced: {len(FAKTA)} (pages {min(h for h, _ in FAKTA.values())}-{max(h for h, _ in FAKTA.values())})")
    if "--kutipan" in sys.argv:
        ada, gambar = periksa_kutipan(sys.argv[sys.argv.index("--kutipan") + 1])
        print(f"quotations found in the book's text: {ada} of {len(FAKTA)}; figures read by eye: {', '.join(gambar) or 'none'}")
    print(f"assertions passed: {CEK[0]}")
