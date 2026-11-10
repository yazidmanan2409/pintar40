// The site's diagrams and infographics, built as native HTML with a little
// SVG for lines. They are text, so they translate, scale, read aloud and stay
// sharp. Each one replaces paragraphs; none is decoration.
//
// None of these is a product screenshot. Where a diagram shows an evidence
// state, it says so: «Ilustrasi konsep».

import { esc } from "./core.mjs";

// D1 · Four things PINTAR connects, and the one thing that connects them.
export function connects(c) {
  const items = c.t(["Pengajaran", "Pembelajaran", "Asesmen", "Keputusan"], ["Teaching", "Learning", "Assessment", "Decisions"]);
  return `<div class="connects" data-reveal>
  <ol class="connects__row" aria-label="${c.t("Yang dihubungkan PINTAR", "What PINTAR connects")}">${items.map((x) => `<li>${x}</li>`).join("")}</ol>
  <p class="connects__by"><span>${c.t("dihubungkan oleh", "connected by")}</span> <b>${c.t("bukti yang dapat ditelusuri", "evidence you can trace")}</b></p>
</div>`;
}

// D2 · The learning cycle. `full` adds the question each stage answers and
// what happens in PINTAR at that stage.
export const CYCLE = [
  { id: "Petakan", en: "Diagnose", q_id: "Apa yang sudah diketahui?", q_en: "What is already known?",
    s_id: "Pemetaan Awal menunjukkan apa yang sudah diketahui.", s_en: "An initial mapping shows what is already known.",
    d_id: "Pemetaan Awal sebelum belajar dimulai.", d_en: "An initial mapping before learning begins." },
  { id: "Arahkan", en: "Guide", q_id: "Dari mana sebaiknya mulai?", q_en: "Where should learning start?",
    s_id: "Setiap peserta didik mendapat urutan belajar yang sesuai.", s_en: "Each learner gets a sequence that fits.",
    d_id: "Peta Bacaan Personal menyusun urutan belajar.", d_en: "A personal reading map orders what to learn." },
  { id: "Belajar", en: "Learn", q_id: "Bagaimana memahaminya?", q_en: "How do I understand it?",
    s_id: "Materi dan latihan, dengan bantuan bertahap.", s_en: "Lessons and practice, with step-by-step help.",
    d_id: "Pelajaran dan latihan, dengan bantuan yang diberikan bertahap.", d_en: "Lessons and practice, with help given one step at a time." },
  { id: "Uji", en: "Assess", q_id: "Apakah sudah dikuasai?", q_en: "Has it been mastered?",
    s_id: "Uji Penguasaan dengan aturan yang jelas.", s_en: "A mastery test with clear rules.",
    d_id: "Uji Penguasaan, dengan aturan yang terlihat sebelum mulai dan satu hasil resmi.", d_en: "A mastery test whose rules are shown before it starts, with one official result." },
  { id: "Jelaskan", en: "Explain", q_id: "Apa artinya?", q_en: "What does it mean?",
    s_id: "Laporan menjelaskan apa yang didukung bukti.", s_en: "Reports explain what the evidence supports.",
    d_id: "Laporan untuk setiap peran, yang membedakan «belum cukup bukti» dari «lemah».", d_en: "Reports for every role that tell “not enough evidence yet” apart from “weak”." },
  { id: "Verifikasi", en: "Verify", q_id: "Bisakah dipercaya?", q_en: "Can it be trusted?",
    s_id: "Hasil dapat ditelusuri; sertifikat dapat diperiksa.", s_en: "Results can be traced; certificates can be checked.",
    d_id: "Setiap hasil tertelusur ke materi dan aturan yang dipakai; keaslian sertifikat dapat diperiksa siapa pun.", d_en: "Every result traces to the material and rules used; anyone can check a certificate is genuine." },
  { id: "Perbaiki", en: "Improve", q_id: "Apa langkah berikutnya?", q_en: "What comes next?",
    s_id: "Pendidik memutuskan langkah berikutnya.", s_en: "Educators decide what comes next.",
    d_id: "Pendidik dan pimpinan memutuskan langkah berikutnya, dengan bukti di depan mereka.", d_en: "Educators and leaders decide the next step, with the evidence in front of them." },
];

export function cycle(c, { full = false, id = "siklus" } = {}) {
  const L = c.lang;
  const steps = CYCLE.map((s, i) => `<li class="cycle__step" data-step>
      <span class="cycle__n">${String(i + 1).padStart(2, "0")}</span>
      <span class="cycle__name">${s[L]}</span>
      ${full ? `<span class="cycle__q">${L === "id" ? s.q_id : s.q_en}</span>` : ""}
      <span class="cycle__d">${full ? (L === "id" ? s.d_id : s.d_en) : (L === "id" ? s.s_id : s.s_en)}</span>
    </li>`).join("");
  return `<div class="cycle${full ? " cycle--full" : ""}" id="${id}" data-sequence>
  <ol class="cycle__steps" aria-label="${c.t("Siklus belajar PINTAR, tujuh tahap", "The PINTAR learning cycle, seven stages")}">${steps}</ol>
  <div class="cycle__return" aria-hidden="true">
    <svg viewBox="0 0 1000 40" preserveAspectRatio="none" focusable="false"><path d="M985 2 V22 Q985 34 973 34 H27 Q15 34 15 22 V2" fill="none" stroke="currentColor" stroke-width="1.25" vector-effect="non-scaling-stroke"/><path d="M9 10 L15 2 L21 10" fill="none" stroke="currentColor" stroke-width="1.25" vector-effect="non-scaling-stroke"/></svg>
  </div>
  <p class="cycle__again">${c.t("Lalu kembali ke awal, dengan bukti yang baru.", "Then back to the start, with new evidence.")}</p>
</div>`;
}

// D5 · The difference between enough evidence and not enough.
export function evidenceStates(c) {
  return `<figure class="evstates" data-reveal>
  <div class="evstates__pair">
    <div class="evstate">
      <p class="evstate__k">${c.t("Penguasaan kelas", "Class mastery")}</p>
      <p class="evstate__v">72<span>%</span></p>
      <p class="evstate__n">${c.t("22 dari 24 peserta didik sudah mengerjakan", "22 of 24 learners have taken it")}</p>
      <p class="evstate__tag"><span class="tick" aria-hidden="true"></span>${c.t("Cukup untuk disimpulkan", "Enough to draw a conclusion")}</p>
    </div>
    <div class="evstate evstate--thin">
      <p class="evstate__k">${c.t("Penguasaan kelas", "Class mastery")}</p>
      <p class="evstate__v evstate__v--none">—</p>
      <p class="evstate__n">${c.t("4 dari 24 peserta didik sudah mengerjakan", "4 of 24 learners have taken it")}</p>
      <p class="evstate__tag"><span class="wait" aria-hidden="true"></span>${c.t("Belum cukup bukti — bukan berarti lemah", "Not enough evidence yet — not a sign of weakness")}</p>
    </div>
  </div>
  <figcaption class="caption">${c.t("Ilustrasi konsep, bukan tangkapan layar produk. PINTAR menahan angka yang belum didukung cukup bukti, alih-alih menampilkan angka yang menyesatkan.", "A concept illustration, not a product screenshot. PINTAR withholds a figure the evidence cannot yet support, rather than show a misleading one.")}</figcaption>
</figure>`;
}

// D3 · One canonical release, many institutions, evidence kept apart.
export function canonical(c) {
  const inst = (name) => `<div class="canon__inst">
      <p class="canon__name">${name}</p>
      <p class="canon__item">${c.t("Memakai rilis yang sama", "Uses the same release")}</p>
      <p class="canon__item">${c.t("Menambah materinya sendiri", "Adds its own material")}</p>
      <p class="canon__item canon__item--own">${c.t("Bukti peserta didiknya hanya miliknya", "Its learners’ evidence is its own")}</p>
    </div>`;
  return `<figure class="canon" data-reveal>
  <div class="canon__src"><p class="canon__k">${c.t("Rilis kanonik", "Canonical release")}</p><p class="canon__t">${c.t("Matematika Kelas 8 · Bab 3, edisi buku teks yang dicatat", "Mathematics Year 8 · Chapter 3, with its textbook edition recorded")}</p></div>
  <div class="canon__lines" aria-hidden="true"><span></span><span></span></div>
  <div class="canon__insts">${inst(c.t("Institusi A", "Institution A"))}<p class="canon__wall"><span>${c.t("terpisah", "kept apart")}</span></p>${inst(c.t("Institusi B", "Institution B"))}</div>
  <figcaption class="caption">${c.t("Disusun sekali, ditinjau sekali, dipakai banyak institusi, tanpa menyalin dan tanpa berbagi data peserta didik.", "Prepared once, reviewed once, used by many institutions, without copies and without sharing learners’ data.")}</figcaption>
</figure>`;
}

// D4 · Governed publishing: the path from draft to release, and what a correction does.
export function lifecycle(c) {
  const steps = c.t(["Draf", "Ditinjau orang kedua", "Disetujui", "Dibekukan dan dirilis"], ["Draft", "Reviewed by a second person", "Approved", "Frozen and released"]);
  return `<figure class="life" data-sequence>
  <ol class="life__steps">${steps.map((s, i) => `<li data-step><span class="life__n">${i + 1}</span>${s}</li>`).join("")}</ol>
  <p class="life__back"><span aria-hidden="true">↺</span> ${c.t("Bisa dikembalikan ke penulis dengan alasan, lalu diperbaiki dan diajukan lagi.", "Can be sent back to the author with a reason, corrected and resubmitted.")}</p>
  <div class="life__fix">
    <p><b>R1</b> ${c.t("Rilis yang sudah dipakai tidak diubah.", "A release in use is never edited.")}</p>
    <p class="life__arrow" aria-hidden="true">→</p>
    <p><b>R2</b> ${c.t("Koreksi menjadi rilis baru, dengan alasannya. Hasil lama tetap terikat pada R1.", "A correction becomes a new release, with its reason. Earlier results stay bound to R1.")}</p>
  </div>
</figure>`;
}

// D6 · One person, many roles; each purpose in its own place.
export function roles(c) {
  const row = (purpose, where, what) => `<li><span class="roles__p">${purpose}</span><span class="roles__w">${where}</span><span class="roles__x">${what}</span></li>`;
  return `<figure class="roles" data-reveal>
  <p class="roles__who">${c.t("Satu orang", "One person")}</p>
  <ul class="roles__list">
    ${row(c.t("Mengajar", "Teaching"), c.t("di SMP A", "at School A"), c.t("Kelas 8B, karena memiliki tugas mengajar di sana", "Class 8B, because they hold a teaching grant there"))}
    ${row(c.t("Mengelola", "Managing"), c.t("di SMP B", "at School B"), c.t("Akun dan kelas, karena ditunjuk sebagai administrator", "Accounts and classes, because they were appointed administrator"))}
    ${row(c.t("Belajar", "Learning"), c.t("di program pelatihan", "in a training programme"), c.t("Pengembangan profesionalnya sendiri", "Their own professional development"))}
  </ul>
  <figcaption class="caption">${c.t("Peran bukan izin. Ia memilih tempat bekerja dengan sengaja, dan setiap permintaan diperiksa terhadap kewenangannya di tempat itu: wewenang mengajar di A tidak berlaku di B.", "A role is not a permission. They choose where they are working, and every request is checked against their authority there: a teaching grant at A does nothing at B.")}</figcaption>
</figure>`;
}

// D11 · Who sees what.
export function whoSees(c) {
  const rows = c.t([
    ["Peserta didik", "Hasilnya sendiri, per tujuan pembelajaran. Tidak ada peringkat teman."],
    ["Pendidik", "Penguasaan kelas yang ia ajar, soal yang sulit, dan siapa yang mungkin perlu bantuan."],
    ["Pimpinan", "Pola di seluruh kelas yang menjadi wewenangnya, dan angka mana yang sudah boleh ditafsirkan."],
    ["Pemeriksa sertifikat", "Status dan penerbit sertifikat. Bukan riwayat belajar, bahkan bukan nama pemegangnya."],
  ], [
    ["Learners", "Their own results, by learning objective. No ranking against classmates."],
    ["Educators", "Mastery in the classes they teach, the questions that proved hard, and who may need help."],
    ["Leadership", "Patterns across the classes in their remit, and which figures can be interpreted yet."],
    ["Certificate checkers", "A certificate’s status and issuer. Not the learning record, not even the holder’s name."],
  ]);
  return `<dl class="whosees" data-reveal>${rows.map(([w, s]) => `<div><dt>${w}</dt><dd>${s}</dd></div>`).join("")}</dl>`;
}

// D7 · The layered cross-section: the calm surface and what lies beneath it.
export const LAYERS = [
  { id: "Identitas dan akses", en: "Identity and access",
    d_id: "Peran bukan izin. Setiap permintaan diperiksa terhadap kewenangan yang berlaku saat itu.", d_en: "A role is not a permission. Every request is checked against the authority in force at that moment.",
    x_id: "Guru yang juga administrator di sekolah lain tidak dapat memakai wewenang mengajarnya di sekolah itu.", x_en: "A teacher who is also an administrator at another school cannot use their teaching authority there." },
  { id: "Pemisahan institusi", en: "Institutional separation",
    d_id: "Data setiap institusi terpisah. Konten bersama tidak membawa bukti peserta didik.", d_en: "Each institution’s data is kept apart. Shared content never carries learners’ evidence.",
    x_id: "Dua sekolah memakai bab yang sama; tidak satu pun dapat melihat jawaban peserta didik sekolah lain.", x_en: "Two schools use the same chapter; neither can see the other’s learners’ answers." },
  { id: "Integritas asesmen", en: "Assessment integrity",
    d_id: "Kunci jawaban tidak dikirim ke perangkat peserta didik. Satu pengerjaan, satu hasil resmi.", d_en: "Answer keys are never sent to a learner’s device. One attempt, one official result.",
    x_id: "Tombol kirim yang tertekan dua kali tetap menghasilkan satu hasil.", x_en: "A submit button pressed twice still produces one result." },
  { id: "Bukti historis", en: "Historical evidence",
    d_id: "Rilis dibekukan; koreksi menjadi versi baru. Hasil lama tetap dapat dijelaskan.", d_en: "Releases are frozen; corrections become new versions. Earlier results can still be explained.",
    x_id: "Sebuah bab dikoreksi setelah dipakai; nilai yang sudah ada tetap dijelaskan oleh versi yang dipakai saat itu.", x_en: "A chapter is corrected after use; existing results are still explained by the version used at the time." },
  { id: "Kesinambungan akun dan institusi", en: "Account and institutional continuity",
    d_id: "Pindah, naik kelas, purnatugas, dan pencabutan akses diatur dengan jelas, tanpa menghapus riwayat.", d_en: "Transfers, promotion, retirement and revoked access are handled deliberately, without erasing history.",
    x_id: "Guru yang purnatugas kehilangan akses mengajarnya, tetapi materi yang ia tulis tetap atas namanya.", x_en: "A retiring teacher loses their teaching access, but the material they wrote stays in their name." },
  { id: "Tindakan yang dapat dipertanggungjawabkan", en: "Accountable actions",
    d_id: "Siapa, apa, kapan, dan mengapa dicatat untuk setiap tindakan penting.", d_en: "Who, what, when and why are recorded for every consequential action.",
    x_id: "Pimpinan yang membuka catatan satu peserta didik melakukannya dengan sengaja, dan tindakan itu tercatat.", x_en: "A leader who opens one learner’s record does so deliberately, and the act is recorded." },
  { id: "Privasi", en: "Privacy",
    d_id: "Hanya yang diperlukan yang ditampilkan, kepada orang yang berwenang.", d_en: "Only what is needed is shown, and only to those entitled to see it.",
    x_id: "Orang yang memeriksa sertifikat hanya melihat status dan penerbitnya, bukan nama atau riwayat belajar.", x_en: "Someone checking a certificate sees only its status and issuer, not a name or a learning record." },
];

export function layers(c, { full = false } = {}) {
  const L = c.lang;
  return `<figure class="layers${full ? " layers--full" : ""}" data-sequence>
  <div class="layers__surface"><span class="layers__k">${c.t("Permukaan", "The surface")}</span><span>${c.t("Satu langkah berikutnya yang jelas", "One clear next step")}</span></div>
  <ol class="layers__list" aria-label="${c.t("Lapisan di bawah antarmuka", "The layers beneath the interface")}">
    ${LAYERS.map((x, i) => `<li data-step style="--d:${i}"><span class="layers__n">${String(i + 1).padStart(2, "0")}</span><span class="layers__name">${x[L]}</span>${full ? `<span class="layers__d">${L === "id" ? x.d_id : x.d_en}</span>` : ""}</li>`).join("")}
  </ol>
</figure>`;
}

// D8 · The roadmap, with each horizon's honest status.
export function roadmap(c) {
  const rows = [
    ["foundation", "4.0", c.t("Fondasi", "Foundation"), c.t("Perjalanan belajar, konten, asesmen, laporan, sertifikat, dan kesinambungan institusi.", "Learning journeys, content, assessment, reports, certificates and institutional continuity.")],
    ["next", "4.1", c.t("Konten dan kesinambungan", "Content and continuity"), c.t("Draf soal dengan bantuan AI, selalu disetujui pendidik. Melanjutkan pekerjaan di perangkat lain dengan aman.", "AI-assisted question drafts, always approved by an educator. Continuing safely on another device.")],
    ["direction", "4.5", c.t("Memahami", "Understand"), c.t("Quiet Intelligence: sedikit pengamatan yang bermakna dan dapat dijelaskan dari bukti.", "Quiet Intelligence: a few meaningful, explainable observations drawn from the evidence.")],
    ["direction", "5.0", c.t("Bertindak dan bertumbuh", "Act and grow"), c.t("Pertumbuhan pendidik, dan intervensi yang direncanakan lalu diukur.", "Educator growth, and interventions that are planned and then measured.")],
    ["direction", "5.0+", c.t("Selanjutnya", "Beyond"), c.t("Kemungkinan yang hanya diambil bila fondasinya tetap terjaga.", "Possibilities, taken up only if the foundation stays intact.")],
  ];
  return `<ol class="roadmap" data-sequence>
  ${rows.map(([k, v, name, d]) => `<li class="roadmap__item roadmap__item--${k}" data-step>
      <span class="roadmap__mark" aria-hidden="true"></span>
      <span class="roadmap__v">${v}</span>
      <span class="roadmap__name">${name}</span>
      <span class="roadmap__d">${d}</span>
      <span class="roadmap__s">${c.t({ foundation: "Verifikasi rilis", next: "Direncanakan", direction: "Arah" }[k], { foundation: "In release verification", next: "Planned", direction: "Direction" }[k])}</span>
    </li>`).join("")}
</ol>`;
}

// D9 · AI drafts, the educator decides.
export function aiFlow(c) {
  const steps = [
    [c.t("AI menyusun draf", "AI drafts"), c.t("Soal pilihan ganda dari sumber yang sah, untuk satu tujuan pembelajaran.", "Multiple-choice questions from an authorised source, for one learning objective.")],
    [c.t("Pendidik memutuskan", "The educator decides"), c.t("Meninjau, mengubah, menolak, atau meminta draf baru.", "Reviews, edits, rejects or asks for a new draft."), true],
    [c.t("Alur persetujuan biasa", "The usual approval"), c.t("Tinjauan orang kedua, lalu persetujuan.", "A second person’s review, then approval.")],
    [c.t("Rilis", "Release"), c.t("Baru setelah itu dapat ditugaskan.", "Only then can it be assigned.")],
  ];
  return `<figure class="flow" data-sequence>
  <ol class="flow__steps">${steps.map(([h, d, human]) => `<li data-step class="${human ? "flow__human" : ""}"><span class="flow__h">${h}</span><span class="flow__d">${d}</span></li>`).join("")}</ol>
  <figcaption class="caption">${c.t("Draf tidak pernah terbit atau ditugaskan dengan sendirinya. Penyusunan tidak memakai data pribadi peserta didik, dan penulisan manual tetap tersedia.", "A draft is never published or assigned on its own. Drafting uses no learner’s personal data, and writing by hand remains available.")}</figcaption>
</figure>`;
}

// D10 · Continuing on another device.
export function handoff(c) {
  return `<figure class="handoff" data-reveal>
  <div class="handoff__dev"><span class="handoff__k">${c.t("Perangkat pertama", "First device")}</span><span>${c.t("Pekerjaan tersimpan", "Work saved")}</span></div>
  <div class="handoff__qr" aria-hidden="true"><svg viewBox="0 0 7 7" focusable="false"><path d="M0 0h3v3H0zM4 0h3v3H4zM0 4h3v3H0zM4 4h1v1H4zM6 4h1v1H6zM5 5h1v1H5zM4 6h1v1H4zM6 6h1v1H6z" fill="currentColor"/><path d="M1 1h1v1H1zM5 1h1v1H5zM1 5h1v1H1z" fill="var(--paper)"/></svg></div>
  <div class="handoff__dev"><span class="handoff__k">${c.t("Perangkat kedua", "Second device")}</span><span>${c.t("Melanjutkan dari titik yang sama", "Continues from the same point")}</span></div>
  <figcaption class="caption">${c.t("Kode sekali pakai yang berlaku singkat, diperiksa ulang saat dipakai. Hanya satu perangkat yang menulis jawaban pada satu waktu.", "A short-lived, single-use code, checked again when it is used. Only one device writes answers at a time.")}</figcaption>
</figure>`;
}

// D12 · What PINTAR is, against what it is often mistaken for.
export function difference(c) {
  const rows = c.t([
    ["Sistem manajemen pembelajaran", "membagikan materi dan tugas"],
    ["Perpustakaan konten", "menyimpan materi"],
    ["Platform ujian daring", "mengukur hasil"],
  ], [
    ["A learning management system", "distributes material and assignments"],
    ["A content library", "stores material"],
    ["An online exam platform", "measures outcomes"],
  ]);
  return `<div class="diff" data-reveal>
  <ul class="diff__list">${rows.map(([a, b]) => `<li><span class="diff__a">${a}</span><span class="diff__b">${b}</span></li>`).join("")}</ul>
  <p class="diff__pintar"><span class="diff__a">PINTAR</span><span class="diff__b">${c.t("menghubungkan ketiganya, lalu menjelaskan apa yang ditunjukkan bukti dan apa yang belum.", "connects all three, then explains what the evidence shows, and what it does not yet show.")}</span></p>
</div>`;
}

// The learning journey strip used on the Features page.
export function journey(c) {
  const steps = c.t(["Pemetaan Awal", "Peta Bacaan Personal", "Pelajaran dan latihan", "Uji Penguasaan", "Hasil"], ["Initial mapping", "Personal reading map", "Lessons and practice", "Mastery test", "Result"]);
  return `<ol class="journey" data-sequence aria-label="${c.t("Perjalanan belajar", "The learning journey")}">${steps.map((s) => `<li data-step>${esc(s)}</li>`).join("")}</ol>`;
}
