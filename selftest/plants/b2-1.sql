-- b2-1 — B2's content rule UNDONE: a learner's own-results print takes its schools from the learner's live affiliation
-- (the alternative the owner did not take), so evidence earned at a school before a transfer is attributed to the new one.
do $$
declare v text := pg_get_functiondef('public.akuntabilitas_catat(text,text,text,uuid,text,text,text,jsonb)'::regprocedure);
begin
  if position('v_schools := public.hasil_belajar_sekolah(v_person);' in v) = 0 then raise exception 'b2-1: the writer does not compute the snapshot where it did'; end if;
  execute replace(v, 'v_schools := public.hasil_belajar_sekolah(v_person);', 'v_schools := public.akuntabilitas_sekolah_orang(v_person, v_now);');
end $$;
