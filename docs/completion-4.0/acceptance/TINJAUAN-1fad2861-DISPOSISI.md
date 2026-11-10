# Daisy's rendered recheck at `1fad2861`: dispositions (10 Nov 2026)

**Source:** Daisy, `docs/coordination/ux/completion-4.0/TINJAUAN-1fad2861.md` (branch `ux-1/daisy-experience`, `903e26b9`), with screenshots in `verifikasi-1fad2861/`.

**Scope (owner, 10 Nov):** one bounded correction pass, not another redesign.
- The audit view's layout and navigation.
- The remaining assessment names on the teacher's learner page.
- «Minta membaca lagi» on an ended lesson, checked end to end.
- The small player fixes where straightforward.

Unrelated cosmetic items stay in the register below. Sharon revisits only if authorization, queries or evidence handling change. **They do not:** no migration, no RPC and no read path changes. One teacher read adds a column through an existing relation; see §2.

**Evidence record, corrected:**
- At `1fad2861`, CI [42773407799](https://github.com/yazidmanan2409/pintar40/actions/runs/42773407799) and journeys [42773411702](https://github.com/yazidmanan2409/pintar40/actions/runs/42773411702) are **green**: both completed, success, on that SHA. Daisy's report still calls them pending.
- Daisy's `bcecb425` build ran on next 16.3.5 from a shared `node_modules`, not the pinned 16.4.5. She disclosed this, and it is superseded: her `1fad2861` review used that commit's own `npm ci`.

## 1 · Jejak audit (C1–C3)

| # | Daisy found | Change | Proof |
|---|---|---|---|
| C1 | «Catatan terkait» opened its rows inside the narrow «Alasan» cell: about 240 px wide at 1280 px, about 45 px at 390 and 320 px | The opened rows are a full-width row of their own under the run's row: `tr.pin-jejak-anak-baris`, one cell spanning every column. On a phone the table is wider than the screen and scrolls inside its frame, so the row's contents hold to the frame's visible left edge (`position: sticky`) and wrap within one screen's width. The closed link stays in the run's cell. Reads, counts and sub-pages are unchanged | Rendered: the cell width equals the table width at 1280, 390 and 320 px. Every listed row lies inside the frame's visible box, before and after Tab moves into it, and no row's text overruns its box. JEJAK-A01 and KENAIKAN-A01 restated to read the full-width row; their obligations are unchanged |
| C2 | After opening, sub-page 2 and «Tutup», the run's row sat above the screen (−40 px, −168 px) | The anchor `#jejak-run-…` is on the run's own row, not on a block inside its cell. `scroll-margin-top` keeps it clear of the shell's sticky bar under 1024 px, and gives a gap above | Rendered: on open, sub-page 2 and «Tutup», the row's top is at or below the bar's bottom at every width |
| C3 | At 390 and 320 px every word broke mid-word, from `overflow-wrap: anywhere` on the audit cells | The cells wrap normally (`overflow-wrap: normal`), so a column is never narrower than its longest word. **`break-word` was tried first and still broke «db547244» and «2027/28»:** in a table cell, Chromium counts it toward the column's minimum width, as it does `anywhere`. The parent rows' time column does not wrap. The table scrolls inside its frame again, as at `bcecb425` | Rendered: no word of the trail draws as two boxes at 320, 390 or 1280 px. The page itself never scrolls sideways |

## 2 · The teacher's learner page (B2)

| # | Daisy found | Change | Proof |
|---|---|---|---|
| B2 | «Penilaian di kelas ini» still used the authoring names («Pemetaan awal —», «Cek penguasaan —») | One rule names an instrument on both sections: `namaInstrumen` (`src/lib/pengajar.ts`) gives «‹instrument› · ‹chapter›», as «Hasil resmi» already did | Rendered on the teacher's learner page |
| B2, question | An ended Bab 2 still offered «Minta membaca lagi» | **Followed end to end.** The existing policy already refuses it: `request_lesson_review` raises `REVIEW_ASSIGNMENT_CLOSED` unless the chapter is ACTIVE. `my_lesson_reviews` shows a learner only the requests of a chapter the class is given now. So the button led to a refusal, and an earlier open request would never reach the learner. **Nothing is reopened.** The learner page leaves the link out for an ended or withdrawn chapter. If `/ulang` is reached directly, it states the refusal's own sentence in place of the form, and the requests already made stay listed | M3R-S01 (DB, rolled back): the teacher ends the chapter; a new request is refused with `REVIEW_ASSIGNMENT_CLOSED`; the learner's open request leaves her home. M3R-K01 (source): the learner page's condition, and the `/ulang` page's closed state. The teacher's read of `assessment_assignments` gains `learning_assignments(status)` through its existing foreign key, under the teacher's own row security |

## 3 · The player (small items)

| Daisy found | Change |
|---|---|
| In a sitting the school ended, the disabled look hid which answer was chosen | `.pin-op[aria-pressed="true"]:disabled` keeps the chosen border and weight, in the disabled tone (`--ink-3`, for the 3:1 a boundary needs) |
| «Sudah dijawab: 8 dari 8.» touched the notice's frame | `.pin-pending[data-diakhiri]` gets a top margin |
| «Perlu contoh?» was said twice in the offer | Before a level opens, the offer is its button alone. The stage label appears once a level is open |

## Local validation (working tree after `1fad2861`)

**Audit view, Daisy's cases.**
- Setup: Alpha's admin, on the run JEJAK-A01 leaves in the trail (230 related rows), at 1280, 390 and 320 px, by keyboard.
- Result: **42 of 42 checks green**.
  - Tab reaches «Catatan terkait (230)», and Enter opens it.
  - The run's own row lands below the sticky bar: row top 16 px with no bar at 1280 px; row top 72 px under a 57 px bar at 390 and 320 px.
  - The opened rows span the table and read inside the frame.
  - The next Tab stop is inside the run.
  - Sub-page 2 lists 100 and lands on the run.
  - «Tutup» closes it and lands on the run.
  - No word breaks, and nothing scrolls sideways.
- Two attempts went red before the green run, both kept in the record: `break-word` still broke words (C3); then the opened rows overran the frame on a phone (C1).

**Player.**
- The rendered walk, with the teacher ending the lesson through `akhiri_penugasan` while the sitting is open, is green: the notice takes focus, nothing can be pressed, and Tab and Enter lead back to `/belajar`.
- The notice stands 16 px below «Sudah dijawab».
- The chosen-and-disabled look was rendered against the built stylesheet: 2 px border in `--ink-3`, weight 600. The other answers keep a transparent border.

**Tests.**
- JEJAK-A01, KENAIKAN-A01, KENAIKAN-K02, M3R-S01, M3R-K01, PEMAIN-K01, W3-K01, EFF-K02, D168-K2-1, L4-G01 and R-PROSES-01: green.
- M3R-S01's new step was red once, from a defect in the test itself: it read the chapter's status in the same statement that ended it, and so saw the earlier snapshot. That read now has a statement of its own.

**Not rendered locally: the teacher's learner page (B2).**
- The seeded class with a finished Uji Penguasaan belongs to a demo teacher whose sign-in goes through PINTAR's activation.
- A local password write was refused by the database (`PASSWORD_WRITE_REFUSED`), as it should be, and was not worked around.
- B2 rests on M3R-S01 (database) and M3R-K01 (source) until Daisy's rendered recheck.
- That attempt also ended that class's chapter in local data only; the next reset clears it.

## Addendum: Daisy's recheck at `821d3853` (`TINJAUAN-821d3853.md`)

**Accepted at `821d3853`:**
- the player's small items;
- B2, on its first rendered look;
- C3;
- C1 and C2 at 1280 px.

**Changed, audit table only (owner: presentation only; no shared-table change):**

| # | Daisy found at 390 and 320 px | Change |
|---|---|---|
| C1 | Opening a run left the frame scrolled to its far right (`scrollLeft` 320 or 390), with «Waktu» and «Tindakan» off-screen, still so after «Tutup» | The anchor is the run row's **first cell**, not the row. Landing brings the frame back to its first columns |
| C2 | The table header was drawn over the app bar, and «Waktu» stuck to the left while its column scrolled away, so it labelled «Sasaran» | In the audit table «Waktu» is never held at the left. Below 1024 px the audit header scrolls with the table (`position: static`), as the owner recommended, rather than another offset rule |
| small | The closed «Minta membaca lagi» page still showed the invitation and «target 70%» | The closed sentence replaces both, and reads «… kepada kelas ini» |

**The check that missed it, strengthened (the owner: no new process).**
- The local rendered check measured the vertical landing and page overflow, not the frame's horizontal position or the header. It now asserts, on every landing (open, sub-page 2, «Tutup»):
  - the frame's `scrollLeft` is 0;
  - what is drawn at the app bar's middle is the bar;
  - «Waktu» is not held at the left.
- **Red on `821d3853`:**
  - `scrollLeft` 274 at 390 px and 344 at 320 px;
  - the header drawn over the bar;
  - «Waktu» held left, at every width.
- **Green after the change:** 69 of 69, at 1280, 390 and 320 px, by keyboard, on a 230-row run.
- KENAIKAN-A01 is restated to read n on the first cell, with its obligation unchanged.
- JEJAK-A01, M3R-K01, UX1-S0-TOKEN-01, KOLEKSI-CSS-01, L4-G01, UX1-S0-HLE-01, EFF-K02 and D168-K2-1 are green.

## 4 · Register: kept, not changed in this pass

- Kenaikan step 2's live status line still joins with «·» (`DaftarKeputusan.tsx`).
- The summary can put the main group last («1 keluar, 4 lulus»).
- Struktur's «Tambah Tingkat» field suggests «2026/2027».
- At 320 px the app's top bar breaks the page title mid-word (the shell, older than this range).
- «Cabut sertifikat» still says «Kursus»: the open X12 item.

## Still not seen (tracked, not claimed)

- the integrity count line;
- a certificate's date at a day boundary;
- «Materi tanpa judul»;
- real screen readers, Firefox and WebKit.
