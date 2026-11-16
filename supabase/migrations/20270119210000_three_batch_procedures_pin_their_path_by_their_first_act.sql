-- A2a, change C · the three batch procedures pin their path by their first act: a declared exception, ENFORCED (Bob's
-- ruling on Second Eye's search_path question, option (1); Sharon's yes with two additions, (a) and (b) below). DRAFT.
--
-- PostgreSQL refuses a SET clause on a procedure that commits, and committing between batches is the approved design
-- (Sharon's C15 ruling). The platform lint (platform_schema_lint's functions_without_search_path, and the launch
-- readiness row "every function pins its search_path") counts every public function and procedure without a pinned
-- search_path. It keeps doing so: an EXACT list of three procedures is excused, and each is excused only while all of
-- these hold, checked from the catalogue every time the lint runs:
--   1. it is a procedure (prokind 'p');
--   2. it is not SECURITY DEFINER;
--   3. no EXECUTE for PUBLIC, anon, authenticated or service_role (pg_cron runs it as its owner);
--   4. its first act is set_config('search_path', 'public, pg_temp', false): the body's first statement, before any
--      commit (Sharon's (b));
--   5. every name of the public schema it uses is written schema-qualified (no public function called, and no public
--      relation read or written, by a bare name).
--   6. its owner is the cron job's user (postgres), the role every call runs as: set_config(..., false) is session-wide
--      and outlives the call, which is acceptable only because the sole callers are the cron job's own session and the
--      tests running as the owner (Sharon's (a); the post-promotion hosted reads 1 and 2 confirm it).
-- Any other unpinned function or procedure still counts, and a listed one that breaks a condition counts again.

create function public.jalur_dikecualikan() returns text[]
language sql immutable set search_path = public, pg_temp as $$
  select array['pengerjaan_tandai_darurat(integer)', 'pengerjaan_tutup_berkala(integer,integer)', 'pengerjaan_lepas_darurat_semua(integer)']
$$;
revoke all on function public.jalur_dikecualikan() from public, anon, authenticated, service_role;

/** Why a listed procedure is not (or no longer) excused; null when every condition holds. */
create function public.jalur_pengecualian_cacat(p_oid oid) returns text
language plpgsql stable set search_path = public, pg_temp as $$
declare p pg_proc; v_src text; v_nama text; r record;
begin
  select * into p from pg_proc where oid = p_oid;
  if p.oid is null then return 'missing'; end if;
  if p.oid::regprocedure::text not in (select unnest(public.jalur_dikecualikan())) then return 'not listed'; end if;
  if p.prokind <> 'p' then return 'not a procedure'; end if;
  if p.prosecdef then return 'SECURITY DEFINER'; end if;
  if pg_get_userbyid(p.proowner) <> coalesce(
       (select j.username from cron.job j where j.command ~* ('\mpublic\.' || p.proname || '\(') order by j.jobid limit 1), 'postgres') then
    return 'owned by ' || pg_get_userbyid(p.proowner) || ', not the cron job''s user';
  end if;
  if exists (select 1 from aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a where a.grantee = 0 and a.privilege_type = 'EXECUTE') then
    return 'EXECUTE for PUBLIC';
  end if;
  foreach v_nama in array array['anon', 'authenticated', 'service_role'] loop
    if has_function_privilege(v_nama, p.oid, 'EXECUTE') then return 'EXECUTE for ' || v_nama; end if;
  end loop;
  v_src := regexp_replace(p.prosrc, '--[^\n]*', '', 'g');
  if v_src !~* '^\s*(declare\s[\s\S]*?)?\mbegin\M\s*perform\s+set_config\(''search_path'', ''public, pg_temp'', false\);' then
    return 'its first act is not set_config(''search_path'', ''public, pg_temp'', false)';
  end if;
  for r in select f.proname as nama from pg_proc f join pg_namespace n on n.oid = f.pronamespace where n.nspname = 'public'
           union select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
            where n.nspname = 'public' and c.relkind in ('r', 'v', 'm', 'p', 'f', 'S') loop
    if v_src ~* ('(^|[^.[:alnum:]_])' || r.nama || '\s*\(') or v_src ~* ('\m(from|join|update|into|table)\s+' || r.nama || '\M') then
      return 'a bare name: ' || r.nama;
    end if;
  end loop;
  return null;
end $$;
revoke all on function public.jalur_pengecualian_cacat(oid) from public, anon, authenticated, service_role;

/** The public functions and procedures without a pinned search_path that are not an excused listed procedure. */
create function public.jalur_tanpa_pin() returns integer
language sql stable set search_path = public, pg_temp as $$
  select count(*)::integer from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
   where ns.nspname = 'public' and p.prokind in ('f', 'p')
     and not exists (select 1 from unnest(coalesce(p.proconfig, '{}')) c where c like 'search_path=%')
     and public.jalur_pengecualian_cacat(p.oid) is not null
$$;
revoke all on function public.jalur_tanpa_pin() from public, anon, authenticated, service_role;

-- the three procedures: the first act, and no EXECUTE but their owner's
do $$
declare v_sig text; v text;
begin
  foreach v_sig in array public.jalur_dikecualikan() loop
    v := pg_get_functiondef(('public.' || v_sig)::regprocedure);
    if position(E'\nAS $procedure$\ndeclare ' in v) = 0 or (length(v) - length(replace(v, E'\nbegin\n', ''))) / 7 < 1 then
      raise exception 'A2a search_path: % has no declare section and begin to anchor on', v_sig;
    end if;
    execute regexp_replace(v, E'\nbegin\n', E'\nbegin\n  perform set_config(''search_path'', ''public, pg_temp'', false);   -- the first act (pinned by hand: it commits)\n');
    execute format('revoke all on procedure public.%s from public, anon, authenticated, service_role', v_sig);
  end loop;
end $$;

-- the lint counts through the one rule
do $$
declare v text := pg_get_functiondef('public.platform_schema_lint()'::regprocedure);
        v_old text := E'where ns.nspname=''public'' and p.prokind in (''f'',''p'')\n     and not exists (select 1 from unnest(coalesce(p.proconfig,''{}'')) c where c like ''search_path=%'');\n  v := v || jsonb_build_object(''functions_without_search_path'', n);';
begin
  if (length(v) - length(replace(v, v_old, ''))) / length(v_old) <> 1 then
    raise exception 'A2a search_path: platform_schema_lint''s counter is not where it was';
  end if;
  execute replace(v, v_old, E'where ns.nspname=''public'' and p.prokind in (''f'',''p'')\n     and not exists (select 1 from unnest(coalesce(p.proconfig,''{}'')) c where c like ''search_path=%'')\n'
    || E'     and public.jalur_pengecualian_cacat(p.oid) is not null;   -- A2a: the three excused procedures, only while each condition holds\n'
    || E'  v := v || jsonb_build_object(''functions_without_search_path'', n);');
end $$;

do $$
begin
  if public.jalur_tanpa_pin() <> 0 then
    raise exception 'A2a search_path: % function(s) or procedure(s) unpinned and not excused', public.jalur_tanpa_pin();
  end if;
end $$;
