import { L } from "../shared/dom.js";

export const HEADER = {
  eyebrow: L("UNTUK PENDIDIK", "FOR EDUCATORS"),
  headline: L("Waktu Anda kembali ke ruang kelas.", "Your time comes back to the classroom."),
  lede: L(
    "Sebagian pekerjaan yang biasanya memakan satu jam bisa dipangkas jauh lebih singkat — supaya Anda punya lebih banyak waktu untuk mengajar, memahami peserta didik, dan mengambil keputusan.",
    "Work that could take an hour can often be cut down a lot — so you have more time to teach, understand your learners, and make decisions."),
};

export const SEQUENCE = [
  { title: L("Siapkan pembelajaran", "Prepare learning"),
    body: L(
      "Susun materi dan urutan belajar untuk kelas Anda, tanpa memulai dari nol setiap kali.",
      "Put together material and a learning sequence for your class, without starting from zero every time.") },
  { title: L("Jalankan asesmen", "Run an assessment"),
    body: L(
      "Berikan pertanyaan singkat untuk memeriksa pemahaman — bukan ujian panjang yang menyita waktu mengoreksi.",
      "Give a short set of questions to check understanding — not a long exam that eats up marking time.") },
  { title: L("Lihat apa yang perlu perhatian", "See what needs attention"),
    body: L(
      "Begitu jawaban masuk, PINTAR menunjukkan pola yang layak Anda lihat lebih dekat — bukan daftar nilai satu per satu.",
      "As answers come in, PINTAR points out patterns worth a closer look — not a list of scores one by one.") },
  { title: L("Ambil keputusan", "Make the decision"),
    body: L(
      "Bahas dengan peserta didik, beri latihan tambahan, atau lanjutkan — keputusan tetap ada di tangan Anda.",
      "Discuss it with the learner, give extra practice, or move on — the decision stays yours.") },
];

export const QUOTE = L(
  "PINTAR mengusulkan. Anda yang memutuskan — setiap kali.",
  "PINTAR proposes. You decide — every time.");

export const CLOSING = {
  headline: L("Rasakan sendiri, dari sudut pandang pendidik.", "Experience it yourself, from an educator's seat."),
  ctaPrimary: L("Coba Mini-PINTAR", "Try Mini-PINTAR"),
  ctaSecondary: L("Apa yang Dilakukan PINTAR", "What PINTAR Does"),
};
