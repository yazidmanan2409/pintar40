# PINTAR 4.0 — release log

Only the coordinator releases (D-004). Newest first. Every entry names:
- what shipped;
- the gate evidence;
- how production was verified afterwards;
- the rollback point.

| Date | Release | What | Evidence | Verified after | Rollback to |
|---|---|---|---|---|---|
| 24 Sep | — (governance, no app change) | `main` fast-forwarded to the production source. Production workflows now run only from `main` (D-004). Coordination folder published. | CI on `main` | No production workflow fired: the push touched no request file. | — |
| 23 Sep | **`5b5b68d`** (deploy attempt 013) | The sign-in page's logo and fonts are served to visitors who are not signed in (middleware matcher). Test F01-R08. | CI run 35850275026: 21/21 green, strict selftest | Deploy run 35851746640: every functional step green. Front-door runs 35851951906 and 35935767367 (24 Sep): FRONT DOOR OK. Readiness 17/17. | `c358f58` |
| 23 Sep | **`c358f58`** (deploy attempt 012) | The service-role key comes from Supabase, is validated before it is written, and is read back by hash. | CI on `c358f58` green | Deploy run 35847959997; a real 200 on certificate verification in the edge logs. | `46fd4452` |

## Production data operations (D-013)

| Date | Operation | By | Audit record |
|---|---|---|---|
| 23 Sep | §3b: Gladys bootstrapped as SYSTEM_ADMIN (valid until 2027-09-23) | Runbook procedure; verified by the coordinator | `role.first_system_admin_bootstrapped` |
| 23 Sep | §3c: environment set to `production`, fixtures off | Runbook procedure; verified by the coordinator | platform_environment |
| 23 Sep | Schools `sd-zps` and `sma-zps` created, each with the 2026/2027 period | Coordinator (database), on Yazid's instruction | `institution.created` ×2 |
| 23 Sep | Both schools reclassified from demo to real (D-003) | Coordinator (database), on Yazid's decision | `institution.reclassified_official` ×2 |

## Release checklist runs (D-028)

| Date | Candidate | Harness run | P0 PASS | P1 exceptions | Decision |
|---|---|---|---|---|---|
| 24 Sep | `main` 78b0f55 (baseline, not a release candidate) | Audit journeys 35952344955 (harness `39ad60e`): Gladys's path 15 PASS · 5 FAIL · 1 BLOCKED, one operator step (W1); crawl of 14 personas; probes P1 PASS, P2 PASS, P3 FAIL | 13 / 79 | — | NO-GO for any new release until the sprint 1 tickets land. Production stays on `5b5b68d`. |
