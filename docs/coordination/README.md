# PINTAR 4.0 — how Bob, Daisy and the coordinator work together

**Canonical.** This folder is the single source of truth for who does what,
what has been decided, what is in flight, and what is released. If a chat
message, a session summary or an older document disagrees with this folder,
this folder wins. Only the coordinator changes it.

| File | What it holds |
|---|---|
| `README.md` | Roles, lanes, the change flow, the gate, and the release process (this file). |
| `DECISIONS.md` | Every canonical decision, numbered. |
| `BOARD.md` | Every work item, with owner, dependencies, acceptance criteria and status. |
| `RELEASES.md` | Every production release, what it contained, and how it was verified. |
| `briefs/` | The current brief for each builder. Yazid pastes these into their sessions. |

---

## 1. Roles

| Who | Role | Owns | Does not |
|---|---|---|---|
| **Yazid** | Product owner | Final say on product scope; approves anything that changes what the product *is*; takes the actions that need his accounts (Supabase dashboard, Vercel, GitHub settings). | Merge code or run production workflows. |
| **Gladys** | System administrator, first user | Runs the schools in the app; supplies school data; is the acceptance tester. | Anything in the repository. |
| **Claude, coordinator** (this session) | Coordinator, **release authority**, **gatekeeper**, keeper of canonical decisions | `docs/coordination/**`; the decisions log and the board; reviewing and merging into `main`; every production release, deploy and migration; production data operations; the audit harness (`audit/**`, `audit-journeys.yml`, `check-front-door.yml`); keeping Bob and Daisy in sync. | Build product features. The coordinator reviews and verifies; Bob and Daisy build. The exceptions are gate tooling and emergency fixes, which are recorded. |
| **Bob**, the builder | Back end, data and platform | Everything behind the screen: database, authorization, server actions, API routes, library logic, tests, CI and deploy workflows. | UI components, page layout, styling, or wording, beyond what his ticket names. |
| **Daisy**, the front end | Screens, wording and experience | Everything the user sees: pages, components, navigation, layout, CSS, accessibility, all copy in Bahasa Indonesia and English, and error pages. | Database, migrations, authorization, server-side logic, or workflows. |

## 2. Lanes: who may change which files

A change outside your lane needs a ticket that says so. If a ticket needs something from the other lane, ask for it in your hand-off; do not make the change yourself.

| Path | Owner |
|---|---|
| `supabase/**` (migrations, seed) | **Bob** |
| `selftest/db/**`, `selftest/plants/**`, `selftest/run.ts`, `selftest/lib.ts` | **Bob** |
| `src/app/api/**`, every `actions.ts`, `src/proxy.ts`, `src/lib/**` except the two files named below | **Bob** |
| `.github/workflows/**` (except the coordinator's three), `scripts/**`, `package.json` dependencies | **Bob** |
| `src/app/**/page.tsx`, `layout.tsx`, `error.tsx`, `not-found.tsx`, `loading.tsx`, `global-error.tsx` | **Daisy** |
| `src/components/**`, `src/app/**/*.css`, `public/**` | **Daisy** |
| `src/lib/hle.ts` (all UI copy), `src/lib/locale*.ts` | **Daisy** |
| `docs/coordination/**`, `docs/audit/**`, `audit/**`, `.github/workflows/audit-journeys.yml`, `.github/workflows/check-front-door.yml`, every `.github/*-request.txt`, `RELEASE_SHA` in the deploy workflows | **Coordinator** |
| `selftest/manifest.json`, `selftest/*.test.ts` | **Shared, append only.** Each lane adds its own test ids and bumps `version`. Never edit or remove another lane's test. If `version` conflicts on merge, take the higher number and add one. |

**Copy rule (D-014).** Every word a user sees lives in `src/lib/hle.ts`. Bob may add keys his feature needs, with his best Indonesian and English. Daisy owns the final wording and may rewrite any key, but the key names Bob depends on stay the same.

**Contract rule.** The two lanes meet at typed functions in `src/lib/*.ts` and in each `actions.ts`, together with their result and error shapes:
- Bob writes the contract, with its signature, result type and error codes, in his hand-off, before Daisy builds on it.
- A contract changes only through a new hand-off. Silent changes are not allowed.

## 3. Branches

| Branch | Purpose | Who writes |
|---|---|---|
| **`main`** | **The trunk.** Everything reviewed and accepted. The only branch production is released from (D-004). | **Coordinator only**, by merge. |
| `claude/quirky-meitner-a04smj` | Bob's lane | Bob |
| `ux-1/daisy-experience` | Daisy's lane | Daisy |
| `claude/awesome-rubin-bqxp6p` | Coordinator's lane (gate tooling, audit, docs) | Coordinator |

Rules:
1. **Before starting any ticket, merge the latest `origin/main` into your lane.** Use a merge, never a rebase, and never force-push.
2. **One ticket per hand-off.** Commit messages start with the ticket id, for example `BOB-02: …`.
3. **Pushing to a lane changes nothing in production** and, since D-025, starts no CI.
   - Production workflows run only from `main`, and each job refuses to run from any other ref.
   - When a ticket is ready, dispatch `ci.yml` once on your head commit. Budget is finite, so do not dispatch speculative runs.
   - If a job never started (no runner), say so in the hand-off. Do not re-dispatch repeatedly.
4. **Never dispatch a production workflow.** That means deploy, migrations, Auth, SMTP and diagnostics. Only the coordinator releases.
5. **A push to `main` that starts no CI (documentation only) must still pass `npm run lint` locally first.** Lint covers every script in the repository, `docs/` included, and a lane that merges `main` inherits whatever is there. On 24 Sep a coordinator script in `docs/coordination/checklist/` failed lint on `main` unseen and failed Daisy's CI #168 after she merged it.

## 4. The change flow

```
lane: merge main → build → tests red-then-green → dispatch ci.yml ONCE on the head (D-025) → green → hand-off
coordinator: gate review → audit journeys on the candidate → merge to main → update BOARD
coordinator: release (when a set of tickets is ready) → verify → record in RELEASES
```

### Hand-off (lane → coordinator, via Yazid)

Paste this block, filled in, at the end of every ticket:

```
LANE:        Bob | Daisy
TICKET:      BOB-02
HEAD:        <branch> @ <full sha>          (main merged in at <sha>)
CHANGED:     <files / areas, one line each>
PROOF:       <test ids added> — red without the change: <how shown>; green with it
CI:          <run URL> — green on exactly this sha
CONTRACT:    <new or changed functions, types, error codes the other lane uses; "none">
MIGRATIONS:  <file names; "none">   (forward-only, additive)
COPY:        <hle keys added or changed; "none">
QUESTIONS:   <decisions needed from the coordinator; "none">
READY:       yes
```

### Gate verdict (coordinator → lane, via Yazid)

```
GATE: PASS | FAIL — <ticket> @ <sha>
Reasons / required changes: …
main is now at: <sha>   (merge <sha> into your lane before the next ticket)
Next for you: <ticket>
```

## 5. The gate: what must be true before anything merges into `main`

1. **The ticket's acceptance criteria are met** (see `BOARD.md`).
2. **The change is proven by a test that fails without it and passes with it.** The hand-off says how the red run was shown. A test may never be weakened, skipped, quarantined or deleted to reach green.
3. **CI is green on the exact head commit**, including the strict selftest contract, the red-case jobs, baseline parity, and both migration paths.
4. **The lane rules are respected.** No file outside the lane, unless the ticket allows it.
5. **Migrations are forward-only and additive.** Never edit a migration that has been applied. Any destructive step needs a decision first.
6. **No raw English error text reaches a user** (D-011). **No new string appears outside `hle.ts`.**
7. **The audit journeys are run against the candidate.** The coordinator runs workflow "audit · end-to-end journeys" with `ref=<sha>`. They must be no worse than on `main`, and better wherever the ticket says.
8. **The coordinator reads the diff adversarially**, asking what would break in production or for which role.
9. **Hot paths stay cheap (D-031).** A change that touches sign-in, the assessment answer, sync or submit path, the learner home or the teacher class view states its queries per request. The reviewer checks that none is unindexed or per-row, because at 60,000 students a slow query is an outage, not an inconvenience.

## 6. Releases (coordinator only)

1. `main` is green, and the audit journeys pass on its head.
   The release checklist (`RELEASE-CHECKLIST.md`, D-028) is run on that exact commit: every P0 check PASS, every P1 PASS or accepted by Yazid in writing.
2. If there are migrations, they are released first:
   - `deploy-request.txt` on `main`;
   - the migrations are applied;
   - launch readiness must be 17/17 and every assertion must pass.
3. The application is released next:
   - `RELEASE_SHA` and `vercel-request.txt` are updated on `main`;
   - the deploy runs, including its own functional checks;
   - the front-door check and readiness are re-run.
4. The release-day checks (REL-01…REL-11) are run on production, read-only.
5. The release is recorded in `RELEASES.md`, with a rollback point and the checklist run.
5. **Production data changes** (schools, classes, rosters) go only through reviewed, auditable steps, never ad-hoc SQL except in a recorded emergency (D-013).

## 7. Keeping in sync

- **The board is the status.** When a lane asks "what next?", the answer is in `BOARD.md`. After every gate the coordinator updates the board and names the new `main` head.
- **Decisions are made once, written down, and quoted by number.** If a lane needs a product or technical decision, it asks in its hand-off's `QUESTIONS:`. The coordinator answers and records the decision in `DECISIONS.md`. A lane never decides a cross-lane question on its own.
- **Blocked?** Say so immediately, with the exact error and the commit. Do not work around a gate, a permission, or another lane.
