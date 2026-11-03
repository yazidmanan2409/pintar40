-- FABLE-24 database suite: Batch 4 (D-152) — administration, identity and account management.
--
-- Ordering: depends on fable01.sql (the role switches), fable06/11/12 (fixture helpers) and fable23.sql (f23_raised).
-- Never applied as a migration; never present in production.
--
--   F24-K01  A CARD LEARNER BECOMES STAFF THROUGH AN EMAIL ACCOUNT (D-152(a), CR-91 kept): the school admin converts a
--            class-card learner's account to an email account (authorize_card_conversion, then Auth moves the
--            address); the SAME account row, the same Auth user and the same person remain, so every record keyed by
--            the person (enrolments, PINTAR ID, audit) stays; the card number signs nobody in; the account is an EMAIL
--            account whose set-up is REQUIRED, so the person activates it with a code to the new address; the
--            conversion is audited (account.card_converted_to_email: reason, the old card, the new address, by whom);
--            only then may a staff role be granted, and the person then holds a role and no class card (CR-91)
--   F24-K02  THE CONVERSION'S REFUSALS: without a reason (REASON_REQUIRED), to a Guru and to another school's
--            administrator (42501), for a person with no class card (CARD_NOT_FOUND), to an address an account
--            already uses (EMAIL_TAKEN), to a malformed address (EMAIL_INVALID); a card's address moved without a live
--            grant, or to an address other than the granted one, is still refused (CARD_ADDRESS_REFUSED); after a
--            conversion, an unguarded change of the new email address is refused (EMAIL_CHANGE_REFUSED)
--
-- EVERY ROW IS ROLLED BACK: one subtransaction, verdicts collected in a jsonb of problems, a sentinel to undo the
-- lot, and the findings emitted afterwards.

create schema if not exists selftest;
grant usage on schema selftest to authenticated, anon;

do $$
begin
  if to_regprocedure('selftest.f23_raised(text)') is null or to_regprocedure('selftest.f11_user(text,public.app_role,uuid)') is null then
    raise exception 'apply fable01, fable06, fable11, fable12 and fable23.sql before fable24.sql: the helpers are missing';
  end if;
end $$;

create or replace function selftest.f24_note(p jsonb, p_id text, p_problem text)
returns jsonb language sql immutable as $$
  select jsonb_set(coalesce(p, '{}'::jsonb), array[p_id], coalesce(p -> p_id, '[]'::jsonb) || to_jsonb(p_problem))
$$;
grant execute on function selftest.f24_note(jsonb, text, text) to authenticated, anon;

create or replace function selftest.run_fable24()
returns table (id text, area text, ok boolean, detail text)
language plpgsql set search_path = public, pg_temp as $$
declare
  r record; v_tag text := to_char(clock_timestamp(), 'HH24MISSUS'); v_probs jsonb := '{}'::jsonb; v_fatal text := '';
  v_a uuid; v_node uuid; v_murid uuid; v_lain uuid; v_akun public.accounts; v_akun2 public.accounts; v_uid uuid;
  v_err text; v_n int; v_b boolean; v_kartu text; v_email text; v_jejak jsonb; v_ra uuid; v_pid text; v_guru uuid;
  v_adm_b uuid; v_w_b uuid; v_enrol int;
begin
  begin
    select i.id into v_a from public.institutions i where i.slug like 'synth-alpha-%' limit 1;
    select n.id into v_node from public.org_nodes n where n.institution_id = v_a and n.kind = 'INSTITUTION' limit 1;
    if v_a is null or v_node is null then raise exception 'the fixture lacks the alpha school or its node'; end if;

    -- alpha gives numbers: it reserves a namespace first if the fixture has none (rolled back with the rest; fable23's step)
    if (select x.namespace from public.institutions x where x.id = v_a) is null then
      for v_n in 1..50 loop
        v_err := upper(substr(md5(v_tag || v_n::text), 1, 3));
        exit when not exists (select 1 from public.institutions x where upper(x.namespace) = v_err);
      end loop;
      update public.institutions set namespace = v_err where institutions.id = v_a;
    end if;
    -- a class-card learner of alpha, with a PINTAR ID: made the way Aktivasi makes one (F23-C07's path)
    v_kartu := '92' || lpad((floor(random() * 1e8))::bigint::text, 8, '0');
    v_email := 'f24-' || v_tag || '@local.invalid';
    perform set_config('app.seed_intent', 'synthetic', true);
    insert into public.persons (display_name) values ('Murid Kartu F24 ' || v_tag) returning persons.id into v_murid;
    insert into public.persons (display_name) values ('Guru Surel F24 ' || v_tag) returning persons.id into v_lain;
    perform public.issue_institutional_id(v_murid, v_a);
    perform public.issue_institutional_id(v_lain, v_a);
    perform set_config('app.seed_intent', '', true);
    perform selftest.as_user('alpha-admin@synthetic.pintar.test');
    perform * from public.authorize_account_activation(v_murid, 'CLASSROOM_CARD',
      'card-' || v_kartu || '@cards.synthetic.pintar.test', v_kartu);
    perform selftest.as_owner();
    insert into auth.users (id, email) values (gen_random_uuid(), 'card-' || v_kartu || '@cards.synthetic.pintar.test');
    select a.* into v_akun from public.accounts a where a.person_id = v_murid;
    if v_akun.id is null or v_akun.kind <> 'CLASSROOM_CARD' then raise exception 'the fixture card account was not made'; end if;
    select ii.institutional_id into v_pid from public.institutional_identities ii where ii.person_id = v_murid limit 1;
    perform audit_write('selftest.f24_marker', 'persons', v_murid::text, v_a, jsonb_build_object('person_id', v_murid));
    v_guru  := selftest.f11_user('f24-guru-'  || v_tag || '@local.invalid', 'EDUCATOR', v_a);
    perform set_config('app.seed_intent', 'synthetic', true);
    insert into public.institutions (name, slug, is_synthetic, is_active)
    values ('Sekolah F24 tetangga ' || v_tag, 'f24x-' || v_tag, true, true) returning institutions.id into v_w_b;
    perform set_config('app.seed_intent', '', true);
    v_adm_b := selftest.f11_user('f24-adm-b-' || v_tag || '@local.invalid', 'INSTITUTION_ADMIN', v_w_b);

    -- ═══════════════════════════════════════════════════════════════════════
    -- F24-K02  THE REFUSALS (before the real conversion)
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      perform selftest.as_user('alpha-admin@synthetic.pintar.test');
      for r in select * from (values
          (v_murid, v_email, 'kurang', 'PR040 REASON_REQUIRED', 'no reason'),
          (v_murid, 'bukan-alamat', 'Diangkat menjadi asisten guru di sekolah ini.', 'PR040 EMAIL_INVALID', 'a malformed address'),
          (v_murid, 'alpha-admin@synthetic.pintar.test', 'Diangkat menjadi asisten guru di sekolah ini.', 'PR040 EMAIL_TAKEN', 'a taken address'),
          (v_lain, v_email, 'Diangkat menjadi asisten guru di sekolah ini.', 'PR040 CARD_NOT_FOUND', 'a person with no card'))
        as t(p, e, alasan, mau, apa) loop
        v_err := selftest.f23_raised(format('select * from public.authorize_card_conversion(%L::uuid, %L, %L)', r.p, r.e, r.alasan));
        if v_err is distinct from r.mau then
          v_probs := selftest.f24_note(v_probs, 'F24-K02', format('%s answered %s, not %s', r.apa, coalesce(v_err, 'a grant'), r.mau));
        end if;
      end loop;
      for r in select * from (values (v_guru, 'a Guru'), (v_adm_b, 'another school''s administrator')) as t(u, siapa) loop
        perform selftest.as_user_uid(r.u);
        v_err := selftest.f23_raised(format('select * from public.authorize_card_conversion(%L::uuid, %L, %L)',
          v_murid, v_email, 'Diangkat menjadi asisten guru di sekolah ini.'));
        if v_err is null or v_err not like '42501%' then
          v_probs := selftest.f24_note(v_probs, 'F24-K02', format('%s converting the card answered %s', r.siapa, coalesce(v_err, 'a grant')));
        end if;
      end loop;
      -- the card's address moved with no grant: refused
      perform selftest.as_owner();
      v_err := selftest.f23_raised(format('update auth.users set email = %L where id = %L::uuid', v_email, v_akun.auth_user_id));
      if v_err is distinct from 'PR040 CARD_ADDRESS_REFUSED' then
        v_probs := selftest.f24_note(v_probs, 'F24-K02', 'a card''s address moved to an email with no grant answered ' || coalesce(v_err, 'done'));
      end if;
      -- a grant for one address does not move it to another
      perform selftest.as_user('alpha-admin@synthetic.pintar.test');
      perform * from public.authorize_card_conversion(v_murid, v_email, 'Diangkat menjadi asisten guru di sekolah ini.');
      perform selftest.as_owner();
      v_err := selftest.f23_raised(format('update auth.users set email = %L where id = %L::uuid', 'lain-' || v_email, v_akun.auth_user_id));
      if v_err is distinct from 'PR040 CARD_ADDRESS_REFUSED' then
        v_probs := selftest.f24_note(v_probs, 'F24-K02', 'a grant moved the card to another address: ' || coalesce(v_err, 'done'));
      end if;
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f24_note(v_probs, 'F24-K02', 'threw: ' || sqlerrm);
    end;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F24-K01  THE CONVERSION
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      select count(*) into v_enrol from public.audit_log a where a.target_id = v_murid::text;
      -- before: a staff role over the card is refused (CR-91, unchanged)
      perform selftest.as_user('alpha-admin@synthetic.pintar.test');
      v_err := selftest.f23_raised(format('select public.grant_role(%L::uuid, %L::public.app_role, %L::uuid, %L::timestamptz)',
        v_murid, 'EDUCATOR', v_node, now() + interval '1 year'));
      if v_err is distinct from '42501 STAFF_ROLE_FOR_CARD' then
        v_probs := selftest.f24_note(v_probs, 'F24-K01', 'a staff role over the card answered ' || coalesce(v_err, 'a grant'));
      end if;
      -- the school admin authorises; Auth moves the address (the route's admin write)
      select c.auth_user_id into v_uid from public.authorize_card_conversion(v_murid, v_email,
        'Diangkat menjadi asisten guru di sekolah ini.') c;
      perform selftest.as_owner();
      if v_uid is distinct from v_akun.auth_user_id then
        v_probs := selftest.f24_note(v_probs, 'F24-K01', 'the grant names another Auth user');
      end if;
      update auth.users set email = v_email where users.id = v_akun.auth_user_id;
      select a.* into v_akun2 from public.accounts a where a.person_id = v_murid;
      if v_akun2.id is distinct from v_akun.id or v_akun2.auth_user_id is distinct from v_akun.auth_user_id
         or v_akun2.kind <> 'EMAIL' or v_akun2.card_number is not null then
        v_probs := selftest.f24_note(v_probs, 'F24-K01', format('the account after reads %s', row_to_json(v_akun2)));
      end if;
      select count(*) into v_n from public.accounts a where a.person_id = v_murid;
      if v_n <> 1 then v_probs := selftest.f24_note(v_probs, 'F24-K01', format('%s accounts for the person', v_n)); end if;
      if not exists (select 1 from public.account_setup s where s.account_id = v_akun.id and s.state = 'REQUIRED'
                       and s.password_set_at is null and s.name_confirmed_at is null) then
        v_probs := selftest.f24_note(v_probs, 'F24-K01', 'the account''s set-up is not REQUIRED, from the start');
      end if;
      if exists (select 1 from auth.users u where u.id = v_akun.auth_user_id and coalesce(u.encrypted_password, '') <> '') then
        v_probs := selftest.f24_note(v_probs, 'F24-K01', 'the card''s PIN still signs the account in');
      end if;
      if exists (select 1 from auth.users u where lower(u.email) = 'card-' || v_kartu || '@cards.synthetic.pintar.test') then
        v_probs := selftest.f24_note(v_probs, 'F24-K01', 'the card''s sign-in address still exists');
      end if;
      select t.auth_user_id::text into v_err from public.activation_code_target(v_email) t;
      if v_err is distinct from v_akun.auth_user_id::text then
        v_probs := selftest.f24_note(v_probs, 'F24-K01', 'the new address is not offered an activation code');
      end if;
      select a.summary into v_jejak from public.audit_log a
       where a.action = 'account.card_converted_to_email' and a.target_id = v_murid::text order by a.id desc limit 1;
      if v_jejak is null or v_jejak ->> 'reason' <> 'Diangkat menjadi asisten guru di sekolah ini.'
         or v_jejak #>> '{from,card_number}' <> v_kartu or v_jejak #>> '{to,email}' <> v_email or v_jejak ->> 'authorized_by' is null then
        v_probs := selftest.f24_note(v_probs, 'F24-K01', 'the conversion''s audit row reads ' || coalesce(v_jejak::text, 'nothing'));
      end if;
      -- the person and what is keyed by them are unchanged
      if not exists (select 1 from public.institutional_identities ii where ii.person_id = v_murid and ii.institutional_id = v_pid) then
        v_probs := selftest.f24_note(v_probs, 'F24-K01', 'the PINTAR ID did not stay with the person');
      end if;
      select count(*) into v_n from public.audit_log a where a.target_id = v_murid::text;
      if v_n < v_enrol + 1 or not exists (select 1 from public.audit_log a where a.action = 'selftest.f24_marker' and a.target_id = v_murid::text) then
        v_probs := selftest.f24_note(v_probs, 'F24-K01', format('the person''s audit trail went from %s to %s rows', v_enrol, v_n));
      end if;
      -- now the staff role is granted, and CR-91 holds: a role, no card
      perform selftest.as_user('alpha-admin@synthetic.pintar.test');
      v_err := selftest.f23_raised(format('select public.grant_role(%L::uuid, %L::public.app_role, %L::uuid, %L::timestamptz)',
        v_murid, 'EDUCATOR', v_node, now() + interval '1 year'));
      perform selftest.as_owner();
      if v_err is not null then
        v_probs := selftest.f24_note(v_probs, 'F24-K01', 'after the conversion the staff role was refused: ' || v_err);
      end if;
      if not public.memegang_peran_staf(v_murid)
         or exists (select 1 from public.accounts a where a.person_id = v_murid and a.kind = 'CLASSROOM_CARD') then
        v_probs := selftest.f24_note(v_probs, 'F24-K01', 'after the grant the person does not hold a role and no card');
      end if;
      -- K02's last refusal: the new address is an email account's, guarded as every other is
      v_err := selftest.f23_raised(format('update auth.users set email = %L where id = %L::uuid', 'lagi-' || v_email, v_akun.auth_user_id));
      if v_err is distinct from 'PR040 EMAIL_CHANGE_REFUSED' then
        v_probs := selftest.f24_note(v_probs, 'F24-K02', 'after the conversion an unguarded address change answered ' || coalesce(v_err, 'done'));
      end if;
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f24_note(v_probs, 'F24-K01', 'threw: ' || sqlerrm);
    end;

    raise exception 'F24_ROLLBACK';
  exception when others then
    perform selftest.as_owner();
    if sqlerrm <> 'F24_ROLLBACK' then v_fatal := sqlerrm; end if;
  end;
  perform selftest.as_owner();

  for r in select * from unnest(
      array['F24-K01', 'F24-K02'],
      array['D-152(a) -- a card learner becomes staff through an email account', 'D-152(a) -- the conversion''s refusals'],
      array[
        'the school admin converts a class-card learner''s account: the same account row, Auth user, person and PINTAR '
          || 'ID; an EMAIL account whose set-up is REQUIRED (the new address is offered an activation code); the card''s '
          || 'PIN and address sign nobody in; audited with the reason, the old card and the new address; a staff role '
          || 'refused before (STAFF_ROLE_FOR_CARD) is granted after, and the person holds a role and no card (CR-91)',
        'refused without a reason, to a malformed or taken address, for a person with no card, to a Guru and to another '
          || 'school''s administrator; a card''s address moved without a grant or to another address is refused; after '
          || 'the conversion the new address is guarded as every email account''s (EMAIL_CHANGE_REFUSED)'
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

  id := 'F24-DONE'; area := 'suite'; ok := v_fatal = '';
  detail := case when v_fatal = '' then 'FABLE-24 suite complete; every row rolled back'
                 else 'the suite did not complete: ' || left(v_fatal, 200) end;
  return next;
end $$;
revoke all on function selftest.run_fable24() from public;
