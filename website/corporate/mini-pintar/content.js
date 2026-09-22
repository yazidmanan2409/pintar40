// Mini-PINTAR — the short, interactive journey embedded in the corporate
// site. Every result the visitor sees in STEP 3/4 is computed from their
// own real answers, never scripted — PINTAR does not manufacture evidence
// any more in its own demo than it would in the real product. Only the
// STEP 5 management report uses clearly labelled simulated class data,
// because a single visitor's five answers cannot stand in for a class.

import { L } from "../shared/dom.js";

export const STAGES = [
  L("Mulai", "Start"),
  L("Belajar", "Learn"),
  L("Asesmen Singkat", "Quick Assessment"),
  L("Bukti", "Evidence"),
  L("Sudut Pandang Pendidik", "Educator's View"),
  L("Laporan Manajemen", "Management Report"),
  L("Selesai", "Done"),
];

export const EXIT = L("Keluar", "Exit");

// ------------------------------------------------------------------ start

export const START = {
  eyebrow: L("MINI-PINTAR", "MINI-PINTAR"),
  headline: L("Rasakan sendiri, dalam beberapa menit.", "See for yourself, in a few minutes."),
  body: L(
    "Rasakan bagaimana PINTAR mengubah jawaban sederhana menjadi informasi yang berguna bagi pendidik — dari satu hal kecil yang Anda pelajari, sampai laporan yang bisa dipahami.",
    "See how PINTAR turns simple answers into information an educator can actually use — from one small thing you learn, through to a report that makes sense."),
  meta: L("Sekitar 3–5 menit · tanpa akun · Matematika sederhana",
          "About 3–5 minutes · no account needed · simple Mathematics"),
  cta: L("Mulai", "Start"),
};

// ------------------------------------------------------------------- learn

export const LEARN = {
  eyebrow: L("LANGKAH 1 · BELAJAR", "STEP 1 · LEARN"),
  headline: L("Mari mulai dari satu hal sederhana.", "Let's start with one simple thing."),
  example: "12 × 4 = 48",
  explain: L(
    "Perkalian adalah penjumlahan berulang: 12 dijumlahkan sebanyak 4 kali, hasilnya 48.",
    "Multiplication is repeated addition: 12 added together 4 times comes to 48."),
  note: L(
    "Sebentar lagi, Anda akan menjawab beberapa soal serupa.",
    "In a moment, you'll answer a few similar questions."),
  cta: L("Lanjut ke Asesmen Singkat", "Continue to the Quick Assessment"),
};

// -------------------------------------------------------------------- quiz
//
// Five short items: multiplication, division, a simple fraction, a word
// problem, basic numerical reasoning. Options are plain numbers, so they
// need no translation; only the question stem does.

export const QUIZ = {
  progress: L("Pertanyaan {n} dari 5", "Question {n} of 5"),
  questions: [
    {
      concept: L("Perkalian", "Multiplication"),
      stem: L("7 × 6 = ?", "7 × 6 = ?"),
      options: [36, 40, 42, 48],
      answer: 2,
    },
    {
      concept: L("Pembagian", "Division"),
      stem: L("72 ÷ 8 = ?", "72 ÷ 8 = ?"),
      options: [6, 7, 8, 9],
      answer: 3,
    },
    {
      concept: L("Pecahan Sederhana", "Simple Fractions"),
      stem: L("¼ dari 20 adalah berapa?", "What is ¼ of 20?"),
      options: [4, 5, 8, 10],
      answer: 1,
    },
    {
      concept: L("Soal Cerita", "Word Problems"),
      stem: L(
        "Seorang guru membeli 3 kotak pensil. Setiap kotak berisi 12 pensil. Berapa pensil semuanya?",
        "A teacher buys 3 boxes of pencils. Each box has 12 pencils. How many pencils in total?"),
      options: [15, 24, 36, 39],
      answer: 2,
    },
    {
      concept: L("Pola Angka", "Number Patterns"),
      stem: L("2, 4, 6, 8, ... Angka selanjutnya adalah?", "2, 4, 6, 8, ... What comes next?"),
      options: [9, 10, 11, 12],
      answer: 1,
    },
  ],
};

// ---------------------------------------------------------------- evidence

export const EVIDENCE = {
  eyebrow: L("LANGKAH 2 · BUKTI", "STEP 2 · EVIDENCE"),
  headline: L("Jawaban Anda baru saja menjadi bukti.", "Your answers just became evidence."),
  intro: L(
    "PINTAR tidak hanya menghitung skor. Setiap jawaban dibaca sebagai bukti tentang apa yang sudah dipahami — dan apa yang belum jelas.",
    "PINTAR doesn't just count a score. Every answer is read as evidence of what's understood — and what isn't clear yet."),
  chipsLabel: L("Bukti per pertanyaan", "Evidence, question by question"),
  chipGood: L("terjawab dengan baik", "answered well"),
  chipReview: L("perlu ditinjau lagi", "needs another look"),
  // Interpretation is chosen at render time from {correct, total}. Every
  // branch ends with the same humility clause: five items is a small
  // sample, in the demo exactly as it would be in the real product.
  interpret: {
    all: L(
      "Kelima jawaban Anda cocok dengan yang diharapkan. Itu bukti awal yang baik — tapi lima soal tetap sampel kecil, belum cukup untuk kesimpulan yang kuat tentang penguasaan Anda.",
      "All five of your answers matched what was expected. That's a good early signal — but five items are still a small sample, not enough for a strong conclusion about your mastery."),
    most: L(
      "Sebagian besar jawaban Anda cocok dengan yang diharapkan; satu atau dua perlu ditinjau lagi. Ini pola yang layak diperhatikan, bukan kesimpulan akhir — lima soal belum cukup untuk memastikan mengapa.",
      "Most of your answers matched what was expected; one or two need another look. That's a pattern worth noticing, not a final verdict — five items aren't enough to be sure why."),
    mixed: L(
      "Beberapa jawaban Anda berbeda dari yang diharapkan. Itu bisa berarti konsepnya perlu dijelaskan ulang — atau soalnya kurang jelas bagi Anda. Lima soal belum cukup untuk memastikan yang mana.",
      "Several of your answers differed from what was expected. That could mean the concept needs explaining again — or the question wasn't clear to you. Five items aren't enough to be sure which."),
  },
  cta: L("Lanjut: lihat sebagai pendidik", "Continue: see as an educator"),
};

// ---------------------------------------------------------------- educator

export const EDUCATOR = {
  eyebrow: L("LANGKAH 3 · SUDUT PANDANG PENDIDIK", "STEP 3 · THE EDUCATOR'S VIEW"),
  headline: L("Sekarang bayangkan Anda pendidiknya.", "Now imagine you are the educator."),
  intro: L(
    "Bukti yang sama, dilihat dari sisi lain. Inilah yang mungkin dilihat seorang pendidik setelah asesmen singkat ini selesai.",
    "The same evidence, seen from the other side. This is roughly what an educator might see once this short assessment closes."),
  summaryLabel: L("Ringkasan asesmen", "Assessment summary"),
  flagLabel: L("Konsep yang mungkin layak diperhatikan", "A concept that may be worth attention"),
  flagNone: L(
    "Tidak ada konsep yang menonjol untuk ditinjau dari data ini — lima jawaban ini belum cukup untuk menandai satu topik pun.",
    "No concept stands out to flag from this data — five answers aren't enough to single one out."),
  stepLabel: L("Langkah yang mungkin", "A possible next step"),
  stepWith: L(
    "PINTAR mengusulkan meninjau ulang {concept} bersama peserta didik. Ini usulan, bukan keputusan otomatis.",
    "PINTAR suggests reviewing {concept} together with the learner. This is a suggestion, not an automatic decision."),
  stepWithout: L(
    "PINTAR tidak melihat alasan kuat untuk berhenti di sini — mungkin lanjut ke materi berikutnya. Ini juga usulan, bukan keputusan otomatis.",
    "PINTAR doesn't see a strong reason to pause here — perhaps move on to the next material. This is also a suggestion, not an automatic decision."),
  decisionLabel: L("Apa yang akan Anda lakukan?", "What would you do next?"),
  decisions: [
    L("Tinjau konsep ini", "Review this concept"),
    L("Beri cek singkat lagi", "Give another short check"),
    L("Lanjutkan belajar", "Continue learning"),
  ],
  ack: L(
    "Baik — “{choice}”. Keputusan ini tetap milik Anda; PINTAR hanya mengusulkan.",
    "Noted — “{choice}”. That decision stays yours; PINTAR only proposed."),
  cta: L("Lanjut ke Laporan Manajemen", "Continue to the Management Report"),
};

// -------------------------------------------------------------- management

export const MANAGEMENT = {
  eyebrow: L("LANGKAH 4 · LAPORAN MANAJEMEN", "STEP 4 · THE MANAGEMENT REPORT"),
  headline: L("Bukti yang sama, pada skala sekolah.", "The same kind of evidence, at school scale."),
  intro: L(
    "Ini BUKAN hasil Anda — lima jawaban satu orang tidak bisa mewakili satu kelas. Ini contoh laporan kelas dengan data simulasi, memakai konsep yang sama seperti yang baru Anda coba.",
    "This is NOT your result — one person's five answers can't stand in for a class. This is a sample class report with simulated data, using the same concepts you just tried."),
  simLabel: L("KELAS CONTOH · DATA SIMULASI", "SAMPLE CLASS · SIMULATED DATA"),
  meta: L("Kelas 5B · 24 peserta didik · semester ini", "Class 5B · 24 learners · this semester"),
  coverage: L("22 dari 24 peserta didik menyelesaikan asesmen ini.",
              "22 of 24 learners completed this assessment."),
  rowsLabel: L("Bukti per konsep", "Evidence by concept"),
  rows: [
    { concept: L("Perkalian", "Multiplication"), strong: 19, mid: 3, low: 2, total: 24 },
    { concept: L("Pembagian", "Division"), strong: 14, mid: 7, low: 3, total: 24 },
    { concept: L("Pecahan Sederhana", "Simple Fractions"), strong: 8, mid: 6, low: 10, total: 24 },
    { concept: L("Soal Cerita", "Word Problems"), strong: 16, mid: 5, low: 3, total: 24 },
    { concept: L("Pola Angka", "Number Patterns"), strong: 20, mid: 3, low: 1, total: 24 },
  ],
  attentionLabel: L("Mungkin perlu perhatian", "May need attention"),
  unresolvedRow: 2,
  unresolved: L(
    "Belum cukup bukti pada Pecahan Sederhana untuk sebagian besar peserta didik. Laporan ini tidak menyimpulkan mengapa — itu keputusan pendidik yang mengampu kelas ini.",
    "Not enough evidence yet on Simple Fractions for most learners. This report doesn't conclude why — that's for the educator who teaches this class to decide."),
  cta: L("Lanjut", "Continue"),
};

// --------------------------------------------------------------------- end

export const END = {
  eyebrow: L("SELESAI", "DONE"),
  headline: L(
    "Beberapa menit tadi hanyalah contoh kecil.",
    "Those few minutes were just a small example."),
  body: L(
    "PINTAR melakukan pekerjaan yang sama di seluruh proses pembelajaran — mengubah bukti menjadi pemahaman, tanpa mengambil keputusan dari tangan pendidik.",
    "PINTAR does the same work across the whole learning process — turning evidence into understanding, without taking the decision out of educators' hands."),
  ctaPrimary: L("Lihat PINTAR untuk Sekolah", "See PINTAR for Schools"),
  ctaSecondary: L("Bicara dengan Kami", "Talk to Us"),
  restart: L("Coba lagi dari awal", "Try it again from the start"),
};
