import { L } from "../shared/dom.js";

export const HEADER = {
  eyebrow: L("APA YANG DILAKUKAN PINTAR", "WHAT PINTAR DOES"),
  headline: L("Satu alur yang saling terhubung.", "One connected flow."),
  lede: L(
    "PINTAR bukan sekumpulan fitur yang dipasang berdampingan. Setiap tahap di bawah ini terhubung ke tahap berikutnya, dari materi yang disiapkan sekolah sampai keputusan yang diambil pendidik.",
    "PINTAR is not a set of features bolted side by side. Every stage below connects to the next, from the material a school prepares to the decision an educator makes."),
};

export const FLOW = [
  { node: L("Materi", "Material"),
    desc: L("Sekolah menyiapkan apa yang akan dipelajari.", "The school prepares what will be learned.") },
  { node: L("Pembelajaran", "Learning"),
    desc: L("Peserta didik menjalaninya dengan caranya sendiri.", "Learners engage with it in their own way.") },
  { node: L("Asesmen", "Assessment"),
    desc: L("Pemahaman diperiksa lewat pertanyaan singkat.", "Understanding is checked through short questions.") },
  { node: L("Bukti", "Evidence"),
    desc: L("Setiap jawaban menjadi bukti, bukan sekadar skor.", "Every answer becomes evidence, not just a score.") },
  { node: L("Pemahaman", "Understanding"),
    desc: L("Bukti itu disusun menjadi gambaran yang bisa dibaca.", "That evidence is organized into something readable.") },
  { node: L("Keputusan Pendidik", "Educator's Decision"),
    desc: L("Pendidik yang memutuskan langkah berikutnya.", "The educator decides what happens next.") },
];

export const PULLQUOTE = {
  label: L("PRINSIPNYA SEDERHANA", "THE PRINCIPLE IS SIMPLE"),
  line: L("Bukti  →  Pemahaman  →  Keputusan manusia.", "Evidence  →  Understanding  →  A human decision."),
};

export const EXPLAIN = {
  coherence: {
    label: L("SATU ALUR", "ONE THREAD"),
    headline: L("Satu benang yang sama dari awal sampai akhir.", "One thread runs from the start to the end."),
    body: L(
      "Materi, pembelajaran, asesmen, dan bukti tidak berdiri sendiri-sendiri. PINTAR menjaga agar semuanya tetap terhubung, sehingga pendidik tidak perlu menyusun sendiri potongan yang terpisah-pisah.",
      "Material, learning, assessment, and evidence do not stand apart. PINTAR keeps them connected, so educators don't have to assemble scattered pieces themselves."),
  },
  human: {
    label: L("MANUSIA TETAP MEMUTUSKAN", "HUMANS STILL DECIDE"),
    headline: L("PINTAR mengusulkan. Pendidik memutuskan.", "PINTAR proposes. The educator decides."),
    body: L(
      "PINTAR bisa menunjukkan bukti dan mengusulkan apa yang layak diperhatikan. Tapi keputusan pendidikan — apa yang terjadi selanjutnya bagi peserta didik — selalu ada di tangan manusia.",
      "PINTAR can surface evidence and suggest what deserves attention. But the educational decision — what happens next for a learner — always stays in human hands."),
  },
};

export const CROSSLINK = {
  body: L("Ingin tahu bagaimana ini berjalan hari demi hari?", "Curious how this plays out day to day?"),
  cta: L("Lihat Cara Kerja PINTAR", "See How PINTAR Works"),
};

export const CLOSING = {
  headline: L("Coba alur ini sendiri, dalam lima menit.", "Try this flow yourself, in five minutes."),
  ctaPrimary: L("Coba Mini-PINTAR", "Try Mini-PINTAR"),
  ctaSecondary: L("Untuk Pendidik", "For Educators"),
};
