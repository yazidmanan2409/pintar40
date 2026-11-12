-- L1-F4 · an anonymised person is never reopened, and a deletion and a reopen never pass each other (Sharon's result
-- review of 3a63a2b2, BLOCKED on two defects; ANONYMISED-PERSON-IS-TERMINAL.md §0 item 11).
--
--   * L1F4-A1, A RACE. hapus_data_pribadi checked that an open closure exists BEFORE it took the person's row, and
--     buka_kembali_akun never took the person's row. A reopen could end the closure between the deletion's check and its
--     lock; the deletion then anonymised a person who had just been reopened. Irreversible.
--   * L1F4-A2, NO RACE NEEDED. The deletion leaves the closure row open (it is what keeps every account locked), and
--     neither minta_buka_kembali nor buka_kembali_akun read anonymized_at. A reopen approved after the deletion ended the
--     closure and unlocked the anonymised person's accounts: a class card signed in again.
--   * THE FIX. The deletion, the reopen and the reinstatement each take the person's row FOR UPDATE FIRST: before the
--     request row, before the suspension row, before any check. Each reads the request's person without a lock to
--     know which row to take, then locks its request and checks it again. So they serialise on the person:
--       - reopen first: the deletion then finds no open closure (ACCOUNT_NOT_CLOSED);
--       - deletion first: the reopen then finds the person anonymised (ACCOUNT_ANONYMISED).
--     The person row comes before the request row in BOTH, because the deletion now also ends the person's open REOPEN
--     request: had the reopen locked its request first, the two would wait on each other.
--   * minta_buka_kembali records nothing for an anonymised person. Its answer was already the same for everyone.
--   * THE DELETION ENDS ANY OPEN REOPEN REQUEST for the person (DECLINED, with a note), so none is left that could only
--     be refused (Sharon's recommendation, asked for by the Chief Architect).
--   * LOCK ORDER (L1-F2's rule): persons → account_requests → person_suspensions → auth.users → accounts.

-- ═══════════════════════════════════════════════════════════ (1) the refusal code, in full (AKUN-K01)
create or replace function public.akun_tolak(p_code text)
returns void language plpgsql set search_path = public, pg_temp as $$
begin
  raise exception using
    errcode = 'PR140',
    detail  = p_code,
    message = case p_code
      when 'ACCOUNT_NOT_ALLOWED'        then 'this is the PINTAR Administrator''s act'
      when 'ACCOUNT_SELF'               then 'an administrator does not suspend their own account'
      when 'ACCOUNT_UNKNOWN'            then 'no such person'
      when 'ACCOUNT_CATEGORY_INVALID'   then 'the category is one of the listed ones'
      when 'ACCOUNT_NOTE_REQUIRED'      then 'the note or reason is 10 to 300 characters'
      when 'ACCOUNT_ALREADY_SUSPENDED'  then 'this account is already suspended or closed'
      when 'ACCOUNT_NOT_SUSPENDED'      then 'this account is not suspended or closed'
      when 'ACCOUNT_CONFIRM_REQUIRED'   then 'the request needs its one confirmation'
      when 'ACCOUNT_LEARNER_VIA_SCHOOL' then 'a learner''s request is made through the school with the family'
      when 'ACCOUNT_REQUEST_OPEN'       then 'this request has already been made and is in hand'
      when 'ACCOUNT_REQUEST_INVALID'    then 'this is not an open request to delete personal data'
      when 'ACCOUNT_NOT_CLOSED'         then 'personal data is deleted only from a closed account'
      when 'ACCOUNT_PLATFORM_ROLE'      then 'a person holding a platform role does not close their own account'
      when 'ACCOUNT_REOPEN_VIA_REQUEST' then 'a closed account is reopened only from its request, after identity verification'
      -- L1-F4 (Sharon §3a.3)
      when 'ACCOUNT_LIVE_ATTACHMENT'    then 'this person gained an enrolment, a role or another attachment since the closure'
      -- L1-F4 (Sharon, result review of 3a63a2b2): a deleted person is terminal
      when 'ACCOUNT_ANONYMISED'         then 'this person''s personal data was deleted; the account is not reopened'
      else 'the account could not be changed' end;
end $$;
revoke all on function public.akun_tolak(text) from public, anon, authenticated;

-- ═══════════════════════════════════════════════════════════ (2) the deletion: the person first, then everything else
do $$
declare v_def text; v_old text; v_new text;
begin
  v_def := pg_get_functiondef('public.hapus_data_pribadi(uuid,text)'::regprocedure);
  -- the request row is no longer the first lock: the person is, then the request, read again under both
  v_old := E'  select * into r from public.account_requests q where q.id = p_request for update;\n';
  if position(v_old in v_def) = 0 then raise exception 'L1-F4: hapus_data_pribadi does not lock its request where it did'; end if;
  v_def := replace(v_def, v_old,
       E'  -- L1-F4 (Sharon, result review of 3a63a2b2): the person row FIRST, before the request and before any check, so a\n'
    || E'  -- reopen (which takes the same row first) and this deletion never pass each other\n'
    || E'  perform 1 from public.persons p where p.id = (select q.person_id from public.account_requests q where q.id = p_request) for update;\n'
    || v_old);
  -- the closure is checked under that lock (it was checked before it)
  v_old := E'  if not exists (select 1 from public.person_suspensions s where s.person_id = r.person_id and s.ended_at is null and s.category = ''CLOSED_AT_REQUEST'') then\n'
        || E'    perform public.akun_tolak(''ACCOUNT_NOT_CLOSED'');\n'
        || E'  end if;\n'
        || E'  select p.pintar_id, p.photo_path is not null into v_pid, v_foto from public.persons p where p.id = r.person_id for update;\n';
  if position(v_old in v_def) = 0 then raise exception 'L1-F4: hapus_data_pribadi does not check the closure where it did'; end if;
  v_new := E'  select p.pintar_id, p.photo_path is not null into v_pid, v_foto from public.persons p where p.id = r.person_id for update;\n'
        || E'  if not exists (select 1 from public.person_suspensions s where s.person_id = r.person_id and s.ended_at is null and s.category = ''CLOSED_AT_REQUEST'') then\n'
        || E'    perform public.akun_tolak(''ACCOUNT_NOT_CLOSED'');\n'
        || E'  end if;\n';
  v_def := replace(v_def, v_old, v_new);
  -- the person's open REOPEN request is ended with the deletion, with a note
  v_old := E'  update public.persons set display_name = v_pid, photo_path = null, anonymized_at = now() where id = r.person_id;\n';
  if position(v_old in v_def) = 0 then raise exception 'L1-F4: hapus_data_pribadi does not anonymise where it did'; end if;
  v_def := replace(v_def, v_old, v_old
    || E'  -- L1-F4 (Sharon; the Chief Architect): no request to reopen is left that could only be refused\n'
    || E'  update public.account_requests q set status = ''DECLINED'', decided_by = v_actor, decided_at = now(),\n'
    || E'         decision_note = ''Data pribadi orang ini sudah dihapus; akunnya tidak dibuka kembali.''\n'
    || E'   where q.person_id = r.person_id and q.kind = ''REOPEN'' and q.status in (''RECEIVED'', ''IN_PROGRESS'');\n');
  execute v_def;
end $$;
revoke all on function public.hapus_data_pribadi(uuid, text) from public, anon, authenticated;
grant execute on function public.hapus_data_pribadi(uuid, text) to authenticated;

-- ═══════════════════════════════════════════════════════════ (3) the reopen: the person first; never an anonymised one
create or replace function public.buka_kembali_akun(p_request uuid, p_cara_verifikasi text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_actor uuid := public.current_person_id(); v_cara text := btrim(coalesce(p_cara_verifikasi, ''));
        r public.account_requests; v_s public.person_suspensions; v_peran jsonb;
begin
  if v_actor is null or not public.is_system_admin() then perform public.akun_tolak('ACCOUNT_NOT_ALLOWED'); end if;
  -- L1-F4 (Sharon, result review of 3a63a2b2): the person row FIRST, as the deletion takes it, then the request
  perform 1 from public.persons p where p.id = (select q.person_id from public.account_requests q where q.id = p_request) for update;
  select * into r from public.account_requests q where q.id = p_request for update;
  if r.id is null or r.kind <> 'REOPEN' or r.status not in ('RECEIVED', 'IN_PROGRESS') then perform public.akun_tolak('ACCOUNT_REQUEST_INVALID'); end if;
  if r.person_id = v_actor then perform public.akun_tolak('ACCOUNT_SELF'); end if;
  -- L1-F4 (L1F4-A2): a person whose personal data was deleted is terminal; a returning individual is a new person
  if exists (select 1 from public.persons p where p.id = r.person_id and p.anonymized_at is not null) then
    perform public.akun_tolak('ACCOUNT_ANONYMISED');
  end if;
  select * into v_s from public.person_suspensions s where s.person_id = r.person_id and s.ended_at is null for update;
  if v_s.id is null or v_s.category <> 'CLOSED_AT_REQUEST' then perform public.akun_tolak('ACCOUNT_NOT_CLOSED'); end if;
  if char_length(v_cara) < 10 or char_length(v_cara) > 300 then perform public.akun_tolak('ACCOUNT_NOTE_REQUIRED'); end if;
  update public.person_suspensions set ended_at = now(), ended_by = v_actor, end_reason = v_cara where id = v_s.id;
  -- the owner (9 Nov): reopening restores signing in, never a former authority. Any school role still live from before
  -- the closure ends now, each through the role guard and its own role.revoked row; a school gives it again if it
  -- still applies. (A person holding a platform role cannot have closed their account: ACCOUNT_PLATFORM_ROLE.)
  select coalesce(jsonb_agg(jsonb_build_object('id', ra.id, 'role', ra.role, 'scope_node_id', ra.scope_node_id) order by ra.id), '[]')
    into v_peran from public.role_assignments ra
   where ra.person_id = r.person_id and ra.revoked_at is null and ra.role <> 'SYSTEM_ADMIN';
  update public.role_assignments ra set revoked_at = now(), revoked_by = v_actor,
         revoked_reason = 'Akun dibuka kembali: peran dari sebelum akun ditutup tidak dipulihkan'
   where ra.person_id = r.person_id and ra.revoked_at is null and ra.role <> 'SYSTEM_ADMIN';
  perform public.akun_kunci(r.person_id, false);
  update public.account_requests set status = 'DONE', decided_by = v_actor, decided_at = now(), decision_note = v_cara where id = r.id;
  perform public.audit_write('account.reopened', 'persons', r.person_id::text, null,
    jsonb_build_object('person_id', r.person_id, 'request_id', r.id, 'reason', v_cara, 'identity_verified', true, 'roles_ended', v_peran,
                       'from', jsonb_build_object('category', v_s.category), 'actor_role', public.audit_actor_role(null)));
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.buka_kembali_akun(uuid, text) from public, anon, authenticated;
grant execute on function public.buka_kembali_akun(uuid, text) to authenticated;

-- ═══════════════════════════════════════════════════════════ (4) the reinstatement: the person first (the same order)
do $$
declare v_def text; v_old text;
begin
  v_def := pg_get_functiondef('public.aktifkan_kembali_akun(uuid,text)'::regprocedure);
  v_old := E'  select * into v_s from public.person_suspensions s where s.person_id = p_person and s.ended_at is null for update;\n';
  if position(v_old in v_def) = 0 then raise exception 'L1-F4: aktifkan_kembali_akun does not lock where it did'; end if;
  execute replace(v_def, v_old,
       E'  -- L1-F4 (Sharon, result review of 3a63a2b2): the person row first, before the suspension row and akun_kunci\n'
    || E'  perform 1 from public.persons p where p.id = p_person for update;\n'
    || v_old);
end $$;
revoke all on function public.aktifkan_kembali_akun(uuid, text) from public, anon, authenticated;
grant execute on function public.aktifkan_kembali_akun(uuid, text) to authenticated;

-- ═══════════════════════════════════════════════════════════ (5) a request to reopen records nothing for a deleted person
do $$
declare v_def text; v_old text;
begin
  v_def := pg_get_functiondef('public.minta_buka_kembali(text,text)'::regprocedure);
  v_old := E'  if v_person is not null\n';
  if position(v_old in v_def) = 0 then raise exception 'L1-F4: minta_buka_kembali does not decide where it did'; end if;
  execute replace(v_def, v_old,
       E'  -- L1-F4 (Sharon, result review of 3a63a2b2): a deleted person is terminal; the answer is the same as for anyone\n'
    || E'  if v_person is not null and exists (select 1 from public.persons p where p.id = v_person and p.anonymized_at is null)\n');
end $$;

-- ═══════════════════════════════════════════════════════════ (6) the migration's own check (ADR-0003: structural)
-- In each of the three, the line holding the first FOR UPDATE is the lock on persons
do $$
declare f text; v text; i int;
begin
  foreach f in array array['public.hapus_data_pribadi(uuid,text)', 'public.buka_kembali_akun(uuid,text)', 'public.aktifkan_kembali_akun(uuid,text)'] loop
    v := pg_get_functiondef(f::regprocedure);
    i := position('for update' in v);
    if i = 0 or substring(substr(v, 1, i + 9) from '[^\n]*$') not like '%from public.persons p where p.id%' then
      raise exception 'L1-F4: % does not take the person row first', f;
    end if;
  end loop;
  if position('ACCOUNT_ANONYMISED' in pg_get_functiondef('public.buka_kembali_akun(uuid,text)'::regprocedure)) = 0 then
    raise exception 'L1-F4: the reopen does not refuse an anonymised person';
  end if;
end $$;
