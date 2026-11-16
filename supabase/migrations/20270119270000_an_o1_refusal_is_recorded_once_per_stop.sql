-- A2a, change C · Sharon's note on commit 43 (A2A-C-43-0ea8ac0c.md): "repeated second calls can record the same refusal
-- more than once. Either dedupe per caller, target, code and window, or register it." DRAFT.
--
-- Deduped: catat_penolakan_henti writes a refusal once per caller, target, code and the stops in force over it; a
-- second call while the same refusal stands returns the first row's id and writes nothing. A new stop over the same
-- target (another set of windows) is a new row. Two calls at the same instant can each find no row and write one: the
-- second call is the screen's, once per refused act, so that needs two refused acts at once by one person on one target;
-- not prevented by a lock (the audit's readers count refusals by row, and two such acts are two refusals).

create or replace function pg_temp.a2a_ganti(p_fn regprocedure, p_old text, p_new text) returns void
language plpgsql as $$
declare v text := pg_get_functiondef(p_fn); n int;
begin
  n := (length(v) - length(replace(v, p_old, ''))) / greatest(length(p_old), 1);
  if n <> 1 then raise exception 'A2a N43: % has its anchor % time(s), not once', p_fn, n; end if;
  execute replace(v, p_old, p_new);
end $$;

do $$
begin
  perform pg_temp.a2a_ganti('public.catat_penolakan_henti(uuid,text)',
    E'k record; v_sesi uuid[]; v_aksi text; v_tabel text; v_inst uuid; v_ditahan integer;',
    E'k record; v_sesi uuid[]; v_aksi text; v_tabel text; v_inst uuid; v_ditahan integer; v_jendela jsonb; v_ada bigint;');
  perform pg_temp.a2a_ganti('public.catat_penolakan_henti(uuid,text)',
    E'  select count(distinct a.person_id) into v_ditahan from public.assessment_sessions a where a.id = any (v_sesi);\n'
    || E'  return public.audit_write(v_aksi, v_tabel, p_sasaran::text, v_inst,\n'
    || E'    jsonb_build_object(''refusal'', p_kode, ''held_sittings'', cardinality(v_sesi), ''held_learners'', v_ditahan,\n'
    || E'      ''windows'', coalesce((select jsonb_agg(w.id order by w.t_stop, w.id) from public.maintenance_windows w\n'
    || E'                            where w.kind = ''EMERGENCY'' and w.t_stop is not null and w.ended_at is null\n'
    || E'                              and exists (select 1 from public.assessment_sessions a where a.id = any (v_sesi)\n'
    || E'                                           and (a.darurat_jendela_id = w.id or w.platform\n'
    || E'                                                or public.maintenance_affects(w, a.person_id)))), ''[]''::jsonb),\n'
    || E'      ''actor_role'', public.audit_actor_role(v_inst)));\n',
    E'  select count(distinct a.person_id) into v_ditahan from public.assessment_sessions a where a.id = any (v_sesi);\n'
    || E'  v_jendela := coalesce((select jsonb_agg(w.id order by w.t_stop, w.id) from public.maintenance_windows w\n'
    || E'                          where w.kind = ''EMERGENCY'' and w.t_stop is not null and w.ended_at is null\n'
    || E'                            and exists (select 1 from public.assessment_sessions a where a.id = any (v_sesi)\n'
    || E'                                         and (a.darurat_jendela_id = w.id or w.platform\n'
    || E'                                              or public.maintenance_affects(w, a.person_id)))), ''[]''::jsonb);\n'
    || E'  -- Sharon''s note on commit 43: once per caller, target, code and the stops in force over it\n'
    || E'  select l.id into v_ada from public.audit_log l\n'
    || E'   where l.action = v_aksi and l.target_id = p_sasaran::text and l.actor_person_id = v_actor\n'
    || E'     and l.summary ->> ''refusal'' = p_kode and l.summary -> ''windows'' = v_jendela\n'
    || E'   order by l.id limit 1;\n'
    || E'  if v_ada is not null then return v_ada; end if;\n'
    || E'  return public.audit_write(v_aksi, v_tabel, p_sasaran::text, v_inst,\n'
    || E'    jsonb_build_object(''refusal'', p_kode, ''held_sittings'', cardinality(v_sesi), ''held_learners'', v_ditahan,\n'
    || E'      ''windows'', v_jendela, ''actor_role'', public.audit_actor_role(v_inst)));\n');
end $$;

do $$
begin
  if position('if v_ada is not null then return v_ada; end if;' in pg_get_functiondef('public.catat_penolakan_henti(uuid,text)'::regprocedure)) = 0
     or has_function_privilege('anon', 'public.catat_penolakan_henti(uuid, text)'::regprocedure, 'execute') then
    raise exception 'A2a N43: the refusal record is not deduped, or is open to anon';
  end if;
end $$;
