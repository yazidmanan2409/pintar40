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
| GS-17–21, Sekolah Uji Evaluasi B, its **second** run | 42347750742 | **Not valid as verification** (13 PASS, 5 FAIL; see below) |
| GS-07, GS-12–16, Sekolah Uji Evaluasi A | 42349448056 | GREEN |
| **GS-17–21, Sekolah Uji Evaluasi A: the verification of record** | **42350628901** | **GREEN, 18 PASS, 0 FAIL** (C1 passed; GS-22 added «Fajar» and she sat her Pemetaan Awal; every session this run opened was ended) |

**Why B's second run does not count.** GS-17–21 runs once per school: its last step, GS-22 (N1), adds a learner, Fajar. B's first run (42336620831, green, before P-6) already added Fajar, so B now holds 6 learners and 5 post-tests. On this second run that broke:
- L0, the read-only recipe: 6 learners where it expects 5;
- L1, the teacher's «Mengumpulkan»: 6/6 and 5/6;
- N1, which refuses to add Fajar a second time;
- X1, which then had no session of Fajar's to check;
- C1, which crashed reading `batas`: the same sixth learner, who has no sitting. Confirmed: C1 passed on A.

Choosing an already-walked school was my error. Every step that reads the figures P-6 touches still passed on B:
- the head of department, the dean and the school admin saw «Kenaikan» +38 poin and «Pemahaman» 78% for «Kelas 5A»;
- the school's «Kenaikan» and «Soal wajib» stayed withheld below the minimum sample;
- the certificate, card re-issue, recovery, shared-computer and public-check steps all passed.

The verification of record is GS-17–21 on school A.

## Verdict
**P-6 is staging-verified within this coverage:** the promoted code equals the audited code, migration 198 and MC-8 are live, and GS-17–21 is green on a school walked from GS-01.

## Not claimed
- Production is unchanged.
- H29 (the staff-bar gap below 1024 px) is deployed, but no person has looked at it on staging yet. The staging host is not reachable from this environment, so a screenshot at 820, 390 and 320 px is still needed.
