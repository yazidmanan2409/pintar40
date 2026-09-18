// Parent role view — "Bagaimana anak saya?"
//
// A DESIGN SAMPLE. Every figure and name was written for review. None of it
// comes from a school, and the surface is not built — nor could it be
// today: PINTAR has no parent principal, no guardian record, no parent row
// in the evidence-eligibility contract, and doc 09 lists "parent
// experience" under LATER. README.md sets out what would have to exist
// first.
//
// Register: an adult who is not an educator. `Anda`, never `kamu`. No
// PINTAR vocabulary at all — no Pemetaan Awal, no Uji Penguasaan, no Peta
// Bacaan, no penguasaan. A parent should not have to learn the product's
// words to find out how their child is.
//
// Evidence language: describe the observed pattern, never the child.
// "Dalam beberapa kegiatan terakhir, bukti menunjukkan…", never "Anak Anda
// lemah dalam…". No permanent labels — no Sangat Baik / Baik / Cukup /
// Kurang, and nothing that is one of those wearing friendlier clothes.

export const L = (id, en) => ({ id, en });

export const SAMPLE = {
  label: L("CONTOH RANCANGAN", "DESIGN SAMPLE"),
  body: L(
    "Semua angka dan nama di halaman ini dibuat untuk ulasan. Bukan data sekolah mana pun. Tampilan ini belum dibangun.",
    "Every figure and name on this page was made for review. It is from no school. This view is not built."),
};

export const UI = {
  // Minimum identity: a given name. No class, no year, no account or
  // student identifier anywhere on the page or in its URL.
  child: L("Rani", "Rani"),
  langLabel: L("Bahasa", "Language"),
  stateLabel: L("Keadaan contoh", "Sample state"),
  talk: L("Bicara dengan guru Rani", "Talk to Rani’s teacher"),
  updated: L("Diperbarui hari ini", "Updated today"),
};

// The four questions, in the order the brief fixes them. They are the
// information architecture; the wording is natural Indonesian for a parent
// rather than a translation of the question.
export const SECTIONS = {
  supported: L("Yang sudah terlihat", "What can be seen so far"),
  attention: L("Yang perlu perhatian", "What needs attention"),
  action: L("Yang bisa Anda lakukan", "What you can do"),
};

// Answered before it is asked, in the parent's own words, without being
// defensive about it.
export const RANKING = {
  heading: L("Kalau Anda ingin tahu peringkat", "If you are wondering about rank"),
  body: L(
    "PINTAR tidak memberi peringkat dan tidak membandingkan Rani dengan anak lain. Yang dibandingkan adalah pekerjaannya dengan materi yang sedang dipelajari.",
    "PINTAR does not rank, and does not compare Rani with other children. Her work is compared with the material the class is currently learning."),
};

export const NOTE = {
  // The parent-register form of "PINTAR proposes, the educator decides".
  suggestion: L("Ini saran, bukan tugas.", "This is a suggestion, not homework."),
  scope: L(
    "Halaman ini hanya melihat pekerjaan Rani di PINTAR. Banyak hal tentang anak Anda tidak terlihat dari sini.",
    "This page only sees Rani’s work in PINTAR. Much about your child is not visible from here."),
};

/**
 * Three states, because a parent view that only works on a good week is not
 * honest. Each one is the same chain — what happened, what the evidence
 * supports, what is not yet known, a possible step, your decision — in a
 * parent's register rather than an educator's.
 *
 * `headline` + `bounding` are the five-second skim. Between them they must
 * answer all three questions the design test asks, which is why `signpost`
 * is part of the top block and not a section further down: a parent should
 * never scroll to find out whether they need to do something.
 */
export const STATES = [
  {
    id: "berjalan",
    tab: L("Bukti cukup", "Enough evidence"),
    headline: L("Rani mengikuti materi yang sedang dipelajari.",
                "Rani is keeping up with the current lessons."),
    bounding: L(
      "Dalam tiga minggu terakhir, sebagian besar pekerjaannya sejalan dengan pelajaran kelas.",
      "Over three weeks, most of her work has matched the lessons under way."),
    signpost: L("Satu bagian perlu perhatian. Ada satu hal kecil yang bisa Anda lakukan.",
                "One part needs attention. There is one small thing you can do."),

    supported: L(
      "Dari dua belas kegiatan bulan ini, bukti menunjukkan Rani membaca pecahan sebagai bagian dari keseluruhan — berulang, bukan sekali.",
      "Across twelve activities this month, the evidence shows Rani reading a fraction as part of a whole — repeatedly, not once."),

    attention: L(
      "Saat membandingkan dua pecahan dengan penyebut berbeda, jawabannya belum tepat pada empat dari enam kesempatan terakhir.",
      "Comparing two fractions with different denominators, her answers were not yet right on four of the last six."),
    attentionLimit: L(
      "Empat dari enam cukup untuk diperhatikan, belum cukup untuk memastikan sebabnya — apakah soal caranya, soal waktu, atau bentuk soalnya.",
      "Four of six is enough to notice, not enough to be sure of the reason — method, time, or the way the questions are put."),

    action: L(
      "Minta Rani menjelaskan dengan kata-katanya sendiri bagaimana ia tahu pecahan mana yang lebih besar. Mendengarkan lebih berguna daripada mengoreksi.",
      "Ask Rani to explain in her own words how she knows which fraction is larger. Listening is more useful than correcting."),
    actionNote: L("Latihan tambahan tidak diperlukan di sini.",
                  "Extra exercises are not needed here."),
  },

  {
    id: "belum-cukup",
    tab: L("Bukti masih sedikit", "Little evidence yet"),
    headline: L("Belum cukup yang bisa kami sampaikan tentang Rani.",
                "There is not yet enough to tell you about Rani."),
    bounding: L(
      "Rani baru mengerjakan tiga kegiatan sejak dua minggu lalu.",
      "Rani has done three activities in two weeks."),
    signpost: L("Tidak ada yang perlu Anda lakukan sekarang.",
                "There is nothing for you to do right now."),

    supported: L(
      "Ketiga kegiatan dikerjakan sampai selesai. Sejauh ini hanya itu yang didukung bukti.",
      "All three were worked through to the end. So far that is all the evidence supports."),

    attention: L("Tidak ada yang perlu perhatian saat ini.",
                 "Nothing needs attention at the moment."),
    // The sentence this whole state exists for.
    attentionLimit: L(
      "Bukan karena semuanya baik — karena belum ada cukup bukti untuk mengatakan apa pun. Setelah beberapa kegiatan berikutnya, halaman ini bisa mengatakan lebih banyak.",
      "Not because everything is fine — because there is not yet enough evidence to say anything. After the next few activities, this page can say more."),

    action: L("Tidak ada. Biarkan Rani melanjutkan kegiatan yang sedang berjalan.",
              "Nothing. Let Rani carry on with the activities under way."),
    actionNote: L("Kami akan memberi tahu ketika ada yang cukup untuk disampaikan.",
                  "We will say so when there is enough to tell you."),
  },

  {
    id: "perlu-perhatian",
    tab: L("Ada pola berulang", "A repeating pattern"),
    headline: L("Satu pola pada pekerjaan Rani perlu perhatian.",
                "One pattern in Rani’s work needs attention."),
    bounding: L(
      "Dari enam kegiatan terakhir, empat berhenti di bagian yang sama.",
      "Of the last six activities, four stopped at the same part."),
    signpost: L("Ada satu hal yang bisa Anda lakukan, dan Anda bisa membicarakannya dengan guru Rani.",
                "There is one thing you can do, and you can talk it over with Rani’s teacher."),

    supported: L(
      "Keempatnya berhenti pada soal cerita yang panjang. Pada bagian yang selesai, sebagian besar jawabannya tepat.",
      "All four stopped at a long word problem. On the parts she finished, most answers were right."),

    attention: L(
      "Berhenti berulang di bagian yang sama adalah pola, bukan satu kebetulan.",
      "Stopping repeatedly at the same part is a pattern, not one coincidence."),
    attentionLimit: L(
      "Pola ini cukup untuk diperhatikan, belum cukup untuk menyimpulkan sebabnya — apakah soal membaca, soal panjangnya, atau hal di luar pelajaran.",
      "The pattern is enough to notice, not enough to conclude a reason — reading, length, or something outside the lesson."),

    action: L(
      "Tanyakan pada Rani bagian mana yang membuatnya berhenti. Satu pertanyaan saja, bukan ujian kecil.",
      "Ask Rani which part made her stop. One question, not a little test."),
    actionNote: L("Latihan tambahan belum tentu membantu sebelum sebabnya diketahui.",
                  "Extra exercises may not help until the reason is known."),
  },
];
