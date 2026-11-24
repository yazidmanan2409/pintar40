-- d2r-8 — THE CORRECTION'S REASON. hasil_koreksi_saya gives a certifying result the correction's reason.
do $d$ declare orig text; src text; begin
  orig := pg_get_functiondef('public.hasil_koreksi_saya(uuid)'::regprocedure);
  src := replace(orig, 'return case when s.bersertifikasi then', 'return case when false then');
  if src = orig then raise exception 'the plant did not reach the reason'; end if;
  execute src;
end $d$;
