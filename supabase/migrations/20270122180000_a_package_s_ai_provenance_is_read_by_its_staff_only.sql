-- ---------------------------------------------------------------------------------------------------------------
-- C3w-1 · A PACKAGE'S AI PROVENANCE, READ BY ITS STAFF ONLY (C3-2, C3-6; Daisy's C3W-1-WORDS.md §3-§4 and
-- C3W-1-WORDS-TAMBAHAN.md §2). Red first: C3W-C32 and C3W-C36 (selftest/c3w-c3.test.ts).
--
-- ai_asal_paket(p_course): for each generated draft still in the package, what the card and the reviewer show: its
-- latest decision and who took it, whether its content changed since it was written (derived from the hashes, never
-- chosen), the option's display name (ruling 40: staff copy only), the source's kind and the target lesson's title, who
-- asked and when. Gated on CAN_DRAFT or CAN_REVIEW in the package's school; a learner, another school's staff and an
-- unknown package are refused alike (DRAFT_NOT_ALLOWED). The AI tables stay closed to every session role (C3W-C32):
-- this definer is the only read. It names no person or school argument (D-1). Read-only.
-- ---------------------------------------------------------------------------------------------------------------

create or replace function public.ai_asal_paket(p_course uuid)
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_inst uuid;
begin
  select c.institution_id into v_inst from public.courses c where c.id = p_course;
  if public.current_person_id() is null or v_inst is null
     or not (public.can_in_institution('CAN_DRAFT', v_inst) or public.can_in_institution('CAN_REVIEW', v_inst)) then
    perform public.soal_tolak('DRAFT_NOT_ALLOWED');
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
             'item', a.item_id,
             'lesson', i.lesson_id,
             'keputusan', d.keputusan,
             'oleh', (select p.display_name from public.persons p where p.id = d.oleh),
             'pada', d.pada,
             'diubah', a.isi_sha256 is distinct from public.ai_isi_soal_sha256(a.item_id),
             'model', o.nama_tampilan,
             'sumber', m.sumber_jenis,
             'sumber_judul', (select l2.title from public.lessons l2 where l2.id = m.lesson_id),
             'pemohon', (select p.display_name from public.persons p where p.id = a.pemohon),
             'diminta_pada', m.dibuat_at)
           order by l.ordinal, i.id)
      from public.ai_asal_soal a
      join public.items i on i.id = a.item_id
      join public.lessons l on l.id = i.lesson_id
      join public.modules md on md.id = l.module_id
      join public.ai_permintaan m on m.id = a.permintaan
      join public.ai_percobaan pc on pc.id = a.percobaan
      join public.ai_opsi o on o.id = pc.opsi
      left join lateral (select p.keputusan, p.oleh, p.pada from public.ai_penerimaan p where p.item_id = a.item_id
                          order by p.pada desc, p.id desc limit 1) d on true
     where md.course_id = p_course), '[]'::jsonb);
end $$;
revoke all on function public.ai_asal_paket(uuid) from public, anon, authenticated;
grant execute on function public.ai_asal_paket(uuid) to authenticated;

insert into public.client_rpc_registry (function_name, exposure, note, authorization_kind, authorization_requirement) values
  ('ai_asal_paket', 'STAFF',
   'C3w-1: a package''s AI provenance for its cards and its reviewer: the latest decision and who took it, whether the '
   || 'content changed, the option''s display name, the source kind, who asked and when. Read-only; CAN_DRAFT or CAN_REVIEW in the school, else DRAFT_NOT_ALLOWED.',
   'CAPABILITY', 'CAN_DRAFT');

do $$
begin
  if not has_function_privilege('authenticated', 'public.ai_asal_paket(uuid)', 'execute')
     or has_function_privilege('anon', 'public.ai_asal_paket(uuid)', 'execute') then
    raise exception 'C3w-1: the provenance read is not the signed-in staff''s alone';
  end if;
end $$;
