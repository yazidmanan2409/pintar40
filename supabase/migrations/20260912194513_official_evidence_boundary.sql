-- 0025 — FABLE-02 §7, slice D: the official consumption boundary (INV-20).
--
-- Analytics, Question Health, psychometrics, reporting and certificate
-- eligibility read evidence through ONE path: the official_* views. They do
-- not read the raw tables, and this migration makes that a privilege rather
-- than a convention -- a dedicated `analytics` role holds SELECT on the three
-- views and on nothing else.
--
-- WHAT "OFFICIAL" MEANS, AND WHO DECIDES. A session's evidence_class is derived
-- from authoritative state at write time (0021/0022) and is immutable
-- thereafter. Reclassification is a real operational need -- evidence produced
-- during an incident, or a session later found to be a preview -- but it must
-- never be a quiet UPDATE of the session. evidence_class_overrides is
-- therefore an append-only audited log, and the views honour each session's
-- LATEST override row. The session's own provenance is untouched: the override
-- records that someone decided differently, who, and why.
--
-- DIRECTION OF TRAVEL. An override may only WEAKEN eligibility, never
-- strengthen it -- the same monotonic rule 0022 made structural for derivation,
-- applied to reclassification, and enforced with the same evidence_class_min.
-- Nobody gets to promote SYNTHETIC data into OFFICIAL analytics by filing a
-- form. Demoting official evidence to PREVIEW is permitted, audited, and
-- reversible only by a further override that is itself audited.
--
-- The views are SECURITY INVOKER (Postgres 15+ `security_invoker = true`), so
-- the analytics role's own RLS applies rather than the view owner's. A view
-- that quietly bypassed RLS would be a cross-tenant reader wearing the word
-- "official".

create table public.evidence_class_overrides (
  id             uuid primary key default gen_random_uuid(),
  session_id     uuid not null references public.assessment_sessions(id),
  institution_id uuid not null references public.institutions(id),
  from_class     public.evidence_class not null,
  to_class       public.evidence_class not null,
  reason         text not null check (btrim(reason) <> ''),
  decided_by_person_id uuid not null references public.persons(id),
  decided_at     timestamptz not null default now(),
  constraint evidence_class_overrides_actually_changes check (from_class <> to_class)
);
create index evidence_class_overrides_session_idx
  on public.evidence_class_overrides (session_id, decided_at desc);
alter table public.evidence_class_overrides enable row level security;

-- Append-only, tenant-derived, monotonic, audited.
create function public.enforce_evidence_override() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_inst uuid; v_current public.evidence_class; v_actor uuid;
begin
  if tg_op <> 'INSERT' then
    raise exception 'an evidence reclassification is append-only: file another override';
  end if;
  select s.institution_id into v_inst from public.assessment_sessions s where s.id = new.session_id;
  if v_inst is null then raise exception 'unknown session %', new.session_id; end if;
  new.institution_id := v_inst;

  v_actor := public.current_person_id();
  if v_actor is null then
    raise exception 'reclassifying evidence is a human act and needs a known person';
  end if;
  if not public.can_in_institution('CAN_REVIEW_INTEGRITY', v_inst) then
    raise exception 'reclassifying evidence requires CAN_REVIEW_INTEGRITY in the owning institution';
  end if;
  new.decided_by_person_id := v_actor;

  -- from_class is what the evidence is NOW, not what the caller says it is
  v_current := public.effective_evidence_class(new.session_id);
  new.from_class := v_current;

  -- and an override may only weaken, exactly as derivation may only weaken
  if public.evidence_class_min(v_current, new.to_class) <> new.to_class then
    raise exception 'an override may only reduce eligibility: % -> % would promote it',
      v_current, new.to_class;
  end if;

  perform public.audit_write('EVIDENCE_RECLASSIFIED', 'assessment_sessions', new.session_id,
    v_inst, format('%s -> %s: %s', v_current, new.to_class, new.reason));
  return new;
end $$;
revoke all on function public.enforce_evidence_override() from public, anon, authenticated;

-- The effective class of a session: its derived class, weakened by the latest
-- override if one exists. One function, so the views and the guard above
-- cannot drift apart.
create function public.effective_evidence_class(p_session uuid)
returns public.evidence_class
language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce(
    (select o.to_class from public.evidence_class_overrides o
      where o.session_id = p_session order by o.decided_at desc, o.id desc limit 1),
    (select s.evidence_class from public.assessment_sessions s where s.id = p_session))
$$;
revoke all on function public.effective_evidence_class(uuid) from public, anon, authenticated;

create trigger evidence_class_overrides_write before insert or update or delete
  on public.evidence_class_overrides
  for each row execute function public.enforce_evidence_override();

grant select on public.evidence_class_overrides to authenticated;
create policy evidence_class_overrides_select on public.evidence_class_overrides
  for select to authenticated
  using (public.can_in_institution('CAN_REVIEW_INTEGRITY', institution_id));
grant insert on public.evidence_class_overrides to authenticated;
create policy evidence_class_overrides_insert on public.evidence_class_overrides
  for insert to authenticated
  with check (public.can_in_institution('CAN_REVIEW_INTEGRITY', institution_id));

-- ---------------------------------------------------------------------------
-- The only read path for evidence consumers.
-- ---------------------------------------------------------------------------
create view public.official_sessions with (security_invoker = true) as
  select s.id, s.person_id, s.institution_id, s.enrollment_id, s.academic_period_id,
         s.class_node_id, s.cohort_node_id, s.plp_release_id,
         s.assessment_definition_id, s.assessment_definition_version,
         s.engine_version, s.scoring_policy_version, s.evidence_channel, s.mode,
         s.status, s.started_at, s.submitted_at, s.finalized_at, s.created_at
    from public.assessment_sessions s
   where public.effective_evidence_class(s.id) = 'OFFICIAL';

create view public.official_responses with (security_invoker = true) as
  select r.id, r.presented_item_id, r.session_id, r.institution_id, r.client_seq,
         r.value, r.value_digest, r.received_at, r.client_asserted_at,
         r.receipt_mode, r.is_final
    from public.responses r
   where public.effective_evidence_class(r.session_id) = 'OFFICIAL';

create view public.official_results with (security_invoker = true) as
  select r.id, r.session_id, r.institution_id, r.person_id,
         r.engine_version, r.scoring_policy_version, r.mastery, r.per_domain,
         r.safety_gate_passed, r.delta_inputs, r.supersedes_result_id,
         r.recomputation_reason, r.computed_at
    from public.assessment_results r
   where public.effective_evidence_class(r.session_id) = 'OFFICIAL';

-- ---------------------------------------------------------------------------
-- The analytics consumer. SELECT on the three views and nothing else -- no
-- raw evidence table, no telemetry, no content. NOLOGIN: Phase 6 reaches it by
-- SET ROLE from the service role, so the grant set is the whole story.
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'analytics') then
    create role analytics nologin;
  end if;
end $$;
grant usage on schema public to analytics;
grant select on public.official_sessions, public.official_responses, public.official_results
  to analytics;
grant execute on function public.effective_evidence_class(uuid) to analytics;

-- ---------------------------------------------------------------------------
-- Verification block (ADR-0003): structural and pure-function only.
-- ---------------------------------------------------------------------------
do $$
declare n int; bad text; def text; v text;
begin
  -- the three views exist and do not bypass the caller's RLS
  foreach v in array array['official_sessions','official_responses','official_results'] loop
    if not exists (select 1 from pg_views where schemaname='public' and viewname=v) then
      raise exception 'the % view is missing', v;
    end if;
    select c.reloptions::text into bad from pg_class c join pg_namespace ns on ns.oid=c.relnamespace
     where ns.nspname='public' and c.relname=v;
    if bad is null or bad not like '%security_invoker=true%' then
      raise exception 'view % does not run as the caller: it would bypass RLS', v;
    end if;
  end loop;

  -- INV-20: the analytics role reads the views and NOTHING raw
  select string_agg(g.table_schema || '.' || g.table_name, ', ') into bad
    from information_schema.role_table_grants g
   where g.grantee = 'analytics'
     and g.table_name not in ('official_sessions','official_responses','official_results');
  if bad is not null then
    raise exception 'the analytics role holds a grant outside the official views: %', bad;
  end if;
  select string_agg(g.table_name || ':' || g.privilege_type, ', ') into bad
    from information_schema.role_table_grants g
   where g.grantee = 'analytics' and g.privilege_type <> 'SELECT';
  if bad is not null then
    raise exception 'the analytics role holds a non-SELECT privilege: %', bad;
  end if;
  if has_schema_privilege('analytics','telemetry','USAGE') then
    raise exception 'the analytics role can reach telemetry (INV-11/INV-20)';
  end if;

  -- every official view filters on the effective class, not on the raw column
  foreach v in array array['official_sessions','official_responses','official_results'] loop
    select pg_get_viewdef(('public.'||v)::regclass, true) into def;
    if def not like '%effective_evidence_class%' then
      raise exception 'view % does not filter on the effective evidence class', v;
    end if;
    if def !~* 'OFFICIAL' then
      raise exception 'view % does not restrict to OFFICIAL', v;
    end if;
  end loop;

  -- an override may only weaken, and says so through the same MIN as derivation
  select pg_get_functiondef(p.oid) into def from pg_proc p
    join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and p.proname='enforce_evidence_override';
  if def not like '%evidence_class_min%' then
    raise exception 'the override guard does not use the monotonic MIN';
  end if;
  if def not like '%audit_write%' then
    raise exception 'a reclassification is not audited';
  end if;
  if def not like '%CAN_REVIEW_INTEGRITY%' then
    raise exception 'a reclassification is not gated on a capability';
  end if;

  -- the override log is append-only and cannot be rewritten
  if def not like '%tg_op <> ''INSERT''%' then
    raise exception 'the override log accepts rewrites';
  end if;

  -- standing hygiene
  select count(*) into n from information_schema.role_table_grants
   where table_schema='public' and grantee='anon';
  if n > 0 then raise exception 'anon holds % table grant(s) in public', n; end if;
  select count(*) into n from pg_policies
   where schemaname in ('public','telemetry') and (qual='true' or with_check='true');
  if n > 0 then raise exception '% permissive policy/policies introduced', n; end if;
  select count(*) into n from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and p.prosecdef
     and not exists (select 1 from unnest(coalesce(p.proconfig,'{}')) x where x like 'search_path=%');
  if n > 0 then raise exception '% SECURITY DEFINER function(s) without pinned search_path', n; end if;
  select count(*), string_agg(p.proname, ', ') into n, bad from pg_proc p
    join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and has_function_privilege('anon', p.oid, 'EXECUTE');
  if n > 0 then raise exception 'anon can execute % function(s) in public: %', n, bad; end if;
end $$;
