-- ---------------------------------------------------------------------------
-- WP2. THE MANAGEMENT DECISION FOUNDATION.
--
-- "PINTAR mengusulkan, manusia memutuskan." The product model is
--
--     evidence / signal  ->  decision candidate  ->  human decision  ->  state
--
-- and the whole point of writing it down is that the four are DIFFERENT
-- THINGS. Before this migration PINTAR could represent the first and, through
-- `record_integrity_review`, the third -- as an audit row. It could not
-- represent the second or the fourth at all. A head of department who decided
-- an integrity signal deserved Management attention had nowhere to put that,
-- and nobody downstream had anywhere to look.
--
-- WHAT THIS IS NOT. It is not a workflow engine: there are no workflow
-- definitions, no transition tables, no approval chains and no rules that fire
-- on their own. The state machine is three states and it is written in one
-- CHECK constraint and one function. Families B and C appear in the enum
-- because the product model names them; neither has a creation path here, and
-- inventing one before the product exists is the speculation this refuses.
--
-- A SIGNAL NEVER BECOMES A VERDICT. Nothing in this migration reads a
-- threshold, and no path writes an outcome without a named human in
-- `decided_by_person_id`. The CHECK constraints make "decided with nobody
-- deciding" unrepresentable rather than merely discouraged, and the terminal
-- block applies the same verdict-shaped-column sweep `integrity_signals`
-- carries, so a later column called `guilt` or `penalty` cannot be added
-- quietly.
--
-- THE EVIDENCE IS REFERENCED, NEVER REWRITTEN. `source_table` / `source_id`
-- point at the integrity signal. The signal row is not mutated, not annotated
-- and not carried into the decision; `record_integrity_review`'s audit trail
-- stays exactly as it was. A referral is a new fact ABOUT evidence, not a new
-- version OF it.
--
-- AUTHORIZATION IS WP1'S, ON BOTH AXES AND AT BOTH ENDS.
--
--   REFERRING is an integrity act: CAN_REVIEW_INTEGRITY, over the node the
--   session was sat in. The existing `record_integrity_review` checks that
--   capability institution-flat; this endpoint is new, so it is contained from
--   its first line rather than inheriting a shape WP1 spent itself removing.
--
--   DECIDING is a Management act: the ROLE_SET {HEAD_OF_DEPARTMENT, DEAN}
--   that WP1 established, over the decision's own node. NOT rank -- rank reads
--   INSTITUTION_ADMIN and SYSTEM_ADMIN straight in, and the ruling is that
--   administrative authority is not academic Management authority. NOT a
--   capability -- F06-N02 requires a dean to be refused every capability
--   endpoint, on the stated premise that a dean holds none.
--
-- IDEMPOTENCY IS A PARTIAL UNIQUE INDEX. One OPEN decision per piece of
-- evidence per family, so a double-click cannot make two queue entries; and
-- because the index is partial on `state <> 'DECIDED'`, evidence that was
-- decided once can legitimately be referred again later when something new
-- happens. That distinction is Objective 9 in one line of DDL.
-- ---------------------------------------------------------------------------

create type public.management_decision_family as enum
  ('INTEGRITY_REFERRAL', 'LEARNING_INTERVENTION', 'PROGRAMME_OPERATIONAL_FOLLOW_UP');

-- THREE STATES. `AWAITING_REVIEW` is "Management has been asked"; `UNDER_REVIEW`
-- is "a named human has picked it up", which is the one thing a shared queue
-- genuinely needs in order not to be worked twice; `DECIDED` is terminal and
-- carries the outcome. A fourth CLOSED state would be a synonym for DECIDED,
-- and a state nobody can distinguish is a state nobody maintains.
create type public.management_decision_state as enum
  ('AWAITING_REVIEW', 'UNDER_REVIEW', 'DECIDED');

-- THE OUTCOMES NAME WHAT MANAGEMENT DID, exactly as the three integrity-review
-- decisions name what the reviewer did. None of them is a finding about a
-- learner. There is no sanction here, no penalty here and no guilt here,
-- because deciding those is not something a database is allowed to represent
-- on a human's behalf.
create type public.management_decision_outcome as enum
  ('NO_FURTHER_ACTION', 'LEARNER_SUPPORT_ARRANGED', 'ESCALATED_TO_INSTITUTION');

create table public.management_decisions (
  id                    uuid primary key default gen_random_uuid(),
  family                public.management_decision_family not null,
  institution_id        uuid not null references public.institutions(id),
  -- THE CONTAINMENT ANCHOR. Not nullable: a Management decision with no
  -- organizational home could only be authorized institution-flat, which is
  -- the shape WP1 removed.
  scope_node_id         uuid not null references public.org_nodes(id),
  -- nullable because family C is about a programme and has no learner
  subject_person_id     uuid references public.persons(id),
  source_table          text not null check (source_table ~ '^[a-z][a-z_]+$'),
  source_id             uuid not null,
  state                 public.management_decision_state not null default 'AWAITING_REVIEW',
  raised_by_person_id   uuid not null references public.persons(id),
  raised_at             timestamptz not null default now(),
  raised_note           text,
  decided_by_person_id  uuid references public.persons(id),
  decided_at            timestamptz,
  outcome               public.management_decision_outcome,
  decision_note         text,
  -- A DECISION IS A HUMAN, A MOMENT AND AN OUTCOME, OR IT IS NOT A DECISION.
  -- All three move together; none can arrive without the others.
  constraint management_decisions_decided_is_whole
    check ((state = 'DECIDED') = (outcome is not null)
       and (outcome is not null) = (decided_by_person_id is not null)
       and (decided_by_person_id is not null) = (decided_at is not null)),
  constraint management_decisions_integrity_source
    check (family <> 'INTEGRITY_REFERRAL' or source_table = 'integrity_signals')
);

create index management_decisions_queue_idx
  on public.management_decisions (institution_id, state, raised_at);
create index management_decisions_scope_idx
  on public.management_decisions (scope_node_id);

-- ONE OPEN DECISION PER PIECE OF EVIDENCE, and a later one still allowed.
create unique index management_decisions_one_open_per_source
  on public.management_decisions (family, source_table, source_id)
  where state <> 'DECIDED';

alter table public.management_decisions enable row level security;
grant select on public.management_decisions to authenticated;

insert into public.record_class_registry values
  ('management_decisions', 'INSTITUTION_SCOPED',
   'a Management decision is about a place in one school and never travels with a learner');

-- ─────────────────────────────── the Management role set, over a given node
-- `can_on_node` asks about a CAPABILITY; this asks about a ROLE SET, which is
-- the WP1 shape for Management authority. Same active-assignment window, same
-- jalur containment, so a reader's Management reach and their roster reach
-- cannot drift apart.
create function public.management_scope_over_node(p_node uuid)
returns boolean
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_jalur uuid[]; v_person uuid;
begin
  if p_node is null then return false; end if;
  v_person := public.current_person_id();
  if v_person is null then return false; end if;
  select o.jalur into v_jalur from public.org_nodes o where o.id = p_node;
  if v_jalur is null then return false; end if;
  return coalesce((
    select true from public.role_assignments ra
     where ra.person_id = v_person and ra.revoked_at is null
       and now() >= ra.valid_from and now() < ra.valid_until
       and ra.role = any (public.management_learner_roles())
       and ra.scope_node_id is not null and v_jalur @> array[ra.scope_node_id]
     limit 1), false);
exception when others then return false;
end $$;
comment on function public.management_scope_over_node(uuid) is
  'Does the caller hold an active Management role -- the WP1 set, HEAD_OF_DEPARTMENT or DEAN -- whose '
  'assigned scope contains this node? Deliberately not a rank test: INSTITUTION_ADMIN and SYSTEM_ADMIN '
  'outrank both and hold no Management decision authority.';
revoke all on function public.management_scope_over_node(uuid) from public, anon, authenticated;
grant execute on function public.management_scope_over_node(uuid) to authenticated;

insert into public.client_rpc_registry (function_name, exposure, note)
values ('management_scope_over_node', 'PLATFORM',
        'Row predicate behind management_decisions_select, and the authorization test both Management '
        'endpoints apply. Answers whether the caller holds a Management role over a node; takes no '
        'identity argument and returns no data.')
on conflict (function_name) do update
   set exposure = excluded.exposure, note = excluded.note;

-- READS. Management authority over the decision's node, or having raised it --
-- the second disjunct so an integrity reviewer who refers something can still
-- see what became of it, which is the difference between a referral and a
-- disappearance.
create policy management_decisions_select on public.management_decisions for select to authenticated
  using (public.management_scope_over_node(scope_node_id)
      or raised_by_person_id = public.current_person_id());

-- No INSERT, UPDATE or DELETE policy and no write grant: every write goes
-- through one of the two endpoints below, so the audit row and the state
-- change are the same transaction and cannot come apart.

-- ───────────────────────────────────────────── 1. referral: evidence -> queue
create function public.refer_integrity_signal(p_signal uuid, p_note text)
returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_actor uuid; v_sig record; v_open uuid; v_id uuid;
begin
  v_actor := public.current_person_id();
  if v_actor is null or p_signal is null then
    raise exception 'referring an integrity signal requires an authenticated actor and a signal';
  end if;

  select s.id, s.institution_id, s.session_id, s.category,
         ses.class_node_id, ses.person_id
    into v_sig
    from public.integrity_signals s
    join public.assessment_sessions ses on ses.id = s.session_id
   where s.id = p_signal;

  -- AUTHORIZATION BEFORE ANYTHING ELSE, and one message for every refusal, so
  -- an unknown signal and a signal in the next department are indistinguishable
  -- from outside.
  if v_sig.id is null or v_sig.class_node_id is null
     or not public.can_on_node('CAN_REVIEW_INTEGRITY', v_sig.class_node_id) then
    raise exception 'referring an integrity signal requires CAN_REVIEW_INTEGRITY over the node it was observed in';
  end if;

  -- IDEMPOTENT. A second referral of the same still-open signal is the same
  -- referral; it returns the existing row and writes no second audit record,
  -- because nothing happened the first one did not already record.
  select d.id into v_open from public.management_decisions d
   where d.family = 'INTEGRITY_REFERRAL' and d.source_table = 'integrity_signals'
     and d.source_id = p_signal and d.state <> 'DECIDED';
  if v_open is not null then return v_open; end if;

  insert into public.management_decisions
    (family, institution_id, scope_node_id, subject_person_id, source_table, source_id,
     state, raised_by_person_id, raised_note)
  values ('INTEGRITY_REFERRAL', v_sig.institution_id, v_sig.class_node_id, v_sig.person_id,
          'integrity_signals', p_signal, 'AWAITING_REVIEW', v_actor, p_note)
  returning management_decisions.id into v_id;

  perform public.audit_write('management_decision.raised', 'management_decisions', v_id::text,
    v_sig.institution_id,
    jsonb_build_object('family', 'INTEGRITY_REFERRAL', 'source_table', 'integrity_signals',
                       'source_id', p_signal, 'scope_node_id', v_sig.class_node_id,
                       'category', v_sig.category));
  return v_id;
end $$;
comment on function public.refer_integrity_signal(uuid, text) is
  'Asks Management to consider an existing integrity signal. Creates a decision CANDIDATE and nothing '
  'else: the signal is referenced, never rewritten, and no outcome is implied by the referral.';
revoke all on function public.refer_integrity_signal(uuid, text) from public, anon, authenticated;
grant execute on function public.refer_integrity_signal(uuid, text) to authenticated;

insert into public.client_rpc_registry (function_name, exposure, note, authorization_kind, authorization_requirement)
values ('refer_integrity_signal', 'STAFF',
        'Refers an integrity signal to Management as an INTEGRITY_REFERRAL candidate in AWAITING_REVIEW, '
        'audited as management_decision.raised. Referring is not deciding and carries no outcome.',
        'CAPABILITY', 'CAN_REVIEW_INTEGRITY')
on conflict (function_name) do update
   set exposure = excluded.exposure, note = excluded.note,
       authorization_kind = excluded.authorization_kind,
       authorization_requirement = excluded.authorization_requirement;

-- ───────────────────────────────────────── 2. the human decision, and only it
create function public.advance_management_decision(
  p_decision uuid, p_to public.management_decision_state,
  p_outcome public.management_decision_outcome, p_note text)
returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_actor uuid; d record;
begin
  v_actor := public.current_person_id();
  if v_actor is null or p_decision is null or p_to is null then
    raise exception 'deciding is for a HEAD_OF_DEPARTMENT or DEAN standing over this decision';
  end if;

  select m.id, m.institution_id, m.scope_node_id, m.state, m.family
    into d from public.management_decisions m where m.id = p_decision;
  if d.id is null or not public.management_scope_over_node(d.scope_node_id) then
    raise exception 'deciding is for a HEAD_OF_DEPARTMENT or DEAN standing over this decision';
  end if;

  -- THE WHOLE STATE MACHINE. Anything not named here is refused, including
  -- every move out of DECIDED: a recorded human decision is not edited later,
  -- and new information becomes a new referral rather than a rewritten one.
  if not ((d.state = 'AWAITING_REVIEW' and p_to in ('UNDER_REVIEW', 'DECIDED'))
       or (d.state = 'UNDER_REVIEW'    and p_to = 'DECIDED')) then
    raise exception 'a management decision does not move from % to %', d.state, p_to;
  end if;
  if (p_to = 'DECIDED') <> (p_outcome is not null) then
    raise exception 'DECIDED carries an outcome and no other state carries one';
  end if;

  if p_to = 'DECIDED' then
    update public.management_decisions
       set state = 'DECIDED', outcome = p_outcome, decided_by_person_id = v_actor,
           decided_at = now(), decision_note = p_note
     where management_decisions.id = p_decision;
  else
    update public.management_decisions set state = p_to where management_decisions.id = p_decision;
  end if;

  perform public.audit_write('management_decision.advanced', 'management_decisions', p_decision::text,
    d.institution_id,
    jsonb_build_object('family', d.family, 'from_state', d.state, 'to_state', p_to,
                       'outcome', p_outcome, 'scope_node_id', d.scope_node_id));
  return p_decision;
end $$;
comment on function public.advance_management_decision(uuid, public.management_decision_state, public.management_decision_outcome, text) is
  'The human decision. Moves a Management decision through the three declared states and records who '
  'moved it. No threshold, no schedule and no other function reaches this: a state change here is '
  'always a person.';
revoke all on function public.advance_management_decision(uuid, public.management_decision_state, public.management_decision_outcome, text)
  from public, anon, authenticated;
grant execute on function public.advance_management_decision(uuid, public.management_decision_state, public.management_decision_outcome, text)
  to authenticated;

insert into public.client_rpc_registry (function_name, exposure, note, authorization_kind, authorization_requirement)
values ('advance_management_decision', 'STAFF',
        'Records a human Management decision and the state it moved to, audited as '
        'management_decision.advanced. Rejects every transition the model does not name, and refuses to '
        'record an outcome without recording who decided it.',
        'ROLE_SET', 'HEAD_OF_DEPARTMENT,DEAN')
on conflict (function_name) do update
   set exposure = excluded.exposure, note = excluded.note,
       authorization_kind = excluded.authorization_kind,
       authorization_requirement = excluded.authorization_requirement;

-- ---------------------------------------------------------------------------
-- Verification (ADR-0014). Structural, then the model's own claims measured
-- in a subtransaction that is rolled back.
-- ---------------------------------------------------------------------------
do $$
declare
  bad text; n int; v_inst uuid; v_node uuid; v_sig uuid;
  v_person uuid; v_id uuid; v_id2 uuid; v_caught boolean;
begin
  ------------------------------------------------------------------ structural
  -- A DECISION IS NOT A VERDICT, enforced the same way `integrity_signals`
  -- enforces it: by refusing the vocabulary.
  select string_agg(column_name, ', ') into bad from information_schema.columns
   where table_schema = 'public' and table_name = 'management_decisions'
     and (column_name ~* '(verdict|cheat|guilt|suspicio|penalt|violation|flagged|confirmed|sanction)');
  if bad is not null then
    raise exception 'management_decisions carries a verdict-shaped column: %', bad;
  end if;
  select string_agg(e.enumlabel, ', ') into bad from pg_enum e join pg_type t on t.oid = e.enumtypid
   where t.typname = 'management_decision_outcome'
     and e.enumlabel ~* '(verdict|cheat|guilt|suspicio|penalt|violation|sanction|expel|suspend)';
  if bad is not null then
    raise exception 'a Management outcome names a punishment rather than an act: %', bad;
  end if;

  if not (select relrowsecurity from pg_class where oid = 'public.management_decisions'::regclass) then
    raise exception 'RLS is not enabled on management_decisions';
  end if;
  select string_agg(p.polname, ', ') into bad from pg_policy p
   where p.polrelid = 'public.management_decisions'::regclass and p.polcmd <> 'r';
  if bad is not null then
    raise exception 'management_decisions carries a client write policy: %', bad;
  end if;
  select string_agg(g.privilege_type, ', ') into bad from information_schema.role_table_grants g
   where g.table_schema = 'public' and g.table_name = 'management_decisions'
     and g.grantee in ('anon', 'authenticated') and g.privilege_type <> 'SELECT';
  if bad is not null then
    raise exception 'a client role may write management_decisions directly: %', bad;
  end if;

  -- THE ONLY WRITERS ARE THE TWO ENDPOINTS. If a third function learns to move
  -- a decision, this names it -- which is how "a signal silently became a
  -- verdict" would actually arrive.
  select string_agg(p.proname, ', ') into bad from pg_proc p
   where p.pronamespace = 'public'::regnamespace and p.prokind = 'f'
     and p.proname not in ('refer_integrity_signal', 'advance_management_decision')
     and pg_get_functiondef(p.oid) ~* '(insert into|update)\s+public\.management_decisions';
  if bad is not null then
    raise exception 'something other than the two declared endpoints writes a Management decision: %', bad;
  end if;

  ----------------------------------------------------------------- behavioural
  -- A MIGRATION RUNS BEFORE THE SEEDS, so this builds its own tenant rather
  -- than looking for one. An earlier draft read the demonstration school and
  -- skipped everything when it was absent -- which is exactly the vacuous
  -- fixture that reports success over nothing. Every row here is rolled back.
  begin
    perform set_config('app.seed_intent', 'synthetic', true);
    insert into public.institutions (name, slug, is_synthetic)
    values ('Sekolah WP2 probe', 'wp2probe-' || substr(md5(random()::text), 1, 10), true)
    returning institutions.id into v_inst;
    select o.id into v_node from public.org_nodes o
     where o.institution_id = v_inst and o.kind = 'INSTITUTION';
    insert into public.persons (display_name) values ('Orang WP2 probe')
    returning persons.id into v_person;
    v_sig := gen_random_uuid();

    -- A CANDIDATE ARRIVES AWAITING A HUMAN, and carries no outcome.
    insert into public.management_decisions
      (family, institution_id, scope_node_id, subject_person_id, source_table, source_id,
       raised_by_person_id)
    values ('INTEGRITY_REFERRAL', v_inst, v_node, v_person, 'integrity_signals', v_sig, v_person)
    returning management_decisions.id into v_id;
    select count(*) into n from public.management_decisions
     where id = v_id and state = 'AWAITING_REVIEW' and outcome is null
       and decided_by_person_id is null and decided_at is null;
    if n <> 1 then raise exception 'a new referral did not arrive awaiting a human and empty-handed'; end if;

    -- ONE OPEN REFERRAL PER PIECE OF EVIDENCE.
    v_caught := false;
    begin
      insert into public.management_decisions
        (family, institution_id, scope_node_id, subject_person_id, source_table, source_id,
         raised_by_person_id)
      values ('INTEGRITY_REFERRAL', v_inst, v_node, v_person, 'integrity_signals', v_sig, v_person)
      returning management_decisions.id into v_id2;
    exception when unique_violation then v_caught := true; end;
    if not v_caught then raise exception 'the same open evidence produced two Management records'; end if;

    -- AN OUTCOME WITH NOBODY DECIDING IT IS UNREPRESENTABLE -- the sentence
    -- "a signal became a verdict on its own" has no row that can express it.
    v_caught := false;
    begin
      update public.management_decisions set state = 'DECIDED', outcome = 'NO_FURTHER_ACTION'
       where id = v_id;
    exception when check_violation then v_caught := true; end;
    if not v_caught then raise exception 'a decision was recorded with nobody deciding it'; end if;
    v_caught := false;
    begin
      update public.management_decisions set decided_by_person_id = v_person, decided_at = now()
       where id = v_id;
    exception when check_violation then v_caught := true; end;
    if not v_caught then raise exception 'a decider was recorded against no decision'; end if;

    -- A WHOLE DECISION IS ACCEPTED.
    update public.management_decisions
       set state = 'DECIDED', outcome = 'NO_FURTHER_ACTION',
           decided_by_person_id = v_person, decided_at = now()
     where id = v_id;

    -- AND DECIDED EVIDENCE MAY BE REFERRED AGAIN, because something new may
    -- yet happen. The idempotency guard is about a double-click, not about
    -- forbidding a second, later judgement.
    insert into public.management_decisions
      (family, institution_id, scope_node_id, subject_person_id, source_table, source_id,
       raised_by_person_id)
    values ('INTEGRITY_REFERRAL', v_inst, v_node, v_person, 'integrity_signals', v_sig, v_person)
    returning management_decisions.id into v_id2;
    if v_id2 is null then raise exception 'decided evidence could not be referred again'; end if;

    -- THE FAMILY AND ITS EVIDENCE MUST AGREE.
    v_caught := false;
    begin
      insert into public.management_decisions
        (family, institution_id, scope_node_id, source_table, source_id, raised_by_person_id)
      values ('INTEGRITY_REFERRAL', v_inst, v_node, 'question_health', gen_random_uuid(), v_person);
    exception when check_violation then v_caught := true; end;
    if not v_caught then
      raise exception 'an integrity referral was allowed to point at something other than a signal';
    end if;

    perform set_config('app.seed_intent', '', true);
    raise exception 'ROLLBACK_PROBE';
  exception when others then
    perform set_config('app.seed_intent', '', true);
    if sqlerrm <> 'ROLLBACK_PROBE' then raise; end if;
  end;

  raise notice '0097 verified: a referral arrives awaiting a human and empty-handed; the same open '
    'evidence cannot be queued twice while decided evidence may be referred again; an outcome without a '
    'named decider and a moment is unrepresentable and so is a decider without an outcome; an integrity '
    'referral may only point at an integrity signal; the table takes no client write and only the two '
    'declared endpoints move a decision; and no column or outcome names a punishment. The authorization '
    'and audit halves are measured against seeded evidence by F06-P15';
end $$;
