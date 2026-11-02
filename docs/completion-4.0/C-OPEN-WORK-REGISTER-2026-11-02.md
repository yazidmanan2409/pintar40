# C · Open work register: the one list of everything left in 4.0 (2 Nov 2026)

**This is the authoritative completion register (mandate §13).** It supersedes, for status, the 9 Oct reconciliation and the 2 Nov plan. Those, and every source register, stay as history.

Each item keeps its original finding ids for traceability: CR (closure register), RV/OP/AP (application pass log), DG/FD (Dr Gladys investigation), UX (polish register), REL/CAP/STU/… (release checklist) and B (#150).

**Columns:**
- **Who:** E engineering · D Daisy (new design) · G Dr Gladys (words only, in writing) · Y owner · X external.
- **Batch:** see `E-CRITICAL-PATH-EXECUTION-PLAN`.
- **Status:** the mandate's statuses.

---

## W0 · Restart and platform

| Id | Item | Source | Who | Batch | Status |
|---|---|---|---|---|---|
| W0.1 | **Make the repository private** (it is public; answer keys exposed) | A-CURRENT-STATE §1 | Y | now | BLOCKED — OWNER DECISION |
| W0.2 | First CI build on GitHub's new runner image (Ubuntu 26, Node 24): fix the local stack and `psql` source; pin the image if needed; leave the Supabase CLI bump for later | W6.6 (2 Nov plan) | E | 0 | NOT STARTED |
| W0.3 | Lift the staging freeze (D-140(d)/D-141(a)) on plan approval | D-141 | Y | 0 | BLOCKED — OWNER DECISION |
| W0.4 | Add an accessibility harness to the crawl: axe on every page, a keyboard walk per surface, clipping detection (not only overflow) | design reconciliation §5; X.6 | E | 0 | NOT STARTED |
| W0.5 | A secret scan of the full history, now that it is public. The project refs are not secrets; confirm no key was ever committed | A-CURRENT-STATE §1 | E | 0 | NOT STARTED |

## W1 · Studio and content (J4, J5.4)

| Id | Item | Source | Who | Batch | Status |
|---|---|---|---|---|---|
| W1.1 | Apply Daisy's **J1Terbit** composition to the package page: done steps collapsed, the current step in a panel, «✓ Diterbitkan», tab edge fade | J1; W3.1 (2 Nov) | E | 3 | NOT STARTED |
| W1.2 | **Question review layout**: replace the «wall of questions» and native ▶ markers | DG-25, RV-21, L4 §4 | **D** then E | 3 | BLOCKED — EXTERNAL DEPENDENCY (Daisy) |
| W1.3 | Aturan Asesmen: hints, limits in minutes and words, 44 px checkboxes and radios | RV-14, DG-28/29 residue | E | 3 | NOT STARTED |
| W1.4 | Release in fewer presses; every step confirms what it did | UX-15, UX-39 | E | 3 | NOT STARTED |
| W1.5 | Question check runnable before lock; findings acknowledged as a group; misconception feedback asserted in a browser | UX-01, J4.10 | E | 3 | NOT STARTED |
| W1.6 | **Send back to the author.** A review outcome other than approval: a new content-status transition (migration), a reason, an audit row, the author's correction path | UX-36, J4.3 | E | 1 (data) + 3 (UI) | NOT STARTED |
| W1.7 | Studio home count cards link to their lists; the course list shows status | UX-34 | E | 3 | NOT STARTED |
| W1.8 | «Riwayat perbaikan» shows who reviewed and approved; «Kursus ini» → the package noun | J4.12, UX-13 | E | 1 (data) + 3 | NOT STARTED |
| W1.9 | Wording: «siswa» → «murid» (UX-18); «(D-008)» removed (UX-43); Studio passes the locale (UX-25); 320 px select and code (RV-23) | UX-18/25/43, RV-23 | E | 3 | NOT STARTED |
| W1.10 | **An example-only workbook** (no live items or keys) offered beside the blank template | DG-36 | E (content) | 3 | NOT STARTED |
| W1.11 | Question Bank reachable by the people QN5 meant, after F-7 | J4.8 | E after Y | 3 | BLOCKED — OWNER DECISION |
| W1.12 | The author is never offered «Sudah saya tinjau» (the database already refuses it) | J4.3 (new) | E | 3 | NOT STARTED |
| W1.13 | `advanceContentAction` writes items, lessons, modules, definitions and course separately. Make the step one transaction, or prove partial failure is safe | J4.3 (observation) | E | 1 | NOT STARTED |
| W1.14 | The other Studio pages (unggah, tinjau, kanonik, definisi, bank, integritas, pratinjau) on 08-migration rows; no composition needed | design §2 | E | 3 | NOT STARTED |
| W1.15 | Dr Gladys's Studio notes: where and as whom she tried; add anything missing | D-141(b) | Y | now | BLOCKED — OWNER DECISION |

## W2 · Approved functions not built or incomplete

| Id | Item | Source | Who | Batch | Status |
|---|---|---|---|---|---|
| W2.1 | **Correct a wrong email**: the screen (server and route exist; four choices confirmed D-122(1)) | CR-13, J2.21, ADM-08 | E | 4 | IN PROGRESS |
| W2.2 | **Correct a name**: screen over `correct_person_name` (platform admin per D-077(3); placement by D) | CR-14, J2.4 | E | 4 | NOT STARTED |
| W2.3 | **Correct a username** without SQL (audited, platform admin), per F-8 | CR-15, J2.17 | E after Y | 4 | BLOCKED — OWNER DECISION |
| W2.4 | **Uji Cepat score**: class first, learners as a drill-down (D-120 Q8) | CR-27, J5.6 | E | 3 | NOT STARTED |
| W2.5 | **Revoke a certificate** (school admin screen; reason; audit) | CR-05, J8.5 | E | 5 | NOT STARTED |
| W2.6 | Briefings hidden as ruled: remove the promise in `mengajar.langkah.quiet` and the stale comments | CR-37, J7.5 | E | 5 | NOT STARTED |
| W2.7 | Integrity review: the referrer sees the outcome; one decision per signal; a visible reviewed state | CR-77, CR-75, J7.6 | E | 5 | NOT STARTED |
| W2.8 | **Profile photo** on the profile only (FileField; storage; not on the certificate) | CR-07, J8.8 | E | 4 | NOT STARTED |
| W2.9 | «Laporan saya» reachable from the account menu | CR-78, J10.1, X.1 | E | 4 | NOT STARTED |
| W2.10 | Platform admin lists paged | CR-49, R.5 | E | 4 | IN PROGRESS |
| W2.12 | No «Mulai Pemetaan Awal» offer without one (RV-7); the seeded lesson's missing audio (RV-8) | RV-7, RV-8, J6.5 | E | 5 | NOT STARTED |
| W2.13 | Teacher and admin UX: «nomor induk» (UX-09); Konfigurasi waiting counts (UX-33); per-class flags (UX-37); new result as next action (UX-40); «Penguasaan per bagian» heading (UX-41); educator recovery line (UX-45); certificate refusal label (UX-46) | UX register | E | 4–5 | NOT STARTED |
| W2.14 | «ditugaskan» residue in learner and Studio strings, under C2 (D-135(d)) | UX-19 | E | 7 | NOT STARTED |
| W2.15 | Transfers: walk end to end; destination by name per F-10 | CR-41, OP-4, RV-18, J3.10 | E after Y | 4 | BLOCKED — OWNER DECISION |
| W2.16 | Educator-as-learner polish | CR-57, J9.8 | E | 5 | NOT STARTED |
| W2.17 | Names and reads proven at 10× staging's enrolments | FD-4, R.5 | E | 8 | IN PROGRESS |
| W2.18 | Teacher's view of one learner shows the objectives they struggle with | J5.13 | E | 5 | NOT STARTED |
| W2.19 | Email operational truth: a list of stuck sends; «accepted» vs «handed off» | J1.9 | E | 4 | NOT STARTED |
| W2.20 | A production school-founding path (audited, versioned), per F-9 | J1.1 | E after Y | 9 | BLOCKED — OWNER DECISION |

## W3 · Daisy's design on every screen (X.12)

Status per screen: the design reconciliation found **J2, J5 and J6 not applied** and **J1, J3, J4 and J7 components only**. 63 routes in all.

| Id | Item | Source | Who | Batch | Status |
|---|---|---|---|---|---|
| W3.1 | **Shell accessibility**: skip link «Langsung ke isi»; a page title per page (none exist) | every J record; WCAG 2.4.1/2.4.2 | E | 2 | NOT STARTED |
| W3.2 | Empty state = a sentence and an action (CR-46) | 08 Feedback; X.5 | E | 2 | NOT STARTED |
| W3.3 | Primitives: FileField (closes RV-5); one date helper with WIB and the date in words (RV-16); select chevron; 44 px Radio/Checkbox rows; Badge shape; Alert icon on `.pin-perhatian`; disabled-button reason; log-out icon; tab icon; Disclosure chevron on every `<details>` | 08 rows; RV-5, RV-16, RV-21 | E | 2 | NOT STARTED |
| W3.4 | Table / Collection (search, filter, pagination) as a shared component | CR-88; J2 | E | 2 | NOT STARTED |
| W3.5 | Account menu and the one Dialog (JQ2(a)); **J2 Kelas** roster as a Table | J2 | E | 2 (components) + 4 (screens) | NOT STARTED |
| W3.6 | **Konfigurasi**: page split or index; sections on the Collection pattern; RV-24, RV-18, RV-15, RV-16 | design §2 | **D** then E | 4 | BLOCKED — EXTERNAL DEPENDENCY (Daisy) |
| W3.7 | Pendataan, Aktivasi: field widths, hints, label case | RV-22 | E | 4 | NOT STARTED |
| W3.8 | **Report pages** Ringkasan Kelas / Sekolah: shell, class, school, period, print | RV-11; J7.2–7.4; X.7 | **D** then E | 5 | BLOCKED — EXTERNAL DEPENDENCY (Daisy) |
| W3.9 | Pimpinan: «(0/5)» explained; repeated labels («Peserta» in academic metrics vs J9.3); touching cards | RV-9 | E | 5 | NOT STARTED |
| W3.10 | Learner (J4 residue): answer-count line, «Halo, …», accessible names | J4 | E | 5 | NOT STARTED |
| W3.11 | **J5 Jendela** on Siapkan: date echo, «(opsional)», refusal under the field with focus; **J1 part two** «✓ Disediakan» | J5, J1 | E | 3 | NOT STARTED |
| W3.12 | **J3 navigation under L3**: the composition predates the working-context model; the rail (OP-1) and group labels (OP-2) | J3, OP-1, OP-2 | **D** (restate) or Y (accept deviation) | 5 | BLOCKED — EXTERNAL DEPENDENCY |
| W3.13 | **J6 Peragaan** evaluation band (region, title prefix, leaving line) | J6 | E | 5 | NOT STARTED |
| W3.14 | **J7 idle warning**: top, heading, alert, layer tokens | J7 | E | 2 | NOT STARTED |
| W3.15 | Tour: focus box and ring; sheet not covering its target at 320 px; tour not blocking the landing | RV-19, UX-38 | E | 5 | NOT STARTED |
| W3.16 | The `/` chooser and the context control: Daisy's look; Dr Gladys's six words | CR-54 S2, D-132(m) | **D** + G then E | 5 | BLOCKED — EXTERNAL DEPENDENCY |
| W3.17 | Mengajar: badges at 320 px (RV-20); TombolKirim result words wherever a submit changes state | RV-20; 08 Actions | E | 3 | NOT STARTED |
| W3.18 | Studio and others: the remaining 08 rows per page; Tailwind-composed pages moved to `pin-*` | design §3 | E | 3–5 | IN PROGRESS |
| W3.19 | **Certificate as designed**, one A4 page, institution mark (CR-03/04) | J8.4 | E after F-11 | 6 | BLOCKED — OWNER DECISION |
| W3.20 | **Digital Card** final (CR-21); **identity emails** final (CR-22, J2.15); **wordmark** in the shell and emails (OP-3/AP-1) | CR-21, CR-22, OP-3 | E after F-11 | 6 | BLOCKED — OWNER DECISION |
| W3.21 | Republish the Design System page (v18 predates c42fecb) | 07 §4 | D | 6 | NOT STARTED |
| W3.22 | A4 print preview check per surface | 08 Print | E | 6 | NOT STARTED |

## W4 · Words

| Id | Item | Source | Who | Batch | Status |
|---|---|---|---|---|---|
| W4.1 | Migrations for the v1 rows held in the database (C29, C30, D23 locations in words; C31, B15, B16; RV-15 seed name; one English finding) | OP-5, UX-17 | E | 1 | NOT STARTED |
| W4.2 | **Dr Gladys's terminology decisions, asked in writing now:** «penilaian» strings after the inventory (OP-6); Bank Soal measured difficulty (OP-7); six context words (D-132(m)); the L4 §4 word list (shuffle values, limit units, misconception singular, visualization and report names) | OP-6, OP-7, D-132(m), L4 §4 | G (via Y) then E | ask now; apply 7 | BLOCKED — EXTERNAL DEPENDENCY |
| W4.3 | `auth.belum_siap` through the canonical copy review | L-copy | E | 7 | NOT STARTED |
| W4.4 | The compositions' new interface words into `hle.ts` («Langsung ke isi», «Ciutkan navigasi», «Buka/Tutup menu», «Disediakan», «Terkirim», «(opsional)», Table strings, the idle heading) | J1–J7 READMEs | E | with each screen | NOT STARTED |

## W5 · Security

| Id | Item | Source | Who | Batch | Status |
|---|---|---|---|---|---|
| W5.1 | **CR-91** enforced in the database per F-3 (recommended: class cards for learners only; red → green tests) | CR-91, X.2, X.8 | E after Y | 1 | BLOCKED — OWNER DECISION |
| W5.2 | Answer-key sources moved out of the repository per F-4; L4-C01 restated; summative items regenerated if exposure is confirmed | S1; D-032 | E after Y | 1 | BLOCKED — OWNER DECISION |
| W5.3 | Branch protection on `main` (required CI, no force push) | 05 §1.1 | Y | 0 | BLOCKED — OWNER DECISION |
| W5.4 | Re-run the security suite (RLS, isolation, sessions, credential privacy, audit) on the release candidate | 04 | E | 8 | NOT STARTED |

## W6 · Regression, evidence, accessibility

| Id | Item | Source | Who | Batch | Status |
|---|---|---|---|---|---|
| W6.1 | **Universal rules as rule-level tests**: X.1, X.3, X.8, X.11, J3.11, J7.8 | CR-59 | E | 8 | NOT STARTED |
| W6.2 | U-PERF re-measured after L3 and the shell (≤ 3 s first screen; clicks < 3 s; p95) | CR-58, X.10 | E | 8 | NOT STARTED |
| W6.3 | Level 3 coverage added: network loss (CR-30), educator as learner (J9), rollover, class move | CR-30, J6.8, J9 | E | 8 | NOT STARTED |
| W6.4 | Crawl: clipping as well as overflow; axe; 1024–1279 px | X.6 | E | 0 / 8 | NOT STARTED |
| W6.5 | **Studio end-to-end proof** (Level 3, staging): a never-imported chapter; a Guru authors; a failed upload fixed; a head of department rejects once (W1.6) and then approves; the admin publishes; the teacher assigns; the learner opens. Plus per-row errors in a browser, and the HOD publish refusal | mandate §6; J4.1–J4.6 | E | 3 | NOT STARTED |
| W6.6 | PINTAR-standard chain walked: import → second platform admin approves → distribute → teacher assigns → learner. Bab 1 re-import as library content | J1.5, J4.11, CR-51 | E after F-6 | 8 | BLOCKED — OWNER DECISION |
| W6.7 | Uji Cepat at Level 3 incl. the score and no certificate | CR-34, J5.5, J5.7 | E | 3 | NOT STARTED |
| W6.8 | The real-app 50-student test on current main | owner instruction | E | 8 | NOT STARTED |
| W6.9 | Release checklist v2.8 regenerated; stale PASS rows re-proved (U-PERF, STU-12, ADM-18/X-09 wording) | 9 Oct update §1.2 | E | 8 | NOT STARTED |
| W6.10 | Browser walks for clauses proven only at HTTP or DB level, or on an older SHA: J1.6 maintenance; J1.8; J2.1 unknown address; J2.9 «Keluar semua»; J2.10 60-min/3-PIN end; J2.12 ladder and assisted reset; J2.18 resend; J2.20 long idle; J6.4 hints; J6.7 pause (STU-08); J10.2 forced 500; J2.7 synthetic staff transition | B-matrix | E | 8 | NOT STARTED |
| W6.11 | An independent review of the running application after each batch (D-140(b)) | governance | E (second reviewer) | every | per batch |
| W6.12 | **NVDA and TalkBack** pass; **200 % zoom**; colour vision; keyboard on real screens | L-a11y; W5 (2 Nov) | E | 7 | NOT STARTED |

## W9 · Operational readiness and release (Phases 4–5)

| Id | Item | Source | Who | Batch | Status |
|---|---|---|---|---|---|
| W9.1 | **#150 B3**: scoped token C1 (Backups: Read, production) → G6 can read backups. **Until then every production migration is refused** | B3; D-106 | Y (≈15 min) then E | now | BLOCKED — OWNER DECISION |
| W9.2 | Staging session-pooler host/port/user (pre-O3) | D-111(c) | Y | now | BLOCKED — OWNER DECISION |
| W9.3 | Compute tier chosen (Q2) on the first-deployment size (Q3); L1 rerun at that tier (CAP-02, CAP-07, CAP-08) | D-089; R.4 | Y then E | 9 | BLOCKED — OWNER DECISION |
| W9.4 | Auth IP forwarding and key; CAP-01 burst | D-092(c), A8 | Y then E | 9 | BLOCKED — OWNER DECISION |
| W9.5 | **#150 B4/B9**: off-platform backup on real infrastructure (O3 AWS S3 Singapore with Object Lock, O5 Storage keys, O6 C2); a green run, a planted red, a drill 24/24 | D-106(b)(g), D-107 | Y + X then E | 9 | BLOCKED — EXTERNAL DEPENDENCY |
| W9.6 | **#150 B5**: escrow to R1 + R2, separate custodians, possession proofs | D-109(c) | Y | 9 | BLOCKED — OWNER DECISION |
| W9.7 | **#150 B6**: second administrators on every account; offline recovery codes | D-106(d) | Y | 9 | BLOCKED — OWNER DECISION |
| W9.8 | **#150 B7**: production watch on (O10) | D-106 | Y at release | 10 | NOT STARTED |
| W9.9 | **#150 B8**: configuration reconstruction rehearsal (O8, billable restore) | D-106(f), D-111(g) | Y + E | 9 | IMPLEMENTED — NOT VERIFIED |
| W9.10 | **Production upgrade rehearsal** 111 → 177+ on a scratch copy of production (P1, CR-68); production DB read for the first time (with permission); the order of migration 162 (F-5) | P1; Q15 | Y + E | 9 | NOT STARTED |
| W9.11 | **Legal gate**: UU PDP, PSE registration, controller/processor, retention, parental consent; content rights (Q5); AI-tooling policy (Q6); commercial answers (Q19); privacy line on backup retention (O11) | D-117(m), CR-74 | Y + X (counsel) | 9 | BLOCKED — EXTERNAL DEPENDENCY |
| W9.12 | Break-glass for the sole production admin, rehearsed | C-11, J1.7 | Y + E | 9 | NOT STARTED |
| W9.13 | Production email: SMTP password, Gate 8 Auth settings, SPF/DKIM/DMARC pass in received headers | REL-08, CR-70 | Y then E | 10 | IN PROGRESS |
| W9.14 | Existing-staff transition rehearsed; magic link retired | CR-24, CR-25, J2.6, J2.7 | E | 10 | NOT STARTED |
| W9.15 | DNS `verifikasi.pintarselalu.com` | CR-11 | Y | 10 | BLOCKED — OWNER DECISION |
| W9.16 | Support tiers named; same-day answer | CR-71, REL-13 | Y | 9 | BLOCKED — OWNER DECISION |
| W9.17 | Mail capacity for the pilot; separate staging and production mailboxes or not | CR-73, R.6 | Y | 9 | NOT STARTED |
| W9.18 | Release mechanics: `RELEASE_SHA` in both deploy workflows; Node 20 in the production apply job; release evidence pack | D-004 | E | 10 | NOT STARTED |
| W9.19 | Efficiency items (Auth round trip, /pimpinan cache, prefetch, Konfigurasi paging) | CAP-09 | E (owner priority) | 8 | IN PROGRESS |

---

## Stale or incorrect closure claims found in Phase 0 (records kept; corrected here)

1. **CR-13** «closed (server and route)» overstates the line, because there is no screen. Appendix A «NOT BUILT» is also wrong, since the RPC and route exist. **IN PROGRESS.**
2. **CR-41** «form takes raw UUIDs»: named selects exist. The gap is the authorization ruling.
3. **CR-30** «OPEN»: S21 asserts network loss on every journeys run. What is missing is Level 3 coverage.
4. **J1.6 / CR-39** «audit reader not walked»: S23j walks it on 001a357.
5. **Appendix A (6 Oct)**: J4.8, J4.10, J7.5, J8.3, J8.4 (number), J10.1, J6.11 and J6.12/13 are all stale. Each is now covered on 001a357.
6. **U-PERF PASS, STU-12 PASS** (release checklist) rest on pre-L3 evidence. **Re-prove.**
7. **CR-18 / J2.18** closed on an older SHA. EVIDENCE-MODEL rule 3 says evidence does not carry forward. **Re-walk.**
8. **2 Nov plan W3.8** «Laporkan masalah still the old header»: wrong. `/lapor` uses the shell since 44cebee.
9. **RV-5** «not changeable without replacing the native control»: Daisy's FileField spec solves it without that. **Closable.**
10. **#150 B3** «on hold (D-105)» in the review and the 2 Nov plan: D-106 superseded D-105(d). B3 is required, and the owner action is O2.
11. **#150 B4/B9/B8** listed as «owner ruling» in the 2 Nov plan: D-106 already ruled them required. What remains is owner *actions*.
12. **ENGINEERING COMPLETE «declared 5 Oct»** while EC lines J1.5, J1.9, J2.7, J2.15, J2.17 and J2.21 were open. The declaration was premature.
13. **CR-51 «CLOSED (with residuals)»**: J1.5 cannot be completed as built without a second platform admin.
