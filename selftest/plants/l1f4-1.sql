-- l1f4-1 — L1-F4's REGISTRY OUTGROWN. A table added later with a foreign key to persons(id), and no row saying whether
-- an insert into it attaches a person: the enumeration test must go red, naming it.
create table public.l1f4_tanam (id uuid primary key default gen_random_uuid(), orang uuid references public.persons(id));
