import { L } from "../shared/dom.js";

export const HEADER = {
  eyebrow: L("CARA KERJA PINTAR", "HOW PINTAR WORKS"),
  headline: L("Enam langkah, dari sekolah sampai keputusan manusia.",
              "Six steps, from the school to a human decision."),
  lede: L(
    "Tidak perlu latar belakang teknis untuk memahaminya. Begini urutan yang dirancang untuk berjalan hari demi hari.",
    "No technical background needed to follow it. Here is the sequence PINTAR is designed to follow, day to day."),
};

export const SEQUENCE = [
  { title: L("Sekolah menyiapkan pembelajaran", "The school prepares learning"),
    body: L("Materi dan rencana belajar disiapkan sebelum kelas dimulai.",
            "Material and a learning plan are put together before class begins.") },
  { title: L("Peserta didik belajar", "Students learn"),
    body: L("Peserta didik menjalani siklus belajar PINTAR, dari Pemetaan Awal sampai Uji Penguasaan.",
            "Learners go through PINTAR's learning cycle, from the Initial Mapping to the Mastery Check.") },
  { title: L("Bukti berkembang secara alami", "Evidence develops naturally"),
    body: L("Setiap jawaban pada penilaian resmi menjadi bukti.",
            "Every answer on an official assessment becomes evidence.") },
  { title: L("PINTAR menyusun buktinya", "PINTAR organizes the evidence"),
    body: L("Bukti yang tersebar dikumpulkan dan disusun menjadi gambaran yang bisa dibaca.",
            "Scattered evidence is gathered and organized into something readable.") },
  { title: L("Pendidik melihat apa yang layak diperhatikan", "Educators see what deserves attention"),
    body: L("Setelah cukup banyak peserta didik selesai, PINTAR menunjukkan pola yang layak dilihat lebih dekat — bukan daftar nilai satu per satu.",
            "Once enough learners have finished, PINTAR points out patterns worth a closer look — not a list of scores one by one.") },
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
