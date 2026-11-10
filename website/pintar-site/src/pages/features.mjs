// Fitur / Features: what people can accomplish with PINTAR 4.1, one
// capability per section. Each section reads the way Who It's For does: a
// label, a sensibly sized headline, the explanation directly under it, a few
// well-spaced benefit rows, and one focal visual. The compositions vary
// (visual right, visual left, full-width diagram, a band) within one system.
// Version history and the future direction sit together at the end.

import { label, demoBand, NAV_LABEL } from "../core.mjs";
import { journey, reportView, lifecycle, roles, aiFlow, roadmap } from "../diagrams.mjs";

export default function features(c) {
  const t = c.t;
  const isNew = `<span class="tag">${t("Baru di 4.1", "New in 4.1")}</span>`;
  const rows = (items) => `<ol class="aud__list feat__list">${items.map(([b, d, n], k) => `<li data-reveal><span>${String(k + 1).padStart(2, "0")}</span><span><b>${b}</b> ${d}${n ? ` ${isNew}` : ""}</span></li>`).join("")}</ol>`;
  const head = (n, key, lab, h, intro, extra = "") => `<p class="aud__role">${n} · ${lab}${extra}</p>
      <h2 class="h2 feat__h" id="${key}-h" data-reveal>${h}</h2>
      ${intro ? `<p class="feat__intro" data-reveal>${intro}</p>` : ""}`;

  const S = {
    learn: { id: "belajar-mengajar", lab: t("Belajar dan mengajar", "Learning and teaching") },
    report: { id: "laporan-asesmen", lab: t("Laporan dan asesmen", "Reports and assessment") },
    studio: { id: "studio-konten", lab: t("Studio Konten", "Content Studio") },
    acct: { id: "akun-institusi", lab: t("Akun dan institusi", "Accounts and institutions") },
    ai: { id: "draf-ai", lab: t("Draf soal dengan bantuan AI", "AI-assisted question drafts") },
    ahead: { id: "arah", lab: t("Ke depan", "What comes next") },
  };

  const body = `
<section class="page-hero" aria-labelledby="feat-hero-h">
  <div class="wrap" data-reveal-group>
    ${label("", NAV_LABEL.features[c.lang])}
    <h1 class="h1" id="feat-hero-h" data-reveal>${t("Yang dapat Anda kerjakan <em>dengan PINTAR.</em>", "What you can do <em>with PINTAR.</em>")}</h1>
    <div class="page-hero__aside" data-reveal>
      <p class="lead">${t("Peserta didik belajar dengan langkah yang jelas, pendidik memahami buktinya, dan institusi menjaga materi serta akunnya tetap tertata.", "Learners work with a clear next step, educators understand the evidence, and institutions keep their material and accounts in order.")}</p>
    </div>
  </div>
  <nav class="wrap" style="margin-top: var(--s-8)" aria-label="${t("Isi halaman", "On this page")}"><div class="anchors">${Object.values(S).map((x) => `<a href="#${x.id}">${x.lab}</a>`).join("")}</div></nav>
</section>

<section class="feat" id="${S.learn.id}" aria-labelledby="${S.learn.id}-h">
  <div class="wrap cols">
    <div class="feat__text" style="--span:5" data-reveal-group>
      ${head("01", S.learn.id, S.learn.lab, t("Setiap peserta didik tahu <em>langkah berikutnya.</em>", "Every learner knows <em>the next step.</em>"),
        t("Peserta didik melihat tugasnya dan apa yang perlu dikerjakan berikutnya. Pendidik menugaskan materi, melihatnya seperti yang dilihat peserta didik, lalu melihat hasilnya.", "Learners see their assignments and what to do next. Educators assign material, see it as learners will, then see the results."))}
      ${rows(t([
        ["Titik mulai yang jelas:", "Pemetaan Awal, lalu Peta Bacaan Personal yang menyarankan urutan bacaan awal."],
        ["Bantuan bertahap", "saat belajar: arah berpikir lebih dulu, lalu langkah demi langkah."],
        ["Melanjutkan di perangkat lain", "dengan kode sekali pakai, tanpa membagikan kata sandi.", true],
        ["Kelas, rombel, dan periode", "yang tertata, juga untuk institusi besar."],
      ], [
        ["A clear starting point:", "the Initial Mapping, then a Personal Reading Map that suggests where to start reading."],
        ["Step-by-step help", "while learning: a direction to think in first, then one step at a time."],
        ["Continue on another device", "with a single-use code, without sharing a password.", true],
        ["Classes, groups and periods", "kept in order, at any scale."],
      ]))}
    </div>
    <div class="feat__visual" style="--span:6;--start:7">${journey(c)}</div>
  </div>
</section>

<section class="feat feat--flip" id="${S.report.id}" aria-labelledby="${S.report.id}-h">
  <div class="wrap cols">
    <div class="feat__text" style="--span:5;--start:8" data-reveal-group>
      ${head("02", S.report.id, S.report.lab, t("Laporan yang membantu <em>menyiapkan pelajaran berikutnya.</em>", "Reports that help <em>prepare the next lesson.</em>"),
        t("Pendidik melihat tujuan mana yang sudah kuat, soal mana yang sulit, dan jawaban yang paling sering dipilih. Pimpinan melihat pola di kelas-kelas dalam wewenangnya. Tanpa peringkat.", "Educators see which objectives are strong, which questions were hard and which answers were chosen most. Leaders see patterns across the classes they are responsible for. No rankings."))}
      ${rows(t([
        ["Laporan per soal:", "berapa yang menjawab benar dan jawaban mana yang dipilih."],
        ["Angka yang jelas dasarnya:", "bila datanya belum cukup, laporan mengatakannya."],
        ["Satu pengerjaan, satu hasil resmi,", "dengan aturan penilaian yang tercatat."],
        ["Laporan siap cetak A4", "dan sertifikat yang keasliannya dapat diperiksa."],
      ], [
        ["Question-level reports:", "how many answered correctly and which answers were chosen."],
        ["Figures with a clear basis:", "when there is not yet enough data, the report says so."],
        ["One attempt, one official result,", "with its scoring rules recorded."],
        ["A4-ready reports", "and certificates whose authenticity can be checked."],
      ]))}
    </div>
    <div class="feat__visual" style="--span:6;--start:1">${reportView(c)}</div>
  </div>
</section>

<section class="feat feat--wide" id="${S.studio.id}" aria-labelledby="${S.studio.id}-h">
  <div class="wrap">
    <div class="feat__text feat__text--split" data-reveal-group>
      <div>${head("03", S.studio.id, S.studio.lab, t("Materi yang ditinjau, <em>dan tetap dapat dijelaskan.</em>", "Material that is reviewed, <em>and stays explainable.</em>"), "")}</div>
      <p class="feat__intro" data-reveal>${t("Di Studio Konten, materi disusun, ditinjau orang kedua, lalu dirilis. Institusi yang diberi izin memakai materi bersama yang sama, dan dapat menambahkan materinya sendiri.", "In the Content Studio, material is prepared, reviewed by a second person, then released. Institutions with permission use the same shared material, and can add their own.")}</p>
    </div>
    <div class="feat__visual">${lifecycle(c)}</div>
    <ul class="feat__trio">${t([
      ["Sumber tercatat", "Buku, edisi, dan halamannya, beserta izin pemakaiannya."],
      ["Versi yang dirilis dijaga", "Koreksi menjadi versi baru, sehingga hasil yang lama tetap dapat dijelaskan."],
      ["Riwayat setiap soal", "Setiap draf, revisi, dan koreksi tercatat, termasuk catatan pendidik tentang miskonsepsi yang ingin diuji.", true],
    ], [
      ["Sources recorded", "The book, edition and pages, with permission to use them."],
      ["Released versions kept", "A correction becomes a new version, so earlier results can still be explained."],
      ["A history for every question", "Every draft, revision and correction is recorded, including the educator’s note on the misconception it is meant to test.", true],
    ]).map(([h, d, n]) => `<li data-reveal><h3>${h}${n ? ` ${isNew}` : ""}</h3><p>${d}</p></li>`).join("")}</ul>
  </div>
</section>

<section class="feat" id="${S.acct.id}" aria-labelledby="${S.acct.id}-h">
  <div class="wrap cols">
    <div class="feat__text" style="--span:5" data-reveal-group>
      ${head("04", S.acct.id, S.acct.lab, t("Akun yang mengikuti orangnya, <em>dari tahun ke tahun.</em>", "Accounts that follow people, <em>year after year.</em>"),
        t("Satu orang dapat belajar, mengajar, dan mengelola di tempat yang berbeda dengan satu akun. Institusi menyiapkan akunnya dan menugaskan perannya.", "One person can learn, teach and manage in different places with one account. The institution sets up the account and assigns the roles."))}
      ${rows(t([
        ["Akun dibuat oleh institusi,", "dengan peran yang ditugaskan di setiap tempat."],
        ["Kartu kelas", "untuk masuk belajar, yang dapat diganti bila hilang."],
        ["Pindah kelas, naik kelas, pindah sekolah, dan purnatugas", "tanpa kehilangan catatan yang perlu dipertahankan."],
        ["Program pengembangan profesional", "yang diikuti pendidik, terpisah dari hasil akademik."],
      ], [
        ["Accounts are created by the institution,", "with roles assigned in each place."],
        ["Class cards", "for signing in to learn, replaceable if lost."],
        ["Class changes, moving up, school transfers and retirement", "without losing records that need to be kept."],
        ["Professional-development programmes", "that educators take part in, kept apart from academic results."],
      ]))}
    </div>
    <div class="feat__visual" style="--span:6;--start:7">${roles(c)}</div>
  </div>
</section>

<section class="feat feat--band section--sunk" id="${S.ai.id}" aria-labelledby="${S.ai.id}-h">
  <div class="wrap">
    <div class="feat__text feat__text--split" data-reveal-group>
      <div>${head("05", S.ai.id, S.ai.lab, t("AI membantu. <em>Pendidik memutuskan.</em>", "AI assists. <em>Educators decide.</em>"), "", ` ${isNew}`)}</div>
      <p class="feat__intro" data-reveal>${t("AI menyusun draf soal pilihan ganda dari sumber dan tujuan yang dipilih pendidik, untuk menghemat waktu. Pendidik memeriksa, mengubah, atau menolaknya, dan soal yang diterima tetap ditinjau orang kedua sebelum dirilis.", "AI drafts multiple-choice questions from the source and objective an educator chooses, to save time. The educator checks, edits or rejects them, and an accepted question is still reviewed by a second person before release.")}</p>
    </div>
    <div class="feat__visual">${aiFlow(c)}</div>
  </div>
</section>

<section class="feat feat--wide" id="${S.ahead.id}" aria-labelledby="${S.ahead.id}-h">
  <div class="wrap">
    <div class="feat__text feat__text--split" data-reveal-group>
      <div>${head("06", S.ahead.id, t("Versi dan arah ke depan", "Versions and the future direction"), t("Hari ini, <em>dan ke depan.</em>", "Today, <em>and what comes next.</em>"), "")}</div>
      <p class="feat__intro" data-reveal>${t("PINTAR 4.1 menggabungkan fondasi 4.0 dengan bantuan baru untuk menyusun konten. Arah ke depan belum memiliki tanggal dan dapat berubah.", "PINTAR 4.1 brings together the 4.0 foundation and new help with preparing content. The future direction has no dates yet and may change.")}</p>
    </div>
    ${roadmap(c)}
  </div>
</section>

${demoBand(c, { heading: t("Lihat semuanya <em>bekerja bersama.</em>", "See it all <em>working together.</em>") })}
`;
  return {
    title: t("Fitur — PINTAR 4.1", "Features — PINTAR 4.1"),
    description: t("Yang dapat dikerjakan dengan PINTAR 4.1: belajar dan mengajar, laporan dan asesmen, Studio Konten, akun dan institusi, serta draf soal dengan bantuan AI yang diputuskan pendidik.", "What you can do with PINTAR 4.1: learning and teaching, reports and assessment, the Content Studio, accounts and institutions, and AI-assisted question drafts that educators decide on."),
    body,
  };
}
