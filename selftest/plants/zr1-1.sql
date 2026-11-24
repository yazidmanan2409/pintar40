-- zr1-1 — THE SITTING OUTLIVES THE ENROLMENT (R-1). Ending an enrolment no longer ends its open sittings.
do $d$ declare orig text; src text; begin
  orig := pg_get_functiondef('public.tutup_asesmen_terbuka(uuid,text)'::regprocedure);
  src := replace(orig, 'where a.enrollment_id = p_enrollment and a.status in (''CREATED'', ''IN_PROGRESS'', ''PAUSED'')',
                       'where false and a.enrollment_id = p_enrollment and a.status in (''CREATED'', ''IN_PROGRESS'', ''PAUSED'')');
  if src = orig then raise exception 'the plant did not reach the sittings'; end if;
  execute src;
end $d$;
