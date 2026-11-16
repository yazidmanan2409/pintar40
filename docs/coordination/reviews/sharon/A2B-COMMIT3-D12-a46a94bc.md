# A2b · early read of commit 3 (D4) and D1-2

Sharon, 16 Nov 2026 (04:10 UTC). Read-only.
- commit 3, `38a4b34f73a59406cfe64d578d2e7f961175f036`, migration `20270120120000`;
- D1-2, `a46a94bc3a704613e34d7b48f1d22e600d693fc2`, migration `20270120130000`.

Acknowledged on receipt.

## What holds now

- **NO BLOCKER on either.**
- **D1-2 is closed.**
- **The two sibling readers: yes, change them as proposed (D1-3).** One commit, with a test and a plant.

## Commit 3 (D4)

**`maintenance_mulai_tolak(person, node, deadline)`, on `clock_timestamp()`, in this order:**
1. the place is active: PLACE;
2. a PLANNED window within T−15: NO_NEW_START, as today;
3. the new sitting's own `authoritative_deadline` after a coming window's start: `MAINTENANCE_CANNOT_FINISH`, with the window's start in the hint;
4. an untimed sitting, with no deadline, meets T−15 only (K4).

**Where it applies:** platform-wide windows, and the work's school or class through `jalur`.
- The sitting-insert trigger and `may_start_assessment` give the same answer.
- The node is the learner's own placement under the assignment's node.

## D1-2: closed

**What it does:**
- `pengerjaan_tenggat_efektif` adds, for a marked sitting not held by A1, `penghentian_geser(person, darurat_jendela_id)`;
- that is zero while the stop is in force and zero after the release, which is exactly what the release writes.

**A2B-D12:**
- a sitting marked by a 45-minute stop, lifted, with no batch and no touch;
- `efektif`, `session_state`, `pengerjaan_saya` and `daftar_pengerjaan` read +900 s; `may_continue_session` is OK, and `maintenance_draining` is true;
- the release changes nothing a reader shows;
- the plant fails it, and K5 asserts the drain before the first touch.

## D1-3 · the two siblings: yes, as proposed

- `pengerjaan_saya` shows the learner `ditahan: true`, and `pengerjaan_terbuka_saya` leaves the sitting out, between the lift and the first touch. Both read a stale mark through `pengerjaan_ditahan(s)`.
- **In those two read-only readers:** held means (A1-frozen and not unfrozen) **or** `pengerjaan_dilindungi(s.id)`. That is C41-2's rule.
- **The decider keeps `pengerjaan_ditahan`,** because it touches first.
- **Test:** in D12's fixture, both readers show the sitting as open and offered. Add a plant.
- **Sweep once more,** under rule 3: any other stable reader of `pengerjaan_ditahan`, listed in the commit.

## Addendum (04:25 UTC): commit 4, the status read (`8509224a34526914dd712e880c56d13ba67d8acf`). NO BLOCKER

**`pintar_status_saya` gives each window:**
- `cakupan`: ORANG for an EMERGENCY or a platform-wide PLANNED window, and TEMPAT for a class or school PLANNED window. Only ORANG redirects.
- `kelas` and `kelas_lain` for a class window of either kind;
- `sekolah`;
- `zona`.

**The listing is unchanged** (`maintenance_affects`), so a work-scoped window reaches only the people with work in its place. A2B-S01 shows it: 7B's learner does not see 7A's window.

**`zona_saya(person)`:**
- the zone of the person's active enrolment's school, else their active role's, else Asia/Jakarta;
- internal, and revoked from every role.

**Your question: "the active enrolment, else the active role" is the right reading for a platform window.**
- D8 asks for each reader's own school's zone. A person at two schools is shown the zone of their latest enrolment: one zone, which is clear.
- **Register it:** a person whose schools lie in two zones, if Daisy wants both shown.

## Addendum (04:35 UTC): D1-3 at `41b5042811366c77950029930e55a291d299a6d7`. Closed

**The learner's read-only readers now read held as (A1-frozen and not unfrozen) or `pengerjaan_dilindungi`.** The decider keeps `pengerjaan_ditahan`, because it touches first.

**The sweep found three stable callers:**
- `pengerjaan_saya`: fixed;
- `pengerjaan_terbuka_saya`: fixed;
- **`pengerjaan_dilepas_henti`,** the "released from the stop" notice: a third reader I did not name. **Fixing it in the same commit is confirmed.**
  - It is the same defect: a stale mark read as current.
  - It now counts the pending release (D1-2), so the notice shows before the first touch, as THE PLAN's item 3 means.

**A2B-D13** shows each reader before any touch, with a plant.

**The catalogue has no stable caller of `pengerjaan_ditahan` left.** Assert that permanently in D13, so a later read-only reader cannot reintroduce it.

## Addendum (05:05 UTC): the database parts up to `8e1471952c00120e5b6dc89f0538995aed16ace8`. NO BLOCKER

- **`23bb8d8e`:** the status read gives `kelas_id`, a class window's own node ids. The banner can then stay off another class's pages. It reveals nothing beyond the reader's own window.
- **`1aad80ad` and `8e147195` (commit 3's orientation defect):**
  - `maintenance_mulai_tolak` returns `(kode, mulai, cakupan, jendela)` and asks `maintenance_affects_place` first. It is internal and revoked from every role.
  - `assessment_orientation` returns its row when `may_start` is ok, or when the refusal is one of the three maintenance codes. They are judged last, so another refusal still hides it.
  - Its grants are kept exactly as on `main` and asserted.
  - A2B-I01 caught the first version's inlined place lookup, and the commit corrects it. **That is the inventory doing its job.**
- **The tests:**
  - K13 is R-A: NO_NEW_START at T−1 min and PLACE at T+1 s; another class proceeds; never PT503.
  - K3: `may_start` equals the trigger, refused and allowed.
  - O01 shows the orientation present in four cases, with a plant.
  - A01: the pause page only on the platform T−15 branch.
  - B01 is R-B: at most four reads, and a failed read keeps the stage.
- **The conflict with 4.0's Slice-2 rulings (UX1-S2-MELIHAT-01)** is for the Chief Architect and Daisy, not for me.

## Addendum (05:25 UTC): D4 corrected. CANNOT_FINISH is removed. *(Superseded: my "Commit 3 (D4)" section above, as it accepted that branch)*

- **THE PLAN §5.3 D4:** the deadline is "start plus its duration", and "a sitting with no duration is refused only inside T−15". No assessment has a duration. So D4 refuses only inside T−15.
- Commit 3's CANNOT_FINISH, read from the assignment's `closes_at`, overreached.
- **Ruling: remove it, do not leave it dormant.**
  - Remove it from `maintenance_mulai_tolak`, the trigger and `may_start_assessment`.
  - Assert in the migration that the code is produced nowhere.
  - The message entry and the app's mapping go too, unless Daisy keeps the words. If she does, register them.
- **K3 is re-specified:** a start well before a window, on an assignment that closes after it, is **allowed**, by the trigger and by `may_start` alike. K3 keeps the T−15 refusal. **K4 is unchanged.**
- **The siblings to restate:**
  - O01's D4 case;
  - A2B-A01's D4 branch;
  - UX1-S2-MELIHAT-01's D4 minutes;
  - `pemeliharaan.d4.*`.
- **My miss:** at `8e33dd32` I accepted the branch without checking it against THE PLAN's text. Could reasonably have been anticipated: yes (Q1: read the approved text). Caught in development, by Second Eye.

## Addendum (06:10 UTC): the D4 removal, verified. Product `2586f3e1bdae90c98afb99764c1d2377b45c9226`; head `d6152ec5b295492b92ca03a1bfc55c7162544c8a`

**Verified on the head, against the five conditions (the owner's, through Bob):**
1. **The code is gone.** `MAINTENANCE_CANNOT_FINISH` appears in `supabase/migrations` and `src/` only in `20270120120000`'s history comment (:5) and its own absence check (:87). It appears in no function body, no trigger, not in `may_start_assessment` or `maintenance_refuse`, and not among the orientation's codes.
2. **No deadline is compared with a window's start in the start path.**
   - The start rule (`20270120120000` and its recreation in `20270120170000`) compares `starts_at` only with the clock: the place, and T−15.
   - The `closes_at` left in `20270120170000` (:33, :38) is the orientation's existing output column, not a comparison.
   - D4X asserts that the start rule takes two arguments, person and node.
3. **The error contract, the mapping and the copy keys are removed.** No `pemeliharaan.d4.*` and no `CANNOT_FINISH` remain under `src/`. Daisy kept the words as a record only, so nothing is registered.
4. **A permanent static test, A2B-D4X:**
   - it checks the catalogue for the code, with a plant (`a2b_d4x_tanam`, rolled back) that is found;
   - it checks the start rule's argument count;
   - it scans `src/`;
   - it was red first, at `80add55f`.
5. **The orientation's grants are unchanged, and asserted.** K3 as re-specified is green (red first at `f3507c67`), and K4 is unchanged.

**The siblings are restated:** O01's fourth case, H01, A01, the inventory's notes, and A2A-T01.

**Closed.**

## Addendum, 16 Nov 2026 08:00 UTC: D12's plant depends on leftover state (Second Eye's report)

- **What was reported:** after a restart, D12's plant was installed and moved `efektif` off 900. But `kuras` stayed true. `maintenance_draining(person)` asks about any sitting the learner has, so an open sitting left by screen captures can satisfy it, in the plant run and in the main assertion.
  - **The test can pass for the wrong reason, so this is a test blocker.**
  - Second Eye is tracing it. D12 will reset its own state, and its siblings will be swept for the same reliance.
- **Required in the test commit:**
  1. D12 creates and removes its own sittings, and **asserts that the learner has no other open sitting before it starts**.
  2. **One added case:** a learner with an open sitting that the window does **not** affect. Its expected `kuras` must follow the approved rule.
- **A question on the rule, not only the test:** is `maintenance_draining(person)` meant to be true for **any** open sitting, or only for a sitting the window affects (A2b's R-1)?
  - **If the rule is "only affected sittings"** and the function answers for any sitting, that is a **code defect**, and I need to see it fixed.
  - **If "any open sitting" is the approved rule,** cite where it is approved.
- **Could reasonably have been anticipated:** yes, by me (Q4, before and after). When I read D12, I checked what the plant changes, but not what state the test assumes before it starts.
- **Bob's ruling, 08:04 UTC: draining is per window.**
  - **Platform-wide and emergency windows:** "any sitting" is correct for these. `maintenance_block_for_me` answers only these windows (20270120110000).
  - **Work-scoped windows:** any reading, for example the orientation's `berjalan` (20261120100000:284), must count only sittings in that window's place.
    - If one counts all sittings, it is an A2b code defect, to be fixed red-first with a learner in two schools.
    - If none does, a pinning test is added.
  - **I accept the ruling. My rule question is closed.** The D12 test blocker stays open until Second Eye's test commit.
- **Second Eye's answer, 08:10 UTC, and my ruling on it:**
  - **"Any open sitting" is approved for the person-level drain:** D-100(b) (DECISIONS.md:108), and JOURNEY-LOG #29 (line 239).
  - **Where `maintenance_block_for_me` consults it:** only for a platform-wide PLANNED window. There "any" and "affected" are the same set, so it agrees with Bob's per-window ruling. That use is correct.
  - **`pintar_status_saya`'s `berjalan`, for class and school (TEMPAT) windows, carries the person-wide meaning.** Under Bob's ruling ("a work-scoped reading counts only sittings in that window's place") this is the defect case.
    - It is latent: no reader uses it today. But a status field whose meaning is wrong is a trap for the next reader (Q1).
    - **My ruling:** set `berjalan` to null for TEMPAT windows. That is the minimal fix, since nobody needs a place-scoped value.
    - The fix is red-first, with a learner in two schools: an open sitting in school A, and a TEMPAT window on school B, must not read `berjalan` = true.
    - It is a product change in A2b, so it goes ahead if Bob agrees.
  - **Test ask 1:** done at 04488fa8, reproduced red first. I will accept it once the full suite reports.
  - **Test ask 2 as proposed is accepted.** It asserts "any", per D-100(b), with the per-sitting plant. I do not ask for "affected only" for the person-level drain.
- **Second Eye's correction, 08:14 UTC: drain per window.** It replaces my "null it" ruling above, marked superseded here, not deleted.
  - `berjalan` is to be computed per window by a new function, `maintenance_draining_di(person, window)`. Bob's ruling allows either fix.
  - **I accept the plan:** the red-first test with a learner in two schools, plus its positive case, then the product commit, then the pin that keeps `maintenance_draining` to its one caller.
  - **Conditions on the product commit:**
    1. **One source for "in the window's place".** `maintenance_draining_di` must use the same place predicate as `maintenance_affects_place` and R-1. A second implementation of place matching would drift (Q2).
    2. **Privacy.** It takes another person's id, so its grants must match `maintenance_draining`'s:
       - no EXECUTE for `public`, `anon` or `authenticated`;
       - reached only through `pintar_status_saya` with `v_me`;
       - SECURITY DEFINER with a fixed `search_path`, and STABLE.
    3. **No new locks.** It is a read only, with no FOR SHARE or FOR UPDATE.
  - **D12 test blocker (b21437cd):** addressed in 04488fa8. I will close it when the suite reports.
