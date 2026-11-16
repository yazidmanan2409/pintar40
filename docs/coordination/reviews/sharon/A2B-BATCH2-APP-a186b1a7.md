# A2b batch 2, the app half: verdict

Sharon, 16 Nov 2026 (12:05 UTC). Read-only. **What I reviewed:**
- the app half, `693645b9` to `a186b1a7742274414b5d6d11516453dc38df0f7c`. My early read is `A2B-BATCH2-APP-EARLY-a186b1a7.md`.
- the full suite at that commit, as Second Eye reports it: fresh database, full build, 1219 passed, 0 failed, with one justified CI-only skip.
- `cakupanBaris` in `src/app/konfigurasi/actions.ts`, and the grants on `broadcast_notices`.

## What holds now

- **PASS for the app half.** The database stays the gate on every call.
  - `pemeliharaan_jendela_tempat` is controller-only and has no existence oracle.
  - The extend form and action now read the window's place, end and zone through it. Before, a typed end was read as WIB whatever the school's zone; the D8-6 capture found that, and it is fixed.
  - The three standing rules the suite caught were fixed in `84681d51`.
- **Head `7a079eb2` adds only D8 evidence** ([skip ci]), so the verdict holds for it.

## Finding S-1, a fail-open context check (Bob to rule where it is fixed)

**Second Eye's sibling finding, confirmed:**
- `cakupanBaris` reads `maintenance_windows` and `broadcast_notices` directly. A staff client cannot read either table:
  - `maintenance_windows` has no SELECT for authenticated (K19);
  - `broadcast_notices` has its grants revoked from authenticated (20261120100000:72).
- So the read returns nothing, and `cakupanBaris` answers `{ platform: false, sekolah: [] }`.
- The L3 working-context check (`cakupanDalamKonteks`) then passes, having checked nothing.
- This affects `ubahPemeliharaanAction` («Akhiri sekarang», «Mulai sekarang») and `tarikPengumumanAction`.

**How serious it is:**
- **It is not an authority hole.** The database still authorises every act.
- **But §2.11's context rule is not enforced for these acts:** a staff member working in school A can end school B's window, if they also control B.
- **And F22-P05 gives false assurance,** because the check is present but empty.
- **The defect is a fail-open read:** an empty or failed read must never mean "nothing to check".

**My recommendation:** fix it in batch 2 before A2b's freeze. «Akhiri sekarang» is new in A2b, so A2b is the batch that puts the empty check in front of users. The fix is small:
1. Read through `pemeliharaan_jendela_tempat`, plus an equivalent controller-only read for a notice.
2. **Fail closed:** an error, or no row, refuses the act (MAINTENANCE_NOT_ALLOWED) before any write rpc.
3. **A red-first test** for each of the three actions: a two-school controller, working in school A, is refused for school B's window or notice. The plant (the old direct read) is shown red.
4. **A static rule that sees the gap:** no action may decide context from a direct table read the session's role cannot select. Either extend F22-P05 to say so, or add a sibling rule.

**If Bob rules it out of batch 2,** it becomes a register item with an owner and a batch, and A2b's freeze records the known gap.

**Could reasonably have been anticipated:** yes, by me (Q5, who checks). My early read checked that every call goes through the session client. I did not check whether each read the actions rely on is one that client is allowed to make.

## Addendum, 11:52 UTC: Bob's ruling on S-1

- **S-1 is fixed in batch 2, before the freeze,** on my four points, with F22-P05 restated. No register item.
- **I will read the red-first tests before the fix,** then the fix with a full suite.
- **The static rule must itself be shown red** against `cakupanBaris` as it stands at `a186b1a7`.
