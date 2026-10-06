-- EFFICIENCY AUDIT (2 Oct, after the L1 run on staging, run 36964437916) -- THE DRAW READS ITS MARKS BY INDEX.
--
-- definition_follows_cycle_roles(definition) answers one question about a definition: is it a cycle test (pre- or
-- post-test) whose course or module has questions marked for a cycle? eligible_items_for_definition asks it once per
-- CANDIDATE question, so every start of every sitting asks it again for each question of the chapter (BOB-04, D-008).
-- Its old body joined items, lessons and modules and put the course test and the module test in one OR across the
-- join, which no index can serve: each call scanned the platform's marked items. Measured on staging (read only,
-- 2 Oct): 31 calls for one Uji Penguasaan's candidates read 3,336 buffers (about 107 a call) and 4.8 ms; the start
-- of a sitting read about 3,540 buffers in all. The cost grew with every chapter any school imports.
--
-- The new body asks the same question in two parts, each served by an index (modules by course, lessons by
-- module, items by lesson): exists(A or B) is exists(A) or exists(B). Same answer, same tables, same privileges,
-- same STABLE SQL with the same search_path; nothing else changes. The same 31 calls read 464 buffers (-86%) and
-- 0.7 ms. Before this migration, the new body and the old one were compared on staging for all 56 definitions:
-- identical (46 true, 10 false). The verification block below compares them again wherever this runs.

create or replace function public.definition_follows_cycle_roles(p_definition uuid)
returns boolean language sql stable set search_path = public, pg_temp as $$
  select d.mode in ('PRE_TEST', 'POST_TEST') and (
      (d.course_id is not null and exists (
         select 1 from public.modules m
           join public.lessons l on l.module_id = m.id
           join public.items i on i.lesson_id = l.id
          where m.course_id = d.course_id and i.cycle_role is not null))
   or (d.module_id is not null and exists (
         select 1 from public.lessons l
           join public.modules m on m.id = l.module_id
           join public.items i on i.lesson_id = l.id
          where l.module_id = d.module_id and i.cycle_role is not null)))
    from public.assessment_definitions d where d.id = p_definition
$$;
revoke all on function public.definition_follows_cycle_roles(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Verification: the new body gives the old body's answer for every definition there is, and the function keeps
-- its shape (stable SQL, the pinned search_path, not executable by a client role).
-- ---------------------------------------------------------------------------
do $$
declare n_diff integer; n_all integer; v_cfg text[]; v_vol "char";
begin
  select count(*), count(*) filter (where public.definition_follows_cycle_roles(d.id) is distinct from (
           select d2.mode in ('PRE_TEST', 'POST_TEST') and exists (
             select 1 from public.items i
               join public.lessons l on l.id = i.lesson_id join public.modules m on m.id = l.module_id
              where i.cycle_role is not null
                and ((d2.course_id is not null and m.course_id = d2.course_id)
                  or (d2.module_id is not null and l.module_id = d2.module_id)))
             from public.assessment_definitions d2 where d2.id = d.id))
    into n_all, n_diff
    from public.assessment_definitions d;
  if n_diff <> 0 then
    raise exception 'definition_follows_cycle_roles: % of % definition(s) answer differently from the old body', n_diff, n_all;
  end if;
  select p.proconfig, p.provolatile into v_cfg, v_vol from pg_proc p
   where p.oid = 'public.definition_follows_cycle_roles(uuid)'::regprocedure;
  if v_vol <> 's' or not ('search_path=public, pg_temp' = any (v_cfg)) then
    raise exception 'definition_follows_cycle_roles lost its shape: volatility %, config %', v_vol, v_cfg;
  end if;
  if has_function_privilege('authenticated', 'public.definition_follows_cycle_roles(uuid)'::regprocedure, 'execute')
     or has_function_privilege('anon', 'public.definition_follows_cycle_roles(uuid)'::regprocedure, 'execute') then
    raise exception 'definition_follows_cycle_roles is executable by a client role';
  end if;
  raise notice 'definition_follows_cycle_roles: % definition(s) compared, all identical', n_all;
end $$;
