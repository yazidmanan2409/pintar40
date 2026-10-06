-- D-085 M3 (J5.12) -- A TEACHER ASKS THE LEARNERS WHO NEED IT TO READ AGAIN.
--
-- M3: "the learner remains visibly below target to the authorised teacher; ... the teacher may reassign existing
-- learning material to selected learners who need additional support. Automatic adaptive remediation is NOT required
-- for 4.0." The first half is built (the teacher's record of a learner says «di bawah target» against the sealed mark).
-- The second was missing: nothing let a teacher give material back to some learners, and nothing recorded it.
--
-- Now:
--   * lesson_review_requests: one row per learner a teacher asked, for one chapter the class was given (a learning
--     assignment), with who asked and when; lesson_review_items: the lessons asked for, each with when the learner
--     read it again. Append-only history; no client writes either;
--   * request_lesson_review(assignment, learners[], lessons[]): the class's own teacher (CAN_ASSIGN_LEARNING over
--     the class's node), for learners placed in that class now (D-088(i)), lessons of that chapter only. Which
--     learners need support is the teacher's judgement: the screen lists those under the target first, the database
--     does not second-guess it. Nothing about the learner's results, attempts or mastery changes;
--   * record_lesson_review_read(request, lesson): the learner, on reaching a requested lesson's last page again;
--   * my_lesson_reviews(): the learner's open requests, with the lessons, the chapter and who asked.
-- Refusals PR050 with a DETAIL code, as the quick assessment's: REVIEW_NO_LEARNER, REVIEW_NO_LESSON,
-- REVIEW_TOO_MANY, REVIEW_NOT_IN_CLASS, REVIEW_LESSON_NOT_IN_CHAPTER, REVIEW_ASSIGNMENT_CLOSED.
--
-- Who reads a request: the learner it is for, and the class's teacher while the learner is placed in that class.
-- D-060: nothing grades, assembles or computes a metric; the read-again mark is a fact about reading, not a result.

create table public.lesson_review_requests (
  id                      uuid primary key default gen_random_uuid(),
  learning_assignment_id  uuid not null references public.learning_assignments(id),
  person_id               uuid not null references public.persons(id),
  node_id                 uuid not null references public.org_nodes(id),
  institution_id          uuid not null references public.institutions(id),
  requested_by_person_id  uuid not null references public.persons(id),
  requested_at            timestamptz not null default now()
);
create index lesson_review_requests_person_idx on public.lesson_review_requests (person_id, requested_at);
create index lesson_review_requests_node_idx on public.lesson_review_requests (node_id, requested_at);

create table public.lesson_review_items (
  request_id      uuid not null references public.lesson_review_requests(id),
  lesson_id       uuid not null references public.lessons(id),
  institution_id  uuid not null references public.institutions(id),
  read_at         timestamptz,
  primary key (request_id, lesson_id)
);

alter table public.lesson_review_requests enable row level security;
alter table public.lesson_review_items enable row level security;
revoke all on public.lesson_review_requests from public, anon, authenticated;
revoke all on public.lesson_review_items from public, anon, authenticated;
grant select on public.lesson_review_requests to authenticated;
grant select on public.lesson_review_items to authenticated;

-- the class's teacher, while the learner is placed in that class now (D-088(i)); never a former class's
create or replace function public.lesson_review_visible(p_node uuid, p_person uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select p_person = public.current_person_id()
      or (public.can_on_node('CAN_ASSIGN_LEARNING', p_node)
          and exists (select 1 from public.memberships m join public.enrollments e on e.id = m.enrollment_id
                       where m.node_id = p_node and e.person_id = p_person
                         and m.valid_to is null and e.status in ('PENDING', 'ACTIVE')))
$$;
revoke all on function public.lesson_review_visible(uuid, uuid) from public, anon, authenticated;
grant execute on function public.lesson_review_visible(uuid, uuid) to authenticated;

create policy lesson_review_requests_read on public.lesson_review_requests for select to authenticated
  using (public.lesson_review_visible(node_id, person_id));
create policy lesson_review_items_read on public.lesson_review_items for select to authenticated
  using (exists (select 1 from public.lesson_review_requests r
                  where r.id = request_id and public.lesson_review_visible(r.node_id, r.person_id)));

create or replace function public.lesson_review_fixed()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  -- the one change a request takes: a lesson's first reading; nested, so a requests row is never asked for read_at
  if tg_op = 'UPDATE' and tg_table_name = 'lesson_review_items' then
    if old.read_at is null and new.read_at is not null
       and (new.request_id, new.lesson_id, new.institution_id) is not distinct from (old.request_id, old.lesson_id, old.institution_id) then
      return new;
    end if;
  end if;
  raise exception using errcode = 'PR080', message = 'a request to read again is history: it is never changed or removed',
    detail = 'REVIEW_FIXED';
end $$;
revoke all on function public.lesson_review_fixed() from public, anon, authenticated;
create trigger lesson_review_requests_are_history before update or delete on public.lesson_review_requests
  for each row execute function public.lesson_review_fixed();
create trigger lesson_review_items_are_history before update or delete on public.lesson_review_items
  for each row execute function public.lesson_review_fixed();

create or replace function public.lesson_review_refuse(p_code text, p_message text)
returns void language plpgsql set search_path = public, pg_temp as $$
begin
  raise exception using errcode = 'PR050', message = p_message, detail = p_code;
end $$;
revoke all on function public.lesson_review_refuse(text, text) from public, anon, authenticated;

create or replace function public.request_lesson_review(p_learning_assignment uuid, p_people uuid[], p_lessons uuid[])
returns integer
language plpgsql security definer set search_path = public, pg_temp as $$
declare la public.learning_assignments; v_me uuid; v_people uuid[]; v_lessons uuid[]; v_person uuid; v_req uuid; n int := 0;
begin
  v_me := public.current_person_id();
  select * into la from public.learning_assignments where id = p_learning_assignment;
  if la.id is null or v_me is null or not public.can_on_node('CAN_ASSIGN_LEARNING', la.node_id) then
    raise exception using errcode = '42501', message = 'asking a class to read again needs CAN_ASSIGN_LEARNING over that class';
  end if;
  if la.status::text <> 'ACTIVE' then
    perform public.lesson_review_refuse('REVIEW_ASSIGNMENT_CLOSED', 'this chapter is no longer given to the class');
  end if;
  select coalesce(array_agg(distinct x), '{}') into v_people from unnest(coalesce(p_people, '{}')) x where x is not null;
  select coalesce(array_agg(distinct x), '{}') into v_lessons from unnest(coalesce(p_lessons, '{}')) x where x is not null;
  if cardinality(v_people) = 0 then perform public.lesson_review_refuse('REVIEW_NO_LEARNER', 'choose at least one learner'); end if;
  if cardinality(v_lessons) = 0 then perform public.lesson_review_refuse('REVIEW_NO_LESSON', 'choose at least one lesson'); end if;
  if cardinality(v_people) > 60 or cardinality(v_lessons) > 30 then
    perform public.lesson_review_refuse('REVIEW_TOO_MANY', 'at most 60 learners and 30 lessons at once');
  end if;
  if exists (select 1 from unnest(v_lessons) x
              where not exists (select 1 from public.lessons l join public.modules mo on mo.id = l.module_id
                                 where l.id = x and mo.course_id = la.course_id)) then
    perform public.lesson_review_refuse('REVIEW_LESSON_NOT_IN_CHAPTER', 'a lesson asked for is not part of this chapter');
  end if;
  if exists (select 1 from unnest(v_people) x
              where not exists (select 1 from public.memberships m join public.enrollments e on e.id = m.enrollment_id
                                 where m.node_id = la.node_id and e.person_id = x
                                   and m.valid_to is null and e.status in ('PENDING', 'ACTIVE'))) then
    perform public.lesson_review_refuse('REVIEW_NOT_IN_CLASS', 'a learner asked is not placed in this class now');
  end if;
  foreach v_person in array v_people loop
    insert into public.lesson_review_requests (learning_assignment_id, person_id, node_id, institution_id, requested_by_person_id)
    values (la.id, v_person, la.node_id, la.institution_id, v_me)
    returning id into v_req;
    insert into public.lesson_review_items (request_id, lesson_id, institution_id)
    select v_req, x, la.institution_id from unnest(v_lessons) x;
    n := n + 1;
  end loop;
  perform public.audit_write('lesson_review.requested', 'learning_assignments', la.id::text, la.institution_id,
    jsonb_build_object('learners', cardinality(v_people), 'lessons', to_jsonb(v_lessons)));
  return n;
end $$;
revoke all on function public.request_lesson_review(uuid, uuid[], uuid[]) from public, anon, authenticated;
grant execute on function public.request_lesson_review(uuid, uuid[], uuid[]) to authenticated;

create or replace function public.record_lesson_review_read(p_request uuid, p_lesson uuid)
returns boolean
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_me uuid;
begin
  v_me := public.current_person_id();
  if v_me is null or not exists (select 1 from public.lesson_review_requests r where r.id = p_request and r.person_id = v_me) then
    raise exception using errcode = '42501', message = 'this request to read again is not yours';
  end if;
  update public.lesson_review_items set read_at = now()
   where request_id = p_request and lesson_id = p_lesson and read_at is null;
  return found;
end $$;
revoke all on function public.record_lesson_review_read(uuid, uuid) from public, anon, authenticated;
grant execute on function public.record_lesson_review_read(uuid, uuid) to authenticated;

-- the learner's open requests: a request stays open until every lesson in it has been read again
create or replace function public.my_lesson_reviews()
returns table (request_id uuid, learning_assignment_id uuid, course_title text, requested_at timestamptz,
               requested_by text, lessons jsonb)
language sql stable security definer set search_path = public, pg_temp as $$
  select r.id, r.learning_assignment_id, c.title, r.requested_at, p.display_name,
         (select jsonb_agg(jsonb_build_object('lesson_id', l.id, 'title', l.title, 'read', i.read_at is not null)
                           order by mo.ordinal, l.ordinal)
            from public.lesson_review_items i join public.lessons l on l.id = i.lesson_id
            join public.modules mo on mo.id = l.module_id where i.request_id = r.id)
    from public.lesson_review_requests r
    join public.learning_assignments la on la.id = r.learning_assignment_id
    join public.courses c on c.id = la.course_id
    left join public.persons p on p.id = r.requested_by_person_id
   where r.person_id = public.current_person_id()
     and la.status::text = 'ACTIVE'
     and exists (select 1 from public.lesson_review_items i where i.request_id = r.id and i.read_at is null)
   order by r.requested_at
$$;
revoke all on function public.my_lesson_reviews() from public, anon, authenticated;
grant execute on function public.my_lesson_reviews() to authenticated;

insert into public.client_rpc_registry (function_name, exposure, note, authorization_kind, authorization_requirement) values
  ('lesson_review_visible', 'PLATFORM',
   'D-085 M3: predicate used by the read-again policies: the learner the request is for, or the class''s teacher while '
   'the learner is placed in that class now (D-088(i)).', null, null),
  ('request_lesson_review', 'STAFF',
   'D-085 M3: the class''s teacher asks selected learners placed in the class now to read lessons of a chapter the '
   'class was given again. Changes no result, attempt or mastery. Audited.', 'CAPABILITY', 'CAN_ASSIGN_LEARNING'),
  ('record_lesson_review_read', 'LEARNER',
   'D-085 M3: the learner marks a lesson they were asked to read again as read, on reaching its last page.', null, null),
  ('my_lesson_reviews', 'LEARNER',
   'D-085 M3: the learner''s own open requests to read again: the chapter, the lessons, who asked and when.', null, null);

do $$
begin
  if has_table_privilege('authenticated', 'public.lesson_review_requests', 'insert')
     or has_table_privilege('authenticated', 'public.lesson_review_items', 'update') then
    raise exception 'M3: a request to read again is written only through its functions';
  end if;
  raise notice 'M3 verified: a teacher asks selected learners to read again, and the reading is recorded';
end $$;
