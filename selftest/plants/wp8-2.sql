-- wp8-2 — THE SAME DEFECT BY A DIFFERENT DOOR. A new invoker-rights trigger
-- on a table clients write, calling a function clients may not execute. This
-- is how the class of defect recurs: somebody adds a guard and the grant is
-- nobody's job. The standing assertion must see it.
create function public.wp8_plant_guard() returns trigger
language plpgsql set search_path = public, pg_temp as $f$
begin
  perform count(*) from public.excluded_items_for_post_test(new.institution_id, new.institution_id);
  return new;
end $f$;
create trigger wp8_plant_guard before insert on public.feature_flags
  for each row execute function public.wp8_plant_guard();
