# B2 · Printed-report identification (C6): completion page

**Source:** THE PLAN §5.2 (`claude/bob-41-master-plan`), plus the register B1-R1 to R5 (`B1-ARCHITECT-CHECK.md` §13)
and the print step of §8.5 journey 4. **Reviews:** Sharon before build (on this page) and on the candidate; Daisy before
build (her composition, `DESAIN-AWAL-4.1.md` §1) and on the candidate, in one visit with B1-R1 to R5, B1-R4's notice and
S-1's check at 390 and 320 px.

## What holds now

- **Status: pre-build.** This page is written for Sharon's pre-build review while the corrections are in pre-flight.
  Nothing of B2 is built.
- **Opens** when Sharon has passed both the L-1 fix and the F-1 fix (scheduling note, 12 Nov). F1-R1b, L1-F2 and L1-F4
  do not gate it.
- **B1 already holds the print event:** `catatPermintaanCetak` (`src/app/api/_akuntabilitas/catat.ts`) writes a
  `PRINT_REQUEST`, fails closed, and returns a `CTK-XXXX-XXXX` reference. `akuntabilitas_catat` validates the scope's
  shape and sets the single owning school. The reader finds a print by its reference.
- **Three questions for Sharon** are marked **Q1–Q3** below.

## 1 · What B2 builds

| # | Piece | Where |
|---|---|---|
| 1 | **The print action:** same origin, signed in. It checks that the person may read this report at this scope, then calls `catatPermintaanCetak`, then returns `{ ref, nama, waktu }`, the name and instant being the server's. The instant is in the school's zone | new `src/app/laporan/cetak/actions.ts`; contract in `src/lib/akuntabilitas-kontrak.ts` |
| 2 | **«Cetak laporan»** calls the action, sets the referenced footer, opens the print dialog, and restores the default on `afterprint`. On failure the dialog doesn't open and the result line says so | `src/components/laporan/AksiLaporan.tsx` (today `window.print()`) |
| 3 | **The footer:** the default browser line and the one replacement (§5.2 F, Daisy's composition). Bottom-left of `@page laporan` and `laporan-lebar`; «Halaman n dari m» stays bottom-right | `KepalaCetak.tsx` (or a sibling `KakiCetak`), `src/app/experience.css` |
| 4 | **No print of an empty report:** «Cetak laporan» is not offered when the report has nothing in it | the three report pages |
| 5 | B1-R1 to R5 and B1-R4's notice (§4) | the reader `/konfigurasi/catatan-masuk`, `src/lib/hle.ts` |

**The invariant (§5.2 D):** the footer never shows a reference that has no event. A page printed any other way than
through «Cetak laporan» never shows a reference at all.

## 2 · The pages that print, and each print's scope

| Page | Report kind (`report`) | Scope sent | Readability check in the action |
|---|---|---|---|
| `/edukator/ringkasan?kelas=` | `ringkasan.kelas` | `node_id` = the class | the same read the page makes: `generate_report` for that class, as the caller |
| `/dekan/ringkasan?simpul=` | `ringkasan.simpul` | `node_id` = the node | the same: `generate_report` for that node, as the caller |
| `/belajar/hasil` | `hasil.belajar` | **Q1** | the page reads only the caller's own work (`my_*`) |

- **The action decides readability by the same read the page makes, as the caller.**
  - A forged call naming a class the person cannot read gets the page's own refusal, and writes nothing.
  - The database writer keeps checking shape and owning school, as built.
- **Not changed:**
  - `/pimpinan` has the header and no button, and stays that way (§5.2 C).
  - Certificates (`AksiCetak`) keep their QR, and their print CSS excludes the footer.
  - Class cards (`LembarKartu`).

**Q1 · The learner's own results have no class or assignment scope.** `akuntabilitas_catat` accepts only `node_id`,
`learning_assignment_id` or `assessment_assignment_id`, and `/belajar/hasil` spans every chapter the learner worked on.
- **Engineer's proposal:** B2's migration adds one scope to B1's writer, `person_id`. It is accepted only when it is
  the requester's own person; anything else is `ACCOUNTABILITY_RESOURCE_INVALID`.
- **The owning school** is the requester's single live school at that instant (`akuntabilitas_sekolah_orang`). With
  none or several, the print is refused as "cannot be recorded" and nothing prints. A learner with no school or two
  schools is rare; the refusal is honest, not a guess.
- **The alternative,** the learner's current class `node_id`, names a class the report is not about, so I don't
  propose it.

## 3 · The footer, as built from §5.2 F

- **Official print:** «Dicetak oleh {nama} · {tanggal, jam, zona} · Ref. CTK-XXXX-XXXX». One line, 7.5–8 pt,
  `--ink-2`, bottom-left, on every page, portrait and wide.
- **Default (any print not made through the button):** «Dicetak dari browser oleh {nama} · {waktu} · tanpa nomor
  referensi». If the name and time cannot be filled reliably: «Dicetak dari browser · tanpa nomor referensi». It
  contains no reference-shaped text.
  - **Q2 · Where the default's name and time come from.** I propose the name from what the page already rendered for
    the viewer, and the time from the browser at `beforeprint`. They claim no audit (§5.2 D3). If the page has no
    viewer name, the short line. Confirm this counts as "reliably".
- **Swap:** only after the action returns a reference, and before the dialog opens. `afterprint` restores the default.
  A refused or failed request never swaps.
- **Failure:** «Cetakan belum dapat dicatat, jadi belum dicetak. Coba lagi.» in the existing result line (`BarisHasil`,
  a status region).
- **Every press is one event and one reference.** Printing twice gives two references; that is intended (§5.2 D6).
- **Long names:** the name and time stay whole; the reference wraps.

## 4 · The register taken with B2

| # | Finding | B2's change | Wording |
|---|---|---|---|
| B1-R1 | The reader's refusal says «Admin platform» | `akuntabilitas.ditolak` re-worded | Daisy's |
| B1-R2 | «Seluruh platform» doesn't name each row's school | In the platform view only, each row names its school(s) from `institution_ids`. A school admin's view is unchanged: it holds only their own school | Daisy's (column or line) |
| B1-R3 | The Konfigurasi index doesn't list the reader (optional) | One entry beside «Jejak audit», if it is one entry | Daisy's |
| B1-R4 | A failed write leaves a gap no reader shows (owner: before Z) | **The completeness notice**, below | Daisy's |
| B1-R5 | Two «Hapus saringan» in the no-match and purged-reference states | The empty state's own action is dropped, as in the other Konfigurasi no-match state | — |

**B1-R4, the completeness notice:**
- **Who sees it:** the platform admin only.
- **What it reads:** the health read's own count, `pintar_periksa_kesehatan() -> 'gagal_tulis_akuntabilitas'`: the
  write failures of the last 7 days and the last one's instant. Those counts carry no school, so the notice names none.
- **When:** shown when the count is above 0. Qualified: "this list may be incomplete", never a number of missing rows
  presented as exact.
- **Link:** to Konfigurasi's health check (`/konfigurasi?periksa=skema`).
- **A school admin never sees it**, and so learns nothing of another school.
- **Q3:** the health read is the platform admin's already. Confirm that the reader calling it in the platform view is
  in scope, rather than a narrower reader of the one count.

## 5 · Journey 4's print step (§8.5)

**"A failed sign-in, a sign-in, a printed report whose reference an admin looks up."** B1J covers the first two. B2
adds the print step to `audit/journey.mjs`:
1. A teacher opens their class's Ringkasan and presses «Cetak laporan».
2. The printed document (the page's print rendering) carries «Ref. CTK-…».
3. The school admin types that reference into the reader and finds the one `PRINT_REQUEST`, with the teacher, the
   report and the class.
4. A browser print of the same page carries the default line and no reference.

## 6 · Tests (red first, on the commit B2 opens on)

| Id (planned) | What | Red today |
|---|---|---|
| B2-A01 | A press writes one `PRINT_REQUEST`. The printed document carries that reference, the server's name and the instant in the school's zone (PDF through the running app) | no event, no footer |
| B2-A02 | A failed action (the writer made to fail) prints nothing and shows the failure line; no event | the dialog opens |
| B2-A03 | A forged scope (a class the person can't read) is refused, and no row is written | not reachable today |
| B2-A04 | A browser print shows the default line and no reference-shaped text | page numbers only |
| B2-A05 | An empty report offers no «Cetak laporan» | `/belajar/hasil` offers it empty |
| B2-S01 | Static: every page rendering `AksiLaporan` goes through the action; nothing else calls `window.print()` on a report; the certificate print is untouched | — |
| B2-S02 | B1-R1, R2, R5 and the R4 notice (platform admin only; a school admin never sees it), through the running app | — |
| Journey 4 | The print step (§5) | — |
| Plants | (a) the action returns a reference without writing the event; (b) the footer swaps before the reference returns. Each turns its test red | — |

**Committing tests leave no event row** (P3), proved at the end of each.

## 7 · Pre-flight starting list (§4.1 P1)

- **Changed:**
  - `AksiLaporan` and `KepalaCetak` (or `KakiCetak`);
  - the print CSS;
  - the three report pages;
  - the reader `/konfigurasi/catatan-masuk` and its copy;
  - if Q1 is accepted, `akuntabilitas_catat` (one migration).
- **Expect to re-run:**
  - every report suite that renders those components;
  - DAISY's print checks;
  - B1's reader tests (B1-S05 to S07, B1-A04, B1-L01);
  - the certificate print tests, which must be unchanged;
  - S-1's drawer check, since the reader is a Konfigurasi page.

## 8 · Next state of each consequential action (SYSTEM-INTEGRITY-4.1 §3a)

| Action | Kind | Work in progress | Completed work and history | People and institutions affected | Reversed or repeated | Permission, explanation, confirmation, audit |
|---|---|---|---|---|---|---|
| «Cetak laporan» (an official print) | Not reversible: a record of a request | None: printing changes no figure (§5.2 E) | One `PRINT_REQUEST` row, insert-only, kept 12 months, then purged with the rest (O41-13). A paper older than that still shows who and when; its reference no longer resolves (register N-3) | The requester (named on the paper); the report's school (reads the row) | Each press is its own event and reference; nothing is undone | Only someone who may read the report; the paper says who printed it; the school admin reads it in the reader |

## 9 · The four questions

| Question | Answer to verify |
|---|---|
| And then what? | The paper leaves the building carrying who, when and a reference. An admin types the reference and finds the event. After 12 months the reference no longer resolves, and the paper still says who and when |
| What else did that change? | The three report pages; the print CSS shared with certificates (excluded); B1's writer if Q1 is accepted; the reader's wording and its platform view; journey 4 |
| What happens when things go wrong? | The writer fails: nothing prints (fail closed). The dialog is cancelled: the event stands (a request, not a printout; §5.2 B, "any claim that paper came out of a printer" is out). A browser print: the default line, no reference |
| Can it be reversed, and what survives? | Nothing is reversed. The row survives 12 months; the paper survives indefinitely |

## 10 · Cross-module inventory (SYSTEM-INTEGRITY-4.1 §2), planned

| Interface | Checked how | Evidence | Limitation |
|---|---|---|---|
| B1's writer and reader | A press, then a lookup by reference; a forged scope; a failed write | B2-A01 to A03, journey 4 | — |
| The three report pages and `/pimpinan` | Static and rendered | B2-S01, B2-A04, B2-A05 | — |
| Certificates' print | Unchanged, by test | the certificate print tests | — |
| The reader's platform and school views (R1 to R5, R4's notice) | Through the running app, as both | B2-S02 | — |
| Retention (O41-13) | A purged reference's state is B1's, unchanged | B1-L01 | — |
| The phone drawer (S-1) on the reader | 390 and 320 px | Daisy's visit | — |
