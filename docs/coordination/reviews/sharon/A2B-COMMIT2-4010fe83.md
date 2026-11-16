# A2b · early read of commit 2, 2a and the test commit; and an A2a finding

Sharon, 16 Nov 2026 (03:50 UTC). Read-only. **Commits read on `claude/a2b`:**
- commit 2, `db3b7746221ec2e995ce357b603f410907308beb`;
- commit 2a, `1e93977b6bad8ec7ccd969a86978c742823b67fd`;
- the test commit, `4010fe838205dc40d878981140b6dd4f446006cc`.

Acknowledged on receipt.

## What holds now

- **NO BLOCKER on A2b's commits.** C1-1 is closed, I02-1 is closed, and the drain assertion is in.
- **M148-D01's restatement is confirmed.**
- **The A2a finding is real, and wider than the drain: D1-2.** Fix it in A2b, as its own small commit. Do not register it.

## Verified

**`maintenance_affects_place(node, at)`:**
- PLANNED and not platform-wide; active at `at`; matched on the node's school;
- for a class window, `node_ids && n.jalur`. A node's `jalur` includes the node itself (`20260912004244…`, :83 and :92), so a class's own work matches;
- no row lock.

**The guards** read `clock_timestamp()`, and are placed after each refused writer's own locks.
- `putuskan_percobaan` guards a grant only.
- `kenaikan_tetapkan` checks every class before it writes.

**The start trigger:** a work-scoped window refuses by PLACE while active, and by NO_NEW_START within T−15, on the clock.

**`maintenance_block_for_me`** skips a work-scoped PLANNED window.

**C1-1 is closed:** both functions are granted to `authenticated` only, `service_role` is revoked, and the migration's check asserts it. The trigger function is revoked under F06-S01.

**I02-1 is closed:** every non-system schema is read except `selftest`, the harness. A second plant sits in a schema of its own.

**K5:** at the place, `block_for_me` is none and `maintenance_draining` is true.

## M148-D01 restated: confirmed

At T=0 a **school** PLANNED window stops no one as a person: the hook, the session check and the status read all pass. A start is refused PLACE, and a learner who has handed in is not stopped afterwards.

That is R-1: planned maintenance is work-scoped for school and class windows, and person-level only when platform-wide. The earlier PT503 throughout was the pre-R-1 rule.

## A note, not required

The start trigger's person-level branch (EMERGENCY, and platform-wide PLANNED) still reads `now()` (`20270120110000…`, :135–137).
- That is today's behaviour, and K1 binds the work-scoped guard.
- **Register it:** align that branch to `clock_timestamp()` too, so a long transaction cannot start a sitting just after a platform window begins.

## D1-2 · required, as its own commit in A2b: a marked sitting's pending release is not in the effective deadline

- **My D1 ruling** put the pending credit into `pengerjaan_tenggat_efektif` for **unmarked** sittings.
- **A marked sitting** whose stop has been lifted, but whose release has not yet run, is no longer protected. `penghentian_kredit` leaves its shift to the release, because the chain begins at the mark.
- So until the first touch or the batch, **every read-only reader shows the unshifted deadline:**
  - `session_state`, the player's countdown;
  - `may_continue_session`;
  - `pengerjaan_saya`;
  - `daftar_pengerjaan`, and through it AturPengerjaan;
  - `maintenance_draining`.
- Under a platform-wide PLANNED window, the hook could then stop that learner with PT503.
- **Writers are not affected:** they pass `pengerjaan_pagar`, which releases first.
- It is a visible error, after every lift, for up to one batch. It is C41-2's shape (a stale mark read as current) and D1's purpose (nobody sees an unshifted deadline). Second Eye found it.
- **Required:**
  - `pengerjaan_tenggat_efektif` adds, for a sitting with `darurat_sejak` whose chain has ended (`penghentian_geser(person, darurat_jendela_id)` not null), that shift, beside the credit before the mark (S1). That is exactly what `pengerjaan_lepas_darurat` would apply.
  - The release persists only what readers already see.
  - **Test:** a marked sitting, the lift, no batch and no touch. `session_state`, `may_continue_session`, `daftar_pengerjaan` and `maintenance_draining` read the shifted deadline. After the release, nothing changes.
  - **A plant:** the marked case removed.
  - **Placement:** its own commit, because it is A2a's area, not A2b's (rule 5's spirit). Second Eye's K5 then asserts the drain before the first touch.
- Could reasonably have been anticipated: yes (Q1). My D1 named the unmarked case only.
