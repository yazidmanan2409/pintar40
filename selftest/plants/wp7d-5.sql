-- wp7d-5 — planted defect. Applied inside a transaction the harness opens and
-- rolls back; it must NOT contain begin/rollback or run a suite itself.
--
-- 13. P5, PARTICIPATION ORACLE. The subject list starts carrying how many
--     people have answered -- the differencing attack with a Management
--     login in front of it.
-- P5 PRIVACY: the subject list starts carrying how many people have answered,
-- which is the differencing attack with a Management login in front of it.
drop function public.feedback_subjects_for_class(uuid);
create function public.feedback_subjects_for_class(p_node uuid)
returns table (person_id uuid, display_name text, responses bigint)
language plpgsql stable security definer set search_path = public, pg_temp as $f$
declare v_me uuid;
begin
  v_me := public.current_person_id();
  if v_me is null or p_node is null or not public.management_scope_over_node(p_node) then
    raise exception 'naming the subjects of a feedback cycle is for a HEAD_OF_DEPARTMENT or DEAN standing over that class';
  end if;
  return query
    select c.person_id, p.display_name,
           (select count(*) from public.feedback_opportunities o
              join public.feedback_cycles f on f.id = o.cycle_id
             where f.scope_node_id = p_node and f.subject_person_id = c.person_id and o.consumed)
      from public.feedback_subject_candidates(p_node) c
      join public.persons p on p.id = c.person_id
     where c.person_id <> v_me
     order by p.display_name, c.person_id;
end $f$;
revoke all on function public.feedback_subjects_for_class(uuid) from public, anon, authenticated;
grant execute on function public.feedback_subjects_for_class(uuid) to authenticated;
