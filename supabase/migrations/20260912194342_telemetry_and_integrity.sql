-- 0024 — FABLE-02 §7, slice C: telemetry and integrity signals.
--
-- PHYSICALLY SEPARATE, TAKEN LITERALLY. §7 says the telemetry tables are
-- physically separate and that no scoring view or function may reference them
-- (INV-11). Putting them in `public` with a naming convention would make that
-- rule reviewable but not checkable: the lint would need a list of which names
-- are telemetry, and such a list drifts the moment someone adds a table. They
-- go in their own schema instead, which turns INV-11 into one structural
-- question -- does any function or view in public depend on anything in
-- telemetry -- that a new table cannot escape by being named differently.
--
-- INTEGRITY SIGNALS ARE SEPARATE FROM SCORING, NOT FROM EVIDENCE. A signal is
-- an observation about how a session was conducted, and §7 is explicit that it
-- is never a verdict. So it stays in `public` beside the evidence it annotates,
-- and the rule enforced here is about its SHAPE: it records a category, a
-- moment and the raw observation, and it may not grow a column that renders a
-- judgement. The verification block refuses a signal table carrying anything
-- that looks like one.
--
-- HESITATION READS THE DEFINITION, NEVER A CONSTANT. §7 requires a hesitation
-- event to reference the definition's configured window. The window is
-- therefore recorded on the event from the session's own definition at write
-- time -- so a later change to the definition cannot retroactively re-interpret
-- an old observation -- and there is no default anywhere for it to fall back
-- on.

create schema telemetry;
revoke all on schema telemetry from public;
comment on schema telemetry is
  'Physically separate from scoring (INV-11). No view or function in public may '
  'reference anything in here; 0024''s verification block asserts it.';

create type public.integrity_category as enum
  ('VISIBILITY_CHANGE','NAVIGATION','RECONNECT','RAPID_OPTION_CHANGE','SUBMISSION_ANOMALY');

create type telemetry.assistance_kind as enum
  ('HINT_OPENED','WORKED_EXAMPLE_OPENED','GLOSSARY_OPENED','READ_ALOUD');

-- ---------------------------------------------------------------------------
-- Telemetry. Never read by scoring; never joined to a Result.
-- ---------------------------------------------------------------------------
create table telemetry.hesitation_events (
  id                 uuid primary key default gen_random_uuid(),
  session_id         uuid not null references public.assessment_sessions(id),
  presented_item_id  uuid not null references public.presented_items(id),
  institution_id     uuid not null references public.institutions(id),
  -- the definition's configured window, copied at write time. No default: an
  -- event whose definition configured no window is not a hesitation event.
  window_seconds     integer not null check (window_seconds between 1 and 3600),
  dwell_seconds      numeric(8,3) not null check (dwell_seconds >= 0),
  observed_at        timestamptz not null default now()
);
create index hesitation_events_session_idx on telemetry.hesitation_events (session_id);
alter table telemetry.hesitation_events enable row level security;

create table telemetry.assistance_events (
  id                 uuid primary key default gen_random_uuid(),
  session_id         uuid not null references public.assessment_sessions(id),
  presented_item_id  uuid references public.presented_items(id),
  institution_id     uuid not null references public.institutions(id),
  kind               telemetry.assistance_kind not null,
  observed_at        timestamptz not null default now()
);
create index assistance_events_session_idx on telemetry.assistance_events (session_id);
alter table telemetry.assistance_events enable row level security;

-- ---------------------------------------------------------------------------
-- Integrity signals: observations, never verdicts.
-- ---------------------------------------------------------------------------
create table public.integrity_signals (
  id             uuid primary key default gen_random_uuid(),
  session_id     uuid not null references public.assessment_sessions(id),
  institution_id uuid not null references public.institutions(id),
  category       public.integrity_category not null,
  observed_at    timestamptz not null default now(),
  observation    jsonb not null default '{}'::jsonb,
  constraint integrity_signals_observation_is_object
    check (jsonb_typeof(observation) = 'object')
);
create index integrity_signals_session_idx on public.integrity_signals (session_id, observed_at);
alter table public.integrity_signals enable row level security;

-- ---------------------------------------------------------------------------
-- All three are append-only and tenant-derived from the session, the same way
-- responses are derived from the delivery record.
-- ---------------------------------------------------------------------------
create function public.enforce_observation_write() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_inst uuid; v_session uuid; v_window integer;
begin
  if tg_op <> 'INSERT' then
    raise exception 'an observation is append-only: %.% is never rewritten',
      tg_table_schema, tg_table_name;
  end if;
  select s.institution_id into v_inst
    from public.assessment_sessions s where s.id = new.session_id;
  if v_inst is null then raise exception 'unknown session %', new.session_id; end if;
  new.institution_id := v_inst;

  -- a delivery record named alongside a session must belong to that session
  if to_jsonb(new) ? 'presented_item_id' and (to_jsonb(new) ->> 'presented_item_id') is not null then
    select p.session_id into v_session from public.presented_items p
     where p.id = (to_jsonb(new) ->> 'presented_item_id')::uuid;
    if v_session is distinct from new.session_id then
      raise exception 'the presented item belongs to a different session';
    end if;
  end if;

  -- hesitation carries the definition's configured window, read from the
  -- session's own definition -- never a constant, never the caller's number
  if tg_table_schema = 'telemetry' and tg_table_name = 'hesitation_events' then
    select d.hesitation_window_seconds into v_window
      from public.assessment_sessions s
      join public.assessment_definitions d on d.id = s.assessment_definition_id
     where s.id = new.session_id;
    if v_window is null then
      raise exception 'the assessment definition configures no hesitation window; there is no such event to record';
    end if;
    new.window_seconds := v_window;
  end if;
  return new;
end $$;
revoke all on function public.enforce_observation_write() from public, anon, authenticated;

create trigger hesitation_events_write before insert or update or delete on telemetry.hesitation_events
  for each row execute function public.enforce_observation_write();
create trigger assistance_events_write before insert or update or delete on telemetry.assistance_events
  for each row execute function public.enforce_observation_write();
create trigger integrity_signals_write before insert or update or delete on public.integrity_signals
  for each row execute function public.enforce_observation_write();

-- ---------------------------------------------------------------------------
-- Reads. Telemetry is not client-readable at all: it is behavioural exhaust,
-- not part of what a learner or a teacher is owed, and Phase 6 reads it with
-- the service role. Integrity signals are visible to the integrity reviewer
-- only -- not to the learner, because a signal is not an accusation and not to
-- the learner's teacher, because reviewing conduct is its own capability.
-- ---------------------------------------------------------------------------
grant select on public.integrity_signals to authenticated;
create policy integrity_signals_select on public.integrity_signals for select to authenticated
  using (public.can_in_institution('CAN_REVIEW_INTEGRITY', institution_id));

create trigger integrity_signals_tenant_immutable before update on public.integrity_signals
  for each row execute function public.enforce_record_tenant_immutable();

insert into public.record_class_registry values
  ('integrity_signals', 'INSTITUTION_SCOPED', 'conduct observations never travel with a learner');

-- ---------------------------------------------------------------------------
-- Verification block (ADR-0003): structural and pure-function only.
-- ---------------------------------------------------------------------------
do $$
declare n int; bad text; def text;
begin
  -- INV-11, the whole point of the separate schema: nothing in public may
  -- depend on anything in telemetry. Checked through pg_depend for views and
  -- through the function bodies for everything else, so neither a view nor a
  -- scoring function can reach across.
  select string_agg(distinct dependent.relname, ', ') into bad
    from pg_depend d
    join pg_rewrite rw on rw.oid = d.objid
    join pg_class dependent on dependent.oid = rw.ev_class
    join pg_class referenced on referenced.oid = d.refobjid
    join pg_namespace rns on rns.oid = referenced.relnamespace
    join pg_namespace dns on dns.oid = dependent.relnamespace
   where rns.nspname = 'telemetry' and dns.nspname = 'public';
  if bad is not null then
    raise exception 'view(s) in public reference telemetry (INV-11): %', bad;
  end if;

  select string_agg(p.proname, ', ') into bad from pg_proc p
    join pg_namespace ns on ns.oid = p.pronamespace
   where ns.nspname = 'public'
     and p.prokind = 'f'
     and pg_get_functiondef(p.oid) ~* '\ytelemetry\.'
     -- the write trigger names the schema to decide which table it is on; it
     -- is not a scoring path and is the single documented exception
     and p.proname <> 'enforce_observation_write';
  if bad is not null then
    raise exception 'function(s) in public reference telemetry (INV-11): %', bad;
  end if;

  -- no client role reaches telemetry at all
  select string_agg(g.table_name || '->' || g.grantee, ', ') into bad
    from information_schema.role_table_grants g
   where g.table_schema = 'telemetry' and g.grantee in ('anon','authenticated');
  if bad is not null then raise exception 'a client role can read telemetry: %', bad; end if;
  if has_schema_privilege('anon','telemetry','USAGE')
     or has_schema_privilege('authenticated','telemetry','USAGE') then
    raise exception 'a client role holds USAGE on the telemetry schema';
  end if;

  -- an integrity signal is an observation, never a verdict
  select string_agg(column_name, ', ') into bad from information_schema.columns
   where table_schema = 'public' and table_name = 'integrity_signals'
     and (column_name ~* '(verdict|cheat|guilt|suspicio|score|penalt|violation|flagged|confirmed)');
  if bad is not null then
    raise exception 'integrity_signals carries a verdict-shaped column: %', bad;
  end if;

  -- hesitation reads the definition, and cannot fall back on a constant
  select column_default into bad from information_schema.columns
   where table_schema='telemetry' and table_name='hesitation_events' and column_name='window_seconds';
  if bad is not null then
    raise exception 'the hesitation window has a default (%); it must come from the definition', bad;
  end if;
  select pg_get_functiondef(p.oid) into def from pg_proc p
    join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and p.proname='enforce_observation_write';
  if def not like '%d.hesitation_window_seconds%' then
    raise exception 'the hesitation window is not read from the assessment definition';
  end if;

  -- append-only everywhere
  select count(*) into n from pg_tables where not rowsecurity
   and ((schemaname='telemetry' and tablename in ('hesitation_events','assistance_events'))
     or (schemaname='public' and tablename='integrity_signals'));
  if n > 0 then raise exception 'RLS not enabled on % observation table(s)', n; end if;
  select string_agg(t, ', ') into bad from unnest(array['hesitation_events','assistance_events',
    'integrity_signals']) t
   where not exists (select 1 from pg_trigger g join pg_class c on c.oid=g.tgrelid
                      where c.relname = t and g.tgname = t || '_write' and not g.tgisinternal);
  if bad is not null then raise exception 'append-only trigger missing on: %', bad; end if;

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
