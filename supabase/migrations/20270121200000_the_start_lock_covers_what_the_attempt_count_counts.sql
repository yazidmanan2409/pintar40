-- ---------------------------------------------------------------------------------------------------------------
-- A3 · THE START LOCK COVERS WHAT THE ATTEMPT COUNT COUNTS (A3-R1; Sharon's N-5, A3-PREBUILD-ac25e9b1.md §2 at
-- afc3fb103c6ee41cd4688bd4a6ae98839c9ccd3f; registered by the Chief Architect at 0d3f8ec9). DRAFT, local to claude/a3.
--
-- SI-D02 (20270112120000) serialized starts with an advisory lock per (learner, assignment), before may_start's count.
-- The count was then widened (20270113140000, owner rulings of 9 and 10 Nov): it counts the learner's sittings of the
-- same definition and version under any assignment in the school and school year. The lock was not re-read. So two
-- concurrent starts on two OPEN assignments of one definition took different locks, each counted the other as not yet
-- committed, and both inserted: two attempts against a limit of one (F37-R02, red on ac25e9b1: 2 sittings, limit 1).
-- Exposure: staging only (synthetic); production is at migration 111 (the Chief Architect, 16 Nov 22:23).
--
-- The correction: start_learning_session is REDEFINED IN FULL (A3's rule: one body for later plants and readers, never
-- a text patch). It is exactly its definition on ac25e9b1 (20270112120000, A1's and C1w's text patches, A2b's
-- start-path refusals of 20270120240000) except the start lock and its order:
--   the learning assignment FOR KEY SHARE (when there is one), then the assignment FOR SHARE, then the key read under
--   it, then the advisory lock keyed (learner, definition, version), then the count, then the sitting.
-- The order is Sharon's ruling of 16 Nov 22:37 (5ac3645d), which replaces her 22:40 order (advisory first): an
-- assignment's definition is moved by the release move and by koreksi_kunci_pindah, so a key read before the share lock
-- could lock one definition and count another (F37-R03, red on this migration's first form, cd5b37c3). The learning
-- assignment comes first (Sharon, 16 Nov 22:46, 78b4de2d): «Akhiri penugasan» and both moves take it, then the assessment
-- assignments, so a start holding an assessment assignment while needing the learning assignment could deadlock with them
-- (F37-R04, red on eaa37aea). The ranks, for A2A-L01: the fence, learning_assignments, assessment_assignments, the
-- advisory key, assessment_sessions. The person and
-- the fence ahead of it are A3's controller commit, not this one. Nothing else changes: no table, column, grant or caller.
--
-- Sweep (siblings of the key): minta_percobaan keys its own advisory lock (learner, assignment) for a request of one
-- more attempt; it creates no sitting, and is reported to Sharon, not changed here.
-- ---------------------------------------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.start_learning_session(p_assessment_assignment uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_person uuid; v_ok boolean; v_reason text;
  v_aa public.assessment_assignments; v_la public.learning_assignments;
  v_d public.assessment_definitions; v_enrol uuid; v_session uuid;
  v_deadline timestamptz; v_cohort uuid; v_class uuid;
  v_release uuid; v_course uuid;
  v_kunci_def uuid; v_kunci_versi text;
begin
  v_person := public.current_person_id();
  -- CORRECTED IN PLACE (undeployed; Sharon §13 on 6faef690, Low): a share lock on the assessment assignment, so
  -- «Akhiri penugasan» (which locks it for update before it counts open sittings) never misses a start under way.
  -- A3-R1 (Sharon, 16 Nov 22:37, 5ac3645d): taken FIRST, before the start's key is read. An assignment's definition is
  -- moved by the release move and by koreksi_kunci_pindah (C1w), each holding this row FOR UPDATE; under the share lock
  -- no move can commit, so the key read below is the definition this start will count and sit (F37-R03).
  -- A3-R1 (Sharon, 16 Nov 22:46, 78b4de2d; F37-R04): and BEFORE IT, the learning assignment FOR KEY SHARE, when the
  -- assignment has one. «Akhiri penugasan» and both moves lock the learning assignment FOR UPDATE and then its assessment
  -- assignments; a start that held its assessment assignment and then needed the learning assignment (the sitting's
  -- foreign key takes it FOR KEY SHARE) could deadlock with «Akhiri» (proven: F37-R04 on eaa37aea). Taken first, the
  -- start queues behind «Akhiri» before it holds anything «Akhiri» waits for, and the insert's KEY SHARE is already held.
  -- An assignment's learning_assignment_id is never updated (only filtered on), so the unlocked read of it is safe; an
  -- ad-hoc assignment has none and takes no lock here.
  perform 1 from public.learning_assignments
   where id = (select aa.learning_assignment_id from public.assessment_assignments aa where aa.id = p_assessment_assignment)
     for key share;
  perform 1 from public.assessment_assignments where id = p_assessment_assignment for share;
  -- A3-R1 (Sharon's N-5, A3-PREBUILD-ac25e9b1.md §2; F37-R02): ONE START AT A TIME PER LEARNER AND ASSESSMENT, keyed by
  -- what the attempt count counts. may_start_assessment counts the learner's sittings of this definition and version
  -- under ANY assignment in the school and year (20270113140000), so a lock per (learner, assignment) let two starts on
  -- two open assignments of one definition take different locks and both insert (proven: two sittings against a limit
  -- of one). The key is (learner, definition, version), read under the share lock above: the assignment's definition
  -- cannot move while it is held, and a definition's version is immutable once it can be sat (INV-04,
  -- enforce_taught_content_immutable). Held to the end of the transaction, so the second start counts the first
  -- sitting and is refused; taken before the count, as SI-D02's was. No deadlock (Sharon, 5ac3645d): starts share the
  -- assignment row and then serialise on the key; the moves and «Akhiri» wait on the share lock and take no advisory
  -- lock; no start waits on an assignment while it holds a key. An unknown assignment has no key and takes no lock;
  -- may_start refuses it (UNKNOWN_ASSIGNMENT).
  if v_person is not null then
    select a.assessment_definition_id, d.version::text into v_kunci_def, v_kunci_versi
      from public.assessment_assignments a join public.assessment_definitions d on d.id = a.assessment_definition_id
     where a.id = p_assessment_assignment;
    if v_kunci_def is not null then
      perform pg_advisory_xact_lock(hashtextextended(
        'start_learning_session:definisi:' || v_person::text || ':' || v_kunci_def::text || ':' || v_kunci_versi, 0));
    end if;
  end if;
  select e.ok, e.reason into v_ok, v_reason from public.may_start_assessment(p_assessment_assignment) e;
  -- A2b start-path: the maintenance refusals by their own code, as the sitting-insert trigger raises them
  if not v_ok and v_reason = 'MAINTENANCE_PLACE' then perform public.maintenance_tolak_tempat(); end if;
  if not v_ok and v_reason = 'MAINTENANCE_NO_NEW_START' then perform public.maintenance_refuse('MAINTENANCE_NO_NEW_START'); end if;
  if not v_ok then raise exception 'cannot start this assessment: % (INV-27)', v_reason; end if;

  select * into v_aa from public.assessment_assignments where id = p_assessment_assignment;
  select * into v_d  from public.assessment_definitions where id = v_aa.assessment_definition_id;

  -- CHANGED IN 0062. An ad-hoc assignment names no learning assignment by
  -- construction, and until then that refusal ended the Quick Assessment flow
  -- before a learner could answer anything. Everything else about the session
  -- is unchanged: same opener, same assembler, same provenance guard, same
  -- evidence derivation.
  if v_aa.learning_assignment_id is null and not coalesce(v_d.is_ad_hoc, false) then
    raise exception 'this phase starts learning-cycle sessions only; the assignment names no learning assignment';
  end if;
  if v_aa.learning_assignment_id is not null then
    select * into v_la from public.learning_assignments where id = v_aa.learning_assignment_id;
    if v_la.status <> 'ACTIVE' then
      raise exception 'the learning assignment is % and assigns nothing', v_la.status;
    end if;
  end if;

  select e.id into v_enrol from public.enrollments e
   where e.person_id = v_person and e.institution_id = v_aa.institution_id and e.status = 'ACTIVE'
   order by e.created_at desc limit 1;

  -- the learner's own class/cohort under the assigned node, for exposure
  -- cooling and cohort aggregates
  select (array_agg(n.id) filter (where n.kind = 'CLASS'))[1],
         (array_agg(n.id) filter (where n.kind = 'COHORT'))[1]
    into v_class, v_cohort
    from public.memberships m join public.org_nodes n on n.id = m.node_id
   where m.enrollment_id = v_enrol and m.valid_to is null
     and (n.id = v_aa.node_id or n.jalur @> array[v_aa.node_id]);

  -- owner decision 5 (9 Nov): the sitting records the Angkatan that applies NOW, at the sitting. A learner PINTAR
  -- places is a member of a Kelas, never of the COHORT node, so the class's own Angkatan (the nearest COHORT above it
  -- in the structure as it stands at this moment) is the learner's. Recorded once, immutable (INV-33): a later move
  -- of the class or the learner never rewrites it.
  -- With a class, its Angkatan is the one recorded, whatever other membership the learner holds; open_assessment_session
  -- checks it again where it is written (Sharon's finding 3).
  if v_class is not null then
    v_cohort := null;
    select n.id into v_cohort
      from public.org_nodes k join public.org_nodes n on n.id = any (k.jalur) and n.kind = 'COHORT'
     where k.id = v_class
     order by array_position(k.jalur, n.id) desc limit 1;
  end if;

  if v_aa.closes_at is not null then v_deadline := v_aa.closes_at; end if;

  if v_aa.learning_assignment_id is not null then
    -- the release is the one the LEARNING assignment binds, never "the newest"
    v_release := v_la.plp_release_id;
    -- ADDED IN 0102. An ACTIVE assignment is not a licence to write evidence
    -- over content that can still be edited. The ad-hoc arm below has asked
    -- this question since 0063; this arm never did, so a school could answer
    -- its own unfinished chapter and the session's release binding -- the
    -- frozen answer to "what did this learner see" -- pinned nothing. Same
    -- rule, one predicate, both arms.
    if not public.release_starts_new_sessions(v_release) then
      raise exception
        'this assignment is over material that cannot begin a new attempt: the chapter it binds has not been published';
    end if;
  else
    -- ADDED IN 0062, CORRECTED IN 0063, NARROWED CORRECTLY IN 0064. An ad-hoc
    -- paper binds a module or a course, not a release, so the release is
    -- resolved from the content the definition is bound to: this school's own
    -- release of that course, or -- for canonical content -- one it holds an
    -- ACTIVE grant for.
    --
    -- `status in ('PUBLISHED','SUPERSEDED')` is "sealed, AND was published",
    -- which is exactly what the session binding needs and nothing more. Sealed,
    -- because `enforce_taught_content_immutable` only fires on a sealed course
    -- and an unsealed release therefore pins nothing (that was F1). Published,
    -- because doc 08 puts publication upstream of use -- so FROZEN, the one
    -- sealed status that was never published, stays refused.
    --
    -- SUPERSEDED is admitted deliberately. Release status gates new sessions
    -- nowhere else in this system, correction is never automatic here
    -- (ADR-0016), and the audited lever for "stop using this" is withdrawing the
    -- DISTRIBUTION, which `release_is_distributed_to` already enforces below.
    --
    -- That predicate is the same one the session guard re-applies immediately
    -- afterwards, so a grant withdrawn between launch and start refuses here
    -- rather than producing a session the guard would then reject.
    select coalesce(v_d.course_id, m.course_id) into v_course
      from public.modules m where m.id = v_d.module_id;
    if v_course is null then v_course := v_d.course_id; end if;
    select r.id into v_release
      from public.plp_releases r
     where r.course_id = v_course
       and r.status in ('PUBLISHED', 'SUPERSEDED') and r.withdrawn_at is null   -- C1w (O41-11)
       and (r.institution_id = v_aa.institution_id
         or public.release_is_distributed_to(r.id, v_aa.institution_id))
     -- a live PUBLISHED release wins over a SUPERSEDED one for the same course:
     -- `published_at desc nulls last` puts the later publication first.
     order by (r.institution_id = v_aa.institution_id) desc,
              (r.status = 'PUBLISHED') desc,
              r.published_at desc nulls last, r.created_at desc
     limit 1;
    -- C1w (O41-11): the material its publisher withdrew starts no new sitting, said as may_start_assessment says it
    if v_release is null and exists (select 1 from public.plp_releases r where r.course_id = v_course and r.withdrawn_at is not null
         and (r.institution_id = v_aa.institution_id or public.release_is_distributed_to(r.id, v_aa.institution_id))) then
      raise exception 'cannot start this assessment: RELEASE_WITHDRAWN (INV-27)';
    end if;
    if v_release is null then
      raise exception
        'this quick assessment is over material this school cannot use right now: either the chapter has not been published, or it is no longer shared with you';
    end if;
  end if;

  v_session := public.open_assessment_session(
    v_enrol, v_d.id, v_release, 'ONLINE', v_d.mode,
    public.engine_version(), public.scoring_policy_version(),
    v_class, v_cohort, v_deadline, v_aa.learning_assignment_id, v_aa.id);

  perform public.percobaan_tandai(v_session);   -- A1 (O41-16): a granted attempt is marked
  perform public.assemble_session(v_session);
  return v_session;
end
$function$;

-- ADR-0021 (F06-S01): a function created in a migration has EXECUTE revoked from PUBLIC in the same migration. The grants
-- are exactly those it held on ac25e9b1: authenticated (the learner's start) and service_role; never PUBLIC or anon.
revoke all on function public.start_learning_session(uuid) from public, anon;
grant execute on function public.start_learning_session(uuid) to authenticated, service_role;

do $$
declare v text := (select prosrc from pg_proc where oid = 'public.start_learning_session(uuid)'::regprocedure);
begin
  -- A3-R1: the lock's key names the definition and version, never the assignment alone
  if position('start_learning_session:definisi:' in v) = 0 or position('v_kunci_def::text' in v) = 0 or position('v_kunci_versi, 0)' in v) = 0 then
    raise exception 'A3-R1: start_learning_session''s start lock is not keyed by (learner, definition, version)';
  end if;
  if position(''':'' || p_assessment_assignment::text, 0)' in v) > 0 then
    raise exception 'A3-R1: start_learning_session still takes a lock keyed by the assignment';
  end if;
  -- Sharon's order (5ac3645d; 78b4de2d): the learning assignment's key share, then the assignment's share lock, then the
  -- key read under it, then the advisory lock, then the count (SI-D02: the lock before the count)
  if position('perform pg_advisory_xact_lock(' in v) = 0
     or position('for key share' in v) = 0
     or position('for key share' in v) > position('for share' in v)
     or position('for share' in v) = 0
     or position('for share' in v) > position('into v_kunci_def, v_kunci_versi' in v)
     or position('into v_kunci_def, v_kunci_versi' in v) > position('perform pg_advisory_xact_lock(' in v)
     or position('perform pg_advisory_xact_lock(' in v) > position('from public.may_start_assessment(' in v) then
    raise exception 'A3-R1: start_learning_session does not lock the learning assignment, then the assignment, read its key under them, then lock the key, before it counts';
  end if;
  -- A2b's start-path refusals, kept
  if position('then perform public.maintenance_tolak_tempat(); end if;' in v) = 0
     or position('then perform public.maintenance_refuse(''MAINTENANCE_NO_NEW_START''); end if;' in v) = 0 then
    raise exception 'A3-R1: start_learning_session lost A2b''s start-path refusals';
  end if;
  if not (select prosecdef from pg_proc where oid = 'public.start_learning_session(uuid)'::regprocedure)
     or has_function_privilege('anon', 'public.start_learning_session(uuid)', 'execute')
     or not has_function_privilege('authenticated', 'public.start_learning_session(uuid)', 'execute') then
    raise exception 'A3-R1: start_learning_session''s security or grants moved';
  end if;
end $$;

-- ---------------------------------------------------------------------------------------------------------------
-- A3, Sharon's ruling (b) on pin 2 (561bcf9d): issue_institutional_id took its school FOR UPDATE and then the person
-- FOR UPDATE, while a start holds the person and its sitting's foreign key needs FOR KEY SHARE on that school: a
-- deadlock on two connections (A3-R02I, red on 0b61eb16). REDEFINED IN FULL from 20270112180000, one change: the
-- school is taken FOR NO KEY UPDATE. The order (school, then person) that SI-D03 pinned is kept; import_advance, which
-- issues through this function, inherits it.
CREATE OR REPLACE FUNCTION public.issue_institutional_id(p_person uuid, p_institution uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_ns text; v_next integer; v_id text; v_existing text; v_suffix text;
begin
  -- ALREADY HAS ONE -> THAT ONE. Not a second number and not an error: the
  -- pair already has an identity and this is what it is. This is the row-level
  -- idempotency the import path leans on.
  select ii.institutional_id into v_existing from public.institutional_identities ii
   where ii.person_id = p_person and ii.institution_id = p_institution;
  if v_existing is not null then return v_existing; end if;

  -- The row lock serialises allocation inside one school; the unique
  -- constraint on (institution_id, sequence_number) is what makes it true.
  select i.namespace into v_ns from public.institutions i
   where i.id = p_institution for no key update;
  -- Sharon (0b60b012): the school first, then the person, the order the import already holds them in, so an import
  -- and another issue for one of its people never wait on each other in a cycle; the person's row still serialises a
  -- new number against a school's credential act on them (sekolah_memegang)
  -- A3, Sharon's ruling (b) on pin 2 (561bcf9d; A3-R02I): FOR NO KEY UPDATE, not FOR UPDATE. The school row is only
  -- read here, so this lock serialises numbering (it conflicts with itself) and no more: a start that holds this
  -- person and inserts a sitting takes FOR KEY SHARE on the school through its foreign key, which FOR UPDATE blocked
  -- while this function waited on that person (a deadlock); FOR NO KEY UPDATE does not block it.
  perform 1 from public.persons where persons.id = p_person for update;
  if v_ns is null then
    raise exception 'this institution has reserved no namespace, so it can issue no institutional ID';
  end if;

  select coalesce(max(ii.sequence_number), 0) + 1 into v_next
    from public.institutional_identities ii where ii.institution_id = p_institution;
  if v_next > 999999 then
    raise exception 'this institution has issued all 999999 institutional person IDs available under %', v_ns;
  end if;

  -- Two uppercase alphanumerics carrying no meaning and no secret; the
  -- namespace and the number already make the ID unique, and
  -- institutional_identities_id_unique is the backstop that says so.
  v_suffix := (select string_agg(substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
                                        1 + floor(random() * 36)::int, 1), '')
                 from generate_series(1, 2));
  v_id := v_ns || lpad(v_next::text, 6, '0') || v_suffix;

  insert into public.institutional_identities
    (person_id, institution_id, institutional_id, sequence_number, issued_by_person_id, issued_at)
  values (p_person, p_institution, v_id, v_next, public.current_person_id(),
          clock_timestamp());   -- Sharon (0b60b012): the moment of issue, after the locks
  return v_id;
end
$function$;
revoke all on function public.issue_institutional_id(uuid, uuid) from public, anon, authenticated;
grant execute on function public.issue_institutional_id(uuid, uuid) to service_role;

do $$
declare v_src text := (select prosrc from pg_proc where oid = 'public.issue_institutional_id(uuid, uuid)'::regprocedure);
begin
  if position('where i.id = p_institution for no key update' in v_src) = 0
     or v_src ~ 'where i\.id = p_institution for update' then
    raise exception 'A3: issue_institutional_id takes its school FOR UPDATE, which blocks a start''s foreign key (A3-R02I)';
  end if;
  if position('from public.institutions i' in v_src) > position('from public.persons where persons.id = p_person for update' in v_src) then
    raise exception 'SI-D03: issue_institutional_id locks the person before the school';
  end if;
  if has_function_privilege('authenticated', 'public.issue_institutional_id(uuid, uuid)', 'execute')
     or has_function_privilege('anon', 'public.issue_institutional_id(uuid, uuid)', 'execute') then
    raise exception 'A3: issue_institutional_id''s grants moved';
  end if;
end $$;
