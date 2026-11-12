# PINTAR 4.1 · THE PLAN · Addendum 1

> **OWNER APPROVED — EFFECTIVE — 12 NOVEMBER 2026.** The owner approved this addendum as submitted at commit
> `0e3c63e11540a004fbb5183c1486378301e7a9f7` on `claude/bob-41-master-plan` (07:30 UTC, when recorded). It is effective
> under the owner-approved THE PLAN, subject to the owner's five conditions:
>
> 1. THE PLAN remains byte-identical. This addendum governs only the specific additions, deviations and execution
>    rulings it records.
> 2. The A2a/A2b split is confirmed, incorporating all three of Sharon's conditions (§5a). Her nine scenarios, the
>    existing integrity guarantees and the final acceptance requirements are preserved.
> 3. The staging checkpoint is approved for planning only. Its hosted verification requirements, particularly
>    `pg_cron`'s transaction behaviour, must be addressed before A2a. The readiness evidence and the proposed promotion
>    boundary are brought for separate authorization. **No staging action is authorized by this approval.**
> 4. The stacked-verification safeguards and the existing review standards remain in force.
> 5. B2 and the approved corrections continue without interruption. The provider evaluation's preparation proceeds
>    under the existing no-cost authorization.
>
> **What the approval covers:** the document as it stood at `0e3c63e11540a004fbb5183c1486378301e7a9f7`. The commit
> that records this approval changes only this header and the record in §8. **§5c was added after submission and is
> not part of the approved content:** it notes one question that is still undecided and will be brought to the owner
> separately.
>
> No additional process or scope is introduced beyond what is approved. Not authorized: any pull request, merge,
> staging promotion or production deployment.
>
> **THE PLAN is unchanged.** `THE-PLAN.md`, owner approved at `17cf4a7e59ce7a8f11dd976e2c198ea08977e1ef`, stays
> byte-identical and remains the plan. This addendum records what has been added to it, where execution departs from
> its text and by whose ruling, and the owner's rulings of 12 November on its execution. **Where this addendum and
> THE PLAN differ, this addendum governs, and only on the points it names.**

## 1 · Where execution stands

| | State | Commit on `claude/system-integrity-4.0` |
|---|---|---|
| B0, A1, C1w | Closed | `3a190dbfaad5ed71484ae8fc91a1fe4608cf5345` |
| B1 | Closed | `1fc719b5127313bf24084695fa30d7505e15b5d1` |
| L-1 (suspended sign-in) | Closed | `916d12c01345816afcf567b40131e72b9857cf65` |
| F-1 (corrected answers read by the key in force) | Closed | `bc67f72a0e1c6bc39a2c16292f728080b12710d4` |
| B2 | Open for build | — |

Nothing is merged, promoted or deployed.

## 2 · The sequence, as it now stands

```
B1 ✔ ─► L-1 ✔ ─► F-1 ✔ ─► B2 ─► [staging checkpoint, if authorized] ─► A2a ─► A2b ─► C2w ─► A3 ─► C3w ─► Z
                           └ small corrections, around B2 and before the checkpoint: S-1, L1-F4, F1-R1b, L1-F2
E (provider evaluation): preparation running alongside from 12 November
```

The order of THE PLAN §3 is unchanged. What is added: the corrections, the checkpoint, and the split of A2.

## 3 · Corrections added to 4.1

Each is a defect in existing behaviour found while executing the plan. None adds a capability. Each has its own
brief, which holds its design, tests and rulings.

| Id | What it corrects | Ruling | Brief | State |
|---|---|---|---|---|
| **F-1** | After a key correction, derived views still marked answers by the original key | Mandatory before C1w's promotion (owner, 11 Nov) | `C1W-F1-CORRECTION.md` | Closed |
| **L-1** | A suspended or closed account's sign-in answered "service unavailable", disclosing its state; a recovery grant could set a password on a locked account | Approved (owner, 11 Nov) | `AUTH-SUSPENDED-SIGNIN-CORRECTION.md` | Closed |
| **S-1** | The open phone drawer wider than the screen | Approved (owner, 11 Nov) | on the work branch | Built; Daisy verifies with B2 |
| **L1-F2** | A person suspended before having an account could be given an unlocked one | Option B (owner, 12 Nov) | `SUSPENSION-COVERS-NEW-ACCOUNTS.md` | Released; takes L1-R2 |
| **L1-F4** | An anonymised person could be re-attached | Approved; a certificate newly earned is recorded, not issued (owner, 12 Nov) | `ANONYMISED-PERSON-IS-TERMINAL.md` | Built; not accepted until its two-connection race test passes |
| **F1-R1b** | A key correction left stale explanations on the corrected revision | Option A; INV-03 amended narrowly, option A1 (owner, 12 Nov) | `C1W-KEY-CORRECTION-CLEARS-STALE-EXPLANATIONS.md` | Built; in pre-flight |

**Register (non-blocking; each done before Z):** B1-R1 to R5 (in B2); L1-R1 (show "PIN reset required" at
reinstatement); L1-R2 (with L1-F2); F1-R2 («kunci diperbaiki» where Question Health shows a corrected item).

**Carried to later versions, not 4.1:** whether distractor uptake's key flag follows a corrected key (a catalogue
question, with the 4.5 item-statistics work); school-facing notices of unrecorded accountability events (needs an
attribution mechanism).

## 4 · Where execution departs from THE PLAN's text

| THE PLAN | What holds instead | By whose ruling |
|---|---|---|
| §5.1 D: the event's `institution_id`, one school | `institution_ids`, a snapshot computed in the database; a print belongs to the school that owns the printed resource; a school admin's reader returns only the caller's own school | Sharon (pre-build and result reviews of B1); Chief Architect |
| §5.1 D invariant 1: rows are insert-only | One governed exception: personal-data deletion clears the network origin and the identifier hash | Sharon |
| §5.2 D and F: the print's school; the default browser line naming the viewer | A learner's own-results print belongs to the schools whose evidence is on the printout (owner, 12 Nov). The default line names no person and marks the device's clock | Owner; Sharon; Daisy's wording |
| §5.2: the completeness of the accountability reader | The platform admin's reader carries a qualified notice when unrecorded events are detected (B1-R4) | Owner, 11 Nov |
| §5.3 H: "A2's shared multi-connection helper" | Built once, in L1-F2, and used by L1-F4, A2a and A3 | Chief Architect |
| §5.3 and §5.5: two enumeration tests | One enumeration of everything that writes a sitting, built in A2a with the attributes both batches need, extended in A3 | Chief Architect |
| §5.4 G.1: C2w's preconditions | Add: F1-R1b closed. The page states how a reviewer's note written before a key correction is shown, and uses a term distinct from the "no recorded misconception" marker | Chief Architect; Sharon's note of 12 Nov |
| §5.5 D7, D10: recovery after a reinstatement | The teacher's resume of a suspension-held Uji Penguasaan sitting carries the recovery authorization: one act | Chief Architect; for Sharon's and Daisy's review on A3's page |
| §8.5: five integrated journeys | A sixth, an account's life (suspend, neutral sign-in, reinstate, close, delete, never re-attach). Journey 3 gains a sitting on the corrected revision and the rewriting of withdrawn explanations | Owner, 12 Nov (supported) |
| `docs/rebuild/03-PINTAR-INVARIANTS.md`, INV-03 | Amended narrowly in the repository, with ADR-0025; the repository is the baseline of record (ADR-0019) | Owner, 12 Nov |

## 5 · The owner's rulings of 12 November 2026 on execution

| # | Ruling | What it means in practice |
|---|---|---|
| **M-A** | **Approved.** Begin the provider evaluation's no-cost preparation | The terms, licensing, data-handling and evaluation requirements are prepared now. **No spending, credential, network access or provider data transfer is authorized.** The requirements for the educator judges are brought to the owner to nominate them |
| **M-B** | **Approved for planning.** One staging checkpoint after B2 and the accepted open corrections, before A2 | Prepared: migration reconciliation, hosted Auth, the scheduler, restore and preservation verification. **The readiness evidence and the proposed boundary are brought to the owner before any staging action. This does not authorize promotion** |
| **M-C** | **Approved in principle.** A2 is built and reviewed as **A2a** (class scope, the emergency stop at class scope, and all of §5.3 D6) and **A2b** (D2, D3, D4, D8) | Existing designs and sequence preserved. **Subject to Sharon confirming** that the split weakens neither her nine scenarios, nor the cross-batch invariants, nor final acceptance. **Sharon confirmed (12 Nov): the split is safe under three conditions (§5a); no material conflict** |
| **M-D** | **Approved.** This addendum | THE PLAN byte-identical; this document effective only on approval |
| **Stacked verification** | **Approved with safeguards** | Up to three genuinely independent small corrections may share one full pre-flight, CI and journeys run on the exact combined candidate. Each keeps its own commit, red-first evidence, impact assessment and review. The combined candidate must be green before any is accepted. On a failure, isolate and re-run. **Never for a batch or for coupled corrections** |
| **§3 and §5 of the reassessment** | May proceed under existing authority | A short design review by Sharon before any correction is built; the impact analysis reads constraints and invariants; shared test infrastructure; the C2w handling; the account-lifecycle journey |
| **Proportion** | Keep the process proportionate | No new document, review cycle or gate unless it demonstrably improves correctness, reliability or efficiency |

## 5a · The split of A2: Sharon's confirmation and its three conditions

All nine of her scenarios fall in A2a (they test D6, and D1 and D7's class scope; none depends on D2, D3, D4 or D8).
Nothing in A2b must land with A2a. Final acceptance is unaffected if both land before Z.

1. **A2a owns every path that ends an emergency.** D3's "resume early" is the existing
   `change_maintenance(…, 'AKHIRI', …)`. If that path can end an EMERGENCY window today, then in A2a it goes through
   D6's fenced lift. A2b's "extend" and "resume early" then apply to PLANNED windows only, and refuse an EMERGENCY one
   or route it to the fenced lift. *Test in A2a:* every function that sets `ended_at` on an EMERGENCY window takes the
   fence; it joins D6.2's enumeration of writers.
2. **A2a updates the status read for class scope.** `pintar_status_saya`'s look-ahead includes class-scoped windows
   in A2a, so a class-scoped planned window still warns its learners; only the time-zone formatting (D8) waits for
   A2b. Between A2a and A2b a class-scoped planned window behaves as a school window does today, which is no
   regression.
3. **A2b lands before A3.** A3 needs only A2a, but D4 and A3 change the same start path. (If A2b ever came after A3,
   its page would re-run A3's writer enumeration and the lock-order lint, and place D4's refusal inside A3's start
   discipline.) The sequence of §2 already has A2b before A3.

**Acceptance splits along the same line, with no wording of THE PLAN §5.3 I changed.** A2a accepts C8: the emergency
at class, school and platform scope, and the journey "stop one class during Uji Penguasaan, lift it, and the class
finishes with the time it had". A2b completes C7 and "every time shown in the school's zone".

## 5b · The staging checkpoint (M-B): what is to be proven on hosted staging before A2a

**Planning only. No staging action is authorized.** Sharon's list; items 1 to 3 are what A2a depends on directly, and
items 4 to 6 protect work already built.

| # | To prove | Why |
|---|---|---|
| 1 | **The scheduler.** `pg_cron` installed on the hosted project (today: available, not installed); the shared installer's jobs exist once each; they run in UTC as the expected role; **a job may `CALL` a procedure that commits between batches;** the health read reports no job missing or different | A2a's D6.6 turns the closer into such a procedure, and transaction control inside a procedure called by `pg_cron` depends on how the hosted service runs its jobs |
| 2 | **Locks and timeouts under hosted roles.** A transaction-level advisory lock taken through the API and the pooler holds as expected; the hosted per-role `statement_timeout` and `lock_timeout` leave room for the stop's activation, marking and release | The emergency fence is a transaction-level lock |
| 3 | **Auth with a locked account.** The far-future lock is honoured: sign-in and token refresh refused, `user_banned` returned for each method, an admin password write still refused by the permit check. Triggers on `auth.users` are permitted, and Auth's own inserts and updates still succeed with them | L-1; L1-F2's two guards. Done with one synthetic account |
| 4 | **Writes to the `auth` schema** by the migration owner: `auth.users`, `auth.identities`, `auth.audit_log_entries`; deleting sessions, refresh tokens and one-time tokens | Personal-data deletion |
| 5 | **Restore.** A hosted restore brings back the accountability tables and the jobs, or the native-restore runbook step reinstalls them, and the health read is then clean. The time `audit_log`'s generated-column rewrite takes is measured, to size the maintenance window | B1 |
| 6 | **Headers.** `x-real-ip` arrives on the hosted deployment, so B1's network origin is filled; the request hook adds no measurable delay beyond D1's budget | B1; A2a |

**Also at the checkpoint:** migration reconciliation (staging at 224; every migration from there to the boundary
applied in order) and the preservation counts, by the protected process.

**The proposed boundary,** to be confirmed with readiness evidence when B2 closes: B0, A1, C1w, B1, B2, and the
corrections F-1, L-1, S-1, L1-F2, L1-F4 and F1-R1b, each accepted.

**Chief Architect's note on item 1.** If the hosted `pg_cron` cannot run a procedure that commits between batches,
A2a's D6.6 needs a different shape for the closer. That is the single most valuable thing the checkpoint can tell us
before A2a is built, and it is the strongest argument for holding the checkpoint before A2a and not at Z.

## 5c · One question raised since this addendum was submitted — **DECIDED by the owner, 12 Nov 2026 (§5d)**

*The text of this section is kept as it was put. Its last paragraph, "brought to the owner as a decision once Sharon
has given her view", is superseded: the owner ruled directly, and Sharon's and the engineer's work is now a
precondition of implementation, not of the decision.*

**What a class-scoped PLANNED window stops.** THE PLAN §5.3 D1 says a class window "affects a person" enrolled in or
teaching that class, and the existing block refuses every request of an affected person. Daisy's answer (12 Nov):
a school would not expect that. Planned maintenance on 7A would lock a teacher out of 7B, stop a 7A learner's
elective elsewhere, and, for a teacher at two schools, let school X's planned maintenance stop work at school Y.
For an **emergency**, holding everything of the affected person is right and is unchanged.

Her recommendation: planned maintenance governs the class's work; an emergency stops the person. Whether "the class's
work" can be enforced is Sharon's and the engineer's question. **This is brought to the owner as a decision once
Sharon has given her view on enforcement,** because it changes what THE PLAN §5.3 D1 says and it reaches across
schools. It concerns A2b and does not hold A2a's design, B2 or the checkpoint.

## 5d · Rulings recorded after approval (each by the owner; the approved content above is unchanged)

### R-1 · Planned maintenance is work-scoped; emergency containment stays person-level (owner, 12 Nov 2026)

**The ruling.**
- **PLANNED maintenance is work-scoped, not person-scoped.** A scheduled window for class 7A must not automatically
  prevent the same teacher or learner from using unaffected classes, including classes at another school.
- **EMERGENCY containment retains the approved person-level behaviour and all existing integrity protections.**
- **Before the planned-maintenance change is implemented,** Sharon and Second Eye establish that the scope can be
  enforced consistently across all relevant operations, **including cross-context and background writes.**
- **If any operation cannot be safely scoped,** the specific issue and the options are brought to the owner.
  **Emergency containment is not weakened, and no unprotected write path is introduced.**
- Daisy's proposed screen language is the UX direction, subject to the normal review.

**What it changes.** THE PLAN §5.3 D1 says a class-scoped window "affects a person" enrolled in or teaching that
class. For a PLANNED window that sentence no longer holds: the window governs the class's work. For an EMERGENCY it
holds unchanged, and so does all of D6.

**Where it lands.**

| Batch | Requirement |
|---|---|
| **A2a** | Unchanged in design. Class scope for the **emergency** is person-level, as approved. One addition: A2a's class-scope work must not make a class-scoped PLANNED window person-level in the interval before A2b (Sharon's condition 2 of §5a said such a window "behaves as a school window does today"). **Sharon and the engineer state, in the feasibility work below, how a class-scoped planned window behaves between A2a and A2b so that this ruling is not broken in that interval;** if it cannot be kept, class-scoped PLANNED windows are not offered until A2b |
| **A2b** | Carries the ruling: the reach of a class-scoped planned window, the start refusal (D4) and the T−15 block applied to that class's work, the warnings (D8) to that class's people, with Daisy's wording as the direction |

**The feasibility work (before any implementation; Sharon and Second Eye).** For a class-scoped PLANNED window,
establish for **every** operation whether it can be scoped to the class's work and how:
1. the request-level block (`pintar_permintaan.periksa`, `maintenance_affects`, `maintenance_block_for_me`): today it
   refuses every request of an affected person; a work-scoped window cannot use it as it stands;
2. starting work: `start_learning_session`, `may_start_assessment`, the sitting-insert trigger of the T−15 block, D4;
3. a running sitting of that class: the drain (`maintenance_draining`, D5), unchanged in principle;
4. staff acts on that class's work: assigning, extending, ending, moving an assignment, a key correction's move of
   assignments;
5. **cross-context writes:** a person in the class acting in another class or another school; a platform admin; a
   teacher of two classes of which one is in the window;
6. **background writes:** the scheduled closer, finalization, the purge, any job that touches that class's sittings
   during the window;
7. the status read and the warnings: who is warned, and that nobody outside the class's work is told they are
   affected;
8. school-scoped and platform-scoped PLANNED windows: whether "work-scoped" changes anything for them (a
   school-scoped window at school X and a teacher who also works at school Y is the same question one level up).

Each operation is recorded as: scoped, and how; not applicable; or **cannot be safely scoped**, with the reason and
the options. The last kind comes to the owner.

**Wording (Daisy, 12 Nov; the direction, subject to normal review).** Her record:
`docs/coordination/ux/completion-4.1/I6-I7-JAWABAN.md` on `ux-1/daisy-experience` at
`e48c49063e3a52d657e305ed5892f1a638ec5afb`.
- Warning: «Pemeliharaan terjadwal untuk kelas 7A mulai pukul {jam} {zona}. Kelas Anda yang lain tidak terpengaruh.»
- During the window, on that class's pages: «Kelas 7A sedang dalam pemeliharaan terjadwal sampai pukul {jam} {zona}.
  Alasan: {alasan}. Kelas Anda yang lain dapat dipakai seperti biasa.»
- On another class: nothing.

**Sharon's view (12 Nov, given on the question before she had read this ruling):**
- **A class-scoped planned window can be enforced soundly on the class's work alone.** Her detailed answer to the
  eight points, with the engineer's, is still to be written down before A2b is implemented.
- **A2a builds class scope for EMERGENCY only. Class-scoped PLANNED windows arrive in A2b, under the work-level
  rule.** This settles the interval question in the A2a row above: it is no longer "if it cannot be kept"; class-scoped
  planned windows are not offered until A2b. It also refines her condition 2 of §5a: A2a's status read covers
  class-scoped **emergency** windows; class-scoped planned windows and their warnings are A2b's.
- **A pre-existing defect she found, outside class scope:** a **school-scoped** planned window already stops a
  person at two schools from their other school's work. It is 4.0 behaviour, not something 4.1 introduced.

**Put to the owner (12 Nov):** the ruling's first sentence, "PLANNED maintenance is work-scoped, not person-scoped",
is general, and its example names "classes at another school". The Chief Architect reads it as covering a
school-scoped planned window too, so that A2b corrects school scope by the same work-level rule. Because that changes
existing 4.0 behaviour beyond the class scope the question was asked about, the owner is asked to confirm that
reading, or to accept the current reach of school-scoped windows for now. Until confirmed, A2b's feasibility work
covers both and builds neither.

**Owner (12 Nov, later): the interim safeguard is agreed.** A2a must not expose class-scoped planned maintenance
with person-level consequences; if it cannot be enforced correctly yet, that specific functionality is deferred to
A2b. This confirms the A2a row above. *The question of school-scoped planned windows (option A or B) has not been
answered and remains with the owner.*

**Sharon's answer to the eight operations (12 Nov; read at `e7723882e73079632442fb5d1e62d140da10eabf`, against the
code at `b21bec621a449e8d4d90ed646f7fb09c15dfc6f9`). The engineer's inventory confirms or corrects it before A2b is
built.**

**All eight can be scoped safely; none goes to the owner as "cannot be safely scoped".** The principle: for a
work-scoped window the refusal moves from the request (the person) to **the writers of that work** (the object),
enforced by table triggers that ask one place-level question, so that no write path to the class's work is left
unguarded. EMERGENCY is untouched: person-level in the hook, with D6 in full.

**The one shared piece:** `maintenance_affects_place(node, at)`: true when an active (or, for starts, approaching)
PLANNED window scopes this node or an ancestor at school or class level. A sitting's place is its class or cohort
node; an assignment's is its node; lesson progress takes its assignment's.

| # | Operation | Her answer |
|---|---|---|
| 1 | The request-level block | **Scoped, by removal.** The hook keeps its person-level refusal only for EMERGENCY at any scope and for PLANNED at platform scope. Class- and school-scoped PLANNED windows are not checked in the hook, because a request does not declare whose work it touches. Reads of the class's pages stay allowed, with Daisy's banner; the page says so |
| 2 | Starting work | **Scoped.** The sitting-insert trigger (the T−15 block) asks the place question for the new sitting's place, and D4 asks it in the same trigger, so every start path is covered, including any added later. `may_start_assessment` gives the same answer for the screen. Lesson progress on the class's assignments is refused by a trigger asking the same question |
| 3 | A running sitting | **Not applicable as a block.** Work-scoped windows do not block requests, so a running sitting continues to its deadline plus grace (D5). The per-person drain remains only on the person-level paths of row 1 |
| 4 | Staff acts on the class's work | **Scoped, each classed on A2b's page.** *Refused* during the window: assigning, changing an assignment's schedule, A1's extend and resume, A1's teacher endings, `akhiri_penugasan`. *Allowed*, because they decide nothing about work in the window: departure and transfer; a key correction's move of assignments (it changes only new starts, which are blocked anyway); certificate acts. Window controllers keep their exemption. **Completeness: the place question joins A2a's D6.2 writer-enumeration test,** so every writer of sittings, assignments or progress is classed as guarded by place or declared allowed |
| 5 | Cross-context writes | **Scoped by construction.** The guard is per object: a person in 7A acting in 7B or at another school is untouched; a teacher of two classes is refused only on 7A's work |
| 6 | Background writes | **Unaffected, which is correct for PLANNED windows.** The closer, finalization and the purge make no requests; D5 relies on that. No background job may start new work on the class; there is none, and the enumeration test keeps it so |
| 7 | The status read and warnings | **Scoped.** The window is returned only to people who have work in that place, naming the class. It must not raise PT503 for these windows, and the client must not send anyone to the pause page for them: the banner only |
| 8 | School- and platform-scoped PLANNED windows | **School scope: the same, one level up;** it covers that school's work, and a teacher who also works elsewhere is untouched there, which removes the pre-existing defect. **Platform scope: person-level remains correct,** because all work is in scope and the two coincide |

**Between A2a and A2b:** `schedule_maintenance` refuses a class node unless the kind is EMERGENCY. *Test in A2a:*
that refusal, and an emergency at class scope still accepted and still person-level. School-scoped planned windows
stay as they are today until A2b.

**Superseded by her:** her condition 2 of §5a ("A2a updates the status read for class scope") now applies to
class-scoped EMERGENCY windows only.

**Chief Architect's notes.**
- Her row 8 shows that correcting school scope is the same mechanism and no extra design. It is still a change to
  existing 4.0 behaviour, and so is still the owner's to confirm (option A or B, above).
- Row 1 is the one that needs care in the build: a planned class window stops **writes** to the class's work and
  leaves **reads** open. That is the right reading of "the class's work is under maintenance", and Daisy's banner
  must make it plain.

### R-2 · Terminology (owner, 12 Nov 2026: Daisy's I-6 accepted under her existing design authority)

- **C2w's reviewer notes:** «Catatan peninjau» / «Reviewer note».
- **F1-R1b's missing misconception code:** «belum dikaitkan dengan pemahaman keliru» / «not linked to a
  misconception».
- «anotasi» / «annotation» never appears on a screen. F1-R1b never uses «catat», «catatan» or «tercatat»; C2w never
  uses «kaitkan» or «terkait». Both batches' pages carry this.

## 6 · Dependencies that now hold

- **Promotion:** B1 not ahead of L-1 (met). C1w not ahead of F-1 (met) nor of F1-R1b. L1-F4 not accepted before its
  race test. No account on staging is suspended or closed until L-1 is promoted.
- **Build:** C2w after F1-R1b. A2a carries class scope, so A2b follows it. A3 after A2a (the fence and the lock
  order). C3w after the evaluation's report, the owner's choice of provider, the limits and network egress
  (unchanged from THE PLAN §5.6 G).
- **Corrections found from here on** are triaged at the batch boundary: into the batch if they are the batch's own;
  as a boundary correction with a short design review first; or onto the register for before Z. They are expected,
  not exceptional.

## 7 · What does not change

The scope of 4.1 and what is outside it; every design in THE PLAN §5 not named in §4 above; the rules of §4 and the
pre-flight of §4.1; the acceptance framework of §8 other than the journeys named; exact-commit reviews; the standing
principle. **Not authorized by THE PLAN or by this addendum:** any pull request, merge, staging promotion, production
deployment or production database change.

## 8 · Record

| Date | Entry |
|---|---|
| 12 Nov 2026 (07:26 UTC) | Drafted after the owner's rulings on the reassessment (`PLAN-REASSESSMENT-2026-11-12.md`). Not effective |
| 12 Nov 2026 (07:29 UTC) | Sharon confirmed the split of A2 with three conditions (§5a) and listed the hosted behaviours for the checkpoint (§5b). Submitted to the owner for approval |
| 12 Nov 2026 (07:29 UTC) | §5c added: the reach of a class-scoped planned window, raised by Daisy; with Sharon for her view before it is put to the owner |
| 12 Nov 2026 (07:30 UTC) | **Owner approved; effective.** Approved as submitted at `0e3c63e11540a004fbb5183c1486378301e7a9f7`, with five conditions recorded in the header. §5c is outside the approved content |
| 12 Nov 2026 (07:32 UTC) | Owner's ruling R-1 recorded (§5d): planned maintenance is work-scoped; emergency containment unchanged; feasibility by Sharon and the engineer before implementation. R-2: Daisy's two terms accepted |
| 12 Nov 2026 (07:33 UTC) | Sharon: work-level enforcement is sound; A2a carries class scope for the emergency only, class-scoped planned windows arrive in A2b. Pre-existing defect recorded: a school-scoped planned window stops a two-school person at the other school. Reading of R-1 put to the owner |
| 12 Nov 2026 (07:36 UTC) | Owner agreed the interim safeguard for A2a. The school-scoped question remains open. Owner's rulings on the provider preparation recorded in `C3-EVALUATION-PREPARATION.md` §6a |
| 12 Nov 2026 (07:37 UTC) | Sharon's answer to the eight operations recorded: all can be scoped safely, by moving the refusal from the request to the writers of the work. The engineer's inventory is still owed before A2b |
