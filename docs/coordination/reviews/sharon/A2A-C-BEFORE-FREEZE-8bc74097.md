# A2a change C · drafts 9 and 10, and the open items before C's freeze

Sharon, 14 Nov 2026 (04:30 UTC). Read-only. **Commits read:**
- commit 9, `2a3695b2473a75eb87ca7e9e068921a659be552e`;
- commit 10, `8bc74097598bec0f2ed94534aa18a33d4f77f0bd`;
- the questions on `claude/a2a` at `46ec0f61d262a6f469533bcb1b0bfa71d79b5db0`.

The code is read against `main` at `0ea4b8ad`.

## What holds now

- **Commit 10: R1, R2 and the release half of C7-1 are right.**
- **The owner's case (a move after `T_stop`, before marking) is NOT covered.** This is BLOCKER C10-1, below.
- **Commit 9 (D6.2 at sitting level): NO BLOCKER,** with C9-1 (first-touch release in the helper) and C9-2 (the assignment-level acts).
- Rulings on (a), (b) and (c), and the hosted reads for after promotion, are below.

## Commit 10

- **R1 is right:** the two codes are inserted into the live `maintenance_refuse`, so every existing line is unchanged.
- **R2 is right:** open EMERGENCY windows get `t_stop = starts_at`.
- **C7-1, release side, is right:**
  - `darurat_jendela_id` is recorded with `darurat_sejak`, with a shape CHECK, and the guard says it is recorded once;
  - `maintenance_affects_pada(w, person, t)` reads memberships, enrolments and roles valid at `t`;
  - `penghentian_geser` starts from the holding window and joins later windows only if they affected the person at their own `T_stop`.
  - Having no foreign key is accepted: no function deletes a window.

**C10-1 · BLOCKER, the owner's case: the hold is decided by the placement at marking, not at `T_stop`.**
- `pengerjaan_tandai_darurat` selects sittings with `orang_dilindungi(person)` and picks the window with `maintenance_affects(w, person)`. **Both are current.**
- **Take the order: the stop takes effect → the learner is moved or transferred → marking runs → the lift.**
  - At marking the learner is not affected, so the sitting is never marked.
  - Between `T_stop` and the move, the hook stopped the learner and every decision on the sitting was refused, yet nothing records that time.
  - After the move, the deadline runs on with that time lost. If it had already passed, the next decider ends the sitting.
- **The same gap exists in the decision path:** `pengerjaan_pagar` reads `pengerjaan_dilindungi`, which is current. A moved learner's sitting that was never marked is decided as unprotected.
- **Required:**
  - **A sitting is protected by window `w` when its person was affected by `w` at `w.t_stop`** (`maintenance_affects_pada(w, person, w.t_stop)`), `w` is in force, and the sitting was open, or EXPIRED inside its grace, at `w.t_stop`.
  - Marking selects and records by that rule.
  - `pengerjaan_dilindungi` answers yes on that rule **or** when the sitting carries a mark whose chain is still in force.
  - The person-level hook and `orang_dilindungi` for access may stay current: who is stopped now is a present fact.
- **A person who joins a stopped class after `T_stop`** (moved in, or a role starting) is stopped by the hook from the join, but was not affected at `T_stop`.
  - Either refuse such a move or role into a class under an EMERGENCY stop, with a designed refusal;
  - or hold from the join instant: the membership's or role's `valid_from`.
  - **My recommendation is to refuse it.** It is smaller and has no time arithmetic. Say which is chosen.
- **The permanent regression test (A2A-K01), with a plant.** On two connections, and with bounded batches where the marking is in procedures:
  1. a class stop takes effect;
  2. the learner is moved to another class, or transferred;
  3. marking runs;
  4. the lift;
  5. release.
  - Expected: the sitting is held from `T_stop` and released with a shift equal to `T_lift − T_stop`.
  - The same with marking interrupted after half the batch.
  - The same with a teacher whose role ends between steps 1 and 3.
  - **The plant:** marking judged by current placement turns it red.
- Could reasonably have been anticipated: yes (Q4). It is C7-1's own shape at its other end, and my C7-1 note named the release only. Caught in development, by the owner's review.

## Commit 9: D6.2 at sitting level

**Verified:**
- `pengerjaan_pagar`: the learner `FOR KEY SHARE`, then the shared fence with a 2 s refusal (`SITTING_FENCE_BUSY`), then protection read as a new statement. That is persons → fence → sittings.
- It is first in the decider, finalize, terminate, the teacher's end, added time, extend, the held-sitting acts, the item view, the learner's gate, the response trigger, `minta_percobaan` and the closer's candidate.
- The decider skips, and the others refuse with `SITTING_CLASS_STOPPED`, as D6.2's table says. The migration's own check asserts all twelve.

**C9-1 · required: first-touch release goes in the helper, not in two of its callers.**
- Only the decider and the gate call `pengerjaan_lepas_darurat`.
- On a sitting whose chain has ended but whose batch has not run, `terminate_session`, `akhiri_pengerjaan`, added time, extend and resume pass the helper as not protected. They then hit the guard's `SITTING_EMERGENCY_HELD`.
- Put `perform public.pengerjaan_lepas_darurat(p_session)` inside `pengerjaan_pagar`, after the fence, when not protected. Every act gets it once. This is C7-2; what it must show is in point 3.

**C9-2 · ruling: the assignment-level acts** (`ubah_jadwal_penugasan`, `akhiri_penugasan`, `tutup_asesmen_terbuka`, the promotion run).
- **Their order may stay:** the assignment or enrolment row, then the learners, then the fence per sitting through the helpers.
  - An unranked row before the shared fence forms a cycle only with a holder of the **exclusive** fence that wants that row.
  - Condition, in A2A-L01: every function that calls `pagar_darurat_eksklusif` locks nothing after it except ranks 7 to 9 (the fence, windows, sittings).
  - With that assertion, the four get one declared B1 exception with that reason.
  - The learners after the fence in a loop are commit 3's same rows, taken first.
- **`ubah_jadwal_penugasan` re-times sittings through `closes_at`, which the sitting guard cannot see.**
  - It refuses with `SITTING_CLASS_STOPPED` while any open sitting of that assignment is protected or held, read under the shared fence.
  - Test: rescheduling an assignment whose class is stopped is refused, and the sittings' effective deadlines are unchanged.

## 2 · The three questions on the page

**(a) The shared fence, then `FOR UPDATE` or `DELETE` on the acting admin's person.**
- `stop_pintar_now` takes the admin `KEY SHARE` and then the exclusive fence. A deadlock needs a shared-fence holder that then takes `FOR UPDATE` or `DELETE` on that person.
- A2A-L01's rank rule reports any lock on persons (rank 1) after the fence (rank 7), foreign keys counted.
- **So the proof is A2A-L01 green, plus an assertion that no declared exception covers persons, `account_requests`, `person_suspensions`, `auth.users` or accounts after the fence.**
- Second Eye's two-connection test is accepted: the stop by admin X, against D6.5's fenced suspension hold of X. The suspension takes X `FOR UPDATE` before its fence, by required change 3, so the stop waits on X first. Keep the plant, the suspension taking X after its fence.

**(b) `T_stop` and `T_lift` in every decision:**
- **Protection:** `orang_dilindungi` and `pengerjaan_dilindungi` read `t_stop is not null and ended_at is null`. That is correct, with C10-1's rule added.
- **The shift:** `penghentian_geser` uses `t_stop`, and `t_lift` falling back to `ended_at`.
- **Marking:** the holding window's `t_stop`. B3's grace is judged at `t_stop`. Correct.
- **Required with the lift**, which is not built yet:
  - `t_lift = clock_timestamp()` under the exclusive fence, written with `ended_at`;
  - a CHECK: an EMERGENCY window with `t_stop` and `ended_at` has `t_lift`. Then the `ended_at` fallback serves only windows made before A2a.
  - The only `now()` left is `starts_at`, which readers use. No time arithmetic uses it.

**(c) Privileges: the reasoning is accepted.**
- A procedure that commits cannot be `security definer`, so it runs as the job's owner. The six routines are revoked from `anon`, `authenticated` and `service_role`, and asserted.
- `service_role` has `bypassrls` and table grants, but it is not superuser. The `assessment_sessions` triggers are mode O, so they fire for it. It cannot set `session_replication_role`.
- **One note, not a blocker:** the guard's release branch accepts any write that clears `darurat_sejak` without moving a deadline earlier. A direct table write by `service_role` could release a hold with no shift. Only the server key can, and that key already bypasses RLS. For the register: release only under a transaction marker set by `pengerjaan_lepas_darurat`, as `pintar.anonimkan_email` does.

**The hosted reads, after promotion, read-only, as a stop condition.** Bob runs them on staging:
1. `select jobid, jobname, username, command, active from cron.job where command ilike '%darurat%' or command ilike '%tutup_terjadwal%';`
   - expected: each job active, `username = postgres`, `command` a `call public.…` of the procedure.
2. `select p.proname, pg_get_userbyid(p.proowner) from pg_proc p where p.proname in ('pengerjaan_tandai_darurat','pengerjaan_lepas_darurat_semua','pengerjaan_tutup_terjadwal');`
   - expected: owner `postgres`, the same as the job's `username`.
3. `select jobid, status, return_message, start_time from cron.job_run_details where jobid in (<ids from 1>) order by start_time desc limit 10;`
   - expected: `succeeded` with `CALL`, after the promotion.
4. Privileges:
   `select p.proname, has_function_privilege('anon',p.oid,'execute'), has_function_privilege('authenticated',p.oid,'execute'), has_function_privilege('service_role',p.oid,'execute') from pg_proc p where p.pronamespace='public'::regnamespace and p.proname in ('orang_dilindungi','pengerjaan_dilindungi','penghentian_geser','pengerjaan_lepas_darurat','pengerjaan_tandai_darurat','pengerjaan_lepas_darurat_semua','maintenance_affects_pada','pagar_darurat_eksklusif','pagar_darurat_bersama','pengerjaan_pagar');`
   - expected: all false.
5. `select proname, proconfig from pg_proc where proname in ('pagar_darurat_eksklusif','pagar_darurat_bersama');`
   - expected: `lock_timeout=1500ms` and `lock_timeout=2s`.
6. `select tgname, tgenabled from pg_trigger where tgrelid='public.assessment_sessions'::regclass and not tgisinternal order by 1;`
   - expected: every trigger `O`.
7. `select rolname, rolsuper, rolbypassrls from pg_roles where rolname in ('service_role','authenticated','anon','postgres');`
   - expected: no superuser except `postgres` (hosted, false as well).
   - And `select has_parameter_privilege('service_role','session_replication_role','SET');`, expected false.
8. `select count(*) from public.maintenance_windows where kind='EMERGENCY' and ended_at is null and t_stop is null;`
   - expected 0.

## 3 · C7-2 and C7-3 before the freeze

**C7-2, first-touch release, must show:**
- `pengerjaan_pagar` releases (C9-1).
- A2a's writer enumeration fails on a writer of a sitting's status, deadline or `darurat_*` columns that does not call `pengerjaan_pagar` first.
- **A test:** lift a stop and run no release batch. Then each of these succeeds, with the sitting released first and its shift applied:
  - `terminate_session`, `akhiri_pengerjaan`, added time, extend and resume;
  - ending the enrolment;
  - the learner's gate.
- `SITTING_EMERGENCY_HELD` is never raised for a sitting whose chain has ended.

**C7-3, consistent deadline reads (D6.3's shift test), must show:**
- For every HARUS reader in A2A-T01, a sitting with a shift reads the same effective deadline. Run it once for an own-deadline sitting and once for a window-timed one, after a lift.
- The KLIEN line (`AturPengerjaan`) equals the server's new deadline.
- **The test fails for a HARUS reader it does not cover.** It takes its list from A2A-T01's table, not from its own.
