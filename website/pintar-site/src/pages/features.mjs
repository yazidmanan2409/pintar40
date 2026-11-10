// Fitur / Features: 4.0 as the foundation in four chapters, 4.1 as what is
// planned next, and a brief, honest look further ahead. Each chapter leads
// with a diagram; the detail is a short list, not a matrix.

import { label, status, demoBand, NAV_LABEL } from "../core.mjs";
import { journey, canonical, lifecycle, whoSees, roles, aiFlow, handoff } from "../diagrams.mjs";

export default function features(c) {
  const t = c.t;
  const facts = (rows) => `<ul class="facts">${rows.map(([b, d]) => `<li><span><b>${b}</b> ${d}</span></li>`).join("")}</ul>`;
  const chapter = (letter, id, heading, lead, diagram, rows) => `<section class="chapter" id="${id}" aria-labelledby="${id}-h">
  <div class="wrap">
    <div class="chapter__head" data-reveal-group>
      <div><span class="chapter__letter" aria-hidden="true">${letter}</span><h2 class="h2" id="${id}-h" data-reveal>${heading}</h2></div>
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
    <h1 class="h1" id="feat-hero-h" data-reveal>${t("Fondasi yang lengkap. <em>Berkembang dengan hati-hati.</em>", "A complete foundation. <em>Growing with care.</em>")}</h1>
    <div class="page-hero__aside" data-reveal>
      <p class="lead">${t("PINTAR 4.0 adalah fondasinya: perjalanan belajar, konten, asesmen, laporan, dan kesinambungan institusi. 4.1 menyusul dengan bantuan penyusunan soal dan kesinambungan antarperangkat.", "PINTAR 4.0 is the foundation: learning journeys, content, assessment, reports and institutional continuity. 4.1 follows, with help drafting questions and continuity across devices.")}</p>
      <div>
        <div class="legend">${status(c, "foundation")}${status(c, "next")}${status(c, "direction", { label: "4.5 · 5.0" })}</div>
        <p class="caption">${t("Status mengikuti bukti verifikasi rilis, bukan rencana. Halaman ini diperbarui ketika sebuah rilis dikonfirmasi.", "Status follows release verification, not plans. This page is updated when a release is confirmed.")}</p>
      </div>
    </div>
  </div>
</section>

<div class="wrap"><div class="caps__head" style="margin:0">${label("", t("Fondasi · 4.0", "Foundation · 4.0"))}${status(c, "foundation")}</div></div>

${chapter("A", "belajar-mengajar", t("Langkah berikutnya selalu jelas.", "The next step is always clear."),
  t("Peserta didik melihat apa yang harus dikerjakan. Pendidik menugaskan materi yang telah dirilis, melihat pratinjau persis seperti peserta didik, lalu melihat buktinya.", "Learners see what to do next. Educators assign released material, preview it exactly as a learner will see it, then see the evidence."),
  journey(c),
  t([
    ["Beranda peserta didik", "dengan tugas, tenggat, dan langkah berikutnya."],
    ["Ruang mengajar", "untuk menugaskan materi kepada kelas yang tepat."],
    ["Kelas, rombel, dan periode", "yang tertata, juga untuk institusi besar."],
    ["Pengembangan profesional pendidik", "di konteksnya sendiri, terpisah dari nilai akademik."],
  ], [
    ["A learner home", "with assignments, deadlines and the next step."],
    ["A teaching space", "for assigning material to the right class."],
    ["Classes, groups and periods", "kept in order, at institutional scale."],
    ["Professional development for educators", "in its own context, apart from academic results."],
  ]))}

${chapter("B", "konten", t("Disusun sekali. Dipakai banyak institusi.", "Prepared once. Used by many institutions."),
  t("Konten kanonik dari buku teks disusun, ditinjau, dan dirilis sekali. Setiap institusi dapat menambah materinya sendiri, tanpa mengubah yang asli.", "Canonical, textbook-derived content is prepared, reviewed and released once. Each institution can add its own material without changing the original."),
  `<div class="cols" style="row-gap: var(--s-7)"><div style="--span:6">${canonical(c)}</div><div style="--span:5;--start:8">${lifecycle(c)}</div></div>`,
  t([
    ["Sumber tercatat:", "buku teks, edisi, dan halamannya."],
    ["Tinjauan orang kedua", "sebelum sesuatu terbit."],
    ["Pratinjau", "memakai pemutar yang sama dengan peserta didik."],
    ["Koreksi menjadi rilis baru;", "hasil yang sudah ada tetap terikat pada versi yang dipakai."],
  ], [
    ["Sources recorded:", "the textbook, its edition and its pages."],
    ["A second person’s review", "before anything is published."],
    ["Preview", "uses the same player the learner uses."],
    ["A correction becomes a new release;", "existing results stay bound to the version used."],
  ]))}

${chapter("C", "asesmen-laporan", t("Satu hasil resmi. Penjelasan untuk setiap peran.", "One official result. An explanation for every role."),
  t("Asesmen menyimpan jawaban dengan andal dan menghasilkan satu hasil resmi. Laporan menjelaskan hasil itu kepada setiap orang sesuai kewenangannya, dan tidak pernah memeringkat peserta didik.", "Assessment saves answers reliably and produces one official result. Reports explain that result to each person within their authority, and never rank learners."),
  whoSees(c),
  t([
    ["Jawaban tersimpan andal;", "pengiriman ganda tetap menghasilkan satu hasil."],
    ["Penilaian yang dapat direproduksi", "dari bukti dan aturan yang sama."],
    ["Kunci jawaban", "tidak pernah dikirim ke perangkat peserta didik."],
    ["Laporan siap cetak A4,", "sertifikat bertanda tangan dengan verifikasi publik, dan Kartu Digital."],
  ], [
    ["Answers saved reliably;", "a double submission still produces one result."],
    ["Scoring that reproduces", "from the same evidence and rules."],
    ["Answer keys", "are never sent to a learner’s device."],
    ["A4-ready reports,", "signed certificates with public verification, and a Digital Card."],
  ]))}

${chapter("D", "identitas", t("Satu orang, banyak peran. Riwayat tetap utuh.", "One person, many roles. The record stays whole."),
  t("Akun disiapkan oleh institusi; tidak ada pendaftaran publik. Setiap orang memilih tempat ia bekerja, dan setiap tindakan diperiksa terhadap kewenangannya di tempat itu.", "Accounts are set up by the institution; there is no public sign-up. Each person chooses where they are working, and every action is checked against their authority there."),
  roles(c),
  t([
    ["Kartu kelas", "untuk peserta didik: hanya untuk belajar, tidak pernah untuk staf."],
    ["Pindah kelas, naik kelas, pindah sekolah, dan purnatugas", "tanpa kehilangan riwayat."],
    ["Pencabutan akses", "dirancang berlaku pada permintaan berikutnya."],
    ["Administrator pertama dan penggantinya", "ditetapkan dengan prosedur yang terjaga."],
  ], [
    ["Class cards", "for learners: for learning only, never for staff."],
    ["Class changes, moving up, school transfers and retirement", "without losing the record."],
    ["Revoked access", "is designed to take effect on the very next request."],
    ["The first administrator and their successors", "appointed through a guarded procedure."],
  ]))}

<section class="section section--sunk" id="berikutnya" aria-labelledby="next-h">
  <div class="wrap">
    <div class="section-head section-head--split" data-reveal-group>
      <div><div class="caps__head">${label("", t("Berikutnya · 4.1", "Next · 4.1"))}${status(c, "next")}</div>
      <h2 class="h2" id="next-h" data-reveal>${t("Bantuan yang tetap di bawah kendali pendidik.", "Assistance that stays under the educator’s control.")}</h2></div>
      <p class="quote" data-reveal>${t("AI membantu.<br>Pendidik memutuskan.", "AI assists.<br>Educators decide.")}</p>
    </div>
    <div class="cols" style="row-gap: var(--s-9)">
      <div style="--span:12">
        <h3 class="h3" style="margin-bottom: var(--s-3)">${t("Draf soal pilihan ganda dengan bantuan AI", "AI-assisted multiple-choice drafts")}</h3>
        <p class="body measure" style="margin-bottom: var(--s-6)">${t("Untuk menghemat waktu menyusun soal, bukan untuk menggantikan penilaian pendidik.", "To save time writing questions, not to replace an educator’s judgement.")}</p>
        ${aiFlow(c)}
      </div>
      <div style="--span:5">
        <h3 class="h3" style="margin-bottom: var(--s-3)">${t("Riwayat setiap soal", "Every question’s history")}</h3>
        <p class="body">${t("Setiap draf, revisi, koreksi, dan pengganti tercatat. Hasil lama tetap terikat pada versi soal yang benar-benar dipakai.", "Every draft, revision, correction and replacement is recorded. Earlier results stay bound to the version of the question actually used.")}</p>
      </div>
      <div style="--span:6;--start:7">
        <h3 class="h3" style="margin-bottom: var(--s-3)">${t("Melanjutkan di perangkat lain", "Continuing on another device")}</h3>
        <p class="body" style="margin-bottom: var(--s-5)">${t("Mulai di komputer sekolah, lanjutkan di perangkat lain, tanpa membagikan kata sandi.", "Start on a school computer, carry on elsewhere, without sharing a password.")}</p>
        ${handoff(c)}
      </div>
    </div>
  </div>
</section>

<section class="section" aria-labelledby="later-h">
  <div class="wrap">
    <div class="section-head section-head--split" data-reveal-group>
      <div><div class="caps__head">${label("", t("Lebih jauh", "Further ahead"))}${status(c, "direction")}</div>
      <h2 class="h2" id="later-h" data-reveal>${t("Arah, bukan janji.", "A direction, not a promise.")}</h2></div>
      <p class="lead" data-reveal>${t("Versi berikutnya dibangun di atas fondasi yang sama, dan hanya bila fondasi itu tetap terjaga. Tidak ada tanggal yang dijanjikan di sini.", "Later versions build on the same foundation, and only while that foundation holds. No dates are promised here.")}</p>
    </div>
    <div class="later">
      <div data-reveal><span class="status status--dash"><span class="status__mark" aria-hidden="true"></span><span class="status__label">4.5</span></span>
        <h3>${t("Memahami", "Understand")}</h3>
        <p>${t("Quiet Intelligence: sedikit pengamatan yang bermakna, dengan dasar bukti yang dapat diperiksa.", "Quiet Intelligence: a few meaningful observations, with an evidence basis anyone entitled can inspect.")}</p>
        <ul><li>${t("Kesehatan soal dan sebaran jawaban", "Question health and answer distributions")}</li><li>${t("Bukti dari waktu ke waktu, dengan batas perbandingannya", "Evidence over time, with the limits of comparison shown")}</li><li>${t("Evaluasi pendidik yang tergovernansi dan dapat ditanggapi", "Governed educator evaluation, open to response")}</li></ul></div>
      <div data-reveal><span class="status status--dash"><span class="status__mark" aria-hidden="true"></span><span class="status__label">5.0</span></span>
        <h3>${t("Bertindak dan bertumbuh", "Act and grow")}</h3>
        <p>${t("Dari bukti menuju tindakan yang direncanakan, dijalankan, lalu diukur dengan jujur.", "From evidence to action that is planned, carried out, then honestly measured.")}</p>
        <ul><li>${t("Menyusun perjalanan belajar dari tujuan pendidik", "Composing learning journeys from an educator’s intent")}</li><li>${t("Perjalanan pertumbuhan pendidik", "Educator growth journeys")}</li><li>${t("Intervensi dengan ukuran keberhasilan yang jelas", "Interventions with clear measures of success")}</li></ul></div>
      <div data-reveal><span class="status status--dash"><span class="status__mark" aria-hidden="true"></span><span class="status__label">5.0+</span></span>
        <h3>${t("Selanjutnya", "Beyond")}</h3>
        <p>${t("Kemungkinan yang dipertimbangkan, belum direncanakan.", "Possibilities under consideration, not yet planned.")}</p>
        <ul><li>${t("Interoperabilitas dan kredensial portabel", "Interoperability and portable credentials")}</li><li>${t("Bekerja dengan koneksi terbatas", "Working with limited connectivity")}</li><li>${t("Riset pembelajaran yang tergovernansi", "Governed learning research")}</li></ul></div>
    </div>
  </div>
</section>

${demoBand(c, { heading: t("Lihat fondasinya secara langsung.", "See the foundation for yourself.") })}
`;
  return {
    title: t("Fitur — PINTAR 4.0 dan 4.1", "Features — PINTAR 4.0 and 4.1"),
    description: t("Fondasi PINTAR 4.0: belajar dan mengajar, konten tergovernansi, asesmen dan laporan, identitas dan kesinambungan. Lalu 4.1 dan arah selanjutnya.", "The PINTAR 4.0 foundation: learning and teaching, governed content, assessment and reports, identity and continuity. Then 4.1, and the direction beyond."),
    body,
  };
}
