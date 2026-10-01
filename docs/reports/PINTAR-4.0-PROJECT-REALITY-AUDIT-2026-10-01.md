# PINTAR 4.0: project reality audit

**1 October 2026.** A stop-work, second-eye review requested by Yazid.
- **Read-only.** No code, branch, Supabase, Vercel or canonical document was changed to produce it.
- **Labels:** FACT (verified in the repository, GitHub Actions or the live databases), INFERENCE (reasoned from facts), RISK (could go wrong), UNKNOWN (not established; not assumed).

**Method.**
- Five independent read-only investigations, each with its own brief:
  - history and patterns;
  - the testing system;
  - user-journey reality;
  - architecture, security and complexity;
  - operations and process.
- The coordinator's own checks:
  - GitHub Actions: all 420 workflow runs since 12 Sep;
  - read-only counts in the staging and production databases;
  - repository metrics.
- **Trees examined:** `main` `28d3015` (= staging), the coordinator branch `f663c38`, Bob's lane `3724f4d`, Daisy's lane `77d71ad`, and production `5b5b68d`.

**A conflict of interest, stated plainly.** The author of this report is the coordinator. The coordinator wrote the audit harness, gated the work, maintained the checklist and recorded many of the "PASS" verdicts examined here. The investigations were briefed to treat the project as someone else's work. Even so, Yazid should treat this audit as strong but not independent. Section 18 suggests an outside check.

**The owner's lens** (rulings of 1 Oct):
- the full agreed 4.0 scope is the target, not a smaller product;
- one school: one admin, one teacher, one student, from the front door, with no hidden help;
- no dates;
- no fixing during the audit.

---

## 1. Executive reality

**The central fact.** No deployed environment runs the one-school chain (admin sets up → teacher prepares and teaches → student learns, is assessed, gets a result and a certificate → anyone verifies it) from the front door without an operator. It has never been done once.

| Environment | What it actually contains | How far the chain gets |
|---|---|---|
| **Production** (`5b5b68d`, 111 migrations) | 1 person, 3 institutions. 0 assignments, 0 learning sessions, 0 certificates. Unchanged for 8 days. | Breaks at step 2. It lacks the 21 migrations that brought structure, upload, publishing, assigned tests, reports and email. **[FACT]** |
| **Staging** (`main` `28d3015`, 132 migrations) | All 72 sessions and 9 assignments belong to one **synthetic** school. The two real-shaped schools hold 0 of either. 0 official-evidence sessions, 0 certificates, 0 emails through PINTAR's own path. | The middle works by clicking, in the synthetic school only: structure → intake → class cards → upload → publish → assign → pre-test → lessons → post-test → result. It breaks at both ends. **[FACT]** |
| **The local audit stack** (a throwaway database per CI run) | Built by the harness | The only place a "real" school (production posture, official evidence) has produced class figures. Even there, the school is born by SQL, people are created by direct API calls, and pages are opened by typed URLs. **[FACT]** |

**What breaks the chain** (on staging, i.e. `main`):
1. A school can only be created by SQL or the dashboard, and so can the first platform admin.
2. Only the platform admin can create a teacher.
3. Staff sign-in depends on Supabase's mailer:
   - it sends 2 emails per hour for the whole project;
   - its password was stale on 30 Sep;
   - it reports "sent" when it did not send.
4. The teacher's evidence figures have never been shown on a deployed environment.
5. No certificate has ever been issued anywhere outside a test database. In addition, `main` and production still let a single Uji Cepat issue one.
6. Lost cards and lost staff access need an operator.

**What is genuinely good.**
- **The database architecture and its security boundary are sound:**
  - row-level security on all 106 tables;
  - 317 SECURITY DEFINER functions, all with a pinned `search_path`;
  - closed-by-default grants;
  - tenant predicates, tested by real database tests.
- **The core product model is coherent:**
  - canonical content shared by reference;
  - immutable releases, sessions and results;
  - signed certificates;
  - an outbox for answers.
- The staging journeys are an honest, valuable test layer.
- **None of this needs a rewrite.**

**What is wrong is the system that decides "done".**
- **The proof rarely reaches a person's real outcome.** CI proves the database's guards. The audit harness cannot fail when a step fails. About 89% of the 154 "static" tests read repository text, and about 56 do nothing else. Only 1 of 10 sampled checklist PASS rows rests on a front-door browser journey.
- **Every user-visible defect that mattered was found outside CI:** by staging runs, by out-of-band reviews, or by Yazid.
- **Scope kept growing while being declared frozen.** 75 of 127 tickets were opened on 29–30 Sep.
- **Configuration and release are manual and unmonitored.** 8 configuration incidents; 1 caught by automation; 0 by monitoring.
- **Yazid has been used as the integration layer and test harness:** at least 30 technical steps in 9 days, plus the relay of every message between agents.

**Answer to the central question** (developed in §18). **No.** As it operates today, this development system is not capable of delivering a reliable, school-ready PINTAR 4.0. The reason is not that the architecture is wrong or the team cannot build. The reason is that the system's definition of "done" is not connected to whether one admin, one teacher and one student can do their work. That is correctable without a rewrite. It must be corrected before more features are added, or every later "ready" will be as untrustworthy as this week's "63 of 84 P0 PASS".

---

## 2. What we believed vs what the evidence shows

| What we believed (and recorded) | What the evidence shows |
|---|---|
| **"63 of 84 P0 checks PASS, 0 FAIL"** (checklist v2.3, 1 Oct) | Of 10 sampled P0 PASS rows, only 1 (STU-06) rests on a reproducible front-door browser journey as cited; 7 rest on API/RPC harness steps, selftests or code inspection; 4 conflict with their own evidence (EDU-12, DEA-01, ADM-16, X-01). Every staging-based PASS was carried into "Now (28d3015)" though no staging journey has run on 28d3015. All 5 anonymous-verifier P0 rows PASS though no valid certificate has ever existed. **[FACT]** |
| **"PINTAR 4.0 is live, secure and stable"** (23 Sep report) | The same night's audit found 6 blockers (no class creation, upload, publishing, pre/post-tests, sign-out or reports) and P0 at 13/79. Production has not changed since: it still lets any signed-in user rename themselves and change their password without the current one, still lets an Uji Cepat issue a certificate, and still carries the lesson save loop. Production sign-in email may be broken now (UNKNOWN; the SMTP password went stale on 30 Sep and production was never re-checked). **[FACT]** |
| **"Gate 2E (email) GATE PASS"** | PINTAR's own email path has sent **zero** emails on staging: its send log is empty. The first real attempt found staging's configuration invalid, and the test procedure handed to the owner was a browser console paste. **[FACT]** |
| **"Audit #5x green"** | `audit/journey.mjs` and `crawl.mjs` never set an exit code. The job is green whenever the script does not crash, even with FAIL steps (`journey.mjs:1101` prints a tally). Integrations 9–12 merged with S8 red; DAISY-31 was gated with an S1 FAIL. **[FACT]** |
| **"Staging journeys prove the learning cycle"** | 16 runs: 3 succeeded, 12 failed, 1 cancelled. The last ran on `daa5721`, three merges ago. Staff sessions are minted with the service key, not signed in. The school is synthetic, so evidence is never official and a certificate can never be issued. A data reset (C-07, 29 Sep) hid BOB-42 for two runs. **[FACT]** |
| **"Scope is frozen"** (D-044(c) 24 Sep; D-075 30 Sep 08:34 UTC) | Within 4 hours of D-075: D-077 (name governance), D-078 (certificate truth), D-079 (email system), D-081 (the school's pass mark), D-082(d,e). The tickets they opened: BOB-48, 49, 50 and 51; DAISY-36, 37, 38, 39 and 40. All 127 tickets were opened 24–30 Sep; 75 on 29–30 Sep. **[FACT]** |
| **"Gates keep defects out"** | Defects that reached `main` and were found by people or reviews, not CI: BOB-22, BOB-23 (its first fix broke BOB-22's fix), BOB-37, BOB-38–41, BOB-42, BOB-50, DAISY-30, DAISY-40, the self-rename and password hole, and D5 (never ticketed). **[FACT]** |
| **"Yazid is not the API between GitHub, Supabase and Vercel"** (D-039, 24 Sep) | At least 30 distinct technical steps by Yazid in 9 days: variables, secrets, DNS, dashboard reads, SQL bootstrap, sign-in tests, billing, a console `fetch`, redeploys, screenshots. Plus every message between agents. **[FACT / INFERENCE for the count]** |
| **"Identity Gates 0–2E are done"** | Code-gated on `main`: Gates 0, 1, 2 and 2E. Staging acceptance is pending for Gate 1 (the forwarding key was never added; the code silently forwards nothing without it) and Gate 2E (M6). Gate 2's is unrecorded. Only Gate 0 is complete by D-058's own definition. Gates 4–8 have not started. **[FACT]** |
| **"Production can be released when ready"** | Production was deployed from Bob's lane branch on 23 Sep, not from `main`: 13 Vercel attempts, 5 migration attempts, 4 Auth attempts. The release path has never been run since or rehearsed on staging. CI never tests the 111→132 jump production would make. **[FACT]** |

---

## 3. Architecture assessment

**A. Product model. Sound, but decisive semantics were left open. [FACT / INFERENCE]**
- **The entity model fits a multi-school platform:**
  - an institution → `org_nodes` tree with a path column;
  - dated role assignments and append-only memberships;
  - canonical content shared through `release_distributions` and revised by copy-forward;
  - releases frozen by content hash;
  - sessions and results stamped with release, definition, engine and policy versions;
  - certificates with an identity snapshot and HMAC signatures from a versioned keyring;
  - one public verification route.

  This is a good model and should survive.
- **What "passed" means was never decided** until D-081 on 30 Sep. Four overlapping scales exist:
  - the pass mark: 0.6, set by code and never ruled on;
  - the predikat bands;
  - the readiness tiers;
  - the voice-guide bands.

  0.6 is also hard-coded at `src/app/_intel.ts:51`, and Studio accepts free JSON for it. `session_outcome` and `certificate_eligibility` disagree when no pass mark is set (F7). The certificate path, the most visible output of the product, therefore rests on a rule decided after the code shipped.
- **D-003 (test schools are real)** means testers produce OFFICIAL evidence and real certificates. That undercuts the OFFICIAL/synthetic split the architecture relies on. **[INFERENCE]**

**B. Architecture. Coherent, but built in the wrong order, with machinery out of proportion. [FACT]**
- **A deliberate "thick database":**
  - 393 SQL functions (317 SECURITY DEFINER);
  - 72 Server Actions, all under the caller's own token;
  - the service role is confined to `src/app/api/*` behind `server-only`.

  This is coherent for tenancy.
- **Breadth before depth.** By 23 Sep (about 112 migrations), a school still could not create a class, upload, publish or see a report. Feedback (9 tables), tours, briefings, coaching, question health, evaluation personas, telemetry and transfers already existed. **[FACT: `docs/audit/PINTAR-4.0-ISSUES-AND-STATUS-2026-09-24.md:91-96`]**
- **The schema exists only as migrations:**
  - 45,357 append-only lines;
  - 94 functions redefined, and ten more than three times (`platform_schema_lint` 14 times, `launch_quick_assessment` 6);
  - about 25% of the migration SQL is verification blocks (11,473 lines), which also run during production deploys;
  - no schema snapshot is kept.
- **RISK, migration ordering:** 33 migration versions are dated in the future (up to `20261031100000`). A migration created with a real timestamp would sort before migrations already applied.
- **Two email paths with two rate-limit regimes:**
  - Supabase Auth's SMTP, for the sign-in links;
  - PINTAR's `kirimEmail`, for everything else.

  Only the first has ever delivered a real email.
- **Observability: none beyond logs.**
  - no error tracker;
  - no health route;
  - none of the 18 workflows runs on a schedule;
  - `global-error.tsx` reports nothing.

---

## 4. Implementation assessment

- **Much is genuinely built and works in the middle of the chain.**
  - On staging, by clicking, in the synthetic school: structure, student intake, class cards, workbook upload, review and publish, assignment, card sign-in, pre-test, lessons, post-test and result. Runs 12 and 16, on `daa5721`. **[FACT]**
  - On the local stack: the audit's five-student proof produced correct class figures (Pemahaman 75%, +35 points; audit #52 S20–S23). **[FACT]**
- **Built but not usable, or not reachable** (each found after "done"):
  - the post-test link (BOB-22);
  - the decision queue (BOB-39);
  - question health (BOB-41);
  - per-topic mastery (BOB-37);
  - pre-test orientation text (DAISY-25);
  - media playback (BOB-11);
  - certificate-list links (DAISY-40);
  - misconception codes, which cannot be registered anywhere (D-063, no ticket);
  - "Buat salinan untuk diperbaiki", which drops the pre/post-test marks (D5, never ticketed);
  - the teacher has no Uji Cepat score screen (EDU-10 FAIL). **[FACT]**
- **Backend/UI contract seams are a recurring defect class:**
  - 0-based vs 1-based numbering (BOB-22);
  - objects stored, numbers read (BOB-37);
  - UTC vs WIB (DAISY-14);
  - the UI forwards a case nothing creates (BOB-39);
  - the UI offers transitions the database refuses (BOB-41);
  - a page keyed by one id and looked up by another (DAISY-40);
  - the BOB-26 contract vs the code: a nested answer shape and a renamed route.

  **[FACT] SYSTEMIC.**
- **Defects live on `main` and production today:**
  - a single Uji Cepat can issue a publicly verifiable certificate (QUICK `certifies=true` since `20260914093000:62`);
  - any signed-in user, a class-card student included, can rename themselves and change their password without the current one.

  Both are fixed only on Bob's unmerged lane. **[FACT]**
- **Fixes that broke other fixes:**
  - BOB-23 round 1 passed CI #218 and audit #36, then removed BOB-22's post-test link;
  - its stated root cause was later corrected;
  - BOB-22's fix had made BOB-23's save loop about 39% worse. **[FACT]**
- **Unreachable by design today:**
  - the full 4.0 identity: activation, password sign-in, recovery by email and by PINTAR ID + PIN, and shared-device lock (Gates 3–8);
  - the certificate's final truth and design (BOB-48, BOB-49, DAISY-36);
  - the educator-as-learner package (BOB-43–47, DAISY-32–35);
  - BOB-15 / DAISY-12 (REL-13).

  These are agreed 4.0 scope, and not started or held. **[FACT]**

---

## 5. Testing-system assessment

**Overall verdict (INFERENCE from FACTS below).** The testing system is large, strict about its own bookkeeping, and strong at the database layer. It does not test what the owner cares about: whether a person can complete their work. Green CI is giving false confidence about usability.

**Size [FACT].**
- `selftest/` is about 50,200 lines, against about 31,600 lines of `src` TypeScript and about 45,400 of migration SQL.
- The manifest holds 448 tests: 257 database, 154 static, 37 app.
- `experience.test.ts` alone is 12,014 lines.
- No CI test drives a browser.

| Layer | A. Genuinely proves | B. Does not prove | C. Can pass while PINTAR is unusable? | E. Implementation or outcome | Notes (D duplication, F human work, G reproducible, H stale) |
|---|---|---|---|---|---|
| Lint, typecheck, build | The code compiles | Anything a user sees | Yes | Implementation | G yes |
| **Static tests** (154) | Source invariants (no service key in the bundle; one engine caller); a few real function checks (QR decode) | Hydration, focus, layout, network, client state | **Yes.** About 89% read repository text; about 56 only read text; 40 parse migration SQL; 2 assert an exact migration count. A focus ref that never moves focus passes UX1-MASUK-AKSES-01. A CSS-text scan (UX1-S0-MUAT-01) replaced a real 390 px measurement that had found 4 of 32 pages overflowing. | Mostly implementation | **H live today:** UX1-S3-CEPAT-01 reads QUICK `certifies` from the 14 Sep insert, so on Bob's lane it still demands copy claiming «kelayakan sertifikat» after BOB-50 made that false, and CI #253 is green. F: a human bumps the count tripwires on every migration. |
| Selftest bookkeeping (`run.ts`) | Every manifest id ran, nothing skipped silently | That each test proves its prose `proves` field | Yes | — | `npm run selftest:db` runs only fable01–07 of 19 suites (stale script) |
| **Red-case plants** (28 jobs, 132 plants) | Each targeted database test is sensitive to its defect (mutation landed, the right id went red for the right reason, schema restored) | Anything about routes, client code or deployed configuration | Yes | Implementation (appropriate) | G yes. High CI cost: 22 jobs each boot a Supabase stack |
| **Database/RLS tests** (257) | Role-scoped outcomes, refusal codes, real concurrency races. **The best layer.** | PostgREST/GoTrue (personas are `set local role` plus claims); time passing; seeded data only | Yes. CI #240 was green while a teacher could never launch a second Uji Cepat (BOB-42) | Outcome at the database level | **RISK:** 213 `exception when others then null` blocks: such a refusal test passes on any error, e.g. a renamed function. The upgrade-path job re-runs only fable01 and never tests production's 111→132 jump. |
| App tests (37) | Real `next start`, real local Auth JWTs, server-rendered HTML | Any client JavaScript | Yes: BOB-23's 343 POSTs in 20 s were invisible to it | Partly outcome | — |
| **Audit harness** (Playwright, local stack) | Browser flows on a fresh stack in production posture, including the five-student class proof | **It cannot go red on a FAIL step.** It never clicks Keluar, never checks certificate state, runs only at 1280×900, and signs staff in only by magic link | **Yes, by construction** | Mixed. Operator shortcuts: W0 SQL every run; people by direct POST; intake via RPC with service-key sessions; pages by typed URL | Dispatch-only; artifacts kept 14 days; the harness lives on the coordinator branch, not `main` |
| **Staging journeys** | The deployed app, by clicking, at 820 px; it fails on FAIL. **The most honest layer;** it found BOB-42 and X-08. | Staff sign-in (service-key sessions); certificates (a synthetic school); BLOCKED and NOT RUN steps do not fail it | Yes, for everything outside the learning middle | Outcome | F: "by hand only", never scheduled, results transcribed into markdown by hand. G: each run adds students and a course, so runs are not reproducible from scratch. |
| Manual tests | — | — | — | — | Many RUN rows "not yet walked" (STU-16, HOD-03, X-09, X-11). Agents cannot see rendered screenshots (the artifact host is blocked), so no agent has looked at the product's screens. **[FACT]** |
| Release checks | Production facts at a point in time | Current behaviour | Yes | — | **H:** "PASS (unchanged)" persists until someone edits the prose; 5 PASS rows rest on production, which is a different build. |

**The M6 case study.** Why did the verification method become "open DevTools, allow pasting, edit JavaScript, POST, read JSON, send a screenshot"?
1. **The feature was "done" when CI passed.** CI sends mail only to a local sink that accepts any password, and asserts TLS on 465 from source text. Nothing in CI touches the deployed configuration. **[FACT]**
2. **Nobody owned "it works on staging".** `staging.yml` configures Supabase's SMTP, not the app's `PINTAR_SMTP_*`. `identity-facts.yml` reads Supabase and DNS, not Vercel. No workflow reads staging's Vercel variables, although the token to do it exists and two workflows already call Vercel's API. **[FACT]**
3. **The agents are blind to the deployed system.** They have no Vercel access and cannot see screenshots. So the last-mile proof was pushed to the only actor who can see it, the owner. The hand-off says so: "I cannot read Vercel's settings from here." **[FACT]**
4. **The gate accepted a hand-off whose acceptance required the owner.** The coordinator relayed that procedure twice before Yazid objected. **[FACT]**

**What M6 shows about the system.** "Done" is defined at the boundary each agent can see, not at the boundary the user experiences. Wherever those boundaries differ (deployed configuration, email, rendered screens, real sign-in), the gap falls to Yazid. The same pattern produced the SMTP 535 incident, the invalid `PINTAR_SMTP_HOST`, the unadded forwarding key and the Actions budget outage. **[INFERENCE] SYSTEMIC.**

---

## 6. User-journey reality

**The one-school chain, link by link** (staging = `main`; production in the last column).

| # | Link | Verdict | Exact break |
|---|---|---|---|
| 1 | The first platform admin exists | **Only with operator help** | Created in the Supabase dashboard, then `bootstrap_first_system_admin` in the SQL editor. One-shot, with no recovery ("ADMINISTRATOR RECOVERY IS NOT BUILT", `20261004100000:24`). [FACT] |
| 2 | The school exists | **Only with operator help** | No screen or RPC creates an institution (`src/app/konfigurasi/page.tsx` has no such section; SYS-03 N-I). Every school, including the audit's, was born by SQL (W0). [FACT] |
| 3 | The first school admin | Works, by the platform admin | «Orang baru» (SYSTEM_ADMIN only), then the role in Konfigurasi. No email is sent, so the person must be told out of band. [FACT] |
| 4 | Admin: structure | **Works end to end** (audit S7 in a browser, local stack) | Staging's structure was made by a workflow calling RPCs, not the UI. [FACT] |
| 5 | Admin: add the teacher | **Only with operator help** | «Orang baru» is SYSTEM_ADMIN only (`api/akun/aktivasi/route.ts:53`). Intake refuses staff rows. A school admin's grant needs an existing tie to the school (BOB-21). A school admin cannot onboard their own teacher. [FACT] |
| 6 | Admin: add the student and a class card | **Works** (staging J01–J03, synthetic school) | Cards are made one at a time and the PIN is shown once; there is no print sheet (RISK). [FACT] |
| 7 | Content into the school | **Works for a ready workbook** (J04–J05) | Every real workbook so far came from Python generators. No teacher-authored workbook exists in the evidence (NOT PROVEN). Studio will not save without every media file. Distribution to other schools is backlog; each school imports and publishes alone. [FACT] |
| 8 | Teacher sign-in | **Not proven on a deployed environment; at risk** | Magic link through Supabase's mailer, at 2 emails per hour per project. The third staff member in an hour sees "check your email" and nothing arrives; the screen says "sent" either way (`masuk/actions.ts:73,101-104`). Staging journeys bypass sign-in with service-key sessions. Password activation (BOB-26) is not on `main`. [FACT] |
| 9 | Teacher: Siapkan → Sediakan | **Works end to end** (J06) | — |
| 10 | Teacher: Uji Cepat | **Partial** | Launch works (run 15). The repeat-launch defect is fixed on `main` (BOB-42) but not walked on staging. There is no score screen (EDU-10 FAIL). [FACT] |
| 11 | Teacher: understand what happened | **Not proven on a deployed environment** | Staging always shows «Belum ada bukti» by design (synthetic evidence). Figures exist only on the local stack, reached by typed URLs. [FACT] |
| 12 | Student: sign in, learn, pre/post-test, result | **Works end to end by clicking** (J07–J13, runs 12 and 16) | Not driven: changing an answer and reloading (STU-07), network loss (STU-09), the next person on a shared tablet. Student email sign-in is untested. [FACT] |
| 13 | Student: certificate | **Not proven; in practice broken** | 0 certificate rows anywhere. Synthetic evidence can never be eligible. Production has no tests and its key has no recovery copy (REL-09). The pass mark and eligibility rules were on hold until D-081. No harness step checks issuance. [FACT] |
| 14 | Anonymous verification | **Not proven** | Only the not-found path works (P1); a valid token has been verified only in selftests. [FACT] |
| 15 | Recovery (lost card, lost staff access, sole admin) | **Only with operator help** | A lost card cannot be re-issued through the UI (ADM-08 N-I; U-RECOVER FAIL). Staff email problems need the dashboard. The sole SYSTEM_ADMIN has no recovery; break-glass is unwritten and unrehearsed (SYS-08 FAIL). [FACT] |

**Per role.**

| Role | Verdict (staging) | Production |
|---|---|---|
| Platform admin | Can, with operator help (SQL for schools and its own existence; no recovery) | Cannot onboard a school |
| School admin | Can, with operator help (the platform admin creates every teacher; lost cards need an operator) | Cannot |
| Educator | Can assign with help; figures not proven; no Uji Cepat results | Cannot |
| Head of department | UNKNOWN (review queue never walked; figures only on the local stack) | Cannot |
| Dean | UNKNOWN (no dean is ever provisioned or signed in by a journey) | Cannot |
| Student | Can complete the learning cycle; certificate cannot | Cannot |
| Anonymous verifier | Cannot in practice (no certificate exists) | Cannot in practice |

**Answer to the owner's core test:** can PINTAR 4.0 work as a complete product for one admin, one teacher and one student? **No, not today, on any deployed environment.** The middle of the chain (prepare → assign → learn → assess → result) is real and works by clicking on staging. The ends do not:
- the school's birth;
- the school's own staff onboarding;
- reliable staff sign-in;
- evidence the teacher can see;
- the certificate and its verification;
- recovery.

---

## 7. Security and tenant-boundary assessment

**Strong, and worth keeping [FACT]:**
- RLS on all 106 live tables; no `using (true)` policy. About 45 tables are reachable only through functions.
- 317 SECURITY DEFINER functions, all with a pinned `search_path`.
- 450 revokes. 158 functions are executable by `authenticated`, **0 by `anon`**, and a registry plus lint governs every client grant.
- Tenant predicates (`institution_id` on 51 tables; `can_in_institution`, `has_scope`, path-scoped nodes). Cross-tenant refusal tests run in CI (F01-T02/T03/T04).
- The service role is server-only.
- Rate limits live in the database.
- The certificate token is 32 random bytes.

**Holes and risks:**
- **FACT, live on `main` and production:**
  - self-rename;
  - a password change without the current password;
  - a single Uji Cepat issuing a verifiable certificate.

  Fixed only on unmerged lanes.
- **RISK:** no security headers (no CSP, no `frame-ancestors`), so sign-in and assessment pages can be framed.
- **RISK, unverified:** the evaluation persona switch runs in production with the service role, and mints a magic link (`assume/route.ts:76`) before `assume_persona` authorizes the pairing (`:99`). It needs a focused review.
- **RISK, test validity:** 213 `exception when others then null` blocks in database tests can turn a broken refusal into a pass.
- **RISK:** a single SYSTEM_ADMIN with no recovery. BOB-26's password guard (on Bob's lane) also disables dashboard resets until Gate 4.
- **RISK:** the guard sits on Supabase's managed `auth.users`; its behaviour across Supabase upgrades is UNKNOWN.
- **RISK:** the SMTP password lives in 5 places (cPanel; a GitHub secret; Supabase Auth on both projects; Vercel staging).

**Verdict.** The database security boundary is the best-engineered part of PINTAR. The exposed holes are known, and their fixes are built but stuck behind the stalled landing. The perimeter (headers, the persona switch in production) and secret sprawl need attention.

---

## 8. Deployment, configuration and operations assessment

**Configuration is managed by hand and never verified in place [FACT].**
- Staging's Vercel variables are entered by Yazid in the dashboard, all marked Sensitive, so nobody can read them back.
- Nothing reads the deployed Vercel configuration, although the token and API calls to do so already exist.

| Incident | Detected by | Lasting fix? |
|---|---|---|
| Invalid GitHub service-role secret (23 Sep) | Automation failing on use | **Yes** (key taken from Supabase, validated, checked by hash). The only well-closed case. |
| A production-labelled secret overwritten by hand (24 Sep) | A human | Partial |
| Vercel's daily deploy limit (29 Sep) | The coordinator, about 18 h later | Yes (`vercel.json`) |
| Staging migrations skipped by `[skip ci]` (29 Sep) | The coordinator, by hand | **No.** It is still a manual dispatch, and `STAGING.md` still says it is automatic. |
| Stale Supabase SMTP password on **both** projects (30 Sep) | Failed human sign-ins | **No.** Staging was fixed 1 Oct. **Production is still unconfirmed.** INFERENCE: `staging.yml` re-writes the SMTP password from a GitHub secret on every run; run #25 did so about 1.5 h before the 535 errors. The project's own workflow may have caused it, and may do it again on the next run. |
| GitHub Actions budget exhausted (30 Sep) | Jobs got no runner; one wasted re-run | No alert. The 28 Sep cost audit had predicted it. |
| Invalid `PINTAR_SMTP_HOST` on staging (1 Oct) | The app's validator, triggered by a console paste | **Open** |
| Forwarding key never added (D-062(c)) | **Nothing.** The code silently does nothing without it. | **Open** |

**Release [FACT]:**
- **Production is 21 migrations behind**, 564+ commits and 8 days behind `main`, and carries every defect fixed since.
- It was released from a lane branch, through workflows used once (13 + 5 + 4 attempts) and never exercised by staging.
- The planned Gate 8 release bundles everything at once: 21+ migrations, Auth settings, 5+ new secrets, a region move, the password guard and break-glass. It has never been rehearsed.
- **Rollback is untested,** and migrations are forward-only.
- **Backups and point-in-time recovery: UNKNOWN.** They appear nowhere in the docs.

**Observability [FACT]:**
- There is none.
- Nothing runs on a schedule; there is no error tracking, no uptime or sign-in monitor, and no budget alert.
- **Nobody would know production sign-in is broken until a person failed to sign in,** and the sign-in screen tells them a link was sent either way.

---

## 9. Development-process assessment

**The flow:** Yazid → coordinator → Bob/Daisy/Lana → CI → audit → staging → manual → gate.

1. **Yazid is the message bus and the last-mile tester. [FACT]**
   - The agents cannot message each other.
   - Every brief, verdict and hand-off is pasted by Yazid: an estimated 40–60 pastes a day on 27–30 Sep (INFERENCE).
   - On top of that, at least 30 technical steps in 9 days. The 29–30 Sep night showed the lanes can run asynchronously through git when Yazid is away; the relay is a habit, not a necessity.
2. **Self-certification. [FACT]**
   - The coordinator wrote the audit harness, gated against it, judged the evidence and wrote the checklist. About 22 gate verdicts were issued on 29 Sep alone.
   - About 1,032 commits by AI agents, 1 by a human.
   - Humans and out-of-band reviews found the defects that mattered.
3. **Horizontal lanes produce contract seams. [FACT, SYSTEMIC]**
   - Bob builds the server and Daisy the screens, coordinating through written contracts relayed by Yazid. The seam defects in §4 are the predictable result.
   - No one agent owns "this journey works for the user".
4. **Agents are blind where the user is. [FACT]**
   - No Vercel access.
   - No viewable screenshots: the artifact host is blocked.
   - Lane sandboxes cannot run a local Supabase stack.

   So configuration, visual correctness and real sign-in are verified by Yazid, or not at all.
5. **The process optimises for tickets and tests. [INFERENCE from FACTS]**
   - Hand-offs prove the ticket's own tests (plants, red/green) with great rigour.
   - Nothing in a ticket's acceptance requires the journey around it to work.
   - BOB-25 was "done" with zero real emails sent; the BOB-23 fix broke the post-test.
6. **Scope control failed. [FACT]**
   - 83 decisions in 19 days (42 on 24 Sep, 20 on 30 Sep).
   - Freezes were declared and immediately breached.
   - Design rounds for the ID card and the certificate ran while the certificate had never once been issued.
7. **Context loss. [FACT]**
   - `BOARD.md` is 37,500 words, with single cells up to 12,000 characters. Its header still says `main` is at "Integration 15".
   - `COORDINATOR.md` is stale at 28 Sep, and `STAGING.md` at 24 Sep.
   - The checklist on `main` still says `daa5721`.

   The record is too large for its owner to read, and drifts from the truth.
8. **Resource ceilings stopped work repeatedly. [FACT]**
   - The Vercel daily deploy limit;
   - the GitHub Actions budget;
   - agent weekly usage;
   - Supabase email at 2 per hour.

   None was monitored.

---

## 10. Complexity assessment

| Measure | Value [FACT] |
|---|---|
| Migrations / SQL lines | 132 / 45,357 (`main`); 25% verification blocks, 24% comments |
| Tables / views / functions | 106 / 18 / 393 names (546 definitions; 94 redefined) |
| Application code | 31,553 lines of TS/TSX in 231 files; 50 pages, 10 API routes, 72 Server Actions |
| Tests | About 50,200 lines in `selftest/`; 448 tests; 132 plants; 28 red-case CI jobs; `ci.yml` 1,911 lines |
| Docs | 180 Markdown files, about 635,000 words, of which about 376,000 are coordination |
| Governance | 83 decisions, 24 ADRs, 38 invariants, 127 tickets, 28 hand-offs, 4 checklist versions; `BOARD.md` 37,500 words |
| Ratio | Tests, verification and docs are about 2.6 times the executable product code (INFERENCE) |
| CI cost | 33–35 jobs per run (22 boot their own stack); about 110–125 billed minutes per run (INFERENCE); the USD 75 budget exhausted in 19 days |

**Unnecessary, or premature for a product with no real users [INFERENCE, with evidence]:**
- metric-catalogue versioning (MC-1 to MC-3, bump rules), while `mode_policy` is unversioned and the engine label is admittedly untruthful;
- policy and engine version labels;
- verification blocks inside migrations, including 14 versions of `platform_schema_lint`;
- source-text "tests" for UX behaviour, and count tripwires;
- evaluation personas in production;
- feedback, tours, briefings, coaching and question health, built before the core chain worked;
- two email paths;
- the governance volume.

**Justified, and should stay:**
- the RLS and grant model with its lint;
- the tenant predicates and cross-tenant tests;
- immutable sessions and releases with content hashes;
- certificate signatures, the keyring and the single verification route;
- the outbox with idempotent `client_seq`;
- rate limits in the database;
- the password-write permit, once recovery is added;
- plants for security-critical seams.

**AI-generated complexity [INFERENCE].**
- **Agents add machinery to prove their own correctness:** plants, lints, versioned catalogues, verification blocks, prose `proves` fields, hand-off documents.
- Each is locally rational.
- Together they double the system's size without testing the user's outcome.
- Every agent can extend the machinery; nobody has had to prune it.

---

## 11. Systemic patterns discovered

1. **Guards, not outcomes, are tested.**
   - `metric_evaluate` shipped "unable to compute anything" with four passing refusal probes (15 Sep).
   - BOB-37 repeated the class (29 Sep).
   - **SYSTEMIC.**
2. **"Done" stops at the agent's horizon** (deployed configuration, email, screens, real sign-in). The rest falls to Yazid or is never done. **SYSTEMIC** (M6, SMTP, forwarding key, budget, DAISY-30).
3. **Green signals that cannot go red:**
   - an audit job with no exit code;
   - staging runs where BLOCKED does not fail;
   - "PASS (unchanged)" carried forward;
   - merges with known audit FAILs.

   **SYSTEMIC.**
4. **Contract seams between server and UI.** **SYSTEMIC.**
5. **Scope added while freezes are declared;** design polish ahead of function. **SYSTEMIC.**
6. **Goalposts moved to fit the evidence:**
   - media out of scope (D-050);
   - dates replaced by gates (D-052);
   - class-figure proof moved off staging (D-064);
   - a "demonstration bar" for content.

   Each was defensible alone. Together they show the system adjusting its definition of done rather than its product. **SYSTEMIC (INFERENCE).**
7. **The same seams reopen:**
   - Uji Cepat: 9 items in 3 days;
   - certificate: 6 tickets and 8+ design decisions;
   - identity, email, the lesson player.

   These are the areas where the model's semantics were undecided. **SYSTEMIC.**
8. **Synthetic everywhere it matters.** Staging holds only synthetic evidence; the "real school" proof lives in a throwaway database born by SQL. **SYSTEMIC.**
9. **Isolated incidents:** the F06-P07 random draw, one mistakenly cancelled run, the thumbnail left in a lane's history.

---

## 12. Root causes

| Problem | Root cause |
|---|---|
| Users can't complete the chain, though tests are green | **Test design:** acceptance is defined per ticket at the component boundary. No end-to-end journey from the front door gates any merge, and the journeys that exist cannot fail or are not run. |
| Owner used as the harness | **Human-in-the-loop misuse plus blind agents:** agents have no access to deployed configuration or screens, and no automation was built to give it to them, despite D-039. |
| Configuration incidents | **Environment management:** secrets duplicated in 5 places, hand-entered, unreadable, never verified; a workflow that overwrites one of them; no monitoring. |
| Seam defects | **Ownership structure:** horizontal lanes (server/UI) with relayed contracts; nobody owns a journey. |
| Late semantic defects (certificate, pass mark, Uji Cepat) | **Specification gap:** decisive product rules (what "passed" means, what certifies) left undecided while code was built on assumptions. |
| Wrong build order | **Sequencing:** breadth-first build of supporting systems before the core chain was proven. |
| Scope creep and governance volume | **Governance failure:** no hard scope gate; decisions and documents produced faster than the owner can absorb; freezes without enforcement. |
| Stale evidence | **Evidence provenance:** status kept as hand-edited prose rather than generated from runs. |
| Production drift, untested release | **Release design:** a big-bang release model; production released once from a lane; staging never exercises the production path. |
| Complexity growth | **Agent coordination:** each agent proves itself with more machinery, and nobody is charged with removing it. |

---

## 13. STOP DOING THIS

1. **Stop treating CI green, "GATE PASS" or the checklist count as evidence that PINTAR works for people.** Only a front-door journey on the deployed app is that evidence.
2. **Stop accepting any hand-off whose verification needs the owner** to open a console, read a dashboard, paste code or take a screenshot. If a machine can't verify it, the work isn't done.
3. **Stop using Yazid as the message bus between agents.** The board in git already works asynchronously.
4. **Stop merging with known FAIL or BLOCKED steps,** and stop carrying "PASS (unchanged)" forward without a re-run.
5. **Stop writing "tests" that read source text** to assert behaviour (focus, layout, copy correctness, migration counts, flags parsed from old migration files).
6. **Stop adding verification blocks to migrations,** and stop redefining the same function across many migrations without a schema snapshot.
7. **Stop opening scope during a freeze.** Every new decision on 30 Sep was individually sound and collectively fatal to the date.
8. **Stop running design rounds** (ID card, certificate visuals) on outputs that have never been produced by the working product.
9. **Stop proving things only in synthetic schools** and throwaway databases, and stop resetting staging data in ways that hide defects.
10. **Stop the governance sprawl:** 12,000-character board cells, 9 decisions a day, checklists rendered in four versions.
11. **Stop running 34 CI jobs per ticket,** each booting its own stack, while no job opens a browser.
12. **Stop letting the same actor build the evidence and judge it.** This includes the coordinator.

---

## 14. DO NOT THROW THESE AWAY

| Keep | Why it deserves to survive |
|---|---|
| **The database security model**: RLS closed by default, revoked defaults, pinned `search_path`, the client-function registry and lint, tenant predicates | It is the strongest, best-tested part. It is hard to get right and expensive to rebuild. |
| **The core product model**: canonical content and distribution, immutable releases, sessions and results, evidence provenance | Coherent for a multi-school platform, and it makes results reproducible. The audit found no structural flaw in it. |
| **The certificate cryptography**: identity snapshot, HMAC keyring, single verification route | Correct design. What is missing is the path to it, not the design. |
| **The answer outbox** (`client_seq`, idempotent acceptance) | Real, tested, and it protects students' answers. |
| **The database tests, including concurrency, and the plants for security-critical seams** | They catch real regressions in authorization and data integrity. |
| **The staging journey script** and the **Playwright audit harness** foundation | The most honest evidence the project has. Fix them; don't discard them. |
| **BOB-26's identity work** (password-write permit, name governance, single canonical Auth settings) and **BOB-25's send log and limits** | Closes real holes (self-rename, password change) and builds the right email foundation. |
| **The validated production key handling** in the deploy workflow | The one configuration incident that was closed properly. It shows how the others should be closed. |
| **Lana's content** (20 chapters with content passes; 5 accepted on staging) | Real teaching material, independent of the platform's state. |
| **The principles:** D-047 (never leave the user wondering), D-052's sequence (engineering → polish → owner → Gladys → pilot), "flake is not a cause", D-039 (Yazid is not the API) | Right in spirit. The failure was in following them, not in the principles. |
| **Terminology v1's content** and **the semantic reviews** (pass mark, readiness) | They contain the decisions the product needs; they were just late. |

---

## 15. KEEP / FIX / SIMPLIFY / REPLACE / REMOVE / DEFER

| Area | Class | Recommendation | Evidence |
|---|---|---|---|
| Database security and tenancy | **KEEP** | As is; add focused tests where 213 swallow-all blocks weaken refusal tests | §7 |
| Core product model | **KEEP** | As is | §3A |
| Certificate model and crypto | **KEEP** | Prove the path to it end to end | §6 links 13–14 |
| Pass-mark and certifying semantics | **FIX** | Implement D-081 (one pass determination, sealed); merge BOB-50 | §3A; QUICK certifies on `main` |
| The definition of "done" | **REPLACE** | Ticket-level acceptance replaced by **journey-level acceptance:** nothing is done until the one-school chain still passes on the deployed staging app, run automatically | §5, §11.1–3 |
| Audit harness | **FIX** | Fail on FAIL or BLOCKED; remove the operator shortcuts (W0, direct POSTs, typed URLs) as product screens appear; add sign-out, certificate, 390 px, password sign-in | §5 |
| Staging journeys | **FIX** | Run automatically on every merge to `main` and nightly; from-scratch data; a real (non-synthetic) test school so official evidence and certificates are exercised | §5, §6 |
| Static source-text tests | **SIMPLIFY / REMOVE** | Replace behaviour claims with browser tests; replace migration parsing with live-catalog queries; drop count tripwires | §5 |
| Red-case plants | **SIMPLIFY** | Keep for security-critical database seams; stop adding them for UX and copy rules; share stacks between db gates | §5, §10 |
| Verification blocks in migrations | **SIMPLIFY** | Move to selftests; commit a schema snapshot per release | §3B |
| Metric catalogue, policy and engine versioning | **SIMPLIFY** | One stamped version until real reports exist | §10 |
| Two email paths | **SIMPLIFY** | Converge on one, verified by a real scheduled send | §3B, §8 |
| Configuration management | **FIX** | One source per secret; a read-only "environment facts" workflow for Vercel and both Supabase projects (drift = red); stop `staging.yml` overwriting SMTP blindly | §8 |
| Observability | **FIX** | Error tracking; scheduled sign-in and front-door checks on both environments; budget and runner alerts | §8 |
| Release process | **REPLACE** | The big-bang Gate 8 release replaced by small, frequent releases from `main` through the same path staging uses; test the upgrade from production's exact migration level; rehearse a restore | §8 |
| Lane structure (server Bob / UI Daisy) | **REPLACE** | Vertical ownership: one builder owns a journey slice end to end (database, server, screen, journey test). Daisy keeps the words, design and UX review. | §4, §9.3 |
| Owner relay | **REMOVE** | Lanes read and write the board in git; the owner gives rulings, not pastes | §9.1 |
| Coordinator self-certification | **REPLACE** | Evidence generated by automated journeys, not judged by the harness's author; periodic outside review | §9.2 |
| Governance documents | **SIMPLIFY** | A short board (one line per ticket); decisions only when a ruling is needed; status generated from runs | §9.7, §10 |
| School creation, staff onboarding by the school admin, recovery | **FIX** (4.0 scope) | These are missing product functions, not tests | §6 links 1–5, 15 |
| Evaluation personas in production | **FIX / DEFER** | Review the minting order; keep personas off production until reviewed | §7 |
| Security headers | **FIX** | CSP and `frame-ancestors` | §7 |
| Feedback, tours, briefings, coaching, question health | **DEFER** (their polish) | Keep the code; spend no effort on it until the core chain passes | §3B |
| ID card and certificate visual design | **DEFER** | Already closed; nothing more until the certificate is produced by the product | §11.5 |
| Scale and load (L1–L5) | **DEFER** | Only after the one-school chain is proven; keep an eye on structural risks | Owner ruling |

---

## 16. Objective definition of "PINTAR 4.0 READY"

PINTAR 4.0 deserves to be called ready only when **all** of the following are true, each shown by evidence a machine produced and anyone can re-run:

1. **The one-school chain passes on staging, automatically, from the front door, with zero operator steps:**
   - the platform admin creates a school and its admin in the UI;
   - the admin builds the structure, adds a teacher and students, issues class cards, and gets content in and published;
   - the teacher signs in by the 4.0 sign-in, prepares and assigns, runs an Uji Cepat and reads its results, and reads the class evidence;
   - the student signs in, learns, takes the pre- and post-test, reads the result and receives a certificate;
   - an anonymous visitor verifies the certificate;
   - everyone signs out.

   It runs on every merge to `main` and nightly, fails red on any FAIL or BLOCKED step, and keeps its screenshots viewable.
2. **Every role in the agreed 4.0 scope has its own automated front-door journey that passes:** head of department review and freeze, dean reports, platform-admin operations.
3. **Every agreed 4.0 capability is listed with its status,** and each is proven by (1) or (2). None "exists but is unreachable".
4. **Identity Gates 3–8 work end to end on staging:**
   - activation, password sign-in, recovery by email and by PINTAR ID + PIN, the shared-device lock, and the existing-staff transition;
   - break-glass rehearsed for the platform admin.
5. **Email is proven continuously:** a scheduled real send from staging and production through the real path, with SPF, DKIM and DMARC checked automatically, and one source for each SMTP secret.
6. **Configuration is verified, not trusted:** an automated read of Vercel and both Supabase projects shows no drift, on a schedule and before every release.
7. **Release is boring:**
   - production runs a recent `main`;
   - the release path has been rehearsed on staging;
   - CI proves the upgrade from production's exact migration level;
   - a backup restore has been rehearsed;
   - rollback is documented and tested.
8. **Failure is visible:** error tracking and scheduled sign-in and front-door monitors alert someone other than a user.
9. **There are no open P0 defects,** and every defect found by a person in the last runs has an automated test that would have caught it.
10. **Human acceptance follows machine proof, never replaces it:** Yazid, then Dr Gladys, walk the chain on staging without help and record no blocking issue. Only then the educator pilot.
11. **Then, and only then, scale:** L1 load at the size of the first real cohort passes on production-like infrastructure before any cohort is onboarded.

Scheduling should be reconsidered only when (1), (6) and (8) exist and report honestly. They are the instruments that make every later estimate trustworthy.

---

## 17. Recommended recovery sequence (no dates)

The owner reviews this audit first; nothing here is accepted until the owner has. The order matters more than the speed.

1. **Decide the working system.** Rulings on:
   - journey-level "done";
   - vertical ownership;
   - no owner relay;
   - generated evidence;
   - a scope freeze enforced by a single gate the owner controls.
2. **Build the instruments before the features:**
   - make the audit harness fail honestly;
   - turn the staging journey into the automated one-school chain on the deployed app, with a real (non-synthetic) test school;
   - add the environment-facts check, the scheduled smoke checks and error tracking.

   Run them on current `main` and record the honest baseline. Expect them to be red; that is the point.
3. **Stabilise operations:**
   - confirm and fix production sign-in email;
   - one source for each secret;
   - stop the SMTP overwrite;
   - add a budget alert.
4. **Land what is already built and safe,** through the new journey gate: BOB-26, BOB-50, BOB-51, DAISY-20 and DAISY-40. These close live holes.
5. **Close the chain's breaks in chain order:**
   - the school's birth in the UI;
   - the school admin onboarding their own teacher;
   - reliable staff sign-in;
   - the D-081 pass mark and certificate issuance;
   - teacher evidence proven with official evidence;
   - recovery.

   Each is done only when the chain journey goes further.
6. **Make release routine:** rehearse the production path on staging, then release `main` to production, then keep releasing small.
7. **Complete the rest of the agreed 4.0 scope:**
   - Gates 4–8;
   - the remaining role journeys;
   - the educator-as-learner package;
   - BOB-15 / DAISY-12;
   - the UI/UX polish pass.

   Each is accepted by extending the journeys.
8. **Human acceptance:** Yazid, then Dr Gladys, then the educator pilot.
9. **Scale:** L1, then onward.

---

## 18. Final assessment

**"If PINTAR 4.0 were my product and my reputation depended on it, would I consider the current development system capable of delivering a reliable, school-ready PINTAR 4.0?"**

**No.**

**Why** (each verified above):
- After 19 days, 979 commits, 132 migrations, 448 tests and 252 CI runs, no deployed environment can take one admin, one teacher and one student through their work without an operator.
- The system reported 63 of 84 P0 checks passing on the same day.
- That gap is not a lack of effort or skill. The system measures what its agents can see (database guards, source text, ticket-level red/green) and reports it as product readiness. The rest falls to the owner.
- A system that cannot see its own failures cannot be trusted to say "ready", however rigorous it is inside its horizon.

**What would change my answer.**
- The architecture and the security boundary are sound, and much of the product is built. Starting again would discard the best parts.
- The failure is in what counts as done, who proves it, and how the work is organised. All of that is fixable.
- I would answer **yes** to the central question once, and only once:
  - the one-school chain runs automatically against the deployed app and fails honestly;
  - configuration and email are verified by machines;
  - the owner is no longer the message bus and test harness;
  - scope changes pass through one owned gate.

**Two cautions about this report itself:**
- It was written by the coordinator, who helped build what it criticises. The evidence is cited so it can be checked. Yazid should still have someone outside this team (a fresh reviewer, human or AI, with no stake in the work) challenge its conclusions before acting on them.
- **UNKNOWNs that matter and should be resolved first:**
  - whether production sign-in email works today;
  - whether backups and point-in-time recovery are enabled;
  - whether the evaluation persona switch in production is exploitable;
  - the hosted Postgres version.

---

### Appendix: principal evidence

- **GitHub Actions, all 420 runs:**
  - `ci` 252 (171 success, 48 cancelled, 33 failed);
  - `staging · learning journey` 16 (3 / 12 / 1);
  - `deploy · vercel production` 13 (5 success, all 23 Sep, from `claude/quirky-meitner-a04smj`);
  - `deploy · supabase production` 5 (2 success).
- **Staging database (read-only, 1 Oct):**
  - 4 institutions (canonical, SD Zayd, SMA Zayd, «Sekolah Uji Kinerja (sintetis)»);
  - 73 persons (70 class cards, 3 email);
  - 72 sessions, all in the synthetic school;
  - 0 official sessions, 0 certificates, 0 rows in `email_send_log`.
- **Production database (read-only, 1 Oct):** 3 institutions, 1 person, 0 sessions, 0 assignments, 0 certificates, 111 migrations.
- **Repository (`main` `28d3015`):**
  - `src` 31,553 TS/TSX lines;
  - migrations 45,357 lines;
  - `selftest/` about 50,200 lines;
  - 448 tests;
  - docs about 635,000 words;
  - 979 commits since 12 Sep.
- **Key files:**
  - `audit/journey.mjs` (no exit code, operator steps W0, S3, S8–S10);
  - `audit/staging/journey.mjs:17` (service-key sessions);
  - `src/app/masuk/actions.ts:36-104` (magic link, throttle folded into "sent");
  - `src/app/api/akun/aktivasi/route.ts:53`;
  - `supabase/migrations/20260914093000:62` (QUICK `certifies=true`);
  - `20260912004431:307` (self-rename grant);
  - `20261004100000:24` (no administrator recovery);
  - `selftest/experience.test.ts:1503, 2358` (count tripwire; stale flag source);
  - `.github/workflows/staging.yml:189-212` (SMTP overwrite);
  - `docs/coordination/handover/HANDOFF-BOB-25.md:164-177` (console procedure);
  - `docs/audit/PINTAR-4.0-ISSUES-AND-STATUS-2026-09-24.md:15-35, 91-96`;
  - `docs/audit/HAPPY-PATH-SWEEP-2026-09-15.md:8-29`.
