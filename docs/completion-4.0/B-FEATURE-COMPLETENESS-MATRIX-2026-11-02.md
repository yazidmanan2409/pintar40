# B · Feature completeness matrix, 2 Nov 2026

**Requirement authority.** `docs/recovery/PINTAR-4.0-SCOPE-INVENTORY.md`, the approved 4.0 inventory under D-084: **130 lines**, J1 … J10, X (universal) and R (release). It is amended by the later rulings cited per line, in `docs/coordination/DECISIONS.md` D-084 … D-142. Each line was checked against **the code on `main` 001a357** (read on 2 Nov), its tests (`selftest/manifest.json`), its browser steps (`audit/journey.mjs`; `audit/staging/golden-school*.mjs`) and the 9 Oct runs.

**Columns:**
- **Class:** A mandatory · B mandatory with an unresolved detail · C excluded or deferred by a named ruling · E contradictory.
- **Status:** the mandate's statuses only. VERIFIED = VERIFIED — INTERNAL ACCEPTANCE PENDING · IMPL = IMPLEMENTED — NOT VERIFIED · IN PROG = IN PROGRESS · NOT STARTED · BLK-OWNER / BLK-EXT = BLOCKED — OWNER DECISION / EXTERNAL DEPENDENCY. Nothing is ACCEPTED.

**Three rules apply to every row:**
1. **VERIFIED here is functional only.** No screen yet carries Daisy's full composition (`C-OPEN-WORK-REGISTER` §D), so under the mandate's definition of COMPLETE (§3, condition 2), **no line is complete**. Design completion is tracked per screen in the register and in matrix G.
2. VERIFIED rests on 9 Oct evidence. **No CI had run since 9 Oct; Batch 0 re-established it on the branch (`batch-0/02`), which is not a staging or Golden School verification.** The first batch re-establishes it, and EVIDENCE-MODEL rule 3 means nothing carries forward across code changes.
3. A line's gaps point to their work items in `C-OPEN-WORK-REGISTER` (W-ids) and batches in `E-CRITICAL-PATH-EXECUTION-PLAN`.

## Summary

| Status | Lines |
|---|---:|
| VERIFIED — INTERNAL ACCEPTANCE PENDING (functional) | 72 |
| IMPLEMENTED — NOT VERIFIED | 22 |
| IN PROGRESS | 22 |
| NOT STARTED | 4 |
| BLOCKED — OWNER DECISION | 8 |
| BLOCKED — EXTERNAL DEPENDENCY | 2 |
| **Total** | **130** |

**Counted again from the rows after Batch 5 (3 Nov, on the branch):** VERIFIED (all qualifiers) 72 · IMPLEMENTED — NOT VERIFIED 36 · IN PROGRESS 10 · NOT STARTED 3 · BLOCKED — OWNER DECISION 7 (one marked resolved) · BLOCKED — EXTERNAL DEPENDENCY 2 · total 130. The table above is the 2 Nov baseline.

**Class C (not part of 4.0 completion by ruling):**
- **J4.2** media playback (D-050);
- **J4.9** Question Health (P2, needs data, CR-36);
- **J5.9** deadline extension screen (P2; window changes after go-live, D-120 QN3);
- the retry clause of J6.15 (CR-31 held, D-112(b));
- the briefings half of J7.5 (HIDE, D-120 QN4).

**Mandatory lines: 127 of 130.**

---

## J1 · Platform operation

| Line | Requirement | Class | Status | Evidence | Gap → work |
|---|---|---|---|---|---|
| J1.1 | School founded by an audited, versioned operator step | B (who is the «authorised Platform Administrator» when the step is a GitHub dispatch; the production path) | IN PROG | `operator_found_school` (mig 20261108100000); `found-school.yml`; C1-S01; GS-01 | **No production founding path** (the workflow refuses production; the migration is not on production) → W2.20, F-9 |
| J1.2 | Second SYSTEM_ADMIN appointed; audited | A | BLK-OWNER | `grantRoleAction`; F08-P07, F01-T04 | Person not named (CR-69) → F-6 |
| J1.3 | Platform admin: sign-in, chooser, health, environment, schools | B (per-school sign-in facts, Q11) | VERIFIED | BOB06-R01, BOB19-K01; S2; GS G1 | SYS-02 facts (Q11, held) |
| J1.4 | Platform admin creates a school's first admin | A | VERIFIED | S3, S4; GS G2, G3, G5 | — |
| J1.5 | PINTAR standard content: prepared, versioned, distributed | B (second approver = second platform admin) | IMPL | mig 20261204100000; `studio/kanonik`; F20-K01, M6-S01/K01 | **No walk** author → approve → distribute → assign → learn; Bab 1 library re-import not recorded → W6.6, F-6 |
| J1.6 | Platform-only controls restricted, audited; audit reader | A (feature flags C, D-097(c)) | VERIFIED | F01-T18, F08-P09/P10; S23j | Maintenance controls have no browser step → W6.10 |
| J1.7 | Tested break-glass for the sole production admin | A (REL) | BLK-OWNER | none | Needs the second admin and runbook → F-6, W9.12 |
| J1.8 | Evaluation personas outside identity | A | IMPL | EVAL-N04/N09, F16-X01/S01 | No browser step → W6.10 |
| J1.9 | Email operational truth; stuck sends identifiable | B (no «accepted» vs «handed off» state) | IMPL | send log; `/konfigurasi/email-uji`; EMAILJUJUR-*; Batch 4: email_send_stuck, F24-E01, walk B4-W9 | Closed in Batch 4 (W2.19); promotion pending |

## J2 · Identity

| Line | Requirement | Class | Status | Evidence | Gap → work |
|---|---|---|---|---|---|
| J2.1 | No sign-up; activation claims provisioned identity; no oracle | A | VERIFIED | F09-A01, F18-L01, BOB26-A02/K01; P2 | Unknown-address walk on an older SHA → W6.10 |
| J2.2 | Provisioning silent; the person activates | A | VERIFIED | S3, S12; GS G2, A3 | — |
| J2.3 | Activation: code → username → password → PIN → ID/card → home | A | VERIFIED | BOB26-A01, D102-*; S1; GS G4, A8, A10 | Final card is CR-21 (W3.20) |
| J2.4 | Explicit name confirmation | A | VERIFIED | F18-N02/I01; GS G2, G4 | Batch 4: correction screen (W2.2), walk B4-W1; promotion pending |
| J2.5 | Email/username + password; leaked check | A | VERIFIED | BOB26-A01/S01; all staff sign-ins | Production Auth settings → W9.13 |
| J2.6 | Magic link removed only when replacements work | A (REL) | IMPL | `TAUTAN_MASUK_CADANGAN=false` | Depends on J2.7; production still offers it (CR-25) → W9.14 |
| J2.7 | Existing staff activate, no duplicates; rehearsed | A (REL) | BLK-OWNER | F16-S01 | Rehearsal needs the production upgrade rehearsal (#150 B3) → W9.10; a synthetic staging rehearsal can come earlier → W6.10 |
| J2.8 | Each person lands on own home / chooser | A | VERIFIED | L3D, L3A; GS A1, A10, M2 | — |
| J2.9 | Keluar ends this device; «Keluar dari semua perangkat» separate | A | VERIFIED | BD11 (3 engines); GS U1, X1 | «Keluar semua» HTTP only → W6.10 |
| J2.10 | Device lifetimes; shared lock 5 min; end at 60 min / 3 PINs | A | VERIFIED | BOB29-*, CR92-P01; GS U2a, U2 | 60 min and 3-PIN end HTTP only → W6.10 |
| J2.11 | Email recovery ends other sessions | A | VERIFIED | BOB27-*; GS R2 | — |
| J2.12 | ID + PIN recovery; ladder; assisted reset (D-101(1)) | A | VERIFIED | BOB28-*, D101-A02; GS R3 | Ladder and assisted reset not walked → W6.10 |
| J2.13 | Security notices to owner and platform admin | A | VERIFIED | BOB28-A01; GS R3 | — |
| J2.14 | Identity emails through PINTAR's path | A | VERIFIED (staging) | F17-*, BOB25-*; every GS activation | Production SMTP, SPF/DKIM/DMARC → W9.13 |
| J2.15 | Every identity email to the standard | B (final DAISY-37) | IN PROG | `api/_email/identitas.ts` | CR-22; font licence → W3.20, F-11 |
| J2.16 | PINTAR ID; staff Digital Card | A | VERIFIED (core) | F16-I01; GS R2, R3 | Final card CR-21 → W3.20 |
| J2.17 | Username rules; correction audited | E (CR-15 «no screen needed» vs REL-02 zero operator steps) | IMPL | `correct_username`; Batch 4 «Koreksi data orang», walk B4-W2 | Closed in Batch 4 (W2.3, F-8); promotion pending |
| J2.18 | Resend countdown; same with or without identity | A | IMPL | `kode-ulang-walk` 37483810708 (**older SHA**) | Re-walk on current code → W6.10 |
| J2.19 | Students by class card + PIN; refusal under load said | A | VERIFIED (core) | BOB12-A01; S11; GS M2, M6, C2, N1 | Under load: CAP-01 → W9.4 |
| J2.20 | Student idle lock, PIN resume, expiry | A | VERIFIED (core) | BOB29-A02, W2-K01; GS U1 | Long-idle expiry HTTP only → W6.10 |
| J2.21 | School re-issues card/PIN and corrects wrong email, no SQL | A | IMPL | `KartuUlang` (GS R1); Batch 4 email correction screen, walk B4-W3; card → email account, B4-KARTU-A01 | Closed in Batch 4 (W2.1); promotion pending |

## J3 · School setup

| Line | Requirement | Class | Status | Evidence | Gap → work |
|---|---|---|---|---|---|
| J3.1 | School admin receives role, signs in, lands | A | VERIFIED | GS G4, A1; S5 | — |
| J3.2 | Home shows remaining setup | A | VERIFIED | ADM02-K01; GS A2, A5; S12b | — |
| J3.3 | Bagian/Tingkat/Kelas on screen; confirm deactivation | A | VERIFIED | F10-S01..S10, DAISY-05-*; S7, S26; GS A2 | Konfigurasi composition → W3.6 |
| J3.4 | Structure per year; rollover | A | VERIFIED | F10-S05/S08; S27 | — |
| J3.5 | Staff and roles; no self-grant; own staff only | A | VERIFIED | F01-T04, F10-*, BOB20-A01, L4F6-K01; S12, S24, S26b; GS A3 | — |
| J3.6 | Enrol students into a Kelas | A | VERIFIED | F10-M01/M02; S8, S9, S20, S26c; GS A4 | — |
| J3.7 | Class card sets; individual issue and re-issue | A | VERIFIED | M7-K01; S10, S20; GS M1, N1, R1 | — |
| J3.8 | Per-lesson pass mark | A | VERIFIED | BOB49-S01; S17b; GS A7, M5 | — |
| J3.9 | Report templates from approved metrics | A | VERIFIED | F08-P03; S23t | — |
| J3.10 | Transfer request → authorization → execution | B (cross-school directory unruled) | IMPL | Batch 4: cari_sekolah_tujuan, transfer_minta/terima; F24-P01/P02; walk B4-W6/W7 | Closed in Batch 4 (W2.15, F-10); promotion pending |
| J3.11 | Every consequential action leaves a trace | A (universal) | IMPL | audit_log; F08-P09/P10 | **No rule-level test** (CR-59) → W6.1 |
| J3.12 | Move a student between classes | A | VERIFIED | M9-*, D088I-S01; S25, S26d2 | — |

## J4 · Content (Studio)

| Line | Requirement | Class | Status | Evidence | Gap → work |
|---|---|---|---|---|---|
| J4.1 | Workbook import, template, per-row problems, bounded, school only | A | IMPL | `PanelUnggah`, `xlsx.ts`; BOB02-*, F11-*; S14, S26f; GS A6 | Per-row errors never uploaded in a browser; **example workbook withheld** (DG-36); UX-43, UX-18, UX-25, RV-23 → W1.9, W1.10, W6.5 |
| J4.2 | Media with the workbook, plays | **C** (D-050) | IMPL | signed upload; F11-P01 | Out of 4.0 first phases |
| J4.3 | Named content steps; author never approves own; explicit freeze | **B** (no return path from review) | IN PROG | `langkah.ts`, `LangkahTerbit`; F12-*; GS A9 | **A rejected chapter is a dead end** (no transition out of IN_REVIEW except approval; UX-36). The author is shown «Sudah saya tinjau» though the database refuses it. Release presses (UX-15) and step confirmation (UX-39) → W1.4, W1.6, W1.17 |
| J4.4 | Review queue with honest empty state | A | VERIFIED | `studio/tinjau`; S17t; GS A9 | Count cards not links (UX-34); question review layout (DG-25) → W1.2, W1.7 |
| J4.5 | Publish ready content only; HOD cannot publish | A | VERIFIED | `publish_release`; F01-T21, F02-*; GS A9 | HOD refusal has no browser step → W6.5 |
| J4.6 | Pre/post-tests from marked questions; no overlap | A | VERIFIED | F13-*; GS-11, 13, 15 | RV-7 offer without a Pemetaan Awal → W2.12; RV-14 → W1.3 |
| J4.7 | Content never public | A | VERIFIED | F02-T18, F03-T03; S26d2 | Repository exposure is separate (§A-1) |
| J4.8 | Question Bank: browse, filter, key and reason review (QN5) | **E** (the bank is gated as Question Health; teachers who author cannot reach it) | VERIFIED (for HOD/admin) | `studio/bank`; S23q | Who the bank is for → F-7; OP-7 word (Dr Gladys) → W4.2 |
| J4.9 | Question Health observations | **C** (P2, data volume) | IMPL | `kesehatan-soal.ts`; BOB41-K01 | — |
| J4.10 | Misconception feedback; package-carried definitions | A | IMPL | F20-M01..M03; S15c, S26d | Feedback figure never asserted in a browser; per-finding acknowledgement (UX-01) → W1.5, W6.5 |
| J4.11 | Two origins, origin always clear | A | IMPL | kanonik; M6-*; S15b (picker only) | **No walk** of the PINTAR-standard chain; needs the second platform admin → W6.6, F-6 |
| J4.12 | Correct forward; history shows who, why, reviewed by | A | IMPL | M10-*; S26f | **History omits the reviewer/approver**; UX-13 → W1.8 |

## J5 · Teaching

| Line | Requirement | Class | Status | Evidence | Gap → work |
|---|---|---|---|---|---|
| J5.1 | Educator home: one next action | A | VERIFIED | S21b, S22, S26d | UX-37, UX-40, UX-45 → W2.13 |
| J5.2 | Teaching context shown | A | VERIFIED | S13; GS A10 | — |
| J5.3 | Only permitted classes | A | VERIFIED | D088I-S01; S26b, S27h; GS L1 | — |
| J5.4 | Siapkan → Sediakan, both origins, WIB dates | A | IMPL | `siapkan`; F13-N01, M6-*; S18, S26d; GS A11 | PINTAR-standard side not walked (J4.11); J5 composition (date echo, «(opsional)», error under field) → W3.11 |
| J5.5 | Uji Cepat: choose → select → review → launch → learner | A | VERIFIED (Level 2) | T2-*, QAC-*, BOB32/34; S26e, S27h | Level 3 walk (CR-34) after J5.6 → W6.7 |
| J5.6 | **Uji Cepat score where designed** (class first, learners drill-down; D-120 Q8) | A | **NOT STARTED** | none | CR-27 → W2.4 |
| J5.7 | A single Uji Cepat never issues a certificate | A | IMPL | BOB50-*, F19-Q01..Q04 | Browser step with CR-34; stale code comment → W6.7 |
| J5.8 | Progress without judgment; no integrity/QH for teachers | A | VERIFIED | PENUTUPAN-T01; GS L1 | — |
| J5.9 | Deadline extension with reason | **C** (P2; after go-live) | IN PROG | RPC only | — |
| J5.10 | Assistive «what next» | A | VERIFIED | BOB40-K01; S26d | — |
| J5.11 | HOD assigns and runs Uji Cepat in the Bagian | A | VERIFIED | S27h | — |
| J5.12 | Learners below target; reassign reading | A | VERIFIED | M3R-S01; S22b | — |
| J5.13 | Teacher's view of one learner incl. objectives struggled with | B (is «Hasil resmi» the M4 record) | IMPL | `murid/[orang]`; M4-K01; S22; B5C-MURID-K01, F25-T01/T02, walk B5-W5 | Batch 5 (D-156): the objectives not yet reached, by statement (W2.18); on staging (D-158) |
| J5.14 | Question-level results after close | A | VERIFIED | D088K-S01, C12-D01; S22, S26e | — |

## J6 · Learning

| Line | Requirement | Class | Status | Evidence | Gap → work |
|---|---|---|---|---|---|
| J6.1 | /belajar one next action; honest empty | A | VERIFIED | S21f, S19; GS-12/13 | J4 composition → W3.10 |
| J6.2 | Open a lesson without starting an assessment | A | VERIFIED | S19; GS-13/15 | — |
| J6.3 | Lesson loads; place kept | A (media C) | VERIFIED (text) | GS-14; S21c, S21e | RV-8 missing seeded audio → W2.12 |
| J6.4 | Hints help without revealing | A | IMPL | `bantuan-terjadwal`; browser run on older SHA | Re-walk → W6.10 |
| J6.5 | Truthful orientation; explicit start | A | IMPL | GS-13; B5B-PEMETAAN-K01 | Batch 5: RV-7 closed on the branch (W2.12); promotion pending |
| J6.6 | One player; sync; reload safe | A | VERIFIED | S21; GS-13/15 | — |
| J6.7 | Pause and resume | A | IMPL | F03-T11 | Browser walk (STU-08) → W6.10 |
| J6.8 | Answers kept through network loss | A | VERIFIED | S21 student 3; EFF-K01 | Level 3 coverage → W6.3 |
| J6.9 | Finalise only when synced | A | VERIFIED | S21; GS-15 | — |
| J6.10 | Post-test by its link | A | VERIFIED | GS-15 | — |
| J6.11 | Result: meaning and growth, no rank | A | VERIFIED | GS-15 | — |
| J6.12 | Permitted feedback review | A | VERIFIED | S21h | — |
| J6.13 | «Nothing more» or next expectation | A | VERIFIED | S21d, S21f | — |
| J6.14 | ID/EN on learner screens | A | VERIFIED | S21g | — |
| J6.15 | Completion ≠ mastery; no unlimited retries | A (retry C, CR-31) | VERIFIED | S21d, S22b; GS-15/16 | — |

## J7 · Evidence and reporting

| Line | Requirement | Class | Status | Evidence | Gap → work |
|---|---|---|---|---|---|
| J7.1 | Teacher reads class evidence | A | VERIFIED | S22; GS-17 | — |
| J7.2 | HOD scoped figures | A | IMPL | S23; GS-17; B5A-LAPORAN-K01, B5A-PIMPINAN-K01, walk B5-W4 | Batch 5: shell, place and period named, RV-9 on the branch; report body and print layout await Daisy (W3.8) |
| J7.3 | Dean school summary | A | IMPL | S23d; GS-17; B5A-LAPORAN-K01, B5A-PIMPINAN-K01 | Batch 5: as J7.2; the school report covers every school year and says so |
| J7.4 | School admin reaches the school report | A | IMPL | GS-17; S23t; B5A-LAPORAN-K01, walk B5-W4 | Batch 5: as J7.2 (W3.8 partial: Daisy) |
| J7.5 | Decision queue (briefings HIDE, QN4) | A (briefings C) | IMPL | S23r; B5A-TAKLIMAT-K01 | Batch 5: the briefing promise removed (CR-37, W2.6); promotion pending |
| J7.6 | Human integrity review; referral scoped | A | IMPL | S23i, S23r; B5-INTEGRITAS-K01, F26-I01, journey S23r, walk B5-W2 | Batch 5: one decision per observation, a reviewed state, the referrer sees the outcome (W2.7); promotion pending |
| J7.7 | Readiness tiers claim no pass | A | VERIFIED | GS-17; PITA-K01 | — |
| J7.8 | Metric version label | A (EC) | IMPL | D088G-S01 | No rule-level test → W6.1 |
| J7.9 | Dean certificate aggregates | A | VERIFIED | GS laporan | — |

## J8 · Certificate

| Line | Requirement | Class | Status | Evidence | Gap → work |
|---|---|---|---|---|---|
| J8.1 | Eligibility from sealed mark + official + gate | A | VERIFIED | GS-18 | — |
| J8.2 | Learner sees state; rendering never issues | A | VERIFIED | S21i; GS-18 | — |
| J8.3 | Sealed at issuance | A | VERIFIED | mig 20261201100000 (CR-02); GS-18 | — |
| J8.4 | Certificate as designed, A4, QR (CR-03/04) | B (frozen design needs font licence, institution mark column, print proof) | BLK-OWNER | `KartuSertifikat`, `LembarA4`, `KodeVerifikasi` | Wordmark licence and physical proof → F-11; then W3.19 |
| J8.5 | Template and **revocation**; numbers never collide | A | IMPL | ADM18-K01/K02; GS-18; B5-CABUT-K01, F26-C01/C02, walk B5-W1 | Batch 5: revocation on a screen (CR-05, W2.5); promotion pending |
| J8.6 | Anonymous verification | A | VERIFIED | P1; GS-19 | Production DNS (CR-11) → W9.15 |
| J8.7 | Production signing key and pepper; escrow | A (REL) | BLK-EXT | keyring; DR-S01..S10 | #150 B5 → W9.6 |
| J8.8 | **Profile photo** on the profile only (CR-07) | A | IMPL | Batch 4: «Foto profil»; B4-FOTO-K01; walk B4-W10 | Closed in Batch 4 (W2.8); promotion pending |

## J9 · Educator as learner

| Line | Requirement | Class | Status | Evidence | Gap → work |
|---|---|---|---|---|---|
| J9.1 | Professional-learning place in the school | A | VERIFIED | C12b, C12i; BOB43-D01 | Not Level 3 → W6.3 |
| J9.2 | Enrol existing staff only | A | VERIFIED | C12b | — |
| J9.3 | «Peserta» not «Murid» | A | VERIFIED | C12; BOB43-K01 | Academic metrics also say «Peserta» (RV-9) → W3.9 |
| J9.4 | Visibility by audience in DB | A | VERIFIED | C12f, C12-D01 | — |
| J9.5 | Integrity never surfaced to leadership | A | VERIFIED | C12g | — |
| J9.6 | Academic readings unchanged | A | VERIFIED | C12k | — |
| J9.7 | PL certificate issued and verified | A | VERIFIED | C12d | — |
| J9.8 | Demonstration content never on main; walk with Lana's packages (C-13) | A | BLK-OWNER | side branch | Owner's walk (C-13); CR-57 polish → W2.16, F-17 |

## J10 · Help and support

| Line | Requirement | Class | Status | Evidence | Gap → work |
|---|---|---|---|---|---|
| J10.1 | «Laporkan masalah» with context and status; tiers named | A | IMPL | S23l; BOB15-K01; MenuAkun «Laporan saya» (Batch 2) | CR-78 closed in Batch 2 (verified Batch 4); tiers unnamed (CR-71) → F-13 |
| J10.2 | Own error and not-found pages with a reference | A | VERIFIED | P3; crawl | Forced-500 walk → W6.10 |

## X · Universal rules

| Line | Requirement | Class | Status | Evidence | Gap → work |
|---|---|---|---|---|---|
| X.1 | Every screen by clicking | A | IN PROG | crawl; GS | CR-78; no rule-level test → W2.9, W6.1 |
| X.2 | Fail closed outside role/scope | A | VERIFIED | F01-*, D101-A02; GS-17 | **CR-91** held → F-3, W5.1 |
| X.3 | Success only after a real change | A | IMPL | EMAILJUJUR-K01 | Rule-level test → W6.1 |
| X.4 | No raw text; ID = EN; Terminology v1 | A | IN PROG | `hle.ts`; BOB07-K01 | OP-5 DB-held strings; OP-6/OP-7 (Dr Gladys) → W4.1, W4.2 |
| X.5 | «Not yet» never failure | A | IMPL | `KartuKetiadaan`; B5A-PIMPINAN-K01 | Batch 5: «(0/5)» replaced by the CR-46 sentence (W3.9) |
| X.6 | Usable at 320 px | A | IN PROG | crawl 320 px | RV-11, RV-19, RV-20, RV-23; crawl detects overflow only → W3.*, W6.4 |
| X.7 | Context before consequential action | A | IMPL | L3D/L3A; B5A-LAPORAN-K01 | Batch 5: reports name school, class and period (W3.8 partial) |
| X.8 | Privacy: no oracle, no internals | A | VERIFIED (examples) | P1, BOB26-A02; GS-19 | Rule-level test; CR-91 → W6.1, F-3 |
| X.9 | Recovery without SQL where claimed | A | IN PROG | Gates 4–5 | CR-13, CR-14, CR-15, CR-05 → W2.1–W2.5 |
| X.10 | U-PERF ≤ 3 s | A (P0) | IMPL | last measured 28–30 Sep | Re-measure after L3 and shell (CR-58) → W6.2 |
| X.11 | Idle → Working → Success/Error, never twice | A (EC) | IMPL | DAISY-17/18 (source) | Rule-level test → W6.1 |
| X.12 | Full UI/UX polish pass | A | IN PROG | D-138 steps 1–3, 5 | **J1–J7 compositions not applied**; steps 4a–4f partial → W3.* |

## R · Instruments and release

| Line | Requirement | Class | Status | Evidence | Gap → work |
|---|---|---|---|---|---|
| R.1 | Release-day conditions | A | BLK-EXT | REL-02 FAIL (77/84 P0) | #150 B3 refuses production migrations → W9.* |
| R.2 | Production changes only through audited steps | A | IMPL | G5/G6 guards | Production DB not read → W9.10 |
| R.3 | People test on staging in production posture | A | VERIFIED | C1-S01; GS | — |
| R.4 | Capacity L1–L5 (L1 P0) | A | BLK-OWNER | L1 FAIL 36964437916 | Compute tier, forwarding key → F-14, W9.3, W9.4 |
| R.5 | Hot paths indexed; lists page | A | IN PROG | EFF-K02 | CR-49; FD-4 at 10× → W2.10, W2.17 |
| R.6 | Mail capacity for the pilot | A | NOT STARTED | — | CR-73 → F-16 |
| R.7 | Gates in order | **E → resolved by D-142** (the mandate sets the order) | BLK-OWNER → resolved | — | Record only |
| R.8 | One controlled release → educators → pilot | A | NOT STARTED | production 5b5b68d | Phases 5–6 |

**R.7 is resolved by D-142.** The owner's mandate now fixes the order: Gates 0–6, then Dr Gladys. That makes it 7 lines BLOCKED — OWNER DECISION in substance.
