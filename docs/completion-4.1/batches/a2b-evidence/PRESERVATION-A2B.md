# A2b's staging promotion: the preservation query (A13)

Prepared by Second Eye on 16 Nov 2026, for the Chief Architect's GO (step 3) and Sharon's freeze checks
(`CARRIED-ITEMS.md`: "the `maintenance_windows` before-and-after preservation check").

> **Not run on staging.** The staging "before" read needs the owner's SQL approval and is **PENDING OWNER
> AUTHORISATION**. It is taken **before the merge**; the merge waits with it (owner directive 16 Nov, `670aeb4e`).

## The query: `preservation-A2b.sql`

Change C's "after" query (`docs/completion-4.1/batches/a2a-evidence/preservation-C-after.sql`, on
`claude/bob-41-master-plan`) with four changes, and nothing else:

1. **`batas` is back to two nulls.** A2b takes a fresh "before" read. After the merge, write the two values the
   "before" read prints on lines 1 and 2 into `batas`, in place of the nulls, and run it again.
2. **`baru` also leaves out, by name, the one column A2b adds to existing data:** `maintenance_windows.reason_code`
   (`20270120190000_a_planned_window_gives_its_reason.sql`).
   - A2b's fourteen migrations (268 to 281) add no other column and alter no other column.
   - They change no existing row: every insert and update they carry is inside a function body, or is a new
     `client_rpc_registry` row (created after the cutoff, so outside every fingerprint).
3. **Line 63, the preserved line for `maintenance_windows`:**
   - It covers every window created up to the cutoff whose end (`ended_at`, else `ends_at`) had passed at the cutoff.
   - It is a count and an md5 of each row's content in id order.
   - It leaves out, by name, A2a's `node_ids`, `t_stop` and `t_lift` (Sharon, `fdffee31`) and A2b's `reason_code`.
4. **Lines 73 and 74, `maintenance_windows`' state lines,** which are not "preserved":
   - **73** lists, by id, the windows created before the cutoff that had not finished at it.
   - **74** counts the finished windows whose deactivation is not yet recorded at the read.

**Why only finished windows are preserved.** A window still planned, active or open at the cutoff may change
legitimately afterwards:
- the minute tick writes `activation_recorded_at` and `deactivation_recorded_at`;
- an administrator may end it early (`ended_at`, `ended_by_person_id`, `end_reason`), or extend a PLANNED one
  (`ends_at`).

Line 73 lists those windows at each read. Line 74 should be 0 at the "before" read (the tick runs every minute). If
it is not 0, line 63 may move by exactly those rows, and the comparison says so. **Sharon:** this boundary is my
choice, for your reading.

## The local dry run: the same text at 267 and at 281

On the local stack, 16 Nov:

1. Reset to `main` `eff99f98` (267 migrations).
2. Plant three windows: two finished (one ended early) and one in the future.
3. Take the "before" read: `preservation-A2b-dryrun-local-before-267.txt`.
4. Apply A2b's migrations 268 to 281 (`supabase migration up --local`).
5. Write the cutoff and watermark into `batas` and take the "after" read: `preservation-A2b-dryrun-local-after-281.txt`.

**The diff is one line:** line 10, the migration count, 267 → 281, as designed. Every preserved line (20 to 63) and
every state line (70 to 74) is identical. Line 63 reads `2 2e3eada4…` both times.

**The control:** without `reason_code` left out, the same two windows read `2 0980270c…` at 281. So the exclusion is
needed, and line 63 would otherwise fail on a column A2b adds by design.

This is a local rehearsal of the query's text across A2b's migrations. It is not the staging reading.
