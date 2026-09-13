-- 0060 -- the delivery layer learns the same distinction, in the same words.
--
-- TWO MORE GUARDS THE PROMPT DID NOT NAME, FOUND BY RUNNING THE FLOW. §5.4
-- named two relaxations and called the session provenance guard "the hard
-- blocker; nothing else stands between a learner and canonical content". It is
-- the hard blocker, but it is not the last one: two guards downstream of it
-- also compare a content row's institution to a learner's, and both refuse
-- canonical content for the same reason the session guard used to.
--
--   * `enforce_presented_item_immutable` requires the presented item's owner to
--     equal the session's institution (INV-01). A canonical item in a school's
--     session fails that, so assembling the paper fails and no learner ever
--     reaches a question.
--   * `enforce_lesson_progress` stamps the progress row's institution FROM THE
--     LESSON. For canonical content that hands a school learner's reading
--     progress to the canonical tenant -- the same defect 0059 fixed for
--     assignments, in the evidence layer, where it matters more.
--
-- BOTH FIXES SAY WHAT 0055 AND 0059 SAY. The record belongs to the LEARNER's
-- institution -- it is the school's evidence about its own pupil -- and the
-- content it points at is then CHECKED rather than copied: owned by that
-- institution, or canonical content that institution holds an active grant for.
-- Same conjunctive predicate, so there is still one definition of "may this
-- school use this content" and School B's item stays refused to School C.
--
-- INV-01 IS NOT WEAKENED, IT IS STATED CORRECTLY. What INV-01 protects is that
-- a learner never sees another TENANT'S item by accident. "Another tenant"
-- never meant the canonical library a school was deliberately authorized to
-- teach from -- that authorization did not exist when the guard was written.
-- The refusal that matters is unchanged and re-proved below: School B's item is
-- still refused in School C's session, with or without a distribution row.
-- ADR-0015.

create or replace function public.enforce_presented_item_immutable() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_release uuid; v_owner uuid;
begin
  if tg_op = 'INSERT' then
    select s.institution_id, s.plp_release_id into new.institution_id, v_release
      from public.assessment_sessions s where s.id = new.session_id;
    if new.institution_id is null then
      raise exception 'unknown session %', new.session_id;
    end if;
    select i.institution_id into v_owner from public.items i where i.id = new.item_id;
    if v_owner is null then raise exception 'unknown item %', new.item_id; end if;

    -- the item belongs to the session's institution, or it is canonical content
    -- that institution has been authorized to teach (0060, ADR-0015)
    if v_owner <> new.institution_id
       and not public.release_is_distributed_to(v_release, new.institution_id) then
      raise exception 'the item does not belong to the session''s institution (INV-01)';
    end if;
    -- and canonical content is the only thing the relaxation admits: a second
    -- school's item is refused whatever rows exist
    if v_owner <> new.institution_id
       and not exists (select 1 from public.institutions o
                        where o.id = v_owner and o.tenant_kind = 'PLATFORM_CANONICAL') then
      raise exception 'the item does not belong to the session''s institution (INV-01)';
    end if;
    return new;
  end if;
  raise exception 'a presented item is immutable: it records what was shown (INV-33)';
end $$;

create or replace function public.enforce_lesson_progress() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_inst uuid; v_owner uuid;
begin
  if tg_op = 'INSERT' then
    select l.institution_id into v_owner from public.lessons l where l.id = new.lesson_id;
    if v_owner is null then raise exception 'unknown lesson %', new.lesson_id; end if;

    -- CHANGED IN 0060. The progress row is the SCHOOL's record of its own
    -- learner, so its institution is the learner's, not the lesson author's.
    -- For institution-owned content the two are the same value, which is why
    -- nothing moves for existing rows.
    select e.institution_id into v_inst from public.enrollments e
     where e.person_id = new.person_id and e.valid_to is null
       and exists (select 1 from public.plp_releases r
                    where r.id = new.plp_release_id
                      and (r.institution_id = e.institution_id
                        or public.release_is_distributed_to(new.plp_release_id, e.institution_id)))
     order by e.valid_from desc limit 1;
    if v_inst is null then
      raise exception 'this learner has no enrolment that reaches this release';
    end if;
    if v_owner <> v_inst
       and not public.release_is_distributed_to(new.plp_release_id, v_inst) then
      raise exception 'the lesson does not belong to the learner''s institution (INV-13)';
    end if;
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

-- ---------------------------------------------------------------------------
-- Terminal verification.
--
-- The property over existing rows first: for every presented item and every
-- progress row already recorded, the old rule and the new rule agree. Then the
-- refusal that INV-01 is actually about, built and shown to fail.
-- ---------------------------------------------------------------------------
do $$
declare n int; v_raised boolean;
begin
  select count(*) into n from public.presented_items pi
    join public.items i on i.id = pi.item_id
   where i.institution_id <> pi.institution_id;
  if n <> 0 then
    raise exception '% presented item(s) already disagree with the old rule; the rewrite is not equivalent', n;
  end if;
  select count(*) into n from public.lesson_progress lp
    join public.lessons l on l.id = lp.lesson_id
   where l.institution_id <> lp.institution_id;
  if n <> 0 then
    raise exception '% progress row(s) already disagree with the old rule; the rewrite is not equivalent', n;
  end if;

  -- structural: both guards read the one predicate, and both still refuse a
  -- second school's content
  if pg_get_functiondef('public.enforce_presented_item_immutable()'::regprocedure)
       !~ 'release_is_distributed_to' then
    raise exception 'the presented-item guard does not read the distribution predicate';
  end if;
  if pg_get_functiondef('public.enforce_presented_item_immutable()'::regprocedure)
       !~ 'PLATFORM_CANONICAL' then
    raise exception 'the presented-item guard admits any distributed owner, not only a canonical one';
  end if;
  if pg_get_functiondef('public.enforce_lesson_progress()'::regprocedure)
       !~ 'release_is_distributed_to' then
    raise exception 'the lesson-progress guard does not read the distribution predicate';
  end if;
  if pg_get_functiondef('public.enforce_presented_item_immutable()'::regprocedure)
       !~ 'INV-33' then
    raise exception 'the presented-item guard lost its immutability branch';
  end if;

  -- and the INV-01 refusal still fires on a genuinely foreign item. Built in a
  -- subtransaction against the rows that exist, then rolled back.
  declare v_sess uuid; v_inst uuid; v_foreign uuid;
  begin
    select ss.id, ss.institution_id into v_sess, v_inst
      from public.assessment_sessions ss limit 1;
    if v_sess is null then
      -- a from-empty replay has no session yet; F05-T05 carries the behavioural
      -- half against seeded data (ADR-0014: say so rather than probe vacuously)
      raise notice '0060: no session exists yet; the INV-01 refusal is asserted behaviourally in F05-T05';
    else
      select i.id into v_foreign from public.items i
        join public.institutions o on o.id = i.institution_id
       where i.institution_id <> v_inst and o.tenant_kind <> 'PLATFORM_CANONICAL' limit 1;
      if v_foreign is not null then
        v_raised := false;
        begin
          insert into public.presented_items (session_id, item_id, institution_id, position)
          values (v_sess, v_foreign, v_inst, 99);
          raise exception 'GUARD_DID_NOT_FIRE';
        exception when others then
          if sqlerrm = 'GUARD_DID_NOT_FIRE' then
            raise exception 'a second school''s item was presented in this session (INV-01)';
          end if;
          v_raised := true;
        end;
        if not v_raised then raise exception 'the INV-01 probe did not run'; end if;
      end if;
    end if;
    raise exception 'ROLLBACK_PROBE';
  exception when others then
    if sqlerrm <> 'ROLLBACK_PROBE' then raise; end if;
  end;

  raise notice '0060 verified: the delivery layer admits distributed canonical content and nothing else';
end $$;
