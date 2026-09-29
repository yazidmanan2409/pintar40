-- bob37-1 — THE CLASS'S PER-TOPIC MASTERY NEVER SHOWS. calc_class_topic_mastery keeps only bare numbers again.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.calc_class_topic_mastery(uuid, uuid, text)'::regprocedure);
  src := replace(orig, $p$jsonb_typeof(kv.value) = 'object'::text$p$, $p$jsonb_typeof(kv.value) = 'number'::text$p$);
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;
