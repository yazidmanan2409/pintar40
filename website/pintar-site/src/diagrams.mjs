// The site's diagrams and infographics, built as native HTML with a little
// SVG. They are text, so they translate, scale, read aloud and stay sharp.
//
// The visual thread of the whole site is the evidence-to-decision sequence:
// learning objective → evidence → educator judgement → next teaching step.
// Its four marks (ring, dot, diamond, arrow) appear wherever that sequence
// does: in the thread itself, in the hero's class panel, and in the
// annotated report on Features.
//
// None is a product screenshot. Every illustration with numbers says it uses
// sample data, says what each figure measures and how many learners it rests
// on. Product names follow the application: in Indonesian «Pemetaan Awal»,
// «Peta Bacaan Personal», «Uji Penguasaan»; in English, the application's own
// English names «Initial Mapping», «Personal Reading Map», «Mastery Check».

/** One of the thread's four marks. Decorative: the words always say the same. */
export const mark = (n) => `<span class="mk mk--${n}" aria-hidden="true"></span>`;

export const THREAD = [
  { id: "Tujuan pembelajaran", en: "Learning objective", d_id: "Apa yang perlu dapat dilakukan peserta didik.", d_en: "What learners should be able to do." },
  { id: "Bukti", en: "Evidence", d_id: "Jawaban dari Pemetaan Awal, latihan, dan Uji Penguasaan.", d_en: "Answers from the Initial Mapping, practice and the Mastery Check." },
  { id: "Pertimbangan pendidik", en: "Educator judgement", d_id: "Pendidik membaca buktinya bersama apa yang ia ketahui tentang kelasnya.", d_en: "The educator reads the evidence alongside what they know of the class." },
  { id: "Langkah mengajar berikutnya", en: "Next teaching step", d_id: "Apa yang diulang, untuk siapa, dan apa yang dilanjutkan.", d_en: "What to revisit, for whom, and what to move on to." },
];

// D1 · The thread: the organising idea, drawn once and reused.
export function thread(c, { caption = true, vertical = false } = {}) {
  const L = c.lang;
  return `<figure class="thread"${vertical ? ' data-layout="v"' : ""} data-sequence>
  <ol class="thread__steps" aria-label="${c.t("Dari tujuan pembelajaran ke langkah mengajar berikutnya", "From learning objective to next teaching step")}">${THREAD.map((s, i) => `<li class="thread__step${i === 2 ? " thread__step--human" : ""}" data-step>
      <span class="thread__top">${mark(i + 1)}<span class="thread__n">${String(i + 1).padStart(2, "0")}</span></span>
      <span class="thread__h">${s[L]}</span>
      <span class="thread__d">${L === "id" ? s.d_id : s.d_en}</span>
    </li>`).join("")}</ol>
  ${caption ? `<figcaption class="caption">${c.t("PINTAR menyiapkan bukti untuk langkah 1 dan 2. Langkah 3 dan 4 tetap milik pendidik.", "PINTAR prepares the evidence for steps 1 and 2. Steps 3 and 4 stay with the educator.")}</figcaption>` : ""}
</figure>`;
}

// D0 · The homepage's concrete picture: one class after a Mastery Check, told
// along the thread. Sample data; each figure says what it measures and how
// many learners it rests on; the judgement and the next step are written by
// the educator, set apart from the report and labelled as an example.
export function classPanel(c) {
  const rows = c.t([["Menyamakan penyebut", 46], ["Membandingkan dua pecahan", 63], ["Menyederhanakan pecahan", 88]],
    [["Finding a common denominator", 46], ["Comparing two fractions", 63], ["Simplifying fractions", 88]]);
  return `<figure class="panel" data-reveal>
  <div class="panel__top"><span class="panel__k">${c.t("Ringkasan kelas", "Class summary")}</span><span class="panel__tag">${c.t("Data contoh", "Sample data")}</span></div>
  <p class="panel__ctx">${c.t("Matematika · Pecahan · Kelas 7B · Uji Penguasaan · 24 peserta didik", "Mathematics · Fractions · Class 7B · Mastery Check · 24 learners")}</p>
  <div class="panel__block">
    <p class="panel__h"><span>${mark(1)}${c.t("Tujuan pembelajaran", "Learning objectives")}</span><span class="panel__k">${c.t("% jawaban benar", "% of answers correct")}</span></p>
    <ul class="panel__rows">${rows.map(([n, v]) => `<li><span>${n}</span><b>${v}%</b><i style="--v:${v}%" aria-hidden="true"></i></li>`).join("")}</ul>
    <p class="panel__note">${c.t("Bagian jawaban yang benar pada soal tiap tujuan: 3 soal, 24 peserta didik. Ini bukti, belum kesimpulan tentang penguasaan.", "The share of correct answers to each objective’s questions: 3 questions, 24 learners. It is evidence, not yet a judgement of mastery.")}</p>
  </div>
  <div class="panel__block">
    <p class="panel__h"><span>${mark(2)}${c.t("Bukti: soal yang paling sulit", "Evidence: the hardest question")}</span></p>
    <p class="panel__q"><b>${c.t("Soal 4 · menyamakan penyebut", "Question 4 · common denominator")}</b><span>${c.t("7 dari 24 menjawab benar. 12 dari 24 memilih jawaban B.", "7 of 24 answered correctly. 12 of 24 chose answer B.")}</span></p>
  </div>
  <div class="panel__decision">
    <p class="panel__by">${c.t("Ditulis oleh pendidik · contoh", "Written by the educator · example")}</p>
    <p class="panel__h"><span>${mark(3)}${c.t("Pertimbangan", "Judgement")}</span></p>
    <p>${c.t("Separuh kelas memilih B, jawaban yang menjumlahkan penyebutnya. Mungkin penyamaan penyebut belum dipahami. Saya perlu memeriksanya di kelas.", "Half the class chose B, the answer that adds the denominators. They may not yet understand common denominators. I need to check in class.")}</p>
    <p class="panel__h"><span>${mark(4)}${c.t("Langkah berikutnya", "Next step")}</span></p>
    <p>${c.t("Besok: minta beberapa peserta didik menjelaskan cara mereka menjawab Soal 4, lalu ulang penyamaan penyebut dengan pita pecahan bila perlu.", "Tomorrow: ask a few learners to explain how they answered Question 4, then revisit common denominators with fraction strips if needed.")}</p>
  </div>
  <figcaption class="panel__foot">${c.t("Ilustrasi konsep, bukan tangkapan layar. PINTAR menunjukkan buktinya; pertimbangan dan langkah berikutnya ditulis oleh pendidik.", "A concept illustration, not a screenshot. PINTAR shows the evidence; the judgement and the next step are the educator’s.")}</figcaption>
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
    d_id: "Laporan menjelaskan hasilnya, dan mengatakannya bila datanya belum cukup.", d_en: "Reports explain the results, and say so when there is not yet enough data." },
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
      <p class="evstate__k">${c.t("Rata-rata jawaban benar di Uji Penguasaan", "Average % of answers correct, Mastery Check")}</p>
      <p class="evstate__v">72<span>%</span></p>
      <p class="evstate__n">${c.t("Dari 22 peserta didik yang sudah mengerjakan, dari 24.", "From the 22 of 24 learners who have taken it.")}</p>
      <p class="evstate__tag"><span class="tick" aria-hidden="true"></span>${c.t("Cukup data: angka ditampilkan.", "Enough data: the figure is shown.")}</p>
    </div>
    <div class="evstate evstate--thin">
      <p class="evstate__k">${c.t("Rata-rata jawaban benar di Uji Penguasaan", "Average % of answers correct, Mastery Check")}</p>
      <p class="evstate__v evstate__v--none" aria-label="${c.t("tidak ditampilkan", "not shown")}">—</p>
      <p class="evstate__n">${c.t("Baru 4 dari 24 peserta didik yang mengerjakan.", "Only 4 of 24 learners have taken it.")}</p>
      <p class="evstate__tag"><span class="wait" aria-hidden="true"></span>${c.t("Belum cukup data: laporan menulis «Belum cukup data untuk menampilkan angka ini.»", "Not enough data: the report says “Not enough data to show this figure yet.”")}</p>
    </div>
  </div>
  <figcaption class="caption">${c.t("Ilustrasi konsep dengan data contoh, bukan tangkapan layar. Setiap angka di laporan PINTAR membutuhkan jumlah data minimum sebelum ditampilkan. Data yang belum cukup tidak berarti hasilnya lemah.", "A concept illustration with sample data, not a screenshot. Every figure in a PINTAR report needs a minimum amount of data before it is shown. Too little data is not a sign of weak results.")}</figcaption>
</figure>`;
}

// D12 · An annotated question report (Features): what the report shows, and
// what an educator notices in it. Sample data; the notes are the educator's
// reading, numbered to the marks on the report.
export function reportView(c) {
  const opts = [["A", "5/6", 7, true], ["B", "2/5", 12], ["C", "2/6", 3], ["D", "1/6", 2]];
  const n = (k) => `<span class="note-n" aria-hidden="true">${k}</span>`;
  const notes = c.t([
    "Hanya 7 dari 24 menjawab benar: soal ini sulit bagi kelas.",
    "Separuh kelas memilih jawaban yang sama, B: layak ditanyakan bagaimana mereka sampai ke sana.",
    "Dua tujuan lain di bab ini lebih kuat: mungkin cukup mengulang satu bagian, bukan seluruh bab.",
  ], [
    "Only 7 of 24 answered correctly: the class found this question hard.",
    "Half the class chose the same answer, B: worth asking how they got there.",
    "The chapter’s other two objectives are stronger: revisiting one part may be enough, not the whole chapter.",
  ]);
  return `<figure class="report" data-reveal>
  <div class="report__card">
    <div class="panel__top"><span class="panel__k">${c.t("Laporan soal · Soal 4", "Question report · Question 4")}</span><span class="panel__tag">${c.t("Data contoh", "Sample data")}</span></div>
    <p class="panel__ctx">${c.t("Kelas 7B · Uji Penguasaan · 24 peserta didik", "Class 7B · Mastery Check · 24 learners")}</p>
    <div class="report__q"><p class="report__stem">½ + ⅓ = …</p><p class="report__obj">${mark(1)}${c.t("Tujuan: menyamakan penyebut", "Objective: finding a common denominator")}</p></div>
    <p class="report__h"><span>${mark(2)}${c.t("Jawaban yang dipilih", "Answers chosen")}</span>${n(1)}</p>
    <ul class="report__opts">${opts.map(([k, v, cnt, ok]) => `<li class="${ok ? "is-key" : ""}"><span class="report__k">${k}</span><span class="report__v">${v}${ok ? ` <em>${c.t("kunci", "key")}</em>` : ""}</span><span class="report__c">${cnt}</span><i style="--v:${Math.round((cnt / 24) * 100)}%" aria-hidden="true"></i>${k === "B" ? n(2) : ""}</li>`).join("")}</ul>
    <p class="report__h"><span>${c.t("Tujuan lain dalam bab ini, % jawaban benar", "The chapter’s other objectives, % of answers correct")}</span>${n(3)}</p>
    <p class="report__other"><span>${c.t("Membandingkan dua pecahan", "Comparing two fractions")} <b>63%</b></span><span>${c.t("Menyederhanakan pecahan", "Simplifying fractions")} <b>88%</b></span></p>
  </div>
  <div class="report__notes">
    <p class="report__notes-h">${mark(3)}${c.t("Yang diperhatikan pendidik", "What the educator notices")}</p>
    <ol>${notes.map((x, i) => `<li>${n(i + 1)}<span>${x}</span></li>`).join("")}</ol>
  </div>
  <figcaption class="caption">${c.t("Ilustrasi konsep dengan data contoh, bukan tangkapan layar. Laporan menunjukkan buktinya; tafsiran dan keputusannya milik pendidik.", "A concept illustration with sample data, not a screenshot. The report shows the evidence; the reading and the decision are the educator’s.")}</figcaption>
</figure>`;
}

// The learning journey (Features): the starting point, the assigned learning,
// practice and assessment, and the result that becomes evidence.
export function journey(c) {
  const steps = c.t([
    ["Titik mulai", "Pemetaan Awal", "Menunjukkan apa yang sudah diketahui peserta didik."],
    ["Urutan bacaan", "Peta Bacaan Personal", "Menyarankan dari mana mulai membaca."],
    ["Belajar dan berlatih", "Pelajaran dan latihan", "Ditugaskan pendidik, dengan bantuan bertahap bila diperlukan."],
    ["Asesmen", "Uji Penguasaan", "Aturannya terlihat sebelum mulai."],
    ["Hasil", "Per tujuan pembelajaran", "Untuk peserta didik dan pendidiknya, tanpa peringkat."],
  ], [
    ["Starting point", "Initial Mapping", "Shows what learners already know."],
    ["Reading order", "Personal Reading Map", "Suggests where to start reading."],
    ["Learning and practice", "Lessons and practice", "Assigned by the educator, with step-by-step help when needed."],
    ["Assessment", "Mastery Check", "Its rules are shown before it starts."],
    ["Result", "By learning objective", "For learners and their educators, without rankings."],
  ]);
  return `<figure class="journey" data-sequence>
  <ol aria-label="${c.t("Perjalanan belajar", "The learning journey")}">${steps.map(([k, h, d]) => `<li data-step><span class="journey__k">${k}</span><span class="journey__h">${h}</span><span class="journey__d">${d}</span></li>`).join("")}</ol>
  <p class="journey__out">${mark(2)}${c.t("Hasilnya menjadi bukti untuk langkah mengajar berikutnya.", "The result becomes evidence for the next teaching step.")}</p>
</figure>`;
}

// D4 · Publication and correction (Features · Content Studio): reviewed
// before release, used by institutions with permission, versions kept.
export function lifecycle(c) {
  const steps = c.t([["Draf", "Disusun di Studio Konten, dengan sumbernya."], ["Ditinjau", "Oleh orang kedua."], ["Disetujui", "Siap dirilis."], ["Dirilis", "Dapat ditugaskan ke kelas."]],
    [["Draft", "Prepared in the Content Studio, with its source."], ["Reviewed", "By a second person."], ["Approved", "Ready for release."], ["Released", "Can be assigned to classes."]]);
  return `<figure class="life" data-sequence>
  <ol class="life__steps">${steps.map(([h, d], i) => `<li data-step><span class="life__n">${String(i + 1).padStart(2, "0")}</span><span class="life__h">${h}</span><span class="life__d">${d}</span></li>`).join("")}
    <li class="life__use" data-step><span class="life__n">${c.t("Dipakai bersama", "Shared use")}</span><span class="life__insts"><span>${c.t("Institusi A", "Institution A")}</span><span>${c.t("Institusi B", "Institution B")}</span></span><span class="life__d">${c.t("Institusi yang diberi izin memakai versi yang sama. Data peserta didik tetap di institusinya.", "Institutions with permission use the same version. Learner data stays within each one.")}</span></li>
  </ol>
  <p class="life__back"><span aria-hidden="true">↺</span> ${c.t("Peninjau dapat mengembalikan draf dengan catatan; penulis memperbaikinya, lalu mengajukannya lagi.", "A reviewer can return a draft with notes; the author revises it and submits it again.")}</p>
  <div class="life__fix">
    <p class="life__fix-k">${c.t("Bila perlu koreksi setelah dirilis", "When a correction is needed after release")}</p>
    <div class="life__v"><b>${c.t("Versi 1", "Version 1")}</b><span>${c.t("Tetap utuh. Hasil yang sudah ada tetap terhubung ke versi ini.", "Stays intact. Existing results stay linked to it.")}</span></div>
    <p class="life__arrow" aria-hidden="true">→</p>
    <div class="life__v life__v--new"><b>${c.t("Versi 2", "Version 2")}</b><span>${c.t("Koreksinya, dengan alasan yang tercatat. Dipakai mulai saat dirilis.", "The correction, with its reason recorded. Used from its release.")}</span></div>
  </div>
</figure>`;
}

// D6 · One person, several roles: what they can do in each place is set by
// the role that place has assigned.
export function roles(c) {
  const card = (place, role, what, by) => `<li><span class="roles__place">${place}</span><span class="roles__role">${role}</span><span class="roles__what">${what}</span><span class="roles__by">${by}</span></li>`;
  return `<figure class="roles" data-reveal>
  <div class="roles__person"><span class="roles__avatar" aria-hidden="true"><svg viewBox="0 0 40 40" focusable="false"><circle cx="20" cy="14" r="7" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M6 37c1.5-8 7-12 14-12s12.5 4 14 12" fill="none" stroke="currentColor" stroke-width="1.5"/></svg></span><span>${c.t("Satu orang, satu akun", "One person, one account")}</span></div>
  <ul class="roles__list">
    ${card(c.t("SMP A", "School A"), c.t("Pendidik", "Educator"), c.t("Mengajar Kelas 8B: memberi materi dan melihat hasil kelas itu.", "Teaches Class 8B: gives it material and sees its results."), c.t("Ditugaskan oleh SMP A", "Assigned by School A"))}
    ${card(c.t("SMP B", "School B"), c.t("Administrator", "Administrator"), c.t("Mengelola akun dan kelas di SMP B.", "Manages accounts and classes at School B."), c.t("Ditunjuk oleh SMP B", "Appointed by School B"))}
    ${card(c.t("Program pelatihan guru", "Teacher training programme"), c.t("Peserta", "Participant"), c.t("Mengikuti pelatihannya sendiri, terpisah dari hasil akademik.", "Takes part in their own training, kept apart from academic results."), c.t("Didaftarkan oleh penyelenggara", "Enrolled by the organiser"))}
  </ul>
  <figcaption class="caption">${c.t("Ia memilih tempat ia sedang bekerja; yang dapat ia lakukan di sana ditentukan oleh peran yang ditugaskan di tempat itu. Akses mengajar di SMP A tidak berlaku di SMP B.", "They choose where they are working; what they can do there is set by the role assigned in that place. Teaching access at School A does not apply at School B.")}</figcaption>
</figure>`;
}

// D7 · The layered cross-section. Each safeguard has one explanation and one
// everyday example; the diagram shows only the names, the list explains them.
export const LAYERS = [
  { id: "Identitas dan akses", en: "Identity and access",
    d_id: "Setiap tindakan diperiksa terhadap peran yang ditugaskan kepada seseorang di tempat ia sedang bekerja.", d_en: "Each action is checked against the role someone has been assigned in the place they are working.",
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
    d_id: "Pindah kelas, naik kelas, pindah sekolah, purnatugas, dan penghentian akses ditangani sebagai tindakan yang jelas, tanpa menghapus catatan yang perlu dipertahankan.", d_en: "Class changes, moving up a year, school transfers, retirement and the end of someone’s access are handled as deliberate actions, without erasing records that need to be kept.",
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

// D8 · Available now / Future direction (Features, at the end). The status
// leads; version numbers are secondary. The boundaries between what is
// available and what is a direction are stated here, once.
export function roadmap(c) {
  const rows = [
    ["available", "4.0", c.t("Fondasi", "Foundation"), c.t("Belajar dan mengajar, laporan dan asesmen, Studio Konten, serta akun dan institusi.", "Learning and teaching, reports and assessment, the Content Studio, and accounts and institutions.")],
    ["available", "4.1", c.t("Konten dan kesinambungan", "Content and continuity"), c.t("Draf soal dengan bantuan AI, riwayat setiap soal, dan melanjutkan di perangkat lain.", "AI-assisted question drafts, a history for every question, and continuing on another device.")],
    ["direction", "4.5", c.t("Memahami", "Understand"), c.t("Quiet Intelligence: sedikit pengamatan dari bukti yang dapat dijelaskan, termasuk penilaian mutu soal (kesehatan soal).", "Quiet Intelligence: a few explainable observations drawn from the evidence, including judging question quality (question health).")],
    ["direction", "5.0", c.t("Bertindak dan bertumbuh", "Act and grow"), c.t("Perjalanan pertumbuhan pendidik, jalur belajar yang terus menyesuaikan, dan intervensi yang direncanakan lalu diukur.", "Educator growth journeys, learning paths that keep adapting, and interventions that are planned and then measured.")],
  ];
  const S = { available: c.t("Tersedia sekarang", "Available now"), direction: c.t("Arah ke depan", "Future direction") };
  return `<ol class="roadmap" data-sequence>
  ${rows.map(([k, v, name, d]) => `<li class="roadmap__item roadmap__item--${k}" data-step>
      <span class="roadmap__mark" aria-hidden="true"></span>
      <span class="roadmap__s">${S[k]}</span>
      <span class="roadmap__name">${name}</span>
      <span class="roadmap__d">${d}</span>
      <span class="roadmap__v">${c.t("Versi", "Version")} ${v}</span>
    </li>`).join("")}
</ol>`;
}

// D9 · AI drafts, the educator decides (4.1). The approved workflow, as the
// master specification sets it out (AIQ-01): the educator chooses a permitted
// source and objective; drafts are checked; the educator decides; accepted
// items then go through the ordinary second-person review before release.
export function aiFlow(c) {
  const steps = [
    [c.t("Pendidik memilih", "The educator chooses"), c.t("Sumber yang diizinkan dan satu tujuan pembelajaran.", "A permitted source and one learning objective.")],
    [c.t("AI menyusun draf", "AI drafts"), c.t("Soal pilihan ganda, usulan jawaban, penjelasan, dan rujukan ke sumbernya.", "Multiple-choice questions, a proposed answer, an explanation and a reference to the source.")],
    [c.t("Draf diperiksa", "The drafts are checked"), c.t("Format, duplikasi, jawaban yang ambigu, dan kecocokan dengan sumber.", "Format, duplicates, ambiguous answers and fit with the source.")],
    [c.t("Pendidik memutuskan", "The educator decides"), c.t("Menerima, mengubah, menolak, atau meminta draf baru.", "Accepts, edits, rejects or asks for a new draft."), true],
    [c.t("Ditinjau, lalu dirilis", "Reviewed, then released"), c.t("Ditinjau orang kedua dan disetujui, lalu dirilis. Baru setelah itu soal dapat ditugaskan.", "Reviewed by a second person and approved, then released. Only then can it be assigned.")],
  ];
  return `<figure class="flow flow--5" data-sequence>
  <ol class="flow__steps">${steps.map(([h, d, human], i) => `<li data-step class="${human ? "flow__human" : ""}"><span class="flow__n">${human ? mark(3) : ""}${String(i + 1).padStart(2, "0")}</span><span class="flow__h">${h}</span><span class="flow__d">${d}</span></li>`).join("")}</ol>
  <figcaption class="caption">${c.t("Draf tidak terbit atau ditugaskan dengan sendirinya, dan riwayatnya tercatat. Penyusunan tidak memakai data pribadi peserta didik. Bila layanan AI tidak tersedia, pendidik tetap dapat menulis soal sendiri.", "A draft is never published or assigned on its own, and its history is recorded. Drafting uses no learner’s personal data. If the AI service is unavailable, educators can still write questions themselves.")}</figcaption>
</figure>`;
}
