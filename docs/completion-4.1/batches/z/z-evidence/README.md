# Z · staging promotion evidence

> **The pair:** 300 → 308. Line 10 reads `300 / 20270122190000` BEFORE and `308 / 20270123170000` AFTER.
> - **The candidate (final):** code **`7615d6b1`**, verified at **`9a819a7c`** (CI 45281543583 and journeys 45281560320,
>   both green in one attempt; `ci-of-record/`), `claude/z` tip **`595a0d3a`** (documents only since `7615d6b1`).
> - **History, the first frozen candidate:** `claude/z` at **`df0cbc9c`** (Bob, 15:09Z). Sharon passed this evidence
>   (`Z9-PROMOTION-0237cf2a.md`, `3c5cffad`). The dry run was taken on `944520b0`; from there to the candidate only this
>   folder changed.
> - **The full pre-flight on `df0cbc9c`** (`preflight-df0cbc9c/`): lint, typecheck and build identity pass; the whole
>   suite on a fresh reset and fresh build is **1385 passed, 2 failed** (F06-S04 and BOB18-A01, both explained in the
>   hand-off); plants 175/175; red-case groups 11/11.
> - **The method** is C3w-1's (`c3w-1-evidence/`), with Bob's delta (`PRESERVATION-Z-DELTA.md`, claude/bob-41-master-plan).
> - **Local only:** nothing here touched staging or production.

## The eight migrations

| Migration | Item | sha256 |
|---|---|---|
| `20270123100000_a_multi_answer_response_is_read_as_every_option_chosen` | D-1 | `7a6e82588430d449da2ea01afc5fc0ac037c15aa0c63a2e53407317bd73bbf0c` |
| `20270123110000_a_finished_result_stays_in_force_while_a_retake_is_open` | V2 | `aa0fe1c3f12f79bf3c1f6d0222d8000b481f966905163cde0532379bcb42558d` |
| `20270123120000_a_pass_mark_has_a_floor` | K-07 | `da3a537a07ccbe91b8332cb24030083721021bac8f252341729be8ff75a3cc29` |
| `20270123130000_the_gate_is_part_of_the_verdict_everywhere_it_is_read` | K-01 (130000 corrected in place, undeployed) | `99a63dc46c8b1d744d57f6b666a91e555f6d92d114e5c7e7a84911f55d6ed338` |
| `20270123140000_the_anonymous_feedback_round_is_dark` | D-6, with Sharon's Z2-1 | `b3d91e0e43a696b7e9c28af1ce4a609202a6b1f0d1a66c7a9dd6361d27fa0a39` |
| `20270123150000_a_transfer_whose_source_enrolment_closed_is_refused_by_name` | V5 | `22d8603af6f6b5159f38f7ed76902115c703908d914d21f7186b132a3779363b` |
| `20270123160000_a_reopening_request_finds_the_pintar_id_however_it_was_typed` | R-27(b) | `4ac9af981993f79cf04e3c71b1360cb5b83f7346de32a0006af044b91ee370bb` |
| `20270123170000_a_school_keeps_a_usable_administrator` | Z8 item 8 (Sharon PASS 1bf3e983) | `91c1437c675005218f62145ea10b78ae3ddd1dd28dc84119ff1bdbc035f327eb` |

The promotion checks each one against the deployed file before migrating. Any difference stops it.

## The files

- **`step0-Z.sql`** (new, Bob's delta §3): a read-only count of the pass marks below K-07's three floors, run on staging
  **before** the BEFORE read. Every count must be 0. Otherwise K-07 would leave that floor NOT VALID, Sharon's C4 could
  not be met, and the owner decides.
- **`preservation-Z.sql`:** the BEFORE and AFTER read, run in a read-only transaction with C3w-1's `batas` mechanism.
  Its header says which lines may move and why:
  - **Lines 20 to 83 and 87 must read the same** on both reads.
  - **Only lines 10 and 84 to 86 move:**
    - 84: the three K-07 floors, `convalidated` true (C4);
    - 85: client EXECUTE on the nine feedback functions, 9 → 0;
    - 86: client SELECT on the feedback tables, 2 → 0 (Sharon's Z2-1);
    - 87: every feedback record, identical.
  - **One difference from Bob's draft:** line 87 orders each table's rows by their `to_jsonb` text, because seven of the
    nine `feedback_*` tables have no `id` column. Sharon to confirm.
- **`dryrun-944520b0/`:** the local dry run.
  - **`reset-300.log`, `step0-BEFORE.txt`, `preservation-Z-BEFORE.txt`:** the eight migrations were held aside, the stack
    reset with the seed (300 / 20270122190000), then step 0 (all three counts 0) and the BEFORE read.
  - **`migration-up.log`:** `supabase migration up --local` applying the eight, with no notice. K-07 validated all three
    floors.
  - **`preservation-Z-AFTER.txt`:** the read at 308, with BEFORE's two `batas` values written in.
  - **`DIFF.txt`:** only lines 10, 84, 85 and 86 moved. Line 87 and every preserved line read identically.
  - **`v6-pre-request-AFTER.txt`, `c3w-r3-bahan-AFTER.txt`:** both print **OK**.

## After the promotion (the list)

1. `scripts/release/after-promotion/v6-pre-request.sql` prints **OK** (Z V6).
2. `scripts/release/after-promotion/c3w-r3-bahan.sql` prints **OK** (C3W-R3-BAHAN, still).
3. Preservation line 84 reads `convalidated` **true** for all three floors (Sharon C4).
4. **The owner, in the dashboard:** check that no `PGRST_DB_PRE_REQUEST` environment override is set on the API server.
   SQL cannot see one (Sharon's V6 limit, `79250267`).

`scripts/release/before-import/d1-multi-answer.sql` is a before-import report. It is **not** run at promotion.

## If a migration fails part-way

**Staging is left at the last whole migration applied,** because each file is its own transaction.

**Stop and report to the owner.** No AFTER read is taken, and nothing is retried without the owner.

## The dispatched sha (Bob 22:34Z, option (a))

- **CI and journeys** for Z9's verification of record are dispatched on claude/z at **9a819a7c**, the same sha for both.
- **The candidate's code is 7615d6b1.** `git diff --stat 7615d6b1 9a819a7c -- . ':!docs'` touches 0 files (Bob verified this, and so did stream A). 9a819a7c adds evidence documents only, so the candidate's code is identical.
- **Nothing is pushed** to claude/z until both runs have finished, so the dispatched sha stays the tip. Evidence written meanwhile is held locally, for example the third void pre-flight and RESTARTS.md's restart #7.
- **Local runs on 7615d6b1:** three pre-flights, all VOID because the session VM restarted (`preflight-7615d6b1-container-restart{,-2,-3}/`). Per ruling 86, no fourth was made. The verification of record is ci.yml on GitHub's runners (`EQUIVALENCE.md`), with the GREEN local run on f5700bd1. The diff since that run is test-only.
