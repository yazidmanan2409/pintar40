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
