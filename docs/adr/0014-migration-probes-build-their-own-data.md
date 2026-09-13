# ADR-0014 — A migration's verification block builds its own probe data

**Date:** 2026-09-14
**Phase:** FABLE-04 (closure)
**Status:** Accepted
**Amends:** ADR-0003 (migration verification blocks). Nothing in ADR-0003 is withdrawn; this adds the rule it was missing.
**Raised by:** Claude 1's FABLE-04 review, finding 4, promoting the diagnosis behind the 0046 fault to a rule.

---

## 1. The rule

> **A migration's verification block must construct the data it probes, inside a
> subtransaction it rolls back. It must never assume a seeded row exists, and it
> must never make its probe conditional on finding one.**

## 2. Why

**Migrations run before seeds.** On a from-empty replay — which is the
clean-database CI job, the local replay, and the shape most people reach for
when they ask "does this migration work?" — there is no institution, no course,
no release and no learner at the moment a verification block executes.

A block written as

```sql
select c.id into v_course from public.courses c join public.plp_releases r … limit 1;
if v_course is not null then
  … the probe …
end if;
```

therefore **passes over nothing** on every from-empty run, and reports green
while proving that the migration does not crash. It only ever runs on a database
that already holds the right data — which is every real environment, and no test
environment.

That is exactly how 0046's fault survived. Its probe created an ad-hoc
assessment definition under a sealed course and then deleted it; the exemption
covered INSERT and UPDATE and not DELETE. The clean-database job, the local
replay and the entire 93-id selftest all skipped the block. **CI's upgrade-path
job — 0038 onwards applied on top of a database that already held seeded, sealed
content — ran the probe for the first time and failed on it immediately**, and
the migration as written could not have been applied to any real database at all.

A conditional probe is documentation. It is not a test.

## 3. What to do instead

- **Build the fixture.** A verification block may create an institution, a
  course, a release and whatever else it needs, run the probe, and `raise` a
  sentinel it catches to roll the whole thing back. 0032's repair did this and
  is the model.
- **When the block genuinely cannot build its fixture** — because doing so would
  have to defeat a guard the migration itself installs, such as INV-21's seed
  intent — then the block asserts what it *can* see structurally, **and the
  behavioural proof moves to a named selftest id, stated in the migration's own
  comment.** 0049 and 0051 both do this and both name the id.
- **Never leave a conditional probe unaccompanied.** If a migration contains
  `if … is not null then <probe> end if`, there must be a manifest id beside it
  that runs the same probe unconditionally against fixtures.

## 4. For a reviewer

Treat any `if … then <probe> end if` inside a migration as prose until you find
the selftest id that runs it. This build currently has two such blocks, 0046 and
0049, and both are covered — by **F04-T17** and **F04-T04** respectively.
