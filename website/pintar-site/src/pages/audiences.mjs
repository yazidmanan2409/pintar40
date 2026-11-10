// Untuk Siapa / Who It's For: five roles, each answering "what becomes
// better for me?" in a headline and four short lines, beside a photograph
// of that person at work.

import { label, photo, demoBand, NAV_LABEL } from "../core.mjs";

export default function audiences(c) {
  const t = c.t;
  const roles = [
    { id: "peserta-didik", photo: "P2", role: t("Peserta didik", "Learners"), who: t("Murid dan mahasiswa", "School pupils and students"),
      h: t("Tahu apa yang harus dilakukan berikutnya.", "Know what to do next."),
      items: t([
        ["Beranda yang jelas:", "tugas, tenggat, dan satu langkah berikutnya."],
        ["Bantuan bertahap", "saat belajar: arah berpikir dulu, bukan jawabannya."],
        ["Hasil sendiri per tujuan pembelajaran,", "tanpa dibandingkan dengan teman."],
        ["Sertifikat", "yang keasliannya dapat diperiksa."],
      ], [
        ["A clear home:", "assignments, deadlines and one next step."],
        ["Help one step at a time", "while learning: a direction first, not the answer."],
        ["Their own results by learning objective,", "never compared with classmates."],
        ["Certificates", "whose authenticity anyone can check."],
      ]) },
    { id: "pendidik", photo: "P3", role: t("Pendidik", "Educators"), who: t("Guru, dosen, dan fasilitator", "Teachers, lecturers and facilitators"),
      h: t("Tahu apa yang perlu diulang besok, dan untuk siapa.", "Know what to revisit tomorrow, and for whom."),
      items: t([
        ["Soal mana yang sulit", "bagi kelas, dan pilihan jawaban yang dipilih."],
        ["Siapa yang mungkin perlu bantuan,", "tanpa memberi label pada anak."],
        ["Materi siap pakai,", "ditambah materi Anda sendiri bila perlu."],
        ["Pengembangan profesional", "di ruang yang terpisah dari penilaian kinerja."],
      ], [
        ["Which questions a class found hard,", "and which answers they chose."],
        ["Who may need help,", "without labelling a child."],
        ["Material ready to use,", "plus your own when you need it."],
        ["Professional development", "in a space kept apart from performance judgement."],
      ]) },
    { id: "pimpinan", photo: "P4", role: t("Pimpinan", "Leadership"), who: t("Kepala sekolah, kepala departemen, dan dekan", "Principals, heads of department and deans"),
      h: t("Melihat pola, bukan menebak.", "See patterns instead of guessing."),
      items: t([
        ["Pola penguasaan", "di seluruh kelas yang menjadi wewenang Anda."],
        ["Kesiapan bukti:", "angka mana yang sudah boleh ditafsirkan."],
        ["Ringkasan kelas dan sekolah", "yang siap dicetak untuk rapat."],
        ["Membuka catatan satu peserta didik", "hanya dengan sengaja, dan tercatat."],
      ], [
        ["Patterns of mastery", "across the classes in your remit."],
        ["Evidence readiness:", "which figures can be interpreted yet."],
        ["Class and school summaries", "ready to print for a meeting."],
        ["Opening one learner’s record", "only deliberately, and on the record."],
      ]) },
    { id: "administrator", photo: "P5", role: t("Administrator", "Administrators"), who: t("Operator sekolah dan admin institusi", "School operators and institution administrators"),
      h: t("Mengelola akses, bukan keputusan pendidikan.", "Manage access, not educational decisions."),
      items: t([
        ["Akun, kelas, rombel, dan peran", "di satu tempat."],
        ["Kartu kelas", "untuk peserta didik, dengan penggantian yang aman bila hilang."],
        ["Pindah, naik kelas, dan purnatugas", "tanpa kehilangan riwayat."],
        ["Setiap perubahan penting", "tercatat: siapa, apa, kapan, dan mengapa."],
      ], [
        ["Accounts, classes, groups and roles", "in one place."],
        ["Class cards", "for learners, safely replaced when lost."],
        ["Transfers, moving up and retirement", "without losing the record."],
        ["Every consequential change", "recorded: who, what, when and why."],
      ]) },
    { id: "institusi", photo: "P6", role: t("Institusi", "Institutions"), who: t("Yayasan dan pengambil keputusan", "Foundations and decision-makers"),
      h: t("Riwayat pembelajaran yang dapat dipertanggungjawabkan.", "A learning record you can account for."),
      items: t([
        ["Konten bersama yang dikurasi,", "ditambah materi milik institusi sendiri."],
        ["Data institusi Anda", "terpisah dari institusi lain."],
        ["Bukti yang bertahan", "saat orang datang dan pergi."],
        ["Dasar yang jujur", "untuk keputusan dan pelaporan."],
      ], [
        ["Curated shared content,", "plus material that belongs to your institution."],
        ["Your institution’s data", "kept apart from every other institution."],
        ["Evidence that lasts", "as people come and go."],
        ["An honest basis", "for decisions and reporting."],
      ]) },
  ];

  const body = `
<section class="page-hero" aria-labelledby="aud-hero-h">
  <div class="wrap" data-reveal-group>
    ${label("", NAV_LABEL.audiences[c.lang])}
    <h1 class="h1" id="aud-hero-h" data-reveal>${t("Dirancang untuk setiap peran di <em>institusi.</em>", "Designed for every role in an <em>institution.</em>")}</h1>
    <div class="page-hero__aside" data-reveal>
      <p class="lead">${t("Satu platform, lima sudut pandang. Setiap orang melihat apa yang perlu ia lihat, dan hanya itu.", "One platform, five points of view. Everyone sees what they need to see, and only that.")}</p>
    </div>
  </div>
  <nav class="wrap" style="margin-top: var(--s-8)" aria-label="${t("Peran", "Roles")}"><div class="anchors">${roles.map((r) => `<a href="#${r.id}">${r.role}</a>`).join("")}</div></nav>
</section>

${roles.map((r, i) => `<section class="aud${i % 2 ? " aud--flip" : ""}" id="${r.id}" aria-labelledby="${r.id}-h">
  <div class="wrap cols">
    <div class="aud__photo" style="--span:5${i % 2 ? ";--start:8" : ""}" data-reveal>${photo(c, r.photo)}</div>
    <div style="--span:6;--start:${i % 2 ? 1 : 7}" data-reveal-group>
      <p class="aud__role">${String(i + 1).padStart(2, "0")} · ${r.role}</p>
      <p class="aud__who">${r.who}</p>
      <h2 class="h2" id="${r.id}-h" data-reveal>${r.h}</h2>
      <ol class="aud__list">${r.items.map(([b, d], k) => `<li data-reveal><span>${String(k + 1).padStart(2, "0")}</span><span><b>${b}</b> ${d}</span></li>`).join("")}</ol>
    </div>
  </div>
</section>`).join("\n")}

${demoBand(c, { heading: t("Lihat PINTAR dari sudut pandang Anda.", "See PINTAR from where you sit."), body: t("Pilih «Minta Demo», ceritakan peran Anda, dan kami menyiapkan demo yang sesuai.", "Choose «Request a Demo», tell us your role, and we will shape the demonstration around it.") })}
`;
  return {
    title: t("Untuk Siapa — PINTAR", "Who It’s For — PINTAR"),
    description: t("Manfaat PINTAR bagi peserta didik, pendidik, pimpinan, administrator, dan institusi.", "What PINTAR offers learners, educators, leadership, administrators and institutions."),
    body,
  };
}
