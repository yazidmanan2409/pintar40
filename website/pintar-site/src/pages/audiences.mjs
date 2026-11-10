// Untuk Siapa / Who It's For: four roles and the institution as a whole,
// each answering "what becomes better for me?" in a headline and four short
// lines, beside an image of that situation.

import { label, photo, demoBand, NAV_LABEL } from "../core.mjs";

export default function audiences(c) {
  const t = c.t;
  const roles = [
    { id: "peserta-didik", photo: "P3", role: t("Peserta didik", "Learners"), who: t("Siswa, mahasiswa, dan peserta pelatihan", "School pupils, students and trainees"),
      h: t("Tahu apa yang perlu <em>dikerjakan berikutnya.</em>", "Know what <em>to do next.</em>"),
      items: t([
        ["Tugas dan langkah berikutnya", "terlihat di satu halaman."],
        ["Bantuan bertahap", "saat belajar: arah berpikir lebih dulu, lalu langkah demi langkah."],
        ["Hasil sendiri per tujuan pembelajaran,", "tanpa peringkat dan tanpa dibandingkan dengan teman."],
        ["Sertifikat", "yang keasliannya dapat diperiksa orang lain."],
      ], [
        ["Assignments and the next step", "on one page."],
        ["Step-by-step help", "while learning: a direction to think in first, then one step at a time."],
        ["Their own results by learning objective,", "without rankings or comparison with classmates."],
        ["Certificates", "whose authenticity others can check."],
      ]) },
    { id: "pendidik", photo: "P2", role: t("Pendidik", "Educators"), who: t("Guru, dosen, dan fasilitator", "Teachers, lecturers and facilitators"),
      h: t("Tahu apa yang perlu diulang besok, <em>dan untuk siapa.</em>", "Know what to revisit tomorrow, <em>and for whom.</em>"),
      items: t([
        ["Bagian dan soal yang sulit bagi kelas,", "termasuk pilihan jawaban yang paling banyak dipilih."],
        ["Peserta didik yang mungkin perlu bantuan,", "sebagai bahan pertimbangan, bukan label."],
        ["Materi yang bisa diberikan ke kelas,", "ditambah materi Anda sendiri."],
        ["Program pengembangan profesional", "yang Anda ikuti, terpisah dari penilaian kinerja."],
      ], [
        ["The parts and questions a class found hard,", "including the answer options chosen most often."],
        ["Learners who may need help,", "as something to consider, not a label."],
        ["Material you can give to a class,", "plus your own."],
        ["Professional-development programmes", "you take part in, kept apart from performance review."],
      ]) },
    { id: "pimpinan", photo: "P4", role: t("Pimpinan", "Leadership"), who: t("Kepala sekolah, kepala departemen, dan dekan", "Principals, heads of department and deans"),
      h: t("Melihat pola, <em>bukan menebak.</em>", "See patterns <em>instead of guessing.</em>"),
      items: t([
        ["Pola penguasaan", "di kelas-kelas dalam wewenang Anda."],
        ["Angka yang jelas dasarnya:", "ditampilkan bila datanya cukup, dengan keterangan bila belum."],
        ["Ringkasan kelas dan sekolah", "yang siap dicetak untuk rapat."],
        ["Membuka catatan satu peserta didik", "hanya dengan sengaja, dan tindakan itu tercatat."],
      ], [
        ["Patterns of mastery", "across the classes you are responsible for."],
        ["Figures with a clear basis:", "shown when there is enough data, with a note when there is not."],
        ["Class and school summaries", "ready to print for a meeting."],
        ["Opening one learner’s record", "only deliberately, and the action is recorded."],
      ]) },
    { id: "administrator", photo: "P6", role: t("Administrator", "Administrators"), who: t("Operator sekolah dan admin institusi", "School operators and institution administrators"),
      h: t("Mengelola akses, <em>bukan keputusan belajar.</em>", "Manage access, <em>not learning decisions.</em>"),
      items: t([
        ["Akun, kelas, rombel, dan peran", "di satu tempat."],
        ["Kartu kelas", "untuk peserta didik, yang dapat diganti bila hilang."],
        ["Pindah, naik kelas, dan purnatugas", "tanpa kehilangan catatan yang perlu dipertahankan."],
        ["Perubahan penting", "mencatat siapa, apa, kapan, dan alasannya."],
      ], [
        ["Accounts, classes, groups and roles", "in one place."],
        ["Class cards", "for learners, replaceable when lost."],
        ["Transfers, moving up and retirement", "without losing records that need to be kept."],
        ["Consequential changes", "record who, what, when and why."],
      ]) },
    { id: "institusi", photo: "P5", role: t("Institusi secara keseluruhan", "The institution as a whole"), who: t("Yayasan, badan pengelola, dan pimpinan institusi", "Foundations, governing bodies and institutional leaders"),
      h: t("Catatan belajar yang <em>dapat dijelaskan.</em>", "A learning record <em>that can be explained.</em>"),
      items: t([
        ["Materi bersama,", "ditambah materi milik institusi sendiri."],
        ["Data institusi Anda", "dipisahkan dari institusi lain."],
        ["Catatan yang tetap utuh", "saat orang datang dan pergi."],
        ["Dasar yang jujur", "untuk rapat, keputusan, dan pelaporan."],
      ], [
        ["Shared material,", "plus material that belongs to your institution."],
        ["Your institution’s data", "kept separate from other institutions."],
        ["Records that stay whole", "as people come and go."],
        ["An honest basis", "for meetings, decisions and reporting."],
      ]) },
  ];

  const body = `
<section class="page-hero" aria-labelledby="aud-hero-h">
  <div class="wrap" data-reveal-group>
    ${label("", NAV_LABEL.audiences[c.lang])}
    <h1 class="h1" id="aud-hero-h" data-reveal>${t("Untuk setiap orang <em>yang terlibat dalam belajar.</em>", "For everyone <em>involved in learning.</em>")}</h1>
    <div class="page-hero__aside" data-reveal>
      <p class="lead">${t("Sekolah, perguruan tinggi, dan program pelatihan. Empat peran, dan institusi secara keseluruhan, masing-masing dengan manfaat yang nyata.", "Schools, universities and training programmes. Four roles, and the institution as a whole, each with a practical benefit.")}</p>
    </div>
  </div>
  <nav class="wrap" style="margin-top: var(--s-8)" aria-label="${t("Kelompok", "Groups")}"><div class="anchors">${roles.map((r) => `<a href="#${r.id}">${r.role}</a>`).join("")}</div></nav>
</section>

${roles.map((r, i) => `<section class="aud${i % 2 ? " aud--flip" : ""}" id="${r.id}" aria-labelledby="${r.id}-h">
  <div class="wrap cols">
    <div class="aud__photo" style="--span:5${i % 2 ? ";--start:8" : ""}" data-reveal>${photo(c, r.photo, r.photo === "P5" ? { r: "4/3" } : {})}</div>
    <div style="--span:6;--start:${i % 2 ? 1 : 7}" data-reveal-group>
      <p class="aud__role">${String(i + 1).padStart(2, "0")} · ${r.role}</p>
      <p class="aud__who">${r.who}</p>
      <h2 class="h2" id="${r.id}-h" data-reveal>${r.h}</h2>
      <ol class="aud__list">${r.items.map(([b, d], k) => `<li data-reveal><span>${String(k + 1).padStart(2, "0")}</span><span><b>${b}</b> ${d}</span></li>`).join("")}</ol>
    </div>
  </div>
</section>`).join("\n")}

${demoBand(c, { heading: t("Lihat PINTAR <em>dari sudut pandang Anda.</em>", "See PINTAR <em>from where you sit.</em>"), body: t("Ceritakan peran Anda, dan kami menyiapkan demo terpandu dengan data contoh yang sesuai.", "Tell us your role, and we will prepare a guided demonstration with suitable sample data.") })}
`;
  return {
    title: t("Untuk Siapa — PINTAR", "Who It’s For — PINTAR"),
    description: t("Manfaat PINTAR bagi peserta didik, pendidik, pimpinan, administrator, dan institusi secara keseluruhan.", "What PINTAR offers learners, educators, leadership, administrators and the institution as a whole."),
    body,
  };
}
