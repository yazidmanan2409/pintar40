// Educator role view — "What needs my attention today?"
//
// A DESIGN SAMPLE. Every figure, name and card on this page was written for
// review. None of it comes from a school, and the view itself is not built:
// see README.md for what exists in `src/app/studio` today and what this
// proposes on top of it.
//
// Wording discipline, as in the deck: where PINTAR already has a string for
// something, this uses PINTAR's string. The three integrity decisions, the
// bucket names and the integrity explainer below are verbatim from
// `src/lib/hle.ts`, and the framing line is verbatim from the approved
// `educator-home` slide. Inventing a second vocabulary for the same
// concepts is how a product starts disagreeing with itself.

export const L = (id, en) => ({ id, en });

// --------------------------------------------------------------- the frame

export const FRAME = {
  role: L("Pendidik", "Educator"),
  // Verbatim, src/lib/hle.ts — the Studio surface this view would sit on.
  surface: L("Studio · Beranda", "Studio · Home"),
  question: L("Yang perlu perhatian Anda hari ini",
              "What needs your attention today"),
  // Verbatim from the approved educator-home slide.
  suppression: L(
    "Yang tidak perlu dikerjakan tidak muncul di halaman ini.",
    "What needs nothing does not appear on this page."),
  order: L(
    "Urutannya: yang menahan orang lain lebih dulu. Ini urutan, bukan peringkat.",
    "Ordered by what is holding someone else up. It is an order, not a ranking."),
  // Verbatim from the approved educator-home slide's third callout.
  decides: L("PINTAR mengusulkan, pendidik memutuskan.",
             "PINTAR proposes, the educator decides."),
  scope: L("Kelas dalam lingkup mengajar Anda",
           "Classes in your teaching context"),
};

/**
 * The demonstration banner. Part of the page, not a corner badge, and not
 * dismissible — the same reasoning as the evaluation-mode banner in
 * `src/app/_evaluation-banner.tsx`: its presence is a property of what this
 * is, so there is no state to dismiss it with.
 */
export const SAMPLE = {
  label: L("CONTOH RANCANGAN", "DESIGN SAMPLE"),
  body: L(
    "Semua angka dan nama di halaman ini dibuat untuk ulasan. Bukan data sekolah mana pun. Tampilan ini belum dibangun.",
    "Every figure and name on this page was made for review. It is from no school. This view is not built."),
};

// ------------------------------------------------------- the doctrine chain
//
// Four labelled parts in a fixed order, then the decision. The labels are
// the chain, and they are the same on every card — which is what lets a
// reader who has understood the first card skim the second and third.
//
// The uncertainty line is set at the same size as the line above it. Making
// it small print would be the overclaim the chain exists to prevent.

export const CHAIN = {
  happened: L("YANG TERJADI", "WHAT HAPPENED"),
  supports: L("YANG DIDUKUNG BUKTI", "WHAT THE EVIDENCE SUPPORTS"),
  unknown: L("YANG BELUM DIKETAHUI", "WHAT IS NOT YET KNOWN"),
  step: L("LANGKAH YANG MUNGKIN", "A POSSIBLE NEXT STEP"),
  decision: L("KEPUTUSAN ANDA", "YOUR DECISION"),
};

// ---------------------------------------------------------------- the cards

export const CARDS = [
  {
    id: "held-certificate",
    // Verbatim bucket name, src/lib/hle.ts studio.bucket.BLOCKED.
    kind: L("Tertahan", "Held"),
    tone: "blocked",
    subject: L("Sertifikat · Kerja Laboratorium Dasar",
               "Certificate · Basic Laboratory Work"),
    since: L("sejak dua hari", "for two days"),
    happened: L(
      "Sertifikat untuk Rani A. (7B) tertahan: pada asesmen paket ini, jumlah minimum butir penting yang harus tepat belum terpenuhi.",
      "The certificate for Rani A. (7B) is held: on this package’s assessment, the minimum number of safety-critical items has not been met."),
    supports: L(
      "Dari tiga butir penting, dua dijawab tepat. Minimum yang ditetapkan untuk asesmen ini adalah tiga. Enam dari tujuh tujuan lain terpenuhi.",
      "Two of three safety-critical items were answered correctly. The minimum set for this assessment is three. Six of the seven other objectives are met."),
    unknown: L(
      "Apakah ini soal pemahaman atau soal kesempatan berlatih. PINTAR tidak mengamati apa yang terjadi di laboratorium.",
      "Whether this is about understanding or about opportunity to practise. PINTAR does not observe what happens in the laboratory."),
    step: L(
      "Satu sesi praktik terbimbing, atau tinjau apakah minimum ini tepat untuk kelas 7.",
      "One guided practice session, or review whether this minimum belongs at year 7."),
    actions: [
      L("Buka tujuan ini", "Open this objective"),
      L("Catat rencana", "Record a plan"),
      L("Belum, nanti", "Not yet"),
    ],
  },

  {
    id: "integrity-signal",
    // Verbatim bucket name, src/lib/hle.ts studio.bucket.ACTION_REQUIRED.
    kind: L("Menunggu tindakan Anda", "Waiting for you"),
    tone: "attention",
    subject: L("Tinjauan Integritas · 7B", "Integrity Review · 7B"),
    since: L("sejak kemarin", "since yesterday"),
    happened: L(
      "Satu catatan menunggu tinjauan Anda: jendela berpindah empat kali selama Uji Penguasaan “Pecahan Senilai”.",
      "One note is waiting for your review: the window changed four times during the “Equivalent Fractions” mastery check."),
    supports: L(
      "Bahwa jendela berpindah empat kali, dan kapan. Tidak lebih dari itu.",
      "That the window changed four times, and when. Nothing beyond that."),
    // Verbatim, src/lib/hle.ts studio.integritas.penjelasan.
    unknown: L(
      "Mengapa. Catatan ini bahan pertimbangan manusia, bukan kesimpulan tentang siswa.",
      "Why. This note is material for a human to weigh, not a conclusion about the student."),
    step: L(
      "Satu percakapan singkat, atau catat bahwa tidak ada yang perlu ditindaklanjuti.",
      "A short conversation, or record that nothing needs following up."),
    // Verbatim, src/lib/hle.ts — and these three are the only decisions the
    // database accepts. `record_integrity_review` refuses anything else with
    // "an integrity review records what the reviewer did, not a verdict
    // about the learner".
    actions: [
      L("Tidak ada yang perlu ditindaklanjuti", "Nothing to follow up"),
      L("Sudah dibicarakan dengan siswa", "Discussed with the student"),
      L("Diteruskan ke pihak sekolah", "Referred to the institution"),
    ],
  },

  {
    id: "reading-maps",
    kind: L("Perlu diketahui", "Worth knowing"),
    tone: "info",
    subject: L("Peta Bacaan · 7B", "Reading Maps · 7B"),
    since: L("minggu ini", "this week"),
    happened: L(
      "Lima dari dua puluh delapan peta bacaan di 7B menempatkan bacaan yang sama di kartu teratas: membandingkan pecahan.",
      "Five of twenty-eight reading maps in 7B put the same reading on the top card: comparing fractions."),
    supports: L(
      "Bahwa lima peta menempatkan bacaan itu lebih dulu. Peta bacaan disusun dari jawaban pemetaan awal, bukan dari nilai.",
      "That five maps put that reading first. A reading map is built from initial-mapping answers, not from marks."),
    unknown: L(
      "Apakah kelimanya mengalami kesulitan yang sama. Lima dari dua puluh delapan belum cukup untuk menyimpulkan satu sebab bersama.",
      "Whether all five are finding the same thing hard. Five of twenty-eight is not enough to conclude a common cause."),
    step: L(
      "Sepuluh menit di awal pelajaran berikutnya — atau tidak sama sekali. Angkanya kecil dan bisa saja kebetulan.",
      "Ten minutes at the start of the next lesson — or nothing at all. The number is small and may be coincidence."),
    actions: [
      L("Lihat kelima peta", "See the five maps"),
      L("Catat rencana sepuluh menit", "Record a ten-minute plan"),
      L("Tidak perlu ditindaklanjuti", "Nothing to follow up"),
    ],
  },
];

// ------------------------------------------------- what was looked at, quietly
//
// Suppression is only trustworthy if the page says what it looked at and
// found nothing in. Silence and "nothing to report" are different claims,
// and only the second one is honest about having looked.

export const QUIET = {
  label: L("Yang sudah diperiksa dan tidak menunggu Anda",
           "Checked, and not waiting for you"),
  lines: [
    L("Tiga kelas lain dalam lingkup mengajar Anda: tidak ada keputusan yang menunggu.",
      "Three other classes in your teaching context: no decision waiting."),
    // The honest Phase 6 statement, and the doctrine turned on PINTAR
    // itself: `question_health_state` begins at INSUFFICIENT_EVIDENCE and
    // signal computation is not built, so there is nothing to show.
    L("Sinyal mutu soal: belum cukup bukti untuk menampilkan apa pun.",
      "Question health signals: not yet enough evidence to show anything."),
    L("Pustaka PINTAR untuk sekolah Anda: empat paket baru, tidak menunggu apa pun.",
      "The PINTAR library for your school: four new packages, waiting on nothing."),
  ],
};

export const UI = {
  langLabel: L("Bahasa", "Language"),
  cardCount: (n) => L(`${n} hal hari ini`, `${n} things today`),
  readMore: L("Selengkapnya di Studio", "More in Studio"),
};
