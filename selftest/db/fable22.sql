-- FABLE-22 database suite: the closure's landing L3, the Working Context (D-127 §1, Q1, Q2, Q11; D-132).
--
-- Ordering: depends on fable01.sql (the role switches). Never applied as a migration; never present in production.
--
--   F22-K01  WHAT A PERSON HOLDS (C1, C2, C6, C7): the purpose · place pairs konteks_tempat_saya derives from the
--            grants. A learner holds Belajar; a Guru, Mengajar in their school only; a Guru who is enrolled, both; a
--            Kepala departemen, Mengajar and Mengelola there; a Dekan and an Admin sekolah, Mengelola only, never
--            Mengajar (C2); a class card, Belajar only (C6); Admin platform, Mengelola in every active school, the
--            library and «Seluruh platform», and no Mengajar of its own; Admin platform who is also a Guru in two
--            schools, Mengajar in exactly those two besides
--   F22-K02  THE ONE WRITER: the caller's own current session, a pair they hold. A pair not held is refused by name
--            (an Admin sekolah's Mengajar, a Guru's Mengelola or another school, a card's Mengajar); a door or a
--            requested page only where none is set (C4), a choice at any time; no session, or an ended one, is refused
--   F22-K03  TWO SESSIONS, TWO CONTEXTS (§2.10, the Dr Gladys scenario): one person, the laptop Mengajar · SD B and
--            the phone Mengelola · SD A; each reads its own; changing the phone leaves the laptop; neither changes a
--            grant (the person's role_assignments are the same before and after)
--   F22-K04  INVALIDATION (§2.7): a context whose grant is revoked, or rests on a grant that has expired, is cleared
--            on the next read (TIDAK_BERLAKU), never moved to another purpose or place, and cannot be set again
--   F22-K05  THE END CLEARS IT (§2.8): «Keluar» ends the row and leaves no context on it; «Keluar dari semua
--            perangkat» clears every session's; an ended session reads BERAKHIR and cannot be given a context
--   F22-K06  NEVER AUTHORITY (§2.11, CR-83(4)): in each context, an act the entitlement lacks is still refused by the
--            database; a context forged straight onto the row (bypassing the writer) widens nothing and is cleared
--            on the next read; the authorization primitives answer the same in every context; and no RLS policy and
--            no function but the context's own reads the context
--
-- EVERY ROW IS ROLLED BACK: one subtransaction, verdicts collected in a jsonb of problems, a sentinel to undo the
-- lot, and the findings emitted afterwards.

create schema if not exists selftest;
grant usage on schema selftest to authenticated, anon;

do $$
begin
  if to_regprocedure('selftest.as_user(text)') is null or to_regprocedure('selftest.as_owner()') is null then
    raise exception 'apply fable01.sql before fable22.sql: the role switches are missing';
  end if;
end $$;

create or replace function selftest.f22_note(p jsonb, p_id text, p_problem text)
returns jsonb language sql immutable as $$
  select jsonb_set(coalesce(p, '{}'::jsonb), array[p_id], coalesce(p -> p_id, '[]'::jsonb) || to_jsonb(p_problem))
$$;
grant execute on function selftest.f22_note(jsonb, text, text) to authenticated, anon;

-- A person, signed in on one browser: the claims PostgREST would verify, with this session's id (sesi_saya).
create or replace function selftest.f22_sebagai(p_email text, p_sesi uuid)
returns void language plpgsql set search_path = public, pg_temp as $$
declare v_uid uuid;
begin
  reset role;
  select id into v_uid from auth.users where email = p_email;
  if v_uid is null then raise exception 'persona % not found', p_email; end if;
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_uid, 'role', 'authenticated', 'email', p_email, 'session_id', p_sesi)::text, true);
  perform set_config('request.jwt.claim.sub', v_uid::text, true);
  set local role authenticated;
end $$;
revoke all on function selftest.f22_sebagai(text, uuid) from public;
grant execute on function selftest.f22_sebagai(text, uuid) to authenticated;

-- A session row for that browser, as sesi_periksa makes it (the owner's; the table is closed to every client role).
create or replace function selftest.f22_sesi(p_email text, p_mode text default 'SHARED')
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare v_uid uuid; v_sesi uuid := gen_random_uuid();
begin
  select id into v_uid from auth.users where email = p_email;
  if v_uid is null then raise exception 'persona % not found', p_email; end if;
  insert into public.device_sessions (session_id, auth_user_id, mode) values (v_sesi, v_uid, p_mode);
  return v_sesi;
end $$;
revoke all on function selftest.f22_sesi(text, text) from public;
grant execute on function selftest.f22_sesi(text, text) to authenticated;

-- The pairs a person holds, as one sorted line: «BELAJAR», «MENGAJAR:<slug>», «MENGELOLA:<slug>», «MENGELOLA:PLATFORM».
create or replace function selftest.f22_pasangan()
returns text language sql stable set search_path = public, pg_temp as $$
  select coalesce(string_agg(x, ' ' order by x), '')
    from (select case when k.platform then k.tujuan || ':PLATFORM'
                      when k.tempat is null then k.tujuan
                      else k.tujuan || ':' || coalesce((select i.slug from public.institutions i where i.id = k.tempat), '?') end as x
            from public.konteks_tempat_saya() k) s
$$;
grant execute on function selftest.f22_pasangan() to authenticated;

-- What the caller's own call raised: '' when it did not.
create or replace function selftest.f22_tetapkan(p_tujuan text, p_tempat uuid, p_platform boolean, p_sebab text)
returns text language plpgsql set search_path = public, pg_temp as $$
declare v_detail text;
begin
  perform public.konteks_tetapkan(p_tujuan, p_tempat, p_platform, p_sebab);
  return '';
exception when others then
  get stacked diagnostics v_detail = pg_exception_detail;
  return coalesce(nullif(v_detail, ''), sqlerrm);
end $$;
grant execute on function selftest.f22_tetapkan(text, uuid, boolean, text) to authenticated;

-- ═══════════════════════════════════════════════════════════════ the suite
create or replace function selftest.run_fable22()
returns table (id text, area text, ok boolean, detail text)
language plpgsql set search_path = public, pg_temp as $$
declare
  r record; v_a uuid; v_b uuid; v_kk uuid; v_sa text; v_sb text; v_sk text; v_n int; v_got text; v_want text;
  v_s uuid; v_s2 uuid; v_l uuid; v_p uuid; v_j jsonb; v_gladys uuid; v_sebelum text; v_sesudah text;
  v_guru uuid; v_grant uuid; v_node uuid; v_err text;
  v_probs jsonb := '{}'::jsonb; v_fatal text := '';
begin
  perform selftest.as_owner();
  begin
    select i.id, i.slug into v_a, v_sa from public.institutions i where i.slug like 'synth-alpha-%' limit 1;
    select i.id, i.slug into v_b, v_sb from public.institutions i where i.slug like 'synth-beta-%' limit 1;
    select i.id, i.slug into v_kk, v_sk from public.institutions i where i.tenant_kind = 'PLATFORM_CANONICAL' and i.is_active limit 1;
    if v_a is null or v_b is null or v_kk is null then
      raise exception 'the fixture lacks the alpha school, the beta school or the library';
    end if;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F22-K01  WHAT A PERSON HOLDS
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      for r in select * from (values
          ('alpha-siswa-1@synthetic.pintar.test', 'BELAJAR'),
          ('alpha-guru@synthetic.pintar.test', 'MENGAJAR:' || v_sa),
          ('siklus-guru@synthetic.pintar.test', 'BELAJAR MENGAJAR:' ||
             (select slug from public.institutions where slug like 'synth-siklus-%' limit 1)),
          ('alpha-hod@synthetic.pintar.test', 'MENGAJAR:' || v_sa || ' MENGELOLA:' || v_sa),
          ('alpha-dean@synthetic.pintar.test', 'MENGELOLA:' || v_sa),
          ('alpha-admin@synthetic.pintar.test', 'MENGELOLA:' || v_sa),
          ('kanonik-penyusun@pintar.test', 'MENGAJAR:' || v_sk),
          ('card-7001@cards.synthetic.pintar.test', 'BELAJAR')
        ) as t(email, want) loop
        perform selftest.as_user(r.email);
        v_got := selftest.f22_pasangan();
        perform selftest.as_owner();
        if v_got is distinct from r.want then
          v_probs := selftest.f22_note(v_probs, 'F22-K01', format('%s holds «%s», not «%s»', r.email, v_got, r.want));
        end if;
      end loop;

      -- Admin platform: Mengelola in every active school, the library and «Seluruh platform»; no Mengajar of its own
      perform selftest.as_user('sysadmin@synthetic.pintar.test');
      v_got := selftest.f22_pasangan();
      perform selftest.as_owner();
      select string_agg('MENGELOLA:' || i.slug, ' ' order by 'MENGELOLA:' || i.slug) || ' MENGELOLA:PLATFORM' into v_want
        from public.institutions i where i.is_active and i.tenant_kind in ('INSTITUTION', 'PLATFORM_CANONICAL');
      select string_agg(x, ' ' order by x) into v_want from unnest(string_to_array(v_want, ' ')) x;
      if v_got is distinct from v_want then
        v_probs := selftest.f22_note(v_probs, 'F22-K01', format('Admin platform holds «%s», not «%s»', v_got, v_want));
      end if;

      -- ... who is also a Guru in two schools (Dr Gladys's case): Mengajar in exactly those two besides
      select a.person_id into v_gladys from public.accounts a join auth.users u on u.id = a.auth_user_id
       where u.email = 'sysadmin@synthetic.pintar.test';
      perform set_config('app.seed_intent', 'synthetic', true);
      insert into public.role_assignments (person_id, role, scope_node_id, institution_id, valid_from, valid_until)
      select v_gladys, 'EDUCATOR', i.id, i.id, now() - interval '1 day', now() + interval '1 day'
        from public.institutions i where i.id in (v_a, v_b);
      perform set_config('app.seed_intent', '', true);
      perform selftest.as_user('sysadmin@synthetic.pintar.test');
      v_got := selftest.f22_pasangan();
      perform selftest.as_owner();
      if v_got !~ ('MENGAJAR:' || v_sa) or v_got !~ ('MENGAJAR:' || v_sb)
         or (select count(*) from regexp_matches(v_got, 'MENGAJAR:', 'g')) <> 2 then
        v_probs := selftest.f22_note(v_probs, 'F22-K01', format('Admin platform and Guru in alpha and beta holds «%s»', v_got));
      end if;
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f22_note(v_probs, 'F22-K01', 'the test could not run: ' || left(sqlerrm, 200));
    end;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F22-K02  THE ONE WRITER
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      -- an Admin sekolah's Mengajar (C2), a Guru's Mengelola, a Guru in another school, a card's Mengajar: refused
      for r in select * from (values
          ('alpha-admin@synthetic.pintar.test', 'MENGAJAR', v_a, false),
          ('alpha-guru@synthetic.pintar.test', 'MENGELOLA', v_a, false),
          ('alpha-guru@synthetic.pintar.test', 'MENGAJAR', v_b, false),
          ('alpha-guru@synthetic.pintar.test', 'MENGELOLA', null::uuid, true),
          ('card-7001@cards.synthetic.pintar.test', 'MENGAJAR', v_a, false)
        ) as t(email, tujuan, tempat, platform) loop
        v_s := selftest.f22_sesi(r.email, case when r.email like 'card-%' then 'CARD' else 'SHARED' end);
        perform selftest.f22_sebagai(r.email, v_s);
        v_err := selftest.f22_tetapkan(r.tujuan, r.tempat, r.platform, 'PILIHAN');
        perform selftest.as_owner();
        if v_err <> 'KONTEKS_TIDAK_DIPEGANG' then
          v_probs := selftest.f22_note(v_probs, 'F22-K02', format('%s setting %s%s was answered «%s», not KONTEKS_TIDAK_DIPEGANG',
            r.email, r.tujuan, case when r.platform then ' · platform' else '' end, coalesce(nullif(v_err, ''), 'accepted')));
        end if;
        if (select konteks_tujuan from public.device_sessions where session_id = v_s) is not null then
          v_probs := selftest.f22_note(v_probs, 'F22-K02', format('a refused pair was written for %s', r.email));
        end if;
      end loop;

      -- the door sets it where none is; a second door or a requested page is refused; a choice changes it
      v_s := selftest.f22_sesi('alpha-hod@synthetic.pintar.test');
      perform selftest.f22_sebagai('alpha-hod@synthetic.pintar.test', v_s);
      v_err := selftest.f22_tetapkan('MENGAJAR', v_a, false, 'PINTU');
      if v_err <> '' then
        v_probs := selftest.f22_note(v_probs, 'F22-K02', 'a Kepala departemen''s door to Mengajar was refused: ' || v_err);
      end if;
      foreach v_got in array array['PINTU', 'HALAMAN'] loop
        v_err := selftest.f22_tetapkan('MENGELOLA', v_a, false, v_got);
        if v_err <> 'KONTEKS_SUDAH_ADA' then
          v_probs := selftest.f22_note(v_probs, 'F22-K02', format('a %s over an existing context was answered «%s», not KONTEKS_SUDAH_ADA',
            v_got, coalesce(nullif(v_err, ''), 'accepted')));
        end if;
      end loop;
      v_err := selftest.f22_tetapkan('MENGELOLA', v_a, false, 'PILIHAN');
      v_j := public.konteks_saya();
      perform selftest.as_owner();
      if v_err <> '' or v_j ->> 'keadaan' <> 'ADA' or v_j ->> 'tujuan' <> 'MENGELOLA' or (v_j ->> 'tempat')::uuid <> v_a
         or v_j ->> 'sebab' <> 'PILIHAN' or v_j ->> 'nama' is null then
        v_probs := selftest.f22_note(v_probs, 'F22-K02', format('the person''s own choice did not set Mengelola · alpha: «%s» %s', v_err, v_j));
      end if;

      -- no session in the token, or an ended one: refused
      perform selftest.as_user('alpha-guru@synthetic.pintar.test');
      v_err := selftest.f22_tetapkan('MENGAJAR', v_a, false, 'PILIHAN');
      perform selftest.as_owner();
      if v_err <> 'KONTEKS_TANPA_SESI' then
        v_probs := selftest.f22_note(v_probs, 'F22-K02', 'a token without a session was answered «' || coalesce(nullif(v_err, ''), 'accepted') || '»');
      end if;
      v_s := selftest.f22_sesi('alpha-guru@synthetic.pintar.test');
      update public.device_sessions set ended_at = now(), ended_reason = 'KELUAR' where session_id = v_s;
      perform selftest.f22_sebagai('alpha-guru@synthetic.pintar.test', v_s);
      v_err := selftest.f22_tetapkan('MENGAJAR', v_a, false, 'PILIHAN');
      perform selftest.as_owner();
      if v_err <> 'KONTEKS_TANPA_SESI' then
        v_probs := selftest.f22_note(v_probs, 'F22-K02', 'an ended session was answered «' || coalesce(nullif(v_err, ''), 'accepted') || '»');
      end if;

      -- a session row of somebody else is never written (the writer keys on the token's own session and user)
      v_s := selftest.f22_sesi('alpha-hod@synthetic.pintar.test');
      perform selftest.f22_sebagai('alpha-guru@synthetic.pintar.test', v_s);
      v_err := selftest.f22_tetapkan('MENGAJAR', v_a, false, 'PILIHAN');
      perform selftest.as_owner();
      if v_err <> 'KONTEKS_TANPA_SESI' or (select konteks_tujuan from public.device_sessions where session_id = v_s) is not null then
        v_probs := selftest.f22_note(v_probs, 'F22-K02', 'a token naming another person''s session wrote to it: «' || v_err || '»');
      end if;
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f22_note(v_probs, 'F22-K02', 'the test could not run: ' || left(sqlerrm, 200));
    end;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F22-K03  TWO SESSIONS, TWO CONTEXTS: Dr Gladys's laptop and phone
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      select string_agg(ra.id::text || ra.role || coalesce(ra.institution_id::text, '') || coalesce(ra.revoked_at::text, ''), ',' order by ra.id)
        into v_sebelum from public.role_assignments ra where ra.person_id = v_gladys;
      v_l := selftest.f22_sesi('sysadmin@synthetic.pintar.test', 'PERSONAL');
      v_p := selftest.f22_sesi('sysadmin@synthetic.pintar.test', 'PERSONAL');
      -- the laptop: «Saya mengajar» → SD B (beta); the phone: «Saya mengelola sekolah» → SD A (alpha)
      perform selftest.f22_sebagai('sysadmin@synthetic.pintar.test', v_l);
      v_err := selftest.f22_tetapkan('MENGAJAR', v_b, false, 'PINTU');
      perform selftest.f22_sebagai('sysadmin@synthetic.pintar.test', v_p);
      v_err := v_err || selftest.f22_tetapkan('MENGELOLA', v_a, false, 'PINTU');
      if v_err <> '' then
        v_probs := selftest.f22_note(v_probs, 'F22-K03', 'a door was refused: ' || v_err);
      end if;
      perform selftest.f22_sebagai('sysadmin@synthetic.pintar.test', v_l);
      v_j := public.konteks_saya();
      if v_j ->> 'tujuan' <> 'MENGAJAR' or (v_j ->> 'tempat')::uuid <> v_b then
        v_probs := selftest.f22_note(v_probs, 'F22-K03', 'the laptop reads ' || v_j::text || ', not Mengajar · beta');
      end if;
      perform selftest.f22_sebagai('sysadmin@synthetic.pintar.test', v_p);
      v_j := public.konteks_saya();
      if v_j ->> 'tujuan' <> 'MENGELOLA' or (v_j ->> 'tempat')::uuid <> v_a then
        v_probs := selftest.f22_note(v_probs, 'F22-K03', 'the phone reads ' || v_j::text || ', not Mengelola · alpha');
      end if;
      -- the phone moves to «Seluruh platform»; the laptop stays Mengajar · beta
      v_err := selftest.f22_tetapkan('MENGELOLA', null, true, 'PILIHAN');
      perform selftest.f22_sebagai('sysadmin@synthetic.pintar.test', v_l);
      v_j := public.konteks_saya();
      perform selftest.as_owner();
      if v_err <> '' or v_j ->> 'tujuan' <> 'MENGAJAR' or (v_j ->> 'tempat')::uuid <> v_b then
        v_probs := selftest.f22_note(v_probs, 'F22-K03', format('changing the phone touched the laptop: «%s» %s', v_err, v_j));
      end if;
      if (select konteks_platform from public.device_sessions where session_id = v_p) is not true then
        v_probs := selftest.f22_note(v_probs, 'F22-K03', 'the phone did not move to «Seluruh platform»');
      end if;
      -- and in Mengajar · beta her entitlement is untouched: still Admin platform, the same grants
      perform selftest.f22_sebagai('sysadmin@synthetic.pintar.test', v_l);
      if not public.is_system_admin() then
        v_probs := selftest.f22_note(v_probs, 'F22-K03', 'in Mengajar · beta she is no longer Admin platform');
      end if;
      perform selftest.as_owner();
      select string_agg(ra.id::text || ra.role || coalesce(ra.institution_id::text, '') || coalesce(ra.revoked_at::text, ''), ',' order by ra.id)
        into v_sesudah from public.role_assignments ra where ra.person_id = v_gladys;
      if v_sesudah is distinct from v_sebelum then
        v_probs := selftest.f22_note(v_probs, 'F22-K03', 'setting the two contexts changed her grants');
      end if;
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f22_note(v_probs, 'F22-K03', 'the test could not run: ' || left(sqlerrm, 200));
    end;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F22-K04  INVALIDATION: a revoked or an expired grant clears the context, never moves it
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      select a.person_id into v_guru from public.accounts a join auth.users u on u.id = a.auth_user_id
       where u.email = 'alpha-guru@synthetic.pintar.test';
      -- revoked
      v_s := selftest.f22_sesi('alpha-guru@synthetic.pintar.test');
      perform selftest.f22_sebagai('alpha-guru@synthetic.pintar.test', v_s);
      v_err := selftest.f22_tetapkan('MENGAJAR', v_a, false, 'PINTU');
      perform selftest.as_owner();
      update public.role_assignments set revoked_at = now(), revoked_by = v_guru
       where person_id = v_guru and role = 'EDUCATOR' and revoked_at is null;
      perform selftest.f22_sebagai('alpha-guru@synthetic.pintar.test', v_s);
      v_j := public.konteks_saya();
      v_got := selftest.f22_tetapkan('MENGAJAR', v_a, false, 'PILIHAN');
      perform selftest.as_owner();
      if v_err <> '' or v_j ->> 'keadaan' <> 'TIDAK_BERLAKU' or v_j ->> 'tujuan' <> 'MENGAJAR' then
        v_probs := selftest.f22_note(v_probs, 'F22-K04', format('a revoked Guru''s Mengajar read %s («%s»), not TIDAK_BERLAKU', v_j, v_err));
      end if;
      if (select konteks_tujuan from public.device_sessions where session_id = v_s) is not null then
        v_probs := selftest.f22_note(v_probs, 'F22-K04', 'the revoked context was left on the row, or moved');
      end if;
      if v_got <> 'KONTEKS_TIDAK_DIPEGANG' then
        v_probs := selftest.f22_note(v_probs, 'F22-K04', 'the revoked Mengajar could be set again: «' || coalesce(nullif(v_got, ''), 'accepted') || '»');
      end if;

      -- expired: a learner given a Guru appointment at alpha that has already run out holds no Mengajar, and a
      -- Mengajar · alpha placed on their row is cleared on the next read (a grant's dates never change: INV-16)
      select a.person_id into v_grant from public.accounts a join auth.users u on u.id = a.auth_user_id
       where u.email = 'beta-siswa-1@synthetic.pintar.test';
      perform set_config('app.seed_intent', 'synthetic', true);
      insert into public.role_assignments (person_id, role, scope_node_id, institution_id, valid_from, valid_until)
      values (v_grant, 'EDUCATOR', v_a, v_a, now() - interval '2 days', now() - interval '1 second');
      perform set_config('app.seed_intent', '', true);
      v_s := selftest.f22_sesi('beta-siswa-1@synthetic.pintar.test');
      update public.device_sessions set konteks_tujuan = 'MENGAJAR', konteks_tempat = v_a, konteks_sebab = 'PILIHAN',
             konteks_pada = now() where session_id = v_s;
      perform selftest.f22_sebagai('beta-siswa-1@synthetic.pintar.test', v_s);
      v_j := public.konteks_saya();
      v_got := selftest.f22_pasangan();
      v_err := selftest.f22_tetapkan('MENGAJAR', v_a, false, 'PILIHAN');
      perform selftest.as_owner();
      if v_j ->> 'keadaan' <> 'TIDAK_BERLAKU' or (select konteks_tujuan from public.device_sessions where session_id = v_s) is not null then
        v_probs := selftest.f22_note(v_probs, 'F22-K04', format('a Mengajar from an expired grant read %s and was not cleared', v_j));
      end if;
      if v_got <> 'BELAJAR' or v_err <> 'KONTEKS_TIDAK_DIPEGANG' then
        v_probs := selftest.f22_note(v_probs, 'F22-K04', format('with an expired Guru grant the learner holds «%s» and setting Mengajar was answered «%s»',
          v_got, coalesce(nullif(v_err, ''), 'accepted')));
      end if;
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f22_note(v_probs, 'F22-K04', 'the test could not run: ' || left(sqlerrm, 200));
    end;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F22-K05  THE END CLEARS IT
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      v_s := selftest.f22_sesi('alpha-dean@synthetic.pintar.test');
      v_s2 := selftest.f22_sesi('alpha-dean@synthetic.pintar.test');
      perform selftest.f22_sebagai('alpha-dean@synthetic.pintar.test', v_s);
      v_err := selftest.f22_tetapkan('MENGELOLA', v_a, false, 'PINTU');
      perform public.sesi_akhiri_saya();
      v_j := public.konteks_saya();
      v_got := selftest.f22_tetapkan('MENGELOLA', v_a, false, 'PILIHAN');
      perform selftest.as_owner();
      select count(*) into v_n from public.device_sessions
       where session_id = v_s and ended_reason = 'KELUAR'
         and konteks_tujuan is null and konteks_tempat is null and not konteks_platform and konteks_sebab is null and konteks_pada is null;
      if v_err <> '' or v_n <> 1 then
        v_probs := selftest.f22_note(v_probs, 'F22-K05', format('«Keluar» left a context on the ended row («%s», %s clean row)', v_err, v_n));
      end if;
      if v_j ->> 'keadaan' <> 'BERAKHIR' or v_got <> 'KONTEKS_TANPA_SESI' then
        v_probs := selftest.f22_note(v_probs, 'F22-K05', format('the ended session read %s and was answered «%s»', v_j, coalesce(nullif(v_got, ''), 'accepted')));
      end if;
      -- «Keluar dari semua perangkat»: every session of the person, every context
      perform selftest.f22_sebagai('alpha-dean@synthetic.pintar.test', v_s2);
      v_err := selftest.f22_tetapkan('MENGELOLA', v_a, false, 'PINTU');
      perform public.sesi_akhiri_semua();
      perform selftest.as_owner();
      select count(*) into v_n from public.device_sessions d join auth.users u on u.id = d.auth_user_id
       where u.email = 'alpha-dean@synthetic.pintar.test' and (d.ended_at is null or d.konteks_tujuan is not null);
      if v_err <> '' or v_n <> 0 then
        v_probs := selftest.f22_note(v_probs, 'F22-K05', format('«Keluar dari semua perangkat» left %s session(s) open or with a context («%s»)', v_n, v_err));
      end if;
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f22_note(v_probs, 'F22-K05', 'the test could not run: ' || left(sqlerrm, 200));
    end;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F22-K06  NEVER AUTHORITY
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      select n.id into v_node from public.org_nodes n where n.institution_id = v_a and n.kind = 'CLASS' limit 1;
      if v_node is null then raise exception 'the alpha school has no class to rename'; end if;
      -- a Kepala departemen, Mengajar · alpha then Mengelola · alpha: renaming the school's class (Admin sekolah's act)
      -- is refused in both, exactly as without a context; a Guru with a context forged straight onto the row is refused
      for r in select * from (values
          ('alpha-hod@synthetic.pintar.test', 'MENGAJAR', true),
          ('alpha-hod@synthetic.pintar.test', 'MENGELOLA', true),
          ('alpha-dean@synthetic.pintar.test', 'MENGELOLA', true),
          ('qac-guru-a@synthetic.pintar.test', 'MENGELOLA', false)
        ) as t(email, tujuan, lewat_penulis) loop
        v_s := selftest.f22_sesi(r.email);
        if r.lewat_penulis then
          perform selftest.f22_sebagai(r.email, v_s);
          v_err := selftest.f22_tetapkan(r.tujuan, v_a, false, 'PILIHAN');
          perform selftest.as_owner();
          if v_err <> '' then
            v_probs := selftest.f22_note(v_probs, 'F22-K06', format('%s could not set %s · alpha: %s', r.email, r.tujuan, v_err));
          end if;
        else
          update public.device_sessions set konteks_tujuan = r.tujuan, konteks_tempat = v_a, konteks_sebab = 'PILIHAN',
                 konteks_pada = now() where session_id = v_s;
        end if;
        perform selftest.f22_sebagai(r.email, v_s);
        v_err := '';
        begin
          perform public.rename_school_node(v_node, 'Kelas F22 ' || substr(md5(random()::text), 1, 6));
        exception when others then
          v_err := sqlstate;
        end;
        -- the primitives answer the same in every context
        if public.can_in_institution('CAN_PROVISION_PEOPLE', v_a) or public.can_on_node('CAN_PUBLISH', v_node) then
          v_probs := selftest.f22_note(v_probs, 'F22-K06', format('%s in %s · alpha answers an admin capability true', r.email, r.tujuan));
        end if;
        v_j := public.konteks_saya();
        perform selftest.as_owner();
        if v_err = '' then
          v_probs := selftest.f22_note(v_probs, 'F22-K06', format('%s in %s · alpha renamed the school''s class: the context widened authority', r.email, r.tujuan));
        end if;
        if not r.lewat_penulis and v_j ->> 'keadaan' <> 'TIDAK_BERLAKU' then
          v_probs := selftest.f22_note(v_probs, 'F22-K06', 'a forged Mengelola for a Guru was read as ' || v_j::text || ', not cleared');
        end if;
      end loop;

      -- ... while the Admin sekolah renames it with no context at all: the database's answer is the grant's, alone
      v_s := selftest.f22_sesi('alpha-admin@synthetic.pintar.test');
      perform selftest.f22_sebagai('alpha-admin@synthetic.pintar.test', v_s);
      v_err := '';
      begin
        perform public.rename_school_node(v_node, 'Kelas F22 admin ' || substr(md5(random()::text), 1, 6));
      exception when others then
        v_err := sqlstate || ' ' || sqlerrm;
      end;
      perform selftest.as_owner();
      if v_err <> '' then
        v_probs := selftest.f22_note(v_probs, 'F22-K06', 'the Admin sekolah, with no context, could not rename the class: ' || left(v_err, 120));
      end if;

      -- no policy and no function but the context's own reads it, now or after any later migration
      select p.tablename into v_got from pg_policies p
       where coalesce(p.qual, '') ~ '\mkonteks_(tujuan|tempat|platform|sebab|pada|saya|tetapkan|dipegang)'
          or coalesce(p.with_check, '') ~ '\mkonteks_(tujuan|tempat|platform|sebab|pada|saya|tetapkan|dipegang)' limit 1;
      if v_got is not null then
        v_probs := selftest.f22_note(v_probs, 'F22-K06', 'the policy on ' || v_got || ' reads the working context');
      end if;
      select string_agg(n.nspname || '.' || p.proname, ', ') into v_got
        from pg_proc p join pg_namespace n on n.oid = p.pronamespace
       where n.nspname in ('public', 'pintar_permintaan')
         and p.prosrc ~ '\mkonteks_(tujuan|tempat|platform|sebab|pada|saya|tetapkan|dipegang)'
         and p.proname not in ('konteks_tempat_saya', 'konteks_dipegang', 'konteks_tetapkan', 'konteks_saya', 'sesi_akhiri_inti');
      if v_got is not null then
        v_probs := selftest.f22_note(v_probs, 'F22-K06', 'these functions read the working context: ' || v_got);
      end if;
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f22_note(v_probs, 'F22-K06', 'the test could not run: ' || left(sqlerrm, 200));
    end;

    raise exception 'F22-ROLLBACK';
  exception when others then
    if sqlerrm <> 'F22-ROLLBACK' then v_fatal := sqlerrm; end if;
  end;
  perform selftest.as_owner();

  for r in
    select * from unnest(
      array['F22-K01', 'F22-K02', 'F22-K03', 'F22-K04', 'F22-K05', 'F22-K06'],
      array['L3, D-132 C1 C2 C6 C7 -- what a person holds: purpose · place from the grants',
            'L3, D-132 C4 -- the one writer: the caller''s own session, a pair they hold',
            'L3, D-132 §2.10 -- two sessions, two contexts, no grant changed',
            'L3, D-132 §2.7 -- a revoked or expired grant clears the context, never moves it',
            'L3, D-132 §2.8 -- the session''s end clears its context',
            'L3, D-132 §2.11, CR-83(4) -- context never widens authority'],
      array[
        'a learner holds Belajar; a Guru, Mengajar in their school only; a Guru who is enrolled, both; a Kepala departemen, '
          || 'Mengajar and Mengelola there; a Dekan and an Admin sekolah, Mengelola only and never Mengajar; a library author, '
          || 'Mengajar in the library; a class card, Belajar only; Admin platform, Mengelola in every active school, the '
          || 'library and «Seluruh platform», and no Mengajar of its own; Admin platform who is also a Guru in two schools, '
          || 'Mengajar in exactly those two besides',
        'a pair not held is refused by name and nothing is written (an Admin sekolah''s Mengajar, a Guru''s Mengelola, another '
          || 'school or «Seluruh platform», a card''s Mengajar); a door sets a context where none is, and a second door or a '
          || 'requested page over it is refused (C4) while the person''s own choice changes it; a token without a session, an '
          || 'ended session, and a token naming another person''s session are refused, the other row untouched',
        'one Admin platform, two browsers: the laptop Mengajar · beta and the phone Mengelola · alpha, each reading its own; '
          || 'the phone moved to «Seluruh platform» leaves the laptop Mengajar · beta; in Mengajar · beta she is still Admin '
          || 'platform, and her grants are the same before and after',
        'a Guru''s Mengajar whose grant is revoked, and a Mengajar resting on a Guru grant that has expired, read TIDAK_BERLAKU '
          || 'and are cleared from the row, never moved; neither pair can be set again, and the person with the expired grant '
          || 'holds Belajar alone',
        '«Keluar» ends the row and leaves no context on it; the ended session reads BERAKHIR and is refused a context; '
          || '«Keluar dari semua perangkat» leaves none of the person''s sessions open or with a context',
        'renaming the school''s class (an Admin sekolah''s act) is refused to a Kepala departemen in Mengajar and in Mengelola, '
          || 'to a Dekan in Mengelola, and to a Guru with Mengelola forged onto the row, which is cleared on the next read; '
          || 'the authorization primitives answer false in every one; the Admin sekolah renames it with no context at all; '
          || 'no RLS policy and no function but the context''s own reads the context'
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

  id := 'F22-DONE'; area := 'suite'; ok := v_fatal = '';
  detail := case when v_fatal = '' then 'FABLE-22 suite complete; every row rolled back'
                 else 'the suite did not complete: ' || left(v_fatal, 200) end;
  return next;
end $$;
revoke all on function selftest.run_fable22() from public;
