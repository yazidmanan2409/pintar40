# Sol's independent design review: PINTAR Support (24 Nov 2026)

**A governing design input (ruling 90b), preserved verbatim** (formatting only), as the owner relayed it. Read it with `OWNER-DIRECTION-2026-11-24.md`.

---

Captain, I strongly support introducing **PINTAR Support in 4.5**. However, I would treat it as more than an integrated ticketing system.

It should serve three purposes:

1. Help people recover when something goes wrong.
2. Give schools and PINTAR clear responsibility for resolving problems.
3. Provide reliable evidence about where PINTAR itself needs improvement.

The third purpose is particularly valuable. It connects directly with our Human Experience, Consistency & Trust Audit and the longer-term vision of Contextual Intelligence.

My independent assessment follows.

# PINTAR Support — Independent Design Review

## 1. The human experience

Your proposed journey is sound, but it assumes that everything works normally.

I would extend it to cover several additional situations.

| Situation | Required behaviour |
|---|---|
| A learner cannot sign in | An alternative support route is available without requiring authentication. |
| A learner accidentally submits twice | PINTAR prevents duplicate submissions. |
| The school administrator is unavailable | Another authorized person can assume responsibility. |
| A reporter receives no response | The ticket remains visible, with a clear route to escalate the delay. |
| The issue concerns the school administrator | The reporter can bypass that administrator. |
| The reporter transfers schools | Historical support records remain protected and do not automatically follow them to the new school. |
| Email delivery fails | The ticket and conversation remain available inside PINTAR. |
| A resolved problem recurs | The original ticket can be reopened where appropriate. |
| Many schools report the same problem | Individual tickets can be connected to one underlying product issue. |

These are essential journeys, not optional refinements.

### My recommendation for the interface

A user selecting **Bantuan** should encounter something remarkably simple:

- Panduan — find existing guidance.
- Laporkan masalah — report a problem.
- Laporan saya — check existing reports.

PINTAR should not start by asking users to classify their problems, determine severity or choose a department.

Those are administrative responsibilities.

---

## 2. Ticket lifecycle

I would avoid a complicated commercial helpdesk workflow.

Five visible states should be sufficient:

| Status | Meaning |
|---|---|
| Diterima | The report has been received. |
| Ditangani | Someone is working on it. |
| Menunggu tanggapan | Additional information or a response is needed. |
| Selesai | A resolution has been provided. |
| Dibuka kembali | The reported problem remains or has returned. |

Assignment, escalation and reassignment should be recorded separately from status.

For example, a ticket can be **Ditangani** while being escalated from the school administrator to Admin PINTAR. Escalation does not itself mean progress or resolution.

A waiting ticket must also distinguish whether it is waiting for the reporter or the responsible administrator.

Every active ticket should have a clearly identified responsible party. **An unassigned ticket must never become everyone's responsibility and therefore nobody's responsibility.**

## 3. Escalation and accountability

I support the school-first support model for ordinary issues.

However, I would introduce three distinct routes.

| Route | Appropriate use |
|---|---|
| School support | Learning access, class assignments, account assistance and ordinary school matters. |
| PINTAR support | Platform defects, technical failures and issues beyond the school's authority. |
| Restricted reporting | Sensitive concerns, privacy issues, safeguarding or complaints involving administrators. |

School administrators should be able to escalate technical problems without asking users to describe everything again.

The relevant conversation and diagnostic context should accompany the escalation, subject to visibility restrictions.

Escalation must not silently abandon responsibility. The school should know who is handling the issue and what happens next.

---

## 4. Learner safeguarding — essential

This is the area where I would exercise the greatest caution.

Allowing children to submit reports introduces responsibilities that extend beyond ordinary technical support.

A learner might report something concerning bullying, inappropriate conduct or a member of staff, rather than a software problem.

PINTAR must not automatically display such a report in the ordinary school administrator's queue.

I recommend:

- A clearly identified restricted reporting route.
- Access limited to specifically authorized and responsible people.
- No sensitive report content in email notifications.
- No unrestricted access by ordinary support administrators.
- Clear guidance that PINTAR Support is not an emergency-response service.

**A sensitive reporting feature should not be activated until the responsible human recipients and their handling procedures are established.**

The technology cannot substitute for a safeguarding policy or responsible institutional personnel.

---

## 5. Privacy and diagnostic context

Your principle that PINTAR should not ask users for information it already knows is excellent.

However, automatically collected context must be deliberately limited.

### Appropriate context

- Ticket reference.
- Application version.
- Relevant page or feature.
- Time of occurrence.
- Browser and device category, where useful.
- Non-sensitive error reference.
- School and active role.

### Information that must not be collected indiscriminately

- Passwords, PINs or credentials.
- Authentication tokens.
- Entire browser sessions.
- Unrelated learner records.
- Assessment answers.
- Full database or application logs.

Where additional diagnostic information is collected, explain it to the user.

I would defer general file attachments and automatic screenshots from 4.5's initial scope. They introduce significant privacy, storage and moderation considerations.

An exception can be considered later if actual support experience demonstrates a genuine need.

## 6. Support across the account lifecycle

This is particularly important given everything we learned in 4.1.

| Event | Expected behaviour |
|---|---|
| Reporter suspended | Existing tickets are preserved; access follows the applicable account restrictions. |
| Reporter leaves a school | The original institution's records remain appropriately governed. |
| Administrator leaves | Outstanding tickets are reassigned. |
| Reporter transfers schools | The new school does not automatically gain access to the old school's tickets. |
| Account deleted | Retention and anonymisation follow the approved policy. |

PINTAR should preserve historical accountability without assuming that historical access rights remain valid indefinitely.

The retention policy R-2 will need to cover support records, including sensitive reports and diagnostic data.

---

## 7. Notifications

I agree that email should be a notification channel, not the primary support system.

In-app tickets and conversations must remain the authoritative record.

Four safeguards are essential:

- A notification failure must not lose the ticket or message.
- Opening a notification must recheck the recipient's current authorization.
- Duplicate notifications must not create duplicate tickets.
- Emails should contain minimal necessary information and direct the recipient back to PINTAR.

I would also avoid notifying everyone about every change.

Notify the person who needs to know or act.

This is consistent with our future Contextual Intelligence principle: **the best assistance sometimes means knowing when not to interrupt.**

## 8. Support intelligence — the most valuable long-term capability

Your example of 20 users across eight schools experiencing PIN recovery difficulties is exactly right.

We must distinguish **resolving a report from resolving its cause.**

Consider this example:

| Record | Outcome |
|---|---|
| Ticket #101 | Learner's account recovered. |
| Ticket #126 | Teacher's PIN reset. |
| Ticket #153 | Administrator assisted. |
| Common product issue | PIN recovery journey causes repeated confusion. |
| Engineering improvement | Recovery screens and guidance redesigned. |
| Subsequent verification | Recurrence monitored after the improvement. |

All three tickets may be resolved while the underlying product issue remains open.

I recommend two related records:

- **Support ticket:** an individual's experience and its resolution.
- **Product issue:** a recurring or underlying problem requiring a broader improvement.

This does not require a second engineering project-management platform inside PINTAR. A lightweight common-issue reference and lifecycle are sufficient initially.

### Measurements worth retaining

- Number of reports by functionality and category.
- Number of unresolved tickets.
- Time until first response.
- Time until resolution.
- Reopened tickets.
- Recurring reports linked to known product issues.
- Whether reports decrease following a product improvement.

These must be interpreted carefully. A low number of reports does not necessarily mean users are satisfied; they may simply have stopped reporting problems.

---

## 9. Operational responsibility

This is the most important nontechnical dependency.

**A support system without people responsible for answering it becomes a source of frustration rather than trust.**

Before introducing it to real schools, establish:

- Who handles ordinary school reports.
- Who handles escalated technical reports.
- Who handles restricted reports.
- How responsibility is reassigned during absences.
- What support hours actually exist.
- What response commitments PINTAR can realistically fulfil.

We recently removed the one-school-day response promise because a monitored support arrangement was not yet established.

That lesson must carry forward.

Do not build response-time promises into the interface until the operational capacity exists to honour them.

---

## 10. My recommended final scope for 4.5

I would separate the essential foundation from more advanced intelligence.

| Capability | Recommended scope |
|---|---|
| Learner and educator reporting | Essential |
| Alternative route for users unable to sign in | Essential |
| Unique ticket reference and history | Essential |
| Two-way conversation | Essential |
| Assignment and reassignment | Essential |
| School-to-PINTAR escalation | Essential |
| Restricted reporting and safeguarding boundaries | Essential |
| Status, resolution and reopening | Essential |
| In-app and minimal email notifications | Essential |
| Institutional isolation and privileged-access auditing | Essential |
| Retention and account-lifecycle handling | Essential |
| Controlled diagnostic context | Essential |
| Categorization and severity | Essential |
| Linking recurring tickets to a common product issue | Essential |
| Basic support trends and historical summaries | Essential |
| General attachments and screenshots | Defer |
| Automated AI categorization and AI-generated replies | Defer |
| Predictive support intelligence | Defer |
| Live chat and chatbot support | Defer |
| WhatsApp support integration | Defer |
| Complex service-level agreements and workflow builders | Out of scope |

This provides a complete, meaningful support capability without turning PINTAR into a commercial helpdesk platform.

## 11. Decisions requiring your attention

I believe six material decisions are needed before detailed implementation planning.

1. **Restricted reporting:** Who receives sensitive learner reports, particularly those involving school staff or administrators?
2. **Anonymous reporting:** Should entirely anonymous reports be permitted, or only unauthenticated account-access requests?
3. **Institutional visibility:** Which support histories may school administrators retain access to after a reporter leaves?
4. **Retention:** How long are ordinary and sensitive support records retained?
5. **Operational responsibility:** Who will manage PINTAR-level escalations during actual school use?
6. **Attachments:** Confirm whether these remain deferred until demand and privacy requirements are better understood.

Bob++ and the team should be able to settle most other implementation decisions independently.

## 12. Strategic relationship with 5.0 and 6.0

PINTAR Support creates an interesting additional progression.

| Version | Support capability |
|---|---|
| **4.5** | Help users report problems, resolve them and identify recurring issues. |
| **5.0** | Evaluate whether product and operational improvements reduce recurring problems. |
| **6.0** | Recognize difficulties in context and offer relevant assistance proactively, under appropriate privacy boundaries. |

Imagine a teacher repeatedly encountering difficulty configuring an assignment.

Rather than waiting for another support report, a future PINTAR could offer the relevant guidance at the appropriate moment.

But this must not become intrusive behaviour monitoring or unsupported conclusions about the teacher.

---

## Final professional opinion

I recommend approving PINTAR Support as an operational workstream within consolidated 4.5, with the scope and safeguards above.

Keep its original design philosophy:

**A proper ticket system underneath. A simple human conversation on the surface.**

And I would add one permanent principle:

> Every support ticket represents a person who expected PINTAR to help them and encountered something that prevented it from doing so.

Resolving their immediate problem is our first responsibility.

Learning why the problem occurred, and preventing others from experiencing it, is our second.

That is how PINTAR earns trust and continuously improves.
