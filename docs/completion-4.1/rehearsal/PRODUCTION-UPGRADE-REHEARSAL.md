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

The query is written: `stage2-production-counts.sql` (counts only, read only, valid at 111; tested on the synthetic
rows by every rehearsal run). It is not run against production until the owner authorises it.

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
| 44007832144 (`9141abe2`) | `1b1cada8` (main, 282) | Failed at the fixture (an MCQ_MULTI answer); the fixture was fixed |
| **44008372954** (`be0ae204`) | `1b1cada8` (main, 282) | **Green.** Fixture, Sharon's three blind spots, the QUICK guard probe, stage 2's query at 111. Below |

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

### Run 44008372954 (17 Nov 2026, 03:13 UTC): Sharon's review implemented

The rerun implements Sharon's review, `REHEARSAL-STAGE1-0ee5e36c.md` (`b9630a72`). The workflow is at `be0ae204`, and
the target is still `1b1cada8` (main, 282). **Green.** Run 44007832144 (`9141abe2`) failed first, at the fixture. The
learning-cycle school's draw can present an MCQ_MULTI question, and the fixture's answer helper gave one position where
`record_answer` takes an array. That was fixed in the fixture; no check was changed.

**What was added**, all under `docs/completion-4.1/rehearsal/`:
- `fixture-at-111.sql`: synthetic shapes at 111, written through 111's own functions wherever 111 has one
  (`launch_quick_assessment`, `start_learning_session`, `certificate_prepare` and `certificate_seal`, `pause_session`,
  `session_enforce_deadline`, `withdraw_release`). Ten "Murid Fiktif" learners, all on `example.invalid`.
- `stage2-production-counts.sql`: stage 2's query, counts only and read only. It is described below.
- `capture-at-111.sql`, `holder-read.sql`, `checks-after-upgrade.sql`, `quick-guard-probe.sh` and `rehearse.sh`:
  the BEFORE capture, the checks after the upgrade, and the guard probe.

**The result:**
- **The upgrade:** 171 migrations, applied in 5 s over the fixture. None failed.
- **The applied versions** equal `main`'s 282.
- **The db contract** (fable01) passes.
- **The comparison:** 118 tables were compared over their columns at 111. 101 are identical and 17 differ: the 16 of
  run 44002777230, unchanged, plus `auth.users`. In `auth.users`, one row of 111 was altered: the fixture's locked
  account, by L-1's rewrite (`20270116130000`, intended). The fixture's suspended account was left alone, as the rule says.

**Blind spot 1, backfills: closed.**
- 53 columns are added to tables of 111. Each is reported with its null and distinct counts over the rows of 111, matched
  by primary key (all 118 tables have one). The adding migration is named in the run summary.
- Each data-rewriting migration's own rule is asserted, and every assertion holds:

| Migration | The rule asserted | Rows of 111 |
|---|---|---|
| `20261021100000` | Every person has a `pintar_id`: not null, distinct, Crockford Base32 | 35 |
| `20261102100000` | `pass_mark` = the definition's `mastery_min`, with source BEFORE_SCHOOL_MARKS, unless PRE_TEST; otherwise none. Checked on assignments and sittings, and the fixture's PRE_TEST case stays empty | 6 and 8 |
| `20261118100000` | `learning_context` is ACADEMIC below the Jenjang and empty on the school and the Jenjang; `member_kind` follows it | 33 |
| `20270112195000` | `zona_waktu` = Asia/Jakarta | 6 |
| `20270115100000` | `revision` = 1, and the item was never edited | 44 |
| `20270115100000` | A release withdrawn before the upgrade carries its first RELEASE_WITHDRAWN audit row (the fixture's withdrawn release) | 4 |
| `20270116130000` | A ban of infinity becomes 2999-12-31 23:59:59 UTC; every other ban is unchanged; no infinity is left | 2 bans |
| `20261011100000` | The rows of 111 are not standard templates, and each of the 5 schools holds both standard reports | — |
| `20270114100000`, `20270119*` | No sitting of 111 carries a closure, a hold or an emergency mark | 8 |
| `20261201100000` | `*_as_issued` is empty on the certificates of 111 (there is no backfill), and the readers fall back | 1 |

**Blind spot 2, new tables: closed.**
- Six new tables hold rows after the upgrade.
- Two are filled from 111's rows by an `INSERT … SELECT`, and both rules hold:
  - `account_setup` (`20261021100000`): one REQUIRED row for each EMAIL account of 111 that is not an evaluation
    persona. That is 27 rows for 27 accounts.
  - `result_views` (`20261227100000`): one row for each POST_TEST sitting FINALIZED at 111, with `first_seen_at` equal to
    `finalized_at`. That is 1 row for 1 sitting.
- The other four are configuration:
  - `orang_lampiran`, 113 rows, from the catalogue and a values list;
  - `exposed_content_marks`, 260 rows;
  - `email_send_limits`, 3 rows;
  - `accountability_store`, 1 row.

**Blind spot 3, extra state: closed.**
- `cron.job` is absent at 111, because pg_cron is not installed there. After the upgrade it holds 2 jobs, both
  intended: `pintar-pengerjaan-tutup-terjadwal` (`*/5`, A1's closer) and `pintar-akuntabilitas-buang-lama` (daily).
- `storage.buckets` (1) and `storage.objects`' metadata (1 synthetic row) are unchanged.
- The jobs are held while the AFTER reads are taken, then made active again. No job ran before the hold.

**Sharon's question, the QUICK certificate (`20261113100000`): an issued certificate stays valid and reads as it did.**
- The fixture seals a certificate from a QUICK sitting at 111. It is ISSUED, with a placeholder signature.
- After the upgrade:
  - its row is unchanged over 111's columns;
  - its verification material (payload, signature, key version) is byte-identical;
  - `verify_certificate` still returns it as BERLAKU, with the same pass, predikat and school;
  - its holder's `my_certificate` returns every field 111 returned.
- The read paths: `verify_certificate` (the public check, behind `/api/verifikasi/[token]`),
  `certificate_verification_material` (what the endpoint recomputes the signature over) and `my_certificate`. None of
  them reads `mode_policy`. Only `certificate_eligibility` does, and it gates new certificates only.
- **The change is prospective.** A QUICK sitting that finished at 111 without a certificate was eligible at 111. It is
  no longer eligible: "mode QUICK does not certify".
- **The guard:** `20261113100000` refuses an ELIGIBLE, unsigned QUICK certificate. The main run never creates one. The
  probe does, inside one transaction that is never committed: it prepares the certificate, then applies 112 up to the
  guard. The guard raises its BOB-50 refusal naming exactly 1 certificate. Afterwards the fingerprint is the same and
  the database still holds 111 migrations.

**Stage 2's query** (`stage2-production-counts.sql`) **runs at 111 on the synthetic rows.** It returns 84 measures, and
the step checks that:
- the transaction is read only, and ends in a rollback;
- the output holds no email, no fixture name and no uuid;
- every guard measure is 0.

**Findings for Bob and Sharon** (reported here; no product migration was changed):
1. **A sitting that 111 had already EXPIRED, but never scored, stays unscored after the upgrade.** This is a probable
   defect.
   - `20270114100000` adds `closure_kind` with no backfill.
   - A1's closer (`pengerjaan_tutup_calon`) and the lazy check (`pengerjaan_putus_tenggat`) finalise an EXPIRED
     sitting only when `closure_kind` is DEADLINE or WINDOW_CLOSED.
   - The fixture's EXPIRED sitting with no result was not a candidate, and remained EXPIRED with no result after the
     closer's pass. The workflow reports it as a warning.
   - By contrast, the sitting that was past its deadline but still IN_PROGRESS was closed and scored as intended
     (IN_PROGRESS → FINALIZED).
   - Stage 2's "EXPIRED, not finalised (no result)" measure says how many production holds.
2. **Every existing EMAIL account, staff and learners, starts REQUIRED in `account_setup`** (`20261021100000`, "existing
   staff, C10"). It is intended by the migration's comment, but every production account holder will meet the setup
   step on their next sign-in. That should be a release note.
3. **The verification date of an existing certificate can move by one day.** `verify_certificate` now writes the
   issue day on the school's own clock (`20270113160000`, D-199; Asia/Jakarta by default). For a certificate issued
   between 17:00 and 24:00 UTC, the public date is the next day compared with what 111 showed. No row moves. Stage 2
   counts such certificates. The fixture's certificate was issued at 03:13 UTC, so its date did not move.
4. **On production, two migrations take a different path.** `20261006100000` and `20261007100000` take their
   "structural check only" path when `platform_environment` is `production`. The rehearsal's database is
   `development`, so it runs their behavioural probes instead. Stage 2 reports the flag.
5. **Four migrations refuse to apply over a data shape.** The synthetic data never meets one, by construction.
   Stage 2 counts each:
   - `20261202100000`: an option that names another school's misconception;
   - `20270112160000`: two live enrolments of one person in the same school, year and programme (a new unique index);
   - `20270113110000`: two sealed replacements of one certificate;
   - `20270112210000`: two `promotion.applied` audit rows that share a run id.

**The fixture's coverage of the data-rewriting migrations, 112 to 282:**
- **They act on fixture or seed rows:** `20261011100000`, `20261021100000`, `20261102100000`, `20261110100000`
  (its flip-and-restore self-test), `20261113100000`, `20261118100000`, `20261211100000`, `20261227100000`,
  `20270112195000`, `20270115100000`, `20270116130000`, and the registry, catalogue and scoring rewrites.
- **They cannot act on any 111 database:**
  - `20270117170000` (`person_suspensions`) and `20270119120000` (`maintenance_windows`) update tables created after
    111, so those tables are empty at the upgrade, in production too.
  - `20270112200000`, `20270117140000`, `20270118120000`, `20270119180000` and `20270120200000` write data only
    inside the function bodies they install.
- **A3's lineage shapes are in place for its backfill.** The fixture holds two definitions sharing (institution, title,
  mode), a course chain of depth 2, and a module with no predecessor.

**Still not covered:**
- Production's volume; stage 2's ten largest tables size it.
- Production's real shapes, until stage 2 is authorised.
- A3, which is not in the target yet.


## Stage 2 · read-only production counts: DONE (17 Nov 2026, owner-authorised)

The result is in `stage2-production-counts-RESULT-2026-11-17.md`:
- **Identity:** production is exactly at 111. The md5 of its version list equals the repository's, so there is no drift.
- **Data:** it is essentially empty: 1 person, 1 email account, 3 tenants, and no items, courses, sittings or
  certificates.
- **Guards:** every one reads 0, so no 4.1 migration would refuse.
- **REH-1 and REH-3:** neither has any production exposure.
- **A copy of production data is not needed.**
