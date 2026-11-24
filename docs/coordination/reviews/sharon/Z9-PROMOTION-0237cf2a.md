# Z9 · Z's staging-promotion evidence — Sharon's check

**Work:** `docs/completion-4.1/batches/z/z-evidence/` on `claude/z` at `0237cf2a`. Read-only. I diffed the dry run myself.

**Verdict: PASS.**

- **The eight migrations:** my own sha256 of each file at `0237cf2a` equals the README's eight. `20270123170000` is `91c1437c…`, as I passed it.
- **Step 0** (`step0-Z.sql`): `begin transaction read only … rollback`, counts only. On the dry run it reads 0/0/0.
- **`preservation-Z.sql`:**
  - It is read-only, with 0 write statements outside comments.
  - Against C3w-1's query (`ed4a90cc`), it differs only in:
    - the header;
    - line 10's expectation;
    - the labels of 82 and 83;
    - the new lines 84 to 87.
  - `batas` is unchanged.
- **The dry run (my own diff):** only these lines move:
  - line 10: 300 → 308;
  - line 84: `-` → all three floors `convalidated` true (C4 met);
  - line 85: 9 → 0 client EXECUTE;
  - line 86: 2 → 0 client SELECT.
  - Lines 1 and 2 (`batas`), 20 to 83, and 87 read identically.
  - The BEFORE digest `47bb9138…` equals C3w-1's AFTER, as recorded in my C3w-1 check.
  - The migration log has no NOTICE, so no floor stayed NOT VALID.
- **After promotion:** `v6-pre-request` OK and `c3w-r3-bahan` OK, plus the owner's dashboard check for a `PGRST_DB_PRE_REQUEST` override.
- **Line 87's order: accepted.**
  - Ordering by each row's `to_jsonb` text is deterministic for every table, with or without a key. Identical rows give identical text, so ties cannot change the digest.
  - There is nothing to gain from a per-table primary key, and seven tables have none.
- **Note, not a condition:** line 86 reads table-level SELECT only. Column grants are covered by D-6's own migration check (`has_any_column_privilege`), which runs at promotion, so the pair together is complete.
- **The head moves by one client line (the REOPEN filter), with no SQL.**
  - The eight files and the dry run stay valid.
  - The promotion's own check of each file against the deployed file guards the rest.
  - Record the frozen head on the README, as planned.

**C4 (Z1) is closed by line 84.** From my Z reviews nothing is open, apart from the 4.2 notes recorded in Z8.

## Addendum · staging AFTER (24 Nov 2026, 00:20 UTC): consistent, nothing to question

- **The query on staging** is `preservation-Z.sql` at `595a0d3a`, sha256 `998d3f59…`. That equals the file I passed at `0237cf2a`.
- **My own diff** of `z-promotion/preservation-Z-staging-BEFORE.txt` against AFTER, on `98911d5b`:
  - only the header comments and lines 10, 84, 85 and 86 move;
  - BEFORE's `batas` is written into AFTER;
  - the AFTER digest `8844154d…` equals the dry run's.
- **C4 is met on staging:** all three floors `convalidated` true. D-6 shows 9 → 0 and 2 → 0.
- **Still the owner's:** the dashboard check for `PGRST_DB_PRE_REQUEST`, and staging acceptance.
