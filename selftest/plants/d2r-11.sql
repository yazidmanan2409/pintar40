-- d2r-11 — THE LIVE ROW DECIDES THE DISCLOSURE. session_review reads mode_policy.certifies at the call.
do $d$ declare orig text; src text; begin
  orig := pg_get_functiondef('public.session_review(uuid)'::regprocedure);
  src := replace(orig, 'if v_s.bersertifikasi then', 'if (select m.certifies from public.mode_policy m where m.mode = v_s.mode) then');
  if src = orig then raise exception 'the plant did not reach the refusal'; end if;
  execute src;
end $d$;
