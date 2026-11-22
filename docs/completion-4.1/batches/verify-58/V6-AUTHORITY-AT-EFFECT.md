# Verification 6 · Authority at effect: grant expiry and platform suspension (F05)

Agent verification, 22 Nov 2026. Ruling 58. Run on `origin/main` `706fe8c5`, scratch database as in V1 §Setup.

## Finding: PARTLY CONFIRMED. Every act checks its own actor at effect; suspension rests on one per-request hook; an earlier party's authority is not re-checked

| Mechanism | When it is checked | Evidence |
|---|---|---|
| **Grant expiry and revocation** | at every call: `can_on_node`, `can_in_institution`, `has_scope`, `is_system_admin` all require `revoked_at is null and now() >= valid_from and now() < valid_until` | `20260912004431`:51, 77; `20260912112712`:50 |
| **Platform suspension** (`tangguhkan_akun`) | ends the person's device sessions, bans the Auth user, and **PostgREST's pre-request** `pintar_permintaan.periksa` refuses every request of a suspended person (`PT403 AKUN_DITANGGUHKAN`; set by `alter role authenticator set pgrst.db_pre_request`) | `20270113130000`:1–10, 475 |
| **What the capability helpers know of suspension** | nothing: a suspended person's grants stay live; the helpers do not ask `orang_ditangguhkan` | catalogue read |
| **The app** | no authority cache: `react` `cache` is per request; every server action calls an RPC as the signed-in user; the service-role routes (certificates, sign-in flows) first check ownership or authority with the caller's own client, which passes the pre-request | `src/lib/supabase/service.ts`; `src/app/api/certificates/issue/route.ts`; `src/app/api/sertifikat/ganti/route.ts`:44–48 |
| **School-level suspension** | none exists as a state: no function writes `institutions.is_active` and the capability helpers do not read it; a school's own act is ending a grant or an enrolment, both checked at effect | `20261110100000`:10–24 |

## Reproduction (scratch clone; same token and device session throughout; each step its own transaction)

| Step | Result |
|---|---|
| A1 · class EDUCATOR: `metric_evaluate('learner.result', learner, school, catalogue)` | `ok` |
| A2 · the grant's `valid_until` set to `clock_timestamp() + 2 s` (owner); `pg_sleep(3)`; same call | **`not_permitted`** |
| A3 · grant extended again; same call | `ok` |
| B · `tangguhkan_akun(teacher, 'ADMINISTRATIVE', null)` as `sysadmin@…` | suspended; `auth.users.banned_until` in the future |
| B1 · the teacher's claims, `request.path = '/rpc/metric_evaluate'`, `pintar_permintaan.periksa()` | **`AKUN_DITANGGUHKAN`** |
| B2 · the same `metric_evaluate` called directly, without the pre-request step | **`ok`**: the function itself still answers |
| C′ · school S asks a transfer (`transfer_minta`), school B accepts (`transfer_terima`); S's requesting administrator is then suspended **and** their grant lapses; B's administrator calls `transfer_execute` | **executed**: new ACTIVE enrolment at B, `consent = {}`, `portable_visibility` written |
| C · as C′, but S moves the class up (`kenaikan_tetapkan`, NAIK) before execution | the transfer stays `AUTHORIZED`; `transfer_execute` fails with the raw `a closed enrollment is immutable` |

## What it means

- **No path was found that acts after expiry or suspension through the product's own entry points.** Expiry is
  checked at effect, to the second; a suspended person's token is refused before any function runs.
- **The suspension guarantee has one layer.** Any future path that runs a user's claims without PostgREST's
  pre-request (a direct database connection, a job acting for a person, a misconfigured gateway) would still act: B2.
- **A multi-party act checks only whoever completes it.** C′: a transfer requested by an administrator who is now
  suspended and whose grant has lapsed is still carried out by the other school. That may well be the intended rule
  (the request was valid when made), but it is not written down, and it joins OD-9.
- Not verified: a running PostgREST honouring the `authenticator` setting (read from `pg_roles`, not exercised over HTTP).

## Classification

- **Severity:** Medium for staff and transfers; none found for learners.
- **Proposed: 4.5** (F05 was already "→ 4.2", which ruling 72 folds into 4.5): an `orang_ditangguhkan` check inside
  the shared capability helpers as a second layer, and the written rule for C′. The stranded transfer (C) is V5's 4.5
  item.
