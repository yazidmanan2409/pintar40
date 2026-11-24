-- d2r-15 — THE CAPTURE TAKES ANY SHAPE (§7.2 (c)). The CHECK's predicate accepts any object, a fifth key included.
create or replace function public.kebijakan_bantuan_sah(p jsonb) returns boolean
language sql immutable set search_path = public, pg_temp as $$ select jsonb_typeof(p) = 'object' $$;
