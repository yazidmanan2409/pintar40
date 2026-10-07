# PINTAR 4.1 intake · Device handoff, and Exam Mode device binding (7 Oct)

**Status: preserved for 4.1; D-125 approved (7 Oct). Nothing here is built in 4.0.** No migration and no code before a focused architecture investigation is run against the frozen 4.0 implementation, threat-modelled and red-cased.

## 1. The requests (Dr Gladys, relayed by Yazid)

They reached the record through the Second Eye's assessment of 7 Oct. **Yazid attaches Dr Gladys's own words here when convenient**; until then, this is the requirement as relayed, not verbatim.

1. **Normal handoff, device A → device B.** The person moves their work to device B. Device A locks itself automatically for privacy. Later, A unlocks with the PIN and reconciles with whatever moved on while B had it.
2. **Exam Mode.**
   - Ordinary handoff is prohibited.
   - The attempt is bound to its controlling device.
   - If that device genuinely fails, an authorised, audited recovery moves control to another device.

## 2. The Second Eye's preliminary verdict (7 Oct)

**Architecturally compatible with 4.0: GREEN. A medium-sized 4.1 package, not an architectural rebuild.**

| 4.1 capability | Effort | Risk | Why |
|---|---|---|---|
| Normal handoff A → B | Medium | Medium | Cross-device orchestration is new; session, PIN-lock and durable-state foundations exist |
| Automatic privacy lock on A | Small–Medium | Low–Medium | The server-enforced shared-device PIN lock is highly reusable |
| PIN unlock on A, with reconciliation | Small–Medium | Medium | PIN resume exists; reconciling with state advanced on B is new |
| Exam Mode: handoff prohibited | Small | Low | A hard policy, enforced on the server, not a hidden button |
| Exam Mode device binding | Medium | Medium | The active attempt bound to its controlling device and session, robustly |
| Exceptional failed-device recovery | Medium–Large | High | Authorization, state transfer, audit, concurrency and failure cases must be watertight. **Its own design and proof gate** |

**Two principles from the verdict:**
- **One authoritative server state.** For example, A cannot continue merely because its browser missed the event that B completed the handoff. And a handoff B never completes leaves A usable.
- **Privacy locking and exam binding are separate concepts.** They may share infrastructure, but not the model:
  - privacy locking protects an abandoned device from another person;
  - exam binding protects an assessment from simultaneous or unauthorised control.

  A later change to privacy locking must never be able to weaken assessment integrity.

**Exam binding:** something like an attempt controller with a generation, or epoch. Recovery moves control from A at generation 7 to B at generation 8, and writes carrying generation 7 are refused, so a revived A cannot also control the attempt. A superficial device-id check is not enough.

## 3. What 4.0 has today

The coordinator read the 4.0 code to check the verdict's foundations, on 7 Oct, main `53058f5`. Read, not walked.

| Foundation | In 4.0 | Where |
|---|---|---|
| Server-enforced session lock | **Yes.** A shared computer's session locks after 5 idle minutes. It is refused at the data boundary (PostgREST pre-request, 423), not merely covered, and the person's PIN reopens it. Three wrong PINs end the session; 60 minutes locked ends it | `device_sessions` (mode, `locked_at`, `failures`, `ended_reason`); 20261117100000; BOB29-A01..A03 |
| Per-device session identity | **Yes.** One row per Auth session. «Keluar dari semua perangkat» ends this computer's sessions and the others'. A credential change ends every session of the person (D-101, D-102) | `device_sessions`; `sesi_akhiri_orang` |
| Durable assessment and learning state | **Yes.** Answers are saved on the server per question, and a sitting resumes. An answer kept on the device through a network drop goes through when the network returns (J6.8). Lesson progress continues on another device: walk S21e, STU-J19 | `record_answer`, `resume_session`, `lesson_progress` |
| Audit and integrity | **Yes.** The audit log, and integrity signals (VISIBILITY_CHANGE, NAVIGATION, RECONNECT, RAPID_OPTION_CHANGE, SUBMISSION_ANOMALY) with the referral and decision queue | `audit_log`, `integrity_signals`, `management_decisions` |
| A PIN for the person | **Yes.** Staff and class cards both have one | `person_pins` |

**Two facts the 4.1 investigation starts from:**

1. **An attempt is bound to the person, never to a device.**
   - `start_learning_session`, `record_answer`, `submit_response`, `resume_session` and `finish_my_session` ask who the person is. None of them reads the device session.
   - So in 4.0 a learner who signs in on device B already continues the same attempt and lesson there. A is not locked by that; it locks only by its own idle rule or by signing out.
   - Two signed-in devices of one learner can both write answers to one attempt that is in progress.
   - No integrity signal names a second device.
   - **This is the starting point for exam binding**, and a known 4.0 residual (§5).
2. **EXAM already exists as an assessment mode.**
   - It is in the database (`assessment_mode`: … TEST, EXAM, …) and in Studio's definition builder.
   - No 4.0 screen assigns an EXAM assessment to a class (the school-questions handbook draft records this).
   - So "Exam Mode" in 4.1 builds on an existing mode, and its policies (handoff prohibited, device binding, recovery) have to be defined there.

## 4. The investigation, before any 4.1 migration

One focused architecture investigation against the **frozen** 4.0 answers these six questions:
1. What existing 4.0 session state can be reused for ACTIVE → PRIVACY_LOCKED → ACTIVE?
2. What additional durable state identifies a handoff and its source and destination sessions?
3. How does B find the correct durable continuation point without copying A's transient browser state?
4. What authoritative binding prevents a second device from controlling an Exam Mode attempt?
5. How is that binding transferred atomically during an authorised device-failure recovery?
6. What happens under ugly conditions?
   - A offline, or B offline;
   - a replayed QR, or an expired handoff;
   - a simultaneous unlock;
   - a browser restored from sleep;
   - a network partition;
   - B crashing halfway;
   - the old A returning after an exam recovery.

Then threat-model and red-case it before implementation: tests red first, plants for each invariant, and the failure cases as walks. Estimates come from that investigation, not before it. «The QR is the easy part»; equally, nothing here calls for rebuilding authentication.

## 5. 4.0's residual: ACCEPTED (D-125(c), 7 Oct)

**Two signed-in devices of one learner can write to one attempt in progress. This is a known 4.0 limitation, not a closure blocker.**
- There is no 4.0 engineering change and no opportunistic device-id patch.
- 4.1 closes it properly through an authoritative attempt controller with device binding.
- Failed-device EXAM recovery stays a separate high-risk design and proof gate (D-125(d)).

**The every-state-changing-boundary invariant (D-125(e)).** Approved; its wording is pending from Yazid. The coordinator's reading until then:
- every boundary that changes an attempt's state checks the authoritative controller and its generation in the same transaction;
- those boundaries are start, answer, resume, submit, finish, and any recovery or handoff;
- so no path can write as a stale or second device.

The 4.1 investigation (§4) enumerates those boundaries from the frozen 4.0 code and red-cases each one.
