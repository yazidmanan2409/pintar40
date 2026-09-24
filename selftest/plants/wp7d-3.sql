-- wp7d-3 — planted defect. Applied inside a transaction the harness opens and
-- rolls back; it must NOT contain begin/rollback or run a suite itself.
--
-- 11. P3, PROVENANCE DRIFT. The read stops asking the shared rule and
--     grows its own, looser one: every educator in the school rather than
--     of the class. This is the exact failure the single rule exists to
--     prevent -- a list that offers people the operation would refuse.
-- P3 PROVENANCE: discovery stops asking the shared rule and grows its own,
-- looser one -- every educator in the school rather than of the class. This is
-- the drift the single rule exists to prevent.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.feedback_subjects_for_class(uuid)'::regprocedure);
  src := replace(orig, 'from public.feedback_subject_candidates(p_node) c',
                       'from (select distinct ra.person_id
              from public.role_assignments ra
              join public.org_nodes n on n.id = ra.scope_node_id
              join public.org_nodes t on t.id = p_node
             where ra.role = ''EDUCATOR'' and ra.revoked_at is null
               and now() >= ra.valid_from and now() < ra.valid_until
               and n.institution_id = t.institution_id) c');
  if src = orig then raise exception 'the plant did not reach the candidate source'; end if;
  execute src;
end $d$;
