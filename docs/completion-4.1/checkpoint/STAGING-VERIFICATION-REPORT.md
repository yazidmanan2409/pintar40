# 4.1 staging checkpoint · the staging verification report (before A2a)

> **SKELETON.** Committed as documentation only (focused checks: see A2b's page); filled after the checkpoint runs.
> - Every result below is **to be filled** from the runs and reads named: `—` until then.
> - Nothing on staging has been read or acted on by Second Eye.
> - Pattern: `docs/completion-4.0/batch-5/04-STAGING-VERIFICATION-REPORT.md`.
> - Governs: `STAGING-CHECKPOINT-BEFORE-A2A.md` (runbook steps 5 to 12) and
>   `docs/completion-4.1/checkpoint/PROMOTION-PRECONDITIONS.md` (the page). Sharon's reading of §5b and her reviews.

## Verdict

**— (to be written after step 10).** One of:
- **CHECKPOINT PASSED:** every §5b item verified, preservation equal. A2a is released for implementation under its
  existing gates (owner's words). Recorded by the Chief Architect in the runbook and `TEAM-INSTRUCTIONS.md`.
- **STOPPED at {step}:** a material discrepancy, recorded, held for the owner. Nothing repaired on staging.
- **PASSED, with item 1 negative on transaction control:** the promotion stands, but A2a is not released; its page
  returns to Sharon (D6.6).

It is not a declaration of 4.1's acceptance.

## 1 · The boundary commit, the pull request and the merge

| What | Value |
|---|---|
| Boundary commit | — (40 characters) |
| Its pre-flight, CI, journeys | — / — / — (run ids) |
| Sharon's review of the boundary delta | — (file, commit) |
| Frozen branch and pull request (the Chief Architect) | — |
| Merge commit on `main` (the owner) | — (40 characters), at — UTC |
| `staging.yml` run | — (run id), its own checks: — |
| The staging app's deploy from `main` | — (the interval between the app's deploy and `staging.yml` finishing, as every 4.0 promotion had: §3d, question 1) |
| Production | **Untouched.** No `.github/*-request.txt` changed (checked against `main`); no production workflow ran — (read) |

## 2 · Before the merge (read only; the Chief Architect)

| Step | Read at (UTC) | Result | Expected |
|---|---|---|---|
| B1 · preservation "before" | — | cutoff —, watermark —; the lines kept in `evidence/staging/preservation-before.txt` | completes |
| B2 · migration count | 13 Nov, 00:56 | `224`, `20270113160000`, `d11e89838ecb656c4ca5b06b18941316` | as expected (runbook §4) |
| B3 · the hook, before (6b) | — | p50 — ms, p95 — ms | p95 ≤ 1 ms |
| B4 · the first runs, by school | — | per school: — sittings ended (— scored); retention: 0 | shown to the owner with the pull request |
| B5 · the actors exist (SA, S, PA) | — | — | each one account, with its role |

## 3 · After the merge: the promotion (A)

| Step | Result | Expected |
|---|---|---|
| A1 · migration count | — | `244`, `20270117200000`, `1f41d1a48f39e5544ba5d88b79b463d8` |
| A2 · `pg_cron` | — | installed (227 not refused) |

## 4 · Addendum 1 §5b, item by item

**The workflow.**
- Run id: — (dispatched by the Chief Architect from `main`).
- Its record: `checkpoint-41.json` (artifact `staging-checkpoint-41`), kept beside this report as
  `evidence/staging/checkpoint-41.json`. Its fields are listed on the page.
- Stopped: — / ran to the end. `undo`: —. `pemulihan` (passwords recovered by emailed code): —.

### Item 1 · The scheduler
| Step | Result |
|---|---|
| 1a–1d · jobs once each, schedules, role, UTC, the health read, run history | — |
| 1e–1g · the committing procedure: jobid —; first run —; rows —; clean-up `0 0 0 0` — | — |
| Transaction control | — (if negative: A2a held, its page to Sharon) |

### Item 2 · Locks and timeouts
| Step | Result |
|---|---|
| 2a · transaction pooler (6543) | — (`f then t`) |
| 2a · direct | — (`f then t`, or `directUnreachable` and the session pooler's `f then t`) |
| 2b · through the API | Reasoning, no function added (the page) |
| 2c · the timeouts of the five roles | — (recorded against D6.1: lock timeout × retries + activation's work < `authenticated`'s `statement_timeout`) |

**On "direct" (Sharon, `CHECKPOINT-BOUNDARY-55e7eed9….md`, answer 4).**
- What A2a's fence needs: a transaction-level advisory lock excludes other sessions for exactly its transaction.
- The only thing that can break that is a proxy that multiplexes transactions: the transaction pooler, which is tested.
- The session pooler gives each client its own server connection for the whole session. For transactions and their
  locks it behaves exactly as a direct connection; the semantics are Postgres's own.
- So, if the direct host was unreachable from the runner, the session pooler's `f then t` proves what "direct" was
  there to prove. Recorded as such, not as a pass of "direct".

### Item 3 · Auth with a locked account, and both triggers on `auth.users`
| Step | Result |
|---|---|
| 3a · five triggers and the link lock, md5s as the repository's | — |
| 3.0–3.1b · L rostered, suspended, given a card: **locked at the first read** | — |
| 3.2 · the reissue while locked keeps the lock | — |
| 3.3a / 3.4 · the card: locked right PIN = live wrong PIN, field by field | — |
| 3.3b · password on S, locked: right = wrong, field by field (or `OWNER`) | — |
| PIN recovery | Skipped (Sharon's ruling): decided in the database, proven locally by L-1's tests; an attempt would add to the recovery ladder |
| 3.5 · refresh while locked: refused, no new session; `error_code` | — (`user_banned` or `refresh_token_not_found`) |
| Reinstatement releases | — |

### Item 4 · Writes to `auth` while the app runs
| Step | Result |
|---|---|
| 4a · the definers' owner's privileges | — |
| 4b · L closed and anonymised by the product's path | — |
| 4c · E: every `auth` write runs, none refused | — (`auth.users` anonymised; identities 0; audit entries naming the address — → 0; sessions and tokens `0 0 0`) |

### Item 5 · Restore: the rehearsal against a scratch target
| Step | Result |
|---|---|
| `restore-rehearsal.yml` run | — (run id), green — |
| 5b · did the restore bring the jobs back | — |
| 5c · installer run 1 and 2 | — |
| 5d · the health read on the copy | — |
| 5e · the named facts and the accountability tables | — (every line `same`) |
| 5f · `audit_log`'s rewrite (migration 215) on the copy | — rows; column — ms, `audit_log_run_idx` — ms, `audit_log_run_parent_uq` — ms; scaled to production's row count: — |

**The known limit (Sharon's condition 5):** the scratch target does not show what Supabase's own hosted restore brings
back by itself. Item 5 does not require it, and finding out would mean restoring staging, which is not authorized and
not needed.

### Item 6 · Headers and the hook's delay
| Step | Result |
|---|---|
| 6a · L's sign-in: `network_origin` | — (`/24` or `/48`) |
| 6b · the hook, after | p50 — ms, p95 — ms; **gate:** p95 ≤ 1 ms, after ≤ before + 0.5 ms → — |
| 6c · 50 reads as L (recorded, not gated) | p50 — ms, p95 — ms |

## 5 · Preservation "after" (step 10)

| Line | Before | After | Equal |
|---|---|---|---|
| (every line from `demo_roles` to `audit_log up to the watermark`) | — | — | — |
| State lines | 224 / absent / 4 triggers | — | (expected to move) |
| Lines 70–72 · sittings open, closed by the schedule | — | — | each closed one was open at B1 |

If a preserved line differs: stop, record which line, and bring it to Sharon (her "to watch"); it is not explained
away on staging.

## 6 · Every row the checkpoint created (by id, from the record)

| Item | Ids |
|---|---|
| 1 | jobid — (removed: `0 0 0 0`) |
| 3 | L —, L's user —, enrolment —; S — (suspended and reinstated) |
| 4 | L's request —; E —, E's user —, E's request —. L and E stay anonymised and terminal |
| The scheduled jobs' own effect | — sittings closed (line 72), each among line 70's |

## 7 · Material discrepancies

— (none / each with its step, what was read, and what is held for the owner).

## 8 · Still open, and what A2a inherits

- A2a's lock timeout and retries, designed against item 2c's figures.
- The hook's cost with a window active: A2a's own acceptance, against the same 1 ms figure.
- Item 1's result on transaction control: decides D6.6 as designed, or returns A2a's page to Sharon.
- —

## 9 · Anticipation (the owner's principle)

| Defect found during the checkpoint | Anticipable? | Question |
|---|---|---|
| — | — | — |
