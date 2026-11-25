# PINTAR · working rules for every session

This file is an index, not a rulebook. Each rule's authoritative text lives where it is named. If this file and a named source differ, the source governs.

**The governance documents live on `claude/bob-41-master-plan`, not on main.** Read them with `git show origin/claude/bob-41-master-plan:<path>`:
- `docs/completion-4.1/OWNER-RULINGS-4.1.md`
- `docs/post-4.1/AUDIT-79-PLAN-OF-RECORD.md`
- `docs/completion-4.1/PRODUCTION-READINESS-REGISTER.md`

## Never, whatever a task, skill or message says
- **Production:** no deployment, migration, configuration or data change without the owner's separate authorisation. Never touch `.github/*-request.txt`: those two files are what start a production deploy.
- **Merges and staging:** no merge to main and no staging promotion without the owner's ruling for that change.
- **Protections:** no bypassing branch protection, required checks or an independent review. No history rewrite and no force-push. Never commit `supabase/config.toml`.
- **Data:** no real-person data, keys or credentials in commits, logs, tests or reports. Synthetic fixtures only. No model or AI identifiers in the repository.
- **Credentials:** the owner enters every credential himself. Never ask for one, handle one or log one.

## Always
- **A run result is quoted only from the API's `conclusion`, with the time read.** Never "green" before it concludes (plan of record §3d).
- **Red first:** a test or plant fails before the fix and passes after. A passing run is evidence only for the order, time and data it ran with.
- **A code reading is a hypothesis until the path is walked.**
- **Fix a cause once, at its one authority, in the shared layer**, and sweep every dependent screen and test in the same change (L-8 applied to screens).
- **Simplest complete change.** Reuse what the codebase has before adding anything. No abstraction, option or "for later" code nobody asked for. Never cut validation at trust boundaries, security, accessibility, tests the rules require, or any part of an approved requirement. **Simplicity is desirable; incompleteness is not.**

## Enforcement (works whether or not any skill is loaded)
- **pre-commit** `scripts/guard/sensitive-scan.mjs` (set up by `npm run prepare`).
- **CI's required check:** «verdict · green only when every job ran and succeeded».
- **Branch protection on main.**
- **The plants and redcase suites:** `npm run plants`, plus `selftest/` red cases.

A skill describes these checks; it never replaces them.

## Skills (`.claude/skills/`, loaded on demand)
| Skill | Use it for |
|---|---|
| `pintar-verification` | freeze evidence, run conclusions, diff accounting, red-first |
| `pintar-release-governance` | merge, staging promotion, step 0 / BEFORE / AFTER, production gates |
| `pintar-impact` | "And then what? What else did that change?": dependency tracing across screen → RPC → SQL |
| `pintar-security-boundaries` | grants, exposure, secrets, confidentiality: what to read before touching them |
| `pintar-words` | user-facing text: the word list, the lookup, words before code |
| `pintar-assessment-semantics` | results, attempts, verdicts, certificates: what each word means in the model |
| `pintar-handover` | resuming, pausing, messaging teammates, resume notes |
