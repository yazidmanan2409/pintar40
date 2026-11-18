# Ruling 55 · D-1 inventory, D-8 query, D-6 feedback round

Sharon, 18 Nov 2026 (14:00 UTC). Read-only. The local build is of `main` at `7ba18b03b47ec78f61b0e66cf1f11f1a4044534a`:
- a scratch Postgres 16 with pg_cron, the repo's `scripts/dev/golden-db.sh`, **284 migrations and 6 seeds applied**;
- one scratch-only patch: the local `supabase-shape.sql` lacks `auth.users.banned_until`, which hosted Supabase has, so it was added to my copy and not committed. **That gap in the shape file is a Z item;** the golden build fails on `main` without it.

## D-1 · live readers of `value -> 'pilihan'` (`pg_proc` and `pg_views`, every non-system schema): 13 found

| Reader | How it reads `pilihan` | Class | Affected by a multi-answer response |
|---|---|---|---|
| `session_review(uuid)` | `o.label = (f.value ->> 'pilihan')` | **learner-facing** (authenticated) | **Yes:** an array matches no option |
| `session_misconceptions(uuid)` | same | **learner-facing** (service_role; the review's misconceptions) | **Yes** |
| `reading_map(uuid)` | `o2.label = (g2.value ->> 'pilihan')` | **learner-facing** (authenticated) | **Yes** |
| `teacher_question_evidence(uuid, uuid)` | a join on `->> 'pilihan'`, and `'chosen', j.value ->> 'pilihan'` | **teacher-facing** (authenticated) | **Yes:** no match, and "chosen" shows raw JSON text |
| view `service_item_statistics` | a left join on `->> 'pilihan'` | **statistical** (service_role) | **Yes:** counted as no option |
| view `service_distractor_uptake` | a join on `->> 'pilihan'` | **statistical** | **Yes:** dropped |
| view `service_cohort_misconceptions` | a join on `->> 'pilihan'` | **statistical** | **Yes:** dropped |
| `session_answers(uuid)` | branches on `jsonb_typeof(... ) = 'array'` | learner-facing | **No:** array-aware |
| `grade_response`, `grade_kunci` | set-match on the array; scalar only for a string | scoring | **No:** correct, as stated |
| `record_answer(...)` | writes `{'pilihan': [..]}` or a scalar | writer | **No** |
| `koreksi_kunci_dampak`, `riwayat_soal` | `'pilihan'` is an **output key** (the option list) | not a response reader | **No** |

**So 7 are affected: 3 learner-facing, 1 teacher-facing, 3 statistical.** The repair and the guard test (C-2 (b)) should name exactly these 7. The seeded local world holds **3 MCQ_MULTI items, all APPROVED, with 0 final responses.**

## D-8 · the staging query: drafted and proved locally, NOT run

- **The ruling authorises the inventory, but not who runs it.** My standing rule is no staging action by me, and the owner has not told me otherwise in my own session. So I have not touched staging.
- **The query is ready**, in `D8-STAGING-INVENTORY-QUERY.sql`:
  - `begin transaction read only` … `rollback`;
  - counts of MCQ_MULTI items by `items.status`, and counts of their final responses by item status;
  - no row data.
- **Locally it gives** `items | APPROVED | 3`, with no final responses.
- **Two notes for the runner:**
  - "withdrawn" is not an item status (the enum runs INGESTED … SUPERSEDED). Withdrawal is on the release, so if it is wanted, join through the release;
  - verify the project (`keijhmdtsgrfvnvocfvk`, "pintar-staging") before running.
- **Bob may run it under ruling 55,** or the owner confirms to me directly and I run it.

## D-6 · the anonymous feedback round

- **What it collects:** learners answer a fixed questionnaire about a **named educator** (`feedback_cycles.subject_person_id`).
  - The responses are `{cycle, question_key, option_key}` with no person.
  - Eligibility is a separate, consumed `feedback_opportunities(person_id)` row.
  - The results are a sealed body above a threshold.
  - **This is educator-related evidence,** the kind 4.5-07 will protect.
- **Who can open it:**
  - **opening a cycle:** a HEAD_OF_DEPARTMENT or DEAN over an active academic class (`open_feedback_cycle`);
  - **the result:** the subject educator, or anyone with management scope over the class (`feedback_result`).
- **Is it reachable today?** In code, yes:
  - nine of its RPCs are granted to `authenticated`;
  - the routes are linked from `/belajar`, `/mengajar/[kelas]`, `/pimpinan/[simpul]` and `/konfigurasi`.

  In data, no: the local seed has 0 cycles. Staging's count is not read; D-8's query can add `select count(*) from feedback_cycles`.
- **The smallest containment that deletes nothing, in the database, reversible:**
  1. revoke EXECUTE from `authenticated` on `open_feedback_cycle`, `submit_feedback`, `close_feedback_cycle`, `publish_feedback_question_set` and `publish_feedback_threshold`, so that **no new cycle and no new response** can exist;
  2. keep `feedback_result` and the read RPCs, so any existing result stays readable by its subject and management, **or** revoke them too if the owner wants it fully dark;
  3. hide the links and routes, which is a screen change and secondary.

  Every table and row is untouched, and a re-grant restores it. **A test is needed:** each revoked function is not executable by `authenticated`, and the row counts are unchanged.

## Addendum · ruling 56 trigger: multi-answer content that can reach a learner (18 Nov 2026, 14:20 UTC)

**Found, in the repository's seed** (`supabase/seed/learning_cycle.sql`, the only seed file naming MCQ_MULTI), on the local build of `7ba18b03`:
- **All 3 MCQ_MULTI items** (`67943acd…`, `1fa89222…`, `0a463174…`, status APPROVED) are in lessons of the course **«Pecahan»** (`560c7f7d…`).
- That course has release `ec0d8036…`: **PUBLISHED, not withdrawn, with 1 learning assignment.**
- 0 have been presented yet. **But a seeded learner can be given them,** and any sitting would then meet the 7 affected readers.

**Where this matters:**
- **local and CI worlds,** which hold this seed;
- **any walkthrough built from this seed.** «Pecahan» is the fractions example in the roadmap's journeys.

`staging.yml` names no seed, so staging probably does not hold it. **That is unconfirmed until the D-8 query runs.**

**Under ruling 56, the entry paths are contained at once,** for whatever world a walkthrough uses. Bob decides how.
