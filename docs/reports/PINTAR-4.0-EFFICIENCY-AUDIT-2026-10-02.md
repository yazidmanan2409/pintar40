# PINTAR 4.0 — Focused architecture & code efficiency audit (2 Oct 2026)

**Scope.** One learner's Uji Penguasaan, end to end, on staging (Supabase Micro: 2 shared cores, 1 GB, 60 connections; Vercel functions in `sin1`, the same region as the database). The evidence is the L1 run at 1,000 learners (run 36964437916, ruled in D-089), the 50-learner RPC wave before any change (run 36969517374), read-only database forensics (pg_stat_statements, EXPLAIN (ANALYZE, BUFFERS), PostgREST logs), and the real app in Chromium: two 4-learner trials and the 50-learner proof described in §9. No compute change. No authentication change. No 1,000-learner wave.

⟨§1 is written last, from §9–§10⟩

## 1. Executive verdict

⟨pending: the browser 50 and the RPC after-run⟩

## 2. One-student workload map

A learner opens /belajar, opens the chapter, opens «Uji Penguasaan», presses «Mulai», answers 8 questions (thinking 5–15 s each, one in five changes an answer) and hands in.

| Step | Real app (browser 50, run 36979562623, per learner; database calls from pg_stat_statements) | Database work (RPC wave at 50, run 36969517374, per learner, from pg_stat_statements) |
|---|---|---|
| Pages | 2 document loads; 14.6 RSC fetches answered and 9.2 more cancelled by the browser (navigations and link prefetches); 1 certificate check on the result page | — (the RPC harness renders no page) |
| Start | 1 server action («Mulai»): draws the paper | `start_learning_session` 25.2 ms, 3,544 buffers: **the single largest cost, 28% of the learner's time and 46% of its buffers** |
| The paper | read inside the page render | `session_paper` 5 ms |
| Each question shown | 1 server action `noteView`: 8.0 calls | `note_item_view` 8 ms over 8 calls |
| Help due? | 1 server action every 5 s while a question is on screen: 22.8 calls, 1.4 ms each in the database | `assistance_state` 24 ms over about 20 calls |
| Each save | 1 server action per «Simpan jawaban ini»: 9.4 saves | `record_answer` 18 ms over about 10 calls |
| Hand in | 1 server action, then the result page | `finish_my_session` 6 ms, `session_outcome` |
| Authentication | `proxy.ts` asks Auth for the user on **every** request (pages, RSC, actions): **78 Auth lookups per learner** (3,878 for 50, a few of them from SETUP), each about 0.1 ms in the database | 1 per RPC in the harness (about 14) |
| **Total** | 43.5 server actions started (33.4 answered, 10.1 cancelled by the browser after the server had done the work: §4, F11), 24 RSC fetches, 2 pages. All the database's work in the window: **285 ms and 20,300 buffers per learner**, including the Pemetaan Awal each learner sat in SETUP and the page renders | **about 89 ms and 7,700 buffers of database time per learner** (the learner RPCs only) |

The learner's sitting lasts about 2 minutes. At 50 learners that is about 4.5 s of database time spread over 150 s; at 1,000 it is about 89 s. Most of that time is spent in the first seconds, when everyone presses «Mulai» together.

## 3. Amplification map

| | 1 learner | 10 learners (run 36963146820) | 50 learners, RPC (run 36969517374) | 50 learners, real app (§9) | 1,000 learners, RPC (run 36964437916) |
|---|---|---|---|---|---|
| Calls (harness) | about 55 | 558 | 2,755 | 3,172 timed requests and steps | 54,812 |
| Peak requests/s | — | — | 26.6 | 34.0 | 184 |
| Database CPU, peak | idle | 3% | 18% | 15% | **98%** |
| Backends | 24 | 25 | 16 | 31 (24 before) | 34 |
| Starts in the first minute | 1 | 10 | 50 | 50 | 1,000 (about 25 s of database work in a burst, on 2 shared cores) |
| Assistance checks | about 20 | about 200 | about 1,000 | 1,140 | 20,002 (36% of all calls) |
| Save p95 | — | 819 ms | 327 ms | 1,366 ms (from the press to «Tersimpan», through the Next.js server) | **11,664 ms** |
| Server errors | — | 0 | 0 | 0 (no 5xx in Supabase's request log, no pool timeout) | 73 (0.133%), pool exhausted (PGRST003) |

What grows with N is linear per learner, so the database's work grows linearly. **Synchronisation** is what turns it into a cliff. Every start lands in the same minute, every poll keeps landing every 5 s, and on 2 shared cores the queue builds once the work arriving per second exceeds what the cores can do. Past that point each call waits behind the others: at 1,000, save p50 was 5.7 s against 0.27 s at 50. The polls that wait still fire on their timer, and the pool (60 connections, PostgREST's share smaller) runs out.

## 4. Top material findings

| # | Finding | Class | Evidence | Outcome |
|---|---|---|---|---|
| F1 | The paper draw asked "does this definition follow cycle roles?" once **per candidate question**, and each answer scanned all marked items on the platform (an OR across a three-way join, which no index can serve) | **1 Genuine inefficiency** | EXPLAIN: 31 calls for one Uji Penguasaan read 3,336 buffers; the start read about 3,540 in all, 46% of a learner's buffers. The cost grew with every chapter any school imports | **Fixed** (§7) |
| F2 | The assistance check is **time-driven**: one server action every 5 s per open question. Before the 25 s hesitation window it can only say "not yet", and after the question is answered it is still asked | **3 Architecture scaling issue** | 36% of all calls at 1,000. Per learner about 20 checks. In the measured journey no learner stays 25 s on a question (think 5–15 s, a change 2–5 s), so every one of them answered "not yet" | **Waiting for owner** (§5, §8) |
| F3 | Server actions from one tab run one after another (Next's queue). A bare 5 s timer whose answer takes longer than 5 s **queues checks behind each other, and the learner's saves wait behind the queue** | **1 Genuine inefficiency** (shows only under load) | At 1,000 the check's p50 was 5.6 s against its 5 s timer; save p50 was 5.7 s | **Fixed** (§7, `tanyaBerkala`) |
| F4 | `proxy.ts` calls `supabase.auth.getUser()` (a round trip to Auth) on **every** request, including every server action and every RSC prefetch | **2 Optimisation opportunity** in an authentication boundary | Measured at 50 in the real app: 78 Auth lookups per learner (about 0.1 ms each in the database, so the cost is a network round trip on every request, not database time), against about 14 in the RPC harness | **Waiting for owner**: authentication is not changed (standing instruction) |
| F5 | `record_answer` re-reads the session and the presented item and hashes twice (SHA-256) per save | **6 Acceptable / do not change** | 1.8 ms per save at 50. This is the evidence-integrity chain (sealing, the per-answer digest) | Kept |
| F6 | `finish_my_session` grades item by item | **2 Optimisation opportunity**, small | 6 ms per learner at 50, once per sitting | Not changed: no measurable gain at 50 |
| F7 | `session_paper` reads the paper with one query per item (N+1) | **2 Optimisation opportunity**, small | 5 ms per learner at 50 | Not changed |
| F8 | The draw builds a temporary table per start (DDL per call) | **2 Optimisation opportunity** | Catalogue churn per start, part of what start still costs after C1 | Not changed: rewriting the draw touches D-008's randomisation; owner's call if starts still matter after CAP-08 |
| F9 | Contention on foreign-key KEY SHARE locks between saves | **Not supported** | MultiXact activity negligible during the 1,000 wave | — |
| F10 | RLS cost in the draw | **Moot** | The draw runs as a definer whose role bypasses RLS; the learner-facing check is done before it | — |
| F11 | The harnesses are not the app | **5 Test-harness artefacts** | The RPC harness's polls wait for each other (closed loop) where the app's timer did not; it makes about 14 Auth checks where the app makes about 50; it renders no page; it starts the Uji Penguasaan without the Pemetaan Awal the app requires; it does not resend a failed save the way the outbox does. The browser harness runs from GitHub's US runners against `sin1`: **a server action costs about 770 ms at idle from there** (aksi p50 773 ms at 4 learners, database CPU 3%), against about 270 ms per call through the RPC harness. The browser also cancels some requests itself (ERR_ABORTED). At 50: 462 RSC fetches and 505 server actions, about 9 and 10 per learner. These are not server answers and are reported apart. Cross-check: the server actions that reached the database per learner (1 start, 8 noteView, 22.8 checks, 9.4 saves, 1 hand-in: about 42) match the actions the browser started (33.4 answered + 10.1 cancelled = 43.5). The cancelled ones were executed; only their responses were cut off, so the per-call table for server actions lacks about a quarter of them. Saves are timed separately, from the press to «Tersimpan» | Documented, not tuned to |
| F13 | A check that lands just after the hand-in is refused (`SESSION_FINALIZED`) | **1 Genuine inefficiency**, negligible | At 50: 8 of 1,140 checks (0.7%), refused by the database as designed. A refused check sets the player's offline label, but the page is already moving to the result; no learner-visible effect was observed | Left alone (D-090: 8 calls of about 1 ms per 50 learners) |
| F14 | The result page's certificate check is refused for every learner of the synthetic school (`certificate_prepare`: "evidence is not OFFICIAL and can never reach ELIGIBLE", INV-20) | **5 Test-harness artefact** (a synthetic school), by design | 49 refusals (HTTP 400) at 50. In a real school the same call prepares the certificate once the learner is eligible | Kept |
| F12 | Micro has 2 shared cores and 60 connections | **4 Infrastructure limit** | CPU 98% at 1,000, pool exhausted. 18% at 50 (RPC), 15% at 50 (real app) | CAP-08: owner, before production (D-089(c)) |

## 5. The assistance check

**What it does.** While a question is on screen, the player asks the server every 5 s whether help is due (`assistance_state`). The server, whose clock started when it first issued the question, answers "not yet" until the hesitation window (25 s on this chapter) has passed. After that it answers with the level of help on offer. The client never decides when help is due (§6 of the player's contract).

**Why it costs what it costs.** The check is cheap on its own: about 1.2 ms of database time and about 60 buffers per call. But it is **time-driven**, not event-driven:

- (a) For the first 25 s on a question, every answer is "not yet": up to 5 calls per question that cannot carry news. In the measured journey that was every call.
- (b) After the learner has answered, the check keeps going while the question stays on screen.
- (c) At 1,000 learners it was 20,002 of 54,812 calls (36%).
- (d) It runs as a server action, so it shares the tab's single action queue with the learner's saves.

**The poll is load-bearing for more than help.**

- It is the player's heartbeat: a failed check turns on the offline badge.
- It moves «Bantuan lagi» to the next level.
- It brings dismissed help back within 5 s.

So "ask less often" or "stop after the question is answered" changes what a learner sees and when. The brief rules that out ("Do NOT simply reduce its frequency"), and the change authority puts it beyond me (polling semantics visible to users).

**What was changed (safe, §7).** No change to frequency, to what is asked, or to what is shown. The player now never has two checks in flight (`tanyaBerkala`): a tick that finds the previous check still waiting is skipped. When the server answers within 5 s, which is every case measured at 50, nothing changes: one check per tick. Under saturation the checks no longer queue up, and the learner's saves no longer wait behind a queue of them.

**What is waiting for owner (§8).** An event-driven check. The server returns, with "not yet", the instant at which help would become due; the player asks again at that instant (and at the 5 s heartbeat only if the owner keeps the heartbeat). The server still decides; the client only learns when to ask. Expected effect, from the counts above: roughly 4 of every 5 checks before the window disappear. This changes the polling semantics and the player's contract text, so it is the owner's decision.

## 6. Database findings

- **Where the time goes at 50 (RPC, per learner, 89 ms):**

  | Part | Time | Share |
  |---|---|---|
  | start | 25 ms | 28% |
  | assistance | 24 ms | 27% |
  | saves | 18 ms | 20% |
  | noteView | 8 ms | — |
  | finish | 6 ms | — |
  | paper | 5 ms | — |

- **The draw (F1)** was the one avoidable cost that grew with the platform's content rather than with the learner. It is fixed (§7).
- **Saves (F5)** are dominated by the evidence chain: digest, sealing checks and the idempotent client_seq key. Kept by design.
- **Locks and contention:**
  - MultiXact (FK KEY SHARE) activity was negligible (F9).
  - The 1,000 wave's failures were pool timeouts (PGRST003) while the CPU was at 98%.
- **Connections:**
  - 60 on Micro.
  - Backends peaked at 34 at 1,000 and 16 at 50.
  - The pool that ran out at 1,000 is PostgREST's own, which is smaller than 60. My reading, not proven: each call held its connection longer as the CPU saturated.
- **RLS (F10)** is not on the hot path of the draw.
- **Not reconciled:** at 1,000, PostgREST logged 437 lines of 504 while the harness saw 73 server errors. Part of those lines are stamped 27 Sep.

## 7. Safe changes implemented, before → after

Both meet all eight conditions of the brief:

1. a demonstrated inefficiency;
2. product behaviour unchanged;
3. no frozen decision changed;
4. security, tenant and evidence boundaries unchanged;
5. simpler or as clear;
6. the journeys regression-walked;
7. CI green;
8. measured before and after.

**C1. The draw reads its marks by index** (migration `20261109100000_the_draw_reads_its_marks_by_index.sql`; main `6d2412d`; staging migrated, 146 migrations).

- **What changed:** the `definition_follows_cycle_roles` body.
- **Same answer:** the migration compares the new body with the old for every definition and refuses to apply if one differs. On staging, 56 definitions compared, all identical.
- **Same shape:** same volatility, the pinned `search_path`, no client execute.

| Measure | Before | After |
|---|---|---|
| 31 calls for one Uji Penguasaan (the candidates), inside the function | 3,336 buffers | 1,495 buffers (**−55%**; the inline query reads 464, −86%, but a SQL function with its own `SET search_path` is not inlined) |
| `eligible_items_for_definition` for that definition | 4,106 buffers | 2,265 buffers (**−45%**) |
| `start_learning_session` per call, RPC wave at 50 | 25.2 ms, 3,544 buffers (run 36969517374) | ⟨pending: the RPC after-run⟩ |

**C2. One assistance check at a time** (`src/lib/tanya-berkala.ts`, used by `ItemPlayer.tsx`; main `6d2412d`). It adds no new check, and changes neither the frequency nor what is shown.

| Measure (EFF-K01, executed in CI) | Bare timer (before) | tanyaBerkala (after) |
|---|---|---|
| Slow answer (130 ms against a 40 ms tick, 700 ms) | 18 asks, 4 in flight at once | 5 asks, at most 1 in flight |
| Fast answer (2 ms against a 40 ms tick, 420 ms) | 11 asks | 11 asks (unchanged) |
| After stop | — | no further ask |
| On staging at 50, real app (browser 50) | — (the app with a bare timer was never run at 50 in a browser) | 22.8 checks per learner over a sitting of about 2 minutes: one per 5 s tick, as expected when answers come back within 5 s |

At the load where C2 matters (checks slower than 5 s) its before/after cannot be measured on staging without the 1,000 wave, which the brief and D-089 rule out. At 50 the checks answer in well under 5 s, so C2 is expected to be inert there, and the measure is that it stays inert.

**Regression:**

- CI 36973250707 green.
- Environment facts green.
- Staging walk 010 on `6d2412d`: 20 PASS, 1 NOTE, 1 NOT RUN, 0 5xx.
- The two browser trials and the browser 50: every learner sat, saved and handed in, read back clean.

**Note for the owner.** D-089(b) kept the assistance check unchanged so that a later 1,000 run stays comparable with 36964437916. The audit's change authority came after D-089. C1 and C2 now sit between that run and any rerun. If the owner wants a rerun that isolates compute alone, both can be reverted for that run (each is one file).

## 8. Items waiting for owner

1. **Event-driven assistance check** (§5). It changes polling semantics and the player's contract text.
2. **Auth check on every request** (F4). `proxy.ts` asks Auth for the user on every page, RSC and action, about 50 times a sitting. Candidates: skip it for RSC prefetches, or trust a verified JWT locally (`getClaims`) on the proxy and keep `getUser` where an action writes. **Authentication: not changed by me.**
3. **CAP-08** (F12), the compute tier before production, on capacity testing (D-089(c)).
4. **The draw's temporary table** (F8). Rewriting it touches D-008's randomisation.
5. **Comparability of a future 1,000 run** (§7 note).
6. **A measurement point near the learners.** D-031's 1 s save p95 is judged from GitHub's US runners, which add about 500 ms per server action against `sin1` at idle. A runner in or near Singapore/Malaysia would measure what a Malaysian learner sees. Choosing and paying for one is the owner's call.

## 9. 50-student Micro result

Staging on Micro, unchanged compute. 50 synthetic learners at once, each sitting the same Uji Penguasaan through the **real app in Chromium** (run 36979562623, 10 runners × 5 learners, after two 4-learner trials):

- pages, server actions, the player's own 5 s timer and its outbox;
- each learner's Pemetaan Awal sat beforehand, as the app requires;
- think time 5–15 s per question; one learner in five changes an answer; one in ten loses the network for 2 s before a save.

| D-031 criterion | Measured at 50 | Met |
|---|---|---|
| Every learner sat and finished | 50 started, 50 handed in | yes |
| No answer lost | 472 answers shown «Tersimpan», 472 stored | yes |
| No answer duplicated | 0 | yes |
| Every finished sitting has its result | 50 of 50 | yes |
| Server errors under 0.1% | 0 of 3,172; no 5xx in Supabase's request log; no pool timeout | yes |
| Answer save p95 under 1 s | **1,366 ms** (p50 826, p99 1,837) | **no** |
| Answer save p99 under 3 s | 1,837 ms | yes |
| Back at baseline within 10 minutes | 25 s | yes |

Other measurements:

- **Network loss:** the 8 learners who lost the network had their answer delivered by the outbox when it came back (p50 802 ms after reconnection).
- **Database:** CPU 1% → 15% at peak; backends 24 → 31 of 60; peak 34 requests/s.
- **Independent read-back** (read-only SQL on staging, outside the harness): the sittings started in the wave window are 50 Uji Penguasaan, all FINALIZED, with 400 questions answered (8 × 50), 472 stored answers, 0 duplicate keys, and 50 results.
- **Latency is the same at 4 learners and at 50.**

| | 4 learners (run 36977915457) | 50 learners (run 36979562623) |
|---|---|---|
| Save p50 / p95 / p99 | 836 / 1,830 / 2,331 ms (35 saves) | 826 / 1,366 / 1,837 ms (464 saves) |
| Any server action, p50 / p95 | 773 / 1,380 ms | 750 / 1,066 ms |
| Database CPU, peak | 3% | 15% |

The same journey through the RPC harness at 50 (run 36969517374, before the changes): D-031 met, save p95 327 ms. The difference between the two harnesses is the request path, not the database:

- The real app's saves travel from GitHub's US runners to the Next.js server in `sin1`.
- On the way they pass the proxy's Auth check and the server action.
- They then wait their turn in the tab's action queue.

⟨pending: the RPC after-run at 50⟩

## 10. Capacity interpretation

⟨pending⟩

## 11. Recommendation (one next action)

⟨pending⟩
