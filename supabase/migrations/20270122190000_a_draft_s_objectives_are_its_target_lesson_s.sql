-- ---------------------------------------------------------------------------------------------------------------
-- C3w-1 · A DRAFT'S OBJECTIVES ARE ITS TARGET LESSON'S, AND THE BUTTON IS OFFERED ONLY WHERE THE REQUEST WOULD BE
-- (Daisy's C-1, C3W-D4, in TINJAUAN-C3W-1-LAYAR-6ace7b2f.md; Sharon's non-blocking note on ai_tersedia; Bob, 23 Nov).
-- Red first: C3W-T07 and C3W-C32.
--
--   * ai_minta_draf refuses a target lesson with no learning objectives (AI_TANPA_TUJUAN, Daisy's sentence) and any
--     objective that is not one of the target lesson's statements (AI_TUJUAN_LAIN), before anything is reserved or
--     sent, so drafts written into lesson B never carry lesson A's aims. Restated in full from its live definition.
--   * ai_tersedia answers yes only where the request's own checks would pass the entitlement: switched on, its option
--     QUALIFIED with its hard stop verified, and now within its dates. Still a yes or no only (S-7, DAISY-25).
--   * ai_tolak words the two new codes. The code stays in DETAIL.
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
      when 'AI_BELUM_DITERIMA'          then 'every AI-generated draft in the package must be kept or removed by an educator before it is submitted'
      when 'AI_KELUARAN_TIDAK_SAH'      then 'the generated output is not the closed single-answer shape asked for'
      when 'AI_PAKET_LOLOS_PERIKSA'     then 'the package is already marked as passing the check, so no AI drafts are made'
      when 'AI_TANPA_TUJUAN'            then 'the target lesson has no learning objectives'
      when 'AI_TUJUAN_LAIN'             then 'an objective is not one of the target lesson''s'
      else 'the AI drafting request was refused'
    end;
end $function$;
revoke all on function public.ai_tolak(text) from public, anon, authenticated;

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
                else jsonb_build_object('ok', m.hasil is null or m.hasil = 'DRAFTED', 'permintaan', m.id, 'ulang', true, 'sidik', m.excerpt_sha256,
                                        'hasil', m.hasil) end;
  end if;
  -- the draft, and the right to author in it (draf_kunci's checks, without its row lock: nothing here writes a question)
  select * into c from public.courses where id = p_course;
  if c.id is null or c.discarded_at is not null then perform public.soal_tolak('DRAFT_UNKNOWN'); end if;
  if not public.draf_boleh_tulis(c.institution_id) then perform public.soal_tolak('DRAFT_NOT_ALLOWED'); end if;
  if public.content_is_sealed(c.id) then perform public.soal_tolak('DRAFT_SEALED'); end if;
  -- Bob's decision 3: a package already checked is not drafted into in 4.1; Daisy's own code, before anything is sent
  if c.status = 'VALIDATED' then perform public.ai_tolak('AI_PAKET_LOLOS_PERIKSA'); end if;
  if c.status not in ('INGESTED', 'STRUCTURED', 'VALIDATION_FAILED') then perform public.soal_tolak('DRAFT_SUBMITTED'); end if;
  if not exists (select 1 from public.lessons l join public.modules md on md.id = l.module_id
                                           where l.id = p_lesson and md.course_id = c.id) then
    perform public.soal_tolak('DRAFT_UNKNOWN');
  end if;
  if length(coalesce(btrim(p_tujuan), '')) not between 1 and 500 or coalesce(p_jumlah, 0) not between 1 and 10
     or length(coalesce(p_teks, '')) not between 1 and 20000 then
    raise exception using errcode = '22023', message = 'an objective of 1 to 500 characters, 1 to 10 questions, and an excerpt of 1 to 20000 characters';
  end if;
  -- C-1 (Daisy, C3W-D4): the drafts go into the target lesson, so their objectives are its own. A target with none is
  -- refused by name; an objective that is not one of its statements (a stale form, another lesson's) is refused too
  if not exists (select 1 from public.learning_objectives lo where lo.lesson_id = p_lesson) then
    return jsonb_build_object('ok', false, 'kode', 'AI_TANPA_TUJUAN');
  end if;
  if exists (select 1 from unnest(string_to_array(p_tujuan, E'\n')) t(baris)
              where btrim(t.baris) <> ''
                and not exists (select 1 from public.learning_objectives lo
                                 where lo.lesson_id = p_lesson and btrim(lo.statement) = btrim(t.baris))) then
    return jsonb_build_object('ok', false, 'kode', 'AI_TUJUAN_LAIN');
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
    return jsonb_build_object('ok', true, 'permintaan', v_id, 'ulang', true,
                              'sidik', (select r.excerpt_sha256 from public.ai_permintaan r where r.id = v_id));
  end if;
  perform public.audit_write('ai.draft_requested', 'ai_permintaan', v_id::text, c.institution_id,
    jsonb_build_object('course', c.id, 'jumlah', p_jumlah));
  -- F-2: the hash of the text this check passed; the route sends only a text with this hash
  return jsonb_build_object('ok', true, 'permintaan', v_id, 'sidik', encode(extensions.digest(p_teks, 'sha256'), 'hex'));
end $function$;
revoke all on function public.ai_minta_draf(uuid, uuid, text, text, integer, text, boolean, text) from public, anon, authenticated;
grant execute on function public.ai_minta_draf(uuid, uuid, text, text, integer, text, boolean, text) to authenticated;

create or replace function public.ai_tersedia(p_course uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select public.current_person_id() is not null
     and exists (select 1 from public.courses c
                   join public.ai_hak_sekolah h on h.sekolah = c.institution_id
                   join public.ai_opsi o on o.id = h.opsi
                  where c.id = p_course and h.aktif
                    and o.status = 'QUALIFIED' and o.henti_keras_terverifikasi
                    and now() >= h.mulai and (h.berakhir is null or now() < h.berakhir)
                    and public.draf_boleh_tulis(c.institution_id))
$$;
revoke all on function public.ai_tersedia(uuid) from public, anon, authenticated;
grant execute on function public.ai_tersedia(uuid) to authenticated;

do $$
begin
  if position('AI_TANPA_TUJUAN' in pg_get_functiondef('public.ai_minta_draf(uuid,uuid,text,text,integer,text,boolean,text)'::regprocedure)) = 0
     or position('AI_TUJUAN_LAIN' in pg_get_functiondef('public.ai_minta_draf(uuid,uuid,text,text,integer,text,boolean,text)'::regprocedure)) = 0 then
    raise exception 'C3w-1 (C-1): the request does not hold its objectives to the target lesson';
  end if;
  if position('QUALIFIED' in pg_get_functiondef('public.ai_tersedia(uuid)'::regprocedure)) = 0 then
    raise exception 'C3w-1: ai_tersedia does not follow the request''s entitlement checks';
  end if;
end $$;
