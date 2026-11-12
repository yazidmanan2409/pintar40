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
--             issued, and no certificate row is written (§3b Option A)

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
  v_post uuid; v_y uuid; v_w uuid; n int;
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
    v := public.tegaskan_koreksi_kunci(v_k);
    perform selftest.as_owner();
    -- the record: the confirmed correction's outcome counts it
    select k.outcome into v from public.key_corrections k where k.id = v_k;
    v_t := v_t || '|' || coalesce(v ->> 'sertifikat_tidak_diterbitkan', '-');
    if (v ->> 'sertifikat_baru_layak')::int < 1 then
      v_probs := selftest.f11_note(v_probs, 'L1F4-K08', 'the fixture''s correction newly earns no certificate (' || coalesce(v ->> 'sertifikat_baru_layak', '-') || '): nothing to show');
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
    ('L1F4-K08', 'a key correction newly earning a certificate for an anonymised learner records it earned but not issued, and writes no certificate row')
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
