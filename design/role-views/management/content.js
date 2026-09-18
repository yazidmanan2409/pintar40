// Management role view — "Apa yang perlu saya ketahui hari ini, dan apakah
// ada keputusan yang menunggu saya?" — and the bounded Umpan Balik
// Pembelajaran experience.
//
// A DESIGN SAMPLE. Every figure and name was written for review.
//
// Scope, stated before anything else (README has the full map):
//   · Management ROLES exist: HEAD_OF_DEPARTMENT, DEAN, INSTITUTION_ADMIN
//     in `app_role`, authorised through scoped role_assignments.
//   · A management SURFACE does not. `src/app/konfigurasi` assigns roles;
//     `src/app/studio` is the authoring home. Neither answers this question.
//   · "Dean Institutional Learning Intelligence" is BUILD NOW in doc 09 and
//     is NOT implemented — no metric catalogue, no report tables.
//   · UMPAN BALIK PEMBELAJARAN DOES NOT EXIST ANYWHERE. Not a table, not a
//     capability, not a string, and not on any of doc 09's lists — not
//     BUILD NOW, not LATER, not PARK. It is a new concept, and adopting it
//     is a product and architecture decision with an ADR, not a feature.
//
// Register: `Anda`, adult, institutional. Management vocabulary is allowed
// here in a way it is not on a parent's page, but PINTAR's internal words
// still are not.

export const L = (id, en) => ({ id, en });

export const SAMPLE = {
  label: L("CONTOH RANCANGAN", "DESIGN SAMPLE"),
  body: L(
    "Semua angka dan nama di halaman ini dibuat untuk ulasan. Umpan Balik Pembelajaran belum ada di PINTAR dan belum menjadi keputusan arsitektur.",
    "Every figure and name here was made for review. Umpan Balik Pembelajaran does not exist in PINTAR and is not a settled architecture decision."),
};

export const UI = {
  role: L("Pimpinan", "Management"),
  surface: L("PINTAR · Beranda", "PINTAR · Home"),
  langLabel: L("Bahasa", "Language"),
  screenLabel: L("Layar contoh", "Sample screen"),
  back: L("Kembali ke beranda", "Back to home"),
};

// The chain, in the same fixed order and the same words as the Educator
// view. One product, one grammar.
export const CHAIN = {
  supports: L("YANG DIDUKUNG BUKTI", "WHAT THE EVIDENCE SUPPORTS"),
  unknown: L("YANG BELUM DIKETAHUI", "WHAT IS NOT YET KNOWN"),
  step: L("LANGKAH YANG MUNGKIN", "A POSSIBLE NEXT STEP"),
  decision: L("KEPUTUSAN ANDA", "YOUR DECISION"),
};

// --------------------------------------------------------------- the home

export const HOME = {
  headline: L("Dua keputusan menunggu Anda.", "Two decisions are waiting for you."),
  bounding: L("Satu hal lain perlu Anda ketahui, dan tidak menunggu keputusan.",
              "One other thing is worth knowing, and waits on nothing."),
  suppression: L("Yang tidak memerlukan perhatian Anda tidak muncul di halaman ini.",
                 "What does not need your attention does not appear on this page."),
  order: L("Urutannya: yang menahan orang lain lebih dulu. Ini urutan, bukan peringkat.",
           "Ordered by what is holding someone else up. It is an order, not a ranking."),
  // The brief's words, kept.
  decides: L("PINTAR mengusulkan, manusia memutuskan.",
             "PINTAR proposes, a human decides."),
};

export const ITEMS = [
  {
    id: "umpan-balik",
    kind: L("Keputusan menunggu", "Decision waiting"),
    tone: "attention",
    subject: L("Umpan Balik Pembelajaran · Kelas 8A",
               "Learning Feedback · Class 8A"),
    since: L("ditutup kemarin", "closed yesterday"),
    happened: L(
      "Umpan Balik untuk Kelas 8A sudah ditutup. Dua puluh empat dari dua puluh delapan siswa menjawab.",
      "Feedback for Class 8A has closed. Twenty-four of twenty-eight students answered."),
    supports: L(
      "Tanggapan tentang kesempatan bertanya terbagi: sebagian besar menjawab sering atau hampir selalu, sebagian kecil menjawab jarang. Empat pertanyaan lain tidak terbagi.",
      "Responses about opportunities to ask questions are mixed: most answered often or almost always, a few answered rarely. The other four questions are not split."),
    // The boundary the brief names, in the place it has to be.
    unknown: L(
      "Mengapa terbagi. Tanggapan ini adalah pengalaman belajar yang dilaporkan siswa, bukan penilaian tentang pendidiknya.",
      "Why they are split. These are students’ reported experience of learning, not a judgement about the educator."),
    step: L(
      "Membicarakannya dengan pendidik, atau mengamati satu siklus lagi sebelum menyimpulkan apa pun.",
      "Discussing it with the educator, or observing another cycle before concluding anything."),
    actions: [
      L("Tinjau bersama pendidik", "Review with the educator"),
      L("Amati satu siklus lagi", "Observe another cycle"),
      L("Kumpulkan bukti lain", "Gather other evidence"),
      L("Tidak ada tindakan sekarang", "No action now"),
    ],
    opens: "umpan-hasil",
    opensLabel: L("Lihat tanggapannya", "See the responses"),
  },

  {
    id: "integritas",
    kind: L("Keputusan menunggu", "Decision waiting"),
    tone: "blocked",
    subject: L("Tinjauan integritas · diteruskan ke pihak sekolah",
               "Integrity review · referred to the institution"),
    since: L("diteruskan tiga hari lalu", "referred three days ago"),
    happened: L(
      "Seorang pendidik meneruskan satu catatan integritas ke pihak sekolah.",
      "An educator referred one integrity note to the institution."),
    supports: L(
      "Bahwa pendidik sudah meninjau dan memilih meneruskannya. Catatan aslinya menyebut satu hal yang teramati, dan tidak lebih.",
      "That the educator reviewed it and chose to refer it. The note itself records one observed thing, and nothing more."),
    unknown: L(
      "Apa yang sebenarnya terjadi. Catatan ini bahan pertimbangan manusia, bukan kesimpulan tentang siswa.",
      "What actually happened. This note is material for a human to weigh, not a conclusion about the student."),
    step: L("Menentukan siapa yang menanganinya, atau mengembalikannya dengan catatan.",
            "Deciding who handles it, or returning it with a note."),
    actions: [
      L("Tetapkan penanggung jawab", "Assign who handles it"),
      L("Kembalikan dengan catatan", "Return it with a note"),
      L("Tidak ada tindakan sekarang", "No action now"),
    ],
  },

  {
    id: "laporan",
    kind: L("Perlu diketahui", "Worth knowing"),
    tone: "info",
    subject: L("Laporan pembelajaran institusi · semester ini",
               "Institutional learning report · this semester"),
    since: L("diperiksa hari ini", "checked today"),
    happened: L("Laporan pembelajaran institusi belum bisa dihitung untuk semester ini.",
                "The institutional learning report cannot yet be computed for this semester."),
    supports: L(
      "Dua dari lima paket sudah punya bukti yang memenuhi syarat. Tiga lainnya belum.",
      "Two of five packages have evidence that qualifies. Three do not yet."),
    unknown: L(
      "Kapan tiga paket itu akan cukup. Itu bergantung pada jadwal asesmen, bukan pada PINTAR.",
      "When those three will be enough. That depends on the assessment schedule, not on PINTAR."),
    step: L("Tidak ada. Laporan akan tersedia sendiri ketika buktinya cukup.",
            "None. The report becomes available on its own when the evidence is enough."),
    // No decision row. Not everything that is worth knowing is waiting for
    // someone, and a page that attaches buttons to everything teaches the
    // reader that nothing is really waiting.
    actions: [],
  },
];

// ------------------------------------------------- Umpan Balik Pembelajaran

export const UMPAN = {
  name: L("Umpan Balik Pembelajaran", "Learning Feedback"),

  // Step 1 — scope. Not a survey builder: one educator, one class.
  start: {
    title: L("Minta Umpan Balik Pembelajaran", "Request Learning Feedback"),
    lede: L(
      "Anda meminta tanggapan siswa tentang pengalaman belajar di satu kelas.",
      "You are asking students about their experience of learning in one class."),
    boundary: L(
      "Yang ditanyakan adalah apa yang siswa alami, bukan seberapa baik pendidiknya. Hasilnya bukan penilaian kinerja.",
      "What is asked about is what students experience, not how good the educator is. The result is not a performance assessment."),
    scopeLabel: L("Lingkup", "Scope"),
    scope: L("Bu Sari · Kelas 8A · Matematika, semester ini",
             "Bu Sari · Class 8A · Mathematics, this semester"),
    next: L("Pilih pertanyaan", "Choose the questions"),
  },

  // Step 2 — a governed pool. Nothing is authored here.
  questions: {
    title: L("Pilih pertanyaan", "Choose the questions"),
    lede: L(
      "Pertanyaan diambil dari kumpulan yang sudah ditetapkan. Tidak ada pertanyaan yang ditulis sendiri.",
      "Questions come from a governed pool. None is written here."),
    scaleLabel: L("Setiap pertanyaan dijawab dengan", "Every question is answered with"),
    scale: [
      L("hampir selalu", "almost always"), L("sering", "often"),
      L("kadang", "sometimes"), L("jarang", "rarely"),
      L("hampir tidak pernah", "almost never"),
    ],
    pool: [
      L("Penjelasan di kelas ini membantu saya memahami materi.",
        "Explanations in this class help me understand the material."),
      L("Saya tahu apa yang diharapkan dari saya di kelas ini.",
        "I know what is expected of me in this class."),
      L("Saya merasa bisa bertanya ketika saya belum mengerti.",
        "I feel able to ask when I do not yet understand."),
      L("Masukan yang saya terima membantu saya tahu apa yang perlu diperbaiki.",
        "The feedback I get helps me know what to improve."),
      L("Kegiatan di kelas ini membantu saya memahami materi.",
        "The activities in this class help me understand the material."),
    ],
    excluded: L(
      "Pertanyaan yang meminta siswa menilai pendidiknya tidak ada di kumpulan ini, dan tidak bisa ditambahkan.",
      "Questions asking students to rate their educator are not in this pool, and cannot be added."),
    noFreeText: L(
      "Tidak ada isian bebas. Komentar terbuka menimbulkan persoalan anonimitas yang belum terjawab.",
      "There is no free-text box. Open comments raise anonymity problems that are not yet answered."),
    next: L("Lanjut", "Continue"),
  },

  // Step 3 — the anonymity contract, stated before anything is published.
  publish: {
    title: L("Sebelum diterbitkan", "Before this is published"),
    lede: L("Ini yang akan dan tidak akan terjadi.", "This is what will and will not happen."),
    terms: [
      L("Jawaban siswa tidak terhubung dengan nama siswa.",
        "Students’ answers are not linked to their names."),
      L("PINTAR mencatat bahwa seorang siswa sudah menjawab. Catatan itu terpisah dari apa yang dijawab.",
        "PINTAR records that a student has answered. That record is separate from what was answered."),
      L("Anda tidak akan melihat lembar jawaban satu per satu.",
        "You will not see individual answer sheets."),
      L("Pendidik tidak akan melihat siapa yang menjawab dan siapa yang tidak.",
        "The educator will not see who answered and who did not."),
      L("Hasil baru muncul setelah masa menjawab ditutup.",
        "Results appear only after the answering period closes."),
      L("Jika tanggapannya terlalu sedikit, hasilnya tidak ditampilkan.",
        "If there are too few responses, no result is shown."),
    ],
    confirm: L("Terbitkan", "Publish"),
    cancel: L("Batal", "Cancel"),
  },

  // Step 4 — the consolidated result.
  result: {
    title: L("Umpan Balik · Kelas 8A", "Feedback · Class 8A"),
    headline: L("Dua puluh empat dari dua puluh delapan siswa menjawab.",
                "Twenty-four of twenty-eight students answered."),
    bounding: L("Masa menjawab ditutup kemarin. Lembar jawaban satu per satu tidak tersedia untuk siapa pun.",
                "The answering period closed yesterday. Individual answer sheets are available to nobody."),
    rowsLabel: L("Tanggapan per pertanyaan", "Responses, question by question"),
    rows: [
      { q: 0, text: L("20 sering atau hampir selalu · 3 kadang · 1 jarang",
                      "20 often or almost always · 3 sometimes · 1 rarely") },
      { q: 1, text: L("18 sering atau hampir selalu · 5 kadang · 1 jarang",
                      "18 often or almost always · 5 sometimes · 1 rarely") },
      { q: 2, text: L("13 sering atau hampir selalu · 5 kadang · 6 jarang atau hampir tidak pernah",
                      "13 often or almost always · 5 sometimes · 6 rarely or almost never") },
      { q: 3, text: L("19 sering atau hampir selalu · 4 kadang · 1 jarang",
                      "19 often or almost always · 4 sometimes · 1 rarely") },
      { q: 4, text: L("21 sering atau hampir selalu · 2 kadang · 1 jarang",
                      "21 often or almost always · 2 sometimes · 1 rarely") },
    ],
    supports: L(
      "Pada satu pertanyaan — kesempatan bertanya — tanggapannya terbagi. Pada empat pertanyaan lain tidak.",
      "On one question — being able to ask — the responses are split. On the other four they are not."),
    unknown: L(
      "Mengapa terbagi, dan apakah ini berlaku di luar kelas ini. Tanggapan ini pengalaman yang dilaporkan siswa; ia tidak menetapkan bahwa pendidiknya kurang efektif.",
      "Why they are split, and whether this holds outside this class. These are students’ reported experience; they do not establish that the educator is ineffective."),
    step: L(
      "Membicarakannya dengan pendidik, atau mengamati satu siklus lagi. Empat siswa tidak menjawab, dan tidak diketahui apa yang akan mereka jawab.",
      "Discussing it with the educator, or observing another cycle. Four students did not answer, and what they would have said is not known."),
    actions: [
      L("Tinjau bersama pendidik", "Review with the educator"),
      L("Amati satu siklus lagi", "Observe another cycle"),
      L("Kumpulkan bukti lain", "Gather other evidence"),
      L("Tidak ada tindakan sekarang", "No action now"),
    ],
  },

  // Step 5 — the threshold state. The brief's sentence, kept.
  thin: {
    title: L("Umpan Balik · Kelas 7C", "Feedback · Class 7C"),
    headline: L("Belum cukup tanggapan untuk menampilkan hasil dengan aman.",
                "Not yet enough responses to show a result safely."),
    bounding: L(
      "Menampilkan hasil dari tanggapan sesedikit ini bisa membuat jawaban seseorang dikenali.",
      "Showing a result from this few responses could make one person’s answers identifiable."),
    // No number. The threshold is unresolved and inventing one here would
    // be answering a privacy question by mockup.
    unresolved: L(
      "Berapa jumlah minimumnya belum ditetapkan. Itu keputusan produk dan privasi, bukan pilihan tampilan.",
      "What the minimum is has not been set. That is a product and privacy decision, not a layout choice."),
    step: L("Hasil akan tersedia jika tanggapannya cukup sebelum masa menjawab ditutup.",
            "A result becomes available if there are enough responses before the period closes."),
  },
};
