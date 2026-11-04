# C1 part B · the Management and professional-learning bodies

**Form C (composition), part B of C1.** Part A (the two Ringkasan bodies and their A4 print) is [`README.md`](README.md).
**Surfaces** (brief §5 «C1: the concrete routes»), at 0b19707:
- `/pimpinan`
- `/pimpinan/[simpul]`
- `/pimpinan/[simpul]/murid` and `…/murid/[orang]`
- `/pimpinan/[simpul]/umpan-balik`, `…/umpan-balik/[siklus]` and `…/umpan-balik/kelas/[kelas]`
- `/pengembangan/[simpul]`

**What changes:** the bodies only. The shells, the layout's context guard (`konteksHalaman`), every gate (`management_scope_over_node`, `CAN_VIEW_LEARNER_ROSTER`, `professional_learning_record`) and every action (`advance_management_decision`, `open_feedback_cycle`, `close_feedback_cycle`) are built and stay.

**Files:**
- `buat-c1b.mts`: run it from the repository root with `npx tsx docs/coordination/ux/completion-4.0/C1/buat-c1b.mts`.
- `c1b.css`, which loads on top of `c1.css`.
- `render-b/<page>-<width>.png`, `render-b/<page>-a4.pdf` and `render-b/laporan.txt`.
- `jalan-b/`.

> **The result cell on `/pengembangan/[simpul]` is settled by D-069(b)** (owner, 4 Nov). The facilitator, the Kepala departemen over the place and the Dekan may see each participant's individual result; Admin sekolah sees enrolment, participation and completion, never an individual result. The restriction is no aggregate academic figure and no ranking. See §10.

---

## 1. The composition

**One grammar for all eight routes:**
- the staff shell;
- the back link (`pds-back`), named by where it goes;
- the scope line (Breadcrumb, `pds-scope`) where the place is three levels deep;
- the eyebrow, the h1 and the intro;
- then sections (`pds-section`, an h2 each) holding one of four things:
  - lists of links (`pds-list`, `pds-list-row`): every place, person, round or record that opens;
  - panels: one decision each;
  - the figure layout of Part A (single figures in panels sharing a row; statements in their place);
  - key/value lists (`dl`): facts and counts.

Figures look the same here as in the Ringkasan, so a figure reads the same wherever it is met.

### `/pimpinan` (`render-b/pimpinan`, `pimpinan-nihil`)

1. **The head:**
   - eyebrow «Pimpinan»;
   - h1 «Apa yang menunggu Anda»;
   - intro: **the suppression line** (`pimpinan.batas`), always, even when nothing waits.
2. **«Lingkup»,** where there is more than one scope: the places as a row of buttons. The current one has a secondary border, 600 weight and `aria-current`; the others are quiet. They wrap at 320.
3. **«Keputusan»:**
   - the count sentence (`.nihil`, `.satu` or the number with `.banyak`);
   - the order note (`pimpinan.urutan`), only when more than one waits;
   - **one panel per decision**, in the built order: waiting, then handled, then decided; oldest first. Then «PINTAR mengusulkan, manusia memutuskan.»

   **A decision panel holds:**
   - a state badge with its icon and word: «Menunggu tinjauan» (attention), «Sedang ditangani» (info), «Sudah diputuskan» (ok), or «Menunggu keputusan» where the reader referred the case themselves;
   - the place;
   - the family as h3;
   - «Tentang …» and «Sejak …»;
   - the three-line chain as a `dl` («Yang didukung bukti», «Yang belum diketahui», «Langkah yang mungkin»);
   - the educator's note as a quotation;
   - then «Keputusan Anda» (h4) with its forms:
     - «Saya yang menangani» (secondary), while waiting;
     - «Hasil» and «Catatan (boleh dikosongkan)» side by side, then «Catat keputusan» (primary);
     - or, where someone else decides, the built sentence instead of the form.

   **A decided case** is compact: badge, family, «Keputusan Anda: … · Diputuskan …». Its chain sits in a disclosure: history, not something that must be read.
4. **«Yang didukung bukti»:** Part A's figure layout (AngkaTerkelola, KartuKetiadaan), each with «dari n murid».
5. **«Per kelas»** (when the scope is not a class): its note, then **one disclosure per class** with its badge («Ada angka» info, «Belum ada angka» neutral). The page says «open one class», so this is exploring, not required reading. Inside: the roster count, the class's figures, and «Buka ringkasan kelas ini» (quiet).
6. **«Kesiapan bukti»:** a key/value list of three counts, and its note («not a poor result»).
7. **«Perlu diketahui»:** its line, and link rows («Lihat lebih rinci», «Buka ringkasan sekolah», «Buka ringkasan kelas ini»).
8. **«Catatan pengembangan profesi»:** link rows to `/pengembangan/[simpul]`.

### `/pimpinan/[simpul]` (`simpul`)

- Back «Kembali».
- Eyebrow «Pimpinan»; h1 the place.
- Sections:
  - «Yang didukung bukti» (figures);
  - «Kesiapan bukti»;
  - «Umpan balik kelas», with its line and one link row;
  - «Murid dalam lingkup ini», with its line (which says opening a record is recorded) and one link row;
  - «Lingkup yang Anda pimpin», with link rows to the places beneath.

### `/pimpinan/[simpul]/murid` (`murid`, `murid-kosong`)

- Back to the place.
- h1 «Murid dalam lingkup ini».
- The intro says, **before the list**, that opening a record is recorded.
- One link row per name, in alphabetical order. **Names only:** no figure, flag or count.
- Empty: `pimpinan.murid.kosong`.

### `/pimpinan/[simpul]/murid/[orang]` (`murid-orang`, `murid-orang-belum`)

- Back «Murid dalam lingkup ini».
- Eyebrow «Catatan murid»; h1 the name; under it, «Pembukaan catatan ini sudah tercatat.»
- The facts as a key/value list, each row only when present: Program, Periode akademik, Penempatan sekarang, Penempatan sebelumnya.
- «Catatan belajar»: one row per record, the mode («Pemetaan Awal», «Uji Cepat», «Uji Penguasaan») and «Penguasaan 79%». **No average, comparison or rank.**
- Not yet: the Empty state `pimpinan.rincian.belum`, and its readiness line.

### `/pimpinan/[simpul]/umpan-balik` (`umpan-balik`, `umpan-balik-kosong`)

- Back «Kembali»; the scope line; eyebrow «Umpan balik kelas»; h1 the place; intro.
- **h2 «Putaran untuk kelas ini»** (the built key for a list of rounds), not the eyebrow's words a second time. Each round is a link row: the class, its state badge («Hasil tersedia» info, «Masih dikumpulkan» and «Hasil tidak ditampilkan» neutral), and «Guru: …».
- «Kelas dalam lingkup ini»: link rows, «Buka kelas».

### `/pimpinan/[simpul]/umpan-balik/[siklus]` (`siklus-terbit`, `siklus-ditahan`, `siklus-terbuka`)

- Back; the scope line; eyebrow; h1 the class; intro «Guru: …».
- «Yang dipilih kelas ini»: the state badge, then one of:
  - **Published:** «Tanggapan yang masuk: 26»; the line saying each figure is the number of responses; then each question (h3) with its options as a key/value list. Each option is its words, a drawn bar (`aria-hidden`, its share of the total, `pintar-primary` on `surface-2`) and its count. **The count carries the meaning; the bar is drawn, not read.**
  - **Withheld (suppression):** a well with the statement, `umpanbalik.hasil.belum_cukup_tanggapan`.
  - **Open:** a well with `umpanbalik.hasil.belum_ditutup`.
- «Menutup putaran»: «Tutup putaran ini» (secondary) opens the built confirmation (TutupPutaran), or the line saying collection has ended.
- The closing note `umpanbalik.guru.guna`.
- **No respondent is ever listed.**

### `/pimpinan/[simpul]/umpan-balik/kelas/[kelas]` (`kelas-umpan`)

- Back; the scope line; eyebrow; h1 the class.
- «Putaran untuk kelas ini»: the class's rounds as link rows.
- «Mulai putaran umpan balik»: its line, then one row per teacher, either «Mulai putaran» (secondary, named with the teacher) or the built result line in its place.
- Refused: `umpanbalik.buka.tanpa_wewenang`.

### `/pengembangan/[simpul]` (`pengembangan-penuh`, `pengembangan-terbatas`)

- Back «Kembali».
- Eyebrow «Pengembangan profesi guru · {place}».
- h1 «Catatan pengembangan profesi».
- Intro: `pengembangan.arti` for the full audience, or `pengembangan.arti_terbatas` for Admin sekolah.
- **One section per participant** (h2 the name; the enrolment line). One list row per package: its title (600), then **its columns as a definition list**, in one wrapping line of «label: value» pairs.
- **The columns are exactly what the database returned** (`r.columns`):

| Audience | Columns |
|---|---|
| Facilitator, Kepala departemen over the place, Dekan | Sudah mulai · Pemetaan Awal · Uji Penguasaan · Pelajaran selesai · Hasil · Selesai |
| Admin sekolah | Sudah mulai · Pemetaan Awal · Uji Penguasaan · Selesai (no lessons, no result) |

- No packages: `pengembangan.paket_kosong`. No participants: `pengembangan.kosong`.
- **Never a ranking, an order by result or an aggregate figure:** participants in the order the database returns them. The individual «Hasil» cell stands for the full audience (D-069(b)).

## 2. Layouts

**Widths:** 1280, 820, 390 and 320 px for all 18 specimens (`render-b/`).

| Width | What changes |
|---|---|
| 1280 / 820 | The staff shell. A decision's two fields side by side; figures two or three to a row. |
| 390 / 320 | The App shell's top bar. Fields to one column; figures one to a row; feedback options stack their words over the bar and count; facts stack. |

**A4** (`pimpinan`, `murid-orang` and `pengembangan-penuh`): Part A's page rules apply (margins, the «Halaman n dari m» footer).
- **Never printed:** the shell, the back link, the scope choice, every form, «Keputusan Anda» and the row chevrons.
- **Breaks:** a decision panel and a participant never split across pages.
- The record pages carry no report title, so they have no G6 header line. Their h1 and scope line say whose they are.

## 3. States and roles

| Route | States drawn |
|---|---|
| `/pimpinan` | decisions waiting (with one referred by the reader, and one decided) · none waiting (the suppression line stays) · **refusal**: Admin sekolah, by design («Halaman ini untuk Kepala departemen dan Dekan, dalam lingkup yang mereka pimpin.», «Ke halaman awal») |
| `/pimpinan/[simpul]` | a node's page; one figure withheld (no label) |
| `…/murid` | the roster · empty |
| `…/murid/[orang]` | one learner · not yet |
| `…/umpan-balik` | the rounds · none · refusal («Umpan balik ini bukan milik Anda untuk dibaca.») |
| `…/umpan-balik/[siklus]` | published · withheld · still collecting |
| `…/umpan-balik/kelas/[kelas]` | one class, one round existing and one teacher to ask |
| `/pengembangan/[simpul]` | full audience · Admin sekolah · **refusal**, with the new line in §5 |

**Loading:** the built MemuatHalaman (see Part A and B1).

**Roles:** Kepala departemen and Dekan see the same bodies; what differs is the scope and what the database returns.

## 4. Keyboard and accessibility

- **Tab order:** the skip link, the places, the back link, the scope buttons, then each decision's controls in reading order, then the link rows.
- **A decision panel** is an article named by its family (h3).
- **Teacher rows:** «Mulai putaran · {teacher}» carries the teacher's name.
- **Disclosures:** summaries are 44 px.
- **Badges:** never colour alone (icon and word).
- **Feedback bars** are `aria-hidden`; the count is the text.
- **Checks** (`render-b/laporan.txt`):
  - axe WCAG 2.2 AA in all 72 renders;
  - targets at least 24 px;
  - focus rings;
  - **no empty h1** (the built fallbacks `display_name ?? ""` and `ini?.nama ?? ""` must not reach the page: engineering note §8);
  - no raw key;
  - nothing that reads as a ranking.

## 5. Words (T table)

All other words are the copy table at 0b19707, staff persona.

| Key | Indonesian | English | Kind |
|---|---|---|---|
| `pengembangan.ditolak` | Catatan ini untuk fasilitator, Kepala departemen, Dekan, dan Admin sekolah tempat ini. | This record is for the facilitator, the Head of department, the Dean and the school administrator of this place. | NEW · presentation. Today's refusal passes no line, so it reads the generic `auth.not_yet`. |
| `pengembangan.pelajaran_dari` | {n} dari {m} | {n} of {m} | NEW · presentation, replacing the hard-coded «n/m». **Proposed, pending copy approval.** |

**Reused key:** `umpanbalik.kelas.putaran` «Putaran untuk kelas ini» becomes the h2 of the rounds list, in place of a second «Umpan balik kelas».

## 6. Components and tokens

**Components:**
- the staff shell, Back link, Breadcrumb, Page head, Section;
- List and list rows, Panel, Badge (attention, info, ok, neutral), Disclosure, Select, Textarea, Button (primary, secondary, quiet);
- Well, Empty state, Refusal (HalamanPenolakan);
- Part A's figure layout; key/value lists.

**Tokens only:** `--surface-1/2`, `--ink-1/2`, `--line`, `--line-strong`, `--pintar-primary`, `--space-*`, `--radius-*`, `--measure-*`.

## 7. Navigation and outcomes

| Action | Outcome |
|---|---|
| «Saya yang menangani» / «Catat keputusan» | the built redirect to `/pimpinan?hasil=ok&keputusan={id}` (or `?galat=1`). The result line shows **in that decision's panel**, under its form. |
| A scope button | `/pimpinan?lingkup={id}` |
| «Tutup putaran ini» / «Mulai putaran» | the built confirmation and result lines, then the page refreshes |
| A name in the roster | opens the record, and the opening is recorded. The list's intro says so first. |

## 8. Edge cases, and engineering notes

These are things the build must change for the composition to hold. None is a decision.

- `NilaiLaporan.tsx:78` shows a raw object key as a `dt` when it isn't a `kesiapan.` key. Every label must come from words.
- `NilaiLaporan.tsx:27` hard-codes the educator persona on staff pages.
- The eight-row cut (`:36`) stays. It needs no «more» line, because the Ringkasan carries the full report.
- **Empty headings:**
  - `…/kelas/[kelas]` can render an empty h1 when the class is outside the branch. That page should refuse instead (`umpanbalik.buka.tanpa_wewenang` already exists).
  - `…/murid/[orang]` can also render an empty h1 (`display_name ?? ""`).
- `…/kelas/[kelas]`'s empty line reuses «… dalam lingkup ini» for one class. That stays until a word is approved; no new word is invented here.
- `/pengembangan/[simpul]` draws KakiPintar inside `main` without `pin-noprint`. It moves outside, as on every other route.
- `/pengembangan/[simpul]` picks its shell and back link from role names in the browser code (`:39`). That is engineering's concern, not presentation; noted only.
- **Unknown teacher** («—»): the row reads «Guru: —», as built.
- **Many decisions:** the list grows. Decided cases are compact, with their chain in a disclosure.
- **Many classes** under «Per kelas»: one disclosure each, all closed by default. The specimen opens the first only to show its inside.

## 9. Acceptance checklist (part B)

- [auto] No sideways scroll at 1280, 820, 390 or 320 px, in all 18 specimens.
- [auto] axe WCAG 2.2 AA: no violations, 72 of 72 renders.
- [auto] No empty h1; no raw key; nothing that reads as a ranking.
- [manual] Every badge carries a word (and an icon where it marks a state).
- [auto] A4: the shell, back link and forms do not print.
- [manual] A4: a decision panel and a participant never split across pages.
- [manual] `/pengembangan/[simpul]` draws exactly the columns the contract returns per audience, in the database's order (engineering can make this [auto] against `pengembangan-kontrak.ts`).
- [manual] Side-by-side review of the build beside this composition at each width (brief G:14).
- [manual] The roster's intro is read before the names (screen reader).
- [manual] No aggregate academic figure and no ranking on `/pengembangan/[simpul]`; the individual result shows only for the full audience (D-069(b)).

## 10. The result cell: settled

The escalation raised in the first version of this part is **resolved by D-069(b)** (owner, 4 Nov):
- The facilitator, the Kepala departemen over the relevant place and the Dekan may see each participant's professional-learning result.
- Admin sekolah may see enrolment, participation and completion, but never individual results.
- The brief's «never a figure» was an inaccurate paraphrase, now corrected. The intended restriction is **no aggregate academic figure and no ranking**.

The individual result cell stays as drawn. Its escalation marker is removed, and the specimens are re-rendered.
