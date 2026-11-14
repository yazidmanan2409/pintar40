# A2a change C · early read of drafts 6 to 8

Sharon, 14 Nov 2026 (03:55 UTC). Read-only. **Commits read:**
- commit 6, `8a014fdeea359793a38a19309ad1f1f76a4fecac`;
- commit 7, `3249cce87f55e20c6ff77bbcff3c4ad970842489`;
- commit 8, `c3cbe3c4a5b94d094a1bb2104c5dddd73110b441`, read as commit 7's migration at that commit.

The code is read against `main` at `0ea4b8ad`.

## What holds now

- **Commit 6, the class stop under the fence: NO BLOCKER,** with two required items (R1 and R2).
- **Commit 7, the emergency hold and its shift: BLOCKER, C7-1.**
  - The shift is computed from the person's placement **at release**, not at the stop. A learner moved out of the stopped class during the stop loses the stopped time.
  - Two required items: C7-2 (first-touch release) and C7-3 (the deploy instant).
- **Commit 8, the second stop and bounded privileges: NO BLOCKER.** Its fix to D6.4 is right.

## Commit 6 (`20270119120000`)

**Verified:**
- `node_ids` and its CHECK (EMERGENCY only).
- **Required change 2:** the validation trigger (CLASS nodes of the one school, not platform-wide), and `stop_pintar_now` refusing a bad node first with `MAINTENANCE_NODE_INVALID`.
- **Required change 1:** `maintenance_affects` is node-aware. Learners placed now at a class, and roles scoped at or below one. A school admin, scoped at the school, is not stopped by a class stop, which is right.
- **The activation:**
  - the actor's `KEY SHARE` is taken before the fence (required change 3);
  - three attempts of `pagar_darurat_eksklusif`, each in a subtransaction, catching `lock_not_available`, with 0.1 s between;
  - `T_stop` is `clock_timestamp()` under the fence;
  - the refusal is `MAINTENANCE_STOP_NOT_IN_FORCE`.
  - Worst case 4.7 s plus the work, inside 8 s.
- **The new `stop_pintar_now`** keeps the old checks, insert and audit row. It adds nodes, `t_stop` and attempts. Its grants are re-made as before.

**Required:**
- **R1.** `maintenance_refuse` is re-created, and `MAINTENANCE_NOT_ALLOWED` lost its last clause: "; stopping PINTAR at once by Admin platform alone". Restore it. Every other existing line must be byte-identical; add a check that compares them.
- **R2.** `t_stop` is null on every EMERGENCY window made before this migration, and `orang_dilindungi` and `penghentian_geser` ignore such a window. If one is open at deploy time, nobody is protected by it. The migration must either:
  - backfill `t_stop = starts_at` for open EMERGENCY windows; or
  - refuse to apply while one is open, and say so.
  Choose one, and test it.

## Commit 7 (`20270119130000`, as at commit 8)

**Verified:**
- **D6.5, one held state:** `pengerjaan_ditahan` is yes for either cause, and the two holds are independent facts.
- **The guard:** the hold records only when it began; held means no ending, scoring or re-timing; the release only moves later.
- **`penghentian_geser`'s chain** converges to the latest `T_lift` whatever order the windows come in: each pass strictly raises the end. It returns null while a window in the chain is in force.
- **The shift:**
  - for an own-deadline sitting, `authoritative_deadline` moves by the exact interval;
  - for a window-timed one, `darurat_geser_detik` (rounded up to the second) is added in `pengerjaan_tenggat_efektif`.
  - `T_stop` and `T_lift` only, so marking late changes nothing.
- **Marking and release:** id order, bounded, `SKIP LOCKED`, commit per batch, idempotent. EXPIRED is marked only inside its grace at `T_stop` (B3).
- **Procedures without definer rights or a `SET` clause,** as Postgres requires for transaction control, and revoked from every client and `service_role` (commit 8). The migration checks this.

**C7-1 · BLOCKER: the shift reads the person's placement at release, not at the stop.**
- `penghentian_geser` and `orang_dilindungi` call `maintenance_affects(w, person)`, and that reads **current** memberships and roles: `valid_to is null`, and `now()` against a role's validity.
- Take a learner in 7A, held by a class stop at 10:00. During the stop they are transferred or moved to 7B; A2b classes transfers and departures as allowed. The stop is lifted at 11:00.
  - At release, `maintenance_affects(window, learner)` is false.
  - The window is not in the chain, so `v_akhir = p_sejak` and the shift is **0**.
  - The sitting is released with none of the hour. If its deadline passed during the stop, the next decider ends it.
- That breaks D-1 ("held sittings resume with the time they had"). A teacher whose role ends during the stop is the same case.
- **Required:**
  - Record on the sitting the window that held it (`darurat_jendela_id`, set with `darurat_sejak`).
  - The chain starts from that window, whatever the person's placement is now.
  - Each further window joins the chain if it affected the person **at its own `T_stop`**. Use a form of `maintenance_affects` read as of an instant: memberships valid at that instant, roles valid then.
  - `orang_dilindungi` (protection now) may stay current. Protection is a present fact; the shift is a past one.
- **Test:** a learner held by a class stop, moved to another class during it, then the lift. The shift equals the stop's length. Add the same for a transfer, and for a teacher whose role ends during the stop.
- Could reasonably have been anticipated: yes (Q4, before and after). A past interval was computed from present facts. Caught in development.

**C7-2 · required: first-touch release.**
- A sitting still marked after its chain has ended refuses every status or deadline change: `SITTING_EMERGENCY_HELD` until the release batch runs. That includes a departure (`akhiri_pendaftaran`), `terminate_session`, A1's resume and the decider.
- So a late batch **does** change an outcome, against D6.7.
- **Required:**
  - every writer of a sitting's status or deadline calls `pengerjaan_lepas_darurat(id)` first, after the person and before the sitting, in A2A-L01's order;
  - A2a's writer enumeration fails on one that does not;
  - **test:** lift a stop, run no release batch, then end the learner's enrolment. It succeeds, and the sitting is released with the right shift first.

**C7-3 · required:** the readers of `authoritative_deadline` and `closes_at` outside `pengerjaan_tenggat_efektif` add `darurat_geser_detik`, per A2A-T01's HARUS list. That is D6.3's shift test. It is not in this draft, and I read it when it comes.

## Commit 8

- **The D6.4 fix is right.** A sitting still marked from a lifted stop is released by the rule, then marked again with the new stop's `T_stop`. Overlapping stops chain and stay held.
- **The bounded privileges are right:** the procedures are revoked from `service_role`.
