-- CI-2 F-4 (Sharon's (c), CI-2-PREBUILD-918ed195.md): the staging counts, read only, BEFORE and AFTER the promotion.
-- Expected BEFORE: banned = accounts_of_locked_persons, banned_but_not_locked = 0.
-- Expected AFTER:  banned = 0; accounts_of_locked_persons unchanged; live_refresh_tokens_of_locked = 0.
-- The migration's own write is bounded to exactly the accounts of locked persons it reads first (it raises otherwise).
begin transaction read only;
select count(*) filter (where u.banned_until is not null)                       as banned,
       count(*) filter (where public.orang_ditangguhkan(a.person_id))           as accounts_of_locked_persons,
       count(*) filter (where u.banned_until is not null and not public.orang_ditangguhkan(a.person_id)) as banned_but_not_locked,
       (select count(*) from auth.refresh_tokens t join public.accounts a2 on a2.auth_user_id::text = t.user_id::text
         where t.revoked is not true and public.orang_ditangguhkan(a2.person_id)) as live_refresh_tokens_of_locked
  from public.accounts a join auth.users u on u.id = a.auth_user_id;
rollback;
