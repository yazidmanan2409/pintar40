-- Ruling 79's audit world (track 3c), fixture W12-plafon (J6's «the provider ceiling»): the platform-wide AI stop, as
-- the operator sets it (C3w-1: no client role writes ai_plafon_platform; there is no screen for it). Every AI request
-- is refused AI_PLAFON until w12-plafon-lepas. Captures labelled «keadaan operator: plafon platform dihentikan».
do $$ begin perform set_config('app.seed_intent', 'synthetic', true); end $$;
do $$
begin
  perform dunia.jaga();
  update public.ai_plafon_platform set berhenti = true;
  if not found then raise exception 'W12-plafon: no platform ceiling row'; end if;
  raise notice 'dunia: W12-plafon (the platform AI stop is on)';
end $$;
