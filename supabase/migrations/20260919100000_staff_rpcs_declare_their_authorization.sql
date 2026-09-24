-- L3-F02. The assertion that proved INV-19 in the API derived its own
-- population by asking each candidate function's body whether it named a
-- capability a DEAN lacks. The population was therefore a function of the
-- artefact under test: deleting a capability check also deleted the endpoint
-- from the set, so the defect the assertion hunted was the edit that removed
-- the endpoint from the hunt. The floor of 18 was written as the closure, but a
-- floor counts members, it does not identify them: against a population of 21
-- the first three deletions passed. Layer-3 deleted one guard and the whole
-- 173-entry contract stayed green.
--
-- The repair is to stop deriving the expected population from the
-- implementation. An endpoint's authorization contract becomes a DECLARATION
-- carried by the registry that already exists, and the assertion reads the
-- declaration. Deleting an `if not public.can_…` block changes `pg_proc`; it
-- does not change a row in `client_rpc_registry`, so the endpoint stays in the
-- population and fails inside it.
--
-- WHY TWO COLUMNS AND NOT ONE. All 31 mutating STAFF RPCs were measured before
-- this shape was chosen. They do not all authorize by capability:
--
--     CAPABILITY          25   can_in_institution / can_on_node with a CAN_* name
--     SYSTEM_ADMIN         2   publish_scoring_policy, recompute_result
--     SCOPE                2   period_rollover, revoke_role — has_scope at a role
--     INSTITUTION_MEMBER   1   generate_report
--     DELEGATED            1   grant_role — enforced by the role_assignments
--                              trigger (INV-16), not in the function body
--
-- A single `required_capability` column would have to carry 'SYSTEM_ADMIN',
-- 'INSTITUTION_MEMBER' and 'SCOPE' as sentinel values. Those are not
-- capabilities: none of them appears in any `role_capabilities()` array, so the
-- column could never be validated against the capability model it claims to
-- name, and the declaration would be a lie told in the column's own vocabulary.
-- Two typed columns are the smallest representation that describes what is
-- actually there. The enum is closed, so a genuinely new authorization model
-- needs `alter type` — a schema change someone has to write — and not an
-- arbitrary string a backfill can invent.
--
-- THIS IS METADATA. Nothing at runtime reads these columns; no authorization
-- decision consults the registry, before or after this migration. The registry
-- describes the contract so that verification can be independent of the
-- implementation, and that is all it does.
-- ---------------------------------------------------------------------------

create type public.rpc_authorization_kind as enum
  ('CAPABILITY', 'SYSTEM_ADMIN', 'SCOPE', 'INSTITUTION_MEMBER', 'DELEGATED');

alter table public.client_rpc_registry
  add column authorization_kind        public.rpc_authorization_kind,
  add column authorization_requirement text;

comment on column public.client_rpc_registry.authorization_kind is
  'The authorization model this endpoint implements. Declared metadata; no runtime path reads it.';
comment on column public.client_rpc_registry.authorization_requirement is
  'The subject of that model: a CAN_* capability, an app_role for SCOPE, the guarded table for DELEGATED, null otherwise.';

alter table public.client_rpc_registry
  add constraint client_rpc_registry_authorization_shape check (
    authorization_kind is null or case authorization_kind
      when 'CAPABILITY'         then authorization_requirement ~ '^CAN_[A-Z_]+$'
      when 'SCOPE'              then authorization_requirement ~ '^[A-Z][A-Z_]+$'
      when 'DELEGATED'          then authorization_requirement ~ '^[a-z][a-z_]+$'
      when 'SYSTEM_ADMIN'       then authorization_requirement is null
      when 'INSTITUTION_MEMBER' then authorization_requirement is null
    end);

-- ---------------------------------------------------------------------------
-- The backfill. Every value was read off the live function, not guessed.
-- ---------------------------------------------------------------------------
update public.client_rpc_registry set authorization_kind = 'CAPABILITY',
       authorization_requirement = v.cap
  from (values
    ('acknowledge_finding','CAN_REVIEW'),
    ('advance_briefing','CAN_ASSIGN_LEARNING'),
    ('create_course_revision','CAN_DRAFT'),
    ('extend_session_deadline','CAN_ASSIGN_LEARNING'),
    ('ingest_structured_package','CAN_DRAFT'),
    ('launch_quick_assessment','CAN_QUICK_ASSESSMENT'),
    ('move_learning_assignment_release','CAN_ASSIGN_LEARNING'),
    ('open_briefing','CAN_ASSIGN_LEARNING'),
    ('propose_easy_upload_mapping','CAN_DRAFT'),
    ('publish_release','CAN_PUBLISH'),
    ('recompute_question_health','CAN_REVIEW_QUESTION_HEALTH'),
    ('record_integrity_review','CAN_REVIEW_INTEGRITY'),
    ('record_question_health_review','CAN_REVIEW_QUESTION_HEALTH'),
    ('review_briefing','CAN_ASSIGN_LEARNING'),
    ('revoke_certificate','CAN_PUBLISH'),
    ('run_mcq_quality','CAN_DRAFT'),
    ('save_assessment_definition','CAN_DRAFT'),
    ('save_certificate_template','CAN_PUBLISH'),
    ('terminate_session','CAN_REVIEW_INTEGRITY'),
    ('transfer_authorize','CAN_AUTHORIZE_TRANSFER'),
    ('transfer_execute','CAN_AUTHORIZE_TRANSFER'),
    ('transfer_reject','CAN_AUTHORIZE_TRANSFER'),
    ('transfer_request','CAN_AUTHORIZE_TRANSFER'),
    ('validate_course_content','CAN_DRAFT'),
    ('withdraw_release','CAN_PUBLISH')
  ) as v(fn, cap)
 where client_rpc_registry.function_name = v.fn;

update public.client_rpc_registry set authorization_kind = 'SYSTEM_ADMIN', authorization_requirement = null
 where function_name in ('publish_scoring_policy', 'recompute_result');

update public.client_rpc_registry set authorization_kind = 'SCOPE', authorization_requirement = 'INSTITUTION_ADMIN'
 where function_name in ('period_rollover', 'revoke_role');

update public.client_rpc_registry set authorization_kind = 'INSTITUTION_MEMBER', authorization_requirement = null
 where function_name = 'generate_report';

-- grant_role writes role_assignments and nothing else; the anti-escalation
-- trigger on that table is the authorization (INV-16). A trigger runs for a
-- SECURITY DEFINER function, which is why this is a real model and not an
-- excuse — unlike RLS, which does not.
update public.client_rpc_registry set authorization_kind = 'DELEGATED', authorization_requirement = 'role_assignments'
 where function_name = 'grant_role';

-- ---------------------------------------------------------------------------
-- Omission made impossible at write time. A STAFF row whose function mutates
-- cannot be registered without declaring how it authorizes. This is the half
-- that closes "someone adds an endpoint and forgets"; the assertion below is
-- the half that closes "something drifted after it was registered".
-- ---------------------------------------------------------------------------
create function public.enforce_rpc_authorization_declared() returns trigger
language plpgsql set search_path = public, pg_temp as $function$
declare v_vol char;
begin
  select p.provolatile into v_vol from pg_proc p
   where p.proname = new.function_name and p.pronamespace = 'public'::regnamespace;
  if new.exposure = 'STAFF' and v_vol = 'v' and new.authorization_kind is null then
    raise exception 'a mutating STAFF endpoint declares how it authorizes: % has no authorization_kind (L3-F02)',
      new.function_name;
  end if;
  return new;
end $function$;
revoke all on function public.enforce_rpc_authorization_declared() from public, anon, authenticated;

create trigger client_rpc_registry_declares_authorization
  before insert or update on public.client_rpc_registry
  for each row execute function public.enforce_rpc_authorization_declared();

-- ---------------------------------------------------------------------------
-- The declared assertion. It joins the declaration to the live catalogue, so a
-- function that later becomes volatile, or a capability name that stops
-- existing, is caught even though no registry row was touched.
-- ---------------------------------------------------------------------------
create function public.assert_staff_rpc_authorization_declared()
returns table (ok boolean, detail text)
language plpgsql stable set search_path = public, pg_temp as $function$
declare n_total int; n_undeclared int; v_bad text := ''; d record;
        v_caps text[];
begin
  select array(select distinct unnest(public.role_capabilities(e.role))
                 from (select unnest(enum_range(null::public.app_role)) as role) e)
    into v_caps;

  select count(*) into n_total
    from public.client_rpc_registry cr
    join pg_proc p on p.proname = cr.function_name and p.pronamespace = 'public'::regnamespace
   where cr.exposure = 'STAFF' and p.provolatile = 'v';

  select count(*) into n_undeclared
    from public.client_rpc_registry cr
    join pg_proc p on p.proname = cr.function_name and p.pronamespace = 'public'::regnamespace
   where cr.exposure = 'STAFF' and p.provolatile = 'v' and cr.authorization_kind is null;

  for d in select cr.function_name, cr.authorization_kind, cr.authorization_requirement
             from public.client_rpc_registry cr
             join pg_proc p on p.proname = cr.function_name and p.pronamespace = 'public'::regnamespace
            where cr.exposure = 'STAFF' and p.provolatile = 'v' and cr.authorization_kind is not null loop
    if d.authorization_kind = 'CAPABILITY' and not (d.authorization_requirement = any (v_caps)) then
      v_bad := v_bad || format('%s declares capability %s, which no role holds; ',
                               d.function_name, d.authorization_requirement);
    elsif d.authorization_kind = 'SCOPE'
      and not exists (select 1 from unnest(enum_range(null::public.app_role)) e
                       where e::text = d.authorization_requirement) then
      v_bad := v_bad || format('%s declares scope role %s, which is not an app_role; ',
                               d.function_name, d.authorization_requirement);
    elsif d.authorization_kind = 'DELEGATED' then
      if to_regclass('public.' || d.authorization_requirement) is null then
        v_bad := v_bad || format('%s delegates to %s, which is not a table; ',
                                 d.function_name, d.authorization_requirement);
      elsif not exists (select 1 from pg_trigger t
                         where t.tgrelid = to_regclass('public.' || d.authorization_requirement)
                           and not t.tgisinternal and t.tgenabled <> 'D') then
        v_bad := v_bad || format('%s delegates to %s, which carries no enabled trigger to delegate to; ',
                                 d.function_name, d.authorization_requirement);
      end if;
    end if;
  end loop;

  if n_undeclared > 0 then
    ok := false;
    detail := format('%s of %s mutating STAFF endpoint(s) declare no authorization kind', n_undeclared, n_total);
  elsif v_bad <> '' then
    ok := false; detail := v_bad;
  else
    ok := true;
    detail := format('%s mutating STAFF endpoint(s), every one declaring an authorization kind whose '
                  || 'requirement resolves against the live capability model, the role enum or a guarded table', n_total);
  end if;
  return next;
end $function$;
revoke all on function public.assert_staff_rpc_authorization_declared() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Terminal verification (ADR-0014). Every row is built and rolled back here.
-- ---------------------------------------------------------------------------
do $$
declare v_ok boolean; v_detail text; n int; v_raised boolean;
begin
  select ok, detail into v_ok, v_detail from public.assert_staff_rpc_authorization_declared();
  if not v_ok then raise exception 'the declaration is not complete at creation: %', v_detail; end if;
  raise notice '0086: %', v_detail;

  -- the population is derived without reading a single function body
  select count(*) into n
    from public.client_rpc_registry r
    join pg_proc p on p.proname = r.function_name and p.pronamespace = 'public'::regnamespace
   where r.exposure = 'STAFF' and p.provolatile = 'v'
     and has_function_privilege('authenticated', p.oid, 'EXECUTE');
  if n < 1 then raise exception 'the derived population is empty'; end if;
  raise notice '0086: % client-callable mutating STAFF endpoint(s) in the derived population', n;

  begin
    -- omission is refused
    v_raised := false;
    begin
      insert into public.client_rpc_registry (function_name, exposure, note)
      values ('run_mcq_quality_probe_0086', 'STAFF', 'probe');
      -- an unknown name has no volatility, so it is not the case under test;
      -- the case under test is a real mutating function registered bare
      update public.client_rpc_registry set authorization_kind = null
       where function_name = 'run_mcq_quality';
    exception when others then v_raised := true;
    end;
    if not v_raised then
      raise exception 'a mutating STAFF endpoint was left without an authorization declaration';
    end if;

    -- a capability nobody holds is refused by the assertion
    update public.client_rpc_registry set authorization_requirement = 'CAN_INVENTED'
     where function_name = 'run_mcq_quality';
    select ok into v_ok from public.assert_staff_rpc_authorization_declared();
    if v_ok then raise exception 'a declared capability that no role holds was accepted'; end if;

    raise exception 'ROLLBACK_PROBE';
  exception when others then
    if sqlerrm <> 'ROLLBACK_PROBE' then raise; end if;
  end;

  select ok into v_ok from public.assert_staff_rpc_authorization_declared();
  if not v_ok then raise exception 'the probe did not roll back'; end if;
  select count(*) into n from public.client_rpc_registry where function_name like '%probe_0086';
  if n <> 0 then raise exception 'the probe left a registry row behind'; end if;

  raise notice '0086 verified: the expected population is declared, closed and independent of any function body';
end $$;
