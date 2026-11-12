// Mengapa PINTAR / Why PINTAR: the problem, the philosophy (the full
// cycle) and the principles behind it. This page explains why; capabilities
// and their status live on Features.

import { label, photo, demoBand, NAV_LABEL } from "../core.mjs";
import { thread, cycle, evidenceStates } from "../diagrams.mjs";

export default function why(c) {
  const t = c.t;
  const obs = t([
    ["Nilai mencatat hasil, bukan penyebabnya.", "Dua peserta didik dengan nilai yang sama bisa kesulitan di bagian yang berbeda, dan membutuhkan bantuan yang berbeda pula."],
    ["Data yang sedikit mudah disalahartikan.", "Bila hanya sebagian kecil yang sudah mengerjakan, sebuah rata-rata bisa tampak rendah atau tinggi tanpa alasan yang sebenarnya."],
    ["Catatan belajar mudah terputus.", "Ketika orang pindah kelas, pindah sekolah, atau berganti tugas, jejak belajarnya sering tidak ikut terbawa."],
  ], [
    ["A score records an outcome, not its cause.", "Two learners with the same score may struggle with different parts, and need different help."],
    ["A little data is easily misread.", "When only a few people have taken a test, an average can look low or high for no real reason."],
    ["The learning record breaks easily.", "When people change class, change school or change roles, their learning history often stays behind."],
  ]);
  const principles = t([
    ["Pendidik yang memutuskan.", "PINTAR menunjukkan bukti dan batasnya. Keputusan tentang peserta didik tetap pada orang yang berwenang."],
    ["Tanpa peringkat.", "Laporan menjelaskan pembelajaran, tidak mengurutkan peserta didik dari yang terbaik hingga terburuk."],
    ["Belum cukup bukti bukan berarti lemah.", "Bila datanya belum cukup, laporan mengatakannya dan menahan angkanya."],
    ["Koreksi tidak menghapus yang lama.", "Materi yang dikoreksi menjadi versi baru, beserta alasannya, sehingga hasil yang sudah ada tetap dapat dijelaskan."],
  ], [
    ["Educators make the decisions.", "PINTAR shows the evidence and its limits. Decisions about learners stay with the people responsible for them."],
    ["No rankings.", "Reports explain learning; they do not order learners from best to worst."],
    ["Too little evidence is not weakness.", "When there is not yet enough data, the report says so and holds the figure back."],
    ["A correction does not erase the original.", "Corrected material becomes a new version, with its reason, so existing results can still be explained."],
  ]);

  const body = `
<section class="page-hero" aria-labelledby="why-hero-h">
  <div class="wrap" data-reveal-group>
    ${label("", NAV_LABEL.why[c.lang])}
    <h1 class="h1" id="why-hero-h" data-reveal>${t("Keputusan pendidikan <em>layak didukung bukti.</em>", "Educational decisions <em>deserve evidence.</em>")}</h1>
    <div class="page-hero__aside" data-reveal>
      <p class="lead">${t("Pertanyaan terpenting di kelas jarang terjawab oleh angka saja: bagian mana yang sudah dikuasai, siapa yang perlu bantuan, dan apa yang sebaiknya dilakukan berikutnya. PINTAR membantu menjawabnya, dari tujuan pembelajaran hingga langkah mengajar berikutnya.", "The most important questions in a class are rarely answered by numbers alone: which parts have been mastered, who needs help, and what should happen next. PINTAR helps answer them, from the learning objective to the next teaching step.")}</p>
    </div>
  </div>
  <div class="wrap" style="margin-top: var(--s-9)">${thread(c)}</div>
</section>

<section class="section section--rule" aria-labelledby="obs-h">
  <div class="wrap">
    <div class="section-head" data-reveal-group>${label("01", t("Masalahnya", "The problem"))}
      <h2 class="h2" id="obs-h" data-reveal>${t("Tiga hal yang membuat <em>bukti sulit dipakai.</em>", "Three things that make <em>evidence hard to use.</em>")}</h2></div>
    <div class="why__photo" data-reveal>${photo(c, "P7", { sizes: "(max-width: 760px) 100vw, 86rem" })}</div>
    <ol class="observations">${obs.map(([h, d], i) => `<li data-reveal><span class="observations__n">${String(i + 1).padStart(2, "0")}</span><h3 class="observations__h">${h}</h3><p class="observations__d">${d}</p></li>`).join("")}</ol>
  </div>
</section>

<section class="section section--sunk" aria-labelledby="loop-h" id="siklus-lengkap">
  <div class="wrap">
    <div class="section-head section-head--split" data-reveal-group>
      <div>${label("02", t("Filosofi belajar", "The learning philosophy"))}
      <h2 class="h2" id="loop-h" data-reveal>${t("Petakan, arahkan, belajar, uji, jelaskan, verifikasi, <em>perbaiki.</em>", "Diagnose, guide, learn, assess, explain, verify, <em>improve.</em>")}</h2></div>
      <p class="lead" data-reveal>${t("Setiap tahap menjawab satu pertanyaan, dan jawabannya menjadi bukti untuk tahap berikutnya. Lalu siklusnya berulang.", "Each stage answers one question, and its answer becomes evidence for the next. Then the cycle begins again.")}</p>
    </div>
    ${cycle(c, { full: true, id: "siklus" })}
  </div>
</section>

<section class="section" aria-labelledby="pr-h">
  <div class="wrap cols">
    <div style="--span:5" data-reveal-group>
      ${label("03", t("Prinsip", "Principles"))}
      <h2 class="h2" id="pr-h" data-reveal>${t("Jujur tentang apa yang diketahui, <em>dan apa yang belum.</em>", "Honest about what is known, <em>and what is not yet.</em>")}</h2>
      <div style="margin-top: var(--s-7)">${evidenceStates(c)}</div>
    </div>
    <ul class="principles" style="--span:6;--start:7">${principles.map(([h, d]) => `<li data-reveal><h3>${h}</h3><p>${d}</p></li>`).join("")}</ul>
  </div>
</section>

${demoBand(c, { next: "features", heading: t("Lihat filosofinya <em>dalam praktik.</em>", "See the philosophy <em>in practice.</em>") })}
`;
  return {
    title: t("Mengapa PINTAR — Keputusan pendidikan layak didukung bukti", "Why PINTAR — Educational decisions deserve evidence"),
    description: t("Mengapa PINTAR ada: masalah bukti di kelas, siklus Petakan–Arahkan–Belajar–Uji–Jelaskan–Verifikasi–Perbaiki, dan prinsip di baliknya.", "Why PINTAR exists: the problem with evidence in class, the Diagnose–Guide–Learn–Assess–Explain–Verify–Improve cycle, and the principles behind it."),
    body,
  };
}
