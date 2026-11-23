# Z · build plan (Second Eye, 23 Nov 2026) · STEP 1, before any code

> **Branch:** `claude/z`, from `main` at `01bba241` (C3w-1 accepted at 300, ruling 80). It is a development branch only
> (ruling 64): no merge, staging or production without the owner.
> - **Scope:** the authorised rows of `Z-READINESS.md` (`claude/bob-41-master-plan`), as listed in Bob's brief of
>   23 Nov 09:20. Nothing is added.
> - **Ruling 79 applies to every row.** Before it is offered, each change is checked three ways: it works correctly; it
>   works with what is around it (its neighbours are named in §3); and the person's experience is seen in the rendered
>   app (§5).
> - **Status:** a plan for Bob's approval. No code is written until he approves.

## 1 · The chunks, in dependency order

Each chunk ends green before the next starts. Every chunk has its own full pre-flight, and each review-bearing chunk is
pushed for its reviewer. CI and the journeys run **once**, on the Z candidate (D-025).

| # | Chunk | Rows | Why here |
|---|---|---|---|
| **Z0** | Foundations | R-19 (golden-db `banned_until`); the D-1 regression guard's skeleton (the 7 named readers); the K-01 **consumer inventory** (a document, no code) | Golden-db must build before any SQL chunk is proven. K-01's inventory comes first by ruling 78 |
| **Z1** | Readers that tell the learner the truth (SQL; Sharon) | **D-1** (the 7 readers, array-aware); **V2** (R-22: the latest *finalised* result, the D14 marker); **K-07** (a pass-mark floor of 1–100); **K-01's SQL** (the gate item's objectives in `tujuan_belum_tercapai`) | Every later screen reads these. D-1 and K-01 share the learner's result and review readers, so one author restates them in sequence |
| **Z2** | Containment and designed refusals (SQL; Sharon) | **D-6** (R-17: revoke the 5 write RPCs, hide the links); **V5** (R-24: a designed code for the closed-enrollment transfer); **V6** (R-25: the after-promotion suspension check); **R-27(b)** (PINTAR ID normalisation in reopening) | Independent of Z1. Each is small and permission- or data-touching |
| **Z3** | Learner and teacher screens on Z1's readers (Daisy) | **K-01** screens (learner result, the teacher's per-learner page, «Minta membaca lagi», retake and certificate checked); **K-02** «Sudah kuat» and `map.kuat.arti`; **K-03**; **K-04**; **K-05** (verification: «Seperti saat diterbitkan»); **M1, M2** (R-20); **R-8** (X-2: the six `/belajar/[tugas]/` sub-pages) | Needs Z1's verdict and readers |
| **Z4** | Sign-in and submit (Daisy; no Sharon except R-27(b) in Z2) | **R-26 items 1+4** (`TombolKirim`: `asli` and the busy width); **R-27(a)** (the reopening string); **S-12** (validate before pacing); **R-27(c)** (the identity field's keyboard); **R-26 item 2** (44 px `pin-konteks-pilih`); **S-15**; **S-11** (the same normaliser as R-27(b)); **S-08**; **S-13** | `masuk/buka-kembali` is touched by four rows, so it is done in one place, in one order |
| **Z5** | Konfigurasi, Studio and staff forms (Daisy) | **R-10 + N-9** (Konfigurasi's navigation from one source; the neutral staff refusal); **S-01** (the preserve-all-settings test, then the fix); **S-02**; **S-04**; **S-05**; **S-06**; **S-03**; **S-07**; **S-16**; **R-26 item 3** (the four labels) | Shared pages and actions; R-10 first, because it reshapes every sub-page that the S-fixes then touch |
| **Z6** | Phone widths and the framed-overflow sweep (Daisy) | **R-11** (`/siapa` stacked below 640; the mode switch wraps below 360); the new assertion in the rendered-check helper, swept over every `pin-tabel-bingkai` and `pin-seg` page, with **N-8** and R-15's 320 px titles | After Z3 to Z5, so the sweep sees the final pages |
| **Z7** | Words, last (Daisy) | **T-03** «Admin PINTAR» (22 keys + 1 EN); **T-09**; **T-02** (delete `mengajar.langkah.f2`); **S-09**, **S-10**, **S-14**; **N-1**, **N-2** (R-12); R-15's one-string items (Kenaikan's «, » join and group order; «Kursus» → «Paket», X12) | Last, so they do not churn earlier chunks' fixtures and words tests |
| **Z8** | Verify-closed and triage | **A1** (R1, R2, R4) and **C1w** (R2, R4, R5) verify-closed rows; R-15's Sharon items (the run-guard order; A1's approval re-check and the reports rule; C1w's confirmer preference; B0's account closure), each with a proposed class; **A1-R4** and **C1-R4** need one rendered look each | Verification, not new work. Done in Z6's rendered sessions, so one build serves both |
| **Z9** | The candidate | One full pre-flight on the Z head; CI and journeys once; the evidence folder (preservation 300 → N, the dry run, after-promotion checks incl. V6's); the hand-off | — |

**Not in Z unless the owner rules:** lifting C3w-1's single-answer AI restriction after D-1 (ruling 55). If he rules it,
it is one small change in Z1, after D-1's acceptance: `ai_soal_tertutup`'s «exactly one key», and the closed record.

## 2 · Each item: its red-first test, its reviewer, and whether it needs a migration

**Reviewers:** **S** is Sharon (any SQL, permission or verdict change); **D** is Daisy (any screen or words). Migrations
are numbered after `20270122190000`, one file per row that needs one, applied in this order.

| Row | Red-first test (fails on `01bba241`, passes after) | Review | Migration |
|---|---|---|---|
| R-19 | golden-db builds from the shape file and asserts `auth.users.banned_until` exists | S | no (shape file) |
| D-1 | Z-D1-01: for a sitting with an MCQ_MULTI final answer, each of the 7 readers (Sharon's list) returns the chosen options, not nothing, and «chosen» is never raw JSON; a single-answer sitting reads byte-identically. Z-D1-02, the guard: any `pg_proc` or `pg_views` body reading `->> 'pilihan'` outside an allow-list fails. Plus the fixture/import guard (Sharon's ruling-56 condition): an MCQ_MULTI before the repair is refused or reported | S | **20270123100000** |
| V2 | Z-V2-01 (Sharon's conditions 1–4): a finished Uji Penguasaan, then a retake begun → the summary shows the finished result; the retake ended → it still does; `recompute_result` → the D14 marker shows; the two-person key-correction path end to end | S (+D for the «in progress» words, if the owner wants them) | **20270123110000** |
| K-07 | Z-K07-01: a pass mark of 0 and of 101 is refused at every writer (rule, school default, class); 1 and 100 are accepted; existing rows are not changed | S | **20270123120000** |
| K-01 (inventory) | — (a document: every consumer of the verdict, with file:line: the learner result, the teacher's class and learner pages (`pengajar.ts:1157`, `murid/[orang]/page.tsx:126`), «Minta membaca lagi» (`ulang/page.tsx`), retake eligibility, the certificate (`sertifikat/page.tsx`, `verifikasi`), Kenaikan (`kenaikan.ts`), `siklus.ts`) | S, D | — |
| K-01 (SQL) | Z-K01-01: a gate-failed learner with mastery at or above the mark: `tujuan_belum_tercapai` returns the missed must-be-right item's objectives; a learner below the mark reads as today | S | **20270123130000** |
| K-01 (screens) | Z-K01-02: the same learner is «belum mencapai target» on every consumer in the inventory: the learner's `hasil.target.belum_gerbang`; the teacher's `mengajar.murid1.gerbang`; listed and pre-ticked on «Minta membaca lagi» with `mengajar.ulang.gerbang`; retake and certificate unchanged (they already read `lulus`) | D, S | — |
| D-6 | Z-D6-01: the 5 write RPCs are not executable by `authenticated`; the read RPCs are as the owner chose; the links are gone from /belajar, /mengajar, /pimpinan and /konfigurasi; every row count is unchanged | S, D | **20270123140000** |
| V5 | Z-V5-01: an approved transfer whose enrollment closed at a rollover is refused with a designed code (and its words), never the raw «a closed enrollment is immutable» | S, D | **20270123150000** |
| V6 | Z-V6-01: the after-promotion check prints OK when `authenticator`'s `pgrst.db_pre_request` is `pintar_permintaan.periksa`, and names the difference on a plant | S | no (`scripts/release/after-promotion/`) |
| R-27(b) | Z-R27-01: «A14C D7ST» and its O/I/L forms reopen the right account; an email, a username and a near-miss ID never cross-match; input with `@` is never normalised | S | **20270123160000** |
| K-02 | Z-K02-01: a KUAT card shows «Sudah kuat» and `map.kuat.arti` once, never the statement twice; the tier description appears where the tiers are explained | D | — |
| K-03 | Z-K03-01: a failed read is said as a failure, and «no assessment yet» as its own state, never as «no objectives below target» | D | — |
| K-04 | Z-K04-01: the school report never says «all domains ≥ 60%» while any domain is withheld | D | — |
| K-05 | Z-K05-01: «Sedang ditinjau» shows «Seperti saat diterbitkan» above the facts and `verifikasi.fakta.ditinjau` below it; DICABUT shows the heading only; TIDAK SAH is unchanged | D | — |
| M1, M2 | Daisy's tests (`Z-M1-M2-SPESIFIKASI.md`): NOT_AUTHORISED is not `pin-hasil-gagal` and OFFLINE still is; the body reads «Uji Penguasaan · {bab}», without subject or grade | D | — |
| R-8 | Z-R8-01: each of the six `/belajar/[tugas]/` sub-pages, opened with another learner's id, gives the designed «not yours» answer, the same for unknown and forbidden | D | — |
| R-26 1+4 | DAISY-17's group unchanged; Z-R26-01: a double press on «Kirim permintaan» posts once, and the answer is «Terima kasih. …», not «Tunggu»; Back restores the button; Z-R26-04: a busy button never narrows and its neighbours never move | D | — |
| R-27(a), S-12 | Z-S12-01: a refused input on reopening is said as the input's own line (R-27(a)'s string), not «a request was just sent» | D | — |
| R-27(c) | Z-R27-03: the identity field has no `inputMode="email"`, no autocapitalise or autocorrect, and keeps `autoComplete="username"` | D | — |
| R-26 2 | Z-R26-02: the hit area of `a.pin-konteks-pilih` is at least 44 px at 390, and the block is pixel-identical at 320, 390 and 1280 | D | — |
| S-15, S-11, S-08, S-13 | one rendered or route case each, per `SAPU-VERIFIED.md` (an outage is not «email maybe already used»; a pasted «A14C D7ST» is found; no «ask for a new code» where there is none) | D | — |
| R-10, N-9 | Daisy's test: 7 sub-pages × 2 admins × 1280 and the 390 drawer: the link set equals `/konfigurasi`'s and `aria-current` is right; `/konfigurasi/staf` with an unknown or forbidden person gives the neutral refusal | D | — |
| S-01 | Z-S01-01 first, the preserve-all-settings test: renaming an Aturan Asesmen keeps every other setting, pause and offline included; it fails today | D, S (it reads `save_assessment_definition`'s rule) | — |
| S-02, S-04, S-05, S-06, S-03, S-07, S-16 | one case each, per `SAPU-VERIFIED.md` | D | — |
| R-26 3 | Z-R26-03: the four labels are their own keys, and «Berikan izin» is `studio.kanonik.beri` | D | — |
| R-11, N-8 | Daisy's assertion: at 390 and 320 no element in `main` has `scrollWidth > clientWidth` with `overflow-x: auto`; then the sweep over every `pin-tabel-bingkai` and `pin-seg` page | D | — |
| T-03, T-09, T-02, S-09, S-10, S-14, N-1, N-2, R-15 strings | the words tests: each key word for word, ID and EN; `mengajar.langkah.f2` absent; no «Admin platform» left in the 22 keys | D | — |
| Z8 verifications | one line each, with its citation, in `Z-VERIFY-CLOSED.md` | S, D | — |

**Seven migrations:** `20270123100000` to `20270123160000`, taking the count from 300 to 307. Every pin moves in each
commit that adds one.

## 3 · Conflicts between items, and how they are ordered

1. **K-01 and D-1** both touch the learner's result and review readers (`session_review`, `reading_map`) and the result
   page.
   - **D-1 is first** (Z1, migration 100000).
   - **K-01's SQL** (130000) restates `tujuan_belum_tercapai` only.
   - The K-01 inventory names D-1's repaired readers, so the verdict and the options a learner sees are checked together
     (Z-K01-02 runs on a multi-answer sitting too).
2. **K-01 and V2** both decide what the learner's summary shows.
   - **V2 is before K-01's screens:** first the right sitting (the latest finalised), then its verdict (gate and mastery).
   - Both are in one case set, because a retake that fails only the gate is exactly where they meet.
3. **K-01 and K-07** are both verdict policy.
   - The floor (1–100) is in force before the gate-and-mastery verdict is shown, so no learner reads «reached» on a
     pass mark of 0.
   - **Sharon reviews them together.**
4. **K-02 and D-1** both touch `reading_map`.
   - K-02 is UI only, but D-1 restates the function.
   - **D-1 first**, then K-02's card on the restated reader.
5. **R-26 item 1, R-27(a), S-12 and R-27(b)** all land on `masuk/buka-kembali` (the page, `kirim/route.ts` and
   `minta_buka_kembali`). **One order, one owner:**
   1. **R-27(b)** in Z2: the SQL, with its own red case.
   2. In Z4, **S-12**: the route validates before it paces.
   3. Then **R-26 item 1**: the button.
   4. Then **R-27(a)**: the string.

   **One rendered recheck covers all four.**
6. **R-27(b) and S-11** use the same normaliser.
   - The SQL uses `pintar_id_canonical`.
   - The platform account lookup gets the same rule in TypeScript, with one shared fixture list, so the two never
     disagree.
7. **R-26 item 4 (`TombolKirim`'s width)** touches every form.
   - Its safeguard is the whole DAISY-17 group, plus C3w-1's forms (`DrafAi`, `AsalAi`), plus one journeys run on the
     candidate.
   - `asli` is opt-in, and the width rule applies only while busy.
8. **R-26 item 3, S-01 and S-05** share Studio's Aturan Asesmen form and actions. **They are done in one sitting in
   Z5:**
   1. S-01's test;
   2. then S-01's fix;
   3. then S-05's field mapping;
   4. then the labels.
9. **R-10** changes the shell of every Konfigurasi sub-page.
   - **S-02, S-04, S-06 and N-9** are on those pages, and **D-6** hides a Konfigurasi link.
   - **R-10 is first in Z5;** D-6's link is removed from the one shared source.
10. **T-03's 22 keys** cross Konfigurasi, Aktivasi, Keamanan, email and audit. **They are last (Z7),** so the words
    tests of earlier chunks are not rewritten twice.
11. **R-11's sweep** must see the final pages, so **Z6 follows Z3 to Z5.**
12. **K-05 and C1-R4** (Z8) are both the certificate under review: the public page, and printing. **They are checked in
    one rendered session.**
13. **The migrations are serial.** Each moves the count pins and the A2A-L01 report, so **no two SQL rows are built in
    parallel.**

## 4 · Effort

**The estimate:** working days for one builder, each including the red-first tests, a full pre-flight per chunk, and
the response to one review round.

| Chunk | Days |
|---|---|
| Z0 | 0.5 |
| Z1 (D-1 1.5, V2 1, K-07 0.5, K-01 SQL 0.5) | 3.5 |
| Z2 (D-6 0.5, V5 0.5, V6 0.25, R-27(b) 0.5) | 1.75 |
| Z3 (K-01 screens 1, K-02 to K-05 1, M1/M2 0.25, R-8 0.5) | 2.75 |
| Z4 | 1.5 |
| Z5 (R-10 + N-9 1, the S-fixes and R-26 3 1.25) | 2.25 |
| Z6 | 1 |
| Z7 | 0.75 |
| Z8 | 0.5 |
| Z9 (pre-flight, CI, journeys, evidence, dry run) | 1 |
| **Total** | **about 15.5 days** |

- **About 3 days of slack** for review rounds, and for this container's Docker restarts, which cost time in C3w-1.
- **Reviews can overlap with the next chunk:**
  - Sharon reviews Z1 while Z2 and Z3's screen-only parts are built;
  - Daisy reviews each screen chunk while the next is built.

## 5 · How each change is seen (ruling 79)

**Every screen row is walked in the running app:**
- at 1280, 390 and 320;
- by keyboard;
- with the captures committed under `batches/z/layar/` for Daisy, as C3w-1's were.

**The learner-facing correctness rows (D-1, V2, K-01) are also walked end to end, on one synthetic learner:**
1. sit;
2. fail only the gate;
3. retake;
4. key correction;
5. recompute;
6. read the summary, the result, the review and Peta Bacaan, as the learner and as the teacher.

That walk is the "with everything around it" check, and it is committed as a script so it can be re-run.

## 6 · What I need from Bob before code

- **Approval of this plan:** the order, the seven migrations, and the reviewers.
- **The D-6 read RPCs:** kept readable (Sharon's option 2), or fully dark (the owner's call).
- **V2's «in progress» wording:** whether an open retake shows beside the finalised result (Daisy and the owner). The
  fix itself is not blocked on it.
- **Whether the single-answer AI restriction is lifted after D-1** (the owner's ruling). It is not planned otherwise.
