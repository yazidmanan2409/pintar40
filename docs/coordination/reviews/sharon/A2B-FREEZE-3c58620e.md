# A2b freeze: my checks on the exact candidate

Sharon, 16 Nov 2026 (15:25 UTC). Read-only. **What I reviewed:**
- the candidate `3c58620ed6bdd27e3303e4d5decc462b648c2496` on `claude/a2b`;
- `docs/completion-4.1/batches/a2b-evidence/preservation-A2b.sql`: the header, `baru`, `mw_keluar`, and lines 63 and 73 to 74;
- `PRESERVATION-A2B.md`;
- Second Eye's pre-flight, as reported: suite 1224 passed and 0 failed, plants 175/175, the red-case job 11/11, lint, typecheck and build identity clean, and A12's hook timing within the gate.

## What holds now

- **The candidate's code: no objection.** Every A2b commit I reviewed has passed (README rows).
  - 4c1f3831 and 0e2a2ad0 are CI-only plant re-anchors, with the defects unchanged.
  - A12 is met: p95 at most 0.106 ms with a class window active.
- **Freeze checks that hold:**
  - **The A2B-R2 exceptions:** exactly three, each held to its line.
  - **The start-trigger `now()` branch:** still registered, for Z.
  - **Staging:** marked PENDING OWNER AUTHORISATION, never complete.
- **The preservation query does not hold yet. P1 and P2 must be fixed before the "before" read is taken.** It has not been run, so this costs nothing now.
  - The fix is a docs-only commit on the candidate's line, under the freeze rules.
  - The SHA of the code under test does not change.

## P1 · The left-out columns are inherited, not A2b's (blocker for the evidence)

- **`baru` names about 30 columns, which 4.0's batch 5 added (225 to 244).** They are on staging already. The header still reads "THE SAME TEXT READS AT 224 AND AT 244".
  - So every preserved fingerprint ignores existing columns that A2b's own code can write, for example `assessment_sessions.darurat_*` and `closure_*`.
  - A migration that wrongly rewrote them would read as "preserved".
- **`mw_keluar` leaves out `node_ids`, `t_stop` and `t_lift`, by my own note `fdffee31`.**
  - That was right for A2a's promotion, when they were new. A2a is on staging now, so they exist before A2b. Leaving them out hides a change to a finished window's stop and lift times.
- **Required:**
  - `baru` and `mw_keluar` list only what A2b adds, which is `reason_code` (line 7 says so: "A2b's fourteen migrations … add no other column").
  - Any other exclusion carries its own reason and the rule that allows it.
  - Then re-run the local dry run, 267 → 281, and show that only the state lines move.
- *Could reasonably have been anticipated (Q4, before and after):* the query was carried forward from 4.0 and A2a without restating its baseline. My own `fdffee31` note is part of what was carried.

## P2 · The header and the state comments name the wrong versions

- **The text names 224 and 244 throughout:** lines 26, 29, 41 to 46 and 76. A2b's pair is 267 → 281.
  - Whoever runs the read is told to expect the wrong migration counts.
- **Required:** restate the header for A2b's baseline, and name the runbook's expected counts, so the evidence reads true on its own.

## P3 · Unfinished windows (recommended, not blocking)

- **The finished-only boundary is reasonable:** the tick, extend and end early may legitimately change an unfinished row. But it leaves A2b's own migrations unwatched on exactly the rows they could touch.
- **Recommended:** a preserved line for unfinished windows that leaves out only the columns a legitimate act writes (`ends_at`, `ended_at`, `ended_by_person_id`, `end_reason`, `activation_recorded_at`, `deactivation_recorded_at`, `starts_at` for MULAI).
  - **The rule for it:** any difference must match an `audit_log` row above the watermark.
  - It covers `kind`, `platform`, `institution_ids`, `node_ids`, `reason`, `created_by_person_id`, `t_stop`, `t_lift`, and a `reason_code` that stays null.

## Addendum, 15:40 UTC: the preservation query restated at `14cb6e045f685a3f39e6fb089b5a355a43087dbd`. P1 to P3 closed.

- **It is docs only.** The diff from `3c58620e` touches only the four files under `a2b-evidence/`, so the code under test is unchanged.
- **P1:**
  - `baru` and `mw_keluar` hold only `reason_code`. The `darurat_*` and `closure_*` columns, and every window's stop and lift times, are now fingerprinted.
  - Line 64 reads `reason_code` itself: no window from before the cutoff carries a code.
  - The three remaining exclusions (44, 58, and the two-part reading of windows) each state their reason, and I accept them.
- **P2:** the text reads 267 → 281, and line 10's expected before and after values are named.
- **P3:** line 75 covers unfinished windows, leaving out only `reason_code` and the seven columns an act writes. Line 76 lists the audit rows that must account for any difference on line 75.
- **The dry run was redone, 267 → 281,** with five planted windows, finished and unfinished, an emergency with `t_stop` and `t_lift` among them. **Only line 10 moved.**
  - **The controls bite:** `t_lift` +1 s changes 63, and `node_ids` changed on an unfinished window changes 75.
  - An extend written directly leaves 75 unchanged, as designed.
  - Second Eye notes that this control writes no audit row, which a real «Perpanjang» does. That is stated correctly.
- **Verdict: the preservation pair is ready for the owner's "before" read.** It is to be run as written, with the cutoff and watermark entered as the runbook says.
