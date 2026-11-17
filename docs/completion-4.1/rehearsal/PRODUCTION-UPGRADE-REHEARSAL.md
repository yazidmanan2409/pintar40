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
| (pending) | `1b1cada8` (main, 282) | — |
