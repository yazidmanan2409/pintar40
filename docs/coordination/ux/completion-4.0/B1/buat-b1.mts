/**
 * B1 · W3.6 — Konfigurasi: an index, and one page per section (the split).
 * Design specimen, not application code. Run from the repository root, after the
 * design system's harness has written its tokens (sistem-desain/render/tokens.css):
 *
 *   npx tsx docs/coordination/ux/completion-4.0/B1/buat-b1.mts
 *
 * Words: the copy table at engineering commit 0b19707 (read with `git show`), plus the
 * new or changed keys in NEW (README §5). Components and tokens: the frozen design
 * system. People, schools and records are invented.
 */
import { execSync } from "node:child_process";
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync, readFileSync, mkdtempSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const sini = dirname(fileURLToPath(import.meta.url));
const repo = join(sini, "..", "..", "..", "..", "..");
const DS = join(repo, "docs/coordination/ux/sistem-desain");
const KOMIT = "0b19707";

const kerja = mkdtempSync(join(tmpdir(), "b1-"));
for (const f of ["hle.ts", "tanggal.ts"]) writeFileSync(join(kerja, f), execSync(`git show ${KOMIT}:src/lib/${f}`, { cwd: repo }));
const hle = await import(join(kerja, "hle.ts"));

/** New and changed keys (README §5). */
export const NEW: Record<string, { id: string; en: string; jenis: "baru" | "ubah" }> = {
  "config.kelompok.sekolah": { id: "Sekolah dan tahun ajaran", en: "School and school years", jenis: "baru" },
  "config.kelompok.murid": { id: "Murid", en: "Students", jenis: "baru" },
  "config.kelompok.staf": { id: "Staf dan akses", en: "Staff and access", jenis: "baru" },
  "config.kelompok.laporan": { id: "Laporan dan templat", en: "Reports and templates", jenis: "baru" },
  "config.kelompok.dukungan": { id: "Dukungan", en: "Support", jenis: "baru" },
  "config.lingkungan.development": { id: "Pengembangan", en: "Development", jenis: "baru" },
  "config.lingkungan.staging": { id: "Pengujian", en: "Staging", jenis: "baru" },
  "config.lingkungan.production": { id: "Produksi", en: "Production", jenis: "baru" },
  "config.kesehatan.jumlah": { id: "pemeriksaan perlindungan data, semuanya sesuai.", en: "data-protection checks, all as expected.", jenis: "ubah" },
};
const kata = (k: string, isi: Record<string, string | number> = {}) => {
  let v: string = NEW[k] ? NEW[k].id : hle.t(k, "staff", { locale: "id" });
  if (!v || v === k) throw new Error(`no words for ${k}`);
  for (const [a, b] of Object.entries(isi)) v = v.replace(`{${a}}`, String(b));
  return v;
};
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const ikon = (n: string) => `<i data-ikon="${n}"></i>`;
const slotMerek = `<span class="b1-slot" role="img" aria-label="Pintar (master pending F-11)">Pintar <small>(master pending F-11)</small></span>`;

// ── who is looking ───────────────────────────────────────────────────────────
type Pembaca = "sekolah" | "platform";
const ORANG = {
  sekolah: { inisial: "DS", nama: "Dewi Saraswati", peran: "Admin sekolah · SMP Cahaya Kaliandra" },
  platform: { inisial: "AN", nama: "Arif Nugraha", peran: "Admin platform · Seluruh platform" },
};
const SEKOLAH = "SMP Cahaya Kaliandra";

// ── the sections: one index entry each, in groups ───────────────────────────
type Bagian = { k: string; judul: string; sekolahSaja: boolean };
const KELOMPOK: Array<{ k: string; bagian: Bagian[] }> = [
  { k: "sekolah", bagian: [
    { k: "struktur", judul: kata("config.section.struktur"), sekolahSaja: true },
    { k: "ketuntasan", judul: kata("config.section.ketuntasan"), sekolahSaja: true },
    { k: "rollover", judul: kata("config.section.rollover"), sekolahSaja: true },
    { k: "system", judul: kata("config.section.system"), sekolahSaja: false },
  ] },
  { k: "murid", bagian: [
    { k: "pindah", judul: kata("config.section.pindah"), sekolahSaja: true },
    { k: "transfers", judul: kata("config.section.transfers"), sekolahSaja: true },
  ] },
  { k: "staf", bagian: [
    { k: "roles", judul: kata("config.section.roles"), sekolahSaja: false },
    { k: "peserta", judul: kata("config.section.peserta"), sekolahSaja: true },
    { k: "audit", judul: kata("config.section.audit"), sekolahSaja: false },
  ] },
  { k: "laporan", bagian: [
    { k: "laporan", judul: kata("config.laporan.judul"), sekolahSaja: true },
    // RV-24: the entry names the section it opens («Templat laporan»), not «Inteligensi & Laporan»
    { k: "intelligence", judul: kata("laporan.templat.judul"), sekolahSaja: true },
  ] },
  { k: "dukungan", bagian: [
    { k: "laporan-masalah", judul: kata("config.section.laporan_masalah"), sekolahSaja: false },
    { k: "pemeliharaan", judul: kata("config.section.pemeliharaan"), sekolahSaja: false },
  ] },
];

// ── the shell ────────────────────────────────────────────────────────────────
function shell(p: Pembaca, judul: string, isi: string): string {
  const tempat: Array<[string, string]> = p === "sekolah"
    ? [[kata("nav.konfigurasi"), "settings"], [kata("nav.pendataan"), "file-spreadsheet"], [kata("nav.aktivasi"), "user-check"], [kata("nav.studio"), "square-pen"], [kata("keamanan.judul"), "shield"], [kata("sertifikat.kelola.judul"), "award"]]
    : [[kata("nav.konfigurasi"), "settings"], [kata("nav.aktivasi"), "user-check"], [kata("nav.studio"), "square-pen"], [kata("emailuji.judul"), "mail"], [kata("keamanan.judul"), "shield"], [kata("sertifikat.kelola.judul"), "award"]];
  const o = ORANG[p];
  return `<div class="pds pds-jalan b1">
  <section class="pds-lewati-induk" data-shell data-shell-statis aria-label="${esc(judul)}">
  <a class="pds-lewati" href="#b1-isi">Langsung ke isi</a>
  <div class="pds-shell-host"><div class="pds-shell">
    <nav class="pds-nav" aria-label="${kata("nav.tempat")}">
      <div class="pds-nav-kepala">${slotMerek}</div>
      <ul class="pds-nav-daftar">${tempat.map(([t, i], n) => `<li><a href="#" class="pds-nav-item"${n === 0 ? ' aria-current="page"' : ""}>${ikon(i)}<span class="pds-nav-label">${t}</span></a></li>`).join("")}</ul>
      <div class="pds-nav-bawah"><div class="pds-identity" style="cursor:default"><span class="pds-avatar" aria-hidden="true">${o.inisial}</span><div><strong>${o.nama}</strong><small>${o.peran}</small></div></div>
      <button type="button" class="pds-nav-item pds-nav-keluar">${ikon("log-out")}<span class="pds-nav-label">${kata("sesi.keluar")}</span></button></div>
    </nav>
    <div class="pds-main">
      <header class="pds-bar">${slotMerek}<span class="pds-bar-tempat" aria-hidden="true">${kata("nav.konfigurasi")}</span><button type="button" class="pds-btn pds-btn-secondary">${kata("sesi.keluar")}</button><button type="button" class="pds-btn pds-btn-icon" aria-label="${kata("nav.menu")}">${ikon("menu")}</button></header>
      <main class="pds-main-isi" id="b1-isi" tabindex="-1">${isi}</main>
    </div>
  </div></div></section></div>`;
}
const kembali = `<p><a href="#" class="pds-back">${ikon("chevron-left")}${kata("nav.konfigurasi")}</a></p>`;
const kepalaBagian = (judul: string, arti?: string, konteks = true) => `<div class="pds-pagehead"><div>${kembali}<h1 class="pds-title">${esc(judul)}</h1>${konteks ? `<p class="b1-konteks">${kata("config.struktur.sekolah")}: <strong>${SEKOLAH}</strong></p>` : ""}${arti ? `<p class="pds-intro">${esc(arti)}</p>` : ""}</div></div>`;
const hasil = (ok: boolean, teks: string) => `<p class="pds-result ${ok ? "pds-result-ok" : "pds-result-blocked"}" role="status">${ikon(ok ? "circle-check" : "circle-alert")}<span>${esc(teks)}</span></p>`;
/** The Collection pager as built (Penomoran): keyset pages, so a page number and «more», never a total. */
const pager = (i: number, lagi: boolean, benda: string) => `<nav class="pds-pager" aria-label="${esc(kata("koleksi.halaman.label", { benda }))}"><span class="pds-pager-posisi">${kata("lesson.page_of")} ${i}</span><span class="pds-pager-gerak">
  ${i > 1 ? `<a href="#" class="pds-btn pds-btn-secondary" data-sebelum>${ikon("chevron-left")}<span>${kata("koleksi.kembali")}</span></a>` : ""}
  ${lagi ? `<a href="#" class="pds-btn pds-btn-secondary" data-sesudah><span>${kata("koleksi.berikutnya")}</span>${ikon("chevron-right")}</a>` : ""}
</span></nav>`;
let nomorField = 0;
const field = (label: string, kontrol: (id: string) => string, bantu?: string) => {
  const id = `f${++nomorField}`;
  return `<div class="pds-field"><label class="pds-label" for="${id}">${esc(label)}</label>${bantu ? `<p class="pds-help" id="${id}-b">${esc(bantu)}</p>` : ""}${kontrol(id)}</div>`;
};
const input = (attr = "") => (id: string) => `<input id="${id}" class="pds-input" ${attr}>`;
const pilih = (opsi: string[], attr = "") => (id: string) => `<span class="pds-select"><select id="${id}" ${attr}>${opsi.map((o) => `<option>${esc(o)}</option>`).join("")}</select>${ikon("chevron-down")}</span>`;
/** The built date field (TanggalDenganGema): the native field and, under it, the date in words (DateTime's echo). */
const gema = (id: string, teks: string) => `<p class="pds-gema" aria-live="polite">${ikon("calendar")}<span id="${id}-g">${teks}</span></p>`;
const tanggalIn = (id: string) => `<input id="${id}" class="pds-input" type="date" value="2027-06-30" aria-describedby="${id}-g">${gema(id, "Rabu, 30 Juni 2027")}`;
const waktuIn = (nilai: string, teks: string, attr = "") => (id: string) => `<input id="${id}" class="pds-input" type="datetime-local"${nilai ? ` value="${nilai}"` : ""} aria-describedby="${id}-g" ${attr}>${gema(id, teks)}`;
const centang = (label: string, cek = false) => `<label class="pds-choice"><input type="checkbox" class="pds-check"${cek ? " checked" : ""}> ${esc(label)}</label>`;

// ── the index ────────────────────────────────────────────────────────────────
function indeks(p: Pembaca, kosongMenunggu = false): string {
  const menunggu = kosongMenunggu ? [] : p === "sekolah"
    ? [["/pendataan", 1, "config.menunggu.pendataan"], ["/aktivasi", 12, "config.menunggu.aktivasi"], ["/studio", 3, "config.menunggu.studio"]] as const
    : [["/aktivasi", 41, "config.menunggu.aktivasi"]] as const;
  const bagianMenunggu = menunggu.length ? `<section class="pds-section" aria-labelledby="b1-menunggu"><h2 id="b1-menunggu">${kata("config.menunggu.judul")}</h2>
    <ul class="pds-list">${menunggu.map(([, n, k]) => `<li><a href="#" class="pds-list-row"><strong><span class="b1-angka">${n}</span> ${kata(k)}</strong>${ikon("chevron-right")}</a></li>`).join("")}</ul></section>` : "";
  const persiapan = p === "sekolah" ? `<section class="pds-section" aria-labelledby="b1-persiapan"><h2 id="b1-persiapan">${kata("config.persiapan.judul")}</h2><p class="pds-intro">${kata("config.persiapan.arti")}</p>
    <ul class="pds-list b1-langkah">
      <li><div class="pds-list-row"><strong>${kata("config.persiapan.kelas")} · <span class="b1-angka">6</span></strong><span class="pds-badge pds-badge-ok">${ikon("check")}${kata("config.persiapan.sudah")}</span></div></li>
      <li><div class="pds-list-row"><strong>${kata("config.persiapan.guru")}</strong><span class="pds-badge">${kata("config.persiapan.belum")}</span><small>${kata("config.persiapan.guru.kurang")} Kelas 8B, Kelas 9A · <a href="#" class="pds-link">${kata("config.persiapan.guru.cara")}</a></small></div></li>
      <li><div class="pds-list-row"><strong>${kata("config.persiapan.murid")} · <span class="b1-angka">187</span></strong><span class="pds-badge pds-badge-ok">${ikon("check")}${kata("config.persiapan.sudah")}</span></div></li>
    </ul><p class="pds-help">${kata("config.persiapan.admin_kedua")}</p></section>` : "";
  // RV-24 and RV-15: Admin platform only; the environment in words, never the raw value; no empty tile for anyone
  const keadaan = p === "platform" ? `<section class="pds-section" aria-labelledby="b1-sistem"><h2 id="b1-sistem" class="pds-sr">${kata("config.card.health")}</h2><div class="b1-ubin">
    <div class="pds-panel"><h3>${kata("config.card.health")}</h3><p><span class="pds-badge pds-badge-ok">${ikon("check")}${kata("config.kesehatan.sehat")}</span></p><p class="pds-help"><span class="b1-angka">22</span> ${kata("config.kesehatan.jumlah")}</p><div class="pds-actions"><a href="#" class="pds-btn pds-btn-secondary">${kata("config.kesehatan.ulang")}</a></div></div>
    <div class="pds-panel"><h3>${kata("config.environment")}</h3><p class="b1-nilai">${kata("config.lingkungan.staging")}</p></div>
  </div></section>` : "";
  const grup = KELOMPOK.map((g) => ({ ...g, bagian: g.bagian.filter((b) => p === "sekolah" || !b.sekolahSaja) })).filter((g) => g.bagian.length)
    .map((g) => `<section class="pds-section" aria-labelledby="b1-g-${g.k}"><h2 id="b1-g-${g.k}">${kata(`config.kelompok.${g.k}`)}</h2>
      <ul class="pds-list">${g.bagian.map((b) => `<li><a href="#" class="pds-list-row"><strong>${b.judul}</strong>${ikon("chevron-right")}</a></li>`).join("")}</ul></section>`).join("");
  const konteks = p === "sekolah" ? `<p class="b1-konteks">${kata("config.struktur.sekolah")}: <strong>${SEKOLAH}</strong></p>` : `<p class="b1-konteks"><strong>${kata("config.pemeliharaan.platform")}</strong></p>`;
  // RV-24: no «PINTAR» eyebrow above the title; the shell carries the name
  return shell(p, kata("config.title"), `<div class="pds-pagehead"><div><h1 class="pds-title">${kata("config.title")}</h1>${konteks}</div></div>${keadaan}${bagianMenunggu}${persiapan}${grup}`);
}

// ── section: Batas ketuntasan (a list; one row edited in place) ─────────────
type Pel = { judul: string; mapel: string; tingkat: string; pintar: boolean; persen: number | null; riwayat?: string[] };
const PELAJARAN: Pel[] = [
  { judul: "Pecahan senilai", mapel: "Matematika", tingkat: "Kelas 7", pintar: true, persen: 75, riwayat: ["75% · 12 Agu 2026, 09.10 WIB · oleh Dewi Saraswati · Keputusan rapat guru 11 Agustus", "70% · 18 Jul 2026, 14.02 WIB · oleh Dewi Saraswati · Batas awal tahun ajaran"] },
  { judul: "Teks deskripsi", mapel: "Bahasa Indonesia", tingkat: "Kelas 7", pintar: false, persen: null },
  { judul: "Sistem pernapasan manusia", mapel: "IPA", tingkat: "Kelas 8", pintar: true, persen: 70 },
  { judul: "Perbandingan senilai dan berbalik nilai", mapel: "Matematika", tingkat: "Kelas 8", pintar: true, persen: null },
];
function ketuntasan(kosong = false): string {
  if (kosong) return shell("sekolah", kata("config.section.ketuntasan"), `${kepalaBagian(kata("config.section.ketuntasan"), kata("config.ketuntasan.arti"))}<div class="pds-empty"><p>${kata("config.ketuntasan.kosong")}</p></div>`);
  const ubah = 1; // the second row is open for editing (?ubah=…)
  const baris = PELAJARAN.map((p, i) => {
    const nilai = p.persen === null ? `<span class="pds-badge">${kata("config.ketuntasan.belum")}</span>` : `<span class="b1-nilai-baris">${kata("config.ketuntasan.sekarang")} <span class="b1-angka">${p.persen}%</span></span>`;
    const meta = [p.mapel, p.tingkat, p.pintar ? kata("config.ketuntasan.materi_pintar") : null].filter(Boolean).join(" · ");
    const riwayat = p.riwayat ? `<details class="pds-disclosure b1-riwayat"><summary>${kata("config.ketuntasan.riwayat")}${ikon("chevron-down")}</summary><ul>${p.riwayat.map((r) => `<li>${esc(r)}</li>`).join("")}</ul></details>` : "";
    if (i === ubah) return `<li class="b1-baris b1-baris-buka"><div class="b1-baris-kepala"><div><strong>${esc(p.judul)}</strong><small>${esc(meta)}</small></div>${nilai}</div>
      <form class="pds-panel b1-form-baris" aria-label="${esc(kata("config.ketuntasan.tombol") + " · " + p.judul)}"><div class="b1-dua">${field(kata("config.ketuntasan.nilai"), input('type="number" inputmode="numeric" min="0" max="100" step="1" required'))}${field(kata("config.ketuntasan.alasan"), input(`required maxlength="300" placeholder="${esc(kata("config.ketuntasan.alasan_contoh"))}"`))}</div>
      <div class="pds-actions"><button type="submit" class="pds-btn pds-btn-primary">${kata("config.ketuntasan.tombol")}</button><a href="#" class="pds-btn pds-btn-quiet">${kata("config.angkat.batal")}</a></div></form>${riwayat}</li>`;
    return `<li class="b1-baris"><div class="b1-baris-kepala"><div><strong>${esc(p.judul)}</strong><small>${esc(meta)}</small></div>${nilai}<a href="#" class="pds-btn pds-btn-secondary b1-aksi" aria-label="${esc(kata("config.ketuntasan.tombol") + " · " + p.judul)}">${kata("config.ketuntasan.tombol")}</a></div>${riwayat}</li>`;
  }).join("");
  return shell("sekolah", kata("config.section.ketuntasan"), `${kepalaBagian(kata("config.section.ketuntasan"), kata("config.ketuntasan.arti"))}
    ${hasil(true, kata("config.result.ok"))}
    <ul class="pds-list b1-daftar">${baris}</ul>`);
}

// ── section: Peran & akses ───────────────────────────────────────────────────
function peran(p: Pembaca): string {
  const ROWS: Array<[string, string, string, string]> = p === "sekolah" ? [
    ["Bambang Irawan", "role.DEAN", "SMP Cahaya Kaliandra", "31 Jul 2027"],
    ["Citra Lestari", "role.EDUCATOR", "Kelas 7A", "30 Jun 2027"],
    ["Eko Prasetyo", "role.HEAD_OF_DEPARTMENT", "Matematika", "30 Jun 2027"],
    ["Fitri Handayani", "role.EDUCATOR", "Kelas 8B", "30 Jun 2027"],
    ["Gilang Ramadhan", "role.INSTITUTION_ADMIN", "SMP Cahaya Kaliandra", "31 Des 2027"],
  ] : [
    ["Hana Wibisono", "role.SYSTEM_ADMIN", kata("role.SYSTEM_ADMIN"), "31 Des 2027"],
    ["Dewi Saraswati", "role.INSTITUTION_ADMIN", "SMP Cahaya Kaliandra", "31 Des 2027"],
    ["Joko Santoso", "role.INSTITUTION_ADMIN", "SD Tunas Mandiri", "31 Jul 2027"],
  ];
  const cabut = 1;
  const rows = ROWS.map(([nama, r, lingkup, sampai], i) => {
    const kepala = `<div class="b1-baris-kepala"><div><strong>${nama}</strong><small>${kata(r)} · ${esc(lingkup)} · ${kata("config.label.valid_until")} ${sampai}</small></div>`;
    if (i === cabut) return `<li class="b1-baris b1-baris-buka">${kepala}</div><form class="pds-panel b1-form-baris" aria-label="${esc(kata("config.action.revoke") + " · " + nama)}">${field(kata("config.label.reason"), input('required maxlength="300" autocomplete="off"'))}
      <div class="pds-actions"><button type="submit" class="pds-btn pds-btn-destructive-confirm">${kata("config.action.revoke")}</button><a href="#" class="pds-btn pds-btn-quiet">${kata("config.angkat.batal")}</a></div></form></li>`;
    return `<li class="b1-baris">${kepala}<a href="#" class="pds-btn pds-btn-destructive b1-aksi" aria-label="${esc(kata("config.action.revoke") + " · " + nama)}">${kata("config.action.revoke")}</a></div></li>`;
  }).join("");
  const peranOpsi = ["role.EDUCATOR", "role.HEAD_OF_DEPARTMENT", "role.DEAN", "role.INSTITUTION_ADMIN", ...(p === "platform" ? ["role.SYSTEM_ADMIN"] : [])].map(kata);
  const form = `<section class="pds-section" aria-labelledby="b1-beri"><h2 id="b1-beri">${kata("config.action.grant")}</h2>
    <form class="pds-panel b1-form"><div class="b1-dua">${field(kata("config.label.person"), (id) => `<span class="pds-select"><select id="${id}" required><option value="" disabled selected>—</option><optgroup label="${kata("config.label.person_new")}"><option>Indah Permata</option></optgroup><optgroup label="${kata("config.label.person_known")}"><option>Citra Lestari</option><option>Eko Prasetyo</option></optgroup></select>${ikon("chevron-down")}</span>`)}
      ${field(kata("config.label.role"), pilih(peranOpsi))}${field(kata("config.label.scope"), pilih(p === "sekolah" ? ["—", "SMP Cahaya Kaliandra", "Kelas 7A", "Kelas 8B", "Matematika"] : ["—"]))}${field(kata("config.label.valid_until"), tanggalIn)}</div>
      <div class="pds-actions"><button type="submit" class="pds-btn pds-btn-primary">${kata("config.action.grant")}</button></div></form></section>`;
  return shell(p, kata("config.section.roles"), `${kepalaBagian(kata("config.section.roles"), undefined, p === "sekolah")}${p === "platform" ? `<p class="b1-konteks"><strong>${kata("config.pemeliharaan.platform")}</strong></p>` : ""}
    <section class="pds-section" aria-labelledby="b1-daftar-peran"><h2 id="b1-daftar-peran" class="pds-sr">${kata("config.section.roles")}</h2><ul class="pds-list b1-daftar">${rows}</ul>${pager(1, p === "sekolah", kata("config.section.roles").toLowerCase())}</section>${form}`);
}

// ── section: Jejak audit (a table: striped; «Versi» only when a row has one) ─
function audit(p: Pembaca): string {
  const R: Array<[string, string, string, string | null]> = [
    ["4 Nov 2026, 10.52 WIB", "audit.aksi.role.granted", "Peran · SMP Cahaya Kaliandra", p === "platform" ? "9b52b51" : null],
    ["4 Nov 2026, 10.41 WIB", "audit.aksi.role.revoked", "Peran · SMP Cahaya Kaliandra", p === "platform" ? "9b52b51" : null],
    ["4 Nov 2026, 09.15 WIB", "audit.aksi.LEARNING_ASSIGNED", "Kelas · SMP Cahaya Kaliandra", p === "platform" ? "0b19707" : null],
    ["3 Nov 2026, 15.20 WIB", "audit.aksi.CERTIFICATE_TEMPLATE_SAVED", "Sertifikat · SMP Cahaya Kaliandra", null],
    ["3 Nov 2026, 13.04 WIB", "audit.aksi.INTEGRITY_SIGNAL_REVIEWED", "Asesmen · SMP Cahaya Kaliandra", p === "platform" ? "0b19707" : null],
    ["2 Nov 2026, 08.30 WIB", "audit.aksi.RELEASE_CREATED", "Materi · SMP Cahaya Kaliandra", null],
  ];
  const versi = p === "platform" && R.some((r) => r[3]);
  return shell(p, kata("config.section.audit"), `${kepalaBagian(kata("config.section.audit"), undefined, p === "sekolah")}
    <div class="pds-table-wrap"><table class="pds-table"><caption class="pds-sr">${kata("config.section.audit")}</caption>
      <thead><tr><th scope="col">${kata("config.label.when")}</th><th scope="col">${kata("config.label.action")}</th><th scope="col">${kata("config.label.target")}</th>${versi ? `<th scope="col">${kata("config.label.build")}</th>` : ""}</tr></thead>
      <tbody>${R.map(([w, a, s, b]) => `<tr><td class="b1-waktu">${w}</td><td>${kata(a)}</td><td>${s}</td>${versi ? `<td class="b1-mono">${b ?? ""}</td>` : ""}</tr>`).join("")}</tbody></table></div>
    ${pager(2, true, kata("config.section.audit").toLowerCase())}`);
}

// ── section: Laporan masalah ────────────────────────────────────────────────
function laporanMasalah(): string {
  const L = [
    { status: "DITERIMA", henti: true, waktu: "4 Nov 2026, 08.12 WIB", oleh: "Citra Lestari", peran: "role.EDUCATOR", hal: "/mengajar/kelas-7a", ruj: "R-7Q2K", lakukan: "Membuka Uji Cepat Bab 3 untuk Kelas 7A.", harap: "Murid bisa mulai menjawab.", terjadi: "Murid melihat halaman kosong setelah menekan Mulai.", buka: true },
    { status: "DITANGANI", henti: false, waktu: "3 Nov 2026, 13.40 WIB", oleh: "Eko Prasetyo", peran: "role.HEAD_OF_DEPARTMENT", hal: "/studio", ruj: null, lakukan: "Mengunggah buku kerja paket Bab 4.", harap: "Paket tampil di Studio.", terjadi: "Unggahan berhenti di 90%.", langkah: "Tim PINTAR memeriksa berkasnya; Anda tidak perlu mengunggah ulang.", buka: false },
  ];
  const items = L.map((l) => `<li class="b1-baris${l.buka ? " b1-baris-buka" : ""}"><article aria-labelledby="lp-${l.waktu.length}${l.oleh.length}">
    <div class="b1-baris-kepala"><div><strong id="lp-${l.waktu.length}${l.oleh.length}"><span class="pds-sr">${kata("lapor.terjadi")} </span>${l.terjadi}</strong><small>${l.waktu} · ${l.oleh} · ${kata(l.peran)}</small></div><span class="b1-lencana"><span class="pds-badge">${kata(`lapor.status.${l.status}`)}</span>${l.henti ? `<span class="pds-badge pds-badge-attention">${ikon("circle-alert")}${kata("lapor.hentikan.singkat")}</span>` : ""}</span></div>
    <dl class="b1-dl"><dt>${kata("lapor.lakukan")}</dt><dd>${l.lakukan}</dd><dt>${kata("lapor.harapan")}</dt><dd>${l.harap}</dd></dl>
    <p class="pds-help"><span class="b1-mono">${l.hal}</span>${l.ruj ? ` · ${kata("lapor.rujukan")} <span class="b1-mono">${l.ruj}</span>` : ""} · <a href="#" class="pds-link">${kata("lapor.triase.tangkapan")}</a></p>
    ${l.langkah ? `<p class="b1-langkah-laporan"><strong>${kata("lapor.langkah")}</strong> ${l.langkah}</p>` : ""}
    ${l.buka ? "" : `<div class="pds-actions"><a href="#" class="pds-btn pds-btn-secondary" aria-label="${kata("lapor.triase.ubah")} · ${l.oleh}">${kata("lapor.triase.ubah")}</a></div>`}
    ${l.buka ? `<form class="pds-panel b1-form-baris" aria-label="${kata("lapor.triase.ubah")} · ${l.oleh}"><div class="b1-dua">${field(kata("lapor.triase.ubah"), pilih([kata("lapor.status.DITANGANI"), kata("lapor.status.SELESAI")]))}${field(kata("lapor.triase.langkah"), input('required maxlength="500" autocomplete="off"'))}</div>
      <div class="pds-actions"><button type="submit" class="pds-btn pds-btn-primary">${kata("lapor.triase.simpan")}</button><a href="#" class="pds-btn pds-btn-quiet">${kata("config.angkat.batal")}</a></div></form>` : ""}
  </article></li>`).join("");
  return shell("sekolah", kata("config.section.laporan_masalah"), `${kepalaBagian(kata("config.section.laporan_masalah"), kata("lapor.triase.arti"))}<ul class="pds-list b1-daftar">${items}</ul>${pager(1, true, kata("config.section.laporan_masalah").toLowerCase())}`);
}

// ── section: Pemeliharaan dan pengumuman (two steps; the second shown) ──────
function pemeliharaan(p: Pembaca): string {
  const cakupan = `<fieldset class="b1-fieldset"><legend class="pds-label">${kata("config.pemeliharaan.cakupan")}</legend>${p === "platform" ? centang(kata("config.pemeliharaan.platform")) : ""}${centang(SEKOLAH, true)}</fieldset>`;
  const langkah1 = `<form class="pds-form-group"><h3>${kata("config.pemeliharaan.daftar")}</h3>${cakupan}<div class="b1-dua">${field(kata("config.pemeliharaan.mulai"), waktuIn("2026-11-07T19:00", "Sabtu, 7 November 2026, 19.00 WIB"))}${field(kata("config.pemeliharaan.selesai"), waktuIn("2026-11-07T21:00", "Sabtu, 7 November 2026, 21.00 WIB"))}</div>
    <div class="pds-actions"><button type="submit" class="pds-btn pds-btn-secondary">${kata("config.pemeliharaan.periksa")}</button></div></form>`;
  const langkah2 = `<div class="pds-alert pds-alert-attention" role="status">${ikon("circle-alert")}<strong class="pds-alert-judul">${kata("config.pemeliharaan.tabrakan.perhatian")}</strong><p><span class="b1-angka">3</span> ${kata("config.pemeliharaan.tabrakan.jumlah")} ${kata("config.pemeliharaan.tabrakan.terakhir")} 7 Nov 2026, 19.40 WIB. ${kata("config.pemeliharaan.tabrakan.saran")} 7 Nov 2026, 19.40 WIB.</p></div>
    <form class="pds-panel b1-form">${field(kata("config.pemeliharaan.pesan"), (id) => `<textarea id="${id}" class="pds-textarea" rows="2" maxlength="500"></textarea>`)}${field(kata("config.pemeliharaan.alasan"), input('required maxlength="300" autocomplete="off"'))}${centang(kata("config.pemeliharaan.umumkan"))}
      <div class="pds-actions"><button type="submit" class="pds-btn pds-btn-primary">${kata("config.pemeliharaan.jadwalkan")}</button></div></form>`;
  const daftar = `<section class="pds-section" aria-labelledby="b1-jendela"><h2 id="b1-jendela">${kata("config.pemeliharaan.daftar")}</h2><ul class="pds-list b1-daftar">
    <li class="b1-baris"><div class="b1-baris-kepala"><div><strong>${kata("config.pemeliharaan.keadaan.TERJADWAL")} · ${kata("config.pemeliharaan.jenis.PLANNED")} · ${SEKOLAH}</strong><small>Sab, 14 Nov 2026, 19.00 WIB ${kata("config.pemeliharaan.hingga")} Sab, 14 Nov 2026, 20.30 WIB · ${kata("config.pemeliharaan.alasan")}: Pemindahan data rapor</small></div><a href="#" class="pds-btn pds-btn-secondary b1-aksi">${kata("config.pemeliharaan.batalkan")}</a></div></li>
    <li class="b1-baris"><div class="b1-baris-kepala"><div><strong>${kata("config.pemeliharaan.keadaan.BERAKHIR")} · ${kata("config.pemeliharaan.jenis.PLANNED")} · ${SEKOLAH}</strong><small>Sab, 31 Okt 2026, 19.00 WIB ${kata("config.pemeliharaan.hingga")} Sab, 31 Okt 2026, 19.45 WIB · ${kata("config.pemeliharaan.alasan")}: Pembaruan aplikasi</small></div></div></li>
  </ul></section>`;
  const pengumuman = `<section class="pds-section" aria-labelledby="b1-pengumuman"><h2 id="b1-pengumuman">${kata("config.pemeliharaan.pengumuman")}</h2><p class="pds-intro">${kata("config.pemeliharaan.pengumuman.arti")}</p><div class="pds-empty"><p>${kata("config.pemeliharaan.pengumuman.kosong")}</p></div>
    <form class="pds-panel b1-form">${cakupan}${field(kata("config.pemeliharaan.pengumuman.pesan"), input('required maxlength="500" autocomplete="off"'))}<div class="b1-dua">${field(kata("config.pemeliharaan.pengumuman.terbit"), waktuIn("", ""))}${field(kata("config.pemeliharaan.pengumuman.sampai"), waktuIn("", "", "required"))}</div>
      <div class="pds-actions"><button type="submit" class="pds-btn pds-btn-primary">${kata("config.pemeliharaan.pengumuman.terbitkan")}</button></div></form></section>`;
  const darurat = p === "platform" ? `<section class="pds-section" aria-labelledby="b1-darurat"><h2 id="b1-darurat">${kata("config.pemeliharaan.darurat.judul")}</h2><p class="pds-intro">${kata("config.pemeliharaan.darurat.arti")}</p>
    <form class="pds-panel b1-form">${cakupan}${field(kata("config.pemeliharaan.alasan"), input('required maxlength="300" autocomplete="off"'))}${field(kata("config.pemeliharaan.darurat.ketik"), input('required autocomplete="off"'))}
      <div class="pds-actions"><button type="submit" class="pds-btn pds-btn-destructive-confirm">${kata("config.pemeliharaan.darurat.tombol")}</button></div></form></section>` : "";
  return shell(p, kata("config.section.pemeliharaan"), `${kepalaBagian(kata("config.section.pemeliharaan"), kata("config.pemeliharaan.arti"), p === "sekolah")}
    <section class="pds-section" aria-labelledby="b1-jadwal"><h2 id="b1-jadwal" class="pds-sr">${kata("config.pemeliharaan.jadwalkan")}</h2>${langkah1}${langkah2}</section>${daftar}${pengumuman}${darurat}`);
}

// ── refusal and loading ─────────────────────────────────────────────────────
const penolakan = () => `<div class="pds b1"><main class="b1-tolak" id="b1-isi" tabindex="-1"><section class="pds-section">${slotMerek}<h1 class="pds-title">${kata("config.refused")}</h1><p class="pds-intro">${kata("tolak.arti")}</p><div class="pds-actions"><a href="#" class="pds-btn pds-btn-primary">${kata("galat.beranda")}</a></div><p class="pds-help">${kata("sesi.sebagai")} <strong>Citra Lestari</strong> · ${kata("sesi.bukan_anda")} · <a href="#" class="pds-link">${kata("sesi.keluar")}</a></p></section></main></div>`;
const memuat = () => shell("sekolah", kata("memuat.halaman"), `<div class="pds-skeleton" role="status" aria-label="${kata("memuat.halaman")}"><i class="pds-sk-judul"></i><i class="pds-sk-pendek"></i><i class="pds-sk-baris"></i><i class="pds-sk-baris"></i><i class="pds-sk-baris"></i><span class="pds-sr">${kata("memuat.halaman")}</span></div>`);

// ── render and check ─────────────────────────────────────────────────────────
type Lembar = { kode: string; judul: string; html: () => string; cetak?: boolean };
const LEMBAR: Lembar[] = [
  { kode: "indeks-sekolah", judul: "Index · Admin sekolah", html: () => indeks("sekolah"), cetak: true },
  { kode: "indeks-sekolah-tenang", judul: "Index · Admin sekolah, nothing waiting", html: () => indeks("sekolah", true) },
  { kode: "indeks-platform", judul: "Index · Admin platform in «Seluruh platform» (labelled substitute: from the code path)", html: () => indeks("platform") },
  { kode: "ketuntasan", judul: "Batas ketuntasan · one row being set, after a save", html: () => ketuntasan() },
  { kode: "ketuntasan-kosong", judul: "Batas ketuntasan · no lessons", html: () => ketuntasan(true) },
  { kode: "peran-sekolah", judul: "Peran & akses · Admin sekolah, one revocation open", html: () => peran("sekolah") },
  { kode: "peran-platform", judul: "Peran & akses · Admin platform (labelled substitute)", html: () => peran("platform") },
  { kode: "audit-sekolah", judul: "Jejak audit · Admin sekolah (no «Versi» column)", html: () => audit("sekolah"), cetak: true },
  { kode: "audit-platform", judul: "Jejak audit · Admin platform («Versi» where a row has one)", html: () => audit("platform") },
  { kode: "laporan-masalah", judul: "Laporan masalah · one report being moved on", html: () => laporanMasalah() },
  { kode: "pemeliharaan-sekolah", judul: "Pemeliharaan · step 2 (the collision check) · Admin sekolah", html: () => pemeliharaan("sekolah") },
  { kode: "pemeliharaan-platform", judul: "Pemeliharaan · Admin platform, with «Hentikan sekarang»", html: () => pemeliharaan("platform") },
  { kode: "penolakan", judul: "Refusal · a Guru opens Konfigurasi", html: penolakan },
  { kode: "memuat", judul: "Loading", html: memuat },
];

const GAYA = readFileSync(join(sini, "b1.css"), "utf8");
const RENDER = join(sini, "render"), JALAN = join(sini, "jalan");
mkdirSync(RENDER, { recursive: true }); mkdirSync(JALAN, { recursive: true });
const tokens = readFileSync(join(DS, "render/tokens.css"), "utf8").replace(/url\("\/(fonts\/[^"]+)"\)/g, (_, f) => `url("file://${repo}/public/${f}")`);
const bundleCss = readFileSync(join(DS, "project/components/bundle.css"), "utf8");
const bundleJs = readFileSync(join(DS, "project/components/bundle.js"), "utf8");
const req = createRequire(join(execSync("npm root -g").toString().trim(), "x.js"));
const { chromium } = req("playwright");
const axe = readFileSync(join(repo, "node_modules/axe-core/axe.min.js"), "utf8");
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const laporan: string[] = [];
const dsTemuan = new Set<string>();
let gagal = 0;
for (const l of LEMBAR) {
  nomorField = 0;
  const html = `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(l.judul)}</title><style>${tokens}</style><style>${bundleCss}</style><style>${GAYA}</style><script>${bundleJs}</script></head><body>${l.html()}<script>Pintar.siapkan();</script></body></html>`;
  writeFileSync(join(sini, `${l.kode}.html`), html);
  for (const w of [1280, 820, 390, 320]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 } });
    const page = await ctx.newPage();
    await page.setContent(html, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: join(RENDER, `${l.kode}-${w}.png`), fullPage: true });
    const masalah: string[] = [];
    const ukur = await page.evaluate(`(() => {
      var kecil = [];
      document.querySelectorAll("a, button, select, input, textarea, summary").forEach(function (e) {
        if (e.closest("[hidden]")) return; var r = e.getBoundingClientRect(); if (!r.width) return;
        if (e.type === "checkbox") return;
        // WCAG 2.5.8 exempts a link inside a sentence: its size is set by the line
        if (e.tagName === "A" && e.classList.contains("pds-link") && e.parentElement && /^(P|SMALL|SPAN)$/.test(e.parentElement.tagName)) return;
        if (r.height < 24 || r.width < 24) kecil.push(e.tagName + " «" + (e.textContent || "").trim().slice(0, 20) + "» " + Math.round(r.width) + "x" + Math.round(r.height));
      });
      var teks = document.body.innerText;
      return { lebar: document.documentElement.scrollWidth, kecil: kecil,
        mentah: (teks.match(/\\b(config|lapor|audit|role|nav)\\.[a-z_.A-Z]+/g) || []),
        kosongTile: /Lingkungan\\s*\\n?\\s*—/.test(teks), alis: [].some.call(document.querySelectorAll("main p"), function (x) { return x.textContent.trim() === "PINTAR"; }),
        garis: (function () { var r = document.querySelectorAll(".pds-table tbody tr"); if (r.length < 2) return true; return getComputedStyle(r[0].children[0]).backgroundColor !== getComputedStyle(r[1].children[0]).backgroundColor; })(),
        inteligensi: /Inteligensi/.test(teks), versiKosong: (function () { var th = [].filter.call(document.querySelectorAll("th"), function (t) { return t.textContent === "Versi"; })[0]; if (!th) return false; var i = [].indexOf.call(th.parentNode.children, th); return [].every.call(document.querySelectorAll("tbody tr"), function (r) { return !r.children[i] || !r.children[i].textContent.trim() || r.children[i].textContent.trim() === "—"; }); })() };
    })()`) as { lebar: number; kecil: string[]; mentah: string[]; kosongTile: boolean; inteligensi: boolean; versiKosong: boolean; alis: boolean; garis: boolean };
    if (ukur.lebar > w + 1) masalah.push(`sideways scroll ${ukur.lebar} at ${w}`);
    if (ukur.kecil.length) masalah.push(`targets under 24 px: ${ukur.kecil.join(", ")}`);
    if (ukur.mentah.length) masalah.push(`raw copy keys: ${ukur.mentah.join(", ")}`);
    if (ukur.kosongTile) masalah.push("RV-24: an empty «Lingkungan —» tile");
    if (ukur.inteligensi) masalah.push("RV-24: «Inteligensi & Laporan»");
    if (ukur.versiKosong) masalah.push("RV-24: an all-empty «Versi» column");
    if (ukur.alis) masalah.push("RV-24: a «PINTAR» eyebrow");
    if (!ukur.garis) masalah.push("RV-24: audit rows not striped");
    await page.addScriptTag({ content: axe });
    const pelanggaran = await page.evaluate(`axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] } }).then(function (r) { return r.violations.map(function (v) { return v.id + " (" + v.nodes.length + ": " + v.nodes.slice(0,2).map(function(n){return n.target.join(" ");}).join(" | ") + ")"; }); })`) as string[];
    masalah.push(...pelanggaran.map((v) => `axe ${v}`));
    if (w === 1280 || w === 320) {
      const tab: string[] = [];
      for (let i = 0; i < 45; i++) {
        await page.keyboard.press("Tab");
        const f = await page.evaluate(`(function () { var a = document.activeElement; if (!a || a === document.body) return ""; var cs = getComputedStyle(a); var cincin = (cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) >= 2) || /rgb/.test(cs.boxShadow); var nama = a.getAttribute("aria-label") || (a.labels && a.labels[0] && a.labels[0].textContent) || a.textContent || ""; var picker = /^(date|time|datetime-local)$/.test(a.type) && !a.matches(":focus-visible"); return a.tagName.toLowerCase() + " «" + nama.replace(/\\s+/g, " ").trim().slice(0, 60) + "»" + (picker ? "  DS-DATETIME" : cincin ? "" : "  NO RING"); })()`) as string;
        if (!f) break;
        tab.push(f);
        if (/NO RING/.test(f)) masalah.push(`no focus ring: ${f}`);
        if (/DS-DATETIME/.test(f)) dsTemuan.add(l.kode);
      }
      const pohon = await page.locator("main").ariaSnapshot();
      writeFileSync(join(JALAN, `${l.kode}-${w}.txt`), `${l.judul} at ${w} px: the Tab order from the top of the page\n${tab.map((x, i) => `${String(i + 1).padStart(2)}. ${x}`).join("\n")}\n\nThe accessibility tree of the main region\n${pohon}\n`);
    }
    if (masalah.length) gagal++;
    laporan.push(`${masalah.length ? "FAIL" : "ok  "} ${l.kode} @${w}${masalah.length ? "\n      " + masalah.join("\n      ") : ""}`);
    await ctx.close();
  }
  if (l.cetak) {
    const ctx = await browser.newContext({ viewport: { width: 794, height: 1123 } });
    const page = await ctx.newPage();
    await page.setContent(html, { waitUntil: "load" });
    await page.emulateMedia({ media: "print" });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: join(RENDER, `${l.kode}-a4.png`), fullPage: true });
    await page.pdf({ path: join(RENDER, `${l.kode}-a4.pdf`), format: "A4", printBackground: true, margin: { top: "15mm", bottom: "15mm", left: "15mm", right: "15mm" } });
    const tampak = await page.evaluate(`[".pds-nav", ".pds-bar", ".pds-lewati", ".pds-pager", ".pds-back"].filter(function (s) { var e = document.querySelector(s); return e && e.offsetParent !== null; })`) as string[];
    if (tampak.length) { gagal++; laporan.push(`FAIL ${l.kode} @A4\n      printed: ${tampak.join(", ")}`); } else laporan.push(`ok   ${l.kode} @A4`);
    await ctx.close();
  }
}
await browser.close();
const catatanDs = dsTemuan.size ? `\nDesign-system finding (not B1's; DateTime): a native date field's last Tab stop, the browser's calendar button, shows no ring. Seen on: ${[...dsTemuan].join(", ")}.\n` : "";
const ringkas = `${LEMBAR.length} pages × 4 widths (+ A4 for ${LEMBAR.filter((l) => l.cetak).length}): ${gagal} with a failure\n\n${laporan.join("\n")}\n${catatanDs}`;
writeFileSync(join(RENDER, "laporan.txt"), ringkas);
console.log(ringkas);
process.exit(gagal ? 1 : 0);
