# 16 — PINTAR Engineering & Verification System

*New in the 2026-09-12 baseline. Created because the engineering system,
migration discipline, persona harness, verification contract, independent
audit, audit cadence, stop-patch-loop rule and the production-deployment
stress scenario do not belong cleanly in any of docs 01–15. This document
is architecture: it says what the delivery system must guarantee, not how
a particular CI vendor is configured.*

Principle: **the user is not middleware.** Normal engineering must never
require Yazid (or any product owner) to copy SQL between systems, patch
source files by hand, act as the relay between an AI session and the
repository, or apply undocumented production changes.

## 1. Source control and deployment truth

- GitHub is the source-control truth for implementation. One repository,
  one trunk, real commits, from commit one (doc 01, Lessons 4 and 12). No
  `delivery-*`/`handoff-*` folder pattern, ever, even as a working
  convenience.
- Every production deployment is traceable to a commit SHA and a CI run;
  a deployment that cannot name its commit is not a deployment, it is an
  incident.
- AI sessions (Fable or any other) commit to branches and open pull
  requests like any contributor; review and CI gates apply equally.
- Secrets live in the deployment system's secret store; none in the
  repository, none in client bundles (INV-37), none in seed data (INV-21).

## 2. Migrations

Migrations must be canonical, ordered, source-controlled, reproducible,
tested against a clean database installation **and** against the
supported upgrade path (the previous released schema with representative
data). No patch-folder archaeology; no provisional "maybe applied"
migrations; no manual production SQL.

Database evolution for anything touching live sessions or evidence prefers:

```
expand → compatible deployment → backfill → switch → contract
```
rather than destructive immediate migrations. A migration that would break
the currently deployed application version against the new schema is not
mergeable while that version can still be running (rolling deploys and
rollback both require N and N−1 to coexist).

Immutable tables (frozen content, finalized sessions/results, certificates,
audit) have no admin override path for UPDATE/DELETE — a correction is a
new row or a new release, always (doc 08).

## 3. Persona harness and synthetic environment

A deterministic synthetic environment covers, at minimum: learner,
teacher/educator, reviewer (HoD), institution administrator, platform
administrator, public user (Mini-PINTAR/verification). It seeds at least
two synthetic institutions (for INV-13) with Academic Periods, Enrollments,
Memberships, published releases, Learning Assignments and Assessment
Assignments in every mode.

- Synthetic organisations are flagged at the tenant level; every evidence
  row under them is `SYNTHETIC` by inheritance (INV-20). Synthetic data is
  unmistakably non-production (naming, flag, and separate seed guard —
  INV-21).
- Each test seeds and tears down its own synthetic tenant/data; no shared
  mutable fixture (doc 12).
- The harness is versioned with the code; a schema change that breaks the
  harness is a failing build, not a "fix the tests later" note.

## 4. Verification contract (`npm run selftest` or equivalent)

`npm run selftest` is a **defined, versioned test contract**, not "whatever
tests happen to exist." Its manifest lists, by id, every test and the
requirement/invariant/lifecycle/matrix cell it proves. A phase is done when
the whole accumulated contract exits 0 — no partial credit, no silently
skipped tests (doc 12).

The contract must eventually verify, across personas: expected answers,
scoring, permissions (every doc 05 cell, positive and negative), tenant
isolation, learning progression (full Dr. Gladys cycle with INV-24),
certificates (issue, verify, tamper, rotate key, identity snapshot),
content lifecycle (every transition and every forbidden transition),
Publish Readiness, negative authorization cases, resilience/replay (INV-28
scenario), start-eligibility vs continue-permission (INV-27), release-
correction policy, transfer, period rollover, evidence eligibility, and
key end-to-end flows.

**Adversarial regression fixtures** are part of the contract from the
start. At minimum:
- a bank whose correct options are systematically 2–3× longer;
- a bank with ~70% of correct answers in one position;
- items with obviously implausible distractors;
- items whose correct option copies stem wording conspicuously;
- synthetic and public-demo sessions attempting to reach analytics,
  Question Health, psychometrics and certificate eligibility;
- a learner-assistance context built from the authoring representation;
- a tampered certificate payload for each protected field;
- a hint containing the answer text (INV-02).
Publish Readiness must report BLOCKED/ACTION_REQUIRED with the correct
finding for the first four; the rest must be refused by the relevant
invariant.

Testing infrastructure itself is testable where practical: the harness has
its own smoke tests (does the seed produce the expected counts; do the
eligibility views exclude synthetic rows; does the manifest cover every
invariant id in doc 03).

## 5. Independent audit

The implementation agent/builder is not the sole authority on
correctness. Three layers, all required:

1. **Builder verification** — the implementer's own tests and checklist.
2. **Automated verification** — the selftest contract in CI, plus
   schema-lint, route-inventory, bundle-scan and import-graph checks.
3. **Independent/adversarial audit** — a reviewer (human or a separate AI
   session with no shared context with the builder) that tries to break
   the claims rather than confirm them.

Audit traceability connects **Requirement → Architecture → Implementation
→ Test → Audit Evidence** (recorded per ADR, doc 13 "Traces to"). An
auditor must be able to start from any invariant id and reach the test and
the evidence that it holds in the deployed build.

Every audit searches explicitly for the known dangerous patterns:
permissive RLS (`USING (true)`), client-side service role, answer-key
leakage, public storage, hardcoded credentials, dummy production fallbacks,
anonymous privileged uploads, unsafe `SECURITY DEFINER` (unpinned
`search_path`), duplicate engines, legacy routes, TODO/bypass security
comments, unversioned scoring, provider concepts in the domain model,
privileged data in learner-assistance contexts, raw-evidence reads in
analytics paths, and internal version strings on user surfaces.

## 6. Audit cadence

```
Architecture Baseline → FABLE-01 → Mini Audit → Fix → Gate → FABLE-02 → Mini Audit → Fix → Gate → …
```
Plus a boundary audit at every critical boundary (first RLS/storage
foundation; first certificate issuance; first evidence-eligibility view;
first AI Gateway call; first transfer) and a final release audit.

Frequent bounded audits and small corrective changes are preferable to
delayed comprehensive discovery. **A major architectural defect found only
in the final audit means an earlier gate failed** — the gate is then
reviewed as well as the defect.

## 7. Stop-patch-loop rule

If implementation hits the same gate repeatedly — approximately 2–3 cycles
of effectively the same failure — do not continue stacking patches. Stop.
Identify the root cause, the invalid assumption, a clean reproduction, the
architecture/design correction, and the proper regression test. Record
them in an ADR (doc 13). Then proceed. A gate-failure counter makes this
visible; a third failure blocks further patch commits at that gate until
the ADR exists.

## 8. Production deployment acceptance scenario (formal stress scenario)

> Friday, 10:05. Approximately 600 learners across several institutions
> are actively taking assessments. A serious security defect is
> discovered. A corrected application/database release must be deployed
> without corrupting active sessions, losing legitimate answers,
> invalidating historical evidence, breaking certificate/content bindings,
> or requiring manual ad-hoc SQL.

How the parts work together:

| Part | Role in the scenario |
|---|---|
| **Git** | The fix is a commit on trunk via a reviewed PR; the deployed SHA before and after is known. Rollback is a redeploy of the previous SHA. |
| **CI** | Runs the selftest contract, schema-lint, the migration against a clean DB and against the current production schema snapshot (upgrade path), and the adversarial fixtures. A security fix skips no gate; it may be prioritized, not exempted. |
| **Database migration compatibility** | Any schema change follows expand → compatible deployment → backfill → switch → contract. The running N−1 application must remain correct against the expanded schema, so in-flight sessions keep writing responses throughout. Immutable tables are untouched by definition. |
| **Deployment** | Rolling/blue-green: new instances come up beside old ones; sessions are server-authoritative (doc 07) and stateless per request, so a learner's next request lands on either version safely. No in-process state exists to lose (Lesson 9). |
| **Feature flags** | If the fix changes behaviour that could affect scoring semantics, the new behaviour ships behind a flag and a new `scoring_policy_version`; active sessions finalize under the version they started with (INV-29). Flags are institution-scoped where the fix should be piloted. |
| **Active sessions** | Continue permission (INV-27) is unaffected by deployment. Clients with a durable outbox replay any responses that failed during the cut-over exactly once (INV-28). Authoritative deadlines live in the database, not in process memory. If the defect requires terminating sessions (security intervention, INV-17), terminations are explicit, audited, and finalize with recorded work — never silent. |
| **Rollback/recovery** | Because migrations are expand-first, rolling the application back to N−1 needs no schema rollback; the contract step runs only after N is verified stable. Certificates and evidence are never re-signed or rewritten; historical bindings are unaffected because nothing immutable changed. |
| **Monitoring** | Error rate, response-acceptance rate, replay counts, finalize counts and verification-route health are watched during and after the deploy; a regression in any of them triggers rollback, not a hot patch. |
| **Audit** | The incident, the deploy, any flag flips and any session terminations are audit records (INV-18) with the commit SHA; the boundary audit (§6) reviews the fix within the next bounded cycle. |

Nothing in the scenario requires manual SQL, a database console, or the
product owner relaying files. If it does, the engineering system — not the
person — has failed the scenario.

## 9. Design language delivery (engineering side)

The design language (doc 15) is enforced by a small, versioned token set
(colour, type, spacing, status semantics) in the repository; a screen that
introduces a new font, a decorative gradient, an alarm pattern or an
internal version string fails review. The manual calm-surface review is
the one deliberate manual gate in the contract.
