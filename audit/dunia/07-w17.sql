-- Ruling 79's audit world (track 3c), part 7: W17 (J10), an account closed at its owner's request.
--
--   W17  Puspa Anggraini, a former teacher at SMP Cendekia, by email: closed her own account (minta_akun('CLOSE', true),
--        as herself), so J10's reopening request has a closed account to ask about.
--        A STAFF account: next-base refuses a learner's own closing request («a learner's request is made through the
--        school with the family», ACCOUNT_LEARNER_VIA_SCHOOL), so the owner who closes is a member of staff.

do $$ begin perform set_config('app.seed_intent', 'synthetic', true); end $$;

do $$
begin
  perform dunia.jaga();
  perform dunia.staf('w17.akun', 'puspa.anggraini@dunia.pintar.test', 'Sintetis-PuspaA-91!', 'Puspa Anggraini', null, null);
  perform dunia.sebagai('w17.akun');
  perform public.minta_akun('CLOSE', true);
  perform dunia.sebagai(null);
  if not exists (select 1 from public.person_suspensions s
                  where s.person_id = ((dunia.ambil('w17.akun'))::jsonb ->> 'person')::uuid
                    and s.category = 'CLOSED_AT_REQUEST' and s.ended_at is null) then
    raise exception 'W17: the account was not closed';
  end if;
  raise notice 'dunia: W17 (Puspa, closed at her own request)';
end $$;
