# Z · the candidate, for the owner (Bob, 23 Nov 2026, 23:20 UTC)

**Z is complete and verified. Nothing is merged, promoted or deployed.**
- Staging is at **300** migrations (C3w-1).
- Production is untouched at **111**.
- The three decisions below are yours.

## 1 · The candidate

| | |
|---|---|
| **Code** | `claude/z` at **`7615d6b1`** |
| **Branch tip** | **`595a0d3a`**: evidence documents only on top of `9a819a7c`, which itself is evidence only on top of `7615d6b1` (`git diff 7615d6b1 595a0d3a -- . ':!docs'` is empty) |
| **Migrations** | **300 → 308** (eight new; sha256 in `z-evidence/README.md`) |

The eight migrations:
1. D-1: a multi-answer response is read as every option chosen;
2. V2: a finished result stays in force while a retake is open;
3. K-07: pass marks have a floor (1–100, or 0.01–1.00);
4. K-01: the must-be-right gate is part of the verdict everywhere;
5. D-6: the anonymous feedback round is dark, with no data deleted;
6. V5: a transfer from a closed enrolment is refused by name;
7. R-27(b): a reopening request finds the PINTAR ID however it was typed;
8. Z8 item 8: a school always keeps a usable Admin sekolah.

The rest of Z changes no database: Z3–Z7's screens and words, and the blank «Akun saya» reopen form fixed.

## 2 · Reviews: all passed, nothing open

- **Sharon (security and database):**
  - Z1, Z2, the Z3-A SQL and item 8 (308): PASS.
  - Every condition closed (C2, C3, C4, C5, Z2-1).
  - The promotion evidence: PASS (`3c5cffad`). Equivalence of CI to the local pre-flight: CONFIRMED (ruling 86).
  - Her 4.2 notes are recorded in Z8.
- **Daisy (UX and words):**
  - every chunk passed: Z3 (both streams), Z4, Z5, Z6 (both sweeps), Z7 and Z8;
  - the REOPEN fix: passed.
  - Her audit items go to the ruling 79 audit.

## 3 · Verification of record (ruling 81, executed as ruling 86 allows)

| Run | Head | Result |
|---|---|---|
| Local full pre-flight | `df0cbc9c` | RED 1385/2 (a manifest sentence; Konfigurasi asked admin status twice). Fixed |
| Local | `ec082bc4` | VOID (restart), then RED 1386/2 (two stale text pins). Restated, stronger |
| **Local full pre-flight** | **`f5700bd1`** | **GREEN 1388/0, plants 175/175, red cases 11/11.** Two voids before it (disk full; registry) |
| CI 45244823300 | `f5700bd1` | RED: C3W setup, **a ~10% random-pick flake in a C3w-1 test, also on main.** Root-caused in GitHub's own environment (ruling 84), test-only fix `367ff569` |
| Journeys 45244829392 | `f5700bd1` | RED 79/3: stale button names after Daisy's R-26 renames. Test-only fix `c4c8f792` |
| Local | `7615d6b1` | VOID ×3 (session VM restarts) |
| **CI 45281543583** | **`9a819a7c` (= code `7615d6b1`)** | **SUCCESS, attempt 1, 18/18 jobs, strict selftest 1389 passed / 0 failed / 0 skipped. Reuse gate ran (not "already proven"). Bob verified** |
| **Journeys 45281560320** | **`9a819a7c`** | **SUCCESS, attempt 1, 82/82 steps. Bob verified** |

Every run, red and void included, is kept in `z-evidence/`.

## 4 · Promotion evidence (Sharon PASS)

- `z-evidence/step0-Z.sql` must read 0/0/0 (no pass mark below its floor) before the BEFORE read.
- `z-evidence/preservation-Z.sql`:
  - BEFORE and AFTER, read-only;
  - the dry run 300 → 308 moved only lines 10, 84, 85 and 86, as predicted;
  - every preserved line (20–83, and 87, the feedback records) read identically.

**After the promotion:**
1. `v6-pre-request.sql` prints OK;
2. `c3w-r3-bahan.sql` prints OK;
3. line 84: all three pass-mark floors validated (Sharon's C4);
4. **you, in the Supabase dashboard:** check there is no `PGRST_DB_PRE_REQUEST` override on the API server. SQL cannot see one.

## 5 · What you are asked to do

1. **Open the pull request** `claude/z` → `main` (head `595a0d3a`).
2. **Merge it** once its required checks are green. Main then also gets the C3w-1 test-flake fix.
3. **Approve the staging promotion, 300 → 308**, as a separate request, the same way as C3w-1. Bob then runs step 0, BEFORE, the promotion, AFTER and the after-promotion list, and reports.
4. **After staging accepts Z:** decide whether to **lift the D-1 multi-answer containment**. Bob recommends lifting it, since D-1's repair is verified end to end.

**Housekeeping (any time):** delete the throwaway branches `claude/z9-diag-cand` and `claude/z9-diag-main`. They are inert, and the session cannot delete them.

## 6 · Alongside Z

- **Ruling 83, test reliability:** built and proved on `claude/infra-83`. Sharon's blocking S-1 (a real FAIL must never be hidden as VOID) and S-2 (redact the stack log) are being fixed now. It merges for the next round, after her recheck and Second Eye's review.
- **The restarts:** one cause, now measured. The session's VM stops a few minutes after the session goes idle; memory and disk are ruled out. For the next round: GitHub is the authoritative full run, and long local runs are waited on within a turn.
- **E / D-7:** decided (ruling 85). The counsel brief is fit to send (`COUNSEL-BRIEF-RULING85.md`, `60691d59`), with fees confirmed first.
