# -*- coding: utf-8 -*-
"""
PINTAR — the canonical presentation content.

ONE presentation, three language editions. Every string lives here exactly
once, as {"id": ..., "en": ...}. The renderers in build.py read this file and
nothing else, so an Indonesian slide and its English and bilingual twins
cannot drift apart: there is only one claim, expressed twice.

Speaker notes carry both languages for every slide.

Provenance discipline: `prov` labels every reconstructed screen and every
design-intent diagram. Nothing on a slide is presented as a live implemented
screen unless that surface exists in this repository. Text shown inside a
screen reconstruction is the product's own Indonesian wording and is never
translated — a screen is not a sentence to be restated.
"""


def L(id_text, en_text):
    return {"id": id_text, "en": en_text}


def P(s):
    """Product wording — identical in every edition, never translated."""
    return {"id": s, "en": s}


PROV_SCREEN = L(
    "Susunan layar dibuat ulang dari antarmuka PINTAR yang sudah dibangun. "
    "Teks pada layar adalah teks produk yang sebenarnya.",
    "Layout reconstructed from the built PINTAR interface. The on-screen "
    "wording is the product's own.",
)
PROV_DESIGN = L(
    "Rancangan pengalaman yang disetujui. Belum menjadi layar berjalan pada "
    "versi yang ditinjau dokumen ini.",
    "Approved experience design. Not a running screen in the version this "
    "document reviews.",
)
PROV_DIRECTION = L(
    "Arah pengalaman. Belum dibangun pada versi yang ditinjau dokumen ini.",
    "Experience direction. Not built in the version this document reviews.",
)

ACT1 = L("Bagian 1 · Mengapa", "Part 1 · Why")
ACT2 = L("Bagian 2 · Pengalaman", "Part 2 · The experience")
ACT3 = L("Bagian 3 · Bukti", "Part 3 · Evidence")
ACT4 = L("Bagian 4 · Kepercayaan dan institusi", "Part 4 · Trust and the institution")
APPX = L("Lampiran", "Appendix")


SLIDES = [

# ===========================================================================
# ACT 1 — WHY
# ===========================================================================
dict(
    key="cover", layout="cover",
    wordmark="PINTAR",
    title=L("Belajar, bukti, dan keputusan\nyang tetap milik manusia.",
            "Learning, evidence, and decisions\nthat stay human."),
    sub=L("Paparan untuk manajemen dan pendidik",
          "A presentation for management and educators"),
    meta=L("Dokumen internal · PINTAR 4.0 · September 2026",
           "Internal document · PINTAR 4.0 · September 2026"),
    notes=dict(
        id="TUJUAN. Membuka dengan tenang, tanpa menjual. Judulnya sudah "
           "menyatakan tesis seluruh paparan: PINTAR mengubah aktivitas belajar "
           "menjadi bukti yang bisa dipahami, dan keputusan tetap di tangan "
           "manusia.\n\n"
           "CARA MEMBUKA. Sebutkan bahwa paparan ini kira-kira 30 menit, lalu "
           "diskusi. Katakan sejak awal: yang ditunjukkan adalah apa yang sudah "
           "dibangun, dan setiap rancangan yang belum menjadi layar akan diberi "
           "label.\n\n"
           "JANGAN. Jangan menyebut PINTAR 'siap produksi' atau 'lengkap'. "
           "Intinya sudah lengkap; kesiapan produksi belum dinyatakan.\n\n"
           "TRANSISI. “Saya mulai dari satu pertanyaan.”",
        en="PURPOSE. Open calmly, without selling. The title already states the "
           "thesis of the whole deck: PINTAR turns learning activity into "
           "evidence people can understand, and the decision stays human.\n\n"
           "HOW TO OPEN. Say this runs about 30 minutes, then discussion. Say "
           "up front that what you show is what has been built, and that "
           "anything which is design rather than a running screen is labelled "
           "as such.\n\n"
           "DO NOT. Do not call PINTAR 'production ready' or 'complete'. The "
           "core is complete; production readiness has not been declared.\n\n"
           "TRANSITION. “Let me start with one question.”",
    ),
),

dict(
    key="question", layout="statement", dark=True,
    eyebrow=ACT1,
    statement=L("Apakah kita benar-benar tahu\napa yang sedang terjadi\ndalam proses belajar?",
                "Do we really know\nwhat is happening\ninside the learning process?"),
    sub=L("Bukan berapa banyak yang dikerjakan. Apa yang sebenarnya dipahami.",
          "Not how much was completed. What was actually understood."),
    notes=dict(
        id="TUJUAN. Menanamkan satu pertanyaan yang akan dijawab seluruh "
           "paparan. Biarkan hening sebentar setelah membacakannya.\n\n"
           "INTI. Hampir setiap sekolah bisa menjawab 'berapa banyak yang "
           "dikerjakan' dan 'berapa nilainya'. Jauh lebih sulit menjawab 'apa "
           "yang sebenarnya dipahami', dan lebih sulit lagi: 'apakah kita punya "
           "cukup dasar untuk menyimpulkannya'.\n\n"
           "NUANSA. Ini bukan tuduhan terhadap sistem yang ada. Ini menunjukkan "
           "pertanyaan yang memang sulit dijawab oleh pencatatan aktivitas.\n\n"
           "TRANSISI. “Menariknya, masalahnya bukan kekurangan data.”",
        en="PURPOSE. Plant the one question the whole deck answers. Let a beat "
           "of silence follow it.\n\n"
           "THE POINT. Almost every school can answer 'how much was completed' "
           "and 'what was the score'. It is much harder to answer 'what was "
           "actually understood', and harder still: 'do we have enough basis to "
           "conclude that at all'.\n\n"
           "NUANCE. This is not an accusation against existing systems. It "
           "names a question that activity records are not shaped to answer.\n\n"
           "TRANSITION. “The interesting part is that the problem is not a "
           "lack of data.”",
    ),
),

dict(
    key="today", layout="flow",
    eyebrow=ACT1,
    title=L("Masalahnya bukan kekurangan data.",
            "The problem is not a lack of data."),
    lede=L("Sekolah sudah mencatat banyak hal. Yang sering hilang adalah "
           "konteks yang membuat catatan itu bisa dibaca.",
           "Schools already record a great deal. What goes missing is the "
           "context that makes those records readable."),
    steps=[
        dict(label=L("TUGAS DIBERIKAN", "WORK IS ASSIGNED")),
        dict(label=L("DIKERJAKAN", "IT IS COMPLETED")),
        dict(label=L("NILAI KELUAR", "A SCORE APPEARS")),
        dict(label=L("LAPORAN TERSUSUN", "A REPORT IS FILED")),
    ],
    band=L("Yang tersisa: sebuah angka. Yang hilang: apa yang dipahami, apa "
           "yang belum, dan apakah buktinya cukup untuk menyimpulkan.",
           "What remains: a number. What is lost: what was understood, what was "
           "not, and whether there is enough evidence to conclude anything."),
    band_tone="well",
    notes=dict(
        id="TUJUAN. Menunjukkan bahwa rantai yang biasa berjalan memang rapi — "
           "dan tetap kehilangan hal yang paling ingin diketahui.\n\n"
           "INTI. Setiap langkah di atas berguna. Persoalannya ada di ujung: "
           "sebuah angka meninggalkan proses yang menghasilkannya. Kita tidak "
           "lagi tahu bagian mana yang dipahami, kekeliruan berpikir apa yang "
           "muncul, atau apakah satu kali pengerjaan cukup untuk "
           "menyimpulkan.\n\n"
           "JANGAN. Jangan mengatakan 'semua LMS begini'. Ini penekanan "
           "rancangan PINTAR, bukan tuduhan umum.\n\n"
           "TRANSISI. “Di titik itulah PINTAR mengambil sikap yang "
           "berbeda.”",
        en="PURPOSE. Show that the usual chain is perfectly orderly — and still "
           "loses the thing we most want to know.\n\n"
           "THE POINT. Every step above is useful. The trouble is at the end: a "
           "score leaves behind the process that produced it. We no longer know "
           "which part was understood, what thinking produced the error, or "
           "whether one sitting is enough to conclude anything.\n\n"
           "DO NOT. Do not say 'every LMS does this'. This is PINTAR's design "
           "emphasis, not a universal criticism.\n\n"
           "TRANSITION. “That is where PINTAR takes a different "
           "position.”",
    ),
),

dict(
    key="idea", layout="statement", soft=True,
    eyebrow=L("Gagasan PINTAR", "The PINTAR idea"),
    statement=L("PINTAR membantu kita memahami apa yang sedang terjadi dalam "
                "proses belajar — berdasarkan bukti yang tersedia — agar "
                "manusia dapat mengambil keputusan yang lebih baik.",
                "PINTAR helps us understand what is happening in the learning "
                "process — based on the available evidence — so people can "
                "make better decisions."),
    statement_size=26,
    footnote=L("Empat pertanyaan yang sama, untuk setiap orang:  Apa yang "
               "sedang terjadi?  ·  Apa yang didukung bukti?  ·  Apa yang perlu "
               "saya lihat berikutnya?  ·  Apa yang bisa saya lakukan?",
               "The same four questions, for everyone:  What is happening?  ·  "
               "What does the evidence support?  ·  What should I look at next?"
               "  ·  What can I do?"),
    notes=dict(
        id="TUJUAN. Ini kalimat inti seluruh paparan. Bacakan pelan; jangan "
           "diparafrasa.\n\n"
           "INTI. Tiga bagian kalimat ini penting semuanya. 'Memahami apa yang "
           "sedang terjadi' — bukan sekadar mencatat. 'Berdasarkan bukti yang "
           "tersedia' — PINTAR tidak berpura-pura tahu lebih banyak daripada "
           "yang didukung buktinya. 'Agar manusia mengambil keputusan' — "
           "keputusannya tidak pernah berpindah tangan.\n\n"
           "NUANSA. Empat pertanyaan di bawah berlaku sama untuk peserta didik, "
           "pendidik, dan manajemen. Yang berbeda hanya jawabannya.\n\n"
           "TRANSISI. “Dari kalimat itu ada satu doktrin yang mengikat "
           "seluruh rancangan.”",
        en="PURPOSE. This is the core sentence of the whole deck. Read it "
           "slowly; do not paraphrase it.\n\n"
           "THE POINT. All three clauses matter. 'Understand what is happening' "
           "— not merely record it. 'Based on the available evidence' — PINTAR "
           "does not pretend to know more than the evidence supports. 'So "
           "people can make better decisions' — the decision never changes "
           "hands.\n\n"
           "NUANCE. The four questions below apply identically to learners, "
           "educators and management. Only the answers differ.\n\n"
           "TRANSITION. “One doctrine follows from that sentence, and it "
           "binds the whole design.”",
    ),
),

dict(
    key="doctrine", layout="statement", dark=True,
    eyebrow=ACT1,
    statement=L("Informasi yang lebih baik\nmembuat keputusan manusia\nlebih baik.",
                "Better information\nmakes human decisions\nbetter."),
    sub=L("PINTAR tidak mengambil alih keputusan. PINTAR membuatnya lebih terang.",
          "PINTAR does not take the decision over. It makes the decision clearer."),
    footnote=L("PINTAR harus membuat manusia lebih terinformasi, bukan membuat "
               "manusia tidak diperlukan.",
               "PINTAR should make the human better informed, not make the "
               "human unnecessary."),
    notes=dict(
        id="TUJUAN. Menetapkan doktrin sebelum satu pun fitur disebut. "
           "Manajemen dan pendidik sering datang dengan kekhawatiran yang sama: "
           "apakah sistem ini akan memutuskan sesuatu tentang murid atau "
           "tentang saya. Jawab sekarang, bukan di akhir.\n\n"
           "INTI. Perhatikan bahwa slide ini belum menyebut AI sama sekali. "
           "Doktrinnya berlaku untuk seluruh sistem; bagian AI datang jauh di "
           "belakang, setelah hadirin paham cara PINTAR memperlakukan bukti.\n\n"
           "KALIMAT PENUTUP di bawah adalah kalimat yang paling layak diingat "
           "dari paparan ini. Boleh diulang di penutup.\n\n"
           "TRANSISI. “Cara paling jujur menjelaskannya adalah mulai dari "
           "orang yang paling banyak memakainya.”",
        en="PURPOSE. Establish the doctrine before a single feature is named. "
           "Management and educators usually arrive with the same worry: will "
           "this system decide something about a student, or about me. Answer "
           "it now, not at the end.\n\n"
           "THE POINT. Notice this slide does not mention AI at all. The "
           "doctrine governs the whole system; the AI section comes much later, "
           "once the audience understands how PINTAR treats evidence.\n\n"
           "THE CLOSING LINE below is the most memorable sentence in the deck. "
           "It is worth repeating at the close.\n\n"
           "TRANSITION. “The honest way to explain it is to start with the "
           "person who uses it most.”",
    ),
),

# ===========================================================================
# ACT 2 — THE EXPERIENCE
# ===========================================================================
dict(
    key="learner-home", layout="screen",
    eyebrow=L("Pengalaman peserta didik", "The learner experience"),
    title=L("Apa yang perlu saya kerjakan sekarang?",
            "What do I need to do now?"),
    lede=L("Satu layar, satu pertanyaan. Urutannya sudah disusun.",
           "One screen, one question. The order is already set."),
    screen=dict(
        title=P("Peserta didik · Pecahan Senilai · Matematika Kelas 5"),
        rows=[
            ("row-strong", P("1   Pemetaan Awal"), P("Mulai"), "primary"),
            ("row", P("2   Peta Bacaan Personal"),
             P("Terbuka setelah Pemetaan Awal selesai."), "quiet"),
            ("row", P("3   Pelajaran"), None, "quiet"),
            ("row", P("4   Uji Penguasaan"), None, "quiet"),
            ("row", P("5   Hasil"), None, "quiet"),
        ],
    ),
    callouts=[
        dict(label=L("URUTANNYA SUDAH DISUSUN", "THE ORDER IS ALREADY SET"),
             body=L("Peserta didik tidak perlu memilih dari mana harus mulai.",
                    "The learner never has to decide where to begin.")),
        dict(label=L("YANG BELUM TERBUKA MENJELASKAN DIRINYA",
                     "WHAT IS NOT OPEN YET EXPLAINS ITSELF"),
             body=L("Bukan sekadar terkunci — layar menyebut apa yang membukanya.",
                    "Not merely locked — the screen names what will open it.")),
        dict(label=L("TANPA ISTILAH SISTEM", "NO SYSTEM VOCABULARY"),
             body=L("Tidak ada status, mode, atau nomor versi di layar peserta didik.",
                    "No status, mode or version number reaches a learner's screen.")),
    ],
    prov=PROV_SCREEN,
    notes=dict(
        id="TUJUAN. Menunjukkan kesederhanaan, bukan kelengkapan. Hadirin harus "
           "merasa: dalam setengah menit seorang anak tahu di mana ia berada "
           "dan apa langkah berikutnya.\n\n"
           "YANG PERLU DIJELASKAN DI LAYAR. Tunjukkan bahwa langkah 2 tidak "
           "hanya 'terkunci' — layar mengatakan apa yang membukanya. Itu "
           "penerapan aturan 'tidak ada jalan buntu'.\n\n"
           "NUANSA UNTUK PENDIDIK. Kalimat pada layar adalah kalimat produk "
           "yang sebenarnya, dalam bahasa yang dipakai kepada anak. PINTAR "
           "memakai register bahasa berbeda untuk anak, remaja, dewasa, "
           "pendidik, dan pimpinan.\n\n"
           "JANGAN. Jangan menyebut ini tangkapan layar. Ini susunan layar yang "
           "dibuat ulang dari antarmuka yang sudah dibangun.\n\n"
           "TRANSISI. “Lima langkah itu punya nama, dan masing-masing "
           "menjawab satu pertanyaan.”",
        en="PURPOSE. Show simplicity, not completeness. The audience should "
           "feel: within half a minute a child knows where they are and what "
           "comes next.\n\n"
           "WHAT TO EXPLAIN ON THE SCREEN. Point out that step 2 is not merely "
           "'locked' — the screen says what will open it. That is the 'no dead "
           "ends' rule in practice.\n\n"
           "NUANCE FOR EDUCATORS. The wording on screen is the product's actual "
           "wording, in the register used with a child. PINTAR speaks in "
           "different registers to children, teenagers, adults, educators and "
           "institutional leaders.\n\n"
           "DO NOT. Do not call this a screenshot. It is a layout "
           "reconstruction of the built interface.\n\n"
           "TRANSITION. “Those five steps have names, and each answers one "
           "question.”",
    ),
),

dict(
    key="cycle", layout="flow",
    eyebrow=ACT2,
    title=L("Siklus belajar, lima langkah",
            "The learning cycle, in five steps"),
    steps=[
        dict(label=P("PEMETAAN AWAL"), term_en="Initial Mapping",
             body=L("Dari mana sebaiknya belajar dimulai?",
                    "Where should learning begin?")),
        dict(label=P("PETA BACAAN"), term_en="Reading Map",
             body=L("Apa yang perlu dibaca lebih dulu?",
                    "What should be read first?")),
        dict(label=P("PELAJARAN"), term_en="Lessons",
             body=L("Belajar melalui materi yang ditugaskan.",
                    "Learn through the assigned material.")),
        dict(label=P("UJI PENGUASAAN"), term_en="Mastery Check",
             body=L("Apa yang sudah bisa ditunjukkan?",
                    "What can now be demonstrated?")),
        dict(label=P("HASIL"), term_en="Results",
             body=L("Apa yang didukung bukti yang ada?",
                    "What does the evidence support?")),
    ],
    band=L("Pemetaan Awal dan Uji Penguasaan tidak pernah memakai soal yang "
           "sama, dan tidak pernah memakai soal kembarannya.",
           "Initial Mapping and the Mastery Check never use the same questions, "
           "and never use their twins either."),
    band_tone="primary",
    notes=dict(
        id="TUJUAN. Memberi hadirin satu gambar yang bisa dibawa pulang. Jika "
           "hanya satu slide yang diingat, slide ini yang paling berguna.\n\n"
           "INTI. Bacakan lima pertanyaannya, bukan lima namanya. Nama hanya "
           "label; pertanyaannya yang menjelaskan mengapa langkah itu ada.\n\n"
           "PITA DI BAWAH penting untuk kepercayaan. Kalau soal awal dan soal "
           "akhir sama, 'kenaikan' hanyalah efek mengingat. PINTAR menutup itu "
           "sebagai aturan sistem, bukan sebagai anjuran penyusunan soal.\n\n"
           "JANGAN. Jangan menyebut Pemetaan Awal sebagai pra-ujian atau tes "
           "penempatan. Tidak ada nilai dan tidak ada lulus di situ.\n\n"
           "TRANSISI. “Mari lihat langkah pertama — justru langkah itu "
           "yang paling sering disalahpahami.”",
        en="PURPOSE. Give the audience one picture they can take away. If they "
           "remember only one slide, this is the most useful one.\n\n"
           "THE POINT. Read the five questions, not the five names. The names "
           "are only labels; the questions explain why each step exists.\n\n"
           "THE BAND matters for trust. If the opening and closing questions "
           "are the same, any 'gain' is partly recall. PINTAR closes that as a "
           "system rule, not as authoring advice.\n\n"
           "DO NOT. Do not describe Pemetaan Awal as a pre-exam or a placement "
           "test. It has no score and no pass.\n\n"
           "TRANSITION. “Let us look at the first step — it is the one "
           "most often misunderstood.”",
    ),
),

dict(
    key="pemetaan", layout="screen",
    eyebrow=ACT2,
    title=L("Pemetaan Awal bukan ujian.",
            "Initial Mapping is not an exam."),
    lede=L("Tidak ada nilai, tidak ada lulus atau belum lulus. Jawabannya "
           "dipakai untuk menyusun urutan bacaan.",
           "No score, no pass or fail. The answers are used to build a reading "
           "order."),
    screen=dict(
        title=P("Peserta didik · Pemetaan Awal"),
        rows=[
            ("lede", P("Ini bukan ujian. Jawabanmu dipakai untuk menyusun peta "
                       "bacaan yang pas untukmu."), None, None),
            ("meta", P("● ● ● ○ ○ ○ ○ "
                       "○        Pertanyaan 3"), None, None),
            ("row-strong", P("Manakah yang nilainya sama dengan 2/4?"),
             None, "quiet"),
            ("row", P("A   1/2"), None, "quiet"),
            ("row", P("B   2/8"), None, "quiet"),
            ("meta", P("Kembali                               Berikutnya"),
             None, None),
        ],
    ),
    callouts=[
        dict(label=L("TANPA VONIS", "NO VERDICT"),
             body=L("Jawaban yang belum tepat dibaca sebagai cara berpikir, "
                    "bukan sebagai kekurangan.",
                    "An answer that is not yet right is read as a way of "
                    "thinking, not as a deficiency.")),
        dict(label=L("TANPA PERBANDINGAN", "NO COMPARISON"),
             body=L("PINTAR membandingkan seseorang dengan dirinya sendiri, "
                    "bukan dengan temannya.",
                    "PINTAR compares a person with their own earlier self, "
                    "never with a classmate.")),
        dict(label=L("KEMAJUAN SEBAGAI TITIK", "PROGRESS AS DOTS"),
             body=L("Tidak ada persentase dan tidak ada hitung mundur di layar ini.",
                    "No percentage and no countdown on this screen.")),
    ],
    prov=PROV_SCREEN,
    notes=dict(
        id="TUJUAN. Menghapus kekhawatiran pertama pendidik: 'apakah ini ujian "
           "tambahan untuk anak-anak saya?'\n\n"
           "INTI. Pemetaan Awal adalah alat penyusun urutan bacaan. Jawaban "
           "yang keliru berguna justru karena keliru — ia menunjukkan cara "
           "berpikir yang perlu dibantu.\n\n"
           "BAHASA. Perhatikan bahwa PINTAR tidak pernah memakai kata 'salah' "
           "atau 'gagal' kepada peserta didik. Yang dipakai adalah 'belum "
           "tepat'. Dalam bahasa Indonesia, 'belum' menyisakan waktu; 'tidak' "
           "menutupnya.\n\n"
           "JANGAN. Jangan mengatakan PINTAR 'menilai gaya belajar' atau "
           "'mengenali tipe peserta didik'. Yang dilakukan adalah menyusun "
           "urutan bacaan dari jawaban pada materi itu.\n\n"
           "TRANSISI. “Hasil dari langkah ini bukan halaman nilai.”",
        en="PURPOSE. Remove the first worry an educator has: 'is this one more "
           "exam for my students?'\n\n"
           "THE POINT. Initial Mapping is an instrument for ordering reading. A "
           "wrong answer is useful precisely because it is wrong — it shows a "
           "way of thinking that needs support.\n\n"
           "LANGUAGE. Note that PINTAR never says 'wrong' or 'failed' to a "
           "learner. It says 'not yet right'. In Indonesian, 'belum' leaves "
           "time open; 'tidak' closes it.\n\n"
           "DO NOT. Do not say PINTAR 'assesses learning styles' or 'identifies "
           "learner types'. What it does is order reading from the answers "
           "given on this material.\n\n"
           "TRANSITION. “What comes out of this step is not a results "
           "page.”",
    ),
),

dict(
    key="peta", layout="screen",
    eyebrow=ACT2,
    title=L("Peta Bacaan: sebuah urutan, bukan peringkat.",
            "The Reading Map: an order, not a ranking."),
    lede=L("Satu kartu untuk setiap bagian kemampuan, sudah diurutkan, "
           "masing-masing menunjuk ke bacaannya dan alasannya.",
           "One card per competency area, already ordered, each pointing to its "
           "reading and its reason."),
    screen=dict(
        title=P("Peserta didik · Peta Bacaan Personal"),
        rows=[
            ("row-strong", P("Baca ini lebih dulu"),
             P("Membandingkan pecahan berpenyebut berbeda · Bab 2"), "attention"),
            ("row", P("Perlu dibaca"), P("Menyamakan penyebut · Bab 2"), "info"),
            ("row", P("Sebaiknya dibaca"),
             P("Pecahan senilai pada garis bilangan · Bab 1"), "quiet"),
            ("row", P("Sudah kamu kuasai"),
             P("Mengenali bentuk pecahan · Bab 1"), "ok"),
        ],
    ),
    callouts=[
        dict(label=L("BUKAN HALAMAN NILAI", "NOT A RESULTS PAGE"),
             body=L("Tidak ada skor, persentase, atau jumlah yang keliru di layar ini.",
                    "No score, no percentage, no tally of what is not yet "
                    "right.")),
        dict(label=L("SELALU ADA LANGKAH BERIKUTNYA", "ALWAYS A NEXT STEP"),
             body=L("Setiap kartu menyebut bacaannya dan alasannya dalam bahasa biasa.",
                    "Every card names its reading and its reason in plain language.")),
        dict(label=L("YANG SUDAH KUAT JUGA DISEBUT", "STRENGTH IS NAMED TOO"),
             body=L("Peserta didik tahu apa yang tidak perlu diulang.",
                    "The learner also learns what does not need repeating.")),
    ],
    prov=PROV_SCREEN,
    notes=dict(
        id="TUJUAN. Menunjukkan bentuk paling konkret dari 'bukti yang bisa "
           "dipakai'. Inilah pembelajaran yang menyesuaikan ke mana perhatian "
           "diarahkan.\n\n"
           "INTI. Empat tingkat itu adalah urutan, bukan nilai. Kartu teratas "
           "bukan 'nilai terburuk'; ia 'yang paling berguna dibaca lebih "
           "dulu'.\n\n"
           "JANGAN OVERKLAIM. Jangan menyebut ini 'AI adaptif' atau 'kurikulum "
           "yang dipersonalisasi mesin'. Yang terjadi: jawaban pada materi itu "
           "diurutkan menjadi bacaan pada materi yang sama.\n\n"
           "UNTUK PENDIDIK. Kartu paling atas juga memberi tahu pendidik apa "
           "yang layak dibahas ulang di kelas.\n\n"
           "TRANSISI. “Setelah membaca, barulah ada asesmen yang "
           "sebenarnya.”",
        en="PURPOSE. Show the most concrete form of 'evidence someone can act "
           "on'. This is learning adapting to where attention is needed.\n\n"
           "THE POINT. The four tiers are an order, not a grade. The top card "
           "is not 'the worst score'; it is 'the most useful thing to read "
           "first'.\n\n"
           "DO NOT OVERCLAIM. Do not call this 'adaptive AI' or 'a "
           "machine-personalised curriculum'. What happens is that answers on "
           "this material are ordered into reading on the same material.\n\n"
           "FOR EDUCATORS. The top card also tells the educator what is worth "
           "revisiting with the class.\n\n"
           "TRANSITION. “Only after the reading does the real assessment "
           "come.”",
    ),
),

dict(
    key="penguasaan", layout="screen",
    eyebrow=ACT2,
    title=L("Uji Penguasaan: tenang, dan boleh ditinjau kembali.",
            "The Mastery Check: calm, and revisitable."),
    lede=L("Waktu berjalan, bukan menghitung mundur. Soal boleh ditandai, "
           "ditinggal, dan dikunjungi lagi.",
           "Time counts up, not down. A question can be flagged, left, and "
           "returned to."),
    screen=dict(
        title=P("Peserta didik · Uji Penguasaan"),
        rows=[
            ("meta", P("Waktu berjalan  12:04        Daftar soal        Tandai"),
             None, None),
            ("row-strong", P("Urutkan pecahan berikut dari yang terkecil."),
             None, "quiet"),
            ("row", P("A   1/3 · 2/5 · 1/2"), None, "quiet"),
            ("row", P("\U0001F9ED  Perlu arah?"),
             P("Muncul setelah jeda. Tidak menyebut jawabannya."), "info"),
            ("meta", P("Simpan & Jeda                           Kumpulkan"),
             None, None),
        ],
    ),
    callouts=[
        dict(label=L("BANTUAN YANG TIDAK MEMBUKA KUNCI",
                     "HELP THAT NEVER UNLOCKS THE ANSWER"),
             body=L("Petunjuk tidak boleh menyebut atau mempersempit ke pilihan "
                    "yang benar. Aturan ini dijaga oleh basis data, bukan oleh "
                    "kebiasaan menulis soal.",
                    "A hint may never name or narrow to the correct option. The "
                    "database enforces that rule; it is not an authoring "
                    "habit.")),
        dict(label=L("MEMINTA BANTUAN TIDAK MENGURANGI NILAI",
                     "ASKING FOR HELP NEVER COSTS A MARK"),
             body=L("Catatan waktu dan catatan bantuan tidak pernah masuk ke "
                    "perhitungan nilai.",
                    "Timing and assistance records never enter the score "
                    "calculation.")),
        dict(label=L("PEKERJAAN TIDAK HILANG", "WORK IS NOT LOST"),
             body=L("Jika sambungan terputus, jawaban disimpan dan dikirim lagi "
                    "saat tersambung — tanpa tergandakan.",
                    "If the connection drops, answers are held and re-sent on "
                    "reconnection — without duplicating.")),
    ],
    prov=PROV_SCREEN,
    notes=dict(
        id="TUJUAN. Menjawab dua kekhawatiran sekaligus: apakah asesmennya "
           "menekan, dan apakah bantuan membuatnya tidak jujur.\n\n"
           "INTI. Bantuan muncul setelah jeda diam — bukan segera, agar anak "
           "sempat berpikir. Bantuan bertingkat: arah berpikir dulu, lalu "
           "langkah pertama, lalu contoh serupa. Tidak satu pun menyebut "
           "jawaban.\n\n"
           "PENTING UNTUK KEPERCAYAAN. Aturan 'petunjuk tidak boleh menyebut "
           "jawaban' bukan panduan penulisan — petunjuk yang melanggarnya "
           "ditolak oleh basis data. Sampaikan dengan tenang; ini alasan teknis "
           "yang paling layak disebut di depan pendidik.\n\n"
           "JANGAN. Jangan menjanjikan 'mencegah kecurangan'. Kita bicara "
           "tentang menjaga integritas proses, bukan menjaminnya.\n\n"
           "TRANSISI. “Lalu apa yang dilihat peserta didik sesudahnya?”",
        en="PURPOSE. Answer two worries at once: is the assessment stressful, "
           "and does the help make it dishonest.\n\n"
           "THE POINT. Help appears after a pause of inactivity — not "
           "immediately, so the learner has room to think. It is staged: a "
           "direction of thinking, then a first step, then a similar worked "
           "example. None of them names the answer.\n\n"
           "IMPORTANT FOR TRUST. The rule that a hint may never name the answer "
           "is not authoring guidance — the database rejects a hint that breaks "
           "it. Say this calmly; it is the one technical fact most worth "
           "stating in front of educators.\n\n"
           "DO NOT. Do not promise that PINTAR 'prevents cheating'. We are "
           "supporting process integrity, not guaranteeing it.\n\n"
           "TRANSITION. “So what does the learner see afterwards?”",
    ),
),

dict(
    key="hasil", layout="screen",
    eyebrow=ACT2,
    title=L("Hasil: apa yang dikuasai, apa yang masih perlu perhatian.",
            "Results: what is mastered, and what still needs attention."),
    screen=dict(
        title=P("Peserta didik · Hasil"),
        rows=[
            ("meta", P("Penguasaan"), None, None),
            ("h1", P("84%"), None, None),
            ("row", P("Semua butir penting sudah kamu jawab dengan tepat."),
             None, "ok"),
            ("row", P("Tinjau kembali · Butir 6 · Belum tepat"),
             P("Buka pembahasan"), "quiet"),
            ("row-strong", P("Perubahan dari Pemetaan Awal     58% → 84%"),
             None, "primary"),
        ],
    ),
    callouts=[
        dict(label=L("DIBANDINGKAN DENGAN DIRINYA SENDIRI",
                     "COMPARED ONLY WITH THEMSELVES"),
             body=L("Perubahan dari Pemetaan Awal, bukan peringkat di kelas.",
                    "The change since Initial Mapping, not a rank in the class.")),
        dict(label=L("TIDAK ADA PERBANDINGAN PALSU", "NO FALSE COMPARISON"),
             body=L("Kalau satu langkah belum dikerjakan, PINTAR mengatakannya "
                    "— bukan menampilkan selisih nol.",
                    "If one of the two steps was not taken, PINTAR says so — it "
                    "does not display a difference of zero.")),
        dict(label=L("BUTIR PENTING", "SAFETY-CRITICAL ITEMS"),
             body=L("Pada materi yang menyangkut keselamatan, satu butir "
                    "penting yang belum tepat berarti penguasaan belum "
                    "tercapai — berapa pun nilainya.",
                    "Where safety-critical content applies, one such item not "
                    "yet right means mastery is not reached — whatever the "
                    "score.")),
    ],
    prov=PROV_SCREEN,
    notes=dict(
        id="TUJUAN. Menunjukkan bahwa 'hasil' di PINTAR adalah bacaan, bukan "
           "vonis.\n\n"
           "INTI. Tiga hal di layar: apa yang dikuasai, apa yang masih perlu "
           "perhatian, dan perubahan terhadap diri sendiri. Pembahasan butir "
           "yang belum tepat terbuka otomatis kalau butir itu termasuk butir "
           "penting. Layar yang sama juga memuat rincian per bagian "
           "kemampuan.\n\n"
           "KALIMAT 'TIDAK ADA PERBANDINGAN PALSU' layak ditekankan di depan "
           "manajemen: sistem ini lebih memilih mengatakan 'belum ada yang bisa "
           "dibandingkan' daripada menampilkan angka rapi yang tidak berarti.\n\n"
           "BUTIR PENTING. Jelaskan dengan contoh dari pendidikan profesi: pada "
           "materi yang menyangkut keselamatan, nilai tinggi tidak menutup satu "
           "kekeliruan yang berbahaya.\n\n"
           "TRANSISI. “Sekarang sisi yang lain: apa yang dilihat "
           "pendidik.”",
        en="PURPOSE. Show that a 'result' in PINTAR is a reading, not a "
           "verdict.\n\n"
           "THE POINT. Three things on screen: what is mastered, what still "
           "needs attention, and the change against oneself. The explanation "
           "for an item that is not yet right opens automatically when that "
           "item is safety-critical. The same screen also carries a per-domain "
           "breakdown.\n\n"
           "'NO FALSE COMPARISON' is worth stressing to management: this system "
           "would rather say 'there is nothing to compare yet' than display a "
           "tidy number that means nothing.\n\n"
           "SAFETY-CRITICAL. Explain it with a professional-education example: "
           "on safety-critical material, a high overall score does not cover "
           "one dangerous error.\n\n"
           "TRANSITION. “Now the other side: what the educator sees.”",
    ),
),

dict(
    key="educator-home", layout="screen",
    eyebrow=L("Pengalaman pendidik", "The educator experience"),
    title=L("Apa yang paling layak dikerjakan lebih dulu?",
            "What is most worth doing first?"),
    lede=L("Beranda pendidik bukan dasbor yang menampilkan segalanya. Yang "
           "tidak perlu dikerjakan tidak muncul sama sekali.",
           "The educator's home is not a dashboard of everything. What needs "
           "nothing does not appear at all."),
    screen=dict(
        title=P("Pendidik · Studio · Beranda"),
        rows=[
            ("row-strong", P("Menunggu tindakan Anda"), None, "attention",
             P("3")),
            ("row", P("Menunggu tinjauan Anda"), None, "info", P("2")),
            ("row", P("Tertahan"), None, "blocked", P("1")),
            ("row", P("Sinyal mutu soal"), None, "quiet", P("1")),
            ("row", P("Pustaka PINTAR untuk sekolah Anda"), None, "quiet",
             P("4")),
        ],
    ),
    callouts=[
        dict(label=L("KARTU BERNILAI NOL TIDAK MUNCUL",
                     "A ZERO CARD DOES NOT RENDER"),
             body=L("Kekosongan ada di datanya, bukan disembunyikan tampilan.",
                    "The emptiness is in the data, not hidden by the layout.")),
        dict(label=L("KELAS DALAM LINGKUP MENGAJAR ANDA",
                     "CLASSES IN YOUR TEACHING CONTEXT"),
             body=L("Bukan 'semua kelas yang bisa dilihat' — kelas yang memang "
                    "Anda ajar.",
                    "Not 'every class you can see' — the classes you actually "
                    "teach.")),
        dict(label=L("PINTAR MENGUSULKAN, PENDIDIK MEMUTUSKAN",
                     "PINTAR PROPOSES, THE EDUCATOR DECIDES"),
             body=L("Setiap kartu adalah tawaran pekerjaan, bukan perintah.",
                    "Every card is an offer of work, never an instruction.")),
    ],
    prov=PROV_SCREEN,
    notes=dict(
        id="TUJUAN. Menghapus kekhawatiran kedua pendidik: 'apakah ini menambah "
           "pekerjaan administrasi saya?'\n\n"
           "INTI. Pertanyaan layar ini satu: apa yang paling layak dikerjakan "
           "lebih dulu. Kartu yang jumlahnya nol tidak ditampilkan — jadi "
           "beranda yang bersih benar-benar berarti tidak ada yang menunggu.\n\n"
           "KATA YANG BENAR. Gunakan 'kelas dalam lingkup mengajar Anda'. "
           "Hindari 'kelas yang bisa Anda lihat': data yang terlihat, konteks "
           "yang dipilih, dan wewenang bertindak adalah tiga hal berbeda, dan "
           "menyamakannya menyesatkan.\n\n"
           "JANGAN. Jangan menjanjikan ringkasan kelas atau laporan otomatis di "
           "slide ini — itu ada di bagian arah pengalaman, dengan label yang "
           "jelas.\n\n"
           "TRANSISI. “Ada satu hal yang paling sering ditanyakan "
           "pendidik: bisakah saya membuat asesmen sendiri, cepat?”",
        en="PURPOSE. Remove the educator's second worry: 'does this add "
           "administrative work?'\n\n"
           "THE POINT. This screen asks one question: what is most worth doing "
           "first. A bucket with a count of zero does not render — so a clean "
           "home genuinely means nothing is waiting.\n\n"
           "THE RIGHT WORDS. Say 'classes in your teaching context'. Avoid "
           "'classes you can see': visible account data, selected context and "
           "action authority are three different things, and collapsing them "
           "misleads.\n\n"
           "DO NOT. Do not promise class briefings or automatic reports on this "
           "slide — those appear later, in the clearly-labelled experience "
           "direction section.\n\n"
           "TRANSITION. “There is one thing educators ask about first: can "
           "I create an assessment myself, quickly?”",
    ),
),

dict(
    key="ujicepat", layout="loop",
    eyebrow=ACT2,
    title=L("Uji Cepat: dari niat ke kelas, kira-kira satu menit.",
            "Quick Assessment: from intent to classroom, in about a minute."),
    lede=L("Pilih kelas dan bab yang baru Anda ajarkan, lalu buka. Tanpa "
           "permintaan ke admin, tanpa bantuan teknis.",
           "Pick the class and the chapter just taught, then open it. No request "
           "to an administrator, no technical help."),
    top_label=L("PENDIDIK", "EDUCATOR"),
    top=[L("ATUR", "CONFIGURE"), L("TINJAU", "REVIEW"), L("BUKA", "MAKE AVAILABLE")],
    bottom_label=L("PESERTA DIDIK", "LEARNER"),
    bottom=[L("MENERIMA", "RECEIVES"), L("MENGERJAKAN", "ANSWERS"),
            L("MENJADI BUKTI BELAJAR", "BECOMES EVIDENCE")],
    band=L("Uji Cepat dapat menyumbang bukti belajar. Satu Uji Cepat tidak "
           "dengan sendirinya menerbitkan sertifikat.",
           "A Quick Assessment can contribute learning evidence. A single one "
           "does not by itself issue a certificate."),
    notes=dict(
        id="TUJUAN. Ini slide yang paling berpengaruh untuk pendidik. Kalau "
           "hadirin hanya membawa pulang satu kemampuan, biasanya ini.\n\n"
           "INTI. Pendidik memilih kelasnya dan bab yang baru diajarkan — dari "
           "paket sekolahnya sendiri atau dari Pustaka PINTAR yang diizinkan "
           "untuk sekolah itu — lalu membukanya. Murid bisa mulai mengerjakan "
           "dalam hitungan menit.\n\n"
           "PENTING. Hasilnya menjadi bagian dari bukti belajar. Jangan memakai "
           "rumusan lama 'tidak masuk sertifikat' — rumusan itu sudah tidak "
           "berlaku. Yang benar: satu Uji Cepat tidak dengan sendirinya "
           "menerbitkan sertifikat.\n\n"
           "JIKA DITANYA. Kalau bahan sebuah Uji Cepat tidak lagi diizinkan "
           "untuk sekolah itu, pengerjaan baru tidak dibuka lagi, dan pekerjaan "
           "murid yang sudah selesai tetap tersimpan.\n\n"
           "TRANSISI. “Di belakang kecepatan itu ada tata kelola yang "
           "sengaja dibuat pelan.”",
        en="PURPOSE. This is the most persuasive slide for educators. If the "
           "room takes home one capability, it is usually this one.\n\n"
           "THE POINT. The educator picks their class and the chapter just "
           "taught — from the school's own package or from the PINTAR library "
           "authorised for that school — and opens it. Students can start "
           "within minutes.\n\n"
           "IMPORTANT. The result becomes part of the learning evidence. Do not "
           "use the old phrasing 'not part of a certificate' — that wording is "
           "obsolete. The correct statement: a single Quick Assessment does not "
           "by itself issue a certificate.\n\n"
           "IF ASKED. If the material behind a Quick Assessment is no longer "
           "authorised for that school, no new attempt opens, and work already "
           "finished stays finished.\n\n"
           "TRANSITION. “Behind that speed sits a governance path that is "
           "slow on purpose.”",
    ),
),

dict(
    key="governance", layout="flow",
    eyebrow=ACT2,
    title=L("Menyiapkan pembelajaran: melihat bukan berarti menetapkan.",
            "Preparing learning: looking is not committing."),
    steps=[
        dict(label=L("SIAPKAN", "PREPARE"),
             body=L("PINTAR mengenali peran tiap berkas dan menanyakan yang "
                    "belum pasti.",
                    "PINTAR recognises each file's role and asks about what is "
                    "not certain.")),
        dict(label=L("TINJAU", "REVIEW"),
             body=L("Penyusun tidak meninjau pekerjaannya sendiri.",
                    "An author never reviews their own work.")),
        dict(label=L("KUNCI", "LOCK"),
             body=L("Setelah dikunci, isinya tidak dapat diubah lagi.",
                    "Once locked, the content cannot change.")),
        dict(label=L("TERBITKAN", "PUBLISH"),
             body=L("Tersedia untuk sekolah.", "Available to the school.")),
        dict(label=L("TUGASKAN", "ASSIGN"),
             body=L("Baru di sinilah peserta didik melihatnya.",
                    "Only here does a learner see it.")),
    ],
    band=L("Menerbitkan belum menugaskan. Perbaikan berikutnya dibuat sebagai "
           "salinan baru — paket aslinya tetap utuh beserta catatan pengerjaan "
           "peserta didik.",
           "Publishing is not yet assigning. The next correction is made as a "
           "new copy — the original stays intact, with every record of the "
           "learners' work."),
    band_tone="primary",
    notes=dict(
        id="TUJUAN. Menjawab pertanyaan manajemen: 'bisakah kami memercayai "
           "isinya?'\n\n"
           "INTI. Lima langkah, tiga di antaranya pengendalian manusia: "
           "peninjau bukan penyusun; penguncian adalah tindakan sadar; "
           "penerbitan adalah wewenang tersendiri. Tidak ada AI dan tidak ada "
           "alat luar yang dapat menerbitkan atau menugaskan materi.\n\n"
           "MENGAPA PENGUNCIAN PENTING. Sertifikat menunjuk ke isi yang persis "
           "diajarkan. Kalau isi bisa berubah diam-diam sesudahnya, sertifikat "
           "kehilangan artinya. Karena itu perbaikan menjadi salinan baru, "
           "bukan suntingan.\n\n"
           "PENDIDIK SERING BERTANYA: apa yang terjadi pada murid yang sedang "
           "mengerjakan ketika ada perbaikan? Perpindahan ke versi baru adalah "
           "tindakan eksplisit dan tercatat, bukan otomatis.\n\n"
           "TRANSISI. “Sekarang bagian yang paling menentukan cara PINTAR "
           "berpikir.”",
        en="PURPOSE. Answer management's question: 'can we trust the "
           "content?'\n\n"
           "THE POINT. Five steps, three of them human controls: the reviewer "
           "is not the author; locking is a deliberate act; publishing is a "
           "separate authority. No AI and no external tool can publish content "
           "or assign it to learners.\n\n"
           "WHY LOCKING MATTERS. A certificate points at exactly the content "
           "that was taught. If that content could change quietly afterwards, "
           "the certificate loses its meaning. So a correction becomes a new "
           "copy, never an edit.\n\n"
           "EDUCATORS OFTEN ASK what happens to learners mid-course when a "
           "correction arrives. Moving an assignment to a new version is an "
           "explicit, recorded act — never automatic.\n\n"
           "TRANSITION. “Now the part that most defines how PINTAR "
           "thinks.”",
    ),
),

# ===========================================================================
# ACT 3 — EVIDENCE
# ===========================================================================
dict(
    key="evidence", layout="branch",
    eyebrow=ACT3,
    title=L("Pertanyaan yang selalu ditanyakan lebih dulu: apakah buktinya "
            "sudah cukup?",
            "The question asked first, every time: is there enough evidence?"),
    start=L("AKTIVITAS BELAJAR", "LEARNING ACTIVITY"),
    middle=L("BUKTI", "EVIDENCE"),
    decision=L("SUDAH CUKUP?", "ENOUGH?"),
    yes_label=L("SUDAH", "YES"),
    yes_body=L("Tafsiran yang didukung bukti, dan tindakan yang bisa diambil.",
               "An interpretation the evidence supports, and an action to take."),
    no_label=L("BELUM", "NOT YET"),
    no_body=L("Amati, dampingi, kumpulkan lebih banyak bukti.",
              "Observe, support, gather more evidence."),
    band=L("Tidak setiap aktivitas langsung menjadi kesimpulan, dan tidak ada "
           "kesimpulan yang dipaksakan.",
           "Not every activity becomes a conclusion, and no conclusion is "
           "forced."),
    band_tone="well",
    notes=dict(
        id="TUJUAN. Ini jantung paparan. Semua yang sebelumnya menuju ke sini, "
           "dan semua yang sesudahnya bertumpu padanya.\n\n"
           "INTI. Banyak sistem memperlakukan setiap aktivitas sebagai "
           "kesimpulan: dikerjakan berarti dipahami, nilai berarti kemampuan. "
           "PINTAR menyisipkan satu pertanyaan sebelum itu — apakah buktinya "
           "cukup untuk menyimpulkan.\n\n"
           "CABANG 'BELUM' BUKAN KEGAGALAN SISTEM. Justru di situ letak "
           "kejujurannya. Sistem yang selalu punya jawaban adalah sistem yang "
           "kadang mengarang.\n\n"
           "JANGAN. Jangan menjelaskan ambang statistiknya. Hadirin tidak "
           "membutuhkannya, dan angkanya berbeda menurut jenis sinyal.\n\n"
           "TRANSISI. “Dan inilah kalimat yang paling sering "
           "disalahpahami.”",
        en="PURPOSE. This is the heart of the deck. Everything before leads "
           "here, and everything after rests on it.\n\n"
           "THE POINT. Many systems treat every activity as a conclusion: "
           "completed means understood, a score means ability. PINTAR inserts "
           "one question before that — is there enough evidence to conclude "
           "anything.\n\n"
           "THE 'NOT YET' BRANCH IS NOT A SYSTEM FAILURE. That is precisely "
           "where its honesty lives. A system that always has an answer is a "
           "system that sometimes invents one.\n\n"
           "DO NOT. Do not explain the statistical thresholds. The room does "
           "not need them, and they differ by signal type.\n\n"
           "TRANSITION. “And here is the sentence people most often "
           "misread.”",
    ),
),

dict(
    key="belum", layout="contrast",
    eyebrow=ACT3,
    title=L("“Belum cukup bukti” bukan berarti “belum baik”.",
            "“Not yet enough evidence” is not “not good "
            "enough”."),
    left=dict(
        tone="info",
        label=L("BELUM CUKUP BUKTI", "NOT YET ENOUGH EVIDENCE"),
        heading=L("Kami belum tahu.", "We do not know yet."),
        lines=[
            L("Bukan penilaian tentang orangnya.",
              "Not a judgment about the person."),
            L("Keadaan yang sah dan jujur.", "A valid, honest state."),
            L("Berubah begitu buktinya bertambah.",
              "It changes as evidence arrives."),
        ],
    ),
    right=dict(
        tone="attention",
        label=L("BELUM MEMENUHI CAPAIAN", "NOT YET MEETING THE STANDARD"),
        heading=L("Ini kesimpulan yang didukung bukti.",
                  "A conclusion the evidence supports."),
        lines=[
            L("Buktinya sudah memadai.", "The evidence is sufficient."),
            L("Ada tindak lanjut yang jelas.", "There is a clear next step."),
            L("Tetap dibaca “belum”, bukan “tidak”.",
              "Still “not yet”, never “no”."),
        ],
    ),
    notice=L("Di dalam produk, kalimatnya persis begini: “Belum cukup bukti "
             "untuk menilai soal ini.”",
             "Inside the product: “Belum cukup bukti untuk menilai soal "
             "ini.”"),
    band=L("BELUM ≠ TIDAK", "NOT YET ≠ NO"),
    band_tone="primary",
    notes=dict(
        id="TUJUAN. Memisahkan dua hal yang hampir selalu tercampur, dan "
           "pencampurannya merugikan peserta didik maupun pendidik.\n\n"
           "INTI. Kolom kiri: sistem tidak punya cukup dasar. Kolom kanan: "
           "sistem punya cukup dasar, dan dasarnya menunjukkan sesuatu yang "
           "perlu ditindaklanjuti. Keduanya sah; keduanya berbeda; keduanya "
           "tidak boleh ditulis dengan kata yang sama.\n\n"
           "MENGAPA INI SOAL BAHASA. Dalam bahasa Indonesia, 'belum' menyimpan "
           "waktu yang masih terbuka, 'tidak' menutupnya. PINTAR memakai "
           "perbedaan itu dengan sengaja, di seluruh produk.\n\n"
           "UNTUK MANAJEMEN. Sistem yang berani berkata 'kami belum tahu' "
           "adalah sistem yang angkanya bisa dipercaya ketika ia berkata "
           "tahu.\n\n"
           "TRANSISI. “Prinsip yang sama berlaku untuk hal yang lebih "
           "peka: catatan selama asesmen.”",
        en="PURPOSE. Separate two things that are almost always conflated, and "
           "whose conflation costs both learners and educators.\n\n"
           "THE POINT. Left column: the system does not have enough basis. "
           "Right column: it does, and that basis shows something worth acting "
           "on. Both are valid; they are different; they must never be written "
           "with the same words.\n\n"
           "WHY THIS IS A LANGUAGE QUESTION. In Indonesian, 'belum' holds time "
           "open while 'tidak' closes it. PINTAR uses that difference "
           "deliberately, throughout the product.\n\n"
           "FOR MANAGEMENT. A system willing to say 'we do not know yet' is a "
           "system whose numbers you can trust when it says it does.\n\n"
           "TRANSITION. “The same principle governs something more "
           "sensitive: what is recorded during an assessment.”",
    ),
),

dict(
    key="observation", layout="contrast",
    eyebrow=ACT3,
    title=L("Observasi bukan penilaian.", "Observation is not judgment."),
    left=dict(
        tone="quiet",
        label=L("YANG DICATAT", "WHAT IS RECORDED"),
        heading=L("Aktivitas sesi, seperlunya.",
                  "Session activity, proportionately."),
        lines=[
            L("Perpindahan antar-soal dan halaman.",
              "Movement between questions and pages."),
            L("Sambungan yang terputus dan pulih.",
              "A connection dropping and returning."),
            L("Perubahan pilihan dan waktu pengumpulan.",
              "Changes of answer, and submission times."),
        ],
    ),
    right=dict(
        tone="blocked",
        label=L("YANG TIDAK DILAKUKAN", "WHAT IS NOT DONE"),
        heading=L("Tidak ada pengawasan ruang pribadi.",
                  "No surveillance of a private space."),
        lines=[
            L("Tidak ada kamera, mikrofon, rekaman layar.",
              "No webcam, microphone, screen recording."),
            L("Tidak ada perekaman ketikan.", "No keystroke logging."),
            L("Tidak ada vonis yang diputuskan mesin.",
              "No machine-decided verdict."),
        ],
    ),
    notice=L("“Selama asesmen, aktivitas sesi tertentu dapat dicatat untuk "
             "menjaga integritas proses. Catatan ini merupakan observasi dan "
             "tidak menentukan hasil Anda secara otomatis.”",
             "“During the assessment, certain session activity may be "
             "recorded to support process integrity. These records are "
             "observations and do not automatically determine your result.”"),
    notes=dict(
        id="TUJUAN. Menjawab kekhawatiran yang jarang diucapkan tetapi hampir "
           "selalu ada: apakah sistem ini mengawasi anak-anak kami.\n\n"
           "KALIMAT PEMBUKA YANG DISARANKAN, dari produk sendiri: \u201cCatatan "
           "ini bahan pertimbangan manusia, bukan kesimpulan tentang peserta "
           "didik.\u201d\n\n"
           "INTI. Yang dicatat adalah hal yang wajar terjadi pada permukaan "
           "asesmen, dan catatan itu tidak pernah menjadi masukan nilai. Kalau "
           "ada pola yang perlu dilihat, yang muncul adalah permintaan untuk "
           "ditinjau manusia — bukan keputusan.\n\n"
           "KALIMAT DI DALAM KOTAK adalah rumusan resmi untuk peserta didik. "
           "Bacakan apa adanya kalau ada pertanyaan tentang privasi.\n\n"
           "JANGAN. Jangan menambah kemampuan yang tidak ada, dan jangan "
           "menjanjikan bahwa PINTAR 'mencegah kecurangan'.\n\n"
           "CATATAN KEJUJURAN. Catatan integritas sudah ada di lapisan data "
           "beserta pemisahannya dari penilaian; pemberitahuan di layar peserta "
           "didik adalah rumusan resmi yang belum menjadi layar berjalan pada "
           "versi ini.\n\n"
           "TRANSISI. “Prinsip yang sama berlaku untuk angka.”",
        en="PURPOSE. Answer the worry that is rarely voiced but almost always "
           "present: is this system watching our children.\n\n"
           "SUGGESTED OPENING LINE, in the product's own words: \u201cThese "
           "records are material for a human to weigh, never a conclusion about "
           "a learner.\u201d\n\n"
           "THE POINT. What is recorded is what ordinarily happens on the "
           "assessment surface, and those records are never a scoring input. "
           "When a pattern deserves a look, what surfaces is a request for a "
           "human review — never a decision.\n\n"
           "THE SENTENCE IN THE BOX is the official learner-facing notice. Read "
           "it verbatim if a privacy question comes up.\n\n"
           "DO NOT. Do not add capabilities that do not exist, and do not "
           "promise that PINTAR 'prevents cheating'.\n\n"
           "HONESTY NOTE. Integrity records exist in the data layer, together "
           "with their separation from scoring; the learner-facing notice is "
           "approved wording that is not yet a running screen in this "
           "version.\n\n"
           "TRANSITION. “The same principle applies to numbers.”",
    ),
),

dict(
    key="numbers", layout="columns",
    eyebrow=ACT3,
    title=L("Sebuah angka tidak pernah berdiri sendiri.",
            "A number never stands alone."),
    lede=L("Contohnya tingkat kesulitan soal: PINTAR menyimpan dua angka yang "
           "berbeda, dan tidak menyatukannya.",
           "Take a question's difficulty: PINTAR keeps two different numbers, "
           "and never merges them."),
    columns=[
        dict(tone="quiet",
             label=L("PERKIRAAN PENYUSUN", "THE AUTHOR'S PREDICTION"),
             heading=L("Sebelum ada yang mengerjakan.",
                       "Before anyone has answered."),
             lines=[L("Kesulitan yang diperkirakan saat soal disusun.",
                      "The difficulty expected when the question was written.")]),
        dict(tone="ok",
             label=L("DARI PENGERJAAN PESERTA DIDIK", "FROM LEARNERS' WORK"),
             heading=L("Sesudah ada bukti yang sah.",
                       "After legitimate evidence exists."),
             lines=[L("Kesulitan yang benar-benar terlihat dalam pengerjaan resmi.",
                      "The difficulty actually seen in official work.")]),
        dict(tone="info",
             label=L("BELUM CUKUP BUKTI", "NOT YET ENOUGH EVIDENCE"),
             heading=L("Selama buktinya belum memadai.",
                       "While the evidence is insufficient."),
             lines=[L("Kolomnya dibiarkan kosong, bukan diisi angka sementara.",
                      "The field is left empty, not given a placeholder.")]),
    ],
    band=L("Bukti dari peragaan, pratinjau, atau pengujian tidak pernah masuk "
           "ke angka resmi, laporan, atau sertifikat.",
           "Evidence from demonstrations, previews or testing never reaches an "
           "official number, a report, or a certificate."),
    band_tone="well",
    notes=dict(
        id="TUJUAN. Menunjukkan bahwa kehati-hatian PINTAR bukan slogan, "
           "melainkan cara data disimpan.\n\n"
           "INTI. Perkiraan penyusun dan angka dari pengerjaan murid adalah dua "
           "hal berbeda, dan PINTAR menyimpannya sebagai dua kolom berbeda. "
           "Selama bukti belum memadai, kolom keduanya kosong. Kosong adalah "
           "jawaban yang jujur.\n\n"
           "UNTUK MANAJEMEN. Inilah alasan sebuah laporan PINTAR bisa dipakai "
           "untuk mengambil keputusan: yang ditampilkan tidak pernah dicampur "
           "dengan angka contoh, angka peragaan, atau angka pengujian.\n\n"
           "JANGAN. Jangan menyebut kalibrasi psikometrik yang lebih dalam "
           "sebagai kemampuan hari ini — itu arah ke depan, dan hanya bila "
           "buktinya sudah cukup.\n\n"
           "TRANSISI. “Bukti yang dijaga seperti ini akhirnya bermuara "
           "pada sesuatu yang bisa dipegang seseorang.”",
        en="PURPOSE. Show that PINTAR's caution is not a slogan but the way the "
           "data is stored.\n\n"
           "THE POINT. An author's prediction and a number derived from "
           "learners' work are two different things, and PINTAR keeps them in "
           "two different fields. While the evidence is insufficient, the "
           "second stays empty. Empty is the honest answer.\n\n"
           "FOR MANAGEMENT. This is why a PINTAR report can carry a decision: "
           "what it shows is never mixed with sample, demonstration or test "
           "numbers.\n\n"
           "DO NOT. Do not present deeper psychometric calibration as a "
           "capability today — it is a direction, and only once the evidence is "
           "sufficient.\n\n"
           "TRANSITION. “Evidence kept this carefully eventually becomes "
           "something a person can hold.”",
    ),
),

# ===========================================================================
# ACT 4 — TRUST AND THE INSTITUTION
# ===========================================================================
dict(
    key="certificate", layout="screen",
    eyebrow=ACT4,
    title=L("Sertifikat yang bisa diperiksa siapa pun.",
            "A certificate anyone can check."),
    lede=L("Sertifikat yang diterbitkan sekolah dapat diverifikasi melalui satu "
           "alamat resmi, tanpa perlu masuk ke sistem.",
           "A certificate issued by the school can be verified at one official "
           "address, with no login."),
    screen=dict(
        title=P("Publik · Verifikasi Sertifikat"),
        rows=[
            ("row-strong", P("Status   ·   Memenuhi capaian"), None, "ok"),
            ("row", P("Predikat   ·   Sangat Baik"), None, "quiet"),
            ("row", P("Diterbitkan oleh   ·   SMA Contoh Nusantara"), None, "quiet"),
            ("lede", P("Halaman ini memastikan sertifikat yang Anda pegang benar "
                       "diterbitkan. Nama pemegang tertera pada sertifikatnya."),
             None, None),
        ],
    ),
    callouts=[
        dict(label=L("HANYA YANG PERLU", "ONLY WHAT IS NEEDED"),
             body=L("Halaman publik tidak menampilkan nilai rinci maupun data "
                    "pribadi.",
                    "The public page shows no score internals and no personal "
                    "data.")),
        dict(label=L("TERIKAT PADA ISI YANG DIAJARKAN",
                     "BOUND TO THE CONTENT THAT WAS TAUGHT"),
             body=L("Sertifikat menyebut versi materi yang dipakai. Mengubah "
                    "bagian yang dijaminnya membuat verifikasi gagal.",
                    "The certificate names the exact version of the material. "
                    "Altering any field it attests to makes verification fail.")),
        dict(label=L("SATU PINTU VERIFIKASI", "ONE VERIFICATION ROUTE"),
             body=L("Hanya ada satu alamat resmi, dan sertifikat lama tetap "
                    "dapat diperiksa setelah kunci diperbarui.",
                    "There is exactly one official address, and older "
                    "certificates stay checkable after a key rotation.")),
    ],
    prov=PROV_SCREEN,
    notes=dict(
        id="TUJUAN. Menunjukkan bentuk paling padat dari 'bukti yang bisa "
           "dipercaya'.\n\n"
           "INTI. Yang menarik bukan sertifikatnya, melainkan apa yang "
           "diikatnya: identitas pemegang pada saat terbit, hasilnya, dan versi "
           "materi yang persis diajarkan. Mengubah salah satunya membuat "
           "verifikasi gagal.\n\n"
           "PRIVASI. Halaman publik menjawab satu pertanyaan saja — benarkah "
           "sertifikat ini diterbitkan — dan tidak lebih.\n\n"
           "KEJUJURAN YANG PERLU DISEBUT. Penerbitan dan verifikasi sudah "
           "berjalan dan sudah dibuktikan pada satu perjalanan belajar utuh. "
           "Tampilan sertifikat untuk peserta didik masih dalam pengerjaan. "
           "Rumusan aman: 'sertifikat yang diterbitkan sekolah muncul di "
           "sini'.\n\n"
           "JANGAN. Jangan menjanjikan penerbitan otomatis begitu seseorang "
           "memenuhi syarat.\n\n"
           "TRANSISI. “Semua ini hanya berguna kalau orang tahu cara "
           "memakainya.”",
        en="PURPOSE. Show the densest form of 'evidence you can trust'.\n\n"
           "THE POINT. The interesting part is not the certificate but what it "
           "binds: the holder's identity as of issuance, the result, and the "
           "exact version of the material that was taught. Change any of them "
           "and verification fails.\n\n"
           "PRIVACY. The public page answers exactly one question — was this "
           "certificate really issued — and nothing more.\n\n"
           "HONESTY WORTH STATING. Issuance and verification work, and have "
           "been proved on one complete learning journey. The learner's own "
           "certificate view is still being built. Safe wording: 'certificates "
           "issued by the school appear here'.\n\n"
           "DO NOT. Do not promise automatic issuance the moment someone "
           "qualifies.\n\n"
           "TRANSITION. “None of this helps unless people know how to use "
           "it.”",
    ),
),

dict(
    key="tour", layout="flow", compact=True,
    eyebrow=L("Rancangan pengalaman", "Experience design"),
    title=L("Pengenalan pertama: tujuh hal yang paling akan dipakai.",
            "First-login introduction: the seven things this person uses most."),
    lede=L("Tujuh langkah singkat, sesuai peran, bisa diputar ulang kapan saja "
           "dari Bantuan.",
           "Seven short steps, matched to the role, replayable at any time from "
           "Help."),
    steps=[
        dict(label=L("DI MANA SAYA", "WHERE AM I")),
        dict(label=L("APA YANG PERLU DIKERJAKAN", "WHAT NEEDS DOING")),
        dict(label=L("MEMBUKA MATERI", "OPENING MATERIAL")),
        dict(label=L("MENGERJAKAN ASESMEN", "TAKING AN ASSESSMENT")),
        dict(label=L("MEMBACA HASIL", "READING THE RESULT")),
        dict(label=L("SERTIFIKAT", "CERTIFICATES")),
        dict(label=L("BANTUAN", "HELP")),
    ],
    band=L("Tujuh hal yang paling akan dipakai orang ini — bukan tujuh hal yang "
           "paling ingin kami tunjukkan.",
           "The seven things this person will use most — not the seven things "
           "we would most like to show."),
    band_tone="primary",
    prov=PROV_DESIGN,
    notes=dict(
        id="TUJUAN. Menunjukkan bahwa PINTAR tidak berharap orang memahami "
           "antarmuka dengan cara mencoba-coba.\n\n"
           "INTI. Pengenalan ini adalah peta mental, bukan pelatihan. Tujuh "
           "langkah, menyesuaikan peran, berhenti di luar pekerjaan yang sedang "
           "berjalan, dan selalu bisa dibuka lagi dari Bantuan.\n\n"
           "UNTUK MANAJEMEN. Ini menjawab pertanyaan 'seperti apa rasanya "
           "penerapannya': tidak setiap orang perlu pelatihan panjang untuk "
           "memulai.\n\n"
           "JANGAN. Jangan menghabiskan waktu pada arsitektur pengenalan ini. "
           "Satu slide cukup. Sebutkan bahwa ini rancangan yang sudah "
           "disetujui, bukan layar yang sudah berjalan pada versi ini.\n\n"
           "TRANSISI. “Kalau Anda ingin memeriksanya sendiri, itu bisa "
           "dilakukan.”",
        en="PURPOSE. Show that PINTAR does not expect people to learn the "
           "interface by trial and error.\n\n"
           "THE POINT. This introduction is a mental map, not training. Seven "
           "steps, matched to the role, staying out of work in progress, and "
           "always reopenable from Help.\n\n"
           "FOR MANAGEMENT. This answers 'what does implementation feel like': "
           "not everyone needs long training to begin.\n\n"
           "DO NOT. Do not spend time on the architecture of the tour. One "
           "slide is enough. Say that this is approved design, not a running "
           "screen in this version.\n\n"
           "TRANSITION. “If you want to check it yourself, that is "
           "possible.”",
    ),
),

dict(
    key="peragaan", layout="columns",
    eyebrow=ACT4,
    title=L("Melihat sendiri, dari lima sudut pandang.",
            "See it yourself, from five perspectives."),
    lede=L("Satu sekolah peragaan, satu perjalanan belajar yang sama, dilihat "
           "berurutan dari lima peran.",
           "One demonstration school, one and the same learning journey, seen in "
           "turn from five roles."),
    columns=[
        dict(tone="primary", label=P("MURID"),
             heading=L("Apa yang perlu saya kerjakan?",
                       "What do I need to do?")),
        dict(tone="quiet", label=P("GURU"),
             heading=L("Apa yang layak dikerjakan lebih dulu?",
                       "What is worth doing first?")),
        dict(tone="quiet", label=P("PENELAAH & PENERBIT"),
             heading=L("Apakah materi ini siap?", "Is this material ready?")),
        dict(tone="quiet", label=P("PIMPINAN SEKOLAH"),
             heading=L("Apa yang terlihat di tingkat sekolah?",
                       "What is visible at school level?")),
        dict(tone="quiet", label=P("ADMINISTRATOR SEKOLAH"),
             heading=L("Siapa boleh melakukan apa?", "Who may do what?")),
    ],
    band=L("Perpindahan sudut pandang tercatat: bukan hanya wewenang siapa yang "
           "dipakai, tetapi juga siapa yang melakukannya.",
           "Switching perspective is recorded: not only whose authority was "
           "used, but also who used it."),
    band_tone="well",
    notes=dict(
        id="TUJUAN. Mengubah paparan menjadi undangan. Manajemen tidak perlu "
           "memercayai slide; mereka bisa menelusurinya sendiri.\n\n"
           "INTI. Sekolah peragaan berisi satu perjalanan belajar yang utuh. "
           "Baris data yang dikerjakan murid adalah baris yang sama yang "
           "ditinjau guru dan terlihat di tingkat sekolah. Bukan lima contoh "
           "yang terpisah.\n\n"
           "MENGAPA PENTING BAGI TATA KELOLA. Ketika seseorang melihat sebagai "
           "peran lain, catatan audit menyimpan dua hal: wewenang siapa yang "
           "dipakai, dan siapa orang yang sebenarnya melakukan. Peragaan tidak "
           "pernah menjadi cara untuk menyembunyikan diri.\n\n"
           "PERAN KEENAM TIDAK ADA. Sudut pandang admin platform sengaja tidak "
           "disediakan.\n\n"
           "CATATAN BAHASA. Label lima peran itu label produk dalam bahasa "
           "Indonesia; pada edisi berbahasa Inggris label tersebut tetap "
           "ditulis apa adanya.\n\n"
           "TRANSISI. “Lalu apa yang berikutnya akan dilihat pendidik dan "
           "manajemen?”",
        en="PURPOSE. Turn the presentation into an invitation. Management does "
           "not have to believe a slide; they can walk it themselves.\n\n"
           "THE POINT. The demonstration school holds one complete learning "
           "journey. The rows the student produced are the same rows the "
           "teacher reviews and the school level sees. Not five separate "
           "samples.\n\n"
           "WHY THIS MATTERS FOR GOVERNANCE. When someone views as another "
           "role, the audit trail keeps two things: whose authority was used, "
           "and who actually acted. A demonstration is never a way to "
           "disappear.\n\n"
           "THERE IS NO SIXTH ROLE. A platform-administrator perspective is "
           "deliberately not offered.\n\n"
           "LANGUAGE NOTE. The five labels are the product's own Indonesian "
           "ones — Murid (learner), Guru (teacher), Penelaah & Penerbit "
           "(reviewer and publisher), Pimpinan Sekolah (school leadership), "
           "Administrator Sekolah (school administrator).\n\n"
           "TRANSITION. “So what will educators and management see "
           "next?”",
    ),
),

dict(
    key="direction", layout="columns",
    eyebrow=L("Arah pengalaman", "Experience direction"),
    title=L("Yang berikutnya akan dilihat pendidik dan manajemen.",
            "What educators and management will see next."),
    lede=L("Bagian ini rancangan, bukan layar yang sudah berjalan.",
           "This section is design, not a running screen."),
    columns=[
        dict(tone="quiet", label=L("KEMAJUAN KELAS", "CLASS PROGRESS"),
             heading=L("Apa yang sudah didukung bukti — dan di mana buktinya "
                       "belum cukup.",
                       "What the evidence supports — and where it is not yet "
                       "enough.")),
        dict(tone="quiet", label=L("RINGKASAN YANG BISA DIBACA", "A READABLE BRIEFING"),
             heading=L("Temuan, siapa yang terdampak, tindakan yang disarankan.",
                       "The finding, who it affects, the suggested action.")),
        dict(tone="quiet", label=L("GAMBARAN INSTITUSI", "THE INSTITUTIONAL VIEW"),
             heading=L("Pola lintas kelas, dengan arti angka yang sama di "
                       "seluruh sekolah.",
                       "Patterns across classes, every number meaning the same "
                       "thing school-wide.")),
    ],
    band=L("Arti sebuah ukuran ditetapkan PINTAR, tidak diubah per sekolah. "
           "Sekolah memilih apa yang ditampilkan dan bagaimana menampilkannya.",
           "What a measure means is defined by PINTAR, not redefined school by "
           "school. A school chooses what is shown and how."),
    band_tone="well",
    prov=PROV_DIRECTION,
    notes=dict(
        id="TUJUAN. Memberi manajemen gambaran nilai ke depan tanpa menunjukkan "
           "dasbor yang belum ada.\n\n"
           "INTI. Tiga hal: kemajuan kelas, ringkasan yang bisa dibaca, dan "
           "gambaran institusi. Semuanya dibangun di atas bukti yang sudah "
           "dijelaskan sebelumnya — jadi keadaan 'belum cukup bukti' ikut "
           "tampil, bukan disembunyikan.\n\n"
           "KATAKAN DENGAN JELAS bahwa bagian ini belum dibangun pada versi "
           "yang ditinjau. Jangan menampilkan tangkapan layar manajemen; "
           "memang tidak ada.\n\n"
           "PITA DI BAWAH menjawab pertanyaan yang hampir selalu muncul dari "
           "yayasan: bisakah setiap sekolah mengubah rumus laporannya. "
           "Jawabannya tidak — yang bisa diubah adalah pilihan, urutan, dan "
           "tampilannya.\n\n"
           "TRANSISI. “Barulah di sini AI layak dibicarakan.”",
        en="PURPOSE. Give management the forward value without showing a "
           "dashboard that does not exist.\n\n"
           "THE POINT. Three things: class progress, a readable briefing, and "
           "the institutional view. All are built on the evidence model "
           "explained earlier — so the 'not yet enough evidence' state appears "
           "too, rather than being hidden.\n\n"
           "SAY PLAINLY that this section is not built in the version under "
           "review. Do not show a management screenshot; there is none.\n\n"
           "THE BAND answers the question foundations almost always ask: can "
           "each school change how its report is calculated. The answer is no — "
           "what a school changes is the selection, the order and the "
           "presentation.\n\n"
           "TRANSITION. “Only now is it worth talking about AI.”",
    ),
),

dict(
    key="ai", layout="flow",
    eyebrow=L("AI di PINTAR", "AI in PINTAR"),
    title=L("AI membantu menafsirkan. Manusia tetap memutuskan.",
            "AI helps interpret. People still decide."),
    steps=[
        dict(label=L("BUKTI", "EVIDENCE"),
             body=L("Apa yang benar-benar terjadi.",
                    "What actually happened.")),
        dict(label=L("POLA", "PATTERN"),
             body=L("Apa yang berulang.", "What recurs.")),
        dict(label=L("TAFSIRAN", "INTERPRETATION"),
             body=L("Kemungkinan artinya.", "What it might mean.")),
        dict(label=L("TINDAKAN", "ACTION"),
             body=L("Kemungkinan tindak lanjutnya.",
                    "What could be done next.")),
        dict(label=L("KEPUTUSAN MANUSIA", "HUMAN DECISION"), strong=True,
             body=L("Yang ini tidak pernah digantikan.",
                    "This one is never replaced.")),
    ],
    band=L("Setiap usulan harus bertahan terhadap satu pertanyaan: mengapa? "
           "PINTAR harus dapat menunjukkan bukti yang dipakai, tafsirannya, dan "
           "apa yang masih belum pasti.",
           "Every suggestion must survive one question: why? PINTAR must be able "
           "to show the evidence it used, how it read that evidence, and what "
           "remains uncertain."),
    band_tone="primary",
    footnote=L("AI mengusulkan. PINTAR memeriksa. Manusia yang mengatur. Tidak "
               "ada materi yang dapat diterbitkan atau ditugaskan oleh AI, dan "
               "bantuan untuk peserta didik disusun tanpa akses ke kunci jawaban.",
               "AI proposes. PINTAR validates. Humans govern. No AI can publish "
               "content or assign it to learners, and learner-facing help is "
               "produced with no access to answer keys."),
    notes=dict(
        id="TUJUAN. Menempatkan AI pada tempatnya — sesudah hadirin paham cara "
           "PINTAR memperlakukan bukti, bukan sebelumnya.\n\n"
           "INTI. AI berguna untuk merapikan informasi, melihat pola, menyoroti "
           "yang layak diperhatikan, menjelaskan mengapa sesuatu ditampilkan, "
           "dan mengusulkan kemungkinan tindakan. Anak panah terakhir adalah "
           "keputusan manusia, dan panah itu tidak pernah digantikan.\n\n"
           "UJI 'MENGAPA'. Kalau sebuah usulan tidak dapat menjelaskan bukti "
           "yang dipakainya, usulan itu tidak layak dipakai. Ini standar yang "
           "boleh dituntut hadirin dari kami.\n\n"
           "BATAS TEKNIS YANG LAYAK DISEBUT. Bantuan untuk peserta didik "
           "disusun di ruang yang memang tidak memiliki kunci jawaban. "
           "Pengamanannya adalah batas data, bukan instruksi kepada model.\n\n"
           "JANGAN. Jangan menggambarkan AI sebagai pengambil keputusan, "
           "pengganti guru, atau peramal kemampuan seseorang.\n\n"
           "TRANSISI. “Jadi apa yang sebenarnya berubah?”",
        en="PURPOSE. Put AI in its place — after the room understands how "
           "PINTAR treats evidence, not before.\n\n"
           "THE POINT. AI is useful for organising information, spotting "
           "patterns, highlighting what deserves attention, explaining why "
           "something surfaced, and suggesting possible actions. The final "
           "arrow is the human decision, and that arrow is never replaced.\n\n"
           "THE 'WHY' TEST. If a suggestion cannot account for the evidence it "
           "used, it is not fit to act on. That is a standard the room is "
           "entitled to hold us to.\n\n"
           "A TECHNICAL BOUNDARY WORTH NAMING. Learner-facing help is produced "
           "in a context that structurally does not hold answer keys. The "
           "control is a data boundary, not an instruction to a model.\n\n"
           "DO NOT. Do not portray AI as a decision maker, a teacher "
           "replacement, or a predictor of a learner's ability.\n\n"
           "TRANSITION. “So what actually changes?”",
    ),
),

dict(
    key="changes", layout="columns",
    eyebrow=ACT4,
    title=L("Apa yang berubah", "What changes"),
    columns=[
        dict(tone="primary", label=L("PESERTA DIDIK", "THE LEARNER"),
             heading=L("Tahu apa yang perlu dikerjakan sekarang.",
                       "Knows what to do now."),
             lines=[
                 L("Melihat kemajuannya sendiri, bukan peringkatnya.",
                   "Sees their own progress, not a rank."),
                 L("Tidak pernah menemui jalan buntu.",
                   "Never meets a dead end."),
             ]),
        dict(tone="primary", label=L("PENDIDIK", "THE EDUCATOR"),
             heading=L("Tahu apa yang paling layak dikerjakan lebih dulu.",
                       "Knows what is most worth doing first."),
             lines=[
                 L("Membuka asesmen sendiri, dalam hitungan menit.",
                   "Opens an assessment unaided, in minutes."),
                 L("Menerima bukti untuk ditafsirkan, bukan vonis.",
                   "Receives evidence to interpret, not a verdict."),
             ]),
        dict(tone="primary", label=L("MANAJEMEN", "MANAGEMENT"),
             heading=L("Gambaran yang sama, dengan arti angka yang sama.",
                       "One picture, every number meaning the same thing."),
             lines=[
                 L("Tahu di mana perhatian diperlukan, dan di mana buktinya "
                   "belum cukup.",
                   "Knows where attention is needed, and where evidence is not "
                   "yet enough."),
                 L("Tanggung jawab tetap pada manusia.",
                   "Responsibility stays with people."),
             ]),
    ],
    band=L("PINTAR tidak menggantikan pendidik. PINTAR mengurangi pekerjaan "
           "yang tidak perlu, agar waktu pendidik kembali ke hal yang hanya "
           "bisa dilakukan manusia.",
           "PINTAR does not automate the educator. It removes unnecessary "
           "workload, so an educator's time goes back to what only a person can "
           "do."),
    band_tone="primary",
    notes=dict(
        id="TUJUAN. Merangkum seluruh paparan dalam satu gambar yang bisa "
           "difoto hadirin.\n\n"
           "INTI. Perhatikan urutannya: peserta didik dulu, lalu pendidik, baru "
           "manajemen. Nilai bagi institusi datang dari pengalaman yang lebih "
           "baik, bukan sebaliknya.\n\n"
           "KALIMAT PENUTUP DI BAWAH adalah janji yang paling ingin didengar "
           "pendidik, dan janji yang paling harus kita pegang.\n\n"
           "JANGAN. Jangan menambahkan kemampuan manajemen yang belum "
           "dibangun; kolom ketiga sengaja ditulis sebagai nilai, bukan sebagai "
           "daftar layar.\n\n"
           "TRANSISI. “Satu kalimat terakhir.”",
        en="PURPOSE. Compress the whole deck into one picture the room can "
           "photograph.\n\n"
           "THE POINT. Note the order: learner first, then educator, then "
           "management. Institutional value comes out of a better experience, "
           "not the other way round.\n\n"
           "THE CLOSING LINE below is the promise educators most want to hear, "
           "and the one we most have to keep.\n\n"
           "DO NOT. Do not add management capabilities that are not built; the "
           "third column is deliberately written as value, not as a list of "
           "screens.\n\n"
           "TRANSITION. “One last sentence.”",
    ),
),

dict(
    key="closing", layout="closing",
    statement=L("Teknologi membantu kita melihat lebih jelas.\nKeputusan tetap "
                "milik manusia.",
                "Technology helps us see more clearly.\nThe decision remains "
                "ours."),
    sub=L("Tenang di permukaan. Rigor di baliknya.",
          "Calm on the surface. Rigorous underneath."),
    notes=dict(
        id="TUJUAN. Menutup dengan doktrin, bukan dengan daftar kemampuan.\n\n"
           "CARA MENUTUP. Bacakan pelan, lalu berhenti. Jangan menambahkan "
           "ringkasan fitur sesudahnya.\n\n"
           "KALAU DIMINTA LANGKAH BERIKUTNYA. Tawarkan penelusuran langsung di "
           "sekolah peragaan, dari lima sudut pandang — ajakan yang jujur dan "
           "bisa dipenuhi hari ini.\n\n"
           "JANGAN. Jangan menutup dengan janji tanggal, dengan klaim siap "
           "produksi, atau dengan kemampuan yang ada di lampiran arah ke depan.",
        en="PURPOSE. Close on the doctrine, not on a list of capabilities.\n\n"
           "HOW TO CLOSE. Read it slowly, then stop. Do not add a feature "
           "summary afterwards.\n\n"
           "IF ASKED FOR NEXT STEPS. Offer a live walkthrough of the "
           "demonstration school, from the five perspectives — an honest "
           "invitation, and one we can meet today.\n\n"
           "DO NOT. Do not close with a date, with a production-readiness "
           "claim, or with anything from the future-direction appendix.",
    ),
),

# ===========================================================================
# APPENDIX
# ===========================================================================
dict(
    key="ap-terms", layout="table",
    eyebrow=APPX,
    title=L("Istilah PINTAR", "PINTAR terminology"),
    rows=[
        ["Pemetaan Awal", "Initial Mapping",
         L("Menemukan dari mana belajar dimulai. Bukan ujian.",
           "Finding where learning should begin. Not an exam.")],
        ["Peta Bacaan", "Reading Map",
         L("Urutan bacaan yang disusun untuk satu orang.",
           "A reading order built for one person.")],
        ["Pelajaran", "Lessons",
         L("Materi yang dipelajari, dengan contoh bertahap.",
           "The material itself, with staged worked examples.")],
        ["Uji Penguasaan", "Mastery Check",
         L("Asesmen sesudah belajar. Waktu berjalan.",
           "The assessment after learning. Time counts up.")],
        ["Hasil", "Results",
         L("Apa yang didukung bukti, dibanding diri sendiri.",
           "What the evidence supports, compared with oneself.")],
        ["Uji Cepat", "Quick Assessment",
         L("Asesmen singkat yang dibuka pendidik untuk kelasnya.",
           "A short assessment an educator opens for their class.")],
        ["Sertifikat", "Certificates",
         L("Bukti penyelesaian yang bisa diverifikasi publik.",
           "Completion evidence anyone can verify publicly.")],
        ["Bantuan", "Help",
         L("Panduan yang bisa dibuka kapan saja.",
           "Guidance openable at any time.")],
        ["Belum cukup bukti", "Not yet enough evidence",
         L("Keadaan sah: belum ada dasar untuk menyimpulkan.",
           "A valid state: no sufficient basis to conclude yet.")],
    ],
    band=L("Rumusan lama “Kuis Cepat” dan “Mastery Test” "
           "tidak dipakai lagi dalam bahasa paparan.",
           "The older wordings “Kuis Cepat” and “Mastery "
           "Test” are no longer used in presentation language."),
    band_tone="well",
    notes=dict(
        id="Lampiran rujukan. Tidak perlu dipaparkan; buka hanya bila ada "
           "pertanyaan istilah.\n\n"
           "CATATAN UNTUK PEMAPAR. Pada satu layar Studio yang sudah terpasang, "
           "label yang tertulis masih “Kuis Cepat”. Istilah resmi "
           "adalah Uji Cepat; perbedaan ini sudah dicatat sebagai hal yang "
           "perlu diselaraskan. Begitu juga “Peta Bacaan Personal” "
           "pada layar peserta didik — istilah paparan adalah Peta Bacaan.",
        en="Reference appendix. Not meant to be presented; open it only if a "
           "terminology question comes up.\n\n"
           "PRESENTER NOTE. On one built Studio screen the label still reads "
           "“Kuis Cepat”. The canonical term is Uji Cepat / Quick "
           "Assessment; the divergence is recorded as something to align. The "
           "same applies to “Peta Bacaan Personal” on the learner "
           "screen — the presentation term is Peta Bacaan / Reading Map.",
    ),
),

dict(
    key="ap-reliability", layout="list",
    eyebrow=APPX,
    title=L("Bagaimana PINTAR menjaga keandalan",
            "How PINTAR keeps its information reliable"),
    lede=L("Enam hal yang dijaga sistem itu sendiri, bukan oleh kebiasaan kerja.",
           "Six things the system enforces itself, not by working habit."),
    items=[
        L("Kunci jawaban tidak pernah sampai ke perangkat peserta didik.",
          "Answer keys never reach a learner's device."),
        L("Petunjuk yang menyebut atau mempersempit ke jawaban benar ditolak.",
          "A hint naming or narrowing to the answer is rejected."),
        L("Nilai dihitung di server, lalu dihitung ulang saat sertifikat terbit.",
          "Scores are computed on the server, then recomputed at issuance."),
        L("Setelah materi dikunci, perbaikan menjadi salinan baru.",
          "Once material is locked, a correction becomes a new copy."),
        L("Bukti peragaan, pratinjau, dan pengujian tidak mencapai laporan atau "
          "sertifikat.",
          "Demonstration, preview and test evidence cannot reach reports or "
          "certificates."),
        L("Tindakan penting tercatat dalam jejak yang hanya dapat ditambah.",
          "Consequential actions go to an append-only trail."),
    ],
    notes=dict(
        id="Lampiran opsional, 3–4 menit. Berguna bila hadirin memiliki "
           "pengawas mutu, auditor, atau tim TI. Sampaikan sebagai sifat "
           "sistem, bukan sebagai penjelasan teknis: yang penting bukan caranya "
           "dijalankan, melainkan bahwa aturannya tidak bergantung pada "
           "seseorang yang ingat.",
        en="Optional appendix, 3–4 minutes. Useful when the room includes "
           "quality assurance, auditors or an IT team. Deliver it as properties "
           "of the system, not as a technical explanation: what matters is not "
           "how it is done but that the rule does not depend on somebody "
           "remembering.",
    ),
),

dict(
    key="ap-roles", layout="list",
    eyebrow=APPX,
    title=L("Peran dan lingkup", "Roles and scope"),
    lede=L("Setiap peran menjawab pertanyaan berbeda, dan melihat pekerjaan "
           "yang berbeda.",
           "Each role answers a different question, and sees different work."),
    items=[
        L("Peserta didik melihat apa yang ditugaskan kepadanya.",
          "A learner sees what has been assigned to them."),
        L("Pendidik bekerja pada kelas dalam lingkup mengajarnya.",
          "An educator works on classes in their teaching context."),
        L("Kepala departemen meninjau, menyetujui, dan mengunci materi.",
          "A head of department reviews, approves and locks material."),
        L("Admin sekolah menerbitkan materi dan mengatur peran.",
          "A school administrator publishes material and manages roles."),
        L("Pimpinan membaca; tidak menyusun dan tidak menyetujui materi.",
          "Leadership reads; it does not author or approve material."),
        L("Peragaan memindahkan sudut pandang, tidak menambah wewenang.",
          "A demonstration shifts the point of view, never adds authority."),
    ],
    band=L("Data yang terlihat, konteks yang dipilih, dan wewenang untuk "
           "bertindak adalah tiga hal yang berbeda.",
           "Visible account data, the selected context, and the authority to "
           "act are three different things."),
    band_tone="well",
    notes=dict(
        id="TUJUAN. Menjawab pertanyaan tata kelola: siapa boleh melakukan "
           "apa, dan bagaimana kami tahu.\n\n"
           "INTI. Setiap peran menjawab satu pertanyaan yang berbeda, dan "
           "karena itu melihat pekerjaan yang berbeda. Pimpinan membaca; "
           "pimpinan tidak menyusun dan tidak menyetujui materi — pemisahan itu "
           "disengaja, bukan keterbatasan.\n\n"
           "TEKANKAN BARIS TERAKHIR: data yang terlihat, konteks yang dipilih, "
           "dan wewenang bertindak adalah tiga hal berbeda. Pemisahan itulah "
           "yang membuat 'bisa melihat' tidak pernah berarti 'boleh "
           "mengubah'.\n\n"
           "JANGAN menjanjikan peran baru atau penyesuaian wewenang per sekolah "
           "di luar yang sudah ada.",
        en="PURPOSE. Answer the governance question: who may do what, and how "
           "do we know.\n\n"
           "THE POINT. Each role answers a different question and therefore "
           "sees different work. Leadership reads; it does not author and does "
           "not approve material — that separation is deliberate, not a "
           "limitation.\n\n"
           "STRESS THE LAST LINE: visible account data, the selected context "
           "and the authority to act are three different things. That "
           "separation is what keeps 'being able to see' from ever meaning "
           "'being allowed to change'.\n\n"
           "DO NOT promise new roles or per-school authority tuning beyond "
           "what exists.",
    ),
),

dict(
    key="ap-boundaries", layout="list",
    eyebrow=APPX,
    title=L("Batas yang kami akui hari ini",
            "The boundaries we acknowledge today"),
    lede=L("Disebutkan agar tidak ada yang disalahartikan sebagai janji.",
           "Stated so nothing here is mistaken for a promise."),
    items=[
        L("Inti PINTAR 4.0 lengkap. Kesiapan produksi belum dinyatakan.",
          "The core is complete. Production readiness is not declared."),
        L("Pengujian beban dan ketahanan belum selesai.",
          "Load and stress validation is not finished."),
        L("Validasi dengan pendidik dan peserta didik sungguhan masih di depan.",
          "Validation with real educators and learners is still ahead."),
        L("Sebagian pengalaman manajemen masih dikembangkan; tidak ada layar "
          "manajemen yang ditampilkan hari ini.",
          "Parts of the management experience are still being developed; no "
          "management screen is shown today."),
        L("Acuan akreditasi, masa simpan data, dan kebijakan perpindahan "
          "peserta didik masih terbuka.",
          "The accreditation framework, retention periods and the transfer "
          "policy remain open."),
        L("Beberapa pertanyaan rekayasa tersisa dan tercatat.",
          "Some engineering questions remain, and are recorded."),
    ],
    band=L("Paparan ini tidak menjanjikan apa pun di luar daftar di atas.",
           "This presentation promises nothing beyond the list above."),
    band_tone="attention",
    notes=dict(
        id="Lampiran penting. Bukalah bila ditanya kesiapan, atau bila hadirin "
           "adalah yayasan yang mempertimbangkan komitmen. Menyebutkan batas "
           "lebih dulu jauh lebih kuat daripada ditanyakan kemudian.\n\n"
           "JANGAN mengucapkan 'siap produksi', 'sudah teruji sepenuhnya', "
           "'platform lengkap', atau 'menjamin'.",
        en="An important appendix. Open it when readiness comes up, or when the "
           "room is a foundation weighing a commitment. Naming the boundaries "
           "first is far stronger than being asked about them later.\n\n"
           "DO NOT use the phrases 'production ready', 'fully tested', "
           "'complete platform' or 'guaranteed'.",
    ),
),

dict(
    key="ap-future", layout="list",
    eyebrow=L("Lampiran · Arah ke depan", "Appendix · Future direction"),
    title=L("Arah ke depan — bukan bagian dari yang dipaparkan hari ini.",
            "Future direction — not part of what is presented today."),
    lede=L("Semua di halaman ini di luar lingkup yang sudah dibangun.",
           "Everything here sits outside what has been built."),
    items=[
        L("Kalibrasi psikometrik dari bukti yang sah, setelah buktinya cukup.",
          "Psychometric calibration, once there is enough legitimate evidence."),
        L("Analisis kesehatan soal yang lebih dalam.",
          "Deeper question-health analysis."),
        L("Alur penanganan integritas yang dijalankan manusia.",
          "A human-run integrity case workflow."),
        L("Asesmen berbasis kertas.", "Paper-based assessment."),
        L("PINTAR Care — dukungan dan penanganan kasus.",
          "PINTAR Care — support and case handling."),
        L("Integrasi, masuk tunggal, dan berbagi materi antar-sekolah.",
          "Integrations, single sign-on, cross-institution content sharing."),
    ],
    band=L("Tidak ada satu pun di halaman ini yang dijanjikan tanggalnya.",
           "Nothing on this page carries a promised date."),
    band_tone="attention",
    notes=dict(
        id="TUJUAN. Memisahkan arah dari janji, dengan label yang tidak bisa "
           "disalahbaca.\n\n"
           "KAPAN DIBUKA. Sebaiknya tidak dibuka kecuali ditanya. Kalau dibuka, "
           "katakan sekali di awal: tidak ada satu pun di halaman ini yang "
           "sudah dibangun, dan tidak ada yang dijanjikan tanggalnya.\n\n"
           "KALAU DITANYA tentang kemampuan masa depan yang tidak ada di daftar "
           "ini, jawaban yang benar adalah bahwa hal itu belum menjadi "
           "keputusan produk \u2014 bukan mengarang jadwal.\n\n"
           "JANGAN menyebut apa pun di lampiran ini sebagai alasan untuk "
           "mengambil keputusan hari ini.",
        en="PURPOSE. Separate direction from promise, with a label that cannot "
           "be misread.\n\n"
           "WHEN TO OPEN IT. Better left closed unless asked. If you do open "
           "it, say once at the top: nothing on this page is built, and nothing "
           "on it carries a date.\n\n"
           "IF ASKED about a future capability that is not on this list, the "
           "correct answer is that it is not a product decision yet \u2014 "
           "never an invented timeline.\n\n"
           "DO NOT offer anything in this appendix as a reason to decide "
           "something today.",
    ),
),
]


# --------------------------------------------------------------------------
# The executive edition is a derived subset — never a second narrative.
# --------------------------------------------------------------------------
EXEC_KEYS = ["cover", "question", "idea", "cycle", "evidence", "belum",
             "certificate", "ai", "changes", "closing", "ap-boundaries"]
