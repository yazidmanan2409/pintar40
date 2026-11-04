# A1 · W1.2: the question review («Soal dalam paket ini»)

**Form C (composition).** Register entry A1 (DG-25, RV-21 layout, CR-88 «Question review», F-12(1), J4.4).
**Surface:** `/studio/paket/[course]`, the section «Soal dalam paket ini». As built at 0b19707: `src/app/studio/paket/[course]/page.tsx:273-307`.
**Roles:** Kepala departemen, Admin sekolah and Guru (CAN_DRAFT). All three see the same section.
**Decisions needed:** none. No O# or G# applies. Per-question approvals stay out of scope (D-142).

The rule this composition serves is D-088(h): before «Setujui isi», the reviewer reads every question, its key, and every option's reason. Everything below follows from that rule. **Nothing in the open lesson is hidden**; the other lessons are behind the pager. Whether «Setujui isi» should require every lesson to be opened is an owner question, not part of this composition.

**Files in this folder:**
- `buat-a1.mts`: the specimen and its checks. Run it from the repository root with `npx tsx docs/coordination/ux/completion-4.0/A1/buat-a1.mts`.
- `a1.css`: the composition's layout. It uses only design-system tokens and components.
- `render/<state>-<width>.png` and `render/laporan.txt`: the renders and the check report.
- `jalan/<state>-<1280|320>.txt`: the Tab order and the accessibility tree.
- `<state>.html`: each specimen.

---

## 1. The composition

**The section, top to bottom:**
1. **The heading** «Soal dalam paket ini» (h2, the page's section level). Under it, `studio.soal.arti`, as built.
2. **The summary line**, for example «18 soal dalam 4 pelajaran».
3. **The lesson jump:** a labelled Select «Pelajaran», listing every lesson as «title (n soal)», and the button «Buka».
4. **One whole lesson.** Its title is an h3 with tabindex -1, so focus can be moved there after a jump, and its question count. Then every question in that lesson, in package order (module, then lesson, then question: `susunSoal`).
5. **Each question** is a card (`li.pin-soal` > `article`), holding:
   - the meta line «Soal 7 dari 18 · Uji Penguasaan · Sedang»;
   - the reading passage «Bacaan», where the question has one, above the stem;
   - the stem (h4, `t-stem-compact`);
   - the options, as an ordered list.
6. **Each option** is a row (`li.pin-opsi`), holding:
   - a letter column;
   - the option text;
   - on the key only, the badge «✓ Kunci»;
   - always, «Alasan: …»;
   - where the option names one, «Miskonsepsi: …».
7. **The pager** after the lesson: «Pelajaran 3 dari 4», with «Pelajaran sebelumnya» and «Pelajaran berikutnya».

**The section's place on the page** is unchanged. It comes after the package's state, findings and preview, and before «Langkah menuju terbit». So «Setujui isi» is reached only after the questions (J1).

### The commission's six decisions

| # | Decision | Answer |
|---|---|---|
| 1 | **Reading order and navigation** | Package order. One whole lesson is on screen at a time. **Numbering is package-wide**: «Soal 7 dari 18» counts across the package, not within the lesson, so the number a reviewer quotes is unambiguous. The pager moves one lesson at a time; the Select jumps to any lesson. |
| 2 | **The key without colour alone** (WCAG 1.4.1) | **Three signals.** The badge has an icon and the word «Kunci». The row has a 3 px primary left edge and the primary-soft ground. The letter disc is filled. Without colour, the word and the icon remain. A screen reader hears «A. 2/4 Kunci». |
| 3 | **Reasons and misconceptions** | Inside each option, under its text, **always shown**. «Alasan» comes first, then «Miskonsepsi» where the option carries a code, shown by its label from the package's misconception sheet. The reason belongs to its option, so it sits with it; nothing is set off in a separate column that 320 px would lose. |
| 4 | **The disclosure** | **Replaced.** The Disclosure README says a disclosure is «never to hide something the person must see», and D-088(h) says the reviewer must see every question. Closed lessons therefore break the rule. The replacement is **one lesson per view plus the pager and the jump**, which keeps the page short at any package size. **Default:** the first lesson. |
| 5 | **Use and difficulty** | On the **meta line, as text**, not as badges. Use is the mode word (Pemetaan Awal, Uji Penguasaan) or the bank word (Latihan). Difficulty is the workbook's band word (Mudah, Sedang, Sulit), shown only when the item carries a predicted difficulty. Badges are kept for the one thing that must stand out: the key. |
| 6 | **320 px with five long options** | See `render/panjang-320.png`. The options stay one per row. The letter column narrows to 24 px. The badge drops under the text when it doesn't fit. Text wraps with `overflow-wrap: anywhere`. There is no sideways scroll and no truncation. |

**Scale.** 2,000 questions in 500 lessons (`render/besar-*.png`) renders exactly like four lessons. One lesson is on screen, and the Select lists all 500. The page's length is set by the largest lesson, never by the package.

## 2. Layouts

**Widths:** 1280, 820, 390 and 320 px, for six states (`render/`). There is no print: Studio does not print.

| Width | What changes |
|---|---|
| 1280 / 820 | The full shell. Option rows: 28 px letter column, 12 px gap. |
| 390 / 320 | The App shell's top bar. The card padding drops to 16 px, the letter column to 24 px. The pager hides its button words: the buttons keep their names through `aria-label`. The Kunci badge wraps under the option text. |

## 3. States and roles

| State | Render | What shows |
|---|---|---|
| `penuh` | lesson 1 of 4 | The first view. «Pelajaran sebelumnya» is disabled. |
| `tengah` | lesson 3 of 4 | Mid-package: both pager directions live, numbering continuing from 10. |
| `besar` | lesson 237 of 500, questions 945–948 of 2,000 | Scale. |
| `panjang` | lesson 6 of 6, one question with five long options | The 320 px case. «Pelajaran berikutnya» is disabled. |
| `kosong` | no questions | `studio.soal.kosong` «Paket ini belum berisi soal.» in an Empty state. No jump and no pager. |
| `gagal` | the questions cannot be read | A blocked Result, with `role="alert"` and the new `studio.soal.gagal`. |

**Roles:** Kepala departemen, Admin sekolah and Guru see the same section. Learners never reach it: the route is Studio's. This is what `studio.soal.arti` already says.

## 4. Keyboard and accessibility

The walks are in `jalan/`.

**Tab order:** skip link, the shell's places, the back link «Studio», the Select «Pelajaran», «Buka», then the pager's live links. Questions and options hold no controls, so reading them is by arrow keys or a screen reader's heading and list navigation. **The reviewer never tabs through 2,000 stops.**

**Jumping:** «Buka» (or the pager) loads the lesson and moves focus to the lesson's h3 (tabindex -1, with a visible ring). The jump is a button, not on-change: WCAG 3.2.2.

**The tree:**
- region «Soal dalam paket ini» > h2;
- per lesson, a group named by its h3;
- per question, an article named by its stem (h4);
- per question, a list named «Soal i dari n»;
- per option, a list item: «A. 2/4 Kunci», then «Alasan: …», then «Miskonsepsi: …».

The letter column is `aria-hidden`. The letter is read from a screen-reader-only prefix, so it is heard once.

**Checks** (`render/laporan.txt`): axe WCAG 2.2 AA passes in all 24 renders. Every target is at least 24 px. Every focus has a ring.

## 5. Words (T table)

**Existing keys at 0b19707, kept exactly:**
- `studio.soal.judul`, `studio.soal.arti`, `studio.soal.jumlah`, `studio.soal.kunci`, `studio.soal.alasan`, `studio.soal.kosong`;
- `jenis.mode.PRE_TEST` «Pemetaan Awal», `jenis.mode.POST_TEST` «Uji Penguasaan», `jenis.bank.PRACTICE` «Latihan».

**New keys (presentation; none is a protected term):**

| Key | Indonesian | English | Kind |
|---|---|---|---|
| `studio.soal.ringkas` | {soal} soal dalam {pelajaran} pelajaran | {soal} questions in {pelajaran} lessons | presentation |
| `studio.soal.pelajaran_label` | Pelajaran | Lesson | presentation |
| `studio.soal.pelajaran_dari` | Pelajaran {i} dari {n} | Lesson {i} of {n} | presentation |
| `studio.soal.posisi` | Soal {i} dari {n} | Question {i} of {n} | presentation |
| `studio.soal.buka` | Buka | Open | presentation |
| `studio.soal.kesulitan.MUDAH` / `SEDANG` / `SULIT` | Mudah / Sedang / Sulit | Easy / Medium / Hard | presentation: the workbook's own band words (KESULITAN) |
| `studio.soal.miskonsepsi` | Miskonsepsi | Misconception | presentation: the workbook's sheet name |
| `studio.soal.bacaan` | Bacaan | Reading passage | presentation: the workbook's stimulus column title |
| `studio.soal.gagal` | PINTAR belum bisa membuka soal paket ini. Muat ulang halaman ini; jika tetap gagal, hubungi admin sekolah Anda. | PINTAR couldn't open this package's questions. Reload this page; if it still fails, contact your school's administrator. | presentation |

No frozen term is touched. «Peserta», «Kenaikan» and «Penguasaan per bagian» do not appear here.

**D-172 K6 (corrected):** the pager's moves are Pagination's own «Sebelumnya» / «Berikutnya» (`koleksi.sebelumnya`, `koleksi.berikutnya`); the position line «Pelajaran 3 dari 4» keeps the unit. The two lesson-specific keys are withdrawn.

## 6. Components and tokens

**Components:** App shell, Page head with Back link, Section, Select with Label, secondary Button, Badge `ok`, Pagination (`pds-pager`, `pds-pager-posisi`, `pds-btn-teks`, `data-sebelum`, `data-sesudah`), Empty state, Result `blocked`, Icons (check, chevron-down, chevron-left, chevron-right, circle-alert).

**Type:**
- the lesson title: `t-subsection`;
- the stem: `t-stem-compact`;
- the option text: 16/24;
- the reason, the misconception and the meta line: 14/20;
- the passage: 16/26.

**Tokens only:** `--pintar-primary`, `--pintar-primary-soft`, `--pintar-primary-ink`, `--surface-1/2`, `--ink-1/2/3`, `--line`, `--line-strong`, `--line-control`, `--focus-ring`, `--space-*`, `--radius-md/lg/pill`, `--measure-prose/narrow`. **No new token and no palette change.**

**The wordmark** is the provisional placeholder: a box at the slot's size, labelled «Pintar (master pending F-11)».

## 7. Navigation and outcomes

| Action | Outcome |
|---|---|
| Choose a lesson, then «Buka» | That lesson replaces the current one; focus moves to its h3. |
| «Pelajaran sebelumnya» / «Pelajaran berikutnya» | The same, one step. At either end the control is shown disabled (`aria-disabled`), not removed, so the pager doesn't shift. |
| Back «Studio» | Studio's list, as built. |

**No outcome is implied.** Reading the questions changes nothing. «Setujui isi» stays in «Langkah menuju terbit», below. There is no per-question approval (D-142).

**Engineering note** (not a decision): the URL can carry the lesson (for example `?pelajaran=3#soal`), so a reviewer can share a link to a lesson and reload in place.

## 8. Edge cases

- **No questions:** the Empty state.
- **The questions cannot be read:** the blocked Result. No partial list is shown, because a partial list could be mistaken for the whole.
- **A lesson with no questions** (possible in `besar`): the Select still lists it with «(0 soal)». Opening it shows its title and the existing empty line `studio.soal.kosong`.
- **No difficulty:** the band word is omitted from the meta line (the specimen's lesson 4 carries none). Nothing is implied.
- **No use** (`peran` null): the bank word, «Latihan».
- **No misconception:** the line is omitted.
- **No reason:** can't occur. The workbook contract makes «Alasan» mandatory for every option (`unggah-kontrak.ts:114`). The check still counts one reason per option.
- **More than one key, or none:** the upload contract decides this, not this section. The section marks every option flagged `kunci`, and only those.
- **Long text:** stems up to 4,000 characters, passages up to 20,000, options and reasons up to 2,000 each (`unggah-kontrak.ts:167`). All wrap; none is clipped. A 20,000-character passage is long but readable, and still sits above its own stem.
- **Five options at 320 px:** `panjang-320`.

**Engineering notes** (not decisions):
- The loader (`soal-tinjauan.ts` `susunSoal`) does not yet read `items.predicted_difficulty`, banded by `pitaKesulitan`, or `item_options.misconception_code`, with its label.
- The walks' selectors are kept: `#soal li.pin-soal`, `.pin-opsi`, `.pin-opsi-kunci`.

## 9. Acceptance checklist

- [auto] Every question in the open lesson is rendered (`#soal li.pin-soal`). None is inside a `details` element.
- [auto] Exactly one «Kunci» badge per key, and keys = questions in the specimen. Every key row carries the word «Kunci», not colour alone.
- [auto] Every option has its «Alasan» (`.pin-opsi .a1-alasan` = `.pin-opsi`).
- [auto] No sideways scroll at 1280, 820, 390 or 320 px, in all six states.
- [auto] Every target is at least 24 × 24 px.
- [auto] axe WCAG 2.2 AA: no violations, 24 of 24 renders.
- [auto] Every Tab stop shows a focus ring. Questions and options add no Tab stops.
- [auto] Numbering is package-wide (the first meta line of each state is checked): lesson 3 starts at «Soal 10 dari 18»; lesson 237 starts at «Soal 945 dari 2.000».
- [auto] The pager names its buttons at 320 px, where their words are hidden (`aria-label`).
- [manual] Side-by-side review of the build beside this composition at each width, recorded as match or deviation per region (brief G:14).
- [manual] With a screen reader: each option is heard as letter, text, «Kunci» where it applies, then its reason. The letter is heard once.
- [manual] «Buka» and the pager move focus to the lesson heading.
- [manual] At 200 % zoom (W6.12), the 320 px layout holds.
- [manual] «Setujui isi» is still reached only after the section (J1).
- [auto] **D-172:** equivalent interactions match their canonical pattern (`../X-KONSISTENSI/`): P1, P9 (with exception X2), P13, P15, P17 (no disclosure around required reading), P20; K6 applies.
