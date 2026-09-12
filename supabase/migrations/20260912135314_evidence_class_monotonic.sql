-- 0022 — FABLE-02 §7: make the evidence_class monotonicity rule structural.
--
-- Not a defect. The Slice A checkpoint probed whether any caller-reachable
-- input could derive a class stronger than authoritative state warrants: all
-- sixteen channel x mode combinations returned SYNTHETIC on a synthetic
-- tenant, and app.evidence_context set to 'official' changed nothing. The
-- behaviour was already correct.
--
-- It was correct for the wrong kind of reason. Nothing promoted because no
-- branch happened to map a context value to a stronger class -- a property of
-- the branch set, not a stated rule. Adding `if v_context = 'official' then
-- return 'OFFICIAL'` would have compiled, passed every existing test, and
-- silently turned a caller-controlled string into a promotion. That is the
-- same shape as the tenant hop: the right outcome arriving from a mechanism
-- that did not guarantee it.
--
-- The invariant, now enforced by construction rather than by reading order:
--
--   Caller-controlled context may reduce evidence eligibility. It may never
--   increase it above the class established from authoritative state.
--
-- The derivation becomes a fold of MIN over independent restrictions. Every
-- input -- the tenant flag, the channel, the context -- can only pull the
-- class DOWN. Because min is commutative and associative (asserted below over
-- the whole 4x4 matrix), reordering the restrictions or adding a new one
-- cannot change that: a future input can only ever restrict further. There is
-- no branch left that returns a class, so there is nowhere for a promotion to
-- be written.

-- The eligibility order. SYNTHETIC is the weakest evidence and OFFICIAL the
-- strongest; the three non-official classes are ordered only so that MIN is
-- total, not because a preview is "worth more" than a demo.
create function public.evidence_class_rank(p_class public.evidence_class) returns smallint
language sql immutable parallel safe as $$
  select case p_class
    when 'SYNTHETIC'   then 0
    when 'PUBLIC_DEMO' then 1
    when 'PREVIEW'     then 2
    when 'OFFICIAL'    then 3 end::smallint
$$;
revoke all on function public.evidence_class_rank(public.evidence_class) from public, anon, authenticated;

create function public.evidence_class_min(p_a public.evidence_class, p_b public.evidence_class)
returns public.evidence_class language sql immutable parallel safe as $$
  select case when public.evidence_class_rank(p_a) <= public.evidence_class_rank(p_b)
              then p_a else p_b end
$$;
revoke all on function public.evidence_class_min(public.evidence_class, public.evidence_class)
  from public, anon, authenticated;

create or replace function public.derive_evidence_class(p_institution uuid,
                                                        p_channel public.evidence_channel)
returns public.evidence_class
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare
  v_synthetic boolean;
  v_from_tenant  public.evidence_class;
  v_from_channel public.evidence_class;
  v_from_context public.evidence_class;
begin
  select i.is_synthetic into v_synthetic from public.institutions i where i.id = p_institution;
  if v_synthetic is null then
    raise exception 'cannot derive evidence_class: unknown institution %', p_institution;
  end if;

  -- Each source states the STRONGEST class it will permit. None of them
  -- grants; they only cap.
  v_from_tenant  := case when v_synthetic then 'SYNTHETIC' else 'OFFICIAL' end;
  v_from_channel := case when p_channel = 'PUBLIC_DEMO' then 'PUBLIC_DEMO' else 'OFFICIAL' end;
  v_from_context := case nullif(current_setting('app.evidence_context', true), '')
                      when 'preview' then 'PREVIEW'::public.evidence_class
                      -- anything else, including an unrecognised or hostile
                      -- value, caps at nothing and therefore restricts nothing
                      else 'OFFICIAL'::public.evidence_class end;

  return public.evidence_class_min(
           public.evidence_class_min(v_from_tenant, v_from_channel),
           v_from_context);
end $$;
revoke all on function public.derive_evidence_class(uuid, public.evidence_channel)
  from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Verification block (ADR-0003): structural and pure-function only.
-- ---------------------------------------------------------------------------
do $$
declare a public.evidence_class; b public.evidence_class; cls public.evidence_class; def text; n int; bad text;
begin
  -- the order is strict and total
  if not (public.evidence_class_rank('SYNTHETIC') < public.evidence_class_rank('PUBLIC_DEMO')
      and public.evidence_class_rank('PUBLIC_DEMO') < public.evidence_class_rank('PREVIEW')
      and public.evidence_class_rank('PREVIEW') < public.evidence_class_rank('OFFICIAL')) then
    raise exception 'the evidence eligibility order is not strict';
  end if;

  -- MIN never exceeds either input: this is the whole monotonicity guarantee
  foreach a in array enum_range(null::public.evidence_class) loop
    foreach b in array enum_range(null::public.evidence_class) loop
      if public.evidence_class_rank(public.evidence_class_min(a, b))
         > least(public.evidence_class_rank(a), public.evidence_class_rank(b)) then
        raise exception 'evidence_class_min(%, %) promoted above its inputs', a, b;
      end if;
      -- commutative, so the order restrictions are applied in cannot matter
      if public.evidence_class_min(a, b) <> public.evidence_class_min(b, a) then
        raise exception 'evidence_class_min is not commutative at (%, %)', a, b;
      end if;
      -- associative, so adding a fourth restriction later cannot reorder into
      -- a different answer
      foreach cls in array enum_range(null::public.evidence_class) loop
        if public.evidence_class_min(public.evidence_class_min(a, b), cls)
           <> public.evidence_class_min(a, public.evidence_class_min(b, cls)) then
          raise exception 'evidence_class_min is not associative at (%, %, %)', a, b, cls;
        end if;
      end loop;
    end loop;
  end loop;

  -- the derivation returns a fold of MIN and contains no bare class return,
  -- so there is nowhere a promotion could be written
  select pg_get_functiondef(p.oid) into def from pg_proc p
    join pg_namespace ns on ns.oid = p.pronamespace
   where ns.nspname = 'public' and p.proname = 'derive_evidence_class';
  if def not like '%evidence_class_min%' then
    raise exception 'derive_evidence_class no longer folds over evidence_class_min';
  end if;
  if def ~* 'return\s+''(OFFICIAL|PREVIEW|SYNTHETIC|PUBLIC_DEMO)''' then
    raise exception 'derive_evidence_class returns a class directly, bypassing the MIN fold';
  end if;
  if def not like '%is_synthetic%' then
    raise exception 'derive_evidence_class no longer reads the tenant synthetic flag';
  end if;

  -- volatility
  select string_agg(p.proname, ', ') into bad from pg_proc p
    join pg_namespace ns on ns.oid = p.pronamespace
   where ns.nspname = 'public' and p.provolatile <> 'i'
     and p.proname in ('evidence_class_rank','evidence_class_min');
  if bad is not null then raise exception 'eligibility primitive is not IMMUTABLE: %', bad; end if;

  -- standing hygiene
  select count(*) into n from information_schema.role_table_grants
   where table_schema = 'public' and grantee = 'anon';
  if n > 0 then raise exception 'anon holds % table grant(s) in public', n; end if;
  select count(*) into n from pg_policies
   where schemaname = 'public' and (qual = 'true' or with_check = 'true');
  if n > 0 then raise exception '% permissive policy/policies introduced', n; end if;
  select count(*) into n from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
   where ns.nspname = 'public' and p.prosecdef
     and not exists (select 1 from unnest(coalesce(p.proconfig,'{}')) x where x like 'search_path=%');
  if n > 0 then raise exception '% SECURITY DEFINER function(s) without pinned search_path', n; end if;
  select count(*), string_agg(p.proname, ', ') into n, bad from pg_proc p
    join pg_namespace ns on ns.oid = p.pronamespace
   where ns.nspname = 'public' and has_function_privilege('anon', p.oid, 'EXECUTE');
  if n > 0 then raise exception 'anon can execute % function(s) in public: %', n, bad; end if;
end $$;
