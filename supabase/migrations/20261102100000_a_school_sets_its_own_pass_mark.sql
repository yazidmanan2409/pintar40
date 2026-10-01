-- D-088(b), D-081 (Q1-Q4), BOB-49 -- A SCHOOL SETS ITS OWN PASS MARK, AND
-- EVERY ATTEMPT CARRIES THE ONE IT WAS GIVEN UNDER.
--
-- Until now every product path wrote 0.6 into the assessment definition
-- (`passing_rules.mastery_min`): the package import, every Uji Cepat, every
-- seed. No decision ever chose it, a canonical lesson carried one number for
-- every school, and the readers looked it up again on every call. Yazid ruled
-- (D-088(b), completing D-086(b)): the school sets one sealed pass mark before
-- it can give a class learning whose result depends on mastery; once used it
-- is sealed for that evidence context; a later change applies to what is given
-- afterwards and never rewrites history; with no mark set PINTAR says «Batas
-- ketuntasan belum ditetapkan» and assumes nothing (no 60, no 70, no 75).
--
-- ONE DEFINITION OF PASSING, UNCHANGED: passed = mastery >= the applicable
-- mark, and the safety gate (INV-10). What changes is where the mark comes
-- from, and that it is sealed. The chain (D-081):
--
--   school policy -> assignment seal -> attempt seal -> one pass determination
--
-- 1. THE SCHOOL'S SETTING. `school_pass_marks`, append-only, one row per
--    change, per school and lesson (the course's revision lineage root, so a
--    corrected release keeps the school's mark). A whole-number percentage
--    0-100, who set it, when and why. The current mark is the row nobody
--    supersedes. Written by `set_school_pass_mark` only, for the school's
--    INSTITUTION_ADMIN (D-081 Q2: no department authority), audited. It
--    never writes shared content.
-- 2. THE ASSIGNMENT SEAL. When a class is given a lesson (Sediakan) or an Uji
--    Cepat is launched, the school's current mark is copied onto the
--    assessment assignment as a fraction (`pass_mark`), with its source and
--    the setting row. Immutable. With no setting the assignment is REFUSED
--    (PR050 ASSIGN_PASS_MARK_MISSING): nothing falls back to 0.6. A Pemetaan
--    Awal (PRE_TEST) gives no verdict, so it carries no mark.
-- 3. THE ATTEMPT SEAL. A session copies its assignment's sealed mark when it is
--    created. Immutable. A session with no assignment carries none.
-- 4. ONE DETERMINATION. `session_outcome` and `certificate_eligibility` read
--    the session's sealed mark and nothing else. No mark: no verdict and no
--    certificate, never a guessed one. This also ends the review's F7 drift
--    (eligibility said passed=true where the outcome said lulus=null).
-- 5. HISTORY, SEPARATELY (BOB-49(6)). Assignments and sessions that exist when
--    this runs are sealed with the mark their definition carried, which is the
--    number every reader used for them until now, so no historical outcome or
--    certificate moves by a byte. Their source says so
--    (BEFORE_SCHOOL_MARKS). It is never a school's policy and never a default:
--    no new assignment can take it.
--
-- NOT CHANGED: canonical content, releases, definitions (their passing_rules
-- stay as written and are no longer read for a verdict), release_distributions,
-- the scoring policy, the engine, the predikat bands, the readiness tiers, the
-- metric catalogue, the verification route. D-060: the grading rule does not
-- change, so there is no engine bump; only where the number comes from.

-- ---------------------------------------------------------------- 1. lineage

-- A lesson's identity across its revisions: the course its chain starts from.
create or replace function public.course_lineage_root(p_course uuid)
returns uuid
language sql stable security definer set search_path = public, pg_temp as $$
  with recursive up as (
    select c.id, c.supersedes_course_id, 0 as depth
      from public.courses c where c.id = p_course
    union all
    select c.id, c.supersedes_course_id, up.depth + 1
      from public.courses c join up on c.id = up.supersedes_course_id
     where up.depth < 64
  )
  select id from up where supersedes_course_id is null order by depth desc limit 1
$$;
revoke all on function public.course_lineage_root(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------- 2. the setting

create table public.school_pass_marks (
  id               uuid primary key default gen_random_uuid(),
  institution_id   uuid not null references public.institutions(id),
  course_id        uuid not null references public.courses(id),
  percent          smallint not null check (percent between 0 and 100),
  reason           text not null check (btrim(reason) <> '' and length(reason) <= 300),
  set_by_person_id uuid not null references public.persons(id),
  set_at           timestamptz not null default now(),
  supersedes_id    uuid unique references public.school_pass_marks(id),
  constraint school_pass_marks_supersedes_not_self check (supersedes_id is null or supersedes_id <> id)
);
comment on table public.school_pass_marks is
  'D-088(b), D-081, BOB-49: a school''s pass mark per lesson (course lineage root), append-only; the current one is the row '
  'no other row supersedes. Read through school_pass_mark / school_pass_mark_lessons, written by set_school_pass_mark.';
-- one first row per school and lesson; every later row names the one it replaces (unique above), so the history is a line
create unique index school_pass_marks_one_first on public.school_pass_marks (institution_id, course_id) where supersedes_id is null;
alter table public.school_pass_marks enable row level security;
revoke all on public.school_pass_marks from public, anon, authenticated;

create or replace function public.enforce_school_pass_mark_append_only() returns trigger
language plpgsql set search_path = public, pg_temp as $$
declare v_prev public.school_pass_marks;
begin
  if tg_op <> 'INSERT' then
    raise exception using errcode = 'PR080', detail = 'PASS_MARK_HISTORY_FIXED',
      message = 'a school''s pass mark history is append-only: a change is a new row';
  end if;
  if new.course_id is distinct from public.course_lineage_root(new.course_id) then
    raise exception using errcode = 'PR080', detail = 'PASS_MARK_NOT_LINEAGE_ROOT',
      message = 'a school''s pass mark is kept against the lesson''s lineage root';
  end if;
  if new.supersedes_id is not null then
    select * into v_prev from public.school_pass_marks where id = new.supersedes_id;
    if v_prev.institution_id is distinct from new.institution_id or v_prev.course_id is distinct from new.course_id then
      raise exception using errcode = 'PR080', detail = 'PASS_MARK_OTHER_LINE',
        message = 'a pass mark can only replace the same school''s mark for the same lesson';
    end if;
  end if;
  return new;
end $$;
revoke all on function public.enforce_school_pass_mark_append_only() from public, anon, authenticated;
create trigger school_pass_marks_append_only before insert or update or delete on public.school_pass_marks
  for each row execute function public.enforce_school_pass_mark_append_only();

-- The school's current mark for a lesson (any course of its lineage), or no row.
create or replace function public.school_pass_mark_current(p_institution uuid, p_course uuid)
returns public.school_pass_marks
language sql stable security definer set search_path = public, pg_temp as $$
  select m.* from public.school_pass_marks m
   where m.institution_id = p_institution
     and m.course_id = public.course_lineage_root(p_course)
     and not exists (select 1 from public.school_pass_marks n where n.supersedes_id = m.id)
   limit 1
$$;
revoke all on function public.school_pass_mark_current(uuid, uuid) from public, anon, authenticated;

-- Does this reader hold any staff role in the school (or the platform)?
create or replace function public.reads_school_settings(p_institution uuid)
returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce(public.is_system_admin(), false) or exists (
    select 1 from public.role_assignments ra
     where ra.person_id = public.current_person_id() and ra.institution_id = p_institution
       and ra.revoked_at is null and now() >= ra.valid_from and now() < ra.valid_until)
$$;
revoke all on function public.reads_school_settings(uuid) from public, anon, authenticated;

-- The lessons a school can give: its own courses and the canonical releases distributed to it, one per lineage.
create or replace function public.school_lesson_lines(p_institution uuid)
returns table (course_id uuid, title text, subject text, grade_label text, canonical boolean)
language sql stable security definer set search_path = public, pg_temp as $$
  with kandidat as (
    select public.course_lineage_root(c.id) as akar, c.title, c.subject, c.grade_label, c.created_at, false as canonical
      from public.courses c
     where c.institution_id = p_institution
    union all
    select public.course_lineage_root(c.id), c.title, c.subject, c.grade_label, c.created_at, true
      from public.release_distributions d
      join public.plp_releases r on r.id = d.plp_release_id
      join public.institutions o on o.id = r.institution_id and o.tenant_kind = 'PLATFORM_CANONICAL'
      join public.courses c on c.id = r.course_id
     where d.institution_id = p_institution and d.status = 'ACTIVE'
  )
  select distinct on (k.akar) k.akar, k.title, k.subject, k.grade_label, k.canonical
    from kandidat k where k.akar is not null
   order by k.akar, k.created_at desc
$$;
revoke all on function public.school_lesson_lines(uuid) from public, anon, authenticated;

-- The current mark for one lesson, for anyone on the school's staff: the teacher sees it before giving the lesson.
create or replace function public.school_pass_mark(p_institution uuid, p_course uuid)
returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v public.school_pass_marks;
begin
  if p_institution is null or not public.reads_school_settings(p_institution) then
    raise exception using errcode = '42501', message = 'a school''s pass marks are read by its own staff (another institution)';
  end if;
  v := public.school_pass_mark_current(p_institution, p_course);
  if v.id is null then return jsonb_build_object('percent', null); end if;
  return jsonb_build_object('percent', v.percent, 'set_at', v.set_at, 'reason', v.reason,
    'set_by', (select p.display_name from public.persons p where p.id = v.set_by_person_id));
end $$;
revoke all on function public.school_pass_mark(uuid, uuid) from public, anon, authenticated;
grant execute on function public.school_pass_mark(uuid, uuid) to authenticated;

-- Every lesson the school can give, with its current mark (or none) and its history, newest first.
create or replace function public.school_pass_mark_lessons(p_institution uuid)
returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if p_institution is null or not public.reads_school_settings(p_institution) then
    raise exception using errcode = '42501', message = 'a school''s pass marks are read by its own staff (another institution)';
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
             'course_id', l.course_id, 'title', l.title, 'subject', l.subject, 'grade_label', l.grade_label,
             'canonical', l.canonical,
             'percent', (public.school_pass_mark_current(p_institution, l.course_id)).percent,
             'history', coalesce((
               select jsonb_agg(jsonb_build_object('percent', m.percent, 'set_at', m.set_at, 'reason', m.reason,
                                                   'set_by', p.display_name) order by m.set_at desc, m.id desc)
                 from public.school_pass_marks m join public.persons p on p.id = m.set_by_person_id
                where m.institution_id = p_institution and m.course_id = l.course_id), '[]'::jsonb))
           order by l.subject, l.grade_label, l.title, l.course_id)
      from public.school_lesson_lines(p_institution) l), '[]'::jsonb);
end $$;
revoke all on function public.school_pass_mark_lessons(uuid) from public, anon, authenticated;
grant execute on function public.school_pass_mark_lessons(uuid) to authenticated;

-- The school admin sets (or changes) a lesson's mark. Returns {id, changed}.
create or replace function public.set_school_pass_mark(p_institution uuid, p_course uuid, p_percent integer, p_reason text)
returns jsonb
language plpgsql volatile security definer set search_path = public, pg_temp as $$
declare v_person uuid; v_root uuid; v_now public.school_pass_marks; v_id uuid;
begin
  v_person := public.current_person_id();
  -- the school's administrator (D-081 Q2), as every school-administration act is asked (period_rollover): a head of
  -- department, a dean or a teacher is refused; the audit row names who set it
  if v_person is null or p_institution is null or not public.has_scope('INSTITUTION_ADMIN', p_institution) then
    raise exception using errcode = '42501',
      message = 'a school''s pass mark is set by that school''s INSTITUTION_ADMIN';
  end if;
  if p_percent is null or p_percent < 0 or p_percent > 100 then
    raise exception using errcode = '22023', message = 'a pass mark is a whole-number percentage from 0 to 100';
  end if;
  if p_reason is null or btrim(p_reason) = '' or length(btrim(p_reason)) > 300 then
    raise exception using errcode = '22023', message = 'a pass mark is set with a short reason (at most 300 characters)';
  end if;
  v_root := public.course_lineage_root(p_course);
  if v_root is null or not exists (select 1 from public.school_lesson_lines(p_institution) l where l.course_id = v_root) then
    raise exception using errcode = 'P0002', message = 'that lesson is not found among the lessons this school can give';
  end if;

  -- one writer per school and lesson at a time, so the history stays a line
  perform pg_advisory_xact_lock(hashtextextended('school_pass_mark:' || p_institution::text || ':' || v_root::text, 0));
  v_now := public.school_pass_mark_current(p_institution, v_root);
  if v_now.id is not null and v_now.percent = p_percent then
    return jsonb_build_object('id', v_now.id, 'changed', false, 'percent', v_now.percent);
  end if;

  insert into public.school_pass_marks (institution_id, course_id, percent, reason, set_by_person_id, supersedes_id)
  values (p_institution, v_root, p_percent, btrim(p_reason), v_person, v_now.id)
  returning id into v_id;
  perform public.audit_write('school_pass_mark.set', 'school_pass_marks', v_id::text, p_institution,
    jsonb_build_object('course_id', v_root, 'percent', p_percent, 'previous_percent', v_now.percent,
                       'supersedes_id', v_now.id, 'reason', btrim(p_reason)));
  return jsonb_build_object('id', v_id, 'changed', true, 'percent', p_percent);
end $$;
revoke all on function public.set_school_pass_mark(uuid, uuid, integer, text) from public, anon, authenticated;
grant execute on function public.set_school_pass_mark(uuid, uuid, integer, text) to authenticated;

-- ------------------------------------------------- 3. the seals and history

alter table public.assessment_assignments
  add column pass_mark numeric check (pass_mark is null or (pass_mark >= 0 and pass_mark <= 1)),
  add column pass_mark_source text check (pass_mark_source in ('SCHOOL', 'BEFORE_SCHOOL_MARKS')),
  add column school_pass_mark_id uuid references public.school_pass_marks(id),
  add constraint assessment_assignments_pass_mark_shape check (
    (pass_mark is null and pass_mark_source is null and school_pass_mark_id is null)
    or (pass_mark is not null and pass_mark_source = 'SCHOOL' and school_pass_mark_id is not null)
    or (pass_mark is not null and pass_mark_source = 'BEFORE_SCHOOL_MARKS' and school_pass_mark_id is null));
comment on column public.assessment_assignments.pass_mark is
  'D-088(b), BOB-49: the pass mark sealed when the class was given this assessment (a fraction), from the school''s setting '
  '(SCHOOL) or, for assignments that existed before school marks, the definition''s own mark (BEFORE_SCHOOL_MARKS). Immutable.';

alter table public.assessment_sessions
  add column pass_mark numeric check (pass_mark is null or (pass_mark >= 0 and pass_mark <= 1)),
  add column pass_mark_source text check (pass_mark_source in ('SCHOOL', 'BEFORE_SCHOOL_MARKS')),
  add constraint assessment_sessions_pass_mark_shape check ((pass_mark is null) = (pass_mark_source is null));
comment on column public.assessment_sessions.pass_mark is
  'D-088(b), BOB-49: the pass mark this attempt is judged by, copied from its assignment when it started. Immutable; '
  'session_outcome and certificate_eligibility read it and nothing else.';

-- History: every existing assignment and attempt keeps the number its readers used until now, the definition's own.
-- The rows' own guards re-judge ownership and transitions on any update, so they are paused for this one write only.
alter table public.assessment_assignments disable trigger assessment_assignments_status;
update public.assessment_assignments aa
   set pass_mark = nullif(d.passing_rules ->> 'mastery_min', '')::numeric, pass_mark_source = 'BEFORE_SCHOOL_MARKS'
  from public.assessment_definitions d
 where d.id = aa.assessment_definition_id and d.mode <> 'PRE_TEST'
   and nullif(d.passing_rules ->> 'mastery_min', '') is not null;
alter table public.assessment_assignments enable trigger assessment_assignments_status;

alter table public.assessment_sessions disable trigger assessment_sessions_provenance;
alter table public.assessment_sessions disable trigger assessment_sessions_status;
update public.assessment_sessions s
   set pass_mark = nullif(d.passing_rules ->> 'mastery_min', '')::numeric, pass_mark_source = 'BEFORE_SCHOOL_MARKS'
  from public.assessment_definitions d
 where d.id = s.assessment_definition_id and s.mode <> 'PRE_TEST'
   and nullif(d.passing_rules ->> 'mastery_min', '') is not null;
alter table public.assessment_sessions enable trigger assessment_sessions_status;
alter table public.assessment_sessions enable trigger assessment_sessions_provenance;

-- The assignment seal. Fires after assessment_assignments_status (trigger order is by name), which stamps the school.
create or replace function public.seal_assignment_pass_mark() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_mode public.assessment_mode; v_course uuid; v_mark public.school_pass_marks;
begin
  if tg_op = 'UPDATE' then
    if new.pass_mark is distinct from old.pass_mark or new.pass_mark_source is distinct from old.pass_mark_source
       or new.school_pass_mark_id is distinct from old.school_pass_mark_id then
      raise exception using errcode = 'PR080', detail = 'PASS_MARK_SEALED',
        message = 'the pass mark is sealed when the class is given the assessment and never changes';
    end if;
    return new;
  end if;

  select d.mode, coalesce(d.course_id, m.course_id) into v_mode, v_course
    from public.assessment_definitions d left join public.modules m on m.id = d.module_id
   where d.id = new.assessment_definition_id;
  if v_mode = 'PRE_TEST' then
    -- a Pemetaan Awal gives no verdict, so it carries no mark
    new.pass_mark := null; new.pass_mark_source := null; new.school_pass_mark_id := null;
    return new;
  end if;
  v_mark := public.school_pass_mark_current(new.institution_id, v_course);
  if v_mark.id is null then
    raise exception using errcode = 'PR050', detail = 'ASSIGN_PASS_MARK_MISSING',
      message = 'the school has not set the pass mark for this lesson (Batas ketuntasan belum ditetapkan)';
  end if;
  new.pass_mark := round(v_mark.percent::numeric / 100, 2);   -- a whole percentage is exact at two places
  new.pass_mark_source := 'SCHOOL';
  new.school_pass_mark_id := v_mark.id;
  return new;
end $$;
revoke all on function public.seal_assignment_pass_mark() from public, anon, authenticated;
create trigger assessment_assignments_the_pass_mark_is_sealed before insert or update on public.assessment_assignments
  for each row execute function public.seal_assignment_pass_mark();

-- The attempt seal: what the assignment was given under, and nothing else.
create or replace function public.seal_session_pass_mark() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if tg_op = 'UPDATE' then
    if new.pass_mark is distinct from old.pass_mark or new.pass_mark_source is distinct from old.pass_mark_source then
      raise exception using errcode = 'PR080', detail = 'PASS_MARK_SEALED',
        message = 'an attempt''s pass mark is sealed when it starts and never changes';
    end if;
    return new;
  end if;
  new.pass_mark := null; new.pass_mark_source := null;
  if new.assessment_assignment_id is not null then
    select aa.pass_mark, aa.pass_mark_source into new.pass_mark, new.pass_mark_source
      from public.assessment_assignments aa where aa.id = new.assessment_assignment_id;
  end if;
  return new;
end $$;
revoke all on function public.seal_session_pass_mark() from public, anon, authenticated;
create trigger assessment_sessions_the_pass_mark_is_sealed before insert or update on public.assessment_sessions
  for each row execute function public.seal_session_pass_mark();

-- -------------------------------------------- 4. one pass determination

create or replace function public.session_outcome(p_session uuid) returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_s public.assessment_sessions; v_r public.assessment_results;
        v_min numeric; v_out jsonb;
begin
  if not public.session_is_mine(p_session) then
    raise exception 'this session belongs to someone else';
  end if;
  select * into v_s from public.assessment_sessions where id = p_session;
  select * into v_r from public.assessment_results
   where session_id = p_session and supersedes_result_id is null;
  if v_r.id is null then return null; end if;

  v_out := jsonb_build_object(
    'penguasaan',  v_r.mastery,
    'per_domain',  v_r.per_domain,
    'ringkasan',   v_r.delta_inputs);

  if v_s.mode = 'PRE_TEST' then
    -- diagnostic only. No verdict, no gate banner, nothing to render as a mark.
    return v_out || jsonb_build_object('diagnostik', true);
  end if;

  -- D-088(b): the mark sealed on this attempt, and no other. None sealed: no verdict, never a guessed one.
  v_min := v_s.pass_mark;
  return v_out || jsonb_build_object(
    'diagnostik', false,
    'gerbang_keselamatan', v_r.safety_gate_passed,
    -- INV-10: the gate is independent of the score and can refuse alone.
    'lulus', case when v_min is null then null
                  else (v_r.safety_gate_passed and v_r.mastery >= v_min) end,
    'ambang', v_min);
end $$;
revoke all on function public.session_outcome(uuid) from public, anon;
grant execute on function public.session_outcome(uuid) to authenticated, service_role;

create or replace function public.certificate_eligibility(p_session uuid)
returns table (eligible boolean, reason text, mastery numeric, predikat text, passed boolean)
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_mode public.assessment_mode; v_certifies boolean; v_min numeric;
        v_mastery numeric; v_gate boolean; v_official boolean; v_bands jsonb; v_pred text;
begin
  select s.mode, s.pass_mark into v_mode, v_min from public.assessment_sessions s where s.id = p_session;
  if v_mode is null then
    eligible := false; reason := 'unknown session'; return next; return;
  end if;
  select m.certifies into v_certifies from public.mode_policy m where m.mode = v_mode;
  if not coalesce(v_certifies, false) then
    eligible := false; reason := format('mode %s does not certify (§8: only formal stages)', v_mode);
    return next; return;
  end if;

  -- INV-20 structurally: the eligibility read goes through official_*, so
  -- SYNTHETIC, PREVIEW and PUBLIC_DEMO evidence is invisible here by
  -- construction rather than by a filter somebody remembered.
  select true into v_official from public.official_sessions o where o.id = p_session;
  if not coalesce(v_official, false) then
    eligible := false; reason := 'this session''s evidence is not OFFICIAL and can never reach ELIGIBLE (INV-20)';
    return next; return;
  end if;

  select r.mastery, r.safety_gate_passed into v_mastery, v_gate
    from public.official_results r where r.session_id = p_session and r.supersedes_result_id is null;
  if v_mastery is null then
    eligible := false; reason := 'this session has no official result yet'; return next; return;
  end if;

  select p.predikat_bands into v_bands from public.scoring_policy p
    join public.assessment_sessions s on s.scoring_policy_version = p.version where s.id = p_session;
  select b ->> 'predikat' into v_pred
    from jsonb_array_elements(v_bands) b
   where v_mastery >= (b ->> 'min')::numeric
   order by (b ->> 'min')::numeric desc limit 1;

  -- D-088(b): one determination, from the mark sealed on this attempt -- the same rule session_outcome gives
  passed := case when v_min is null then null else (v_gate and v_mastery >= v_min) end;
  mastery := v_mastery; predikat := v_pred;
  if v_min is null then
    eligible := false; reason := 'no pass mark is sealed on this attempt; nothing is certified against an invented one';
  elsif not v_gate then
    eligible := false; reason := 'the safety gate did not pass (INV-10)';
  elsif not passed then
    eligible := false; reason := format('mastery %s is below the %s mark', v_mastery, v_min);
  else
    eligible := true; reason := 'eligible';
  end if;
  return next;
end $$;
revoke all on function public.certificate_eligibility(uuid) from public, anon, authenticated;

-- ------------------------------------------------------------ 5. registry

insert into public.client_rpc_registry (function_name, exposure, note, authorization_kind, authorization_requirement) values
  ('set_school_pass_mark', 'STAFF',
   'D-088(b), BOB-49: the school''s INSTITUTION_ADMIN sets a lesson''s pass mark (whole-number %, with a reason); '
   'append-only and audited; never writes shared content',
   'SCOPE', 'INSTITUTION_ADMIN'),
  ('school_pass_mark', 'STAFF',
   'D-088(b), BOB-49: a lesson''s current pass mark for the school''s staff (the teacher before Sediakan)',
   'INSTITUTION_MEMBER', null),
  ('school_pass_mark_lessons', 'STAFF',
   'D-088(b), BOB-49: every lesson the school can give, with its current mark and its history (Konfigurasi)',
   'INSTITUTION_MEMBER', null)
on conflict (function_name) do update
  set exposure = excluded.exposure, note = excluded.note,
      authorization_kind = excluded.authorization_kind, authorization_requirement = excluded.authorization_requirement;

-- ----------------------------------------------------- 6. terminal checks

do $$
declare n int; v_pro text;
begin
  -- history moved by nothing: every sealed historical row carries exactly its definition's mark
  select count(*) into n from public.assessment_sessions s join public.assessment_definitions d on d.id = s.assessment_definition_id
   where s.mode <> 'PRE_TEST' and s.pass_mark is distinct from nullif(d.passing_rules ->> 'mastery_min', '')::numeric;
  if n > 0 then raise exception 'BOB-49: % historical attempt(s) sealed with another mark than their definition''s', n; end if;
  select count(*) into n from public.assessment_assignments aa join public.assessment_definitions d on d.id = aa.assessment_definition_id
   where d.mode <> 'PRE_TEST' and aa.pass_mark is distinct from nullif(d.passing_rules ->> 'mastery_min', '')::numeric;
  if n > 0 then raise exception 'BOB-49: % historical assignment(s) sealed with another mark than their definition''s', n; end if;
  if exists (select 1 from public.assessment_sessions where pass_mark_source = 'SCHOOL')
     or exists (select 1 from public.school_pass_marks) then
    raise exception 'BOB-49: no school mark exists before a school sets one';
  end if;

  -- the readers read the seal and no definition
  v_pro := pg_get_functiondef('public.session_outcome(uuid)'::regprocedure);
  if v_pro ~ 'passing_rules' or v_pro !~ 'v_s\.pass_mark' or v_pro !~ E'\nbegin\n' then
    raise exception 'BOB-49: session_outcome must read the attempt''s sealed mark only';
  end if;
  v_pro := pg_get_functiondef('public.certificate_eligibility(uuid)'::regprocedure);
  if v_pro ~ 'passing_rules' or v_pro !~ 's\.pass_mark' or v_pro !~ 'official_sessions' or v_pro !~ 'official_results'
     or v_pro ~* 'from public\.assessment_results' then
    raise exception 'BOB-49: certificate_eligibility must read the attempt''s sealed mark through official_* only';
  end if;

  -- the setting is written only through its RPC, by the school admin
  if has_table_privilege('authenticated', 'public.school_pass_marks', 'insert')
     or has_table_privilege('authenticated', 'public.school_pass_marks', 'select')
     or has_table_privilege('anon', 'public.school_pass_marks', 'select') then
    raise exception 'BOB-49: school_pass_marks is reached through its functions only';
  end if;
  if has_function_privilege('anon', 'public.set_school_pass_mark(uuid,uuid,integer,text)', 'execute')
     or not has_function_privilege('authenticated', 'public.set_school_pass_mark(uuid,uuid,integer,text)', 'execute') then
    raise exception 'BOB-49: set_school_pass_mark is for signed-in staff only';
  end if;
  select count(*) into n from public.client_rpc_registry
   where function_name in ('set_school_pass_mark', 'school_pass_mark', 'school_pass_mark_lessons');
  if n <> 3 then raise exception 'BOB-49: the three pass-mark functions are registered (% found)', n; end if;
  raise notice 'BOB-49 verified: history sealed unchanged, readers on the seal, the setting reachable only through its functions';
end $$;
