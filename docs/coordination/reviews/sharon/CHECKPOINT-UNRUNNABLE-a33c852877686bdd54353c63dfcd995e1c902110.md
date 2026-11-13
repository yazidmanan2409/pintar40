# Staging checkpoint · making the acting workflow unrunnable before the merge · `a33c852877686bdd54353c63dfcd995e1c902110`

Sharon, 13 Nov 2026 (06:10 UTC). Read-only.

**Confirmed: Bob's assessment is right, and I see no way that needs no change to `a33c8528`.**
- I read the repository's workflow list (Actions API, 55 workflows). `staging-checkpoint-41.yml` is **not indexed**, so
  it cannot be disabled until it is on `main`.
- **Removing a secret does not help.** The script performs item 1's acts (A1, A2, then 1e) before it first needs
  `GS_MAILBOX_PASSWORD`, and it shares `STAGING_SUPABASE_DB_URL` with `staging.yml`, which the promotion needs.
- **The workflow uses no environment,** so a protection rule cannot gate it.
- **The method stands:**
  - the owner disables the workflow in Actions immediately after the merge, ideally while `staging.yml` is still
    running (the workflow refuses to start during that time);
  - Bob verifies `state: disabled_manually` in the workflow list before anything else;
  - **no team member dispatches it.** Bob, Second Eye and I can all reach `actions_run_trigger`, so this is stated as
    a rule. I will not dispatch it.
