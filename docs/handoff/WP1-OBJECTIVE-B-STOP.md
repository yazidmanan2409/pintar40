# WP1 Objective B — STOP: the minimum missing product decision

**Status:** implementation withheld. Objective A shipped independently (migration
`20260923090000`). Nothing in `person_visible_to_me`, `has_scope` or
`role_capabilities` was changed.

**Why this file exists rather than a migration:** the work package instructs that
if the architecture cannot distinguish a deliberate individual access from
ordinary roster browsing *without inventing a new product concept*, the work
stops and reports the minimum missing decision, rather than silently inventing
purpose codes or approval states. It cannot. This is the report.

---

## 1. What was measured

On the repaired schema, in the demonstration tenant, with a DEAN scoped to
`FACULTY Sekolah Dasar` — a properly scoped Management role, not an
institution-wide one:

| question | answer |
|---|---|
| `select count(*) from public.persons` as that dean | returns every enrolled learner under the faculty |
| `person_visible_to_me(<a learner>)` | `true` |
| `metric_evaluate('learner.result', <that learner>, …)` | `not_permitted` |
| `array_length(role_capabilities('DEAN'), 1)` | `NULL` — zero capabilities |
| `role_rank('DEAN')` vs `role_rank('EDUCATOR')` | 4 vs 2 |

**The architecture currently has the two halves of the ruling backwards.**

* The thing RULING 2 warns against — undifferentiated browsing of identifiable
  learner records by role seniority — is what a Dean *can* do today. It arrives
  through `persons_select`, whose predicate is `person_visible_to_me(id)`, whose
  membership branch is `has_scope('EDUCATOR', m.node_id)`. That test is
  **rank-based**: `role_rank(DEAN)=4 ≥ role_rank(EDUCATOR)=2`, so a Dean passes a
  test named for a role whose capabilities they entirely lack (DEAN holds none).
  The access *is* organizationally contained by `jalur` — it is bounded — but it
  is a roster, not an act.

* The thing RULING 2 permits — an authorized Management role deliberately
  reaching one identifiable learner for an individual matter — is what a Dean
  *cannot* do today, at all. `learner.result` lists
  `STUDENT, EDUCATOR, HEAD_OF_DEPARTMENT, INSTITUTION_ADMIN` as its audience.
  DEAN is absent. There is no cumbersome approval workflow to remove; there is no
  path.

*No shipped screen reads `persons` as a Dean* — `src/app/dekan/ringkasan/page.tsx`
reads `report_templates` and calls `generate_report`, nothing else. The browsing
is reachable from an authenticated client, not from a page. By INV-19's own
logic — "read-only in the API, not just the UI" — the absence of a screen is not
a control, so this is stated as a live capability rather than a theoretical one.

## 2. Why this cannot be closed from existing primitives

Row-level security is a **row predicate**. `select * from persons` and
`select * from persons where id = $1` evaluate the identical predicate; the
database is handed no information that distinguishes them. So "deliberate" cannot
be expressed at the layer where the access currently happens. Making it
expressible means the access must change *shape* — a single-subject endpoint
taking one learner, returning one learner, writing one audit row — **and** the
roster path must close for that role. The endpoint is mechanism, and mechanism is
mine to build. Deciding that a Dean stops having a roster and starts having a
lookup is a decision about how a Dean works.

What already exists and would need nothing invented:

* `audit_write(action, target_table, target_id, institution_id, summary)` —
  append-only, `audit_log_immutable` enforced. Auditability is available.
* `jalur` containment (`node_in_my_scope`, `audience_over_learner`, both shipped
  by Objective A). Organizational containment is available and already correct.

What does not exist anywhere in the schema, checked rather than assumed:

* no table matching `access|consent|disclosure|lookup|inspection|episode`;
* no column matching `purpose|reason|justification|alasan|keperluan` that is about
  a person being looked at (the 33 `reason`/`note` columns that do exist are all
  about content, releases, sessions, transfers or enrolments);
* no `audit_log.action` in 38 recorded kinds that is the *reading of a person*.

## 3. The minimum missing decision

One decision unblocks everything. Stated as the smallest question that has to be
answered before a line is written:

> **For a Management role standing over a learner's organizational node, what is
> identifiable access to that learner?**
>
> **(a)** The contained roster it is today — accept it, and the ruling's second
> half is not met.
> **(b)** A named single-learner lookup that writes an audit row, *and no
> roster* — deliberate by shape, cumbersome by nothing.
> **(c)** Both: a narrowed roster for the work a Dean legitimately does at a
> glance, plus the audited named lookup for the individual matter.
>
> And, if (b) or (c): **which roles**. DEAN holds zero capabilities by design and
> `F01-T06` asserts that; granting this through `role_capabilities` changes an
> invariant the suite pins, so the answer also has to say whether Management
> individual access is a capability or something expressed outside the capability
> model.

Two smaller questions follow from it and need answering in the same breath, but
neither is independent:

* **B-2.** Does an audit row alone satisfy "purpose-appropriate", or must a
  purpose be *stated* by the reader? A stated purpose is a new product concept
  (a purpose vocabulary, and someone who reads it), which is why this is not
  being guessed.
* **B-3.** Does the answer differ between DEAN and HEAD_OF_DEPARTMENT? HoD holds
  seven capabilities and already receives `learner.result` inside its own
  department. If the answer is "the same", HoD's current access is the model and
  the Dean is simply missing from an audience list. If the answer is "different",
  the Dean's access needs its own shape.

## 4. What is ready the moment this is answered

* `audience_over_learner` already contains a person-shaped metric through the
  learner's memberships and the reader's assignment. Adding DEAN to an audience
  is then a catalogue change, not an authorization change.
* `node_in_my_scope` already answers containment with no rank and no capability
  in it — the predicate a narrowed roster would use.
* `audit_write` already records an act against a target with an institution and a
  JSON summary, which is the shape an individual-access record would take.

## 5. What was deliberately **not** done

* `person_visible_to_me` is unchanged. Every option above changes what a Dean can
  see, including doing nothing.
* `has_scope` is unchanged. Switching its rank test to a capability test would
  take DEAN's person visibility to zero — which is option (b) chosen silently.
* No purpose code, approval state, access-episode table or consent record was
  added, and none is implied by Objective A.
* `UX1-S3-NAMA-01` pins the literal text of `persons_select` and of
  `has_scope('EDUCATOR', m.node_id)` in `20260912004431_authorization.sql`. Any
  answer to §3 moves that test; it is listed here so the move is expected rather
  than discovered.
