-- Ruling 79's audit world (track 3c): the helpers every part of the world uses. Loaded first, after the reset.
--
-- They live in their own schema, `dunia`, which exists only in a local database built by audit/dunia/muat.sh. It is
-- not a migration and nothing in the product reads it. `dunia.fakta` holds the world's facts (ids, synthetic sign-in
-- details) that muat.sh exports to dunia.json for the capture scripts.

do $$ begin perform set_config('app.seed_intent', 'synthetic', true); end $$;

drop schema if exists dunia cascade;
create schema dunia;
create table dunia.fakta (k text primary key, v text not null);

-- The seed's own guards (INV-21, L3-F01): never production, only where local fixtures are permitted, only with
-- declared synthetic intent.
create function dunia.jaga() returns void language plpgsql as $$
declare v_env text;
begin
  select environment into v_env from public.platform_environment;
  if v_env = 'production' then raise exception 'dunia refused: environment is production (INV-21)'; end if;
  if not public.synthetic_fixtures_permitted() then
    raise exception 'dunia refused: synthetic fixtures are local-only (L3-F01)';
  end if;
  if current_setting('app.seed_intent', true) is distinct from 'synthetic' then
    raise exception 'dunia refused: app.seed_intent must be ''synthetic'' (INV-21)';
  end if;
end $$;

create function dunia.simpan(p_k text, p_v text) returns void language sql as $$
  insert into dunia.fakta (k, v) values (p_k, p_v) on conflict (k) do update set v = excluded.v;
$$;
create function dunia.ambil(p_k text) returns text language sql stable as $$
  select v from dunia.fakta where k = p_k;
$$;

-- The card sign-in address and secret, exactly as src/lib/card.ts derives them, with the synthetic pepper and card
-- domain the selftest and CI environments use (CARD_PEPPER, CARD_EMAIL_DOMAIN in ci.yml).
create function dunia.kartu_email(p_kartu text) returns text language sql immutable as $$
  select 'card-' || p_kartu || '@cards.synthetic.pintar.test';
$$;
create function dunia.kartu_rahasia(p_kartu text, p_pin text) returns text language sql immutable as $$
  select encode(extensions.digest('synthetic-card-pepper-fable01-32plus|' || p_kartu || '|' || p_pin, 'sha256'), 'hex');
$$;

-- An Auth user, as Auth itself writes one (the seed's shape). The on_auth_user_created trigger makes the account, and
-- links it to a person: a granted activation's person, or a new one.
create function dunia.auth_user(p_email text, p_password text, p_nama text, p_app jsonb) returns uuid language plpgsql as $$
declare u uuid := gen_random_uuid();
begin
  insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
                          raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
                          confirmation_token, recovery_token, email_change_token_new, email_change)
  values (u, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', p_email,
          extensions.crypt(p_password, extensions.gen_salt('bf')), now(),
          '{"provider":"email","providers":["email"]}'::jsonb || coalesce(p_app, '{}'::jsonb),
          jsonb_build_object('display_name', p_nama), now(), now(), '', '', '', '');
  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), u, u::text, jsonb_build_object('sub', u::text, 'email', p_email, 'email_verified', true),
          'email', null, now(), now());
  return u;
end $$;

create function dunia.auth_kartu(p_kartu text, p_pin text, p_nama text) returns uuid language sql as $$
  select dunia.auth_user(dunia.kartu_email(p_kartu), dunia.kartu_rahasia(p_kartu, p_pin), p_nama,
                         jsonb_build_object('account_kind', 'CLASSROOM_CARD', 'card_number', p_kartu));
$$;

-- A member of staff who already works in PINTAR: an email account with its setup complete, and one role.
-- The role is written as the seed writes its roles (no auth context; permitted under synthetic intent).
create function dunia.staf(p_k text, p_email text, p_password text, p_nama text, p_peran text, p_lingkup uuid)
returns uuid language plpgsql as $$
declare u uuid; p uuid; a uuid;
begin
  u := dunia.auth_user(p_email, p_password, p_nama, null);
  select id, person_id into a, p from public.accounts where auth_user_id = u;
  update public.account_setup set state = 'COMPLETE', completed_at = now(), password_set_at = now(), name_confirmed_at = now()
   where account_id = a;
  if p_peran is not null then
    insert into public.role_assignments (person_id, role, scope_node_id, valid_until)
    values (p, p_peran::public.app_role, p_lingkup, now() + interval '10 years');
  end if;
  perform dunia.simpan(p_k, jsonb_build_object('email', p_email, 'password', p_password, 'nama', p_nama, 'person', p,
                                               'auth', u)::text);
  return p;
end $$;

-- Act as a person of the world, as PostgREST does for their session (the seeds' way of naming the actor of an
-- approval or a grant). Null returns to no actor.
create function dunia.sebagai(p_k text) returns void language plpgsql as $$
declare u text;
begin
  if p_k is null then
    perform set_config('request.jwt.claims', '', true);
    perform set_config('request.jwt.claim.sub', '', true);
    return;
  end if;
  u := (dunia.ambil(p_k))::jsonb ->> 'auth';
  if u is null then raise exception 'dunia.sebagai: no such person %', p_k; end if;
  perform set_config('request.jwt.claims', json_build_object('sub', u, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', u, true);
end $$;
