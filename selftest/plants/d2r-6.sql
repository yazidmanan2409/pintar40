-- d2r-6 — THE REASONS COME BACK. reading_map draws a certifying result's lines with the objective's statement as a reason.
do $d$ declare orig text; src text; begin
  orig := pg_get_functiondef('public.reading_map(uuid)'::regprocedure);
  src := replace(orig, 'lo.code, lo.statement, m.title, l.title, l.page_citation, null::text', 'lo.code, lo.statement, m.title, l.title, l.page_citation, lo.statement');
  if src = orig then raise exception 'the plant did not reach the reason'; end if;
  execute src;
end $d$;
