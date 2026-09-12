# 05 — PINTAR Authorization Matrix

UI visibility is never authorization. Every cell below must be enforced at
the **database/RLS** layer independent of the application server, and
independently again at the **application/API** layer — the two must never
be allowed to drift (one shared authorization primitive, called from both,
per the ground-zero rule in FABLE-01 §4). The **UI** layer only reflects
what the lower two layers already allow.

Roles: STUDENT(1) · EDUCATOR(2) · HEAD_OF_DEPARTMENT(3) · DEAN(4) ·
INSTITUTION_ADMIN(5) · SYSTEM_ADMIN(6) · SERVICE (server-only, service_role).

## Content (Source/Course/Module/Lesson/Item/Option)

| Action | STUDENT | EDUCATOR | HoD | DEAN | INST_ADMIN | SYS_ADMIN | SERVICE |
|---|---|---|---|---|---|---|---|
| Read (published, own tenant, no answer key) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Read answer key / rationale-to-correct mapping | ❌ | ❌ (own drafts only, pre-freeze) | ✅ (in review) | ❌ | ✅ | ✅ | ✅ |
| Create draft | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| Edit pre-freeze | ❌ | ✅ (own drafts) | ✅ | ❌ | ✅ | ✅ | ✅ |
| Review (approve) | ❌ | ❌ | ✅ (not own draft) | ❌ | ✅ (not own draft) | ✅ (not own draft) | — |
| Freeze release | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ | — |
| Publish/withdraw | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | — |
| Edit post-freeze | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ (immutable — INV-04, no exceptions) |

## Assessment sessions & responses

| Action | STUDENT | EDUCATOR | HoD | DEAN | INST_ADMIN | SYS_ADMIN | SERVICE |
|---|---|---|---|---|---|---|---|
| Create own session | ✅ | — | — | — | — | — | — |
| Read own session/responses | ✅ (own only) | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Read any learner's raw responses | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ only |
| Read cohort-aggregate (no learner id) | ❌ | ✅ (own classes) | ✅ (own dept) | ✅ (own institution) | ✅ | ✅ | ✅ |
| Submit/finalize | ✅ (own session, server-computed) | — | — | — | — | — | ✅ |
| Configure assessment preset/blueprint | ❌ | ✅ (flash quiz only) | ✅ | ❌ | ✅ | ✅ | — |
| Manage EXAM-tier bank / cooling | ❌ | ❌ | ✅ (review readiness only) | ❌ | ✅ | ✅ | ✅ |

## Certificates

| Action | STUDENT | EDUCATOR | HoD | DEAN | INST_ADMIN | SYS_ADMIN | SERVICE |
|---|---|---|---|---|---|---|---|
| Issue (system-triggered) | — | — | — | — | — | — | ✅ |
| Read own certificate | ✅ (own only, incl. classroom-card identity) | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Public verification read (pass/predikat/institution/date only) | ✅ anon | ✅ anon | ✅ anon | ✅ anon | ✅ anon | ✅ anon | ✅ |
| Revoke | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | — |
| Manage template/numbering prefix | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | — |

## Roles, scopes, and organisation

| Action | STUDENT | EDUCATOR | HoD | DEAN | INST_ADMIN | SYS_ADMIN | SERVICE |
|---|---|---|---|---|---|---|---|
| Grant a role ≤ own rank, within own scope | ❌ | ❌ | ❌ (per §4, HoD does not grant) | ❌ | ✅ (below INST_ADMIN) | ✅ (any) | — |
| Self-grant above STUDENT | ❌ (blocked, INV-16) | ❌ | ❌ | ❌ | ❌ | ❌ | — |
| Edit organisation hierarchy (institution/faculty/dept/programme) | ❌ | ❌ | ❌ | ❌ | ✅ (own institution) | ✅ | — |
| System-wide config switches (maintenance, registration lock) | ❌ | ❌ | ❌ | ❌ | ❌ (own-institution scoped switches only) | ✅ | — |

## Intelligence / Briefings

| Action | STUDENT | EDUCATOR | HoD | DEAN | INST_ADMIN | SYS_ADMIN | SERVICE |
|---|---|---|---|---|---|---|---|
| Read own Peta Bacaan Personal | ✅ (own only) | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Read Class Learning Intelligence briefing | ❌ | ✅ (own classes) | ✅ (own dept) | ❌ | ✅ | ✅ | ✅ |
| Read Institutional Learning Intelligence report | ❌ | ❌ | ❌ | ✅ (own institution) | ✅ | ✅ | ✅ |
| Any Studio capability (author/review/freeze/publish) | ❌ | (per content matrix) | (per content matrix) | **❌ — always, by design (INV-19)** | (per content matrix) | (per content matrix) | — |

## Audit trail

| Action | STUDENT | EDUCATOR | HoD | DEAN | INST_ADMIN | SYS_ADMIN | SERVICE |
|---|---|---|---|---|---|---|---|
| Write audit record | ❌ (system writes on their behalf) | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ only |
| Read audit trail | ❌ | ❌ | ❌ (own actions only, if surfaced) | ❌ | ✅ (own institution) | ✅ | ✅ |

## Privileged/service-role-only operations (never reachable by any client role)

- Deriving `learner_id`/`user_id` for writes from the authenticated session.
- Computing/recomputing scores and safety-gate results.
- Issuing signed URLs for asset reads.
- Uploading to storage (server route only; no client ever holds a bucket
  write policy).
- Signing/verifying certificate HMACs.
- Writing audit records.
- Running the psychometric recalibration job.

Every row above must be expressible as an automated test per the self-test
doctrine (FABLE-00): authenticate as the denied role, attempt the action via
direct API/REST call (not through UI), assert refusal. A ✅ cell needs the
positive-path test; a ❌ cell needs the negative-path (refusal) test.
