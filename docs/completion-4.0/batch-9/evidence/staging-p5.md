# P-5 staging promotion: evidence (6–7 Nov 2026)

Owner authorisation: «OWNER DECISION — P-5 STAGING PROMOTION APPROVED» (6 Nov). Staging only; production not touched.

## Candidate and promotion
| | |
|---|---|
| Audited candidate | `727f65d26ad19e9262f288fecbe91611ff97521e` |
| CI (pull_request) | run 42310079812, green |
| Journeys pinned to the candidate (both jobs) | run 42310079074, green |
| PR | #14, merged as `main` `ebc53ee2029702163f6e4f7abb4496860897045b` |
| `kandidat-sama.sh` | **SAME** (tree `c118b77f6f254f51d30098f1f46fd5029f4e3785`) |
| `staging.yml` | run 42314442512, green: migration 197 applied |

Two earlier candidates were not promoted: `328a3906` (S27v found a learner could not open her own certificate after the new school year; fixed in `7ea62753`) and `7ea62753` (S27v itself opened the wrong chapter; corrected in `727f65d2`).

## Staging data, read-only, before and after
| | Before (6 Nov ~21:45) | After (7 Nov ~00:05) |
|---|---|---|
| Migrations | 196 | **197** (`20261231100000`) |
| `transfers.to_node_id`; `transfer_terima` with 4 arguments | absent | present |
| Persons / accounts | 1526 / 1526 | 1526 / 1526 |
| Enrolments / placements | 1454 / 1451 | 1454 / 1451 |
| Transfers / official results | 3 / 190 | 3 / 190 |
| Certificates (revoked) | 51 (3) | 51 (3) |
| Active roles | 76 | 76 |
| Certificates fingerprint | `f2394e75…` | `f2394e75…` (identical) |
| Placements fingerprint | `7a58cada…` | `7a58cada…` (identical) |

## Staging walks on the deployed `main`
Sekolah Uji P5 1107 (found-school.yml run 42316257437), then the walks in order. Results are recorded below as they complete.

| Walk | Run | Result |
|---|---|---|
| GS-01–03 (first administrator) | 42316340902 | GREEN |
| GS-04–11 (setup, Studio publication) | 42318052262 | GREEN |
| GS-07, GS-12–16 (students) | 42319445341 | GREEN |
| GS-17–21 (reports, certificate, recovery, shared computer, sessions ended elsewhere) | 42320850695 | GREEN |
| Administration P0–P8, receiving school Sekolah Uji B8 1106 | 42323858693 | GREEN |
| Studio end to end, Uji Cepat score | 42325413782 | GREEN |
| Batch 5 (revocation on «Sertifikat sekolah», integrity review, waiting list, reports, learner pages) | 42326802001 | GREEN |

## Verdict: P-5 VERIFIED ON STAGING (7 Nov, 02:03 UTC)
Promoted equals audited (SAME); migration 197 applied with existing data unchanged; every staging walk green on the
deployed `main` `ebc53ee2`; the transfer places the learner in the receiving school's chosen Kelas, where its Guru
finds them.

**What staging itself did not walk** (proven in the journeys pinned to the candidate, run 42310079074, not on staging):
the transferred learner's own sign-in at the receiving school (B4-W7b), a revoked certificate on the learner's own
certificate page after a new school year (S27v), a role reaching the Digital Card (S13). **H29** (the wordmark's clear
space by eye) is not done: this environment cannot reach staging; it needs a person or the walks' screenshots.

**Migration 197 on staging, read-only:** the walk's transfer (P5 1107 → B8 1106) is EXECUTED with `to_node_id` = «Kelas 5A» (CLASS); the learner has exactly 1 open placement, in that Kelas; P6 also required B8 1106's Guru to find them on the class page. The transfer of 6 Nov (B8 1106 → B8 1105, made before the fix) still shows the defect: that synthetic learner has 0 open placements. It is test data and is left as the record of the defect.
