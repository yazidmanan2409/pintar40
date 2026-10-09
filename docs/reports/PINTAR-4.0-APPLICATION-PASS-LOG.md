# PINTAR 4.0 · Application pass log

**Authority:** D-138 (9 Oct). **Design source:** `ux-1/daisy-experience`, `docs/coordination/ux/sistem-desain/project/`, verified freeze c42fecb (D-136(b)). **Map:** `08-migration.md`. **Order:** `07-proposal.md`, «The application pass».

This log is the evidence record D-138(d) asks for. A step is **done** only when its screens are applied on the running staging application, its checks have passed, and an independent review has looked at it. CI GREEN alone is not done.

## Baseline (before any change)

| Check | Run | Result |
|---|---|---|
| CI on 894ae01 | 37876327609 | 18/18 |
| Journeys on 894ae01 | 37876329363 | crawl GREEN; 76 PASS, 0 FAIL |
| Staging = main | facts 37878894218 | 894ae01, 177 migrations |
| Golden School walk on 894ae01 | (running) | |

## Steps

| # | Step | State | Screens | Evidence |
|---|---|---|---|---|
| 1 | Tokens (v3 in `globals.css`, v2 names as aliases) | in progress | all (no visual change intended beyond token values) | |
| 2 | Primitives (Button, fields, segmented control, tabs, badges, result line, alert) + target-size guard | not started | | |
| 3 | Shells (staff left navigation, learner top bar) | not started | | |
| 4a | Surfaces: learner (Belajar, lesson, assessments, result, certificates) | not started | | |
| 4b | Surfaces: teacher (Mengajar) | not started | | |
| 4c | Surfaces: Pimpinan | not started | | |
| 4d | Surfaces: Konfigurasi | not started | | |
| 4e | Surfaces: Pendataan, Aktivasi | not started | | |
| 4f | Surfaces: Studio | not started | | |
| 5 | Copy (the copy owed, `11-validation.md` §4) | not started | | |

## Unresolved defects

| # | Defect | Found | State |
|---|---|---|---|

## Developer-owned usability items (D-138(c))

Carried from the L4 list (raw codes, JSON, unclear selectors, missing labels) and resolved in the step that touches their screen: Aturan Asesmen (shuffle choices, limits line, placeholder-only inputs), Jejak audit (action codes, tables), report templates (keys as titles), transfers (typed codes, CR-41), the integrity review's next action.
