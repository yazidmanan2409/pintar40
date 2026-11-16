-- A2a, change C · Sharon's C41-2 (the addendum at 2a569769, A2A-C-41-759540ef.md), its siblings, her D6.9 count (the
-- end of A2A-C-41-759540ef.md at 84ddf56e) and her N42-1 (A2A-C-42-3def2e9b.md). DRAFT.
--
-- C41-2: between the lift and the release batch a sitting still carries its stop's mark (darurat_sejak); the first
-- touch releases it. pengerjaan_dilindungi already covers a mark whose stop is still in force, so "or darurat_sejak is
-- not null" counted a stale mark as a hold and refused an act the lift allows. The sweep found it in five places, each
-- now pengerjaan_dilindungi alone:
--   * kenaikan_tetapkan's PROMO_STOPPED count (Sharon's C41-2);
--   * ubah_jadwal_penugasan's SITTING_CLASS_STOPPED («Ubah jadwal» refused after the lift);
--   * daftar_pengerjaan's HELD_STOP (the teacher's list said held after the lift);
--   * catat_penolakan_henti's three branches (commit 43), which must match the acts they record.
-- (pengerjaan_ditahan keeps the mark: the decider calls pengerjaan_pagar first, which releases a stale one.)
--
-- D6.9's count: maintenance.release_completed's "released" is the sittings of the stop's people at T_stop whose credit
-- watermark (darurat_dikredit_sampai) reaches the chain's end (T_stop + penghentian_geser), wherever they now stand: a
-- sitting credited at first touch and finished before the batch is counted. held_for_suspension stays apart (an open
-- sitting A1 still holds). Computed in the release batch after the credit pass, as before; nothing at the lift.
--
-- N42-1: until a touch commits the departure, pengerjaan_terbuka_saya leaves out a sitting with darurat_keluar, so a
-- departed learner is not offered it.

create or replace function pg_temp.a2a_ganti(p_fn regprocedure, p_old text, p_new text) returns void
language plpgsql as $$
declare v text := pg_get_functiondef(p_fn); n int;
begin
  n := (length(v) - length(replace(v, p_old, ''))) / greatest(length(p_old), 1);
  if n <> 1 then raise exception 'A2a C41-2: % has its anchor % time(s), not once', p_fn, n; end if;
  execute replace(v, p_old, p_new);
end $$;

do $$
begin
  perform pg_temp.a2a_ganti('public.kenaikan_tetapkan(uuid,uuid,jsonb,boolean,boolean)',
    '     and (public.pengerjaan_dilindungi(a.id) or a.darurat_sejak is not null);',
    '     and public.pengerjaan_dilindungi(a.id);   -- C41-2: a stale mark after the lift holds nothing');
  perform pg_temp.a2a_ganti('public.ubah_jadwal_penugasan(uuid,timestamp with time zone,timestamp with time zone,text)',
    'and (s.darurat_sejak is not null or public.pengerjaan_dilindungi(s.id))) then',
    'and public.pengerjaan_dilindungi(s.id)) then   -- C41-2');
  perform pg_temp.a2a_ganti('public.daftar_pengerjaan(uuid,uuid)',
    'and (s.darurat_sejak is not null or public.pengerjaan_dilindungi(s.id)) then ''HELD_STOP''',
    'and public.pengerjaan_dilindungi(s.id) then ''HELD_STOP''');
  perform pg_temp.a2a_ganti('public.catat_penolakan_henti(uuid,text)',
    'if not (public.pengerjaan_dilindungi(s.id) or (s.darurat_sejak is not null and s.status in (''CREATED'', ''IN_PROGRESS'', ''PAUSED'')))',
    'if not public.pengerjaan_dilindungi(s.id)');
  perform pg_temp.a2a_ganti('public.catat_penolakan_henti(uuid,text)',
    'and (x.darurat_sejak is not null or public.pengerjaan_dilindungi(x.id));',
    'and public.pengerjaan_dilindungi(x.id);');
  perform pg_temp.a2a_ganti('public.catat_penolakan_henti(uuid,text)',
    'and (public.pengerjaan_dilindungi(a.id) or a.darurat_sejak is not null);',
    'and public.pengerjaan_dilindungi(a.id);');

  -- D6.9: released counted from what the credit recorded
  perform pg_temp.a2a_ganti('public.pengerjaan_lepas_darurat_semua(integer)',
    E'                ''affected_still_open_released'', count(*) filter (where not (s.frozen_at is not null and s.unfrozen_at is null)),\n'
    || E'                ''held_for_suspension'', count(*) filter (where s.frozen_at is not null and s.unfrozen_at is null))\n'
    || E'         from public.maintenance_windows w2 join public.assessment_sessions s on s.created_at <= w2.t_stop\n'
    || E'        where w2.id = r.id and (w2.platform or s.person_id in (select o from public.penghentian_orang(w2) o))\n'
    || E'          and (s.status in (''CREATED'', ''IN_PROGRESS'', ''PAUSED'') or public.pengerjaan_dalam_tenggang_pada(s, w2.t_stop))\n'
    || E'          and public.maintenance_affects_pada(w2, s.person_id, w2.t_stop)));\n',
    E'                ''released'', count(*) filter (where s.darurat_dikredit_sampai is not null\n'
    || E'                  and s.darurat_dikredit_sampai >= w2.t_stop + public.penghentian_geser(s.person_id, w2.id)),\n'
    || E'                ''held_for_suspension'', count(*) filter (where s.status in (''CREATED'', ''IN_PROGRESS'', ''PAUSED'')\n'
    || E'                  and s.frozen_at is not null and s.unfrozen_at is null))\n'
    || E'         from public.maintenance_windows w2 join public.assessment_sessions s on s.created_at <= w2.t_stop\n'
    || E'        where w2.id = r.id and (w2.platform or s.person_id in (select o from public.penghentian_orang(w2) o))\n'
    || E'          and public.maintenance_affects_pada(w2, s.person_id, w2.t_stop)));\n');
  if public.jalur_tanpa_pin() <> 0 then raise exception 'A2a D6.9: the release batch is no longer an excused procedure'; end if;

  -- N42-1: a departed learner is not offered the sitting the departure preserved
  perform pg_temp.a2a_ganti('public.pengerjaan_terbuka_saya()',
    '     and s.status in (''CREATED'', ''IN_PROGRESS'', ''PAUSED'') and not public.pengerjaan_ditahan(s)',
    '     and s.status in (''CREATED'', ''IN_PROGRESS'', ''PAUSED'') and not public.pengerjaan_ditahan(s)' || E'\n'
    || '     and s.darurat_keluar is null   -- N42-1: a departure preserved through a stop is not offered to its learner');
end $$;
