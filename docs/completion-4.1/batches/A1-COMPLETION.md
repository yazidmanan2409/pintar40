# A1 · Sitting control: completion page

**Lane A. Effort M. Review before build: Sharon and Daisy.** Status: awaiting that review. No code yet.

## Why

Verified in the 4.0 code:
- `extend_session_deadline` and `terminate_session` exist, audited, and no screen calls them.
- Attempts are fixed (Pemetaan Awal 1, Uji Penguasaan 2). Nothing grants another.
- A window can only be changed by a raw, unaudited update. No screen.
- A sitting the learner abandons is never closed: there is no scheduler, the deadline is optional, and it is enforced only when the learner next acts. The sitting uses an attempt and has no result.
- A suspension leaves the learner's open sitting open, and restores no time when lifted.

Cross-device recovery (A3) is teacher-authorized. This batch builds the place where the teacher acts.

## Operations

| Operation | Who | Result |
|---|---|---|
| See each learner's sitting for one assessment: not started, open (since when, time left), handed in, ended | the class's teacher | A list on the class's assessment page |
| **Give extra time** to one open sitting | the class's teacher | The deadline moves by a chosen amount, with a reason. Audited. Uses `extend_session_deadline` |
| **End one sitting** | the class's teacher | Asks for confirmation and a reason. The sitting ends; its answers are kept; it is scored on what was answered or not counted, by the rule below. Audited |
| **Request one more attempt** | the class's teacher | With a reason. Nothing is granted yet. Audited |
| **Approve or decline that request** | an independent authorized person, never the requester | On approval the learner may start one more attempt, marked as granted. The earlier sittings and results are untouched. Audited both ways |
| **Change the window** of an assignment | the class's teacher | New open and close times, with a reason. Audited. A sitting already open keeps the deadline it was given |
| An **abandoned sitting** | the system | Ends at its deadline and is scored on what was answered, as a handed-in sitting would be. A sitting with no deadline ends when its assignment's window closes |
| A **suspended learner's** open sitting | the system | Access is frozen at once. Acknowledged answers and the remaining time are preserved. Nothing resumes by itself |
| **Resume or close** a frozen sitting after reinstatement | the class's teacher | Resume: the learner continues with the preserved remaining time, no more. Close: ended as not counted, answers kept. Audited either way |

## Owner rulings (11 Nov)

- **Another attempt at Uji Penguasaan:** the teacher may request it, with a reason. Because mastery can lead to certification, an independent authorized approval is required before it is granted.
- **A suspended learner's sitting:** freeze access immediately; preserve acknowledged answers and remaining time. On reinstatement the teacher resumes or closes it. It never resumes silently and never gains time.

## The rule for an ended sitting (truth, for Sharon)

- Ended **by the teacher** with the learner present and finished: scored on what was answered, counted as an attempt.
- Ended **administratively** (wrong learner, technical failure): not counted as an attempt, no result, answers kept. This is what 4.0 already does when an assignment is ended.
- The teacher chooses one of the two when ending, and the choice is recorded.

## Refused

- Anyone who is not a teacher of that class (the existing `can_on_node` check over the class).
- Extra time on a sitting that has ended. Another attempt while one is open. A requester approving their own request.
- Any change to a recorded answer or to a finished result.
- Professional Development sittings: unchanged in this batch (platform admin only, as ruled in 4.0).

## History kept

Each act writes an audit row: who, when, which sitting, the reason, and before and after. Earlier sittings and results are never altered.

## Screens and states

One new section on the teacher's assessment page for a class, and one confirmation dialog per act. States: nobody has started; some open; all handed in; an act succeeded; an act refused (with why); the learner's side when their sitting was ended or extended (a notice in the player, in the pattern of the closed-sitting notice). Reuses the Collection, the Dialog and the reason field.

## Tests: red before, green after

- Database: each act by the class's teacher succeeds and by another class's teacher is refused. An abandoned sitting past its deadline ends and has a result (red today: stays open). A request for another attempt grants nothing until a different authorized person approves it. A suspended learner's sitting is frozen, does not resume when the suspension lifts, and resumes with exactly its preserved time when the teacher resumes it. A granted attempt leaves earlier results byte-identical.
- App: the list for a class; each act by keyboard; the learner's notice.
- Journey: "a power cut during Uji Penguasaan" completes with no engineer: the teacher ends the sitting as not counted, and the learner starts again.

## Out of this batch

Cross-device recovery and single-writer enforcement (A3). Reopening a finished sitting (never). The handover view after a teacher leaves (4.2).

## Questions

**For Sharon:**
1. How an abandoned sitting ends without a learner request. Proposal: a database job (`pg_cron`) every few minutes, plus the existing lazy check. Is a scheduled, service-level writer acceptable at this boundary, given A3 will require every writer to respect the single-writer controller?
2. *(Ruled by the owner; see above.)* The remaining design point: which role is the independent approver for another attempt. Proposal: the school admin, or the head of department over that class; never the requester.
3. *(Ruled by the owner; see above.)* The remaining design point: the abandoned-sitting job must skip a frozen sitting.

**For Daisy:**
4. Where the sitting list sits on the class's assessment page, and the wording of the two ways to end a sitting.
5. What the learner sees when time is added or the sitting is ended while the player is open.
