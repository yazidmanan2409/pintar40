-- L1-F4 (owner, 12 Nov 2026; ANONYMISED-PERSON-IS-TERMINAL.md §0, §3a, §3b Option A): an anonymised person is terminal
-- for new identity attachments. One world, rolled back. Runs after fable13 and fable38, whose helpers it reuses.
--
--   L1F4-E01  the registry: every foreign key to persons(id) is classified DIJAGA or BEBAS with a reason, and every
--             DIJAGA column has its guard trigger (a plant adds an unclassified table: red)
--   L1F4-K01  the intake, from the person's former school, from an unrelated school and from the platform: naming the
--             anonymised person's id gives exactly the finding of an id that names no one; the unrelated school cannot
--             read the id at all (red before: the platform's row attached, the former school's said "already holds")
--   L1F4-K02  a learner's return (daftarkan_kembali): the anonymised person gets exactly the refusal of an unknown id
--   L1F4-K03  the departed learners (murid_keluar): an anonymised learner is not offered; the same learner, not
--             anonymised, is (control)
--   L1F4-K04  every guarded column: an insert naming the anonymised person (or their enrolment or account) is refused
--             PERSON_UNKNOWN; the same insert naming a live person is not refused by the guard
--   L1F4-K05  certificates: a new one is not eligible; one already issued is returned as before; a replacement is
--             refused CERT_HOLDER_DELETED
--   L1F4-K06  the deletion: refused ACCOUNT_LIVE_ATTACHMENT when a role was gained after the closure began (nothing
--             changed, the request open); completes once it is ended, every historical row byte-identical; what the
--             person held at the closure does not stop it
--   L1F4-K07  INSERT only: an update ending the anonymised person's role passes
--   L1F4-K08  a key correction that newly earns a certificate for an anonymised learner records it as earned but not
--             issued, and no certificate row is written (§3b Option A); RESTATED (Daisy, 12 Nov): it is not counted among the certificates that
--             can be issued, in the preview or the outcome
--   L1F4-K09  (Sharon's required change) a live role, and a pending enrolment, dated before the closure began but not
--             held at it: the deletion is refused ACCOUNT_LIVE_ATTACHMENT, nothing changed (red before: the timestamps
--             read them as history and the deletion completed)
--   L1F4-K10  the closure records what was live when it was made, written once; with only that live, the deletion
--             completes
--   L1F4-K11  (Daisy) a key correction newly earning a certificate for an anonymised learner does not count it
--   L1F4-K12  (Sharon's result review of 3a63a2b2, L1F4-A2) an anonymised person is never reopened: a request made
--             before the deletion is ended by it and refused after it; any open request is refused ACCOUNT_ANONYMISED;
--             the closure stays open and the accounts locked; a request after the deletion records nothing

create or replace function selftest.l1f4_kode(p_sql text)
returns text language plpgsql set search_path = public, pg_temp as $$
declare v_state text; v_detail text; v_msg text;
begin
  execute p_sql;
  return 'OK';
exception when others then
  get stacked diagnostics v_state = returned_sqlstate, v_detail = pg_exception_detail, v_msg = message_text;
  return v_state || ':' || coalesce(nullif(v_detail, ''), v_msg);
end $$;
revoke all on function selftest.l1f4_kode(text) from public;

-- L1F4-E01 alone: no fixture, so the planted-defect gate can run it on any database
create or replace function selftest.run_l1f4_registry()
returns table (id text, area text, ok boolean, detail text)
language plpgsql set search_path = public, pg_temp as $$
declare n int; v_probs text := '';
begin
  begin
    select count(*) into n
      from pg_constraint c join pg_attribute a on a.attrelid = c.conrelid and a.attnum = any (c.conkey)
     where c.contype = 'f' and c.confrelid = 'public.persons'::regclass
       and not exists (select 1 from public.orang_lampiran o where o.tabel = c.conrelid::regclass::text and o.kolom = a.attname);
    if n > 0 then
      v_probs := n || ' foreign key column(s) to persons(id) not classified: '
        || (select string_agg(c.conrelid::regclass || '.' || a.attname, ', ')
              from pg_constraint c join pg_attribute a on a.attrelid = c.conrelid and a.attnum = any (c.conkey)
             where c.contype = 'f' and c.confrelid = 'public.persons'::regclass
               and not exists (select 1 from public.orang_lampiran o where o.tabel = c.conrelid::regclass::text and o.kolom = a.attname));
    end if;
    select count(*) into n from public.orang_lampiran o
     where o.kelas = 'DIJAGA' and not exists (select 1 from pg_trigger t where t.tgname = '_l1f4_' || o.tabel || '_' || o.kolom
                                                and t.tgrelid = ('public.' || o.tabel)::regclass);
    if n > 0 then v_probs := concat_ws('; ', nullif(v_probs, ''), n || ' guarded column(s) without their trigger'); end if;
  exception when others then
    v_probs := 'the registry could not be read: ' || sqlerrm;
  end;
  id := 'L1F4-E01'; area := 'L1-F4 -- an anonymised person is terminal'; ok := v_probs = '';
  detail := case when ok then 'every foreign key to persons(id) is classified guarded or exempt with a reason, and every guarded column has its trigger'
                 else v_probs end;
  return next;
  id := 'L1F4-REG-DONE'; area := 'suite'; ok := true; detail := 'the L1-F4 registry check ran'; return next;
end $$;
revoke all on function selftest.run_l1f4_registry() from public;

create or replace function selftest.run_l1f4()
returns table (id text, area text, ok boolean, detail text)
language plpgsql set search_path = public, pg_temp as $$
#variable_conflict use_column
declare
  v_tag text := substr(md5(random()::text), 1, 8); v_probs jsonb := '{}'::jsonb; v_fatal text := '';
  v_a uuid; v_b uuid; v_root_a uuid; v_root_b uuid; u_sys uuid; u_adm_a uuid; u_adm_b uuid; u_g uuid; p_g uuid;
  p_l uuid; u_l uuid; e_l uuid; p_hidup uuid; u_hidup uuid; v_req uuid; v_x uuid := gen_random_uuid(); v_t text; v_u text;
  r record; v_ref uuid; v_live uuid; v_sidik text; v_cert uuid; v_sesi uuid; v_period uuid; v jsonb; v_k uuid;
  v_post uuid; v_y uuid; v_w uuid; n int; v_d0 text;
begin
  perform selftest.as_owner();
  begin
    -- ── the world: school A (the person's), school B (unrelated), the platform
    select (selftest.boot_fixture()).inst into v_a;
    select i.id into v_b from public.institutions i where i.id <> v_a and i.is_active order by i.created_at limit 1;
    select o.id into v_root_a from public.org_nodes o where o.institution_id = v_a and o.kind = 'INSTITUTION';
    select o.id into v_root_b from public.org_nodes o where o.institution_id = v_b and o.kind = 'INSTITUTION';
    if v_b is null or v_root_b is null then raise exception 'no second school in the fixture'; end if;
    -- each school reserves a namespace of its own here, as AUTH-A01 does (the seeded schools carry none), so it can number
    update public.institutions i set namespace = (select x from generate_series(1, 500) g,
                                                   lateral (select upper(substr(md5(v_tag || i.id::text || g), 1, 3)) x) q
                                                  where x ~ '^[A-Z]{3}$' and not exists (select 1 from public.institutions t where upper(t.namespace) = q.x) limit 1)
     where i.id in (v_a, v_b) and i.namespace is null;
    u_sys := selftest.f11_user('l1f4-sys-' || v_tag || '@local.invalid', 'SYSTEM_ADMIN', v_root_a);
    u_adm_a := selftest.f11_user('l1f4-adm-a-' || v_tag || '@local.invalid', 'INSTITUTION_ADMIN', v_root_a);
    u_adm_b := selftest.f11_user('l1f4-adm-b-' || v_tag || '@local.invalid', 'INSTITUTION_ADMIN', v_root_b);
    -- G: a teacher at A, numbered there, who closes their account and has their personal data deleted
    u_g := selftest.f11_user('l1f4-guru-' || v_tag || '@local.invalid', 'EDUCATOR', v_root_a);
    select a.person_id into p_g from public.accounts a where a.auth_user_id = u_g;
    perform public.issue_institutional_id(p_g, v_a);
    -- the closure is backdated a minute, as a closure is earlier than its deletion in life (one test transaction
    -- otherwise gives both one instant)
    if selftest.f37_sebagai(u_g, format('select public.minta_akun(%L, true)', 'DELETE_PERSONAL_DATA')) <> 'OK'
       or selftest.f37_sebagai(u_g, format('select public.minta_akun(%L, true)', 'CLOSE')) <> 'OK' then
      raise exception 'the teacher could not ask for deletion and close';
    end if;
    update public.person_suspensions set started_at = now() - interval '1 minute' where person_id = p_g and ended_at is null;
    select q.id into v_req from public.account_requests q where q.person_id = p_g and q.kind = 'DELETE_PERSONAL_DATA';
    -- a live person, for the controls
    u_hidup := selftest.f11_user('l1f4-hidup-' || v_tag || '@local.invalid', 'EDUCATOR', v_root_a);
    select a.person_id into p_hidup from public.accounts a where a.auth_user_id = u_hidup;

    -- ═══ L1F4-K06 (first half): a role gained after the closure began stops the deletion; nothing is changed
    -- granted by the school's administrator, as in life (INV-16: an authenticated grantor), at a place of its own (the
    -- role held at the closure is still live at the root)
    insert into public.org_nodes (institution_id, parent_id, kind, name) values (v_a, v_root_a, 'FACULTY', 'Bagian L1F4 ' || v_tag)
    returning org_nodes.id into v_ref;
    v_t := selftest.f37_sebagai_pemilik(u_adm_a, format(
      'insert into public.role_assignments (person_id, role, scope_node_id, institution_id, valid_from, valid_until, granted_by) '
      || 'values (%L, %L, %L, %L, now(), now() + interval %L, (select a.person_id from public.accounts a where a.auth_user_id = %L))',
      p_g, 'EDUCATOR', v_ref, v_a, '1 year', u_adm_a));
    if v_t <> 'OK' then raise exception 'the school could not grant the returning teacher a role: %', v_t; end if;
    v_sidik := md5((select to_jsonb(p)::text from public.persons p where p.id = p_g)
                   || coalesce((select string_agg(to_jsonb(ra)::text, '|' order by ra.id) from public.role_assignments ra where ra.person_id = p_g), ''));
    v_t := selftest.f37_sebagai(u_sys, format('select public.hapus_data_pribadi(%L, %L)', v_req, 'sesuai permintaan'));
    if v_t <> 'PR140:ACCOUNT_LIVE_ATTACHMENT' then
      v_probs := selftest.f11_note(v_probs, 'L1F4-K06', 'a role gained after the closure: the deletion answered ' || v_t || ' (expected PR140:ACCOUNT_LIVE_ATTACHMENT)');
    end if;
    if md5((select to_jsonb(p)::text from public.persons p where p.id = p_g)
           || coalesce((select string_agg(to_jsonb(ra)::text, '|' order by ra.id) from public.role_assignments ra where ra.person_id = p_g), '')) <> v_sidik
       or (select q.status from public.account_requests q where q.id = v_req) not in ('RECEIVED', 'IN_PROGRESS') then
      v_probs := selftest.f11_note(v_probs, 'L1F4-K06', 'the refused deletion changed the person or their roles, or closed the request');
    end if;
    -- the school ends that role: the deletion completes; the role held at the closure does not stop it
    update public.role_assignments set revoked_at = now(), revoked_reason = 'uji L1F4: peran baru diakhiri sekolah'
     where person_id = p_g and created_at > (select x.started_at from public.person_suspensions x where x.person_id = p_g and x.ended_at is null);
    v_sidik := coalesce((select string_agg(to_jsonb(ra)::text, '|' order by ra.id) from public.role_assignments ra where ra.person_id = p_g), '')
            || '#' || coalesce((select string_agg(to_jsonb(ii)::text, '|') from public.institutional_identities ii where ii.person_id = p_g), '')
            || '#' || coalesce((select string_agg(to_jsonb(au)::text, '|' order by au.id) from public.audit_log au where au.target_id = p_g::text), '');
    v_t := selftest.f37_sebagai(u_sys, format('select public.hapus_data_pribadi(%L, %L)', v_req, 'sesuai permintaan'));
    if v_t <> 'OK' or not exists (select 1 from public.persons p where p.id = p_g and p.anonymized_at is not null) then
      v_probs := selftest.f11_note(v_probs, 'L1F4-K06', 'once the role was ended the deletion answered ' || v_t);
    end if;
    -- history kept: every role and number as before, and the audit rows before the deletion's own still there
    if coalesce((select string_agg(to_jsonb(ra)::text, '|' order by ra.id) from public.role_assignments ra where ra.person_id = p_g), '')
         || '#' || coalesce((select string_agg(to_jsonb(ii)::text, '|') from public.institutional_identities ii where ii.person_id = p_g), '')
       <> split_part(v_sidik, '#', 1) || '#' || split_part(v_sidik, '#', 2) then
      v_probs := selftest.f11_note(v_probs, 'L1F4-K06', 'the deletion changed a role or a number (history must be byte-identical)');
    end if;

    -- ═══ L1F4-K01  the intake, three readers
    for r in select * from (values ('the former school', u_adm_a, v_a), ('an unrelated school', u_adm_b, v_b), ('the platform', u_sys, v_a)) z(who, uid, inst) loop
      -- the reader's claims, with the owner's rights: import_row_problems runs inside import_validate, which grants it
      perform selftest.as_user_uid(r.uid); reset role;
      v_t := public.import_row_problems(r.inst, jsonb_build_object('display_name', 'Murid Kembali', 'person_id', p_g))::text;
      v_u := public.import_row_problems(r.inst, jsonb_build_object('display_name', 'Murid Kembali', 'person_id', v_x))::text;
      perform selftest.as_owner();
      if v_t is distinct from v_u then
        v_probs := selftest.f11_note(v_probs, 'L1F4-K01', r.who || ' naming the anonymised id found ' || v_t || '; an unknown id ' || v_u);
      end if;
    end loop;
    perform selftest.as_user_uid(u_adm_b);
    if public.person_visible_to_me(p_g) then v_probs := selftest.f11_note(v_probs, 'L1F4-K01', 'an unrelated school can read the anonymised person'); end if;
    perform selftest.as_owner();

    -- ═══ L1F4-K02  a learner's return
    v_t := selftest.f37_sebagai(u_adm_a, format('select public.daftarkan_kembali(%L, %L, %L, %L, null, null)', p_g, v_a, 'RETURN', 'uji L1F4: kembali ke sekolah'));
    v_u := selftest.f37_sebagai(u_adm_a, format('select public.daftarkan_kembali(%L, %L, %L, %L, null, null)', v_x, v_a, 'RETURN', 'uji L1F4: kembali ke sekolah'));
    if v_t is distinct from v_u then
      v_probs := selftest.f11_note(v_probs, 'L1F4-K02', 'the anonymised person''s return answered ' || v_t || '; an unknown id ' || v_u);
    end if;

    -- ═══ L1F4-K03  the departed learners: a learner who left A, listed, then anonymised and not listed
    select ap.id into v_period from public.academic_periods ap where ap.institution_id = v_a order by ap.created_at desc limit 1;
    u_l := selftest.f11_user('l1f4-murid-' || v_tag || '@local.invalid', null, null);
    select a.person_id into p_l from public.accounts a where a.auth_user_id = u_l;
    perform public.issue_institutional_id(p_l, v_a);
    set local session_replication_role = replica;
    insert into public.enrollments (person_id, institution_id, academic_period_id, status, valid_to, end_reason)
    values (p_l, v_a, v_period, 'ENDED', now() - interval '1 day', 'WITHDRAWN') returning enrollments.id into e_l;
    set local session_replication_role = origin;
    perform selftest.as_user_uid(u_adm_a);
    v_t := (select count(*)::text from public.murid_keluar(v_a) m where m.person_id = p_l);
    perform selftest.as_owner();
    update public.persons set anonymized_at = now(), display_name = pintar_id where id = p_l;   -- as hapus_data_pribadi leaves it
    perform selftest.as_user_uid(u_adm_a);
    v_u := (select count(*)::text from public.murid_keluar(v_a) m where m.person_id = p_l);
    perform selftest.as_owner();
    if v_t <> '1' or v_u <> '0' then
      v_probs := selftest.f11_note(v_probs, 'L1F4-K03', format('the departed learner listed %s time(s) before anonymisation (expected 1) and %s after (expected 0)', v_t, v_u));
    end if;

    -- ═══ L1F4-K04  every guarded column, the anonymised person against a live one (no registry: red, and the rest runs)
    if to_regclass('public.orang_lampiran') is null then
      v_probs := selftest.f11_note(v_probs, 'L1F4-K04', 'there is no registry of attaching columns, so nothing is guarded');
    end if;
    for r in execute case when to_regclass('public.orang_lampiran') is null
                          then 'select null::text as tabel, null::text as kolom, null::text as lewat where false'
                          else 'select o.tabel, o.kolom, o.lewat from public.orang_lampiran o where o.kelas = ''DIJAGA'' order by o.tabel, o.kolom' end loop
      v_ref := case r.lewat when 'enrollment' then e_l when 'auth_user' then u_g else p_g end;
      v_live := case r.lewat when 'enrollment' then (select e.id from public.enrollments e where e.person_id <> p_l limit 1)
                             when 'auth_user' then u_hidup else p_hidup end;
      v_t := selftest.l1f4_kode(format('insert into public.%I (%I) values (%L)', r.tabel, r.kolom, v_ref));
      v_u := selftest.l1f4_kode(format('insert into public.%I (%I) values (%L)', r.tabel, r.kolom, v_live));
      if v_t <> 'PR040:PERSON_UNKNOWN' then
        v_probs := selftest.f11_note(v_probs, 'L1F4-K04', r.tabel || '.' || r.kolom || ' naming the anonymised person: ' || left(v_t, 90));
      end if;
      if v_u = 'PR040:PERSON_UNKNOWN' then
        v_probs := selftest.f11_note(v_probs, 'L1F4-K04', r.tabel || '.' || r.kolom || ' refused a live person as unknown');
      end if;
    end loop;

    -- ═══ L1F4-K07  INSERT only: an update ending the anonymised person's role passes
    v_t := selftest.l1f4_kode(format('update public.role_assignments set revoked_at = now(), revoked_reason = %L where person_id = %L and revoked_at is null',
                                     'uji L1F4: diakhiri setelah dihapus', p_g));
    if v_t <> 'OK' then v_probs := selftest.f11_note(v_probs, 'L1F4-K07', 'ending the anonymised person''s role was refused: ' || v_t); end if;

    -- ═══ L1F4-K05  certificates: a finished Uji Penguasaan of the fixture, its holder anonymised in this transaction
    select s.id into v_sesi from public.assessment_sessions s
     where s.mode = 'POST_TEST' and s.status = 'FINALIZED' and s.class_node_id is not null
       and not exists (select 1 from public.certificates c where c.session_id = s.id)
     order by s.finalized_at desc limit 1;
    if v_sesi is null then raise exception 'no finished Uji Penguasaan without a certificate in the fixture'; end if;
    v_cert := selftest.f38_sertifikat(v_sesi);
    update public.persons set anonymized_at = now(), display_name = pintar_id where id = (select s.person_id from public.assessment_sessions s where s.id = v_sesi);
    v_t := selftest.l1f4_kode(format('select * from public.certificate_prepare(%L, 1::smallint)', v_sesi));
    if v_t <> 'OK' then v_probs := selftest.f11_note(v_probs, 'L1F4-K05', 'the certificate already issued is not returned as before: ' || v_t); end if;
    select s.id into v_sesi from public.assessment_sessions s
     where s.mode = 'POST_TEST' and s.status = 'FINALIZED' and s.class_node_id is not null and s.id <> v_sesi
       and not exists (select 1 from public.certificates c where c.session_id = s.id)
       and exists (select 1 from public.official_sessions o where o.id = s.id)   -- official, so nothing else refuses it
     order by s.finalized_at desc limit 1;
    update public.persons set anonymized_at = now(), display_name = pintar_id where id = (select s.person_id from public.assessment_sessions s where s.id = v_sesi);
    v_t := selftest.l1f4_kode(format('select * from public.certificate_prepare(%L, 1::smallint)', v_sesi));
    if v_t not like 'P0001:not eligible: the holder''s personal data was deleted%' or exists (select 1 from public.certificates c where c.session_id = v_sesi) then
      v_probs := selftest.f11_note(v_probs, 'L1F4-K05', 'a new certificate for an anonymised holder: ' || v_t);
    end if;
    perform selftest.f11_user('l1f4-terbit-' || v_tag || '@local.invalid', 'INSTITUTION_ADMIN',
                              (select o.id from public.org_nodes o join public.certificates c on c.institution_id = o.institution_id where c.id = v_cert and o.kind = 'INSTITUTION'));
    v_t := selftest.f37_sebagai((select u.id from auth.users u where u.email = 'l1f4-terbit-' || v_tag || '@local.invalid'),
             format('select * from public.sertifikat_koreksi_siapkan(%L, %L, 1::smallint)', v_cert, 'uji L1F4: nama di sertifikat diganti'));
    if v_t <> 'PR120:CERT_HOLDER_DELETED' then
      v_probs := selftest.f11_note(v_probs, 'L1F4-K05', 'a replacement for an anonymised holder answered ' || v_t || ' (expected PR120:CERT_HOLDER_DELETED)');
    end if;

    -- ═══ L1F4-K08  a key correction newly earns a certificate for an anonymised learner: earned, not issued
    v := selftest.f13_kunci_dunia(2, 1);
    v_post := (v ->> 'post')::uuid;
    select i2.id into v_y from public.items i2 join public.lessons l on l.id = i2.lesson_id join public.modules m2 on m2.id = l.module_id
     where m2.course_id = (v ->> 'course')::uuid and i2.stem like 'Pertanyaan akhir nomor 1%';
    v_w := selftest.f13_kunci_duduk((v -> 'sesi' ->> 'u1')::uuid, v_post, v_y, 'B');
    perform selftest.f13_kunci_duduk((v -> 'sesi' ->> 'u2')::uuid, v_post, v_y, 'A');
    update public.persons set anonymized_at = now(), display_name = pintar_id
     where id = (select s.person_id from public.assessment_sessions s where s.id = v_w);
    perform selftest.as_user('boot-admin@bootstrap.pintar.test');
    v_k := (public.ajukan_koreksi_kunci(v_y, array['B'], 'uji L1F4: kunci soal akhir ini keliru') ->> 'koreksi')::uuid;
    perform selftest.as_user('boot-kaprodi@bootstrap.pintar.test');
    -- the confirmer's preview: the row says earned, not issued, before the second person confirms
    v := public.koreksi_kunci_dampak(v_k);
    v_t := (select coalesce(e ->> 'sertifikat_tidak_diterbitkan', '-') from jsonb_array_elements(v -> 'daftar') e where (e ->> 'sesi')::uuid = v_w);
    -- RESTATED (Daisy, TINJAUAN-F1R1B-97a40ebb.md §2.1): the summary's «{n} sertifikat baru dapat diterbitkan» reads this count
    v_d0 := coalesce(v ->> 'sertifikat_baru_layak', '-') || '|' || coalesce(v ->> 'sertifikat_tidak_diterbitkan', '-');
    v := public.tegaskan_koreksi_kunci(v_k);
    perform selftest.as_owner();
    -- the record: the confirmed correction's outcome counts it
    select k.outcome into v from public.key_corrections k where k.id = v_k;
    v_t := v_t || '|' || coalesce(v ->> 'sertifikat_tidak_diterbitkan', '-');
    -- RESTATED (Daisy, 12 Nov): the fixture's newly earned certificate is the anonymised learner's, so it is counted as
    -- earned but not issued and NOT among those that can be issued; the fixture check reads both counts together
    if coalesce((v ->> 'sertifikat_baru_layak')::int, 0) + coalesce((v ->> 'sertifikat_tidak_diterbitkan')::int, 0) < 1 then
      v_probs := selftest.f11_note(v_probs, 'L1F4-K08', 'the fixture''s correction newly earns no certificate (' || coalesce(v ->> 'sertifikat_baru_layak', '-') || '): nothing to show');
    elsif v_d0 is distinct from '0|1' or (v ->> 'sertifikat_baru_layak') is distinct from '0' then
      v_probs := selftest.f11_note(v_probs, 'L1F4-K08', 'the summary counts (can be issued|earned, not issued) read ' || coalesce(v_d0, '-') || ' in the preview and '
        || coalesce(v ->> 'sertifikat_baru_layak', '-') || ' can be issued in the outcome (expected 0|1 and 0: a certificate that will not be issued is not counted as one that can)');
    elsif v_t is distinct from 'true|1' or exists (select 1 from public.certificates c where c.session_id = v_w) then
      v_probs := selftest.f11_note(v_probs, 'L1F4-K08', 'the anonymised learner''s newly earned certificate read (preview row|outcome count) '
        || coalesce(v_t, 'nothing') || ' (expected true|1: earned, not issued) or a certificate row was written');
    end if;

    raise exception 'L1F4_UNDO';
  exception when others then
    begin perform selftest.as_owner(); exception when others then null; end;
    perform set_config('app.seed_intent', '', true);
    if sqlerrm <> 'L1F4_UNDO' then v_fatal := sqlerrm; end if;
  end;

  for id, area, ok, detail in select * from selftest.run_l1f4_registry() x where x.id = 'L1F4-E01' loop
    return next;
  end loop;
  for id, detail in select * from (values
    ('L1F4-K01', 'naming the anonymised person''s id in an intake row gives the finding of an unknown id, at the former school, an unrelated school and the platform; an unrelated school cannot read the id'),
    ('L1F4-K02', 'daftarkan_kembali on the anonymised person gives exactly the refusal of an unknown id'),
    ('L1F4-K03', 'murid_keluar offers a departed learner, and not once they are anonymised'),
    ('L1F4-K04', 'every guarded column refuses an insert naming the anonymised person (PERSON_UNKNOWN) and not one naming a live person'),
    ('L1F4-K05', 'a certificate already issued is returned as before; a new one is not eligible and nothing is written; a replacement is refused CERT_HOLDER_DELETED'),
    ('L1F4-K06', 'the deletion is refused ACCOUNT_LIVE_ATTACHMENT for a role gained after the closure, changing nothing; once ended it completes, roles and numbers byte-identical'),
    ('L1F4-K07', 'an update ending the anonymised person''s role passes (INSERT only)'),
    ('L1F4-K08', 'a key correction newly earning a certificate for an anonymised learner records it earned but not issued, writes no certificate row, and does not count it among those that can be issued')
  ) z(a, b) loop
    area := 'L1-F4 -- an anonymised person is terminal';
    if v_fatal <> '' then
      ok := false; detail := 'the L1F4 world could not run: ' || left(v_fatal, 220);
    elsif v_probs ? id then
      ok := false;
      detail := format('%s problem(s): %s', jsonb_array_length(v_probs -> id), (select string_agg(y, '; ') from jsonb_array_elements_text(v_probs -> id) y));
    end if;
    if v_fatal = '' and not (v_probs ? id) then ok := true; end if;
    return next;
  end loop;
  id := 'L1F4-DONE'; area := 'suite'; ok := v_fatal = '';
  detail := case when v_fatal = '' then 'L1-F4 suite complete; every row rolled back' else 'the suite did not complete: ' || left(v_fatal, 200) end;
  return next;
end $$;
revoke all on function selftest.run_l1f4() from public;

-- ═══════════════════════════════════════════════════════════ L1F4-K09 to K11: the closure's record, and the count
-- Sharon's required change (interim review of ea3c4b6f) and Daisy's check (TINJAUAN-F1R1B-97a40ebb.md §2.1). A suite of
-- its own, on helpers every plant gate loads (fable04, fable06, fable11, fable13), so its plants can run alone.
create or replace function selftest.l1f4_sebagai(p_user uuid, p_sql text)
returns text language plpgsql set search_path = public, pg_temp as $$
declare v_state text; v_detail text;
begin
  perform selftest.as_user_uid(p_user);
  execute p_sql;
  perform selftest.as_owner();
  return 'OK';
exception when others then
  get stacked diagnostics v_state = returned_sqlstate, v_detail = pg_exception_detail;
  perform selftest.as_owner();
  return v_state || ':' || coalesce(nullif(v_detail, ''), left(sqlerrm, 80));
end $$;
revoke all on function selftest.l1f4_sebagai(uuid, text) from public;

-- as the user (whose grant it is: INV-16 reads the authenticated grantor), with the owner's table rights
create or replace function selftest.l1f4_sebagai_pemilik(p_user uuid, p_sql text)
returns text language plpgsql set search_path = public, pg_temp as $$
declare v_state text; v_detail text;
begin
  perform selftest.as_user_uid(p_user);
  reset role;
  execute p_sql;
  perform selftest.as_owner();
  return 'OK';
exception when others then
  get stacked diagnostics v_state = returned_sqlstate, v_detail = pg_exception_detail;
  perform selftest.as_owner();
  return v_state || ':' || coalesce(nullif(v_detail, ''), sqlerrm);
end $$;
revoke all on function selftest.l1f4_sebagai_pemilik(uuid, text) from public;

create or replace function selftest.run_l1f4_tutup()
returns table (id text, area text, ok boolean, detail text)
language plpgsql set search_path = public, pg_temp as $$
#variable_conflict use_column
declare
  v_tag text := substr(md5(random()::text), 1, 8); v_probs jsonb := '{}'::jsonb; v_fatal text := '';
  v_a uuid; v_root_a uuid; u_sys uuid; u_adm_a uuid; u_h uuid; p_h uuid; v_req_h uuid; v_ra_h uuid;
  v_ref uuid; v_sidik text; v_period uuid; v_t text; v jsonb; v_k uuid; v_post uuid; v_y uuid; v_w uuid; v_d0 text; r record;
  u_j uuid; p_j uuid; v_req_j uuid; v_pid_j text; v_reopen uuid; n int;
begin
  perform selftest.as_owner();
  begin
    select (selftest.boot_fixture()).inst into v_a;
    select o.id into v_root_a from public.org_nodes o where o.institution_id = v_a and o.kind = 'INSTITUTION';
    u_sys := selftest.f11_user('l1f4t-sys-' || v_tag || '@local.invalid', 'SYSTEM_ADMIN', v_root_a);
    u_adm_a := selftest.f11_user('l1f4t-adm-' || v_tag || '@local.invalid', 'INSTITUTION_ADMIN', v_root_a);

    -- ═══ L1F4-K09, K10 (Sharon's interim review of ea3c4b6f): history is told from a live attachment by what is live
    -- under the deletion's lock and by what the closure recorded, never by timestamps. H: a teacher at A who closes
    u_h := selftest.f11_user('l1f4-guru-h-' || v_tag || '@local.invalid', 'EDUCATOR', v_root_a);
    select a.person_id into p_h from public.accounts a where a.auth_user_id = u_h;
    select ra.id into v_ra_h from public.role_assignments ra where ra.person_id = p_h and ra.revoked_at is null;
    if selftest.l1f4_sebagai(u_h, format('select public.minta_akun(%L, true)', 'DELETE_PERSONAL_DATA')) <> 'OK'
       or selftest.l1f4_sebagai(u_h, format('select public.minta_akun(%L, true)', 'CLOSE')) <> 'OK' then
      raise exception 'teacher H could not ask for deletion and close';
    end if;
    select q.id into v_req_h from public.account_requests q where q.person_id = p_h and q.kind = 'DELETE_PERSONAL_DATA';
    -- K10 (the record): the closure lists what was live when it was made, and the record is written once
    v_t := (select x.dipegang_saat_tutup::text from public.person_suspensions x where x.person_id = p_h and x.ended_at is null);
    if v_t is distinct from jsonb_build_object('peran', jsonb_build_array(v_ra_h), 'pindah', '[]'::jsonb, 'penilai', '[]'::jsonb)::text then
      v_probs := selftest.f11_note(v_probs, 'L1F4-K10', 'the closure recorded ' || coalesce(v_t, 'nothing') || ' (expected the one role H held: ' || v_ra_h || ')');
    end if;
    v_t := selftest.l1f4_kode(format('update public.person_suspensions set dipegang_saat_tutup = %L where person_id = %L and ended_at is null',
             '{"peran":[],"pindah":[],"penilai":[]}', p_h));
    if v_t not like '42501:%' then
      v_probs := selftest.f11_note(v_probs, 'L1F4-K10', 'rewriting the closure''s record answered ' || v_t || ' (expected 42501: written once)');
    end if;
    -- K09 (a role): granted in a transaction that BEGAN before the closure and inserted after it, so its created_at is
    -- earlier than the closure's started_at (the race's outcome, written here directly; L1F4-R01 makes it on two
    -- connections). Live, and not in the record: the deletion is refused and nothing changes
    insert into public.org_nodes (institution_id, parent_id, kind, name) values (v_a, v_root_a, 'FACULTY', 'Bagian L1F4 H ' || v_tag)
    returning org_nodes.id into v_ref;
    v_t := selftest.l1f4_sebagai_pemilik(u_adm_a, format(
      'insert into public.role_assignments (person_id, role, scope_node_id, institution_id, valid_from, valid_until, granted_by, created_at) '
      || 'values (%L, %L, %L, %L, now(), now() + interval %L, (select a.person_id from public.accounts a where a.auth_user_id = %L), '
      || '(select x.started_at - interval %L from public.person_suspensions x where x.person_id = %L and x.ended_at is null))',
      p_h, 'EDUCATOR', v_ref, v_a, '1 year', u_adm_a, '1 second', p_h));
    if v_t <> 'OK' then raise exception 'the school could not grant teacher H a role: %', v_t; end if;
    v_sidik := md5((select to_jsonb(p)::text from public.persons p where p.id = p_h)
                   || coalesce((select string_agg(to_jsonb(ra)::text, '|' order by ra.id) from public.role_assignments ra where ra.person_id = p_h), ''));
    v_t := selftest.l1f4_sebagai(u_sys, format('select public.hapus_data_pribadi(%L, %L)', v_req_h, 'sesuai permintaan'));
    if v_t <> 'PR140:ACCOUNT_LIVE_ATTACHMENT'
       or md5((select to_jsonb(p)::text from public.persons p where p.id = p_h)
              || coalesce((select string_agg(to_jsonb(ra)::text, '|' order by ra.id) from public.role_assignments ra where ra.person_id = p_h), '')) <> v_sidik then
      v_probs := selftest.f11_note(v_probs, 'L1F4-K09', 'a role created before the closure''s started_at but not held at it: the deletion answered ' || v_t
        || ' (expected PR140:ACCOUNT_LIVE_ATTACHMENT, nothing changed)');
    end if;
    update public.role_assignments set revoked_at = now(), revoked_reason = 'uji L1F4: peran baru diakhiri sekolah'
     where person_id = p_h and id <> v_ra_h and revoked_at is null;
    -- K09 (an enrolment): pending, dated before the closure; any live enrolment at deletion was gained after the closure
    -- (only while H is still live: if the role above wrongly let the deletion through, that is the finding, reported above)
    if exists (select 1 from public.persons p where p.id = p_h and p.anonymized_at is null) then
      select ap.id into v_period from public.academic_periods ap where ap.institution_id = v_a order by ap.created_at desc limit 1;
      v_t := selftest.l1f4_kode(format(
        'insert into public.enrollments (person_id, institution_id, academic_period_id, status, created_at) values (%L, %L, %L, %L, '
        || '(select x.started_at - interval %L from public.person_suspensions x where x.person_id = %L and x.ended_at is null))',
        p_h, v_a, v_period, 'PENDING', '1 second', p_h));
      if v_t <> 'OK' then raise exception 'teacher H could not be given a pending enrolment: %', v_t; end if;
      v_t := selftest.l1f4_sebagai(u_sys, format('select public.hapus_data_pribadi(%L, %L)', v_req_h, 'sesuai permintaan'));
      if v_t <> 'PR140:ACCOUNT_LIVE_ATTACHMENT' then
        v_probs := selftest.f11_note(v_probs, 'L1F4-K09', 'a pending enrolment dated before the closure: the deletion answered ' || v_t || ' (expected PR140:ACCOUNT_LIVE_ATTACHMENT)');
      end if;
      -- the school ends it (enrolments are append-only, INV-23: ended, never deleted)
      update public.enrollments e set status = 'ENDED', valid_to = now(), end_reason = 'WITHDRAWN' where e.person_id = p_h and e.status = 'PENDING';
    end if;
    -- K10 (the record holds): with only what H held at the closure live, the deletion completes
    if exists (select 1 from public.persons p where p.id = p_h and p.anonymized_at is null) then
      v_t := selftest.l1f4_sebagai(u_sys, format('select public.hapus_data_pribadi(%L, %L)', v_req_h, 'sesuai permintaan'));
      if v_t <> 'OK' or not exists (select 1 from public.persons p where p.id = p_h and p.anonymized_at is not null) then
        v_probs := selftest.f11_note(v_probs, 'L1F4-K10', 'with only the role held at the closure live, the deletion answered ' || v_t || ' (expected OK)');
      end if;
    end if;

    -- ═══ L1F4-K12 (Sharon's result review of 3a63a2b2, L1F4-A2; her "L1F4-K09", renamed: K09 was taken): a person whose
    -- personal data was deleted is never reopened. J, a teacher at A, asks for deletion, closes, and asks to reopen
    u_j := selftest.f11_user('l1f4t-guru-j-' || v_tag || '@local.invalid', 'EDUCATOR', v_root_a);
    select a.person_id into p_j from public.accounts a where a.auth_user_id = u_j;
    if selftest.l1f4_sebagai(u_j, format('select public.minta_akun(%L, true)', 'DELETE_PERSONAL_DATA')) <> 'OK'
       or selftest.l1f4_sebagai(u_j, format('select public.minta_akun(%L, true)', 'CLOSE')) <> 'OK' then
      raise exception 'teacher J could not ask for deletion and close';
    end if;
    select q.id into v_req_j from public.account_requests q where q.person_id = p_j and q.kind = 'DELETE_PERSONAL_DATA';
    v_pid_j := (select p.pintar_id from public.persons p where p.id = p_j);
    perform public.minta_buka_kembali(v_pid_j, 'uji L1F4: saya ingin akun saya dibuka kembali');
    select q.id into v_reopen from public.account_requests q where q.person_id = p_j and q.kind = 'REOPEN' and q.status = 'RECEIVED';
    if v_reopen is null then raise exception 'J''s request to reopen was not recorded before the deletion'; end if;
    -- the deletion: it completes, and ends the open request to reopen with a note
    v_t := selftest.l1f4_sebagai(u_sys, format('select public.hapus_data_pribadi(%L, %L)', v_req_j, 'sesuai permintaan'));
    -- (if J's deletion is refused, that is the finding, reported here; the rest of K12 needs it to have happened)
    if v_t <> 'OK' then
      v_probs := selftest.f11_note(v_probs, 'L1F4-K12', 'J''s deletion answered ' || v_t || ' (expected OK: J held only the role held at the closure)');
    else
      v_t := (select q.status || ':' || (q.decision_note is not null)::text from public.account_requests q where q.id = v_reopen);
      if v_t is distinct from 'DECLINED:true' then
        v_probs := selftest.f11_note(v_probs, 'L1F4-K12', 'the request to reopen made before the deletion reads ' || coalesce(v_t, 'nothing') || ' after it (expected DECLINED, with a note)');
      end if;
      -- a request made before the deletion, approved after it: refused; the closure stays open; the accounts stay locked
      v_t := selftest.l1f4_sebagai(u_sys, format('select public.buka_kembali_akun(%L, %L)', v_reopen, 'identitas diperiksa lewat telepon sekolah'));
      if v_t not like 'PR140:%' then
        v_probs := selftest.f11_note(v_probs, 'L1F4-K12', 'approving the earlier request after the deletion answered ' || v_t || ' (expected a refusal)');
      end if;
      -- a request left open from before this correction (an anonymised person's open request to reopen; L1-F4's guard on
      -- account_requests refuses a NEW one, so it is written past the guard, as data from before would be): refused
      -- ACCOUNT_ANONYMISED
      set local session_replication_role = replica;
      insert into public.account_requests (person_id, kind, pesan) values (p_j, 'REOPEN', 'uji L1F4: permintaan yang tertinggal') returning id into v_reopen;
      set local session_replication_role = origin;
      v_t := selftest.l1f4_sebagai(u_sys, format('select public.buka_kembali_akun(%L, %L)', v_reopen, 'identitas diperiksa lewat telepon sekolah'));
      if v_t <> 'PR140:ACCOUNT_ANONYMISED' then
        v_probs := selftest.f11_note(v_probs, 'L1F4-K12', 'approving an open request to reopen an anonymised person answered ' || v_t || ' (expected PR140:ACCOUNT_ANONYMISED)');
      end if;
      v_t := (select count(*)::text from public.person_suspensions x where x.person_id = p_j and x.ended_at is null and x.category = 'CLOSED_AT_REQUEST')
          || '|' || (select coalesce(string_agg((u.banned_until = public.akun_terkunci_sampai())::text, ','), '-') from public.accounts a join auth.users u on u.id = a.auth_user_id where a.person_id = p_j);
      if v_t is distinct from '1|true' then
        v_probs := selftest.f11_note(v_probs, 'L1F4-K12', 'after the refused reopens, the closure|accounts locked read ' || coalesce(v_t, '-') || ' (expected 1|true: still closed, still locked)');
      end if;
      delete from public.account_requests q where q.id = v_reopen;
      -- a request by PINTAR ID after the deletion: the same answer as for anyone, and nothing recorded
      n := (select count(*) from public.account_requests q where q.person_id = p_j and q.kind = 'REOPEN');
      v := public.minta_buka_kembali(v_pid_j, 'uji L1F4: saya ingin akun saya dibuka kembali');
      if (v ->> 'ok') is distinct from 'true' or (select count(*) from public.account_requests q where q.person_id = p_j and q.kind = 'REOPEN') <> n then
        v_probs := selftest.f11_note(v_probs, 'L1F4-K12', 'a request to reopen by PINTAR ID after the deletion answered ' || coalesce(v::text, '-') || ' or recorded a row (expected ok, nothing recorded)');
      end if;

    end if;

    -- ═══ L1F4-K11 (Daisy): the summary's «{n} sertifikat baru dapat diterbitkan» does not count a certificate that will
    -- not be issued: a key correction newly earns one for an anonymised learner and one for a live learner
    v := selftest.f13_kunci_dunia(2, 1);
    v_post := (v ->> 'post')::uuid;
    select i2.id into v_y from public.items i2 join public.lessons l on l.id = i2.lesson_id join public.modules m2 on m2.id = l.module_id
     where m2.course_id = (v ->> 'course')::uuid and i2.stem like 'Pertanyaan akhir nomor 1%';
    v_w := selftest.f13_kunci_duduk((v -> 'sesi' ->> 'u1')::uuid, v_post, v_y, 'B');
    perform selftest.f13_kunci_duduk((v -> 'sesi' ->> 'u2')::uuid, v_post, v_y, 'A');
    update public.persons set anonymized_at = now(), display_name = pintar_id
     where id = (select s.person_id from public.assessment_sessions s where s.id = v_w);
    perform selftest.as_user('boot-admin@bootstrap.pintar.test');
    v_k := (public.ajukan_koreksi_kunci(v_y, array['B'], 'uji L1F4: kunci soal akhir ini keliru') ->> 'koreksi')::uuid;
    perform selftest.as_user('boot-kaprodi@bootstrap.pintar.test');
    v := public.koreksi_kunci_dampak(v_k);
    perform selftest.as_owner();
    v_d0 := coalesce(v ->> 'sertifikat_baru_layak', '-') || '|' || coalesce(v ->> 'sertifikat_tidak_diterbitkan', '-');
    if v_d0 is distinct from '0|1' then
      v_probs := selftest.f11_note(v_probs, 'L1F4-K11', 'the summary counts (can be issued|earned, not issued) read ' || coalesce(v_d0, '-')
        || ' (expected 0|1: the anonymised learner''s certificate is not one that can be issued)');
    end if;

    raise exception 'L1F4T_UNDO';
  exception when others then
    begin perform selftest.as_owner(); exception when others then null; end;
    if sqlerrm <> 'L1F4T_UNDO' then v_fatal := sqlerrm; end if;
  end;
  area := 'L1-F4 -- the closure records what it held; the summary counts what will be issued';
  for r in select * from (values
    ('L1F4-K09', 'a live role or pending enrolment dated before the closure but not held at it refuses the deletion ACCOUNT_LIVE_ATTACHMENT, changing nothing: timestamps decide nothing'),
    ('L1F4-K10', 'the closure records the ids live when it was made, written once; with only those live the deletion completes'),
    ('L1F4-K11', 'a key correction newly earning a certificate for an anonymised learner does not count it among those that can be issued'),
    ('L1F4-K12', 'an anonymised person is never reopened: the deletion ends an open request to reopen with a note; one approved after the deletion is refused, another open one ACCOUNT_ANONYMISED; the closure stays open and the accounts locked; a request by PINTAR ID after it records nothing and answers as for anyone')
  ) z(a, b) loop
    id := r.a;
    ok := v_fatal = '' and not (v_probs ? r.a);
    detail := case when v_fatal <> '' then 'the L1F4 closure world could not run: ' || v_fatal when ok then r.b else v_probs ->> r.a end;
    return next;
  end loop;
  id := 'L1F4-TUTUP-DONE'; area := 'suite'; ok := true; detail := 'the L1-F4 closure suite ran'; return next;
end $$;
revoke all on function selftest.run_l1f4_tutup() from public;
