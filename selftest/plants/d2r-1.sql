-- d2r-1 — THE CAPTURE GRANTS HELP. The start-time seal records every sitting as allowed help, whatever its mode says.
do $d$ declare orig text; src text; begin
  orig := pg_get_functiondef('public.tangkap_kebijakan_sesi()'::regprocedure);
  src := replace(orig, 'select public.kebijakan_bantuan_dari(m), m.certifies into',
    'select jsonb_build_object(''arah'', true, ''petunjuk'', true, ''contoh'', true, ''reveals_rationale_on_review'', m.reveals_rationale_on_review), m.certifies into');
  if src = orig then raise exception 'the plant did not reach the capture'; end if;
  execute src;
end $d$;
