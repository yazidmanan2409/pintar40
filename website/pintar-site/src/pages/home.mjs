// Beranda / Home: understand what to teach next. The order follows a
// first-time visitor: a situation they recognise (the hero and one class's
// evidence, told along the thread), the classroom it comes from, the thread
// itself, the cycle it sits in, what PINTAR does, who it is for, why it can be
// trusted, a brief look ahead, and how to see it. Two demo invitations only:
// the header and the closing section.

import { label, photo, demoBand, NAV_LABEL } from "../core.mjs";
import { thread, classPanel, cycle, layers } from "../diagrams.mjs";

export default function home(c) {
  const t = c.t;
  const caps = t([
    ["Melihat apa yang perlu diulang", "Pendidik melihat penguasaan per tujuan pembelajaran dan soal yang paling sulit bagi kelas, lalu memutuskan langkah berikutnya."],
    ["Belajar dengan langkah yang jelas", "Peserta didik melihat tugasnya dan langkah berikutnya, dari Pemetaan Awal hingga Uji Penguasaan."],
    ["Laporan yang jujur tentang buktinya", "Laporan untuk setiap peran, tanpa peringkat. Bila datanya belum cukup, laporan mengatakannya."],
    ["Menyusun soal lebih cepat", "AI menyusun draf soal pilihan ganda; pendidik memeriksa dan memutuskan, dan soal tetap ditinjau orang kedua sebelum dirilis."],
    ["Materi dan akun yang tertata", "Materi ditinjau sebelum dirilis, dan akun mengikuti orang saat mereka pindah, naik kelas, atau purnatugas."],
  ], [
    ["See what needs revisiting", "Educators see mastery by learning objective and the questions a class found hardest, then decide what to do next."],
    ["Learn with a clear next step", "Learners see their assignments and their next step, from the Initial Mapping to the Mastery Check."],
    ["Reports that are honest about the evidence", "Reports for each role, without rankings. When there is not yet enough data, the report says so."],
    ["Write questions faster", "AI drafts multiple-choice questions; an educator checks them and decides, and each question is still reviewed by a second person before release."],
    ["Organised material and accounts", "Material is reviewed before release, and accounts follow people when they transfer, move up a year or retire."],
  ]);
  const audiences = t([
    ["Peserta didik", "Tahu apa yang perlu dipelajari berikutnya, dan melihat hasilnya sendiri."],
    ["Pendidik", "Melihat bagian dan soal yang sulit bagi kelas, dan siapa yang mungkin perlu bantuan."],
    ["Pimpinan", "Melihat pola di seluruh kelas, dengan angka yang jelas dasarnya."],
    ["Administrator", "Mengelola akun, kelas, dan peran di satu tempat."],
    ["Yayasan dan pengelola", "Catatan belajar institusi yang tetap dapat dijelaskan dari tahun ke tahun."],
  ], [
    ["Learners", "Know what to learn next, and see their own results."],
    ["Educators", "See which parts and questions a class found hard, and who may need help."],
    ["Leadership", "See patterns across classes, with figures whose basis is clear."],
    ["Administrators", "Manage accounts, classes and roles in one place."],
    ["Foundations and governing bodies", "An institutional learning record that can still be explained, year after year."],
  ]);

  const body = `
<section class="hero" aria-labelledby="hero-h">
  <div class="wrap cols hero__grid">
    <div class="hero__text" style="--span:6" data-reveal-group>
      ${label("", t("Platform pendidikan berbasis bukti", "Evidence-driven education platform"), "hero__label")}
      <h1 class="display" id="hero-h" data-reveal>${t("Nilai menunjukkan hasil. <em>Pemahaman menentukan langkah berikutnya.</em>", "A score shows the result. <em>Understanding shows what to teach next.</em>")}</h1>
      <p class="lead" data-reveal>${t("PINTAR menghubungkan pembelajaran, asesmen, dan laporan, sehingga pendidik memahami kemajuan peserta didik dan dapat memutuskan langkah berikutnya.", "PINTAR connects learning, assessment and reporting, so educators can understand progress and decide what comes next.")}</p>
      <p class="actions" data-reveal><a class="link" href="#siklus">${t("Lihat cara kerjanya", "See how it works")}</a></p>
    </div>
    <div class="hero__panel" style="--span:5;--start:8">${classPanel(c)}</div>
  </div>
  <div class="wrap">
    <ul class="benefits" aria-label="${t("Manfaat utama", "The main benefits")}">${t([
      ["Di mana peserta didik kesulitan", "Per tujuan pembelajaran dan per soal, bukan hanya satu nilai."],
      ["Apa yang diajarkan berikutnya", "Bukti yang jelas untuk dipertimbangkan pendidik saat menyiapkan pelajaran berikutnya."],
      ["Bukti belajar yang dapat dipercaya", "Hasil tetap terhubung ke materi dan aturan yang dipakai, dari tahun ke tahun."],
    ], [
      ["Where learners struggle", "By learning objective and by question, not just one score."],
      ["What to teach next", "Clear evidence for the educator to weigh when preparing the next lesson."],
      ["Learning evidence you can trust", "Results stay linked to the material and rules used, year after year."],
    ]).map(([h, d], i) => `<li data-reveal><span class="benefits__n">${String(i + 1).padStart(2, "0")}</span><b class="benefits__h">${h}</b><span class="benefits__d">${d}</span></li>`).join("")}</ul>
  </div>
</section>

<section class="section situation" aria-labelledby="thread-h">
  <div class="wrap">
    <div class="section-head section-head--split" data-reveal-group>
      <div>${label("01", t("Dari bukti ke keputusan", "From evidence to decision"))}
      <h2 class="h2" id="thread-h" data-reveal>${t("Pahami apa yang perlu <em>diajarkan berikutnya.</em>", "Understand <em>what to teach next.</em>")}</h2></div>
      <p class="lead" data-reveal>${t("Setiap laporan di PINTAR berangkat dari tujuan pembelajaran dan berakhir di tangan pendidik.", "Every PINTAR report starts from a learning objective and ends in an educator’s hands.")}</p>
    </div>
    <div class="cols situation__grid">
      <div style="--span:7" data-reveal>${photo(c, "P1", { r: "3/2", sizes: "(max-width: 960px) 100vw, 58vw" })}</div>
      <div style="--span:5;--start:8">${thread(c, { vertical: true })}</div>
    </div>
  </div>
</section>

<section class="section section--sunk" aria-labelledby="cycle-h">
  <div class="wrap">
    <div class="section-head section-head--split" data-reveal-group>
      <div>${label("02", t("Cara kerjanya", "How it works"))}
      <h2 class="h2" id="cycle-h" data-reveal>${t("Satu siklus, <em>dari memetakan hingga memperbaiki.</em>", "One cycle, <em>from diagnosis to improvement.</em>")}</h2></div>
      <p class="lead" data-reveal>${t("Setiap tahap menghasilkan bukti untuk tahap berikutnya.", "Each stage produces evidence for the next.")}</p>
    </div>
    ${cycle(c)}
    <p class="section-foot" data-reveal><a class="link" href="${c.href("why", "#siklus-lengkap")}">${t("Mengapa siklus ini", "Why this cycle")}</a></p>
  </div>
</section>

<section class="section" aria-labelledby="caps-h">
  <div class="wrap cols">
    <div class="caps__photo" style="--span:5">${photo(c, "P2")}</div>
    <div style="--span:6;--start:7" data-reveal-group>
      ${label("03", t("Kemampuan", "Capabilities"))}
      <h2 class="h2" id="caps-h" data-reveal>${t("Yang dikerjakan <em>PINTAR.</em>", "What <em>PINTAR</em> does.")}</h2>
      <ol class="index">${caps.map(([h, d], i) => `<li data-reveal><span class="index__n">${String(i + 1).padStart(2, "0")}</span><h3 class="index__h">${h}</h3><p class="index__d">${d}</p></li>`).join("")}</ol>
      <p class="quote quote--sm" data-reveal>${t("AI membantu. Pendidik memutuskan.", "AI assists. Educators decide.")}</p>
      <p data-reveal><a class="link" href="${c.href("features")}">${t("Semua fitur", "All features")}</a></p>
    </div>
  </div>
</section>

<section class="section section--rule" aria-labelledby="aud-h">
  <div class="wrap">
    <div class="section-head section-head--split" data-reveal-group>
      <div>${label("04", NAV_LABEL.audiences[c.lang])}
      <h2 class="h2" id="aud-h" data-reveal>${t("Setiap orang melihat <em>apa yang perlu ia lihat.</em>", "Everyone sees <em>what they need to see.</em>")}</h2></div>
      <p class="lead" data-reveal>${t("Untuk sekolah, perguruan tinggi, dan program pelatihan. Yang tampil bagi setiap orang ditentukan oleh perannya.", "For schools, universities and training programmes. What each person sees depends on their role.")}</p>
    </div>
    <ol class="audiences">${audiences.map(([w, b]) => `<li data-reveal><span class="audiences__w">${w}</span><span class="audiences__b">${b}</span></li>`).join("")}</ol>
    <p class="section-foot" data-reveal><a class="link" href="${c.href("audiences")}">${t("Manfaat bagi setiap kelompok", "What each group gains")}</a></p>
  </div>
</section>

<section class="section section--dark" aria-labelledby="trust-h">
  <div class="wrap cols cols--center">
    <div style="--span:5" data-reveal-group>
      ${label("05", NAV_LABEL.trust[c.lang])}
      <h2 class="h2" id="trust-h" data-reveal>${t("Tenang di permukaan. <em>Cermat di bawahnya.</em>", "Calm on the surface. <em>Rigorous underneath.</em>")}</h2>
      <p class="body" data-reveal>${t("Yang dilihat pengguna sederhana. Di bawahnya ada pemeriksaan akses, pemisahan antarinstitusi, integritas asesmen, dan catatan atas tindakan penting.", "What people see is simple. Beneath it are access checks, separation between institutions, assessment integrity and a record of consequential actions.")}</p>
      <p data-reveal><a class="link" href="${c.href("trust")}">${t("Perlindungan dan contohnya", "The safeguards, with examples")}</a></p>
    </div>
    <div style="--span:6;--start:7">${layers(c)}</div>
  </div>
</section>

<section class="ahead" aria-labelledby="road-h">
  <div class="wrap ahead__in" data-reveal>
    <h2 class="ahead__h" id="road-h">${t("Ke depan", "What comes next")}</h2>
    <p class="ahead__p">${t("Berikutnya, PINTAR akan membantu menafsirkan bukti lebih dalam, lalu mendukung pertumbuhan pendidik dan intervensi yang diukur.", "Next, PINTAR will help interpret the evidence more deeply, then support educators’ growth and interventions that are measured.")}</p>
    <a class="link" href="${c.href("features", "#arah")}">${t("Arah ke depan", "The future direction")}</a>
  </div>
</section>

${demoBand(c)}
`;
  return {
    title: t("PINTAR — Platform pendidikan berbasis bukti", "PINTAR — Evidence-driven education platform"),
    description: t("PINTAR menghubungkan pembelajaran, asesmen, dan laporan, sehingga pendidik memahami kemajuan peserta didik dan memutuskan apa yang diajarkan berikutnya.", "PINTAR connects learning, assessment and reporting, so educators understand learners’ progress and decide what to teach next."),
    body,
  };
}
