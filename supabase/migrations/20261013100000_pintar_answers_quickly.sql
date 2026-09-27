-- BOB-18 (D-046) — PINTAR ANSWERS QUICKLY: the database halves.
--
-- Evidence: docs/coordination/perf/2026-09-27-staging-latency.md.
--
-- (b) THE LEARNER-RPC ASSERT SCALES. `assert_learner_rpcs_are_guarded` (0037)
--     built its call graph by testing every public function's source against
--     every other function's name with a fresh regular expression: one regex
--     per PAIR, quadratic in the number of functions. On staging's 344
--     functions it took 26.9 s, against the 8 s `statement_timeout` for signed-
--     in calls, so `platform_schema_lint` answered 500 on every Konfigurasi load.
--
--     THE SAME EDGES, FOUND ONCE. `\mNAME\M` matches when NAME is a whole run
--     of word characters (`[[:alnum:]_]`, the class `\m` and `\M` use) in the
--     source. So each source is split ONCE into its maximal runs of word
--     characters and joined to the function names by equality: one split per
--     function and a hash join, not one regex per pair. The edges are the same
--     set -- measured on a database carrying every migration: 606 edges both
--     ways, none in one and not the other. A name holding any other character
--     (none today) keeps the old regex test, so even that case cannot differ.
--     Comment stripping, the roots, the six-call walk, the two ownership checks
--     and the detail lines are unchanged, character for character.
--
-- (c) STUDIO ASKS ITS CAPABILITIES IN ONE CALL. `studio_capabilities` is the
--     loop `studioInstitutions()` ran in the app -- 8 capabilities per school,
--     each a round trip -- moved into one statement. It is SECURITY INVOKER, so
--     it reads `role_assignments` and `institutions` under the caller's own RLS
--     exactly as the app's reads did, and every answer is still
--     `can_in_institution`, the primitive the policies use. Nothing is inferred
--     from a role name.

-- ---------------------------------------------------------------------------
-- (b)
-- ---------------------------------------------------------------------------
create or replace function public.assert_learner_rpcs_are_guarded()
returns table (ok boolean, detail text)
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare bad text; n_roots int;
begin
  with recursive fn as (
    select (p.proname::text collate "default") as proname,
           regexp_replace(regexp_replace(coalesce(p.prosrc,''), '--[^\n]*', '', 'g'),
                          '/\*.*?\*/', '', 'g') as src
      from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
     where ns.nspname = 'public' and p.prokind = 'f'
  ),
  -- each source's whole words, split once
  word as materialized (
    select distinct f.proname as caller, w.word
      from fn f cross join lateral regexp_split_to_table(f.src, '[^[:alnum:]_]+') as w(word)
  ),
  name as (select distinct proname from fn),
  edge as materialized (
    select distinct w.caller, n.proname as callee
      from word w join name n on n.proname = w.word and n.proname <> w.caller
     where n.proname ~ '^[[:alnum:]_]+$'
    union
    -- a name a word split cannot hold keeps 0037's test
    select distinct f.proname, n.proname
      from fn f join name n on n.proname <> f.proname and n.proname !~ '^[[:alnum:]_]+$'
       and f.src ~ ('\m' || n.proname || '\M')
  ),
  roots as (
    select r.function_name as root, r.function_name as node, 0 as depth
      from public.client_rpc_registry r where r.exposure = 'LEARNER'
  ),
  reach as (
    select root, node, depth from roots
    union
    select x.root, e.callee, x.depth + 1
      from reach x join edge e on e.caller = x.node
     where x.depth < 6
  ),
  verdict as (
    select r.root, bool_or(r.node in ('current_person_id','session_is_mine')) as guarded
      from reach r group by r.root
  )
  select string_agg(v.root, ', ' order by v.root), count(*)
    into bad, n_roots
    from verdict v where not v.guarded;

  select count(*) into n_roots from public.client_rpc_registry where exposure = 'LEARNER';
  ok := bad is null;
  detail := case when ok then format(
      '%s LEARNER RPC(s) each reach current_person_id() or session_is_mine() within 6 calls. '
      || 'Reachability is a comment-stripped text walk over prosrc, not a parser: it is a gate against '
      || 'an entry point that forgets the check, not a proof that the check is correct.', n_roots)
    else 'LEARNER RPC(s) that never reach an ownership check: ' || bad end;
  return next;
end $$;
revoke all on function public.assert_learner_rpcs_are_guarded() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- (c)
-- ---------------------------------------------------------------------------
create function public.studio_capabilities(p_capabilities text[])
returns table (institution_id uuid, name text, capabilities text[])
language sql stable security invoker set search_path = public, pg_temp as $$
  -- The schools asked about are the ones the app asked about: every school in
  -- a grant this reader can see that is still in force, and every school for
  -- a platform admin. Each capability is then asked of can_in_institution.
  with kandidat as (
    select ra.institution_id as id
      from public.role_assignments ra
     where ra.revoked_at is null and ra.valid_until > now() and ra.institution_id is not null
    union
    select i.id from public.institutions i where public.is_system_admin()
  )
  select k.id, coalesce(i.name, k.id::text), array_agg(c.cap order by c.nomor)
    from kandidat k
    left join public.institutions i on i.id = k.id
    cross join lateral unnest(p_capabilities) with ordinality as c(cap, nomor)
   where public.can_in_institution(c.cap, k.id)
   group by k.id, i.name
$$;
revoke all on function public.studio_capabilities(text[]) from public, anon;
grant execute on function public.studio_capabilities(text[]) to authenticated;
insert into public.client_rpc_registry values
  ('studio_capabilities', 'STAFF', 'BOB-18: the Studio capability loop in one call; each answer is can_in_institution under the caller''s RLS');

-- ---------------------------------------------------------------------------
-- Terminal verification.
-- ---------------------------------------------------------------------------
do $$
declare v_ok boolean; v_detail text; t0 timestamptz := clock_timestamp();
begin
  select a.ok, a.detail into v_ok, v_detail from public.assert_learner_rpcs_are_guarded() a;
  if not v_ok then raise exception 'BOB-18: %', v_detail; end if;
  if clock_timestamp() - t0 > interval '5 seconds' then
    raise exception 'BOB-18: assert_learner_rpcs_are_guarded still takes %', clock_timestamp() - t0;
  end if;
  if has_function_privilege('anon', 'public.studio_capabilities(text[])', 'execute') then
    raise exception 'BOB-18: anon can execute studio_capabilities';
  end if;
end $$;
