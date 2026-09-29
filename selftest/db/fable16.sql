-- FABLE-16 database suite: BOB-24, the identity foundation (identity Gate 2,
-- D-054, D-056, D-059).
--
-- Ordering: depends on fable01.sql (role switches) and fable11.sql (f11_user,
-- f11_note, f11_raised). Never applied as a migration; never present in
-- production.
--
--   F16-I01  the PINTAR ID: every person holds one, well-formed and distinct;
--            input is normalised as ruled; a new person is given one; it never
--            changes; nothing about the person goes into it, and there is no
--            card-edition table (D-059)
--   F16-U01  usernames: C9's rules and reserved names; one claim per staff
--            person; taken names refused; no rename, no delete; the platform
--            admin's correction states a reason and is audited; a card and a
--            persona are refused
--   F16-P01  the personal PIN: the blocklist; bcrypt, never the PIN; one PIN,
--            set once; nothing but the two PIN functions reads the hash
--   F16-S01  set-up state: every staff EMAIL account REQUIRED until a username
--            and a PIN are in place; class cards and personas never in it
--   F16-R01  the recovery ladder and the code counters: 3 wrong -> 1 h, 3 -> 4 h,
--            3 -> suspended; a locked or suspended ID judges nothing; 30 clean
--            days decay levels 1-2, never a suspension; success resets; both
--            restore paths force a new PIN and the old one never works again;
--            an ID nobody holds walks the same steps; all audited
--   F16-N01  storage and surfaces: RLS on, no policies, no grants; the routes'
--            functions are service_role's only; the helpers nobody's; the
--            platform admin's refuse everyone else; the client ones registered
--   (F16-C01..C03, concurrency, are driven from run.ts.)
--
-- EVERY ROW IS ROLLED BACK: one subtransaction, verdicts collected in a jsonb
-- of problems, a sentinel to undo the lot, and the findings emitted afterwards.

create schema if not exists selftest;
grant usage on schema selftest to authenticated, anon;

do $$
begin
  if to_regprocedure('selftest.f11_user(text, public.app_role, uuid)') is null
     or to_regprocedure('selftest.f11_raised(text)') is null then
    raise exception 'apply fable01.sql and fable11.sql before fable16.sql';
  end if;
end $$;

-- A recovery attempt as the recovery route makes it (service_role).
create or replace function selftest.f16_pulih(p_id text, p_pin text)
returns table (outcome text, wait_seconds integer, person_id uuid)
language plpgsql set search_path = public, pg_temp as $$
begin
  set local role service_role;
  return query select * from public.recovery_attempt(p_id, p_pin);
  reset role;
exception when others then
  reset role;
  raise;
end $$;

create or replace function selftest.f16_as_layanan(p_sql text)
returns void
language plpgsql set search_path = public, pg_temp as $$
begin
  set local role service_role;
  execute p_sql;
  reset role;
exception when others then
  reset role;
  raise;
end $$;

-- A code attempt as the activation route makes it (service_role).
create or replace function selftest.f16_kode(p_kunci text)
returns integer
language plpgsql set search_path = public, pg_temp as $$
declare v int;
begin
  set local role service_role;
  v := public.identity_attempt('CODE_VERIFY', p_kunci);
  reset role;
  return v;
exception when others then
  reset role;
  raise;
end $$;

-- The code of a PR040 refusal (its DETAIL), else the SQLSTATE.
create or replace function selftest.f16_kode_tolak(p_sql text)
returns text
language plpgsql set search_path = public, pg_temp as $$
declare v jsonb := selftest.f11_raised(p_sql);
begin
  if v is null then return null; end if;
  return case when v ->> 'code' = 'PR040' then v ->> 'detail' else v ->> 'code' end;
end $$;
grant execute on function selftest.f16_kode_tolak(text) to authenticated, anon;

revoke all on function selftest.f16_pulih(text, text), selftest.f16_as_layanan(text), selftest.f16_kode(text) from public;

-- ═══════════════════════════════════════════════════════════════ the suite
create or replace function selftest.run_fable16()
returns table (id text, area text, ok boolean, detail text)
language plpgsql set search_path = public, pg_temp as $$
declare
  r record; n int; m int; v text; w text; k text; v_tag text; v_err jsonb; i int;
  v_root uuid; v_a uuid; v_b uuid; v_pa uuid; v_pb uuid; v_ea text; v_eb text;
  v_card text; v_persona text; v_admin text; v_id text; v_id2 text; v_ghost text;
  v_hasil record; v_urut text[]; v_urut2 text[];
  v_probs jsonb := '{}'::jsonb; v_fatal text := '';
begin
  perform selftest.as_owner();
  begin
    v_tag := substr(md5(random()::text), 1, 8);
    select n2.id into v_root from public.org_nodes n2 join public.institutions i2 on i2.id = n2.institution_id
     where i2.slug like 'synth-siklus-%' and n2.kind = 'INSTITUTION' order by i2.created_at desc limit 1;
    if v_root is null then raise exception 'the seeded learning-cycle school is not there'; end if;
    v_ea := 'f16-guru-a-' || v_tag || '@local.invalid';
    v_eb := 'f16-guru-b-' || v_tag || '@local.invalid';
    perform selftest.f11_user(v_ea, 'EDUCATOR', v_root);
    perform selftest.f11_user(v_eb, 'EDUCATOR', v_root);
    select a.person_id into v_pa from public.accounts a join auth.users u on u.id = a.auth_user_id where u.email = v_ea;
    select a.person_id into v_pb from public.accounts a join auth.users u on u.id = a.auth_user_id where u.email = v_eb;
    select u.email into v_card from public.accounts a join auth.users u on u.id = a.auth_user_id
     where a.kind = 'CLASSROOM_CARD' order by a.created_at limit 1;
    select u.email into v_persona from public.evaluation_personas e join public.accounts a on a.person_id = e.person_id
      join auth.users u on u.id = a.auth_user_id order by e.created_at limit 1;
    v_admin := 'sysadmin@synthetic.pintar.test';

    -- ═══════════════════════════════════════════════════════════════════════
    -- F16-I01  THE PINTAR ID
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      select count(*), count(distinct p.pintar_id) into n, m from public.persons p;
      if n <> m then v_probs := selftest.f11_note(v_probs, 'F16-I01', format('%s persons share %s IDs', n, m)); end if;
      select count(*) into n from public.persons p where p.pintar_id is null or p.pintar_id !~ '^[0-9A-HJKMNP-TV-Z]{8}$';
      if n > 0 then v_probs := selftest.f11_note(v_probs, 'F16-I01', format('%s person(s) without a well-formed PINTAR ID', n)); end if;
      -- input as ruled: case-insensitive, spaces and hyphens ignored, O->0, I/L->1
      for r in select * from (values (' a14c-d7st ', 'A14CD7ST'), ('A14C D7ST', 'A14CD7ST'), ('o1il-ooOO', '01110000'),
                                     ('A14CD7SU', null), ('A14CD7S', null), ('A14CD7STX', null), ('', null), ('A14C_D7ST', null)) t(masuk, harap) loop
        v := public.pintar_id_canonical(r.masuk);
        if v is distinct from r.harap then
          v_probs := selftest.f11_note(v_probs, 'F16-I01', format('%L is read as %s, expected %s', r.masuk, coalesce(v, 'nothing'), coalesce(r.harap, 'nothing')));
        end if;
      end loop;
      -- a thousand fresh IDs: the alphabet only, no I, L, O or U
      select count(*) into n from (select public.pintar_id_new() x from generate_series(1, 1000)) q where x !~ '^[0-9A-HJKMNP-TV-Z]{8}$';
      if n > 0 then v_probs := selftest.f11_note(v_probs, 'F16-I01', format('%s of 1000 fresh IDs fall outside the alphabet', n)); end if;
      -- a new person is given one, and it never changes
      select p.pintar_id into v from public.persons p where p.id = v_pa;
      if v is null then v_probs := selftest.f11_note(v_probs, 'F16-I01', 'a person made now has no PINTAR ID'); end if;
      k := selftest.f16_kode_tolak(format('update public.persons set pintar_id = %L where id = %L', 'ZZZZZZZZ', v_pa));
      if k is distinct from 'PINTAR_ID_IMMUTABLE' then v_probs := selftest.f11_note(v_probs, 'F16-I01', format('changing a PINTAR ID was answered %s', coalesce(k, 'with success'))); end if;
      k := selftest.f16_kode_tolak(format('update public.persons set pintar_id = null where id = %L', v_pa));
      if k is distinct from 'PINTAR_ID_IMMUTABLE' then v_probs := selftest.f11_note(v_probs, 'F16-I01', 'a PINTAR ID could be cleared (and redrawn)'); end if;
      update public.persons p set display_name = p.display_name where p.id = v_pa;
      if (select p.pintar_id from public.persons p where p.id = v_pa) is distinct from v then
        v_probs := selftest.f11_note(v_probs, 'F16-I01', 'an ordinary edit of a person changed their PINTAR ID');
      end if;
      -- D-059: the generator takes nothing about anyone, and there is no card edition
      if (select p.pronargs from pg_proc p where p.oid = 'public.pintar_id_new()'::regprocedure) <> 0
         or pg_get_functiondef('public.pintar_id_new()'::regprocedure) !~ 'gen_random_bytes'
         or pg_get_functiondef('public.pintar_id_new()'::regprocedure) ~* '(institution|role|level|jenjang|org_node)' then
        v_probs := selftest.f11_note(v_probs, 'F16-I01', 'the PINTAR ID is not drawn from randomness alone (D-059)');
      end if;
      select string_agg(c.relname, ', ') into v from pg_class c join pg_namespace ns on ns.oid = c.relnamespace
       where ns.nspname = 'public' and c.relkind = 'r' and c.relname ~* '(edition|edisi)';
      if v is not null then v_probs := selftest.f11_note(v_probs, 'F16-I01', 'a card-edition table exists: ' || v); end if;
    exception when others then
      v_probs := selftest.f11_note(v_probs, 'F16-I01', 'the test could not run: ' || left(sqlerrm, 150));
    end;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F16-U01  USERNAMES
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      for r in select * from (values ('abc', 'USERNAME_LENGTH'), (repeat('a', 21), 'USERNAME_LENGTH'), ('budi-santoso', 'USERNAME_CHARACTERS'),
                                     ('budi santoso', 'USERNAME_CHARACTERS'), ('12345', 'USERNAME_NUMBER'), ('_budi', 'USERNAME_START'),
                                     ('9budi', 'USERNAME_START'), ('hendra12', 'USERNAME_ID_SHAPE'), ('a14cd7st', 'USERNAME_ID_SHAPE'),
                                     ('admin', 'USERNAME_RESERVED'), ('pintar.guru', 'USERNAME_RESERVED'), ('support_1', 'USERNAME_RESERVED'),
                                     ('noreply', 'USERNAME_RESERVED'), ('budi@sekolah.id', 'USERNAME_EMAIL_SHAPE'),
                                     ('budi.santoso', null), ('Budi_S', null), ('guru.matematika', null), ('ibu_ani', null),
                                     -- as ruled 29 Sep: a reserved prefix refuses only before a separator;
                                     -- an ID shape is exactly 8 alphabet characters after normalisation
                                     ('pintar', 'USERNAME_RESERVED'), ('admin_sekolah', 'USERNAME_RESERVED'), ('resmi.guru', 'USERNAME_RESERVED'),
                                     ('pintaryanti', null), ('rootbeers', null), ('systemika', null), ('rootbeer', 'USERNAME_ID_SHAPE'),
                                     ('hendra123', null), ('hendra.12', null)) t(u, harap) loop
        v := public.username_rejection(r.u);
        if v is distinct from r.harap then
          v_probs := selftest.f11_note(v_probs, 'F16-U01', format('%L is answered %s, expected %s', r.u, coalesce(v, 'allowed'), coalesce(r.harap, 'allowed')));
        end if;
      end loop;
      -- one claim, canonical lowercase
      perform selftest.as_user(v_ea);
      v := null;
      begin v := public.claim_username('Guru.' || v_tag); exception when others then v := 'refused: ' || sqlerrm; end;
      if v is distinct from 'guru.' || v_tag then v_probs := selftest.f11_note(v_probs, 'F16-U01', format('claiming Guru.%s gave %s', v_tag, v)); end if;
      k := selftest.f16_kode_tolak('select public.claim_username(''lain.' || v_tag || ''')');
      if k is distinct from 'USERNAME_ALREADY_SET' then v_probs := selftest.f11_note(v_probs, 'F16-U01', format('a second claim was answered %s', coalesce(k, 'with success'))); end if;
      k := selftest.f16_kode_tolak('select public.claim_username(''admin'')');
      if k is distinct from 'USERNAME_ALREADY_SET' and k is distinct from 'USERNAME_RESERVED' then
        v_probs := selftest.f11_note(v_probs, 'F16-U01', 'a reserved name was accepted');
      end if;
      -- someone else, the same name
      perform selftest.as_user(v_eb);
      k := selftest.f16_kode_tolak('select public.claim_username(''GURU.' || v_tag || ''')');
      if k is distinct from 'USERNAME_TAKEN' then v_probs := selftest.f11_note(v_probs, 'F16-U01', format('a taken name was answered %s', coalesce(k, 'with success'))); end if;
      k := selftest.f16_kode_tolak('select public.claim_username(''pintar.' || v_tag || ''')');
      if k is distinct from 'USERNAME_RESERVED' then v_probs := selftest.f11_note(v_probs, 'F16-U01', format('pintar.%s was answered %s', v_tag, coalesce(k, 'with success'))); end if;
      -- a card and a persona have no username
      if v_card is not null then
        perform selftest.as_user(v_card);
        k := selftest.f16_kode_tolak('select public.claim_username(''kartu.' || v_tag || ''')');
        if k is distinct from 'IDENTITY_NOT_ELIGIBLE' then v_probs := selftest.f11_note(v_probs, 'F16-U01', format('a class card claimed a username (%s)', coalesce(k, 'success'))); end if;
      else
        v_probs := selftest.f11_note(v_probs, 'F16-U01', 'no class card to test the exclusion with');
      end if;
      if v_persona is not null then
        perform selftest.as_user(v_persona);
        k := selftest.f16_kode_tolak('select public.claim_username(''persona.' || v_tag || ''')');
        if k is distinct from 'IDENTITY_NOT_ELIGIBLE' then v_probs := selftest.f11_note(v_probs, 'F16-U01', format('an evaluation persona claimed a username (%s)', coalesce(k, 'success'))); end if;
      else
        v_probs := selftest.f11_note(v_probs, 'F16-U01', 'no evaluation persona to test the exclusion with');
      end if;
      perform selftest.as_owner();
      -- no rename, no delete, even by the owner
      k := selftest.f16_kode_tolak(format('update public.person_usernames set username = %L where person_id = %L', 'baru.' || v_tag, v_pa));
      if k is distinct from 'USERNAME_FIXED' then v_probs := selftest.f11_note(v_probs, 'F16-U01', format('a username was renamed (%s)', coalesce(k, 'success'))); end if;
      k := selftest.f16_kode_tolak(format('delete from public.person_usernames where person_id = %L', v_pa));
      if k is distinct from 'USERNAME_FIXED' then v_probs := selftest.f11_note(v_probs, 'F16-U01', 'a username was deleted'); end if;
      -- the platform admin's correction: a reason, audited; nobody else
      perform selftest.as_user(v_eb);
      k := selftest.f16_kode_tolak(format('select public.correct_username(%L, %L, %L)', v_pa, 'koreksi.' || v_tag, 'typo'));
      if k is distinct from '42501' then v_probs := selftest.f11_note(v_probs, 'F16-U01', 'a teacher corrected another person''s username'); end if;
      perform selftest.as_user(v_admin);
      k := selftest.f16_kode_tolak(format('select public.correct_username(%L, %L, %L)', v_pa, 'koreksi.' || v_tag, ' '));
      if k is distinct from 'REASON_REQUIRED' then v_probs := selftest.f11_note(v_probs, 'F16-U01', 'a correction was made with no reason'); end if;
      v := null;
      begin v := public.correct_username(v_pa, 'Koreksi.' || v_tag, 'ejaan nama keliru'); exception when others then v := 'refused: ' || sqlerrm; end;
      perform selftest.as_owner();
      if v is distinct from 'koreksi.' || v_tag
         or (select u.username from public.person_usernames u where u.person_id = v_pa) is distinct from 'koreksi.' || v_tag then
        v_probs := selftest.f11_note(v_probs, 'F16-U01', format('the platform admin''s correction gave %s', v));
      end if;
      if not exists (select 1 from public.audit_log l where l.action = 'identity.username_corrected' and l.target_id = v_pa::text
                      and l.summary ->> 'from' = 'guru.' || v_tag and l.summary ->> 'to' = 'koreksi.' || v_tag
                      and l.summary ->> 'reason' = 'ejaan nama keliru') then
        v_probs := selftest.f11_note(v_probs, 'F16-U01', 'the correction was not audited with from, to and reason');
      end if;
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f11_note(v_probs, 'F16-U01', 'the test could not run: ' || left(sqlerrm, 150));
    end;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F16-P01  THE PERSONAL PIN
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      for r in select * from (values ('0000', 'PIN_REPEATED'), ('1111', 'PIN_REPEATED'), ('1234', 'PIN_SEQUENCE'), ('4321', 'PIN_SEQUENCE'),
                                     ('6789', 'PIN_SEQUENCE'), ('8901', 'PIN_SEQUENCE'), ('3210', 'PIN_SEQUENCE'), ('1212', 'PIN_PATTERN'),
                                     ('3737', 'PIN_PATTERN'), ('1122', 'PIN_PATTERN'), ('9955', 'PIN_PATTERN'), ('2580', 'PIN_KEYPAD'),
                                     ('1470', 'PIN_KEYPAD'), ('1975', 'PIN_YEAR'), ('2030', 'PIN_YEAR'), ('1004', 'PIN_COMMON'),
                                     ('5683', 'PIN_COMMON'), ('123', 'PIN_FORMAT'), ('12345', 'PIN_FORMAT'), ('12a4', 'PIN_FORMAT'),
                                     ('7394', null), ('2817', null), ('5046', null), ('3182', null)) t(p, harap) loop
        v := public.pin_weakness(r.p);
        if v is distinct from r.harap then
          v_probs := selftest.f11_note(v_probs, 'F16-P01', format('PIN %s is answered %s, expected %s', r.p, coalesce(v, 'allowed'), coalesce(r.harap, 'allowed')));
        end if;
      end loop;
      -- IDENTITY-4.0 §3's list is a top-50, frozen: exactly fifty, the four it names among them
      declare v_def text := pg_get_functiondef('public.pin_weakness(text)'::regprocedure); v_daftar text;
      begin
        v_daftar := substr(v_def, position('return ''PIN_YEAR''' in v_def), position('return ''PIN_COMMON''' in v_def) - position('return ''PIN_YEAR''' in v_def));
        select count(*) into n from regexp_matches(v_daftar, '''[0-9]{4}''', 'g');
        if n <> 50 or v_daftar !~ '''0000''' or v_daftar !~ '''1111''' or v_daftar !~ '''1234''' or v_daftar !~ '''4321''' then
          v_probs := selftest.f11_note(v_probs, 'F16-P01', format('the common list holds %s PIN(s), not IDENTITY-4.0''s top-50 with 0000, 1111, 1234 and 4321', n));
        end if;
      end;
      perform selftest.as_user(v_ea);
      k := selftest.f16_kode_tolak('select public.set_my_pin(''1234'')');
      if k is distinct from 'PIN_SEQUENCE' then v_probs := selftest.f11_note(v_probs, 'F16-P01', format('a trivial PIN was answered %s', coalesce(k, 'with success'))); end if;
      perform public.set_my_pin('7394');
      k := selftest.f16_kode_tolak('select public.set_my_pin(''2817'')');
      if k is distinct from 'PIN_ALREADY_SET' then v_probs := selftest.f11_note(v_probs, 'F16-P01', format('a second PIN was answered %s', coalesce(k, 'with success'))); end if;
      perform selftest.as_owner();
      select pp.pin_hash into v from public.person_pins pp where pp.person_id = v_pa;
      if v is null or v = '7394' or v !~ '^\$2[abxy]\$10\$' or length(v) <> 60 or position('7394' in v) > 0 then
        v_probs := selftest.f11_note(v_probs, 'F16-P01', 'the stored PIN is not a bcrypt hash of it');
      end if;
      if not public.pin_matches(v_pa, '7394') or public.pin_matches(v_pa, '7395') or public.pin_matches(v_pb, '7394') then
        v_probs := selftest.f11_note(v_probs, 'F16-P01', 'the PIN check does not tell the PIN from another, or one person from another');
      end if;
      -- nothing returns the hash: only the two PIN functions read it, and neither returns text
      select string_agg(p.proname, ', ' order by p.proname) into v from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
       where ns.nspname = 'public' and p.prokind = 'f' and pg_get_functiondef(p.oid) ~ 'pin_hash';
      if v is distinct from 'pin_matches, set_my_pin' then
        v_probs := selftest.f11_note(v_probs, 'F16-P01', 'functions reading the PIN hash: ' || coalesce(v, 'none'));
      end if;
      if (select p.prorettype from pg_proc p where p.oid = 'public.pin_matches(uuid,text)'::regprocedure) <> 'boolean'::regtype
         or (select p.prorettype from pg_proc p where p.oid = 'public.set_my_pin(text)'::regprocedure) <> 'void'::regtype then
        v_probs := selftest.f11_note(v_probs, 'F16-P01', 'a PIN function returns something other than yes/no or nothing');
      end if;
      if exists (select 1 from public.audit_log l where l.action like 'identity.%' and (l.summary::text ~ '7394' or l.summary::text ~ '\$2[abxy]\$')) then
        v_probs := selftest.f11_note(v_probs, 'F16-P01', 'the audit record carries a PIN or its hash');
      end if;
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f11_note(v_probs, 'F16-P01', 'the test could not run: ' || left(sqlerrm, 150));
    end;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F16-S01  SET-UP STATE
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      select count(*) into n from public.accounts a
       where a.kind = 'EMAIL' and not public.adalah_persona(a.person_id)
         and not exists (select 1 from public.account_setup s where s.account_id = a.id);
      if n > 0 then v_probs := selftest.f11_note(v_probs, 'F16-S01', format('%s staff EMAIL account(s) have no set-up state', n)); end if;
      select count(*) into n from public.account_setup s join public.accounts a on a.id = s.account_id
       where a.kind <> 'EMAIL' or public.adalah_persona(a.person_id);
      if n > 0 then v_probs := selftest.f11_note(v_probs, 'F16-S01', format('%s class-card or persona account(s) are in the set-up flow', n)); end if;
      perform selftest.as_user(v_eb);
      if public.my_setup_state() is distinct from 'REQUIRED' then
        v_probs := selftest.f11_note(v_probs, 'F16-S01', 'a new staff account is not REQUIRED: ' || coalesce(public.my_setup_state(), 'nothing'));
      end if;
      k := selftest.f16_kode_tolak('select public.complete_my_setup()');
      if k is distinct from 'SETUP_INCOMPLETE' then v_probs := selftest.f11_note(v_probs, 'F16-S01', 'set-up completed with no username or PIN'); end if;
      perform public.claim_username('ibu.' || v_tag);
      k := selftest.f16_kode_tolak('select public.complete_my_setup()');
      if k is distinct from 'SETUP_INCOMPLETE' then v_probs := selftest.f11_note(v_probs, 'F16-S01', 'set-up completed with no PIN'); end if;
      perform public.set_my_pin('2817');
      v := public.complete_my_setup();
      if v is distinct from 'COMPLETE' or public.my_setup_state() is distinct from 'COMPLETE' then
        v_probs := selftest.f11_note(v_probs, 'F16-S01', 'a username and a PIN did not complete set-up');
      end if;
      -- C13, C17: the self-service identity functions are the caller's own, and
      -- a class card or an evaluation persona has none of it
      declare v_siapa text; v_nama text;
      begin
        foreach v_siapa in array array[coalesce(v_card, ''), coalesce(v_persona, '')] loop
          v_nama := case when v_siapa = v_card then 'a class card' else 'an evaluation persona' end;
          if v_siapa = '' then
            v_probs := selftest.f11_note(v_probs, 'F16-S01', 'no class card or evaluation persona to test the exclusion with');
            continue;
          end if;
          perform selftest.as_user(v_siapa);
          if public.my_setup_state() is distinct from 'NOT_APPLICABLE' then
            v_probs := selftest.f11_note(v_probs, 'F16-S01', v_nama || ' is in the set-up flow');
          end if;
          k := selftest.f16_kode_tolak('select public.set_my_pin(''7394'')');
          if k is distinct from 'IDENTITY_NOT_ELIGIBLE' then
            v_probs := selftest.f11_note(v_probs, 'F16-S01', format('%s set a personal PIN (%s)', v_nama, coalesce(k, 'success')));
          end if;
          k := selftest.f16_kode_tolak('select public.complete_my_setup()');
          if k is distinct from 'IDENTITY_NOT_ELIGIBLE' then
            v_probs := selftest.f11_note(v_probs, 'F16-S01', format('%s completed a set-up (%s)', v_nama, coalesce(k, 'success')));
          end if;
          perform selftest.as_owner();
        end loop;
      end;
      perform selftest.as_owner();
      if not exists (select 1 from public.audit_log l where l.action = 'identity.setup_completed' and l.target_id = v_pb::text) then
        v_probs := selftest.f11_note(v_probs, 'F16-S01', 'completing set-up was not audited');
      end if;
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f11_note(v_probs, 'F16-S01', 'the test could not run: ' || left(sqlerrm, 150));
    end;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F16-R01  THE RECOVERY LADDER AND THE CODE COUNTERS
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      select p.pintar_id into v_id from public.persons p where p.id = v_pa;   -- PIN 7394 (F16-P01)
      -- an ID nobody holds, drawn fresh
      loop v_ghost := public.pintar_id_new(); exit when not exists (select 1 from public.persons p where p.pintar_id = v_ghost); end loop;
      -- level 0: two wrong, then the third locks for an hour
      v_urut := array[]::text[]; v_urut2 := array[]::text[];
      for i in 1..3 loop
        select * into v_hasil from selftest.f16_pulih(lower(substr(v_id, 1, 4)) || '-' || substr(v_id, 5), '1357');
        v_urut := v_urut || (v_hasil.outcome || coalesce(':' || v_hasil.wait_seconds, ''));
        select * into v_hasil from selftest.f16_pulih(v_ghost, '1357');
        v_urut2 := v_urut2 || (v_hasil.outcome || coalesce(':' || v_hasil.wait_seconds, ''));
      end loop;
      if v_urut <> array['WRONG', 'WRONG', 'LOCKED:3600'] then
        v_probs := selftest.f11_note(v_probs, 'F16-R01', 'three wrong PINs at level 0 answered ' || array_to_string(v_urut, ', ') || '; expected WRONG, WRONG, LOCKED:3600');
      end if;
      if v_urut2 <> v_urut then
        v_probs := selftest.f11_note(v_probs, 'F16-R01', 'an ID nobody holds answered ' || array_to_string(v_urut2, ', ') || ', a held one ' || array_to_string(v_urut, ', '));
      end if;
      -- the lock itself lasts the hour, not just the answer's number
      if not exists (select 1 from public.recovery_ladder l where l.typed_id = v_id and l.level = 1
                      and l.locked_until between clock_timestamp() + interval '59 minutes' and clock_timestamp() + interval '61 minutes') then
        v_probs := selftest.f11_note(v_probs, 'F16-R01', 'the level-0 lock does not hold the ID for an hour');
      end if;
      -- locked: even the right PIN judges nothing
      select * into v_hasil from selftest.f16_pulih(v_id, '7394');
      if v_hasil.outcome <> 'LOCKED' or v_hasil.person_id is not null then
        v_probs := selftest.f11_note(v_probs, 'F16-R01', 'the right PIN during a lock was answered ' || v_hasil.outcome);
      end if;
      -- the hour served: three more wrong lock for four hours
      update public.recovery_ladder set locked_until = clock_timestamp() - interval '1 second' where typed_id in (v_id, v_ghost);
      v_urut := array[]::text[];
      for i in 1..3 loop
        select * into v_hasil from selftest.f16_pulih(v_id, '1357');
        v_urut := v_urut || (v_hasil.outcome || coalesce(':' || v_hasil.wait_seconds, ''));
      end loop;
      if v_urut <> array['WRONG', 'WRONG', 'LOCKED:14400'] then
        v_probs := selftest.f11_note(v_probs, 'F16-R01', 'three wrong PINs at level 1 answered ' || array_to_string(v_urut, ', ') || '; expected WRONG, WRONG, LOCKED:14400');
      end if;
      if not exists (select 1 from public.recovery_ladder l where l.typed_id = v_id and l.level = 2
                      and l.locked_until between clock_timestamp() + interval '239 minutes' and clock_timestamp() + interval '241 minutes') then
        v_probs := selftest.f11_note(v_probs, 'F16-R01', 'the level-1 lock does not hold the ID for four hours');
      end if;
      -- the four hours served: three more wrong suspend
      update public.recovery_ladder set locked_until = clock_timestamp() - interval '1 second' where typed_id = v_id;
      v_urut := array[]::text[];
      for i in 1..3 loop
        select * into v_hasil from selftest.f16_pulih(v_id, '1357');
        v_urut := v_urut || v_hasil.outcome;
      end loop;
      if v_urut <> array['WRONG', 'WRONG', 'SUSPENDED'] then
        v_probs := selftest.f11_note(v_probs, 'F16-R01', 'three wrong PINs at level 2 answered ' || array_to_string(v_urut, ', ') || '; expected WRONG, WRONG, SUSPENDED');
      end if;
      -- suspended: the right PIN is not accepted, and a year does not lift it
      update public.recovery_ladder set suspended_at = suspended_at - interval '400 days',
             last_failure_at = last_failure_at - interval '400 days', updated_at = updated_at - interval '400 days' where typed_id = v_id;
      select * into v_hasil from selftest.f16_pulih(v_id, '7394');
      if v_hasil.outcome <> 'SUSPENDED' then
        v_probs := selftest.f11_note(v_probs, 'F16-R01', 'a suspension 400 days old answered ' || v_hasil.outcome || ': time lifted it');
      end if;
      if public.pin_matches(v_pa, '7394') then
        v_probs := selftest.f11_note(v_probs, 'F16-R01', 'the PIN of a suspended recovery still matches');
      end if;
      -- restore (1), email recovery: back to 0, and a NEW PIN required; the old one never again
      perform selftest.f16_as_layanan(format('select public.recovery_restore(%L)', v_pa));
      select * into v_hasil from selftest.f16_pulih(v_id, '7394');
      if v_hasil.outcome <> 'WRONG' then
        v_probs := selftest.f11_note(v_probs, 'F16-R01', 'after a restore the old PIN answered ' || v_hasil.outcome);
      end if;
      perform selftest.as_user(v_ea);
      k := selftest.f16_kode_tolak('select public.set_my_pin(''7394'')');
      if k is distinct from 'PIN_REUSED' then v_probs := selftest.f11_note(v_probs, 'F16-R01', format('the old PIN was set again (%s)', coalesce(k, 'success'))); end if;
      perform public.set_my_pin('5046');
      perform selftest.as_owner();
      select * into v_hasil from selftest.f16_pulih(v_id, '5046');
      if v_hasil.outcome <> 'OK' or v_hasil.person_id is distinct from v_pa then
        v_probs := selftest.f11_note(v_probs, 'F16-R01', 'the new PIN after a restore answered ' || v_hasil.outcome);
      end if;
      if (select l.level from public.recovery_ladder l where l.typed_id = v_id) <> 0 then
        v_probs := selftest.f11_note(v_probs, 'F16-R01', 'a successful recovery did not reset the ladder');
      end if;
      -- success resets a level: one wrong, then right
      select * into v_hasil from selftest.f16_pulih(v_id, '1357');
      select * into v_hasil from selftest.f16_pulih(v_id, '5046');
      if (select l.failures from public.recovery_ladder l where l.typed_id = v_id) <> 0 then
        v_probs := selftest.f11_note(v_probs, 'F16-R01', 'a success left the wrong count standing');
      end if;
      -- 30 clean days: the ghost's level 1 decays to 0; its next wrong is the first again
      update public.recovery_ladder set locked_until = clock_timestamp() - interval '29 days',
             last_failure_at = clock_timestamp() - interval '31 days' where typed_id = v_ghost;
      select * into v_hasil from selftest.f16_pulih(v_ghost, '1357');
      select l.level, l.failures into n, m from public.recovery_ladder l where l.typed_id = v_ghost;
      if v_hasil.outcome <> 'WRONG' or n <> 0 or m <> 1 then
        v_probs := selftest.f11_note(v_probs, 'F16-R01', format('after 30 clean days level 1 did not decay: %s at level %s with %s wrong', v_hasil.outcome, n, m));
      end if;
      -- restore (2), the platform admin's: a reason, audited; nobody else
      perform selftest.as_user(v_eb);
      k := selftest.f16_kode_tolak(format('select public.admin_reset_recovery(%L, %L)', v_pa, 'x'));
      if k is distinct from '42501' then v_probs := selftest.f11_note(v_probs, 'F16-R01', 'a teacher reset another person''s recovery'); end if;
      perform selftest.as_user(v_admin);
      k := selftest.f16_kode_tolak(format('select public.admin_reset_recovery(%L, %L)', v_pa, ''));
      if k is distinct from 'REASON_REQUIRED' then v_probs := selftest.f11_note(v_probs, 'F16-R01', 'a reset was made with no reason'); end if;
      perform public.admin_reset_recovery(v_pa, 'lupa PIN, diverifikasi langsung');
      perform selftest.as_owner();
      if not (select pp.reset_required from public.person_pins pp where pp.person_id = v_pa) then
        v_probs := selftest.f11_note(v_probs, 'F16-R01', 'the platform admin''s reset did not force a new PIN');
      end if;
      if not exists (select 1 from public.audit_log l where l.action = 'identity.recovery_restored' and l.target_id = v_pa::text
                      and l.summary ->> 'via' = 'ADMIN_RESET' and l.summary ->> 'reason' = 'lupa PIN, diverifikasi langsung') then
        v_probs := selftest.f11_note(v_probs, 'F16-R01', 'the admin reset was not audited with its reason');
      end if;
      foreach v in array array['identity.recovery_pin_wrong', 'identity.recovery_locked', 'identity.recovery_suspended', 'identity.recovery_pin_ok'] loop
        if not exists (select 1 from public.audit_log l where l.action = v) then
          v_probs := selftest.f11_note(v_probs, 'F16-R01', v || ' is never written');
        end if;
      end loop;
      -- a malformed ID: nothing counted
      select * into v_hasil from selftest.f16_pulih('abc', '1357');
      if v_hasil.outcome <> 'MALFORMED' or exists (select 1 from public.recovery_ladder l where l.typed_id = 'ABC') then
        v_probs := selftest.f11_note(v_probs, 'F16-R01', 'a malformed ID was answered ' || v_hasil.outcome);
      end if;
      -- the code counters: 5 free within 15 minutes, then a wait; OK clears; NOT_JUDGED takes back
      -- ruled 29 Sep (C2, C3): every submitted address hash counts, existing or not, and alike --
      -- the counter never asks whether the address belongs to anyone
      if pg_get_functiondef('public.identity_attempt(text,text)'::regprocedure) ~* '(auth\.users|accounts|persons|email)'
         or pg_get_functiondef('public.identity_attempt_settle(text,text,text)'::regprocedure) ~* '(auth\.users|accounts|persons|email)' then
        v_probs := selftest.f11_note(v_probs, 'F16-R01', 'the code counter looks up whether the address exists');
      end if;
      k := encode(sha256(convert_to('f16-kode|' || v_tag, 'UTF8')), 'hex');
      v_urut := array[]::text[];
      for i in 1..6 loop v_urut := v_urut || selftest.f16_kode(k)::text; end loop;
      if v_urut[1:5] <> array['0', '0', '0', '0', '0'] or v_urut[6]::int not between 28 and 30 then
        v_probs := selftest.f11_note(v_probs, 'F16-R01', 'six code attempts answered ' || array_to_string(v_urut, ', ') || '; expected five 0s and then about 30');
      end if;
      perform selftest.f16_as_layanan(format('select public.identity_attempt_settle(%L, %L, %L)', 'CODE_VERIFY', k, 'NOT_JUDGED'));
      if (select cardinality(a.percobaan) from public.identity_attempts a where a.scope = 'CODE_VERIFY' and a.kunci = k) <> 4 then
        v_probs := selftest.f11_note(v_probs, 'F16-R01', 'an unjudged code attempt was not taken back');
      end if;
      perform selftest.f16_as_layanan(format('select public.identity_attempt_settle(%L, %L, %L)', 'CODE_VERIFY', k, 'OK'));
      if exists (select 1 from public.identity_attempts a where a.scope = 'CODE_VERIFY' and a.kunci = k) then
        v_probs := selftest.f11_note(v_probs, 'F16-R01', 'a right code did not clear the address''s record');
      end if;
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f11_note(v_probs, 'F16-R01', 'the test could not run: ' || left(sqlerrm, 150));
    end;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F16-N01  STORAGE AND SURFACES
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      foreach v in array array['person_usernames', 'person_pins', 'person_pins_retired', 'account_setup', 'identity_attempts', 'recovery_ladder'] loop
        if not (select c.relrowsecurity from pg_class c where c.oid = ('public.' || v)::regclass) then
          v_probs := selftest.f11_note(v_probs, 'F16-N01', v || ' has no RLS');
        end if;
        if exists (select 1 from pg_policy p where p.polrelid = ('public.' || v)::regclass) then
          v_probs := selftest.f11_note(v_probs, 'F16-N01', v || ' has a policy');
        end if;
        foreach w in array array['anon', 'authenticated', 'service_role'] loop
          if has_table_privilege(w, 'public.' || v, 'select') or has_table_privilege(w, 'public.' || v, 'insert')
             or has_table_privilege(w, 'public.' || v, 'update') or has_table_privilege(w, 'public.' || v, 'delete') then
            v_probs := selftest.f11_note(v_probs, 'F16-N01', format('%s holds a grant on %s', w, v));
          end if;
        end loop;
      end loop;
      -- the routes' functions: service_role only
      foreach v in array array['public.recovery_attempt(text,text)', 'public.recovery_restore(uuid)',
                               'public.identity_attempt(text,text)', 'public.identity_attempt_settle(text,text,text)'] loop
        if has_function_privilege('anon', v, 'execute') or has_function_privilege('authenticated', v, 'execute') then
          v_probs := selftest.f11_note(v_probs, 'F16-N01', 'a client can call ' || v);
        end if;
        if not has_function_privilege('service_role', v, 'execute') then
          v_probs := selftest.f11_note(v_probs, 'F16-N01', 'the routes cannot call ' || v);
        end if;
        if exists (select 1 from public.client_rpc_registry g where g.function_name = split_part(split_part(v, '.', 2), '(', 1)) then
          v_probs := selftest.f11_note(v_probs, 'F16-N01', v || ' is registered as a client RPC');
        end if;
      end loop;
      -- the helpers: nobody's
      foreach v in array array['public.pin_matches(uuid,text)', 'public.pintar_id_new()', 'public.pintar_id_canonical(text)',
                               'public.username_rejection(text)', 'public.pin_weakness(text)', 'public.recovery_restore_core(uuid,text,text)'] loop
        foreach w in array array['anon', 'authenticated', 'service_role'] loop
          if has_function_privilege(w, v, 'execute') then
            v_probs := selftest.f11_note(v_probs, 'F16-N01', format('%s can call %s', w, v));
          end if;
        end loop;
      end loop;
      -- the client ones: registered, and anon calls none
      foreach v in array array['claim_username', 'set_my_pin', 'my_setup_state', 'complete_my_setup', 'correct_username',
                               'admin_reset_recovery', 'security_events'] loop
        if not exists (select 1 from public.client_rpc_registry g where g.function_name = v) then
          v_probs := selftest.f11_note(v_probs, 'F16-N01', v || ' is not registered');
        end if;
      end loop;
      if exists (select 1 from public.client_rpc_registry g where g.function_name in ('claim_username', 'set_my_pin', 'my_setup_state', 'complete_my_setup')
                  and (g.exposure <> 'LEARNER' or g.note !~ 'self-service identity, the caller''s own')) then
        v_probs := selftest.f11_note(v_probs, 'F16-N01', 'a self-service identity function is not registered as LEARNER, the caller''s own');
      end if;
      if exists (select 1 from public.client_rpc_registry g where g.function_name in ('correct_username', 'admin_reset_recovery', 'security_events')
                  and g.authorization_kind is distinct from 'SYSTEM_ADMIN') then
        v_probs := selftest.f11_note(v_probs, 'F16-N01', 'a platform-admin function is not declared SYSTEM_ADMIN');
      end if;
      -- refused by the database, as the client roles
      perform selftest.as_user(v_ea);
      foreach v in array array['select count(*) from public.person_pins', 'select count(*) from public.recovery_ladder',
                               'select * from public.recovery_attempt(''ABCDEFGH'', ''1357'')', 'select public.security_events(10)'] loop
        k := selftest.f16_kode_tolak(v);
        if k is distinct from '42501' then v_probs := selftest.f11_note(v_probs, 'F16-N01', format('a teacher ran %s (%s)', v, coalesce(k, 'success'))); end if;
      end loop;
      perform selftest.as_anon();
      foreach v in array array['select public.claim_username(''tamu.pintar'')', 'select public.my_setup_state()', 'select count(*) from public.person_usernames'] loop
        k := selftest.f16_kode_tolak(v);
        if k is distinct from '42501' then v_probs := selftest.f11_note(v_probs, 'F16-N01', format('a visitor ran %s (%s)', v, coalesce(k, 'success'))); end if;
      end loop;
      -- the platform admin reads the security record, and only identity events
      perform selftest.as_user(v_admin);
      select count(*), count(*) filter (where e.action !~ '^identity\.') into n, m from public.security_events(500) e;
      perform selftest.as_owner();
      if n = 0 or m > 0 then
        v_probs := selftest.f11_note(v_probs, 'F16-N01', format('the platform admin read %s security event(s), %s of them not identity events', n, m));
      end if;
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f11_note(v_probs, 'F16-N01', 'the test could not run: ' || left(sqlerrm, 150));
    end;

    raise exception 'F16-ROLLBACK';
  exception when others then
    if sqlerrm <> 'F16-ROLLBACK' then v_fatal := sqlerrm; end if;
  end;
  perform selftest.as_owner();

  for r in
    select * from unnest(
      array['F16-I01', 'F16-U01', 'F16-P01', 'F16-S01', 'F16-R01', 'F16-N01'],
      array['BOB-24 -- the PINTAR ID: random, well-formed, distinct, immutable (D-054 (d), D-059)',
            'BOB-24 -- usernames: C9, reserved names, one claim, no rename, audited correction',
            'BOB-24 -- the personal PIN: blocklist, bcrypt, never returned (D-056 (a))',
            'BOB-24 -- set-up state: staff EMAIL accounts only; never a card or a persona (C13)',
            'BOB-24 -- the recovery ladder and the code counters (D-056 (c)-(e))',
            'BOB-24 -- storage and surfaces: functions only'],
      array[
        'every person holds a distinct 8-character Crockford Base32 PINTAR ID; input is read case-insensitively with spaces '
          || 'and hyphens ignored and O->0, I/L->1, a U or a wrong length refused; 1000 fresh IDs stay in the alphabet; a person '
          || 'made now is given one; changing or clearing it is refused PINTAR_ID_IMMUTABLE and an ordinary edit keeps it; the '
          || 'generator takes no argument and draws gen_random_bytes only; there is no card-edition table',
        'C9''s rules refuse each shape by its own code (length, characters, a number, the start, an ID shape of exactly 8 alphabet '
          || 'characters, a reserved name or a reserved prefix before a separator, an email) and allow ordinary names in '
          || 'lowercase, pintaryanti, hendra123 and hendra.12 among them; a staff person claims one once (USERNAME_ALREADY_SET), a taken or '
          || 'reserved name is refused, a class card and an evaluation persona are IDENTITY_NOT_ELIGIBLE; a rename or delete is '
          || 'refused USERNAME_FIXED even for the owner; a teacher cannot correct, the platform admin must state a reason, and '
          || 'the correction is audited with from, to and reason',
        'the blocklist refuses repeated digits, runs (wrapping), ABAB and AABB, keypad lines, years 1950-2030, IDENTITY-4.0''s '
          || 'top-50 exactly and anything but 4 digits, and allows ordinary PINs; a trivial PIN is refused, one PIN is set once, stored as a '
          || 'bcrypt cost-10 hash that is not the PIN; the check tells the PIN from another and one person from another; only '
          || 'pin_matches (boolean) and set_my_pin (void) read the hash; no audit row carries a PIN or a hash',
        'every staff EMAIL account has a set-up state and no class card or persona has one; a new staff account is REQUIRED, '
          || 'refuses to complete without a username and a PIN, and completes with both, audited; a card and a persona read '
          || 'NOT_APPLICABLE and are refused a PIN and a set-up, IDENTITY_NOT_ELIGIBLE (C13, C17)',
        'at level 0 two wrong PINs are WRONG and the third LOCKED for 3600 s, identically for an ID nobody holds; a lock judges '
          || 'nothing, not even the right PIN; then 3 wrong lock for 14400 s, then 3 wrong SUSPEND; a suspension 400 days old '
          || 'still holds and the suspended PIN matches nothing; the email-recovery restore sets the ladder to 0 and forces a new '
          || 'PIN (the old one answers WRONG and cannot be set again, PIN_REUSED), the new one recovers; success resets the count; '
          || '30 clean days decay level 1; the platform admin''s reset needs a reason, forces a new PIN and is audited; a teacher '
          || 'cannot reset; each step is audited; a malformed ID counts nothing; the code counters give 5 free attempts then '
          || 'about 30 s for any address hash without asking whether it exists, take an unjudged attempt back and clear on a right code',
        'the six identity tables have RLS on, no policies and no grant for anon, authenticated or service_role; recovery and '
          || 'the code counters are service_role''s only and no client RPC; the PIN check, the ID generator and normaliser and '
          || 'the rule functions are nobody''s; the seven client functions are registered, the four self-service ones as LEARNER, the '
          || 'caller''s own, and the platform admin''s as SYSTEM_ADMIN; '
          || 'a teacher and a visitor are refused 42501 by the database; the platform admin reads identity events only'
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

  id := 'F16-DONE'; area := 'suite'; ok := v_fatal = '';
  detail := case when v_fatal = '' then 'FABLE-16 suite complete; every row rolled back'
                 else 'the suite did not complete: ' || left(v_fatal, 200) end;
  return next;
end $$;
revoke all on function selftest.run_fable16() from public;
grant execute on function selftest.run_fable16() to authenticated;

-- ═══════════════════════════════════════════ F16-C02, driven from run.ts
-- Two staff people claiming one username at the same moment, which a single
-- session cannot do. Both are COMMITTED so both connections see them: two
-- staff EMAIL accounts reused across runs; the teardown removes the usernames
-- they claimed (the guard refuses any delete, so it is set aside for that).
create or replace function selftest.f16_concurrency_teardown()
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  alter table public.person_usernames disable trigger person_usernames_guard;
  delete from public.person_usernames u using public.accounts a join auth.users us on us.id = a.auth_user_id
   where u.person_id = a.person_id and us.email in ('f16-conc-a@local.invalid', 'f16-conc-b@local.invalid');
  alter table public.person_usernames enable trigger person_usernames_guard;
end $$;
revoke all on function selftest.f16_concurrency_teardown() from public;

-- Returns '<auth uid A>|<auth uid B>'.
create or replace function selftest.f16_concurrency_fixture()
returns text language plpgsql security definer set search_path = public, pg_temp as $$
declare v_a uuid; v_b uuid;
begin
  perform selftest.f16_concurrency_teardown();
  select u.id into v_a from auth.users u where u.email = 'f16-conc-a@local.invalid';
  if v_a is null then v_a := selftest.f11_user('f16-conc-a@local.invalid', null, null); end if;
  select u.id into v_b from auth.users u where u.email = 'f16-conc-b@local.invalid';
  if v_b is null then v_b := selftest.f11_user('f16-conc-b@local.invalid', null, null); end if;
  return v_a || '|' || v_b;
end $$;
revoke all on function selftest.f16_concurrency_fixture() from public;
