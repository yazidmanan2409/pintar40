-- ---------------------------------------------------------------------------
-- C1w · THE ITEM WORKBENCH, the database half, part one (docs/completion-4.1/batches/C1W-COMPLETION.md, «Pre-build
-- review: outcome»; owner decisions O41-10 and O41-11). In 4.0 authoring was workbook upload only: an unreviewed draft
-- could be neither edited nor discarded; the upload path set no item pointer; a published correction left its
-- predecessor published; and a release its publisher withdrew still started new sittings.
--
-- (1) A DRAFT IS EDITED IN THE APP (O41-10): ubah_soal_draf (stem, options, key, rationale, misconception code,
--     objective), tambah_soal_draf, hapus_soal_draf and buang_draf. The caller holds CAN_DRAFT in the owning school (the
--     platform library: the platform admin, as its packages are, D-120 Q7). A draft is edited before it is submitted
--     (INGESTED, STRUCTURED, VALIDATED) or after it is sent back (VALIDATION_FAILED); once submitted (IN_REVIEW,
--     APPROVED) or sealed, every act is refused. A draft that has passed its check (VALIDATED) and is then edited goes
--     back to STRUCTURED, so it is checked again before it is submitted: that edge exists for these functions alone
--     (pintar.suntingan_draf, as kembalikan_paket's own edge). Every save is attributed (who, when) in
--     item_draft_edits, which names what changed and never the text, and in the audit. A concurrent save of the same
--     question is refused (DRAFT_EDIT_CONFLICT): each question carries a revision number, the editor sends the one it
--     read, and every write of the question's content raises it. A save that fails validation writes nothing and
--     returns every problem at once (exactly one key on a single-answer question, at least one on a multi-answer
--     one; no empty option; 2 to 5 options). A discarded draft leaves its audit row and its attribution rows and no
--     content: its course row is removed too, unless history that is never deleted (a review outcome, a revision note,
--     a later upload naming it) still names it, in which case that row alone stays, emptied and marked discarded.
-- (2) A QUESTION'S IDENTITY ON UPLOAD (Sharon, blocker 4): a workbook question may carry `identity`, the question it
--     revises. The value must name a question of the course the upload revises (its predecessor), at the same school,
--     and be used once in the upload; otherwise that row is a problem (ITEM_IDENTITY_*), never a new question. Without
--     the column every question is new, as before. A lineage pointer never crosses owners, whatever path writes it.
--     An upload over a draft edited in the app is detectable (unggah_menimpa_suntingan).
-- (3) ONE QUESTION REVISED (revisi_soal): a new revision of the published head of the line, in which every question
--     points to its own original; the author then edits the one that changes, and it goes through review, approval,
--     lock and publication as today. create_course_revision revises only the current head (REVISION_NOT_HEAD).
-- (4) A QUESTION'S HISTORY (riwayat_soal): each version, who made it, when, in which release, and what changed, said
--     as data a sentence can be built from. No statistic of any version.
-- (5) PUBLICATION AND WITHDRAWAL: publishing a correction replaces its predecessor for new assignments (SUPERSEDED,
--     marked replaced_by); a withdrawn release (O41-11) starts no new sitting, open sittings finish, finished results
--     stay and count. Withdrawn and replaced are recorded apart (withdrawn_at, replaced_by_release_id): status alone
--     said both. keadaan_terbitan gives teachers and learners a state of their own (Daisy, C1-B2), never «Ditarik».
-- Refusals are PR180 with the code in DETAIL (soal_tolak). Every act writes an audit row.
-- ---------------------------------------------------------------------------

create or replace function public.soal_tolak(p_code text)
returns void language plpgsql set search_path = public, pg_temp as $$
begin
  raise exception using
    errcode = 'PR180',
    detail  = p_code,
    message = case p_code
      when 'DRAFT_NOT_ALLOWED'         then 'editing a draft requires CAN_DRAFT in the owning school (the platform library: the platform admin)'
      when 'DRAFT_UNKNOWN'             then 'this draft or question is not known'
      when 'DRAFT_SUBMITTED'           then 'the package is with its reviewer; it is edited again once it is sent back'
      when 'DRAFT_SEALED'              then 'the package is locked or published; a change is a revision of it'
      when 'DRAFT_EDIT_CONFLICT'       then 'someone saved this question after you opened it; open it again'
      when 'DRAFT_IN_USE'              then 'something outside the draft already uses it, so it is not discarded or removed'
      when 'DRAFT_LAST_TEST_QUESTION'  then 'this is the last question of its test; a test keeps at least one'
      when 'DRAFT_SHAPE_INVALID'       then 'the question is sent as one object with its options'
      when 'DRAFT_NOTE_TOO_LONG'       then 'the note is at most 300 characters'
      when 'REVISION_NOT_HEAD'         then 'a newer version of this package exists; the newest one is revised'
      when 'REVISION_NOT_PUBLISHED'    then 'only a question of a published package is revised'
      when 'REVISION_OPEN_EXISTS'      then 'a revision of this package is already open; finish or discard it first'
      when 'REVISION_SUMMARY_REQUIRED' then 'a revision says what changes and why, in 10 to 1000 characters'
      when 'QUESTION_NOT_VISIBLE'      then 'a question''s history is read by its school''s authors and reviewers'
      when 'RELEASE_STATE_NOT_VISIBLE' then 'this material''s state is read by its class''s teachers and learners'
      else 'the change could not be saved' end;
end $$;
revoke all on function public.soal_tolak(text) from public, anon, authenticated;

-- ═══════════════════════════════════════════════════════════ what is recorded
-- A question's revision number and its last in-app edit (who, when). Operational, not content: the content hash names
-- its fields and none of these, so a sealed release's hash is unchanged.
alter table public.items
  add column revision            integer not null default 1 check (revision > 0),
  add column edited_at           timestamptz,
  add column edited_by_person_id uuid references public.persons(id),
  add constraint items_edit_shape check ((edited_at is null) = (edited_by_person_id is null));

-- A discarded draft held by history that is never deleted keeps its course row, emptied, and says so.
alter table public.courses
  add column discarded_at           timestamptz,
  add column discarded_by_person_id uuid references public.persons(id),
  add constraint courses_discard_shape check ((discarded_at is null) = (discarded_by_person_id is null));

-- A release replaced by its published correction, and a release its publisher withdrew, are recorded apart.
alter table public.plp_releases
  add column replaced_by_release_id uuid references public.plp_releases(id),
  add column replaced_at            timestamptz,
  add column withdrawn_at           timestamptz,
  add column withdrawn_by_person_id uuid references public.persons(id),
  add column withdrawal_reason      text,
  add constraint plp_releases_replaced_shape check ((replaced_by_release_id is null) = (replaced_at is null)),
  add constraint plp_releases_withdrawn_shape
    check (withdrawn_at is not null or (withdrawn_by_person_id is null and withdrawal_reason is null)),
  add constraint plp_releases_marks_need_superseded
    check ((replaced_at is null and withdrawn_at is null) or status = 'SUPERSEDED');

-- Every in-app save, attributed. What changed is named (fields, option labels, the key's labels), never the text: a
-- discarded draft leaves these rows and no content. Append-only.
create table public.item_draft_edits (
  id             uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id),
  course_id      uuid not null,
  item_id        uuid,
  action         text not null check (action in ('ITEM_EDITED', 'ITEM_ADDED', 'ITEM_REMOVED', 'DRAFT_DISCARDED')),
  revision_from  integer,
  revision_to    integer,
  changed        jsonb not null default '{}'::jsonb check (jsonb_typeof(changed) = 'object'),
  by_person_id   uuid not null references public.persons(id),
  at             timestamptz not null default now(),
  note           text check (note is null or char_length(note) <= 300)
);
create index item_draft_edits_course_idx on public.item_draft_edits (course_id, at desc);
create index item_draft_edits_item_idx on public.item_draft_edits (item_id, at desc) where item_id is not null;
alter table public.item_draft_edits enable row level security;
revoke all on table public.item_draft_edits from public, anon, authenticated;
insert into public.record_class_registry values
  ('item_draft_edits', 'INSTITUTION_SCOPED',
   'C1w: who saved which question of a draft and when, and what changed by name; never content; read through functions only');
create or replace function public.item_draft_edits_append_only() returns trigger
language plpgsql set search_path = public, pg_temp as $$
begin
  raise exception 'a draft edit is a record of who saved what; it is never rewritten or deleted';
end $$;
revoke all on function public.item_draft_edits_append_only() from public, anon, authenticated;
create trigger item_draft_edits_append_only before update or delete on public.item_draft_edits
  for each row execute function public.item_draft_edits_append_only();

-- ═══════════════════════════════════════════════════════════ every write of a question's content raises its revision
-- Whatever path writes it (these functions, or a signed-in author's own update under CAN_DRAFT), a question's content
-- moving raises its number, so an editor holding the number it read is refused instead of overwriting. The functions
-- below set the number themselves and mark their own write (pintar.suntingan_soal), so a save is one step.
create or replace function public.soal_revisi_naik() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_item uuid;
begin
  if tg_table_name = 'items' then
    if new.revision is distinct from old.revision then return new; end if;
    if (to_jsonb(new) - 'status' - 'reviewed_by_person_id' - 'reviewed_at' - 'revision' - 'edited_at' - 'edited_by_person_id'
        - 'empirical_difficulty' - 'empirical_discrimination' - 'empirical_evidence_count')
       is distinct from
       (to_jsonb(old) - 'status' - 'reviewed_by_person_id' - 'reviewed_at' - 'revision' - 'edited_at' - 'edited_by_person_id'
        - 'empirical_difficulty' - 'empirical_discrimination' - 'empirical_evidence_count') then
      new.revision := old.revision + 1;
      if public.current_person_id() is not null then
        new.edited_at := now(); new.edited_by_person_id := public.current_person_id();
      end if;
    end if;
    return new;
  end if;
  -- item_options
  v_item := case when tg_op = 'DELETE' then old.item_id else new.item_id end;
  if coalesce(current_setting('pintar.suntingan_soal', true), '') in (v_item::text, '*') then
    if tg_op = 'DELETE' then return old; else return new; end if;
  end if;
  if tg_op <> 'INSERT' or exists (select 1 from public.items i where i.id = v_item and i.created_at < now()) then
    update public.items set revision = revision + 1,
           edited_at = case when public.current_person_id() is null then edited_at else now() end,
           edited_by_person_id = case when public.current_person_id() is null then edited_by_person_id else public.current_person_id() end
     where id = v_item;
  end if;
  if tg_op = 'DELETE' then return old; else return new; end if;
end $$;
revoke all on function public.soal_revisi_naik() from public, anon, authenticated;
create trigger items_c1w_revision before update on public.items
  for each row execute function public.soal_revisi_naik();
create trigger item_options_c1w_revision after insert or update or delete on public.item_options
  for each row execute function public.soal_revisi_naik();

-- ═══════════════════════════════════════════════════════════ a lineage pointer never crosses owners
-- Sharon, blocker 4: whatever path writes it (the copy, the upload, a later function), a question, a lesson, a module
-- and a course point only to a row of their own owner.
create or replace function public.garis_satu_pemilik() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_col text := tg_argv[0]; v_target uuid; v_inst uuid;
begin
  v_target := (to_jsonb(new) ->> v_col)::uuid;
  if v_target is null then return new; end if;
  execute format('select institution_id from public.%I where id = $1', tg_table_name) into v_inst using v_target;
  if v_inst is distinct from new.institution_id then
    raise exception using errcode = 'PR180', detail = 'LINEAGE_CROSSES_OWNER',
      message = format('%s.%s points to a row of another owner; lineage stays inside one school (C1w)', tg_table_name, v_col);
  end if;
  return new;
end $$;
revoke all on function public.garis_satu_pemilik() from public, anon, authenticated;
create trigger items_lineage_one_owner before insert or update on public.items
  for each row execute function public.garis_satu_pemilik('supersedes_item_id');
create trigger courses_lineage_one_owner before insert or update on public.courses
  for each row execute function public.garis_satu_pemilik('supersedes_course_id');
create trigger modules_lineage_one_owner before insert or update on public.modules
  for each row execute function public.garis_satu_pemilik('supersedes_module_id');
create trigger lessons_lineage_one_owner before insert or update on public.lessons
  for each row execute function public.garis_satu_pemilik('supersedes_lesson_id');

-- ═══════════════════════════════════════════════════════════ a checked draft that is edited is checked again
insert into public.content_status_transitions (from_status, to_status, note) values
  ('VALIDATED', 'STRUCTURED', 'C1w: a draft that passed its check and is then edited in the app goes back to be checked again; only inside the draft editor''s functions (pintar.suntingan_draf)');
do $$
declare v_def text := pg_get_functiondef('public.enforce_content_status()'::regprocedure);
        v_old text := E'and coalesce(current_setting(''pintar.kirim_balik'', true), '''') <> ''ya'') then';
begin
  if position(v_old in v_def) = 0 then raise exception 'C1w: enforce_content_status no longer guards the send-back edge where it did'; end if;
  execute replace(v_def, v_old,
    E'and coalesce(current_setting(''pintar.kirim_balik'', true), '''') <> ''ya'')\n'
    || E'       -- C1w: VALIDATED -> STRUCTURED is the draft editor''s own edge, legal only inside its functions\n'
    || E'       or (old.status = ''VALIDATED'' and new.status = ''STRUCTURED''\n'
    || E'           and coalesce(current_setting(''pintar.suntingan_draf'', true), '''') <> ''ya'') then');
end $$;

-- ═══════════════════════════════════════════════════════════ small questions every act asks
create or replace function public.soal_kursus(p_item uuid)
returns uuid language sql stable security definer set search_path = public, pg_temp as $$
  select m.course_id from public.items i join public.lessons l on l.id = i.lesson_id join public.modules m on m.id = l.module_id
   where i.id = p_item
$$;
revoke all on function public.soal_kursus(uuid) from public, anon, authenticated;

-- A question's key: its correct labels, sorted.
create or replace function public.soal_kunci(p_item uuid)
returns text[] language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce(array_agg(o.label order by o.label collate "C"), '{}'::text[])
    from public.item_options o where o.item_id = p_item and o.is_correct
$$;
revoke all on function public.soal_kunci(uuid) from public, anon, authenticated;

-- What a learner reads of a question, without its key: its type, stem, stimulus and each option's label and text.
create or replace function public.soal_sidik_isi(p_item uuid)
returns text language sql stable security definer set search_path = public, pg_temp as $$
  select md5(coalesce(i.item_type::text, '') || chr(31) || coalesce(i.stem, '') || chr(31) || coalesce(i.stimulus, '') || chr(31)
             || coalesce((select string_agg(o.label || chr(30) || o.body, chr(29) order by o.label collate "C")
                            from public.item_options o where o.item_id = i.id), ''))
    from public.items i where i.id = p_item
$$;
revoke all on function public.soal_sidik_isi(uuid) from public, anon, authenticated;

-- The head of a course's line: the course with no successor still standing (a discarded draft is not one).
create or replace function public.kursus_kepala(p_course uuid)
returns uuid language sql stable security definer set search_path = public, pg_temp as $$
  with recursive down as (
    select c.id, 0 as d from public.courses c where c.id = p_course
    union all
    select c.id, down.d + 1 from public.courses c join down on c.supersedes_course_id = down.id
     where c.discarded_at is null and down.d < 64)
  select id from down order by d desc limit 1
$$;
revoke all on function public.kursus_kepala(uuid) from public, anon, authenticated;

-- May the caller author in this course's school (the platform library: the platform admin).
create or replace function public.draf_boleh_tulis(p_institution uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select public.can_in_institution('CAN_DRAFT', p_institution)
     and (not exists (select 1 from public.institutions x where x.id = p_institution and x.tenant_kind = 'PLATFORM_CANONICAL')
          or public.is_system_admin())
$$;
revoke all on function public.draf_boleh_tulis(uuid) from public, anon, authenticated;

-- The draft a draft act works on, under its row lock (every act on one draft waits for the one before it), refused
-- for a caller who may not author there and for a package that is with its reviewer or sealed.
create or replace function public.draf_kunci(p_course uuid)
returns public.courses language plpgsql security definer set search_path = public, pg_temp as $$
declare c public.courses;
begin
  if public.current_person_id() is null then perform public.soal_tolak('DRAFT_NOT_ALLOWED'); end if;
  select * into c from public.courses where id = p_course;
  if c.id is null or c.discarded_at is not null then perform public.soal_tolak('DRAFT_UNKNOWN'); end if;
  if not public.draf_boleh_tulis(c.institution_id) then perform public.soal_tolak('DRAFT_NOT_ALLOWED'); end if;
  select * into c from public.courses where id = p_course for update;
  if public.content_is_sealed(c.id) then perform public.soal_tolak('DRAFT_SEALED'); end if;
  if c.status not in ('INGESTED', 'STRUCTURED', 'VALIDATED', 'VALIDATION_FAILED') then
    perform public.soal_tolak('DRAFT_SUBMITTED');
  end if;
  return c;
end $$;
revoke all on function public.draf_kunci(uuid) from public, anon, authenticated;

-- A checked draft that is changed goes back to be checked (VALIDATED -> STRUCTURED, the whole package as one step).
create or replace function public.draf_kembali_periksa(p_course uuid)
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
declare c public.courses;
begin
  select * into c from public.courses where id = p_course;
  if c.status <> 'VALIDATED' then return false; end if;
  perform set_config('pintar.suntingan_draf', 'ya', true);
  perform public.langkah_konten(p_course, 'STRUCTURED');
  perform set_config('pintar.suntingan_draf', '', true);
  perform public.audit_write('content.draft_returned_to_check', 'courses', p_course::text, c.institution_id,
    jsonb_build_object('course', p_course, 'from_state', 'VALIDATED', 'to_state', 'STRUCTURED',
                       'why', 'edited after its check'));
  return true;
end $$;
revoke all on function public.draf_kembali_periksa(uuid) from public, anon, authenticated;

-- Every problem of a question as the editor sends it, at once. The upload's own codes where the upload knows the same
-- problem (lesson_package_check), so a screen says it in the same words; two of the editor's own.
--   p_soal: {stem, options: [{label, body, is_correct, rationale, misconception_code}], objective_ids?, use?}
create or replace function public.soal_draf_masalah(p_course uuid, p_institution uuid, p_type public.item_type, p_soal jsonb)
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v jsonb := '[]'::jsonb; o jsonb; v_n int; v_key int := 0; v_labels text[] := '{}'; v_t text; x text;
begin
  if length(coalesce(p_soal ->> 'stimulus', '')) > 8000 then v := v || jsonb_build_object('code', 'TEXT_TOO_LONG', 'field', 'stimulus'); end if;
  v_t := nullif(btrim(coalesce(p_soal ->> 'stem', '')), '');
  if v_t is null then v := v || jsonb_build_object('code', 'ITEM_QUESTION_MISSING', 'field', 'stem');
  elsif length(v_t) > 4000 then v := v || jsonb_build_object('code', 'TEXT_TOO_LONG', 'field', 'stem'); end if;
  if jsonb_typeof(p_soal -> 'options') is distinct from 'array' then
    return v || jsonb_build_object('code', 'ITEM_OPTIONS_TOO_FEW', 'field', 'options');
  end if;
  v_n := jsonb_array_length(p_soal -> 'options');
  if v_n < 2 then v := v || jsonb_build_object('code', 'ITEM_OPTIONS_TOO_FEW', 'field', 'options');
  elsif v_n > 5 then v := v || jsonb_build_object('code', 'ITEM_OPTIONS_TOO_MANY', 'field', 'options'); end if;
  for o in select * from jsonb_array_elements(p_soal -> 'options') loop
    if jsonb_typeof(o) is distinct from 'object' then
      v := v || jsonb_build_object('code', 'OPTION_TEXT_MISSING', 'field', 'options'); continue;
    end if;
    v_t := upper(btrim(coalesce(o ->> 'label', '')));
    if v_t !~ '^[A-E]$' then v := v || jsonb_build_object('code', 'OPTION_LABEL_INVALID', 'field', 'label', 'label', v_t);
    elsif v_t = any (v_labels) then v := v || jsonb_build_object('code', 'OPTION_LABEL_REPEATED', 'field', 'label', 'label', v_t);
    else v_labels := v_labels || v_t; end if;
    if nullif(btrim(coalesce(o ->> 'body', '')), '') is null then
      v := v || jsonb_build_object('code', 'OPTION_TEXT_MISSING', 'field', 'body', 'label', v_t);
    elsif length(btrim(o ->> 'body')) > 2000 then v := v || jsonb_build_object('code', 'TEXT_TOO_LONG', 'field', 'body', 'label', v_t); end if;
    if nullif(btrim(coalesce(o ->> 'rationale', '')), '') is null then
      v := v || jsonb_build_object('code', 'OPTION_REASON_MISSING', 'field', 'rationale', 'label', v_t);
    elsif length(btrim(o ->> 'rationale')) > 2000 then v := v || jsonb_build_object('code', 'TEXT_TOO_LONG', 'field', 'rationale', 'label', v_t); end if;
    if jsonb_typeof(o -> 'is_correct') = 'boolean' then
      if (o ->> 'is_correct')::boolean then v_key := v_key + 1; end if;
    elsif o ? 'is_correct' and jsonb_typeof(o -> 'is_correct') <> 'null' then
      v := v || jsonb_build_object('code', 'OPTION_CORRECT_INVALID', 'field', 'is_correct', 'label', v_t);
    end if;
    x := nullif(btrim(coalesce(o ->> 'misconception_code', '')), '');
    if x is not null and not exists (select 1 from public.misconception_taxonomy t where t.institution_id = p_institution and t.code = x) then
      v := v || jsonb_build_object('code', 'OPTION_MISCONCEPTION_UNKNOWN', 'field', 'misconception_code', 'label', v_t);
    end if;
  end loop;
  if v_n >= 2 and v_key = 0 then v := v || jsonb_build_object('code', 'ITEM_CORRECT_MISSING', 'field', 'options');
  elsif p_type = 'MCQ_SINGLE' and v_key > 1 then v := v || jsonb_build_object('code', 'ITEM_CORRECT_TOO_MANY', 'field', 'options'); end if;
  if p_soal ? 'objective_ids' then
    if jsonb_typeof(p_soal -> 'objective_ids') is distinct from 'array'
       or exists (select 1 from jsonb_array_elements_text(p_soal -> 'objective_ids') e
                   where e !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
                      or not exists (select 1 from public.learning_objectives lo join public.lessons l on l.id = lo.lesson_id
                                       join public.modules m on m.id = l.module_id
                                      where lo.id = e::uuid and m.course_id = p_course)) then
      v := v || jsonb_build_object('code', 'ITEM_OBJECTIVE_UNKNOWN', 'field', 'objective_ids');
    end if;
  end if;
  return v;
end $$;
revoke all on function public.soal_draf_masalah(uuid, uuid, public.item_type, jsonb) from public, anon, authenticated;

-- What a save changes, by name: the stem; each option added, removed or rewritten; the key's labels before and after;
-- each option whose rationale or misconception moved; whether the objectives moved. Never the text.
create or replace function public.soal_beda(p_old_item uuid, p_new jsonb)
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare i public.items; v_opts jsonb := '[]'::jsonb; v_rat jsonb := '[]'::jsonb; v_mis jsonb := '[]'::jsonb; r record;
        v_old_key text[]; v_new_key text[]; v_obj boolean := false;
begin
  select * into i from public.items where id = p_old_item;
  for r in
    with lama as (select o.label, o.body, o.rationale, o.misconception_code from public.item_options o where o.item_id = p_old_item),
         baru as (select upper(btrim(x ->> 'label')) as label, btrim(x ->> 'body') as body, btrim(x ->> 'rationale') as rationale,
                         nullif(btrim(coalesce(x ->> 'misconception_code', '')), '') as misconception_code
                    from jsonb_array_elements(p_new -> 'options') x)
    select coalesce(b.label, l.label) as label,
           case when l.label is null then 'ADDED' when b.label is null then 'REMOVED'
                when l.body is distinct from b.body then 'CHANGED' end as kind,
           (l.label is not null and b.label is not null and l.rationale is distinct from b.rationale) as rat,
           (l.label is not null and b.label is not null and l.misconception_code is distinct from b.misconception_code) as mis
      from lama l full join baru b on b.label = l.label
     order by coalesce(b.label, l.label) collate "C"
  loop
    if r.kind is not null then v_opts := v_opts || jsonb_build_object('label', r.label, 'kind', r.kind); end if;
    if r.rat then v_rat := v_rat || to_jsonb(r.label); end if;
    if r.mis then v_mis := v_mis || to_jsonb(r.label); end if;
  end loop;
  v_old_key := public.soal_kunci(p_old_item);
  select coalesce(array_agg(upper(btrim(x ->> 'label')) order by upper(btrim(x ->> 'label')) collate "C"), '{}')
    into v_new_key from jsonb_array_elements(p_new -> 'options') x where coalesce((x ->> 'is_correct')::boolean, false);
  if p_new ? 'objective_ids' then
    v_obj := (select coalesce(array_agg(e::uuid order by e), '{}') from jsonb_array_elements_text(p_new -> 'objective_ids') e)
             is distinct from (select coalesce(array_agg(o order by o), '{}') from unnest(i.objective_ids) o);
  end if;
  return jsonb_strip_nulls(jsonb_build_object(
    -- Daisy Q5 field 1, «Bacaan»: changed only when the editor sent one (a workbook-era caller that omits it changes nothing)
    'stimulus', case when p_new ? 'stimulus' and i.stimulus is distinct from nullif(btrim(coalesce(p_new ->> 'stimulus', '')), '') then true end,
    'stem', case when i.stem is distinct from btrim(p_new ->> 'stem') then true end,
    'options', case when jsonb_array_length(v_opts) > 0 then v_opts end,
    'key', case when v_old_key is distinct from v_new_key then jsonb_build_object('from', to_jsonb(v_old_key), 'to', to_jsonb(v_new_key)) end,
    'rationale', case when jsonb_array_length(v_rat) > 0 then v_rat end,
    'misconception', case when jsonb_array_length(v_mis) > 0 then v_mis end,
    'objectives', case when v_obj then true end));
end $$;
revoke all on function public.soal_beda(uuid, jsonb) from public, anon, authenticated;

-- The options as the editor sends them, written for one question (its own write: one revision for the whole save).
create or replace function public.soal_tulis_pilihan(p_item uuid, p_institution uuid, p_soal jsonb)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  perform set_config('pintar.suntingan_soal', p_item::text, true);
  delete from public.item_options where item_id = p_item;
  insert into public.item_options (item_id, institution_id, label, body, is_correct, rationale, misconception_code)
  select p_item, p_institution, upper(btrim(x ->> 'label')), btrim(x ->> 'body'), coalesce((x ->> 'is_correct')::boolean, false),
         btrim(x ->> 'rationale'), nullif(btrim(coalesce(x ->> 'misconception_code', '')), '')
    from jsonb_array_elements(p_soal -> 'options') x;
  perform set_config('pintar.suntingan_soal', '', true);
end $$;
revoke all on function public.soal_tulis_pilihan(uuid, uuid, jsonb) from public, anon, authenticated;

-- ═══════════════════════════════════════════════════════════ (1) the editor
-- Edit one question of a draft. p_revisi is the revision the editor read; anything saved since refuses this save.
create or replace function public.ubah_soal_draf(p_item uuid, p_revisi integer, p_soal jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_me uuid := public.current_person_id(); i public.items; c public.courses; v_masalah jsonb; v_beda jsonb;
        v_kembali boolean; v_obj uuid[];
begin
  if v_me is null then perform public.soal_tolak('DRAFT_NOT_ALLOWED'); end if;
  if jsonb_typeof(p_soal) is distinct from 'object' then perform public.soal_tolak('DRAFT_SHAPE_INVALID'); end if;
  select * into i from public.items where id = p_item;
  if i.id is null then perform public.soal_tolak('DRAFT_UNKNOWN'); end if;
  c := public.draf_kunci(public.soal_kursus(p_item));
  select * into i from public.items where id = p_item for update;
  if i.id is null then perform public.soal_tolak('DRAFT_UNKNOWN'); end if;
  if p_revisi is distinct from i.revision then perform public.soal_tolak('DRAFT_EDIT_CONFLICT'); end if;
  v_masalah := public.soal_draf_masalah(c.id, c.institution_id, i.item_type, p_soal);
  if jsonb_array_length(v_masalah) > 0 then
    return jsonb_build_object('ok', false, 'item', p_item, 'revisi', i.revision, 'masalah', v_masalah);
  end if;
  v_beda := public.soal_beda(p_item, p_soal);
  if v_beda = '{}'::jsonb then
    return jsonb_build_object('ok', true, 'item', p_item, 'revisi', i.revision, 'berubah', false, 'kembali_ke_periksa', false);
  end if;
  v_kembali := public.draf_kembali_periksa(c.id);
  if p_soal ? 'objective_ids' then
    select coalesce(array_agg(e::uuid), '{}') into v_obj from jsonb_array_elements_text(p_soal -> 'objective_ids') e;
  else
    v_obj := i.objective_ids;
  end if;
  perform public.soal_tulis_pilihan(p_item, c.institution_id, p_soal);
  update public.items set stem = btrim(p_soal ->> 'stem'), objective_ids = v_obj,
         stimulus = case when p_soal ? 'stimulus' then nullif(btrim(coalesce(p_soal ->> 'stimulus', '')), '') else i.stimulus end,
         revision = i.revision + 1, edited_at = now(), edited_by_person_id = v_me
   where id = p_item;
  insert into public.item_draft_edits (institution_id, course_id, item_id, action, revision_from, revision_to, changed, by_person_id)
  values (c.institution_id, c.id, p_item, 'ITEM_EDITED', i.revision, i.revision + 1, v_beda, v_me);
  perform public.audit_write('content.item_edited', 'items', p_item::text, c.institution_id,
    jsonb_build_object('course', c.id, 'item', p_item, 'from', jsonb_build_object('revision', i.revision),
                       'to', jsonb_build_object('revision', i.revision + 1), 'changed', v_beda, 'returned_to_check', v_kembali));
  return jsonb_build_object('ok', true, 'item', p_item, 'revisi', i.revision + 1, 'berubah', true, 'perubahan', v_beda,
                            'kembali_ke_periksa', v_kembali);
end $$;
revoke all on function public.ubah_soal_draf(uuid, integer, jsonb) from public, anon, authenticated;
grant execute on function public.ubah_soal_draf(uuid, integer, jsonb) to authenticated;

-- Content steps a new question takes to stand where its draft stands (it is written at INGESTED, as every row is).
create or replace function public.draf_jalur_status(p_to public.content_status)
returns public.content_status[] language sql immutable set search_path = public, pg_temp as $$
  select case p_to
    when 'INGESTED' then '{}'::public.content_status[]
    when 'STRUCTURED' then array['STRUCTURED']::public.content_status[]
    when 'VALIDATED' then array['STRUCTURED', 'VALIDATED']::public.content_status[]
    when 'VALIDATION_FAILED' then array['STRUCTURED', 'VALIDATED', 'VALIDATION_FAILED']::public.content_status[] end
$$;
revoke all on function public.draf_jalur_status(public.content_status) from public, anon, authenticated;

-- Add a question to a lesson of a draft. p_soal.use is null (practice), PRE_TEST or POST_TEST, as the workbook's «use».
create or replace function public.tambah_soal_draf(p_lesson uuid, p_soal jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_me uuid := public.current_person_id(); c public.courses; v_course uuid; v_masalah jsonb; v_use text; v_item uuid;
        v_type public.item_type; v_obj uuid[]; v_def uuid; v_kembali boolean; st public.content_status; v_beda jsonb;
begin
  if v_me is null then perform public.soal_tolak('DRAFT_NOT_ALLOWED'); end if;
  if jsonb_typeof(p_soal) is distinct from 'object' then perform public.soal_tolak('DRAFT_SHAPE_INVALID'); end if;
  select m.course_id into v_course from public.lessons l join public.modules m on m.id = l.module_id where l.id = p_lesson;
  if v_course is null then perform public.soal_tolak('DRAFT_UNKNOWN'); end if;
  c := public.draf_kunci(v_course);
  v_type := case when p_soal ->> 'item_type' = 'MCQ_MULTI' then 'MCQ_MULTI' else 'MCQ_SINGLE' end;
  v_masalah := public.soal_draf_masalah(c.id, c.institution_id, v_type, p_soal);
  v_use := nullif(btrim(coalesce(p_soal ->> 'use', '')), '');
  if v_use is not null and v_use not in ('PRE_TEST', 'POST_TEST') then
    v_masalah := v_masalah || jsonb_build_object('code', 'ITEM_USE_UNKNOWN', 'field', 'use');
  elsif v_use is not null then
    select d.id into v_def from public.assessment_definitions d
     where d.course_id = c.id and d.mode = v_use::public.assessment_mode and not d.is_ad_hoc
     order by d.version desc limit 1 for update;
    if v_def is null then v_masalah := v_masalah || jsonb_build_object('code', 'ITEM_USE_NO_TEST', 'field', 'use'); end if;
  end if;
  if jsonb_array_length(v_masalah) > 0 then return jsonb_build_object('ok', false, 'masalah', v_masalah); end if;
  v_kembali := public.draf_kembali_periksa(c.id);
  select * into c from public.courses where id = c.id;
  if p_soal ? 'objective_ids' then
    select coalesce(array_agg(e::uuid), '{}') into v_obj from jsonb_array_elements_text(p_soal -> 'objective_ids') e;
  else
    select coalesce(array_agg(lo.id order by lo.code), '{}') into v_obj from public.learning_objectives lo where lo.lesson_id = p_lesson;
  end if;
  insert into public.items (lesson_id, institution_id, item_type, bank_type, stem, stimulus, objective_ids, cycle_role, author_person_id)
  values (p_lesson, c.institution_id, v_type, case when v_use is null then 'PRACTICE' else 'TEST' end::public.bank_type,
          btrim(p_soal ->> 'stem'), nullif(btrim(coalesce(p_soal ->> 'stimulus', '')), ''), v_obj, v_use::public.assessment_mode, v_me)
  returning id into v_item;
  perform public.soal_tulis_pilihan(v_item, c.institution_id, p_soal);
  foreach st in array public.draf_jalur_status(c.status) loop
    update public.items set status = st where id = v_item;
  end loop;
  if v_def is not null then
    update public.assessment_definitions set item_count = item_count + 1 where id = v_def;
  end if;
  update public.items set edited_at = now(), edited_by_person_id = v_me, revision = 1 where id = v_item;
  v_beda := jsonb_build_object('added', true, 'use', v_use);
  insert into public.item_draft_edits (institution_id, course_id, item_id, action, revision_from, revision_to, changed, by_person_id)
  values (c.institution_id, c.id, v_item, 'ITEM_ADDED', null, 1, v_beda, v_me);
  perform public.audit_write('content.item_added', 'items', v_item::text, c.institution_id,
    jsonb_build_object('course', c.id, 'lesson', p_lesson, 'item', v_item, 'use', v_use, 'from', null,
                       'to', jsonb_build_object('revision', 1, 'status', c.status), 'returned_to_check', v_kembali));
  return jsonb_build_object('ok', true, 'item', v_item, 'revisi', 1, 'kembali_ke_periksa', v_kembali);
end $$;
revoke all on function public.tambah_soal_draf(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.tambah_soal_draf(uuid, jsonb) to authenticated;

-- Remove one question of a draft (the revision the editor read, as an edit).
create or replace function public.hapus_soal_draf(p_item uuid, p_revisi integer)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_me uuid := public.current_person_id(); i public.items; c public.courses; v_def uuid; v_n int; v_kembali boolean;
begin
  if v_me is null then perform public.soal_tolak('DRAFT_NOT_ALLOWED'); end if;
  select * into i from public.items where id = p_item;
  if i.id is null then perform public.soal_tolak('DRAFT_UNKNOWN'); end if;
  c := public.draf_kunci(public.soal_kursus(p_item));
  select * into i from public.items where id = p_item for update;
  if i.id is null then perform public.soal_tolak('DRAFT_UNKNOWN'); end if;
  if p_revisi is distinct from i.revision then perform public.soal_tolak('DRAFT_EDIT_CONFLICT'); end if;
  if exists (select 1 from public.presented_items p where p.item_id = p_item)
     or exists (select 1 from public.quick_assessment_selections q where q.item_id = p_item)
     or exists (select 1 from public.question_health h where h.item_id = p_item)
     or exists (select 1 from public.items x where x.supersedes_item_id = p_item) then
    perform public.soal_tolak('DRAFT_IN_USE');
  end if;
  if i.cycle_role is not null then
    select d.id, d.item_count into v_def, v_n from public.assessment_definitions d
     where d.course_id = c.id and d.mode = i.cycle_role and not d.is_ad_hoc order by d.version desc limit 1 for update;
    if v_def is not null and v_n <= 1 then perform public.soal_tolak('DRAFT_LAST_TEST_QUESTION'); end if;
  end if;
  v_kembali := public.draf_kembali_periksa(c.id);
  delete from public.mcq_quality_findings where item_id = p_item;
  delete from public.coaching_findings where course_id = c.id and target_table = 'items' and target_id = p_item;
  delete from public.coaching_findings f where f.course_id = c.id and f.target_table = 'item_options'
     and f.target_id in (select o.id from public.item_options o where o.item_id = p_item);
  perform set_config('pintar.suntingan_soal', p_item::text, true);
  delete from public.item_options where item_id = p_item;
  perform set_config('pintar.suntingan_soal', '', true);
  delete from public.items where id = p_item;
  if v_def is not null then update public.assessment_definitions set item_count = item_count - 1 where id = v_def; end if;
  insert into public.item_draft_edits (institution_id, course_id, item_id, action, revision_from, revision_to, changed, by_person_id)
  values (c.institution_id, c.id, p_item, 'ITEM_REMOVED', i.revision, null, jsonb_build_object('removed', true), v_me);
  perform public.audit_write('content.item_removed', 'items', p_item::text, c.institution_id,
    jsonb_build_object('course', c.id, 'item', p_item, 'from', jsonb_build_object('revision', i.revision, 'use', i.cycle_role),
                       'to', null, 'returned_to_check', v_kembali));
  return jsonb_build_object('ok', true, 'item', p_item, 'kembali_ke_periksa', v_kembali);
end $$;
revoke all on function public.hapus_soal_draf(uuid, integer) from public, anon, authenticated;
grant execute on function public.hapus_soal_draf(uuid, integer) to authenticated;

-- Discard a whole draft: its content goes; its audit row and its attribution rows stay. Its course row goes too, unless
-- history that is never deleted names it (a review outcome, a revision note, an upload naming it), in which case that
-- row alone stays, emptied, marked discarded, and is no longer the head of its line.
create or replace function public.buang_draf(p_course uuid, p_catatan text default null)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_me uuid := public.current_person_id(); c public.courses; v_mods uuid[]; v_les uuid[]; v_items uuid[]; v_defs uuid[];
        n_item int; n_les int; v_simpan boolean := false; v_note text := nullif(btrim(coalesce(p_catatan, '')), '');
begin
  if v_note is not null and char_length(v_note) > 300 then perform public.soal_tolak('DRAFT_NOTE_TOO_LONG'); end if;
  c := public.draf_kunci(p_course);
  v_mods := array(select m.id from public.modules m where m.course_id = p_course);
  v_les := array(select l.id from public.lessons l where l.module_id = any (v_mods));
  v_items := array(select i.id from public.items i where i.lesson_id = any (v_les));
  v_defs := array(select d.id from public.assessment_definitions d where d.course_id = p_course or d.module_id = any (v_mods));
  if exists (select 1 from public.plp_releases r where r.course_id = p_course)
     or exists (select 1 from public.learning_assignments la where la.course_id = p_course)
     or exists (select 1 from public.certificate_templates t where t.course_id = p_course or t.module_id = any (v_mods))
     or exists (select 1 from public.school_pass_marks s where s.course_id = p_course)
     or exists (select 1 from public.courses x where x.supersedes_course_id = p_course and x.discarded_at is null)
     or exists (select 1 from public.assessment_assignments aa where aa.assessment_definition_id = any (v_defs))
     or exists (select 1 from public.assessment_sessions s where s.assessment_definition_id = any (v_defs))
     or exists (select 1 from public.quick_assessment_selections q where q.definition_id = any (v_defs) or q.item_id = any (v_items))
     or exists (select 1 from public.lesson_progress p where p.lesson_id = any (v_les))
     or exists (select 1 from public.lesson_review_items r where r.lesson_id = any (v_les))
     or exists (select 1 from public.presented_items p where p.item_id = any (v_items))
     or exists (select 1 from public.question_health h where h.item_id = any (v_items))
     or exists (select 1 from public.items x where x.supersedes_item_id = any (v_items) and not (x.id = any (v_items))) then
    perform public.soal_tolak('DRAFT_IN_USE');
  end if;
  n_item := coalesce(array_length(v_items, 1), 0); n_les := coalesce(array_length(v_les, 1), 0);
  delete from public.mcq_quality_findings where course_id = p_course;
  delete from public.coaching_findings where course_id = p_course;
  perform set_config('pintar.suntingan_soal', '*', true);
  delete from public.item_options where item_id = any (v_items);
  perform set_config('pintar.suntingan_soal', '', true);
  delete from public.items where id = any (v_items);
  delete from public.assessment_definitions where id = any (v_defs);
  delete from public.learning_objectives where lesson_id = any (v_les);
  delete from public.lessons where id = any (v_les);
  delete from public.modules where id = any (v_mods);
  begin
    delete from public.courses where id = p_course;
  exception when foreign_key_violation then
    v_simpan := true;
    update public.courses set discarded_at = now(), discarded_by_person_id = v_me where id = p_course;
  end;
  insert into public.item_draft_edits (institution_id, course_id, item_id, action, changed, by_person_id, note)
  values (c.institution_id, p_course, null, 'DRAFT_DISCARDED',
          jsonb_build_object('items', n_item, 'lessons', n_les, 'record_kept', v_simpan), v_me, v_note);
  perform public.audit_write('content.draft_discarded', 'courses', p_course::text, c.institution_id,
    jsonb_build_object('course', p_course, 'from', jsonb_build_object('status', c.status, 'items', n_item, 'lessons', n_les),
                       'to', jsonb_build_object('content', 'none', 'course_row', case when v_simpan then 'kept_as_record' else 'removed' end),
                       'reason', v_note));
  return jsonb_build_object('ok', true, 'course', p_course, 'soal', n_item, 'catatan_disimpan', v_simpan);
end $$;
revoke all on function public.buang_draf(uuid, text) from public, anon, authenticated;
grant execute on function public.buang_draf(uuid, text) to authenticated;

-- The editor's read: each question of a draft with its revision and its last save (who, when); the draft's own count.
create or replace function public.suntingan_draf(p_course uuid)
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare c public.courses;
begin
  select * into c from public.courses where id = p_course;
  if c.id is null or not (public.draf_boleh_tulis(c.institution_id) or public.can_in_institution('CAN_REVIEW', c.institution_id)) then
    perform public.soal_tolak('DRAFT_UNKNOWN');
  end if;
  return jsonb_build_object(
    'course', c.id, 'status', c.status, 'dapat_diubah', c.status in ('INGESTED', 'STRUCTURED', 'VALIDATED', 'VALIDATION_FAILED')
                                                     and not public.content_is_sealed(c.id) and c.discarded_at is null,
    'jumlah_suntingan', (select count(*) from public.item_draft_edits e where e.course_id = c.id and e.action <> 'DRAFT_DISCARDED'),
    'soal', coalesce((select jsonb_agg(jsonb_build_object('item', i.id, 'revisi', i.revision, 'diubah_pada', i.edited_at,
                        'diubah_oleh', i.edited_by_person_id, 'nama_pengubah', p.display_name) order by m.ordinal, l.ordinal, i.created_at, i.id)
                       from public.items i join public.lessons l on l.id = i.lesson_id join public.modules m on m.id = l.module_id
                       left join public.persons p on p.id = i.edited_by_person_id
                      where m.course_id = c.id), '[]'::jsonb));
end $$;
revoke all on function public.suntingan_draf(uuid) from public, anon, authenticated;
grant execute on function public.suntingan_draf(uuid) to authenticated;

-- Studio's counts hide a discarded draft too (the list does, src/app/studio/page.tsx): a draft kept only as a record is
-- no package, and a discarded revision replaces nothing, so its predecessor stays the line's newest.
do $$
declare v_def text := pg_get_functiondef('public.studio_home()'::regprocedure); v_n int;
begin
  v_n := (length(v_def) - length(replace(v_def, 'where n.supersedes_course_id = c.id)', ''))) / length('where n.supersedes_course_id = c.id)');
  if v_n < 1 or position('where n.supersedes_course_id = f.course_id)' in v_def) = 0 then
    raise exception 'C1w: studio_home no longer counts a line''s newest package where it did';
  end if;
  v_def := replace(v_def, 'where n.supersedes_course_id = c.id)', 'where n.supersedes_course_id = c.id and n.discarded_at is null) and c.discarded_at is null');
  v_def := replace(v_def, 'where n.supersedes_course_id = f.course_id)', 'where n.supersedes_course_id = f.course_id and n.discarded_at is null)');
  execute v_def;
end $$;

-- ═══════════════════════════════════════════════════════════ (2) a question's identity on upload
create or replace function public.soal_dari_identitas(p_value text)
returns uuid language sql immutable set search_path = public, pg_temp as $$
  select case when btrim(coalesce(p_value, '')) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
              then btrim(p_value)::uuid end
$$;
revoke all on function public.soal_dari_identitas(text) from public, anon, authenticated;

-- Every row whose identity cannot stand, at its sheet and row. Another school's question is answered as an unknown
-- one: nothing tells an uploader that a value exists elsewhere.
create or replace function public.package_identity_problems(b public.ingest_batches)
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v jsonb := '[]'::jsonb; c jsonb; m jsonb; l jsonb; i jsonb; ci int := 0; mi int; li int; ii int;
        v_path text; v_t text; v_id uuid; v_x record; v_seen uuid[] := '{}';
begin
  if jsonb_typeof(b.raw_payload -> 'courses') is distinct from 'array' then return v; end if;
  for c in select * from jsonb_array_elements(b.raw_payload -> 'courses') loop
    ci := ci + 1; mi := 0;
    for m in select * from jsonb_array_elements(public.package_array(c, 'modules')) loop
      mi := mi + 1; li := 0;
      for l in select * from jsonb_array_elements(public.package_array(m, 'lessons')) loop
        li := li + 1; ii := 0;
        for i in select * from jsonb_array_elements(public.package_array(l, 'items')) loop
          ii := ii + 1;
          continue when jsonb_typeof(i) is distinct from 'object';
          v_t := public.package_text(i, 'identity');
          continue when v_t is null;
          v_path := format('courses[%s].modules[%s].lessons[%s].items[%s]', ci - 1, mi - 1, li - 1, ii - 1);
          v_id := public.soal_dari_identitas(v_t);
          if b.revises_course_id is null then
            v := v || public.package_problem('ITEM_IDENTITY_NO_PREDECESSOR', i, v_path, 'identity'); continue;
          end if;
          select x.id, x.institution_id, public.soal_kursus(x.id) as course into v_x from public.items x where x.id = v_id;
          if v_x.id is null or v_x.institution_id is distinct from b.institution_id then
            v := v || public.package_problem('ITEM_IDENTITY_UNKNOWN', i, v_path, 'identity');
          elsif v_x.course is distinct from b.revises_course_id then
            if exists (select 1 from public.course_lineage_chain(b.revises_course_id) k where k.course_id = v_x.course) then
              v := v || public.package_problem('ITEM_IDENTITY_NOT_PREDECESSOR', i, v_path, 'identity');
            else
              v := v || public.package_problem('ITEM_IDENTITY_OTHER_COURSE', i, v_path, 'identity');
            end if;
          elsif v_id = any (v_seen) then
            v := v || public.package_problem('ITEM_IDENTITY_REPEATED', i, v_path, 'identity');
          else
            v_seen := v_seen || v_id;
          end if;
        end loop;
      end loop;
    end loop;
  end loop;
  return v;
end $$;
revoke all on function public.package_identity_problems(public.ingest_batches) from public, anon, authenticated;

-- The question an uploaded row revises, for the materialiser. Every path that materialises a package asks this one
-- function, and a value that cannot stand refuses the whole upload here too: it is never a new question.
create or replace function public.package_identity_item(b public.ingest_batches, i jsonb)
returns uuid language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_t text := public.package_text(i, 'identity'); v_id uuid;
begin
  if v_t is null then return null; end if;
  v_id := public.soal_dari_identitas(v_t);
  if b.revises_course_id is null or v_id is null
     or not exists (select 1 from public.items x where x.id = v_id and x.institution_id = b.institution_id
                      and public.soal_kursus(x.id) = b.revises_course_id) then
    raise exception using errcode = 'PR030', detail = 'PACKAGE_INVALID',
      message = 'a question''s identity does not name a question of the course this upload revises; prepare_ingest_batch names it';
  end if;
  return v_id;
end $$;
revoke all on function public.package_identity_item(public.ingest_batches, jsonb) from public, anon, authenticated;

-- D-085 M10's correction problems, with the identity column's (above) and a discarded draft no longer the line's
-- newest. Every other line is 20261213100000's.
create or replace function public.package_revision_problems(b public.ingest_batches)
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare t public.courses; v jsonb := '[]'::jsonb;
begin
  if b.revises_course_id is null then return public.package_identity_problems(b); end if;
  select * into t from public.courses where id = b.revises_course_id;
  if t.id is null or t.institution_id is distinct from b.institution_id or t.discarded_at is not null then
    return jsonb_build_array(jsonb_build_object('code', 'REVISION_COURSE_UNKNOWN'));
  end if;
  -- W1.6 (Batch 1): a draft a reviewer sent back is corrected in its line too, exactly as a released course is
  if not public.content_is_sealed(t.id) and not public.paket_dikembalikan(t.id) then
    v := v || jsonb_build_array(jsonb_build_object('code', 'REVISION_NOT_RELEASED'));
  end if;
  if exists (select 1 from public.courses x where x.supersedes_course_id = t.id and x.discarded_at is null) then
    v := v || jsonb_build_array(jsonb_build_object('code', 'REVISION_NOT_LATEST'));
  end if;
  if jsonb_typeof(b.raw_payload -> 'courses') <> 'array' or jsonb_array_length(b.raw_payload -> 'courses') <> 1 then
    v := v || jsonb_build_array(jsonb_build_object('code', 'REVISION_ONE_COURSE'));
  end if;
  if char_length(btrim(coalesce(b.change_summary, ''))) not between 10 and 1000 then
    v := v || jsonb_build_array(jsonb_build_object('code', 'REVISION_SUMMARY_MISSING'));
  end if;
  return v || public.package_identity_problems(b);
end $$;
revoke all on function public.package_revision_problems(public.ingest_batches) from public, anon, authenticated;

-- The materialiser writes each row's lineage pointer at insert, from the identity the check accepted.
do $$
declare v_def text := pg_get_functiondef('public.lesson_package_materialise(uuid)'::regprocedure);
        v_a text := 'objective_ids, parallel_group, predicted_difficulty, cycle_role, author_person_id)';
        v_b text := 'v_use::public.assessment_mode, b.confirmed_by_person_id)';
begin
  if (length(v_def) - length(replace(v_def, v_a, ''))) / length(v_a) <> 1
     or (length(v_def) - length(replace(v_def, v_b, ''))) / length(v_b) <> 1 then
    raise exception 'C1w: lesson_package_materialise no longer writes a question where it did';
  end if;
  v_def := replace(v_def, v_a, 'objective_ids, parallel_group, predicted_difficulty, cycle_role, author_person_id, supersedes_item_id)');
  v_def := replace(v_def, v_b, 'v_use::public.assessment_mode, b.confirmed_by_person_id, public.package_identity_item(b, i))');
  execute v_def;
end $$;

-- An upload over a draft edited in the app (the course it revises has in-app saves): how many, the last, by whom.
create or replace function public.unggah_menimpa_suntingan(p_batch uuid)
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare b public.ingest_batches; e record;
begin
  b := public.package_batch(p_batch);
  if b.revises_course_id is null then return jsonb_build_object('ada', false, 'jumlah', 0); end if;
  select count(*) as n, max(x.at) as terakhir,
         (select p.display_name from public.item_draft_edits y join public.persons p on p.id = y.by_person_id
           where y.course_id = b.revises_course_id order by y.at desc limit 1) as oleh
    into e from public.item_draft_edits x where x.course_id = b.revises_course_id and x.action <> 'DRAFT_DISCARDED';
  return jsonb_build_object('ada', e.n > 0, 'jumlah', e.n, 'course', b.revises_course_id, 'terakhir_pada', e.terakhir, 'terakhir_oleh', e.oleh);
end $$;
revoke all on function public.unggah_menimpa_suntingan(uuid) from public, anon, authenticated;
grant execute on function public.unggah_menimpa_suntingan(uuid) to authenticated;

-- ═══════════════════════════════════════════════════════════ (3) a revision of the head, one question at a time
-- The successor's course row: the predecessor's subject, stage, grade, title and learning_context (20260928100000),
-- at INGESTED, authored by p_actor, in its line.
create or replace function public.kursus_penerus(p_course uuid, p_actor uuid)
returns uuid language sql security definer set search_path = public, pg_temp as $$
  insert into public.courses (institution_id, subject, stage, grade_label, title, status, author_person_id, supersedes_course_id, learning_context)
  select c.institution_id, c.subject, c.stage, c.grade_label, c.title, 'INGESTED', p_actor, c.id, c.learning_context
    from public.courses c where c.id = p_course
  returning id
$$;
revoke all on function public.kursus_penerus(uuid, uuid) from public, anon, authenticated;

-- The copy of the tree under that row, as 20261105100000 wrote it inside create_course_revision, now with its author
-- given: the caller for an ordinary revision; for a governed correction (C1w part two) the content owner who proposed
-- it, for every row, so the second person who confirms it reviews a revision that is never their own.
create or replace function public.salin_kursus_revisi(p_course uuid, p_new_course uuid, p_actor uuid, p_satu_penulis boolean)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare
  src record; v_new_course uuid := p_new_course;
  v_mod record; v_new_mod uuid; v_les record; v_new_les uuid;
  v_lo record; v_it record; v_new_item uuid; v_def record; v_version int;
  v_obj uuid[]; v_pg uuid;
  v_lo_map jsonb := '{}'::jsonb;
  v_pg_map jsonb := '{}'::jsonb;
  n_mod int := 0; n_les int := 0; n_lo int := 0; n_item int := 0; n_opt int := 0; n_def int := 0;
begin
  select * into src from public.courses where id = p_course;

  for v_mod in select * from public.modules where course_id = p_course order by ordinal loop
    insert into public.modules
      (course_id, institution_id, ordinal, title, status, author_person_id, supersedes_module_id)
    values (v_new_course, src.institution_id, v_mod.ordinal, v_mod.title, 'INGESTED',
            case when p_satu_penulis then p_actor else coalesce(v_mod.author_person_id, p_actor) end, v_mod.id)
    returning id into v_new_mod;
    n_mod := n_mod + 1;

    for v_les in select * from public.lessons where module_id = v_mod.id order by ordinal loop
      insert into public.lessons
        (module_id, institution_id, ordinal, title, summary, body_markdown, worked_examples,
         media, source_version_id, page_citation, status, author_person_id, supersedes_lesson_id)
      values (v_new_mod, src.institution_id, v_les.ordinal, v_les.title, v_les.summary,
              v_les.body_markdown, v_les.worked_examples, v_les.media, v_les.source_version_id,
              v_les.page_citation, 'INGESTED',
              case when p_satu_penulis then p_actor else coalesce(v_les.author_person_id, p_actor) end, v_les.id)
      returning id into v_new_les;
      n_les := n_les + 1;

      for v_lo in select * from public.learning_objectives where lesson_id = v_les.id order by code loop
        insert into public.learning_objectives
          (lesson_id, institution_id, code, statement, bloom, is_core,
           supersedes_learning_objective_id)
        values (v_new_les, src.institution_id, v_lo.code, v_lo.statement, v_lo.bloom, v_lo.is_core,
                v_lo.id)
        returning id into v_pg;
        v_lo_map := v_lo_map || jsonb_build_object(v_lo.id::text, v_pg);
        n_lo := n_lo + 1;
      end loop;
    end loop;
  end loop;

  for v_it in
    select i.* from public.items i
      join public.lessons l on l.id = i.lesson_id
      join public.modules m on m.id = l.module_id
     where m.course_id = p_course
     order by i.created_at, i.id
  loop
    select array_agg(coalesce((v_lo_map ->> o::text)::uuid, o) order by ord)
      into v_obj
      from unnest(v_it.objective_ids) with ordinality as t(o, ord);

    if v_it.parallel_group is not null then
      if not (v_pg_map ? v_it.parallel_group::text) then
        v_pg_map := v_pg_map || jsonb_build_object(v_it.parallel_group::text, gen_random_uuid());
      end if;
      v_pg := (v_pg_map ->> v_it.parallel_group::text)::uuid;
    else
      v_pg := null;
    end if;

    -- empirical_difficulty, empirical_discrimination and empirical_evidence_count are DELIBERATELY ABSENT: the copy
    -- has no evidence of its own and must not claim another item's. cycle_role is copied (D-085 M10).
    insert into public.items
      (lesson_id, institution_id, item_type, bank_type, stem, stimulus, petunjuk, arah_berpikir,
       objective_ids, is_safety_critical, parallel_group, predicted_difficulty,
       source_version_id, page_citation, status, author_person_id, supersedes_item_id, cycle_role)
    select (select l2.id from public.lessons l2 where l2.supersedes_lesson_id = v_it.lesson_id
              and l2.institution_id = src.institution_id
              and exists (select 1 from public.modules m2
                           where m2.id = l2.module_id and m2.course_id = v_new_course)),
           src.institution_id, v_it.item_type, v_it.bank_type, v_it.stem, v_it.stimulus,
           v_it.petunjuk, v_it.arah_berpikir, coalesce(v_obj, '{}'::uuid[]),
           v_it.is_safety_critical, v_pg, v_it.predicted_difficulty,
           v_it.source_version_id, v_it.page_citation, 'INGESTED',
           case when p_satu_penulis then p_actor else coalesce(v_it.author_person_id, p_actor) end, v_it.id, v_it.cycle_role
    returning id into v_new_item;
    n_item := n_item + 1;

    insert into public.item_options
      (item_id, institution_id, label, body, is_correct, rationale, misconception_code)
    select v_new_item, src.institution_id, o.label, o.body, o.is_correct, o.rationale,
           o.misconception_code
      from public.item_options o where o.item_id = v_it.id order by o.label;
  end loop;

  select count(*) into n_opt from public.item_options io
    join public.items i on i.id = io.item_id
    join public.lessons l on l.id = i.lesson_id
    join public.modules m on m.id = l.module_id
   where m.course_id = v_new_course;

  for v_def in
    select d.* from public.assessment_definitions d
     where not d.is_ad_hoc
       and (d.course_id = p_course
         or d.module_id in (select id from public.modules where course_id = p_course))
  loop
    select coalesce(max(version), 0) + 1 into v_version
      from public.assessment_definitions
     where institution_id = src.institution_id and title = v_def.title and mode = v_def.mode;

    insert into public.assessment_definitions
      (institution_id, course_id, module_id, title, mode, bank_type, version, item_count,
       difficulty_mix, safety_critical_minimum, passing_rules, hesitation_window_seconds,
       shuffle_policy, allows_pause, offline_tolerant, late_sync_grace_seconds, attempt_limit,
       author_person_id, status, is_ad_hoc)
    values (src.institution_id,
            case when v_def.course_id is not null then v_new_course else null end,
            case when v_def.module_id is not null
                 then (select m2.id from public.modules m2
                        where m2.course_id = v_new_course and m2.supersedes_module_id = v_def.module_id)
                 else null end,
            v_def.title, v_def.mode, v_def.bank_type, v_version, v_def.item_count,
            v_def.difficulty_mix, v_def.safety_critical_minimum, v_def.passing_rules,
            v_def.hesitation_window_seconds, v_def.shuffle_policy, v_def.allows_pause,
            v_def.offline_tolerant, v_def.late_sync_grace_seconds, v_def.attempt_limit,
            case when p_satu_penulis then p_actor else coalesce(v_def.author_person_id, p_actor) end, 'INGESTED', false);
    n_def := n_def + 1;
  end loop;

  perform public.audit_write('COURSE_REVISION_CREATED', 'courses', v_new_course::text,
    src.institution_id,
    jsonb_build_object('source_course_id', p_course, 'new_course_id', v_new_course,
                       'modules', n_mod, 'lessons', n_les, 'learning_objectives', n_lo,
                       'items', n_item, 'item_options', n_opt, 'assessment_definitions', n_def,
                       'empirical_values_copied', 0));
  return v_new_course;
end $$;
revoke all on function public.salin_kursus_revisi(uuid, uuid, uuid, boolean) from public, anon, authenticated;

-- 20261105100000's checks, a revision of the head only (C1w), and the copy above. A discarded draft is not an open
-- revision and not a successor.
create or replace function public.create_course_revision(p_course uuid)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare src record; v_actor uuid; n_open int; v_new_course uuid;
begin
  v_actor := public.current_person_id();
  if v_actor is null then raise exception 'a revision requires an authenticated actor'; end if;

  select * into src from public.courses where id = p_course;
  if src.id is null then raise exception 'unknown course %', p_course; end if;

  if not public.can_in_institution('CAN_DRAFT', src.institution_id) then
    raise exception 'revising a course requires CAN_DRAFT in the owning institution';
  end if;

  -- An unsealed course is edited directly; a revision of it would produce two
  -- editable successors of the same thing and mean nothing.
  if not public.content_is_sealed(p_course) then
    raise exception 'this course is not sealed; edit it directly rather than revising it';
  end if;

  -- one revision at a time per course: two concurrent revisions are one
  perform 1 from public.courses where id = p_course for update;

  -- Two divergent open successors is a state with no correct resolution ("open" is content_is_sealed's question).
  select count(*) into n_open from public.courses c
   where c.supersedes_course_id = p_course and c.discarded_at is null
     and not public.content_is_sealed(c.id);
  if n_open > 0 then
    raise exception 'an open revision of this course already exists; finish or abandon it first';
  end if;
  -- C1w: only the head of the line is revised; a sealed successor means this course is history
  if exists (select 1 from public.courses c where c.supersedes_course_id = p_course and c.discarded_at is null) then
    perform public.soal_tolak('REVISION_NOT_HEAD');
  end if;

  -- The successor inherits `learning_context` from what it supersedes (20260928100000) and, since D-085 M10, each
  -- question's cycle_role (the copy below).
  insert into public.courses
    (institution_id, subject, stage, grade_label, title, status,
     author_person_id, supersedes_course_id, learning_context)
  values (src.institution_id, src.subject, src.stage, src.grade_label, src.title, 'INGESTED',
          v_actor, p_course, src.learning_context)
  returning id into v_new_course;
  return public.salin_kursus_revisi(p_course, v_new_course, v_actor, false);
end $$;
revoke all on function public.create_course_revision(uuid) from public, anon, authenticated;
grant execute on function public.create_course_revision(uuid) to authenticated;

-- Revise one question of a published package: a new revision of the line's head, every question pointing to its own
-- original, with what changes and why; the answer names the new course and the copy of this question, which the
-- author then edits (ubah_soal_draf) and takes through review, approval, lock and publication as today.
create or replace function public.revisi_soal(p_item uuid, p_ringkasan text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_me uuid := public.current_person_id(); v_course uuid; c public.courses; v_new uuid; v_copy uuid;
        v_sum text := btrim(coalesce(p_ringkasan, ''));
begin
  if v_me is null then perform public.soal_tolak('DRAFT_NOT_ALLOWED'); end if;
  v_course := public.soal_kursus(p_item);
  select * into c from public.courses where id = v_course;
  if c.id is null then perform public.soal_tolak('DRAFT_UNKNOWN'); end if;
  if not public.draf_boleh_tulis(c.institution_id) then perform public.soal_tolak('DRAFT_NOT_ALLOWED'); end if;
  if not exists (select 1 from public.plp_releases r where r.course_id = c.id and r.status = 'PUBLISHED') then
    perform public.soal_tolak('REVISION_NOT_PUBLISHED');
  end if;
  perform 1 from public.courses where id = c.id for update;
  if exists (select 1 from public.courses x where x.supersedes_course_id = c.id and x.discarded_at is null
               and not public.content_is_sealed(x.id)) then
    perform public.soal_tolak('REVISION_OPEN_EXISTS');
  end if;
  if public.kursus_kepala(c.id) <> c.id then perform public.soal_tolak('REVISION_NOT_HEAD'); end if;
  if char_length(v_sum) not between 10 and 1000 then perform public.soal_tolak('REVISION_SUMMARY_REQUIRED'); end if;
  v_new := public.create_course_revision(c.id);
  insert into public.course_revision_notes (course_id, institution_id, supersedes_course_id, summary, written_by_person_id)
  values (v_new, c.institution_id, c.id, v_sum, v_me);
  select i.id into v_copy from public.items i where i.supersedes_item_id = p_item and public.soal_kursus(i.id) = v_new;
  perform public.audit_write('content.question_revision_opened', 'courses', v_new::text, c.institution_id,
    jsonb_build_object('item', p_item, 'copy', v_copy, 'from', jsonb_build_object('course', c.id),
                       'to', jsonb_build_object('course', v_new), 'reason', v_sum));
  return jsonb_build_object('ok', true, 'course', v_new, 'item', v_copy, 'revisi', 1);
end $$;
revoke all on function public.revisi_soal(uuid, text) from public, anon, authenticated;
grant execute on function public.revisi_soal(uuid, text) to authenticated;

-- ═══════════════════════════════════════════════════════════ (4) a question's history
-- A hook part two fills: what a governed key correction says of a version (null here).
create or replace function public.riwayat_soal_koreksi(p_item uuid)
returns jsonb language sql stable security definer set search_path = public, pg_temp as $$ select null::jsonb $$;
revoke all on function public.riwayat_soal_koreksi(uuid) from public, anon, authenticated;

-- What changed from one version to the next, by name (the same words as a draft save's).
create or replace function public.soal_beda_versi(p_old uuid, p_new uuid)
returns jsonb language sql stable security definer set search_path = public, pg_temp as $$
  select public.soal_beda(p_old, jsonb_build_object(
    'stimulus', (select i.stimulus from public.items i where i.id = p_new),
    'stem', (select i.stem from public.items i where i.id = p_new),
    'objective_ids', (select to_jsonb(i.objective_ids) from public.items i where i.id = p_new),
    'options', coalesce((select jsonb_agg(jsonb_build_object('label', o.label, 'body', o.body, 'is_correct', o.is_correct,
                                 'rationale', o.rationale, 'misconception_code', o.misconception_code))
                           from public.item_options o where o.item_id = p_new), '[]'::jsonb)))
    - case when (select array_agg(lo.code order by lo.code) from public.items i join public.learning_objectives lo on lo.id = any (i.objective_ids) where i.id = p_old)
                is not distinct from
                (select array_agg(lo.code order by lo.code) from public.items i join public.learning_objectives lo on lo.id = any (i.objective_ids) where i.id = p_new)
           then 'objectives' else '' end
$$;
revoke all on function public.soal_beda_versi(uuid, uuid) from public, anon, authenticated;

create or replace function public.riwayat_soal(p_item uuid)
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare i public.items; v_root uuid; v jsonb;
begin
  select * into i from public.items where id = p_item;
  if i.id is null or public.current_person_id() is null
     or not (public.can_in_institution('CAN_DRAFT', i.institution_id) or public.can_in_institution('CAN_REVIEW', i.institution_id)) then
    perform public.soal_tolak('QUESTION_NOT_VISIBLE');
  end if;
  with recursive up as (
    select x.id, x.supersedes_item_id, 0 as d from public.items x where x.id = p_item
    union all
    select x.id, x.supersedes_item_id, up.d + 1 from public.items x join up on x.id = up.supersedes_item_id where up.d < 64)
  select id into v_root from up order by d desc limit 1;
  with recursive down as (
    select x.id, x.supersedes_item_id, 1 as n from public.items x where x.id = v_root
    union all
    select x.id, x.supersedes_item_id, down.n + 1 from public.items x join down on x.supersedes_item_id = down.id
     where x.institution_id = i.institution_id and down.n < 64)
  select jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
           'item', d.id, 'versi', d.n, 'sebelumnya', d.supersedes_item_id, 'ini', d.id = p_item,
           'course', co.id, 'status_paket', co.status,
           'terbitan', case when r.id is not null then jsonb_strip_nulls(jsonb_build_object(
                          'id', r.id, 'versi', r.version_label, 'status', r.status, 'terbit_pada', r.published_at,
                          'digantikan', r.replaced_by_release_id is not null, 'dihentikan', r.withdrawn_at is not null)) end,
           'dibuat_pada', x.created_at, 'dibuat_oleh', co.author_person_id, 'nama_pembuat', pa.display_name,
           'diubah_pada', x.edited_at, 'diubah_oleh', x.edited_by_person_id, 'nama_pengubah', pe.display_name,
           'kunci', to_jsonb(public.soal_kunci(d.id)),
           'perubahan', case when d.supersedes_item_id is not null then public.soal_beda_versi(d.supersedes_item_id, d.id) end,
           'koreksi_kunci', public.riwayat_soal_koreksi(d.id),
           -- Daisy Q5 «Lihat versi ini»: each version read-only, as its authors and reviewers already read the draft
           'isi', jsonb_build_object('bacaan', x.stimulus, 'pertanyaan', x.stem,
                    'pilihan', coalesce((select jsonb_agg(jsonb_build_object('label', o.label, 'teks', o.body, 'kunci', o.is_correct)
                                                 order by o.label collate "C") from public.item_options o where o.item_id = d.id), '[]'::jsonb))))
         order by d.n desc)
    into v
    from down d join public.items x on x.id = d.id
    left join public.courses co on co.id = public.soal_kursus(d.id)
    left join public.plp_releases r on r.course_id = co.id
    left join public.persons pa on pa.id = co.author_person_id
    left join public.persons pe on pe.id = x.edited_by_person_id;
  return jsonb_build_object('item', p_item, 'jumlah_versi', jsonb_array_length(coalesce(v, '[]'::jsonb)), 'versi', coalesce(v, '[]'::jsonb));
end $$;
revoke all on function public.riwayat_soal(uuid) from public, anon, authenticated;
grant execute on function public.riwayat_soal(uuid) to authenticated;

-- ═══════════════════════════════════════════════════════════ (5) publication replaces; withdrawal stops new sittings
-- What a release recorded is written once.
create or replace function public.plp_releases_c1w_jaga() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if (old.replaced_by_release_id is not null and new.replaced_by_release_id is distinct from old.replaced_by_release_id)
     or (old.replaced_at is not null and new.replaced_at is distinct from old.replaced_at)
     or (old.withdrawn_at is not null and (new.withdrawn_at is distinct from old.withdrawn_at
          or new.withdrawn_by_person_id is distinct from old.withdrawn_by_person_id
          or new.withdrawal_reason is distinct from old.withdrawal_reason)) then
    raise exception 'how a release was replaced or withdrawn is recorded once';
  end if;
  return new;
end $$;
revoke all on function public.plp_releases_c1w_jaga() from public, anon, authenticated;
create trigger plp_releases_c1w_marks before update on public.plp_releases
  for each row execute function public.plp_releases_c1w_jaga();

-- Releases withdrawn before this migration: what their audit row recorded.
update public.plp_releases r
   set withdrawn_at = l.at, withdrawn_by_person_id = l.actor_person_id, withdrawal_reason = l.summary ->> 'reason'
  from (select distinct on (a.target_id) a.target_id, a.at, a.actor_person_id, a.summary
          from public.audit_log a where a.action = 'RELEASE_WITHDRAWN' and a.target_table = 'plp_releases'
         order by a.target_id, a.at) l
 where l.target_id = r.id::text and r.status = 'SUPERSEDED' and r.withdrawn_at is null;

-- A published correction replaces its predecessor for new assignments: SUPERSEDED, marked with what replaced it. A
-- predecessor its publisher had already withdrawn stays withdrawn and is marked too.
create or replace function public.terbitan_gantikan_pendahulu(p_release uuid)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare r public.plp_releases; p public.plp_releases;
begin
  select * into r from public.plp_releases where id = p_release;
  if r.supersedes_release_id is null then return null; end if;
  select * into p from public.plp_releases where id = r.supersedes_release_id for update;
  if p.id is null or p.replaced_by_release_id is not null then return null; end if;
  if p.status = 'PUBLISHED' then
    update public.plp_releases set status = 'SUPERSEDED', replaced_by_release_id = r.id, replaced_at = now() where id = p.id;
  elsif p.status = 'SUPERSEDED' then
    update public.plp_releases set replaced_by_release_id = r.id, replaced_at = now() where id = p.id;
  else
    return null;
  end if;
  perform public.audit_write('RELEASE_REPLACED', 'plp_releases', p.id::text, p.institution_id,
    jsonb_build_object('course_id', p.course_id, 'version_label', p.version_label, 'replaced_by', r.id,
                       'replaced_by_version', r.version_label,
                       'from', jsonb_build_object('status', p.status), 'to', jsonb_build_object('status', 'SUPERSEDED'),
                       'withdrawn_before', p.withdrawn_at is not null, 'evidence_untouched', true));
  return p.id;
end $$;
revoke all on function public.terbitan_gantikan_pendahulu(uuid) from public, anon, authenticated;

-- 20261212100000's publish_release; the one change: a correction replaces what it corrects.
create or replace function public.publish_release(p_release uuid)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare r record;
begin
  select pr.id, pr.status, pr.institution_id, pr.course_id, pr.version_label into r
    from public.plp_releases pr where pr.id = p_release;
  if r.id is null or public.current_person_id() is null
     or not public.can_in_institution('CAN_PUBLISH', r.institution_id) then
    perform public.release_refuse('RELEASE_PUBLISH_NOT_ALLOWED');
  end if;
  -- a second click publishes nothing twice: no second update, no second audit row
  if r.status = 'PUBLISHED' then return p_release; end if;
  if r.status <> 'FROZEN' then perform public.release_refuse('RELEASE_STATE_INVALID'); end if;

  -- The readiness gate is the trigger's (enforce_release_publish_readiness).
  update public.plp_releases set status = 'PUBLISHED' where id = p_release;

  perform public.audit_write('RELEASE_PUBLISHED', 'plp_releases', p_release::text, r.institution_id,
    jsonb_build_object('course_id', r.course_id, 'version_label', r.version_label,
                       'assigns_nothing', true));
  -- C1w: the correction replaces its predecessor for new assignments
  perform public.terbitan_gantikan_pendahulu(p_release);
  return p_release;
end $$;
revoke all on function public.publish_release(uuid) from public, anon, authenticated;
grant execute on function public.publish_release(uuid) to authenticated;

-- 20261212100000's withdraw_release, now recording when, by whom and why on the release itself.
create or replace function public.withdraw_release(p_release uuid, p_reason text)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare r record;
begin
  select pr.id, pr.status, pr.institution_id, pr.course_id, pr.version_label into r
    from public.plp_releases pr where pr.id = p_release;
  if r.id is null or public.current_person_id() is null
     or not public.can_in_institution('CAN_PUBLISH', r.institution_id) then
    perform public.release_refuse('RELEASE_PUBLISH_NOT_ALLOWED');
  end if;
  if p_reason is null or btrim(p_reason) = '' then perform public.release_refuse('RELEASE_REASON_REQUIRED'); end if;
  perform 1 from public.plp_releases where id = p_release for update;
  select pr.id, pr.status, pr.institution_id, pr.course_id, pr.version_label into r
    from public.plp_releases pr where pr.id = p_release;
  if r.status <> 'PUBLISHED' then perform public.release_refuse('RELEASE_STATE_INVALID'); end if;

  -- SUPERSEDED, never deleted: every session, result and certificate already bound to this release stays bound to it.
  -- C1w (O41-11): withdrawn, so no class starts a new sitting on it; open sittings finish; finished results count.
  update public.plp_releases
     set status = 'SUPERSEDED', withdrawn_at = now(), withdrawn_by_person_id = public.current_person_id(),
         withdrawal_reason = btrim(p_reason)
   where id = p_release;

  perform public.audit_write('RELEASE_WITHDRAWN', 'plp_releases', p_release::text, r.institution_id,
    jsonb_build_object('course_id', r.course_id, 'version_label', r.version_label,
                       'reason', p_reason, 'evidence_untouched', true,
                       'from', jsonb_build_object('status', r.status),
                       'to', jsonb_build_object('status', 'SUPERSEDED', 'withdrawn', true),
                       'new_sittings', 'refused', 'open_sittings', 'finish', 'finished_results', 'kept'));
  return p_release;
end $$;
revoke all on function public.withdraw_release(uuid, text) from public, anon, authenticated;
grant execute on function public.withdraw_release(uuid, text) to authenticated;

-- A sitting begins only over material that was published and is neither withdrawn nor unpublished: PUBLISHED, or
-- replaced by its correction (an existing assignment keeps running on it; new assignments take the correction).
create or replace function public.release_starts_new_sessions(p_release uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.plp_releases r
                  where r.id = p_release
                    and (r.status = 'PUBLISHED' or (r.status = 'SUPERSEDED' and r.withdrawn_at is null)))
$$;
revoke all on function public.release_starts_new_sessions(uuid) from public, anon, authenticated;

do $$
declare v_def text; v_old text;
begin
  -- the quick assessment's own choice of release refuses a withdrawn one too
  v_def := pg_get_functiondef('public.start_learning_session(uuid)'::regprocedure);
  v_old := 'and r.status in (''PUBLISHED'', ''SUPERSEDED'')';
  if (length(v_def) - length(replace(v_def, v_old, ''))) / length(v_old) <> 1 then
    raise exception 'C1w: start_learning_session no longer chooses a quick assessment''s release where it did';
  end if;
  v_def := replace(v_def, v_old, 'and r.status in (''PUBLISHED'', ''SUPERSEDED'') and r.withdrawn_at is null   -- C1w (O41-11)');
  -- and says so in the designed reason when the release it would have used is one its publisher withdrew
  v_old := E'    if v_release is null then\n      raise exception\n        ''this quick assessment';
  if position(v_old in v_def) = 0 then raise exception 'C1w: start_learning_session no longer refuses a quick assessment where it did'; end if;
  v_def := replace(v_def, v_old,
    E'    -- C1w (O41-11): the material its publisher withdrew starts no new sitting, said as may_start_assessment says it\n'
    || E'    if v_release is null and exists (select 1 from public.plp_releases r where r.course_id = v_course and r.withdrawn_at is not null\n'
    || E'         and (r.institution_id = v_aa.institution_id or public.release_is_distributed_to(r.id, v_aa.institution_id))) then\n'
    || E'      raise exception ''cannot start this assessment: RELEASE_WITHDRAWN (INV-27)'';\n'
    || E'    end if;\n' || v_old);
  execute v_def;
  -- the learner and the screens are told why, before the start is attempted
  v_def := pg_get_functiondef('public.may_start_assessment(uuid)'::regprocedure);
  v_old := 'select * into v_d from public.assessment_definitions where id = v_aa.assessment_definition_id;';
  if position(v_old in v_def) = 0 then raise exception 'C1w: may_start_assessment is not where it was'; end if;
  execute replace(v_def, v_old,
    E'-- C1w (O41-11): a release its publisher withdrew starts no new sitting\n'
    || E'  if v_aa.learning_assignment_id is not null and exists (select 1 from public.learning_assignments la\n'
    || E'       join public.plp_releases rr on rr.id = la.plp_release_id\n'
    || E'      where la.id = v_aa.learning_assignment_id and rr.withdrawn_at is not null) then\n'
    || E'    ok := false; reason := ''RELEASE_WITHDRAWN''; return next; return;\n'
    || E'  end if;\n  ' || v_old);
end $$;

-- What teachers and learners are told of the material an assignment runs on (Daisy, C1-B2): its own state, never the
-- teacher's «Ditarik».
--   BERJALAN             published; sittings start
--   DIGANTIKAN           replaced by its correction; this class keeps it (or is moved by a governed key correction)
--   DIHENTIKAN_PENERBIT  its publisher withdrew it: no new sitting; finished results stay and count
create or replace function public.keadaan_terbitan(p_learning_assignment uuid)
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare la public.learning_assignments; r public.plp_releases; v_me uuid := public.current_person_id();
begin
  select * into la from public.learning_assignments where id = p_learning_assignment;
  if la.id is null or v_me is null
     or not (public.can_on_node('CAN_ASSIGN_LEARNING', la.node_id) or public.can_on_node('CAN_VIEW_LEARNER_ROSTER', la.node_id)
             or exists (select 1 from public.enrollments e join public.memberships m on m.enrollment_id = e.id
                          join public.org_nodes n on n.id = m.node_id
                         where e.person_id = v_me and e.status = 'ACTIVE' and m.valid_to is null
                           and (n.id = la.node_id or n.jalur @> array[la.node_id]))) then
    perform public.soal_tolak('RELEASE_STATE_NOT_VISIBLE');
  end if;
  select * into r from public.plp_releases where id = la.plp_release_id;
  return jsonb_build_object(
    'keadaan', case when r.withdrawn_at is not null then 'DIHENTIKAN_PENERBIT'
                    when r.replaced_by_release_id is not null then 'DIGANTIKAN'
                    else 'BERJALAN' end,
    'sejak', coalesce(r.withdrawn_at, r.replaced_at),
    'sesi_baru', public.release_starts_new_sessions(r.id),
    -- Daisy C1-R2: «Ada perbaikan · terbit {tanggal}», linking to «Pindahkan penugasan» on the line's newest package
    'pengganti_terbit', (select x.published_at from public.plp_releases x where x.id = r.replaced_by_release_id),
    'kursus_kepala', case when r.replaced_by_release_id is not null then public.kursus_kepala(r.course_id) end);
end $$;
revoke all on function public.keadaan_terbitan(uuid) from public, anon, authenticated;
grant execute on function public.keadaan_terbitan(uuid) to authenticated;

-- ═══════════════════════════════════════════════════════════ the declarations
insert into public.client_rpc_registry (function_name, exposure, note, authorization_kind, authorization_requirement)
values
  ('ubah_soal_draf', 'STAFF',
   'C1w (O41-10): edits one question of a draft (stem, options, key, rationale, misconception code, objective) before '
   || 'submission or after send-back, with the revision the editor read (a later save refuses it, DRAFT_EDIT_CONFLICT); '
   || 'every problem returned at once; a checked draft goes back to be checked; attributed and audited. Refusals PR180.',
   'CAPABILITY', 'CAN_DRAFT'),
  ('tambah_soal_draf', 'STAFF',
   'C1w (O41-10): adds a question to a lesson of a draft, practice or one of its tests; validated as an edit; attributed '
   || 'and audited. Refusals PR180.', 'CAPABILITY', 'CAN_DRAFT'),
  ('hapus_soal_draf', 'STAFF',
   'C1w (O41-10): removes one question of a draft (with the revision read); a test keeps at least one question; '
   || 'attributed and audited. Refusals PR180.', 'CAPABILITY', 'CAN_DRAFT'),
  ('buang_draf', 'STAFF',
   'C1w (O41-10): discards a whole draft nothing else uses: its content goes, its audit and attribution rows stay. '
   || 'Refusals PR180.', 'CAPABILITY', 'CAN_DRAFT'),
  ('suntingan_draf', 'STAFF',
   'C1w: a draft''s questions with their revision numbers and last save (who, when), and whether it may be edited.',
   'CAPABILITY', 'CAN_DRAFT'),
  ('unggah_menimpa_suntingan', 'STAFF',
   'C1w: whether the course an upload revises was edited in the app (how many saves, the last, by whom), so the '
   || 'screen warns before the upload replaces those edits.', 'CAPABILITY', 'CAN_DRAFT'),
  ('revisi_soal', 'STAFF',
   'C1w: opens a revision of a published package''s head to change one question, every question pointing to its '
   || 'original; with a 10-1000 summary; answers the new course and the copy of the question. Refusals PR180.',
   'CAPABILITY', 'CAN_DRAFT'),
  ('riwayat_soal', 'STAFF',
   'C1w: a question''s versions, newest first: who made each, when, in which release, and what changed by name '
   || '(stem, options, key from and to, rationale, misconception, objectives). No statistic. Authors and reviewers.',
   'CAPABILITY', 'CAN_DRAFT'),
  ('keadaan_terbitan', 'STAFF',
   'C1w (Daisy C1-B2): the state of the material an assignment runs on, BERJALAN, DIGANTIKAN or DIHENTIKAN_PENERBIT, '
   || 'for the class''s teachers and learners; never the teacher''s withdrawal.', 'CAPABILITY', 'CAN_ASSIGN_LEARNING')
on conflict (function_name) do update
   set exposure = excluded.exposure, note = excluded.note,
       authorization_kind = excluded.authorization_kind, authorization_requirement = excluded.authorization_requirement;

-- ---------------------------------------------------------------------------
-- Verification (ADR-0003): structural only.
-- ---------------------------------------------------------------------------
do $$
declare f text;
begin
  if exists (select 1 from public.items i join public.items p on p.id = i.supersedes_item_id where p.institution_id <> i.institution_id)
     or exists (select 1 from public.courses i join public.courses p on p.id = i.supersedes_course_id where p.institution_id <> i.institution_id) then
    raise exception 'C1w: a lineage pointer crosses owners in the data already held';
  end if;
  if position('public.package_identity_item(b, i)' in (select prosrc from pg_proc where oid = 'public.lesson_package_materialise(uuid)'::regprocedure)) = 0
     or position('package_identity_problems' in (select prosrc from pg_proc where oid = 'public.package_revision_problems(public.ingest_batches)'::regprocedure)) = 0 then
    raise exception 'C1w: an upload''s identity is not checked and written where a question is materialised';
  end if;
  if position('pintar.suntingan_draf' in (select prosrc from pg_proc where oid = 'public.enforce_content_status()'::regprocedure)) = 0
     or position('RELEASE_WITHDRAWN' in (select prosrc from pg_proc where oid = 'public.may_start_assessment(uuid)'::regprocedure)) = 0
     or position('withdrawn_at is null' in (select prosrc from pg_proc where oid = 'public.start_learning_session(uuid)'::regprocedure)) = 0
     or position('terbitan_gantikan_pendahulu' in (select prosrc from pg_proc where oid = 'public.publish_release(uuid)'::regprocedure)) = 0 then
    raise exception 'C1w: the checked draft''s edge, the withdrawn release''s refusal or the replacement is not wired';
  end if;
  foreach f in array array['soal_tolak(text)', 'salin_kursus_revisi(uuid, uuid, uuid, boolean)', 'draf_kunci(uuid)',
      'draf_kembali_periksa(uuid)', 'soal_draf_masalah(uuid, uuid, public.item_type, jsonb)', 'soal_tulis_pilihan(uuid, uuid, jsonb)',
      'package_identity_item(public.ingest_batches, jsonb)', 'package_identity_problems(public.ingest_batches)',
      'terbitan_gantikan_pendahulu(uuid)', 'soal_kunci(uuid)', 'soal_sidik_isi(uuid)', 'kursus_kepala(uuid)', 'kursus_penerus(uuid, uuid)'] loop
    if has_function_privilege('authenticated', ('public.' || f)::regprocedure, 'execute')
       or has_function_privilege('anon', ('public.' || f)::regprocedure, 'execute') then
      raise exception 'C1w: % is callable by a client', f;
    end if;
  end loop;
  foreach f in array array['ubah_soal_draf(uuid, integer, jsonb)', 'tambah_soal_draf(uuid, jsonb)', 'hapus_soal_draf(uuid, integer)',
      'buang_draf(uuid, text)', 'suntingan_draf(uuid)', 'unggah_menimpa_suntingan(uuid)', 'revisi_soal(uuid, text)',
      'riwayat_soal(uuid)', 'keadaan_terbitan(uuid)'] loop
    if has_function_privilege('anon', ('public.' || f)::regprocedure, 'execute') then
      raise exception 'C1w: an anonymous caller can call %', f;
    end if;
  end loop;
  if exists (select 1 from information_schema.role_table_grants g
              where g.table_schema = 'public' and g.table_name = 'item_draft_edits' and g.grantee in ('anon', 'authenticated')) then
    raise exception 'C1w: a client role reaches item_draft_edits directly';
  end if;
  raise notice 'C1w (part one) verified: a draft is edited by its school''s authors before submission or after send-back, one save at a time; an upload''s identity names its predecessor''s question or refuses the row; a revision is of the head; a correction replaces its predecessor; a withdrawn release starts no sitting';
end $$;
