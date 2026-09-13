-- 0066 -- the evaluation registry: who may evaluate, who may be assumed, and
-- what is currently assumed. ADR B, Task 2 §5.
--
-- THE SHAPE, AND WHY IT IS NOT A ROLE. Evaluator status must not flow through
-- `role_assignments`: an INSTITUTION_ADMIN can grant within their scope there,
-- which is precisely the acquisition path the threat model forbids (row 3).
-- So it is a registry -- the shape this project already uses for
-- `client_rpc_registry` and `public_surface_registry`: RLS on, no policy, no
-- client grant, reachable only through SECURITY DEFINER functions that state
-- their own rule.
--
-- THE ALLOW-LIST IS AN ALLOW-LIST. `evaluation_personas` says which people may
-- be assumed. A person who is not a row cannot be assumed -- not "is filtered
-- out", cannot. That is the control against threat row 2, targeting a real
-- person, and the difference between an allow-list and a filter is the whole
-- of it: a filter that is wrong admits, an allow-list that is wrong refuses.
--
-- WHAT THE PERSONA GUARD REFUSES, AND WHY IT IS MORE THAN "THE RIGHT TENANT".
-- ADR B states that a persona is "bounded to demonstration data by the same
-- tenant mechanisms as every other persona". Measured against this schema on
-- 2026-09-13, that is TRUE for five of the six personas it names and FALSE for
-- the sixth:
--
--   `is_member_of_institution` opens with `if public.is_system_admin() then
--   return true` -- every institution, unconditionally. `audit_log_select` is
--   `is_system_admin() OR ...`, so a SYSTEM_ADMIN reads every real
--   institution's audit log. `role_assignments_guard` lets a SYSTEM_ADMIN grant
--   SYSTEM_ADMIN or INSTITUTION_ADMIN anywhere, unscoped. Scope is not
--   consulted for SYSTEM_ADMIN anywhere in this schema.
--
-- A SYSTEM_ADMIN-roled persona is therefore not a bounded demonstration
-- identity; it is threat row 3 realised. The only ways to bound it are to
-- change `is_system_admin()` -- an authorization root, and FABLE-01's -- or to
-- special-case evaluation inside authorization paths, and ADR B §3.1 forbids
-- the second while Task 2 §2 puts the first out of scope. Escalated to Yazid
-- rather than decided here; the answer was to ship the five bounded personas
-- and make the sixth STRUCTURALLY impossible rather than merely absent.
--
-- Hence the guard below refuses a persona whose person holds platform-wide
-- authority, holds SYSTEM_ADMIN at all, or has any enrolment or grant outside
-- the evaluation institution. "Not present in the seed" is not a control; a
-- refusal is.

-- ---------------------------------------------------------------------------
-- 1. The allow-list.
-- ---------------------------------------------------------------------------
create table public.evaluation_personas (
  id                uuid primary key default gen_random_uuid(),
  person_id         uuid not null references public.persons(id),
  institution_id    uuid not null references public.institutions(id),
  label             text not null,
  role_perspective  public.app_role not null,
  ordinal           smallint not null,
  created_at        timestamptz not null default now(),
  constraint evaluation_personas_person_once unique (person_id),
  constraint evaluation_personas_ordinal_once unique (institution_id, ordinal),
  -- the sixth persona, refused by the table itself and not only by the guard
  constraint evaluation_personas_never_system_admin
    check (role_perspective <> 'SYSTEM_ADMIN'),
  constraint evaluation_personas_label_shape check (label <> '' and length(label) <= 80)
);

comment on table public.evaluation_personas is
  'The bounded allow-list of demonstration identities that may be assumed in '
  'Evaluation Mode. A person who is not a row here cannot be assumed (ADR B).';

alter table public.evaluation_personas enable row level security;
-- No policy, deliberately. Every read goes through a SECURITY DEFINER function
-- that states its own rule, exactly as for client_rpc_registry.
revoke all on public.evaluation_personas from anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Who may enter Evaluation Mode.
-- ---------------------------------------------------------------------------
create table public.evaluation_evaluators (
  id                    uuid primary key default gen_random_uuid(),
  person_id             uuid not null references public.persons(id),
  granted_by_person_id  uuid references public.persons(id),
  granted_at            timestamptz not null default now(),
  revoked_at            timestamptz,
  revoked_by_person_id  uuid references public.persons(id),
  note                  text,
  constraint evaluation_evaluators_revocation_coherent
    check ((revoked_at is null) = (revoked_by_person_id is null))
);

-- revocable and re-grantable, but never two live grants for one person
create unique index evaluation_evaluators_one_live_per_person
  on public.evaluation_evaluators (person_id) where revoked_at is null;

comment on table public.evaluation_evaluators is
  'Who may enter Evaluation Mode. Granted by is_system_admin() only, audited '
  'both ways, and deliberately NOT a role: role_assignments is reachable by an '
  'institution administrator within scope (ADR B, threat row 3).';

alter table public.evaluation_evaluators enable row level security;
revoke all on public.evaluation_evaluators from anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. What is currently assumed.
-- ---------------------------------------------------------------------------
create table public.evaluation_sessions (
  id                    uuid primary key default gen_random_uuid(),
  evaluator_person_id   uuid not null references public.persons(id),
  persona_id            uuid not null references public.evaluation_personas(id),
  persona_auth_user_id  uuid not null references auth.users(id) on delete cascade,
  started_at            timestamptz not null default now(),
  expires_at            timestamptz not null,
  ended_at              timestamptz,
  ended_reason          text,
  constraint evaluation_sessions_end_coherent
    check ((ended_at is null) = (ended_reason is null)),
  constraint evaluation_sessions_expiry_after_start check (expires_at > started_at)
);

-- ONE effective persona at a time per evaluator (ADR B: "simultaneous personas
-- are refused"), enforced by the index rather than by the function that creates
-- the row, so a concurrent second call cannot slip between check and insert.
create unique index evaluation_sessions_one_live_per_evaluator
  on public.evaluation_sessions (evaluator_person_id) where ended_at is null;
-- and one live session per persona account, so two evaluators cannot share a
-- persona and make the audit trail ambiguous about who acted
create unique index evaluation_sessions_one_live_per_persona_account
  on public.evaluation_sessions (persona_auth_user_id) where ended_at is null;
create index evaluation_sessions_persona_auth_user
  on public.evaluation_sessions (persona_auth_user_id, started_at);

comment on table public.evaluation_sessions is
  'The evaluator/persona pairing, its start, its expiry and its end. audit_write '
  'reads this table to stamp the evaluation actor -- a table lookup rather than '
  'a request header, because a header is client-supplied and forgeable and the '
  'evaluation actor must be impossible to hide (Task 2 §6).';

alter table public.evaluation_sessions enable row level security;
revoke all on public.evaluation_sessions from anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. Record classification. Accountability material, like audit_log: it
--    describes what happened inside one institution and never transfers.
-- ---------------------------------------------------------------------------
insert into public.record_class_registry (table_name, portability, note) values
  ('evaluation_personas',   'INSTITUTION_SCOPED', 'demonstration identities; bounded to the evaluation tenant'),
  ('evaluation_evaluators', 'INSTITUTION_SCOPED', 'who may evaluate; platform accountability, never portable'),
  ('evaluation_sessions',   'INSTITUTION_SCOPED', 'who acted as whom and when; accountability material');

-- ---------------------------------------------------------------------------
-- 5. Production refusal, and the persona boundary.
-- ---------------------------------------------------------------------------
create function public.enforce_evaluation_not_in_production()
returns trigger
language plpgsql security definer set search_path = public, pg_temp as $function$
declare v_env text;
begin
  select environment into v_env from public.platform_environment;
  if v_env = 'production' then
    raise exception 'the human-evaluation facility does not exist in production: % is refused (ADR B, INV-21)',
      tg_table_name;
  end if;
  return new;
end $function$;

create trigger evaluation_personas_not_in_production
  before insert or update on public.evaluation_personas
  for each row execute function public.enforce_evaluation_not_in_production();
create trigger evaluation_evaluators_not_in_production
  before insert or update on public.evaluation_evaluators
  for each row execute function public.enforce_evaluation_not_in_production();
create trigger evaluation_sessions_not_in_production
  before insert or update on public.evaluation_sessions
  for each row execute function public.enforce_evaluation_not_in_production();

create function public.enforce_evaluation_persona()
returns trigger
language plpgsql security definer set search_path = public, pg_temp as $function$
declare v_purpose public.official_evidence_purpose; bad text;
begin
  if tg_op = 'DELETE' then
    -- a persona that has ever been assumed is accountability material
    if exists (select 1 from public.evaluation_sessions s where s.persona_id = old.id) then
      raise exception 'this persona has been assumed; its allow-list row is not deleted (audit)';
    end if;
    return old;
  end if;

  -- (a) the persona lives in THE evaluation institution -- not "an official
  --     tenant", not "a non-synthetic tenant": the one declaring HUMAN_EVALUATION
  select i.official_evidence_purpose into v_purpose
    from public.institutions i where i.id = new.institution_id;
  if v_purpose is distinct from 'HUMAN_EVALUATION' then
    raise exception
      'a persona belongs to the institution declaring official_evidence_purpose HUMAN_EVALUATION; this one declares %',
      coalesce(v_purpose::text, 'nothing');
  end if;

  -- (b) the person holds NO platform-wide authority. An unscoped grant, or
  --     SYSTEM_ADMIN at any scope, is platform-wide in this schema --
  --     `is_member_of_institution` and `audit_log_select` both short-circuit on
  --     `is_system_admin()`. Refused at the door rather than left absent.
  select string_agg(distinct ra.role::text, ', ') into bad
    from public.role_assignments ra
   where ra.person_id = new.person_id and ra.revoked_at is null
     and (ra.role = 'SYSTEM_ADMIN' or ra.scope_node_id is null);
  if bad is not null then
    raise exception
      'a persona may not hold platform-wide authority; this person holds % (ADR B threat row 3)', bad;
  end if;

  -- (c) and nothing OUTSIDE the evaluation institution. This is what stops an
  --     allow-list row from pointing at a real learner or a real administrator:
  --     a real person has an enrolment or a grant somewhere else.
  select string_agg(x, '; ') into bad from (
    select 'grant in ' || i.slug as x
      from public.role_assignments ra join public.institutions i on i.id = ra.institution_id
     where ra.person_id = new.person_id and ra.revoked_at is null
       and ra.institution_id is distinct from new.institution_id
    union all
    select 'enrolment in ' || i.slug
      from public.enrollments e join public.institutions i on i.id = e.institution_id
     where e.person_id = new.person_id and e.status <> 'CANCELLED'
       and e.institution_id is distinct from new.institution_id) y;
  if bad is not null then
    raise exception
      'a persona is a demonstration identity, not a real person: this person has % (ADR B threat row 2)', bad;
  end if;

  return new;
end $function$;

create trigger evaluation_personas_boundary
  before insert or update or delete on public.evaluation_personas
  for each row execute function public.enforce_evaluation_persona();

create function public.enforce_evaluation_evaluator()
returns trigger
language plpgsql security definer set search_path = public, pg_temp as $function$
declare v_actor uuid; v_env text;
begin
  if tg_op = 'DELETE' then
    raise exception 'evaluator status is revoked, never deleted (audit)';
  end if;
  if tg_op = 'UPDATE' then
    if new.person_id <> old.person_id or new.granted_at <> old.granted_at
       or new.granted_by_person_id is distinct from old.granted_by_person_id then
      raise exception 'an evaluator grant is immutable; revoke it and grant again';
    end if;
    if old.revoked_at is not null then raise exception 'evaluator status already revoked'; end if;
    return new;
  end if;

  -- INSERT.
  --
  -- This check comes FIRST, above the seed path, and that ordering is the
  -- point: an evaluator is never also a persona, whoever is granting. Written
  -- below the seed's early return it was dead for exactly the caller that
  -- creates both populations, which the probe caught.
  if exists (select 1 from public.evaluation_personas p where p.person_id = new.person_id) then
    raise exception 'a persona cannot also be an evaluator';
  end if;

  -- The rest mirrors role_assignments_guard's shape deliberately: the same rule
  -- in the same words, so a reader who knows one knows the other.
  v_actor := public.current_person_id();
  if auth.uid() is null then
    select environment into v_env from public.platform_environment;
    if v_env = 'production' or current_setting('app.seed_intent', true) is distinct from 'synthetic' then
      raise exception 'evaluator status requires an authenticated grantor';
    end if;
    return new;
  end if;
  if v_actor is null then raise exception 'grantor has no person'; end if;
  if v_actor = new.person_id then
    raise exception 'self-grant of evaluator status is never allowed (INV-16''s rule, applied here)';
  end if;
  if not public.is_system_admin() then
    raise exception 'only an active SYSTEM_ADMIN may grant evaluator status (ADR B threat row 3)';
  end if;
  new.granted_by_person_id := v_actor;
  return new;
end $function$;

create trigger evaluation_evaluators_guard
  before insert or update or delete on public.evaluation_evaluators
  for each row execute function public.enforce_evaluation_evaluator();

create function public.enforce_evaluation_session()
returns trigger
language plpgsql security definer set search_path = public, pg_temp as $function$
declare v_persona_person uuid; v_account uuid;
begin
  if tg_op = 'DELETE' then
    raise exception 'evaluation sessions are ended, never deleted (audit)';
  end if;
  if tg_op = 'UPDATE' then
    if new.evaluator_person_id <> old.evaluator_person_id or new.persona_id <> old.persona_id
       or new.persona_auth_user_id <> old.persona_auth_user_id or new.started_at <> old.started_at then
      raise exception 'an evaluation session''s pairing is immutable; end it and start another';
    end if;
    if old.ended_at is not null and new.ended_at is distinct from old.ended_at then
      raise exception 'this evaluation session has already ended';
    end if;
    return new;
  end if;

  -- the auth user really is the persona's account, so the pairing recorded here
  -- is the pairing audit_write will read back
  select a.person_id into v_account from public.accounts a where a.auth_user_id = new.persona_auth_user_id;
  select p.person_id into v_persona_person from public.evaluation_personas p where p.id = new.persona_id;
  if v_account is null or v_account is distinct from v_persona_person then
    raise exception 'the session''s auth user is not the persona''s account';
  end if;
  if not exists (select 1 from public.evaluation_evaluators e
                  where e.person_id = new.evaluator_person_id and e.revoked_at is null) then
    raise exception 'only a live evaluator may hold an evaluation session';
  end if;
  return new;
end $function$;

create trigger evaluation_sessions_guard
  before insert or update or delete on public.evaluation_sessions
  for each row execute function public.enforce_evaluation_session();

-- ---------------------------------------------------------------------------
-- 6. Granting and revoking evaluator status. System admin only, audited both
--    ways. Not exposed to the client surface: this is an administrative act.
-- ---------------------------------------------------------------------------
create function public.grant_evaluator(p_person uuid, p_note text default null)
returns uuid
language plpgsql security definer set search_path = public, pg_temp as $function$
declare v_id uuid;
begin
  -- The caller must not themselves be inside Evaluation Mode. Without this, a
  -- persona that somehow reached SYSTEM_ADMIN could widen the facility from
  -- inside it. A refusal at the evaluation surface, never a decision in an
  -- authorization path.
  if exists (select 1 from public.evaluation_sessions s
              where s.persona_auth_user_id = auth.uid() and s.ended_at is null) then
    raise exception 'evaluator status is not granted from inside Evaluation Mode';
  end if;
  insert into public.evaluation_evaluators (person_id, note) values (p_person, p_note)
  returning id into v_id;
  perform public.audit_write('evaluator.grant', 'evaluation_evaluators', v_id::text, null,
                             jsonb_build_object('person_id', p_person, 'note', p_note));
  return v_id;
end $function$;

create function public.revoke_evaluator(p_person uuid, p_reason text)
returns void
language plpgsql security definer set search_path = public, pg_temp as $function$
declare v_actor uuid; v_id uuid; n int;
begin
  v_actor := public.current_person_id();
  if not public.is_system_admin() then
    raise exception 'only an active SYSTEM_ADMIN may revoke evaluator status';
  end if;
  update public.evaluation_evaluators
     set revoked_at = now(), revoked_by_person_id = v_actor
   where person_id = p_person and revoked_at is null
  returning id into v_id;
  if v_id is null then raise exception 'that person holds no live evaluator status'; end if;
  -- revocation ends any live evaluation session in the same breath: INV-17's
  -- rule is that revocation takes effect on the next check, and leaving a live
  -- persona session behind a revoked evaluator would be exactly the gap
  update public.evaluation_sessions
     set ended_at = now(), ended_reason = 'evaluator revoked'
   where evaluator_person_id = p_person and ended_at is null;
  get diagnostics n = row_count;
  perform public.audit_write('evaluator.revoke', 'evaluation_evaluators', v_id::text, null,
                             jsonb_build_object('person_id', p_person, 'reason', p_reason,
                                                'sessions_ended', n));
end $function$;

-- EVERY function this migration creates is revoked from the client roles AND
-- from `public`. The `alter default privileges` lines in 0001 revoke from anon
-- and authenticated but not from PUBLIC, and EXECUTE is granted to PUBLIC by
-- default -- so a function that is merely "not granted" is in fact executable
-- by anon. Six of these were, until `functions_executable_by_anon` went 0 -> 6
-- and said so. That counter is the reason this is a paragraph and not an
-- incident.
revoke all on function public.grant_evaluator(uuid, text) from public, anon, authenticated;
revoke all on function public.revoke_evaluator(uuid, text) from public, anon, authenticated;
revoke all on function public.enforce_evaluation_not_in_production() from public, anon, authenticated;
revoke all on function public.enforce_evaluation_persona() from public, anon, authenticated;
revoke all on function public.enforce_evaluation_evaluator() from public, anon, authenticated;
revoke all on function public.enforce_evaluation_session() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 7. The boundary assertion. The guard refuses at the door; this measures
--    continuously, because a grant made later would not pass through the door.
-- ---------------------------------------------------------------------------
create function public.assert_evaluation_boundary()
returns table(ok boolean, detail text)
language plpgsql stable security definer set search_path = public, pg_temp as $function$
declare problems text[] := '{}'; bad text; v_env text;
        n_personas int; n_evaluators int; n_live int;
begin
  select environment into v_env from public.platform_environment;
  select count(*) into n_personas from public.evaluation_personas;
  select count(*) into n_evaluators from public.evaluation_evaluators where revoked_at is null;
  select count(*) into n_live from public.evaluation_sessions where ended_at is null;

  if v_env = 'production' and (n_personas > 0 or n_evaluators > 0 or n_live > 0) then
    problems := problems || 'the evaluation facility has rows in production'::text;
  end if;

  -- no persona holds platform-wide authority, measured now rather than trusted
  -- from insert time
  select string_agg(distinct pe.label || ' (' || ra.role::text || ')', ', ') into bad
    from public.evaluation_personas pe
    join public.role_assignments ra on ra.person_id = pe.person_id and ra.revoked_at is null
   where ra.role = 'SYSTEM_ADMIN' or ra.scope_node_id is null;
  if bad is not null then
    problems := problems || ('persona(s) holding platform-wide authority: ' || bad);
  end if;

  -- and nothing outside the evaluation institution
  select string_agg(distinct pe.label, ', ') into bad
    from public.evaluation_personas pe
   where exists (select 1 from public.role_assignments ra
                  where ra.person_id = pe.person_id and ra.revoked_at is null
                    and ra.institution_id is distinct from pe.institution_id)
      or exists (select 1 from public.enrollments e
                  where e.person_id = pe.person_id and e.status <> 'CANCELLED'
                    and e.institution_id is distinct from pe.institution_id);
  if bad is not null then
    problems := problems || ('persona(s) reaching outside the evaluation institution: ' || bad);
  end if;

  -- every persona sits in the HUMAN_EVALUATION institution
  select string_agg(distinct pe.label, ', ') into bad
    from public.evaluation_personas pe join public.institutions i on i.id = pe.institution_id
   where i.official_evidence_purpose is distinct from 'HUMAN_EVALUATION';
  if bad is not null then
    problems := problems || ('persona(s) outside the evaluation institution: ' || bad);
  end if;

  -- an evaluator is never a persona, in either direction
  select string_agg(distinct p.id::text, ', ') into bad
    from public.persons p
   where exists (select 1 from public.evaluation_personas pe where pe.person_id = p.id)
     and exists (select 1 from public.evaluation_evaluators ev
                  where ev.person_id = p.id and ev.revoked_at is null);
  if bad is not null then
    problems := problems || ('person(s) who are both evaluator and persona: ' || bad);
  end if;

  -- evaluator status never became a role
  if exists (select 1 from pg_enum e join pg_type t on t.oid = e.enumtypid
              where t.typname = 'app_role' and e.enumlabel ilike '%evaluat%') then
    problems := problems || 'app_role gained an evaluator value: evaluator status became a role'::text;
  end if;

  -- and no live session outlives its evaluator
  select count(*)::text into bad from public.evaluation_sessions s
   where s.ended_at is null
     and not exists (select 1 from public.evaluation_evaluators e
                      where e.person_id = s.evaluator_person_id and e.revoked_at is null);
  if bad <> '0' then
    problems := problems || (bad || ' live evaluation session(s) whose evaluator is revoked');
  end if;

  ok := array_length(problems, 1) is null;
  detail := case when ok then format(
      'environment=%s; %s persona(s), %s live evaluator(s), %s live session(s); '
      || 'no persona holds platform-wide authority or reaches outside the evaluation institution',
      v_env, n_personas, n_evaluators, n_live)
    else array_to_string(problems, '; ') end;
  return next;
end $function$;

revoke all on function public.assert_evaluation_boundary() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Terminal verification (ADR-0014).
-- ---------------------------------------------------------------------------
do $$
declare
  n int; v_refused boolean; v_msg text;
  v_eval_inst uuid; v_other uuid; v_period uuid; v_fac uuid;
  v_p1 uuid; v_p2 uuid; v_real uuid; v_persona uuid;
  v_free public.official_evidence_purpose;
begin
  -- === structural ==========================================================
  foreach v_msg in array array['evaluation_personas','evaluation_evaluators','evaluation_sessions'] loop
    if not exists (select 1 from pg_class c where c.relname = v_msg
                     and c.relnamespace = 'public'::regnamespace and c.relrowsecurity) then
      raise exception '% does not have row level security enabled', v_msg;
    end if;
    if exists (select 1 from information_schema.role_table_grants g
                where g.table_schema = 'public' and g.table_name = v_msg
                  and g.grantee in ('anon','authenticated')) then
      raise exception '% is granted to a client role; it is reachable only through functions', v_msg;
    end if;
    if not exists (select 1 from public.record_class_registry r where r.table_name = v_msg) then
      raise exception '% is not classified in record_class_registry', v_msg;
    end if;
  end loop;
  -- evaluator status is not, and cannot be, a role
  if exists (select 1 from pg_enum e join pg_type t on t.oid = e.enumtypid
              where t.typname = 'app_role' and e.enumlabel ilike '%evaluat%') then
    raise exception 'app_role gained an evaluator value';
  end if;
  -- the administrative functions are not on the client surface
  if has_function_privilege('authenticated', 'public.grant_evaluator(uuid, text)'::regprocedure, 'EXECUTE')
     or has_function_privilege('anon', 'public.grant_evaluator(uuid, text)'::regprocedure, 'EXECUTE') then
    raise exception 'grant_evaluator is executable by a client role';
  end if;
  -- not one function this migration adds is reachable by a client role. Asserted
  -- by counting rather than by listing, so a function added later to this file
  -- without a revoke fails here instead of in the lint three migrations on.
  select count(*) into n from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and p.proname like '%evaluat%'
     and (has_function_privilege('anon', p.oid, 'EXECUTE')
       or has_function_privilege('authenticated', p.oid, 'EXECUTE'));
  if n <> 0 then
    raise exception '% evaluation function(s) are executable by a client role', n;
  end if;

  -- and no authorization root learned about evaluation
  if pg_get_functiondef('public.current_person_id()'::regprocedure) ~* 'evaluation' then
    raise exception 'current_person_id learned about evaluation; ADR B forbids exactly this';
  end if;
  if pg_get_functiondef('public.is_system_admin()'::regprocedure) ~* 'evaluation' then
    raise exception 'is_system_admin learned about evaluation';
  end if;
  if pg_get_functiondef('public.is_member_of_institution(uuid)'::regprocedure) ~* 'evaluation' then
    raise exception 'is_member_of_institution learned about evaluation';
  end if;

  -- === behavioural, in a rolled-back subtransaction ========================
  begin
    -- USE the evaluation institution if one exists, create it if not. Requiring
    -- the slot to be FREE made this probe pass from empty and fail on any
    -- upgrade path where the human-evaluation seed had run -- a probe that
    -- cannot run where it matters most (ADR-0014, L6).
    select i.id into v_eval_inst from public.institutions i
     where i.official_evidence_purpose = 'HUMAN_EVALUATION';
    if v_eval_inst is null then
      insert into public.institutions (name, slug, is_synthetic, is_active,
                                       is_official_bootstrap, official_evidence_purpose)
      values ('probe 0066 evaluation', 'probe-0066-evaluation', false, true, true, 'HUMAN_EVALUATION')
      returning id into v_eval_inst;
    end if;
    insert into public.institutions (name, slug, is_synthetic, is_active)
    values ('probe 0066 real school', 'probe-0066-real', true, true) returning id into v_other;
    insert into public.academic_periods (institution_id, name, starts_on, ends_on)
    values (v_other, '2026/2027', current_date - 30, current_date + 300) returning id into v_period;

    insert into public.persons (display_name) values ('probe persona') returning id into v_p1;
    insert into public.persons (display_name) values ('probe evaluator') returning id into v_p2;
    insert into public.persons (display_name) values ('probe real learner') returning id into v_real;

    -- (1) a persona in the evaluation institution is accepted
    insert into public.evaluation_personas (person_id, institution_id, label, role_perspective, ordinal)
    values (v_p1, v_eval_inst, 'probe murid', 'STUDENT', 91) returning id into v_persona;

    -- (2) a persona pointing at a REAL person -- one with an enrolment
    --     elsewhere -- is refused BY NAME. Threat row 2.
    insert into public.enrollments (person_id, institution_id, academic_period_id, status, valid_from)
    values (v_real, v_other, v_period, 'ACTIVE', now() - interval '1 day');
    v_refused := false; v_msg := '';
    begin
      insert into public.evaluation_personas (person_id, institution_id, label, role_perspective, ordinal)
      values (v_real, v_eval_inst, 'probe murid asli', 'STUDENT', 99);
    exception when others then v_refused := true; v_msg := sqlerrm; end;
    if not v_refused then
      raise exception 'a real person with an enrolment elsewhere was admitted to the allow-list';
    end if;
    if v_msg !~ 'not a real person' then
      raise exception 'the real-person refusal fired for the wrong reason: %', v_msg;
    end if;

    -- (3) a SYSTEM_ADMIN perspective is refused by the table constraint --
    --     the sixth persona is impossible, not merely absent
    v_refused := false;
    begin
      insert into public.evaluation_personas (person_id, institution_id, label, role_perspective, ordinal)
      values (v_p2, v_eval_inst, 'probe admin platform', 'SYSTEM_ADMIN', 98);
    exception when others then v_refused := true; end;
    if not v_refused then
      raise exception 'a SYSTEM_ADMIN persona was admitted';
    end if;

    -- (4) a persona outside the evaluation institution is refused
    v_refused := false;
    begin
      insert into public.evaluation_personas (person_id, institution_id, label, role_perspective, ordinal)
      values (v_p2, v_other, 'probe murid lain', 'STUDENT', 97);
    exception when others then v_refused := true; end;
    if not v_refused then
      raise exception 'a persona was admitted outside the evaluation institution';
    end if;

    -- (5) evaluator status: the seed path works without an authenticated
    --     grantor, and the person is not a persona
    perform set_config('app.seed_intent', 'synthetic', true);
    insert into public.evaluation_evaluators (person_id, note) values (v_p2, 'probe');
    perform set_config('app.seed_intent', '', true);

    -- (6) an evaluator who is already a persona is refused, in that direction too
    v_refused := false;
    begin
      perform set_config('app.seed_intent', 'synthetic', true);
      insert into public.evaluation_evaluators (person_id, note) values (v_p1, 'probe');
      perform set_config('app.seed_intent', '', true);
    exception when others then v_refused := true; perform set_config('app.seed_intent', '', true); end;
    if not v_refused then
      raise exception 'a persona was also made an evaluator';
    end if;

    -- (7) two live evaluator grants for one person are refused
    v_refused := false;
    begin
      perform set_config('app.seed_intent', 'synthetic', true);
      insert into public.evaluation_evaluators (person_id, note) values (v_p2, 'again');
      perform set_config('app.seed_intent', '', true);
    exception when others then v_refused := true; perform set_config('app.seed_intent', '', true); end;
    if not v_refused then
      raise exception 'a person holds two live evaluator grants';
    end if;

    -- (8) the boundary assertion holds over what was just built
    select count(*) into n from public.assert_evaluation_boundary() a where a.ok;
    if n <> 1 then
      raise exception 'assert_evaluation_boundary is false over its own probe fixture: %',
        (select a.detail from public.assert_evaluation_boundary() a);
    end if;

    raise exception 'PROBE_0066_ROLLBACK';
  exception when others then
    if sqlerrm <> 'PROBE_0066_ROLLBACK' then raise; end if;
  end;
end $$;
