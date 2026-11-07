-- KESETIAAN #6, #7, #18, #21 (Daisy's design-fidelity check, 8cfc75b5; owner, 7 Nov: «GO» on all four, under the
-- existing metric definitions and authorization boundaries). FOUR NARROW READS; no metric, calculator or catalogue
-- version changes, and no grant is widened.
--
-- #6  sebaran_murid_kelas(class): the class's score line, one dot per learner, for the class's TEACHER only. One row per
--     learner who has an official Uji Penguasaan result in the class: that result's mastery and its band, under exactly
--     calc_class_readiness_distribution's rule (the latest result in the class, readiness_tiers, a failed safety gate to
--     the lowest band). NO identity of any kind: the rows carry no person, no name, and come back ordered by mastery,
--     so a dot cannot be tied to a learner. The same reader check as murid_perlu_penguatan (learner.result's staff
--     audience, EDUCATOR, scoped over the class); a Kepala departemen, a Dekan or anyone else gets nothing.
--
-- #7  kenaikan_awal_akhir(class): the before → after pair behind «Kenaikan», over EXACTLY its evidence. class.net_gain
--     (MC-8, migration 198) is the mean, over every (learner, chapter) with an official Pemetaan Awal AND an official Uji
--     Penguasaan in the class, of post − pre. The pair is the mean pre and the mean post over those same pairs, so
--     akhir − awal IS the Kenaikan figure, never a second definition of it. It answers only when the reader's own
--     metric_evaluate('class.net_gain') is «ok» (the same audiences, the same minimum, the same evidence boundary);
--     otherwise nothing, and the page says «Belum dapat dibandingkan». Comparable by construction: the same learner, the
--     same chapter (plp release), the two tests of one cycle.
--
-- #18 kesiapan_kelas_per_mapel(node): evidence readiness per subject and class, for a reader who may read the class
--     figures at or above the node (class.readiness_distribution's staff audiences: Kepala departemen, Dekan, Admin
--     sekolah, scoped over it). The POPULATION of a subject is every active class below the node with an active
--     learning assignment of that subject (an ACADEMIC course; on the class or on a place above it). Per class: how
--     many learners have an official Uji Penguasaan of that subject's chapters in the class (the evidence the class
--     figures read), and the catalogue's own minimum for the class distribution. No learner, no result, no figure.
--
-- #21 kelas_dikecualikan_kartu(classes): for Aktivasi's several-classes cards, who in each chosen class is NOT offered a
--     card, by ONE reason each (the reasons never overlap):
--       AKUN       placed in the class now (an open membership of a PENDING or ACTIVE enrolment) and already has an
--                  account (a class card or an email account);
--       STAF       placed in the class now, no account, and holds a staff role (CR-91: a card is a learner's alone);
--       PENDATAAN  not yet in the class: a learner row (role empty or STUDENT) of an import still running or waiting
--                  for its go (not DRAFT, COMPLETED or FAILED), still PENDING, that names the class, and whose person,
--                  if already known, is not placed in it (so no one is counted twice).
--     Counted per class, as the cards are offered per class. Only classes of a school whose people the reader may
--     provision (menunggu_akun_boleh, as kelas_menunggu_akun). Counts only; no name.

-- ═══════════════════════════════════════════════════════════════════════════════════════════════════════════ #6
create or replace function public.sebaran_murid_kelas(p_class uuid)
returns table (mastery numeric, tier_key text)
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare
  v_me uuid; v_inst uuid; v_jalur uuid[]; v_cat text; v_aud public.app_role[]; v_lowest text;
begin
  v_me := public.current_person_id();
  if v_me is null or p_class is null then return; end if;
  select n.institution_id, n.jalur into v_inst, v_jalur from public.org_nodes n where n.id = p_class and n.kind = 'CLASS'
     and n.member_kind = 'LEARNER';   -- a class of learners only (D-069: a PD class is never drawn by result)
  if v_inst is null then return; end if;
  v_cat := public.current_metric_catalogue();
  select array(select a from unnest(m.allowed_audiences) a where a <> 'STUDENT') into v_aud
    from public.metric_definitions m where m.catalogue_version = v_cat and m.metric_id = 'learner.result';
  if v_aud is null or cardinality(v_aud) = 0 then return; end if;
  if not exists (select 1 from public.role_assignments ra
                  where ra.person_id = v_me and ra.revoked_at is null
                    and now() >= ra.valid_from and now() < ra.valid_until
                    and ra.role = any (v_aud) and ra.scope_node_id is not null
                    and v_jalur @> array[ra.scope_node_id]) then
    return;
  end if;
  select t.tier_key into v_lowest from public.readiness_tiers t
   where t.catalogue_version = v_cat and t.min_mastery is not null order by t.min_mastery limit 1;
  if v_lowest is null then return; end if;
  begin
    perform set_config('pintar.metric_boundary_node', p_class::text, true);
    perform set_config('pintar.metric_boundary_person', '', true);
    return query
      with learner as (
        select distinct on (s.person_id) s.person_id, r.mastery, r.safety_gate_passed
          from public.scoped_official_sessions s
          join public.scoped_official_results r on r.session_id = s.id
         where s.institution_id = v_inst and s.class_node_id = p_class
           and s.mode = 'POST_TEST'::public.assessment_mode
         order by s.person_id, r.computed_at desc
      )
      select round(l.mastery, 4),
             coalesce((select t2.tier_key from public.readiness_tiers t2
                        where t2.catalogue_version = v_cat and t2.min_mastery is not null
                          and l.mastery >= t2.min_mastery and l.mastery < t2.max_mastery
                          and l.safety_gate_passed is not false
                        limit 1), v_lowest)
        from learner l
       order by 1, 2;
    perform set_config('pintar.metric_boundary_node', '', true);
  exception when others then
    perform set_config('pintar.metric_boundary_node', '', true);
    raise;
  end;
end $$;
revoke all on function public.sebaran_murid_kelas(uuid) from public, anon;
grant execute on function public.sebaran_murid_kelas(uuid) to authenticated;

-- ═══════════════════════════════════════════════════════════════════════════════════════════════════════════ #7
create or replace function public.kenaikan_awal_akhir(p_class uuid)
returns table (awal numeric, akhir numeric, pasangan integer, orang integer)
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_inst uuid; v_ok text;
begin
  if public.current_person_id() is null or p_class is null then return; end if;
  select n.institution_id into v_inst from public.org_nodes n where n.id = p_class and n.kind = 'CLASS';
  if v_inst is null then return; end if;
  -- the reader's own Kenaikan: its audiences, minimum and boundary decide; anything but «ok» answers nothing
  v_ok := public.metric_evaluate('class.net_gain', p_class, v_inst) ->> 'status';
  if v_ok is distinct from 'ok' then return; end if;
  begin
    perform set_config('pintar.metric_boundary_node', p_class::text, true);
    perform set_config('pintar.metric_boundary_person', '', true);
    return query
      -- calc_class_net_gain's own pairing (MC-8): one (learner, chapter) with both tests
      select round(avg(g.pre), 4), round(avg(g.post), 4), count(*)::integer, count(distinct g.person_id)::integer
        from (select s.person_id, s.plp_release_id,
                     max(case when s.mode = 'PRE_TEST'::public.assessment_mode then r.mastery end) as pre,
                     max(case when s.mode = 'POST_TEST'::public.assessment_mode then r.mastery end) as post
                from public.scoped_official_sessions s
                join public.scoped_official_results r on r.session_id = s.id
               where s.institution_id = v_inst and s.class_node_id = p_class
                 and s.mode = any (array['PRE_TEST'::public.assessment_mode, 'POST_TEST'::public.assessment_mode])
               group by s.person_id, s.plp_release_id) g
       where g.pre is not null and g.post is not null
      having count(*) > 0;
    perform set_config('pintar.metric_boundary_node', '', true);
  exception when others then
    perform set_config('pintar.metric_boundary_node', '', true);
    raise;
  end;
end $$;
revoke all on function public.kenaikan_awal_akhir(uuid) from public, anon;
grant execute on function public.kenaikan_awal_akhir(uuid) to authenticated;

-- ══════════════════════════════════════════════════════════════════════════════════════════════════════════ #18
create or replace function public.kesiapan_kelas_per_mapel(p_node uuid)
returns table (subject text, class_id uuid, class_name text, have integer, needed integer)
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_me uuid; v_inst uuid; v_jalur uuid[]; v_cat text; v_aud public.app_role[]; v_min integer;
begin
  v_me := public.current_person_id();
  if v_me is null or p_node is null then return; end if;
  select n.institution_id, n.jalur into v_inst, v_jalur from public.org_nodes n where n.id = p_node;
  if v_inst is null then return; end if;
  v_cat := public.current_metric_catalogue();
  select array(select a from unnest(m.allowed_audiences) a where a not in ('STUDENT', 'EDUCATOR')), m.minimum_sample
    into v_aud, v_min
    from public.metric_definitions m where m.catalogue_version = v_cat and m.metric_id = 'class.readiness_distribution';
  if v_aud is null or cardinality(v_aud) = 0 or v_min is null then return; end if;
  -- the reader stands at or above the node, in one of the class figures' leadership or administration audiences
  if not exists (select 1 from public.role_assignments ra
                  where ra.person_id = v_me and ra.revoked_at is null
                    and now() >= ra.valid_from and now() < ra.valid_until
                    and ra.role = any (v_aud)
                    and ra.scope_node_id is not null and ra.scope_node_id = any (v_jalur)) then
    return;
  end if;
  begin
    perform set_config('pintar.metric_boundary_node', p_node::text, true);
    perform set_config('pintar.metric_boundary_person', '', true);
    return query
      with kelas as (
        select k.id, k.name, k.jalur from public.org_nodes k
         where k.institution_id = v_inst and k.kind = 'CLASS' and k.is_active and k.jalur @> array[p_node]
      ), mapel as (
        -- the population: each class with an active academic learning assignment of the subject, on it or above it
        select distinct k.id as class_id, k.name as class_name, c.subject
          from kelas k
          join public.learning_assignments la on la.status = 'ACTIVE' and k.jalur @> array[la.node_id]
          join public.courses c on c.id = la.course_id and c.learning_context = 'ACADEMIC'
         where coalesce(btrim(c.subject), '') <> ''
      ), bukti as (
        select s.class_node_id, c.subject, count(distinct s.person_id)::integer as n
          from public.scoped_official_sessions s
          join public.scoped_official_results r on r.session_id = s.id
          join public.plp_releases pr on pr.id = s.plp_release_id
          join public.courses c on c.id = pr.course_id
         where s.institution_id = v_inst and s.mode = 'POST_TEST'::public.assessment_mode
         group by s.class_node_id, c.subject
      )
      select m.subject, m.class_id, m.class_name, coalesce(b.n, 0), v_min
        from mapel m
        left join bukti b on b.class_node_id = m.class_id and b.subject = m.subject
       order by m.subject, m.class_name, m.class_id;
    perform set_config('pintar.metric_boundary_node', '', true);
  exception when others then
    perform set_config('pintar.metric_boundary_node', '', true);
    raise;
  end;
end $$;
revoke all on function public.kesiapan_kelas_per_mapel(uuid) from public, anon;
grant execute on function public.kesiapan_kelas_per_mapel(uuid) to authenticated;

-- ══════════════════════════════════════════════════════════════════════════════════════════════════════════ #21
create or replace function public.kelas_dikecualikan_kartu(p_classes uuid[])
returns table (node_id uuid, alasan text, jumlah integer)
language sql stable security definer set search_path = public, pg_temp as $$
  with kelas as (
    select n.id, n.institution_id from public.org_nodes n
     where n.id = any (coalesce(p_classes, '{}'::uuid[])) and n.kind = 'CLASS'
       and public.menunggu_akun_boleh(n.institution_id)
  ), anggota as (
    select distinct m.node_id, e.person_id
      from public.memberships m
      join kelas k on k.id = m.node_id
      join public.enrollments e on e.id = m.enrollment_id and e.status in ('PENDING', 'ACTIVE')
     where m.valid_to is null
  ), alasan as (
    select a.node_id,
           case when exists (select 1 from public.accounts x where x.person_id = a.person_id) then 'AKUN'
                when public.memegang_peran_staf(a.person_id) then 'STAF' end as alasan
      from anggota a
    union all
    select k.id, 'PENDATAAN'
      from kelas k
      join public.import_rows ir on nullif(ir.payload ->> 'node_id', '') = k.id::text and ir.state = 'PENDING'
      join public.import_jobs j on j.id = ir.job_id and j.institution_id = k.institution_id
                               and j.state not in ('DRAFT', 'COMPLETED', 'FAILED')
     where coalesce(nullif(ir.payload ->> 'role', ''), 'STUDENT') = 'STUDENT'
       and not exists (select 1 from anggota a where a.node_id = k.id and a.person_id::text = ir.payload ->> 'person_id')
  )
  select x.node_id, x.alasan, count(*)::integer from alasan x where x.alasan is not null
   group by x.node_id, x.alasan
$$;
revoke all on function public.kelas_dikecualikan_kartu(uuid[]) from public, anon;
grant execute on function public.kelas_dikecualikan_kartu(uuid[]) to authenticated;

insert into public.client_rpc_registry (function_name, exposure, note, authorization_kind, authorization_requirement) values
  ('sebaran_murid_kelas', 'STAFF', 'KESETIAAN #6: the class''s score line, one row per assessed learner (mastery and band '
   || 'under calc_class_readiness_distribution''s rule), with no identity; for the class''s teacher only.', 'SCOPE', 'EDUCATOR'),
  ('kenaikan_awal_akhir', 'STAFF', 'KESETIAAN #7: the mean Pemetaan Awal and the mean Uji Penguasaan over exactly the pairs '
   || 'class.net_gain reads; only when the reader''s own class.net_gain evaluates ok.', 'DELEGATED', 'metric_evaluate'),
  ('kesiapan_kelas_per_mapel', 'STAFF', 'KESETIAAN #18: per subject and class below the node, how many learners have an '
   || 'official Uji Penguasaan of the subject and the class distribution''s minimum; for the class figures'' leadership '
   || 'and administration audiences at or above the node.', 'ROLE_SET', 'HEAD_OF_DEPARTMENT,DEAN,INSTITUTION_ADMIN'),
  ('kelas_dikecualikan_kartu', 'STAFF', 'KESETIAAN #21: per chosen class, how many are not offered a class card, by one '
   || 'reason each (AKUN, STAF, PENDATAAN); for a reader who may provision the school''s people.', 'CAPABILITY', 'CAN_PROVISION_PEOPLE')
on conflict (function_name) do update
  set exposure = excluded.exposure, note = excluded.note,
      authorization_kind = excluded.authorization_kind, authorization_requirement = excluded.authorization_requirement;

do $$
declare f text;
begin
  foreach f in array array['public.sebaran_murid_kelas(uuid)', 'public.kenaikan_awal_akhir(uuid)',
                           'public.kesiapan_kelas_per_mapel(uuid)', 'public.kelas_dikecualikan_kartu(uuid[])'] loop
    if has_function_privilege('anon', f, 'execute') or not has_function_privilege('authenticated', f, 'execute') then
      raise exception '% is reached by the wrong roles', f;
    end if;
  end loop;
  if (select count(*) from pg_proc p where p.proname in ('sebaran_murid_kelas', 'kenaikan_awal_akhir', 'kesiapan_kelas_per_mapel',
        'kelas_dikecualikan_kartu') and p.prosecdef and 'search_path=public, pg_temp' = any (p.proconfig)) <> 4 then
    raise exception 'the KESETIAAN reads are not SECURITY DEFINER functions with a fixed search_path';
  end if;
  if (select count(*) from public.client_rpc_registry r where r.function_name in ('sebaran_murid_kelas', 'kenaikan_awal_akhir',
        'kesiapan_kelas_per_mapel', 'kelas_dikecualikan_kartu')) <> 4 then
    raise exception 'the KESETIAAN reads are not in the client RPC registry';
  end if;
end $$;
