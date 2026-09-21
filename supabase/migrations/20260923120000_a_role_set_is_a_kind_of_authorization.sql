-- 0094 -- a fifth authorization kind: ROLE_SET.
--
-- WHY THIS IS ITS OWN MIGRATION. `alter type ... add value` commits the label
-- but cannot use it in the same transaction. 0038 hit this for
-- `assessment_mode` and 0047 for `rpc_exposure`; the answer is the same. Add
-- the label here, use it in 0095. Nothing else belongs in this file.
--
-- WHY THE LABEL EXISTS. The four kinds already declared answer "which
-- capability", "which rank floor", "system administrator only" and "which
-- guarded table". The Management individual-learner ruling is none of those:
-- it names an explicit SET of roles -- HEAD_OF_DEPARTMENT and DEAN -- and
-- denies INSTITUTION_ADMIN and SYSTEM_ADMIN, both of which outrank them.
--
-- SCOPE WOULD HAVE BEEN A LIE. `SCOPE / HEAD_OF_DEPARTMENT` declares
-- "rank >= HEAD_OF_DEPARTMENT", which reads INSTITUTION_ADMIN (rank 5) and
-- SYSTEM_ADMIN (rank 6) straight in. The declaration machinery would have
-- accepted it, `selftest.f06_negative_actor` would have drawn an EDUCATOR as
-- the negative actor, and the boundary the ruling is actually about -- that
-- administrative authority is not academic Management authority -- would never
-- have been probed.
--
-- CAPABILITY WOULD HAVE BEEN WORSE. It would mean granting DEAN a capability,
-- and F06-N02 probes the dean against EVERY capability endpoint and requires a
-- refusal, on the stated premise that a dean holds none. That test would then
-- demand the dean be refused the exact thing this ruling grants.
alter type public.rpc_authorization_kind add value if not exists 'ROLE_SET';

do $$
declare n int;
begin
  select count(*) into n from pg_enum e join pg_type t on t.oid = e.enumtypid
   where t.typname = 'rpc_authorization_kind' and e.enumlabel = 'ROLE_SET';
  if n <> 1 then
    raise exception 'rpc_authorization_kind does not carry the ROLE_SET label (%)', n;
  end if;
  raise notice '0094 verified: rpc_authorization_kind carries ROLE_SET, unused until 0095';
end $$;
