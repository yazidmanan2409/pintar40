-- bob04-15 — C1w F-1 ROW 5 UNDONE. The item statistics (the source of item.correctness_rate) count an answer correct by
-- the SEALED key again.
do $$
declare v text := pg_get_viewdef('public.service_item_statistics'::regclass);
        v_in text := 'COALESCE((o.label = ANY (kb.kunci)), o.is_correct)';
begin
  if (length(v) - length(replace(v, v_in, ''))) / length(v_in) <> 2 then raise exception 'bob04-15: the item statistics do not count by the key in force where they did'; end if;
  execute 'create or replace view public.service_item_statistics as ' || replace(v, v_in, 'o.is_correct');
end $$;
