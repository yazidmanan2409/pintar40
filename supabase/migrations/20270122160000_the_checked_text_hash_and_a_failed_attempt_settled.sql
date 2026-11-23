-- ---------------------------------------------------------------------------------------------------------------
-- C3w-1 · THE CHECKED TEXT'S HASH, AND A FAILED ATTEMPT SETTLED WITH ITS OUTCOME (Sharon's F-2 of her build review of
-- 992b568f; Bob's decision 2 of 21 Nov). Red first: C3W-T05 (selftest/c3w-terima.test.ts), and C3W-D1, D1b, D4 naming
-- ai_gagal.
--
--   * ai_minta_draf answers `sidik`, the sha-256 of the text its check passed, on its ok answers and its repeated-key
--     answers. The route compares it with the hash of the text it is about to send, before the claim (F-2), and sends
--     exactly the checked text, never a fresh read. Restated in full from its live definition.
--   * ai_gagal(p_percobaan, p_penggunaan, p_hasil), service_role only: a claimed sending that failed (the provider
--     failed with usage, or its output was refused by ai_tulis_draf) is settled at the reported usage, under school,
--     option and platform FOR UPDATE (D-4), and the request records PROVIDER_FAILED or INVALID_OUTPUT. A sent attempt
--     is never released (Bob's decision 2). An attempt never claimed is refused: it never left, so ai_lepaskan
--     releases it.
-- ---------------------------------------------------------------------------------------------------------------

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

create or replace function public.ai_gagal(p_percobaan uuid, p_penggunaan jsonb, p_hasil text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  a public.ai_percobaan%rowtype;
  v_sekolah uuid;
  v_biaya bigint;
  n integer;
begin
  if not public.ai_penggunaan_sah(p_penggunaan) then perform public.ai_tolak('AI_PENGGUNAAN_TIDAK_SAH'); end if;
  if p_hasil is null or p_hasil not in ('PROVIDER_FAILED', 'INVALID_OUTPUT') then
    raise exception using errcode = '22023', message = 'a failed attempt''s outcome is PROVIDER_FAILED or INVALID_OUTPUT';
  end if;
  select p.* into a from public.ai_percobaan p where p.id = p_percobaan;
  if not found or a.keadaan <> 'RESERVED' or a.dikirim_at is null then perform public.ai_tolak('AI_PERCOBAAN_TIDAK_TERBUKA'); end if;
  select m.sekolah into v_sekolah from public.ai_permintaan m where m.id = a.permintaan;
  update public.ai_permintaan set hasil = p_hasil where id = a.permintaan and hasil is null;
  -- written before the three locks, so the audit row's own reads come first (A2A-L01)
  perform public.audit_write('ai.attempt_failed', 'ai_percobaan', p_percobaan::text, v_sekolah,
    jsonb_build_object('hasil', p_hasil, 'biaya_mikro', (p_penggunaan ->> 'biaya_mikro')::bigint));
  perform 1 from public.ai_hak_sekolah where sekolah = v_sekolah for update;
  perform 1 from public.ai_opsi where id = a.opsi for update;
  perform 1 from public.ai_plafon_platform where id for update;
  v_biaya := (p_penggunaan ->> 'biaya_mikro')::bigint;
  update public.ai_percobaan set keadaan = 'SETTLED', diselesaikan = v_biaya, berakhir_at = now(),
         token_masuk = (p_penggunaan ->> 'token_masuk')::bigint, token_keluar = (p_penggunaan ->> 'token_keluar')::bigint,
         id_penyedia = p_penggunaan ->> 'id_penyedia'
   where id = p_percobaan and keadaan = 'RESERVED' and dikirim_at is not null;
  get diagnostics n = row_count;
  if n <> 1 then perform public.ai_tolak('AI_PERCOBAAN_TIDAK_TERBUKA'); end if;
  if v_biaya > a.dicadangkan then
    update public.ai_plafon_platform set berhenti = true, berhenti_pada = coalesce(berhenti_pada, now()) where id;
  end if;
  return jsonb_build_object('ok', true, 'keadaan', 'SETTLED', 'hasil', p_hasil);
end $$;
revoke all on function public.ai_gagal(uuid, jsonb, text) from public, anon, authenticated;
grant execute on function public.ai_gagal(uuid, jsonb, text) to service_role;

do $$
begin
  if has_function_privilege('authenticated', 'public.ai_gagal(uuid,jsonb,text)', 'execute') then
    raise exception 'C3w-1 (D-1): ai_gagal is reachable by authenticated';
  end if;
  if position('''sidik''' in pg_get_functiondef('public.ai_minta_draf(uuid,uuid,text,text,integer,text,boolean,text)'::regprocedure)) = 0 then
    raise exception 'C3w-1 (F-2): the request does not answer the hash it checked';
  end if;
end $$;
