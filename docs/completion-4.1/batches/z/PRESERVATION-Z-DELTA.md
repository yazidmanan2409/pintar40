# Z · the preservation read: what differs from C3w-1's (Bob's draft, 23 Nov)

This is a draft for the Z freeze. Second Eye restates it as `z-evidence/preservation-Z.sql` on the frozen head, where it is dry-run 300 → 307 and Sharon checks it. Nothing here runs against staging or production without the owner's separate request.

**The base** is `c3w-1-evidence/preservation-C3w-1.sql` (`ed4a90cc`, on `main`). Its method, lines and rules stand. Only what differs is stated here.

## 1 · The pair is 300 → 307

Line 10 reads `300 / 20270122190000` BEFORE and `307 / 20270123160000` AFTER. The freeze header lists the seven files with their sha256, and the promotion checks each against the deployed file before it migrates.

| Version | Item |
|---|---|
| 20270123100000 | D-1 |
| 20270123110000 | V2 |
| 20270123120000 | K-07 |
| 20270123130000 | K-01 |
| 20270123140000 | D-6 (with Sharon's Z2-1) |
| 20270123150000 | V5 |
| 20270123160000 | R-27(b) |

## 2 · What Z changes that a preserved line could see: nothing

Read from the seven files at `8614bd26`:
- **No row is written at migration time.** Every insert, update and delete is inside a function body: `set_school_pass_mark`, `transfer_execute` and `minta_buka_kembali`. The check blocks read only the catalogue, plus `count(*)` for K-07's floors.
- **K-07** adds three CHECK constraints NOT VALID, then validates each one only if no row is below its floor. Otherwise it raises a notice and leaves the constraint NOT VALID. No row is changed.
- **D-6** revokes privileges only. It drops nothing and touches no row or registry row.
- **Everything else is a function** restated in full or newly created. Two are new: `pilihan_dipilih` and `pilihan_tunggal` (D-1). One is internal with no grant: `tujuan_gerbang_terlewat` (K-01). There are no `client_rpc_registry` inserts, so line 83 stays at 5.

So **lines 20 to 83 must read identically BEFORE and AFTER**, and only line 10 and the new lines 84 to 87 move.

## 3 · Step 0: a read-only pre-check BEFORE the promotion (new)

K-07 can't fail on staging's data, but it would silently leave a constraint NOT VALID, and that would fail Sharon's C4. Step 0 tells us before we migrate whether C4 can be met:

```sql
-- Z step 0 · READ ONLY. Every count must be 0. Otherwise stop and report: C4 cannot be met, and the owner decides.
set transaction read only;
select 'school_pass_marks below 1..100', count(*) from public.school_pass_marks where not (percent >= 1 and percent <= 100)
union all
select 'assessment_assignments below 0.01..1', count(*) from public.assessment_assignments where pass_mark is not null and not (pass_mark >= 0.01 and pass_mark <= 1)
union all
select 'assessment_sessions below 0.01..1', count(*) from public.assessment_sessions where pass_mark is not null and not (pass_mark >= 0.01 and pass_mark <= 1);
```

## 4 · The new lines

| Line | Reads | BEFORE | AFTER |
|---|---|---|---|
| 84 | state · the three K-07 floors: `conname:convalidated` from `pg_constraint`, ordered by name | (empty) | `assessment_assignments_pass_mark_floor:true, assessment_sessions_pass_mark_floor:true, school_pass_marks_percent_floor:true` (Sharon C4) |
| 85 | state · client EXECUTE on the nine feedback RPCs: count of (function, role) pairs where `has_function_privilege(role, oid, 'EXECUTE')` for anon and authenticated | 9 for authenticated (anon as staging reads it BEFORE) | **0** |
| 86 | state · client SELECT on the nine `feedback_*` tables: count of (table, role) pairs where `has_table_privilege(role, oid, 'SELECT')` for anon and authenticated | as read (at least `feedback_cycles` and `feedback_opportunities` for authenticated) | **0** (Sharon Z2-1 and the extended Z-D6-01) |
| 87 | the nine `feedback_*` tables: `count(*)` and the md5 of `to_jsonb(t)` ordered by id, per table | as read (0 rows expected on staging) | **identical** (nothing deleted) |

Line 87 is a preserved line. It should read identically, because ruling 81 keeps every feedback record.

If Z2-1 covers only two of the nine tables, line 86 counts only grants that existed BEFORE. Second Eye fixes the exact form once Z2-1 has landed: AFTER must be 0 for the tables Z2-1 revokes, and unchanged for any it leaves.

## 5 · After the promotion

These go on the after-promotion list:
- `scripts/release/after-promotion/v6-pre-request.sql` must print OK.
- **The owner, in the dashboard:** check for any `PGRST_DB_PRE_REQUEST` environment override on the API server. SQL can't see one (Sharon's V6 limit, `79250267`).
- `scripts/release/before-import/d1-multi-answer.sql` is a before-import report. It is **not** run at promotion.
- C3w-1's `c3w-r3-bahan.sql` still prints OK.

## 6 · If a migration fails part-way

Each file is its own transaction, so staging is left at the last migration applied. Stop and report to the owner. No AFTER read is taken, and nothing is retried without the owner.
