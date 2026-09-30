-- BOB-26 (Gate 3): THE SYNTHETIC FIXTURE'S EMAIL ACCOUNTS ARE ACTIVATED.
--
-- Under Gate 3 a person with a password is a person who has activated: the
-- wizard is the only way a password is written (the password write permit,
-- migration 20261030100000). The fixture's staff and email learners were given
-- passwords above, directly, as fixtures, so this file gives them what an
-- activation would have given them: a username, a personal PIN, a confirmed
-- name and a COMPLETE set-up. Without it the proxy would hold every one of
-- them at /aktifkan, which is exactly what it must do for a person who has NOT
-- activated.
--
-- Accounts WITHOUT a password stay REQUIRED: they are the fixture's
-- not-yet-activated people (existing staff, C10). The Gate 3 tests make their
-- own REQUIRED people and walk them through the wizard.
--
-- Local and CI only (config.toml's seed list); synthetic addresses only.
do $$
declare r record; v_user text; n int := 0;
begin
  -- the same fail-closed marker every credential seed checks (L3-F01)
  if not public.synthetic_fixtures_permitted() then
    raise exception 'seed refused: synthetic fixtures are local-only (L3-F01); platform_environment.local_fixtures_enabled is false';
  end if;
  for r in
    select a.id as account_id, a.person_id, split_part(lower(u.email), '@', 1) as lokal
      from public.accounts a
      join auth.users u on u.id = a.auth_user_id
      join public.account_setup s on s.account_id = a.id and s.state = 'REQUIRED'
     where a.kind = 'EMAIL' and coalesce(u.encrypted_password, '') <> ''
       and lower(u.email) like '%.pintar.test'
       and not public.adalah_persona(a.person_id)
     order by u.email
  loop
    v_user := left('uji.' || regexp_replace(r.lokal, '[^a-z0-9]+', '.', 'g'), 20);
    v_user := regexp_replace(v_user, '[.]+$', '');
    if public.username_rejection(v_user) is not null
       or exists (select 1 from public.person_usernames x where x.username = v_user) then
      v_user := 'uji.' || substr(md5(r.person_id::text), 1, 10);
    end if;
    insert into public.person_usernames (person_id, username) values (r.person_id, v_user) on conflict do nothing;
    insert into public.person_pins (person_id, pin_hash)
    values (r.person_id, extensions.crypt('2817', extensions.gen_salt('bf', 6))) on conflict do nothing;
    update public.account_setup
       set state = 'COMPLETE', completed_at = now(), password_set_at = now(), name_confirmed_at = now()
     where account_id = r.account_id;
    n := n + 1;
  end loop;
  raise notice 'activated fixture: % email account(s) with a password are COMPLETE', n;
end $$;
