# PINTAR 4.0 · Closure status, 7 October 2026 (03:50 WIB)

**In short:** batches 2 and 3 are closed and on main, proven in CI on the branch and again on main, and staging runs them. **33 of the register's 74 items are closed** and 3 are outside this gate. Of the **38 still open**, only 5 are engineering work that needs no one else; the other 33 wait on Daisy's screens (14), on you (4) or on release day, operations and legal (15). Production was not touched.

## 1. Where everything stands

| Place | State | Proof |
|---|---|---|
| main | `b5be891`: batch 3's code (`9a46bf5`) plus its report | CI 37493596839 on main: 18/18 jobs, 617 tests passed, 0 failed |
| staging | runs main's commit `b5be891`; 171 migrations, the same as the repository | migration run 37493598299; read-only facts check 37529584356 GREEN (6 Oct, 20:51 UTC) |
| production | unchanged: `5b5b68d`, 111 migrations | the same facts check; no production request file touched |
| CI allowance | **401 of 1,900** estimated minutes spent; 1,499 left | §6 |

## 2. Closed overnight

**Batch 3: the behaviour you ruled on** (report: `PINTAR-4.0-CLOSURE-BATCH-3-2026-10-06.md`)

| Item | What it does now |
|---|---|
| CR-47 + Q10 | Descriptors at 90 / 80 / 70%; **none below 70%**. A learner who has not sat the Uji Penguasaan shows as «Belum mengerjakan», never in a band. Earlier sittings keep the old rules |
| CR-02 | A certificate is sealed at issuance: renaming the school no longer changes it |
| CR-01 | The number is `<PINTAR ID>/<NNNNN>`, the holder's own sequence. «Awalan nomor» is retired |
| CR-50 | Each school owns its misconception definitions. **All 20 PINTAR chapters regenerated**: 1,857 wrong options carry one of 277 defined misconceptions, so the false "weak misconception" findings are gone |
| CR-13 | A wrong staff email is corrected without SQL, audited, as you ruled (before activation: the school admin or the platform admin; after: the platform admin only, every session ends and both addresses are told). **The button comes with Daisy's admin screens (S7)**; until then the route has no button |
| CR-51 | The platform admin imports the PINTAR library's standard content through Unggah; **a second platform admin approves it**; every school role stays refused |

**Batch 2: proof on today's code, no product change**

| Result | Items |
|---|---|
| Closed | CR-18 (staging run 37483810708); CR-19, 29, 45 (CI); CR-33, 35, 38, 39, 40, 42, 43, 44 (journeys audit 37487347244, **72 PASS**) |
| **Not walkable: now an A item** | **CR-41 (transfer between schools).** The form asks for school and year codes that are internal IDs no screen shows. I wrote no walk, because one could pass only by reading the IDs from the database, which would hide the gap. The fix belongs to Daisy's admin screens (S7), with engineering |
| Moved to batch 6 | CR-30 (network loss): it needs a fresh demo learner with no sitting |

## 3. The register, item by item

| State | Count | Items |
|---|---|---|
| **Closed** | **33** | CR-01, 02, 08, 09, 10, 13*, 16, 17, 18, 19, 20, 23, 26, 29, 32, 33, 35, 38, 39, 40, 42, 43, 44, 45, 47, 50, 51, 60, 61, 62, 63, 64, 65 |
| Outside this gate (your rulings) | 3 | CR-28 (after go-live, QN3), CR-36 (P2, data-dependent), CR-53 (D-050) |
| **Open: engineering, no one else needed** | 5 | **CR-52** (walk Bank Soal, as QN5 ruled; not yet done, see §7); CR-30, 58, 59 (batch 6 regression); CR-34 (Uji Cepat walk, after CR-27's screen) |
| **Open: Daisy's screens** (batches 4–5) | 14 | CR-03, 04 (certificate, print), 05 (revocation), 06 (raw layout names), 07 (profile photo), 14 (name correction), 21 (Digital Card), 22 (email system), 27 (Uji Cepat score), 37 (remove the briefings surface), **41** (transfers), 46 (empty states), 54 (the polish pass), 57 (educator-as-learner) |
| **Open: yours** | 4 | CR-55 (your J1–J7 walk), CR-56 (wordmark licence, with Daisy), CR-31 (confirm the second attempt stays on hold), CR-48 (Q11) |
| Open: release day, operations, legal (D) | 15 | CR-11, 12, 15, 24, 25, 49, 66, 67, 68, 69, 70, 71, 72, 73, 74 |

\* CR-13 is closed on the server and the route. Its screen is in S7.

## 4. Decisions I need from you

1. **CR-13: four choices I made where the ruling was silent.** Confirm or change each:
   - before activation, the correction undoes a set-up begun through the wrong inbox (password cleared, PIN and name to confirm again);
   - after activation, every session ends;
   - the platform admin may also correct before activation;
   - both addresses stay readable in the audit log (say if you want them hashed).
2. **CR-51:**
   - Who is the second platform admin on production?
   - Should gs-001's Bab 1 on staging stay a school chapter, or be re-imported into the library?
3. **CR-47:** I count not-yet-assessed learners in the class's figures. Say if you want assessed learners only.
4. **W-2, new:** a head of department who refers an integrity case to the decision queue can also decide it. There is no second person. I found this by reading the code; no walk tested it. Should a second person be required?
5. **The other six findings from the walks (batch 3 report §7):** say which are A and whose, and which you accept as they are.
   - W-1: the integrity review page shows ID fragments, not names.
   - W-3: a school admin who refers a case never sees its outcome.
   - W-4: no link to «Laporan saya».
   - W-5: a report template cannot be revised on the screen.
   - W-6: the audit trail shows raw codes.
   - W-7: the receiving school sees a transfer's learner as an 8-character ID (goes with CR-41).

## 5. For Daisy

- **CR-50:** the four new problem sentences for the «Miskonsepsi» sheet. The downloadable template does not have that sheet yet.
- **CR-13:** the notice «Alamat email akun PINTAR Anda dikoreksi», and the button on the people list (S7).
- **CR-51:** the library entry in Unggah's school list (last, never preselected).
- **CR-41:** a transfer form a person can fill in.

## 6. The CI allowance

- **Spent: 401 of 1,900** estimated minutes (batch 0: 60; batches 2 and 3: 340; tonight's facts check: 1).
- **144 were wasted on two red CI runs.** Both were my own test instruments failing to follow the changes; the product was fine both times. Since then, every plant gate a change touches runs locally before the CI run.
- **Landing on main costs a second full cycle (about 73),** because main never reuses the branch's run. Your forecast counted one cycle per batch.
- **The ceiling is likely to bind during batch 5:** eight slices at about two cycles each is about 1,170, before the staging walks. I will raise it before it is reached, not after.

## 7. What I did not do, and why

- **CR-52 (walk Bank Soal) is still open.** QN5 made it a B item after batch 2's list was drawn, and I did not pick it up overnight. It needs no ruling. It costs one journeys audit run (about 40 minutes), and I can do it next.
- **Staging's demo school runs the new code but has not been re-walked since batch 3.** The Golden School walks last passed on 12b480b. Batch 6 walks it again on the frozen specimen. Dr Gladys's gate is postponed (D-118), so nothing is waiting on it.
- **No screen was changed** beyond what a ruling named. No production setting, secret, credential or request file was touched.

## 8. Next

- **Batch 4, Daisy's gate:** you walk J1–J7, the stripe test is done, and Daisy freezes the design. Batch 5, the screens, starts only after it.
- **Meanwhile, mine:** CR-52, if you agree to spend about 40 minutes on it.
