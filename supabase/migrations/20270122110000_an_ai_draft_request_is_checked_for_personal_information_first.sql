-- ---------------------------------------------------------------------------------------------------------------
-- C3w-1 · THE REQUEST, R-3'S CHECK, PROVENANCE AND ACCEPTANCE (chunk 2). C3W-1-DESIGN.md §2, §3, §9; Sharon's
-- C3W-R3-DESIGN.md controls 1, 2 and 4 and the common-names rule. Red first: C3W-D1 and R3-01 to R3-07
-- (selftest/c3w-syarat.test.ts, selftest/c3w-r3.test.ts).
--
--   * c3w_pembaca: a NOLOGIN role holding SELECT on the content tables only (lessons, learning_objectives, modules,
--     courses). It owns c3w_bahan, so even an edited body cannot read a person, a response, a sitting, a result, an
--     enrolment or an account: the database refuses it (control 1). Its row policies admit only the one lesson the
--     current call names (a transaction-local setting c3w_bahan sets itself), never a whole table.
--   * c3w_periksa_bahan(text): the check on the final excerpt, whatever its source (control 2), as the signed-in
--     educator. Three classes block: IDENTIFIER (a PINTAR ID, an email, an Indonesian phone number, a 10- or 16-digit
--     number), NAME (the full name of a learner visible to this educator, person_visible_to_me), LIST (three lines of
--     name and score or class label in a 10-line window, or three visible learners' given names in one sentence or
--     line). It answers {boleh, kelas, rentang} only: never a name, a PINTAR ID or a person id (R3-06), and the same
--     answer for a learner out of sight as for no learner (R3-05).
--   * ai_minta_draf: the educator's request (D-1: the person from the session, the school from the package). In
--     order: the draft and the author's right to it, the source-rights confirmation (D10), the school's entitlement
--     (S-6, checked here and again under the reservation's locks), then R-3. A match is recorded REFUSED_PERSONAL_DATA
--     with no hash (control 4) and answered AI_DATA_PRIBADI; nothing is reserved. A repeated idempotency key answers
--     the first outcome (D11).
--   * ai_asal_soal (D3, provenance) and ai_penerimaan (D2, acceptance, an append-only log whose latest row is the
--     current decision, Sharon §9.2): immutable, closed to every client role, never a metric source. Their writers
--     come with the drafting route.
-- ---------------------------------------------------------------------------------------------------------------

-- ---------------------------------------------------------------------------------------------------------------- control 1
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'c3w_pembaca') then
    create role c3w_pembaca nologin;
  end if;
end $$;
alter role c3w_pembaca nologin;
-- the migrating role must be able to act as the reader to hand it c3w_bahan; the reader gains nothing of the migrator's
grant c3w_pembaca to current_user;
grant usage on schema public to c3w_pembaca;
grant select on public.lessons, public.learning_objectives, public.modules, public.courses to c3w_pembaca;
create policy c3w_pembaca_satu_pelajaran on public.lessons for select to c3w_pembaca
  using (id = nullif(current_setting('c3w.pelajaran', true), '')::uuid);
create policy c3w_pembaca_tujuan_pelajaran on public.learning_objectives for select to c3w_pembaca
  using (lesson_id = nullif(current_setting('c3w.pelajaran', true), '')::uuid);

-- the lesson's own text and the chosen objectives' statements: content only
create or replace function public.c3w_bahan(p_lesson uuid, p_objectives uuid[])
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v jsonb;
begin
  perform set_config('c3w.pelajaran', p_lesson::text, true);
  select jsonb_build_object(
           'judul', l.title,
           'teks', concat_ws(chr(10) || chr(10), nullif(l.summary, ''), nullif(l.body_markdown, '')),
           'tujuan', coalesce((select jsonb_agg(o.statement order by o.code) from public.learning_objectives o
                                where o.lesson_id = l.id and o.id = any (coalesce(p_objectives, '{}'))), '[]'::jsonb))
    into v from public.lessons l where l.id = p_lesson;
  perform set_config('c3w.pelajaran', '', true);
  return v;
end $$;
-- taking ownership needs CREATE on the schema at that moment; it is revoked at once, so the reader creates nothing
grant create on schema public to c3w_pembaca;
alter function public.c3w_bahan(uuid, uuid[]) owner to c3w_pembaca;
revoke create on schema public from c3w_pembaca;
revoke all on function public.c3w_bahan(uuid, uuid[]) from public, anon, authenticated;

-- ---------------------------------------------------------------------------------------------------------------- control 2
-- names compared as words: lower case, every run of non-letters one space
create or replace function public.c3w_normal(p text)
returns text language sql immutable set search_path = public, pg_temp as $$
  select btrim(regexp_replace(lower(coalesce(p, '')), '[^[:alpha:]]+', ' ', 'g'))
$$;
revoke all on function public.c3w_normal(text) from public, anon, authenticated;

create or replace function public.c3w_periksa_bahan(p_teks text)
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare
  v_me uuid := public.current_person_id();
  v_teks text := coalesce(p_teks, '');
  v_kecil text := lower(coalesce(p_teks, ''));
  v_kelas text[] := '{}';
  v_rentang int4range[] := '{}';
  v_pola text; v_i integer; v_n integer; v_tok text; v_pos integer; v_len integer;
  r record; v_baris text[]; v_cocok boolean[]; v_awal integer[]; v_mulai integer; v_j integer; v_k integer;
  v_nama text[]; v_depan text[]; v_kalimat text; v_kata text[];
begin
  if v_me is null or not exists (
       select 1 from public.role_assignments ra
        where ra.person_id = v_me and ra.revoked_at is null and ra.institution_id is not null
          and public.can_in_institution('CAN_DRAFT', ra.institution_id)) then
    raise exception using errcode = '42501', message = 'the personal-information check is for an educator who drafts';
  end if;

  -- IDENTIFIER: an email, an Indonesian phone number, a 10- or 16-digit number, a PINTAR ID as typed
  foreach v_pola in array array[
      '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}',
      '(\+62|\m0)[0-9]([ -]?[0-9]){8,11}\M',
      '\m[0-9]{16}\M', '\m[0-9]{10}\M'] loop
    v_n := 1;
    loop
      v_pos := regexp_instr(v_teks, v_pola, 1, v_n);
      exit when v_pos = 0;
      v_len := length(regexp_substr(v_teks, v_pola, 1, v_n));
      v_kelas := v_kelas || 'IDENTIFIER'::text; v_rentang := v_rentang || int4range(v_pos - 1, v_pos - 1 + v_len);
      v_n := v_n + 1;
    end loop;
  end loop;
  v_n := 1;
  loop
    v_pos := regexp_instr(v_teks, '\m[0-9A-Za-z]{4}-?[0-9A-Za-z]{4}\M', 1, v_n);
    exit when v_pos = 0;
    v_tok := regexp_substr(v_teks, '\m[0-9A-Za-z]{4}-?[0-9A-Za-z]{4}\M', 1, v_n);
    -- typed with both a digit and a letter: an ordinary word never is (R3-04)
    if v_tok ~ '[0-9]' and v_tok ~ '[A-Za-z]' and public.pintar_id_canonical(v_tok) is not null then
      v_kelas := v_kelas || 'IDENTIFIER'::text; v_rentang := v_rentang || int4range(v_pos - 1, v_pos - 1 + length(v_tok));
    end if;
    v_n := v_n + 1;
  end loop;

  -- the learners this educator can see (their own classes, now or before), and only them (R3-05)
  select coalesce(array_agg(distinct public.c3w_normal(p.display_name)) filter (where public.c3w_normal(p.display_name) like '% %'), '{}'),
         coalesce(array_agg(distinct split_part(public.c3w_normal(p.display_name), ' ', 1)) filter (where length(split_part(public.c3w_normal(p.display_name), ' ', 1)) >= 2), '{}')
    into v_nama, v_depan
    from public.persons p
   where p.anonymized_at is null and p.id <> v_me
     and p.id in (select e.person_id from public.enrollments e
                   where e.institution_id in (select ra.institution_id from public.role_assignments ra
                                               where ra.person_id = v_me and ra.revoked_at is null and ra.institution_id is not null))
     and public.person_visible_to_me(p.id);

  -- NAME: a visible learner's full name, as words
  foreach v_tok in array v_nama loop
    v_pola := '\m' || replace(v_tok, ' ', '[^[:alpha:]]+') || '\M';
    v_n := 1;
    loop
      v_pos := regexp_instr(v_kecil, v_pola, 1, v_n);
      exit when v_pos = 0;
      v_kelas := v_kelas || 'NAME'::text;
      v_rentang := v_rentang || int4range(v_pos - 1, v_pos - 1 + length(regexp_substr(v_kecil, v_pola, 1, v_n)));
      v_n := v_n + 1;
    end loop;
  end loop;

  -- LIST (a): three lines of «Name 85», «Name Surname - 7A», «Name: B+» in any 10-line window (names PINTAR cannot know)
  v_baris := string_to_array(v_teks, chr(10));
  v_cocok := '{}'; v_awal := '{}'; v_mulai := 0;
  for v_i in 1 .. coalesce(array_length(v_baris, 1), 0) loop
    v_cocok := v_cocok || (v_baris[v_i] ~ '^\s*[A-Z][a-z]+( [A-Z][a-z]+){0,3}\s*([-:,]\s*)?([0-9]{1,3}([.,][0-9]+)?|[A-E][+-]?|[0-9]{1,2}[A-Z])\s*$');
    v_awal := v_awal || v_mulai;
    v_mulai := v_mulai + length(v_baris[v_i]) + 1;
  end loop;
  for v_i in 1 .. coalesce(array_length(v_cocok, 1), 0) loop
    v_k := 0;
    for v_j in v_i .. least(v_i + 9, array_length(v_cocok, 1)) loop
      if v_cocok[v_j] then v_k := v_k + 1; end if;
    end loop;
    if v_k >= 3 then
      for v_j in v_i .. least(v_i + 9, array_length(v_cocok, 1)) loop
        if v_cocok[v_j] then
          v_kelas := v_kelas || 'LIST'::text; v_rentang := v_rentang || int4range(v_awal[v_j], v_awal[v_j] + length(v_baris[v_j]));
        end if;
      end loop;
      exit;
    end if;
  end loop;
  -- LIST (b): three distinct visible learners' given names in one sentence or line
  v_mulai := 0;
  foreach v_kalimat in array regexp_split_to_array(v_teks, '[.!?' || chr(10) || ']') loop
    v_kata := string_to_array(public.c3w_normal(v_kalimat), ' ');
    if (select count(distinct w) from unnest(v_kata) w where w = any (v_depan)) >= 3 then
      v_kelas := v_kelas || 'LIST'::text; v_rentang := v_rentang || int4range(v_mulai, v_mulai + length(v_kalimat));
    end if;
    v_mulai := v_mulai + length(v_kalimat) + 1;
  end loop;

  return jsonb_build_object(
    'boleh', cardinality(v_kelas) = 0,
    'kelas', coalesce((select jsonb_agg(distinct k order by k) from unnest(v_kelas) k), '[]'::jsonb),
    'rentang', coalesce((select jsonb_agg(x::text order by lower(x), upper(x)) from (select distinct x from unnest(v_rentang) x) z), '[]'::jsonb));
end $$;
revoke all on function public.c3w_periksa_bahan(text) from public, anon, authenticated;
grant execute on function public.c3w_periksa_bahan(text) to authenticated;

-- ---------------------------------------------------------------------------------------------------------------- the request
create or replace function public.ai_minta_draf(p_course uuid, p_lesson uuid, p_teks text, p_tujuan text, p_jumlah integer,
                                                p_kunci_idempoten text, p_hak_sumber boolean)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_me uuid := public.current_person_id();
  c public.courses;
  h public.ai_hak_sekolah;
  o public.ai_opsi;
  m public.ai_permintaan;
  v_periksa jsonb;
  v_id uuid;
begin
  if v_me is null then perform public.soal_tolak('DRAFT_NOT_ALLOWED'); end if;
  if coalesce(p_kunci_idempoten, '') !~ '^[A-Za-z0-9_-]{1,80}$' then
    raise exception using errcode = '22023', message = 'the idempotency key is 1 to 80 letters, digits, - or _';
  end if;
  -- D11: the same key answers the first outcome, and makes no new request
  select * into m from public.ai_permintaan where pemohon = v_me and kunci_idempoten = p_kunci_idempoten;
  if found then
    return case when m.hasil = 'REFUSED_PERSONAL_DATA'
                then jsonb_build_object('ok', false, 'kode', 'AI_DATA_PRIBADI', 'permintaan', m.id, 'ulang', true)
                else jsonb_build_object('ok', m.hasil is null or m.hasil = 'DRAFTED', 'permintaan', m.id, 'ulang', true,
                                        'hasil', m.hasil) end;
  end if;
  -- the draft, and the right to author in it (draf_kunci's checks, without its row lock: nothing here writes a question)
  select * into c from public.courses where id = p_course;
  if c.id is null or c.discarded_at is not null then perform public.soal_tolak('DRAFT_UNKNOWN'); end if;
  if not public.draf_boleh_tulis(c.institution_id) then perform public.soal_tolak('DRAFT_NOT_ALLOWED'); end if;
  if public.content_is_sealed(c.id) then perform public.soal_tolak('DRAFT_SEALED'); end if;
  if c.status not in ('INGESTED', 'STRUCTURED', 'VALIDATED', 'VALIDATION_FAILED') then perform public.soal_tolak('DRAFT_SUBMITTED'); end if;
  if p_lesson is not null and not exists (select 1 from public.lessons l join public.modules md on md.id = l.module_id
                                           where l.id = p_lesson and md.course_id = c.id) then
    perform public.soal_tolak('DRAFT_UNKNOWN');
  end if;
  if length(coalesce(btrim(p_tujuan), '')) not between 1 and 500 or coalesce(p_jumlah, 0) not between 1 and 10
     or length(coalesce(p_teks, '')) not between 1 and 20000 then
    raise exception using errcode = '22023', message = 'an objective of 1 to 500 characters, 1 to 10 questions, and an excerpt of 1 to 20000 characters';
  end if;
  -- D10
  if p_hak_sumber is not true then return jsonb_build_object('ok', false, 'kode', 'AI_HAK_SUMBER'); end if;
  -- S-6: the school's entitlement (checked again under the reservation's locks)
  select * into h from public.ai_hak_sekolah where sekolah = c.institution_id;
  if not found or not h.aktif then return jsonb_build_object('ok', false, 'kode', 'AI_TIDAK_TERSEDIA'); end if;
  select * into o from public.ai_opsi where id = h.opsi;
  if o.status <> 'QUALIFIED' or not o.henti_keras_terverifikasi then return jsonb_build_object('ok', false, 'kode', 'AI_TIDAK_TERSEDIA'); end if;
  if now() < h.mulai or (h.berakhir is not null and now() >= h.berakhir) then return jsonb_build_object('ok', false, 'kode', 'AI_HAK_BERAKHIR'); end if;
  -- R-3 (control 2), on the final excerpt, before anything is reserved
  v_periksa := public.c3w_periksa_bahan(p_teks);
  if (v_periksa ->> 'boleh')::boolean is not true then
    insert into public.ai_permintaan (sekolah, pemohon, course_id, sumber_jenis, lesson_id, excerpt_sha256, tujuan, jumlah,
                                      kunci_idempoten, hak_sumber_dikonfirmasi_at, diperiksa_at, hasil)
    values (c.institution_id, v_me, c.id, case when p_lesson is null then 'TEMPEL' else 'PELAJARAN' end, p_lesson, null,
            btrim(p_tujuan), p_jumlah, p_kunci_idempoten, now(), now(), 'REFUSED_PERSONAL_DATA')
    on conflict (pemohon, kunci_idempoten) do nothing
    returning id into v_id;
    perform public.audit_write('ai.draft_requested', 'ai_permintaan', v_id::text, c.institution_id,
      jsonb_build_object('course', c.id, 'hasil', 'REFUSED_PERSONAL_DATA', 'kelas', v_periksa -> 'kelas'));
    return jsonb_build_object('ok', false, 'kode', 'AI_DATA_PRIBADI', 'permintaan', v_id,
                              'kelas', v_periksa -> 'kelas', 'rentang', v_periksa -> 'rentang');
  end if;
  insert into public.ai_permintaan (sekolah, pemohon, course_id, sumber_jenis, lesson_id, excerpt_sha256, tujuan, jumlah,
                                    kunci_idempoten, hak_sumber_dikonfirmasi_at, diperiksa_at)
  values (c.institution_id, v_me, c.id, case when p_lesson is null then 'TEMPEL' else 'PELAJARAN' end, p_lesson,
          encode(extensions.digest(p_teks, 'sha256'), 'hex'), btrim(p_tujuan), p_jumlah, p_kunci_idempoten, now(), now())
  on conflict (pemohon, kunci_idempoten) do nothing
  returning id into v_id;
  if v_id is null then
    select id into v_id from public.ai_permintaan where pemohon = v_me and kunci_idempoten = p_kunci_idempoten;
    return jsonb_build_object('ok', true, 'permintaan', v_id, 'ulang', true);
  end if;
  perform public.audit_write('ai.draft_requested', 'ai_permintaan', v_id::text, c.institution_id,
    jsonb_build_object('course', c.id, 'jumlah', p_jumlah));
  return jsonb_build_object('ok', true, 'permintaan', v_id);
end $$;
revoke all on function public.ai_minta_draf(uuid, uuid, text, text, integer, text, boolean) from public, anon, authenticated;
grant execute on function public.ai_minta_draf(uuid, uuid, text, text, integer, text, boolean) to authenticated;

-- ---------------------------------------------------------------------------------------------------------------- D3, D2
create table public.ai_asal_soal (
  id             uuid primary key default gen_random_uuid(),
  item_id        uuid not null unique references public.items(id),
  permintaan     uuid not null references public.ai_permintaan(id),
  percobaan      uuid not null references public.ai_percobaan(id),
  model_ident    text not null,
  id_penyedia    text check (id_penyedia ~ '^[A-Za-z0-9_-]{1,128}$'),
  versi_prompt   text not null check (versi_prompt ~ '^[a-z0-9.-]{1,40}$'),
  excerpt_sha256 text not null check (excerpt_sha256 ~ '^[0-9a-f]{64}$'),
  pemohon        uuid not null references public.persons(id),
  dibuat_at      timestamptz not null default now()
);
create table public.ai_penerimaan (
  id        uuid primary key default gen_random_uuid(),
  item_id   uuid not null references public.items(id),
  keputusan text not null check (keputusan in ('ACCEPTED', 'EDITED', 'DELETED')),
  oleh      uuid not null references public.persons(id),
  pada      timestamptz not null default clock_timestamp()
);
create index ai_penerimaan_item on public.ai_penerimaan (item_id, pada desc);

create or replace function public.ai_catatan_tetap()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  perform public.ai_tolak('AI_MAJU_SAJA');
  return null;
end $$;
revoke all on function public.ai_catatan_tetap() from public, anon, authenticated;
create trigger ai_asal_soal_tetap before update or delete on public.ai_asal_soal for each row execute function public.ai_catatan_tetap();
create trigger ai_asal_soal_tetap_kosongkan before truncate on public.ai_asal_soal for each statement execute function public.ai_catatan_tetap();
create trigger ai_penerimaan_tetap before update or delete on public.ai_penerimaan for each row execute function public.ai_catatan_tetap();
create trigger ai_penerimaan_tetap_kosongkan before truncate on public.ai_penerimaan for each statement execute function public.ai_catatan_tetap();

do $$
declare t text;
begin
  foreach t in array array['ai_asal_soal', 'ai_penerimaan'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from public, anon, authenticated', t);
  end loop;
end $$;

insert into public.record_class_registry values
  ('ai_asal_soal', 'INSTITUTION_SCOPED', 'C3w-1: where a generated question came from (D3); immutable, never a learner''s'),
  ('ai_penerimaan', 'INSTITUTION_SCOPED', 'C3w-1: an educator''s decision on a generated draft (D2); an append-only log')
on conflict do nothing;
insert into public.orang_lampiran (tabel, kolom, kelas, alasan) values
  ('ai_asal_soal', 'pemohon', 'BEBAS', 'an act''s actor (pemohon): who asked for the draft; no text of theirs is kept'),
  ('ai_penerimaan', 'oleh', 'BEBAS', 'an act''s actor (oleh): who decided on a generated draft')
on conflict do nothing;

-- never a metric source (THE PLAN D4: provenance is staff-only, and no AI table is evidence)
create or replace function public.ai_bukan_sumber_metrik()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if new.source_relation ~ '^(ai_|c3w_)' then perform public.ai_tolak('AI_MAJU_SAJA'); end if;
  return new;
end $$;
revoke all on function public.ai_bukan_sumber_metrik() from public, anon, authenticated;
create trigger ai_bukan_sumber_metrik before insert or update on public.metric_sources
  for each row execute function public.ai_bukan_sumber_metrik();

insert into public.client_rpc_registry (function_name, exposure, note, authorization_kind, authorization_requirement) values
  ('ai_minta_draf', 'STAFF',
   'C3w-1: an educator asks for AI draft questions on a draft package they may author. The person from the session, the '
   || 'school from the package; D10, the entitlement and R-3''s check before anything is reserved. Outcomes by code (PR220).',
   'CAPABILITY', 'CAN_DRAFT'),
  ('c3w_periksa_bahan', 'STAFF',
   'C3w-1: R-3''s check on an excerpt, as the educator: {boleh, kelas, rentang}, never a name or an id.',
   'CAPABILITY', 'CAN_DRAFT')
on conflict (function_name) do update set exposure = excluded.exposure, note = excluded.note,
  authorization_kind = excluded.authorization_kind, authorization_requirement = excluded.authorization_requirement;

do $$
declare bad text;
begin
  -- control 1: the reader reads content only
  select string_agg(t, ', ') into bad
    from unnest(array['persons', 'responses', 'assessment_sessions', 'assessment_results', 'enrollments', 'accounts', 'memberships']) t
   where has_table_privilege('c3w_pembaca', 'public.' || t, 'SELECT');
  if bad is not null then raise exception 'C3w-1 (R-3 control 1): c3w_pembaca reads %', bad; end if;
  if has_schema_privilege('c3w_pembaca', 'public', 'CREATE') then raise exception 'C3w-1 (R-3 control 1): c3w_pembaca can create in public'; end if;
  if (select pg_get_userbyid(proowner) from pg_proc where oid = 'public.c3w_bahan(uuid,uuid[])'::regprocedure) <> 'c3w_pembaca' then
    raise exception 'C3w-1 (R-3 control 1): c3w_bahan is not c3w_pembaca''s';
  end if;
  select string_agg(t, ', ') into bad from unnest(array['ai_asal_soal', 'ai_penerimaan']) t
   where has_table_privilege('authenticated', 'public.' || t, 'SELECT,INSERT,UPDATE,DELETE')
      or has_table_privilege('anon', 'public.' || t, 'SELECT,INSERT,UPDATE,DELETE');
  if bad is not null then raise exception 'C3w-1: provenance or acceptance reachable by a client role: %', bad; end if;
end $$;
