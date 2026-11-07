/**
 * CONTOH LAPORAN · the review collection: the README (in the repository) and the review page (published),
 * both written from the same notes (catatan.json, baru.json) that buat-contoh.mts writes.
 *
 *   npx tsx docs/coordination/ux/completion-4.0/CONTOH-LAPORAN/buat-koleksi.mts <publish folder>
 */
import { mkdirSync, writeFileSync, readFileSync, copyFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const sini = dirname(fileURLToPath(import.meta.url));
const repo = join(sini, "..", "..", "..", "..", "..");
const keluar = process.argv[2];
if (!keluar) throw new Error("give the publish folder");
type Catatan = { kode: string; judul: string; pembaca: string; tigaPuluh: string; peta: string[]; visual: Array<[string, string]>; privasi: string[]; tanya: string[] };
const catatan: Catatan[] = JSON.parse(readFileSync(join(sini, "catatan.json"), "utf8"));
const baru: Array<{ laporan: string; teks: string; catatan?: string }> = JSON.parse(readFileSync(join(sini, "baru.json"), "utf8"));
const TANYA_PEMBACA: Record<string, string> = {
  "1-murid": "Bagian mana yang sudah saya kuasai? Apa yang masih perlu saya pelajari?",
  "2-guru": "Apakah kelas saya memahami materi? Bagian mana yang paling membutuhkan perhatian?",
  "2b-guru-belum-cukup": "Apakah kelas saya memahami materi? (Uji Penguasaan kelas ini masih berlangsung.)",
  "3-kadep": "Apakah ada pola kesulitan pembelajaran yang perlu kami tindak lanjuti?",
  "4-dekan": "Bagaimana kondisi pembelajaran sekolah secara keseluruhan? Di mana perhatian perlu diberikan?",
  "5-peserta-pd": "Apa perkembangan saya? Apa yang sudah baik dan apa yang perlu saya tingkatkan?",
  "6-fasilitator": "Bagaimana perkembangan kegiatan yang saya tangani berdasarkan informasi yang boleh saya akses?",
  "7-admin": "Siapa yang belum terdaftar, belum aktif, atau memiliki pekerjaan administrasi yang belum selesai?",
};
const KUNCI_BARU: Record<string, string> = { "1-murid": "murid", "2-guru": "guru-7A", "2b-guru-belum-cukup": "guru-7E", "3-kadep": "kadep", "4-dekan": "dekan", "5-peserta-pd": "peserta-pd", "6-fasilitator": "fasilitator", "7-admin": "admin" };
const PRIORITAS = new Set(["2-guru", "4-dekan"]);
/** The owner's consolidated review of 7 Nov: each item, what changed, and how it was checked. */
const KOREKSI: Array<[string, string, string]> = [
  ["R3-01", "Kelas 7E clipped in the Kepala departemen grid", "On paper the grid is a fixed-width table that fits the printable width (topic 24%, each class its share); headers wrap. All five classes print. The cause was the screen's horizontal-scroll container, which clips on paper. Checked in the A4 text and image."],
  ["R4-01", "Band names overlapping above the Dekan's scale", "The names are a one-line legend above the scale («Batas pita: di bawah 60% …»); the boundaries stay drawn at 60 and 80."],
  ["R4-02", "«60%» shown for a result in «Perlu penguatan»", "Listrik dan magnet is 59,6%: rounding showed 60%. A value that rounding would carry across 60, 75 or 80 now shows one decimal, in every report. No band definition changed; the mandatory-item rule did not apply to it."],
  ["R6-01, R7-01, R2-04", "Headings colliding with the rows before them", "The cause was the page body laid out as a grid, which Chromium can overlap where it breaks across pages. On paper the body flows as blocks; every heading keeps space above and stays with its first line."],
  ["R6-03, R6-04", "Facilitator columns clipped; fields at risk", "All seven fields print, each with a set share of the width; statuses wrap between words, never inside one. «Paket» is stated above the table (one package, the same for every row)."],
  ["R3-02, R6-05", "Nearly empty first pages", "The lead box no longer refuses to break, so a large table starts on page 1; single rows, figures and keys stay whole."],
  ["G-01", "PINTAR branding", "«PINTAR» in Inter Bold, #075056, in every A4 page's header, with the report, the institution and the period; the specimen mark and «Halaman n dari m» in the footer. On screen the shell carries it, as built."],
  ["G-02", "Section references", "Every major section has its letter (A, B, C …), the same square on screen and paper, restarting at A in each report; «Apa berikutnya» is the last letter. The running header does not name the current section: this print engine cannot carry a heading into the page header (no running strings), so the letter is on each section's own heading."],
  ["G-03", "Colour meaning", "One rule for all eight: grey for an ordinary value; amber, always with its words, for below the target or in «Perlu penguatan»; teal only for the bands and for progress. The amber is darker than the grey, so greyscale keeps them apart. The green «Pecahan campuran» bar is now amber like every other value below target."],
  ["G-04", "Zebra striping", "The design system's own stripe (table-row-alt) on the two long multi-column tables only: the Kepala departemen's grid and the facilitator's participants. Not on lists or charts. It carries across page breaks."],
  ["G-05", "A4 pagination", "Header row repeated on every page of a table; figures, rows and keys never split; no clipping; body text 10 pt."],
  ["G-06", "No buttons on paper", "Every «Apa berikutnya» prints its steps as text («Di PINTAR: …»); the admin's card selection prints as the list and the instruction."],
  ["R1-01, R1-02", "Murid: chapter groups", "Each chapter's parts sit on their own light ground under the chapter's name, so where one chapter ends and the next begins is plain, in greyscale too."],
  ["R2-02, R2-03", "Guru: heading and figures", "«Murid yang perlu penguatan» (the band's formal name stays where the band is named, in «»); the figures in one right-aligned column of fixed width, each with the same kind of note under it."],
  ["R7-02, R7-03, R7-04", "Admin: cards and reasons", "Four groups by the real reason (no card · card not used · data in Pendataan · teacher's email not activated). The multi-class selection is marked as a proposal (H30) on screen; on paper the steps are today's («Buat kartu untuk kelas ini» once per class, then «Cetak kartu kelas»). «Yang menunggu» counts 10 in Aktivasi, not 12: the two in Pendataan are not there yet."],
  ["R4-03", "Certificate count", "«Sertifikat terbit» uses MC-1 exactly: certificates issued and not revoked, out of all issued («408 dari 411 yang pernah terbit; 3 dicabut»). The earlier base (Mastery Check results) was wrong."],
  ["Also", "Found while checking", "Two primary buttons on the admin screen (P1: one) — the page button is now secondary."],
];
/** The independent review of d6eff55a (7 Nov): FAIL on one blocking item, minor corrections otherwise. */
const RONDE2: Array<[string, string, string]> = [
  ["1 (blocking)", "Report 7 showed the multi-class selection as today's PINTAR", "On screen: framed, labelled «Usulan · H30 · belum tersedia», controls disabled, today's way stated above it. On paper, sections B and D: «tekan «Buat kartu untuk kelas ini» sekali untuk setiap kelas (7E, 8B, 8D, 9B, 9D), lalu «Cetak kartu kelas»»."],
  ["2", "Report 7, section A: chevrons on paper", "The «Yang menunggu» chevrons do not print."],
  ["3", "Report 2, section E: «9 dari 20 / soal wajib belum tepat»", "«9 dari 20 soal tepat», with «soal wajib belum tepat» under it only where it applies (Ayu Tanjung, Hana Siregar)."],
  ["4", "Report 1: «Pecahan campuran» in B but not in A", "Section A names every part marked «pelajari lagi», with its chapter: «Pecahan campuran (Matematika Bab 2); Massa jenis serta Campuran dan larutan (IPA Bab 1)». The next step names both chapters."],
  ["5", "Report 4, section B: «Bagian murid …» over 836 results", "«Bagian hasil yang menjawab benar seluruh soal wajib.» The real calculation counts results too; the copy table's own words say «murid» (hand-off H31)."],
  ["6", "Report 5: two pages; steps like a legend; «Target untuk bab ini»", "One A4 page; the steps numbered 1–4 and joined in order; «Target paket ini»."],
  ["7", "Page breaks", "Report 2 B: the band bar and the dot plot stay together. Report 2b C and report 4 D stay whole. «Angkatan 2026 (kelas 7)» never wraps. Also: an explanation line never splits, so a heading always keeps its first lines, and the closing «CONTOH LAPORAN» line is screen-only (every page footer carries it), so no report ends on a near-empty page."],
  ["8", "H30: authorisation", "Added: the provisioning permission, the database's per-learner decision, its audit record, and its refusal to issue cards to staff stay as they are."],
];
const DIKOREKSI: Record<string, string> = { "1-murid": "R1-01, R1-02", "2-guru": "R2-01 to R2-04", "2b-guru-belum-cukup": "common corrections; 2 pages", "3-kadep": "R3-01, R3-02", "4-dekan": "R4-01 to R4-03", "5-peserta-pd": "approved; common grammar only", "6-fasilitator": "R6-01 to R6-05", "7-admin": "R7-01 to R7-04" };
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
// The notes use `code` and **bold** in Markdown; on the page they become <code> and <strong>.
const md = (s: string) => esc(s).replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
const halamanA4 = (k: string) => readdirSync(join(sini, "render")).filter((f) => f.startsWith(`${k}-a4-`) && f.endsWith(".png")).length;

// ── README ───────────────────────────────────────────────────────────────────
const readme = `# CONTOH LAPORAN · seven sample reports (owner's review)

**Form P (a specimen collection).** Seven readers, seven reports, plus one variant (2b) showing how the Guru report changes when the evidence is not yet enough. **A design and language exercise, not a proposal:** no new module, metric, permission or requirement. Every report is drawn over figures PINTAR already has; where a report gathers existing pages into one view, it says so, and the question is put to the owner.

**Data:** 100% invented, internally consistent. One simulated school (SMP Cahaya Kaliandra, 15 classes, about 470 students, Matematika and IPA), simulated answer by answer (\`data.mts\`). Every total, percentage, chart and sentence is computed from those answers, so they agree inside a report and between reports: Kelas 7A in report 2 is the same 7A in report 3's grid and inside report 4's school figures, and its students are the ones in report 7's account list. Every screen and every A4 page carries **«CONTOH LAPORAN — DATA SIMULASI»**.

**Words:** every label PINTAR already has is read from the copy table on the engineering branch (read only); every new word is listed below for review. Dr Gladys's definitions are untouched; where a word needs her, it is a question, not a change.

**How to review** (the owner's sequence): first 30 seconds per report without these notes; then every Indonesian heading, label and sentence; then whether each figure supports its sentence and the reader knows what to do next. One consolidated round of corrections.

**Files:** \`<kode>.html\` (open in a browser); \`render/<kode>-1280.png\`, \`render/<kode>-390.png\` (screen); \`render/<kode>-a4.pdf\` and \`render/<kode>-a4-<n>.png\` (A4). Rebuild: \`npx tsx docs/coordination/ux/completion-4.0/CONTOH-LAPORAN/buat-contoh.mts\`.

**The visual grammar, the same in all eight:** one sentence first (what the reader should see), then one picture that shows it; a scale is always 0–100% from zero; the target is a labelled black line; PINTAR's three bands are three steps of one teal, always with their names; the one value the page is about carries the teal accent, everything else is ink; «di bawah target» is a word in the attention colour, never colour alone; missing evidence is a sentence in the figure's place. Every chart has a text equivalent in the page.

## Corrections after the independent review of \`d6eff55a\`

| Item | What was wrong | What changed |
|---|---|---|
${RONDE2.map(([a, b, c]) => `| ${a} | ${b} | ${c} |`).join("\n")}

## Corrections after the owner's review (7 Nov)

**DESIGN DIRECTION APPROVED — TARGETED CORRECTIONS REQUIRED.** Same data, same layouts and interpretations; only the defects and the common grammar changed. Every A4 page re-checked at print size (image and extracted text).

| Item | What was wrong | What changed |
|---|---|---|
${KOREKSI.map(([a, b, c]) => `| ${a} | ${b} | ${c} |`).join("\n")}

${catatan.map((c) => `## ${c.kode} · ${c.judul}

**Reader:** ${c.pembaca}. **Their question:** «${TANYA_PEMBACA[c.kode]}» **A4:** ${halamanA4(c.kode)} page${halamanA4(c.kode) === 1 ? "" : "s"}.

**In 30 seconds:** ${c.tigaPuluh}

**Where it comes from in PINTAR**
${c.peta.map((p) => `- ${p}`).join("\n")}

**Each figure, and why this form**

| Figure | Why |
|---|---|
${c.visual.map(([a, b]) => `| ${a} | ${b} |`).join("\n")}

**Privacy and permissions:** ${c.privasi.join(" ")}

${c.tanya.length ? `**Questions for the owner or Dr Gladys**\n${c.tanya.map((t) => `- ${t}`).join("\n")}` : "**Questions:** none."}
`).join("\n")}
## All new words, for review

Every visible string that is not already in PINTAR's copy table. Numbers inside a sentence are filled from the data.

| Report | New words | Note |
|---|---|---|
${baru.map((b) => `| ${b.laporan} | ${b.teks.replace(/\|/g, "\\|")} | ${b.catatan ?? ""} |`).join("\n")}

## Checklist

- [auto] «CONTOH LAPORAN — DATA SIMULASI» on every screen and in every A4 page's header (\`@page\`).
- [auto] Every figure and sentence computed from one simulated data set (\`data.mts\`); no hand-typed total.
- [auto] axe (WCAG 2.2 AA) clean on all eight at 1280 px; no sideways scroll at 1280 or 390 px (\`render/laporan.txt\`).
- [auto] A4: «Halaman n dari m» on every page; the shell and the actions do not print.
- [auto] Every existing label read from the copy table; every new string listed above.
- [auto] Bands in PINTAR's order (Mantap, Berkembang, Perlu penguatan); «Belum mengerjakan» is a count, never a band (D-121(c)).
- [auto] No figure below the minimum sample (5); the «not yet» statement in its place (P14), shown in 2b and in report 3's 7E.
- [auto] The facilitator's and the administrator's reports: no aggregate of results, no ranking, no answers, no integrity signals; Admin sekolah sees no result (D-069(b), (c)).
- [auto] No class is labelled by its teacher; no learner is compared with another.
- [manual] The owner's three passes (visual, language, meaning).
- [auto] **D-172:** equivalent interactions match their canonical pattern: P1 (one primary action), P3, P6, P13, P14, P20 (no app-name eyebrow).
- [auto] **Visual intelligence:** each report states its reader, question, message, evidence and action (above); bases and periods named; missing evidence shown; no encoding by colour alone; a text equivalent for every chart.
`;
writeFileSync(join(sini, "README.md"), readme);

// ── the review page ──────────────────────────────────────────────────────────
mkdirSync(join(keluar, "laporan"), { recursive: true }); mkdirSync(join(keluar, "gambar"), { recursive: true }); mkdirSync(join(keluar, "pdf"), { recursive: true }); mkdirSync(join(keluar, "fonts"), { recursive: true });
for (const f of ["plus-jakarta-sans-latin.woff2", "plus-jakarta-sans-latin-ext.woff2", "ibm-plex-mono-500-latin.woff2"]) copyFileSync(join(repo, "public/fonts", f), join(keluar, "fonts", f));
copyFileSync(join(repo, "docs/coordination/ux/sistem-desain/project/fonts/OFL-Inter.txt"), join(keluar, "fonts", "OFL-Inter.txt"));
for (const c of catatan) {
  const h = readFileSync(join(sini, `${c.kode}.html`), "utf8").replace(new RegExp(`file://${repo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/public/fonts/`, "g"), "../fonts/");
  writeFileSync(join(keluar, "laporan", `${c.kode}.html`), h);
  copyFileSync(join(sini, "render", `${c.kode}-1280.png`), join(keluar, "gambar", `${c.kode}-1280.png`));
  copyFileSync(join(sini, "render", `${c.kode}-a4.pdf`), join(keluar, "pdf", `${c.kode}-a4.pdf`));
}
const kartu = catatan.map((c, i) => `
<article class="kartu" id="r-${c.kode}">
  <a class="gambar" href="laporan/${c.kode}.html" aria-label="Buka ${esc(c.judul)}"><img src="gambar/${c.kode}-1280.png" alt="Tampilan layar ${esc(c.judul)}" loading="${i < 2 ? "eager" : "lazy"}" width="1280" height="900"></a>
  <div class="teks">
    <p class="alis">${esc(c.kode.replace(/-.*/, ""))} · ${esc(c.pembaca)} <span class="mulai">${esc(DIKOREKSI[c.kode])}</span></p>
    <h2>${esc(c.judul)}</h2>
    <p class="tanya" lang="id">«${esc(TANYA_PEMBACA[c.kode])}»</p>
    <p class="aksi"><a class="tombol utama" href="laporan/${c.kode}.html">Open the report</a><a class="tombol" href="pdf/${c.kode}-a4.pdf">A4 PDF (${halamanA4(c.kode)} p.)</a></p>
    <details><summary>Daisy's notes (read after the first look)</summary>
      <h3>In 30 seconds</h3><p>${md(c.tigaPuluh)}</p>
      <h3>Figures, and why</h3><dl>${c.visual.map(([a, b]) => `<dt>${md(a)}</dt><dd>${md(b)}</dd>`).join("")}</dl>
      <h3>Where it comes from in PINTAR</h3><ul>${c.peta.map((p) => `<li>${md(p)}</li>`).join("")}</ul>
      <h3>Privacy</h3><p>${md(c.privasi.join(" "))}</p>
      ${c.tanya.length ? `<h3>Questions for the owner or Dr Gladys</h3><ul>${c.tanya.map((t) => `<li>${md(t)}</li>`).join("")}</ul>` : ""}
      <h3>New words in this report</h3><ul lang="id" class="kata">${baru.filter((b) => b.laporan === KUNCI_BARU[c.kode]).map((b) => `<li>${esc(b.teks)}</li>`).join("")}</ul>
    </details>
  </div>
</article>`).join("");
const halaman = `<title>Contoh Laporan PINTAR</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>
/* Layout: one reading column of report cards, each a screen preview beside its question, in PINTAR's own grammar. */
@font-face { font-family: "Plus Jakarta Sans"; src: url("fonts/plus-jakarta-sans-latin.woff2") format("woff2"); font-weight: 200 800; font-display: swap; }
@font-face { font-family: "Inter"; src: url("fonts/inter-700-latin.woff2") format("woff2"); font-weight: 700; font-display: swap; }
:root { --kanvas: #FBFAF7; --kertas: #FFFFFF; --tinta: #1F2A33; --tinta-2: #4E5A64; --garis: rgba(31,42,51,0.12); --hijau: #245F55; --hijau-lembut: #E3EFEC; --perhatian: #8A5F00; --perhatian-lembut: #F7EED8;
  --huruf: "Plus Jakarta Sans", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif; color-scheme: light; }
body { background: var(--kanvas); color: var(--tinta); font: 400 16px/1.55 var(--huruf); margin: 0; }
.wadah { max-width: 1120px; margin: 0 auto; padding-block: 40px 80px; padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); display: grid; gap: 40px; }
header { display: grid; gap: 12px; }
.merek { font: 700 18px/1 "Inter", Arial, sans-serif; letter-spacing: 0.14em; color: #075056; margin: 0; }
.tanda { margin: 0; padding: 10px 14px; border-radius: 8px; background: var(--perhatian-lembut); font-size: 14px; }
.tanda strong { letter-spacing: 0.06em; }
h1 { margin: 0; font-size: 30px; line-height: 1.2; font-weight: 600; text-wrap: balance; }
.intro { margin: 0; max-width: 72ch; color: var(--tinta-2); }
.cara { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr)); gap: 12px; margin: 0; padding: 0; list-style: none; }
.cara li { background: var(--kertas); border: 1px solid var(--garis); border-radius: 12px; padding: 14px 16px; font-size: 14px; color: var(--tinta-2); }
.cara b { display: block; color: var(--tinta); font-size: 15px; margin-bottom: 2px; }
.kartu { display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr); gap: 24px; align-items: start; padding: 20px; background: var(--kertas); border: 1px solid var(--garis); border-radius: 12px; }
.gambar { display: block; border-radius: 8px; overflow: hidden; border: 1px solid var(--garis); aspect-ratio: 1280 / 900; max-width: 100%; }
.gambar img { width: 100%; height: 100%; object-fit: cover; object-position: top left; display: block; }
.gambar:focus-visible, .tombol:focus-visible, summary:focus-visible { outline: 2px solid var(--hijau); outline-offset: 2px; }
.teks { display: grid; gap: 10px; min-width: 0; }
.alis { margin: 0; font-size: 12px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--tinta-2); font-weight: 600; }
.mulai { text-transform: none; letter-spacing: 0; margin-left: 6px; padding: 2px 8px; border-radius: 999px; background: var(--hijau-lembut); color: var(--hijau); }
h2 { margin: 0; font-size: 22px; line-height: 1.25; font-weight: 600; }
.tanya { margin: 0; font-size: 17px; line-height: 1.45; color: var(--tinta); }
.aksi { display: flex; flex-wrap: wrap; gap: 8px; margin: 4px 0 0; }
.tombol { display: inline-flex; align-items: center; min-height: 44px; padding: 0 16px; border-radius: 8px; border: 1px solid rgba(31,42,51,0.24); color: var(--tinta); text-decoration: none; font-weight: 600; font-size: 15px; }
.tombol.utama { background: var(--hijau); border-color: var(--hijau); color: #fff; }
details { border-top: 1px solid var(--garis); padding-top: 10px; font-size: 14px; color: var(--tinta-2); }
summary { cursor: pointer; font-weight: 600; color: var(--tinta); min-height: 32px; display: flex; align-items: center; }
details h3 { margin: 14px 0 4px; font-size: 14px; color: var(--tinta); }
details p, details ul, details dl { margin: 0; }
details ul { padding-left: 18px; } details dd { margin: 0 0 8px; } details dt { color: var(--tinta); font-weight: 600; }
code { font: 500 12.5px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace; background: var(--kanvas); padding: 1px 4px; border-radius: 4px; overflow-wrap: anywhere; }
.kata li { margin: 2px 0; }
.koreksi { background: var(--kertas); border: 1px solid var(--garis); border-radius: 12px; padding: 12px 16px; font-size: 14px; color: var(--tinta-2); }
.gulir { overflow-x: auto; }
header > *, .koreksi { min-width: 0; }
.koreksi table { width: 100%; min-width: 560px; border-collapse: collapse; margin-top: 8px; }
.koreksi th, .koreksi td { text-align: left; vertical-align: top; padding: 8px 10px 8px 0; border-top: 1px solid var(--garis); }
.koreksi thead th { border-top: 0; color: var(--tinta); }
.koreksi tbody th { color: var(--tinta); white-space: nowrap; font-weight: 600; }
.koreksi tbody tr:nth-child(even) > * { background: var(--kanvas); }
footer { font-size: 14px; color: var(--tinta-2); border-top: 1px solid var(--garis); padding-top: 16px; max-width: 80ch; }
@media (max-width: 820px) { .kartu { grid-template-columns: minmax(0, 1fr); } }
@media (prefers-reduced-motion: reduce) { * { scroll-behavior: auto; } }
</style>
<div class="wadah">
<header>
  <p class="merek">PINTAR</p>
  <p class="tanda"><strong>CONTOH LAPORAN — DATA SIMULASI</strong> · every name, class and figure is invented.</p>
  <h1>Seven sample reports, one per reader · corrected</h1>
  <p class="intro">For your review of the Indonesian, the infographics, the hierarchy, the usefulness, the consistency and the A4 print. Each report is drawn over what PINTAR already reports to that reader, on one invented school whose figures agree across all eight. Report 2b is the Guru report when the evidence is not yet enough.</p>
  <details class="koreksi"><summary>What changed after your review of 7 Nov</summary><div class="gulir"><table><thead><tr><th scope="col">Item</th><th scope="col">What was wrong</th><th scope="col">What changed</th></tr></thead><tbody>${KOREKSI.map(([a, b, c]) => `<tr><th scope="row">${esc(a)}</th><td>${md(b)}</td><td>${md(c)}</td></tr>`).join("")}</tbody></table></div></details>
  <details class="koreksi" open><summary>Independent review of d6eff55a: the eight corrections</summary><div class="gulir"><table><thead><tr><th scope="col">Item</th><th scope="col">What was wrong</th><th scope="col">What changed</th></tr></thead><tbody>${RONDE2.map(([a, b, c]) => `<tr><th scope="row">${esc(a)}</th><td>${md(b)}</td><td>${md(c)}</td></tr>`).join("")}</tbody></table></div></details>
  <ol class="cara">
    <li><b>1 · Look for 30 seconds</b>Open a report without reading the notes. What does it tell you?</li>
    <li><b>2 · Read the Indonesian</b>Every heading, label and sentence. Mark anything unnatural, vague or technical.</li>
    <li><b>3 · Check the meaning</b>Does each picture support its sentence? Does the reader know what to do next?</li>
  </ol>
</header>
${kartu}
<footer>Made by Daisy (UX-1) for the owner's review, 6 Nov 2026. A design and language exercise: nothing here changes PINTAR, its metrics or its permissions. The notes under each report list where its figures come from, why each picture was chosen, and the questions that need you or Dr Gladys. The full record, with every new word, is in <code>docs/coordination/ux/completion-4.0/CONTOH-LAPORAN/README.md</code>.</footer>
</div>`;
writeFileSync(join(keluar, "index.html"), halaman);
console.log(`README and ${catatan.length} cards written; ${baru.length} new strings`);
