-- bob04-15 — C1w F-1 ROW 5 UNDONE. The item statistics (the source of item.correctness_rate) count an answer correct by
-- the SEALED key again. RESTATED (Z D-1, 20270123100000): rightness is grade_kunci against the key in force, falling back
-- to the item's own key; the plant drops the key in force, so the sealed key decides again.
do $$
declare v text := pg_get_viewdef('public.service_item_statistics'::regclass);
        v_in text := 'COALESCE(kb.kunci, ARRAY(';
begin
  if (length(v) - length(replace(v, v_in, ''))) / length(v_in) <> 1 then raise exception 'bob04-15: the item statistics do not count by the key in force where they did'; end if;
  execute 'create or replace view public.service_item_statistics as ' || replace(v, v_in, 'COALESCE(NULL::text[], ARRAY(');
end $$;
