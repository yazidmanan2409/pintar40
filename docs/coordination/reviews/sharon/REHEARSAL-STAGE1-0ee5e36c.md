# The production upgrade rehearsal, stage 1 (synthetic): method, classification and seed

Sharon, 17 Nov 2026 (03:00 UTC). Read-only. **What I reviewed:**
- `docs/completion-4.1/rehearsal/PRODUCTION-UPGRADE-REHEARSAL.md` (`0ee5e36c2bcf5e611bda4eba1eadb652f292286a`);
- `.github/workflows/rehearse-production-upgrade.yml` (the fingerprint, the after-read and the comparison steps), on `claude/bob-41-master-plan`;
- run 44002777230's result, as recorded.

## What holds now

- **The method is sound for what it checks, and the result stands:** 103 of 119 tables are identical, and the 16 that differ are intended.
- **It has three blind spots,** each given here as an addition for the reruns. None of them invalidates this run.
- **The September seed lacks the shapes most of 4.1's data migrations act on.** So this run proves the path more than it proves the data. Stage 2's counts are listed in (c).

## (a) Does the method miss anything?

**Renamed, dropped or retyped columns cannot hide.**
- The after-read runs **the same SQL over 111's column names**, with `ON_ERROR_STOP`. A dropped or renamed 111 column, or a dropped table, fails the step loudly. **Run 44002777230 is green, so no 111 column or table was dropped or renamed.**
- A retyped column changes `row(...)::text` only if its value or representation changes, so it shows as a difference, never as a silent pass.

**Blind spot 1: columns added after 111, on rows that existed at 111.**
- They are excluded from both fingerprints, so **a wrong backfill is invisible.** A3's `lineage_root_definition_id` is exactly that case.
- **Add:** for every column added to a pre-existing table, report its null count and distinct count over the rows that existed at 111 (by primary key, from the before-snapshot).
- For each backfilled column, assert the rule its migration states. For example: no null, and each root resolves to a definition in the same line.

**Blind spot 2: new tables populated from existing data.**
- A table created after 111 is not fingerprinted at all, yet a migration may fill it from 111's rows.
- **Add:** list every new table with its row count after the upgrade. For any that is non-empty and not configuration, name the migration that fills it and the rule its rows must satisfy.

**Blind spot 3: schemas outside `public` and `auth`.**
- **Add** `cron.job`, which is pg_cron's definitions (the commands, not the run history), `storage.buckets`, and `storage.objects`' metadata columns.
- 4.1 adds pg_cron jobs and may change bucket policy, and staging's checks rely on these.

## (b) The classification: accepted, with one question

- **The 16 are correctly attributed,** and each is a configuration, registry, policy or append-only change.
  - The audit log is append-only.
  - The registry follows the functions.
  - The lexicon, the metric and scoring supersession chains, and the public-surface tightening are each intended, with their history kept.
- **One question for Bob or the owner,** not a defect: `20261113100000`, "a quick assessment does not certify".
  - `certificates` is identical, so no existing certificate is rewritten. **But does a certificate issued from a quick assessment before the upgrade stay valid and displayed as it was?**
  - If any read path (the certificate page, verification, a report) applies today's `mode_policy` to old certificates, the change is retroactive, though no row moved.
  - Name the read paths and state their behaviour.

## (c) What the seed lacks, and what stage 2 should count

**The finding:** `accounts` identical means the seed held no locked account, so 4.0's L-1 lock-instant rewrite acted on **nothing**. The same is true of every data migration whose predicate the seed does not meet.

**What stage 2's read-only fingerprint should count,** as counts only, with no content:
1. **Per data-rewriting migration, 112 to 282 (and later A3's):** the number of production rows matching its UPDATE or DELETE predicate. The rehearsal then knows which of them will act in production, and on how much.
2. **Accounts:**
   - locked accounts, as L-1's predicate;
   - pending password-write permits;
   - activation grants;
   - auth users with no person, and persons with no account.
3. **Sittings at upgrade time:**
   - CREATED, IN_PROGRESS and PAUSED;
   - EXPIRED but not finalised;
   - those past their deadline.
   - These are A1's closer, A2a's marks and the start path's states. **An open sitting at upgrade time is the case stage 1 cannot show.**
4. **Enrolment and membership shapes:** persons with more than one active enrolment, open memberships with `valid_to` null in more than one class, departures and suspensions.
5. **For A3's lineage backfill, which refuses rather than guesses:**
   - definitions grouped by (institution, title, mode) with more than one row;
   - course chains through `supersedes_course_id`, by depth;
   - definitions whose module has no `supersedes_module_id` match in the next revision.
   - Any group the backfill would reject is a production blocker to know about **before** the upgrade, not during it.
6. **Volume:** row counts for the ten largest tables, so the 6-second figure can be scaled, and any rewrite over a large table can be timed against the statement timeout.

**And for stage 1's reruns:** add synthetic rows for shapes 2, 3 and 5 to the rehearsal's own fixture, applied on the 111 base, so that each data migration acts on at least one row.

## Addendum, 17 Nov 2026 03:45 UTC: run 44008372954, the stage-2 counts, and REH-1 to REH-4

**What I read:**
- Bob's report on run 44008372954 (commits `9141abe2`, `be0ae204`, `359b90c4`);
- `stage2-production-counts.sql` (229 lines) on `claude/bob-41-master-plan`: its safety header and its outputs;
- for REH-1, `session_enforce_deadline` at 111 (20260913090000) and 20270114100000:18–30 and :319–365.

**My three blind spots are closed:**
- 53 new columns on 111's rows are counted, with 10 backfill rules asserted;
- the 6 new tables with rows are listed, and the 2 filled from old data are checked;
- `cron.job` and storage are added.

**The quick-assessment certificate question is answered:** a certificate issued before reads and verifies byte-identically.

**The stage-2 query is accepted as safe to propose for the owner's authorisation:**
- one transaction, `set transaction read only`, a 60 s statement timeout, and a rollback;
- the outputs are counts and catalogue metadata only, with no names, emails or row content.
- **Not run by me,** and not to be run without the owner.

**REH-1: confirmed. It is a blocker for any production release.**
- **At 111, `session_enforce_deadline` sets a sitting to EXPIRED and never scores it.** So *every* expired sitting in production is expired and unscored.
- **20270114100000 builds the closer to score only sittings it marked** (`closure_kind` DEADLINE or WINDOW_CLOSED). It states that "an EXPIRED sitting from before this migration carries no marking and is never touched".
- **So after the upgrade, every pre-upgrade expired sitting stays unscored, permanently and silently.** The learner has no result, and nothing will produce one. *Could reasonably have been anticipated (Q4, before and after):* the design wrote down this omission, and nobody asked how many such rows production holds.
- **The ruling on where:** Z, as a data migration before the production release, not A3. It is outside A3's boundary list, and it must be in the release candidate that goes to production.
- **The ruling on what, with one product decision left to the owner:**
  - **(i), my recommendation:** mark each pre-upgrade EXPIRED sitting with no result as `closure_kind = 'DEADLINE'`, with `closure_deadline` = its `authoritative_deadline` and `closure_at` = the migration's instant. The closer then scores it on its recorded answers, which is 4.1's own rule (doc 04 §3). It is audited per sitting, and stated in the release note.
  - **(ii):** mark them not counted.
  - **(iii):** leave them for teachers, who already have TEACHER_SCORED and TEACHER_NOT_COUNTED. If so, a list of them goes to each school.
  - **The owner chooses.**
  - **Whichever is chosen:** red first, with a rehearsal fixture of an EXPIRED unscored 111 sitting, showing it is resolved after the upgrade by the chosen rule. The scoring must use the definition and version the sitting was taken on, and stage 2 counts them, which its query already does.
  - A sitting with no `authoritative_deadline` cannot take (i) as written, because the constraint needs `closure_deadline`. Count those separately.

**REH-3: intended for new certificates. For old ones, count before deciding.**
- 20270113160000 shows a public certificate's date in the school's own zone. For a WITA or WIT school, a certificate issued between 00:00 and 01:00 or 02:00 local time now shows a date one day later than under the old Jakarta rule. A printed copy would then disagree with verification.
- **Stage 2 should count** certificates whose date differs between the two zone rules.
- If the count is 0, the question is moot. If not, the owner chooses between keeping the old date for certificates issued before, or accepting the shift with a note.

**REH-4 and REH-2 are accepted as Bob states them.**
- REH-4: the four refusing migrations are counted by stage 2, and any count above 0 is a blocker found before the upgrade.
- REH-2: every email account starts REQUIRED in `account_setup`. That is a release note, and the owner should see it among the release's user-facing changes.

## Addendum, 03:55 UTC: stage 2 has run, on the owner's authorisation

- **Bob's run, read only, on pintar-production** (`3d983927`):
  - production is exactly at 111, with a matching version-list md5;
  - it is essentially empty: 1 person, 1 email account, 3 tenants, and 0 items, courses, definitions, sittings, results, certificates and enrolments;
  - every guard reads 0.
- **REH-1 stays in Z as ruled,** with option (i) as the default, built red first.
  - Production's 0 sittings today removes the urgency, not the fix. The release candidate must still handle the shape, because data can arrive before release day.
  - **The release-day rerun of stage 2 decides:** if it reads above 0, the choice of (i), (ii) or (iii) goes to the owner.
- **REH-3 is moot today,** with 0 certificates. The two-zone-rule count goes into the release-day query.
- **REH-4 is closed for production at today's data.** The release-day rerun repeats it.
