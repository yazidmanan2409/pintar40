-- L1-F2 · the lock order has no cycle (Sharon's result review of e27f4a77, BLOCKED on one item;
-- SUSPENSION-COVERS-NEW-ACCOUNTS.md §0 item 9). ONE RULE: the person's row before their accounts rows, and the person's
-- auth.users rows before their accounts rows.
--
--   * SHARON'S CYCLE. recovery_grant_permit and password_write_permit took the ACCOUNT row FOR SHARE, then inserted a
--     permit, whose L1-F4 guard took the PERSON row FOR SHARE. The suspending act takes the person FOR UPDATE, then
--     (akun_kunci) the accounts FOR UPDATE. Overlapped, one is aborted 40P01, and it can be the suspension, started
--     by an administrator, while the person being suspended runs the recovery. Now both issuers take the person row
--     FOR SHARE first, then the account row, then their check: person, then account, on both sides.
--   * THE SAME SHAPE, FOUND BY THE ENGINEER'S SEARCH (every function that locks or updates an accounts row):
--     - authorize_card_reissue, authorize_card_conversion and authorize_email_correction take the account FOR UPDATE,
--       then insert into card_reissues / card_conversions / email_corrections (and password_write_permits), whose
--       L1-F4 guards take the person FOR SHARE: account, then person. Now the person row FOR SHARE first.
--     - auth_card_email_guard (BEFORE UPDATE on auth.users, the card's Auth write after a reissue or a conversion)
--       holds the auth.users row and then updates the accounts row. akun_kunci took the accounts rows FOR UPDATE and
--       then updated auth.users: accounts, then auth.users, the other way round. L1-R2 made this cycle (before it,
--       akun_kunci locked no accounts row). Now akun_kunci takes the person's auth.users rows FOR NO KEY UPDATE, in id
--       order, before their accounts rows. Auth's own write cannot be reordered; akun_kunci can. NO KEY UPDATE, not
--       UPDATE: it waits for any UPDATE of the row (Auth's write), and does not wait for the FOR KEY SHARE a foreign key's
--       check takes (a permit's or a session's insert), which needs no ordering against a lock.
--   * THE ORDER, AFTER THIS MIGRATION: persons → auth.users → accounts → password_write_permits. Every path that
--     takes two of these takes them in that order (the page lists each).

-- ═══════════════════════════════════════════════════════════ (1) the issuers: the person row first
do $$
declare v_def text; v_old text;
begin
  v_def := pg_get_functiondef('public.recovery_grant_permit(text)'::regprocedure);
  v_old := E'  perform 1 from public.accounts a where a.auth_user_id = v_calon for share;\n';
  if position(v_old in v_def) = 0 then raise exception 'L1-F2: recovery_grant_permit does not lock where it did'; end if;
  execute replace(v_def, v_old,
       E'  -- L1-F2 (Sharon, review of e27f4a77): the person row first, then the account row (persons → accounts)\n'
    || E'  perform 1 from public.persons p where p.id = (select a.person_id from public.accounts a where a.auth_user_id = v_calon) for share;\n'
    || v_old);

  v_def := pg_get_functiondef('public.password_write_permit(uuid,text)'::regprocedure);
  v_old := E'  perform 1 from public.accounts a where a.auth_user_id = p_auth_user for share;\n';
  if position(v_old in v_def) = 0 then raise exception 'L1-F2: password_write_permit does not lock where it did'; end if;
  execute replace(v_def, v_old,
       E'  -- L1-F2 (Sharon, review of e27f4a77): the person row first, then the account row (persons → accounts)\n'
    || E'  perform 1 from public.persons p where p.id = (select a.person_id from public.accounts a where a.auth_user_id = p_auth_user) for share;\n'
    || v_old);
end $$;
revoke all on function public.recovery_grant_permit(text) from public, anon, authenticated;
grant execute on function public.recovery_grant_permit(text) to service_role;
revoke all on function public.password_write_permit(uuid, text) from public, anon, authenticated;
grant execute on function public.password_write_permit(uuid, text) to service_role;

-- ═══════════════════════════════════════════════════════════ (2) the card acts: the person row first
do $$
declare f text; v_def text; v_old text;
begin
  v_old := E'  select a.* into v_akun from public.accounts a where a.person_id = p_person and a.kind = ''CLASSROOM_CARD'' for update;\n';
  foreach f in array array['public.authorize_card_reissue(uuid,text,text)', 'public.authorize_card_conversion(uuid,text,text)'] loop
    v_def := pg_get_functiondef(f::regprocedure);
    if position(v_old in v_def) = 0 then raise exception 'L1-F2: % does not lock the card where it did', f; end if;
    execute replace(v_def, v_old,
         E'  -- L1-F2 (the engineer''s search after Sharon''s review of e27f4a77): the person row before the account row\n'
      || E'  perform 1 from public.persons where id = p_person for share;\n'
      || v_old);
  end loop;
end $$;

do $$
declare v_def text; v_old text;
begin
  v_def := pg_get_functiondef('public.authorize_email_correction(uuid,text,text)'::regprocedure);
  v_old := E'  select a.* into v_akun from public.accounts a\n   where a.person_id = p_person and a.kind = ''EMAIL'' and not public.adalah_persona(a.person_id)\n   for update;\n';
  if position(v_old in v_def) = 0 then raise exception 'L1-F2: authorize_email_correction does not lock where it did'; end if;
  execute replace(v_def, v_old,
       E'  -- L1-F2 (the engineer''s search after Sharon''s review of e27f4a77): the person row before the account row\n'
    || E'  perform 1 from public.persons where id = p_person for share;\n'
    || v_old);
end $$;

-- ═══════════════════════════════════════════════════════════ (3) akun_kunci: auth.users before accounts
do $$
declare v_def text; v_old text;
begin
  v_def := pg_get_functiondef('public.akun_kunci(uuid,boolean)'::regprocedure);
  v_old := E'  for a in select ac.auth_user_id from public.accounts ac where ac.person_id = p_person and ac.auth_user_id is not null\n';
  if position(v_old in v_def) = 0 then raise exception 'L1-F2: akun_kunci does not lock where it did'; end if;
  execute replace(v_def, v_old,
       E'  -- L1-F2 (the engineer''s search): the person''s auth.users rows before their accounts rows. Auth''s own write of a\n'
    || E'  -- card (auth_card_email_guard) holds the auth.users row and then updates the accounts row; this takes them the same way\n'
    || E'  perform 1 from auth.users u where u.id in (select ac.auth_user_id from public.accounts ac where ac.person_id = p_person)\n'
    || E'   order by u.id for no key update;\n'
    || v_old);
end $$;
revoke all on function public.akun_kunci(uuid, boolean) from public, anon, authenticated, service_role;

-- ═══════════════════════════════════════════════════════════ (4) the migration's own check (ADR-0003: structural)
-- Each issuer's and each card act's FIRST locking statement is on persons; akun_kunci locks auth.users before accounts.
do $$
declare f text; v text; a int; b int;
begin
  foreach f in array array['public.recovery_grant_permit(text)', 'public.password_write_permit(uuid,text)',
                           'public.authorize_card_reissue(uuid,text,text)', 'public.authorize_card_conversion(uuid,text,text)',
                           'public.authorize_email_correction(uuid,text,text)'] loop
    v := pg_get_functiondef(f::regprocedure);
    a := position('from public.persons' in v);
    b := least(nullif(position('for share' in v), 0), nullif(position('for update' in v), 0));
    if a = 0 or b is null or a > b then raise exception 'L1-F2: the first lock of % is not on persons', f; end if;
  end loop;
  v := pg_get_functiondef('public.akun_kunci(uuid,boolean)'::regprocedure);
  if position('from auth.users u' in v) = 0 or position('from auth.users u' in v) > position('for update of ac' in v) then
    raise exception 'L1-F2: akun_kunci does not lock auth.users before accounts';
  end if;
end $$;
