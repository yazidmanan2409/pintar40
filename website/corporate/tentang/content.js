import { L } from "../shared/dom.js";

export const HEADER = {
  eyebrow: L("TENTANG PINTAR", "ABOUT PINTAR"),
  headline: L("Mengapa PINTAR ada.", "Why PINTAR exists."),
  lede: L(
    "Bukan untuk menambah perangkat lagi ke meja pendidik. Untuk mengembalikan sesuatu yang lebih berharga: waktu.",
    "Not to add one more tool to an educator's desk. To give back something more valuable: time."),
};

export const ESSAY = [
  { label: L("WAKTU PENDIDIK", "AN EDUCATOR'S TIME"),
    body: L(
      "Pendidik menghabiskan banyak waktu memeriksa, mencatat, dan menyusun ulang informasi yang sebenarnya sudah ada di tangan mereka — jawaban peserta didik sendiri. Waktu itu semestinya bisa dipakai untuk mengajar, bukan untuk pekerjaan administratif di belakangnya.",
      "Educators spend a great deal of time checking, recording, and reorganizing information that's already in their hands — their own learners' answers. That time should go to teaching, not to the administrative work behind it.") },
  { label: L("BUKTI, BUKAN DUGAAN", "EVIDENCE, NOT GUESSWORK"),
    body: L(
      "Keputusan pendidikan yang baik dimulai dari bukti yang jelas — bukan dari dugaan, dan bukan dari angka yang terlihat pasti padahal tidak. Ketika buktinya belum cukup, itu juga sesuatu yang perlu dikatakan, bukan disembunyikan.",
      "A good educational decision starts from clear evidence — not from a guess, and not from a number that looks certain when it isn't. When the evidence isn't enough yet, that's also something worth saying, not hiding.") },
  { label: L("MANUSIA TETAP MEMUTUSKAN", "HUMANS STILL DECIDE"),
    body: L(
      "Teknologi bekerja di baliknya. Tapi keputusan tentang seorang peserta didik — apa yang terjadi selanjutnya bagi mereka — selalu tetap di tangan pendidik dan sekolah. PINTAR mengusulkan; manusia yang memutuskan.",
      "Technology works underneath. But the decision about a learner — what happens next for them — always stays with the educator and the school. PINTAR proposes; a human decides.") },
];

export const TEAM = {
  label: L("SIAPA YANG MEMBANGUNNYA", "WHO BUILDS IT"),
  body: L(
    "PINTAR dibangun oleh orang-orang yang pernah berdiri di depan kelas dan pernah membangun perangkat lunak untuk pendidikan — dua pengalaman yang jarang berada di ruangan yang sama.",
    "PINTAR is built by people who have stood in front of a classroom and people who have built software for education — two kinds of experience that don't often share a room."),
};

export const CLOSING = {
  headline: L("Kenali cara kerjanya lebih jauh.", "Get to know how it works."),
  ctaPrimary: L("Apa yang Dilakukan PINTAR", "What PINTAR Does"),
  ctaSecondary: L("Coba Mini-PINTAR", "Try Mini-PINTAR"),
};
