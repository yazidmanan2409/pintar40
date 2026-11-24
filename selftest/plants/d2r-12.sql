-- d2r-12 — NO ORDINAL. The start-time seal no longer counts the lineage.
do $d$ declare orig text; src text; begin
  orig := pg_get_functiondef('public.tangkap_kebijakan_sesi()'::regprocedure);
  src := replace(orig, 'then public.percobaan_terpakai(new.person_id, new.assessment_assignment_id) + 1 end;', 'then null end;');
  if src = orig then raise exception 'the plant did not reach the ordinal'; end if;
  execute src;
end $d$;
