# A2b's staging promotion: the preservation query (A13)

Prepared by Second Eye on 16 Nov 2026 for the Chief Architect's GO (step 3). **Restated the same day for Sharon's
freeze checks P1 to P3** (`A2B-FREEZE-3c58620e.md` at `e07e67a6`, on `claude/gracious-lamport-0m1qjr`).

> **Not run on staging.** The staging "before" read needs the owner's SQL approval and is **PENDING OWNER
> AUTHORISATION**. It is taken **before the merge**, and the merge waits with it (owner directive 16 Nov, `670aeb4e`).
> Docs only: the code under test stays `3c58620e`.

## The query: `preservation-A2b.sql`

**The pair is 267 → 282** (restated 16 Nov: A2b reopened for the start path, migration 20270120240000, a replaced
function body; no column).
- **Before the merge,** line 10 reads `267 / 20270119270000`. That is staging's count since A2a change C.
- **After the merge,** it reads `282 / 20270120240000`, with A2b's 268 to 282.
- Nothing under "preserved" may move.

**What is left out, and why.** The header states each exclusion with its reason.

- **P1: only what A2b adds.** `baru` and `mw_keluar` hold one column, `maintenance_windows.reason_code`.
  - It exists only after A2b.
  - Its value on the existing rows is held instead by **line 64**: no window created before the cutoff carries a
    code.
  - The inherited exclusions are gone: 4.0's about 30 columns (225 to 244), and A2a's `node_ids`, `t_stop` and
    `t_lift`. So the `darurat_*` and `closure_*` columns, and every window's stop and lift times, are now
    fingerprinted.
- **Three other exclusions, each with its own reason:**
  - **Line 44 reads a user as locked or not.** Since 4.0's 233, the stored value is a computed instant.
  - **Line 58 covers only sittings ended at the cutoff.** The scheduled closure ends the open ones; lines 70 to 72
    read those.
  - **Windows are read in two parts:**
    - **Line 63:** windows finished at the cutoff, every column but `reason_code`.
    - **Line 75 (P3):** windows not finished at the cutoff. It leaves out `reason_code` and the seven columns a
      legitimate act writes: `starts_at`, `ends_at`, `ended_at`, `ended_by_person_id`, `end_reason`,
      `activation_recorded_at` and `deactivation_recorded_at`.
- **The rule for line 75:**
  - Every window whose line-75 content differs must have an `audit_log` row above the watermark. **Line 76** lists
    those rows.
  - A difference with no such row is a material discrepancy.
  - Lines 73 and 74 are state, not preserved.
- **P2:** the header and the comments now describe 267 → 282. No 224/244 text remains.

## The local dry run, redone for 267 → 282: the same text at 267 and at 282

On the local stack, 16 Nov:

1. Reset to `main` `eff99f98` (267 migrations).
2. Plant five windows:
   - two finished: a planned window, and a class emergency stop with `t_stop` and `t_lift`;
   - three unfinished: a running planned window, an open class emergency stop with `t_stop`, and a future
     platform-wide window.
3. Take the "before" read: `preservation-A2b-dryrun-local-before-267.txt`.
4. Apply A2b's migrations 268 to 282 from `claude/a2b`.
5. Write the cutoff and watermark into `batas`, and take the "after" read:
   `preservation-A2b-dryrun-local-after-282.txt`.

**The diff is one line:** line 10, 267 → 282, as designed. Every other line is identical:

| Line | Reads, before and after |
|---|---|
| 63 | `2 14ca69a3…` |
| 64 | `0` |
| 73 | `3 a601ef58…` |
| 74 | `0` |
| 75 | `3 b69c6469…` |
| 76 | `0` |

**The controls,** each rolled back, on the 282 database with the "after" text:

| Change | Line 63 | Line 75 | What it shows |
|---|---|---|---|
| A finished window's `t_lift` moved by one second | `fcf0dd3c…`, changed | holds | A finished window's stop and lift times are now fingerprinted (P1) |
| An unfinished window's `node_ids` changed | holds | `0b268fcf…`, changed | Line 75 watches an unfinished window's place (P3) |
| An unfinished window extended (`ends_at`, a legitimate act) | holds | holds | The extend does not show as a discrepancy. (The control writes the column directly, so line 76 reads 0 here; a real «Perpanjang» writes `maintenance.extended`, which line 76 lists.) |

This is a local rehearsal of the query's text across A2b's migrations. It is not the staging reading.
