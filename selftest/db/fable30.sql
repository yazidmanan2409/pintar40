-- FABLE-30 · W2.17 (FD-4 at 10x staging): A SCHOOL'S PEOPLE ARE FOUND BY NAME, A PAGE AT A TIME.
--
-- Konfigurasi's people pickers read a school's ACTIVE enrolments through school_people_page() (migration
-- 20261230100000) instead of through the enrolments policy, which ran on every enrolment the school ever had and passed
-- the statement timeout at 13,300. A function that bypasses the policy must not widen who reads what:
--
--   F30-S01  school_people_page gives the school's administrator a page of at most 50 of the school's ACTIVE
--            enrolments, the newest first, each with its person's name; finds a person by part of the name, in any
--            case; never an ENDED enrolment; nothing for a school the caller does not administer (another school's
--            administrator, an educator of the school, a learner), nothing for «every school» except for the
--            platform administrator, and nothing for no caller. The limit asked above 50 is held at 50.
--
-- EVERY ROW IS ROLLED BACK.

create schema if not exists selftest;
grant usage on schema selftest to authenticated, anon;

create or replace function selftest.f30_note(p jsonb, p_id text, p_problem text)
returns jsonb language sql immutable as $$
  select jsonb_set(coalesce(p, '{}'::jsonb), array[p_id], coalesce(p -> p_id, '[]'::jsonb) || to_jsonb(p_problem))
$$;
grant execute on function selftest.f30_note(jsonb, text, text) to authenticated, anon;

create or replace function selftest.run_fable30()
returns table (id text, area text, ok boolean, detail text)
language plpgsql set search_path = public, pg_temp as $$
declare
  r record; v_probs jsonb := '{}'::jsonb; v_fatal text := ''; v_tag text := to_char(clock_timestamp(), 'HH24MISSUS');
  v_alpha uuid; v_beta uuid; v_period uuid; v_n int; v_m int; v_akhir text; v_nama text; v_ended uuid;
begin
  perform selftest.as_owner();
  begin
    select i.id into v_alpha from public.institutions i where i.slug like 'synth-alpha-%' and i.is_synthetic order by i.created_at desc limit 1;
    select i.id into v_beta from public.institutions i where i.slug like 'synth-beta-%' and i.is_synthetic order by i.created_at desc limit 1;
    if v_alpha is null or v_beta is null then raise exception 'the seeded Alpha and Beta schools are not there'; end if;
    select p.id into v_period from public.academic_periods p where p.institution_id = v_alpha order by p.starts_on desc limit 1;

    -- F30-S01: 60 new active enrolments in Alpha (more than a page), and one ended
    begin
      with p as (insert into public.persons (display_name)
                 select 'F30 Orang ' || v_tag || ' ' || lpad(g::text, 2, '0') from generate_series(1, 60) g returning persons.id as pid, persons.display_name as nama)
      insert into public.enrollments (person_id, institution_id, academic_period_id, status, created_at)
      select p.pid, v_alpha, v_period, 'ACTIVE', now() + make_interval(secs => right(p.nama, 2)::int)
        from p;
      v_akhir := 'F30 Orang ' || v_tag || ' 60';
      insert into public.persons (display_name) values ('F30 Selesai ' || v_tag) returning persons.id into v_ended;
      insert into public.enrollments (person_id, institution_id, academic_period_id, status) values (v_ended, v_alpha, v_period, 'ACTIVE');
      update public.enrollments e set status = 'ENDED', end_reason = 'WITHDRAWN' where e.person_id = v_ended;

      perform selftest.as_user('alpha-admin@synthetic.pintar.test');
      select count(*), count(*) filter (where s.institution_id <> v_alpha or s.status <> 'ACTIVE' or s.display_name is null)
        into v_n, v_m from public.school_people_page(array[v_alpha], null, 500) s;
      if v_n <> 50 or v_m <> 0 then
        v_probs := selftest.f30_note(v_probs, 'F30-S01', format('the administrator''s unsearched page has %s rows (expected 50), %s outside the school, not ACTIVE or unnamed', v_n, v_m));
      end if;
      select s.display_name into v_nama from public.school_people_page(array[v_alpha]) s limit 1;
      if v_nama is distinct from v_akhir then
        v_probs := selftest.f30_note(v_probs, 'F30-S01', format('the newest is not first: %s', coalesce(v_nama, 'nothing')));
      end if;
      select count(*) into v_n from public.school_people_page(array[v_alpha], upper(' orang  ' || v_tag || ' 6')) s;
      if v_n <> 1 then
        v_probs := selftest.f30_note(v_probs, 'F30-S01', format('searching part of a name, in another case, found %s (expected 1)', v_n));
      end if;
      select count(*) into v_n from public.school_people_page(array[v_alpha], 'F30 Selesai ' || v_tag) s;
      if v_n <> 0 then v_probs := selftest.f30_note(v_probs, 'F30-S01', 'an ENDED enrolment is offered'); end if;
      select count(*) into v_n from public.school_people_page(array[v_beta]) s;
      if v_n <> 0 then v_probs := selftest.f30_note(v_probs, 'F30-S01', format('Alpha''s administrator reads %s of Beta''s enrolments', v_n)); end if;
      select count(*) into v_n from public.school_people_page(null) s;
      if v_n <> 0 then v_probs := selftest.f30_note(v_probs, 'F30-S01', format('a school administrator reads %s enrolments for «every school»', v_n)); end if;

      foreach v_nama in array array['alpha-guru@synthetic.pintar.test', 'alpha-siswa-1@synthetic.pintar.test'] loop
        perform selftest.as_user(v_nama);
        select count(*) into v_n from public.school_people_page(array[v_alpha]) s;
        if v_n <> 0 then v_probs := selftest.f30_note(v_probs, 'F30-S01', format('%s reads %s of Alpha''s enrolments', split_part(v_nama, '@', 1), v_n)); end if;
      end loop;

      perform selftest.as_user('sysadmin@synthetic.pintar.test');
      select count(*) into v_n from public.school_people_page(null, v_tag) s;
      if v_n <> 50 then v_probs := selftest.f30_note(v_probs, 'F30-S01', format('the platform administrator''s «every school» search found %s (expected a page of 50)', v_n)); end if;

      -- no caller: anon may not call it at all; a signed-in role with no person gets nothing
      perform selftest.as_owner();
      perform set_config('request.jwt.claims', '{}', true);
      perform set_config('role', 'anon', true);
      begin
        select count(*) into v_n from public.school_people_page(array[v_alpha]) s;
        v_probs := selftest.f30_note(v_probs, 'F30-S01', format('anon may call it (%s rows)', v_n));
      exception when insufficient_privilege then null;
      end;
      perform set_config('role', 'authenticated', true);
      select count(*) into v_n from public.school_people_page(array[v_alpha]) s;
      perform selftest.as_owner();
      if v_n <> 0 then v_probs := selftest.f30_note(v_probs, 'F30-S01', format('no person reads %s enrolments', v_n)); end if;
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f30_note(v_probs, 'F30-S01', 'the test could not run: ' || left(sqlerrm, 200));
    end;

    raise exception 'F30_ROLLBACK';
  exception when others then
    perform selftest.as_owner();
    if sqlerrm <> 'F30_ROLLBACK' then v_fatal := sqlerrm; end if;
  end;

  for r in select * from unnest(
      array['F30-S01'],
      array['W2.17 (FD-4 at 10x staging) -- a school''s people are found by name, a page at a time'],
      array['school_people_page gives a school''s administrator a page of at most 50 of its ACTIVE enrolments, newest first and '
        || 'named, finds a person by part of the name in any case, never an ENDED one; nothing for another school, an educator, '
        || 'a learner or no caller; «every school» for the platform administrator only']) as t(tid, tarea, tdetail)
  loop
    id := r.tid; area := r.tarea;
    if v_fatal <> '' then
      ok := false; detail := 'the suite aborted before this test could report: ' || left(v_fatal, 200);
    elsif v_probs ? r.tid then
      ok := false;
      detail := format('%s problem(s): %s', jsonb_array_length(v_probs -> r.tid),
                       (select string_agg(x, '; ') from jsonb_array_elements_text(v_probs -> r.tid) x));
    else
      ok := true; detail := r.tdetail;
    end if;
    return next;
  end loop;

  id := 'F30-DONE'; area := 'suite'; ok := v_fatal = '';
  detail := case when v_fatal = '' then 'FABLE-30 suite complete; every row rolled back'
                 else 'the suite did not complete: ' || left(v_fatal, 200) end;
  return next;
end $$;
revoke all on function selftest.run_fable30() from public;
grant execute on function selftest.run_fable30() to authenticated;
