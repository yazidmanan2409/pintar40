# A3 · Recovery, one writer per sitting

> **DRAFT, design stage. Nothing of the product is built.**
> - Written on the local branch `claude/a3`, from A2b's refrozen candidate
>   `ac25e9b14d51928f6991f8932b3bb572a262c096` (Bob, 16 Nov 22:02, recorded at `635d4cca`).
> - **The branch stays local until the owner grants a push branch for it**, as for C2w. Nothing goes to staging.
> - On the branch so far, both test-only and red first:
>   - `c6a4da20`, A3-R01;
>   - `38505a44`, F37-R02, which is N-5 (registered A3-R1, `0d3f8ec9`).

## What governs it

- **THE PLAN §5.5** (`claude/bob-41-master-plan`): D1–D12, E, F, G (the ordered instructions and the pre-flight
  starting list), H and I.
- **`PLAN-A3-C3W-Z.md` §2** (at `f942eb97`): what changed since THE PLAN was written, the entry conditions (§2.4), and the
  evidence A3-1 to A3-11 (§2.5).
- **Ruling 42** (owner, 16 Nov): the recovery rule in work-scoped windows (decision 2), subject to Sharon, who agrees
  (§4 of her review).
- **Sharon's pre-build review**, `docs/coordination/reviews/sharon/A3-PREBUILD-ac25e9b1.md`
  (`a58eae49e66b22324e25bccde14653194b2545ff`, `claude/gracious-lamport-0m1qjr`). Its conditions are carried below
  as written. **Its ten restated red cases supersede N-4's lost text.**
- **Daisy's design input:** `DESAIN-AWAL-4.1.md` §4 (`ux-1/daisy-experience`), with her neutral forms (O-4). The Exam
  Mode sentence is dropped (O41-9). Daisy answers on the codes and on the same-device screen.

## The touch points, as they stand on `ac25e9b1`

Read from the live function bodies on a fresh reset, not from THE PLAN's `3a190dbf` references.

- **The gate, `pengerjaan_gerbang`.**
  - Called by `record_answer`, `submit_session`, `pause_session` and `resume_session` only.
  - Its order: A2a's fence through `pengerjaan_pagar` (the person `FOR KEY SHARE`, the shared emergency fence, the
    first-touch releases and credits), then a plain read of the sitting, then a **silent return for a caller who is
    not the learner**, then the hold and closure checks.
  - It takes no row lock and checks no controller.
- **Outside the gate:**
  - `start_learning_session`, through `open_assessment_session` (service role);
  - `note_item_view`, which has A2a's fence but not the gate, and writes `presented_item_views`.
  - `finish_my_session` reaches the gate through `submit_session`.
- **No controller and no generation exist.** `assessment_sessions` has no controller column, and `responses` has no
  generation. `sesi_saya()` reads `session_id` from the verified JWT, and only the session-lock functions use it.
- **Which answer counts:** `session_final_responses` takes `DISTINCT ON` the presented item, ordered by `client_seq`
  descending, among the `is_final` rows, from either writer.
- **The writers:** 20 functions write `assessment_sessions` or `responses`, plus 12 triggers (10 on sittings, 2 on
  responses).

| Class | Functions |
|---|---|
| Learner boundaries | `record_answer`, `submit_response` (service role; `record_answer`'s receipt), `pause_session`, `resume_session`, `submit_session`; `open_assessment_session` through the start |
| Service and staff (D5) | `finalize_session`, `terminate_session`, `extend_session_deadline`, `tutup_asesmen_terbuka`, `akhiri_penugasan`, `percobaan_tandai`, `pengerjaan_putus_tenggat`, `akhiri_pengerjaan`, `pengerjaan_tahan_orang`, `lanjutkan_pengerjaan`, `tutup_pengerjaan_ditahan`, `pengerjaan_lepas_darurat`, `pengerjaan_kredit_darurat`, `pengerjaan_keluar_terapkan` |

- **Locks today:**
  - Eight writers take the sitting `FOR UPDATE` in their own bodies: `akhiri_penugasan`, `tutup_asesmen_terbuka`,
    `pengerjaan_putus_tenggat`, `akhiri_pengerjaan`, `pengerjaan_tahan_orang`, and the three emergency appliers.
  - `lanjutkan_pengerjaan` and `tutup_pengerjaan_ditahan` lock through `pengerjaan_ditahan_periksa`; the enumeration
    test confirms which.
  - **Read, then update, with no row lock:** `terminate_session`, `extend_session_deadline` and `finalize_session`
    lock only the person (`FOR KEY SHARE`). `submit_session`, `pause_session`, `resume_session` and
    `percobaan_tandai` lock nothing.

## The lock order (accepted by Sharon, §3, with two conditions)

- **Learner and staff boundaries:** the person `FOR KEY SHARE`, then the emergency fence shared, then the sitting
  `FOR UPDATE`, then the controller check (learner boundaries only), then A1's gate and the boundary's own checks.
  This matches A2A-L01's ranks: persons (1), FENCE (7), `assessment_sessions` (9).
- **The start:** the person, then the fence, then the advisory lock **keyed (person, definition, version)**, then the
  assignment `FOR SHARE`, then the new sitting.
  - The key was (person, assignment). N-5 re-keys it: the count it guards has been per (definition, version, school,
    year) since `20270113140000`.
- **Condition 1:**
  - No lock of a lower rank is taken after the sitting row lock. A1's gate and the controller check only read
    `maintenance_windows` (8), `accounts`, `password_write_permits` and the persons; they never lock them.
  - The advisory key and `assessment_assignments` get their place in A2A-L01's ranks and its committed report.
- **Condition 2, D5's sweep:** `terminate_session`, `extend_session_deadline`, `finalize_session`, `submit_session`,
  `pause_session`, `resume_session` and `percobaan_tandai` each take the sitting `FOR UPDATE` in this order. The
  enumeration test fails on any new writer that does not.

## The codes (D12, PR170; accepted by Sharon, §5, with one condition)

- **The codes:** `SITTING_NOT_CONTROLLER`, `RECOVERY_NOT_AUTHORISED`, `RECOVERY_AUTHORISATION_EXPIRED`,
  `RECOVERY_AUTHORISATION_USED` and `RECOVERY_NOTHING`. The words are Daisy's.
- **No existence oracle:** an unknown sitting id, and a sitting the caller does not control, both answer
  `SITTING_NOT_CONTROLLER`. The other codes come only after that check.
- **Asked of Sharon (16 Nov 22:18), pending her answer.** Recovery is asked by a session that is not the controller, so
  for the recovery act I read "that check" as ownership:
  - an unknown id, another learner's sitting or another school's sitting answers `SITTING_NOT_CONTROLLER`;
  - for the learner's own sitting, `RECOVERY_NOTHING` and the authorisation codes follow;
  - on every other boundary, a non-controller session of the same learner answers `SITTING_NOT_CONTROLLER`.

## Ruling 42, decision 2 (Sharon agrees, §4, with three conditions)

- **The rule:** a recovery of a draining sitting is **allowed** in a work-scoped planned window, and **refused** in a
  platform-wide window and in an emergency. Starting a new sitting stays refused.
- **Its conditions:**
  1. It is read through `maintenance_draining_di(person, window)`, per window and per place, never through the
     person-wide `maintenance_draining`.
  2. A recovery changes nothing that maintenance relies on: no deadline extension, the sitting stays in its place,
     and it is not a new start, so it creates no sitting.
  3. The emergency check is read under the shared fence, so a stop that commits first wins and the recovery is
     refused.

## Entry conditions (`PLAN-A3-C3W-Z.md` §2.4)

| Condition | State |
|---|---|
| A1, A2 (A2a and A2b) and B1 closed | A1, B1 and A2a closed. **A2b refrozen at `ac25e9b1`**; its staging promotion is PENDING OWNER AUTHORISATION |
| N-4: Sharon's ten further red cases | **Met:** restated in her review (`a58eae49` §1); they supersede the lost text |
| N-5: Sharon's verdict on the SI-D02 stronger race | **Met:** F37-R01's stronger form accepted. Its finding, the lock key narrower than the count, is registered A3-R1 (`0d3f8ec9`) and proven red by F37-R02 (`38505a44`) |
| The start path's lock order | **Met:** accepted by Sharon, with the key re-keyed per N-5 |
| Pre-build reviews | **Sharon's: done** (`a58eae49`), with one clarification asked (the codes). **Daisy's: pending**, on the journeys, the words, the codes and the same-device screen |

## The evidence, with Sharon's conditions folded in

Red first on `ac25e9b1`; then green on the build.

| # | Evidence | State |
|---|---|---|
| A3-1 | C1-D125 §5's cases 1, 2, 3, 5, 6, 8, 9 and 10 (case 4 is F37-R01; case 7 is A3-7). **Sharon's ten:** S1 identity from verified claims only, a forged parameter recovering nothing; S2 a client generation ignored, and every superseded-generation write refused (answer, pause, resume, submit); S3 the scored result across generations; S4 `RECOVERY_NOTHING` with nothing written for a FINALIZED, submitted, expired or terminated sitting; S5 the authorisation used once, expiring, bound to its sitting and learner, and no low-stakes self-recovery for an Uji Penguasaan; S6 the deadline, answers and attempt count preserved; S7 recover against submit, recover and an emergency stop's marking, in both orders, one outcome each; S8 ruling 42's legs; S9 who may recover, with an unknown id answering the same code; S10 the audit rows (actor, generations from and to) and the superseded device's stated state in the built app | **A3-R01 red** (`c6a4da20`): cases 1, 2 and 3, a caller with no session id, and B's hand-in. The rest wait for the recovery act's name and Daisy's answer |
| A3-R1 (N-5) | Two OPEN assignments of one definition, two connections. The second start is refused ATTEMPT_LIMIT_REACHED, and the learner holds exactly `attempt_limit` sittings. The structural check asserts that the lock's key names the definition, not the assignment | **F37-R02 red** (`38505a44`): 2 sittings against a limit of 1 |
| A3-2 | The two-connection set on `run.ts`'s race harness: two devices answering at once; finish on A with B in flight; answer while paused from the other device; old A after a recovery; two recoveries at once; a recovery racing a teacher's ending, an extension, the scheduled closer, an emergency hold and the lift; two concurrent first writes claiming an uncontrolled sitting. Each commits by design and leaves no sitting, authorisation or role behind (P3) | Not yet written |
| A3-3 | Every learner boundary refuses a non-controller. **The enumeration test:** every writer of the two tables, triggers included, either checks the controller or is on the service list, and takes the sitting row lock in the order above (Sharon §3, condition 2). **The lock-order lint**, with the advisory key and `assessment_assignments` ranked (condition 1) | Not yet written |
| A3-4 | A recovery leaves every earlier response byte-identical (`value_digest`, `received_at`); the final answer follows (generation, `client_seq`); the scored result asserted (S3) | Not yet written |
| A3-5 | Uji Penguasaan: refused with no authorisation, with an expired one and with a used one; succeeds once with a valid one; bound to sitting and learner (S5) | Not yet written |
| A3-6 | A sitting open at migration time is claimed by its first write (one-time); two concurrent first writes, one claims | Not yet written |
| A3-7 | Ruling 42: allowed for a sitting the window drains; refused for the same learner's sitting in a class the window does not cover, if it is not draining; refused in a platform-wide window and in an emergency, with the emergency read under the shared fence (S8; Sharon §4) | Not yet written |
| A3-8 | The cross-batch checkpoints (THE PLAN §6.6): recovery during an extension; after an emergency lift; of a sitting whose assignment a C1w correction moved | Not yet written |
| A3-9 | `record_answer`'s latency, p50 and p95, under 30 concurrent learners on the seeded world, before and after the row lock (§5.5 J's escalation trigger) | Baseline not yet taken |
| A3-10 | Daisy's screens at 1280, 390 and 320 px, with the keyboard: the three learner screens and the teacher's act | After Daisy's review |
| A3-11 | The journeys: a tablet dies in Pemetaan Awal and the learner continues; a laptop dies in Uji Penguasaan, the teacher allows it, the learner finishes; the old device returns and cannot write | After the build |

## How it is run (THE PLAN §5.5 G, `PLAN-A3-C3W-Z.md` §2.6)

- **Every function in §5.5's table C, and every writer above, is redefined in full** in A3's own migration, never
  patched by text a third time.
- **The planted defects are re-aimed and run against the new bodies before the suite:**
  - the 9 of 178 plant files that touch the sitting surface: `r1-2`, `wp7-a`, `wp7-b`, `wp7-c`, `wp7-d`, `wp7d-5`,
    `wp7-f`, `wp7-g` and `bob35-3`;
  - the five `ci.yml` red-case anchors on `start_learning_session`, `may_start_assessment` and
    `pengerjaan_gerbang`;
  - A2a's and A2b's own plants.
- **The source readers are re-pointed:** A1-K01 and A1-K02, `a1.test.ts`, `aturan.test.ts`, `experience.test.ts`'s
  migration pins, and `run.ts`'s races.
- **The order of commits:**
  1. the red cases (test only);
  2. N-5's re-keying (product), which turns F37-R02 green;
  3. the controller, in THE PLAN §5.5 G3's order (product);
  4. the tests after each, kept in separate commits.

## Open before the build

1. **Sharon:** the clarification on the codes' order for the recovery act.
2. **Daisy:** the journeys and words, the codes' sentences, and the same-device screen (D11, D-2, her O-4 neutral
   forms).
3. **The owner:** a push branch for A3. Until then it stays local.
4. **Bob and the owner:** whether N-5's exposure, latent since `20270113140000`, needs anything beyond A3's fix. It is
   not checked here, and staging and production are outside this work.
