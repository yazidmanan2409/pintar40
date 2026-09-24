# Staging: the copy of PINTAR people test on (D-036)

| | |
|---|---|
| Supabase | `pintar-staging`, ref `keijhmdtsgrfvnvocfvk`, Singapore, Micro |
| Vercel | `pintar40-staging`, Git-connected to `main`, **Production environment only**, Ignored Build Step "Only build production" |
| Origin | `https://pintar40-staging.vercel.app` (to confirm after the first deploy) |
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
2. **Yazid: the GitHub secret.** Repo → Settings → Secrets and variables → Actions → `STAGING_SUPABASE_DB_URL`: staging's Connect → Session pooler URI, with the database password filled in.
3. **Coordinator: the migrations and the sign-in boundary.** Dispatch "staging · database and sign-in". It:
   - applies all migrations and checks the count against the repository;
   - writes the sign-in boundary: site URL, the one callback, sign-up off;
   - writes the email settings (sender "PINTAR Staging");
   - reads all of it back and asserts it.
4. **Yazid: Gladys, in the staging dashboard (two steps).** These are operator actions, so her email never passes through GitHub.
   1. Authentication → Users → Add user → Create new user. Enter Gladys's email and tick **Auto Confirm User**. Any long random password will do; she signs in by link, so nobody needs to know it.
   2. SQL Editor → run `select public.bootstrap_first_system_admin('<Gladys email>');`. It returns her person id, and it can only ever run once.
5. **Coordinator: initialise.** Dispatch the workflow again with **initialise** ticked. It sets the environment to `staging` with sample data off (production's posture), and creates SD and SMA with the 2026/2027 year.
6. **Gladys's team** signs in at the staging origin. Reports go through the tester form (D-037).

## Afterwards

- **App:** every push to `main` deploys to staging automatically (Vercel's Git connection).
- **Database:** every push to `main` that adds a migration runs the workflow, which applies it.
- **Load tests (C-06)** use this project at times when nobody is testing.
