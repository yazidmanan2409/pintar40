# OWNER DIRECTION: PINTAR SUPPORT (4.5), 24 Nov 2026 (ruling 90b)

**A governing design input, preserved verbatim** (headings formatted only). Read it with:
- Sol's independent design review, `SOL-REVIEW.md` (supplied by the owner on 24 Nov);
- `docs/completion-4.1/SUPPORT-FUNCTIONALITY-INVESTIGATION.md`, the D-037 baseline.

---

Following our initial discussion, your investigation of D-037, Sol's independent design review and subsequent refinements, I approve PINTAR Support as a new operational-foundation capability within PINTAR 4.5.
Please consolidate the following into the governing roadmap and prepare the appropriate specification framework.

## 1. Purpose
PINTAR Support shall serve three purposes:

1. Help users recover when something goes wrong.
2. Establish clear responsibility for investigating and resolving problems.
3. Provide reliable operational evidence for continuously improving PINTAR.

This is not merely a problem-reporting form. It shall be a proper, integrated support ticket system.
Our governing philosophy:
A proper ticket system underneath. A simple human conversation on the surface.
Help the person. Fix the problem. Learn from the evidence.

## 2. Relationship with existing functionality
Extend and evolve the existing D-037 problem-reporting functionality.
Do not create a disconnected or competing support system.
Existing reports, references and available historical records must be preserved through a governed migration.
D-037's staff-only reporting restriction shall be superseded for 4.5, allowing learners to request assistance directly, subject to appropriate safeguarding and privacy controls.
The existing 4.1 restriction remains unchanged until the replacement capability is implemented and verified.

## 3. User experience
The proposed entry point is Bantuan, with three simple options:

* Panduan — existing guidance.
* Laporkan masalah — submit a problem.
* Laporan saya — view existing reports and conversations.

Daisy shall determine the final wording, placement and screen compositions using PINTAR's established design grammar.
Users should not be required to classify technical problems, determine severity, select a department or enter information PINTAR already knows.
Submitting a report should be as straightforward as sending a message.

## 4. Standard support journey

1. A learner or educator encounters a problem.
2. The user opens Bantuan and describes the issue.
3. PINTAR creates a ticket with a unique reference.
4. The appropriate institution administrator receives notification.
5. An authorized administrator assumes responsibility.
6. The administrator investigates and communicates with the reporter through a two-way conversation.
7. If the issue can be resolved locally, the administrator communicates the resolution.
8. If platform-level assistance is required, the administrator escalates the existing ticket to PINTAR.
9. Relevant conversation history and permitted diagnostic context accompany the escalation.
10. The reporter and relevant administrators remain informed.
11. The resolution is recorded and communicated.
12. If the problem persists or recurs, the reporter can reopen the original ticket where appropriate.

Institution administrators shall also be able to submit their own support requests directly to PINTAR.
Nobody should have to repeat the entire explanation merely because responsibility has moved to another administrator.

## 5. Ticket records and historical integrity
Every successfully submitted issue shall be logged and saved.
Each ticket shall contain, where applicable:

* Unique ticket reference.
* Reporter identity, role and originating institution.
* Submission date and time.
* Original issue description.
* Permitted diagnostic context.
* Complete conversation history.
* Responsible administrator or authorized handling queue.
* Assignment and reassignment history.
* Category and severity.
* Status and status-change history.
* Escalation history.
* Resolution.
* Root cause, where established.
* Related product issue reference, where applicable.
* Resolution and reopening dates.

Messages, previous classifications, assignments and status changes must not be silently overwritten.
Closing a ticket does not delete its history.
Retention, anonymization, redaction and deletion shall follow approved governance policies. Historical integrity must not be interpreted as indefinite retention of personal information.

## 6. Ticket lifecycle
Adopt Sol's proposed simple lifecycle as the starting point:

* Diterima — received.
* Ditangani — being handled.
* Menunggu tanggapan — awaiting a response or additional information.
* Selesai — resolved.
* Dibuka kembali — reopened.

Daisy shall finalize the visible terminology.
Assignment, reassignment, escalation and severity shall be recorded separately from ticket status.
Escalation is a change in handling responsibility, not necessarily a change in progress.
Where a ticket is awaiting a response, PINTAR must distinguish whether the next action belongs to the reporter or the responsible administrator.
Every active ticket must have a clearly accountable handling party.
An unassigned ticket must remain visible to an accountable queue owner. It must never become everyone's responsibility and therefore nobody's responsibility.

## 7. Routing, escalation and accountability
Establish three distinct support routes:

**A. Institution support.** Ordinary learner, educator and institution-level issues are handled by the appropriate institution administrator.

**B. PINTAR support.** Platform defects, technical failures and matters beyond the institution's authority may be escalated to PINTAR. Institution administrators may also submit directly to PINTAR.

**C. Restricted reporting.** Sensitive concerns, privacy matters, safeguarding issues and complaints involving administrators require appropriately restricted handling routes. A reporter must not be forced to submit a sensitive complaint to the person who is the subject of that complaint.

Escalation must preserve accountability. The originating institution must know who is handling the matter and what happens next, subject to confidentiality restrictions.
Provide controlled mechanisms for reassignment, administrator absence, unanswered reports and delayed handling.

## 8. Learner safeguarding
Learner access is approved in principle for 4.5.
However, PINTAR must distinguish ordinary technical assistance from sensitive matters involving children.
Sharon shall review:

* Restricted reporting routes.
* Authorized recipients.
* Confidentiality boundaries.
* Complaints involving institution staff or administrators.
* Prevention of unauthorized disclosure.
* Appropriate notification content.
* Handling of sensitive records.
* Safeguarding and institutional responsibilities.

PINTAR Support is not an emergency-response service or a child-protection agency.
Restricted reporting must not be activated for real users until responsible human recipients, appropriate procedures and institutional obligations have been established and approved.
Do not assume that ordinary institution administrators or PINTAR administrators are automatically entitled to read every sensitive report.

## 9. Access and institutional boundaries
The intended visibility model is:

* Learners and educators: their own submitted tickets and permitted conversations.
* Institution administrators: their own institution's support history, subject to privacy and restricted-report boundaries.
* Authorized PINTAR administrators: support history across institutions, subject to role-based authorization and confidentiality restrictions.

Institution administrators must never gain access to another institution's support records.
PINTAR-level access must be explicitly authorized, proportionate and audited.
Internal technical notes and restricted communications must remain separate from reporter-visible conversations where appropriate.
All access must be checked against current authorization, including access through old links and notifications.

## 10. Account lifecycle
Integrate support records with PINTAR's existing account lifecycle.
Explicitly address:

* Account suspension.
* Account closure and deletion.
* Learners leaving an institution.
* Transfers between institutions.
* School-year rollover.
* Administrator departure or suspension.
* Institution closure.
* Changes in administrator permissions.

Historical support records remain associated with their originating institution.
A transfer must not automatically disclose previous support conversations to the receiving institution.
Historical records must not imply indefinite historical access rights.
Outstanding tickets must be reassigned when the responsible administrator becomes unavailable or loses authorization.
Extend retention policy R-2 to cover ordinary support records, restricted reports and diagnostic information.

## 11. Diagnostic context
PINTAR may automatically include limited, relevant diagnostic information, such as:

* Application version.
* Affected page or functionality.
* Date and time.
* Browser and device category, where useful.
* Non-sensitive error reference.
* Institution and active role.

Explain relevant automatically collected information to the reporter.
Do not indiscriminately collect:

* Passwords or PINs.
* Authentication tokens.
* Entire browser sessions.
* Assessment answers.
* Unrelated learner records.
* Full database or application logs.
* Other unnecessary personal or sensitive information.

General file attachments, uploaded screenshots and automatic screenshot capture are deferred from the initial 4.5 scope.
Reconsider them only when operational evidence demonstrates a genuine need and appropriate safeguards are established.

## 12. Alternative support access
A user unable to sign in must still have a practical route to obtain assistance.
The initial direction is:

* Controlled unauthenticated account-access assistance.
* Appropriate identity verification.
* Protection against spam, automated abuse and account enumeration.
* No disclosure of sensitive account information before verification.
* No general anonymous ticket submission in the initial release.

Restricted or anonymous reporting beyond this requires separate consideration of safeguarding, institutional obligations and operational capacity.
The support system itself must not become inaccessible precisely when a user needs it most.

## 13. Notifications and reliability
In-app conversations and ticket records are the authoritative support record.
Email is a notification channel, not the support system itself.
Provide appropriate notifications for:

* New tickets.
* New replies.
* Assignment and reassignment.
* Escalation.
* Resolution.
* Reopening.
* Outstanding matters requiring attention.

Notify the person who needs to know or act, rather than notifying everyone about every change.
Email notifications must contain minimal necessary information and direct authorized users back to PINTAR.
Sensitive report content must not appear in ordinary email notifications.
Ensure that:

* Notification failure does not lose a ticket or message.
* Duplicate submissions do not create duplicate tickets unintentionally.
* Retried operations do not create duplicate messages or unintended state changes.
* Opening a notification rechecks current authorization.
* Delivery failures are handled appropriately.
* Notification retry and recovery behaviour is defined.
* Support notifications do not exhaust the shared email allowance or prevent essential authentication emails.

Coordinate this with the email reliability and scalability findings already recorded in the readiness register.

## 14. Issue categorization
Support issues shall be categorized to facilitate investigation, reporting and product improvement.
Initial categories may include:

* Account and access.
* Assessment.
* Learning.
* Results and reports.
* Certificates.
* Content.
* Performance.
* User experience and accessibility.
* Technical issues.
* Suggestions.
* Security and privacy.
* Other.

These are starting categories, not final approved terminology.
Allow authorized administrators to classify and refine classifications while preserving the relevant history.
Distinguish reported symptoms, suspected causes and confirmed root causes.
Do not present an unverified diagnosis as an established fact.
Users should not be burdened with technical categorization during submission.

## 15. Support intelligence
This is a fundamental part of PINTAR Support, not an optional afterthought.
PINTAR must distinguish two related records:

**A. Support ticket.** An individual user's reported experience, conversation and resolution.

**B. Product issue.** An underlying or recurring problem that may affect multiple users or institutions and require a broader product improvement.

Multiple support tickets may be linked to one common product issue.
For example:
Twenty users across eight institutions report difficulties recovering their PIN.
Resolving their individual tickets does not necessarily resolve the underlying product issue.
The product issue remains open until the underlying cause has been appropriately addressed.
A lightweight product-issue record should support:

* Unique reference.
* Description of the underlying problem.
* Related support tickets.
* Affected functionality.
* Number of affected institutions.
* Investigation and confirmed root cause.
* Responsible party.
* Improvement or corrective action.
* Relevant release or implementation reference.
* Verification and subsequent recurrence evidence.

Do not build a second engineering project-management platform inside PINTAR.
Keep this proportionate to the objective.

## 16. Support reporting
Institution administrators should be able to view and understand their own institution's support history.
Authorized PINTAR administrators should be able to examine support history across institutions.
Provide appropriate search, filtering and historical summaries, including:

* Total reports.
* Outstanding and resolved reports.
* Reports by category and affected functionality.
* Time to first meaningful response.
* Time to resolution.
* Reopened reports.
* Recurring issues.
* Related product issues.
* Historical trends.
* Recurrence following implemented improvements.

Define each measurement clearly, including its population, time period and relevant exclusions.
Sensitive reports must not be exposed through summaries, filters, exports or drill-downs to unauthorized users.
Apply PINTAR's existing Visual Intelligence principles.
Plain, useful figures. Clear explanations. No decorative dashboards or unnecessary visual complexity.
Do not interpret a low number of support tickets as proof of user satisfaction.
PINTAR must never discourage reporting simply to improve its support statistics.

## 17. Operational readiness
A support system without responsible people answering it creates frustration rather than trust.
Before real-school activation, establish:

* Who handles ordinary institution reports.
* Who handles PINTAR-level escalations.
* Who handles restricted reports.
* How responsibility is reassigned during absences.
* How unanswered and overdue reports are handled.
* What support hours actually exist.
* What response commitments can realistically be fulfilled.
* How support continuity is maintained when the application is unavailable.

Do not promise response times unless the operational capacity exists to honour those promises.
For 4.1, proceed with softening the two existing unsupported response-time promises through the appropriate controlled change.
Do not expand 4.1 into the full support system.

## 18. Essential human journeys
The eventual specification and verification plan must cover, at minimum:

* Learner submits an ordinary issue.
* Educator submits an issue.
* Institution administrator receives, investigates and resolves it.
* Two-way conversation.
* Institution administrator submits directly to PINTAR.
* Escalation with relevant history.
* Reporter reopens a resolved issue.
* Reporter receives no response.
* Administrator becomes unavailable.
* Duplicate submission or interrupted connection.
* Notification delivery failure.
* User cannot sign in.
* Sensitive report requiring restricted routing.
* Complaint involving an administrator.
* Reporter transfers or leaves an institution.
* Account suspension or deletion.
* Administrator loses authorization.
* Unauthorized cross-institution access attempt.
* Multiple tickets linked to a common product issue.
* Product improvement recorded and subsequent recurrence examined.
* Migration and continued accessibility of existing D-037 records.

Apply our established questions throughout:

* And then what?
* What else did that change?
* What happens when something goes wrong?
* Can we remove friction?
* Can we achieve the same objective more simply?

## 19. Scope boundaries
The initial 4.5 capability shall not include:

* General file attachments and screenshots.
* AI-generated support replies.
* Automated AI categorization.
* Predictive support intelligence.
* Live chat.
* Chatbots.
* WhatsApp integration.
* Complex service-level agreements.
* Configurable workflow builders.
* A separate engineering project-management system.

We are not building a commercial helpdesk platform.
We are building the support capability PINTAR and its institutions genuinely need.

## 20. Roadmap progression
**4.5 — Listen and Resolve.** Integrated support tickets, conversations, assignment, escalation, notifications, historical records, categorization, basic support reporting and identification of recurring product issues. Capture the evidence needed to understand subsequent improvements.

**5.0 — Learn and Improve.** More structured evaluation of whether product and operational improvements reduce recurring problems and improve the human experience.

**6.0 — Anticipate and Assist.** Contextual assistance that helps users overcome difficulties before they need to submit support tickets, subject to appropriate privacy and governance boundaries. This must not become intrusive behavioural monitoring or unsupported conclusions about users.

## 21. Governance and responsibilities
Bob++ shall consolidate this direction, the D-037 investigation and Sol's independent review into the governing roadmap and future specification framework.
Daisy shall govern:

* Human journeys.
* Terminology.
* Screen compositions.
* Accessibility.
* Simplicity.
* Consistency with PINTAR's established design grammar.

Sharon shall govern:

* Authorization and institutional boundaries.
* Privacy and learner safeguarding.
* Restricted reporting.
* Retention and account lifecycle.
* Diagnostic information.
* Notification confidentiality.
* Abuse prevention.
* Auditability and historical integrity.

Second Eye shall independently examine:

* Architectural dependencies.
* Data and state integrity.
* Failure and recovery scenarios.
* Migration from D-037.
* End-to-end verification requirements.
* Regression risks.

Resolve ordinary implementation decisions within established authority.
Escalate material policy, safeguarding, operational, legal, financial or scope decisions.

## 22. Owner decisions and remaining gates
The following directions are approved:

* PINTAR Support belongs in 4.5.
* Learner reporting is included, subject to safeguarding and activation conditions.
* Restricted reporting shall be designed, with activation separately governed.
* General anonymous reporting is excluded initially.
* Controlled unauthenticated account-access assistance is included.
* Historical tickets remain associated with their originating institution.
* R-2 shall be extended to govern support records.
* Attachments and screenshots are deferred.
* Support intelligence and common product-issue records are included.

The following remain subject to appropriate review and subsequent approval:

* Actual restricted-report recipients and handling procedures.
* Specific retention periods and disposal rules.
* Named operational support personnel and responsibilities.
* Support hours and response commitments.
* Real-user activation.

Do not invent operational arrangements or treat roadmap approval as authorization to activate the capability.

## 23. Immediate instructions

1. Record PINTAR Support as an approved 4.5 roadmap capability.
2. Preserve this direction and Sol's independent review as governing design inputs.
3. Reconcile the addition against the existing roadmap and identify dependencies.
4. Record any unresolved material decisions without unnecessarily interrupting current development.
5. Incorporate detailed specification and implementation into the appropriate future development sequence.
6. Do not begin support-system implementation now.
7. Do not interrupt D2-R, the remaining 4.1 closure work or Audit 79 preparation.
8. No production changes, external subscriptions or expenditure are authorized.

Continue the current approved development sequence.
Run, resolve; stop only for major items.
PINTAR Support must not merely help people use PINTAR. It must help PINTAR become better for the people who use it.
PINTAR SELALU.
