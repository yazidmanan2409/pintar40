-- 0020 — FABLE-02 §3: three-tier question bank isolation (INV-12).
--
-- EXAM never leaks down. An assessment definition may draw an item of its own
-- tier or a lower one; a PRACTICE- or TEST-configured definition can never
-- reach an EXAM item. The tiers are ordered PRACTICE < TEST < EXAM and the
-- comparison is one function, so "which tiers may this definition draw" has
-- exactly one answer in the database.
--
-- Scope, and a dependency the build order did not account for. FABLE-02 §3 has
-- three parts: the one-way exclusion, exposure/cooling for EXAM items, and the
-- INV-24 pre-test/post-test exclusion. Only the first is buildable now. The
-- other two both read *deliveries* -- "how many times an EXAM item has been
-- delivered and to which cohort", and "every item and every sibling presented
-- in that learner's pre-test" -- and PresentedItem belongs to the evidence
-- schema, which is a later migration in the same phase. Building them now
-- would mean inventing a delivery record and then reconciling it, so they land
-- immediately after the evidence schema instead. The exclusion below is
-- complete and independent; nothing here is a placeholder.
--
-- The draw itself happens in Phase 3. What FABLE-02 owes it is the database
-- function it must call, which §3 says in as many words, so the filter lives
-- in eligible_items_for_definition() rather than in an engine that does not
-- exist yet. There is no definition<->item join table to put a CHECK on: an
-- item is selected at assembly time, so the draw is the enforcement point.

-- ---------------------------------------------------------------------------
-- The tier order, and the one comparison that uses it. Both IMMUTABLE and
-- by-value (ADR-0001's helper pattern): they take the tiers, never a row id,
-- so no policy or constraint can be tricked into re-reading a row.
-- ---------------------------------------------------------------------------
create function public.bank_tier_rank(p_bank public.bank_type) returns smallint
language sql immutable parallel safe as $$
  select case p_bank when 'PRACTICE' then 1 when 'TEST' then 2 when 'EXAM' then 3 end::smallint
$$;
revoke all on function public.bank_tier_rank(public.bank_type) from public, anon;
grant execute on function public.bank_tier_rank(public.bank_type) to authenticated;

create function public.item_is_drawable(p_item_bank public.bank_type,
                                        p_definition_bank public.bank_type)
returns boolean language sql immutable parallel safe as $$
  select p_item_bank is not null and p_definition_bank is not null
     and public.bank_tier_rank(p_item_bank) <= public.bank_tier_rank(p_definition_bank)
$$;
revoke all on function public.item_is_drawable(public.bank_type, public.bank_type) from public, anon;
grant execute on function public.item_is_drawable(public.bank_type, public.bank_type) to authenticated;

-- ---------------------------------------------------------------------------
-- A parallel group is drawn as a unit, so a group that mixed tiers would be a
-- way round the exclusion: draw the PRACTICE sibling, get the EXAM one. Group
-- members therefore share one tier and one institution. Cross-row, so it is a
-- trigger and not a CHECK.
-- ---------------------------------------------------------------------------
create function public.enforce_parallel_group_coherent() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_other text;
begin
  if new.parallel_group is null then return new; end if;

  select string_agg(distinct i.bank_type::text, ', ') into v_other
    from public.items i
   where i.parallel_group = new.parallel_group and i.id <> new.id
     and i.bank_type <> new.bank_type;
  if v_other is not null then
    raise exception 'parallel group members share one bank tier: the group already holds %, this item is % (INV-12)',
      v_other, new.bank_type;
  end if;

  select string_agg(distinct i.institution_id::text, ', ') into v_other
    from public.items i
   where i.parallel_group = new.parallel_group and i.id <> new.id
     and i.institution_id <> new.institution_id;
  if v_other is not null then
    raise exception 'parallel group members belong to one institution (INV-01)';
  end if;
  return new;
end $$;
revoke all on function public.enforce_parallel_group_coherent() from public, anon, authenticated;

create trigger items_parallel_group_coherent before insert or update on public.items
  for each row execute function public.enforce_parallel_group_coherent();

-- ---------------------------------------------------------------------------
-- The candidate set for a definition. SECURITY INVOKER on purpose: the caller
-- sees the items their own grants and policies allow, and this function only
-- narrows that set. Making it DEFINER would hand any caller a reader over
-- every institution's question bank, which is exactly what INV-01 and INV-12
-- exist to prevent.
--
-- Scope: items under the course or module the definition is bound to, in the
-- same institution, at or below the definition's tier.
-- ---------------------------------------------------------------------------
create function public.eligible_items_for_definition(p_definition uuid)
returns table (item_id uuid, parallel_group uuid, bank_type public.bank_type)
language sql stable as $$
  select i.id, i.parallel_group, i.bank_type
    from public.assessment_definitions d
    join public.lessons l on true
    join public.modules m on m.id = l.module_id
    join public.items i on i.lesson_id = l.id
   where d.id = p_definition
     and i.institution_id = d.institution_id
     and public.item_is_drawable(i.bank_type, d.bank_type)
     and ((d.course_id is not null and m.course_id = d.course_id)
       or (d.module_id is not null and l.module_id = d.module_id))
$$;
revoke all on function public.eligible_items_for_definition(uuid) from public, anon;
grant execute on function public.eligible_items_for_definition(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Verification block (ADR-0003): structural and pure-function only.
-- ---------------------------------------------------------------------------
do $$
declare n int; bad text; t public.bank_type; d public.bank_type;
begin
  -- the tier order is total, strict and in the stated direction
  if not (public.bank_tier_rank('PRACTICE') < public.bank_tier_rank('TEST')
      and public.bank_tier_rank('TEST') < public.bank_tier_rank('EXAM')) then
    raise exception 'bank tiers are not ordered PRACTICE < TEST < EXAM';
  end if;

  -- the whole 3x3 matrix, stated explicitly rather than recomputed from the
  -- same expression the function uses
  foreach t in array array['PRACTICE','TEST','EXAM']::public.bank_type[] loop
    foreach d in array array['PRACTICE','TEST','EXAM']::public.bank_type[] loop
      if public.item_is_drawable(t, d) <> (public.bank_tier_rank(t) <= public.bank_tier_rank(d)) then
        raise exception 'item_is_drawable disagrees with the tier order at item=% definition=%', t, d;
      end if;
    end loop;
  end loop;

  -- the headline requirement, spelled out: EXAM never leaks down
  if public.item_is_drawable('EXAM', 'PRACTICE') then
    raise exception 'an EXAM item is drawable by a PRACTICE definition (INV-12)'; end if;
  if public.item_is_drawable('EXAM', 'TEST') then
    raise exception 'an EXAM item is drawable by a TEST definition (INV-12)'; end if;
  if public.item_is_drawable('TEST', 'PRACTICE') then
    raise exception 'a TEST item is drawable by a PRACTICE definition (INV-12)'; end if;
  -- and the permitted direction still works, or every EXAM would be empty
  if not public.item_is_drawable('EXAM', 'EXAM')
     or not public.item_is_drawable('PRACTICE', 'EXAM')
     or not public.item_is_drawable('PRACTICE', 'PRACTICE') then
    raise exception 'the permitted draw direction was closed off';
  end if;

  -- fails closed on null input (Lesson 11)
  if public.item_is_drawable(null, 'EXAM') or public.item_is_drawable('PRACTICE', null)
     or public.item_is_drawable(null, null) then
    raise exception 'item_is_drawable failed open on null input';
  end if;

  -- volatility and exposure
  select string_agg(p.proname, ', ') into bad from pg_proc p
    join pg_namespace ns on ns.oid = p.pronamespace
   where ns.nspname = 'public' and p.provolatile <> 'i'
     and p.proname in ('bank_tier_rank','item_is_drawable');
  if bad is not null then raise exception 'tier predicate is not IMMUTABLE: %', bad; end if;

  -- the candidate reader must NOT be SECURITY DEFINER: it would become a
  -- cross-tenant reader over every question bank
  select count(*) into n from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
   where ns.nspname = 'public' and p.proname = 'eligible_items_for_definition' and p.prosecdef;
  if n > 0 then raise exception 'eligible_items_for_definition is SECURITY DEFINER'; end if;

  if not exists (select 1 from pg_trigger g join pg_class c on c.oid = g.tgrelid
                  where c.relname = 'items' and g.tgname = 'items_parallel_group_coherent'
                    and not g.tgisinternal) then
    raise exception 'parallel-group coherence trigger missing on items';
  end if;

  -- standing hygiene
  select count(*) into n from information_schema.role_table_grants
   where table_schema = 'public' and grantee = 'anon';
  if n > 0 then raise exception 'anon holds % table grant(s) in public', n; end if;

  select count(*) into n from pg_policies
   where schemaname = 'public' and (qual = 'true' or with_check = 'true');
  if n > 0 then raise exception '% permissive policy/policies introduced', n; end if;

  select count(*) into n from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
   where ns.nspname = 'public' and p.prosecdef
     and not exists (select 1 from unnest(coalesce(p.proconfig,'{}')) c where c like 'search_path=%');
  if n > 0 then raise exception '% SECURITY DEFINER function(s) without pinned search_path', n; end if;

  select count(*), string_agg(p.proname, ', ') into n, bad from pg_proc p
    join pg_namespace ns on ns.oid = p.pronamespace
   where ns.nspname = 'public' and has_function_privilege('anon', p.oid, 'EXECUTE');
  if n > 0 then raise exception 'anon can execute % function(s) in public: %', n, bad; end if;
end $$;
