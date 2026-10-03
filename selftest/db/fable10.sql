-- FABLE-10 database suite: BOB-01, a school builds its own structure (D-006,
-- audit B1), and the intake places a learner only in a Kelas or Tingkat (M5a).
--
-- Ordering: depends on fable01.sql (the role-switch helpers) and fable06.sql
-- (as_user_uid). Never applied as a migration; never present in production.
--
-- WHAT IT PROVES, signed in as the person who meets each rule:
--   F10-S01  an Admin sekolah builds Bagian → Tingkat → Kelas; the hidden Jenjang
--            is made once per school and a hidden Reguler once per Bagian
--   F10-S02  an Admin platform does the same, including for a school built
--            earlier by hand (D-016), which keeps the nodes it has
--   F10-S03  everyone else at the school is refused, and nothing is written
--   F10-S04  another school's admin is refused, and an unknown node answers
--            exactly as a forbidden one does
--   F10-S05  a Kelas sits under a Tingkat of the same year
--   F10-S06  every other refusal carries its own stable code; rename and
--            deactivate do what they say and nothing more
--   F10-M01  the intake refuses a learner placed anywhere but an active Kelas
--            or Tingkat, with its own phrase
--   F10-M02  the intake enrols a learner into the place's own academic year
--
-- THE SUITE DOES NOT REQUIRE THE MIGRATION TO LOAD. On a database without
-- BOB-01 it runs and every test reports red, which is how "red without the
-- change" is shown; M01 and M02 build their places directly so that they go
-- red for the rule itself, not for a missing function.
--
-- EVERY ROW IS ROLLED BACK: one subtransaction, verdicts collected in a jsonb
-- of problems, a sentinel to undo the lot, and the findings emitted afterwards.

create schema if not exists selftest;
grant usage on schema selftest to authenticated, anon;

do $$
begin
  if to_regprocedure('selftest.as_user(text)') is null
     or to_regprocedure('selftest.as_owner()') is null
     or to_regprocedure('selftest.as_anon()') is null then
    raise exception 'apply fable01.sql before fable10.sql';
  end if;
  if to_regprocedure('selftest.as_user_uid(uuid)') is null then
    raise exception 'apply fable06.sql before fable10.sql';
  end if;
end $$;

-- BOB-08 (c): a structure function accepts only the current school year, the
-- one before and the one after, so the suite names its years relative to
-- today's rather than as literals that would age out of that window.
create or replace function selftest.f10_mulai(k int)
returns int language sql stable security definer set search_path = public, pg_temp as $$
  select public.structure_current_year_start() + k
$$;
create or replace function selftest.f10_tahun(k int)
returns text language sql stable security definer set search_path = public, pg_temp as $$
  select (public.structure_current_year_start() + k)::text || '/' || (public.structure_current_year_start() + k + 1)::text
$$;
grant execute on function selftest.f10_mulai(int), selftest.f10_tahun(int) to authenticated;

create or replace function selftest.f10_note(p jsonb, p_id text, p_problem text)
returns jsonb language sql immutable as $$
  select jsonb_set(coalesce(p, '{}'::jsonb), array[p_id],
                   coalesce(p -> p_id, '[]'::jsonb) || to_jsonb(p_problem))
$$;
revoke all on function selftest.f10_note(jsonb, text, text) from public;
grant execute on function selftest.f10_note(jsonb, text, text) to authenticated, anon;

-- A person with an account and (optionally) one role, built through the Auth
-- trigger under the synthetic seed intent, as the fixtures build them.
create or replace function selftest.f10_user(p_email text, p_role public.app_role, p_node uuid)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare v_uid uuid; v_person uuid;
begin
  perform set_config('app.seed_intent', 'synthetic', true);
  insert into auth.users (id, email) values (gen_random_uuid(), p_email) returning id into v_uid;
  select a.person_id into v_person from public.accounts a where a.auth_user_id = v_uid;
  if p_role is not null then
    insert into public.role_assignments (person_id, role, scope_node_id, valid_from, valid_until)
    values (v_person, p_role, p_node, now() - interval '1 day', now() + interval '365 days');
  end if;
  perform set_config('app.seed_intent', '', true);
  return v_uid;
end $$;
revoke all on function selftest.f10_user(text, public.app_role, uuid) from public;

-- The caller's identity without the client role: for a function no client may
-- call directly (import_row_problems is reached only through import_validate
-- and import_advance), asked with the rights of the definer that calls it and
-- the identity of the person it judges.
create or replace function selftest.f10_claims(p_uid uuid)
returns void language plpgsql set search_path = public, pg_temp as $$
begin
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', p_uid::text, true);
end $$;
revoke all on function selftest.f10_claims(uuid) from public;

-- What a call raised: SQLSTATE, DETAIL and MESSAGE, or null when it did not.
create or replace function selftest.f10_raised(p_sql text)
returns jsonb language plpgsql set search_path = public, pg_temp as $$
declare v_state text; v_detail text; v_msg text;
begin
  execute p_sql;
  return null;
exception when others then
  get stacked diagnostics v_state = returned_sqlstate, v_detail = pg_exception_detail, v_msg = message_text;
  return jsonb_build_object('code', v_state, 'detail', v_detail, 'message', v_msg);
end $$;
revoke all on function selftest.f10_raised(text) from public;
grant execute on function selftest.f10_raised(text) to authenticated, anon;

-- The refusal a call gave, as the one string a client branches on:
-- 'PR020:<code>' for a structure refusal, the bare SQLSTATE otherwise, 'ok'
-- when nothing was refused.
create or replace function selftest.f10_code(p_sql text)
returns text language plpgsql set search_path = public, pg_temp as $$
declare e jsonb;
begin
  e := selftest.f10_raised(p_sql);
  if e is null then return 'ok'; end if;
  if e ->> 'code' = 'PR020' then return 'PR020:' || coalesce(e ->> 'detail', ''); end if;
  return (e ->> 'code') || ' ' || left(coalesce(e ->> 'message', ''), 90);
end $$;
revoke all on function selftest.f10_code(text) from public;
grant execute on function selftest.f10_code(text) to authenticated, anon;

-- ═══════════════════════════════════════════ F10-C01, driven from run.ts
-- Two real connections race one school's structure, which a single session
-- cannot do: A deactivates a Tingkat and holds its transaction open, B adds a
-- Kelas under it meanwhile. The rows are COMMITTED so both connections see
-- them, and removed afterwards the way F07's race removes its own.
create or replace function selftest.f10_concurrency_teardown()
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_inst uuid[];
begin
  select coalesce(array_agg(i.id), '{}') into v_inst from public.institutions i where i.slug like 'f10conc-%';
  if cardinality(v_inst) = 0 then return; end if;
  alter table public.role_assignments disable trigger role_assignments_guard;
  alter table public.org_nodes disable trigger org_nodes_no_delete;
  alter table public.academic_periods disable trigger academic_periods_append_only;
  alter table public.institutions disable trigger institutions_no_delete;
  -- BOB-06: every school now carries PINTAR's standard report templates
  alter table public.report_templates disable trigger report_templates_guard;
  delete from public.role_assignments ra where ra.institution_id = any (v_inst);
  delete from public.org_nodes n where n.institution_id = any (v_inst);
  delete from public.academic_periods ap where ap.institution_id = any (v_inst);
  delete from public.report_templates t where t.institution_id = any (v_inst);
  delete from public.institutions i where i.id = any (v_inst);
  alter table public.report_templates enable trigger report_templates_guard;
  alter table public.institutions enable trigger institutions_no_delete;
  alter table public.academic_periods enable trigger academic_periods_append_only;
  alter table public.org_nodes enable trigger org_nodes_no_delete;
  alter table public.role_assignments enable trigger role_assignments_guard;
end $$;
revoke all on function selftest.f10_concurrency_teardown() from public;

-- A school, its admin, one Bagian and one Tingkat built through BOB-01's own
-- functions as that admin, and one of the school's staff to grant to.
-- Returns '<tingkat>|<admin auth uid>|<staff person>'.
-- RESTATED FOR BOB-21 (D-049, a changed requirement): the races granted a role
-- to the oldest person in the database, who has no relationship with this
-- school and is now refused GRANT_NO_SCHOOL_RELATIONSHIP before the race is
-- reached. The grantee is now the school's own staff member (an active role at
-- the school), one person reused across runs.
create or replace function selftest.f10_concurrency_fixture()
returns text language plpgsql security definer set search_path = public, pg_temp as $$
declare v_tag text := substr(md5(random()::text), 1, 8); v_inst uuid; v_uid uuid; v_bag uuid; v_ting uuid; v_staf uuid;
begin
  perform selftest.f10_concurrency_teardown();
  perform set_config('app.seed_intent', 'synthetic', true);
  insert into public.institutions (name, slug, is_synthetic, is_active)
  values ('selftest f10 conc', 'f10conc-' || v_tag, true, true) returning institutions.id into v_inst;
  perform set_config('app.seed_intent', '', true);
  v_uid := selftest.f10_user('f10-conc-adm-' || v_tag || '@local.invalid', 'INSTITUTION_ADMIN', v_inst);
  perform set_config('request.jwt.claims', json_build_object('sub', v_uid, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', v_uid::text, true);
  v_bag  := public.create_bagian(v_inst, 'Bagian Balapan');
  v_ting := public.create_tingkat(v_bag, 'Tingkat Balapan', selftest.f10_tahun(0));
  perform set_config('request.jwt.claims', '', true);
  perform set_config('request.jwt.claim.sub', '', true);
  select p.id into v_staf from public.persons p where p.display_name = 'selftest f10 conc staf' order by p.created_at limit 1;
  if v_staf is null then
    insert into public.persons (display_name) values ('selftest f10 conc staf') returning persons.id into v_staf;
  end if;
  perform set_config('app.seed_intent', 'synthetic', true);
  insert into public.role_assignments (person_id, role, scope_node_id, valid_from, valid_until)
  values (v_staf, 'EDUCATOR', v_inst, now() - interval '1 day', now() + interval '30 days');
  perform set_config('app.seed_intent', '', true);
  return v_ting || '|' || v_uid || '|' || v_staf;
end $$;
revoke all on function selftest.f10_concurrency_fixture() from public;

-- What the race is judged on: the Tingkat is closed and nothing sits under it.
create or replace function selftest.f10_concurrency_verdict(p_tingkat uuid)
returns text language plpgsql security definer set search_path = public, pg_temp as $$
declare v_active boolean; n int;
begin
  select o.is_active into v_active from public.org_nodes o where o.id = p_tingkat;
  select count(*) into n from public.org_nodes o where o.parent_id = p_tingkat;
  if v_active is distinct from false then return 'false|the Tingkat is still active'; end if;
  if n <> 0 then return format('false|%s Kelas sit under the deactivated Tingkat', n); end if;
  return 'true|the Tingkat is deactivated and holds no Kelas';
end $$;
revoke all on function selftest.f10_concurrency_verdict(uuid) from public;

-- ═══════════════════════════════════════════════════════════════ the suite
create or replace function selftest.run_fable10()
returns table (id text, area text, ok boolean, detail text)
language plpgsql set search_path = public, pg_temp as $$
declare
  r record; n int; v_tag text; v_got text; v_sql text; v_err jsonb; v_err2 jsonb; v_prob jsonb;
  v_a uuid; v_b uuid; v_c uuid; v_period uuid; v_period2 uuid; v_ns text;
  v_adm_a uuid; v_adm_b uuid; v_sys uuid; v_dean uuid; v_hod uuid; v_guru uuid; v_murid uuid; v_nobody uuid;
  v_guru2 uuid; v_actor uuid;
  v_bag1 uuid; v_bag2 uuid; v_bag3 uuid; v_t1 uuid; v_t4 uuid; v_t5 uuid; v_t1b uuid;
  v_k1a uuid; v_k1b uuid; v_k4a uuid; v_k4b uuid; v_kx uuid;
  v_jenjang uuid; v_mipa uuid; v_ips uuid; v_tx uuid; v_txi uuid; v_kbx uuid;
  c_fac uuid; c_dep uuid; c_prog uuid; c_coh uuid; c_cls uuid; c_cls2 uuid; c_coh2 uuid; c_cls_off uuid;
  v_enr uuid; v_job uuid; v_out jsonb; v_p uuid;
  v_calls text[]; v_label text;
  v_probs jsonb := '{}'::jsonb; v_fatal text := '';
  m_built int := 0; m_refused int := 0; m_foreign int := 0; m_year int := 0; m_codes int := 0;
  m_place int := 0; m_period int := 0; m_sys int := 0;
  -- BOB-08
  s7_b uuid; s7_t uuid; s7_a uuid; s7_k uuid; s7_b2 uuid; s7_reg uuid; s7_enr uuid; s7_person uuid;
  s9_canon uuid; s10_b uuid; s10_reg uuid; m_inactive int := 0; m_window int := 0; m_canon int := 0; m_direct int := 0;
  -- BOB-20
  v20_t_a uuid; v20_n_a uuid; v20_t_b uuid; v20_n_b uuid; v20_sys uuid; v20_sys_p uuid; v20_murid uuid; v20_murid_p uuid;
  v20_t_a_p uuid; v20_t_b_p uuid; v20_per uuid; v20_seen uuid[]; v20_list uuid[];
  -- BOB-21
  v21_both uuid; v21_murid uuid; v21_murid_p uuid; v21_per uuid; v21_e1 jsonb; v21_e2 jsonb;
begin
  perform selftest.as_owner();
  begin
    ------------------------------------------------------------ the fixture
    v_tag := substr(md5(random()::text), 1, 8);
    perform set_config('app.seed_intent', 'synthetic', true);
    insert into public.institutions (name, slug, is_synthetic, is_active)
    values ('Sekolah F10 ' || v_tag, 'f10a-' || v_tag, true, true) returning institutions.id into v_a;
    insert into public.institutions (name, slug, is_synthetic, is_active)
    values ('Sekolah F10 tetangga ' || v_tag, 'f10b-' || v_tag, true, true) returning institutions.id into v_b;
    insert into public.institutions (name, slug, is_synthetic, is_active)
    values ('Sekolah F10 impor ' || v_tag, 'f10c-' || v_tag, true, true) returning institutions.id into v_c;
    -- school B was built by hand before BOB-01 (D-016): a Jenjang and one
    -- Bagian, and no Reguler under it
    insert into public.org_nodes (institution_id, parent_id, kind, name)
    values (v_b, v_b, 'FACULTY', 'Jenjang') returning org_nodes.id into v_jenjang;
    insert into public.org_nodes (institution_id, parent_id, kind, name)
    values (v_b, v_jenjang, 'DEPARTMENT', 'MIPA') returning org_nodes.id into v_mipa;
    perform set_config('app.seed_intent', '', true);

    v_adm_a  := selftest.f10_user('f10-adm-a-'  || v_tag || '@local.invalid', 'INSTITUTION_ADMIN', v_a);
    v_adm_b  := selftest.f10_user('f10-adm-b-'  || v_tag || '@local.invalid', 'INSTITUTION_ADMIN', v_b);
    -- the platform admin's own scope is another school: SYSTEM_ADMIN is global
    v_sys    := selftest.f10_user('f10-sys-'    || v_tag || '@local.invalid', 'SYSTEM_ADMIN',      v_c);
    v_dean   := selftest.f10_user('f10-dekan-'  || v_tag || '@local.invalid', 'DEAN',              v_a);
    v_nobody := selftest.f10_user('f10-siapa-'  || v_tag || '@local.invalid', null,                null);

    -- ═══════════════════════════════════════════════════════════════════════
    -- F10-S01  AN ADMIN SEKOLAH BUILDS BAGIAN → TINGKAT → KELAS. The hidden
    --          Jenjang is made once per school, the hidden Reguler once per
    --          Bagian, the academic year once per school, and the screen's list
    --          shows the three visible levels with the parent it should show.
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      perform selftest.as_user_uid(v_adm_a);
      v_bag1 := public.create_bagian(v_a, '  Kelas   Rendah ');
      v_bag2 := public.create_bagian(v_a, 'Kelas Tinggi');
      v_t1   := public.create_tingkat(v_bag1, 'Kelas 1', selftest.f10_tahun(0));
      v_t4   := public.create_tingkat(v_bag2, 'Kelas 4', ' 2026 / 2027 ');
      v_k1a  := public.create_kelas(v_t1, '1A', selftest.f10_tahun(0));
      v_k1b  := public.create_kelas(v_t1, '1B');
      v_k4a  := public.create_kelas(v_t4, '4A');
      select count(*) into n from public.school_structure(v_a);
      if n <> 7 then
        v_probs := selftest.f10_note(v_probs, 'F10-S01', format('the list shows %s node(s); 2 Bagian, 2 Tingkat and 3 Kelas were built', n));
      end if;
      for r in select * from public.school_structure(v_a) s loop
        v_got := case r.node_id
          when v_bag1 then 'BAGIAN|' || coalesce(r.parent_id::text, '-') || '|' || coalesce(r.academic_year, '-') || '|' || r.name
          when v_t1   then 'TINGKAT|' || coalesce(r.parent_id::text, '-') || '|' || coalesce(r.academic_year, '-')
          when v_k1a  then 'KELAS|' || coalesce(r.parent_id::text, '-') || '|' || coalesce(r.academic_year, '-')
          else null end;
        if v_got is not null and v_got not in ('BAGIAN|-|-|Kelas Rendah',
                                              'TINGKAT|' || v_bag1 || '|2026/2027',
                                              'KELAS|' || v_t1 || '|2026/2027') then
          v_probs := selftest.f10_note(v_probs, 'F10-S01', 'the list shows ' || v_got);
        end if;
        if r.level not in ('BAGIAN', 'TINGKAT', 'KELAS') then
          v_probs := selftest.f10_note(v_probs, 'F10-S01', 'the list shows a hidden node: ' || coalesce(r.level, 'null'));
        end if;
      end loop;
      perform selftest.as_owner();

      select count(*) into n from public.org_nodes where institution_id = v_a and kind = 'FACULTY';
      if n <> 1 then
        v_probs := selftest.f10_note(v_probs, 'F10-S01', format('%s Jenjang for one school', n));
      end if;
      select count(*) into n from public.org_nodes b
        join public.org_nodes f on f.id = b.parent_id and f.kind = 'FACULTY'
       where b.id in (v_bag1, v_bag2);
      if n <> 2 then
        v_probs := selftest.f10_note(v_probs, 'F10-S01', 'a Bagian does not sit under the Jenjang');
      end if;
      select count(*) into n from public.org_nodes p
       where p.parent_id in (v_bag1, v_bag2) and p.kind = 'PROGRAMME' and p.name = 'Reguler';
      if n <> 2 then
        v_probs := selftest.f10_note(v_probs, 'F10-S01', format('%s Reguler for two Bagian', n));
      end if;
      select count(*) into n from public.org_nodes t
        join public.org_nodes p on p.id = t.parent_id and p.kind = 'PROGRAMME' and p.parent_id = v_bag1
       where t.id = v_t1;
      if n <> 1 then
        v_probs := selftest.f10_note(v_probs, 'F10-S01', 'the Tingkat does not sit under its Bagian''s Reguler');
      end if;
      select count(*) into n from public.academic_periods ap
       where ap.institution_id = v_a and ap.name = selftest.f10_tahun(0)
         and ap.starts_on = make_date(selftest.f10_mulai(0), 7, 1) and ap.ends_on = make_date(selftest.f10_mulai(1), 6, 30);
      select count(*) + 0 into m_built from public.academic_periods ap where ap.institution_id = v_a;
      if n <> 1 or m_built <> 1 then
        v_probs := selftest.f10_note(v_probs, 'F10-S01',
          format('the school holds %s academic period(s); one, 2026/2027 from 1 July to 30 June, was expected', m_built));
      end if;
      select count(*) into n from public.org_nodes k
        join public.org_nodes t on t.id = k.parent_id
       where k.id in (v_k1a, v_k1b) and k.academic_period_id = t.academic_period_id;
      if n <> 2 then
        v_probs := selftest.f10_note(v_probs, 'F10-S01', 'a Kelas does not carry its Tingkat''s year');
      end if;
      select count(*) into n from public.audit_log l
        join public.accounts ac on ac.person_id = l.actor_person_id and ac.auth_user_id = v_adm_a
       where l.institution_id = v_a and l.action like 'structure.%';
      -- 2 Bagian, 2 Reguler, 1 Jenjang, 1 year, 2 Tingkat, 3 Kelas
      if n <> 11 then
        v_probs := selftest.f10_note(v_probs, 'F10-S01', format('%s audit row(s) name the admin; 11 acts were taken', n));
      end if;
      m_built := 7;
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f10_note(v_probs, 'F10-S01', 'the test could not run: ' || left(sqlerrm, 150));
    end;

    -- the people the school's refusals are measured against, placed now that
    -- their places exist
    perform set_config('app.seed_intent', 'synthetic', true);
    begin
      v_hod   := selftest.f10_user('f10-kadep-'  || v_tag || '@local.invalid', 'HEAD_OF_DEPARTMENT', coalesce(v_bag1, v_a));
      v_guru  := selftest.f10_user('f10-guru-'   || v_tag || '@local.invalid', 'EDUCATOR',           coalesce(v_k1a, v_a));
      v_murid := selftest.f10_user('f10-murid-'  || v_tag || '@local.invalid', null,                 null);
      if v_k1b is not null then
        select ap.id into v_period from public.academic_periods ap where ap.institution_id = v_a and ap.name = selftest.f10_tahun(0);
        insert into public.enrollments (person_id, institution_id, academic_period_id, status)
        values ((select a.person_id from public.accounts a where a.auth_user_id = v_murid), v_a, v_period, 'ACTIVE')
        returning enrollments.id into v_enr;
        insert into public.memberships (enrollment_id, node_id, academic_period_id) values (v_enr, v_k1b, v_period);
      end if;
    exception when others then
      v_fatal := 'the people fixture could not be built: ' || sqlerrm;
    end;
    perform set_config('app.seed_intent', '', true);

    -- ═══════════════════════════════════════════════════════════════════════
    -- F10-S02  AN ADMIN PLATFORM DOES THE SAME, for any school, and a school
    --          built by hand before BOB-01 (D-016) keeps the nodes it has.
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      perform selftest.as_user_uid(v_sys);
      v_ips := public.create_bagian(v_b, 'IPS');
      v_tx  := public.create_tingkat(v_mipa, 'Kelas X', selftest.f10_tahun(0));
      -- the same Tingkat name under another Bagian is another Tingkat
      v_txi := public.create_tingkat(v_ips, 'Kelas X', selftest.f10_tahun(0));
      v_kbx := public.create_kelas(v_tx, 'X MIPA 1', selftest.f10_tahun(0));
      perform public.rename_school_node(v_kbx, 'X MIPA 2');
      select count(*) into n from public.school_structure(v_b);
      if n <> 5 then
        v_probs := selftest.f10_note(v_probs, 'F10-S02', format('the platform admin''s list of school B shows %s node(s), expected 5', n));
      end if;
      -- and on school A too, which is not the school they are scoped to
      v_kx := public.create_kelas(v_t4, '4C');
      perform selftest.as_owner();
      select count(*) into n from public.org_nodes where institution_id = v_b and kind = 'FACULTY';
      if n <> 1 then
        v_probs := selftest.f10_note(v_probs, 'F10-S02', format('a school built by hand now has %s Jenjang', n));
      end if;
      select count(*) into n from public.org_nodes where parent_id = v_mipa and kind = 'PROGRAMME';
      if n <> 1 then
        v_probs := selftest.f10_note(v_probs, 'F10-S02',
          format('a Bagian built by hand without a Reguler has %s after its first Tingkat', n));
      end if;
      select count(*) into n from public.org_nodes o where o.id = v_kbx and o.name = 'X MIPA 2';
      if n <> 1 then
        v_probs := selftest.f10_note(v_probs, 'F10-S02', 'the platform admin''s rename did not land');
      end if;
      m_sys := 6;
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f10_note(v_probs, 'F10-S02', 'the test could not run: ' || left(sqlerrm, 150));
    end;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F10-S03  EVERYONE ELSE AT THE SCHOOL IS REFUSED, AND NOTHING IS WRITTEN.
    --          A Dekan, a Kepala departemen at the Bagian, a Guru at the Kelas,
    --          a student placed in it, a person with no role, and nobody.
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      if v_bag1 is null then raise exception 'F10-S01 built nothing to refuse on'; end if;
      v_calls := array[
        format('select * from public.school_structure(%L::uuid)', v_a),
        format('select public.create_bagian(%L::uuid, %L)', v_a, 'Bagian Liar'),
        format('select public.create_tingkat(%L::uuid, %L, %L)', v_bag1, 'Tingkat Liar', selftest.f10_tahun(0)),
        format('select public.create_kelas(%L::uuid, %L)', v_t1, 'Kelas Liar'),
        format('select public.rename_school_node(%L::uuid, %L)', v_k1a, 'Liar'),
        format('select public.deactivate_school_node(%L::uuid, %L)', v_k1b, 'selftest: D-093')];
      for r in select * from unnest(array['a DEAN at the school', 'a HEAD_OF_DEPARTMENT at the Bagian',
                                          'an EDUCATOR at the Kelas', 'a student placed in another Kelas',
                                          'a person with no role'],
                                    array[v_dean, v_hod, v_guru, v_murid, v_nobody]) as t(label, uid) loop
        foreach v_sql in array v_calls loop
          perform selftest.as_user_uid(r.uid);
          v_got := selftest.f10_code(v_sql);
          perform selftest.as_owner();
          if v_got = 'PR020:STRUCTURE_NOT_ALLOWED' then m_refused := m_refused + 1;
          else
            v_probs := selftest.f10_note(v_probs, 'F10-S03',
              format('%s: %s answered %s', r.label, split_part(split_part(v_sql, 'public.', 2), '(', 1),
                     case when v_got = 'ok' then 'ok -- it was accepted' else v_got end));
          end if;
        end loop;
      end loop;
      -- an anonymous caller cannot reach any of them
      foreach v_sql in array v_calls loop
        perform selftest.as_anon();
        v_got := selftest.f10_code(v_sql);
        perform selftest.as_owner();
        if v_got like '42501%' or v_got = 'PR020:STRUCTURE_NOT_ALLOWED' then m_refused := m_refused + 1;
        else
          v_probs := selftest.f10_note(v_probs, 'F10-S03',
            format('an anonymous caller: %s answered %s', split_part(split_part(v_sql, 'public.', 2), '(', 1), v_got));
        end if;
      end loop;
      select count(*) into n from public.org_nodes where institution_id = v_a and name like '%Liar%';
      if n <> 0 then
        v_probs := selftest.f10_note(v_probs, 'F10-S03', format('%s node(s) were written by a refused caller', n));
      end if;
      select count(*) into n from public.org_nodes o where o.id in (v_k1a, v_k1b) and o.is_active and o.name in ('1A', '1B');
      if n <> 2 then
        v_probs := selftest.f10_note(v_probs, 'F10-S03', 'a refused caller renamed or deactivated a Kelas');
      end if;
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f10_note(v_probs, 'F10-S03', 'the test could not run: ' || left(sqlerrm, 150));
    end;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F10-S04  ANOTHER SCHOOL'S NODES ARE REFUSED, AND AN UNKNOWN NODE ANSWERS
    --          EXACTLY AS A FORBIDDEN ONE DOES (no existence oracle).
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      if v_bag1 is null or v_ips is null then raise exception 'F10-S01/S02 built nothing to refuse on'; end if;
      for r in select * from unnest(
          array[v_adm_b, v_adm_b, v_adm_b, v_adm_b, v_adm_b, v_adm_b, v_adm_a, v_adm_a, v_adm_a, v_adm_a],
          array[format('select * from public.school_structure(%L::uuid)', v_a),
                format('select public.create_bagian(%L::uuid, %L)', v_a, 'Asing'),
                format('select public.create_tingkat(%L::uuid, %L, %L)', v_bag1, 'Asing', selftest.f10_tahun(0)),
                format('select public.create_kelas(%L::uuid, %L)', v_t1, 'Asing'),
                format('select public.rename_school_node(%L::uuid, %L)', v_bag1, 'Asing'),
                format('select public.deactivate_school_node(%L::uuid, %L)', v_k1b, 'selftest: D-093'),
                format('select * from public.school_structure(%L::uuid)', v_b),
                format('select public.create_tingkat(%L::uuid, %L, %L)', v_ips, 'Asing', selftest.f10_tahun(0)),
                format('select public.rename_school_node(%L::uuid, %L)', v_kbx, 'Asing'),
                format('select public.deactivate_school_node(%L::uuid, %L)', v_txi, 'selftest: D-093')]) as t(uid, q) loop
        perform selftest.as_user_uid(r.uid);
        v_got := selftest.f10_code(r.q);
        perform selftest.as_owner();
        if v_got = 'PR020:STRUCTURE_NOT_ALLOWED' then m_foreign := m_foreign + 1;
        else
          v_probs := selftest.f10_note(v_probs, 'F10-S04',
            format('another school''s admin: %s answered %s', split_part(split_part(r.q, 'public.', 2), '(', 1),
                   case when v_got = 'ok' then 'ok -- it was accepted' else v_got end));
        end if;
      end loop;
      -- a foreign node and a node that does not exist are indistinguishable
      perform selftest.as_user_uid(v_adm_a);
      v_err  := selftest.f10_raised(format('select public.create_kelas(%L::uuid, %L)', v_txi, 'Oracle'));
      v_err2 := selftest.f10_raised(format('select public.create_kelas(%L::uuid, %L)', gen_random_uuid(), 'Oracle'));
      perform selftest.as_owner();
      if v_err is null or v_err2 is null or v_err is distinct from v_err2 then
        v_probs := selftest.f10_note(v_probs, 'F10-S04',
          format('a foreign node and an unknown node answer differently: %s / %s',
                 coalesce(v_err::text, 'accepted'), coalesce(v_err2::text, 'accepted')));
      end if;
      select count(*) into n from public.org_nodes where institution_id in (v_a, v_b) and name in ('Asing', 'Oracle');
      if n <> 0 then
        v_probs := selftest.f10_note(v_probs, 'F10-S04', format('%s node(s) were written across schools', n));
      end if;
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f10_note(v_probs, 'F10-S04', 'the test could not run: ' || left(sqlerrm, 150));
    end;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F10-S05  A KELAS SITS UNDER A TINGKAT OF THE SAME YEAR.
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      if v_t1 is null then raise exception 'F10-S01 built no Tingkat'; end if;
      perform selftest.as_user_uid(v_adm_a);
      for r in select * from unnest(
          array[format('select public.create_kelas(%L::uuid, %L, %L)', v_t1, '1C', selftest.f10_tahun(1)),
                format('select public.create_kelas(%L::uuid, %L, %L)', v_t1, '1C', selftest.f10_tahun(-1))],
          array['PR020:STRUCTURE_YEAR_MISMATCH', 'PR020:STRUCTURE_YEAR_MISMATCH']) as t(q, want) loop
        v_got := selftest.f10_code(r.q);
        if v_got = r.want then m_year := m_year + 1;
        else v_probs := selftest.f10_note(v_probs, 'F10-S05',
               format('a Kelas of another year under a 2026/2027 Tingkat answered %s', v_got)); end if;
      end loop;
      foreach v_label in array array['2026', '2026/2028', '26/27', '2026-2027', 'abcd/efgh', '', '1999/2000'] loop
        v_got := selftest.f10_code(format('select public.create_tingkat(%L::uuid, %L, %L)', v_bag1, 'Kelas 2', v_label));
        if v_got = 'PR020:STRUCTURE_YEAR_INVALID' then m_year := m_year + 1;
        else v_probs := selftest.f10_note(v_probs, 'F10-S05', format('the year "%s" answered %s', v_label, v_got)); end if;
      end loop;
      v_got := selftest.f10_code(format('select public.create_tingkat(%L::uuid, %L, null)', v_bag1, 'Kelas 2'));
      if v_got = 'PR020:STRUCTURE_YEAR_INVALID' then m_year := m_year + 1;
      else v_probs := selftest.f10_note(v_probs, 'F10-S05', 'a Tingkat without a year answered ' || v_got); end if;
      v_got := selftest.f10_code(format('select public.create_kelas(%L::uuid, %L, %L)', v_t1, '1C', 'bukan tahun'));
      if v_got = 'PR020:STRUCTURE_YEAR_INVALID' then m_year := m_year + 1;
      else v_probs := selftest.f10_note(v_probs, 'F10-S05', 'a Kelas with a malformed year answered ' || v_got); end if;

      -- the same Tingkat and Kelas names in the next year are the next year's
      v_t1b := public.create_tingkat(v_bag1, 'Kelas 1', selftest.f10_tahun(1));
      v_p   := public.create_kelas(v_t1b, '1A', selftest.f10_tahun(1));
      perform selftest.as_owner();
      select count(*) into n from public.org_nodes k
        join public.academic_periods ap on ap.id = k.academic_period_id
       where k.id = v_p and ap.name = selftest.f10_tahun(1) and ap.starts_on = make_date(selftest.f10_mulai(1), 7, 1);
      if n <> 1 then
        v_probs := selftest.f10_note(v_probs, 'F10-S05', 'the next year''s Kelas does not carry the next year');
      end if;
      select count(*) into n from public.org_nodes where institution_id = v_a and name = '1C';
      if n <> 0 then
        v_probs := selftest.f10_note(v_probs, 'F10-S05', 'a Kelas of the wrong year was written');
      end if;
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f10_note(v_probs, 'F10-S05', 'the test could not run: ' || left(sqlerrm, 150));
    end;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F10-S06  EVERY OTHER REFUSAL CARRIES ITS OWN STABLE CODE, and rename and
    --          deactivate do what they say and nothing more.
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      if v_k4a is null then raise exception 'F10-S01 built no Kelas'; end if;
      -- a Kelas with a teacher and no students, for STRUCTURE_HAS_STAFF
      perform selftest.as_user_uid(v_adm_a);
      v_k4b := public.create_kelas(v_t4, '4B');
      perform selftest.as_owner();
      v_guru2 := selftest.f10_user('f10-guru2-' || v_tag || '@local.invalid', 'EDUCATOR', v_k4b);
      -- an inactive Tingkat and an inactive Bagian, for STRUCTURE_PARENT_INACTIVE
      perform selftest.as_user_uid(v_adm_a);
      v_t5   := public.create_tingkat(v_bag2, 'Kelas 5', selftest.f10_tahun(0));
      perform public.deactivate_school_node(v_t5, 'selftest: D-093');
      v_bag3 := public.create_bagian(v_a, 'Sementara');
      perform public.deactivate_school_node(v_bag3, 'selftest: D-093');
      -- the hidden nodes, read as the owner rather than through the admin's RLS
      perform selftest.as_owner();
      select l.id into v_jenjang from public.org_nodes l where l.institution_id = v_a and l.kind = 'FACULTY' limit 1;
      select p.id into c_prog from public.org_nodes p where p.parent_id = v_bag1 and p.kind = 'PROGRAMME' limit 1;
      perform selftest.as_user_uid(v_adm_a);

      for r in select * from unnest(
          array[
            format('select public.create_bagian(%L::uuid, %L)', v_a, ''),
            format('select public.create_bagian(%L::uuid, %L)', v_a, '   '),
            format('select public.create_bagian(%L::uuid, %L)', v_a, repeat('x', 81)),
            format('select public.create_bagian(%L::uuid, %L)', v_a, 'a' || chr(1) || 'b'),
            format('select public.create_kelas(%L::uuid, null)', v_t1),
            format('select public.create_bagian(%L::uuid, %L)', v_a, 'kelas rendah'),
            format('select public.create_tingkat(%L::uuid, %L, %L)', v_bag1, 'KELAS 1', selftest.f10_tahun(0)),
            format('select public.create_kelas(%L::uuid, %L)', v_t4, '1a'),
            format('select public.rename_school_node(%L::uuid, %L)', v_k1b, '1A'),
            format('select public.rename_school_node(%L::uuid, %L)', v_bag2, 'Kelas Rendah'),
            format('select public.create_tingkat(%L::uuid, %L, %L)', v_t1, 'Anak', selftest.f10_tahun(0)),
            format('select public.create_kelas(%L::uuid, %L)', v_bag1, 'Anak'),
            format('select public.create_bagian(%L::uuid, %L)', v_bag1, 'Anak'),
            format('select public.create_kelas(%L::uuid, %L)', v_t5, '5A'),
            format('select public.create_tingkat(%L::uuid, %L, %L)', v_bag3, 'Kelas 9', selftest.f10_tahun(0)),
            format('select public.rename_school_node(%L::uuid, %L)', v_a, 'Sekolah Baru'),
            format('select public.rename_school_node(%L::uuid, %L)', v_jenjang, 'Terlihat'),
            format('select public.deactivate_school_node(%L::uuid, %L)', c_prog, 'selftest: D-093'),
            format('select public.deactivate_school_node(%L::uuid, %L)', v_t1, 'selftest: D-093'),
            format('select public.deactivate_school_node(%L::uuid, %L)', v_bag1, 'selftest: D-093'),
            format('select public.deactivate_school_node(%L::uuid, %L)', v_k1b, 'selftest: D-093'),
            format('select public.deactivate_school_node(%L::uuid, %L)', v_k4b, 'selftest: D-093')],
          array[
            'STRUCTURE_NAME_INVALID', 'STRUCTURE_NAME_INVALID', 'STRUCTURE_NAME_INVALID', 'STRUCTURE_NAME_INVALID',
            'STRUCTURE_NAME_INVALID',
            'STRUCTURE_NAME_TAKEN', 'STRUCTURE_NAME_TAKEN', 'STRUCTURE_NAME_TAKEN', 'STRUCTURE_NAME_TAKEN',
            'STRUCTURE_NAME_TAKEN',
            'STRUCTURE_PARENT_INVALID', 'STRUCTURE_PARENT_INVALID', 'STRUCTURE_PARENT_INVALID',
            'STRUCTURE_PARENT_INACTIVE', 'STRUCTURE_PARENT_INACTIVE',
            'STRUCTURE_NODE_INVALID', 'STRUCTURE_NODE_INVALID', 'STRUCTURE_NODE_INVALID',
            'STRUCTURE_HAS_ACTIVE_CHILDREN', 'STRUCTURE_HAS_ACTIVE_CHILDREN',
            'STRUCTURE_HAS_MEMBERS', 'STRUCTURE_HAS_STAFF'],
          array[
            'an empty name', 'a blank name', 'an 81-character name', 'a name with a control character',
            'a missing name',
            'a Bagian name in another case', 'a Tingkat name in the same Bagian and year',
            'a Kelas name used in the same year elsewhere in the school', 'a rename onto a sibling''s name',
            'a Bagian renamed onto another Bagian',
            'a Tingkat under a Tingkat', 'a Kelas under a Bagian', 'a Bagian under a Bagian',
            'a Kelas under a deactivated Tingkat', 'a Tingkat under a deactivated Bagian',
            'renaming the school', 'renaming the hidden Jenjang', 'deactivating a hidden Reguler',
            'deactivating a Tingkat with active Kelas', 'deactivating a Bagian with active Tingkat',
            'deactivating a Kelas with a student placed', 'deactivating a Kelas with a teacher scoped to it']
        ) as t(q, want, label) loop
        v_got := selftest.f10_code(r.q);
        if v_got = 'PR020:' || r.want then m_codes := m_codes + 1;
        else
          v_probs := selftest.f10_note(v_probs, 'F10-S06',
            format('%s answered %s, not %s', r.label, case when v_got = 'ok' then 'ok -- it was accepted' else v_got end, r.want));
        end if;
      end loop;

      -- what does succeed: a rename (and a same-name rename is a no-op), a
      -- repeated deactivation, and the reuse of a deactivated node's name
      perform public.rename_school_node(v_k1b, '1 B');
      perform public.rename_school_node(v_k1b, '1 B');
      perform public.deactivate_school_node(v_t5, 'selftest: D-093');
      v_p := public.create_tingkat(v_bag2, 'Kelas 5', selftest.f10_tahun(0));
      perform selftest.as_owner();
      select count(*) into n from public.org_nodes o where o.id = v_k1b and o.name = '1 B';
      if n <> 1 then v_probs := selftest.f10_note(v_probs, 'F10-S06', 'the rename did not land'); end if;
      select count(*) into n from public.audit_log l
       where l.action = 'structure.renamed' and l.target_id = v_k1b::text
         and l.summary ->> 'from' = '1B' and l.summary ->> 'to' = '1 B';
      if n <> 1 then
        v_probs := selftest.f10_note(v_probs, 'F10-S06', format('%s audit row(s) for one rename, from 1B to 1 B', n));
      end if;
      select count(*) into n from public.audit_log l where l.action = 'structure.deactivated' and l.target_id = v_t5::text;
      if n <> 1 then
        v_probs := selftest.f10_note(v_probs, 'F10-S06', format('%s audit row(s) for one deactivation repeated', n));
      end if;
      select count(*) into n from public.org_nodes p where p.parent_id = v_bag3 and p.is_active;
      if n <> 0 then
        v_probs := selftest.f10_note(v_probs, 'F10-S06', 'a deactivated Bagian left its hidden Reguler active');
      end if;
      select count(*) into n from public.org_nodes o where o.id in (v_t1, v_bag1, v_k1a, v_k1b, v_k4b) and o.is_active;
      if n <> 5 then
        v_probs := selftest.f10_note(v_probs, 'F10-S06', 'a refused deactivation deactivated something');
      end if;
      if v_p is null then
        v_probs := selftest.f10_note(v_probs, 'F10-S06', 'a deactivated Tingkat''s name could not be reused');
      end if;
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f10_note(v_probs, 'F10-S06', 'the test could not run: ' || left(sqlerrm, 150));
    end;

    ------------------------------------------------ the intake fixture (M5a)
    -- School C's places are built directly, not through BOB-01's functions, so
    -- that these two tests go red for the intake rule itself on a database
    -- that lacks it. Two academic years, and a third, newest, that no place
    -- carries: the intake used to enrol into whichever period was made last.
    perform set_config('app.seed_intent', 'synthetic', true);
    begin
      insert into public.academic_periods (institution_id, name, starts_on, ends_on)
      values (v_c, selftest.f10_tahun(0), make_date(selftest.f10_mulai(0), 7, 1), make_date(selftest.f10_mulai(1), 6, 30)) returning academic_periods.id into v_period;
      insert into public.academic_periods (institution_id, name, starts_on, ends_on)
      values (v_c, selftest.f10_tahun(1), make_date(selftest.f10_mulai(1), 7, 1), make_date(selftest.f10_mulai(2), 6, 30)) returning academic_periods.id into v_period2;
      insert into public.academic_periods (institution_id, name, starts_on, ends_on, created_at)
      values (v_c, '2030/2031', date '2030-07-01', date '2031-06-30', now() + interval '1 hour');
      insert into public.org_nodes (institution_id, parent_id, kind, name)
      values (v_c, v_c, 'FACULTY', 'Jenjang') returning org_nodes.id into c_fac;
      insert into public.org_nodes (institution_id, parent_id, kind, name)
      values (v_c, c_fac, 'DEPARTMENT', 'Bagian C') returning org_nodes.id into c_dep;
      insert into public.org_nodes (institution_id, parent_id, kind, name)
      values (v_c, c_dep, 'PROGRAMME', 'Reguler') returning org_nodes.id into c_prog;
      insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
      values (v_c, c_prog, 'COHORT', 'Kelas 7', v_period) returning org_nodes.id into c_coh;
      insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
      values (v_c, c_coh, 'CLASS', '7A', v_period) returning org_nodes.id into c_cls;
      insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
      values (v_c, c_prog, 'COHORT', 'Kelas 8', v_period2) returning org_nodes.id into c_coh2;
      insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
      values (v_c, c_coh2, 'CLASS', '8A', v_period2) returning org_nodes.id into c_cls2;
      insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id, is_active)
      values (v_c, c_coh, 'CLASS', '7Z', v_period, false) returning org_nodes.id into c_cls_off;
      for n in 1..50 loop
        v_ns := upper(substr(md5(v_tag || n::text), 1, 3));
        exit when not exists (select 1 from public.institutions x where upper(x.namespace) = v_ns);
      end loop;
      update public.institutions set namespace = v_ns where institutions.id = v_c;
    exception when others then
      v_fatal := 'the intake fixture could not be built: ' || sqlerrm;
    end;
    perform set_config('app.seed_intent', '', true);
    v_actor := selftest.f10_user('f10-adm-c-' || v_tag || '@local.invalid', 'INSTITUTION_ADMIN', v_c);

    -- ═══════════════════════════════════════════════════════════════════════
    -- F10-M01  THE INTAKE PLACES A LEARNER ONLY IN AN ACTIVE KELAS OR TINGKAT,
    --          AND SAYS SO BEFORE ANYTHING IS PROVISIONED (M5a).
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      perform selftest.f10_claims(v_actor);
      -- RESTATED FOR BOB-10 (M5b, interim; a changed requirement, recorded on
      -- the board): the last row, an EDUCATOR scoped to a Bagian, was accepted
      -- here and then failed at recording. A staff row is now refused at
      -- validation with its own phrase, and three more staff rows join it --
      -- among them a teacher placed in a Kelas, the row that turned a teacher
      -- into a student of the class. The learner rows are unchanged.
      for r in select * from unnest(
          array[c_dep, c_dep, c_fac, c_prog, v_c, c_cls_off, c_cls, c_coh, c_cls, c_dep, c_cls, c_dep, c_dep],
          array[null, 'STUDENT', null, null, null, null, null, null, 'STUDENT', 'EDUCATOR', 'EDUCATOR',
                'HEAD_OF_DEPARTMENT', 'DEAN'],
          array[true, true, true, true, true, true, false, false, false, true, true, true, true],
          array['a learner placed in a Bagian', 'a STUDENT placed in a Bagian', 'a learner placed in the Jenjang',
                'a learner placed in a Reguler', 'a learner placed in the school itself',
                'a learner placed in a deactivated Kelas', 'a learner placed in a Kelas',
                'a learner placed in a Tingkat', 'a STUDENT placed in a Kelas', 'an EDUCATOR scoped to a Bagian',
                'an EDUCATOR placed in a Kelas', 'a HEAD_OF_DEPARTMENT scoped to a Bagian', 'a DEAN scoped to a Bagian']
        ) as t(node, role, refuse, label) loop
        v_prob := public.import_row_problems(v_c,
          jsonb_strip_nulls(jsonb_build_object('display_name', 'Murid Uji', 'node_id', r.node, 'role', r.role)));
        n := (select count(*) from jsonb_array_elements_text(v_prob) x
               where x = case when r.role in ('EDUCATOR', 'HEAD_OF_DEPARTMENT', 'DEAN')
                              then 'a staff row is not recorded by the bulk intake yet'
                              else 'a learner is placed in an active Kelas or Tingkat' end);
        if r.refuse and n = 1 then m_place := m_place + 1;
        elsif not r.refuse and jsonb_array_length(v_prob) = 0 then m_place := m_place + 1;
        else
          v_probs := selftest.f10_note(v_probs, 'F10-M01',
            format('%s was %s: %s', r.label, case when r.refuse then 'accepted' else 'refused' end, v_prob::text));
        end if;
      end loop;
      -- and the intake's own check says it against the row, before anything
      -- exists, to the administrator through the endpoint they call
      perform selftest.as_user_uid(v_actor);
      v_job := public.import_open(v_c, jsonb_build_array(
        jsonb_build_object('display_name', 'Murid Salah Tempat ' || v_tag, 'node_id', c_dep)));
      v_out := public.import_validate(v_job);
      if coalesce((v_out ->> 'ok')::boolean, true)
         or not ((v_out -> 'rows' -> 0 -> 'problems') ? 'a learner is placed in an active Kelas or Tingkat') then
        v_probs := selftest.f10_note(v_probs, 'F10-M01',
          'the intake''s check does not tell the administrator why the row was refused: ' || coalesce(v_out::text, 'nothing'));
      end if;
      -- BOB-10: and a teacher placed in a Kelas is refused there too, as staff
      v_job := public.import_open(v_c, jsonb_build_array(
        jsonb_build_object('display_name', 'Guru Salah Jalur ' || v_tag, 'node_id', c_cls, 'role', 'EDUCATOR')));
      v_out := public.import_validate(v_job);
      if coalesce((v_out ->> 'ok')::boolean, true)
         or not ((v_out -> 'rows' -> 0 -> 'problems') ? 'a staff row is not recorded by the bulk intake yet') then
        v_probs := selftest.f10_note(v_probs, 'F10-M01',
          'the intake''s check does not refuse a teacher placed in a Kelas as staff: ' || coalesce(v_out::text, 'nothing'));
      end if;
      perform selftest.as_owner();
      select count(*) into n from public.persons
       where display_name in ('Murid Salah Tempat ' || v_tag, 'Guru Salah Jalur ' || v_tag);
      if n <> 0 then
        v_probs := selftest.f10_note(v_probs, 'F10-M01', 'a refused row provisioned a person');
      end if;
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f10_note(v_probs, 'F10-M01', 'the test could not run: ' || left(sqlerrm, 150));
    end;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F10-M02  THE INTAKE ENROLS A LEARNER INTO THE PLACE'S OWN YEAR (M5a). It
    --          took the school's newest period, and a membership must match its
    --          node's, so once a school had two years every learner placed in
    --          the other year's Kelas failed at provisioning.
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      perform selftest.as_user_uid(v_actor);
      v_job := public.import_open(v_c, jsonb_build_array(
        jsonb_build_object('display_name', 'Murid Tahun Ini ' || v_tag, 'node_id', c_cls),
        jsonb_build_object('display_name', 'Murid Tahun Depan ' || v_tag, 'node_id', c_cls2, 'role', 'STUDENT'),
        jsonb_build_object('display_name', 'Murid Tingkat ' || v_tag, 'node_id', c_coh)));
      perform public.import_validate(v_job);
      perform public.import_confirm(v_job);
      v_out := public.import_advance(v_job, 10);
      perform selftest.as_owner();
      if (v_out ->> 'state') <> 'COMPLETED' or (v_out ->> 'completed')::int <> 3 then
        v_probs := selftest.f10_note(v_probs, 'F10-M02',
          format('a three-learner import ended %s with %s completed: %s', v_out ->> 'state', v_out ->> 'completed',
                 (select string_agg(ir.failure_reason, '; ') from public.import_rows ir where ir.job_id = v_job)));
      end if;
      for r in select * from unnest(array['Murid Tahun Ini ', 'Murid Tahun Depan ', 'Murid Tingkat '],
                                    array[c_cls, c_cls2, c_coh], array[v_period, v_period2, v_period]) as t(nm, node, per) loop
        select count(*) into n from public.persons p
          join public.enrollments e on e.person_id = p.id and e.academic_period_id = r.per
          join public.memberships m on m.enrollment_id = e.id and m.node_id = r.node and m.academic_period_id = r.per
         where p.display_name = r.nm || v_tag;
        if n = 1 then m_period := m_period + 1;
        else
          v_probs := selftest.f10_note(v_probs, 'F10-M02', format('%s was not enrolled in its place''s own year', rtrim(r.nm)));
        end if;
      end loop;
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f10_note(v_probs, 'F10-M02', 'the test could not run: ' || left(sqlerrm, 150));
    end;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F10-S07  BOB-08 (b): NOBODY IS PLACED OR GRANTED A ROLE IN A
    --          DEACTIVATED PLACE -- a grant, a membership, a rollover into it
    --          and an enrolment in a deactivated programme are each refused
    --          PR020 STRUCTURE_PLACE_INACTIVE, by the one rule on the tables
    --          every writer (the intake, grant_role, period_rollover,
    --          transfer_execute) goes through; an active place still takes them.
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      perform selftest.f10_claims(v_adm_a);
      s7_b := public.create_bagian(v_a, 'Tutup ' || v_tag);
      s7_t := public.create_tingkat(s7_b, 'Tutup T', selftest.f10_tahun(0));
      s7_a := public.create_kelas(s7_t, 'Tutup A', selftest.f10_tahun(0));
      s7_k := public.create_kelas(s7_t, 'Tutup K', selftest.f10_tahun(0));
      perform public.deactivate_school_node(s7_k, 'selftest: D-093');
      s7_b2 := public.create_bagian(v_a, 'Tutup Dua ' || v_tag);
      select n.id into s7_reg from public.org_nodes n where n.parent_id = s7_b2 and n.kind = 'PROGRAMME';
      perform public.deactivate_school_node(s7_b2, 'selftest: D-093');
      perform selftest.as_owner();
      select a.person_id into s7_person from public.accounts a where a.auth_user_id = v_nobody;
      insert into public.enrollments (person_id, institution_id, academic_period_id, status)
      select s7_person, v_a, n.academic_period_id, 'ACTIVE' from public.org_nodes n where n.id = s7_a
      returning enrollments.id into s7_enr;
      insert into public.memberships (enrollment_id, node_id, academic_period_id)
      select s7_enr, s7_a, n.academic_period_id from public.org_nodes n where n.id = s7_a;

      perform selftest.f10_claims(v_adm_a);
      for r in select * from (values
          ('a role grant', format('select public.grant_role(%L::uuid, %L, %L::uuid, now() + interval ''30 days'')', s7_person, 'EDUCATOR', s7_k)),
          ('a membership', format('insert into public.memberships (enrollment_id, node_id, academic_period_id) select %L::uuid, %L::uuid, n.academic_period_id from public.org_nodes n where n.id = %L::uuid', s7_enr, s7_k, s7_k)),
          ('a rollover into it', format('select public.period_rollover(%L::uuid, n.academic_period_id, n.academic_period_id, jsonb_build_array(jsonb_build_object(%L, %L, %L, %L))) from public.org_nodes n where n.id = %L::uuid',
                                        v_a, 'from_node', s7_a, 'to_node', s7_k, s7_a)),
          ('an enrolment in a deactivated programme', format('insert into public.enrollments (person_id, institution_id, academic_period_id, programme_id, status) select %L::uuid, %L::uuid, n.academic_period_id, %L::uuid, %L from public.org_nodes n where n.id = %L::uuid',
                                        s7_person, v_a, s7_reg, 'PENDING', s7_a))
        ) as t(what, sql)
      loop
        v_got := selftest.f10_code(r.sql);
        if v_got = 'PR020:STRUCTURE_PLACE_INACTIVE' then m_inactive := m_inactive + 1;
        else v_probs := selftest.f10_note(v_probs, 'F10-S07', format('%s into a deactivated place answered %s', r.what, v_got));
        end if;
      end loop;
      v_got := selftest.f10_code(format('select public.grant_role(%L::uuid, %L, %L::uuid, now() + interval ''30 days'')', s7_person, 'EDUCATOR', s7_a));
      if v_got <> 'ok' then v_probs := selftest.f10_note(v_probs, 'F10-S07', 'a grant into an active Kelas answered ' || v_got); end if;
      perform selftest.as_owner();
      select count(*) into n from public.memberships m where m.node_id = s7_k;
      if n <> 0 then v_probs := selftest.f10_note(v_probs, 'F10-S07', format('%s membership(s) in the deactivated Kelas', n)); end if;
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f10_note(v_probs, 'F10-S07', 'the test could not run: ' || left(sqlerrm, 150));
    end;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F10-S08  BOB-08 (c): AN ACADEMIC YEAR NEAR NOW. The year before the
    --          current one, the current one and the one after are accepted;
    --          two either side are STRUCTURE_YEAR_OUT_OF_RANGE, and no period
    --          is made for them.
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      perform selftest.f10_claims(v_adm_a);
      for r in select * from unnest(array[-2, -1, 0, 1, 2]) as t(k) loop
        v_got := selftest.f10_code(format('select public.create_tingkat(%L::uuid, %L, %L)', v_bag1, 'Jendela ' || r.k, selftest.f10_tahun(r.k)));
        if (abs(r.k) <= 1 and v_got = 'ok') or (abs(r.k) = 2 and v_got = 'PR020:STRUCTURE_YEAR_OUT_OF_RANGE') then
          m_window := m_window + 1;
        else
          v_probs := selftest.f10_note(v_probs, 'F10-S08', format('the year %s answered %s', selftest.f10_tahun(r.k), v_got));
        end if;
      end loop;
      perform selftest.as_owner();
      select count(*) into n from public.academic_periods ap
       where ap.institution_id = v_a and ap.name in (selftest.f10_tahun(-2), selftest.f10_tahun(2));
      if n <> 0 then v_probs := selftest.f10_note(v_probs, 'F10-S08', format('%s period(s) were made for a year out of range', n)); end if;
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f10_note(v_probs, 'F10-S08', 'the test could not run: ' || left(sqlerrm, 150));
    end;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F10-S09  BOB-08 (f): THE NATIONAL LIBRARY IS NOT A SCHOOL. A platform
    --          administrator's structure calls on the canonical tenant are
    --          STRUCTURE_NOT_A_SCHOOL, and nothing is built there.
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      select i.id into s9_canon from public.institutions i where i.tenant_kind = 'PLATFORM_CANONICAL' limit 1;
      if s9_canon is null then raise exception 'no canonical tenant in the seed'; end if;
      select count(*) into n from public.org_nodes o where o.institution_id = s9_canon;
      perform selftest.f10_claims(v_sys);
      for r in select * from unnest(array[
          format('select public.create_bagian(%L::uuid, %L)', s9_canon, 'Bagian Pustaka'),
          format('select count(*) from public.school_structure(%L::uuid)', s9_canon)]) as t(sql) loop
        v_got := selftest.f10_code(r.sql);
        if v_got = 'PR020:STRUCTURE_NOT_A_SCHOOL' then m_canon := m_canon + 1;
        else v_probs := selftest.f10_note(v_probs, 'F10-S09', format('%s answered %s', left(r.sql, 40), v_got));
        end if;
      end loop;
      perform selftest.as_owner();
      if (select count(*) from public.org_nodes o where o.institution_id = s9_canon) <> n then
        v_probs := selftest.f10_note(v_probs, 'F10-S09', 'a node was built in the canonical library');
      end if;
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f10_note(v_probs, 'F10-S09', 'the test could not run: ' || left(sqlerrm, 150));
    end;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F10-S10  BOB-08 (a, e): ONE WAY IN, AND STAFF BELOW A BAGIAN. The
    --          school's admin, signed in, writes neither org_nodes nor
    --          academic_periods directly (42501); and a Bagian with a role
    --          scoped below it, at its hidden Reguler, is STRUCTURE_HAS_STAFF.
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      perform selftest.f10_claims(v_adm_a);
      set local role authenticated;
      for r in select * from unnest(array[
          format('insert into public.org_nodes (institution_id, parent_id, kind, name) values (%L::uuid, %L::uuid, %L, %L)', v_a, v_bag1, 'PROGRAMME', 'Langsung'),
          format('update public.org_nodes set name = %L where id = %L::uuid', 'Langsung', v_bag1),
          format('insert into public.academic_periods (institution_id, name, starts_on, ends_on) values (%L::uuid, %L, current_date, current_date + 1)', v_a, 'Langsung'),
          format('update public.academic_periods set name = name where institution_id = %L::uuid', v_a)]) as t(sql) loop
        v_got := selftest.f10_code(r.sql);
        if v_got like '42501%' then m_direct := m_direct + 1;
        else v_probs := selftest.f10_note(v_probs, 'F10-S10', format('the admin''s direct write answered %s: %s', v_got, left(r.sql, 60)));
        end if;
      end loop;
      reset role;
      perform selftest.f10_claims(v_adm_a);
      s10_b := public.create_bagian(v_a, 'Berstaf ' || v_tag);
      select n.id into s10_reg from public.org_nodes n where n.parent_id = s10_b and n.kind = 'PROGRAMME';
      perform selftest.as_owner();
      select a.person_id into s7_person from public.accounts a where a.auth_user_id = v_nobody;
      perform set_config('app.seed_intent', 'synthetic', true);
      insert into public.role_assignments (person_id, role, scope_node_id, valid_until)
      values (s7_person, 'EDUCATOR', s10_reg, now() + interval '30 days');
      perform set_config('app.seed_intent', '', true);
      perform selftest.f10_claims(v_adm_a);
      v_got := selftest.f10_code(format('select public.deactivate_school_node(%L::uuid, %L)', s10_b, 'selftest: D-093'));
      if v_got <> 'PR020:STRUCTURE_HAS_STAFF' then
        v_probs := selftest.f10_note(v_probs, 'F10-S10', 'a Bagian with staff below it answered ' || v_got);
      end if;
      perform selftest.as_owner();
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f10_note(v_probs, 'F10-S10', 'the test could not run: ' || left(sqlerrm, 150));
    end;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F10-V01..V03  BOB-20 (D-048): A SCHOOL ADMIN SEES AND NAMES THE SCHOOL'S
    --          OWN STAFF -- a role held there, or the school's number -- and
    --          finds a newly recorded teacher in the school's own waiting list;
    --          never another school's staff, never a platform person, never
    --          for a learner, and seeing grants nothing.
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      perform selftest.as_owner();
      perform set_config('app.seed_intent', 'synthetic', true);
      -- BOB-31: one school at a time, so the second sees the first's code (one
      -- UPDATE for both judged each against the table before the statement, and
      -- could give both the same one); A-Z drawn, not md5 hex (only A-F there)
      declare v31_s uuid; v31_ns text;
      begin
        foreach v31_s in array array[v_a, v_b] loop
          continue when (select i.namespace from public.institutions i where i.id = v31_s) is not null;
          for g in 1..500 loop
            v31_ns := chr(65 + floor(random() * 26)::int) || chr(65 + floor(random() * 26)::int) || chr(65 + floor(random() * 26)::int);
            exit when not exists (select 1 from public.institutions t where upper(t.namespace) = v31_ns);
          end loop;
          update public.institutions set namespace = v31_ns where institutions.id = v31_s;
        end loop;
      end;
      perform set_config('app.seed_intent', '', true);
      -- school A: a teacher holding a role there, and a newly recorded teacher
      -- who holds only the school's number; school B: the same two
      v20_t_a := selftest.f10_user('f10-v-guru-a-' || v_tag || '@local.invalid', 'EDUCATOR', v_a);
      select a.person_id into v20_t_a_p from public.accounts a where a.auth_user_id = v20_t_a;
      insert into public.persons (display_name) values ('Guru Baru A ' || v_tag) returning persons.id into v20_n_a;
      perform public.issue_institutional_id(v20_n_a, v_a);
      v20_t_b := selftest.f10_user('f10-v-guru-b-' || v_tag || '@local.invalid', 'EDUCATOR', v_b);
      select a.person_id into v20_t_b_p from public.accounts a where a.auth_user_id = v20_t_b;
      perform public.issue_institutional_id(v20_t_b_p, v_b);
      insert into public.persons (display_name) values ('Guru Baru B ' || v_tag) returning persons.id into v20_n_b;
      perform public.issue_institutional_id(v20_n_b, v_b);
      -- a platform administrator whose own row names school A's node, and no identity there
      v20_sys := selftest.f10_user('f10-v-sys-' || v_tag || '@local.invalid', 'SYSTEM_ADMIN', v_a);
      select a.person_id into v20_sys_p from public.accounts a where a.auth_user_id = v20_sys;
      -- a learner of school A
      v20_murid := selftest.f10_user('f10-v-murid-' || v_tag || '@local.invalid', null, null);
      select a.person_id into v20_murid_p from public.accounts a where a.auth_user_id = v20_murid;
      insert into public.academic_periods (institution_id, name, starts_on, ends_on)
      values (v_a, 'BOB-20 ' || v_tag, current_date - 30, current_date + 300) returning academic_periods.id into v20_per;
      insert into public.enrollments (person_id, institution_id, academic_period_id, status)
      values (v20_murid_p, v_a, v20_per, 'PENDING');

      ---------------------------------------------------------------- F10-V01
      perform selftest.as_user_uid(v_adm_a);
      if not public.person_visible_to_me(v20_t_a_p) then
        v_probs := selftest.f10_note(v_probs, 'F10-V01', 'the school''s admin cannot see the school''s own teacher');
      end if;
      if not public.person_visible_to_me(v20_n_a) then
        v_probs := selftest.f10_note(v_probs, 'F10-V01', 'the school''s admin cannot see the teacher the school has just recorded');
      end if;
      select array_agg(p.id) into v20_seen from public.persons p where p.id in (v20_t_a_p, v20_n_a);
      if coalesce(cardinality(v20_seen), 0) <> 2 then
        v_probs := selftest.f10_note(v_probs, 'F10-V01', format('the school''s admin reads %s of its 2 staff by name from persons', coalesce(cardinality(v20_seen), 0)));
      end if;
      begin
        select array_agg(w.person_id) into v20_list from public.persons_awaiting_first_role_at(v_a) w;
        if not (v20_n_a = any (coalesce(v20_list, '{}'))) then
          v_probs := selftest.f10_note(v_probs, 'F10-V01', 'the newly recorded teacher is not in the school''s waiting list');
        end if;
        if v20_t_a_p = any (coalesce(v20_list, '{}')) then
          v_probs := selftest.f10_note(v_probs, 'F10-V01', 'a teacher who holds a role there is in the school''s waiting list');
        end if;
        -- the first role, given as the school's admin may give it
        perform public.grant_role(v20_n_a, 'EDUCATOR', v_a, now() + interval '30 days');
        if v20_n_a = any (coalesce((select array_agg(w.person_id) from public.persons_awaiting_first_role_at(v_a) w), '{}')) then
          v_probs := selftest.f10_note(v_probs, 'F10-V01', 'a teacher given a first role is still in the waiting list');
        end if;
        if not public.person_visible_to_me(v20_n_a) then
          v_probs := selftest.f10_note(v_probs, 'F10-V01', 'a teacher given a first role stopped being visible');
        end if;
      exception when others then
        v_probs := selftest.f10_note(v_probs, 'F10-V01', 'the school''s waiting list could not be read: ' || left(sqlerrm, 150));
      end;
      perform selftest.as_owner();

      ---------------------------------------------------------------- F10-V02
      perform selftest.as_user_uid(v_adm_a);
      if public.person_visible_to_me(v20_t_b_p) then
        v_probs := selftest.f10_note(v_probs, 'F10-V02', 'another school''s teacher is visible to this school''s admin');
      end if;
      if public.person_visible_to_me(v20_n_b) then
        v_probs := selftest.f10_note(v_probs, 'F10-V02', 'another school''s newly recorded teacher is visible to this school''s admin');
      end if;
      if public.person_visible_to_me(v20_sys_p) then
        v_probs := selftest.f10_note(v_probs, 'F10-V02', 'a platform administrator with no identity at the school is visible to its admin');
      end if;
      -- by list and by direct id
      select count(*) into n from public.persons p where p.id in (v20_t_b_p, v20_n_b, v20_sys_p);
      if n <> 0 then
        v_probs := selftest.f10_note(v_probs, 'F10-V02', format('the school''s admin reads %s of another school''s staff or the platform administrator by id from persons', n));
      end if;
      select count(*) into n from public.persons p where p.display_name like '%' || v_tag and p.id in (v20_n_b);
      if n <> 0 then
        v_probs := selftest.f10_note(v_probs, 'F10-V02', 'another school''s teacher is on the school admin''s persons list');
      end if;
      begin
        if exists (select 1 from public.persons_awaiting_first_role_at(v_a) w where w.person_id in (v20_n_b, v20_t_b_p, v20_sys_p)) then
          v_probs := selftest.f10_note(v_probs, 'F10-V02', 'the school''s waiting list names someone of another school or the platform');
        end if;
      exception when others then
        v_probs := selftest.f10_note(v_probs, 'F10-V02', 'the school''s own waiting list could not be read: ' || left(sqlerrm, 120));
      end;
      v_got := selftest.f10_code(format('select * from public.persons_awaiting_first_role_at(%L::uuid)', v_b));
      if v_got = 'ok' or v_got like '42883 %' then
        v_probs := selftest.f10_note(v_probs, 'F10-V02', 'another school''s waiting list answered this school''s admin: ' || v_got);
      end if;
      perform selftest.as_owner();
      -- a learner of the school sees no staff and has no waiting list
      perform selftest.as_user_uid(v20_murid);
      if public.person_visible_to_me(v20_t_a_p) or public.person_visible_to_me(v20_n_a) then
        v_probs := selftest.f10_note(v_probs, 'F10-V02', 'a learner of the school can see the school''s staff');
      end if;
      select count(*) into n from public.persons p where p.id in (v20_t_a_p, v20_n_a);
      if n <> 0 then
        v_probs := selftest.f10_note(v_probs, 'F10-V02', format('a learner of the school reads %s of its staff from persons', n));
      end if;
      v_got := selftest.f10_code(format('select * from public.persons_awaiting_first_role_at(%L::uuid)', v_a));
      if v_got = 'ok' or v_got like '42883 %' then
        v_probs := selftest.f10_note(v_probs, 'F10-V02', 'the school''s waiting list answered a learner: ' || v_got);
      end if;
      perform selftest.as_owner();

      ---------------------------------------------------------------- F10-V03
      perform selftest.as_user_uid(v_adm_a);
      -- a role the other school's teacher does not hold yet, so only the scope can refuse it
      v_got := selftest.f10_code(format('select public.grant_role(%L::uuid, %L::public.app_role, %L::uuid, now() + interval ''30 days'')', v20_t_b_p, 'HEAD_OF_DEPARTMENT', v_b));
      if v_got not like '%lacks INSTITUTION_ADMIN scope%' then
        v_probs := selftest.f10_note(v_probs, 'F10-V03', 'the school''s admin granted a role at another school''s node: ' || v_got);
      end if;
      foreach v_label in array array['INSTITUTION_ADMIN', 'SYSTEM_ADMIN'] loop
        v_got := selftest.f10_code(format('select public.grant_role(%L::uuid, %L::public.app_role, %L::uuid, now() + interval ''30 days'')', v20_t_a_p, v_label, v_a));
        if v_got not like '%only an active SYSTEM_ADMIN may grant%' then
          v_probs := selftest.f10_note(v_probs, 'F10-V03', 'the school''s admin granted ' || v_label || ' to a teacher it can now see');
        end if;
      end loop;
      perform selftest.as_owner();
      if exists (select 1 from public.role_assignments ra
                  where ra.person_id in (v20_t_a_p, v20_t_b_p) and ra.role in ('INSTITUTION_ADMIN', 'SYSTEM_ADMIN')) then
        v_probs := selftest.f10_note(v_probs, 'F10-V03', 'a refused grant left a role behind');
      end if;
      if (select count(*) from public.role_assignments ra where ra.person_id = v20_t_b_p) <> 1 then
        v_probs := selftest.f10_note(v_probs, 'F10-V03', 'another school''s teacher gained a role from this school''s admin');
      end if;
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f10_note(v_probs, 'F10-V01', 'the test could not run: ' || left(sqlerrm, 150));
      v_probs := selftest.f10_note(v_probs, 'F10-V02', 'the test could not run: ' || left(sqlerrm, 150));
      v_probs := selftest.f10_note(v_probs, 'F10-V03', 'the test could not run: ' || left(sqlerrm, 150));
    end;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F10-G01..G03  BOB-21 (D-049): A SCHOOL-SCOPED GRANT NEEDS THE GRANT'S
    --          OWN SCHOOL. School A's newly recorded teacher (A's number and,
    --          since F10-V01, a role at A) belongs only to School A.
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      perform selftest.as_owner();
      -- an admin of both schools
      v21_both := selftest.f10_user('f10-g-dua-' || v_tag || '@local.invalid', 'INSTITUTION_ADMIN', v_a);
      perform set_config('app.seed_intent', 'synthetic', true);
      insert into public.role_assignments (person_id, role, scope_node_id, valid_from, valid_until)
      select a.person_id, 'INSTITUTION_ADMIN', v_b, now() - interval '1 day', now() + interval '365 days'
        from public.accounts a where a.auth_user_id = v21_both;
      perform set_config('app.seed_intent', '', true);
      -- a learner of School B, enrolled and nothing else
      v21_murid := selftest.f10_user('f10-g-murid-' || v_tag || '@local.invalid', null, null);
      select a.person_id into v21_murid_p from public.accounts a where a.auth_user_id = v21_murid;
      insert into public.academic_periods (institution_id, name, starts_on, ends_on)
      values (v_b, 'BOB-21 ' || v_tag, current_date - 30, current_date + 300) returning academic_periods.id into v21_per;
      insert into public.enrollments (person_id, institution_id, academic_period_id, status)
      values (v21_murid_p, v_b, v21_per, 'PENDING');

      ---------------------------------------------------------------- F10-G01
      perform selftest.as_user_uid(v_adm_b);
      v21_e1 := selftest.f10_raised(format('select public.grant_role(%L::uuid, ''EDUCATOR'', %L::uuid, now() + interval ''30 days'')', v20_n_a, v_b));
      v21_e2 := selftest.f10_raised(format('select public.grant_role(%L::uuid, ''EDUCATOR'', %L::uuid, now() + interval ''30 days'')', gen_random_uuid(), v_b));
      if v21_e1 is null or v21_e1 ->> 'code' <> '42501' or v21_e1 ->> 'detail' is distinct from 'GRANT_NO_SCHOOL_RELATIONSHIP' then
        v_probs := selftest.f10_note(v_probs, 'F10-G01', 'School B''s admin granted a School-B role to a School-A-only teacher by id: '
          || coalesce(v21_e1::text, 'ok'));
      end if;
      if v21_e1 is distinct from v21_e2 then
        v_probs := selftest.f10_note(v_probs, 'F10-G01', 'a person of another school and an id that does not exist are refused differently: '
          || coalesce(v21_e1::text, 'ok') || ' / ' || coalesce(v21_e2::text, 'ok'));
      end if;
      if public.person_visible_to_me(v20_n_a) then
        v_probs := selftest.f10_note(v_probs, 'F10-G01', 'the School-A teacher became visible to School B''s admin');
      end if;
      perform selftest.as_owner();
      if exists (select 1 from public.role_assignments ra where ra.person_id = v20_n_a and ra.institution_id = v_b)
         or exists (select 1 from public.institutional_identities ii where ii.person_id = v20_n_a and ii.institution_id = v_b)
         or exists (select 1 from public.enrollments e where e.person_id = v20_n_a and e.institution_id = v_b) then
        v_probs := selftest.f10_note(v_probs, 'F10-G01', 'the refused grant left the School-A teacher a School-B role, number or enrolment');
      end if;

      ---------------------------------------------------------------- F10-G02
      perform selftest.as_user_uid(v21_both);
      -- a role G01 did not try, so only the rule can refuse it
      v21_e1 := selftest.f10_raised(format('select public.grant_role(%L::uuid, ''HEAD_OF_DEPARTMENT'', %L::uuid, now() + interval ''30 days'')', v20_n_a, v_b));
      if v21_e1 is null or v21_e1 ->> 'detail' is distinct from 'GRANT_NO_SCHOOL_RELATIONSHIP' then
        v_probs := selftest.f10_note(v_probs, 'F10-G02', 'an admin of both schools moved a School-A teacher to School B by granting: '
          || coalesce(v21_e1::text, 'ok'));
      end if;
      v21_e1 := selftest.f10_raised(format('select public.grant_role(%L::uuid, ''EDUCATOR'', %L::uuid, now() + interval ''30 days'')', v20_n_b, v_a));
      if v21_e1 is null or v21_e1 ->> 'detail' is distinct from 'GRANT_NO_SCHOOL_RELATIONSHIP' then
        v_probs := selftest.f10_note(v_probs, 'F10-G02', 'an admin of both schools moved a School-B teacher to School A by granting: '
          || coalesce(v21_e1::text, 'ok'));
      end if;
      perform selftest.as_owner();
      if exists (select 1 from public.role_assignments ra
                  where (ra.person_id = v20_n_a and ra.institution_id = v_b) or (ra.person_id = v20_n_b and ra.institution_id = v_a)) then
        v_probs := selftest.f10_note(v_probs, 'F10-G02', 'a refused grant left a role at the other school');
      end if;

      ---------------------------------------------------------------- F10-G03
      -- the school's own: a teacher with a role there, a teacher with only its
      -- number, a learner with only an enrolment -- and the platform's path
      perform selftest.as_user_uid(v_adm_b);
      v_got := selftest.f10_code(format('select public.grant_role(%L::uuid, ''HEAD_OF_DEPARTMENT'', %L::uuid, now() + interval ''30 days'')', v20_t_b_p, v_b));
      if v_got <> 'ok' then
        v_probs := selftest.f10_note(v_probs, 'F10-G03', 'School B''s admin could not grant to its own teacher who holds a role there: ' || v_got);
      end if;
      v_got := selftest.f10_code(format('select public.grant_role(%L::uuid, ''EDUCATOR'', %L::uuid, now() + interval ''30 days'')', v20_n_b, v_b));
      if v_got <> 'ok' then
        v_probs := selftest.f10_note(v_probs, 'F10-G03', 'School B''s admin could not grant to the teacher it has just recorded: ' || v_got);
      end if;
      v_got := selftest.f10_code(format('select public.grant_role(%L::uuid, ''EDUCATOR'', %L::uuid, now() + interval ''30 days'')', v21_murid_p, v_b));
      if v_got <> 'ok' then
        v_probs := selftest.f10_note(v_probs, 'F10-G03', 'School B''s admin could not grant to a person enrolled there: ' || v_got);
      end if;
      perform selftest.as_user_uid(v_sys);
      v_got := selftest.f10_code(format('select public.grant_role(%L::uuid, ''DEAN'', %L::uuid, now() + interval ''30 days'')', v20_n_a, v_b));
      if v_got <> 'ok' then
        v_probs := selftest.f10_note(v_probs, 'F10-G03', 'the platform administrator''s grant changed: ' || v_got);
      end if;
      perform selftest.as_owner();
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f10_note(v_probs, 'F10-G01', 'the test could not run: ' || left(sqlerrm, 150));
      v_probs := selftest.f10_note(v_probs, 'F10-G02', 'the test could not run: ' || left(sqlerrm, 150));
      v_probs := selftest.f10_note(v_probs, 'F10-G03', 'the test could not run: ' || left(sqlerrm, 150));
    end;

    raise exception 'F10_UNDO';
  exception when others then
    begin perform selftest.as_owner(); exception when others then null; end;
    perform set_config('app.seed_intent', '', true);
    if sqlerrm <> 'F10_UNDO' then v_fatal := sqlerrm; end if;
  end;

  ------------------------------------------------------------------- verdicts
  for r in
    select * from unnest(
      array['F10-S01','F10-S02','F10-S03','F10-S04','F10-S05','F10-S06','F10-M01','F10-M02',
            'F10-S07','F10-S08','F10-S09','F10-S10','F10-V01','F10-V02','F10-V03','F10-G01','F10-G02','F10-G03'],
      array['BOB-01 -- an Admin sekolah builds Bagian, Tingkat and Kelas',
            'BOB-01 -- an Admin platform builds them for any school',
            'BOB-01 -- everyone else at the school is refused',
            'BOB-01 -- another school''s nodes are refused, with no existence oracle',
            'BOB-01 -- a Kelas sits under a Tingkat of the same year',
            'BOB-01 -- every refusal carries its own stable code',
            'M5a -- the intake places a learner only in a Kelas or Tingkat, and says why',
            'M5a -- the intake enrols a learner into the place''s own year',
            'BOB-08 -- nobody is placed or granted a role in a deactivated place',
            'BOB-08 -- an academic year near now',
            'BOB-08 -- the national library is not a school',
            'BOB-08 -- one way in, and staff below a Bagian',
            'BOB-20 -- a school''s admin sees and names the school''s own staff (D-048)',
            'BOB-20 -- another school''s staff, a platform person and a learner''s view stay closed',
            'BOB-20 -- seeing a person grants no authority over them',
            'BOB-21 -- a grant by id to another school''s teacher is refused and creates nothing (D-049)',
            'BOB-21 -- an admin of two schools cannot move a teacher by granting',
            'BOB-21 -- the school''s own people and the platform''s grant are unchanged'],
      array[
        format('as the school''s INSTITUTION_ADMIN, two Bagian, two Tingkat and three Kelas were built and '
            || 'listed with the parent the screen shows and the year (%s visible node(s)); the school has one hidden '
            || 'Jenjang, each Bagian one hidden Reguler, one 2026/2027 period from 1 July to 30 June reused by both '
            || 'Tingkat, each Kelas its Tingkat''s year, and 11 audit rows naming the admin', m_built),
        format('a SYSTEM_ADMIN scoped to a third school built, renamed and listed another school''s structure '
            || '(%s act(s)); a school built by hand before BOB-01 kept its one Jenjang, and its Bagian gained a '
            || 'Reguler at its first Tingkat; the same Tingkat name under two Bagian is two Tingkat', m_sys),
        format('a DEAN, a HEAD_OF_DEPARTMENT at the Bagian, an EDUCATOR at the Kelas, a placed student, a person '
            || 'with no role and an anonymous caller were refused by every structure function (%s refusal(s), '
            || 'each PR020 STRUCTURE_NOT_ALLOWED or no EXECUTE for anon), and nothing was written', m_refused),
        format('each school''s admin was refused on the other school''s nodes by every structure function '
            || '(%s refusal(s), each PR020 STRUCTURE_NOT_ALLOWED); a foreign node and a node that does not exist '
            || 'raise the identical SQLSTATE, DETAIL and MESSAGE, and nothing was written', m_foreign),
        format('a Kelas stating another year than its Tingkat''s is PR020 STRUCTURE_YEAR_MISMATCH, and a year not '
            || 'written YYYY/YYYY+1 is STRUCTURE_YEAR_INVALID (%s refusal(s)); a Kelas without a year takes its '
            || 'Tingkat''s, and the same names in the next year make the next year''s period and nodes', m_year),
        format('NAME_INVALID, NAME_TAKEN (case-insensitive; a Kelas name school-wide per year), PARENT_INVALID, '
            || 'PARENT_INACTIVE, NODE_INVALID (the school and hidden nodes), HAS_ACTIVE_CHILDREN, HAS_MEMBERS and '
            || 'HAS_STAFF each arrive as PR020 with that code in DETAIL (%s of 22); a rename lands and is audited '
            || 'once with its old and new name, a repeated deactivation is audited once, a Bagian takes its '
            || 'Reguler with it, a refused deactivation changes nothing, and a deactivated name can be reused', m_codes),
        format('a learner (no role, or STUDENT) placed in a Bagian, the Jenjang, a Reguler, the school or a '
            || 'deactivated Kelas is refused with "a learner is placed in an active Kelas or Tingkat", while a '
            || 'Kelas and a Tingkat are not; an EDUCATOR at a Bagian or in a Kelas, a HEAD_OF_DEPARTMENT and a DEAN '
            || 'are refused with "a staff row is not recorded by the bulk intake yet" (BOB-10) (%s of 13); the '
            || 'intake''s own check reports each phrase against its row and provisions nobody', m_place),
        format('with three academic years at the school, the newest carried by no place, learners placed in a '
            || '2026/2027 Kelas, a 2027/2028 Kelas and a 2026/2027 Tingkat were each enrolled and placed in that '
            || 'place''s own year (%s of 3), and the import completed', m_period),
        format('in a Kelas deactivated by the school''s admin, a role grant, a membership, a rollover into it and an '
            || 'enrolment in a deactivated programme were each refused PR020 STRUCTURE_PLACE_INACTIVE (%s of 4), '
            || 'leaving no membership there, while a grant into an active Kelas was accepted', m_inactive),
        format('the years one before, of and one after the current school year were accepted and the years two '
            || 'either side refused STRUCTURE_YEAR_OUT_OF_RANGE with no period made (%s of 5)', m_window),
        format('a platform administrator''s create_bagian and school_structure on the canonical library were each '
            || 'STRUCTURE_NOT_A_SCHOOL (%s of 2), and nothing was built there', m_canon),
        format('signed in, the school''s admin inserting and updating org_nodes and academic_periods directly was '
            || 'refused 42501 (%s of 4); a Bagian with a role scoped at its hidden Reguler was STRUCTURE_HAS_STAFF', m_direct),
        'the school''s admin saw its teacher who holds a role there and its newly recorded teacher who holds only '
          || 'the school''s number, read both by name from persons, and found the new one -- and not the teacher '
          || 'with a role -- in persons_awaiting_first_role_at; once given a first role there, the new teacher left '
          || 'the list and stayed visible',
        'the school''s admin saw neither of another school''s staff (its teacher with a role and a number there, '
          || 'its newly recorded teacher) nor a platform administrator whose row names the school''s node, by '
          || 'person_visible_to_me or by id from persons; its own waiting list named none of them and another '
          || 'school''s waiting list refused it; a learner of the school saw none of the school''s staff and was '
          || 'refused the waiting list',
        'the school''s admin was still refused a grant at another school''s node and a grant of INSTITUTION_ADMIN '
          || 'or SYSTEM_ADMIN to a teacher it can see; no refused grant left a role behind',
        'School B''s admin granting a School-B role by internal id to a teacher who belongs only to School A was '
          || 'refused 42501 GRANT_NO_SCHOOL_RELATIONSHIP, identically to an id that does not exist; no School-B role, '
          || 'number or enrolment was created and the teacher stayed invisible to School B''s admin',
        'an admin of both School A and School B was refused GRANT_NO_SCHOOL_RELATIONSHIP granting a School-B role to '
          || 'a School-A-only teacher and a School-A role to a School-B-only teacher, and no role was left at either',
        'School B''s admin still granted to its own teacher who holds a role there, to the teacher it has just '
          || 'recorded (its number only) and to a person enrolled there (an enrolment only); the platform '
          || 'administrator still granted a School-B role to the School-A teacher'
      ]) as t(tid, tarea, tdetail)
  loop
    id := r.tid; area := r.tarea;
    if v_fatal <> '' then
      ok := false;
      detail := 'the suite aborted before this test could report: ' || left(v_fatal, 200);
    elsif v_probs ? r.tid then
      ok := false;
      detail := format('%s problem(s): %s', jsonb_array_length(v_probs -> r.tid),
                       (select string_agg(x, '; ') from jsonb_array_elements_text(v_probs -> r.tid) x));
    else
      ok := true; detail := r.tdetail;
    end if;
    return next;
  end loop;

  id := 'F10-DONE'; area := 'suite'; ok := v_fatal = '';
  detail := case when v_fatal = '' then 'FABLE-10 suite complete; every row rolled back'
                 else 'the suite did not complete: ' || left(v_fatal, 200) end;
  return next;
end $$;
revoke all on function selftest.run_fable10() from public;
grant execute on function selftest.run_fable10() to authenticated;
