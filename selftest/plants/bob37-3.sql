-- bob37-3 — THE CLASS FIGURE RECOMPUTES INSTEAD OF READING WHAT WAS RECORDED. calc_class_topic_mastery averages benar/total as if every objective had one item.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.calc_class_topic_mastery(uuid, uuid, text)'::regprocedure);
  -- MC-4 (D-088(g)): each objective's recorded object is carried as t.recorded
  src := replace(orig, $p$avg(((t.recorded ->> 'penguasaan'::text))::numeric)$p$,
                       $p$(sum(((t.recorded ->> 'benar'::text))::numeric) / sum(((t.recorded ->> 'total'::text))::numeric))$p$);
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;
