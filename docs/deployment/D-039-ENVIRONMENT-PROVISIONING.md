# D-039: Automated environment provisioning — proposed design

**Status:** proposed on 24 Sep 2026, for Yazid's approval. Nothing is built until it is approved.
**Scope:** non-production PINTAR environments only. Production is not changed in any way (section 11).

## 1. The goal in one line

Give an environment a **name** and a **type** once. One workflow then does the rest and reports **READY** or **FAILED at stage N**:

1. provisions the environment;
2. generates its own secrets;
3. applies the migrations;
4. configures sign-in and email;
5. initialises the data;
6. deploys;
7. runs the smoke tests.

A second workflow **resets** an environment, and a third **tears it down**. People act only where a provider requires a person to authorize something, and that happens once, not per environment.

## 2. What exists today

| | Production | Staging (hand-built 24 Sep) | `pintar` (created 11 Sep) |
|---|---|---|---|
| Supabase | `pintar-production` | `pintar-staging` | purpose unknown, running, costs compute |
| Organization | ZAYD | **the same ZAYD org** | ZAYD |
| Vercel | `pintar40`, deployed by workflow | `pintar40-staging`, Git-connected | — |
| Credentials | production's own | staging's own keys, pepper and certificate key; **the production mailbox password**; its own Supabase token (still lacking `project_admin_write`) | — |

The problem D-039 must solve is visible in the second row. Every project lives in one organization, and Supabase and Vercel both scope their tokens to an organization or team. So a credential able to *create* environments can also reach production.

## 3. Two kinds of isolation

1. **Runtime isolation.** An environment's own app and database hold only that environment's keys. Staging already meets this, and the design keeps it for every environment.
2. **Control-plane isolation.** The credentials that create, configure and delete environments must never be able to reach production.

The only way to guarantee the second is to keep non-production in **its own provider accounts**:

- a **separate Supabase organization** ("ZAYD Non-Production");
- a **separate Vercel team** ("pintar-nonprod").

The pipeline's tokens are issued *inside* those, so production is invisible to them by construction, not by convention.

**Option A (recommended): separate organization and team.** Meets every D-039 requirement. It costs one more Supabase Pro organization and one Vercel Pro team (section 10).

**Option B (cheaper, weaker): keep one organization.** The pipeline would use per-project tokens plus hard-coded refusals of production. Creating projects still needs organization-wide rights, which reach production. So this meets "never reuse production secrets" but **not** "never grant access to production". It is not recommended.

Every run also **proves** the isolation: stage P0 lists every project its token can see, and stops if production appears.

## 4. The provision workflow, stage by stage

Workflow **`environment · provision`**. Inputs:

- `name`: lowercase letters, digits and hyphens, for example `staging`, `uat-bob03` or `load-l1`;
- `type`: one of the types in section 5;
- optionally, the commit to deploy.

Every stage first reads the current state, so it is **idempotent**: re-running with the same name resumes where a failure stopped, and never duplicates anything.

| Stage | What it does | How it proves it | If it fails |
|---|---|---|---|
| **P0 Guards** | Checks the name against `production`, `prod` and `main`, and the type. Checks the token sees only the non-production organization and team. Checks the target is not production's ref, name or organization. | Refuses to continue, and names the check that failed. | Nothing has been created. |
| **P1 Database project** | Creates or finds Supabase project `pintar-<name>` in Singapore, sized by type, and waits until it is healthy. | The project status reads `ACTIVE_HEALTHY`. | It stops. A re-run finds the project and continues. |
| **P2 Secrets** | Generates a new `CARD_PEPPER` and `CERT_SECRET_KEY_V1` (48 random bytes each). Reads the project's own anon and service keys from Supabase. Uses a **new database password for every run**, set through the API, used, and never stored. | Presence and length only; values are never printed. | It stops. Nothing has leaked, because nothing is written anywhere except the environment's own Vercel project. |
| **P3 Database** | Applies every migration, then runs the launch-readiness and standing-assertion checks. | Migration count equals the repository's; readiness passes. | It stops at the failing migration or check. |
| **P4 Sign-in and email** | Sets the site address, the one callback and sign-up off. Configures email through the **non-production mailbox**, sender "PINTAR `<name>`". Sets rate limits by type. | Read back independently and asserted. | It stops, and the read-back shows exactly what is wrong. |
| **P5 Data** | Sets the environment mode (D-038) and creates the schools and their year. Creates the first admin from a GitHub secret, never a log line; the email is checked by digest. Loads the data profile (section 5). | Counts per school, one platform admin, profile loaded. | It stops. Re-running is safe because every insert checks first. |
| **P6 Deploy** | Creates or finds Vercel project `pintar40-<name>` in the non-production team. Writes its environment variables (Production only). Builds and deploys the chosen commit, the way production does. | The deployment is ready and serves the expected commit. | It stops. The previous deployment keeps serving. |
| **P7 Smoke tests** | Against the deployed address: the sign-in page with its logo and fonts; sign-up refused; a random certificate answers "not found"; an unknown page shows PINTAR's own 404; the first admin signs in through a server-generated link and lands on their home; the report pages open. | Each result is recorded. | **FAILED at P7**, with each check listed. |
| **P8 Report** | A summary with READY or FAILED, the address, the project refs, each stage's result, and what was created. | Written to the run summary and to `RELEASES.md` by the coordinator. | — |

## 5. Environment types

| Type | Lives | Follows | Size | Data profile | Notes |
|---|---|---|---|---|---|
| `staging` | long-lived | `main` (re-deployed on each integration) | Micro | the two schools + SD 5 Bab 1 | Gladys's team tests here (D-036) |
| `uat` | days | a lane head or a release candidate | Micro | same as staging | one per candidate; torn down after the gate |
| `load` | hours | a release candidate | sized to the level (for L1, probably Small) | synthetic cohort: 1,000 or 5,000 students (D-035) | Auth rate limits raised; torn down after the run |
| `demo` | as needed | a chosen commit | Micro | sample mode (sample data **on**) | for presentations; never real names |

## 6. Where each secret comes from

| Secret | Created by | Stored in | Lifetime |
|---|---|---|---|
| Anon key, service key | Supabase, per project | the environment's Vercel project only | as long as the project |
| `CARD_PEPPER`, `CERT_SECRET_KEY_V1` | the workflow (P2), per environment | the environment's Vercel project only | until reset with rotation, or teardown. No escrow: the environment is disposable. |
| Database password | the workflow, **per run** | nowhere | one run |
| `NONPROD_SUPABASE_TOKEN` | Yazid, once | GitHub secret | reaches only the non-production organization |
| `NONPROD_VERCEL_TOKEN` | Yazid, once | GitHub secret | reaches only the non-production team |
| `NONPROD_SMTP_PASSWORD` | Yazid, once (a separate mailbox, for example `uji@pintarselalu.com`) | GitHub secret | replaces today's reuse of the production mailbox |
| `NONPROD_FIRST_ADMIN_EMAIL` | Yazid, once | GitHub secret; masked in logs, checked by digest | — |

No production secret is read by any of these workflows. The production secrets' names are on a denylist the workflows check for.

## 7. Reset and teardown

- **`environment · reset`** (name, plus an optional "rotate secrets"):
  1. empties the database and re-applies every migration;
  2. re-runs P4 to P7;
  3. keeps the address.

  Use it when testing has left the data unusable.
- **`environment · teardown`** (name, plus a typed confirmation that must equal the name): deletes the Vercel project and the Supabase project, then confirms both are gone. It refuses production by the P0 guards, and by the fact that its tokens cannot see production at all.

## 8. Safety rules, hard-coded

1. Names `production`, `prod` and `main`, production's Supabase ref, and production's Vercel project name are refused in every workflow.
2. Each run's token must **not** see production (P0 lists its visible projects).
3. A failure stops the run at that stage, and later stages do not run. The summary names the stage and the check.
4. No secret value is ever printed. Presence, length and a hash prefix are the only evidence.
5. Test data exists only in non-production environments (D-013, D-017, D-036).

## 9. Recovery, in one line each

- **Something failed:** re-run `environment · provision` with the same name. It resumes at the failed stage.
- **The environment is unusable:** run `environment · reset`.
- **Start from nothing:** run `environment · teardown`, then `environment · provision`.

## 10. Cost (Option A)

- **Supabase non-production organization, Pro: $25 a month.** It includes $10 of compute credit, which covers one Micro, so staging is covered.
- **Each extra environment:** Micro at $0.01344 an hour, about $10 a month while it exists. Disposable environments cost only the hours they live.
- **Load environments:** sized for their run only. Small is $0.0206 an hour; Medium is $0.0822 an hour.
- **Vercel non-production team, Pro: $20 a month per member.** Production also needs Vercel Pro before 1 Nov, because the Hobby plan is for non-commercial use.

## 11. What does not change

- **Production.** The Supabase project, the Vercel project, and every production workflow (deploy, migrations, Auth, SMTP, diagnostics) stay as they are. D-004 is unchanged.
- **The new workflows** are separate files with their own names and their own tokens.

## 12. Today's staging

- **For now:** it stays, so Gladys's team can start next week. The one gap is sign-in: its token needs `project_admin_write`.
- **When the non-production organization exists:** `environment · provision staging` builds the new staging there, and a smoke test proves it. The hand-built staging is then torn down, at a quiet time announced to the testers; tester accounts are recreated by P5.
- **The `pintar` project (11 Sep):** Yazid decides whether to keep or delete it. If it is the original development project and nothing uses it, deleting it saves its compute.

## 13. Build plan

- **Ticket:** C-08, in the coordinator lane, about one to two days after approval.
- **Proven by:**
  1. provisioning a throwaway environment `d039-proof` end to end, to READY;
  2. resetting it;
  3. tearing it down, and confirming nothing is left;
  4. provisioning `staging` in the new organization.

## 14. Decisions needed from Yazid

1. **Option A** (separate Supabase organization and Vercel team) or **Option B**.
2. A **non-production mailbox** for sign-in emails, or accept that non-production reuses the production mailbox.
3. The costs in section 10.
4. What to do with the `pintar` project from 11 Sep.
5. When to move staging into the new organization: before testing starts, or after the first test week.
