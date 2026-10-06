-- J3.6 (ADM-07; ADM-J09) -- A STUDENT RECORDED IN A TINGKAT IS PLACED IN ITS KELAS.
--
-- The intake places a learner in an active Kelas or Tingkat (M5a). A learner
-- recorded in a Tingkat only could never be put into a Kelas afterwards:
-- re-intake is refused ("already holds an institutional identity here") and
-- «Pindah kelas» (move_learner_to_class, 20261027100000) moved Kelas to Kelas
-- only, refusing a Tingkat placement with MOVE_NOT_A_KELAS.
--
-- move_learner_to_class now also takes a Tingkat placement, into a Kelas of
-- that same Tingkat: the Tingkat membership closes with MOVED and the Kelas
-- membership opens, same enrolment and year, same instant. The learner is
-- still under the Tingkat (the Kelas's path holds it), so nothing that reads
-- the Tingkat loses them. Everything else is 20261027100000's body: SECURITY
-- INVOKER, the caller's own row security deciding both writes, the same
-- refusals, plus one:
--   MOVE_ALREADY_IN_KELAS  the learner already has a Kelas in that Tingkat
--                          (only the old seeds hold both); they move from
--                          their Kelas
-- A Kelas of another Tingkat is MOVE_NOT_A_KELAS, as before. No policy, table,
-- grant or evidence row changes.

create or replace function public.move_learner_to_class(p_membership uuid, p_kelas uuid)
returns uuid
language plpgsql security invoker set search_path = public, pg_temp as $$
declare v_m record; v_to record; v_status public.enrollment_status; v_new uuid; v_n int;
begin
  if p_membership is null or p_kelas is null then
    raise exception using errcode = '22023', message = 'a placement and a destination Kelas are both required';
  end if;

  select m.id, m.enrollment_id, m.node_id, m.academic_period_id, m.valid_to, n.kind, n.institution_id
    into v_m
    from public.memberships m join public.org_nodes n on n.id = m.node_id
   where m.id = p_membership;
  select n.id, n.kind, n.institution_id, n.academic_period_id, n.jalur
    into v_to
    from public.org_nodes n where n.id = p_kelas;
  if v_m.id is null or v_to.id is null or v_to.institution_id <> v_m.institution_id
     or not public.has_scope('INSTITUTION_ADMIN', v_m.node_id)
     or not public.has_scope('INSTITUTION_ADMIN', v_to.id) then
    raise exception using errcode = '42501',
      message = 'moving a learner needs INSTITUTION_ADMIN over the place they are in and the Kelas they move to, in one school';
  end if;

  select e.status into v_status from public.enrollments e where e.id = v_m.enrollment_id;
  if v_m.valid_to is not null or v_status is null or v_status not in ('PENDING', 'ACTIVE') then
    raise exception using errcode = 'PR070', detail = 'MOVE_NOT_CURRENT',
      message = 'this placement has already ended';
  end if;
  -- a Kelas to another Kelas; or a Tingkat placement into a Kelas of that Tingkat (J3.6)
  if v_to.kind <> 'CLASS'
     or v_m.kind not in ('CLASS', 'COHORT')
     or (v_m.kind = 'COHORT' and not (v_to.jalur @> array[v_m.node_id])) then
    raise exception using errcode = 'PR070', detail = 'MOVE_NOT_A_KELAS',
      message = 'a placement moves to a Kelas: from a Kelas, or from a Tingkat into one of its Kelas';
  end if;
  if v_m.kind = 'COHORT' and exists (
       select 1 from public.memberships k join public.org_nodes kn on kn.id = k.node_id
        where k.enrollment_id = v_m.enrollment_id and k.valid_to is null and kn.kind = 'CLASS'
          and kn.jalur @> array[v_m.node_id]) then
    raise exception using errcode = 'PR070', detail = 'MOVE_ALREADY_IN_KELAS',
      message = 'the learner already has a Kelas in this Tingkat; move them from that Kelas';
  end if;
  if v_to.id = v_m.node_id then
    raise exception using errcode = 'PR070', detail = 'MOVE_SAME_KELAS',
      message = 'the learner is already in this Kelas';
  end if;
  if v_to.academic_period_id is distinct from v_m.academic_period_id then
    raise exception using errcode = 'PR070', detail = 'MOVE_OTHER_YEAR',
      message = 'the destination Kelas is in another academic year; the rollover moves a class into the next year';
  end if;

  update public.memberships
     set valid_to = now(), close_reason = 'MOVED'
   where id = v_m.id and valid_to is null;
  get diagnostics v_n = row_count;
  if v_n <> 1 then
    raise exception using errcode = 'PR070', detail = 'MOVE_NOT_CURRENT',
      message = 'this placement has already ended';
  end if;

  insert into public.memberships (enrollment_id, node_id, academic_period_id)
  values (v_m.enrollment_id, v_to.id, v_m.academic_period_id)
  returning id into v_new;
  return v_new;
end $$;

comment on function public.move_learner_to_class(uuid, uuid) is
  'D-085 M9 and J3.6: closes a learner''s open Kelas membership, or a Tingkat-only one, with MOVED and opens one in a Kelas of the same school and year (for a Tingkat, one of its own Kelas), in one transaction, under the caller''s own row security. Refusals: 42501; PR070 MOVE_NOT_CURRENT, MOVE_NOT_A_KELAS, MOVE_ALREADY_IN_KELAS, MOVE_SAME_KELAS, MOVE_OTHER_YEAR; PR020 STRUCTURE_PLACE_INACTIVE.';

revoke all on function public.move_learner_to_class(uuid, uuid) from public, anon;
grant execute on function public.move_learner_to_class(uuid, uuid) to authenticated;

-- ───────────────────────────────────────────────────────────── assertions
do $$
declare v_def text;
begin
  v_def := pg_get_functiondef('public.move_learner_to_class(uuid,uuid)'::regprocedure);
  if (select p.prosecdef from pg_proc p where p.oid = 'public.move_learner_to_class(uuid,uuid)'::regprocedure) then
    raise exception 'J3.6: move_learner_to_class must run as its caller (SECURITY INVOKER)';
  end if;
  if v_def !~ 'MOVE_ALREADY_IN_KELAS' or v_def !~ $r$v_to\.jalur @> array\[v_m\.node_id\]$r$ then
    raise exception 'J3.6: move_learner_to_class does not place a Tingkat learner into that Tingkat''s Kelas only';
  end if;
  if has_function_privilege('anon', 'public.move_learner_to_class(uuid,uuid)', 'execute')
     or not has_function_privilege('authenticated', 'public.move_learner_to_class(uuid,uuid)', 'execute') then
    raise exception 'J3.6: move_learner_to_class is for a signed-in caller only';
  end if;
end $$;
