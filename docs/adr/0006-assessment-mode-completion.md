# ADR-0006 — Completing `assessment_mode` without renaming anything

**Date:** 2026-09-14
**Phase:** FABLE-04
**Status:** Accepted
**Supersedes:** nothing. **Superseded by:** nothing.
**Amends:** nothing. ADR-0004 §4 and ADR-0005 §2 are the constraints this obeys.

---

## 1. The constraint that decided it

`mode::text` is inside the `PINTAR-CONTENT-SHA256/1` preimage (ADR-0004). A
sealed release's content hash is computed over the authored payload, and the
mode label is part of it. Renaming a label — `QUICK` to `QUICK_ASSESSMENT`,
`PRE_TEST` to `LEARNING_CYCLE_PRETEST` — would change the hash of every sealed
release that carries one, which is the single thing ADR-0004 exists to prevent.
ADR-0005 §2 already recorded the consequence: **labels are added, never
renamed**, and the phase prompt's mode names are mapped to them.

So FABLE-04 §1's table is a mapping, not a rename list:

| Prompt name | Enum label | Added in |
|---|---|---|
| `LEARNING_CYCLE_PRETEST` | `PRE_TEST` | FABLE-03 |
| `LEARNING_CYCLE_POSTTEST` | `POST_TEST` | FABLE-03 |
| `QUICK_ASSESSMENT` | `QUICK` | FABLE-03 |
| (none — a standalone instrument) | `STANDALONE` | FABLE-03 |
| `PRACTICE` | `PRACTICE` | 0038 |
| `TEST` | `TEST` | 0038 |
| `EXAM` | `EXAM` | 0038 |
| `PUBLIC_DEMO` | `PUBLIC_DEMO` | 0038 |
| `PAPER` | `PAPER` | 0038 |

Nine labels, and F04-T01 proves behaviourally that adding the five did not move
a single sealed release hash — it re-computes the hash of every PUBLISHED
release after the migration and compares it to what was sealed.

## 2. Why 0038 adds labels and does nothing else

PostgreSQL commits an `ALTER TYPE … ADD VALUE` but refuses to *use* the new
label in the same transaction. A migration that added `PRACTICE` and then
inserted a `mode_policy` row for it would fail at apply time, every time. So
0038 is a migration that adds five labels and contains no other statement, and
0039–0040 use them. The same shape recurs in 0047/0048 for `rpc_exposure`.

This looks like ceremony and is not: it is the only ordering the database
permits, and writing it as one migration is a defect that surfaces only when
someone replays the stack from empty.

## 3. Policy lives in a table, and completeness is derived

Each mode's policy — whether hints are offered, whether retries are permitted,
the highest bank tier it may draw from, whether an identity confirmation is
required, cooling — is a row in `public.mode_policy`, not a `case` in a
function. `assert_mode_policy_complete()` then derives the expected set from
`pg_enum` and fails if any label has no row.

That derivation is the point. A name list in the assertion would pass for the
nine modes that exist and say nothing about the tenth, which is exactly the
criticism 0036 made of 0035's hardcoded entry-point array. The mode that gets
added without a policy is the one the assertion has to catch.

`EXAM` is the tier ceiling that matters: `mode_policy.max_bank_tier` for
`QUICK` is `TEST`, and `launch_quick_assessment` reads the ceiling from the
table rather than hardcoding it — so INV-12's "EXAM items never appear in
PRACTICE/TEST/QUICK_ASSESSMENT sessions" holds by construction rather than by
a comparison somebody has to remember to write.

## 4. What `PUBLIC_DEMO` and `PAPER` are, and are not

Both are FOUNDATION NOW. `PUBLIC_DEMO` exists as a label, as an
`evidence_channel`, and as an evidence-class cap — a session delivered on the
`PUBLIC_DEMO` channel derives at most `PUBLIC_DEMO` evidence no matter how
official its tenant is, which F04-T16 proves on the bootstrap tenant itself.
There is **no public demo UI in this phase**, by the prompt's own instruction.

`PAPER` is a label and nothing more. Evidence enters through the paper
channels (`PAPER_MANUAL_ENTRY`, `PAPER_IMPORTED`) that FABLE-02 already built;
no workflow is added here, and none is implied.
