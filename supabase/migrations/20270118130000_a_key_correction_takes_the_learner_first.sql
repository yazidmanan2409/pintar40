-- A2A-L01, change A, row 3 of the 76 (Sharon, A2A-CHANGE-A-76-4530849f.md §1): a key correction takes the learner
-- before the sitting.
--
-- hitung_ulang_koreksi_kunci (reached by koreksi_kunci_saat_selesai, a trigger on a new result, and by
-- tegaskan_koreksi_kunci, the confirmation) locked the sitting FOR UPDATE, then inserted the recalculated result, whose
-- foreign key takes the learner FOR KEY SHARE: the sitting before its learner.
--
-- Sharon found no live counterpart today. These paths lock a sitting that has a result (FINALIZED), and the hold takes
-- only CREATED, IN_PROGRESS and PAUSED sittings. Called from finalize_session, it is the same row as commit 3's.
-- No deadlock is claimed.
--
-- It is fixed because it breaks A2a's order (persons → the fence → sittings), on which A2a's fenced decisions rest, and
-- a key correction is a writer in A2a's enumeration.
--
-- The fix, commit 3's shape: the learner FOR KEY SHARE before the sitting. KEY SHARE conflicts only with FOR UPDATE
-- (and DELETE), so the only new wait is on a lifecycle act that holds the learner, which takes the person first.
-- Nothing else changes: the signature, owner, grants, volatility and security are kept.

do $$
declare v text := pg_get_functiondef('public.hitung_ulang_koreksi_kunci(uuid,uuid)'::regprocedure);
        v_old text := E'  select * into s from public.assessment_sessions where id = p_session for update;\n';
        n int;
begin
  n := (length(v) - length(replace(v, v_old, ''))) / length(v_old);
  if n <> 1 then raise exception 'A2A-L01: hitung_ulang_koreksi_kunci has its anchor % time(s), not once', n; end if;
  execute replace(v, v_old,
    E'  -- A2A-L01 (Sharon, A2A-CHANGE-A-76-4530849f.md, row 3): the learner first, before the sitting\n'
    || E'  perform 1 from public.persons p, public.assessment_sessions a where a.id = p_session and p.id = a.person_id for key share of p;\n'
    || v_old);
end $$;

-- ═══════════════════════════════════════════════════════════ the migration's own check (ADR-0003: structural)
do $$
declare v text := pg_get_functiondef('public.hitung_ulang_koreksi_kunci(uuid,uuid)'::regprocedure);
        k int := position('and p.id = a.person_id for key share of p;' in v);
        s int := position('from public.assessment_sessions where id = p_session for update' in v);
begin
  if k = 0 or s = 0 or k > s then
    raise exception 'A2A-L01: hitung_ulang_koreksi_kunci does not take its learner before its sitting';
  end if;
end $$;
