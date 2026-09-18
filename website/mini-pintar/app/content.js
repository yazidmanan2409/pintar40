// Mini-PINTAR — the content bundle.
//
// AUTHORED FOR MINI-PINTAR. Never imported from any PINTAR item bank.
// ADR-0021, Security implications, makes that binding: this bundle contains
// its own answer key and any visitor may read it, which is acceptable for
// demonstration content and would breach INV-01 for product content. No
// identifier, stem, option, rationale or misconception code here exists in
// `items` / `item_options`.
//
// Source of truth for every string: M1-CONTENT-AND-INTERACTION.md §3, §4,
// §7, §11, as approved 2026-09-18 with the two ruled corrections applied.
// Changing a string here without changing it there is a defect; verify/
// audit.mjs cannot catch that one, so it is on whoever edits.

/** A two-language string. Both sides authored; neither generated. */
export const L = (id, en) => ({ id, en });

// ---------------------------------------------------------------- domains

export const DOMAINS = [
  {
    key: "D1",
    name: L("Angka dan dasarnya", "A number and what it counts"),
    doctrine: L("Sebuah angka tidak pernah berdiri sendiri",
                "A number never stands alone"),
    severity: 1,
    lesson: "L-D1",
  },
  {
    key: "D2",
    name: L("Cukup atau belum", "Enough, or not yet"),
    doctrine: L("Belum cukup bukti", "Not yet enough evidence"),
    severity: 3,
    lesson: "L-D2",
  },
  {
    key: "D3",
    name: L("Berhubungan atau menyebabkan", "Linked, or causing"),
    doctrine: L("Pengamatan bukan penilaian", "Observation is not judgment"),
    severity: 2,
    lesson: "L-D3",
  },
];

export const DOMAIN = Object.fromEntries(DOMAINS.map((d) => [d.key, d]));

// -------------------------------------------------- Pemetaan Awal (stage MAP)
//
// Every option carries a rationale, correct ones included — the
// demonstration honours INV-03's principle that a distractor must teach,
// even though no invariant binds it.

export const MAP_ITEMS = [
  {
    id: "P1",
    domain: "D1",
    stem: L(
      'Sebuah laporan sekolah menulis: “85% siswa lulus ujian akhir.” Apa yang paling perlu Anda ketahui berikutnya agar angka itu bisa dibaca dengan adil?',
      'A school report says: “85% of students passed the final exam.” What do you most need to know next before that number can be read fairly?'),
    options: [
      {
        label: "A",
        correct: true,
        text: L("Berapa siswa yang mengikuti ujian itu.",
                "How many students sat the exam."),
        rationale: L(
          "Persentase adalah perbandingan. Tanpa tahu dibandingkan terhadap berapa, 85% bisa berarti 17 dari 20 — atau 850 dari 1.000.",
          "A percentage is a ratio. Without knowing what it is a ratio of, 85% could mean 17 of 20 — or 850 of 1,000."),
      },
      {
        label: "B",
        misconception: "M-D1-BANDING",
        text: L("Berapa persentasenya tahun lalu.",
                "What the percentage was last year."),
        rationale: L(
          "Membandingkan dua angka yang belum dipahami hanya menghasilkan dua angka yang belum dipahami.",
          "Comparing two numbers you do not yet understand leaves you with two numbers you do not yet understand."),
      },
      {
        label: "C",
        misconception: "M-D1-ATRIBUSI",
        text: L("Siapa yang mengajar kelas itu.", "Who taught the class."),
        rationale: L(
          "Mencari siapa yang bertanggung jawab sebelum tahu apa yang terjadi biasanya menemukan orang, bukan sebab.",
          "Looking for who is responsible before knowing what happened usually finds a person, not a cause."),
      },
      {
        label: "D",
        misconception: "M-D1-RINGKASAN",
        text: L("Berapa nilai rata-ratanya.", "What the average score was."),
        rationale: L(
          "Rata-rata juga sebuah ringkasan. Menukar satu ringkasan dengan ringkasan lain tidak menambah konteks.",
          "An average is also a summary. Trading one summary for another adds no context."),
      },
    ],
  },
  {
    id: "P2",
    domain: "D2",
    stem: L(
      "Sebuah kelas mencoba cara belajar baru selama satu minggu. Tiga siswa mencobanya, dan ketiganya membaik. Kesimpulan mana yang paling jujur?",
      "A class tries a new way of studying for one week. Three students try it, and all three improve. Which conclusion is the most honest?"),
    options: [
      {
        label: "A",
        misconception: "M-D2-SIMPUL",
        text: L("Cara itu berhasil.", "The method works."),
        rationale: L(
          "Tiga orang dalam satu minggu bisa membaik karena banyak hal. Buktinya belum memisahkan cara belajar dari hal-hal lain itu.",
          "Three people in one week can improve for many reasons. The evidence has not yet separated the method from those reasons."),
      },
      {
        label: "B",
        misconception: "M-D2-BALIK",
        text: L("Cara itu tidak berhasil.", "The method does not work."),
        rationale: L(
          "Membalik kesimpulan tidak menambah bukti. Keduanya sama-sama melampaui apa yang diketahui.",
          "Reversing a conclusion adds no evidence. Both go further than what is known."),
      },
      {
        label: "C",
        correct: true,
        text: L("Belum cukup bukti untuk menyimpulkan. Ini arah yang layak diamati lebih lama.",
                "Not yet enough evidence to conclude. It is a direction worth watching for longer."),
        rationale: L(
          "Mengatakan “belum” bukan menghindar. Itu menyebut dengan tepat apa yang belum ada: jumlah dan waktu.",
          "Saying “not yet” is not avoidance. It names precisely what is missing: numbers, and time."),
      },
      {
        label: "D",
        misconception: "M-D2-HIAS",
        text: L("Cara itu berhasil untuk siswa yang tekun.",
                "The method works for diligent students."),
        rationale: L(
          "Menambahkan syarat membuat kesimpulan terdengar lebih hati-hati, padahal bukti di belakangnya tidak bertambah.",
          "Adding a condition makes a conclusion sound more careful while the evidence behind it stays exactly the same."),
      },
    ],
  },
  {
    id: "P3",
    domain: "D3",
    stem: L(
      "Di sebuah sekolah, siswa yang membawa bekal dari rumah cenderung punya nilai lebih tinggi. Mana yang paling tepat dikatakan tentang temuan ini?",
      "At one school, students who bring lunch from home tend to have higher grades. What is the most accurate thing to say about this finding?"),
    options: [
      {
        label: "A",
        misconception: "M-D3-SEBAB",
        text: L("Membawa bekal meningkatkan nilai.", "Bringing lunch raises grades."),
        rationale: L(
          "Dua hal yang muncul bersama belum tentu yang satu menyebabkan yang lain.",
          "Two things appearing together does not mean one produces the other."),
      },
      {
        label: "B",
        misconception: "M-D3-ARAH",
        text: L("Nilai yang tinggi membuat siswa membawa bekal.",
                "Higher grades cause students to bring lunch."),
        rationale: L(
          "Membalik arah sebab tetap sebuah klaim sebab. Buktinya sama-sama belum menunjukkannya.",
          "Reversing the direction is still a causal claim. The evidence shows neither one."),
      },
      {
        label: "C",
        correct: true,
        text: L("Keduanya berhubungan. Penyebabnya belum diketahui, dan bisa jadi hal ketiga.",
                "The two are linked. The cause is not known, and may be a third thing."),
        rationale: L(
          "Hubungannya nyata dan berguna. Yang belum ada adalah sebabnya — keadaan di rumah, misalnya, bisa memengaruhi keduanya sekaligus.",
          "The link is real and useful. What is missing is the cause — a home circumstance, for instance, could shape both at once."),
      },
      {
        label: "D",
        misconception: "M-D3-TOLAK",
        text: L("Temuan ini tidak berarti apa-apa.", "The finding means nothing."),
        rationale: L(
          "Bukti yang belum menunjukkan sebab tetap menunjukkan sesuatu. Membuangnya sama menyesatkannya dengan melebihkannya.",
          "Evidence that does not show a cause still shows something. Discarding it misleads as much as overstating it."),
      },
    ],
  },
];

// ------------------------------------------------- Peta Bacaan, nine reasons
//
// The card does not say "you got this wrong". It says what the visitor's
// answer suggests they were reaching for, and what the reading is about.

export const MAP_REASONS = {
  "M-D1-BANDING": L(
    "Jawaban Anda menuju perbandingan lebih dulu. Bacaan ini tentang memahami satu angka sebelum membandingkannya.",
    "Your answer reached for a comparison first. This reading is about understanding one number before comparing it."),
  "M-D1-ATRIBUSI": L(
    "Jawaban Anda menuju orangnya. Bacaan ini tentang membaca angkanya lebih dulu.",
    "Your answer reached for the people. This reading is about reading the number first."),
  "M-D1-RINGKASAN": L(
    "Jawaban Anda menukar satu ringkasan dengan ringkasan lain. Bacaan ini tentang apa yang ada di balik ringkasan.",
    "Your answer traded one summary for another. This reading is about what sits behind a summary."),
  "M-D2-SIMPUL": L(
    "Jawaban Anda mengambil kesimpulan dari bukti yang masih sedikit. Bacaan ini tentang kapan sebuah kesimpulan boleh diambil.",
    "Your answer drew a conclusion from thin evidence. This reading is about when a conclusion may be drawn."),
  "M-D2-BALIK": L(
    "Jawaban Anda membalik kesimpulannya. Bacaan ini tentang mengapa keduanya sama-sama melampaui buktinya.",
    "Your answer reversed the conclusion. This reading is about why both go past the evidence."),
  "M-D2-HIAS": L(
    "Jawaban Anda menambahkan syarat pada kesimpulan. Bacaan ini tentang kapan sebuah kesimpulan boleh diambil.",
    "Your answer added a condition to the conclusion. This reading is about when a conclusion may be drawn."),
  "M-D3-SEBAB": L(
    "Jawaban Anda membaca hubungan sebagai sebab. Bacaan ini tentang jarak antara keduanya.",
    "Your answer read a link as a cause. This reading is about the distance between the two."),
  "M-D3-ARAH": L(
    "Jawaban Anda membalik arah sebabnya. Bacaan ini tentang apa yang dibutuhkan sebuah klaim sebab.",
    "Your answer reversed the direction of cause. This reading is about what a causal claim requires."),
  "M-D3-TOLAK": L(
    "Jawaban Anda membuang temuannya. Bacaan ini tentang apa yang masih ditunjukkan sebuah hubungan.",
    "Your answer discarded the finding. This reading is about what a link still shows."),
};

/** Reasons that are not misconception-specific. */
export const TIER_REASONS = {
  SKIPPED: L(
    "Anda melewati pertanyaan ini. Bacaan ini tetap disiapkan, karena melewatinya juga memberi tahu sesuatu.",
    "You skipped this one. The reading is offered anyway, because skipping tells us something too."),
  SUDAH_TEPAT: L(
    "Bagian ini tidak perlu dibaca lebih dulu. Kartunya tetap ditampilkan agar urutannya terlihat utuh.",
    "This part does not need reading first. The card is still shown so the whole order stays visible."),
  DISARANKAN: L(
    "Tidak ada yang perlu diperbaiki lebih dulu. Ini bacaan yang memperdalam.",
    "Nothing needs repairing first. This reading goes deeper."),
};

/**
 * Tier labels. The third tier describes the OBSERVED ANSWER and never
 * inferred mastery — ruled 2026-09-18, replacing "Sudah Anda kuasai /
 * Already yours", which claimed mastery from a single answer.
 */
export const TIER_LABELS = {
  PERLU_SEGERA: L("Baca ini lebih dulu", "Read this first"),
  WAJIB: L("Perlu dibaca", "Needs reading"),
  DISARANKAN: L("Disarankan", "Suggested"),
  SUDAH_TEPAT: L("Jawaban Anda sudah tepat di bagian ini",
                 "Your answer here was already right"),
};

// ---------------------------------------------------------------- lessons

export const LESSONS = {
  "L-D2": {
    domain: "D2",
    title: L("Kapan sebuah kesimpulan boleh diambil",
             "When a conclusion may be drawn"),
    body: {
      id: [
        "Setiap kesimpulan berdiri di atas dua hal: berapa banyak yang diamati, dan berapa lama.",
        "Tiga siswa selama satu minggu memberi kita sesuatu, tetapi belum cukup untuk memisahkan cara belajar dari hal lain yang terjadi pada minggu yang sama. Ujian yang kebetulan lebih mudah, atau kebetulan biasa, bisa menghasilkan gambaran yang persis sama.",
        "Yang perlu berubah bukan jawabannya, melainkan kalimatnya. “Cara itu berhasil” adalah kesimpulan. “Ini arah yang layak diamati lebih lama” adalah pengamatan. Hanya yang kedua jujur hari ini.",
        "Menunda kesimpulan bukan sikap ragu-ragu. Itu cara menjaga agar kesimpulan berikutnya masih berarti.",
      ],
      en: [
        "Every conclusion rests on two things: how much was observed, and for how long.",
        "Three students over one week give us something, but not enough to separate the method from everything else that happened in the same week. An exam that happened to be easier, or ordinary chance, would produce the same picture.",
        "What has to change is not the answer but the sentence. “The method works” is a conclusion. “This is a direction worth watching for longer” is an observation. Only the second is honest today.",
        "Holding a conclusion back is not indecision. It is how you keep the next conclusion worth something.",
      ],
    },
    workedExample: {
      title: L("Berapa yang cukup?", "How much is enough?"),
      steps: [
        L("Tanyakan dulu: berapa banyak yang diamati? Tiga.",
          "Ask first: how many were observed? Three."),
        L("Lalu: berapa lama? Satu minggu.", "Then: for how long? One week."),
        L("Lalu: apa lagi yang berubah pada waktu yang sama, dan adakah kelompok serupa yang tidak mencobanya? Tanpa pembanding, buktinya belum memisahkan apa pun.",
          "Then: what else changed over the same period, and was there a similar group that did not try it? Without something to compare against, the evidence has not separated anything yet."),
      ],
    },
  },

  "L-D3": {
    domain: "D3",
    title: L("Berhubungan, atau menyebabkan", "Linked, or causing"),
    body: {
      id: [
        "Dua hal yang bergerak bersama disebut berhubungan. Itu temuan yang nyata dan sering berguna.",
        "Sebab adalah klaim yang jauh lebih besar. Untuk mengatakan A menyebabkan B, kita perlu menyingkirkan dua kemungkinan lain: bahwa B yang menyebabkan A, dan bahwa ada hal ketiga yang menggerakkan keduanya.",
        "Pada contoh bekal dan nilai, hal ketiga itu mudah dibayangkan — keadaan di rumah bisa memengaruhi keduanya. Selama itu belum diperiksa, kata yang tepat adalah “berhubungan”, bukan “menyebabkan”.",
        "Yang juga keliru adalah membuang temuannya. Hubungan yang belum dijelaskan tetap menunjukkan ke mana harus melihat berikutnya.",
      ],
      en: [
        "Two things that move together are linked. That is a real finding and often a useful one.",
        "Cause is a far larger claim. To say A causes B, two other possibilities have to be ruled out: that B causes A, and that some third thing moves both.",
        "In the lunch-and-grades example the third thing is easy to imagine — a home circumstance could shape both. Until that has been examined, the accurate word is “linked”, not “causes”.",
        "Discarding the finding is the opposite error. A link you cannot yet explain still shows you where to look next.",
      ],
    },
    workedExample: {
      title: L("Menguji sebuah klaim sebab", "Testing a causal claim"),
      steps: [
        L("Sebutkan klaimnya: membawa bekal meningkatkan nilai.",
          "State the claim: bringing lunch raises grades."),
        L("Balik arahnya: mungkinkah nilai yang tinggi membuat siswa membawa bekal? Jika belum bisa disingkirkan, klaimnya belum berdiri.",
          "Reverse it: could higher grades be what leads students to bring lunch? If you cannot rule that out, the claim is not standing yet."),
        L("Cari hal ketiga: adakah sesuatu yang memengaruhi keduanya? Jika ada, klaim sebab belum boleh diambil.",
          "Look for a third thing: is there something shaping both? If there is, the causal claim cannot be made yet."),
      ],
    },
  },

  "L-D1": {
    domain: "D1",
    title: L("Sebuah angka dan dasarnya", "A number and what it counts"),
    body: {
      id: [
        "Persentase adalah perbandingan, dan sebuah perbandingan belum lengkap tanpa apa yang dibandingkan.",
        "“85% lulus” bisa berarti 17 dari 20 siswa, atau 850 dari 1.000. Keduanya ditulis 85%, dan masing-masing menuntut tanggapan yang berbeda. Pada 20 siswa, tiga orang yang belum lulus adalah tiga nama yang bisa didampingi minggu depan. Pada 1.000 siswa, 150 orang adalah persoalan dengan bentuk yang lain.",
        "Karena itu pertanyaan pertama untuk setiap persentase selalu sama: dari berapa?",
        "Pertanyaan kedua hampir sama pentingnya: siapa yang tidak ikut dihitung?",
      ],
      en: [
        "A percentage is a ratio, and a ratio is not complete without what it is a ratio of.",
        "“85% passed” can mean 17 students out of 20, or 850 out of 1,000. Both are written 85%, and each asks for a different response. At 20 students, three who have not passed are three names you can sit with next week. At 1,000, a hundred and fifty is a problem of a different shape.",
        "So the first question for any percentage is always the same: out of how many?",
        "The second matters nearly as much: who was left out of the count?",
      ],
    },
    workedExample: {
      title: L("Membaca 85%", "Reading 85%"),
      steps: [
        L("Tulis ulang sebagai pecahan: 85 dari 100.",
          "Rewrite it as a fraction: 85 out of 100."),
        L("Ganti dasarnya: 85% dari 20 siswa adalah 17 orang; 85% dari 1.000 adalah 850 orang.",
          "Change the base: 85% of 20 students is 17 people; 85% of 1,000 is 850."),
        L("Tanyakan siapa yang tidak masuk hitungan — misalnya siswa yang tidak hadir saat ujian.",
          "Ask who is outside the count — the students who were absent on the day, for instance."),
      ],
    },
  },
};

// ------------------------------------------------ Uji Penguasaan (stage CHECK)
//
// Six items, DISJOINT from the Pemetaan Awal set. No item appears in both,
// so no "improvement" can be an artefact of having seen the question
// already. The visitor answers the two belonging to the lesson they read.
//
// DEBT, carried to the handoff and not papered over: §2's content model
// says a rationale is required on every option, and §3.5 — the approved
// content — supplies none for these twenty-four. Nothing in the designed
// Hasil displays one, so no rationale is invented here. verify/audit.mjs
// asserts the field is ABSENT rather than empty, so the gap stays visible.

export const CHECK_ITEMS = {
  D2: [
    {
      id: "U-D2-1",
      stem: L(
        "Sebuah program baru dicoba di dua kelas selama satu semester, dan hasilnya membaik. Mana yang paling menambah kekuatan buktinya?",
        "A new programme runs in two classes for a semester and results improve. Which of these adds the most to the strength of the evidence?"),
      options: [
        { label: "A", correct: true,
          text: L("Membandingkan dengan kelas serupa yang tidak mengikuti program.",
                  "Comparing with similar classes that did not take part.") },
        { label: "B",
          text: L("Menambah jumlah kelas yang mengikuti program.",
                  "Adding more classes to the programme.") },
        { label: "C",
          text: L("Memperpanjang program menjadi dua semester.",
                  "Extending the programme to two semesters.") },
        { label: "D",
          text: L("Mengumpulkan pendapat guru tentang program itu.",
                  "Gathering the teachers’ views on the programme.") },
      ],
    },
    {
      id: "U-D2-2",
      stem: L("Manakah kalimat yang paling tepat ketika buktinya masih sedikit?",
              "Which sentence is the most accurate when the evidence is still thin?"),
      options: [
        { label: "A", correct: true,
          text: L("“Kami belum bisa menyimpulkan, dan kami akan terus mengamati.”",
                  "“We cannot conclude yet, and we are continuing to watch.”") },
        { label: "B",
          text: L("“Sementara ini kami menyimpulkan program ini berhasil.”",
                  "“For now we conclude that the programme works.”") },
        { label: "C",
          text: L("“Kami tidak menemukan apa-apa.”", "“We found nothing.”") },
        { label: "D",
          text: L("“Program ini berhasil untuk sebagian siswa.”",
                  "“The programme works for some students.”") },
      ],
    },
  ],
  D3: [
    {
      id: "U-D3-1",
      stem: L(
        "Siswa yang mengikuti klub membaca cenderung punya nilai bahasa lebih tinggi. Sebelum mengatakan klub itu meningkatkan nilai, apa yang perlu diperiksa?",
        "Students in the reading club tend to have higher language grades. Before saying the club raises grades, what needs checking?"),
      options: [
        { label: "A", correct: true,
          text: L("Apakah siswa yang memang sudah suka membaca yang cenderung mendaftar.",
                  "Whether it is students who already like reading who tend to join.") },
        { label: "B", text: L("Berapa jumlah anggota klub.", "How many members the club has.") },
        { label: "C", text: L("Siapa yang mendirikan klub itu.", "Who founded the club.") },
        { label: "D", text: L("Apakah klub itu populer.", "Whether the club is popular.") },
      ],
    },
    {
      id: "U-D3-2",
      stem: L("Sebuah hubungan ditemukan, tetapi sebabnya belum jelas. Tindakan mana yang paling tepat?",
              "A link is found but its cause is not clear. Which action is most appropriate?"),
      options: [
        { label: "A", correct: true,
          text: L("Catat hubungannya, sebutkan bahwa sebabnya belum diketahui, dan rencanakan cara memeriksanya.",
                  "Record the link, say that the cause is not known, and plan how to examine it.") },
        { label: "B",
          text: L("Abaikan temuan itu sampai ada bukti sebab.",
                  "Set the finding aside until there is causal evidence.") },
        { label: "C",
          text: L("Umumkan hubungannya sebagai sebab, dengan catatan kecil.",
                  "Announce the link as a cause, with a small footnote.") },
        { label: "D",
          text: L("Cari data lain yang mendukung sebab yang sudah diduga.",
                  "Look for other data supporting the cause you already suspect.") },
      ],
    },
  ],
  D1: [
    {
      id: "U-D1-1",
      stem: L(
        "Dua sekolah sama-sama melaporkan kehadiran 90%. Sekolah A punya 100 siswa, sekolah B punya 1.000. Apa yang paling tepat dikatakan?",
        "Two schools both report 90% attendance. School A has 100 students, school B has 1,000. What is the most accurate thing to say?"),
      options: [
        { label: "A", correct: true,
          text: L("Jumlah siswa yang sering tidak hadir jauh berbeda, meskipun persentasenya sama.",
                  "The number of frequently absent students differs greatly, even though the percentage is identical.") },
        { label: "B",
          text: L("Kedua sekolah menghadapi persoalan yang sama besar.",
                  "Both schools face a problem of the same size.") },
        { label: "C",
          text: L("Sekolah B lebih berhasil karena siswanya lebih banyak.",
                  "School B is doing better because it has more students.") },
        { label: "D",
          text: L("Karena persentasenya sama, penanganannya boleh sama.",
                  "Because the percentage is the same, the response can be the same.") },
      ],
    },
    {
      id: "U-D1-2",
      stem: L(
        "Sebuah laporan menulis “70% peserta puas”. Manakah pertanyaan yang paling membantu membacanya?",
        "A report says “70% of participants were satisfied”. Which question helps most in reading it?"),
      options: [
        { label: "A", correct: true,
          text: L("Dari berapa peserta, dan siapa yang tidak menjawab.",
                  "Out of how many participants, and who did not reply.") },
        { label: "B", text: L("Apakah 70% termasuk tinggi.", "Whether 70% counts as high.") },
        { label: "C", text: L("Bagaimana cara menaikkannya.", "How to raise it.") },
        { label: "D", text: L("Apakah tahun lalu lebih tinggi.", "Whether last year was higher.") },
      ],
    },
  ],
};

// -------------------------------------------------------------- assistance
//
// Two levels, staged. Written so that neither could name or narrow to the
// correct option — the rule INV-02 enforces in the product with a DB CHECK,
// honoured here by authoring.

export const ASSISTANCE = {
  D1: {
    arah: L("Tanyakan apa yang ada di bawah persentase itu.",
            "Ask what sits underneath the percentage."),
    petunjuk: L(
      "Coba tulis ulang angkanya sebagai “sekian dari sekian”, lalu lihat mana yang belum Anda ketahui.",
      "Try rewriting it as “so many out of so many”, then see which part you do not have."),
  },
  D2: {
    arah: L("Tanyakan berapa banyak, dan berapa lama.",
            "Ask how many, and for how long."),
    petunjuk: L("Bayangkan apa lagi yang mungkin berubah pada waktu yang sama.",
                "Picture what else might have changed over the same period."),
  },
  D3: {
    arah: L("Tanyakan apakah ada kemungkinan lain selain yang disebutkan.",
            "Ask whether there is another possibility besides the one stated."),
    petunjuk: L("Coba balik arahnya, lalu cari sesuatu yang bisa memengaruhi keduanya.",
                "Try reversing the direction, then look for something that could shape both."),
  },
};

// ---------------------------------------------------------------- outcomes

/**
 * The evidence limit. Printed under EVERY outcome, KONSISTEN included —
 * especially KONSISTEN, because that is the outcome where the temptation to
 * stay quiet is greatest. ADR-0021 makes it the condition on which the
 * whole demonstration is permitted.
 */
export const EVIDENCE_LIMIT = L(
  "Ini cukup untuk satu bacaan kecil. Belum cukup untuk menilai penguasaan seseorang.",
  "Enough for one small reading. Not enough to judge anyone’s mastery.");

export const OUTCOMES = {
  KONSISTEN: {
    headline: L("Dua jawaban Anda sejalan dengan bacaan itu.",
                "Both your answers are consistent with the reading."),
    body: L("", ""),
  },
  BELUM_CUKUP: {
    headline: L("Belum cukup bukti.", "Not yet enough evidence."),
    body: L("Dua pertanyaan belum cukup untuk menyimpulkan penguasaan. Itu bukan kekurangan Anda — itu batas buktinya.",
            "Two questions are not enough to conclude anything about mastery. That is not a shortcoming in you — it is the limit of the evidence."),
  },
  PERLU_PERHATIAN: {
    headline: L("Ada bagian yang layak dibaca ulang.",
                "There is a part worth reading again."),
    body: L("Dua pertanyaan tadi belum tepat, dan itu menunjukkan bagian mana — bukan ukuran penguasaan Anda.",
            "Both answers were not yet right, and that shows you which part — not a measure of your mastery."),
  },
};

/** Where the product would show a delta, Mini-PINTAR shows a sentence. */
export const NO_DELTA = L(
  "Pemetaan Awal dan Uji Penguasaan menanyakan hal yang berbeda, jadi keduanya tidak dibandingkan.",
  "Initial Mapping and the Mastery Check ask about different things, so the two are not compared.");

// ------------------------------------------------------------------ reveal

export const REVEAL = {
  headline: L("Itu tadi PINTAR.", "That was PINTAR."),
  steps: [
    { step: L("Pemetaan Awal", "Initial Mapping"),
      note: L("Jawaban Anda bukan nilai. Jawaban Anda adalah bukti.",
              "Your answers were not a score. They were evidence.") },
    { step: L("Peta Bacaan", "Reading Map"),
      note: L("Urutannya berubah karena jawaban Anda. Ini urutan, bukan peringkat.",
              "The order changed because of your answers. It is an order, not a ranking.") },
    { step: L("Pelajaran", "Lesson"),
      note: L("Anda diberi satu langkah berikutnya, bukan seluruh buku.",
              "You were given one next step, not the whole book.") },
    { step: L("Uji Penguasaan", "Mastery Check"),
      note: L("Bantuan tersedia, dan tidak pernah menyebut jawabannya.",
              "Help was there, and never named the answer.") },
    { step: L("Hasil", "Result"),
      note: L("PINTAR menyebut apa yang didukung bukti, dan menyebut batasnya.",
              "PINTAR said what the evidence supports, and said where it ends.") },
  ],
  // R9. In both languages the verb PINTAR performs is menunjukkan / shows
  // and membantu / helps; the verb the human performs is memilih / choose.
  // The system never holds the deciding verb.
  closing: L(
    "PINTAR tidak sekadar memberi soal dan nilai. PINTAR menunjukkan apa yang didukung bukti saat ini, dan membantu Anda memilih langkah berikutnya.",
    "PINTAR does not simply hand out questions and a score. It shows what the evidence supports right now, and helps you choose what comes next."),
  // The second of exactly two honesty statements in the whole experience.
  honesty: L(
    "Yang barusan adalah miniatur publik: bukan asesmen resmi, tidak menghasilkan sertifikat, dan tidak meninggalkan catatan tentang Anda.",
    "What you just did is a public miniature: not an official assessment, it issues no certificate, and it leaves no record of you."),
  doors: [
    { label: L("Apa artinya bagi pendidik", "What this means for educators"), href: "/cara-kerja" },
    { label: L("Bagaimana PINTAR menjaga bukti", "How PINTAR protects evidence"), href: "/bukti" },
    { label: L("Bicara dengan kami", "Talk to us"), href: "/tentang#kontak" },
  ],
};

// ------------------------------------------------------------ chrome and UI

export const UI = {
  brand: L("mini-pintar", "mini-pintar"),
  exit: L("Keluar", "Exit"),
  // The first of exactly two honesty statements. Duration ruled 2026-09-18:
  // "sekitar tiga menit / about three minutes", never "dua menit".
  thresholdLede: L("Sekitar tiga menit.", "About three minutes."),
  thresholdSub: L("Tidak ada akun, tidak ada data yang disimpan.",
                  "No account, nothing kept about you."),
  thresholdReload: L("Jika halaman ini dimuat ulang, perjalanannya dimulai dari awal — karena memang tidak ada yang disimpan.",
                     "If this page is reloaded the journey starts again from the beginning — because nothing is kept."),
  start: L("Mulai", "Start"),

  stepMap: L("Pemetaan Awal", "Initial Mapping"),
  stepPeta: L("Peta Bacaan", "Reading Map"),
  stepLesson: L("Pelajaran", "Lesson"),
  stepCheck: L("Uji Penguasaan", "Mastery Check"),
  stepHasil: L("Hasil", "Result"),
  stepReveal: L("Itu tadi PINTAR", "That was PINTAR"),

  mapIntro: L("Ini bukan ujian. Jawaban Anda dipakai untuk menyusun urutan bacaan yang sesuai.",
              "This is not an exam. Your answers are used to build a reading order that suits you."),
  petaIntro: L("Mulailah dari kartu paling atas. Urutannya disusun dari jawaban Anda.",
               "Start with the top card. The order comes from your answers."),

  next: L("Berikutnya", "Next"),
  back: L("Kembali", "Back"),
  skip: L("Lewati", "Skip"),
  openLesson: L("Buka pelajarannya", "Open the lesson"),
  showStep: L("Tampilkan langkah berikutnya", "Show the next step"),
  toCheck: L("Lanjut ke Uji Penguasaan", "Continue to the Mastery Check"),
  seeResult: L("Lihat hasilnya", "See the result"),
  whatHappened: L("Apa yang baru saja terjadi", "What just happened"),
  restart: L("Ulangi", "Start again"),

  needDirection: L("Perlu arah?", "Need a direction?"),
  assistArah: L("Arah", "A direction"),
  assistPetunjuk: L("Petunjuk", "A first step"),
  assistMore: L("Satu langkah lagi", "One step further"),
  assistNote: L("Bantuan di PINTAR tidak pernah menyebut jawabannya.",
                "Help in PINTAR never names the answer."),

  workedExample: L("Contoh bertahap", "Worked example"),
  questionOf: (a, b) => L(`Pertanyaan ${a} dari ${b}`, `Question ${a} of ${b}`),
  stepAnnounce: (name, a, b) =>
    L(`${name.id}, pertanyaan ${a} dari ${b}`, `${name.en}, question ${a} of ${b}`),
  yourReading: L("Bacaan Anda", "Your reading"),
  progressText: (a, b) => L(`Langkah ${a} dari ${b}`, `Step ${a} of ${b}`),
  langLabel: L("Bahasa", "Language"),
  noscript: L(
    "Mini-PINTAR adalah pengalaman interaktif dan membutuhkan JavaScript. Tanpa JavaScript, tidak ada yang bisa ditampilkan selain halaman ini — tidak ada data yang dikirim ke mana pun, jadi tidak ada versi server yang bisa menggantikannya.",
    "Mini-PINTAR is an interactive experience and needs JavaScript. Without it there is nothing to show but this page — no data is sent anywhere, so there is no server-side version that could stand in for it."),
};
