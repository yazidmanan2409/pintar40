# Staging: the copy of PINTAR people test on (D-036)

| | |
|---|---|
| Supabase | `pintar-staging`, ref `keijhmdtsgrfvnvocfvk`, Singapore, Micro |
| Vercel | `pintar40-staging`, Git-connected to `main`, **Production environment only**, Ignored Build Step "Only build production" |
| Origin | **`https://staging.pintarselalu.com`**, the single canonical staging origin since 24 Sep: the site URL, the one allowed sign-in callback, and `NEXT_PUBLIC_APP_URL`. The Vercel-generated `https://pintar40-staging.vercel.app` stays attached, redirects **308** to it with the path and query kept, and is not an allowed sign-in destination. |
| Workflow | `.github/workflows/staging.yml` ("staging · database and sign-in") |
| Rules | Test data is allowed here and never on production (D-013, D-017). Staging's service key, database password, pepper and certificate key are its own; nothing is copied from production. |

## Setting it up, in order

1. **Yazid: the Vercel project.** Set seven variables, **Production** only:
   - `NEXT_PUBLIC_SUPABASE_URL`;
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (staging's legacy anon key);
   - `NEXT_PUBLIC_APP_URL`;
   - `SUPABASE_SERVICE_ROLE_KEY` (staging's legacy service_role key);
   - `CARD_PEPPER` (new);
   - `CARD_EMAIL_DOMAIN` = `cards.pintar.internal`;
   - `CERT_SECRET_KEY_V1` (new).

   Leave out `PINTAR_BUILD_SHA`, which Vercel supplies, and `SUPABASE_DB_URL`, which goes to GitHub instead. After creation: Settings → Git → Ignored Build Step → "Only build production".
2. **Yazid: two GitHub secrets.** Repo → Settings → Secrets and variables → Actions:
   - `STAGING_SUPABASE_DB_URL`: staging's Connect → Session pooler URI, with the database password filled in. Done 24 Sep; the migrations were applied with it (runs 35966930847 and 35967139925, 113 = 113).
   - `STAGING_SUPABASE_ACCESS_TOKEN`: a **scoped** Supabase personal access token (it starts `sbp_fc`), scoped to the `pintar-staging` project only. It needs three permissions:
     - **Auth Config: Read-write**;
     - **Project Settings: Read-write**. Supabase's "Update auth service config" needs both this and Auth Config. Without it, every write is refused as "Missing required permission(s): project_admin_write" (runs 35968916899, 35971103189 and 35971879016).
     - **API Keys: Read**, for the verification step.

     Project Settings Read-write also lets the token pause or delete the project it is scoped to. That is why it is scoped to staging and nothing else. Production's token was refused for staging (HTTP 403, run 35967139925), and it is not widened. The workflow prints the token's kind and an 8-character fingerprint, never the value. So a replaced secret shows as a new fingerprint, and a token that can see production raises a warning.
3. **Coordinator: the migrations and the sign-in boundary.** Dispatch "staging · database and sign-in". It:
   - applies all migrations and checks the count against the repository;
   - writes the sign-in boundary: site URL, the one callback, sign-up off;
   - writes the email settings (sender "PINTAR Staging");
   - reads all of it back and asserts it.
4. **Yazid: Gladys, in the staging dashboard (two steps).** These are operator actions, so her email never passes through GitHub.
   1. Authentication → Users → Add user → Create new user. Enter Gladys's email and tick **Auto Confirm User**. Any long random password will do; she signs in by link, so nobody needs to know it.
   2. SQL Editor → run `select public.bootstrap_first_system_admin('<Gladys email>');`. It returns her person id, and it can only ever run once.
5. **Coordinator: initialise.** Done 24 Sep (run 35968916899): environment `production`, sample data off, SD and SMA real with 2026/2027, 1 SYSTEM_ADMIN.
   Originally: Dispatch the workflow again with **initialise** ticked. It sets the database's environment to `production` with sample data off (D-038: real schools and official evidence need it, so reports work), and creates SD and SMA with the 2026/2027 year.
6. **Gladys's team** signs in at the staging origin. Reports go through the tester form (D-037).

## Afterwards

- **App:** every push to `main` deploys to staging automatically (Vercel's Git connection).
- **Database:** every push to `main` that adds a migration runs the workflow, which applies it.
- **Load tests (C-06)** use this project at times when nobody is testing.

## Changing staging's address

Order matters, because the app builds its sign-in links from `NEXT_PUBLIC_APP_URL` and Next.js bakes it into the build:

1. **"staging · app origin on Vercel"** (`staging-app-origin.yml`): checks the domain is attached and verified on `pintar40-staging`, sets `NEXT_PUBLIC_APP_URL`, rebuilds the current production deployment (after any running build finishes), and checks `/masuk` answers 200 over valid TLS on the new address. DNS is never touched.
2. **"staging · database and sign-in"** (`staging.yml`) with `STAGING_ORIGIN` set to the new address: writes the site URL and the one callback, reads them back, and verifies live, including that a sign-in link asking for the previous address is not sent there.

## Custom-domain cutover: CLOSED (24 Sep)

Final state, each item verified by a run:

| Item | State | Evidence |
|---|---|---|
| Canonical origin | `https://staging.pintarselalu.com`; `/masuk` answers 200 over a verified certificate | runs 36060673692, 36061687932 |
| Vercel (`pintar40-staging`) | domains `staging.pintarselalu.com` (verified) and `pintar40-staging.vercel.app` (kept); `NEXT_PUBLIC_APP_URL` = the canonical origin, built in (deployment `dpl_2pHSpbMSByaeteFgYc94FMaB4Pat`) | run 36060673692 |
| Previous address | `pintar40-staging.vercel.app` redirects 308; `/masuk?cek=pengalihan&n=1` arrives at the same path and query on the canonical origin | run 36061687932 |
| Supabase Auth (staging) | site URL = the canonical origin; the one callback `https://staging.pintarselalu.com/auth/callback*`; sign-up off; email unchanged (`pintarselalu.com:465`, `noreply@pintarselalu.com`, "PINTAR Staging") | run 36060999323 |
| Live sign-in | a server-made sign-in link lands on `https://staging.pintarselalu.com/auth/callback`; one asking for the previous address is sent to the canonical origin instead; one platform admin (Gladys, by digest) | run 36060999323 |
| Isolation | the staging Supabase token is refused by production | run 36060999323 |

Not changed: production, DNS. Still open, as a D-039 hardening item and not part of this cutover: `VERCEL_TOKEN` is the account-wide Vercel token (it reaches both projects); the staging workflows use it against `pintar40-staging` only, by name. Email delivery itself is proven by the first real sign-in request.

