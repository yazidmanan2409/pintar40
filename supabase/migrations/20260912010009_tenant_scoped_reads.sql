-- 0009 — Tenant-scoped enrollment/membership reads.
-- Finding (selftest F01-T02 on re-run, 2026-09-12): after a transfer, the
-- sending institution's admin could read the learner's NEW enrollment at
-- the receiving institution, because enrollments_select/memberships_select
-- keyed on person_visible_to_me(person) rather than on the institution that
-- owns the row. That is a cross-tenant read (INV-13). A learner's later
-- records at another institution are that institution's data.
--
-- Rule now: a staff member reads an enrollment/membership only if
--   (a) it is their own, or
--   (b) they hold INSTITUTION_ADMIN over the row's institution, or
--   (c) they hold ≥ EDUCATOR over a node the row is a membership of, or
--   (d) portable visibility: they hold INSTITUTION_ADMIN at a receiving
--       institution and the row already existed at transfer time
--       (portable history, never the learner's future elsewhere).
-- Architecture: INV-13, INV-25; doc 05.

drop policy enrollments_select on public.enrollments;
create policy enrollments_select on public.enrollments for select to authenticated
  using (
    person_id = public.current_person_id()
    or public.has_scope('INSTITUTION_ADMIN', institution_id)
    or exists (select 1 from public.memberships m where m.enrollment_id = enrollments.id and public.has_scope('EDUCATOR', m.node_id))
    or exists (select 1 from public.portable_visibility pv
                where pv.person_id = enrollments.person_id
                  and enrollments.created_at <= pv.granted_at
                  and public.has_scope('INSTITUTION_ADMIN', pv.institution_id))
  );

drop policy memberships_select on public.memberships;
create policy memberships_select on public.memberships for select to authenticated
  using (
    exists (select 1 from public.enrollments e where e.id = memberships.enrollment_id and e.person_id = public.current_person_id())
    or public.has_scope('EDUCATOR', node_id)
    or exists (select 1 from public.enrollments e join public.portable_visibility pv on pv.person_id = e.person_id
                where e.id = memberships.enrollment_id
                  and memberships.created_at <= pv.granted_at
                  and public.has_scope('INSTITUTION_ADMIN', pv.institution_id))
  );

do $$
declare n int;
begin
  select count(*) into n from pg_policies where schemaname='public' and (qual = 'true' or with_check = 'true');
  if n > 0 then raise exception '% policy(ies) use USING/WITH CHECK (true) (INV-36)', n; end if;
  select count(*) into n from pg_policies where schemaname='public' and tablename in ('enrollments','memberships') and cmd = 'SELECT';
  if n <> 2 then raise exception 'expected exactly one SELECT policy on enrollments and memberships, found %', n; end if;
end $$;
