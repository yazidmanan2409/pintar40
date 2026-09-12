-- 0023 — FABLE-02 §7, slice B: Response (INV-28) and Result (INV-29).
--
-- IDEMPOTENCY IS ANCHORED, NOT CORRELATED. §7 names the key as
-- (session_id, presented_item_id, client_seq). Taken literally that is two
-- independently-valid identifiers a caller could combine into a record
-- belonging to neither -- the shape that produced the tenant hop, and the
-- shape evidence_class was rebuilt to avoid. presented_items already carries
-- session_id and is immutable, so it IS the authoritative anchor: a response
-- references presented_item_id and DERIVES session, institution and person
-- from it. client_seq stays caller-supplied because it must be -- it is the
-- client's own ordering -- but it is only ever meaningful inside a delivery
-- record the server created. There is no pair to mismatch.
--
-- THREE DIFFERENT EVENTS, KEPT DIFFERENT. "Idempotent" must not quietly mean
-- "last write wins":
--   * same (presented_item_id, client_seq), same payload -> the existing
--     response is acknowledged. One row, no duplicate.
--   * same key, DIFFERENT payload -> refused. Two different answers cannot
--     share one receipt, and silently overwriting the first would be data
--     loss wearing the word idempotency.
--   * a new client_seq -> a new row. A learner changing their answer is
--     append-only evidence (INV-28), not a replay at all.
--
-- THE UNIQUE INDEX IS THE ARBITER, NOT A PRECEDING SELECT. Two requests with
-- the same key can arrive together; a SELECT-then-INSERT would let both
-- observe "nothing there". submit_response() inserts first with ON CONFLICT
-- DO NOTHING and only then, if it lost, reads the committed row and compares
-- digests. Postgres blocks the losing inserter until the winner commits, so
-- the row it reads is the real one.
--
-- WHAT "THE SAME PAYLOAD" MEANS. The digest covers the pedagogical response
-- value and nothing else. received_at, client_asserted_at and receipt_mode are
-- transport facts: a replay that took a different route, or arrived a second
-- later, is still the same answer and must still be acknowledged. It reuses
-- content_digest() from 0017 rather than inventing a second canonicalisation.
--
-- RESULT LINEAGE IS A LINE, BY CONSTRUCTION. A result row never changes. A
-- recomputation inserts a new row carrying its OWN engine and scoring policy
-- versions and pointing at the row it replaces. Three constraints make the
-- history unambiguous: at most one root per session, at most one successor per
-- predecessor, and supersession only within one session. Because rows are
-- insert-only and the predecessor must already exist, every edge points
-- backwards in time, so a cycle would need an UPDATE that immutability
-- refuses. (At most one root, not exactly one: a session with no computed
-- result yet is perfectly legal.)

create type public.receipt_mode as enum ('LIVE','REPLAYED','LATE_SYNC');

create table public.responses (
  id                 uuid primary key default gen_random_uuid(),
  presented_item_id  uuid not null references public.presented_items(id),
  -- derived from the delivery record, never accepted alongside it
  session_id         uuid not null references public.assessment_sessions(id),
  institution_id     uuid not null references public.institutions(id),
  client_seq         integer not null check (client_seq > 0),
  value              jsonb not null,
  value_digest       text not null check (value_digest ~ '^[0-9a-f]{64}$'),
  received_at        timestamptz not null default now(),
  client_asserted_at timestamptz,
  receipt_mode       public.receipt_mode not null default 'LIVE',
  is_final           boolean not null default false,
  constraint responses_idempotency_key unique (presented_item_id, client_seq)
);
create index responses_session_idx on public.responses (session_id, received_at);
alter table public.responses enable row level security;

create table public.assessment_results (
  id                     uuid primary key default gen_random_uuid(),
  session_id             uuid not null references public.assessment_sessions(id),
  -- derived from the session
  institution_id         uuid not null references public.institutions(id),
  person_id              uuid not null references public.persons(id),
  evidence_class         public.evidence_class not null,
  -- scoring provenance: every row in a lineage carries its own, so a
  -- recomputation records which engine produced it rather than inheriting
  engine_version         text not null check (btrim(engine_version) <> ''),
  scoring_policy_version text not null check (btrim(scoring_policy_version) <> ''),
  mastery                numeric(5,4) check (mastery is null or mastery between 0 and 1),
  per_domain             jsonb not null default '{}'::jsonb,
  safety_gate_passed     boolean,
  delta_inputs           jsonb not null default '{}'::jsonb,
  supersedes_result_id   uuid references public.assessment_results(id),
  recomputation_reason   text,
  computed_at            timestamptz not null default now(),
  constraint results_no_self_supersede check (supersedes_result_id is distinct from id),
  -- at most one successor per predecessor: the lineage cannot fork
  constraint results_one_successor unique (supersedes_result_id),
  -- a recomputation says why; an original has nothing to explain
  constraint results_reason_with_supersession
    check ((supersedes_result_id is null) = (recomputation_reason is null))
);
-- at most one root per session: the lineage has a single beginning. Partial,
-- so a session with no result yet is legal.
create unique index assessment_results_one_root_per_session
  on public.assessment_results (session_id) where supersedes_result_id is null;
create index assessment_results_session_idx on public.assessment_results (session_id, computed_at);
alter table public.assessment_results enable row level security;

-- ---------------------------------------------------------------------------
-- Response provenance: derived from the delivery record; the row never changes.
-- ---------------------------------------------------------------------------
create function public.enforce_response_write() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_session uuid; v_inst uuid; v_status public.session_status;
begin
  if tg_op <> 'INSERT' then
    raise exception 'a response is evidence: append a new client_seq, never rewrite one (INV-28)';
  end if;
  select p.session_id, p.institution_id into v_session, v_inst
    from public.presented_items p where p.id = new.presented_item_id;
  if v_session is null then
    raise exception 'unknown presented item %', new.presented_item_id;
  end if;
  new.session_id := v_session;
  new.institution_id := v_inst;

  select s.status into v_status from public.assessment_sessions s where s.id = v_session;
  if v_status in ('FINALIZED','TERMINATED') then
    raise exception 'the session is % and accepts no further responses', v_status;
  end if;

  -- the digest covers the answer and nothing about how it travelled
  new.value_digest := public.content_digest(new.value::text);
  return new;
end $$;
revoke all on function public.enforce_response_write() from public, anon, authenticated;

create trigger responses_write before insert or update or delete on public.responses
  for each row execute function public.enforce_response_write();

-- ---------------------------------------------------------------------------
-- The only write path for a response. Insert first; let the unique index
-- arbitrate; only then compare.
-- ---------------------------------------------------------------------------
create function public.submit_response(
  p_presented_item uuid,
  p_client_seq integer,
  p_value jsonb,
  p_client_asserted_at timestamptz default null,
  p_receipt_mode public.receipt_mode default 'LIVE',
  p_is_final boolean default false
) returns table (response_id uuid, outcome text)
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_id uuid; v_existing uuid; v_digest text; v_stored text;
begin
  v_digest := public.content_digest(p_value::text);

  insert into public.responses (presented_item_id, session_id, institution_id, client_seq,
                                value, value_digest, client_asserted_at, receipt_mode, is_final)
  values (p_presented_item,
          '00000000-0000-0000-0000-000000000000',   -- overwritten by the trigger
          '00000000-0000-0000-0000-000000000000',   -- overwritten by the trigger
          p_client_seq, p_value, v_digest, p_client_asserted_at, p_receipt_mode, p_is_final)
  on conflict on constraint responses_idempotency_key do nothing
  returning id into v_id;

  if v_id is not null then
    response_id := v_id; outcome := 'RECORDED'; return next; return;
  end if;

  -- we lost the race, or this is a replay. Postgres held us until the winner
  -- committed, so the row we read now is the authoritative one.
  select r.id, r.value_digest into v_existing, v_stored from public.responses r
   where r.presented_item_id = p_presented_item and r.client_seq = p_client_seq;
  if v_existing is null then
    raise exception 'idempotency key conflicted but no response is visible; refusing to guess';
  end if;
  if v_stored = v_digest then
    response_id := v_existing; outcome := 'ACKNOWLEDGED'; return next; return;
  end if;
  raise exception 'receipt (%, %) already carries a different answer: a new answer needs a new client_seq (INV-28)',
    p_presented_item, p_client_seq;
end $$;
revoke all on function public.submit_response(uuid, integer, jsonb, timestamptz,
  public.receipt_mode, boolean) from public, anon, authenticated;
grant execute on function public.submit_response(uuid, integer, jsonb, timestamptz,
  public.receipt_mode, boolean) to service_role;

-- ---------------------------------------------------------------------------
-- Result provenance and lineage.
-- ---------------------------------------------------------------------------
create function public.enforce_result_write() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_inst uuid; v_person uuid; v_class public.evidence_class; v_prev_session uuid;
begin
  if tg_op <> 'INSERT' then
    raise exception 'a result is immutable: a recomputation inserts a new linked row (INV-29)';
  end if;
  select s.institution_id, s.person_id, s.evidence_class
    into v_inst, v_person, v_class
    from public.assessment_sessions s where s.id = new.session_id;
  if v_inst is null then raise exception 'unknown session %', new.session_id; end if;
  new.institution_id := v_inst;
  new.person_id := v_person;
  new.evidence_class := v_class;

  if new.supersedes_result_id is not null then
    select r.session_id into v_prev_session from public.assessment_results r
     where r.id = new.supersedes_result_id;
    if v_prev_session is null then
      raise exception 'the superseded result does not exist';
    end if;
    if v_prev_session <> new.session_id then
      raise exception 'a result supersedes only a result of the same session (INV-29)';
    end if;
  end if;
  return new;
end $$;
revoke all on function public.enforce_result_write() from public, anon, authenticated;

create trigger assessment_results_write before insert or update or delete on public.assessment_results
  for each row execute function public.enforce_result_write();

-- ---------------------------------------------------------------------------
-- Reads only, same shape as slice A.
-- ---------------------------------------------------------------------------
grant select on public.responses to authenticated;
grant select on public.assessment_results to authenticated;

create policy responses_select on public.responses for select to authenticated
  using (exists (select 1 from public.assessment_sessions s
                  where s.id = session_id
                    and (s.person_id = public.current_person_id()
                      or public.can_in_institution('CAN_REVIEW_INTEGRITY', s.institution_id))));

create policy assessment_results_select on public.assessment_results for select to authenticated
  using (person_id = public.current_person_id()
      or public.can_in_institution('CAN_REVIEW_INTEGRITY', institution_id)
      or public.can_in_institution('CAN_ASSIGN_LEARNING', institution_id));

create trigger responses_tenant_immutable before update on public.responses
  for each row execute function public.enforce_record_tenant_immutable();
create trigger assessment_results_tenant_immutable before update on public.assessment_results
  for each row execute function public.enforce_record_tenant_immutable();

insert into public.record_class_registry values
  ('responses',           'INSTITUTION_SCOPED', 'evidence never travels with a learner'),
  ('assessment_results',  'INSTITUTION_SCOPED', 'evidence never travels with a learner');

-- ---------------------------------------------------------------------------
-- Verification block (ADR-0003): structural and pure-function only.
-- ---------------------------------------------------------------------------
do $$
declare n int; bad text; def text;
begin
  select count(*) into n from pg_tables where schemaname='public' and not rowsecurity
   and tablename in ('responses','assessment_results');
  if n > 0 then raise exception 'RLS not enabled on % new evidence table(s)', n; end if;

  select string_agg(g.table_name || '.' || g.privilege_type || '->' || g.grantee, ', ') into bad
    from information_schema.role_table_grants g
   where g.table_schema='public' and g.grantee in ('anon','authenticated')
     and g.table_name in ('responses','assessment_results')
     and g.privilege_type in ('INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES');
  if bad is not null then raise exception 'a client role can write evidence: %', bad; end if;

  -- the idempotency key is anchored to the delivery record, not to a pair
  if not exists (select 1 from pg_constraint c join pg_class t on t.oid=c.conrelid
                  where t.relname='responses' and c.conname='responses_idempotency_key'
                    and c.contype='u') then
    raise exception 'the response idempotency key is not a unique constraint';
  end if;
  select string_agg(a.attname, ',' order by a.attnum) into bad
    from pg_constraint c join pg_class t on t.oid=c.conrelid
    join unnest(c.conkey) k on true join pg_attribute a on a.attrelid=t.oid and a.attnum=k
   where t.relname='responses' and c.conname='responses_idempotency_key';
  if bad <> 'presented_item_id,client_seq' then
    raise exception 'the idempotency key is (%), expected (presented_item_id,client_seq)', bad;
  end if;

  -- the write path arbitrates on the index, not on a prior read
  select pg_get_functiondef(p.oid) into def from pg_proc p
    join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and p.proname='submit_response';
  if def not like '%on conflict on constraint responses_idempotency_key do nothing%' then
    raise exception 'submit_response does not let the unique index arbitrate';
  end if;
  if def !~* 'insert into public\.responses' then
    raise exception 'submit_response does not insert'; end if;
  if position('select r.id, r.value_digest' in def) < position('on conflict' in def) then
    raise exception 'submit_response reads before it inserts: a concurrent pair could both see nothing';
  end if;

  -- the digest covers the answer only, not how it travelled
  select pg_get_functiondef(p.oid) into def from pg_proc p
    join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and p.proname='enforce_response_write';
  if def not like '%content_digest(new.value::text)%' then
    raise exception 'the response digest is not computed over the value alone';
  end if;
  foreach bad in array array['received_at','client_asserted_at','receipt_mode'] loop
    if def like '%content_digest%' || bad || '%' then
      raise exception 'transport metadata (%) entered the response digest', bad;
    end if;
  end loop;

  -- lineage: one root per session, one successor per predecessor
  if not exists (select 1 from pg_indexes where schemaname='public'
                  and indexname='assessment_results_one_root_per_session'
                  and indexdef like '%WHERE (supersedes_result_id IS NULL)%') then
    raise exception 'the one-root-per-session partial index is missing or unfiltered';
  end if;
  if not exists (select 1 from pg_constraint c join pg_class t on t.oid=c.conrelid
                  where t.relname='assessment_results' and c.conname='results_one_successor'
                    and c.contype='u') then
    raise exception 'the lineage can fork: no unique constraint on supersedes_result_id';
  end if;

  -- scoring provenance is required on every row of a lineage, not inherited
  select count(*) into n from information_schema.columns
   where table_schema='public' and table_name='assessment_results'
     and column_name in ('engine_version','scoring_policy_version') and is_nullable='YES';
  if n > 0 then raise exception '% scoring provenance column(s) are nullable (INV-29)', n; end if;

  -- both tables refuse UPDATE and DELETE outright
  foreach bad in array array['enforce_response_write','enforce_result_write'] loop
    select pg_get_functiondef(p.oid) into def from pg_proc p
      join pg_namespace ns on ns.oid=p.pronamespace
     where ns.nspname='public' and p.proname=bad;
    if def not like '%tg_op <> ''INSERT''%' then
      raise exception '% does not refuse every non-insert write', bad;
    end if;
  end loop;

  -- standing hygiene
  select count(*) into n from information_schema.role_table_grants
   where table_schema='public' and grantee='anon';
  if n > 0 then raise exception 'anon holds % table grant(s) in public', n; end if;
  select count(*) into n from pg_policies
   where schemaname='public' and (qual='true' or with_check='true');
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
