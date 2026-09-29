-- bob24-11 — A SIGNED-IN CLIENT CAN READ THE PIN TABLE. A select grant on person_pins.
grant select on table public.person_pins to authenticated;
