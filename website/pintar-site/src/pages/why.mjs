// Mengapa PINTAR / Why PINTAR: the problem, the philosophy, the cycle and
// what makes PINTAR different. Visually led: three observations, the full
// cycle, one concept illustration and one comparison.

import { label, photo, demoBand, NAV_LABEL } from "../core.mjs";
import { cycle, evidenceStates, difference } from "../diagrams.mjs";

export default function why(c) {
  const t = c.t;
  const obs = t([
    ["Nilai mencatat hasil, bukan penyebabnya.", "Dua peserta didik dengan nilai yang sama bisa membutuhkan bantuan yang sangat berbeda."],
    ["Data yang sedikit tampak seperti kelemahan.", "Tanpa batas bukti yang jelas, kelas kecil atau tugas yang belum selesai mudah disalahartikan."],
    ["Bukti tersebar, dan mudah terputus.", "Ketika orang pindah, naik kelas, atau berganti tugas, riwayat belajar sering ikut terputus."],
  ], [
    ["A score records an outcome, not its cause.", "Two learners with the same score may need very different help."],
    ["Thin data looks like weakness.", "Without a clear threshold for evidence, a small class or unfinished work is easily misread."],
    ["Evidence is scattered, and easily broken.", "When people transfer, move up a year or change roles, the learning record often breaks with them."],
  ]);
  const principles = t([
    ["Pendidik memutuskan.", "PINTAR menunjukkan bukti dan batasnya. Keputusan tentang peserta didik tetap pada manusia yang berwenang."],
    ["Tanpa peringkat.", "Laporan menjelaskan pembelajaran. Laporan tidak mengurutkan anak dari yang terbaik hingga terburuk."],
    ["Belum cukup, bukan lemah.", "Bila buktinya belum cukup, PINTAR mengatakannya, dan tidak menampilkan angka yang menyesatkan."],
    ["Riwayat tidak ditulis ulang.", "Koreksi dicatat sebagai versi baru beserta alasannya. Yang sudah terjadi tetap dapat dijelaskan."],
  ], [
    ["Educators decide.", "PINTAR shows the evidence and its limits. Decisions about learners stay with the people entitled to make them."],
    ["No rankings.", "Reports explain learning. They do not order children from best to worst."],
    ["Not enough is not weak.", "When the evidence is not yet enough, PINTAR says so, rather than show a misleading figure."],
    ["History is never rewritten.", "A correction is recorded as a new version, with its reason. What happened can still be explained."],
  ]);

  const body = `
<section class="page-hero" aria-labelledby="why-hero-h">
  <div class="wrap" data-reveal-group>
    ${label("", NAV_LABEL.why[c.lang])}
    <h1 class="h1" id="why-hero-h" data-reveal>${t("Setiap keputusan pendidikan layak didukung <em>bukti.</em>", "Every educational decision deserves <em>evidence.</em>")}</h1>
    <div class="page-hero__aside" data-reveal>
      <p class="lead">${t("Pertanyaan terpenting di sekolah jarang terjawab oleh angka saja: apa yang sudah dikuasai, siapa yang perlu bantuan, dan apa yang sebaiknya dilakukan berikutnya. PINTAR ada untuk menjawabnya, dengan jujur.", "The most important questions in a school are rarely answered by numbers alone: what has been mastered, who needs help, and what should happen next. PINTAR exists to answer them, honestly.")}</p>
    </div>
  </div>
  <div class="wrap wrap--wide" style="margin-top: var(--s-8)" data-reveal>${photo(c, "P7")}</div>
</section>

<section class="section section--rule" aria-labelledby="obs-h">
  <div class="wrap">
    <div class="section-head" data-reveal-group>${label("01", t("Masalahnya", "The problem"))}
      <h2 class="h2" id="obs-h" data-reveal>${t("Tiga hal yang membuat bukti sulit dipercaya.", "Three things that make evidence hard to trust.")}</h2></div>
    <ol class="observations">${obs.map(([h, d], i) => `<li data-reveal><span class="observations__n">${String(i + 1).padStart(2, "0")}</span><h3 class="observations__h">${h}</h3><p class="observations__d">${d}</p></li>`).join("")}</ol>
  </div>
</section>

<section class="section section--sunk" aria-labelledby="loop-h" id="siklus-lengkap">
  <div class="wrap">
    <div class="section-head section-head--split" data-reveal-group>
      <div>${label("02", t("Filosofi belajar", "The learning philosophy"))}
      <h2 class="h2" id="loop-h" data-reveal>${t("Petakan. Arahkan. Belajar. Uji. Jelaskan. Verifikasi. Perbaiki.", "Diagnose. Guide. Learn. Assess. Explain. Verify. Improve.")}</h2></div>
      <p class="lead" data-reveal>${t("Setiap tahap menghasilkan bukti untuk tahap berikutnya. Siklus ini berulang, dan pendidik memegang keputusannya.", "Each stage produces evidence for the next. The cycle repeats, and educators hold the decisions.")}</p>
    </div>
    ${cycle(c, { full: true, id: "siklus" })}
  </div>
</section>

<section class="section" aria-labelledby="pr-h">
  <div class="wrap cols">
    <div style="--span:5" data-reveal-group>
      ${label("03", t("Prinsip", "Principles"))}
      <h2 class="h2" id="pr-h" data-reveal>${t("Jujur tentang apa yang diketahui, dan apa yang belum.", "Honest about what is known, and what is not yet.")}</h2>
      <div style="margin-top: var(--s-7)">${evidenceStates(c)}</div>
    </div>
    <ul class="principles" style="--span:6;--start:7">${principles.map(([h, d]) => `<li data-reveal><h3>${h}</h3><p>${d}</p></li>`).join("")}</ul>
  </div>
</section>

<section class="section section--rule" aria-labelledby="diff-h">
  <div class="wrap cols">
    <div style="--span:5" data-reveal-group>
      ${label("04", t("Yang membedakan", "What is different"))}
      <h2 class="h2" id="diff-h" data-reveal>${t("Bukan sekadar sistem pembelajaran, perpustakaan konten, atau ujian daring.", "Not just a learning system, a content library or an online exam.")}</h2>
    </div>
    <div style="--span:6;--start:7">${difference(c)}
      <p class="body" style="margin-top: var(--s-6)" data-reveal>${t("PINTAR juga menjaga hal-hal yang membuat pekerjaan pendidikan dapat diandalkan dari tahun ke tahun: siapa boleh melakukan apa, riwayat yang tetap utuh, dan institusi yang tetap berjalan saat orang datang dan pergi.", "PINTAR also looks after what makes educational work dependable year after year: who may do what, a record that stays whole, and an institution that keeps running as people come and go.")}</p>
    </div>
  </div>
</section>

${demoBand(c, { heading: t("Lihat filosofinya bekerja.", "See the philosophy at work.") })}
`;
  return {
    title: t("Mengapa PINTAR — Setiap keputusan pendidikan layak didukung bukti", "Why PINTAR — Every educational decision deserves evidence"),
    description: t("Mengapa PINTAR ada: masalah bukti di sekolah, siklus Petakan–Arahkan–Belajar–Uji–Jelaskan–Verifikasi–Perbaiki, dan prinsip yang membedakannya.", "Why PINTAR exists: the problem with evidence in schools, the Diagnose–Guide–Learn–Assess–Explain–Verify–Improve cycle, and the principles that set it apart."),
    body,
  };
}
