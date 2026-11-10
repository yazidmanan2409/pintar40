# A1 · Sitting control: completion page

**Lane A. Effort M. Review before build: Sharon and Daisy.** Status: reviewed once; open points listed under «Pre-build review: outcome». No code yet.

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

## Pre-build review: outcome (11 Nov)

One review each, at `2560494a`. Daisy: `docs/coordination/ux/completion-4.1/TINJAUAN-A1-C1W.md` (branch `ux-1/daisy-experience`, `a2420446`). Sharon: her addendum response of 11 Nov, and her first reading at `3370643a`.

**Settled, and now part of this page:**

| Point | From | Decision |
|---|---|---|
| The independent approver of another attempt | Sharon | A holder of CAN_REVIEW_INTEGRITY over the sitting's place. Never the requester, never the learner, and never a SYSTEM_ADMIN on an academic sitting |
| A frozen sitting (blocker) | Sharon | Frozen is its own recorded state on the sitting, not `PAUSED`. `tangguhkan_akun` writes it in the same transaction as the suspension, with the remaining time. The abandoned-sitting job and `session_enforce_deadline` skip it. Resume sets the deadline to now plus the stored remaining time |
| The learner's notices (A1-B1, blocker) | Daisy | Three notices, each with its own key, told apart by the refusal code: ended and scored; ended and not counted; the assignment ended (the 4.0 notice, unchanged). The 4.0 «tidak dinilai» notice is never shown for a scored ending |
| Where the list sits | Daisy | On `/mengajar/[kelas]/siapa`, with a choice of instrument. One «Atur» link per row opens a panel; an act that cannot apply is absent. «Ubah jadwal» is on the class page's material row |
| The two endings | Daisy | No default. «Dinilai» uses an attempt; «Tidak dihitung» gives no result and uses none. Wording as in her review |
| A frozen sitting, to the teacher | Daisy | The neutral «Ditahan», never «ditangguhkan». After reinstatement: «Lanjutkan» with exactly the preserved time, or «Akhiri tanpa menghitung». «Lanjutkan» stays offered if the window closed meanwhile |
| Another attempt, to the learner | Daisy | Nothing while waiting; never «ditolak»; after approval, the chapter's «Mulai» returns |
| States to add | Daisy | Her seven: attempts used up; a request waiting, approved or declined; a granted attempt not yet started; an act that raced the learner; a Professional Development class; a window changed before anyone started; more than one sitting for one learner |

**Open before build:**
- Sharon's first reading at `3370643a`: A1 blockers 1 (name the sitting capability) and 2 (a scored teacher ending is a submission). Her text is not yet in this record.
- **The owner's ruling:** how an abandoned sitting is scored (Sharon's A1 blocker 3).

Non-blocking points are in `EXECUTION-PLAN.md` §5.

## Questions

**For Sharon:**
1. How an abandoned sitting ends without a learner request. Proposal: a database job (`pg_cron`) every few minutes, plus the existing lazy check. Is a scheduled, service-level writer acceptable at this boundary, given A3 will require every writer to respect the single-writer controller?
2. *(Ruled by the owner; see above.)* The remaining design point: which role is the independent approver for another attempt. Proposal: the school admin, or the head of department over that class; never the requester.
3. *(Ruled by the owner; see above.)* The remaining design point: the abandoned-sitting job must skip a frozen sitting.

**For Daisy:**
4. Where the sitting list sits on the class's assessment page, and the wording of the two ways to end a sitting.
5. What the learner sees when time is added or the sitting is ended while the player is open.
