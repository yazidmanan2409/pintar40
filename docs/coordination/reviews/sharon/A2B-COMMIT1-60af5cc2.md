# A2b · early read of product commit 1 · `60af5cc2378dd446cd7ff63e923b348ed4d07551`

Sharon, 16 Nov 2026 (03:25 UTC). Read-only. I read migration `20270120100000` and its restatements. Acknowledged on receipt.

## What holds now

- **NO BLOCKER in the design.** One required change, C1-1: the grants.
- **The notice question: the banner alone for a class window in A2b.** Node-scoped notices go to the register.

## Verified

**K10:**
- A2a's CHECK is dropped in the migration that adds `p_nodes`.
- `schedule_maintenance` refuses `MAINTENANCE_NODE_INVALID` before any constraint: another school's class, a non-class node, or an unknown node.
- The old seven-argument function is dropped and its absence asserted, so there is one writer.

**D3, `perpanjang_pemeliharaan`:**
- The actor `KEY SHARE`, then the window `FOR UPDATE`. No fence, and nothing locked after it.
- EMERGENCY is refused `LIFT_ONLY` first, then `maintenance_controls` is checked.
- An ended window is refused `NOT_OPEN`, by `ended_at`, or by `ends_at <= clock_timestamp()` (K8).
- A later end, in the future, and a reason of 1 to 300 characters are required.
- It audits before, after and reason.
- A notice that ended with the window moves with it.

**A note, not required:** the window row is locked before its kind is checked. An EMERGENCY window is therefore row-locked without the fence, and the call then refuses.
- Nothing is locked after, so it cannot form a cycle.
- Reading the kind first, without a lock, would refuse before taking any lock, which is cleaner.

## C1-1 · required: the grants

- On `main`, `schedule_maintenance` is granted to `authenticated` only (`20261120100000…`, :387).
- This commit grants both `schedule_maintenance` and `perpanjang_pemeliharaan` to **`authenticated, service_role`**. That widens a privilege.
- It is harmless today, because the body refuses a caller with no person. But it is against the rule kept throughout A2a: N1, and the procedures revoked from `service_role`.
- **Required:**
  - grant to `authenticated` only;
  - revoke from `service_role` explicitly, since Supabase's default privileges grant it;
  - assert both in the migration's check.

## The notice for a class window

- `broadcast_notices` is scoped by school, so a notice from a class window would reach the whole school. That is against R-1: planned maintenance is work-scoped.
- **Ruling, for A2b:**
  - a class window has no notice (refused `INPUT_INVALID`, as built);
  - its people learn of it through the banner (`PengingatPemeliharaan`), which reads the status read, and that already names the class.
  - **Daisy decides the wording**, and whether the scheduling form says why the notice box is off for a class.
- **Register:** node-scoped notices, if Daisy wants a notice for a class.
