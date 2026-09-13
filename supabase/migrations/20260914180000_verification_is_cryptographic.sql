-- 0051 — the public verification route now verifies.
--
-- THE FINDING, from Claude 1's review, measured on the live project and
-- accepted in full. `verify_certificate` read `pass` and `predikat` out of
-- `canonical_payload` and `validity` out of `certificates.status`. **It never
-- touched `signature`.** So INV-05's guarantee -- altering any protected field
-- must fail verification -- did not hold on the one route a printed QR code
-- points at. Alter the stored payload and the public page reported BERLAKU.
--
-- The tamper matrix passed the whole time because it exercised a DIFFERENT
-- verifier: the TypeScript `verifyWithKey`, over payloads the test itself
-- built. Two verification paths of unequal strength, which is precisely the
-- shape INV-38 and INV-26 exist to prevent. F04-S04 narrowed the gap by signing
-- an SQL-built payload with the real crypto, and still did not close it,
-- because the public route called neither.
--
-- THE BLOCKER I CLAIMED WAS NOT ESTABLISHED. The FABLE-04 completion report
-- said closing this "needs a fourth database principal". It does not. F01-S03
-- restricts `@/lib/supabase/service` to `src/app/api/**` -- it does not forbid
-- it there, and `/api/assets/read-url` has worked exactly that way since
-- FABLE-01. The rule caught the *page* importing the service client; the fix is
-- to move the privileged read to where the rule already allows it, not to
-- weaken the rule and not to invent a principal. I anchored on the wrong option
-- and recorded a design decision as an architectural constraint. ADR-0013.
--
-- WHAT CHANGES HERE, AND WHY EACH PIECE.
--
-- 1. `certificate_verification_material(p_token)` returns the three things a
--    recomputation needs and nothing else: the stored canonical payload, the
--    stored signature, and the key version. It is SECURITY DEFINER with NO
--    client grant -- `service_role` reaches it, which is the API route, and
--    nobody else. The payload carries `result.score` and the identity snapshot
--    hash, so it must never be anon-reachable; D3b is unaffected because this
--    function feeds the recomputation, not the response.
--
-- 2. **`verify_certificate` loses its anon grant.** This is the part that
--    matters. A projection that reports BERLAKU without checking a signature
--    must not be independently callable, or the defect simply moves from the
--    page to the RPC. With the grant gone there is exactly ONE flow: token →
--    the canonical route → the API boundary → recompute → the closed five-field
--    response. `verify_certificate` stays as the single definition of the D3b
--    projection -- still asserted by set equality on its OUT parameters -- and
--    is now internal like every other certificate function.
--
--    That reverses ADR-0012, which followed §9's "registered in
--    `client_rpc_registry`" mechanism. §9's PURPOSE was a declared, minimal,
--    closed anonymous surface; that purpose is better served by a surface that
--    actually verifies. `functions_executable_by_anon` returns to **0**, so
--    §13's regression row is met after all, and the deviation the report
--    recorded is withdrawn rather than defended. ADR-0013 supersedes ADR-0012.
--
-- 3. The public surface registry gains an ENDPOINT kind and a `parent` column.
--    `/api/verifikasi/[token]` is anonymously reachable over HTTP and saying
--    otherwise would be the dishonest version of this change. It is declared,
--    and it is attributed to the ROUTE it serves, because it returns the
--    identical five fields for the identical token -- the same surface at a
--    second spelling, not a second surface. `anon_public_surface` counts
--    distinct surfaces and is 2, as §13 requires; a new counter
--    `anon_reachable_http_paths` counts the spellings (2) so the pair is
--    visible rather than folded away.
--
-- 4. **The certificate read policy is narrowed to doc 05.** The policy was
--    `person_id = current_person_id() OR can_in_institution('CAN_ASSIGN_LEARNING', …)`.
--    Doc 05 §Certificates, row "Read own certificate", reads:
--
--      STUDENT ✅ (own only, incl. classroom-card identity) | EDUCATOR ❌ |
--      HoD ❌ | DEAN ❌ | INST_ADMIN ❌ | SYS_ADMIN ❌ | SERVICE ✅
--
--    Every staff role is ❌. There is no institution-wide certificate read in
--    the matrix, and the identity snapshot is identity data about a named
--    learner, so it is narrowed with it. Revocation is unaffected: INST_ADMIN's
--    ✅ is on the *Revoke* row, `revoke_certificate` is SECURITY DEFINER and
--    gated on `CAN_PUBLISH`, and it never needed table SELECT.

-- ---------------------------------------------------------------------------
-- 1. The material a recomputation needs. Internal only.
-- ---------------------------------------------------------------------------
create function public.certificate_verification_material(p_token text)
returns table (canonical_payload jsonb, signature text, key_version smallint)
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_c public.certificates;
begin
  -- the same refusals as the projection, in the same order, so the two cannot
  -- disagree about which tokens resolve at all
  if p_token is null or length(p_token) < 43 then return; end if;
  select * into v_c from public.certificates c where c.verification_token = p_token;
  if v_c.id is null then return; end if;
  if v_c.status = 'ELIGIBLE' then return; end if;
  canonical_payload := v_c.canonical_payload;
  signature         := v_c.signature;
  key_version       := v_c.key_version;
  return next;
end $$;
revoke all on function public.certificate_verification_material(text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. The projection stops being an independent answer.
-- ---------------------------------------------------------------------------
revoke execute on function public.verify_certificate(text) from anon;
delete from public.client_rpc_registry where function_name = 'verify_certificate';

-- ---------------------------------------------------------------------------
-- 3. The registry learns what actually sits in front of the database.
-- ---------------------------------------------------------------------------
alter table public.public_surface_registry
  add column if not exists parent text references public.public_surface_registry(surface);
alter table public.public_surface_registry drop constraint public_surface_registry_kind_check;
alter table public.public_surface_registry
  add constraint public_surface_registry_kind_check check (kind in ('VIEW','RPC','ROUTE','ENDPOINT'));
alter table public.public_surface_registry
  add constraint public_surface_registry_parent_shape
  check ((kind = 'ENDPOINT') = (parent is not null));

delete from public.public_surface_registry where surface = 'certificate_verification_rpc';
update public.public_surface_registry
   set note = 'FABLE-04 §9 / INV-38: the one verifier-facing public verification URL. '
           || 'It renders what its endpoint returns; the endpoint is where the signature is recomputed.'
 where surface = 'certificate_verification';
insert into public.public_surface_registry (surface, kind, object, note, parent) values
  ('certificate_verification_api', 'ENDPOINT', '/api/verifikasi/[token]',
   'The data endpoint behind the canonical route. Holds the service-role client (F01-S03 permits it under '
|| 'src/app/api/), recomputes the HMAC over the STORED payload with a timing-safe compare, and returns the '
|| 'same closed five-field response as the route. Anonymously reachable, and declared as such.',
   'certificate_verification');

-- ---------------------------------------------------------------------------
-- 4. Doc 05: a certificate is readable by its holder and by SERVICE. Nobody else.
-- ---------------------------------------------------------------------------
drop policy certificates_select on public.certificates;
create policy certificates_select on public.certificates for select to authenticated
  using (person_id = public.current_person_id());
drop policy snapshots_select on public.certificate_identity_snapshots;
create policy snapshots_select on public.certificate_identity_snapshots for select to authenticated
  using (person_id = public.current_person_id());

-- ---------------------------------------------------------------------------
-- 5. The assertion follows the design.
-- ---------------------------------------------------------------------------
create or replace function public.assert_public_surface()
returns table (ok boolean, detail text)
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare bad text; problems text[] := '{}'; n int;
begin
  -- (a) VIEW surfaces: anon's table grants, both directions
  select string_agg(distinct g.table_name, ', ') into bad
    from information_schema.role_table_grants g
   where g.table_schema = 'public' and g.grantee = 'anon'
     and not exists (select 1 from public.public_surface_registry r
                      where r.kind = 'VIEW' and r.object = 'public.' || g.table_name);
  if bad is not null then problems := problems || ('undeclared anon-readable object(s): ' || bad); end if;

  select string_agg(r.surface, ', ') into bad from public.public_surface_registry r
   where r.kind = 'VIEW'
     and not exists (select 1 from information_schema.role_table_grants g
                      where g.table_schema='public' and g.grantee='anon'
                        and 'public.' || g.table_name = r.object);
  if bad is not null then problems := problems || ('declared surface(s) that are not anon-readable: ' || bad); end if;

  -- (b) RPC surfaces: anon executes nothing that is not declared, and every
  --     declared RPC is really anon-executable. Both directions still, even
  --     though the class is empty after 0051 -- an empty set equality is what
  --     makes the NEXT anon grant fail rather than pass unnoticed.
  select string_agg(distinct p.oid::regprocedure::text, ', ') into bad
    from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
   where ns.nspname = 'public' and has_function_privilege('anon', p.oid, 'EXECUTE')
     and not exists (select 1 from public.public_surface_registry r
                      where r.kind = 'RPC' and to_regprocedure(r.object) = p.oid);
  if bad is not null then problems := problems || ('undeclared anon-executable function(s): ' || bad); end if;

  select string_agg(r.surface, ', ') into bad from public.public_surface_registry r
   where r.kind = 'RPC'
     and not exists (select 1 from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
                      where ns.nspname = 'public' and to_regprocedure(r.object) = p.oid
                        and has_function_privilege('anon', p.oid, 'EXECUTE'));
  if bad is not null then problems := problems || ('declared RPC surface(s) anon cannot execute: ' || bad); end if;

  -- (c) a PUBLIC classification and an anon grant imply each other
  select string_agg(distinct p.proname || ' (' || coalesce(r.exposure::text, 'unclassified') || ')', ', ') into bad
    from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
    left join public.client_rpc_registry r on r.function_name = p.proname
   where ns.nspname = 'public' and has_function_privilege('anon', p.oid, 'EXECUTE')
     and coalesce(r.exposure::text, '') <> 'PUBLIC';
  if bad is not null then problems := problems || ('anon-executable function not classified PUBLIC: ' || bad); end if;
  select string_agg(r.function_name, ', ') into bad from public.client_rpc_registry r
   where r.exposure = 'PUBLIC'
     and not exists (select 1 from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
                      where ns.nspname='public' and p.proname = r.function_name
                        and has_function_privilege('anon', p.oid, 'EXECUTE'));
  if bad is not null then problems := problems || ('classified PUBLIC but not anon-executable: ' || bad); end if;

  -- (d) anon holds no write anywhere
  select string_agg(g.table_name || ':' || g.privilege_type, ', ') into bad
    from information_schema.role_table_grants g
   where g.table_schema='public' and g.grantee='anon' and g.privilege_type <> 'SELECT';
  if bad is not null then problems := problems || ('anon holds a non-SELECT grant: ' || bad); end if;

  -- (e) D3b: the verification path never reads identity, in EITHER function
  foreach bad in array array['verify_certificate','certificate_verification_material'] loop
    if pg_get_functiondef(('public.' || bad || '(text)')::regprocedure)
         ~* '(name_as_issued|photo_path|photo_content_hash|display_name)' then
      problems := problems || (bad || ' reads an identity column; D3b excludes it structurally');
    end if;
  end loop;
  -- ... and the projection returns exactly the five enumerated fields
  select string_agg(u.n, ',' order by u.ord) into bad
    from pg_proc p
    join pg_namespace ns on ns.oid = p.pronamespace,
         lateral unnest(p.proargnames, p.proargmodes) with ordinality as u(n, m, ord)
   where ns.nspname='public' and p.proname='verify_certificate' and u.m = 't';
  if bad is distinct from 'pass,predikat,institution,date,validity' then
    problems := problems || ('the verification payload is not the enumerated five fields: ' || coalesce(bad,'<none>'));
  end if;

  -- (f) ADDED IN 0051. The material function exists, carries the signature, and
  --     is reachable by no client role. Without it the route cannot verify;
  --     with it client-reachable, the payload would be public.
  if to_regprocedure('public.certificate_verification_material(text)') is null then
    problems := problems || 'certificate_verification_material is gone; the route has nothing to verify against'::text;
  else
    if pg_get_functiondef('public.certificate_verification_material(text)'::regprocedure) !~ '\ysignature\y' then
      problems := problems || 'certificate_verification_material does not return the signature'::text;
    end if;
    select string_agg(rr.rolname, ', ') into bad
      from unnest(array['anon','authenticated']) rr(rolname)
     where has_function_privilege(rr.rolname, 'public.certificate_verification_material(text)'::regprocedure, 'EXECUTE');
    if bad is not null then
      problems := problems || ('the verification material is reachable by ' || bad || '; the signed payload is not public');
    end if;
  end if;
  -- and the projection itself is no longer an independent public answer
  select string_agg(rr.rolname, ', ') into bad
    from unnest(array['anon','authenticated']) rr(rolname)
   where has_function_privilege(rr.rolname, 'public.verify_certificate(text)'::regprocedure, 'EXECUTE');
  if bad is not null then
    problems := problems || ('verify_certificate is executable by ' || bad
                          || '; it reports validity without checking a signature and must not be a second path');
  end if;

  -- (g) every declared ENDPOINT belongs to a declared ROUTE
  select string_agg(r.surface, ', ') into bad from public.public_surface_registry r
   where r.kind = 'ENDPOINT'
     and not exists (select 1 from public.public_surface_registry p2
                      where p2.surface = r.parent and p2.kind = 'ROUTE');
  if bad is not null then problems := problems || ('endpoint(s) with no declared route: ' || bad); end if;

  select count(*) into n from public.public_surface_registry where parent is null;
  ok := array_length(problems, 1) is null;
  detail := case when ok then format(
      '%s distinct anon-reachable surface(s): %s. anon executes no function at all and holds SELECT only; the '
      || 'signed payload and the signature are reachable by no client role, so the only path that reports '
      || 'validity is the one that recomputes the HMAC. The projection is exactly '
      || '{pass, predikat, institution, date, validity} and neither verification function reads an identity column.',
      n, (select string_agg(r.surface || ' (' || r.kind || ')', ', ' order by r.surface)
            from public.public_surface_registry r where r.parent is null))
    else array_to_string(problems, '; ') end;
  return next;
end $$;
revoke all on function public.assert_public_surface() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 6. The counters follow too.
-- ---------------------------------------------------------------------------
create or replace function public.platform_schema_lint() returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v jsonb := '{}'::jsonb; n int; txt text; v_ok boolean;
begin
  if not public.is_system_admin() then raise exception 'SYSTEM_ADMIN required'; end if;
  select count(*) into n from pg_tables where schemaname='public' and not rowsecurity;
  v := v || jsonb_build_object('tables_without_rls', n);
  select count(*) into n from pg_policies where schemaname='public' and (qual = 'true' or with_check = 'true');
  v := v || jsonb_build_object('policies_using_true', n);
  select count(*) into n from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and p.prosecdef
     and not exists (select 1 from unnest(coalesce(p.proconfig,'{}')) c where c like 'search_path=%');
  v := v || jsonb_build_object('secdef_without_search_path', n);
  select count(*) into n from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and p.prokind in ('f','p')
     and not exists (select 1 from unnest(coalesce(p.proconfig,'{}')) c where c like 'search_path=%');
  v := v || jsonb_build_object('functions_without_search_path', n);
  select count(*) into n from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and p.prosecdef
     and (has_function_privilege('authenticated', p.oid, 'EXECUTE')
       or has_function_privilege('anon', p.oid, 'EXECUTE'))
     and not exists (select 1 from public.client_rpc_registry r where r.function_name = p.proname);
  v := v || jsonb_build_object('unclassified_client_rpcs', n);
  select a.ok into v_ok from public.assert_learner_rpcs_are_guarded() a;
  v := v || jsonb_build_object('learner_rpcs_guarded_ok', v_ok);
  select count(*) into n from (
    select p.proname from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
     where ns.nspname='public' and p.prosecdef
       and (has_function_privilege('authenticated', p.oid, 'EXECUTE')
         or has_function_privilege('anon', p.oid, 'EXECUTE'))
     group by p.proname having count(*) > 1) x;
  v := v || jsonb_build_object('overloaded_client_rpcs', n);
  select a.ok into v_ok from public.assert_evidence_consumer_boundary() a;
  v := v || jsonb_build_object('evidence_consumer_boundary_ok', v_ok);
  select a.ok into v_ok from public.assert_mode_policy_complete() a;
  v := v || jsonb_build_object('mode_policy_complete_ok', v_ok);
  select a.ok into v_ok from public.assert_integrity_never_scores() a;
  v := v || jsonb_build_object('integrity_never_scores_ok', v_ok);
  select count(*) into n from public.institutions where is_official_bootstrap;
  v := v || jsonb_build_object('official_bootstrap_tenants', n);
  select count(*) into n from public.institutions where not is_synthetic;
  v := v || jsonb_build_object('non_synthetic_institutions', n);
  select a.ok into v_ok from public.assert_official_evidence_bootstrap() a;
  v := v || jsonb_build_object('official_bootstrap_ok', v_ok);
  select count(*) into n from public.evidence_class_overrides;
  v := v || jsonb_build_object('evidence_class_overrides', n);

  select count(*) into n from public.public_surface_registry;
  v := v || jsonb_build_object('declared_public_surfaces', n);
  select a.ok into v_ok from public.assert_public_surface() a;
  v := v || jsonb_build_object('public_surface_ok', v_ok);

  select count(*) into n from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and has_function_privilege('anon', p.oid, 'EXECUTE');
  v := v || jsonb_build_object('functions_executable_by_anon', n);
  select count(*) into n from information_schema.role_table_grants
   where table_schema='public' and grantee='anon' and table_name <> 'published_lessons';
  v := v || jsonb_build_object('anon_table_grants', n);
  select count(*) into n from information_schema.role_table_grants
   where table_schema='public' and grantee='anon'
     and table_name = 'published_lessons' and privilege_type <> 'SELECT';
  v := v || jsonb_build_object('anon_public_view_write_grants', n);
  -- CHANGED IN 0051. 0048 counted anon's tables plus anon's functions, which
  -- was the honest count while the projection was anon-executable. It is not
  -- any more, and a catalogue-only count would now report 1 while a stranger
  -- can still reach certificate verification over HTTP -- narrower than the
  -- exposure, the dishonest direction. It counts DECLARED distinct surfaces:
  -- a ROUTE and its ENDPOINT are one surface because they return the identical
  -- response for the identical token. assert_public_surface() ties each
  -- declared surface to something real, and F04-S01 does the same for the
  -- ROUTE and ENDPOINT rows against the filesystem.
  select count(*) into n from public.public_surface_registry where parent is null;
  v := v || jsonb_build_object('anon_public_surface', n);
  -- ADDED IN 0051. The spellings, not the surfaces, so the pair is never hidden.
  select count(*) into n from public.public_surface_registry where kind in ('ROUTE','ENDPOINT');
  v := v || jsonb_build_object('anon_reachable_http_paths', n);
  select count(*) into n from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and has_function_privilege('anon', p.oid, 'EXECUTE')
     and not exists (select 1 from public.client_rpc_registry r
                      where r.function_name = p.proname and r.exposure = 'PUBLIC');
  v := v || jsonb_build_object('undeclared_anon_functions', n);
  select count(*) into n from storage.buckets where public;
  v := v || jsonb_build_object('public_buckets', n);
  select count(*) into n from pg_policies
   where schemaname='storage' and tablename='objects'
     and (roles::text like '%anon%' or roles::text like '%public%' or roles::text like '%authenticated%');
  v := v || jsonb_build_object('client_storage_policies', n);
  select count(*) into n from information_schema.columns
   where table_schema='public' and table_name='persons'
     and column_name in ('institution_id','class_id','cohort_id','node_id');
  v := v || jsonb_build_object('persons_institution_columns', n);
  select count(*) into n from information_schema.role_table_grants
   where table_schema='public' and table_name='audit_log' and privilege_type in ('UPDATE','DELETE','TRUNCATE')
     and grantee in ('anon','authenticated','service_role');
  v := v || jsonb_build_object('audit_log_client_write_grants', n);
  select count(*) into n from public.org_nodes
   where cardinality(jalur) = 0 or jalur[cardinality(jalur)] <> id;
  v := v || jsonb_build_object('malformed_jalur', n);
  select environment into txt from public.platform_environment;
  v := v || jsonb_build_object('environment', txt);
  select count(*) into n from supabase_migrations.schema_migrations;
  v := v || jsonb_build_object('migrations_applied', n);
  return v;
end $$;
revoke all on function public.platform_schema_lint() from public, anon;
grant execute on function public.platform_schema_lint() to authenticated;

-- ---------------------------------------------------------------------------
-- Terminal verification.
--
-- Structural where the fixture does not exist yet (a migration runs before the
-- seeds -- 0046's lesson, now ADR-0014), behavioural everywhere it can be. The
-- end-to-end proof that a tampered stored payload makes the REAL public flow
-- report an invalid certificate is F04-S05, which drives the route handler.
-- ---------------------------------------------------------------------------
do $$
declare v_ok boolean; v_detail text; n int;
begin
  select a.ok, a.detail into v_ok, v_detail from public.assert_public_surface() a;
  if not v_ok then raise exception 'public surface: %', v_detail; end if;

  -- anon executes nothing at all again
  select count(*) into n from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and has_function_privilege('anon', p.oid, 'EXECUTE');
  if n <> 0 then raise exception 'anon can still execute % function(s)', n; end if;

  -- and cannot reach the signed payload
  if has_function_privilege('anon', 'public.certificate_verification_material(text)'::regprocedure, 'EXECUTE')
     or has_function_privilege('authenticated', 'public.certificate_verification_material(text)'::regprocedure, 'EXECUTE') then
    raise exception 'the signed payload is reachable by a client role';
  end if;

  -- the material and the projection agree about which tokens resolve at all:
  -- neither returns anything for a short, unknown or unissued token
  select count(*) into n from public.certificate_verification_material(repeat('x', 43));
  if n <> 0 then raise exception 'an unknown token yielded verification material'; end if;
  select count(*) into n from public.certificate_verification_material('short');
  if n <> 0 then raise exception 'a malformed token yielded verification material'; end if;

  -- doc 05: a certificate is readable by its holder only
  foreach v_detail in array array['certificates_select','snapshots_select'] loop
    select pol.qual into v_detail from pg_policies pol
     where pol.schemaname='public' and pol.policyname = v_detail;
    if v_detail is null then raise exception 'a certificate read policy is missing'; end if;
    if v_detail ~ 'CAN_ASSIGN_LEARNING' then
      raise exception 'a certificate read policy still grants an institution-wide read; doc 05 says own-only: %', v_detail;
    end if;
    if v_detail !~ 'current_person_id' then
      raise exception 'a certificate read policy does not key on the caller: %', v_detail;
    end if;
  end loop;

  -- the ENDPOINT is declared and attributed
  select count(*) into n from public.public_surface_registry
   where kind = 'ENDPOINT' and parent = 'certificate_verification';
  if n <> 1 then raise exception 'the verification endpoint is not declared against its route (%)', n; end if;
  select count(*) into n from public.public_surface_registry where parent is null;
  if n <> 2 then raise exception 'expected 2 distinct anon-reachable surfaces, found %', n; end if;
end $$;
