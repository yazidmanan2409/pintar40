# Session handover: Second Eye, 8 Nov 2026

The first document the next session reads. Everything named here is in the repository unless it is marked LOCAL-ONLY.

## 1. Where things stand

| | |
|---|---|
| Branch | `claude/awesome-rubin-bqxp6p` |
| **Verified baseline** (owner accepted, not promoted) | **`5919a370eafbbf6de5dc042c428807f8d2fff362`** |
| Branch checkpoint | the commit carrying this file. It sits on top of `2e7ff7c6`, which holds the baseline record and the plan. Records only: no application change after `5919a370` |
| `main` and staging | `c4944fab` (migration 200). Production is untouched (migration 111) |
| Promotion | **Not authorized.** Only `5919a370`, or a merge commit with its exact tree, may be promoted. Any later commit needs its own exact-SHA CI and journeys |

## 2. Verification of the baseline: VERIFIED

| Check | Run | Result |
|---|---|---|
| CI on `5919a370` | 42442891085 | success, every job |
| Journeys on `5919a370` | 42442892785 | success, both jobs. A: every role, W6.2 timing, Studio end to end (with F8's check), administration, Batches 5, 6 and 8, A4, E1+E2 navigation, the identity emails, E-RB. B: Gladys's path from an empty database |
| Application tree | `git diff 14361bda 5919a370 -- src supabase public` | **empty.** It is the tree Daisy rated READY |
| Earlier runs | CI 42440279166 on `cd94ad07` | 2 stale tests (DAISY-05-STRUKTUR-01, F06-S04), fixed in `5919a370`. Journeys 42440280853: green |
| | CI 42433800520 and journeys 42433803149 on `a10d5650` | D168-B1-6 (an h3; fixed). Journeys green |
| Sharon's build-freshness change | `04abab88`, CI 42438430634 (18/18; 874/0) | **Integrated** by merge `9535f65d`; 11/11 build-identity regression tests (`npm run -s selftest:build-identity`) |

## 3. Daisy

| Round | Where | Verdict |
|---|---|---|
| Audit | `ux-1/daisy-experience` `e639540b`, `KESIAPAN-4.0.md` | 3 A and about 30 B findings |
| Verification of `f2a52a5a` | `7ea99f35`, `docs/coordination/ux/completion-4.0/CONTOH-LAPORAN/KESIAPAN-VERIFIKASI.md` | NOT READY: F1–F10 |
| **Final** | `a0581113`, `CONTOH-LAPORAN/KESIAPAN-AKHIR.md` | **READY on `14361bda`**, on the condition that staging serves it. **Not seen:** staging, and the withdrawal and maintenance confirmations pressed live. Five cosmetic items may follow |

Daisy's READY is local design evidence only. It does not replace engineering verification, staging, human accessibility checks, or the owner's acceptance.

## 4. Owner decisions and rulings (8 Nov)

- **D-140 ruling:** repeated primaries are fine inside a list of rows; a page's own next step is unmistakable; competing page-level primaries are corrected. Minor form-label refinements may follow the walkthrough.
- **Decision 1, classless learner recovery:** **approved**. An authorized administrator places an existing classless learner in a Kelas, preserving identity, records, permissions and audit. Reuse Pindah, enrollment and membership first. A narrow migration is authorized if genuinely necessary.
- **Decision 2, the Studio content check:** confirmed as built. «Tandai lolos pemeriksaan» runs the check, and an ERROR blocks with an explanation and a correction path. Non-blocking findings follow the existing rules. No false success.
- **Decision 3, Studio home count (W1.16):** must be corrected before final 4.0 acceptance. It may stay disclosed during the first walkthrough only while the affected packages remain discoverable: they are, in the list with each one's step.
- **Release:** no merge to `main`, no staging or production deployment without the owner. **No invitation to Dr Gladys.** No production upgrade rehearsal yet.
- **Standing constraints:**
  - No changes to production.
  - Never restore the W9.19 local-token optimization.
  - Exact candidate-SHA verification for every promotion.
  - No credentials, restricted keys or real-person data in commits.
  - Never commit `supabase/config.toml`; never touch `.github/*-request.txt` production files.
  - All copy goes in `src/lib/hle.ts`.
  - Never weaken or remove tests; restate them to an approved rule.
  - No history rewrite.
  - No PR or merge without authorization.

## 5. Next actions, in order (detail: `acceptance/NEXT-CORRECTION-PLAN.md`)

1. **First action:** branch from the checkpoint on `claude/awesome-rubin-bqxp6p`. Restart the local stack (`npx supabase start`, with Docker started first). Investigate Decision 1's reuse path: `pindah_masuk` and Konfigurasi «Pindah» (`src/app/konfigurasi/page.tsx` ≈ l.860, `actions.ts` ≈ l.270), the enrollment and membership rules, and `import_row_problems`.
2. Implement Decision 1, then Decision 3 (`studio_home` counts VALIDATED, APPROVED and FROZEN for the person who may take each one's next step). Each with DB tests, red then green, for inclusion and exclusion.
3. Exercise F8's refusal path live: an ERROR finding, the hold, then the correction route.
4. Consolidated local verification:
   - the full suite on a fresh build;
   - `audit/siap-jalan.mjs`, with **R5 and R6 made real**: today they pass without reaching their states (Daisy);
   - the role walks.
5. Exact-SHA CI and journeys, once. Investigate any failure, don't re-run.
6. Daisy's targeted re-verification: Pindah or Aktivasi, Studio home, the check refusal.
7. Report to the owner: one candidate, its SHA, the evidence, Daisy's verdict and a promotion recommendation.

## 6. Status of everything open

| Item | State |
|---|---|
| Decision 1 (classless recovery) | **PENDING**: not started |
| Decision 3 (Studio home count) | **PENDING**: not started. Disclosed on screen (F10) |
| F8 refusal path live | **NOT TESTED** live; built and read in code; the clean path walked |
| R5 and R6 of `siap-jalan` | **NOT EXERCISED**: they must not count |
| NVDA and TalkBack (S1–S8) | **NOT TESTED**: needs a person (`acceptance/SCREEN-READER-SCRIPT.md`) |
| Human journeys H1–H20 | **NOT TESTED** (`acceptance/HUMAN-ACCEPTANCE-JOURNEYS.md`) |
| W6.2 and W6.8 from Indonesia | **BLOCKED**: an owner-provided Indonesian runner (`acceptance/W62-W68-REGIONAL.md`) |
| Staging pass after promotion | **BLOCKED** on authorization. Plan: import both ways; Studio author and reviewer with the check refusal; Guru → Ringkasan Kelas; reports on a phone; one destructive confirmation |
| Production 111 → 200+ | **NOT STARTED** by direction; hazards in `STATUS-REPORT-2026-11-08.md` |

## 7. Records

- `ENGINEERING-READINESS-2026-11-08.md`. Its §4 predates the `5919a370` runs; this file supersedes it.
- `acceptance/KESIAPAN-PENYELESAIAN-2026-11-08.md`: the audit corrections.
- `acceptance/SIAP-SERAH-TERIMA-2026-11-08.md`: the F1–F10 handoff.
- `daisy-design-completion/09-SIAP-VERIFIKASI.md`: the request to Daisy.
- `C-OPEN-WORK-REGISTER-2026-11-02.md`, row W1.16.
- `batch-*/INTEGRATION-DOSSIER.md`.
- `H-ACCEPTANCE-STANDARD-AND-LEDGER.md` §3c.

## 8. What was not preserved (LOCAL-ONLY, gone with this session)

- **The readiness walk's screenshots** and the grid render PDFs and PNGs. The walk script `audit/siap-jalan.mjs` and the render method are in the repository; re-run to regenerate.
- **The full local selftest logs** of 8 Nov. Their tallies are recorded above and in the reports.
- **The local tag `siap-baseline-5919a370`.** The session cannot push tags; the SHA in §1 is the reference.

The scratchpad's plan is copied to `acceptance/NEXT-CORRECTION-PLAN.md`; nothing else in it is needed.
