# ADR-0004 — The `content_sha256` contract

Status: accepted (FABLE-02, migration 3)
Supersedes: nothing. Superseded by: nothing.

FABLE-02 §2 says freezing "computes `content_sha256` over what is taught
only". That sentence is not implementable as written: it does not say what
"what is taught" includes, how a set of rows becomes one deterministic byte
string, or what happens the day the answer changes. This ADR fixes all four
before the migration ships, because a hash whose scope is decided by reading
the implementation is a hash nobody can reproduce.

The contract is versioned. Its identifier is the literal string

    PINTAR-CONTENT-SHA256/1

and it is the first field of every payload, so a stored hash always declares
which contract produced it.

## 1. What contributes

Everything below is *taught content*: change it and a learner is taught or
assessed differently.

| Level | Fields in the payload |
|---|---|
| Course | `subject`, `stage`, `grade_label`, `title` |
| Module | `ordinal`, `title` |
| Lesson | `ordinal`, `title`, `summary`, `body_markdown`, `worked_examples`, `media` |
| LearningObjective | `code`, `statement`, `bloom`, `is_core` |
| Item | `item_type`, `bank_type`, `stem`, `stimulus`, `petunjuk`, `arah_berpikir`, `predicted_difficulty`, `is_safety_critical`, the objective **codes** it targets, its parallel-group index |
| ItemOption | `label`, `body`, `is_correct`, `rationale`, `misconception_code` |
| AssessmentDefinition | `title`, `mode`, `bank_type`, `version`, `item_count`, `difficulty_mix`, `safety_critical_minimum`, `passing_rules`, `hesitation_window_seconds`, `shuffle_policy`, `allows_pause`, `offline_tolerant`, `late_sync_grace_seconds`, `attempt_limit`, and the `ordinal` of the module it is bound to (NULL when it is bound to the course) |

Three of these are inside because of the ambiguity rule (§2 of the phase
prompt: *if a column's in/out-of-hash status is ambiguous, it goes inside*):

- **`predicted_difficulty`** is authored, not measured. It steers selection,
  so two releases that differ only in it can present different papers.
- **`is_safety_critical`** changes what a wrong answer means.
- **`media` and `worked_examples`** are JSONB blobs rather than columns, but
  they are lesson body content in every sense that matters.

AssessmentDefinitions are in scope for a course when they are bound to the
course directly or to one of its modules. INV-29 already says a rule change
is a new Definition version; the hash makes that observable from outside.

## 2. What explicitly does not contribute

- **Every UUID.** Primary keys, `institution_id`, `lesson_id`, `module_id`,
  `source_version_id`, `objective_ids`, `parallel_group`. A hash containing a
  UUID is a hash of one database, not of the content: restore the same
  course into a second database and it would differ. Objectives therefore
  enter by `code`, misconception links by `misconception_code`, and parallel
  grouping by the derived index described in §3.
- `created_at`, and every other timestamp.
- `status`, on any row. The hash is computed *at* the FROZEN transition; if
  status were inside, the transition would invalidate its own result.
- Authorship and review metadata: `author_person_id`,
  `reviewed_by_person_id`, `reviewed_at`. Who wrote and approved it is
  provenance, and provenance is audited (INV-33), not hashed.
- Release metadata: `version_label`, `supersedes_release_id`, `frozen_at`,
  `published_at`, and `content_sha256` itself.
- Provenance of sources: `source_version_id` and `page_citation`. The phase
  prompt names provenance metadata as excluded, and a citation correction is
  not a change to what is taught.
- **Every `empirical_*` column.** These are measured after publication from
  real evidence. If they were inside the hash, a frozen release's hash would
  change on its own as evidence accumulated, which is the exact failure the
  hash exists to detect.

The exclusion of `empirical_*` is load-bearing twice over: it also keeps the
freeze honest, because nothing outside the authoring act can move the hash.

## 3. What makes it deterministic

**Ordered where order is data; a set everywhere else.** The rule the product
owner set: *if order is pedagogically meaningful it must change the hash; if
it is merely database or storage order it must not.* Positional order exists
as data in exactly three places, and those are the only ordered collections:

- modules within a course — ordered by `ordinal`;
- lessons within a module — ordered by `ordinal`;
- options within an item — ordered by `label`;
- and, inside the JSONB blobs, array order, which is preserved verbatim.

Reordering any of those changes the hash, which is correct: module 3 taught
second is a different course. Everything else is a genuine set — items in a
lesson, objectives in a lesson, assessment definitions in a course — and is
made order-independent by hashing each element to a digest and sorting the
**digests**, not the rows. Row order out of the storage engine therefore
never reaches the payload.

**No sort ever depends on a collation.** Digests are lowercase hex and every
ordering that is not by `ordinal` or `label` is written `collate "C"`, so a
database with a different `lc_collate` produces the same bytes.

**Parallel groups enter as a derived index.** `parallel_group` is a UUID, so
it cannot be hashed directly, but regrouping parallel items changes what a
learner can be shown and must not be invisible. Each item is first digested
without its group; groups are then ordered by the sorted concatenation of
their members' digests and given a `dense_rank`; that rank is folded into the
item's final digest. The result depends only on content, and moving an item
between parallel groups changes the release hash.

**One serialisation primitive, injective by construction.**
`public.content_field(text)` renders a value as `length:value` and NULL as
`~`. Concatenating length-prefixed fields cannot be ambiguous, so no pair of
distinct field lists can collide the way a delimiter-joined string can (the
classic `"ab"|"c"` vs `"a"|"bc"` collision). Field order within a row is
fixed by the table above and by the function body; it is not derived from
`information_schema`, so adding a column does not silently reshape old
payloads.

**JSONB is hashed through its canonical rendering.** `media`,
`worked_examples`, `difficulty_mix` and `passing_rules` are serialised as
`jsonb::text`, which normalises key order and whitespace. Two blobs that
differ only in input key order or spacing hash the same; that is the intended
semantics for authored blobs, and array order is still significant.

**The hash function is `SECURITY DEFINER`.** Every table it reads is under
RLS. A caller who can see only part of a course must not be able to compute a
different, smaller hash and store it as the release's hash, so the function
reads the content as its owner and is revoked from `public` and `anon`.

**It is computed once, by the database, at the FROZEN transition.** No client
supplies it; `content_sha256` must be NULL on insert, is written by the
freeze trigger, and can never be changed afterwards.

## 4. If the contract ever has to change

> Existing hashes retain their original meaning permanently. Any change to
> hash semantics requires an explicitly versioned contract and ADR;
> historical hashes are never recomputed under new semantics.

Concretely: a change to what contributes, to the ordering rules, or to the
serialisation is a **new contract identifier** (`PINTAR-CONTENT-SHA256/2`)
introduced by a new migration and a new ADR that supersedes this one. Rows
frozen under `/1` keep their `/1` hash forever and are still verified against
the `/1` function, which is never deleted or edited. A release is never
re-frozen to "refresh" its hash; the way to get a hash under a new contract
is a new release, which is what a new release already means.

## Consequences

- A frozen release can be re-verified at any time by recomputing the payload
  and comparing, without trusting any stored value.
- The taught-content immutability trigger and the hash read the same column
  list, so "the hash did not change" and "the content did not change" mean
  the same thing.
- Objectives and misconceptions must have stable codes, which they already do
  (`unique (lesson_id, code)`, `misconception_taxonomy.code` as primary key,
  append-only).
