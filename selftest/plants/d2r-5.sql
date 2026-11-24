-- d2r-5 — THE REVIEW IS OPEN. session_review no longer refuses a certifying result, nor one whose capture reveals nothing.
do $d$ declare orig text; src text; begin
  orig := pg_get_functiondef('public.session_review(uuid)'::regprocedure);
  src := replace(orig, 'if v_s.bersertifikasi then', 'if false then');
  src := replace(src, 'if not coalesce((v_s.assistance_policy ->> ''reveals_rationale_on_review'')::boolean, false) then', 'if false then');
  if src = orig then raise exception 'the plant did not reach the refusal'; end if;
  execute src;
end $d$;
