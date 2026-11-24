-- Ruling 79's audit world (track 3c), fixture W12-plafon-lepas: the platform-wide AI stop lifted again (the operator).
do $$ begin perform set_config('app.seed_intent', 'synthetic', true); end $$;
do $$
begin
  perform dunia.jaga();
  update public.ai_plafon_platform set berhenti = false;
  if not found then raise exception 'W12-plafon-lepas: no platform ceiling row'; end if;
  raise notice 'dunia: W12-plafon-lepas (the platform AI stop is off)';
end $$;
