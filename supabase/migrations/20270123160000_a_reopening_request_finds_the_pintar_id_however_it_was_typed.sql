-- Z · R-27(b) (stream A; Sharon's shared fixture selftest/fixtures/z/pintar-id-normalisasi.json, used by S-11 too).
--
-- A closed account asks to be reopened signed out, by its sign-in email, its username or its PINTAR ID. The card
-- prints the PINTAR ID in two groups (A14C D7ST), and people type it with a space, a hyphen, in lower case, or with
-- I or L for 1 and O for 0. minta_buka_kembali compared lower(pintar_id) with the lowered input as typed, so every
-- one of those failed silently: the answer is the same «ok» for every address by design, so no one ever learnt the
-- request was not recorded.
--
-- Now the PINTAR ID path matches through pintar_id_canonical, the same function the sign-in card uses:
--   * only on the PINTAR ID path: the email and username paths are unchanged, and are still read from the input as
--     typed (trimmed, lower case);
--   * only when the canonical form is a valid PINTAR ID (pintar_id_canonical returns null otherwise, and then the
--     PINTAR ID path finds no one: a near miss is another ID, never this one);
--   * never for input containing @: that is an email, and is never normalised (a14cd7st@sekolah.sch.id is not the
--     PINTAR ID A14CD7ST).
-- persons_pintar_id_shape keeps every stored PINTAR ID canonical, so the comparison is plain equality on the unique
-- index. Everything else in the function is restated as it stands (L1-F4 included); CREATE OR REPLACE keeps its grant
-- (service_role only).

create or replace function public.minta_buka_kembali(p_identitas text, p_pesan text)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public', 'pg_temp'
as $function$
declare v_id text := lower(btrim(coalesce(p_identitas, ''))); v_pesan text := btrim(coalesce(p_pesan, '')); v_person uuid; v_req uuid;
        -- Z R-27(b): the PINTAR ID as the card's sign-in reads it; never for an email
        v_kanonik text := case when position('@' in coalesce(p_identitas, '')) = 0 then public.pintar_id_canonical(p_identitas) end;
begin
  -- depends only on what was typed, never on an account
  if v_id = '' or char_length(v_id) > 254 or char_length(v_pesan) < 10 or char_length(v_pesan) > 500 then
    return jsonb_build_object('ok', false, 'kode', 'ACCOUNT_NOTE_REQUIRED');
  end if;
  if v_kanonik is not null then
    select p.id into v_person from public.persons p where p.pintar_id = v_kanonik;
  end if;
  if v_person is null then
    select a.person_id into v_person from public.accounts a join auth.users u on u.id = a.auth_user_id
     where lower(u.email) = v_id and a.kind = 'EMAIL' limit 1;
  end if;
  -- CORRECTED IN PLACE (undeployed; Daisy at 435a2856, §2.4): what signing in takes, the username too (signin_resolve)
  if v_person is null then
    select pu.person_id into v_person from public.person_usernames pu where pu.username = v_id;
  end if;
  -- L1-F4 (Sharon, result review of 3a63a2b2): a deleted person is terminal; the answer is the same as for anyone
  if v_person is not null and exists (select 1 from public.persons p where p.id = v_person and p.anonymized_at is null)
     and exists (select 1 from public.person_suspensions s where s.person_id = v_person and s.ended_at is null and s.category = 'CLOSED_AT_REQUEST')
     and not exists (select 1 from public.account_requests q where q.person_id = v_person and q.kind = 'REOPEN' and q.status in ('RECEIVED', 'IN_PROGRESS')) then
    insert into public.account_requests (person_id, kind, pesan) values (v_person, 'REOPEN', v_pesan) returning id into v_req;
    perform public.audit_write('account.reopen_requested', 'persons', v_person::text, null,
      jsonb_build_object('person_id', v_person, 'request_id', v_req));
  end if;
  return jsonb_build_object('ok', true);
end $function$;

do $$
declare v text := pg_get_functiondef('public.minta_buka_kembali(text,text)'::regprocedure);
begin
  if position('public.pintar_id_canonical(p_identitas)' in v) = 0 or position('lower(p.pintar_id)' in v) > 0 then
    raise exception 'Z R-27(b): minta_buka_kembali does not match the PINTAR ID through pintar_id_canonical';
  end if;
  if position('position(''@'' in' in v) = 0 then raise exception 'Z R-27(b): an email would be normalised as a PINTAR ID'; end if;
  if has_function_privilege('anon', 'public.minta_buka_kembali(text,text)'::regprocedure, 'execute')
     or has_function_privilege('authenticated', 'public.minta_buka_kembali(text,text)'::regprocedure, 'execute')
     or not has_function_privilege('service_role', 'public.minta_buka_kembali(text,text)'::regprocedure, 'execute') then
    raise exception 'Z R-27(b): minta_buka_kembali is no longer service_role only';
  end if;
end $$;

-- ADR-0021 (F06-S01; Bob, found by stream B): every function this migration creates is revoked from PUBLIC after its
-- last create. PUBLIC held no EXECUTE on any of them before (CREATE OR REPLACE keeps the grants), so this changes nothing
-- at runtime; it states the rule where the rule is read.
revoke execute on function public.minta_buka_kembali(text, text) from public;
