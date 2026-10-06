-- FABLE-18 database suite: BOB-26, a person activates their own account
-- (identity Gate 3; D-054, D-077, D-079). Migration 20261112100000.
--
-- Ordering: depends on fable01.sql (role switches), fable04.sql (the bootstrap
-- learner's certified attempt) and fable11.sql (the raised-error reader).
-- Never applied as a migration; never present in production.
--
--   F18-N01  THE IRONMAN TEST, the database's half (D-077(4)): Bagas Saputra, a
--            Murid on a class card and a Guru each try to rename themselves
--            «Ironman» straight at the table, and the database refuses all
--            three; their names are unchanged
--   F18-N02  the one confirmation at activation (D-077(1)): the name is shown
--            as registered, corrected once and confirmed, audited (old, new,
--            who); a second confirmation, a confirmation after set-up and an
--            invalid name are refused; a class card has none
--   F18-N03  the one governed correction afterwards (D-077(3)): the platform
--            admin corrects with a reason, audited (from, to, reason); a school
--            admin, a Guru, the person and a class card are refused
--   F18-N04  historical certificates keep the name sealed for them (INV-30):
--            a certificate issued before the correction still reads «Bagas
--            Saputra», byte for byte; one issued after it reads the corrected
--            name
--   F18-N05  the current identity reads the corrected name: the card's data
--            (staff only, C17) and the wizard's state
--   F18-P01  a password is written only through a permit: Auth's own write of
--            a new hash, as Auth's own role, is refused without one; a permit
--            is single-use, a minute long, for a REQUIRED email account only,
--            records the wizard's step and is audited
--   F18-S01  the wizard's state and its finish: completion needs the username,
--            the password, the PIN and the name, and says what is missing
--   F18-L01  the signed-out lookups and counters: who is sent a code, what a
--            sign-in name resolves to, the password sign-in's backoff scope,
--            and the read-only limits check
--   F18-I01  every name an import will record, paged, for the job's own school
--            only (D-077(4))
--   F18-A01  access: the service-role functions are no client's; the permit
--            table has RLS, no policy and no grant
--
-- EVERY ROW IS ROLLED BACK. The suite works in its own subtransaction, notes
-- problems per id, raises a sentinel to undo everything, then emits.

create schema if not exists selftest;
grant usage on schema selftest to authenticated, anon;

do $$
begin
  if to_regprocedure('selftest.as_user(text)') is null or to_regprocedure('selftest.as_owner()') is null
     or to_regprocedure('selftest.boot_attempt(boolean)') is null or to_regprocedure('selftest.purge_certificates()') is null
     or to_regprocedure('selftest.f11_raised(text)') is null then
    raise exception 'apply fable01.sql, fable04.sql and fable11.sql before fable18.sql: the helpers are missing';
  end if;
end $$;

create or replace function selftest.f18_note(p jsonb, p_id text, p_problem text)
returns jsonb language sql immutable as $$
  select jsonb_set(coalesce(p, '{}'::jsonb), array[p_id], coalesce(p -> p_id, '[]'::jsonb) || to_jsonb(p_problem))
$$;
grant execute on function selftest.f18_note(jsonb, text, text) to authenticated, anon;

-- The refusal's code: PR040's DETAIL, else the SQLSTATE; NULL when it ran.
create or replace function selftest.f18_kode(p_sql text)
returns text language plpgsql set search_path = public, pg_temp as $$
declare v jsonb := selftest.f11_raised(p_sql);
begin
  if v is null then return null; end if;
  return case when v ->> 'code' = 'PR040' then v ->> 'detail' else v ->> 'code' end;
end $$;
grant execute on function selftest.f18_kode(text) to authenticated, anon;

-- A person registered the way the platform admin registers one (D-077(2)'s
-- «Orang baru»): authorize_new_person grants the address, and Auth's insert
-- takes the grant (handle_new_auth_user). A staff role makes them a Guru.
create or replace function selftest.f18_daftar(p_nama text, p_email text, p_guru boolean)
returns uuid language plpgsql set search_path = public, pg_temp as $$
declare v_uid uuid := gen_random_uuid(); v_person uuid; v_node uuid; v_inst uuid;
begin
  perform selftest.as_user('sysadmin@synthetic.pintar.test');
  perform public.authorize_new_person(p_nama, p_email);
  perform selftest.as_owner();
  insert into auth.users (id, instance_id, aud, role, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data)
  values (v_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', p_email, now(),
          '{"provider":"email","providers":["email"]}', '{}');
  select a.person_id into v_person from public.accounts a where a.auth_user_id = v_uid;
  if v_person is null then raise exception 'f18_daftar: no person was made for %', p_email; end if;
  if p_guru then
    select ra.scope_node_id, ra.institution_id into v_node, v_inst from public.role_assignments ra
      join public.accounts a on a.person_id = ra.person_id join auth.users u on u.id = a.auth_user_id
     where u.email = 'alpha-guru@synthetic.pintar.test' and ra.role = 'EDUCATOR' limit 1;
    -- a fixture grant, the way selftest.f11_user makes one
    perform set_config('app.seed_intent', 'synthetic', true);
    insert into public.role_assignments (person_id, role, scope_node_id, institution_id, valid_from, valid_until)
    values (v_person, 'EDUCATOR', v_node, v_inst, now() - interval '1 day', now() + interval '365 days');
    perform set_config('app.seed_intent', '', true);
  end if;
  return v_uid;
end $$;
revoke all on function selftest.f18_daftar(text, text, boolean) from public;

-- Auth writing a password hash, as Auth's own role writes it
create or replace function selftest.f18_tulis_sandi(p_uid uuid, p_hash text)
returns void language plpgsql set search_path = public, pg_temp as $$
declare v_tabel oid;
begin
  reset role;
  v_tabel := 'auth.users'::regclass;
  -- As Auth's own role where this login may become it and it can write
  -- auth.users; otherwise as this login. The guard under test is a trigger, so
  -- it fires for either writer (Auth's real path is BOB26-A03, over HTTP).
  begin
    set local role supabase_auth_admin;
  exception when others then null;
  end;
  if not (has_schema_privilege(current_user, 'auth', 'usage') and has_table_privilege(current_user, v_tabel, 'update')) then
    reset role;
  end if;
  update auth.users set encrypted_password = p_hash where id = p_uid;
  reset role;
end $$;
revoke all on function selftest.f18_tulis_sandi(uuid, text) from public;

create or replace function selftest.run_fable18()
returns table (id text, area text, ok boolean, detail text)
language plpgsql set search_path = public, pg_temp as $$
declare
  v_probs jsonb := '{}'::jsonb; v_fatal text := ''; v_tag text;
  v_bagas uuid; v_pb uuid; v_email text; v_lain uuid; v_pl uuid; v_elain text;
  v_card uuid; v_guru uuid; v_siswa uuid; v_psiswa uuid;
  k text; v text; n int; j jsonb; r record; v_cert1 uuid; v_cert2 uuid; v_hash1 text; v_sess uuid;
  v_nama text; v_job uuid; v_inst uuid; v_admin uuid;
begin
  perform selftest.as_owner();
  begin
    v_tag := substr(md5(random()::text), 1, 8);
    v_email := 'f18-bagas-' || v_tag || '@local.invalid';
    v_elain := 'f18-lain-' || v_tag || '@local.invalid';
    -- «Bagas Saputra», registered with a slip of the keyboard, the way names arrive
    v_bagas := selftest.f18_daftar('Bagas Saputro', v_email, true);
    v_lain := selftest.f18_daftar('Nama Lain Uji', v_elain, false);
    select a.person_id into v_pb from public.accounts a where a.auth_user_id = v_bagas;
    select a.person_id into v_pl from public.accounts a where a.auth_user_id = v_lain;
    select a.person_id into v_card from public.accounts a join auth.users u on u.id = a.auth_user_id where u.email = 'card-7001@cards.synthetic.pintar.test';
    select a.person_id into v_guru from public.accounts a join auth.users u on u.id = a.auth_user_id where u.email = 'alpha-guru@synthetic.pintar.test';

    -- ═══════════════════════════════════════════════ F18-L01 the lookups
    if (select count(*) from public.activation_code_target(upper(v_email))) <> 1
       or (select t.nama from public.activation_code_target(' ' || v_email || ' ') t) is distinct from 'Bagas Saputro' then
      v_probs := selftest.f18_note(v_probs, 'F18-L01', 'a provisioned, unfinished email account is not named for a code (any case, any spacing)');
    end if;
    foreach v in array array['alpha-guru@synthetic.pintar.test', 'card-7001@cards.synthetic.pintar.test',
                             'tidak-ada-' || v_tag || '@local.invalid', '', 'bukan alamat'] loop
      if exists (select 1 from public.activation_code_target(v)) then
        v_probs := selftest.f18_note(v_probs, 'F18-L01', format('%s would be sent a code (only a REQUIRED email account is)', coalesce(nullif(v, ''), 'an empty address')));
      end if;
    end loop;
    if exists (select 1 from public.activation_code_target((select u.email from auth.users u join public.accounts a on a.auth_user_id = u.id
                join public.evaluation_personas e on e.person_id = a.person_id limit 1))) then
      v_probs := selftest.f18_note(v_probs, 'F18-L01', 'an evaluation persona would be sent a code (C13)');
    end if;
    if public.signin_resolve('ALPHA-GURU@synthetic.pintar.test ') is distinct from 'alpha-guru@synthetic.pintar.test'
       or public.signin_resolve('Uji.Alpha.Guru') is distinct from 'alpha-guru@synthetic.pintar.test' then
      v_probs := selftest.f18_note(v_probs, 'F18-L01', 'an email or a username does not resolve to its account''s address');
    end if;
    if public.signin_resolve('card-7001@cards.synthetic.pintar.test') is not null or public.signin_resolve('tidak.ada.' || v_tag) is not null
       or public.signin_resolve('') is not null or public.signin_resolve(repeat('a', 400)) is not null then
      v_probs := selftest.f18_note(v_probs, 'F18-L01', 'a class card, an unknown name or nothing resolved to an address');
    end if;
    k := encode(sha256(convert_to('f18-' || v_tag, 'UTF8')), 'hex');
    for n in 1..5 loop
      if public.identity_attempt('PASSWORD_SIGNIN', k) <> 0 then
        v_probs := selftest.f18_note(v_probs, 'F18-L01', format('sign-in attempt %s was held (5 are free)', n));
      end if;
    end loop;
    if public.identity_attempt('PASSWORD_SIGNIN', k) < 1 then
      v_probs := selftest.f18_note(v_probs, 'F18-L01', 'a sixth sign-in attempt within 15 minutes was not held');
    end if;
    perform public.identity_attempt_settle('PASSWORD_SIGNIN', k, 'OK');
    if public.identity_attempt('PASSWORD_SIGNIN', k) <> 0 then
      v_probs := selftest.f18_note(v_probs, 'F18-L01', 'a successful sign-in did not clear the account''s record');
    end if;
    if selftest.f18_kode(format('select public.identity_attempt(%L, %L)', 'CARD', k)) is distinct from '22023' then
      v_probs := selftest.f18_note(v_probs, 'F18-L01', 'an unknown attempt scope was accepted');
    end if;
    if public.email_resend_seconds() <> (select l.window_seconds from public.email_send_limits l where l.scope = 'ADDRESS_KIND') then
      v_probs := selftest.f18_note(v_probs, 'F18-L01', 'the resend countdown is not the address-and-kind limit');
    end if;
    delete from public.email_send_log;
    v := encode(sha256(convert_to('f18-kirim-' || v_tag, 'UTF8')), 'hex');
    if not public.email_send_would_allow('KODE_AKTIVASI', v) then
      v_probs := selftest.f18_note(v_probs, 'F18-L01', 'a first code to an address would not be allowed');
    end if;
    perform public.email_send_reserve('KODE_AKTIVASI', v);
    if public.email_send_would_allow('KODE_AKTIVASI', v) then
      v_probs := selftest.f18_note(v_probs, 'F18-L01', 'a second code to the same address within the minute would be allowed');
    end if;
    if (select count(*) from public.email_send_log) <> 1 then
      v_probs := selftest.f18_note(v_probs, 'F18-L01', 'asking whether a send would be allowed wrote to the send log');
    end if;

    -- ═══════════════════════════════════════════════ F18-P01 the permit
    -- Auth itself (its own role) writing a first password for Bagas, unasked:
    -- the "signed-in session changes the password" path, one layer down
    k := selftest.f18_kode(format('select selftest.f18_tulis_sandi(%L, %L)', v_bagas, extensions.crypt('x', extensions.gen_salt('bf', 4))));
    if k is distinct from 'PASSWORD_WRITE_REFUSED' then
      v_probs := selftest.f18_note(v_probs, 'F18-P01', format('Auth wrote a password with no permit (%s)', coalesce(k, 'it was written')));
    end if;
    perform selftest.as_owner();
    perform public.password_write_permit(v_bagas, 'ACTIVATION');
    k := selftest.f18_kode(format('select selftest.f18_tulis_sandi(%L, %L)', v_bagas, extensions.crypt('Bagas-Sandi-2026', extensions.gen_salt('bf', 4))));
    perform selftest.as_owner();
    if k is not null then v_probs := selftest.f18_note(v_probs, 'F18-P01', 'a permitted password write was refused: ' || k); end if;
    if not exists (select 1 from public.account_setup s join public.accounts a on a.id = s.account_id
                    where a.auth_user_id = v_bagas and s.password_set_at is not null) then
      v_probs := selftest.f18_note(v_probs, 'F18-P01', 'the permitted write did not record the wizard''s password step');
    end if;
    -- (a failure above is noted; the step is recorded here so the rest can still be asked)
    update public.account_setup s set password_set_at = coalesce(s.password_set_at, now())
      from public.accounts a where a.id = s.account_id and a.auth_user_id = v_bagas;
    if exists (select 1 from public.password_write_permits p where p.auth_user_id = v_bagas) then
      v_probs := selftest.f18_note(v_probs, 'F18-P01', 'the permit was not consumed');
    end if;
    k := selftest.f18_kode(format('select selftest.f18_tulis_sandi(%L, %L)', v_bagas, extensions.crypt('lagi', extensions.gen_salt('bf', 4))));
    perform selftest.as_owner();
    if k is distinct from 'PASSWORD_WRITE_REFUSED' then v_probs := selftest.f18_note(v_probs, 'F18-P01', 'one permit wrote twice'); end if;
    perform public.password_write_permit(v_bagas, 'ACTIVATION');
    update public.password_write_permits set expires_at = clock_timestamp() - interval '1 second' where auth_user_id = v_bagas;
    k := selftest.f18_kode(format('select selftest.f18_tulis_sandi(%L, %L)', v_bagas, extensions.crypt('lambat', extensions.gen_salt('bf', 4))));
    perform selftest.as_owner();
    if k is distinct from 'PASSWORD_WRITE_REFUSED' then v_probs := selftest.f18_note(v_probs, 'F18-P01', 'an expired permit wrote a password'); end if;
    delete from public.password_write_permits where auth_user_id = v_bagas;
    -- clearing a hash (Auth's own clean-up) is not a new password
    k := selftest.f18_kode(format('select selftest.f18_tulis_sandi(%L, null)', v_lain));
    perform selftest.as_owner();
    if k is not null then v_probs := selftest.f18_note(v_probs, 'F18-P01', 'clearing a password hash was refused: ' || k); end if;
    foreach v in array array['alpha-guru@synthetic.pintar.test', 'card-7001@cards.synthetic.pintar.test'] loop
      k := selftest.f18_kode(format('select public.password_write_permit((select id from auth.users where email = %L), %L)', v, 'ACTIVATION'));
      if k is distinct from 'SETUP_NOT_REQUIRED' then
        v_probs := selftest.f18_note(v_probs, 'F18-P01', format('%s got an activation permit (%s)', v, coalesce(k, 'given')));
      end if;
    end loop;
    if selftest.f18_kode(format('select public.password_write_permit(%L, %L)', v_bagas, 'RECOVERY')) is distinct from '22023' then
      v_probs := selftest.f18_note(v_probs, 'F18-P01', 'a permit for an unknown purpose was given');
    end if;
    if not exists (select 1 from public.audit_log l where l.action = 'identity.password_set' and l.target_id = v_bagas::text
                    and l.summary ->> 'purpose' = 'ACTIVATION' and l.summary::text !~* 'crypt|\$2[aby]\$') then
      v_probs := selftest.f18_note(v_probs, 'F18-P01', 'the password write was not audited, or the audit carries a hash');
    end if;

    -- ═══════════════════════════════════════════════ F18-N02 the name step, F18-S01 the finish
    perform selftest.as_user(v_email);
    j := public.my_setup_progress();
    if j ->> 'state' <> 'REQUIRED' or j ->> 'name' <> 'Bagas Saputro' or (j ->> 'name_confirmed')::boolean
       or not (j ->> 'password')::boolean or (j ->> 'pin')::boolean or j ->> 'username' is not null
       or not (j ->> 'staff')::boolean or j ->> 'pintar_id' is null then
      v_probs := selftest.f18_note(v_probs, 'F18-S01', 'the wizard''s state is not what was done: ' || j::text);
    end if;
    perform public.claim_username('bagas.' || v_tag);
    perform public.set_my_pin('2817');
    k := selftest.f18_kode('select public.complete_my_setup()');
    if k is distinct from 'SETUP_INCOMPLETE' then
      v_probs := selftest.f18_note(v_probs, 'F18-S01', 'set-up completed before the name was confirmed');
    end if;
    k := selftest.f18_kode(format('select public.confirm_my_name(%L)', E'Bagas\u0001Saputra'));
    if k is distinct from 'NAME_INVALID' then v_probs := selftest.f18_note(v_probs, 'F18-N02', 'a name with a control character was taken'); end if;
    k := selftest.f18_kode(format('select public.confirm_my_name(%L)', '   '));
    if k is distinct from 'NAME_INVALID' then v_probs := selftest.f18_note(v_probs, 'F18-N02', 'an empty name was taken'); end if;
    -- «Ubah nama», then «Sudah benar»
    begin v_nama := public.confirm_my_name('  Bagas   Saputra ');
    exception when others then v_nama := 'refused: ' || sqlerrm; end;
    if v_nama is distinct from 'Bagas Saputra' then v_probs := selftest.f18_note(v_probs, 'F18-N02', 'the correction did not come back as kept: ' || coalesce(v_nama, 'nothing')); end if;
    k := selftest.f18_kode(format('select public.confirm_my_name(%L)', 'Bagas Lagi'));
    if k is distinct from 'NAME_ALREADY_CONFIRMED' then v_probs := selftest.f18_note(v_probs, 'F18-N02', 'the name could be corrected a second time'); end if;
    begin k := public.complete_my_setup(); exception when others then k := sqlerrm; end;
    if k is distinct from 'COMPLETE' or public.my_setup_state() <> 'COMPLETE' then
      v_probs := selftest.f18_note(v_probs, 'F18-S01', 'all four steps did not complete set-up');
    end if;
    k := selftest.f18_kode('select public.confirm_my_name(null)');
    if k is distinct from 'SETUP_COMPLETE' then v_probs := selftest.f18_note(v_probs, 'F18-N02', 'the name step was open after set-up'); end if;
    perform selftest.as_owner();
    if (select display_name from public.persons p0 where p0.id = v_pb) is distinct from 'Bagas Saputra' then
      v_probs := selftest.f18_note(v_probs, 'F18-N02', 'the corrected name is not the person''s');
    end if;
    if not exists (select 1 from public.audit_log l where l.action = 'identity.name_corrected_at_activation' and l.target_id = v_pb::text
                    and l.summary ->> 'from' = 'Bagas Saputro' and l.summary ->> 'to' = 'Bagas Saputra' and l.actor_person_id = v_pb)
       or not exists (select 1 from public.audit_log l where l.action = 'identity.name_confirmed' and l.target_id = v_pb::text
                    and l.summary ->> 'name' = 'Bagas Saputra' and l.actor_person_id = v_pb) then
      v_probs := selftest.f18_note(v_probs, 'F18-N02', 'the correction or the confirmation was not audited with the old name, the new name and who');
    end if;
    -- «Sudah benar» as it is; and a class card has no name step
    perform selftest.as_user(v_elain);
    if public.confirm_my_name(null) is distinct from 'Nama Lain Uji' then
      v_probs := selftest.f18_note(v_probs, 'F18-N02', '«Sudah benar» changed the name');
    end if;
    -- and the password is needed: username, PIN and name, but no password
    perform public.claim_username('lain.' || v_tag);
    perform public.set_my_pin('7394');
    k := selftest.f18_kode('select public.complete_my_setup()');
    if k is distinct from 'SETUP_INCOMPLETE' then v_probs := selftest.f18_note(v_probs, 'F18-S01', 'set-up completed with no password'); end if;
    perform selftest.as_user('card-7001@cards.synthetic.pintar.test');
    k := selftest.f18_kode(format('select public.confirm_my_name(%L)', 'Ironman'));
    if k is distinct from 'IDENTITY_NOT_ELIGIBLE' then v_probs := selftest.f18_note(v_probs, 'F18-N02', 'a class card has a name step: ' || coalesce(k, 'renamed')); end if;
    perform selftest.as_owner();

    -- ═══════════════════════════════════════════════ F18-N01 the Ironman test
    foreach v in array array[v_email, 'card-7001@cards.synthetic.pintar.test', 'alpha-guru@synthetic.pintar.test'] loop
      perform selftest.as_user(v);
      begin
        update public.persons p0 set display_name = 'Ironman' where p0.id = public.current_person_id();
        get diagnostics n = row_count;
        perform selftest.as_owner();
        v_probs := selftest.f18_note(v_probs, 'F18-N01', format('%s renamed themselves «Ironman» straight at the table (%s row)', v, n));
      exception when insufficient_privilege then
        perform selftest.as_owner();
      end;
    end loop;
    if exists (select 1 from public.persons p0 where p0.id in (v_pb, v_card, v_guru) and display_name = 'Ironman') then
      v_probs := selftest.f18_note(v_probs, 'F18-N01', 'a name reads «Ironman»');
    end if;
    if (select display_name from public.persons p0 where p0.id = v_pb) is distinct from 'Bagas Saputra' then
      v_probs := selftest.f18_note(v_probs, 'F18-N01', 'Bagas''s confirmed name changed');
    end if;

    -- ═══════════════════════════════════════════════ F18-N04 before the correction: a certificate
    select a.person_id into v_psiswa from public.accounts a join auth.users u on u.id = a.auth_user_id where u.email = 'boot-siswa@bootstrap.pintar.test';
    -- the bootstrap learner, registered as «Bagas Saputra» for this test (rolled back)
    update public.persons p0 set display_name = 'Bagas Saputra' where p0.id = v_psiswa;
    perform selftest.purge_certificates();
    v_sess := selftest.boot_attempt(true);
    perform selftest.as_owner();
    select c.certificate_id into v_cert1 from public.certificate_prepare(v_sess, 1::smallint) c;
    select md5(row(c.*)::text) into v_hash1 from public.certificates c where c.id = v_cert1;
    if v_cert1 is null then v_probs := selftest.f18_note(v_probs, 'F18-N04', 'no certificate could be issued to test with'); end if;

    -- ═══════════════════════════════════════════════ F18-N03 the governed correction
    foreach v in array array['alpha-admin@synthetic.pintar.test', 'alpha-guru@synthetic.pintar.test', v_email,
                             'card-7001@cards.synthetic.pintar.test', 'boot-siswa@bootstrap.pintar.test'] loop
      perform selftest.as_user(v);
      k := selftest.f18_kode(format('select public.correct_person_name(%L, %L, %L)', v_psiswa, 'Ironman', 'uji'));
      perform selftest.as_owner();
      if k is distinct from '42501' then
        v_probs := selftest.f18_note(v_probs, 'F18-N03', format('%s corrected a name (%s)', v, coalesce(k, 'it was changed')));
      end if;
    end loop;
    perform selftest.as_user('sysadmin@synthetic.pintar.test');
    if selftest.f18_kode(format('select public.correct_person_name(%L, %L, %L)', v_psiswa, 'Bagas Saputra Wijaya', ' ')) is distinct from 'REASON_REQUIRED'
       or selftest.f18_kode(format('select public.correct_person_name(%L, %L, %L)', v_psiswa, 'Bagas Saputra', 'uji')) is distinct from 'NAME_UNCHANGED'
       or selftest.f18_kode(format('select public.correct_person_name(%L, %L, %L)', gen_random_uuid(), 'Siapa', 'uji')) is distinct from 'IDENTITY_NOT_FOUND'
       or selftest.f18_kode(format('select public.correct_person_name(%L, %L, %L)', v_psiswa, '', 'uji')) is distinct from 'NAME_INVALID' then
      v_probs := selftest.f18_note(v_probs, 'F18-N03', 'a correction with no reason, no change, no person or no name was not refused by its own code');
    end if;
    if public.correct_person_name(v_psiswa, 'Bagas Saputra Wijaya', 'akta kelahiran menulis nama lengkap') is distinct from 'Bagas Saputra Wijaya'
       or public.correct_person_name(v_pb, 'Bagas Saputra Wijaya', 'akta kelahiran menulis nama lengkap') is distinct from 'Bagas Saputra Wijaya' then
      v_probs := selftest.f18_note(v_probs, 'F18-N03', 'the platform admin''s correction did not take');
    end if;
    perform selftest.as_owner();
    if (select count(*) from public.audit_log l where l.action = 'identity.name_corrected' and l.target_id in (v_psiswa::text, v_pb::text)
         and l.summary ->> 'from' = 'Bagas Saputra' and l.summary ->> 'to' = 'Bagas Saputra Wijaya'
         and l.summary ->> 'reason' = 'akta kelahiran menulis nama lengkap'
         and l.actor_person_id = (select a.person_id from public.accounts a join auth.users u on u.id = a.auth_user_id where u.email = 'sysadmin@synthetic.pintar.test')) <> 2 then
      v_probs := selftest.f18_note(v_probs, 'F18-N03', 'the correction was not audited with from, to, the reason and the platform admin');
    end if;

    -- ═══════════════════════════════════════════════ F18-N04 after it
    if (select s.name_as_issued from public.certificates c join public.certificate_identity_snapshots s on s.id = c.snapshot_id
         where c.id = v_cert1) is distinct from 'Bagas Saputra' then
      v_probs := selftest.f18_note(v_probs, 'F18-N04', 'the certificate issued before the correction no longer reads «Bagas Saputra»');
    end if;
    if (select md5(row(c.*)::text) from public.certificates c where c.id = v_cert1) is distinct from v_hash1 then
      v_probs := selftest.f18_note(v_probs, 'F18-N04', 'the certificate issued before the correction was rewritten');
    end if;
    -- the first certificate is proven unchanged above; the bootstrap learner's
    -- attempts are then cleared (fable04's own harness) so a second can be issued
    perform selftest.purge_certificates();
    v_sess := selftest.boot_attempt(true);
    perform selftest.as_owner();
    select c.certificate_id into v_cert2 from public.certificate_prepare(v_sess, 1::smallint) c;
    if (select s.name_as_issued from public.certificates c join public.certificate_identity_snapshots s on s.id = c.snapshot_id
         where c.id = v_cert2) is distinct from 'Bagas Saputra Wijaya' then
      v_probs := selftest.f18_note(v_probs, 'F18-N04', 'a certificate issued after the correction does not read the corrected name');
    end if;

    -- ═══════════════════════════════════════════════ F18-N05 the current identity
    perform selftest.as_user(v_email);
    j := public.my_identity_card();
    if j ->> 'name' <> 'Bagas Saputra Wijaya' or j ->> 'pintar_id' is distinct from (select pintar_id from public.persons p0 where p0.id = v_pb)
       or jsonb_array_length(j -> 'contexts') <> 1 or j -> 'contexts' -> 0 ->> 'role' <> 'EDUCATOR' or j -> 'contexts' -> 0 ->> 'institution' is null then
      v_probs := selftest.f18_note(v_probs, 'F18-N05', 'the card''s data is not the corrected name, the PINTAR ID and the current role and school: ' || j::text);
    end if;
    if public.my_setup_progress() ->> 'name' <> 'Bagas Saputra Wijaya' then
      v_probs := selftest.f18_note(v_probs, 'F18-N05', 'the wizard''s state does not read the corrected name');
    end if;
    perform selftest.as_user('boot-siswa@bootstrap.pintar.test');
    if selftest.f18_kode('select public.my_identity_card()') is distinct from 'IDENTITY_NOT_ELIGIBLE'
       or public.my_setup_progress() ->> 'pintar_id' is not null then
      v_probs := selftest.f18_note(v_probs, 'F18-N05', 'a learner was given a card or a PINTAR ID (C17)');
    end if;
    perform selftest.as_owner();

    -- ═══════════════════════════════════════════════ F18-I01 the import's names
    select ra.institution_id into v_inst from public.role_assignments ra join public.accounts a on a.person_id = ra.person_id
      join auth.users u on u.id = a.auth_user_id where u.email = 'alpha-admin@synthetic.pintar.test' and ra.role = 'INSTITUTION_ADMIN' limit 1;
    select a.person_id into v_admin from public.accounts a join auth.users u on u.id = a.auth_user_id where u.email = 'alpha-admin@synthetic.pintar.test';
    insert into public.import_jobs (institution_id, created_by_person_id, state, row_count)
    values (v_inst, v_admin, 'AWAITING_CONFIRMATION', 12) returning import_jobs.id into v_job;
    insert into public.import_rows (job_id, ordinal, payload)
    select v_job, g, jsonb_build_object('display_name', 'Murid Impor ' || g) || case when g % 4 = 0 then jsonb_build_object('person_id', v_psiswa) else '{}'::jsonb end
      from generate_series(1, 12) g;
    perform selftest.as_user('alpha-admin@synthetic.pintar.test');
    select count(*), string_agg(t.nama, '|' order by t.baris) into n, v from public.import_preview_names(v_job) t;
    if n <> 12 or v <> (select string_agg('Murid Impor ' || g, '|' order by g) from generate_series(1, 12) g) then
      v_probs := selftest.f18_note(v_probs, 'F18-I01', format('the school admin does not read every name in order (%s of 12)', n));
    end if;
    if (select count(*) from public.import_preview_names(v_job, 10, 5)) <> 2
       or (select count(*) from public.import_preview_names(v_job) t where not t.baru) <> 3
       or exists (select 1 from public.import_preview_names(v_job) t where t.peran <> 'STUDENT') then
      v_probs := selftest.f18_note(v_probs, 'F18-I01', 'paging, the new-person mark or the role is not as the rows say');
    end if;
    perform selftest.as_user('beta-admin@synthetic.pintar.test');
    if selftest.f18_kode(format('select * from public.import_preview_names(%L)', v_job)) is null then
      v_probs := selftest.f18_note(v_probs, 'F18-I01', 'another school''s admin read the names');
    end if;
    perform selftest.as_owner();

    -- ═══════════════════════════════════════════════ F18-A01 access
    foreach v in array array['anon', 'authenticated'] loop
      if has_function_privilege(v, 'public.activation_code_target(text)', 'execute')
         or has_function_privilege(v, 'public.signin_resolve(text)', 'execute')
         or has_function_privilege(v, 'public.password_write_permit(uuid,text)', 'execute')
         or has_function_privilege(v, 'public.email_send_would_allow(text,text)', 'execute')
         or has_function_privilege(v, 'public.email_resend_seconds()', 'execute')
         or has_function_privilege(v, 'public.identity_attempt(text,text)', 'execute')
         or has_table_privilege(v, 'public.password_write_permits', 'select') then
        v_probs := selftest.f18_note(v_probs, 'F18-A01', v || ' can reach a signed-out lookup, the permit or its table');
      end if;
    end loop;
    if has_function_privilege('anon', 'public.confirm_my_name(text)', 'execute') or has_function_privilege('anon', 'public.correct_person_name(uuid,text,text)', 'execute')
       or has_function_privilege('anon', 'public.my_identity_card()', 'execute') or has_function_privilege('anon', 'public.import_preview_names(uuid,integer,integer)', 'execute') then
      v_probs := selftest.f18_note(v_probs, 'F18-A01', 'anon can reach a signed-in identity function');
    end if;
    if not has_function_privilege('service_role', 'public.signin_resolve(text)', 'execute')
       or not has_function_privilege('service_role', 'public.password_write_permit(uuid,text)', 'execute') then
      v_probs := selftest.f18_note(v_probs, 'F18-A01', 'the routes'' own role cannot reach the lookups or the permit');
    end if;
    if not (select relrowsecurity from pg_class where oid = 'public.password_write_permits'::regclass)
       or exists (select 1 from pg_policy where polrelid = 'public.password_write_permits'::regclass) then
      v_probs := selftest.f18_note(v_probs, 'F18-A01', 'password_write_permits is not RLS-on with no policy');
    end if;

    raise exception 'F18_UNDO';
  exception when others then
    perform selftest.as_owner();
    if sqlerrm <> 'F18_UNDO' then v_fatal := 'the probe itself failed: ' || left(sqlerrm, 240); end if;
  end;

  for id, area in values
    ('F18-N01', 'BOB-26 -- the Ironman test: nobody renames themselves at the table'),
    ('F18-N02', 'BOB-26 -- the name is confirmed once at activation'),
    ('F18-N03', 'BOB-26 -- the platform admin''s correction, audited'),
    ('F18-N04', 'BOB-26 -- a certificate keeps the name it was issued in'),
    ('F18-N05', 'BOB-26 -- the current identity reads the current name'),
    ('F18-P01', 'BOB-26 -- a password is written only through a permit'),
    ('F18-S01', 'BOB-26 -- the wizard''s state and its finish'),
    ('F18-L01', 'BOB-26 -- the signed-out lookups and counters'),
    ('F18-I01', 'BOB-26 -- every name an import will record'),
    ('F18-A01', 'BOB-26 -- access') loop
    if v_fatal <> '' then ok := false; detail := v_fatal;
    elsif v_probs ? id then
      ok := false;
      detail := format('%s problem(s): %s', jsonb_array_length(v_probs -> id),
                       (select string_agg(x, '; ') from jsonb_array_elements_text(v_probs -> id) x));
    else
      ok := true;
      detail := case id
        when 'F18-N01' then 'Bagas Saputra (activated, a Guru), a Murid on a class card and a Guru each ran UPDATE persons SET display_name = '
          || '''Ironman'' on their own row as themselves, and the database refused all three (insufficient privilege); no name reads Ironman'
        when 'F18-N02' then 'registered «Bagas Saputro», shown as it was, corrected once to «Bagas Saputra» (spaces kept as one) and confirmed, '
          || 'audited as from, to and who; a second correction, the step after set-up, an empty name and a control character are refused '
          || 'by their own codes; «Sudah benar» keeps a name as it is; a class card has no name step'
        when 'F18-N03' then 'the platform admin corrected two names with a reason, audited as from, to, reason and who; a school admin, a Guru, '
          || 'the person, a class card and a learner are refused (42501); no reason, no change, no person and no name are refused by their own codes'
        when 'F18-N04' then 'a certificate issued to «Bagas Saputra» before the platform admin''s correction still reads «Bagas Saputra» and '
          || 'its row is byte-identical afterwards; a certificate issued after it reads «Bagas Saputra Wijaya». Every row rolled back'
        when 'F18-N05' then 'the card''s data reads the corrected name, the PINTAR ID and the current role and school; the wizard''s state '
          || 'reads the corrected name; a learner gets neither a card nor a PINTAR ID (C17)'
        when 'F18-P01' then 'Auth''s own role writing a new password hash is refused without a permit; a permit writes once, expires in a '
          || 'minute, is only for a REQUIRED email account (not a completed Guru, not a class card), records the wizard''s step, and '
          || 'is audited without the hash; clearing a hash passes'
        when 'F18-S01' then 'the wizard''s state reports exactly the steps done (password yes; username, PIN and name no; staff with a PINTAR ID); '
          || 'set-up refuses to complete before the name is confirmed and without a password, and completes with all four'
        when 'F18-L01' then 'a code is for a REQUIRED email account only (any case and spacing), never a completed Guru, a class card, a '
          || 'persona or nobody; an email and a username resolve to the account''s address, a class card and an unknown name to nothing; '
          || 'five sign-in attempts are free, a sixth is held and a success clears it; the resend countdown is the limit''s; the read-only '
          || 'limits check refuses a second code within the minute and writes nothing'
        when 'F18-I01' then 'the school admin reads all 12 names of an import in order, paged, with the new-person mark and the role; '
          || 'another school''s admin is refused'
        else 'anon and authenticated reach no signed-out lookup, counter, permit or permit table; anon reaches no signed-in identity '
          || 'function; service_role reaches the lookups and the permit; the permit table has RLS and no policy'
      end;
    end if;
    return next;
  end loop;
  id := 'F18-DONE'; area := 'suite'; ok := true; detail := 'FABLE-18 suite complete';
  return next;
end $$;
revoke all on function selftest.run_fable18() from public;
