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

## Addendum, 12:55 UTC: S-1 built, PASS

**What I reviewed:**
- `b4132d12` to `c1e78e44ca213f11920ee49a70758b10e66f4a70`. I read the new migration 20270120230000, `tempatAtauTolak` and `kembaliPemeliharaan`, as well as Second Eye's handover.
- The suite as Second Eye reports it: fresh database, full build, 1224 passed and 0 failed.
- The head `31443ff0` adds only D8 evidence.

**What holds:**
- **S-1 is fixed, and it fails closed.** `cakupanBaris` is gone, and all three actions read through controller-only functions: `pemeliharaan_jendela_tempat`, and the new `pemeliharaan_pengumuman_tempat`.
- **The new notice read** uses `withdraw_notice`'s own rule (`maintenance_may_act`). An unknown id and someone else's notice are refused alike. It is read only, authenticated-only, and registered STAFF.
- **`tempatAtauTolak` refuses NOT_ALLOWED before any write** in three cases: an rpc error, no row, or a place with neither a platform nor a valid school. It refuses by `kembaliPemeliharaan`, which is typed `never`, a redirect. No path falls through to the write.
- **The evidence is end to end:**
  - A2B-S1A posts the three server actions against the running build, the way a browser without script would.
  - **Red on the old build,** the plant: working in Alpha, a controller of both schools could act on Beta's window and notice.
  - **Green on the new one:** refused in Alpha with nothing written, and allowed in Beta.
- **The static rule** (F22-P05 part 6): no app read of a table the session cannot select, and every `.from` must name its table literally. Its plants were caught, and S1G holds it to the catalogue both ways.
- **A2B-R2's exceptions meet my condition:**
  - each names its file and line and carries "A2B-R2, C2w";
  - each is held to that exact read, so a change or a move fails.
  - `konteks-server.ts:160` is the root, A2B-R3, which is on my Z list.
- **Daisy's items** (BL-1, BL-2, C-4 to C-6) are hers to judge.
  - One security-adjacent point: C-6 changes `KonfirmasiBahaya`, a shared component, through two optional props. Every other use is unchanged, A2a's emergency lift included. That rests on the green suite.
