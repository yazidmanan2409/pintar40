-- Ruling 79's audit world (track 3c), fixture W10-pemulihan-berakhir (J10's PIN recovery, the time running out):
-- every live password-recovery grant expires now, between the PIN being accepted and the new password being saved
-- (gantiPasswordPemulihan: no permit → PEMULIHAN_BERAKHIR, «lupa.pin.berakhir»). Captures labelled «keadaan
-- fiksasi: izin pemulihan diakhiri».
do $$ begin perform set_config('app.seed_intent', 'synthetic', true); end $$;
do $$
declare n int;
begin
  perform dunia.jaga();
  update public.password_recovery_grants set expires_at = now() - interval '1 second' where expires_at > now();
  get diagnostics n = row_count;
  if n = 0 then raise exception 'W10-pemulihan-berakhir: no live recovery grant'; end if;
  raise notice 'dunia: W10-pemulihan-berakhir (% grant(s) expired)', n;
end $$;
