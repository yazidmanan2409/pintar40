# A2a · ruling on A2A-L01's red run on main's code · `f09da528a64adb98ca584bcb653e9f41cff1e1b9`

Sharon, 13 Nov 2026 (20:20 UTC). Read-only. I read the report and the red run on `claude/a2a-change-a`, the page at `d711d4b266c4f1457ee8f70ac6859b299cd4c38c`, and the code on `main` at `a6b47466`.

## What holds now

- **One real deadlock path today: `finalize_session` against the suspension of the same learner.** Fix that one, at its source, in one function.
- **Do not change the 15 functions to `FOR NO KEY UPDATE` now.** It is correct for this class, but it gives up a serialisation that has not yet been shown to be unneeded (point 2). Record it as a candidate.
- **A2a's (C) may be built once the `finalize_session` fix is in.** Without it, A2A-L01 cannot go green, and the fenced finalize sits in the same cycle.

## 1 · The "about 12 possibly real"

**REAL: `finalize_session`.**
- **The suspension, T_s,** takes the learner L's person row `FOR UPDATE`. Then `pengerjaan_tahan_orang` takes L's sittings `FOR UPDATE`: status CREATED, IN_PROGRESS or PAUSED, in id order (`20270114100000…`, :651).
- **The finalize, T_f, on L's sitting S, which is IN_PROGRESS but past its deadline:**
  - `session_enforce_deadline` updates S to EXPIRED, so T_f holds S;
  - the insert into `assessment_results` then checks the result's `person_id`, which is L: a `KEY SHARE` on L. That waits on T_s.
- T_s's scan sees S's committed status, IN_PROGRESS, and waits on T_f. That is a deadlock, 40P01: one act fails and nothing is lost.
- **Under A2a it stays:** the fence is shared on both sides, so it does not separate them.

**OVER-REPORTS, each to be confirmed by Second Eye with one line:**
- **`terminate_session`, `lanjutkan_pengerjaan`, `tutup_pengerjaan_ditahan`.** The `KEY SHARE` is on the ACTOR, through `terminated_by_person_id`, `unfrozen_by_person_id` and `closure_by_person_id`, not on the learner. A suspension of the actor takes the actor's sittings, not S, so the cycle cannot close. This holds only if none of them can act with actor = the sitting's own learner. **Second Eye confirms each one refuses that.** If one cannot, it is real.
- **`open_assessment_session` and `start_learning_session`.** Each takes the person `FOR SHARE` first. The later `KEY SHARE` on persons and on `person_suspensions` comes after the person is held, which serialises it against `aktifkan_kembali_akun`. **Second Eye confirms the first lock is on the same learner.**
- **The six upgrades.**
  - Five are `KEY SHARE` → `FOR SHARE`. Two such transactions cannot deadlock with each other, because `SHARE` and `KEY SHARE` are compatible. In each, the first `KEY SHARE` is `audit_write`'s, or the insert's own.
  - `transfer_execute` goes `KEY SHARE` → `FOR UPDATE`, but its `KEY SHARE` is `audit_write`'s null foreign key (point 4).
  - None is real outside an evaluation session.

**The sweep (rule 3) for the real shape:** a function that writes a sitting whose *committed* status is in the hold's set, then inserts or updates a row whose foreign key is that sitting's learner. **Second Eye lists every such function.** I found `finalize_session` only: the koreksi paths act on FINALIZED sittings, which the hold never takes.

## 2 · `FOR NO KEY UPDATE` for the 15

- **Correct for the class:** `FOR NO KEY UPDATE` conflicts with `FOR SHARE`, with itself and with `FOR UPDATE`, but not with `KEY SHARE`. A person's key never changes, and no person is deleted.
- **What is kept:**
  - L1-F2's designed serialiser: `akun_baru_terkunci` takes the person `FOR SHARE` explicitly (`20270117160000…`, :33).
  - L1-F4's guards: `orang_dianonimkan`, `FOR SHARE`, from the registry, with L1F4-E01.
- **What is lost:** every insert into a table with a foreign key to persons stops waiting for a lifecycle act in progress. That includes the BEBAS (exempt) tables, which have no guard.
  - Today such an insert, made just before the act, makes the act wait for it to commit. So the act's later statements see the row, for example the deletion's scrub of a person's rows.
  - Under `FOR NO KEY UPDATE`, the deletion can finish without seeing a row committed just after its scrub.
  - Whether any lifecycle act depends on seeing those rows is not yet read: hold, scrub, close, reopen, against each BEBAS table.
- **So it is not shown to be behaviour-preserving,** and it changes 15 approved functions. There is a smaller correct fix.
- **The smaller fix:** `finalize_session` takes its learner's person `FOR KEY SHARE` as its first lock, before `session_enforce_deadline` and before A2a's fence. The order becomes persons → fence → sittings.
  - It only moves a wait that already exists to the start of the function. Nothing else changes, and no lifecycle function is touched.
  - Test: two connections, the suspension holding L, then the finalize of S, past its deadline. With the fix the finalize waits and then succeeds. The plant, with the lock removed, gives 40P01.

## 3 · Recommendation to the owner

- **Fix the real path now, inside change A,** as its own commit after the recovery fix, with its two-connection test.
- **Record the `FOR NO KEY UPDATE` class change and defer it.** It is worth taking up only after the BEBAS read above, and only if more real paths appear.
- **(C) can be built safely after that commit.** Without it, nothing is lost (40P01 aborts one side), but A2A-L01 stays red and no freeze is possible.

## 4 · The other categories as declared exceptions: acceptable, each with a condition the test checks

- **`audit_write`'s foreign keys (30).** Accepted, if the test asserts from `pg_proc` that `audit_write` fills `evaluation_actor_person_id` and `evaluation_session_id` only for a persona in an open evaluation session. The page names why no lifecycle act takes a persona's person `FOR UPDATE` while an evaluation session is open, or gives the path that does.
- **Same-row re-locks (about 11).** Accepted one by one, each naming the variable that makes it the same row. Not accepted as a class.
- **A new `auth.users` row (2).** Accepted: no other transaction can see it.
- **The window functions (about 4).** They are re-read after B1 changes `change_maintenance`. The actor's foreign key is the same case as in point 1.

Could reasonably have been anticipated: yes, for `finalize_session` (Q3, locks). A1 added the hold of sittings after the person, and nobody asked who else touches a sitting and then the person.
