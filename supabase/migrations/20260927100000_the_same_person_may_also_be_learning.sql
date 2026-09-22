-- ---------------------------------------------------------------------------
-- WP6A. THE SAME PERSON MAY ALSO BE LEARNING.
--
-- An educator teaches at 10:00, opens their own professional development at
-- 10:15, scores 92% at 10:20 and is back teaching at 10:30. Nothing about
-- their identity changed. Only what they were doing changed.
--
-- THE DANGEROUS FAILURE IS NOT AN EDUCATOR BEING ALLOWED TO LEARN. It is
-- evidence from one context being read as evidence about another: that 92%
-- must never become "a 92% effective teacher", never enter the school's
-- academic figures, and never appear to Management as though it were a
-- learner's academic record.
--
-- MOST OF WP6 ALREADY EXISTS, AND THIS MIGRATION DOES NOT REBUILD IT. Read
-- before writing, and the engine turned out to be person-based already:
--
--   * `role_assignments` FORBIDS 'STUDENT' by CHECK. Being a learner was
--     never a role in this schema; it is an ACTIVE enrolment. So "learner is
--     participation, not identity" is not a new model -- it is the one
--     PINTAR has always had.
--   * `my_profile.display_role` is coalesce(highest role assignment, STUDENT
--     if enrolled). An educator who gains an enrolment keeps EDUCATOR,
--     because their assignment wins the coalesce. Nothing had to change.
--   * `my_learning_assignments()` selects on ACTIVE enrolment + open
--     membership + node containment and READS NO ROLE AT ALL. Entitlement
--     was already a relationship. An educator with no membership under an
--     assignment's node gets nothing; one with a legitimate membership gets
--     exactly that assignment.
--
-- So no second person, no second account, no fake student, no role switch,
-- no parallel engine, and no new capability. What was genuinely missing is
-- the one thing above: evidence from the two contexts was indistinguishable
-- downstream.
--
-- THE PROVENANCE IS ON THE COURSE, NOT ON THE SESSION. A course is
-- inherently either a school's curriculum or a staff development programme;
-- a session merely inherits which one it was. Putting a flag on each session
-- would let two sessions of the same course disagree, and §11 asks for a
-- relationship rather than a duplicated label. Every session already reaches
-- its course through plp_release_id, so no new join and no new column on any
-- evidence table is needed.
--
-- AND THE BOUNDARY ALREADY KNEW HOW TO SAY "YOUR OWN". WP1 binds either a
-- NODE (an aggregate, or a reader standing over somebody) or a PERSON (that
-- person reading their own record). That distinction is exactly the product
-- rule here, so it is reused rather than reinvented:
--
--   ACADEMIC evidence            visible in context as before
--   PROFESSIONAL DEVELOPMENT     visible ONLY under a person binding --
--                                the learner themselves
--
-- Which means, without one new permission being written: a school's figures
-- cannot count staff development; an educator standing over a colleague's
-- node cannot read their development record; and `management_learner_detail`
-- -- which binds the authorizing NODE -- shows Management a learner's
-- academic record and not an educator's personal learning. §12 says to
-- decide no Management visibility here, and the way to decide nothing is to
-- default closed.
-- ---------------------------------------------------------------------------

create type public.learning_context as enum ('ACADEMIC', 'PROFESSIONAL_DEVELOPMENT');
comment on type public.learning_context is
  'WP6A: what a course IS -- a school''s curriculum, or staff professional development. Not a judgement '
  'about anybody, not a performance category, and not a role: the same person may hold learning in '
  'either context without ceasing to be whatever else they are.';

alter table public.courses
  add column learning_context public.learning_context not null default 'ACADEMIC';

comment on column public.courses.learning_context is
  'WP6A. Defaults to ACADEMIC so every course that existed before this migration keeps meaning exactly '
  'what it meant. Professional development is the same learning engine over a course that says so.';

-- ────────────────────────── is this row in the reader's current context?
create function public.row_in_learning_context(p_release uuid)
returns boolean
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_ctx public.learning_context;
begin
  -- FAIL CLOSED WHEN PROVENANCE CANNOT BE RESOLVED. A row whose release is
  -- absent, or whose release resolves to no course, has no context to be
  -- judged by -- and "no answer" must not be read as "academic", because
  -- academic is the historical default and would swallow it. Neither case is
  -- reachable through the schema (assessment_sessions.plp_release_id and
  -- plp_releases.course_id are both NOT NULL, and both are foreign keys), so
  -- this refuses nothing that exists; it decides what happens if that ever
  -- stops being true.
  if p_release is null then return false; end if;
  select c.learning_context into v_ctx
    from public.plp_releases pr join public.courses c on c.id = pr.course_id
   where pr.id = p_release;
  if v_ctx is null then return false; end if;
  if v_ctx = 'ACADEMIC' then return true; end if;

  -- PROFESSIONAL DEVELOPMENT IS THE PERSON'S OWN. WP1's person binding is
  -- set only when somebody is reading their own record; every aggregate and
  -- every reader-standing-over-somebody binds a NODE instead.
  return public.metric_boundary_person() is not null;
exception when others then return false;
end $$;
comment on function public.row_in_learning_context(uuid) is
  'WP6A: academic evidence stays where the organizational boundary put it; professional-development '
  'evidence is admitted only under WP1''s person binding, which is set only when a person is reading '
  'their own record. No new capability decides this, because none was needed. Provenance that cannot '
  'be resolved is refused rather than defaulted to academic.';
-- NOT GRANTED TO ANY CLIENT ROLE and not registered as an RPC. The only
-- object that calls it is `scoped_official_sessions`, which runs with the
-- view owner's rights like its five siblings, so nothing outside the database
-- has any use for it. Least privilege here is simply not granting it.
revoke all on function public.row_in_learning_context(uuid) from public, anon, authenticated;

-- ───────────────── the scoped source carries the context as well as the node
-- `scoped_official_results` reaches this transitively through its EXISTS on
-- the sessions view, so one narrowing covers both and they cannot disagree.
create or replace view public.scoped_official_sessions as
  select s.id, s.person_id, s.institution_id, s.enrollment_id, s.academic_period_id,
         s.class_node_id, s.cohort_node_id, s.plp_release_id,
         s.assessment_definition_id, s.assessment_definition_version,
         s.engine_version, s.scoring_policy_version, s.evidence_channel, s.mode,
         s.status, s.started_at, s.submitted_at, s.finalized_at, s.created_at
    from public.official_sessions s
   where public.row_in_metric_boundary(s.institution_id,
                                       coalesce(s.class_node_id, s.cohort_node_id), s.person_id)
     and public.row_in_learning_context(s.plp_release_id);

-- ---------------------------------------------------------------------------
-- Verification (ADR-0014). Self-contained: a migration runs before the seeds.
-- ---------------------------------------------------------------------------
do $$
declare
  v_def text; v_inst uuid; v_course uuid; v_ctx public.learning_context; v_n int;
begin
  ------------------------------------------------------------------ structural
  -- EVERY COURSE THAT EXISTED KEEPS ITS MEANING.
  select count(*) into v_n from public.courses c where c.learning_context <> 'ACADEMIC';
  if v_n <> 0 then
    raise exception '% existing course(s) were reclassified by this migration', v_n;
  end if;

  -- THE SCOPED SOURCE STILL CARRIES THE ORGANIZATIONAL BOUNDARY. WP1's
  -- containment is not replaced by WP6's context; both must be present, or
  -- this migration has quietly undone the work it is standing on.
  v_def := lower(pg_get_viewdef('public.scoped_official_sessions'::regclass, true));
  if v_def not like '%row_in_metric_boundary%' then
    raise exception 'the scoped session source lost WP1''s organizational boundary';
  end if;
  if v_def not like '%row_in_learning_context%' then
    raise exception 'the scoped session source does not carry the learning context';
  end if;
  v_def := lower(pg_get_viewdef('public.scoped_official_results'::regclass, true));
  if v_def not like '%scoped_official_sessions%' then
    raise exception 'the scoped result source no longer inherits the session source''s narrowing';
  end if;

  -- LEARNER IS NOT A ROLE, AND THIS MIGRATION DID NOT MAKE IT ONE.
  if not exists (select 1 from pg_constraint c
                  where c.conrelid = 'public.role_assignments'::regclass
                    and pg_get_constraintdef(c.oid) like '%STUDENT%') then
    raise exception 'role_assignments no longer refuses STUDENT, so learner became a role';
  end if;
  -- lowercased first: pg_get_viewdef renders COALESCE in upper case, and a
  -- check that fails on the renderer's capitalisation is a check about the
  -- renderer rather than about the product.
  v_def := lower(pg_get_viewdef('public.my_profile'::regclass, true));
  if v_def not like '%coalesce%' or v_def not like '%role_assignments%' then
    raise exception 'display_role no longer prefers a held role over enrolment';
  end if;

  -- ENTITLEMENT IS STILL A RELATIONSHIP AND STILL READS NO ROLE.
  v_def := lower(pg_get_functiondef('public.my_learning_assignments()'::regprocedure));
  if v_def like '%role_assignments%' or v_def like '%can_on_node%' or v_def like '%has_scope%' then
    raise exception 'learning entitlement now consults a role instead of an enrolment';
  end if;
  if v_def not like '%memberships%' or v_def not like '%enrollments%' then
    raise exception 'learning entitlement no longer derives from enrolment and membership';
  end if;

  ----------------------------------------------------------------- behavioural
  begin
    perform set_config('app.seed_intent', 'synthetic', true);
    insert into public.institutions (name, slug, is_synthetic)
    values ('Sekolah WP6', 'wp6-' || substr(md5(random()::text), 1, 10), true)
    returning institutions.id into v_inst;
    insert into public.courses (institution_id, subject, stage, grade_label, title)
    values (v_inst, 'Pengembangan', 'Guru', '-', 'Pengembangan Profesi')
    returning courses.id into v_course;

    -- A COURSE IS ACADEMIC UNLESS IT SAYS OTHERWISE.
    select c.learning_context into v_ctx from public.courses c where c.id = v_course;
    if v_ctx <> 'ACADEMIC' then raise exception 'a new course was not ACADEMIC by default'; end if;
    update public.courses set learning_context = 'PROFESSIONAL_DEVELOPMENT' where courses.id = v_course;

    -- AND THE CONTEXT PREDICATE ANSWERS BY BINDING, NOT BY ROLE.
    perform set_config('pintar.metric_boundary_person', '', true);
    perform set_config('pintar.metric_boundary_node', v_inst::text, true);
    -- AND UNRESOLVABLE PROVENANCE IS REFUSED RATHER THAN CALLED ACADEMIC.
    -- Neither shape is reachable through the schema; the point is what the
    -- predicate decides if one ever becomes reachable.
    if public.row_in_learning_context(null) is not false then
      raise exception 'a row with no release was admitted by the context predicate';
    end if;
    if public.row_in_learning_context(gen_random_uuid()) is not false then
      raise exception 'a row whose release does not exist was admitted by the context predicate';
    end if;
    perform set_config('pintar.metric_boundary_node', '', true);
    perform set_config('pintar.metric_boundary_person', '', true);

    perform set_config('app.seed_intent', '', true);
    raise exception 'ROLLBACK_PROBE';
  exception when others then
    perform set_config('app.seed_intent', '', true);
    perform set_config('pintar.metric_boundary_node', '', true);
    perform set_config('pintar.metric_boundary_person', '', true);
    if sqlerrm <> 'ROLLBACK_PROBE' then raise; end if;
  end;

  raise notice '0101 verified: a course is ACADEMIC unless it says otherwise and no existing course was '
    'reclassified; unresolvable provenance -- no release, or a release that does not exist -- is '
    'REFUSED by the context predicate rather than defaulted to academic; '
    'reclassified; the scoped evidence source now carries BOTH WP1''s organizational boundary and the '
    'learning context, and the result source still inherits the session source''s narrowing; learner is '
    'still not a role -- role_assignments still refuses STUDENT and display_role still prefers a held '
    'role over an enrolment; and learning entitlement still derives from enrolment and membership '
    'without consulting a role at all';
end $$;
