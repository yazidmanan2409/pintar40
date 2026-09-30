-- BOB-50 (D-082(d)): A SINGLE UJI CEPAT DOES NOT ISSUE A CERTIFICATE.
--
-- Traced 30 Sep: a finished Uji Cepat on a real school issued a normal,
-- publicly verifiable «Sertifikat Penguasaan», from the player and by a direct
-- POST /api/certificates/issue. The one cause in the database: mode_policy
-- has QUICK certifies = true (20260914093000), and certificate_eligibility
-- accepts any mode whose policy certifies. Its body is unchanged here; it
-- already refuses a mode that does not certify.
--
--   (1) QUICK certifies = false, audited.
--   (2) assert_mode_policy_complete names QUICK among the modes that must not
--       certify, so a flip back fails the lint (and the health card).
--   (3) FAIL CLOSED ON UNSEALED ROWS: if any ELIGIBLE (unsigned) certificate
--       from a QUICK session exists, this migration refuses to apply and says
--       how many (FOR YAZID). Measured 30 Sep: staging and production hold no
--       certificate rows at all. Sealed certificates are never touched: an
--       issued certificate keeps what it said (INV-30).
--
-- TEST, EXAM, STANDALONE and PAPER are NOT touched (no product path reaches
-- them; any change is Yazid's). mode_policy has no version: the change applies
-- to every QUICK session without a certificate, as the ruling intends.

-- ═══════════════════════════════════════════════════════════ (3) the guard
do $$
declare n int;
begin
  select count(*) into n
    from public.certificates c join public.assessment_sessions s on s.id = c.session_id
   where c.status = 'ELIGIBLE' and s.mode = 'QUICK';
  if n > 0 then
    raise exception 'BOB-50: % unsigned certificate(s) from an Uji Cepat exist; this migration refuses to apply. FOR YAZID: decide what happens to them before QUICK stops certifying (D-082(d))', n;
  end if;
end $$;

-- ═══════════════════════════════════════════════════════════ (1) the policy
update public.mode_policy
   set certifies = false,
       note = 'educator-launched over the same engine; evidence is ordinary evidence; a single Uji Cepat never certifies (D-082(d))'
 where mode = 'QUICK';

select public.audit_write('mode_policy.changed', 'mode_policy', 'QUICK', null,
  jsonb_build_object('certifies', jsonb_build_object('from', true, 'to', false), 'decision', 'D-082(d)', 'ticket', 'BOB-50'));

-- ═══════════════════════════════════════════════════════════ (2) the lint
-- Derived from pg_enum, so a tenth mode fails the build rather than defaulting.
create or replace function public.assert_mode_policy_complete()
returns table (ok boolean, detail text)
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare bad text; problems text[] := '{}'; n int;
begin
  select string_agg(e.enumlabel::text, ', ' order by e.enumsortorder) into bad
    from pg_enum e join pg_type t on t.oid = e.enumtypid
   where t.typname = 'assessment_mode'
     and not exists (select 1 from public.mode_policy m where m.mode::text = e.enumlabel::text);
  if bad is not null then problems := problems || ('mode(s) with no policy row: ' || bad); end if;

  -- a mode that certifies must be a formal stage: practice never certifies,
  -- a diagnostic pre-test is a starting point, not an achievement (§8), and a
  -- single Uji Cepat shows the class's understanding now (D-082(d))
  select string_agg(m.mode::text, ', ') into bad from public.mode_policy m
   where m.certifies and m.mode::text in ('PRE_TEST','PRACTICE','PUBLIC_DEMO','QUICK');
  if bad is not null then problems := problems || ('mode(s) certifying that must not: ' || bad); end if;

  -- EXAM tier is reachable only from EXAM and PAPER
  select string_agg(m.mode::text, ', ') into bad from public.mode_policy m
   where m.max_bank_tier = 'EXAM' and m.mode::text not in ('EXAM','PAPER');
  if bad is not null then problems := problems || ('mode(s) reaching the EXAM bank tier (INV-12): ' || bad); end if;

  -- an exam offers no assistance
  if exists (select 1 from public.mode_policy where mode::text = 'EXAM' and allows_assistance) then
    problems := problems || 'EXAM allows assistance'::text;
  end if;

  select count(*) into n from public.mode_policy;
  ok := array_length(problems, 1) is null;
  detail := case when ok then format('%s mode(s), every enum label carries a policy; no non-formal mode certifies (a single Uji Cepat included); the EXAM tier is reachable only from EXAM and PAPER', n)
                 else array_to_string(problems, '; ') end;
  return next;
end $$;
revoke all on function public.assert_mode_policy_complete() from public, anon, authenticated;

-- ═══════════════════════════════════════════════════ terminal verification
do $$
declare v_ok boolean; v_detail text;
begin
  if (select certifies from public.mode_policy where mode = 'QUICK') then
    raise exception 'BOB-50: QUICK still certifies';
  end if;
  if not (select certifies from public.mode_policy where mode = 'POST_TEST') then
    raise exception 'BOB-50: the cycle''s Uji Penguasaan no longer certifies';
  end if;
  select a.ok, a.detail into v_ok, v_detail from public.assert_mode_policy_complete() a;
  if not v_ok then raise exception 'BOB-50: the mode policy lint fails: %', v_detail; end if;
end $$;
