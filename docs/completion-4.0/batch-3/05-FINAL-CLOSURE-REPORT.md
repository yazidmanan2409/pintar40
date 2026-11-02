# Batch 3 · Final closure pass and outstanding-item register (2 Nov 2026)

**Authority:** owner, 2 Nov: «PINTAR 4.0 — BATCH 3 FINAL CLOSURE — Decision: CONDITIONAL GO — BATCH 3 ONLY» (D-150). It follows the staging verification accepted as PASS under D-149.

**Owner rulings given in this pass (2 Nov):**
- **F-7:** teachers with CAN_DRAFT browse their own school's Question Bank. Question Health signals stay with the head of department (the recommended option).
- **Daisy's items:** W1.2, D1 and D3 are registered as awaiting Daisy. Her design branch has had no new commits since 8 Oct (`cc96030`), and she cannot be reached from this session.

**Branch:** `claude/awesome-rubin-bqxp6p`.
- Nothing was merged to `main` or deployed to staging.
- Production and Dr Gladys's demonstration records were not touched.
- The staging freeze is unchanged.
- No Batch 4 work.

## Verdict: closure pass complete. STOP at the Batch 3 final acceptance gate.

Items 1, 2, 3, 5, 6 and 7 are done and proved locally. Item 4 cannot be done in this session, so its three items are registered as awaiting Daisy. They keep Batch 3 short of full acceptance (§5).

| # | Owner's item | Result |
|---|---|---|
| 1 | Studio home: a superseded version stays in history but is no separate package and no pending count | **DONE** (§1.1) |
| 2 | The Siapkan badge agrees with «Sediakan» | **DONE** (§1.2) |
| 3 | F-7, school isolation, the Question Health boundary | **DONE** (§1.3) |
| 4 | Daisy's W1.2; the D1/D3 decisions | **NOT OBTAINABLE IN THIS SESSION: registered as awaiting Daisy** (§5) |
| 5 | J1Terbit and J5 against Daisy's compositions: class materials and navigation first | **DONE** where she has a composition (§1.4) |
| 6 | Focused tests per correction; the Studio and regression journeys again | **DONE** (§2) |
| 7 | Final evidence and the outstanding-item register | This document; `evidence/sisi-penutupan/` |

## 1. The corrections

### 1.1 Defect 1: a superseded version is history, not a task (W1.7)

**Cause:**
- After a send-back and correction, the version the correction replaced keeps its draft status for ever.
- Nobody can act on it any more: a correction is made only through the newest version of a line (REVISION_NOT_LATEST).
- Yet Studio home listed it as its own package «Sekarang: Susun isi».
- `studio_home` counted it in «Menunggu tindakan Anda», and counted a blocking finding left on it in «Tertahan».

**Fix:**
- Migration `20261216100000_a_superseded_version_is_history.sql` re-emits `studio_home`. It is the same function with one condition added to each package bucket (ACTION_REQUIRED, AWAITING_MY_REVIEW, BLOCKED): count only the newest version of each line.
- The function keeps its security definer, its pinned `search_path`, its grants and its registry row, and the migration's own check confirms each one.
- Studio home's package list leaves out every course another course supersedes (`src/app/studio/page.tsx`).
- The replaced version is untouched: its rows, outcomes and findings, and the correction's note naming it, all stay. «Riwayat perbaikan» still lists and opens it.

### 1.2 Defect 2: the Siapkan badge (W3.11)

- After «Sediakan», the card's corner badge said «Belum disediakan» while the page said «✓ Disediakan».
- It now shows the class's own state of the material, read from the database exactly as the class page reads it (`statusMateri`).
- That state is «Tersedia», or «Dijadwalkan» when «Mulai» is in the future. «Belum disediakan» shows only before «Sediakan».

### 1.3 F-7: the Question Bank for the teachers who author (W1.11, J4.8)

**What changed:**
- `src/lib/studio-tab.ts`: the «Bank Soal» tab is offered for CAN_DRAFT or CAN_REVIEW_QUESTION_HEALTH. Before, it was offered for CAN_REVIEW_QUESTION_HEALTH only.
- `src/app/studio/bank/page.tsx`:
  - lists only the schools whose bank the reader browses;
  - reads keys and reasons where the reader holds CAN_DRAFT (as before);
  - shows Question Health only where the reader holds CAN_REVIEW_QUESTION_HEALTH: its state, the evidence figures and the review form.

**No database change was needed.** The row security already draws both boundaries, and F23-W07 now measures them:
- `items` and `item_options` are CAN_DRAFT's, school by school;
- `question_health` is CAN_REVIEW_QUESTION_HEALTH's.

**What F23-W07 proves:**
- The school's Guru reads its questions and every key with its reason.
- The Guru reads no question or option of another school.
- The Guru reads no `question_health` row and gets no Question Health count.
- The head of department still reads the school's signal.
- Another school's administrator reads none of the school's questions.

**Restated tests:** PENUTUPAN-T01 (the Guru's tabs now include Bank Soal) and the staging journey's Q1 (it asserted the old rule), both marked «RESTATED FOR F-7». Neither is weakened: each now asserts the new rule, and the new boundaries are asserted in addition.

### 1.4 J1Terbit and J5 against Daisy's compositions

Her compositions are from `origin/ux-1/daisy-experience`, unchanged since 8 Oct.

| Where | Daisy | Before | Now |
|---|---|---|---|
| Class page, «Materi untuk kelas ini» (J1 step 7) | «✓ Tersedia» as the done Badge; the line under it | «Tersedia» neutral; two bare dates | «✓ Tersedia» (`pin-ok`), «Dijadwalkan» and «Selesai» neutral; the window in words: «Mulai 3 November 2026 · Sampai 3 Desember 2026», or «Tanpa batas akhir» |
| After «Sediakan» (J1 steps 6→7) | «✓ Disediakan», «Materi disediakan untuk kelas ini.», then the way on, «Kelas 5A», to the class page | The same | **No change needed.** The walk now follows the way on and checks the class page (U10). |
| Siapkan's card (J1 step 6) | No badge on the material | «Belum disediakan» even after the act | §1.2 |
| J5, the review before «Sediakan» | «Disediakan untuk **Kelas 5A** · 31 murid terdaftar hari ini» in the review panel | A third column of the window's fields | In the review panel, above the consequence; the window has its two date fields |
| J5, the window | Mulai; Sampai (opsional); the date in words under each; the error under «Sampai» | Already matched (Batch 3, MENGAJAR3-JENDELA-01) | Unchanged |
| Studio home (J1 step 3) | One row per package, «✓ Terbit» or «Sekarang: …» | Matched, except defect 1 | §1.1 |

**Left as they are (Daisy's questions, not regressions):**
- J5's live «Jendela: …» line in the review. It would need a client-side echo of both fields; the echo under each field already says the date in words.
- The question list's position on the package page (B10, C8).
- The release card on Siapkan (Pemetaan Awal, Uji Penguasaan, Sertifikat). It is the product's «Yang akan diterima murid», which her specimen leaves out.

## 2. Tests

**New guards, each RED on the code staging verified (`a5e2935`) and GREEN now:**

| Id | What it proves | Red on the old code |
|---|---|---|
| F23-W06 (db) | Defect 1 in the database | «Menunggu tindakan Anda» counts 3 package(s), the newest of each line are 2; «Tertahan» counts 1, expected 0 |
| F23-W07 (db) | F-7's database boundaries: school isolation; Question Health stays the reviewer's | Green before and after: it measures the boundary the ruling relies on |
| STUDIO3C-BERANDA-02 | Defect 1: the list and `studio_home` | All four checks failed |
| STUDIO3C-SIAPKAN-01 | Defect 2; the class page's materials; J5's «Disediakan untuk» | No `nadaMateri`; the badge, the class rows and the window words all failed |
| STUDIO3C-BANK-01 | F-7: the tab, the schools listed, Question Health only for its reviewer | A Guru was not offered Bank Soal; Question Health was read and shown regardless |

**Journeys:**
- **CI Studio journey** `audit/studio-ujung.mjs` (run by `audit-journeys.yml`), on a freshly reset local stack: **18/18 PASS**. It has three new steps or checks:
  - **U7a:** Studio home lists the package once, at its newest version; the replaced version is not listed, is still a draft by status, and «Riwayat perbaikan» still opens it.
  - **U10 (extended):** the card reads «Tersedia» (ok Badge); the way on reaches the class page, which lists it «✓ Tersedia» with «Mulai … · Sampai …».
  - **U10b:** the Guru opens Bank Soal by its tab. 40 questions are listed, none of another school, with keys and reasons, and no Question Health form.
- **Staging walks, updated, not run** (that needs a separate authorisation):
  - `audit/staging/golden-school-studio.mjs` has the same checks (T7a, T10, T10b);
  - `audit/staging/journey.mjs` Q1 is restated for F-7.

**Suites:** SUITE_RESULT_PLACEHOLDER

## 3. Evidence

`evidence/sisi-penutupan/` holds Daisy's render beside ours after the corrections. They are taken from the same code's journey run; staging was not touched.

EVIDENCE_PLACEHOLDER

## 4. Scope kept

- No new functionality beyond the four owner items.
- No redesign: each change is a condition, a Badge tone, a line of words or one moved paragraph.
- One forward-only migration; no change to any table or policy.
- Production, staging, `main` and Dr Gladys's records were not touched.
- No Batch 4 work.

## 5. Outstanding-item register (Batch 3)

| Item | State | Waits on | What closes it |
|---|---|---|---|
| **W1.2** question-review layout (J4.4's review part) | **OPEN: blocking** | **Daisy**: commission `03-DAISY-W1.2-COMMISSION.md` (six decisions) | Her composition, then one change to the package page and a guard rendered against it |
| **D1** what the Uji Cepat class figure is | **OPEN: blocking** | **Daisy** (`02-DAISY-QUESTIONS.md` D1) | Her answer. Built as the mean of official scores, with «n dari N murid sudah dinilai». |
| **D3** minimum group before a class figure | **OPEN: blocking** | **Daisy**, possibly also the owner | Her answer. Shown from 1 learner today. |
| Wording approvals B2, B5, C2, C3, C5, C7, C9, D7 | Open, not blocking behaviour | Daisy | Copy changes in `hle.ts` |
| Cosmetic and layout confirmations (B1, B3, B4, B6–B12, C1, C4, C6, C8, D2, D4–D6, D8, D9) | Open, not blocking | Daisy | Small style or markup changes |
| J5's live «Jendela: …» line in the review | Open, cosmetic | Daisy (with D6) | A client echo of both fields, if she wants it beside the per-field echo |
| W1.11 / J4.8 Question Bank | **CLOSED by this pass** (F-7) | — | — |
| Defects 1 and 2 | **CLOSED by this pass** | — | — |
| The closure's staging verification | **Not run** | A separate protected merge and staging authorisation | Merge; migration 183; the Studio walk (T7a, T10, T10b), the GS walks with Q1 restated, a11y; refreeze |

**Batch 3 is not declared fully accepted.** W1.2, D1 and D3 remain with Daisy.

## 6. STOP

Batch 3 final acceptance gate. All implementation stays on `claude/awesome-rubin-bqxp6p` until a separate protected merge and staging authorisation.
