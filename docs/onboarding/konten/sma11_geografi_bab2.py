# SMA Kelas XI, Geografi, Bab 2 "Keragaman Hayati Indonesia dan Dunia", as a PINTAR lesson
# workbook in the D-007 template (sheets Kursus, Bab, Pelajaran, Soal, Pilihan; the column
# contract is KOLOM in src/lib/unggah-kontrak.ts). Built the way Bab 1 was (LANA-10, passed).
#
# Source: the student book "Geografi untuk SMA/MA Kelas XI (Edisi Revisi)" (Budi Handoyo, Nisa
# Maulia; Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi, 2024), Bab II, pp. 67-136. The
# book has no answer keys, so every key here is ours, and every question is answerable from its
# text.
#
# Every fact is traced, as in Bab 1:
#   - FAKTA holds the chapter's facts, each with its page and a quotation from the book;
#   - every option names the fact it rests on (a distractor is a true fact that answers a
#     different question), and the generator checks the option's content words against that
#     fact's quotation;
#   - what can be computed is asserted: the sago areas, the counts in Tabel 2.1 and 2.2, the
#     temperature fall with height (0,5 °C every 100 m, p. 110), which one post-test question uses;
#   - classifications are checked against models built from the book's own lists: the eight fauna
#     regions of Wallace, the three fauna regions of Indonesia, the plants by humidity, the height
#     zones of Gambar 2.44, and in situ against ex situ.
# With `--kutipan <text file of the book>` every quotation is also checked against the book's text.
#
# Text lessons only (D-050): what a map or figure shows is put into words, and a table is one fact
# per line. The workbook's "Kode miskonsepsi" column names each distractor's code, defined on its
# "Miskonsepsi" sheet (CR-50, D-063 M5); SMA11-Geografi-Bab2-miskonsepsi.csv lists the same codes
# with the questions using them.
#
# Run: python3 docs/onboarding/konten/sma11_geografi_bab2.py [--kutipan book.txt]
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
    """Lower case, the fi/fl ligatures as the PDF extracts them ("lora", "epiit"), and only letters
    and digits, so a quotation can be found in the extracted text."""
    teks = teks.lower().replace("ﬁ", "i").replace("ﬂ", "l").replace("fi", "i").replace("fl", "l")
    return re.sub(r"[^0-9a-z]", "", teks)


FAKTA = {}


def fakta(id_, hal, kutipan):
    cek(id_ not in FAKTA, id_)
    FAKTA[id_] = (hal, kutipan)


# A. Keragaman flora dan fauna Indonesia (pp. 70-82)
fakta("flora_def", 70, "Istilah flora berasal dari bahasa latin yang berarti alam tumbuhan.")
fakta("flora_endemik", 70, "Flora endemik suatu daerah adalah jenis tumbuhan tertentu yang tidak dijumpai di wilayah lain.")
fakta("fauna_def", 70, "Kata fauna berasal dari bahasa latin yang berarti alam hewan.")
fakta("fauna_endemik", 70, "Fauna endemik adalah hewan yang hanya ditemukan di wilayah tertentu dan tidak dapat ditemukan di daerah lain.")
fakta("endemik_contoh", 71, "Contohnya burung Cendrawasih dan Badak. Jenis burung itu merupakan endemik asli Papua, sedangkan badak bercula satu merupakan endemik Ujung Kulon, pulau Jawa.")
fakta("manfaat_bidang", 71, "banyak manfaat flora fauna bagi kehidupan manusia, seperti pada bidang pangan, kesehatan, ilmu pengetahuan, keseimbangan lingkungan, pariwisata, ekonomi")
fakta("padi", 72, "Padi merupakan tanaman yang cocok dibudidayakan di Indonesia yang beriklim tropis.")
fakta("sagu", 73, "Tanaman Sagu atau sagoo palm (Metroxylon sagu) merupakan makanan pokok di Indonesia bagian timur, seperti Nusa Tenggara, Maluku, Papua.")
fakta("sagu_luas", 73, "luas sagu dunia mencapai 6,5 juta ha. Dari luas lahan tersebut, Indonesia memiliki pohon sagu seluas 5,5 juta ha dan dari luas lahan tersebut 5,2 juta ha berada di Papua dan Papua Barat.")
fakta("obat", 74, "Menurut catatan WHO sekitar 20.000 spesies tumbuhan dipergunakan oleh penduduk dunia sebagai obat (Malik, 2020). Ada sekitar 1.260 spesies tumbuhan yang secara pasti diketahui berkhasiat sebagai obat Indonesia.")
fakta("toga", 74, "Misalnya jahe, kunyit, daun sambiloto, temulawak, lengkuas, jeruk nipis, kumis kucing, dan daun saga.")
fakta("eukaliptus_obat", 74, "Satu di antara jenis tanaman yang paling terkenal pemanfaatannya bagi kesehatan adalah eukaliptus. Tumbuhan ini merupakan bahan utama untuk minyak kayu putih.")
fakta("jati_mebel", 75, "Kayu jati sangat diandalkan dalam industri mebel.")
fakta("jati_asam", 75, "Kandungan tanah pada kedua pulau tersebut memiliki tingkat keasaman yang tinggi.")
fakta("harimau_predator", 75, "Peran harimau penting sebagai pengontrol jumlah populasi hewan pemakan tumbuhan")
fakta("barat_timur", 77, "Wilayah barat umumnya memiliki curah hujan tinggi dan beriklim basah, sedangkan di wilayah timur bercurah hujan lebih rendah dan beriklim lebih kering.")
fakta("ind_luas", 77, "Indonesia memiliki luas sekitar 9 juta km2 dengan lebih dari 17 ribu pulau dan garis pantai hingga 95.181 km.")
fakta("flora_10persen", 78, "Jenis flora di Indonesia berjumlah lebih dari 10% jenis tumbuhan di seluruh dunia")
fakta("tabel21", 78, "Paku-pakuan 4.000 Rotan 322 Spesies Pohon Meranti 400 Jenis Pohon Bambu 122 Jenis Tanaman Anggrek 4.000")
fakta("tabel22", 79, "Pisces (Ikan) 4.000 Aves (Burung) 1.600 Mamalia 500 Reptilia dan amfibi 1.000 Insecta (serangga) 200.000")
fakta("eksploitasi", 80, "Eksploitasi berlebihan atau overeksploitasi adalah proses pengambilan sumber daya terbarukan sampai sumber daya tersebut menjadi berkurang.")
fakta("punah_penduduk", 81, "Jumlah flora dan fauna di Indonesia dari tahun ke tahun semakin menyusut. Hal ini disebabkan oleh pertumbuhan penduduk yang begitu cepat")
fakta("daftar_merah", 81, "Sebanyak 1.252 jenis tumbuhan Indonesia masuk dalam daftar merah sebagai jenis flora yang akan punah.")
fakta("harimau_400", 81, "harimau Sumatra populasinya diperkirakan kurang dari 400 ekor")
fakta("harimau_14", 82, "tidak kurang 14 ekor mati terbunuh oleh pemburu yang hanya ingin memperoleh keuntungan dari penjualan hewan buruannya.")
fakta("badak_50", 82, "Saat ini, badak bercula satu yang dilindungi di Ujung Kulon berjumlah sekitar 50 ekor.")
fakta("kakatua_24", 80, "Contohnya kasus penyelundupan 24 kakatua jambul kuning.")
fakta("pesut_50", 82, "Demikian juga pesut Mahakam yang hanya berjumlah sekitar 50 ekor.")
# B.1 Bioma (pp. 83-89)
fakta("bioma_def", 83, "Bioma biasanya diklasifikasikan berdasarkan vegetasi yang dominan dalam suatu wilayah regional yang luas.")
fakta("padang_rumput", 83, "Curah hujan di daerah padang rumput pada umumnya antara 250–500 mm/tahun.")
fakta("stepa", 84, "Daerah stepa umumnya terdiri atas rumput-rumput pendek dan diselingi oleh semak belukar.")
fakta("sabana", 85, "Vegetasi yang mendominasi sabana di antaranya rumput dan akasia diselingi dengan pohon tinggi.")
fakta("gurun_tumbuhan", 85, "Pada umumnya tumbuhan yang hidup di gurun berdaun kecil seperti duri atau tidak berdaun.")
fakta("gurun", 85, "Curah hujan di gurun rendah, yaitu sekitar 250 mm/tahun atau kurang.")
fakta("gurun_amplitudo", 86, "Perbedaan suhu siang dan malam hari (amplitudo harian) sangat tinggi.")
fakta("tundra", 86, "Daerah tundra hanya terdapat di belahan bumi utara dan kebanyakan terletak di daerah lingkungan kutub utara.")
fakta("tundra_lumut", 86, "Di daerah tundra tidak ada pohon yang tinggi, tetapi berupa tanaman pendek seperti semak. Di daerah tundra juga banyak terdapat lumut, terutama sphagnum (lumut gambut) dan lichenes (lumut kerak).")
fakta("hutan_tropis", 88, "Hutan tropis memiliki kelembapan tinggi dan suhu rata-rata 25ºC.")
fakta("liana_epifit", 88, "Salah satu contoh liana adalah rotan, sedangkan salah satu contoh epifit adalah anggrek.")
fakta("hutan_gugur", 89, "Hutan Gugur Di daerah yang beriklim sedang memiliki curah hujan rendah antara 750 sampai 1.000 mm/tahun.")
fakta("gugur_musim", 89, "Ada empat musim yang berlangsung di wilayah ini, yaitu musim semi, panas, gugur, dan dingin.")
fakta("taiga", 89, "Taiga merupakan hutan pohon pinus yang daunnya berbentuk seperti jarum")
fakta("taiga_utara", 89, "Taiga banyak terdapat di belahan bumi bagian utara (Siberia Utara, Rusia, Kanada Tengah dan Utara)")
fakta("taiga_satu", 89, "Daerah taiga merupakan bioma yang hanya terdiri atas satu spesies pohon.")
fakta("taiga_pohon", 89, "Tumbuhan yang terdapat di hutan taiga misalnya konifer, terutama pohon spruce (picea), alder (alnus), birch (betula), dan juniper (juniperus).")
# B.2 Wilayah fauna dunia menurut Wallace (pp. 90-101)
fakta("wallace_8", 90, "Pada tahun 1876, Alfred Russel Wallace membagi wilayah persebaran fauna menjadi 8 wilayah.")
fakta("wallace_nama", 90, "Ethiopian, Palearctic, Oriental, Australian, Neotropical, Nearctic, Oceanic dan Antarctic")
fakta("ethiopian", 91, "persebaran fauna di wilayah Ethiopian sendiri meliputi keseluruhan benua Afrika, Madagaskar, dan juga sebagian daratan Arab")
fakta("sahara", 91, "Gurun Sahara menjadi pembatas alami antara wilayah Ethiopian dengan wilayah Palearktik")
fakta("ethiopian_fauna", 92, "Fauna khas yang berada di wilayah Afrika, misalnya gajah, singa, citah, dan hyena.")
fakta("madagaskar", 92, "Fauna khas yang hanya ditemukan di Pulau Madagaskar, misalnya lemur dan kuda nil kecil.")
fakta("palearktik", 92, "Zona Palearktik merupakan zona dengan kawasan paling luas di antara zona lainnya.")
fakta("palearktik_fauna", 93, "Beberapa jenis fauna Palearktik yang tetap bertahan di lingkungan aslinya yaitu panda di Cina, unta di Afrika Utara")
fakta("nearktik", 94, "Wilayah Nearktik Wilayah persebarannya meliputi kawasan Amerika Serikat, Amerika Utara dekat kutub utara, dan Greenland.")
fakta("neotropikal", 95, "Wilayah Neotropikal Wilayah persebarannya meliputi Amerika Tengah, Amerika Selatan, dan sebagian besar Meksiko")
fakta("neotropikal_fauna", 95, "Hewan endemik di wilayah ini ialah ikan piranha dan belut listrik di sungai Amazon")
fakta("oriental", 97, "Zona oriental meliputi wilayah India, Indochina (Kamboja, Laos, Vietnam), serta Indomalayan (Malaysia, Sumatra, Jawa, Kalimantan, dan Filipina).")
fakta("oriental_fauna", 97, "Hewan yang khas wilayah ini adalah harimau, orangutan, gibbon, rusa, banteng, dan badak bercula satu.")
fakta("oriental_endemik", 98, "Komodo yang hanya dapat ditemukan di Pulau Komodo dan di pulau-pulau kecil di sekitarnya serta anoa di Sulawesi.")
fakta("australian", 98, "Wilayah Australian Wilayah ini mencakup kawasan Australia, Selandia Baru, Irian, Maluku, dan pulau- pulau sekitarnya.")
fakta("australian_fauna", 99, "Beberapa hewan khas wilayah ini adalah kanguru, burung kiwi, koala, cocor bebek")
fakta("oceanik", 100, "Wilayah Oceanik Fauna di wilayah ini tersebar di kawasan kepulauan di Samudra Pasifik.")
fakta("antartik", 100, "wilayah ini mencakup Kawasan Kutub Selatan. Daerah persebarannya meliputi benua Antartika dan pulau-pulau kecil di sekitarnya.")
fakta("tundra_fauna", 87, "Mamalia lain yang dapat hidup di tundra adalah beruang kutub, kelinci kutub, dan lemur.")
# C. Sebaran flora dan fauna di Indonesia (pp. 101-109)
fakta("garis_wallace", 101, "Garis Wallace merupakan garis khayal yang memisahkan persebaran fauna Indonesia bagian barat atau asiatis dengan fauna Indonesia tengah atau peralihan")
fakta("garis_weber", 101, "Garis Weber adalah garis khayal yang memisahkan persebaran fauna Indonesia tengah atau peralihan dengan fauna Indonesia Timur atau australis.")
fakta("weber_belanda", 101, "Max Wilhelm Carl Weber, seorang profesor zoologi dari Belanda")
fakta("flora_4", 102, "flora Sumatra-Kalimantan, flora Jawa-Bali, flora Kepulauan Wallacea, dan flora Papua")
fakta("flora_sumkal", 102, "Beberapa flora khas daerah Sumatra dan Kalimantan, antara lain kayu meranti, damar, dan berbagai jenis anggrek.")
fakta("jawabali_hujan", 103, "Sebagian besar kawasan hutan hujan tropis tersebar di Jawa Barat, seperti Ujung Kulon, Cibodas (Bogor), dan Pananjung (Pangandaran).")
fakta("jati_muson", 103, "Jenis flora khas hutan muson tropis antara lain pohon jati yang merupakan pohon asli atau endemik di Pulau Jawa.")
fakta("sabana_bali", 103, "Jenis vegetasi yang mendominasi wilayah Jawa Timur bagian timur dan Pulau Bali adalah sabana tropis.")
fakta("wallacea_veg", 104, "Vegetasi sabana dan stepa tropis di wilayah Nusa Tenggara. 2) Vegetasi hutan pegunungan di sekitar Sulawesi. 3) Vegetasi hutan campuran di wilayah Maluku dengan jenis rempah-rempah, seperti pala, cengkih, kayu manis, kenari, kayu eboni, dan lontar.")
fakta("flora_papua", 105, "Berbeda dengan wilayah Indonesia bagian barat, vegetasi Papua memiliki corak Australia Utara, dengan flora khas yaitu eukaliptus.")
fakta("fauna_tiga", 106, "Sebagian besar corak fauna bagian barat sama dengan corak fauna oriental, sedangkan bagian timur (Maluku dan Papua) sama dengan corak fauna Australia.")
fakta("fauna_barat", 106, "Wilayah fauna Indonesia bagian barat meliputi Pulau Sumatra, Jawa, Bali, Kalimantan, serta pulau-pulau kecil di sekitarnya. Region fauna ini disebut wilayah Fauna Dangkalan Sunda.")
fakta("fauna_barat_mamalia", 106, "Mamalia: gajah, badak bercula satu, tapir, rusa, banteng, kerbau, monyet, orangutan, macan")
fakta("fauna_tengah", 107, "Wilayah fauna Indonesia tengah juga disebut fauna Kepulauan Wallacea. Region ini terdiri atas Pulau Sulawesi dan kepulauan sekitarnya. Kepulauan Nusa Tenggara, Pulau Timor, dan Kepulauan Maluku. Di Kawasan ini terdapat hewan khas yang hanya dapat dijumpai di Indonesia, yaitu anoa, babi rusa, dan biawak komodo.")
fakta("fauna_timur", 108, "Wilayah fauna Indonesia Timur disebut juga fauna Dangkalan Sahul. Fauna di wilayah ini menyebar di kepulauan Papua dan pulau-pulau kecil sekitarnya.")
fakta("fauna_timur_mamalia", 108, "Mamalia: kanguru, wallaby, nokdiak (landak Irian), opposum layang")
fakta("cendrawasih", 109, "Ada sekitar 42 jenis burung cenderawasih, 30 di antaranya berada di Indonesia.")
# D. Faktor sebaran (pp. 110-113)
fakta("faktor", 110, "Ada beberapa faktor yang mempengaruhi persebaran flora dan fauna di Indonesia, yaitu iklim (suhu, kelembapan, udara, curah hujan), tanah, dan pengaruh aktivitas manusia, hewan serta tumbuh-tumbuhan")
fakta("khatulistiwa", 110, "Daerah yang terletak pada lintang 90o di daerah khatulistiwa menerima sinar matahari lebih intensif daripada zona lainnya.")
fakta("lapse", 110, "Setiap naik 100 meter suhu udara rata-rata turun sekitar 0,5o C.")
fakta("tinggi_dingin", 110, "Semakin tinggi suatu tempat semakin dingin suhu udaranya")
fakta("apel", 111, "Beberapa kecamatan di Kota Batu dan Kabupaten Malang memiliki ketinggian di atas 600 m dari permukaan laut. Tempat-tempat tersebut menjadi wilayah penghasil apel yang produktif.")
fakta("zona_suhu", 111, "Daerah Panas: Padi, Tebu, Karet, Kelapa, 0-600 m, 23,3°-22°C. Daerah Sedang: Tembakau, Kopi, Cokelat, Padi, 600-1500 m, 22°-17,1°C. Daerah Sejuk: Hutan tanaman industri, Sayuran, Kopi, Teh, Kina, 1500-2500 m, 17,1°-11,1°C. Daerah Dingin: Tidak ada tanaman budidaya, di atas 2500 m, <11°C.")   # Gambar 2.44
fakta("xerophyta", 111, "Xerophyta adalah tumbuhan yang tahan di lingkungan kering atau kelembapan udara sangat rendah, seperti kaktus.")
fakta("mesophyta", 111, "Mesophyta adalah tumbuhan yang cocok hidup di lingkungan lembap tetapi tidak basah, contohnya anggrek dan cendawan.")
fakta("hygrophyta", 111, "Hygrophyta adalah tumbuhan yang cocok hidup di kawasan basah, seperti teratai, eceng gondok, dan selada air.")
fakta("tropophyta", 111, "Tropophyta adalah tumbuhan yang bisa beradaptasi di daerah musim hujan dan musim kemarau.")
fakta("tropophyta_contoh", 112, "merupakan flora khas wilayah iklim musim tropis (monsun tropis), contohnya pohon Jati dan eukaliptus.")
fakta("hujan_tropis", 112, "hutan tropis dapat tumbuh di kawasan bercurah hujan 1.000-2.000 mm dan suhu udara 20-30 oC")
fakta("stepa_hujan", 112, "padang rumput stepa yang berkembang di wilayah dengan curah hujan 200-1.000 mm")
fakta("tanah_jati", 113, "di Jawa bagian selatan dan utara banyak tumbuh hutan jati karena tanahnya mengandung kapur yang cocok untuk tanaman tersebut.")
fakta("manusia_kurma", 113, "Manusia memiliki kemampuan dalam ilmu pengetahuan dan teknologi yang dapat mengubah lingkungan dengan memindahkan tumbuhan dari satu tempat ke tempat yang lain (Siahaan, 2017). Saat ini mulai banyak tanaman kurma berasal dari wilayah Timur Tengah dipindahkan ke Indonesia")
fakta("hewan_biji", 113, "Hewan juga memiliki kemampuan untuk menyebarkan tanaman dari satu tempat ke tempat lain. Beberapa jenis hewan memiliki perilaku memindahkan biji-bijian setelah dimakan dagingnya. Contoh kalong yang mampu memindahkan biji durian, serangga mampu membantu penyerbukan")
fakta("tumbuhan_subur", 113, "Sementara itu, tumbuhan berperan untuk menyuburkan tanah.")
# E-G. Manfaat, pelestarian, metode (pp. 114-125)
fakta("bunga_7", 114, "Indonesia menduduki urutan ketujuh dalam kekayaan flora berbunga, lebih dari 25 ribu tumbuhan berbunga")
fakta("burung_1519", 114, "Indonesia juga memiliki 1.519 jenis burung, lebih dari 270 jenis amfibi, dan lebih dari 600 jenis reptil.")
fakta("gdp_32", 115, "keanekaragaman flora dan fauna menyumbang sekitar 32% GDP")
fakta("ikan_7000", 115, "terdapat 7.000 jenis ikan laut dan ikan tawar yang menjadi sumber protein pertama bagi masyarakat Indonesia.")
fakta("sosial", 115, "Dalam bidang sosial, keanekaragaman flora dan fauna memiliki fungsi sebagai penyedia lapangan pekerjaan, pembentuk budaya setempat, dan jati diri masyarakat.")
fakta("ekologis", 116, "Adapun fungsi ekologis dari keanekaragaman flora dan fauna ialah ketersediaan oksigen yang dihasilkan oleh tumbuhan.")
fakta("bioregional", 116, "Kawasan bioregional merupakan kawasan daratan dan perairan yang memiliki batasan didasarkan pada batas geografis kelompok masyarakat dan sistem ekologis tertentu.")
fakta("investasi", 117, "Kegiatan tersebut dapat dilakukan dengan mengembangkan ekowisata berbasis sains dan bioprospeksi")
fakta("konservasi_uu", 118, "Menurut Undang-Undang No. 05 Tahun 1990, konservasi adalah upaya pelestarian sumber daya alam hayati secara berkelanjutan")
fakta("tujuan_konservasi", 118, "Menjamin kelestarian fungsi ekosistem sebagai penyangga kehidupan. 2. Mencegah kepunahan spesies yang disebabkan oleh kerusakan habitat dan pemanfaatan yang tidak terkendali. 3. Menyediakan sumber plasma nutfah atau keanekaragaman genetika.")
fakta("in_situ", 120, "Metode in situ adalah upaya pelestarian keanekaragaman hayati yang dilakukan langsung di habitat asli flora dan fauna bersangkutan")
fakta("in_situ_populasi", 120, "Pelestarian cara ini mampu melindungi populasi dan komunitas alami di habitat aslinya.")
fakta("cagar_alam", 120, "Contoh cagar alam Maninjau, kebun raya Cibodas, cagar alam Pulau Sempu.")
fakta("taman_nasional", 121, "Contoh Taman Nasional Komodo, Taman Nasional Ujung Kulon, dan Taman Nasional Kerinci, Taman Nasional Tengger")
fakta("hutan_lindung", 122, "Hutan Lindung adalah hutan yang ditetapkan oleh pemerintah untuk dilindungi karena ekosistem di dalamnya berperan penting dalam keseimbangan lingkungan.")
fakta("ex_situ", 123, "Metode ex situ merupakan upaya pelestarian keanekaragaman hayati yang dilakukan di luar habitat asli flora dan fauna. Metode ex situ dilakukan saat habitat asli flora dan fauna mengalami kerusakan yang parah")
fakta("tahura", 123, "Taman hutan raya merupakan kawasan pelestarian hutan yang digunakan untuk mengoleksi flora dan fauna asli atau berasal dari tempat lain.")
fakta("tahura_contoh", 123, "Contoh, Taman Hutan Raya Cut Nyak Dien dan Taman Hutan Raya Bukit Barisan.")
fakta("safari_buatan", 124, "Taman safari merupakan salah satu upaya menjaga keanekaragaman hayati dengan membuat lingkungan buatan yang persis dengan tempat flora dan fauna berasal.")
fakta("taman_safari", 124, "Ada dua taman safari yang indah dikunjungi, yaitu Taman Safari Bogor, Jawa Barat dan Taman Safari Prigen, Jawa Timur.")
fakta("kebun_binatang", 124, "Kebun binatang merupakan daerah konservasi lingkungan buatan yang dibuat persis sama dengan tempat flora dan fauna berasal")
fakta("akkm", 125, "AKKM merupakan areal yang dikelola dengan fungsi konservasi oleh Masyarakat Adat/masyarakat lokal dalam suatu kesatuan ekosistem")

# Facts read off a figure: Gambar 2.44 (p. 111), whose labels the PDF text lays out out of order.
GAMBAR = {"zona_suhu"}

# ── What can be computed ──
# BOOK ERROR (Uji Kompetensi 9, p. 129): 0,008 ton of carbon per 30 kelor plants, for 2.400
# plants, is 0,64 ton; none of the options (0,008; 0,08; 0,8; 8; 80 ton) is right.
cek(Fraction(2400, 30) * Fraction(8, 1000) == Fraction(64, 100)
    and Fraction(64, 100) not in {Fraction(8, 1000), Fraction(8, 100), Fraction(8, 10), 8, 80})
cek(Fraction(52, 10) < Fraction(55, 10) < Fraction(65, 10))                     # sago, p. 73
cek(20000 > 1260 and 1252 < 1260)                                                # p. 74 and p. 81
TABEL21 = {"Paku-pakuan": 4000, "Rotan": 322, "Meranti": 400, "Bambu": 122, "Anggrek": 4000}
TABEL22 = {"Pisces (ikan)": 4000, "Aves (burung)": 1600, "Mamalia": 500, "Reptilia dan amfibi": 1000, "Insecta (serangga)": 200000}
cek(all(norm(f"{v:,}".replace(",", ".")) in norm(FAKTA["tabel21"][1]) for v in TABEL21.values()))
cek(all(norm(f"{v:,}".replace(",", ".")) in norm(FAKTA["tabel22"][1]) for v in TABEL22.values()))
cek(max(TABEL22, key=TABEL22.get) == "Insecta (serangga)" and min(TABEL22, key=TABEL22.get) == "Mamalia")
# BOOK INCONSISTENCY: Tabel 2.2 (p. 79) gives 1.600 kinds of bird; p. 114 gives 1.519.
cek(TABEL22["Aves (burung)"] == 1600 != 1519)


def suhu(t0, h0, h1):
    """The book's rule (p. 110): the air cools about 0,5 °C for every 100 m of height."""
    return Fraction(t0) - Fraction(h1 - h0, 100) * Fraction(1, 2)


ZONA_SUHU = [("panas", 0, 600, ["padi", "tebu", "karet", "kelapa"]),
             ("sedang", 600, 1500, ["tembakau", "kopi", "cokelat", "padi"]),
             ("sejuk", 1500, 2500, ["hutan tanaman industri", "sayuran", "kopi", "teh", "kina"]),
             ("dingin", 2500, 10000, [])]
cek(all(norm(t) in norm(FAKTA["zona_suhu"][1]) for _, _, _, v in ZONA_SUHU for t in v))


def zona_tinggi(m):
    return next(z for z, a, b, _ in ZONA_SUHU if a <= m < b)


cek(zona_tinggi(700) == "sedang" and "teh" in ZONA_SUHU[2][3] and "kina" in ZONA_SUHU[2][3] and "teh" not in ZONA_SUHU[0][3] + ZONA_SUHU[1][3])

# Wallace's eight regions (pp. 90-100): where each lies, and animals the book names for it.
WILAYAH = {"Ethiopian": ["Afrika", "Madagaskar", "Arab"], "Palearktik": [], "Nearktik": ["Amerika Serikat", "Greenland"],
           "Neotropikal": ["Amerika Tengah", "Amerika Selatan", "Meksiko"], "Oriental": ["India", "Indochina", "Sumatra", "Jawa", "Kalimantan"],
           "Australian": ["Australia", "Irian", "Maluku"], "Oceanik": ["Samudra Pasifik"], "Antartik": ["Antartika"]}
cek(len(WILAYAH) == 8 and all(norm(k[:4]) in norm(FAKTA["wallace_nama"][1]) for k in WILAYAH))
cek(all(norm(t) in norm(FAKTA[k.lower()][1]) for k, v in WILAYAH.items() for t in v))

# Indonesia's three fauna regions (pp. 106-108).
FAUNA_ID = {"barat": ["Sumatra", "Jawa", "Bali", "Kalimantan"], "tengah": ["Sulawesi", "Nusa Tenggara", "Timor", "Maluku"], "timur": ["Papua"]}
cek(all(norm(t) in norm(FAKTA["fauna_" + k][1]) for k, v in FAUNA_ID.items() for t in v))
# BOOK INCONSISTENCY: p. 106 puts Maluku in the east ("bagian timur (Maluku dan Papua)"); p. 107
# puts Kepulauan Maluku in the Wallacea (central) region. No question asks where Maluku belongs.
cek("maluku" in norm(FAKTA["fauna_tiga"][1]) and "maluku" in norm(FAKTA["fauna_tengah"][1]))
HEWAN_ID = {"barat": ["gajah", "badak bercula satu", "orangutan", "banteng", "tapir"], "tengah": ["anoa", "babi rusa", "komodo"],
            "timur": ["kanguru", "wallaby", "nokdiak"]}
cek(all(norm(t) in norm(FAKTA["fauna_" + k + ("_mamalia" if k != "tengah" else "")][1]) for k, v in HEWAN_ID.items() for t in v))

# Plants by the humidity they need (pp. 111-112).
KELEMBAPAN = {"xerophyta": ["kaktus"], "mesophyta": ["anggrek"], "hygrophyta": ["teratai", "eceng gondok", "selada air"],
              "tropophyta": ["jati", "eukaliptus"]}
cek(all(norm(t) in norm(FAKTA[k][1] + (FAKTA["tropophyta_contoh"][1] if k == "tropophyta" else "")) for k, v in KELEMBAPAN.items() for t in v))

# In situ and ex situ (pp. 120-124).
METODE = {"in situ": ["cagar alam", "taman nasional", "hutan lindung"], "ex situ": ["taman hutan raya", "taman safari", "kebun binatang"]}
cek(not set(METODE["in situ"]) & set(METODE["ex situ"]))

SUMBER = ("_Diadaptasi dari Geografi untuk SMA/MA Kelas XI (Edisi Revisi), Budi Handoyo dan Nisa Maulia, Kementerian "
          "Pendidikan, Kebudayaan, Riset, dan Teknologi, 2024, Bab II._")

KURSUS = {
    "Judul kursus*": "Geografi Kelas XI · Bab 2: Keragaman Hayati Indonesia dan Dunia",
    "Mata pelajaran*": "Geografi",
    "Jenjang*": "SMA",
    "Kelas*": "Kelas XI",
    "Konteks": "Akademik",
}

BAB = [(1, "Keragaman Hayati Indonesia dan Dunia")]

PELAJARAN = [
    dict(no=1, judul="Pengertian dan Arti Penting Flora dan Fauna",
         ringkasan="Flora adalah alam tumbuhan dan fauna alam hewan; flora dan fauna endemik hanya ada di wilayah tertentu, dan keduanya penting bagi pangan, kesehatan, ekonomi, dan keseimbangan ekosistem.",
         tujuan="Kalian dapat menjelaskan pengertian flora, fauna, dan endemik serta arti penting flora dan fauna bagi kehidupan.",
         bloom="Memahami",
         isi=f"""## Flora, fauna, dan endemik

- **Flora** berasal dari bahasa Latin yang berarti alam tumbuhan, yaitu sekelompok tanaman atau tumbuhan.
- **Fauna** berasal dari bahasa Latin yang berarti alam hewan, yaitu segala jenis hewan yang hidup di dunia.

**Flora endemik** adalah jenis tumbuhan tertentu yang tidak dijumpai di wilayah lain. Setiap daerah mempunyai iklim, cuaca, dan tanah yang berbeda, sehingga tumbuhannya pun khas.

**Fauna endemik** adalah hewan yang hanya ditemukan di wilayah tertentu. Persebarannya alami, tanpa campur tangan manusia. Contohnya:
- burung cendrawasih, endemik asli Papua;
- badak bercula satu, endemik Ujung Kulon, Pulau Jawa.

## Sumber bahan makanan

Flora dan fauna bermanfaat di bidang pangan, kesehatan, ilmu pengetahuan, keseimbangan lingkungan, pariwisata, dan ekonomi.

- **Padi** cocok dibudidayakan di Indonesia yang beriklim tropis. Lumbung padi nasional antara lain Jawa Barat, Jawa Tengah, Jawa Timur, Sumatra, Sulawesi Selatan, dan Sumatra Selatan (BPS, 2021).
- **Sagu** adalah makanan pokok di Indonesia bagian timur, seperti Nusa Tenggara, Maluku, dan Papua. Menurut UP4B (2014), luas sagu dunia 6,5 juta ha; Indonesia memiliki 5,5 juta ha, dan 5,2 juta ha di antaranya berada di Papua dan Papua Barat.
- Jagung, singkong, ubi jalar, dan kentang ditanam sebagai makanan pokok maupun tambahan.

## Kesehatan dan ekonomi

**Kesehatan.** Menurut catatan WHO, sekitar 20.000 spesies tumbuhan dipakai penduduk dunia sebagai obat. Di Indonesia ada sekitar 1.260 spesies tumbuhan yang secara pasti diketahui berkhasiat obat. Banyak yang ditanam sebagai TOGA (tanaman obat keluarga), seperti jahe, kunyit, sambiloto, temulawak, dan kumis kucing. Eukaliptus adalah bahan utama minyak kayu putih.

**Ekonomi.** Kayu khas Indonesia antara lain jati, mahoni, dan gaharu. Kayu jati sangat diandalkan dalam industri mebel dan harganya mahal karena perlu berusia puluhan tahun.

## Keseimbangan ekosistem

Setiap hewan dan tumbuhan berperan dalam rantai makanan: sebagai konsumen, predator, pengurai, dan sebagainya.

Contohnya **harimau**, predator karnivora yang memburu hewan pemakan tumbuhan. Harimau berperan sebagai pengontrol jumlah populasi hewan pemakan tumbuhan.

Bila hewan pemakan tumbuhan bertambah drastis, hutan terus dimakan dan tidak dapat beregenerasi. Hutan kehilangan kemampuannya menghasilkan oksigen, dan hewan ternak kekurangan pakan.

{SUMBER}"""),
    dict(no=2, judul="Ragam dan Permasalahan Flora Fauna Indonesia",
         ringkasan="Indonesia memiliki ragam flora dan fauna yang sangat tinggi, tetapi sebagian menghadapi eksploitasi berlebihan dan ancaman kepunahan.",
         tujuan="Kalian dapat menjelaskan keragaman flora dan fauna Indonesia serta permasalahan yang dihadapinya.",
         bloom="Menganalisis",
         isi=f"""## Negara kepulauan yang beragam

Indonesia adalah negara kepulauan yang luas, beriklim tropis, dan bertopografi bervariasi. Luasnya sekitar 9 juta km², dengan lebih dari 17 ribu pulau.

Curah hujannya pun berbeda:
- wilayah barat umumnya bercurah hujan tinggi dan beriklim basah;
- wilayah timur bercurah hujan lebih rendah dan beriklim lebih kering.

Variasi curah hujan, suhu, dan tanah membuat keragaman flora dan faunanya tinggi, bahkan lebih tinggi daripada Amerika Selatan dan Afrika yang juga beriklim tropis. Jenis flora Indonesia lebih dari 10% jenis tumbuhan di seluruh dunia.

## Jumlah spesies

Tanaman di Indonesia (LIPI, 2014):
- Paku-pakuan: 4.000 spesies.
- Rotan: 322 spesies.
- Pohon meranti: 400 spesies.
- Pohon bambu: 122 jenis.
- Tanaman anggrek: 4.000 jenis.

Fauna di Indonesia (LIPI, 2014):
- Pisces (ikan): 4.000 jenis.
- Aves (burung): 1.600 jenis.
- Mamalia: 500 jenis.
- Reptilia dan amfibi: 1.000 jenis.
- Insecta (serangga): 200.000 jenis, yang terbanyak.

## Eksploitasi berlebihan

**Eksploitasi berlebihan** (overeksploitasi) adalah pengambilan sumber daya terbarukan sampai sumber daya itu berkurang. Contohnya pada tanaman obat liar, padang rumput, cadangan ikan, hutan, dan cadangan air.

Tumbuhan dan hewan yang indah dan langka diburu kolektor. Contohnya penyelundupan kakatua jambul kuning dari Papua ke Surabaya yang berhasil digagalkan.

## Ancaman kepunahan

Jumlah flora dan fauna Indonesia terus menyusut, terutama karena **pertumbuhan penduduk yang begitu cepat**: permukiman mengurangi lahan, industri merusak lingkungan, dan hutan ditebang tanpa perhitungan.

- Sebanyak 1.252 jenis tumbuhan Indonesia masuk daftar merah sebagai flora yang akan punah. Jenis yang kritis antara lain tengkawang dan plalar.
- Populasi harimau Sumatra diperkirakan kurang dari 400 ekor (DLHK DIY, 2019), dan setiap bulan tidak kurang dari 14 ekor dibunuh pemburu.
- Badak bercula satu di Ujung Kulon tinggal sekitar 50 ekor, dan pesut Mahakam sekitar 50 ekor.

{SUMBER}"""),
    dict(no=3, judul="Persebaran Bioma Dunia",
         ringkasan="Bioma dikelompokkan menurut vegetasi yang dominan; padang rumput, gurun, tundra, hutan tropis, hutan gugur, dan taiga masing-masing mempunyai iklim dan tumbuhan yang khas.",
         tujuan="Kalian dapat membedakan ciri-ciri bioma padang rumput, gurun, tundra, hutan tropis, hutan gugur, dan taiga.",
         bloom="Menganalisis",
         isi=f"""## Apa itu bioma

**Bioma** diklasifikasikan berdasarkan vegetasi yang dominan di suatu wilayah yang luas. Parameternya adalah iklim (suhu dan curah hujan), tanah, dan kondisi geologi.

## Padang rumput

Padang rumput terbentang dari daerah tropika sampai subtropika. Curah hujannya umumnya 250–500 mm/tahun dan tidak teratur, sehingga tumbuhan sulit mengambil air. Tumbuhan yang dapat menyesuaikan diri adalah rumput.

- **Prairie**: di daerah dengan curah hujan yang berimbang dengan musim panas.
- **Stepa**: terdiri atas rumput-rumput pendek yang diselingi semak belukar.
- **Sabana**: tanahnya tidak basah dan kering saat kemarau; didominasi rumput dan akasia yang diselingi pohon tinggi.

## Gurun dan tundra

**Gurun.** Curah hujan sekitar 250 mm/tahun atau kurang. Perbedaan suhu siang dan malam (amplitudo harian) sangat tinggi. Tumbuhannya berdaun kecil seperti duri atau tidak berdaun, dan berakar panjang.

**Tundra.** Hanya terdapat di belahan bumi utara, kebanyakan di sekitar kutub utara. Tidak ada pohon tinggi, hanya tanaman pendek seperti semak, dan banyak lumut: sphagnum (lumut gambut) dan lichenes (lumut kerak). Hewannya berbulu tebal, seperti beruang kutub dan rusa kutub.

## Hutan tropis

Hutan basah tropika cukup air sepanjang tahun. Pohon utamanya setinggi 20–40 meter dengan kanopi lebat, sehingga dasar hutan gelap. Kelembapannya tinggi dan suhu rata-ratanya 25 °C.

Tumbuhan khasnya liana dan epifit: contoh liana adalah **rotan**, contoh epifit adalah **anggrek**.

## Hutan gugur dan taiga

**Hutan gugur** berada di daerah beriklim sedang dengan curah hujan 750–1.000 mm/tahun dan empat musim: semi, panas, gugur, dan dingin.

**Taiga** adalah hutan pohon pinus yang daunnya seperti jarum, misalnya konifer seperti spruce, alder, birch, dan juniper. Taiga banyak terdapat di belahan bumi utara (Siberia Utara, Rusia, Kanada Tengah dan Utara), dengan masa pertumbuhan 3 sampai 6 bulan pada musim panas.

{SUMBER}"""),
    dict(no=4, judul="Wilayah Fauna Dunia Menurut Wallace",
         ringkasan="Pada tahun 1876 Alfred Russel Wallace membagi persebaran fauna dunia menjadi delapan wilayah, masing-masing dengan hewan khasnya.",
         tujuan="Kalian dapat menyebutkan delapan wilayah fauna dunia menurut Wallace beserta cakupan dan hewan khasnya.",
         bloom="Memahami",
         isi=f"""## Delapan wilayah

Pada tahun 1876, **Alfred Russel Wallace** membagi persebaran fauna dunia menjadi **8 wilayah**: Ethiopian, Palearktik, Oriental, Australian, Neotropikal, Nearktik, Oceanik, dan Antartik.

## Ethiopian dan Palearktik

**Ethiopian** meliputi seluruh benua Afrika, Madagaskar, dan sebagian daratan Arab. Fauna khas Afrika misalnya gajah, singa, citah, dan hyena. Gurun Sahara menjadi pembatas alami antara Ethiopian dan Palearktik.

**Palearktik** adalah zona dengan kawasan paling luas: hampir seluruh Eropa, Rusia, daerah dekat Kutub Utara sampai Pegunungan Himalaya, Kepulauan Inggris sampai Jepang, dan Afrika paling utara. Fauna yang bertahan di lingkungan aslinya antara lain panda di Cina dan unta di Afrika Utara.

## Nearktik dan Neotropikal

**Nearktik** meliputi Amerika Serikat, Amerika Utara dekat kutub utara, dan Greenland. Hewannya antara lain bison, karibu, beruang cokelat, dan rakun.

**Neotropikal** meliputi Amerika Tengah, Amerika Selatan, dan sebagian besar Meksiko. Hewan endemiknya antara lain ikan piranha dan belut listrik di Sungai Amazon, serta llama.

## Oriental dan Australian

**Oriental** meliputi India, Indochina (Kamboja, Laos, Vietnam), dan Indomalayan (Malaysia, Sumatra, Jawa, Kalimantan, Filipina). Fauna Indonesia yang termasuk wilayah ini hanya di Indonesia bagian barat. Hewan khasnya harimau, orangutan, gibbon, rusa, banteng, dan badak bercula satu.

**Australian** meliputi Australia, Selandia Baru, Irian, Maluku, dan pulau-pulau sekitarnya. Hewan khasnya kanguru, koala, dan cocor bebek (mamalia bertelur), serta burung cendrawasih dan kasuari.

## Oceanik dan Antartik

**Oceanik** tersebar di kepulauan Samudra Pasifik. Faunanya hampir sama dengan wilayah Australian.

**Antartik** mencakup Kutub Selatan: benua Antartika dan pulau-pulau kecil di sekitarnya. Faunanya antara lain penguin kaisar, anjing laut Weddell, paus biru, dan krill.

**Coba pikirkan:** mengapa iklim, melalui tumbuhan, ikut menentukan hewan apa yang dapat hidup di suatu wilayah?

{SUMBER}"""),
    dict(no=5, judul="Sebaran Flora dan Fauna di Indonesia",
         ringkasan="Flora Indonesia terbagi menjadi empat wilayah dan fauna menjadi tiga wilayah, yang dibatasi Garis Wallace dan Garis Weber.",
         tujuan="Kalian dapat menganalisis sebaran flora dan fauna di Indonesia bagian barat, tengah, dan timur.",
         bloom="Menganalisis",
         isi=f"""## Garis Wallace dan Garis Weber

- **Garis Wallace**, dibuat oleh Alfred Russel Wallace dari Inggris, adalah garis khayal yang memisahkan fauna Indonesia bagian barat (asiatis) dari fauna Indonesia tengah (peralihan).
- **Garis Weber**, dibuat oleh Max Wilhelm Carl Weber, profesor zoologi dari Belanda, memisahkan fauna Indonesia tengah (peralihan) dari fauna Indonesia timur (australis).

Pada peta, Garis Wallace melintas di antara Kalimantan dan Sulawesi, lalu di antara Bali dan Nusa Tenggara. Garis Weber berada di sebelah timur Sulawesi, di antara Kepulauan Wallacea dan Papua.

## Empat wilayah flora

- **Flora Sumatra-Kalimantan.** Iklim hujan tropis yang lembap; didominasi hutan hujan tropis yang rapat. Flora khasnya kayu meranti, damar, dan berbagai anggrek.
- **Flora Jawa-Bali.** Jawa bagian barat lebih basah daripada bagian timur. Hutan hujan tropis ada di Jawa Barat (Ujung Kulon, Cibodas, Pananjung). Utara Jawa adalah hutan muson tropis yang meranggas saat kemarau, dengan jati sebagai flora khas yang endemik di Jawa. Jawa Timur bagian timur dan Bali didominasi sabana tropis.
- **Flora Kepulauan Wallacea** (Sulawesi, Nusa Tenggara, Timor, Maluku). Iklimnya lebih kering: sabana dan stepa di Nusa Tenggara, hutan pegunungan di Sulawesi, hutan campuran dengan rempah-rempah (pala, cengkih, kayu manis) di Maluku.
- **Flora Papua.** Hutan hujan tropis bercorak Australia Utara, dengan flora khas eukaliptus.

## Fauna Indonesia barat

Meliputi Sumatra, Jawa, Bali, Kalimantan, dan pulau-pulau kecil di sekitarnya, disebut wilayah **Fauna Dangkalan Sunda**. Coraknya sama dengan fauna oriental.

- Mamalia: gajah, badak bercula satu, tapir, rusa, banteng, orangutan, macan, kancil.
- Reptil: buaya, biawak, bunglon; burung: elang, jalak, merak; juga pesut Sungai Mahakam.

## Fauna Indonesia tengah

Disebut juga fauna **Kepulauan Wallacea**: Sulawesi dan sekitarnya, Nusa Tenggara, Timor, dan Kepulauan Maluku.

Di kawasan ini ada hewan khas yang hanya dijumpai di Indonesia: **anoa, babi rusa, dan biawak komodo**. Hewan lainnya antara lain tarsius, kuskus, maleo, rangkong, kakatua, dan nuri.

## Fauna Indonesia timur

Disebut juga fauna **Dangkalan Sahul**, tersebar di Papua dan pulau-pulau kecil sekitarnya. Hewannya mirip fauna Australia, sehingga disebut Zona Australis.

- Mamalia: kanguru, wallaby, nokdiak (landak Irian), oposum layang.
- Burung: nuri, cendrawasih, kasuari, namdur. Dari sekitar 42 jenis burung cenderawasih, 30 berada di Indonesia.

{SUMBER}"""),
    dict(no=6, judul="Faktor yang Memengaruhi Sebaran Flora dan Fauna",
         ringkasan="Sebaran flora dan fauna dipengaruhi iklim (suhu, kelembapan, curah hujan), tanah, serta manusia, hewan, dan tumbuhan.",
         tujuan="Kalian dapat menjelaskan pengaruh iklim, tanah, dan makhluk hidup terhadap sebaran flora dan fauna.",
         bloom="Menerapkan",
         isi=f"""## Suhu dan ketinggian

Faktor yang memengaruhi sebaran flora dan fauna adalah **iklim** (suhu, kelembapan, curah hujan), **tanah**, serta aktivitas **manusia, hewan, dan tumbuhan**.

Suhu dipengaruhi penyinaran matahari dan ketinggian tempat. Semakin tinggi suatu tempat, semakin dingin suhunya: **setiap naik 100 meter, suhu turun sekitar 0,5 °C**.

Contoh: sebuah tempat di ketinggian 0 m bersuhu 27 °C. Di ketinggian 800 m, suhunya turun 8 × 0,5 °C = 4 °C, menjadi sekitar 23 °C.

## Zona ketinggian dan tanaman

Menurut gambar distribusi suhu dan jenis tanaman:
- Daerah panas, 0–600 m (23,3–22 °C): padi, tebu, karet, kelapa.
- Daerah sedang, 600–1.500 m (22–17,1 °C): tembakau, kopi, cokelat, padi.
- Daerah sejuk, 1.500–2.500 m (17,1–11,1 °C): hutan tanaman industri, sayuran, kopi, teh, kina.
- Daerah dingin, di atas 2.500 m (di bawah 11 °C): tidak ada tanaman budi daya.

Contohnya apel, yang tumbuh subur di tempat sejuk: beberapa kecamatan di Kota Batu dan Kabupaten Malang, di atas 600 m, menjadi penghasil apel.

## Kelembapan udara

Tumbuhan dapat dikelompokkan menurut kelembapan tempat tumbuhnya:
- **Xerophyta**: tahan di lingkungan kering, contohnya kaktus.
- **Mesophyta**: cocok di lingkungan lembap tetapi tidak basah, contohnya anggrek.
- **Hygrophyta**: cocok di kawasan basah, contohnya teratai, eceng gondok, dan selada air.
- **Tropophyta**: dapat beradaptasi di musim hujan dan musim kemarau, contohnya jati dan eukaliptus.

## Curah hujan dan tanah

**Curah hujan.** Wilayah bercurah hujan tinggi mempunyai tanaman yang lebih beragam. Hutan tropis tumbuh di kawasan bercurah hujan 1.000–2.000 mm dan bersuhu 20–30 °C; padang rumput stepa berkembang di wilayah bercurah hujan 200–1.000 mm.

**Tanah.** Jenis tanah menentukan tumbuhan yang dapat hidup. Di Jawa bagian selatan dan utara banyak tumbuh hutan jati karena tanahnya berkapur; di Nusa Tenggara banyak sabana karena sedikitnya curah hujan.

## Manusia, hewan, dan tumbuhan

- **Manusia** memindahkan tumbuhan, misalnya kurma dari Timur Tengah ke Indonesia.
- **Hewan** menyebarkan biji: kalong memindahkan biji durian, serangga membantu penyerbukan.
- **Tumbuhan** berperan menyuburkan tanah, sehingga tanaman lain dapat tumbuh.

**Coba:** tempat A di ketinggian 200 m bersuhu 25 °C. Berapa perkiraan suhu di tempat B yang berketinggian 1.000 m?
_Periksa: naik 800 m, suhu turun 8 × 0,5 °C = 4 °C, jadi sekitar 21 °C._

{SUMBER}"""),
    dict(no=7, judul="Manfaat dan Pelestarian Flora dan Fauna",
         ringkasan="Keanekaragaman hayati bermanfaat bagi ekonomi, kesehatan, sosial, dan ekologi, sehingga harus dilestarikan melalui konservasi in situ dan ex situ.",
         tujuan="Kalian dapat menjelaskan manfaat keanekaragaman hayati serta membedakan metode pelestarian in situ dan ex situ.",
         bloom="Mengevaluasi",
         isi=f"""## Manfaat keanekaragaman hayati

- Indonesia menduduki urutan ketujuh dalam kekayaan flora berbunga, dengan lebih dari 25 ribu tumbuhan berbunga.
- Indonesia memiliki kekayaan jenis mamalia dan kupu-kupu swallowtail terbanyak di dunia.
- **Ekonomi**: di beberapa negara berkembang, keanekaragaman flora dan fauna menyumbang sekitar 32% GDP. Ada 7.000 jenis ikan laut dan ikan tawar yang menjadi sumber protein pertama masyarakat Indonesia.
- **Kesehatan**: tumbuhan dan hewan menjadi bahan obat tradisional dan modern.
- **Sosial**: penyedia lapangan pekerjaan, pembentuk budaya setempat, dan jati diri masyarakat.
- **Ekologis**: tumbuhan menghasilkan oksigen dan menyaring polutan udara; mikroorganisme tanah memperbaiki kesuburan tanah.

## Pengelolaan berkelanjutan

Pengelolaan keanekaragaman hayati memerlukan strategi nasional agar semua pihak melakukan perlindungan, pengawetan, dan pemanfaatan berkelanjutan.

Salah satunya pengelolaan **bioregional**: kawasan daratan dan perairan yang batasnya didasarkan pada batas geografis kelompok masyarakat dan sistem ekologis tertentu. Selain itu, investasi nasional dapat diarahkan pada ekowisata berbasis sains dan bioprospeksi.

## Konservasi

Menurut Undang-Undang No. 5 Tahun 1990, **konservasi** adalah upaya pelestarian sumber daya alam hayati secara berkelanjutan.

Tiga tujuan konservasi:
1. Menjamin kelestarian fungsi ekosistem sebagai penyangga kehidupan.
2. Mencegah kepunahan spesies akibat kerusakan habitat dan pemanfaatan yang tidak terkendali.
3. Menyediakan sumber plasma nutfah atau keanekaragaman genetika.

## Metode in situ

**In situ** adalah pelestarian yang dilakukan langsung di habitat asli flora dan fauna. Cara ini melindungi populasi dan komunitas alami di habitat aslinya.
- **Cagar alam**: contohnya Cagar Alam Maninjau dan Cagar Alam Pulau Sempu.
- **Taman nasional**: tempat luas di darat atau laut yang dilindungi pemerintah untuk penelitian, pendidikan, pelestarian, dan pariwisata. Contohnya Taman Nasional Komodo, Ujung Kulon, Kerinci, dan Tengger.
- **Hutan lindung**: hutan yang ditetapkan pemerintah untuk dilindungi karena ekosistemnya penting bagi keseimbangan lingkungan.

## Metode ex situ

**Ex situ** adalah pelestarian di luar habitat asli, dilakukan saat habitat aslinya rusak parah. Tantangannya adalah membuat lingkungan yang mirip habitat asal.
- **Taman hutan raya**: mengoleksi flora dan fauna asli atau dari tempat lain, contohnya Taman Hutan Raya Cut Nyak Dien dan Bukit Barisan.
- **Taman safari**: lingkungan buatan yang persis dengan tempat asal satwa, contohnya Taman Safari Bogor dan Taman Safari Prigen.
- **Kebun binatang**: lingkungan buatan, tetapi setiap spesies dipisahkan dalam kandang.

## Peran masyarakat

Masyarakat adat dan lokal ikut mengelola konservasi dengan kearifan lokal, antara lain melalui **AKKM** (Areal Konservasi Kelola Masyarakat): areal yang dikelola dengan fungsi konservasi oleh masyarakat adat atau lokal dalam satu kesatuan ekosistem. Negara menyediakan mekanisme pengakuan untuk melindunginya.

{SUMBER}"""),
]

for _p in PELAJARAN:
    cek(3 <= _p["isi"].count("\n## ") + _p["isi"].startswith("## ") <= 6, f"lesson {_p['no']}: 3-6 pages")
    cek(_p["isi"].rstrip().endswith(SUMBER), f"lesson {_p['no']}: attribution last")
    cek("\n|" not in _p["isi"], f"lesson {_p['no']}: no Markdown table")
cek(suhu(27, 0, 800) == 23 and suhu(25, 200, 1000) == 21)          # the lesson's two worked examples

# ── Misconceptions: the book has no Miskonsepsi section; these come from the distractors.
MISKONSEPSI = {
    "SMA11-G-B2-01": ("Pengertian endemik keliru",
                      "Flora atau fauna endemik dikira sekadar tumbuhan atau hewan yang banyak di suatu daerah, atau yang dipindahkan manusia.",
                      "Tekankan kata kuncinya: hanya ditemukan di wilayah tertentu dan tidak dijumpai di wilayah lain, persebarannya alami."),
    "SMA11-G-B2-02": ("Asal hewan atau tumbuhan tertukar",
                      "Wilayah asal flora atau fauna endemik tertukar, misalnya badak bercula satu dikira dari Papua.",
                      "Buat daftar pasangan hewan atau tumbuhan dengan wilayahnya dan tandai di peta Indonesia."),
    "SMA11-G-B2-03": ("Bidang manfaat tertukar",
                      "Manfaat flora dan fauna dimasukkan ke bidang yang keliru (pangan, kesehatan, ekonomi, keseimbangan ekosistem, sosial, ekologis).",
                      "Minta murid bertanya: apa yang diperoleh manusia dari contoh ini? makanan, obat, uang, keseimbangan, atau lapangan kerja?"),
    "SMA11-G-B2-04": ("Data jumlah tertukar",
                      "Angka milik fakta lain dipakai sebagai jawaban, misalnya jumlah tumbuhan obat dunia untuk Indonesia.",
                      "Minta murid membaca kembali keterangan setiap angka: dunia atau Indonesia, jenis apa, tahun berapa."),
    "SMA11-G-B2-05": ("Penyebab masalah tertukar",
                      "Penyebab menyusutnya flora dan fauna tertukar dengan fakta lain yang tidak menjadi penyebabnya.",
                      "Kaitkan setiap masalah dengan penyebab yang disebut buku: pertumbuhan penduduk, perburuan, eksploitasi."),
    "SMA11-G-B2-06": ("Ciri bioma tertukar",
                      "Ciri curah hujan, suhu, atau vegetasi satu bioma dipakai untuk bioma lain.",
                      "Buat kartu bioma berisi curah hujan, letak, dan tumbuhan khas, lalu cocokkan ciri dengan kartunya."),
    "SMA11-G-B2-07": ("Wilayah fauna dunia tertukar",
                      "Cakupan atau hewan khas satu wilayah fauna Wallace dipakai untuk wilayah lain.",
                      "Gunakan peta dunia: tandai delapan wilayah dan tempelkan satu hewan khas untuk setiap wilayah."),
    "SMA11-G-B2-08": ("Wilayah flora atau fauna Indonesia tertukar",
                      "Wilayah barat (Dangkalan Sunda), tengah (Wallacea), dan timur (Dangkalan Sahul), atau flora khasnya, tertukar.",
                      "Minta murid menempatkan pulau-pulau dan hewan khasnya pada tiga wilayah di peta Indonesia."),
    "SMA11-G-B2-09": ("Garis batas fauna tertukar",
                      "Garis Wallace dan Garis Weber tertukar, atau keduanya dikira batas lain.",
                      "Ingat urutannya dari barat: Garis Wallace memisahkan barat dan tengah, Garis Weber memisahkan tengah dan timur."),
    "SMA11-G-B2-10": ("Faktor sebaran tertukar",
                      "Contoh pengaruh manusia, hewan, tumbuhan, tanah, atau iklim dimasukkan ke faktor yang keliru.",
                      "Tanyakan siapa atau apa yang menyebabkan perpindahan atau pertumbuhan pada contoh itu."),
    "SMA11-G-B2-11": ("Kelompok tumbuhan menurut kelembapan tertukar",
                      "Xerophyta, mesophyta, hygrophyta, dan tropophyta tertukar.",
                      "Kaitkan awalan dengan tempat: xero (kering), meso (lembap tetapi tidak basah), hygro (basah), tropo (dua musim)."),
    "SMA11-G-B2-12": ("Hubungan ketinggian dan suhu keliru",
                      "Suhu dikira naik bila tempat makin tinggi, atau penurunan 0,5 °C setiap 100 m dihitung dengan jarak atau laju yang keliru.",
                      "Hitung bersama selisih ketinggian dahulu, bagi 100, kalikan 0,5 °C, lalu kurangkan dari suhu awal."),
    "SMA11-G-B2-13": ("In situ dan ex situ tertukar",
                      "Pelestarian di habitat asli dan di luar habitat asli tertukar, atau contohnya dimasukkan ke metode yang keliru.",
                      "Tanyakan: apakah hewan atau tumbuhan itu tetap di habitat aslinya? Bila ya, in situ; bila dipindahkan, ex situ."),
    "SMA11-G-B2-14": ("Tujuan atau upaya konservasi tertukar",
                      "Tujuan konservasi tertukar dengan upaya pemanfaatan atau pengelolaan lain.",
                      "Bacakan tiga tujuan konservasi dan minta murid memeriksa apakah pilihan itu salah satunya."),
}

S = []
STOP = {"karena", "yaitu", "adalah", "dengan", "sebagai", "termasuk", "bukan", "hanya", "dapat", "menjadi", "tidak", "sehingga",
        "berada", "antara", "untuk", "dalam", "wilayah", "indonesia", "setiap", "seperti", "terutama", "masing", "serta", "maupun",
        "sekitar", "tempat"}


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
        luput = [w for w in kata_isi(teks) if norm(w) not in norm(FAKTA[fid][1])]
        cek(not luput, f"{ref}: {luput} of '{teks}' is not in fact {fid}")
    cek(len({p[0] for p in pilihan}) == 4, f"{ref}: four different options")
    i = "ABCD".index(jawab)
    S.append(dict(ref=ref, pel=pel, tanya=tanya, pilihan=pilihan[1:i + 1] + [pilihan[0]] + pilihan[i + 1:],
                  guna=guna, sulit=sulit, petunjuk=petunjuk))


# ── Pemetaan awal (pre-test): endemism, a biome, Indonesia's regions, conservation.
soal("PA1", 1, "Badak bercula satu merupakan fauna endemik ...", "B", [
    ("Ujung Kulon, Pulau Jawa", True, "Tepat. Badak bercula satu tidak dapat ditemukan di daerah lain.", "", "endemik_contoh"),
    ("Pulau Papua", False, "Papua adalah asal burung cendrawasih.", "SMA11-G-B2-02", "endemik_contoh"),
    ("Pulau Komodo dan pulau-pulau kecil di sekitarnya", False, "Pulau Komodo dan sekitarnya adalah tempat hidup biawak komodo.", "SMA11-G-B2-02", "oriental_endemik"),
    ("Pulau Sulawesi", False, "Sulawesi adalah tempat hidup anoa.", "SMA11-G-B2-02", "oriental_endemik"),
], guna="Pemetaan awal")
soal("PA2", 3, "Bioma yang hanya terdapat di belahan bumi utara, di sekitar kutub utara, tanpa pohon tinggi dan dengan banyak lumut adalah ...", "D", [
    ("tundra", True, "Tepat. Lumutnya antara lain sphagnum dan lichenes.", "", "tundra_lumut"),
    ("taiga", False, "Taiga juga di belahan bumi utara, tetapi berupa hutan pohon pinus berdaun jarum.", "SMA11-G-B2-06", "taiga"),
    ("gurun", False, "Gurun bercurah hujan sekitar 250 mm/tahun atau kurang, dengan tumbuhan berdaun kecil seperti duri.", "SMA11-G-B2-06", "gurun"),
    ("sabana", False, "Sabana didominasi rumput dan akasia yang diselingi pohon tinggi.", "SMA11-G-B2-06", "sabana"),
], guna="Pemetaan awal")
soal("PA3", 5, "Wilayah fauna Indonesia timur, di Papua dan pulau-pulau sekitarnya, disebut juga fauna ...", "A", [
    ("Dangkalan Sahul", True, "Tepat. Hewannya mirip fauna Australia.", "", "fauna_timur"),
    ("Dangkalan Sunda", False, "Dangkalan Sunda adalah wilayah fauna Indonesia barat.", "SMA11-G-B2-08", "fauna_barat"),
    ("Kepulauan Wallacea", False, "Kepulauan Wallacea adalah wilayah fauna Indonesia tengah.", "SMA11-G-B2-08", "fauna_tengah"),
    ("Zona oriental", False, "Zona oriental mencakup Indonesia bagian barat.", "SMA11-G-B2-07", "oriental"),
], guna="Pemetaan awal")
cek("taman safari" in METODE["ex situ"])
soal("PA4", 7, "Taman Safari Bogor termasuk pelestarian flora dan fauna dengan metode ...", "C", [
    ("ex situ", True, "Tepat. Taman safari membuat lingkungan buatan di luar habitat asli.", "", "ex_situ"),
    ("in situ", False, "In situ dilakukan langsung di habitat asli flora dan fauna.", "SMA11-G-B2-13", "in_situ"),
    ("cagar alam", False, "Cagar alam adalah salah satu bentuk pelestarian in situ, bukan nama metodenya.", "SMA11-G-B2-13", "cagar_alam"),
    ("bioregional", False, "Bioregional adalah cara pengelolaan kawasan berdasarkan batas masyarakat dan sistem ekologis.", "SMA11-G-B2-14", "bioregional"),
], guna="Pemetaan awal")

# ── Cek penguasaan (post-test): every lesson; no book assessment item (pp. 127-134), no lesson example.
soal("PB1", 1, "Suatu tumbuhan disebut flora endemik suatu daerah karena ...", "C", [
    ("jenis tumbuhan itu tidak dijumpai di wilayah lain", True, "Tepat. Flora endemik suatu daerah tidak dijumpai di wilayah lain.", "", "flora_endemik"),
    ("berasal dari bahasa latin yang berarti alam tumbuhan", False, "Ini arti kata flora, bukan alasan disebut endemik.", "SMA11-G-B2-01", "flora_def"),
    ("banyak tanaman dari Timur Tengah dipindahkan ke Indonesia", False, "Ini contoh pengaruh manusia, seperti kurma; tumbuhan endemik tersebar secara alami.", "SMA11-G-B2-01", "manusia_kurma"),
    ("tanaman yang cocok dibudidayakan di Indonesia yang beriklim tropis", False, "Ini keterangan tentang padi, bukan pengertian endemik.", "SMA11-G-B2-01", "padi"),
], guna="Cek penguasaan", sulit="Sedang")
soal("PB2", 2, "Menurut buku, jumlah flora dan fauna Indonesia dari tahun ke tahun semakin menyusut terutama karena ...", "A", [
    ("pertumbuhan penduduk yang begitu cepat", True, "Tepat. Permukiman, industri, dan penebangan hutan mengurangi habitat.", "", "punah_penduduk"),
    ("tanah yang memiliki tingkat keasaman tinggi", False, "Tanah asam adalah alasan jati tidak tumbuh maksimal di Kalimantan dan Sumatra.", "SMA11-G-B2-05", "jati_asam"),
    ("perbedaan suhu siang dan malam yang sangat tinggi", False, "Ini ciri bioma gurun.", "SMA11-G-B2-06", "gurun_amplitudo"),
    ("curah hujan lebih rendah dan beriklim lebih kering", False, "Ini ciri iklim wilayah timur Indonesia, bukan penyebab menyusutnya flora dan fauna.", "SMA11-G-B2-05", "barat_timur"),
], guna="Cek penguasaan", sulit="Sedang")
cek(0 < 250 <= 250 < 500)
soal("PB3", 3, "Sebuah bioma bercurah hujan sekitar 250 mm/tahun atau kurang, dan perbedaan suhu siang dan malamnya sangat tinggi. Bioma itu adalah ...", "D", [
    ("gurun", True, "Tepat. Amplitudo harian gurun sangat tinggi.", "", "gurun"),
    ("padang rumput", False, "Curah hujan padang rumput umumnya 250–500 mm/tahun.", "SMA11-G-B2-06", "padang_rumput"),
    ("hutan gugur", False, "Hutan gugur bercurah hujan 750 sampai 1.000 mm/tahun.", "SMA11-G-B2-06", "hutan_gugur"),
    ("hutan tropis", False, "Hutan tropis memiliki kelembapan tinggi dan suhu rata-rata 25 °C.", "SMA11-G-B2-06", "hutan_tropis"),
], guna="Cek penguasaan", sulit="Sedang")
cek(set(WILAYAH["Neotropikal"]) == {"Amerika Tengah", "Amerika Selatan", "Meksiko"})
soal("PB4", 4, "Wilayah fauna dunia menurut Wallace yang meliputi Amerika Tengah, Amerika Selatan, dan sebagian besar Meksiko adalah ...", "B", [
    ("Neotropikal", True, "Tepat. Hewan endemiknya antara lain piranha dan belut listrik di Sungai Amazon.", "", "neotropikal"),
    ("Nearktik", False, "Nearktik meliputi Amerika Serikat, Amerika Utara dekat kutub utara, dan Greenland.", "SMA11-G-B2-07", "nearktik"),
    ("Zona Palearktik", False, "Palearktik adalah zona yang paling luas, meliputi hampir seluruh Eropa dan Rusia.", "SMA11-G-B2-07", "palearktik"),
    ("Ethiopian", False, "Ethiopian meliputi benua Afrika, Madagaskar, dan sebagian daratan Arab.", "SMA11-G-B2-07", "ethiopian"),
], guna="Cek penguasaan", sulit="Sedang")
soal("PB5", 5, "Garis khayal yang memisahkan fauna Indonesia bagian barat (asiatis) dari fauna Indonesia tengah (peralihan) disebut ...", "C", [
    ("Garis Wallace", True, "Tepat. Garis ini dibuat oleh Alfred Russel Wallace.", "", "garis_wallace"),
    ("Garis Weber", False, "Garis Weber memisahkan fauna tengah (peralihan) dari fauna timur (australis).", "SMA11-G-B2-09", "garis_weber"),
    ("Gurun Sahara", False, "Gurun Sahara adalah pembatas alami antara wilayah Ethiopian dan Palearktik.", "SMA11-G-B2-09", "sahara"),
    ("Dangkalan Sahul", False, "Dangkalan Sahul adalah nama wilayah fauna Indonesia timur, bukan garis batas.", "SMA11-G-B2-08", "fauna_timur"),
], guna="Cek penguasaan", sulit="Sedang")
cek(suhu(24, 300, 1300) == 19 and 24 + 5 == 29 and suhu(24, 0, 1300) == Fraction(35, 2) and 24 - 10 == 14)
soal("PB6", 6, "Kota P di ketinggian 300 m bersuhu 24 °C. Menurut buku, suhu turun sekitar 0,5 °C setiap naik 100 meter. Berapa perkiraan suhu di Desa Q yang berketinggian 1.300 m?", "A", [
    ("19 °C", True, "Benar. Naik 1.000 m, jadi turun 10 × 0,5 °C = 5 °C: 24 − 5 = 19 °C.", "", "=lapse"),
    ("29 °C", False, "Suhu ditambahkan. Semakin tinggi suatu tempat, suhunya semakin dingin.", "SMA11-G-B2-12", "=tinggi_dingin"),
    ("17,5 °C", False, "Yang dipakai ketinggian Desa Q seluruhnya (1.300 m). Hitung dari selisih ketinggian: 1.300 − 300 = 1.000 m.", "SMA11-G-B2-12", "=lapse"),
    ("14 °C", False, "Penurunannya dihitung 1 °C setiap 100 m. Menurut buku sekitar 0,5 °C.", "SMA11-G-B2-12", "=lapse"),
], guna="Cek penguasaan", sulit="Sedang")
soal("PB7", 6, "Tumbuhan yang cocok hidup di lingkungan lembap tetapi tidak basah digolongkan sebagai ...", "D", [
    ("mesophyta", True, "Tepat. Contohnya anggrek.", "", "mesophyta"),
    ("xerophyta", False, "Xerophyta tahan di lingkungan kering, seperti kaktus.", "SMA11-G-B2-11", "xerophyta"),
    ("hygrophyta", False, "Hygrophyta cocok hidup di kawasan basah, seperti teratai.", "SMA11-G-B2-11", "hygrophyta"),
    ("tropophyta", False, "Tropophyta dapat beradaptasi di musim hujan dan musim kemarau.", "SMA11-G-B2-11", "tropophyta"),
], guna="Cek penguasaan", sulit="Sedang")
soal("PB8", 7, "Menurut buku, metode ex situ dilakukan ketika ...", "B", [
    ("habitat asli flora dan fauna mengalami kerusakan yang parah", True, "Tepat. Tantangannya membuat lingkungan yang mirip habitat asal.", "", "ex_situ"),
    ("melindungi populasi dan komunitas alami di habitat aslinya", False, "Ini tujuan metode in situ.", "SMA11-G-B2-13", "in_situ_populasi"),
    ("menyediakan sumber plasma nutfah atau keanekaragaman genetika", False, "Ini salah satu tujuan konservasi secara umum, bukan syarat metode ex situ.", "SMA11-G-B2-14", "tujuan_konservasi"),
    ("areal dikelola masyarakat adat dalam suatu kesatuan ekosistem", False, "Ini AKKM, areal konservasi yang dikelola masyarakat.", "SMA11-G-B2-14", "akkm"),
], guna="Cek penguasaan", sulit="Sulit")

# ── Latihan (practice), by lesson.
soal("LT1", 1, "Harimau, sebagai predator karnivora, berperan dalam keseimbangan ekosistem sebagai ...", "A", [
    ("pengontrol populasi hewan pemakan tumbuhan", True, "Tepat. Tanpa harimau, hewan pemakan tumbuhan dapat bertambah drastis.", "", "harimau_predator"),
    ("bahan utama untuk minyak kayu putih", False, "Ini manfaat eukaliptus di bidang kesehatan.", "SMA11-G-B2-03", "eukaliptus_obat"),
    ("kayu yang sangat diandalkan dalam industri mebel", False, "Ini manfaat ekonomi kayu jati.", "SMA11-G-B2-03", "jati_mebel"),
    ("makanan pokok di Indonesia bagian timur", False, "Ini manfaat sagu sebagai sumber pangan.", "SMA11-G-B2-03", "sagu"),
])
cek(1260 < 20000)
soal("LT2", 1, "Berapa spesies tumbuhan di Indonesia yang secara pasti diketahui berkhasiat sebagai obat?", "C", [
    ("sekitar 1.260 spesies", True, "Benar. Banyak yang ditanam sebagai TOGA.", "", "obat"),
    ("sekitar 20.000 spesies", False, "Ini jumlah tumbuhan yang dipakai penduduk dunia sebagai obat menurut WHO.", "SMA11-G-B2-04", "obat"),
    ("1.252 jenis", False, "Ini jumlah jenis tumbuhan Indonesia dalam daftar merah.", "SMA11-G-B2-04", "daftar_merah"),
    ("4.000 jenis", False, "Ini jumlah jenis tanaman anggrek di Indonesia.", "SMA11-G-B2-04", "tabel21"),
])
cek(max(TABEL22, key=TABEL22.get) == "Insecta (serangga)")
soal("LT3", 2, "Menurut LIPI (2014), kelompok fauna Indonesia dengan jumlah jenis terbanyak adalah ...", "B", [
    ("Serangga, 200.000", True, "Benar. Jauh lebih banyak daripada kelompok lain.", "", "tabel22"),
    ("Pisces (ikan), 4.000", False, "Ikan 4.000 jenis, jauh lebih sedikit daripada serangga.", "SMA11-G-B2-04", "tabel22"),
    ("Aves (burung), 1.600", False, "Burung 1.600 jenis.", "SMA11-G-B2-04", "tabel22"),
    ("Mamalia, 500", False, "Mamalia justru yang paling sedikit, 500 jenis.", "SMA11-G-B2-04", "tabel22"),
])
soal("LT4", 2, "Menurut buku, badak bercula satu yang dilindungi di Ujung Kulon saat ini berjumlah ...", "D", [
    ("sekitar 50 ekor", True, "Benar. Pesut Mahakam juga hanya sekitar 50 ekor.", "", "badak_50"),
    ("kurang dari 400 ekor", False, "Ini perkiraan populasi harimau Sumatra.", "SMA11-G-B2-04", "harimau_400"),
    ("14 ekor", False, "Ini jumlah harimau Sumatra yang mati dibunuh pemburu setiap bulan.", "SMA11-G-B2-04", "harimau_14"),
    ("24 ekor", False, "24 adalah jumlah kakatua jambul kuning dalam kasus penyelundupan, bukan jumlah badak.", "SMA11-G-B2-04", "kakatua_24"),
])
soal("LT5", 2, "Bagaimana curah hujan dan iklim di wilayah barat Indonesia pada umumnya?", "A", [
    ("curah hujan tinggi dan beriklim basah", True, "Tepat. Wilayah timur bercurah hujan lebih rendah.", "", "barat_timur"),
    ("curah hujan lebih rendah dan beriklim lebih kering", False, "Ini ciri wilayah timur Indonesia.", "SMA11-G-B2-08", "barat_timur"),
    ("kelembapan tinggi dan suhu rata-rata 25 °C", False, "Ini ciri bioma hutan tropis secara umum.", "SMA11-G-B2-06", "hutan_tropis"),
    ("beriklim sedang dengan curah hujan rendah", False, "Ini ciri daerah hutan gugur.", "SMA11-G-B2-06", "hutan_gugur"),
])
soal("LT6", 3, "Di hutan basah tropika, anggrek merupakan contoh tumbuhan ...", "C", [
    ("epifit", True, "Benar. Sedangkan contoh liana adalah rotan.", "", "liana_epifit"),
    ("liana, seperti rotan", False, "Rotan memang contoh liana, tetapi anggrek bukan liana.", "SMA11-G-B2-06", "liana_epifit"),
    ("daunnya berbentuk seperti jarum", False, "Daun seperti jarum adalah ciri pohon pinus di taiga.", "SMA11-G-B2-06", "taiga"),
    ("berdaun kecil seperti duri", False, "Ini ciri tumbuhan gurun.", "SMA11-G-B2-06", "gurun_tumbuhan"),
])
soal("LT7", 3, "Vegetasi yang mendominasi sabana adalah ...", "B", [
    ("rumput dan akasia diselingi dengan pohon tinggi", True, "Tepat. Tanah sabana tidak basah dan kering saat kemarau.", "", "sabana"),
    ("rumput-rumput pendek diselingi oleh semak belukar", False, "Ini ciri stepa.", "SMA11-G-B2-06", "stepa"),
    ("tanaman pendek seperti semak dan banyak lumut", False, "Ini ciri tundra.", "SMA11-G-B2-06", "tundra_lumut"),
    ("hutan pohon pinus yang daunnya berbentuk seperti jarum", False, "Ini ciri taiga.", "SMA11-G-B2-06", "taiga"),
])
cek(len(WILAYAH) == 8)
soal("LT8", 4, "Menurut Alfred Russel Wallace (1876), persebaran fauna dunia dibagi menjadi berapa wilayah?", "D", [
    ("8 wilayah", True, "Benar. Ethiopian, Palearktik, Oriental, Australian, Neotropikal, Nearktik, Oceanik, dan Antartik.", "", "wallace_8"),
    ("3 wilayah", False, "Tiga wilayah adalah pembagian fauna Indonesia (barat, tengah, timur).", "SMA11-G-B2-08", "fauna_tiga"),
    ("4 wilayah", False, "Empat wilayah adalah pembagian flora Indonesia.", "SMA11-G-B2-08", "flora_4"),
    ("30 wilayah", False, "30 adalah jumlah jenis burung cenderawasih yang berada di Indonesia.", "SMA11-G-B2-04", "cendrawasih"),
])
soal("LT9", 4, "Wilayah fauna dunia yang meliputi India, Indochina, serta Indomalayan (termasuk Sumatra, Jawa, dan Kalimantan) adalah ...", "A", [
    ("Oriental", True, "Benar. Hewan khasnya antara lain harimau, orangutan, dan badak bercula satu.", "", "oriental"),
    ("Australian", False, "Australian meliputi Australia, Selandia Baru, Irian, dan Maluku.", "SMA11-G-B2-07", "australian"),
    ("Palearktik", False, "Palearktik meliputi hampir seluruh Eropa dan Rusia.", "SMA11-G-B2-07", "palearktik"),
    ("Oceanik", False, "Oceanik tersebar di kepulauan Samudra Pasifik.", "SMA11-G-B2-07", "oceanik"),
])
soal("LT10", 4, "Hewan khas wilayah Palearktik yang tetap bertahan di lingkungan aslinya adalah ...", "C", [
    ("panda di Cina", True, "Benar. Juga unta di Afrika Utara.", "", "palearktik_fauna"),
    ("piranha di sungai Amazon", False, "Piranha adalah hewan endemik wilayah Neotropikal.", "SMA11-G-B2-07", "neotropikal_fauna"),
    ("kanguru dan koala", False, "Keduanya hewan khas wilayah Australian.", "SMA11-G-B2-07", "australian_fauna"),
    ("gajah, singa, dan citah", False, "Ini fauna khas wilayah Ethiopian di Afrika.", "SMA11-G-B2-07", "ethiopian_fauna"),
])
cek("anoa" in HEWAN_ID["tengah"] and "orangutan" in HEWAN_ID["barat"] and "kanguru" in HEWAN_ID["timur"])
soal("LT11", 5, "Hewan khas Kepulauan Wallacea yang hanya dapat dijumpai di Indonesia adalah ...", "B", [
    ("anoa", True, "Benar. Juga babi rusa dan biawak komodo.", "", "fauna_tengah"),
    ("orangutan", False, "Orangutan termasuk fauna Indonesia barat.", "SMA11-G-B2-08", "fauna_barat_mamalia"),
    ("kanguru", False, "Kanguru termasuk fauna Indonesia timur (Dangkalan Sahul).", "SMA11-G-B2-08", "fauna_timur_mamalia"),
    ("gajah", False, "Gajah termasuk fauna Indonesia barat.", "SMA11-G-B2-08", "fauna_barat_mamalia"),
])
soal("LT12", 5, "Vegetasi Papua bercorak Australia Utara dengan flora khas ...", "D", [
    ("eukaliptus", True, "Benar. Berbeda dengan wilayah Indonesia bagian barat.", "", "flora_papua"),
    ("kayu meranti dan damar", False, "Ini flora khas Sumatra dan Kalimantan.", "SMA11-G-B2-08", "flora_sumkal"),
    ("pohon jati", False, "Jati adalah flora khas hutan muson tropis di Jawa.", "SMA11-G-B2-08", "jati_muson"),
    ("pala dan cengkih", False, "Ini rempah-rempah di hutan campuran Maluku.", "SMA11-G-B2-08", "wallacea_veg"),
], sulit="Sedang")
soal("LT13", 5, "Jenis vegetasi yang mendominasi Jawa Timur bagian timur dan Pulau Bali adalah ...", "A", [
    ("sabana tropis", True, "Benar. Makin ke timur, iklim Jawa makin kering.", "", "sabana_bali"),
    ("hutan hujan tropis", False, "Hutan hujan tropis sebagian besar tersebar di Jawa Barat.", "SMA11-G-B2-08", "jawabali_hujan"),
    ("hutan pegunungan", False, "Hutan pegunungan disebut untuk sekitar Sulawesi.", "SMA11-G-B2-08", "wallacea_veg"),
    ("hutan campuran rempah-rempah", False, "Hutan campuran dengan rempah-rempah ada di Maluku.", "SMA11-G-B2-08", "wallacea_veg"),
], sulit="Sedang")
soal("LT14", 6, "Teratai, eceng gondok, dan selada air cocok hidup di kawasan basah. Tumbuhan ini tergolong ...", "C", [
    ("hygrophyta", True, "Benar.", "", "hygrophyta"),
    ("xerophyta", False, "Xerophyta tahan di lingkungan kering, seperti kaktus.", "SMA11-G-B2-11", "xerophyta"),
    ("mesophyta", False, "Mesophyta cocok di lingkungan lembap tetapi tidak basah.", "SMA11-G-B2-11", "mesophyta"),
    ("tropophyta", False, "Tropophyta beradaptasi di musim hujan dan musim kemarau, seperti jati.", "SMA11-G-B2-11", "tropophyta"),
])
soal("LT15", 6, "Kalong yang memindahkan biji durian adalah contoh faktor sebaran flora berupa ...", "B", [
    ("hewan", True, "Benar. Hewan juga membantu penyerbukan dan penyebaran biji.", "", "hewan_biji"),
    ("manusia", False, "Contoh pengaruh manusia adalah memindahkan kurma dari Timur Tengah ke Indonesia.", "SMA11-G-B2-10", "manusia_kurma"),
    ("tumbuhan", False, "Tumbuhan berperan menyuburkan tanah.", "SMA11-G-B2-10", "tumbuhan_subur"),
    ("tanah", False, "Contoh pengaruh tanah adalah hutan jati di tanah berkapur.", "SMA11-G-B2-10", "tanah_jati"),
])
cek(zona_tinggi(1800) == "sejuk" and "teh" in ZONA_SUHU[2][3])
soal("LT16", 6, "Menurut gambar distribusi suhu dan jenis tanaman, teh dan kina ditanam di daerah ...", "D", [
    ("sejuk, 1.500–2.500 m", True, "Benar. Suhunya 17,1–11,1 °C.", "", "zona_suhu"),
    ("panas, 0–600 m", False, "Daerah panas ditanami padi, tebu, karet, dan kelapa.", "SMA11-G-B2-12", "zona_suhu"),
    ("sedang, 600–1500 m", False, "Daerah sedang ditanami tembakau, kopi, cokelat, dan padi.", "SMA11-G-B2-12", "zona_suhu"),
    ("dingin, di atas 2500 m", False, "Di daerah dingin tidak ada tanaman budi daya.", "SMA11-G-B2-12", "zona_suhu"),
], sulit="Sedang")
soal("LT17", 7, "Salah satu tujuan konservasi adalah ...", "A", [
    ("mencegah kepunahan spesies karena kerusakan habitat", True, "Tepat. Juga akibat pemanfaatan yang tidak terkendali.", "", "tujuan_konservasi"),
    ("mengembangkan ekowisata berbasis sains dan bioprospeksi", False, "Ini salah satu bentuk investasi nasional dalam pemanfaatan biodiversitas.", "SMA11-G-B2-14", "investasi"),
    ("membuat lingkungan buatan yang persis dengan tempat asal", False, "Ini cara kerja taman safari, salah satu bentuk ex situ.", "SMA11-G-B2-13", "safari_buatan"),
    ("mengoleksi flora dan fauna yang berasal dari tempat lain", False, "Ini fungsi taman hutan raya.", "SMA11-G-B2-13", "tahura"),
], sulit="Sedang")
cek("taman nasional" in METODE["in situ"] and all(x in METODE["ex situ"] for x in ("taman safari", "kebun binatang", "taman hutan raya")))
soal("LT18", 7, "Manakah yang merupakan pelestarian in situ?", "C", [
    ("Taman Nasional Komodo", True, "Benar. Taman nasional melindungi flora dan fauna di habitat aslinya.", "", "taman_nasional"),
    ("Taman Safari Prigen", False, "Taman safari adalah pelestarian ex situ.", "SMA11-G-B2-13", "taman_safari"),
    ("Taman Hutan Raya Cut Nyak Dien", False, "Taman hutan raya adalah pelestarian ex situ.", "SMA11-G-B2-13", "tahura_contoh"),
    ("Kebun binatang", False, "Kebun binatang adalah pelestarian ex situ.", "SMA11-G-B2-13", "kebun_binatang"),
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

# The post-test never reuses a book assessment question (pp. 127-134) or a lesson example. The
# topics of the book's assessment, and of each post-test question:
TOPIK_UJI = {"maskot PON", "pemangsa maleo", "deforestasi dan pangan", "habitat orangutan", "perburuan ilegal",
             "habitat badak Jawa", "konservasi penyu", "habitat fauna barat menyempit", "kelor dan karbon", "spesies asli dan endemik",
             "pengertian eksploitasi", "bioma taiga", "bioma keanekaragaman tertinggi", "zona gajah singa citah", "zona rakun karibu",
             "manfaat hutan hujan", "TN Alas Purwo", "perburuan paus Lamalera", "penurunan populasi satwa", "fauna A dan B",
             "sebaran flora fauna Indonesia", "karakteristik flora fauna tiga wilayah", "hewan masuk permukiman", "flora fauna daerah sendiri",
             "melestarikan flora daerah"}
TOPIK_POST = {"PB1": "arti endemik", "PB2": "penyebab menyusutnya flora fauna", "PB3": "ciri bioma gurun",
              "PB4": "cakupan wilayah Neotropikal", "PB5": "Garis Wallace", "PB6": "suhu dan ketinggian",
              "PB7": "mesophyta", "PB8": "syarat metode ex situ"}
cek({s_["ref"] for s_ in POST} == set(TOPIK_POST) and not set(TOPIK_POST.values()) & TOPIK_UJI)
KUNCI_UJI = {"taiga", "hutan hujan tropis", "ethiopian", "nearktik", "eksploitasi", "hutan musim tropis"}
for s_ in POST:
    benar = next(p[0] for p in s_["pilihan"] if p[1]).lower()
    cek(not any(k in benar for k in KUNCI_UJI), f"{s_['ref']}: its key is a book assessment key")
# The lesson's worked temperature examples (0 m 27 °C to 800 m; 200 m 25 °C to 1.000 m) are not the
# post-test's (300 m 24 °C to 1.300 m).
cek("300 m" in POST[5]["tanya"] and "1.300 m" in POST[5]["tanya"] and "27 °C" not in POST[5]["tanya"] and "25 °C" not in POST[5]["tanya"])


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
    # every distractor names its misconception's code, defined on the «Miskonsepsi» sheet (CR-50, D-063 M5, D-120 Q9)
    lembar("Pilihan", ["Kode soal", "Pilihan", "Teks pilihan", "Benar", "Alasan", "Kode miskonsepsi"],
           [[s["ref"], "ABCD"[i], p[0], "Ya" if p[1] else "Tidak", p[2], p[3]] for s in S for i, p in enumerate(s["pilihan"])])
    lembar("Miskonsepsi", ["Kode", "Nama", "Penjelasan", "Cara membantu"],
           [[k, label, desk, rem] for k, (label, desk, rem) in MISKONSEPSI.items()])
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
    tulis(os.path.join(here, "SMA11-Geografi-Bab2.xlsx"))
    tulis_miskonsepsi(os.path.join(here, "SMA11-Geografi-Bab2-miskonsepsi.csv"))
    halaman = sum(p["isi"].count("## ") for p in PELAJARAN)
    print(f"SMA11-Geografi-Bab2.xlsx: lessons {len(PELAJARAN)} ({halaman} pages), questions {len(S)} "
          f"(pre {len(PRE)}, post {len(POST)}, practice {len(LAT)}), answers "
          + " ".join(f"{h}={HURUF[h]}" for h in "ABCD"))
    print(f"SMA11-Geografi-Bab2-miskonsepsi.csv: {len(MISKONSEPSI)} codes")
    print(f"facts traced: {len(FAKTA)} (pages {min(h for h, _ in FAKTA.values())}-{max(h for h, _ in FAKTA.values())})")
    if "--kutipan" in sys.argv:
        ada, gambar = periksa_kutipan(sys.argv[sys.argv.index("--kutipan") + 1])
        print(f"quotations found in the book's text: {ada} of {len(FAKTA)}; figures read by eye: {', '.join(gambar) or 'none'}")
    print(f"assertions passed: {CEK[0]}")
