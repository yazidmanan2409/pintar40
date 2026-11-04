# C1 · W3.8: the report body and the A4 print

**Form C (composition).** Register entry C1 (RV-11, J7.2–J7.4, X.7, F-12(2)).
**Surfaces:**
- **Part A, the core:** `/edukator/ringkasan?kelas=…` (Ringkasan Kelas) and `/dekan/ringkasan?simpul=…` (Ringkasan Sekolah), at 0b19707 (`src/app/edukator/ringkasan/page.tsx`, `src/app/dekan/ringkasan/page.tsx`, `src/components/bukti/NilaiLaporan.tsx`).
- **Part B:** the bodies of the `/pimpinan` and `/pengembangan` routes (brief §5). In `PIMPINAN.md`, which follows in its own commit.

**Decisions this item depends on.** Both are word slots; neither stops the layout.
- **G6, the report titles (D-135(e)): Dr Gladys's.** Drawn as a labelled slot, «[G6 · judul laporan kelas]» and «[G6 · judul laporan sekolah]», on screen and in the print header. Never filled.
- **G2, «Peserta» and «Kenaikan» at class and school level, and the UX-41 heading: Dr Gladys's.** The labels laid out are the approved words in the copy table: `metrik.peserta.label` «Peserta», `metrik.kenaikan.label` «Kenaikan», and the rest of `metrik.*.label`. The live database labels («Murid yang dinilai di kelas ini», «Rata-rata kenaikan penguasaan di kelas ini») are what G2 settles. The layout takes either: a label is one line in a fixed place, wrapping when long.

**Not Daisy's, and not touched:** the metrics' definitions, calculations, minimum samples, the bands and their thresholds, who may read each figure (`generate_report` re-authorises per metric for this viewer), and every sentence's wording. This composition places what `generate_report` returns. It defines and computes nothing.

**Files in this folder:**
- `buat-c1.mts`: the specimens and their checks. Run it from the repository root with `npx tsx docs/coordination/ux/completion-4.0/C1/buat-c1.mts`.
- `c1.css`: the layout and the print stylesheet.
- `render/<page>-<width>.png`, `render/<page>-a4.png` and `render/<page>-a4.pdf` (the print), and `render/laporan.txt`.
- `jalan/`: the Tab order and the accessibility tree.

---

## 1. The composition (Part A)

**The report page, top to bottom:**
1. **The scope line** (BarisLingkup → Breadcrumb `pds-scope`): school / class / school year. Ringkasan Kelas only.
   - The school report covers **every** school year («no single year claimed»), so it has no year to name. The school is its title. That also follows the Breadcrumb rule (three levels or none).
2. **The head:**
   - the eyebrow is the **report title, G6's slot**;
   - the h1 is the place: the class, or the school;
   - the intro is the built coverage sentence, `laporan.cakupan.kelas` or `.sekolah` with its time.
   
   The actions sit at the head's end: the back link «Kembali» and «Cetak laporan». It is a secondary button: the figures are the page; printing is one thing a reader may do with them.
3. **The body:** the figures **in the template's order** (the school chose it, W8-02), laid out by shape.

| What `generate_report` returns | Laid out as |
|---|---|
| **One figure** (`satu`: Peserta, Pemahaman, Kenaikan, Soal wajib, Sertifikat terbit) | A panel: the label (14/20 `ink-2`), the figure (`t-stat`), and its sentence. **Consecutive single figures share a row** (auto-fit at 220 px); a row never reorders them. |
| **Bands** (Sebaran hasil Uji Penguasaan) | Full width under a hairline: the heading, then the sentence first, then «Hasil {n} murid yang sudah mengerjakan», the bands as a key/value list in the fixed order (`URUTAN_PITA`), the population line (PopulasiKelas), and the bands' note (`kesiapan.catatan`). |
| **Values by name** (Penguasaan per topik) | Full width: the heading, the sentence, a key/value list (name, figure). |
| **Rows** (Pemahaman keliru yang berulang; Capaian kompetensi; Perbandingan angkatan) | Full width: the heading, the sentence, a list. Each row: its name (600), then its line (the remediation, or «72% · 140 murid»). Up to eight rows, as built. |
| **A figure not available** (`below_minimum`, `no_evidence`, `deprecated`) | In the same place and the same shape: the heading, then the statement (`laporan.metrik.*`), «Sekarang {have} murid; perlu {needed}.» (`ketiadaan.jumlah.murid`) where it applies, and what will make it appear (`laporan.muncul.*`). Quiet ink; never a warning colour. |
| **A figure not for this reader** (`not_permitted`) | **No heading and no label**: the refusal must not disclose what it withheld. A `surface-2` well with «Angka ini tidak ditampilkan untuk peran Anda.», named by that sentence for assistive technology. |

**S-3, kept:** never a number without a sentence saying what to do about it. Every shown figure carries its sentence (`actionText`), and the check counts it.

**Story first:**
- **Wide figures:** the sentence comes before the numbers.
- **Single figures:** the sentence comes under the figure. A reader scanning a row of three reads the figure, then what to do.

**The body's other states** (as built, in DS components):
- **Nothing to show** (no template, or no entries): an Empty state with `laporan.kosong`.
- **Every figure withheld or short:** a well with `laporan.tak_ada_angka` above the statements, «an all-omitted report is a valid report» (P3).

## 2. Layouts

**Widths:** 1280, 820, 390 and 320 px for six specimens (`render/`).

| Width | What changes |
|---|---|
| 1280 / 820 | The staff shell. Single figures three to a row; key/value lists at `measure-narrow`. |
| 390 / 320 | The App shell's top bar. Single figures one to a row. The actions span the head: «Kembali» at the start, «Cetak laporan» at the end. Lists keep the figure right-aligned; long names wrap. |

### The A4 print specification

See `render/*-a4.pdf`, printed by the browser from the page's own stylesheet.

| Rule | Specification |
|---|---|
| Paper | A4 portrait (`@page { size: A4 portrait }`) |
| Margins | 18 mm top and bottom, 15 mm left and right |
| Header line, every page | **Top left:** the title slot · school · class · school year (the class report), or the title slot · school (the school report). **Top right:** when the figures were calculated («4 Nov 2026, 10.52 WIB»). 8 pt `ink-2`, in the `@top-left` and `@top-right` margin boxes. |
| Footer, every page | Bottom right: «Halaman n dari m» (`koleksi.posisi`'s words, with the page counters) |
| What prints | The scope line, the head (title slot, place, coverage sentence) and the body. **Never:** the navigation, the top bar, the skip link, the actions. Every shell part keeps `pin-noprint`, as built. |
| Breaks | A figure (`.c1-m`) never splits across pages (`break-inside: avoid`). A heading never ends a page (`break-after: avoid`). A list longer than eight rows may break, and keeps its heading with its first rows. |
| Type | 10 pt body; the place 20 pt; a single figure 20 pt. Three single figures to a row on paper. |
| Colour | On white. No ground tints: a panel's ground is white with a 0.5 pt `line-control` hairline, and the withheld figure's well becomes the same outline. Nothing carries meaning by colour; the ink is the screen's. The title slot prints as a slot. |

**For engineering:**
- The header line's words are written into a per-page `<style>` (margin boxes take a CSS string).
- The margin boxes' colour is the literal value of `--ink-2` (`#4E5A64`), because custom properties don't reach the page context.

## 3. States and roles

| State | Specimen |
|---|---|
| Ringkasan Kelas, every figure shown | `kelas-penuh` (+ A4) |
| one figure not shown for this reader | `kelas-tanpa-izin` |
| under five, «not yet»: one figure shown, the rest short | `kelas-belum` (+ A4) |
| nothing to show | `kelas-kosong` |
| Ringkasan Sekolah, every school year | `sekolah-penuh` (+ A4) |
| no figure yet, each said why | `sekolah-tanpa-angka` |

**Readers:** whoever `generate_report` authorises, per metric. The page doesn't vary by role; the entries do. The specimens use a Kepala departemen.

**Ringkasan Sekolah is read-only** (INV-19): no control on it changes anything.

## 4. Keyboard and accessibility

- **Tab order:** the skip link, the places, «Kembali», «Cetak laporan». The figures hold no controls.
- **Headings:** one h1 (the place); an h2 per figure that has a label; none for a withheld figure, whose section is named by its sentence.
- **Lists:** the key/value lists are `dl`; the row lists are `ul`.
- **Colour never carries meaning:** no band, figure or state is coloured.
- **Checks** (`render/laporan.txt`):
  - axe WCAG 2.2 AA passes in all 24 renders;
  - every target is at least 24 px;
  - focus rings;
  - no withheld figure shows a heading;
  - every shown figure has its sentence;
  - the G6 slot is drawn exactly once;
  - no raw key.

## 5. Words (T table)

**Part A adds no new words.** Every word is the copy table at 0b19707:
- `laporan.*`, `metrik.*.label` and `.arti`, `tindakan.*`, `kesiapan.*`, `ketiadaan.jumlah.murid`;
- `laporan.muncul.*`, `koleksi.posisi` (the print footer), `mengajar.bukti.murid` and `.poin`.

| Slot | Whose | Where |
|---|---|---|
| `[G6 · judul laporan kelas]` | Dr Gladys (D-135(e)) | the eyebrow; the print header |
| `[G6 · judul laporan sekolah]` | Dr Gladys (D-135(e)) | the eyebrow; the print header |
| the metric labels at class and school level | Dr Gladys (G2) | each figure's heading; laid out with today's approved words |

## 6. Components and tokens

**Components:** the staff shell, Breadcrumb (`pds-scope`), Page head, Back link, Button (secondary), Panel (single figures), Section hairlines (wide figures), key/value list, list, Well (withheld; all-omitted), Empty state.

**Type:**
- the label: `t-label` size in `ink-2`;
- the figure: `t-stat`;
- the sentence: `t-body` (16/24) for wide figures, `t-small` in panels;
- notes: `t-small` `ink-2`.

**Tokens only** on screen: `--surface-1/2`, `--ink-1/2`, `--line`, `--line-control`, `--radius-lg/md/sm`, `--space-*`, `--measure-prose/narrow`. No new token. The print's margin-box ink is `--ink-2`'s literal value (§2).

## 7. Navigation and outcomes

| Action | Outcome |
|---|---|
| «Kembali» | the page the reader came from: `/pimpinan`, or Konfigurasi's «Laporan» section page (B1) |
| «Cetak laporan» | the browser's print, to this specification |

Nothing is saved and nothing is announced.

## 8. Edge cases

- **Eight rows:** a list shows at most eight rows, as built. On paper a list over eight rows may break across pages.
- **A label longer than one line** (for example the database's own labels, until G2): it wraps; the panel grows; the row keeps its order.
- **A figure the reader may not see, between two shown figures:** it keeps its place, unlabelled.
- **A single figure short of evidence:** it keeps its panel, holding its statement instead of the figure (`kelas-belum`).
- **The school report** names no year. Its print header omits the year.
- **A class name or school name over two lines:** the h1 wraps (`text-wrap: balance`). The print header line truncates nothing; it wraps within its margin box.

## 9. Acceptance checklist (Part A)

- [auto] No sideways scroll at 1280, 820, 390 or 320 px, in all six specimens.
- [auto] axe WCAG 2.2 AA: no violations, 24 of 24 renders.
- [auto] A withheld figure has no heading and no label.
- [auto] Every shown figure carries its sentence (S-3).
- [auto] Figures appear in the template's order.
- [auto] The G6 title slot is drawn once on screen, and appears in every printed page's header.
- [auto] A4: two pages for `kelas-penuh`; the header line and «Halaman n dari m» on every page; no figure split across pages; the navigation, bar, skip link and actions do not print (`audit/b6-cetak.mjs` extends to these rules).
- [manual] Side-by-side review of the build beside this composition at each width and on paper, printed on a school printer, recorded as match or deviation per region (brief G:14).
- [manual] G2's labels and G6's titles set by Dr Gladys, and the specimens re-rendered with them.
- [manual] E:90: the report page names class, school and period, sits in the shell, and prints.
