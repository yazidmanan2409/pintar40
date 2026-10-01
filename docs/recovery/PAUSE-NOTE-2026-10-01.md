# Paused by Yazid, 1 Oct

Everything is paused. Nothing is running. `main` is unchanged at `28d3015`; production and staging were not modified.

## On the coordinator branch, not on `main`
- The audit harness turns red on any FAIL or BLOCKED step (`audit/`, `audit-journeys.yml`). First honest run: 36809800818.
- `environment-facts.yml`: staging confirmed running main `28d3015` with 132 migrations (run 36810110411). Production app `5b5b68d`; production database not read (needs permission).
- `staging.yml` guard: the SMTP secret must open the mailbox before it is written.

## Open, for Yazid when work resumes
1. The GitHub secret `PINTAR_SMTP_PASSWORD` is stale (535, run 36810221497). It needs the current `noreply@` password, the one set on 30 Sep, which was entered in Supabase and Vercel but not in GitHub.
2. How changes reach `main`: a push permission for the coordinator, or pull requests that Yazid merges.

## Next, when resumed
Land the guard and checks on `main`; set staging's app email settings from one source; land Gate 3; prove email end to end with `goldenschool@pintarselalu.com`.
