# P-7 staging promotion: the record (7 Nov 2026)

**Authorised by the owner:** «PINTAR 4.0 — Owner Authorization P-7. Decision: GO for staging promotion» (7 Nov). Staging only. **Production was not touched.**

**What it carries:** Batch 9's Visual Intelligence reports as Daisy's approved compositions (D-195), her fidelity findings (KESETIAAN #1–#28), X5 (D-196) with her patch `d86f61b3`, the PD boundary (D-069, F33-P01), and migrations 199–200. The scope, the security tests and the way back are in the proposal as authorised, reproduced in the appendix.

## 1. Identifiers

| | |
|---|---|
| Candidate (audited) | `d18e24e4282c95d6c675ac6c39a752a21c906d1a`, tree `b9b71877a3f2ea3acc248f97fc96d59593d0414d` |
| CI on the candidate | run 42409386105, every job green |
| Journeys pinned to the candidate | run 42409388669, A and B green (B 79/79, C12f and C12f2 PASS) |
| PR | [#16](https://github.com/yazidmanan2409/pintar40/pull/16): 69 files, 39 commits; its own `pull_request` CI 42414983455, all 18 jobs green (not stood down as ALREADY PROVEN) |
| Merge | `main` `c4944fab7d6ffc19f9b1b41512c3fbbdca64d1fa`, a merge commit (parents `002852ab`, `d18e24e4`) |
| Promoted equals audited | `scripts/release/kandidat-sama.sh d18e24e4 c4944fab`: **SAME**, tree `b9b71877…` |
| Migrations | `staging.yml` run 42417165719, success: 198 → 200 |
| The deployed app is `main` | every walk's GS-00 (`environment-facts.yml`): staging serves `c4944fab` and its 200 migrations |

## 2. Read-only checks on staging (Supabase, project `keijhmdtsgrfvnvocfvk`)

| Check | Result |
|---|---|
| Migrations | 200, latest `20270103100000` |
| The six new functions | present; each SECURITY DEFINER with a pinned search_path; `execute` false for anon, true for authenticated; each registered in `client_rpc_registry` |
| Same code as the candidate | each function's `prosrc` md5 equals the candidate's file: murid_perlu_penguatan `6e5848c0…`, jenis_belajar_saya `fc67c321…`, sebaran_murid_kelas `87d6fe0a…`, kenaikan_awal_akhir `e897f232…`, kesiapan_kelas_per_mapel `fe3332f4…`, kelas_dikecualikan_kartu `f08a2fc8…` |
| The PD boundary (F33-P01) | `member_kind = 'LEARNER'` present in `murid_perlu_penguatan` and `sebaran_murid_kelas` |
| Metric catalogue | MC-8, closure ok; `authenticated` can call no calculator |
| Official results and certificates | 225 and 60 before the walks, unchanged by the promotion |

## 3. Staging walks

Every write in the walks is a press of PINTAR's own buttons.

### Sekolah Uji P7 1107 (`sekolah-uji-p7-1107`, founded by run 42418290195)

| Walk | Run | Result |
|---|---|---|
| GS-01–03 | 42418365951 | GREEN |
| GS-04–11 | 42418693860 | GREEN |
| GS-07, GS-12–16 | 42419553396 | GREEN |
| GS-17–21 | 42420187718 | **16 PASS, 2 FAIL: a defect in the walk's reader, not the product (below)** |

**The two failures, explained.**
- **L4** (the school admin's «Kelas 5A» summary): the walk read «Mantap» 0, «Berkembang» 0, «Perlu penguatan» 0 and three unexpected rows «Mantap 2 murid (40%)» 240, «Berkembang 2 murid (40%)» 240, «Perlu penguatan 1 murid (20%)» 120.
  - The page drew exactly the expected bands: 2, 2 and 1.
  - Since the legend amendment (`a2291edf`), each legend row reads «{band} **{n} murid ({p}%)**». The walk's reader took the band with the count still attached, and every digit of «2 murid (40%)» as the count (240).
  - The same figures passed for the teacher (L1), the Kepala departemen (L2) and the Dekan (L3), whose panels use a different markup.
  - **Fix:** `029cd1d1`, in the walk only. The band is the row's words without its `<strong>`; the count is the strong's first number. The expected values are unchanged. Checked against the composition's markup (the three rows read 2, 2, 1).
- **X1** (no session left open) followed from L4: the step threw before its «Keluar», so the admin's session stayed open. Every other session closed.
- The rest of GS-17–21 passed on this school: the certificate and its eligibility (C1–C3), the card re-issue (R1), recovery by email and by PINTAR ID and PIN (R2, R3), the class computer and the shared browser locks (U1, U2, U2a), the public check (V1, V2) and the late learner (N1, GS-22).
- **Why a second school:** GS-22 runs once per school and had added «Fajar», so the read-only recipe no longer holds on this school for a second GS-17–21 (the P-6 lesson). The walk of record is on a second fresh school.

### Sekolah Uji P7B 1107 (`sekolah-uji-p7b-1107`, founded by run 42422230751): the walks of record

| Walk | Run | Result |
|---|---|---|
| found-school (GS-01) | 42422230751 | GREEN; its GS-00 confirms staging serves `c4944fab` and 200 migrations |
| GS-02–03 | 42422293957 | GREEN |
| GS-04–11 | 42422594024 | GREEN |
| GS-07, GS-12–16 | 42423269331 | GREEN |
| **GS-17–21** (with the reader fix `029cd1d1`) | **42424027157** | **GREEN, 18/18.** L4 reads the admin's «Kelas 5A» bands as Mantap 2, Berkembang 2, Perlu penguatan 1; X1 none left open |
| Studio end to end (other school: Sekolah Uji P7 1107) | 42425742473 | GREEN, 19/19 |
| Batch 5 walk | 42426258818 | GREEN, 6/6 (K4: the Dekan's class report in the staff shell and printed) |
| **X5 walk** (new, `golden-school-pd.mjs`) | **42428273364** | **GREEN, 9/9** (below) |

**A note on L4's evidence line.** On the class composition, «Peserta» is the labelled population line and «Pemahaman» the topic section's lead, neither with a separate number element, so the walk matches the expected value within that figure's own element, and its log prints the value blank. The check is still per figure, not per page.

## 4. The reports, PD reports, X5, mobile and A4

**The academic reports on staging** (P7B, every reader by their own sign-in):
- the teacher's «Lihat bukti» and each learner's «Hasil resmi» (L1);
- the Kepala departemen's «Per kelas» panel: «Peserta» 5, «Pemahaman» 78%, «Kenaikan» +38 poin, the bands 2/2/1 (L2);
- the Dekan's school figures, withheld below their minimum, and the school summary (L3);
- the admin's school and class summaries from Konfigurasi «Laporan» (L4);
- the Dekan's class report inside the staff shell, and printed with no navigation (Batch 5 K4);
- each learner's objectives not yet reached (Batch 5 K5);
- the refused: another school's node and `/pimpinan` for the wrong readers (L1–L4).

**X5 on staging: the first professional-development class staging has held.** Before 8 Nov no org_node on staging was a class of participants. The walk built one the way a school admin does, and every write was a press of PINTAR's buttons.

| Step | What | Result |
|---|---|---|
| D1 | «Pengembangan Guru» (for educators) → «Angkatan Guru 2026» → «Kelas Pengembangan A» on Struktur sekolah | all three PROFESSIONAL_DEVELOPMENT, the Kelas a class of participants |
| D2 | facilitator, PD Kepala departemen and a second Guru on Pendataan, Aktivasi and Peran & akses | 3/3 recorded, accounts, roles |
| D3 | the Guru of «Kelas 5A» and the second Guru enrolled («Daftarkan sebagai peserta» → PD_ENROLLED) | both participants; no person, account or number made; «Kelas 5A» not offered as a PD place |
| D4 | the summary by the facilitator, the PD Kepala departemen, the Dekan, and the admin from Konfigurasi «Laporan» | each: the summary's mark, the owner's sentence, both participants alphabetical, no academic mark, nothing promised; «Belum diberi paket: …» |
| D5 | the Kepala departemen of «Kelas Tinggi» and the Guru of «Kelas 5A» (a participant), on the summary's own address | no participant named, no academic mark |
| D6 | 390 px | 390 px wide on a 390 px screen |
| D7 | A4 | printed, no navigation; the sentence and both participants; one page; the PDF is in the run's artifact (`d7-ringkasan-pengembangan-a4.pdf`) |
| X1 | everyone signs out | all six |

**Not walked on staging, and why:** the record's per-package table (steps and results) needs a published professional-learning package sat by a participant. That path is walked on the exact candidate in the journeys (job B, C12c–C12f2, run 42409388669). On staging, the participants read «Belum diberi paket».

**The walk's own defects on its first runs** (none in the product):
- **Run 42426680421:** D1 looked for the Tingkat only directly under the Bagian. Struktur sekolah keeps a hidden «Reguler» level between them. Fixed in `67a48f18`.
- **Run 42427201822:** this run built D1–D3 and passed for the facilitator, the Dekan, the admin, 390 px and A4.
  - The two Kepala departemen hold Mengajar and Mengelola and landed on the chooser, and the walk had not chosen. So the PD Kepala departemen's D4 read the chooser, and the other Kepala departemen's D5 "refusal" passed on the chooser, which meant nothing.
  - Fixed in `9a97bb54`: each reader chooses its purpose, and a refusal counts only on `/edukator/ringkasan`.

**Screenshots for Daisy:** the artifacts of runs 42428273364 (X5: `d4-*`, `d5-*`, `d6-fasilitator-390`, the A4 PDF) and 42424027157 (the academic reports).

## 5. Remaining defects and open items

- **Product defects found in P-7:** none.
- **Walk defects found and fixed:** the legend reader (`029cd1d1`), the hidden level (`67a48f18`), the context chooser (`9a97bb54`).
- **Still open:**
  - UX1-UB-ALUR-01's single failure on `99494abd`, and journeys job B's 21-minute stall on `99494abd`. Neither recurred.
  - The platform administrator's report boundary (dossier check 5).
  - A person's screen-reader pass (W6.12).
  - W6.2 and W6.8 from the region.
  - Dr Gladys's words for the reports (G6, B10, B28).
  - Daisy's closure of X5-1–X5-9 and her review of staging.
  - **No person has seen staging yet.**
  - Human journey acceptance for any batch.

## 6. Final staging state

- `main` `c4944fab` (= audited `d18e24e4`, SAME), 200 migrations, MC-8; staging serves that commit (every walk's GS-00).
- **Written by the walks, through the product's buttons only:**
  - two new Golden Schools, «Sekolah Uji P7 1107» and «Sekolah Uji P7B 1107», with their staff, learners, official results and certificates;
  - Studio's package on P7B;
  - one revoked certificate (Batch 5 K1);
  - P7B's professional-development place, its three new staff and two participants.
- **Not touched:** production; Dr Gladys's school; the evaluation schools.

**Re-frozen.** No further staging promotion without the owner's authorisation.

---

## Appendix: the proposal as authorised (7 Nov)


### Scope (39 commits on `claude/awesome-rubin-bqxp6p` beyond `main` `002852ab`)

**Batch 9: the Visual Intelligence reports, as Daisy's approved compositions (D-195)**
- 2-guru Ringkasan Kelas, including:
  - Section E, the class's learners in «Perlu penguatan» by name, for the class's teacher only;
  - the score strip (one anonymous dot per learner, teacher only);
  - Pemetaan Awal → Uji Penguasaan over Kenaikan's own pairs, or «Belum dapat dibandingkan».
- 3-kadep, the topics × classes grid: bases, the Kenaikan row, 10 classes, A4 landscape.
- 4-dekan Ringkasan Sekolah, with readiness per subject over each subject's own classes.
- 1-murid «Hasil belajar» (`/belajar/hasil`).
- 6-fasilitator, the professional-learning record: alphabetical, nothing added up.
- 5-peserta, the who-may-see sentence.
- 7-admin, the reasons inside «Yang menunggu», and in Aktivasi the class-card exclusions counted by one reason each.

**KESETIAAN:** Daisy's fidelity findings #1–#28 (`8cfc75b5`), plus the section-letter and legend amendments (`40764f54`, `a2291edf`).

**X5 (D-196):** a PD class's Ringkasan Kelas is the owner's sentence plus the professional-learning record. Daisy's X5-1–X5-9 (`c4011570`) are reconciled.

**Boundary:** a PD class is never named or drawn by result (D-069, F33-P01).

**Daisy's X5 patch** (`d86f61b3`) integrated against the newer engineering work (`batch-9/kesetiaan-implementasi.md`).

**Defects fixed on the way:**
- the participants figure lost its label (S23t);
- the «not yet» state did not say what makes figures appear (DAISY-07-LAPORAN-02);
- the PD table's A4 print;
- the runner's port refusal at stack start (local-stack retry).

**Records:**
- D-195 and D-196;
- the ledger (§3b);
- the register (W1.2 and W3.8 verified);
- W6.2/W6.8 attribution (w69 §2d);
- ROLLBACK-199-200.sql.

**Database:** two new migrations, both adding new read-only functions only:
- **199** `20270102100000`: `murid_perlu_penguatan`, `jenis_belajar_saya`;
- **200** `20270103100000`: `sebaran_murid_kelas`, `kenaikan_awal_akhir`, `kesiapan_kelas_per_mapel`, `kelas_dikecualikan_kartu`.
- Each function is SECURITY DEFINER with a pinned search_path, `execute` revoked from public and anon, and registered in `client_rpc_registry` with its authorisation shape.
- Neither migration replaces, alters or writes anything else. The metric catalogue stays MC-8.

### Candidate

| | |
|---|---|
| Candidate (exact commit) | `d18e24e4282c95d6c675ac6c39a752a21c906d1a` (39 commits beyond `main`) |
| Its tree | `b9b71877a3f2ea3acc248f97fc96d59593d0414d` |
| Merged into `main` `002852ab` (`git merge-tree`, re-checked 20:48 UTC) | the same tree, `b9b71877…`, byte for byte: no conflict. `kandidat-sama.sh` should read SAME after the merge commit; it is re-run at merge time in case `main` moves |
| CI (`ci.yml`) on the candidate | **run 42409386105, every job green**: install, lint, typecheck, build; migrations on a clean database and previous → HEAD; the strict full manifest on a reset local stack; the planted-defect red cases; the verdict |
| Journeys pinned to the candidate (`audit-journeys.yml`, `ref` = the SHA) | **run 42409388669, A and B green.** A: every role's screens, including S23, S23t and the A4 reports walk. B: Gladys's path, 79/79, including C12f and C12f2 |
| Local, on the candidate's content | Typecheck and lint clean. Database suites F32/F33 8/8; report suite 11/11. With the database, app and network wired in, the local full suite ran 853 tests with 5 failures (TOUR-P01, BOB06-R01, F22-K01, D101-D01, D102-D01). Each was reproduced on a clean reset and passes, F22-K01 when run in its normal order after FABLE-05: the failures came from local database state, not the code. F01-R07 passes with the app wired to the database |

### Security tests carried by the candidate

Each was shown failing with its rule removed:
- F32-E01/E02: the named list, the teacher of the class only;
- F33-S01: the score strip, the teacher only, with no identity;
- F33-K01: the pair equals Kenaikan; a class under the minimum gets nothing;
- F33-R01: readiness per subject; no learner data; another school's Dekan and a teacher get nothing;
- F33-A01: the exclusion counts; a teacher gets nothing;
- F33-P01: a PD class's facilitator gets no name and no dot.

Standing guards in CI: the client-RPC registry, the planted-defect red cases, and the sensitive scan on every commit.

### The way back

- `docs/completion-4.0/batch-9/ROLLBACK-199-200.sql`: the schema's way back from 199–200 to 198, in one transaction.
- It refuses a database that is not at 198–200.
- Rehearsed locally from 200 and from 199 only, run twice, then re-applied with `supabase migration up`.
- The app's way back is redeploying `main` `002852ab`.
- No data is written by either migration, so nothing is lost by going back.

### The promotion, once authorised (in this order)

1. Open a PR from the branch into `main`. Its `pull_request` CI must run in full and go green. (P-6 lesson: a PR's CI that stands down as ALREADY PROVEN does not satisfy the ruleset.)
2. Merge, as a merge commit.
3. `kandidat-sama.sh` against the candidate: it must read SAME.
4. `staging.yml` runs on the push. It applies 199–200, and the migration count must be 200.
5. Read-only checks on staging:
   - 200 migrations;
   - the six functions present, with grants and registry rows as in the migrations' own final checks;
   - official results and certificates unchanged in count.
6. Staging walks:
   - GS-07, GS-12–16;
   - GS-17–21 on a school **not yet walked past GS-21** (P-6 lesson);
   - the reports walk.
7. Record the evidence in `staging-p7.md`. Re-freeze.

### Earlier candidates, not promoted
| Candidate | Result | What changed next |
|---|---|---|
| `547dad95` | runs cancelled, superseded | Daisy's X5 patch integrated |
| `99494abd` | CI 42405651774: 873 passed, 1 failed, UX1-UB-ALUR-01. Journeys 42405654393: A green; B passed through S26e, including C12f and C12f2, then printed nothing for 21 min and was cancelled when the next run started | `d18e24e4`: UX1-UB-ALUR-01 now reports where the two pages differ (the assertion is unchanged); everything green on that commit |

#### Open: two intermittent results, not explained
- **UX1-UB-ALUR-01** failed once on `99494abd` and passed on `bd4c2c06`, `d18e24e4` and a fresh local database. It compares the refusal for a feedback round a learner was not asked for with the refusal for a round that does not exist.
  - Hypothesis, not confirmed: something page-wide that changes between two loads (the root layout's live maintenance countdown).
  - The test now says where the pages differ, so a recurrence names its cause. A leak of the round would be a security defect, and the fresh-database run shows none.
- **Job B's stall on `99494abd`:** 21 minutes with no output after S26e. S26f's waits are all bounded. On `d18e24e4` S26f took 90 seconds. Not reproduced, so not explained.

### Blockers and what is not claimed

- **Not authorised:** merge, staging deployment, production. This proposal asks only for steps 1–7 on staging.
- **Human journey acceptance:** none recorded for any batch (ledger §3b). The automated journeys do not stand in for it.
- **W6.2 and W6.8 stay OPEN, NOT MET as measured.**
  - The application and database open every first screen in ≤ 492 ms on one machine.
  - Staging's 2.5–3.2 s and the 1.8 s save p95 are the distance between GitHub's US runner and the proxy.
  - A regional measurement needs a runner or a person in the region (an owner provision). It is best taken after this promotion, on the promoted build.
- **Copy:** Dr Gladys's words for the reports (G6, B10, B28), including X5-2's reordered sentence, are open.
- **Daisy:** the one case X5-5 does not cover (a package with no sealed mark shows its share) is raised to her.
- **Seen by a person on staging:** nothing yet. The staging host is not reachable from this environment.
