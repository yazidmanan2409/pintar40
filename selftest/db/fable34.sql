-- FABLE-34 · 4.0 completion (owner decisions 1 and 3, 8 Nov), measured against
-- supabase/migrations/20270110100000_a_learner_without_a_class_is_placed.sql.
--
--   F34-P01  a learner recorded without a class (a person with a registration number and nothing else, as a Pendataan
--            row with no place leaves them) is listed by murid_tanpa_kelas to the school's administrator and to nobody
--            else; tempatkan_murid places them as that administrator with one PENDING enrolment for the Kelas's year and
--            one open membership, audited LEARNER_PLACED, and the list no longer names them; the person and the number
--            are the same rows. Refused: a teacher (42501), another school's administrator (42501), a staff role holder
--            (PLACE_STAFF; never listed), a second placement (PLACE_ALREADY_PLACED), a Tingkat or a professional-learning
--            Kelas (PLACE_NOT_A_KELAS). The
--            placement is a real one: Pindah (move_learner_to_class) then moves it.
--   F34-H01  Studio's home counts every step someone must take, for the one who may take it, through the real
--            lifecycle: a correction drafted by a Guru and taken to «Ajukan» (VALIDATED) is the Guru's «Draf yang belum
--            diajukan»; approved by the Kepala departemen, it is «Buat terbitan» for the Kepala departemen and the Admin
--            sekolah (CAN_FREEZE_RELEASE) and nothing for the Guru; created, it is «Kunci» for them; frozen, it is
--            «Terbitkan» for the Admin sekolah only (CAN_PUBLISH); published, it is nobody's. At every stage studio_home's
--            RELEASE_STEP count equals studio_langkah_terbitan's rows for that reader and school (the list the count
--            opens), so the count and the list cannot differ.
--
-- EVERY ROW IS ROLLED BACK.

create schema if not exists selftest;

do $$
begin
  if to_regprocedure('selftest.as_user_uid(uuid)') is null or to_regprocedure('selftest.f11_user(text,public.app_role,uuid)') is null
     or to_regprocedure('selftest.as_owner()') is null or to_regprocedure('selftest.as_anon()') is null then
    raise exception 'apply fable01, fable06 and fable11.sql before fable34.sql: the helpers are missing';
  end if;
end $$;

-- the error's own code and detail, so a refusal is named and not merely raised
create or replace function selftest.f34_galat(p_sql text)
returns text language plpgsql set search_path = public, pg_temp as $$
declare v_state text; v_detail text;
begin
  execute p_sql;
  return 'OK';
exception when others then
  get stacked diagnostics v_state = returned_sqlstate, v_detail = pg_exception_detail;
  return v_state || ':' || coalesce(v_detail, '');
end $$;
revoke all on function selftest.f34_galat(text) from public;
grant execute on function selftest.f34_galat(text) to authenticated, anon;

-- how many of the reader's release steps studio_home counts, and how many rows the list reads, for one school
create or replace function selftest.f34_hitung(p_inst uuid)
returns table (hitung int, daftar int, langkah text)
language sql set search_path = public, pg_temp as $$
  select coalesce((select h.count from public.studio_home() h where h.bucket = 'RELEASE_STEP' and h.institution_id = p_inst), 0),
         (select count(*)::int from public.studio_langkah_terbitan() t where t.institution_id = p_inst),
         (select string_agg(t.langkah, ',' order by t.langkah) from public.studio_langkah_terbitan() t where t.institution_id = p_inst)
$$;
revoke all on function selftest.f34_hitung(uuid) from public;
grant execute on function selftest.f34_hitung(uuid) to authenticated;

create or replace function selftest.run_fable34()
returns table (id text, area text, ok boolean, detail text)
language plpgsql set search_path = public, pg_temp as $$
declare
  v_tag text := to_char(clock_timestamp(), 'HH24MISSUS'); v_fatal text := '';
  p01 text[] := array[]::text[]; h01 text[] := array[]::text[];
  v_inst uuid; v_x uuid; v_kls uuid; v_kls2 uuid; v_tingkat uuid; v_period uuid;
  v_adm uuid; v_adm_x uuid; v_guru uuid; v_kadep uuid; v_guru_p uuid;
  v_murid uuid; v_staf uuid; v_no text; v_no2 text; v_m uuid; v_m2 uuid; v_e uuid; v_n int; v_r text;
  v_src uuid; v_c uuid; v_rel uuid; v_j jsonb; v_h record; v_ar0 int; v_ar1 int;
begin
  perform selftest.as_owner();
  begin
    select i.id into v_inst from public.institutions i where i.slug = 'pintar-human-evaluation';
    if v_inst is null then raise exception 'the demonstration tenant is absent'; end if;
    -- a school code, so the tenant can issue registration numbers (rolled back with everything else)
    update public.institutions set namespace = 'Q' || right(v_tag, 2) where institutions.id = v_inst and institutions.namespace is null;
    -- two Kelas and their Tingkat in the tenant's current year, of its own
    select o.parent_id, o.academic_period_id into v_tingkat, v_period from public.org_nodes o
     where o.institution_id = v_inst and o.kind = 'CLASS' and o.is_active and o.parent_id is not null
       and exists (select 1 from public.org_nodes t where t.id = o.parent_id and t.kind = 'COHORT')
     order by o.created_at limit 1;
    if v_tingkat is null then raise exception 'no Kelas under a Tingkat to place into'; end if;
    insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
    values (v_inst, v_tingkat, 'CLASS', 'Kelas F34-A ' || v_tag, v_period) returning org_nodes.id into v_kls;
    insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
    values (v_inst, v_tingkat, 'CLASS', 'Kelas F34-B ' || v_tag, v_period) returning org_nodes.id into v_kls2;
    perform set_config('app.seed_intent', 'synthetic', true);
    insert into public.institutions (name, slug, is_synthetic, is_active)
    values ('Sekolah F34 tetangga ' || v_tag, 'f34x-' || v_tag, true, true) returning institutions.id into v_x;
    perform set_config('app.seed_intent', '', true);
    v_adm   := selftest.f11_user('f34-adm-'   || v_tag || '@local.invalid', 'INSTITUTION_ADMIN', v_inst);
    v_adm_x := selftest.f11_user('f34-admx-'  || v_tag || '@local.invalid', 'INSTITUTION_ADMIN', v_x);
    v_guru  := selftest.f11_user('f34-guru-'  || v_tag || '@local.invalid', 'EDUCATOR', v_inst);
    v_kadep := selftest.f11_user('f34-kadep-' || v_tag || '@local.invalid', 'HEAD_OF_DEPARTMENT', v_inst);
    select a.person_id into v_guru_p from public.accounts a where a.auth_user_id = v_guru;

    -- ═══════════════════════════════════════════════════════════════════════ F34-P01 placement
    -- a learner as a Pendataan row with no place leaves them: a person and a number, nothing else
    insert into public.persons (display_name) values ('Murid Tanpa Kelas ' || v_tag) returning persons.id into v_murid;
    v_no := public.issue_institutional_id(v_murid, v_inst);
    -- a teacher recorded the same way, holding a staff role (granted the governed way, INV-16)
    v_e := selftest.f11_user('f34-staf-' || v_tag || '@local.invalid', 'EDUCATOR', v_inst);
    select a.person_id into v_staf from public.accounts a where a.auth_user_id = v_e;
    v_e := null;
    perform public.issue_institutional_id(v_staf, v_inst);

    perform selftest.as_user_uid(v_guru);
    select count(*) into v_n from public.murid_tanpa_kelas(v_inst);
    if v_n <> 0 then p01 := p01 || format('a teacher is listed %s learner(s) without a class', v_n); end if;
    v_r := selftest.f34_galat(format('select public.tempatkan_murid(%L, %L)', v_murid, v_kls));
    if v_r not like '42501:%' then p01 := p01 || ('a teacher placed a learner: ' || v_r); end if;

    perform selftest.as_user_uid(v_adm_x);
    v_r := selftest.f34_galat(format('select public.tempatkan_murid(%L, %L)', v_murid, v_kls));
    if v_r not like '42501:%' then p01 := p01 || ('another school''s administrator placed a learner: ' || v_r); end if;

    perform selftest.as_user_uid(v_adm);
    if not exists (select 1 from public.murid_tanpa_kelas(v_inst) t where t.person_id = v_murid and t.institutional_id = v_no) then
      p01 := p01 || 'the administrator is not shown the learner without a class, with their number';
    end if;
    if exists (select 1 from public.murid_tanpa_kelas(v_inst) t where t.person_id = v_staf) then
      p01 := p01 || 'a staff role holder is listed as a learner without a class (CR-91)';
    end if;
    v_r := selftest.f34_galat(format('select public.tempatkan_murid(%L, %L)', v_staf, v_kls));
    if v_r <> 'P0001:PLACE_STAFF' and v_r not like '%:PLACE_STAFF' then p01 := p01 || ('a staff role holder: ' || v_r); end if;
    v_r := selftest.f34_galat(format('select public.tempatkan_murid(%L, %L)', v_murid, v_tingkat));
    if v_r not like '%:PLACE_NOT_A_KELAS' then p01 := p01 || ('a Tingkat as the place: ' || v_r); end if;
    -- a professional-learning Kelas holds participants, never learners (D-069)
    perform selftest.as_owner();
    -- built as fable33's F33-P01 builds one: a professional-learning Bagian, its Programme, Angkatan and Kelas
    insert into public.org_nodes (institution_id, parent_id, kind, name, learning_context)
    select v_inst, d.parent_id, 'DEPARTMENT', 'Pengembangan F34 ' || v_tag, 'PROFESSIONAL_DEVELOPMENT'
      from public.org_nodes d, public.org_nodes o
     where o.id = v_kls and o.jalur @> array[d.id] and d.kind = 'DEPARTMENT'
     limit 1 returning org_nodes.id into v_m2;
    insert into public.org_nodes (institution_id, parent_id, kind, name) values (v_inst, v_m2, 'PROGRAMME', 'Program F34 ' || v_tag)
      returning org_nodes.id into v_m2;
    insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
    values (v_inst, v_m2, 'COHORT', 'Guru F34 ' || v_tag, v_period) returning org_nodes.id into v_m2;
    insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
    values (v_inst, v_m2, 'CLASS', 'Kelas PD F34 ' || v_tag, v_period) returning org_nodes.id into v_m2;
    if (select n.member_kind from public.org_nodes n where n.id = v_m2) is distinct from 'PARTICIPANT' then
      raise exception 'the professional-learning Kelas fixture is not a participants'' Kelas';
    end if;
    perform selftest.as_user_uid(v_adm);
    v_r := selftest.f34_galat(format('select public.tempatkan_murid(%L, %L)', v_murid, v_m2));
    if v_r not like '%:PLACE_NOT_A_KELAS' then p01 := p01 || ('a professional-learning Kelas as the place: ' || v_r); end if;
    v_m2 := null;

    v_m := public.tempatkan_murid(v_murid, v_kls);
    select m.enrollment_id into v_e from public.memberships m
     where m.id = v_m and m.node_id = v_kls and m.valid_to is null and m.academic_period_id = v_period;
    if v_e is null then p01 := p01 || 'the placement is not an open membership in the Kelas''s year'; end if;
    if not exists (select 1 from public.enrollments e where e.id = v_e and e.person_id = v_murid and e.institution_id = v_inst
                    and e.academic_period_id = v_period and e.status = 'PENDING') then
      p01 := p01 || 'the enrolment is not a PENDING one for the Kelas''s year';
    end if;
    select count(*) into v_n from public.enrollments e where e.person_id = v_murid;
    if v_n <> 1 then p01 := p01 || format('%s enrolments for one placement', v_n); end if;
    select ii.institutional_id into v_no2 from public.institutional_identities ii where ii.person_id = v_murid and ii.institution_id = v_inst;
    if v_no2 is distinct from v_no then p01 := p01 || 'the number changed'; end if;
    perform selftest.as_owner();
    if not exists (select 1 from public.audit_log a where a.action = 'LEARNER_PLACED' and a.target_id = v_m::text and a.institution_id = v_inst) then
      p01 := p01 || 'the placement is not audited LEARNER_PLACED';
    end if;
    perform selftest.as_user_uid(v_adm);
    if exists (select 1 from public.murid_tanpa_kelas(v_inst) t where t.person_id = v_murid) then
      p01 := p01 || 'a placed learner is still listed without a class';
    end if;
    v_r := selftest.f34_galat(format('select public.tempatkan_murid(%L, %L)', v_murid, v_kls2));
    if v_r not like '%:PLACE_ALREADY_PLACED' then p01 := p01 || ('a second placement: ' || v_r); end if;
    -- the placement is Pindah's to move from here
    v_m2 := public.move_learner_to_class(v_m, v_kls2);
    if not exists (select 1 from public.memberships m where m.id = v_m2 and m.node_id = v_kls2 and m.enrollment_id = v_e and m.valid_to is null) then
      p01 := p01 || 'Pindah does not move the new placement';
    end if;

    perform selftest.as_anon();
    v_r := selftest.f34_galat(format('select public.tempatkan_murid(%L, %L)', v_murid, v_kls));
    if v_r = 'OK' then p01 := p01 || 'an anonymous caller placed a learner'; end if;
    perform selftest.as_owner();

    -- ═══════════════════════════════════════════════════════════════════════ F34-H01 Studio's counts
    select c.id into v_src from public.courses c
      join lateral (select pr.status from public.plp_releases pr where pr.course_id = c.id order by pr.created_at desc limit 1) r on true
     where c.institution_id = v_inst and c.status = 'APPROVED' and r.status = 'PUBLISHED'
       and not exists (select 1 from public.courses n where n.supersedes_course_id = c.id)
     order by c.created_at limit 1;
    if v_src is null then raise exception 'no published package in the tenant to correct'; end if;

    perform selftest.as_user_uid(v_guru);
    select coalesce(sum(h.count), 0) into v_ar0 from public.studio_home() h where h.bucket = 'ACTION_REQUIRED' and h.institution_id = v_inst;
    v_c := public.create_course_revision(v_src);
    perform public.langkah_konten(v_c, 'STRUCTURED');
    perform public.langkah_konten(v_c, 'VALIDATED');
    select coalesce(sum(h.count), 0) into v_ar1 from public.studio_home() h where h.bucket = 'ACTION_REQUIRED' and h.institution_id = v_inst;
    if v_ar1 <> v_ar0 + 1 then h01 := h01 || format('a package at «Ajukan» is not the author''s draft to submit (%s → %s)', v_ar0, v_ar1); end if;
    if exists (select 1 from public.studio_langkah_terbitan() t where t.course_id = v_c) then
      h01 := h01 || 'a VALIDATED package is counted as a release step';
    end if;
    perform public.langkah_konten(v_c, 'IN_REVIEW');

    perform selftest.as_user_uid(v_kadep);
    perform public.langkah_konten(v_c, 'APPROVED');
    for v_h in select * from selftest.f34_hitung(v_inst) loop
      if v_h.hitung <> v_h.daftar then h01 := h01 || format('Kepala departemen, buat: the count %s is not the list %s', v_h.hitung, v_h.daftar); end if;
    end loop;
    if not exists (select 1 from public.studio_langkah_terbitan() t where t.course_id = v_c and t.langkah = 'buat') then
      h01 := h01 || 'an approved package is not «Buat terbitan» for the Kepala departemen';
    end if;
    perform selftest.as_user_uid(v_guru);
    if exists (select 1 from public.studio_langkah_terbitan() t where t.course_id = v_c) then
      h01 := h01 || 'an approved package is a release step for the Guru, who may not take it';
    end if;
    perform selftest.as_user_uid(v_adm);
    if not exists (select 1 from public.studio_langkah_terbitan() t where t.course_id = v_c and t.langkah = 'buat') then
      h01 := h01 || 'an approved package is not «Buat terbitan» for the Admin sekolah';
    end if;

    perform selftest.as_user_uid(v_kadep);
    v_j := public.create_release(v_c);
    select pr.id into v_rel from public.plp_releases pr where pr.course_id = v_c order by pr.created_at desc limit 1;
    if v_rel is null then raise exception 'create_release made no release: %', v_j; end if;
    if not exists (select 1 from public.studio_langkah_terbitan() t where t.course_id = v_c and t.langkah = 'kunci') then
      h01 := h01 || format('a created release is not «Kunci» for the Kepala departemen (release %s)',
                           (select pr.status from public.plp_releases pr where pr.id = v_rel));
    end if;
    for v_h in select * from selftest.f34_hitung(v_inst) loop
      if v_h.hitung <> v_h.daftar then h01 := h01 || format('Kepala departemen, kunci: the count %s is not the list %s', v_h.hitung, v_h.daftar); end if;
    end loop;

    v_j := public.freeze_release(v_rel);
    if (select pr.status from public.plp_releases pr where pr.id = v_rel) <> 'FROZEN' then raise exception 'freeze_release did not freeze: %', v_j; end if;
    if exists (select 1 from public.studio_langkah_terbitan() t where t.course_id = v_c) then
      h01 := h01 || 'a frozen release is a step for the Kepala departemen, who may not publish';
    end if;
    perform selftest.as_user_uid(v_adm);
    if not exists (select 1 from public.studio_langkah_terbitan() t where t.course_id = v_c and t.langkah = 'terbitkan') then
      h01 := h01 || 'a frozen release is not «Terbitkan» for the Admin sekolah';
    end if;
    for v_h in select * from selftest.f34_hitung(v_inst) loop
      if v_h.hitung <> v_h.daftar then h01 := h01 || format('Admin sekolah, terbitkan: the count %s is not the list %s', v_h.hitung, v_h.daftar); end if;
    end loop;

    perform public.publish_release(v_rel);
    if exists (select 1 from public.studio_langkah_terbitan() t where t.course_id = v_c) then
      h01 := h01 || 'a published package is still a release step';
    end if;
    perform selftest.as_user_uid(v_kadep);
    if exists (select 1 from public.studio_langkah_terbitan() t where t.course_id = v_c) then
      h01 := h01 || 'a published package is still a release step for the Kepala departemen';
    end if;

    perform selftest.as_anon();
    v_r := selftest.f34_galat('select count(*) from public.studio_langkah_terbitan()');
    if v_r = 'OK' then h01 := h01 || 'an anonymous caller reads the release steps'; end if;
    perform selftest.as_owner();

    raise exception 'f34-rollback';
  exception when others then
    if sqlerrm <> 'f34-rollback' then v_fatal := sqlerrm; end if;
  end;
  perform selftest.as_owner();

  return query values
    ('F34-P01', 'owner decision 1 -- a learner without a class is placed', v_fatal = '' and cardinality(p01) = 0,
     case when v_fatal <> '' then 'fixture failed: ' || v_fatal
          when cardinality(p01) > 0 then array_to_string(p01, '; ')
          else 'listed to the school''s administrator only; placed with one PENDING enrolment and one membership in the Kelas''s year, audited LEARNER_PLACED, number unchanged; refused to a teacher, another school, a staff role holder, a second placement and a Tingkat; Pindah moves it after' end),
    ('F34-H01', 'owner decision 3 -- Studio''s home counts every step, for whoever may take it', v_fatal = '' and cardinality(h01) = 0,
     case when v_fatal <> '' then 'fixture failed: ' || v_fatal
          when cardinality(h01) > 0 then array_to_string(h01, '; ')
          else '«Ajukan» counted as the author''s draft; «Buat terbitan» and «Kunci» for CAN_FREEZE_RELEASE, not the Guru; «Terbitkan» for CAN_PUBLISH only; a published package nobody''s; the count equals the list at every step; anon refused' end),
    ('F34-DONE', 'fable34 ran to its end', true, 'every row rolled back');
end $$;
revoke all on function selftest.run_fable34() from public;
