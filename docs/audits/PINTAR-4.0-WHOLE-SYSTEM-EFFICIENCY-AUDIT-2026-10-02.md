# PINTAR 4.0 — Whole-system efficiency audit (2 Oct 2026)

**Question.** Does PINTAR do every normal human journey with the minimum sensible work, without weakening ROSES?

**Rules.** D-090 governs ("Not cheapest PINTAR. Highest-value PINTAR per dollar spent. Cost isn't the enemy. Waste is."), so effort was weighed against reward throughout.

**Scope.** Staging (Supabase Micro, Vercel `sin1`) and the repository on 2 Oct. No compute change, no authentication change, no change to the assistance check, no 1,000-learner wave.

## 1. Executive verdict

**PINTAR is sensibly efficient in its normal journeys, with four exceptions.**

| # | Exception | What we did |
|---|---|---|
| 1 | **A school administrator's Konfigurasi page** checked every row of every school's audit trail and enrolments against its policy: **2.47 s of database work for those two reads per view**, growing with the whole platform's history. | **Fixed** (−99%, same rows; §9) |
| 2 | **The assistance check** (§5 of the focused audit) is the largest single learner multiplier: 23 server actions, 23 Auth checks and 30% of the learner's RPC database time per sitting. It runs even where no help is configured. | Waiting for owner |
| 3 | **Authentication on every request** is a network round trip on every page, prefetch and action: 78 per learner sitting. | Waiting for owner (authentication) |
| 4 | **Management figures (/pimpinan)** are computed live on every view: **2.8 s of database work** for a dean or admin looking at a 26-class school. | Waiting for owner: freshness is a product question |

**Development machinery is not proportionate today.**

- Actions spend rose to about $100 a fortnight.
- About 56% of every CI run's minutes is starting a local Supabase stack (about 20 boots per run).
- Run volume followed the number of commits, not the risk of the change.
- Nothing made the rise visible.

A daily spend check now goes red over a budget (§8, §9), and the verification discipline is recorded (D-091). CI's structural fixes wait for the owner on timing, because they touch the gate machinery.

**Everything else expensive is legitimate.** Answer saving (evidence integrity), per-row RLS on class rosters (tenant isolation), learner sign-in, card creation and imports (paced on purpose) stay as they are, as do the small costs the focused audit already left alone.

## 2. Audit coverage

**Examined:**

| Area | Journeys and how they were examined |
|---|---|
| Every staff route (§3) and every learner route | Code traced from the page through Next, the proxy, PostgREST/RPC, SQL, RLS helpers and triggers (two read-only code maps, with file:line evidence) |
| The whole database workload since 24 Sep | 759,517 statements, 1,415 s in `pg_stat_statements`, ranked by total cost |
| Konfigurasi, /pimpinan's figures | `EXPLAIN (ANALYZE, BUFFERS)` **as real roles** (gs-001's administrator; the synthetic school's administrator), in read-only transactions |
| Uji Penguasaan | Measured three times at 50 learners at once (focused audit, runs 36969517374, 36979562623 and 36982765324) |
| Supabase | Performance advisors; edge and Postgres logs |
| GitHub Actions | 549 runs; job-level minutes sampled per workflow and outcome |

**Not measurable here, and why:**

- **Media delivery:** out of scope for the 5 Oct test (D-050); the code path is described in §6.
- **The card sign-in wave (CAP-01):** it waits for the forwarding key.
- **Email sending at volume:** staging allows 2 an hour.
- **Production:** reading it needs the owner's permission.
- **Page-by-page timing of every staff screen in a browser:** not run. The database side was measured directly as the real roles, which answers the question at less cost (D-090).

## 3. Whole-PINTAR workload map

What one human action costs. "Auth" means a network round trip to Supabase Auth. "Round trips" are database calls, not counting Auth.

| Journey / action | Frequency × concurrency | Auth | Round trips | Measured database cost | Grows with |
|---|---|---|---|---|---|
| Any page (shell) | every page | 2 (proxy + viewer) | 3 (banner, profile, roles) | ~1.5 ms | — |
| Prefetch of a link (RSC) | each link scrolled into view | 1 (proxy) | 0–3 | small | links on the page |
| **Uji Penguasaan, one sitting** (browser 50) | every learner, synchronized | **78** | ~43 server actions | 285 ms, 20,300 buffers in all; learner RPCs 77 ms, 4,435 buffers after the draw fix | questions, time on screen |
| — one assistance check | every 5 s per open question | 1 | 1 | 1.2 ms | **time** |
| — one answer save | ~10 a sitting | 1 | 1 | 1.7 ms | — |
| — the start (draw) | once | 1 | 1 | 19 ms, 1,685 buffers (was 25 ms, 3,544) | — |
| /belajar (learner home) | every sign-in, after every lesson or sitting | 2 | 9 + 2N + F | ~20 ms per assignment (`my_cycle_state` 7.7 ms, `learner_lessons` 12.5 ms) | **N assignments over the year** |
| Lesson page turn | each page newly reached | 1 | 1 | small | — |
| Class roster (teacher) | teacher views | 2 | ~17 | 43 ms, 957 buffers (RLS per student) | class size |
| /pimpinan, dean/admin at the school root (26 classes) | management views, rare | 2 | 14 + K + 8C | **≈ 2.8 s, ≈ 690k buffers** (26 × 102 ms class figures + 158 ms school figures) | **classes, history** |
| **Konfigurasi, school admin** (landing page and every admin action's redirect) | every admin action | 2 | 26 + K | its audit-trail and enrolment reads: **before 2,469 ms, after 21 ms**; the five next-largest reads 20 ms (whole page not timed) | **the whole platform's history** (before) |
| Konfigurasi, platform admin | operator, rare | 2 | 26 + K | reads every school's enrolments, roles and nodes into the page | **every school** |
| Studio package page | authors, rare | 2 | ~19 + items÷100 | 5–10 ms per call | package size |
| Card creation for a class | admin, once per class | 3 per learner | 1 + Auth `createUser` per learner | serial by design (Auth's limits) | class size |

The browser does more than RPC tests suggest. Per learner sitting the real app made **78 Auth lookups against about 14**, and its whole-window database work was **285 ms against 89 ms** in the RPC journey. The difference is pages, prefetches, the Pemetaan Awal, and the proxy's check on every request.

## 4. Highest-cost / amplification findings

Ranked by total system cost: frequency × concurrency × unit cost × growth.

1. **The assistance check: time-driven, and its own Auth round trip.**
   - 23 per learner sitting, each a server action, an Auth check and a `assistance_state` call.
   - It runs whether or not the assessment offers help: `assistance_state` returns at once when `hesitation_window_seconds` is null, and the player is never told that.
   - It shares the tab's action queue with the saves.
   - 36% of all calls at 1,000 learners.
   - **WAITING FOR OWNER** (visible polling semantics; also the offline heartbeat).
2. **Auth on every request.**
   - `proxy.ts` calls `auth.getUser()` on every page, RSC prefetch, server action and API route; `currentViewer` calls it again on each render.
   - The database cost is ~0.1 ms, but each one is a network round trip.
   - Supabase's advisor notes Auth is capped at **10** database connections (absolute, not a percentage).
   - **WAITING FOR OWNER** (authentication boundary).
3. **Konfigurasi (school admin).**
   - Unnamed reads checked every audit row (6,160) and every enrolment (1,302) against the policy, one row at a time.
   - That was 2.47 s per view for those two reads, paid again after every admin action because actions redirect back to the page.
   - It grew with every school's history.
   - **FIXED** (§9).
4. **/pimpinan figures.**
   - Four class figures per class and four school figures, computed live (`metric_evaluate`) on every view and after every decision.
   - The class fan-out runs all classes in parallel, a burst of 100+ RPCs.
   - **WAITING FOR OWNER** (snapshots or caching change how fresh the figures are).
5. **/belajar per-assignment fan-out.**
   - Two RPCs per assignment.
   - Each re-runs `my_learning_assignments()` inside the database, and `learner_lessons` returns whole lesson bodies only to count progress.
   - Small now (N = 1–3 per learner); it grows through the school year.
   - **Recommend before scale** (one progress RPC; medium effort, learner-visible correctness to protect).
6. **Default prefetch on every learner link.**
   - About 19 of the 24 RSC requests per sitting were prefetches, each one paying the proxy's Auth check.
   - **WAITING FOR OWNER** (turning prefetch off trades away instant navigation).
7. **CI** (§8): about 20 stack boots per run (~56% of CI minutes); volume follows commits.

## 5. Database findings

- **Where the time went since 24 Sep** (1,415 s in all):

  | Source | Time |
  |---|---|
  | Learner assessment RPCs (mostly the load runs): saves | 120 s |
  | — assistance checks | 112 s |
  | — starts | 80 s |
  | — finishes | 43 s |
  | — papers | 34 s |
  | **Konfigurasi's audit-trail read** (438 calls, 156 ms each) | **68 s** |
  | Class rosters (988 calls, 43 ms) | 42 s |
  | Studio capability checks | 18 s |
  | PostgREST schema reloads after migrations (152 × 92 ms) | 14 s |
  | `pg_sleep`, my own diagnostic waits | 470 s |

  Everything else is small.
- **Per-row policy functions are the dominant cost pattern** where a read does not name its scope.
  - `has_scope()`, `enrollment_readable()` and `is_member_of_institution()` each run a few lookups per row.
  - Named reads (by school or class) use the indexes, and the policy then runs on few rows.
  - This is safe to exploit **only** where the name is a superset of what the policy allows. That is the case on Konfigurasi, verified from the policy definitions (§9).
- **Shared per-request lookups are cheap.** `my_profile` 0.9 ms, roles 0.2 ms, `evaluation_state` 0.4 ms, `current_person_id` 0.4 ms. ACCEPTABLE.
- **Advisor findings.** All LEAVE ALONE, because none sits on a measured hot path:
  - 167 unindexed foreign keys and 18 unused indexes (INFO);
  - one per-row `auth.uid()` policy on `accounts` (client reads of `accounts` are rare; helpers read it as definer);
  - two tables with two permissive policies (report templates; rare).
- **Locks and connections:** locks were not measured in this audit beyond the focused audit's MultiXact check (negligible). At 1,000 learners the pool ran out under CPU saturation (focused audit). At 50, 12–31 of 60 connections were in use.

## 6. Application / browser findings

- **Shell.**
  - Every signed-in page pays 2 Auth calls and 3 small reads; React `cache()` already dedupes the viewer and roles within a render.
  - The root layout's `evaluation_state` runs on every full render, anonymous pages included. It costs 0.4 ms. ACCEPTABLE.
- **Serial chains.**
  - Several pages run independent reads one after another: /belajar's last four RPCs, the certificate page, the report pages.
  - Each adds a round trip (~10–30 ms inside `sin1`). LOW benefit. LEAVE ALONE until a page is measured as slow to a person.
- **Double renders.** A Studio release step and a refused structure action re-render twice (`revalidatePath` + `router.refresh()`). Rare actions. LEAVE ALONE.
- **Discarded work.**
  - The certificate page reads `certificate_templates` and does not use the result.
  - While a certificate is pending, each visit makes a server-to-self HTTP hop.
  - Rare. LEAVE ALONE, and note it for the certificate journey's next change.
- **Certificate preparation after every formal finish.** About 3 calls, including failed and quick assessments, which are refused when not eligible. Once per sitting. LEAVE ALONE.
- **Media.** Each audio/video element is checked on the page and again by `/api/assets/read-url` (5 calls per element). Media is out of scope for the 5 Oct test (D-050); note it for when media is in scope.
- **Loops by design.**
  - Imports advance 25 rows per action.
  - Class card creation runs one learner at a time: one Auth `createUser` each, within Auth's limits.
  - ACCEPTABLE.

## 7. Authentication / security-boundary findings

- **78 Auth lookups per learner sitting**, measured. Of these, ~43 come from server actions (23 of them assistance checks), ~24 from RSC requests (mostly prefetches), and ~4 from pages and the viewer.
  - The database cost is negligible (~0.1 ms each).
  - The cost is latency on every request and load on an Auth server capped at 10 database connections.
- **Options, all for the owner:**
  - `getClaims()` (local JWT verification) in the proxy for reads, keeping `getUser()` where an action writes;
  - no Auth check on prefetches;
  - Auth's database connections set as a percentage.
- **Not touched.** No RLS, permission, sealing or evidence path was changed. The one change (§9) narrows a read the policy already narrows; the policy still decides.

## 8. Development infrastructure / CI findings

**What it cost.**

| | 18 Sep – 2 Oct (14 days) |
|---|---|
| CI runs | 201: 128 green, 24 failed, 49 cancelled |
| Billed minutes per CI run | ~115 green, ~108 failed, ~32 cancelled (33 jobs) |
| End-to-end audits | 94 runs (~29 billed minutes each) |
| Staging walks, load tests, facts | the rest (the 1,000 wave alone ≈ 460 billed minutes) |
| **Estimated billed minutes** | **≈ 23,000** (≈ 19,000 CI, ≈ 2,700 audits, ≈ 1,500 other), consistent with the ~$100 a fortnight observed at the $0.0052–0.0060 a minute the 28 Sep audit calibrated |

**1 Oct, measured by the new spend check** (run 36988704389): **3,368 billed minutes**. CI was 2,743 over 25 runs (11 cancelled, 4 failed) and the end-to-end audit 509 over 27 runs. At the calibrated rate that is about $18 for one day.

**Where a CI run's minutes go** (green run 36974602804):

| Part | Share |
|---|---|
| ~20 jobs each starting their own seeded local Supabase (2.5–2.9 min each) | **≈ 56%** |
| `npm ci` in every job | ≈ 8% |
| The checks themselves, including every planted red | the rest |

**What gives confidence (keep):**

- one CI run per finished change;
- every planted red;
- every migration check;
- one end-to-end audit per change that touches a journey;
- staging walks after a deploy;
- load tests with a question.

**What was duplicated or idle:**

- **The same commit tested twice:** 8 runs (6 after a green run on the same commit). ~4%.
- **Cancelled runs:** 49 (superseded heads). ~8%.
- **Intermediate heads dispatched** while iterating (1 Oct: 25 CI + 27 audits). These dispatches were mine, before D-091.
- **Load-test runners waiting for T0:** each shard waits for the common start after its own setup. Part of the 1,000 wave's ~460 billed minutes was that wait; the share was not measured.

**What can be consolidated safely** (the 28 Sep audit's S1–S5, still open):

| Fix | Effect |
|---|---|
| S1 fail fast | heavy jobs wait for lint/type/build |
| S2 group the static red cases | — |
| S3 cache dependencies | — |
| S4 share stacks between plants, each plant removed and its gate still red | the big one: up to ~half of the boots |
| S5 cache the browser | — |

**Why the earlier instruction did not hold:**

1. The 28 Sep audit fixed the process (W1–W3) but deferred every structural fix until after 5 Oct.
2. Each new gate added a red-case job with its own stack boot: 26 jobs and 88 minutes → 33 jobs and 115 minutes (+31% per run).
3. The recovery phase verified many small changes, each with CI + audit + walk. The instruction was a principle, and nothing counted.
4. Nothing made spend visible before the bill.

**The mechanical guard:**

- `actions-spend.yml` reads the previous day's billed minutes by workflow every morning and goes **red over budget** (600 a day unless the owner sets `ACTIONS_DAILY_MINUTES_BUDGET`).
- D-091 records the verification discipline: one CI per finished change, no re-test of a green commit, audits per change, load tests per question, a red day read before the next dispatch.

## 9. Safe changes implemented

**C1. Konfigurasi: a school administrator's enrolments and audit trail name their schools** (`src/app/konfigurasi/page.tsx`, `7fb8e3d`; EFF-K02).

- **Before** (as gs-001's administrator, staging, `EXPLAIN (ANALYZE, BUFFERS)`):

  | Read | Time | Buffers | Rows scanned | Rows shown |
  |---|---|---|---|---|
  | Audit trail | 1,979 ms | 99,543 | 6,160 (seq scan, policy per row) | 31 |
  | Enrolments | 490 ms | 30,722 | 1,302 (policy per row) | 0 |

- **Change.** When the viewer is not the platform administrator, both reads add `institution_id in (the schools they administer)`.
  - The policy is unchanged and still applies.
  - `has_scope('INSTITUTION_ADMIN', school)` holds only for a school the viewer administers at its root, and that set is contained in the named list. So the rows are the same.
  - The platform administrator's reads are unchanged.
- **After** (same viewer, same rows):

  | Read | Time | Buffers | Method |
  |---|---|---|---|
  | Audit trail | **15 ms** | **1,285** | index scan on `audit_log_institution_at_idx` |
  | Enrolments | **6 ms** | **652** | index scan on `enrollments_institution_idx` |

  **−99% each.** Together the two reads fall from 2,469 ms to 21 ms. The page's five next-largest reads measured 20 ms; the whole page was not timed. What a school admin's view no longer pays is about 2.4 s of database work, and the reads no longer grow with other schools.
- **Regression:**
  - EFF-K02, red → green with the change planted out;
  - typecheck and lint;
  - ⟨CI and the staging walk⟩.

**C2. The daily spend check** (`.github/workflows/actions-spend.yml`, `audit/ci/actions-spend.mjs`, `24b71d9`).

- **Before:** spend was seen only on the bill.
- **After:** a red/green line every morning, with the table by workflow. It is read-only and costs about 2 billed minutes a day.
- **First run** (36988704389, on 1 Oct): **red**, 3,368 minutes against 600, «ci» named as the biggest line. The green path is proven on a quiet day (run 36989065066, 26 Sep: within budget).

**C3. D-091:** the verification discipline above.

## 10. Items deliberately NOT changed

| Item | Why |
|---|---|
| Answer save (`record_answer`, digest, sealing checks) | Evidence integrity; 1.7 ms a save |
| Per-row RLS on rosters and learner reads | Tenant isolation; 43 ms per class view is acceptable at class sizes |
| The draw (beyond the focused audit's fix), finish grading, paper N+1 | Already weighed in the focused audit; still small |
| Shell lookups, `evaluation_state` banner | Sub-millisecond each |
| Serial independent reads on several pages | ~10–30 ms each; no person reported slowness |
| Studio double renders, certificate discarded read, certificate prepare after every formal finish | Rare or once per sitting |
| Card creation one learner at a time | Within Auth's limits on purpose |
| Unused indexes, unindexed foreign keys | No measured cost; dropping or adding indexes has write and maintenance cost |
| Platform admin's Konfigurasi reading every school | One operator, rare; a real fix is product design (pagination/search) |

## 11. Items waiting for owner

1. **The assistance check: event-driven, and silent where no help is configured** (A; also shortens the save tail). This is the single largest learner multiplier.
2. **Authentication per request** (B): `getClaims()` for reads, no Auth check on prefetches, Auth's database connections as a percentage.
3. **/pimpinan figures: snapshot or cache with a stated freshness** (2.8 s per school-root view, growing with classes and history).
4. **Prefetch on learner links** (each one pays an Auth check and a partial render).
5. **CI structural fixes S1–S5, and their timing** (after the human test), with every planted red still red.
6. **The Actions budget:** the daily figure for `ACTIONS_DAILY_MINUTES_BUDGET` (600 provisional). Optionally, a spending limit on the GitHub account, which only the owner can set.
7. **Konfigurasi for the platform administrator at many schools** (page size grows with the platform: pagination or search).

## 12. Infrastructure-bound findings

| Finding | Status |
|---|---|
| Micro's 2 shared cores | Saturate at 1,000 synchronized learners (D-089); CAP-08 before production |
| Auth's 10 database connections (absolute) | Will not grow with a larger instance unless set as a percentage (§11.2) |
| PostgREST's pool | Ran out at 1,000 under CPU saturation, not at 50 |
| Measuring from GitHub's US runners | Adds ~500 ms per server action against `sin1`; D-031's latency through the real app needs a measuring point near learners (focused audit) |

## 13. Effort-versus-reward table

| Finding | Frequency | Measured cost | Scaling | Benefit | Effort | Regression / security risk | Class | Action |
|---|---|---|---|---|---|---|---|---|
| Konfigurasi unnamed reads (school admin) | every admin view and action | 2.47 s DB per view (two reads) | whole platform's history | high | low (2 filters) | low (policy unchanged, same rows) | 1 Genuine inefficiency | **FIXED** |
| Spend invisible until the bill | daily | ~$100 a fortnight unseen | with commits | high | low | none (read-only) | 1 Genuine inefficiency (process) | **FIXED** (guard + D-091) |
| Assistance check | 23 per sitting, every learner | 30% of learner RPC time; 23 Auth; save queue | time × learners | high | medium | product behaviour | 3 Architecture scaling | **WAITING OWNER** |
| Auth per request | every request | 78 round trips per sitting | requests × learners | high | medium | security boundary | 2 Optimisation opportunity | **WAITING OWNER** |
| /pimpinan live figures | rare, management | 2.8 s DB per school view | classes × history | medium | high (snapshots) | evidence freshness | 3 Architecture scaling | **WAITING OWNER** |
| /belajar fan-out | every learner, often | ~20 ms DB + lesson bodies per assignment | assignments over the year | medium now, high later | medium | learner correctness | 3 Architecture scaling | **RECOMMEND before scale** |
| Learner link prefetch | every page | ~19 extra requests per sitting | links | medium | low | perceived speed | 2 Optimisation opportunity | **WAITING OWNER** |
| CI stack boots | every CI run | ~56% of CI minutes | gates added | high | high (gate machinery) | security gates must stay red | 1 Genuine inefficiency | **WAITING OWNER** (timing) |
| CI duplicates / cancelled | per change | ~4% / ~8% of CI | commits | medium | low (discipline) | none | 1 Genuine inefficiency | **FIXED** (D-091) |
| Load-test runners waiting for T0 | per load test | part of a wave's ~460 minutes (share not measured) | shards | low | low | none | 5 Test-harness artefact | **LEAVE ALONE** (size `start_in` to the setup next run) |
| Class roster RLS per row | teacher views | 43 ms | class size | low | high | tenant isolation | 6 Acceptable | **LEAVE ALONE** |
| Answer-save integrity work | every save | 1.7 ms | — | low | — | evidence integrity | 6 Acceptable | **LEAVE ALONE** |
| Advisor INFO items | — | not on hot paths | — | low | low–medium | write cost | 6 Acceptable | **LEAVE ALONE** |
| Platform admin Konfigurasi | operator | O(platform) page | schools | low now | medium (UI) | none | 3 Architecture scaling | **WAITING OWNER** |

## 14. Overall PINTAR efficiency assessment

- **Disproportionate sources of waste.**
  - One, Konfigurasi, is removed.
  - The assistance check and per-request Auth are the remaining large multipliers. Both are owner decisions by the rules of this audit.
- **Unnecessary work in normal journeys.**
  - **Little** in the database once scopes are named.
  - **Some** in the request layer: the poll runs where no help is configured, there are prefetches on every link, and Auth runs on every request.
- **Scaling multipliers to remove before production.**
  1. the assistance check (time × learners);
  2. /belajar's per-assignment fan-out (grows through the year);
  3. /pimpinan's live figures (classes × history);
  4. (done) Konfigurasi's cross-school scans.
- **Are the remaining expensive operations legitimate?**
  - Yes: the evidence chain on saves, RLS per row on rosters, card creation, and the draw (already tuned).
- **Is infrastructure spending buying useful capacity or confidence?**
  - Supabase Micro buys enough for 50 at once (proven) and not for 1,000 (D-089). That is a decision the owner has already put before production (CAP-08), not waste.
- **Is development infrastructure spending proportionate?**
  - **Not yet.** The checks buy real confidence (every planted red, every migration check), but about half of each CI run is repeated setup, and volume followed commits.
  - The guard and D-091 stop the silent part now; S1–S5 remove the structural part when the owner sets the time.

## 15. ONE NEXT ACTION

**The owner rules on the assistance check:** whether the player asks event-driven (asking again when the server says help would become due, rather than every 5 s), and stops asking where the assessment offers no help.

It is the largest remaining multiplier in the busiest journey. Per learner sitting it is:

- 23 of ~43 server actions;
- 23 of 78 Auth lookups;
- 30% of the learner's RPC database time;
- the queue that saves wait behind.

It cannot be changed without that ruling.
