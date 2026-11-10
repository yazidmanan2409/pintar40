# C1 · Controlled cross-device assessment recovery: the D-125 investigation (9 Nov 2026)

**Authority:**
- D-125 (7 Oct, `docs/coordination/DECISIONS.md:133`) and its intake
  (`docs/reports/PINTAR-4.1-DEVICE-HANDOFF-AND-EXAM-BINDING-INTAKE-2026-10-07.md`).
- Owner O41-3 (9 Nov): self-recovery for low-stakes assessments; teacher-authorized recovery for Uji Penguasaan;
  stricter Exam Mode; this investigation **before** implementation.

**Status:** evidence gathered from the current code at `53ab41fe`, read-only, every claim cited. It awaits Sharon's
review of the design that follows from it. **No implementation has started.**

## 1 · The main finding

**No boundary that changes an attempt's state knows which device is writing.**
- Every learner-side check is `person_id = current_person_id()` (`session_is_mine`, `may_continue_session`) plus the
  session's status.
- Nothing in the attempt path takes a row or advisory lock.
- `device_sessions` (the shared-computer PIN lock, keyed by the Auth session) is never joined to `assessment_sessions`.

So two signed-in devices of one learner succeed at every learner boundary. This confirms the residual accepted in 4.0
(intake §5; D-125(c)).

## 2 · The boundaries a controller must guard (D-125's invariant: each checks the controller and its generation in the same transaction)

Latest definitions under `supabase/migrations/`:

| Boundary | Function (file:lines) | Today |
|---|---|---|
| Start | `start_learning_session` (`20270111100000`:122-251) → `may_start_assessment` (`20261229100000`:14-68) | the attempt limit is an unlocked `count(*)` (lines 50-55) |
| Open (insert) | `open_assessment_session` (`20270111100000`:1375-1452; service role) | inserts CREATED |
| Answer | `record_answer` (`20261005100000`:114-202) → `may_continue_session` (`20260913090000`:222-245); receipt `submit_response` + `enforce_response_write` (`20261005100000`:46-111) | owner + status (CREATED, IN_PROGRESS, **PAUSED**); key `(presented_item_id, client_seq)`; the client renumbers on PR001 |
| Which answer counts | `session_final_responses` (`20260914094500`:181-192) | highest `client_seq` with `is_final`, from either device |
| Pause / resume | `pause_session` / `resume_session` (`20260913090000`:660-683) | owner + `allows_pause` |
| Re-entry on another device | `src/app/belajar/asesmen/[penugasan]/page.tsx`:40-51 | the latest sitting row for the assignment |
| Submit | `submit_session` (`20260913094000`:109-128) | owner; idempotent |
| Finish | `finish_my_session` (`20261005100000`:258-296) | owner + the finishing device's own manifest (PR006) |
| Finalize | `finalize_session` (`20261129100000`:104-155; service role) | idempotent by result check, not locked |
| Item view | `note_item_view` (`20260913090000`:540-559) | owner |
| Staff | `extend_session_deadline`, `terminate_session` (`20260914094500`:197-271) | capability; read-then-update, unlocked |
| Lock / heartbeat | `sesi_detak`, `sesi_kunci_saya`, `sesi_buka`, the pre-request hook (`20261117100000`; `20261120100000`:193-231) | per Auth session, not per attempt |
| Maintenance | `maintenance_block_for_me` / `maintenance_draining` (`20261120100000`:135-168) | drain per person |

## 3 · Modes (for O41-3's stake levels)

| | Low-stakes self-recovery | Teacher-authorized | Exam Mode, stricter |
|---|---|---|---|
| Modes | PRE_TEST (Pemetaan Awal), QUICK (Uji Cepat), PRACTICE | POST_TEST (Uji Penguasaan; certifies) | EXAM (certifies; identity confirm, cooling; no pause, no offline, attempt limit 1, grace ≤ 60 s) |

**Two facts from the code:**
- `mode_policy.requires_identity_confirm` is not enforced by any boundary.
- **No 4.0 path assigns an EXAM attempt:** `assign_release` makes PRE_TEST/POST_TEST only, and the Uji Cepat launcher
  makes QUICK only.

So Exam Mode in 4.1 also needs an assignment path. That is within the approved C1 scope (D-125(c)), not a new
capability.

## 4 · What the controller can build on

- `assessment_sessions`, whose status allow-list (`session_status_transitions`) can take a recovery or handoff state.
- The pre-request hook every request already passes.
- `device_contexts`, the per-browser cookie hash.
- The receipt key and manifest mechanism.
- The `pg_advisory_xact_lock` pattern used elsewhere.
- The RECONNECT integrity category.

There is no controller, device or generation column today. **Design proposal for Sharon:**
- a `controller_generation` and `controller_device_context` on the sitting;
- every boundary in §2 checks them under `SELECT … FOR UPDATE` on the sitting row;
- a recovery is a new generation, never a second writer.

## 5 · Red cases (to be written red first)

1. Two devices write concurrently: the higher `client_seq` wins regardless of device (the accepted residual).
2. A finishes with its own manifest while B's answers are in flight; B gets PR002 and its answers are lost to the score.
3. A pauses; B keeps answering (PAUSED passes `may_continue_session`).
4. **Double start:** concurrent starts race the unlocked attempt-limit count, giving two live attempts for one
   assignment. **This is a 4.0 integrity question, raised to the System Integrity Gate as candidate SI-D02, to be proven
   by a concurrency test before any change.**
5. Old A returns after a recovery; with no generation, its writes still land.
6. A privacy lock on A does not protect the attempt (PT423 is per Auth session).
7. Maintenance or emergency during a handoff; PT503 blocks any recovery call unless it is exempted.
8. Deadline and grace during a transfer.
9. Concurrent staff extension or termination racing a recovery.
10. Replayed or expired handoff token, simultaneous unlock, B crashing halfway: new-state tests.

## 6 · Effect on the estimate

The investigation confirms the register's size for C1 (10–14 days). The guard must enter **twelve** boundaries, and
Exam Mode needs an assignment path. No new architecture is needed beyond the controller columns and the lock.

Next steps, in order:
1. Sharon reviews the design in §4.
2. Daisy reviews the recovery flows and wording.
3. The red cases are written.
4. Then the build.
