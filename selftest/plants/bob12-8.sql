-- bob12-8 — THE TABLE IS READABLE. A signed-in client can see which card keys were tried.
grant select on public.card_signin_cooldowns to authenticated;
