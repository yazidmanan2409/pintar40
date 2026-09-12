-- build_sha_from_request (FABLE-01 §8, INV-18): every audit row carries the
-- commit SHA of the running build. Over PostgREST each request is its own
-- transaction, so the app server sends the SHA as a request header
-- (`x-pintar-build`) and the audit writer reads it from PostgREST's
-- `request.headers` GUC when the direct `app.build_sha` setting is absent
-- (psql/management-channel callers may still set `app.build_sha`).
-- The value is provenance, not authority: it is shape-validated and only
-- ever stamps the rows the same request produces.

create or replace function public.audit_write(
  p_action text, p_target_table text, p_target_id text,
  p_institution_id uuid, p_summary jsonb default '{}'::jsonb
) returns bigint
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_id bigint; v_person uuid; v_sha text;
begin
  begin
    select a.person_id into v_person from public.accounts a where a.auth_user_id = auth.uid();
  exception when undefined_table then v_person := null; end;

  v_sha := nullif(current_setting('app.build_sha', true), '');
  if v_sha is null then
    begin
      v_sha := nullif(current_setting('request.headers', true), '')::jsonb ->> 'x-pintar-build';
    exception when others then v_sha := null; end;
  end if;
  if v_sha !~ '^[0-9a-f]{7,40}$' then v_sha := null; end if;

  insert into public.audit_log (actor_auth_uid, actor_person_id, action, target_table, target_id, institution_id, summary, build_sha)
  values (auth.uid(), v_person, p_action, p_target_table, p_target_id, p_institution_id, coalesce(p_summary,'{}'::jsonb), v_sha)
  returning id into v_id;
  return v_id;
end $$;
revoke all on function public.audit_write(text,text,text,uuid,jsonb) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Verification (fails the migration on any violation)
-- ---------------------------------------------------------------------------
do $$
declare n int; v bigint; sha text; bad text;
begin
  -- privileges unchanged: nobody but the owner may call the writer
  if has_function_privilege('anon', 'public.audit_write(text,text,text,uuid,jsonb)', 'execute')
     or has_function_privilege('authenticated', 'public.audit_write(text,text,text,uuid,jsonb)', 'execute') then
    raise exception 'audit_write became executable by a client role';
  end if;
  select count(*) into n from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and p.prosecdef
     and not exists (select 1 from unnest(coalesce(p.proconfig,'{}')) c where c like 'search_path=%');
  if n > 0 then raise exception '% SECURITY DEFINER function(s) without pinned search_path', n; end if;

  -- functional probe inside a rolled-back sub-block: header captured, garbage rejected
  perform set_config('app.build_sha', '', true);
  perform set_config('request.headers', '{"x-pintar-build":"deadbeef01"}', true);
  begin
    v := public.audit_write('selfcheck.build_sha', 'audit_log', null, null, '{}'::jsonb);
    select build_sha into sha from public.audit_log where id = v;
    if sha is distinct from 'deadbeef01' then raise exception 'build_sha not captured from request header: %', coalesce(sha,'null'); end if;
    perform set_config('request.headers', '{"x-pintar-build":"<script>"}', true);
    v := public.audit_write('selfcheck.build_sha', 'audit_log', null, null, '{}'::jsonb);
    select build_sha into bad from public.audit_log where id = v;
    if bad is not null then raise exception 'malformed build header was stored: %', bad; end if;
    raise exception 'ROLLBACK_PROBE';
  exception when others then
    if sqlerrm <> 'ROLLBACK_PROBE' then raise; end if;
  end;
  perform set_config('request.headers', '', true);
  if exists (select 1 from public.audit_log where action = 'selfcheck.build_sha') then
    raise exception 'probe rows were not rolled back';
  end if;
end $$;
