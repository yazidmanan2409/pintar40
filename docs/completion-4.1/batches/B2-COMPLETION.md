# B2 · Printed-report identification (C6): completion page

**Source:** THE PLAN §5.2 (`claude/bob-41-master-plan`), plus the register B1-R1 to R5 (`B1-ARCHITECT-CHECK.md` §13)
and the print step of §8.5 journey 4. **Reviews:** Sharon before build (on this page) and on the candidate; Daisy before
build (her composition, `DESAIN-AWAL-4.1.md` §1) and on the candidate, in one visit with B1-R1 to R5, B1-R4's notice and
S-1's check at 390 and 320 px.

## For Sharon and for Daisy: the result review (this is the prompt)

**Candidate:** the B2 commit that carries this section on `claude/system-integrity-4.0`. It is one commit above the
page commit `9b3ea8d9cd13c5da1a8b7992701d9fe43f85e031`, which is above F1-R1b `97a40ebb0e52a2f0ba558418426f9fc5d71aca4b`.
Its 40-character hash is in the review queue (TEAM-INSTRUCTIONS.md). Evidence: §12.

**Sharon, please verify:**
1. **Your five changes**, each where it stands:
   - the requester from `auth.getUser()` (B2-A01, B2-P05);
   - the restore on return and on `afterprint` (B2-S01, journey B2J);
   - one read and the sittings' own schools (B2-P06, B2-D01);
   - the default line naming no one (B2-A04);
   - the narrow count (B2-S03).
2. **Your B2-P02 world as built:** Alpha's own people write and give the chapter; the product's transfer; `{Alpha}`
   while live `{Beta}`; plant b2-1.
3. **The column table** in §11.
4. **Two build decisions:** «Cetak laporan» offered whenever the report has entries; the learner's print dated on its
   one school's clock, else WIB.

PASS or BLOCKED, on the candidate.

**Daisy, please verify, in one visit:**
- the footer on paper (journey B2J's PDF, `b2-ringkasan-cetak.pdf`): the official line and the browser line;
- the failure line, and the one draft, `laporan.cetak.ditolak`;
- the reader: B1-R1 to R5 and the notice;
- the Konfigurasi index entry;
- `/belajar/hasil` with nothing finished;
- S-1 at 390 and 320 px, and at the desktop sidebar.

**Not a gate, but please check:** a learner's print dated on their one school's clock (Bob's point).

## What holds now

- **Status: BUILT, awaiting Sharon's and Daisy's result reviews** ("As built", §11). Opened for build by
  `B2-ARCHITECT-NOTES.md` §0 item 1 at `24e3830d62ff3a7852b3aa76ca1b5053baad934d`.
  Sharon passed the F-1 fix, the L-1 fix and this page, the last with **five changes, carried below where each
  stands** (§3 of her review; she checks them at the result review).
  - ~~Pre-build: written for Sharon's pre-build review; opens when she has passed the L-1 and F-1 fixes~~ (superseded
    by the opening above).
- **Daisy's wording is in** (`B2-ARCHITECT-NOTES.md` §4 at `7d31ffda64b8252f6ebcf6bd7ba6d6651c26440e`; her record
  `B2-MASUKAN.md` at `7c35b666`): the default print line, B1-R1 to R5 and the completeness notice. Final unless she
  changes it at her visit.
- **One deviation from THE PLAN §5.2 F, recorded in §3:** the default browser line names no person (Sharon's ruling,
  Daisy's wording). THE PLAN is not edited.
- **B1 already holds the print event:** `catatPermintaanCetak` (`src/app/api/_akuntabilitas/catat.ts`) writes a
  `PRINT_REQUEST`, fails closed, and returns a `CTK-XXXX-XXXX` reference. `akuntabilitas_catat` validates the scope's
  shape and sets the single owning school. The reader finds a print by its reference.
- **Q1 is decided by the owner** (`B2-ARCHITECT-NOTES.md` §0 item 3 and §1 at
  `03a5862d41c70b22573be64839d9ad6f2d3d7ded`): the content rule, with the existing visibility and authorization
  boundaries kept, and no historical evidence attributed to a new school by a transfer. First ruled at
  `2dd28e3ca5b4dcb867e51df17dd8a2213b55a8aa`: a learner's own-results print is **person-scoped**, and its school
  snapshot is the schools whose evidence the printed report contains. It is computed in the database from the report's
  own scope. It is never refused for several schools. The engineer's proposal of one live school is superseded (§2,
  where it stands). The content rule is the owner's to change knowingly; it is the working assumption.
- **Q2 and Q3 are answered by Sharon** (her changes 5 and 6, below). ~~Two questions remain for Sharon~~ (superseded).

## 1 · What B2 builds

| # | Piece | Where |
|---|---|---|
| 1 | **The print action:** same origin, signed in. It checks that the person may read this report at this scope, then calls `catatPermintaanCetak`, then returns `{ ref, nama, waktu }`, the name and instant being the server's. The instant is in the school's zone. **The requester is the verified session's user on the server (`auth.getUser()`), never a value from the request** (Sharon's change 1): "own prints only" is only as strong as where that id comes from | new `src/app/laporan/cetak/actions.ts`; contract in `src/lib/akuntabilitas-kontrak.ts` |
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
| `/belajar/hasil` | `hasil.belajar` | `person_id` = the requester (Q1, ruled) | own prints only: the database refuses a `person_id` that is not the requester's |

- **The action decides readability by the same read the page makes, as the caller.**
  - A forged call naming a class the person cannot read gets the page's own refusal, and writes nothing.
  - The database writer keeps checking shape and owning school, as built.
- **Not changed:**
  - `/pimpinan` has the header and no button, and stays that way (§5.2 C).
  - Certificates (`AksiCetak`) keep their QR, and their print CSS excludes the footer.
  - Class cards (`LembarKartu`).

**Q1 · The learner's own results: RULED (Sharon's content rule; `B2-ARCHITECT-NOTES.md` §1).**
- **The print is person-scoped:** `resource = { report: 'hasil.belajar', person_id }`.
  - **Own prints only:** `akuntabilitas_catat` refuses a `person_id` that is not the requester's
    (`ACCOUNTABILITY_RESOURCE_INVALID`).
  - A staff member printing a learner's report uses a class or assignment scope.
- **Its school snapshot is computed in the database, at print time, from the same scope the report is assembled
  from:** the schools of every sitting, result or certificate the page shows.
  - It is never the route's word, and never the learner's live affiliations.
  - The snapshot is **each printed sitting's own `institution_id`** (Sharon's change 3, wording; as in B2-P02).
    ~~The institutions of those sessions' assignments~~ (superseded).
  - **One read** (Sharon's change 3, requirement): one database function returns the sittings `/belajar/hasil` shows,
    for a person (`hasil_belajar_sesi_orang`). The page reads it as the caller (`hasil_belajar_sesi_saya`), and the
    writer computes the snapshot from the same function. There is no second implementation, so the event and the paper
    cannot disagree. *Test (B2-P06):* the snapshot equals the set of schools of the sittings on the rendered page, for
    the same learner and instant.
- **Several schools: never refused.** The one-school constraint (`accountability_events_print_one_school`) is relaxed
  for the person-scoped kind only. Class- and assignment-scoped prints keep exactly one school, and a test proves
  both sides.
- **No live school:** a departed learner who can still sign in prints their history. The snapshot holds the schools
  whose evidence is on it.
- **No evidence:** the snapshot is empty, and the event is the platform admin's alone. (The empty report offers no
  «Cetak laporan» in any case: §1 item 4. So this arises only if evidence becomes unreadable between the page and the
  press.)
- Suspended, closed and anonymised people cannot sign in, and never reach this path.
- **The cost (Sharon's, stated for the owner):** a former school's admin learns that a learner who left printed that
  school's results after leaving. The event carries no content.
  - The owner's alternative, the live snapshot, discloses less. But a departed learner's printed report could then not
    be confirmed by the school that issued its results.
- **One migration (B2's):** `akuntabilitas_catat` accepts the person scope and computes its snapshot. The one-school
  check becomes "exactly one, unless the resource is person-scoped".
- ~~**Engineer's proposal (superseded by the ruling above):** the owning school is the requester's single live school
  at that instant; with none or several, the print is refused. The alternative, the learner's current class `node_id`,
  names a class the report is not about.~~

## 3 · The footer, as built from §5.2 F

- **Official print:** «Dicetak oleh {nama} · {tanggal, jam, zona} · Ref. CTK-XXXX-XXXX». One line, 7.5–8 pt,
  `--ink-2`, bottom-left, on every page, portrait and wide.
- **Default (any print not made through the button): it names no person** (Sharon's change 5; Daisy's wording).
  - «Dicetak dari browser · {waktu} (jam perangkat) · tanpa nomor referensi» / «Printed from the browser · {waktu}
    (device clock) · no reference number».
  - **The stylesheet's default is the fallback, with no time:** «Dicetak dari browser · tanpa nomor referensi» /
    «Printed from the browser · no reference number». `beforeprint` adds the device's time. It is removed on
    `afterprint` **and** as soon as `window.print()` returns, so a stale time can never print.
  - The time uses the official line's formatter, then WIB, WITA or WIT, or «UTC+h» outside Indonesia. It claims no
    record (§5.2 D3). It contains no reference-shaped text.
  - **Deviation from THE PLAN §5.2 F** (owner-approved, not edited): §5.2 F adopted «Dicetak dari browser oleh {nama}
    · …». *Reason:* a stale tab, after a sign-out and another person's sign-in elsewhere, would print a line naming
    someone who did not print it. Sharon's integrity ruling takes precedence over the composition, and Daisy wrote the
    replacement. If the owner prefers THE PLAN itself amended, that is the owner's instruction.
  - ~~«Dicetak dari browser oleh {nama} · {waktu} · tanpa nomor referensi»; Q2, the name from the rendered viewer~~
    (superseded by the ruling above; Daisy's «oleh {nama}» line is marked superseded in her design document).
- **Swap:** only after the action returns a reference, and before the dialog opens. **The default is restored as soon
  as `window.print()` returns, and on `afterprint` as well** (Sharon's change 2: `afterprint` does not fire reliably in
  every browser, and without the second restore a later Ctrl+P would print the same reference on a second paper). A
  refused or failed request never swaps. *Test (B2-A06):* with `afterprint` suppressed, the footer is the default
  again once the dialog returns. ~~`afterprint` restores the default~~ (superseded).
- **Failure:** «Cetakan belum dapat dicatat, jadi belum dicetak. Coba lagi.» in the existing result line (`BarisHasil`,
  a status region).
- **Every press is one event and one reference.** Printing twice gives two references; that is intended (§5.2 D6).
- **Long names:** the name and time stay whole; the reference wraps.

## 4 · The register taken with B2

| # | Finding | B2's change | Wording |
|---|---|---|---|
| B1-R1 | The reader's refusal says «Admin platform» | `akuntabilitas.ditolak` re-worded | Daisy's: «… dan Admin PINTAR.» / «… and by an Admin PINTAR.» |
| B1-R2 | «Seluruh platform» doesn't name each row's school | In the platform view only, a second line under the name in «Siapa» names the row's school(s), joined with «, ». A row with no school says «tanpa sekolah» (`akuntabilitas.tanpa_sekolah`). A school admin's view is unchanged | Daisy's: a line, not a column, so the table stays narrow and the phone layout intact |
| B1-R3 | The Konfigurasi index doesn't list the reader (optional) | One entry after «Jejak audit» in «Staf dan akses», with the existing keys, **shown only to school admins and the platform admin**: a teacher is never offered a link that ends in a refusal | Daisy's |
| B1-R4 | A failed write leaves a gap no reader shows (owner: before Z) | **The completeness notice**, below | Daisy's |
| B1-R5 | Two «Hapus saringan» in the no-match and purged-reference states | The empty state's own action is dropped, as in the other Konfigurasi no-match state | — |

**B1-R4, the completeness notice:**
- **Who sees it:** the platform admin only.
- **What it reads (Sharon's change 6):** one new definer function, `akuntabilitas_gagal_ringkas()`, gated on
  `is_system_admin()`. It returns only the count and the last instant of unrecorded writes. ~~The health read's own
  count, `pintar_periksa_kesehatan()`~~ (superseded: that function is revoked from every client role and would hand
  the reader the whole health read). *Test (B2-S03):* refused to a school admin and to non-platform staff.
- **Its window is the sentence's** (Chief Architect's note): the last 7 days as the health check counts them,
  `day > (today in WIB) − 7` (today and the six days before it, in WIB). The sentence says «Dalam 7 hari terakhir».
- **Daisy's question, answered: failed print writes are excluded.** A failed print prints nothing, so it leaves no
  gap. The health check counts all three kinds, `PRINT_REQUEST` included. The new function counts `SIGN_IN` and
  `SIGN_OUT` only, so the sentence's «kejadian masuk atau keluar» is exact.
- **Wording (Daisy):** «Daftar ini mungkin tidak lengkap. Dalam 7 hari terakhir, PINTAR tidak dapat mencatat sebagian
  kejadian masuk atau keluar (terhitung {n}, terakhir {waktu}). Lihat [Kesehatan sistem].» / «This list may be
  incomplete. In the last 7 days, PINTAR could not record some sign-in or sign-out events ({n} counted, the last at
  {waktu}). See [System health].»
- **When:** a status banner above the filter, shown only when the count is above 0. It is absent if the count cannot
  be read, so it claims nothing. Qualified, never a number of missing rows presented as exact.
- **Link:** to Konfigurasi's health check (`/konfigurasi?periksa=skema`).
- **A school admin never sees it**, and so learns nothing of another school.
- ~~**Q3:** confirm the reader calling the health read~~ (answered by Sharon's change 6).

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
| B2-P01 | Q1: a person with results at A and B prints their own results: the snapshot is {A, B}, and each school's admin finds the reference | no person scope |
| B2-P02 | **The transferred learner, to Sharon's specification** (`B2-ARCHITECT-NOTES.md` §1 at `a79dc446ca601cf5d918dad77ecccb2c5d9ecf5a`; the owner's condition "no attribution by transfer"). **Fixture:** a learner earns results at A and is moved to B through the product's own transfer path (`transfer_minta`, `transfer_terima`, `transfer_execute`), then prints a report showing those results. **Asserted:** the event's snapshot is `{A}`; A's admin finds the reference, B's admin does not, the platform admin does. **Invariant:** the snapshot comes from each printed sitting's own `institution_id`, never from the learner's current enrolment. **Plant:** the snapshot derived from the live affiliation instead turns it red. **A second report:** one result earned at B is added and both are printed: snapshot `{A, B}`; each school finds that event, and each is shown only its own school (B1's correction). **Also checked:** the reference adds no way for B to read A's evidence (a print's content is never returned to a reader); INV-25 portability is unchanged | no person scope |
| B2-P03 | A departed learner (no live school) prints their history: the former school finds the reference, an unrelated school does not | no person scope |
| B2-P04 | A print whose report holds no evidence: the snapshot is empty, and only the platform admin finds it | no person scope |
| B2-P05 | A person-scoped print naming someone else's `person_id`: refused, and no row is written. **A request carrying another user's id still writes as the session's user, or is refused** (Sharon's change 1). And the one-school check: a class-scoped print with two schools is still refused, a person-scoped one is not | no person scope |
| B2-P06 | **One read** (Sharon's change 3): the snapshot equals the set of schools of the sittings on the rendered `/belajar/hasil`, for the same learner and instant | no person scope |
| B2-A06 | **The restore** (Sharon's change 2): with `afterprint` suppressed, the footer is the default again once `window.print()` returns; a second Ctrl+P prints no reference | the swap stays |
| B2-S03 | **The notice's reader** (Sharon's change 6): `akuntabilitas_gagal_ringkas()` refused to a school admin and to non-platform staff; it counts sign-in and sign-out failures over the sentence's 7 days, never a print's | the function does not exist |
| B2-S01 | Static: every page rendering `AksiLaporan` goes through the action; nothing else calls `window.print()` on a report; the certificate print is untouched | — |
| B2-S02 | B1-R1, R2, R5 and the R4 notice (platform admin only; a school admin never sees it), through the running app | — |
| Journey 4 | The print step (§5) | — |
| Plants | (a) the action returns a reference without writing the event; (b) the footer swaps before the reference returns; (c) a person-scoped print's snapshot derived from the learner's live affiliation, not from each sitting's `institution_id` (B2-P02 red). Each turns its test red | — |

**Committing tests leave no event row** (P3), proved at the end of each.

## 7 · Pre-flight starting list (§4.1 P1)

- **Changed:**
  - `AksiLaporan` and `KepalaCetak` (or `KakiCetak`);
  - the print CSS;
  - the three report pages;
  - the reader `/konfigurasi/catatan-masuk` and its copy;
  - `akuntabilitas_catat` and the one-school constraint (one migration, Q1 as ruled).
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
| What else did that change? | The three report pages; the print CSS shared with certificates (excluded); B1's writer (the person scope, and its snapshot from the report's evidence); the one-school constraint, relaxed for the person scope only; the reader's wording and its platform view; journey 4. **And B1's reader then shows a school admin a print by a person no longer at that school** (a departed learner printing that school's results). That is correct and intended: the school owns the printed evidence. The row's wording, if it needs any, is Daisy's |
| What happens when things go wrong? | The writer fails: nothing prints (fail closed). The dialog is cancelled: the event stands (a request, not a printout; §5.2 B, "any claim that paper came out of a printer" is out). A browser print: the default line, no reference |
| Can it be reversed, and what survives? | Nothing is reversed. The row survives 12 months; the paper survives indefinitely |

## 10 · Cross-module inventory (SYSTEM-INTEGRITY-4.1 §2), as built (the plan's rows, each now with its evidence)

| Interface | Checked how | Evidence | Limitation |
|---|---|---|---|
| B1's writer and reader | A press, then a lookup by reference; a forged scope; a failed write; the requester from the session | B2-A01 to A03, B2-P05, journey 4 | — |
| A learner who has left, seen by the former school (Daisy) | No label: the reader never shows a person's status. **An admin may see a print by someone no longer at the school**, and this is correct: the school owns the printed evidence | B2-P03 | — |
| A person-scoped print's snapshot (Q1) | Two schools; one school; a departed learner; no evidence; someone else's person; the one-school check on both sides | B2-P01 to P05 | — |
| The three report pages and `/pimpinan` | Static and rendered | B2-S01, B2-A04, B2-A05 | — |
| Certificates' print | Unchanged, by test | the certificate print tests | — |
| The reader's platform and school views (R1 to R5, R4's notice) | Through the running app, as both | B2-S02 | — |
| Retention (O41-13) | A purged reference's state is B1's, unchanged | B1-L01 | — |
| The phone drawer (S-1) on the reader | 390 and 320 px, **and the desktop sidebar** (one of S-1's rules hides a navigation item at every width; Chief Architect's note, §4) | Daisy's visit | — |

## 11 · As built

**Migration** `20270117150000_a_printed_report_is_owned_by_the_schools_whose_evidence_it_shows.sql`:

| Step | What | Where |
|---|---|---|
| 1 | **One read of a learner's results.** Per chapter: its state and the sittings `/belajar/hasil` shows. The page reads it as the caller, and the writer reads the same function (Sharon's change 3) | `hasil_belajar_sesi_orang(person)`, `hasil_belajar_sesi_saya()` (LEARNER, registered), `hasil_belajar_sekolah(person)` |
| 2 | **The person-scoped print.** `{report, person_id}`: the person must be the requester; the snapshot is each shown sitting's own `institution_id`; several schools are never refused; no evidence gives an empty snapshot | `akuntabilitas_catat` (rewritten by fragment, checked); `accountability_events_print_one_school` relaxed for `resource ? 'person_id'` only |
| 3 | **The notice's reader.** The platform admin's alone: the count and last instant of sign-in and sign-out write failures, `day > (today in WIB) − 7`; a print's failures are not counted | `akuntabilitas_gagal_ringkas()` (STAFF, SYSTEM_ADMIN, registered) |

**The app:**

| Piece | Where |
|---|---|
| The print action: the requester from `auth.getUser()`, the person from the session's own profile. A class's or a school's report only in the active context of its school (§2.11, `sasaranDalamKonteks`, before any act). Readability by the page's own read (`generate_report`, the professional-learning record, or `hasilBelajar`). Then B1's fail-closed writer. Answers `{ ref, nama, waktu }` or `CETAK_TIDAK_BOLEH` / `CETAK_GAGAL` | `src/app/laporan/cetak/actions.ts`; the contract `LAPORAN_CETAK`, `PermintaanCetak`, `HasilCetak` in `src/lib/akuntabilitas-kontrak.ts`; `LingkupCetak` gains `{ person_id }` |
| «Cetak laporan»: the action, passed by the server page, then the official line, then `window.print()`; the default is restored in a `finally` and on `afterprint`. Any other print gets the device-clock line on `beforeprint`. The failure line is `BarisHasil` | `src/components/laporan/AksiLaporan.tsx`; the words, `src/lib/kaki-cetak.ts` |
| The footer: bottom-left of `@page laporan` and `laporan-lebar`, 7.5 pt, `--ink-2`; «Halaman n dari m» stays bottom-right | `src/app/experience.css` |
| The four report views: the class summary, the professional-learning summary, the school summary, and the learner's results. Each offers «Cetak laporan» only when its report has entries (for the learner, a finished or closed chapter) | the three report pages |
| `/belajar/hasil` is built from the one read (`engine.myResultsShown`) | `src/lib/hasil-belajar.ts`, `src/lib/assessment-engine/index.ts` |
| B1-R1 to R5 and the notice, in Daisy's words | `src/app/konfigurasi/catatan-masuk/page.tsx`, `src/app/konfigurasi/page.tsx`, `src/lib/hle.ts` |
| Journey 4's print step (§5) | `audit/journey.mjs`, step B2J |

**One engineer's draft for Daisy:** `laporan.cetak.ditolak` («Laporan ini tidak dapat dicetak dari akun Anda.»), the
answer to a refused print. Only a forged request reaches it.

**Two decisions taken in the build, for the reviews:**
- **«Cetak laporan» is offered when the report has entries.** That includes a figure stated as absent: an honest
  absence is content. Today's page offered the button always. The learner's page offers it when a chapter is finished
  or closed after a Pemetaan Awal.
- **The learner's own-results print** is dated on that school's clock when the printout holds one school's results
  (Bob's point, `B2-ARCHITECT-NOTES.md` log), and in WIB when it spans schools or holds none. The schools are the one
  read's, as the record's are. A school-scoped print uses its school's zone.
  - ~~It always gives its instant in WIB~~ (superseded by Bob's point).

### Every column and table touched: constraints and the governing invariant

| Column or table | Constraints after this commit | Baseline invariant |
|---|---|---|
| `accountability_events.institution_ids` (a print's) | Exactly one school, except a person-scoped print, which may hold any number including none (`accountability_events_print_one_school`). Computed by the writer only; the store stays insert-only and closed to every client role | **INV-13**: a school reads only rows whose snapshot holds it, and is shown only its own school; **INV-25**: no evidence is re-parented by a transfer (B2-P02) |
| `accountability_events.resource` | `{report, node_id \| learning_assignment_id \| assessment_assignment_id \| person_id}`, exactly two keys; a person scope only the requester's | **INV-08**: the person is the session's, never the request's (B2-P05, B2-A01); **INV-01**: no content in the event |
| `accountability_events.person_id` | Unchanged: the requester, from the verified session | **INV-08** |
| `accountability_write_failures` | Unchanged; read by one more definer function, the platform admin's alone | **INV-13** (no school's count reaches another school) |
| `assessment_sessions`, `learning_assignments`, `enrollments`, `memberships` | Read only, by `hasil_belajar_sesi_orang`; nothing written | **INV-23**: memberships are read as recorded; **INV-25**: each sitting keeps its own school |

### Tests (red first on `97a40ebb0e52a2f0ba558418426f9fc5d71aca4b`)

| Id | Runner | Red on `97a40ebb` |
|---|---|---|
| B2-P01 to P06, B2-S03 | static (the database, rolled back; `selftest/b2.test.ts`) | red: the base writer refuses a person scope («a print names its report and exactly one class node or assignment of a school») |
| B2-D01 | db (`selftest/db/b2.sql`, gate `db-b2-gates`) | red, for the same reason; plant **b2-1** (the snapshot from the live affiliation): red, `expected snapshot {Alpha} while live {Beta}` |
| B2-S01, B2-S02 | static (the code) | red: no print action, no footer, no register items |
| B2-A01 to A05 | app (`selftest/b2-layar.test.ts`) | red: no action in the build |
| Journey 4, B2J | journeys (`audit/journey.mjs`) | not run red: a journey step on the base has no button to press. It is new on this commit |

- **Plants (a) and (b)**, the action returning a reference without writing and the footer swapping before the
  reference returns, are code-level defects. The plant runner plants SQL only. B2-A01 counts the rows a press writes
  (a), and B2-S01 reads the order of the press (b). The journey checks the footer at the instant `window.print()` is
  called and after it returns.
- **The CI red-case group** "db · bob37 bob24 bob39 bob04 fable04 l1f4" becomes "… l1f4 b2", with B2's gate; CI-W03's
  list gains `db-b2-gates`.
- **Restated, with notes:**
  - **HOD09-K01:** `AksiLaporan` is rendered with a scope and the action, and its controls follow the footer's
    `<style>`. The two report pages' call carries `aksi`, `kaki` and `cetakSebagai`.
  - **B5A-LAPORAN-K01:** the same call shape.
  - **LAPORAN-MURID-01:** `hasilBelajar` reads `engine.myResultsShown`, still the learner's own.
  - **The migration-count pins:** 238 → 239.
  - **F22-P05:** the print action is listed as context-bound. A class's or a school's report prints only in the active
    context of its school; otherwise it is refused (`CETAK_TIDAK_BOLEH`). A learner's own results have no place (C1).

## 12 · Evidence on this commit

To be filled from the pre-flight and CI on the pushed commit.

