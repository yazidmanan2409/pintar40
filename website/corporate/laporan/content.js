import { L } from "../shared/dom.js";

export const HEADER = {
  eyebrow: L("LAPORAN", "REPORTS"),
  headline: L("Bukan sekadar angka. Bukti yang bisa dipahami.",
              "Not just numbers. Evidence that can be understood."),
  lede: L(
    "Setiap laporan PINTAR mengatakan apa yang didukung bukti, dan mengatakan dengan jujur ketika buktinya belum cukup. Contoh di bawah ini memakai data simulasi.",
    "Every PINTAR report states what the evidence supports, and says honestly when the evidence isn't enough yet. The examples below use simulated data."),
};

export const PRINCIPLE = {
  label: L("PRINSIP PINTAR", "PINTAR'S PRINCIPLE"),
  line: L("“Belum cukup bukti” adalah hasil yang sah.",
          "“Not enough evidence” is a legitimate result."),
  body: L(
    "PINTAR tidak pernah berpura-pura tahu sesuatu yang tidak didukung buktinya. Ketika data belum cukup, laporan mengatakannya secara langsung — bukan menyamarkannya dengan angka yang terlihat pasti.",
    "PINTAR never pretends to know something the evidence can't support. When the data isn't enough, the report says so directly — instead of dressing it up in a number that looks more certain than it is."),
};

export const BANDS_LEGEND = {
  strong: L("Pemahaman kuat", "Strong understanding"),
  mid: L("Sebagian dipahami", "Partially understood"),
  low: L("Belum cukup bukti", "Not enough evidence"),
};

export const REPORT_A = {
  label: L("CONTOH UNTUK PENDIDIK", "EXAMPLE FOR EDUCATORS"),
  title: L("Laporan Kelas", "Class Report"),
  meta: L("Kelas 5B · Matematika · data simulasi", "Class 5B · Mathematics · simulated data"),
  rows: [
    { name: L("Perkalian dasar", "Basic multiplication"), strong: 18, mid: 4, low: 2, total: 24 },
    { name: L("Pembagian", "Division"), strong: 12, mid: 8, low: 4, total: 24 },
    { name: L("Pecahan sederhana", "Simple fractions"), strong: 7, mid: 6, low: 11, total: 24 },
  ],
  unresolvedRow: 2,
  unresolved: L(
    "Belum cukup bukti pada Pecahan Sederhana. Sebagian besar peserta didik belum menyelesaikan bagian ini — PINTAR tidak menyimpulkan tingkat pemahaman mereka.",
    "Not enough evidence yet for Simple Fractions. Most learners haven't completed this part — PINTAR does not infer their level of understanding."),
};

export const REPORT_B = {
  label: L("CONTOH UNTUK MANAJEMEN", "EXAMPLE FOR MANAGEMENT"),
  title: L("Ringkasan Sekolah", "School Summary"),
  meta: L("5 kelas · semester ganjil · data simulasi", "5 classes · first semester · simulated data"),
  rows: [
    { name: L("Matematika, kelas 4–6", "Mathematics, grades 4–6"), strong: 58, mid: 22, low: 12, total: 92 },
    { name: L("Literasi, kelas 4–6", "Literacy, grades 4–6"), strong: 64, mid: 20, low: 8, total: 92 },
    { name: L("Sains, kelas 4–6", "Science, grades 4–6"), strong: 30, mid: 25, low: 37, total: 92 },
  ],
  unresolvedRow: 2,
  unresolved: L(
    "Bukti di Sains untuk kelas 4–6 belum cukup pada sebagian besar peserta didik — kemungkinan karena asesmen baru mulai berjalan di mata pelajaran ini.",
    "Evidence in Science for grades 4–6 isn't enough yet for most learners — likely because assessment has only just started rolling out for this subject."),
};

export const CLOSING = {
  headline: L("Lihat bagaimana laporan ini terasa, langsung dari jawaban Anda.",
              "See how this feels, straight from your own answers."),
  ctaPrimary: L("Coba Mini-PINTAR", "Try Mini-PINTAR"),
  ctaSecondary: L("Bicara dengan Kami", "Talk to Us"),
};
