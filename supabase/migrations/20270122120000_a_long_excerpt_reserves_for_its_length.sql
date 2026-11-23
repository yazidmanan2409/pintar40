-- ---------------------------------------------------------------------------------------------------------------
-- C3w-1 · A LONG EXCERPT RESERVES FOR ITS LENGTH (Sharon's build review of 992b568f, F-1; Bob's choice, option (a)).
-- Red first: C3W-F1 (selftest/c3w-syarat.test.ts).
--
-- A reservation bounded its input by a fixed estimate, but an excerpt runs to 20,000 characters: a long one could settle
-- above its reservation and trip the platform-wide stop, refusing every school.
--   * ai_permintaan.panjang_karakter: the excerpt's length in characters, recorded by ai_minta_draf (a length is not the
--     text, and not a hash of it: R-3 control 4 holds on a refused request too).
--   * ai_token_per_karakter(): k, the named constant, 1 token per character, a conservative upper bound for the
--     Latin-script text the excerpt is (real tokenizers average several characters per token).
--   * ai_opsi.perkiraan_token_masuk is renamed batas_token_prompt: it now bounds only the prompt's fixed part.
--   * ai_cadangkan reserves maks_token_keluar × price_out + (ceil(length × k) + batas_token_prompt) × price_in, and
--     refuses a request with no recorded length.
-- Both functions are restated in full from their live definitions, grants unchanged (revoked and granted again).
-- ---------------------------------------------------------------------------------------------------------------

alter table public.ai_permintaan add column panjang_karakter integer check (panjang_karakter between 1 and 20000);
alter table public.ai_opsi rename column perkiraan_token_masuk to batas_token_prompt;

create or replace function public.ai_token_per_karakter()
returns numeric language sql immutable set search_path = public, pg_temp as $$ select 1.0::numeric $$;
revoke all on function public.ai_token_per_karakter() from public, anon, authenticated;
grant execute on function public.ai_token_per_karakter() to service_role;

CREATE OR REPLACE FUNCTION public.ai_cadangkan(p_permintaan uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  m public.ai_permintaan%rowtype;
  h public.ai_hak_sekolah%rowtype;
  o public.ai_opsi%rowtype;
  pl public.ai_plafon_platform%rowtype;
  v_terburuk bigint;
  v_sekolah_pakai bigint; v_pendidik_pakai bigint; v_opsi_pakai bigint; v_platform_pakai bigint;
  v_id uuid;
begin
  select * into m from public.ai_permintaan where id = p_permintaan;
  if not found or m.hasil is not null then perform public.ai_tolak('AI_PERCOBAAN_TIDAK_TERBUKA'); end if;
  if m.hak_sumber_dikonfirmasi_at is null then perform public.ai_tolak('AI_HAK_SUMBER'); end if;
  if m.diperiksa_at is null then perform public.ai_tolak('AI_BELUM_DIPERIKSA'); end if;
  select * into h from public.ai_hak_sekolah where sekolah = m.sekolah for update;
  if not found or not h.aktif then perform public.ai_tolak('AI_TIDAK_TERSEDIA'); end if;
  if now() < h.mulai or (h.berakhir is not null and now() >= h.berakhir) then perform public.ai_tolak('AI_HAK_BERAKHIR'); end if;
  select * into o from public.ai_opsi where id = h.opsi for update;
  if o.status <> 'QUALIFIED' or not o.henti_keras_terverifikasi then perform public.ai_tolak('AI_TIDAK_TERSEDIA'); end if;
  select * into pl from public.ai_plafon_platform where id for update;
  if not found then perform public.ai_tolak('AI_TIDAK_TERSEDIA'); end if;
  if pl.berhenti then perform public.ai_tolak('AI_PLAFON'); end if;
  -- D11: at most 2 retries, so 3 attempts in all (§9.4)
  if (select count(*) from public.ai_percobaan a where a.permintaan = m.id) >= 3 then perform public.ai_tolak('AI_GAGAL'); end if;
  -- F-1: the input is bounded by the excerpt's own length (ceil(length × k)) plus the prompt's fixed part
  if m.panjang_karakter is null then perform public.ai_tolak('AI_BELUM_DIPERIKSA'); end if;
  v_terburuk := o.maks_token_keluar::bigint * (o.harga_dasar ->> 'keluar')::bigint
              + (ceil(m.panjang_karakter * public.ai_token_per_karakter())::bigint + o.batas_token_prompt::bigint)
                * (o.harga_dasar ->> 'masuk')::bigint;
  -- held (RESERVED, UNRECONCILED) at the reserved amount, settled at the settled amount; read under the three locks
  select coalesce(sum(a.jml) filter (where m2.sekolah = m.sekolah), 0),
         coalesce(sum(a.jml) filter (where m2.sekolah = m.sekolah and m2.pemohon = m.pemohon), 0),
         coalesce(sum(a.jml) filter (where a.opsi = o.id), 0),
         coalesce(sum(a.jml), 0)
    into v_sekolah_pakai, v_pendidik_pakai, v_opsi_pakai, v_platform_pakai
    from (select p.permintaan, p.opsi, case when p.keadaan = 'SETTLED' then p.diselesaikan else p.dicadangkan end as jml
            from public.ai_percobaan p where p.keadaan in ('RESERVED', 'UNRECONCILED', 'SETTLED')) a
    join public.ai_permintaan m2 on m2.id = a.permintaan;
  if v_terburuk + v_sekolah_pakai > h.jatah then perform public.ai_tolak('AI_JATAH_HABIS'); end if;
  if h.batas_per_pendidik is not null and v_terburuk + v_pendidik_pakai > h.batas_per_pendidik then perform public.ai_tolak('AI_JATAH_HABIS'); end if;
  if v_terburuk + v_opsi_pakai > o.plafon_biaya then perform public.ai_tolak('AI_PLAFON'); end if;
  if v_terburuk + v_platform_pakai > pl.plafon then perform public.ai_tolak('AI_PLAFON'); end if;
  insert into public.ai_percobaan (permintaan, opsi, model_ident, harga_dasar, dicadangkan, keadaan)
  values (m.id, o.id, o.model_ident, o.harga_dasar, v_terburuk, 'RESERVED')
  returning id into v_id;
  return v_id;
end $function$;
revoke all on function public.ai_cadangkan(uuid) from public, anon, authenticated;
grant execute on function public.ai_cadangkan(uuid) to service_role;

CREATE OR REPLACE FUNCTION public.ai_minta_draf(p_course uuid, p_lesson uuid, p_teks text, p_tujuan text, p_jumlah integer, p_kunci_idempoten text, p_hak_sumber boolean)
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
                                      kunci_idempoten, hak_sumber_dikonfirmasi_at, diperiksa_at, hasil, panjang_karakter)
    values (c.institution_id, v_me, c.id, case when p_lesson is null then 'TEMPEL' else 'PELAJARAN' end, p_lesson, null,
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
  values (c.institution_id, v_me, c.id, case when p_lesson is null then 'TEMPEL' else 'PELAJARAN' end, p_lesson,
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
revoke all on function public.ai_minta_draf(uuid, uuid, text, text, integer, text, boolean) from public, anon, authenticated;
grant execute on function public.ai_minta_draf(uuid, uuid, text, text, integer, text, boolean) to authenticated;

do $$
begin
  if position('ceil(m.panjang_karakter * public.ai_token_per_karakter())' in pg_get_functiondef('public.ai_cadangkan(uuid)'::regprocedure)) = 0 then
    raise exception 'C3w-1 (F-1): the reservation does not bound its input by the excerpt''s length';
  end if;
  if position('length(p_teks)' in pg_get_functiondef('public.ai_minta_draf(uuid,uuid,text,text,integer,text,boolean)'::regprocedure)) = 0 then
    raise exception 'C3w-1 (F-1): the request does not record the excerpt''s length';
  end if;
  if has_function_privilege('authenticated', 'public.ai_cadangkan(uuid)', 'execute') then
    raise exception 'C3w-1 (D-1): ai_cadangkan is reachable by authenticated';
  end if;
end $$;
