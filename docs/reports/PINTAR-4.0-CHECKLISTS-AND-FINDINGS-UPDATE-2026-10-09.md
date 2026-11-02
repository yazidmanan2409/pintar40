# PINTAR 4.0 · Every checklist and findings list, updated to 9 Oct 2026

**State this update is measured against (verified 9 Oct, about 17:45 UTC):**
- **main = staging = `001a357`.** Staging deployment `dpl_EcwRYkkSG1hGqGjocvmVC6cKAhEg`; **177 migrations**; facts run **37964868797** GREEN.
- **CI 37930520507: 18/18** on 001a357. **Journeys 37930524012: green** (every step, including S23q and BD11 on three browser engines).
- **Golden School walk on staging 001a357: 4/4 green** (school `sekolah-uji-daisy-001a`, runs 37965014304 … 37967468474).
- **Production `5b5b68d`**, untouched; no release since 23 Sep.
- **Staging is FROZEN** for Dr Gladys's second walkthrough. Its state is READY (GO), not yet walked.
- **No item in any list is human accepted.** «CLOSED» below means fixed and CI verified or staging verified, never accepted by a person.

**How this was made.**
- Each list was reconciled item by item against git history, `docs/coordination/DECISIONS.md` (D-118 … D-140), the closure reports, the application pass log and the handoff delta. The reconciliation was read only.
- «Code check» means the current source at 001a357 was read.
- Nothing was re-walked for this update.
- The original lists are **not rewritten**; they keep their history. This file is the current status of each, and each section names its source.

**Status words:**
- **CLOSED**: fixed and machine-verified.
- **PARTIAL**: part is done; the rest is named.
- **OPEN**: not done.
- **HOLD**: held for a ruling.
- **BLOCKED**: waits on something outside engineering.
- **A-ITEM**: deferred by ruling.
- **DECIDED**: a recorded decision, not a defect.
- **SUPERSEDED**: overtaken by a later decision or record.
- **N/D**: not determinable from the records.

---

## Contents

1. Release checklist v2.7 → status on 001a357
2. Closure register (CR-01 … CR-94) and the 7 Oct closure status
3. Handoff open-work list (07, 8 Oct)
4. L3 finding ledger (Core Build audit)
5. UX polish register (UX-01 … UX-47)
6. Dr Gladys findings DG-11, DG-19 … DG-37 and FD-1 … FD-9
7. Login and tour findings
8. Terminology v1
9. Application pass log: RV-1 … RV-24, OP-1 … OP-9, AP-1 … AP-7
10. #150 backup and disaster recovery (B1 … B9)
11. Issues and status of 24 Sep
12. Contradictions found while reconciling
13. Everything still open, by who acts

---

## 1. Release checklist v2.7 → 001a357

**Source:** `docs/coordination/RELEASE-CHECKLIST.md` (v2.7, 6 Oct; data in `docs/coordination/checklist/checklist_data.py`). It was retired as the readiness measure by D-084; its rows remain engineering detail.

**P0 rows: unchanged at 77 of 84 PASS.** No P0 row that was not PASS on 6 Oct has changed. Every remaining P0 gap is a ruling (media), capacity (an owner decision) or a release-day row.

| Section | P0 | PASS | PARTIAL | FAIL | N-T |
|---|---:|---:|---:|---:|---:|
| Student | 15 | 14 | 1 (STU-11 media) | 0 | 0 |
| Educator | 8 | 8 | 0 | 0 | 0 |
| Head of department | 8 | 8 | 0 | 0 | 0 |
| Dean | 5 | 5 | 0 | 0 | 0 |
| School admin | 14 | 13 | 1 (ADM-10 media) | 0 | 0 |
| System admin | 3 | 3 | 0 | 0 | 0 |
| Anonymous and verifier | 5 | 5 | 0 | 0 | 0 |
| Cross-role | 12 | 11 | 1 (X-07 media) | 0 | 0 |
| Capacity | 4 | 0 | 2 (CAP-07, CAP-08) | 1 (CAP-02) | 1 (CAP-01) |
| Universal | 10 | 10 | 0 | 0 | 0 |
| **Total** | **84** | **77** | **5** | **1** | **1** |

### 1.1 Rows not PASS on 6 Oct, now

| Row | Priority | 6 Oct | Now | Evidence or reason |
|---|---|---|---|---|
| STU-08 | P1 | N-T | N-T (rule now tested) | CR-29 closed by test F03-T11 (CI 37489874488, red on three planted defects); no browser walk |
| STU-11 | P0 | PARTIAL | PARTIAL | Media out of scope (D-050, CR-53). RV-8 (a seeded lesson's audio is missing) is OPEN and non-blocking |
| EDU-10 | P1 | PARTIAL | PARTIAL | Ruled by D-120 Q8: the class score first, learners as a drill-down. **CR-27 is not built** |
| EDU-11 | P2 | N-I | A-ITEM | D-120 QN3: after go-live (CR-28) |
| **EDU-13** | P2 | N-T | **PASS** | CR-35, journey S26d (37487347244); journeys green since |
| HOD-06 | P2 | BLOCKED | BLOCKED | CR-36 needs 30 answers per question; outside the gate |
| DEA-04 | P2 | PARTIAL | PARTIAL | Decision queue walked (CR-38, S23r); W-2/CR-76 closed. Briefings ruled HIDE for 4.0 (D-120 QN4). **CR-37 has no commit recording the hiding** |
| ADM-08 | P1 | PARTIAL | PARTIAL | CR-13 works on the server and its route (four choices confirmed by D-122(1)); **there is no button**. CR-14 name correction has no screen |
| ADM-10 | P0 | PARTIAL | PARTIAL | D-050 |
| **ADM-17** | P2 | N-T | **PASS** | CR-40, S23t (37487347244); RV-6 fixed (44cebee) |
| ADM-18 | P1 | PARTIAL | PARTIAL | CR-01 (number) and CR-02 (seal) done (07d1c4a). Open: CR-03/04 (frozen design, A4 print) and CR-05 (revocation screen) |
| ADM-19 | P2 | PARTIAL | PARTIAL | CR-41 / OP-4: named selects built; the destination school needs a cross-school directory (an authorization decision). RV-18 open |
| SYS-02 | P1 | PARTIAL | PARTIAL | CR-48 waits on the owner's Q11 |
| SYS-05 | P2 | PARTIAL | PARTIAL | Ruled by D-120 Q7; CR-51 closed in code (bcc3b7a, F20-K01); not walked. The Bab 1 re-import on staging is not recorded as done |
| **SYS-07** | P1 | N-T | **PASS** | CR-39, S23j (37487347244); Jejak audit in words (DG-11) |
| SYS-08 | P1 | FAIL | FAIL | CR-69: a second production SYSTEM_ADMIN, to be named by the owner |
| X-07 | P0 | PARTIAL | PARTIAL | D-050 |
| CAP-01 | P0 | N-T | N-T | CR-67 waits on D-089 and the forwarding key (D-092(c)) |
| CAP-02 | P0 | FAIL | FAIL | L1 NOT MET on Micro (36964437916); not re-run |
| CAP-07, CAP-08 | P0 | PARTIAL | PARTIAL | The compute tier decision (D-089) |
| CAP-03 … CAP-06 | onboarding | N-T | N-T | Onboarding gates |
| CAP-09 | P1 | PARTIAL | PARTIAL | Efficiency items are the owner's (§11.2 of the complete status) |
| CAP-10 | onboarding | N-I | N-I (uncertain) | Some staff lists paged (L4; D-137). The platform admin's school list is not found paged |
| U-EMPTY | P1 | PARTIAL | PARTIAL | CR-46 open; RV-9 («(0/5)» unexplained) open |
| U-RECOVER | P1 | PARTIAL | PARTIAL | As ADM-08 |
| REL-02 | release | FAIL | FAIL | Not every P0 passes; zero operator steps on release day (CR-72) |
| REL-08 | release | PARTIAL | PARTIAL | Production SMTP password, Gate 8 settings, SPF/DKIM/DMARC (CR-70) |
| REL-09 | release | NOT VERIFIED | NOT VERIFIED | #150 B3–B9 (CR-12) |
| REL-12 | release | N/A | READY, not walked | Postponed by D-118. Staging READY and frozen on 001a357 (D-140); nothing is human accepted |
| REL-13 | release | PARTIAL | PARTIAL (owner part only) | CR-44 closed (S23l). The report form names the page in words (RV-1). Left: name the support tiers (CR-71) |

### 1.2 PASS rows still PASS but with out-of-date wording (no regression found)

- **REL-01, REL-03** cite CI 37430770665 and 165 migrations. Now: CI 37930520507 and 177 migrations.
- **ADM-18, X-09** cite the old `PINTAR/SEKOLAH/…/YYYY/n` number. CR-01 retired it, and the Studio layout picker is gone (CR-06).
- **ADM-12:** the national library is now offered to the platform admin only (CR-51).
- **U-CONTEXT, HOD-01:** Studio now follows the working context (L3), and the staff shell is the left navigation (application pass step 3).
- **DEA-02, SYS-03:** «signs in by the email link» is out of date. Staff sign in with codes and password (Gates 3 and 4).
- **HOD-09, EDU-12:** the figures predate CR-47/CR-81 (assessed populations).
- **HOD-07, X-11:** the integrity flow now names learners (W-1), and the referrer cannot decide (CR-76).
- **Copy quoted in rows** predates Terminology v1. For example, «Aturan Penilaian» is now «Aturan Asesmen».
- **The header** still reads «Dr Gladys walks 7 Oct»; D-118 postponed that.
- `checklist_data.py` `RETIRED_NOTICE` points to PHASE-1-STATUS.md, while the rendered file points to RECOVERY-BOARD.md.

---

## 2. Closure register (6 Oct) and closure status (7 Oct)

**Sources:** `docs/reports/PINTAR-4.0-CLOSURE-REGISTER-2026-10-06.md`, `PINTAR-4.0-CLOSURE-STATUS-2026-10-07.md`. The register's own progress log stops at D-132; later states come from the L3/L4 reports and D-133 … D-140.

| ID | Item | Recorded | Now | Evidence |
|---|---|---|---|---|
| CR-01, CR-02 | Certificate number `<PINTAR ID>/<seq>`; sealed at issuance | closed batch 3 | CLOSED | 07d1c4a |
| CR-03, CR-04 | Certificate as designed; one A4 page | A (Daisy) | **OPEN** | Waits on CR-56 and the physical print proof |
| CR-05 | Certificate revocation screen | A | **OPEN** | Code check: no caller of `revoke_certificate` in `src/` |
| CR-06 | Raw layout picker | A | CLOSED | L2 0387286 |
| CR-07 | Student's own profile photo screen | A (last) | **OPEN** | Code check: none |
| CR-08, CR-09 | Public verification; one certificate per learner | closed | CLOSED | register |
| CR-10 | Stale journey-log note | batch 0 | CLOSED | 81c4dca |
| CR-11 | Verification domain DNS | D | **OPEN** (release day) | — |
| CR-12 | Key escrow | D (#150 B5) | **BLOCKED** | #150 NOT PASS |
| CR-13 | Correct a wrong staff email | closed on server and route | **PARTIAL** | ef7929c; four choices confirmed by D-122(1); **no button** |
| CR-14 | Name correction screen | A | **OPEN** | Code check: no `correct_person_name` caller |
| CR-15 | Username correction without SQL | D (operations) | **OPEN** | Deferred to the educator pilot gate |
| CR-16, CR-17 | New learner after a chapter; staff shared computer | batch 0 | CLOSED | Run 37466487118 (handoff 02 still says CR-17 was not walked; that is stale) |
| CR-18, CR-19, CR-20 | Resend countdown; persona exclusion; security notices | B | CLOSED | f788a32, a1dd46d |
| CR-21 | Staff Digital Card final | A (Daisy) | **OPEN** | CR-56; physical proof |
| CR-22 | Identity emails to the final standard | A (Daisy) | **OPEN** | No later record |
| CR-23 | Leaked-password supersede | C | CLOSED | recorded |
| CR-24, CR-25 | Staff transition rehearsal; magic link on production | D | **OPEN** (release) | Production still 5b5b68d |
| CR-26 | Activation-order wording | A docs | CLOSED | batch 0 |
| CR-27 | Uji Cepat score display | A (ruled Q8) | **OPEN** | Not built |
| CR-28 | Teacher changes a window | C | A-ITEM | After go-live (D-120 QN3) |
| CR-29 | Pause and resume | B | CLOSED | 1e0415f (F03-T11) |
| CR-30 | Answers kept through network loss | B → batch 6 | **OPEN** | Batch 6 regression not run |
| CR-31 | Second attempt | C | HOLD | D-112(b) |
| CR-32, CR-33, CR-35 | Walk assertions; audit run; «what next» | B | CLOSED | batch 0; 37487347244; 0be779b |
| CR-34 | Uji Cepat as a Level 3 walk | A | **OPEN** | Waits on CR-27 |
| CR-36 | Question Health | outside the gate | A-ITEM | P2, needs data volume |
| CR-37 | Briefings surface | ruled HIDE for 4.0 | **OPEN** | No commit records the hiding |
| CR-38 … CR-40, CR-42 … CR-45 | Decision queue, audit reader, templates, class move, rollover, «Laporkan masalah», error reference | B | CLOSED | 0652d21; 37487347244; d530711 |
| CR-41 | Transfer between schools | A | **PARTIAL** | OP-4: named selects; the cross-school directory is an authorization decision |
| CR-46 | Honest empty states | A | **OPEN** | RV-9 |
| CR-47 | «Not yet» band; grade labels | A | CLOSED | 4b72ceb; D-121 |
| CR-48 | Cross-school admin sign-in facts | C (Q11) | **OPEN** | Q11 ruling not found |
| CR-49 | Platform admin paging | D | **PARTIAL** | Some lists paged in L4 |
| CR-50 | Misconception linkage | A | CLOSED | a83b9a3; 37547178658 |
| CR-51 | PINTAR standard content | A | CLOSED (with residuals) | bcc3b7a. The Bab 1 re-import is not recorded; the second admin is CR-69 |
| **CR-52** | Bank Soal filter, key and reasons (S23q) | A, governed exception | **CLOSED** | D-137; 4693d4d/894ae01; journeys 37876329363 (76/0), green in every run since |
| CR-53 | Media | E | A-ITEM | D-050 |
| CR-54 | UI/UX application pass | A | **PARTIAL** | D-138: steps 1–3 on staging; 4a–4f PARTIAL; 5 built (§9) |
| CR-55 | Owner walks J1–J7, stripe test | A (owner) | SUPERSEDED | Absorbed into Daisy's freeze (D-135/D-136); not human acceptance |
| CR-56 | Wordmark font licence | A (owner) | **BLOCKED** | OP-3 |
| CR-57 | Educator-as-learner polish | A | **OPEN** | Part of 4a |
| CR-58 | U-PERF re-measured | B | **OPEN** | — |
| CR-59 | Universal rules by regression | B | **OPEN** | Batch 6 not run |
| CR-60 … CR-65 | GS-00, GS-16, step map, cadence, CI gate, budget | C | CLOSED | batch 0; D-120; D-121 |
| CR-66 | #150 backup/DR | D | **BLOCKED** | NOT PASS, B3–B9 |
| CR-67 | Capacity | D | **BLOCKED** | D-089 |
| CR-68 … CR-74 | Upgrade rehearsal, break-glass and second admin, production email, support tiers, REL-02, mail capacity, legal | D | **OPEN** | No later record |
| CR-75 | Integrity review names people | A | **PARTIAL** | Names shown (L4); labelled note and review state not verified |
| CR-76 | Separation of duties | batch 3b | CLOSED | CI 37549911642; D-124 |
| CR-77 | Referrer sees the outcome | A | **OPEN** | No closure record |
| CR-78 | «Laporan saya» reachable by navigation | A | **OPEN** | Code check: reached only by redirect |
| CR-79 | Audit trail in words | A | CLOSED | DG-11; 8851988 → 001a357 |
| CR-80, CR-81, CR-82 | Templates truthful; populations; regenerated chapters | closed | CLOSED | D-123(6); batch 3b; 37547178658 |
| CR-83 | Working Context | A | CLOSED | L3; D-133 |
| CR-84 | Uji Cepat form contract | L2 | CLOSED | 0387286 (residual: RV-14) |
| CR-85 | Human interface boundary | A | CLOSED | L4 (D-136); RV-1/RV-2 batch A (residual: RV-15, OP-5) |
| CR-86 | Credential privacy | L1 | CLOSED | 8ee3585 |
| CR-87 | Studio roles | L2 | CLOSED | 0387286 |
| CR-88 | Collection pattern, content grammar | A | **PARTIAL** | Engineering L4 GREEN; design part in the application pass |
| CR-89 | FD-4 … FD-9 | L2–L4 | CLOSED | FD-4 partial at scale (§6) |
| CR-90 | Browser session after sign-out | L1 | CLOSED | 37581007813; L3 C5 |
| CR-91 | Class-card trust boundary | HELD | **HOLD** | D-131, D-133(h); an owner/security ruling |
| CR-92 | «Komputer siapa ini?» default | open | CLOSED | D-137; CR92-P01 |
| CR-93, CR-94 | 320 px overflow | corrective | CLOSED | 36c89dd |

---

## 3. Handoff open-work list (07, written 8 Oct)

**Source:** `docs/handoff/codex-2026-10-09/07-OPEN-WORK-AND-BLOCKERS.md`.

| ID | Item | 8 Oct | Now |
|---|---|---|---|
| S1 | Answer keys in the repository (`docs/onboarding/`) | fact, not ruled | **OPEN**: an owner/security question |
| S2 | CR-91 | held | **HOLD** |
| S3 | SYSTEM_ADMIN may grant any school role | not a defect | DECIDED (D-133(e)) |
| S4 | #150 B3–B9 | NOT PASS | **BLOCKED** |
| S5 | CR-13 four choices | open | CLOSED by D-122(1). The button is still open (CR-13) |
| P1 | S23q / CR-52 | «fails in every run» | **CLOSED** (D-137; see §12) |
| P2 | CR-92 | open | CLOSED (D-137) |
| P3 | L4 finding 6: Peran & akses paging | open | CLOSED (D-137, L4F6-K01) |
| P4 | CR-41 transfers | open | **PARTIAL** |
| P5 | «penilaian akhir» row A9 | open | CLOSED (8cfe97e) |
| §3 | Daisy's screens: CR-03/04, 05, 07, 14, 21, 22, 27/34, 37, 46, 57, 49 | open | **OPEN**, except CR-06 CLOSED and CR-49 PARTIAL |
| §4 | CR-54 application pass | not begun | **PARTIAL** (D-138) |
| §4 | Copy owed; Terminology v1 | open | CLOSED with residuals OP-5/6/7 |
| §4 | CR-56; physical proof | open | **BLOCKED** |
| §4 | Design System page republish | open | N/D |
| §5 | NVDA/TalkBack pass | open | **OPEN** |
| §5 | 44 px guard | open | **PARTIAL** (Radio/Checkbox rows not done) |
| §6 | Full regression | not run | **PARTIAL**: CI and journeys green on 001a357; CR-30/58/59 not run |
| §6 | Human acceptance | none | **OPEN** |
| §6 | Production at main's code | no | **OPEN** (669 files differ) |
| §6 | Real-app 50-student test | not done | **OPEN** |
| §8 | CI beyond 1,900 | owner | CLOSED (D-137, D-139) |
| §8 | Declare the UI/UX stage | owner | CLOSED (D-138) |
| §8 | Production release (Gate 8) | owner | **OPEN** |
| §8 | CR-51 Bab 1 re-import; second production admin | owner | Ruled (D-122(2)); re-import not recorded; second admin **OPEN** |
| §8 | CR-31 | owner | **HOLD** |

---

## 4. L3 finding ledger (Core Build audit, frozen at d95c201)

**Source:** `docs/audit/L3-FINDING-LEDGER.md`. This is not the L3 Working Context landing.

| ID | Finding | Now |
|---|---|---|
| L3-F01 | Synthetic credentials reachable on a hosted project | CLOSED (481ff93); residual: inert synthetic rows remain on hosted |
| L3-F02 | INV-19 detector derived its own population | CLOSED (add47fa, dc7f42d, 2aedcef) |
| L3-F03 | Capability-less DEAN cross-tenant write | CLOSED (add47fa) |
| Carried limitations | INV-20, INV-06 timing, RF-2, F04-T04 idempotency, INV-05 single detector, pass verdict implemented twice, launch readiness outside CI, token expiry, `generate_report` authorization | **N/D**: no later record for any |

---

## 5. UX polish register (UX-01 … UX-47)

**Source:** `docs/coordination/ux/UX-POLISH-REGISTER.md`.

| ID | Finding | Now | Evidence |
|---|---|---|---|
| UX-01 | Question check only at lock; findings acknowledged one by one | PARTIAL | False warnings gone (CR-50); still one «Sudah saya tinjau» per finding |
| UX-02, 03 | Bank Soal line; Uji Cepat refusal | CLOSED | D-137; L2 |
| UX-04 … 08, 11, 12, 14, 16, 20 … 22, 24, 26, 27, 30, 32 | Wording and interaction fixes | CLOSED | Register (not re-verified one by one) |
| UX-09 | «nomor induk» read as NIS | **OPEN** | Copy unchanged |
| UX-10 | «surel» vs «email» | CLOSED | v1 (8cfe97e); guide (0f55f1b) |
| UX-13 | Course noun varies | PARTIAL | `studio.paket.revisi*`, `masalah.revision_not_latest` still «Kursus ini» |
| UX-15 | Three release presses | **OPEN** | — |
| UX-17 | Finding location names a database column | **OPEN** | = OP-5 |
| UX-18 | «siswa» vs «murid» | PARTIAL | `studio.unggah.revisi_arti` still «siswa» |
| UX-19 | Three assigning verbs | PARTIAL | Mengajar pairs «Siapkan» and «Sediakan»; v1 does not decide it (Dr Gladys) |
| UX-23, 28, 29 | Untrue screens | CLOSED | DAISY-25 (remainder: UX-41) |
| UX-25 | English readers see Indonesian | PARTIAL | Studio's `s()` passes no locale |
| UX-31 | «tanpa kata sandi» | CLOSED | — |
| UX-33 | Konfigurasi landing has no waiting counts | **OPEN** | — |
| UX-34 | Studio count cards are not links | **OPEN** | — |
| UX-35 | Integrity signals unnamed | CLOSED | FD-7; L4 |
| UX-36 | No send-back-to-author | **OPEN** | — |
| UX-37 | Teacher home has no per-class flags | **OPEN** | — |
| UX-38 | Tour is modal and blocks the landing | **OPEN** | OP-8 changed only the veil |
| UX-39 | No success line after release steps | PARTIAL | Only «Terbitkan» has a done word |
| UX-40 | New result never the next action | **OPEN** | — |
| UX-41 | «Penguasaan per bagian» shows codes | PARTIAL | Rows labelled; heading unchanged |
| UX-42 | Ids and enums on screen | CLOSED | CR-85, L4-G01 |
| UX-43 | «(D-008)» in workbook guidance | **OPEN** | `unggah-kontrak.ts:105` |
| UX-44 | «Program» field shown | N/D | — |
| UX-45 | Teacher gets the learner's recovery line | **OPEN** | No educator variant of `tolak.arti` |
| UX-46 | Certificate refusal goes back to Belajar | PARTIAL | Link fixed; label still «Kembali ke Belajar» |
| UX-47 | English term drift | N/D | Not audited |

---

## 6. Dr Gladys findings: DG-11, DG-19 … DG-37, FD-1 … FD-9

**Source:** `docs/reports/PINTAR-4.0-DG-19-37-INVESTIGATION-2026-10-07.md`; numbering per D-128(h).
- **DG-01 … DG-18 (except DG-11) have no record. Their status is N/D.**
- Dr Gladys's walk is the acceptance test for each DG row (D-127). Every «CLOSED» here therefore means **engineering closed, her walk pending.**

| ID | Finding | Now | Evidence |
|---|---|---|---|
| DG-11 | Jejak audit in codes | CLOSED | 8cfe97e; reviewer confirmed; S23j |
| DG-19 | Back after sign-out showed the admin's page | CLOSED | CR-90 / BD-11 (L1); L3 C5 |
| DG-20, 21, 22 | Akun saya bar swap; doors; identical doors | CLOSED (code) | L3 (D-132/D-133). **Six `context.*` words wait on Dr Gladys** (D-132(m)) |
| DG-23 / FD-1 | Cross-school Uji Cepat | CLOSED | L2 |
| DG-24 / FD-3 | 5 min reset to 15 | CLOSED | L2 PENUTUPAN-V01 |
| DG-25 | «Soal dalam paket ini» wall of text | **OPEN** (design) | L4 §4; RV-21 |
| DG-26 / FD-6 | Preview is not the player | CLOSED | L4 shared renderer |
| DG-27 | PRACTICE, ITEMS_AND_OPTIONS, JSON on screen | CLOSED | L4; D-134; step 4f |
| DG-28, DG-29 | Rules as schema; limits line | CLOSED (labels); residual **OPEN** | RV-14 (seconds, no hints, 13 px checkboxes) |
| DG-30 | Identical rule rows | CLOSED | FD-9 (L2), L3, L4 |
| DG-31 / FD-2 | Certificate layout id | CLOSED | L2 |
| DG-32 / FD-7 | Integrity «4d2050fd · 1» | CLOSED | L2; L4 names |
| DG-33 / FD-5 | Bank Soal purpose; inverted difficulty | CLOSED except wording | FD-5 (D-130); CR-52 (D-137). Measured-difficulty wording = **OP-7 (Dr Gladys)** |
| DG-34 / FD-8 | Pustaka ids | CLOSED | L2 |
| DG-35 | JSON fields on Buat Paket | CLOSED | L2 CR-87 |
| DG-36 | Example workbook | DECIDED (withheld) | It carried live keys (L4 finding 1); an example-only set is content work |
| DG-37 | Confirmation secret visible | CLOSED | CR-86 (L1). Reset, Akun saya and lock were only rendered, not browser-walked |
| FD-4 | Names lost at platform scale | **PARTIAL** | Bounded reads (L3); not proven at 10× scale |
| FD-9 | Saved rules never effective | CLOSED | L2 F21-R01 |

---

## 7. Login and tour findings

**Sources:** `docs/handoff/LOGIN-EXPERIENCE-FINDINGS.md`, `TOUR-EXPERIENCE-FINDINGS.md`.

| ID | Finding | Now |
|---|---|---|
| L-S6 | Held-resend state | DECIDED (suppressed) |
| L-JS | JavaScript dependency | DECIDED |
| L-copy | `auth.belum_siap` written outside the canonical review | **OPEN** (review not evidenced) |
| L-photo | No licensed photograph | SUPERSEDED (D-018 text panel) |
| L-a11y | Screen reader, 200 % zoom, colour vision | **OPEN** |
| T-H2 | Second-experience invitation | **OPEN** (deferred) |
| T-I3/I4 | Version-change invitation | BLOCKED (needs a tour v2) |
| T-L13, T-390 | Shared tour state for personas; header wraps at 390 px | DECIDED |
| (related) | Tour focus box and ring; sheet covers its target at 320 px | **OPEN** (RV-19) |

---

## 8. Terminology v1

- **Applied:** the approved change set is in the copy table (8cfe97e); the D-134 words are applied (503c0fb); the guide is aligned (0f55f1b).
- **OP-5, OPEN:** rows C29, C30, D23, C31, B15 and B16 live in migrations and seeds. They need migrations of their own (D-068(f)). This also covers RV-15 and UX-17.
- **OP-6, OPEN for Dr Gladys:** «penilaian» strings added after the v1 inventory. Ten default strings still contain «penilaian».
- **OP-7, OPEN for Dr Gladys:** Bank Soal's measured-difficulty wording.
- **OPEN for Dr Gladys:** the six `context.*` expressions (D-132(m)) and the L4 §4 word list (visualizations, a staff word for one misconception, the «Miskonsepsi» sheet wording).
- **Partial residues:** UX-13, UX-18. UX-19 is not covered by v1.

---

## 9. Application pass log (D-138 … D-140)

**Source:** `docs/reports/PINTAR-4.0-APPLICATION-PASS-LOG.md`.

| ID | Now | Evidence |
|---|---|---|
| RV-1, RV-2 (review BLOCKERs), RV-3, RV-4, RV-6, RV-12, RV-13, RV-17 | **CLOSED** (CI verified; staging by deployment and walk) | 44cebee; D140-SAJI-01; CI 37930520507; staging 001a357 |
| RV-10 (walkthrough-blocking) | **CLOSED**; the live screens are awaiting the owner's look | 001a357; D140-STUDIO-01 (red on the old code) |
| RV-5 | PARTIAL | The file control is styled; its words are the browser's |
| RV-7, RV-8, RV-9, RV-11, RV-14, RV-15, RV-16, RV-18 … RV-24 | **OPEN**, non-blocking for the walkthrough | Classification in the pass log |
| OP-1, OP-2 | OPEN (deviations) | No icon rail at 1024–1279 px; no group labels |
| OP-3 / AP-1 | BLOCKED | Font licence (CR-56) |
| OP-4 | PARTIAL | CR-41 |
| OP-5, OP-6, OP-7 | OPEN | §8 |
| OP-8, OP-9 | DECIDED | Recorded |
| AP-2 … AP-7 | CLOSED | Each with a guard |

**Daisy application pass by step:**

| Step | State |
|---|---|
| 1 Tokens | Staging verified |
| 2 Primitives | Staging verified. Gaps: select chevron; 44 px Radio/Checkbox rows; Alert/Badge shape; TARGET-01 does not see inline or Tailwind heights |
| 3 Shells | Staging verified, including batch A's order and current-page mark. OP-1 and OP-2 deviations; wordmark BLOCKED |
| 4a Learner | PARTIAL |
| 4b Mengajar | PARTIAL (RV-20) |
| 4c Pimpinan | PARTIAL (RV-9) |
| 4d Konfigurasi | PARTIAL (RV-16, RV-18, RV-24) |
| 4e Pendataan / Aktivasi | PARTIAL (RV-22) |
| 4f Studio | PARTIAL; the least migrated with Konfigurasi (RV-14, RV-21, RV-23) |
| 5 Copy | Built (OP-5, OP-6, OP-7 open) |

**Screens still awaiting design work:**
- Ringkasan Kelas and Ringkasan Sekolah (no shell; no class, school or period named);
- «Laporkan masalah» (old header);
- Konfigurasi's long single page;
- Studio's package page and question review layout;
- Aturan Asesmen;
- Pimpinan's class summary;
- the tour's focus and ring;
- the file control;
- lists not yet on the Collection pattern.

---

## 10. #150 backup and disaster recovery

**Source:** `docs/recovery/BACKUP-DR-REVIEW-2026-10-05.md`. **Verdict: NOT PASS for PRODUCTION READY. Unchanged since 6 Oct.**

| # | Item | Now |
|---|---|---|
| B1 | Hosted restore (G2) | CLOSED 6 Oct |
| B2 | Production backups seen (G1 part 1) | CLOSED 6 Oct |
| B3 | Automated backup read (G6): production migrations stay refused | **ON HOLD** (D-105) |
| B4, B5 | Copy outside Supabase; Storage; escrow of the two secrets | **Design only** (D-104); owner ruling |
| B6 | Recovery rests on one person | **OPEN**: owner |
| B7 | G10 off | **OPEN**: owner |
| B8 | Reconstructing Auth and platform configuration after a restore | **OPEN**: owner ruling |
| B9 | Storage files in a restore | **OPEN**: owner ruling, with B4 |

---

## 11. Issues and status of 24 Sep (production era)

**Source:** `docs/audit/PINTAR-4.0-ISSUES-AND-STATUS-2026-09-24.md`.

- **G1–G10:** closed at the time.
- **B1–B6, M2–M5, M7, M8, M10, M11, M15, N1, N5, N8, N12:** CLOSED on main and staging, **not on production** (5b5b68d).
- **M1** (email link): SUPERSEDED by activation and sign-in. The magic link is still on production (CR-25).
- **M6:** PARTIAL (CR-13 button, CR-14).
- **M9:** A-ITEM (media).
- **M12:** OPEN (CR-27).
- **M13:** PARTIAL (CR-67).
- **M14:** OPEN (CR-49, CR-58).
- **N4:** BLOCKED (#150).
- **N15:** OPEN (CR-69).
- **N2, N3, N6, N7, N9 … N11, N13, N14:** N/D item by item.

---

## 12. Contradictions found while reconciling

1. **S23q / CR-52.** Handoff files 00, 02, 04, 06, 07 and 09 (8 Oct) say it «fails in every run». D-137 closed it on 9 Oct, and it has passed in every run since. That handoff text is superseded and was left as written; the 9 Oct delta (10 §7) records the correction.
2. **CR-13.** Handoff 07 S5 says the four choices are unconfirmed; D-122(1) confirmed them on 7 Oct.
3. **CR-17.** Handoff 02 says it was not walked; batch 0 walked it (run 37466487118).
4. **The closure register's progress log** stops at D-132. Later states come from other reports.
5. **The release checklist header** still says Dr Gladys walked on 7 Oct; she did not (D-118).

---

## 13. Everything still open, by who acts

**Engineering (code):**
- CR-13 button; CR-14 name correction; CR-05 revocation screen; CR-07 profile photo;
- CR-27 Uji Cepat score, then CR-34 its walk;
- CR-37 hide the briefings surface as ruled;
- CR-77 the referrer sees the outcome; CR-78 a navigation link to «Laporan saya»; CR-75 remainder;
- CR-30, CR-58, CR-59: batch 6 regression, U-PERF;
- CR-49 platform paging; CR-15 username correction; FD-4 at scale;
- UX-09, 15, 33, 34, 36, 37, 40, 43, 45 and the PARTIAL UX rows;
- STU-08 and SYS-05 walks;
- the real-app 50-student test.

**Design (the Daisy application pass):**
- steps 4a–4f to completion: RV-5, 7, 8, 9, 11, 14, 16, 18–24, DG-25, OP-1, OP-2;
- CR-03/04 certificate, CR-21 card, CR-22 emails, CR-46 empty states, CR-57, CR-88;
- accessibility: an NVDA/TalkBack pass, 44 px Radio/Checkbox rows, 200 % zoom.

**Dr Gladys:**
- the second walkthrough (READY);
- terminology: OP-6, OP-7, the six `context.*` words, the L4 §4 words, UX-19;
- human acceptance of every journey.

**Owner decisions or actions:**
- CR-91 class-card trust boundary (HOLD);
- S1 answer keys in the repository;
- CR-41/OP-4 cross-school directory;
- CR-31 second attempt (HOLD); CR-48/Q11;
- CR-69 the second production admin;
- CR-56 font licence and the physical print proofs;
- capacity tier (D-089) and forwarding key (CR-67);
- #150 B3–B9;
- production email settings (CR-70); support tiers (CR-71);
- legal and data protection (CR-74);
- the production release (Gate 8: CR-11, 24, 25, 68, 72).

**Out of scope by ruling (A-ITEM):** media (CR-53, D-050); the teacher changing a window (CR-28, after go-live); Question Health (CR-36, P2).
