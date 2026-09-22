import { L } from "./shared/dom.js";

export const HERO = {
  eyebrow: L("PENDIDIKAN · TEKNOLOGI", "EDUCATION · TECHNOLOGY"),
  headline: L("Lebih banyak waktu untuk mendidik.", "More time to educate."),
  lede: L(
    "PINTAR mengubah bukti belajar menjadi pemahaman yang jelas — supaya pendidik punya lebih banyak waktu untuk benar-benar mengajar, memahami peserta didik, dan mengambil keputusan.",
    "PINTAR turns learning evidence into clear understanding — so educators have more time to actually teach, understand learners, and make decisions."),
  ctaPrimary: L("Coba Mini-PINTAR", "Try Mini-PINTAR"),
  ctaSecondary: L("Kenali PINTAR", "About PINTAR"),
};

export const TRUST = {
  label: L("DIRANCANG UNTUK", "BUILT FOR"),
  items: [
    L("Guru dan Pendidik", "Teachers and Educators"),
    L("Kepala Sekolah", "Principals"),
    L("Yayasan Pendidikan", "Education Foundations"),
    L("Dinas dan Pengambil Kebijakan", "Education Offices and Policymakers"),
  ],
};

export const SYSTEM = {
  label: L("SATU SISTEM", "ONE SYSTEM"),
  headline: L("Bukan sekumpulan fitur. Satu alur yang saling terhubung.",
              "Not a collection of features. One connected flow."),
  lede: L(
    "Dari materi yang disiapkan sampai keputusan yang diambil pendidik, setiap tahap terhubung ke tahap berikutnya.",
    "From the material a school prepares to the decision an educator makes, every stage connects to the next."),
  nodes: [
    L("Materi", "Material"),
    L("Pembelajaran", "Learning"),
    L("Asesmen", "Assessment"),
    L("Bukti", "Evidence"),
    L("Pemahaman", "Understanding"),
    L("Keputusan Pendidik", "Educator's Decision"),
  ],
  cta: L("Lihat alurnya selengkapnya", "See the full flow"),
};

export const AUDIENCES = {
  educators: {
    label: L("UNTUK PENDIDIK", "FOR EDUCATORS"),
    headline: L("Waktu Anda kembali ke ruang kelas.", "Your time comes back to the classroom."),
    body: L(
      "Siapkan pembelajaran, jalankan asesmen singkat, dan langsung lihat apa yang perlu perhatian Anda hari ini.",
      "Prepare learning, run a short assessment, and see straight away what needs your attention today."),
    cta: L("Untuk Pendidik", "For Educators"),
    href: "/untuk-pendidik/",
  },
  management: {
    label: L("UNTUK MANAJEMEN", "FOR MANAGEMENT"),
    headline: L("Bukan lebih banyak data. Pemahaman yang lebih jelas.",
                "Not more data. Clearer understanding."),
    body: L(
      "Lihat bukti pembelajaran di tingkat sekolah tanpa mengubahnya menjadi peringkat orang.",
      "See learning evidence at the school level without turning it into a ranking of people."),
    cta: L("Untuk Manajemen", "For Management"),
    href: "/untuk-manajemen/",
  },
};

export const REPORTS_TEASER = {
  label: L("LAPORAN", "REPORTS"),
  headline: L("Bukan sekadar angka. Bukti yang bisa dipahami.",
              "Not just numbers. Evidence that can be understood."),
  body: L(
    "Setiap laporan PINTAR mengatakan apa yang didukung bukti — dan mengatakan dengan jujur ketika buktinya belum cukup.",
    "Every PINTAR report states what the evidence supports — and says honestly when the evidence is not yet enough."),
  cta: L("Lihat Contoh Laporan", "See Sample Reports"),
};

export const CLOSING = {
  label: L("RASAKAN SENDIRI", "SEE FOR YOURSELF"),
  headline: L("Lima menit untuk memahami apa yang PINTAR lakukan.",
              "Five minutes to understand what PINTAR does."),
  body: L(
    "Tidak perlu akun. Coba perjalanan singkat Mini-PINTAR, dari jawaban sederhana sampai laporan yang bisa dipahami.",
    "No account needed. Try the short Mini-PINTAR journey, from a simple answer to a report that makes sense."),
  ctaPrimary: L("Coba Mini-PINTAR", "Try Mini-PINTAR"),
  ctaSecondary: L("Bicara dengan Kami", "Talk to Us"),
};
