-- wp7d-4 — planted defect. Applied inside a transaction the harness opens and
-- rolls back; it must NOT contain begin/rollback or run a suite itself.
--
-- 12. P4, MINIMUM PROJECTION. The read hands back the account behind the
--     person. One extra column is how a discovery endpoint becomes a
--     staff directory, and it is caught as a SIGNATURE rather than by
--     inspecting values.
-- P4 MINIMUM PROJECTION: the read starts handing back the account behind the
-- person, which is how a discovery endpoint becomes a staff directory.
drop function public.feedback_subjects_for_class(uuid);
create function public.feedback_subjects_for_class(p_node uuid)
returns table (person_id uuid, display_name text, email text)
language plpgsql stable security definer set search_path = public, pg_temp as $f$
declare v_me uuid;
begin
  v_me := public.current_person_id();
  if v_me is null or p_node is null or not public.management_scope_over_node(p_node) then
    raise exception 'naming the subjects of a feedback cycle is for a HEAD_OF_DEPARTMENT or DEAN standing over that class';
  end if;
  return query
    select c.person_id, p.display_name, u.email::text
      from public.feedback_subject_candidates(p_node) c
      join public.persons p on p.id = c.person_id
      left join public.accounts a on a.person_id = c.person_id
      left join auth.users u on u.id = a.auth_user_id
     where c.person_id <> v_me
     order by p.display_name, c.person_id;
end $f$;
revoke all on function public.feedback_subjects_for_class(uuid) from public, anon, authenticated;
grant execute on function public.feedback_subjects_for_class(uuid) to authenticated;
