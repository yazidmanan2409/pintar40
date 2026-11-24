-- d2r-11 — THE LIVE ROW DECIDES THE DISCLOSURE. session_review reads reveals_rationale_on_review from mode_policy at the call.
do $d$ declare orig text; src text; begin
  orig := pg_get_functiondef('public.session_review(uuid)'::regprocedure);
  src := replace(orig, 'if not coalesce((v_s.assistance_policy ->> ''reveals_rationale_on_review'')::boolean, false) then',
                       'if not coalesce((select m.reveals_rationale_on_review from public.mode_policy m where m.mode = v_s.mode), false) then');
  if src = orig then raise exception 'the plant did not reach the refusal'; end if;
  execute src;
end $d$;
