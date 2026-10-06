# The Golden School contract

**Accepted 1 October 2026 (D-084: C1, C2, C3; updated by D-085: M1, M2, M3, M7, T1).** Specification only. The implementation is Phase 2 work; the first honest run is Phase 3.

The Golden School is PINTAR's primary integration truth. It is one deliberate school on staging that proves PINTAR works as PINTAR: one school, one admin, one teacher, one student, from the front door.

## Status, 6 Oct 2026

**Built and run.** C1 (`found-school.yml`), the C2 mailbox reader and the four walks (`staging-golden-school{,-admin,-murid,-laporan}.yml`, `audit/staging/golden-school*.mjs`) exist and run on staging.

**The latest run is green end to end, with one declared bypass.**
- **Unaided:** GS-01 to GS-15, and GS-17 to GS-21.
- **GS-16, the bypass:** the four extra students open their two tests by typed address. The walk declares it, since they "only sit the tests" (§4). EVIDENCE-MODEL §3 counts a typed address in Level 3 as a bypass, and so a FAIL. GS-16 maps to no inventory line.
- **Current break:** none in the spine.
- **School:** «Sekolah Demo PINTAR», 6 Oct, 41 of 41 steps PASS (JOURNEY-LOG 48).
- **The one before it:** «Sekolah Emas Uji 2026-10-05», runs 37287063109 to 37295261257.

| Step | Walk step(s) | Run | Result |
|---|---|---|---|
| GS-00 | Not an in-run step. Machine reads bracket the walk: 07:38 UTC `808ae6e` 162/162 (run 37430955533); 07:54 staging's migrations 165 = the repository (`staging.yml` 37432544176); 08:37 `a64b9b6` 165/165 (37437396764); 08:46 `12b480b` 165/165 (37438389611). The application code (`src`) is identical across all four | — | GREEN by bracketing reads |
| GS-01 | C1 | 37431278133 | PASS (read back by G0) |
| GS-02 | G1, G2, G3 (the operator signs in with their own password) | 37431385287 | PASS |
| GS-03 | G4, G5 | 37431385287 | PASS. GS-01 to GS-03 ran on the 162-migration set (`808ae6e`). The three later migrations touch certificate numbers and hints only, but under D-034 only `docs/coordination/` differences count as the same code. So J1.1 and J1.4 are JOURNEY-PROVEN on `808ae6e`, not on `12b480b` |
| GS-04 to GS-11 | A0 to A11 | 37432707928 | 12 PASS |
| GS-07 (cards), GS-12 to GS-16 | M0 to M7 | 37433910433 | 8 PASS (GS-16 by the declared bypass above) |
| GS-17 to GS-21 | L0 to L4, C1 to C3, R1 to R3, U1, V1, V2, X1 | 37434862707 | 15 PASS |

**Gaps in the instrument (recorded, not repaired during the D-117 freeze):**
- **Corrected in batch 0 of the closure gate (D-118, 6 Oct), proven by the next full walk:**
  - the §5 map: GS-18 is J8.1 and J8.2 (J8.3 is not built, BOB-48); GS-13 is J6.2, J6.5, J6.6 and J6.9 (J6.7 pause and J6.8 network loss are not exercised); the head of department is J7.2 and the dean J7.3;
  - **the activation order:** an earlier note here said «PINTAR asks for the PIN first». That came from G4's title, never from an observed run. The server asks username → password → PIN → name (`URUTAN_LANGKAH`), which is D-054(b) and the inventory's J2.3. The note was wrong, not the inventory. G4 now records the screens in the order they come and asserts D-054(b)'s order;
  - GS-00 is asserted inside each run (§2);
  - GS-16 is walked by clicking, no longer by typed address;
  - added: J6.2 and J6.11 in GS-13 and GS-15; a staff member on a shared computer in GS-20; the security notice in GS-21; GS-22.
- Roles beyond the spine (the review queue's signals, the dean's queue, Uji Cepat, educator-as-learner, support) are not yet further Level 3 journeys (§5).

**Human acceptance (§6, Phase 6):**
- Dr Gladys walks this school on 7 Oct under D-117.
- Yazid makes his own pass the evening before.
- Nothing is HUMAN-ACCEPTED yet.

## 1. Rules

The Golden School never uses:
- DevTools;
- typed internal routes: every page is reached by clicking from the previous one;
- SQL, or any database write, inside the journey;
- service-role impersonation of an ordinary user, or a password set behind the scenes;
- hidden operator repair;
- technical help from Yazid.

Three further rules:
- **The one permitted operator action is C1's school birth.** It is part of PINTAR's agreed operating model, scripted and audited.
- **No fix first.** The first run is made on current `main` unchanged and is expected to be red. That red is the baseline.
- **Bypasses.** After the first unaided failure, the run may continue through **labelled bypasses** so that the steps beyond it are still seen.
  - Every bypass is a FAIL.
  - The headline stays how far the run got unaided.

## 2. Preconditions (GS-00)

Before any step, the run asserts by machine read that:
- staging runs the expected `main` commit;
- staging's applied migration set equals `main`'s.

A mismatch is red, and nothing else runs.

**Asserted inside every run since 6 Oct (CR-60):** each walk's workflow (C1 and the four walks) runs `environment-facts.yml` as its first job, `GS-00 · staging runs main's commit and migrations`, scoped to staging, and the walk job needs it. Red stops the walk.

Today `main` moves by a `[skip ci]` fast-forward, which suppresses push-triggered workflows. Staging's migrations are therefore applied by a manual dispatch.

## 3. The decisions

**C1. School birth: PINTAR Operations creates a school (M1).**
- **Who:** an authorised PINTAR Platform Administrator (D-085 M1).
- **The mechanism:** a controlled, repeatable, versioned, audited process, run only through a dispatch-only workflow. Its inputs are the school's details.
  - It establishes the minimum institutional foundation needed to hand PINTAR safely to the school's first administrator (M1), and nothing that normal school operation does.
  - Exactly what the foundation holds is specified in Phase 2.
  - It writes the audit record D-013 requires.
- **Who uses it:** the same mechanism serves real operations, the Golden School, and the school made for each human acceptance walk.
- **What it replaces:** today's hand-written school birth (the audit harness's step W0, and the coordinator's SQL under D-013).
- **No school self-registration (D-054(a)), and no school-creation screen in 4.0.**
- **After the school exists, the product takes over:** the platform admin adds the first school admin in the app.
- **On production:** a school's birth is a product decision Yazid approves; an authorised platform administrator runs it (M1). Hand-written production SQL is never the normal method.

**C2. Staff sign-in: the real PINTAR sign-in, with a controlled staging test mailbox.**
- **The mailbox:**
  - It is on PINTAR's mail domain, readable by the automation only, staging only, and receives nothing but test mail.
  - It can take a fresh address on every run (plus-addressing or a catch-all, whichever the mail host supports).
  - Its credentials are entered by Yazid as a GitHub secret.
- **What happens to codes:** activation and recovery codes are actually received and consumed. Every later sign-in uses the password set during activation (D-054(b)).
- **Never:** set an ordinary user's password behind the scenes, or use a service-role session as journey evidence.
- **Before Gate 3 lands:** the run signs staff in through what `main` has, the magic link, via the same mailbox. It will probably go red at staff sign-in (Supabase's mailer sends 2 emails an hour). That red is honest.
- **Students** sign in with the class card and PIN, their one model (M2). The run issues the class set in one operation (M7) and reads each card from the printable set.

**C3. Data policy: a fresh school instance per run, from one recipe.**
- **Each Level 3 run creates a new instance through C1.** It is named after the run, in production posture, so that its evidence is OFFICIAL and certificates can be issued.
- **Nothing is reset or deleted.** Sessions, results and certificates are append-only by design, and a reset has already hidden a defect (C-07 hid BOB-42 for two runs).
- **The existing staging schools are left untouched,** including the synthetic performance school.
- **The cost** is one school, a few people, a few sessions and one certificate per run. Staging held 72 sessions on 1 Oct.
- **Not covered:** a long-lived school (a second term, returning students). That belongs to Phase 5 journeys, not the spine.
- **The amendment to D-064:** D-064's "staging remains synthetic" is amended by D-084 for the Golden School only. Its people are fabricated test identities, never real data.

## 4. The recipe

- **The school:** one school, structured as one Bagian → one Tingkat → one Kelas.
- **The people:** one school admin, one teacher, one head of department, one dean.
- **The students:** one primary student who walks every student step, plus **four more students** who only sit the tests.
  - The four exist only because class figures are withheld below five learners, an existing rule.
  - The owner's lens (one admin, one teacher, one student) is unchanged.
- **The content:** one real chapter already on `main` and already imported whole by the audit (SD 5 Matematika Bab 1, step S15c), uploaded through the screen with whatever media its workbook names.

## 5. The spine (the order the run follows)

| Step | What a person does | Inventory |
|---|---|---|
| GS-00 | (machine, the walk's first job) Staging runs `main`'s commit and migrations | R |
| GS-01 | (operator, C1) The school is born | J1.1 |
| GS-02 | The platform admin signs in and creates the first school admin, with the role | J1.4, J2 |
| GS-03 | The school admin activates (code from the mailbox → username → password → PIN → name → card; D-054(b)'s order, asserted by G4) and lands on Konfigurasi | J2.3–J2.8 |
| GS-04 | The school admin builds the structure | J3.3 |
| GS-05 | The school admin sets the lesson's minimum passing mark | J3.8 |
| GS-06 | The school admin adds the teacher, the head of department and the dean, and gives their roles | J3.5 |
| GS-07 | The school admin enrols the students and issues the class's cards in one operation, as a printable class set (M7) | J3.6, J3.7 |
| GS-08 | Content in: the chapter is uploaded to the school with its media | J4.1, J4.2 |
| GS-09 | The head of department reviews and freezes it; the school admin publishes | J4.3–J4.5 |
| GS-10 | The teacher activates, signs in and lands on Mengajar | J2 |
| GS-11 | The teacher prepares and assigns the chapter (Siapkan → Sediakan) | J5.4 |
| GS-12 | The primary student signs in with the class card | J2.19 |
| GS-13 | Pre-test: orientation (no sitting yet) → the explicit start → answers → finish | J6.2, J6.5, J6.6, J6.9 (J6.7 pause and J6.8 network loss are not exercised) |
| GS-14 | Every lesson is read to its last page, by clicking | J6.3 |
| GS-15 | The post-test is reached by its link (no sitting before its start) and completed; the result says whether the mastery target was achieved (M3), with the learner's own growth and no rank, class average or other learner | J6.2, J6.10, J6.11, J6.15 |
| GS-16 | The four other students, by clicking as the primary student does, sit both tests and read the lessons between them | (recipe) |
| GS-17 | The teacher reads the class evidence (J7.1); the head of department (J7.2), the dean (J7.3) and the school admin (J7.4) read their reports | J7.1–J7.4 |
| GS-18 | The primary student's certificate: eligible at the school's mark → issued → shown | J8.1, J8.2 (J8.3, sealing at issuance, is not built: BOB-48) |
| GS-19 | An anonymous visitor verifies the certificate; a random token gives the private not-found | J8.6 |
| GS-20 | On a shared device: the student's session locks when idle and resumes with their PIN (T1); «Bukan akun Anda?» switches safely; the next learner inherits no lesson position or state. A staff member on «Komputer bersama» is locked by the server after 5 idle minutes and resumes with their PIN (the 60-minute end: BOB29-A03). Everyone signs out | J2.9, J2.10, J2.20 |
| GS-21 | Recovery: the school admin re-issues a lost card; a staff member recovers by email, then by PINTAR ID + PIN; the owner's security notice arrives (PINTAR ID, never the PIN) and the platform admin's is sent | J2.11, J2.12, J2.13, J2.21 |
| GS-22 | A learner added after the chapter was given: the school admin records one student into the class and makes the class's cards (one, hers); she signs in, finds the class's existing chapter and begins its Pemetaan Awal by clicking | J3.6, J3.7, J2.19, J6.5 (D-118 §8) |

- **The status headline** is the last step passed unaided, then "current break: GS-nn".
- **Roles beyond the spine** (the head of department's review queue and signals, the dean's queue, Uji Cepat, educator-as-learner, support) attach as further Level 3 journeys in Phase 5.

## 6. People and acceptance

- **Human observation begins once the Golden School exists (Phase 3).** Formal acceptance comes in Phase 6: Yazid, then Dr Gladys.
- **Each person uses a school created for them through C1,** and works through the front door with no technical help.
- **Observation** means using PINTAR and saying what does not make sense. It never means a console, a dashboard, a variable, SQL, or a screenshot offered as technical evidence.

## 7. Not in Phase 1

None of these was built in Phase 1 (all built since; see «Status, 6 Oct 2026» above):
- the C1 script and workflow;
- the mailbox and its reader;
- the Level 3 runner;
- the GS-00 check;
- the recipe's automation.
