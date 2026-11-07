-- D-195 (owner, 7 Nov, «OWNER DECISIONS — VISUAL INTELLIGENCE REPORTS»): TWO NARROW READS FOR THE APPROVED REPORTS.
--
-- (5) CONTOH LAPORAN 2-guru, section E: «Murid yang perlu penguatan», the learners of the teacher's own class who are in
--     the lowest band, by name and in alphabetical order. Nothing PINTAR already gave a teacher answered it: the class's
--     bands come as counts (class.readiness_distribution), and the teacher's view of one learner gives that learner's
--     results but no band. murid_perlu_penguatan(class) returns ONLY the learner's identity and name, for the learners
--     whose band is the lowest one, with what that band was decided on: the latest Uji Penguasaan's questions answered
--     right out of its questions (summed from the result's own per-objective record), and whether every required
--     question was right (the safety gate, which alone can place a learner in this band). The teacher already reads that
--     result (learner.result's audience); nothing else: no item, no answer, no other personal information.
--     (KESETIAAN #5, 7 Nov: «9 dari 20 soal tepat», «soal wajib belum tepat».)
--
--     THE BAND IS PINTAR'S APPROVED RULE, NOT A SECOND ONE: exactly calc_class_readiness_distribution's (D-095(c),
--     D-121(c), migration 20261130100000): the learner's latest official Uji Penguasaan (POST_TEST) result in this class,
--     read through the metric boundary bound to the class (scoped_official_sessions / scoped_official_results), placed
--     in the catalogue's readiness_tiers by its mastery; a failed safety gate falls to the lowest band. A learner with
--     no official Uji Penguasaan result here is «Belum mengerjakan», never a band, and is not listed.
--
--     WHO MAY ASK, DECIDED HERE (the same standing as tujuan_belum_tercapai, 20261225100000): the reader holds a live
--     role among learner.result's audiences other than STUDENT (today EDUCATOR), scoped at or above THIS class. Names
--     are listed only for learners placed in this class now (an open membership of a current enrolment). Anyone else
--     gets nothing: an empty answer, never an error that says whether the class exists.
--
-- (4) CONTOH LAPORAN 5-peserta: the result page of an educator's own professional-learning package says who else may
--     see that result (D-069(b),(c)). The learner's own client cannot read courses (courses_select is CAN_DRAFT), so
--     the page could not tell a professional-learning package from a chapter. jenis_belajar_saya(assignment) answers
--     that one fact (true for professional learning, false for a school's curriculum) for one of the caller's OWN
--     learning assignments (my_learning_assignments) and nothing (null) for any other. A boolean, so src still never
--     names the context (R10).
--
-- METRIC CATALOGUE AND ENGINE: unchanged. No calculator, no catalogue version, no new figure, no grant widened.

create or replace function public.murid_perlu_penguatan(p_class uuid)
returns table (person_id uuid, display_name text, benar integer, total integer, soal_wajib_tepat boolean)
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare
  v_me uuid; v_inst uuid; v_jalur uuid[]; v_cat text; v_aud public.app_role[]; v_lowest text;
begin
  v_me := public.current_person_id();
  if v_me is null or p_class is null then return; end if;

  select n.institution_id, n.jalur into v_inst, v_jalur
    from public.org_nodes n where n.id = p_class and n.kind = 'CLASS';
  if v_inst is null then return; end if;

  -- the audiences the catalogue gives a learner's record, less the learner's own
  v_cat := public.current_metric_catalogue();
  select array(select a from unnest(m.allowed_audiences) a where a <> 'STUDENT') into v_aud
    from public.metric_definitions m
   where m.catalogue_version = v_cat and m.metric_id = 'learner.result';
  if v_aud is null or cardinality(v_aud) = 0 then return; end if;

  -- the reader stands over THIS class
  if not exists (select 1 from public.role_assignments ra
                  where ra.person_id = v_me
                    and ra.revoked_at is null
                    and now() >= ra.valid_from and now() < ra.valid_until
                    and ra.role = any (v_aud)
                    and ra.scope_node_id is not null
                    and v_jalur @> array[ra.scope_node_id]) then
    return;
  end if;

  -- the lowest band of the catalogue in force
  select t.tier_key into v_lowest from public.readiness_tiers t
   where t.catalogue_version = v_cat and t.min_mastery is not null
   order by t.min_mastery limit 1;
  if v_lowest is null then return; end if;

  begin
    perform set_config('pintar.metric_boundary_node', p_class::text, true);
    perform set_config('pintar.metric_boundary_person', '', true);
    return query
      with learner as (
        -- calc_class_readiness_distribution's reading: the latest official Uji Penguasaan result in this class
        select distinct on (s.person_id) s.person_id, r.mastery, r.safety_gate_passed, r.per_domain
          from public.scoped_official_sessions s
          join public.scoped_official_results r on r.session_id = s.id
         where s.institution_id = v_inst and s.class_node_id = p_class
           and s.mode = 'POST_TEST'::public.assessment_mode
         order by s.person_id, r.computed_at desc
      ), banded as (
        select l.person_id, l.safety_gate_passed, l.per_domain,
               coalesce((select t2.tier_key from public.readiness_tiers t2
                          where t2.catalogue_version = v_cat and t2.min_mastery is not null
                            and l.mastery >= t2.min_mastery and l.mastery < t2.max_mastery
                            and l.safety_gate_passed is not false
                          limit 1), v_lowest) as tier_key
          from learner l
      )
      select b.person_id, p.display_name,
             (select coalesce(sum((kv.value ->> 'benar')::int), 0)::int from jsonb_each(coalesce(b.per_domain, '{}'::jsonb)) kv
               where jsonb_typeof(kv.value) = 'object' and jsonb_typeof(kv.value -> 'benar') = 'number'),
             (select coalesce(sum((kv.value ->> 'total')::int), 0)::int from jsonb_each(coalesce(b.per_domain, '{}'::jsonb)) kv
               where jsonb_typeof(kv.value) = 'object' and jsonb_typeof(kv.value -> 'total') = 'number'),
             b.safety_gate_passed
        from banded b
        join public.persons p on p.id = b.person_id
       where b.tier_key = v_lowest
         and exists (select 1 from public.memberships m
                       join public.enrollments e on e.id = m.enrollment_id
                      where m.node_id = p_class and m.valid_to is null
                        and e.person_id = b.person_id and e.institution_id = v_inst
                        and e.status in ('PENDING', 'ACTIVE'))
       order by p.display_name, b.person_id;
    perform set_config('pintar.metric_boundary_node', '', true);
  exception when others then
    perform set_config('pintar.metric_boundary_node', '', true);
    raise;
  end;
end $$;
revoke all on function public.murid_perlu_penguatan(uuid) from public, anon;
grant execute on function public.murid_perlu_penguatan(uuid) to authenticated;

create or replace function public.jenis_belajar_saya(p_learning_assignment uuid)
returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  -- true: professional learning; false: a school's curriculum; null: not one of the caller's own assignments
  select c.learning_context = 'PROFESSIONAL_DEVELOPMENT'
    from public.my_learning_assignments() m
    join public.courses c on c.id = m.course_id
   where m.learning_assignment_id = p_learning_assignment
   limit 1
$$;
revoke all on function public.jenis_belajar_saya(uuid) from public, anon;
grant execute on function public.jenis_belajar_saya(uuid) to authenticated;

insert into public.client_rpc_registry (function_name, exposure, note, authorization_kind, authorization_requirement) values
  ('murid_perlu_penguatan', 'STAFF', 'D-195(5), CONTOH LAPORAN 2-guru section E: the learners placed in this class now '
   || 'whose band (calc_class_readiness_distribution''s rule) is the lowest: identity, name, the latest Uji Penguasaan''s '
   || 'questions right out of its questions, and whether every required question was right. For a holder of '
   || 'learner.result''s staff audience (EDUCATOR) scoped over the class; anyone else gets nothing. No figure, no item, '
   || 'no answer.', 'SCOPE', 'EDUCATOR'),
  ('jenis_belajar_saya', 'LEARNER', 'D-195(4), CONTOH LAPORAN 5-peserta: whether one of the caller''s own learning '
   || 'assignments is professional learning (true) or a school''s curriculum (false); nothing for any other.', null, null)
on conflict (function_name) do update
  set exposure = excluded.exposure, note = excluded.note,
      authorization_kind = excluded.authorization_kind, authorization_requirement = excluded.authorization_requirement;

do $$
declare f text;
begin
  foreach f in array array['public.murid_perlu_penguatan(uuid)', 'public.jenis_belajar_saya(uuid)'] loop
    if has_function_privilege('anon', f, 'execute') or not has_function_privilege('authenticated', f, 'execute') then
      raise exception '% is reached by the wrong roles', f;
    end if;
  end loop;
  if (select count(*) from pg_proc p where p.proname in ('murid_perlu_penguatan', 'jenis_belajar_saya') and p.prosecdef
        and 'search_path=public, pg_temp' = any (p.proconfig)) <> 2 then
    raise exception 'the D-195 reads are not SECURITY DEFINER functions with a fixed search_path';
  end if;
  if (select count(*) from public.client_rpc_registry r
       where r.function_name in ('murid_perlu_penguatan', 'jenis_belajar_saya')) <> 2 then
    raise exception 'the D-195 reads are not in the client RPC registry';
  end if;
end $$;
