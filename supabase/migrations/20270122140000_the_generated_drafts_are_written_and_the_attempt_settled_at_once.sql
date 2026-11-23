-- ---------------------------------------------------------------------------------------------------------------
-- C3w-1 · THE GENERATED DRAFTS ARE WRITTEN, AND THE ATTEMPT SETTLED, IN ONE TRANSACTION (Bob's Q1, accepted by Sharon
-- with three additions, C3W-1-BUILD-992b568f.md). Red first: C3W-T03, and C3W-D1, D1b, D4 naming it.
--
--   ai_tulis_draf(p_percobaan, p_soal, p_penggunaan), service_role only. The requester, the school, the package and
--   the lesson come from the attempt's rows, never from an argument (D-1). In one transaction:
--     * the attempt must be a claimed sending (RESERVED, dikirim_at set);
--     * p_soal is closed (Sharon's addition 2): an array of exactly the count asked; each item exactly stem and
--       options; each option exactly label, body, is_correct and an optional rationale; one key per item; the stem at
--       most 2000 characters, a body 500, a rationale 1000. Then each item passes the editor's own soal_draf_masalah;
--     * under the package's row lock, it is still a draft and not sealed, and the requester still holds CAN_DRAFT in
--       its school (Sharon's addition 1, the role read for that person at write time);
--     * each item is written through the editor's own helpers (soal_tulis_pilihan, draf_jalur_status), authored by
--       the requester, with its ITEM_ADDED edit row; its provenance row's isi_sha256 is computed from the stored item
--       after the write (Sharon's addition 3, the hash ai_putuskan compares);
--     * the attempt is settled at the reported usage under school, option and platform FOR UPDATE (D-4), and the
--       request records DRAFTED.
--   Any refusal raises, so nothing is written and the claim stays RESERVED: the provider was called, so the route
--   settles it at its usage (ai_selesaikan), or the sweep holds it UNRECONCILED. A sent attempt is never released.
--   A package already VALIDATED is refused for now: sending it back to be checked needs a signed-in educator.
-- ---------------------------------------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.ai_tolak(p_code text)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  raise exception using
    errcode = 'PR220',
    detail  = p_code,
    message = case p_code
      when 'AI_TIDAK_TERSEDIA'          then 'AI drafting is not available for this school'
      when 'AI_HAK_BERAKHIR'            then 'the school''s AI drafting entitlement is outside its dates'
      when 'AI_JATAH_HABIS'             then 'the school''s or the educator''s AI drafting allowance is used up'
      when 'AI_PLAFON'                  then 'the provider''s or the platform''s AI spending ceiling is reached'
      when 'AI_HAK_SUMBER'              then 'the source-rights confirmation is missing'
      when 'AI_DATA_PRIBADI'            then 'the excerpt holds personal information and was not sent'
      when 'AI_BELUM_DIPERIKSA'         then 'the request has not passed the personal-information check'
      when 'AI_GAGAL'                   then 'the provider failed after the bounded retries'
      when 'AI_PENGGUNAAN_TIDAK_SAH'    then 'the usage is exactly token_masuk, token_keluar and biaya_mikro as non-negative integers, and an optional id_penyedia'
      when 'AI_PERCOBAAN_TIDAK_TERBUKA' then 'the attempt is not in a state this act ends'
      when 'AI_BUKAN_DRAF_AI'           then 'the question is not an AI-generated draft'
      when 'AI_KEPUTUSAN_TIDAK_SAH'     then 'a decision on a generated draft is TERIMA or HAPUS'
      when 'AI_DRAF_TIDAK_TERBUKA'      then 'the package is no longer a draft that AI questions can be written into'
      when 'AI_TIDAK_BOLEH_MENULIS'     then 'the requester may no longer author in this package'
      when 'AI_TANPA_PELAJARAN'         then 'a generated draft needs the lesson it is written into'
      when 'AI_MAJU_SAJA'               then 'an AI attempt only moves forward, and is never deleted'
      else 'the AI drafting request was refused'
    end;
end $function$;
revoke all on function public.ai_tolak(text) from public, anon, authenticated;

create or replace function public.ai_soal_tertutup(p_soal jsonb, p_jumlah integer)
returns boolean language sql immutable set search_path = public, pg_temp as $$
  select coalesce(jsonb_typeof(p_soal) = 'array' and jsonb_array_length(p_soal) = p_jumlah
    and not exists (
      select 1 from jsonb_array_elements(p_soal) x
       where jsonb_typeof(x) <> 'object'
          or exists (select 1 from jsonb_object_keys(x) k where k not in ('stem', 'options'))
          or jsonb_typeof(x -> 'stem') is distinct from 'string' or length(btrim(x ->> 'stem')) not between 1 and 2000
          or jsonb_typeof(x -> 'options') is distinct from 'array' or jsonb_array_length(x -> 'options') not between 2 and 5
          or (select count(*) from jsonb_array_elements(x -> 'options') o where o -> 'is_correct' = 'true'::jsonb) <> 1
          or (select count(distinct o ->> 'label') from jsonb_array_elements(x -> 'options') o) <> jsonb_array_length(x -> 'options')
          or exists (
            select 1 from jsonb_array_elements(x -> 'options') o
             where jsonb_typeof(o) <> 'object'
                or exists (select 1 from jsonb_object_keys(o) k where k not in ('label', 'body', 'is_correct', 'rationale'))
                or coalesce(o ->> 'label', '') !~ '^[A-E]$'
                or jsonb_typeof(o -> 'body') is distinct from 'string' or length(btrim(o ->> 'body')) not between 1 and 500
                or jsonb_typeof(o -> 'is_correct') is distinct from 'boolean'
                or (o ? 'rationale' and (jsonb_typeof(o -> 'rationale') <> 'string' or length(o ->> 'rationale') > 1000)))),
    false)
$$;
revoke all on function public.ai_soal_tertutup(jsonb, integer) from public, anon, authenticated;

create or replace function public.ai_tulis_draf(p_percobaan uuid, p_soal jsonb, p_penggunaan jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  a public.ai_percobaan%rowtype;
  m public.ai_permintaan%rowtype;
  c public.courses%rowtype;
  x jsonb;
  st public.content_status;
  v_obj uuid[];
  v_item uuid;
  v_items uuid[] := '{}';
  v_biaya bigint;
  v_n integer;
begin
  if not public.ai_penggunaan_sah(p_penggunaan) then perform public.ai_tolak('AI_PENGGUNAAN_TIDAK_SAH'); end if;
  select p.* into a from public.ai_percobaan p where p.id = p_percobaan;
  if not found or a.keadaan <> 'RESERVED' or a.dikirim_at is null then perform public.ai_tolak('AI_PERCOBAAN_TIDAK_TERBUKA'); end if;
  select r.* into m from public.ai_permintaan r where r.id = a.permintaan;
  if m.lesson_id is null then perform public.ai_tolak('AI_TANPA_PELAJARAN'); end if;
  -- Sharon's addition 2: the closed shape, the single key and the count, before anything is locked
  if not public.ai_soal_tertutup(p_soal, m.jumlah) then perform public.ai_tolak('AI_KELUARAN_TIDAK_SAH'); end if;
  -- Sharon's addition 1, under the package's row lock: still a draft, not sealed, and the requester still authors there
  select k.* into c from public.courses k where k.id = m.course_id for update;
  if c.id is null or c.discarded_at is not null or public.content_is_sealed(c.id)
     or c.status not in ('INGESTED', 'STRUCTURED', 'VALIDATION_FAILED') then
    perform public.ai_tolak('AI_DRAF_TIDAK_TERBUKA');
  end if;
  if not exists (
       select 1 from public.role_assignments ra
        where ra.person_id = m.pemohon and ra.revoked_at is null
          and now() >= ra.valid_from and now() < ra.valid_until
          and 'CAN_DRAFT' = any (public.role_capabilities(ra.role))
          and (ra.role = 'SYSTEM_ADMIN'
               or exists (select 1 from public.org_nodes n where n.id = ra.scope_node_id and n.institution_id = c.institution_id)))
     or (exists (select 1 from public.institutions i where i.id = c.institution_id and i.tenant_kind = 'PLATFORM_CANONICAL')
         and not exists (select 1 from public.role_assignments ra where ra.person_id = m.pemohon and ra.revoked_at is null
                          and ra.role = 'SYSTEM_ADMIN' and now() >= ra.valid_from and now() < ra.valid_until)) then
    perform public.ai_tolak('AI_TIDAK_BOLEH_MENULIS');
  end if;
  if not exists (select 1 from public.lessons l join public.modules md on md.id = l.module_id
                  where l.id = m.lesson_id and md.course_id = c.id) then
    perform public.ai_tolak('AI_TANPA_PELAJARAN');
  end if;
  for x in select value from jsonb_array_elements(p_soal) loop
    if jsonb_array_length(public.soal_draf_masalah(c.id, c.institution_id, 'MCQ_SINGLE', x)) > 0 then
      perform public.ai_tolak('AI_KELUARAN_TIDAK_SAH');
    end if;
  end loop;
  -- the drafts, through the editor's own helpers, authored by the requester
  select coalesce(array_agg(lo.id order by lo.code), '{}') into v_obj from public.learning_objectives lo where lo.lesson_id = m.lesson_id;
  for x in select value from jsonb_array_elements(p_soal) loop
    insert into public.items (lesson_id, institution_id, item_type, bank_type, stem, stimulus, objective_ids, cycle_role, author_person_id)
    values (m.lesson_id, c.institution_id, 'MCQ_SINGLE', 'PRACTICE', btrim(x ->> 'stem'), null, v_obj, null, m.pemohon)
    returning id into v_item;
    perform public.soal_tulis_pilihan(v_item, c.institution_id, x);
    foreach st in array public.draf_jalur_status(c.status) loop
      update public.items set status = st where id = v_item;
    end loop;
    update public.items set edited_at = now(), edited_by_person_id = m.pemohon, revision = 1 where id = v_item;
    insert into public.item_draft_edits (institution_id, course_id, item_id, action, revision_from, revision_to, changed, by_person_id)
    values (c.institution_id, c.id, v_item, 'ITEM_ADDED', null, 1, jsonb_build_object('added', true, 'ai', true), m.pemohon);
    -- Sharon's addition 3: the hash of the item as stored, after the write
    insert into public.ai_asal_soal (item_id, permintaan, percobaan, model_ident, id_penyedia, versi_prompt, excerpt_sha256, pemohon, isi_sha256)
    values (v_item, m.id, a.id, a.model_ident, p_penggunaan ->> 'id_penyedia', 'c3w-1.1', m.excerpt_sha256, m.pemohon,
            public.ai_isi_soal_sha256(v_item));
    v_items := v_items || v_item;
  end loop;
  update public.ai_permintaan set hasil = 'DRAFTED' where id = m.id and hasil is null;
  -- written before the three locks, so the audit row's own reads come first (A2A-L01)
  perform public.audit_write('ai.drafts_written', 'ai_percobaan', p_percobaan::text, c.institution_id,
    jsonb_build_object('course', c.id, 'lesson', m.lesson_id, 'jumlah', cardinality(v_items)));
  -- D-4: school, option, platform, then the settle at the reported usage (ai_selesaikan's guarded update, inline, so
  -- the three rows are taken once and in order)
  perform 1 from public.ai_hak_sekolah where sekolah = m.sekolah for update;
  perform 1 from public.ai_opsi where id = a.opsi for update;
  perform 1 from public.ai_plafon_platform where id for update;
  v_biaya := (p_penggunaan ->> 'biaya_mikro')::bigint;
  update public.ai_percobaan set keadaan = 'SETTLED', diselesaikan = v_biaya, berakhir_at = now(),
         token_masuk = (p_penggunaan ->> 'token_masuk')::bigint, token_keluar = (p_penggunaan ->> 'token_keluar')::bigint,
         id_penyedia = p_penggunaan ->> 'id_penyedia'
   where id = p_percobaan and keadaan = 'RESERVED' and dikirim_at is not null;
  get diagnostics v_n = row_count;
  if v_n <> 1 then perform public.ai_tolak('AI_PERCOBAAN_TIDAK_TERBUKA'); end if;
  -- §4.3: a cost above its reservation stops the platform
  if v_biaya > a.dicadangkan then
    update public.ai_plafon_platform set berhenti = true, berhenti_pada = coalesce(berhenti_pada, now()) where id;
  end if;
  return jsonb_build_object('ok', true, 'items', to_jsonb(v_items));
end $$;
revoke all on function public.ai_tulis_draf(uuid, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.ai_tulis_draf(uuid, jsonb, jsonb) to service_role;

do $$
begin
  if has_function_privilege('authenticated', 'public.ai_tulis_draf(uuid,jsonb,jsonb)', 'execute') then
    raise exception 'C3w-1 (D-1): ai_tulis_draf is reachable by authenticated';
  end if;
  if public.ai_soal_tertutup('[{"stem": "s", "options": [{"label": "A", "body": "a", "is_correct": true}, {"label": "B", "body": "b", "is_correct": false}], "author_person_id": "x"}]', 1) then
    raise exception 'C3w-1 (Q1, addition 2): the shape is not closed';
  end if;
end $$;
