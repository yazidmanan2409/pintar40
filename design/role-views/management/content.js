// Management role view — "Apa yang perlu saya ketahui hari ini, dan apakah
// ada keputusan yang menunggu saya?" — and the bounded Umpan Balik
// experience.
//
// A DESIGN SAMPLE. Every figure and name was written for review.
//
// THE GOVERNING DIRECTION (Sauron ruling R2): feedback follows the nearest
// accountable relationship.
//
//   Student  → Educator     · about their own experience of learning.
//                             That instrument belongs in the EDUCATOR
//                             experience and is NOT designed here.
//   Educator → Management   · about their own working and teaching
//                             experience. That is the instrument this
//                             Management view demonstrates.
//
// There is deliberately no Student → Management path. A persistent issue
// found through student feedback may one day be escalated through a
// separately governed process; that process is not authorised, not
// designed, and not assumed anywhere in this file.
//
// Scope, stated before anything else (README has the full map):
//   · Management ROLES exist: HEAD_OF_DEPARTMENT, DEAN, INSTITUTION_ADMIN
//     in `app_role`, authorised through scoped role_assignments.
//   · A management SURFACE does not. `src/app/konfigurasi` assigns roles;
//     `src/app/studio` is the authoring home. Neither answers this question.
//   · "Dean Institutional Learning Intelligence" is BUILD NOW in doc 09 and
//     is NOT implemented — no metric catalogue, no report tables.
//   · UMPAN BALIK DOES NOT EXIST ANYWHERE. Not a table, not a capability,
//     not a string, and not on any of doc 09's lists — not BUILD NOW, not
//     LATER, not PARK. It is a new concept, adopted as a concept, and
//     adopting it into the product is an ADR, not a feature.
//
// Register: `Anda`, adult, institutional. Management vocabulary is allowed
// here in a way it is not on a parent's page, but PINTAR's internal words
// still are not.

export const L = (id, en) => ({ id, en });

export const SAMPLE = {
  label: L("CONTOH RANCANGAN", "DESIGN SAMPLE"),
  body: L(
    "Semua angka dan nama di halaman ini dibuat untuk ulasan. Umpan Balik sudah diterima sebagai gagasan, tetapi belum boleh dibangun: perlu ADR sebelum ada skema atau kode.",
    "Every figure and name here was made for review. Umpan Balik is adopted as a concept but is not authorized to build: it needs an ADR before any schema or code."),
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
  suppression: L(
    "Yang muncul di sini memerlukan wewenang, koordinasi, atau penafsiran tingkat institusi. Selebihnya tidak muncul.",
    "What appears here needs authority, coordination, or an institution-level reading. Nothing else appears."),
  order: L("Urutannya: yang menahan orang lain lebih dulu. Ini urutan, bukan peringkat.",
           "Ordered by what is holding someone else up. It is an order, not a ranking."),
  // The brief's words, kept.
  decides: L("PINTAR mengusulkan, manusia memutuskan.",
             "PINTAR proposes, a human decides."),
};

export const ITEMS = [
  {
    id: "umpan-pendidik",
    kind: L("Keputusan menunggu", "Decision waiting"),
    tone: "attention",
    subject: L("Umpan Balik Pendidik · Rumpun Matematika dan Sains",
               "Educator Feedback · Mathematics and Science department"),
    since: L("ditutup kemarin", "closed yesterday"),
    happened: L(
      "Umpan Balik Pendidik untuk Rumpun Matematika dan Sains sudah ditutup. Dua puluh satu dari dua puluh enam pendidik menjawab.",
      "Educator Feedback for the Mathematics and Science department has closed. Twenty-one of twenty-six educators answered."),
    supports: L(
      "Tanggapan tentang proses asesmen dan administrasi terbagi: sebagian besar menjawab sering, sebagian menjawab jarang. Empat pertanyaan lain tidak terbagi.",
      "Responses about assessment and administrative processes are split: most answered often, some answered rarely. The other four questions are not split."),
    // R12. What the aggregate supports is what educators reported. Why they
    // reported it, and who or what accounts for it, belongs here.
    unknown: L(
      "Mengapa terbagi, dan apa yang menjelaskannya. Ini laporan pengalaman kerja pendidik, bukan penilaian tentang pimpinan.",
      "Why they are split, and what accounts for it. These are educators’ reports of their own working experience, not a judgement about management."),
    step: L(
      "Membicarakannya dengan pendidik di rumpun ini, atau mengamati satu siklus lagi sebelum menyimpulkan apa pun.",
      "Discussing it with the educators in this department, or observing another cycle before concluding anything."),
    actions: [
      L("Bahas bersama pendidik", "Discuss with the educators"),
      L("Amati satu siklus lagi", "Observe another cycle"),
      L("Kumpulkan keterangan lain", "Gather other information"),
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

// ------------------------------------------------------ Umpan Balik Pendidik
//
// Educators, about their own working and teaching experience, to the
// management level responsible for them. Not students. Not about a named
// educator. Not a performance instrument in either direction.

export const UMPAN = {
  name: L("Umpan Balik Pendidik", "Educator Feedback"),

  // Step 1 — scope, and the relationship that decides who may ask whom.
  start: {
    title: L("Minta Umpan Balik Pendidik", "Request Educator Feedback"),
    lede: L(
      "Anda meminta tanggapan pendidik tentang pengalaman mereka sendiri dalam mengajar dan bekerja di rumpun ini.",
      "You are asking educators about their own experience of teaching and working in this department."),
    boundary: L(
      "Yang ditanyakan adalah apa yang pendidik alami sendiri, bukan seberapa baik pimpinannya. Hasilnya bukan penilaian kinerja siapa pun.",
      "What is asked about is what educators themselves experience, not how good their management is. The result is not a performance assessment of anyone."),
    // R2 — the direction, said on the page rather than only in a document.
    // This is also the only place in the Management prototype where student
    // feedback is named at all, and it is named to say where it goes.
    relationship: L(
      "Umpan Balik mengikuti hubungan terdekat yang bertanggung jawab: siswa kepada pendidik yang mengampunya, pendidik kepada pimpinan yang menaunginya. Tanggapan siswa tidak mengalir ke halaman ini.",
      "Umpan Balik follows the nearest accountable relationship: students to the educator responsible for their learning, educators to the management responsible for them. Students’ responses do not flow to this page."),
    // R4 — escalation is recorded as unresolved, not designed.
    escalation: L(
      "Jika sesuatu yang dilaporkan siswa perlu sampai ke tingkat institusi, itu melewati proses tersendiri yang belum ditetapkan — bukan jalur otomatis di dalam PINTAR.",
      "If something students report needs to reach the institution, that goes through a separate process that has not been decided — not an automatic path inside PINTAR."),
    // R5 — a separate record class, never an evidence class.
    separate: L(
      "Tanggapan ini catatan tersendiri, bukan bukti belajar: penguasaan, nilai, sertifikat, dan mutu soal tidak berubah karenanya.",
      "These responses are a separate record, not learning evidence: mastery, scores, certificates and question health do not change because of them."),
    scopeLabel: L("Lingkup", "Scope"),
    scope: L("Rumpun Matematika dan Sains · dua puluh enam pendidik · semester ini",
             "Mathematics and Science department · twenty-six educators · this semester"),
    next: L("Pilih pertanyaan", "Choose the questions"),
  },

  // Step 2 — a governed pool. Nothing is authored here. Every question is
  // about something the educator can observe in their own working week.
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
      L("Ketentuan dan prosedur institusi jelas bagi saya.",
        "Institutional expectations and procedures are clear to me."),
      L("Saya punya keterangan yang saya butuhkan untuk mengajar dan mengambil keputusan.",
        "I have the information I need to teach and to make decisions."),
      L("Proses asesmen dan administrasi mendukung pekerjaan saya.",
        "Assessment and administrative processes support my work."),
      L("Saya bisa menyampaikan persoalan ketika ada yang perlu diangkat.",
        "I am able to raise an issue when something needs raising."),
      L("Dukungan institusi membantu saya menjalankan tanggung jawab saya.",
        "Institutional support helps me carry out my responsibilities."),
    ],
    excluded: L(
      "Pertanyaan yang meminta pendidik menilai pimpinannya tidak ada di kumpulan ini, dan tidak bisa ditambahkan.",
      "Questions asking educators to rate their management are not in this pool, and cannot be added."),
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
      L("Jawaban pendidik tidak terhubung dengan nama pendidik.",
        "Educators’ answers are not linked to their names."),
      L("PINTAR mencatat bahwa seorang pendidik sudah menjawab. Catatan itu terpisah dari apa yang dijawab.",
        "PINTAR records that an educator has answered. That record is separate from what was answered."),
      L("Lembar jawaban satu per satu tidak tersedia untuk siapa pun — bukan untuk Anda, bukan untuk atasan mana pun, bukan untuk administrator.",
        "Individual answer sheets are available to nobody — not to you, not to any superior, not to an administrator."),
      L("Anda tidak akan melihat siapa yang menjawab dan siapa yang tidak.",
        "You will not see who answered and who did not."),
      L("Pendidik yang menjawab melihat ringkasan yang sama, dan tetap tidak tahu siapa yang menjawab.",
        "The educators who answered see the same summary, and still do not know who answered."),
      L("Hasil baru muncul setelah masa menjawab ditutup.",
        "Results appear only after the answering period closes."),
      L("Waktu menjawab tidak dicatat sehalus itu, dan urutan menjawab tidak disimpan.",
        "The time of answering is not recorded finely, and the order in which people answered is not kept."),
      L("Jika tanggapannya terlalu sedikit, hasilnya tidak ditampilkan.",
        "If there are too few responses, no result is shown."),
    ],
    confirm: L("Terbitkan", "Publish"),
    cancel: L("Batal", "Cancel"),
  },

  // Step 4 — the consolidated result. What educators reported, and nothing
  // downstream of it.
  result: {
    title: L("Umpan Balik Pendidik · Rumpun Matematika dan Sains",
             "Educator Feedback · Mathematics and Science department"),
    headline: L("Dua puluh satu dari dua puluh enam pendidik menjawab.",
                "Twenty-one of twenty-six educators answered."),
    bounding: L("Masa menjawab ditutup kemarin. Lembar jawaban satu per satu tidak tersedia untuk siapa pun.",
                "The answering period closed yesterday. Individual answer sheets are available to nobody."),
    rowsLabel: L("Tanggapan per pertanyaan", "Responses, question by question"),
    rows: [
      { q: 0, text: L("16 sering atau hampir selalu · 4 kadang · 1 jarang",
                      "16 often or almost always · 4 sometimes · 1 rarely") },
      { q: 1, text: L("14 sering atau hampir selalu · 5 kadang · 2 jarang",
                      "14 often or almost always · 5 sometimes · 2 rarely") },
      { q: 2, text: L("9 sering atau hampir selalu · 4 kadang · 8 jarang atau hampir tidak pernah",
                      "9 often or almost always · 4 sometimes · 8 rarely or almost never") },
      { q: 3, text: L("17 sering atau hampir selalu · 3 kadang · 1 jarang",
                      "17 often or almost always · 3 sometimes · 1 rarely") },
      { q: 4, text: L("13 sering atau hampir selalu · 6 kadang · 2 jarang",
                      "13 often or almost always · 6 sometimes · 2 rarely") },
    ],
    supports: L(
      "Pada satu pertanyaan — proses asesmen dan administrasi — tanggapannya terbagi. Pada empat pertanyaan lain tidak.",
      "On one question — assessment and administrative processes — the responses are split. On the other four they are not."),
    unknown: L(
      "Mengapa terbagi, apa yang menjelaskannya, dan apakah ini berlaku di luar rumpun ini. Ini laporan pengalaman kerja pendidik; ia tidak menetapkan bahwa prosesnya keliru atau bahwa seseorang lalai.",
      "Why they are split, what accounts for it, and whether this holds outside this department. These are educators’ reports of their own working experience; they do not establish that the process is wrong or that anyone was negligent."),
    step: L(
      "Membicarakannya dengan pendidik di rumpun ini, atau mengamati satu siklus lagi. Lima pendidik tidak menjawab, dan tidak diketahui apa yang akan mereka jawab.",
      "Discussing it with the educators in this department, or observing another cycle. Five educators did not answer, and what they would have said is not known."),
    actions: [
      L("Bahas bersama pendidik", "Discuss with the educators"),
      L("Amati satu siklus lagi", "Observe another cycle"),
      L("Kumpulkan keterangan lain", "Gather other information"),
      L("Tidak ada tindakan sekarang", "No action now"),
    ],
  },

  // Step 5 — the threshold state. The brief's sentence, kept.
  thin: {
    title: L("Umpan Balik Pendidik · Rumpun Bahasa",
             "Educator Feedback · Languages department"),
    headline: L("Belum cukup tanggapan untuk menampilkan hasil dengan aman.",
                "Not yet enough responses to show a result safely."),
    bounding: L(
      "Menampilkan hasil dari tanggapan sesedikit ini bisa membuat jawaban seorang pendidik dikenali.",
      "Showing a result from this few responses could make one educator’s answers identifiable."),
    // No number. The threshold is unresolved and inventing one here would
    // be answering a privacy question by mockup.
    unresolved: L(
      "Berapa jumlah minimumnya belum ditetapkan. Itu keputusan produk dan privasi — bergantung pada besar kelompok dan risiko dikenali — bukan pilihan tampilan.",
      "What the minimum is has not been set. That is a product and privacy decision — it turns on group size and the risk of being identified — not a layout choice."),
    step: L("Hasil akan tersedia jika tanggapannya cukup sebelum masa menjawab ditutup.",
            "A result becomes available if there are enough responses before the period closes."),
  },
};
