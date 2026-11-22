# Verification 1 · Assistance in a certifying test, and what a retake draws (PETE-06, O-7)

Agent verification, 22 Nov 2026. Ruling 58. Run on `origin/main` `706fe8c5` in a detached worktree, against a scratch
Postgres 16 on this machine; no hosted database touched, nothing in the repository changed.

## Setup (shared by V1, V2, V4, V5, V6)

1. `git worktree add --detach /var/tmp/v58 origin/main`; `node_modules` linked from the main checkout.
2. A scratch cluster: `initdb -D /var/tmp/v58pg/data`, port 55432, with `pg_cron` (Ubuntu `postgresql-16-cron`;
   `shared_preload_libraries='pg_cron'`), which `20270114110000` requires.
3. **`scripts/dev/golden-db.sh` does not build `main` as it stands:** `20270116130000` updates
   `auth.users.banned_until`, which `scripts/dev/supabase-shape.sql` does not create. Scratch workaround only: after the
   shape file, `alter table auth.users add column banned_until timestamptz` (plus four other GoTrue columns, added
   defensively), then `supabase migration up --include-all` and the six seeds in `config.toml` order. 290 of 290
   migrations applied, every seed loaded.
4. Per check, a clone (`create database … template v58base`), `selftest/db/fable0*.sql` loaded, and
   `select * from selftest.run_fable03()` once to prime the cycle fixture (12/12 rows green on a fresh clone). The
   learner, teacher and administrator are the seed's synthetic `siklus-*` personas, through `selftest.as_user`.

## (a) Can a learner get the three assistance levels in POST_TEST and STANDALONE? CONFIRMED, by design

| What | Evidence |
|---|---|
| `mode_policy`: `POST_TEST` and `STANDALONE` both `allows_assistance = true`, `certifies = true` | `20260914093000`:54, 64; read back from the scratch database |
| `open_assistance` refuses only when the mode forbids it, the hesitation window has not passed, or a level is skipped; levels 1–3 are `items.arah_berpikir`, `items.petunjuk`, the lesson's first worked example | `20260914093000`:118 ff. |
| The window comes from the definition (`hesitation_window_seconds`); **null means no help.** An imported chapter's Uji Penguasaan is made with **25 s**; a Studio author may set it or clear it while drafting | `20261202100000`:540–546; `save_assessment_definition` |
| **Runtime:** `F03-T08` on the clone: a POST_TEST sitting, the window aged past, levels 1, 2, 3 opened, 4 telemetry events written, the score equal to an unaided sitting with the same answers (1.0000 both) | `select test_id, ok, detail from selftest.run_fable03() where test_id = 'F03-T08'` → `t` |
| **Nothing on the result or certificate says help was used.** Only `assistance_state`, `open_assistance`, `dismiss_assistance` read `assistance_grants` or `telemetry.assistance_events` (catalogue search over `pg_proc.prosrc` and view definitions) | scratch catalogue query |

## (b) On a retake, the same questions or a new draw? CONFIRMED: **the same questions for an imported chapter**

How the paper is drawn (`assemble_session`, as deployed): the pool is `drawable_items_for_definition`; each item gets
`seeded_index(session.shuffle_seed, …)`; the first `item_count` are taken; order (and options) reshuffled under
`ITEMS_AND_OPTIONS`. **The only exclusion is the learner's own Pemetaan Awal** (`excluded_items_for_post_test`,
`20270115110000`:1075–1082, `s.mode = 'PRE_TEST'`): **nothing excludes questions from an earlier Uji Penguasaan.**

An imported chapter (`lesson_package_materialise`, `20261202100000`:525–546): the Uji Penguasaan's `item_count` is
**the number of questions marked POST_TEST** ("Every marked question is drawn"), `difficulty_mix {}`,
`attempt_limit 2`. The pool therefore equals the paper.

**Runtime** (scratch, as the learner): `purge_cycle_evidence()` → `pre_finished(aa_pre)` →
`s1 := start_learning_session(aa_post)`, `answer_paper(s1, false)`, `finish_my_session(s1)` →
`s2 := start_learning_session(aa_post)` → compare `presented_items` of `s1` and `s2`. Shape B first runs, as the owner,
inside a transaction that is rolled back afterwards:

```sql
alter table items disable trigger user; alter table assessment_definitions disable trigger user;
with c as (select i.id, row_number() over (order by i.id) n from items i join lessons l on l.id = i.lesson_id
             join modules m on m.id = l.module_id
            where m.course_id = (select course from selftest.cycle_fixture()) and i.parallel_group is null
              and i.item_type in (select item_type from item_type_learner_support))
update items i set cycle_role = case when c.n <= 4 then 'PRE_TEST'::assessment_mode
                                     when c.n <= 12 then 'POST_TEST'::assessment_mode end from c where c.id = i.id;
update assessment_definitions d set difficulty_mix = '{}', safety_critical_minimum = 0,
       item_count = (select count(*) from eligible_items_for_definition(d.id))
 where d.id in (select def_pre from selftest.cycle_fixture() union all select def_post from selftest.cycle_fixture());
```

| Shape | Attempt 1 | Attempt 2 | Result |
|---|---|---|---|
| A · seed definition (pool 20, paper 5) | 5 items | 5 items | different random draw; overlap 1 of 5 and 3 of 5 in two runs |
| B · imported shape (4 items marked PRE_TEST, 8 POST_TEST; both definitions sized to their marks, as `materialise` does; set on the scratch clone in a rolled-back transaction) | 8 items | **the same 8 items** | order reshuffled (`ITEMS_AND_OPTIONS`) |

Between the attempts the learner's review (`session_review`, `reveals_rationale_on_review = true` for POST_TEST) shows,
per question, their own answer, right or wrong, and the rationale (`alasan`) and the thinking direction (`arah`).

## The answer O-7 needs

- **An imported chapter (every PINTAR content package): yes, always.** Attempt 2 presents exactly attempt 1's questions,
  reordered, with options reordered, after the learner has seen which they got wrong and why. Up to 2 attempts, plus
  one per approved extra-attempt request.
- **A chapter whose bank is larger than its paper (Studio-written, or the seed): a fresh random draw each time,** with
  chance overlap; no rule prevents repeats.
- **Help:** any certifying Uji Penguasaan with a window (every import: 25 s) offers all three levels, at no cost to the
  score, and the result does not record that help was used.

## Classification

- **Severity:** High for certificate readers (a pass may rest on a repeated paper and unrecorded help); Medium for
  learners (a retake rewards remembering; fair to everyone equally, but not what "mastery" suggests).
- **Proposed: Z for the decision and its disclosure** (O-7 and D-2: is a repeated paper and help-on-request acceptable
  for a certificate? If yes, the orientation and certificate say so). **The engineering for a non-repeating retake**
  (excluding attempt-1 questions needs banks larger than the paper) **is 4.5.**
- Not run: a STANDALONE sitting (same policy row, read only); a full package import (imitated, as stated).
