// Build «Katalog Lengkap Fitur PINTAR 4.0–5.0» from fitur.mjs (+ rencana.mjs): writes katalog.html, then prints
// PINTAR-KATALOG-FITUR-4.0-5.0.pdf with the pre-installed Chromium. Two passes: the first finds the page of each
// section (pdftotext), the second prints the contents page with those page numbers.
//   NODE_PATH=$(npm root -g) node docs/katalog-fitur/build.mjs
// Design grammar: the PINTAR handbook (design language v0.1): Plus Jakarta Sans only, deep teal #075056 for
// structure, ink #16262A / #44585C, hairlines #D5DFDF, teal tint #E4F0EF, a version tab in the top corner, a
// running head, the page number on the outer edge. Every status mark carries a word as well as a shape.
import { writeFileSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { VERSI, KANDIDAT, STATUS, SEKOLAH, KEADAAN, SNAPSHOT } from "./fitur.mjs";
import { RENCANA } from "./rencana.mjs";
import { HARI } from "./perjalanan.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const PDF = join(here, "PINTAR-KATALOG-FITUR-4.0-5.0.pdf");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const tanda = (k) => `<span class="ikon ikon-${k}" aria-hidden="true"></span>`;
const jumlah = (v) => v.kelompok.reduce((n, k) => n + k.fitur.length, 0);
const semua = VERSI.flatMap((v) => v.kelompok.flatMap((k) => k.fitur.map((f) => ({ ...f, v: v.v }))));
const total = semua.length;
const byId = Object.fromEntries(semua.map((f) => [f.id, f]));
const hitung = (v, pred) => VERSI.find((x) => x.v === v).kelompok.flatMap((k) => k.fitur).filter(pred).length;
const hitungKeadaan = (v, k) => hitung(v, (f) => RENCANA[f.id]?.keadaan === k);

// ── one feature entry ───────────────────────────────────────────────────────────────────────────────
const statusBaris = (f) => `<p class="status">${tanda(f.status)}${STATUS[f.status]}</p>${SEKOLAH[f.status] ? `<p class="status sekolah">${tanda("S")}${SEKOLAH[f.status]}</p>` : ""}`;
const rencana = (r) => !r ? "" : `
  <dl class="rencana">
    <dt>Keadaan perencanaan</dt><dd><b>${KEADAAN[r.keadaan]}</b></dd>
    ${r.terbuka ? `<dt>Masih terbuka</dt><dd>${esc(r.terbuka)}</dd>` : ""}
    ${r.bergantung ? `<dt>Bergantung pada</dt><dd>${esc(r.bergantung)}</dd>` : ""}
  </dl>`;
const fitur = (f) => `
<article class="fitur" id="${f.id}">
  <header><h4>${esc(f.nama)}</h4><div class="status-wadah">${statusBaris(f)}</div></header>
  <p class="untuk">Untuk: ${esc(f.untuk)}</p>
  <dl>
    <dt>Apa itu?</dt><dd>${esc(f.apa)}</dd>
    <dt>Apa manfaatnya?</dt><dd>${esc(f.manfaat)}</dd>
    <dt>Contoh penggunaan</dt><dd class="contoh">${esc(f.contoh)}</dd>
  </dl>
  ${f.catatan ? `<p class="catatan">${esc(f.catatan)}</p>` : ""}${rencana(RENCANA[f.id])}
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

// ── the five-release overview ────────────────────────────────────────────────────────────────────────
const IKHTISAR = [
  { v: "4.0", id: "v40", tujuan: "Fondasi yang dapat dipercaya.",
    kemampuan: "Penyiapan sekolah, akun dan peran, Studio, mengajar dan asesmen, hasil, laporan, sertifikat, dan pengembangan profesi guru.",
    status: () => `${tanda("T")}Dibangun dan diuji; diterima di lingkungan uji pada 10 November 2026.<br>${tanda("S")}Belum tersedia di sekolah.` },
  { v: "4.1", id: "v41", tujuan: "Bukti tetap utuh ketika ada koreksi, gangguan, atau pemeliharaan.",
    kemampuan: "Pengaturan sesi asesmen, koreksi soal dan kunci jawaban, catatan akuntabilitas, penghentian darurat, pemeliharaan terjadwal, catatan peninjau, pemulihan sesi, dan draf soal dengan bantuan AI.",
    status: () => `${tanda("T")}${hitung("4.1", (f) => f.status === "T")} diterima di lingkungan uji · ${tanda("D")}${hitung("4.1", (f) => f.status === "D")} sedang dikembangkan · ${tanda("R")}${hitung("4.1", (f) => f.status === "R")} selesai dirancang.<br>${tanda("S")}Belum tersedia di sekolah. Sekolah menerimanya setelah 4.1 diuji sebagai satu kesatuan, ditinjau bersama para pendidik, dan disetujui pemilik PINTAR.` },
  { v: "4.2", id: "v42", tujuan: "Melengkapi pekerjaan operasional yang ditunda.",
    kemampuan: "Mode Ujian, jabatan dan peran di dua sekolah, administrasi sekolah dan akun, serah terima kelas, ekspor data sekolah, dan laporan periode lalu.",
    status: () => `${tanda("P")}Ditunda pemilik PINTAR ke 4.2; rencana rinci belum disusun. Keadaan perencanaan: ${hitungKeadaan("4.2", "COMPLETE")} siap, ${hitungKeadaan("4.2", "PARTIAL")} sebagian siap, ${hitungKeadaan("4.2", "UNRESOLVED")} menunggu keputusan.<br>Pilihan kebijakan yang masih terbuka antara lain: arti Mode Ujian dan akomodasinya, data yang boleh diekspor, tampilan laporan periode lalu, wewenang atas orang yang bekerja di dua sekolah, dan penempatan statistik Kesehatan soal terjadwal. Tidak ada pilihan terbuka yang ditulis seolah sudah diputuskan.` },
  { v: "4.5", id: "v45", tujuan: "Memahami apa yang sungguh didukung oleh bukti.",
    kemampuan: "Kecerdasan Soal, kesebandingan asesmen, identitas kompetensi, pemetaan pemahaman keliru, Quiet Intelligence (nama kerja), sejarah yang dapat dijelaskan, dan evaluasi guru resmi yang diatur institusi beserta perlindungannya.",
    status: () => `${tanda("A")}Arah disetujui; belum direncanakan dan belum dibangun. Pelaksanaannya memerlukan perencanaan dan persetujuan tersendiri.<br>Rancangan dan kebijakan masih harus disusun, terutama kebijakan evaluasi guru resmi, kebijakan masa simpan bukti, jangkar identitas kompetensi, dan kode pemahaman keliru.` },
  { v: "5.0", id: "v50", tujuan: "Bertindak atas temuan, mengamati hasilnya, dan berkembang.",
    kemampuan: "Pertumbuhan Guru, Kesepakatan Pertumbuhan Bersama, intervensi dan tindak lanjut, jalur belajar yang diatur, dan perbaikan di tingkat bagian dan sekolah.",
    status: () => `${tanda("A")}Arah disetujui; belum direncanakan dan belum dibangun.<br>Bergantung pada fondasi 4.5: Kecerdasan Soal, kesebandingan asesmen, identitas kompetensi, empat jenis pernyataan, dan perlindungan guru. Aturan intervensi (persetujuan, pemberitahuan keluarga, dan bantuan yang tetap diberikan) harus diputuskan lebih dulu.` },
];

const chip = (id) => { const f = byId[id]; return `<a class="chip" href="#${id}">${tanda(f.status)}${esc(f.nama)} <span>${f.v}</span></a>`; };

// ── the document ─────────────────────────────────────────────────────────────────────────────────────
const halaman = (hal) => (id) => hal[id] ? String(hal[id]) : "";
const DAFTAR = [
  ["ikhtisar", "Ringkasan", "Lima rilis sekilas"],
  ["hari", "Contoh", "Hari-hari biasa di sekolah"],
  ...VERSI.map((v) => [v.id, `PINTAR ${v.v}`, v.judul, `${jumlah(v)} fitur`]),
  ["kandidat", "Lain", "Kandidat dan hal yang belum ditetapkan", `${KANDIDAT.length}`],
  ["perjalanan", "Penutup", "Perjalanan PINTAR: Dari Memahami hingga Meningkatkan"],
  ["rujukan", "Lampiran", "Rujukan teknis singkat"],
];

const html = (hal) => `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Katalog Lengkap Fitur PINTAR 4.0–5.0</title>
<link rel="stylesheet" href="katalog.css">
</head>
<body>

<section class="sampul">
  <p class="merek">PINTAR</p>
  <div class="sampul-isi">
    <p class="versi">Katalog fitur</p>
    <h1>Katalog Lengkap Fitur PINTAR 4.0–5.0</h1>
    <p class="lede">${total} entri fitur di lima rilis, ditambah ${KANDIDAT.length} kandidat atau entri yang belum ditetapkan. Apa fungsi setiap fitur, mengapa berguna, dan bagaimana digunakan di sekolah.</p>
    <ol class="tangga">${VERSI.map((v) => `<li><span>${v.v}</span>${esc(v.judul)}<em>${jumlah(v)}</em></li>`).join("")}</ol>
  </div>
  <p class="sampul-kaki">Keadaan per ${SNAPSHOT} · Draf untuk ditinjau</p>
</section>

<section class="pengantar" id="daftar-isi">
  <p class="versi">Isi</p>
  <h2>Daftar isi</h2>
  <ol class="daftar-isi">
    ${DAFTAR.map(([id, a, b, c]) => `<li><a href="#${id}"><b>${a}</b> ${esc(b)}${c ? ` <span class="jml">· ${c}</span>` : ""}</a><span class="hal">${halaman(hal)(id)}</span></li>`).join("")}
  </ol>

  <h3 class="sub">Tentang PINTAR</h3>
  <p>PINTAR adalah platform belajar dan asesmen untuk sekolah. Murid belajar dari titik yang sesuai dengan kemampuannya. Guru melihat apa yang sudah dan belum dikuasai kelasnya. Sekolah menjaga materi, akun, dan catatannya tetap tertata dari tahun ke tahun.</p>
  <p>PINTAR menunjukkan bukti, bukan vonis. Setiap angka datang bersama dasarnya. Jika buktinya belum cukup, PINTAR mengatakannya dan tidak menampilkan angka yang menyesatkan. Materi ditinjau orang kedua sebelum sampai ke murid, dan koreksi menambah catatan baru tanpa menghapus yang lama.</p>
  <blockquote class="prinsip">AI membantu menyusun. Pendidik tetap memutuskan.</blockquote>
</section>

<section class="pengantar" id="ikhtisar">
  <p class="versi">Ringkasan</p>
  <h2>Lima rilis sekilas</h2>
  <p class="lede">${total} entri fitur di lima rilis, ditambah ${KANDIDAT.length} kandidat atau entri yang belum ditetapkan. Keadaan per ${SNAPSHOT}; sekolah masih memakai PINTAR versi September 2026.</p>
  <div class="ikhtisar">
    ${IKHTISAR.map((x) => { const v = VERSI.find((y) => y.v === x.v); return `
    <a class="rilis" href="#${x.id}">
      <div class="rilis-kepala"><b>${x.v}</b><span>${esc(v.judul)}</span><em>${jumlah(v)} fitur</em></div>
      <dl>
        <dt>Tujuan</dt><dd>${esc(x.tujuan)}</dd>
        <dt>Kemampuan utama</dt><dd>${esc(x.kemampuan)}</dd>
        <dt>Status</dt><dd>${x.status()}</dd>
      </dl>
    </a>`; }).join("")}
  </div>
</section>

<section class="pengantar" id="status">
  <p class="versi">Cara membaca</p>
  <h2>Label status</h2>
  <p>Setiap fitur dijelaskan dalam empat bagian: <b>Apa itu?</b>, <b>Apa manfaatnya?</b>, <b>Contoh penggunaan</b>, dan status. Status memiliki bentuk dan kata, sehingga tetap terbaca bila dicetak hitam putih. Semua nama orang dan sekolah dalam contoh adalah rekaan.</p>
  <table class="tabel-status">
    <tbody>
      <tr><td>${tanda("T")}${STATUS.T}</td><td>Sudah dibangun, diuji, dan diterima di lingkungan uji (<i>staging</i>), yaitu salinan PINTAR untuk pengujian.</td></tr>
      <tr><td>${tanda("S")}${SEKOLAH.T}</td><td>Label terpisah tentang ketersediaan di sekolah. Per ${SNAPSHOT}, belum ada fitur 4.0 atau 4.1 yang tersedia di sekolah. Sekolah menerimanya setelah 4.1 diterima.</td></tr>
      <tr><td>${tanda("D")}${STATUS.D}</td><td>Sedang dibangun atau diselesaikan, dan belum diterima di lingkungan uji.</td></tr>
      <tr><td>${tanda("R")}${STATUS.R}</td><td>Rancangannya sudah ditinjau dan disetujui, tetapi pembangunannya belum dimulai.</td></tr>
      <tr><td>${tanda("P")}${STATUS.P}</td><td>Ditunda pemilik PINTAR ke 4.2. Rencana rincinya belum disusun; rincian, layar, dan urutannya ditetapkan dalam rencana 4.2 setelah 4.1 diterima.</td></tr>
      <tr><td>${tanda("A")}${STATUS.A}</td><td>Arah 4.5 atau 5.0 yang sudah disetujui pemilik PINTAR, tetapi belum direncanakan. Pelaksanaannya memerlukan perencanaan dan persetujuan tersendiri; rancangan dan kebijakannya masih harus disusun.</td></tr>
      <tr><td>${tanda("K")}${STATUS.K}</td><td>Belum termasuk rilis mana pun. Dikumpulkan di bab tersendiri.</td></tr>
    </tbody>
  </table>
  <h3 class="sub">Keadaan perencanaan</h3>
  <p>Untuk 4.2, 4.5, dan 5.0, setiap fitur juga menunjukkan keadaan perencanaannya dan pilihan yang masih terbuka.</p>
  <table class="tabel-status">
    <tbody>
      <tr><td><b>${KEADAAN.COMPLETE}</b></td><td>Tidak ada keputusan yang tersisa; fitur dapat masuk perencanaan rinci.</td></tr>
      <tr><td><b>${KEADAAN.PARTIAL}</b></td><td>Sebagian besar sudah jelas; sisanya dapat diselesaikan oleh tim dalam perencanaan.</td></tr>
      <tr><td><b>${KEADAAN.UNRESOLVED}</b></td><td>Menunggu keputusan pemilik PINTAR atau keputusan kebijakan, yang disebut di bawah «Masih terbuka».</td></tr>
      <tr><td><b>${KEADAAN.BLOCKED}</b></td><td>Belum dapat direncanakan karena bergantung pada fitur atau keputusan lain, yang disebut di bawah «Bergantung pada».</td></tr>
    </tbody>
  </table>
</section>

<section class="pengantar" id="hari">
  <p class="versi">Contoh</p>
  <h2>Hari-hari biasa di sekolah</h2>
  <p class="lede">Lima keadaan sehari-hari menunjukkan bagaimana fitur-fitur ini bekerja bersama. Bagian ini tidak menambah jumlah fitur. Tanda di samping setiap fitur menunjukkan statusnya.</p>
  ${HARI.map((h) => `
  <div class="hari">
    <h3>${esc(h.judul)}</h3>
    <p>${esc(h.cerita)}</p>
    <p class="chips">${h.fitur.map(chip).join("")}</p>
  </div>`).join("")}
</section>

${VERSI.map(bab).join("")}

<section class="bab bab-lain" id="kandidat">
  <div class="pembuka">
    <p class="versi">Di luar cakupan rilis</p>
    <h2>Kandidat dan hal yang belum ditetapkan</h2>
    <p class="lede">Hal-hal berikut tercatat dalam rencana PINTAR, tetapi belum termasuk rilis mana pun. Sebagian adalah kandidat yang menunggu persetujuan; sebagian ditunda ke setelah 4.2 dengan versi yang belum ditetapkan. Tidak ada satu pun yang tersedia, dan semuanya tidak dihitung dalam ${total} entri fitur.</p>
  </div>
  <table class="kandidat">
    <thead><tr><th>Entri</th><th>Apa itu?</th><th>Status</th></tr></thead>
    <tbody>${KANDIDAT.map((k) => `<tr id="${k.id}"><td>${tanda("K")}<b>${esc(k.nama)}</b></td><td>${esc(k.apa)}</td><td>${esc(k.status)}</td></tr>`).join("")}</tbody>
  </table>
</section>

<section class="bab bab-lain penutup" id="perjalanan">
  <div class="pembuka">
    <p class="versi">Penutup</p>
    <h2>Perjalanan PINTAR: Dari Memahami hingga Meningkatkan</h2>
    <p class="lede">Setiap rilis PINTAR dibangun di atas rilis sebelumnya. Urutannya disengaja: sekolah baru dapat memahami hasil belajar bila buktinya dapat dipercaya, dan baru dapat memperbaiki bila pemahamannya jujur.</p>
  </div>
  <ol class="tahap">
    <li><b>4.0</b><div><h4>Fondasi yang dapat dipercaya</h4><p>Sekolah, akun, materi yang ditinjau, asesmen, dan hasil resmi yang selalu dapat ditelusuri. Tanpa fondasi ini, tidak ada kesimpulan yang layak dipercaya.</p></div></li>
    <li><b>4.1</b><div><h4>Integritas, pemulihan, dan kendali</h4><p>Bukti tetap utuh ketika ada kesalahan kunci jawaban, perangkat yang mati, pemeliharaan, atau keadaan darurat. Setiap tindakan penting tercatat.</p></div></li>
    <li><b>4.2</b><div><h4>Pekerjaan operasional dilengkapi</h4><p>Pekerjaan administrasi yang ditunda diselesaikan, sehingga sekolah dapat mengurus dirinya sendiri dengan lengkap.</p></div></li>
    <li><b>4.5</b><div><h4>Memahami bukti dan pola yang bermakna</h4><p>PINTAR memeriksa mutu soal dulu, menyebut jenis setiap pernyataan, dan membantu guru menemukan apa yang penting, tanpa menyimpulkan lebih dari buktinya.</p></div></li>
    <li><b>5.0</b><div><h4>Bertindak, mengamati, dan memperbaiki</h4><p>Guru memilih tindakan, mengamati apa yang terjadi sesudahnya, dan merenungkan hasilnya. Pertumbuhan guru dilindungi oleh kesepakatan bersama, bukan dipakai untuk memeringkat.</p></div></li>
  </ol>
  <blockquote class="prinsip besar">AI membantu menyusun.<br>Pendidik tetap memutuskan.</blockquote>
  <p class="kecil">Di setiap rilis, keputusan tentang pembelajaran tetap pada pendidik. PINTAR menunjukkan bukti, menyebut batasnya, dan mencatat apa yang terjadi.</p>
</section>

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
      <tr><td>A2a</td><td>Penghentian darurat yang menahan sesi asesmen</td></tr>
      <tr><td>A2b</td><td>Pemeliharaan terjadwal per kelas dan per sekolah</td></tr>
      <tr><td>C2w</td><td>Catatan peninjau di samping soal · Menarik materi dari peredaran sekolah</td></tr>
      <tr><td>A3</td><td>Satu perangkat penulis untuk setiap sesi asesmen · Melanjutkan asesmen di perangkat lain · Kesempatan dihitung untuk semua versi asesmen</td></tr>
      <tr><td>C3w</td><td>Draf soal dengan AI terpadu PINTAR</td></tr>
      <tr><td>Z</td><td>Pengujian 4.1 sebagai satu kesatuan, lalu peninjauan bersama para pendidik</td></tr>
    </tbody>
  </table>
  <p class="kecil">Katalog ini tidak menyebut nama penyedia AI, hasil penilaiannya, atau harga.</p>
</section>

</body>
</html>`;

const { chromium } = createRequire(import.meta.url)("playwright");
const browser = await chromium.launch();
async function cetak(hal) {
  writeFileSync(join(here, "katalog.html"), html(hal));
  const page = await browser.newPage();
  await page.goto(pathToFileURL(join(here, "katalog.html")).href, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.pdf({ path: PDF, preferCSSPageSize: true, printBackground: true, outline: true, tagged: true });
  await page.close();
}
// pass 1: find each section's page from the PDF's own text
await cetak({});
const teks = execFileSync("pdftotext", ["-layout", PDF, "-"], { encoding: "utf8" }).split("\f");
const cari = (re, mulai = 2) => { for (let i = mulai; i < teks.length; i++) if (re.test(teks[i])) return i + 1; return ""; };
const hal = {
  ikhtisar: cari(/Lima rilis sekilas/, 2),
  hari: cari(/Hari-hari biasa di sekolah/, 2),
  kandidat: cari(/Di luar cakupan rilis/),
  perjalanan: cari(/Perjalanan PINTAR: Dari Memahami hingga/, 5),
  rujukan: cari(/Rujukan teknis singkat/, 10),
};
for (const v of VERSI) hal[v.id] = cari(new RegExp(`Di bab ini · ${jumlah(v)} fitur`));
// pass 2: the contents page with page numbers
await cetak(hal);
await browser.close();
const n = execFileSync("pdfinfo", [PDF], { encoding: "utf8" }).match(/Pages:\s+(\d+)/)[1];
console.log(`ok: ${total} fitur, ${KANDIDAT.length} kandidat, ${n} halaman; daftar isi: ${JSON.stringify(hal)}`);
