-- d2r-10 — THE BAND IS PUBLIC. verify_certificate returns the sealed band again.
do $d$ declare orig text; src text; begin
  orig := pg_get_functiondef('public.verify_certificate(text)'::regprocedure);
  src := replace(orig, 'predikat   := null;', 'predikat   := v_c.canonical_payload -> ''result'' ->> ''predikat'';');
  if src = orig then raise exception 'the plant did not reach the band'; end if;
  execute src;
end $d$;
