-- 0074 -- the learner-facing projection stops depending on a table row.
--
-- FOUND BY THE HAPPY-PATH SWEEP, not by a failure. `sanitized_item` -- the
-- function that decides what a learner may see of a question -- has never
-- executed to a successful return under any migration, seed or test in this
-- build. It is NOT broken; it was read in full and it is correct. What the
-- sweep exposed is that nothing would have said so either way.
--
-- WHAT ACTUALLY PROTECTS THE ANSWER TODAY. `session_paper` builds a candidate
-- object from exactly four keys -- item_type, stem, stimulus, opsi -- and
-- `opsi` carries only a display position and the option body. Correctness
-- flags, rationales and misconception codes are not in the candidate at all.
-- That is exclusion BY CONSTRUCTION, and it is stronger than any allowlist.
--
-- THE ALLOWLIST IS THEREFORE NOT LOAD-BEARING TODAY -- AND THAT IS THE RISK.
-- `item_type_registry.sanitizer_allowlist` is DATA. All seven rows currently
-- name the same four keys the builder constructs, so it narrows nothing and
-- nobody would notice if it widened. It is not versioned, no assertion
-- constrains it, and widening it is an `update`: no migration, no ADR, no CI.
-- The day a fifth key enters the candidate builder, that row becomes the only
-- thing between a learner and the answer key, and a security boundary will be
-- sitting in a table anyone with the capability can edit.
--
-- This is §3.4's principle -- a threshold lives in the catalogue, versioned,
-- never in a component -- applied to a boundary instead of a number. The
-- repair is the same shape: make widening it a MIGRATION.

-- ---------------------------------------------------------------------------
-- The declared safe key set, as a constraint rather than a convention.
--
-- A CHECK rather than only an assertion, deliberately: an assertion reports
-- that the boundary moved, a constraint refuses to move it. Detection is what
-- this build already has too much of relative to prevention (ADR-0021).
-- ---------------------------------------------------------------------------
-- jsonb containment, not a subquery: a CHECK cannot carry one. `<@` on two
-- arrays is exactly "every element of the left appears in the right", verified
-- on all four cases that matter -- the exact set passes, a narrower set passes,
-- a widened set is refused, and an empty set passes the CHECK (which is why the
-- assertion below carries the empty case separately; containment cannot see it).
alter table public.item_type_registry
  add constraint item_type_registry_allowlist_is_declared
  check (sanitizer_allowlist <@ '["item_type", "stem", "stimulus", "opsi"]'::jsonb);

-- ---------------------------------------------------------------------------
-- `sanitized_item`: AUTHORIZE BEFORE ANSWERING ANYTHING, existence included.
--
-- The previous body resolved the presented item and raised 'unknown presented
-- item %' before any authorization ran, so a caller could distinguish a real
-- uuid from a fabricated one without owning the session. Practical exposure is
-- negligible -- the uuid is unguessable, so the oracle answers a question the
-- caller already knew -- and it is fixed here for its SHAPE, not its severity.
--
-- check-existence-then-authorize is the same inversion as the
-- check-deprecation-then-authorize that 0073 fixed in `metric_evaluate` one
-- migration ago. Two instances in two adjacent functions is a habit in how
-- these get written, not a slip. Authorization comes first, ahead even of a
-- "does this row exist" lookup, and both cases now answer identically so there
-- is no oracle left to read.
-- ---------------------------------------------------------------------------
create or replace function public.sanitized_item(p_presented_item uuid)
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $function$
declare v_session uuid; v jsonb;
begin
  select p.session_id into v_session from public.presented_items p where p.id = p_presented_item;
  -- ONE ANSWER FOR BOTH CASES. A missing item and an item belonging to someone
  -- else are indistinguishable from outside, which is the point.
  if v_session is null or not public.session_is_mine(v_session) then
    raise exception 'that item is not part of a session of yours';
  end if;
  select sp.muatan into v from public.session_paper(v_session) sp
   where sp.presented_item_id = p_presented_item;
  return v;
end $function$;
revoke all on function public.sanitized_item(uuid) from public, anon, authenticated;
grant execute on function public.sanitized_item(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- The boundary assertion.
-- ---------------------------------------------------------------------------
create function public.assert_learner_projection_is_closed()
returns table(ok boolean, detail text)
language plpgsql stable security definer set search_path = public, pg_temp as $function$
declare problems text[] := '{}'; bad text; n int; v_src text;
begin
  -- every allowlist is inside the declared set (the CHECK refuses a widening;
  -- this notices a dropped CHECK)
  select string_agg(distinct r.item_type::text || ':' || k.key, ', ') into bad
    from public.item_type_registry r,
         lateral jsonb_array_elements_text(r.sanitizer_allowlist) as k(key)
   where k.key not in ('item_type', 'stem', 'stimulus', 'opsi');
  if bad is not null then
    problems := problems || ('sanitizer allowlist names(s) outside the declared safe set: ' || bad);
  end if;
  select count(*) into n from pg_constraint
   where conname = 'item_type_registry_allowlist_is_declared';
  if n <> 1 then
    problems := problems || 'the allowlist constraint is gone: widening the learner projection is an update again'::text;
  end if;

  -- no item type may project through an EMPTY allowlist either -- that would
  -- hand a learner an item with no stem, which is a different failure but the
  -- same row being trusted
  select string_agg(r.item_type::text, ', ') into bad
    from public.item_type_registry r
   where jsonb_array_length(r.sanitizer_allowlist) = 0;
  if bad is not null then
    problems := problems || ('item type(s) with an empty learner projection: ' || bad);
  end if;

  -- authorization precedes existence in sanitized_item. Matched on syntax
  -- (L4): the ordering is what matters, so the check is that session_is_mine
  -- appears before the only raise, not that a comment says it does.
  v_src := regexp_replace(
             pg_get_functiondef('public.sanitized_item(uuid)'::regprocedure),
             '--[^\n]*', ' ', 'g');
  if position('session_is_mine' in v_src) = 0 then
    problems := problems || 'sanitized_item no longer authorizes at all'::text;
  elsif position('raise exception' in v_src) < position('session_is_mine' in v_src) then
    problems := problems ||
      'sanitized_item raises before it authorizes: existence is disclosed to a caller who does not own the session'::text;
  end if;

  -- and session_paper still authorizes before it projects
  v_src := regexp_replace(
             pg_get_functiondef('public.session_paper(uuid)'::regprocedure),
             '--[^\n]*', ' ', 'g');
  if position('session_is_mine' in v_src) = 0
     or position('session_is_mine' in v_src) > position('sanitizer_allowlist' in v_src) then
    problems := problems || 'session_paper projects before it authorizes'::text;
  end if;

  ok := array_length(problems, 1) is null;
  detail := case when ok then format(
      '%s item type(s), every learner projection inside the declared set {item_type, stem, stimulus, opsi} '
      || 'and constrained by the database rather than by convention; sanitized_item and session_paper both '
      || 'authorize before they disclose anything, existence included',
      (select count(*) from public.item_type_registry))
    else array_to_string(problems, '; ') end;
  return next;
end $function$;
revoke all on function public.assert_learner_projection_is_closed() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Terminal verification (ADR-0014).
--
-- L9: this block reaches a SUCCESSFUL RETURN, and says which probe does it.
-- Probe (4) calls `assert_learner_projection_is_closed()` and requires a true
-- verdict with a populated detail -- but the success path that actually
-- matters is `sanitized_item` returning a real projection, which needs a live
-- session and therefore belongs in the suite. It is F06-P01 in
-- selftest/db/fable06.sql, and it asserts the ABSENCE of unsafe keys rather
-- than the presence of a return -- a probe that checked "it returned
-- something" would pass on a function that returned everything.
-- ---------------------------------------------------------------------------
do $$
declare v_refused boolean; v_detail text; v_before text;
begin
  -- (1) the constraint refuses a widening, which is the whole point
  v_refused := false;
  begin
    update public.item_type_registry
       set sanitizer_allowlist = sanitizer_allowlist || '["kunci_jawaban"]'::jsonb
     where item_type = 'MCQ_SINGLE';
  exception when others then v_refused := true; end;
  if not v_refused then
    raise exception 'the learner projection was widened by an update: the boundary is still a table row';
  end if;

  -- (2) and a narrowing is still permitted -- this constrains what may be
  --     SHOWN, never what must be
  begin
    update public.item_type_registry set sanitizer_allowlist = '["item_type","stem"]'::jsonb
     where item_type = 'MCQ_SINGLE';
    if not (select a.ok from public.assert_learner_projection_is_closed() a) then
      raise exception 'a narrowed projection was reported as a problem: %',
        (select a.detail from public.assert_learner_projection_is_closed() a);
    end if;
    -- (3) THE ASSERTION IS WATCHED TO FAIL: an empty projection is a finding
    update public.item_type_registry set sanitizer_allowlist = '[]'::jsonb
     where item_type = 'MCQ_SINGLE';
    if (select a.ok from public.assert_learner_projection_is_closed() a) then
      raise exception 'an empty learner projection was not noticed';
    end if;
    if (select a.detail from public.assert_learner_projection_is_closed() a) !~ 'empty learner projection' then
      raise exception 'the empty projection was not named';
    end if;
    raise exception 'PROBE_0074_ROLLBACK';
  exception when others then
    if sqlerrm <> 'PROBE_0074_ROLLBACK' then raise; end if;
  end;

  -- (4) SUCCESSFUL RETURN, named per L9: the boundary assertion itself, on the
  --     restored registry, must come back true with a populated detail.
  if not (select a.ok from public.assert_learner_projection_is_closed() a) then
    raise exception 'the projection boundary is false after this migration: %',
      (select a.detail from public.assert_learner_projection_is_closed() a);
  end if;
  select a.detail into v_detail from public.assert_learner_projection_is_closed() a;
  if v_detail !~ 'authorize before they disclose' then
    raise exception 'the success path returned an unexpected verdict: %', v_detail;
  end if;

  raise notice '0074 verified: the learner projection is constrained by the database, widening it is refused, an empty one is a finding, and both projection functions authorize before disclosing existence';
end $$;
