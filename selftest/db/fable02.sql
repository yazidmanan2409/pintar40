-- FABLE-02 database-layer selftest. Sibling of fable01.sql, same row shape,
-- same throwaway `selftest` schema.
--
-- Why these assertions live here and not in a migration: they need seeded
-- institutions and persons, and `supabase db reset` applies migrations BEFORE
-- the seed. A migration must replay against an empty database, so its own
-- verification block stays structural; anything that needs a data row belongs
-- in this runner, which runs after the seed. Migration
-- 20260912114854_content_lifecycle originally carried this proof inline and
-- failed every clean-database replay for exactly that reason.
--
-- Runs as the owner: these assertions are about triggers, which fire for every
-- role, so no role impersonation is needed. Never applied as a migration.

create schema if not exists selftest;

-- Same privilege preamble as fable01.sql: a clean database grants nothing on a
-- new schema, and the harness switches roles (CI-01).
grant usage on schema selftest to authenticated, anon;

create or replace function selftest.run_fable02()
returns table (test_id text, invariant text, ok boolean, detail text)
language plpgsql set search_path = public, pg_temp as $$
declare
  v_inst uuid; v_author uuid; v_reviewer uuid; v_course uuid; n int;
  t0 timestamptz := clock_timestamp();
begin
  -- ------------------------------------------------------------- fixtures
  -- order by id: the seed inserts all personas in one statement, so they
  -- share a created_at and ordering by it can return the same row twice.
  select i.id into v_inst from public.institutions i
   where i.is_synthetic order by i.id limit 1;
  select p.id into v_author   from public.persons p order by p.id limit 1;
  select p.id into v_reviewer from public.persons p order by p.id desc limit 1;

  -- leave nothing behind from an earlier run
  delete from public.courses where title = 'selftest lifecycle probe';

  -- F02-T01 the transition graph is an allow-list: rows start at INGESTED,
  -- skips are refused, the listed path is permitted.
  ok := true; detail := '';
  begin
    insert into public.courses (institution_id, subject, stage, grade_label, title, status, author_person_id)
      values (v_inst, 'Selftest', 'SMA', 'X', 'selftest lifecycle probe', 'VALIDATED', v_author);
    ok := false; detail := detail || 'insert at VALIDATED accepted; ';
    delete from public.courses where title = 'selftest lifecycle probe';
  exception when others then null; end;

  insert into public.courses (institution_id, subject, stage, grade_label, title, author_person_id)
    values (v_inst, 'Selftest', 'SMA', 'X', 'selftest lifecycle probe', v_author)
    returning id into v_course;

  begin
    update public.courses set status = 'VALIDATED' where id = v_course;
    ok := false; detail := detail || 'skip INGESTED->VALIDATED accepted; ';
  exception when others then null; end;

  begin
    update public.courses set status = 'STRUCTURED' where id = v_course;
    update public.courses set status = 'VALIDATED'  where id = v_course;
    update public.courses set status = 'IN_REVIEW'  where id = v_course;
  exception when others then
    ok := false; detail := detail || 'legal path refused: ' || sqlerrm || '; ';
  end;
  test_id := 'F02-T01'; invariant := 'INV-22'; 
  if ok then detail := 'created at INGESTED only; skip refused; listed path permitted'; end if;
  return next;

  -- F02-T02 APPROVED requires a reviewer who is not the author (§2).
  ok := true; detail := '';
  begin
    update public.courses set status = 'APPROVED', reviewed_by_person_id = v_author where id = v_course;
    ok := false; detail := detail || 'author approved their own content; ';
  exception when others then null; end;
  begin
    update public.courses set status = 'APPROVED', reviewed_by_person_id = null where id = v_course;
    ok := false; detail := detail || 'APPROVED accepted without a reviewer; ';
  exception when others then null; end;
  update public.courses set status = 'APPROVED', reviewed_by_person_id = v_reviewer where id = v_course;
  select count(*) into n from public.courses where id = v_course and reviewed_at is not null;
  if n <> 1 then ok := false; detail := detail || 'reviewed_at not stamped; '; end if;
  test_id := 'F02-T02'; invariant := 'doc 04 §1';
  if ok then detail := 'self-approval and reviewer-less approval refused; distinct reviewer stamped'; end if;
  return next;

  -- F02-T03 nothing reverses out of a sealed state.
  ok := true; detail := '';
  update public.courses set status = 'FROZEN' where id = v_course;
  begin
    update public.courses set status = 'APPROVED' where id = v_course;
    ok := false; detail := detail || 'reversal FROZEN->APPROVED accepted; ';
  exception when others then null; end;
  begin
    update public.courses set status = 'SUPERSEDED' where id = v_course;
    ok := false; detail := detail || 'unlisted jump FROZEN->SUPERSEDED accepted; ';
  exception when others then null; end;
  update public.courses set status = 'PUBLISHED' where id = v_course;
  test_id := 'F02-T03'; invariant := 'INV-04/INV-22';
  if ok then detail := 'no reversal or unlisted jump out of a sealed state; FROZEN->PUBLISHED permitted'; end if;
  return next;

  -- F02-T04 authorship is provenance: stamped on insert, never rewritten.
  ok := true; detail := '';
  select count(*) into n from public.courses where id = v_course and author_person_id = v_author;
  if n <> 1 then ok := false; detail := detail || 'author not preserved from insert; '; end if;
  begin
    update public.courses set author_person_id = v_reviewer where id = v_course;
    ok := false; detail := detail || 'author_person_id rewritten; ';
  exception when others then null; end;
  test_id := 'F02-T04'; invariant := 'INV-33 (content)';
  if ok then detail := 'author stamped at insert and immutable thereafter'; end if;
  return next;

  delete from public.courses where id = v_course;

  test_id := 'F02-DONE'; invariant := '-'; ok := true;
  detail := format('elapsed %s ms', round(extract(epoch from clock_timestamp() - t0) * 1000));
  return next;
end $$;

-- The entrypoint is entered over the owner connection only.
revoke all on function selftest.run_fable02() from public;
