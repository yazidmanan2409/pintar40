-- A2b, commit 4 · the status read says whether a window stops the reader as a person or only their work in a place,
-- names the place, and gives the school's zone (A2B-COMPLETION.md rows 9 and 10; THE PLAN §5.3 D8; R-1). DRAFT.
--
-- pintar_status_saya, per window, adds:
--   * 'cakupan': ORANG (person-level: an EMERGENCY, or a platform-wide PLANNED window; the client may redirect) or
--     TEMPAT (work-scoped: a class or school PLANNED window; the client shows the banner and never redirects);
--   * 'kelas' for a class window of either kind (was EMERGENCY only), and 'kelas_lain' likewise;
--   * 'sekolah': the school's name for a school or class window;
--   * 'zona': the zone the window's times are shown in. A school or class window: its school's. A platform-wide window:
--     the reader's own school (their active enrolment's, else their role's), as D8 rules. Stored instants are UTC.
-- The windows listed are unchanged: those that reach the reader (maintenance_affects), so a work-scoped window is
-- listed for the people with work in its place. 'terhenti' stays the request hook's own answer.

create or replace function pg_temp.a2b_ganti(p_fn regprocedure, p_old text, p_new text) returns void
language plpgsql as $$
declare v text := pg_get_functiondef(p_fn); n int;
begin
  n := (length(v) - length(replace(v, p_old, ''))) / greatest(length(p_old), 1);
  if n <> 1 then raise exception 'A2b: % has its anchor % time(s), not once', p_fn, n; end if;
  execute replace(v, p_old, p_new);
end $$;

/** the reader's own school's zone: their active enrolment's school, else their role's, else the default */
create function public.zona_saya(p_person uuid) returns text
language sql stable security definer set search_path = public, pg_temp as $$
  select public.zona_sekolah(coalesce(
    (select e.institution_id from public.enrollments e where e.person_id = p_person and e.status = 'ACTIVE'
      order by e.created_at desc limit 1),
    (select ra.institution_id from public.role_assignments ra
      where ra.person_id = p_person and ra.revoked_at is null and ra.institution_id is not null
        and now() >= ra.valid_from and now() < ra.valid_until order by ra.created_at desc limit 1)))
$$;
revoke all on function public.zona_saya(uuid) from public, anon, authenticated, service_role;

do $$
begin
  perform pg_temp.a2b_ganti('public.pintar_status_saya()',
    E'''mulai'', w.starts_at, ''selesai'', w.ends_at, ''pesan'', w.message,\n',
    E'''mulai'', w.starts_at, ''selesai'', w.ends_at, ''pesan'', w.message,\n'
    || E'           -- A2b (R-1): who the window stops, the place, the zone (D8)\n'
    || E'           ''cakupan'', case when w.kind = ''EMERGENCY'' or w.platform then ''ORANG'' else ''TEMPAT'' end,\n'
    || E'           ''sekolah'', case when not w.platform then (select i.name from public.institutions i where i.id = w.institution_ids[1]) end,\n'
    || E'           ''zona'', case when w.platform then public.zona_saya(v_me) else public.zona_sekolah(w.institution_ids[1]) end,\n');
  perform pg_temp.a2b_ganti('public.pintar_status_saya()',
    E'''kelas'', case when w.kind = ''EMERGENCY'' and cardinality(w.node_ids) > 0 then',
    E'''kelas'', case when cardinality(w.node_ids) > 0 then');
  perform pg_temp.a2b_ganti('public.pintar_status_saya()',
    E'''kelas_lain'', w.kind = ''EMERGENCY'' and cardinality(w.node_ids) > 0 and (',
    E'''kelas_lain'', cardinality(w.node_ids) > 0 and (');
end $$;

do $$
declare v text := pg_get_functiondef('public.pintar_status_saya()'::regprocedure);
begin
  if position('''cakupan''' in v) = 0 or position('''zona''' in v) = 0
     or has_function_privilege('authenticated', 'public.zona_saya(uuid)'::regprocedure, 'execute') then
    raise exception 'A2b commit 4: the status read does not say who a window stops or its zone, or zona_saya is open to a client';
  end if;
end $$;
