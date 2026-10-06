# PINTAR 4.0 · Complete status and checklists

**6 October 2026, status at 09:30 UTC.** Prepared by the coordinator for Yazid and the Second Eye.

> **Superseded in part, the same day:** D-118 postponed Dr Gladys's walkthrough. The D-117 freeze did not begin, and Daisy's design now comes before her walk. The next step is `PINTAR-4.0-CLOSURE-REGISTER-2026-10-06.md`. Where this report says "the freeze" or "tomorrow", read it in that light.

**Status as of:**
- `main` `12b480b`, frozen for the Dr Gladys walkthrough (D-117);
- application code = `3a7501b`;
- 165 migrations;
- staging deployment `dpl_4f9zxVXUnTPmQ3WcxzysR3hf3Yar`.

**How it was made:**
- Every checklist in the repository was re-read against `main`, the runs and the decision record. Three independent read-only surveys took the scope inventory, the open items and #150.
- Every state below cites its evidence.
- **Nothing in the application was changed.** The checklist and status documents were updated on the coordinator's branch only. They land on `main` after Dr Gladys signs off.

**States** follow `docs/recovery/EVIDENCE-MODEL.md`: BUILT → TESTED → DEPLOYED → JOURNEY-PROVEN → HUMAN-ACCEPTED, or NOT BUILT. The release checklist's PASS counts are engineering detail, not the readiness measure (D-084).

## 1. Summary

**Where PINTAR is.** ENGINEERING COMPLETE (declared 5 Oct). A school can run its whole year-one spine on staging, from the front door, unaided. On 6 Oct, Sekolah Demo PINTAR was walked end to end:
- **Setup:** a school was born; its admin set it up; a chapter was reviewed by a second person and published.
- **Learning:** a class of five sat both tests, three reaching the school's 70%.
- **Reports:** every role read the same figures.
- **Certificates:** three were issued and verified publicly.
- **Shared computer:** it locks and hands over.
- **Recovery:** lost cards and forgotten passwords were recovered without help.

Of the 130 scope lines:
- 45 are JOURNEY-PROVEN (two of them on the commit just before today's three migrations);
- 43 are TESTED;
- 26 are BUILT;
- 8 are NOT BUILT;
- 1 is out of scope for this phase (media);
- 1 cannot be established.

**What it is not yet:**
- **Not human-accepted:** your pass is tonight and Dr Gladys walks on 7 Oct.
- **Not polished:** Daisy's design system is ready to validate, not applied.
- **Not production-ready:**
  - #150 is NOT PASS, waiting on your infrastructure steps;
  - capacity fails on Micro (D-089);
  - the release-day rows are open.
- **Not cleared for real student data:** the legal and data-protection gate is open.

**The freeze.** From your sign-in tonight until Dr Gladys signs off, nothing in the application, its data or `main` changes (D-117). Everything below was written within that rule.

**What stands between today and the first real school, in order:**
1. **Dr Gladys's walkthrough (7 Oct).** Her findings are reviewed by you and the Second Eye before anything changes (§6).
2. **Daisy's gate:** you walk J1–J7, the stripe is tested on three school displays, and the grammar is frozen APPLICATION READY. Then the polish pass, slice by slice, each slice re-walked (§7).
3. **Your decisions (§11).** The most consequential:
   - the certificate number (Q1, a conflict found today);
   - compute (Q2);
   - the first deployment's size (Q3);
   - the legal and data-protection gate (Q4);
   - PINTAR standard content (Q7).
4. **#150, with your steps:**
   - the staging pooler value and O2;
   - then O3 to O8;
   - custodian B;
   - the production rulings (§8).
5. **The release conditions (§10):**
   - the upgrade rehearsed from 111;
   - L1 at the chosen tier;
   - break-glass;
   - the production email settings;
   - support named;
   - key escrow;
   - the release itself;
   - then 3–5 educators, then the pilot of 20–30.

**Found today and corrected in the documents:**
- **The release checklist (v2.7):**
  - re-pinned to the specimen;
  - its findings list made current;
  - STU-01, STU-19, REL-01 and REL-03 brought to current evidence;
  - **ADM-19 corrected from PASS to PARTIAL**: its evidence was the class move, not the transfer it checks;
  - REL-09 read against D-107 D8.
- **The operational board:** still dated 1 Oct, saying no Level 3 run existed. Rewritten.
- **The Golden School contract:** gained a dated status. It now says honestly that GS-16 uses a declared typed-address bypass, that GS-00 rests on reads around the walk, and that its step map needs three corrections.
- **#150's documents:** seven stale or conflicting lines corrected.
- **The inventory and evidence model:** stale state notes annotated.
- **The 1–2 Oct status reports:** marked historical.

**Found today and left for you:**
- **The certificate number:** the decided format (D-080(2)) is not the format PINTAR issues. My own ADM-18 change this morning extended the issued format without reconciling it.
- **Actions spend:** 4,194 billed minutes on 5 Oct against a 600-minute budget.
- **Five questions about the gate order and the freeze:** Q12 to Q15, and Q18.

## 2. Where PINTAR is on its two ladders

### 2.1 The readiness gates (D-052): "every readiness report states the gate PINTAR is at"

| Gate | State |
|---|---|
| ENGINEERING COMPLETE | **Declared 5 Oct** (C-12 PASS, audit 37366709177; JOURNEY-LOG 35). Two inventory lines marked EC are not done: J8.8, the student's profile photo, has no screen; J1.5, PINTAR standard content end to end, waits on Q7 |
| UI/UX POLISHED | **Not started.** Daisy's design system is READY TO VALIDATE; the application pass waits for her gate (§7) |
| YAZID GREEN LIGHT | Not given. Your pass on 6 Oct evening is observation under D-117 |
| GLADYS GREEN LIGHT | Not given. Her 7 Oct walkthrough is observation evidence under D-117; whether it also counts as this gate is Q12 |
| EDUCATOR PILOT (20–30) | Not started; after production (Phase 8) |

**PINTAR is at: ENGINEERING COMPLETE, with an early human walkthrough on staging under way (D-116, D-117).**

### 2.2 The recovery charter's phases (D-084)

| Phase | Exit | State today |
|---|---|---|
| 0 Freeze and contain | the charter accepted | **DONE** 1 Oct |
| 1 Reset | the package reviewed and accepted; inventory approved; owner access | **DONE** 1 Oct (D-086). Its leftover rulings (G2 = Q7, B1/B2 = Q17, O3 = Q3) are still open |
| 2 Trustworthy instruments | red means broken; green defined; every instrument has a recorded red | **Largely done:** C1 (`found-school.yml`), the C2 mailbox reader, the four walks, environment facts (nightly), the Actions-spend alarm, the restore rehearsals (G2; DR-D01, DR-D02), the production watch (built, off). **Open:** the production-upgrade rehearsal from 111 migrations on a scratch copy; the GS-00 assertion inside the walk; no formal exit recorded |
| 3 The Golden School, red baseline | a recorded baseline | **Done in substance** (gs-001, 2–3 Oct, JOURNEY-LOG 88–95); no formal exit recorded |
| 4 Repair in journey order | admin, teacher and student complete the chain unaided, JOURNEY-PROVEN | **Met:** GS-01 to GS-21 green on 5 Oct, accepted by the owner; re-walked green on 6 Oct on the current code |
| 5 Complete the agreed 4.0 | every inventory line JOURNEY-PROVEN; the UI/UX polish pass; the email standard | **Not met:** the spine is JOURNEY-PROVEN, but roles beyond it are proven at Level 1–2, not by their own Level 3 journeys; the polish pass has not started; DAISY-37 (the email system) is open |
| 6 Human acceptance on staging | every journey HUMAN-ACCEPTED (Yazid, then Dr Gladys) | **In progress:** Yazid 6 Oct evening, Dr Gladys 7 Oct; nothing HUMAN-ACCEPTED yet |
| 7 L1 | L1 passes at production's compute tier | **Not met:** L1 failed on Micro (D-089; CAP-02); the compute decision is Q2 |
| 8 Controlled production and the pilot | the release conditions (§10), then the pilot | **Not started:** production `5b5b68d`, 111 migrations; #150 NOT PASS |

## 3. The journey board (the readiness measure, D-084)

The counts are of `PINTAR-4.0-SCOPE-INVENTORY.md` lines at each line's highest state. Of the JOURNEY-PROVEN (JP) lines:
- † means a documented step covered the line although the contract's map does not name it;
- ‡ means the line was walked on the 162-migration set (`808ae6e`), so it is JP on that commit, not on `12b480b` (D-034).

| Journey | Owner | Lines | JP | TESTED | BUILT | NOT BUILT / other | What stands (first the break, then the open items) | Next action |
|---|---|---:|---:|---:|---:|---|---|---|
| J1 Platform operation | Bob | 9 | 2 (‡) | 4 | 2 | 1 NOT BUILT | No break in the spine. Open: J1.7 break-glass for the sole production admin (C-11); J1.5 PINTAR standard content end to end (Q7: D-029 vs M6); J1.6 the audit reader not walked; SYS-08 one platform admin | Owner rulings and C-11; after the freeze |
| J2 Identity | Bob | 21 | 11 | 6 | 4 | — | No break. Open: J2.7 the existing-staff transition not rehearsed; J2.10 the staff lock never walked; J2.21 wrong-email correction not built; J2.6 production still on the magic link | Phase 8 rehearsal; UI lane for J2.21 |
| J3 School setup | Daisy | 12 | 7 | 4 | 1 | — | No break. Open: year rollover, transfer and class move proven only in audits; J3.11 (every action leaves a trace) has no rule-level test | Further Level 3 journeys (Phase 5) |
| J4 Content | Daisy | 12 | 5 | 2 | 2 | 1 NOT BUILT, 1 OUT OF SCOPE, 1 UNVERIFIED | No break. Open: J4.10 misconception linkage not built (Q9; 31 false warnings per chapter at publish); J4.2 media out of scope (D-050); J4.8 "Question Bank workflows" never defined; J4.9 Question Health needs 30 answers per question | Owner ruling Q9 |
| J5 Teaching | Daisy | 14 | 3 | 9 | — | 2 NOT BUILT | No break. Open: J5.6 the Uji Cepat score (Q8); J5.9 deadline extension has no screen; Uji Cepat not a Level 3 journey | Ruling Q8; UI lane |
| J6 Learning | Bob | 15 | 8 | 6 | 1 | — | No break. Open: J6.7 pause and resume untested; J6.8 network loss proven in audits, not Level 3 | Phase 5 |
| J7 Evidence | Daisy | 9 | 6 | 1 | 2 | — | No break. Open: J7.5 briefings have no producer or display; the decision queue not walked; the «not yet» band (D-095(g)) | UI lane; Q10 |
| J8 Certificate | Bob | 8 | 3 | — | 3 | 2 NOT BUILT | No break. Open: **the certificate number conflicts with D-080(2)** (Q1); J8.3 sealing at issuance (BOB-48); J8.4 the frozen design (DAISY-36); J8.8 the photo screen; J8.7 key escrow (#150 B5) | Owner ruling Q1, then BOB-48 |
| J9 Educator as learner | Bob | 8 | — | 7 | — | 1 (demo content, off `main` by design) | Proven by audit C-12 (37366709177), not yet a Level 3 journey | C-13: Yazid's walk with Lana's packages |
| J10 Help and support | Daisy | 2 | — | 1 | 1 | — | «Laporkan masalah» built and tested, never walked in a browser; tier people not named (REL-13) | Walk after the freeze; owner names the tiers |
| X Universal rules | Coordinator | 12 | — | 2 | 9 | 1 NOT BUILT (X.12, the polish pass) | Rules shown by examples, not rule-level tests; U-PERF last measured 28 Sep | Daisy's gate, then the polish pass |
| R Instruments and release | Coordinator | 8 | — | 1 | 1 | 6 release conditions | REL-02 FAIL, REL-08 and REL-13 PARTIAL, REL-09 NOT VERIFIED; L1 NOT MET (D-089); #150 NOT PASS | The owner's #150 steps; Phase 8 |
| **Total** | | **130** | **45** (8†, 2‡) | **43** | **26** | 8 NOT BUILT · 1 OUT OF SCOPE · 1 UNVERIFIED · 6 release labels | HUMAN-ACCEPTED: 0 | |


## 4. The scope inventory: what is proven, and what is not

**130 lines** (`docs/recovery/PINTAR-4.0-SCOPE-INVENTORY.md`). The full line-by-line table is Appendix A.

| State | Lines | Note |
|---|---:|---|
| JOURNEY-PROVEN | 45 | Walked unaided in the 6 Oct runs. 8 are covered by a step the contract's map does not name (†). 2 (J1.1, J1.4) were walked on the 162-migration set, so they are JP on `808ae6e` (‡) |
| TESTED | 43 | An executable test on `main` (the manifest's 595 tests, CI 37430770665). Most are also DEPLOYED. Five rest on audit runs of earlier commits: J5.1, J5.2, J5.11, J6.12, J6.13 |
| BUILT | 26 | On `main`; not wholly tested. Mostly the universal rules, shown by examples rather than rule-level tests |
| NOT BUILT | 8 | J1.7 break-glass; J4.10 misconception linkage; J5.6 the Uji Cepat score; J5.9 deadline extension; J8.4 the frozen certificate design; J8.8 the photo screen; J9.8 demonstration content (off `main` by design); X.12 the polish pass |
| OUT OF SCOPE (this phase) | 1 | J4.2 media (D-050) |
| UNVERIFIED | 1 | J4.8 "MCQ Question Bank workflows": never defined |
| Release conditions | 6 | R.1, R.2, R.4, R.6, R.7, R.8 (§10) |
| **HUMAN-ACCEPTED** | **0** | — |

**Clauses that could not be established** (each line still shows its state):
- J1.8: personas excluded from the PIN and the PINTAR ID;
- J1.9: "stuck" email flows identifiable;
- J2.4: the whole intake list reviewed before confirmation;
- J2.7: any staging rehearsal of the existing-staff transition;
- J2.10: the 15-minute fallback;
- J5.13: whether «Hasil resmi» is M4's learner record;
- J6.2: that no session starts before the press;
- J6.11: growth and "no rank" asserted;
- R.6: the pilot's mail-capacity reassessment.

**Engineering Complete was declared with these EC lines still open:**
- J8.3, sealing at issuance (BOB-48);
- J8.4, the certificate design (DAISY-36);
- J8.8, the photo screen;
- J2.7, the staff transition rehearsal;
- J1.5, PINTAR standard content end to end.

J4.10 was parked by D-098(d) only "until the remaining build is complete". That build is complete, so it is open again (corrected 6 Oct; closure register CR-50). Recorded for your review.

## 5. The Golden School: the end-to-end walk on staging

The Golden School is PINTAR's primary integration truth (`GOLDEN-SCHOOL-CONTRACT.md`): one school on staging, from
the front door, by clicking, with no SQL, no typed addresses, no server-made sessions and no technical help.

**Latest run, 6 Oct: «Sekolah Demo PINTAR».** The walk's 41 steps all passed:
- **Unaided:** GS-01 to GS-15, and GS-17 to GS-21.
- **GS-16, the one bypass:** the four extra students open their two tests by typed address. The walk declares it, because they "only sit the tests" (contract §4). The evidence model counts a typed address in Level 3 as a bypass. GS-16 maps to no inventory line.
- **Current break in the spine:** none.

The walk before this one, «Sekolah Emas Uji 2026-10-05» (runs 37287063109 to 37295261257), was also green.

| Step | What a person did | Walk steps | Run | Result |
|---|---|---|---|---|
| GS-00 | Staging runs `main`'s code and migrations (machine read) | bracketing reads: 07:38 UTC `808ae6e` 162/162; 07:54 migrations 165 applied; 08:37 `a64b9b6` 165/165; 08:46 `12b480b` 165/165 | 37430955533, 37432544176, 37437396764, 37438389611 | GREEN (by reads around the walk; not asserted inside it) |
| GS-01 | The school is born (C1, the one permitted operator action) | — | 37431278133 | PASS |
| GS-02 | The platform operator signs in with their own password and creates the first school admin with the role | G0–G3 | 37431385287 | PASS |
| GS-03 | The school admin activates by the emailed code and lands on Konfigurasi | G4, G5 | 37431385287 | PASS (GS-01 to GS-03 on the 162-migration set: JP on `808ae6e` under D-034) |
| GS-04 | Structure: «Kelas Tinggi» → «Kelas 5» → «Kelas 5A» | A2 | 37432707928 | PASS |
| GS-05 | The pass mark: 70%, with a reason, audited | A7 | 37432707928 | PASS |
| GS-06 | Teacher, head of department and dean: named, accounts, roles | A3 | 37432707928 | PASS |
| GS-07 | Five students into «Kelas 5A»; the class's cards in one press | A4, M1 | 37432707928, 37433910433 | PASS |
| GS-08 | The chapter uploaded (5 lessons, 31 questions, 124 options) | A6 | 37432707928 | PASS |
| GS-09 | Seven Studio steps by two people: the admin composes and publishes; the head of department reads all 31 questions with keys, approves, makes and locks the release | A8, A9 | 37432707928 | PASS |
| GS-10 | The teacher activates and lands on Mengajar | A10 | 37432707928 | PASS |
| GS-11 | The teacher gives the chapter to «Kelas 5A» until 5 Nov; post-test sealed at 70% | A11 | 37432707928 | PASS |
| GS-12 | The primary student signs in with the class card | M2 | 37433910433 | PASS |
| GS-13 | Pemetaan Awal: orientation → explicit start → answers → finish | M3 | 37433910433 | PASS |
| GS-14 | Every lesson read to its last page by clicking | M4 | 37433910433 | PASS |
| GS-15 | Uji Penguasaan: 8 of 8; «Target tercapai» | M5 | 37433910433 | PASS |
| GS-16 | Four more students sit both tests: Bunga 75%, Dimas 100% (met); Citra 63%, Eka 50% (not met) | M6, M7 | 37433910433 | PASS, by the declared typed-address bypass |
| GS-17 | Teacher, head of department, dean and admin read the same figures: Peserta 5, Pemahaman 78%, Kenaikan +38 poin, Mantap 2 · Berkembang 2 · Perlu penguatan 1, Sertifikat terbit 3; every scope boundary refused | L0–L4 | 37434862707 | PASS |
| GS-18 | Exactly one certificate per eligible student (00001 to 00003), none for the others; the holder sees hers; staff never open one | C1–C3 | 37434862707 | PASS |
| GS-19 | An anonymous visitor verifies each certificate: «Berlaku», never the name; a random code reveals nothing | V1, V2 | 37434862707 | PASS |
| GS-20 | A shared computer: locked after 5 idle minutes, resumed by the PIN at the same page; «Bukan akun Anda?» hands over; everyone signs out | U1, X1 | 37434862707 | PASS |
| GS-21 | A lost and a damaged card re-issued (old card stops, results stay); a teacher recovers by email, then by PINTAR ID + PIN | R1–R3 | 37434862707 | PASS |

**Known gaps in the instrument (recorded; not repaired during the freeze):**
- GS-00 is not asserted inside the walk.
- GS-16 uses typed addresses (above).
- The contract's step-to-inventory map needs correcting:
  - GS-18 is mapped to J8.3 (sealing at issuance, not built);
  - GS-13 is mapped to J6.7 and J6.8, which it never exercises;
  - two report steps carry the wrong J7 labels.
- Roles beyond the spine are not yet their own Level 3 journeys: the review queue's signals, the dean's queue, Uji Cepat, educator-as-learner, and support.
- The spine covers lessons and multiple-choice questions only; media is out of scope (D-050).

## 6. The human walkthrough gate (D-116, D-117)

**The question:** can Dr Gladys use and understand PINTAR as it exists, without the team explaining what we intended?

| # | Item | Status | Evidence / where |
|---|---|---|---|
| H1 | A school fit to walk: Sekolah Demo PINTAR founded by C1 and walked end to end | DONE | §5; JOURNEY-LOG 48 |
| H2 | Staging current and machine-confirmed | DONE | `environment-facts.yml` 37438389611 GREEN (`dpl_4f9z…`, `12b480b`, 165/165) |
| H3 | Sign-in, email sender and identity settings re-confirmed after Supabase's Management API outage | DONE | `staging.yml` 37437241796 green |
| H4 | The specimen pinned (deployment, commit, migrations) and the application code identical to the walked commit | DONE | `docs/coordination/walkthrough-gladys/EVIDENCE.md` §1 |
| H5 | A read of the demo school before her account exists | DONE | EVIDENCE.md §2 (6 Oct 08:46 UTC) |
| H6 | A non-leading guide for her: the journeys to attempt, no buttons, no meanings, no expected results | DONE | `docs/onboarding/PINTAR-Panduan-Walkthrough-Sekolah-Demo.md` (branch) |
| H7 | The observer's sheet: no coaching, HELP REQUIRED, verbatim capture, break procedure, reference facts | DONE | `docs/coordination/walkthrough-gladys/OBSERVER-SHEET.md` |
| H8 | No scheduled job writes to staging during the walk | DONE (checked) | EVIDENCE.md §1 |
| H9 | Her account on staging, as «Admin sekolah» of Sekolah Demo PINTAR | **OWNER** | Yazid, through the app (D-116(c)) |
| H10 | The freeze: from Yazid's sign-in on 6 Oct evening until she signs off, no change to code, UI, copy, database behaviour, demo data or `main`; no Daisy | **IN FORCE from Yazid's sign-in** | D-117(a) |
| H11 | Yazid's own pass before handing over | **OWNER, 6 Oct evening** | changes to the demo school noted (OBSERVER-SHEET) |
| H12 | Dr Gladys walks | **7 Oct** | — |
| H13 | `environment-facts` after: the same deployment and commit | after she signs off | EVIDENCE.md §4 |
| H14 | The evidence recorded verbatim; the read after her walk against the baseline | after | EVIDENCE.md §4–5 |
| H15 | Findings classified (A defect, B comprehension, C visual/interaction, D product question) with a separate severity; one findings report | after | EVIDENCE.md §6 |
| H16 | STOP for the owner and the Second Eye; no remediation until a finding is approved | after | D-117(g) |

**What it is not:** the walkthrough changes nothing about #150, Production Ready, the legal and data-protection gate,
the capacity gate, or the use of real external student data (D-117(m)). D-052's order puts UI/UX POLISHED before the
YAZID and GLADYS GREEN LIGHTs; D-116 and D-117 bring a human walkthrough forward as observation evidence. Whether it
also counts as D-052's GLADYS GREEN LIGHT is the owner's to say (D-116(d)).

## 7. Daisy's gate: from design system to application (D-117(h)–(j))

Daisy's design system is on `ux-1/daisy-experience`, documents only (`docs/coordination/ux/sistem-desain/`; 155 files,
no `src/` change). Its own state: **READY TO VALIDATE (5 Oct)**; all seventeen questions ruled.

| # | Step | Status | Who |
|---|---|---|---|
| D1 | The design system: tokens, type, colour, corners, elevation, motion, icons, accessibility (WCAG 2.2 AA), dates, shells and navigation | APPROVED IN PRINCIPLE; questions 1–17 ruled | Yazid (5 Oct) |
| D2 | The PINTAR wordmark (production master pending the font-licence check); the ID card and certificate frozen | APPROVED; master pending | Daisy, then Yazid |
| D3 | Gladys's walkthrough findings reviewed (§6, H16) | after 7 Oct | Owner, Second Eye |
| D4 | The owner walks the composed journeys J1–J7 (publish to a class; a whole class; teaching ↔ learning; a lesson and its result on 1366×768 and a phone; date fields; MODE PERAGAAN; the shared-computer lock) | NOT STARTED | Yazid |
| D5 | The table stripe on three real school displays (an ordinary school computer, a poor display, a projector from the back row) | NOT STARTED | Yazid or the school |
| D6 | Approved comprehension and visual findings from Gladys folded into that review | after D3 | Daisy |
| D7 | Grammar issues resolved at the design-system source | after D4–D6 | Daisy |
| D8 | The grammar frozen **APPLICATION READY** | after D7 | Yazid |
| D9 | Controlled propagation, slice by slice: foundation first (tokens, type, spacing, radii, shadows, focus, the base page and shell), then components and screen families; each slice through targeted tests → lint, typecheck, build → full CI → staging → a focused visual check → the demo-school regression | after D8 | Daisy, then the coordinator lands |
| D10 | The final demo-school regression: the whole journey re-walked on the redesigned application, every behaviour still proven | after D9 | Coordinator |
| D11 | The screen items that wait for the UI lane: ADM-18 (layout on the printed sheet; revocation), EDU-10 (after a ruling on where the score appears), ADM-08 (email correction), EDU-11 (deadline extension), DEA-04 (briefings), CAP-10 (paging) | WAITING (UI lane; EDU-10 needs a ruling) | Daisy, owner |

Daisy never reinterprets product behaviour. A design question that needs a product decision is asked, not invented.

## 8. #150: disaster recovery and backup readiness

**Verdict: NOT PASS, accepted (D-104(a), D-105(a)).** On 6 Oct the Second Eye's checkpoint was **GREEN to proceed from
engineering proof into owner-controlled infrastructure setup** (D-111): not #150 PASS, not PRODUCTION READY.

**What #150 gates:**
- **Production Ready:** #150 is a hard gate for it; it does not gate staging human acceptance (D-104(d)).
- **What PASS needs (D-106):** B3, B4, B5, B8 and B9 implemented and proven.
- **The production watch (B7):** switched on at the release gate.
- **Second administrators (B6):** in place before real-school production use.
- **Production backups and escrow:** none before R1 and R2 are held by two separate custodians who have each proven possession (D-109(c), D-111(b)).

| Item | What | Status | Evidence | Next, and who |
|---|---|---|---|---|
| Pre-O3 (1) | The staging session-pooler proof, with the owner's dashboard value | **WAITING: OWNER** | `staging-backup-path.yml` 37414154468 stopped at step 1; input accepted since `df7c170` | Owner: staging → Connect → Session pooler host, port, user (no password); coordinator reruns |
| Pre-O3 (2) | O2: C1 created; the run says `ISOLATED` | **WAITING: OWNER** | WP-A `e6cb045`, CI 37401454517 | Owner O2; coordinator runs `recovery-facts` |
| G1 Part 1 / B2 | Production's backups seen | DONE | 7 physical backups, latest 05 Oct 19:24 UTC, PITR off | — |
| G2 / B1 | Hosted native restore of staging | DONE | 24/24, 157 tables identical, 8 min 03 s, copy deleted | — |
| G5 | The deploy never silently replaces the two durable secrets | BUILT, PROVEN ON STAND-INS | `b4bd543`; DR-S01–S03 | Fingerprints recorded at the next production deploy |
| G6 | No production migration without a COMPLETED backup ≤ 26 h | BUILT, PROVEN ON STAND-INS | `870fdac`; rewired to C1 `e6cb045` | Owner O2; until then every production apply is refused |
| G7 | Readiness check names restore drift | DONE | DR-D01; rehearsal 37389380945 | — |
| G8 | RPO recorded: 24 h, provisional, no PITR | DONE | D-103 | Revisit per D-103(c) |
| G10 / B7 | Outside watch on production | BUILT; switched off | `7ffbacc`, `babafd5`; run 37391618155 | Owner switches on at O10 (the release gate) |
| B3 / WP-A | C1, the backups-read token, isolated | BUILT, PROVEN ON STAND-INS | `e6cb045` | Owner O2 |
| B4 + B9 / WP-B | Off-platform database backup and Storage files; `pintar_backup` | BUILT, PROVEN ON STAND-INS; migration 162 on staging only | CI 37409454539, 37412506567; `staging.yml` 37414019844 | Pooler proof, then O3–O6, then the first staging run and drill |
| B5 | Durable-secret escrow, dual-recipient (D-107 D8: no offline plaintext copy) | BUILT, PROVEN ON STAND-INS | DR-S01–S03, DR-S10 | O3, O4, R2, both proofs, then O7 |
| B8 / WP-C | Reconstruction in a new environment (runbook, rehearsal workflow, functional checks F1–F4) | BUILT, PROVEN ON STAND-INS | WP-C.1 `f49280e` CI 37421222152; WP-C.2 `9631bf6` CI 37425505226; D-113 | O8 rehearsal |
| B6 / WP-D | Second administrators; custodian B | NOT STARTED | no `RECOVERY-AUTHORITY.md` | Owner O9 |
| O3 | AWS account, stack, writer/reader keys, environments | NOT STARTED (prepared) | OWNER-INSTRUCTIONS | Owner, after both pre-O3 items |
| O4 | Key ceremony: R1 (custodian A), R3; later R2 | NOT STARTED | `custody.json` proofs null | Owner; custodian B |
| O5 | Supabase Storage S3 keys | NOT STARTED | — | Owner |
| O6 | `pintar_backup` passwords | NOT STARTED | — | Owner, then the coordinator's `credential set` |
| O7 | First escrow | NOT STARTED | needs fingerprints and both proofs | Owner approves |
| O8 | Staging copy for the rehearsal, C10, teardown | NOT STARTED (prepared) | OWNER-INSTRUCTIONS O8 | Owner, after the first staging bundle |
| O9 | Name custodian B; second administrators | NOT STARTED | `custody.json` R2 custodian null | Owner |
| O10 | Switch the watch on | NOT STARTED | — | Owner, at Production Ready |
| O11 | Privacy-notice line on backup retention (≤ 12 months) | UNVERIFIED | — | Owner or legal, before real-school use |
| O12 | Quarterly possession check | NOT STARTED | — | Custodians A and B |
| Provider question | Ask Supabase about restricting `supautils` | WAITING: OWNER (non-blocking) | D-108(e), D-109(f) | Owner's support ticket |
| Production rulings | Migration 162, its extension baseline and C2 on production | NOT STARTED (separate ruling) | `extension-baseline.json` production null | Owner, at §7 step 7 of the index |

**The order to #150 PASS** (`EVIDENCE-INDEX-150.md` §7; each step reported before the next):
1. Both pre-O3 items green.
2. O3.
3. O4 (R1, R3).
4. O5.
5. O6 (staging).
6. The first staging backup green, a planted failure red, a staging drill green.
7. Custodian B named, R2 made, both possession proofs.
8. The production rulings (162, the baseline, C2), the fingerprints recorded, and O7: escrow plus a production backup to R1 and R2.
9. The O8 rehearsal.
10. The final #150 report against D-106.

After PASS: O10 at the release gate. B6 before real-school use.

**Open on #150 (for the owner):**
- **The freeze:** do #150 owner actions proceed during the D-117 freeze? Recommended:
  - owner actions outside PINTAR go ahead (the AWS account, naming custodian B, the pooler value);
  - anything that writes to staging or `main` waits until Dr Gladys signs off (`credential set`, committed keys or proofs).
- **When migration 162 reaches production** is not reconciled: the closure plan says "at the release"; the index says "by separate ruling at step 7".
- **The PASS criteria** are labelled "proposed … for confirmation" (CLOSURE-PLAN :559); no ruling confirms them yet.

## 9. The release checklist, v2.7 (engineering detail)

The 84 P0 rows are engineering detail, not the readiness measure (D-084). The full rows are in
`docs/coordination/RELEASE-CHECKLIST.md` v2.7, also attached as a PDF.

**P0: 77 of 84 PASS** (24 Sep baseline: 13).

| Section | P0 | PASS | PARTIAL | FAIL | N-T |
|---|---:|---:|---:|---:|---:|
| Student / Murid | 15 | 14 | 1 | 0 | 0 |
| Educator / Guru | 8 | 8 | 0 | 0 | 0 |
| Head of department | 8 | 8 | 0 | 0 | 0 |
| Dean | 5 | 5 | 0 | 0 | 0 |
| School admin | 14 | 13 | 1 | 0 | 0 |
| Platform admin | 3 | 3 | 0 | 0 | 0 |
| Anonymous / verifier | 5 | 5 | 0 | 0 | 0 |
| Cross-role scenario | 12 | 11 | 1 | 0 | 0 |
| Capacity | 4 | 0 | 2 | 1 | 1 |
| Universal | 10 | 10 | 0 | 0 | 0 |
| **Total** | **84** | **77** | **5** | **1** | **1** |

**Every row that is not PASS (all gates), by what it waits on:**

| Waits on | Rows | Status |
|---|---|---|
| **Media, out of scope for the first testing phases (D-050)** | STU-11 (P0), ADM-10 (P0), X-07 (P0) | PARTIAL: the text half PASS; the media half is not tested |
| **Capacity: the owner's compute decision and the forwarding key (D-089)** | CAP-01 (P0) N-T · CAP-02 (P0) FAIL (Micro misses D-031 at 1,000) · CAP-07 (P0) PARTIAL · CAP-08 (P0) PARTIAL · CAP-09 (P1) PARTIAL | — |
| **Capacity, onboarding stages** | CAP-03, CAP-04, CAP-05, CAP-06 N-T · CAP-10 N-I (paging, BOB-13) | later cohorts |
| **Release day** | REL-02 FAIL (until every P0 passes) · REL-08 PARTIAL (production settings and send) · REL-09 NOT VERIFIED (key escrow, #150 B5) · REL-13 PARTIAL (support named; the in-app report not walked in a browser) · REL-12 N/A | owner, release |
| **The UI lane (after D-117's review and Daisy's gate)** | ADM-18 PARTIAL (printed-sheet layout; revocation screen) · ADM-08 and U-RECOVER PARTIAL (correcting a wrong email) · EDU-11 N-I (deadline extension) · DEA-04 PARTIAL (briefings) · U-EMPTY PARTIAL ('(0/5)' cards) | Daisy |
| **A ruling first** | EDU-10 PARTIAL: where an Uji Cepat score appears is not decided | owner |
| **Not yet walked in a browser** | SYS-07 N-T (the audit reader) · STU-08 N-T (pause and resume) · EDU-13 N-T · ADM-17 N-T (report templates) · SYS-02 PARTIAL · SYS-05 PARTIAL (a PINTAR chapter end to end, M6 against D-029) | coordinator, after the freeze |
| **Data-dependent** | HOD-06 BLOCKED: Question Health needs 30 answers per question | real use |
| **People** | SYS-08 FAIL: one platform admin only; succession after onboarding (and #150 B6) | owner |

**All rows, every gate:** 138 rows; 105 PASS, 16 PARTIAL, 9 N-T, 3 FAIL, 2 N-I, 1 BLOCKED, 1 NOT VERIFIED, 1 N/A.

**v2.7 changes (6 Oct):**
- **Status pinned** to the walkthrough specimen (`12b480b`, application code = `3a7501b`, CI 37430770665) and to today's full Golden School walk.
- **Evidence refreshed** on X-09, DEA-05, ADM-18 and REL-08.
- **REL-09** read against D-107 D8: escrow, not an offline plaintext copy.
- **REL-12** notes Phase 6.
- **No status changed.**

## 10. The path to production (charter Phase 8): the release conditions

Production today: `5b5b68d`, 111 migrations, untouched (as last recorded: one person, two schools, no cards; production's
database was not read for this report). `main` is 54 migrations ahead.

| # | Condition before the release (RECOVERY-CHARTER Phase 8; release checklist) | Status | Where it stands |
|---|---|---|---|
| P1 | The upgrade rehearsed from production's exact level (111 → 165) on a scratch copy | NOT DONE | Phase 2 rehearsal item; G6 refuses production migrations until C1 exists |
| P2 | The configuration verified (Auth, email, secrets) | PARTIAL | Staging verified (identity settings, sender); production's Gate 8 settings and SMTP password are Yazid's (REL-08, D-039) |
| P3 | A restore proven | PARTIAL | Native restore of staging proven (G2); the off-platform path and the O8 rehearsal wait for #150's owner steps |
| P4 | Monitoring verified | PARTIAL | The outside watch is built and switched off until the release (G10, O10); environment facts run nightly; the Actions-spend alarm is red (§14) |
| P5 | Level 3 green on the release candidate | GREEN on today's specimen | §5; must be re-run on the actual candidate |
| P6 | Staging acceptance (Phase 6) | IN PROGRESS | Yazid 6 Oct evening, Dr Gladys 7 Oct (§6); nothing HUMAN-ACCEPTED yet |
| P7 | L1 at production's compute tier (Phase 7) | FAIL on Micro; waiting | D-089: Micro misses D-031 at 1,000; compute stays Micro until capacity testing passes; the owner's compute decision |
| P8 | The existing-staff transition rehearsed; the sole production admin's break-glass tested (D-054(e)) | NOT DONE | — |
| P9 | Password sign-in released only with working recovery (D-058(b)) | READY ON STAGING | Gates 4 and 5 walked (GS-21) |
| P10 | Every email meets the standard (D-079(f)) | PARTIAL | PINTAR's own emails land on staging; production send and SPF/DKIM/DMARC not read (REL-08) |
| P11 | The production keys have verified recovery copies (D-066, as D-107 D8 restates it: dual-recipient escrow) | NOT DONE | #150 B5, O7 (REL-09) |
| P12 | #150 PASS | NOT PASS | §8 |
| P13 | Release-day rows: REL-02 (every P0 PASS, zero operator steps), REL-08, REL-09, REL-13 (support named, same-day answer) | OPEN | §9 |
| P14 | Legal and data-protection gate before real external student data | OPEN | D-117(m); the privacy-notice line (O11); content licensing (D-112(c)) |
| P15 | Then: release through the rehearsed path → a walk by 3–5 real educators (D-058(b)) → the observed educator pilot of 20–30 (D-052(b)) → wider onboarding gated by capacity | NOT STARTED | — |

## 11. Decisions only the owner can make

### 11.1 Before production or real schools

| # | Question | Source | Blocks |
|---|---|---|---|
| Q1 | **The certificate number.** D-080(2) and BOB-48's note decide `<PINTAR ID>/<per-person sequence>`; PINTAR issues `<prefix or PINTAR/<SCHOOL>>/<YYYY>/<per-school sequence>`, which the 6 Oct ADM-18 change extended without reconciling. Which stands, and may a student's certificate show their PINTAR ID (open since D-076)? | D-080(2), D-076, BOB-48; release checklist §14 | BOB-48; ADM-18; any real certificate |
| Q2 | Compute tier for staging and production, decided on capacity evidence, then L1 rerun | D-089(c); CAP-08 | CAP-01/02/07/08; Phase 7; more than 50 people at once |
| Q3 | Size of the first real deployment, and what happens to the 1 Nov and 1 Dec cohorts | D-083; D-112(d) | L1's size; onboarding |
| Q4 | The legal and data-protection gate: UU PDP, PSE registration, controller and processor, retention, parental consent; approval for real student data | D-117(m); handbook G2, G4 | Real external student data; production |
| Q5 | Legal rights to the ministry materials (SD 5 teacher's guides; Geografi XI and Matematika X student books) | D-112(c) | Distributing that content to real schools |
| Q6 | A policy for AI tooling that can reach hosted systems: who, which environments and data, with what audit | D-112(a) | Real schools |
| Q7 | Who authors and approves PINTAR standard content; may imports target the library (D-029 vs M6, options a/b/c)? | JOURNEY-LOG WAITING item, 2 Oct; SYS-05; J1.5 | No PINTAR chapter is proven end to end |
| Q8 | Where an Uji Cepat score appears: for the class, each learner, or both | EDU-10; J5.6 | EDU-10; the UI lane |
| Q9 | Misconception linkage: per school, or shared canonical definitions (D-063)? The 31 false warnings per chapter at publish come from this | JOURNEY-LOG item 13; D-098(d) parks it | Clean publication; misconception feedback |
| Q10 | The missing "not yet" band (F5/T4); certificate grade labels (alternatives 1–3) | D-095(g) | Tier display; predikat labels |
| Q11 | A cross-school read of whether each school's admin has signed in | SYS-02 | SYS-02 (P1) |
| Q12 | Does the walkthrough also count as D-052's GLADYS GREEN LIGHT, given that D-052 puts UI/UX POLISHED and Yazid's green light first? | D-116(d) | The order of Phases 5 and 6 |
| Q13 | Gladys's findings, each approved or rejected with the Second Eye | D-117(f), (g) | Every change after the walk; Daisy's gate |
| Q14 | Do #150's owner actions proceed during the freeze? Recommended: steps outside PINTAR yes; anything that writes to staging or `main` after she signs off | D-117 vs #150 | §8 |
| Q15 | When migration 162 reaches production (release, or a separate ruling at step 7); confirm the #150 PASS criteria | CLOSURE-PLAN vs EVIDENCE-INDEX | #150 |
| Q16 | Uji Penguasaan's second attempt: the same questions after a review with answers and explanations? | D-112(b) | On hold |
| Q17 | Do class feedback rounds (B1) and the evaluation hub and personas (B2) count as 4.0 scope? | PHASE-1-STATUS §6 | Scope |
| Q18 | The PINTAR wordmark replacing «PINTAR SELALU» on the card and certificate (Q16 of Daisy's rulings, 5 Oct) is recorded only on Daisy's branch; D-074(3) and D-076(b)(7) still say «PINTAR SELALU». Record it in DECISIONS? | Daisy's lane | The card and certificate freeze |
| Q19 | The commercial and policy answers a school will ask: pricing and BOS, contract, teacher-content licence, ads, research or AI training, exit, shutdown, staff data access, breach, SLA, training, liability, transfer consent, release notes | Handbook ▲ items (D-114(c)) | School-facing answers before real schools |

### 11.2 Process and efficiency (not blocking the walkthrough)

- **CI's cost (D-091(e)):** CI's structural fixes S1–S5 and a daily Actions budget. Billed minutes against the 600-minute budget:
  - 3 Oct: 680;
  - 4 Oct: 736;
  - **5 Oct: 4,194** (3,730 of them from 16 CI runs).

  The alarm is red.
- **Efficiency-audit owner items (CAP-09):**
  - an Auth round trip per request;
  - a snapshot or cache for /pimpinan;
  - learner link prefetch;
  - paging for Konfigurasi.
- **Smaller rulings:**
  - CAP-07's idle-connection rule;
  - C-08 (environment provisioning);
  - D-044(a) (the variable prefix);
  - a staff link between schools (D-049);
  - a card for more than two role-and-school pairs (D-074(10)).

### 11.3 Later, explicitly not 4.0 blockers

| Item | When |
|---|---|
| RPO and point-in-time recovery | Revisit when real learners sit tests in production (D-103(c), D-106(h)) |
| 100,000-user recovery rehearsal | Later (D-106(i)) |
| Data-rights model and export | 4.5 (D-110, D-112(e)) |
| WhatsApp sign-in | 4.1 (D-098(c)) |
| Certificate reissue | Future (D-077(5)) |
| School-facing FAQ | Later; lane paused (D-112(f), D-115) |

## 12. Actions only the owner can take

| # | Action | Blocks |
|---|---|---|
| A1 | **Add Dr Gladys on staging** (Aktivasi → «Orang baru di luar pendataan», then «Admin sekolah» at Sekolah Demo PINTAR) | The 7 Oct walkthrough |
| A2 | **Your own pass on staging** (6 Oct evening), noting what you change in the demo school | Phase 6 |
| A3 | Walk Daisy's J1–J7; the table-stripe test on three real school displays | Daisy's gate |
| A4 | The staging session-pooler host, port and user; O2 (C1) | #150's pre-O3 items |
| A5 | O3 to O8 for #150, one at a time, each reported first | #150 |
| A6 | Name custodian B; R2 and both possession proofs | Any production backup or escrow |
| A7 | A second SYSTEM_ADMIN; second administrators for Supabase, Vercel, GitHub, DNS, mail and AWS (SYS-08, O9) | Real-school use |
| A8 | IP forwarding and the forwarding key; Auth limits (BOB-12's staging acceptance) | CAP-01 |
| A9 | Production SMTP password and Gate 8 production Auth settings; a production send to the M6 inboxes | REL-08 |
| A10 | Name the tier 1 and tier 2 support people; commit to the same-day answer | REL-13 |
| A11 | Physical proofs: print at 100%, phone QR scans, the 0.75 mm gold line; the DNS record for `verifikasi.pintarselalu.com`; a licensed Helvetica Neue 65 Medium for the wordmark master | The card and certificate freeze |
| A12 | C-11: the break-glass rehearsal for the sole production admin; the existing-staff transition rehearsed | Phase 8 |
| A13 | C-13: your educator-as-learner walk with Lana's packages, then withdraw them | Human acceptance of J9 |
| A14 | Switch on the production watch (O10) and the privacy-notice line on backup retention (O11) | Production Ready; real schools |
| A15 | The question to Supabase support on `supautils` (non-blocking) | — |

## 13. Lanes and branches

| Branch | Lane | Last commit | On `main`? |
|---|---|---|---|
| `main` | trunk, **frozen** (D-117) | 6 Oct `12b480b` | — |
| `claude/awesome-rubin-bqxp6p` | coordinator | 6 Oct (records only since `12b480b`) | ahead by records; lands after the walk |
| `ux-1/daisy-experience` | Daisy: design system, documents only | 5 Oct `2f172e2` | no (126 ahead, 16 behind) |
| `claude/quirky-meitner-a04smj` | Bob: Gate 3 work, held then landed | 1 Oct `3724f4d` | yes |
| `claude/adoring-feynman-njmjll` | Lana: educator-as-learner demonstration content | 30 Sep `f197e80` | never, by design (D-069(g)) |
| `claude/new-session-nfib2w` | Fiona: the school-questions handbook | 6 Oct `da08115` | yes; lane paused (D-115) |
| `claude/hopeful-turing-43hvpr` | the corporate website's design grammar | 6 Oct `2f873af` | no; its relation to 4.0 is not recorded |
| `media/sd5-matematika-bab1` | media drafts | 24 Sep | no; media out of scope (D-050) |
| `verify/fable01-broken-pr` | a deliberate-defect PR, "DO NOT MERGE" | 12 Sep | no; deletion pending |

## 14. Monitoring and cost

| Instrument | State | Evidence |
|---|---|---|
| Environment facts (staging and production: app commit, migrations, email settings) | GREEN | Nightly 02:17 WIB and on dispatch; run 37438389611 |
| Staging database and sign-in (migrations, the sign-in boundary, email sender, identity settings) | GREEN | `staging.yml` 37437241796 (re-run after Supabase's Management API outage, HTTP 500 "FGA Authentication Error", which failed 37432544176's Auth steps; nothing changed then) |
| Production watch | Built; **off** until the release (O10) | 37391618155 green when dispatched; scheduled runs skip while `PINTAR_PRODUCTION_WATCH` is off |
| Actions spend (D-090, D-091) | **RED** | The check reported, against a 600 budget: 3 Oct 680; 4 Oct 736; 5 Oct 4,194 (re-run 37440187720). **The measure overstates:** it counts jobs that never got a runner. On 5 Oct, 77 such jobs made up about 1,680 of its 3,730 CI minutes. The rebuilt monitor (D-119, run 37447493370) reads 5 Oct as compute 1,992 · queue 2,524 · estimated billable 2,322 minutes, mostly 16 CI runs at about 120 minutes each (35 jobs). Root cause and fix: closure register CR-64, CR-65 |
| Backups off-platform | Built; **off** (`PINTAR_OFFSITE_BACKUP`) until #150's owner steps | `backup-offsite.yml` never run |
| Restore drill | Built; next scheduled 2 Nov; needs O3 | `restore-drill.yml` never run |
| Key-possession check | Built; quarterly | never run |

## 15. Discrepancies found today

**Corrected in the documents (no product change):**
1. **The operational board** (`RECOVERY-BOARD.md`) was the 1 Oct version: "no Level 3 run", "C1 does not exist", "J9/J10 not built", "no environment facts", and "Phase 2 not authorised" beside "AUTHORISED". Rewritten.
2. **The release checklist pointed to `PHASE-1-STATUS.md` (1 Oct) as the journey status.** It now points to the board and this report.
3. **The findings list (checklist §14)** still showed B4, B5, B6, M5, M7 and Capacity as open on 24 Sep wording. It is now current, with the evidence.
4. **ADM-19** was PASS on the evidence of the class move (M9); the transfer it checks has never been walked. **PASS → PARTIAL** (P2).
5. **STU-01** still said students sign in by email link (retired by M2), **STU-19** still had the 60-minute idle rule (replaced by T1 and Gate 6), and **REL-01 and REL-03** cited 8dd506a and 143 migrations. All brought to current evidence.
6. **REL-09** asked for an offline copy of the production keys; D-107 D8 replaced that with dual-recipient escrow. Annotated; the check's wording is kept.
7. **The checklist's verdict** credited the forwarding key to D-089; it is D-092(c). **CAP-01** said "no load harness or staging project yet". Both corrected.
8. **#150's documents:**
   - the closure plan still had `readiness.txt` (dropped by D-108(d)), staging recipients "R1, R2, R3" (R1 and R3 until R2 exists), and no WP-C progress;
   - the evidence index's scope and CI table stopped before WP-C;
   - the owner's order left out custodian B and the production rulings;
   - the 5 Oct review carried superseded statements with no note.

   All corrected or annotated.

9. **The Golden School contract** said nothing was built. It now has a dated status, the GS-16 bypass, the GS-00 gap and the three mapping corrections it needs.
10. **The scope inventory** called J5.7 a live defect (fixed 4 Oct), J7.7's words pending (ruled by D-095), and still asked for feature flags (removed by D-097(c)). Annotated without changing scope; its evidence pointer now names the board.
11. **The evidence model** said no machine read of the deployed commit exists. Annotated: environment-facts exists. Level 3 is not nightly and not in-run asserted: recorded as a gap.
12. **The resume brief** said staging had 162 migrations and that `main` equals the branch. Corrected.
13. **The old ticket board** shows Gate 3 to 6 tickets as TODO or HELD; they landed. A reconciliation note added; the historical statuses are kept.
14. **The 1–2 Oct status reports** marked historical, pointing here.

**Recorded for you, not changed:**
- **The certificate number** (Q1):
  - D-080(2) decides `<PINTAR ID>/<per-person sequence>`;
  - PINTAR issues `<prefix or PINTAR/<SCHOOL>>/<YYYY>/<per-school sequence>`;
  - the 6 Oct ADM-18 change (mine) extended the issued format without reconciling it;
  - the three staging certificates carry it.
- **«PINTAR SELALU»** on the card and certificate (D-074(3), D-076(b)(7)) versus the wordmark ruling recorded only on Daisy's branch (Q18).
- **The gate order** (Q12), **#150 during the freeze** (Q14), and **162 on production / the PASS criteria** (Q15).
- **Leaked-password protection:**
  - D-033(c) accepted it off; D-082(a) turned it on, with no explicit supersede;
  - staging reads it on;
  - production's setting has not been read.
- **The 12b480b landing:** JOURNEY-LOG 48 said "nothing lands on `main` before she has walked", but `12b480b` (records only, application code unchanged) landed after it. The specimen was pinned at `12b480b` afterwards. Nothing has landed since.
- **The activation order:** the inventory and contract put the password before the PIN; PINTAR asks for the PIN first. Wording only.

## 16. What changed in the repository today (branch `claude/awesome-rubin-bqxp6p`, not on `main`)

| File | Change |
|---|---|
| `docs/coordination/RELEASE-CHECKLIST.md`, `checklist/checklist_data.py` | v2.7 (above) |
| `docs/recovery/RECOVERY-BOARD.md` | Rewritten to 6 Oct |
| `docs/recovery/GOLDEN-SCHOOL-CONTRACT.md` | Status section; the bypass; gaps; mapping corrections |
| `docs/recovery/PINTAR-4.0-SCOPE-INVENTORY.md`, `EVIDENCE-MODEL.md` | Annotations; pointer to the board |
| `docs/recovery/CLOSURE-PLAN-150.md`, `EVIDENCE-INDEX-150.md`, `OWNER-INSTRUCTIONS-150.md`, `BACKUP-DR-REVIEW-2026-10-05.md` | Stale lines corrected or annotated |
| `docs/recovery/PHASE-1-STATUS.md`, `CHECKLIST-PROGRESS-2026-10-02.md`, `docs/coordination/BOARD.md` | Historical notes |
| `docs/coordination/briefs/RESUME-2026-10-06.md`, `docs/recovery/JOURNEY-LOG.md` | Current |
| `docs/coordination/DECISIONS.md` | D-117 |
| `docs/coordination/walkthrough-gladys/` (EVIDENCE, OBSERVER-SHEET), `docs/onboarding/PINTAR-Panduan-Walkthrough-Sekolah-Demo.md` | The walkthrough's instruments |
| `docs/reports/PINTAR-4.0-COMPLETE-STATUS-2026-10-06.md` and `.pdf`; `PINTAR-4.0-Release-Checklist-v2.7.pdf` | This report and the checklist, as PDF |

## 17. Evidence register

| What | Run or commit |
|---|---|
| CI on the specimen's application code | 37430770665 on `3a7501b`: 35/35, 595 tests |
| Staging machine reads | 37430955533 (07:38, `808ae6e`, 162/162); 37437396764 (08:37, `a64b9b6`, 165/165); **37438389611** (08:46, `12b480b`, 165/165, `dpl_4f9zxVXUnTPmQ3WcxzysR3hf3Yar`) |
| Staging migrations and settings | 37432544176 (07:54, 165 applied; Auth steps failed on the Management API outage); **37437241796** (green re-run) |
| Golden School, Sekolah Demo PINTAR | C1 37431278133; GS-02/03 37431385287 (6 PASS); GS-04–11 37432707928 (12); GS-12–16 37433910433 (8); GS-17–21 37434862707 (15) |
| Golden School, the walk before | 37287063109, 37287437383, 37288637571, 37295261257 (5 Oct) |
| L1 | perf-l1 36964437916 (Micro misses D-031 at 1,000; D-089); 50 at once 36982765324 |
| C-12 (educator as learner) | audit 37366709177 (68/68) |
| #150 | G2 native restore (24/24, 8 min 03 s); rehearsal 37389380945; watch 37391618155; CI 37390261594, 37401454517, 37409454539, 37412506567, 37416489180, 37421222152, 37425505226 |
| Actions spend | 37434131870 (GitHub 502); 37440187720 (5 Oct: 4,194 minutes) |
| The walkthrough's baseline | Sekolah Demo PINTAR before her account, read only, 08:46 UTC: 6 places; 4 roles; 8 people; 1 chapter given to 1 class; 10 official results; 3 certificates; 0 in-app reports; 91 audit rows |

## Appendix A. The scope inventory, line by line (6 Oct 2026)

JP = JOURNEY-PROVEN in the 6 Oct runs:
- GS-01: C1 37431278133;
- GS-02 and GS-03: 37431385287;
- GS-04 to GS-11: 37432707928;
- GS-07 cards and GS-12 to GS-16: 37433910433;
- GS-17 to GS-21: 37434862707.

Markers:
- † a documented step covered the line, though the contract's map does not name it;
- ‡ JP on `808ae6e` (the 162-migration set), not on `12b480b`.

TESTED cites `selftest/manifest.json` entries (595, CI 37430770665) or the named audit run. (src) marks a test that only reads source, which the evidence model does not count. HUMAN-ACCEPTED: none.

| ID | Line (short) | State | Evidence | Open |
|---|---|---|---|---|
| **J1** | **Platform operation** | | | |
| J1.1 | School born by an audited, versioned operator process | JP ‡ | GS-01 (found-school 37431278133); G0; C1-S01 | Production founding path not built (M1) |
| J1.2 | First platform admin; a second SYSTEM_ADMIN; audited grants | TESTED | F01-T04, F08-P07 | SYS-08: one platform admin; second due before 23 Sep 2027 |
| J1.3 | Platform admin lands on Konfigurasi; platform state | TESTED | BOB06-R01; audit S1, S2; operator run 36948198799; GS-02 G1 | SYS-02: per-school sign-in facts (Q11) |
| J1.4 | Platform admin creates a school's first admin, audited | JP ‡ | GS-02 G1–G3, G5 | Walked on the 162-migration set |
| J1.5 | Central standard content, versioned, distributed | BUILT | Distribution: M6-S01, M6-K01; SYS-05 PARTIAL | No way to author PINTAR chapters (Q7) |
| J1.6 | Platform-only controls; audit discoverable | BUILT | BOB51-A01, D101-A02, M148-D02 | SYS-07: audit reader not walked; flags removed (D-097(c)) |
| J1.7 | Break-glass for the sole production admin | NOT BUILT | C-11 TODO | Before the production release |
| J1.8 | Evaluation personas outside identity | TESTED | EVAL-N04, EVAL-N09, F16-U01, F16-S01, BOB29-D01; staging readiness 24/24 (37389380945) | Exclusion from PIN and PINTAR ID not named by a test |
| J1.9 | Email operational truth; never "sent" against evidence | TESTED | EMAILJUJUR-K01/L01/D01; F17-L01/L02/C01; BOB51-A01 | Lookup not walked; "stuck flows" untested |
| **J2** | **Identity** | | | |
| J2.1 | Sign-up refused; activation for provisioned identities only | TESTED | PUB-02 (P2); REL-07 (identity-facts 36653019569); BOB26-A02; F18-L01; F09-A01 | — |
| J2.2 | Provisioning silent; the person starts activation | JP | GS-02 G2; GS-06 A3; «Aktifkan akun» in GS-03, GS-10 | — |
| J2.3 | Staff activation: code, username, password, PIN, ID, home | JP | GS-03; GS-09/GS-10; the dean in GS-17; BOB26-A01 | Digital Card welcome passed through, not asserted |
| J2.4 | Explicit name confirmation | JP | GS-02 «Sudah benar, buat dan aktifkan»; wizard «Sudah benar»; GS-07; DAISY-20-NAMA-01; BOB26-A03 | Whole-list review at intake (D-077(2)) not asserted |
| J2.5 | Staff password sign-in; 8+ characters; leaked-password check | JP | Every staff sign-in GS-04 to GS-21; BOB26-A01, BOB26-S01 | Username sign-in TESTED only; production settings at Gate 8 |
| J2.6 | Remove the magic link only when every replacement works | BUILT | BOB27-S01 (src); JOURNEY-LOG 24, 31 | J2.7 unmet; production still on the magic link |
| J2.7 | Existing staff activate with no duplicates, rehearsed | BUILT | F16-S01; operator activated 5 Oct | No staging rehearsal recorded (C10) |
| J2.8 | Each person lands on their own home | JP | Konfigurasi GS-03; /pimpinan GS-09, GS-17; Mengajar GS-10; /belajar GS-12; BOB06-R01 | — |
| J2.9 | Keluar everywhere, this device only | JP | GS-20 U1, X1; DAISY-02-KELUAR-01; BOB05-R01 | «Keluar dari semua perangkat» TESTED only (BOB29-A03) |
| J2.10 | Staff sessions; PIN lock on a shared computer | TESTED | BOB29-K01/S01/D01, A01, A03 | The staff lock never walked; 15-minute fallback unevidenced |
| J2.11 | Recovery by email; other sessions end | JP | GS-21 R2; BOB27-A01, BOB27-D01 | The owner's notice TESTED only (BOB28-A01) |
| J2.12 | Recovery by PINTAR ID + PIN; the lock ladder | JP | GS-21 R3; BOB28-K01/S01/D01, A01, A02 | Ladder and suspension TESTED only |
| J2.13 | Security notices to the owner and platform admin | TESTED | BOB28-A01, A02, D01 | Not walked |
| J2.14 | Six identity emails through PINTAR's own path | TESTED | F17-L01/L02/N01/C01; BOB25-S01/A01; BOB26-A04; codes received on staging | REL-08: no production send; SPF/DKIM/DMARC not read |
| J2.15 | One email shell; the real duration | TESTED | DAISY-19-EMAIL-01, DAISY-20-EMAIL-01, BOB26-S01 | DAISY-37 open (POL) |
| J2.16 | Everyone has a PINTAR ID; staff-only card | JP † | GS-21 R2 (ID on «Akun saya»), R3; F16-I01; DAISY-20-C17-01 | Learner clauses TESTED only |
| J2.17 | Username rules; audited admin correction | TESTED | F16-U01, F16-C02 | `correct_username` has no screen |
| J2.18 | Resend countdown; the same answer whether or not the account exists | BUILT | BOB26-A02; countdown only in DAISY-20-ALUR-01 (src) | No executable test of the countdown |
| J2.19 | Students sign in by class card + PIN only | JP | GS-12; GS-16; GS-20; BOB12-A01; DAISY-13-KARTU-01/02 | Refusal under load TESTED only; IP forwarding off (D-092(c)); CAP-01 not run |
| J2.20 | Student idle lock; PIN resume; safe hand-over | JP | GS-20 U1 (lock at about 302 s; resumed at 5/5; Bunga at 1/5); BOB29-A02 | Long-idle expiry, three wrong PINs TESTED only |
| J2.21 | School re-issues a card or PIN; fixes a wrong email | BUILT | GS-21 R1 (card re-issue walked); BOB28-A03; D101-A02 | Wrong-email correction NOT BUILT (ADM-08) |
| **J3** | **School setup** | | | |
| J3.1 | School admin gets the role, signs in, lands on Konfigurasi | JP | GS-02/GS-03; A1 | — |
| J3.2 | The admin's home shows what setup remains | JP † | GS-03 G4; A2, A5; ADM02-K01 | — |
| J3.3 | Build Bagian, Tingkat, Kelas on a screen | JP | GS-04 A2 | Deactivation confirmation walked only in audit S26 |
| J3.4 | Structure tied to a year; rollover keeps history | TESTED | C1-S01, F10-S05, F10-S08, F10-M02, BOB01-K03; audit S27 | Rollover never in the Golden School |
| J3.5 | Add staff; give and revoke the allowed roles | JP | GS-06 A3, A5; F01-T04; F10-G01; BOB20-A01 | Revocation walked only in audits S24, S26b |
| J3.6 | Enrol students into a Kelas; wrong places refused | JP | GS-07 A4; F10-M01; ADM09-S01 | Refusals walked only in audit S8 |
| J3.7 | Whole-class cards as a printable set | JP | GS-07 M1; M7-K01 | Individual issue for a new student not walked |
| J3.8 | The sealed per-lesson pass mark | JP | GS-05 A7; sealed 0.70 at GS-11; BOB49-S01 | — |
| J3.9 | Report templates from approved metrics (P2) | TESTED | F08-P03, F06-N03, FU1921-D01 | ADM-17 screen never walked |
| J3.10 | Cross-school transfer (P2) | TESTED | F01-T10, F07-P10, FU1921-D01 | Screen never walked (ADM-19 now PARTIAL) |
| J3.11 | Every consequential action leaves a trace | BUILT | F08-P09, F08-P10, F01-T04; audit rows read back | No rule-level test |
| J3.12 | Move a student between classes | TESTED | M9-S01, M9-K01, D088I-S01; audit S25 | Never in the Golden School |
| **J4** | **Content** | | | |
| J4.1 | Import a workbook into the school | JP | GS-08 A6; BOB02-X01 | Per-row messages TESTED only |
| J4.2 | Media travels with the workbook and plays | OUT OF SCOPE (D-050) | BOB11-A01 in CI | Still 4.0 scope (D-050(c)); playback never walked |
| J4.3 | Named content steps; four eyes; explicit freeze | JP | GS-09 A9 | — |
| J4.4 | The head of department's review queue | JP | GS-09 A9 | Empty state walked only in audit S17t |
| J4.5 | Publish ready content; the head of department cannot publish | JP | GS-08, GS-09 | That refusal TESTED only (F01-T21) |
| J4.6 | Pre- and post-tests from marked questions | JP † | GS-11, GS-13, GS-15; F13-P01/P02/N01/N03 | Disjointness TESTED only |
| J4.7 | Lesson content never public | TESTED | F02-T18, F03-T03 | — |
| J4.8 | MCQ Question Bank workflows | UNVERIFIED | Studio → Bank Soal exists | "Workflows" never defined; D-050(d)'s proof not recorded |
| J4.9 | Question Health as observations | BUILT | BOB41-K01; HOD-06 BLOCKED | Needs 30 answers per question |
| J4.10 | Misconception feedback | NOT BUILT | D-063 M1–M5; parked (D-098(d)) | Q9 |
| J4.11 | Two content origins, origin always clear | BUILT | M6-S01, M6-K01; audit S26d | PINTAR chapters cannot be authored (Q7) |
| J4.12 | Correct forward in the same lineage | TESTED | M10-S01, S02, K01, K02; audit S26f | Never in the Golden School |
| **J5** | **Teaching** | | | |
| J5.1 | Educator home: one next action | TESTED | Audit S21b, S22; staging walk J14 | Evidence on earlier commits only |
| J5.2 | Teaching context shown | TESTED | Audit S13 | Earlier commit only |
| J5.3 | Only permitted classes | JP † | GS-10; GS-17 L1 refusal; D088I-S01 | One class only, so "only permitted" is weakly tested |
| J5.4 | Siapkan → Sediakan, WIB window | JP | GS-11 A11; M6-S01 | PINTAR-standard origin blocked by J1.5 |
| J5.5 | Uji Cepat: choose, select, review, launch | TESTED | T2-S01; staging walk 011; audit S26e | Not a Golden School journey |
| J5.6 | The Uji Cepat score where designed | NOT BUILT | EDU-10: per question only | Q8 |
| J5.7 | A single Uji Cepat never certifies | TESTED | BOB50-A01, F19-Q01 | — |
| J5.8 | Progress without judgment or integrity access | JP † | GS-17 L1; F06 tests | Refusals TESTED only |
| J5.9 | Extend a deadline (P2) | NOT BUILT | `extend_session_deadline` (F04-T06) has no screen | UI lane |
| J5.10 | Assistive next suggestion | TESTED | BOB40-K01 | EDU-13 N-T |
| J5.11 | Head of department runs Uji Cepat | TESTED | Audit S27h | Earlier commit only |
| J5.12 | Below-target learners; reassignment | TESTED | M3R-S01; audit S22b | Never in the Golden School |
| J5.13 | The teacher's view of one learner | TESTED | M4-K01; audits S22, S23; GS-17 L1 «Hasil resmi» | Full M4 view not asserted |
| J5.14 | Question-level results after closing | TESTED | D088K-S01, C12-D01; audits S22, S26e | Never in the Golden School |
| **J6** | **Learning** | | | |
| J6.1 | /belajar: one next action | JP † | GS-12, GS-13; UX1-S2-POSISI-01 | Empty state walked only in audit S11 |
| J6.2 | Open a lesson without starting an assessment | TESTED | UX1-S2-ORIENT-01; staging run 7 | GS-13 does not assert "no start" |
| J6.3 | Lesson loads; place kept; last page marks read | JP | GS-14 (5/5 read) | Media out of scope |
| J6.4 | Hints help without revealing | TESTED | STU12-K01, F02-T22; staging walks 37095049799, 37097216208 | — |
| J6.5 | Truthful orientation; only the explicit press starts | JP | GS-13 M3; UX1-S2-ORIENT-01 | — |
| J6.6 | One player; no early keys; answers sync | JP | GS-13, GS-15; F03-T03 | Change-and-reload walked only in audit S21 |
| J6.7 | Pause and resume where permitted | BUILT | `pauseSession` | No test or walk |
| J6.8 | Answers kept through network loss | TESTED | EFF-K01, F09-R02/R03; audit S21; staging walk 37097216208 | Not in the Golden School |
| J6.9 | Finalise only when every answer synced | JP | GS-13, GS-15 (10 sittings FINALIZED) | — |
| J6.10 | Post-test by its link | JP | GS-15 M5 | — |
| J6.11 | Result: meaning, own growth, no comparison | JP | GS-15 | Growth and "no rank" not recorded as asserted |
| J6.12 | Permitted feedback review only | TESTED | Audit S21h | Earlier commit only |
| J6.13 | Honest "nothing more", or the next expectation | TESTED | Audits S21d, S21f | Earlier commits only |
| J6.14 | ID/EN switch on every learner screen | TESTED | J614-K01; audit S21g | — |
| J6.15 | Completion vs mastery; directed to review | JP | GS-15, GS-16 (Citra, Eka below); M3-K01 | Retry on hold (D-112(b)) |
| **J7** | **Evidence** | | | |
| J7.1 | The teacher reads official class evidence | JP | GS-17 L1 | — |
| J7.2 | The head of department's scoped figures | JP | GS-17 L2 | — |
| J7.3 | The dean's summary; seniority grants no write | JP | GS-17 L3 | Write refusals walked only in audit S23d |
| J7.4 | The admin's school report | JP | GS-17 L4 | — |
| J7.5 | Decision queue and briefings | BUILT | F06-P22, UX1-PIMPINAN-KEPUTUSAN-01 | Briefings have no producer; queue not walked |
| J7.6 | Human integrity review | TESTED | Audit S23i; F06 | — |
| J7.7 | Tier words claim no pass | JP † | GS-17 bands; PITA-K01 (D-095) | «Not yet» band (Q10); final words in POL |
| J7.8 | Metric version label changes only with meaning | BUILT | MC-4 (D088G-S01), MC-5 | No rule-level test |
| J7.9 | The dean sees certificate aggregates | JP † | GS-17 L3 (3 = 3 issued) | — |
| **J8** | **Certificate** | | | |
| J8.1 | Eligibility from the sealed mark and official evidence | JP | GS-18 C1 (exactly 3; none for Citra, Eka) | Uji Cepat exclusion TESTED only |
| J8.2 | The learner sees the state; viewing never issues | JP | GS-18 C2, C3 | Not-eligible view walked only in audit S21i |
| J8.3 | Seal course, school, language, name at issuance | BUILT | Name sealed (INV-30); release id in the signed payload | BOB-48 open; the school name is still read live |
| J8.4 | The frozen certificate design | NOT BUILT | DAISY-36 open | The number format conflicts with D-080(2) (Q1) |
| J8.5 | Template and revocation; numbers never collide | BUILT | ADM18-K01, ADM18-K02; GS-18 00001–00003 | Revocation has no screen; printed layout open |
| J8.6 | Anonymous verification; private not-found | JP | GS-19 V1, V2 | Two of three tokens read from the record |
| J8.7 | Production keys with dual-recipient escrow | BUILT | G5 DR-S01–S03; escrow DR-S10 | REL-09; R1/R2 custody (O3, O4, O7) |
| J8.8 | Profile photo on the profile only | NOT BUILT | No screen; the issuer no longer reads the photo | — |
| **J9** | **Educator as learner** | | | |
| J9.1 | Professional-learning places; materials never cross | TESTED | BOB43-D01; audit C12b, C12i (37366709177) | Not a Golden School journey |
| J9.2 | Enrol existing staff only | TESTED | BOB43-D01; C12b | — |
| J9.3 | Participants called «Peserta» | TESTED | BOB43-K01; C12 | DAISY-35 |
| J9.4 | Each audience's visibility enforced | TESTED | BOB43-D01, C12-D01; C12f | — |
| J9.5 | Integrity recorded, never surfaced | TESTED | BOB43-D01; C12g | — |
| J9.6 | Academic readings unchanged | TESTED | C12k hard gate | — |
| J9.7 | The PD certificate issued and verified | TESTED | C12d | — |
| J9.8 | Demonstration content, never on `main` | NOT BUILT (by design) | LANA-22/23 on `claude/adoring-feynman-njmjll` | C-13 walk |
| **J10** | **Help and support** | | | |
| J10.1 | «Laporkan masalah» with context and tiers | TESTED | BOB15-K01/S01/D01 | Never walked; tiers not named (REL-13) |
| J10.2 | PINTAR's own error and not-found pages | BUILT | DAISY-04-TIDAK-ADA-01; probe P3 | Error-page reference checked in source only |
| **X** | **Universal** | | | |
| X.1 | Every screen by clicking; each page checks permission | BUILT | GS clicks throughout; F01-R01 | No rule-level test; GS-16's typed addresses |
| X.2 | Fail closed outside role or scope | TESTED | F01-R01, F01-T02–T04, D101-A02; readiness 24/24; GS-17 scope checks | — |
| X.3 | Success only after a real change | BUILT | S14, S17, EMAILJUJUR-K01 | No rule-level test |
| X.4 | No raw text; ID and EN equal | BUILT | BOB07-K01 (src), UX1-S0-HLE-01, BOB07-R01 | Source-only checks |
| X.5 | "Not yet" never shown as failure | BUILT | U-EMPTY PARTIAL | No rule-level test |
| X.6 | Usable at 320 px | TESTED | Crawl at 320 px (36952453693; audit 37267985806) | Earlier commit |
| X.7 | Context before consequential actions | BUILT | U-CONTEXT examples | No rule-level test |
| X.8 | Privacy: no existence oracle; first names only | BUILT | DAISY-10-SAPA-02, P1, BOB26-A02, BOB28-K01 | Examples only |
| X.9 | Recovery without SQL where self-service is claimed | BUILT | Gates 4–5; card re-issue; D-101 | Wrong-email correction not built |
| X.10 | Responsiveness: first screen ≤ 3 s | BUILT | U-PERF measured 28 Sep | Not re-measured on current code |
| X.11 | Idle → Working → Success/Error; never twice | BUILT | DAISY-17-KIRIM-01 (src), -02, DAISY-18-DENGAR-01 (src) | Source-only checks |
| X.12 | The full UI/UX polish pass | NOT BUILT | D-098(b); D-117(h)–(i) | After Daisy's gate |
| **R** | **Instruments and release** | | | |
| R.1 | Release-day conditions | NOT MET | REL-02 FAIL; REL-08, REL-13 PARTIAL; REL-09 NOT VERIFIED | #150 |
| R.2 | Production changed only by audited steps; no test data | MET to date | Production untouched; G5/G6 guards | — |
| R.3 | People test on staging, in production posture | TESTED | C1-S01; OFFICIAL results in GS-16 M7 | Dr Gladys 7 Oct |
| R.4 | Capacity L1–L5 | NOT MET | CAP-02 FAIL (36964437916); 50 at once safe (36982765324) | Q2 |
| R.5 | Hot paths indexed; growing lists page | BUILT | EFF-K02, 20261109100000 | CAP-10 paging |
| R.6 | Reassess mail capacity for the pilot | NOT STARTED | D-092 (30 an hour) | Before the pilot |
| R.7 | Gates in order | AT ENGINEERING COMPLETE | Declared 5 Oct | Q12 |
| R.8 | One controlled release, then 3–5 educators, then the pilot | NOT STARTED | Production `5b5b68d` | After Production Ready |

