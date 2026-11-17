-- ---------------------------------------------------------------------------------------------------------------
-- C2w · REVIEWER NOTES ON SEALED QUESTIONS («Catatan peninjau») (PLAN-A2B-C2W.md §3; docs/completion-4.1/batches/
-- C2W-COMPLETION.md; Sharon's design acceptance with D1 to D4, C2W-NOTES-DESIGN-be01b4f2.md at 3a2de775; Daisy's
-- words, C2W-CATATAN-KATA.md at 535561ed). Red first: C2W-B1, B2, B4, B5, B6, D1R, D2 and D3 (selftest/c2w-catatan.test.ts).
--
-- A reviewer records what a wrong option reveals about learners' thinking, after the question is sealed. A note never
-- changes a question, a score or a report, and no learner ever sees one.
--   * catatan_peninjau: one row per note, attributed, dated, IMMUTABLE. A correction is a new note naming the note it
--     replaces; nothing is updated or deleted (the table's trigger refuses both, also for the owner role).
--   * catatan_peninjau_tulis: a school's question takes notes from that school's CAN_REVIEW (never the platform admin);
--     a platform-library question only from the library's own reviewers or the platform admin. Writes on one option
--     are serialised by an advisory key on (item, option), and the two unique indexes are the backstop (D1).
--   * catatan_peninjau_studio: Studio's read, for riwayat_soal's readers: every note on every revision of the line.
--   * catatan_peninjau_kelas: the read beside the class report, under teacher_question_evidence's own gate: the current
--     note on every revision of each question the class's sittings were shown.
--   * I-5: a note says it predates a key correction when its revision is earlier than the revision read and their keys
--     differ (Daisy's words, two variants). The key of a sealed revision never changes.
--   * Never evidence: a metric source naming the table is refused, and assert_reviewer_notes_are_not_evidence() reads
--     every consumer, view and declared source.
-- ---------------------------------------------------------------------------------------------------------------

create table public.catatan_peninjau (
  id              uuid primary key default gen_random_uuid(),
  item_id         uuid not null references public.items(id),
  opsi_label      text not null check (opsi_label ~ '^[A-E]$'),
  institution_id  uuid not null references public.institutions(id),
  isi             text not null,
  ditulis_oleh    uuid not null references public.persons(id),
  ditulis_pada    timestamptz not null default clock_timestamp(),
  menggantikan_id uuid references public.catatan_peninjau(id)
);
-- D1: one note replaces one note, and one first note per item and option
create unique index catatan_peninjau_satu_pengganti on public.catatan_peninjau (menggantikan_id) where menggantikan_id is not null;
create unique index catatan_peninjau_satu_awal on public.catatan_peninjau (item_id, opsi_label) where menggantikan_id is null;
create index catatan_peninjau_item on public.catatan_peninjau (item_id);
alter table public.catatan_peninjau enable row level security;
revoke all on table public.catatan_peninjau from public, anon, authenticated;
insert into public.record_class_registry values
  ('catatan_peninjau', 'INSTITUTION_SCOPED',
   'C2w: a reviewer''s note on a sealed question''s option; read through functions only, never evidence, never a learner''s')
on conflict do nothing;

-- the refusals, by code (PR210); the screens' contract is src/lib/catatan-kontrak.ts
create or replace function public.catatan_tolak(p_code text)
returns void language plpgsql set search_path = public, pg_temp as $$
begin
  raise exception using
    errcode = 'PR210',
    detail  = p_code,
    message = case p_code
      when 'NOTE_NOT_ALLOWED'      then 'a reviewer note is written by a reviewer of the school that owns the question'
      when 'NOTE_LIBRARY_CONTENT'  then 'a platform-library question takes notes from the platform''s reviewers only'
      when 'NOTE_NOT_SEALED'       then 'a reviewer note is written on a sealed (published) question only'
      when 'NOTE_OPTION_INVALID'   then 'the question has no such option'
      when 'NOTE_TEXT_INVALID'     then 'a note is 1 to 1000 characters with no control character'
      when 'NOTE_EXISTS'           then 'this option already has a note; a new one replaces it'
      when 'NOTE_NOT_CURRENT'      then 'the note named is not this option''s current note (another reviewer replaced it first)'
      when 'NOTE_OWNER_MISMATCH'   then 'a note belongs to the owner of its question'
      when 'NOTE_IMMUTABLE'        then 'a reviewer note is never changed or deleted; a correction is a new note'
      when 'NOTE_NOT_A_SOURCE'     then 'reviewer notes are never a metric source'
      else 'the reviewer note was refused'
    end;
end $$;
revoke all on function public.catatan_tolak(text) from public, anon, authenticated;

-- D2: the table's own guard, whoever inserts: the owner is the item's, the item sealed, the option the item's, the text
-- valid, and a replacement on the same item and option. Never an update or a delete.
create or replace function public.catatan_peninjau_jaga()
returns trigger language plpgsql set search_path = public, pg_temp as $$
declare v_inst uuid; v_ganti public.catatan_peninjau;
begin
  if tg_op <> 'INSERT' then perform public.catatan_tolak('NOTE_IMMUTABLE'); end if;
  select i.institution_id into v_inst from public.items i where i.id = new.item_id;
  if v_inst is distinct from new.institution_id then perform public.catatan_tolak('NOTE_OWNER_MISMATCH'); end if;
  if not public.content_is_sealed(public.soal_kursus(new.item_id)) then perform public.catatan_tolak('NOTE_NOT_SEALED'); end if;
  if not exists (select 1 from public.item_options o where o.item_id = new.item_id and o.label = new.opsi_label) then
    perform public.catatan_tolak('NOTE_OPTION_INVALID');
  end if;
  if char_length(btrim(coalesce(new.isi, ''))) not between 1 and 1000 or new.isi ~ '[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]' then
    perform public.catatan_tolak('NOTE_TEXT_INVALID');
  end if;
  if new.menggantikan_id is not null then
    select * into v_ganti from public.catatan_peninjau c where c.id = new.menggantikan_id;
    if v_ganti.id is null or v_ganti.item_id <> new.item_id or v_ganti.opsi_label <> new.opsi_label then
      perform public.catatan_tolak('NOTE_NOT_CURRENT');
    end if;
  end if;
  return new;
end $$;
revoke all on function public.catatan_peninjau_jaga() from public, anon, authenticated;
create trigger catatan_peninjau_jaga before insert or update or delete on public.catatan_peninjau
  for each row execute function public.catatan_peninjau_jaga();
create or replace function public.catatan_peninjau_jaga_kosongkan()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  perform public.catatan_tolak('NOTE_IMMUTABLE');
  return null;
end $$;
revoke all on function public.catatan_peninjau_jaga_kosongkan() from public, anon, authenticated;
create trigger catatan_peninjau_jaga_kosongkan before truncate on public.catatan_peninjau
  for each statement execute function public.catatan_peninjau_jaga_kosongkan();

-- never a metric source
create or replace function public.catatan_peninjau_bukan_sumber_metrik()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if new.source_relation = 'catatan_peninjau' then perform public.catatan_tolak('NOTE_NOT_A_SOURCE'); end if;
  return new;
end $$;
revoke all on function public.catatan_peninjau_bukan_sumber_metrik() from public, anon, authenticated;
create trigger catatan_peninjau_bukan_sumber_metrik before insert or update on public.metric_sources
  for each row execute function public.catatan_peninjau_bukan_sumber_metrik();

-- D3: a question's line, numbered as «Riwayat soal» numbers it (the root is version 1), within its owner. Read as one
-- statement, with no row lock; a depth cap and a cycle guard on both walks.
create or replace function public.catatan_peninjau_garis(p_item uuid)
returns table (item_id uuid, versi integer)
language sql stable security definer set search_path = public, pg_temp as $$
  with recursive naik as (
    select x.id, x.supersedes_item_id, x.institution_id, 0 as kedalaman, array[x.id] as jalur
      from public.items x where x.id = p_item
    union all
    select x.id, x.supersedes_item_id, x.institution_id, naik.kedalaman + 1, naik.jalur || x.id
      from public.items x join naik on x.id = naik.supersedes_item_id
     where naik.kedalaman < 64 and not (x.id = any (naik.jalur)) and x.institution_id = naik.institution_id
  ), akar as (select id, institution_id from naik order by kedalaman desc limit 1),
  turun as (
    select a.id, 1 as kedalaman, array[a.id] as jalur, a.institution_id from akar a
    union all
    select x.id, turun.kedalaman + 1, turun.jalur || x.id, turun.institution_id
      from public.items x join turun on x.supersedes_item_id = turun.id
     where turun.kedalaman < 64 and not (x.id = any (turun.jalur)) and x.institution_id = turun.institution_id
  )
  select t.id, t.kedalaman from turun t
$$;
revoke all on function public.catatan_peninjau_garis(uuid) from public, anon, authenticated;

create or replace function public.catatan_peninjau_kunci(p_item uuid)
returns text language sql stable security definer set search_path = public, pg_temp as $$
  select array_to_string(public.soal_kunci(p_item), ', ')
$$;
revoke all on function public.catatan_peninjau_kunci(uuid) from public, anon, authenticated;

-- one note as a reader receives it; the platform's reviewers are not named to a school (Daisy: «Peninjau PINTAR»)
create or replace function public.catatan_peninjau_baris(c public.catatan_peninjau, p_versi integer, p_versi_baca integer,
                                                         p_kunci_kini text, p_nama boolean)
returns jsonb language sql stable security definer set search_path = public, pg_temp as $$
  select jsonb_build_object(
    'id', c.id, 'item', c.item_id, 'versi', p_versi, 'opsi', c.opsi_label, 'isi', c.isi, 'pada', c.ditulis_pada,
    'pustaka', public.tenant_platform(c.institution_id),
    'nama', case when p_nama and not public.tenant_platform(c.institution_id)
                 then (select p.display_name from public.persons p where p.id = c.ditulis_oleh) end,
    'menggantikan', c.menggantikan_id,
    'digantikan', exists (select 1 from public.catatan_peninjau x where x.menggantikan_id = c.id),
    'digantikan_pada', (select x.ditulis_pada from public.catatan_peninjau x where x.menggantikan_id = c.id),
    'kunci_saat_itu', public.catatan_peninjau_kunci(c.item_id),
    'kunci_kini', p_kunci_kini,
    -- I-5: written on an earlier revision than the one read, whose key differs
    'sebelum_koreksi', p_versi < p_versi_baca and public.catatan_peninjau_kunci(c.item_id) is distinct from p_kunci_kini)
$$;
revoke all on function public.catatan_peninjau_baris(public.catatan_peninjau, integer, integer, text, boolean) from public, anon, authenticated;

create or replace function public.catatan_peninjau_tulis(p_item uuid, p_opsi text, p_isi text, p_menggantikan uuid default null)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_me uuid := public.current_person_id(); i public.items; v_kini public.catatan_peninjau; v_id uuid;
begin
  select * into i from public.items x where x.id = p_item;
  if v_me is null or i.id is null then perform public.catatan_tolak('NOTE_NOT_ALLOWED'); end if;
  if public.tenant_platform(i.institution_id) then
    -- a platform-library question: the library's own reviewers, or the platform admin; a school's reviewer is told why
    if not (public.peran_tenant_punya(v_me, 'CAN_REVIEW', i.institution_id) or public.orang_admin_platform(v_me)) then
      if exists (select 1 from public.role_assignments ra
                  where ra.person_id = v_me and ra.revoked_at is null and now() >= ra.valid_from and now() < ra.valid_until
                    and ra.role <> 'SYSTEM_ADMIN' and 'CAN_REVIEW' = any (public.role_capabilities(ra.role))) then
        perform public.catatan_tolak('NOTE_LIBRARY_CONTENT');
      end if;
      perform public.catatan_tolak('NOTE_NOT_ALLOWED');
    end if;
  elsif not public.peran_tenant_punya(v_me, 'CAN_REVIEW', i.institution_id) then
    -- a school's question: that school's CAN_REVIEW only (never the platform admin, never another school)
    perform public.catatan_tolak('NOTE_NOT_ALLOWED');
  end if;
  if not public.content_is_sealed(public.soal_kursus(i.id)) then perform public.catatan_tolak('NOTE_NOT_SEALED'); end if;
  if p_opsi is null or not exists (select 1 from public.item_options o where o.item_id = i.id and o.label = p_opsi) then
    perform public.catatan_tolak('NOTE_OPTION_INVALID');
  end if;
  if char_length(btrim(coalesce(p_isi, ''))) not between 1 and 1000 or p_isi ~ '[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]' then
    perform public.catatan_tolak('NOTE_TEXT_INVALID');
  end if;
  -- D1: one writer per item and option at a time; the second reads what the first committed
  perform pg_advisory_xact_lock(hashtextextended('catatan_peninjau:' || i.id::text || ':' || p_opsi, 0));
  select * into v_kini from public.catatan_peninjau c
   where c.item_id = i.id and c.opsi_label = p_opsi
     and not exists (select 1 from public.catatan_peninjau x where x.menggantikan_id = c.id)
   order by c.ditulis_pada desc, c.id desc limit 1;
  if p_menggantikan is null and v_kini.id is not null then perform public.catatan_tolak('NOTE_EXISTS'); end if;
  if p_menggantikan is not null and v_kini.id is distinct from p_menggantikan then perform public.catatan_tolak('NOTE_NOT_CURRENT'); end if;
  begin
    insert into public.catatan_peninjau (item_id, opsi_label, institution_id, isi, ditulis_oleh, menggantikan_id)
    values (i.id, p_opsi, i.institution_id, btrim(p_isi), v_me, p_menggantikan)
    returning id into v_id;
  exception when unique_violation then
    perform public.catatan_tolak(case when p_menggantikan is null then 'NOTE_EXISTS' else 'NOTE_NOT_CURRENT' end);
  end;
  perform public.audit_write('reviewer_note.written', 'catatan_peninjau', v_id::text, i.institution_id,
    jsonb_build_object('note_id', v_id, 'item_id', i.id, 'option', p_opsi, 'replaces', p_menggantikan, 'actor', v_me));
  return jsonb_build_object('ok', true, 'id', v_id);
end $$;
revoke all on function public.catatan_peninjau_tulis(uuid, text, text, uuid) from public, anon, authenticated;
grant execute on function public.catatan_peninjau_tulis(uuid, text, text, uuid) to authenticated;

-- Studio: riwayat_soal's readers; every note on every revision of the line, read against the revision on screen
create or replace function public.catatan_peninjau_studio(p_item uuid)
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare i public.items; v_versi integer; v_kunci text; v jsonb;
begin
  select * into i from public.items x where x.id = p_item;
  if i.id is null or public.current_person_id() is null
     or not (public.can_in_institution('CAN_DRAFT', i.institution_id) or public.can_in_institution('CAN_REVIEW', i.institution_id)) then
    perform public.catatan_tolak('NOTE_NOT_ALLOWED');
  end if;
  select g.versi into v_versi from public.catatan_peninjau_garis(p_item) g where g.item_id = p_item;
  v_kunci := public.catatan_peninjau_kunci(p_item);
  select coalesce(jsonb_agg(public.catatan_peninjau_baris(c, g.versi, v_versi, v_kunci, true) order by c.ditulis_pada, c.id), '[]'::jsonb)
    into v
    from public.catatan_peninjau_garis(p_item) g join public.catatan_peninjau c on c.item_id = g.item_id;
  return v;
end $$;
revoke all on function public.catatan_peninjau_studio(uuid) from public, anon, authenticated;
grant execute on function public.catatan_peninjau_studio(uuid) to authenticated;

-- beside the class report: teacher_question_evidence's own gate, word for word; the current note on every revision of
-- each question the class's sittings of this assignment were shown, read against the key in force (the line's tip)
create or replace function public.catatan_peninjau_kelas(p_assignment uuid, p_class uuid)
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_aa record; v jsonb;
begin
  if public.current_person_id() is null or p_assignment is null or p_class is null then
    raise exception using errcode = '42501', message = 'question-level class evidence is for the class''s teacher';
  end if;
  select aa.id, aa.node_id, aa.institution_id into v_aa
    from public.assessment_assignments aa where aa.id = p_assignment;
  if v_aa.id is null or v_aa.node_id <> p_class or not exists (
       select 1 from public.role_assignments ra join public.org_nodes n on n.id = p_class
        where ra.person_id = public.current_person_id() and ra.role = 'EDUCATOR'
          and ra.revoked_at is null and now() >= ra.valid_from and now() < ra.valid_until
          and ra.scope_node_id is not null and n.jalur @> array[ra.scope_node_id]) then
    raise exception using errcode = '42501', message = 'question-level class evidence is for the class''s teacher';
  end if;
  if not exists (select 1 from public.org_nodes n where n.id = p_class and n.learning_context = 'ACADEMIC') then
    raise exception using errcode = '42501', message = 'question-level class evidence is for the class''s teacher';
  end if;
  with soal as (
    select distinct p.item_id from public.presented_items p join public.assessment_sessions s on s.id = p.session_id
     where s.assessment_assignment_id = p_assignment
  ), ujung as (
    select s.item_id, public.soal_ujung(s.item_id) as tip from soal s
  ), baca as (
    select u.item_id, u.tip, (select g.versi from public.catatan_peninjau_garis(u.item_id) g where g.item_id = u.tip) as versi_tip,
           public.catatan_peninjau_kunci(u.tip) as kunci_kini
      from ujung u
  )
  select coalesce(jsonb_agg(public.catatan_peninjau_baris(c, g.versi, b.versi_tip, b.kunci_kini, true)
                              || jsonb_build_object('soal', b.item_id) order by c.ditulis_pada, c.id), '[]'::jsonb)
    into v
    from baca b
    cross join lateral public.catatan_peninjau_garis(b.item_id) g
    join public.catatan_peninjau c on c.item_id = g.item_id
   where not exists (select 1 from public.catatan_peninjau x where x.menggantikan_id = c.id);
  return v;
end $$;
revoke all on function public.catatan_peninjau_kelas(uuid, uuid) from public, anon, authenticated;
grant execute on function public.catatan_peninjau_kelas(uuid, uuid) to authenticated;

-- the declared assertion: no consumer of evidence reads the notes, no view is built over them, no source names them
create or replace function public.assert_reviewer_notes_are_not_evidence()
returns table (ok boolean, detail text)
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare problems text[] := '{}'; bad text; v_consumers text[]; n int;
begin
  select array(
    select p.proname::text from pg_proc p
     where p.pronamespace = 'public'::regnamespace
       and (p.proname = any (array[
              'grade_response','evaluate_session','finalize_session','session_final_responses','session_outcome','session_review',
              'session_paper','sanitized_item','reading_map','learning_delta','assemble_session','recompute_result',
              'metric_evaluate','generate_report','certificate_eligibility','certificate_prepare','verify_certificate',
              'teacher_question_evidence','recompute_question_health','management_learner_detail','advance_briefing'])
         or p.proname like 'calc\_%' or p.proname like 'metric\_%' or p.proname like 'laporan\_%' or p.proname like 'report\_%'))
    into v_consumers;
  n := coalesce(cardinality(v_consumers), 0);
  if n < 20 then problems := problems || format('the consumer set has collapsed to %s function(s)', n); end if;
  select string_agg(p.proname, ', ') into bad from pg_proc p
   where p.pronamespace = 'public'::regnamespace and p.proname = any (v_consumers)
     and regexp_replace(regexp_replace(coalesce(p.prosrc, ''), '/\*.*?\*/', ' ', 'gs'), '--[^\n]*', ' ', 'g') ~* '\ycatatan_peninjau\y';
  if bad is not null then problems := problems || ('consumer(s) reading the reviewer notes: ' || bad); end if;
  select string_agg(distinct dep.relname, ', ') into bad
    from pg_depend d join pg_rewrite rw on rw.oid = d.objid join pg_class dep on dep.oid = rw.ev_class
   where d.refobjid = to_regclass('public.catatan_peninjau') and dep.oid <> d.refobjid;
  if bad is not null then problems := problems || ('view(s) built over the reviewer notes: ' || bad); end if;
  select string_agg(source_relation, ', ') into bad from public.metric_sources where source_relation = 'catatan_peninjau';
  if bad is not null then problems := problems || ('declared metric source(s): ' || bad); end if;
  return query select cardinality(problems) = 0, coalesce(array_to_string(problems, '; '), '');
end $$;
revoke all on function public.assert_reviewer_notes_are_not_evidence() from public, anon, authenticated;

insert into public.client_rpc_registry (function_name, exposure, note, authorization_kind, authorization_requirement) values
  ('catatan_peninjau_tulis', 'STAFF',
   'C2w: a reviewer writes, or replaces, the note on one option of a sealed question. A school''s question: that school''s '
   || 'CAN_REVIEW; a platform-library question: the library''s reviewers or the platform admin. Refusals PR210.',
   'CAPABILITY', 'CAN_REVIEW'),
  ('catatan_peninjau_studio', 'STAFF',
   'C2w: every reviewer note on every revision of a question''s line, for riwayat_soal''s readers, with I-5. Refusals PR210.',
   'CAPABILITY', 'CAN_DRAFT'),
  ('catatan_peninjau_kelas', 'STAFF',
   'C2w: the current reviewer notes beside the class report, under teacher_question_evidence''s gate, with I-5.',
   'ROLE_SET', 'EDUCATOR')
on conflict (function_name) do update set exposure = excluded.exposure, note = excluded.note,
  authorization_kind = excluded.authorization_kind, authorization_requirement = excluded.authorization_requirement;

do $$
declare r record; f text;
begin
  select * into r from public.assert_reviewer_notes_are_not_evidence();
  if not r.ok then raise exception 'C2w: the reviewer notes are read as evidence: %', r.detail; end if;
  foreach f in array array['catatan_peninjau_garis(uuid)', 'catatan_peninjau_studio(uuid)', 'catatan_peninjau_kelas(uuid,uuid)'] loop
    if (select prosrc from pg_proc where oid = ('public.' || f)::regprocedure) ~* '\mfor\s+(update|share|no\s+key\s+update|key\s+share)\M' then
      raise exception 'C2w (D3): % takes a row lock', f;
    end if;
  end loop;
  if has_table_privilege('authenticated', 'public.catatan_peninjau', 'SELECT')
     or has_table_privilege('anon', 'public.catatan_peninjau', 'SELECT') then
    raise exception 'C2w: the reviewer notes are readable by a client role';
  end if;
end $$;
