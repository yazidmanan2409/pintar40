# V6 · Is there a `PGRST_DB_PRE_REQUEST` override on the hosted API server? (Bob, 24 Nov 2026)

**The question (Sharon's V6 limit):**
- The database check (`v6-pre-request.sql`) sees only the in-database setting `authenticator: pgrst.db_pre_request`.
- An environment variable on Supabase's hosted PostgREST server is invisible to SQL.

**What the owner found (24 Nov):** the dashboard (Integrations → Data API → Settings) shows **no `PGRST_DB_PRE_REQUEST` setting anywhere**. The hosted dashboard does not expose PostgREST's environment.

**Documentation:**
- PostgREST's configuration-precedence page could not be read from this session (`docs.postgrest.org` and `supabase.com` are not allowed hosts).
- At the owner's standing instruction, network access was **not** widened. So this note does **not** rely on what the documentation says.
- It relies on **behaviour observed in the database**, which is authoritative whatever the precedence rules are.

## 1 · Direct evidence: what PostgREST actually executes (read-only, staging, 24 Nov 00:18–00:20Z)

1. **Settings:** `pg_db_role_setting` for `authenticator` holds `pgrst.db_pre_request=pintar_permintaan.periksa` (the in-database setting).
2. **Calls:** `extensions.pg_stat_statements` (v1.11) records the statement **`select "pintar_permintaan"."periksa"()`**, in exactly the quoted form PostgREST generates for its pre-request call:
   - `authenticated`: 171,759 calls;
   - `service_role`: 3,844 calls;
   - `anon`: 2,058 calls.

   These are the request roles PostgREST switches to, so this is the API server running **our** pre-request on real requests.
3. **No other pre-request has ever run:**
   - The statistics cover **every request since 2026-09-24 05:43Z** (`stats_reset`, the project's creation).
   - In that window, **no other statement of the pre-request shape** (`select "<schema>"."<function>"()`) was run by `anon`, `authenticated` or `service_role`: **none**.
   - An override naming a different function would have appeared here.
4. **Snapshot:** at 2026-11-24 00:20:16Z the total was **177,661** calls.

**What this proves:**
- PostgREST's effective pre-request is `pintar_permintaan.periksa`; any other configured function would have left its own call shape.
- What it cannot yet show by itself is that the pre-request is still running **after** the promotion. An override that *disabled* the pre-request would show as calls stopping. Step 2 below closes that gap.

## 2 · Closing it: one request after the promotion (needs the owner's one action, no configuration change)

1. **The owner opens the staging app once** (any page that loads data, signed in or not), or names a moment when staging had real use after 00:07Z.
2. **Bob re-reads the counter, read-only.** If it is **above 177,661**, the pre-request ran after the promotion, so there is no disabling override.
3. Recorded here, for Sharon.

## 3 · If Sharon wants the provider's word as well

**A Supabase support confirmation (the owner submits it).** Suggested text:

> For project `keijhmdtsgrfvnvocfvk`, please confirm that the hosted PostgREST (Data API) service has no `PGRST_DB_PRE_REQUEST` environment variable or other configuration override set, so that the in-database setting `ALTER ROLE authenticator SET pgrst.db_pre_request = 'pintar_permintaan.periksa'` is the effective pre-request. We are asking for confirmation only; please do not change anything.

This is secondary. §1 and §2 already show what the server actually does.

## 4 · Recommendation (for Sharon's review)

V6's hosted condition is met by **observed behaviour**:
- the configured function is the one PostgREST runs (§1);
- after §2, it is shown to still run after the promotion.

The support confirmation is optional corroboration. **Z's staging acceptance stays pending until Sharon reviews this.**

No configuration was changed. Every read was in `set transaction read only`.

## 5 · §2 closed, and Sharon's verdict (24 Nov 2026)

**The owner's request (§2):**
- About 00:23Z, the owner signed in to staging with a staff account, opened the school selection, selected SD Golden School GS-001, and loaded Konfigurasi.
- No configuration was changed.

**The re-read** (read-only, 00:24:21Z): `select "pintar_permintaan"."periksa"()` totals **177,809** across the request roles. That is **+148 over the 177,661 baseline** taken at 00:20:16Z.

**So the pre-request ran on requests made after the promotion: there is no disabling override.**

**Sharon's verdict** (addendum in Z2-8614bd26.md):
- The evidence meets V6's hosted condition once this re-read shows the count above 177,661. Support's confirmation is not required.
- She asked for one more check: the md5 of `pg_get_functiondef('pintar_permintaan.periksa()')` on staging against a local 308 build.
  - **Staging:** `2b4a0444fbd36007341a536916fe14a0`.
  - **Local 308:** requested from Second Eye; recorded below.
  - **Local 308 (Second Eye, 24 Nov 00:28Z):** `2b4a0444fbd36007341a536916fe14a0`. **Identical to staging.**
    - Built from `claude/z` `a8d9ff27`, whose tree is byte-identical to main `61a6ff9e` (empty diff).
    - Freshly reset local database: 308 migrations, the last `20270123170000`.

**V6's hosted condition is met.** The pre-request ran after the promotion, and the function it runs is byte-for-byte the one main installs. By Sharon's stated terms, her side of Z's staging acceptance is complete; she records the number herself.
