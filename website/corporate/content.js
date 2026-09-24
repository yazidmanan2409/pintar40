import { L } from "./shared/dom.js";

export const HERO = {
  eyebrow: L("PENDIDIKAN · TEKNOLOGI", "EDUCATION · TECHNOLOGY"),
  headline: L("Lebih banyak waktu untuk mendidik.", "More time to educate."),
  lede: L(
    "PINTAR dirancang untuk mengubah bukti belajar menjadi pemahaman yang jelas — supaya pendidik punya lebih banyak waktu untuk benar-benar mengajar, memahami peserta didik, dan mengambil keputusan.",
    "PINTAR is designed to turn learning evidence into clear understanding — so educators have more time to actually teach, understand learners, and make decisions."),
  ctaPrimary: L("Coba Mini-PINTAR", "Try Mini-PINTAR"),
  ctaSecondary: L("Kenali PINTAR", "About PINTAR"),
};

export const TRUST = {
  label: L("DIRANCANG UNTUK", "BUILT FOR"),
  // The product's own role labels, word for word (hle.ts role.*). Only roles
  // PINTAR actually has; no audience the product has no surface for.
  items: [
    L("Guru", "Teacher"),
    L("Kepala departemen", "Head of department"),
    L("Dekan", "Dean"),
    L("Admin sekolah", "School administrator"),
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
      "Siapkan pembelajaran, jalankan Uji Cepat, lalu lihat apa yang paling layak dikerjakan lebih dulu.",
      "Prepare learning, run a Quick Assessment, then see the one thing most worth doing first."),
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
  headline: L("Sekitar tiga menit untuk memahami apa yang PINTAR lakukan.",
              "About three minutes to understand what PINTAR does."),
  body: L(
    "Tidak ada akun, tidak ada data yang disimpan. Coba perjalanan singkat Mini-PINTAR, dari jawaban sederhana sampai hasil yang bisa dipahami.",
    "No account, no data kept. Try the short Mini-PINTAR journey, from a simple answer to a result that makes sense."),
  ctaPrimary: L("Coba Mini-PINTAR", "Try Mini-PINTAR"),
  ctaSecondary: L("Bicara dengan Kami", "Talk to Us"),
};
