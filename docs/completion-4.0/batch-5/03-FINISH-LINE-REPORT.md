# Batch 5 · Finish-line report (3 Nov 2026)

**Authority:** owner, 3 Nov: «PINTAR 4.0 — Overnight Engineering Authorization» and «PINTAR 4.0 — BATCH 5 OVERNIGHT CHECKPOINT» (D-157).

## Verdict

**READY FOR PROMOTION REVIEW — not for promotion.**
- The engineering is complete and verified on the branch.
- The promotion itself is blocked on two owner acts:
  1. verifying a recent restorable Supabase staging backup;
  2. separately authorising the promotion.
- Merging PR [#8](https://github.com/yazidmanan2409/pintar40/pull/8) would trigger the staging migration of 189–193. It is not merged.
- A green CI is evidence for review, not product acceptance.

## 1. Exact commits

| Role | SHA | What |
|---|---|---|
| Code and test head | `b8ba042` | The last commit changing application code, migrations, tests, walks or workflows |
| Evidence | `84e684f` | Walk, focused-check, full-suite and rollback evidence; no code |
| Final PR head | the commit carrying this report | Documents only; CI and journeys re-run on it (§4) |
| `main` | `31e456d` | Unchanged since Batch 4 (D-155) |

## 2. What changed (Batch 5 and the promotion gate)

**Five migrations, 189–193 (staging has 188).** All forward-only and additive:
- new functions, plus two function bodies replaced (`record_integrity_review` and `integrity_signals_awaiting_review`, both in 190);
- one new table, `result_views`, with a back-fill;
- registry rows.

No column is dropped or retyped, and no existing data is rewritten.

**Requirements:** see `01-COMPLETION-REPORT.md` §1, requirement by requirement.
- W2.5 certificate revocation;
- W2.7 integrity review, one decision per observation, the outcome seen by the referrer, the learner named;
- W2.10 Aktivasi waiting list paged in the database (complete on the branch; accepted only after staging verification);
- W2.18 / UX-37 objectives not yet reached;
- UX-40 a new result as the next step;
- W3.8, W3.9, W3.10, W3.13, W3.15, UX-41, UX-45, UX-46, W2.6, W2.12, W2.16.

**At the promotion gate (D-157):** see `02-PROMOTION-PRECONDITIONS.md`.
- Dr Gladys's approved words were restored.
- The tour stays non-modal.
- Leaving MODE PERAGAAN returns the evaluator to the Hub, still signed in.
- The integrity walk is reproducible on a fresh stack.
- The Batch 5 walk is now in CI's journeys.

**Defects corrected during Batch 5:**
- The integrity page never named the learner, because of an ambiguous embed (pre-existing).
- The revocation action read error text.

Neither tests nor assertions were weakened. Two assertions were corrected, and each is stated with its reason:
- F2's tour continuation now follows the approved design.
- The journeys' words now follow the restored terminology.

## 3. Local results

All local runs used a fresh production build and a freshly reset database.

**Full suite (`selftest:local`, at `d920c58`; no application code changed since):**
- 756 passed, 0 failed, 0 skipped.
- One justified CI-only skip: F01-R04.
- Record: `evidence/full-suite-local-d920c58.txt`.

**Walks in CI's order (`audit/`, at the code of `b8ba042`):**
- Batch 4 administration: 11/11.
- Batch 5 walk: 6/6. Accessibility is clean on every walked screen: axe WCAG 2.2 AA, the skip link, the page title, and no sideways scroll at 320–1280 px.
- Focused checks: 2/2.
- Evidence: `evidence/walk/run4-fresh-ci-order/` and `evidence/fokus/fresh-ci-order/`.

**Rollback round trip:**
- Applying `ROLLBACK-189-193.sql` at 193 returned the two replaced functions to staging's exact bodies and removed every new object, leaving 188 migrations.
- `supabase migration up` then re-applied 189–193.
- F25 and F26 passed 6/6 on the round-tripped database.
- Record: `evidence/rollback/ROLLBACK-189-193-local-test.txt`.

**Static guards (after `b8ba042`'s changes):**
- 328 passed.
- BOB26-K01 threw when the run had no app environment (`CARD_PEPPER` unset). With the environment loaded it passed.
- The 30 static tests that skip outside a full run (they need the build or the database) all pass in the full suite above.

## 4. CI

| Run | Head | Verdict |
|---|---|---|
| `ci` 41640033654 (pull_request) | `b8ba042` | **success** (16 jobs, including the required `verdict`) |
| End-to-end journeys 41640031926 | `b8ba042` | **success**. Job A: every role's screens, Studio W6.5, Batch 4 administration, **Batch 5 walk**, **Batch 5 focused checks**. Job B: Gladys's path from an empty database |
| `ci` and journeys on the final head | final head (docs and evidence only after `b8ba042`) | re-run; IDs and verdicts in the PR |

**Earlier runs:**
- Green on `83f3bcc`: `ci` 41629701365 and journeys 41629705082.
- Superseded on `24c3928`: journeys 41625734838 failed C12a/S23t on the then-new words; corrected.
- Cancelled on `1f18a0b`.

## 5. Journeys

**Job A** (the seeded world), in order:
1. every role's screens;
2. the Studio walk (W6.5);
3. the Batch 4 administration walk;
4. **the Batch 5 walk** (new);
5. **the focused checks** (MODE PERAGAAN exit; the tour by keyboard).

**Job B** (Gladys's path from an empty, production-like database) includes:
- S23i, the learner named on the integrity page;
- S23r, the referrer seeing the outcome;
- S23t, the class report;
- C-12.

## 6. MODE PERAGAAN exit (checkpoint item 2)

**Confirmed in a real browser** (`audit/b5-fokus.mjs` F1).

Leaving does four things:
- It ends the evaluation session server-side (`exit_persona`, audited before it closes).
- It deletes the persona's session cookies.
- It restores the evaluator's own session, which was set aside unchanged when the persona was assumed.
- It lands the evaluator on the Hub (`/evaluasi?keluar=1`) as themselves. The Hub offers the personas again, and no band is shown.

Nothing is left set aside. Signing out while a persona is active ends both sessions:
- no session cookie is left;
- no evaluation session is left open;
- the evaluator's own Auth session is deleted, and its refresh token is refused (400).

**What exit does not do, and has never done** (recorded for the owner, not changed):
- The browser keeps no persona credential.
- But a persona *access token copied out of the browser before exit* stays valid until its own `exp`. It acts only with that persona's own rights in its demonstration school.
- That is the window ADR-0020's migration 0069 records as accepted («Until the token expires, a persona is an ordinary authorized person … The database cannot shorten that window»), and it probes the gap positively.
- Closing it would need a new mechanism, such as refusing a persona token whose evaluation session has ended in the pre-request check. That is a security design decision for the owner, not a Batch 5 correction.
- It is identical on `main`.

## 7. Migration and staging readiness

Staging was checked read-only on 3 Nov. Full table: `02` condition 5.
- **188 migrations**, the version digest identical to the repository's.
- Both functions 190 replaces are byte-identical to the repository's pre-Batch-5 bodies.
- Every prerequisite is present, and none of the new objects exists.
- 193's back-fill will read 1,580 finalized sittings.

**Recovery:** `ROLLBACK-189-193.sql` (tested, §3), plus the physical backup.

**Open:** the owner verifies, in the `pintar-staging` dashboard, a successful, restorable physical backup less than 24 hours old (D-154's rule).

## 8. Decisions and blockers, explicitly open

| Item | Who | State |
|---|---|---|
| Staging backup verified (< 24 h, restorable) | Owner | **Open; blocks the merge** |
| Promotion authorised | Owner | **Open; blocks the merge** |
| RV-9 / W3.9: keep «Peserta» and «Kenaikan» at class and school level, or approve distinct labels | Dr Gladys | **Open**; the approved words are in place (`02` Q1) |
| UX-41 heading: «Penguasaan per bagian» or «Penguasaan per tujuan pembelajaran» | Dr Gladys | **Open**; the approved words are in place (`02` Q2) |
| Engineering-written strings for review (`02` Q3) | Dr Gladys / Daisy | **Open** |
| W3.8 report body and A4 print composition | Daisy | **Open**; registered, not invented |
| PD Kelas «Lihat bukti» (W2.16 item 5) | Daisy | **Open** |
| W3.12, W3.16, W3.6, UX-09 | Daisy (+ Dr Gladys) | **Open** |
| The persona-token window after exit (§6) | Owner | Recorded; the existing accepted design |
| W9.12 recovery readiness | Batch 9 | Unchanged |

## 9. Unchanged

- **`main`:** `31e456d`.
- **Staging:** 188 migrations. No migration applied, no deployment, read-only queries only.
- **Production:** untouched.
- **Dr Gladys's demonstration school and assessment data:** untouched. Staging was only read, and local work ran on local synthetic seeds.
- **Not touched:** branch protection, secrets, permissions and infrastructure. No public history was rewritten.
- **Not started:** 4.1, 4.5 or 5.0 work, and Batch 6.

## STOP

Stopped at the Batch 5 promotion gate. PR #8 stays unmerged and 189–193 stay unapplied until the owner confirms a recent staging backup and separately authorises promotion.
