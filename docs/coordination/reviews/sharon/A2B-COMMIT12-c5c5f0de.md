# A2b commit 12, corrected: the one place predicate and the per-window drain

Sharon, 16 Nov 2026 (08:35 UTC). Read-only. **What I reviewed:**
- `c5c5f0deaa6948c843608049152f72f8d5a11c09`: migration 20270120180000, corrected in place. It is DRAFT and undeployed.
- `0519573b` on `claude/a2b`: its tests (D15 extended, D16, and C708's case).

## What holds now

- **PASS on the code,** conditional on the full suite being green at `0519573b`. I have not seen that result.
- **My four conditions of 08:21 are met:**
  - (a) **Equivalence:** the old predicate is shown beside the helper. D16 compares the helper with the old expression on a database, for these edges:
    - a class window, on its own class and on another;
    - a school window (`'{}'`), on its own school and on another;
    - NULL classes, and a NULL node, which give NULL, never "covered".
  - (b) **The earlier tests must stay green:** K1 to K13, O01 and the I01/I02 inventories. That waits on the suite.
  - (c) **Grants:** `maintenance_draining_di` and `maintenance_jendela_atas` are both revoked from public, anon and authenticated, and the migration's check raises if either is open to a client.
  - (d) **No copy remains:** the migration fails if any of the three readers lacks the call or still matches `node_ids && n.jalur`. D15 pins the same.
- **Unchanged in substance:**
  - The replaced text is the same expression, so the semantics of `maintenance_affects_place` and `maintenance_mulai_tolak` are unchanged.
  - No lock was added; the reader is a single STABLE SELECT.
  - The callers are SECURITY DEFINER and own the helper, so revoking it from clients does not affect them.

## One non-blocking correction

- **N1: the claim that the helper is "inlinable" is not true as written.** PostgreSQL does not inline a SQL function that carries a `SET` clause, and the helper has `set search_path = public, pg_temp`. Choose one:
  - **(i) Drop the `SET`.** That is safe here: the helper is SECURITY INVOKER, no client can execute it, and its definer callers already fix `search_path`. Then it really inlines.
  - **(ii) Keep it,** and drop "inlinable" from the header and the commit text.
  - Either is fine, because performance was only my note, not a condition. What matters is that a comment in the schema does not state something false.
  - *Could reasonably have been anticipated (Q5, who checks):* nothing tests the inlining claim. I raised the idea without saying the `SET` clause must go.

## Addendum, 16 Nov 2026

- **N1 is closed** by `2cb36a543d28f1c0fe251fbaadc5242e61e8cc3f`, which takes option (ii).
  - It is a comment change only: the header now says the `SET` clause prevents inlining and is kept by project rule.
- **PASS still waits on a green full suite.** It now needs to be at `2cb36a54` or later.
