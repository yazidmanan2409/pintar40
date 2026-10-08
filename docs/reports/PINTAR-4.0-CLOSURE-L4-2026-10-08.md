# PINTAR 4.0 · L4 report: the Human Interface Boundary (CR-85) and shared components (CR-88, engineering part)

**8 October 2026. For the owner and the Second Eye.** L4 is the last of D-128's four engineering streams (L1 → L2 → L3 → **L4**), started on the owner's go after D-133. **This report is a stop.** It claims no GREEN; the verdict is the Second Eye's. No production change.

Scope, from D-127 and its investigation (`PINTAR-4.0-DG-19-37-INVESTIGATION-2026-10-07.md`, §B RC-4 and RC-6, §E):
- **CR-85:** the Human Interface Boundary as a closure invariant (D-127 Q5). No ordinary workflow shows a person a database ID, a UUID fragment, an enum, JSON, a raw key or an unexplained machine value. An extended guard is written first, red then green, and the fixes go through shared components.
- **CR-88, engineering part:**
  - bounded lists with an explicit edit;
  - the Studio preview rendered through the learner player's own components;
  - the example workbook as a separate download (Q9).
- **Constraint (D-128(g)):** no word is invented and no *Replace* term is applied. Where a fix needs words that do not exist, it is listed for Dr Gladys (§4), not written.

EVIDENCE_TABLE

## 1. What was fixed, item by item (investigation §E)

| # | Was | Now | How |
|---|---|---|---|
| 1 | Aturan Penilaian's bank as `PRACTICE / TEST / EXAM` | «Latihan / Penilaian / Ujian» | `enumLabel("bank")`, the words Bank Soal already uses |
| 3 | The difficulty mix typed as JSON (`{"MUDAH":3,"SEDANG":2}`) | One number per band, labelled «Mudah», «Sedang», «Sulit» | The band words already in the copy (`mengajar.cepat.tingkat.*`). The action builds the mix; the server's check is unchanged |
| 4, 9, 10, 11, 18, 19 | — | Already fixed or gone in L2 (passing-rule JSON gone; Pustaka PINTAR by names; layout picker gone; JSON import operator-only) | Confirmed in the code, 8 Oct |
| 8 | An integrity sitting as «4d2050fd · 1» | The learner's name · class · assessment | Read under the reviewer's own row security (`assessment_sessions_select` admits CAN_REVIEW_INTEGRITY). A sitting the read cannot name shows «—» |
| 13 | Report templates: metric ids and title keys as text | The metric's own label (`metrik.*.label`, from the catalogue's `label_key`), the id secondary; the title in its words | `label_key` was already fetched and unused |
| 15 | An 8-character ID when a name lookup failed (Konfigurasi, Studio's home) | «—»; the other school of a transfer is now read by name | FD-4's embedded names cover the rest |
| 16 | «Perkiraan penyusun: 0.3» | «Perkiraan penyusun: Mudah» | `pitaKesulitan`, the database's own band rule (`difficulty_band`, FD-5): at most 0.4 Mudah, at least 0.7 Sulit, otherwise Sedang |
| 20 | Open questions drawn with `JSON.stringify` | The question's words, or nothing | — |
| 21 | `[[visual:…]]` printed in the preview | Drawn, as the learner sees it | §2 |
| 22 | The build shown to Admin sekolah in issue triage | The platform operator's triage only, the kept exception exactly as the investigation recorded it | `platformIni` |
| — | Learning-objective codes first in the preview | The objective's words first, its code secondary | — |

## 2. CR-88: the shared components (engineering part)

- **One lesson renderer, two places.** `src/components/pelajaran/Halaman.tsx` now holds:
  - the page split at `## `;
  - the diagram drawing;
  - one page's rendering;
  - a worked example's steps.

  The learner's player and Studio's preview both import it, and neither keeps its own. The preview now shows:
  - every page, as its own card, with «Halaman n/N»;
  - the diagrams, drawn;
  - every worked example with all its steps.

  Before, it was one flattened card with the directives printed.
- **Bounded lists.** `src/components/koleksi/Penomoran.tsx`: a staff list shows 20 rows a page, moved with «Kembali» and «Berikutnya». These are words the copy already has, from `pretest.back` and `pretest.next`. Applied to:
  - Aturan Penilaian (read a page at a time);
  - Konfigurasi's transfers;
  - Jejak audit (a page at a time instead of a fixed newest 50).
- **Explicit edit.** A rule's edit form opens by «Ubah», one row at a time. A refused save shows the forms again, so what was typed comes back (CR-84 (3) kept).
- **The example workbook (Q9).**
  - **The file:** `public/contoh/contoh-buku-kerja-pintar.xlsx` is PINTAR's own SD 5 Matematika Bab 1. Its only change is a course title that begins «Contoh — ».
  - **How it is built:** from its source by `npm run contoh:buku-kerja`.
  - **How it is offered:** as a separate download («Contoh») beside the blank template.
  - **Importing it:** the importer's own reader and converter accept it, and it has no special case.

## 3. The guard and the tests

| Test | What it proves | Red on the code before L4 | Now |
|---|---|---|---|
| **L4-G01** (new guard) | Over every page in `src/app`: no ID fragment as a name, no UPPER_CASE literal list drawn as text, no JSON drawn or asked for, no raw key column drawn. What still matches is in its register, with a reason; a register entry that matches nothing fails. Each rule is shown catching a planted leak and passing a non-render | **FAIL**: items 1, 3, 8, 15, 16, 20, the template titles and the metric ids | PASS |
| **L4-C01** | The example workbook: built from its source byte for byte, accepted by the importer, marked, offered separately, no special case | **FAIL** (no example) | PASS |
| **L4-P01** | The player and the preview draw through one renderer. Rendered, PINTAR's SD 5 lesson pages at its headings, the player's page is the shared page byte for byte, and a diagram is drawn, never printed | **FAIL** | PASS |
| **L4-K01** | The screens from their source plus the shared rules executed: the mix per band, the bank's words, the band rule, the sitting's names, the paging rule, the transfers and trail paged | **FAIL** | PASS |

**Restated, not weakened:**
- **DAISY-30-TEKS-01:** the renderer moved into the shared module, and the preview is now held to drawing diagrams too.
- **PENUTUPAN-F01:** a rule's form still appears only while its chapter is a draft, and now also only after «Ubah».
- **EFF-K02:** the trail still names the administrator's schools; it is read a page at a time.

## 4. Waiting for words: Dr Gladys's list (D-128(g))

Each item stays as it is until its words exist. L4-G01's register holds the ones it can see, so none is forgotten.

| Where | What needs words | Who sees it |
|---|---|---|
| Aturan Penilaian | What is shuffled: `NONE / ITEMS / ITEMS_AND_OPTIONS` (§E 2) | Admin sekolah, Admin platform (not teacher UI, Q8) |
| Aturan Penilaian | The limits line «3–20 · 300s · 1×»: words for the units (questions, the seconds of late-sync grace, attempts) (§E 5) | Same |
| Aturan Penilaian | Six inputs labelled by placeholder only: «nama aturan», «jumlah soal», «minimum keselamatan», «jendela ragu (detik)», «tenggang kirim (detik)», «batas percobaan», and the two boxes «jeda» and «luring» (§E 6) | Same |
| Every Studio mode label | «Penilaian awal / akhir / cepat» are Terminology v1 *Replace* terms; their replacements are not applied (§E 7, D-128(g)) | Studio |
| Konfigurasi · Jejak audit (DG-11) | 112 action codes in three naming styles; a name for each audited table; then the row's reference and build become secondary | Admin sekolah, Admin platform |
| Konfigurasi · report templates | A word for each visualization and each standard report; the template title is still typed as a key (§E 13) | Admins |
| Konfigurasi · transfers | The destination asked for as typed codes (CR-41 / W-7, §E 14); needs a ruling and words for the school, period and programme pickers | Admins |
| Bank Soal | The measured difficulty and its evidence count (§E 17) | CAN_REVIEW_QUESTION_HEALTH |
| «Soal dalam paket ini» | Each option's misconception is stored but not shown; a staff word for one misconception is needed (the copy has only the plural «Pemahaman keliru yang berulang») | Studio staff |

**For Daisy (her components):**
- the Collection's look, with search;
- the Question review's layout: `pin-soal-pelajaran` still has no style, and `pin-soal` / `pin-opsi` borrow the player's;
- the File field;
- the enrolment picker on Konfigurasi, a long select with no search.

## 5. What did not change

- **Database:** no migration.
- **Authorization:** unchanged. Every new read goes through the reader's own row security.
- **Production:** untouched.
- **Kept on purpose:**
  - the reference code on a failure (D-011);
  - the PINTAR ID as a secondary identifier;
  - the build in the operator's triage.
- **Gates:** none weakened. S23q (CR-52, D-123) stays the one governed FAIL.

ALLOWANCE_LINE
