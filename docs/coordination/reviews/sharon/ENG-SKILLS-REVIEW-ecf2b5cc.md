# Engineering skills and third-party tools: security review (Sharon, read-only, 2026-11-25)

**Work:**
- claude/eng-skills `ecf2b5cc` (from main 0c155a5c, not merged): `CLAUDE.md` plus seven skills in `.claude/skills/`. No settings, hooks or MCP files were added; checked by diff-stat.
- The evaluation, `docs/post-4.1/ENGINEERING-EFFICIENCY-EVAL.md` at 29cd93d4.

**Verdict:**
- **Skills: ADOPT WITH CONDITIONS.** E1–E3 are needed before the merge; E4 and E5 are strongly advised.
- **OmniRoute: REJECT,** confirmed.
- **Ponytail plugin: REJECT,** confirmed.
- **Graphify: DEFER,** confirmed, with conditions (§G).

**The design is right.** Skills point to the authority, records govern, and enforcement lives outside the skills. My conditions make that last claim true, and keep the rules that matter most in the file that is always loaded.

## E1 (before merge): "Enforcement works whether or not any skill is loaded" is not yet true for the scan
- **Where the scan runs:** `scripts/guard/sensitive-scan.mjs` runs only as a **local pre-commit hook** (`core.hooksPath` set by `npm run prepare`). It is **not in CI**; `grep` over `.github/` at 0c155a5c finds no match.
- **How it is skipped:** a fresh clone that never ran `prepare`, a `git commit --no-verify`, or a commit made through the GitHub API (or any web editor).
- **The fix, either:**
  - add `npm run guard:scan` (tree mode) as a CI job counted by «verdict · green only when every job ran and succeeded». This is a workflow change, so it is named for the owner;
  - or say exactly what holds: "pre-commit, local only; bypassable".

  I recommend the CI job.
- Could reasonably have been anticipated: yes. A client-side hook is a convenience, not a control.

## E2 (before merge): the rules that must hold without a skill belong in `CLAUDE.md`'s «Never» list
Several rules sit only in a skill, and a skill that isn't loaded enforces nothing. Move these one-liners into «Never», each pointing to its source:
1. **No new dependency, plugin, hook, MCP server, model router or external service** without Sharon's review. It is now only in `pintar-security-boundaries`.
2. **Nothing sends PINTAR source, data or logs to a third party,** including "free tier" APIs and paste or share services.
3. **No paid call, key or spend.**
4. **Never skip, disable or quarantine a test or plant to get green.** It is now only in `pintar-verification`.
5. **No staging data write outside an authorised step,** and staging reads only within that step.
6. **Governance records:** superseded text is struck through, never deleted.

## E3 (before merge): protect the guidance itself
`CLAUDE.md` and `.claude/` are instructions every agent session follows, so an edit there can steer every session. That is the same vector for which Ponytail is rejected.
- **Review:** a change to `CLAUDE.md`, `.claude/**`, `.githooks/**`, `scripts/guard/**` or `.github/workflows/**` needs Sharon's review, said in `CLAUDE.md`.
- **A static selftest:** no `.claude/settings*.json` with `hooks`, no `mcpServers`, and no `.mcp.json` in the repository unless on an allowlist this review sets. The allowlist is empty today. A plant that adds a hook must turn the test red.

## E4 (strongly advised): `pintar-security-boundaries`, accuracy and completeness
The summaries it has are correct. Name my branch exactly: `claude/gracious-lamport-0m1qjr`, not "her branch". This applies to `pintar-handover` too.

**Additions, one line each with its record:**
- **L-78/CI-2:** locking rotates **and unlocking rotates again** (OD-1, fresh credentials after reinstatement).
  - `card_holders` returns only `terkunci`, never why.
  - Lock state is read from the verified session only (`akun_auth_terkunci`).
- **L-127:**
  - NIS is unique within the institution and shown only to that school's intake and admin staff;
  - the same name is a *possible* duplicate, resolved by an audited per-pair admin choice;
  - removing an import row never touches a person record.
- **L-155:** the only exception is an audited reclassification; the reverse trigger (`role_assignments_card_holds_no_role`) stays; a lapsed role never makes a person eligible for a card.
- **L-151:** encode on output; refuse control, bidi and zero-width characters at storage; a CSV export neutralises leading `= + - @`, TAB and CR.
- **C-9, L-75, L-76:** a refusal says more only after strong proof (a password, not a PIN). L-75 is **withdrawn** under CI-2, so the neutral line only. The PIN-recovery line is shown on every refusal.
- **L-112:** the shared-computer lock is a confidentiality control and counts only real input (PR-23).
- **C-3:** across schools, a boolean only, never the sending school's reason.
- **L-124/L-143:** a review mark is bound to the revision it checked, and approve or publish re-check the current revision.
- **Certifying results:** counts-only when the sitting's captured `bersertifikasi` is true (R-h). `verify_certificate` keeps `predikat` null, and validity follows CI-1.
- **SQL hygiene:**
  - every SECURITY DEFINER function sets `search_path`;
  - read definitions with `pg_get_functiondef`, never `prosrc` (empty for BEGIN ATOMIC);
  - guards often live in **triggers**, so search them (my L-152 lesson).

## E5 (advised): wording
- **Pronoun:** `CLAUDE.md` says «the owner enters every credential himself». Don't assume a pronoun; write «the owner enters every credential personally».
- **`pintar-release-governance`:** add that a verifier who has not queried staging says so, and that production step 0s go through the readiness process. Otherwise it matches the sequence we used for CI-1, H-1 and CI-2.

## G · The third-party tools
- **OmniRoute: REJECT, confirmed.**
  - It routes source to third-party providers, and that external transmission is the point of the tool.
  - "TLS stealth" and subscription key pools breach provider terms and conceal traffic.
  - Silent model substitution and prompt "compression" make what the model saw unverifiable.
  - No condition could make it acceptable.
- **Ponytail plugin: REJECT, confirmed.**
  - Its Node hooks inject into every session **and subagent**, including verification sessions. That is the integrity of independent review.
  - "Trivial changes need no test" conflicts with red-first.
  - It has an optional outbound webhook.
  - The useful principle is already ours, in `CLAUDE.md`.
- **Graphify: DEFER, confirmed, with conditions for now and for any revisit:**
  1. **Delete the scratch venv, the graph output (51 MB, which embeds code) and any `GRAPH_REPORT.md` now, and say where they were.** Nothing from it is committed or shared.
  2. **If revisited:**
     - an exact version **and hash** pinned (PyPI `graphifyy`, which moves fast: 52 commits in a month);
     - installed in a throwaway environment, with `--code-only` and `GRAPHIFY_BACKEND=none` verified, so no network;
     - **its hooks and its CLAUDE.md integration never installed.** It can deny Grep and Read, and it tells every session to read a 300 KB report;
     - it is advisory only: it never replaces the `pintar-impact` grep and walk;
     - my review again before any use.
  3. **The gap that defers it:** 0 of 301 RPC-by-string links and 4/5 table writers found. A false "nothing else changed" is a correctness and security risk in itself.

## Not reviewed here
- `pintar-words` is Daisy's.
- `pintar-assessment-semantics` and `pintar-impact` I read for security-relevant content only. `pintar-impact`'s step 3 already includes triggers.
- The merge goes by owner ruling after CI-1b, with E1–E3 done. E1's workflow change is named for the owner.

Could reasonably have been anticipated: E1 and E3, yes. The evaluation's own risk row says "a skill that's not loaded enforces nothing"; the same applies to a hook that isn't installed and to guidance anyone can edit.
