# Retrospective integrity audit, Batches 0–6 · summary · 4 Nov 2026

**Status:** the audit's reading is complete.

**What this summary covers:**
- The per-batch account is `01-REGISTER.md`, one row per requirement or finding.
- The method is `00-PERSIAPAN.md`.
- Every correction below is at its root cause, with a regression test shown red on the old code and green on the new.

**The baseline:**
- **Start:** `be8a68c2` (`ci` 41842329505, journeys 41842334345, both green).
- **Corrected head:** `71b13d9b`. Its CI and journeys are in §6.

## 1. What the audit found and corrected

| Batch | Finding | Kind | Correction (test) |
|---|---|---|---|
| 0 | R0-1: 4 browser jobs not pinned to ubuntu-24.04 | claimed, unguarded | `R0-PIN-01` |
| 0 | R0-3: the harness measured the skip link from the tour's headline, so two «exceptions by design» (D-148(b)) were never exceptions | a test that measured the wrong thing | `audit/a11y.mjs` |
| 0 | R0-4: «Kembali ke halaman sebelumnya» from /lapor landed on a refusal | defect | `TautanKembali`; walk N7 |
| 0 | R0-5: a missing lesson PDF opened the route's raw JSON | hand-off never picked up | `TautanBerkas`; `R0-MEDIA-01`; walk B5-W8 |
| 2 | R2-3: a screen date in the formal form, in this session's own B1 change | acceptance line never made a test | `R2-TANGGAL-01` |
| 2 | R2-5: 22 bare empty lines; a refusal drawn as an empty state | adoption with no owner | `R2-KOSONG-01` |
| 3 | R3-1: Daisy's A1 question review accepted and never built. The loader also hid read errors, and cut large packages at the API's 1,000-row limit, so a reviewer could approve a list that was not the whole package | accepted design with no engineering line; untested loader | `R3-SOAL-01`; walk U7b, which found the 320 px pager overflow, also fixed |
| 3 | R3-2: one approved English line not applied; «(opsional)» on six keys, one doubled on screen | acceptance lines never made a test | `R3-A5-01` |
| 3 | R3-3: A5's B10, C1 and J5 not built (Studio's head over a package page; no sent-back badge; no window in Siapkan's review) | page-level design answers never listed as engineering items | `R3-A5-01` |
| 4 | R4-7: one English line named the PINTAR ID where the Indonesian names the school registration number | a two-language rule tested in one language | `D168-B2-1` extended |
| 5 | R5-5: «Lihat per soal» offered on a PD class's Uji Cepat pages, into a refusal | fix applied where seen, not at every consumer | `R5-PERSOAL-01` |

**Nothing was weakened.** Every restated test says why in the file and keeps its behavioural assertion. They are:
- `D168-K1-1`, `HOD09-K01`, `R0-MEDIA-01`, `D168-B1-7`;
- `D088H-K01`, `D168-A1-1`;
- `STUDIO3A-J1-01`, `STUDIO3A-SEPARUH-01`, `POLISH2-STUDIO-01`.

No exemption was added but the five declared bare empty lines of `R2-KOSONG-01`, each with its reason.

## 2. The pattern behind most findings

The batch tests proved what each batch built. **Nothing proved that what was accepted later had been built.** The audit found this gap three times:
1. Batch 0's «observed, not investigated» list (R0-2, R0-5) had no owner in Batch 1.
2. Daisy's A1 and A5 arrived after Batch 3 closed, and only the parts written as shared-pattern items (E-K…) were carried into the engineering list.
3. Acceptance checklists' «[auto]» lines (E3 #15, A4, B2's «both languages») were read as done when no test held them.

**Recommendation (process, no code):** any accepted design, ruling or hand-off becomes an engineering line in `06-ENGINEERING-ITEMS-FROM-DESIGN.md` on the day it is accepted, and each «[auto]» line becomes a manifest id. The audit's own tests (`selftest/retro.test.ts`) show the form.

## 3. Cross-batch, role and security evidence

- **Authorization at the enforcement boundary:** every audited permission is the database's.
  - CR-91 (R1-1) is held by immutable role assignments and two triggers.
  - The corrections (R4-1) and transfers (R4-3) are proved by the F24 refusals per role and scope.
  - The Question Bank and Question Health boundary (R3-5) is proved by F23-W07.
  - The per-question page (R5-5) refuses by `adaBuktiSoal`, and its links now ask the same rule.
- **School isolation:** F23-W07, F26-W01 (another school's admin reads none) and F25-T02 (another school's teacher gets an empty answer).
- **The question review reads under the reader's own row security:** `soalPaket` uses the reader's client, and the learner preview reads no question (D088H-K01).
- **No security was weakened.** No migration, staging or production change was made.

## 4. The real blockers, apart from future scope

| Blocker | Waits on | Batches |
|---|---|---|
| NVDA and TalkBack passes; the skip link's manual keyboard check (R2-9) | a manual run at acceptance | 2, 4, 5 |
| F-11: the wordmark master and font licence; the printed A4, CR80 and QR proofs | owner | 6 |
| D1's manual client protocol and real sending | owner (a send path, synthetic inboxes) | 6 |
| F-4's private content store and regeneration; the personal address in three files (R1-6, R1-7) | owner | 1 |
| Copy awaiting approval: `alasan.nonaktif.jawab`; A5 B7, B9, B11; E-B1-2; `config.kelompok.*`, `context.manage_label`, `email.bingkai.konteks` | Dr Gladys / copy approval | 2–6 |
| C3's «arah berpikir» hint; C9's sheet name and X12 (paket/kursus) | Dr Gladys, and the owner for X12 | 3 |
| E-B1-3 the seed school's name; W3.9's metric words | Dr Gladys | 4, 5 |
| C2 (the PD Kelas presentation), B4, G1's six expressions | Daisy, then the owner | 5, 6 |

**Future scope (not counted as blockers):** 4.1, 4.5 and 5.0 features, and Batch 9's recovery readiness (W9.12).

## 5. Per-batch readiness verdict

| Batch | Verdict | Why not fully GREEN |
|---|---|---|
| 0 | **VERIFIED** (§6 green); no OPEN or BLOCKED row | — |
| 1 | **Engineering VERIFIED; BLOCKED items remain** | F-4's store; the personal address; C31 and E-B1-3 wording |
| 2 | **VERIFIED after correction; BLOCKED items remain** | `alasan.nonaktif.jawab`; R2-9's manual check |
| 3 | **VERIFIED after correction; BLOCKED items remain** | C3, C9/X12; A5 B7, B9, B11 copy |
| 4 | **VERIFIED after correction; BLOCKED items remain** | E-B1-2, E-B1-3, `config.kelompok.*`, `context.manage_label` |
| 5 | **VERIFIED after correction; BLOCKED items remain** | C2; W3.9 words; G1; screen readers |
| 6 | **Engineering VERIFIED; BLOCKED items remain** | F-11; print proofs; D1's manual protocol and sending; B4 |

**No batch is called fully GREEN.** No requirement is OPEN, except R1-8, a recorded limit of the history scan. Every other remaining item is BLOCKED on a named person or action.

## 6. CI on the corrected head

- **`71b13d9b`: `ci` 41866159878 passed; journeys 41866166979 passed** (every walk, the Studio walk's A1 step U7b included).
- Earlier head `04ee036f`: `ci` 41857401305 passed on its one re-run (attempt 2). Its first attempt failed in runner setup, before any test ran. Journeys 41857406665 passed.

## 7. Recommendation on the next batch

**Do not start the next development batch yet.** Engineering's part of Batches 0–6 is built and held: §6 is green. What remains is decisions, not code:
1. **Owner:** F-11; D1's send path and synthetic inboxes; F-4's private store; the personal address; X12's consolidated terminology decision.
2. **Dr Gladys (one sitting, one pack):** the copy items of §4, C3, C9, E-B1-3 and W3.9's words.
3. **Daisy:** C2, B4 and G1. Then the owner's review.
4. **Acceptance:** the NVDA and TalkBack passes and the print proofs, on the final screens.

**Then,** with those in hand, one short closure pass applies the approved words and designs, with their tests. Only after that should the next batch be promoted. Promoting it is the owner's decision, and this audit does not make it.

## 8. The owner's ruling (D-178, 4 Nov)

- **Accepted on the reported evidence.** Batch 0 VERIFIED; Batches 1–6 acceptance-incomplete; no promotion; the branch stays protected.
- **No further broad audit now.** The process is corrected while the product is finished:
  - `R-PROSES-01` makes §2's recommendation a test. Every engineering item from an accepted design is named by a test, held by named tests or files, or blocked on a named decider. Red first, on four items with none: E-B1-2, E-B1-3, E-P15 and E-K-ALL.
  - Every disclosure on a screen is declared (E-P17).
- **Next:** the coordinated decision pass, `03-LINTASAN-KEPUTUSAN.md`.
