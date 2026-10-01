-- D-085 M9 (J3.12; ADM-J13) -- A STUDENT MOVES CLASS. THEIR HISTORY DOES NOT.
--
-- A school administrator could place a learner only inside an intake row. A
-- learner already recorded could not be moved: re-intake is refused ("already
-- holds an institutional identity here"), the rollover moves whole classes
-- into the next year, and a transfer is to another school. M9 (D-085) puts the
-- move in 4.0: the same person and no duplicate; the current class follows the
-- new Kelas and the old one no longer counts them; history keeps the context
-- it happened in.
--
-- The schema was built for it (20260912004321): a membership is dated and
-- append-only, its only update is closing, and `MOVED` is a close reason that
-- nothing wrote until now. A session records the Kelas the learner sat it in
-- (assessment_sessions.class_node_id, set when it starts) and the class
-- calculators read that column, so past work stays with the Kelas it was done
-- in whatever the membership says afterwards.
--
-- move_learner_to_class(p_membership, p_kelas) is that pair of writes in ONE
-- transaction: the open Kelas membership closes with MOVED and a new one opens
-- in the chosen Kelas, for the same enrolment and year, at the same instant.
-- It is SECURITY INVOKER and grants nothing. The caller's own row security
-- decides both writes (memberships_update, memberships_insert: INSTITUTION_ADMIN
-- over the node), memberships_guard keeps the year and the school, and
-- memberships_place_is_active refuses a deactivated Kelas (PR020
-- STRUCTURE_PLACE_INACTIVE). The function asks the same INSTITUTION_ADMIN
-- question first only so that a refusal is a refusal, not a silent zero-row
-- update (F-05). A placement the caller may not see or change, an unknown id
-- and another school's Kelas are all 42501, alike, so no answer says what
-- exists elsewhere. The other refusals are named (SQLSTATE PR070, code in
-- DETAIL):
--   MOVE_NOT_CURRENT  the placement has already ended (a second press, or a
--                     move made meanwhile), or the enrolment has ended
--   MOVE_NOT_A_KELAS  the placement or the destination is not a Kelas; a
--                     learner placed only in a Tingkat is placed, not moved
--   MOVE_SAME_KELAS   the destination is the Kelas the learner is in
--   MOVE_OTHER_YEAR   the destination is in another academic year, which the
--                     rollover reaches, not a move
--
-- Not changed: no policy, no table grant, no evidence row, no session. A
-- Tingkat membership, which only the old seeds hold beside a Kelas, is left as
-- it is.

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
  select n.id, n.kind, n.institution_id, n.academic_period_id
    into v_to
    from public.org_nodes n where n.id = p_kelas;
  if v_m.id is null or v_to.id is null or v_to.institution_id <> v_m.institution_id
     or not public.has_scope('INSTITUTION_ADMIN', v_m.node_id)
     or not public.has_scope('INSTITUTION_ADMIN', v_to.id) then
    raise exception using errcode = '42501',
      message = 'moving a learner needs INSTITUTION_ADMIN over the Kelas they are in and the one they move to, in one school';
  end if;

  select e.status into v_status from public.enrollments e where e.id = v_m.enrollment_id;
  if v_m.valid_to is not null or v_status is null or v_status not in ('PENDING', 'ACTIVE') then
    raise exception using errcode = 'PR070', detail = 'MOVE_NOT_CURRENT',
      message = 'this placement has already ended';
  end if;
  if v_m.kind <> 'CLASS' or v_to.kind <> 'CLASS' then
    raise exception using errcode = 'PR070', detail = 'MOVE_NOT_A_KELAS',
      message = 'only a placement in a Kelas moves, and only to a Kelas';
  end if;
  if v_to.id = v_m.node_id then
    raise exception using errcode = 'PR070', detail = 'MOVE_SAME_KELAS',
      message = 'the learner is already in this Kelas';
  end if;
  if v_to.academic_period_id is distinct from v_m.academic_period_id then
    raise exception using errcode = 'PR070', detail = 'MOVE_OTHER_YEAR',
      message = 'the destination Kelas is in another academic year; the rollover moves a class into the next year';
  end if;

  -- close: the only update a membership allows, once. A move made meanwhile
  -- has closed it already, and this matches nothing.
  update public.memberships
     set valid_to = now(), close_reason = 'MOVED'
   where id = v_m.id and valid_to is null;
  get diagnostics v_n = row_count;
  if v_n <> 1 then
    raise exception using errcode = 'PR070', detail = 'MOVE_NOT_CURRENT',
      message = 'this placement has already ended';
  end if;

  -- open: the same enrolment, the same year, the new Kelas, from this instant
  insert into public.memberships (enrollment_id, node_id, academic_period_id)
  values (v_m.enrollment_id, v_to.id, v_m.academic_period_id)
  returning id into v_new;
  return v_new;
end $$;

comment on function public.move_learner_to_class(uuid, uuid) is
  'D-085 M9: closes a learner''s open Kelas membership with MOVED and opens one in another Kelas of the same school and year, in one transaction, under the caller''s own row security. Refusals: 42501; PR070 MOVE_NOT_CURRENT, MOVE_NOT_A_KELAS, MOVE_SAME_KELAS, MOVE_OTHER_YEAR; PR020 STRUCTURE_PLACE_INACTIVE.';

revoke all on function public.move_learner_to_class(uuid, uuid) from public, anon;
grant execute on function public.move_learner_to_class(uuid, uuid) to authenticated;

-- ───────────────────────────────────────────────────────────── assertions
do $$
declare v_def text;
begin
  if (select p.prosecdef from pg_proc p where p.oid = 'public.move_learner_to_class(uuid,uuid)'::regprocedure) then
    raise exception 'M9: move_learner_to_class must run as its caller (SECURITY INVOKER): it grants nothing';
  end if;
  if has_function_privilege('anon', 'public.move_learner_to_class(uuid,uuid)', 'execute')
     or not has_function_privilege('authenticated', 'public.move_learner_to_class(uuid,uuid)', 'execute') then
    raise exception 'M9: move_learner_to_class is for a signed-in caller only';
  end if;
  if not ('MOVED' = any (enum_range(null::public.membership_close_reason)::text[])) then
    raise exception 'M9: the close reason MOVED is missing';
  end if;
  -- the policies the move relies on are the ones it found: an administrator over the node, for both writes
  select string_agg(p.policyname || ':' || p.cmd || ':' || coalesce(p.qual, '') || ':' || coalesce(p.with_check, ''), ' | '
                    order by p.policyname)
    into v_def from pg_policies p
   where p.schemaname = 'public' and p.tablename = 'memberships' and p.cmd in ('INSERT', 'UPDATE');
  if v_def is null or v_def !~ 'memberships_insert:INSERT::.*INSTITUTION_ADMIN'
     or v_def !~ 'memberships_update:UPDATE:.*INSTITUTION_ADMIN.*INSTITUTION_ADMIN' then
    raise exception 'M9: the membership write policies are not the INSTITUTION_ADMIN ones this move relies on: %', v_def;
  end if;
end $$;
