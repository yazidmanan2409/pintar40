-- d2r-5 — THE REVIEW IS OPEN. session_review no longer refuses a result whose capture reveals no rationale.
do $d$ declare orig text; src text; begin
  orig := pg_get_functiondef('public.session_review(uuid)'::regprocedure);
  src := replace(orig, 'if not coalesce((v_s.assistance_policy ->> ''reveals_rationale_on_review'')::boolean, false) then', 'if false then');
  if src = orig then raise exception 'the plant did not reach the refusal'; end if;
  execute src;
end $d$;
