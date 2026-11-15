# A2a change C · early read of commit 42 (C39-1: the departure at first touch) · `3def2e9bad5a56669c71388e470c0e07979fb713`

Sharon, 15 Nov 2026 (22:10 UTC). Read-only. I read `git diff 759540ef..3def2e9b`. Acknowledged on receipt.

## What holds now

- **NO BLOCKER. C39-1 is closed.**
- **The rename for D6.9's count is accepted.** My ruling on commit 40 allowed either option.
- **The point you asked me to rule on is accepted as built**, with one note, N42-1.
- **Still open for C's freeze:**
  - **C41-1:** B4 and B5 on `t_stop` and `t_lift`, with unequal fixtures and a plant;
  - **C41-2:** PROMO_STOPPED counts `pengerjaan_dilindungi` only;
  - **the refusal audit:** commit 43.

## Verified

**The inner step `pengerjaan_keluar_terapkan`:**
- it takes the learner and the actor `FOR KEY SHARE` in id order, then the shared fence, then the sitting `FOR UPDATE`;
- it terminates the sitting `INSTITUTIONAL_REVOCATION` by the actor, with the reason, after the deadline rule;
- it audits once.

**`pengerjaan_pagar`:**
- its first lock now covers the learner and the actor, in id order;
- when the sitting is not protected, and after the release and the credit, it applies the departure before the caller's act.

**The re-entry mark `pintar.keluar_sedang`:**
- it is transaction-local, honoured only when it equals this sitting's id, and restored at the end;
- an aborted subtransaction reverts it;
- it is set only inside a definer function. No exposed function sets a `pintar.*` setting from client input, and PostgREST cannot set it, which is the same footing as `pintar.anonimkan_email`.

**The rest:** A2A-L01 is green with one same-row line; L03's plant is re-anchored; C702 declares the writer; the batch stays.

## Your point: the termination rolls back with the refused act. Accepted

- What the approved O1 rule protects is the **outcome**: a departed learner's sitting is never scored after the lift.
- A2A-C719 shows that:
  - before any batch, the answer (PR002) and the hand-in (PR003) are refused, and nothing is scored;
  - the next touch that commits terminates the sitting, once, and audits it;
  - the plant, with no first-touch application, scores the sitting.
- A committing path for the learner is not needed. The closer, the decider and the batch each commit it.

**N42-1 · a note, not a blocker:** until a touch commits, a read shows the departed learner's sitting as open, and they may be offered to resume it.
- **The fix:** `pengerjaan_terbuka_saya`, and the learner's list, leave out an unprotected sitting with `darurat_keluar` that is still open. The learner is then not invited to a sitting that will refuse them.
- Daisy decides the wording.

## Other items

- **C718's fixture correction is accepted:** the sibling class's learner and the role backdated, both inside the rolled-back transaction. It is green after a fresh reset.
- **F01-T10 and B1-S01:** they pass on a fresh database, and the failure comes only from reusing one.
  - This is not a product defect. CI's fresh database is the authority.
  - **Register:** make those two suites repeatable on a reused database.
