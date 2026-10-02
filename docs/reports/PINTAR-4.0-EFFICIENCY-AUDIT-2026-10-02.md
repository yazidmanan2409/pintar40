# PINTAR 4.0 — Focused architecture & code efficiency audit (2 Oct 2026)

**Scope.** One learner's Uji Penguasaan, end to end, on staging (Supabase Micro: 2 shared cores, 1 GB, 60 connections; Vercel functions in `sin1`, the same region as the database). The evidence is the L1 run at 1,000 learners (run 36964437916, ruled in D-089), the 50-learner RPC wave before any change (run 36969517374), read-only database forensics (pg_stat_statements, EXPLAIN (ANALYZE, BUFFERS), PostgREST logs), and the real app in Chromium: two 4-learner trials and the 50-learner proof described in §9. No compute change. No authentication change. No 1,000-learner wave.

⟨§1 is written last, from §9–§10⟩

## 1. Executive verdict

⟨pending: the browser 50 and the RPC after-run⟩

## 2. One-student workload map

A learner opens /belajar, opens the chapter, opens «Uji Penguasaan», presses «Mulai», answers 8 questions (thinking 5–15 s each, one in five changes an answer) and hands in.

| Step | Real app (browser trial 2, run 36977915457, per learner) | Database work (RPC wave at 50, run 36969517374, per learner, from pg_stat_statements) |
|---|---|---|
| Pages | 2 document loads, about 14 RSC fetches (navigations and link prefetches), 1 other | — (the RPC harness renders no page) |
| Start | 1 server action («Mulai»): draws the paper | `start_learning_session` 25.2 ms, 3,544 buffers: **the single largest cost, 28% of the learner's time and 46% of its buffers** |
| The paper | read inside the page render | `session_paper` 5 ms |
| Each question shown | 1 server action `noteView` | `note_item_view` 8 ms over 8 calls |
| Help due? | 1 server action every 5 s while a question is on screen | `assistance_state` 24 ms over about 20 calls |
| Each save | 1 server action per «Simpan jawaban ini» (about 9–10) | `record_answer` 18 ms over about 10 calls |
| Hand in | 1 server action, then the result page | `finish_my_session` 6 ms, `session_outcome` |
| Authentication | `proxy.ts` asks Auth for the user on **every** request (pages, RSC, actions): about 45–55 Auth checks per learner | 1 per RPC in the harness (about 14) |
| **Total** | about 30 completed server actions (another 13 per learner were cancelled by the browser itself: see §4, F11), 14 RSC, 2 pages | **about 89 ms and 7,700 buffers of database time per learner** |

The learner's sitting lasts about 2 minutes. At 50 learners that is about 4.5 s of database time spread over 150 s; at 1,000 it is about 89 s. Most of that time is spent in the first seconds, when everyone presses «Mulai» together.

## 3. Amplification map

| | 1 learner | 10 learners (run 36963146820) | 50 learners, RPC (run 36969517374) | 50 learners, real app (§9) | 1,000 learners, RPC (run 36964437916) |
|---|---|---|---|---|---|
| Calls (harness) | about 55 | 558 | 2,755 | ⟨pending⟩ | 54,812 |
| Peak requests/s | — | — | 26.6 | ⟨pending⟩ | 184 |
| Database CPU, peak | idle | 3% | 18% | ⟨pending⟩ | **98%** |
| Backends | 24 | 25 | 16 | ⟨pending⟩ | 34 |
| Starts in the first minute | 1 | 10 | 50 | 50 | 1,000 (about 25 s of database work in a burst, on 2 shared cores) |
| Assistance checks | about 20 | about 200 | about 1,000 | ⟨pending⟩ | 20,002 (36% of all calls) |
| Save p95 | — | 819 ms | 327 ms | ⟨pending⟩ | **11,664 ms** |
| Server errors | — | 0 | 0 | ⟨pending⟩ | 73 (0.133%), pool exhausted (PGRST003) |

What grows with N is linear per learner, so the database's work grows linearly. **Synchronisation** is what turns it into a cliff. Every start lands in the same minute, every poll keeps landing every 5 s, and on 2 shared cores the queue builds once the work arriving per second exceeds what the cores can do. Past that point each call waits behind the others: at 1,000, save p50 was 5.7 s against 0.27 s at 50. The polls that wait still fire on their timer, and the pool (60 connections, PostgREST's share smaller) runs out.

## 4. Top material findings

| # | Finding | Class | Evidence | Outcome |
|---|---|---|---|---|
| F1 | The paper draw asked "does this definition follow cycle roles?" once **per candidate question**, and each answer scanned all marked items on the platform (an OR across a three-way join, which no index can serve) | **1 Genuine inefficiency** | EXPLAIN: 31 calls for one Uji Penguasaan read 3,336 buffers; the start read about 3,540 in all, 46% of a learner's buffers. The cost grew with every chapter any school imports | **Fixed** (§7) |
| F2 | The assistance check is **time-driven**: one server action every 5 s per open question. Before the 25 s hesitation window it can only say "not yet", and after the question is answered it is still asked | **3 Architecture scaling issue** | 36% of all calls at 1,000. Per learner about 20 checks. In the measured journey no learner stays 25 s on a question (think 5–15 s, a change 2–5 s), so every one of them answered "not yet" | **Waiting for owner** (§5, §8) |
| F3 | Server actions from one tab run one after another (Next's queue). A bare 5 s timer whose answer takes longer than 5 s **queues checks behind each other, and the learner's saves wait behind the queue** | **1 Genuine inefficiency** (shows only under load) | At 1,000 the check's p50 was 5.6 s against its 5 s timer; save p50 was 5.7 s | **Fixed** (§7, `tanyaBerkala`) |
| F4 | `proxy.ts` calls `supabase.auth.getUser()` (a round trip to Auth) on **every** request, including every server action and every RSC prefetch | **2 Optimisation opportunity** in an authentication boundary | About 45–55 Auth checks per learner in the real app, against about 14 in the RPC harness | **Waiting for owner**: authentication is not changed (standing instruction) |
| F5 | `record_answer` re-reads the session and the presented item and hashes twice (SHA-256) per save | **6 Acceptable / do not change** | 1.8 ms per save at 50. This is the evidence-integrity chain (sealing, the per-answer digest) | Kept |
| F6 | `finish_my_session` grades item by item | **2 Optimisation opportunity**, small | 6 ms per learner at 50, once per sitting | Not changed: no measurable gain at 50 |
| F7 | `session_paper` reads the paper with one query per item (N+1) | **2 Optimisation opportunity**, small | 5 ms per learner at 50 | Not changed |
| F8 | The draw builds a temporary table per start (DDL per call) | **2 Optimisation opportunity** | Catalogue churn per start, part of what start still costs after C1 | Not changed: rewriting the draw touches D-008's randomisation; owner's call if starts still matter after CAP-08 |
| F9 | Contention on foreign-key KEY SHARE locks between saves | **Not supported** | MultiXact activity negligible during the 1,000 wave | — |
| F10 | RLS cost in the draw | **Moot** | The draw runs as a definer whose role bypasses RLS; the learner-facing check is done before it | — |
| F11 | The harnesses are not the app | **5 Test-harness artefacts** | The RPC harness's polls wait for each other (closed loop) where the app's timer did not; it makes about 14 Auth checks where the app makes about 50; it renders no page; it starts the Uji Penguasaan without the Pemetaan Awal the app requires; it does not resend a failed save the way the outbox does. The browser harness runs from GitHub's US runners against `sin1`: **a server action costs about 770 ms at idle from there** (aksi p50 773 ms at 4 learners, database CPU 3%), against about 270 ms per call through the RPC harness. The browser also cancels some requests itself (ERR_ABORTED: about 9 RSC and 13 server actions per learner in trial 2). These are not server answers and are reported apart | Documented, not tuned to |
| F12 | Micro has 2 shared cores and 60 connections | **4 Infrastructure limit** | CPU 98% at 1,000, pool exhausted. 18% at 50 (RPC) | CAP-08: owner, before production (D-089(c)) |

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
| On staging at 50, real app | — | ⟨pending: assistance calls per learner from pg_stat_statements⟩ |

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

⟨pending⟩

## 10. Capacity interpretation

⟨pending⟩

## 11. Recommendation (one next action)

⟨pending⟩
