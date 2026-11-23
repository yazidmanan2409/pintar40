-- ---------------------------------------------------------------------------------------------------------------
-- C3w-1 · DECIDING ON A GENERATED DRAFT, AND THE SUBMIT GATE (chunk 3; design §2 step 4, §3, §9 answer 2; C3-1; Bob's
-- answers to Q2 and Q3, 21 Nov). Red first: C3W-T01, C3W-T02 (selftest/c3w-terima.test.ts).
--
--   * ai_isi_soal_sha256(item): the sha-256 of a question's content (type, stem, stimulus, and each option's label,
--     body, key, rationale and misconception code). ai_asal_soal gains isi_sha256, the hash as generated.
--   * ai_putuskan(item, 'TERIMA' | 'HAPUS'): the educator's decision, as the signed-in person with CAN_DRAFT over the
--     package (draf_kunci). TERIMA records EDITED when the content's hash differs from the generated one and ACCEPTED
--     when it does not: derived, never chosen. HAPUS removes the draft through hapus_soal_draf and records DELETED, in
--     one transaction. ai_penerimaan is append-only (its guard, 20270122110000); the latest row is the decision.
--   * The provenance and the decisions outlive a removed draft: the two foreign keys to items are dropped, so a
--     draft's removal is never blocked by its own record (as item_draft_edits keeps a removed item's id).
--   * ai_draf_belum_diputuskan(course): how many generated drafts in a package have no latest decision ACCEPTED or
--     EDITED, for the package's educator. langkah_konten (restated in full) refuses the submit to IN_REVIEW,
--     PR220 AI_BELUM_DITERIMA, while it is above 0.
--   * ai_tolak gains AI_BUKAN_DRAF_AI and AI_KEPUTUSAN_TIDAK_SAH (restated in full).
-- ---------------------------------------------------------------------------------------------------------------

alter table public.ai_asal_soal drop constraint ai_asal_soal_item_id_fkey;
alter table public.ai_penerimaan drop constraint ai_penerimaan_item_id_fkey;
alter table public.ai_asal_soal add column isi_sha256 text not null check (isi_sha256 ~ '^[0-9a-f]{64}$');

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
      when 'AI_MAJU_SAJA'               then 'an AI attempt only moves forward, and is never deleted'
      else 'the AI drafting request was refused'
    end;
end $function$;
revoke all on function public.ai_tolak(text) from public, anon, authenticated;

create or replace function public.ai_isi_soal_sha256(p_item uuid)
returns text language sql stable security definer set search_path = public, pg_temp as $$
  select encode(extensions.digest(jsonb_build_object(
           'item_type', i.item_type, 'stem', i.stem, 'stimulus', i.stimulus,
           'options', coalesce((select jsonb_agg(jsonb_build_object('label', o.label, 'body', o.body, 'is_correct', o.is_correct,
                                                                    'rationale', o.rationale, 'misconception_code', o.misconception_code)
                                                 order by o.label)
                                  from public.item_options o where o.item_id = i.id), '[]'::jsonb))::text, 'sha256'), 'hex')
    from public.items i where i.id = p_item
$$;
revoke all on function public.ai_isi_soal_sha256(uuid) from public, anon, authenticated;

create or replace function public.ai_putuskan(p_item uuid, p_keputusan text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_me uuid := public.current_person_id();
  a public.ai_asal_soal;
  i public.items;
  c public.courses;
  v_k text;
begin
  if v_me is null then perform public.soal_tolak('DRAFT_NOT_ALLOWED'); end if;
  if p_keputusan is null or p_keputusan not in ('TERIMA', 'HAPUS') then perform public.ai_tolak('AI_KEPUTUSAN_TIDAK_SAH'); end if;
  select * into i from public.items where id = p_item;
  if i.id is null then perform public.soal_tolak('DRAFT_UNKNOWN'); end if;
  -- the right to author in the package, under its row lock (every act on one draft waits for the one before it)
  c := public.draf_kunci(public.soal_kursus(p_item));
  select * into a from public.ai_asal_soal where item_id = p_item;
  if a.id is null then perform public.ai_tolak('AI_BUKAN_DRAF_AI'); end if;
  if p_keputusan = 'TERIMA' then
    v_k := case when public.ai_isi_soal_sha256(p_item) = a.isi_sha256 then 'ACCEPTED' else 'EDITED' end;
  else
    perform public.hapus_soal_draf(p_item, i.revision);
    v_k := 'DELETED';
  end if;
  insert into public.ai_penerimaan (item_id, keputusan, oleh) values (p_item, v_k, v_me);
  perform public.audit_write('ai.draft_decided', 'items', p_item::text, c.institution_id,
    jsonb_build_object('course', c.id, 'keputusan', v_k));
  return jsonb_build_object('ok', true, 'item', p_item, 'keputusan', v_k);
end $$;
revoke all on function public.ai_putuskan(uuid, text) from public, anon, authenticated;
grant execute on function public.ai_putuskan(uuid, text) to authenticated;

create or replace function public.ai_draf_belum_diputuskan(p_course uuid)
returns integer language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_inst uuid;
begin
  select c.institution_id into v_inst from public.courses c where c.id = p_course;
  if public.current_person_id() is null or v_inst is null or not public.can_in_institution('CAN_DRAFT', v_inst) then
    raise exception using errcode = '42501', message = 'the undecided drafts of a package are its educators''';
  end if;
  return (select count(*)::integer
            from public.ai_asal_soal a
            join public.items i on i.id = a.item_id
            join public.lessons l on l.id = i.lesson_id
            join public.modules md on md.id = l.module_id
           where md.course_id = p_course
             and coalesce((select p.keputusan from public.ai_penerimaan p where p.item_id = a.item_id
                            order by p.pada desc, p.id desc limit 1), '') not in ('ACCEPTED', 'EDITED'));
end $$;
revoke all on function public.ai_draf_belum_diputuskan(uuid) from public, anon, authenticated;
grant execute on function public.ai_draf_belum_diputuskan(uuid) to authenticated;

CREATE OR REPLACE FUNCTION public.langkah_konten(p_course uuid, p_ke text)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
  -- C3w-1 (C3-1; Bob's Q3): a package with a generated draft that no educator has kept is not submitted. Hiding the
  -- button is not the rule; this is
  if v_ke = 'IN_REVIEW' and public.ai_draf_belum_diputuskan(p_course) > 0 then
    raise exception using errcode = 'PR220', detail = 'AI_BELUM_DITERIMA',
      message = 'every AI-generated draft in the package must be kept or removed by an educator before it is submitted';
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
end $function$;
revoke all on function public.langkah_konten(uuid, text) from public, anon;
grant execute on function public.langkah_konten(uuid, text) to authenticated;

insert into public.client_rpc_registry (function_name, exposure, note, authorization_kind, authorization_requirement) values
  ('ai_putuskan', 'STAFF',
   'C3w-1: an educator keeps (TERIMA) or removes (HAPUS) an AI-generated draft. TERIMA records ACCEPTED or EDITED, derived '
   || 'from the content hash; HAPUS removes it through hapus_soal_draf. Refusals PR220 and the draft codes.',
   'CAPABILITY', 'CAN_DRAFT'),
  ('ai_draf_belum_diputuskan', 'STAFF',
   'C3w-1: how many AI-generated drafts of a package await an educator''s decision; the submit refuses while above 0.',
   'CAPABILITY', 'CAN_DRAFT')
on conflict (function_name) do update set exposure = excluded.exposure, note = excluded.note,
  authorization_kind = excluded.authorization_kind, authorization_requirement = excluded.authorization_requirement;

do $$
begin
  if position('public.ai_draf_belum_diputuskan(p_course) > 0' in pg_get_functiondef('public.langkah_konten(uuid,text)'::regprocedure)) = 0 then
    raise exception 'C3w-1 (C3-1): langkah_konten has no AI acceptance gate';
  end if;
  if has_table_privilege('authenticated', 'public.ai_penerimaan', 'INSERT,UPDATE,DELETE') then
    raise exception 'C3w-1: a client role writes decisions directly';
  end if;
end $$;
