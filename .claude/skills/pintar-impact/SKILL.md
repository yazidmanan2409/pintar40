---
name: pintar-impact
description: Trace what a PINTAR change touches across screen → server action → RPC → SQL function → table, trigger and policy, and its tests. Use before changing any RPC, table, shared helper or screen state, for "what else did that change?" and regression impact, and to build a batch's dependent-screens list.
---

# Impact: "And then what? What else did that change?"

PINTAR's layers are joined by **strings**, not imports: a page calls `call(db, "<rpc>")` or `.rpc("<rpc>")`, and the RPC is a SQL function in `supabase/migrations/`. Code-graph tools don't see that join (measured on 25 Nov 2026: 301 RPC names called by string, none linked). **Trace it with grep, at each layer.**

## The recipe (replace the angle brackets)
1. **The current SQL definition.** A later migration replaces an earlier one, so the last file listed wins:
   `grep -lE "function (public\.)?<rpc>\s*\(" supabase/migrations/*.sql | tail -1`
2. **Its TypeScript wrapper, and every caller of the wrapper:**
   `grep -rn "\"<rpc>\"" src`, then `grep -rlw "<wrapper>" src`
3. **What the function reads and writes.** Read the definition itself. For a table:
   - its writers: `grep -liE "(insert into|update|delete from)\s+(public\.)?<table>\b" supabase/migrations/*.sql`
   - its triggers: `grep -hiE "create (or replace )?(constraint )?trigger .* on (public\.)?<table>\b" supabase/migrations/*.sql`
   - its policies: `grep -hiE "create policy .* on (public\.)?<table>\b" supabase/migrations/*.sql`
4. **Exposure:** the `client_rpc_registry` row and the grants (`grep -n "<rpc>" supabase/migrations/*.sql | grep -iE "grant|registry"`). See `pintar-security-boundaries`.
5. **Tests and plants:** `grep -rln "<rpc>\|<wrapper>" selftest scripts/dev`
6. **Dependent screens:** every page that shows the same fact, not only the ones that call this function. Name them in the hand-off as «dependent screens: N found, N updated».

## Rules
- **A trace is a hypothesis until the path is walked** (L-148/L-149). Confirm a dependent-screens list with a journey or a capture before a freeze.
- **The database decides at the moment of action.** A screen's «may do» read uses the action's own refusal codes (W3 §3b, C-7).
- **The authoritative examples:**
  - `docs/post-4.1/AUDIT-79-COMMON-CAUSES.md` §3a, the eleven consumers of `my_cycle_state`;
  - §3b, the nine buttons;
  - both on `claude/bob-41-master-plan`.
