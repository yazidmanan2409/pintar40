# Batch 3 closure · Protected merge and staging verification (3 Nov 2026)

**Authority:** owner, 2 Nov: «PINTAR 4.0 — BATCH 3 CLOSURE PROMOTION — Decision: CONDITIONAL GO» (D-151). It follows D-150, the closure pass.

## Verdict: VERIFIED BATCH 3 CLOSURE CANDIDATE · not a declaration of full acceptance

- The closure is merged through the protected path. Migration 183 is applied to staging.
- Every staging walk is green on a fresh test school. They cover:
  - the complete Studio lifecycle, with the superseded-package, availability-badge and Question Bank checks;
  - the Golden School regressions;
  - accessibility.
- F-7 keeps school isolation, restricted answer-key visibility and the separate Question Health boundary. This holds in CI and on staging.
- Dr Gladys's demonstration school and every existing assessment result are byte-for-byte unchanged.
- **The staging freeze is restored** (D-151).
- Production was not touched.
- No Batch 4 work.
- **W1.2, D1 and D3 remain awaiting Daisy. They are not approved or completed.**

## 1. Pull request and CI

| Item | Evidence |
|---|---|
| Pull request | [PR #6](https://github.com/yazidmanan2409/pintar40/pull/6), the closure commits only: migration 183, D-150, tests, the walks and the required documents. It also carries the Batch 3 walk request records, which trigger only on the development branch. |
| Required check | `verdict · green only when every job ran and succeeded`, green on the final head `bbbeba4`. CI 41549315226: 18/18 jobs. |
| The strict selftest job in CI | **713 passed, 0 failed, 0 skipped.** It runs with no skip allowance. The 14 tests skipped locally all PASS by name, as do the five new tests: F01-R04; BOB25-S01 and A01; PENUTUPAN-A01; BOB26-A01, A02 and A04; BOB51-A01; BOB27-A01; BOB28-A01 and A02; D101-A01 and A02; D102-A01. |
| End-to-end journeys | 41556334574 green on the candidate `bbbeba4`: job A, the crawl and the Studio walk 18/18 including U7a, U10 and U10b; job B, Gladys's path. |
| Merge | `cb1ff3e`, with the head SHA pinned; a merge commit, no bypass |
| Triggered on `main` | Only `ci` (41559917386) and `staging.yml` (41559917427, the migration). No production workflow and no deployment outside staging. |

**One journeys run was discarded.** Run 41552566620 audited `main`'s application, because its `ref` input defaulted to `main`. Its three closure checks failed, exactly as the pre-closure code should. It was re-dispatched with the candidate's SHA (41556334574), which was green.

## 2. Migration 183 and the merged commit on staging

**Before the merge** (read-only):
- 182 migrations;
- the demonstration school's counts and the digests of every existing result row and official result row were recorded (§5).

**Recovery:**
- forward-only;
- one function re-emitted, with no table, column or policy change;
- reversible by a forward migration;
- the daily staging backup covers it.

**After the merge:**
- **183 migrations**, the last `20261216100000`;
- `studio_home` is security definer with `search_path=public, pg_temp`;
- it leaves superseded versions out of all three package buckets;
- `anon` cannot execute it; `authenticated` can; its exposure is STAFF.

**Environment facts:** 41560700942 GREEN, so staging runs `cb1ff3e`. GS-00 re-checked this before every walk.

## 3. Staging walks

Fresh test school: **`sekolah-uji-b3c-1103`** («Sekolah Uji B3C 1103», found-school 41560704317). The Batch 2 school served only as the «other school» in T16.

| Check | Run | Result |
|---|---|---|
| Golden School GS-01–03 | 41560800182 | PASS |
| GS-04–11 (admin; publication) | 41562230553 | PASS |
| GS-07, GS-12–16 (learners) | 41564001879 | PASS |
| GS-17–21 (reports, certificate, recovery, shared computer, public check) | 41566279263 | PASS |
| Studio walk T0–T16 with T7a, T10 and T10b | 41570204639 | **PASS 19/19** |
| Accessibility and keyboard | 41571909539 | PASS |

**The Studio walk on deployed staging:**
- **T2:** the refused upload names the row: Soal, row 2, Tingkat kesulitan.
- **T5–T7:**
  - the send-back gives a reason and names the reviewer;
  - the correction is uploaded as the next version, then resubmitted.
- **T7a (defect 1):** the package is listed once; the replaced version is not listed as a package; «Riwayat perbaikan» still opens it.
- **T8:** approval, then create and lock in one press. The head of department is not offered «Terbitkan».
- **T9:** published, with a pass mark of 70%.
- **T10:**
  - «✓ Disediakan»;
  - **the Siapkan card's badge reads «Tersedia»** (defect 2);
  - the class page lists it «… Mulai 3 November 2026 Sampai 3 Desember 2026 Tersedia».
- **T10b (F-7):**
  - the Guru is offered «Bank Soal»;
  - **28 questions are listed, 0 of another school**, with keys and reasons;
  - **no Question Health review form**.
- **T11:** the learner reaches the chapter by a re-issued card and sees no key.
- **T12:** the history is complete.
- **T13–T15:**
  - the Uji Cepat is launched and handed in;
  - no certificate;
  - «Nilai kelas 100% · 1 dari 6 murid sudah dinilai».
- **T16:** the reviewer's name is told to the author only. The Dekan, another school's admin and `anon` are told nobody, or refused.

**Accessibility:**
- **All judged checks PASS:** JUDUL-NAMA, LEBAR-1280/1024/320, PAPAN-LEWATI, PAPAN-ISI, PAPAN-MENU-0/1/2, PAPAN-DIALOG-1/2, MENU-320 and JUDUL-DITOLAK.
- **Recorded:**
  - 12 screens, none missing a title;
  - skip link 0, focus stuck 0;
  - axe clean on 12 of 12;
  - widths and clipping 0 at every size.
- **One recorded note,** the /masuk inputs' focus ring: the harness's known limit (a wrapper's `:focus-within`), unchanged since Batch 2.

## 4. F-7 permissions

| Boundary | Evidence |
|---|---|
| School isolation | Staging policies, read-only: `items_select` and `item_options_select` are `can_in_institution('CAN_DRAFT', institution_id)`. F23-W07 (CI): the Guru reads no question or option of another school. T10b (staging): 28 listed, 0 of another school. |
| Restricted answer-key visibility | Keys and reasons only to CAN_DRAFT in that school, under the same rule as the package page (D-088(h)). On staging's role table, the Guru, head of department and school admin hold CAN_DRAFT; the Dekan and the learner hold neither capability. T11: the learner sees no key. |
| The Question Health boundary | `question_health_select` is `can_in_institution('CAN_REVIEW_QUESTION_HEALTH', …)`, held on staging by the head of department and the school admin, never the Guru. F23-W07: the Guru reads no Question Health row and gets no count; the head of department still reads the signal. T10b: no review form for the Guru. |

## 5. Preservation

Staging, read-only.

| Record | Before the merge | After the last walk | Difference |
|---|---|---|---|
| Demonstration school: roles / results / official / certificates / enrolments / courses | 4 / 10 / 10 / 3 / 5 / 1 | 4 / 10 / 10 / 3 / 5 / 1 | 0 |
| Demonstration school: audit rows (last id) | 91 (6860) | 91 (6860) | 0 |
| Every result row outside the test school, md5 of the whole rows | `1406263b4cfb5880871e54d335baf1d7` | `1406263b4cfb5880871e54d335baf1d7` | **identical** |
| Every official result row outside the test school, md5 of the whole rows | `132e43acf095bfce2e5f1bb696e11504` | `132e43acf095bfce2e5f1bb696e11504` | **identical** |
| All schools: results / official / certificates / courses | 1556 / 130 / 36 / 41 | 1568 / 142 / 39 / 44 | +12 / +12 / +3 / +3, **all in `sekolah-uji-b3c-1103`** |

- No reset.
- No write to the demonstration school.
- No existing assessment record was modified.

## 6. Still open (Batch 3 is not fully accepted)

| Item | Waits on |
|---|---|
| **W1.2** question-review layout | Daisy (commission `03-DAISY-W1.2-COMMISSION.md`) |
| **D1**, what the Uji Cepat class figure is | Daisy |
| **D3**, the minimum group before a class figure | Daisy, possibly also the owner |
| Wording and cosmetic questions | Daisy (`02-DAISY-QUESTIONS.md`); not blocking |

## 7. Freeze restored · STOP

Nothing changes on staging or `main` without a new owner authorisation (D-151). The development branch carries this report only. STOP for owner review.
