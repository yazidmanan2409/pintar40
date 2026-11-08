# PINTAR 4.0: Engineering Readiness & Integration Report (8 Nov 2026)

**Branch:** `claude/awesome-rubin-bqxp6p`.
**Corrected head:** `14361bda`. Its application code is `2be7a796`; the commit after it is a handoff note only.
**Staging and `main`:** both `c4944fab`. Nothing has been merged, promoted or deployed. Production is untouched.

**Legend:**
- **VERIFIED:** a run that exercised the state, with its id.
- **LOCAL:** a local run or render of the stated head.
- **PENDING:** not yet run on the corrected head.

## 1. Scope implemented, and what remains

**Implemented:** all approved 4.0 batches, as the integration dossiers record (Batches 1–6 and 8–9, `batch-*/INTEGRATION-DOSSIER.md`). Since `c4944fab` the branch carries only readiness corrections: Daisy's audit, the focus sweep, and Daisy's F1–F10. There are **no new features and no migrations**.

**Remaining:**
- Sharon's selftest change, not yet integrated (§3).
- The verification of the corrected head (§4).
- Three owner points (§7).
- The human checks (§6).

## 2. Daisy's findings and closure evidence

| Round | Findings | State |
|---|---|---|
| **Audit** (`KESIAPAN-4.0.md`) | A1–A3, the six walkthrough Bs, the remaining Bs and Cs | Corrected; see `acceptance/KESIAPAN-PENYELESAIAN-2026-11-08.md` |
| **Final verification of `14361bda`** (Daisy, `CONTOH-LAPORAN/KESIAPAN-AKHIR.md`, `ux-1/daisy-experience` `a0581113`) | **Daisy's verdict: READY for the owner's walkthrough, on the condition that staging serves `14361bda`.** Seen live on her local build, as admin, Guru, Kepala departemen and Dekan: F1 both ways, B4, the primary buttons, F8's clean path (the error path read in code), F9, F10, and the reviewer's page. Rendered: F3 at 390 and 320 px, with axe clean, and the 10-class A4 grid. `siap-jalan` 7/7 on her build. Not seen: staging, and the withdrawal and maintenance confirmations pressed live. Five cosmetic items may follow. **Her verdict is hers. Our exact-SHA gates on `14361bda` are still pending (§4)** |
| **Verification of `f2a52a5a`** (`7ea99f35`) | Closed by Daisy: A2, A3 (keyboard), B1, B2, B3, B5, B6. Not closed: A1, B4. Must-fix: F1–F10 | **F1–F10 corrected in `2be7a796`**, as listed below. **Daisy has not re-verified.** No design acceptance is claimed here |

**F1–F10, corrected in `2be7a796`:**
- **F1** (A1, classless learners): a list with rows that have no class goes on only once the admin picks the class at Tempat, or declares it a teacher/staff list.
- **F2** (B4): every destructive opener is red words on white (`.pin-btn.pin-bahaya`).
- **F3:** the grid's phone overflow is fixed, with guard SIAP-LEBAR-01.
- **F4:** the publish-readiness reasons are hidden until a release exists.
- **F5:** Pendataan's own next step is primary, and «Simpan kode» confirms it saved.
- **F6:** the class card is the primary button for a learner on Aktivasi.
- **F7:** the upload shows one primary button.
- **F8:** «Tandai lolos pemeriksaan» runs the content check and holds on an open ERROR, as UX-01 and the step's own words say.
- **F9:** «Paket» replaces «Kursus» in the upload result.
- **F10:** Studio home's zero line says what its count leaves out.

**Evidence on `2be7a796`:**
- LOCAL: typecheck clean; targeted static tests green (SIAP-*, B5-*, BOB07-*, DAISY-04/06/17, STUDIO3A-*, UX1-V3-*, UX1-DATA-JUJUR-01, the result-code contract).
- PENDING: the full suite, the walks and CI (§4).

## 3. Sharon's integration status

Sharon's commit is `04abab88` on `claude/gracious-lamport-0m1qjr`: build-input fingerprinting, so a stale `.next` is rebuilt; CI's selftest owns the build.

Her evidence so far:
- run 42436460751 on `289b49af`: green, 874/0;
- she reports clean test merges with this branch;
- **her exact-commit run 42438430634 on `04abab88` and her handoff are PENDING.**

**Not integrated.** It will be integrated by a merge commit only after her verified handoff; the combined head then gets exact-SHA CI and journeys.

## 4. CI and journey results

| Head | CI | Journeys |
|---|---|---|
| `a10d5650` | 42433800520: 874 passed, **1 failed** (D168-B1-6, an h3 heading; fixed in `b41aeeed`) | 42433803149: **green**, both jobs |
| `14361bda` (F1–F10) | **PENDING**: run 42439246621 | **PENDING**: run 42439260649 (42439248749 cancelled: a short SHA was refused) |
| combined with Sharon's | not yet | not yet |

**Locally on `b41aeeed`:**
- the readiness walk `audit/siap-jalan.mjs`: 7/7;
- the full suite: 840 passed / 19 failed. One failure was real and is fixed (D168-B1-6). The other 18 read accumulated local DB state; none appears on CI's fresh database.

**Known weakness, Daisy's:** walk steps R5 and R6 passed without reaching their states. They do not count as evidence until they reach those states.

**Risk to watch:** F8 now holds «Tandai lolos pemeriksaan» on an open ERROR. If the Studio walk's synthetic chapter has ERROR findings, the W6.5 journey stops at that step. The pending journey run will show it.

## 5. Cross-component integration verdict

| Journey | Status |
|---|---|
| School administration: Pendataan → Peran & akses → Aktivasi → Kelas → Kartu kelas | **Not verified end to end on the corrected head.** A new mapping gate sits in Pendataan, and the three walks that record staff tick it |
| Studio: upload → check → review → approve → publish → distribute | **Changed** (F4, F7, F8); PENDING, settled by journeys W6.5 |
| Teaching, learning, assessment, results, reports | Unchanged since journeys 42433803149, which were green |
| Leadership reports and A4 | B5 and B6 closed by Daisy; F3 fixed. PENDING re-render |
| Professional development (separate workflows and boundaries) | Unchanged; staging PD walk 15/15 on `c4944fab` |

**Verdict: NOT YET VERIFIED AS ONE SYSTEM on the corrected head.** It depends on the PENDING runs, then Sharon's integration, then one exact-SHA run on the combined head.

## 6. Performance and accessibility

- **Performance:**
  - W6.2 first-screen timing is measured by every journey run.
  - The W6.2/W6.8 regional figures from Indonesia need an Indonesian runner (`acceptance/W62-W68-REGIONAL.md`); **not measured**.
- **Accessibility:**
  - The focus pattern is swept across ten components (SIAP-FOKUS-01), with Struktur walked by keyboard.
  - **NVDA and TalkBack** (S1–S8) and the **human journeys** H1–H20 are open. None is recorded.
  - Automated success here is not human acceptance.

## 7. Remaining blockers

1. **The PENDING runs on `14361bda`.** Investigate any red, including the F8 risk above.
2. **Sharon's handoff**, then the combined head's exact-SHA CI and journeys.
3. **Daisy's re-verification**, using the request in §8.
4. **Owner decisions:**
   - **A1:** a person already recorded without a class has no product route into a Kelas. Pindah moves only people already in a Kelas or Tingkat. Adding a route is a new capability with a migration.
   - **F8:** confirm that the mark should hold on an open ERROR. This is my reading of the approved step text; it is reversible in one line.
   - **W1.16:** the Studio home counts are incomplete until a migration. The wording now says so.

## 8. Re-verification request for Daisy (to send with the combined head's SHA)

Please verify on `2be7a796` or later:
- **A1/F1:** a learner list with no Tempat must not go on without the class or the teacher/staff box; a staff list goes on with the box.
- **B4/F2:** every destructive opener is red words on white; its confirm is solid red; «Batal» is quiet and takes focus.
- **F3:** the topics × classes grid at 390 and 320 px.
- **F4:** the reviewer's package page.
- **F5–F7:** the primary buttons on Pendataan, Aktivasi and the Studio upload.
- **F8:** the mark with and without open ERROR findings.
- **F9, F10:** the upload result's word and Studio home's zero line.

Known limitations: the A1 gap and W1.16 (§7).

## 9. Recommendation for the owner's unscripted walkthrough

**Not yet.** The candidate is ready only when all of these hold:
1. The PENDING runs are green, or every red has been investigated and fixed.
2. Sharon's change is integrated, and the combined head is green on exact-SHA CI and journeys.
3. ~~Daisy re-verifies F1–F10.~~ **Done:** Daisy READY on `14361bda`, on the condition that staging serves it (`a0581113`).
4. You rule on the A1 gap and F8.
5. You authorize the staging promotion, and one signed-in pass on staging confirms the admin, Guru, Kepala departemen and Dekan journeys.

Nothing in this list needs a new feature.
