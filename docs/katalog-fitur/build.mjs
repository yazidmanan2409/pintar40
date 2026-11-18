// Build «Katalog Lengkap Fitur PINTAR 4.0–5.0» from fitur.mjs: writes katalog.html, then prints
// PINTAR-KATALOG-FITUR-4.0-5.0.pdf with the pre-installed Chromium.
//   NODE_PATH=$(npm root -g) node docs/katalog-fitur/build.mjs
// Design grammar: the PINTAR handbook (design language v0.1): Plus Jakarta Sans only, deep teal #075056 for
// structure, ink #16262A / #44585C, hairlines #D5DFDF, teal tint #E4F0EF, a version tab in the top corner,
// running head, page number on the outer edge. Status marks always carry a word as well as a shape.
import { writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { VERSI, KANDIDAT, STATUS } from "./fitur.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const TANGGAL = "18 November 2026";
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const tanda = (k) => `<span class="ikon ikon-${k}" aria-hidden="true"></span>`;
const jumlah = (v) => v.kelompok.reduce((n, k) => n + k.fitur.length, 0);
const total = VERSI.reduce((n, v) => n + jumlah(v), 0);

const fitur = (f) => `
<article class="fitur" id="${f.id}">
  <header><h4>${esc(f.nama)}</h4><p class="status">${tanda(f.status)}${STATUS[f.status]}</p></header>
  <p class="untuk">Untuk: ${esc(f.untuk)}</p>
  <dl>
    <dt>Apa itu?</dt><dd>${esc(f.apa)}</dd>
    <dt>Apa manfaatnya?</dt><dd>${esc(f.manfaat)}</dd>
    <dt>Contoh penggunaan</dt><dd class="contoh">${esc(f.contoh)}</dd>
  </dl>
  ${f.catatan ? `<p class="catatan">${esc(f.catatan)}</p>` : ""}
</article>`;

const alur = (a) => `
<figure class="alur"><figcaption>${esc(a.judul)}</figcaption>
  <ol>${a.langkah.map((l) => `<li>${esc(l)}</li>`).join("")}</ol>
</figure>`;

const bab = (v) => `
<section class="bab bab-${v.id}" id="${v.id}">
  <div class="pembuka">
    <p class="versi">PINTAR ${v.v}</p>
    <h2>${esc(v.judul)}</h2>
    <p class="lede">${esc(v.pengantar)}</p>
    ${v.alur ? alur(v.alur) : ""}
    <div class="isi-bab">
      <p class="kecil-judul">Di bab ini · ${jumlah(v)} fitur</p>
      <ol>${v.kelompok.map((k) => `<li>${esc(k.judul)} <span>${k.fitur.length}</span></li>`).join("")}</ol>
    </div>
    ${v.tidak ? `<div class="tidak"><p class="kecil-judul">Yang sengaja tidak akan dilakukan PINTAR ${v.v}</p><ul>${v.tidak.map((t) => `<li>${esc(t)}</li>`).join("")}</ul></div>` : ""}
  </div>
  ${v.kelompok.map((k) => `
  <div class="kelompok">
    <h3><span>PINTAR ${v.v}</span>${esc(k.judul)}</h3>
    ${k.fitur.map(fitur).join("")}
  </div>`).join("")}
</section>`;

const ringkasan = [
  ["4.0", "Fondasi PINTAR", "Sekolah, akun dan peran, materi yang ditinjau, Pemetaan Awal dan Uji Penguasaan, hasil resmi, laporan tanpa peringkat, sertifikat yang dapat diperiksa, pengembangan profesi guru.", "Bukti belajar dapat dipercaya sejak awal.", "T"],
  ["4.1", "Keamanan, Kendali, dan Keandalan", "Pengaturan sesi satu murid, koreksi kunci jawaban oleh dua orang, penghentian darurat dan pemeliharaan terjadwal, catatan masuk dan cetak, satu perangkat penulis per sesi, draf soal dengan AI terpadu.", "Bukti tetap utuh ketika ada koreksi, gangguan, atau pemeliharaan.", "TDR"],
  ["4.2", "Penyempurnaan Operasional", "Mode Ujian, jabatan dan peran di dua sekolah, ekspor data, laporan periode lalu, koreksi struktur sekolah, serah terima kelas.", "Pekerjaan administrasi sekolah menjadi lengkap.", "P"],
  ["4.5", "Memahami Hasil Pembelajaran", "Kecerdasan Soal, identitas kompetensi, empat jenis pernyataan, Sebaran Hasil, Quiet Intelligence, sejarah yang dapat dijelaskan, evaluasi guru resmi dengan perlindungan.", "Guru memahami apa yang sungguh didukung bukti.", "P"],
  ["5.0", "Bertindak dan Berkembang", "Pertumbuhan Guru, Kesepakatan Pertumbuhan Bersama, intervensi dan tindak lanjut, jalur belajar yang diatur, perbaikan di tingkat sekolah.", "Guru bertindak, mengamati hasilnya, dan memperbaiki praktiknya.", "P"],
];

const html = `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Katalog Lengkap Fitur PINTAR 4.0–5.0</title>
<link rel="stylesheet" href="katalog.css">
</head>
<body>

<!-- ═══════════ SAMPUL ═══════════ -->
<section class="sampul">
  <p class="merek">PINTAR</p>
  <div class="sampul-isi">
    <p class="versi">Katalog fitur</p>
    <h1>Katalog Lengkap Fitur PINTAR 4.0–5.0</h1>
    <p class="lede">Apa fungsi setiap fitur, mengapa fitur itu berguna, dan bagaimana fitur itu digunakan di sekolah.</p>
    <ol class="tangga">${ringkasan.map(([v, j]) => `<li><span>${v}</span>${j}</li>`).join("")}</ol>
  </div>
  <p class="sampul-kaki">Status per ${TANGGAL} · Draf untuk ditinjau</p>
</section>

<!-- ═══════════ PENGANTAR ═══════════ -->
<section class="pengantar" id="pengantar">
  <p class="versi">Pengantar</p>
  <h2>Tentang PINTAR dan katalog ini</h2>

  <h3 class="sub">Apa itu PINTAR?</h3>
  <p>PINTAR adalah platform belajar dan asesmen untuk sekolah. Murid belajar dari titik yang sesuai dengan kemampuannya. Guru melihat apa yang sudah dan belum dikuasai kelasnya. Sekolah menjaga materi, akun, dan catatannya tetap tertata dari tahun ke tahun.</p>

  <h3 class="sub">Berbasis bukti</h3>
  <p>PINTAR menunjukkan bukti, bukan vonis. Setiap angka datang bersama dasarnya: dari berapa murid angka itu dihitung, dan apa batasnya. Jika buktinya belum cukup, PINTAR mengatakannya dan tidak menampilkan angka yang menyesatkan. Materi ditinjau orang kedua sebelum sampai ke murid. Koreksi menambah catatan baru dan tidak menghapus yang lama, sehingga hasil dari masa lalu selalu dapat dijelaskan.</p>
  <blockquote class="prinsip">AI membantu menyusun. Pendidik tetap memutuskan.</blockquote>

  <h3 class="sub">Dari 4.0 hingga 5.0</h3>
  <ol class="jalur">
    <li><b>4.0</b><span>Fondasi yang dapat dipercaya</span></li>
    <li><b>4.1</b><span>Integritas, pemulihan, dan kendali</span></li>
    <li><b>4.2</b><span>Pekerjaan operasional dilengkapi</span></li>
    <li><b>4.5</b><span>Memahami bukti dan pola</span></li>
    <li><b>5.0</b><span>Bertindak, mengamati, dan memperbaiki</span></li>
  </ol>
  <p class="kecil">Per ${TANGGAL}, sekolah masih memakai PINTAR versi September 2026. Versi 4.0 dan 4.1 akan dipakai sekolah setelah 4.1 diterima bersama para pendidik dan disetujui pemilik PINTAR.</p>

  <h3 class="sub">Cara membaca label status</h3>
  <table class="tabel-status">
    <tbody>
      <tr><td>${tanda("T")}${STATUS.T}</td><td>Sudah dibangun dan diuji di lingkungan uji (<i>staging</i>), yaitu salinan PINTAR untuk pengujian. Belum dipakai sekolah.</td></tr>
      <tr><td>${tanda("D")}${STATUS.D}</td><td>Sedang dibangun atau diselesaikan, dan belum tersedia di lingkungan uji.</td></tr>
      <tr><td>${tanda("R")}${STATUS.R}</td><td>Rancangannya sudah ditinjau dan disetujui, tetapi pembangunannya belum dimulai.</td></tr>
      <tr><td>${tanda("P")}${STATUS.P}</td><td>Termasuk rencana versi itu. Untuk 4.5 dan 5.0, ini berarti arah yang sudah disetujui; rincian dan layarnya belum ditetapkan.</td></tr>
      <tr><td>${tanda("K")}${STATUS.K}</td><td>Belum termasuk versi mana pun. Dikumpulkan di bab tersendiri di akhir katalog.</td></tr>
    </tbody>
  </table>
</section>

<!-- ═══════════ RINGKASAN ═══════════ -->
<section class="pengantar" id="ringkasan">
  <p class="versi">Ringkasan</p>
  <h2>Setiap versi dalam satu baris</h2>
  <table class="ringkasan">
    <thead><tr><th>Versi</th><th>Kemampuan utama</th><th>Manfaatnya</th><th>Fitur</th></tr></thead>
    <tbody>${ringkasan.map(([v, j, k, m, s]) => `<tr><td><b>${v}</b><span>${j}</span></td><td>${k}</td><td>${m}</td><td class="jumlah">${jumlah(VERSI.find((x) => x.v === v))}<span>${s.split("").map((c) => tanda(c)).join("")}</span></td></tr>`).join("")}</tbody>
  </table>
  <p class="kecil">Katalog ini memuat ${total} fitur di lima versi, ditambah ${KANDIDAT.length} kandidat dan hal yang belum ditetapkan. Setiap fitur dijelaskan dalam empat bagian: <b>Apa itu?</b>, <b>Apa manfaatnya?</b>, <b>Contoh penggunaan</b>, dan status. Semua nama orang dan sekolah dalam contoh adalah rekaan.</p>

  <h3 class="sub">Isi katalog</h3>
  <ol class="daftar-isi">
    ${VERSI.map((v) => `<li><a href="#${v.id}"><b>PINTAR ${v.v}</b> ${esc(v.judul)}</a><span>${jumlah(v)} fitur</span></li>`).join("")}
    <li><a href="#kandidat"><b>Lain</b> Kandidat dan hal yang belum ditetapkan</a><span>${KANDIDAT.length}</span></li>
    <li><a href="#perjalanan"><b>Penutup</b> Perjalanan PINTAR: Dari Memahami hingga Meningkatkan</a><span></span></li>
    <li><a href="#rujukan"><b>Lampiran</b> Rujukan teknis singkat</a><span></span></li>
  </ol>
</section>

${VERSI.map(bab).join("")}

<!-- ═══════════ KANDIDAT ═══════════ -->
<section class="bab bab-lain" id="kandidat">
  <div class="pembuka">
    <p class="versi">Di luar cakupan versi</p>
    <h2>Kandidat dan hal yang belum ditetapkan</h2>
    <p class="lede">Hal-hal berikut tercatat dalam rencana PINTAR, tetapi belum termasuk cakupan versi mana pun. Sebagian adalah kandidat yang menunggu persetujuan; sebagian ditunda ke setelah 4.2 dengan versi yang belum ditetapkan. Tidak ada satu pun yang tersedia.</p>
  </div>
  <table class="kandidat">
    <thead><tr><th>Fitur</th><th>Apa itu?</th><th>Status</th></tr></thead>
    <tbody>${KANDIDAT.map((k) => `<tr id="${k.id}"><td>${tanda("K")}<b>${esc(k.nama)}</b></td><td>${esc(k.apa)}</td><td>${esc(k.status)}</td></tr>`).join("")}</tbody>
  </table>
</section>

<!-- ═══════════ PENUTUP ═══════════ -->
<section class="bab bab-lain penutup" id="perjalanan">
  <div class="pembuka">
    <p class="versi">Penutup</p>
    <h2>Perjalanan PINTAR: Dari Memahami hingga Meningkatkan</h2>
    <p class="lede">Setiap versi PINTAR dibangun di atas versi sebelumnya. Urutannya disengaja: sebuah sekolah baru dapat memahami hasil belajar bila buktinya dapat dipercaya, dan baru dapat memperbaiki bila pemahamannya jujur.</p>
  </div>
  <ol class="tahap">
    <li><b>4.0</b><div><h4>Fondasi yang dapat dipercaya</h4><p>Sekolah, akun, materi yang ditinjau, asesmen, dan hasil resmi yang selalu dapat ditelusuri. Tanpa fondasi ini, tidak ada kesimpulan yang layak dipercaya.</p></div></li>
    <li><b>4.1</b><div><h4>Integritas, pemulihan, dan kendali</h4><p>Bukti tetap utuh ketika ada kesalahan kunci jawaban, perangkat yang mati, pemeliharaan, atau keadaan darurat. Setiap tindakan penting tercatat.</p></div></li>
    <li><b>4.2</b><div><h4>Pekerjaan operasional dilengkapi</h4><p>Pekerjaan administrasi yang ditunda diselesaikan, sehingga sekolah dapat mengurus dirinya sendiri dengan lengkap.</p></div></li>
    <li><b>4.5</b><div><h4>Memahami bukti dan pola yang bermakna</h4><p>PINTAR memeriksa mutu soal dulu, menyebut jenis setiap pernyataan, dan membantu guru menemukan apa yang penting dalam sekitar satu menit, tanpa menyimpulkan lebih dari buktinya.</p></div></li>
    <li><b>5.0</b><div><h4>Bertindak, mengamati, dan memperbaiki</h4><p>Guru memilih tindakan, mengamati apa yang terjadi sesudahnya, dan merenungkan hasilnya. Pertumbuhan guru dilindungi oleh kesepakatan bersama, bukan dipakai untuk memeringkat.</p></div></li>
  </ol>
  <blockquote class="prinsip besar">AI membantu menyusun.<br>Pendidik tetap memutuskan.</blockquote>
  <p class="kecil">Di setiap versi, keputusan tentang pembelajaran tetap pada pendidik. PINTAR menunjukkan bukti, menyebut batasnya, dan mencatat apa yang terjadi.</p>
</section>

<!-- ═══════════ RUJUKAN TEKNIS ═══════════ -->
<section class="bab bab-lain" id="rujukan">
  <div class="pembuka">
    <p class="versi">Lampiran</p>
    <h2>Rujukan teknis singkat</h2>
    <p class="lede">Untuk pembaca yang mengikuti laporan perkembangan PINTAR. Kode di bawah adalah nama tahap pembangunan 4.1, bukan nama fitur.</p>
  </div>
  <table class="kandidat rujukan">
    <thead><tr><th>Kode</th><th>Fitur dalam katalog ini</th></tr></thead>
    <tbody>
      <tr><td>B0</td><td>Tidak ada sekolah tanpa admin</td></tr>
      <tr><td>A1</td><td>Mengatur sesi asesmen satu murid · Kesempatan tambahan dengan persetujuan orang kedua · Sesi yang ditinggalkan ditutup dan dinilai · Asesmen murid yang ditangguhkan ditahan</td></tr>
      <tr><td>C1w</td><td>Meja kerja soal dan riwayat soal · Perbaikan kunci jawaban yang keliru</td></tr>
      <tr><td>B1</td><td>Catatan masuk dan cetak</td></tr>
      <tr><td>B2</td><td>Referensi pada setiap cetakan resmi</td></tr>
      <tr><td>A2a</td><td>Penghentian darurat yang lebih tepat sasaran</td></tr>
      <tr><td>A2b</td><td>Pemeliharaan terjadwal</td></tr>
      <tr><td>C2w</td><td>Catatan peninjau di samping soal · Menarik materi dari peredaran sekolah</td></tr>
      <tr><td>A3</td><td>Satu perangkat penulis untuk setiap sesi asesmen · Melanjutkan asesmen di perangkat lain · Kesempatan dihitung untuk semua versi asesmen</td></tr>
      <tr><td>C3w</td><td>Draf soal dengan AI terpadu PINTAR</td></tr>
      <tr><td>E</td><td>Penilaian penyedia AI (bukan fitur; menentukan apakah AI terpadu dapat ditawarkan)</td></tr>
      <tr><td>Z</td><td>Pengujian 4.1 sebagai satu kesatuan, lalu peninjauan bersama para pendidik</td></tr>
    </tbody>
  </table>
</section>

</body>
</html>`;

writeFileSync(join(here, "katalog.html"), html);

const { chromium } = createRequire(import.meta.url)("playwright");
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(pathToFileURL(join(here, "katalog.html")).href, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.pdf({ path: join(here, "PINTAR-KATALOG-FITUR-4.0-5.0.pdf"), preferCSSPageSize: true, printBackground: true, outline: true, tagged: true });
await browser.close();
console.log(`ok: ${total} fitur, ${KANDIDAT.length} kandidat`);
