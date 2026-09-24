-- bob04-9 — A PARALLEL GROUP MAY SPAN BOTH TESTS AGAIN (D-040). The upload no longer refuses a group holding a pre-test and a post-test question.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.lesson_package_check(uuid, jsonb, uuid)'::regprocedure);
  src := replace(orig, $p$      if exists (select 1 from jsonb_array_elements(v_cycle -> v_t) e where e ->> 'use' = 'PRE_TEST')$p$,
                       $p$      if false and exists (select 1 from jsonb_array_elements(v_cycle -> v_t) e where e ->> 'use' = 'PRE_TEST')$p$);
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;
