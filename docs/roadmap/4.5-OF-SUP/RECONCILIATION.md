# 4.5-OF-SUP · PINTAR Support: reconciliation with the roadmap, and the specification framework (Bob, 24 Nov 2026; ruling 90b)

**The governing inputs:**
1. `OWNER-DIRECTION-2026-11-24.md`, verbatim;
2. Sol's independent design review (`SOL-REVIEW.md`);
3. `docs/completion-4.1/SUPPORT-FUNCTIONALITY-INVESTIGATION.md`, the D-037 baseline.

**This record supersedes ruling 90a's six-area summary** where the two differ.

**Nothing here authorises implementation, activation, production change, subscription or spend.**

## 0 · The inputs: complete

Sol's review was supplied by the owner on 24 Nov and is preserved verbatim as `SOL-REVIEW.md`.

**Sol's six decisions (§11), against the owner's §22:**

| Sol | The owner's direction | State |
|---|---|---|
| 1 · Restricted-report recipients | «subject to … approval» | **Open: SUP-O1** |
| 2 · Anonymous reporting | «General anonymous reporting is excluded initially»; unauthenticated **account-access** assistance is included | **Decided** |
| 3 · What school administrators keep access to after a reporter leaves | Records stay with the originating institution; «must not imply indefinite historical access rights» | **Partly decided:** the principle is set; the exact access rule is **open: SUP-O7** |
| 4 · Retention periods | R-2 is extended to cover support records; the specific periods await approval | **Open: SUP-O2** |
| 5 · Who handles PINTAR-level escalations | «Named operational support personnel» await approval | **Open: SUP-O3** |
| 6 · Attachments | «Attachments and screenshots are deferred» | **Decided** |

**Sol's permanent principle, adopted for the specification:**
> Every support ticket represents a person who expected PINTAR to help them and encountered something that prevented it from doing so.

## 1 · Where it sits

- **The phase:** 4.5's operational foundation (OF), ruling 72, with the former 4.2 items. «4.5: Listen and Resolve».
- **Later phases:**
  - **5.0 «Learn and Improve»** adds a structured evaluation of whether improvements reduce recurrence.
  - **6.0 «Anticipate and Assist»** is a new horizon, recorded here and not yet in the master sequence's stages.
- **Not 4.1.** 4.1 carries only the two softened `lapor.langkah.*` strings (ruling 90 A), riding D2-R.

## 2 · Dependencies, reconciled against the existing roadmap

| # | It depends on | Where that stands | Effect |
|---|---|---|---|
| S-D1 | **R-2, retention** (extended to ordinary support records, restricted reports and diagnostics; §10, §22) | An undecided owner decision, with counsel (PR-2; counsel part 2, Q3) | **Specific periods and disposal rules gate the build's retention jobs.** The data model can be specified first |
| S-D2 | **Counsel part 2** (Q1 controller status, Q6 notices and legal basis, Q7 breaches and data-subject requests) | Final, awaiting the owner's approval of scope and fees | The privacy information, the account-access route (§12) and the restricted route's legal basis |
| S-D3 | **Account lifecycle** (§10): suspension, closure and deletion, transfer (OD-9; ruling 73 C′), rollover, administrator departure | Built in 4.0–4.1. The former 4.2 items **4.2-07** (declining an account request) and **4.2-08** sit in 4.5's OF | Support hooks at each lifecycle event. Specify them together with 4.2-07 and 4.2-08 |
| S-D4 | **The last usable school admin** (Z8 item 8, migration 308) and Sharon's 4.5 notes: a locked platform admin; a warning before the last admin's appointment expires | Z: done. The notes are in 4.5 | The accountable-queue rule (§6) uses the same "usable admin" definition |
| S-D5 | **Email** (§13): one Namecheap domain shared with the sign-in emails, 10,000/hour; the app's sender does not retry | Readiness register, «Email capacity» | Required: rate limiting per sender, a notification outbox with retries, and a reserve kept for sign-in emails. **This is in 4.5-OF-SUP's own scope**, not a new subscription |
| S-D6 | **PR-12 and PR-15** (a monitored route; named support people) and §17 operational readiness | The owner's (GAP) | **Gates real-user activation**, not the build |
| S-D7 | **Guest Mode G4** (explains the report form without sending) | 4.5 | G4's words follow the new Bantuan entry |
| S-D8 | **Visual Intelligence principles** (§16) | Established | Support reporting follows them |
| S-D9 | **Ruling 79's audit ledger:** L-31 (the response promise), L-32 (no report link carrying the error page's reference code) | Post-4.1 | L-32's fix may be taken in the audit, or here. Decide at 4.5 planning |
| S-D10 | **The production-environment guard (PRQ-4)** and dispatch rights | Owner; the settings page returned 404 | Not a build dependency. It is one before any production notification job |

**No conflict found** with 4.5's critical path (RD-4, then 4.5-01, 4.5-04, 4.5-10, Quiet Intelligence). 4.5-OF-SUP is OF work, so it is accepted at the OF gate. It can be designed in parallel with 4.5 planning.

## 3 · The specification framework (to be written at 4.5's planning gate, in this order)

1. **The data model and migration from D-037:**
   - tickets, messages (reporter-visible versus internal), assignments, status events, escalations, classifications, product issues and links;
   - append-only history;
   - a governed migration of every `support_reports` row and its reference, with a before-and-after preservation proof.
2. **Routing and accountability:** the three routes (A institution, B PINTAR, C restricted); the queue owner for unassigned tickets; reassignment on absence or loss of authority.
3. **Lifecycle:** the five states, with assignment, escalation and severity kept separate from status, and whose turn it is in «Menunggu tanggapan».
4. **Access:** visibility per role, institutional isolation, audited PINTAR access, a re-check through old links and notifications.
5. **Safeguarding and restricted reporting:** Sharon's review list (§8). Its activation is gated separately.
6. **Diagnostics:** the allowed list, the forbidden list, and what the reporter is told.
7. **Account-access assistance without signing in:** verification, abuse protection and no enumeration.
8. **Notifications:** an outbox, retries, deduplication, minimal content, the email reserve.
9. **Intelligence and reporting:** categories (symptom, suspected cause, confirmed root cause), product issues, measures defined with their population, period and exclusions.
10. **The journeys:** the 21 in §18, as the verification plan.

**Reviews:**
- **Daisy:** the journeys, terminology, compositions, accessibility.
- **Sharon:** authorisation, privacy, safeguarding, restricted routes, retention, diagnostics, notification confidentiality, abuse, audit.
- **Second Eye:** architecture, data and state integrity, failure and recovery, the D-037 migration, end-to-end verification, regression.

## 4 · Material decisions still open (owner; none blocks current work)

| # | Decision | Needed by |
|---|---|---|
| SUP-O1 | Who receives restricted reports, and the handling procedure | The restricted route's activation |
| SUP-O2 | Retention periods and disposal for each support record type (R-2's extension) | The build's retention jobs |
| SUP-O3 | Named support people for institution, PINTAR and restricted handling; cover for absences | Real-user activation |
| SUP-O4 | The support hours that actually exist, and any response commitment | Real-user activation, and any wording that promises a time |
| SUP-O5 | Real-user activation itself | After the build is verified |
| SUP-O6 | ~~Sol's review supplied~~ **Done (24 Nov)** | — |
| SUP-O7 | Exactly which support history an institution's administrators keep seeing after a reporter leaves or transfers (the principle is set: no indefinite rights; nothing follows the reporter) | The access model's specification; Sharon proposes |
