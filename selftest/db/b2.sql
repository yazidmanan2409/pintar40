-- B2 · fixtures for the printed-report tests (selftest/b2.test.ts): a chapter given and sat at a school, by that school's
-- own people, through the product's own paths (upload, review, release, assignment, sittings). Loaded after fable01–13.

create schema if not exists selftest;

-- A chapter at p_inst, written by p_guru, approved and frozen by p_hod, released and published by p_admin, assigned by
-- p_guru to the class p_kelas (p_guru teaches it from now). Returns {course, rel, la, pre, post}.
create or replace function selftest.b2_bab_di(p_inst uuid, p_guru text, p_hod text, p_admin text, p_kelas uuid, p_tag text)
returns jsonb language plpgsql set search_path = public, pg_temp as $$
declare v jsonb; v_b uuid; v_course uuid; v_rel uuid; v_guru uuid; v_guru_p uuid;
begin
  perform selftest.as_owner();
  select a.person_id, a.auth_user_id into v_guru_p, v_guru from public.accounts a join auth.users u on u.id = a.auth_user_id where u.email = p_guru;
  perform set_config('app.seed_intent', 'synthetic', true);
  insert into public.role_assignments (person_id, role, scope_node_id, institution_id, valid_from, valid_until)
  values (v_guru_p, 'EDUCATOR', p_kelas, p_inst, now() - interval '1 day', now() + interval '365 days');
  perform set_config('app.seed_intent', '', true);
  v := selftest.f13_paket('B2 ' || p_tag, 3, 2, false);
  perform selftest.as_user(p_guru);
  v_b := selftest.f11_batch(p_inst, 'STRUCTURED_PACKAGE', v);
  perform public.prepare_ingest_batch(v_b);
  v := public.confirm_ingest_batch(v_b);
  if (v ->> 'ok')::boolean is not true then raise exception 'B2: the package did not materialise at %: %', p_inst, left(v::text, 200); end if;
  v_course := (v -> 'courses' ->> 0)::uuid;
  perform selftest.f12_advance(v_course, 'STRUCTURED');
  perform selftest.f12_advance(v_course, 'VALIDATED');
  perform selftest.f12_advance(v_course, 'IN_REVIEW');
  perform selftest.as_user(p_hod);
  perform selftest.f12_advance(v_course, 'APPROVED');
  perform selftest.as_user(p_admin);
  v_rel := (public.create_release(v_course) ->> 'release')::uuid;
  perform selftest.as_user(p_hod);
  v := public.freeze_release(v_rel);
  if (v ->> 'ok')::boolean is not true then raise exception 'B2: the release did not freeze: %', left(v::text, 200); end if;
  perform public.acknowledge_finding('MCQ_QUALITY', x.id, 'B2') from public.mcq_quality_findings x where x.course_id = v_course and x.acknowledged_at is null;
  perform public.acknowledge_finding('COACHING', x.id, 'B2') from public.coaching_findings x where x.course_id = v_course and x.acknowledged_at is null;
  perform selftest.as_user(p_admin);
  perform public.publish_release(v_rel);
  perform selftest.as_owner();
  perform selftest.pass_mark(p_inst, v_course);
  perform selftest.as_user_uid(v_guru);
  v := public.assign_release(v_rel, p_kelas, now(), null);
  perform selftest.as_owner();
  return jsonb_build_object('course', v_course, 'rel', v_rel, 'la', v ->> 'learning_assignment',
                            'pre', v ->> 'pre_assignment', 'post', v ->> 'post_assignment');
end $$;
revoke all on function selftest.b2_bab_di(uuid, text, text, text, uuid, text) from public;

-- One sitting of an assessment assignment by a learner, every answer right, finished. Returns the session.
create or replace function selftest.b2_duduk(p_uid uuid, p_aa uuid)
returns uuid language plpgsql set search_path = public, pg_temp as $$
declare v_s uuid; r record;
begin
  perform selftest.as_user_uid(p_uid);
  v_s := public.start_learning_session(p_aa);
  for r in select p.id from public.presented_items p where p.session_id = v_s order by p.position loop
    perform public.record_answer(r.id, 1, selftest.f09_answer(r.id, true));
  end loop;
  perform public.finish_my_session(v_s);
  perform selftest.as_owner();
  return v_s;
end $$;
revoke all on function selftest.b2_duduk(uuid, uuid) from public;

-- A new class at a school, beside an existing one (its parent and school year), and a learner enrolled into it.
create or replace function selftest.b2_kelas_di(p_inst uuid, p_tag text)
returns uuid language plpgsql set search_path = public, pg_temp as $$
declare v_par uuid; v_per uuid; v_kelas uuid;
begin
  perform selftest.as_owner();
  select n.parent_id, n.academic_period_id into v_par, v_per from public.org_nodes n
   where n.institution_id = p_inst and n.kind = 'CLASS' and n.is_active and n.academic_period_id is not null order by n.name limit 1;
  if v_par is null then raise exception 'B2: % has no class to stand beside', p_inst; end if;
  perform set_config('app.seed_intent', 'synthetic', true);
  insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
  values (p_inst, v_par, 'CLASS', 'Kelas B2 ' || p_tag, v_per) returning id into v_kelas;
  perform set_config('app.seed_intent', '', true);
  return v_kelas;
end $$;
revoke all on function selftest.b2_kelas_di(uuid, text) from public;

create or replace function selftest.b2_masuk_kelas(p_person uuid, p_kelas uuid)
returns uuid language plpgsql set search_path = public, pg_temp as $$
declare v_inst uuid; v_per uuid; v_prog uuid; v_e uuid;
begin
  perform selftest.as_owner();
  select n.institution_id, n.academic_period_id into v_inst, v_per from public.org_nodes n where n.id = p_kelas;
  select id into v_prog from public.org_nodes where institution_id = v_inst and kind = 'PROGRAMME' and is_active order by created_at limit 1;
  perform set_config('app.seed_intent', 'synthetic', true);
  select e.id into v_e from public.enrollments e
   where e.person_id = p_person and e.institution_id = v_inst and e.academic_period_id = v_per and e.status = 'ACTIVE' limit 1;
  if v_e is null then
    insert into public.enrollments (person_id, institution_id, academic_period_id, programme_id, status)
    values (p_person, v_inst, v_per, v_prog, 'ACTIVE') returning id into v_e;
  end if;
  insert into public.memberships (enrollment_id, node_id, academic_period_id) values (v_e, p_kelas, v_per);
  perform set_config('app.seed_intent', '', true);
  return v_e;
end $$;
revoke all on function selftest.b2_masuk_kelas(uuid, uuid) from public;

-- ═══════════════════════════════════════ B2-D01 · the suite: a printed report is owned by its evidence's schools
-- The planted defects' gate (db-b2-gates): Sharon's B2-P02 world, its database half. A learner earns results at Alpha
-- (Alpha's own people write, review, release and assign the chapter; both tests sat), is moved to Beta by the product's
-- transfer (transfer_minta, transfer_terima, transfer_execute), and prints their own results: the snapshot is {Alpha},
-- never the live {Beta}. Plant b2-1 derives it from the live affiliation and turns this red. The whole of B2's
-- database behaviour is selftest/b2.test.ts (B2-P01 to P06, B2-S03).
create or replace function selftest.run_b2()
returns table (id text, area text, ok boolean, detail text)
language plpgsql set search_path = public, pg_temp as $$
#variable_conflict use_column
declare v_tag text := substr(md5(random()::text), 1, 8); v_alpha uuid; v_beta uuid; v_ka uuid; v_kb uuid; a jsonb;
        v_u uuid; v_p uuid; v_e uuid; v_tf uuid; v_ref text; v_snap uuid[]; v_hidup uuid[]; v_fatal text := '';
begin
  perform selftest.as_owner();
  begin
    v_alpha := (select i.id from public.institutions i where i.is_synthetic and i.slug like 'synth-alpha-%' order by i.created_at desc limit 1);
    v_beta := (select i.id from public.institutions i where i.is_synthetic and i.slug like 'synth-beta-%' order by i.created_at desc limit 1);
    v_ka := selftest.b2_kelas_di(v_alpha, 'D' || v_tag);
    a := selftest.b2_bab_di(v_alpha, 'alpha-guru@synthetic.pintar.test', 'alpha-hod@synthetic.pintar.test', 'alpha-admin@synthetic.pintar.test', v_ka, 'D' || v_tag);
    v_u := selftest.f06p10_person('b2d-' || v_tag);
    select x.person_id into v_p from public.accounts x where x.auth_user_id = v_u;
    v_e := selftest.b2_masuk_kelas(v_p, v_ka);
    perform selftest.b2_duduk(v_u, (a ->> 'pre')::uuid);
    perform selftest.b2_duduk(v_u, (a ->> 'post')::uuid);
    v_kb := selftest.b2_kelas_di(v_beta, 'D' || v_tag);
    perform selftest.as_user('alpha-admin@synthetic.pintar.test');
    v_tf := public.transfer_minta(v_e, v_beta, 'uji B2 pindah sekolah');
    perform selftest.as_user('beta-admin@synthetic.pintar.test');
    perform public.transfer_terima(v_tf, (select academic_period_id from public.org_nodes where id = v_kb),
      (select id from public.org_nodes where institution_id = v_beta and kind = 'PROGRAMME' and is_active order by created_at limit 1), v_kb);
    perform public.transfer_execute(v_tf);
    perform selftest.as_owner();
    v_hidup := public.akuntabilitas_sekolah_orang(v_p, now());
    v_ref := (public.akuntabilitas_catat('PRINT_REQUEST', null, 'OK', v_u, null, null, null,
                jsonb_build_object('report', 'hasil.belajar', 'person_id', v_p))) ->> 'ref';
    select e.institution_ids into v_snap from public.accountability_events e where e.print_ref = v_ref;
    raise exception 'B2D_UNDO';
  exception when others then
    begin perform selftest.as_owner(); exception when others then null; end;
    perform set_config('app.seed_intent', '', true);
    if sqlerrm <> 'B2D_UNDO' then v_fatal := sqlerrm; end if;
  end;
  id := 'B2-D01'; area := 'B2 -- a printed report is owned by the schools whose evidence it shows';
  if v_fatal <> '' then
    ok := false; detail := 'the B2-D01 world could not run: ' || left(v_fatal, 220);
  elsif v_snap is distinct from array[v_alpha] or v_hidup is distinct from array[v_beta] then
    ok := false; detail := format('a learner moved from Alpha to Beta printed results earned at Alpha: snapshot %s, live %s (expected snapshot {Alpha} while live {Beta})', v_snap, v_hidup);
  else
    ok := true; detail := 'a learner who earned results at Alpha, moved to Beta by the product''s transfer, prints them: the snapshot is {Alpha}, not the live {Beta}';
  end if;
  return next;
  id := 'B2-DONE'; area := 'suite'; ok := v_fatal = '';
  detail := case when v_fatal = '' then 'B2 suite complete; every row rolled back' else 'the suite did not complete: ' || left(v_fatal, 200) end;
  return next;
end $$;
revoke all on function selftest.run_b2() from public;
