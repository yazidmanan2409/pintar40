-- A2a, change C · the pause page names the class a stop holds (Daisy, A2-KATA-DESAIN.md A3; her early review of the
-- first screenshots, A2A-LAYAR-f308b0bf.md §1, blockers 1 and 2). DRAFT.
--
-- The status read (pintar_status_saya) answers, for each window that stops the reader, two more facts:
--   kelas       the names of the classes an EMERGENCY class stop holds (null for a school or platform stop), for the
--               title «PINTAR dihentikan sementara untuk kelas {kelas}» and the class form of the explanation;
--   kelas_lain  whether the reader also has another class or another school (a live placement, or a role, outside the
--               stopped classes), for Daisy's line «Karena Anda ada di kelas ini, PINTAR juga tidak dapat Anda pakai di
--               kelas lain sampai penghentian diakhiri.», shown only where true.
-- Nothing is disclosed: the classes named are the reader's own stopped classes' window, and the reader is stopped by it.

do $$
declare v text := pg_get_functiondef('public.pintar_status_saya()'::regprocedure);
        v_old text := E'''menguasai'', public.maintenance_controls(w),';
        n int;
begin
  n := (length(v) - length(replace(v, v_old, ''))) / length(v_old);
  if n <> 1 then raise exception 'A2a: pintar_status_saya has its anchor % time(s), not once', n; end if;
  execute replace(v, v_old,
       E'''kelas'', case when w.kind = ''EMERGENCY'' and cardinality(w.node_ids) > 0 then\n'
    || E'             (select to_jsonb(array_agg(n.name order by n.name)) from public.org_nodes n where n.id = any (w.node_ids)) end,\n'
    || E'           ''kelas_lain'', w.kind = ''EMERGENCY'' and cardinality(w.node_ids) > 0 and (\n'
    || E'             exists (select 1 from public.enrollments e join public.memberships m on m.enrollment_id = e.id and m.valid_to is null\n'
    || E'                      join public.org_nodes mn on mn.id = m.node_id and mn.kind = ''CLASS''\n'
    || E'                     where e.person_id = v_me and e.status in (''PENDING'', ''ACTIVE'') and not (m.node_id = any (w.node_ids)))\n'
    || E'             or exists (select 1 from public.role_assignments ra join public.org_nodes sn on sn.id = ra.scope_node_id\n'
    || E'                         where ra.person_id = v_me and ra.revoked_at is null and now() >= ra.valid_from and now() < ra.valid_until\n'
    || E'                           and not (sn.id = any (w.node_ids) or sn.jalur && w.node_ids))),\n'
    || E'           ' || v_old);
end $$;

do $$
begin
  if position('kelas_lain' in pg_get_functiondef('public.pintar_status_saya()'::regprocedure)) = 0 then
    raise exception 'A2a: the status read does not say whether the reader has another class';
  end if;
end $$;
