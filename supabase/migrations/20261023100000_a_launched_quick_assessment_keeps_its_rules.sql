-- BOB-36: A LAUNCHED UJI CEPAT KEEPS ITS RULES (INV-29).
--
-- THE INVARIANT (Yazid, 29 Sep): once any assessment session references an
-- ad-hoc/Uji Cepat definition, fields that affect historical interpretation or
-- verdict must no longer be mutable in place. Subsequent changes require an
-- appropriate new definition/version rather than rewriting history.
--
-- THE DEFECT. Ad-hoc definitions are exempt from the taught-content freeze on
-- UPDATE (20260929100000, enforce_taught_content_immutable), and authenticated
-- holds UPDATE on assessment_definitions under the CAN_DRAFT policy
-- (20260912114854). save_assessment_definition refuses an ad-hoc edit, but a
-- direct table update does not. session_outcome reads the verdict live from
-- passing_rules and option order is recomputed from the live shuffle_policy, so
-- an edit after a sitting silently changed the verdict and left no trace.
-- F04-T04d reproduced it: a finished learner's «lulus» went from true to false.
--
-- THE CORRECTION, as ruled (coordinator, 29 Sep): one BEFORE UPDATE trigger on
-- assessment_definitions. When OLD is ad hoc and any assessment_sessions row
-- cites it, a change to any of INV-29's twelve interpretive fields (the list
-- save_assessment_definition names: mode, bank_type, item_count,
-- difficulty_mix, safety_critical_minimum, passing_rules, shuffle_policy,
-- hesitation_window_seconds, allows_pause, offline_tolerant,
-- late_sync_grace_seconds, attempt_limit) is refused, PR061
-- QUICK_RULES_FIXED, for every role including the owner.
--
-- AND WHERE IT WAS SAT (the gate's addition, corrected in place under D-026):
-- course_id and module_id are held too. The taught-content freeze exempts
-- ad-hoc rows, so a sat Uji Cepat could otherwise be pointed at another
-- chapter or course in place, moving its sessions to another course in the
-- evidence: the historical interpretation the invariant names. (Turning
-- is_ad_hoc to false is already refused by the freeze.)
--
-- THE STATUS CHANGES THAT LEGITIMATELY CONTINUE: NONE. An Uji Cepat is created
-- at INGESTED by launch_quick_assessment and no product path moves it on: the
-- Studio's status steps select `is_ad_hoc = false`, and nothing else writes an
-- ad-hoc definition's status. So once it has been sat its status is fixed too,
-- with the same code. What does continue is what does not interpret a sitting:
-- the title (the Studio's rename), and the review fields.
--
-- Before its first session an ad-hoc definition stays editable. Deletion once
-- sat is already refused by the sessions' foreign key (F04-T04d shows it). No
-- grant is revoked, nothing is backfilled, and a definition that is not ad hoc
-- is not read by this trigger at all, so the drafting path is untouched. The
-- existence check is SECURITY DEFINER because a teacher's own row-level view
-- of sessions must not decide whether history exists.
--
-- D-060: nothing here grades, assembles or draws a paper, or computes a metric;
-- neither the metric catalogue version nor engine_version moves.

create function public.enforce_quick_rules_fixed_once_sat() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_col text; v_new jsonb; v_old jsonb;
begin
  if not coalesce(old.is_ad_hoc, false) then return new; end if;
  if not exists (select 1 from public.assessment_sessions s where s.assessment_definition_id = old.id) then
    return new;
  end if;
  v_new := to_jsonb(new); v_old := to_jsonb(old);
  foreach v_col in array array['mode', 'bank_type', 'item_count', 'difficulty_mix', 'safety_critical_minimum',
                               'passing_rules', 'shuffle_policy', 'hesitation_window_seconds', 'allows_pause',
                               'offline_tolerant', 'late_sync_grace_seconds', 'attempt_limit', 'status',
                               'course_id', 'module_id'] loop
    if (v_new -> v_col) is distinct from (v_old -> v_col) then
      raise exception using errcode = 'PR061', detail = 'QUICK_RULES_FIXED',
        message = format('assessment_definitions.%s of an Uji Cepat is fixed once a session cites it (INV-29): launch a new one', v_col);
    end if;
  end loop;
  return new;
end $$;
revoke all on function public.enforce_quick_rules_fixed_once_sat() from public, anon, authenticated;
create trigger assessment_definitions_quick_rules_fixed before update on public.assessment_definitions
  for each row execute function public.enforce_quick_rules_fixed_once_sat();

-- ─────────────────────────────────────────────── terminal verification
do $$
declare v text; n int;
begin
  v := pg_get_functiondef('public.enforce_quick_rules_fixed_once_sat()'::regprocedure);
  select count(*) into n from unnest(array['mode', 'bank_type', 'item_count', 'difficulty_mix', 'safety_critical_minimum',
                               'passing_rules', 'shuffle_policy', 'hesitation_window_seconds', 'allows_pause',
                               'offline_tolerant', 'late_sync_grace_seconds', 'attempt_limit']) f
   where position(quote_literal(f) in v) > 0;
  if n <> 12 then raise exception 'BOB-36: % of the twelve interpretive fields are held', n; end if;
  select count(*) into n from unnest(array['status', 'course_id', 'module_id']) f where position(quote_literal(f) in v) > 0;
  if n <> 3 then raise exception 'BOB-36: status, course_id and module_id are not all held (% of 3)', n; end if;
  if not exists (select 1 from pg_trigger t where t.tgrelid = 'public.assessment_definitions'::regclass
                  and t.tgname = 'assessment_definitions_quick_rules_fixed' and not t.tgisinternal) then
    raise exception 'BOB-36: the trigger is missing';
  end if;
  if has_function_privilege('authenticated', 'public.enforce_quick_rules_fixed_once_sat()', 'execute') then
    raise exception 'BOB-36: a client can call the trigger function';
  end if;
end $$;
