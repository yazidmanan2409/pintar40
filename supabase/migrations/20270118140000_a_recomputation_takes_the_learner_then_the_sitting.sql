-- A2A-L01, change A, row 4 of the 76 (Sharon, A2A-CHANGE-A-ROW4-33a97fa4.md): a recomputation takes the learner, then
-- the sitting, as its first two locks.
--
-- Two recomputations of one sitting serialise on results_one_successor and cannot deadlock (Second Eye's race). The
-- remaining cycle is narrower, with a different partner (Sharon):
--   - recompute_result takes the successor slot and the sitting FOR KEY SHARE (the new result's key), then, through
--     koreksi_kunci_saat_selesai → hitung_ulang_koreksi_kunci, the sitting FOR UPDATE;
--   - hitung_ulang_koreksi_kunci, called directly or from tegaskan_koreksi_kunci, takes the sitting FOR UPDATE first,
--     then inserts into the same slot.
-- No deadlock is claimed. The race is register item REG-A2A-04: its fixture is not cheap.
--
-- The fix: the learner FOR KEY SHARE, then the sitting FOR UPDATE, before anything else is read or written.
-- Nothing else changes: the signature, owner, grants, volatility and security are kept.

do $$
declare v text := pg_get_functiondef('public.recompute_result(uuid,text)'::regprocedure);
        v_old text := E'  select * into v_prev from public.assessment_results\n   where session_id = p_session and supersedes_result_id is null;\n';
        n int;
begin
  n := (length(v) - length(replace(v, v_old, ''))) / length(v_old);
  if n <> 1 then raise exception 'A2A-L01: recompute_result has its anchor % time(s), not once', n; end if;
  execute replace(v, v_old,
    E'  -- A2A-L01 (Sharon, A2A-CHANGE-A-ROW4-33a97fa4.md): the learner, then the sitting, first\n'
    || E'  perform 1 from public.persons p, public.assessment_sessions a where a.id = p_session and p.id = a.person_id for key share of p;\n'
    || E'  perform 1 from public.assessment_sessions where id = p_session for update;\n'
    || v_old);
end $$;

-- ═══════════════════════════════════════════════════════════ the migration's own check (ADR-0003: structural)
do $$
declare v text := pg_get_functiondef('public.recompute_result(uuid,text)'::regprocedure);
        k int := position('and p.id = a.person_id for key share of p;' in v);
        s int := position('perform 1 from public.assessment_sessions where id = p_session for update;' in v);
        r int := position('select * into v_prev from public.assessment_results' in v);
begin
  if k = 0 or s = 0 or r = 0 or not (k < s and s < r) then
    raise exception 'A2A-L01: recompute_result does not take its learner, then its sitting, first';
  end if;
end $$;
