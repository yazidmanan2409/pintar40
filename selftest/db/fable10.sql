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
-- functions as that admin. Returns '<tingkat>|<admin auth uid>'.
create or replace function selftest.f10_concurrency_fixture()
returns text language plpgsql security definer set search_path = public, pg_temp as $$
declare v_tag text := substr(md5(random()::text), 1, 8); v_inst uuid; v_uid uuid; v_bag uuid; v_ting uuid;
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
  v_ting := public.create_tingkat(v_bag, 'Tingkat Balapan', '2026/2027');
  perform set_config('request.jwt.claims', '', true);
  perform set_config('request.jwt.claim.sub', '', true);
  return v_ting || '|' || v_uid;
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
      v_t1   := public.create_tingkat(v_bag1, 'Kelas 1', '2026/2027');
      v_t4   := public.create_tingkat(v_bag2, 'Kelas 4', ' 2026 / 2027 ');
      v_k1a  := public.create_kelas(v_t1, '1A', '2026/2027');
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
       where ap.institution_id = v_a and ap.name = '2026/2027'
         and ap.starts_on = date '2026-07-01' and ap.ends_on = date '2027-06-30';
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
        select ap.id into v_period from public.academic_periods ap where ap.institution_id = v_a and ap.name = '2026/2027';
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
      v_tx  := public.create_tingkat(v_mipa, 'Kelas X', '2026/2027');
      -- the same Tingkat name under another Bagian is another Tingkat
      v_txi := public.create_tingkat(v_ips, 'Kelas X', '2026/2027');
      v_kbx := public.create_kelas(v_tx, 'X MIPA 1', '2026/2027');
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
        format('select public.create_tingkat(%L::uuid, %L, %L)', v_bag1, 'Tingkat Liar', '2026/2027'),
        format('select public.create_kelas(%L::uuid, %L)', v_t1, 'Kelas Liar'),
        format('select public.rename_school_node(%L::uuid, %L)', v_k1a, 'Liar'),
        format('select public.deactivate_school_node(%L::uuid)', v_k1b)];
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
                format('select public.create_tingkat(%L::uuid, %L, %L)', v_bag1, 'Asing', '2026/2027'),
                format('select public.create_kelas(%L::uuid, %L)', v_t1, 'Asing'),
                format('select public.rename_school_node(%L::uuid, %L)', v_bag1, 'Asing'),
                format('select public.deactivate_school_node(%L::uuid)', v_k1b),
                format('select * from public.school_structure(%L::uuid)', v_b),
                format('select public.create_tingkat(%L::uuid, %L, %L)', v_ips, 'Asing', '2026/2027'),
                format('select public.rename_school_node(%L::uuid, %L)', v_kbx, 'Asing'),
                format('select public.deactivate_school_node(%L::uuid)', v_txi)]) as t(uid, q) loop
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
          array[format('select public.create_kelas(%L::uuid, %L, %L)', v_t1, '1C', '2027/2028'),
                format('select public.create_kelas(%L::uuid, %L, %L)', v_t1, '1C', '2025/2026')],
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
      v_t1b := public.create_tingkat(v_bag1, 'Kelas 1', '2027/2028');
      v_p   := public.create_kelas(v_t1b, '1A', '2027/2028');
      perform selftest.as_owner();
      select count(*) into n from public.org_nodes k
        join public.academic_periods ap on ap.id = k.academic_period_id
       where k.id = v_p and ap.name = '2027/2028' and ap.starts_on = date '2027-07-01';
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
      v_t5   := public.create_tingkat(v_bag2, 'Kelas 5', '2026/2027');
      perform public.deactivate_school_node(v_t5);
      v_bag3 := public.create_bagian(v_a, 'Sementara');
      perform public.deactivate_school_node(v_bag3);
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
            format('select public.create_tingkat(%L::uuid, %L, %L)', v_bag1, 'KELAS 1', '2026/2027'),
            format('select public.create_kelas(%L::uuid, %L)', v_t4, '1a'),
            format('select public.rename_school_node(%L::uuid, %L)', v_k1b, '1A'),
            format('select public.rename_school_node(%L::uuid, %L)', v_bag2, 'Kelas Rendah'),
            format('select public.create_tingkat(%L::uuid, %L, %L)', v_t1, 'Anak', '2026/2027'),
            format('select public.create_kelas(%L::uuid, %L)', v_bag1, 'Anak'),
            format('select public.create_bagian(%L::uuid, %L)', v_bag1, 'Anak'),
            format('select public.create_kelas(%L::uuid, %L)', v_t5, '5A'),
            format('select public.create_tingkat(%L::uuid, %L, %L)', v_bag3, 'Kelas 9', '2026/2027'),
            format('select public.rename_school_node(%L::uuid, %L)', v_a, 'Sekolah Baru'),
            format('select public.rename_school_node(%L::uuid, %L)', v_jenjang, 'Terlihat'),
            format('select public.deactivate_school_node(%L::uuid)', c_prog),
            format('select public.deactivate_school_node(%L::uuid)', v_t1),
            format('select public.deactivate_school_node(%L::uuid)', v_bag1),
            format('select public.deactivate_school_node(%L::uuid)', v_k1b),
            format('select public.deactivate_school_node(%L::uuid)', v_k4b)],
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
      perform public.deactivate_school_node(v_t5);
      v_p := public.create_tingkat(v_bag2, 'Kelas 5', '2026/2027');
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
      values (v_c, '2026/2027', date '2026-07-01', date '2027-06-30') returning academic_periods.id into v_period;
      insert into public.academic_periods (institution_id, name, starts_on, ends_on)
      values (v_c, '2027/2028', date '2027-07-01', date '2028-06-30') returning academic_periods.id into v_period2;
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
      for r in select * from unnest(
          array[c_dep, c_dep, c_fac, c_prog, v_c, c_cls_off, c_cls, c_coh, c_cls, c_dep],
          array[null, 'STUDENT', null, null, null, null, null, null, 'STUDENT', 'EDUCATOR'],
          array[true, true, true, true, true, true, false, false, false, false],
          array['a learner placed in a Bagian', 'a STUDENT placed in a Bagian', 'a learner placed in the Jenjang',
                'a learner placed in a Reguler', 'a learner placed in the school itself',
                'a learner placed in a deactivated Kelas', 'a learner placed in a Kelas',
                'a learner placed in a Tingkat', 'a STUDENT placed in a Kelas', 'an EDUCATOR scoped to a Bagian']
        ) as t(node, role, refuse, label) loop
        v_prob := public.import_row_problems(v_c,
          jsonb_strip_nulls(jsonb_build_object('display_name', 'Murid Uji', 'node_id', r.node, 'role', r.role)));
        n := (select count(*) from jsonb_array_elements_text(v_prob) x
               where x = 'a learner is placed in an active Kelas or Tingkat');
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
      perform selftest.as_owner();
      select count(*) into n from public.persons where display_name = 'Murid Salah Tempat ' || v_tag;
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

    raise exception 'F10_UNDO';
  exception when others then
    begin perform selftest.as_owner(); exception when others then null; end;
    perform set_config('app.seed_intent', '', true);
    if sqlerrm <> 'F10_UNDO' then v_fatal := sqlerrm; end if;
  end;

  ------------------------------------------------------------------- verdicts
  for r in
    select * from unnest(
      array['F10-S01','F10-S02','F10-S03','F10-S04','F10-S05','F10-S06','F10-M01','F10-M02'],
      array['BOB-01 -- an Admin sekolah builds Bagian, Tingkat and Kelas',
            'BOB-01 -- an Admin platform builds them for any school',
            'BOB-01 -- everyone else at the school is refused',
            'BOB-01 -- another school''s nodes are refused, with no existence oracle',
            'BOB-01 -- a Kelas sits under a Tingkat of the same year',
            'BOB-01 -- every refusal carries its own stable code',
            'M5a -- the intake places a learner only in a Kelas or Tingkat, and says why',
            'M5a -- the intake enrols a learner into the place''s own year'],
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
            || 'Kelas, a Tingkat and an EDUCATOR at a Bagian are not (%s of 10); the intake''s own check reports '
            || 'the phrase against the row and provisions nobody', m_place),
        format('with three academic years at the school, the newest carried by no place, learners placed in a '
            || '2026/2027 Kelas, a 2027/2028 Kelas and a 2026/2027 Tingkat were each enrolled and placed in that '
            || 'place''s own year (%s of 3), and the import completed', m_period)
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
