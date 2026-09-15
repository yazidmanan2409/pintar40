-- FABLE-06 database suite.
--
-- Ordering: depends on fable01.sql (role-switch helpers) and fable04.sql
-- (the bootstrap-tenant fixture and its purge). Never applied as a migration;
-- never present in production.

create schema if not exists selftest;
grant usage on schema selftest to authenticated, anon;

do $$
begin
  if to_regprocedure('selftest.as_user(text)') is null
     or to_regprocedure('selftest.purge_certificates()') is null
     or to_regprocedure('selftest.first_presented_of_type(uuid, text)') is null then
    raise exception 'apply fable01.sql and fable04.sql before fable06.sql';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- THE FABLE-06 COHORT, in the D1 engineering bootstrap tenant.
--
-- WHY HERE AND NOWHERE ELSE, forced by two existing controls rather than
-- chosen: `derive_evidence_class` caps any `is_synthetic` institution at
-- SYNTHETIC, so the synthetic seed tenants can never produce OFFICIAL
-- evidence; and `assert_official_evidence_bootstrap` refuses a non-synthetic
-- tenant outside the declared bootstrap. What is left is D1, which ADR-0008
-- created so engineering verification has one place to produce OFFICIAL
-- evidence. This is that.
--
-- IT DOES NOT TOUCH D1's OWN JOURNEY. The cohort gets its own CLASS node and
-- its own assignment; the bootstrap learner keeps its class, its single
-- enrolment and its certificate. F06-P05 asserts that separation rather than
-- relying on it -- D1's lone enrolment is the below-threshold case only if it
-- sits outside this cohort's scope.
--
-- SIZED FROM A MEASUREMENT, NOT FROM AN ESTIMATE, AND THE MEASUREMENT FOUND A
-- PRODUCT PROPERTY. D1's definition draws 6 of a 12-item bank, so the naive
-- estimate is half the cohort per item. The measured spread at 80 learners was
-- 26 to 60 -- far wider than binomial, which meant the estimate was not safe to
-- size against and something structural was going on.
--
-- IT IS NOT ADAPTIVE SELECTION. `assemble_session` orders the pool by
-- `seeded_index(seed, 'item', item_id)` -- deterministic pseudo-random per
-- session -- and then fills in three passes: safety-critical FIRST, then the
-- difficulty mix, then a top-up. Measured over 160 sessions:
--
--     safety-critical  SULIT    102 presentations
--     safety-critical  SEDANG    98
--     the other ten items        64 .. 83
--
-- The two safety-critical items are drawn far more than the rest because
-- `safety_critical_minimum = 1` GUARANTEES one per session and the bank holds
-- only two. Remove those two and the remaining spread is near-binomial around
-- 76. The over-dispersion is INV-10 working, not a defect and not an adaptive
-- engine.
--
-- THE CONSEQUENCE IS A PRODUCT PROPERTY, recorded in the capstone rather than
-- only here: per-item evidence accumulates structurally unevenly, so
-- safety-critical items cross a Question Health threshold sooner than others --
-- not because they are worse, but because the product guarantees they are
-- presented. The minimum-sample threshold is therefore doing more work than it
-- appears to: it is what stops an over-exposed item being judged first, and it
-- is why the first signals an institution sees will skew safety-critical. That
-- is exposure, not quality, and an educator surface should never imply
-- otherwise.
--
-- 160 learners puts the least-sampled item at ~63 against a correctness
-- threshold of 30. The suite asserts the ACTUAL least-sampled count, so a run
-- whose draw dips reports itself rather than quietly mis-measuring.
--
-- Cooling does not apply: `exam_item_is_cooled` only looks at `bank_type =
-- 'EXAM'` and this bank is TEST. Checked, not assumed.
-- ---------------------------------------------------------------------------
create or replace function selftest.f06_purge() returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_node uuid;
begin
  select id into v_node from public.org_nodes where name = 'Kohort Analitik F06';
  if v_node is null then return; end if;
  -- Evidence is immutable by design; the harness owns these tables, is never
  -- present in production, and disables its own guards for the length of the
  -- delete exactly as purge_cycle_evidence does.
  alter table public.presented_item_views disable trigger presented_item_views_write;
  alter table public.presented_items disable trigger presented_items_immutable;
  alter table public.responses disable trigger responses_write;
  alter table public.assessment_results disable trigger assessment_results_write;
  alter table public.assessment_sessions disable trigger assessment_sessions_status;
  alter table public.assessment_sessions disable trigger assessment_sessions_provenance;

  delete from public.presented_item_views where presented_item_id in (
    select p.id from public.presented_items p join public.assessment_sessions s on s.id = p.session_id
     where s.class_node_id = v_node);
  delete from public.responses where presented_item_id in (
    select p.id from public.presented_items p join public.assessment_sessions s on s.id = p.session_id
     where s.class_node_id = v_node);
  delete from public.assessment_results where session_id in (
    select s.id from public.assessment_sessions s where s.class_node_id = v_node);
  delete from public.presented_items where session_id in (
    select s.id from public.assessment_sessions s where s.class_node_id = v_node);
  -- Reclassifications are append-only too (the product never un-files one),
  -- so the harness disables that guard for its own rows exactly as it does for
  -- the evidence tables above.
  alter table public.evidence_class_overrides disable trigger evidence_class_overrides_write;
  delete from public.evidence_class_overrides where session_id in (
    select s.id from public.assessment_sessions s where s.class_node_id = v_node);
  alter table public.evidence_class_overrides enable trigger evidence_class_overrides_write;
  delete from public.assessment_sessions where class_node_id = v_node;

  alter table public.assessment_sessions enable trigger assessment_sessions_provenance;
  alter table public.assessment_sessions enable trigger assessment_sessions_status;
  alter table public.assessment_results enable trigger assessment_results_write;
  alter table public.responses enable trigger responses_write;
  alter table public.presented_items enable trigger presented_items_immutable;
  alter table public.presented_item_views enable trigger presented_item_views_write;

  delete from public.question_health where institution_id in (
    select institution_id from public.org_nodes where id = v_node);
end $$;
revoke all on function selftest.f06_purge() from public;

create or replace function selftest.f06_cohort()
returns table (inst uuid, class_node uuid, cohort_node uuid, definition uuid,
               assignment uuid, learners int, high_item uuid, low_item uuid)
-- NOT security definer: it switches role via selftest.as_user, and PostgreSQL
-- refuses `set role` inside a definer function. f05_assign and boot_attempt are
-- plain for the same reason.
language plpgsql set search_path = public, pg_temp as $$
declare
  v_inst uuid; v_dept uuid; v_coh uuid; v_class uuid; v_period uuid; v_prog uuid;
  v_module uuid; v_course uuid; v_release uuid; v_def uuid; v_la uuid; v_aa uuid;
  v_admin uuid; v_person uuid; v_enr uuid; u uuid; i int; n int := 160; v_t text;
  v_high uuid; v_low uuid; v_sess uuid; r record; v_pos int;
begin
  select id into v_inst from public.institutions where slug = 'pintar-bootstrap-official';
  if v_inst is null then raise exception 'the D1 bootstrap tenant is absent'; end if;
  select id into v_period from public.academic_periods where institution_id = v_inst
   order by created_at limit 1;
  select id into v_prog from public.org_nodes where institution_id = v_inst and kind = 'PROGRAMME' limit 1;
  select id into v_dept from public.org_nodes where institution_id = v_inst and kind = 'DEPARTMENT' limit 1;
  select id into v_coh  from public.org_nodes where institution_id = v_inst and kind = 'COHORT' limit 1;
  select p.id into v_admin from public.persons p join public.accounts a on a.person_id = p.id
    join auth.users au on au.id = a.auth_user_id where au.email = 'boot-admin@bootstrap.pintar.test';
  select m.id, m.course_id into v_module, v_course from public.modules m
    join public.courses c on c.id = m.course_id where c.institution_id = v_inst limit 1;
  select id into v_release from public.plp_releases where institution_id = v_inst
   order by created_at desc limit 1;

  -- the cohort's own class node, under the same cohort as D1's
  select id into v_class from public.org_nodes where name = 'Kohort Analitik F06';
  if v_class is null then
    insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
    values (v_inst, v_coh, 'CLASS', 'Kohort Analitik F06', v_period)
    returning id into v_class;
  end if;

  -- D1's OWN post-test definition, not a new one. INV-04 refuses taught content
  -- under a frozen course, and the bootstrap course is frozen behind a published
  -- release -- so a fixture-owned definition is not available here and the rule
  -- is respected rather than routed around. It draws 6 of the 12-item bank
  -- (2 per difficulty band of 4), which means per-item evidence is roughly half
  -- the cohort and the cohort is sized from a MEASURED distribution rather than
  -- from that estimate.
  select id into v_def from public.assessment_definitions
   where institution_id = v_inst and mode = 'POST_TEST' and status = 'APPROVED'
   order by created_at limit 1;
  if v_def is null then raise exception 'D1 carries no approved post-test definition'; end if;

  select la, aa into v_la, v_aa
    from selftest.f05_assign('boot-admin@bootstrap.pintar.test', v_inst, v_class,
                             v_release, v_course, v_def);
  perform selftest.as_owner();

  -- the two items the fixture drives to the thresholds, chosen by stable order
  select i.id into v_high from public.items i where i.institution_id = v_inst
   order by i.id limit 1;
  select i.id into v_low from public.items i where i.institution_id = v_inst
   order by i.id offset 1 limit 1;

  -- learners, created once and reused
  for i in 1..n loop
    select au.id into u from auth.users au where au.email = format('f06-murid-%s@bootstrap.pintar.test', i);
    if u is null then
      u := gen_random_uuid();
      insert into auth.users (id, instance_id, aud, role, email, email_confirmed_at,
                              raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
                              confirmation_token, recovery_token, email_change_token_new, email_change)
      values (u, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
              format('f06-murid-%s@bootstrap.pintar.test', i), now(),
              '{"provider":"email","providers":["email"]}',
              jsonb_build_object('display_name', format('Murid Analitik %s', i)), now(), now(), '', '', '', '');
    end if;
    select a.person_id into v_person from public.accounts a where a.auth_user_id = u;
    select e.id into v_enr from public.enrollments e
     where e.person_id = v_person and e.institution_id = v_inst;
    if v_enr is null then
      insert into public.enrollments (person_id, institution_id, academic_period_id, programme_id, status)
      values (v_person, v_inst, v_period, v_prog, 'ACTIVE') returning id into v_enr;
    end if;
    if not exists (select 1 from public.memberships m where m.enrollment_id = v_enr and m.node_id = v_class) then
      insert into public.memberships (enrollment_id, node_id, academic_period_id)
      values (v_enr, v_class, v_period);
    end if;
  end loop;

  inst := v_inst; class_node := v_class; cohort_node := v_coh; definition := v_def;
  assignment := v_aa; learners := n; high_item := v_high; low_item := v_low;
  return next;
end $$;
revoke all on function selftest.f06_cohort() from public;

-- A learner cannot read `public.items` -- RLS hides the bank, which is the
-- premise `sanitized_item` exists to serve -- so the paper's shape is fetched
-- through a definer helper rather than by joining as the learner. `answer_paper`
-- solves the same problem the same way. Discovered by the loop body silently
-- never executing: the join returned zero rows and the session stayed CREATED,
-- which surfaced as an illegal CREATED -> SUBMITTED transition one call later.
create or replace function selftest.f06_paper(p_session uuid)
returns table (pid uuid, item_id uuid, item_type text)
language sql security definer set search_path = public, pg_temp as $$
  select p.id, p.item_id, i.item_type::text
    from public.presented_items p join public.items i on i.id = p.item_id
   where p.session_id = p_session order by p.position
$$;
revoke all on function selftest.f06_paper(uuid) from public;
grant execute on function selftest.f06_paper(uuid) to authenticated;

-- Same boundary, one level down: `item_options` carries `is_correct`, so a
-- learner cannot read it either. Resolving "which displayed position is the
-- right answer" is therefore a definer operation -- which is precisely the
-- knowledge the product withholds from a learner, and a fixture needs it only
-- because it is playing every part at once.
create or replace function selftest.f06_position(p_session uuid, p_item uuid, p_correct boolean)
returns integer language sql security definer set search_path = public, pg_temp as $$
  select coalesce(
    (select d.display_position from public.option_display_order(p_session, p_item) d
       join public.item_options o on o.item_id = p_item and o.label = d.label
      where o.is_correct = p_correct limit 1),
    (select d.display_position from public.option_display_order(p_session, p_item) d limit 1))
$$;
revoke all on function selftest.f06_position(uuid, uuid, boolean) from public;
grant execute on function selftest.f06_position(uuid, uuid, boolean) to authenticated;

create or replace function selftest.f06_positions(p_session uuid, p_item uuid, p_correct boolean)
returns integer[] language sql security definer set search_path = public, pg_temp as $$
  select array_agg(d.display_position order by d.display_position)
    from public.option_display_order(p_session, p_item) d
    join public.item_options o on o.item_id = p_item and o.label = d.label
   where o.is_correct = p_correct
$$;
revoke all on function selftest.f06_positions(uuid, uuid, boolean) from public;
grant execute on function selftest.f06_positions(uuid, uuid, boolean) to authenticated;

-- Drives one learner's session with PER-ITEM control, which `answer_paper`
-- cannot give: the high item is answered correctly by everyone, the low item
-- wrongly by everyone, and the rest alternate on the learner's ordinal so they
-- land near half and stay in OBSERVING.
create or replace function selftest.f06_attempt(p_email text, p_ordinal int,
                                                p_high uuid, p_low uuid)
-- Plain, not definer: it switches role per learner.
returns uuid language plpgsql set search_path = public, pg_temp as $$
declare aa uuid; s uuid; r record; v_pos int; v_want boolean; v_pos_arr int[];
begin
  perform selftest.as_user(p_email);
  select m.post_test_assignment into aa from public.my_learning_assignments() m
   where m.post_test_assignment is not null limit 1;
  if aa is null then perform selftest.as_owner(); return null; end if;
  s := public.start_learning_session(aa);
  for r in select f.pid, f.item_id, f.item_type from selftest.f06_paper(s) f loop
    if r.item_id = p_high then v_want := true;
    elsif r.item_id = p_low then v_want := false;
    else v_want := (p_ordinal % 2 = 0); end if;
    if r.item_type = 'MCQ_MULTI' then
      perform public.record_answer(r.pid, 1,
        jsonb_build_object('posisi', to_jsonb(selftest.f06_positions(s, r.item_id, v_want))));
    else
      perform public.record_answer(r.pid, 1,
        jsonb_build_object('posisi', selftest.f06_position(s, r.item_id, v_want)));
    end if;
  end loop;
  perform public.finish_my_session(s);
  perform selftest.as_owner();
  return s;
end $$;
revoke all on function selftest.f06_attempt(text, int, uuid, uuid) from public;

-- Withdraws OFFICIAL evidence the way the product does: an integrity reviewer
-- files a reclassification. `enforce_evidence_override` is INSERT-only and
-- refuses any promotion, so this is a one-way door -- which is exactly the
-- property the downward pair of Question Health edges exists to handle, and the
-- reason it deserves one real execution rather than only a probe.
-- `official_sessions` carries no client grant -- the evidence-consumer boundary
-- keeps it behind definer functions -- so the session list is resolved by a
-- definer helper and only the RECLASSIFICATION itself is performed as the
-- reviewer, which is the act that actually requires the capability.
create or replace function selftest.f06_official_for(p_item uuid)
returns table (session_id uuid) language sql security definer
set search_path = public, pg_temp as $$
  select distinct p.session_id from public.presented_items p
    join public.official_sessions s on s.id = p.session_id
   where p.item_id = p_item order by 1
$$;
revoke all on function selftest.f06_official_for(uuid) from public;
grant execute on function selftest.f06_official_for(uuid) to authenticated;

create or replace function selftest.f06_withdraw(p_item uuid, p_keep int)
returns integer language plpgsql set search_path = public, pg_temp as $$
declare r record; n int := 0; v_total int;
begin
  select count(*) into v_total from selftest.f06_official_for(p_item);
  perform selftest.as_user('boot-kaprodi@bootstrap.pintar.test');
  for r in select f.session_id from selftest.f06_official_for(p_item) f
  loop
    exit when v_total - n <= p_keep;
    insert into public.evidence_class_overrides (session_id, to_class, reason)
    values (r.session_id, 'SYNTHETIC',
            'FABLE-06 fixture: withdrawing evidence to exercise the downward Question Health edges');
    n := n + 1;
  end loop;
  perform selftest.as_owner();
  return n;
end $$;
revoke all on function selftest.f06_withdraw(uuid, int) from public;

create or replace function selftest.run_fable06()
returns table(id text, area text, ok boolean, detail text)
language plpgsql set search_path = public, pg_temp as $$
declare
  aa uuid; s uuid; v_pi uuid; v_item uuid; v_proj jsonb; v_txt text;
  v_secret text; v_correct text; n int;
begin
  -- =========================================================================
  -- F06-P01 -- sanitized_item, executed to a SUCCESSFUL RETURN.
  --
  -- WHY THIS TEST EXISTS. The happy-path sweep found that `sanitized_item` --
  -- the function deciding what a learner may see of a question -- had never
  -- run to a successful return under any migration, seed or test. It was read
  -- and it is correct. Nothing said so.
  --
  -- AND WHY IT ASSERTS ABSENCE, NOT PRESENCE. A probe that checked "it
  -- returned something" would pass on a function that returned EVERYTHING.
  -- So this takes the item's real rationale text and its real correct-option
  -- label out of the database, and requires neither to appear anywhere in the
  -- projection -- the secret itself, not a guess at what the key is called.
  -- =========================================================================
  -- THIS ORDER MATTERS. `purge_certificates` deletes every D1 session, and the
  -- analytics cohort's reclassification rows reference some of them by foreign
  -- key -- so the fixture clears its own evidence first. Widening the shared
  -- fable04 helper to know about this fixture would be the other repair and the
  -- worse one.
  perform selftest.f06_purge();
  perform selftest.purge_certificates();
  perform selftest.as_user('boot-siswa@bootstrap.pintar.test');
  select m.post_test_assignment into aa from public.my_learning_assignments() m limit 1;
  if aa is null then
    id:='F06-P01'; area:='learner projection'; ok:=false;
    detail:='the bootstrap learner sees no post-test assignment'; return next; return;
  end if;
  s := public.start_learning_session(aa);
  v_pi := selftest.first_presented_of_type(s, 'MCQ_SINGLE');

  -- the projection, as the learner who owns the session
  v_proj := public.sanitized_item(v_pi);
  v_txt := v_proj::text;

  perform selftest.as_owner();
  select p.item_id into v_item from public.presented_items p where p.id = v_pi;
  -- the actual secrets held for this item
  select o.rationale into v_secret from public.item_options o
   where o.item_id = v_item and o.rationale is not null and length(o.rationale) > 3 limit 1;
  select o.label into v_correct from public.item_options o
   where o.item_id = v_item and o.is_correct limit 1;

  id := 'F06-P01'; area := 'INV-13 learner projection / happy-path sweep';
  ok := true; detail := '';
  if v_proj is null then
    ok := false; detail := 'sanitized_item returned null for an item in the caller''s own session';
  elsif not (v_proj ? 'stem') then
    ok := false; detail := 'the projection carries no stem: a learner cannot read the question';
  elsif v_secret is not null and position(v_secret in v_txt) > 0 then
    ok := false; detail := 'the projection contains an option RATIONALE verbatim: ' || left(v_secret, 40);
  elsif v_txt ~* '"(is_correct|benar|rationale|alasan|misconception_code|kunci)"' then
    ok := false; detail := 'the projection carries a correctness-shaped key: ' || left(v_txt, 120);
  elsif jsonb_typeof(v_proj -> 'opsi') = 'array'
        and exists (select 1 from jsonb_array_elements(v_proj -> 'opsi') e
                     where e ? 'is_correct' or e ? 'label') then
    ok := false; detail := 'an option carries its identity or its correctness flag';
  else
    -- and every key present is one the declared safe set permits
    select string_agg(k, ', ') into v_txt from jsonb_object_keys(v_proj) k
     where k not in ('item_type', 'stem', 'stimulus', 'opsi');
    if v_txt is not null then
      ok := false; detail := 'the projection carries key(s) outside the declared safe set: ' || v_txt;
    else
      detail := 'sanitized_item executed to a successful return and the projection carries the stem and '
             || 'options only: the option rationale held for this item appears nowhere in it, no '
             || 'correctness-shaped key is present, no option carries its own label, and every key is '
             || 'inside the declared set {item_type, stem, stimulus, opsi}';
    end if;
  end if;
  return next;

  -- =========================================================================
  -- F06-N01 -- the same call, by somebody else, discloses nothing -- INCLUDING
  -- whether the item exists. Existence and ownership answer identically.
  -- =========================================================================
  declare v_a text; v_b text; v_fake uuid := gen_random_uuid();
  begin
    perform selftest.as_user('boot-guru@bootstrap.pintar.test');
    begin
      perform public.sanitized_item(v_pi);
      v_a := '(no refusal)';
    exception when others then v_a := sqlerrm; end;
    begin
      perform public.sanitized_item(v_fake);
      v_b := '(no refusal)';
    exception when others then v_b := sqlerrm; end;
    perform selftest.as_owner();

    id := 'F06-N01'; area := 'INV-13 / oracle removal';
    if v_a = '(no refusal)' then
      ok := false; detail := 'another person read a learner''s item projection';
    elsif v_b = '(no refusal)' then
      ok := false; detail := 'a fabricated presented-item id was accepted';
    elsif v_a is distinct from v_b then
      ok := false;
      detail := 'a real item and a fabricated one answer differently, so existence is an oracle: '
             || left(v_a, 60) || ' / ' || left(v_b, 60);
    else
      ok := true;
      detail := 'a real item belonging to someone else and a uuid that does not exist produce the '
             || 'identical refusal, so a caller learns nothing about which it was: "' || left(v_a, 70) || '"';
    end if;
    return next;
  end;

  -- =========================================================================
  -- F06-P02 -- the declared projection boundary holds on this database.
  -- =========================================================================
  id := 'F06-P02'; area := 'INV-13 / §3.4 applied to a boundary';
  select a.ok, a.detail into ok, detail from public.assert_learner_projection_is_closed() a;
  return next;

  -- =========================================================================
  -- F06-P03 / P04 / P05 -- Question Health over REAL OFFICIAL evidence.
  --
  -- The migration probes proved the mechanism. They could not prove the
  -- mechanism over evidence, and the difference was not academic: 0076's insert
  -- path wrote a row straight into its derived state, which the lifecycle guard
  -- refuses, and no probe met it because a probe's item has no evidence and its
  -- derived state IS the starting state. Eighty real sessions found it. L9, one
  -- level up.
  -- =========================================================================
  declare
    c record; i int; n_raised int; n_with int; v_mark bigint; v_trail text;
    v_hi_state text; v_lo_state text; v_hi_n int; v_lo_n int; v_min int;
    v_row record; v_outside int;
  begin
    perform selftest.f06_purge();
    select * into c from selftest.f06_cohort();
    for i in 1..c.learners loop
      perform selftest.f06_attempt(format('f06-murid-%s@bootstrap.pintar.test', i),
                                   i, c.high_item, c.low_item);
    end loop;
    perform selftest.as_user('boot-kaprodi@bootstrap.pintar.test');
    select * into v_row from public.recompute_question_health(c.inst);
    perform selftest.as_owner();

    select qh.state::text, qh.evidence_count into v_hi_state, v_hi_n
      from public.question_health qh where qh.item_id = c.high_item;
    select qh.state::text, qh.evidence_count into v_lo_state, v_lo_n
      from public.question_health qh where qh.item_id = c.low_item;
    select min(evidence_count) into v_min from public.question_health
     where institution_id = c.inst;

    id := 'F06-P03'; area := 'doc 04 §9 / INV-11 -- both threshold directions on real evidence';
    if v_min < 30 then
      ok := false;
      detail := format('the cohort under-sampled an item (%s responses, threshold 30): the draw varies '
                    || 'and %s learners were not enough this run', v_min, c.learners);
    elsif v_hi_state <> 'SIGNAL_RAISED' then
      ok := false; detail := format('an item answered correctly by everyone (%s responses) sits at %s',
                                    v_hi_n, v_hi_state);
    elsif v_lo_state <> 'SIGNAL_RAISED' then
      ok := false; detail := format('an item answered wrongly by everyone (%s responses) sits at %s',
                                    v_lo_n, v_lo_state);
    elsif v_row.signals_raised < 2 then
      ok := false; detail := format('%s signal(s) raised, expected both directions', v_row.signals_raised);
    elsif exists (select 1 from public.question_health qh
                   where qh.institution_id = c.inst and qh.state = 'SIGNAL_RAISED'
                     and qh.item_id not in (c.high_item, c.low_item)) then
      ok := false; detail := 'an item nobody drove to a threshold raised a signal anyway';
    else
      ok := true;
      detail := format('%s learners over OFFICIAL evidence: the item everyone answered correctly (%s '
                    || 'responses) and the item everyone answered wrongly (%s) both reach SIGNAL_RAISED, '
                    || 'and no other item does -- the signal fires in both directions and only where '
                    || 'driven. Least-sampled item %s responses against a threshold of 30',
                       c.learners, v_hi_n, v_lo_n, v_min);
    end if;
    return next;

    -- F06-P04 -- evidence is WITHDRAWN, and the downward pair runs on real data.
    -- `al.id`, qualified: `id` is this function's own OUT parameter and plpgsql
    -- resolves it to the variable, not the column. Third shadowing of this kind
    -- in the build -- `r`, `t`, and now `id`.
    select coalesce(max(al.id), 0) into v_mark from public.audit_log al;
    n_with := selftest.f06_withdraw(c.high_item, 29);
    perform selftest.as_user('boot-kaprodi@bootstrap.pintar.test');
    perform public.recompute_question_health(c.inst);
    perform selftest.as_owner();
    select qh.state::text, qh.evidence_count into v_hi_state, v_hi_n
      from public.question_health qh where qh.item_id = c.high_item;
    select string_agg((al.summary ->> 'from_state') || '->' || (al.summary ->> 'to_state'),
                      ' then ' order by al.id)
      into v_trail from public.audit_log al
     where al.action = 'question_health.transition'
       and al.target_id = c.high_item::text and al.id > v_mark;

    id := 'F06-P04'; area := 'ADR-0014 / the downward edges, on withdrawn evidence';
    if v_hi_state <> 'INSUFFICIENT_EVIDENCE' then
      ok := false; detail := format('after withdrawing %s session(s) the item sits at %s with %s responses',
                                    n_with, v_hi_state, v_hi_n);
    elsif v_trail is distinct from 'SIGNAL_RAISED->OBSERVING then OBSERVING->INSUFFICIENT_EVIDENCE' then
      ok := false; detail := format('the recorded walk reads "%s"', coalesce(v_trail, '(nothing)'));
    else
      ok := true;
      detail := format('%s session(s) reclassified out of OFFICIAL by an integrity reviewer dropped the '
                    || 'item to %s responses, and it walked SIGNAL_RAISED -> OBSERVING -> '
                    || 'INSUFFICIENT_EVIDENCE as two declared edges and two audit rows. The pool is '
                    || 'monotonically shrinking -- an override may only reduce eligibility -- so a state '
                    || 'resting on evidence that no longer exists is the failure these edges prevent',
                       n_with, v_hi_n);
    end if;
    return next;

    -- F06-P05 -- the cohort does not touch D1's own journey. Asserted, because
    -- the below-threshold case depends on that separation rather than assuming it.
    select count(*) into v_outside from public.enrollments e
      join public.memberships m on m.enrollment_id = e.id
     where e.institution_id = c.inst and m.node_id <> c.class_node
       and e.person_id in (select p.id from public.persons p
                             join public.accounts a on a.person_id = p.id
                             join auth.users au on au.id = a.auth_user_id
                            where au.email = 'boot-siswa@bootstrap.pintar.test');
    id := 'F06-P05'; area := 'fixture isolation in the one OFFICIAL tenant';
    if v_outside = 0 then
      ok := false;
      detail := 'the bootstrap learner is not outside the analytics cohort''s class: D1''s own journey '
             || 'and this fixture are no longer separable';
    elsif exists (select 1 from public.assessment_sessions s
                   join public.certificates ct on ct.session_id = s.id
                  where s.class_node_id = c.class_node) then
      ok := false; detail := 'the analytics cohort issued a certificate: it is meant to produce evidence, not credentials';
    else
      ok := true;
      detail := 'the analytics cohort has its own CLASS node and its own assignment; the bootstrap '
             || 'learner keeps its class and its certificate, so D1''s demonstration journey is '
             || 'untouched and its single enrolment remains the below-threshold case';
    end if;
    return next;
  end;

  -- Same ordering on the way out: the cohort's reclassifications reference D1
  -- sessions that purge_certificates is about to remove.
  perform selftest.f06_purge();
  perform selftest.purge_certificates();
  id := 'F06-DONE'; area := 'suite'; ok := true; detail := 'FABLE-06 suite complete';
  return next;
end $$;
revoke all on function selftest.run_fable06() from public;
