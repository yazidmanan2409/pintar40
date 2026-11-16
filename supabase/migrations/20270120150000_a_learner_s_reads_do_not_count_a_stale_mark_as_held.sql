-- A2a's D1 gap, its sibling D1-3 (Sharon's ruling, A2B-COMMIT3-D12-a46a94bc.md at 8e33dd32), fixed in A2b as its own
-- commit. DRAFT.
--
-- pengerjaan_ditahan(s) counts a stop's mark (darurat_sejak) as held. The decider keeps it (it calls pengerjaan_pagar
-- first, which releases a stale mark: Sharon's C41-2). A learner's read-only readers do not touch first, so between a
-- lift and the first touch they read a stale mark as a hold. In these readers held is now (held by A1) or protected by a
-- stop in force (pengerjaan_dilindungi), as C41-2 did in six places.
--
-- The sweep: every stable function that calls pengerjaan_ditahan (A2B-D12 lists them):
--   * pengerjaan_saya: 'ditahan' (the learner's own sitting read as held after the lift) -- fixed;
--   * pengerjaan_terbuka_saya: the learner's open sittings (a lifted, unreleased sitting left out) -- fixed;
--   * pengerjaan_dilepas_henti: "released from the stop" (THE PLAN item 3), the same shape: it excluded a stale-marked
--     sitting, and counted only an unmarked sitting's credit, so the notice did not show until a touch -- fixed here
--     too, with its pending release counted (D1-2's), and named for Sharon.
-- Every other caller of pengerjaan_ditahan is volatile and calls pengerjaan_pagar first: unchanged.

create or replace function pg_temp.a2b_ganti(p_fn regprocedure, p_old text, p_new text) returns void
language plpgsql as $$
declare v text := pg_get_functiondef(p_fn); n int;
begin
  n := (length(v) - length(replace(v, p_old, ''))) / greatest(length(p_old), 1);
  if n <> 1 then raise exception 'A2b D1-3: % has its anchor % time(s), not once', p_fn, n; end if;
  execute replace(v, p_old, p_new);
end $$;

do $$
begin
  perform pg_temp.a2b_ganti('public.pengerjaan_saya(uuid)',
    E'''ditahan'', public.pengerjaan_ditahan(s),',
    E'''ditahan'', s.status in (''CREATED'', ''IN_PROGRESS'', ''PAUSED'')   -- D1-3: a stale mark holds nothing\n'
    || E'               and ((s.frozen_at is not null and s.unfrozen_at is null) or public.pengerjaan_dilindungi(s.id)),');
  perform pg_temp.a2b_ganti('public.pengerjaan_terbuka_saya()',
    E'and not public.pengerjaan_ditahan(s)',
    E'and not (s.frozen_at is not null and s.unfrozen_at is null) and not public.pengerjaan_dilindungi(s.id)   -- D1-3');
  perform pg_temp.a2b_ganti('public.pengerjaan_dilepas_henti(assessment_sessions)',
    E'and not public.pengerjaan_ditahan(s)\n',
    E'and not (s.frozen_at is not null and s.unfrozen_at is null)   -- D1-3: a stale mark holds nothing\n');
  perform pg_temp.a2b_ganti('public.pengerjaan_dilepas_henti(assessment_sessions)',
    E'     and ((public.penghentian_kredit(s)).geser > interval ''0''\n',
    E'     and ((public.penghentian_kredit(s)).geser > interval ''0''\n'
    || E'          -- D1-3: a marked sitting whose stop has lifted, its release pending (D1-2''s term)\n'
    || E'          or (s.darurat_sejak is not null\n'
    || E'              and coalesce(public.penghentian_geser(s.person_id, s.darurat_jendela_id), interval ''0'') > interval ''0'')\n');
end $$;

do $$
begin
  if position('pengerjaan_ditahan' in pg_get_functiondef('public.pengerjaan_saya(uuid)'::regprocedure)) > 0
     or position('pengerjaan_ditahan' in pg_get_functiondef('public.pengerjaan_terbuka_saya()'::regprocedure)) > 0
     or position('pengerjaan_ditahan' in pg_get_functiondef('public.pengerjaan_dilepas_henti(assessment_sessions)'::regprocedure)) > 0 then
    raise exception 'A2a D1-3: a learner''s read still counts a stale mark as held';
  end if;
end $$;
