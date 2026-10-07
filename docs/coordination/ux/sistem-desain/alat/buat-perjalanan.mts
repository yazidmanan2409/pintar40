/**
 * THE COMPOSED JOURNEYS J1–J7 (11-validation.md §1). Review tooling, not product code. Run from the
 * repository root:
 *
 *   npx tsx docs/coordination/ux/sistem-desain/alat/buat-perjalanan.mts
 *
 * Each journey becomes one design-system card, project/components/J<n>…/preview.html, with its
 * README (the record), and the harness gets one scenario per screen and width in alat/skenario.json,
 * so every screen is checked at 1280, 1024 and 390 px.
 *
 * Every word on a product screen comes from the copy table (src/lib/hle.ts, D-014) through kata(),
 * which refuses a key that has no copy. A word that is not in the table yet goes through baru(): it is
 * marked (data-kata-baru, outlined by «Mark new words») and listed in the record. The review bar above
 * the screens is not PINTAR; it is in English. People, schools and classes are invented.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { t, type HleEvent } from "../../../../../src/lib/hle.js";

const sini = dirname(fileURLToPath(import.meta.url));
const proyek = join(sini, "..", "project");
const LEBAR = [1280, 1024, 390];

// ── words ─────────────────────────────────────────────────────────────────────
type Persona = "educator" | "learner" | "staff" | "public";
let dipakai = new Set<string>();
let kataBaru = new Map<string, string>();
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
/** The copy table's Indonesian words for a key, escaped. Refuses a key with no copy. */
function kata(k: string, persona: Persona = "educator"): string {
  const v = t(k as HleEvent, persona, { locale: "id" });
  if (!v || v === "—" || v === k) throw new Error(`no copy for ${k}`);
  dipakai.add(k);
  return esc(v);
}
/** The same words, raw, for an attribute. */
const kataAttr = (k: string, persona: Persona = "educator") => kata(k, persona);
/** A word that is not in the copy table yet: marked on the screen and listed in the record. */
function baru(teks: string, mengapa: string): string {
  kataBaru.set(teks, mengapa);
  return `<span data-kata-baru>${esc(teks)}</span>`;
}
/** A new word inside an attribute (a button's working or done word, an accessible name): listed only. */
function baruAttr(teks: string, mengapa: string): string {
  kataBaru.set(teks, mengapa);
  return esc(teks);
}
const ikon = (n: string) => `<i data-ikon="${n}"></i>`;
const merek = (cls = "") => `<span class="pds-merek${cls ? " " + cls : ""}" role="img" aria-label="PINTAR">PINTAR</span>`;

// ── people, invented ──────────────────────────────────────────────────────────
type Orang = { nama: string; inisial: string; konteks: string };
const SEKOLAH = "SDN Kaliandra 1";
const RINA: Orang = { nama: "Rina Kartika", inisial: "RK", konteks: `Guru · ${SEKOLAH}` };
const MAYA: Orang = { nama: "Maya Kusuma", inisial: "MK", konteks: `Admin sekolah · ${SEKOLAH}` };
const BAB = "Bab 3 · Pecahan senilai";
const MAPEL = "Matematika";
const KELAS = "Kelas 5A";
const MURID = [
  "Adi Pratama", "Agus Salim", "Ayu Lestari", "Bagus Santoso", "Bayu Aji", "Citra Dewi", "Dewi Kusuma", "Dimas Anggara",
  "Eka Putri", "Fajar Nugroho", "Fitri Handayani", "Gita Maharani", "Hendra Wijaya", "Indah Permatasari", "Intan Permata",
  "Joko Susilo", "Kartika Sari", "Lukman Hakim", "Maya Anggraini", "Muhammad Rizky Ramadhan Saputra Nugraha", "Nanda Pratiwi",
  "Nur Aisyah", "Oki Setiawan", "Putri Ramadhani", "Rahmat Hidayat", "Rina Marlina", "Sari Wulandari", "Teguh Prasetyo",
  "Umar Faruq", "Wulan Safitri", "Yoga Firmansyah",
];

// ── the staff shell (App shell), static ──────────────────────────────────────
type Tempat = { kunci: string; ikon: string; ke?: string };
type Grup = { judul?: string; isi: Tempat[] };
const LABEL_TEMPAT: Record<string, string> = {
  kelas: "nav.kelas", pembelajaran: "nav.pembelajaran", pimpinan: "nav.pimpinan", konfigurasi: "nav.konfigurasi",
  pendataan: "nav.pendataan", aktivasi: "nav.aktivasi", studio: "nav.studio",
};
function navDaftar(id: string, grup: Grup[], kini: string, akhiran: string): string {
  const item = (p: Tempat) => {
    const label = kata(LABEL_TEMPAT[p.kunci]);
    return `<li><a href="#" class="pds-nav-item"${p.ke ? ` data-ke="${p.ke}"` : ""}${p.kunci === kini ? ' aria-current="page"' : ""} aria-label="${label}">${ikon(p.ikon)}<span class="pds-nav-label">${label}</span></a></li>`;
  };
  // Group labels only where the person has two contexts (WP6B): teaching and their own learning.
  if (grup.length < 2) return grup[0].isi.map(item).join("");
  return grup.map((g, i) => {
    const gid = `${id}-grup-${i}${akhiran}`;
    return `<li class="pds-nav-grup-isi"><span class="pds-nav-grup pds-eyebrow" id="${gid}">${g.judul}</span><ul class="pds-nav-daftar" aria-labelledby="${gid}">${g.isi.map(item).join("")}</ul></li>`;
  }).join("");
}
function shellStaf(o: { id: string; orang: Orang; grup: Grup[]; kini: string; isi: string; menuEkstra?: string; laciEkstra?: string; bantuan?: boolean; band?: string }): string {
  const { id } = o;
  const tempat = kata(LABEL_TEMPAT[o.kini]);
  const bantuan = o.bantuan ? `<a href="#" class="pds-nav-item" aria-label="${kata("nav.bantuan")}">${ikon("circle-help")}<span class="pds-nav-label">${kata("nav.bantuan")}</span></a>` : "";
  const keluar = kata("sesi.keluar");
  return `${o.band ?? ""}<div class="pds-shell-host">
  <div class="pds-shell">
    <nav class="pds-nav" aria-label="${kata("nav.tempat")}">
      <div class="pds-nav-kepala">${merek("pds-merek-penuh")}<button type="button" class="pds-btn pds-btn-icon" data-shell-ciut aria-label="${baruAttr("Ciutkan navigasi", "the staff navigation's collapse control (question 1); the product has no rail yet")}" data-tip="Ciutkan navigasi" aria-expanded="true">${ikon("panel-left-close")}</button></div>
      <ul class="pds-nav-daftar">${navDaftar(id, o.grup, o.kini, "")}</ul>
      <div class="pds-nav-bawah">
        ${bantuan}
        <div class="pds-menu-host">
          <button type="button" class="pds-identity" aria-haspopup="menu" aria-expanded="false" aria-controls="${id}-akun" aria-label="${kata("nav.akun")}: ${esc(o.orang.nama)}">
            <span class="pds-avatar" aria-hidden="true">${o.orang.inisial}</span><div><strong>${esc(o.orang.nama)}</strong><small>${esc(o.orang.konteks)}</small></div>${ikon("ellipsis")}
          </button>
          <div class="pds-menu pds-menu-samping" id="${id}-akun" role="menu" aria-label="${kata("nav.akun")}" hidden>
            <a href="#" class="pds-menu-item" role="menuitem">${ikon("user")}${kata("sesi.akun")}</a>
            <a href="#" class="pds-menu-item" role="menuitem" lang="en">${ikon("languages")}English</a>
            ${o.menuEkstra ?? ""}
          </div>
        </div>
        <button type="button" class="pds-nav-item pds-nav-keluar" aria-label="${keluar}">${ikon("log-out")}<span class="pds-nav-label">${keluar}</span></button>
      </div>
    </nav>
    <div class="pds-main">
      <header class="pds-bar">${merek()}<span class="pds-bar-tempat" aria-hidden="true">${tempat}</span>
        <button type="button" class="pds-btn pds-btn-secondary pds-btn-sm">${keluar}</button>
        <button type="button" class="pds-btn pds-btn-icon" aria-label="${baruAttr("Buka menu", "the top bar's menu button under 1024 px (question 1)")}" data-tip="Buka menu" data-dialog-buka="${id}-laci">${ikon("menu")}</button>
      </header>
      <main class="pds-main-isi" id="${id}-isi" tabindex="-1">${o.isi}</main>
    </div>
  </div>
</div>
<dialog class="pds-drawer" id="${id}-laci" aria-label="Menu" data-tutup-luar>
  <div class="pds-drawer-kepala">${merek()}<button type="button" class="pds-btn pds-btn-icon" aria-label="${baruAttr("Tutup menu", "closes the drawer under 1024 px")}" data-tip="Tutup menu" data-dialog-tutup>${ikon("x")}</button></div>
  <nav class="pds-drawer-isi" aria-label="${kata("nav.tempat")}">
    <ul class="pds-nav-daftar">${navDaftar(id, o.grup, o.kini, "-laci")}</ul>
    <div class="pds-nav-bawah">
      ${bantuan}
      <div class="pds-identity" style="cursor: default"><span class="pds-avatar" aria-hidden="true">${o.orang.inisial}</span><div><strong>${esc(o.orang.nama)}</strong><small>${esc(o.orang.konteks)}</small></div></div>
      <a href="#" class="pds-nav-item">${ikon("user")}<span class="pds-nav-label">${kata("sesi.akun")}</span></a>
      ${o.laciEkstra ?? ""}
      <a href="#" class="pds-nav-item" lang="en">${ikon("languages")}<span class="pds-nav-label">English</span></a>
      <button type="button" class="pds-nav-item">${ikon("log-out")}<span class="pds-nav-label">${keluar}</span></button>
    </div>
  </nav>
</dialog>`;
}

// ── the learner's shells (Learner shell): the top bar, and the focus shell inside an assessment ──
function shellMurid(o: { id: string; isi: string; fokus?: boolean; aktif?: "belajar" | "sertifikat"; keBelajar?: string; band?: string }): string {
  const bahasa = `<div class="pds-seg" role="radiogroup" aria-label="${baruAttr("Bahasa", "the language switch's accessible name")}"><label><input type="radio" name="${o.id}-bahasa" checked><span lang="id">ID</span></label><label><input type="radio" name="${o.id}-bahasa"><span lang="en">EN</span></label></div>`;
  const tab = (k: "belajar" | "sertifikat") => `<a href="#" class="pds-tab"${o.aktif === k ? ' aria-current="page"' : ""}${k === "belajar" && o.keBelajar ? ` data-ke="${o.keBelajar}"` : ""}>${kata(`nav.${k}`, "learner")}</a>`;
  return `${o.band ?? ""}<div class="pds-topshell">
  <header class="pds-top">${merek()}
    ${o.fokus ? "" : `<nav class="pds-tabs" aria-label="${kata("nav.belajar", "learner")}">${tab("belajar")}${tab("sertifikat")}</nav>`}
    <div class="pds-top-kanan">
      ${o.fokus ? "" : `<button type="button" class="pds-btn pds-btn-quiet">${ikon("circle-help")}${kata("nav.bantuan", "learner")}</button>`}
      ${bahasa}
      <span class="pds-top-nama">${kata("sesi.bukan_anda", "learner")}</span>
      <button type="button" class="pds-btn pds-btn-secondary">${kata("sesi.keluar", "learner")}</button>
    </div>
  </header>
  <main class="pds-main-isi pds-baca" id="${o.id}-isi" tabindex="-1">${o.isi}</main>
</div>`;
}

// ── a screen, the review bar, the card ────────────────────────────────────────
type Layar = { id: string; langkah: string; judulHal: string; html: string; shell?: boolean };
/** One screen. A screen with a shell gets the skip link first and the static-shell behaviour. */
function layar(l: Layar, awalan: string): string {
  // The skip link's target is the screen's main region; refuse a screen whose main is not there.
  const sasaran = `${awalan}-${l.id}-isi`;
  if (!l.html.includes(`id="${sasaran}"`)) throw new Error(`${awalan} ${l.id}: the skip link has no main region #${sasaran}`);
  const lewati = `<a class="pds-lewati" href="#${sasaran}">${baru("Langsung ke isi", "the skip link (question 10; 06-accessibility)")}</a>`;
  return `<section class="pds-lewati-induk" data-layar="${l.id}" data-judul-hal="${esc(l.judulHal)}" aria-label="${esc(l.judulHal)}"${l.shell === false ? "" : " data-shell data-shell-statis"} hidden>
${lewati}
${l.html}
</section>`;
}
type Perjalanan = {
  kode: string; folder: string; judul: string; subjudul: string; siapa: string; menguji: string;
  layar: Layar[]; tinggi: number; catatanKomposisi: string[]; gaya?: string; skrip?: string;
};
function kartu(p: Perjalanan): string {
  const langkah = p.layar.map((l, i) => `<li><button type="button" data-lompat="${l.id}">${i + 1} · ${esc(l.langkah)}</button></li>`).join("");
  return `<!-- @dsCard group="Journeys" height=${p.tinggi} width=1280 subtitle="${esc(p.subjudul)}" -->
${p.gaya ? `<style>${p.gaya}</style>\n` : ""}<div class="pds pds-jalan" data-perjalanan>
  <div class="pds-jalan-kepala" lang="en">
    <p class="pds-jalan-judul">${esc(p.kode)} · ${esc(p.judul)}</p>
    <p>${esc(p.siapa)}. A specimen for owner validation (11-validation.md §1), not PINTAR: invented people, and every word on the screens from the copy table, with new words marked. Walk it by clicking the screens themselves; the steps below jump.</p>
    <ol class="pds-jalan-langkah" aria-label="Steps">${langkah}</ol>
    <div class="pds-jalan-alat"><label><input type="checkbox" class="pds-check" data-tandai-baru> Mark new words</label><button type="button" data-jalan-ulang>Start again</button></div>
    <p class="pds-jalan-catatan" data-jalan-catatan role="status" hidden></p>
  </div>
${p.layar.map((l) => layar(l, p.kode.toLowerCase())).join("\n")}
</div>
<script>Pintar.siapkan();${p.skrip ?? ""}</script>
`;
}

// ── small pieces used by several journeys ─────────────────────────────────────
// The scope line only at three levels or more (Breadcrumb); fewer, and a back link names its destination, as the product's do.
const pagehead = (o: { scope?: string[]; kembali?: { teks: string; ke?: string }; eyebrow?: string; judul: string; intro?: string; aksi?: string }) =>
  `<div class="pds-pagehead"><div>${o.kembali ? `<p><a href="#" class="pds-back"${o.kembali.ke ? ` data-ke="${o.kembali.ke}"` : ""}>${ikon("chevron-left")}${o.kembali.teks}</a></p>` : ""}${o.scope && o.scope.length < 3 ? (() => { throw new Error(`a scope line of ${o.scope!.length} levels: use a back link`); })() : ""}${o.scope ? `<ol class="pds-scope" aria-label="${baruAttr("Lokasi", "the scope line's accessible name")}">${o.scope.map((s, i) => i < o.scope!.length - 1 ? `<li><a href="#">${s}</a></li>` : `<li><span aria-current="page">${s}</span></li>`).join("")}</ol>` : ""}${o.eyebrow ? `<p class="pds-eyebrow">${o.eyebrow}</p>` : ""}<h1 class="pds-title">${o.judul}</h1>${o.intro ? `<p class="pds-intro">${o.intro}</p>` : ""}</div>${o.aksi ? `<div class="pds-actions">${o.aksi}</div>` : ""}</div>`;
const STAF_GURU = (ke: { kelas?: string; pembelajaran?: string } = {}): Grup[] => [
  { judul: baru("Mengajar", "the group label for an educator who also learns (question 11); WP6B"), isi: [{ kunci: "kelas", ikon: "users", ke: ke.kelas }, { kunci: "studio", ikon: "square-pen" }] },
  { judul: kata("nav.belajar", "learner"), isi: [{ kunci: "pembelajaran", ikon: "book-open", ke: ke.pembelajaran }] },
];
const STAF_ADMIN = (ke: { studio?: string } = {}): Grup[] => [
  { isi: [{ kunci: "konfigurasi", ikon: "settings" }, { kunci: "pendataan", ikon: "file-spreadsheet" }, { kunci: "aktivasi", ikon: "user-check" }, { kunci: "studio", ikon: "square-pen", ke: ke.studio }] },
];
// Facts, as the Panel component sets them: a dl on the two-column grid.
const fakta = (baris: Array<[string, string]>) => `<dl class="pds-grid-2" style="gap: var(--space-3) var(--space-6)">${baris.map(([d, v]) => `<div><dt class="pds-help">${d}</dt><dd class="pds-num">${v}</dd></div>`).join("")}</dl>`;
const GAYA_BERSAMA = "";


// ── «Siapkan»'s second step, as the product draws it (src/app/mengajar/[kelas]/siapkan): the chosen
// material, its window as two native date fields with the date in words beneath (Date and time), and the
// review before «Sediakan», which repeats the window in words. The window's rule is the server's
// (assign_window_invalid): the end after the start, so «Sampai» takes the day after «Mulai» as its min.
function jendela(o: { awal: string; bab: string; pelajaran: number; soal: number; mulai: string; sampai?: string; lanjutKe?: string }): string {
  const { awal } = o;
  return `<section class="pds-section" aria-labelledby="${awal}-materi"><h2 id="${awal}-materi">${o.bab}</h2>
      <p class="pds-help">${kata("mengajar.siap.diterbitkan")} · ${o.pelajaran} ${kata("mengajar.siap.pelajaran")} · ${o.soal} ${kata("mengajar.siap.soal")}</p></section>
    <form class="pds-form" data-validasi novalidate onsubmit="return false" id="${awal}-form">
      <fieldset class="pds-fieldset"><legend class="pds-label">${kata("mengajar.siap.jendela")}</legend><p class="pds-help" id="${awal}-arti">${kata("mengajar.siap.jendela.arti")}</p>
        <div class="pds-row" style="align-items: start">
          <div class="pds-field"><label class="pds-label" for="${awal}-mulai">${kata("mengajar.siap.mulai")}</label><input class="pds-input" id="${awal}-mulai" type="date" required value="${o.mulai}" aria-describedby="${awal}-mulai-gema ${awal}-arti"><p class="pds-gema" aria-live="polite">${ikon("calendar")}<span id="${awal}-mulai-gema" data-gema-tanggal="#${awal}-mulai"></span></p></div>
          <div class="pds-field"><label class="pds-label" for="${awal}-sampai">${kata("mengajar.siap.sampai")} <span class="pds-opsional">${baru("(opsional)", "marks the optional «Sampai»; the product shows no mark today")}</span></label><input class="pds-input" id="${awal}-sampai" type="date"${o.sampai ? ` value="${o.sampai}"` : ""} aria-describedby="${awal}-sampai-gema ${awal}-sampai-galat"><p class="pds-gema" aria-live="polite">${ikon("calendar")}<span id="${awal}-sampai-gema" data-gema-tanggal="#${awal}-sampai" data-kosong="${kata("mengajar.siap.sampai.kosong")}"></span></p>
            <p class="pds-error" id="${awal}-sampai-galat" hidden>${ikon("circle-alert")}${kata("mengajar.sedia.kode.assign_window_invalid")}</p></div>
        </div>
      </fieldset>
      <section class="pds-panel" aria-labelledby="${awal}-tinjau"><h2 id="${awal}-tinjau" class="pds-label">${kata("mengajar.siap.tinjau")}</h2>
        <p>${kata("mengajar.siap.disediakan")} <strong>${KELAS}</strong> · 31 ${kata("mengajar.siap.terdaftar")}</p>
        <p>${kata("mengajar.siap.jendela")}: <strong id="${awal}-kata"></strong></p>
        <p class="pds-ink-2">${kata("mengajar.siap.akibat.1")} <strong>31 ${kata("mengajar.bukti.murid")} ${KELAS}</strong> ${kata("mengajar.siap.akibat.2")} ${kata("mengajar.siap.akibat.3")}</p>
      </section>
      <div class="pds-actions"><button type="submit" class="pds-btn pds-btn-primary" id="${awal}-kirim" data-aksi data-sibuk="${kata("tombol.menyediakan")}" data-selesai="${baruAttr("Disediakan", "the result word of «Sediakan» (completion grammar); today the line only")}" data-hasil="#${awal}-hasil" data-hasil-teks="${kata("mengajar.sedia.ok")}"${o.lanjutKe ? ` data-lanjut="${KELAS}" data-lanjut-ke="${o.lanjutKe}"` : ""}>${kata("mengajar.siap.komit")}</button></div>
      <p class="pds-result" id="${awal}-hasil" hidden></p>
    </form>`;
}
/** Keeps the window in words (the review and the result line) and «Sampai»'s min in step with the fields. */
const skripJendela = (awal: string) => `
  (function () {
    var mulai = document.getElementById("${awal}-mulai"), sampai = document.getElementById("${awal}-sampai");
    var tombol = document.getElementById("${awal}-kirim"), kata = document.getElementById("${awal}-kata");
    function besok(v) { var d = new Date(v + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + 1); return d.toISOString().slice(0, 10); }
    function tulis() {
      if (mulai.value) sampai.min = besok(mulai.value); else sampai.removeAttribute("min");
      var k = "${kataAttr("mengajar.siap.mulai")} " + Pintar.tanggal(mulai.value, "hari") + " · " + (sampai.value ? "${kataAttr("mengajar.siap.sampai")} " + Pintar.tanggal(sampai.value, "hari") : "${kataAttr("mengajar.siap.sampai.kosong")}");
      kata.textContent = k;
      tombol.setAttribute("data-hasil-teks", "${kataAttr("mengajar.sedia.ok")} " + k + ".");
    }
    mulai.addEventListener("input", tulis); sampai.addEventListener("input", tulis); tulis();
  })();`;

// ════════════════════════════════════════════════════════════════════════════
// J1 · Publish a chapter (the school), then make it available to a class (the teacher)
// ════════════════════════════════════════════════════════════════════════════
function j1(): Perjalanan {
  const LANGKAH = [
    ["susun", "selesai"], ["periksa", "selesai"], ["ajukan", "selesai"], ["setujui", "selesai"], ["buat", "selesai"], ["kunci", "selesai"], ["terbitkan", "kini"],
  ] as const;
  // Where the chapter is: Progress's named steps (pds-steps). What can be done now: the current step, alone.
  const daftarLangkah = `<ol class="pds-steps" aria-label="${kata("studio.langkah.judul")}">${LANGKAH.map(([k, st]) => st === "kini"
    ? `<li aria-current="step">${kata(`studio.langkah.${k}.judul`)}</li>`
    : `<li data-keadaan="selesai">${kata(`studio.langkah.${k}.judul`)}<span class="pds-sr"> (${kata("studio.langkah.keadaan.selesai")})</span></li>`).join("")}</ol>
    <section class="pds-panel" aria-labelledby="j1-a2-kini"><p class="pds-eyebrow">${kata("studio.langkah.keadaan.kini")}</p><h3 id="j1-a2-kini">${kata("studio.langkah.terbitkan.judul")}</h3>
      <p class="pds-ink-2">${kata("studio.langkah.terbitkan.arti")}</p>
      <p class="pds-help">${kata("studio.langkah.oleh")} ${kata("role.INSTITUTION_ADMIN")} ${kata("studio.langkah.atau")} ${kata("role.SYSTEM_ADMIN")}</p>
      <div class="pds-actions"><button type="button" class="pds-btn pds-btn-primary" data-aksi data-sibuk="${baruAttr("Menerbitkan…", "question 2: the publishing progressive; today «Memproses…» (studio.langkah.sibuk)")}" data-selesai="${baruAttr("Diterbitkan", "question 2: the publishing result")}" data-hasil="#j1-a2-hasil" data-hasil-teks="${MAPEL} · ${BAB}: ${kata("studio.langkah.terbit.sejak")} 7 Okt 2026, 09.12 WIB. ${kata("studio.paket.terbit_bukan_tugas")}" data-lanjut="${kata("studio.paket.judul")}" data-lanjut-ke="a1b">${kata("studio.langkah.terbitkan.tombol")}</button></div>
      <p class="pds-result" id="j1-a2-hasil" hidden></p>
    </section>`;
  const studioTabs = (kini: string) => `<nav class="pds-tabs" aria-label="${kata("studio.title")}">${["beranda", "unggah", "tinjau", "bank", "kuis"].map((k) => `<a href="#" class="pds-tab"${k === kini ? ' aria-current="page"' : ""}>${kata(`studio.nav.${k}`)}</a>`).join("")}</nav>`;
  const paket = (terbit: boolean, ke?: string) => `<ul class="pds-list">
      <li><a href="#" class="pds-list-row"${ke ? ` data-ke="${ke}"` : ""}><strong>${MAPEL} · ${BAB}</strong>${terbit ? `<span class="pds-badge pds-badge-ok">${ikon("check")}${kata("studio.langkah.terbit.judul")}</span>` : ""}<small>${terbit ? `${kata("studio.langkah.terbit.sejak")} 7 Okt 2026, 09.12 WIB` : `${kata("studio.langkah.keadaan.kini")}: ${kata("studio.langkah.terbitkan.judul")}`}</small></a></li>
      <li><a href="#" class="pds-list-row"><strong>${MAPEL} · Bab 4 · Pecahan campuran</strong><small>${kata("studio.langkah.keadaan.kini")}: ${kata("studio.langkah.setujui.judul")}</small></a></li>
    </ul>`;
  const admin = (id: string, isi: string) => shellStaf({ id: `j1-${id}`, orang: MAYA, grup: STAF_ADMIN({ studio: id === "a1" ? undefined : "a1" }), kini: "studio", isi });
  const guru = (id: string, isi: string) => shellStaf({ id: `j1-${id}`, orang: RINA, grup: STAF_GURU({ kelas: id === "b1" ? undefined : "b1" }), kini: "kelas", isi, bantuan: true });

  const a1 = admin("a1", `${pagehead({ judul: kata("studio.title") })}${studioTabs("beranda")}
    <section class="pds-section" aria-labelledby="j1-a1-paket"><h2 id="j1-a1-paket">${kata("studio.paket.judul")}</h2>${paket(false, "a2")}</section>`);
  const a2 = admin("a2", `${pagehead({ kembali: { teks: kata("studio.title"), ke: "a1" }, judul: `${MAPEL} · ${BAB}` })}
    <section class="pds-section" aria-labelledby="j1-a2-langkah"><h2 id="j1-a2-langkah">${kata("studio.langkah.judul")}</h2><p class="pds-ink-2">${kata("studio.langkah.arti")}</p>
    ${daftarLangkah}</section>`);
  const a1b = admin("a1b", `${pagehead({ judul: kata("studio.title") })}${studioTabs("beranda")}
    <section class="pds-section" aria-labelledby="j1-a1b-paket"><h2 id="j1-a1b-paket">${kata("studio.paket.judul")}</h2>${paket(true)}</section>
    <p class="pds-help">${kata("mengajar.materi.sub")}</p>
    <div class="pds-actions"><a href="#" class="pds-btn pds-btn-secondary pds-jalan-tinjau" data-ke="b1" lang="en">Continue as the teacher (review step)</a></div>`);

  const kelasDaftar = `<ul class="pds-list"><li><a href="#" class="pds-list-row" data-ke="b2"><strong>${KELAS} · ${MAPEL}</strong><small>31 ${kata("mengajar.siap.terdaftar")} · ${SEKOLAH}</small></a></li>
    <li><a href="#" class="pds-list-row"><strong>Kelas 5B · ${MAPEL}</strong><small>29 ${kata("mengajar.siap.terdaftar")} · ${SEKOLAH}</small></a></li></ul>`;
  const b1 = guru("b1", `${pagehead({ judul: kata("mengajar.kelas.judul"), intro: kata("mengajar.kelas.sub") })}${kelasDaftar}`);
  const materi = (tersedia: boolean) => `<section class="pds-section" aria-labelledby="j1-materi-${tersedia ? "y" : "n"}"><h2 id="j1-materi-${tersedia ? "y" : "n"}">${kata("mengajar.materi.judul")}</h2><p class="pds-ink-2">${kata("mengajar.materi.sub")}</p>
    <ul class="pds-list"><li><div class="pds-list-row"><strong>${BAB}</strong>${tersedia ? `<span class="pds-badge pds-badge-ok">${ikon("check")}${kata("mengajar.status.tersedia")}</span><small>${kata("mengajar.siap.diterbitkan")} · ${kata("mengajar.siap.disediakan")} 31 ${kata("mengajar.siap.terdaftar")}</small>` : `<span class="pds-badge pds-badge-info">${kata("mengajar.status.siap")}</span><small>${kata("mengajar.siap.diterbitkan")} · ${kata("mengajar.siap.asal.sekolah")}</small>`}</div></li>
    <li><div class="pds-list-row"><strong>Bab 4 · Pecahan campuran</strong><span class="pds-badge">${kata("mengajar.status.belum")}</span><small>${kata("mengajar.siap.asal.sekolah")}</small></div></li></ul></section>`;
  const b2 = guru("b2", `${pagehead({ kembali: { teks: kata("mengajar.kembali"), ke: "b1" }, judul: `${KELAS} · ${MAPEL}`, intro: kata("mengajar.kelas.intro"), aksi: `<a href="#" class="pds-btn pds-btn-primary" data-ke="b3">${kata("mengajar.aksi.siapkan")}</a>` })}
    ${fakta([[kata("mengajar.fakta.mapel"), MAPEL], [kata("mengajar.fakta.murid"), "31"], [kata("mengajar.fakta.materi"), kata("mengajar.fakta.materi.kosong")]])}${materi(false)}`);
  const b3 = guru("b3", `${pagehead({ kembali: { teks: kata("mengajar.siap.kembali") }, eyebrow: `${kata("mengajar.siap.eyebrow")} · ${KELAS}`, judul: kata("mengajar.siap.judul"), intro: kata("mengajar.siap.intro") })}
    ${jendela({ awal: "j1-b3", bab: BAB, pelajaran: 4, soal: 20, mulai: "2026-10-07", lanjutKe: "b4" })}`);
  const b4 = guru("b4", `${pagehead({ kembali: { teks: kata("mengajar.kembali"), ke: "b1" }, judul: `${KELAS} · ${MAPEL}`, intro: kata("mengajar.kelas.intro") })}
    ${fakta([[kata("mengajar.fakta.mapel"), MAPEL], [kata("mengajar.fakta.murid"), "31"], [kata("mengajar.fakta.materi"), "1"]])}
    <section class="pds-section" aria-labelledby="j1-b4-jalan"><h2 id="j1-b4-jalan">${kata("mengajar.berjalan.kelas")}</h2>
      <ul class="pds-list"><li><div class="pds-list-row"><strong>${BAB}</strong><span class="pds-badge pds-badge-info">${kata("mengajar.status.berjalan")}</span><small>${kata("mengajar.siap.mulai")} Rabu, 7 Okt 2026 · ${kata("mengajar.siap.sampai.kosong")}</small></div></li></ul></section>${materi(true)}`);

  return {
    skrip: skripJendela("j1-b3"),
    kode: "J1", folder: "J1Terbit", judul: "Bab 3 published by the school, then made available to Kelas 5A",
    subjudul: "The school publishes a chapter in Studio; the teacher makes it available to a class",
    siapa: "Two people: Maya Kusuma, Admin sekolah, publishes in Studio; Rina Kartika, Guru, makes it available to Kelas 5A",
    menguji: "The staff shell and its places (1, 11); the publishing words (2); the type ladder (4); motion on the result (8)",
    tinggi: 1060,
    layar: [
      { id: "a1", langkah: "Studio", judulHal: "Studio · PINTAR", html: a1 },
      { id: "a2", langkah: "Terbitkan", judulHal: `${MAPEL} · ${BAB} · Studio`, html: a2 },
      { id: "a1b", langkah: "Terbit", judulHal: "Studio · PINTAR", html: a1b },
      { id: "b1", langkah: "Kelas", judulHal: "Kelas · PINTAR", html: b1 },
      { id: "b2", langkah: KELAS, judulHal: `${KELAS} · PINTAR`, html: b2 },
      { id: "b3", langkah: "Siapkan", judulHal: `Siapkan materi · ${KELAS}`, html: b3 },
      { id: "b4", langkah: "Tersedia", judulHal: `${KELAS} · PINTAR`, html: b4 },
    ],
    catatanKomposisi: [
      "11-validation.md defined J1 as a teacher who publishes a chapter to a class. In PINTAR those are two acts by two people: the school publishes (CAN_PUBLISH is held only by Admin sekolah and Admin platform; «Menyediakan materi tidak sama dengan menerbitkannya; penerbitan dilakukan sekolah», mengajar.materi.sub), and a teacher then makes it available to a class («Siapkan», then «Sediakan»). J1 is composed as both, in order; question JQ1 asks you to confirm.",
      "The seven steps of «Langkah menuju terbit» are the product's (studio.langkah.*). They are drawn as Progress's named steps, steps 1 to 6 done, with the current step alone in a panel below; the product lists all seven, each with its own text.",
      "The result line names what happened, as question 2 asks: the chapter and «Terbit sejak» with the time, then the product's own reminder that publishing is not making available (studio.paket.terbit_bukan_tugas). That reminder says «Siswa» and «menugaskan» where the teacher's screens say «murid» and «Sediakan»: finding C2.",
      "«Menerbitkan…» and «✓ Diterbitkan» are question 2's ruled words. They are not in the copy table yet: today the step shows «Memproses…» (studio.langkah.sibuk).",
      "The review step «Continue as the teacher» joins the two people; it is not PINTAR.",
    ],
    gaya: GAYA_BERSAMA,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// J2 · A whole class, and one learner
// ════════════════════════════════════════════════════════════════════════════
function j2(): Perjalanan {
  const STATUS = ["sudah", "sedang", "belum"] as const;
  const status = (i: number) => (i % 7 === 3 || i % 11 === 5 ? "belum" : i % 5 === 1 ? "sedang" : "sudah");
  const lencana: Record<(typeof STATUS)[number], string> = {
    sudah: `<span class="pds-badge pds-badge-ok">${ikon("check")}${kata("mengajar.siapa.sudah")}</span>`,
    sedang: `<span class="pds-badge pds-badge-info">${kata("mengajar.siapa.sedang")}</span>`,
    belum: `<span class="pds-badge">${kata("mengajar.siapa.belum")}</span>`,
  };
  const baris = MURID.map((m, i) => {
    const st = status(i);
    return `<tr data-baris data-cari="${esc(m)}" data-status="${st}">
      <th scope="row" class="pds-sticky pds-nama"><span>${esc(m)}</span></th>
      <td>${lencana[st]}</td>
      <td><div class="pds-row-actions"><a href="#" class="pds-btn pds-btn-quiet pds-btn-sm">${kata("mengajar.aksi.lihat")}<span class="pds-sr"> ${esc(m)}</span></a>
        <span class="pds-menu-host"><button type="button" class="pds-btn pds-btn-icon" aria-haspopup="menu" aria-expanded="false" aria-controls="j2-menu-${i}" aria-label="${baruAttr("Opsi untuk", "a row menu's accessible name")} ${esc(m)}" data-tip="${baruAttr("Opsi", "the row menu button's tooltip")}">${ikon("ellipsis")}</button>
        <span class="pds-menu" id="j2-menu-${i}" role="menu" aria-label="${esc(m)}" hidden>
          <a href="#" class="pds-menu-item" role="menuitem">${kata("mengajar.aksi.bukti")}</a>
          <a href="#" class="pds-menu-item" role="menuitem"${m === "Ayu Lestari" ? ' data-ke="b"' : ""}>${kata("mengajar.ulang.judul")}</a>
        </span></span></div></td>
    </tr>`;
  }).join("");
  const saring = `<div class="pds-seg pds-lebar-saja" role="radiogroup" aria-label="${baruAttr("Tampilkan", "the filter's accessible name")}">
      <label><input type="radio" name="j2-status" value="semua" data-tabel-saring checked><span data-kata-baru>${baruAttr("Semua", "the filter's first option")}</span></label>
      ${STATUS.map((s) => `<label><input type="radio" name="j2-status" value="${s}" data-tabel-saring><span>${kata(`mengajar.siapa.${s}`)}</span></label>`).join("")}
    </div>
    <span class="pds-select pds-sempit-saja"><select aria-label="${baruAttr("Tampilkan", "the filter's accessible name")}" data-tabel-saring-pilih><option value="semua">${baruAttr("Semua", "the filter's first option")}</option>${STATUS.map((s) => `<option value="${s}">${kata(`mengajar.siapa.${s}`)}</option>`).join("")}</select>${ikon("chevron-down")}</span>`;
  const menuAkun = `<hr class="pds-menu-pisah"><button type="button" class="pds-menu-item pds-menu-bahaya" role="menuitem" data-dialog-buka="j2-semua">${ikon("log-out")}${kata("akun.semua.tombol")}…</button>`;
  // Under 1024 px the identity menu is the drawer's account block: the same item, as a drawer row.
  const laciAkun = `<button type="button" class="pds-nav-item" data-dialog-buka="j2-semua">${ikon("log-out")}<span class="pds-nav-label">${kata("akun.semua.tombol")}…</span></button>`;
  const guru = (id: string, isi: string) => shellStaf({ id: `j2-${id}`, orang: RINA, grup: STAF_GURU(), kini: "kelas", isi, bantuan: true, menuEkstra: menuAkun, laciEkstra: laciAkun });
  const a = guru("a", `${pagehead({ scope: [kata("mengajar.kembali"), KELAS, BAB], judul: `${kata("mengajar.siapa.judul")} · ${BAB}`, intro: kata("mengajar.murid.sub") })}
    <div class="pds-table-wrap" data-tabel data-per-halaman="40" data-benda="murid">
      <div class="pds-toolbar">
        <span class="pds-search">${ikon("search")}<input class="pds-input" type="search" aria-label="${baruAttr("Cari murid", "the search field's accessible name")}" placeholder="${baruAttr("Cari nama", "the search field's placeholder")}" data-tabel-cari><button type="button" class="pds-search-hapus" aria-label="${baruAttr("Hapus pencarian", "clears the search")}" data-tip="Hapus pencarian">${ikon("x")}</button></span>
        ${saring}
      </div>
      <div class="pds-table-frame" tabindex="0" role="region" aria-label="${kata("mengajar.murid.judul")} ${KELAS}">
        <table class="pds-table">
          <caption class="pds-sr">${kata("mengajar.murid.judul")} ${KELAS} · ${BAB} · ${kata("mengajar.murid.sub")}</caption>
          <thead><tr><th scope="col" class="pds-sticky">${kata("mengajar.murid.judul")}</th><th scope="col">${BAB}</th><th scope="col" class="pds-sempit"><span class="pds-sr">${baru("Tindakan", "the actions column's hidden header")}</span></th></tr></thead>
          <tbody>${baris}
            <tr class="pds-table-empty" hidden><td colspan="3"><div class="pds-empty"><h3>${baru("Tidak ada murid yang cocok", "the table's «nothing matches» state")}</h3><p>${baru("Tidak ada nama dengan", "the empty state says what was searched (Empty state)")} «<span data-tabel-kueri></span>» ${baru("di tampilan ini.", "the empty state's end")}</p><div class="pds-actions"><button type="button" class="pds-btn pds-btn-secondary" data-tabel-reset>${baru("Hapus pencarian dan saringan", "resets the table")}</button></div></div></td></tr>
          </tbody>
        </table>
      </div>
      <nav class="pds-pager" aria-label="${baruAttr("Halaman daftar murid", "the pager's accessible name")}"><span data-pager-ringkas aria-live="polite"></span>
        <span class="pds-pager-gerak">
          <button type="button" class="pds-btn pds-btn-secondary" data-pager-sebelum>${ikon("chevron-left")}<span class="pds-btn-teks">${baru("Sebelumnya", "the pager (Table behaviour)")}</span><span class="pds-sr">${baru("Halaman sebelumnya", "the pager's hidden name")}</span></button>
          <span class="pds-pager-posisi" data-pager-posisi aria-live="polite"></span>
          <button type="button" class="pds-btn pds-btn-secondary" data-pager-sesudah><span class="pds-btn-teks">${baru("Berikutnya", "the pager (Table behaviour)")}</span><span class="pds-sr">${baru("Halaman berikutnya", "the pager's hidden name")}</span>${ikon("chevron-right")}</button>
        </span></nav>
    </div>`);
  const pelajaran = ["Pelajaran 1 · Apa itu pecahan senilai", "Pelajaran 2 · Mengalikan pembilang dan penyebut", "Pelajaran 3 · Menyederhanakan pecahan", "Pelajaran 4 · Membandingkan pecahan"];
  const b = guru("b", `${pagehead({ kembali: { teks: BAB, ke: "a" }, judul: kata("mengajar.ulang.judul"), intro: kata("mengajar.ulang.arti") })}
    <form class="pds-form" onsubmit="return false">
      <fieldset class="pds-fieldset"><legend class="pds-label">${kata("mengajar.ulang.murid")}</legend>
        <label class="pds-choice"><input type="checkbox" class="pds-check" checked><span>Ayu Lestari</span><small>${kata("mengajar.siapa.sedang")}</small></label>
        <label class="pds-choice"><input type="checkbox" class="pds-check"><span>Bagus Santoso</span><small>${kata("mengajar.ulang.belum_uji")}</small></label>
      </fieldset>
      <fieldset class="pds-fieldset"><legend class="pds-label">${kata("mengajar.ulang.pelajaran")}</legend>
        ${pelajaran.map((p, i) => `<label class="pds-choice"><input type="checkbox" class="pds-check"${i === 2 ? " checked" : ""}><span>${p}</span></label>`).join("")}
      </fieldset>
      <p class="pds-ink-2">${kata("mengajar.ulang.tidak_berubah")}</p>
      <div class="pds-actions"><button type="submit" class="pds-btn pds-btn-primary" data-aksi data-sibuk="${kata("tombol.mengirim")}" data-selesai="${baruAttr("Terkirim", "the request's result word: the request is inside PINTAR, not an email")}" data-hasil="#j2-b-hasil" data-hasil-teks="${kata("mengajar.ulang.terkirim")} Ayu Lestari." data-lanjut="${kata("mengajar.siapa.judul")}" data-lanjut-ke="a">${kata("mengajar.ulang.kirim")}</button></div>
      <p class="pds-result" id="j2-b-hasil" hidden></p>
    </form>`);
  const dialog = `<dialog class="pds-dialog" id="j2-semua" aria-labelledby="j2-semua-judul" aria-describedby="j2-semua-isi">
    <div class="pds-dialog-isi">
      <h2 id="j2-semua-judul">${kata("akun.semua.yakin", "staff")}</h2>
      <p id="j2-semua-isi">${kata("akun.semua.arti", "staff")}</p>
      <div class="pds-actions"><button type="button" class="pds-btn pds-btn-quiet" data-dialog-tutup autofocus>${kata("akun.semua.batal", "staff")}</button><button type="button" class="pds-btn pds-btn-destructive-confirm" data-dialog-tutup="ya">${kata("akun.semua.ya", "staff")}</button></div>
    </div>
  </dialog>`;
  return {
    kode: "J2", folder: "J2Kelas", judul: "A whole class in one table, and one learner",
    subjudul: "The teacher reads the whole class, opens one learner's menu, and meets the one dialog",
    siapa: "Rina Kartika, Guru, Kelas 5A",
    menguji: "Floating layers and their shadow (5); the one dialog pattern, started from a menu (6); 4 px small controls (7); entering layers (8); the stripe in context (14)",
    tinggi: 2770,
    layar: [
      { id: "a", langkah: "The class", judulHal: `${kata("mengajar.siapa.judul")} · ${KELAS}`, html: a + dialog },
      { id: "b", langkah: "Minta membaca lagi", judulHal: `${kata("mengajar.ulang.judul")} · ${KELAS}`, html: b },
    ],
    catatanKomposisi: [
      "The table is the class's «Siapa yang sudah mengumpulkan» for Bab 3: every learner, alphabetical, with the three states the product names (mengajar.siapa.*). Search, the state filter and the stripe (option A) come from the Table and Table rows components.",
      "The product shows this page as three lists of names («Tiga daftar nama…», mengajar.siapa.catatan). 11-validation.md asks for the long table with a state filter, so here the three lists are one alphabetical table with the state in words, and the filter gives each list back; the intro is therefore the table's own true line (mengajar.murid.sub), not «Tiga daftar». Question JQ2 asks which you want.",
      "A row's menu holds what a teacher really can do for one learner: «Lihat bukti» and «Minta membaca lagi» (D-085 M3). Neither is consequential. 11-validation.md asked for «a consequential action asked in a dialog» on one learner, but a teacher has no consequential act on a learner in 4.0: enrolment, the class card and its reissue (aktivasi.ulang.*) are the school admin's.",
      "The one dialog (question 6: a consequential question started from a menu) is therefore met where a teacher can meet it: «Keluar dari semua perangkat» (akun.semua.*, Gate 6), started from the account menu at the bottom of the navigation, or from the drawer under 1024 px. Today the product has it on «Akun saya» as an in-page confirmation (src/components/sesi/KeluarSemua.tsx), which question 6 keeps as the default; the menu is where the shell (question 1) puts account actions. Question JQ2 asks which you want validated.",
      "The «…» after an item that asks before it acts is the Dialog component's own (its example is this same item).",
      "Found while composing: the Table and Table rows components' menus and bulk bar offer «Kirim pengingat», «Pindahkan ke kelas lain» and «Keluarkan dari kelas». A teacher cannot do the last two, and PINTAR promises no notifications. Finding F2 proposes the correction.",
      "The count under the table («Menampilkan 1–31 dari 31 murid») is written by the Table behaviour (bundle.js), not the copy table: it is new to the copy table too.",
      "The dialog's confirm button is the copy table's «Ya, keluar dari semua»; the grammar's rule is a verb and its object, never «Ya» (finding C1).",
    ],
    gaya: GAYA_BERSAMA,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// J3 · Teaching and learning: an educator who also learns
// ════════════════════════════════════════════════════════════════════════════
function j3(): Perjalanan {
  const KURSUS = "Pengembangan Profesi · Merancang Asesmen Formatif di Kelas";
  const guru = (id: string, kini: "kelas" | "pembelajaran", isi: string) => shellStaf({ id: `j3-${id}`, orang: RINA, grup: STAF_GURU({ kelas: kini === "kelas" ? undefined : "a", pembelajaran: kini === "pembelajaran" ? undefined : "b" }), kini, isi, bantuan: true });
  const a = guru("a", "kelas", `${pagehead({ judul: kata("mengajar.kelas.judul"), intro: kata("mengajar.kelas.sub") })}
    <ul class="pds-list"><li><a href="#" class="pds-list-row"><strong>${KELAS} · ${MAPEL}</strong><span class="pds-badge pds-badge-info">${kata("mengajar.status.berjalan")}</span><small>${BAB} · 31 ${kata("mengajar.siap.terdaftar")}</small></a></li>
    <li><a href="#" class="pds-list-row"><strong>Kelas 5B · ${MAPEL}</strong><small>${kata("mengajar.berjalan.kosong")} · 29 ${kata("mengajar.siap.terdaftar")}</small></a></li></ul>`);
  const langkah5 = ["siklus.di.pemetaan", "siklus.di.peta", "siklus.di.pelajaran", "siklus.di.penguasaan", "siklus.di.hasil"];
  const b = guru("b", "pembelajaran", `${pagehead({ eyebrow: kata("pembelajaran.eyebrow"), judul: kata("siklus.milik_anda"), intro: kata("pembelajaran.milik") })}
    <section class="pds-section" aria-labelledby="j3-b-terbuka"><h2 id="j3-b-terbuka">${kata("siklus.terbuka")}</h2>
      <ul class="pds-list"><li><a href="#" class="pds-list-row" data-ke="c"><strong>${KURSUS}</strong><span class="pds-badge pds-badge-info">${kata("siklus.di.pelajaran")}</span><small>2 ${kata("siklus.dari")} 5 ${kata("siklus.selesai_n")}</small></a></li></ul></section>`);
  const c = guru("c", "pembelajaran", `${pagehead({ kembali: { teks: kata("nav.pembelajaran"), ke: "b" }, eyebrow: kata("siklus.sekarang"), judul: KURSUS, intro: kata("siklus.langkah_dari") })}
    <ol class="pds-steps" aria-label="${kata("siklus.peta_anda")}">${langkah5.map((k, i) => `<li${i < 2 ? ' data-keadaan="selesai"' : i === 2 ? ' aria-current="step"' : ""}>${kata(k)}${i < 2 ? `<span class="pds-sr"> (${kata("siklus.selesai_n")})</span>` : ""}</li>`).join("")}</ol>
    <div class="pds-panel"><p class="pds-eyebrow">${kata("siklus.panel.eyebrow")}</p><h2>Pelajaran 3 · Umpan balik yang membantu</h2><div class="pds-actions"><a href="#" class="pds-btn pds-btn-primary pds-btn-lg">${kata("siklus.aksi.pelajaran")}</a></div></div>`);
  return {
    kode: "J3", folder: "J3MengajarBelajar", judul: "Teaching, then one's own learning, then back",
    subjudul: "An educator who also learns moves between Mengajar and Belajar without losing their place",
    siapa: "Rina Kartika, Guru, who is also enrolled in a professional-learning course",
    menguji: "The distinct contexts (11); which shell each context wears (1); the navigation never suggests a role the person does not hold",
    tinggi: 900,
    layar: [
      { id: "a", langkah: "Mengajar · Kelas", judulHal: "Kelas · PINTAR", html: a },
      { id: "b", langkah: "Belajar · Pembelajaran Saya", judulHal: "Pembelajaran Saya · PINTAR", html: b },
      { id: "c", langkah: "Her course", judulHal: `${KURSUS} · PINTAR`, html: c },
    ],
    catatanKomposisi: [
      "The two group labels: «Belajar» is the copy table's (nav.belajar); «Mengajar» is new (the group label approved under question 11). The places are today's: Kelas and Studio (DAISY-11), and Pembelajaran Saya for an educator (WP6B).",
      "Her own learning wears the staff shell, as the product does today (CangkangPengalaman, current «belajar», persona educator): question JQ3 asks you to confirm that an educator learning stays in the staff shell rather than the learner's top bar.",
      "Her course's five steps are the learner cycle's words (siklus.*), told to an educator exactly as to a learner (UX1-AJAR-KATA-01).",
    ],
    gaya: GAYA_BERSAMA,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// J4 · A lesson, a question, its result
// ════════════════════════════════════════════════════════════════════════════
function j4(): Perjalanan {
  const L = (k: string) => kata(k, "learner");
  const a = shellMurid({ id: "j4-a", aktif: "belajar", isi: `<div class="pds-stack" style="gap: var(--space-2)"><p class="pds-eyebrow">${L("siklus.beranda")}</p><h1 class="pds-title">${L("siklus.halo")}, Bagas</h1><p class="pds-intro">${L("siklus.hari_ini")}</p></div>
    <section class="pds-panel" aria-labelledby="j4-a-bab"><p class="pds-eyebrow">${L("siklus.panel.eyebrow")}</p><h2 id="j4-a-bab">${MAPEL} · ${BAB}</h2><p class="pds-ink-2">${L("siklus.di.pelajaran")} · 2 ${L("siklus.dari")} 4 ${L("siklus.selesai_n")}</p>
      <div class="pds-actions"><a href="#" class="pds-btn pds-btn-primary pds-btn-lg" data-ke="b">${L("siklus.aksi.pelajaran")}</a></div></section>
    <p><a href="#" class="pds-link">${L("siklus.lihat_langkah")}</a></p>` });
  const b = shellMurid({ id: "j4-b", aktif: "belajar", keBelajar: "a", isi: `<div class="pds-stack" style="gap: var(--space-2)"><p class="pds-eyebrow">${L("lesson.title")} 3 · ${L("lesson.page_of")} 2 ${L("siklus.dari")} 3</p><h1 class="pds-title">Menyederhanakan pecahan</h1></div>
    <p>Pecahan disederhanakan dengan membagi pembilang dan penyebut dengan bilangan yang sama. Pecahan yang baru tetap senilai dengan pecahan semula.</p>
    <div class="pds-well"><p><strong>Contoh.</strong> 6/8: pembilang dan penyebut sama-sama dapat dibagi 2.</p><p>6 : 2 = 3 dan 8 : 2 = 4, jadi 6/8 = 3/4.</p><div class="pds-actions"><button type="button" class="pds-btn pds-btn-secondary">${L("lesson.example.reveal")}</button></div></div>
    <div class="pds-actions" style="justify-content: space-between"><a href="#" class="pds-btn pds-btn-quiet">${ikon("chevron-left")}${L("lesson.prev")}</a><a href="#" class="pds-btn pds-btn-primary" data-ke="c">${L("lesson.next")}${ikon("chevron-right")}</a></div>
    <p class="pds-help">${L("lesson.saved")}</p>` });
  const pilihan = ["2/3", "4/6", "6/8", "8/12"];
  const c = shellMurid({ id: "j4-c", fokus: true, isi: `<div class="pds-stack" style="gap: var(--space-2)"><p class="pds-eyebrow">${L("posttest.title")} · ${BAB}</p><h1 class="pds-title">${L("pretest.progress")} 7 ${L("siklus.dari")} 10</h1><p class="pds-ink-2">${L("posttest.intro")}</p></div>
    <form class="pds-form" onsubmit="return false">
      <fieldset class="pds-fieldset"><legend class="t-stem">Pecahan manakah yang <strong>tidak</strong> senilai dengan 2/3?</legend>
        ${pilihan.map((p, i) => `<label class="pds-choice"><input type="radio" class="pds-radio" name="j4-jawab"${i === 2 ? " checked" : ""}><span>${p}</span></label>`).join("")}
      </fieldset>
      <div class="pds-actions"><button type="submit" class="pds-btn pds-btn-primary pds-btn-lg" data-aksi data-sibuk="${kata("tombol.menyimpan", "learner")}" data-selesai="${L("posttest.confirmed")}" data-hasil="#j4-c-hasil" data-hasil-teks="${L("posttest.answered")}: 7 ${L("siklus.dari")} 10.">${L("posttest.confirm")}</button><button type="button" class="pds-btn pds-btn-secondary">${L("posttest.flag")}</button></div>
      <p class="pds-result" id="j4-c-hasil" hidden></p>
    </form>
    <section class="pds-panel" aria-labelledby="j4-c-kumpul"><h2 id="j4-c-kumpul" class="pds-label">${L("posttest.submit")}</h2><p class="pds-ink-2">${L("posttest.submit_confirm")}</p><div class="pds-actions"><button type="button" class="pds-btn pds-btn-secondary" data-ke="d">${L("posttest.submit")}</button></div></section>` });
  const d = shellMurid({ id: "j4-d", aktif: "belajar", keBelajar: "a", isi: `<div class="pds-stack" style="gap: var(--space-2)"><p class="pds-eyebrow">${L("hasil.title")} · ${BAB}</p><h1 class="pds-title">${L("hasil.target.tercapai")}</h1><p class="pds-intro">${L("hasil.target.tercapai_arti")}</p></div>
    ${fakta([[L("hasil.mastery"), `9 ${L("siklus.dari")} 10`], [L("siklus.ambang"), `7 ${L("siklus.dari")} 10`]])}
    <p class="pds-result pds-result-ok" role="status">${ikon("circle-check")}<span>${L("hasil.safety.ok")}</span></p>
    <section class="pds-section" aria-labelledby="j4-d-lanjut"><h2 id="j4-d-lanjut">${L("siklus.berikutnya")}</h2><p class="pds-ink-2">${L("siklus.terbuka_kini")}</p><div class="pds-actions"><a href="#" class="pds-btn pds-btn-primary" data-ke="a">${L("siklus.beranda")}</a><a href="#" class="pds-btn pds-btn-secondary">${L("hasil.review")}</a></div></section>` });
  return {
    kode: "J4", folder: "J4Murid", judul: "A lesson, a question and its result",
    subjudul: "A learner on a shared 1366 × 768 computer or a phone: the top bar, the lesson, the question, the result",
    siapa: "Bagas, a learner in Kelas 5A, on a shared school computer and on a phone",
    menguji: "The learner's top bar at every width (1); the question stem outside the ladder; one obvious next action; WCAG 2.2 AA with the skip link (10)",
    tinggi: 960,
    layar: [
      { id: "a", langkah: "Beranda", judulHal: "Belajar · PINTAR", html: a, shell: false },
      { id: "b", langkah: "Lesson", judulHal: `Pelajaran · ${BAB}`, html: b, shell: false },
      { id: "c", langkah: "Question", judulHal: `Uji Penguasaan · ${BAB}`, html: c, shell: false },
      { id: "d", langkah: "Result", judulHal: `Hasil · ${BAB}`, html: d, shell: false },
    ],
    catatanKomposisi: [
      "The learner is greeted by first name on their own page («Halo, Bagas», D-020) and named nowhere in the bar: the bar says «Bukan akun Anda?» beside «Keluar» (S15).",
      "The question screen wears the focus shell: no Belajar or Sertifikat, no Bantuan, only the language, «Bukan akun Anda?» and «Keluar».",
      "The lesson and question texts are sample content, not copy; every interface word is the copy table's (siklus.*, lesson.*, posttest.*, hasil.*).",
      "Submitting is confirmed in the page (question 6: in-page confirmation stays the default), with posttest.submit_confirm's own words.",
    ],
    gaya: GAYA_BERSAMA,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// J5 · When material opens and closes for a class: the dates
// ════════════════════════════════════════════════════════════════════════════
function j5(): Perjalanan {
  const guru = (id: string, isi: string) => shellStaf({ id: `j5-${id}`, orang: RINA, grup: STAF_GURU(), kini: "kelas", isi, bantuan: true });
  const a = guru("a", `${pagehead({ kembali: { teks: kata("mengajar.siap.kembali") }, eyebrow: `${kata("mengajar.siap.eyebrow")} · ${KELAS}`, judul: kata("mengajar.siap.judul"), intro: kata("mengajar.siap.intro") })}
    ${jendela({ awal: "j5-a", bab: "Bab 4 · Pecahan campuran", pelajaran: 5, soal: 24, mulai: "2026-10-12", sampai: "2026-10-02" })}`);
  const skrip = skripJendela("j5-a");
  return {
    kode: "J5", folder: "J5Jendela", judul: "When material opens and closes for a class",
    subjudul: "Two native date fields with the date in words beneath, a mistake told under its field, then the save",
    siapa: "Rina Kartika, Guru, setting the window for Bab 4 in Kelas 5A",
    menguji: "Date fields (15); 3:1 field outlines and the error under the field (3); hover and press at 120 ms (8)",
    tinggi: 1060,
    layar: [{ id: "a", langkah: "The window", judulHal: `Siapkan materi · ${KELAS}`, html: a }],
    catatanKomposisi: [
      "11-validation.md defined J5 as setting when an Uji Cepat opens. An Uji Cepat has no opening date in PINTAR: its window is counted in minutes from the moment it is made available («Berhitung sejak disediakan», mengajar.cepat.jendela.arti). The date fields a teacher really meets are the window of «Siapkan» (Mulai, Sampai; DAISY-14). J5 is composed there; question JQ5 asks you to confirm.",
      "The fields are dates only, as the product's are (type=date): «Mulai» and an optional «Sampai», where empty means «Tanpa batas akhir». The echo under each says the date in words with its day.",
      "The mistake is real: «Sampai» before «Mulai». Pressing «Sediakan» shows the server's own sentence under the field (mengajar.sedia.kode.assign_window_invalid) and moves focus to it; correcting the date clears it.",
      "Found while composing: the Date and time component's example is «Uji Cepat dibuka» with a date and a time. Finding F3 proposes rewording it to the Siapkan window.",
    ],
    gaya: GAYA_BERSAMA,
    skrip,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// J6 · The demonstration room: MODE PERAGAAN, and back
// ════════════════════════════════════════════════════════════════════════════
function j6(): Perjalanan {
  const E = (k: string) => kata(k, "staff");
  const SUDUT = [
    ["Murid · Kelas 5A", "a learner"], ["Guru · Kelas 5A", "a teacher"], ["Kepala departemen · Matematika", "a head of department"], ["Dekan", "a dean"], ["Admin sekolah", "the school admin"],
  ];
  const a = `<main class="pds-main-isi pds-baca" id="j6-a-isi" tabindex="-1" style="min-height: 640px">
    <div class="pds-stack" style="gap: var(--space-2)">${merek("pds-merek-berdiri")}<h1 class="pds-title">${E("evaluasi.judul")}</h1><p class="pds-intro">${E("evaluasi.intro")}</p></div>
    <section class="pds-section" aria-labelledby="j6-a-pilih"><h2 id="j6-a-pilih">${E("evaluasi.pilih")}</h2>
      <ul class="pds-list">${SUDUT.map(([s], i) => `<li><div class="pds-list-row"><strong>${s}</strong><span class="pds-row-tight"><a href="#" class="pds-btn pds-btn-secondary pds-btn-sm"${i === 0 ? ' data-ke="b"' : ""}>${E("evaluasi.mulai")}<span class="pds-sr"> ${s}</span></a></span><small>Sekolah Peragaan PINTAR</small></div></li>`).join("")}</ul></section>
  </main>`;
  const band = (id: string) => `<div class="pds-konteks pds-konteks-halaman" role="region" aria-label="${E("evaluasi.mode")}">
    <strong>${E("evaluasi.mode")}</strong><span>${E("evaluasi.sebagai")}: <strong>${SUDUT[0][0]}</strong></span>
    <span class="pds-konteks-kanan"><a href="#" data-ke="a">${E("evaluasi.ganti")}</a><button type="button" data-ke="c" id="${id}-keluar">${E("evaluasi.keluar")}</button></span>
  </div>`;
  const b = shellMurid({ id: "j6-b", aktif: "belajar", band: band("j6-b"), isi: `<div class="pds-stack" style="gap: var(--space-2)"><p class="pds-eyebrow">${kata("siklus.beranda", "learner")}</p><h1 class="pds-title">${kata("siklus.halo", "learner")}, Bagas</h1><p class="pds-intro">${kata("siklus.hari_ini", "learner")}</p></div>
    <section class="pds-panel" aria-labelledby="j6-b-bab"><p class="pds-eyebrow">${kata("siklus.panel.eyebrow", "learner")}</p><h2 id="j6-b-bab">${MAPEL} · ${BAB}</h2><div class="pds-actions"><a href="#" class="pds-btn pds-btn-primary pds-btn-lg">${kata("siklus.aksi.pelajaran", "learner")}</a></div></section>` });
  const c = `<main class="pds-main-isi pds-baca" id="j6-c-isi" tabindex="-1" style="min-height: 640px">
    <div class="pds-stack" style="gap: var(--space-2)">${merek("pds-merek-berdiri")}<h1 class="pds-title">${E("evaluasi.judul")}</h1><p class="pds-intro">${E("evaluasi.intro")}</p></div>
    <p class="pds-result pds-result-ok" role="status">${ikon("circle-check")}<span>${baru("Anda sudah keluar dari peragaan.", "the result line after «Keluar dari peragaan»; today the page simply changes")}</span></p>
    <div class="pds-actions"><a href="#" class="pds-btn pds-btn-secondary" data-ke="a">${E("evaluasi.pilih")}</a></div>
  </main>`;
  return {
    kode: "J6", folder: "J6Peragaan", judul: "The demonstration room: MODE PERAGAAN, and back",
    subjudul: "An evaluator views PINTAR as a learner under the deep-ink band, then leaves",
    siapa: "An evaluator with access to the demonstration room (ADR-0020)",
    menguji: "The deep-ink context band, and no new hue (12)",
    tinggi: 910,
    layar: [
      { id: "a", langkah: "Ruang Peragaan", judulHal: "Ruang Peragaan · PINTAR", html: a, shell: false },
      { id: "b", langkah: "Viewing as a learner", judulHal: "Belajar · PINTAR", html: b, shell: false },
      { id: "c", langkah: "Left", judulHal: "Ruang Peragaan · PINTAR", html: c, shell: false },
    ],
    catatanKomposisi: [
      "11-validation.md defined J6 as a teacher seeing what a learner sees. In PINTAR, MODE PERAGAAN is the demonstration room's (ADR-0020): an evaluator chooses a point of view and PINTAR shows it under a band that cannot be dismissed. A teacher has no such mode. J6 is composed with an evaluator; question JQ6 asks you to confirm.",
      "The band's words are the product's (evaluasi.mode, .sebagai, .ganti, .keluar). Its look is the approved context band: deep ink, full width, its way out on it (question 12). Today the product draws it on surface-2 (src/app/_evaluation-banner.tsx); the application pass moves it to the band.",
      "The people in the demonstration school are shown by role only; the hub names no one.",
    ],
    gaya: GAYA_BERSAMA,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// J7 · Stepping away from a shared computer
// ════════════════════════════════════════════════════════════════════════════
function j7(): Perjalanan {
  const S = (k: string) => kata(k, "staff");
  const kelas = `${pagehead({ kembali: { teks: kata("mengajar.kembali") }, judul: `${KELAS} · ${MAPEL}`, intro: kata("mengajar.kelas.intro") })}
    ${fakta([[kata("mengajar.fakta.mapel"), MAPEL], [kata("mengajar.fakta.murid"), "31"], [kata("mengajar.fakta.materi"), "1"]])}`;
  const peringatan = `<div class="pds-alert pds-alert-attention" role="alert">${ikon("clock")}<h2 class="pds-label" style="margin: 0">${baru("PINTAR akan terkunci dalam 1 menit", "the idle warning's heading; the product has the sentence only (jaga.peringatan)")}</h2><p>${S("jaga.peringatan")}</p><div class="pds-actions"><button type="button" class="pds-btn pds-btn-primary" data-ke="a" data-segera>${S("jaga.masih")}</button></div></div>`;
  const guru = (id: string, isi: string) => shellStaf({ id: `j7-${id}`, orang: RINA, grup: STAF_GURU(), kini: "kelas", isi, bantuan: true });
  const a = guru("a", `${kelas}<div class="pds-actions"><button type="button" class="pds-btn pds-btn-secondary pds-jalan-tinjau" data-ke="b" data-segera lang="en">${ikon("clock")}Leave the computer for 4 minutes (review step)</button></div>`);
  const b = guru("b", `${peringatan}${kelas}<div class="pds-actions"><button type="button" class="pds-btn pds-btn-secondary pds-jalan-tinjau" data-ke="c" data-segera lang="en">${ikon("clock")}Let the fifth minute pass (review step)</button></div>`);
  const kunci = (id: string, salah: boolean) => `<main class="pds-tugas-bingkai" id="${id}-isi" tabindex="-1" style="min-height: 640px">
    <form class="pds-tugas" onsubmit="return false" aria-labelledby="${id}-judul" id="${id}-form">
      ${merek("pds-merek-berdiri")}
      <div class="pds-stack" style="gap: var(--space-2)"><h1 id="${id}-judul">${S("kunci.judul")}</h1><p class="pds-ink-2">${S("kunci.untuk")} <strong>${RINA.nama}</strong></p><p class="pds-ink-2">${S("kunci.lede")}</p></div>
      <div class="pds-field"><label class="pds-label" for="${id}-pin">${S("kunci.pin_label")}</label>
        <span class="pds-pin" data-pin><input id="${id}-pin" class="pds-input pds-input-lg" type="password" inputmode="numeric" autocomplete="current-password" maxlength="4"${salah ? ' value="4721" aria-invalid="true" aria-describedby="' + id + '-galat"' : ""}><button type="button" class="pds-btn pds-btn-icon" data-pin-lihat aria-pressed="false" aria-label="${baruAttr("Tampilkan PIN", "shows the PIN being typed")}" data-tip="Tampilkan PIN">${ikon("eye")}</button></span>
        ${salah ? `<p class="pds-error" id="${id}-galat" role="alert">${ikon("circle-alert")}${S("kunci.tidak_cocok.2")}</p>` : ""}</div>
      <button type="submit" class="pds-btn pds-btn-primary pds-btn-lg" data-ke="${salah ? "a" : "d"}">${S("kunci.lanjut")}</button>
      <p class="pds-help">${S("kunci.lupa")}</p>
      <div class="pds-row-tight" style="justify-content: space-between"><span class="pds-help"><strong>${S("sesi.bukan_anda")}</strong> ${S("kunci.bukan_anda.arti")}</span><button type="button" class="pds-btn pds-btn-secondary">${S("sesi.keluar")}</button></div>
    </form>
  </main>`;
  return {
    kode: "J7", folder: "J7Kunci", judul: "Stepping away from a shared computer",
    subjudul: "The idle warning at four minutes, «PINTAR terkunci» at five, a wrong PIN, then back to the page",
    siapa: "Rina Kartika, Guru, on the staff room's shared computer",
    menguji: "The identity screens together; entering layers and reduced motion (8); keyboard and screen reader (10)",
    tinggi: 900,
    layar: [
      { id: "a", langkah: "Working", judulHal: `${KELAS} · PINTAR`, html: a },
      { id: "b", langkah: "4 minutes", judulHal: `${KELAS} · PINTAR`, html: b },
      { id: "c", langkah: "Locked", judulHal: "PINTAR terkunci", html: kunci("j7-c", false), shell: false },
      { id: "d", langkah: "Wrong PIN", judulHal: "PINTAR terkunci", html: kunci("j7-d", true), shell: false },
    ],
    catatanKomposisi: [
      "Gate 6 is built (BOB-29, D-101), so every word is the product's: jaga.peringatan and jaga.masih for the warning, kunci.* for the lock, kunci.tidak_cocok.2 for a wrong PIN. The lock names the staff member («Terkunci untuk Rina Kartika»); for a learner's class card it names no one (src/app/terkunci).",
      "The warning's heading is new: the product has the sentence and the button only.",
      "The two time steps are review steps, not PINTAR.",
      "Found while composing: the Lock screen and Idle warning components predate Gate 6 and use sample text («Buka PINTAR», «PIN (4 angka)», no name). Finding F4 proposes bringing them to the built words.",
    ],
    gaya: GAYA_BERSAMA,
  };
}

// ── write the cards, the records and the harness scenarios ────────────────────
const SEMUA = [j1, j2, j3, j4, j5, j6, j7];
const skenarioPath = join(sini, "skenario.json");
const skenario = existsSync(skenarioPath) ? JSON.parse(readFileSync(skenarioPath, "utf8")) : {};
const catatanPath = join(sini, "perjalanan-catatan.json");
const catatan: Record<string, unknown> = existsSync(catatanPath) ? JSON.parse(readFileSync(catatanPath, "utf8")) : {};
const ringkas: Array<{ kode: string; folder: string; judul: string; layar: number; kunci: number; baru: number }> = [];
for (const f of SEMUA) {
  dipakai = new Set(); kataBaru = new Map();
  const p = f();
  const dir = join(proyek, "components", p.folder);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "preview.html"), kartu(p));
  // Every screen at every width, as the harness's scenarios (the first screen at 1280 is the card itself).
  skenario[p.folder] = p.layar.flatMap((l) => LEBAR.map((w) => ({ nama: `${l.id}@${w}`, lebar: w, langkah: [{ klik: `[data-lompat="${l.id}"]`, tunggu: 250 }] })));
  writeFileSync(join(dir, "README.md"), rekaman(p, [...dipakai].sort(), [...kataBaru], catatan[p.kode] as Rekaman | undefined));
  ringkas.push({ kode: p.kode, folder: p.folder, judul: p.judul, layar: p.layar.length, kunci: dipakai.size, baru: kataBaru.size });
}
writeFileSync(skenarioPath, JSON.stringify(skenario, null, 2) + "\n");
for (const r of ringkas) console.log(`${r.kode} ${r.folder.padEnd(18)} ${r.layar} screens · ${r.kunci} copy keys · ${r.baru} new words`);

// ── the record (README) ───────────────────────────────────────────────────────
type Hasil = { [lebar: string]: string };
type Rekaman = { periksa: Array<{ cek: string; hasil: Hasil; catatan?: string }>; temuan?: string[] };
function rekaman(p: Perjalanan, kunci: string[], baruDaftar: Array<[string, string]>, r?: Rekaman): string {
  const tabel = r
    ? `| Check | 1280 | 1024 | 390 | Note |\n|---|---|---|---|---|\n${r.periksa.map((c) => `| ${c.cek} | ${c.hasil["1280"] ?? "—"} | ${c.hasil["1024"] ?? "—"} | ${c.hasil["390"] ?? "—"} | ${c.catatan ?? ""} |`).join("\n")}`
    : "Not walked yet.";
  return `${p.judul}: a composed journey for owner validation (11-validation.md §1).

**Status: SPECIMEN, ready for owner validation.** Not PINTAR, and not applied: it shows the approved grammar working together.

**Who.** ${p.siapa}.

**What it validates.** ${p.menguji}.

**Composed against the product**
${p.catatanKomposisi.map((c) => `- ${c}`).join("\n")}

**The steps**
${p.layar.map((l, i) => `${i + 1}. ${l.langkah}`).join("\n")}

**Words.** ${kunci.length} copy-table keys (D-014). ${baruDaftar.length ? `New, not in the copy table yet (marked on the screens by «Mark new words», or listed here when they sit in an attribute):\n${baruDaftar.map(([w, m]) => `- «${w}»: ${m}`).join("\n")}` : "No new words."}

**The record**

${tabel}
${r?.temuan?.length ? `\n**Findings**\n${r.temuan.map((x) => `- ${x}`).join("\n")}\n` : ""}`;
}
