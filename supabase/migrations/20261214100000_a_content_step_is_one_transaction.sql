-- W1.6 / W1.8 / W1.13 (Batch 1, D-145(c)), part 2 of 2: THE SEND-BACK, ITS RECORD, THE CORRECTION PATH, AND A
-- CONTENT STEP AS ONE TRANSACTION.
--
-- W1.13 (J4.3 observation). advanceContentAction wrote items, lessons, modules, the chapter's rules and the course as
-- five separate requests, each its own transaction; a refusal or a failure part-way left the tree at two statuses
-- and no audit row (courses_status_audit fires only on the course). langkah_konten(course, to) makes the same writes,
-- in the same order, with the same expectations, IN ONE TRANSACTION: SECURITY INVOKER, so the caller's row-level
-- security and enforce_content_status decide exactly as they did; any refusal or a shortfall (PR040 ACTION_UNCHANGED,
-- the old «never trust a 2xx» check) rolls the whole step back. A step either happens everywhere or nowhere.
--
-- W1.6 (UX-36, J4.3). kembalikan_paket(course, reason): the reviewer's other outcome. CAN_REVIEW in the owning school,
-- not the package's author (the same second person approval needs), a reason of 10 to 1000 characters, the package
-- IN_REVIEW. It records the outcome, marks its transaction for enforce_content_status (20261213100000, which refuses
-- this edge to anyone else), steps the whole tree IN_REVIEW -> VALIDATION_FAILED through langkah_konten, and audits
-- content.sent_back. Refusals are PR040/42501 with a stable code in DETAIL (SENDBACK_*); their words arrive with the
-- Batch 3 screen. THE AUTHOR'S CORRECTION PATH: a sent-back draft is corrected in its line, as a released course is
-- (D-085 M10): package_revision_problems now accepts a correction of a draft a reviewer sent back (paket_dikembalikan),
-- so the corrected workbook arrives as the next course of the same line with its change summary; or, where nothing
-- in the content needs changing, the author marks it structured again (the existing VALIDATION_FAILED -> STRUCTURED)
-- and resubmits it.
--
-- W1.8 (J4.12). content_review_outcomes: every review outcome of a package, in order: SENT_BACK with its reason, and
-- APPROVED (written by a trigger when a course is approved, from the reviewer the trigger already verified), each with
-- the reviewer and the author. Append-only; readable by the school's authors and reviewers (CAN_DRAFT or CAN_REVIEW),
-- which the audit log is not. «Riwayat perbaikan» reads it in Batch 3.

create table public.content_review_outcomes (
  id                 uuid primary key default gen_random_uuid(),
  institution_id     uuid not null references public.institutions(id),
  course_id          uuid not null references public.courses(id),
  outcome            text not null check (outcome in ('SENT_BACK', 'APPROVED')),
  reason             text check ((outcome = 'SENT_BACK') = (reason is not null)
                                 and (reason is null or char_length(btrim(reason)) between 10 and 1000)),
  reviewer_person_id uuid not null references public.persons(id),
  author_person_id   uuid references public.persons(id),
  decided_at         timestamptz not null default now()
);
create index content_review_outcomes_course on public.content_review_outcomes (course_id, decided_at);
alter table public.content_review_outcomes enable row level security;
grant select on public.content_review_outcomes to authenticated;
create policy content_review_outcomes_select on public.content_review_outcomes for select to authenticated
  using (public.can_in_institution('CAN_DRAFT', institution_id) or public.can_in_institution('CAN_REVIEW', institution_id));

create or replace function public.content_review_outcomes_are_history()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  raise exception using errcode = 'PR080', message = 'a review outcome is history and never changes',
    detail = 'REVIEW_OUTCOME_FIXED';
end $$;
revoke all on function public.content_review_outcomes_are_history() from public, anon, authenticated;
create trigger content_review_outcomes_are_history before update or delete on public.content_review_outcomes
  for each row execute function public.content_review_outcomes_are_history();

-- an approval is recorded where it happens: the course's step to APPROVED, whose reviewer enforce_content_status has
-- already verified (CAN_REVIEW, not the author, the caller)
create or replace function public.courses_review_outcome()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.status = 'APPROVED' and old.status is distinct from 'APPROVED' then
    insert into public.content_review_outcomes (institution_id, course_id, outcome, reviewer_person_id, author_person_id)
    values (new.institution_id, new.id, 'APPROVED', new.reviewed_by_person_id, new.author_person_id);
  end if;
  return new;
end $$;
revoke all on function public.courses_review_outcome() from public, anon, authenticated;
create trigger courses_review_outcome after update of status on public.courses
  for each row execute function public.courses_review_outcome();

-- a draft a reviewer sent back and that has not moved on since
create or replace function public.paket_dikembalikan(p_course uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.courses c
                  where c.id = p_course and c.status = 'VALIDATION_FAILED'
                    and exists (select 1 from public.content_review_outcomes o
                                 where o.course_id = c.id and o.outcome = 'SENT_BACK'))
$$;
revoke all on function public.paket_dikembalikan(uuid) from public, anon, authenticated;

-- W1.13: one content step, one transaction. advanceContentAction's writes, in its order, with its expectations.
create or replace function public.langkah_konten(p_course uuid, p_ke text)
returns void
language plpgsql security invoker set search_path = public, pg_temp as $$
declare
  v_ke public.content_status; v_inst uuid; v_status public.content_status; v_me uuid := public.current_person_id();
  v_mods uuid[]; v_les uuid[]; v_harap int; v_n int;
  -- «never trust a 2xx» (F-05), now inside the transaction: any shortfall raises, and the whole step is undone
begin
  begin
    v_ke := p_ke::public.content_status;
  exception when others then
    raise exception using errcode = 'PR040', detail = 'ACTION_INPUT_INVALID', message = 'langkah_konten: an unknown status';
  end;
  select c.institution_id, c.status into v_inst, v_status from public.courses c where c.id = p_course;
  if v_inst is null or not public.can_in_institution('CAN_DRAFT', v_inst) then
    raise exception using errcode = '42501', detail = 'ACTION_UNCHANGED',
      message = 'stepping content requires CAN_DRAFT in the owning institution';
  end if;
  v_mods := array(select m.id from public.modules m where m.course_id = p_course);
  v_les := array(select l.id from public.lessons l where l.module_id = any(v_mods));

  -- every visible item and lesson, every visible module; the reviewer of record is the caller (APPROVED only)
  select count(*) into v_harap from public.items i where i.lesson_id = any(v_les);
  update public.items set status = v_ke,
         reviewed_by_person_id = case when v_ke = 'APPROVED' then v_me else reviewed_by_person_id end
   where lesson_id = any(v_les);
  get diagnostics v_n = row_count;
  if v_n <> v_harap then raise exception using errcode = 'PR040', detail = 'ACTION_UNCHANGED', message = 'a content step changed fewer rows than it meant to, so nothing was changed', hint = format('%s of %s items', v_n, v_harap); end if;

  select count(*) into v_harap from public.lessons l where l.module_id = any(v_mods);
  update public.lessons set status = v_ke,
         reviewed_by_person_id = case when v_ke = 'APPROVED' then v_me else reviewed_by_person_id end
   where module_id = any(v_mods);
  get diagnostics v_n = row_count;
  if v_n <> v_harap then raise exception using errcode = 'PR040', detail = 'ACTION_UNCHANGED', message = 'a content step changed fewer rows than it meant to, so nothing was changed', hint = format('%s of %s lessons', v_n, v_harap); end if;

  update public.modules set status = v_ke,
         reviewed_by_person_id = case when v_ke = 'APPROVED' then v_me else reviewed_by_person_id end
   where course_id = p_course;
  get diagnostics v_n = row_count;
  if v_n <> coalesce(array_length(v_mods, 1), 0) then raise exception using errcode = 'PR040', detail = 'ACTION_UNCHANGED', message = 'a content step changed fewer rows than it meant to, so nothing was changed', hint = format('%s of %s modules', v_n, coalesce(array_length(v_mods, 1), 0)); end if;

  -- FD-9 (D-127 Q8): the chapter's rules (and its modules' rules) move with it, only those standing where it stands;
  -- they may legitimately be none, so they are not counted
  update public.assessment_definitions set status = v_ke,
         reviewed_by_person_id = case when v_ke = 'APPROVED' then v_me else reviewed_by_person_id end
   where (course_id = p_course or module_id = any(v_mods)) and not is_ad_hoc and status = v_status;

  update public.courses set status = v_ke,
         reviewed_by_person_id = case when v_ke = 'APPROVED' then v_me else reviewed_by_person_id end
   where id = p_course;
  get diagnostics v_n = row_count;
  if v_n <> 1 then raise exception using errcode = 'PR040', detail = 'ACTION_UNCHANGED', message = 'a content step changed fewer rows than it meant to, so nothing was changed', hint = format('%s of %s courses', v_n, 1); end if;
end $$;
revoke all on function public.langkah_konten(uuid, text) from public, anon, authenticated;
grant execute on function public.langkah_konten(uuid, text) to authenticated;


-- W1.6: the reviewer sends the package back to its author, with a reason
create or replace function public.kembalikan_paket(p_course uuid, p_alasan text)
returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_me uuid := public.current_person_id(); c public.courses; v_id uuid; v_alasan text := btrim(coalesce(p_alasan, ''));
begin
  if v_me is null then
    raise exception using errcode = '42501', detail = 'SENDBACK_NOT_REVIEWER', message = 'no person in this session';
  end if;
  select * into c from public.courses where id = p_course for update;
  if c.id is null or not public.can_in_institution('CAN_REVIEW', c.institution_id) then
    raise exception using errcode = '42501', detail = 'SENDBACK_NOT_REVIEWER',
      message = 'sending a package back requires CAN_REVIEW in the owning institution';
  end if;
  if c.status <> 'IN_REVIEW' then
    raise exception using errcode = 'PR040', detail = 'SENDBACK_NOT_IN_REVIEW',
      message = format('only a package in review is sent back; this one is %s', c.status);
  end if;
  if c.author_person_id is null or c.author_person_id = v_me then
    raise exception using errcode = 'PR040', detail = 'SENDBACK_REVIEWER_IS_AUTHOR',
      message = 'a package is sent back by someone other than its author';
  end if;
  if char_length(v_alasan) not between 10 and 1000 then
    raise exception using errcode = 'PR040', detail = 'SENDBACK_REASON_MISSING',
      message = 'a send-back says why, in 10 to 1000 characters';
  end if;
  insert into public.content_review_outcomes (institution_id, course_id, outcome, reason, reviewer_person_id, author_person_id)
  values (c.institution_id, c.id, 'SENT_BACK', v_alasan, v_me, c.author_person_id)
  returning id into v_id;
  perform set_config('pintar.kirim_balik', 'ya', true);
  perform public.langkah_konten(c.id, 'VALIDATION_FAILED');
  perform set_config('pintar.kirim_balik', '', true);
  perform public.audit_write('content.sent_back', 'courses', c.id::text, c.institution_id,
    jsonb_build_object('course', c.id, 'outcome', v_id, 'reason', v_alasan, 'reviewer', v_me,
                       'author', c.author_person_id, 'from_state', 'IN_REVIEW', 'to_state', 'VALIDATION_FAILED'));
  return v_id;
end $$;
revoke all on function public.kembalikan_paket(uuid, text) from public, anon, authenticated;
grant execute on function public.kembalikan_paket(uuid, text) to authenticated;

-- 20261106100000's text, with the one line named above
create or replace function public.package_revision_problems(b public.ingest_batches)
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare t public.courses; v jsonb := '[]'::jsonb;
begin
  if b.revises_course_id is null then return v; end if;
  select * into t from public.courses where id = b.revises_course_id;
  if t.id is null or t.institution_id is distinct from b.institution_id then
    return jsonb_build_array(jsonb_build_object('code', 'REVISION_COURSE_UNKNOWN'));
  end if;
  -- W1.6 (Batch 1): a draft a reviewer sent back is corrected in its line too, exactly as a released course is
  if not public.content_is_sealed(t.id) and not public.paket_dikembalikan(t.id) then
    v := v || jsonb_build_array(jsonb_build_object('code', 'REVISION_NOT_RELEASED'));
  end if;
  if exists (select 1 from public.courses x where x.supersedes_course_id = t.id) then
    v := v || jsonb_build_array(jsonb_build_object('code', 'REVISION_NOT_LATEST'));
  end if;
  if jsonb_typeof(b.raw_payload -> 'courses') <> 'array' or jsonb_array_length(b.raw_payload -> 'courses') <> 1 then
    v := v || jsonb_build_array(jsonb_build_object('code', 'REVISION_ONE_COURSE'));
  end if;
  if char_length(btrim(coalesce(b.change_summary, ''))) not between 10 and 1000 then
    v := v || jsonb_build_array(jsonb_build_object('code', 'REVISION_SUMMARY_MISSING'));
  end if;
  return v;
end $$;
revoke all on function public.package_revision_problems(public.ingest_batches) from public, anon, authenticated;

insert into public.client_rpc_registry (function_name, exposure, note, authorization_kind, authorization_requirement) values
  ('langkah_konten', 'STAFF',
   'W1.13 (Batch 1): one content step of a package (items, lessons, modules, its rules, the course) in ONE '
   || 'transaction, as the caller (SECURITY INVOKER: row-level security and enforce_content_status decide as before); '
   || 'a refusal or a shortfall (PR040 ACTION_UNCHANGED) rolls the whole step back.',
   'CAPABILITY', 'CAN_DRAFT'),
  ('kembalikan_paket', 'STAFF',
   'W1.6 (Batch 1): a reviewer sends a package in review back to its author with a reason (10-1000 characters): '
   || 'CAN_REVIEW in the owning school, never the author; records the outcome (content_review_outcomes), steps the '
   || 'whole tree to VALIDATION_FAILED in one transaction, audits content.sent_back. Refusals are 42501/PR040 with a '
   || 'stable code in DETAIL (SENDBACK_*).',
   'CAPABILITY', 'CAN_REVIEW');

do $$
begin
  -- the step is one function, as the caller; the send-back is the reviewer's, and the internal helpers are nobody's
  if (select p.prosecdef from pg_proc p where p.oid = 'public.langkah_konten(uuid,text)'::regprocedure) then
    raise exception 'W1.13: langkah_konten must run as the caller (SECURITY INVOKER)';
  end if;
  if has_function_privilege('anon', 'public.langkah_konten(uuid,text)', 'execute')
     or has_function_privilege('anon', 'public.kembalikan_paket(uuid,text)', 'execute')
     or has_function_privilege('authenticated', 'public.paket_dikembalikan(uuid)', 'execute') then
    raise exception 'W1.6/W1.13: a content function is reachable by a client it is not for';
  end if;
  -- no client writes a review outcome; it is history
  if has_table_privilege('authenticated', 'public.content_review_outcomes', 'INSERT')
     or has_table_privilege('authenticated', 'public.content_review_outcomes', 'UPDATE')
     or has_table_privilege('authenticated', 'public.content_review_outcomes', 'DELETE') then
    raise exception 'W1.8: a client can write a review outcome';
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'courses_review_outcome' and tgrelid = 'public.courses'::regclass)
     or not exists (select 1 from pg_trigger where tgname = 'content_review_outcomes_are_history') then
    raise exception 'W1.8: approvals are not recorded, or the record can change';
  end if;
  if position('paket_dikembalikan' in pg_get_functiondef('public.package_revision_problems(public.ingest_batches)'::regprocedure)) = 0 then
    raise exception 'W1.6: a sent-back draft has no correction path';
  end if;
  if (select count(*) from public.client_rpc_registry
       where function_name in ('langkah_konten', 'kembalikan_paket') and authorization_kind = 'CAPABILITY') <> 2 then
    raise exception 'W1.6/W1.13: the new endpoints do not declare their authorization';
  end if;
end $$;
