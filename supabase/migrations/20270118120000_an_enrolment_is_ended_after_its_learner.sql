-- A2A-L01, change A, C1 (Sharon, A2A-CHANGE-A-C3C4-40753420.md): the person before the enrolment row.
--
-- Commit 3 (20270118110000) made akhiri_pendaftaran take its learner FOR UPDATE before its sittings, but after
-- `select … from enrollments … for update`. kenaikan_tetapkan (the population FOR UPDATE, then the enrolment) and
-- transfer_execute (the person through enrollments_programme_alone on the new enrolment, then the old one) go person →
-- enrolment. Ending an enrolment while its learner is promoted or transferred: "deadlock detected", reproduced on two
-- connections on 246 (A2A-L04).
--
-- The fix: read the enrolment's person without a lock; lock the person FOR UPDATE; then lock the enrolment, and
-- re-check that it still names that person.
--
-- The sweep (every function that locks or writes an enrolment row before its learner; A2A-L01 with enrollments ranked,
-- commit 7), fixed in the same shape here:
--   transfer_minta, transfer_request  insert a transfer, whose foreign keys check the enrolment (KEY SHARE) before the
--                                     person (constraint-name order): the person FOR KEY SHARE first
--   handle_new_auth_user              activates the PENDING enrolments of v_person, who may be an existing person
--                                     (an invitation's person, or the person_id in raw_app_meta_data), and the
--                                     enrolment trigger then takes the person FOR UPDATE: the person FOR UPDATE first
-- Read and not changed: daftarkan_kembali takes the person before its enrolment writes; import_advance's enrolment is
-- the one it inserts (a new row); kenaikan_tetapkan and transfer_execute take the person first.
--
-- Nothing else changes: signatures, owners, grants, volatility and security are kept.

create function pg_temp.a2a_sisip(p_fn regprocedure, p_anchor text, p_baru text) returns void
language plpgsql as $$
declare v text := pg_get_functiondef(p_fn); n int;
begin
  n := (length(v) - length(replace(v, p_anchor, ''))) / greatest(length(p_anchor), 1);
  if n <> 1 then raise exception 'A2A-L01: % has its anchor % time(s), not once', p_fn, n; end if;
  execute replace(v, p_anchor, p_baru);
end $$;

do $$
declare c text := E'  -- A2A-L01 C1 (Sharon, A2A-CHANGE-A-C3C4-40753420.md): the person before the enrolment row\n';
begin
  perform pg_temp.a2a_sisip('public.akhiri_pendaftaran(uuid,text,text,date)',
    E'declare en record; v_end public.enrollment_end_reason;',
    E'declare en record; v_orang uuid; v_end public.enrollment_end_reason;');
  perform pg_temp.a2a_sisip('public.akhiri_pendaftaran(uuid,text,text,date)',
    E'  select e.id, e.person_id, e.institution_id, e.status, e.valid_from into en\n'
    || E'    from public.enrollments e where e.id = p_enrollment for update;\n'
    || E'  -- A2A-L01 (Sharon, A2A-L01-FINDING-f09da528.md): the learner first, before the sitting is touched\n'
    || E'  perform 1 from public.persons where id = en.person_id for update;\n',
    c
    || E'  select e.person_id into v_orang from public.enrollments e where e.id = p_enrollment;\n'
    || E'  perform 1 from public.persons where id = v_orang for update;\n'
    || E'  select e.id, e.person_id, e.institution_id, e.status, e.valid_from into en\n'
    || E'    from public.enrollments e where e.id = p_enrollment for update;\n'
    || E'  if en.id is not null and en.person_id is distinct from v_orang then\n'
    || E'    raise exception ''A2A-L01: the enrolment % no longer names the person locked for it'', p_enrollment;\n'
    || E'  end if;\n');
  perform pg_temp.a2a_sisip('public.transfer_minta(uuid,uuid,text)',
    E'  insert into public.transfers (person_id, from_enrollment_id',
    c || E'  perform 1 from public.persons where id = e.person_id for key share;\n'
      || E'  insert into public.transfers (person_id, from_enrollment_id');
  perform pg_temp.a2a_sisip('public.transfer_request(uuid,uuid,uuid,uuid,text,jsonb)',
    E'  insert into public.transfers (person_id, from_enrollment_id',
    c || E'  perform 1 from public.persons where id = e.person_id for key share;\n'
      || E'  insert into public.transfers (person_id, from_enrollment_id');
  perform pg_temp.a2a_sisip('public.handle_new_auth_user()',
    E'      update public.enrollments set status = ''ACTIVE'' where person_id = v_person and status = ''PENDING'';',
    E'      perform 1 from public.persons where id = v_person for update;   -- A2A-L01 C1: the person before its enrolments\n'
    || E'      update public.enrollments set status = ''ACTIVE'' where person_id = v_person and status = ''PENDING'';');
end $$;

-- ═══════════════════════════════════════════════════════════ the migration's own check (ADR-0003: structural)
-- In each, the person's lock comes before the first statement that locks or writes the enrolment.
do $$
declare r record; v text; k int; s int;
begin
  for r in select * from (values
      ('public.akhiri_pendaftaran(uuid,text,text,date)', 'perform 1 from public.persons where id = v_orang for update;',
       'from public.enrollments e where e.id = p_enrollment for update'),
      ('public.transfer_minta(uuid,uuid,text)', 'perform 1 from public.persons where id = e.person_id for key share;',
       'insert into public.transfers'),
      ('public.transfer_request(uuid,uuid,uuid,uuid,text,jsonb)', 'perform 1 from public.persons where id = e.person_id for key share;',
       'insert into public.transfers'),
      ('public.handle_new_auth_user()', 'perform 1 from public.persons where id = v_person for update;',
       'update public.enrollments set status')
    ) t(fn, kunci, tulis) loop
    v := pg_get_functiondef(r.fn::regprocedure);
    k := position(r.kunci in v); s := position(r.tulis in v);
    if k = 0 or s = 0 or k > s then
      raise exception 'A2A-L01 C1: % does not take its person before its enrolment', r.fn;
    end if;
  end loop;
  -- commit 3's line after the enrolment is gone (the structural check's anchor moves with the lock)
  if position('perform 1 from public.persons where id = en.person_id for update;'
              in pg_get_functiondef('public.akhiri_pendaftaran(uuid,text,text,date)'::regprocedure)) > 0 then
    raise exception 'A2A-L01 C1: akhiri_pendaftaran still locks its person after the enrolment';
  end if;
end $$;
