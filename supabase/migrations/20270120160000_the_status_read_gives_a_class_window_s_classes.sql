-- A2b, commit 5 (its database part) · the status read gives a class window's class ids, so the banner shows on the
-- class's own pages and on no other class's (Daisy, A2B-C2W-KATA.md §2, D8-1: «nothing on another class's page»).
-- DRAFT.
--
-- pintar_status_saya, per window, adds 'kelas_id': the window's node_ids for a class window, null otherwise. The names
-- ('kelas') are already there; the ids are what a page's own route carries (/mengajar/{kelas}).

create or replace function pg_temp.a2b_ganti(p_fn regprocedure, p_old text, p_new text) returns void
language plpgsql as $$
declare v text := pg_get_functiondef(p_fn); n int;
begin
  n := (length(v) - length(replace(v, p_old, ''))) / greatest(length(p_old), 1);
  if n <> 1 then raise exception 'A2b: % has its anchor % time(s), not once', p_fn, n; end if;
  execute replace(v, p_old, p_new);
end $$;

do $$
begin
  perform pg_temp.a2b_ganti('public.pintar_status_saya()',
    E'           ''cakupan'', case when w.kind = ''EMERGENCY'' or w.platform then ''ORANG'' else ''TEMPAT'' end,\n',
    E'           ''cakupan'', case when w.kind = ''EMERGENCY'' or w.platform then ''ORANG'' else ''TEMPAT'' end,\n'
    || E'           ''kelas_id'', case when cardinality(w.node_ids) > 0 then to_jsonb(w.node_ids) end,\n');
end $$;

do $$
begin
  if position('''kelas_id''' in pg_get_functiondef('public.pintar_status_saya()'::regprocedure)) = 0 then
    raise exception 'A2b commit 5: the status read does not give a class window''s class ids';
  end if;
end $$;
