# C3w-1 staging-promotion proofs — Sharon's check

**Work:** `docs/completion-4.1/batches/c3w-1-evidence/` on `claude/c3w-1` at `ed4a90cc` (code frozen at `8668a695`).
`preservation-C3w-1.sql` sha256 `2cafef0fad24116d4264318230088ce2ab48b8c4a3ae53b1c960d2331c324feb`.

**Verdict: PASS with conditions** (the conditions are additions to Request 2's staging list, not changes to the proofs).

## (1) The header claims and read-only

- **Read-only:** 0 write statements outside comments. The same read-only-transaction rule as A3.
- **No existing row written at migration time:**
  - Every `update` of items, lessons, modules, assessment_definitions or courses is inside a function body (130000, 140000).
  - Every `alter table` and `create index` is on an AI table created empty in this promotion (100000–130000).
  - The `do $$` blocks read only the catalogue (`has_table_privilege` and function definitions), never `public` rows.
  - The migration-time inserts go to `record_class_registry`, `orang_lampiran` and `client_rpc_registry`, all for new names.
  - The one change on an existing table is the trigger `ai_bukan_sumber_metrik` on `metric_sources`, which reads no rows when created.
- **`baru`** is A3's three columns, unchanged. **`batas`** is A3's (coalesce of null, so BEFORE reads now and max(id)).

## (2) No step 0

**Accepted.** None of the ten reads existing rows at migration time, so none can abort on staging's data.
The not-null `ai_permintaan.lesson_id` (150000) is on a table created empty in the same promotion.

## (3) The dry run (my own diff of BEFORE against AFTER)

- **Only lines 10, 82 and 83 move:**
  - 10: 290 / 20270121250000 → 300 / 20270122190000;
  - 82: the seven AI tables, absent → present with 0 rows each;
  - 83: 0 → 5 `ai_%` registry rows (ai_asal_paket, ai_draf_belum_diputuskan, ai_minta_draf, ai_putuskan, ai_tersedia).
- **Lines 1 and 2 (`batas`) are identical:** BEFORE's values were written into AFTER, as in A3.
- **`DIFF.txt` equals my diff.** `migration-up.log` applies the ten in order; `c3w-r3-bahan-AFTER.txt` prints OK.

## (4) Additions for the staging run (Request 2)

1. **Run `scripts/release/after-promotion/c3w-r3-bahan.sql` on staging** after the promotion, and require OK (ruling (b): B4 after every promotion).
2. **V6:** assert authenticator's `pgrst.db_pre_request` is unchanged after the promotion.
3. **Grants:** every `ai_*` function's EXECUTE matches its registry row (authenticated only where registered; otherwise service_role only), and anon has none.
4. **The stub stays off:** no workflow, config or staging secret sets `PINTAR_AI_STUB_HARNESS`. (None in `.github/` or `supabase/config.toml` at this head.)

**Could reasonably have been anticipated:** no new findings from me in this round.
