import { L } from "../shared/dom.js";

export const HEADER = {
  eyebrow: L("CARA KERJA PINTAR", "HOW PINTAR WORKS"),
  headline: L("Enam langkah, dari sekolah sampai keputusan manusia.",
              "Six steps, from the school to a human decision."),
  lede: L(
    "Tidak perlu latar belakang teknis untuk memahaminya. Begini urutannya, hari demi hari.",
    "No technical background needed to follow it. Here's the sequence, day to day."),
};

export const SEQUENCE = [
  { title: L("Sekolah menyiapkan pembelajaran", "The school prepares learning"),
    body: L("Materi dan rencana belajar disiapkan sebelum kelas dimulai.",
            "Material and a learning plan are put together before class begins.") },
  { title: L("Peserta didik belajar", "Students learn"),
    body: L("Peserta didik menjalani proses belajar dan mengerjakan asesmen singkat.",
            "Learners go through the process and complete short assessments.") },
  { title: L("Bukti berkembang secara alami", "Evidence develops naturally"),
    body: L("Setiap jawaban dan interaksi meninggalkan jejak bukti, tanpa proses tambahan yang merepotkan siapa pun.",
            "Every answer and interaction leaves a trace of evidence, without extra work for anyone.") },
  { title: L("PINTAR menyusun buktinya", "PINTAR organizes the evidence"),
    body: L("Bukti yang tersebar dikumpulkan dan disusun menjadi gambaran yang bisa dibaca.",
            "Scattered evidence is gathered and organized into something readable.") },
  { title: L("Pendidik melihat apa yang layak diperhatikan", "Educators see what deserves attention"),
    body: L("PINTAR menunjukkan pola yang layak dilihat lebih dekat — bukan daftar nilai satu per satu.",
            "PINTAR points out patterns worth a closer look — not a list of scores one by one.") },
  { title: L("Manusia memutuskan langkah berikutnya", "Humans decide what happens next"),
    body: L("Pendidik dan sekolah yang memutuskan apa yang terjadi selanjutnya, dengan bukti di tangan.",
            "Educators and the school decide what happens next, with the evidence in hand.") },
];

export const CROSSLINK = {
  body: L("Ingin memahami filosofinya, bukan hanya urutannya?", "Want the philosophy, not just the sequence?"),
  cta: L("Apa yang Dilakukan PINTAR", "What PINTAR Does"),
};

export const CLOSING = {
  headline: L("Lihat urutan ini berjalan sendiri.", "Watch this sequence play out yourself."),
  cta: L("Coba Mini-PINTAR", "Try Mini-PINTAR"),
};
