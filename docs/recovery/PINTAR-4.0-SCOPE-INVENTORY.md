# PINTAR 4.0 scope inventory

**1 October 2026 (Phase 1; D-084). Updated the same day with the owner rulings M1–M10 and T1–T4 (D-085; verbatim in `OWNER-RULINGS-M1-M10-T1-T4-2026-10-01.md`). APPROVED by Yazid as O1, with CF13–CF15 confirmed and G1 ruled (D-086). This is the frozen 4.0 target; only Yazid reopens it.** This answers one question: **what exactly must PINTAR 4.0 do before we can say PINTAR 4.0 is complete?** It is not a new requirements exercise, and it is not an MVP.

**Sources, and only these:**
- the canonical decisions D-001 to D-084 (`docs/coordination/DECISIONS.md`);
- the release checklist rows, v2.3 (`docs/coordination/RELEASE-CHECKLIST.md`);
- the frozen identity specification (`auth/IDENTITY-4.0.md`: C1–C18 and Gates 0–8);
- the accepted rulings of 1 Oct (D-084);
- the owner rulings M1–M10 and T1–T4 (D-085).

**The original 4.0 specifications** (Experience, Core DB/Backend, Frontend, Continuity) are background evidence, not scope authority. The checklist itself treats them that way.

**Rules:**
- Every line cites an existing source.
- A line with no source is not 4.0 scope. It is listed in §11 or §12 for Yazid.
- A line's current evidence state is in `PHASE-1-STATUS.md`; this file is the scope only.

**Gate column:**
- **P0, P1, P2:** the checklist's levels (D-028): P0 blocks go-live; P1 is fixed or accepted in writing; P2 comes after go-live.
- **EC:** a decision makes it part of ENGINEERING COMPLETE (D-052, C16). Every line added or changed by D-085 is EC.
- **POL:** the UI/UX POLISHED gate (D-052).
- **REL:** a release condition, checked in Phase 8.

**Classifying a discovery against this list (D-084):**
- **DEFECT:** a line here does not work. Fixed in 4.0.
- **MISSING REQUIREMENT:** needed for a journey here, but no line covers it. Yazid rules.
- **ENHANCEMENT:** not needed for any line here. 4.5 or later.
- **Only Yazid reopens 4.0.**

---

## J1. Platform operation (PINTAR Operations, Admin platform)

| # | PINTAR 4.0 must | Source | Gate |
|---|---|---|---|
| J1.1 | Provision a new school by an authorised PINTAR Platform Administrator through a controlled, repeatable, versioned and audited process. It establishes the minimum institutional foundation needed to hand PINTAR safely to the school's first administrator; after handover the school runs itself. No public self-registration; no school-creation screen; never hand-written production SQL | D-085 (M1); D-084 (C1); SYS-03; D-013; D-054(a) | EC; every Golden School run depends on it |
| J1.2 | Keep the first platform admin, bootstrapped once; appoint a second SYSTEM_ADMIN before 23 Sep 2027; only an active SYSTEM_ADMIN grants it, audited | D-001; SYS-04; SYS-08 | P0 / P1 |
| J1.3 | Let the platform admin sign in, land on Konfigurasi and see the platform's state (health, environment, schools) | D-010; SYS-01; SYS-02 | P0 / P1 |
| J1.4 | Let the platform admin create a school's first admin and give the role, audited | ADM-01; X-01; D-017 | P0 |
| J1.5 | Prepare PINTAR standard content once, govern and version it centrally, and make the applicable release available to every relevant school. A school consumes the authorised central release, never an unrelated copy that can drift. A school sees only what it may use | D-085 (M6); SYS-05; D-029 as amended by M6 (conflict CF11) | EC (was P2 under SYS-05; conflict CF12) |
| J1.6 | Keep platform-only controls restricted and audited; audit and feature flags discoverable | SYS-06; SYS-07 | P1 |
| J1.7 | Give the sole production platform admin a documented, tested break-glass procedure before the production release | D-054(e); C10 | REL |
| J1.8 | Keep evaluation personas out of identity (password, PIN, username, PINTAR ID, activation, device question), with the evaluation boundary assert passing | C13; REL-04 | P0 |
| J1.9 | Keep the operational truth of every important staff and transactional email: requested → accepted for sending → sent or handed off → refused or failed, with stuck flows identifiable. Platform Operations can answer "what happened to this email?". What a user is told reflects what PINTAR knows; it never says sent when PINTAR's evidence says refused, throttled or failed. No inbox-delivery guarantee | D-085 (M8); D-057(b); X.3 | EC |

## J2. Identity: activation, sign-in, sessions, sign-out, recovery

| # | PINTAR 4.0 must | Source | Gate |
|---|---|---|---|
| J2.1 | Refuse sign-up, with no alternate path. Activation claims an already-provisioned identity only, and an unknown address learns nothing | D-054(a); C1; PUB-02; REL-07 | P0 |
| J2.2 | Keep provisioning silent: no invitation emails. The person starts activation | C2; D-019 as amended | EC |
| J2.3 | Activate a provisioned staff identity: emailed 6-digit code → username → password → personal PIN → PINTAR ID and Digital Card → home | D-054(b)–(d); C1; C9; C17; Gate 3 | EC |
| J2.4 | Ask for an explicit confirmation of a person's name before the identity is finalised (every person) | D-077 | EC |
| J2.5 | Sign staff in with email or username plus password: at least 8 characters, leaked-password protection on, no other protection weakened | Gate 3; D-082(a) | EC |
| J2.6 | Remove the everyday magic link from the screens only in the release where activation, password sign-in, email recovery and the existing-staff transition all work | C14; D-054(g) | EC |
| J2.7 | Let existing staff complete activation with no duplicate person or account, rehearsed on staging | C10; D-054(e) | EC |
| J2.8 | Land each person on their own home after sign-in | D-010; STU-02; EDU-01; HOD-01; DEA-01; ADM-01; SYS-01 | P0 |
| J2.9 | Show Keluar on every signed-in screen. It ends this device only; "Keluar dari semua perangkat" is separate and confirmed; the next person never continues as the last | D-009 as amended by D-055; STU-19; EDU-14; HOD-11; DEA-07; ADM-22; SYS-09; X-13 | P0 |
| J2.10 | Staff sessions: about 7 days on a personal device. On a shared device, a server-enforced PIN lock after 5 minutes, which ends after 60 minutes or 3 wrong PINs (or the 15-minute fallback). Ask "Komputer siapa ini?" | D-055; C4; C11; Gate 6 | EC |
| J2.11 | Recover by email: reset and confirmation. A successful reset ends the other sessions and informs the owner | Gate 4; C12; U-RECOVER | EC |
| J2.12 | Recover by PINTAR ID + PIN: the lock ladder, suspension and restoration (only by email recovery plus a new PIN, or an audited platform-admin reset) | D-056; C5; C6; Gate 5 | EC |
| J2.13 | Send security and recovery notices to the owner and the platform admin; none to school admins in 4.0 | C7; D-057(b) | EC |
| J2.14 | Send the six identity emails through one PINTAR-controlled path with PINTAR's own send limits. Supabase's mailer is the break-glass only | D-057(a); C8; D-079; REL-08 | P0 |
| J2.15 | Make every identity email meet the PINTAR email standard: one shell, and the real duration read from the canonical setting | D-079(b)–(f) and addendum | POL; before the production release |
| J2.16 | Give every person a PINTAR ID. Staff see and use it, and only staff get a Digital Card in 4.0 | C17; D-059(a)(b)(g) | EC |
| J2.17 | Apply the username rules, with no self-service change. A correction is an audited platform-admin operation | C9; D-077(e) | EC |
| J2.18 | Show the resend countdown only on code screens, behaving the same whether or not the identity exists | C3 | EC |
| J2.19 | Sign a student in with the PINTAR class card and PIN, the one normal student sign-in model. A recorded email gives a student no other sign-in method: no magic link, no email or password, no "choose how to sign in". A wrong card, or a refusal under load, says what really happened | D-085 (M2); STU-01 as amended by M2 (CF10); C17; D-031 (the card-limit risk); CAP-01; Gate 1 (BOB-12) | P0 |
| J2.20 | Lock a student's session after a period of inactivity: the lock hides their information and keeps the session resumable with their PIN. After a substantially longer inactivity the session expires and needs the card and PIN again. «Bukan akun Anda?» lets another learner switch safely. The values are set and tested in implementation. Learning state is person-bound, never device-bound. Greet a learner by first name only on shared screens | D-085 (T1), revising D-009 and D-055(e)/C4; it applies to every class-card session (confirmed, CF14; D-086); D-020; STU-03; U-PRIV | P0 |
| J2.21 | Let the school re-issue a lost card or PIN and correct a wrong email, without SQL. Student recovery is school-assisted and never depends on an email account | ADM-08; U-RECOVER; D-085 (M2) | P1 |

## J3. School setup (Admin sekolah)

| # | PINTAR 4.0 must | Source | Gate |
|---|---|---|---|
| J3.1 | Let the school admin receive the role, sign in and land on Konfigurasi | ADM-01 | P0 |
| J3.2 | Show what setup remains on the admin's home | ADM-02 | P1 |
| J3.3 | Build the structure on a screen: Bagian, Tingkat and Kelas, with automatic hidden nodes, the uniqueness rules and a confirmation before deactivating | D-006; D-022; D-023; D-027; ADM-03 | P0 |
| J3.4 | Tie the structure to an academic year; roll the year over with history kept | ADM-04 (P1); ADM-21 (P2) | P1 / P2 |
| J3.5 | Let the school admin add staff (person and account) and give or revoke the allowed roles: no self-grant, no escalation. They see and name their own staff and act only on people they may act upon | ADM-05; ADM-06; D-048; D-049 | P0 / P1 |
| J3.6 | Enrol students into a Kelas. Other places are refused with a reason; staff never become students; the learner joins the Kelas's own year | ADM-07; D-026 | P0 |
| J3.7 | Issue PINTAR student cards for a whole class in one operation, with a practical printable class set (class selected → cards prepared → printable set → distribute). Individual issue and re-issue stay for exceptions (a new student, a replacement). Batch issue preserves each student's identity, credential security and audit. No student photo on the card; no card-production service | ADM-07; X-01; D-085 (M7, T4) | P0 |
| J3.8 | Let the school admin set each lesson's minimum passing mark: a whole percentage, explicit and audited, with no 60% default. It is sealed on the assignment and the session | D-081 (Q1–Q4) | EC |
| J3.9 | Compose report templates from approved metrics without changing their meaning | ADM-17 | P2 |
| J3.10 | Transfer a student by request → authorization → execution | ADM-19 | P2 |
| J3.11 | Leave a trace for every consequential action | ADM-20; U-AUDIT | P0 |
| J3.12 | Move a student to another class in the same school. The same identity, no duplicate; current membership and future work follow the new class, and the old class no longer counts them as current; history keeps the context in which it happened and is never rewritten. Distinct from a transfer to another school (J3.10) | D-085 (M9) | EC |

## J4. Content (Studio)

| # | PINTAR 4.0 must | Source | Gate |
|---|---|---|---|
| J4.1 | Import a lesson workbook saved by Excel or Google Sheets, with a file picker and a template, problems per row in Indonesian, and bounded input, into the school only | D-007; D-029; D-030; ADM-09; X-02 | P0 |
| J4.2 | Carry media with the workbook; text, questions and media exist and media plays. Playback is outside the first testing phases only | ADM-10; STU-11; D-050(b)(c); D-052(a) | P0 |
| J4.3 | Move content through named steps with the status shown. The author never approves their own work; freezing is an explicit step; releases change only through their functions | ADM-11; HOD-04; HOD-05; X-03; D-041 | P0 |
| J4.4 | Give the head of department an understandable review queue with an honest empty state | HOD-03 | P0 |
| J4.5 | Publish ready content only, with the right school preselected. A head of department cannot publish | ADM-12; X-04; HOD-10; D-041 | P0 |
| J4.6 | Create the pre-test and post-test from the workbook's marked questions. A lesson without them cannot be assigned; the post-test shares no question or parallel sibling with the pre-test | D-008; D-040; ADM-14 | P0 |
| J4.7 | Keep lesson content non-public: read only through school and class checks | D-032 | EC |
| J4.8 | Provide the MCQ Question Bank workflows | D-050(a) | EC |
| J4.9 | Show Question Health signals as observations, with the human review recorded and able to be concluded | HOD-06; D-061 (#6) | P2; the #6 correction is EC |
| J4.10 | Give misconception feedback. Packages carry their definitions, usable by several schools with no cross-tenant ownership and no code collision | D-063 | EC |
| J4.11 | Keep two content origins, with the origin always clear: PINTAR standard content (central, J1.5) and school content (the school's supplementary and local material). A school adds its own lessons, questions and material without modifying the central release | D-085 (M6); D-029 | EC |
| J4.12 | Correct published content forward. Used content is immutable; a correction is a new revision or release in the same lineage, never an unrelated course. Every revision keeps an auditable history (what changed, why, who made it, who reviewed or approved it, when) with a human-readable summary. Learning stays bound to the release actually experienced; new learning uses the current release; nothing is replaced under an active learning or assessment experience. Applies to both origins | D-085 (M10); D-041 | EC |

## J5. Teaching (Guru; head of department within scope)

| # | PINTAR 4.0 must | Source | Gate |
|---|---|---|---|
| J5.1 | Show the educator's home with one meaningful next action and honest empty states | EDU-02 | P1 |
| J5.2 | State the teaching context (school, class, year) | EDU-03; U-CONTEXT | P0 |
| J5.3 | Show only permitted classes; another class's address is refused | EDU-04 | P0 |
| J5.4 | Prepare and assign a published lesson (Siapkan → Sediakan) to the right class, release and dates, enforced in WIB, from both the applicable PINTAR standard content and the school's own published content, with the origin clear | EDU-05; EDU-06; ADM-13; X-05; D-042; D-085 (M6) | P0 |
| J5.5 | Run Uji Cepat as a fast formative check (about one minute): choose the question bank or topic → see the authorised questions → select them (the teacher controls which) → review → launch → students answer. Questions come from the authorised bank and content available to the teacher; no authoring in the flow. Refusals in their own words; an expired window never blocks a new one; the eligible learner finds and takes it | D-085 (T2); EDU-07; EDU-08; D-015; D-067 | P1 |
| J5.6 | Show the Uji Cepat score where designed | EDU-10 | P1 |
| J5.7 | Never let a single Uji Cepat issue a certificate | D-082(d) | EC (a DEFECT on `main` today) |
| J5.8 | Show progress and participation without judgment, with no integrity or Question Health access for teachers | EDU-09 | P0 |
| J5.9 | Extend a deadline with a reason and an audit trail, within scope | EDU-11 | P2 |
| J5.10 | Suggest what next: assistive, and fitting the class's subject and grade | EDU-13; D-061 (#3) | P2; the #3 correction is EC |
| J5.11 | Let a head of department assign and run Uji Cepat within their Bagian | HOD-08 | P1 |
| J5.12 | Show the teacher which learners are below the mastery target, and let the teacher reassign existing learning material to selected learners who need support. No automatic adaptive remediation | D-085 (M3) | EC |
| J5.13 | Give the teacher an individual learning view of a student within their teaching scope: progress, started or completed, assessment results, mastery status, the objectives the learner struggles with, and other evidence the role permits. An educational view, not a personal dossier; no restricted integrity or security information | D-085 (M4); professional-learning Kelas stay under D-069(b) (confirmed, CF15; D-086) | EC |
| J5.14 | After an assessment is submitted or closed, show the teacher question-level performance for the classes they teach, with drill-down to individual submitted answers within scope where needed. Never a live feed of answers during an active assessment. Distinct from Question Health and integrity evidence. For Uji Cepat, immediately after it closes | D-085 (M5); professional-learning Kelas stay under D-069(b) (confirmed, CF15; D-086) | EC |

## J6. Learning and assessment (Murid)

| # | PINTAR 4.0 must | Source | Gate |
|---|---|---|---|
| J6.1 | Give the /belajar home one obvious next action and an honest "nothing assigned yet" | STU-03 | P0 |
| J6.2 | Open an assigned lesson showing its trail and context, without starting an assessment | STU-04 | P0 |
| J6.3 | Load the lesson material and keep the place; a lesson read to its last page counts as read | STU-11; X-07 | P0 |
| J6.4 | Give hints that help without revealing the answer; valid hints are accepted | STU-12 | P1 |
| J6.5 | Give a truthful orientation, where looking is not committing. Only the explicit press starts the session, exactly once | STU-05; STU-06; X-06 | P0 |
| J6.6 | Use one player: no answer keys before review; answers sync; changing an answer and reloading are safe | STU-07 | P0 |
| J6.7 | Allow pause and resume only where the rules permit | STU-08 | P1 |
| J6.8 | Keep answers through network loss, showing offline apart from refused | STU-09 | P0 |
| J6.9 | Finalize only when every answer has synced; nothing is silently lost | STU-10 | P0 |
| J6.10 | Make the post-test reachable by its link, never a 404, and completable on the same resilient engine | STU-13; STU-14; X-08 | P0 |
| J6.11 | Show the result: mastery with its meaning and own growth, with no rank, class average or other learner | STU-15; X-09 | P0 |
| J6.12 | Allow permitted feedback review only, showing no internals | STU-16 | P1 |
| J6.13 | Say honestly "nothing more to do", or give the next expectation | STU-18 | P0 |
| J6.14 | Switch every learner screen between ID and EN; content is never translated | STU-20 | P1 |
| J6.15 | Keep completion and mastery as separate truths. Completing the post-test does not mean the mastery target was achieved; after the post-test the learner is told clearly whether it was. Below target, PINTAR directs the learner to relevant material for review and never implies mastery because the activities were completed. No unlimited post-test retries | D-085 (M3); the target is the sealed school mark (D-081, D-078 as amended; confirmed, CF13; D-086) | EC |

## J7. Evidence and reporting

| # | PINTAR 4.0 must | Source | Gate |
|---|---|---|---|
| J7.1 | Let the teacher read class evidence from official evidence only. Sufficiency is explicit, with no fabricated zeros | EDU-12; X-10; D-003; D-038; D-064 | P0 |
| J7.2 | Show the head of department scoped figures with their standing; outside the scope is refused | HOD-09; HOD-02 | P0 |
| J7.3 | Give the dean a school summary with standing and reports by clicking at their own scope. Seniority grants no write | DEA-02; DEA-03; DEA-06 | P0 |
| J7.4 | Let the school admin reach the school report by clicking, with correct figures | ADM-16; X-12 | P0 |
| J7.5 | Give the management decision queue and briefing honest states, fed by referrals | DEA-04; D-061 (#2) | P2; the #2 correction is EC |
| J7.6 | Have a human review integrity signals, which never change a score and are never visible to learners. Referral stays class- and department-scoped | HOD-07; X-11; D-062(d) | P1 |
| J7.7 | Word the readiness tiers so they claim no pass, readiness or certificate. Thresholds unchanged; the words are pending | D-082(e); D-068 | POL |
| J7.8 | Change a metric's version label only when its meaning changes | D-060 | EC |
| J7.9 | Give the dean certificate aggregates and verification information only | DEA-05 | P2 |

## J8. Certificate and verification

| # | PINTAR 4.0 must | Source | Gate |
|---|---|---|---|
| J8.1 | Derive eligibility from the sealed school mark plus OFFICIAL evidence, a certifying mode and the safety gate. The predikat is descriptive and never decides; a single Uji Cepat never certifies | D-078 as amended; D-081; D-082(d) | EC |
| J8.2 | Show the learner the certificate state: not eligible → none; eligible → being prepared; issued → actions. Rendering never issues one | STU-17; X-09 | P1 / P0 |
| J8.3 | Seal at issuance the course from the release, the school's name, one language and the person's name. A later correction never rewrites an issued certificate | D-078(c); D-077(d) | EC |
| J8.4 | Implement the certificate as designed (the frozen refinement) | D-076; D-078(d); D-080 | EC |
| J8.5 | Support a certificate template and revocation; numbers never collide | ADM-18 | P1 |
| J8.6 | Verify anonymously: a valid token shows the status first, then only the bounded facts. A random token gets the private not-found; eligible-but-not-issued exposes nothing; nothing leaks | PUB-03 to PUB-06 | P0 / P1 |
| J8.7 | Establish the production card pepper and signing key, with verified offline copies, before the first production card or certificate. Keys are versioned. **Superseded in part (6 Oct): no offline plaintext copy; the dual-recipient encrypted escrow (R1 and R2) is the recovery path (D-107 D8, D-109(c))** | D-066; REL-09; D-107 | REL |
| J8.8 | Provide a profile-photo capability on the student's profile. The photo appears only on the profile: never on the PINTAR class card or the certificate. Certificate issuance never requests or consumes it, and a student's choice of image never alters the identity or evidence meaning of a card or certificate | D-085 (T4); D-086 (G1) | EC |

## J9. Educator as learner (a bounded 4.0 capability, D-069(j))

| # | PINTAR 4.0 must | Source | Gate |
|---|---|---|---|
| J9.1 | Provide a professional-learning Bagian → Tingkat → Kelas in the school's own tenant. Academic and professional material can never cross | D-069(d)(f) | EC |
| J9.2 | Enrol only an existing staff member, checked at placement. The authorised facilitator or education role enrols and assigns; management oversees; a person holding both roles may do both; no parallel management assignment mechanism | D-069(a); D-070(c)(g); D-085 (T3) | EC |
| J9.3 | Call participants «Peserta», not «Murid» | D-069(k) | EC |
| J9.4 | Enforce each audience's visibility at the database; one read-only professional-learning record per Kelas | D-069(b); D-070(a)(b) | EC |
| J9.5 | Keep professional-learning integrity recorded but not surfaced to leadership; no HR judgement | D-069(c) | EC |
| J9.6 | Change no academic reading through professional learning (a hard gate, proven byte-identical) | D-069(l) | EC |
| J9.7 | Issue and verify a professional-learning certificate through the existing engine | D-069(i) | EC |
| J9.8 | Use demonstration content at the demonstration bar: two [UJI INTERNAL] chapters, never on `main` or production | D-069(g); D-070(e); D-082(c) | EC (demo) |

## J10. Help and support

| # | PINTAR 4.0 must | Source | Gate |
|---|---|---|---|
| J10.1 | Provide «Laporkan masalah» for staff, attaching context automatically, with its status visible. Tier 1 and tier 2 are named; a stopped class gets an answer the same school day | D-037(2); REL-13 | REL |
| J10.2 | Show PINTAR's own error and not-found pages with a reference, never raw errors | D-011; U-ERR; PUB-07 | P0 |

## X. Cross-cutting qualities (every journey)

| # | PINTAR 4.0 must | Source | Gate |
|---|---|---|---|
| X.1 | Make every intended screen reachable by clicking; places shown by role, every page enforcing its own permission | U-NAV; D-021 | P0 |
| X.2 | Fail closed outside role or scope. Tenancy, RLS, provisioning, class-card security and service-role isolation are never weakened | U-AUTH; IDENTITY-4.0 §10 | P0 |
| X.3 | Report success only when a real change happened | U-TRUTH | P0 |
| X.4 | Show no raw database or framework text; ID and EN are equivalent; every word lives in `hle.ts`, under Terminology v1 | U-LOC; D-011; D-014; D-068 | P0 |
| X.5 | Never show "not yet" as failure, and never show absence as a finding | U-EMPTY | P1 |
| X.6 | Be usable at 320 px; responsive is part of PASS | U-DEVICE; D-046 | P0 |
| X.7 | Show the school, class or department before any consequential action | U-CONTEXT | P0 |
| X.8 | Protect privacy: no existence oracle; no keys or integrity internals for learners; no learner full name on shared screens | U-PRIV; D-020; D-032 | P0 |
| X.9 | Allow recovery without SQL wherever the product claims self-service | U-RECOVER | P1 |
| X.10 | Meet the responsiveness gate: a usable first screen in 3 s or less (under 5 s hard); clicks under 3 s; no timeout in the concurrency run | U-PERF; D-046(b) | P0 |
| X.11 | Follow one interaction pattern, Idle → Working → Success / Error, acknowledged at once and never submitted twice | D-047(a); D-046(e) | EC |
| X.12 | Complete the full UI/UX polish pass (terminology, navigation, feedback, responsiveness, wording, visual design, first impression) | D-052(b); D-068(f) | POL |

## R. Release, operations and capacity

| # | PINTAR 4.0 must | Source | Gate |
|---|---|---|---|
| R.1 | Meet the release-day conditions on the release candidate and production (REL-01, REL-03 to REL-11) | REL rows; D-028 as amended by D-084 | REL |
| R.2 | Change production data only through audited steps; never hold test data in production | D-013; D-017; REL-11 | REL |
| R.3 | Test with people on staging only, with staging in production posture | D-036; D-038 | EC |
| R.4 | Pass the capacity levels L1–L5 with D-031's scenario and pass criteria, sized by D-035. Onboarding never exceeds the last level passed; L5 records the breaking point | D-031; D-035; CAP-01 to CAP-08 | P0 (L1); later levels gate onboarding |
| R.5 | Keep hot paths index-backed; lists that grow with schools page | CAP-09; CAP-10 | P1 |
| R.6 | Reassess mail capacity for the pilot | D-052(d); D-053 | REL (pilot readiness) |
| R.7 | Follow the readiness gates in order: ENGINEERING COMPLETE → UI/UX POLISHED → Yazid → Dr Gladys → educator pilot. No dates | D-052; D-083; D-084 | — |
| R.8 | Release once, controlled: one production release → 3–5 educators → a pilot of about 20–30 → wider testing | D-058(b); IDENTITY-4.0 §8; D-052(b) | — |

---

## 10. Explicitly outside PINTAR 4.0 (already ruled)

These are ENHANCEMENT if raised:
- an invitation-email system (C2);
- school-admin security notifications (C7);
- self-service username change (C9);
- MDM (C11);
- a school-creation screen (D-084);
- student and PINTAR-team card designs, which are explored but not shipped (D-059(g));
- badges, points and collecting (D-059(e));
- card-edition history (D-059(f));
- the post-login findings #4, #5 and #7–#12 as corrections; they stay with polish (D-061);
- a misconception taxonomy redesign (D-063(d));
- professional-learning evidence in management decision screens, or an HR, CPD or LMS role (D-069(b)(j));
- a helpdesk product (reconsidered in 2027, D-037);
- a detailed key rotation and revocation policy (after 4.0, D-066(d));
- a pass at L5 (only the breaking point is recorded, D-031);
- public school self-registration, a school-creation screen, and hand-written production SQL as normal provisioning (D-085 M1);
- a student magic link, student email or password sign-in, or a "choose how to sign in" step (M2);
- automatic adaptive remediation, and unlimited or unrestricted post-test retries (M3);
- a live feed of answers during an active assessment (M5);
- a specialised card-production service or design studio (M7);
- a guarantee of inbox delivery by an external mail provider (M8);
- a developer-style diff interface for content revisions (M10);
- authoring or generating new questions inside the Uji Cepat flow (T2);
- a second, parallel training-assignment mechanism for management (T3);
- a student photo on the PINTAR class card or the certificate (T4).

## 11. Built on `main` with no scope source

**FOR YAZID.** Each item exists in the product, but no decision or checklist row makes it 4.0 scope. Yazid rules whether it counts toward 4.0. Until then it is neither required nor removed.
- **B1. Class feedback rounds («Umpan balik kelas»):** five shared questions for a class; the teacher's and the head of department's views (`/belajar/umpan-balik`, `/mengajar/[kelas]/umpan-balik`, `/pimpinan/[simpul]/umpan-balik`).
- **B2. The evaluation hub and personas** (`/evaluasi`, `/api/evaluation/assume`). Decisions mention them only as a constraint (C13, REL-04). The persona switch can mint nothing on production today (0 personas).

## 12. Missing requirements

**None open.** D-085 (1 Oct) resolved them:
- M1 (who provisions a school on production) and M2 (students with email accounts), from Phase 1;
- M3–M10, from the journey coverage cross-check.

Their lines are J1.1, J1.5, J1.9, J2.19–J2.21, J3.7, J3.12, J4.11, J4.12, J5.4, J5.5, J5.12–J5.14, J6.15, J8.8 and J9.2.

**Readings confirmed** with O1 (D-086): CF13, CF14 and CF15. **G1 ruled:** 4.0 provides the student profile photo, on the profile only (J8.8).
