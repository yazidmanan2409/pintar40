-- Task 1 database-layer selftest: Quick Assessment over authorized canonical
-- content (ADR-0018). Sibling of fable01..05.sql, same row shape, same
-- throwaway `selftest` schema, same CI-01 privilege preamble.
--
-- WHAT IT REUSES AND WHY. The canonical package, the actor helper and the
-- private-course helper all come from fable05.sql: this task changes what may
-- be DRAWN over that content, not how the content or the grant is built, and a
-- second fixture would let the two drift apart. The one thing built here is the
-- two-owner paper, because nothing else in the system can produce one.
--
-- THE NEGATIVE HALF IS THE POINT. Seven refusals are required by the task and
-- each is built as far as the row that WOULD express it and then shown to fail
-- by name. Two of them are additionally exercised by planted relaxations in CI:
-- a probe that never fails proves nothing.

create schema if not exists selftest;
grant usage on schema selftest to authenticated, anon;

do $$
begin
  if to_regprocedure('selftest.as_user(text)') is null
     or to_regprocedure('selftest.answer_paper(uuid,boolean,boolean)') is null
     or to_regprocedure('selftest.canonical_package(text,boolean)') is null then
    raise exception 'apply fable01.sql, fable03.sql and fable05.sql before this file: the helpers are missing';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- The unsealed canonical fixture.
--
-- A genuine two-owner ad-hoc paper cannot be built through any authorized path:
-- it needs an item owned by the school inside a lesson owned by the canonical
-- tenant, and `enforce_taught_content_immutable` refuses that write for as long
-- as the canonical course is sealed -- which a published release makes it. That
-- refusal is itself asserted (QAC-T08), and it is the first line of the
-- boundary.
--
-- The guard behind it would then never fire, and an unfired guard is an
-- unproven one. So this helper forces the condition the authorized path cannot
-- reach: an UNSEALED canonical course, a release that was never published, and
-- a distribution row written directly rather than granted -- exactly the state
-- an auditor would construct by hand, and the reason ADR-0018 asks for the
-- boundary to be asserted rather than assumed.
--
-- It also carries a canonical-only module, which is what the is_ad_hoc gate is
-- tested against: a NON-ad-hoc definition cannot be created over the sealed
-- package at all (INV-04 refuses it at the trigger), so proving that the gate
-- is the flag rather than the seal needs content that is authorized but not
-- frozen.
--
-- SECURITY DEFINER: it writes content rows in two tenants. It never calls
-- selftest.as_user(), so there is no `set role` to be refused.
-- ---------------------------------------------------------------------------
create or replace function selftest.qac_unsealed_fixture(p_school uuid)
returns table (course uuid, modul_canon uuid, modul_mixed uuid, les_canon uuid,
               les_mixed uuid, rel uuid)
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_canon uuid; v_course uuid; v_mod uuid; v_mod2 uuid; v_les uuid; v_les2 uuid;
        v_rel uuid; v_person uuid;
begin
  select i.id into v_canon from public.institutions i where i.tenant_kind = 'PLATFORM_CANONICAL' limit 1;
  if v_canon is null then raise exception 'no PLATFORM_CANONICAL tenant exists'; end if;

  select c.id into v_course from public.courses c
   where c.institution_id = v_canon and c.title = 'QAC dua pemilik';
  if v_course is null then
    insert into public.courses (institution_id, subject, stage, grade_label, title)
    values (v_canon, 'Matematika', 'SD', 'Kelas 5', 'QAC dua pemilik') returning id into v_course;
    -- module 1: canonical content only, for the is_ad_hoc gate
    insert into public.modules (course_id, institution_id, ordinal, title)
    values (v_course, v_canon, 1, 'modul kanonik') returning id into v_mod;
    insert into public.lessons (module_id, institution_id, ordinal, title, body_markdown)
    values (v_mod, v_canon, 1, 'pelajaran kanonik', 'isi') returning id into v_les;
    insert into public.items (lesson_id, institution_id, item_type, bank_type, stem, predicted_difficulty)
    select v_les, v_canon, 'MCQ_SINGLE', 'PRACTICE', 'soal kanonik ' || g,
           case when g <= 2 then 0.8 else null end
      from generate_series(1, 4) g;

    -- module 2: the two-owner condition itself -- the school's own item inside
    -- a canonical lesson, reachable only because this course was never sealed
    insert into public.modules (course_id, institution_id, ordinal, title)
    values (v_course, v_canon, 2, 'modul campuran') returning id into v_mod2;
    insert into public.lessons (module_id, institution_id, ordinal, title, body_markdown)
    values (v_mod2, v_canon, 1, 'pelajaran campuran', 'isi') returning id into v_les2;
    insert into public.items (lesson_id, institution_id, item_type, bank_type, stem, predicted_difficulty)
    select v_les2, v_canon, 'MCQ_SINGLE', 'PRACTICE', 'soal kanonik campuran ' || g,
           case when g <= 2 then 0.8 else null end
      from generate_series(1, 4) g;
    insert into public.items (lesson_id, institution_id, item_type, bank_type, stem, predicted_difficulty)
    values (v_les2, p_school, 'MCQ_SINGLE', 'PRACTICE', 'soal sekolah di pelajaran kanonik', 0.8);

    insert into public.plp_releases (institution_id, course_id, version_label)
    values (v_canon, v_course, '9.9.9') returning id into v_rel;
  else
    select m.id into v_mod from public.modules m where m.course_id = v_course and m.ordinal = 1;
    select m.id into v_mod2 from public.modules m where m.course_id = v_course and m.ordinal = 2;
    select l.id into v_les from public.lessons l where l.module_id = v_mod order by l.ordinal limit 1;
    select l.id into v_les2 from public.lessons l where l.module_id = v_mod2 order by l.ordinal limit 1;
    select r.id into v_rel from public.plp_releases r where r.course_id = v_course limit 1;
  end if;

  -- a grant written directly: grant_release_distribution refuses an
  -- unpublished release, correctly, and this fixture is deliberately outside
  -- the authorized path
  if not exists (select 1 from public.release_distributions d
                  where d.plp_release_id = v_rel and d.institution_id = p_school
                    and d.status = 'ACTIVE') then
    select a.person_id into v_person from public.accounts a limit 1;
    insert into public.release_distributions
      (plp_release_id, institution_id, status, authorized_by_person_id)
    values (v_rel, p_school, 'ACTIVE', v_person);
  end if;

  course := v_course; modul_canon := v_mod; modul_mixed := v_mod2;
  les_canon := v_les; les_mixed := v_les2; rel := v_rel; return next;
end $$;
revoke all on function selftest.qac_unsealed_fixture(uuid) from public;

-- ---------------------------------------------------------------------------
-- What a definition's eligible set actually contains.
--
-- SECURITY DEFINER for one reason only: `eligible_items_for_definition` is
-- SECURITY INVOKER, so counting its rows from the harness would be answered by
-- the HARNESS's visibility rather than the actor's -- the owner role sees no
-- canonical item through `authorized_canonical_items` (it belongs to no
-- institution) and sees every institution-owned item through RLS. Running the
-- count inside a definer function, while impersonating a real actor, reproduces
-- exactly what `launch_quick_assessment` and `assemble_session` see, because
-- both are definer functions too and both read the actor from the JWT rather
-- than from the role.
--
-- It must therefore always be called under selftest.as_user(). Called as the
-- owner it reports zero canonical items, correctly and uselessly.
-- ---------------------------------------------------------------------------
create or replace function selftest.qac_eligible_stats(p_definition uuid)
returns table (total int, owners int, canonical int)
language sql security definer set search_path = public, pg_temp as $$
  select count(*)::int,
         count(distinct i.institution_id)::int,
         count(*) filter (where inst.tenant_kind = 'PLATFORM_CANONICAL')::int
    from public.eligible_items_for_definition(p_definition) e
    join public.items i on i.id = e.item_id
    join public.institutions inst on inst.id = i.institution_id
$$;
revoke all on function selftest.qac_eligible_stats(uuid) from public;
grant execute on function selftest.qac_eligible_stats(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- The boundary guard, reached the way the product reaches it.
--
-- `enforce_ad_hoc_single_owner` is revoked from `authenticated` on purpose: it
-- is an internal guard, called by two definer functions, not a client entry
-- point. So the harness cannot call it while impersonating an educator without
-- a definer wrapper -- and calling it as the owner instead would be worse than
-- useless, because the owner belongs to no institution and would see a
-- one-owner paper where the educator sees two.
-- ---------------------------------------------------------------------------
create or replace function selftest.qac_single_owner_check(p_definition uuid)
returns void
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  perform public.enforce_ad_hoc_single_owner(p_definition);
end $$;
revoke all on function selftest.qac_single_owner_check(uuid) from public;
grant execute on function selftest.qac_single_owner_check(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- A school's OWN publishable package.
--
-- Added for QAC-T11 (ADR-0018, amended by 0063). Everything else in this suite
-- is about canonical content; this is the other half of the release-resolution
-- rule, and nothing in the repository built a school-owned package that could
-- actually reach PUBLISHED. It is built through the ordinary lifecycle -- real
-- actors, real capabilities, the real quality gate -- and stops at a release
-- sitting at INGESTED, which is the ordinary state of a package being authored.
-- The test walks it from there.
--
-- The title carries a run tag so a re-run builds a fresh package rather than
-- meeting its own published release from last time and testing nothing.
--
-- INVOKER, not DEFINER: it impersonates real actors through selftest.as_user(),
-- and `set role` is refused inside a security-definer function.
-- ---------------------------------------------------------------------------
create or replace function selftest.qac_own_package(p_institution uuid, p_tag text)
returns table (course uuid, modul uuid, les uuid, rel uuid)
language plpgsql set search_path = public, pg_temp as $$
declare
  v_guru uuid; v_hod uuid; v_course uuid; v_mod uuid; v_les uuid; v_rel uuid;
  ob1 uuid; spec jsonb; entry jsonb; opt jsonb; it uuid; t text;
  v_status text; v_blockers text[];
begin
  v_guru := selftest.f05_actor('qac-own-guru@synthetic.pintar.test', 'EDUCATOR', p_institution);
  v_hod  := selftest.f05_actor('qac-own-hod@synthetic.pintar.test', 'HEAD_OF_DEPARTMENT', p_institution);

  insert into public.courses (institution_id, subject, stage, grade_label, title, author_person_id)
  values (p_institution, 'Matematika', 'SD', 'Kelas 5', 'QAC paket sendiri ' || p_tag, v_guru)
  returning id into v_course;
  insert into public.modules (course_id, institution_id, ordinal, title, author_person_id)
  values (v_course, p_institution, 1, 'Modul sendiri', v_guru) returning id into v_mod;
  insert into public.lessons (module_id, institution_id, ordinal, title, body_markdown,
                              page_citation, author_person_id)
  values (v_mod, p_institution, 1, 'Pelajaran sendiri',
          'Isi pelajaran tentang tangga satuan panjang, cukup untuk dibaca satu kali duduk.',
          'Bagian 1 · halaman 1-3', v_guru)
  returning id into v_les;
  insert into public.learning_objectives (lesson_id, institution_id, code, statement, bloom, is_core)
  values (v_les, p_institution, 'OB-1', 'Mengubah satuan panjang antar tingkat.', 'APPLY', true)
  returning id into ob1;
  insert into public.misconception_taxonomy (code, institution_id, label, description, remediation)
  values ('MK-OWN-01', p_institution, 'Membalik arah tangga satuan',
          'Peserta didik membagi ketika seharusnya mengali.',
          'Gambar tangganya lebih dulu, lalu tentukan arahnya sebelum menghitung.')
  on conflict do nothing;

  -- the mix a 3-question quick assessment asks for: two MUDAH, one SEDANG
  spec := jsonb_build_array(
    jsonb_build_object('d',0.74,'stem','Berapa cm dalam 3 m?','ans','A',
      'opts',jsonb_build_array('300 cm','30 cm','3.000 cm','0,3 cm')),
    jsonb_build_object('d',0.76,'stem','Berapa mm dalam 1,5 m?','ans','A',
      'opts',jsonb_build_array('1.500 mm','150 mm','15 mm','15.000 mm')),
    jsonb_build_object('d',0.55,'stem','Berapa cm dalam 0,4 km?','ans','B',
      'opts',jsonb_build_array('4.000 cm','40.000 cm','400 cm','400.000 cm')),
    jsonb_build_object('d',0.35,'stem','Berapa dm dalam 6,5 m?','ans','C',
      'opts',jsonb_build_array('6,5 dm','650 dm','65 dm','0,65 dm')));
  for entry in select * from jsonb_array_elements(spec) loop
    insert into public.items (lesson_id, institution_id, item_type, bank_type, stem, petunjuk,
      arah_berpikir, objective_ids, is_safety_critical, predicted_difficulty, page_citation,
      status, author_person_id)
    values (v_les, p_institution, 'MCQ_SINGLE', 'TEST', entry ->> 'stem',
      'Tentukan arah tangganya dulu, lalu hitung tingkatnya satu per satu.',
      'Perhatikan apakah satuannya menjadi lebih kecil atau lebih besar.',
      array[ob1], false, (entry ->> 'd')::numeric, 'Bagian 1 · halaman 1-3', 'INGESTED', v_guru)
    returning id into it;
    for opt in select * from jsonb_array_elements(entry -> 'opts') loop
      insert into public.item_options (item_id, institution_id, label, body, is_correct,
                                       rationale, misconception_code)
      values (it, p_institution,
        chr(65 + (select count(*) from public.item_options where item_id = it)::int),
        opt #>> '{}',
        chr(65 + (select count(*) from public.item_options where item_id = it)::int) = (entry ->> 'ans'),
        case when chr(65 + (select count(*) from public.item_options where item_id = it)::int) = (entry ->> 'ans')
             then 'Arah dan banyaknya tingkat sudah tepat, sehingga hasilnya benar.'
             else 'Arah tangga atau banyaknya tingkat belum tepat, sehingga hasilnya meleset.' end,
        case when chr(65 + (select count(*) from public.item_options where item_id = it)::int) = (entry ->> 'ans')
             then null else 'MK-OWN-01' end);
    end loop;
    foreach t in array array['STRUCTURED','VALIDATED','IN_REVIEW'] loop
      update public.items set status = t::public.content_status where id = it;
    end loop;
  end loop;

  foreach t in array array['STRUCTURED','VALIDATED','IN_REVIEW'] loop
    update public.lessons set status = t::public.content_status where id = v_les;
    update public.modules set status = t::public.content_status where id = v_mod;
    update public.courses set status = t::public.content_status where id = v_course;
  end loop;

  -- approved by the head of department: CAN_REVIEW, and not the author
  perform selftest.as_user('qac-own-hod@synthetic.pintar.test');
  update public.items   set status='APPROVED', reviewed_by_person_id=v_hod where lesson_id=v_les;
  update public.lessons set status='APPROVED', reviewed_by_person_id=v_hod where id=v_les;
  update public.modules set status='APPROVED', reviewed_by_person_id=v_hod where id=v_mod;
  update public.courses set status='APPROVED', reviewed_by_person_id=v_hod where id=v_course;
  perform selftest.as_owner();

  perform selftest.as_draft_author();  -- 0085: an authoring act now names its actor
  perform public.validate_course_content(v_course);
  perform selftest.as_owner();
  perform selftest.as_draft_author();  -- 0085: an authoring act now names its actor
  perform public.run_mcq_quality(v_course);
  perform selftest.as_owner();
  select pr.status, pr.blockers into v_status, v_blockers from public.publish_readiness(v_course) pr;
  if v_status <> 'READY' then
    raise exception 'the school-owned fixture is not publishable (%): % -- fix the fixture, never the gate',
      v_status, array_to_string(v_blockers, '; ');
  end if;

  -- the release exists and is NOT published: the ordinary mid-authoring state,
  -- and the exact state 0063 exists to refuse a learner against
  insert into public.plp_releases (institution_id, course_id, version_label, author_person_id)
  values (p_institution, v_course, '1.0.0', v_guru) returning id into v_rel;

  course := v_course; modul := v_mod; les := v_les; rel := v_rel; return next;
end $$;
revoke all on function selftest.qac_own_package(uuid, text) from public;

-- ---------------------------------------------------------------------------
-- Re-runnability. Grants are append-only, so they are WITHDRAWN rather than
-- deleted; every definition this suite writes by hand carries a run-unique
-- title, so nothing collides and nothing has to be removed. Sessions are
-- evidence and are never touched.
-- ---------------------------------------------------------------------------
create or replace function selftest.qac_reset() returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare r record; v_person uuid;
begin
  select a.person_id into v_person from public.accounts a limit 1;
  for r in select d.id from public.release_distributions d
            join public.plp_releases pr on pr.id = d.plp_release_id
            join public.institutions o on o.id = pr.institution_id
           where d.status = 'ACTIVE' and o.tenant_kind = 'PLATFORM_CANONICAL'
  loop
    update public.release_distributions
       set status = 'WITHDRAWN', withdrawn_at = now(), withdrawn_by_person_id = v_person
     where id = r.id;
  end loop;
end $$;
revoke all on function selftest.qac_reset() from public;

-- ---------------------------------------------------------------------------
-- The suite.
-- ---------------------------------------------------------------------------
create or replace function selftest.run_quick_canonical()
returns table (test_id text, invariant text, ok boolean, detail text)
language plpgsql set search_path = public, pg_temp as $$
declare
  p record; f record; n int; n2 int; v_row record; v_d record; r text;
  v_b uuid; v_c uuid; v_a uuid; v_node_b uuid; v_node_c uuid; v_node_a uuid;
  v_guru_b uuid; v_guru_c uuid; v_guru_a uuid; v_dist uuid;
  s uuid; s2 uuid; v_def uuid; v_assign uuid; v_open uuid; v_open_assign uuid;
  v_priv_c uuid; v_priv_mod uuid; v_tag text; v_refused boolean; v_msg text;
  v_hash_before text; v_hash_after text; v_sha_before text; st record;
  own record; v_admin uuid; v_hod uuid; s3 uuid; can2 record; v_dist2 uuid;
  t0 timestamptz := clock_timestamp();
begin
  perform selftest.as_owner();
  perform selftest.qac_reset();
  select * into p from selftest.canonical_package();
  v_tag := to_char(clock_timestamp(), 'DDHH24MISSUS');

  select i.id into v_a from public.institutions i where i.slug like 'synth-alpha-%' limit 1;
  select i.id into v_b from public.institutions i where i.slug like 'synth-beta-%' limit 1;
  select i.id into v_c from public.institutions i where i.slug like 'synth-siklus-%' limit 1;
  select m.node_id into v_node_a from public.memberships m
    join public.org_nodes n on n.id = m.node_id
    join public.enrollments e on e.id = m.enrollment_id
   where e.institution_id = v_a and n.kind = 'CLASS' and m.valid_to is null limit 1;
  select m.node_id into v_node_b from public.memberships m
    join public.org_nodes n on n.id = m.node_id
    join public.enrollments e on e.id = m.enrollment_id
   where e.institution_id = v_b and n.kind = 'CLASS' and m.valid_to is null limit 1;
  select m.node_id into v_node_c from public.memberships m
    join public.org_nodes n on n.id = m.node_id
    join public.enrollments e on e.id = m.enrollment_id
   where e.institution_id = v_c and n.kind = 'CLASS' and m.valid_to is null limit 1;

  select * into f from selftest.qac_unsealed_fixture(v_b);

  v_guru_b := selftest.f05_actor('qac-guru-b@synthetic.pintar.test', 'EDUCATOR', v_b);
  v_guru_c := selftest.f05_actor('qac-guru-c@synthetic.pintar.test', 'EDUCATOR', v_c);
  v_guru_a := selftest.f05_actor('qac-guru-a@synthetic.pintar.test', 'EDUCATOR', v_a);

  -- =========================================================================
  -- QAC-T01  NEGATIVE 1: no distribution, no quick assessment
  -- =========================================================================
  ok := true; detail := '';
  if public.release_is_distributed_to(p.rel, v_b) then
    ok := false; detail := detail || 'the canonical release reads as distributed before any grant exists; ';
  end if;
  perform selftest.as_user('qac-guru-b@synthetic.pintar.test');
  begin
    perform public.launch_quick_assessment(v_node_b, p.modul, 3, 30);
    perform selftest.as_owner();
    ok := false; detail := detail || 'a school launched a quick assessment over canonical content it holds no grant for; ';
  exception when others then
    perform selftest.as_owner();
    if sqlerrm !~ 'another institution \(INV-13\)' then
      ok := false; detail := detail || format('refused for the wrong reason: %s; ', sqlerrm);
    end if;
  end;
  test_id := 'QAC-T01'; invariant := 'ADR-0018 / INV-13';
  if ok then detail := 'with no distribution grant the launch is refused by name, before any definition or assignment exists'; end if;
  return next;

  -- =========================================================================
  -- QAC-T02  POSITIVE: an authorized canonical module is quick-assessable, and
  --          the evidence names both tenants in the right places
  -- =========================================================================
  ok := true; detail := '';
  perform selftest.as_user('kanonik-admin@pintar.test');
  v_dist := public.grant_release_distribution(p.rel, v_b, 'task 1 School B');
  perform selftest.as_owner();

  perform selftest.as_user('qac-guru-b@synthetic.pintar.test');
  select * into v_row from public.launch_quick_assessment(v_node_b, p.modul, 3, 30);
  perform selftest.as_owner();
  v_def := v_row.assessment_definition_id; v_assign := v_row.assessment_assignment_id;

  select d.institution_id as di, d.is_ad_hoc as adhoc, d.module_id as mid, a.institution_id as ai
    into v_d from public.assessment_definitions d
    join public.assessment_assignments a on a.id = v_assign
   where d.id = v_def;
  if v_d.di is distinct from v_b then
    ok := false; detail := detail || 'the definition is owned by the content''s author, not the assigning school; ';
  end if;
  if v_d.ai is distinct from v_b then
    ok := false; detail := detail || 'the assignment is owned by the content''s author, not the assigning school; ';
  end if;
  if not v_d.adhoc then ok := false; detail := detail || 'the quick assessment is not ad-hoc; '; end if;
  if v_d.mid is distinct from p.modul then ok := false; detail := detail || 'the definition is not bound to the canonical module; '; end if;

  -- the items draw, and they are the canonical tenant's, asked as the educator
  perform selftest.as_user('qac-guru-b@synthetic.pintar.test');
  select * into st from selftest.qac_eligible_stats(v_def);
  perform selftest.as_owner();
  if st.canonical < 3 then
    ok := false; detail := detail || format('only %s canonical item(s) are eligible; ', st.canonical);
  end if;
  if st.owners <> 1 then
    ok := false; detail := detail || format('the paper resolves to %s content owner(s); ', st.owners);
  end if;

  -- a learner completes it
  perform selftest.as_user('beta-siswa-1@synthetic.pintar.test');
  s := public.start_learning_session(v_assign);
  n2 := selftest.answer_paper(s, true);
  perform public.finish_my_session(s);
  perform selftest.as_owner();
  if n2 = 0 then ok := false; detail := detail || 'the quick assessment answered nothing; '; end if;

  select ss.institution_id as si, ss.plp_release_id as ri, ss.evidence_class::text as ec,
         ss.enrollment_id as ei, ss.class_node_id as ci, ss.assessment_definition_id as di
    into v_d from public.assessment_sessions ss where ss.id = s;
  if v_d.si is distinct from v_b then ok := false; detail := detail || 'the session is not the consuming school''s; '; end if;
  if v_d.ri is distinct from p.rel then ok := false; detail := detail || 'the session does not cite the canonical release; '; end if;
  if v_d.di is distinct from v_def then ok := false; detail := detail || 'the session does not cite the launched definition; '; end if;
  if v_d.ei is null or v_d.ci is null then
    ok := false; detail := detail || 'the school''s own enrolment and class are missing from the provenance; ';
  end if;
  if v_d.ec is distinct from public.derive_evidence_class(v_b, 'ONLINE')::text then
    ok := false; detail := detail || format('evidence_class is %s, not what the school''s own cap model derives; ', v_d.ec);
  end if;
  select count(*) into n from public.presented_items pi join public.items i on i.id = pi.item_id
   where pi.session_id = s and i.institution_id = p.canon;
  if n <> 3 then ok := false; detail := detail || format('the paper presented %s canonical item(s), not 3; ', n); end if;
  select count(*) into n from public.presented_items pi where pi.session_id = s and pi.institution_id <> v_b;
  if n <> 0 then ok := false; detail := detail || 'a presented row was stamped with the content owner''s tenant; '; end if;
  select count(*) into n from public.assessment_results where session_id = s;
  if n < 1 then ok := false; detail := detail || 'the completed attempt produced no result; '; end if;
  select count(*) into n from public.courses c where c.id = p.course and c.institution_id = v_b;
  if n <> 0 then ok := false; detail := detail || 'the canonical course became school-owned; '; end if;

  test_id := 'QAC-T02'; invariant := 'ADR-0018 / ADR-0015 §5.6 / INV-33';
  if ok then detail := format('an educator launched over an authorized canonical module, %s answers were recorded, and the session cites the canonical release and item identity with the school''s institution, enrolment, class and derived evidence class', n2); end if;
  return next;

  -- =========================================================================
  -- QAC-T03  NEGATIVE 2: withdrawal blocks new use, interrupts nothing
  -- =========================================================================
  ok := true; detail := '';
  -- a second learner attempt is started and LEFT OPEN, so withdrawal has
  -- something in flight to not interrupt
  perform selftest.as_user('qac-guru-b@synthetic.pintar.test');
  select * into v_row from public.launch_quick_assessment(v_node_b, p.modul, 3, 30);
  perform selftest.as_owner();
  v_open_assign := v_row.assessment_assignment_id;
  perform selftest.as_user('beta-siswa-1@synthetic.pintar.test');
  v_open := public.start_learning_session(v_open_assign);
  perform selftest.as_owner();

  perform selftest.as_user('kanonik-admin@pintar.test');
  perform public.withdraw_release_distribution(v_dist, 'task 1 withdrawal');
  perform selftest.as_owner();
  if public.release_is_distributed_to(p.rel, v_b) then
    ok := false; detail := detail || 'a withdrawn grant still reads as distributed; ';
  end if;

  -- new use: refused from the next attempt
  perform selftest.as_user('qac-guru-b@synthetic.pintar.test');
  begin
    perform public.launch_quick_assessment(v_node_b, p.modul, 3, 30);
    perform selftest.as_owner();
    ok := false; detail := detail || 'a new quick assessment was launched after withdrawal; ';
  exception when others then
    perform selftest.as_owner();
    if sqlerrm !~ 'another institution \(INV-13\)' then
      ok := false; detail := detail || format('the new launch was refused for the wrong reason: %s; ', sqlerrm);
    end if;
  end;
  -- and a new session against the existing assignment is refused too
  perform selftest.as_user('beta-siswa-1@synthetic.pintar.test');
  begin
    s2 := public.start_learning_session(v_assign);
    perform selftest.as_owner();
    ok := false; detail := detail || 'a new session started against a withdrawn grant; ';
  exception when others then
    perform selftest.as_owner();
  end;

  -- the started session continues to its deadline: INV-27, not an INV-17 event
  select ss.status::text as st into v_d from public.assessment_sessions ss where ss.id = v_open;
  if v_d.st in ('ABANDONED','EXPIRED','VOID') then
    ok := false; detail := detail || format('withdrawal terminated a session already in flight (%s); ', v_d.st);
  end if;
  perform selftest.as_user('beta-siswa-1@synthetic.pintar.test');
  begin
    n := selftest.answer_paper(v_open, true);
    perform public.finish_my_session(v_open);
    perform selftest.as_owner();
    if n = 0 then ok := false; detail := detail || 'the in-flight attempt could no longer be answered; '; end if;
  exception when others then
    perform selftest.as_owner();
    ok := false; detail := detail || format('the in-flight attempt was interrupted: %s; ', sqlerrm);
  end;

  -- completed evidence untouched, and the assignment row retained
  select count(*) into n from public.assessment_sessions where id = s;
  select count(*) into n2 from public.assessment_results where session_id = s;
  if n <> 1 or n2 < 1 then ok := false; detail := detail || 'completed evidence did not survive withdrawal; '; end if;
  select count(*) into n from public.assessment_assignments where id = v_assign;
  if n <> 1 then ok := false; detail := detail || 'the assessment assignment row was deleted; '; end if;
  select count(*) into n from public.release_distributions where id = v_dist;
  if n <> 1 then ok := false; detail := detail || 'withdrawal deleted the grant row; '; end if;

  test_id := 'QAC-T03'; invariant := 'ADR-0018 / ADR-0015 §5.2 / INV-27 / INV-18';
  if ok then detail := 'withdrawal refused a new launch and a new session, left an attempt already in flight to finish and be scored, kept the assignment and grant rows, and touched no completed evidence'; end if;
  return next;

  -- restore the grant for the tests that follow
  perform selftest.as_user('kanonik-admin@pintar.test');
  v_dist := public.grant_release_distribution(p.rel, v_b, 'task 1 School B again');
  perform selftest.as_owner();

  -- =========================================================================
  -- QAC-T04  NEGATIVE 3: School B cannot reach School C's supplementary items
  -- =========================================================================
  ok := true; detail := '';
  v_priv_c := selftest.f05_private_course(v_c, 'QAC kursus privat C');
  select m.id into v_priv_mod from public.modules m where m.course_id = v_priv_c order by m.ordinal limit 1;

  perform selftest.as_user('qac-guru-b@synthetic.pintar.test');
  begin
    perform public.launch_quick_assessment(v_node_b, v_priv_mod, 3, 30);
    perform selftest.as_owner();
    ok := false; detail := detail || 'School B launched a quick assessment over School C''s own module; ';
  exception when others then
    perform selftest.as_owner();
    if sqlerrm !~ 'another institution \(INV-13\)' then
      ok := false; detail := detail || format('refused for the wrong reason: %s; ', sqlerrm);
    end if;
  end;
  -- and the eligibility path says the same thing when asked directly
  insert into public.assessment_definitions
    (institution_id, module_id, title, mode, bank_type, item_count, safety_critical_minimum,
     difficulty_mix, passing_rules, status, is_ad_hoc)
  values (v_b, v_priv_mod, 'QAC lintas sekolah ' || v_tag, 'QUICK', 'PRACTICE', 3, 0,
          '{"MUDAH":3}'::jsonb, '{"mastery_min":0.6}'::jsonb, 'INGESTED', true)
  returning id into v_def;
  perform selftest.as_user('qac-guru-b@synthetic.pintar.test');
  select * into st from selftest.qac_eligible_stats(v_def);
  perform selftest.as_owner();
  if st.total <> 0 then
    ok := false; detail := detail || format('an ad-hoc paper at School B drew %s of School C''s item(s); ', st.total);
  end if;
  test_id := 'QAC-T04'; invariant := 'ADR-0018 / INV-01 / INV-13';
  if ok then detail := 'another school''s supplementary content is refused at the launcher by name and draws nothing through the eligibility path; the relaxation is canonical-only'; end if;
  return next;

  -- =========================================================================
  -- QAC-T05  NEGATIVE 4: a grant to School B does not authorize School C
  -- =========================================================================
  ok := true; detail := '';
  if public.release_is_distributed_to(p.rel, v_c) then
    ok := false; detail := detail || 'School C reads as distributed on School B''s grant; ';
  end if;
  perform selftest.as_user('qac-guru-c@synthetic.pintar.test');
  begin
    perform public.launch_quick_assessment(v_node_c, p.modul, 3, 30);
    perform selftest.as_owner();
    ok := false; detail := detail || 'School C launched over canonical content authorized to School B; ';
  exception when others then
    perform selftest.as_owner();
    if sqlerrm !~ 'another institution \(INV-13\)' then
      ok := false; detail := detail || format('refused for the wrong reason: %s; ', sqlerrm);
    end if;
  end;
  -- asked through the accessor directly. There is no institution argument to
  -- substitute -- the accessor derives the institution from the caller -- so
  -- what is being proved here is that School C's own answer is empty while
  -- School B's is not, on the same grant and in the same second.
  perform selftest.as_user('qac-guru-c@synthetic.pintar.test');
  select count(*) into n from public.authorized_canonical_items()
   where owner_institution_id = p.canon;
  perform selftest.as_owner();
  if n <> 0 then
    ok := false; detail := detail || format('a School C caller reached %s canonical item(s) on School B''s grant; ', n);
  end if;
  perform selftest.as_user('qac-guru-b@synthetic.pintar.test');
  select count(*) into n2 from public.authorized_canonical_items()
   where owner_institution_id = p.canon and consuming_institution_id = v_b;
  perform selftest.as_owner();
  if n2 = 0 then
    ok := false; detail := detail || 'School B reached nothing either, so the comparison proves nothing; ';
  end if;
  select count(*) into n from pg_proc pr join pg_namespace ns on ns.oid = pr.pronamespace
   where ns.nspname = 'public' and pr.proname = 'authorized_canonical_items' and pr.pronargs > 0;
  if n > 0 then
    ok := false; detail := detail || 'the accessor accepts a caller-supplied institution; ';
  end if;
  test_id := 'QAC-T05'; invariant := 'ADR-0018 / ADR-0015 §5.3 / INV-13';
  if ok then detail := format('one school''s authorization is unusable by another: the launcher refuses School C by name, and the accessor -- which takes no institution argument at all -- returns 0 canonical items to School C and %s to School B on the same grant', n2); end if;
  return next;

  -- =========================================================================
  -- QAC-T06  NEGATIVE 5: the canonical item stays immutable and canonical-owned
  -- =========================================================================
  ok := true; detail := '';
  select c.content_sha256 into v_sha_before from public.plp_releases c where c.id = p.rel;
  perform selftest.as_user('qac-guru-b@synthetic.pintar.test');
  foreach r in array array['update public.items set stem = ''dibajak'' where lesson_id = $1',
                           'update public.items set bank_type = ''EXAM'' where lesson_id = $1',
                           'update public.items set institution_id = $2 where lesson_id = $1',
                           'delete from public.items where lesson_id = $1',
                           'update public.lessons set body_markdown = ''dibajak'' where id = $1',
                           'insert into public.items (lesson_id, institution_id, item_type, bank_type, stem) values ($1, $2, ''MCQ_SINGLE'', ''PRACTICE'', ''sisipan'')']
  loop
    begin
      -- GET DIAGNOSTICS, not FOUND: EXECUTE does not set FOUND, so reading it
      -- here would report whatever the previous statement left behind. The
      -- first draft of this test did exactly that and reported six writes that
      -- never happened.
      execute r using p.les, v_b;
      get diagnostics n = row_count;
      if n > 0 then
        perform selftest.as_owner();
        ok := false; detail := detail || format('a consuming school wrote %s canonical row(s): %s; ', n, left(r, 48));
        perform selftest.as_user('qac-guru-b@synthetic.pintar.test');
      end if;
    exception when others then null; end;
  end loop;
  perform selftest.as_owner();
  select count(*) into n from public.items i where i.lesson_id = p.les and i.institution_id <> p.canon;
  if n <> 0 then ok := false; detail := detail || format('%s canonical item(s) changed owner; ', n); end if;
  select count(*) into n from public.items i where i.lesson_id = p.les and i.stem = 'dibajak';
  if n <> 0 then ok := false; detail := detail || 'a canonical stem was rewritten; '; end if;
  select c.content_sha256 into v_hash_after from public.plp_releases c where c.id = p.rel;
  if v_hash_after is distinct from v_sha_before then
    ok := false; detail := detail || 'the sealed release hash moved (INV-04); ';
  end if;
  test_id := 'QAC-T06'; invariant := 'ADR-0018 / INV-04 / INV-01';
  if ok then detail := 'six write attempts from the consuming school against canonical content were each refused, the items kept their owner and their text, and the sealed release hash did not move'; end if;
  return next;

  -- =========================================================================
  -- QAC-T07  NEGATIVE 6: a non-ad-hoc definition still refuses canonical items
  -- =========================================================================
  ok := true; detail := '';
  insert into public.assessment_definitions
    (institution_id, module_id, title, mode, bank_type, item_count, safety_critical_minimum,
     difficulty_mix, passing_rules, status, is_ad_hoc)
  values (v_b, f.modul_canon, 'QAC bukan ad hoc ' || v_tag, 'PRACTICE', 'PRACTICE', 3, 0,
          '{"MUDAH":3}'::jsonb, '{"mastery_min":0.6}'::jsonb, 'INGESTED', false)
  returning id into v_def;
  perform selftest.as_user('qac-guru-b@synthetic.pintar.test');
  select * into st from selftest.qac_eligible_stats(v_def);
  perform selftest.as_owner();
  n := st.canonical;
  if n <> 0 then
    ok := false; detail := detail || format('a non-ad-hoc definition drew %s canonical item(s); the gate is not is_ad_hoc; ', n);
  end if;
  -- the SAME content, the same scope, the same tier -- differing only in the
  -- flag -- draws them. Two rows rather than one flipped row: un-flagging an
  -- ad-hoc definition is refused by INV-04, correctly, and a probe that has to
  -- break an invariant to run is not a probe.
  insert into public.assessment_definitions
    (institution_id, module_id, title, mode, bank_type, item_count, safety_critical_minimum,
     difficulty_mix, passing_rules, status, is_ad_hoc)
  values (v_b, f.modul_canon, 'QAC memang ad hoc ' || v_tag, 'PRACTICE', 'PRACTICE', 3, 0,
          '{"MUDAH":3}'::jsonb, '{"mastery_min":0.6}'::jsonb, 'INGESTED', true)
  returning id into v_def;
  perform selftest.as_user('qac-guru-b@synthetic.pintar.test');
  select * into st from selftest.qac_eligible_stats(v_def);
  perform selftest.as_owner();
  n2 := st.canonical;
  if n2 = 0 then
    ok := false; detail := detail || 'the ad-hoc twin drew nothing either, so the comparison proves nothing; ';
  end if;
  test_id := 'QAC-T07'; invariant := 'ADR-0018 / INV-26';
  if ok then detail := format('a non-ad-hoc definition over the same authorized module draws 0 canonical items and the same row draws %s when ad-hoc: the relaxation is gated on the flag and on nothing else', n2); end if;
  return next;

  -- =========================================================================
  -- QAC-T08  NEGATIVE 7: two owners in one ad-hoc paper, refused
  -- =========================================================================
  ok := true; detail := '';
  -- first line: the authorized path cannot even build one
  perform selftest.as_user('qac-guru-b@synthetic.pintar.test');
  begin
    insert into public.items (lesson_id, institution_id, item_type, bank_type, stem)
    values (p.les, v_b, 'MCQ_SINGLE', 'PRACTICE', 'sisipan dua pemilik');
    perform selftest.as_owner();
    ok := false; detail := detail || 'a school added its own item inside a sealed canonical lesson; ';
  exception when others then perform selftest.as_owner(); end;

  -- second line: forced past that, the boundary itself refuses
  insert into public.assessment_definitions
    (institution_id, module_id, title, mode, bank_type, item_count, safety_critical_minimum,
     difficulty_mix, passing_rules, status, is_ad_hoc)
  values (v_b, f.modul_mixed, 'QAC dua pemilik ' || v_tag, 'QUICK', 'PRACTICE', 3, 0,
          '{"MUDAH":3}'::jsonb, '{"mastery_min":0.6}'::jsonb, 'INGESTED', true)
  returning id into v_def;
  perform selftest.as_user('qac-guru-b@synthetic.pintar.test');
  select * into st from selftest.qac_eligible_stats(v_def);
  perform selftest.as_owner();
  n := st.owners;
  if n <> 2 then
    ok := false; detail := detail || format('the fixture built a %s-owner paper, so the refusal below would be vacuous; ', n);
  end if;
  v_refused := false; v_msg := '';
  begin
    perform selftest.as_user('qac-guru-b@synthetic.pintar.test');
    perform selftest.qac_single_owner_check(v_def);
    perform selftest.as_owner();
  exception when others then
    perform selftest.as_owner();
    v_refused := sqlerrm ~ 'one content owner'; v_msg := sqlerrm;
  end;
  if not v_refused then
    ok := false; detail := detail || format('a two-owner ad-hoc paper was not refused at the boundary (%s); ', coalesce(v_msg, 'no error'));
  end if;
  -- and the draw refuses it too, so a paper built past the launcher is stopped
  v_refused := false;
  begin
    perform selftest.as_user('qac-guru-b@synthetic.pintar.test');
    perform public.launch_quick_assessment(v_node_b, f.modul_mixed, 3, 30);
    perform selftest.as_owner();
  exception when others then
    perform selftest.as_owner();
    v_refused := sqlerrm ~ 'one content owner';
  end;
  if not v_refused then
    ok := false; detail := detail || 'the launcher created a two-owner quick assessment; ';
  end if;
  test_id := 'QAC-T08'; invariant := 'ADR-0018';
  if ok then detail := 'the authorized path cannot build a two-owner paper at all, and a paper forced into that state by hand is refused by name at the boundary and at the launcher'; end if;
  return next;

  -- =========================================================================
  -- QAC-T09  PROPERTY: every pre-existing non-ad-hoc definition draws an
  --          IDENTICAL set -- equality, not absence of error
  -- =========================================================================
  ok := true; detail := '';
  with ref as (
    select d.id as def, i.id as item
      from public.assessment_definitions d
      join public.lessons l on true
      join public.modules m on m.id = l.module_id
      join public.items i on i.lesson_id = l.id
     where not d.is_ad_hoc
       and i.institution_id = d.institution_id
       and public.item_is_drawable(i.bank_type, d.bank_type)
       and ((d.course_id is not null and m.course_id = d.course_id)
         or (d.module_id is not null and l.module_id = d.module_id))
  ), live as (
    select d.id as def, e.item_id as item
      from public.assessment_definitions d
      join public.eligible_items_for_definition(d.id) e on true
     where not d.is_ad_hoc
  ), diff as (
    (select * from ref except select * from live)
    union all
    (select * from live except select * from ref)
  )
  select count(*) into n from diff;
  select count(*) into n2 from public.assessment_definitions where not is_ad_hoc;
  if n <> 0 then
    ok := false; detail := detail || format('%s (definition, item) pair(s) differ from the pre-0061 eligibility set; ', n);
  end if;
  if n2 = 0 then
    ok := false; detail := detail || 'there is no non-ad-hoc definition to compare, so the property proves nothing; ';
  end if;
  test_id := 'QAC-T09'; invariant := 'ADR-0018 / INV-26 regression';
  if ok then detail := format('over %s non-ad-hoc definition(s) the eligible set is identical to the pre-0061 rule, compared as a set in both directions', n2); end if;
  return next;

  -- =========================================================================
  -- QAC-T10  INV-04: an ad-hoc paper is outside the hash, permanently
  -- =========================================================================
  ok := true; detail := '';
  select md5(public.content_canonical_payload(p.course)::text) into v_hash_before;
  insert into public.assessment_definitions
    (institution_id, course_id, title, mode, bank_type, item_count, safety_critical_minimum,
     difficulty_mix, passing_rules, status, is_ad_hoc)
  values (v_b, p.course, 'QAC luar hash ' || v_tag, 'QUICK', 'PRACTICE', 3, 0,
          '{"MUDAH":3}'::jsonb, '{"mastery_min":0.6}'::jsonb, 'INGESTED', true)
  returning id into v_def;
  select md5(public.content_canonical_payload(p.course)::text) into v_hash_after;
  if v_hash_before is distinct from v_hash_after then
    ok := false; detail := detail || 'an ad-hoc definition moved the content payload digest; ';
  end if;
  begin
    update public.assessment_definitions set is_ad_hoc = false where id = v_def;
    ok := false; detail := detail || 'an ad-hoc definition was relabelled into the release payload; ';
  exception when others then null; end;
  if pg_get_functiondef('public.content_canonical_payload(uuid)'::regprocedure) ~ 'authorized_canonical_items' then
    ok := false; detail := detail || 'the hash basis now reads the canonical eligibility accessor; ';
  end if;
  test_id := 'QAC-T10'; invariant := 'INV-04 / ADR-0011';
  if ok then detail := 'an ad-hoc quick assessment over a sealed canonical course moves the payload digest by nothing, cannot be relabelled into a release, and the hash basis does not read this task''s additions'; end if;
  return next;

  -- =========================================================================
  -- QAC-T11  NEGATIVE 8: an ad-hoc session cites a PUBLISHED release, or it
  --          does not start (ADR-0018 as amended by 0063)
  --
  --          Found by Claude 1's second reading of Task 1, reproduced against
  --          a seeded database at 0062, and repaired in 0063. Before the
  --          repair, a school's own course carrying only an unpublished
  --          release opened a session that cited it -- and because an unsealed
  --          course is still editable, the very items the learner answered
  --          could be changed afterwards. The session's plp_release_id is
  --          supposed to BE the frozen answer to "what did this learner see"
  --          (doc 07, doc 08); against an unsealed release it pinned nothing.
  --
  --          One course, three states, one variable. The launch is identical
  --          in all three -- same definition, same pool, same assignment --
  --          so what changes the outcome is the release's status and nothing
  --          else.
  -- =========================================================================
  ok := true; detail := '';
  v_hod   := selftest.f05_actor('qac-own-hod@synthetic.pintar.test', 'HEAD_OF_DEPARTMENT', v_b);
  v_admin := selftest.f05_actor('qac-own-admin@synthetic.pintar.test', 'INSTITUTION_ADMIN', v_b);
  select * into own from selftest.qac_own_package(v_b, v_tag);

  -- (a) release INGESTED, course NOT sealed -- the case that was wrong
  if public.content_is_sealed(own.course) then
    ok := false; detail := detail || 'the fixture course is already sealed; state (a) is not the broken case; ';
  end if;
  perform selftest.as_user('qac-guru-b@synthetic.pintar.test');
  select * into v_row from public.launch_quick_assessment(v_node_b, own.modul, 3, 30);
  perform selftest.as_owner();
  v_open_assign := v_row.assessment_assignment_id;
  if v_open_assign is null then
    ok := false; detail := detail || 'the launch over the school''s own draft chapter failed, so the refusals below prove nothing; ';
  end if;
  select count(*) into n from public.drawable_items_for_definition(v_row.assessment_definition_id);
  if n < 3 then
    ok := false; detail := detail || format('the own-content paper has %s drawable item(s); a refusal would be about the pool, not the release; ', n);
  end if;

  v_refused := false; v_msg := '';
  perform selftest.as_user('beta-siswa-1@synthetic.pintar.test');
  begin
    s2 := public.start_learning_session(v_open_assign);
    perform selftest.as_owner();
    ok := false; detail := detail || 'a learner sat a quick assessment against an INGESTED release; ';
  exception when others then
    perform selftest.as_owner();
    v_msg := sqlerrm;
    v_refused := sqlerrm ~ 'cannot use right now';
  end;
  if not v_refused and v_msg <> '' then
    ok := false; detail := detail || format('the unpublished start was refused for the wrong reason: %s; ', v_msg);
  end if;
  select count(*) into n from public.assessment_sessions ss where ss.assessment_assignment_id = v_open_assign;
  if n <> 0 then ok := false; detail := detail || format('the refused start left %s session row(s); ', n); end if;

  -- (b) FROZEN: sealed, but still not published. Publication is the gate, not
  --     sealing -- doc 08's "publication is not assignment".
  perform selftest.as_user('qac-own-hod@synthetic.pintar.test');
  foreach r in array array['STRUCTURED','VALIDATED','IN_REVIEW'] loop
    update public.plp_releases set status = r::public.content_status where id = own.rel;
  end loop;
  update public.plp_releases set status = 'APPROVED', reviewed_by_person_id = v_hod where id = own.rel;
  update public.plp_releases set status = 'FROZEN' where id = own.rel;
  perform selftest.as_owner();
  if not public.content_is_sealed(own.course) then
    ok := false; detail := detail || 'the course did not seal at FROZEN, so state (b) is not what it claims; ';
  end if;
  v_refused := false;
  perform selftest.as_user('beta-siswa-1@synthetic.pintar.test');
  begin
    s2 := public.start_learning_session(v_open_assign);
    perform selftest.as_owner();
    ok := false; detail := detail || 'a learner sat a quick assessment against a FROZEN but unpublished release; ';
  exception when others then
    perform selftest.as_owner();
    v_refused := sqlerrm ~ 'cannot use right now';
  end;
  if not v_refused then
    ok := false; detail := detail || 'the frozen-but-unpublished start was refused for the wrong reason; ';
  end if;

  -- (c) PUBLISHED: the same assignment, the same pool, now allowed -- so the
  --     repair narrowed the rule rather than closing the path
  perform selftest.as_user('qac-own-admin@synthetic.pintar.test');
  perform public.publish_release(own.rel);
  perform selftest.as_owner();
  -- guarded, like every other start in this test: a suite that aborts on a
  -- failure reports nothing, and this is the state a planted defect reaches
  -- with the single attempt already spent
  s2 := null; n2 := 0;
  perform selftest.as_user('beta-siswa-1@synthetic.pintar.test');
  begin
    s2 := public.start_learning_session(v_open_assign);
    n2 := selftest.answer_paper(s2, true);
    perform public.finish_my_session(s2);
    perform selftest.as_owner();
  exception when others then
    perform selftest.as_owner();
    ok := false;
    detail := detail || format('the published release did not open a scored session: %s; ', sqlerrm);
  end;
  if s2 is not null then
    select ss.plp_release_id as ri, ss.institution_id as si, ss.evidence_class::text as ec
      into v_d from public.assessment_sessions ss where ss.id = s2;
    if v_d.ri is distinct from own.rel then
      ok := false; detail := detail || 'the session does not cite the school''s own published release; ';
    end if;
    if v_d.si is distinct from v_b then
      ok := false; detail := detail || 'the own-content session is not the school''s; ';
    end if;
    if n2 = 0 then ok := false; detail := detail || 'the own-content attempt answered nothing; '; end if;
    -- and the binding now pins: the items the learner saw are sealed against edits
    perform selftest.as_user('qac-own-guru@synthetic.pintar.test');
    begin
      update public.items set stem = 'diubah setelah dikerjakan'
       where id = (select pi.item_id from public.presented_items pi where pi.session_id = s2 limit 1);
      get diagnostics n = row_count;
      perform selftest.as_owner();
      if n > 0 then
        ok := false; detail := detail || 'a presented item was edited after the session; the binding pins nothing; ';
      end if;
    exception when others then perform selftest.as_owner(); end;
  end if;

  -- (d) SUPERSEDED: published once, then replaced. Still sealed, so the binding
  --     still pins -- and ADMITTED (0064). 0063 refused this and overshot F1:
  --     release status gates new sessions nowhere else in this system, and
  --     correction here is an explicit audited move, never an automatic cutoff
  --     (ADR-0016). A fresh assignment, because the attempt above is spent.
  if s2 is not null then
    perform selftest.as_user('qac-own-admin@synthetic.pintar.test');
    update public.plp_releases set status = 'SUPERSEDED' where id = own.rel;
    perform selftest.as_owner();
    if (select r.status::text from public.plp_releases r where r.id = own.rel) <> 'SUPERSEDED' then
      ok := false; detail := detail || 'the release did not supersede; state (d) proves nothing; ';
    end if;
    if not public.content_is_sealed(own.course) then
      ok := false; detail := detail || 'a superseded course is not sealed; state (d) is testing the wrong thing; ';
    end if;
    perform selftest.as_user('qac-guru-b@synthetic.pintar.test');
    select * into v_row from public.launch_quick_assessment(v_node_b, own.modul, 3, 30);
    perform selftest.as_owner();
    s3 := null;
    perform selftest.as_user('beta-siswa-1@synthetic.pintar.test');
    begin
      s3 := public.start_learning_session(v_row.assessment_assignment_id);
      perform selftest.as_owner();
    exception when others then
      perform selftest.as_owner();
      ok := false;
      detail := detail || format('a SUPERSEDED release refused a learner: %s; ', sqlerrm);
    end;
    if s3 is not null then
      if (select ss.plp_release_id from public.assessment_sessions ss where ss.id = s3) is distinct from own.rel then
        ok := false; detail := detail || 'the session does not cite the superseded release it drew from; ';
      end if;
      -- admitted, and still pinned: F1 is not back
      perform selftest.as_user('qac-own-guru@synthetic.pintar.test');
      begin
        update public.items set stem = 'diubah setelah superseded'
         where id = (select pi.item_id from public.presented_items pi where pi.session_id = s3 limit 1);
        get diagnostics n = row_count;
        perform selftest.as_owner();
        if n > 0 then
          ok := false; detail := detail || 'a presented item was edited after a superseded-release session; admitting SUPERSEDED reopened F1; ';
        end if;
      exception when others then perform selftest.as_owner(); end;
    end if;
  end if;

  test_id := 'QAC-T11'; invariant := 'ADR-0018 / doc 07 session binding / doc 08 publication';
  if ok then detail := format('one own-content course in four states: INGESTED and FROZEN each refuse the learner by name and leave no session row; PUBLISHED runs the same assignment over the same pool to a %s-answer scored attempt whose presented items are then sealed against edits; and SUPERSEDED -- sealed, and still published-in-the-past -- admits a further session that is pinned just as hard', n2); end if;
  return next;

  -- =========================================================================
  -- QAC-T12  SUPERSESSION IS NOT WITHDRAWAL (0064)
  --
  --          The pair Claude 1's addendum asked for, side by side on the same
  --          canonical content, because each half only means something next to
  --          the other: superseding the RELEASE does not stop use, withdrawing
  --          the DISTRIBUTION does. That is the platform's audited lever, and
  --          0063 had duplicated it in an automatic, unaudited form.
  --
  --          Its own canonical package, so superseding it cannot disturb the
  --          shared fixture the rest of this suite and FABLE-05 depend on.
  -- =========================================================================
  ok := true; detail := '';
  select * into can2 from selftest.canonical_package('QAC Supersede ' || v_tag);
  perform selftest.as_user('kanonik-admin@pintar.test');
  v_dist2 := public.grant_release_distribution(can2.rel, v_b, 'task 1 supersession probe');
  perform selftest.as_owner();

  -- the owner withdraws the RELEASE: an audited act, and it sets SUPERSEDED
  perform selftest.as_user('kanonik-admin@pintar.test');
  perform public.withdraw_release(can2.rel, 'task 1 supersession probe');
  perform selftest.as_owner();
  if (select r.status::text from public.plp_releases r where r.id = can2.rel) <> 'SUPERSEDED' then
    ok := false; detail := detail || 'the release did not reach SUPERSEDED; the pair proves nothing; ';
  end if;
  if not public.release_is_distributed_to(can2.rel, v_b) then
    ok := false; detail := detail || 'the grant lapsed on its own; the two levers are not separable here; ';
  end if;

  -- half one: the grant is still ACTIVE, so the school may still use it
  perform selftest.as_user('qac-guru-b@synthetic.pintar.test');
  select * into v_row from public.launch_quick_assessment(v_node_b, can2.modul, 3, 30);
  perform selftest.as_owner();
  s3 := null;
  perform selftest.as_user('beta-siswa-1@synthetic.pintar.test');
  begin
    s3 := public.start_learning_session(v_row.assessment_assignment_id);
    perform selftest.as_owner();
  exception when others then
    perform selftest.as_owner();
    ok := false;
    detail := detail || format('a superseded release with a live grant refused the learner: %s; ', sqlerrm);
  end;
  if s3 is null then
    ok := false; detail := detail || 'no session opened over the superseded release; ';
  elsif (select ss.plp_release_id from public.assessment_sessions ss where ss.id = s3) is distinct from can2.rel then
    ok := false; detail := detail || 'the session does not cite the superseded canonical release; ';
  end if;

  -- half two: withdraw the DISTRIBUTION, and the same content stops
  perform selftest.as_user('kanonik-admin@pintar.test');
  perform public.withdraw_release_distribution(v_dist2, 'task 1 supersession probe');
  perform selftest.as_owner();
  v_refused := false;
  perform selftest.as_user('qac-guru-b@synthetic.pintar.test');
  begin
    perform public.launch_quick_assessment(v_node_b, can2.modul, 3, 30);
    perform selftest.as_owner();
    ok := false; detail := detail || 'a new quick assessment was launched after the grant was withdrawn; ';
  exception when others then
    perform selftest.as_owner();
    v_refused := sqlerrm ~ 'another institution \(INV-13\)';
  end;
  if not v_refused then
    ok := false; detail := detail || 'the post-withdrawal launch was refused for the wrong reason; ';
  end if;
  -- and the assignment made while the grant was live starts nothing new either
  v_refused := false;
  perform selftest.as_user('beta-siswa-1@synthetic.pintar.test');
  begin
    perform public.start_learning_session(v_row.assessment_assignment_id);
    perform selftest.as_owner();
    ok := false; detail := detail || 'a new session started against a withdrawn grant; ';
  exception when others then perform selftest.as_owner(); v_refused := true; end;
  if not v_refused then
    ok := false; detail := detail || 'the withdrawn-grant session was not refused; ';
  end if;
  -- the completed attempt from half one is untouched, as always
  if s3 is not null then
    select count(*) into n from public.assessment_sessions where id = s3;
    if n <> 1 then ok := false; detail := detail || 'the completed session vanished; '; end if;
  end if;

  test_id := 'QAC-T12'; invariant := 'ADR-0018 as amended by 0064 / ADR-0015 §5.2 / ADR-0016';
  if ok then detail := 'on one canonical package: superseding the release leaves the school using it, because release status gates new sessions nowhere in this system and correction here is an explicit audited move; withdrawing the distribution stops both a new launch and a new session on the assignment already made, and touches no completed attempt'; end if;
  return next;

  -- =========================================================================
  test_id := 'QAC-DONE'; invariant := 'suite';
  ok := true;
  detail := format('quick-assessment-over-canonical completed in %s ms',
                   round(extract(milliseconds from clock_timestamp() - t0)));
  return next;
end $$;
revoke all on function selftest.run_quick_canonical() from public;
grant execute on function selftest.run_quick_canonical() to authenticated;
