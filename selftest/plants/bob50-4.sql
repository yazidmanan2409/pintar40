-- bob50-4 — THE VERDICT FOLLOWS THE CERTIFICATE POLICY. session_outcome withholds «lulus» from a sitting whose mode does not certify, so an Uji Cepat in progress when QUICK stops certifying finishes with no verdict.
do $p$
declare v text := pg_get_functiondef('public.session_outcome(uuid)'::regprocedure);
begin
  if position('''lulus'', case when v_min is null then null' in v) = 0 then
    raise exception 'bob50-4: session_outcome no longer has the expected lulus clause';
  end if;
  execute replace(v, '''lulus'', case when v_min is null then null',
    '''lulus'', case when v_min is null or not coalesce((select m.certifies from public.mode_policy m where m.mode = v_s.mode), false) then null');
end $p$;
