# PINTAR Handbook · Feature coverage map

**Working file for editorial checking. Not part of the reader-facing handbook.**

- Handbook: `PINTAR-BUKU-PANDUAN-LENGKAP-DRAFT-01.md` (Draft 01a, 17 Nov 2026: Draft 01 revised after Bob's companion note and his follow-up answers; about 25,600 words)
- Additional sources after Bob's note:
  - `OWNER-RULINGS-4.1.md` rulings 38–46 (4.1 master-plan branch);
  - `X1-PANDUAN-AI-EKSTERNAL.md` and `DESAIN-AWAL-4.1.md` (branch `ux-1/daisy-experience`).
- Planning reference: *PINTAR Consolidated Roadmap 4.0–5.0, Revision 3*, 16 Nov 2026 ("RM"). For 4.2 the handbook now follows the copy on the 4.1 master-plan branch (`docs/roadmap/`, document control 3.3), which carries the **Rev 3.1 correction of the 4.2 inventory** (owner-approved 16 Nov).
- `docs/roadmap/DECISIONS-TO-TRACK.md` (4.1 master-plan branch): version assignments still open (retention enforcement unassigned; external-AI import X-2/X-3/X-4 as 4.2 candidates; billing screens unassigned; R-2 before production data).
- Account set-up after the upgrade: migration `20261021100000_an_identity_foundation.sql` (`account_setup` REQUIRED for every existing EMAIL account; class cards have none) and `src/app/aktifkan/page.tsx` (a REQUIRED account is held on the page until set-up finishes). Confirmed by the production-upgrade rehearsal (`docs/completion-4.1/rehearsal/PRODUCTION-UPGRADE-REHEARSAL.md`, 4.1 master-plan branch): one REQUIRED row for every EMAIL account that is not an evaluation persona, **staff and learners alike**; the rehearsal recommends a release note.
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

**Status column.** This uses the release-status labels from Bob's companion note of 17 Nov.

| Status | Meaning |
|---|---|
| **ON STAGING** | Built, on staging, not yet released. Covers 4.0 and the accepted 4.1 parts. |
| **IN DEVELOPMENT** | The rest of 4.1. |
| **PLANNED** | 4.2; scope still being confirmed. |
| **APPROVED DIRECTION** | 4.5 and 5.0; not yet planned in detail. |
| **CANDIDATE / DEFERRED / OPEN** | Exactly as the roadmap labels them. |

Production is still on the September 2026 version and has received neither 4.0 nor 4.1.

**Other columns.**
- **Screen** gives the route under `src/app/` on `origin/main`, or "no screen yet".
- **Terms** gives the terminology source:
  - hle = `src/lib/hle.ts` strings;
  - T1 = Terminology v1 freeze package (D-068);
  - RM = roadmap wording, used where no product term exists yet.
- **Check** is **verified** (wording and steps traced to code or rulings) or **needs confirmation**, followed by what is missing.

## 1. Individual features (RM Appendix A, in register order)

| # | Feature | RM section | Status | Screen | Terms | Handbook | Check |
|---|---|---|---|---|---|---|---|
| 1 | Platform operation and school provisioning | 4.0 · Operational lifecycle | ON STAGING | operator workflow; `konfigurasi` | hle, T1 | 6.2, 16.1 | needs confirmation: the production school-founding path awaits an owner decision (OWR W2.20). |
| 2 | School structure, year and class administration | 4.0 | ON STAGING | `konfigurasi/[bagian]` | hle, T1 | 7.3, 7.14 | verified |
| 3 | Staff provision, activation and sign-in | 4.0 | ON STAGING | `pendataan`, `aktivasi`, `aktifkan`, `masuk` | hle | 5.2–5.3, 7.5–7.6 | verified: every existing email account completes set-up once at next sign-in after the upgrade and is held on «Aktifkan» until done (migration `20261021100000`, `aktifkan/page.tsx`, Bob's rehearsal). Written into 5.2 and the Bab 18 table. Bob (c): this is a 4.0 identity feature (migration `20261021100000`; completed through activation, `20261112100000`). The wizard shows only the missing steps (`WizardAktivasi`: completion needs username, password, PIN and name confirmation; a step already done is skipped). Still open: which steps an upgraded account typically has left, e.g. whether a new password is required. Recovery thresholds in the same file stay out of the handbook. |
| 4 | Learner enrolment, class cards and access | 4.0 | ON STAGING | `aktivasi`, `masuk` (card), `terkunci`, `perangkat` | hle | 7.5–7.7, 11.2–11.3 | verified (thresholds deliberately omitted). |
| 5 | Account leave, return, suspension, closure, credential recovery and admin continuity | 4.0 / 4.1 B0 | ON STAGING | `akun`, `masuk/lupa`, `masuk/buka-kembali`, `konfigurasi/keamanan`, `konfigurasi/staf` | hle | 5.6–5.7, 6.4–6.6, 7.11 | needs confirmation: learner access to «Akun saya» (ALI §9 vs OWR W2.25). |
| 6 | Teacher membership, class move and school transfer | 4.0 | ON STAGING | `konfigurasi` (Pindah kelas, Perpindahan murid) | hle | 7.9–7.11, 16.7 | needs confirmation: post-transfer visibility; the transfer-offer defect. |
| 7 | Studio content and question authorship, review and release | 4.0 / 4.1 C1w | ON STAGING | `studio`, `studio/unggah`, `studio/paket/[course]`, `studio/tinjau`, `studio/bank`, `studio/kanonik` | hle, T1 | 10.2–10.7 | verified |
| 8 | Teaching, assignment, learning and Uji Cepat | 4.0 | ON STAGING | `mengajar/...`, `belajar/...` | hle, T1 | 9.3–9.7, 11.4–11.8 | needs confirmation: the assigning verb is open in T1 (handbook uses «Sediakan» from code). |
| 9 | Assessment sitting and teacher controls | 4.0 / 4.1 A1 | ON STAGING (accepted 4.1 part) | `mengajar/[kelas]/siapa` («Atur»), `konfigurasi/kesempatan` | hle | 9.8–9.9, 11.7, 11.10 | needs confirmation: attempt counts per assessment type. "Attempts count across versions" is verified (ruling 46). |
| 10 | Recovery and single writer | 4.1 A3 | IN DEVELOPMENT | no screen yet | RM | 9.11, 11.11, 16.3 | needs confirmation: screens and steps. |
| 11 | Scheduled maintenance | 4.1 A2b | IN DEVELOPMENT (merged 17 Nov; acceptance pending) | `konfigurasi` (Pemeliharaan dan pengumuman), `pemeliharaan` | hle | 5.8, 7.12, 11.10, 16.3 | needs confirmation: final wording after Daisy's screen review. |
| 12 | Emergency containment | 4.1 A2a | ON STAGING (accepted 4.1 part) | `konfigurasi`, `pemeliharaan` | hle | 5.8, 6.7, 16.3 | verified |
| 13 | Wrong-key correction, results and current report inputs | 4.1 C1w | ON STAGING (accepted 4.1 part) | `studio/tinjau/kunci/[koreksi]`, `belajar/[tugas]/hasil` | hle | 9.10, 10.8, 16.2 | verified |
| 14 | Certificate issuance, verification and review | 4.0 / 4.1 | ON STAGING | `belajar/[tugas]/sertifikat`, `konfigurasi/sertifikat`, `verifikasi/[token]` | hle | 11.9, 13, 7.15 | needs confirmation: D-121 predikat thresholds are final. |
| 15 | Reporting, referrals, accountability and printed reference | 4.0 / 4.1 B1–B2 | ON STAGING (B1/B2: result reviews pending) | `edukator/ringkasan`, `dekan/ringkasan`, `pimpinan`, `konfigurasi/catatan-masuk` | hle | 8.4–8.6, 9.6, 7.16, 18.2 | needs confirmation: band thresholds and sufficiency minimums are current. |
| 16 | Professional learning and support | 4.0 | ON STAGING | `pengembangan/[simpul]`, `lapor` | hle, T1 | 12, 5.10 | verified |
| 17 | Misconception reviewer notes | 4.1 C2w | IN DEVELOPMENT | no screen yet | RM | 10.9 | needs confirmation: screens. |
| 18 | AI provider evaluation and item drafting | 4.1 E + C3w; rulings 38–44 | IN DEVELOPMENT, NOT QUALIFIED. Optional paid per-school add-on; built in two stages (ruling 42). | no screen yet | RM, rulings 38–44 | 3.3, 10.10, 16.9, 17 | needs confirmation: the ruling that the feature leaves the roadmap if no provider qualifies (asked of Bob). |
| 18b | Own-AI route through the standard workbook | Ruling 41 (C-3); X1 guide | Upload: ON STAGING (4.0 Studio). Guide: published per X1. | `studio/unggah` | X1 (Daisy, 16 Nov), hle | 10.10 | needs confirmation: where the school-facing guide and sample prompts are published. |
| 19 | Exam Mode | 4.2 | PLANNED | no screen yet | RM | 9.12, 11.14, 16.3 | needs confirmation: 4.2 plan. |
| 20 | Assessment-specific time limits | 4.2 | CANDIDATE | no screen yet | RM | 9.12, 18.3, App. B | not approved |
| 21 | Positions, acting appointments and two-school roles | 4.2 | PLANNED | no screen yet | RM | 4.5, 7.8, 16.4 | needs confirmation: 4.2 plan. |
| 22 | School data export | 4.2 | PLANNED | no screen yet | RM | 7.18, 17 | needs confirmation: 4.2 plan. |
| 23 | Past reports and period selector | 4.2 | PLANNED | no screen yet | RM | 7.18, 14.7 | needs confirmation: 4.2 plan. |
| 24 | Account-request decline and signed-in password change | 4.2 | PLANNED | no screen yet | RM | 5.6, 7.18 | needs confirmation: 4.2 plan. |
| 25 | Professional-development and school-structure corrections | 4.2 | PLANNED | no screen yet | RM | 7.18, 12.6 | RM Rev 3.1 item 6 names the sub-items (end a programme, remove a participant, school ending its own PD sittings; reactivate or move a class, rename a school, undo a promotion run). Handbook lists them; [Perlu konfirmasi] removed. Steps await the 4.2 plan. |
| 25a | Add one person outside an import; correct a name after activation | 4.2 | PLANNED (Rev 3.1 item 9) | no screen yet | RM | 7.5, 7.18 | Steps await the 4.2 plan. |
| 25b | "Classes without a teacher" view | 4.2 | PLANNED (Rev 3.1 item 10) | no screen yet | RM | 7.11, 7.18 | Steps await the 4.2 plan. |
| 25c | Teacher's handover view after a colleague leaves | 4.2 | PLANNED (Rev 3.1 item 11, execution plan) | no screen yet | RM | 7.11, 7.18 | Draft 01 merged this with 25b; now separate. |
| 26 | Scheduled Question Health statistics | 4.2 | PLANNED (Rev 3.1 item 7, execution plan) | `studio/bank` (existing Kesehatan soal) | hle | 10.11 | needs confirmation: 4.2 plan. |
| 27 | Retention enforcement | **Unassigned** (Rev 3.1) | OPEN (not in the owner's 4.2 record; R-2 separate) | no screen yet | RM, DECISIONS-TO-TRACK | 6.10, 7.18, 16.8, App. A | Draft 01 marked it 4.2; corrected to 〔belum ditetapkan〕 everywhere. |
| 28 | Question Intelligence and comparability | 4.5 | APPROVED DIRECTION | no screen yet | RM (working translation) | 10.12, 14.3, 14.6 | needs confirmation: Indonesian name. |
| 29 | Competency identity and prerequisite hypotheses | 4.5 | APPROVED DIRECTION | no screen yet | RM | 9.13, 14.4 | open: R-5 |
| 30 | Evidence classification, Performance Distribution and Quiet Intelligence | 4.5 | APPROVED DIRECTION | no screen yet | RM (working names) | 3.1, 9.13, 14.2, 14.5 | needs confirmation: Indonesian names. |
| 31 | Educator protections and governed formal evaluation | 4.5 | APPROVED DIRECTION | no screen yet | RM | 8.9, 14.8, 16.6 | open: R-1 |
| 32 | Explainable history and snapshot certificates | 4.5 | APPROVED DIRECTION | no screen yet | RM | 13.5, 14.7 | — |
| 33 | WhatsApp sign-in and adaptive staff access checks | 4.5 (carried operational) | APPROVED DIRECTION | no screen yet | RM | 5.12, 14.10 | open: provider, cost, security design |
| 34 | Educator Growth and Shared Growth Compact | 5.0 | APPROVED DIRECTION | no screen yet | RM (working names) | 9.14, 12.6, 15.5 | needs confirmation: Indonesian names. |
| 35 | Intervention and follow-up | 5.0 | APPROVED DIRECTION | no screen yet | RM | 9.14, 15.2–15.4, 16.5 | open: R-4 |
| 36 | Server-enforced progression and governed journeys | 5.0 | APPROVED DIRECTION | no screen yet | RM | 11.14, 15.6 | — |
| 37 | Institution-level improvement | 5.0 | APPROVED DIRECTION | no screen yet | RM | 8.10, 15.7 | open: institution model |
| 38 | Share & Learn, Parent Portal and broader QR continuity | 4.5 report / unassigned | OPEN | no screen yet | RM | 13.5, 14.10, 16.10, App. B | open |
| 39 | Guided tour and Help (Tur PINTAR) | Not in RM; exists in code | ON STAGING (4.0) | `tur`, help panel | hle (`tur.*`) | 5.11 | verified (added after Bob's note listed `tur`). |

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
| Later than 4.2 unless ruled in (Rev 3.1 restores all eight): closing or archiving a school; a foundation above several schools; editable year dates and semesters; un-revoking a certificate; restoring a withdrawn release; schools adapting platform content; briefings; learner and family deletion (with counsel) | Deferred, version open | 6.2, 6.3, 7.3, 7.15, 7.18, App. B | "Briefings" is rendered «pengarahan (*briefing*)» with [Perlu konfirmasi] on its meaning. |
| The granular items Draft 01 flagged (rename school, add one person, name correction, reactivate or move class, undo a promotion run, PD corrections, classes without a teacher, handover view) | 4.2 · PLANNED, **resolved by Rev 3.1** (items 6, 9, 10, 11) | 6.2, 7.3, 7.5, 7.11, 7.14, 7.18, 12.6 | 7.18 now lists them firmly; [Perlu konfirmasi] removed from 7.18 and 12.6. Items 7 and 11 are marked *(dari rencana pelaksanaan)*. |
| External-AI import improvements: X-2 paste-friendly route, X-3 question-only import, X-4 self-declared AI field | 4.2 · CANDIDATE (DECISIONS-TO-TRACK; X-2 decided after the walkthrough) | 10.10, App. A | Written as 〔4.2 · usulan〕, not approved. |
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

- the 4.2 operational deferrals (owner record items plus two execution-plan items, per Rev 3.1);
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

## 4b. Role mapping (Bob's note §3)

| System role | Screen name (hle.ts, T1) | Name in Bob's note | Handbook uses | Note |
|---|---|---|---|---|
| STUDENT | «Murid» | Siswa / Peserta Didik | Murid | T1 replaces «siswa» and «peserta didik» with «Murid». |
| EDUCATOR | «Guru» | Guru / Pendidik | Guru | — |
| HEAD_OF_DEPARTMENT | «Kepala departemen» | Kepala Program Studi / Kaprodi | Kepala departemen | **Resolved:** frozen term (Bob, 17 Nov). |
| DEAN | «Dekan» | Dekan | Dekan | No editing capabilities (role_capabilities). |
| INSTITUTION_ADMIN | «Admin sekolah» | Administrator Sekolah | Admin sekolah | **Resolved:** frozen term; T1 rejects "administrator sekolah" (Bob, 17 Nov). |
| SYSTEM_ADMIN | «Admin platform» / «Admin PINTAR» | Administrator Platform | Admin PINTAR | **Resolved:** frozen term (Bob, 17 Nov). |

**Pimpinan.** In the code, «Pimpinan» is the umbrella term and the `/pimpinan` home for both HEAD_OF_DEPARTMENT and DEAN (`pimpinan.ditolak`: «Halaman ini untuk Kepala departemen dan Dekan, dalam lingkup yang mereka pimpin.»). The `/dekan/ringkasan` screen is DEAN's school summary. Bob's note asks which one "Pimpinan Sekolah" maps to. The handbook maps it to **both**, scoped by lingkup. Which role to recommend for a principal is still open (item 0(b) below).

**Capabilities, not roles.**
- Reviewing content in Studio is CAN_REVIEW, held by HoD, Admin sekolah and SYSTEM_ADMIN. The author can never approve their own work.
- Professional development: a Guru learns as a «Peserta». A facilitator is a Guru scoped to a PD place.

## 5. Items to verify before Draft 02

0. **Bob's answers (17 Nov, relayed by the owner).**
   - (a) Role names: **answered.** Use the frozen terms exactly; no ruling needed. The handbook already did.
   - (b) Recommended role for a principal: **answered: do not recommend one.** "Kepala Sekolah" is only a card-design family (D-059(c), a design taxonomy, not a role); no record settles the mapping. 4.3 now states each role's limits (Kepala departemen cannot publish; Dekan holds no editing capability; Admin sekolah cannot read learner results) and carries [Perlu konfirmasi: peran untuk kepala sekolah]. Bob is raising it with the owner.
   - (c) Account set-up after the upgrade: **answered and verified** (row 3). In 5.2 and Bab 18.
   - (d) If no provider qualifies: **answered.** Ruling 44 (16 Nov), `OWNER-RULINGS-4.1.md` line 99 (4.1 master-plan branch), verified: integrated AI-assisted MCQ generation is removed from the roadmap and PINTAR continues with manual authoring and workbook imports; this must not hold up the rest of development. 10.10 now states it; [Perlu konfirmasi] removed.
   - (e) Commit attribution: **answered.** Trailers are fine; the rule covers file contents only.
   - File location `docs/handbook/` on this branch: **confirmed.**
1. **Roles for a principal.** Owner decision pending (raised by Bob). The handbook recommends no role (4.3).
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
13. **4.2 granular list.** Reconciled with RM Rev 3.1 (Section 2.2). Screens and steps still await the 4.2 plan itself.
14. **Production school-founding path** (6.2). Pending owner decision.
15. **Strings marked "pending Dr Gladys" or "Daisy's draft" in `hle.ts`** may still change. Re-run a wording check against `hle.ts` before Draft 02.
16. **Existing internal FAQ.** `docs/product/handbook/PERTANYAAN-SEKOLAH-DRAF-1.md` (100 school questions; at least one passage known to be stale). Principal-related answers were checked (Q021, Q039, the role table near the end and the "who sees what" answer): they agree with the handbook (no principal role; Admin sekolah reads no learner results; nothing compares two educators). A full reconciliation with Chapter 17 is still to do. One gap noted: the FAQ says Kepala departemen can see learners' class feedback («Umpan balik»), which the handbook omits (item 17).
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
| 4.2 operational list | Rev 3 (summary of 13 Nov) vs the completion-folder owner record §4 | **Resolved by Rev 3.1:** the owner record governs. Retention enforcement left 4.2 (unassigned); items 9 and 10 added; items 7 and 11 come from the execution plan. |

## 7. Self-review summary

- **Coverage.** All 38 Appendix A features, all 10 integrated journeys, all 19 disposition rows and every 4.5/5.0 numbered item have an identifiable place.
- **Revisions after Bob's note (17 Nov).**
  - AI drafting reframed as an optional paid add-on, in development and not qualified; own-AI workbook route added.
  - Attempts count across versions.
  - Security thresholds and timings removed.
  - Production status stated.
  - Tour added.
  - Files moved to `docs/handbook/`.
- **Revisions in Draft 01a (17 Nov, after Bob's follow-up).**
  - 5.2: one-time account set-up for existing email accounts after the upgrade; new Bab 18 row; illustration placeholder.
  - 4.2 inventory aligned to Rev 3.1 in the version table (1.6), 7.11, 7.18, 12.6 and Lampiran A; the full later-than-4.2 list of eight.
  - Retention enforcement re-marked 〔belum ditetapkan〕 (6.10, 7.18, Lampiran A).
  - 10.10: external-AI import improvements added as 〔4.2 · usulan〕.
  - Role-name conflicts closed in favour of the frozen terms.
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
