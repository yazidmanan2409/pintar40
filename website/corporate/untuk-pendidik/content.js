import { L } from "../shared/dom.js";

export const HEADER = {
  eyebrow: L("UNTUK PENDIDIK", "FOR EDUCATORS"),
  headline: L("Waktu Anda kembali ke ruang kelas.", "Your time comes back to the classroom."),
  lede: L(
    "PINTAR dirancang untuk menyusun jawaban peserta didik menjadi bukti yang bisa dibaca — supaya Anda punya lebih banyak waktu untuk mengajar, memahami peserta didik, dan mengambil keputusan.",
    "PINTAR is designed to organise your learners' answers into evidence you can read — so you have more time to teach, understand your learners, and make decisions."),
};

export const SEQUENCE = [
  { title: L("Siapkan pembelajaran", "Prepare learning"),
    body: L(
      "Mulai dari paket Pustaka PINTAR atau susun materi sendiri untuk kelas Anda. Persetujuan dan penerbitan dilakukan Kepala Departemen dan sekolah.",
      "Start from a PINTAR Library package or draft your own material for your class. Approval and publishing are done by the Head of Department and the school.") },
  { title: L("Jalankan Uji Cepat", "Run a Quick Assessment"),
    body: L(
      "Beberapa soal dalam satu jendela pendek untuk mengecek pemahaman hari ini — bukan ujian panjang.",
      "A few items in one short window to check today's understanding — not a long exam.") },
  { title: L("Lihat apa yang perlu perhatian", "See what needs attention"),
    body: L(
      "Setelah cukup banyak peserta didik selesai, PINTAR menunjukkan pola yang layak Anda lihat lebih dekat — bukan daftar nilai satu per satu.",
      "Once enough learners have finished, PINTAR points out patterns worth a closer look — not a list of scores one by one.") },
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
