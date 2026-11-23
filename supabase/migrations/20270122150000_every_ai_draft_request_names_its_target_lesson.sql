-- ---------------------------------------------------------------------------------------------------------------
-- C3w-1 · EVERY REQUEST NAMES ITS TARGET LESSON (Bob's ruling of 21 Nov on the pasted text's target). Red first:
-- C3W-T04 (selftest/c3w-terima.test.ts).
--
--   * ai_permintaan.lesson_id is the target, a lesson of the package, required and fixed at insert; sumber_jenis is
--     only where the excerpt came from (PELAJARAN, the lesson's own text, or TEMPEL, pasted). The check that tied
--     the two together is dropped.
--   * ai_minta_draf gains p_sumber (default TEMPEL), refuses a request naming no lesson with AI_TANPA_PELAJARAN, and
--     checks the lesson belongs to the package. The seven-argument form is dropped.
--   * ai_tulis_draf writes only there, the lesson re-checked at write time; AI_TANPA_PELAJARAN is retired as a
--     write-time refusal (it cannot happen once the lesson is required at insert), and a lesson no longer in the
--     package refuses with AI_DRAF_TIDAK_TERBUKA.
-- Both functions are restated in full from their live definitions.
-- ---------------------------------------------------------------------------------------------------------------

alter table public.ai_permintaan drop constraint ai_permintaan_check;
alter table public.ai_permintaan alter column lesson_id set not null;

drop function public.ai_minta_draf(uuid, uuid, text, text, integer, text, boolean);
CREATE OR REPLACE FUNCTION public.ai_minta_draf(p_course uuid, p_lesson uuid, p_teks text, p_tujuan text, p_jumlah integer, p_kunci_idempoten text, p_hak_sumber boolean, p_sumber text DEFAULT 'TEMPEL'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
  -- Bob's ruling (21 Nov): every request names its target lesson; the source is only its kind
  if p_lesson is null then perform public.ai_tolak('AI_TANPA_PELAJARAN'); end if;
  if coalesce(p_sumber, '') not in ('PELAJARAN', 'TEMPEL') then
    raise exception using errcode = '22023', message = 'the source is PELAJARAN or TEMPEL';
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
  if not exists (select 1 from public.lessons l join public.modules md on md.id = l.module_id
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
                                      kunci_idempoten, hak_sumber_dikonfirmasi_at, diperiksa_at, hasil, panjang_karakter)
    values (c.institution_id, v_me, c.id, p_sumber, p_lesson, null,
            btrim(p_tujuan), p_jumlah, p_kunci_idempoten, now(), now(), 'REFUSED_PERSONAL_DATA', length(p_teks))
    on conflict (pemohon, kunci_idempoten) do nothing
    returning id into v_id;
    perform public.audit_write('ai.draft_requested', 'ai_permintaan', v_id::text, c.institution_id,
      jsonb_build_object('course', c.id, 'hasil', 'REFUSED_PERSONAL_DATA', 'kelas', v_periksa -> 'kelas'));
    return jsonb_build_object('ok', false, 'kode', 'AI_DATA_PRIBADI', 'permintaan', v_id,
                              'kelas', v_periksa -> 'kelas', 'rentang', v_periksa -> 'rentang');
  end if;
  insert into public.ai_permintaan (sekolah, pemohon, course_id, sumber_jenis, lesson_id, excerpt_sha256, tujuan, jumlah,
                                    kunci_idempoten, hak_sumber_dikonfirmasi_at, diperiksa_at, panjang_karakter)
  values (c.institution_id, v_me, c.id, p_sumber, p_lesson,
          encode(extensions.digest(p_teks, 'sha256'), 'hex'), btrim(p_tujuan), p_jumlah, p_kunci_idempoten, now(), now(), length(p_teks))
  on conflict (pemohon, kunci_idempoten) do nothing
  returning id into v_id;
  if v_id is null then
    select id into v_id from public.ai_permintaan where pemohon = v_me and kunci_idempoten = p_kunci_idempoten;
    return jsonb_build_object('ok', true, 'permintaan', v_id, 'ulang', true);
  end if;
  perform public.audit_write('ai.draft_requested', 'ai_permintaan', v_id::text, c.institution_id,
    jsonb_build_object('course', c.id, 'jumlah', p_jumlah));
  return jsonb_build_object('ok', true, 'permintaan', v_id);
end $function$;
revoke all on function public.ai_minta_draf(uuid, uuid, text, text, integer, text, boolean, text) from public, anon, authenticated;
grant execute on function public.ai_minta_draf(uuid, uuid, text, text, integer, text, boolean, text) to authenticated;

CREATE OR REPLACE FUNCTION public.ai_tulis_draf(p_percobaan uuid, p_soal jsonb, p_penggunaan jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
    perform public.ai_tolak('AI_DRAF_TIDAK_TERBUKA');
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
end $function$;
revoke all on function public.ai_tulis_draf(uuid, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.ai_tulis_draf(uuid, jsonb, jsonb) to service_role;

do $$
begin
  if position('AI_TANPA_PELAJARAN' in pg_get_functiondef('public.ai_tulis_draf(uuid,jsonb,jsonb)'::regprocedure)) > 0 then
    raise exception 'C3w-1: AI_TANPA_PELAJARAN is retired as a write-time refusal';
  end if;
  if position('AI_TANPA_PELAJARAN' in pg_get_functiondef('public.ai_minta_draf(uuid,uuid,text,text,integer,text,boolean,text)'::regprocedure)) = 0 then
    raise exception 'C3w-1: the request does not require its target lesson';
  end if;
end $$;
