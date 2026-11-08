# PINTAR 4.0: status report (8 Nov 2026)

**`main` and staging:** `c4944fab` (P-7, PR #16), migration **200**. The branch `claude/awesome-rubin-bqxp6p` holds the
same app code plus staging-walk scripts and records only. **Production:** not touched in 4.0 (migration 111, app
`5b5b68d`; its database not read since 23 Sep).

**Sources:**
- the open work register `C-OPEN-WORK-REGISTER-2026-11-02.md` (101 rows);
- the acceptance ledger `H-ACCEPTANCE-STANDARD-AND-LEDGER.md` §3b (7 Nov, from evidence only);
- the promotion records `batch-8/evidence/staging-*-p1/p2.md` and `batch-9/evidence/staging-p5/p6/p7.md`;
- `F-OWNER-DECISIONS-REQUIRED-2026-11-02.md`, `batch-0/07-MIGRATION-162-BRIEF.md`;
- `DECISIONS.md` up to D-196;
- the previous report, `STATUS-REPORT-2026-11-05.md`, and the updates of 5–6 Nov.

> **What changed since 5 Nov, in one line:** the branch is no longer ahead of staging. Seven promotions (P-1 to P-7) took
> everything built, through Batch 9's reports and X5, onto staging, each one proven identical to the commit that was
> tested. What is left is acceptance by people, words and designs from others, and the owner's release gates.

---

## 1 · Where we are, in one paragraph

**On staging, verified:**
- every batch built so far (0–6, 8's proofs, 9's reports), at 200 migrations;
- since 5 Nov: the certificate and Digital Card, A4 print, the integrated navigation, the Konfigurasi split, the
  identity-email frames, the D-183 exposure flag, the people pickers at scale, transfers that place the learner in a
  class, the paired «Kenaikan» (MC-8), the Inter wordmark, and Batch 9's Visual Intelligence reports as Daisy's
  approved compositions, including X5's professional-development class summary.

**Verification of the last promotion (P-7, 7–8 Nov):**
- the merged tree equals the tested candidate `d18e24e4` (SAME);
- staging's six new database functions are byte-equal to the candidate's;
- two fresh schools walked from GS-01 to GS-21, plus Studio end to end and the Batch 5 walk: all green on the school of
  record;
- X5 walked on staging for the first time (staging had no professional-development class before 8 Nov): **9/9 green** (run 42428273364). Every audience reads it as D-196 has it, the refused are refused, and it holds at 390 px and in A4.

**What 4.0 still needs:**
- acceptance by people: no batch is fully accepted (ledger §3b), and no person has walked any journey on staging;
- the words (Dr Gladys) and the last designs (Daisy);
- W6.2 and W6.8 measured from the region, and the two screen-reader passes on real devices;
- the owner's and counsel's release gates (capacity, recovery, legal, production email and DNS, the production
  upgrade rehearsal).

---

## 2 · What is done

### 2.1 Promotions since 5 Nov (each owner-authorised, staging only)

| Promotion | PR | `main` | Migrations | What it carried |
|---|---|---|---|---|
| P-1 | #10 | `38d7e701` | 194–196 | Batches 6 and 8, Daisy's design-completion builds, the retrospective's corrections |
| P-2 | #11 | `12d357ce` | — | the Konfigurasi audit read, Node 22, the restore posture, harness fixes |
| P-3 | #12 | `4d325a33` | — | W9.19 (the proxy checked the session token itself): **a regression**, see §5 |
| P-4 | #13 | `d672a94a` | — | W9.19 reversed; the journeys pinned to the exact candidate |
| P-5 | #14 | `ebc53ee2` | 197 | transferred learners placed in a class; certificates kept after the year changes; the Inter wordmark |
| P-6 | #15 | `002852ab` | 198 | «Kenaikan» paired within each chapter (MC-8); several classes' cards in one press; «Soal wajib» |
| **P-7** | **#16** | **`c4944fab`** | **199–200** | **Batch 9: the reports (D-195), Daisy's fidelity findings (KESETIAAN), X5 (D-196)** |

Since P-4, every promotion is gated the same way:
- CI and the journeys run on the candidate's exact SHA;
- the PR's own CI runs in full;
- a merge commit;
- `kandidat-sama.sh` must say SAME;
- the read-only checks on staging;
- the walks on a fresh school.

### 2.2 P-7 in detail

| Check | Result |
|---|---|
| Candidate CI / journeys | 42409386105 / 42409388669: green (journeys B 79/79, C12f and C12f2 PASS) |
| PR #16 CI | 42414983455: all 18 jobs green |
| Promoted equals tested | SAME, tree `b9b71877…` |
| Migrations | `staging.yml` 42417165719: 198 → 200 |
| Read-only checks | six functions SECURITY DEFINER, search_path pinned, anon refused, registered; md5 equal to the candidate; the PD guard present; MC-8; 225 official results and 60 certificates unchanged by the promotion |
| Sekolah Uji P7 1107 | GS-01–16 green. GS-17–21: 16/18. **The two failures were in the walk, not the product** (§5) |
| **Sekolah Uji P7B 1107 (of record)** | GS-01–03, GS-04–11, GS-07/12–16 green; **GS-17–21 18/18** (42424027157); **Studio 19/19** (42425742473); **Batch 5 6/6** (42426258818) |
| **X5 on staging** (new walk) | **9/9** (42428273364). The admin built the place by Struktur sekolah, Pendataan, Aktivasi, Peran & akses and «Peserta pengembangan profesi». The facilitator, the PD Kepala departemen, the Dekan and the admin (from Konfigurasi «Laporan») each read the owner's sentence and both participants alphabetical, with no academic mark. Another department's Kepala and a participant Guru are refused. 390 px; A4, one page. Two earlier runs failed on walk defects, fixed (§5) |

Full record: `batch-9/evidence/staging-p7.md`.

### 2.3 Batch 9: the reports (D-195, D-196)

| Surface | What it is | Evidence |
|---|---|---|
| Ringkasan Kelas (2-guru) | the class composition; learners in «Perlu penguatan» by name, for the class's teacher only; one anonymous dot per learner; Pemetaan Awal → Uji Penguasaan over Kenaikan's own pairs | F32-E01/E02, F33-S01, F33-K01; LAPORAN-KELAS-01–03; S23t |
| Pimpinan grid (3-kadep) | topics × classes, the Kenaikan row, A4 landscape | LAPORAN-KISI-01 |
| Ringkasan Sekolah (4-dekan) | readiness per subject over each subject's own classes | F33-R01; LAPORAN-SEKOLAH-01/02 |
| «Hasil belajar» (1-murid) | the learner's own report | LAPORAN-MURID-01 |
| Professional-learning record (6-fasilitator) | alphabetical, nothing added up | LAPORAN-FASILITATOR-01; C12f |
| Who may see (5-peserta) | the sentence on a PD result | LAPORAN-PESERTA-01 |
| «Yang menunggu», Aktivasi (7-admin) | the reasons; the class-card exclusions by one reason each | F33-A01; B4-W8 |
| **X5** (D-196) | a PD class's Ringkasan Kelas: the owner's sentence and the record, never an academic figure | LAPORAN-KELAS-PD-01, F33-P01, C12f2; **on staging: 9/9** (42428273364) |

Daisy's reviews are reconciled: fidelity #1–#28 and X5-1–X5-9; her X5 patch `d86f61b3` integrated
(`batch-9/kesetiaan-implementasi.md`).

### 2.4 The register (101 rows), counted from its status column

| State | Rows |
|---|---|
| Verified on staging | 40 |
| Verified in CI or on the branch (since P-7 the branch's code is staging's) | 26 |
| Partial or partly implemented, implemented but not verified, rendered, published, in progress | 11 |
| Open, measured and not met (W6.2, W6.8) | 2 |
| Blocked on the owner or an external party | 16 |
| Not started (W4.3, W9.8, W9.10, W9.12 break-glass, W9.17) | 5 |
| Per batch (W6.11, second reviewer) | 1 |

> **Brought up to P-7 with this report's commit:** the register's W3.8 (it said «not on staging») and the ledger's
> Batch 9 row (it said «passed on the branch, not on staging»).

---

## 3 · What is open

### 3.1 Engineering work that is not blocked: the next things I do

| Order | Item | What it takes |
|---|---|---|
| 1 | **The platform administrator's report boundary** (dossier check 5 gap): «Seluruh platform» opening a class or school report | a test in CI and a staging walk step |
| 2 | **UX1-UB-ALUR-01**, the intermittent refusal comparison (failed once on `99494abd`) | it now prints where the pages differ; root-cause it on the next recurrence |
| 3 | The X5 staging walk with a published PD package (the per-package table on staging) | Studio's PD path on staging, then the sitting |
| 4 | Integration dossiers for Batches 1–6 in the ledger's §2 form (only Batch 9's exists) | gathering what the walks and suites already show |
| 5 | W6.9 release checklist re-rendered on `c4944fab` | after 1–4 |
| — | W2.13 «nomor induk» residue, W4.3 copy review, W4.4 review | the builds are ready; they wait on the words (§3.3) |

### 3.2 Waiting on the owner (decisions and actions)

| # | Decision or action | What it unblocks | Where |
|---|---|---|---|
| **F-5 / F-18 → W9.10** | **The production upgrade path and its rehearsal**: production is at 111 and needs 112 → 200 (89 migrations) with the app in one window; rehearse first on a restore of production's backup to a temporary project (billable) | any production release | `batch-0/07-MIGRATION-162-BRIEF.md`; §5 below |
| F-6 | Name the second production SYSTEM_ADMIN and custodian B | J1.2, J1.5, W6.6 (the PINTAR-standard chain), W9.7, break-glass | F-6 |
| F-15 | Capacity: first deployment size, compute tier, Auth IP forwarding | W9.3, W9.4; W6.8's load figure at the real tier | F-15 |
| F-14 | #150 owner actions (O2 token, escrow). **Staging Storage still has no independent backup** (D-190) | W9.1, W9.5, W9.6 | F-14 |
| F-17 | Support tiers; pilot mail capacity; separate staging and production mailboxes | W9.16, W9.17 | F-17 |
| W9.13 / W9.15 | Production SMTP password, Auth settings, SPF/DKIM/DMARC; DNS `verifikasi.pintarselalu.com` | production email, public certificate check | register |
| W6.2 / W6.8 | **A regional measurement**: a runner or a person in Indonesia (the app and database answer in ≤ 492 ms co-located; the delay is the US runner's distance) | closing W6.2 and W6.8 | `batch-8/evidence/w69-bukti-pemeriksaan.md` §2d |
| W6.12 | A person with NVDA (Windows) and TalkBack (Android) | the two screen-reader passes | the W6.12 script |
| Human acceptance | **The owner's or an evaluator's recorded walks on staging**, per journey | the «human journey accepted» gate for every batch | ledger §3b |
| D-194 | Evaluator invitations for Dr Gladys's team: **not before the complete readiness gate** (owner, P-7) | her walkthrough | `batch-9/evaluator-accounts.md` |
| W5.3 | Branch protection on `main`: the register says BLOCKED, though every merge since Batch 1 went through a protected PR. Confirm it is in force | the record | register |
| W0.3, W1.15, W2.20 | the staging freeze record; Dr Gladys's Studio notes (F-19); a production school-founding path (F-9) | the record; D-141(b); W2.20 | register |

### 3.3 Waiting on others

| Who | What | Blocks |
|---|---|---|
| **Daisy** | Close X5-1–X5-9 on the evidence sent (prompt via the owner); review the staging experience and record any remaining fidelity issue; the one case X5-5 does not cover (a package with no sealed mark shows its share) | the design gate for Batch 9; Second Eye on staging |
| **Dr Gladys** (via the owner, in writing) | The question pack (Part A, Part B B1–B38); the report titles and words (G6, B10, B28), including X5-2's reordered sentence; X12 «paket / kursus» | W4.2, W4.3, W2.13, W2.14; the reports' copy |
| **Counsel** (F-16) | UU PDP, PSE registration, controller and processor, retention, parental consent; content rights | **W9.11, the legal gate before any real school**; real assessment content (E-K6-1) |

---

## 4 · What is left for a complete 4.0

1. **Acceptance by people** (ledger §3b): the owner's or an evaluator's recorded walks per journey; Daisy's design
   gate per batch; the integration dossiers. Engineering verification is passed for Batches 0–6 and 9 and partial for 8.
2. **The words and the last designs land** (Dr Gladys, Daisy). Each lands as copy keys in `src/lib/hle.ts` plus the
   tests already waiting for it; the screens are built.
3. **Batch 8's last proofs:** W6.2 and W6.8 from the region; W6.12's two device passes; the checklist re-rendered.
4. **Then Dr Gladys's walkthrough** on the evaluation schools (D-194), once the readiness gate is met.
5. **Batch 9–10, release readiness:** capacity (F-15); recovery: backups, escrow, second administrators, break-glass
   (F-6, F-14); **the production upgrade rehearsal** (F-5, F-18); production email and DNS; support; **the legal gate**
   (F-16); the production watch.
6. **Production release:** a separate owner authorisation, after all of the above.

**Critical path:** human acceptance and the words (Dr Gladys) → counsel (F-16) → the production upgrade rehearsal and
capacity (F-18, F-5, F-15) → recovery (F-6, F-14). Engineering is not the bottleneck.

---

## 5 · Risks to know

- **The production upgrade is the largest single risk left.** Production holds 111 migrations and an app seven weeks
  old; reaching the candidate is 89 migrations in one jump, never run against production's real data. Known hazards
  (`batch-0/07`):
  - **139** converts stored pass marks and fails on any non-numeric or percentage value;
  - **155** fails on any structure node without a learning context;
  - **162** checks the whole catalogue;
  - **127** sends every existing account, the sole admin included, through setup again;
  - **149/153/154** add sign-in and per-request checks whose defect would block every user;
  - the old app breaks on a database at 162 or later, so database and app must move together.

  The rehearsal on a restored copy (F-18) turns each into a known quantity; without it the upgrade is a gamble.
- **No person has walked staging.** Every green above is an automated walk. The owner's own rule: automated journeys do
  not stand in for human acceptance.
- **P-3 shipped a session regression to staging for about four hours on 6 Nov** (W9.19: a session ended elsewhere stayed
  signed in). It was caught by the staging walks, reversed in P-4, and the gap that let it through (journeys tested
  `main`, not the candidate) is closed by the SHA-pinned journeys and `kandidat-sama.sh`.
- **Walk defects look like product defects at first.** In P-7 three were walk-side (the legend reader, the hidden
  «Reguler» level, the context chooser) and each was traced before any conclusion. A walk failure is investigated, never
  re-run until green.
- **Two intermittent results are unexplained:** UX1-UB-ALUR-01 (once) and journeys job B's 21-minute stall on
  `99494abd` (once). Neither recurred on the promoted candidate.
- **Staging Storage has no independent backup** (D-190). The database has Supabase's own backups; uploaded files do not.
- **Real assessment content stays blocked** until counsel and K6's residency answer (E-K6-1); the exposure flag keeps the
  exposed chapters from giving a real verdict.

---

## 6 · Milestones since 5 Nov

| Date | Commit or run | What |
|---|---|---|
| 5 Nov | `38d7e701` (P-1) | Batches 6 and 8 and Daisy's builds on staging; migrations 194–196 |
| 6 Nov | P-2 → P-4 | Node 22; W9.19 promoted, found to keep ended sessions alive, reversed within the day; journeys pinned to the exact SHA |
| 6 Nov | 42174482669 | W9.12: a restored copy passes 24/24 launch-readiness checks |
| 7 Nov | `ebc53ee2` (P-5) | transfers placed in a class (197); the Inter wordmark (D-193); evaluator access prepared (D-194) |
| 7 Nov | `002852ab` (P-6) | «Kenaikan» paired within each chapter (198, MC-8) |
| 7 Nov | D-195, D-196 | the reports' open questions closed; X5 ruled |
| 7 Nov | `d18e24e4` | the P-7 candidate: Batch 9's reports, KESETIAAN, X5, Daisy's patch; CI and journeys green on its SHA |
| 7 Nov | `c4944fab` (P-7) | merged, SAME, migrations 199–200 on staging |
| 7–8 Nov | Sekolah Uji P7B 1107 | GS-01–21, Studio and Batch 5 green on staging; X5 walked on staging for the first time |
