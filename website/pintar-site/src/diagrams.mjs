// The site's diagrams and infographics, built as native HTML with a little
// SVG. They are text, so they translate, scale, read aloud and stay sharp.
//
// None is a product screenshot. Every illustration with numbers says it uses
// invented data, and every diagram that describes a capability says its
// status. Product names follow the application: in Indonesian «Pemetaan
// Awal», «Peta Bacaan Personal», «Uji Penguasaan»; in English, the
// application's own English names «Initial Mapping», «Personal Reading Map»,
// «Mastery Check».

import { esc } from "./core.mjs";


// D1 · Four things PINTAR connects, and the one thing that connects them.
export function connects(c) {
  const items = c.t(["Pengajaran", "Pembelajaran", "Asesmen", "Keputusan"], ["Teaching", "Learning", "Assessment", "Decisions"]);
  return `<div class="connects" data-reveal>
  <ol class="connects__row" aria-label="${c.t("Yang dihubungkan PINTAR", "What PINTAR connects")}">${items.map((x) => `<li>${x}</li>`).join("")}</ol>
  <p class="connects__by"><span>${c.t("dihubungkan oleh", "connected by")}</span> <b>${c.t("bukti yang dapat ditelusuri", "evidence you can trace")}</b></p>
</div>`;
}

// D0 · The homepage's concrete picture: one class, after a Mastery Check.
// Invented data, the product's own metric names, nothing interpreted for the
// teacher: what to do stays the teacher's decision.
export function classPanel(c) {
  const rows = c.t([["Membandingkan dua pecahan", 48], ["Menyederhanakan pecahan", 67], ["Menjumlahkan pecahan", 85]],
    [["Comparing two fractions", 48], ["Simplifying fractions", 67], ["Adding fractions", 85]]);
  return `<figure class="panel" data-reveal aria-label="${c.t("Ilustrasi ringkasan satu kelas, dengan data rekaan", "Illustration of one class summary, with invented data")}">
  <div class="panel__top"><span class="panel__k">${c.t("Ringkasan kelas", "Class summary")}</span><span class="panel__tag">${c.t("Ilustrasi · data rekaan", "Illustration · invented data")}</span></div>
  <p class="panel__ctx">${c.t("Matematika · Bab 3, Pecahan · Kelas 8B", "Mathematics · Chapter 3, Fractions · Class 8B")}</p>
  <div class="panel__block">
    <p class="panel__h"><span>${c.t("Penguasaan per bagian", "Mastery by part")}</span><span class="panel__k">${c.t("Uji Penguasaan", "Mastery Check")}</span></p>
    <ul class="panel__rows">${rows.map(([n, v]) => `<li><span>${n}</span><b>${v}%</b><i style="--v:${v}%" aria-hidden="true"></i></li>`).join("")}</ul>
    <p class="panel__note">${c.t("Rata-rata penguasaan kelas pada tiap tujuan pembelajaran.", "The class’s average mastery for each learning objective.")}</p>
  </div>
  <div class="panel__block">
    <p class="panel__h"><span>${c.t("Soal yang paling sulit bagi kelas ini", "Questions this class found hardest")}</span></p>
    <ul class="panel__list"><li><span>${c.t("Soal 7", "Question 7")}</span><span>${c.t("9 dari 22 menjawab tepat", "9 of 22 answered correctly")}</span></li>
      <li><span>${c.t("Soal 3", "Question 3")}</span><span>${c.t("12 dari 22 menjawab tepat", "12 of 22 answered correctly")}</span></li></ul>
  </div>
  <div class="panel__block">
    <p class="panel__h"><span>${c.t("Perubahan sejak Pemetaan Awal", "Change since the Initial Mapping")}</span></p>
    <p class="panel__none"><span aria-hidden="true">—</span> ${c.t("Belum cukup data untuk menampilkan angka ini.", "Not enough data to show this figure yet.")}</p>
  </div>
  <figcaption class="panel__foot">${c.t("Pendidik melihat bagian yang perlu diulang. Keputusan tentang langkah berikutnya tetap pada pendidik.", "Educators see which part needs revisiting. The decision about what to do next stays with them.")}</figcaption>
</figure>`;
}

// D2 · The learning cycle: seven stages, then back to the start. Laid out
// as a serpentine on wide screens (1→4 across the top, 5→7 back along the
// bottom, the return beside them), and as a plain sequence on phones. The
// document order is always 1–7 and then the return.
export const CYCLE = [
  { id: "Petakan", en: "Diagnose", q_id: "Apa yang sudah diketahui?", q_en: "What is already known?",
    d_id: "Pemetaan Awal menunjukkan apa yang sudah diketahui peserta didik.", d_en: "The Initial Mapping shows what learners already know." },
  { id: "Arahkan", en: "Guide", q_id: "Dari mana sebaiknya mulai?", q_en: "Where should learning start?",
    d_id: "Peta Bacaan Personal menyarankan urutan bacaan awal.", d_en: "A Personal Reading Map suggests where to start reading." },
  { id: "Belajar", en: "Learn", q_id: "Bagaimana memahaminya?", q_en: "How do I understand it?",
    d_id: "Pelajaran dan latihan, dengan bantuan bertahap bila diperlukan.", d_en: "Lessons and practice, with step-by-step help when needed." },
  { id: "Uji", en: "Assess", q_id: "Apakah sudah dikuasai?", q_en: "Has it been mastered?",
    d_id: "Uji Penguasaan, dengan aturan yang terlihat sebelum mulai.", d_en: "A Mastery Check, with its rules shown before it starts." },
  { id: "Jelaskan", en: "Explain", q_id: "Apa artinya?", q_en: "What does it mean?",
    d_id: "Laporan menunjukkan apa yang sudah bisa disimpulkan, dan kapan buktinya belum cukup.", d_en: "Reports show what can be concluded, and when there is not yet enough evidence." },
  { id: "Verifikasi", en: "Verify", q_id: "Bisakah dipercaya?", q_en: "Can it be trusted?",
    d_id: "Hasil dapat ditelusuri ke materi dan aturan yang dipakai; keaslian sertifikat dapat diperiksa.", d_en: "Results trace back to the material and rules used; a certificate’s authenticity can be checked." },
  { id: "Perbaiki", en: "Improve", q_id: "Apa langkah berikutnya?", q_en: "What comes next?",
    d_id: "Pendidik memutuskan apa yang diulang dan apa yang dilanjutkan.", d_en: "Educators decide what to revisit and what to move on to." },
];

export function cycle(c, { full = false, id = "siklus" } = {}) {
  const L = c.lang;
  const steps = CYCLE.map((s, i) => `<li class="cycle__step" data-step>
      <span class="cycle__n">${String(i + 1).padStart(2, "0")}</span>
      <span class="cycle__name">${s[L]}</span>
      ${full ? `<span class="cycle__q">${L === "id" ? s.q_id : s.q_en}</span>` : ""}
      <span class="cycle__d">${L === "id" ? s.d_id : s.d_en}</span>
    </li>`).join("");
  return `<figure class="cycle${full ? " cycle--full" : ""}" id="${id}">
  <ol class="cycle__grid" data-sequence aria-label="${c.t("Siklus belajar PINTAR: tujuh tahap, lalu kembali ke awal", "The PINTAR learning cycle: seven stages, then back to the start")}">${steps}
    <li class="cycle__return" data-step><span class="cycle__name">${c.t("Kembali ke awal", "Back to the start")}</span><span class="cycle__d">${c.t("dengan bukti yang baru, ke tahap Petakan.", "with new evidence, to Diagnose.")}</span></li>
  </ol>
  <figcaption class="caption">${c.t("Siklus ini adalah cara PINTAR memandang belajar. Pendidik tetap memutuskan di setiap tahap.", "The cycle is how PINTAR approaches learning. Educators make the decisions at every stage.")}</figcaption>
</figure>`;
}

// D5 · Enough evidence, and not enough. The rule shown is the product's:
// every figure has a minimum sample in PINTAR's metric catalogue, and below
// it the report says so instead of showing a number. No threshold is stated,
// because the specification does not publish one.
export function evidenceStates(c) {
  return `<figure class="evstates" data-reveal>
  <div class="evstates__pair">
    <div class="evstate">
      <p class="evstate__k">${c.t("Rata-rata penguasaan pada Uji Penguasaan", "Average mastery on the Mastery Check")}</p>
      <p class="evstate__v">72<span>%</span></p>
      <p class="evstate__n">${c.t("Dari 22 peserta didik yang sudah mengerjakan, dari 24.", "From the 22 of 24 learners who have taken it.")}</p>
      <p class="evstate__tag"><span class="tick" aria-hidden="true"></span>${c.t("Memenuhi ambang sampel minimum angka ini: angka ditampilkan.", "Meets this figure’s minimum sample: the figure is shown.")}</p>
    </div>
    <div class="evstate evstate--thin">
      <p class="evstate__k">${c.t("Rata-rata penguasaan pada Uji Penguasaan", "Average mastery on the Mastery Check")}</p>
      <p class="evstate__v evstate__v--none" aria-label="${c.t("tidak ditampilkan", "not shown")}">—</p>
      <p class="evstate__n">${c.t("Baru 4 dari 24 peserta didik yang mengerjakan.", "Only 4 of 24 learners have taken it.")}</p>
      <p class="evstate__tag"><span class="wait" aria-hidden="true"></span>${c.t("Di bawah ambang: laporan menulis «Belum cukup data untuk menampilkan angka ini.»", "Below the minimum: the report says “Not enough data to show this figure yet.”")}</p>
    </div>
  </div>
  <figcaption class="caption">${c.t("Ilustrasi konsep dengan data rekaan, bukan tangkapan layar. Setiap angka di laporan PINTAR memiliki ambang sampel minimum yang ditetapkan dalam katalog metriknya; ambang itulah yang menentukan apakah sebuah angka ditampilkan. Data yang belum cukup tidak berarti hasilnya lemah.", "A concept illustration with invented data, not a screenshot. Every figure in a PINTAR report has a minimum sample set in its metric catalogue, and that minimum decides whether the figure is shown. Too little data is not a sign of weak results.")}</figcaption>
</figure>`;
}

// D3 · Shared material: prepared once, used by institutions that have permission, data kept apart.
export function canonical(c) {
  const inst = (name) => `<div class="canon__inst">
      <p class="canon__name">${name}</p>
      <p class="canon__item">${c.t("Memakai materi bersama yang sama", "Uses the same shared material")}</p>
      <p class="canon__item">${c.t("Menambahkan materinya sendiri", "Adds its own material")}</p>
      <p class="canon__item canon__item--own">${c.t("Data peserta didiknya hanya terlihat di institusi itu", "Its learners’ data is visible only within it")}</p>
    </div>`;
  return `<figure class="canon" data-reveal>
  <div class="canon__src"><p class="canon__k">${c.t("Materi bersama PINTAR", "Shared PINTAR material")}</p><p class="canon__t">${c.t("Matematika Kelas 8 · Bab 3, dengan sumber dan edisi bukunya tercatat", "Mathematics Year 8 · Chapter 3, with its textbook source and edition recorded")}</p></div>
  <div class="canon__lines" aria-hidden="true"><span></span><span></span></div>
  <div class="canon__insts">${inst(c.t("Institusi A", "Institution A"))}<p class="canon__wall"><span>${c.t("terpisah", "kept apart")}</span></p>${inst(c.t("Institusi B", "Institution B"))}</div>
  <figcaption class="caption">${c.t("Disusun dan ditinjau sekali, lalu dipakai oleh institusi yang diberi izin, tanpa menyalinnya dan tanpa berbagi data peserta didik. Materi apa yang tersedia untuk mata pelajaran dan jenjang tertentu dibicarakan dengan setiap institusi.", "Prepared and reviewed once, then used by institutions with permission, without copying it and without sharing learner data. Which material is available for which subjects and levels is agreed with each institution.")}</figcaption>
</figure>`;
}

// D4 · Publishing: draft to release, and what a correction does.
export function lifecycle(c) {
  const steps = c.t(["Draf", "Ditinjau orang kedua", "Disetujui", "Dirilis"], ["Draft", "Reviewed by a second person", "Approved", "Released"]);
  return `<figure class="life" data-sequence>
  <ol class="life__steps">${steps.map((s, i) => `<li data-step><span class="life__n">${i + 1}</span>${s}</li>`).join("")}</ol>
  <p class="life__back"><span aria-hidden="true">↺</span> ${c.t("Penulis dapat menerima catatan dari peninjau, memperbaikinya, lalu mengajukan lagi.", "The reviewer can send it back with notes; the author corrects it and resubmits.")}</p>
  <div class="life__fix">
    <p><b>${c.t("Versi 1", "Version 1")}</b> ${c.t("Materi yang sudah dirilis dan dipakai tidak diubah.", "Released material that is in use is not edited.")}</p>
    <p class="life__arrow" aria-hidden="true">→</p>
    <p><b>${c.t("Versi 2", "Version 2")}</b> ${c.t("Koreksi menjadi versi baru, dengan alasannya. Hasil yang sudah ada tetap terhubung ke versi 1.", "A correction becomes a new version, with its reason. Existing results stay linked to version 1.")}</p>
  </div>
</figure>`;
}

// D6 · One person, several roles; access follows where they are working.
export function roles(c) {
  const row = (purpose, where, what) => `<li><span class="roles__p">${purpose}</span><span class="roles__w">${where}</span><span class="roles__x">${what}</span></li>`;
  return `<figure class="roles" data-reveal>
  <p class="roles__who">${c.t("Satu orang, beberapa peran", "One person, several roles")}</p>
  <ul class="roles__list">
    ${row(c.t("Mengajar", "Teaching"), c.t("di SMP A", "at School A"), c.t("Kelas 8B, karena ditugaskan mengajar di sana", "Class 8B, because they are assigned to teach there"))}
    ${row(c.t("Mengelola", "Managing"), c.t("di SMP B", "at School B"), c.t("Akun dan kelas, karena ditunjuk sebagai administrator", "Accounts and classes, because they are appointed administrator"))}
    ${row(c.t("Belajar", "Learning"), c.t("di program pengembangan profesional", "in a professional-development programme"), c.t("Kegiatan pelatihannya sendiri", "Their own training"))}
  </ul>
  <figcaption class="caption">${c.t("Ia memilih dengan sengaja di mana sedang bekerja, dan setiap tindakan diperiksa terhadap peran di tempat itu. Akses mengajar di SMP A tidak berlaku di SMP B.", "They choose where they are working, and each action is checked against their role in that place. Access to teach at School A does not apply at School B.")}</figcaption>
</figure>`;
}

// D11 · Who sees what.
export function whoSees(c) {
  const rows = c.t([
    ["Peserta didik", "Hasilnya sendiri, per tujuan pembelajaran, tanpa peringkat."],
    ["Pendidik", "Penguasaan di kelas yang ia ajar, soal yang paling banyak dijawab keliru, dan peserta didik yang mungkin perlu bantuan."],
    ["Pimpinan", "Pola di kelas-kelas dalam wewenangnya, dan angka mana yang sudah memenuhi ambang bukti."],
    ["Pemeriksa sertifikat", "Apakah sertifikat benar diterbitkan dan masih berlaku, siapa penerbitnya, tanggal terbit, dan capaiannya. Bukan nama pemegang atau riwayat belajar."],
  ], [
    ["Learners", "Their own results, by learning objective, without rankings."],
    ["Educators", "Mastery in the classes they teach, the questions most often answered wrongly, and learners who may need help."],
    ["Leadership", "Patterns across the classes they are responsible for, and which figures meet the evidence minimum."],
    ["Certificate checkers", "Whether a certificate was genuinely issued and is still valid, who issued it, when, and the achievement it records. Not the holder’s name or learning record."],
  ]);
  return `<dl class="whosees" data-reveal>${rows.map(([w, s]) => `<div><dt>${w}</dt><dd>${s}</dd></div>`).join("")}</dl>`;
}

// D7 · The layered cross-section. Each safeguard has one explanation and one
// everyday example; the diagram shows only the names, the list explains them.
export const LAYERS = [
  { id: "Identitas dan akses", en: "Identity and access",
    d_id: "Setiap tindakan diperiksa terhadap peran dan tempat yang sedang dipakai, bukan hanya jabatan seseorang.", d_en: "Each action is checked against the role and place someone is working in, not only their job title.",
    x_id: "Guru yang juga administrator di sekolah lain tidak dapat memakai akses mengajarnya di sekolah itu.", x_en: "A teacher who is also an administrator at another school cannot use their teaching access there." },
  { id: "Pemisahan antarinstitusi", en: "Separation between institutions",
    d_id: "Data setiap institusi dipisahkan secara logis di dalam sistem yang sama, dan setiap permintaan diperiksa terhadap institusinya. Materi bersama tidak membawa data peserta didik.", d_en: "Each institution’s data is kept logically separate within the same system, and every request is checked against its institution. Shared material carries no learner data.",
    x_id: "Dua sekolah memakai bab yang sama; tidak satu pun dapat melihat jawaban peserta didik sekolah lain.", x_en: "Two schools use the same chapter; neither can see the other’s learners’ answers." },
  { id: "Integritas asesmen", en: "Assessment integrity",
    d_id: "Kunci jawaban dirancang untuk tidak dikirim ke perangkat peserta didik, dan satu pengerjaan menghasilkan satu hasil resmi.", d_en: "Answer keys are designed to stay off learners’ devices, and one attempt produces one official result.",
    x_id: "Tombol kirim yang tertekan dua kali tetap menghasilkan satu hasil.", x_en: "Pressing submit twice still produces a single result." },
  { id: "Hasil yang dapat dijelaskan", en: "Results that can be explained",
    d_id: "Materi yang sudah dirilis tidak diubah; koreksi menjadi versi baru, sehingga setiap hasil tetap terhubung ke materi dan aturan yang dipakai saat itu. Lama penyimpanan data pribadi diatur terpisah, dalam kebijakan retensi bersama institusi.", d_en: "Released material is not edited; corrections become new versions, so every result stays linked to the material and rules used at the time. How long personal data is kept is a separate matter, set in a retention policy with each institution.",
    x_id: "Bab yang dikoreksi setelah dipakai tidak mengubah arti nilai yang sudah ada.", x_en: "Correcting a chapter after it has been used does not change what existing results mean." },
  { id: "Kesinambungan akun dan institusi", en: "Account and institutional continuity",
    d_id: "Pindah kelas, naik kelas, pindah sekolah, purnatugas, dan pencabutan akses ditangani sebagai tindakan yang jelas, tanpa menghapus catatan yang perlu dipertahankan.", d_en: "Class changes, moving up a year, school transfers, retirement and removed access are handled as deliberate actions, without erasing records that need to be kept.",
    x_id: "Guru yang purnatugas kehilangan akses mengajarnya, sedangkan materi yang ia tulis tetap tercatat atas namanya.", x_en: "A retiring teacher loses their teaching access, while the material they wrote stays in their name." },
  { id: "Tindakan yang tercatat", en: "Recorded actions",
    d_id: "Tindakan penting mencatat siapa, apa, kapan, dan alasannya.", d_en: "Consequential actions record who, what, when and why.",
    x_id: "Bila pimpinan membuka catatan satu peserta didik, tindakan itu tercatat.", x_en: "When a leader opens one learner’s record, that action is recorded." },
  { id: "Privasi", en: "Privacy",
    d_id: "Setiap orang melihat apa yang diperlukan perannya, tidak lebih.", d_en: "Each person sees what their role needs, and no more.",
    x_id: "Halaman verifikasi sertifikat publik menunjukkan apakah sertifikat benar diterbitkan dan masih berlaku, penerbitnya, tanggal terbit, dan capaiannya, tanpa nama pemegang dan tanpa riwayat belajar.", x_en: "The public certificate check shows whether a certificate was genuinely issued and is still valid, its issuer, issue date and achievement, without the holder’s name or learning record." },
];

export function layers(c) {
  const L = c.lang;
  return `<figure class="layers" data-sequence>
  <div class="layers__surface"><span class="layers__k">${c.t("Permukaan", "The surface")}</span><span>${c.t("Satu langkah berikutnya yang jelas", "One clear next step")}</span></div>
  <ol class="layers__list" aria-label="${c.t("Lapisan di bawah antarmuka", "The layers beneath the interface")}">
    ${LAYERS.map((x, i) => `<li data-step style="--d:${i}"><span class="layers__n">${String(i + 1).padStart(2, "0")}</span><span class="layers__name">${x[L]}</span></li>`).join("")}
  </ol>
</figure>`;
}

// D8 · The roadmap, kept brief, with each horizon's status in words.
export function roadmap(c) {
  const rows = [
    ["foundation", "4.0", c.t("Fondasi", "Foundation"), c.t("Belajar dan mengajar, materi, asesmen, laporan, sertifikat, serta akun dan institusi.", "Learning and teaching, material, assessment, reports, certificates, and accounts and institutions.")],
    ["next", "4.1", c.t("Konten dan kesinambungan", "Content and continuity"), c.t("Draf soal dengan bantuan AI yang ditinjau pendidik, riwayat setiap soal, dan melanjutkan pekerjaan di perangkat lain.", "AI-assisted question drafts reviewed by educators, a history for every question, and continuing work on another device.")],
    ["direction", "4.5", c.t("Memahami", "Understand"), c.t("Penafsiran bukti yang lebih dalam, termasuk kesehatan soal.", "Deeper interpretation of evidence, including question health.")],
    ["direction", "5.0", c.t("Bertindak dan bertumbuh", "Act and grow"), c.t("Pertumbuhan pendidik, dan intervensi yang diukur.", "Educator growth, and interventions that are measured.")],
  ];
  const S = { foundation: c.t("Tersedia", "Available"), next: c.t("Tersedia", "Available"), direction: c.t("Arah ke depan, tanpa tanggal", "Future direction, no dates") };
  return `<ol class="roadmap" data-sequence>
  ${rows.map(([k, v, name, d]) => `<li class="roadmap__item roadmap__item--${k}" data-step>
      <span class="roadmap__mark" aria-hidden="true"></span>
      <span class="roadmap__v">${v}</span>
      <span class="roadmap__name">${name}</span>
      <span class="roadmap__d">${d}</span>
      <span class="roadmap__s">${S[k]}</span>
    </li>`).join("")}
</ol>`;
}

// D9 · AI drafts, the educator decides (4.1). The approved workflow, as the
// master specification sets it out (AIQ-01): the educator chooses a permitted
// source and objective; drafts are checked; the educator decides; approved
// items then go through the ordinary review and approval before release.
export function aiFlow(c) {
  const steps = [
    [c.t("Pendidik memilih", "The educator chooses"), c.t("Sumber yang diizinkan dan satu tujuan pembelajaran.", "A permitted source and one learning objective.")],
    [c.t("AI menyusun draf", "AI drafts"), c.t("Soal pilihan ganda, usulan jawaban, penjelasan, dan rujukan ke sumbernya.", "Multiple-choice questions, a proposed answer, an explanation and a reference to the source.")],
    [c.t("Draf diperiksa", "The drafts are checked"), c.t("Format, duplikasi, jawaban yang ambigu, dan kecocokan dengan sumber.", "Format, duplicates, ambiguous answers and fit with the source.")],
    [c.t("Pendidik memutuskan", "The educator decides"), c.t("Mengubah, menolak, atau meminta draf baru.", "Edits, rejects or asks for a new draft."), true],
    [c.t("Persetujuan seperti biasa", "The usual approval"), c.t("Ditinjau orang kedua, disetujui, lalu dirilis. Baru setelah itu dapat ditugaskan.", "Reviewed by a second person, approved, then released. Only then can it be assigned.")],
  ];
  return `<figure class="flow flow--5" data-sequence>
  <ol class="flow__steps">${steps.map(([h, d, human]) => `<li data-step class="${human ? "flow__human" : ""}"><span class="flow__h">${h}</span><span class="flow__d">${d}</span></li>`).join("")}</ol>
  <figcaption class="caption">${c.t("Draf tidak terbit atau ditugaskan dengan sendirinya, dan riwayatnya tercatat. Penyusunan tidak memakai data pribadi peserta didik. Bila layanan AI tidak tersedia, pendidik tetap dapat menulis soal sendiri.", "A draft is not published or assigned on its own, and its history is recorded. Drafting uses no learner’s personal data. If the AI service is unavailable, educators can still write their own questions.")}</figcaption>
</figure>`;
}

// D10 · Continuing on another device (4.1).
export function handoff(c) {
  return `<figure class="handoff" data-reveal>
  <div class="handoff__dev"><span class="handoff__k">${c.t("Perangkat pertama", "First device")}</span><span>${c.t("Pekerjaan tersimpan", "Work saved")}</span></div>
  <div class="handoff__qr" aria-hidden="true"><svg viewBox="0 0 7 7" focusable="false"><path d="M0 0h3v3H0zM4 0h3v3H4zM0 4h3v3H0zM4 4h1v1H4zM6 4h1v1H6zM5 5h1v1H5zM4 6h1v1H4zM6 6h1v1H6z" fill="currentColor"/><path d="M1 1h1v1H1zM5 1h1v1H5zM1 5h1v1H1z" fill="var(--paper)"/></svg></div>
  <div class="handoff__dev"><span class="handoff__k">${c.t("Perangkat kedua", "Second device")}</span><span>${c.t("Melanjutkan dari titik yang sama", "Continues from the same point")}</span></div>
  <figcaption class="caption">${c.t("Kode sekali pakai yang berlaku singkat dan diperiksa ulang saat dipakai. Hanya satu perangkat yang menyimpan jawaban pada satu waktu.", "A short-lived, single-use code, checked again when it is used. Only one device saves answers at a time.")}</figcaption>
</figure>`;
}

// The learning journey strip on the Features page.
export function journey(c) {
  const steps = c.t(["Pemetaan Awal", "Peta Bacaan Personal", "Pelajaran dan latihan", "Uji Penguasaan", "Hasil"], ["Initial Mapping", "Personal Reading Map", "Lessons and practice", "Mastery Check", "Result"]);
  return `<ol class="journey" data-sequence aria-label="${c.t("Perjalanan belajar", "The learning journey")}">${steps.map((s) => `<li data-step>${esc(s)}</li>`).join("")}</ol>`;
}
