-- 0067 -- the dual-identity audit. Task 2 §6, ADR B.
--
-- THE QUESTION THIS ANSWERS. After Evaluation Mode exists, "who did this?" has
-- two answers: whose authorization was exercised, and who was actually sitting
-- at the keyboard. An audit trail that records only the first is worse than
-- useless for evaluation, because an evaluator's action becomes
-- indistinguishable from a genuine learner's -- threat row 5, audit laundering.
--
-- TWO ADDITIVE COLUMNS, NOT THE SUMMARY. `summary` is free-form; putting
-- identity in it would overload a field nobody validates with a meaning
-- everybody has to trust, and would make "who really did this?" a JSON search
-- rather than a column read. Rejected explicitly in ADR B and again here.
--
-- ARITY UNCHANGED. `audit_write` stays five arguments across all 29 call
-- sites, pinned by `assert_audit_write_arity`. Nothing about this change
-- reaches a call site, which is the reason a trail-wide property can be added
-- at all without touching twenty-nine functions.
--
-- A TABLE LOOKUP, NOT A REQUEST HEADER -- and this is where Task 2 §6 corrects
-- ADR B. ADR B proposed reading the evaluation actor from a session-scoped
-- setting "exactly as audit_write already reads the build SHA from the
-- request". The build SHA arrives as `x-pintar-build`, which is
-- client-supplied and forgeable; ADR-0001 accepted that because a build SHA is
-- "provenance, never authority". The evaluation actor is the opposite: it must
-- be impossible to HIDE. A forgeable input would let an evaluator's action be
-- recorded as a genuine learner's simply by omitting a header -- precisely the
-- laundering the threat model forbids. So the actor is derived server-side from
-- `evaluation_sessions`, keyed on `auth.uid()`: unforgeable, unhidable, and no
-- new argument.
--
-- WHY THE LOOKUP IGNORES EXPIRY, WHICH LOOKS WRONG AND IS NOT. The session is
-- read on `ended_at is null` alone, NOT on `expires_at > now()`. If expiry
-- gated the stamp, then a persona whose evaluation session had expired but not
-- yet been ended would write audit rows carrying NO evaluation actor -- a
-- laundering window that opens by itself, on a timer, with no attacker
-- required. Expiry governs whether new actions are PERMITTED; it must never
-- govern whether identity is RECORDED. Those are different questions and this
-- is the one place the difference bites.

alter table public.audit_log
  add column evaluation_actor_person_id uuid references public.persons(id),
  add column evaluation_session_id uuid references public.evaluation_sessions(id);

comment on column public.audit_log.evaluation_actor_person_id is
  'Who actually performed this action when it was performed inside Evaluation '
  'Mode. NULL means genuine: actor_person_id acted as themselves. Derived '
  'server-side inside audit_write from evaluation_sessions; never supplied by a '
  'caller (Task 2 §6).';
comment on column public.audit_log.evaluation_session_id is
  'The evaluation session this action was performed under. NULL for every '
  'ordinary action.';

create index audit_log_evaluation_actor
  on public.audit_log (evaluation_actor_person_id, at)
  where evaluation_actor_person_id is not null;

create or replace function public.audit_write(p_action text, p_target_table text, p_target_id text,
                                              p_institution_id uuid, p_summary jsonb default '{}'::jsonb)
returns bigint
language plpgsql security definer set search_path = public, pg_temp as $function$
declare v_id bigint; v_person uuid; v_sha text;
        v_eval_actor uuid; v_eval_session uuid;
begin
  begin
    select a.person_id into v_person from public.accounts a where a.auth_user_id = auth.uid();
  exception when undefined_table then v_person := null; end;

  -- ADDED IN 0067. The second identity, derived here and nowhere else.
  -- `ended_at is null` alone, and deliberately NOT the session's expiry -- see
  -- this migration's header: an expired-but-unended session must still be
  -- recorded, or expiry becomes a laundering window that opens on a timer.
  begin
    select s.evaluator_person_id, s.id into v_eval_actor, v_eval_session
      from public.evaluation_sessions s
     where s.persona_auth_user_id = auth.uid() and s.ended_at is null
     order by s.started_at desc
     limit 1;
  exception when undefined_table then v_eval_actor := null; v_eval_session := null; end;

  v_sha := nullif(current_setting('app.build_sha', true), '');
  if v_sha is null then
    begin
      v_sha := nullif(current_setting('request.headers', true), '')::jsonb ->> 'x-pintar-build';
    exception when others then v_sha := null; end;
  end if;
  if v_sha !~ '^[0-9a-f]{7,40}$' then v_sha := null; end if;

  insert into public.audit_log (actor_auth_uid, actor_person_id, action, target_table, target_id,
                                institution_id, summary, build_sha,
                                evaluation_actor_person_id, evaluation_session_id)
  values (auth.uid(), v_person, p_action, p_target_table, p_target_id, p_institution_id,
          coalesce(p_summary,'{}'::jsonb), v_sha, v_eval_actor, v_eval_session)
  returning id into v_id;
  return v_id;
end $function$;

-- ---------------------------------------------------------------------------
-- The property, asserted over the trail rather than checked per call site.
--
-- Task 2 §9: "Every audit_log row written under an active evaluation session
-- carries a non-NULL evaluation_actor_person_id, and every row outside one
-- carries NULL." Both halves matter. The first is the laundering control. The
-- second stops the column becoming decorative -- a stamp that is always present
-- distinguishes nothing.
--
-- "Under a session" is defined by the session's own window, not by a flag:
-- the row's actor is the persona's auth user and the row's timestamp falls
-- inside [started_at, ended_at). That definition is why seed data -- written as
-- the personas long before any evaluator exists -- is correctly outside every
-- window and correctly carries NULL.
-- ---------------------------------------------------------------------------
create function public.assert_evaluation_audit_complete()
returns table(ok boolean, detail text)
language plpgsql stable security definer set search_path = public, pg_temp as $function$
declare problems text[] := '{}'; v_src text;
        n_stamped bigint; n_half bigint; n_wrong_actor bigint; n_wrong_row bigint;
        n_writers bigint; n_late bigint;
begin
  -- === completeness is STRUCTURAL, and this is why =========================
  --
  -- The first version of this assertion defined "written under a session" by
  -- reconstructing a time window: the row's `at` between the session's
  -- `started_at` and `ended_at`. That definition cannot express the property.
  -- `audit_log.at` defaults to `now()`, which is TRANSACTION start time, so
  -- every row written in one transaction shares a timestamp with every other
  -- row -- and with a session started or ended in that same transaction. The
  -- window then classifies rows written before a session as inside it and rows
  -- written during one as outside it, both wrongly, and no amount of care with
  -- `<` versus `<=` fixes it.
  --
  -- So completeness is established where it is actually true: by construction.
  -- `audit_write` is the ONLY writer into audit_log, and it stamps
  -- unconditionally from a live-session lookup on `auth.uid()`. If both of
  -- those hold, no row written under a session can lack the stamp -- there is
  -- no code path that could produce one. Those are the two checks below, and
  -- they are worth more than a data scan because they hold for rows that do not
  -- exist yet.
  v_src := pg_get_functiondef('public.audit_write(text, text, text, uuid, jsonb)'::regprocedure);
  if v_src !~ 'evaluation_sessions' then
    problems := problems || 'audit_write no longer derives the evaluation actor from evaluation_sessions'::text;
  end if;
  if v_src !~ 's\.ended_at is null' then
    problems := problems || 'audit_write no longer keys the evaluation stamp on a live session'::text;
  end if;
  -- The expiry trap. Matched as a QUALIFIED COLUMN READ rather than as the bare
  -- word: the first version of this check matched its own explanatory comment.
  if v_src ~ 's\.expires_at' then
    problems := problems || 'audit_write gates the evaluation stamp on expiry: an expired session would launder'::text;
  end if;
  -- The actor is never taken from anything a caller controls. Matched
  -- LINE-WISE ((?n) stops `.` crossing newlines): audit_write legitimately
  -- reads request.headers for the build SHA a few lines away, and a
  -- whole-text proximity match fired on that.
  if v_src ~ '(?n)v_eval.*(request\.headers|current_setting)' then
    problems := problems || 'audit_write takes the evaluation actor from a caller-supplied value: it is forgeable'::text;
  end if;
  select count(*) into n_writers from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
   where ns.nspname = 'public' and p.proname <> 'audit_write'
     and p.prosrc ~ 'insert\s+into\s+public\.audit_log';
  if n_writers > 0 then
    problems := problems || format(
      '%s function(s) other than audit_write insert into audit_log: completeness is no longer structural',
      n_writers);
  end if;

  -- === coherence is DATA, and is time-free =================================
  --
  -- These say the stamp cannot be wrong, incomplete, or attached to a row it
  -- does not belong to. They need no clock and hold row by row.
  select count(*) into n_stamped from public.audit_log where evaluation_session_id is not null;
  -- (a) never half-stamped
  select count(*) into n_half from public.audit_log
   where (evaluation_actor_person_id is null) <> (evaluation_session_id is null);
  if n_half > 0 then
    problems := problems || format('%s audit row(s) carry one evaluation column but not the other', n_half);
  end if;
  -- (b) the named evaluator is the session's evaluator
  select count(*) into n_wrong_actor from public.audit_log al
    join public.evaluation_sessions s on s.id = al.evaluation_session_id
   where al.evaluation_actor_person_id is distinct from s.evaluator_person_id;
  if n_wrong_actor > 0 then
    problems := problems || format(
      '%s audit row(s) name an evaluation actor who is not that session''s evaluator', n_wrong_actor);
  end if;
  -- (c) and the stamped row really was written by that session's persona, so a
  --     stamp cannot be moved onto somebody else's action
  select count(*) into n_wrong_row from public.audit_log al
    join public.evaluation_sessions s on s.id = al.evaluation_session_id
   where al.actor_auth_uid is distinct from s.persona_auth_user_id;
  if n_wrong_row > 0 then
    problems := problems || format(
      '%s audit row(s) carry a session stamp but were not written by that session''s persona', n_wrong_row);
  end if;

  -- (d) a data scan for the laundering case that CAN be expressed without the
  --     window: a row written strictly after a still-live session began, by
  --     that session's persona, carrying no stamp. Strict `>` keeps it correct
  --     across transactions; within a single transaction it is vacuous, which
  --     is stated rather than relied upon -- the structural checks above are
  --     what actually carry completeness.
  select count(*) into n_late from public.audit_log al
    join public.evaluation_sessions s on s.persona_auth_user_id = al.actor_auth_uid
   where s.ended_at is null and al.at > s.started_at and al.evaluation_session_id is null;
  if n_late > 0 then
    problems := problems || format(
      '%s audit row(s) written by a persona during its live session carry no evaluation actor', n_late);
  end if;

  ok := array_length(problems, 1) is null;
  detail := case when ok then format(
      '%s audit row(s) carry both identities, every one naming its own session''s evaluator and its own '
      || 'persona; audit_write is the only writer into audit_log and stamps from a live-session lookup, '
      || 'so completeness is structural rather than scanned',
      n_stamped)
    else array_to_string(problems, '; ') end;
  return next;
end $function$;

revoke all on function public.assert_evaluation_audit_complete() from public, anon, authenticated;

create or replace function public.platform_schema_lint()
returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp as $function$
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
  -- ADDED IN 0065. The composition of the line above, one counter per approved
  -- purpose. Named explicitly rather than emitted as a map, so a new purpose
  -- shows up as a new KEY in the lint output and cannot arrive unnoticed inside
  -- an existing one.
  select count(*) into n from public.institutions
   where official_evidence_purpose = 'D1_ENGINEERING_BOOTSTRAP';
  v := v || jsonb_build_object('official_purpose_d1_engineering_bootstrap', n);
  select count(*) into n from public.institutions
   where official_evidence_purpose = 'HUMAN_EVALUATION';
  v := v || jsonb_build_object('official_purpose_human_evaluation', n);
  select count(*) into n from public.institutions where not is_synthetic;
  v := v || jsonb_build_object('non_synthetic_institutions', n);
  select a.ok into v_ok from public.assert_official_evidence_bootstrap() a;
  v := v || jsonb_build_object('official_bootstrap_ok', v_ok);
  select count(*) into n from public.institutions where tenant_kind = 'PLATFORM_CANONICAL';
  v := v || jsonb_build_object('platform_canonical_tenants', n);
  select a.ok into v_ok from public.assert_canonical_tenants() a;
  v := v || jsonb_build_object('canonical_tenants_ok', v_ok);

  -- ADDED IN 0067. The human-evaluation facility, counted so its absence in
  -- production is MEASURED rather than assumed: a production deployment with a
  -- non-zero count fails the gate (ADR B). Declared as new keys; nothing is
  -- folded into an existing counter.
  select count(*) into n from public.evaluation_personas;
  v := v || jsonb_build_object('evaluation_personas', n);
  select count(*) into n from public.evaluation_evaluators where revoked_at is null;
  v := v || jsonb_build_object('evaluation_evaluators_live', n);
  select count(*) into n from public.evaluation_sessions where ended_at is null;
  v := v || jsonb_build_object('evaluation_sessions_live', n);
  select a.ok into v_ok from public.assert_evaluation_boundary() a;
  v := v || jsonb_build_object('evaluation_boundary_ok', v_ok);
  select a.ok into v_ok from public.assert_evaluation_audit_complete() a;
  v := v || jsonb_build_object('evaluation_audit_complete_ok', v_ok);
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
  select count(*) into n from public.public_surface_registry where parent is null;
  v := v || jsonb_build_object('anon_public_surface', n);
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
end $function$;


-- ---------------------------------------------------------------------------
-- Terminal verification (ADR-0014). The behavioural half builds an evaluation
-- institution, a persona with a real account, an evaluator and a live session
-- in a rolled-back subtransaction, then writes audit rows on both sides of the
-- boundary and reads them back.
-- ---------------------------------------------------------------------------
do $$
declare
  n bigint; v_src text;
  v_eval_inst uuid; v_period uuid;
  v_persona_uid uuid := gen_random_uuid(); v_persona_person uuid;
  v_evaluator_uid uuid := gen_random_uuid(); v_evaluator_person uuid;
  v_persona uuid; v_session uuid; v_row bigint;
begin
  -- === structural ==========================================================
  if not exists (select 1 from information_schema.columns
                  where table_schema='public' and table_name='audit_log'
                    and column_name='evaluation_actor_person_id') then
    raise exception 'audit_log.evaluation_actor_person_id is missing';
  end if;
  if not exists (select 1 from information_schema.columns
                  where table_schema='public' and table_name='audit_log'
                    and column_name='evaluation_session_id') then
    raise exception 'audit_log.evaluation_session_id is missing';
  end if;
  -- both nullable: every ordinary action carries NULL, and a NOT NULL here
  -- would have meant back-filling a meaning onto history that did not have one
  if exists (select 1 from information_schema.columns
              where table_schema='public' and table_name='audit_log'
                and column_name in ('evaluation_actor_person_id','evaluation_session_id')
                and is_nullable = 'NO') then
    raise exception 'an evaluation audit column is NOT NULL; ordinary actions must carry NULL';
  end if;
  -- the arity guard still passes, which is the claim "no call site was touched"
  if not (select a.ok from public.assert_audit_write_arity() a) then
    raise exception 'audit_write''s arity guard broke: %', (select a.detail from public.assert_audit_write_arity() a);
  end if;
  v_src := pg_get_functiondef('public.audit_write(text, text, text, uuid, jsonb)'::regprocedure);
  if v_src !~ 'evaluation_sessions' then
    raise exception 'audit_write does not derive the evaluation actor from evaluation_sessions';
  end if;
  if v_src ~ 's\.expires_at' then
    raise exception 'audit_write gates the evaluation stamp on expiry: the laundering window is open';
  end if;
  if v_src !~ 's\.ended_at is null' then
    raise exception 'audit_write no longer keys the evaluation stamp on a live session';
  end if;
  -- the new assertion is not on the client surface either
  if has_function_privilege('anon', 'public.assert_evaluation_audit_complete()'::regprocedure, 'EXECUTE')
     or has_function_privilege('authenticated', 'public.assert_evaluation_audit_complete()'::regprocedure, 'EXECUTE') then
    raise exception 'assert_evaluation_audit_complete is executable by a client role';
  end if;
  -- and identity did NOT move into the free-form field. Matched as the SHAPE of
  -- an injection -- concatenating into or rewriting p_summary -- rather than as
  -- proximity of two words, which matched the multi-line INSERT's own column
  -- list on the first attempt. The third prose-matching guard in this build;
  -- the rule is now explicit: assert on syntax a compiler would see, never on
  -- text a comment could contain.
  if v_src ~ 'p_summary\s*\|\||\|\|\s*p_summary|jsonb_set\s*\(\s*p_summary' then
    raise exception 'the evaluation actor was packed into summary; it belongs in a column';
  end if;
  if v_src !~ 'coalesce\(p_summary' then
    raise exception 'audit_write no longer passes summary through untouched';
  end if;

  -- === behavioural, in a rolled-back subtransaction ========================
  begin
    if exists (select 1 from public.institutions where official_evidence_purpose = 'HUMAN_EVALUATION') then
      raise exception 'HUMAN_EVALUATION is already occupied; this probe cannot run';
    end if;
    insert into public.institutions (name, slug, is_synthetic, is_active,
                                     is_official_bootstrap, official_evidence_purpose)
    values ('probe 0067 evaluation', 'probe-0067-evaluation', false, true, true, 'HUMAN_EVALUATION')
    returning id into v_eval_inst;

    insert into auth.users (id, email) values (v_persona_uid, 'probe0067-persona@local.invalid');
    select a.person_id into v_persona_person from public.accounts a where a.auth_user_id = v_persona_uid;
    insert into auth.users (id, email) values (v_evaluator_uid, 'probe0067-evaluator@local.invalid');
    select a.person_id into v_evaluator_person from public.accounts a where a.auth_user_id = v_evaluator_uid;

    insert into public.evaluation_personas (person_id, institution_id, label, role_perspective, ordinal)
    values (v_persona_person, v_eval_inst, 'Murid', 'STUDENT', 1) returning id into v_persona;
    perform set_config('app.seed_intent', 'synthetic', true);
    insert into public.evaluation_evaluators (person_id, note) values (v_evaluator_person, 'probe');
    perform set_config('app.seed_intent', '', true);

    -- (1) BEFORE any session: the persona acts, and the row is genuine. This is
    --     the second half of the property and the half that keeps the column
    --     meaningful -- it is also exactly the shape of seed data.
    perform set_config('request.jwt.claims', json_build_object('sub', v_persona_uid::text)::text, true);
    perform set_config('request.jwt.claim.sub', v_persona_uid::text, true);
    v_row := public.audit_write('probe.before', 'probe', null, v_eval_inst, '{}'::jsonb);
    if (select al.evaluation_actor_person_id from public.audit_log al where al.id = v_row) is not null then
      raise exception 'an action outside any evaluation session was stamped with an evaluation actor';
    end if;

    -- (2) a live session: the same persona acts and BOTH identities are recorded
    insert into public.evaluation_sessions (evaluator_person_id, persona_id, persona_auth_user_id, expires_at)
    values (v_evaluator_person, v_persona, v_persona_uid, now() + interval '1 hour')
    returning id into v_session;
    v_row := public.audit_write('probe.during', 'probe', null, v_eval_inst, '{}'::jsonb);
    if (select al.actor_person_id from public.audit_log al where al.id = v_row) is distinct from v_persona_person then
      raise exception 'the acting identity is not the persona: whose authorization was exercised is wrong';
    end if;
    if (select al.evaluation_actor_person_id from public.audit_log al where al.id = v_row)
         is distinct from v_evaluator_person then
      raise exception 'the evaluation actor was not recorded: an evaluator''s action reads as genuine';
    end if;
    if (select al.evaluation_session_id from public.audit_log al where al.id = v_row) is distinct from v_session then
      raise exception 'the evaluation session was not recorded on the audit row';
    end if;

    -- (3) THE EXPIRY TRAP. The session expires but has not been ended. The
    --     persona acts again. The row must STILL carry both identities -- if it
    --     did not, laundering would become a matter of waiting.
    -- expired legitimately rather than by rewriting history: `expires_at >
    -- started_at` is a real constraint and the probe has to respect it, so the
    -- window is narrowed to the smallest legal value and is therefore already
    -- in the past by the time the next statement runs.
    update public.evaluation_sessions
       set expires_at = started_at + interval '1 microsecond' where id = v_session;
    -- checked against clock_timestamp(), not now(): inside one transaction
    -- now() is frozen at transaction start and equals started_at, so the
    -- smallest legal expiry would read as still in the future and the probe
    -- would silently test nothing.
    if (select s.expires_at >= clock_timestamp() from public.evaluation_sessions s where s.id = v_session) then
      raise exception 'the probe session did not actually expire; case (3) would prove nothing';
    end if;
    v_row := public.audit_write('probe.expired', 'probe', null, v_eval_inst, '{}'::jsonb);
    if (select al.evaluation_actor_person_id from public.audit_log al where al.id = v_row)
         is distinct from v_evaluator_person then
      raise exception
        'an expired-but-unended evaluation session stopped stamping: expiry opened a laundering window';
    end if;

    -- (4) after the session ENDS, the persona is genuine again
    update public.evaluation_sessions set ended_at = now(), ended_reason = 'probe' where id = v_session;
    v_row := public.audit_write('probe.after', 'probe', null, v_eval_inst, '{}'::jsonb);
    if (select al.evaluation_actor_person_id from public.audit_log al where al.id = v_row) is not null then
      raise exception 'an action after the session ended was still stamped';
    end if;

    -- (5) the trail-wide property holds over everything just written
    if not (select a.ok from public.assert_evaluation_audit_complete() a) then
      raise exception 'the dual-identity property is false over this probe: %',
        (select a.detail from public.assert_evaluation_audit_complete() a);
    end if;

    raise exception 'PROBE_0067_ROLLBACK';
  exception when others then
    if sqlerrm <> 'PROBE_0067_ROLLBACK' then raise; end if;
  end;
end $$;
