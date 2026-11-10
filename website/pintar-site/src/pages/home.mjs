// Beranda / Home: the proposition, made concrete. The order follows a
// first-time visitor: what is it (hero and a class picture), how does it
// work (the cycle), what does 4.0 do, is it for me, can I trust it, where is
// it going, and how do I see it. Two demo invitations only: the header and
// the closing section.

import { label, photo, status, demoBand, NAV_LABEL } from "../core.mjs";
import { connects, classPanel, cycle, layers, roadmap } from "../diagrams.mjs";

export default function home(c) {
  const t = c.t;
  const caps = t([
    ["Melihat apa yang perlu diulang", "Pendidik melihat penguasaan per tujuan pembelajaran dan soal yang paling sulit bagi kelas, lalu memutuskan langkah berikutnya."],
    ["Belajar dengan langkah yang jelas", "Peserta didik melihat tugasnya dan langkah berikutnya, dari Pemetaan Awal hingga Uji Penguasaan."],
    ["Laporan yang jujur tentang buktinya", "Laporan untuk setiap peran, tanpa peringkat, dan menahan angka yang buktinya belum cukup."],
    ["Menyusun soal lebih cepat", "AI menyusun draf soal pilihan ganda; pendidik meninjau dan memutuskan, lalu soal melalui persetujuan seperti biasa."],
    ["Materi dan akun yang tertata", "Materi ditinjau sebelum dirilis, dan akun mengikuti orang saat mereka pindah, naik kelas, atau purnatugas."],
  ], [
    ["See what needs revisiting", "Educators see mastery by learning objective and the questions a class found hardest, then decide what to do next."],
    ["Learn with a clear next step", "Learners see their assignments and their next step, from the Initial Mapping to the Mastery Check."],
    ["Reports that are honest about the evidence", "Reports for each role, without rankings, holding back any figure the evidence cannot yet support."],
    ["Write questions faster", "AI drafts multiple-choice questions; an educator reviews and decides, then each question goes through the usual approval."],
    ["Organised material and accounts", "Material is reviewed before release, and accounts follow people when they transfer, move up a year or retire."],
  ]);
  const audiences = t([
    ["Peserta didik", "Tahu apa yang perlu dipelajari berikutnya, dan melihat hasilnya sendiri."],
    ["Pendidik", "Melihat bagian dan soal yang sulit bagi kelas, dan siapa yang mungkin perlu bantuan."],
    ["Pimpinan", "Melihat pola di seluruh kelas, dan angka mana yang sudah cukup buktinya."],
    ["Administrator", "Mengelola akun, kelas, dan peran di satu tempat."],
    ["Institusi", "Catatan belajar yang tetap dapat dijelaskan dari tahun ke tahun."],
  ], [
    ["Learners", "Know what to learn next, and see their own results."],
    ["Educators", "See which parts and questions a class found hard, and who may need help."],
    ["Leadership", "See patterns across classes, and which figures the evidence supports."],
    ["Administrators", "Manage accounts, classes and roles in one place."],
    ["Institutions", "A learning record that can still be explained, year after year."],
  ]);

  const body = `
<section class="hero" aria-labelledby="hero-h">
  <div class="wrap cols hero__grid">
    <div class="hero__text" style="--span:7" data-reveal-group>
      ${label("", t("Platform pendidikan berbasis bukti", "Evidence-driven education platform"), "hero__label")}
      <h1 class="display" id="hero-h" data-reveal>${t("Sebuah nilai tidak menunjukkan <em>bagian mana yang belum dikuasai.</em>", "A score doesn’t show <em>which part hasn’t been mastered yet.</em>")}</h1>
      <p class="lead" data-reveal>${t("PINTAR menghubungkan pembelajaran, asesmen, dan laporan, sehingga pendidik dapat melihat penguasaan per tujuan pembelajaran, soal yang sulit bagi kelas, dan kapan buktinya belum cukup untuk disimpulkan.", "PINTAR connects learning, assessment and reporting, so educators can see mastery by learning objective, the questions a class found hard, and when the evidence is not yet enough to conclude anything.")}</p>
      <p class="actions" data-reveal><a class="link" href="#siklus">${t("Lihat cara kerjanya", "See how it works")}</a></p>
    </div>
    <div class="hero__panel" style="--span:5;--start:8">${classPanel(c)}</div>
  </div>
  <div class="wrap wrap--wide hero__photo" data-reveal>${photo(c, "P1")}</div>
  <div class="wrap">${connects(c)}</div>
</section>

<section class="section section--sunk" aria-labelledby="cycle-h">
  <div class="wrap">
    <div class="section-head section-head--split" data-reveal-group>
      <div>${label("01", t("Cara kerjanya", "How it works"))}
      <h2 class="h2" id="cycle-h" data-reveal>${t("Satu siklus, <em>dari memetakan hingga memperbaiki.</em>", "One cycle, <em>from diagnosis to improvement.</em>")}</h2></div>
      <p class="lead" data-reveal>${t("Setiap tahap menghasilkan bukti untuk tahap berikutnya.", "Each stage produces evidence for the next.")}</p>
    </div>
    ${cycle(c)}
    <p class="section-foot" data-reveal><a class="link" href="${c.href("why", "#siklus-lengkap")}">${t("Mengapa siklus ini", "Why this cycle")}</a></p>
  </div>
</section>

<section class="section" aria-labelledby="caps-h">
  <div class="wrap cols">
    <div class="caps__photo" style="--span:5">${photo(c, "P3")}</div>
    <div style="--span:6;--start:7" data-reveal-group>
      <div class="caps__head">${label("02", t("Kemampuan", "Capabilities"))}${status(c, "available")}</div>
      <h2 class="h2" id="caps-h" data-reveal>${t("Yang dikerjakan <em>PINTAR.</em>", "What <em>PINTAR</em> does.")}</h2>
      <ol class="index">${caps.map(([h, d], i) => `<li data-reveal><span class="index__n">${String(i + 1).padStart(2, "0")}</span><h3 class="index__h">${h}</h3><p class="index__d">${d}</p></li>`).join("")}</ol>
      <p data-reveal><a class="link" href="${c.href("features")}">${t("Semua fitur", "All features")}</a></p>
    </div>
  </div>
</section>

<section class="section section--rule" aria-labelledby="aud-h">
  <div class="wrap">
    <div class="section-head section-head--split" data-reveal-group>
      <div>${label("03", NAV_LABEL.audiences[c.lang])}
      <h2 class="h2" id="aud-h" data-reveal>${t("Setiap orang melihat <em>apa yang perlu ia lihat.</em>", "Everyone sees <em>what they need to see.</em>")}</h2></div>
      <p class="lead" data-reveal>${t("Untuk sekolah, perguruan tinggi, dan program pelatihan. Yang tampil ditentukan oleh peran seseorang di institusi itu.", "For schools, universities and training programmes. What appears depends on a person’s role in that institution.")}</p>
    </div>
    <ol class="audiences">${audiences.map(([w, b]) => `<li data-reveal><span class="audiences__w">${w}</span><span class="audiences__b">${b}</span></li>`).join("")}</ol>
    <p class="section-foot" data-reveal><a class="link" href="${c.href("audiences")}">${t("Manfaat untuk setiap peran", "What each role gains")}</a></p>
  </div>
</section>

<div class="wrap wrap--wide pause" data-reveal>${photo(c, "P6")}</div>

<section class="section section--dark" aria-labelledby="trust-h">
  <div class="wrap cols cols--center">
    <div style="--span:5" data-reveal-group>
      ${label("04", NAV_LABEL.trust[c.lang])}
      <h2 class="h2" id="trust-h" data-reveal>${t("Tenang di permukaan. <em>Cermat di bawahnya.</em>", "Calm on the surface. <em>Rigorous underneath.</em>")}</h2>
      <p class="body" data-reveal>${t("Yang dilihat pengguna sederhana. Di bawahnya ada pemeriksaan akses, pemisahan antarinstitusi, integritas asesmen, dan catatan atas tindakan penting.", "What people see is simple. Beneath it are access checks, separation between institutions, assessment integrity and a record of consequential actions.")}</p>
      <p data-reveal><a class="link" href="${c.href("trust")}">${t("Perlindungan dan contohnya", "The safeguards, with examples")}</a></p>
    </div>
    <div style="--span:6;--start:7">${layers(c)}</div>
  </div>
</section>

<section class="section" aria-labelledby="road-h">
  <div class="wrap">
    <div class="section-head section-head--split" data-reveal-group>
      <div>${label("05", t("Hari ini, dan ke depan", "Today, and what comes next"))}
      <h2 class="h2" id="road-h" data-reveal>${t("Berkembang <em>dengan hati-hati.</em>", "Growing <em>with care.</em>")}</h2></div>
      <p class="quote" data-reveal>${t("AI membantu.<br>Pendidik memutuskan.", "AI assists.<br>Educators decide.")}</p>
    </div>
    ${roadmap(c)}
    <p class="section-foot" data-reveal><a class="link" href="${c.href("features", "#berikutnya")}">${t("Yang baru di 4.1", "What is new in 4.1")}</a></p>
  </div>
</section>

${demoBand(c)}
`;
  return {
    title: t("PINTAR — Platform pendidikan berbasis bukti", "PINTAR — Evidence-driven education platform"),
    description: t("PINTAR menghubungkan pembelajaran, asesmen, dan laporan bagi institusi pendidikan di Indonesia, sehingga pendidik melihat apa yang sudah dikuasai dan apa yang perlu diulang.", "PINTAR connects learning, assessment and reporting for Indonesian educational institutions, so educators see what has been mastered and what needs revisiting."),
    body,
  };
}
