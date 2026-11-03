-- FABLE-26 database suite: Batch 5 (owner, 3 Nov: «Batch 5 development GO») — certificate revocation.
--
-- Ordering: depends on fable01.sql (the role switches) and fable04.sql (boot_attempt, purge_certificates).
-- Never applied as a migration; never present in production.
--
--   F26-C01  A SCHOOL ADMIN FINDS THEIR SCHOOL'S CERTIFICATES (W2.5, CR-05): sertifikat_sekolah answers the school's
--            issued certificates to the school admin (number, holder, school, state), by number from its start and by a
--            part of the holder's name, one by id (with no school named too, for whom may revoke it); a prepared (ELIGIBLE) row is never listed; a search is words, never
--            a pattern; a Guru, a head of department, another school's admin, a school admin asking for every school and
--            an anonymous caller are refused; Admin platform reads every school's
--   F26-C02  THE REVOCATION ON THE SCREEN'S PATH (W2.5, CR-05, J8.5): the school admin revokes with a reason; the list
--            then says REVOKED with when and why; the public check says DICABUT; certificate.revoked is on the record
--            with the reason; without a reason, twice, or by another school's admin it is refused and nothing changes
--   F26-I01  EACH INTEGRITY OBSERVATION HAS ITS DECISION, AND ITS OUTCOME IS SEEN (W2.7; CR-75, CR-76, CR-77): a review
--            recorded before W2.7 (no scope) still covers its sitting; a decision recorded now leaves only that
--            observation decided; integrity_reviews_recorded shows each decided observation with its decision, note,
--            time and reviewer; for a referral, the referrer sees the case waiting, whether another leader may decide,
--            and once another leader decides, the outcome, its time and note; a reviewer outside the case's management
--            scope sees that it was referred and nothing of the case; the sitting's own learner sees nothing
--
-- EVERY ROW IS ROLLED BACK: one subtransaction, verdicts collected in a jsonb of problems, a sentinel to undo the
-- lot, and the findings emitted afterwards.

create schema if not exists selftest;
grant usage on schema selftest to authenticated, anon;

do $$
begin
  if to_regprocedure('selftest.as_user(text)') is null or to_regprocedure('selftest.boot_attempt(boolean)') is null
     or to_regprocedure('selftest.purge_certificates()') is null then
    raise exception 'apply fable01 and fable04.sql before fable26.sql: the helpers are missing';
  end if;
end $$;

create or replace function selftest.f26_note(p jsonb, p_id text, p_problem text)
returns jsonb language sql immutable as $$
  select jsonb_set(coalesce(p, '{}'::jsonb), array[p_id], coalesce(p -> p_id, '[]'::jsonb) || to_jsonb(p_problem))
$$;
grant execute on function selftest.f26_note(jsonb, text, text) to authenticated, anon;

-- The SQLSTATE of one call to sertifikat_sekolah as the current role, or 'ok'.
create or replace function selftest.f26_coba(p_sekolah uuid) returns text
language plpgsql set search_path = public, pg_temp as $$
begin
  perform count(*) from public.sertifikat_sekolah(p_sekolah, null, 1, null);
  return 'ok';
exception when others then return sqlstate;
end $$;
grant execute on function selftest.f26_coba(uuid) to authenticated, anon;

-- The answer of one revocation as the current role: 'ok', or the refusal's detail or message.
create or replace function selftest.f26_cabut(p_cert uuid, p_alasan text) returns text
language plpgsql set search_path = public, pg_temp as $$
declare v_detail text;
begin
  perform public.revoke_certificate(p_cert, p_alasan);
  return 'ok';
exception when others then
  get stacked diagnostics v_detail = pg_exception_detail;
  return coalesce(nullif(v_detail, ''), sqlerrm);
end $$;
grant execute on function selftest.f26_cabut(uuid, text) to authenticated, anon;

create or replace function selftest.run_fable26()
returns table (id text, area text, ok boolean, detail text)
language plpgsql set search_path = public, pg_temp as $$
declare
  r record; v_probs jsonb := '{}'::jsonb; v_fatal text := '';
  v_s1 uuid; v_cert uuid; v_elig uuid; v_inst uuid; v_no text; v_nama text; v_tok text; v_alpha uuid;
  v_n int; v_m int; v_k int; v_x text; v_status text; v_alasan text; v_at timestamptz; v_sekolah text;
  v_ia uuid; v_isess uuid; v_inode uuid; v_iroot uuid; v_idept uuid; v_ikadep text; v_imurid uuid; v_pemutus text;
  v_g1 uuid; v_g2 uuid; v_g3 uuid; v_g4 uuid; v_case uuid; v_rec record; v_tag text := to_char(clock_timestamp(), 'HH24MISSUS');
begin
  begin
    perform selftest.purge_certificates();
    -- two finished sittings of the bootstrap school: one certificate sealed (ISSUED), one only prepared (ELIGIBLE)
    -- (one sitting: the attempt limit allows one) prepared first, so it is read while still ELIGIBLE, then sealed
    v_s1 := selftest.boot_attempt(true);
    perform selftest.as_owner();
    select x.certificate_id into v_cert from public.certificate_prepare(v_s1, 1::smallint) x;
    select c.institution_id into v_inst from public.certificates c where c.id = v_cert;
    perform selftest.as_user('boot-admin@bootstrap.pintar.test');
    select count(*) into v_n from public.sertifikat_sekolah(v_inst, null, 1, null) s where s.id = v_cert;
    perform selftest.as_owner();
    v_elig := v_cert;
    if v_n <> 0 then v_probs := selftest.f26_note(v_probs, 'F26-C01', 'a prepared (ELIGIBLE) row is listed as a certificate'); end if;
    perform public.certificate_seal(v_cert, 1::smallint, repeat('f26', 30));
    select c.institution_id, c.certificate_number, p.display_name, c.verification_token, i.name
      into v_inst, v_no, v_nama, v_tok, v_sekolah
      from public.certificates c join public.persons p on p.id = c.person_id
      join public.institutions i on i.id = c.institution_id where c.id = v_cert;
    select n.institution_id into v_alpha from public.role_assignments ra
      join public.org_nodes n on n.id = ra.scope_node_id
      join public.accounts a on a.person_id = ra.person_id join auth.users u on u.id = a.auth_user_id
     where u.email = 'alpha-admin@synthetic.pintar.test' and ra.role = 'INSTITUTION_ADMIN' limit 1;
    if (select c.status from public.certificates c where c.id = v_cert) <> 'ISSUED' or v_elig is null
       or v_alpha is null or v_alpha = v_inst then
      raise exception 'fixture: no issued and prepared certificate of the bootstrap school, or no alpha school';
    end if;

    -- ═════════════════════════════════════════════════════════ F26-C01
    begin
      perform selftest.as_user('boot-admin@bootstrap.pintar.test');
      select count(*) into v_n from public.sertifikat_sekolah(v_inst, null, 1, null) s where s.id = v_cert;
      if v_n <> 1 then v_probs := selftest.f26_note(v_probs, 'F26-C01', 'the school admin does not see the issued certificate'); end if;
      select s.certificate_number || '|' || s.holder_name || '|' || s.institution_name || '|' || s.status::text
        into v_x from public.sertifikat_sekolah(v_inst, null, 1, v_cert) s;
      if v_x is distinct from v_no || '|' || v_nama || '|' || v_sekolah || '|ISSUED' then
        v_probs := selftest.f26_note(v_probs, 'F26-C01', format('the certificate read by id says %s, not %s|%s|%s|ISSUED', coalesce(v_x, 'nothing'), v_no, v_nama, v_sekolah));
      end if;
      select count(*) into v_n from public.sertifikat_sekolah(v_inst, left(v_no, 6), 1, null) s where s.id = v_cert;
      if v_n <> 1 then v_probs := selftest.f26_note(v_probs, 'F26-C01', 'searching the number from its start does not find it'); end if;
      select count(*) into v_n from public.sertifikat_sekolah(v_inst, right(v_no, 5), 1, null) s where s.id = v_cert;
      if v_n <> 0 then v_probs := selftest.f26_note(v_probs, 'F26-C01', 'a number is matched from its middle, not its start'); end if;
      select count(*) into v_n from public.sertifikat_sekolah(v_inst, substr(v_nama, 2, 4), 1, null) s where s.id = v_cert;
      if v_n <> 1 then v_probs := selftest.f26_note(v_probs, 'F26-C01', 'searching a part of the holder''s name does not find it'); end if;
      select count(*) into v_n from public.sertifikat_sekolah(v_inst, '%', 1, null) s;
      if v_n <> 0 then v_probs := selftest.f26_note(v_probs, 'F26-C01', 'a search for «%» was read as a pattern and answered every certificate'); end if;
      select count(*) into v_n from public.sertifikat_sekolah(v_inst, null, 2, null) s;
      if v_n <> 0 then v_probs := selftest.f26_note(v_probs, 'F26-C01', 'a second page of fewer than 20 certificates is not empty'); end if;
      v_x := selftest.f26_coba(null);
      if v_x <> '42501' then v_probs := selftest.f26_note(v_probs, 'F26-C01', 'a school admin read every school''s certificates (' || v_x || ')'); end if;
      -- one certificate by id with no school named: its own school's admin reads it (the revocation's context check)
      select count(*) into v_n from public.sertifikat_sekolah(null, null, 1, v_cert) s where s.institution_id = v_inst;
      if v_n <> 1 then v_probs := selftest.f26_note(v_probs, 'F26-C01', 'the school admin cannot read their own certificate''s school by its id'); end if;
      perform selftest.as_owner();
      foreach v_x in array array['boot-guru@bootstrap.pintar.test', 'boot-kaprodi@bootstrap.pintar.test', 'alpha-admin@synthetic.pintar.test'] loop
        perform selftest.as_user(v_x);
        if selftest.f26_coba(v_inst) <> '42501' then
          v_probs := selftest.f26_note(v_probs, 'F26-C01', v_x || ' read the bootstrap school''s certificates');
        end if;
        begin
          perform count(*) from public.sertifikat_sekolah(null, null, 1, v_cert);
          v_probs := selftest.f26_note(v_probs, 'F26-C01', v_x || ' read the bootstrap school''s certificate by its id');
        exception when insufficient_privilege then null;
        end;
        perform selftest.as_owner();
      end loop;
      if has_function_privilege('anon', 'public.sertifikat_sekolah(uuid, text, integer, uuid)', 'EXECUTE') then
        v_probs := selftest.f26_note(v_probs, 'F26-C01', 'an anonymous caller may run the certificate list');
      end if;
      perform selftest.as_user('sysadmin@synthetic.pintar.test');
      select count(*) into v_n from public.sertifikat_sekolah(null, v_no, 1, null) s where s.id = v_cert and s.institution_name = v_sekolah;
      if v_n <> 1 then v_probs := selftest.f26_note(v_probs, 'F26-C01', 'Admin platform does not read the certificate among every school''s'); end if;
      perform selftest.as_owner();
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f26_note(v_probs, 'F26-C01', 'threw: ' || sqlerrm);
    end;

    -- ═════════════════════════════════════════════════════════ F26-C02
    begin
      perform selftest.as_user('alpha-admin@synthetic.pintar.test');
      v_x := selftest.f26_cabut(v_cert, 'f26 sekolah lain');
      if v_x = 'ok' then v_probs := selftest.f26_note(v_probs, 'F26-C02', 'another school''s admin revoked the certificate'); end if;
      perform selftest.as_user('boot-admin@bootstrap.pintar.test');
      v_x := selftest.f26_cabut(v_cert, '   ');
      if v_x = 'ok' then v_probs := selftest.f26_note(v_probs, 'F26-C02', 'a revocation without a reason was accepted'); end if;
      perform selftest.as_owner();
      if (select c.status from public.certificates c where c.id = v_cert) <> 'ISSUED' then
        v_probs := selftest.f26_note(v_probs, 'F26-C02', 'a refused revocation changed the certificate');
      end if;
      perform selftest.as_user('boot-admin@bootstrap.pintar.test');
      v_x := selftest.f26_cabut(v_cert, 'Diterbitkan keliru (uji F26)');
      if v_x <> 'ok' then v_probs := selftest.f26_note(v_probs, 'F26-C02', 'the school admin''s revocation was refused: ' || v_x); end if;
      select s.status::text, s.revoked_reason, s.revoked_at into v_status, v_alasan, v_at
        from public.sertifikat_sekolah(v_inst, null, 1, v_cert) s;
      if v_status is distinct from 'REVOKED' or v_alasan is distinct from 'Diterbitkan keliru (uji F26)' or v_at is null then
        v_probs := selftest.f26_note(v_probs, 'F26-C02', format('the list then says %s, %s, %s; expected REVOKED with its reason and time', v_status, v_alasan, v_at));
      end if;
      v_x := selftest.f26_cabut(v_cert, 'kedua kali');
      if v_x is distinct from 'CERTIFICATE_ALREADY_REVOKED' then
        v_probs := selftest.f26_note(v_probs, 'F26-C02', 'a second revocation answered ' || v_x || ', not CERTIFICATE_ALREADY_REVOKED');
      end if;
      perform selftest.as_owner();
      if (select c.revoked_reason from public.certificates c where c.id = v_cert) is distinct from 'Diterbitkan keliru (uji F26)' then
        v_probs := selftest.f26_note(v_probs, 'F26-C02', 'the second revocation changed the recorded reason');
      end if;
      select v.validity into v_x from public.verify_certificate(v_tok) v;
      if v_x is distinct from 'DICABUT' then v_probs := selftest.f26_note(v_probs, 'F26-C02', 'the public check says ' || coalesce(v_x, 'nothing') || ', not DICABUT'); end if;
      select count(*) into v_n from public.audit_log l
       where l.action = 'certificate.revoked' and l.target_id = v_cert::text and l.summary ->> 'reason' = 'Diterbitkan keliru (uji F26)';
      if v_n <> 1 then v_probs := selftest.f26_note(v_probs, 'F26-C02', format('%s certificate.revoked record(s) with the reason, expected 1', v_n)); end if;
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f26_note(v_probs, 'F26-C02', 'threw: ' || sqlerrm);
    end;

    -- ═════════════════════════════════════════════════════════ F26-I01
    begin
      select i.id into v_ia from public.institutions i where i.slug like 'synth-alpha-%' limit 1;
      select s.id, s.class_node_id into v_isess, v_inode from public.assessment_sessions s
       where s.institution_id = v_ia and s.class_node_id is not null and not public.session_is_professional(s.id)
       order by s.created_at limit 1;
      select n.id into v_iroot from public.org_nodes n where n.institution_id = v_ia and n.kind = 'FACULTY' order by n.created_at limit 1;
      if v_ia is null or v_isess is null or v_iroot is null then raise exception 'fixture: no alpha sitting or faculty'; end if;
      select a.auth_user_id into v_imurid from public.assessment_sessions s join public.accounts a on a.person_id = s.person_id where s.id = v_isess;
      -- a head of a department that does not hold the sitting's class: may review, has no management scope over the case
      insert into public.org_nodes (institution_id, parent_id, kind, name)
      values (v_ia, v_iroot, 'DEPARTMENT', 'Departemen F26 ' || v_tag) returning org_nodes.id into v_idept;
      v_ikadep := 'f26-kadep-' || v_tag || '@synthetic.pintar.test';
      perform selftest.f05_actor(v_ikadep, 'HEAD_OF_DEPARTMENT', v_idept);
      -- two observations reviewed before W2.7: a review row with no scope, recorded after both, covers the sitting
      insert into public.integrity_signals (session_id, institution_id, category, observed_at)
      values (v_isess, v_ia, 'NAVIGATION', now() - interval '10 minutes') returning integrity_signals.id into v_g1;
      insert into public.integrity_signals (session_id, institution_id, category, observed_at)
      values (v_isess, v_ia, 'VISIBILITY_CHANGE', now() - interval '9 minutes') returning integrity_signals.id into v_g2;
      insert into public.audit_log (at, actor_person_id, action, target_table, target_id, institution_id, summary)
      select now() - interval '8 minutes', a.person_id, 'INTEGRITY_SIGNAL_REVIEWED', 'integrity_signals', v_g2::text, v_ia,
             jsonb_build_object('session_id', v_isess, 'category', 'VISIBILITY_CHANGE', 'decision', 'NO_CONCERN', 'note', 'lama')
        from public.accounts a join auth.users u on u.id = a.auth_user_id where u.email = 'alpha-admin@synthetic.pintar.test' limit 1;
      -- two observations after it
      insert into public.integrity_signals (session_id, institution_id, category, observed_at)
      values (v_isess, v_ia, 'NAVIGATION', now() - interval '5 minutes') returning integrity_signals.id into v_g3;
      insert into public.integrity_signals (session_id, institution_id, category, observed_at)
      values (v_isess, v_ia, 'RECONNECT', now() - interval '4 minutes') returning integrity_signals.id into v_g4;

      perform selftest.as_user('alpha-admin@synthetic.pintar.test');
      select coalesce(string_agg(w.signal_id::text, ',' order by w.observed_at), '') into v_x
        from public.integrity_signals_awaiting_review() w where w.session_id = v_isess;
      if v_x is distinct from v_g3::text || ',' || v_g4::text then
        v_probs := selftest.f26_note(v_probs, 'F26-I01', 'before any new decision the waiting list is not exactly the two observations after the earlier sitting review');
      end if;
      -- one decision on the newest: a referral, with its note
      perform public.record_integrity_review(v_g4, 'REFERRED_TO_INSTITUTION', 'Perlu dibahas (F26)');
      select coalesce(string_agg(w.signal_id::text, ','), '') into v_x from public.integrity_signals_awaiting_review() w where w.session_id = v_isess;
      if v_x is distinct from v_g3::text then
        v_probs := selftest.f26_note(v_probs, 'F26-I01', 'a decision on one observation did not leave exactly the other one waiting');
      end if;
      select * into v_rec from public.integrity_reviews_recorded(1) rr where rr.signal_id = v_g4;
      if v_rec.signal_id is null or v_rec.decision is distinct from 'REFERRED_TO_INSTITUTION' or v_rec.note is distinct from 'Perlu dibahas (F26)'
         or v_rec.reviewer_name is null or v_rec.case_id is null or v_rec.case_visible is not true
         or v_rec.case_state is distinct from 'AWAITING_REVIEW' or v_rec.case_raised_by_me is not true or v_rec.case_outcome is not null
         or v_rec.case_other_decider is null then
        v_probs := selftest.f26_note(v_probs, 'F26-I01', format('the referrer''s reviewed row reads %s', row_to_json(v_rec)));
      end if;
      v_case := v_rec.case_id;
      select count(*) into v_n from public.integrity_reviews_recorded(1) rr where rr.signal_id in (v_g1, v_g2)and rr.decision = 'NO_CONCERN';
      if v_n <> 2 then v_probs := selftest.f26_note(v_probs, 'F26-I01', format('%s of the two observations the earlier sitting review covered are shown decided', v_n)); end if;
      select count(*) into v_n from public.integrity_reviews_recorded(1) rr where rr.signal_id = v_g3;
      if v_n <> 0 then v_probs := selftest.f26_note(v_probs, 'F26-I01', 'an undecided observation is shown as reviewed'); end if;
      perform selftest.as_owner();

      -- a reviewer outside the case's management scope: sees it was referred, nothing of the case
      perform selftest.as_user(v_ikadep);
      select * into v_rec from public.integrity_reviews_recorded(1) rr where rr.signal_id = v_g4;
      if v_rec.signal_id is null or v_rec.case_id is null or v_rec.case_visible is not false or v_rec.case_state is not null
         or v_rec.case_note is not null or v_rec.case_raised_by_me is not false or v_rec.case_other_decider is not null then
        v_probs := selftest.f26_note(v_probs, 'F26-I01', format('a reviewer outside the case''s scope reads %s', row_to_json(v_rec)));
      end if;
      perform selftest.as_owner();
      -- the sitting's own learner: nothing
      perform selftest.as_user_uid(v_imurid);
      select count(*) into v_n from public.integrity_reviews_recorded(1) rr where rr.session_id = v_isess;
      perform selftest.as_owner();
      if v_n <> 0 then v_probs := selftest.f26_note(v_probs, 'F26-I01', format('the sitting''s own learner is shown %s reviewed observation(s)', v_n)); end if;

      -- another leader decides; the referrer then reads the outcome
      v_pemutus := null;
      foreach v_x in array array['alpha-dean@synthetic.pintar.test', 'alpha-hod@synthetic.pintar.test', 'alpha-guru@synthetic.pintar.test'] loop
        perform selftest.as_user(v_x);
        if public.management_scope_over_node(v_inode) then v_pemutus := v_x; end if;
        perform selftest.as_owner();
        exit when v_pemutus is not null;
      end loop;
      if v_pemutus is null then raise exception 'fixture: no alpha leader stands over the sitting''s class'; end if;
      perform selftest.as_user(v_pemutus);
      perform public.advance_management_decision(v_case, 'DECIDED', 'LEARNER_SUPPORT_ARRANGED', 'Didampingi wali kelas (F26)');
      perform selftest.as_user('alpha-admin@synthetic.pintar.test');
      select * into v_rec from public.integrity_reviews_recorded(1) rr where rr.signal_id = v_g4;
      perform selftest.as_owner();
      if v_rec.case_state is distinct from 'DECIDED' or v_rec.case_outcome is distinct from 'LEARNER_SUPPORT_ARRANGED'
         or v_rec.case_decided_at is null or v_rec.case_note is distinct from 'Didampingi wali kelas (F26)' then
        v_probs := selftest.f26_note(v_probs, 'F26-I01', format('after the decision the referrer reads %s', row_to_json(v_rec)));
      end if;
      if has_function_privilege('anon', 'public.integrity_reviews_recorded(integer)', 'EXECUTE') then
        v_probs := selftest.f26_note(v_probs, 'F26-I01', 'an anonymous caller may run the reviewed list');
      end if;
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f26_note(v_probs, 'F26-I01', 'threw: ' || sqlerrm);
    end;

    raise exception 'F26_ROLLBACK';
  exception when others then
    perform selftest.as_owner();
    if sqlerrm <> 'F26_ROLLBACK' then v_fatal := sqlerrm; end if;
  end;
  perform selftest.as_owner();

  for r in select * from unnest(
      array['F26-C01', 'F26-C02', 'F26-I01'],
      array['W2.5 -- a school admin finds their school''s certificates', 'W2.5 -- the revocation on the screen''s path',
            'W2.7 -- each integrity observation has its decision, and its outcome is seen'],
      array[
        'sertifikat_sekolah: the school admin reads the issued certificate (number, holder, school, state), by number from '
          || 'its start and by a part of the name, one by id; the prepared row is not listed; «%» matches nothing; a Guru, '
          || 'a head of department, another school''s admin and a school admin asking for every school are refused 42501; '
          || 'anon cannot run it; Admin platform reads it among every school''s',
        'another school''s admin and a reasonless revocation are refused and change nothing; the school admin revokes with '
          || 'a reason; the list says REVOKED with its reason and time; a second revocation is refused '
          || '(CERTIFICATE_ALREADY_REVOKED) and the reason stands; the public check says DICABUT; certificate.revoked is '
          || 'recorded once with the reason',
        'a review recorded before W2.7 still covers its sitting; a decision now leaves exactly the other observation '
          || 'waiting; integrity_reviews_recorded shows the decision, note, time and reviewer; the referrer sees the case '
          || 'AWAITING_REVIEW with whether another leader may decide, then DECIDED with its outcome, time and note once '
          || 'another leader decides; a reviewer outside the case''s scope sees it was referred and nothing of the case; '
          || 'the learner sees nothing; anon cannot run it'
      ]) as t(tid, tarea, tdetail)
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

  id := 'F26-DONE'; area := 'suite'; ok := v_fatal = '';
  detail := case when v_fatal = '' then 'FABLE-26 suite complete; every row rolled back'
                 else 'the suite did not complete: ' || left(v_fatal, 200) end;
  return next;
end $$;
revoke all on function selftest.run_fable26() from public;
