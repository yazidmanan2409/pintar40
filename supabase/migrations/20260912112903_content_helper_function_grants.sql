-- 0015 — FABLE-02: close the default PUBLIC execute grant on the content
-- helper functions introduced by 20260912112712.
--
-- Why this is a separate migration rather than an edit: the previous one is
-- already applied and recorded, and an applied migration is never edited
-- (doc 16 §2; the upgrade-path job byte-compares them).
--
-- Root cause: `create function` grants EXECUTE to PUBLIC by default, and
-- PUBLIC includes anon. The foundation migration's `alter default privileges`
-- was set `for role postgres`, but migrations apply under a different role, so
-- the default did not bite. can_in_institution() was revoked explicitly in the
-- same migration; these three IMMUTABLE helpers were not. INV-01/INV-36: anon
-- executes nothing in public.

revoke all on function public.hint_reveals_answer_shape(text)      from public, anon;
revoke all on function public.media_entries_have_transcripts(jsonb) from public, anon;
revoke all on function public.media_entries_are_storage_paths(jsonb) from public, anon;

-- They are called from CHECK constraints, which run as the inserting role, so
-- authenticated still needs EXECUTE.
grant execute on function public.hint_reveals_answer_shape(text)      to authenticated;
grant execute on function public.media_entries_have_transcripts(jsonb) to authenticated;
grant execute on function public.media_entries_are_storage_paths(jsonb) to authenticated;

do $$
declare n int; bad text;
begin
  select count(*), string_agg(p.proname, ', ')
    into n, bad
    from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
   where ns.nspname = 'public' and has_function_privilege('anon', p.oid, 'EXECUTE');
  if n > 0 then raise exception 'anon can execute % function(s) in public: %', n, bad; end if;

  -- authenticated retains what the CHECK constraints need
  if not has_function_privilege('authenticated', 'public.hint_reveals_answer_shape(text)', 'EXECUTE') then
    raise exception 'authenticated lost EXECUTE on the INV-02 hint predicate';
  end if;
  if not has_function_privilege('authenticated', 'public.media_entries_have_transcripts(jsonb)', 'EXECUTE')
     or not has_function_privilege('authenticated', 'public.media_entries_are_storage_paths(jsonb)', 'EXECUTE') then
    raise exception 'authenticated lost EXECUTE on a lesson media predicate';
  end if;
end $$;
