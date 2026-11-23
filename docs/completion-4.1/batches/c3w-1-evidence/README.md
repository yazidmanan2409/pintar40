# C3w-1 · staging promotion evidence

> **The pair:** 290 → 300. Line 10 reads `290 / 20270121250000` BEFORE and `300 / 20270122190000` AFTER.
> - **The frozen head:** `claude/c3w-1` at `8668a695` (Bob's freeze, 23 Nov). Sharon passed the build and round 2;
>   Daisy passed round 3.
> - **The method** is A3's (`a3-evidence/` on `claude/bob-41-master-plan`).
> - **Local only:** nothing here touched staging or production.

## The ten migrations

| Migration | sha256 |
|---|---|
| `20270122100000_an_ai_draft_attempt_is_reserved_then_settled_or_released` | `ae0741a26225ca4070ecf16877a695410ee1578fbc38dfbd3d7c1bbbc855bfef` |
| `20270122110000_an_ai_draft_request_is_checked_for_personal_information_first` | `5757977c6eccc73308b0889e98afe0fd62492bfed307d00da4b617fd0763f912` |
| `20270122120000_a_long_excerpt_reserves_for_its_length` | `da3abce87bca1a321fe5d3a6cca6d718f5176c99ada4e861ccac62851de39777` |
| `20270122130000_a_generated_draft_is_kept_or_removed_before_it_is_submitted` | `abb8173cb991787e4ae2dd4a983f4cbd67b2e1c414234b37f4fe43f78321375b` |
| `20270122140000_the_generated_drafts_are_written_and_the_attempt_settled_at_once` | `265d904fb3da1b4e295607026882385513804eed7b92d3d8c82f94144add5dd4` |
| `20270122150000_every_ai_draft_request_names_its_target_lesson` | `89c8e80f759f872a23220c441784778b19b9ad8435a2c523077a851623f7df2d` |
| `20270122160000_the_checked_text_hash_and_a_failed_attempt_settled` | `8deb8089dbe8ac87d6a8884c5e51340c457dae033a6d60b7fb4cf3de44cda84e` |
| `20270122170000_a_package_already_checked_is_refused_in_its_own_words` | `f5001965a82e68baa0004e03ba5f90803449aefbc4fe2ea6b49d09ce9b6e92c6` |
| `20270122180000_a_package_s_ai_provenance_is_read_by_its_staff_only` | `87add13f30d429af4fa2997deb3adbcad7648838aad9cbc54628e757364be16d` |
| `20270122190000_a_draft_s_objectives_are_its_target_lesson_s` | `1b0873b44822fe8848a308d317493bb8be50269135733f73b03d1930574c1e58` |

The promotion checks each one against the deployed file before migrating. Any difference stops it.

## The files

- **`preservation-C3w-1.sql`:** the BEFORE and AFTER read, run in a read-only transaction, with the same `batas`
  mechanism as A3. Its header says which lines may move and why. In short:
  - **No existing table is altered, backfilled or constrained,** and no existing row is written at migration time.
  - **Lines 20 to 81 must read the same** on both reads.
  - **Only lines 10, 82 and 83 move:** line 10 is the migration count, line 82 shows the seven AI tables arriving
    empty, and line 83 shows the five AI functions' registry rows.
- **`dryrun-8668a695/`:** the local dry run on the frozen head.
  - **`preservation-C3w-1-BEFORE.txt`:** the read at 290. The ten migrations were held aside, then
    `supabase db reset --local` was run with the seed.
  - **`migration-up.log`:** `supabase migration up --local` applying the ten.
  - **`preservation-C3w-1-AFTER.txt`:** the read at 300, with BEFORE's two `batas` values written in.
  - **`DIFF.txt`:** only lines 10, 82 and 83 moved. The preserved lines carry the seed's data (for example persons 24,
    items 44, item_options 176, audit_log 74), and each one reads identically.
  - **`c3w-r3-bahan-AFTER.txt`:** `scripts/release/after-promotion/c3w-r3-bahan.sql` on the result prints **OK**.

## Step 0: none, and why

**Why A3 needed one:** its 210000 migration backfilled a column and checked lineage chains, so it could abort on
staging's data.

**Why C3w-1 does not:**
- **No migration reads existing rows at migration time.** Its check blocks read only the catalogue (function
  definitions and privileges).
- **The registry inserts are for new names.** They are `client_rpc_registry`, `record_class_registry` and
  `orang_lampiran` rows for the AI tables and functions, which do not exist before.
- **The one not-null** (150000, `ai_permintaan.lesson_id`) is on a table created empty by 100000 in the same promotion.

## If a migration fails part-way

**Staging is left at the last whole migration applied,** because each file is its own transaction.

**Stop and report to the owner.** No AFTER read is taken, and nothing is retried without the owner.

**The staging BEFORE read and the promotion are the owner's to authorise** (Request 1, drafted by Bob after Sharon
checks these proofs).
