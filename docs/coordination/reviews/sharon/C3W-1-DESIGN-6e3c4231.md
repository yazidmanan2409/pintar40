# C3w-1 · the pre-build design: independent review

Sharon, 18 Nov 2026 (07:00 UTC). Read-only; design only. Nothing is built before A3 closes. C3w-1 makes no call, spends nothing and holds no key.

**What I reviewed:**
- `docs/completion-4.1/batches/C3W-1-DESIGN.md` on `claude/bob-41-master-plan` at `6e3c4231cc4460b952e33c23992fe1de4480588c`, sha256 `91e18c167b1851f93fe133f30baf7ee23f68469908a98dda84f1cc36b14ad4af`;
- my own `C3W-R3-DESIGN.md`.

## What holds now

**The design is accepted as the build's starting page, with five conditions (D-1 to D-5) and my six answers.** R3-01 to R3-07 carry over unchanged, as the design says.

## The five conditions

- **D-1 · The requester and the school come from the verified session, never a parameter (Q5, who checks).**
  - Creating `ai_permintaan`, checking CAN_DRAFT on the package, the entitlement (S-6) and R-3 all run as `authenticated` definer functions, with `current_person_id()`.
  - The service-level functions (`ai_cadangkan`, `ai_selesaikan`, `ai_lepaskan`, `ai_rekonsiliasi`) take **only** a request or attempt id, and read the school and requester from that row.
  - Test: a service call that names another school's request cannot move the first school's sums. This extends C3-5.
- **D-2 · Marking "sending" is a conditional claim (Q3, locks).**
  - The mark is `update ai_percobaan set dikirim_at = now() where id = $1 and keadaan = 'RESERVED' and dikirim_at is null`, committed **before** the network write. **A row count other than 1 means no call.**
  - Without it, the sweep can release a fresh RESERVED attempt while its server is about to send. The provider would then be called on a released reservation.
  - Test: the sweep releases first, so the send makes zero stub calls. This joins C3-4.
- **D-3 · The missing transition: sent, and never ended.**
  - An attempt marked "sending" with no end, older than the call's hard timeout plus 5 minutes, becomes UNRECONCILED at sweep: held, not consumed.
  - Today the design says what happens to a crash before "sending" (released), but not to a crash after it.
  - Each state change is a guarded `update … where keadaan = <expected>`, and the transitions are exactly:
    - RESERVED → RELEASED, only without "sending";
    - RESERVED → SETTLED;
    - RESERVED → UNRECONCILED;
    - UNRECONCILED → SETTLED;
    - UNRECONCILED → RELEASED.

    Nothing leaves SETTLED or RELEASED. A guard trigger enforces it, with a plant.
- **D-4 · Lock the option's row too, in one fixed order.** The option's ceiling (`ai_opsi.plafon_biaya`) is shared by every school on that option, so it has the same read skew as the platform ceiling.
  - **The order, everywhere:** the school's `ai_hak_sekolah` row, then the option's `ai_opsi` row, then the platform row. This applies to reserving, settling (the over-cost stop is written under it), releasing and reconciling.
  - Add the three tables to A2A-L01's ranks, in that order, so the checker holds it.
  - Test: two schools on one option reserve at the option's edge on two real connections, and exactly one reaches the stub.
- **D-5 · The stub must never be reachable where real content lives.**
  - "Selected when no real adapter is configured" means a missing configuration on staging or production would let the stub write fabricated drafts into a school's package, once an operator inserts an entitlement to test.
  - The stub is selectable **only** under the test harness's explicit flag.
  - Anywhere else, a missing adapter refuses with `AI_TIDAK_TERSEDIA`. Test that with the flag absent.

**Also, from R-3 (my control 4, restated, not new):**
- `excerpt_sha256` must be **null** when the outcome is `REFUSED_PERSONAL_DATA`, enforced by a check constraint. A hash of a text that holds a learner's name is that learner's data.
- Say what the "bounded reference" in `ai_permintaan` is. It must carry no excerpt text: a lesson id, or the string `pasted`.

## My six answers (§8)

1. **Fold the per-educator limit into S-1 for 4.1:** a nullable column `batas_per_pendidik` on `ai_hak_sekolah`, where null means the school's limit alone.
   - It is checked under the same school-row lock, with no second lock and no second table.
   - Per-educator overrides need a school-admin screen, which rulings 38 to 41 keep out of 4.1.
2. **Acceptance is an append-only log.**
   - One row per decision, with a `bigserial` id. A guard trigger allows no update or delete, in the pattern of `catatan_peninjau_jaga`.
   - **The current state is the latest row per item.**
   - `langkah_konten` refuses while any generated draft in the package has no row, or has a latest row of DELETED with the draft still present.
   - The decider needs CAN_DRAFT over the package, and goes in `orang_lampiran`.
   - The existing two-person review still applies after this.
3. **Yes, lock the platform row on every reservation that passes the school, with the option row before it (D-4).**
   - Without the lock, two schools can each pass the platform ceiling on a stale sum.
   - The cost is one short transaction per call, which is negligible at this volume.
4. **The values:**
   - an UNRECONCILED hold is flagged after **24 hours**;
   - a RESERVED attempt without "sending" is released after **10 minutes**. D-2 makes any value safe, so this value is only tidiness;
   - "sending" with no end becomes UNRECONCILED after the **hard call timeout plus 5 minutes** (D-3);
   - **retries: at most 2, so 3 attempts per request,** each reserved first. This matches E's bound.
5. **The reconciliation is sound, given D-2 and D-3:**
   - it is operator-run and audited;
   - it moves only UNRECONCILED → SETTLED, at the cost in the provider's record (in C3w-1, the stub's), matched by the attempt's random request id (R-3 control 4);
   - or UNRECONCILED → RELEASED, only when the provider's record shows no such request;
   - never backwards;
   - a settled cost above the reservation sets the platform stop.
   - **Clearing the stop** is a separate operator act with a reason, audited. The stop is never cleared by a reservation path.
6. **Decision 3 is settled by my rule, provided the usability evidence passes.** Ordinary teaching texts get no block, and every fixture list is blocked.
   - That evidence can and must run in C3w-1, since the check is local and needs no provider. Record both rates on the batch's page.
   - **It goes to the owner only if a target cannot be met by tuning the three classes.**

## Could reasonably have been anticipated

These are the questions the design asks of itself, applied to my conditions:
- **D-2 and D-3** (Q4, before and after): the design classes a crash before "sending", but not a race with the sweep or a crash after it.
- **D-4** (Q1, readers and writers): the option's ceiling is a third shared sum, and the design locks only two.
- **D-5** (Q2, the neighbouring act): a missing configuration was read as "always the case in C3w-1", not as a state a later environment can reach.
