# D-6 · do the feedback round's read RPCs serve a legitimate existing purpose? (ruling 81)

Sharon, 23 Nov 2026. Read-only, from the migrations on `claude/z` at `f258e5f4`.
The five write RPCs are revoked under D-6: open, submit, close, and the two publish RPCs.
The four read RPCs granted to `authenticated` are as follows.

| Read RPC | What it is for | After the writes are revoked | Recommendation |
|---|---|---|---|
| `feedback_questionnaire(uuid)` | the questions an eligible learner answers; refuses any cycle not `OPEN` | only serves `submit_feedback`, which is gone. It still names the educator and class to a learner | **revoke** |
| `my_feedback_cycles()` | a learner's `OPEN` cycles still to answer | lists cycles that can no longer be answered or closed, naming the educator | **revoke** |
| `feedback_subjects_for_class(uuid)` | which educators management may open a round about | only serves `open_feedback_cycle`, which is gone. It discloses which colleagues may be reported on | **revoke** |
| `feedback_result(uuid)` | a closed round's result, for its subject educator or management over its class | **the one possible purpose:** reading a round already collected, if one exists | **keep only if one exists** (below) |

## The test for `feedback_result`

- **The purpose exists only if a deployed database holds a closed round,** that is a `feedback_cycles` row in state PUBLISHED or WITHHELD.
  - An `OPEN` round can no longer close, because close is revoked. For it, `feedback_result` returns only a statement and no number, so reading it serves nothing.
- **Bob, in read-only transactions on staging and production:**
  - `select state, count(*) from feedback_cycles group by state`;
  - `select count(*) from feedback_results`.

  Counts only, no row data.
- **If both show 0 closed rounds:** revoke `feedback_result` as well, so all nine are revoked. The round is fully dark, reversible, with nothing deleted.
- **If any closed round exists:** keep `feedback_result` alone.
  - **The migration header states the purpose:** "the subject educator, or Management over the class, reads a round already collected".
  - **The test asserts its authority:**
    - another authenticated person (an educator who is not the subject, or a learner) gets the refusal;
    - anon has no EXECUTE;
    - an `OPEN` cycle returns no numeric key.
  - **The route stays.** The links to the answering and opening screens are hidden.

**My default, absent the counts, is to revoke all four.** I expect 0 closed rounds before launch, but the counts decide.

**Could reasonably have been anticipated:** the stranded `OPEN` round. The ruling 55 record (item 2) offered keeping the reads without asking what an unclosable `OPEN` cycle leaves readable. That is my own gap.

## Outcome (23 Nov 2026, 09:40 UTC)

- **Bob's counts:** taken read-only, under the owner's authorisation (`Z-PLAN-APPROVAL.md` `40a87d25`).

  | Environment | `feedback_cycles` | `feedback_results` |
  |---|---|---|
  | production | 0 | 0 |
  | staging | 0 | 0 |

- **There is no closed round anywhere,** so all four reads are revoked and all nine RPCs are dark.
- **At Z2 I check:**
  - the migration header's reason and its restore path (a re-grant);
  - Z-D6-01's assertions: none of the nine is executable by authenticated or anon, and every feedback table's row count is unchanged.
