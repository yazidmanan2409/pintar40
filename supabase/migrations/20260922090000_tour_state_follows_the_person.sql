-- 0089 -- a first-login tour is remembered about the PERSON, not the browser.
--
-- WHY THIS IS BACKEND STATE AT ALL. PINTAR is deployed into classrooms where a
-- device is shared between learners across a period, and where one person uses
-- the school machine in the morning and a phone in the evening. localStorage
-- answers "has this BROWSER seen the tour", and that is the wrong question in
-- both directions: it re-shows the tour to a person who finished it on another
-- device, and it hides the tour from the next child to sit down at the same
-- machine. Durable tour state therefore follows the authenticated person, which
-- means it lives here.
--
-- WHAT THIS IS NOT. Tour state is PRESENTATION state. It is not learning
-- evidence, not assessment evidence, not progress, not a scoring input, not
-- certificate evidence, not an integrity signal and not educational telemetry.
-- The separation is structural rather than promised:
--
--   * `person_tour_state` carries NO institution_id, NO session_id, NO score,
--     mastery, result, response or evidence column, and no foreign key into any
--     evidence table. There is nothing on the row for an aggregate to read;
--   * it is registered in NEITHER `record_class_registry` (so `transfers_guard`
--     can never carry it across an institutional boundary -- an unregistered
--     class is refused by name) NOR `metric_sources` (so `assert_metric_closure`
--     would fail if a calculator reached for it);
--   * no audit row is written. INV-18 lists the acts that must be accountable,
--     and "was shown a tour" is not one of them; writing it into `audit_log`
--     would put a person's UI history into the accountability trail;
--   * `assert_tour_state_is_not_evidence()` re-derives all of that against the
--     live schema, and is executed by F06-P08 with the other assertions.
--
-- THE SMALLEST THING THAT ANSWERS THE QUESTION. The narrow requirement is:
-- should THIS declared tour/version still be presented automatically to THIS
-- person? That needs two tables and four functions, and deliberately not a
-- generic preference platform: there is no key/value store here, no settings
-- namespace and no UI-state bag. A second kind of durable UI state would get
-- its own shaped table, exactly as this one is shaped.
--
-- THE VERSION IS DECLARED, NEVER DERIVED. `tour_registry` is a contract table
-- in the manner of `mode_policy` and `client_rpc_registry`: a row is the act of
-- declaring that a tour exists at a version. Nothing computes a version from a
-- deployment, a commit, a changed-file count, a translation or a copy edit --
-- there is nowhere for such a value to enter. A materially new tour is a new
-- registry row in a new migration, which is a reviewable, forward-only act. The
-- registry is writable by no client role at all; the FK from the state table
-- also makes a declared version undeletable once anyone has met it.
--
-- NO ROLE INHERITANCE, BECAUSE THERE IS NOWHERE TO PUT IT. `tour_key` is an
-- opaque identifier owned by Experience. This schema does not know which role a
-- tour is for, cannot map a role to a tour, and therefore cannot decide that a
-- DEAN inherits the educator tour. Eligibility -- which tour applies to whom --
-- stays with Experience; this contract answers only the presentation question
-- for a tour it is handed by name.
--
-- FIRST LOGIN IS NOT INFERRED. Nothing here reads `accounts.created_at` and no
-- last-login tracking is introduced. "Never automatically presented yet" is the
-- absence of a state row, which is a fact this table owns rather than a fact
-- guessed from an unrelated timestamp.
--
-- MONOTONIC BY CONSTRUCTION, WHICH IS WHAT MAKES REPLAY SAFE. A count only
-- rises; `completed_at` and `suppressed_at` only go from null to a value; and
-- there is no DELETE. Deliberate replay from Help therefore CANNOT restore
-- automatic presentation, because no path exists that lowers a count or clears
-- a closing timestamp -- not "the frontend does not call it", but "the verb
-- does not exist and the trigger refuses the write".
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 1. The declared tours.
-- ---------------------------------------------------------------------------
create table public.tour_registry (
  tour_key     text    not null,
  tour_version integer not null,
  -- The product ruling -- at most THREE automatic presentations -- is a CHECK,
  -- not a constant in a function body. Declared per tour so a calmer tour can
  -- ask for fewer; bounded at three so no tour can ever ask for more.
  auto_presentation_limit smallint not null default 3,
  note         text    not null,
  declared_at  timestamptz not null default now(),
  primary key (tour_key, tour_version),
  constraint tour_registry_key_shape
    check (tour_key ~ '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$'),
  constraint tour_registry_version_positive check (tour_version > 0),
  constraint tour_registry_limit_is_the_product_rule
    check (auto_presentation_limit between 1 and 3),
  constraint tour_registry_note_present check (btrim(note) <> '')
);
alter table public.tour_registry enable row level security;
-- Readable by any authenticated person: knowing that a tour exists discloses
-- nothing about anybody. Writable by no client role -- there is no insert,
-- update or delete policy, so RLS refuses all three whatever the grants say,
-- and the grants below name only SELECT.
create policy tour_registry_select on public.tour_registry
  for select to authenticated using (public.current_person_id() is not null);
grant select on public.tour_registry to authenticated;

insert into public.tour_registry (tour_key, tour_version, note) values
  ('learner.first_login', 1,
   'the learner first-login tour. Experience owns what it says; this row is what makes version 1 a thing a person can have been shown.'),
  ('educator.first_login', 1,
   'the educator first-login tour. A separate identity from the learner tour: a person who holds both surfaces meets both, and neither is inherited from the other.');
-- Deliberately ABSENT: head-of-department, dean, institution-admin and
-- system-admin tours. Those Experience surfaces do not exist yet, and a
-- registry row for a tour nobody can be shown would be a claim, not a contract.

-- ---------------------------------------------------------------------------
-- 2. What a person has met.
-- ---------------------------------------------------------------------------
create table public.person_tour_state (
  person_id        uuid     not null references public.persons(id),
  tour_key         text     not null,
  tour_version     integer  not null,
  auto_shown_count smallint not null default 0,
  first_shown_at   timestamptz,
  last_shown_at    timestamptz,
  completed_at     timestamptz,
  suppressed_at    timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  primary key (person_id, tour_key, tour_version),
  -- A state row can only ever name a tour Experience declared.
  foreign key (tour_key, tour_version)
    references public.tour_registry (tour_key, tour_version),
  constraint person_tour_state_count_not_negative check (auto_shown_count >= 0),
  -- The count and the stamps describe the same events, so they agree or the
  -- row is refused; a count with no first showing is a number nobody can date.
  constraint person_tour_state_count_matches_stamps
    check ((auto_shown_count = 0) = (first_shown_at is null)),
  constraint person_tour_state_stamps_pair
    check ((first_shown_at is null) = (last_shown_at is null)),
  constraint person_tour_state_last_not_before_first
    check (last_shown_at is null or last_shown_at >= first_shown_at)
);
alter table public.person_tour_state enable row level security;

-- The only policy on this table. A person reads their own row and there is no
-- second predicate to get wrong; no client role holds INSERT, UPDATE or DELETE,
-- and no policy exists for those commands, so every write arrives through the
-- definer functions below.
create policy person_tour_state_select_own on public.person_tour_state
  for select to authenticated using (person_id = public.current_person_id());
grant select on public.person_tour_state to authenticated;

create index person_tour_state_by_person on public.person_tour_state (person_id);

-- ---------------------------------------------------------------------------
-- 3. The authority, which is a trigger because it must survive the owner.
--
-- Every public table in this schema runs with RLS enabled and FORCE off, so a
-- policy does not bind the schema owner -- and the definer functions below run
-- as the owner. Anything that must hold against them is a trigger.
-- ---------------------------------------------------------------------------
create function public.enforce_tour_state_write()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $function$
declare v_person uuid; v_limit smallint;
begin
  if tg_op = 'DELETE' then
    -- Deleting a row restores automatic presentation, which is the one thing
    -- completion and suppression exist to prevent. There is no reset verb.
    raise exception 'tour state is never deleted; it is what stops a tour being shown again';
  end if;

  if tg_op = 'INSERT' then
    v_person := public.current_person_id();
    if v_person is null then
      raise exception 'tour state belongs to a person and there is no authenticated person here';
    end if;
    -- DERIVED, NEVER TRUSTED. A caller may name any person_id it likes; the
    -- row is written for the person holding the session. This is the same rule
    -- role_assignments_guard applies to granted_by (INV-08).
    new.person_id := v_person;
    if new.auto_shown_count <> 0 or new.first_shown_at is not null
       or new.last_shown_at is not null or new.completed_at is not null
       or new.suppressed_at is not null then
      raise exception 'a tour state row is created unshown, uncompleted and unsuppressed; it reaches every other state by being updated';
    end if;
    new.created_at := now();
    new.updated_at := now();
    return new;
  end if;

  -- UPDATE.
  if new.person_id <> old.person_id or new.tour_key <> old.tour_key
     or new.tour_version <> old.tour_version or new.created_at <> old.created_at then
    raise exception 'tour state identity is immutable; a different person, tour or version is a different row';
  end if;

  -- MONOTONIC. The three properties that make deliberate replay safe.
  if new.auto_shown_count < old.auto_shown_count then
    raise exception 'automatic presentations are counted, never uncounted (% -> %)',
      old.auto_shown_count, new.auto_shown_count;
  end if;
  if old.completed_at is not null and new.completed_at is distinct from old.completed_at then
    raise exception 'a completed tour stays completed; replaying it does not un-complete it';
  end if;
  if old.suppressed_at is not null and new.suppressed_at is distinct from old.suppressed_at then
    raise exception 'a suppressed tour stays suppressed; replaying it does not restore automatic presentation';
  end if;

  -- The product ruling, enforced where the owner also meets it.
  select r.auto_presentation_limit into v_limit from public.tour_registry r
   where r.tour_key = new.tour_key and r.tour_version = new.tour_version;
  if new.auto_shown_count > v_limit then
    raise exception 'tour %/% may be presented automatically % time(s); this would be %',
      new.tour_key, new.tour_version, v_limit, new.auto_shown_count;
  end if;

  new.updated_at := now();
  return new;
end $function$;
revoke all on function public.enforce_tour_state_write() from public, anon, authenticated;

create trigger person_tour_state_write
  before insert or update or delete on public.person_tour_state
  for each row execute function public.enforce_tour_state_write();

-- ---------------------------------------------------------------------------
-- 4. The contract. Four functions, none of which takes an identity argument.
-- ---------------------------------------------------------------------------

-- The current declared version of a tour is the greatest one in the registry.
-- Declaring a higher version is therefore the single act that makes a tour new
-- again, and it happens in a migration.
--
-- INTERNAL. Not granted to any client role and carries no registry row: it
-- answers half a question, and `assert_learner_rpcs_are_guarded` refused it as
-- a LEARNER endpoint for exactly the right reason -- it reaches no ownership
-- check because it has no person to check. The version a client needs always
-- arrives from `my_tour_state`, next to the state it governs, so there is
-- nothing here for a client to ask separately and get half an answer from.
create function public.current_tour_version(p_tour_key text)
returns integer language sql stable security definer
set search_path = public, pg_temp as $function$
  select max(r.tour_version) from public.tour_registry r where r.tour_key = p_tour_key
$function$;
revoke all on function public.current_tour_version(text) from public, anon, authenticated;

-- THE WHOLE QUESTION, ANSWERED IN ONE READ. Returns a row for a declared tour
-- whether or not this person has ever met it: the absence of a state row is
-- "never automatically presented", which is what first login actually means
-- here. An undeclared tour returns nothing.
create function public.my_tour_state(p_tour_key text)
returns table (tour_key text,
               tour_version integer,
               should_auto_present boolean,
               auto_shown_count smallint,
               auto_presentation_limit smallint,
               completed boolean,
               suppressed boolean,
               last_shown_at timestamptz)
language sql stable security definer set search_path = public, pg_temp as $function$
  select r.tour_key,
         r.tour_version,
         (public.current_person_id() is not null
          and s.completed_at is null
          and s.suppressed_at is null
          and coalesce(s.auto_shown_count, 0::smallint) < r.auto_presentation_limit),
         coalesce(s.auto_shown_count, 0::smallint),
         r.auto_presentation_limit,
         s.completed_at is not null,
         s.suppressed_at is not null,
         s.last_shown_at
    from public.tour_registry r
    left join public.person_tour_state s
           on s.tour_key = r.tour_key
          and s.tour_version = r.tour_version
          and s.person_id = public.current_person_id()
   where r.tour_key = p_tour_key
     and r.tour_version = public.current_tour_version(p_tour_key)
     and public.current_person_id() is not null
$function$;
revoke all on function public.my_tour_state(text) from public, anon;
grant execute on function public.my_tour_state(text) to authenticated, service_role;

-- Records ONE automatic presentation. It is a no-op -- not an error -- once the
-- tour is completed, suppressed or at its limit, so a deliberate replay that
-- calls it by mistake cannot spend a presentation that was already spent, and
-- cannot raise the count past the ruling.
create function public.note_tour_presented(p_tour_key text)
returns smallint language plpgsql security definer
set search_path = public, pg_temp as $function$
declare v_person uuid; v_version integer; v_limit smallint; v_count smallint;
        v_completed timestamptz; v_suppressed timestamptz;
begin
  v_person := public.current_person_id();
  if v_person is null then
    raise exception 'a tour is presented to a person and there is no authenticated person here';
  end if;
  select r.tour_version, r.auto_presentation_limit into v_version, v_limit
    from public.tour_registry r
   where r.tour_key = p_tour_key
     and r.tour_version = public.current_tour_version(p_tour_key);
  if v_version is null then raise exception 'no such tour: %', p_tour_key; end if;

  insert into public.person_tour_state (person_id, tour_key, tour_version)
  values (v_person, p_tour_key, v_version)
  on conflict (person_id, tour_key, tour_version) do nothing;

  select s.auto_shown_count, s.completed_at, s.suppressed_at
    into v_count, v_completed, v_suppressed
    from public.person_tour_state s
   where s.person_id = v_person and s.tour_key = p_tour_key and s.tour_version = v_version
     for update;

  if v_completed is not null or v_suppressed is not null or v_count >= v_limit then
    return v_count;
  end if;

  update public.person_tour_state s
     set auto_shown_count = s.auto_shown_count + 1,
         first_shown_at = coalesce(s.first_shown_at, now()),
         last_shown_at = now()
   where s.person_id = v_person and s.tour_key = p_tour_key and s.tour_version = v_version
  returning s.auto_shown_count into v_count;
  return v_count;
end $function$;
revoke all on function public.note_tour_presented(text) from public, anon;
grant execute on function public.note_tour_presented(text) to authenticated, service_role;

-- The person reached the end. Idempotent, and it keeps the first completion's
-- instant rather than the most recent one.
create function public.complete_tour(p_tour_key text)
returns timestamptz language plpgsql security definer
set search_path = public, pg_temp as $function$
declare v_person uuid; v_version integer; v_at timestamptz;
begin
  v_person := public.current_person_id();
  if v_person is null then
    raise exception 'a tour is completed by a person and there is no authenticated person here';
  end if;
  v_version := public.current_tour_version(p_tour_key);
  if v_version is null then raise exception 'no such tour: %', p_tour_key; end if;
  insert into public.person_tour_state (person_id, tour_key, tour_version)
  values (v_person, p_tour_key, v_version)
  on conflict (person_id, tour_key, tour_version) do nothing;
  update public.person_tour_state s
     set completed_at = coalesce(s.completed_at, now())
   where s.person_id = v_person and s.tour_key = p_tour_key and s.tour_version = v_version
  returning s.completed_at into v_at;
  return v_at;
end $function$;
revoke all on function public.complete_tour(text) from public, anon;
grant execute on function public.complete_tour(text) to authenticated, service_role;

-- "Don't show this tour again." A preference, recorded separately from
-- completion because skipping something for good is not the same as finishing
-- it, and a report that conflated them would be wrong about the person.
create function public.suppress_tour(p_tour_key text)
returns timestamptz language plpgsql security definer
set search_path = public, pg_temp as $function$
declare v_person uuid; v_version integer; v_at timestamptz;
begin
  v_person := public.current_person_id();
  if v_person is null then
    raise exception 'a tour is dismissed by a person and there is no authenticated person here';
  end if;
  v_version := public.current_tour_version(p_tour_key);
  if v_version is null then raise exception 'no such tour: %', p_tour_key; end if;
  insert into public.person_tour_state (person_id, tour_key, tour_version)
  values (v_person, p_tour_key, v_version)
  on conflict (person_id, tour_key, tour_version) do nothing;
  update public.person_tour_state s
     set suppressed_at = coalesce(s.suppressed_at, now())
   where s.person_id = v_person and s.tour_key = p_tour_key and s.tour_version = v_version
  returning s.suppressed_at into v_at;
  return v_at;
end $function$;
revoke all on function public.suppress_tour(text) from public, anon;
grant execute on function public.suppress_tour(text) to authenticated, service_role;

-- Deliberately ABSENT: reset_tour, replay_tour, clear_tour_state and any verb
-- that lowers a count or clears a closing stamp. Deliberate replay is a
-- frontend act over a tour the person already has; it needs nothing from here,
-- and giving it something to call is how suppression gets undone by accident.

insert into public.client_rpc_registry (function_name, exposure, note) values
  ('my_tour_state', 'LEARNER',
   'whether this declared tour should still be presented automatically to the caller, and the counts behind that answer. Never takes a person; the person is the session.'),
  ('note_tour_presented', 'LEARNER',
   'records one AUTOMATIC presentation of a tour to the caller. A no-op once the tour is completed, suppressed or at its declared limit.'),
  ('complete_tour', 'LEARNER',
   'the caller reached the end of a tour. Idempotent, and it never un-completes.'),
  ('suppress_tour', 'LEARNER',
   'the caller asked not to be shown a tour automatically again. Idempotent, and it never un-suppresses.');

-- ---------------------------------------------------------------------------
-- 5. The separation, re-derived against the live schema rather than promised.
-- ---------------------------------------------------------------------------
create function public.assert_tour_state_is_not_evidence()
returns table (ok boolean, detail text)
language plpgsql stable security definer set search_path = public, pg_temp as $function$
declare
  bad text; problems text[] := '{}'; n int;
  -- Everything that turns evidence into a number, a verdict or a credential.
  v_consumers text[];
begin
  select array(
    select p.proname from pg_proc p
     where p.pronamespace = 'public'::regnamespace
       and (p.proname = any (array[
              'grade_response','evaluate_session','finalize_session','session_final_responses',
              'session_outcome','session_review','reading_map','learning_delta','assemble_session',
              'recompute_result','metric_evaluate','generate_report','certificate_eligibility',
              'certificate_prepare','verify_certificate','derive_evidence_class',
              'effective_evidence_class','recompute_question_health','record_integrity_signal'])
         or p.proname like 'calc\_%'))
    into v_consumers;

  select string_agg(p.proname, ', ') into bad
    from pg_proc p
   where p.pronamespace = 'public'::regnamespace and p.proname = any (v_consumers)
     and regexp_replace(coalesce(p.prosrc,''), '--[^\n]*', '', 'g')
         ~* '\y(person_tour_state|tour_registry)\y';
  if bad is not null then
    problems := problems || ('evidence consumer(s) reading tour state: ' || bad);
  end if;

  select string_agg(distinct dep.relname, ', ') into bad
    from pg_depend d
    join pg_rewrite rw on rw.oid = d.objid
    join pg_class dep on dep.oid = rw.ev_class
    join pg_class ref on ref.oid = d.refobjid
   where ref.relname in ('person_tour_state','tour_registry')
     and dep.relname not in ('person_tour_state','tour_registry')
     and dep.relnamespace::regnamespace::text = 'public';
  if bad is not null then problems := problems || ('view(s) depending on tour state: ' || bad); end if;

  -- No column an aggregate could mistake for evidence, and no tenant column
  -- that would make it institution-scoped data about a person.
  select string_agg(table_name || '.' || column_name, ', ') into bad
    from information_schema.columns
   where table_schema = 'public'
     and table_name in ('person_tour_state','tour_registry')
     and column_name ~* '(session|evidence|mastery|score|result|response|grade|integrity|certificate|institution|enrollment)';
  if bad is not null then problems := problems || ('tour state carries an evidence-shaped column: ' || bad); end if;

  -- No foreign key out of tour state except to persons and to the registry.
  select string_agg(cl.relname, ', ') into bad
    from pg_constraint c
    join pg_class src on src.oid = c.conrelid
    join pg_class cl on cl.oid = c.confrelid
   where c.contype = 'f' and src.relname = 'person_tour_state'
     and cl.relname not in ('persons','tour_registry');
  if bad is not null then problems := problems || ('person_tour_state references: ' || bad); end if;

  -- Unregistered as a record class, so transfers_guard refuses it by name; and
  -- unregistered as a metric source, so assert_metric_closure would refuse a
  -- calculator that reached for it.
  select count(*) into n from public.record_class_registry
   where table_name in ('person_tour_state','tour_registry');
  if n <> 0 then problems := problems || 'tour state is a declared record class and could cross a transfer'; end if;
  select count(*) into n from public.metric_sources
   where source_relation in ('person_tour_state','tour_registry');
  if n <> 0 then problems := problems || 'tour state is a declared metric source'; end if;

  -- And no client role may write it directly, whatever the policies say.
  select string_agg(grantee || ':' || privilege_type, ', ') into bad
    from information_schema.role_table_grants
   where table_schema = 'public' and table_name in ('person_tour_state','tour_registry')
     and grantee in ('anon','authenticated') and privilege_type <> 'SELECT';
  if bad is not null then problems := problems || ('a client role holds a write grant on tour state: ' || bad); end if;

  ok := array_length(problems, 1) is null;
  detail := case when ok then
    format('tour state is presentation state: %s evidence consumer(s) read neither table, no view depends on either, '
        || 'neither carries a session, evidence, score or tenant column, person_tour_state references only persons and '
        || 'the registry, neither is a declared record class or metric source, and no client role holds more than SELECT',
        cardinality(v_consumers))
    else array_to_string(problems, '; ') end;
  return next;
end $function$;
revoke all on function public.assert_tour_state_is_not_evidence() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Terminal verification (ADR-0014). Two people are built here and rolled back;
-- nothing below assumes a seeded persona.
--
-- The claim is not "a row was written". It is: the state follows the PERSON
-- across independent sessions; one person's state is invisible and immovable to
-- another even when that other names their id; three automatic presentations is
-- three; completion and suppression each stop automatic presentation for good;
-- and no path exists that gives a presentation back.
-- ---------------------------------------------------------------------------
do $$
declare
  v_uid_a uuid; v_uid_b uuid; v_p_a uuid; v_p_b uuid;
  n int; v_should boolean; v_count smallint; v_limit smallint;
  v_completed boolean; v_suppressed boolean; v_at timestamptz; v_at2 timestamptz;
  bad_detail text;
begin
  begin
    insert into auth.users (id, email) values (gen_random_uuid(), 'probe-0089-a@local.invalid')
    returning users.id into v_uid_a;
    insert into auth.users (id, email) values (gen_random_uuid(), 'probe-0089-b@local.invalid')
    returning users.id into v_uid_b;
    select a.person_id into v_p_a from public.accounts a where a.auth_user_id = v_uid_a;
    select a.person_id into v_p_b from public.accounts a where a.auth_user_id = v_uid_b;
    if v_p_a is null or v_p_b is null or v_p_a = v_p_b then
      raise exception 'the probe did not obtain two distinct persons';
    end if;

    -- ------------------------------------------------- FIRST LOGIN IS THE --
    -- ------------------------------------------------- ABSENCE OF A ROW ---
    perform set_config('request.jwt.claims',
      json_build_object('sub', v_uid_a, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', v_uid_a::text, true);
    execute 'set local role authenticated';

    select t.should_auto_present, t.auto_shown_count, t.auto_presentation_limit,
           t.completed, t.suppressed
      into v_should, v_count, v_limit, v_completed, v_suppressed
      from public.my_tour_state('learner.first_login') t;
    if v_should is null then
      raise exception 'a person who has never met the tour got no answer at all';
    end if;
    if not v_should or v_count <> 0 or v_completed or v_suppressed then
      raise exception 'a person who has never met the tour was not offered it (should=%, count=%)', v_should, v_count;
    end if;
    if v_limit <> 3 then
      raise exception 'the declared automatic-presentation limit is %, not the ruled 3', v_limit;
    end if;
    -- and no row was created by merely asking
    execute 'reset role';
    select count(*) into n from public.person_tour_state where person_id = v_p_a;
    if n <> 0 then raise exception 'reading the tour state created a row'; end if;

    -- ------------------------------------------------ THREE, THEN NO MORE --
    perform set_config('request.jwt.claim.sub', v_uid_a::text, true);
    execute 'set local role authenticated';
    v_count := public.note_tour_presented('learner.first_login');
    if v_count <> 1 then raise exception 'the first presentation counted as %', v_count; end if;
    -- skipping is not a call: the next automatic presentation simply happens
    select t.should_auto_present into v_should from public.my_tour_state('learner.first_login') t;
    if not v_should then raise exception 'a skipped tour stopped being offered after one showing'; end if;
    v_count := public.note_tour_presented('learner.first_login');
    select t.should_auto_present into v_should from public.my_tour_state('learner.first_login') t;
    if not v_should then raise exception 'a skipped tour stopped being offered after two showings'; end if;
    v_count := public.note_tour_presented('learner.first_login');
    if v_count <> 3 then raise exception 'the third presentation counted as %', v_count; end if;
    select t.should_auto_present into v_should from public.my_tour_state('learner.first_login') t;
    if v_should then raise exception 'a fourth automatic presentation was offered; the ruling is three'; end if;
    -- a fourth call is a no-op, not an error, and does not move the count
    v_count := public.note_tour_presented('learner.first_login');
    if v_count <> 3 then raise exception 'a fourth call moved the count to %', v_count; end if;

    -- --------------------------------------------- DURABLE ACROSS SESSIONS --
    -- The session is thrown away entirely -- as a logout, a different browser
    -- or a different machine would -- and the same person signs in again.
    execute 'reset role';
    perform set_config('request.jwt.claims', '', true);
    perform set_config('request.jwt.claim.sub', '', true);
    perform set_config('request.jwt.claims',
      json_build_object('sub', v_uid_a, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', v_uid_a::text, true);
    execute 'set local role authenticated';
    select t.auto_shown_count, t.should_auto_present into v_count, v_should
      from public.my_tour_state('learner.first_login') t;
    if v_count <> 3 or v_should then
      raise exception 'the count did not survive a new session (count=%, should=%)', v_count, v_should;
    end if;

    -- ------------------------------------------- THE SHARED DEVICE, WHICH --
    -- ------------------------------------------- IS THE WHOLE REASON -----
    -- Same connection, same everything but the session: the next person sits
    -- down at the same machine and must meet their own state, not A's.
    execute 'reset role';
    perform set_config('request.jwt.claims',
      json_build_object('sub', v_uid_b, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', v_uid_b::text, true);
    execute 'set local role authenticated';
    select t.should_auto_present, t.auto_shown_count into v_should, v_count
      from public.my_tour_state('learner.first_login') t;
    if not v_should or v_count <> 0 then
      raise exception 'the second person at the same device inherited the first person''s tour state (should=%, count=%)',
        v_should, v_count;
    end if;
    select count(*) into n from public.person_tour_state;
    if n <> 0 then
      raise exception 'person B can see % tour state row(s) that are not theirs', n;
    end if;
    -- and B cannot write into A's row by naming A
    begin
      insert into public.person_tour_state (person_id, tour_key, tour_version)
      values (v_p_a, 'learner.first_login', 1);
      raise exception 'person B inserted tour state directly';
    exception when insufficient_privilege or others then
      if sqlerrm = 'person B inserted tour state directly' then raise; end if;
    end;
    execute 'reset role';

    -- Even as the OWNER -- which is what every definer function is -- naming
    -- another person does not write for them: the trigger derives.
    perform set_config('request.jwt.claim.sub', v_uid_b::text, true);
    insert into public.person_tour_state (person_id, tour_key, tour_version)
    values (v_p_a, 'educator.first_login', 1);
    select count(*) into n from public.person_tour_state
     where person_id = v_p_a and tour_key = 'educator.first_login';
    if n <> 0 then raise exception 'a row naming person A was written while person B held the session'; end if;
    select count(*) into n from public.person_tour_state
     where person_id = v_p_b and tour_key = 'educator.first_login';
    if n <> 1 then raise exception 'the derived person_id did not land on the session holder'; end if;

    -- ------------------------------------------ TOURS DO NOT COLLIDE ------
    select t.auto_shown_count into v_count from public.my_tour_state('educator.first_login') t;
    if v_count <> 0 then raise exception 'the educator tour inherited a count from the learner tour'; end if;

    -- ------------------------------------------ COMPLETION AND DISMISSAL --
    perform set_config('request.jwt.claim.sub', v_uid_b::text, true);
    v_at := public.complete_tour('educator.first_login');
    if v_at is null then raise exception 'completing the tour recorded no instant'; end if;
    execute 'set local role authenticated';
    select t.should_auto_present, t.completed into v_should, v_completed
      from public.my_tour_state('educator.first_login') t;
    if v_should or not v_completed then
      raise exception 'a completed tour is still offered automatically';
    end if;
    execute 'reset role';
    -- idempotent, and it keeps the first instant
    v_at2 := public.complete_tour('educator.first_login');
    if v_at2 <> v_at then raise exception 'completing twice moved the completion instant'; end if;
    -- presenting it again does not spend a presentation
    v_count := public.note_tour_presented('educator.first_login');
    if v_count <> 0 then raise exception 'a completed tour spent an automatic presentation'; end if;

    v_at := public.suppress_tour('learner.first_login');
    if v_at is null then raise exception 'dismissing the tour recorded no instant'; end if;
    execute 'set local role authenticated';
    select t.should_auto_present, t.suppressed into v_should, v_suppressed
      from public.my_tour_state('learner.first_login') t;
    if v_should or not v_suppressed then
      raise exception 'a dismissed tour is still offered automatically';
    end if;
    execute 'reset role';

    -- ------------------------------------------ REPLAY GIVES NOTHING BACK --
    -- There is no verb for it, so the attempt is made at the table, as the
    -- owner, which is the strongest form the attempt can take.
    begin
      update public.person_tour_state set completed_at = null
       where person_id = v_p_b and tour_key = 'educator.first_login';
      raise exception 'a completed tour was un-completed';
    exception when others then
      if sqlerrm = 'a completed tour was un-completed' then raise; end if;
    end;
    begin
      update public.person_tour_state set suppressed_at = null
       where person_id = v_p_b and tour_key = 'learner.first_login';
      raise exception 'a dismissed tour was un-dismissed';
    exception when others then
      if sqlerrm = 'a dismissed tour was un-dismissed' then raise; end if;
    end;
    begin
      update public.person_tour_state set auto_shown_count = 0
       where person_id = v_p_a and tour_key = 'learner.first_login';
      raise exception 'an automatic presentation was uncounted';
    exception when others then
      if sqlerrm = 'an automatic presentation was uncounted' then raise; end if;
    end;
    begin
      delete from public.person_tour_state where person_id = v_p_b;
      raise exception 'tour state was deleted';
    exception when others then
      if sqlerrm = 'tour state was deleted' then raise; end if;
    end;
    -- and the ruling holds against the owner too
    begin
      update public.person_tour_state set auto_shown_count = 9
       where person_id = v_p_a and tour_key = 'learner.first_login';
      raise exception 'the owner raised the count past the declared limit';
    exception when others then
      if sqlerrm = 'the owner raised the count past the declared limit' then raise; end if;
    end;

    -- ------------------------------------------ AN UNDECLARED TOUR --------
    perform set_config('request.jwt.claim.sub', v_uid_a::text, true);
    select count(*) into n from public.my_tour_state('dean.first_login');
    if n <> 0 then raise exception 'an undeclared tour answered'; end if;
    begin
      perform public.note_tour_presented('dean.first_login');
      raise exception 'an undeclared tour was presented';
    exception when others then
      if sqlerrm = 'an undeclared tour was presented' then raise; end if;
    end;

    raise exception 'ROLLBACK_PROBE';
  exception when others then
    begin execute 'reset role'; exception when others then null; end;
    perform set_config('request.jwt.claims', '', true);
    perform set_config('request.jwt.claim.sub', '', true);
    if sqlerrm <> 'ROLLBACK_PROBE' then raise; end if;
  end;

  select count(*) into n from public.person_tour_state;
  if n <> 0 then raise exception 'the probe left % tour state row(s) behind', n; end if;
  select count(*) into n from auth.users where email like 'probe-0089-%@local.invalid';
  if n <> 0 then raise exception 'the probe left its users behind'; end if;

  -- ------------------------------------------------------- STRUCTURAL -----
  select a.ok into v_should from public.assert_tour_state_is_not_evidence() a;
  if not v_should then
    select a.detail into bad_detail from public.assert_tour_state_is_not_evidence() a;
    raise exception 'tour state is not separated from evidence: %', bad_detail;
  end if;

  -- The registry is writable by no client role, so a version cannot be
  -- declared from the application.
  select count(*) into n from information_schema.role_table_grants
   where table_schema = 'public' and table_name = 'tour_registry'
     and grantee in ('anon','authenticated') and privilege_type <> 'SELECT';
  if n <> 0 then raise exception 'a client role may declare a tour version'; end if;

  -- No reset verb exists.
  select count(*) into n from pg_proc
   where pronamespace = 'public'::regnamespace
     and proname ~ '^(reset|replay|clear|forget)_tour';
  if n <> 0 then raise exception 'a verb exists that could restore automatic presentation'; end if;

  -- Every new entry point derives the person rather than accepting one.
  select string_agg(p.proname, ', ') into bad_detail from pg_proc p
   where p.pronamespace = 'public'::regnamespace
     and p.proname in ('my_tour_state','note_tour_presented','complete_tour','suppress_tour')
     and pg_get_function_identity_arguments(p.oid) ~* '\yuuid\y';
  if bad_detail is not null then
    raise exception 'tour entry point(s) take an identity argument: %', bad_detail;
  end if;

  -- The internal helper stays internal: a client that could ask for a version
  -- on its own could act on one without the state that governs it.
  if has_function_privilege('authenticated', 'public.current_tour_version(text)', 'EXECUTE')
     or has_function_privilege('anon', 'public.current_tour_version(text)', 'EXECUTE') then
    raise exception 'current_tour_version is reachable by a client role';
  end if;
  select a.ok into v_should from public.assert_learner_rpcs_are_guarded() a;
  if not v_should then
    select a.detail into bad_detail from public.assert_learner_rpcs_are_guarded() a;
    raise exception 'a LEARNER entry point reaches no ownership check: %', bad_detail;
  end if;

  raise notice '0089 verified: the tour is remembered about the person, three times, and never given back';
end $$;
