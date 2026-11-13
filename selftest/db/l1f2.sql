-- L1-F2 · A suspension covers the accounts made after it, and L1-R2 · no password-write permit survives a lock
-- (docs/completion-4.1/SUSPENSION-COVERS-NEW-ACCOUNTS.md §2a and §2b; migration
-- 20270117160000_a_suspension_covers_the_accounts_made_after_it.sql). One transaction per case, each undone. The races,
-- on two real connections, are selftest/l1f2-balapan.test.ts.
--
--   L1F2-S01  a suspended person given an account: it is created locked (banned_until = akun_terkunci_sampai())
--   L1F2-S02  the lock survives later updates: an update clearing banned_until, an update of another column, and
--             one setting a nearer date each leave it at akun_terkunci_sampai() (Sharon §2a test 4)
--   L1F2-S03  successive suspensions: suspend, create, reinstate, suspend again: locked, released, locked (test 5);
--             reinstatement ends the suspension row first, and only then unlocks
--   L1F2-S04  atomicity: a lock step forced to fail leaves no Auth user and no account (test 1); an Auth insert with
--             no grant is refused PR010 (test 2)
--   L1F2-S05  a closed person (CLOSED_AT_REQUEST) given an account: it ends locked; buka_kembali_akun releases it (test 6)
--   L1R2-S01  a lock leaves no RECOVERY or ACTIVATION permit of the person; a CARD_REISSUE permit stays; an unlock
--             deletes nothing; another person's permits are untouched (Sharon §2b point 1)
--   L1R2-S02  the lock order, structurally (Sharon's result review of e27f4a77): every act that takes an account row and
--             then reaches the person takes the person row first; akun_kunci takes auth.users before accounts

create schema if not exists selftest;

-- a person with no account yet, as an institution's intake makes one
create or replace function selftest.l1f2_orang(p_nama text)
returns uuid language plpgsql set search_path = public, pg_temp as $$
declare v uuid;
begin
  perform selftest.as_owner();
  perform set_config('app.seed_intent', 'synthetic', true);
  insert into public.persons (display_name) values (p_nama) returning id into v;
  perform set_config('app.seed_intent', '', true);
  return v;
end $$;
revoke all on function selftest.l1f2_orang(text) from public;

-- the person's account, the product's way: a live activation grant, then Auth's own insert of the user
create or replace function selftest.l1f2_akun(p_person uuid, p_email text)
returns uuid language plpgsql set search_path = public, pg_temp as $$
declare v_u uuid := gen_random_uuid(); v_admin uuid; v_inst uuid;
begin
  perform selftest.as_owner();
  select a.person_id into v_admin from public.accounts a join auth.users u on u.id = a.auth_user_id where u.email = 'alpha-admin@synthetic.pintar.test';
  v_inst := (select i.id from public.institutions i where i.is_synthetic and i.slug like 'synth-alpha-%' order by i.created_at desc limit 1);
  insert into public.account_activation_grants (email, person_id, kind, institution_id, authorized_by)
  values (lower(p_email), p_person, 'EMAIL', v_inst, v_admin);
  insert into auth.users (id, email) values (v_u, lower(p_email));
  return v_u;
end $$;
revoke all on function selftest.l1f2_akun(uuid, text) from public;

create or replace function selftest.l1f2_kunci(p_uid uuid)
returns text language sql stable set search_path = public, pg_temp as $$
  select case when u.banned_until = public.akun_terkunci_sampai() then 'locked' when u.banned_until is null then 'open'
              else 'other:' || u.banned_until::text end from auth.users u where u.id = p_uid
$$;
revoke all on function selftest.l1f2_kunci(uuid) from public;

create or replace function selftest.run_l1f2()
returns table (id text, area text, ok boolean, detail text)
language plpgsql set search_path = public, pg_temp as $$
#variable_conflict use_column
declare v_tag text := substr(md5(random()::text), 1, 8); v_sys text; v_p uuid; v_u uuid; v_q uuid; v_uq uuid; v_t text;
        v_req uuid; n int; v_fatal text := ''; v_state text;
begin
  perform selftest.as_owner();
  -- the seeded platform admin: a platform admin made here would outlive the suite (B0 requires exactly one)
  v_sys := 'sysadmin@synthetic.pintar.test';
  area := 'L1-F2 -- a suspension covers the accounts made after it; L1-R2 -- no password-write permit survives a lock';

  -- ═══ L1F2-S01, S02: a suspended person given an account
  begin
    v_p := selftest.l1f2_orang('L1F2 Satu ' || v_tag);
    perform selftest.as_user(v_sys);
    perform public.tangguhkan_akun(v_p, 'ADMINISTRATIVE', 'uji L1-F2: ditangguhkan sebelum punya akun');
    perform selftest.as_owner();
    v_u := selftest.l1f2_akun(v_p, 'l1f2-satu-' || v_tag || '@local.invalid');
    v_t := selftest.l1f2_kunci(v_u);
    id := 'L1F2-S01'; ok := v_t = 'locked';
    detail := case when ok then 'a person suspended before having an account is given one: it is created locked, until akun_terkunci_sampai()'
                   else 'a suspended person''s new account reads ' || coalesce(v_t, 'no user') end;
    return next;
    -- S02: later updates
    update auth.users set banned_until = null where id = v_u;
    v_t := selftest.l1f2_kunci(v_u);
    update auth.users set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || '{"x": 1}' where id = v_u;
    v_t := v_t || '|' || selftest.l1f2_kunci(v_u);
    update auth.users set banned_until = now() + interval '1 hour' where id = v_u;
    v_t := v_t || '|' || selftest.l1f2_kunci(v_u);
    id := 'L1F2-S02'; ok := v_t = 'locked|locked|locked';
    detail := case when ok then 'while the person is suspended, an update clearing banned_until, one of another column and one setting a nearer date each leave the lock as it was'
                   else 'after later updates the account read ' || v_t || ' (expected locked|locked|locked)' end;
    return next;
    raise exception 'L1F2_UNDO';
  exception when others then
    perform selftest.as_owner();
    if sqlerrm <> 'L1F2_UNDO' then v_fatal := v_fatal || ' S01: ' || sqlerrm; end if;
  end;

  -- ═══ L1F2-S03: successive suspensions
  begin
    v_p := selftest.l1f2_orang('L1F2 Dua ' || v_tag);
    perform selftest.as_user(v_sys);
    perform public.tangguhkan_akun(v_p, 'SECURITY', 'uji L1-F2: penangguhan pertama');
    perform selftest.as_owner();
    v_u := selftest.l1f2_akun(v_p, 'l1f2-dua-' || v_tag || '@local.invalid');
    v_t := selftest.l1f2_kunci(v_u);
    perform selftest.as_user(v_sys);
    perform public.aktifkan_kembali_akun(v_p, 'uji L1-F2: dipulihkan');
    perform selftest.as_owner();
    v_t := v_t || '|' || selftest.l1f2_kunci(v_u);
    perform selftest.as_user(v_sys);
    perform public.tangguhkan_akun(v_p, 'ADMINISTRATIVE', 'uji L1-F2: penangguhan kedua');
    perform selftest.as_owner();
    v_t := v_t || '|' || selftest.l1f2_kunci(v_u);
    id := 'L1F2-S03'; ok := v_t = 'locked|open|locked';
    detail := case when ok then 'suspended, then given an account: locked; reinstated (the suspension ended first, then the unlock): released; suspended again: locked'
                   else 'suspend, create, reinstate, suspend read ' || v_t || ' (expected locked|open|locked)' end;
    return next;
    raise exception 'L1F2_UNDO';
  exception when others then
    perform selftest.as_owner();
    if sqlerrm <> 'L1F2_UNDO' then v_fatal := v_fatal || ' S03: ' || sqlerrm; end if;
  end;

  -- ═══ L1F2-S04: atomicity, and no unlinked user
  begin
    v_p := selftest.l1f2_orang('L1F2 Tiga ' || v_tag);
    perform selftest.as_user(v_sys);
    perform public.tangguhkan_akun(v_p, 'ADMINISTRATIVE', 'uji L1-F2: langkah kunci dipaksa gagal');
    perform selftest.as_owner();
    -- the lock step made to fail, for this transaction only
    execute $f$create or replace function public.akun_baru_terkunci() returns trigger language plpgsql as $g$
      begin raise exception 'L1F2 planted lock-step failure'; end $g$ $f$;
    v_t := 'went through';
    begin
      perform selftest.l1f2_akun(v_p, 'l1f2-tiga-' || v_tag || '@local.invalid');
    exception when others then v_t := sqlerrm; end;
    select count(*) into n from auth.users u where u.email = 'l1f2-tiga-' || v_tag || '@local.invalid';
    v_t := v_t || '|users ' || n || '|accounts ' || (select count(*) from public.accounts a where a.person_id = v_p);
    -- no grant: an Auth user nobody provisioned, under production's rule (this transaction only: no local fixtures)
    update public.platform_environment set environment = 'production';
    begin
      insert into auth.users (id, email) values (gen_random_uuid(), 'l1f2-tanpa-' || v_tag || '@local.invalid');
      v_t := v_t || '|no grant: went through';
    exception when others then
      get stacked diagnostics v_state = returned_sqlstate;
      v_t := v_t || '|no grant: ' || v_state;
    end;
    id := 'L1F2-S04'; ok := v_t like 'L1F2 planted lock-step failure|users 0|accounts 0|no grant: PR010';
    detail := case when ok then 'a lock step forced to fail takes Auth''s insert with it: no Auth user, no account; an Auth insert with no grant is refused PR010'
                   else 'atomicity and the unlinked user read ' || v_t end;
    return next;
    raise exception 'L1F2_UNDO';
  exception when others then
    perform selftest.as_owner();
    if sqlerrm <> 'L1F2_UNDO' then v_fatal := v_fatal || ' S04: ' || sqlerrm; end if;
  end;

  -- ═══ L1F2-S05: a closed person given an account
  begin
    v_p := selftest.l1f2_orang('L1F2 Empat ' || v_tag);
    -- the closure, recorded at the person's request while they had no account (the case §5a settles)
    insert into public.person_suspensions (person_id, category, started_by) values (v_p, 'CLOSED_AT_REQUEST', v_p);
    v_u := selftest.l1f2_akun(v_p, 'l1f2-empat-' || v_tag || '@local.invalid');
    v_t := selftest.l1f2_kunci(v_u);
    perform public.minta_buka_kembali((select pintar_id from public.persons where id = v_p), 'uji L1-F2: saya ingin membuka akun saya kembali');
    select q.id into v_req from public.account_requests q where q.person_id = v_p and q.kind = 'REOPEN';
    perform selftest.as_user(v_sys);
    perform public.buka_kembali_akun(v_req, 'uji L1-F2: identitas diperiksa lewat telepon sekolah');
    perform selftest.as_owner();
    v_t := v_t || '|' || selftest.l1f2_kunci(v_u);
    id := 'L1F2-S05'; ok := v_t = 'locked|open';
    detail := case when ok then 'a closed person given an account: it is created locked, and buka_kembali_akun releases it'
                   else 'a closed person''s new account, then reopened, read ' || v_t || ' (expected locked|open)' end;
    return next;
    raise exception 'L1F2_UNDO';
  exception when others then
    perform selftest.as_owner();
    if sqlerrm <> 'L1F2_UNDO' then v_fatal := v_fatal || ' S05: ' || sqlerrm; end if;
  end;

  -- ═══ L1R2-S01: a lock leaves no RECOVERY or ACTIVATION permit
  begin
    v_p := selftest.l1f2_orang('L1R2 Satu ' || v_tag);
    v_u := selftest.l1f2_akun(v_p, 'l1r2-satu-' || v_tag || '@local.invalid');
    v_q := selftest.l1f2_orang('L1R2 Lain ' || v_tag);
    v_uq := selftest.l1f2_akun(v_q, 'l1r2-lain-' || v_tag || '@local.invalid');
    insert into public.password_write_permits (auth_user_id, purpose, expires_at) values (v_u, 'ACTIVATION', clock_timestamp() + interval '1 minute');
    insert into public.password_write_permits (auth_user_id, purpose, expires_at) values (v_uq, 'RECOVERY', clock_timestamp() + interval '1 minute');
    perform selftest.as_user(v_sys);
    perform public.tangguhkan_akun(v_p, 'SECURITY', 'uji L1-R2: izin tulis sandi dicabut saat dikunci');
    perform selftest.as_owner();
    v_t := 'mine ' || (select count(*) from public.password_write_permits where auth_user_id = v_u)
        || '|other ' || (select count(*) from public.password_write_permits where auth_user_id = v_uq);
    -- a card reissue's permit is not this lock's to take
    perform selftest.as_user(v_sys);
    perform public.aktifkan_kembali_akun(v_p, 'uji L1-R2: dipulihkan');
    perform selftest.as_owner();
    insert into public.password_write_permits (auth_user_id, purpose, expires_at) values (v_u, 'CARD_REISSUE', clock_timestamp() + interval '1 minute')
    on conflict (auth_user_id) do update set purpose = excluded.purpose, expires_at = excluded.expires_at;
    perform selftest.as_user(v_sys);
    perform public.tangguhkan_akun(v_p, 'ADMINISTRATIVE', 'uji L1-R2: kartu diterbitkan ulang tetap boleh');
    perform selftest.as_owner();
    v_t := v_t || '|card ' || (select count(*) from public.password_write_permits where auth_user_id = v_u and purpose = 'CARD_REISSUE');
    -- an unlock deletes nothing
    perform selftest.as_user(v_sys);
    perform public.aktifkan_kembali_akun(v_p, 'uji L1-R2: dipulihkan lagi');
    perform selftest.as_owner();
    v_t := v_t || '|after unlock ' || (select count(*) from public.password_write_permits where auth_user_id = v_u);
    id := 'L1R2-S01'; ok := v_t = 'mine 0|other 1|card 1|after unlock 1';
    detail := case when ok then 'a lock deleted the person''s ACTIVATION permit and left another person''s RECOVERY permit; a CARD_REISSUE permit outstanding at a lock stays; an unlock deletes nothing'
                   else 'permits around a lock read ' || v_t || ' (expected mine 0|other 1|card 1|after unlock 1)' end;
    return next;
    raise exception 'L1F2_UNDO';
  exception when others then
    perform selftest.as_owner();
    if sqlerrm <> 'L1F2_UNDO' then v_fatal := v_fatal || ' R2: ' || sqlerrm; end if;
  end;

  -- ═══ L1R2-S02 (Sharon's result review of e27f4a77; the engineer's search): the lock order is persons → auth.users →
  -- accounts → permits. Each act that takes an account row and then reaches the person (directly, or through an L1-F4
  -- guard on its insert) takes the person row FIRST; akun_kunci takes auth.users before accounts
  v_t := '';
  declare f text; v text; a int; b int;
  begin
    foreach f in array array['public.recovery_grant_permit(text)', 'public.password_write_permit(uuid,text)',
                             'public.authorize_card_reissue(uuid,text,text)', 'public.authorize_card_conversion(uuid,text,text)',
                             'public.authorize_email_correction(uuid,text,text)'] loop
      v := pg_get_functiondef(f::regprocedure);
      a := position('from public.persons' in v);
      b := least(nullif(position('for share' in v), 0), nullif(position('for update' in v), 0));
      if a = 0 or b is null or a > b then v_t := v_t || f || ' locks something before persons; '; end if;
    end loop;
    v := pg_get_functiondef('public.akun_kunci(uuid,boolean)'::regprocedure);
    if position('from auth.users u' in v) = 0 or position('from auth.users u' in v) > position('for update of ac' in v) then
      v_t := v_t || 'akun_kunci locks accounts before auth.users; ';
    end if;
  end;
  id := 'L1R2-S02'; ok := v_t = '';
  detail := case when ok then 'the lock order: the two permit issuers and the three card and email acts take the person row first; akun_kunci takes auth.users before accounts (persons → auth.users → accounts → permits)'
                 else v_t end;
  return next;

  id := 'L1F2-DONE'; area := 'suite'; ok := v_fatal = '';
  detail := case when v_fatal = '' then 'L1-F2 suite complete; every row rolled back' else 'the suite did not complete:' || left(v_fatal, 400) end;
  return next;
end $$;
revoke all on function selftest.run_l1f2() from public;
