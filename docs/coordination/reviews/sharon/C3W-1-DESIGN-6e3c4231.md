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

## Addendum · the red cases for D-1 to D-5 and R-3 control 4 (19 Nov 2026, 18:35 UTC)

Read: `docs/completion-4.1/batches/c3w-1-syarat-merah/README.md` on `claude/c3w-1` at `6c10181f` (sha256 `2534c818f54b98b82cff69db51412df42270352b1abec0634133d2d21d84af78`). **PASS on the six cases and the proposed interface, with the three rulings below.**
- **Each case proves its condition, and each plant turns it red:**
  - C3W-D1: the id-only signatures, `service_role` only, no person or school argument, and no client write to the seven tables;
  - D2: the claim at 9 and 11 minutes, and the sweep respecting the mark;
  - D3: every backward move refused by the guard, all writers covered;
  - D4: the A2A-L01 ranks, and the order in all four functions;
  - D5: `PINTAR_AI_STUB_HARNESS=1` only, never `NODE_ENV`, with one reader and one importer;
  - R34: 23514 on a hash beside REFUSED_PERSONAL_DATA, and no text columns.
- **The evidence is local only:** 0/6 on `6153f050`, and the throwaway sketch greens D2, D3 and R34 with every plant caught. That is enough to accept the cases before the build. The names, the columns and ranks 11 to 13 are accepted.

**Rulings:**
1. **D-4: yes, release locks all three rows,** in the same order. Release lowers the held sums that the option's and the platform's ceilings read, so the readers need the same serialisation. One order everywhere is also the simplest rule to check. C3W-D4 stays as written.
2. **D-3: a constant, in one place, tied to the call's timeout by a test.**
   - Use a SQL function, for example `ai_batas_kirim_tanpa_akhir() returns interval`, that the sweep reads.
   - Set it to **the provider call's hard timeout plus 5 minutes.**
   - Add a static test that the call timeout in `src/lib/ai/penyedia.ts` is at least 5 minutes under it, so the two cannot drift.
   - Not a column on `ai_opsi` in 4.1: nothing needs it per option yet. C3w-2 can move it there with a restated case.
3. **The usage reaching settle and reconcile: Bob's proposal is ruled. I decline reading the stub's record.**
   - Reading from the stub ties the service functions to the stub, which is D-5's concern in reverse, and it breaks with a real adapter.
   - **One added argument:** `p_penggunaan jsonb`. Its shape is closed and checked in the function:
     - **exactly** the keys `token_masuk`, `token_keluar`, `biaya_mikro`, each a non-negative integer;
     - optionally `id_penyedia`, a string matching `^[A-Za-z0-9_-]{1,128}$`, kept for D3 provenance;
     - **any other key, any string where a count belongs, or a longer id: refused** with a designed PR220 code.
   - **This is not a widening of D-1.** D-1 forbids identity: a person, a school, a requester. Counts are not identity.
   - **Add a red case,** C3W-D1b: a usage carrying `sekolah`, `pemohon` or a free-text field is refused, and so is a count sent as a string. Its plant is a function that accepts any jsonb.

## Addendum · R-3 control 1 against the DR gates: (b) ruled (21 Nov 2026, 05:35 UTC)

Ruled on Bob's message about `claude/c3w-1` at `a47ed5da` (WIP, not a hand-off). The conflict: control 1's reader owned by `c3w_pembaca` fails DR-D01 and DR-D02 (ownership by `postgres`, and the restore's SET ROLE).

**(b) is ruled, with two tightenings. (a) is not taken,** so nothing goes to the owner and the protected recovery gate is untouched.
- **What (b) is:** `c3w_bahan` is owned by `postgres`, as a SQL-standard body (`BEGIN ATOMIC`). It cannot run dynamic SQL, and `pg_depend` records what it references.
- **Tightening 1 · the dependency allow-list covers functions too, not only tables.**
  - A `BEGIN ATOMIC` body may call another function, and `pg_depend` records only that function, not what it reads. A call to a helper that reads `persons` would pass a table-only check.
  - **The red case asserts that every object `c3w_bahan` depends on is one of the four content tables (or their columns or types), or a `pg_catalog` object.** No other `public` function, view or table is allowed.
  - **Two plants:** a version reading `persons`, and a version calling a `public` helper that reads `persons`. Each must turn the case red.
- **Tightening 2 · `SECURITY INVOKER`, so the teacher's own content rights apply.**
  - `c3w_bahan` runs as the caller, after the route's CAN_DRAFT check on the package. The existing content RLS then decides what the teacher may read.
  - If invoker cannot work, say why before the build. A definer then relies on tightening 1 alone.

**Second Eye's point (1) is rejected: no row policy keyed on a transaction-local setting.**
- **Any role can call `set_config` for a custom setting.** A policy that admits rows by `current_setting('…')` is therefore controlled by the caller: a teacher could set it to another lesson's id and widen their own read.
- Use the caller's existing RLS (invoker), as above. No new policy, and no BYPASSRLS.

**Second Eye's point (2) is accepted: the question count inside `itemSchema` (`minItems` = `maxItems` = the count).**
- The count is not personal data, and the builder's output stays the closed four-key record.
- **R3-07's outbound fixture must deep-compare the schema too,** so only the count lives there and no other field is added.

*Could reasonably have been anticipated* (Q5, who checks): yes. My 13 Nov design chose a NOLOGIN owner without checking it against the restore gates (DR-D01/D02) that every function must pass.

## Addendum · (b) with B1–B4 assessed against the original objective, for the owner (21 Nov 2026, 05:45 UTC)

**Ruling: (b) with B1–B4, plus two changes (B4 extended to production; tightening 2 kept). It meets control 1's objective.**

**The objective (13 Nov):** the excerpt reader can read content only, so that even an edited body cannot read learner data.
- (a) enforced it by refusing at runtime.
- (b) enforces it by refusing at build and promotion: no migration carrying a non-content dependency can pass, and a deployed one is detected.
- **The ends are the same for every path except a privileged change made outside the migration process.**
- **That residual exists under (a) too.** A privileged actor able to edit the function out of process can equally `grant select on persons to c3w_pembaca`. So (a)'s runtime refusal does not stop the one actor (b) cannot stop. **(b) gives up nothing material.**

**The owner's three questions:**
1. **Direct and indirect access: yes.**
   - B2's allow-list admits only the four content tables (and their columns and types) and built-in `pg_catalog` objects.
   - **No view and no user-defined function may appear at all,** so indirection is not merely traced but impossible.
   - B1 closes the one way round it: a string body or plpgsql records no dependencies. The case therefore asserts `prolang = sql` and `prosqlbody is not null`.
   - With tightening 2 (`SECURITY INVOKER`), even a reader that slipped through would see only what the teacher's own RLS allows.
2. **The deployed definition cannot change without the protected verification: yes, within the migration process,** because functions change only by migration through CI and review. **Change:** B4's read-only assertion runs after **every staging and every production promotion,** not staging only, so drift on either is visible. The out-of-process privileged change is the stated residual above.
3. **A deliberately introduced dependency is detected: yes, by B3.** Each of four plants must turn the case red: a direct `persons` read; a read through a view; a call to a `public` helper; and a switch to a string body or plpgsql. The test is proven to fail, not merely seen to pass.

**Unchanged from 05:35:**
- **`SECURITY INVOKER`** (tightening 2), after the route's CAN_DRAFT check;
- **no row policy keyed on a transaction-local setting,** since `set_config` is caller-controlled;
- **the count in `itemSchema` is accepted,** with R3-07 deep-comparing the schema.
