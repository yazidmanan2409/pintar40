# PINTAR 4.0 · Open / partial closure register (pre-Gladys gate, D-118)

**6 October 2026.** Prepared by the coordinator for Yazid and the Second Eye. **Step 1 of D-118: nothing has been fixed.**
This register reconciles existing evidence; it does not reinterpret PINTAR. The evidence it reconciles:
- the status report of 6 Oct (`PINTAR-4.0-COMPLETE-STATUS-2026-10-06.md`, with its Appendix A of 130 inventory lines);
- the release checklist v2.7;
- the scope inventory;
- the recovery board, charter and evidence model;
- DECISIONS to D-118;
- the Golden School runs of 6 Oct;
- the board's BOB and DAISY tickets;
- the #150 evidence index;
- Daisy's design-system status (`ux-1/daisy-experience`, READY TO VALIDATE).

**Status as of:** `main` `12b480b` (application code = `3a7501b`, CI 37430770665); staging GREEN, 165 of 165.

**Approved by the Second Eye as the control document (6 Oct), subject to four amendments, made here:**
1. **CR-50 is a mandatory pre-Gladys trust item.** Q9 decides how, not whether.
2. **CR-07 and CR-15 rejustified from the frozen 4.0 requirements.** CR-07 stays A by D-086(e) and the D-052 gate order. CR-15 moves to the operations gate before the EDUCATOR PILOT: J2.17's frozen requirement (an audited platform-admin operation) is met and TESTED, and no requirement asks for a screen.
3. **CE-8 completed;** the starvation guard proven never green, never reusable (§1A CE-8).
4. **No allowance from the old ~120-minute assumption.** One authoritative cycle was measured under D-119, and QN7 is recalculated from it (§2 «Cost»).

**Buckets (D-118(e)):**

| Bucket | Meaning |
|---|---|
| **A** | Close before Gladys |
| **B** | Prove before Gladys: built and believed correct, so prove it, do not rewrite it |
| **C** | Owner ruling required: I stop on it |
| **D** | Production gate, not Gladys gate: stays open and visible |
| **E** | Out of scope by an existing ruling |

**Column codes:**

| Column | Meaning |
|---|---|
| **Who meets it** | U = an ordinary user of that role; G = Dr Gladys as «Admin sekolah», on her guide or by natural exploration; — = neither |
| **FI** | It can affect a first impression |
| **PR** | It blocks Production Ready |

**The threshold (D-118(c)):** Dr Gladys has approved Daisy's design direction, so anything she can see that is below that standard is FI, and Daisy's propagation is itself bucket A.

## 0. Progress

**Batch 0 closed (6 Oct):** `PINTAR-4.0-CLOSURE-BATCH-0-2026-10-06.md`.
- Closed: CR-10, 16, 17, 20, 26, 32, 60, 61, 62 and 64.
- GS-20's U1 had an instrument defect, now corrected; batch 6 re-proves it.
- Allowance spent: 60 of 1,900 estimated minutes.

**Batch 2 closed (6 Oct), reported with batch 3** (`PINTAR-4.0-CLOSURE-BATCH-3-2026-10-06.md` §6):
- Closed: CR-18 (staging run 37483810708), CR-19, CR-29 and CR-45 (CI 37489874488), CR-33, 35, 38, 39, 40, 42, 43 and 44 (journeys audit 37487347244, 72 PASS).
- **CR-41 becomes an A item:** not walkable, because the transfer form takes raw UUIDs no screen shows (S7, Daisy with engineering).
- CR-30 moves to batch 6 (it needs the specimen's fresh learner).
- Seven findings from the walks (W-1 to W-7, report §7) are proposed for the register. W-2 (a referrer can decide their own referral) needs an owner ruling.

**Batch 3 closed (6 Oct):** `PINTAR-4.0-CLOSURE-BATCH-3-2026-10-06.md`.
- Closed: CR-47 with Q10 (Alternative 4 and the not-yet state), CR-02, CR-01, CR-50, CR-13 (server and route; the screen is S7) and CR-51.
- Landed: main 9a46bf5 (CI 37489874488 on the branch and 37493596839 on main, each 18/18 with 617 tests); staging at 171 migrations (run 37493598299).
- Allowance spent: 400 of 1,900 estimated minutes (report §8), 144 of them wasted on two red runs. The ceiling is likely to bind during batch 5.
- Questions for the owner and Daisy are in the report §4.

CR-28 and CR-37 are not in batch 3, as D-120 ruled:
- CR-28 leaves this gate (QN3, after go-live).
- CR-37's surface is removed in slice S6 (QN4).

**D-122 (7 Oct):**
- Batches 2 and 3 GREEN; CR-13's four choices confirmed.
- CR-51: staging's Bab 1 to be re-imported into the library and distributed (batch 6, with the new specimen). The second production admin is CR-69, open until named.
- CR-47's populations told apart (CR-81).
- W-2 is CR-76 (separation of duties). W-1, 3, 4 and 6 are CR-75, 77, 78 and 79; W-7 joins CR-41. W-5 is accepted with a truthful state (CR-80).
- CR-52 now. Batch 4's order fixed. The allowance kept; the forecast again before S1.

**CR-52 walked (7 Oct, run 37531719996, 72 PASS and 1 FAIL):** S23q FAIL as QN5 words it (filter, and key and reason on the bank); every other step PASS. The same run showed the journey still walks pre-CR-50 chapter copies (CR-82). Allowance: 441 of 1,900.

**D-123 (7 Oct):** CR-52 → A (S7, deliberately small). CR-82 fixed and proving now. CR-81's assessed denominator and floor confirmed. W-2 (CR-76) and CR-81 land as a pre-Daisy engineering batch, with the existing role model. CR-80 closed.

**Batch 3b closed (7 Oct):** `PINTAR-4.0-CLOSURE-BATCH-3B-2026-10-07.md`.
- CR-82 proven (journeys 37547178658).
- CR-76 (W-2) and CR-81 landed: CI 37549911642, 18/18, 620 tests; main bd4c0fa; staging 173.
- CR-52 is an A item for S7 (D-123(1)).

**D-124 (7 Oct):**
- Batch 3b GREEN.
- Engineering closure work held; the baton passes to Daisy.
- Her brief: `docs/coordination/briefs/DAISY-BATCH-4-2026-10-07.md`.

**Batch 4 (7 Oct):**
- Daisy: READY FOR REVIEW on `7c6aefe` (`HANDOFF-DAISY-41.md`, lane `d226fef`).
- The coordinator re-ran her three checks with the same results, and confirmed the four journey mismatches in the code.
- Your walk sheet: `docs/reports/PINTAR-4.0-BATCH-4-WALK-SHEET-2026-10-07.md`.

Next: your walk of J1–J7 and the stripe; then Daisy's corrections and APPLICATION READY (D-122(7)).

**D-126 (7 Oct):**
- Everyone paused while Dr Gladys went through PINTAR.
- Her natural-use session produced DG-19 to DG-37.
- The coordinator's read-only investigation (`PINTAR-4.0-DG-19-37-INVESTIGATION-2026-10-07.md`) was accepted GREEN by the Second Eye.

**D-127 (7 Oct):**
- Working context ruled; Q1–Q11 ruled.
- Eight closure streams CR-83 to CR-90, bucket A, with DG-19 to DG-37 as their acceptance evidence.
- FD-5 is provenance first.
- The CI forecast, brought forward, shows the 1,900 ceiling binding (`PINTAR-4.0-D127-WORKING-CONTEXT-AND-CLOSURE-STREAMS-2026-10-07.md` §5).
- D-126 stays active; next is the Second Eye's review, then one implementation order.

**D-128 (7 Oct):**
- D-126 lifted for L1–L4, under gates: L3's context-model design is reviewed before any L3 code.
- E1 approved for L1. P1–P4 held until APPLICATION READY is frozen and reviewed.
- FD-5 provenance first: it leaves L1, because sealed content is affected and the value is in the sealed hash.
- Terminology restraint. The DG numbering recorded. Daisy's batch 4b brief issued.

**L1 landed (7 Oct):** `PINTAR-4.0-CLOSURE-L1-2026-10-07.md`.
- **E1 proven live:** main's run 37584213073 on 8ee3585 cancelled itself as ALREADY PROVEN by 37580997224, and the deploy lookup finds that run. Main cost 3 estimated minutes instead of about 70.
- **CR-86:** its engineering landed (one Secret field, ten inputs).
- **CR-90:** BD-11 closed (BD11 PASS, three engines, personal and shared). The stale `lanjut` moves into L3's design.
- **Runs:** CI 37580997224 (18/18, 621 tests); journeys 37581007813 (73 PASS; S23q, CR-52's known A item); main 8ee3585.
- **FD-5:** counted (124 + 729 sealed questions, the value hashed). Option A, which fixes the reading and leaves the data, awaits a ruling.
- **Allowance:** 734 of 1,900 spent (L1 113). Re-forecast: 1,097–1,310 for the work that remains, against 1,166.
- **Stopped for the Second Eye before L2.**

## 1. The register

### Certificates

| ID | Item (source) | State now | What is missing | Who meets it | FI | PR | Ruling | Closure evidence | Bucket → destination |
|---|---|---|---|---|---|---|---|---|---|
| CR-01 | **The certificate number** (D-080(2), D-076; BOB-48; checklist §14) | Conflict: issued `PINTAR/<SCHOOL>/<YYYY>/<NNNNN>`; decided `<PINTAR ID>/<5-digit per-person sequence>` | A ruling, then the number as ruled (BOB-48's per-person counter under `FOR UPDATE`) | G (journeys 7–8), U | yes | yes | **Q1**, corrected 6 Oct: **already decided**. D-080(2) rules the format and D-080(9) rules that a student's certificate shows the PINTAR ID; the issued format is the defect. Left: retire «Awalan nomor» | The ruling recorded; ADM18-K01/K02 restated red → green; GS-18 shows the ruled number. Staging's three issued certificates are not rewritten without a migration ruling | **C → A** · OWNER RULING, then ENGINEERING |
| CR-02 | **Sealing at issuance** (J8.3; D-078(c), D-077(d); BOB-48) | BUILT in part: the name is sealed (INV-30); **the school's name is read live** on the certificate page | Seal the school name, course and language at issuance; the page and the print read the seal | G, U | low (invisible until a school renames) | yes | none: D-078(c) decides it | A test red today (rename the school → the certificate changes), green after; GS-18 | **A** · ENGINEERING |
| CR-03 | **The certificate as designed** (J8.4; DAISY-36; D-076, D-078(d), D-080) | NOT BUILT: the screen is not the frozen Modern design | DAISY-36: the one design on screen and in print, one A4 page; the number unbroken; the 10 mm inset band | G (Utama's certificate), U | **high** | yes | **Q18**: the PINTAR wordmark (Daisy's Q16 ruling, recorded only on her branch) vs «PINTAR SELALU» (D-074(3), D-076(b)(7)). Owner action: the physical proof (print at 100%, phone QR scans, the 0.75 mm gold line, D-080(6)(7)) | The certificate screen and print match the frozen design; GS-18 C2; a visual check | **A** · DAISY (after Q18 and the proof) |
| CR-04 | **The printed sheet** (ADM-18) | PARTIAL | As CR-03: print one clean A4 page | G, U | yes | yes (P1) | with CR-03 | A print check in the visual review; a print-CSS test | **A** · DAISY (with CR-03) |
| CR-05 | **Revocation screen** (ADM-18, J8.5) | `revoke_certificate` exists and is audited with a reason (D-097); **no screen** | A screen for the school admin: reason, confirmation, result; the public check then reads revoked | G (exploration), U | medium | yes (P1) | none expected; placement is Daisy's | Admin revokes on screen → public check no longer «Berlaku» → audit row; a new Level 3 step | **A** · DAISY + ENGINEERING |
| CR-06 | **«CLASSIC / MODERN / MINIMAL»** shown raw in Studio's certificate layout | Exposed: three English codes | DAISY-36 makes the frozen design the only one, so the choice goes; «Awalan nomor» stays | G (Studio), U | **yes** | no | none (DAISY-36(1): one design) | The picker gone; the prefix still saved and used (ADM18-K02) | **A** · DAISY + ENGINEERING |
| CR-07 | **Profile photo on the student's profile** (J8.8; D-085 T4, D-086 G1) | NOT BUILT (the upload path and `persons.photo_path` exist; no screen) | The student's own profile photo screen; never on the card or the certificate | U (students); G only via the student side | low | EC line | none (T4 decides: the student's choice, profile only) | The upload walked; the card and certificate unchanged (ADM18-K01 already proves the issuer ignores it) | **A** · DAISY + ENGINEERING (last; small). **Why A, from the frozen requirements (amendment 2):** J8.8 is a line of the frozen 4.0 target (D-086(a)) at gate EC, and D-086(e) rules «4.0 provides a student profile-photo capability, on the profile only». D-052(b) puts ENGINEERING COMPLETE («the intended 4.0 functionality … incomplete flows fixed») before Yazid and Gladys, D-052(e) defers nothing that belongs to 4.0, and D-118(d) restores that order. So it is A by the gate order, not by first impression (Gladys is unlikely to meet it). Its precondition holds: the issuer no longer reads the photo (JOURNEY-LOG item 47, ADM18-K01) |
| CR-08 | Public verification: no name, private not-found | JP (GS-19 V1, V2) | — | G, U | — | — | — | Closed | closed |
| CR-09 | One certificate per eligible learner; no number collision | JP (GS-18 C1), TESTED (ADM18-K01) | — | — | — | — | — | Closed | closed |
| CR-10 | Stale "the issuer copies the photo" (JOURNEY-LOG waiting list :137) | Superseded by item 47 | Annotate | — | — | — | — | A docs note | **A** · docs |
| CR-11 | The verification domain `verifikasi.pintarselalu.com` (D-080(8)) | Not set (DNS); staging uses the app's own route | DNS | — | — | yes | owner action | DNS resolves; V1 on the domain | **D** · RELEASE-DAY |
| CR-12 | Production keys in dual-recipient escrow (J8.7, REL-09) | BUILT on stand-ins | #150 B5: O3, O4, R2, O7 | — | — | yes | — | #150 | **D** · #150 |

### Identity and people

| ID | Item (source) | State now | What is missing | Who meets it | FI | PR | Ruling | Closure evidence | Bucket → destination |
|---|---|---|---|---|---|---|---|---|---|
| CR-13 | **Correct a wrong email** (J2.21 P1; ADM-08; U-RECOVER) | NOT BUILT; no RPC | A governed correction: who may change a staff email, before or after activation, with notices to the old and the new address | G (exploration), U | medium (an ordinary mistake with no way back) | yes (P1) | **Q-new (QN1)**: who may correct a staff email, and when. D-101 is silent; it is a credential channel, so the security boundary is the owner's | Red test (no path) → RPC and screen → walk | **C → A** · OWNER RULING, then ENGINEERING + DAISY |
| CR-14 | **Correct a person's name** (ADM-08; `correct_person_name` exists, audited) | No screen | A screen in the people list, with reason and confirmation | G, U | medium | P1 | none (D-077(d): an issued certificate is never rewritten) | Walked; audit row; the certificate unchanged | **A** · DAISY + ENGINEERING |
| CR-15 | **Correct a username** (J2.17; `correct_username`, audited platform-admin operation) | J2.17 **TESTED**: `correct_username` is the platform admin's only, needs a reason and is audited with from, to and reason (F16-U01). No screen | Not a frozen requirement: J2.17 asks for «an audited platform-admin operation», C9 for «an exceptional, audited platform-admin operation» with «no rename flow», D-077 ruling (3) for «platform admin only in 4.0, controlled and audited». None asks for a screen. What is missing is a way to run it without SQL (the owner never runs SQL) | — (platform admin; Gladys cannot reach it) | no | no | none | The operator corrects a username on staging without SQL; the audit row read | **Moved by amendment 2: D · the operations gate before the EDUCATOR PILOT (D-052(b))**, the first gate at which real people choose usernames. J2.17's EC requirement is met (reclassified, D-118(f)). Not in the pre-Gladys slices. If a username needs correcting on staging before then, it is a finding for the owner, not an improvised fix |
| CR-16 | **A new learner after the chapter is given** (D-118 §8) | Not walked; the code gives a learner their current class's chapters | Proof as a person does it: one learner added → one card → signs in → sees the existing chapter → begins by clicking | G (journeys 5–6), U | yes | — | none | **A new Level 3 step, GS-22**, in the Golden School | **B** · ENGINEERING (instrument) |
| CR-17 | **Staff on a shared computer** (J2.10; Gate 6) | TESTED (BOB29-*), never walked: walks choose «Komputer pribadi saya» | Walk «Komputer bersama»: the lock at 5 minutes, PIN resume, the 60-minute end | G (if she chooses it), U | medium | — | none | A staff variant in GS-20 | **B** · ENGINEERING (instrument) |
| CR-18 | **Resend countdown on code screens; the same answer either way** (J2.18) | Source-only check | An executable test | G (activation), U | low | — | none | Test red on a broken countdown, green now | **B** |
| CR-19 | **Persona exclusion from the PIN and PINTAR ID** (J1.8 clause) | Unverified clause | A test | — | — | P0 | none | Test | **B** |
| CR-20 | **Security notices to the owner and the platform admin** (J2.13) | TESTED (BOB28-*) | Read the notice in the staging mailbox during GS-21 | U | low | — | none | A GS-21 assertion | **B** |
| CR-21 | **The staff Digital Card and welcome** (DAISY-24, Gate 7; J2.16) | The card shows, but not as final (physical proof pending); the welcome is passed through, not asserted | DAISY-24: the card final | G (her activation), U | **yes** | POL | **Q18** (wordmark); owner action: the physical proof (D-074(12)) | Visual check; DAISY-20-LAYAR-01 asserted in GS-03 | **A** · DAISY |
| CR-22 | **The PINTAR email system** (J2.15 POL; DAISY-37; D-079) | One shell exists (DAISY-19/20-EMAIL-01); the canonical system is not done | DAISY-37: every identity email in the final standard. **The activation email is Dr Gladys's very first contact with PINTAR** | G (first contact), U | **very high** | yes (before release) | none (D-079 decides the standard) | The emails as received in the staging mailbox, in a visual check | **A** · DAISY |
| CR-23 | Leaked-password protection: D-033(c) "off" vs D-082(a) "on" | Staging reads it on; production not read | A recorded supersede | — | — | Gate 8 | **QN2**: confirm D-082(a) supersedes D-033(c) | DECISIONS note; production read at Gate 8 | **C** (a record only) |
| CR-24 | **The existing-staff transition, rehearsed** (J2.7; C10; D-054(e)) | No staging rehearsal recorded | Rehearse production's existing staff moving to activation, with no duplicates | — | — | yes | none | C-11's rehearsal | **D** · RELEASE-DAY |
| CR-25 | The magic link removed on production (J2.6) | Production `5b5b68d` still has it | The release itself | — | — | yes | — | The release | **D** · RELEASE-DAY |
| CR-26 | Activation order wording | **Re-examined in batch 0 (6 Oct):** the inventory and the contract were right (username → password → PIN → name, D-054(b), and the server's `URUTAN_LANGKAH`). The wrong text was the contract's own note «PINTAR asks for the PIN first», which came from G4's title and was never observed | Correct the note; G4 records the observed order and asserts D-054(b)'s | — | — | — | — | G4 in the batch 0 walk | **A** · docs + instrument |

### Teaching and learning

| ID | Item (source) | State now | What is missing | Who meets it | FI | PR | Ruling | Closure evidence | Bucket → destination |
|---|---|---|---|---|---|---|---|---|---|
| CR-27 | **The Uji Cepat score** (J5.6 P1; EDU-10) | NOT BUILT: per question only | Where the score appears is undecided | U (teacher, head of department) | medium | P1 | **Q8**: for the class, each learner, or both? | Screen walked in a Level 3 Uji Cepat journey | **C → A** · OWNER RULING, then DAISY + ENGINEERING |
| CR-28 | **Changing an assignment's window** (EDU-11 / J5.9 P2; D-093 T1) | `extend_session_deadline` exists (one learner's session, audited, ≤ 3) with no screen. Since D-093 T1 closed the direct table write, **an assignment's window cannot be changed at all** | Decide whether 4.0 lets a teacher correct or extend a window | U (teacher) | low for Gladys; real for schools | P2 | **QN3**: is changing a window (and extending one learner) 4.0 now, or after go-live (P2, D-028)? | If in: an audited RPC, a screen, a walk | **C** · OWNER RULING |
| CR-29 | **Pause and resume where allowed** (J6.7 P1; STU-08) | `pauseSession` exists; no test, no walk | Establish the rule from the specification, then prove it | U (student) | low | P1 | Only if the rule is not in the record (I find no ruling naming it) | A test + a walk; if no rule exists, C | **B** (→ C if no rule) |
| CR-30 | **Answers kept through network loss** (J6.8 P0) | TESTED: staging browser walk 37097216208, audit S21 | Re-run on the new specimen | U | low | P0 | none | The staging "assistance and offline" walk green on the specimen | **B** |
| CR-31 | **The second attempt** (D-112(b); J6.15) | ON HOLD by ruling | Nothing, unless you rule | U | — | — | **On hold (D-112(b))**: confirm it stays as built until you rule | — | **C** (surfaced, not contaminating) |
| CR-32 | **No session before the press; growth and "no rank"** (J6.2, J6.11 clauses) | Not asserted in the walk | Assertions in GS-13 and GS-15 | G (student side), U | low | P0 | none | GS assertions | **B** |
| CR-33 | **Audit-only evidence on earlier commits** (J5.1, J5.2, J5.11, J6.12, J6.13; X.6 at 320 px) | TESTED on earlier commits | One audit run on the new specimen | U | low | P0/P1 | none | `audit · end-to-end journeys` green on the specimen | **B** |
| CR-34 | **Uji Cepat as a Level 3 journey** (J5.5, J5.7) | TESTED; staging walk 011; audit S26e | A Level 3 Uji Cepat step: choose → launch → hand in → result (with CR-27) | U | medium | P1 | with CR-27 | A new GS step | **B** (→ A with CR-27) |
| CR-35 | **"What next" suggestion** (J5.10 P2; EDU-13 N-T) | TESTED (BOB40-K01) | A walk | U (teacher) | low | P2 | none | The audit run (CR-33) | **B** (low) |
| CR-36 | **Question Health** (J4.9 P2; HOD-06) | BUILT; needs 30 answers per question | Data volume; the human journey cannot run on a demo | U (head of department) | no | P2 | none | Stays TESTED (BOB41-K01) | **outside** (P2, data-dependent) |

### Evidence and leadership

| ID | Item (source) | State now | What is missing | Who meets it | FI | PR | Ruling | Closure evidence | Bucket → destination |
|---|---|---|---|---|---|---|---|---|---|
| CR-37 | **Briefings** (J7.5 P2; DEA-04; D-061 #2) | BUILT in part: a briefings surface exists (`/edukator/ringkasan`, the class page's "is there a briefing"), but **nothing produces a briefing**, so it always reads «Belum ada…» | A producer, or the surface hidden until there is one | U (teacher, dean) | medium (a promise that never fills) | P2 | **QN4**: build briefings for 4.0, or hide the surface until 4.x? | Either a briefing produced and read, or the surface gone | **C** · OWNER RULING |
| CR-38 | **The decision queue** (DEA-04's EC part: «Diteruskan ke pihak sekolah» → /pimpinan decides; BOB-39) | TESTED (F06-P22, BOB39-K01), never walked | A walk | U (dean) | low | EC | none | A Level 3 step | **B** |
| CR-39 | **The audit reader** (J1.6, SYS-07) | Never walked | A walk (school admin and platform admin) | G (Konfigurasi), U | medium | P1 | none | A walk | **B** |
| CR-40 | **Report templates** (J3.9 P2; ADM-17) | TESTED, never walked | A walk | G (Konfigurasi), U | medium | P2 | none | A walk | **B** |
| CR-41 | **Transfer between schools** (J3.10 P2; ADM-19, now PARTIAL). **D-122: A, with W-7** (the receiving school sees an 8-character ID; solved with the transfer journey) | TESTED, never walked | A walk (two schools) | U (admins) | low | P2 | none | A walk | **B** |
| CR-42 | **Class move** (J3.12 EC) | TESTED; audit S25 on earlier commits | A Level 3 step or the audit run | G (Struktur, people), U | medium | EC | none | GS step or CR-33 | **B** |
| CR-43 | **Year rollover** (J3.4; ADM-21) | TESTED; audit S27 | A walk on a separate school (it changes the school) | G («Jalankan pergantian» is on Konfigurasi), U | **yes**: one press changes the whole demo school | P1/P2 | none | Walk on its own school; the confirmation reads what will happen | **B** |
| CR-44 | **«Laporkan masalah»** (J10.1 REL; REL-13) | TESTED, never walked | A walk: report → status → the admin and platform admin see it | G, U | medium | yes | the tier people are an owner action | A walk; the tiers named | **B** + **D** (tiers) |
| CR-45 | **Error-page reference** (J10.2) | Checked in source only | An executable test | U | low | P0 | none | Test | **B** |
| CR-46 | **«(0/5)» cards that promise figures** (X.5; U-EMPTY, DAISY-07) | PARTIAL | An honest empty state | G (a class below five), U | **yes** | P1 | none | In Daisy's feedback slice; a walk | **A** · DAISY |
| CR-47 | **The «not yet» band; certificate grade labels** (J7.7 POL; D-095(g)) | Open | Q10 | U | medium | POL | **Q10, ruled by D-121:** Alternative 4; the not-yet state built | A new scoring version with no descriptor below 70%, prospective; the not-yet state emitted; red then green; GS-17 again | **A** · ENGINEERING (batch 3) |
| CR-48 | **Cross-school admin sign-in facts** (SYS-02 P1) | Open | Q11 | — (platform admin) | no | P1 | **Q11** | Per the ruling | **C** (not on Gladys's path) |
| CR-49 | **Paging for lists that grow with schools** (CAP-10; BOB-13) | N-I | Paging in the platform admin's lists | — (platform admin; staging has a handful of schools) | no | onboarding > 10 schools | none | A paged list | **D** · CAPACITY (onboarding gate) |

### Content

| ID | Item (source) | State now | What is missing | Who meets it | FI | PR | Ruling | Closure evidence | Bucket → destination |
|---|---|---|---|---|---|---|---|---|---|
| CR-50 | **Misconception linkage** (J4.10 EC; D-063; JOURNEY-LOG #13) | NOT BUILT. **Not parked any more:** D-098(d) parked #13 "until the remaining build is complete", and D-098(f)'s build is complete. Its symptom is visible: each chapter's review carries about 31 false "weak misconception" findings that a head of department must acknowledge one by one | D-063 M1–M5 (schema, upload contract, content regeneration), after your 2 Oct question is settled | G (Studio findings), U (reviewers) | **yes** (Studio looks noisy and wrong) | EC | **Q9**: per-school definitions, or shared canonical (national) definitions with school-made ones apart? | Publish a chapter with 0 false findings; tenancy tests; content regenerated | **A, mandatory pre-Gladys trust item (amendment 1).** Q9 decides **how** (the definitions' tenancy), never **whether**: a Studio that tells a head of department 31 things are wrong when they are not is a trust failure, whatever the design. OWNER RULING (Q9), then ENGINEERING (the largest item here) |
| CR-51 | **PINTAR standard content end to end** (J1.5 EC; M6 vs D-029; SYS-05) | BUILT (distribution) | Who authors and approves it; may imports target the library? | U (teachers, on Siapkan) | medium | EC | **Q7** | One PINTAR chapter authored → distributed → assigned → learned | **C → A** |
| CR-52 | **"The MCQ Question Bank workflows"** (J4.8 EC; D-050(a), (d)). **Walked 7 Oct (journey S23q, run 37531719996): FAIL as QN5 words it.** Browse met (the newest 40 of SD's 54, none of another school; no paging, 14 older ones unreachable); **filter: none**; **key and reason: not on the bank and no link to them** (each chapter's package page shows them, D-088(h)); no authoring met. **D-123(1): A · DAISY (S7) + ENGINEERING**, deliberately small: useful filtering or search, every applicable question reachable, the question shown with its key and reason; no authoring | UNVERIFIED: D-050(d) says "the Question Bank workflows intended for this phase, proved separately", and no record defines them. What exists: Studio → Bank Soal (browse); questions come from workbooks only | A definition | G (Studio), U | medium | EC | **QN5**: confirm 4.0's meaning. Proposed: browse, filter and review the school's questions with key and reason; no authoring outside workbooks. Then prove | A walk of Bank Soal against the confirmed meaning | **C → B** |
| CR-53 | **Media playback** (J4.2; STU-11, ADM-10, X-07) | OUT OF SCOPE for the first testing phases (D-050) | — | — | — | yes, eventually (still 4.0, D-050(c)) | unless you change D-050 | — | **E** (D-050) |

### Added by D-122 (7 Oct): the walks' findings and CR-47's presentation

| ID | Item (source) | State now | What is missing | Who meets it | FI | PR | Ruling | Closure evidence | Bucket → destination |
|---|---|---|---|---|---|---|---|---|---|
| CR-75 | **Integrity review names people** (W-1; batch 3 report §7) | Studio «Tinjauan Integritas» names a sitting by 8 characters of its UUID; the note has no label; only a sitting's newest signal can be reviewed; reviewed and new look alike | The learner's name, with the PINTAR ID as secondary disambiguation; a labelled note; a visible state | U (heads of department, school admins) | yes | EC | D-122(5) | The walk S23i/S23r reads names, not IDs | **A** · DAISY (S7) + ENGINEERING |
| CR-76 | **Separation of duties for integrity decisions** (W-2) | `advance_management_decision` checks Management scope only: the referrer can decide their own referral | Whoever raised a referral cannot decide it. With no other eligible decider, the case shows as waiting for an independent decision | U (heads of department, deans) | — | EC | D-122(4) | A database test (the referrer refused, another decider accepted) red before, green after; the walk | **Closed on the server and the referrer's card (batch 3b, 20261205100000; F06-P22, F06-P15, plant bob39-2, PENUTUPAN-W01; CI 37549911642).** The waiting state's design is S6's |
| CR-77 | **The referrer sees the outcome** (W-3) | A school admin may refer (CAN_REVIEW_INTEGRITY), but /pimpinan refuses them, so no screen shows them what became of it; the decision card has no way to the evidence; one phrase names two acts | The referrer sees the final status and outcome their permissions allow (receive → acknowledge → status → next step) | U (school admins) | — | EC | D-122(5) | A walk: a school admin refers, then reads the outcome | **A** · ENGINEERING + DAISY |
| CR-78 | **«Laporan saya» reachable by navigation** (W-4) | The page exists; only the redirect after sending reaches it; the copy key `lapor.saya.buka` is unused | A link where the reporter's journey needs it; no typed-URL proof | U (every staff reporter) | yes | — | D-122(5) | S23l reaches it by clicking | **A** · DAISY |
| CR-79 | **The audit trail in human words** (W-6) | Raw action codes in mixed conventions, raw table names and id fragments, no actor; newest 50 only | Meaningful labels, the raw value underneath and secondary. **CR-13's addresses stay off school-facing surfaces** (D-122(1)): today the screen reads no payload (`konfigurasi/page.tsx:124`) | G (Konfigurasi), U | yes | P1 | D-122(5) | S23j reads labels; the payload stays unread | **A** · DAISY (S7, presentation) |
| CR-80 | **Report templates: the existing state told truthfully** (W-5) | No screen revision (the form never sends the template; a second save fails generically) | **No editor (J3.9 promises composition only).** The screen says truthfully what exists and what can be done | U (school admins) | — | P2 | D-122(5) | S23t, with a second save answered truthfully | **Closed, accepted for 4.0 (D-123(6))**: no editor |
| CR-81 | **Class figures: the populations told apart** (D-122(3), after CR-47) | Counts per band and «Belum mengerjakan» are produced, but the bars are drawn against every placed learner, and the minimum-sample floor applies to that total | Learners, assessed, not yet, achieved mastery, below threshold shown apart. **Performance bands over the assessed denominator** (the floor too: confirmed by D-123(3)); readiness includes the not-yet | U (teachers, heads of department) | **yes** | POL | D-122(3) | A test (a class of 30 with 6 assessed) red before, green after; S6's visual check | **Closed in the data and two functional lines (batch 3b, MC-7, 20261206100000; F20-N01, F20-N02, PENUTUPAN-K01; CI 37549911642).** The presentation, and the counts against the school's mark, are S6's |
| CR-82 | **The journey walks the regenerated chapters** (instrument; CR-50's closure evidence, «publish a chapter with 0 false findings») | `audit/fixtures/sd5-matematika-bab{1,2}.paket.json` are copies made before CR-50: no misconception codes, so the walk's Bab 2 still raises 32 WEAK_MISCONCEPTION_LINKAGE findings (run 37531719996, S26d). The PINTAR content itself is regenerated (PENUTUPAN-M04) and the database proves a fully linked chapter publishes with none (F20-M03) | The two fixtures replaced by today's packages, and a journeys run showing 0 such findings through the screens | — | — | — | none (CR-50's own evidence) | S15c/S17/S26d: 0 WEAK_MISCONCEPTION_LINKAGE | **Closed: journeys 37547178658** (Bab 1 and Bab 2 publish with zero weak-linkage findings) |

### Added by D-127 (7 Oct): the eight closure streams from Dr Gladys's natural-use session

Fix the root, never the DG item. The full conditions are in `PINTAR-4.0-D127-WORKING-CONTEXT-AND-CLOSURE-STREAMS-2026-10-07.md` §3; the evidence is `PINTAR-4.0-DG-19-37-INVESTIGATION-2026-10-07.md`.

| ID | Item (source) | State now | What is missing | Who meets it | FI | PR | Ruling | Closure evidence | Bucket → destination |
|---|---|---|---|---|---|---|---|---|---|
| CR-83 | **Working Context and School Scope** (RC-1, RC-2; D-127 Q1, Q2, Q3, Q11) | No working context exists: the door is dropped at sign-in, landing is by highest role, `/akun` and `/` use all roles; school-shaped screens merge every school for a multi-school reader | A session-and-device working context that only the person changes and that never widens authority; one named school context for school-shaped work | G (every multi-role person), the platform operator | **highest** | P0 | D-127 Q1, Q2, Q3, Q11 | Door × role-set table walked; context-never-widens tests; every school-shaped screen names its school. DG-19 (visible), 20, 21, 22; school parts of 23, 30, 31, 32 | **A** · CLAUDE + DAISY (shell) |
| CR-84 | **Form Contract and Uji Cepat** (RC-3; D-127 Q4; CR-06) | Studio's older forms: refusals unnamed (reference only), input discarded after a refusal, dependent choices not bound to a school; a second Uji Cepat launcher outside D-085 T2 | One human Uji Cepat journey; every known refusal named; values kept; choices bound; the certificate picker removed | G, U | yes | P0 | D-127 Q4; CR-06 | Static test extends BOB32-K01 to Studio's actions; a refused launch keeps 5 minutes. DG-23 (QH0ZS3), DG-24, DG-31 (KFRLGH) | **A** · CLAUDE (+ Daisy's words) |
| CR-85 | **Human Interface Boundary** (RC-4; D-127 Q5, closure invariant) | Raw IDs, enums, JSON, keys and bare numbers on staff screens (22 items, investigation §E); the F06-S03 guard catches only enum columns | The extended static guard, red then green; fixes through shared components | G, U | yes | P1 | D-127 Q5 | Guard green over every page; a walk of every staff screen finds no machine value as a primary label. DG-27, 28, 29, 34 (numbered in D-128), DG-11 (Jejak Audit); labels in 30–33, 35 | **A** · CLAUDE + DAISY (labels) |
| CR-86 | **Credential Privacy** (RC-7; D-127 Q6, Q10) | Secret fields behave four ways; activation and reset share one reveal across two fields; some have none | One Secret-field component on every password, PIN and reusable secret; one-time codes stay readable | G (DG-37), every user | yes | P0 | D-127 Q6, Q10 | Static test over every secret input; walk of activation, reset, Akun saya, lock, sign-in. DG-37 | **Engineering landed in L1** (8ee3585; PENUTUPAN-R01; CI 37580997224): one Secret field on all ten secret inputs. Activation and sign-in walked (journeys 37581007813); reset, Akun saya and the lock rendered only, so their browser walk is the regression's. Presentation: DAISY (batch 4b) |
| CR-87 | **Studio Purpose and Role Boundaries** (RC-5; FD-8; D-127 Q7, Q8) | Nine Studio tabs shown to everyone Studio admits; the JSON import open to teachers; Aturan Penilaian and the library grant form exposed without a ruled purpose | Tabs by role; JSON import operator-only; Aturan Penilaian not teacher UI, its owner named; the grant form usable by the operator alone | G, U | yes | P1 | D-127 Q7, Q8; CR-52, 75, 77 as ruled | Each tab states its question and next action. DG-32 (purpose), 33, 35 | **A** · CLAUDE + DAISY (S7) |
| CR-88 | **Shared Collection and Content Grammar** (RC-6; D-127 Q9) | Unbounded lists with an edit form per row; question review unstyled; the lesson preview flattens what the player renders; no example workbook | Collection with explicit edit; Question review; the preview through the player's components; a separate marked example workbook | G, U | yes | P1 | D-127 Q9 | No list beyond one page or with a form per row; preview = player test. DG-25, 26, 30 (UX), 33 (UX), 36 | **A** · CLAUDE + DAISY |
| CR-89 | **Functional and Data Correctness** (FD-4, FD-5, FD-6, FD-7, FD-9) | Names lost at platform scale; Mudah/Sulit inverted; preview ≠ player; reviewed integrity items never leave; saved rules may never become effective | Each finding's condition (record §3); **FD-5 provenance first** (record §4) | G, U (teachers: FD-5) | yes | P0 | D-127 (FD-5 approach; Q8 for FD-9) | FD-5: an author's word round-trips; FD-4: names at 10× staging. DG-26, 30, 32, 33, Konfigurasi fragments | **A** · CLAUDE |
| CR-90 | **Browser Session Proof** (RC-8; BD-11; J2.9) | Server sign-out proven (F01-R05); browser Back after «Keluar» never run; the reload-on-restore guard runs only on shared or card devices | The BD-11 walk in Chrome, Edge and Safari, shared and personal; a fix only if it fails | every shared-computer user | yes | P0 | none (J2.9, BD-11) | BD-11 passes; a stale `lanjut` never carries the next sign-in. DG-19 (security part) | **BD-11 closed in L1** (8ee3585; journeys 37581007813, BD11 PASS in Chromium, Firefox and WebKit, personal and shared). **Open: the stale `lanjut`**, moved into L3's design (routing, behind L3's hard stop) · CLAUDE |

### Experience: Daisy's design system (the threshold of D-118(c))

| ID | Item (source) | State now | What is missing | Who meets it | FI | PR | Ruling | Closure evidence | Bucket → destination |
|---|---|---|---|---|---|---|---|---|---|
| CR-54 | **The UI/UX polish pass** (X.12 POL; D-052(b), D-068(f); D-098(b)) | NOT BUILT: the application wears the pre-design screens | Daisy's approved grammar on every screen, in slices (§2) | G everywhere, U | **highest** | POL | none (approved in principle; questions 1–17 ruled) | Each slice: CI → staging → visual check → regression | **A** · DAISY |
| CR-55 | **Daisy's validation** (11-validation.md): the owner walks J1–J7; the stripe on three school displays | READY FOR YOUR WALK: J1–J7 composed on `7c6aefe` (HANDOFF-DAISY-41); her checks re-run by the coordinator, same results | Your walk, your rulings (walk sheet of 7 Oct), and the display test | — | — | — | **owner actions** | Findings ruled; A stands or moves to A+ | **A** (owner) |
| CR-56 | **The wordmark master** (Helvetica Neue 65 Medium, licence; DAISY-RESUME) | Pending | The font licence and the outlined master | G (header, card, certificate) | yes | — | owner action (licence) | The master in the design system | **A** (owner + Daisy) |
| CR-57 | **Educator-as-learner polish** (DAISY-35; J9.3) | TODO | Inside the propagation slices | U (participants) | low | EC | none | Slice visual check | **A** · DAISY (within slices) |
| CR-58 | **Responsiveness re-measured** (X.10; U-PERF, last measured 28 Sep) | Not re-measured on current code | Measure after propagation (the design changes what loads) | G, U | yes (slowness is a first impression) | P0 | none | U-PERF on the final specimen | **B** |
| CR-59 | **Rule-level proof for the universal rules** (X.1, X.3, X.4, X.7, X.8, X.11: examples or source-only checks) | BUILT | — | — | — | P0 | none | The propagation regression walks every screen by clicking; no new rule-level suites (not chasing counts, D-118(f)) | **B**, through the regression |

### Instruments (the proof itself)

| ID | Item (source) | State now | What is missing | Bucket |
|---|---|---|---|---|
| CR-60 | **GS-00 inside the walk** (evidence model §4) | Rests on reads before and after | Each walk asserts staging's commit and migrations first | **B** · ENGINEERING (instrument) |
| CR-61 | **GS-16's typed addresses** | A declared bypass | The four extra students reach their tests by clicking, as the primary does | **B** · ENGINEERING (instrument) |
| CR-62 | **The contract's step map** (GS-18 ↔ J8.3; GS-13 ↔ J6.7/J6.8; J7 labels) | Wrong in places | Corrected | **A** · docs |
| CR-63 | **Level 3 cadence** (evidence model: every `src` merge, nightly) | Dispatch only | Keep dispatch-only for cost, and say so in the model; the closure gate runs it per slice | **C** (light): **QN6**, confirm dispatch-only |
| CR-64 | **The CI / Actions efficiency gate (D-119)** | See §1A | Built on the branch; see §1A | **A** · ENGINEERING (in progress) |
| CR-65 | **The CI budget for this gate**, and D-091(e)'s remaining structural fixes: S2 (group the static red cases), S4 (share stacks between plants, about half the boots), S5 (cache the browser) | **S4 done (D-120):** a cycle 123 → 68 estimated minutes (run 37458146396), isolation fingerprinted per case. S2 and S5 not worth touching (about 3 and under 1 minute) | The allowance figure: about 1,900 proposed from the measured forecast | **C** · OWNER (the allowance) |

### 1A. The CI / Actions efficiency gate (D-119): kept apart from product behaviour

| # | Control | Finding / state | Built (branch) | Evidence |
|---|---|---|---|---|
| CE-1 | **Root cause of the 5 Oct burst** | Between 19:24 and 21:33 UTC, three CI runs and two audit runs met a runner shortage. In CI run 37363672848 only 7 of 35 jobs got a runner in 25 minutes; the rest, the cheap lint/type/build gate included, waited until their own `timeout-minutes` (20 and 25) and were cancelled with no step run. The next CI run was attempted 4 times (100 jobs). Across the day, 110 jobs never got a runner. **What cancelled them:** their timeouts, measured from queueing. **Why no runner:** not verifiable from here (GitHub hosted capacity or the account's concurrency limit). **Billed?** By GitHub's rule only runner time is billed; GitHub's per-run timing API returns 0 for every run of this repository (even normal ones), so the bill itself is on your billing page | — | The jobs API, filter=all, 5 Oct |
| CE-2 | **Supersede on the same branch** | `ci.yml` already cancelled an older run on the same ref. Not across triggers (a pull request and a dispatch were separate groups), and the end-to-end audit (11 runs on 5 Oct) had no guard | `ci.yml`: one group per branch name, whatever the trigger; `audit-journeys.yml`: a group per branch, cancel in progress | CI-W02 |
| CE-3 | **No duplicate triggers** | CI is dispatch-only on branches, push-triggered only on main, and pull requests. The same commit could run twice (dispatch and pull request, or two dispatches) | The supersede group above, and the guard below: a commit already proven by a green run is not run again | CI-W02 |
| CE-4 | **Cheap gates first** | All 35 jobs queued at once, the 30 red cases beside lint/type/build | A first guard job; then lint, typecheck and build; migrations and red cases only after they pass; red cases at most 15 at a time | CI-W02 |
| CE-5 | **Skip only what is proven unchanged** | The push filter skipped `docs/audit` and `docs/onboarding`, **which tests read** (launch-readiness.sql, hosted-credential-audit.sql, the intake workbook, the lesson content). That is unsafe. **Found while proving CE-8:** a whole-folder rule is unsafe even for docs/coordination, docs/reports and docs/deployment, because `tsconfig.json` compiles every `**/*.ts` and `**/*.mts` and lint reads every script, and those folders hold code (`ux/sertifikat/*.mts`, `checklist/render_docx.mjs`, `handover/bob18/*.mjs`) | **v2 (`43d9438`):** a path is skipped only when it is an **inert document** (md, pdf, images, office files, csv, txt, html) in those three folders, or a staging request file. A code file is never skipped, wherever it lies. Renames count as both paths (`--no-renames`). The push filter is the same 30 patterns. On working branches only (never on main), the guard cites an earlier run instead of running when the code is identical (CE-8). CI-W02 fails if any code CI executes starts reading those paths | CI-W02 |
| CE-6 | **The monitor's measure** | Counted waiting as billed: 4,194 for 5 Oct | Three numbers (compute, queue, estimate) and jobs by outcome (completed, cancelled after start, never started, skipped); API retries (6 Oct died on a 502). For 5 Oct, the monitor's own run (37447493370) reads **compute 1,992 · queue 2,524 · estimate 2,322 minutes**, where the old measure said 4,194 | CI-W01; replay of 5 Oct |
| CE-7 | **The waste alarm** | None | Red at 10 jobs that never got a runner after waiting over 5 minutes, any wait over 15 minutes, a third attempt, or one commit run twice, even at no cost; the cost alarm apart. **Corrected 6 Oct (`0d80c36`):** the first version also counted jobs a supersede cancelled before they got a runner (a minute or two, no cost), and went red on 6 Oct with no starvation. Those are now listed apart. Replayed: 6 Oct waste none; 5 Oct still red. Starvation guard: CI does not queue its jobs while another run's job has waited over 10 minutes for a runner | CI-W01, CI-W02 |
| CE-8 | **Measure the result, and prove no false green** | — | **The rule:** a run is `success` only when every job ran and succeeded. A `verdict` job needs all seven jobs and fails unless each result is `success`. The two guard outcomes, DEFERRED · NOT PROVEN (starved runners) and ALREADY PROVEN, **cancel the run**; if the cancel does not take hold in 90 s the guard exits 1. So neither can end `success`, and only `success` is ever cited: by the deploy gates (exact SHA, `success`) and by the guard's own search (`success`, strict selftest `success`, at most 72 h, identical code). The outcome table and the measured runs: `PINTAR-4.0-OWNER-RULINGS-2026-10-06.md` §2–§3. **Measured:** a full cycle is 123 estimated minutes (run 37450773138, 37/37 jobs, 597 tests); a docs-only commit is cited for 2 (run 37453037724, ALREADY PROVEN, `cancelled` in 30 s) | CI-W02; runs 37450773138 and 37453037724 |

### Production, release and legal (kept open; not the Gladys gate)

| ID | Item | State | Bucket |
|---|---|---|---|
| CR-66 | #150 (pre-O3, O2–O12, custodian B, the production rulings, the O8 rehearsal) | NOT PASS; checkpoint GREEN to proceed (D-111) | **D** · #150 |
| CR-67 | Capacity: L1 at the chosen tier (CAP-01, 02, 07, 08, 09); IP forwarding and the forwarding key (BOB-12 staging acceptance) | L1 failed on Micro (D-089) | **D** · CAPACITY (Q2, Q3) |
| CR-68 | The production upgrade rehearsed from 111 to 165 | Not done | **D** · RELEASE-DAY |
| CR-69 | Break-glass for the sole production admin (J1.7, C-11); a second SYSTEM_ADMIN (SYS-08, O9). **D-122(2):** a named, accountable person who accepts the role, credentials and recovery independently controlled; also CR-51's second approver; open until Yazid designates them | Not done | **D** · RELEASE-DAY |
| CR-70 | Production email: SMTP password, Gate 8 settings, a production send with SPF, DKIM and DMARC (REL-08) | PARTIAL | **D** · RELEASE-DAY |
| CR-71 | Support: tier people named, the same-day answer (REL-13) | Owner | **D** · RELEASE-DAY |
| CR-72 | REL-02 (every P0 PASS on the candidate, zero operator steps); REL-12 | Open | **D** · RELEASE-DAY |
| CR-73 | Mail capacity for the pilot (R.6; D-092) | Not started | **D** |
| CR-74 | The legal and data-protection gate (UU PDP, PSE, consent, retention, the privacy-notice line O11); content licensing (D-112(c)); the AI-tooling policy (D-112(a)) | Open | **D** · LEGAL |

## 2. Closure batches, in dependency order

Each batch ends with its report (D-118 §11). Each batch that changes code gets **one CI run on its final head**: 123 estimated minutes measured under D-119 (run 37450773138).

| Batch | What | Depends on | Changes the app? |
|---|---|---|---|
| **0. Records and instruments** | CR-10, 26, 62 (docs); CR-64 (the CI efficiency gate, D-119: built now); CR-60, 61 (GS-00 in-run, GS-16 by clicking); CR-16 (GS-22, the new learner); CR-17 (staff shared computer); CR-20, 32 (assertions) | — | No (audit and tooling only) |
| **1. Your rulings** (§3) | Q1, Q18, QN1, Q8, QN3, QN4, Q9, Q7, QN5, Q10, QN2, QN6, QN7 | — | No |
| **2. Proof on today's code** | CR-18, 19, 29, 30, 33, 35, 38, 39, 40, 41, 42, 43, 44, 45: tests and walks, no product change. Anything red becomes an A item | Batch 0 | No (tests only) |
| **3. Behaviour that does not wait for design** | CR-02 (sealing); CR-01 (the number, after Q1); CR-13 (email correction RPC, after QN1); CR-28 and CR-37 if ruled in; CR-50 (mandatory, its shape per Q9; the largest, possibly its own batch); CR-51 per Q7 | Batch 1 | Yes (server; screens follow in the slices) |
| **4. Daisy's gate** (order: D-122(7)) | Daisy composes J1–J7 → **you walk them once Daisy says the design-system specimen is ready for owner validation** (CR-55) → findings corrected at source → the stripe test → Daisy freezes APPLICATION READY. Also CR-56 (licence, master); the physical proofs for the card and certificate; your rulings on screens. **Then the allowance forecast again, before S1** (D-122(8)) | Batches 1, 3 | No |
| **4b. D-127's eight streams** (record §3, §6) | The Second Eye's review of D-127 → D-126 lifted with one order to Claude and one to Daisy → the roots fixed in about four landings (record §5): privacy and correctness first (CR-86, CR-90, FD-5 after its count, CR-84), then CR-83, CR-85, CR-87, CR-88 and the rest of CR-89. Daisy's grammar takes the Secret field, context and school indication, Question review and the Collection **before** APPLICATION READY. Then regression, Yazid's own natural use, and Dr Gladys's natural use #2 | Batch 4's walk; D-127 | Yes |
| **5. Propagation, slice by slice** (each: tests → lint → typecheck → build → CI → staging → visual check → the affected GS) | **S1** foundation: tokens, type, colour, spacing, radii, elevation, focus, the base shell. **S2** shells and navigation: the staff shell, the learner's top bar, the MODE PERAGAAN band. **S3** feedback and forms: Idle → Working → Done, fields, errors, dialogs, empty states (CR-46), dates. **S4** identity: activation, sign-in, recovery screens; the Digital Card (CR-21); the email system (CR-22). **S5** learner screens. **S6** teacher and leadership screens, tables with the stripe; the Uji Cepat score (CR-27); briefings per QN4. **S7** admin screens: Konfigurasi, Pendataan, Aktivasi, Studio; corrections (CR-13, 14); revocation (CR-05); Bank Soal (CR-52). **S8** the certificate (CR-03, 04, 06) and the profile photo (CR-07) | Batch 4 | Yes |
| **6. Full regression** | A fresh Golden School with GS-22, Uji Cepat and the new steps; the audit run; U-PERF (CR-58) | Batch 5 | No |
| **7. Your final walkthrough** | Your green light (D-052): what you find is fixed and re-proven; the specimen frozen; Dr Gladys's guide, observer's sheet and baseline re-pinned | Batch 6 | Only fixes you approve |
| **→ PRE-GLADYS CLOSURE REPORT, then STOP** | D-118 §12 A–L | Batch 7 | — |

**Cost, from one measured cycle (amendment 4; the earlier forecast from an assumed ~120 minutes a run is withdrawn):**
- **The cycle:** CI run 37450773138 under D-119 measured compute 101 · queue 41 · estimate **123** minutes. It ran 37 of 37 jobs and 597 tests, all green. The 25 database red cases are 99 of the 123.
- **The gate's units:** 18–20 cycles, with about one in five re-run after a fix; full Golden School walks at 44 and audits at about 36, about 480 in all.
- **The gate:** about **2,700–2,950** estimated minutes as CI stands. About **2,100–2,250** if D-091(e)'s S4 (shared stacks for the database red cases) lands first; that figure is an estimate until S4's first cycle is measured.
- The table and the recommendation: `PINTAR-4.0-OWNER-RULINGS-2026-10-06.md` §2 (QN7).
- **After S4 (approved by D-120; measured 6 Oct):** a cycle is **68** estimated minutes (run 37458146396: 18/18 jobs, 598 tests; compute 59, queue 1), so the gate is **≈ 1,740–1,880**. Isolation is proven by a fingerprinted reset per case (rulings document §2A).

## 3. Owner rulings needed before implementation

**Ruled 6 Oct (D-121):** Q10 Alternative 4 (descriptors fixed at 70 / 80 / 90%, none below 70%, prospectively; the threshold not printed; the not-yet state built); the closure allowance 1,900 estimated minutes, a ceiling reviewed in every batch report; S4 GREEN (run 37458146396). The closure sequence proceeds.

**Ruled 6 Oct (D-120):** QN1, Q8, QN4, Q9, Q7, QN5 and QN6 agreed; QN3 after go-live (CR-28 leaves this gate); QN7 S4 first; **Q10 held** for the analysis in `PINTAR-4.0-Q10-GRADE-LABELS-2026-10-06.md`; Q1, Q18 and QN2 recorded as already decided. The buckets that follow are in the rulings document §0.

**The decision table** (canonical evidence → current behaviour → consequence → recommendation → implementation consequence) is `PINTAR-4.0-OWNER-RULINGS-2026-10-06.md`. Checking the evidence showed Q1 and Q18 already decided, and QN2 and QN6 records only, so **nine** need a decision.

| # | Question | Blocks |
|---|---|---|
| **Q1** | **Already decided** (corrected 6 Oct): D-080(2) rules the format `<PINTAR ID>/<sequence>` and D-080(9) rules that a student's certificate shows the PINTAR ID. The issued format contradicts a closed ruling. Left to rule: retire Studio's «Awalan nomor»; the three staging certificates keep their numbers | CR-01, CR-03, CR-06 |
| **Q18** | **Already decided:** your Q16 ruling of 5 Oct, verbatim on Daisy's branch. Record it in DECISIONS, superseding D-074(3) and D-076(b)(7) | CR-03, CR-21, CR-56 |
| **QN1** | Who may correct a staff member's email, and when (before activation, after, both)? Is a notice sent to the old and the new address? | CR-13 |
| **Q8** | Where does the Uji Cepat score appear: for the class, each learner, or both? | CR-27, CR-34 |
| **QN3** | Is changing an assignment's window (and extending one learner's session) 4.0 now, or after go-live (P2)? Since D-093 T1, a window cannot be changed at all | CR-28 |
| **QN4** | Briefings: build a producer for 4.0, or hide the empty surface until later? | CR-37 |
| **Q9** | Misconceptions: per-school definitions (D-063 as written), or shared canonical definitions with school-made ones apart (your 2 Oct direction)? It is unparked now that D-098(f)'s build is complete. CR-50 closes before Gladys whatever the answer; Q9 decides its shape | CR-50 |
| **Q7** | PINTAR standard content: who authors and approves it, and may imports target the library (D-029 vs M6: options a, b or c)? | CR-51 |
| **QN5** | The "MCQ Question Bank workflows" of D-050: confirm the proposed meaning (browse, filter and review with key and reason; no authoring outside workbooks) | CR-52 |
| **Q10** | The «not yet» band (D-095(g)) and the certificate grade labels (alternatives 1–3) | CR-47 |
| **QN2** | **Record only:** D-082(a) (leaked-password check on) supersedes D-033(c) by D-033(c)'s own condition («Revisit if passwords are ever typed by people») | CR-23 |
| **QN6** | Level 3 stays dispatch-only (cost), run per slice in this gate; the evidence model is corrected to say so | CR-63 |
| **QN7** | The Actions allowance for this gate, from the measured cycle (123 estimated minutes), and whether D-091(e)'s S4 comes first (it would bring a cycle to about 70–80) | CR-65 |

**Owner actions on the A path:**
- walk Daisy's J1–J7;
- the stripe test on three displays;
- the physical proofs for the card and certificate (print at 100%, phone QR scans, the gold line);
- the wordmark font licence.

**Surfaced, not to be changed:** D-112(b), the second attempt, stays on hold as built (CR-31).

## 4. Prove rather than change

Built and believed correct; each gets a test or a walk, not a rewrite:
- **Instruments:** CR-16 (new learner, GS-22), CR-17 (staff shared computer), CR-60 and CR-61 (in-run GS-00; GS-16 by clicking);
- **Tests:** CR-18 (resend countdown), CR-19 (persona exclusion), CR-20 (security notices), CR-29 (pause, once its rule is found), CR-32 (walk assertions), CR-45 (error reference);
- **Walks and runs:** CR-30 (network loss), CR-33 (one audit run on the specimen), CR-34 (Uji Cepat as Level 3), CR-35 (next suggestion), CR-38 (decision queue), CR-39 (audit reader), CR-40 (report templates), CR-41 (transfer), CR-42 (class move), CR-43 (year rollover, on its own school), CR-44 («Laporkan masalah»);
- **After propagation:** CR-58 (U-PERF re-measured), CR-59 (the universal rules, through the regression).

## 5. Outside the pre-Gladys gate, with reasons

| Items | Why outside |
|---|---|
| CR-11, 12, 24, 25, 66–74 | Production, release-day, capacity and legal gates (D-118 §13). Kept open and visible; none changes what Dr Gladys sees on staging |
| CR-36 Question Health | P2, and it needs 30 answers per question: it cannot be walked on a demo school. Stays TESTED |
| CR-48 SYS-02 | A platform-admin view, not on her path; needs Q11 |
| CR-49 paging | An onboarding gate (more than 10 schools); platform admin only |
| CR-15 username correction screen | J2.17's frozen requirement (an audited platform-admin operation) is met and TESTED; a screen is the operations gate before the EDUCATOR PILOT (amendment 2) |
| CR-53 media | Out of scope by D-050 unless you change it |
| CR-28, CR-37 | Inside only if you rule them in (QN3, QN4) |

## 6. Contradictions found between the documents and the application

1. **The certificate number:** D-080(2) and BOB-48's note vs the issued format (CR-01). Also, this register and the release checklist called «may a student's certificate show the PINTAR ID» open; **D-080(9) ruled it yes** on 30 Sep.
2. **«PINTAR SELALU» vs the wordmark:** D-074(3) and D-076(b)(7) vs Daisy's 5 Oct ruling, recorded only on her branch (Q18).
3. **#13 shown as "parked":** the status report (§4) and the survey call J4.10 "parked by D-098(d)". D-098(d) parked it "until the remaining build is complete", and that build is complete. **Not parked now** (CR-50). The status report is corrected.
4. **The spend figure** in the status report (§14, 4,194 minutes) is the measure's overstatement (CR-64). Corrected there.
5. **The leaked-password check:** D-033(c) vs D-082(a) (CR-23).
6. **The offline key copy:** REL-09 and RECOVERY-CHARTER :139 vs D-107 D8 (escrow). REL-09 is annotated; the charter still says "verified offline copies".
7. **Assignment windows:** EDU-11 / J5.9 expect a deadline extension, but since D-093 T1 no path changes an assignment's window (CR-28).
8. **Briefings:** the J7.5 / DEA-04 screens exist; no producer exists (CR-37).
9. **ENGINEERING COMPLETE (5 Oct) was declared with EC lines open:** J8.3, J8.4, J8.8, J2.7, J1.5, and J4.10 now that it is unparked.
10. **The order of the gates:** D-117(h) put Daisy after Gladys; **D-118 restores D-052's order** (polish → Yazid → Gladys). R.7 and the status report's Q12 are now moot.
11. **The evidence model vs practice:** Level 3 on every merge and nightly, asserted in-run; in practice dispatch-only, asserted by reads around the run (CR-60, CR-63).
12. **The Golden School contract's map:** GS-18 ↔ J8.3, GS-13 ↔ J6.7/J6.8, and the J7 labels (CR-62).
13. **JOURNEY-LOG's waiting list (:137, :147):** still says the issuer copies the photo and that a single Uji Cepat certifies; both are fixed (items 47, 22) (CR-10).

**STOP.** Nothing in the application changes until you approve this register, its batches and the rulings in §3.
