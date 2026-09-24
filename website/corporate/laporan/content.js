import { L } from "../shared/dom.js";

// REPORT ILLUSTRATIONS, DRAWN FROM THE PRODUCT, NOT BESIDE IT.
//
// Every figure below is a metric of PINTAR's catalogue MC-1, and its label and
// meaning sentence are the product's own words (src/lib/hle.ts, metrik.*),
// copied, not paraphrased. The two cards follow the two real surfaces: the
// educator's "Apa yang sudah bisa disimpulkan" (/mengajar/[kelas]/bukti) and
// the management view's "Yang didukung bukti" (/pimpinan). Only the NUMBERS
// are simulated, and the page says so.
//
// Every figure carries one of the product's three evidence states, and the
// state is consistent with its sample: shown only when `have` meets the
// catalogue minimum (`needed`), "Sudah ada, belum cukup" when some evidence
// exists but not enough, "Belum ada yang memenuhi syarat" when none qualifies.
// The minimum is MC-1's, per metric. verify/audit.mjs checks all of it against
// verify/canonical-snapshot.mjs, which in turn is checked against the product.
//
// There is no learner band called "belum cukup bukti". Not enough evidence is
// a state of a FIGURE, never a group of children.

export const HEADER = {
  eyebrow: L("LAPORAN", "REPORTS"),
  headline: L("Bukan sekadar angka. Bukti yang bisa dipahami.",
              "Not just numbers. Evidence that can be understood."),
  lede: L(
    "Setiap laporan PINTAR dirancang untuk mengatakan apa yang didukung bukti, dan mengatakan dengan jujur ketika buktinya belum cukup. Contoh di bawah ini memakai data simulasi.",
    "Every PINTAR report is designed to state what the evidence supports, and to say honestly when the evidence isn't enough yet. The examples below use simulated data."),
};

export const PRINCIPLE = {
  label: L("PRINSIP PINTAR", "PINTAR'S PRINCIPLE"),
  line: L("“Belum cukup bukti” adalah hasil yang sah.",
          "“Not enough evidence” is a legitimate result."),
  // pimpinan.kesiapan.catatan, word for word.
  body: L(
    "Bukti yang belum cukup bukan hasil yang buruk. Artinya PINTAR belum boleh menyimpulkan apa pun, dan angkanya muncul sendiri ketika buktinya memenuhi syarat.",
    "Evidence that is not yet enough is not a poor result. It means PINTAR may not conclude anything yet, and the figure appears on its own once the evidence qualifies."),
  source: L("Kalimat di atas diambil apa adanya dari tampilan pimpinan di PINTAR.",
            "The sentence above is taken word for word from PINTAR's management view."),
};

// The three evidence states (pimpinan.kesiapan.*), word for word, and how each
// one looks on a card (laporan.metrik.*).
export const STATES = {
  title: L("Kesiapan bukti", "Evidence readiness"),
  intro: L("Setiap angka dalam laporan PINTAR berada di salah satu dari tiga keadaan ini:",
           "Every figure in a PINTAR report is in one of these three states:"),
  cukup: {
    name: L("Cukup untuk ditafsirkan", "Enough to interpret"),
    shows: L("Angkanya ditampilkan, bersama dari berapa murid angka itu berasal.",
             "The figure is shown, with how many students it comes from."),
  },
  belum_cukup: {
    name: L("Sudah ada, belum cukup", "Some, not enough yet"),
    shows: L("Belum cukup data untuk menampilkan angka ini.",
             "Not enough data to show this figure yet."),
  },
  belum_ada: {
    name: L("Belum ada yang memenuhi syarat", "Nothing qualifying yet"),
    shows: L("Belum ada bukti yang memenuhi syarat untuk angka ini.",
             "No qualifying evidence for this figure yet."),
  },
};

// Product sentences used on the cards, word for word.
export const WORDS = {
  from: L("Dari", "From"),                       // bukti.dari
  students: L("murid", "students"),              // bukti.murid
  minimum: L("minimum", "minimum"),              // bukti.minimum
  fromStaff: L("dari", "from"),                  // pimpinan.bukti.dari
  points: L("poin", "points"),                   // mengajar.bukti.poin
  times: L("kali", "times"),                     // mengajar.bukti.kali
  where: L("Keadaan hari ini", "Where things stand today"),   // mengajar.bukti.keadaan
  submitted: L("Mengumpulkan", "Submitted"),                  // mengajar.bukti.kumpul
  conclusions: L("Kesimpulan", "Conclusions"),                // mengajar.bukti.simpulan
};

// The four readiness tiers of MC-1, in the catalogue's order (highest first),
// with the rule each one stands for. Labels are kesiapan.*, word for word.
export const TIERS = {
  siap_sertifikasi: {
    name: L("Siap sertifikasi", "Ready for certification"),
    rule: L("penguasaan 80% ke atas, dan semua butir wajib dijawab benar",
            "mastery of 80% or more, and every required item answered correctly"),
  },
  perlu_review: {
    name: L("Perlu review", "Needs review"),
    rule: L("penguasaan 60–79%", "mastery of 60–79%"),
  },
  butuh_pendampingan: {
    name: L("Butuh pendampingan ekstra", "Needs extra support"),
    rule: L("penguasaan di bawah 60%, atau tidak semua butir wajib dijawab benar",
            "mastery below 60%, or not every required item answered correctly"),
  },
  belum_post_test: {
    name: L("Belum mengerjakan penilaian akhir", "Mastery Check not yet taken"),
    rule: L("belum mengerjakan Uji Penguasaan", "has not yet taken the Mastery Check"),
  },
};

export const REPORT_A = {
  label: L("CONTOH UNTUK PENDIDIK", "EXAMPLE FOR EDUCATORS"),
  // mengajar.bukti.judul / mengajar.bukti.intro, word for word.
  title: L("Apa yang sudah bisa disimpulkan", "What can be concluded so far"),
  intro: L(
    "PINTAR hanya menyimpulkan bila bukti resminya cukup. Belum cukup bukan berarti buruk — artinya belum.",
    "PINTAR only concludes when the official evidence is enough. Not yet enough does not mean bad — it means not yet."),
  meta: L("Kelas 5B · Matematika · data simulasi", "Class 5B · Mathematics · simulated data"),
  submitted: 22,
  classSize: 24,
  figures: [
    { metric: "class.comprehension", kind: "percent", value: 0.72, state: "cukup", have: 22, needed: 5,
      label: L("Pemahaman", "Comprehension"),
      meaning: L("Rata-rata penguasaan kelas pada penilaian akhir.", "The class's average mastery on the Mastery Check."),
      // tindakan.lanjut: the product's action for a comprehension of 60% or more.
      action: L("Tidak perlu diulang — lanjutkan ke materi berikutnya.", "No need to reteach — move on to the next topic.") },
    { metric: "class.net_gain", kind: "points", state: "belum_cukup", have: 4, needed: 5,
      label: L("Kenaikan", "Gain"),
      meaning: L("Selisih penguasaan sebelum dan sesudah pembelajaran, per murid.", "The difference in mastery before and after the lessons, per student.") },
    { metric: "class.topic_mastery", kind: "topics", state: "cukup", have: 22, needed: 5,
      label: L("Penguasaan per topik", "Mastery by topic"),
      meaning: L("Rata-rata penguasaan kelas pada tiap topik.", "The class's average mastery on each topic."),
      // Ascending, as the product orders them: an order, not a verdict.
      rows: [
        { name: L("Pecahan sederhana", "Simple fractions"), value: 0.48 },
        { name: L("Pembagian", "Division"), value: 0.67 },
        { name: L("Perkalian dasar", "Basic multiplication"), value: 0.85 },
      ] },
    { metric: "class.misconceptions", kind: "misconceptions", state: "cukup", have: 22, needed: 3,
      label: L("Pemahaman keliru yang berulang", "Recurring misunderstandings"),
      meaning: L("Pola jawaban keliru yang muncul pada banyak murid, dengan saran penanganannya.", "Patterns of mistaken answers shared by many students, with what to do about them."),
      items: [
        { name: L("Menganggap pecahan dengan penyebut lebih besar selalu lebih besar",
                  "Treating a fraction with a larger denominator as always larger"),
          occurrences: 7,
          remedy: L("Bandingkan dua pecahan dengan potongan gambar yang sama besar sebelum memakai aturan.",
                    "Compare two fractions with equal-sized picture pieces before using a rule.") },
      ] },
    { metric: "class.readiness_distribution", kind: "tiers", state: "cukup", have: 24, needed: 5,
      label: L("Sebaran kesiapan", "Readiness distribution"),
      meaning: L("Banyaknya murid pada tiap tingkat kesiapan.", "How many students sit at each readiness tier."),
      // tindakan.fokus, word for word.
      action: L("Fokuskan waktu tambahan pada murid di dua tingkat kesiapan terbawah.", "Focus extra time on students in the two lowest readiness tiers."),
      tiers: { siap_sertifikasi: 9, perlu_review: 6, butuh_pendampingan: 7, belum_post_test: 2 } },
  ],
  // mengajar.bukti.kaki, word for word.
  foot: L(
    "Yang tidak tampil di sini: penilaian per soal dan sinyal integritas. Keduanya ditinjau Kepala Departemen, bukan pengajar.",
    "Not shown here: item-level review and integrity signals. Both are reviewed by the Head of Department, not the educator."),
};

export const REPORT_B = {
  label: L("CONTOH UNTUK PIMPINAN", "EXAMPLE FOR MANAGEMENT"),
  // pimpinan.bukti.judul, word for word.
  title: L("Yang didukung bukti", "What the evidence supports"),
  meta: L("Satu sekolah · data simulasi", "One school · simulated data"),
  figures: [
    { metric: "institution.participants", kind: "count", value: 186, state: "cukup", have: 186, needed: 1,
      label: L("Peserta", "Students"),
      meaning: L("Banyaknya murid yang mengerjakan penilaian di sekolah ini.", "How many students took the assessment in this school.") },
    { metric: "institution.net_gain", kind: "percent", value: 0.11, state: "cukup", have: 142, needed: 10,
      label: L("Kenaikan", "Gain"),
      meaning: L("Rata-rata kenaikan penguasaan murid di sekolah ini.", "The average gain in mastery across this school's students.") },
    { metric: "institution.safety_gate_pass_rate", kind: "percent", value: 0.91, state: "cukup", have: 180, needed: 10,
      label: L("Butir wajib", "Required items"),
      meaning: L("Bagian murid yang menjawab benar seluruh butir wajib.", "The share of students who answered every required item correctly.") },
    { metric: "institution.competency_outcomes", kind: "absent", state: "belum_ada", have: 0, needed: 10,
      label: L("Capaian kompetensi", "Competency attainment"),
      meaning: L("Rata-rata penguasaan pada tiap ranah yang diukur.", "The average mastery in each domain that was measured.") },
  ],
};

export const CLOSING = {
  headline: L("Lihat bagaimana PINTAR menahan diri, langsung dari jawaban Anda.",
              "See PINTAR hold back, straight from your own answers."),
  ctaPrimary: L("Coba Mini-PINTAR", "Try Mini-PINTAR"),
  ctaSecondary: L("Bicara dengan Kami", "Talk to Us"),
};
