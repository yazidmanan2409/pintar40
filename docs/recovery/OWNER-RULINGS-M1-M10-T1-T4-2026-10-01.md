# PINTAR 4.0 — OWNER RULINGS M1–M10 + T1–T4 (authoritative resolution)

**Recorded verbatim, 1 October 2026 (Yazid). Canonical reference: D-085.** These rulings resolve the open product decisions identified by the Human Journey & Reality Scenario Catalogue cross-check. They are owner rulings and must not be reinterpreted, expanded into additional features, or reduced to fit the current implementation.

---

## M1 — NEW SCHOOL PROVISIONING

INCLUDE IN PINTAR 4.0.

A new school is provisioned by an authorised PINTAR Platform Administrator through a controlled, repeatable, versioned and audited provisioning process.

Public school self-registration is NOT required for PINTAR 4.0.
A school-creation UI is NOT required for PINTAR 4.0.
Hand-written production SQL is NOT an acceptable normal provisioning method.

The provisioning process establishes the minimum institutional foundation required to hand PINTAR safely to the school's first administrator.

After handover, normal school operation belongs to the school rather than PINTAR Platform Operations.

Principle:

"PINTAR opens the front door and gives the school administrator the key. From there, the school runs its own house."

## M2 — STUDENT SIGN-IN WHEN EMAIL EXISTS

INCLUDE IN PINTAR 4.0.

Students have ONE normal authentication model:

PINTAR class card + PIN.

Having an email address recorded for a student does NOT create another normal student sign-in method.

No student magic-link sign-in is required.
No student email/password sign-in is required merely because an email exists.
No "choose how to sign in" experience is required.

Student recovery remains school-assisted and must not depend on the student having or remembering access to an email account.

## M3 — COMPLETION VS MASTERY

INCLUDE IN PINTAR 4.0.

PINTAR must distinguish:

1. completion of the assigned learning cycle; and
2. achievement of the defined mastery target.

Completing a post-test does NOT automatically mean that mastery was achieved.

After the post-test, the learner must be clearly told whether the mastery target was achieved.

If the learner is below target:

- PINTAR directs the learner toward relevant material for review;
- the learner remains visibly below target to the authorised teacher;
- PINTAR must not imply successful mastery merely because the activities were completed;
- the teacher may reassign existing learning material to selected learners who need additional support.

Automatic adaptive remediation is NOT required for 4.0.
Unlimited/unrestricted post-test retries are NOT required for 4.0.

Principle:

Completion and mastery are separate truths.

## M4 — TEACHER VIEW OF AN INDIVIDUAL LEARNER

INCLUDE IN PINTAR 4.0.

A teacher may open an individual learning view for a student within that teacher's authorised teaching scope.

The teacher may see educational evidence needed to support that learner, including as applicable:

- learning/progress status;
- whether assigned learning has started/completed;
- relevant assessment results;
- mastery status;
- areas/objectives in which the learner is having difficulty;
- other relevant learning evidence permitted by the teacher's role.

This is an educational view, NOT a general personal-information dossier.

It does not automatically expose restricted integrity/security information.

Access remains role- and scope-bound.

Question-level answer visibility is governed separately by M5.

## M5 — QUESTION-LEVEL EVIDENCE FOR TEACHERS

INCLUDE IN PINTAR 4.0.

After an assessment has been submitted/closed, an authorised teacher may see question-level performance for the classes they teach.

The teacher may also drill into relevant submitted answers for individual students within their authorised teaching scope where needed to understand learning.

During an active assessment, individual answers are NOT exposed as a live feed.

Question-level learning evidence is distinct from:

- Question Health;
- integrity/anomaly evidence;
- other restricted system observations.

For Uji Cepat, this enables the teacher to see immediately which questions the class understood and which questions indicate a learning problem.

## M6 — STANDARD PINTAR CONTENT ACROSS SCHOOLS

INCLUDE IN PINTAR 4.0.

The Indonesian school context is fundamental to this ruling:

The same standard textbook/lesson may be used across all applicable schools.

Example:

SD5 Mathematics may use the same textbook across all schools.

PINTAR should therefore prepare standard content ONCE, govern/version it centrally, and make the applicable release available to every relevant school.

Schools must NOT have to independently recreate or manually copy the same standard content.

PINTAR has two content origins:

1. PINTAR STANDARD CONTENT
   Centrally prepared, governed, versioned and distributed.

2. SCHOOL CONTENT
   Supplementary/local material created and published by the school or its authorised educators.

Teachers preparing learning must be able to see and assign both applicable PINTAR standard content and their school's own published content, with origin made clear.

A school consumes the authorised central release rather than receiving an unrelated independent copy that can silently drift.

Schools remain free to add their own lessons, questions and supplementary material without modifying the centrally governed release.

Principle:

Common curriculum/content centrally.
School enrichment locally.

## M7 — WHOLE-CLASS PINTAR CARD ISSUANCE

INCLUDE IN PINTAR 4.0.

An authorised school administrator can issue PINTAR student cards for an entire class in one operation and generate a practical printable class set for distribution.

Individual issuance/reissue remains available for exceptions such as a new student or a replacement card.

Batch issuance must preserve:

- individual student identity;
- credential security;
- auditability.

No specialised physical card-production service or design studio is required.

The intended ordinary-school experience is:

class selected
→ cards prepared
→ printable class set
→ distribute.

## M8 — EMAIL OPERATIONAL TRUTH

INCLUDE IN PINTAR 4.0.

This applies to relevant staff/transactional email operations, not student authentication.

PINTAR must retain sufficient operational evidence for authorised Platform Operations to determine what happened to an important transactional email.

The operational state must distinguish relevant states such as:

requested
→ accepted for sending
→ sent/handed off
→ refused/failed

and allow stuck flows to be identified where applicable.

Platform Operations must have sufficient information to answer:

"What happened to this email?"

Ordinary users do NOT need SMTP/provider diagnostics.

User-facing messages must reflect the state PINTAR actually knows.

PINTAR must NOT knowingly tell a user that an email was sent when its own evidence says the request was refused, throttled or failed.

PINTAR is not required to guarantee that an external mail provider ultimately placed the message in the recipient's inbox.

Principle:

Never claim an event occurred when PINTAR's own evidence says it did not.

## M9 — STUDENT MOVES CLASS WITHIN THE SAME SCHOOL

INCLUDE IN PINTAR 4.0.

An authorised school administrator may move a student from one class to another within the same school.

The student's identity remains the same.

Historical learning and evidence remain intact and retain the context in which they actually occurred.

Example:

If a student completed Chapter 3 while in SD5-A, moving the student to SD5-B must not rewrite history to claim the learning occurred in SD5-B.

After the move:

- current class membership follows the new class;
- future access/work follows the appropriate new-class context;
- the previous class no longer treats the student as a current member;
- historical evidence remains historically truthful.

PINTAR must not create a duplicate student to perform the move.

PINTAR must not rewrite historical evidence because of the move.

This is distinct from transferring a student to another school.

Principle:

The student moves.
Their history does not.

## M10 — CORRECTING PUBLISHED CONTENT

INCLUDE IN PINTAR 4.0.

Published content that has been used is immutable.

A correction creates a NEW revision/release within the SAME content lineage.

Example:

SD5 Mathematics
→ Chapter 6
→ Release 1
→ corrected by Release 2.

Release 2 is not an unrelated new course.

Every correction/revision must retain an auditable change history sufficient to establish:

- what changed;
- why it changed;
- who made the change;
- who approved/reviewed it where applicable;
- when it changed.

Historical learning remains bound to the exact release the learner actually experienced.

New learning uses the appropriate current release.

A learner who completed Release 1 must not later appear to have completed Release 2 merely because Release 2 corrected the material.

Started/finished evidence remains bound to its original release.

PINTAR must not silently replace content underneath an active learning or assessment experience.

The same evidence principle applies to both centrally governed PINTAR content and school-created content, while respecting their different ownership.

A human-readable revision/change summary is sufficient for ordinary users; PINTAR does not require a developer-style Git diff UI.

Principle:

Correct forward.
Never rewrite backward.

## T1 — SHARED DEVICE / STUDENT WALKS AWAY

REVISE THE EXISTING 4.0 RULE.

A student session on a shared device must automatically LOCK after a reasonable period of inactivity rather than remain openly accessible for 60 idle minutes.

Locking hides the learner's information but preserves the resumable session.

The same learner can resume the locked session using their PIN.

After a substantially longer period of inactivity, the session may expire and require class card + PIN again.

A clear "Bukan akun Anda?" path must allow another learner to switch safely.

Exact timeout values do not need to be invented in this owner ruling; they may be specified and tested during implementation.

Learning state must be PERSON-BOUND, never device-bound.

No learner may inherit another learner's lesson position or other learning state merely because they use the same computer.

W2 remains a DEFECT and must be treated separately from this product ruling.

## T2 — UJI CEPAT QUESTION SELECTION

REVISE/CLARIFY THE 4.0 EXPERIENCE.

Uji Cepat does NOT require teachers to author new questions during the rapid classroom flow.

Instead, the intended experience is:

Teacher opens Uji Cepat
→ chooses the relevant question bank/topic
→ sees available authorised questions
→ tick, tick, tick, tick, tick
→ reviews the selected questions
→ Publish/Launch
→ students answer
→ teacher immediately understands the result.

The teacher controls which questions are selected.

Questions come from the existing authorised question bank/content available to that teacher.

Finding/filtering/selecting questions must support the defining Uji Cepat experience: an extremely fast formative check, approximately the original one-minute intent.

After submission, M5 governs question-level result visibility.

Creating or generating brand-new questions inside the Uji Cepat flow is NOT required for PINTAR 4.0.

Principle:

Choose
→ tick tick tick
→ review
→ publish
→ understand.

## T3 — MANAGEMENT AND EDUCATOR TRAINING

KEEP/CLARIFY THE EXISTING 4.0 MODEL.

Management has visibility and oversight of educator training.

The authorised facilitator/education role performs the normal educator enrolment/learning-assignment operation.

A person who legitimately holds both authorised roles may naturally perform both functions.

PINTAR 4.0 does NOT require a second parallel training-assignment mechanism solely so that a management role can directly perform the facilitator's operation.

Principle:

Management oversees.
The authorised learning role operates.

## T4 — STUDENT PROFILE PHOTO, ID CARD AND CERTIFICATE

AUTHORITATIVE OWNER RULING:

Student profile:
YES — may contain the student's profile photo.

PINTAR student ID/class card:
NO student photo.

PINTAR certificate:
NO student photo.

A profile photo is user-controlled/profile information. It is not formal certificate evidence and is not required on the PINTAR card.

This ruling supersedes any earlier product idea or requirement that a student's profile photo should appear on a PINTAR certificate.

A student's choice of profile image must never alter the identity/evidence meaning of a PINTAR card or certificate.
