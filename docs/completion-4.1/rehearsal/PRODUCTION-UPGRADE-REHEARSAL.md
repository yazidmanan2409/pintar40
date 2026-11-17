# Production upgrade rehearsal: 111 → 282

Bob, 17 November 2026. **Owner:** "Agree with your assessment and recommendations. Do it!!" (17 Nov).

## Why

Production is at migration 111 (app `5b5b68d`, September). It has been untouched by 4.0 and 4.1. Staging and `main` are
at 282. No one has yet rehearsed the whole 111 → 282 jump from production's own starting point. CI's upgrade-path job
only goes from the previous `main`. The release gates list "an upgrade rehearsal from migration 111" as open.

## Stage 1: synthetic, no cost (running)

`.github/workflows/rehearse-production-upgrade.yml`, on this branch only. It never reads a secret, and never reaches
staging or production.

1. **Build.** It builds the database exactly as `5b5b68d` defines it, with migrations 1–111 and that commit's own
   synthetic seed, on a throw-away local stack.
2. **Check the base.** It checks that each of the 111 is byte-identical in the target (forward only).
3. **Before.** It fingerprints every table in `public` and `auth`, over the columns that exist at 111.
4. **Upgrade.** It applies the target's migrations 112 onward, timed.
5. **After.** It fingerprints the same columns again, and lists every table whose pre-existing rows changed.
6. **Confirm.** It checks that the applied versions equal the target's, and runs the db contract (fable01) on the result.

**A changed table is a finding, not a failure.** Some 4.1 migrations rewrite existing values on purpose; for example,
4.0's L-1 rewrites stored lock instants once. Each change must be named, justified by its migration, and reviewed by
Sharon. An unexplained change is a defect.

**Rerun:** after each batch lands on `main` (A3, C3w-1, Z), and on Z's final candidate. A3's lineage backfill, which
refuses rather than guesses, is the case the rehearsal exists for.

## Stage 2: fidelity against production (needs the owner's separate authorisation)

1. **A read-only fingerprint of production:** its migration list and catalogue fingerprint (the existing
   `checkpoint/evidence/rollback/catalogue-fingerprint.sql`), plus row counts per table. No content. This confirms
   production is exactly at 111 with no drift, and sizes the data.
2. **A copy of production data:** only if stage 1 or the fingerprint gives a reason. Production bundles are never
   decrypted on a runner (D-107 D5), and production may hold real people's data. So this would be the owner restoring
   production into a separate throw-away project, at a cost and with a real-data handling decision. Not proposed now.

## Results

| Run | Target | Result |
|---|---|---|
| 44001512901 (`157ebd5c`) | `1b1cada8` (main, 282) | Green; the comparison counted added rows as changes, so it was refined |
| **44002777230** (`1f924a73`) | `1b1cada8` (main, 282) | **Green.** The classification is below |

### Run 44002777230 (17 Nov 2026, 02:24 UTC)

- **The base:** `5b5b68d` with 111 migrations. Each of the 111 is byte-identical in the target, so the upgrade path is
  forward-only.
- **The upgrade:** 112 → 282, **171 migrations, applied in 6 s** on the synthetic seed. Each migration ran in its own
  transaction, and none failed.
- **The result:**
  - the applied versions equal `main`'s 282;
  - the db contract (fable01) passes T01 to T22: no table without RLS, no function executable by anon, no function
    without a `search_path`.
- **Data:** 119 tables in `public` and `auth` were compared over their columns as they exist at 111. **103 are
  identical, row for row.** That includes every table of people, accounts, auth users, enrolments, courses, items,
  assignments, sittings, responses, results, official results and certificates.
- **16 differ.** All 16 are configuration or registry tables, plus the audit log:

| Table | Rows of 111 altered or removed | Rows added | The migration that does it, and whether it is intended |
|---|---|---|---|
| `audit_log` | 0 | 12 | Migrations record their one-off acts; append-only. **Intended** |
| `client_rpc_registry` | 14 | 204 | Each new client function is registered; existing entries have their notes or classification updated, or are removed when the function is retired: `20261007100000`, `20261009100000`, `20261016100000` (`publish_readiness` removed), `20261017100000`, `20261024100000`, `20261111100000`, `20261118100000`, `20261122100000`, `20261201100000`, `20261212100000`, `20261221100000`, `20261231100000`, `20270112130000` (`sesi_tempat*` removed), `20270112190000` (`period_rollover` removed). **Intended:** the registry follows the functions |
| `doctrine_lexicon` | 4 | 4 | `20261211100000_db_wording_follows_terminology_v1`: three wording updates to terminology v1. **Intended** |
| `metric_catalogue` | 1 | 9 | MC-2's row gains `superseded_by` as MC-3 to MC-10 are added (`20261025100000` … `20270113150000`). **Intended:** the catalogue's supersession chain, history kept |
| `mode_policy` | 1 | 1 | `20261113100000_a_quick_assessment_does_not_certify`: a quick assessment no longer certifies. **Intended policy change** |
| `public_surface_registry` | 1 | 19 | `20261008100000` removes `published_lessons` from the public surface ("lesson content is not public"); `20261114100000` updates one entry. **Intended,** and a tightening |
| `scoring_policy` | 1 | 2 | `20261129100000`: `pintar-scoring/1` is marked superseded by `pintar-scoring/2`. **Intended:** history kept |
| `content_status_transitions`, `metric_calculator_scope`, `metric_definitions`, `metric_sources`, `question_health_thresholds`, `readiness_tiers`, `record_class_registry`, `report_template_metrics`, `report_templates` | 0 | 2 to 130 | New configuration rows only. **Intended** |

**Verdict (Bob; for Sharon's review):** every alteration is a named, deliberate configuration change made by its
migration. No learner, school or assessment record is altered. **No defect found.**

**What this run does not cover:**
- the synthetic seed is small, so 6 s says nothing about production's volume;
- the September seed may not contain every shape real data has, such as locked accounts or old-style sittings;
- A3's lineage backfill is not in the target yet.

Stage 2's read-only fingerprint would cover the first two. The rehearsal reruns when A3 lands.
