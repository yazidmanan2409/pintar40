# PINTAR Handbook · Feature coverage map

**Working file for editorial checking. Not part of the reader-facing handbook.**

- Handbook: `PINTAR-BUKU-PANDUAN-LENGKAP-DRAFT-01.md` (Draft 01, 17 Nov 2026, about 24,000 words)
- Planning reference: *PINTAR Consolidated Roadmap 4.0–5.0, Revision 3*, 16 Nov 2026 ("RM")
- Product sources consulted on `origin/main`:
  - Terminology v1 freeze package, decision D-068
  - UI strings in `src/lib/hle.ts`
  - role capabilities in the latest `role_capabilities()` migration
  - `PINTAR-4.0-SCOPE-INVENTORY.md`
  - human journey catalogue
  - owner rulings M1–M10/T1–T4 and of 6 Oct
  - `HUMAN-ACCEPTANCE-JOURNEYS.md`
  - account lifecycle and action-consequence inventories
  - reporting acceptance matrix
  - `completion-4.1/SCOPE-REGISTER.md`, `EXECUTION-PLAN.md` and `OWNER-DECISIONS-2026-11-11.md`
  - 4.1 batch pages
  - the 9 Nov year-rollover evidence

## How to read this file

**Status column.** This uses the roadmap's vocabulary.

| Status | Meaning |
|---|---|
| **Approved scope** | Implementation scope governed by its plan. |
| **Approved direction** | Version assignment that still needs a separate implementation authorization. |
| **Deferred** | Moved out of an earlier release. |
| **Candidate** | Proposed work. |
| **Unassigned** | Exact version still open. |

**Code column.** This records what the product source on `origin/main` showed when the draft was written. It does not establish live or production state.

| Value | Meaning |
|---|---|
| **built** | Code and UI strings exist on `main`. |
| **built·pending review** | Merged; result reviews and human acceptance still pending. |
| **not built** | Approved but absent from code. |
| **n/a** | Future or not applicable. |

**Ver?** marks items whose workflow, wording or rule still needs verification before publication.

---

## 1. Individual features (RM Appendix A, in register order)

| # | Feature | Version · status | Code | Handbook | Ver? / notes |
|---|---|---|---|---|---|
| 1 | Platform operation and school provisioning | 4.0 · approved scope | built (operator workflow) | 6.2, 16.1 | Production school-founding path blocked pending owner decision (OWR W2.20). Handbook flags it. |
| 2 | School structure, year and class administration | 4.0 · approved scope | built | 7.3, 7.14 | Fixed 1 Jul–30 Jun year, no semesters. Class deactivation cannot be reversed on screen. |
| 3 | Staff provision, activation and sign-in | 4.0 · approved scope | built | 5.2–5.3, 7.5–7.6 | — |
| 4 | Learner enrolment, class cards and access | 4.0 · approved scope | built | 7.5–7.7, 11.2–11.3 | Card-users' long-idle session expiry value is not fixed in sources. Handbook avoids a number. |
| 5 | Account leave, return, suspension, closure, credential recovery and admin continuity | 4.0 / 4.1 B0 · approved scope | built | 5.6–5.7, 6.4–6.6, 7.11 | Whether learners can open «Akun saya» is unverified (ALI §9 vs OWR W2.25 L1). Flagged in 5.7. |
| 6 | Teacher membership, class move and school transfer | 4.0 · approved scope | built | 7.9–7.11, 16.7 | What the receiving school's teachers see of earlier results is undetermined (WPA). Known defect: only signed-in learners can be offered for transfer. Both flagged in 7.10. |
| 7 | Studio content and question authorship, review and release | 4.0 / 4.1 C1w · approved scope | built | 10.2–10.7 | — |
| 8 | Teaching, assignment, learning and Uji Cepat | 4.0 · approved scope | built | 9.3–9.7, 11.4–11.8 | Assigning verb unresolved in Terminology v1 (Tugaskan / Siapkan / Sediakan). Handbook follows code: «Sediakan». |
| 9 | Assessment sitting and teacher controls | 4.0 / 4.1 A1 · approved scope | built·pending review | 9.8–9.9, 11.7, 11.10 | Attempt counts (Pemetaan Awal 1, Uji Penguasaan 2) come from the A1 batch page. Confirm. |
| 10 | Recovery and single writer | 4.1 A3 · approved scope | not built | 9.11, 11.11, 16.3 | Screens and steps are described only as intended experience. Today two devices can write to one attempt; residual risk accepted in 4.0. |
| 11 | Scheduled maintenance | 4.1 A2b · approved scope | built·pending review (merged 17 Nov per repo history) | 5.8, 7.12, 11.10, 16.3 | R-C applied: no duration-based refusal, only the T−15 rule. SR C7 text is superseded. |
| 12 | Emergency containment | 4.1 A2a · approved scope | built·pending review | 5.8, 6.7, 16.3 | Platform and school scope in 4.0. Class scope and containment rules in 4.1. |
| 13 | Wrong-key correction, results and current report inputs | 4.1 C1w · approved scope | built·pending review | 9.10, 10.8, 16.2 | The learner now sees the corrected result marked «Dihitung ulang». This supersedes the earlier "learner page keeps the original" note. |
| 14 | Certificate issuance, verification and review | 4.0 / 4.1 · approved scope | built | 11.9, 13, 7.15 | Predikat per D-121 (Cukup ≥ 70, Baik ≥ 80, Sangat Baik ≥ 90), not OR6 alternative 1b. Five public fields per ADR10/13. |
| 15 | Reporting, referrals, accountability and printed reference | 4.0 / 4.1 B1–B2 · approved scope | built·pending review | 8.4–8.6, 9.6, 7.16, 18.2 | Sufficiency minimums: class 5, school 10, misconception 5, item 30. |
| 16 | Professional learning and support | 4.0 · approved scope | built | 12, 5.10 | "Facilitator" is a Guru scoped to a PD place, not a role. |
| 17 | Misconception reviewer notes | 4.1 C2w · approved scope | not built | 10.9 | Screens not defined. Coded notes (R-3) are outside current scope. |
| 18 | AI provider evaluation and item drafting | 4.1 E + C3w · approved scope | not built | 3.3, 10.10, 16.9 | Provider not selected. Owner decision and limits required. No screens or wording yet. |
| 19 | Exam Mode | 4.2 · deferred | n/a | 9.12, 11.14, 16.3 | Exam conditions to be defined in the 4.2 plan. |
| 20 | Assessment-specific time limits | 4.2 · candidate | n/a | 9.12, 18.3, App. B | Not approved. R-C does not authorize it. |
| 21 | Positions, acting appointments and two-school roles | 4.2 · deferred | n/a | 4.5, 7.8, 16.4 | H-02 boundaries are described as principles only. |
| 22 | School data export | 4.2 · deferred | n/a | 7.18, 17 | Export always arrives with its own accountability event. |
| 23 | Past reports and period selector | 4.2 · deferred | n/a | 7.18, 14.7 | Distinct from 4.5 as-of reconstruction and from print reference. Explained in 14.7. |
| 24 | Account-request decline and signed-in password change | 4.2 · deferred | n/a | 5.6, 7.18 | — |
| 25 | Professional-development and school-structure corrections | 4.2 · deferred | n/a | 7.18, 12.6 | — |
| 26 | Scheduled Question Health statistics | 4.2 · deferred | n/a | 10.11 | H-05: scheduling ≠ validity. Stated in 10.11. |
| 27 | Retention enforcement | 4.2 · deferred, policy-dependent | n/a | 6.10, 16.8 | R-2 open. |
| 28 | Question Intelligence and comparability | 4.5 · approved direction | n/a | 10.12, 14.3, 14.6 | Name "Kecerdasan Soal" is a working translation. |
| 29 | Competency identity and prerequisite hypotheses | 4.5 · approved direction | n/a | 9.13, 14.4 | R-5 competency anchor pending. |
| 30 | Evidence classification, Performance Distribution and Quiet Intelligence | 4.5 · approved direction | n/a | 3.1, 9.13, 14.2, 14.5 | "Quiet Intelligence" appears nowhere in product code. Indonesian screen name to be decided. "Sebaran Hasil" is a working translation. |
| 31 | Educator protections and governed formal evaluation | 4.5 · approved direction | n/a | 8.9, 14.8, 16.6 | R-1 pending. The handbook gives no screen steps. |
| 32 | Explainable history and snapshot certificates | 4.5 · approved direction | n/a | 13.5, 14.7 | — |
| 33 | WhatsApp sign-in and adaptive staff access checks | 4.5 · carried operational | n/a | 5.11, 14.10 | Provider, cost and security design open. |
| 34 | Educator Growth and Shared Growth Compact | 5.0 · approved direction | n/a | 9.14, 12.6, 15.5 | "Pertumbuhan Guru" and "Kesepakatan Pertumbuhan Bersama" are working translations. |
| 35 | Intervention and follow-up | 5.0 · approved direction | n/a | 9.14, 15.2–15.4, 16.5 | R-4 staggered starts pending. |
| 36 | Server-enforced progression and governed journeys | 5.0 · approved direction | n/a | 11.14, 15.6 | — |
| 37 | Institution-level improvement | 5.0 · approved direction | n/a | 8.10, 15.7 | Broader institution model unassigned. |
| 38 | Share & Learn, Parent Portal and broader QR continuity | Reported 4.5 direction awaiting reconciliation / unassigned | n/a | 13.5, 14.10, 16.10, App. B | Presented only as not established. |

## 2. Other roadmap items

### 2.1 From the 4.1 section

| Item | Version · status | Handbook | Notes |
|---|---|---|---|
| B0 last-admin protection | 4.1 · approved scope | 6.6, 18 | Expiry warnings at 30 and 7 days. Self-renewal by the last platform admin. |
| B1 significant-event accountability (12-month store) | 4.1 · approved scope | 7.16 | "Accountability, not surveillance." |
| B2 print footer and lookup reference | 4.1 · approved scope | 18.2, 7.16 | Certificates keep the QR and carry no footer. |
| Corrections F-1, L-1, S-1, F1-R1b, L1-F2, L1-F4 | 4.1 · approved scope | 10.8 (F1-R1b stale explanations withdrawn); 5.3 (uniform refusal) | Internal identifiers are not shown to readers. |
| Z integrated acceptance; educator walkthrough with Dr Gladys | 4.1 milestone | Reviewer note; App. A preamble; 2.2 | Not a feature. The handbook says 4.1 is accepted with educators before school use. |
| Cross-cutting: one permission boundary, consistent ID/EN terms, accessible screens and print | 4.1 | 3.5, 5.1, 18.1 | — |

### 2.2 From the 4.2 section

| Item | Version · status | Handbook | Notes |
|---|---|---|---|
| Deferred past 4.2: school closure, broader multi-school foundations, family deletion, school adaptation of platform content | Deferred, version open | 6.2, 6.3, 7.18, App. B | — |
| Extra 4.2 deferrals in OD §4 and EP §4, not in RM's eight: rename school, add one person outside import, name correction after activation, reactivate or move class, undo rollover, end a PD programme or remove a participant, school ending its own PD sittings, handover view | 4.2 per OD/EP | 6.2, 7.3, 7.5, 7.11, 7.14, 12.6 | **Verify against the official 4.2 plan.** RM lists eight groups; OD §4 lists more granular items. The handbook marks them "[Perlu konfirmasi]" in 7.18 and 12.6. |
| Institutional Architecture Dependency | Open decision | 8.10, App. B | — |

### 2.3 From the 4.5 section

| Item | Version · status | Handbook | Notes |
|---|---|---|---|
| Early 4.5 verification of Question Health defects (RD-4) | 4.5 | 10.11, 14.3 | Described in reader terms, without defect identifiers. |
| Quiet Intelligence usefulness evaluation | Proposed | 14.5, App. B | — |
| 4.5 exclusions (behaviour tracking, AI causal claims, automated judgments, failure prediction, cross-school comparison) | 4.5 · approved direction | 14.9 | — |

### 2.4 From the 5.0 section

| Item | Version · status | Handbook | Notes |
|---|---|---|---|
| Improvement cycle and the three claims | 5.0 · approved direction | 15.2–15.3 | — |
| 5.0 exclusions (growth rankings, autonomous adaptive paths, general workflow composer, user dashboards) | 5.0 · approved direction | 15.6, 15.9 | — |

### 2.5 Beyond 5.0 and internal work

| Item | Version · status | Handbook | Notes |
|---|---|---|---|
| Beyond-5.0 research horizon | Research | App. B | — |
| Contextual Intelligence | Possible 6.0 research, no commitment | App. B | — |
| Post-4.1 codebase rationalisation and performance audit | Required after 4.1 acceptance (internal) | App. A | Not user-facing. One paragraph only. |

### 2.6 Bob's earlier list (RM disposition table)

All 19 rows are covered in App. B, 4.5, 7.18, 9.12, 10.12, 14.5 and 15.6. Covered rows:

- eight operational deferrals;
- time limits;
- WhatsApp;
- Question Intelligence;
- Performance Distribution;
- adaptive checks;
- Continuous PINTAR;
- QR continuity;
- Composer;
- new analytics;
- Parent portal;
- broader institution model;
- Report Intelligence and dashboards (replaced by QI: 14.5);
- question weighting;
- conversational drill-down and plugin API;
- theming;
- school closure group;
- Local Experience Layer and small-class privacy aggregation.

## 3. Integrated journeys (RM Appendix B)

| Journey | Handbook | Notes |
|---|---|---|
| A · Complete school lifecycle | 7.1, 16.1 | Rollover follows the built 3-step flow. The older KK-REP one-class form is not used. |
| B · Assessment to intelligence | 16.2 | H-01 correction propagation to derived outputs flagged "[Perlu konfirmasi]". |
| C · Assessment interruption | 16.3 | — |
| D · Role changes | 16.4 | — |
| E · Evidence to improvement | 16.5 | — |
| F · Formal evaluation and Growth | 16.6 | — |
| G · Transfer and historical continuity | 16.7 | Post-transfer visibility flagged. |
| H · Retention and reconstruction | 16.8 | — |
| I · AI draft to longitudinal intelligence | 16.9 | — |
| J · External access | 16.10 | — |

## 4. Owner decisions referenced (RM "Owner decisions and gates")

| Decision | Where reflected | Handbook stance |
|---|---|---|
| R-1 Formal evaluation policy | 8.9, 14.11 | No screen steps until decided. |
| R-2 Educational-evidence retention, deletion and pseudonymization | 6.10, 14.11, 16.8 | Principles only. |
| R-3 Structured misconception annotation | 10.9, App. B | Outside current scope. |
| R-4 Staggered intervention starts | 15.4 | Principles only. |
| R-5 Competency anchor | 10.12, 14.4 | Investigation described. |
| 4.1 provider evaluation (E) and C3w entry | 10.10 | Provider not chosen. |
| 4.2 plan | 7.18, App. A | List marked for confirmation. |

## 5. Items to verify before Draft 02

1. **Roles for a principal.** PINTAR has no «Kepala sekolah» role. Decide the recommended role for a principal (Dekan at school scope? Admin sekolah?) and the handbook wording (4.3).
2. **Brief's role list vs product roles.** The assignment named seven user categories. The product has six roles. The handbook explains "Pimpinan Sekolah", "Peninjau" and "Fasilitator" as responsibilities within existing roles (4.2–4.3, 10.2, 12.3). Owner to confirm this treatment.
3. **Terminology choice.**
   - The handbook follows Terminology v1 (D-068): «murid», «Guru», «Sekolah», «Anda».
   - The public website draft uses «peserta didik» and «pendidik». The brief also used «Siswa / Peserta Didik» and «Guru / Pendidik».
   - Decide one vocabulary for public material, then align the handbook and the website.
4. **Working names for 4.5/5.0 concepts.** Quiet Intelligence, Kecerdasan Soal (Question Intelligence), Sebaran Hasil (Performance Distribution), Pertumbuhan Guru (Educator Growth), Kesepakatan Pertumbuhan Bersama (Shared Growth Compact). None exists in code. Approve Indonesian names.
5. **Attempt counts.** Pemetaan Awal 1, Uji Penguasaan 2 (9.4, 11.7). Confirm in the accepted 4.1 build.
6. **Learner access to «Akun saya»** (5.7). Sources conflict.
7. **Pass-mark default and certificate predikat thresholds.** Confirm D-081 (no default) and D-121 (70/80/90) are final.
8. **Report band thresholds and sufficiency minimums** (8.4–8.5). Confirm that the D-095 bands and RAM D6/D7 minimums are current.
9. **Transfer details** (7.10). Confirm what the receiving school sees of earlier results, and whether the defect "only signed-in learners can be offered" has been fixed.
10. **Learner "Belum mengerjakan Uji Penguasaan" state.** Ruled BUILD (D-121(c)); no completion evidence found. Not mentioned in the handbook.
11. **A2b final evidence.** Maintenance wording is taken from merged code (A2b merged 17 Nov). Daisy's screen review and exact-candidate acceptance are pending. Re-check the wording at Z.
12. **C2w, A3 and C3w screens.** Not built. Sections 9.11, 10.9, 10.10 and 11.11 describe intended experience only. Rewrite with verified steps after the build.
13. **4.2 granular list** (Section 2.2 above). Reconcile with the official 4.2 plan.
14. **Production school-founding path** (6.2). Pending owner decision.
15. **Strings marked "pending Dr Gladys" or "Daisy's draft" in `hle.ts`** may still change. Re-run a wording check against `hle.ts` before Draft 02.
16. **Existing internal FAQ.** `docs/product/handbook/PERTANYAAN-SEKOLAH-DRAF-1.md` (100 school questions; at least one passage known to be stale) was not reused. Reconcile it with this handbook's Chapter 17.
17. **"Ruang Peragaan" (demonstration room) and «Umpan balik» (feedback rounds)** exist in code but not in the roadmap. Omitted from the handbook pending a decision on whether they are user features to document.
18. **Product photos and screenshots.** None used. Add authentic screenshots with sample data after 4.1 acceptance (App. D).

## 6. Contradictions found in sources (not resolved silently)

| Topic | Sources | Handbook follows |
|---|---|---|
| Maintenance "cannot finish before window" rule | SR C7 vs R-C (16 Nov) and the A2b header | R-C: T−15 start rule only. |
| Learner page after key correction | C1w "Truths" vs O41-21 and C1W-F1 | O41-21: corrected result shown and marked. |
| Exam Mode, positions and walkthrough date in 4.1 | SR (9 Nov) vs OD O41-7/8/9 | OD: 4.2; walkthrough forecast only. |
| Shared-computer idle timing | ID C4 (60 min) vs T1 | T1: 5-minute lock. |
| Certificate predikat | OR6 alternative 1b vs D-121 alternative 4 | D-121. |
| Rollover and transfer as P2 | SI vs owner lifecycle ruling (ALI §5b) | Lifecycle is essential in 4.0 (built). |
| Management assigning training; teachers creating Uji Cepat questions | CAT MGT-J07 and EDU-J19 vs OR T3 and T2 | Rulings T3 and T2. |
| Security notices to school admins | SI J2.13 vs C1w key-correction notice | The handbook calls it a notice in «Yang menunggu», not a security notice. |
| GAP-4.0 items (withdraw assignment, certificate reissue) | ACI (9 Nov) vs OWR W2.21–25 and WPA §2 | Later records: implemented. |
| 4.2 operational list location | RM notes that the completion-folder owner record is unavailable | Uses RM's eight groups plus OD/EP granular items, flagged. |

## 7. Self-review summary

- **Coverage.** All 38 Appendix A features, all 10 integrated journeys, all 19 disposition rows and every 4.5/5.0 numbered item have an identifiable place.
- **Status discipline.** Each feature carries a version and status tag (〔4.0〕, 〔4.1〕, 〔4.2 · direncanakan/usulan〕, 〔4.5 · arah〕, 〔5.0 · arah〕, 〔belum ditetapkan〕). 4.2–5.0 sections describe the intended experience with no invented screens. Unbuilt 4.1 items (C2w, A3, C3w) are marked "[Perlu konfirmasi]".
- **Cross-references.** Every in-text and table reference was checked mechanically against the existing section headings.
- **Internal identifiers.** No batch IDs, migration numbers or commit hashes appear in reader-facing text. They appear only in this file.
- **Philosophy.** Each principle in brief §7 is illustrated by at least one situation:
  - evidence before conclusions: 3.1, 8.5, 14.2;
  - educator judgement: 3.2, 9.6, 14.6;
  - AI assists, humans decide: 3.3, 10.10;
  - improvement over ranking: 3.4, 8.9, 15.5;
  - respect for users: 3.5, 5.6–5.7, 6.5;
  - continuity and fairness: 3.6, 6.7, 10.8, 16.3.
- **Separation of evidence types.** Academic learning, professional development, formal evaluation and private educator growth are kept apart: 12.1, 12.5, 12.6, 8.9, 15.5 and 16.6.
- **Known weaknesses of Draft 01.**
  - Chapter 9 and Chapter 10 overlap slightly on key correction (9.10 vs 10.8). This is deliberate, by reader.
  - The FAQ (17) is short. It should grow from the existing 100-question internal draft once reconciled.
  - Indonesian prose has not yet had a native-speaker edit for regional naturalness.
