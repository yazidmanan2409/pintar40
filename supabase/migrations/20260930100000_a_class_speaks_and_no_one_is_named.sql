-- ---------------------------------------------------------------------------
-- WP7B. A CLASS SPEAKS, AND NO ONE IS NAMED.
--
-- Anonymous student -> educator feedback. The product is one sentence: a class
-- tells the school how its teaching is experienced, and the school hears the
-- class without hearing any child in it.
--
-- THE INVARIANT THIS MIGRATION EXISTS FOR, stated so it can be tested:
--
--     No ordinary authorized PINTAR application or database path can produce a
--     respondent -> answer pair.
--
-- Not "the surface does not show it". Not "a policy hides it". There is no
-- join. The two halves of a submission are written in one transaction and then
-- have no column in common but the cycle they belong to:
--
--     feedback_opportunities   knows WHO may answer and WHETHER they have.
--                              It never learns what they said.
--     feedback_responses       knows WHAT was said.
--                              It never learns who said it -- no person, no
--                              account, no session, no enrolment, no
--                              membership, no client sequence, no device, no
--                              correlation id and NO TIMESTAMP OF ANY KIND.
--
-- ONE IDENTITY-BEARING TABLE, NOT TWO, AND THE REASON IS PRIVACY RATHER THAN
-- TIDINESS. The investigation proposed separate eligibility and participation
-- tables. Separate tables would mean a participation row INSERTED at the
-- moment a learner submits -- and an inserted row carries its own arrival: a
-- physical position at the end of the heap, an xmin of its own, and the
-- standing temptation of a `created_at` that every other table in this schema
-- has. Rows that arrive one at a time are a submission order whether or not
-- anybody meant to keep one.
--
-- So eligibility and consumption are ONE ROW, written for every eligible
-- learner in the single transaction that opens the cycle, and consumed by
-- flipping a boolean. Nothing arrives at submission time on the identity side.
-- The combined object keeps every property the separate pair had:
--
--     immutable eligibility-at-open   rows exist only from the opening
--                                     transaction (the trigger refuses any
--                                     other insert, and every delete)
--     exactly-once submission         `update ... where not consumed` takes the
--                                     row lock; a second caller -- retry,
--                                     double-click or concurrent tab -- finds
--                                     zero rows and is refused by name
--     atomicity                       the flip and the answers are the same
--                                     transaction, so a lost acknowledgement
--                                     leaves either both or neither
--     the learner's own state         one row, readable by its own person and
--                                     nobody else
--     no fine-grained timestamp       there is no timestamp column to have
--     no answer linkage               the answers carry no person
--     no audit linkage                submission writes no audit row at all
--
-- THE THRESHOLD IS DATA, NOT AN IF. Five is PINTAR 4.0's canonical anonymity
-- threshold and it lives in `feedback_thresholds` as a published, versioned
-- row. Each cycle BINDS the version live at the moment it opened, so a later
-- republication cannot retroactively change what an already-collected cycle
-- was promised. No authorization path and no result path contains the number.
--
-- BELOW THE THRESHOLD, NOTHING NUMERIC EXISTS TO LEAK. A closed cycle that did
-- not reach it becomes WITHHELD and no result row is ever written: not a
-- count, not a `have`, not a `needed`, not a percentage, not a distribution.
-- The reader returns a statement key and the state, and that is the whole
-- answer. The canonical copy behind the key, which the localization layer will
-- carry (WP7C), is:
--
--     id  Belum cukup tanggapan untuk menampilkan hasil dengan aman.
--     en  There are not enough responses to display the results safely.
--
-- Note what is NOT reused here: `metric_evaluate` returns `have` and `needed`
-- below its minimum, and KartuKetiadaan renders "(3/5)" on purpose, because a
-- statistical readiness floor is a fact a reader may act on. An anonymity
-- floor is not that. The same shape applied here would be a count oracle
-- pointed at a class of children, so the shape is deliberately not reused.
--
-- RESULTS ARE COMPUTED ONCE, AT CLOSE, AND FROZEN. A live aggregate that moves
-- as answers arrive is a differencing attack with a refresh button: read,
-- watch one more learner submit, read again. So nothing aggregates while a
-- cycle is OPEN, close computes per-question marginals and the final total in
-- one pass, and the snapshot is immutable afterwards. PUBLISHED and WITHHELD
-- are both terminal: a cycle never reopens, and no response can arrive after
-- close (the responses trigger refuses it independently of the endpoint).
--
-- AUTHORITY IS MANAGEMENT'S, AND THE SUBJECT IS NEVER IN CHARGE OF IT.
-- Opening and closing require HEAD_OF_DEPARTMENT or DEAN over the class,
-- through the existing `management_scope_over_node()` -- the same role set WP1
-- and WP2 established, not a rank test and not a capability. Deliberately NOT
-- CAN_ASSIGN_LEARNING, which an EDUCATOR holds: that gate would have let the
-- subject of a cycle open the cycle about themselves. The subject is refused
-- as opener by a CHECK constraint as well as by the endpoint, because "the
-- educator ran their own feedback round" should be unrepresentable rather than
-- merely refused.
--
-- THE TEACHING RELATIONSHIP IS THE ONE THE REPOSITORY ACTUALLY HAS, AND NO
-- MORE. PINTAR has no teaching-assignment table: there is no row that says
-- "this educator teaches this subject to this class". What exists is a live
-- EDUCATOR role assignment whose scope contains the class. That -- and only
-- that -- is what a cycle asserts about its subject, and the provenance a
-- cycle records is exactly: THIS EDUCATOR HELD TEACHING AUTHORITY OVER THIS
-- CLASS WHEN THE CYCLE OPENED. Inventing a subject or a course relationship
-- to make the feature read better would be inventing a fact.
--
-- THE ACADEMIC BOUNDARY USES THE ONLY CONTEXT FACT THAT EXISTS.
-- `courses.learning_context` (WP6A) is the repository's single authority on
-- whether something is ACADEMIC or PROFESSIONAL_DEVELOPMENT, and an
-- organizational node carries no context of its own -- WP6's own fixture hangs
-- a professional-development CLASS off a PD department, so "kind = CLASS" does
-- not exclude PD by itself. A cycle therefore refuses a class that any
-- learning assignment reaches with a non-ACADEMIC course. Cohort-level and
-- professional-development feedback are out of PINTAR 4.0 entirely.
--
-- WHAT THIS IS NOT. It is not evidence: no `evidence_class`, no
-- `evidence_channel`, no session, no score, no correctness, no misconception,
-- no difficulty. `assert_feedback_is_not_evidence()` names the actual
-- consumers -- calculators, the evaluator, reports, certificates, Question
-- Health, integrity, the learner projections -- and fails if any of them
-- learns to read a feedback relation. It is not an educator-performance score:
-- there is no composite, no ranking, no verdict, no case and no referral. It
-- is not a complaint channel: there is no free text anywhere in it, and no
-- column that could hold any.
--
-- ACCEPTED RESIDUALS, RECORDED RATHER THAN HIDDEN. (1) Unanimity: if every one
-- of k respondents chooses the same option, each respondent's answer is
-- implied by the published marginal. PINTAR 4.0 does not suppress unanimous
-- cells (ruled). (2) Privileged infrastructure: a holder of the service role,
-- of superuser, of a backup or of the WAL can join the consumed opportunity to
-- the responses written in the same transaction through `xmin`, and physical
-- row adjacency within that transaction reconstructs a respondent's whole
-- sheet. Atomicity is not weakened to prevent this; the claim is about
-- ordinary authorized paths, and this residual is the reason the claim is
-- worded that way.
-- ---------------------------------------------------------------------------

-- ═══════════════════════════════════ 1. the governed question set, versioned
-- Platform-published reference data, in the shape `metric_catalogue` and
-- `readiness_tiers` already use: a version row, rows beneath it, a supersede
-- pointer, and nothing editable once it exists. An institution never authors
-- questions -- one school's private wording is one school's private study, and
-- the comparability that makes this worth collecting would be gone.
--
-- NO `is_required` COLUMN. Every question in a v1 set is required, and a
-- column carrying one value everywhere is a column that lies about what it is
-- for. When an optional question exists, the set that introduces it can carry
-- the column and the versioning already in place makes that a publication
-- rather than a migration.
create table public.feedback_question_sets (
  version                 text primary key check (version ~ '^FQ-[0-9]+$'),
  note                    text,
  published_at            timestamptz not null default now(),
  published_by_person_id  uuid references public.persons(id),
  superseded_by           text references public.feedback_question_sets(version)
);

create table public.feedback_questions (
  set_version   text not null references public.feedback_question_sets(version),
  question_key  text not null check (question_key ~ '^[a-z][a-z0-9_]*$'),
  ordinal       smallint not null check (ordinal > 0),
  label_key     text not null check (label_key ~ '^[a-z][a-z0-9_.]*$'),
  primary key (set_version, question_key),
  unique (set_version, ordinal)
);

-- CLOSED OPTIONS, and a key rather than a sentence. The option a learner picks
-- is an identifier; what it SAYS is a localization key, so the same answer
-- means the same thing in both interface languages and no prose enters the
-- schema. There is no `is_correct`, no weight and no score: a class's
-- experience is not marked.
create table public.feedback_question_options (
  set_version   text not null,
  question_key  text not null,
  option_key    text not null check (option_key ~ '^[a-z][a-z0-9_]*$'),
  ordinal       smallint not null check (ordinal > 0),
  label_key     text not null check (label_key ~ '^[a-z][a-z0-9_.]*$'),
  primary key (set_version, question_key, option_key),
  unique (set_version, question_key, ordinal),
  foreign key (set_version, question_key)
    references public.feedback_questions (set_version, question_key)
);

alter table public.feedback_question_sets enable row level security;
alter table public.feedback_questions enable row level security;
alter table public.feedback_question_options enable row level security;

-- A PUBLISHED SET IS FROZEN. The only edit any of these three tables accepts
-- after the fact is the supersede pointer, which is how a newer set retires an
-- older one without rewriting what earlier cycles were asked.
create function public.enforce_feedback_question_set_immutable()
returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'a published feedback question set is superseded, never deleted: cycles cite it';
  end if;
  if tg_op = 'UPDATE' then
    if tg_table_name <> 'feedback_question_sets' then
      raise exception 'a published feedback question is not edited: publish a new set version';
    end if;
    if new.version is distinct from old.version
       or new.note is distinct from old.note
       or new.published_at is distinct from old.published_at
       or new.published_by_person_id is distinct from old.published_by_person_id then
      raise exception 'a published feedback question set is immutable apart from its supersede pointer';
    end if;
    if old.superseded_by is not null then
      raise exception 'that feedback question set was already superseded by %', old.superseded_by;
    end if;
  end if;
  return new;
end $$;
revoke all on function public.enforce_feedback_question_set_immutable() from public, anon, authenticated;

create trigger feedback_question_sets_immutable
  before update or delete on public.feedback_question_sets
  for each row execute function public.enforce_feedback_question_set_immutable();
create trigger feedback_questions_immutable
  before update or delete on public.feedback_questions
  for each row execute function public.enforce_feedback_question_set_immutable();
create trigger feedback_question_options_immutable
  before update or delete on public.feedback_question_options
  for each row execute function public.enforce_feedback_question_set_immutable();

-- ═════════════════════════════════════ 2. the governed anonymity threshold
-- THE NUMBER LIVES HERE AND NOWHERE ELSE. `close_feedback_cycle` reads the
-- version the cycle bound when it opened; it contains no literal of its own,
-- which the terminal block checks by reading the function body back.
create table public.feedback_thresholds (
  version                 text primary key check (version ~ '^FT-[0-9]+$'),
  minimum_responses       integer not null check (minimum_responses > 0),
  -- the sentence a reader is given instead of a number, as a key: the
  -- localization layer owns the words, the database owns which words
  statement_key           text not null check (statement_key ~ '^[a-z][a-z0-9_.]*$'),
  note                    text,
  published_at            timestamptz not null default now(),
  published_by_person_id  uuid references public.persons(id),
  superseded_by           text references public.feedback_thresholds(version)
);
alter table public.feedback_thresholds enable row level security;

create function public.enforce_feedback_threshold_immutable()
returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'a published anonymity threshold is superseded, never deleted: cycles cite it';
  end if;
  if new.version is distinct from old.version
     or new.minimum_responses is distinct from old.minimum_responses
     or new.statement_key is distinct from old.statement_key
     or new.published_at is distinct from old.published_at then
    raise exception 'a published anonymity threshold is immutable apart from its supersede pointer';
  end if;
  if old.superseded_by is not null then
    raise exception 'that anonymity threshold was already superseded by %', old.superseded_by;
  end if;
  return new;
end $$;
revoke all on function public.enforce_feedback_threshold_immutable() from public, anon, authenticated;

create trigger feedback_thresholds_immutable
  before update or delete on public.feedback_thresholds
  for each row execute function public.enforce_feedback_threshold_immutable();

-- ═══════════════════════════════════════════════ 3. the cycle, and its states
-- THREE STATES, TWO OF THEM TERMINAL. OPEN collects; PUBLISHED carries a
-- frozen snapshot; WITHHELD carries nothing at all. There is no CLOSED state
-- between them, because a closed cycle is always already one of the other two
-- -- the count that decides which is taken once, inside the closing
-- transaction, and a state that exists only between two statements is a state
-- nobody can observe or maintain.
create type public.feedback_cycle_state as enum ('OPEN', 'PUBLISHED', 'WITHHELD');

create table public.feedback_cycle_transitions (
  from_state  public.feedback_cycle_state not null,
  to_state    public.feedback_cycle_state not null,
  note        text not null,
  primary key (from_state, to_state)
);
insert into public.feedback_cycle_transitions values
  ('OPEN', 'PUBLISHED',
   'the close found at least the bound threshold of submissions and wrote one immutable snapshot'),
  ('OPEN', 'WITHHELD',
   'the close found fewer than the bound threshold; no result is written, now or ever');
alter table public.feedback_cycle_transitions enable row level security;

create table public.feedback_cycles (
  id                    uuid primary key default gen_random_uuid(),
  institution_id        uuid not null references public.institutions(id),
  -- a CLASS, checked by the endpoint against org_kind. The column cannot
  -- express "which kind", so the endpoint does and the terminal block proves it
  scope_node_id         uuid not null references public.org_nodes(id),
  academic_period_id    uuid not null references public.academic_periods(id),
  subject_person_id     uuid not null references public.persons(id),
  question_set_version  text not null references public.feedback_question_sets(version),
  threshold_version     text not null references public.feedback_thresholds(version),
  state                 public.feedback_cycle_state not null default 'OPEN',
  opened_by_person_id   uuid not null references public.persons(id),
  opened_at             timestamptz not null default now(),
  closed_by_person_id   uuid references public.persons(id),
  closed_at             timestamptz,
  -- THE SUBJECT DOES NOT RUN THEIR OWN ROUND. Refused by the endpoint and
  -- unrepresentable in the table, because "the educator opened it themselves"
  -- is the one sentence this feature must never be able to say.
  constraint feedback_cycles_subject_is_not_the_opener
    check (subject_person_id <> opened_by_person_id),
  constraint feedback_cycles_closed_is_whole
    check ((state = 'OPEN') = (closed_at is null)
       and (closed_at is null) = (closed_by_person_id is null))
);

-- ONE CYCLE PER CLASS, SUBJECT AND PERIOD (ruled). Not partial and not
-- conditional: a second cycle over the same class and educator in the same
-- period is the differencing attack -- two overlapping populations whose
-- published marginals subtract -- and the constraint is what makes it
-- impossible rather than discouraged.
create unique index feedback_cycles_one_per_class_subject_period
  on public.feedback_cycles (scope_node_id, subject_person_id, academic_period_id);
create index feedback_cycles_subject_idx on public.feedback_cycles (subject_person_id);
create index feedback_cycles_scope_idx on public.feedback_cycles (scope_node_id);

alter table public.feedback_cycles enable row level security;
grant select on public.feedback_cycles to authenticated;

create function public.enforce_feedback_cycle()
returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'a feedback cycle is closed, never deleted: a class was asked, and that happened';
  end if;
  if tg_op = 'INSERT' then
    if new.state <> 'OPEN' then
      raise exception 'a feedback cycle begins OPEN, not %', new.state;
    end if;
    return new;
  end if;
  if new.id is distinct from old.id
     or new.institution_id is distinct from old.institution_id
     or new.scope_node_id is distinct from old.scope_node_id
     or new.academic_period_id is distinct from old.academic_period_id
     or new.subject_person_id is distinct from old.subject_person_id
     or new.question_set_version is distinct from old.question_set_version
     or new.threshold_version is distinct from old.threshold_version
     or new.opened_by_person_id is distinct from old.opened_by_person_id
     or new.opened_at is distinct from old.opened_at then
    raise exception 'what a feedback cycle asks, of whom and about whom is fixed when it opens';
  end if;
  -- THE ALLOW-LIST IS THE WHOLE STATE MACHINE, and it names no move out of
  -- PUBLISHED or WITHHELD. That is how "no reopening" is enforced: not by a
  -- condition somebody could forget, but by the absence of a row.
  if new.state is distinct from old.state
     and not exists (select 1 from public.feedback_cycle_transitions t
                      where t.from_state = old.state and t.to_state = new.state) then
    raise exception 'a feedback cycle does not move from % to %', old.state, new.state;
  end if;
  return new;
end $$;
revoke all on function public.enforce_feedback_cycle() from public, anon, authenticated;

create trigger feedback_cycles_guard
  before insert or update or delete on public.feedback_cycles
  for each row execute function public.enforce_feedback_cycle();

-- READS. The subject of the cycle, and Management standing over its class.
-- NOT the learners: an eligible learner reaches their own cycles through
-- my_feedback_cycles(), which returns their own row and nobody else's. NOT
-- the institution's administrator: WP7 grants no feedback reading for
-- administering the school, and INV-18's audit authority is unchanged.
create policy feedback_cycles_select on public.feedback_cycles for select to authenticated
  using (subject_person_id = public.current_person_id()
      or public.management_scope_over_node(scope_node_id));

-- ══════════════════════════════════ 4. eligibility and consumption, one row
-- The identity-bearing half. It knows who may answer and whether they have,
-- and it has no column in which an answer could be stored.
create table public.feedback_opportunities (
  cycle_id   uuid not null references public.feedback_cycles(id),
  person_id  uuid not null references public.persons(id),
  consumed   boolean not null default false,
  primary key (cycle_id, person_id)
);
alter table public.feedback_opportunities enable row level security;
grant select on public.feedback_opportunities to authenticated;

-- THE LEARNER'S OWN ROW AND NOTHING ELSE. There is no reader of this table
-- who sees somebody else -- not the subject, not Management, not the
-- institution's administrator. A named participation list does not exist to be
-- given out.
create policy feedback_opportunities_select_own on public.feedback_opportunities
  for select to authenticated using (person_id = public.current_person_id());

create function public.enforce_feedback_opportunity()
returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_state public.feedback_cycle_state;
begin
  if tg_op = 'DELETE' then
    raise exception 'eligibility for a feedback cycle is a snapshot: a row is never removed from it';
  end if;
  if tg_op = 'INSERT' then
    -- ONLY THE OPENING TRANSACTION MAY WRITE HERE, and it says so by name.
    -- open_feedback_cycle sets this transaction-local setting around its one
    -- insert; nothing else in the schema sets it, and no client can, because
    -- set_config is not a public.* function and therefore not an endpoint.
    if coalesce(nullif(current_setting('pintar.feedback_opening', true), ''), '')
       is distinct from new.cycle_id::text then
      raise exception 'eligibility is snapshotted when a feedback cycle opens, and never afterwards';
    end if;
    select f.state into v_state from public.feedback_cycles f where f.id = new.cycle_id;
    if v_state is distinct from 'OPEN' then
      raise exception 'eligibility is snapshotted when a feedback cycle opens, and never afterwards';
    end if;
    return new;
  end if;
  if new.cycle_id is distinct from old.cycle_id or new.person_id is distinct from old.person_id then
    raise exception 'an eligibility row does not change who, or which cycle, it is about';
  end if;
  if old.consumed and not new.consumed then
    raise exception 'a submitted feedback sheet is not un-submitted';
  end if;
  return new;
end $$;
revoke all on function public.enforce_feedback_opportunity() from public, anon, authenticated;

create trigger feedback_opportunities_guard
  before insert or update or delete on public.feedback_opportunities
  for each row execute function public.enforce_feedback_opportunity();

-- ═══════════════════════════════════════════ 5. the answers, and no one there
-- THE HARD BOUNDARY. Five columns, and the reason each of the absent ones is
-- absent is that it would re-identify: a person or account or auth uid names
-- the respondent outright; a session, enrolment or membership id names them
-- through one join; a client sequence or device field carries a browser; a
-- correlation id carries a request; and a timestamp -- of arrival, of
-- assertion, of anything -- carries the order in which a class answered, which
-- for a teacher watching their own room is a name.
--
-- NO CLIENT GRANT AT ALL, which is stronger than a policy that filters. RLS is
-- enabled as well, so the table is closed twice: a future grant added by
-- accident still returns nothing, and a future policy added by accident still
-- has no grant to act on.
create table public.feedback_responses (
  id            uuid primary key default gen_random_uuid(),
  cycle_id      uuid not null references public.feedback_cycles(id),
  institution_id uuid not null references public.institutions(id),
  question_key  text not null,
  option_key    text not null
);
create index feedback_responses_cycle_idx on public.feedback_responses (cycle_id);
alter table public.feedback_responses enable row level security;

create function public.enforce_feedback_response()
returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare c public.feedback_cycles;
begin
  if tg_op <> 'INSERT' then
    raise exception 'a feedback response is written once: there is nobody to correct it on behalf of';
  end if;
  select * into c from public.feedback_cycles f where f.id = new.cycle_id;
  if c.id is null then
    raise exception 'a feedback response belongs to a cycle';
  end if;
  -- LATE IS REFUSED AT THE TABLE, not only at the endpoint: a response that
  -- arrived after the snapshot was computed would make the snapshot a lie.
  if c.state <> 'OPEN' then
    raise exception 'this feedback cycle is closed and accepts no further answers';
  end if;
  -- the tenant is stamped from the cycle, never supplied by a caller
  new.institution_id := c.institution_id;
  if not exists (select 1 from public.feedback_question_options o
                  where o.set_version = c.question_set_version
                    and o.question_key = new.question_key
                    and o.option_key = new.option_key) then
    raise exception 'that is not a question, and an answer to it, that this cycle asked';
  end if;
  return new;
end $$;
revoke all on function public.enforce_feedback_response() from public, anon, authenticated;

create trigger feedback_responses_guard
  before insert or update or delete on public.feedback_responses
  for each row execute function public.enforce_feedback_response();

-- ═══════════════════════════════════════════ 6. the one immutable snapshot
-- Written once, by the close, and never again. A result that could be
-- recomputed would move as later evidence arrived -- and a moving aggregate is
-- a differencing attack with a refresh button.
create table public.feedback_results (
  cycle_id              uuid primary key references public.feedback_cycles(id),
  institution_id        uuid not null references public.institutions(id),
  question_set_version  text not null references public.feedback_question_sets(version),
  threshold_version     text not null references public.feedback_thresholds(version),
  total_responses       integer not null check (total_responses > 0),
  body                  jsonb not null,
  produced_at           timestamptz not null default now()
);
alter table public.feedback_results enable row level security;

create function public.enforce_feedback_result_immutable()
returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  raise exception 'a published feedback result is the record of what a class said: it is never rewritten';
end $$;
revoke all on function public.enforce_feedback_result_immutable() from public, anon, authenticated;

create trigger feedback_results_immutable
  before update or delete on public.feedback_results
  for each row execute function public.enforce_feedback_result_immutable();

-- WHO MAY TRAVEL WITH A LEARNER: nobody here. A cycle is about a class in one
-- school; the answers belong to no person at all and so cannot belong to a
-- person who moves. The platform reference tables above are deliberately not
-- registered, exactly as metric_catalogue, readiness_tiers and
-- question_health_thresholds are not: they carry no institution's records.
insert into public.record_class_registry values
  ('feedback_cycles', 'INSTITUTION_SCOPED',
   'a feedback cycle is about one class in one school and never travels with a learner'),
  ('feedback_opportunities', 'INSTITUTION_SCOPED',
   'who was asked, and whether they answered; it is about a class that existed, not about a person''s record'),
  ('feedback_responses', 'INSTITUTION_SCOPED',
   'anonymous answers about one school''s teaching; they belong to no person and so travel with none'),
  ('feedback_results', 'INSTITUTION_SCOPED',
   'the immutable aggregate a school was given about its own teaching');

-- ═══════════════════════════════════════════ 7. publishing the governed data
create function public.current_feedback_question_set()
returns text
language sql stable security definer set search_path = public, pg_temp as $$
  select s.version from public.feedback_question_sets s
   where s.superseded_by is null
   order by s.published_at desc, s.version desc limit 1
$$;
comment on function public.current_feedback_question_set() is
  'Which governed feedback question set is live. A cycle binds the answer at the moment it opens, so '
  'republishing never changes what an already-collected cycle asked.';
revoke all on function public.current_feedback_question_set() from public, anon, authenticated;

create function public.current_feedback_threshold()
returns text
language sql stable security definer set search_path = public, pg_temp as $$
  select t.version from public.feedback_thresholds t
   where t.superseded_by is null
   order by t.published_at desc, t.version desc limit 1
$$;
comment on function public.current_feedback_threshold() is
  'Which governed anonymity threshold is live. Bound by a cycle at opening, so a later republication '
  'cannot retroactively lower -- or raise -- the promise a class already answered under.';
revoke all on function public.current_feedback_threshold() from public, anon, authenticated;

-- PLATFORM-PUBLISHED, SYSTEM_ADMIN, AUDITED. An institution does not author
-- feedback questions: comparability across a school is the whole reason to ask
-- the same thing, and a per-institution wording is a per-institution study.
create function public.publish_feedback_question_set(p_version text, p_note text, p_questions jsonb)
returns text
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_prev text; v_actor uuid; q jsonb; o jsonb; n_q int := 0; n_o int; i int; j int;
begin
  if not public.is_system_admin() then
    raise exception 'publishing a feedback question set requires SYSTEM_ADMIN';
  end if;
  v_actor := public.current_person_id();
  if p_questions is null or jsonb_typeof(p_questions) <> 'array' or jsonb_array_length(p_questions) = 0 then
    raise exception 'a feedback question set is a non-empty array of questions';
  end if;
  v_prev := public.current_feedback_question_set();

  insert into public.feedback_question_sets (version, note, published_by_person_id)
  values (p_version, p_note, v_actor);

  for i in 0 .. jsonb_array_length(p_questions) - 1 loop
    q := p_questions -> i;
    if q ->> 'question_key' is null or q ->> 'label_key' is null
       or jsonb_typeof(q -> 'options') <> 'array' then
      raise exception 'question %: a key, a label key and an array of options are all required', i + 1;
    end if;
    n_o := jsonb_array_length(q -> 'options');
    -- A "CHOICE" OF ONE IS NOT A CHOICE, and a question nobody can answer two
    -- ways collects nothing while looking like it does.
    if n_o < 2 then
      raise exception 'question % offers % option(s); a closed question offers at least two',
        q ->> 'question_key', n_o;
    end if;
    insert into public.feedback_questions (set_version, question_key, ordinal, label_key)
    values (p_version, q ->> 'question_key', (i + 1)::smallint, q ->> 'label_key');
    for j in 0 .. n_o - 1 loop
      o := (q -> 'options') -> j;
      if o ->> 'option_key' is null or o ->> 'label_key' is null then
        raise exception 'question %, option %: a key and a label key are both required',
          q ->> 'question_key', j + 1;
      end if;
      insert into public.feedback_question_options
        (set_version, question_key, option_key, ordinal, label_key)
      values (p_version, q ->> 'question_key', o ->> 'option_key', (j + 1)::smallint, o ->> 'label_key');
    end loop;
    n_q := n_q + 1;
  end loop;

  if v_prev is not null then
    update public.feedback_question_sets set superseded_by = p_version where version = v_prev;
  end if;

  perform public.audit_write('feedback_question_set.published', 'feedback_question_sets', p_version, null,
    jsonb_build_object('version', p_version, 'supersedes', v_prev, 'questions', n_q, 'note', p_note));
  return p_version;
end $$;
comment on function public.publish_feedback_question_set(text, text, jsonb) is
  'Publishes a governed, versioned, closed-option feedback question set and supersedes the live one. '
  'Carries no correctness, no weight and no free text, and a published set is frozen: a change is a new '
  'version, never an edit.';
revoke all on function public.publish_feedback_question_set(text, text, jsonb) from public, anon, authenticated;
grant execute on function public.publish_feedback_question_set(text, text, jsonb) to authenticated;

insert into public.client_rpc_registry (function_name, exposure, note, authorization_kind, authorization_requirement)
values ('publish_feedback_question_set', 'STAFF',
        'Publishes a governed feedback question set, platform-wide and versioned. SYSTEM_ADMIN only, '
        'checked in the body; audited. A published set is immutable and is retired by supersession.',
        'SYSTEM_ADMIN', null)
on conflict (function_name) do update
   set exposure = excluded.exposure, note = excluded.note,
       authorization_kind = excluded.authorization_kind,
       authorization_requirement = excluded.authorization_requirement;

create function public.publish_feedback_threshold(
  p_version text, p_minimum_responses integer, p_statement_key text, p_note text)
returns text
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_prev text; v_actor uuid;
begin
  if not public.is_system_admin() then
    raise exception 'publishing an anonymity threshold requires SYSTEM_ADMIN';
  end if;
  v_actor := public.current_person_id();
  if p_minimum_responses is null or p_minimum_responses < 1 then
    raise exception 'an anonymity threshold is a positive number of responses';
  end if;
  v_prev := public.current_feedback_threshold();
  insert into public.feedback_thresholds
    (version, minimum_responses, statement_key, note, published_by_person_id)
  values (p_version, p_minimum_responses, p_statement_key, p_note, v_actor);
  if v_prev is not null then
    update public.feedback_thresholds set superseded_by = p_version where version = v_prev;
  end if;
  perform public.audit_write('feedback_threshold.published', 'feedback_thresholds', p_version, null,
    jsonb_build_object('version', p_version, 'supersedes', v_prev,
                       'minimum_responses', p_minimum_responses, 'note', p_note));
  return p_version;
end $$;
comment on function public.publish_feedback_threshold(text, integer, text, text) is
  'Publishes the governed anonymity threshold -- the minimum number of submitted responses below which '
  'a closed cycle is WITHHELD -- and the statement key a reader is given instead of a number. Cycles '
  'bind the version live when they open, so this never changes a promise already made.';
revoke all on function public.publish_feedback_threshold(text, integer, text, text) from public, anon, authenticated;
grant execute on function public.publish_feedback_threshold(text, integer, text, text) to authenticated;

insert into public.client_rpc_registry (function_name, exposure, note, authorization_kind, authorization_requirement)
values ('publish_feedback_threshold', 'STAFF',
        'Publishes the governed anonymity threshold and its suppression statement key. SYSTEM_ADMIN only, '
        'checked in the body; audited. Never applies retroactively: a cycle answers to the version it bound.',
        'SYSTEM_ADMIN', null)
on conflict (function_name) do update
   set exposure = excluded.exposure, note = excluded.note,
       authorization_kind = excluded.authorization_kind,
       authorization_requirement = excluded.authorization_requirement;

-- ══════════════════════════════════════════════ 8. opening a cycle (Management)
create function public.open_feedback_cycle(p_node uuid, p_subject_person_id uuid)
returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_me uuid; n record; v_qs text; v_th text; v_id uuid; v_pd text; n_eligible int;
begin
  v_me := public.current_person_id();
  -- AUTHORIZATION FIRST, AND ONE SENTENCE FOR EVERY WAY OF NOT HAVING IT. A
  -- caller who is not Management over this class learns nothing about whether
  -- the class, or the educator they named, exists.
  if v_me is null or p_node is null or not public.management_scope_over_node(p_node) then
    raise exception 'opening a feedback cycle is for a HEAD_OF_DEPARTMENT or DEAN standing over that class';
  end if;

  select o.id, o.institution_id, o.kind, o.academic_period_id, o.jalur, o.is_active
    into n from public.org_nodes o where o.id = p_node;
  if n.kind <> 'CLASS' then
    raise exception 'a feedback cycle is opened for a CLASS, not a %: PINTAR 4.0 asks a class about its own teaching', n.kind;
  end if;
  if not n.is_active then
    raise exception 'that class is not active';
  end if;
  if n.academic_period_id is null then
    raise exception 'that class is bound to no academic period, so a cycle has no period to belong to';
  end if;

  -- THE ACADEMIC BOUNDARY, THROUGH THE ONLY CONTEXT FACT THE REPOSITORY OWNS.
  -- An org node carries no learning context; a COURSE does (WP6A). So the
  -- question asked is the one that can actually be answered: does any learning
  -- assignment reaching this class -- at it or above it -- bind material that
  -- is not ACADEMIC? Professional development is refused here, by name.
  select c.title into v_pd
    from public.learning_assignments la
    join public.courses c on c.id = la.course_id
   where c.learning_context <> 'ACADEMIC'
     and la.node_id = any (n.jalur)
   limit 1;
  if v_pd is not null then
    raise exception 'that class is reached by professional-development material (%): PINTAR 4.0 feedback is ACADEMIC only', v_pd;
  end if;

  -- THE SUBJECT. Not the caller, and holding the teaching authority the
  -- repository actually records: a live EDUCATOR assignment whose scope
  -- contains this class. Being a head of department over the class is NOT
  -- enough -- Management is who asks, not who is asked about.
  if p_subject_person_id is null then
    raise exception 'a feedback cycle is about a named educator';
  end if;
  if p_subject_person_id = v_me then
    raise exception 'a feedback cycle is opened about someone else: the subject does not operate their own cycle';
  end if;
  if not exists (
    select 1 from public.role_assignments ra
     where ra.person_id = p_subject_person_id
       and ra.role = 'EDUCATOR'
       and ra.revoked_at is null
       and now() >= ra.valid_from and now() < ra.valid_until
       and ra.scope_node_id is not null
       and n.jalur @> array[ra.scope_node_id]) then
    raise exception 'the subject of a feedback cycle holds a live EDUCATOR assignment over that class, and this one does not';
  end if;

  v_qs := public.current_feedback_question_set();
  v_th := public.current_feedback_threshold();
  if v_qs is null then raise exception 'no feedback question set is published'; end if;
  if v_th is null then raise exception 'no anonymity threshold is published'; end if;

  -- ONE PER CLASS, SUBJECT AND PERIOD, refused by name rather than by a raw
  -- constraint violation, because the second attempt is usually a human
  -- wondering where the first one went.
  if exists (select 1 from public.feedback_cycles f
              where f.scope_node_id = p_node
                and f.subject_person_id = p_subject_person_id
                and f.academic_period_id = n.academic_period_id) then
    raise exception 'this class already has a feedback cycle about that educator in this academic period';
  end if;

  insert into public.feedback_cycles
    (institution_id, scope_node_id, academic_period_id, subject_person_id,
     question_set_version, threshold_version, opened_by_person_id)
  values (n.institution_id, p_node, n.academic_period_id, p_subject_person_id, v_qs, v_th, v_me)
  returning feedback_cycles.id into v_id;

  -- ELIGIBILITY, SNAPSHOTTED HERE AND NEVER AGAIN. Who was in the class at
  -- this instant, by the same membership window every other part of PINTAR
  -- reads. A learner who arrives tomorrow was not asked; a learner who leaves
  -- tomorrow was, and their answer -- if they gave one -- stays counted,
  -- because they were there.
  perform set_config('pintar.feedback_opening', v_id::text, true);
  insert into public.feedback_opportunities (cycle_id, person_id)
  select v_id, m.person_id
    from public.members_of_node_at(p_node, now()) m
   where m.person_id <> p_subject_person_id
   on conflict (cycle_id, person_id) do nothing;
  get diagnostics n_eligible = row_count;
  perform set_config('pintar.feedback_opening', '', true);

  -- AUDITED AS AN ACT OF MANAGEMENT, and carrying no count of any kind: not
  -- the eligible population, not a response total, nothing that could become a
  -- timeline in a log an institution's administrator can read.
  perform public.audit_write('feedback_cycle.opened', 'feedback_cycles', v_id::text, n.institution_id,
    jsonb_build_object('scope_node_id', p_node, 'subject_person_id', p_subject_person_id,
                       'academic_period_id', n.academic_period_id,
                       'question_set_version', v_qs, 'threshold_version', v_th));
  return v_id;
end $$;
comment on function public.open_feedback_cycle(uuid, uuid) is
  'Opens the one feedback cycle a class may hold about one educator in one academic period. '
  'HEAD_OF_DEPARTMENT or DEAN over the class; never the subject; CLASS nodes and ACADEMIC material only. '
  'Binds the live question set and anonymity threshold, and snapshots who may answer.';
revoke all on function public.open_feedback_cycle(uuid, uuid) from public, anon, authenticated;
grant execute on function public.open_feedback_cycle(uuid, uuid) to authenticated;

insert into public.client_rpc_registry (function_name, exposure, note, authorization_kind, authorization_requirement)
values ('open_feedback_cycle', 'STAFF',
        'Opens an anonymous student-to-educator feedback cycle for one CLASS about one EDUCATOR in one '
        'academic period. Management authority over the class, never the subject''s own; binds the '
        'governed question set and anonymity threshold; snapshots eligibility at the opening instant.',
        'ROLE_SET', 'HEAD_OF_DEPARTMENT,DEAN')
on conflict (function_name) do update
   set exposure = excluded.exposure, note = excluded.note,
       authorization_kind = excluded.authorization_kind,
       authorization_requirement = excluded.authorization_requirement;

-- ═══════════════════════════════════════════════ 9. submitting (the learner)
-- ONE TRANSACTION, AND THE ONLY PLACE THE TWO HALVES EVER MEET. Inside this
-- function body the person and their answers are both in scope for the length
-- of one statement each; when it commits, nothing that remains joins them.
create function public.submit_feedback(p_cycle uuid, p_answers jsonb)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_me uuid; c public.feedback_cycles; v_bad text; n_expected int; n_given int; n_written int;
begin
  v_me := public.current_person_id();
  if v_me is null then
    raise exception 'answering a feedback cycle requires a signed-in learner';
  end if;

  -- ELIGIBILITY FROM THE SNAPSHOT, NEVER FROM MEMBERSHIP AS IT STANDS NOW.
  -- A learner enrolled into this class after the cycle opened has no row here
  -- and is refused; a learner who has since moved on still has theirs. One
  -- sentence covers "no such cycle" and "not yours", so a stranger cannot use
  -- this endpoint to discover that a class is being asked about its teacher.
  if not exists (select 1 from public.feedback_opportunities o
                  where o.cycle_id = p_cycle and o.person_id = v_me) then
    raise exception 'there is no feedback of yours to give here';
  end if;

  select * into c from public.feedback_cycles f where f.id = p_cycle;
  if c.state <> 'OPEN' then
    raise exception 'this feedback cycle has closed';
  end if;

  -- EXACTLY ONCE, BY LOCK RATHER THAN BY LOOKUP. `where not consumed` is
  -- re-evaluated after the row lock is granted, so a second submission -- a
  -- retry after a lost acknowledgement, a double-click, a second tab
  -- committing concurrently -- matches zero rows and is refused. A check-then-
  -- write would have let two concurrent callers both pass the check.
  update public.feedback_opportunities o
     set consumed = true
   where o.cycle_id = p_cycle and o.person_id = v_me and not o.consumed;
  get diagnostics n_written = row_count;
  if n_written <> 1 then
    raise exception 'you have already answered this feedback cycle';
  end if;

  -- THE WHOLE SHEET OR NONE OF IT. A half-answered questionnaire would make
  -- the published marginals disagree with each other about how many people
  -- answered, and "how many answered THIS question" is a per-question count
  -- nobody asked for.
  if p_answers is null or jsonb_typeof(p_answers) <> 'object' then
    raise exception 'an answer sheet is one option per question';
  end if;
  select count(*) into n_expected from public.feedback_questions q
   where q.set_version = c.question_set_version;
  select count(*) into n_given from jsonb_object_keys(p_answers) k;

  select string_agg(k, ', ') into v_bad from jsonb_object_keys(p_answers) k
   where not exists (select 1 from public.feedback_questions q
                      where q.set_version = c.question_set_version and q.question_key = k);
  if v_bad is not null then
    raise exception 'this feedback cycle asks no such question: %', v_bad;
  end if;
  if n_given <> n_expected then
    raise exception 'a feedback sheet is answered whole: % of % question(s) answered', n_given, n_expected;
  end if;
  select string_agg(k, ', ') into v_bad from jsonb_object_keys(p_answers) k
   where jsonb_typeof(p_answers -> k) <> 'string'
      or not exists (select 1 from public.feedback_question_options o
                      where o.set_version = c.question_set_version
                        and o.question_key = k and o.option_key = p_answers ->> k);
  if v_bad is not null then
    raise exception 'that is not one of the offered answers: %', v_bad;
  end if;

  -- THE ANSWERS, CARRYING NOBODY. Written in question-key order, which is the
  -- same order for every respondent, so not even the shape of one sheet
  -- differs from another's.
  insert into public.feedback_responses (cycle_id, institution_id, question_key, option_key)
  select p_cycle, c.institution_id, k, p_answers ->> k
    from jsonb_object_keys(p_answers) k
   order by k;
  get diagnostics n_written = row_count;

  -- AND NO AUDIT ROW. Every other mutating endpoint in PINTAR writes one, and
  -- audit_write derives the actor from auth.uid(): here that row would be the
  -- respondent, timestamped, beside the answers it accompanied -- the exact
  -- pair this whole design exists to make impossible. The cycle's opening and
  -- closing are audited instead, which is where accountability actually lives.
  return jsonb_build_object('outcome', 'recorded', 'answers', n_written);
end $$;
comment on function public.submit_feedback(uuid, jsonb) is
  'Answers one feedback cycle, once, anonymously. Consumes the caller''s own eligibility row and writes '
  'person-free responses in the same transaction; writes no audit row, because an audit row here would '
  'be the respondent standing next to their answers.';
revoke all on function public.submit_feedback(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.submit_feedback(uuid, jsonb) to authenticated;

insert into public.client_rpc_registry (function_name, exposure, note)
values ('submit_feedback', 'LEARNER',
        'One atomic anonymous submission: the caller''s own eligibility is consumed and the answers are '
        'written with no person, no session and no timestamp. Exactly once per cycle, enforced by row '
        'lock, so a retry or a double-click cannot produce a second sheet.')
on conflict (function_name) do update
   set exposure = excluded.exposure, note = excluded.note;

-- ════════════════════════════════════════════ 10. closing, counting, freezing
create function public.close_feedback_cycle(p_cycle uuid)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  c public.feedback_cycles; v_me uuid; v_min int; v_statement text;
  n_responses int; v_body jsonb; v_to public.feedback_cycle_state;
begin
  v_me := public.current_person_id();
  select * into c from public.feedback_cycles f where f.id = p_cycle for update;
  -- Unknown cycle and out-of-scope cycle refuse identically: the existence of
  -- a cycle is not something a stranger learns from trying to close one.
  if v_me is null or c.id is null or not public.management_scope_over_node(c.scope_node_id) then
    raise exception 'closing a feedback cycle is for a HEAD_OF_DEPARTMENT or DEAN standing over that class';
  end if;
  if c.subject_person_id = v_me then
    raise exception 'the subject of a feedback cycle does not close their own cycle';
  end if;
  if c.state <> 'OPEN' then
    raise exception 'this feedback cycle is already % and does not reopen', c.state;
  end if;

  -- THE BOUND VERSION, NOT THE LIVE ONE, and no number of its own anywhere in
  -- this function: the threshold is data that was fixed when the class was
  -- asked.
  select t.minimum_responses, t.statement_key into v_min, v_statement
    from public.feedback_thresholds t where t.version = c.threshold_version;
  if v_min is null then
    raise exception 'the anonymity threshold this cycle bound (%) is gone', c.threshold_version;
  end if;

  -- COUNTED FROM THE IDENTITY SIDE, which is the side that knows how many
  -- PEOPLE answered. Counting response rows would count answers, and a
  -- half-written sheet cannot exist, but the count that matters for anonymity
  -- is people.
  select count(*) into n_responses from public.feedback_opportunities o
   where o.cycle_id = p_cycle and o.consumed;

  if n_responses < v_min then
    v_to := 'WITHHELD';
    update public.feedback_cycles
       set state = v_to, closed_at = now(), closed_by_person_id = v_me
     where feedback_cycles.id = p_cycle;
    -- NOTHING NUMERIC IS WRITTEN, ANYWHERE. No result row, no count on the
    -- cycle, no count in the audit trail and no count in this return value.
    -- What was said stays in feedback_responses, unreadable and unaggregated,
    -- because deleting it would be a second decision nobody made.
  else
    v_to := 'PUBLISHED';
    -- PER-QUESTION MARGINALS AND THE FINAL TOTAL. Every declared option
    -- appears, including the ones nobody chose: an omitted zero is still a
    -- number a reader can derive, and printing it is the honest form.
    -- No joint distribution is computed and none could be: a sheet is not
    -- reconstructible from rows that carry no respondent.
    select jsonb_agg(e order by e ->> 'ordinal') into v_body
      from (
        select jsonb_build_object(
                 'question_key', q.question_key,
                 'label_key', q.label_key,
                 'ordinal', q.ordinal,
                 'options', (
                   select jsonb_agg(jsonb_build_object(
                            'option_key', o.option_key,
                            'label_key', o.label_key,
                            'ordinal', o.ordinal,
                            'responses', (select count(*) from public.feedback_responses r
                                           where r.cycle_id = p_cycle
                                             and r.question_key = q.question_key
                                             and r.option_key = o.option_key))
                          order by o.ordinal)
                     from public.feedback_question_options o
                    where o.set_version = c.question_set_version
                      and o.question_key = q.question_key)) as e
          from public.feedback_questions q
         where q.set_version = c.question_set_version) s;

    insert into public.feedback_results
      (cycle_id, institution_id, question_set_version, threshold_version, total_responses, body)
    values (p_cycle, c.institution_id, c.question_set_version, c.threshold_version, n_responses,
            jsonb_build_object('entries', coalesce(v_body, '[]'::jsonb)));

    update public.feedback_cycles
       set state = v_to, closed_at = now(), closed_by_person_id = v_me
     where feedback_cycles.id = p_cycle;
  end if;

  -- AUDITED AS A MANAGEMENT ACT AND AS A TRANSITION, carrying no count on
  -- either path. WITHHELD does say that the threshold was not met -- that is
  -- the ruled disclosure, and it is a bound, not a number.
  perform public.audit_write('feedback_cycle.closed', 'feedback_cycles', p_cycle::text, c.institution_id,
    jsonb_build_object('scope_node_id', c.scope_node_id, 'subject_person_id', c.subject_person_id,
                       'from_state', 'OPEN', 'to_state', v_to,
                       'question_set_version', c.question_set_version,
                       'threshold_version', c.threshold_version));

  -- THE CLOSER IS TOLD THE STATE, NOT THE FIGURES. Management reads results
  -- through the one governed reader, so there is exactly one path to a number
  -- and exactly one place that decides whether a reader may have it.
  return jsonb_build_object(
    'cycle_id', p_cycle,
    'state', v_to,
    'statement_key', case when v_to = 'WITHHELD' then v_statement else null end);
end $$;
comment on function public.close_feedback_cycle(uuid) is
  'Closes a feedback cycle, terminally. Counts consumed submissions against the threshold version the '
  'cycle bound, then either writes one immutable snapshot of per-question marginals (PUBLISHED) or '
  'writes no number at all (WITHHELD). Neither state reopens.';
revoke all on function public.close_feedback_cycle(uuid) from public, anon, authenticated;
grant execute on function public.close_feedback_cycle(uuid) to authenticated;

insert into public.client_rpc_registry (function_name, exposure, note, authorization_kind, authorization_requirement)
values ('close_feedback_cycle', 'STAFF',
        'Closes a feedback cycle and decides, once, whether it can be shown: at or above the bound '
        'anonymity threshold it publishes one immutable aggregate snapshot, below it the cycle becomes '
        'WITHHELD and no numeric result is written now or ever. Terminal either way.',
        'ROLE_SET', 'HEAD_OF_DEPARTMENT,DEAN')
on conflict (function_name) do update
   set exposure = excluded.exposure, note = excluded.note,
       authorization_kind = excluded.authorization_kind,
       authorization_requirement = excluded.authorization_requirement;

-- ══════════════════════════════════════════════════════ 11. the three readers
-- A LEARNER SEES THEIR OWN CYCLES AND THEIR OWN STATE. Not who else was asked,
-- not how many have answered, and not what any of them said. Only OPEN cycles
-- appear: once a cycle closes there is nothing here for a learner to do, and
-- showing them WITHHELD would tell a member of the class something about how
-- many of their classmates answered.
create function public.my_feedback_cycles()
returns table (cycle_id uuid, class_node_id uuid, class_name text,
               subject_person_id uuid, subject_name text, already_answered boolean)
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_me uuid;
begin
  v_me := public.current_person_id();
  if v_me is null then return; end if;
  return query
    select c.id, c.scope_node_id, n.name, c.subject_person_id, p.display_name, o.consumed
      from public.feedback_opportunities o
      join public.feedback_cycles c on c.id = o.cycle_id
      join public.org_nodes n on n.id = c.scope_node_id
      join public.persons p on p.id = c.subject_person_id
     where o.person_id = v_me and c.state = 'OPEN'
     order by n.name, p.display_name;
end $$;
comment on function public.my_feedback_cycles() is
  'The open feedback cycles the caller was asked to answer, and whether they already have. Takes no '
  'person: the person is the session. Shows no other learner and no count of any kind.';
revoke all on function public.my_feedback_cycles() from public, anon, authenticated;
grant execute on function public.my_feedback_cycles() to authenticated;

insert into public.client_rpc_registry (function_name, exposure, note)
values ('my_feedback_cycles', 'LEARNER',
        'The caller''s own open feedback cycles and their own answered/not-answered state. No peer, no '
        'participation list and no response count.')
on conflict (function_name) do update set exposure = excluded.exposure, note = excluded.note;

create function public.feedback_questionnaire(p_cycle uuid)
returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_me uuid; c public.feedback_cycles; v_consumed boolean; v_questions jsonb;
begin
  v_me := public.current_person_id();
  select o.consumed into v_consumed from public.feedback_opportunities o
   where o.cycle_id = p_cycle and o.person_id = v_me;
  if v_me is null or v_consumed is null then
    raise exception 'there is no feedback of yours to give here';
  end if;
  select * into c from public.feedback_cycles f where f.id = p_cycle;
  if c.state <> 'OPEN' then
    raise exception 'this feedback cycle has closed';
  end if;
  select jsonb_agg(e order by e ->> 'ordinal') into v_questions
    from (
      select jsonb_build_object(
               'question_key', q.question_key, 'label_key', q.label_key, 'ordinal', q.ordinal,
               'options', (select jsonb_agg(jsonb_build_object(
                                    'option_key', o.option_key, 'label_key', o.label_key,
                                    'ordinal', o.ordinal) order by o.ordinal)
                             from public.feedback_question_options o
                            where o.set_version = c.question_set_version
                              and o.question_key = q.question_key)) as e
        from public.feedback_questions q
       where q.set_version = c.question_set_version) s;
  return jsonb_build_object(
    'cycle_id', c.id,
    'class_name', (select n.name from public.org_nodes n where n.id = c.scope_node_id),
    'subject_person_id', c.subject_person_id,
    'subject_name', (select p.display_name from public.persons p where p.id = c.subject_person_id),
    'question_set_version', c.question_set_version,
    'already_answered', v_consumed,
    'questions', coalesce(v_questions, '[]'::jsonb));
end $$;
comment on function public.feedback_questionnaire(uuid) is
  'The governed questions and closed options one eligible learner is being asked, as keys the '
  'localization layer renders. Refuses anyone the cycle did not ask, in the same words it uses for a '
  'cycle that does not exist.';
revoke all on function public.feedback_questionnaire(uuid) from public, anon, authenticated;
grant execute on function public.feedback_questionnaire(uuid) to authenticated;

insert into public.client_rpc_registry (function_name, exposure, note)
values ('feedback_questionnaire', 'LEARNER',
        'What an eligible learner is being asked, in localization keys. Carries no other learner''s state '
        'and no aggregate.')
on conflict (function_name) do update set exposure = excluded.exposure, note = excluded.note;

-- THE ONE PATH FROM A CYCLE TO A NUMBER. The subject of the cycle, or
-- Management over its class. An institution's administrator is neither, and
-- WP7 gives them nothing here: administering a school is not being told what
-- its children said about a named teacher.
create function public.feedback_result(p_cycle uuid)
returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_me uuid; c public.feedback_cycles; r public.feedback_results; v_statement text;
begin
  v_me := public.current_person_id();
  select * into c from public.feedback_cycles f where f.id = p_cycle;
  if v_me is null or c.id is null
     or not (c.subject_person_id = v_me or public.management_scope_over_node(c.scope_node_id)) then
    raise exception 'that feedback cycle is not yours to read';
  end if;

  if c.state = 'OPEN' then
    -- NO LIVE AGGREGATE, AND NO COUNT TOWARDS ONE. A reader watching a cycle
    -- fill up is a reader differencing it.
    return jsonb_build_object('cycle_id', c.id, 'state', 'OPEN',
                              'statement_key', 'umpanbalik.hasil.belum_ditutup');
  end if;

  if c.state = 'WITHHELD' then
    select t.statement_key into v_statement from public.feedback_thresholds t
     where t.version = c.threshold_version;
    -- THE WHOLE ANSWER. No have, no needed, no total, no distribution, no
    -- percentage -- the sentence, and the fact that there is nothing else.
    return jsonb_build_object('cycle_id', c.id, 'state', 'WITHHELD', 'statement_key', v_statement);
  end if;

  select * into r from public.feedback_results f where f.cycle_id = p_cycle;
  return jsonb_build_object(
    'cycle_id', c.id, 'state', 'PUBLISHED',
    'question_set_version', r.question_set_version,
    'threshold_version', r.threshold_version,
    'total_responses', r.total_responses,
    'produced_at', r.produced_at,
    'entries', r.body -> 'entries');
end $$;
comment on function public.feedback_result(uuid) is
  'The only path from a feedback cycle to a number. Returns the immutable published snapshot -- '
  'per-question marginals and the final total -- to the cycle''s subject or to Management over its '
  'class, and to everyone else, in every other state, a statement key and nothing numeric at all.';
revoke all on function public.feedback_result(uuid) from public, anon, authenticated;
grant execute on function public.feedback_result(uuid) to authenticated;

insert into public.client_rpc_registry (function_name, exposure, note)
values ('feedback_result', 'STAFF',
        'The published aggregate of one feedback cycle, for its subject educator or for Management over '
        'its class. Withholds every number while the cycle is open and forever if it closed below the '
        'anonymity threshold, returning a statement key in its place.')
on conflict (function_name) do update set exposure = excluded.exposure, note = excluded.note;

-- ═══════════════════════════════════ 12. the boundary, asserted continuously
-- WHAT THIS PROTECTS, AND FROM WHOM. Not "no table called feedback appears
-- somewhere" -- that is a name search, and a name search is satisfied by
-- renaming. It names the CONSUMERS: the functions that turn records into
-- numbers, verdicts and credentials. If any of them learns to read a feedback
-- relation, feedback has become evidence about a person, and this fails.
create function public.assert_feedback_is_not_evidence()
returns table (ok boolean, detail text)
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare
  problems text[] := '{}'; bad text; n int;
  v_consumers text[]; v_rel text[]; n_rel int; n_consumers int;
begin
  select array(select c.relname::text from pg_class c
                 join pg_namespace ns on ns.oid = c.relnamespace
                where ns.nspname = 'public' and c.relkind in ('r','v','m')
                  and c.relname like 'feedback\_%')
    into v_rel;
  n_rel := coalesce(cardinality(v_rel), 0);
  -- VACUITY GUARDS, both ways. An assertion over no relations, or over no
  -- consumers, passes while measuring nothing -- the failure this build has
  -- repaired more than once.
  if n_rel = 0 then
    problems := problems || 'there are no feedback relations: this assertion is measuring nothing'::text;
  end if;

  select array(
    select p.proname::text from pg_proc p
     where p.pronamespace = 'public'::regnamespace
       and (p.proname = any (array[
              'grade_response','evaluate_session','finalize_session','session_final_responses',
              'session_outcome','session_review','reading_map','learning_delta','assemble_session',
              'recompute_result','metric_evaluate','generate_report','certificate_eligibility',
              'certificate_prepare','verify_certificate','derive_evidence_class',
              'effective_evidence_class','recompute_question_health','record_integrity_signal',
              'management_learner_detail','advance_briefing','sanitized_item','session_paper'])
         or p.proname like 'calc\_%'))
    into v_consumers;
  n_consumers := coalesce(cardinality(v_consumers), 0);
  if n_consumers < 20 then
    problems := problems || format('the evidence-consumer set has collapsed to %s function(s): this '
                                || 'assertion would pass over almost nothing', n_consumers);
  end if;

  -- 1. NO CONSUMER READS FEEDBACK. Comments stripped first (L4): a consumer
  --    that merely EXPLAINS why it does not read feedback must not be caught,
  --    and one that reads it must not escape by explaining.
  select string_agg(p.proname, ', ') into bad
    from pg_proc p
   where p.pronamespace = 'public'::regnamespace and p.proname = any (v_consumers)
     and regexp_replace(regexp_replace(coalesce(p.prosrc,''), '/\*.*?\*/', ' ', 'gs'),
                        '--[^\n]*', ' ', 'g') ~* '\yfeedback_[a-z_]+\y';
  if bad is not null then
    problems := problems || ('evidence consumer(s) reading feedback: ' || bad);
  end if;

  -- 2. no view anywhere in public is built over a feedback relation, which is
  --    how a consumer would reach one without naming it
  select string_agg(distinct dep.relname, ', ') into bad
    from pg_depend d
    join pg_rewrite rw on rw.oid = d.objid
    join pg_class dep on dep.oid = rw.ev_class
    join pg_class ref on ref.oid = d.refobjid
   where ref.relname = any (v_rel) and not (dep.relname = any (v_rel))
     and dep.relnamespace::regnamespace::text = 'public';
  if bad is not null then problems := problems || ('view(s) built over feedback: ' || bad); end if;

  -- 3. not a metric source and not a calculator's subject: assert_metric_closure
  --    refuses a calculator that reaches for an undeclared relation, so staying
  --    out of this table is what keeps feedback out of every report
  select string_agg(source_relation, ', ') into bad from public.metric_sources
   where source_relation = any (v_rel);
  if bad is not null then problems := problems || ('feedback declared as a metric source: ' || bad); end if;

  -- 4. THE RESPONSE TABLE CARRIES NOBODY AND NO CLOCK. Matched on column name,
  --    which is the shape a re-identifying column actually arrives in.
  select string_agg(column_name, ', ') into bad from information_schema.columns
   where table_schema = 'public' and table_name = 'feedback_responses'
     and (column_name ~* '(person|account|auth|user|session|enrol|enroll|member|client|device|correlat|request|ip_|agent)'
       or column_name ~* '(_at|_time|timestamp|seq)$'
       or data_type like 'timestamp%');
  if bad is not null then
    problems := problems || ('feedback_responses carries a re-identifying column: ' || bad);
  end if;

  -- 5. and no client role can read it, by grant or by policy
  select string_agg(grantee || ':' || privilege_type, ', ') into bad
    from information_schema.role_table_grants
   where table_schema = 'public' and table_name in ('feedback_responses','feedback_results')
     and grantee in ('anon','authenticated');
  if bad is not null then
    problems := problems || ('a client role holds a grant on raw feedback: ' || bad);
  end if;
  select string_agg(c.relname, ', ') into bad from pg_class c
    join pg_namespace ns on ns.oid = c.relnamespace
   where ns.nspname = 'public' and c.relname = any (v_rel)
     and c.relkind = 'r' and not c.relrowsecurity;
  if bad is not null then problems := problems || ('feedback relation(s) without RLS: ' || bad); end if;
  select string_agg(grantee || ':' || table_name, ', ') into bad
    from information_schema.role_table_grants
   where table_schema = 'public' and table_name = any (v_rel)
     and grantee in ('anon','authenticated') and privilege_type <> 'SELECT';
  if bad is not null then
    problems := problems || ('a client role holds a write grant on feedback: ' || bad);
  end if;

  -- 6. SUBMISSION WRITES NO AUDIT ROW. audit_write derives the actor from
  --    auth.uid(), so an audit row inside the submission path is the
  --    respondent recorded beside their answers, at a time, in a log an
  --    institution's administrator can read.
  if regexp_replace(regexp_replace(
         coalesce((select p.prosrc from pg_proc p
                    where p.pronamespace='public'::regnamespace and p.proname='submit_feedback'), ''),
         '/\*.*?\*/', ' ', 'gs'), '--[^\n]*', ' ', 'g') ~* '\yaudit_write\s*\(' then
    problems := problems || 'submit_feedback writes an audit row: the respondent is recorded beside their answers'::text;
  end if;

  -- 7. nothing about feedback travels with a learner
  select string_agg(table_name, ', ') into bad from public.record_class_registry
   where table_name = any (v_rel) and portability <> 'INSTITUTION_SCOPED';
  if bad is not null then problems := problems || ('feedback declared portable: ' || bad); end if;

  ok := array_length(problems, 1) is null;
  select count(*) into n from public.feedback_cycles;
  detail := case when ok then format(
      'feedback is not evidence: %s feedback relation(s), none of them read by any of the %s evidence '
      || 'consumer(s) named here, none exposed through a view, none declared a metric source and none '
      || 'portable; feedback_responses carries no person, account, session, enrolment, membership, '
      || 'client, device or correlation column and no clock at all; no client role may read the raw '
      || 'answers or the snapshots; and the submission path writes no audit row (%s cycle(s) in this '
      || 'database)', n_rel, n_consumers, n)
    else array_to_string(problems, '; ') end;
  return next;
end $$;
comment on function public.assert_feedback_is_not_evidence() is
  'Feedback is a class speaking about its teaching, not a record about a learner. Names the evidence '
  'consumers and fails if any of them reads a feedback relation; checks the response table carries no '
  'identity and no clock; checks no client can read raw answers; checks submission writes no audit row.';
-- NOT GRANTED TO A CLIENT, exactly like every other assertion in this schema:
-- F06-P08 runs the derived set as the owner, and a client-executable
-- SECURITY DEFINER function with no exposure class is itself a lint failure.
revoke all on function public.assert_feedback_is_not_evidence() from public, anon, authenticated;

-- ═════════════════════════════════════════════════ 13. the v1 governed data
-- SEEDED DIRECTLY, because a migration has no signed-in SYSTEM_ADMIN to be --
-- exactly as metric_catalogue MC-1 was seeded by the migration that created
-- it. Everything after this arrives through publish_feedback_question_set()
-- and publish_feedback_threshold(), and supersedes rather than edits.
--
-- THE QUESTIONS ASK ABOUT TEACHING AS A CLASS EXPERIENCES IT, never about a
-- person: whether explanations land, whether it is safe to say "I don't
-- understand", whether work comes back with something useful on it. The words
-- behind each key belong to the localization layer, so the wording can be
-- corrected without a schema change, and mean the same thing in both
-- interface languages.
insert into public.feedback_question_sets (version, note) values
  ('FQ-1', 'PINTAR 4.0 v1: five governed questions on a four-point frequency scale, closed options, no free text');

insert into public.feedback_questions (set_version, question_key, ordinal, label_key) values
  ('FQ-1', 'penjelasan_jelas',          1, 'umpanbalik.pertanyaan.penjelasan_jelas'),
  ('FQ-1', 'kesempatan_bertanya',       2, 'umpanbalik.pertanyaan.kesempatan_bertanya'),
  ('FQ-1', 'umpan_balik_tugas',         3, 'umpanbalik.pertanyaan.umpan_balik_tugas'),
  ('FQ-1', 'aman_mengaku_belum_paham',  4, 'umpanbalik.pertanyaan.aman_mengaku_belum_paham'),
  ('FQ-1', 'kecepatan_pas',             5, 'umpanbalik.pertanyaan.kecepatan_pas');

insert into public.feedback_question_options (set_version, question_key, option_key, ordinal, label_key)
select 'FQ-1', q.question_key, o.option_key, o.ordinal, 'umpanbalik.pilihan.' || o.option_key
  from public.feedback_questions q
  cross join (values ('jarang', 1::smallint), ('kadang', 2::smallint),
                     ('sering', 3::smallint), ('selalu', 4::smallint)) as o(option_key, ordinal)
 where q.set_version = 'FQ-1';

-- FIVE. The canonical PINTAR 4.0 anonymity threshold, as data and as the only
-- place the number exists. The statement key is what a reader receives instead
-- of any figure when a cycle closes below it; the words behind it, which the
-- localization layer will carry, are "Belum cukup tanggapan untuk menampilkan
-- hasil dengan aman." / "There are not enough responses to display the results
-- safely."
insert into public.feedback_thresholds (version, minimum_responses, statement_key, note) values
  ('FT-1', 5, 'umpanbalik.hasil.belum_cukup_tanggapan',
   'PINTAR 4.0 canonical anonymity threshold: five submitted responses. No non-response margin rule and no unanimous-cell suppression -- unanimity is a recorded, accepted residual.');

-- ---------------------------------------------------------------------------
-- Verification (ADR-0014). Structural first, then the whole product claim
-- driven through the endpoints in a subtransaction that is rolled back.
-- ---------------------------------------------------------------------------
do $$
declare
  bad text; n int; v_src text; v_ok boolean; v_detail text;
  v_inst uuid; v_period uuid; v_fac uuid; v_dep uuid; v_prog uuid; v_coh uuid;
  v_k1 uuid; v_k2 uuid;
  v_hod_u uuid; v_hod uuid; v_e1_u uuid; v_e1 uuid; v_e2_u uuid; v_e2 uuid;
  v_late_u uuid; v_late uuid; v_lrn_u uuid[] := '{}'; v_one uuid; v_person uuid;
  v_cycle_a uuid; v_cycle_b uuid; v_enr uuid; v_sheet jsonb; v_out jsonb;
  v_raised boolean; v_msg text; i int;
begin
  ------------------------------------------------------------------ structural
  -- 1. THE RESPONSE TABLE IS EXACTLY FIVE COLUMNS AND NOT ONE MORE.
  select string_agg(column_name, ', ' order by ordinal_position) into bad
    from information_schema.columns
   where table_schema = 'public' and table_name = 'feedback_responses';
  if bad <> 'id, cycle_id, institution_id, question_key, option_key' then
    raise exception 'feedback_responses is not the five declared columns: %', bad;
  end if;

  -- 2. no client may read the answers or the snapshots, by grant
  select string_agg(grantee || ':' || privilege_type, ', ') into bad
    from information_schema.role_table_grants
   where table_schema = 'public' and table_name in ('feedback_responses', 'feedback_results')
     and grantee in ('anon', 'authenticated');
  if bad is not null then raise exception 'a client role holds a grant on raw feedback: %', bad; end if;

  -- 3. RLS on every feedback table, so a grant added later still returns nothing
  select string_agg(c.relname, ', ') into bad from pg_class c
    join pg_namespace ns on ns.oid = c.relnamespace
   where ns.nspname = 'public' and c.relkind = 'r' and c.relname like 'feedback\_%'
     and not c.relrowsecurity;
  if bad is not null then raise exception 'feedback table(s) without RLS: %', bad; end if;

  -- 4. NO CORRECTNESS, NO SCORE, NO FREE TEXT on the question and answer path.
  select string_agg(table_name || '.' || column_name, ', ') into bad
    from information_schema.columns
   where table_schema = 'public'
     and table_name in ('feedback_responses', 'feedback_questions', 'feedback_question_options')
     and (column_name ~* '(correct|score|mark|grade|weight|difficulty|misconception|mastery|verdict|rank|penalt)'
       or column_name ~* '^(text|body|comment|catatan|komentar|note)$');
  if bad is not null then
    raise exception 'the feedback question path carries a scoring or free-text column: %', bad;
  end if;

  -- 5. THE THRESHOLD IS DATA AND THE CLOSE CARRIES NO NUMBER OF ITS OWN.
  select t.minimum_responses into n from public.feedback_thresholds t where t.version = 'FT-1';
  if n <> 5 then raise exception 'the canonical anonymity threshold is not five, it is %', n; end if;
  if (select statement_key from public.feedback_thresholds where version = 'FT-1')
     <> 'umpanbalik.hasil.belum_cukup_tanggapan' then
    raise exception 'the suppression statement key is not the canonical one';
  end if;
  v_src := regexp_replace(regexp_replace(
             (select p.prosrc from pg_proc p
               where p.pronamespace = 'public'::regnamespace and p.proname = 'close_feedback_cycle'),
             '/\*.*?\*/', ' ', 'gs'), '--[^\n]*', ' ', 'g');
  if v_src ~ '[0-9]' then
    raise exception 'close_feedback_cycle contains a numeric literal: the threshold must be read, never written';
  end if;
  if v_src !~ 'minimum_responses' then
    raise exception 'close_feedback_cycle does not read the governed minimum at all';
  end if;

  -- 6. NEITHER TERMINAL STATE HAS A WAY BACK.
  select count(*) into n from public.feedback_cycle_transitions;
  if n <> 2 then raise exception 'the cycle state machine has % transitions, expected 2', n; end if;
  select count(*) into n from public.feedback_cycle_transitions where from_state <> 'OPEN';
  if n <> 0 then raise exception 'a feedback cycle can move out of a terminal state'; end if;

  -- 7. THE SUBJECT CANNOT BE THE OPENER, in the table and not only in the code.
  select count(*) into n from pg_constraint
   where conname = 'feedback_cycles_subject_is_not_the_opener';
  if n <> 1 then raise exception 'nothing stops an educator opening their own feedback cycle'; end if;

  -- 8. ONLY THE DECLARED ENDPOINTS WRITE FEEDBACK. A sixth function learning
  --    to write one of these tables is how the boundary would actually be lost.
  select string_agg(p.proname, ', ') into bad from pg_proc p
   where p.pronamespace = 'public'::regnamespace and p.prokind = 'f'
     and p.proname not in ('open_feedback_cycle', 'close_feedback_cycle', 'submit_feedback',
                           'publish_feedback_question_set', 'publish_feedback_threshold',
                           'enforce_feedback_cycle', 'enforce_feedback_opportunity',
                           'enforce_feedback_response', 'enforce_feedback_result_immutable',
                           'enforce_feedback_question_set_immutable', 'enforce_feedback_threshold_immutable')
     and regexp_replace(regexp_replace(coalesce(p.prosrc, ''), '/\*.*?\*/', ' ', 'gs'), '--[^\n]*', ' ', 'g')
         ~* '(insert\s+into|update)\s+public\.feedback_';
  if bad is not null then
    raise exception 'something other than the declared endpoints writes feedback: %', bad;
  end if;

  -- 9. and the standing assertion holds in the database it was just created in
  select a.ok, a.detail into v_ok, v_detail from public.assert_feedback_is_not_evidence() a;
  if not v_ok then raise exception 'assert_feedback_is_not_evidence: %', v_detail; end if;

  ----------------------------------------------------------------- behavioural
  -- A MIGRATION RUNS BEFORE THE SEEDS, so the probe builds its own school: two
  -- classes under one department, an educator over each, a head of department
  -- over both, and enough learners in one of them to cross the threshold and
  -- too few in the other. Every row is rolled back.
  begin
    perform set_config('app.seed_intent', 'synthetic', true);
    insert into public.institutions (name, slug, is_synthetic, is_active)
    values ('probe 0103 school', 'probe-0103-school', true, true) returning id into v_inst;
    insert into public.academic_periods (institution_id, name, starts_on, ends_on)
    values (v_inst, '2026/2027', current_date - 30, current_date + 300) returning id into v_period;
    insert into public.org_nodes (institution_id, parent_id, kind, name)
    values (v_inst, v_inst, 'FACULTY', 'F') returning id into v_fac;
    insert into public.org_nodes (institution_id, parent_id, kind, name)
    values (v_inst, v_fac, 'DEPARTMENT', 'D') returning id into v_dep;
    insert into public.org_nodes (institution_id, parent_id, kind, name)
    values (v_inst, v_dep, 'PROGRAMME', 'P') returning id into v_prog;
    insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
    values (v_inst, v_prog, 'COHORT', 'C', v_period) returning id into v_coh;
    insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
    values (v_inst, v_coh, 'CLASS', 'K1', v_period) returning id into v_k1;
    insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
    values (v_inst, v_coh, 'CLASS', 'K2', v_period) returning id into v_k2;

    insert into auth.users (id, email) values (gen_random_uuid(), 'probe-0103-kaprodi@local.invalid')
    returning id into v_hod_u;
    insert into auth.users (id, email) values (gen_random_uuid(), 'probe-0103-guru1@local.invalid')
    returning id into v_e1_u;
    insert into auth.users (id, email) values (gen_random_uuid(), 'probe-0103-guru2@local.invalid')
    returning id into v_e2_u;
    insert into auth.users (id, email) values (gen_random_uuid(), 'probe-0103-telat@local.invalid')
    returning id into v_late_u;
    select a.person_id into v_hod  from public.accounts a where a.auth_user_id = v_hod_u;
    select a.person_id into v_e1   from public.accounts a where a.auth_user_id = v_e1_u;
    select a.person_id into v_e2   from public.accounts a where a.auth_user_id = v_e2_u;
    select a.person_id into v_late from public.accounts a where a.auth_user_id = v_late_u;
    insert into public.role_assignments (person_id, role, scope_node_id, valid_from, valid_until)
    values (v_hod, 'HEAD_OF_DEPARTMENT', v_dep, now() - interval '1 day', now() + interval '365 days'),
           (v_e1,  'EDUCATOR',           v_k1,  now() - interval '1 day', now() + interval '365 days'),
           (v_e2,  'EDUCATOR',           v_k2,  now() - interval '1 day', now() + interval '365 days');

    -- seven learners who can sign in (five in K1, two in K2) and two who
    -- cannot: eligibility is a membership, not an account.
    for i in 1..7 loop
      insert into auth.users (id, email)
      values (gen_random_uuid(), 'probe-0103-murid' || i || '@local.invalid')
      returning id into v_one;
      v_lrn_u := v_lrn_u || v_one;
      select a.person_id into v_person from public.accounts a where a.auth_user_id = v_one;
      insert into public.enrollments (person_id, institution_id, academic_period_id, status)
      values (v_person, v_inst, v_period, 'ACTIVE') returning id into v_enr;
      insert into public.memberships (enrollment_id, node_id, academic_period_id)
      values (v_enr, case when i <= 5 then v_k1 else v_k2 end, v_period);
    end loop;
    for i in 8..9 loop
      insert into public.persons (display_name) values ('Murid diam ' || i) returning id into v_person;
      insert into public.enrollments (person_id, institution_id, academic_period_id, status)
      values (v_person, v_inst, v_period, 'ACTIVE') returning id into v_enr;
      insert into public.memberships (enrollment_id, node_id, academic_period_id)
      values (v_enr, case when i = 8 then v_k1 else v_k2 end, v_period);
    end loop;
    perform set_config('app.seed_intent', '', true);

    -- (1) THE SUBJECT CANNOT OPEN THEIR OWN CYCLE, and the refusal is about
    --     Management authority rather than about being the subject: an
    --     EDUCATOR holds CAN_ASSIGN_LEARNING, which is precisely why that
    --     capability was not used as the gate.
    perform set_config('request.jwt.claims',
      json_build_object('sub', v_e1_u, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', v_e1_u::text, true);
    v_raised := false;
    begin
      perform public.open_feedback_cycle(v_k1, v_e1);
    exception when others then v_raised := true; v_msg := sqlerrm; end;
    if not v_raised then raise exception 'an educator opened a feedback cycle about themselves'; end if;
    if v_msg !~ 'HEAD_OF_DEPARTMENT' then
      raise exception 'the subject was refused for the wrong reason: %', v_msg;
    end if;

    -- (2) MANAGEMENT OPENS IT, and eligibility is snapshotted to the class as
    --     it stands at this instant -- six learners, one of whom has no
    --     account and will never answer.
    perform set_config('request.jwt.claims',
      json_build_object('sub', v_hod_u, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', v_hod_u::text, true);
    v_cycle_a := public.open_feedback_cycle(v_k1, v_e1);
    select count(*) into n from public.feedback_opportunities where cycle_id = v_cycle_a;
    if n <> 6 then raise exception 'the eligibility snapshot holds % learner(s), expected 6', n; end if;
    select count(*) into n from public.feedback_opportunities where cycle_id = v_cycle_a and consumed;
    if n <> 0 then raise exception 'a cycle opened with someone already counted as having answered'; end if;

    -- (3) NOTHING NUMERIC EXISTS WHILE IT IS OPEN, not even to the head of
    --     department who opened it.
    v_out := public.feedback_result(v_cycle_a);
    if v_out ->> 'state' <> 'OPEN' or v_out ? 'total_responses' or v_out ? 'entries' then
      raise exception 'an open cycle handed a reader a figure: %', v_out;
    end if;

    -- (4) A LEARNER WHO ARRIVES AFTER THE OPENING WAS NOT ASKED. This is the
    --     whole of "eligibility is a snapshot": the row does not exist, so the
    --     endpoint has nothing to consume.
    perform set_config('app.seed_intent', 'synthetic', true);
    insert into public.enrollments (person_id, institution_id, academic_period_id, status)
    values (v_late, v_inst, v_period, 'ACTIVE') returning id into v_enr;
    insert into public.memberships (enrollment_id, node_id, academic_period_id)
    values (v_enr, v_k1, v_period);
    perform set_config('app.seed_intent', '', true);
    select count(*) into n from public.feedback_opportunities
     where cycle_id = v_cycle_a and person_id = v_late;
    if n <> 0 then raise exception 'a learner enrolled after the opening entered the snapshot'; end if;
    perform set_config('request.jwt.claims',
      json_build_object('sub', v_late_u, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', v_late_u::text, true);
    v_raised := false;
    begin
      select jsonb_object_agg(q.question_key, 'sering') into v_sheet
        from public.feedback_questions q where q.set_version = 'FQ-1';
      perform public.submit_feedback(v_cycle_a, v_sheet);
    exception when others then v_raised := true; end;
    if not v_raised then raise exception 'a learner who arrived after the opening answered anyway'; end if;

    -- (5) FIVE LEARNERS ANSWER, EACH EXACTLY ONCE.
    for i in 1..5 loop
      perform set_config('request.jwt.claims',
        json_build_object('sub', v_lrn_u[i], 'role', 'authenticated')::text, true);
      perform set_config('request.jwt.claim.sub', v_lrn_u[i]::text, true);
      select jsonb_object_agg(q.question_key, o.option_key) into v_sheet
        from public.feedback_questions q
        join public.feedback_question_options o
          on o.set_version = q.set_version and o.question_key = q.question_key
         and o.ordinal = (((i + q.ordinal) % 4) + 1)::smallint
       where q.set_version = 'FQ-1';
      v_out := public.submit_feedback(v_cycle_a, v_sheet);
      if v_out ->> 'outcome' <> 'recorded' then raise exception 'a valid submission was not recorded'; end if;
      -- the same sheet again, as a retry after a lost acknowledgement would
      v_raised := false;
      begin
        perform public.submit_feedback(v_cycle_a, v_sheet);
      exception when others then v_raised := true; v_msg := sqlerrm; end;
      if not v_raised then raise exception 'a second submission from one learner was accepted'; end if;
      if v_msg !~ 'already answered' then
        raise exception 'the retry was refused for the wrong reason: %', v_msg;
      end if;
    end loop;
    select count(*) into n from public.feedback_opportunities where cycle_id = v_cycle_a and consumed;
    if n <> 5 then raise exception '% learner(s) counted as having answered, expected 5', n; end if;
    select count(*) into n from public.feedback_responses where cycle_id = v_cycle_a;
    if n <> 25 then raise exception '% answer row(s) written, expected 25 (five sheets of five)', n; end if;

    -- (6) STILL NO LIVE AGGREGATE, with every answer in. A reader who could
    --     see the figures now could have watched them arrive one at a time.
    perform set_config('request.jwt.claims',
      json_build_object('sub', v_hod_u, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', v_hod_u::text, true);
    v_out := public.feedback_result(v_cycle_a);
    if v_out ->> 'state' <> 'OPEN' or v_out ? 'total_responses' then
      raise exception 'the figures were readable before the cycle closed: %', v_out;
    end if;
    select count(*) into n from public.feedback_results where cycle_id = v_cycle_a;
    if n <> 0 then raise exception 'a result snapshot existed before the close'; end if;

    -- (7) THE CLOSE PUBLISHES ONE IMMUTABLE SNAPSHOT: per-question marginals
    --     and the final total, and nothing that describes a person.
    v_out := public.close_feedback_cycle(v_cycle_a);
    if v_out ->> 'state' <> 'PUBLISHED' then
      raise exception 'five answers against a threshold of five did not publish: %', v_out;
    end if;
    if v_out ? 'total_responses' then
      raise exception 'the close handed back a figure; results come from one governed reader';
    end if;
    select count(*) into n from public.feedback_results where cycle_id = v_cycle_a;
    if n <> 1 then raise exception 'the close wrote % snapshot(s), expected exactly 1', n; end if;
    v_out := public.feedback_result(v_cycle_a);
    if v_out ->> 'state' <> 'PUBLISHED' or (v_out ->> 'total_responses')::int <> 5 then
      raise exception 'the published snapshot does not say five people answered: %', v_out;
    end if;
    if jsonb_array_length(v_out -> 'entries') <> 5 then
      raise exception 'the snapshot carries % question(s), expected 5', jsonb_array_length(v_out -> 'entries');
    end if;
    -- EVERY QUESTION'S MARGINAL SUMS TO THE TOTAL, which is the shape that
    -- proves these are marginals and not a joint profile: five numbers per
    -- question, summing to five people, with no row describing one sheet.
    select bool_and(x.s = 5) into v_raised from (
      select (select sum((o ->> 'responses')::int) from jsonb_array_elements(e -> 'options') o) as s
        from jsonb_array_elements(v_out -> 'entries') e) x;
    if not coalesce(v_raised, false) then
      raise exception 'a question''s marginal does not sum to the number of respondents: %', v_out;
    end if;
    if v_out::text ~* '(person|murid|respond|sheet|answer_by)' then
      raise exception 'the published snapshot names something about a respondent: %', v_out;
    end if;

    -- (8) THE SNAPSHOT IS THE RECORD, AND IT DOES NOT MOVE. Not by rewrite,
    --     not by a late answer, and not by reopening.
    v_raised := false;
    begin
      update public.feedback_results set total_responses = 99 where cycle_id = v_cycle_a;
    exception when others then v_raised := true; end;
    if not v_raised then raise exception 'a published feedback result was rewritten'; end if;
    v_raised := false;
    begin
      insert into public.feedback_responses (cycle_id, institution_id, question_key, option_key)
      values (v_cycle_a, v_inst, 'penjelasan_jelas', 'selalu');
    exception when others then v_raised := true; end;
    if not v_raised then raise exception 'an answer arrived after the cycle closed'; end if;
    v_raised := false;
    begin
      update public.feedback_cycles set state = 'OPEN' where id = v_cycle_a;
    exception when others then v_raised := true; end;
    if not v_raised then raise exception 'a closed feedback cycle reopened'; end if;

    -- (9) ONE CYCLE PER CLASS, SUBJECT AND PERIOD.
    v_raised := false;
    begin
      perform public.open_feedback_cycle(v_k1, v_e1);
    exception when others then v_raised := true; end;
    if not v_raised then raise exception 'a second cycle opened over the same class, subject and period'; end if;

    -- (10) A COHORT IS NOT A CLASS, AND AN EDUCATOR WHO DOES NOT TEACH THE
    --      CLASS IS NOT ITS SUBJECT.
    v_raised := false;
    begin
      perform public.open_feedback_cycle(v_coh, v_e1);
    exception when others then v_raised := true; v_msg := sqlerrm; end;
    if not v_raised or v_msg !~ 'CLASS' then
      raise exception 'a cohort-wide feedback cycle was opened: %', coalesce(v_msg, '(accepted)');
    end if;
    v_raised := false;
    begin
      perform public.open_feedback_cycle(v_k2, v_e1);
    exception when others then v_raised := true; v_msg := sqlerrm; end;
    if not v_raised or v_msg !~ 'EDUCATOR' then
      raise exception 'a cycle named an educator with no teaching authority over the class: %',
        coalesce(v_msg, '(accepted)');
    end if;

    -- (11) BELOW THE THRESHOLD, THE ANSWER IS A SENTENCE. Two learners answer
    --      in K2, the cycle closes WITHHELD, no snapshot is written, and
    --      neither Management nor the subject is given a number of any kind.
    v_cycle_b := public.open_feedback_cycle(v_k2, v_e2);
    for i in 6..7 loop
      perform set_config('request.jwt.claims',
        json_build_object('sub', v_lrn_u[i], 'role', 'authenticated')::text, true);
      perform set_config('request.jwt.claim.sub', v_lrn_u[i]::text, true);
      select jsonb_object_agg(q.question_key, 'sering') into v_sheet
        from public.feedback_questions q where q.set_version = 'FQ-1';
      perform public.submit_feedback(v_cycle_b, v_sheet);
    end loop;
    perform set_config('request.jwt.claims',
      json_build_object('sub', v_hod_u, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', v_hod_u::text, true);
    v_out := public.close_feedback_cycle(v_cycle_b);
    if v_out ->> 'state' <> 'WITHHELD'
       or v_out ->> 'statement_key' <> 'umpanbalik.hasil.belum_cukup_tanggapan' then
      raise exception 'two answers against a threshold of five did not withhold: %', v_out;
    end if;
    select count(*) into n from public.feedback_results where cycle_id = v_cycle_b;
    if n <> 0 then raise exception 'a withheld cycle wrote a result snapshot'; end if;
    v_out := public.feedback_result(v_cycle_b);
    if v_out ->> 'state' <> 'WITHHELD'
       or v_out ->> 'statement_key' <> 'umpanbalik.hasil.belum_cukup_tanggapan' then
      raise exception 'the withheld reader did not return the canonical statement: %', v_out;
    end if;
    if v_out ? 'total_responses' or v_out ? 'entries' or v_out ? 'have' or v_out ? 'needed'
       or v_out::text ~ '[0-9]+\s*/\s*[0-9]+' then
      raise exception 'a withheld cycle leaked a figure: %', v_out;
    end if;
    -- and the subject of that cycle is told the same thing, no more
    perform set_config('request.jwt.claims',
      json_build_object('sub', v_e2_u, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', v_e2_u::text, true);
    v_out := public.feedback_result(v_cycle_b);
    if v_out ->> 'state' <> 'WITHHELD' or v_out ? 'total_responses' then
      raise exception 'the subject of a withheld cycle was given a figure: %', v_out;
    end if;
    -- (12) AND THE SUBJECT OF ONE CYCLE IS NOT A READER OF ANOTHER.
    v_raised := false;
    begin
      perform public.feedback_result(v_cycle_a);
    exception when others then v_raised := true; end;
    if not v_raised then
      raise exception 'one educator read another educator''s feedback';
    end if;

    perform set_config('request.jwt.claims', '', true);
    perform set_config('request.jwt.claim.sub', '', true);
    raise exception 'WP7B_PROBE_UNDO';
  exception when others then
    perform set_config('app.seed_intent', '', true);
    perform set_config('request.jwt.claims', '', true);
    perform set_config('request.jwt.claim.sub', '', true);
    perform set_config('pintar.feedback_opening', '', true);
    if sqlerrm <> 'WP7B_PROBE_UNDO' then
      raise exception 'WP7B verification failed: %', sqlerrm;
    end if;
  end;
end $$;
