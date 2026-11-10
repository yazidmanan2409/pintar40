// Beranda / Home. The order follows a first-time visitor's questions:
// what is it, why does it matter, how does it work, what does it do, is it
// for me, can I trust it, where is it going, how do I see it.

import { label, photo, status, demoBand, NAV_LABEL } from "../core.mjs";
import { connects, cycle, evidenceStates, layers, roadmap } from "../diagrams.mjs";

export default function home(c) {
  const t = c.t;
  const audiences = t([
    ["Peserta didik", "Tahu apa yang perlu dipelajari berikutnya, dan melihat hasilnya sendiri dengan jujur."],
    ["Pendidik", "Melihat soal yang sulit bagi kelas, dan siapa yang mungkin perlu bantuan."],
    ["Pimpinan", "Melihat pola di seluruh kelas, dan angka mana yang sudah boleh ditafsirkan."],
    ["Administrator", "Mengelola akun, kelas, dan peran, tanpa menjadi pengambil keputusan pendidikan."],
    ["Institusi", "Riwayat belajar yang utuh dan dapat dipertanggungjawabkan, dari tahun ke tahun."],
  ], [
    ["Learners", "Know what to learn next, and see their own results honestly."],
    ["Educators", "See which questions a class found hard, and who may need help."],
    ["Leadership", "See patterns across classes, and which figures can be interpreted yet."],
    ["Administrators", "Manage accounts, classes and roles without becoming the educational decision-maker."],
    ["Institutions", "A complete, accountable learning record, year after year."],
  ]);
  const caps = t([
    ["Belajar dan mengajar", "Peserta didik melihat langkah berikutnya. Pendidik menugaskan materi yang telah dirilis, lalu melihat buktinya."],
    ["Konten yang tergovernansi", "Materi disusun, ditinjau, disetujui, lalu dirilis sebagai versi tetap. Koreksi menjadi versi baru; riwayat tidak ditulis ulang."],
    ["Asesmen dan laporan", "Satu hasil resmi untuk setiap pengerjaan. Laporan untuk setiap peran, tanpa memeringkat peserta didik."],
    ["Identitas dan kesinambungan", "Satu orang, banyak peran. Riwayat tetap utuh saat orang pindah, naik kelas, atau purnatugas."],
  ], [
    ["Learning and teaching", "Learners see their next step. Educators assign released material, then see the evidence."],
    ["Governed content", "Material is prepared, reviewed, approved and released as a fixed version. Corrections become new versions; history is never rewritten."],
    ["Assessment and reports", "One official result per attempt. Reports for every role, without ranking learners."],
    ["Identity and continuity", "One person, many roles. The record stays whole when people transfer, move up a year or retire."],
  ]);

  const body = `
<section class="hero" aria-labelledby="hero-h">
  <div class="wrap">
    <div class="hero__text" data-reveal-group>
      ${label("", t("Platform pendidikan berbasis bukti", "Evidence-driven education platform"), "hero__label")}
      <h1 class="display" id="hero-h" data-reveal>${t("Memahami pembelajaran,<br><em>bukan sekadar mencatatnya.</em>", "Understand learning,<br><em>not just record it.</em>")}</h1>
      <div class="hero__aside" data-reveal>
        <p class="lead">${t("PINTAR menghubungkan pengajaran, pembelajaran, asesmen, dan keputusan institusi, agar pendidik dan pimpinan tahu apa yang didukung bukti, dan apa yang perlu perhatian.", "PINTAR connects teaching, learning, assessment and institutional decisions, so educators and leaders know what the evidence supports, and what needs attention.")}</p>
        <p class="actions"><a class="btn" href="${c.demo()}">${NAV_LABEL.demo[c.lang]}</a><a class="link" href="#siklus">${t("Lihat cara kerjanya", "See how it works")}</a></p>
      </div>
    </div>
  </div>
  <div class="wrap wrap--wide hero__photo" data-reveal>${photo(c, "P1")}</div>
  <div class="wrap">${connects(c)}</div>
</section>

<section class="section" aria-labelledby="why-h">
  <div class="wrap cols cols--center">
    <div style="--span:6" data-reveal-group>
      ${label("01", NAV_LABEL.why[c.lang])}
      <h2 class="h2" id="why-h" data-reveal>${t("Sekolah tidak kekurangan nilai. Yang langka adalah pemahaman.", "Schools don’t lack scores. What’s scarce is understanding.")}</h2>
      <p class="body measure" data-reveal>${t("Nilai mencatat hasil. Jarang menjelaskan apa yang sudah dikuasai, di mana kesulitannya, dan apakah buktinya cukup untuk disimpulkan. PINTAR dibangun untuk pertanyaan-pertanyaan itu.", "A score records an outcome. It rarely explains what has been mastered, where the difficulty lies, or whether there is enough evidence to conclude anything. PINTAR is built for those questions.")}</p>
      <p data-reveal><a class="link" href="${c.href("why")}">${t("Mengapa PINTAR ada", "Why PINTAR exists")}</a></p>
    </div>
    <div style="--span:5;--start:8">${evidenceStates(c)}</div>
  </div>
</section>

<section class="section section--sunk" aria-labelledby="cycle-h">
  <div class="wrap">
    <div class="section-head" data-reveal-group>
      ${label("02", t("Cara kerjanya", "How it works"))}
      <h2 class="h2" id="cycle-h" data-reveal>${t("Satu siklus, dari memetakan hingga memperbaiki.", "One cycle, from diagnosis to improvement.")}</h2>
    </div>
    ${cycle(c)}
    <p class="section-foot" data-reveal><a class="link" href="${c.href("why", "#siklus-lengkap")}">${t("Pelajari setiap tahapnya", "Read about each stage")}</a></p>
  </div>
</section>

<section class="section" aria-labelledby="caps-h">
  <div class="wrap cols">
    <div class="caps__photo" style="--span:5">${photo(c, "P3")}</div>
    <div style="--span:6;--start:7" data-reveal-group>
      <div class="caps__head">${label("03", t("Kemampuan", "Capabilities"))}${status(c, "foundation")}</div>
      <h2 class="h2" id="caps-h" data-reveal>${t("Yang dikerjakan PINTAR.", "What PINTAR does.")}</h2>
      <ol class="index">${caps.map(([h, d], i) => `<li data-reveal><span class="index__n">${String(i + 1).padStart(2, "0")}</span><h3 class="index__h">${h}</h3><p class="index__d">${d}</p></li>`).join("")}</ol>
      <p data-reveal><a class="link" href="${c.href("features")}">${t("Lihat semua fitur", "See every feature")}</a></p>
    </div>
  </div>
</section>

<section class="section section--rule" aria-labelledby="aud-h">
  <div class="wrap">
    <div class="section-head section-head--split" data-reveal-group>
      <div>${label("04", NAV_LABEL.audiences[c.lang])}
      <h2 class="h2" id="aud-h" data-reveal>${t("Setiap orang melihat apa yang perlu ia lihat.", "Everyone sees what they need to see.")}</h2></div>
      <p class="lead" data-reveal>${t("Satu platform, lima sudut pandang. Kewenangan menentukan apa yang tampil, bukan sekadar jabatan.", "One platform, five points of view. Authority decides what appears, not job title alone.")}</p>
    </div>
    <ol class="audiences">${audiences.map(([w, b]) => `<li data-reveal><span class="audiences__w">${w}</span><span class="audiences__b">${b}</span></li>`).join("")}</ol>
    <p class="section-foot" data-reveal><a class="link" href="${c.href("audiences")}">${t("Manfaat untuk setiap peran", "The benefit for each role")}</a></p>
  </div>
</section>

<div class="wrap wrap--wide pause" data-reveal>${photo(c, "P6")}</div>

<section class="section section--dark" aria-labelledby="trust-h">
  <div class="wrap cols cols--center">
    <div style="--span:5" data-reveal-group>
      ${label("05", NAV_LABEL.trust[c.lang])}
      <h2 class="h2" id="trust-h" data-reveal>${t("Tenang di permukaan.<br><em>Cermat di bawahnya.</em>", "Calm on the surface.<br><em>Rigorous underneath.</em>")}</h2>
      <p class="body" data-reveal>${t("Antarmuka yang sederhana ditopang oleh batas akses yang ketat, pemisahan antarinstitusi, integritas asesmen, dan riwayat yang tidak ditulis ulang.", "A simple interface rests on strict access boundaries, separation between institutions, assessment integrity and a history that is never rewritten.")}</p>
      <p data-reveal><a class="link" href="${c.href("trust")}">${t("Lihat bagaimana kami menjaganya", "See how it is protected")}</a></p>
    </div>
    <div style="--span:6;--start:7">${layers(c)}</div>
  </div>
</section>

<section class="section" aria-labelledby="road-h">
  <div class="wrap">
    <div class="section-head section-head--split" data-reveal-group>
      <div>${label("06", t("Arah ke depan", "What comes next"))}
      <h2 class="h2" id="road-h" data-reveal>${t("Berkembang dengan hati-hati.", "Growing with care.")}</h2></div>
      <p class="quote" data-reveal>${t("AI membantu.<br>Pendidik memutuskan.", "AI assists.<br>Educators decide.")}</p>
    </div>
    ${roadmap(c)}
    <p class="section-foot" data-reveal><a class="link" href="${c.href("features", "#berikutnya")}">${t("Apa yang berikutnya, dan statusnya", "What comes next, and its status")}</a></p>
  </div>
</section>

${demoBand(c)}
`;
  return {
    title: t("PINTAR — Memahami pembelajaran, bukan sekadar mencatatnya", "PINTAR — Understand learning, not just record it"),
    description: t("PINTAR adalah platform pendidikan berbasis bukti untuk institusi di Indonesia: menghubungkan pengajaran, pembelajaran, asesmen, dan keputusan institusi.", "PINTAR is an evidence-driven education platform for Indonesian institutions, connecting teaching, learning, assessment and institutional decisions."),
    body,
  };
}
