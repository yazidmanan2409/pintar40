-- 0033 — FABLE-03 §3 and §6: the lesson player's server-side state, and
-- hesitation-triggered assistance.
--
-- INV-11, RESTATED SO IT CAN SURVIVE A WRITER. 0024 put telemetry in its own
-- schema and asserted that NOTHING in `public` references it, with one named
-- exception for the write trigger. That was the right rule while nothing
-- produced telemetry. §6 now requires a learner-facing path that RECORDS
-- hesitation and assistance, and PostgREST exposes `public` only, so such a
-- function must live in `public` and must name `telemetry.`.
--
-- The rule is therefore narrowed to what INV-11 actually says -- "never
-- influences scoring" -- in a form that still cannot drift: a function in
-- `public` may WRITE telemetry and may never READ it. A scoring path that
-- cannot read a value cannot be influenced by it, and "no SELECT FROM, no
-- JOIN, no UPDATE, no DELETE, and no dynamic SQL naming the schema" is a
-- property of a function body rather than a list of names somebody maintains.
-- It is strictly stronger than an exception list, because it constrains every
-- future function instead of exempting a chosen few. The view rule is
-- unchanged: no view in public may depend on telemetry at all.
-- assert_telemetry_write_only() below is that rule, callable, and the
-- selftest re-runs it on every build with a planted reader to prove it bites.
--
-- THE HESITATION CLOCK IS THE SERVER'S. doc 07 rejects a client-side timer as
-- spoofable and unable to survive a tab switch. presented_items.presented_at
-- cannot answer it either: the whole paper is written at assembly, so every
-- item would look equally old the moment the session starts. 0030's
-- presented_item_views supplies the missing fact -- when the learner first
-- opened THIS item, stamped by the server -- and the window is read from the
-- session's own definition, never from a constant here (§6: "No constant in
-- code").
--
-- ASSISTANCE IS PROGRESSIVE AND NEVER THE ANSWER. Three levels, each unlocked
-- only after the one before it was opened: the direction of thinking, then the
-- first step, then a worked example from the lesson. Every level is re-checked
-- against hint_reveals_answer_shape() -- FABLE-02's own INV-02 predicate, not
-- a second regex (roadmap §5.4) -- at the moment it is served, so authored
-- text that passed at write time and generated text that never passed anything
-- meet the same gate. The stage is returned as a fact; the 🤔/💡/🧭 copy that
-- wraps it belongs to the Human Language Engine, not to the database.

-- ---------------------------------------------------------------------------
-- 1. Reading progress. Latest value only, and it never regresses (doc 06's
--    lesson_progress_updated; §3).
-- ---------------------------------------------------------------------------
create table public.lesson_progress (
  id                uuid primary key default gen_random_uuid(),
  person_id         uuid not null references public.persons(id),
  lesson_id         uuid not null references public.lessons(id),
  plp_release_id    uuid not null references public.plp_releases(id),
  institution_id    uuid not null references public.institutions(id),
  furthest_position integer not null default 0 check (furthest_position >= 0),
  total_positions   integer check (total_positions is null or total_positions > 0),
  opened_at         timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (person_id, lesson_id, plp_release_id),
  constraint lesson_progress_within_total
    check (total_positions is null or furthest_position <= total_positions)
);
create index lesson_progress_person_idx on public.lesson_progress (person_id, updated_at desc);
alter table public.lesson_progress enable row level security;

create function public.enforce_lesson_progress() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_inst uuid;
begin
  if tg_op = 'INSERT' then
    select l.institution_id into v_inst from public.lessons l where l.id = new.lesson_id;
    if v_inst is null then raise exception 'unknown lesson %', new.lesson_id; end if;
    new.institution_id := v_inst;
    new.opened_at := now();
    new.updated_at := now();
    return new;
  end if;
  if tg_op = 'DELETE' then
    raise exception 'reading progress is a record of what happened; it is not deleted';
  end if;
  if new.person_id is distinct from old.person_id
     or new.lesson_id is distinct from old.lesson_id
     or new.plp_release_id is distinct from old.plp_release_id then
    raise exception 'progress belongs to one learner, one lesson and one release';
  end if;
  -- §3: a later resume never shows less than what was already recorded
  new.furthest_position := greatest(coalesce(new.furthest_position, 0), old.furthest_position);
  new.institution_id := old.institution_id;
  new.opened_at := old.opened_at;
  new.updated_at := now();
  return new;
end $$;
revoke all on function public.enforce_lesson_progress() from public, anon, authenticated;
create trigger lesson_progress_write before insert or update or delete on public.lesson_progress
  for each row execute function public.enforce_lesson_progress();
create trigger lesson_progress_tenant_immutable before update on public.lesson_progress
  for each row execute function public.enforce_record_tenant_immutable();

grant select on public.lesson_progress to authenticated;
create policy lesson_progress_select on public.lesson_progress for select to authenticated
  using (person_id = public.current_person_id()
      or public.can_in_institution('CAN_ASSIGN_LEARNING', institution_id));

insert into public.record_class_registry values
  ('lesson_progress', 'INSTITUTION_SCOPED', 'evidence never travels with a learner');

-- ---------------------------------------------------------------------------
-- 2. What a learner may read, and where they were.
-- ---------------------------------------------------------------------------
create function public.my_learning_assignments()
returns table (learning_assignment_id uuid, course_id uuid, plp_release_id uuid,
               subject text, stage text, grade_label text, title text,
               pre_test_assignment uuid, post_test_assignment uuid)
language sql stable security definer set search_path = public, pg_temp as $$
  select la.id, la.course_id, la.plp_release_id,
         c.subject, c.stage, c.grade_label, c.title,
         (select aa.id from public.assessment_assignments aa
            join public.assessment_definitions d on d.id = aa.assessment_definition_id
           where aa.learning_assignment_id = la.id and d.mode = 'PRE_TEST' limit 1),
         (select aa.id from public.assessment_assignments aa
            join public.assessment_definitions d on d.id = aa.assessment_definition_id
           where aa.learning_assignment_id = la.id and d.mode = 'POST_TEST' limit 1)
    from public.learning_assignments la
    join public.courses c on c.id = la.course_id
   where la.status = 'ACTIVE'
     and exists (select 1 from public.enrollments e
                   join public.memberships m on m.enrollment_id = e.id and m.valid_to is null
                   join public.org_nodes n on n.id = m.node_id
                  where e.person_id = public.current_person_id() and e.status = 'ACTIVE'
                    and (n.id = la.node_id or n.jalur @> array[la.node_id]))
$$;
revoke all on function public.my_learning_assignments() from public, anon;
grant execute on function public.my_learning_assignments() to authenticated, service_role;

-- Lesson prose for an assigned learner, bound to the assignment's release.
-- Nothing belonging to an item ever appears here.
create function public.learner_lessons(p_learning_assignment uuid)
returns table (lesson_id uuid, modul text, urutan smallint, judul text, ringkasan text,
               isi text, contoh jsonb, media jsonb, halaman text,
               furthest_position integer, total_positions integer)
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_la public.learning_assignments;
begin
  select * into v_la from public.learning_assignments la
   where la.id = p_learning_assignment
     and exists (select 1 from public.my_learning_assignments() m
                  where m.learning_assignment_id = la.id);
  if v_la.id is null then raise exception 'this learning assignment is not assigned to you'; end if;
  return query
    select l.id, m.title, l.ordinal, l.title, l.summary, l.body_markdown,
           l.worked_examples, l.media, l.page_citation,
           coalesce(p.furthest_position, 0), p.total_positions
      from public.lessons l
      join public.modules m on m.id = l.module_id
      left join public.lesson_progress p
             on p.lesson_id = l.id and p.plp_release_id = v_la.plp_release_id
            and p.person_id = public.current_person_id()
     where m.course_id = v_la.course_id
     order by m.ordinal, l.ordinal;
end $$;
revoke all on function public.learner_lessons(uuid) from public, anon;
grant execute on function public.learner_lessons(uuid) to authenticated, service_role;

create function public.record_lesson_progress(p_learning_assignment uuid, p_lesson uuid,
                                              p_position integer, p_total integer default null)
returns integer language plpgsql security definer set search_path = public, pg_temp as $$
declare v_person uuid; v_release uuid; v_out integer;
begin
  v_person := public.current_person_id();
  if v_person is null then raise exception 'no person in this session'; end if;
  select m.plp_release_id into v_release from public.my_learning_assignments() m
   where m.learning_assignment_id = p_learning_assignment;
  if v_release is null then raise exception 'this learning assignment is not assigned to you'; end if;
  if not exists (select 1 from public.lessons l join public.modules mo on mo.id = l.module_id
                  where l.id = p_lesson
                    and mo.course_id = (select course_id from public.learning_assignments
                                         where id = p_learning_assignment)) then
    raise exception 'that lesson is not part of this assignment''s course';
  end if;

  insert into public.lesson_progress (person_id, lesson_id, plp_release_id, institution_id,
                                      furthest_position, total_positions)
  values (v_person, p_lesson, v_release, '00000000-0000-0000-0000-000000000000',
          greatest(coalesce(p_position, 0), 0), p_total)
  on conflict (person_id, lesson_id, plp_release_id) do update
    set furthest_position = greatest(public.lesson_progress.furthest_position,
                                     excluded.furthest_position),
        total_positions   = coalesce(excluded.total_positions, public.lesson_progress.total_positions)
  returning furthest_position into v_out;
  return v_out;
end $$;
revoke all on function public.record_lesson_progress(uuid, uuid, integer, integer) from public, anon;
grant execute on function public.record_lesson_progress(uuid, uuid, integer, integer)
  to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 3. The INV-11 rule, restated as a callable assertion.
--
--    It is a function rather than a one-shot block so the selftest can re-run
--    it on every build, and so a planted reader can be used to prove it bites.
--    The trigger that writes the telemetry tables is the one thing that must
--    name the schema on both sides; it is not a scoring path and it is named.
-- ---------------------------------------------------------------------------
create function public.assert_telemetry_write_only()
returns table (ok boolean, detail text)
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare bad text; problems text[] := '{}';
begin
  -- (a) no view in public may depend on telemetry at all
  select string_agg(distinct dep.relname, ', ') into bad
    from pg_depend d
    join pg_rewrite rw on rw.oid = d.objid
    join pg_class dep on dep.oid = rw.ev_class
    join pg_class ref on ref.oid = d.refobjid
    join pg_namespace rns on rns.oid = ref.relnamespace
    join pg_namespace dns on dns.oid = dep.relnamespace
   where rns.nspname = 'telemetry' and dns.nspname = 'public';
  if bad is not null then problems := problems || ('view(s) in public read telemetry: ' || bad); end if;

  -- (b) a function in public may write telemetry and may never read it
  select string_agg(p.proname, ', ') into bad from pg_proc p
    join pg_namespace ns on ns.oid = p.pronamespace
   where ns.nspname = 'public' and p.prokind = 'f'
     and p.proname <> 'enforce_observation_write'         -- the write trigger, named
     and pg_get_functiondef(p.oid) ~* '(\yfrom\s+telemetry\.|\yjoin\s+telemetry\.|\yupdate\s+telemetry\.|\ydelete\s+from\s+telemetry\.)';
  if bad is not null then problems := problems || ('function(s) in public read telemetry: ' || bad); end if;

  -- (c) and may not reach it through dynamic SQL either
  select string_agg(p.proname, ', ') into bad from pg_proc p
    join pg_namespace ns on ns.oid = p.pronamespace
   where ns.nspname = 'public' and p.prokind = 'f'
     and pg_get_functiondef(p.oid) ~* '\yexecute\y'
     and pg_get_functiondef(p.oid) ~* '\ytelemetry\.';
  if bad is not null then problems := problems || ('function(s) reach telemetry dynamically: ' || bad); end if;

  -- (d) no client role touches telemetry, by grant or by schema usage
  select string_agg(g.table_name || '->' || g.grantee, ', ') into bad
    from information_schema.role_table_grants g
   where g.table_schema = 'telemetry' and g.grantee in ('anon','authenticated');
  if bad is not null then problems := problems || ('client grant on telemetry: ' || bad); end if;
  if has_schema_privilege('anon','telemetry','USAGE')
     or has_schema_privilege('authenticated','telemetry','USAGE') then
    problems := problems || 'a client role holds USAGE on the telemetry schema';
  end if;

  ok := array_length(problems, 1) is null;
  -- array_to_string of an empty array is '', not NULL, so coalesce would keep
  -- the empty string and the assertion would report nothing on success
  detail := case when ok
                 then 'telemetry is write-only from public, invisible to clients, and read by no view'
                 else array_to_string(problems, '; ') end;
  return next;
end $$;
revoke all on function public.assert_telemetry_write_only() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. Assistance. The window is the definition's; the clock is the server's.
-- ---------------------------------------------------------------------------
create table public.assistance_levels (
  level      smallint primary key check (level between 1 and 3),
  kode       text not null unique check (btrim(kode) <> ''),
  sumber     text not null check (btrim(sumber) <> '')
);
alter table public.assistance_levels enable row level security;
insert into public.assistance_levels values
  (1, 'ARAH',     'items.arah_berpikir — the principle to think along'),
  (2, 'PETUNJUK', 'items.petunjuk — the first step'),
  (3, 'CONTOH',   'the lesson''s worked example — a full explanation of a different instance');
grant select on public.assistance_levels to authenticated;
create policy assistance_levels_select on public.assistance_levels for select to authenticated
  using (public.current_person_id() is not null);

-- §6 names five telemetry events; 0024's enum carried only the three "opened"
-- kinds, because nothing produced the other two yet. Added additively, with a
-- level column for assistance_level_used. New enum labels are not usable in
-- the transaction that adds them, so nothing below inserts one -- the
-- functions that do are written now and called after this migration commits.
alter type telemetry.assistance_kind add value if not exists 'OFFERED';
alter type telemetry.assistance_kind add value if not exists 'DISMISSED';
alter table telemetry.assistance_events add column if not exists level smallint
  check (level is null or level between 1 and 3);

-- What has already been offered and opened for one delivered item. Level 0 is
-- the offer itself (the window was reached); 1..3 are the levels the learner
-- actually opened. It lives in `public` because the engine reads it to decide
-- what to serve next -- a decision, not a measurement -- while the measurement
-- of that same moment goes to telemetry and is never read again.
create table public.assistance_grants (
  presented_item_id uuid not null references public.presented_items(id),
  session_id        uuid not null references public.assessment_sessions(id),
  level             smallint not null check (level between 0 and 3),
  granted_at        timestamptz not null default now(),
  primary key (presented_item_id, level)
);
alter table public.assistance_grants enable row level security;
grant select on public.assistance_grants to authenticated;
create policy assistance_grants_select on public.assistance_grants for select to authenticated
  using (exists (select 1 from public.assessment_sessions s
                  where s.id = session_id and s.person_id = public.current_person_id()));
insert into public.record_class_registry values
  ('assistance_grants', 'INSTITUTION_SCOPED', 'session-local assistance state, not learner evidence'),
  ('assistance_levels', 'INSTITUTION_SCOPED', 'platform reference data, not learner evidence');

-- How long the learner has been on this item, against the configured window.
-- Volatile: the first time the window is reached it records the hesitation
-- event, exactly once, and nothing else in the system may read that event.
create function public.assistance_state(p_presented_item uuid)
returns table (window_seconds integer, dwell_seconds numeric, due boolean,
               stage text, answered boolean, highest_open smallint, next_level smallint)
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_session uuid; v_item uuid; v_window integer; v_first timestamptz;
  v_dwell numeric; v_answered boolean; v_stage text; v_open smallint;
  v_offered boolean; v_ok boolean; v_reason text;
begin
  select p.session_id, p.item_id into v_session, v_item
    from public.presented_items p where p.id = p_presented_item;
  if v_session is null then raise exception 'unknown presented item %', p_presented_item; end if;
  if not public.session_is_mine(v_session) then
    raise exception 'this session belongs to someone else';
  end if;
  select c.ok, c.reason into v_ok, v_reason from public.may_continue_session(v_session) c;
  if not v_ok then raise exception 'this session is not open for assistance: %', v_reason; end if;

  select d.hesitation_window_seconds into v_window
    from public.assessment_sessions s
    join public.assessment_definitions d on d.id = s.assessment_definition_id
   where s.id = v_session;
  if v_window is null then
    -- no window configured is not "use a default"; it is "this assessment
    -- offers no assistance"
    window_seconds := null; dwell_seconds := null; due := false;
    stage := null; answered := false; highest_open := 0; next_level := null;
    return next; return;
  end if;

  select v.first_viewed_at into v_first from public.presented_item_views v
   where v.presented_item_id = p_presented_item;
  if v_first is null then
    v_first := public.note_item_view(p_presented_item);
  end if;
  v_dwell := extract(epoch from (now() - v_first));
  v_answered := exists (select 1 from public.responses r where r.presented_item_id = p_presented_item);

  select c.stage into v_stage
    from public.items i join public.lessons l on l.id = i.lesson_id
    join public.modules m on m.id = l.module_id join public.courses c on c.id = m.course_id
   where i.id = v_item;

  select coalesce(max(a.level) filter (where a.level > 0), 0)::smallint,
         bool_or(a.level = 0)
    into v_open, v_offered
    from public.assistance_grants a where a.presented_item_id = p_presented_item;
  v_offered := coalesce(v_offered, false);

  window_seconds := v_window;
  dwell_seconds  := round(v_dwell, 3);
  -- §6: the window is inactivity with no selection yet. An answered item is
  -- not hesitating, and the trigger never fires before the configured window.
  due            := (not v_answered) and v_dwell >= v_window;
  stage          := v_stage;
  answered       := v_answered;
  highest_open   := v_open;
  next_level     := case when due and v_open < 3 then (v_open + 1)::smallint else null end;

  if due and not v_offered then
    -- hesitation_threshold_reached + assistance_offered, once per delivered item
    insert into public.assistance_grants (presented_item_id, session_id, level)
    values (p_presented_item, v_session, 0);
    insert into telemetry.hesitation_events (session_id, presented_item_id, institution_id,
                                             window_seconds, dwell_seconds)
    values (v_session, p_presented_item, '00000000-0000-0000-0000-000000000000', v_window, v_dwell);
    insert into telemetry.assistance_events (session_id, presented_item_id, institution_id, kind)
    values (v_session, p_presented_item, '00000000-0000-0000-0000-000000000000', 'OFFERED');
  end if;
  return next;
end $$;
revoke all on function public.assistance_state(uuid) from public, anon;
grant execute on function public.assistance_state(uuid) to authenticated, service_role;

-- Serve one level. Progressive: level n needs level n-1 already open, and the
-- window must have been reached. Every level is re-checked against FABLE-02's
-- own INV-02 predicate at the moment it is served, so authored text and
-- anything generated meet the same gate.
create function public.open_assistance(p_presented_item uuid, p_level smallint)
returns table (level smallint, kode text, isi text, stage text)
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_session uuid; v_item uuid; v_state record; v_text text; v_kode text; v_stage text;
begin
  select p.session_id, p.item_id into v_session, v_item
    from public.presented_items p where p.id = p_presented_item;
  if v_session is null then raise exception 'unknown presented item %', p_presented_item; end if;
  if not public.session_is_mine(v_session) then
    raise exception 'this session belongs to someone else';
  end if;
  select * into v_state from public.assistance_state(p_presented_item);
  if not v_state.due then
    raise exception 'assistance is not available yet on this question';
  end if;
  if p_level is null or p_level < 1 or p_level > 3 then
    raise exception 'assistance has three levels; % is not one of them', p_level;
  end if;
  if p_level > v_state.highest_open + 1 then
    raise exception 'assistance arrives a step at a time: open level % first', v_state.highest_open + 1;
  end if;

  select a.kode into v_kode from public.assistance_levels a where a.level = p_level;
  v_stage := v_state.stage;

  if p_level = 1 then
    select i.arah_berpikir into v_text from public.items i where i.id = v_item;
  elsif p_level = 2 then
    select i.petunjuk into v_text from public.items i where i.id = v_item;
  else
    select (l.worked_examples -> 0 ->> 'judul') || ' — ' ||
           coalesce((select string_agg(x, ' ') from jsonb_array_elements_text(
                       l.worked_examples -> 0 -> 'langkah') x), '')
      into v_text
      from public.items i join public.lessons l on l.id = i.lesson_id
     where i.id = v_item;
  end if;

  if v_text is null or btrim(v_text) = '' then
    raise exception 'this question has no assistance at level % yet', p_level;
  end if;
  -- INV-02, re-checked at serve time rather than trusted from write time
  if public.hint_reveals_answer_shape(v_text) then
    raise exception 'assistance at level % would narrow to the answer and is refused (INV-02)', p_level;
  end if;

  insert into public.assistance_grants (presented_item_id, session_id, level)
  values (p_presented_item, v_session, p_level) on conflict do nothing;
  insert into telemetry.assistance_events (session_id, presented_item_id, institution_id, kind, level)
  values (v_session, p_presented_item, '00000000-0000-0000-0000-000000000000',
          case p_level when 3 then 'WORKED_EXAMPLE_OPENED'::telemetry.assistance_kind
                       else 'HINT_OPENED'::telemetry.assistance_kind end, p_level);

  level := p_level; kode := v_kode; isi := v_text; stage := v_stage;
  return next;
end $$;
revoke all on function public.open_assistance(uuid, smallint) from public, anon;
grant execute on function public.open_assistance(uuid, smallint) to authenticated, service_role;

create function public.dismiss_assistance(p_presented_item uuid) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_session uuid;
begin
  select p.session_id into v_session from public.presented_items p where p.id = p_presented_item;
  if v_session is null then raise exception 'unknown presented item %', p_presented_item; end if;
  if not public.session_is_mine(v_session) then
    raise exception 'this session belongs to someone else';
  end if;
  insert into telemetry.assistance_events (session_id, presented_item_id, institution_id, kind)
  values (v_session, p_presented_item, '00000000-0000-0000-0000-000000000000', 'DISMISSED');
end $$;
revoke all on function public.dismiss_assistance(uuid) from public, anon;
grant execute on function public.dismiss_assistance(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Verification block (ADR-0003).
-- ---------------------------------------------------------------------------
do $$
declare n int; bad text; def text; v text; v_ok boolean; v_detail text;
begin
  for v in select unnest(array['assert_telemetry_write_only','assistance_state','open_assistance',
                               'dismiss_assistance','record_lesson_progress','learner_lessons',
                               'my_learning_assignments','enforce_lesson_progress']) loop
    if not exists (select 1 from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
                    where ns.nspname='public' and p.proname = v) then
      raise exception 'this migration did not create public.%()', v;
    end if;
  end loop;

  -- INV-11 under the narrowed rule
  select a.ok, a.detail into v_ok, v_detail from public.assert_telemetry_write_only() a;
  if not v_ok then raise exception 'INV-11: %', v_detail; end if;

  -- ... and the rule has teeth: a function that READS telemetry is caught
  -- the probe has to live in `public`, because that is the namespace the rule
  -- is about; it is created, caught, and dropped inside this block.
  execute 'create function public.zz_telemetry_reader_probe() returns integer
             language sql stable as $q$ select count(*)::integer from telemetry.hesitation_events $q$';
  select a.ok into v_ok from public.assert_telemetry_write_only() a;
  execute 'drop function public.zz_telemetry_reader_probe()';
  if v_ok then
    raise exception 'the INV-11 assertion passed with a public function reading telemetry';
  end if;
  select a.ok into v_ok from public.assert_telemetry_write_only() a;
  if not v_ok then raise exception 'the INV-11 assertion stayed red after the probe was dropped'; end if;

  -- §6: the window comes from the definition, never from a constant here
  select pg_get_functiondef(p.oid) into def from pg_proc p
    join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and p.proname='assistance_state';
  if def not like '%hesitation_window_seconds%' then
    raise exception 'assistance_state does not read the definition''s window';
  end if;
  if def ~ 'v_window\s*:=\s*[0-9]' or def ~ 'coalesce\(v_window,\s*[0-9]' then
    raise exception 'assistance_state falls back to a hard-coded hesitation window';
  end if;
  if def not like '%first_viewed_at%' then
    raise exception 'assistance_state does not measure from the server-stamped first view';
  end if;

  -- §6: every level is re-checked against the INV-02 predicate, not a new regex
  select pg_get_functiondef(p.oid) into def from pg_proc p
    join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and p.proname='open_assistance';
  if def not like '%hint_reveals_answer_shape%' then
    raise exception 'open_assistance serves text without the INV-02 check';
  end if;
  if def ~* '\y(is_correct|rationale|misconception_code)\y' then
    raise exception 'open_assistance reads answer-key material (INV-01/INV-31)';
  end if;

  -- §3: progress never regresses, and is never deleted
  select pg_get_functiondef(p.oid) into def from pg_proc p
    join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and p.proname='enforce_lesson_progress';
  if def not like '%greatest%' then
    raise exception 'lesson progress can regress; §3 forbids a resume showing less';
  end if;

  -- standing hygiene
  select count(*) into n from pg_tables where schemaname='public' and not rowsecurity;
  if n > 0 then raise exception '% table(s) without RLS', n; end if;
  select count(*) into n from pg_policies where schemaname in ('public','telemetry')
   and (qual='true' or with_check='true');
  if n > 0 then raise exception '% permissive policy/policies introduced', n; end if;
  select count(*), string_agg(p.proname, ', ') into n, bad from pg_proc p
    join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and p.prosecdef
     and not exists (select 1 from unnest(coalesce(p.proconfig,'{}')) x where x like 'search_path=%');
  if n > 0 then raise exception '% SECURITY DEFINER function(s) without pinned search_path: %', n, bad; end if;
  select count(*), string_agg(p.proname, ', ') into n, bad from pg_proc p
    join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and has_function_privilege('anon', p.oid, 'EXECUTE');
  if n > 0 then raise exception 'anon can execute % function(s) in public: %', n, bad; end if;
  select count(*) into n from information_schema.role_table_grants
   where table_schema='public' and grantee='anon' and table_name <> 'published_lessons';
  if n > 0 then raise exception 'anon holds % grant(s) beyond the published view', n; end if;
  select string_agg(t, ', ') into bad from unnest(array['lesson_progress','assistance_grants','assistance_levels']) t
   where not exists (select 1 from public.record_class_registry r where r.table_name = t);
  if bad is not null then raise exception 'table(s) with no record class: %', bad; end if;
end $$;
