# Z-READINESS closure audit (G-2): R-1 … R-28 against Z as merged (origin/main 61a6ff9e)

This is a read-only check of `docs/completion-4.1/Z-READINESS.md` on `claude/bob-41-master-plan`. The evidence comes from:
- origin/main: `batches/z/` (Z-BUILD-PLAN, Z-VERIFY-CLOSED, Z8-VERIFIKASI-B, Z0-K01-INVENTORY, z-evidence/README, layar/*) and `selftest/manifest.json`;
- `git log 61a6ff9e^1..61a6ff9e^2`;
- OWNER-RULINGS-4.1 (55–89) and NEXT-SEQUENCE-89, both on the current branch;
- Sharon's branch `origin/claude/gracious-lamport-0m1qjr` (R15-SHARON-ITEMS, CARRIED-ITEMS);
- Daisy's branch `origin/ux-1/daisy-experience` (R15-DAISY-7ba18b03).

`docs/coordination/reviews/` on origin/main holds only D-101, so reviewer PASS records are cited through Z-CANDIDATE-FOR-OWNER §2.

Mig = migration. Test ids are `selftest/manifest.json` ids.

| Row | Item (short) | Verdict | Evidence | Who should confirm |
|---|---|---|---|---|
| R-1 | Departed learner opens a sitting by URL (re-check after A3's start path) | **OPEN** | Z-BUILD-PLAN and Z-PLAN-APPROVAL do not list it. No Z commit, test or ruling records a re-check | Second Eye, then Sharon |
| R-2 | Two simultaneous refused acts can each write an audit row | **OPEN** (triage not recorded) | Not in the Z plan. No triage found on origin/main or on Sharon's branch | Sharon |
| R-3 | A2b person-level start branch reads `now()`, not `clock_timestamp()` | **OPEN** (triage not recorded) | Only "carried" (Sharon CARRIED-ITEMS, "A2b's freeze"; A2B completion "Carried to Z"). No Z commit or class | Sharon |
| R-4 | A2B-R3: `sasaranDalamKonteks` fails open on an empty read | **OPEN** (conditional deferral, no verdict) | TEAM-INSTRUCTIONS:378 says "if not a Z blocker → rationalisation audit", pending Sharon's assessment. CARRIED-ITEMS lists it as "Z register triage". PLANNING-AUDIT 4.2-R names it generically. No assessment recorded | Sharon |
| R-5 | A2B-R1, emergency reason codes | **DEFERRED → unnamed** ("a later batch, with its own decision") | TEAM-INSTRUCTIONS:376; PLAN-A3-C3W-Z:185. Only the generic 4.2-R row (→4.5, ruling 72) could hold it | Bob or owner, to name a phase |
| R-6 | L01 ranks: A3-R3 (rank the two assignment tables, 23 violations), plus C3w-1's three tables | **Partly CLOSED, partly OPEN** | C3w-1's tables: **CLOSED** in C3w-1 (test C3W-D4, Sharon D-4). A3-R3's full ranking: A3-COMPLETION:84 says "registered for Z". Sharon's CARRIED-ITEMS has "Z register (added 17 Nov)". Z did not build it, and no deferral is recorded (A3-L1P's pairwise check is the only control) | Sharon |
| R-7 | X-1: Studio refusal renders two `<main id="isi">` | **CLOSED** (in C3w-1, as Z-2) | 102921ce; tests Z-S01 and Z-J01. Z-READINESS §4 says "X-1 closed" | Daisy |
| R-8 | X-2: six `/belajar/[tugas]/` sub-pages lack an ownership check | **CLOSED** | 4bf300da, 3f34689b (Sharon's conditions); tests Z-R8-01, Z-R8-02, Z-R8-03 | Daisy (Sharon for Z-R8-03) |
| R-9 | X-3: an unknown correction id says "not allowed" | **CLOSED** (in C3w-1, as Z-3 revised by V-3) | 102921ce; tests Z-S01 and Z-J01 ("one neutral answer for an unknown and a forbidden id") | Daisy |
| R-10 | X-4: Konfigurasi navigation from one source, plus N-9 | **CLOSED** | 75f1fde7, f80514d7, 56ef4c10; tests Z-R10-01, Z-N9-01, Z-N9-02 | Daisy |
| R-11 | Phone overflow on `/siapa`; framed-overflow sweep; N-8 | **CLOSED** | f322c25c, 2d19d3cf; tests Z-R11-01 and Z-BINGKAI-01; `layar/README-Z6.md` (sweep clean, `BINGKAI_DIKETAHUI` empty) | Daisy |
| R-12 | N-1…N-8 | **N-1, N-2 CLOSED**; N-6, N-7 **CLOSED** (C3w-1); N-8 **CLOSED** (with R-11); N-4 closed, not a defect; **N-3, N-5 DEFERRED → 4.5** (4.2, ruling 72) | 00c71229, test Z-N1-N2-01; 102921ce, test Z-S01; f322c25c. N-3 and N-5 by the row's own triage | Daisy |
| R-13 | Three 4.0 rendered checks on **staging**: night-issued certificate date; integrity count line; «Materi tanpa judul» | **OPEN**. The certificate part is owed to **D2-R 1f** | Z's captures are local only (z-evidence README: "nothing here touched staging"). D2-CERTIFICATE-CONDITIONS-SPEC:167 and :223, and NEXT-SEQUENCE-89 1f, attach "the rendered check (R-13)" to the new certificate sheet. **The integrity count line and «Materi tanpa judul» are named in neither D2-R nor the audit.** Ruling 71 removed the "before the walkthrough" deadline | Daisy, or a browser-capable person; Bob to assign the two unnamed checks |
| R-14 | X-15: four readers treat a not-yet-started role as live | **DEFERRED → 4.5** (before 4.2-02; 4.2 folded into 4.5 by ruling 72) | Bob's triage in the row itself: not reachable, since every grant writes `valid_from = now()` | Sharon |
| R-15 | Carried 4.0, A1 and C1w findings | **See the sub-table below** | Z-VERIFY-CLOSED.md; Z8-VERIFIKASI-B.md (04c78339); 6bc4123a | Sharon; Daisy |
| R-16 | D-1: the 7 multi-answer readers repaired | **CLOSED** | 2877c181, fc6ddea8, f9530db0; mig 20270123100000; tests Z-D1-01, Z-D1-02, Z-D1-03. Ruling 88 lifts the containment on staging. Production is still at 111 | Sharon |
| R-17 | D-6: anonymous feedback round dark, nothing deleted | **CLOSED** | 70ecba25, 18da65de (Z2-1); mig 20270123140000; test Z-D6-01; preservation lines 85–87 | Sharon |
| R-18 | D-2: certificate conditions | **DEFERRED → D2-R** | Ruling 59 (not Z; after Z, before the first real certificate) | Sharon; Dr Gladys via the owner |
| R-19 | Shape file lacks `auth.users.banned_until` (golden-db) | **CLOSED** | d2141539 (`scripts/dev/supabase-shape.sql`, `golden-db.sh`). No manifest test id | Sharon |
| R-20 | A3 minors M1, M2, M3 | **M1, M2 CLOSED**; **M3 DEFERRED → 4.5** (with N-3) | 4bf300da; test Z-M1M2-01 | Daisy |
| R-21 | V1: (a) certifying assistance; (b) O-7 retakes | **DEFERRED → D2-R** (R-d, R-h). Non-repeating or blueprint retakes **→ 4.5** | Rulings 74, 74a, 74b; ruling 59 | Sharon; owner (already decided) |
| R-22 | V2: the latest finalised result stays in force; D14 marker | **CLOSED** | dd51a642; mig 20270123110000; test Z-V2-01; the Z-K01-03 integrated check; owner-approved words (Z-PLAN-APPROVAL) | Sharon |
| R-23 | V4: Question Health counts changed answers | **DEFERRED → 4.5** (before 4.2-12; the OF gate) | Sharon "4.5 agreed" in the row; ruling 72. Z did not widen the display | Sharon |
| R-24 | V5: transfer consent, rollover, raw error | Raw error **CLOSED**. Consent: **DEFERRED → owner decision (OD-9)**. Rollover items: **DEFERRED → 4.5** | 83959497, 18da65de; mig 20270123150000; test Z-V5-01 | Sharon; owner (OD-9) |
| R-25 | V6: authority at effect | After-promotion suspension check **CLOSED**. Second layer and C′: **DEFERRED → 4.5** | eb5ca362; `scripts/release/after-promotion/v6-pre-request.sql`; test Z-V6-01; run on staging (ruling 88). C′ decided by ruling 73, delivery 4.5 | Sharon; owner (the `PGRST_DB_PRE_REQUEST` dashboard check) |
| R-26 | Four UX refinements (ruling 75) | **CLOSED** | Items 1 and 4: 5b3409ad and 954aa9bc; tests Z-R26-01, Z-N17-01. Item 2: test Z-R26-02. Item 3: 6a4a5231 and c4c8f792; test Z-R26-03 | Daisy |
| R-27 | Sign-in identifiers (a)–(d) | **(a), (b), (c) CLOSED**; (d) no change (ruling 77.4, "a future wording review") | (a) test Z-R27-02. (b) 2712a4c7, bdcefe31; mig 20270123160000; test Z-R27-01 (with Z-S11-01 on the shared fixture). (c) test Z-R27-03 | Sharon (b); Daisy (a), (c) |
| R-28 | Consistency sweep, 37 findings (ruling 78) | **Z set CLOSED**. Remainder **DEFERRED → ruling-79 audit** (NEXT-SEQUENCE-89 3a "SAPU leftovers"; the ledger is not yet committed) | K-07: 94ba0632; mig 20270123120000; tests Z-K07-01, Z-K07-02. K-01: c9466159, 4b3f168b, df8d84a0, 36299159; mig 20270123130000; tests Z-K01-01, Z-K01-02, Z-K01-03. K-02, K-03, K-04, K-05: tests Z-K02-01 … Z-K05-01. T-03, T-09, T-02, S-09, S-10, S-14: 00c71229. S-01 … S-16: Z4 and Z5 commits; tests Z-S01-01, Z-S02-01, Z-S04-01, Z-S05-01, Z-S06-01, Z-S07-01, Z-S16-01, Z-S08-01, Z-S11-01, Z-S12-01, Z-S12-02, Z-S13-01, Z-S15-01. Left over ("Later" in SAPU-VERIFIED §S3, no phase named there): K-06, K-08, K-09, T-01, T-04 … T-12, and S-06's SQL half | Daisy; Sharon (K-01, K-07) |

## R-15 sub-items (Z-READINESS §5)

| Sub-item | Verdict | Evidence | Confirm |
|---|---|---|---|
| 4.0 Sharon: school guard before `not (v_summary ? 'run_id')` | **DEFERRED → 4.5** (4.2 rationalisation, ruling 72); mitigated | Z-VERIFY-CLOSED "Classed elsewhere" item 1 (`20270112210000:120`, `:402–419`) | Sharon |
| 4.0 Sharon: school filter in the run check | **CLOSED** (before Z) | R15-SHARON-ITEMS: `audit_run_parent_check`, `20270112210000` | Sharon |
| 4.0 Sharon: F37-K06 proved by a plant | **CLOSED** (one-off, plant not committed) | SYSTEM-INTEGRITY-MATRIX.md:164 (per R15-SHARON-ITEMS) | Sharon |
| 4.0 Daisy: audit-run Tab scroll; 15 px header strip | **CLOSED** (accepted) | R15-DAISY-7ba18b03 (`087b5848`); TINJAUAN-ab4146da §B9 | Daisy |
| 4.0 Daisy: broader audit presentation | **DEFERRED → 4.5** (4.2, ruling 72) | Z-READINESS §5 | Daisy |
| Cosmetic: Kenaikan «·» join; group order | **CLOSED** | 00c71229; test Z-R15-01 | Daisy |
| Cosmetic: «Tambah Tingkat» fixed «2026/2027» | **CLOSED** (before Z) | 288cdb52 (per R15-DAISY) | Daisy |
| Cosmetic: titles breaking at 320 px | **OPEN / uncertain** | Meant to ride R-11's sweep, but Z6's sweep checks framed overflow. `layar/tempat-320.ts` covers the bar's place word (Z5 finding b). No record names the 320 px titles as closed | Daisy |
| Cosmetic: «Kursus» → «Paket» (X12) | **CLOSED** | 00c71229, 6e8c4f36; test Z-R15-01 | Daisy |
| A1-R1, A1-R2, A1-R4 (Daisy) | **CLOSED** | Z8-VERIFIKASI-B (04c78339); A1-K02, A1-J01, A1-A01, A1-A02. A1-R4's row words re-looked after merge 2 in Z3-A (`z3a-06-antrean-gerbang`) | Daisy |
| A1, Sharon's seven: reports rule | **CLOSED** | Z-VERIFY-CLOSED item 3; Z-V2-01, Z-K01-01; f970bace | Sharon |
| A1, Sharon's seven: re-check at approval | **DEFERRED → 4.5** (4.2) | Z-VERIFY-CLOSED item 2 | Sharon |
| A1, Sharon's other five | **CLOSED** (before Z) | R15-SHARON-ITEMS | Sharon |
| C1-R2, C1-R4 (Daisy) | **CLOSED** | Z8-VERIFIKASI-B; C1W-K02, Z-K05-01, C1W-S06; `layar/z8-06-sertifikat-cetak.pdf`. The printed «Predikat» line re-look is owed to **D2-R** (ruling 59 O-2 removes it); not recorded as done | Daisy |
| C1-R5: in-app / email | In-app **CLOSED**; email **DEFERRED → 4.5** (4.2, PETE-12) | Z8-VERIFIKASI-B; C1W-S06 | Daisy |
| C1w, Sharon's six: «Riwayat soal» | **CLOSED** | Z-VERIFY-CLOSED item 7 (`20270115100000:1044,1082,1019`) | Sharon |
| C1w, Sharon's six: statistics after a revision | **DEFERRED → 4.5** | Z-VERIFY-CLOSED item 4 | Sharon |
| C1w, Sharon's six: confirmer preference; one-step confirm | **DEFERRED → 4.5** (4.2) | Z-VERIFY-CLOSED items 5 and 6 | Sharon |
| C1w, Sharon's six: other three | **CLOSED** (before Z) | R15-SHARON-ITEMS | Sharon |
| B0: account closure leaves no usable admin | **CLOSED** | f505166e, 944520b0; mig 20270123170000 (Sharon PASS 1bf3e983); tests Z-R15-08, Z-R15-09, Z-R15-10, Z-R15-11. `tangguhkan_akun`: Z-VERIFY-CLOSED | Sharon |
| Staging: Daisy's session cannot reach staging | **= R-13** (OPEN) | — | — |

## Rows that are OPEN, or whose evidence I could not find

1. **R-1:** no re-check recorded after A3's start-path change.
2. **R-2:** no triage recorded.
3. **R-3:** no triage recorded.
4. **R-4 (A2B-R3):** Sharon's assessment was never recorded. The deferral to the rationalisation audit is conditional on it.
5. **R-5:** deferred to "a later batch" with no named phase.
6. **R-6:** A3-R3's full L01 ranking was "registered for Z", but Z did not build it and no deferral is recorded. The C3w-1 part is closed.
7. **R-13:** open. The certificate-sheet check is owed to D2-R 1f. The integrity count line and «Materi tanpa judul» are owed to no named phase.
8. **R-15, titles breaking at 320 px:** no closing citation.
9. **R-15, C1-R4's printed «Predikat» re-look:** implicitly D2-R, not recorded.
10. **R-28 leftovers** (K-06, K-08, K-09, T-01, T-04 … T-12, and S-06's SQL half): "Later" in SAPU-VERIFIED. They go to the ruling-79 audit only through NEXT-SEQUENCE-89 3a, whose ledger is not committed yet.
11. **R-19:** closed by a commit only, with no manifest test id.
12. **Production:** Z's deferrals are recorded against staging only. Production is still at 111, without the D-1 repair (ruling 88 note).
