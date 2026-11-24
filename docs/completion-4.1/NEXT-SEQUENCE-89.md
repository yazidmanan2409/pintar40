# After Z: the sequence to 4.1's gates, and on to the audit (Bob, 24 Nov 2026; ruling 89)

**Where we start:**
- Z is accepted on staging at 308 (ruling 88).
- Production is untouched at 111.
- Nothing in Z is reopened.

## 0 · What "4.1 gates closed" means (ruling 71, `MASTER-SEQUENCE-4.1-TO-5.0.md` §1)

| Gate | State |
|---|---|
| G-1 · Z green, reviewed, promoted to staging | **Done** (ruling 88) |
| G-2 · every Z-READINESS row closed or explicitly deferred | **CLOSED** at e45af28a |
| G-3 · D2-R, the certificate refinement, done and accepted on staging | **CLOSED (ruling 94, owner accepted, 24 Nov).** PR #29 merged (main 429b7dcc, tree = frozen 177ab4d2); staging 308 → 309; only line 10 of AFTER moves; every after-promotion check passes, periksa +153; **Sharon PASS**, with R-1 closed |
| C3w-2 | **Not a gate now.** The master sequence includes it only "if a provider qualifies". None does commercially until counsel clears one (ruling 85: design only, no activation). Its journey J3 is deferred with it |

The comprehensive walkthrough moved to after 5.0 (ruling 71).

**4.1's internal gates are CLOSED (ruling 94, 24 Nov 2026).** Ruling 79's audit is OPEN (track 3). Production stays at 111; any production promotion needs its own authorisation and step-0 counts (Sharon's carry-over). Production stays at 111; any production promotion needs its own authorisation and step-0 counts (Sharon's carry-over).

## 1 · The baseline (direction 1): done

- **`claude/next-base` = `055738ba`:** main `61a6ff9e` (Z as accepted), plus `claude/infra-83` `8a1293be` merged with no fast-forward.
  - Sharon PASS: `7696819e`, plus `a3bc9516`.
  - Second Eye PASS: `8a1293be`.
- **It adds only** `scripts/dev/` and `docs/completion-4.1/infra-83/` (41 files, 0 others). No Z file differs from main.
- **Every new branch starts here.** Every expensive local run starts with `scripts/dev/siap.sh`, and runs with the heartbeat.
- **GitHub CI is the authoritative full run** (L-3). Long local runs are waited on within a turn (L-5).
- **Main receives it** in the next PR to main (with D2-R), not separately.

## 2 · The tracks (directions 2–4), run in parallel

### Track 1 · D2-R, the certificate refinement: the critical path to G-3

| Step | Who | Depends on | Done when |
|---|---|---|---|
| 1a · The pre-code reviews (§6.3 step 2 and §6.3a): R-a, R-b, R-g and the learner-facing conditions, against the A4 grid; Daisy writes R-h's words (ruling 74a) | **Daisy** | — | Her verdict, with the final ID and EN strings |
| 1b · The pre-code reviews: R-c to R-f (policy capture, lint, public surface, extra time, ordinal), plus R-h's threshold question, plus §6.3a's no-timed-test check | **Sharon** | — | Her verdict |
| 1c · A read-only build map: every learner route, RPC, print and export R-h touches; each certifying mode's assistance path; the red-first case list per §6.2 | **Second Eye** | — | The map and the case list, at a named head |
| 1d · Spec revision 4: 1a and 1b folded in; the final scope frozen | **Bob** | 1a, 1b | Sharon and Daisy confirm it in one line |
| 1e · Build on `claude/d2r` from `claude/next-base`: red first, then green | **Second Eye** | 1c, 1d | CI strict green; plants red |
| 1f · Batch reviews: Sharon, then Daisy (rendered, R-13) | Sharon, Daisy | 1e | PASS |
| 1g · PR to main, merge, staging promotion 308 → 308+n, with step 0, BEFORE and AFTER | Bob | 1f; **owner's authorisation** | Staging accepted → **G-3** |

Estimate: about 1–1.5 days of build plus the reviews; about 3–5 days end to end.

### Track 2 · 4.1 closure work (direction 2)

| Item | Who | Done when |
|---|---|---|
| 2a · **The Z-READINESS closure audit (G-2):** every row closed with a citation, or deferred to a named phase (4.2 → 4.5 under ruling 72; 4.5; D2-R; the audit) | **Bob**; each row's owner confirms in one line | No row left open |
| 2b · **The readiness register, draft 2:** Sharon's 18 Nov review folded in; what has changed since (counsel approved, ruling 85; the pre-request check proven on staging, V6; the first-use envelope); one status per PR row | **Bob** drafts; **Sharon** second pass; **Daisy** reads PR-12, PR-15 and PR-19 (what a person sees when help is needed) | Both reviews recorded. No production action follows from it |
| 2c · **The D-2 specification:** this is track 1d | — | — |

### Track 3 · Ruling 79's audit: prepared now, opened at G-2 and G-3 (direction 3)

| Item | Who | Done when |
|---|---|---|
| 3a · **One findings ledger:** every deferred UX finding (Daisy's audit items from Z3–Z8, R-15's audit-bound items, the walkthrough observations against D2-R, `SAPU` leftovers) in one table, de-duplicated, mapped to dimensions A–H and to a journey | **Bob** consolidates; **Daisy** confirms the mapping | Ledger committed |
| 3b · **The twelve journey scripts, final:** from Daisy's draft (`AUDIT-79-SKRIP-PERJALANAN-DRAF.md`, `4f0b3f42`), kept to her established design grammar (the vocabulary page, «Kosakata»; her Z words) | **Daisy** | Scripts final |
| 3c · **The synthetic world and the capture harness:** one shared synthetic world, plus per-journey fixtures only where a journey needs a state the world cannot hold; a repeatable capture for each journey (screens and data); multi-answer items included now (ruling 88) | **The builder** (stream B), on `claude/audit-79-world` from `claude/next-base`; local and CI only | Each journey runs from a reset to its last screen on CI |
| 3d · **The three open questions** (master sequence §2b): who captures (Second Eye reproduces, Daisy judges, as the roles say); one shared world (as 3c); whether Dr Gladys reads J2, J3 and J11 is **the owner's**, asked when the audit opens | Bob | Settled |

**When it opens:** when G-2 and G-3 close. Findings are then made on `claude/next-base` plus D2-R, on synthetic data, in approved environments only. Its scope stays as ruling 79 sets it: no new features, no policy changes, and nothing on production.

### Track 4 · C3w-2 design preparation (ruling 85: design only)

| Item | Who | Done when |
|---|---|---|
| 4a · The C3w-2 design against OpenAI as the **reference** provider, with Anthropic as a separate candidate on the same interface; the condition checklists from D7 §2 as testable items; no account, key, call or spend | **The builder**, after 3c's first journey runs | Design doc; Sharon reads the data-handling section |

## 3 · Out of scope here (direction 5)

- **The 4.2 and 4.5 findings stay where they are.** These include Sharon's latest notes: a locked platform admin, a warning before the last admin appointment expires, the transfer race with a rollover, and ruling 73.
- **The efficiency sweep, and ruling 54's rationalisation, stay deferred** (direction 6).
- **D-7 counsel:** the brief is ready (`COUNSEL-BRIEF-RULING85.md`, Sharon FIT TO SEND). It goes when the owner confirms scope and fees. No activation, no spend.

## 4 · What needs the owner (only these)

1. **D2-R's PR, merge and staging promotion** (track 1g), the same way as Z.
2. **Dr Gladys reading J2, J3 and J11** (track 3d), when the audit opens.
3. **Counsel:** sending the brief once fees are confirmed.
4. **The diagnostic branches: DEFERRED, not a blocker** (owner, 24 Nov). GitHub refused both deletions, and the repository settings page returned 404. **Both branches are left untouched.** Repository permissions, branch protection and rulesets are not changed to allow the deletion. They are inert, and their logs are kept in `batches/z/z-evidence/ci-diag/` on main.

## 5 · Expected timing (an estimate, not a date)

- **G-3 (D2-R on staging):** about 3–5 working days, plus the owner's authorisation.
- **G-2:** within the same window.
- **The audit opens** at G-2 plus G-3, and runs about 2–3 weeks (master sequence §4).
