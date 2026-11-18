# A3 · The recovery act and the teacher's authorisation: the proposal the red cases aim at

> **PROPOSAL, orders accepted by Sharon (11:03, recorded in her A3-DIFFS-671175e4.md). Nothing of it is built.** Daisy's
> words for the new code are awaited.
> - On `claude/a3`, after the controller (`fc7a26e5`). The red cases in `selftest/a3.test.ts` (A3-P01 to A3-P09) are
>   written against the names and orders below, and are red because none of it exists yet.
> - Governs: THE PLAN §5.5 D7, D10, D11, D12 and F; owner rulings D-2 and D-3; ruling 42 (decision 2); Sharon's
>   S1 to S11 (A3-COMPLETION.md, A3-1); Daisy's `A3-KODE-PEMULIHAN.md` (`ux-1/daisy-experience`).
> - **Please rule on:** the two names, the order of checks (§2), the request record (§4), and §6's open points.

**Why the row lock carries the permission (Sharon):** every act reads and writes the permission only after it holds
the sitting `FOR UPDATE`. That lock is what makes a permission single-use, and "only the newest counts", hold under
concurrency: two recoveries, or a recovery and a new permission, serialise on the sitting. The permission read never
moves before the lock (A3-E01 checks it; A2A-L01 ranks `pengerjaan_izin_lanjut` after `assessment_sessions`).

## 1 · Three acts, no others

| Act | Who | Signature | Returns |
|---|---|---|---|
| **The learner continues here** | the sitting's learner, signed in on any session | `public.lanjutkan_di_sini(p_session uuid) returns integer` | the new generation |
| **The teacher allows it** (Uji Penguasaan only) | the class's teacher: `CAN_MANAGE_SITTINGS` over the sitting's place (`boleh_atas_sesi`) | `public.izinkan_lanjut(p_session uuid, p_alasan text) returns timestamptz` | when the permission lapses |
| **The learner asks for it** (Sharon §6.3) | the sitting's learner, from a session that is not the controller | `public.minta_izin_lanjut(p_session uuid) returns timestamptz` | when it was asked (unchanged by a repeat) |

- **Neither takes a session, device or generation as a parameter** (D2, D3; S1, S2). The new controller is `sesi_saya()`;
  the new generation is the old one plus one, computed under the row lock.
- Both are `authenticated` boundaries with registry rows, `security definer`, VOLATILE, and both are added to A3-E01's
  declared writers (`lanjutkan_di_sini` as a learner boundary that calls the gate's order but not the gate, §2; the
  permission table's writer as LAYANAN).

## 2 · The learner's act, in order

1. The person `FOR KEY SHARE` and the shared fence, through `pengerjaan_pagar` (a protected sitting: `SITTING_CLASS_STOPPED`).
2. The sitting `FOR UPDATE`.
3. **Ownership first** (Sharon `7fa4de5d`): an unknown id, or a sitting that is not the caller's, answers
   `SITTING_NOT_CONTROLLER`. No other code before this point (no existence oracle; S9).
4. **No session** (`sesi_saya()` null): `SITTING_NOT_CONTROLLER` (S11).
5. **Maintenance and holds** (D10, ruling 42): A2a's emergency hold or A1's hold: `SITTING_FROZEN`. A platform-wide
   planned window: the start's maintenance refusal. A work-scoped planned window **allows** it, read through
   `maintenance_draining_di(person, window)` per place.
6. **The deadline rule runs first** (D10): `pengerjaan_putus_tenggat`. A sitting it ends is not recovered.
7. **Nothing to recover:** a sitting not CREATED, IN_PROGRESS or PAUSED answers `RECOVERY_NOTHING`, writing nothing (S4).
8. **Already the controller:** returns the current generation and writes nothing (idempotent; the player's silent
   re-attempt, D11, lands here).
9. **Uji Penguasaan** (mode `POST_TEST`): needs the newest permission for this sitting and this learner:
   - none: `RECOVERY_NOT_AUTHORISED`, and the request is recorded (§4);
   - past its 10 minutes: `RECOVERY_AUTHORISATION_EXPIRED`;
   - already used: `RECOVERY_AUTHORISATION_USED`;
   - valid: it is consumed, by this session, in this transaction (S5).
   Low-stakes modes (PRE_TEST, QUICK, PRACTICE) need none (D7).
10. **The recovery:** `generasi := generasi + 1`, `pengendali_sesi := sesi_saya()`. Nothing else on the sitting
    changes: no deadline, no status, no attempt (S6; ruling 42 condition 2). The old session's next write is refused
    by the gate (`SITTING_NOT_CONTROLLER`), and any answer it still sends is never final over the new generation's (D8).
11. **The record** (D7; S10): an audit row `assessment_session.recovered` (actor, the sitting, generation from and to,
    who allowed it, or "by the learner after signing in again") and an integrity observation in the RECONNECT category.

## 3 · The teacher's act, in order

1. The person, the fence and the sitting `FOR UPDATE`, as above.
2. **Authority first:** an unknown sitting, or one outside the caller's `CAN_MANAGE_SITTINGS`, answers
   `SITTING_NOT_CONTROLLER` (S9; the same code as an unknown id).
3. A reason of 10 to 300 characters, as A1's acts.
4. **Only an open Uji Penguasaan:** a sitting not CREATED, IN_PROGRESS or PAUSED answers `RECOVERY_NOTHING` (Daisy:
   «Murid ini tidak sedang mengerjakan asesmen ini lagi. Tidak ada yang diizinkan.»). An open **low-stakes** sitting
   is refused with its own code, **`RECOVERY_NOT_NEEDED`**, writing nothing (Sharon §6.2: not a no-op, which would leave
   meaningless rows and hide a wrong target). Daisy's sentence is awaited.
5. A new permission row: the sitting, its learner, the teacher, the reason, `berlaku_sampai = now() + 10 minutes`
   (D-3), unused. A newer permission supersedes an unused older one (only the newest counts).
6. An audit row `assessment_session.recovery_allowed`.

## 3a · The learner's request, `minta_izin_lanjut` (Sharon §6.3)

- The same order as §2: the person and fence, the sitting `FOR UPDATE`, ownership first (`SITTING_NOT_CONTROLLER`),
  a null session refused (`SITTING_NOT_CONTROLLER`).
- Only an **open Uji Penguasaan with no valid permission**, asked by its learner from a session that is **not** the
  controller. Anything else is refused, writing nothing: the controller's own session and an ended sitting
  `RECOVERY_NOTHING`; a low-stakes sitting `RECOVERY_NOT_NEEDED`.
- It sets `lanjut_diminta_pada` once (a repeat leaves it as it was) and grants nothing: the recovery still answers
  `RECOVERY_NOT_AUTHORISED` until a teacher allows it.
- A recovery clears it. The teacher's row shows it only while the sitting is open.

## 4 · The tables

- **`pengerjaan_izin_lanjut`** (the permission): `id`, `session_id`, `person_id` (the learner, bound: S5),
  `diizinkan_oleh`, `alasan`, `dibuat_pada`, `berlaku_sampai`, `dipakai_pada`, `dipakai_generasi`. Written only by
  the two acts; no client role writes it; RLS reads for the teacher's row and the learner's own.
- **The request** (THE PLAN F, Daisy's «minta lanjut» row): `assessment_sessions.lanjut_diminta_pada timestamptz`,
  set only by `minta_izin_lanjut` (§3a), cleared by a recovery. It grants nothing; the teacher's row reads it.

## 5 · What the red cases cover now, and what follows

| Case | Sharon's | Covers |
|---|---|---|
| A3-P01 | S1, S2 | a low-stakes recovery from a second session: the generation rises by one, the controller is the caller's verified session; no parameter can name another |
| A3-P02 | S2 | after it, the old session's answer, pause, resume and hand-in are each refused `SITTING_NOT_CONTROLLER` |
| A3-P03 | S4 | `RECOVERY_NOTHING` for a SUBMITTED, FINALIZED, EXPIRED and TERMINATED sitting, each writing nothing |
| A3-P04 | S5 | an Uji Penguasaan: refused with no permission, with an expired one and with a used one; succeeds once with a valid one. (The request record, §6 question 3, and a permission's binding to one sitting and learner follow once ruled) |
| A3-P05 | S6 | the deadline, the answers (byte-identical), the attempt count and the status are unchanged by a recovery |
| A3-P06 | S9 | an unknown id and another learner's sitting answer the same code; a teacher outside the sitting's place is refused like an unknown id |
| A3-P07 | S11 | a session with no id is refused at both acts |
| A3-P08 | D10 | a held sitting is refused `SITTING_FROZEN`; a sitting past its deadline is ended, not recovered |
| A3-P09 | D7, S10 | the audit row (actor, generations from and to, who allowed) and the RECONNECT observation |
| A3-P10 | S5 binding | a valid permission bound to the same learner's other sitting does not recover this one |
| A3-P11 | S5 supersession | of two permissions the newest alone counts: with it used, the older unused one is not consulted |
| A3-P12 | §6.2 | the class's teacher allowing an open low-stakes sitting: `RECOVERY_NOT_NEEDED`, nothing written |
| A3-P13 | §6.3 | the request's conditions (S9, S11, the controller, an ended sitting), its idempotent mark, that it grants nothing, that a recovery clears it; the three acts' registry rows |
| A3-P14 | S3 | a later generation's answer at a lower client sequence is final over the earlier generation's, and the scored result counts it |
| A3-P15 | S8 | ruling 42's legs: a work-scoped planned window allows a recovery; an emergency stop over the learner refuses it `SITTING_CLASS_STOPPED` |
| A3-P16 | S7 | on real connections: two recoveries from two sessions serialise (generation 3, two audit rows; the plant without both FOR UPDATEs loses one); a recovery waits on a superseding permission and consumes the newest; a recovery racing the teacher's ending answers `RECOVERY_NOTHING` |
| A3-E01 | Sharon | the permission is written by exactly the two acts, each under the sitting `FOR UPDATE`; the two learner acts declared |

**Later, in their own commits:** S3 (the scored result across generations, A3-4); S7 (the races, A3-2), **including a
recovery against a recovery from two sessions, and a recovery against a superseding permission** (Sharon); S8 (ruling
42's legs, with A2b's windows); and the screens (S10's superseded-device state in the built app; Daisy's five).

## 6 · Ruled (Sharon, 11:03)

1. **Already the controller:** return the current generation and write nothing. It sits before step 9, so no permission
   is consumed, and after the hold and the deadline. Accepted.
2. **A teacher allowing a low-stakes sitting:** refused with its own code, `RECOVERY_NOT_NEEDED`, writing nothing (§3).
3. **The request:** a separate `minta_izin_lanjut` (§3a), with Sharon's conditions.
4. **Daisy, still open:** the sentence for `RECOVERY_NOT_NEEDED` (the teacher's side), and whether the request call
   changes anything on the waiting screen.
