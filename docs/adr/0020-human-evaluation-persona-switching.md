# ADR-0020 — Human Evaluation Persona Switching

**Date:** 2026-09-13 · **Phase:** FABLE-05 → FABLE-06 window · **Status:**
Accepted · **Amended 2026-09-13** — Super Admin persona removed on a falsified
premise; five bounded personas. See *Super Admin boundary*. · **Amended
2026-09-13 (implementation)** — the dual-identity mechanism is a table lookup,
not a session-scoped setting. See *Amendment 2*. · **Amends:** ADR-0008 (D1).

Drafted by Claude 1; §5 answered by Yazid the same day; amended by Claude 1 and
by implementation. Recorded here with its errors visible rather than edited
away — an ADR that corrects itself silently teaches nothing.

## Problem

Dr. Gladys must experience PINTAR across its real role boundaries — for
evaluation and for patent work — from one login, without holding a collection of
credentials, and **without the evaluation facility bypassing the boundary it
exists to demonstrate.**

## Threat model

The facility is a privileged security feature and must be treated as one. What
an attacker (or a mistake) could obtain:

1. **Authorization bypass** — an evaluator override reaching production code, so
   that "evaluation mode" becomes a permanent hole in the authorization root.
2. **Targeting a real person** — assuming the identity of an actual learner or
   administrator rather than a bounded demonstration identity.
3. **Privilege acquisition** — an institution administrator acquiring evaluator
   status, or an evaluator reaching infrastructure authority through the
   "Super Admin" persona.
4. **Credential leakage** — persona passwords reaching the browser, the
   evaluator, the repository or a seed file.
5. **Audit laundering** — an evaluator's action recorded as a genuine learner's,
   destroying the evidential value of the audit trail.
6. **Escape** — signing in as a persona outside the Hub, or persisting an
   effective persona past logout or expiry.
7. **Production reach** — the facility, or its demonstration data, existing in
   production at all.

Each of these has a control below.

## Why this does not touch `current_person_id()`

Verified live at 0060:

```sql
select a.person_id from public.accounts a where a.auth_user_id = auth.uid() limit 1
```

Identity resolves **through the `accounts` table**, not from a JWT claim. An
`accounts` row is `(person_id, auth_user_id, kind)`. Therefore a persona is
simply *a person with an account*, and assuming a persona is **establishing a
genuine authenticated session for that account**. The persona's authorization
then applies because it *is* the persona's session — every RLS predicate, every
`can_in_institution`, every ownership check, unchanged and unaware.

**No override is introduced anywhere in the authorization root.** This is the
single most important property of the design, and it is structural rather than a
rule someone must remember.

## Evaluator authorization

**Not a capability, and not a role.** Both would flow through `role_assignments`
and could then be granted by an institution administrator within their scope —
exactly the acquisition path the threat model forbids.

**An explicit registry**, in the shape this project already uses for
`client_rpc_registry` and `public_surface_registry`:

- `evaluation_personas` — the **bounded allow-list**: which `person_id` may be
  assumed, under which label, in which demonstration tenant. A persona that is
  not a row cannot be assumed. This is the control against targeting a real
  person, and it is an allow-list rather than a filter.
- `evaluation_evaluators` — who may enter Evaluation Mode. Granted by
  `is_system_admin()` only, audited on grant and revoke, revocable, and
  **unreachable from any institution-scoped capability**.
- Both refused in production by the same trigger pattern as
  `enforce_official_bootstrap`.

## Session-switch mechanism

The Hub performs a **server-side** persona sign-in. The persona's credential is
generated at seed time, never displayed, never returned to the browser, never
committed — the same discipline as the classroom-card secret derivation, and
`CARD_PEPPER`'s standing lesson applies. The evaluator receives a session, not a
password.

**Lifecycle — the simpler, more auditable one:**

- Persona-to-persona switching is **not** permitted. Exit to the Hub, then
  assume. One transition shape, one audit shape, no partial state.
- An evaluation session is **time-boxed** and carries its own expiry independent
  of the persona session.
- Exiting a persona **terminates that persona's session server-side** — not just
  a cookie clear.
- Evaluator logout terminates **both**.
- **Simultaneous personas are refused** — one effective persona at a time per
  evaluator.
- Re-authentication is required to *enter* Evaluation Mode, not to switch within
  it.

## Dual-identity audit — the smallest robust representation

Measured: `audit_log(actor_auth_uid, actor_person_id, action, target_table,
target_id, institution_id, summary, build_sha)`, written by
`audit_write(p_action, p_target_table, p_target_id, p_institution_id,
p_summary jsonb)` — five arguments, actor derived **inside** the function, and
`assert_audit_write_arity` pins every call site at five.

**Decision: two additive columns, not the summary jsonb.**
`audit_log.evaluation_actor_person_id` and `audit_log.evaluation_session_id`,
both nullable, both NULL for every ordinary action.

Rejected: putting it in `summary` — that is overloading a free-form field with
identity semantics, and it would make "who really did this?" a JSON search
rather than a column read. Rejected also: changing `audit_write`'s arity — the
call sites and their guard exist precisely so that signature is stable.

The Layer-3 auditor then answers both questions with one query:
`actor_person_id` is whose authorization was exercised;
`evaluation_actor_person_id` is who actually did it. **NULL means genuine.**

Assumption and exit are themselves audited events, and a separate
`evaluation_sessions` row records the pairing, its start, its end and its expiry.

> **Superseded in part — see Amendment 2.** This section as drafted said the
> actor is "read from a session-scoped setting established at persona
> assumption, exactly as `audit_write` already reads the build SHA from the
> request." That mechanism was rejected during implementation and the column
> decision above is unaffected.

## §5 — Demonstration data: a separate Human Evaluation institution under a bounded purpose

**Decided (B2 with refinement).**

### The constraint that shaped it

`derive_evidence_class` is **cap-only**, verified live:

```
tenant  : is_synthetic → SYNTHETIC, else OFFICIAL
channel : PUBLIC_DEMO  → PUBLIC_DEMO, else OFFICIAL
context : 'preview'    → PREVIEW,     else OFFICIAL
result  : min(all three)
```

A synthetic tenant can never produce OFFICIAL evidence, and only OFFICIAL
evidence reaches `ELIGIBLE`. A synthetic demonstration tenant would therefore
give the evaluator no certificate journey — the surface most relevant to the
patent work.

### The decision

A **separate, rich Human Evaluation institution**, distinct from the existing
minimal D1 engineering bootstrap tenant:

- `tenant_kind = 'INSTITUTION'` — **`tenant_kind` does not acquire a
  `DEMONSTRATION` value.** Content ownership and evidence/evaluation purpose are
  separate dimensions and stay separate.
- **non-synthetic**, so the genuine OFFICIAL evidence → eligibility →
  certificate journey is reachable;
- explicitly authorized for **non-production OFFICIAL evidence** through the
  existing bootstrap authorization model;
- **structurally refused in production**, by the same trigger that already
  refuses the D1 tenant.

The evaluator experiences a real certificate **because the institution satisfies
the existing non-synthetic / non-production authorization model — not because
Evaluation Mode overrides evidence classification.** Evaluation Mode changes
*who you are*, never *what evidence means*.

### The refinement: a bounded purpose, not a boolean escape hatch

`is_official_bootstrap` must not become a generic switch capable of making an
arbitrary non-production institution OFFICIAL. Every institution permitted
through the mechanism **declares an explicit, bounded purpose**:

- a new enum `official_evidence_purpose` with exactly two values today —
  `D1_ENGINEERING_BOOTSTRAP` and `HUMAN_EVALUATION`;
- a nullable `institutions.official_evidence_purpose` column, NULL for every
  ordinary institution;
- a CHECK tying the two: the purpose is present **iff** `is_official_bootstrap`
  is true;
- **an unknown or unapproved purpose is impossible by type** — a new purpose
  requires a migration and an ADR, not a row;
- **at most one institution per purpose**;
- all of them refused in production, and **separately countable by purpose** in
  the lint output.

`is_official_bootstrap` stays as the boolean the two existing predicates already
read, so **no predicate is rewritten** — only D1's count rule is amended.

### The D1 amendment, made deliberately

D1's *"one bootstrap tenant"* rule becomes: **"every institution authorized for
non-production OFFICIAL evidence declares a bounded purpose; at most one per
purpose; all are refused in production."** This is a recorded amendment to D1,
not a silent relaxation, and the D1 ADR is updated to point at it.

> **D1 is ADR-0008**, not ADR-0009. Both this ADR's draft and the Task 2 prompt
> cite "ADR-0009's D1 decision"; ADR-0009 is D2, certificates are
> `INSTITUTION_SCOPED`. Recorded rather than quietly fixed, because a
> misreference repeated in two governing documents will otherwise be repeated in
> a third.

**One implementation note that is part of the amendment, not incidental to it.**
D1's count rule was not only prose: 0043 enforced it as
`unique ((true)) where is_official_bootstrap`. **That index *was* the rule.**
0065 drops it in the same migration that creates the per-purpose index, because
leaving it would have made the new rule unreachable while appearing to work — a
second control silently doing nothing. 0065's verification block asserts the old
index is gone.

### What must not change

**`derive_evidence_class` remains cap-only and must not read the purpose.** It
continues to read `is_synthetic` and nothing else on the tenant axis. No fourth
derivation input is added, the `min(derived, override)` monotonicity is
untouched, and no override raises a class. `assert_official_evidence_bootstrap`
keeps stating that `derive_evidence_class` reads neither the flag, nor
`tenant_kind`, nor the purpose — and now probes for all three.

## Persona model

**Fixed, pre-created personas.** Evaluated against dynamic provisioning: dynamic
identities would need an allow-list anyway to prevent targeting real people,
would make the audit trail non-reproducible, and would give Dr. Gladys a
different world each session. Fixed personas are deterministic, seedable,
resettable and inspectable.

**One coherent scenario, several perspectives.** The personas share **one
demonstration institution and one learning journey** — the learner persona's
enrolment, class, assignment, canonical material, assessment, progress and
evidence are the *same rows* the educator persona reviews and the leadership
persona sees in aggregate.

**The persona set comes from the frozen role model, not the product wording:**
`STUDENT`, `EDUCATOR`, `HEAD_OF_DEPARTMENT` (the reviewer/publisher perspective —
it holds `CAN_REVIEW` and `CAN_FREEZE_RELEASE`), `DEAN` (school leadership —
read-only by INV-19, which is itself worth demonstrating), and
`INSTITUTION_ADMIN` — **five personas.** The Super Admin perspective was removed;
see the amendment below. "School Management / Leadership" and
"Reviewer / Publisher" are product language for DEAN and HEAD_OF_DEPARTMENT;
**no new role is invented.**

## Super Admin boundary — AMENDED 2026-09-13. The original reasoning was false.

**What this section said, and why it was wrong.** It claimed the persona would be
"a `SYSTEM_ADMIN`-roled demonstration person whose reach is bounded to
demonstration data by the same tenant mechanisms as every other persona," and
concluded that least privilege was preserved because the persona was "an ordinary
account in a bounded tenant — not an elevated one."

**In this schema that is false, and it is false at the root rather than at the
edges.** Found while implementing; confirmed independently on the live catalog by
its author:

- `is_system_admin()` tests only for an unrevoked, in-window `role_assignments`
  row with `role = 'SYSTEM_ADMIN'`. It never reads `scope_node_id`.
- `has_scope()` returns `true` for a SYSTEM_ADMIN before it loads the node's
  `jalur`. Scope is not merely unenforced for this role; **it is not consulted.**
- Nine other functions short-circuit on `is_system_admin()`, including
  `is_member_of_institution()`, which returns `true` for **every** institution.
- Eight RLS policies across six tables grant on it directly.

So there is **no "bounded tenant"** for a SYSTEM_ADMIN to be ordinary in. The role
is *defined* as the absence of tenant bounds. A SYSTEM_ADMIN-roled persona would
not be a demonstration identity that happens to be privileged — it would be
**threat-model row 3 realised**: an evaluator reaching genuine platform authority
through the persona switcher.

**The error was checkable.** A bounding property of a role was asserted instead of
reading the function that defines it, and `is_member_of_institution`'s
short-circuit is a line already read in this project while verifying something
else, without connecting it to this ADR. Asserting a security property from the
product's intent rather than from its predicate is the same failure class as
Task 1's **F1**. Recorded as **L5** in `docs/ENGINEERING-LESSONS.md`.

**The two ways to bound it are both forbidden by this ADR.** Changing
`is_system_admin()` would alter the authorization root for the whole platform to
serve a demonstration; special-casing evaluation inside authorization paths is
what the no-override rule exists to prevent. There is no third way, which is why
this was a STOP and not an implementation choice.

**Decision (Yazid, 2026-09-13): five bounded personas.** The Super Admin persona
is removed, and the escalation is made **structurally impossible rather than
merely unused**. The persona table refuses a `SYSTEM_ADMIN` perspective, refuses
any person holding an unscoped grant, and refuses any person carrying an
enrolment or grant outside the evaluation institution — the last of which also
prevents an allow-list row from pointing at a real learner, **closing threat rows
2 and 3 with one check.**

**What is lost, stated plainly:** Dr Gladys will not experience the
platform-administration surface. That is the correct trade. A facility built to
demonstrate that PINTAR's boundaries hold cannot be the one place they do not,
and a demonstration of platform administration is worth less than the guarantee
it would cost.

## Amendment 2 — the dual-identity mechanism is a table lookup, not a setting

**What the draft said.** That the evaluation actor is "read from a session-scoped
setting established at persona assumption, exactly as `audit_write` already reads
the build SHA from the request."

**Why that is wrong.** The build SHA arrives as the `x-pintar-build` header,
which is **client-supplied and forgeable**; ADR-0001 accepted that because a
build SHA is *"provenance, never authority"*. The evaluation actor is the
opposite kind of fact: it must be impossible **to hide**. A forgeable input would
let an evaluator's action be recorded as a genuine learner's simply by omitting
a header — precisely the laundering of threat row 5. The analogy was to the one
field in `audit_write` that was deliberately allowed to be untrustworthy.

**What is implemented instead**, per Task 2 §6, which caught this: `audit_write`
derives the actor **server-side from `evaluation_sessions`**, keyed on
`auth.uid()`. Unforgeable, unhidable, and the arity is unchanged.

**And one consequence that is not obvious.** The lookup keys on `ended_at is
null` and deliberately **not** on `expires_at > now()`. Gating the stamp on
expiry would mean a session that had expired but not yet been ended writes
**unstamped** rows — a laundering window that opens by itself, on a timer, with
no attacker required. Expiry governs whether new actions are *permitted*; it must
never govern whether identity is *recorded*. 0067's verification block exercises
exactly that case.

## Evaluation-mode UX

A persistent, unmissable indicator — `EVALUATION MODE — Viewing as: [persona]`
with *Change persona* and *Exit evaluation* — rendered from the evaluation
session, not from client state, so it cannot be dismissed or lost on refresh.
Copy through the HLE like everything else. The architectural requirement is that
**the indicator's presence is a property of the session**, not of the page.

## Production safety

The facility does not exist in production: evaluator rows, persona rows and the
demonstration tenant are all refused there by trigger, and lint counters report
them so their absence is **measured rather than assumed**. A production
deployment with a non-zero count fails the gate.

## Relationship to the pilot

**Evaluators are Dr. Gladys and any designated reviewer. The ~150 cohort get real
role-specific accounts and never touch this facility.** The lint reports
evaluator count explicitly so the two populations cannot blur.

## Invariants affected

INV-08 (identity still server-derived — the persona's session *is* the identity),
INV-13, INV-16 (evaluator status is not a role and cannot be self-granted),
INV-17 (persona session revocation on the next check), INV-18 (audit extended
additively), INV-19 (demonstrated, not bypassed), INV-21 (production refusal),
INV-20/INV-33. **None is amended.**

## Layer-3 concerns

Three, and they are the whole audit. **One:** is there *any* path where
evaluation status changes an authorization outcome rather than the identity — the
answer must be no, and it should be attacked rather than read. **Two:** can the
allow-list be escaped, by id substitution, by a persona row pointing at a real
person, or by seeding. **Three:** is the dual-identity record complete — find an
action reachable in evaluation mode whose audit row does not carry both
identities.

**Layer-3 is not claimed by this build.**
