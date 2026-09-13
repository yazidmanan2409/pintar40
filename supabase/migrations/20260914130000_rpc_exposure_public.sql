-- 0047 — a fourth exposure class: PUBLIC.
--
-- WHY THIS IS ITS OWN MIGRATION. `alter type ... add value` commits the label
-- but cannot use it in the same transaction. 0038 hit this for
-- `assessment_mode` and the answer is the same: add the label here, use it in
-- 0048. Nothing else belongs in this file.
--
-- WHY THE LABEL EXISTS AT ALL. FABLE-04 §9: the public verification route
-- reads through a SECURITY DEFINER projection function registered in
-- `client_rpc_registry`, and `anon` gets no table grant. Registering an
-- anon-executable function against `LEARNER`, `STAFF` or `PLATFORM` would be a
-- lie about who can reach it -- and the governing rule for this phase is that
-- a grant is an exposure decision, not migration boilerplate. An anonymous
-- caller is a distinct principal and gets a distinct class.
--
-- WHAT PUBLIC MEANS, precisely, so the next builder does not widen it:
--   * executable by `anon` -- i.e. by anybody on the internet holding the
--     publishable key, with no session and no identity;
--   * therefore it may take NO identity-bearing argument and may return NO
--     personal data, and its projection is a closed allow-list asserted by
--     equality in `assert_public_surface()`;
--   * and every member of the class is named in `public_surface_registry`,
--     counted by the lint, and asserted both ways. The class is not a licence;
--     it is the place where an exposure has to be argued in writing.
alter type public.rpc_exposure add value if not exists 'PUBLIC';

do $$
declare n int;
begin
  select count(*) into n from pg_enum e
    join pg_type t on t.oid = e.enumtypid
   where t.typname = 'rpc_exposure' and e.enumlabel = 'PUBLIC';
  if n <> 1 then
    raise exception 'rpc_exposure does not carry the PUBLIC label (%)', n;
  end if;
  select count(*) into n from pg_enum e
    join pg_type t on t.oid = e.enumtypid where t.typname = 'rpc_exposure';
  if n <> 4 then
    raise exception 'rpc_exposure should now carry exactly 4 labels, found %', n;
  end if;
end $$;
