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
