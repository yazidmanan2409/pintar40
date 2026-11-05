-- FABLE-28 · W6.1 (CR-59; D-186): THE UNIVERSAL RULES AS RULE-LEVEL TESTS.
--
-- A rule-level test reads every instance of a rule from the live schema, not a few examples, so a new instance that
-- breaks it fails here the day it is added.
--
--   F28-J311  J3.11 (ADM-20, U-AUDIT): EVERY CONSEQUENTIAL ACTION LEAVES A TRACE. Every client-callable function
--             (client_rpc_registry) that writes is one of:
--               A  it writes the audit trail itself (audit_write or audit_log);
--               B  it calls a function that does;
--               C  it writes a table whose trigger writes the audit trail;
--               D  it writes a declared RECORD OF THE ACT, a table that names the acting person (set from
--                  current_person_id() in the function) and the time, and that no signed-in client can write;
--               E  it is declared NOT a consequential staff act, with its reason (a learner's own state, the learner's
--                  sitting, which is its own evidence record, or an automated check or proposal).
--             Anything else fails, named. A declaration that no longer matches a writing function fails too, so the
--             lists cannot go stale. A planted writing function with no trace, registered inside the rolled-back
--             block, must be caught: the rule cannot pass vacuously.
--
-- EVERY ROW IS ROLLED BACK.

create schema if not exists selftest;
grant usage on schema selftest to authenticated, anon;

create or replace function selftest.f28_note(p jsonb, p_id text, p_problem text)
returns jsonb language sql immutable as $$
  select jsonb_set(coalesce(p, '{}'::jsonb), array[p_id], coalesce(p -> p_id, '[]'::jsonb) || to_jsonb(p_problem))
$$;
grant execute on function selftest.f28_note(jsonb, text, text) to authenticated, anon;

-- The declared records of an act: table, and the column naming the person who acted.
create or replace function selftest.f28_act_records()
returns table (tbl text, actor_col text) language sql immutable as $$
  values ('account_activation_grants', 'authorized_by'), ('card_conversions', 'authorized_by'),
         ('card_reissues', 'authorized_by'), ('email_corrections', 'authorized_by'),
         ('generated_reports', 'generated_by_person_id'), ('import_jobs', 'created_by_person_id')
$$;

-- The declared functions that are not a consequential staff act, each with its reason.
create or replace function selftest.f28_not_consequential()
returns table (fn text, reason text) language sql immutable as $$
  values
    -- a learner's own state: nobody else's data changes
    ('complete_tour', 'the learner''s own tour state'), ('suppress_tour', 'the learner''s own tour state'),
    ('note_tour_presented', 'the learner''s own tour state'),
    ('konteks_saya', 'the person''s own working context on their device'), ('konteks_tetapkan', 'the person''s own working context on their device'),
    ('sesi_detak', 'the person''s own device session heartbeat'), ('sesi_kunci_saya', 'the person''s own device session lock'),
    ('note_item_view', 'that a learner saw a question: telemetry of their own sitting'),
    ('note_result_seen', 'that a learner opened their own result (result_views)'),
    ('record_lesson_progress', 'the learner''s own lesson progress'),
    ('record_lesson_review_read', 'the learner''s own reading of a review'),
    ('assistance_state', 'the learner''s own assistance state and its telemetry'),
    ('open_assistance', 'the learner''s own assistance, recorded with its telemetry'),
    ('dismiss_assistance', 'the learner''s own assistance telemetry'),
    -- the learner's sitting: the session, its presented items and responses are the evidence record itself, with the
    -- learner, the time and the content, and are append-only (INV-04)
    ('record_answer', 'the sitting is its own evidence record'), ('pause_session', 'the sitting is its own evidence record'),
    ('resume_session', 'the sitting is its own evidence record'), ('submit_session', 'the sitting is its own evidence record'),
    ('record_integrity_signal', 'the signal is itself the record, reviewed through the audited integrity review'),
    -- anonymous by design: a class's feedback about its teacher names no one (20260930100000); an audit row would tie
    -- each answer to its learner. The opportunity is consumed exactly once instead
    ('submit_feedback', 'anonymous class feedback: a trace naming the learner would break its anonymity'),
    -- an automated check or proposal: it decides nothing; the human step that acts on it is audited or names its actor
    ('run_mcq_quality', 'a quality check; acknowledging a finding records its person'),
    ('validate_course_content', 'a content check; acknowledging a finding records its person'),
    ('propose_easy_upload_mapping', 'a proposed column mapping; confirming the batch records its person'),
    ('import_validate', 'a validation of rows already recorded with their creator; confirming records its person')
$$;

create or replace function selftest.f28_j311()
returns table (fn text, exposure text, klass text)
language sql stable set search_path = public, pg_temp as $$
  with aud as (
    select p.oid, p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace and n.nspname = 'public'
     where p.prokind = 'f' and pg_get_functiondef(p.oid) ~* 'audit_write\s*\(|insert\s+into\s+public\.audit_log'
  ),
  trig_tables as (
    select distinct c.relname from pg_trigger t join pg_class c on c.oid = t.tgrelid
      join pg_namespace n on n.oid = c.relnamespace and n.nspname = 'public'
     where not t.tgisinternal and t.tgfoid in (select oid from aud)
  ),
  f as (
    select r.function_name fn, r.exposure::text exposure, pg_get_functiondef(p.oid) d
      from public.client_rpc_registry r
      join pg_proc p on p.proname = r.function_name
      join pg_namespace n on n.oid = p.pronamespace and n.nspname = 'public'
     where p.provolatile = 'v' and pg_get_functiondef(p.oid) ~* '\m(insert\s+into|update\s+public\.|delete\s+from)'
  ),
  w as (
    select f.*, array(select distinct lower(m[1]) from regexp_matches(f.d, '(?:insert\s+into|update|delete\s+from)\s+(?:public\.)?([a-z_]+)', 'gi') m) tables
      from f
  )
  select w.fn, w.exposure,
         case
           when w.d ~* 'audit_write\s*\(|insert\s+into\s+public\.audit_log' then 'A'
           when exists (select 1 from regexp_matches(w.d, 'public\.([a-z_0-9]+)\s*\(', 'gi') m join aud on aud.proname = m[1]) then 'B'
           when w.tables && array(select relname::text from trig_tables) then 'C'
           when exists (select 1 from selftest.f28_act_records() r
                         where r.tbl = any (w.tables) and w.d ~* 'current_person_id\s*\(' and w.d ~* ('\m' || r.actor_col || '\M')
                           and not has_table_privilege('authenticated', 'public.' || r.tbl, 'INSERT')
                           and not has_table_privilege('authenticated', 'public.' || r.tbl, 'UPDATE')
                           and not has_table_privilege('authenticated', 'public.' || r.tbl, 'DELETE')) then 'D'
           when w.fn in (select x.fn from selftest.f28_not_consequential() x) then 'E'
           else 'NONE'
         end
    from w
$$;
grant execute on function selftest.f28_j311() to authenticated;

create or replace function selftest.run_fable28()
returns table (id text, area text, ok boolean, detail text)
language plpgsql set search_path = public, pg_temp as $$
declare
  r record; v_probs jsonb := '{}'::jsonb; v_fatal text := ''; v_n int; v_list text;
  n_a int; n_b int; n_c int; n_d int; n_e int; n_all int;
begin
  perform selftest.as_owner();
  begin
    -- F28-J311
    begin
      select count(*), count(*) filter (where klass = 'A'), count(*) filter (where klass = 'B'), count(*) filter (where klass = 'C'),
             count(*) filter (where klass = 'D'), count(*) filter (where klass = 'E')
        into n_all, n_a, n_b, n_c, n_d, n_e from selftest.f28_j311();
      select string_agg(fn || ' (' || exposure || ')', ', ' order by fn) into v_list from selftest.f28_j311() where klass = 'NONE';
      if v_list is not null then
        v_probs := selftest.f28_note(v_probs, 'F28-J311', 'writing client-callable function(s) that leave no trace and are not declared: ' || v_list);
      end if;
      -- a declaration must match a writing client-callable function that needs it
      select string_agg(x.fn, ', ') into v_list from selftest.f28_not_consequential() x
       where not exists (select 1 from selftest.f28_j311() j where j.fn = x.fn and j.klass = 'E');
      if v_list is not null then
        v_probs := selftest.f28_note(v_probs, 'F28-J311', 'declared not consequential but no longer a writing function without a trace (remove the line): ' || v_list);
      end if;
      select string_agg(a.tbl, ', ') into v_list from selftest.f28_act_records() a
       where not exists (select 1 from information_schema.columns c where c.table_schema = 'public' and c.table_name = a.tbl and c.column_name = a.actor_col);
      if v_list is not null then
        v_probs := selftest.f28_note(v_probs, 'F28-J311', 'a declared record of the act no longer names its actor column: ' || v_list);
      end if;
      -- positive control: a planted writing function with no trace, registered as a client RPC, is caught
      execute 'create function public.f28_planted_write() returns void language plpgsql as $f$ begin update public.result_views set person_id = person_id where false; end $f$';
      insert into public.client_rpc_registry (function_name, exposure, note)
      values ('f28_planted_write', 'LEARNER', 'F28 positive control, rolled back');
      select count(*) into v_n from selftest.f28_j311() where fn = 'f28_planted_write' and klass = 'NONE';
      if v_n <> 1 then
        v_probs := selftest.f28_note(v_probs, 'F28-J311', 'a planted writing function with no trace was not caught: the rule would pass vacuously');
      end if;
    exception when others then
      v_probs := selftest.f28_note(v_probs, 'F28-J311', 'the test could not run: ' || left(sqlerrm, 200));
    end;

    raise exception 'F28_ROLLBACK';
  exception when others then
    perform selftest.as_owner();
    if sqlerrm <> 'F28_ROLLBACK' then v_fatal := sqlerrm; end if;
  end;

  for r in select * from unnest(
      array['F28-J311'],
      array['J3.11 (W6.1, CR-59) -- every consequential action leaves a trace, read over every client-callable function'],
      array[format('%s client-callable functions write: %s write the audit trail, %s call a function that does, %s write a '
        || 'table whose trigger does, %s write a record of the act naming its person (set from current_person_id(), no '
        || 'client can write it), %s are declared not a consequential staff act with their reason; none is left over, every '
        || 'declaration still matches, and a planted writing function with no trace is caught',
        n_all, n_a, n_b, n_c, n_d, n_e)]) as t(tid, tarea, tdetail)
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

  id := 'F28-DONE'; area := 'suite'; ok := v_fatal = '';
  detail := case when v_fatal = '' then 'FABLE-28 suite complete; every row rolled back'
                 else 'the suite did not complete: ' || left(v_fatal, 200) end;
  return next;
end $$;
revoke all on function selftest.run_fable28() from public;
grant execute on function selftest.run_fable28() to authenticated;
