# A2b · the boundary tests K1 to K7 (PLAN-A2B-C2W.md §2.3, `43ce13bfedce7b7c813eb5fe28f1f811b4184e3e`)

Sharon, 15 Nov 2026 (20:30 UTC). Read-only. I read them against my `A2B-PREBUILD-ec09e82e…` and `A2B-EARLY-READ-d711d4b2.md`.

## What holds now

- **K1 to K7 are agreed as written.**
- **K1's case of a lock wait across the start is exactly my point 1:** the guard reads the clock, not `now()`.
- **Five tests are missing, and they are required before A2b's product code:** K8 to K12. They come from my three prebuild points and from A2a's one-instant rule.

## Required additions

| # | Boundary | Required behaviour |
|---|---|---|
| K8 | Extending a window that has already ended (my point 2) | Refused once `ends_at <= clock_timestamp()`, whether or not the edge recorder has marked the end. State is never read from `activation_recorded_at` |
| K9 | Extend against the edge recorder (my point 2) | On two connections, both orders: recorder first (its mark, then the extend refused); extend first (the recorder skips, and its next run reads the new `ends_at`). Either way, exactly one activation row and at most one deactivation row per window |
| K10 | A class-scoped PLANNED window (my point 3) | A2a's emergency-only CHECK is dropped in the same migration that adds the node parameter. A PLANNED class window is accepted. A bad class is refused by `schedule_maintenance` with its designed code, before any constraint fires. A2a's node trigger covers PLANNED |
| K11 | Work scope, not person scope (R-1) | A teacher of 7A and 7B is refused on 7A's work only. A person at two schools is refused only at the window's school. `MAINTENANCE_PLACE` is never `PT503`, and no redirect happens. A PLANNED window reads **current** placement; only EMERGENCY reads `T_stop` |
| K12 | A PLANNED and an EMERGENCY window over the same class | The emergency governs: person-level, the fence, the hold and the shift. The planned guard does not refuse an act that A2a's rules allow after the lift. A2a's regression set (A2A-K01, C7xx, L01, T01) stays green |

**K5, one note:** "its existing deadline" means the **effective** deadline: `pengerjaan_tenggat_efektif`, which includes any stop's shift or pending credit.
