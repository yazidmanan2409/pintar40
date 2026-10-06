-- D-085 M10 -- A CORRECTION ARRIVES IN ITS LINE, AND SAYS WHAT CHANGED AND WHY.
--
-- M10: "A correction creates a NEW revision/release within the SAME content lineage ... Release 2 is not an unrelated
-- new course"; "every correction/revision must retain an auditable change history sufficient to establish what
-- changed, why it changed, who made the change, who approved/reviewed it, when it changed"; "a human-readable
-- revision/change summary is sufficient". D-007 keeps the workbook as the edit surface, and until now a corrected
-- workbook could only arrive as an unrelated course (no field said what it corrects), while «Buat salinan untuk
-- diperbaiki» made a copy no screen can edit.
--
-- Now the upload says what it corrects:
--   * ingest_batches gains revises_course_id and change_summary, written with the batch by the uploader (the batch
--     row is theirs under CAN_DRAFT, as before) and checked by the database, not trusted;
--   * package_revision_problems(batch): the corrected course must be this school's, released (sealed), and the newest
--     of its line (a course already corrected is corrected through its correction, so a line never forks); the
--     package must hold exactly one course; the summary must say something (10 to 1000 characters). Each is an
--     ordinary package problem, shown before confirmation with the others;
--   * prepare_ingest_batch and confirm_ingest_batch add those problems to the package check (one line each);
--   * lesson_package_materialise inserts the course with supersedes_course_id = the corrected course (the lineage
--     pointer is set at insert, as enforce_lineage_pointer requires), records the summary in
--     course_revision_notes and audits COURSE_CORRECTION_UPLOADED.
-- What happens next is unchanged: review, release (create_release numbers it after the corrected release and points
-- supersedes_release_id at it), freeze, publish. Who reviewed and when stay where they are (reviewed_by_person_id,
-- the release's own rows and audit lines); course_revision_notes holds what and why, by whom, when.
--
-- Each re-emitted function is its latest text (20261007100000, 20261010100000) with only the lines named above.

alter table public.ingest_batches
  add column revises_course_id uuid references public.courses(id),
  add column change_summary text check (change_summary is null or char_length(change_summary) <= 4000);

create table public.course_revision_notes (
  course_id uuid primary key references public.courses(id),
  institution_id uuid not null references public.institutions(id),
  supersedes_course_id uuid not null references public.courses(id),
  summary text not null check (char_length(btrim(summary)) between 10 and 1000),
  written_by_person_id uuid references public.persons(id),
  written_at timestamptz not null default now()
);
alter table public.course_revision_notes enable row level security;
revoke all on public.course_revision_notes from public, anon, authenticated;
grant select on public.course_revision_notes to authenticated;
create policy course_revision_notes_select on public.course_revision_notes for select to authenticated
  using (public.can_in_institution('CAN_DRAFT', institution_id) or public.can_in_institution('CAN_ASSIGN_LEARNING', institution_id));

create or replace function public.course_revision_notes_fixed()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  raise exception using errcode = 'PR080', message = 'a correction''s summary is history and never changes',
    detail = 'REVISION_NOTE_FIXED';
end $$;
revoke all on function public.course_revision_notes_fixed() from public, anon, authenticated;
create trigger course_revision_notes_are_history before update or delete on public.course_revision_notes
  for each row execute function public.course_revision_notes_fixed();

create or replace function public.package_revision_problems(b public.ingest_batches)
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare t public.courses; v jsonb := '[]'::jsonb;
begin
  if b.revises_course_id is null then return v; end if;
  select * into t from public.courses where id = b.revises_course_id;
  if t.id is null or t.institution_id is distinct from b.institution_id then
    return jsonb_build_array(jsonb_build_object('code', 'REVISION_COURSE_UNKNOWN'));
  end if;
  if not public.content_is_sealed(t.id) then
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

create or replace function public.prepare_ingest_batch(p_batch uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare b public.ingest_batches; v jsonb; v_ok boolean;
begin
  b := public.package_batch(p_batch);
  if b.status not in ('RECEIVED', 'MAPPING_PROPOSED') then perform public.package_refuse('PACKAGE_STATE_INVALID'); end if;
  v := public.lesson_package_check(b.institution_id, b.raw_payload, b.id);
  -- D-085 M10: a correction of a released course is checked as part of the package
  v := jsonb_set(v, '{problems}', (v -> 'problems') || public.package_revision_problems(b));
  v_ok := jsonb_array_length(v -> 'problems') = 0;
  update public.ingest_batches
     set validation_result = v || jsonb_build_object('ok', v_ok, 'checked_at', now()),
         inferred_mapping = v -> 'media',
         mapping_confidence = case when v_ok then 1 else 0 end,
         -- one pending confirmation: a person looks at the counts and confirms
         open_questions = case when v_ok then jsonb_build_array(jsonb_build_object(
                            'code', 'PACKAGE_CONFIRM', 'counts', v -> 'counts')) else '[]'::jsonb end,
         status = case when status = 'RECEIVED' then 'MAPPING_PROPOSED'::public.ingest_status else status end
   where ingest_batches.id = b.id;
  perform public.audit_write('ingest.prepared', 'ingest_batches', b.id::text, b.institution_id,
    jsonb_build_object('ok', v_ok, 'problems', jsonb_array_length(v -> 'problems'), 'counts', v -> 'counts'));
  return jsonb_build_object('ok', v_ok, 'batch', b.id, 'problems', v -> 'problems',
                            'media', v -> 'media', 'counts', v -> 'counts');
end $$;
revoke all on function public.prepare_ingest_batch(uuid) from public, anon, authenticated;
grant execute on function public.prepare_ingest_batch(uuid) to authenticated;

create or replace function public.confirm_ingest_batch(p_batch uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare b public.ingest_batches; v jsonb; v_missing jsonb; v_courses uuid[]; v_state text; v_msg text;
begin
  b := public.package_batch(p_batch);
  -- one confirmation at a time per batch: a double click is one course
  perform 1 from public.ingest_batches where ingest_batches.id = b.id for update;
  select * into b from public.ingest_batches where ingest_batches.id = b.id;
  if b.status not in ('RECEIVED', 'MAPPING_PROPOSED') then perform public.package_refuse('PACKAGE_STATE_INVALID'); end if;

  v := public.lesson_package_check(b.institution_id, b.raw_payload, b.id);
  -- D-085 M10: a correction of a released course is checked as part of the package
  v := jsonb_set(v, '{problems}', (v -> 'problems') || public.package_revision_problems(b));
  select coalesce(jsonb_agg(jsonb_build_object('code', 'MEDIA_NOT_UPLOADED', 'field', 'media', 'path', x ->> 'path',
                                               'file', x ->> 'file')), '[]'::jsonb)
    into v_missing
    from jsonb_array_elements(v -> 'media') x
   where not exists (select 1 from storage.objects so where so.bucket_id = 'assets' and so.name = x ->> 'path');
  if jsonb_array_length(v -> 'problems') > 0 or jsonb_array_length(v_missing) > 0 then
    return jsonb_build_object('ok', false, 'batch', b.id, 'problems', (v -> 'problems') || v_missing,
                              'media', v -> 'media', 'counts', v -> 'counts');
  end if;

  -- the confirmation and the save are one unit: a failure undoes both, so the
  -- batch is never left CONFIRMED without its course and can be confirmed again
  begin
    update public.ingest_batches set status = 'CONFIRMED' where ingest_batches.id = b.id;
    v_courses := public.lesson_package_materialise(b.id);
  exception when others then
    -- the check should have found it; if it did not, nothing is written, the
    -- batch is back where it was, and the database's words stay in the batch
    get stacked diagnostics v_state = returned_sqlstate, v_msg = message_text;
    update public.ingest_batches
       set validation_result = validation_result || jsonb_build_object('materialise_error',
             jsonb_build_object('sqlstate', v_state, 'message', left(v_msg, 300)))
     where ingest_batches.id = b.id;
    return jsonb_build_object('ok', false, 'batch', b.id,
      'problems', jsonb_build_array(jsonb_build_object('code', 'PACKAGE_COULD_NOT_BE_SAVED')),
      'media', v -> 'media', 'counts', v -> 'counts');
  end;
  update public.ingest_batches set status = 'MATERIALISED', open_questions = '[]'::jsonb where ingest_batches.id = b.id;
  perform public.audit_write('ingest.materialised', 'ingest_batches', b.id::text, b.institution_id,
    jsonb_build_object('courses', to_jsonb(v_courses), 'counts', v -> 'counts', 'source_kind', b.source_kind));
  return jsonb_build_object('ok', true, 'batch', b.id, 'courses', to_jsonb(v_courses), 'counts', v -> 'counts');
end $$;
revoke all on function public.confirm_ingest_batch(uuid) from public, anon, authenticated;
grant execute on function public.confirm_ingest_batch(uuid) to authenticated;

create or replace function public.lesson_package_materialise(p_batch uuid)
returns uuid[] language plpgsql set search_path = public, pg_temp as $$
declare
  b public.ingest_batches; c jsonb; m jsonb; l jsonb; i jsonb; o jsonb; md jsonb;
  mi int; li int; v_course uuid; v_module uuid; v_lesson uuid; v_item uuid; v_obj uuid;
  v_courses uuid[] := '{}'; v_media jsonb; v_name text; v_groups jsonb; v_group uuid; v_g text; v_use text;
  v_mode public.assessment_mode; v_n int; v_title text; v_version int;
begin
  select * into b from public.ingest_batches where id = p_batch;
  for c in select * from jsonb_array_elements(b.raw_payload -> 'courses') loop
    -- D-085 M10: a correction is a new course in the line of the one it corrects (supersedes_course_id is set
    -- here, at insert, as the lineage pointer requires); package_revision_problems has checked it
    insert into public.courses (institution_id, subject, stage, grade_label, title, author_person_id, learning_context,
                                supersedes_course_id)
    values (b.institution_id, public.package_text(c, 'subject'), public.package_text(c, 'stage'),
            public.package_text(c, 'grade_label'), public.package_text(c, 'title'), b.confirmed_by_person_id,
            coalesce(public.package_context(c), 'ACADEMIC'::public.learning_context), b.revises_course_id)
    returning id into v_course;
    if b.revises_course_id is not null then
      insert into public.course_revision_notes (course_id, institution_id, supersedes_course_id, summary, written_by_person_id)
      values (v_course, b.institution_id, b.revises_course_id, btrim(b.change_summary), b.confirmed_by_person_id);
      perform public.audit_write('COURSE_CORRECTION_UPLOADED', 'courses', v_course::text, b.institution_id,
        jsonb_build_object('corrects', b.revises_course_id, 'batch', b.id, 'summary', btrim(b.change_summary)));
    end if;
    v_courses := v_courses || v_course;
    v_groups := '{}'::jsonb;
    mi := 0;
    for m in select * from jsonb_array_elements(public.package_array(c, 'modules')) loop
      mi := mi + 1;
      insert into public.modules (course_id, institution_id, ordinal, title, author_person_id)
      values (v_course, b.institution_id, coalesce(public.package_text(m, 'ordinal'), mi::text)::smallint,
              public.package_text(m, 'title'), b.confirmed_by_person_id)
      returning id into v_module;
      li := 0;
      for l in select * from jsonb_array_elements(public.package_array(m, 'lessons')) loop
        li := li + 1;
        select coalesce(jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
                 'jenis', public.package_media_kind(public.package_media_name(public.package_text(x, 'file'))),
                 'path', format('pelajaran/%s/%s/%s', b.institution_id, b.id, public.package_media_name(public.package_text(x, 'file'))),
                 'nama', public.package_text(x, 'file'),
                 'transcript', public.package_text(x, 'transcript')))), '[]'::jsonb)
          into v_media from jsonb_array_elements(public.package_array(l, 'media')) x;
        insert into public.lessons (module_id, institution_id, ordinal, title, summary, body_markdown, media, author_person_id)
        values (v_module, b.institution_id, coalesce(public.package_text(l, 'ordinal'), li::text)::smallint,
                public.package_text(l, 'title'), public.package_text(l, 'summary'),
                public.package_text(l, 'body_markdown'), v_media, b.confirmed_by_person_id)
        returning id into v_lesson;
        v_obj := null;
        if jsonb_typeof(l -> 'objective') = 'object' then
          insert into public.learning_objectives (lesson_id, institution_id, code, statement, bloom, is_core)
          values (v_lesson, b.institution_id, format('B%sP%s', mi, li),
                  public.package_text(l -> 'objective', 'statement'),
                  coalesce(public.package_text(l -> 'objective', 'bloom'), 'UNDERSTAND')::public.bloom_level, true)
          returning id into v_obj;
        end if;
        for i in select * from jsonb_array_elements(public.package_array(l, 'items')) loop
          v_use := public.package_text(i, 'use');
          v_g := lower(public.package_text(i, 'parallel_group'));
          v_group := null;
          if v_g is not null then
            if not (v_groups ? v_g) then v_groups := v_groups || jsonb_build_object(v_g, gen_random_uuid()); end if;
            v_group := (v_groups ->> v_g)::uuid;
          end if;
          insert into public.items (lesson_id, institution_id, item_type, bank_type, stem, stimulus, petunjuk,
                                    objective_ids, parallel_group, predicted_difficulty, cycle_role, author_person_id)
          values (v_lesson, b.institution_id,
                  coalesce(public.package_text(i, 'item_type'), 'MCQ_SINGLE')::public.item_type,
                  case when v_use is null then 'PRACTICE' else 'TEST' end::public.bank_type,
                  public.package_text(i, 'stem'), public.package_text(i, 'stimulus'), public.package_text(i, 'petunjuk'),
                  case when v_obj is null then '{}'::uuid[] else array[v_obj] end, v_group,
                  public.package_text(i, 'difficulty')::numeric, v_use::public.assessment_mode, b.confirmed_by_person_id)
          returning id into v_item;
          for o in select * from jsonb_array_elements(public.package_array(i, 'options')) loop
            insert into public.item_options (item_id, institution_id, label, body, is_correct, rationale, misconception_code)
            values (v_item, b.institution_id, upper(public.package_text(o, 'label')), public.package_text(o, 'body'),
                    coalesce((o ->> 'is_correct')::boolean, false), public.package_text(o, 'rationale'),
                    public.package_text(o, 'misconception_code'));
          end loop;
        end loop;
      end loop;
    end loop;
    -- D-008 (BOB-04): the course's pre-test and post-test, made here -- before
    -- the course can be sealed, so they are reviewed with it and frozen with it
    -- -- from the questions marked for each. Every marked question is drawn.
    foreach v_mode in array array['PRE_TEST', 'POST_TEST']::public.assessment_mode[] loop
      select count(*) into v_n from public.items it
        join public.lessons ls on ls.id = it.lesson_id join public.modules ms on ms.id = ls.module_id
       where ms.course_id = v_course and it.cycle_role = v_mode;
      continue when v_n = 0;
      v_title := case v_mode when 'PRE_TEST' then 'Pemetaan awal — ' else 'Cek penguasaan — ' end
                 || public.package_text(c, 'title');
      select coalesce(max(ad.version), 0) + 1 into v_version from public.assessment_definitions ad
       where ad.institution_id = b.institution_id and ad.title = v_title and ad.mode = v_mode;
      insert into public.assessment_definitions (institution_id, course_id, title, mode, bank_type, version,
        item_count, difficulty_mix, safety_critical_minimum, passing_rules, hesitation_window_seconds,
        shuffle_policy, allows_pause, offline_tolerant, late_sync_grace_seconds, attempt_limit, author_person_id)
      values (b.institution_id, v_course, v_title, v_mode, 'TEST', v_version,
        v_n, '{}'::jsonb, 0,
        case v_mode when 'POST_TEST' then '{"mastery_min":0.6}'::jsonb else '{}'::jsonb end, 25,
        'ITEMS_AND_OPTIONS', v_mode = 'POST_TEST', true, 120,
        case v_mode when 'PRE_TEST' then 1 else 2 end, b.confirmed_by_person_id);
    end loop;
  end loop;
  return v_courses;
end $$;
revoke all on function public.lesson_package_materialise(uuid) from public, anon, authenticated;


do $$
declare v_src text;
begin
  v_src := pg_get_functiondef('public.lesson_package_materialise(uuid)'::regprocedure);
  if position('supersedes_course_id)' in v_src) = 0 or position('b.revises_course_id)' in v_src) = 0
     or position('course_revision_notes' in v_src) = 0 then
    raise exception 'M10: a correction is inserted in its line with its summary';
  end if;
  if position('package_revision_problems(b)' in pg_get_functiondef('public.prepare_ingest_batch(uuid)'::regprocedure)) = 0
     or position('package_revision_problems(b)' in pg_get_functiondef('public.confirm_ingest_batch(uuid)'::regprocedure)) = 0 then
    raise exception 'M10: prepare and confirm check a correction';
  end if;
  if has_table_privilege('authenticated', 'public.course_revision_notes', 'insert')
     or has_table_privilege('authenticated', 'public.course_revision_notes', 'update') then
    raise exception 'M10: a summary is written only with its correction';
  end if;
  raise notice 'M10 verified: a corrected workbook arrives in its line, with what changed and why';
end $$;
