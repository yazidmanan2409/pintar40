-- bob04-17 — F1-R1b UNDONE. The confirming act writes the corrected key and leaves the explanations authored for the old
-- key: the stale rationale and misconception code stay on the corrected copy.
do $$
declare v text := pg_get_functiondef('public.tegaskan_koreksi_kunci(uuid)'::regprocedure);
        a int := position('  update public.key_corrections set penjelasan_dihapus = (' in v);
        b int := position(E'   where item_id = v_t2;\n' in v);
begin
  if a = 0 or b = 0 or b < a then raise exception 'bob04-17: tegaskan_koreksi_kunci does not withdraw where it did'; end if;
  execute substr(v, 1, a - 1) || E'  update public.item_options set is_correct = (label = any (k.key_after)) where item_id = v_t2;\n'
          || substr(v, b + length(E'   where item_id = v_t2;\n'));
end $$;
