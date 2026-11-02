# Batch 3 · Protected merge and staging verification (2 Nov 2026)

**Authority:** owner, 2 Nov: «PINTAR 4.0 — BATCH 3 CONTROLLED PROMOTION — Decision: CONDITIONAL GO» (D-149).

## Verdict: STAGING VERIFICATION PASS · Batch 3 NOT yet fully accepted

- Batch 3 is merged through the protected path. Its one migration is applied to staging.
- The complete Studio workflow passes on deployed staging, and so do the Golden School regressions and the accessibility walk.
- Dr Gladys's demonstration school and every existing assessment record are unchanged.
- No integrity, security or regression failure. One check in the new walk was wrong and was corrected and re-run (§3).
- **Batch 3 is not declared fully accepted.** W1.2 awaits Daisy's composition. W1.11 awaits F-7. Daisy's D1 and D3 are open. Two small defects were found in the side-by-side comparison (§6).
- **The staging freeze is restored** (D-149).
- Production was not touched.
- No Batch 4 work.

## 1. Scope and protected merge

| Item | Evidence |
|---|---|
| Pull request | PR #5, containing only: the Batch 3 implementation; the migration `20261215100000_a_package_names_who_reviewed_it.sql`; tests and walks; the verification tooling; the required documents (including D-148 and the Batch 2 request records, which trigger only on the development branch) |
| Required check | `verdict · green only when every job ran and succeeded`, green on the final head `82de96e`. CI 41521853943: 18/18. |
| Merge | `a5e2935`, with the head SHA pinned; a merge commit, no bypass |
| Triggered on `main` | Only `ci` (41526179944) and `staging.yml` (41526179993, success: it applies migrations to staging). No production workflow or other deployment ran. |
| Staging runs the merged commit | Environment facts 41526374666 GREEN: staging is `a5e2935`. GS-00 re-checked this before every walk. |

## 2. Migration

**Before the merge** (read-only):
- staging had 181 migrations;
- `nama_riwayat_paket` was absent;
- its prerequisites existed.

**Recovery:**
- the migration is additive (one function and one registry row);
- it is reversible by a forward migration;
- the daily staging backup covers it.

**After the merge:**
- 182 migrations, the last `20261215100000`;
- `nama_riwayat_paket(uuid[])` is SECURITY DEFINER with `search_path` pinned;
- `anon` cannot execute it; `authenticated` can;
- the registry row's exposure is STAFF.

## 3. Staging walks

Fresh synthetic test school: **`sekolah-uji-b3-1102`** («Sekolah Uji B3 1102», founded by run 41526379831). The Batch 2 school `sekolah-uji-b2-1102` served only as the «other school» in T16.

| Check | Run | Result |
|---|---|---|
| Golden School GS-01–03 | 41526780481 | PASS |
| GS-04–11 (admin; combined press, grouped findings) | 41527419974 | PASS |
| GS-07, GS-12–16 (learner) | 41529256365 | PASS |
| GS-17–21 (reports) | 41532445624 | PASS |
| Studio walk W6.5/W6.7, T0–T16 (new: `audit/staging/golden-school-studio.mjs`) | 41536379780 | 16 PASS, 1 FAIL (T14, a wrong check; see below) |
| Studio walk, re-run after the fix `d5d0c3d` | 41540087994 | **PASS, T0–T16** |
| Accessibility and keyboard | 41541778216 | PASS |

**The T14 failure was in the walk, not the application.**
- T14 checks that the learner holds no certificate for the new package. It counted every «Sertifikat» link on the page, including the learner's menu item. Citra already holds a certificate from GS-15.
- The database held 0 certificates for the package, and the page content named none.
- Fix `d5d0c3d`:
  - the check reads only `main`, plus a separate database check;
  - the same scoping is applied to the CI walk `audit/studio-ujung.mjs`;
  - each run's package title is now unique, so a re-run cannot pick up an earlier run's package.
- No test was weakened: the check now asserts the same thing in the right place.

**What the green Studio run proves on deployed staging:**
- **Refusal:** a workbook with a wrong row is refused, naming row 2.
- **Send-back:** the head of department sends the package back with a reason; the author sees the reason and the reviewer's name.
- **Correction and resubmission:** the corrected version is resubmitted and approved.
- **Approval and lock:** the release is created and locked in one press (FROZEN). Each is its own transaction, as ruled.
- **Separation:** the head of department is not offered «Terbitkan».
- **Publication:** published with a pass mark of 70%.
- **Assignment:** «✓ Disediakan» for the class.
- **Learner access:** Citra, through a re-issued card, opens the package.
- **History:** the history shows both versions, the reason and the reviewer.
- **Uji Cepat score:** «1 dari 6 murid sudah dinilai», at 100%.
- **No certificate** was issued from the Uji Cepat.

**T16 · reviewer-name permissions**, checked read-only. Each check ran in a read-only transaction under the caller's role and claims, ending in rollback.

| Caller | Result |
|---|---|
| The package's author | Told the reviewer's name |
| The author reading the person row directly | 0 rows |
| The Dekan (no Studio role in the school) | Told nothing |
| The other school's admin | Told nothing |
| `anon` | Refused |

**Accessibility (41541778216):**
- All judged checks PASS:
  - JUDUL-NAMA (25 titles, 10 names, no name in a title);
  - LEBAR-1280, LEBAR-1024 and LEBAR-320;
  - PAPAN-LEWATI and PAPAN-ISI;
  - PAPAN-MENU-0, -1 and -2;
  - PAPAN-DIALOG-1 and -2;
  - MENU-320;
  - JUDUL-DITOLAK.
- Recorded:
  - 12 screens, none missing a title;
  - skip link 0;
  - axe clean on all 12;
  - widths and clipping 0.
- One recorded focus-indicator note, on the /masuk inputs. This is the harness's known limit: the ring is drawn by the wrapper's `:focus-within`, which the probe does not read. It is unchanged since Batch 2.

## 4. Preservation

Staging, read-only. Counts before the merge and after the last walk.

| Record | Before | After | Difference |
|---|---|---|---|
| Demonstration school: roles | 4 | 4 | 0 |
| results | 10 | 10 | 0 |
| official results | 10 | 10 | 0 |
| certificates | 3 | 3 | 0 |
| enrolments | 5 | 5 | 0 |
| courses | 1 | 1 | 0 |
| audit rows (last id) | 91 (6860) | 91 (6860) | 0 |
| All schools: results | 1543 | 1556 | +13, all in test schools |
| official results | 117 | 130 | +13, test schools |
| certificates | 33 | 36 | +3, test schools |
| courses | 36 | 41 | +5, test schools |

- No reset.
- Nothing was written to the demonstration school.

## 5. Side-by-side with Daisy's compositions

**Method:**
- Daisy's renders come from her own preview harness on the frozen `ux-1/daisy-experience` branch.
- Ours are the same code's walk screenshots.
- The artifact host is blocked from this session, so the staging artifacts could not be downloaded.

All images are in `evidence/sisi/`, Daisy's on the left.

| Image | Composition | Finding |
|---|---|---|
| `j1-terbitkan.png` | J1Terbit, package page, steps and «Sekarang» | Steps and panel match. Ours places the question list between the title and the steps (B10, C8), with the Studio head and tabs above. Copy differs: hers «menugaskannya ke kelas», ours «menyediakannya untuk kelas mereka» (B5, wording). |
| `j1-terbit.png` | Studio home after publication | Matches: «✓ Terbit», «Sekarang: …». **Defect 1** below. |
| `j1-tersedia.png` | After «Sediakan» | Ours stays on Siapkan with «✓ Disediakan» (D6); hers lands on the class page with «✓ Tersedia». **Defect 2** below. |
| `j1-kelas.png` | Class page | Ours lacks her «Materi untuk kelas ini» section with Tersedia badges. This is a design gap, not a regression. |
| `j5-jendela.png` | J5 the window | Structure matches: Mulai, Sampai (opsional), the echo, the review block. Ours also shows the release card (Pemetaan, Uji, Sertifikat) and «Disediakan untuk» as a third column. |
| W1.2, question review | **None exists** | **Recorded as awaiting Daisy** (`03-DAISY-W1.2-COMMISSION.md`). The screen is not accepted. |

## 6. Findings for follow-up

None is an integrity, security or regression failure. None was fixed during the promotion, which allowed no new functionality.

1. **Defect 1: Studio home lists a superseded version.** After a send-back and correction, the sent-back original version still appears as its own package «Sekarang: Susun isi», and raises «Menunggu tindakan Anda» to 1.
2. **Defect 2: a stale badge on Siapkan.** After «Sediakan», the card's corner badge still says «Belum disediakan», while the page says «✓ Disediakan».
3. **Design decisions for Daisy:**
   - the class page's «Materi untuk kelas ini»;
   - where «Sediakan» lands (D6);
   - the question list's position on the package page (B10, C8).

## 7. Still open (Batch 3 is not fully accepted)

| Item | Waits on |
|---|---|
| W1.2 question-review layout | Daisy's composition (commission `03`) |
| W1.11 who the Question Bank is for | Owner decision F-7, presented as the existing request |
| D1, the Uji Cepat class figure; D3, a minimum group | Daisy, and possibly the owner. The figure is built as the mean, shown from 1 learner. |
| Defects 1 and 2 | A new authorisation to fix them |
| Remaining wording and cosmetic questions | Daisy (`02-DAISY-QUESTIONS.md`) |

The proposed F-7 and Uji Cepat rulings remain recommendations. Nothing in this promotion approves them.

## 8. Freeze restored · STOP

- Nothing changes on staging or `main` without a new owner authorisation (D-149).
- The development branch carries this report and its images only. A documentation push triggers no walk.
- No Batch 4 work.
