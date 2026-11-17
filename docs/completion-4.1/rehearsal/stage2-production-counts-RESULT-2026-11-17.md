# Stage 2 · read-only production counts: result (17 Nov 2026)

- **Owner's authorisation:** "production fingerprint authorised", 17 Nov 2026.
- **Run by:** Bob, about 03:30 UTC, through the Supabase connection.
- **Project:** `trtlvibiybwixfumjrrx`, verified by read as **`pintar-production`** (ap-southeast-1, ACTIVE_HEALTHY) before
  the run.
- **The query:** `stage2-production-counts.sql`, at sha256 `3b46ea54…`. It was run as two statements, the counts and
  then the volume, each after `set transaction read only`, with the file's comment lines removed and its text otherwise
  verbatim.
- **What it returns:** counts only. No row content, name, email or identifier was read or recorded. **Nothing was written.**

## Identity: production is exactly at 111, with no drift

| Measure | Value |
|---|---|
| Migrations | **111**, max `20261005120000` |
| md5 of the ordered version list | `4206fb39ef174fdeb266de15002608c7`, **equal to the repository's 111 at `5b5b68d`** |
| platform_environment = production | 1 |
| pg_cron installed / cron jobs | 0 / 0 (4.1's migrations install them) |

## Data: production is essentially empty

| Measure | Value |
|---|---|
| Institutions (tenants) / of which INSTITUTION | 3 / 2 |
| Persons / auth users / accounts (EMAIL / card) | 1 / 1 / 1 / 0 |
| Locked, suspended or banned users; orphans; anonymised; evaluation personas | all 0 |
| Activation grants | 0 |
| Items, courses, assessment definitions, assignments | 0 |
| Sittings (any status), results, certificates, transfers, enrolments | 0 |
| Storage buckets / objects | 1 / 0 |
| Largest table | `supabase_migrations.schema_migrations`, about 1 MB. Every data table is under 250 KB |

## Guards: all 0. No 4.1 migration would refuse on production

| Guard | Count |
|---|---|
| `20261113100000`: ELIGIBLE unsigned QUICK certificates | 0 |
| `20261202100000`: options naming another school's misconception | 0 |
| `20261219100000`: EXECUTED transfers with no target period | 0 |
| `20270112160000`: duplicate live enrolments | 0 |
| `20270112210000`: duplicate promotion run ids | 0 |
| `20270113110000`: certificates with two sealed replacements | 0 |

## What this settles

- **REH-4: closed for production.** No guard would refuse.
- **REH-1: no production exposure.** Production holds no sittings, so no EXPIRED, unscored sitting can exist there. It
  stays a fix for 4.1's correctness (Sharon rules it), but it is not a release-day risk on production's current data.
- **REH-3: no production exposure.** Production holds no certificates.
- **REH-2:** production's one email account will meet the account setup step after the upgrade.
- **A3's lineage backfill:** production holds no assessment definitions or courses, so it has nothing to be ambiguous
  about.
- **Volume:** negligible. The synthetic rehearsal's 5–6 s is a fair estimate of the migration time, and the upgrade's
  risk lies in the schema, not in the data.
- **A full copy of production data (stage 2b) is not needed.** There is no real data to rehearse on.
