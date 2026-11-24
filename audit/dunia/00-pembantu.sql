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
  -- a real token always carries its Auth session id; each person of the world has one, fixed (one device), as the
  -- selftest's as_user gives its personas (A3). A sitting is bound to the session that started it.
  perform set_config('request.jwt.claims', json_build_object('sub', u, 'role', 'authenticated',
    'session_id', md5('dunia-sesi:' || u)::uuid)::text, true);
  perform set_config('request.jwt.claim.sub', u, true);
end $$;

-- A learner by email, made the product's way: recorded at the school (the person and the school's number for them),
-- enrolled and placed, the activation granted by the school admin, then the Auth account the grant links.
-- `p_aktif`: the learner has already finished first sign-in (setup COMPLETE), as an activated learner has.
create function dunia.murid_email(p_k text, p_email text, p_password text, p_nama text, p_sekolah text, p_ta text,
                                  p_prog text, p_nodes text[], p_admin text, p_aktif boolean)
returns uuid language plpgsql as $$
declare sekolah uuid := dunia.ambil(p_sekolah)::uuid; ta uuid := dunia.ambil(p_ta)::uuid; p uuid; e uuid; u uuid; a uuid; n text;
begin
  insert into public.persons (display_name) values (p_nama) returning id into p;
  perform dunia.sebagai(p_admin);
  perform public.issue_institutional_id(p, sekolah);
  perform dunia.sebagai(null);
  insert into public.enrollments (person_id, institution_id, academic_period_id, programme_id, status)
  values (p, sekolah, ta, dunia.ambil(p_prog)::uuid, 'ACTIVE') returning id into e;
  foreach n in array p_nodes loop
    insert into public.memberships (enrollment_id, node_id, academic_period_id) values (e, dunia.ambil(n)::uuid, ta);
  end loop;
  perform dunia.sebagai(p_admin);
  perform public.authorize_account_activation(p, 'EMAIL', p_email, null);
  perform dunia.sebagai(null);
  u := dunia.auth_user(p_email, p_password, p_nama, null);
  select id into a from public.accounts where auth_user_id = u and person_id = p;
  if a is null then raise exception 'dunia.murid_email: % was not linked to the recorded learner', p_email; end if;
  if p_aktif then
    update public.account_setup set state = 'COMPLETE', completed_at = now(), password_set_at = now(), name_confirmed_at = now()
     where account_id = a;
  end if;
  perform dunia.simpan(p_k, jsonb_build_object('email', p_email, 'password', p_password, 'nama', p_nama, 'person', p,
                                               'auth', u, 'pintar_id', (select pintar_id from public.persons where id = p))::text);
  return p;
end $$;

-- A learner sits an assessment through the product's own functions, as themself (start_learning_session,
-- record_answer for each delivered question, finish_my_session), answering each question right unless its stem is
-- in p_salah. A multi-answer question answered right chooses every correct option; answered wrong, the wrong ones.
-- The display order is the product's own (option_display_order), read as the database owner, as the selftest's
-- answer_paper reads it. Returns the session.
-- p_berhenti: answer only the first N questions and leave the sitting open (W9: a learner mid-sitting).
create function dunia.duduk(p_murid text, p_aa uuid, p_salah text[] default '{}', p_berhenti int default null)
returns uuid language plpgsql as $$
declare s uuid; r record; v_pos int; v_positions int[]; v_benar boolean; n int := 0;
begin
  perform dunia.sebagai(p_murid);
  s := public.start_learning_session(p_aa);
  for r in select p.id as pid, p.item_id, i.item_type, i.stem
             from public.presented_items p join public.items i on i.id = p.item_id
            where p.session_id = s order by p.position loop
    v_benar := not (r.stem = any (p_salah));
    if r.item_type = 'MCQ_MULTI' then
      select array_agg(d.display_position order by d.display_position) into v_positions
        from public.option_display_order(s, r.item_id) d
        join public.item_options o on o.item_id = r.item_id and o.label = d.label
       where o.is_correct = v_benar;
      perform public.record_answer(r.pid, 1, jsonb_build_object('posisi', to_jsonb(v_positions)));
    else
      select d.display_position into v_pos
        from public.option_display_order(s, r.item_id) d
        join public.item_options o on o.item_id = r.item_id and o.label = d.label
       where o.is_correct = v_benar order by d.display_position limit 1;
      perform public.record_answer(r.pid, 1, jsonb_build_object('posisi', v_pos));
    end if;
    n := n + 1;
    exit when p_berhenti is not null and n >= p_berhenti;
  end loop;
  if n = 0 then raise exception 'dunia.duduk: the paper delivered no question'; end if;
  if p_berhenti is not null then perform dunia.sebagai(null); return s; end if;
  perform public.finish_my_session(s);
  perform dunia.sebagai(null);
  return s;
end $$;

-- THE CLOCK (Bob, 24 Nov): every date in the world is relative to the moment it is loaded, so windows, deadlines and
-- expiries hold whenever it runs. The school year is the one that contains today: it starts on the second Monday of
-- July (Indonesia's school year) on or before today, and ends about 50 weeks later. The server's clock is the
-- machine's; the product has no clock override, and none is added.
create function dunia.ta_mulai() returns date language sql stable as $$
  select d + ((8 - extract(isodow from d)::int) % 7) + 7
    from (select make_date(case when extract(month from current_date) >= 7 then extract(year from current_date)::int
                                else extract(year from current_date)::int - 1 end, 7, 1) as d) x
$$;
create function dunia.ta_selesai() returns date language sql stable as $$ select dunia.ta_mulai() + 349 $$;
create function dunia.ta_nama() returns text language sql stable as $$
  select 'TA ' || extract(year from dunia.ta_mulai())::int || '/' || (extract(year from dunia.ta_mulai())::int + 1)
$$;
