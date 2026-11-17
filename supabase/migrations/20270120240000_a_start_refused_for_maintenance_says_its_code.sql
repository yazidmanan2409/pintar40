-- A2b, reopened · A START REFUSED FOR MAINTENANCE SAYS SO BY ITS CODE (the Chief Architect, 16 Nov 16:21: A2b's freeze
-- at 3c58620e reopened for this defect only; Sharon f1e969a1, a promotion blocker; found by J1.6). DRAFT.
--
-- A2b commit 3 (20270120120000) made may_start_assessment answer MAINTENANCE_PLACE (a work-scoped window under way over
-- the work) and MAINTENANCE_NO_NEW_START (T−15), so the start screen never offers what the sitting-insert trigger
-- refuses. start_learning_session asks may_start first and raised every refusal as P0001 'cannot start this
-- assessment: <reason> (INV-27)', with no code and no DETAIL: the trigger's PR040 / PR110 were reached only in a race
-- between the two reads, and mulaiAsesmen, which maps exactly those codes (R-A's start screen for a work-scoped window,
-- 4.0's /pemeliharaan?mulai=ditolak at a platform-wide T−15), rethrew the P0001: an error page, for a learner who
-- pressed «Mulai» on a start screen loaded before T−15 or before the window.
--
-- The fix: the two maintenance reasons are raised exactly as the trigger raises them, through the same two functions
-- (maintenance_tolak_tempat: PR040 MAINTENANCE_PLACE; maintenance_refuse('MAINTENANCE_NO_NEW_START'): PR110), before
-- the generic raise, which every other reason keeps. Nothing else in the function changes; no table, no column, no
-- grant. The sweep: start_learning_session is the only caller of open_assessment_session, the only function that
-- writes a sitting; may_start_assessment's other callers (assessment_orientation, my_open_assessments) read and raise
-- nothing.
--
-- AND, in the same fix (Daisy, A2B-DAFTAR-Q12-PUTUSAN.md at ab730614; the Chief Architect, 16 Nov 16:27): /belajar's
-- standalone (Q-12) list, my_open_assessments, kept only what may_start accepted, so since A2b commit 3 a planned window
-- (under way, or T−15) dropped the learner's row, which reads as missed or withdrawn. The row stays when the refusal is
-- one of the two maintenance reasons, exactly as assessment_orientation keeps its row (A2b commit 7); every other
-- refusal still drops it. may_start judges maintenance last, after enrolment, membership and every other check, so the
-- rows kept are only ones every other rule already allows: no other school's row can appear. The refusal itself is
-- said once, on the orientation the row opens («Mulai» disabled with its sentence); the list gets no control.

create or replace function pg_temp.a2b_ganti(p_fn regprocedure, p_old text, p_new text) returns void
language plpgsql as $$
declare v text := pg_get_functiondef(p_fn); n int;
begin
  n := (length(v) - length(replace(v, p_old, ''))) / greatest(length(p_old), 1);
  if n <> 1 then raise exception 'A2b: % has its anchor % time(s), not once', p_fn, n; end if;
  execute replace(v, p_old, p_new);
end $$;

select pg_temp.a2b_ganti('public.start_learning_session(uuid)'::regprocedure,
  E'  if not v_ok then raise exception ''cannot start this assessment: % (INV-27)'', v_reason; end if;',
  E'  -- A2b start-path: the maintenance refusals by their own code, as the sitting-insert trigger raises them\n'
  || E'  if not v_ok and v_reason = ''MAINTENANCE_PLACE'' then perform public.maintenance_tolak_tempat(); end if;\n'
  || E'  if not v_ok and v_reason = ''MAINTENANCE_NO_NEW_START'' then perform public.maintenance_refuse(''MAINTENANCE_NO_NEW_START''); end if;\n'
  || E'  if not v_ok then raise exception ''cannot start this assessment: % (INV-27)'', v_reason; end if;');

select pg_temp.a2b_ganti('public.my_open_assessments()'::regprocedure,
  E'     and (select s.ok from public.may_start_assessment(aa.id) s)',
  E'     and (select s.ok or s.reason in (''MAINTENANCE_PLACE'', ''MAINTENANCE_NO_NEW_START'') from public.may_start_assessment(aa.id) s)');

do $$
declare f regprocedure := 'public.start_learning_session(uuid)'; d text := pg_get_functiondef('public.start_learning_session(uuid)'::regprocedure);
begin
  if position('then perform public.maintenance_tolak_tempat(); end if;' in d) = 0
     or position('then perform public.maintenance_refuse(''MAINTENANCE_NO_NEW_START''); end if;' in d) = 0
     or position('-- A2b start-path:' in d) > position('if not v_ok then raise exception' in d)
     or has_function_privilege('anon', f, 'execute') or not has_function_privilege('authenticated', f, 'execute') then
    raise exception 'A2b start-path: start_learning_session does not raise the maintenance refusals by their code before the generic one, or its grants moved';
  end if;
  if position('s.ok or s.reason in (''MAINTENANCE_PLACE'', ''MAINTENANCE_NO_NEW_START'')' in pg_get_functiondef('public.my_open_assessments()'::regprocedure)) = 0
     or has_function_privilege('anon', 'public.my_open_assessments()'::regprocedure, 'execute') then
    raise exception 'A2b start-path: my_open_assessments does not keep a row a maintenance refusal stops, or its grants moved';
  end if;
end $$;
