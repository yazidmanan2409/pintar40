-- 0039 — FABLE-04 §4 / INV-29 / roadmap §5.2: the scoring-policy registry.
--
-- WHAT WAS WRONG. `scoring_policy_version()` returned the bare literal
-- `pintar-scoring/1`. FABLE-03 stamped that string onto every session and
-- every result for a whole phase with nothing behind it: no rules, no
-- effective date, no way for an old result to "resolve to the old policy"
-- because there was no policy to resolve to. Doc 16 §5 names **unversioned
-- scoring** as a dangerous pattern, and a version that is only a string is
-- exactly that. The roadmap asked for the choice to be made explicitly rather
-- than by default; ADR-0007 records it.
--
-- EXPAND-FIRST, in one migration but in that order: create the registry, seed
-- `pintar-scoring/1` with the rules FABLE-03 actually applied, verify every
-- existing session and result row resolves to a registry row, and only then
-- constrain. Nothing is stranded and no historical result changes meaning --
-- row one is a description of what already happened, not a new policy applied
-- retroactively.
--
-- A CORRECTION IS A NEW VERSION, NEVER AN EDIT. `scoring_policy` rows are
-- immutable once other rows reference them; a correction publishes a new
-- version and, where results must change, an audited recomputation writes a
-- NEW result linked by `supersedes_result_id` (INV-29, doc 08). Both are
-- enforced below rather than documented.

create table public.scoring_policy (
  version            text primary key check (version ~ '^pintar-scoring/[0-9]+$'),
  effective_from     timestamptz not null default now(),
  passing_rules      jsonb not null,
  safety_critical    jsonb not null,
  weighting          jsonb not null,
  partial_credit     jsonb not null,
  timeout_policy     jsonb not null,
  late_sync_policy   jsonb not null,
  superseded_by      text references public.scoring_policy(version),
  note               text not null check (btrim(note) <> ''),
  published_by       uuid references public.persons(id),
  created_at         timestamptz not null default now(),
  constraint scoring_policy_not_self_superseding check (superseded_by is distinct from version)
);
alter table public.scoring_policy enable row level security;
create index scoring_policy_current_idx on public.scoring_policy (effective_from desc) where superseded_by is null;

-- Readable by any signed-in person: a learner is entitled to know which rules
-- scored them, and none of it is answer-key material.
grant select on public.scoring_policy to authenticated;
create policy scoring_policy_select on public.scoring_policy for select to authenticated
  using (public.current_person_id() is not null);

insert into public.record_class_registry values
  ('scoring_policy', 'INSTITUTION_SCOPED', 'platform scoring rules, not learner evidence');

-- Row one describes what FABLE-03 already did. It is not a new policy.
insert into public.scoring_policy
  (version, passing_rules, safety_critical, weighting, partial_credit,
   timeout_policy, late_sync_policy, note)
values (
  'pintar-scoring/1',
  jsonb_build_object(
    'source', 'assessment_definitions.passing_rules.mastery_min',
    'default', null,
    'no_invented_pass_mark', true),
  jsonb_build_object(
    'rule', 'every safety-critical item delivered must be answered correctly (INV-10)',
    'vacuous_when_absent', true,
    'independent_of_score', true),
  jsonb_build_object('scheme', 'equal_weight_per_delivered_item'),
  jsonb_build_object('mcq_single', 'none', 'mcq_multi', 'none',
                     'note', 'set_match is all-or-nothing; partial credit is not a rule anyone has defined'),
  jsonb_build_object('on_expiry', 'score what was answered; discard nothing'),
  jsonb_build_object('grace_source', 'assessment_definitions.late_sync_grace_seconds',
                     'beyond_grace', 'retained as evidence, excluded from scoring'),
  'The rules FABLE-03 applied, recorded at FABLE-04 so that a version string resolves to something.'
);

-- ---------------------------------------------------------------------------
-- Expand-first: every existing row must already resolve before anything is
-- constrained. If one does not, this raises and the migration does not apply.
-- ---------------------------------------------------------------------------
do $$
declare n int; bad text;
begin
  select count(*), string_agg(distinct s.scoring_policy_version, ', ') into n, bad
    from public.assessment_sessions s
   where not exists (select 1 from public.scoring_policy p where p.version = s.scoring_policy_version);
  if n > 0 then
    raise exception '% session(s) carry a scoring policy version with no registry row: %', n, bad;
  end if;
  select count(*), string_agg(distinct r.scoring_policy_version, ', ') into n, bad
    from public.assessment_results r
   where not exists (select 1 from public.scoring_policy p where p.version = r.scoring_policy_version);
  if n > 0 then
    raise exception '% result(s) carry a scoring policy version with no registry row: %', n, bad;
  end if;
end $$;

alter table public.assessment_sessions
  add constraint assessment_sessions_scoring_policy_fk
  foreign key (scoring_policy_version) references public.scoring_policy(version);
alter table public.assessment_results
  add constraint assessment_results_scoring_policy_fk
  foreign key (scoring_policy_version) references public.scoring_policy(version);

-- ---------------------------------------------------------------------------
-- The version function now resolves against the registry instead of asserting
-- a literal. STABLE, not IMMUTABLE: it reads a table.
-- ---------------------------------------------------------------------------
create or replace function public.scoring_policy_version() returns text
language sql stable security definer set search_path = public, pg_temp as $$
  select p.version from public.scoring_policy p
   where p.superseded_by is null
   order by p.effective_from desc, p.version desc
   limit 1
$$;
revoke all on function public.scoring_policy_version() from public, anon, authenticated;

-- A policy row that anything references is immutable; superseding is the one
-- permitted update, and only onto a version that exists.
create function public.enforce_scoring_policy_write() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'a scoring policy version is never deleted: historical results resolve to it (INV-29)';
  end if;
  if tg_op = 'UPDATE' then
    if new.version <> old.version or new.passing_rules is distinct from old.passing_rules
       or new.safety_critical is distinct from old.safety_critical
       or new.weighting is distinct from old.weighting
       or new.partial_credit is distinct from old.partial_credit
       or new.timeout_policy is distinct from old.timeout_policy
       or new.late_sync_policy is distinct from old.late_sync_policy
       or new.effective_from is distinct from old.effective_from then
      raise exception 'a published scoring policy is immutable; publish a new version (INV-29, doc 08)';
    end if;
    if old.superseded_by is not null and new.superseded_by is distinct from old.superseded_by then
      raise exception 'a superseded policy version is already closed';
    end if;
  end if;
  return new;
end $$;
revoke all on function public.enforce_scoring_policy_write() from public, anon, authenticated;
create trigger scoring_policy_write before update or delete on public.scoring_policy
  for each row execute function public.enforce_scoring_policy_write();

-- Publishing a new version: SYSTEM_ADMIN only, audited, supersedes the current.
create function public.publish_scoring_policy(
  p_version text, p_passing_rules jsonb, p_safety_critical jsonb, p_weighting jsonb,
  p_partial_credit jsonb, p_timeout_policy jsonb, p_late_sync_policy jsonb, p_note text)
returns text language plpgsql security definer set search_path = public, pg_temp as $$
declare v_prev text; v_actor uuid;
begin
  if not public.is_system_admin() then
    raise exception 'publishing a scoring policy requires SYSTEM_ADMIN';
  end if;
  v_actor := public.current_person_id();
  select p.version into v_prev from public.scoring_policy p
   where p.superseded_by is null order by p.effective_from desc, p.version desc limit 1;

  insert into public.scoring_policy (version, passing_rules, safety_critical, weighting,
    partial_credit, timeout_policy, late_sync_policy, note, published_by)
  values (p_version, p_passing_rules, p_safety_critical, p_weighting,
          p_partial_credit, p_timeout_policy, p_late_sync_policy, p_note, v_actor);

  if v_prev is not null then
    update public.scoring_policy set superseded_by = p_version where version = v_prev;
  end if;
  perform public.audit_write('scoring_policy.published', 'scoring_policy', p_version, null,
    jsonb_build_object('version', p_version, 'supersedes', v_prev, 'note', p_note));
  return p_version;
end $$;
revoke all on function public.publish_scoring_policy(text, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, text)
  from public, anon, authenticated;

-- A correction writes a NEW linked result and leaves the original untouched.
create function public.recompute_result(p_session uuid, p_reason text) returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_prev public.assessment_results; v_e record; v_id uuid;
begin
  if not public.is_system_admin() then
    raise exception 'recomputation requires SYSTEM_ADMIN (INV-29: it is an audited act)';
  end if;
  if p_reason is null or btrim(p_reason) = '' then
    raise exception 'a recomputation records why it happened';
  end if;
  select * into v_prev from public.assessment_results
   where session_id = p_session and supersedes_result_id is null;
  if v_prev.id is null then raise exception 'session % has no root result to recompute', p_session; end if;

  select * into v_e from public.evaluate_session(p_session);
  insert into public.assessment_results (
    session_id, institution_id, person_id, evidence_class,
    engine_version, scoring_policy_version, mastery, per_domain,
    safety_gate_passed, delta_inputs, supersedes_result_id, recomputation_reason)
  values (
    p_session, '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000000', 'SYNTHETIC',
    public.engine_version(), public.scoring_policy_version(), v_e.mastery, v_e.per_domain,
    v_e.safety_gate_passed,
    jsonb_build_object('item_total', v_e.item_total, 'answered', v_e.answered,
                       'correct', v_e.correct, 'safety_total', v_e.safety_total,
                       'safety_correct', v_e.safety_correct),
    v_prev.id, p_reason)
  returning id into v_id;
  perform public.audit_write('assessment_result.recomputed', 'assessment_results', v_id::text,
    v_prev.institution_id,
    jsonb_build_object('session_id', p_session, 'supersedes', v_prev.id,
                       'new_result', v_id, 'reason', p_reason));
  return v_id;
end $$;
revoke all on function public.recompute_result(uuid, text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Verification block (ADR-0003). Behavioural where the defect class is
-- behavioural: an unversioned scoring string looked fine structurally for a
-- whole phase, so the checks here call things.
-- ---------------------------------------------------------------------------
do $$
declare v_ver text; n int; bad text;
begin
  if not exists (select 1 from public.scoring_policy where version = 'pintar-scoring/1') then
    raise exception 'the registry does not carry the version FABLE-03 stamped';
  end if;

  -- the function resolves to a real row rather than asserting a literal
  v_ver := public.scoring_policy_version();
  if v_ver is null or not exists (select 1 from public.scoring_policy where version = v_ver) then
    raise exception 'scoring_policy_version() does not resolve to a registry row: %', coalesce(v_ver, '<null>');
  end if;
  if pg_get_functiondef('public.scoring_policy_version()'::regprocedure) !~ 'scoring_policy' then
    raise exception 'scoring_policy_version() still returns a literal';
  end if;

  -- both bindings exist, so a future row cannot carry an unresolvable version
  foreach bad in array array['assessment_sessions_scoring_policy_fk','assessment_results_scoring_policy_fk'] loop
    if not exists (select 1 from pg_constraint where conname = bad) then
      raise exception 'the % binding was not created: INV-29 would be unenforced', bad;
    end if;
  end loop;

  -- an unresolvable version is refused at write time
  begin
    insert into public.scoring_policy (version, passing_rules, safety_critical, weighting,
      partial_credit, timeout_policy, late_sync_policy, note, superseded_by)
    values ('pintar-scoring/999', '{}', '{}', '{}', '{}', '{}', '{}', 'probe', 'pintar-scoring/nope');
    raise exception 'a policy superseded by a non-existent version was accepted';
  exception when foreign_key_violation then null;
  end;

  -- a published policy is immutable
  begin
    update public.scoring_policy set weighting = '{"scheme":"tampered"}' where version = 'pintar-scoring/1';
    raise exception 'a published scoring policy was edited in place (INV-29)';
  exception when raise_exception then
    if sqlerrm !~ 'immutable' then raise; end if;
  end;
  -- ... and never deleted
  begin
    delete from public.scoring_policy where version = 'pintar-scoring/1';
    raise exception 'a scoring policy version was deleted; historical results would dangle';
  exception when raise_exception then
    if sqlerrm !~ 'never deleted' then raise; end if;
  end;

  -- nothing internal is client-reachable
  foreach bad in array array['publish_scoring_policy','recompute_result','scoring_policy_version'] loop
    select string_agg(r.rolname, ', ') into v_ver from pg_proc p
      join pg_namespace ns on ns.oid=p.pronamespace, unnest(array['anon','authenticated']) r(rolname)
     where ns.nspname='public' and p.proname = bad
       and has_function_privilege(r.rolname, p.oid, 'EXECUTE');
    if v_ver is not null then
      raise exception '%() is executable by %: scoring policy is not a client surface', bad, v_ver;
    end if;
  end loop;

  select count(*) into n from pg_tables where schemaname='public' and not rowsecurity;
  if n > 0 then raise exception '% table(s) without RLS', n; end if;
  select count(*), string_agg(p.proname, ', ') into n, bad from pg_proc p
    join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and p.prokind in ('f','p')
     and not exists (select 1 from unnest(coalesce(p.proconfig,'{}')) c where c like 'search_path=%');
  if n > 0 then raise exception '% function(s) unpinned: %', n, bad; end if;
  if not exists (select 1 from public.record_class_registry where table_name='scoring_policy') then
    raise exception 'scoring_policy has no record class';
  end if;
end $$;
