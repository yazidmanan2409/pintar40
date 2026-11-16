# A2b · step 1, the boundary tests before any product code · `b95bfe9c57856eddf15ec4cf19593c74c10f56fd`

Sharon, 16 Nov 2026 (03:15 UTC). Read-only. **Branch:** `claude/a2b`, from `main` at `eff99f98`, test-only.

**What I read:**
- `selftest/a2b-batas.test.ts`;
- `selftest/a2b-merah-main.txt`;
- the 13 manifest entries: A2B-I01, and A2B-K01 to K12.

Acknowledged on receipt.

## What holds now

- **CLEARED for A2b's product code.**
- **One required fix before A2b's freeze: K12-1,** in K12's fixture (C41-1's sibling, rule 3).
- **Your two questions are answered below,** and so are the eleven entries marked `baru`.

## Verified

- **The interface the tests fix matches my rulings:**
  - `maintenance_affects_place(node, at)` reads `clock_timestamp()`;
  - the refusal is `PR040 MAINTENANCE_PLACE`, never `PT503`;
  - D4 is `PR110 MAINTENANCE_CANNOT_FINISH`, judged on the new sitting's `authoritative_deadline`;
  - `perpanjang_pemeliharaan` refuses EMERGENCY (`MAINTENANCE_EMERGENCY_LIFT_ONLY`) and an ended window by the clock (`MAINTENANCE_NOT_OPEN`);
  - `schedule_maintenance(…, p_nodes)` refuses `MAINTENANCE_NODE_INVALID` before any constraint, and A2a's CHECK is gone.
- **K1's lock-wait leg** checks a write in a transaction whose `now()` is still before the start. That is the `now()` against `clock_timestamp()` case.
- **K9's two connections** run both orders against the recorder.
- **Each test checks its own fixture first, with no window open,** so a red result is never the fixture's.
- **The red run on `main`:** 11 FAIL for behaviour A2b adds. K4 and K5 PASS by design, because they guard what A2b keeps: T−15 for an untimed start, and the drain.

## K12-1 · required before A2b's freeze

- `jendela()` sets an EMERGENCY window's `t_stop = starts_at` and `t_lift = ended_at` (`a2b-batas.test.ts`, :180–181). That is the shape C41-1 found: a code path that used `starts_at` or `ended_at` would pass K12.
- **Required:**
  - for EMERGENCY, `starts_at = t_stop − 3 s` and `ended_at = t_lift − 2 s`;
  - K12's expected values stated in `t_stop` and `t_lift`;
  - a plant: the shift read from `starts_at` and `ended_at`, which must turn K12 red.
- It does not hold up the build, because A2b's product code does not touch the shift's arithmetic.

## Your two questions

1. **A start refused during an ACTIVE work-scoped window carries `MAINTENANCE_PLACE`.**
   - `MAINTENANCE_NO_NEW_START` stays what it is today: T−15 before a window, which K4 keeps.
   - A work-scoped refusal is the place's, not the person's, and it never redirects.
   - K11 must then assert `MAINTENANCE_PLACE` only.
2. **K12 proving the release at first touch (`pengerjaan_pagar`) is enough.**
   - The batch's release is A2a's own, already proven with commits: A2A-C701, C707 and C711.
   - K12's job is that A2b leaves A2a's rules governing. A2a's regression set staying green covers the batch.
   - No committed two-connection leg is needed.

## The eleven `baru` entries in A2B-I01: classes accepted

| Entry | Class | Why |
|---|---|---|
| `extend_session_deadline` | refused | a staff change to running work, like A1's extend |
| `terminate_session` | refused | a staff ending, like the teacher's early end |
| `tutup_pengerjaan_ditahan` | refused | a staff ending of a held sitting |
| `launch_selected_quick_assessment` | refused | new work, like `launch_quick_assessment` |
| `tegaskan_koreksi_kunci` | allowed | an integrity correction across classes, like `koreksi_kunci_pindah` |
| `tangguhkan_akun` | allowed | a lifecycle act on a person, not the class's work |
| the learner's drain acts | allowed | D5: running work drains to its deadline and grace |
| `platform_schema_lint` | allowed | not a class's work |
