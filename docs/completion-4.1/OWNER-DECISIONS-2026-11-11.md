# PINTAR 4.1 · owner decisions of 11 November 2026

**Authority:** the owner, 11 Nov 2026, after the whole-platform assessment (`WHOLE-PLATFORM-ASSESSMENT-2026-11-10.md`) and its clarification. These decisions are recorded here by reference, as the scope register records the 9 Nov directives. They continue the register's numbering.

**Principle (owner):** PINTAR doesn't just need intelligence. It needs to be operable.

## 1 · The nine decisions

| # | Decision | Ruling |
|---|---|---|
| O41-7 | **Walkthrough date** | Not committed. Set once the sitting-control and item-workbench foundations are complete. January 2027 is a forecast. Supersedes the mid-December target in O41-5; the rest of O41-5 stands (one complete walkthrough, no partial acceptance). |
| O41-8 | **Job positions, acting appointments, future-dated roles** | Deferred to 4.2. |
| O41-9 | **Exam Mode** | Deferred to 4.2. 4.1 delivers single-writer protection, assessment continuity and controlled recovery; Exam Mode builds on them. Narrows O41-3. |
| O41-10 | **In-app question editing** | Approved for 4.1. The item workbench supports human authoring and editing, stable item identity, revision lineage, and the later review of AI-generated drafts. |
| O41-11 | **Wrong-answer-key correction** | Approved. Withdrawing a release prevents new sittings. A correction needs an authorized content owner and an independent second person's confirmation. Kept: the original responses, the original scoring decisions, the corrected decisions and the full authorization history. Affected mastery decisions and certificates are addressed without silently rewriting history. |
| O41-12 | **One person holding roles at two schools** | Principle approved. Implementation deferred to 4.2. 4.1 introduces no new assumption that unnecessarily obstructs it. |
| O41-13 | **Accountability events** | A separate event store with 12 months' retention and controlled purging. The append-only audit trail is preserved. |
| O41-14 | **AI provider evaluation** | Approved within the US$25 ceiling (O41-1). It begins early. Educators remain responsible for approving content. |
| O41-15 | **Development-process rules** | The five rules in §3 are adopted, with one qualification: a genuine security, authorization, evidence-integrity or essential-journey blocker is always resolved before closure. |

## 1b · Four further rulings (11 Nov, later the same day)

| # | Question | Ruling |
|---|---|---|
| O41-16 | **Another attempt at Uji Penguasaan** | The teacher may request it, with a reason. An independent authorized approval is required before it is granted, because mastery can lead to certification. |
| O41-17 | **A suspended learner's sitting** | Freeze access immediately. Preserve acknowledged answers and remaining time. On reinstatement, the teacher resumes or closes it; it never resumes silently and never gains time. |
| O41-18 | **The authorized content owner** | For school-owned content, the school's authorized content owner. For platform content distributed across schools, an authorized platform content owner. Both require independent confirmation, with affected schools notified. |
| O41-19 | **A certificate after corrected scoring** | Not silently revoked, and not left standing as valid. Flagged for authorized review with its history preserved. Verification must not present a disputed certificate as unquestionably valid. |

Also ruled the same day:
- The two outstanding rendered checks on 4.0 staging do not hold 4.1 development (see `EXECUTION-PLAN.md` §6).
- The provider evaluation's design, material and US$25 ceiling are approved; execution waits for secure access and named judges, and blocks nothing (`C3-EVALUATION-PLAN.md`).
- Planning records become the authoritative repository record once merged into `main` through the protected process.

## 2 · Approved direction: three lanes

- **Lane A · Assessment operations:** sitting control; pause and emergency controls; cross-device recovery and single-writer enforcement.
- **Lane B · Operational safety and accountability:** essential administrator lock-out protection; accountability events and retention; printed-report identification within the approved C6 scope.
- **Lane C · Question and content operations:** the item workbench and revision lineage; misconception annotations; AI-assisted question generation, after its foundations are ready.

The approved educational safeguards and human-approval boundaries stay intact. The estimate of about 50–65 engineering days is a planning estimate. It is not a deadline, and it is not permission to reduce correctness.

## 3 · The five process rules (O41-15)

1. **Define completion before building.** Each batch has a completion page, written first, as operations and not features: who can create, change, suspend, restore and retire, what history is kept, and the states each screen shows. Sharon and Daisy review that page once, before code.
2. **The engineer runs the rendered check before any review.** One fixed checklist: 1280, 390 and 320 px; keyboard only; every disclosure opened; the reviewer's own navigation sequence.
3. **A ruling that arrives mid-batch goes to the next batch,** unless it is a blocker.
4. **One review of the result, one correction pass, then close.** A finding is classed when raised. A blocker reopens the batch. Anything else goes to the register.
5. **Verify per batch, not per commit.** Targeted tests while building; the full suite, CI and journeys once on the batch's candidate. A presentation-only change after that reruns CI and the affected tests.

**What counts as a blocker (owner's qualification):** a demonstrated failure of security, authorization, evidence integrity or an essential journey. Blockers are always resolved before a batch closes.

**Also adopted:** each closed, verified batch is promoted to staging through the protected process. A merge to `main` migrates and deploys staging, so each promotion is authorized as that combined act. Nothing here authorizes a production deployment.

## 4 · Deferred to 4.2 (kept in the roadmap)

From the 9 Nov register:
- Exam Mode.
- Formal job positions, dated position history, acting appointments, future-dated role starts.

Operational improvements found by the assessment:
- School data export.
- Opening past reports, and a period selector.
- A school admin adding one person outside an import, and correcting a name after activation.
- Declining an account request.
- Password change while signed in.
- The "classes without a teacher" view.
- One person holding roles at two schools (principle approved, O41-12).
- Professional Development: end a programme, remove a participant, the school ending its own PD sittings.
- Structure corrections: reactivate or move a class; rename a school; undo a promotion run as a whole.

Later than 4.2 unless ruled in: closing or archiving a school; a foundation above several schools; editable year dates and semesters; un-revoking a certificate; restoring a withdrawn release; schools adapting platform content; briefings; learner and family deletion (with counsel).

**Scope discipline (owner):** deferred does not mean forgotten, and 4.1 is not silently expanded because another desirable improvement is discovered.

## 5 · Authority and boundaries (owner)

The engineer coordinates the approved work, challenges implementation defects, and resolves routine engineering issues within scope.

Not without the owner:
- a new capability;
- reopening a settled decision without material new evidence;
- another whole-platform assessment;
- repeated reviews of accepted work without a concrete blocker;
- any production change or release.

Escalate only material decisions, blocked dependencies, or changes with significant consequences.

## Rulings of 11 Nov, after the pre-build review

- **O41-20 · An abandoned sitting.** It ends at its effective deadline, is scored on the answers successfully recorded, and uses one attempt. Unanswered questions stay unanswered. Authorized pauses and extensions are respected. The original answers, timestamps and closure reason are preserved. The learner and the teacher are told it ended because its deadline passed, not because it was handed in. A sitting without a deadline gets a deterministic, governed closure rule, with no invented expiry period and no silent change to existing assessment conditions (the rule is on `batches/A1-COMPLETION.md`).
- **O41-21 · Corrected results.** After an authorized key correction the learner sees the corrected result as the current result, clearly identified as corrected. The original sealed result stays preserved and traceable. An affected certificate follows O41-19. No historical evidence is silently rewritten.
- **O41-22 · Multiple governed answer-key corrections.** The one-recalculation-per-sitting rule stays for ordinary recalculation. An authorized wrong-key correction may recalculate again, including on a sitting already recalculated. Conditions: the approved content-owner authorization and independent confirmation for each correction; scoring from the original recorded responses against the complete currently authorized key, never by adjusting an earlier corrected score; every earlier result, basis, reason, authorization and timestamp kept in an immutable chain; exactly one current result, shown to learner and teacher as corrected; O41-19 review whenever certificate validity is affected, with no silent revocation and no automatic revalidation; concurrent corrections cannot create competing current results; the controls against new sittings on a withdrawn or known-invalid release are kept. The exception covers governed key corrections only. Built within C1w; no new review cycle.
