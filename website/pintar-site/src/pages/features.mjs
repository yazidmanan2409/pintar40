// Fitur / Features: what 4.0 provides (the foundation, in release
// verification), what 4.1 plans, and a brief look further ahead. Each
// chapter starts with what an educator or learner can see and do, then the
// safeguards behind it. Boundaries between versions are stated where a
// reader could otherwise blur them.

import { label, status, demoBand, NAV_LABEL } from "../core.mjs";
import { journey, canonical, lifecycle, whoSees, roles, aiFlow, handoff } from "../diagrams.mjs";

export default function features(c) {
  const t = c.t;
  const facts = (rows) => `<ul class="facts">${rows.map(([b, d]) => `<li><span><b>${b}</b> ${d}</span></li>`).join("")}</ul>`;
  const chapter = (letter, id, heading, lead, diagram, rows) => `<section class="chapter" id="${id}" aria-labelledby="${id}-h">
  <div class="wrap">
    <div class="chapter__head" data-reveal-group>
      <div><p class="chapter__meta"><span class="chapter__letter" aria-hidden="true">${letter}</span>${status(c, "available")}</p><h2 class="h2" id="${id}-h" data-reveal>${heading}</h2></div>
      <p class="lead" data-reveal>${lead}</p>
    </div>
    ${diagram}
    ${facts(rows)}
  </div>
</section>`;

  const body = `
<section class="page-hero" aria-labelledby="feat-hero-h">
  <div class="wrap" data-reveal-group>
    ${label("", NAV_LABEL.features[c.lang])}
    <h1 class="h1" id="feat-hero-h" data-reveal>${t("Fondasi yang kokoh, <em>dan bantuan yang tepat.</em>", "A sound foundation, <em>and the right kind of help.</em>")}</h1>
    <div class="page-hero__aside" data-reveal>
      <p class="lead">${t("PINTAR 4.1: fondasi 4.0 untuk belajar dan mengajar, laporan dan asesmen, materi, serta akun dan institusi, ditambah bantuan AI untuk menyusun soal dan kesinambungan antarperangkat.", "PINTAR 4.1: the 4.0 foundation for learning and teaching, reports and assessment, material, and accounts and institutions, plus AI help with writing questions and continuity across devices.")}</p>
      <div>
        <div class="legend">${status(c, "available", { label: t("4.0 dan 4.1 · Tersedia", "4.0 and 4.1 · Available") })}${status(c, "direction", { label: t("4.5 dan 5.0 · Arah ke depan", "4.5 and 5.0 · Future direction"), note: false })}</div>
      </div>
    </div>
  </div>
</section>

${chapter("A", "belajar-mengajar", t("Langkah berikutnya <em>terlihat jelas.</em>", "The next step <em>is clear.</em>"),
  t("Peserta didik melihat tugasnya dan apa yang perlu dikerjakan berikutnya. Pendidik memberikan materi kepada kelas, melihatnya seperti yang akan dilihat peserta didik, lalu melihat hasilnya.", "Learners see their assignments and what to do next. Educators give material to a class, see it as learners will see it, then see the results."),
  journey(c),
  t([
    ["Pemetaan Awal dan Peta Bacaan Personal", "memberi titik mulai dan urutan bacaan awal. Penyesuaian jalur belajar yang terus-menerus bukan bagian dari 4.0."],
    ["Bantuan bertahap", "saat belajar, sebelum Uji Penguasaan."],
    ["Kelas, rombel, dan periode", "yang tertata, juga untuk institusi besar."],
    ["Pengembangan profesional pendidik:", "keikutsertaan dalam program pelatihan, terpisah dari hasil akademik. Perjalanan pertumbuhan pendidik adalah arah ke depan di 5.0."],
  ], [
    ["The Initial Mapping and the Personal Reading Map", "give a starting point and an initial reading order. Continuously adapting each learner’s path is not part of 4.0."],
    ["Step-by-step help", "while learning, before the Mastery Check."],
    ["Classes, groups and periods", "kept in order, at institutional scale."],
    ["Professional development for educators:", "taking part in training programmes, kept apart from academic results. Educator growth journeys are a future direction, for 5.0."],
  ]))}

${chapter("B", "laporan-asesmen", t("Apa yang sudah bisa disimpulkan, <em>untuk setiap peran.</em>", "What can be concluded, <em>for each role.</em>"),
  t("Laporan menunjukkan penguasaan, soal yang sulit, dan peserta didik yang mungkin perlu bantuan, kepada orang yang berwenang melihatnya, tanpa peringkat.", "Reports show mastery, hard questions and learners who may need help, to the people entitled to see them, without rankings."),
  whoSees(c),
  t([
    ["Laporan per soal:", "berapa yang menjawab tepat dan pilihan mana yang dipilih. Penilaian mutu soal (kesehatan soal) adalah arah ke depan di 4.5."],
    ["Angka ditahan", "bila datanya di bawah ambang sampel minimum metrik itu."],
    ["Satu pengerjaan, satu hasil resmi,", "dengan aturan penilaian yang tercatat sehingga hasilnya dapat dihitung ulang."],
    ["Laporan siap cetak A4, sertifikat dengan pemeriksaan keaslian publik,", "dan Kartu Digital."],
  ], [
    ["Question-level reporting:", "how many answered correctly and which options were chosen. Judging question quality (question health) is a future direction, for 4.5."],
    ["Figures are held back", "when the data falls below that metric’s minimum sample."],
    ["One attempt, one official result,", "with the scoring rules recorded so the result can be recalculated."],
    ["A4-ready reports, certificates with a public authenticity check,", "and a Digital Card."],
  ]))}

${chapter("C", "materi", t("Materi yang ditinjau <em>sebelum dipakai.</em>", "Material reviewed <em>before it is used.</em>"),
  t("Studio Konten dipakai untuk menyusun, meninjau, dan merilis materi. Materi bersama dapat dipakai oleh institusi yang diberi izin, dan setiap institusi dapat menambahkan materinya sendiri.", "The Content Studio is where material is prepared, reviewed and released. Shared material can be used by institutions with permission, and each institution can add its own."),
  `<div class="cols" style="row-gap: var(--s-7)"><div style="--span:6">${canonical(c)}</div><div style="--span:5;--start:8">${lifecycle(c)}</div></div>`,
  t([
    ["Sumber tercatat:", "buku, edisi, dan halamannya, beserta izin pemakaiannya."],
    ["Ditinjau orang kedua", "sebelum dirilis."],
    ["Versi yang dirilis dijaga;", "koreksi menjadi versi baru. Di 4.1, setiap soal juga memiliki riwayat rinci (lihat di bawah)."],
    ["Materi siap pakai", "untuk mata pelajaran dan jenjang tertentu dibicarakan dengan setiap institusi; ketersediaannya tidak dijanjikan di sini."],
  ], [
    ["Sources recorded:", "the book, edition and pages, with the permission to use them."],
    ["Reviewed by a second person", "before release."],
    ["Released versions are kept;", "corrections become new versions. In 4.1 every question also has a detailed history (see below)."],
    ["Ready-to-use material", "for particular subjects and levels is agreed with each institution; its availability is not promised here."],
  ]))}

${chapter("D", "akun-institusi", t("Akun yang mengikuti orangnya, <em>bukan sebaliknya.</em>", "Accounts that follow people, <em>not the other way round.</em>"),
  t("Satu orang dapat belajar, mengajar, dan mengelola di tempat yang berbeda. Institusi menyiapkan akunnya, dan setiap tindakan diperiksa terhadap peran orang itu di tempat ia sedang bekerja.", "One person can learn, teach and manage in different places. The institution sets up the account, and each action is checked against that person’s role where they are working."),
  roles(c),
  t([
    ["Akun dibuat oleh institusi;", "PINTAR tidak menyediakan pendaftaran mandiri."],
    ["Kartu kelas", "untuk peserta didik, hanya untuk belajar."],
    ["Pindah kelas, naik kelas, pindah sekolah, dan purnatugas", "tanpa kehilangan catatan yang perlu dipertahankan."],
    ["Pencabutan akses", "dirancang berlaku pada permintaan berikutnya."],
  ], [
    ["Accounts are created by the institution;", "PINTAR offers no self sign-up."],
    ["Class cards", "for learners, for learning only."],
    ["Class changes, moving up, school transfers and retirement", "without losing records that need to be kept."],
    ["Removed access", "is designed to take effect from the next request."],
  ]))}

<section class="section section--sunk" id="berikutnya" aria-labelledby="next-h">
  <div class="wrap">
    <div class="section-head section-head--split" data-reveal-group>
      <div><div class="caps__head">${label("", t("Baru di 4.1", "New in 4.1"))}${status(c, "available")}</div>
      <h2 class="h2" id="next-h" data-reveal>${t("Bantuan yang tetap <em>di tangan pendidik.</em>", "Help that stays <em>in educators’ hands.</em>")}</h2></div>
      <p class="quote" data-reveal>${t("AI membantu.<br>Pendidik memutuskan.", "AI assists.<br>Educators decide.")}</p>
    </div>
    <div class="cols" style="row-gap: var(--s-9)">
      <div style="--span:12">
        <h3 class="h3" style="margin-bottom: var(--s-3)">${t("Draf soal pilihan ganda dengan bantuan AI", "AI-assisted multiple-choice drafts")}</h3>
        <p class="body measure" style="margin-bottom: var(--s-6)">${t("Untuk menghemat waktu menyusun soal, bukan untuk menggantikan penilaian pendidik.", "To save time writing questions, not to replace an educator’s judgement.")}</p>
        ${aiFlow(c)}
      </div>
      <div style="--span:5">
        <h3 class="h3" style="margin-bottom: var(--s-3)">${t("Riwayat setiap soal", "A history for every question")}</h3>
        <p class="body">${t("Melengkapi versi rilis dari 4.0: setiap draf, revisi, koreksi, dan pengganti soal tercatat, termasuk catatan pendidik tentang miskonsepsi yang ingin diuji. Hasil lama tetap terhubung ke versi soal yang dipakai.", "Building on the released versions from 4.0: every draft, revision, correction and replacement of a question is recorded, including an educator’s note on the misconception it is meant to test. Earlier results stay linked to the version used.")}</p>
      </div>
      <div style="--span:6;--start:7">
        <h3 class="h3" style="margin-bottom: var(--s-3)">${t("Melanjutkan di perangkat lain", "Continuing on another device")}</h3>
        <p class="body" style="margin-bottom: var(--s-5)">${t("Mulai di komputer sekolah, lanjutkan di perangkat lain, tanpa membagikan kata sandi.", "Start on a school computer and carry on elsewhere, without sharing a password.")}</p>
        ${handoff(c)}
      </div>
    </div>
  </div>
</section>

<section class="section" aria-labelledby="later-h">
  <div class="wrap">
    <div class="section-head section-head--split" data-reveal-group>
      <div><div class="caps__head">${label("", t("Lebih jauh", "Further ahead"))}${status(c, "direction")}</div>
      <h2 class="h2" id="later-h" data-reveal>${t("Arah ke depan, <em>bukan janji.</em>", "A future direction, <em>not a promise.</em>")}</h2></div>
      <p class="lead" data-reveal>${t("Tidak ada tanggal atau janji ketersediaan di sini.", "No dates or availability are promised here.")}</p>
    </div>
    <div class="later">
      <div data-reveal><span class="status status--dash"><span class="status__mark" aria-hidden="true"></span><span class="status__label">4.5</span></span>
        <h3>${t("Memahami", "Understand")}</h3>
        <p>${t("Quiet Intelligence: sedikit pengamatan yang dapat dijelaskan dari bukti, kesehatan soal, dan perbandingan dari waktu ke waktu.", "Quiet Intelligence: a few observations drawn from the evidence and explained, question health, and comparisons over time.")}</p></div>
      <div data-reveal><span class="status status--dash"><span class="status__mark" aria-hidden="true"></span><span class="status__label">5.0</span></span>
        <h3>${t("Bertindak dan bertumbuh", "Act and grow")}</h3>
        <p>${t("Perjalanan pertumbuhan pendidik, jalur belajar yang lebih menyesuaikan, dan intervensi yang direncanakan lalu diukur.", "Educator growth journeys, more adaptive learning paths, and interventions that are planned and then measured.")}</p></div>
      <div data-reveal><span class="status status--dash"><span class="status__mark" aria-hidden="true"></span><span class="status__label">5.0+</span></span>
        <h3>${t("Selanjutnya", "Beyond")}</h3>
        <p>${t("Kemungkinan lain hanya dipertimbangkan bila fondasinya tetap terjaga.", "Anything further is considered only while the foundation holds.")}</p></div>
    </div>
  </div>
</section>

${demoBand(c, { heading: t("Lihat fondasinya <em>secara langsung.</em>", "See the foundation <em>for yourself.</em>") })}
`;
  return {
    title: t("Fitur — PINTAR 4.1", "Features — PINTAR 4.1"),
    description: t("PINTAR 4.1: belajar dan mengajar, laporan dan asesmen, materi, akun dan institusi, draf soal dengan bantuan AI yang ditinjau pendidik, dan kesinambungan antarperangkat. Lalu arah ke depan.", "PINTAR 4.1: learning and teaching, reports and assessment, material, accounts and institutions, AI-assisted question drafts reviewed by educators, and continuity across devices. Then the future direction."),
    body,
  };
}
