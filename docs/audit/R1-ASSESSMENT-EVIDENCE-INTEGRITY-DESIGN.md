# R1 — Assessment evidence integrity · repair DESIGN (not implemented)

**Status: DESIGN FOR SAURON'S REVIEW. No implementation exists.** Scope: F-07
(reload/replay sequence continuity), F-08 (finalization with pending or failed
synchronization), and the adjacent response-durability behaviour needed for the
same guarantee. R2–R5, F05-S01/F06-S07, production, bootstrap and §3c are
untouched. F-03 remains a separate ledger item and is not part of R1.

Source basis: `src/app/belajar/_components/ItemPlayer.tsx`,
`PermukaanAsesmen.tsx`, `src/app/belajar/actions.ts`,
`src/lib/assessment-engine/index.ts`; latest definitions of `record_answer`
(`20260914094500`), `submit_response` (`20260912140823`), `session_answers`,
`may_continue_session`, `pause_session`, `resume_session`,
`session_enforce_deadline` (`20260913090000`), `submit_session`
(`20260913094000`), `finish_my_session`, `finalize_session`, `evaluate_session`
(`20260913091500`), `session_final_responses`, `terminate_session`,
`extend_session_deadline` (`20260914094500`). Runtime evidence: ledger F-07/F-08
(runs `35825636265`, `35826152921`).

---

## 1. The invariant (as ruled), made testable

> **I-R1.** An assessment may never become final while learner response evidence
> that PINTAR has accepted locally as pending submission remains unresolved, and
> recovery/reload may never cause a later learner response to be rejected merely
> because client sequencing state was reconstructed incorrectly.

Decomposed into checkable clauses:

| id | clause | owner of the check |
|---|---|---|
| I-R1.1 | Every learner answer the client has shown as taken ("saved" or "pending") is held durably until the server resolves it. | client |
| I-R1.2 | A pending entry is **resolved** only by (a) a server receipt for that exact (presented item, client_seq, value) — RECORDED or ACKNOWLEDGED — or (b) a **terminal** server refusal from a closed list — session TERMINATED; session belongs to someone else; session already final (finalized from another tab or device) — each **shown to the learner** as not counted. Nothing else resolves it. | server decides; client obeys |
| I-R1.3 | The next `client_seq` for a presented item is strictly greater than every seq the server holds for it **and** every seq still in the client's outbox for it, in every page lifecycle (first load, reload, reconnect, second tab). | client, checked by server |
| I-R1.4 | A conflicting-receipt refusal ("receipt already carries a different answer") is never treated as terminal or as offline: it means the client's numbering was wrong, and the answer is re-sent under a correct seq. | client |
| I-R1.5 | `finalize` succeeds only when the server holds a receipt for every pending entry the finishing client declares, or the late-sync window has closed. | server |
| I-R1.6 | A response the server records as scorable (`is_final = true`) is counted by the result, or it is not scorable. No response is "scorable but never scored". | server |

---

## 2. Response lifecycle map (as built)

```
learner choice ─▶ send(): seq := seqs.current[item] + 1 ─▶ outbox[item:seq] (localStorage, whole-object RMW)
                                   │
                                   ▼
              server action submitAnswer ─▶ record_answer ─▶ submit_response
                                   │              │               │
                                   │   deadline/grace/continue    INSERT … ON CONFLICT (presented_item, client_seq) DO NOTHING
                                   │   decides LIVE/REPLAYED/     ├─ new            → RECORDED
                                   │   LATE_SYNC + scorable       ├─ same digest    → ACKNOWLEDGED
                                   │                              └─ other digest   → EXCEPTION (conflict)
                                   ▼
        {ok:true}  → delete outbox entry, accepted[item] := value, online := true
        {ok:false} → online := false (banner "Sedang luring"), entry kept          ← every refusal looks like "offline"
        throw      → unhandled; entry kept

mount / "online" event ─▶ flush(): for each outbox entry, submitAnswer(…,"REPLAYED")
                          stop at first {ok:false}; throw propagates
Finish button ─▶ await flush() ─▶ finishSession ─▶ finish_my_session ─▶ submit_session ─▶ finalize_session
                 (no check that the outbox drained)
```

**Authoritative answer per item (scoring):** `session_final_responses` = the
highest `client_seq` among `is_final` receipts. So `client_seq` is not only an
idempotency key; it is the **ordering authority** for which answer counts.

### 2.1 Where sequence state is created or reconstructed

| # | site | source | defect |
|---|---|---|---|
| S-1 | `PermukaanAsesmen` (SSR) `seqs[item] = max(client_seq)` from `session_answers` | server, at render time | taken **before** the client replays its outbox |
| S-2 | `ItemPlayer` `seqs = useRef({...props.seqs})` | copy of S-1 | never merged with the outbox |
| S-3 | `send()` `seq = seqs.current[item] + 1; seqs.current[item] = seq` | S-2 | correct within one page; wrong after reload when the outbox holds a seq the server did not yet have at S-1 |
| S-4 | `flush()` replays outbox entries **with their stored seq** | outbox | never advances `seqs.current` |
| S-5 | a second tab of the same session | its own S-1..S-4 | two counters, one shared outbox key |

**F-07 mechanism (confirmed):** S-1 reads max = 1 for item 1 and nothing for item 2; the outbox holds item 2 @ 1; S-4 replays it (RECORDED); the learner changes item 2; S-3 computes 0 + 1 = 1 → conflict refusal → treated as offline → the new answer is never sent under a new seq.

### 2.2 Outbox states and transitions

| state | entered by | left by | as built |
|---|---|---|---|
| ABSENT | — | learner answers | — |
| PENDING (in outbox, not yet acknowledged) | `send()` writes before the request | ack; refusal; storage loss | storage write failure is swallowed (`writeOutbox` catch): **not durable, shown as pending** |
| IN-FLIGHT | request sent | response / throw | not distinguished from PENDING (fine) |
| ACKED | `{ok:true}` | entry deleted | correct |
| REFUSED-RETRYABLE | server `{ok:false}` for a transient cause | next flush | **not distinguished** from terminal |
| REFUSED-RENUMBER | conflict refusal | — | **does not exist**: loops forever (F-07) |
| REFUSED-TERMINAL | TERMINATED / not yours | — | **does not exist**: entry lingers, banner says offline |
| LOST | a second tab's whole-object write overwrites this entry | — | possible today (read-modify-write of one key) — STATIC |

### 2.3 Every path that can finalize a session

| path | today | pending-evidence check |
|---|---|---|
| P-1 Finish button → `finishSession` → `finish_my_session` → `submit_session` → `finalize_session` | only application path | **none** (F-08) |
| P-2 (STATIC FINDING — not yet executed) Deadline: `session_enforce_deadline` flips to EXPIRED **lazily**, only when P-1 runs | EXPIRED → FINALIZED only via P-1 | **none**; P-1 after the deadline finalizes immediately, **inside** the late-sync grace window, so a pending answer replayed seconds later is recorded `is_final = true` and never counted (violates I-R1.6) |
| P-3 Repeated Finish | idempotent (existing root result returned) | n/a — correct |
| P-4 `terminate_session` | sets TERMINATED; never finalizes (doc 04 says TERMINATED → FINALIZED) | outside R1 — recorded, not proposed |
| P-5 System finalizer at deadline+grace | **does not exist** (no scheduler) | an EXPIRED session whose learner never returns has no result — outside R1's invariant; recorded for Sauron |

### 2.4 Authority table

| state | authoritative side |
|---|---|
| session status, deadline, grace, scorable-ness, receipt existence and content | **server** |
| which answer counts per item (highest `client_seq` among `is_final`) | **server**, over client-assigned seqs |
| `client_seq` allocation | **client**, under INV-28; must be constrained by I-R1.3 |
| the set of answers taken but not yet acknowledged | **client** (only it knows) — must be **declared** to the server at Finish |
| whether finalization may happen | **server**, using that declaration and the grace window |

### 2.5 Adjacent behaviours observed while mapping — STATIC FINDINGS, not yet executed (see §3 for what is in/out)

- A-1 `pause_session` does not freeze the authoritative deadline (doc 04 §5 says
  paused elapsed time is frozen); `record_answer` accepts answers while PAUSED;
  the pause button flips UI state without checking the server's result.
- A-2 `record_answer` after the deadline checks only for TERMINATED, so a
  FINALIZED session still accepts scorable LATE_SYNC receipts (I-R1.6).
- A-3 `extend_session_deadline` may extend an EXPIRED or SUBMITTED session's
  deadline without returning it to IN_PROGRESS.
- A-4 A network failure during Finish throws unhandled: nothing is shown to the
  learner (safe for evidence, silent for the learner).

---

## 3. Proposed repair — the smallest change that establishes I-R1 across the family

Four coupled changes; none is a symptom patch on its own.

### R1-1 · One sequence rule, used everywhere (client) — closes F-07, S-1..S-5
- A single `nextSeq(item) = 1 + max(serverMax[item], outboxMax[item], issued[item])`,
  where `outboxMax` is read from the outbox at the moment of issue, and `issued`
  is advanced whenever an entry is created **or replayed**.
- The outbox moves from one whole-object key to **one key per entry**
  (`pintar.outbox.<session>.<presentedItem>.<seq>`), so two tabs can never
  overwrite each other's entries, and `outboxMax` is exact across tabs.

### R1-2 · Refusals are classified, not guessed (server + action + client) — closes I-R1.2/I-R1.4
- `record_answer` / `submit_response` raise with **stable codes**
  (`SQLSTATE` + reason token), not prose: `RECEIPT_CONFLICT` (with the server's
  current max seq for that item), `SESSION_TERMINATED`, `NOT_YOURS`,
  `SESSION_FINAL`, `CONTINUE_REFUSED:<reason>`.
- `submitAnswer` returns `{ok:false, code}`; the client maps:
  `RECEIPT_CONFLICT` → re-key the entry at `max(returned, nextSeq)` and re-send
  (never "offline"); `SESSION_TERMINATED`/`NOT_YOURS`/`SESSION_FINAL` → terminal,
  shown to the learner as not counted; anything else → retryable; a thrown request → offline.

### R1-3 · Finish declares pending work; the server refuses to finalize over it — closes F-08, I-R1.5
- The client's Finish sends a **manifest**: for each presented item, the highest
  `client_seq` the learner has taken (acknowledged or pending).
- `finish_my_session(p_session, p_manifest jsonb)` refuses with
  `PENDING_EVIDENCE` (listing items) unless, for every manifest entry, the server
  holds a receipt with that seq (or a higher one). The client flushes first; if
  anything is still unresolved it **does not finish**: it shows "N jawaban belum
  tersimpan", retries, and never navigates to results.
- This makes the invariant a **server** property: a client that skips its own
  gate is still refused by the database.

### R1-4 · Finalization after the deadline respects the grace window (server) — closes P-2, I-R1.6
- `finalize_session` from EXPIRED proceeds only when **either** the finishing
  client's manifest is satisfied (R1-3) **or** `now() > deadline + grace`.
- `record_answer` records any receipt that arrives after a result exists as
  **retained, unscored** (`is_final = false`, doc 07 "retained and visible"),
  never as scorable. (A-2.)

### Deliberately NOT in the smallest repair (for Sauron's ruling)
- A-1 pause semantics (deadline freeze) — changes timing policy, not evidence
  integrity; needs a product ruling.
- P-4 TERMINATED → FINALIZED and P-5 a system finalizer at deadline+grace —
  lifecycle completion, not I-R1; P-5 needs an infrastructure decision
  (scheduler vs lazy on read).
- A-3 extension of EXPIRED/SUBMITTED sessions.
- Storage-unavailable UX (outbox cannot persist): R1-1 makes the failure
  **visible** (entry flagged not-durable, Finish refuses while in-memory pending
  exist); a richer UX is Daisy's, if ever.

---

## 4. How the repair will be proven (before any claim)

Composed, in a real browser, against the running build — the way F-07/F-08 were
found — promoted from the diagnostic harness into the **selftest contract** (a
browser runner is new to the manifest):

| case | expected after repair |
|---|---|
| S1 reload → replay → change the replayed answer → submit | new answer recorded at a higher seq; it is authoritative |
| S2b pending answers refused (emulated `{ok:false}` retryable) → Finish | Finish refused (client and server); session not FINALIZED |
| S2a pending answers, network down → Finish | nothing finalizes; learner told |
| S3 in-page change (control) | unchanged: seq 1 then 2 |
| two tabs answering the same item | both receipts retained; no outbox entry lost; no stuck conflict |
| lost ack (server records, response dropped) → replay | ACKNOWLEDGED, not duplicated |
| deadline passes with pending entries → replay inside grace → Finish | counted; finalize waits for manifest or grace |
| replay after FINALIZED | retained unscored; result unchanged |
| repeated Finish | same result id |
| server refuses a client that skips its own gate (manifest unsatisfied) | `PENDING_EVIDENCE` |

Each case gets a **plant** (reintroduce today's `seqs.current + 1`, today's
ungated Finish, today's immediate EXPIRED finalize) that must turn it red.
Existing INV-28 DB tests stay; new DB tests cover R1-2 codes, R1-3 refusal and
R1-4 grace.

## 5. Decisions requested from Sauron

1. Approve the four-part repair (R1-1..R1-4) as the R1 boundary.
2. Rule on A-1 (pause freezes the deadline?) — in or out of R1.
3. Rule on P-4 / P-5 — separate family, or R1.
4. Approve adding a browser runner to the selftest contract (CI dependency:
   Chromium via Playwright, probe-only today).
5. Cross-tab ordering: with R1-1, two tabs changing the same item resolve by
   arrival (the later-numbered receipt wins). Accept, or require refusal of a
   second live tab.
