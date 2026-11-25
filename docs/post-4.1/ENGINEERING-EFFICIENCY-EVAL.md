# Engineering efficiency · tool evaluation (Bob, 25 Nov 2026)

**Owner's brief:** evaluate Ponytail, OmniRoute, Graphify and Anthropic Agent Skills; adopt proven improvements early; escalate only material matters.

**Method:**
- Primary sources only: each repository cloned shallow and read; nothing installed globally.
- Graphify was installed in an isolated venv and run on a **copy** of main `0c155a5c`.
- Ponytail was benchmarked by two identical agents on one real finding, in isolated worktrees, with nothing pushed.

**Nothing touched main, staging or production.** The benchmark worktrees were removed afterwards.

## 0 · Three things that aren't the same

| | What it is | How it applies to us |
|---|---|---|
| **Tokens** | what a task consumes in context | |
| **Money** | per-token API charges | Our sessions run on the Claude subscription, so there's no per-token bill; a tool that routes to a paid API **adds** money |
| **Subscription limits** | the plan's usage allowance | Fewer tokens per task stretches it; more tokens spent on overhead (hooks, injected context, big reports) shrinks it |

## 1 · The matrix

| | **Anthropic Agent Skills** | **Graphify** | **Ponytail** | **OmniRoute** |
|---|---|---|---|---|
| **Source** | Built into Claude Code (2.1.332 here); spec at agentskills.io; Anthropic docs | `safishamsi/graphify`, PyPI `graphifyy` **0.9.119**, Apache-2.0; very active (52 commits in a month) | `DietrichGebert/ponytail` **v5.3.3**, MIT; active | `diegosouzapw/OmniRoute` **3.8.55**, MIT; ~30,600 files |
| **Benefit** | Rules indexed once, loaded on demand: no more hand-briefing each session; one pointer per rule to its authoritative source | Local, fast code index: tree-sitter, **no LLM, no network** with `--code-only` / `GRAPHIFY_BACKEND=none` | A decision ladder against overengineering, with a sound "never cut" list | Multi-provider routing, compression, fallback |
| **Measured on PINTAR** | Always-on cost **≈1,400 tokens** (index plus 7 descriptions); bodies 400–700 tokens each, on demand. Replaces hand-written rule restatements in every team message (each of my briefs carried 300–600 tokens of process) | Index **40 s** (incremental **14 s**), 20,593 nodes, 51 MB. TS consumers of `cycleState`: **10/10**. Writers of `person_suspensions`: **4/5** (grep: 5/5). **0 of 301** RPC-by-string calls linked to their SQL function. For a named symbol, grep's answer was smaller (1,335 B vs 2,164 B). `GRAPH_REPORT.md` is **300 KB** (≈75k tokens), and its CLAUDE.md integration tells every session to read it | Same task, same model, same start (L-160): **tokens +1%** (129,194 vs 127,871); tool calls 19 vs 18; time −14% (one run); **lines +17 vs +25**. The product fix was identical; **every saved line came from the test and comments, and the test lost its assertion of the fallback path** |
| **Risks** | A skill that's not loaded enforces nothing, so enforcement stays in pre-commit, CI, protection and plants. Stale pointers | Misses a writer (a false "nothing else changed"); misparses a grant as a read; its hooks redirect or **deny** Grep and Read (strict mode), against "read the authoritative source"; stale graphs in ephemeral containers | Its hooks inject the rules into **every session and every subagent**, including Second Eye's and Sharon's verification; "trivial changes need no test" conflicts with red-first; "ultra" pushes back on approved requirements; an optional webhook | Routes source code to **third-party providers** (including free tiers with uncertain terms); "TLS stealth" and subscription "key pools" raise provider-terms issues; **silent model substitution**; prompt "compression" alters what the model sees; a 12 GiB heap; doesn't fit managed cloud sessions |
| **Overhead** | Seven small files plus a 45-line `CLAUDE.md`; edited like any doc | A Python venv, a 40 s rebuild per fresh container, a 51 MB output, and hooks | A plugin plus Node hooks on every prompt | A local server, credentials, a dashboard |
| **Already in our environment?** | Partly: `/simplify` and `/code-review` exist; no PINTAR skills | **Yes, and better for us:** grep across the string join, plus the Explore agent. The recipe is now the `pintar-impact` skill | **Yes:** `/simplify`, plus our own rule (now written in `CLAUDE.md`) | No need |
| **Specialists** | All: each loads only the skills its task needs | — | — | — |
| **Classification** | **ADOPT WITH CONDITIONS** | **DEFER** | **REJECT** (the plugin) | **REJECT** |
| **Remaining blockers** | Sharon's review of the skills, `pintar-security-boundaries` above all; Daisy's on `pintar-words`; merge at a safe checkpoint (after CI-1b), by the owner's ruling as for any main change | Revisit if it links RPC calls made by string to SQL functions, and finds every table writer | — | — |

**Why Ponytail is rejected and not deferred:**
- The useful part is a principle, and the principle is now ours, in our own words, with PINTAR's «never cut» list (`CLAUDE.md`, «Simplest complete change»).
- The plugin adds hooks that reach verification sessions. On PINTAR, where the baseline already writes minimal fixes, it saved no tokens and weakened the test.
- JetBrains' independent 80-task test found −15% code and −10% cost, against the maker's claimed −54%. Our one task is consistent with "small, and not free".

**Why OmniRoute is rejected:**
- It exists to send our traffic to other providers.
- That is the external transmission and model substitution the brief forbids.
- It buys nothing on a subscription in managed cloud sessions.

## 2 · Agent Skills: what is proposed

On `claude/eng-skills` (`ecf2b5cc`, from main `0c155a5c`), **not merged**:
- **`CLAUDE.md`** (always loaded), an index and not a rulebook:
  - the «never» list;
  - the «always» list: API-only run results, red first, walk before trusting a reading, fix once at the authority, simplest **complete** change;
  - the enforcement mechanisms;
  - the skills table.
- **Seven skills** in `.claude/skills/`:
  - `pintar-impact`: the screen → RPC → SQL → table grep recipe, tested on PINTAR;
  - `pintar-verification`
  - `pintar-release-governance`
  - `pintar-security-boundaries`
  - `pintar-words`
  - `pintar-assessment-semantics`
  - `pintar-handover`
- **Single source:** each skill names its authority (rulings, plan of record, ADRs, `ENGINEERING-LESSONS.md`, Sharon's and Daisy's records) and says that the authority governs where they differ. Nothing is copied beyond a summary line. The governance docs live on `claude/bob-41-master-plan`, and the skills say how to read them there.
- **Enforcement doesn't depend on a skill:**
  - pre-commit `sensitive-scan`;
  - the required verdict check;
  - branch protection;
  - plants and redcase;
  - the deploy workflows, which fire only on the `.github/*-request.txt` files (checked: a `.claude/` change can't start one).

**Install:** merge `claude/eng-skills` to main; sessions on this repo load the skills when the repo is cloned.
**Update:** edit the files by PR.
**Removal and rollback:** revert the merge commit; there's nothing else to uninstall.

## 3 · Monitoring after adoption (Bob, two weeks)

- **Rule restatements in my team briefs:** they should fall to pointers («per `pintar-verification`»).
- **Resumed sessions:** count the files read before the first useful action, against tonight's resumes.
- **Errors the skills target:** a premature «green», a missed dependent screen, an unread ruling (A1). Each recurrence is logged against the skill that should have caught it.
- **Removal:** any skill nobody loads in two weeks, or that drifts from its authority, is removed.

## 4 · Measurement limits

- **The Ponytail comparison is one task, one run per arm.** Its time difference is within run-to-run noise; the token and line counts are exact for those runs.
- **Graphify's accuracy is shown on two questions with known answers**, not a full benchmark.
- **The skills' savings are estimated from message sizes,** not yet measured in use. That's what §3 is for.

## 5 · A side finding from the benchmark

**L-160:** both arms independently noticed that moving focus to the PIN after a non-match drops an older design rule. The old rule said «focus the first field, so the screen never implies which one was wrong», and the refusal code also covers a wrong card number. This is **for Daisy** before AR-79 builds L-160.

## Sources
- Repositories as cloned, 25 Nov 2026:
  - `DietrichGebert/ponytail` `ebd8654`
  - `safishamsi/graphify` `14f35e3`
  - `diegosouzapw/OmniRoute` `ae94881f`
  - `anthropics/skills` `e4bb5d9`
- JetBrains, "Ponytail skill: Claude tested" (blog.jetbrains.com, Jul 2026).
- Anthropic, "Equipping agents for the real world with Agent Skills".
- Claude docs, Agent Skills overview.
