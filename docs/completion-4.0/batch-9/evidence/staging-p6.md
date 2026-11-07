# P-6 staging promotion: evidence (7 Nov 2026)

Owner authorisation: «OWNER AUTHORISATION — P-6 STAGING PROMOTION» (7 Nov). Staging only; production not touched.

Scope:
- migration 198 (MC-8, «Kenaikan» paired within each chapter);
- the «Soal wajib» wording;
- H29, the staff-bar gap;
- H30, several classes' cards in one press;
- F31-K01;
- the print-walk correction (P3b/P3).

## Candidate and promotion
| | |
|---|---|
| Audited candidate | `7cd6ec181ee8f98f2910ef7885805ce77223b331` |
| CI (pull_request, full run) | run 42344298221, every job green, verdict green |
| Journeys pinned to the candidate (both jobs) | run 42344300149, A and B green |
| PR | #15, merged as `main` `002852ab53989680188a67fca96edd2d5564c84b` |
| `kandidat-sama.sh` | **SAME** (tree `9c606d931ad5c9448743f75a5e3015bf97887967`) |
| `staging.yml` | run 42346628842, green: migration 198 applied |

### Earlier candidates, not promoted
| Candidate | Result | What changed next |
|---|---|---|
| `ddbe5442` | Journeys 42334743642 failed at b6-cetak P3b. The walk's fixture found no second class with learners (the seeded alpha school has one). | `4b58463f`: P3b makes its own two classes; P3 presses the one-class button. Green locally, then CI 42337353829 and journeys 42337350954. |
| `e5282d45` | Journeys 42342101154 green. The PR's CI stood down as ALREADY PROVEN by 42337353829 (only staging request files differed), so main's ruleset refused the merge: required «verdict» cancelled. | `7cd6ec18`: a pull request into main always runs CI in full, because it is the merge gate. CI-W02 holds this, red against the old gate. |

## Staging database, read-only, after the deploy (7 Nov ~06:35)
| | |
|---|---|
| Migrations | **198** (`20270101100000`) |
| Live metric catalogue | **MC-8**; MC-7 `superseded_by` MC-8; 16 definitions in each |
| `calc_class_net_gain`, `calc_institution_net_gain` | group by `person_id, plp_release_id`; sample `count(distinct g.person_id)` |
| `authenticated` may call the calculators | no |
| `assert_metric_closure()` | ok |
| Official results / certificates | 213 / 57 (none rewritten by the migration; it changes functions and catalogue rows only) |

### «Kenaikan» on staging's own data, MC-8 against the old grouping
Every school on staging that holds both tests gives the same figure under both groupings (19 schools listed, among them gs-001, Sekolah Demo PINTAR and Sekolah Uji Evaluasi B: 0.3750 over 5 learners). That is expected, not a gap in the check: on staging each learner has at most one chapter with both tests, so pairing within the chapter changes nothing yet.

The case that does change, two chapters for one learner, is measured by F31-K01 in CI:
- With migration 198: 0.275 over 1 learner.
- Against the old grouping: 0.40 over 2, and the test fails.

## Staging walks on the deployed `main`
| Walk | Run | Result |
|---|---|---|
| GS-17–21 (reports, certificate, recovery, shared computer, sessions ended elsewhere), Sekolah Uji Evaluasi B | (pending) | |

## Not claimed
- Production is unchanged.
- H29 (the staff-bar gap below 1024 px) is deployed, but no person has looked at it on staging yet. The staging host is not reachable from this environment, so a screenshot at 820, 390 and 320 px is still needed.
