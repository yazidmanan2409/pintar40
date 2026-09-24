import { L } from "../shared/dom.js";

export const HEADER = {
  eyebrow: L("UNTUK MANAJEMEN", "FOR MANAGEMENT"),
  headline: L("Bukan lebih banyak data. Pemahaman yang lebih jelas.",
              "Not more data. Clearer understanding."),
  lede: L(
    "Pimpinan sekolah tidak butuh lebih banyak angka. Mereka butuh cara membaca bukti pembelajaran yang jujur soal apa yang diketahui — dan apa yang belum.",
    "School leaders don't need more numbers. They need a way to read learning evidence that is honest about what is known — and what is not yet."),
};

export const BOUNDARY = {
  label: L("YANG PENTING DITEGASKAN", "WORTH STATING PLAINLY"),
  headline: L("Laporan tentang pembelajaran, bukan peringkat orang.", "Reports about learning, not rankings of people."),
  body: L(
    "PINTAR dirancang untuk menunjukkan pola pembelajaran di tingkat sekolah atau kelas — bukan peringkat guru, bukan peringkat siswa. Bukti tetap bukti; ia tidak menjadi rapor perilaku. Pimpinan yang berwenang dapat melihat daftar murid, dan membuka catatan satu murid adalah tindakan yang disengaja dan tercatat.",
    "PINTAR is designed to surface learning patterns at the school or class level — not a ranking of teachers, not a ranking of students. Evidence stays evidence; it never becomes a behaviour scorecard. Authorised leaders can see the list of learners, and opening one learner's record is a deliberate action that is recorded."),
};

export const EXAMPLES = [
  {
    caption: L("Ringkasan pembelajaran tingkat sekolah, satu semester.",
               "A school-level learning summary, one semester."),
    type: "Contoh ringkasan laporan institusi di layar besar, mockup produk",
    size: "1600 × 1150", ratio: "16:11.5",
  },
  {
    caption: L("Cakupan bukti per kelas — termasuk yang belum cukup.",
               "Evidence coverage by class — including what isn't enough yet."),
    type: "Contoh tampilan cakupan bukti per kelas, mockup produk",
    size: "1000 × 1150", ratio: "8:9.2",
  },
  {
    caption: L("Pola yang layak dibahas, bukan peringkat nama.",
               "Patterns worth discussing, not a ranking of names."),
    type: "Contoh tampilan pola pembelajaran teragregasi tanpa identitas individu, mockup produk",
    size: "1000 × 1150", ratio: "8:9.2",
  },
];

export const CLOSING = {
  headline: L("Lihat bagaimana buktinya disajikan.", "See how the evidence is presented."),
  ctaPrimary: L("Lihat Contoh Laporan", "See Sample Reports"),
  ctaSecondary: L("Coba Mini-PINTAR", "Try Mini-PINTAR"),
};
