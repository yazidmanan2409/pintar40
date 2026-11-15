# A2a change C · early read of commit 43 (the O1 refusal audit) · `0ea8ac0ce0f1215684957addb0d8eb21438ec24e`

Sharon, 15 Nov 2026 (22:30 UTC). Read-only. I read `git diff 3def2e9b..0ea8ac0c`. Acknowledged on receipt.

## What holds now

- **NO BLOCKER in the design.** The audit is built as ruled.
- **C41-2 widens, by its sibling sweep:** the stale-mark disjunct `darurat_sejak is not null` appears in **five** places. All five drop it in one change.
- **(a) and (b): agreed.**

## Verified

**`catat_penolakan_henti(p_sasaran, p_kode)`:**
- SECURITY DEFINER; granted to `authenticated` only; registered;
- one row per call, and only while the refusal holds for that caller, checked by the act's own authorisation:
  - `boleh_atas_sesi(CAN_MANAGE_SITTINGS)`, or `boleh_kelola_pengerjaan`;
  - `CAN_ASSIGN_LEARNING` on the node;
  - `boleh_akhiri_penugasan`;
  - `INSTITUTION_ADMIN` over the class;
- it names the stops in force;
- it takes no client text;
- anything else is refused `PR170`.

**The four screens** make the second call once, after the refusal. A failure to record never changes the screen's answer.

**A2A-C720:**
- four rows recorded;
- five calls refused: the learner, the fence code, another code, a teacher's PROMO_STOPPED, and a call after the lift;
- the screens' sources are checked for the call;
- the plant is a forged record.

## C41-2, swept: drop `darurat_sejak is not null` everywhere a refusal, or its record, is decided

**Why:** `pengerjaan_dilindungi` already includes a mark whose chain is still in force. The extra disjunct also matches a **stale** mark: a chain that has ended, before its release batch has run.
- **In a refusal,** that wrongly refuses an act between the lift and the batch. That is C7-2's shape.
- **In the audit,** it would record a refusal that would not have been made. The act itself first-touches the sitting and releases it.

**The five places:**
1. **`kenaikan_tetapkan`:** PROMO_STOPPED's count (commit 14, and my note on it).
2. **`ubah_jadwal_penugasan`:** the reschedule refusal (commit 19, `x.darurat_sejak is not null or pengerjaan_dilindungi(x.id)`).
3. **`catat_penolakan_henti`, the sitting branch:** `dilindungi or (darurat_sejak is not null and open)`.
4. **`catat_penolakan_henti`, the assignment branch:** mirrors the reschedule refusal.
5. **`catat_penolakan_henti`, the promotion branch:** mirrors PROMO_STOPPED's count.

**In each:** `pengerjaan_dilindungi(x.id)` only.

**Test:** lift, no batch, then:
- the promotion applies;
- the reschedule applies;
- `catat_penolakan_henti` refuses `STOP_REFUSAL_NOT_FOUND` for each code.

Add a plant that restores the disjunct.

Could reasonably have been anticipated: yes (rule 3, siblings). My own note on commit 14 began it.

## (a) and (b)

- **(a) The learner's refused answers and hand-ins: not recorded, agreed.**
  - O1's refusals are acts by staff.
  - A learner's answer refused during a stop stays in the offline client's queue and is retried, so recording each call would record retries, not acts.
  - The refusal itself is visible in the access log.
- **(b) The promotion's preview: not recorded, agreed.** It is a review, not an act.

## A note, not a blocker

An authorised staff member can repeat the second call and record the same refusal many times. If wanted: one row per caller, target, code and protecting window. Otherwise, register it.

## Still open for C's freeze

- **C41-1:** B4 and B5 on `t_stop` and `t_lift`.
- **C41-2:** as swept above.
